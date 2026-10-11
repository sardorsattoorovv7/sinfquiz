// Stable keyset pagination: no silent 500-row truncation or unordered offsets.
export async function orderedPages(fetchPage,{limit=Infinity,pageSize=500}={}){
 const rows=[];let after='';
 while(rows.length<limit){
  const size=Math.min(pageSize,limit-rows.length),page=await fetchPage(after,size);
  if(!Array.isArray(page))throw Error('Ma’lumot sahifasi noto‘g‘ri.');
  if(page.some((r,i)=>typeof r.id!=='string'||r.id<=(i?page[i-1].id:after)))throw Error('Ma’lumotlar tartibi buzildi.');
  rows.push(...page);if(page.length<size)break;after=page.at(-1).id;
 }
 return rows;
}
