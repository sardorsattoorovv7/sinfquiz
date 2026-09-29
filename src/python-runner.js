// A fresh worker per run keeps student code away from the app DOM and session storage.
const LOAD_TIMEOUT=35000;
const RUN_TIMEOUT=6000;

export function runPythonIsolated(code,input='',{onStatus=()=>{},signal}={}){
 if(typeof code!=='string'||!code.trim()||code.length>8000)return Promise.reject(Error('1–8000 belgilik Python kodi kiriting.'));
 if(typeof input!=='string'||input.length>2000)return Promise.reject(Error('Kirish ma’lumoti 2000 belgidan oshmasin.'));
 if(signal?.aborted)return Promise.reject(Error('Ishga tushirish bekor qilindi.'));
 return new Promise((resolve,reject)=>{
  const id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
  let worker,timer,settled=false;
  const abort=()=>finish(Error('Ishga tushirish to‘xtatildi.'));
  const finish=(error,output)=>{
   if(settled)return;
   settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);worker?.terminate();
   error?reject(error):resolve(output);
  };
  try{worker=new Worker('/python-worker.mjs',{type:'module',name:'sinfquiz-python'})}
  catch{finish(Error('Brauzer Python muharririni ocholmadi. Brauzerni yangilang.'));return}
  worker.onerror=()=>finish(Error('Python muhiti ochilmadi. Saytni yangilab qayta urinib ko‘ring.'));
  worker.onmessageerror=()=>finish(Error('Python muhiti bilan aloqa uzildi. Qayta urinib ko‘ring.'));
  worker.onmessage=({data})=>{
   if(settled||data?.id!==id)return;
   if(data.kind==='loading'){onStatus('Python fayllari yuklanmoqda…');return}
   if(data.kind==='loaded'){
    clearTimeout(timer);onStatus('Kod bajarilmoqda…');
    timer=setTimeout(()=>finish(Error('Kod 6 soniyadan ortiq ishladi va to‘xtatildi.')),RUN_TIMEOUT);
   }
   if(data.kind==='result')finish(null,String(data.output||'').slice(0,12000));
   if(data.kind==='error')finish(Error(String(data.message||'Python kodi bajarilmadi.').slice(0,300)));
  };
  timer=setTimeout(()=>finish(Error('Python muhiti 35 soniyada ochilmadi. Qayta urinib ko‘ring yoki internetni tekshiring.')),LOAD_TIMEOUT);
  signal?.addEventListener('abort',abort,{once:true});
  worker.postMessage({kind:'run',id,code,input});
 });
}

export function downloadPython(code,name='sinfquiz-mashq'){
 const safe=String(name).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,64)||'sinfquiz-mashq';
 const url=URL.createObjectURL(new Blob([code],{type:'text/x-python;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=`${safe}.py`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
