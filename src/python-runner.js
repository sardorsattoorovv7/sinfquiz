// The sandbox frame has an opaque origin. It runs a disposable Pyodide worker.
export function runPythonIsolated(code,input='',{onStatus=()=>{},signal}={}){
 if(typeof code!=='string'||!code.trim()||code.length>8000)return Promise.reject(Error('1–8000 belgilik Python kodi kiriting.'));
 if(typeof input!=='string'||input.length>2000)return Promise.reject(Error('Kirish ma’lumoti 2000 belgidan oshmasin.'));
 if(signal?.aborted)return Promise.reject(Error('Ishga tushirish bekor qilindi.'));
 return new Promise((resolve,reject)=>{
  const id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
  const frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-scripts');frame.referrerPolicy='no-referrer';frame.title='Ajratilgan Python muhiti';frame.setAttribute('aria-hidden','true');frame.style.display='none';
  let settled=false;
  const finish=(error,output)=>{if(settled)return;settled=true;clearTimeout(timer);window.removeEventListener('message',message);signal?.removeEventListener('abort',abort);frame.remove();error?reject(error):resolve(output)};
  const abort=()=>finish(Error('Ishga tushirish bekor qilindi.'));
  const message=event=>{
   if(event.source!==frame.contentWindow||event.data?.kind!=='sq-python')return;
   const data=event.data;
   if(data.kind==='ready'){
    onStatus('Python yuklanmoqda…');frame.contentWindow.postMessage({kind:'sq-python-run',id,code,input},'*');return;
   }
   if(data.id!==id)return;
   if(data.kind==='loaded')onStatus('Kod ishlayapti…');
   if(data.kind==='result')finish(null,String(data.output||'').slice(0,12000));
   if(data.kind==='error')finish(Error(String(data.message||'Ishga tushirishda xato.').slice(0,300)));
  };
  const timer=setTimeout(()=>finish(Error('Python muhiti javob bermadi. Internetni tekshiring.')),55000);
  window.addEventListener('message',message);
  signal?.addEventListener('abort',abort,{once:true});
  frame.src='/python-sandbox.html';document.body.appendChild(frame);
 });
}

export function downloadPython(code,name='sinfquiz-mashq.py'){
 const safe=String(name).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,64)||'sinfquiz-mashq';
 const url=URL.createObjectURL(new Blob([code],{type:'text/x-python;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=safe.endsWith('.py')?safe:`${safe}.py`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
