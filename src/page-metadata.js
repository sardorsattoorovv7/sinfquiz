import {islandDestinations} from './island-content.js';

export const homeTitle = 'SinfQuiz — Bilim bog‘i | Interaktiv darslar va testlar';
export const homeDescription = 'Matematika, kimyo, biologiya, ingliz tili va informatika: interaktiv atlaslar, amaliy mashqlar, darsliklar va jamoaviy musobaqalar.';
export function siteOrigin(value = 'https://www.sinfquiz.uz') {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('origin');
    return url.origin;
  } catch { throw new Error('VITE_SITE_URL faqat HTTPS domen bo‘lishi kerak, masalan https://www.sinfquiz.uz'); }
}
const viewTitles = {
  login:'Kirish', books:'Darsliklar', catalog:'Informatika', atlasHub:'Interaktiv atlaslar',
  exerciseHub:'Mashqlar', competitions:'Jamoaviy musobaqalar', profile:'Mening profilim',
  admin:'Boshqaruv paneli', dashboard:'Boshqaruv paneli', chat:'Guruh suhbatlari',
  practice:'Tayyor testlar', national:'Milliy test mashqlari', cefrManaged:'CEFR / Multilevel mashqlari',
  audioMaze:'Inglizcha labirint', typing:'Yozish mashqi', race:'Bilim poygasi', play:'Sinf testi', result:'Test natijasi',
};
// Hash-based account/activity screens are not separate public search landing pages.
export function applyPageMetadata(view) {
  const subject = islandDestinations.find(item => item.id === view);
  document.title = view === 'home' ? homeTitle : `${subject?.title || viewTitles[view] || 'O‘quv mashg‘uloti'} — SinfQuiz`;
  const set = (selector, value) => document.querySelector(selector)?.setAttribute('content', value);
  set('meta[name="description"]', subject?.summary || homeDescription);
  set('meta[name="robots"]', view === 'home' ? 'index, follow' : 'noindex, follow');
}
