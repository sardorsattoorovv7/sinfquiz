import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {islandDestinations} from '../src/island-content.js';
import {siteOrigin,applyPageMetadata} from '../src/page-metadata.js';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('All eight public pages expose useful content, crawlable links and unique canonical metadata before JavaScript',()=>{
 const routes=['/','/fanlar/',...islandDestinations.map(d=>d.path)];const titles=new Set();
 for(const route of routes){
  const dom=new JSDOM(read(route==='/'?'index.html':`public${route}index.html`)),doc=dom.window.document;
  assert.equal(doc.documentElement.lang,'uz');
  assert.equal(doc.querySelectorAll('h1').length,1);
  assert.ok(doc.querySelector('main').textContent.length>400);
  assert.equal(doc.querySelector('link[rel=canonical]').href,'https://www.sinfquiz.uz'+route);
  assert.equal(doc.querySelector('meta[name=robots]').content,'index, follow');
  assert.equal(doc.querySelector('meta[property="og:url"]').content,'https://www.sinfquiz.uz'+route);
  assert.ok(existsSync(new URL('../public/garden/v7.30/social.webp',import.meta.url)));
  assert.ok(doc.querySelector('meta[name=description]').content.length>80);
  for(const script of doc.querySelectorAll('script[type="application/ld+json"]'))assert.equal(JSON.parse(script.textContent)['@context'],'https://schema.org');
  for(const link of doc.querySelectorAll('a[href^="/fanlar/"]'))assert.ok(routes.includes(link.getAttribute('href')));
  if(route.startsWith('/fanlar/')&&route!=='/fanlar/'){
   assert.ok(doc.querySelector('details summary'));assert.ok(doc.querySelector('details p').textContent.length>100);
  }
  titles.add(doc.title);dom.window.close();
 }
 assert.equal(titles.size,routes.length);
 const sitemap=new JSDOM(read('public/sitemap.xml'),{contentType:'application/xml'}).window.document;
 assert.deepEqual([...sitemap.querySelectorAll('loc')].map(x=>x.textContent),routes.map(x=>'https://www.sinfquiz.uz'+x));
 assert.doesNotMatch(read('public/sitemap.xml'),/#|profil|dashboard|suhbat|api\//);
 assert.match(read('public/robots.txt'),/Sitemap: https:\/\/www.sinfquiz.uz\/sitemap.xml/);
});

test('Unknown routes are not rewritten into a successful home page; API and private routes are not SEO pages',()=>{
 const config=JSON.parse(read('vercel.json'));
 assert.ok(!config.rewrites.some(r=>r.source==='/(.*)'||r.source==='/:path*'));
 assert.ok(config.rewrites.every(r=>r.source==='/app'||r.source.startsWith('/app/')||r.source.startsWith('/fanlar')));
 assert.match(read('public/404.html'),/noindex, follow/);
 assert.match(config.headers.find(x=>x.source==='/app/:path*').headers[0].value,/noindex/);
 assert.match(config.headers.at(-1).headers.find(x=>x.key==='Content-Security-Policy').value,/frame-ancestors 'none'/);
});

test('Metadata for account/activity screens does not advertise private content to search engines',()=>{
 const dom=new JSDOM('<head><title></title><meta name="description"><meta name="robots"></head>');globalThis.document=dom.window.document;
 for(const view of ['login','admin','profile','chat','play','race','typing']){applyPageMetadata(view);assert.equal(document.querySelector('[name=robots]').content,'noindex, follow');}
 applyPageMetadata('home');assert.match(document.title,/Bilim bog‘i/);assert.equal(document.querySelector('[name=robots]').content,'index, follow');
 delete globalThis.document;dom.window.close();
 assert.equal(siteOrigin('https://www.sinfquiz.uz'),'https://www.sinfquiz.uz');
 for(const bad of ['http://example.com','https://user:password@example.com','https://example.com/path','javascript:alert(1)','https://example.com?bad=1'])assert.throws(()=>siteOrigin(bad));
});
