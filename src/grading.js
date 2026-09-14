export const questionTypes = {test:'Test', practical:'Amaliy yozish', shortcut:'Tugmalar', prompt:'Prompt yozish'};
export function normalize(value='') { return String(value).trim().toLowerCase().replace(/[“”‘’`ʻʼ]/g,"'").replace(/\s+/g,' '); }
export function normalizeShortcut(value='') {
  const keys=String(value).toLowerCase().split('+').map(k=>k.trim()).filter(Boolean).map(k=>({control:'ctrl',command:'meta',cmd:'meta',escape:'esc'}[k]||k));
  return [...new Set(keys)].sort().join('+');
}
export function gradeAnswer(q, value, seconds) {
  let ratio=0; let checks=[];
  if(q.type==='test') ratio=value===q.correct?1:0;
  else if(q.type==='shortcut') ratio=normalizeShortcut(value)===normalizeShortcut(q.answer)?1:0;
  else if(q.type==='prompt') {
    const answer=normalize(value);
    checks=(q.criteria||[]).map(c=>({...c,passed:c.keywords.some(k=>normalize(k).length>0&&answer.includes(normalize(k)))}));
    ratio=checks.length?checks.filter(c=>c.passed).length/checks.length:0;
  } else {
    const accepted=[q.answer,...(q.acceptedAnswers||[])];
    ratio=accepted.some(a=>q.subject==='Excel'?normalize(value).replace(/\s/g,'')===normalize(a).replace(/\s/g,''):normalize(value)===normalize(a))?1:0;
  }
  const speed=Math.max(.5,Math.min(1,seconds/Math.max(1,q.time)));
  return {ratio,checks,earned:Math.round(q.points*ratio*(.7+.3*speed)),correct:ratio===1};
}
