import {PaperBrand} from "../paper/PaperUI.jsx";

import {Code2,BookOpen} from "lucide-react";

import React from "react";

export const englishLevels={A1:'Boshlang‘ich',A2:'Elementar',B1:'O‘rta',B2:'Yuqori o‘rta',C1:'Ilg‘or',C2:'Mukammal'};

export function speakEnglish(text,rate=.86){
 if(typeof window==='undefined'||!window.speechSynthesis||!text)return false;
 window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=rate;utterance.pitch=1;window.speechSynthesis.speak(utterance);return true;
}

export function normalize(value){ return value.trim().toLowerCase().replace(/[“”‘’`]/g,"'").replace(/\s+/g,' '); }

export function Brand({light=false}){return <PaperBrand className={'brand '+(light?'brand-light':'')}/>;}

export function LessonBadge({subject}){return <span className="lesson-badge" aria-hidden="true">{subject==='Python'?<Code2 size={22}/>:<BookOpen size={22}/>}</span>}
