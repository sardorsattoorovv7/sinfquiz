export function yearLabel(year){return year<0?`mil. avv. ${Math.abs(year)}`:`${year}-yil`;}
export function anchorLabel(topic){return (['war','independence'].includes(topic.scene)?'':'≈ ')+yearLabel(topic.year);}
export function mapPoint({lat,lon}){if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw new Error('Geografik koordinata noto‘g‘ri.');return {x:(lon+180)*2,y:(90-lat)*2};}
export const historyStorageKey=owner=>`sq:history-atlas:v745:${owner||'guest'}`;
const safeId=id=>typeof id==='string'&&/^[a-z0-9-]{1,90}$/.test(id)&&!['constructor','prototype'].includes(id);
export function historyDraft(input){const out={version:1,entries:{}};if(!input||typeof input!=='object')return out;for(const [id,row] of Object.entries(input.entries||{}).slice(-50)){if(!safeId(id)||!row||typeof row!=='object')continue;out.entries[id]={answer:Number.isInteger(row.answer)&&row.answer>=0&&row.answer<3?row.answer:null,note:typeof row.note==='string'?row.note.slice(0,1500):'',complete:row.complete===true,revision:typeof row.revision==='string'?row.revision.slice(0,100):''};}return out;}
export function historyRevision(topic){const text=JSON.stringify([topic.year,topic.activity.prompt,topic.activity.choices,topic.activity.answer,topic.evidence]);let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return 'v1:'+(hash>>>0).toString(36);}
export function historyComplete(row,topic){return !!(row?.complete&&row.revision===historyRevision(topic)&&row.answer===topic.activity.answer&&row.note.trim().length>=20);}
