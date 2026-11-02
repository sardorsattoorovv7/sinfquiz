import test from 'node:test';
import assert from 'node:assert/strict';
import {ffprobePath} from '../server/speaking/audio-tool.js';
import {probeAudio} from '../server/speaking/worker.js';

test('bundled ffprobe verifies actual PCM audio duration; custom paths are respected',async()=>{
 const seconds=1,sampleRate=16000,bytes=Buffer.alloc(44+seconds*sampleRate*2);
 bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVE',8);bytes.write('fmt ',12);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(sampleRate,24);bytes.writeUInt32LE(sampleRate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(bytes.length-44,40);
 assert.equal(ffprobePath({SPEAKING_FFPROBE_PATH:'custom-probe'}),'custom-probe');
 assert.ok(Math.abs(await probeAudio(bytes,'audio/wav',{env:{}})-seconds)<0.01);
});
