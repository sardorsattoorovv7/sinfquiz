export const normalizedHistory=(groups,localPractice=[])=>{
 const rows=[];
 for(const row of groups.players||[])if(row.finishedAt)rows.push({id:row.id,type:'quiz',title:row.quizTitle||'Sinf testi',score:`${row.correct||0}/${row.answers||0} to‘g‘ri · ${row.score||0} ball`,at:row.finishedAt});
 for(const row of groups.typing||[])rows.push({id:row.id,type:'typing',title:row.courseMode==='longtext'?'Uzun matn terish':`English Typing · ${row.englishLevel||'A1'}`,score:`${row.averageAccuracy||0}% aniqlik · ${row.averageWpm||0} so‘z/daqiqa`,at:row.completedAt});
 for(const row of groups.national||[])rows.push({id:row.id,type:'national',title:row.sectionTitle||'Milliy test mashqi',score:`${row.correct||0}/${row.total||0} · ${row.score||0}/75 · ${row.level||'—'}`,at:row.finishedAt});
 for(const row of groups.cefr||[])if(row.finished_at)rows.push({id:row.id,type:'cefr',title:row.title||'CEFR / Multilevel',score:row.assessment?`Baholangan${row.result?.overall!=null?` · ${row.result.overall}/75`:''}`:row.result?.overall!=null?`${row.result.overall}/75 · yozma va og‘zaki baho kutilmoqda`:'Yozma va og‘zaki javoblar tekshirilmoqda',at:row.finished_at});
 const practice=new Map();
 for(const row of [...localPractice,...(groups.practice||[])])if(row?.id)practice.set(row.id,row);
 for(const row of practice.values())rows.push({id:row.id,type:'practice',title:row.title||'Mustaqil mashq',score:`${row.correct||0}/${row.total||0} to‘g‘ri`,at:row.at});
 for(const row of groups.race||[])rows.push({id:row.id,type:'race',title:row.title||'1v1 poyga',score:`${row.correct||0}/${row.total||0} to‘g‘ri · ${row.won?'G‘olib':'Ishtirokchi'} (${row.name||'o‘quvchi'})`,at:row.finishedAt});
 return rows.map(row=>({...row,at:typeof row.at==='number'?row.at:Date.parse(row.at)})).filter(row=>Number.isFinite(row.at)).sort((a,b)=>b.at-a.at);
};
