// Exact edit distance on Unicode code points. No case/punctuation normalization.
function bandDistance(a,b,band){
 const n=a.length,m=b.length,inf=band+1;let prev=new Int32Array(m+1).fill(inf);
 for(let j=0;j<=Math.min(m,band);j++)prev[j]=j;
 for(let i=1;i<=n;i++){
  const curr=new Int32Array(m+1).fill(inf);curr[0]=Math.min(i,inf);let best=curr[0];
  for(let j=Math.max(1,i-band);j<=Math.min(m,i+band);j++){curr[j]=Math.min(prev[j]+1,curr[j-1]+1,prev[j-1]+Number(a[i-1]!==b[j-1]));best=Math.min(best,curr[j])}
  if(best>band)return inf;prev=curr;
 }
 return prev[m];
}
function unitsDistance(inputA,inputB,limit=null){
 let a=inputA,b=inputB,first=0,n=a.length,m=b.length;
 while(first<Math.min(n,m)&&a[first]===b[first])first++;
 while(n>first&&m>first&&a[n-1]===b[m-1]){n--;m--}
 a=a.slice(first,n);b=b.slice(first,m);if(!a.length)return b.length;if(!b.length)return a.length;
 if(limit!==null&&Math.abs(a.length-b.length)>limit)return limit+1;
 const alphabet=new Set(a);if(!b.some(c=>alphabet.has(c)))return Math.max(a.length,b.length);
 for(let band=Math.max(8,Math.abs(a.length-b.length));;band=Math.min(Math.max(a.length,b.length),(limit===null?band*2:Math.min(limit,band*2)))){
  const distance=bandDistance(a,b,band);if(distance<=band)return distance;if(limit!==null&&band>=limit)return limit+1;
 }
}
export function typingDistance(target,typed){return unitsDistance([...target],[...typed])}
const words=text=>{const t=text.replace(/^[\x09-\x0d ]+|[\x09-\x0d ]+$/g,'');return t?t.split(/[\x09-\x0d ]+/u):[]};
export function typingMatch(target,typed){
 const a=[...target],b=[...typed],total=a.length,count=b.length;let distance=unitsDistance(a,b,128),method='levenshtein',expectedUnits=total,typedUnits=count;const minimumCharEdits=Math.max(distance,Math.abs(total-count));
 if(distance>128){const x=words(target),y=words(typed);distance=unitsDistance(x,y);method='word-levenshtein';expectedUnits=x.length;typedUnits=y.length}
 const length=Math.max(expectedUnits,typedUnits,1),wordAccuracy=100*Math.max(0,Math.max(expectedUnits,typedUnits)-distance)/length,accuracy=method==='word-levenshtein'?Math.min(wordAccuracy,100*Math.max(0,Math.max(total,count)-minimumCharEdits)/Math.max(total,count,1)):wordAccuracy;
 const correct=method==='levenshtein'?Math.max(0,Math.min(total,count,length-distance)):Math.round(total*accuracy/100);
 return {correct,total,typed:count,distance,accuracy,method,expectedUnits,typedUnits,minimumCharEdits};
}
