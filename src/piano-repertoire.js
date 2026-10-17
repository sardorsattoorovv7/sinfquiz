import {BELLA_CIAO_EVENTS} from './piano-bella-ciao.js';
import {READY_TURKISH_SONGS} from './piano-turkish-ready.js';
import {MODERN_SONGS} from './piano-modern-ready.js';
import {FOCUS_SONGS} from './piano-focus-ready.js';
import {NEW_SONGS as EXPANSION_SONGS} from './piano-expansion-ready.js';
import {REQUESTED_SONGS} from './piano-requested-ready.js';
import {SELECTED_SONGS} from './piano-selected-ready.js';
export const NEW_SONGS=[...SELECTED_SONGS,...REQUESTED_SONGS,...EXPANSION_SONGS];
export {READY_TURKISH_SONGS,MODERN_SONGS,FOCUS_SONGS,EXPANSION_SONGS,REQUESTED_SONGS,SELECTED_SONGS};

export const REPERTOIRE_CHECKED_AT='2026-10-17';
export const READY_SONGS=[{
 id:'song-bella-ciao',title:'Bella Ciao',artist:'Italyan xalq kuyi',aliases:['bella cio','bella chao','çav bella','cav bella','la casa de papel','money heist'],
 kind:'public',mood:'Xalq kuyi',key:'F♯ minor',difficulty:'O‘rta',duration:30,bpm:130,
 credit:'Peter Gerloff / Rabanus Flavus · CC0. To‘liq kuy 30 soniyaga moslangan.',
 description:'Melodiya va jo‘r bo‘lish bilan tayyor piano mashqi. Tinglang yoki yoritilgan notalarni bosib o‘rganing.',
 sourceUrl:'https://commons.wikimedia.org/wiki/File:Bella_ciao.mid',license:'CC0-1.0',
 sourceMidi:'/piano/bella-ciao.cc0.mid',events:BELLA_CIAO_EVENTS,
},...READY_TURKISH_SONGS];

// Legacy metadata stays readable for older personal MIDI imports. These
// unavailable modern scores are deliberately excluded from the ready library.
export const TURKISH_CATALOG=[
 ['kusura-bakma','KUSURA BAKMA','BLOK3','Rap / pop','https://open.spotify.com/track/1uxByMuB5lMP8iwMhkzwFu'],
 ['napiyosun-mesela','napıyosun mesela ?','BLOK3','Rap / pop','https://open.spotify.com/track/5QxnPSQq5E2N07b4n5zxGK'],
 ['sevmeyi-denemedin','SEVMEYİ DENEMEDİN','BLOK3','Rap / pop','https://open.spotify.com/track/3ff93VTp2DBbNnDEsAW8Cm'],
 ['sebebi-yar','Sebebi Yar','BLOK3','Rap / pop','https://open.spotify.com/track/1gd1TicErR4bwjR3CYxyra'],
 ['kayip-kalp','Kayıp Kalp','BLOK3','Rap / pop','https://open.spotify.com/track/3H4aYDeSswC31fSOWJtWdg'],
 ['cok-guzel-guluyorsun','Çok Güzel Gülüyorsun','BLOK3, Poizi','Rap / pop','https://open.spotify.com/track/7rsrUU3OGXQwTHWWMZwlw8'],
 ['atese-dustum','Ateşe Düştüm','Mert Demir','Romantik','https://open.spotify.com/track/3auN910HHNYykQo8i9q5J1'],
 ['belki','Belki — Akustik','Dedublüman','Akustik','https://open.spotify.com/track/5nH1QRipfAJ8Pd9rFu3xHh'],
 ['dondum','Döndüm','Bora Duran','Pop','https://open.spotify.com/track/2pc1hu3tfc90Ito191MM9J'],
 ['tralala','TRALALA','manifest','Pop','https://music.apple.com/us/album/tralala-single/6818498745'],
 ['kralin-kizi','Kralın Kızı','Ahiyan','Rap / pop','https://music.apple.com/us/album/kral%C4%B1n-k%C4%B1z%C4%B1-single/6810128989'],
 ['altust-olmusum','Altüst Olmuşum — Canlı','Mavi Gri','Akustik','https://open.spotify.com/track/35CCOqpwIXXas6XDFlEJCn'],
].map(([id,title,artist,mood,listenUrl])=>({
 id:'turkish-'+id,title,artist,mood,listenUrl,kind:'song',checkedAt:REPERTOIRE_CHECKED_AT,
 linkLabel:listenUrl.includes('/artist/')?'Ijrochi sahifasida tinglash':'Asl qo‘shiqni tinglash',
 description:'Pianoda o‘rganish uchun shu qo‘shiqning o‘zingizdagi MIDI faylini ulang. Istalgan 30 soniyagacha parchani tanlashingiz mumkin.',
}));

export const SONG_REPERTOIRE=[...NEW_SONGS,...FOCUS_SONGS,...MODERN_SONGS,...READY_SONGS];
export const requiresMidi=track=>track?.kind==='film'||track?.kind==='song';

export function normalizePianoSearch(value=''){
 return String(value).toLowerCase().replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
export function matchesPianoSearch(track,query){
 const words=normalizePianoSearch(query).split(' ').filter(Boolean);
 const haystack=normalizePianoSearch([track.title,track.artist,track.movie,track.movieAlias,track.series,track.album,track.key,track.mood,...(track.aliases||[])].filter(Boolean).join(' '));
 return words.every(word=>haystack.includes(word));
}

// catalogId is new; filmId remains readable for existing saved film imports.
export const linkedPianoImport=(imports,track)=>requiresMidi(track)?imports.find(x=>(x.catalogId||x.filmId)===track.id):undefined;
