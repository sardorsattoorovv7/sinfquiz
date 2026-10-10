import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seoPages,publicSiteUrl,seoHead,publicPageHTML,sitemapXML,seoPlugin} from '../seo-pages.js';
test('Public subjects and classroom have actual crawlable HTML and canonical URLs',()=>{
 const site=publicSiteUrl();assert.equal(seoPages.length,7);const urls=new Set();
 for(const p of seoPages){const html=publicPageHTML(site,p);assert.ok(!urls.has(p.path));urls.add(p.path);assert.match(html,/<html lang="uz">/);assert.ok(html.includes(`<h1>${p.title}</h1>`));assert.ok(html.includes(`rel="canonical" href="${site}${p.path}"`));assert.ok(html.includes(`href="/#${p.hash}"`));assert.doesNotMatch(html,/supabase.*key|answerKey|csrf|userId|password/i);assert.ok(html.includes('1200'));}
 assert.equal((sitemapXML(site).match(/<loc>/g)||[]).length,8);assert.doesNotMatch(sitemapXML(site),/#|api\/|profil|admin\/|chat/);
});
test('Metadata escapes user-supplied verification text and JSON-LD cannot close its script',()=>{
 const head=seoHead('https://www.sinfquiz.uz',{title:'Sinov </script><script>alert(1)</script>',verification:'"><script>alert(2)</script>'});assert.doesNotMatch(head,/<script>alert/);assert.ok(head.includes('\\u003c/script>'));assert.ok(head.includes('&quot;&gt;&lt;script&gt;'));
 const payload=JSON.parse(head.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);assert.ok(payload.name.includes('</script>'));assert.equal(payload.inLanguage,'uz');
});
test('Public origin is explicit HTTPS; custom domains regenerate all discoverable URLs',()=>{
 const site=publicSiteUrl('https://sinfquiz.uz');assert.equal(site,'https://sinfquiz.uz');assert.ok(sitemapXML(site).includes('https://sinfquiz.uz/ustozlar/sinfxona'));
 for(const value of ['http://sinfquiz.uz','https://sinfquiz.uz/private','https://x:y@sinfquiz.uz','https://sinfquiz.uz/?key=1'])assert.throws(()=>publicSiteUrl(value));
 const emitted=[],plugin=seoPlugin({url:site});plugin.generateBundle.call({emitFile:x=>emitted.push(x)});assert.equal(emitted.length,9);assert.match(emitted.find(x=>x.fileName==='robots.txt').source,/Disallow: \/api\//);assert.match(emitted.find(x=>x.fileName==='robots.txt').source,/Sitemap: https:\/\/sinfquiz.uz\/sitemap.xml/);
 const uses=[];assert.equal(plugin.configureServer({middlewares:{use:x=>uses.push(x)}}),undefined);assert.equal(uses.length,1);
});
test('Deployment serves public files without rewriting unknown paths into soft 404s',()=>{
 const v=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));assert.equal(v.cleanUrls,true);assert.deepEqual(v.rewrites,[{source:'/app',destination:'/'}]);assert.equal(v.headers.at(-1).headers.find(x=>x.key==='Permissions-Policy').value,'camera=(), microphone=(self), geolocation=()');
});
