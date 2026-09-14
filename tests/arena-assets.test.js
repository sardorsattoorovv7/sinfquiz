import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url)));

test('Bundled GLB has a rigged model and the ready-made motion clips used by the arena',()=>{
 const file=join(root,'public/models/RobotExpressive.glb'),data=readFileSync(file),text=data.toString('utf8');
 assert.equal(data.subarray(0,4).toString(),'glTF');
 assert.ok(statSync(file).size>400000);
 for(const clip of ['Idle','Wave','Punch','No','Dance','ThumbsUp','Running'])assert.ok(text.includes(clip),clip);
 const arena=readFileSync(join(root,'src/KurashArena.jsx'),'utf8');
 assert.match(arena,/GLTFLoader/);
 assert.doesNotMatch(arena,/kurashPose/);
});
