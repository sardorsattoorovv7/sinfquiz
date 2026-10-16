// Reproducible, offline generator. No music download at install or build time.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {encodeMidi,parseMidi,guideGroups} from '../src/piano-music.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const data=JSON.parse(await fs.readFile(path.join(root,'data/piano-expansion-7.39.json'),'utf8'));
const output=path.join(root,'public/piano/expansion-7.39');
await fs.mkdir(output,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),scores=[],report=[];
for(const input of data.tracks){
 const events=input.events.filter(n=>30-n.time>=.032).map(n=>({...n,hand:'right',duration:Math.min(n.duration,30-n.time)}));
 if(events.length<15||events.some(n=>n.midi<21||n.midi>108||n.time<0||n.duration<=0))throw Error('Invalid melody: '+input.title);
 const tempo=input.bpm||input.teachingBpm||64;
 const bytes=encodeMidi(events,{tempo});
 const parsed=parseMidi(bytes.buffer,{channelHands:{0:'right'}});
 // MIDI import normally trims leading silence. Retain a score's pickup rest
 // in the lesson as well as in its downloadable file.
 const origin=events.reduce((s,n)=>Math.min(s,n.time),Infinity);
 const final=parsed.events.map(n=>({...n,time:n.time+origin}));
 if(final.some(n=>n.time+n.duration>30.003))throw Error('Excerpt extends beyond 30 seconds: '+input.title);
 const {events:sourceEvents,sourceSha256,sourceDownloadUrl,sourceDuration,sourceLicense,selection,rhythm,teachingBpm,meter,officialMetadataUrl,...meta}=input;
 const rows=final.map(n=>[+n.time.toFixed(5),n.midi,+n.duration.toFixed(5),+n.velocity.toFixed(5)]);
 scores.push({...meta,bpm:+tempo.toFixed(2),kind:'ready',duration:30,
  sourceMidi:'/piano/expansion-7.39/'+input.id+'.mid',credit:input.sourceCredit,
  sourceLabel:input.sourceType==='ready-midi'?'Tayyor MIDI manbasi':'Nota manbasi',
  arrangementLabel:input.sourceType==='ready-midi'?'Tayyor MIDI · melodiya':'Notadan tayyorlangan',rows});
 await fs.writeFile(path.join(output,input.id+'.mid'),bytes);
 report.push({id:input.id,title:input.title,sourceType:input.sourceType,sourceUrl:input.sourceUrl,
  sourceSha256:input.sourceSha256,sourceDownloadUrl:input.sourceDownloadUrl||null,sourceCredit:input.sourceCredit,
  sourceLicense:input.sourceLicense||null,section:input.section,selection:input.selection||null,
  sourceDuration:input.sourceDuration||null,rhythm:input.rhythm||null,simplifiedRhythm:input.simplifiedRhythm||false,
  clipLength:30,leadingRest:origin,bpm:+tempo.toFixed(2),notes:final.length,rightHandSteps:guideGroups(final,'right').length,
  clipSha256:sha(bytes),clipBytes:bytes.length,melodyOnly:true,generatedAccompaniment:false});
}
await fs.writeFile(path.join(root,'src/piano-expansion-ready.js'),
 '// Generated offline by scripts/build-expanded-piano.mjs; sources: data/piano-expansion-7.39.json.\n'
 +'// Composition and arrangement rights remain with their holders.\nconst scores='+JSON.stringify(scores)+';\n'
 +"export const NEW_SONGS=scores.map(({rows,...track})=>({...track,events:rows.map(([time,midi,duration,velocity])=>({time,midi,duration,velocity,hand:'right'}))}));\n");
const result={checkedAt:data.checkedAt,rights:data.rights,tracks:report};
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({tracks:scores.length,notes:report.reduce((s,t)=>s+t.notes,0),midiBytes:report.reduce((s,t)=>s+t.clipBytes,0),report}));
