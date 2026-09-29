export const PYTHON_DRAFT_TTL=52*60*60*1000;
const prefix='sq_python_draft_v1_';
const key=(owner,task)=>prefix+encodeURIComponent(String(owner).slice(0,100))+'_'+encodeURIComponent(String(task).slice(0,100));

export function readPythonDraft(owner,task,storage=globalThis.localStorage,now=Date.now()){
 try{
  const name=key(owner,task),raw=storage.getItem(name);
  if(!raw)return null;
  const value=JSON.parse(raw);
  if(!Number.isFinite(value.savedAt)||now-value.savedAt>=PYTHON_DRAFT_TTL||value.savedAt>now+60000){storage.removeItem(name);return null}
  if(typeof value.code!=='string'||value.code.length>8000)return null;
  return {code:value.code,input:String(value.input||'').slice(0,2000),output:String(value.output||'').slice(0,12000),savedAt:value.savedAt,expiresAt:value.savedAt+PYTHON_DRAFT_TTL};
 }catch{return null}
}

export function savePythonDraft(owner,task,{code='',input='',output=''},storage=globalThis.localStorage,now=Date.now()){
 try{
  if(typeof code!=='string'||code.length>8000)return false;
  storage.setItem(key(owner,task),JSON.stringify({code,input:String(input).slice(0,2000),output:String(output).slice(0,12000),savedAt:now}));
  return true;
 }catch{return false}
}

export function clearPythonDraft(owner,task,storage=globalThis.localStorage){try{storage.removeItem(key(owner,task))}catch{}}
