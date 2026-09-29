/* This page is only embedded with sandbox="allow-scripts" (opaque origin).
   The code runs in a disposable worker; it never reaches the app's DOM or tokens. */
const PYODIDE_BASE='https://cdn.jsdelivr.net/pyodide/v0.29.4/full/';
const workerSource=`
import {loadPyodide} from '${PYODIDE_BASE}pyodide.mjs';
let pyodide;
self.onmessage=async ({data})=>{
 if(data?.kind!=='run')return;
 const {id,code,input}=data;
 try{
  pyodide=await loadPyodide({indexURL:'${PYODIDE_BASE}'});
  self.postMessage({kind:'loaded',id});
  let output='';
  const append=line=>{if(output.length<12000)output+=(String(line).slice(0,12000-output.length)+'\\n')};
  pyodide.setStdout({batched:append});
  pyodide.setStderr({batched:append});
  pyodide.globals.set('_sq_source',code);
  pyodide.globals.set('_sq_input_text',input);
  await pyodide.runPythonAsync(
    'import ast, builtins, traceback\\n'+
    '_sq_tree = ast.parse(_sq_source, filename="<oquvchi>")\\n'+
    '_sq_allowed = {"math", "random", "statistics", "json", "datetime", "string", "collections"}\\n'+
    '_sq_blocked = {"open", "eval", "exec", "compile", "__import__", "globals", "locals", "getattr", "setattr", "delattr", "vars", "dir", "breakpoint"}\\n'+
    'for _sq_node in ast.walk(_sq_tree):\\n'+
    '    if isinstance(_sq_node, ast.Import) and any(_sq_name.name.split(".")[0] not in _sq_allowed for _sq_name in _sq_node.names): raise ValueError("Bu mashqda faqat math, random, statistics, json, datetime, string va collections modullari ishlatiladi")\\n'+
    '    if isinstance(_sq_node, ast.ImportFrom) and (_sq_node.module or "").split(".")[0] not in _sq_allowed: raise ValueError("Bu modul mashqda ruxsat etilmagan")\\n'+
    '    if isinstance(_sq_node, ast.Name) and _sq_node.id in _sq_blocked: raise ValueError("Xavfli tizim amali ushbu mashqda yopiq: " + _sq_node.id)\\n'+
    '    if isinstance(_sq_node, ast.Attribute) and _sq_node.attr.startswith("__") and _sq_node.attr != "__name__": raise ValueError("Tizim xususiyatlaridan foydalanib bo‘lmaydi")\\n'+
    '_sq_lines = iter(_sq_input_text.splitlines())\\n'+
    'def _sq_read(prompt=""):\\n'+
    '    print(prompt, end="")\\n'+
    '    try: return next(_sq_lines)\\n'+
    '    except StopIteration: raise EOFError("Kiritish satri yetishmadi")\\n'+
    '_sq_real_import = builtins.__import__\\n'+
    'def _sq_import(name, globals=None, locals=None, fromlist=(), level=0):\\n'+
    '    if name.split(".")[0] not in _sq_allowed or level: raise ImportError("Bu modul mashqda ruxsat etilmagan: " + name)\\n'+
    '    return _sq_real_import(name, globals, locals, fromlist, level)\\n'+
    '_sq_names = "print range len int float str bool list dict tuple set frozenset sum min max abs round all any enumerate zip sorted reversed map filter iter next slice isinstance issubclass type object super property staticmethod classmethod __build_class__ Exception ValueError TypeError IndexError KeyError ZeroDivisionError NameError StopIteration EOFError AssertionError RuntimeError NotImplementedError ord chr bin oct hex divmod pow format repr ascii hash callable".split()\\n'+
    '_sq_builtins = {name: getattr(builtins, name) for name in _sq_names}\\n'+
    '_sq_builtins.update(input=_sq_read, __import__=_sq_import)\\n'+
    '_sq_globals = {"__name__": "__main__", "__builtins__": _sq_builtins}\\n'+
    'try:\\n'+
    '    exec(compile(_sq_tree, "<oquvchi>", "exec"), _sq_globals)\\n'+
    'except BaseException:\\n'+
    '    traceback.print_exc(limit=4)\\n'
  );
  self.postMessage({kind:'result',id,output:output.slice(0,12000)});
 }catch(error){self.postMessage({kind:'error',id,message:String(error?.message||error).slice(0,300)})}
};`;

let worker=null,workerUrl=null,active=null,timer=null;
const send=(message)=>window.parent.postMessage({kind:'sq-python',...message},'*');
const stop=()=>{clearTimeout(timer);timer=null;worker?.terminate();worker=null;if(workerUrl)URL.revokeObjectURL(workerUrl);workerUrl=null;active=null};
window.addEventListener('message',event=>{
 if(event.source!==window.parent||event.data?.kind!=='sq-python-run')return;
 const {id,code,input}=event.data;
 if(typeof id!=='string'||id.length>80||typeof code!=='string'||code.length>8000||typeof input!=='string'||input.length>2000)return;
 stop();active=id;
 const blob=new Blob([workerSource],{type:'text/javascript'}),url=URL.createObjectURL(blob);
 try{worker=new Worker(url,{type:'module'});workerUrl=url}catch(error){URL.revokeObjectURL(url);send({id,kind:'error',message:'Python ishga tushmadi: '+String(error.message||error)});return}
 timer=setTimeout(()=>{if(active===id){send({id,kind:'error',message:'Python muhiti yuklanmadi. Internetni tekshiring va qayta urinib ko‘ring.'});stop()}},45000);
 worker.onerror=()=>{if(active===id){send({id,kind:'error',message:'Python muhiti ochilmadi. Internet yoki brauzer sozlamalarini tekshiring.'});stop()}};
 worker.onmessage=({data})=>{
  if(active!==id||data?.id!==id)return;
  if(data.kind==='loaded'){
   clearTimeout(timer);
   send({id,kind:'loaded'});
   timer=setTimeout(()=>{if(active===id){send({id,kind:'error',message:'Kod 6 soniyadan ortiq ishladi va to‘xtatildi.'});stop()}},6000);
  }else if(data.kind==='result'||data.kind==='error'){
   send({id,kind:data.kind,output:data.output,message:data.message});stop();
  }
 };
 worker.postMessage({kind:'run',id,code,input});
});
send({kind:'ready'});
