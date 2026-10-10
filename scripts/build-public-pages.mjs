// Small, crawlable public pages. No Supabase key, account or private classroom data is read here.
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {loadEnv} from 'vite';
import {islandDestinations} from '../src/island-content.js';
import {homeTitle, homeDescription, siteOrigin} from '../src/page-metadata.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv.includes('--dev') ? 'development' : 'production';
const env = loadEnv(mode, root, 'VITE_SITE_URL');
const origin = siteOrigin(process.env.VITE_SITE_URL || env.VITE_SITE_URL || 'https://www.sinfquiz.uz');
const esc = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const url = route => origin + route;
const image = '/garden/v7.30/social.webp';
const head = (title, description, route, type = 'WebPage') => `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url(route)}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="uz_UZ" />
    <meta property="og:site_name" content="SinfQuiz" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url(route)}" />
    <meta property="og:image" content="${url(image)}" />
    <meta property="og:image:width" content="1600" />
    <meta property="og:image:height" content="1050" />
    <meta property="og:image:alt" content="SinfQuiz Bilim bog‘i: fanlar va teksturali 3D bog‘ modeli" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${url(image)}" />
    <script type="application/ld+json">${json({'@context':'https://schema.org','@type':type,name:title,description,url:url(route),inLanguage:'uz',isPartOf:{'@type':'WebSite',name:'SinfQuiz',url:url('/')}})}</script>`;
const cards = islandDestinations.map(d => `<article class="public-card"><h2><a href="${d.path}">${esc(d.title)}</a></h2><p>${esc(d.summary)}</p><a class="public-link" href="${d.path}">Mavzularni ko‘rish <span aria-hidden="true">→</span></a></article>`).join('\n');
const nav = `<header class="public-header"><a class="public-brand" href="/" aria-label="SinfQuiz bosh sahifa">Sinf<span>Quiz</span></a><nav aria-label="Bosh navigatsiya"><a href="/fanlar/">Fanlar</a><a href="/#darsliklar">Darsliklar</a><a href="/#musobaqa">Musobaqalar</a><a class="public-button" href="/">Bosh sahifaga kirish</a></nav></header>`;
const footer = `<footer class="public-footer"><a href="/">SinfQuiz — Bilim bog‘i</a><p>Ko‘rib, sinab va tushunib o‘rganing.</p><a href="/fanlar/">Barcha fanlar</a></footer>`;
const homeBody = `${nav}<main id="public-main"><section class="public-hero"><div><p class="public-kicker">BILIM BOG‘I</p><h1>Bilim bog‘iga xush kelibsiz</h1><p>${homeDescription}</p><a class="public-button" href="/fanlar/">Fanlar bilan tanishish</a></div><aside><h2>Olti fan — bitta o‘quv maydoni</h2><p>Bog‘ modelini aylantirib ko‘ring va fan bo‘limini tanlang. Interaktiv ko‘rinish brauzerda ochiladi.</p><p>Fan sahifalari va kichik mashqlar JavaScriptsiz ham ishlaydi.</p></aside></section><section class="public-section"><h2>Fanlar va amaliy mashqlar</h2><div class="public-grid">${cards}</div></section><noscript><p class="public-note">Fan sahifalari va misollar JavaScriptsiz ham ochiladi. Interaktiv modellar va testlar uchun brauzerda JavaScriptni yoqing.</p></noscript></main>${footer}`;
const basicHead = `<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="theme-color" content="#091d35"/><link rel="icon" type="image/svg+xml" href="/favicon.svg"/><link rel="stylesheet" href="/public-pages.css"/><link rel="manifest" href="/manifest.webmanifest"/><script src="/theme-init.js"></script>`;
const page = (title, description, route, body, extra = '') => `<!doctype html>\n<html lang="uz"><head>${basicHead}${head(title,description,route)}${extra}</head><body class="public-page"><a class="public-skip" href="#public-main">Asosiy mazmunga o‘tish</a>${nav}<main id="public-main">${body}</main>${footer}</body></html>\n`;
await mkdir(path.join(root,'public/fanlar'),{recursive:true});
await writeFile(path.join(root,'public/fanlar/index.html'), page('Fanlar va interaktiv mashqlar — SinfQuiz',homeDescription,'/fanlar/',`<section class="public-heading"><p class="public-kicker">BILIM BOG‘I / FANLAR</p><h1>Qaysi fanni o‘rganamiz?</h1><p>Har bir fan sahifasida mavzular, namuna mashq va interaktiv bo‘limga yo‘l bor.</p></section><section class="public-section"><div class="public-grid">${cards}</div></section>`));
for (const d of islandDestinations) {
  const breadcrumbs = {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'SinfQuiz',item:url('/')},{'@type':'ListItem',position:2,name:'Fanlar',item:url('/fanlar/')},{'@type':'ListItem',position:3,name:d.label,item:url(d.path)}]};
  const body = `<nav class="public-breadcrumb" aria-label="Sahifa yo‘li"><a href="/">Bosh sahifa</a><span aria-hidden="true">/</span><a href="/fanlar/">Fanlar</a><span aria-hidden="true">/</span><span aria-current="page">${esc(d.label)}</span></nav><section class="public-heading"><p class="public-kicker">SINFQUIZ / ${esc(d.label.toLocaleUpperCase('uz'))}</p><h1>${esc(d.title)}</h1><p>${esc(d.summary)}</p><a class="public-button" href="/#${d.hash}">Interaktiv bo‘limni ochish <span aria-hidden="true">→</span></a><p class="public-caption">Shaxsiy natijalar va ustozga tegishli materiallar uchun hisobingizga kiring.</p></section><div class="public-study"><section class="public-card"><h2>Nimalarni o‘rganasiz?</h2><ol>${d.topics.map(t=>`<li>${esc(t)}</li>`).join('')}</ol><h3>Qanday ishlash kerak?</h3><p>Mavzuni tanlang, modeldagi bir parametrni o‘zgartiring va natijani taxminingiz bilan solishtiring. Izohni ochib, sababini tekshiring.</p></section><section class="public-card public-example"><p class="public-kicker">O‘ZINGIZ SINAB KO‘RING</p><h2>Kichik mashq</h2><p class="public-question">${esc(d.question)}</p><details><summary>Javob va tushuntirishni ochish</summary><p>${esc(d.answer)}</p></details></section></div><section class="public-section"><h2>Boshqa fanlarga o‘ting</h2><nav class="public-related" aria-label="Boshqa fanlar">${islandDestinations.filter(x=>x.id!==d.id).map(x=>`<a href="${x.path}">${esc(x.label)}</a>`).join('')}</nav></section>`;
  const dir = path.join(root,'public',d.path);
  await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'index.html'),page(`${d.title} — SinfQuiz`,d.summary,d.path,body,`<script type="application/ld+json">${json(breadcrumbs)}</script>`));
}
let index = await readFile(path.join(root,'index.html'),'utf8');
if (!index.includes('<!-- SQ_HEAD_START -->') || !index.includes('<!-- SQ_HOME_START -->')) throw new Error('index.html generator belgilari topilmadi');
index = index.replace(/<!-- SQ_HEAD_START -->[\s\S]*?<!-- SQ_HEAD_END -->/,`<!-- SQ_HEAD_START -->${head(homeTitle,homeDescription,'/','WebPage')}\n<!-- SQ_HEAD_END -->`).replace(/<!-- SQ_HOME_START -->[\s\S]*?<!-- SQ_HOME_END -->/,`<!-- SQ_HOME_START -->${homeBody}<!-- SQ_HOME_END -->`);
await writeFile(path.join(root,'index.html'),index);
const routes=['/','/fanlar/',...islandDestinations.map(d=>d.path)];
await writeFile(path.join(root,'public/sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route=>`  <url><loc>${url(route)}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile(path.join(root,'public/robots.txt'),`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /auth/\n\nSitemap: ${url('/sitemap.xml')}\n`);
await writeFile(path.join(root,'public/404.html'),`<!doctype html><html lang="uz"><head>${basicHead}<title>Sahifa topilmadi — SinfQuiz</title><meta name="robots" content="noindex, follow"/></head><body class="public-page">${nav}<main id="public-main" class="public-heading"><p class="public-kicker">404</p><h1>Bu sahifa topilmadi</h1><p>Manzil o‘zgargan bo‘lishi mumkin. Kerakli fanni Bilim bog‘idan tanlang.</p><a class="public-button" href="/">Bilim bog‘iga qaytish</a></main>${footer}</body></html>`);
console.log(`Public pages: ${routes.length} URLs; canonical: ${origin}.`);
