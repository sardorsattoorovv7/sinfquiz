import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {createPaymeHandler,createSpeakingBillingHandler,speakingBillingScope} from '../server/speaking-billing.js';
import {SpeakingStore} from '../server/speaking/store.js';

const sql=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const env={
 PAYME_MODE:'test',PAYME_MERCHANT_ID:'merchant-test',PAYME_MERCHANT_LOGIN:'Paycom',
 PAYME_MERCHANT_KEY:'local-fixture-password',PAYME_SITE_URL:'https://sinfquiz.example/',
};
const basic='Basic '+Buffer.from(env.PAYME_MERCHANT_LOGIN+':'+env.PAYME_MERCHANT_KEY).toString('base64');

async function request(handler,{method='POST',authorization,body}={}){
 const response={statusCode:200,setHeader(){},status(code){this.statusCode=code;return this;},json(data){this.data=data;}};
 await handler({method,headers:{authorization},body},response);
 return {status:response.statusCode,data:response.data};
}

test('Payme callback, purchase ownership, timed access and successful-analysis credits',async t=>{
 const db=new PGlite(),owner=randomUUID(),other=randomUUID(),admin=randomUUID();
 try{
  await db.exec(`
   create role anon;
   create role authenticated;
   create role service_role bypassrls;
   create schema auth;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
   create schema storage;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  `);
  await db.query('insert into auth.users values ($1),($2),($3)',[owner,other,admin]);
  await db.exec(sql('supabase-migration-7.46.sql'));
  await db.exec(sql('supabase-speaking-billing.sql'));
  await db.exec(sql('supabase-speaking-billing.sql'));

  async function rpc(name,args){
   assert.match(name,/^sq_[a-z_]+$/);
   const keys=Object.keys(args);
   assert.ok(keys.every(key=>/^p_[a-z_]+$/.test(key)));
   try{
    const {rows}=await db.query(`select to_jsonb(public.${name}(${keys.map((key,i)=>key+'=> $'+(i+1)).join(',')})) data`,Object.values(args));
    return {data:rows[0].data};
   }catch(error){return {error};}
  }
  const identities={
   owner:{id:owner,email:'student@example.test'},
   other:{id:other,email:'other@example.test'},
   admin:{id:admin,email:'admin@sinfquiz.uz'},
   impostor:{id:other,email:'admin@sinfquiz.uz'},
  };
  const client=()=>({
   rpc,auth:{getUser:async token=>({data:{user:identities[token]||null}})},
   from(name){
    assert.equal(name,'documents');
    return {
     select(){return this;},
     eq(column,value){if(column==='id')this.id=value;return this;},
     async maybeSingle(){return {data:{data:{role:this.id===admin?'admin':'student'}}};},
    };
   },
  });
  const buyer=createSpeakingBillingHandler({env,client}),payme=createPaymeHandler({env,client});
  const signed=(body,user='owner')=>request(buyer,{authorization:'Bearer '+user,body});
  const notify=(method,params,authorization=basic)=>request(payme,{authorization,body:{id:12,method,params}});
  const store=new SpeakingStore({rpc},{billingScope:'test'});
  const balance=async(user='owner',order=null)=>(await signed({action:'status',order},user)).data;
  async function content(kind='session',attemptKind='baseline'){
   return (await db.query('insert into sq_sp_records(user_id,kind,record_key,payload) values ($1,$2,$3,$4) returning id',
    [owner,kind,randomUUID(),JSON.stringify({attemptKind})])).rows[0].id;
  }
  let order;
  const receipt='provider-generated-txn';
  let time;

  await t.test('price stays server controlled and pending checkout can be resumed',async()=>{
   const disabled=await request(createSpeakingBillingHandler({env:{},client}),{method:'GET'});
   assert.deepEqual(disabled.data,{available:false,mode:null});
   const liveBuyer=createSpeakingBillingHandler({env:{...env,PAYME_MODE:'live'},client});
   assert.equal((await request(liveBuyer,{method:'GET'})).data.salesPaused,true);
   assert.equal((await request(liveBuyer,{authorization:'Bearer owner',body:{action:'order',plan:'plus'}})).status,503);
   assert.equal((await request(liveBuyer,{authorization:'Bearer owner',body:{action:'status'}})).status,200);
   assert.equal((await signed({action:'order',plan:'plus'},'guest')).status,401);
   const [first,replay]=await Promise.all([signed({action:'order',plan:'plus',amount:1}),signed({action:'order',plan:'plus'})]);
   assert.equal(first.status,200);
   assert.deepEqual(first.data,replay.data);
   order=first.data.orderId;
   const url=new URL(first.data.url);
   assert.equal(url.origin,'https://test.paycom.uz');
   const params=Buffer.from(url.pathname.slice(1),'base64').toString('utf8');
   assert.match(params,/;a=4500000;/);
   assert.ok(params.includes(';ac.order_id='+order+';'));
   assert.match(params,/https:\/\/sinfquiz\.example\/\?order=[a-f0-9-]+#tariflar$/);
   assert.equal((await balance('other',order)).order,null);
   assert.equal((await balance('owner',order)).order.status,'pending');
   assert.equal((await balance()).balances.length,1);
   await db.exec('set role authenticated');
   try{
    await assert.rejects(db.query('select * from sq_speaking_orders'),/permission denied/);
    await assert.rejects(db.query("select sq_speaking_billing_status($1,'test')",[owner]),/permission denied/);
   }finally{await db.exec('reset role');}
  });

  await t.test('only confirmed callbacks add one Plus pass',async()=>{
   time=Date.now();
   const payment={account:{order_id:order},amount:4500000,id:receipt,time};
   assert.equal((await notify('CreateTransaction',payment,'Basic invalid')).data.error.code,-32504);
   assert.equal((await notify('CreateTransaction',{...payment,amount:1})).data.error.code,-31001);
   assert.equal((await notify('CreateTransaction',{...payment,account:{order_id:randomUUID()}})).data.error.code,-31050);
   assert.equal((await notify('PerformTransaction',{id:receipt})).data.error.code,-31003);
   assert.deepEqual((await notify('CheckPerformTransaction',payment)).data.result,{allow:true});
   const created=await notify('CreateTransaction',payment);
   assert.equal(created.data.result.state,1);
   assert.deepEqual((await notify('CreateTransaction',payment)).data,created.data);
   assert.equal((await balance()).balances.length,1);
   const confirmed=await notify('PerformTransaction',{id:receipt});
   assert.equal(confirmed.data.result.state,2);
   assert.deepEqual((await notify('PerformTransaction',{id:receipt})).data,confirmed.data);
   const data=await balance('owner',order);
   assert.equal(data.order.status,'paid');
   assert.deepEqual(data.balances.map(({plan,full,short})=>({plan,full,short})),[
    {plan:'plus',full:4,short:12},{plan:'free',full:1,short:2},
   ]);
   assert.ok(Date.parse(data.balances[0].expiresAt)>Date.now()+29*86400000);
   const statement=await notify('GetStatement',{from:time,to:time});
   assert.equal(statement.data.result.transactions.length,1);
   assert.equal(statement.data.result.transactions[0].account.order_id,order);
   const live=await request(createPaymeHandler({env:{...env,PAYME_MODE:'live'},client}),{
    authorization:basic,body:{id:7,method:'CheckTransaction',params:{id:receipt}},
   });
   assert.equal(live.data.error.code,-31003);
  });

  await t.test('holds one credit per job and returns failed or cancelled attempts',async()=>{
   const target=await content(),create=()=>store.enqueue(owner,'assess',target,'exam:first');
   const [a,b]=await Promise.all([create(),create()]);
   assert.equal(a.id,b.id);
   assert.equal((await balance()).balances[0].full,3);
   await db.query("update sq_sp_jobs set status='failed' where id=$1",[a.id]);
   assert.equal((await balance()).balances[0].full,4);
   const table=()=>({select(){return this;},eq(_key,value){this.id??=value;return this;},async maybeSingle(){
    const {rows}=await db.query('select * from sq_sp_jobs where id=$1',[a.id]);
    return {data:rows[0]};
   }});
   store.db.from=table;
   const retry=await store.retry(owner,a.id);
   assert.equal(retry.id,a.id);
   assert.equal((await balance()).balances[0].full,3);
   await db.query("update sq_sp_jobs set status='completed' where id=$1",[a.id]);
   await db.query('delete from sq_sp_jobs where id=$1',[a.id]);
   assert.equal((await balance()).balances[0].full,3,'deleting report history cannot grant a new credit');
   const weekly=await store.enqueue(owner,'assess',await content('session','weekly_check'),'exam:mini');
   assert.equal((await balance()).balances[0].short,11);
   await db.query("update sq_sp_jobs set status='cancelled' where id=$1",[weekly.id]);
   assert.equal((await balance()).balances[0].short,12);
  });

  await t.test('cancellation revokes paid access and a free credit cannot be spent twice',async()=>{
   const cancelled=await notify('CancelTransaction',{id:receipt,reason:5});
   assert.equal(cancelled.data.result.state,-2);
   assert.deepEqual((await notify('CancelTransaction',{id:receipt,reason:5})).data,cancelled.data);
   assert.equal((await balance('owner',order)).order.status,'cancelled');
   assert.deepEqual((await balance()).balances.map(x=>x.plan),['free']);
   const results=await Promise.allSettled([
    store.enqueue(owner,'assess',await content(),'exam:free:a'),
    store.enqueue(owner,'assess',await content(),'exam:free:b'),
   ]);
   assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
   assert.equal(results.find(x=>x.status==='rejected').reason.code,'SPEAKING_CREDITS');
   assert.equal((await balance()).balances[0].full,0);
   await assert.rejects(store.assertCredits(owner,'full'),error=>error.code==='SPEAKING_CREDITS');
  });

  await t.test('a single purchase adds only one full analysis and expires independently',async()=>{
   const opened=await signed({action:'order',plan:'single'});
   assert.equal(opened.status,200);
   const orderId=opened.data.orderId,id='provider-generated-single';
   const params=Buffer.from(new URL(opened.data.url).pathname.slice(1),'base64').toString('utf8');
   assert.match(params,/;a=1500000;/);
   const payment={account:{order_id:orderId},amount:1500000,id,time:Date.now()};
   assert.equal((await notify('CreateTransaction',payment)).data.result.state,1);
   assert.equal((await notify('PerformTransaction',{id})).data.result.state,2);
   const paid=(await balance()).balances.find(bucket=>bucket.plan==='single');
   assert.deepEqual([paid.full,paid.short],[1,0]);
   await db.query("update sq_speaking_orders set expires_at=now()-interval '1 second' where id=$1",[orderId]);
   assert.deepEqual((await balance()).balances.map(bucket=>bucket.plan),['free']);
   assert.equal((await balance('owner',orderId)).order.status,'paid');
  });

  await t.test('card transfers can only be confirmed once by the administrator for the matching account',async()=>{
   const transferEnv={...env,SPEAKING_TRANSFER_MODE:'test',SPEAKING_TRANSFER_CARD:'4111111111111111',
    SPEAKING_TRANSFER_RECIPIENT:'Sinov hisobi',SPEAKING_TRANSFER_TELEGRAM:'fixture_receipts'};
   assert.equal(speakingBillingScope({...transferEnv,SPEAKING_TRANSFER_MODE:'live'}),'live');
   const handler=createSpeakingBillingHandler({env:transferEnv,client});
   assert.deepEqual((await request(handler,{method:'GET'})).data,{available:true,mode:'test',method:'transfer'});
   const send=(body,user='owner')=>request(handler,{authorization:'Bearer '+user,body});
   const [opened,reopened]=await Promise.all([
    send({action:'order',plan:'plus',amount:1}),send({action:'order',plan:'plus'}),
   ]);
   assert.equal(opened.status,200);
   assert.deepEqual(opened.data,reopened.data);
   assert.equal(opened.data.method,'transfer');
   const orderId=opened.data.orderId;
   const single=(await send({action:'order',plan:'single'})).data.orderId;
   const foreign=(await send({action:'order',plan:'plus'},'other')).data.orderId;
   const pending=(await send({action:'status',order:orderId})).data;
   assert.deepEqual(pending.order,{id:orderId,plan:'plus',method:'transfer',amount:4500000,status:'pending'});
   assert.equal(pending.payment.card,'4111 1111 1111 1111');
   assert.equal((await send({action:'status',order:orderId},'other')).data.payment,undefined);
   assert.equal((await send({action:'status',order:orderId},'other')).data.order,null);
   assert.ok(!pending.balances.some(bucket=>bucket.plan==='plus'));
   const paymeLookup=await notify('CheckPerformTransaction',{account:{order_id:orderId},amount:4500000});
   assert.equal(paymeLookup.data.error.code,-31050);

   const list={action:'transfer_admin_orders',userId:owner};
   assert.equal((await send(list)).status,403);
   assert.equal((await send(list,'impostor')).status,403);
   const adminOrders=(await send(list,'admin')).data.orders;
   assert.deepEqual(new Set(adminOrders.map(order=>order.id)),new Set([orderId,single]));
   assert.ok(adminOrders.every(order=>order.status==='pending'));
   const confirm={action:'transfer_approve',userId:owner,order:orderId,reference:'SQ-BANK.0103'};
   assert.equal((await send(confirm)).status,403);
   assert.equal((await send({...confirm,userId:other},'admin')).status,404);
   assert.equal((await send({...confirm,reference:'###'},'admin')).status,400);
   const [paid,replay]=await Promise.all([send(confirm,'admin'),send({...confirm,reference:'sq bank 0103'},'admin')]);
   assert.equal(paid.status,200);
   assert.deepEqual(replay.data,paid.data);
   assert.equal(paid.data.order.status,'paid');
   assert.ok(Date.parse(paid.data.order.expiresAt)>Date.now()+29*86400000);
   assert.equal((await send({...confirm,userId:other,order:foreign},'admin')).status,409);
   assert.equal((await send({...confirm,order:single},'admin')).status,409);
   const finished=(await send({action:'status',order:orderId})).data;
   assert.equal(finished.order.status,'paid');
   assert.equal(finished.payment,undefined);
   assert.deepEqual(finished.balances.filter(bucket=>bucket.plan==='plus').map(({full,short})=>[full,short]),[[4,12]]);
   assert.equal((await send({...confirm,order:single,reference:'BANK-0104'},'admin')).status,200);
   assert.deepEqual((await send({action:'status'})).data.balances
    .filter(bucket=>bucket.plan==='single').map(({full,short})=>[full,short]),[[1,0]]);
   const {rows:[audit]}=await db.query('select approved_by,bank_reference from public.sq_speaking_orders where id=$1',[orderId]);
   assert.deepEqual(audit,{approved_by:admin,bank_reference:'SQBANK0103'});
   await db.exec('set role authenticated');
   try{
    await assert.rejects(db.query("select sq_speaking_approve_transfer($1,$2,'test',$3,'FORGED')",[admin,owner,single]),/permission denied/);
   }finally{await db.exec('reset role');}
  });
 }finally{
  await db.close();
 }
});
