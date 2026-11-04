// The typing course uses the ordinary keyboard apostrophe consistently.
// This changes neither letter case nor any other punctuation or spacing.
export const typingApostrophes=value=>String(value).replace(/[\u2018\u2019\u02bb\u02bc\uff07]/g,"'");
export function typingContentApostrophes(value){
 if(typeof value==='string')return typingApostrophes(value);
 if(Array.isArray(value))return value.map(typingContentApostrophes);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,typingContentApostrophes(item)]));
 return value;
}
