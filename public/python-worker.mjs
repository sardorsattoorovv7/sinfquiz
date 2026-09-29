// Disposable worker: Python has no app DOM, localStorage or access tokens.
const BASE=new URL('./python-runtime/',import.meta.url).href;
const MAX_OUTPUT=12000;
const PYTHON_WRAPPER=`
import ast, builtins, traceback
try:
    tree = ast.parse(_sq_source, filename="<oquvchi>")
    allowed = {"math", "random", "statistics", "json", "datetime", "string", "collections"}
    blocked = {"open", "eval", "exec", "compile", "__import__", "globals", "locals", "getattr", "setattr", "delattr", "vars", "dir", "breakpoint"}
    for node in ast.walk(tree):
        if isinstance(node, ast.Import) and any(name.name.split(".")[0] not in allowed for name in node.names):
            raise ValueError("Bu mashqda faqat math, random, statistics, json, datetime, string va collections modullari ishlatiladi")
        if isinstance(node, ast.ImportFrom) and ((node.module or "").split(".")[0] not in allowed or node.level):
            raise ValueError("Bu modul mashqda ruxsat etilmagan")
        if isinstance(node, ast.Name) and node.id in blocked:
            raise ValueError("Tizim amali ushbu mashqda yopiq: " + node.id)
        if isinstance(node, ast.Attribute) and node.attr.startswith("__") and node.attr != "__name__":
            raise ValueError("Tizim xususiyatlaridan foydalanib bo‘lmaydi")
    lines = iter(_sq_input_text.splitlines())
    def read_input(prompt=""):
        print(prompt, end="")
        try: return next(lines)
        except StopIteration: raise EOFError("input() uchun qiymat yetishmadi")
    original_import = builtins.__import__
    def safe_import(name, globals=None, locals=None, fromlist=(), level=0):
        if name.split(".")[0] not in allowed or level:
            raise ImportError("Bu modul mashqda ruxsat etilmagan: " + name)
        return original_import(name, globals, locals, fromlist, level)
    names = "print range len int float str bool list dict tuple set frozenset sum min max abs round all any enumerate zip sorted reversed map filter iter next slice isinstance issubclass type object super property staticmethod classmethod __build_class__ Exception ValueError TypeError IndexError KeyError ZeroDivisionError NameError StopIteration EOFError AssertionError RuntimeError NotImplementedError ord chr bin oct hex divmod pow format repr ascii hash callable".split()
    safe_builtins = {name: getattr(builtins, name) for name in names}
    safe_builtins.update(input=read_input, __import__=safe_import)
    scope = {"__name__": "__main__", "__builtins__": safe_builtins}
    exec(compile(tree, "<oquvchi>", "exec"), scope)
except BaseException:
    traceback.print_exc(limit=4)
`;
self.onmessage=async ({data})=>{
 if(data?.kind!=='run')return;
 const {id,code,input}=data;
 if(typeof id!=='string'||id.length>80||typeof code!=='string'||code.length>8000||typeof input!=='string'||input.length>2000)return;
 try{
  self.postMessage({id,kind:'loading'});
  const {loadPyodide}=await import(`${BASE}pyodide.mjs`);
  const pyodide=await loadPyodide({indexURL:BASE});
  self.postMessage({id,kind:'loaded'});
  // Runtime assets have loaded; student code cannot fetch external resources.
  self.fetch=()=>Promise.reject(Error('Bu mashqda internetga chiqish yopiq.'));
  self.XMLHttpRequest=class{constructor(){throw Error('Bu mashqda internetga chiqish yopiq.')}};
  let output='';
  const append=line=>{if(output.length<MAX_OUTPUT)output+=(String(line).slice(0,MAX_OUTPUT-output.length)+'\n')};
  pyodide.setStdout({batched:append});pyodide.setStderr({batched:append});
  pyodide.globals.set('_sq_source',code);pyodide.globals.set('_sq_input_text',input);
  await pyodide.runPythonAsync(PYTHON_WRAPPER);
  self.postMessage({id,kind:'result',output:output.slice(0,MAX_OUTPUT)});
 }catch(error){self.postMessage({id,kind:'error',message:String(error?.message||error).slice(0,300)})}
};
