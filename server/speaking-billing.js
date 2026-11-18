import {timingSafeEqual} from 'node:crypto';
import {serverClient} from './speaking/store.js';
import {speakingProvider} from './speaking/provider.js';
import {speakingPlan} from '../src/billing/plans.js';

const endpoints={test:'https://test.paycom.uz',live:'https://checkout.paycom.uz'};
export const orderId = value => typeof value==='string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);

export function paymeConfig(env=process.env){
 const scope=env.PAYME_MODE,merchant=env.PAYME_MERCHANT_ID?.trim(),login=env.PAYME_MERCHANT_LOGIN?.trim(),key=env.PAYME_MERCHANT_KEY?.trim();
 if(!Object.hasOwn(endpoints,scope)||!/^[a-zA-Z0-9_-]{1,100}$/.test(merchant||'')||!login||login.includes(':')||!key)return null;
 try{
  const site=new URL(env.PAYME_SITE_URL);
  const loopback=scope==='test'&&site.protocol==='http:'&&['localhost','127.0.0.1'].includes(site.hostname);
  if((site.protocol!=='https:'&&!loopback)||site.username||site.password||site.pathname!=='/'||site.search||site.hash)return null;
  return {method:'payme',scope,merchant,login,key,site:site.origin,checkout:endpoints[scope]};
 }catch{return null;}
}

function transferConfig(env){
 const scope=env.SPEAKING_TRANSFER_MODE;
 const card=(env.SPEAKING_TRANSFER_CARD||'').replace(/\s/g,'');
 const recipient=env.SPEAKING_TRANSFER_RECIPIENT?.trim();
 const telegram=env.SPEAKING_TRANSFER_TELEGRAM?.trim();
 if(!Object.hasOwn(endpoints,scope)||!/^\d{16}$/.test(card)||!recipient||recipient.length>80||!/^[a-z0-9_]{5,32}$/i.test(telegram||''))return null;
 return {method:'transfer',scope,payment:{card:card.match(/.{4}/g).join(' '),recipient,telegram}};
}

const billingConfig=env=>transferConfig(env)||paymeConfig(env);
export const speakingBillingScope=(env=process.env)=>billingConfig(env)?.scope;

function checkoutUrl(config,order){
 const returnUrl=new URL('/#tariflar',config.site);
 returnUrl.searchParams.set('order',order.id);
 const receipt=`m=${config.merchant};ac.order_id=${order.id};a=${order.amount};l=uz;c=${returnUrl.href}`;
 return config.checkout+'/'+Buffer.from(receipt).toString('base64');
}

function authorizedPayme(config,header){
 if(!config||typeof header!=='string'||header.length>512)return false;
 const value=/^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(header)?.[1];
 if(!value)return false;
 const supplied=Buffer.from(value,'base64'),expected=Buffer.from(config.login+':'+config.key);
 return supplied.length===expected.length&&timingSafeEqual(expected,supplied);
}

function parseBody(raw){
 try{
  const body=typeof raw==='string'?JSON.parse(raw):raw;
  return body&&typeof body==='object'&&!Array.isArray(body)&&JSON.stringify(body).length<=8192?body:null;
 }catch{return null;}
}

const schemaMissing=error=>['42P01','42883','PGRST202','PGRST205'].includes(error?.code);
const salePaused='Speaking tahlili hali to‘liq sozlanmagan. Bepul mashqlar ochiq.';
const billingActions=new Set(['status','order','transfer_admin_orders','transfer_approve']);
const transferAdminActions=new Set(['transfer_admin_orders','transfer_approve']);
const transferErrors={
 TRANSFER_INPUT:[400,'Bank tarixidagi operatsiya raqamini tekshiring.'],
 TRANSFER_ORDER:[404,'Bu foydalanuvchiga tegishli buyurtma topilmadi.'],
 TRANSFER_DUPLICATE:[409,'Bu bank operatsiyasi boshqa buyurtmada ishlatilgan.'],
 TRANSFER_CLOSED:[409,'Bu buyurtma avval tasdiqlangan.'],
};

function liveSalesPaused(config,env){
 if(config?.scope!=='live')return false;
 try{speakingProvider(env);return false;}catch{return true;}
}

export function createSpeakingBillingHandler({env=process.env,client=serverClient}={}){
 return async function speakingBilling(req,res){
  res.setHeader('Cache-Control','no-store');
  const config=billingConfig(env),mode=config?.scope||null;
  const salesPaused=liveSalesPaused(config,env);
  if(req.method==='GET')return res.status(200).json({available:!!config,mode,...(config?{method:config.method}:{}),...(salesPaused?{salesPaused:true}:{})});
  if(req.method!=='POST')return res.status(405).json({error:'Bu amal mavjud emas.'});
  if(!config)return res.status(503).json({error:'To‘lov hozircha ochilmagan.'});
  const body=parseBody(req.body);
  if(!body||!billingActions.has(body.action))return res.status(400).json({error:'So‘rovni tekshiring.'});
  if(body.order!==undefined&&body.order!==null&&!orderId(body.order))return res.status(400).json({error:'Buyurtma raqami noto‘g‘ri.'});
  const plan=body.action==='order'?speakingPlan(body.plan):null;
  if(body.action==='order'&&!plan?.price)return res.status(400).json({error:'Tarifni tanlang.'});
  const token=/^Bearer (\S+)$/i.exec(req.headers?.authorization||'')?.[1];
  if(!token)return res.status(401).json({error:'Avval hisobga kiring.'});
  if(plan&&salesPaused)return res.status(503).json({error:salePaused});
  try{
   if(req.headers?.origin&&new URL(req.headers.origin).host!==req.headers.host){
    return res.status(403).json({error:'So‘rov manbasini tekshiring.'});
   }
   const db=client(env),identity=await db.auth.getUser(token),user=identity.data?.user;
   if(identity.error?.name==='AuthRetryableFetchError')throw identity.error;
   if(!user||identity.error||user.is_anonymous===true)return res.status(401).json({error:'Avval hisobga kiring.'});
   if(transferAdminActions.has(body.action))return await handleTransferAdmin({db,user,config,body,res});
   if(body.action==='status'){
    const status=await db.rpc('sq_speaking_billing_status',{p_user:user.id,p_scope:mode,p_order:body.order??null});
    if(status.error)throw status.error;
    if(config.method==='transfer'&&status.data?.order?.method==='transfer'&&status.data.order.status==='pending'){
     return res.status(200).json({...status.data,payment:config.payment});
    }
    return res.status(200).json(status.data);
   }
   const args={p_user:user.id,p_scope:mode,p_plan:plan.id,p_amount:plan.price*100};
   if(config.method==='transfer'){
    const order=await db.rpc('sq_speaking_open_purchase',{...args,p_method:'transfer'});
    if(order.error)throw order.error;
    return res.status(200).json({orderId:order.data.id,method:'transfer'});
   }
   const order=await db.rpc('sq_speaking_open_order',args);
   if(order.error)throw order.error;
   return res.status(200).json({orderId:order.data.id,url:checkoutUrl(config,order.data)});
  }catch(error){
   if(error.message==='BILLING_RATE')return res.status(429).json({error:'Buyurtmalar ko‘paydi. Bir daqiqadan keyin qayta urinib ko‘ring.'});
   if(Object.hasOwn(transferErrors,error.message)){
    const [code,message]=transferErrors[error.message];
    return res.status(code).json({error:message});
   }
   return res.status(503).json({error:schemaMissing(error)?'To‘lov xizmati tayyorlanmoqda.':'To‘lov bilan aloqa uzildi. Qayta urinib ko‘ring.'});
  }
 };
}

async function handleTransferAdmin({db,user,config,body,res}){
 if(user.email?.toLowerCase()!=='admin@sinfquiz.uz')return res.status(403).json({error:'Administrator ruxsati kerak.'});
 const profile=await db.from('documents').select('data').eq('collection','profiles').eq('id',user.id).maybeSingle();
 if(profile.error)throw profile.error;
 if(profile.data?.data?.role!=='admin')return res.status(403).json({error:'Administrator ruxsati kerak.'});
 if(config.method!=='transfer')return res.status(503).json({error:'Kartaga to‘lov hozircha sozlanmagan.'});
 if(!orderId(body.userId))return res.status(400).json({error:'Ro‘yxatdan foydalanuvchini tanlang.'});
 const args={p_user:body.userId,p_scope:config.scope};
 if(body.action==='transfer_admin_orders'){
  const orders=await db.rpc('sq_speaking_transfer_orders',args);
  if(orders.error)throw orders.error;
  return res.status(200).json({orders:orders.data});
 }
 if(!orderId(body.order)||typeof body.reference!=='string')return res.status(400).json({error:'Buyurtma va operatsiya raqamini kiriting.'});
 const order=await db.rpc('sq_speaking_approve_transfer',{
  ...args,p_admin:user.id,p_order:body.order,p_reference:body.reference,
 });
 if(order.error)throw order.error;
 return res.status(200).json({order:order.data});
}

const messages={
 '-32300':{uz:'POST so‘rovi kerak.',ru:'Требуется POST.',en:'POST required.'},
 '-32600':{uz:'So‘rov maydonlarini tekshiring.',ru:'Некорректный запрос.',en:'Invalid request.'},
 '-32601':{uz:'Usul topilmadi.',ru:'Метод не найден.',en:'Method not found.'},
 '-32504':{uz:'Ruxsat yetarli emas.',ru:'Недостаточно привилегий.',en:'Insufficient privileges.'},
 '-32400':{uz:'Vaqtinchalik tizim xatosi.',ru:'Временная ошибка системы.',en:'Temporary system error.'},
 '-31001':{uz:'To‘lov summasi noto‘g‘ri.',ru:'Неверная сумма.',en:'Incorrect amount.'},
 '-31003':{uz:'Tranzaksiya topilmadi.',ru:'Транзакция не найдена.',en:'Transaction not found.'},
 '-31008':{uz:'To‘lovni shu holatda bajarib bo‘lmaydi.',ru:'Невозможно выполнить операцию.',en:'Invalid transaction state.'},
 '-31050':{uz:'Buyurtma topilmadi.',ru:'Заказ не найден.',en:'Order not found.'},
};
const accountMethods=new Set(['CheckPerformTransaction','CreateTransaction']);
const transactionMethods=new Set(['CreateTransaction','PerformTransaction','CancelTransaction','CheckTransaction']);
const timestamp=value=>Number.isSafeInteger(value)&&value>0;

export function createPaymeHandler({env=process.env,client=serverClient}={}){
 return async function payme(req,res){
  res.setHeader('Cache-Control','no-store');
  const body=parseBody(req.body),id=typeof body?.id==='number'||typeof body?.id==='string'?body.id:null;
  const send=fields=>res.status(200).json({jsonrpc:'2.0',id,...fields});
  const fail=(code,data)=>send({error:{code,message:messages[code],...(data?{data}:{})}});
  if(req.method!=='POST')return fail(-32300);
  const config=paymeConfig(env);
  if(!authorizedPayme(config,req.headers?.authorization))return fail(-32504);
  const method=body?.method,params=body?.params;
  if(typeof method!=='string'||!params||typeof params!=='object'||Array.isArray(params))return fail(-32600);
  if(!accountMethods.has(method)&&!transactionMethods.has(method)&&method!=='GetStatement')return fail(-32601,'method');
  const args={p_scope:config.scope,p_method:method};
  if(accountMethods.has(method)){
   if(!orderId(params.account?.order_id))return fail(-31050,'order_id');
   if(!Number.isInteger(params.amount)||params.amount<=0||params.amount>2147483647)return fail(-31001);
   args.p_order=params.account.order_id;
   args.p_amount=params.amount;
  }
  if(transactionMethods.has(method)){
   if(typeof params.id!=='string'||!/^[-\w]{1,120}$/.test(params.id))return fail(-32600);
   args.p_id=params.id;
  }
  if(method==='CreateTransaction'){
   if(!timestamp(params.time))return fail(-32600);
   args.p_time=params.time;
  }
  if(method==='CancelTransaction'){
   if(!Number.isInteger(params.reason)||params.reason<0||params.reason>2147483647)return fail(-32600);
   args.p_reason=params.reason;
  }
  if(method==='GetStatement'){
   if(!timestamp(params.from)||!timestamp(params.to)||params.from>params.to)return fail(-32600);
   args.p_from=params.from;
   args.p_to=params.to;
  }
  try{
   const {data,error}=await client(env).rpc('sq_payme_transaction',args);
   if(error||!data)return fail(-32400);
   if(data.error)return fail(data.error,data.error===-31050?'order_id':undefined);
   return send({result:data});
  }catch{return fail(-32400);}
 };
}
