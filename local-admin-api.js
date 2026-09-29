// The Vite dev server does not execute Vercel's /api functions by itself.
// Keep this bridge server-side and only active during local development.
import handler from './api/admin-reset-password.js';
export function localAdminApi(){
 return {name:'sinfquiz-local-admin-api',apply:'serve',configureServer(server){
  server.middlewares.use('/api/admin-reset-password',async(req,res,next)=>{
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
    server.config.logger.error(`Admin API xatosi: ${error.message}`);
    if(!res.writableEnded)res.status(500).json({error:'Lokal admin API ishlamadi. Terminaldagi xatoni tekshiring.'});
   }
  });
 }};
}
