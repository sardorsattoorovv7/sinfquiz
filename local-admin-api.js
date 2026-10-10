// The Vite dev server does not execute Vercel's /api functions by itself.
// Keep this bridge server-side and only active during local development.
import resetPassword from './api/admin-reset-password.js';
import telegramAuth from './api/telegram-auth.js';
export function localAdminApi(){
 return {name:'sinfquiz-local-admin-api',apply:'serve',configureServer(server){
  for(const [path,handler] of [['/api/admin-reset-password',resetPassword],['/api/telegram-auth',telegramAuth]])server.middlewares.use(path,async(req,res,next)=>{
   if(req.url!=='/'&&req.url!=='')return next();
   res.setHeader('Content-Type','application/json; charset=utf-8');
   res.status=function(code){res.statusCode=code;return res};
   res.json=function(body){res.end(JSON.stringify(body));return res};
   try{
    let raw='';
    for await(const chunk of req){
     raw+=chunk;
     if(raw.length>16_384){res.status(413).json({error:'So‘rov hajmi juda katta.'});return}
    }
    try{req.body=raw?JSON.parse(raw):{}}catch{res.status(400).json({error:'So‘rov formati noto‘g‘ri.'});return}
    await handler(req,res);
   }catch(error){
    server.ssrFixStacktrace?.(error);
    server.config.logger.error(`Lokal API xatosi (${path}): ${error.message}`);
    if(!res.writableEnded)res.status(500).json({error:'Lokal API ishlamadi. Terminaldagi xatoni tekshiring.'});
   }
  });
 }};
}
