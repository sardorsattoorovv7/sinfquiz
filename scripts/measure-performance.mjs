import {readFileSync,statSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';

// Measure emitted bytes, including the actual modulepreload graph in the HTML.
// Compression figures are reproducible estimates, not browser timing results.
const root=resolve(process.argv[2]||'dist'),html=readFileSync(resolve(root,'index.html'),'utf8');
const urls=new Set();
for(const match of html.matchAll(/<(script|link)\b([^>]*)>/gi)){
 const [,tag,attributes]=match;
 if(tag.toLowerCase()==='link'&&!/\brel=["'](?:modulepreload|stylesheet)["']/i.test(attributes))continue;
 const url=attributes.match(/\b(?:src|href)=["']([^"']+)["']/i)?.[1];
 if(url&&!/^(?:https?:|data:|\/\/)/i.test(url))urls.add(url.split(/[?#]/)[0]);
}
const assets=[...urls].map(url=>{
 const file=resolve(root,'.'+(url.startsWith('/')?url:'/'+url));
 if(relative(root,file).startsWith('..'))throw Error('Invalid asset path');
 const bytes=readFileSync(file);
 return {url,kind:url.endsWith('.css')?'css':'js',bytes:statSync(file).size,gzip:gzipSync(bytes,{level:9}).length,brotli:brotliCompressSync(bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:11}}).length};
});
const sum=kind=>assets.filter(a=>a.kind===kind).reduce((out,a)=>({files:out.files+1,bytes:out.bytes+a.bytes,gzip:out.gzip+a.gzip,brotli:out.brotli+a.brotli}),{files:0,bytes:0,gzip:0,brotli:0});
const report={schemaVersion:1,description:'Initial HTML scripts, modulepreloads and stylesheets; compressed sizes are estimates.',javascript:sum('js'),css:sum('css'),assets};
if(process.argv.includes('--check')){
 report.budget={javascriptBytes:650000,javascriptGzip:200000,cssBytes:380000,cssGzip:75000};
 report.budget.passed=report.javascript.bytes<=report.budget.javascriptBytes&&report.javascript.gzip<=report.budget.javascriptGzip&&report.css.bytes<=report.budget.cssBytes&&report.css.gzip<=report.budget.cssGzip;
 if(!report.budget.passed)process.exitCode=1;
}
console.log(JSON.stringify(report,null,2));
