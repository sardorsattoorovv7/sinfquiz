// Loopback QA server only. Uses real Postgres RPCs/RLS in PGlite, not fabricated responses.
import {createServer} from 'vite';
import {competitionFixture,teacher,other,admin,students} from './competition-fixture.js';
export async function competitionHttp({port=4185,patched=true}={}){
 const f=await competitionFixture({patched}),allowed=new Set([teacher,other,admin,...students]),requests=[];
 const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port,hmr:false}});
 const handler=async(req,res,next)=>{
  const action=req.url.split('?')[0].slice(1),id=req.headers['x-fixture-user'];
  if(!allowed.has(id)){res.statusCode=401;res.end('{"error":"QA identity missing"}');return}
  const at=performance.now();let status=200,body={},result;
  try{
   let bytes=0,parts=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>24000)throw Error('Payload too large');parts.push(chunk)}
   body=JSON.parse(Buffer.concat(parts).toString()||'{}');
   const fn={list:['sq_comp_list',[]],catalog:['sq_comp_catalog',[]],state:['sq_comp_state',[body.id]],poll:['sq_comp_poll',[body.id,body.revision??-1]],member:['sq_comp_member',[body.id,body.userId,body.included]],save:['sq_comp_save',[body.config?.id,body.config]],join:['sq_comp_join',[body.code,body.name]],control:['sq_comp_control',[body.id,body.action,body.stage||0]],answer:['sq_comp_answer',[body.id,body.stageId,body.actionId,body.body]],leave:['sq_comp_leave',[body.id]]}[action];
   if(!fn)throw Error('Unknown operation');result=await f.call(id,...fn);if(result?.error)status=400;
  }catch(e){status=400;result={error:e.message}}
  const data=JSON.stringify(result);requests.push({action,uid:id,status,ms:performance.now()-at,bytes:Buffer.byteLength(data)});
  res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(data);
 };
 server.middlewares.stack.unshift({route:'/api/competitions',handle:handler});
 await server.listen();return {...f,server,requests,url:`http://127.0.0.1:${port}`,close:async()=>{await server.close();await f.db.close()}};
}
