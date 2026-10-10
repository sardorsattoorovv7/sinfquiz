import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {islandDestinations} from '../src/island-content.js';
// Vite's SPA fallback does not resolve public directory indexes. Match the
// production public URLs explicitly in both local development and preview.
export function publicPagesPlugin(){
 const routes=new Set(['/fanlar/',...islandDestinations.map(d=>d.path)]);
 const middleware=base=>async(req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method))return next();
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith('/fanlar'))return next();
  const route=pathname.endsWith('/')?pathname:pathname+'/';
  const known=routes.has(route);
  try{
   const body=await readFile(path.join(base,known?route+'index.html':'404.html'));
   res.statusCode=known?200:404;res.setHeader('Content-Type','text/html; charset=utf-8');
   res.setHeader('X-Content-Type-Options','nosniff');res.end(req.method==='HEAD'?undefined:body);
  }catch(error){next(error);}
 };
 return {name:'sinfquiz-public-pages',configureServer(server){server.middlewares.use(middleware(server.config.publicDir));},configurePreviewServer(server){server.middlewares.use(middleware(path.resolve(server.config.root,server.config.build.outDir)));}};
}
