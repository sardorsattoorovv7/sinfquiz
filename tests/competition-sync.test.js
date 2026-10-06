import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompetitionSync} from '../src/competition-sync.js';
import {typingDistance,typingMatch} from '../src/competition-typing.js';
function clock(){let now=0,id=0;const jobs=new Map();return {get now(){return now},schedule(fn,ms){const key=++id;jobs.set(key,{fn,at:now+ms});return key},cancel(key){jobs.delete(key)},async advance(ms){const end=now+ms;for(;;){const next=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;jobs.delete(next[0]);next[1].fn();await Promise.resolve();await Promise.resolve()}now=end},count:()=>jobs.size}}
test('Realtime bursts are coalesced, pending refresh never runs concurrently and stop clears all work',async()=>{
 const c=clock();let calls=0,release;const sync=createCompetitionSync({schedule:c.schedule,cancel:c.cancel,random:()=>.5,refresh:()=>{calls++;return new Promise(r=>release=r)}});
 sync.start();assert.equal(calls,1);for(let n=0;n<40;n++)sync.signal();await c.advance(2200);assert.equal(calls,1);
 release(true);await Promise.resolve();await c.advance(300);assert.equal(calls,2);release(true);await Promise.resolve();sync.stop();await c.advance(60000);assert.equal(calls,2);assert.equal(c.count(),0);
});
test('Hidden/offline rooms do not fetch; failures back off and resume restores the connection',async()=>{
 const c=clock();let visible=false,calls=0,success=false;const sync=createCompetitionSync({schedule:c.schedule,cancel:c.cancel,random:()=>.5,active:()=>visible,refresh:async()=>{calls++;return success}});
 sync.start();await c.advance(30000);assert.equal(calls,0);visible=true;sync.resume();await Promise.resolve();assert.equal(calls,1);await c.advance(29999);assert.equal(calls,1);await c.advance(1);assert.equal(calls,2);
 success=true;sync.resume();await Promise.resolve();assert.equal(calls,3);visible=false;await c.advance(60000);assert.equal(calls,3);sync.stop();
});
test('40 fallback clients spread poll requests over time; live mode uses fewer periodic requests',async()=>{
 const measure=async live=>{const c=clock(),hits=[];const syncs=Array.from({length:40},(_,n)=>{const sync=createCompetitionSync({schedule:c.schedule,cancel:c.cancel,random:()=>n/40,refresh:async()=>{hits.push(c.now);return true}});sync.start();if(live)sync.connected(true);return sync});await Promise.resolve();await c.advance(60000);syncs.forEach(s=>s.stop());return hits};
 const fallback=await measure(false),live=await measure(true);assert.ok(live.length<fallback.length);
 const buckets=new Map();for(const t of fallback.filter(t=>t>0&&t<20000)){const b=Math.floor(t/1000);buckets.set(b,(buckets.get(b)||0)+1)}
 assert.ok(Math.max(...buckets.values())<10,'fallback requests must not all hit the server at once');
});
test('Typing matches an independent reference on small edits and uses ordered words for heavily different long text',()=>{
 const reference=(a,b)=>{let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(row[j]+1,next[j-1]+1,row[j-1]+Number(a[i-1]!==b[j-1]));row=next}return row[b.length]};
 const alphabet=['','a','b','ab','ba','aaba','abcd','xyz','abc def','abcde fghij'];for(const a of alphabet)for(const b of alphabet)assert.equal(typingDistance(a,b),reference(a,b),JSON.stringify([a,b]));
 const original='I go to school every day.';assert.ok(typingMatch(original,original+' '.repeat(500)).accuracy<10,'extra spaces must not improve the grade when switching to word mode');assert.equal(typingMatch(original,original.slice(1)).distance,1);assert.ok(typingMatch(original,original.slice(1)).accuracy>95);
 const a='abc '.repeat(1000),b='xbc '.repeat(1000),r=typingMatch(a,b);assert.equal(r.method,'word-levenshtein');assert.equal(r.accuracy,0);
 const near='abc '.repeat(1000);assert.equal(typingMatch(near,near.slice(1)).distance,1);assert.equal(typingMatch(near,near.slice(1)).method,'levenshtein');
 assert.ok(typingMatch('a'.repeat(1000)+' b '.repeat(40),' b '.repeat(40)+'a'.repeat(1000)).accuracy<100,'reordered words must not earn full credit');
});
