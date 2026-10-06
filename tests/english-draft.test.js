import test from 'node:test';
import assert from 'node:assert/strict';
import {DraftStore} from '../src/english-course/draft-store.js';
const memory = () => { const data = new Map(); return {getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value)}; };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return {promise, resolve, reject}; };
const make = options => new DraftStore({key: 'uid:work', work: {id: 'work', status: 'started', state: {writing: 'Server copy'}}, defaults: {writing: '', speaking: {}}, storage: memory(), delay: 100000, ...options});

test('course draft: changes made during a slow save are flushed in order before leaving', async () => {
 const first = deferred(), calls = []; const draft = make({send: async body => {
  calls.push(body); if (calls.length === 1) await first.promise;
  return {id: 'work', status: 'started', state: {...body, draftVersion: calls.length}};
 }});
 try {
  draft.update({writing: 'First edit'}); const sending = draft.flush();
  draft.update({writing: 'Newest edit', speaking: {mode: 'draft'}});
  const leaving = draft.flush(); first.resolve(); await Promise.all([sending, leaving]);
  assert.equal(calls.length, 2); assert.equal(calls[1].writing, 'Newest edit'); assert.equal(calls[1].expectedDraftVersion, 1);
  assert.notEqual(calls[0].token, calls[1].token); assert.equal(draft.dirty, false); assert.equal(draft.version, 2);
 } finally { draft.dispose(); }
});

test('course draft: lost response survives refresh and retries the exact token before newer edits', async () => {
 const storage = memory(), calls = []; const first = make({storage, send: async body => { calls.push(body); throw Error('Connection lost after commit'); }});
 first.update({writing: 'Saved but response lost', speaking: {mode: 'draft'}});
 await assert.rejects(first.flush(), /Connection lost/); first.dispose();
 const recovered = make({storage, work: {id: 'work', status: 'started', state: {writing: 'Saved but response lost', draftVersion: 1}}, send: async body => {
  calls.push(body); return {id: 'work', status: 'started', state: {writing: body.writing, speaking: body.speaking, draftVersion: calls.length - 1}};
 }});
 try {
  recovered.update({writing: 'Edit while offline'}); await recovered.flush();
  assert.deepEqual(calls[0], calls[1]); assert.equal(calls[2].expectedDraftVersion, 1); assert.equal(calls[2].writing, 'Edit while offline');
  assert.equal(recovered.draft.speaking.mode, 'draft'); assert.equal(recovered.dirty, false);
 } finally { recovered.dispose(); }
});

test('course draft: stale clean cache and submitted local text cannot overwrite server work', () => {
 const storage = memory(); storage.setItem('uid:work', JSON.stringify({format: 2, dirty: false, version: 1, draft: {writing: 'Old local copy'}}));
 const draft = make({storage, work: {id: 'work', status: 'started', state: {writing: 'New remote copy', draftVersion: 2}}});
 assert.equal(draft.draft.writing, 'New remote copy'); assert.equal(draft.dirty, false);
 storage.setItem('uid:work', JSON.stringify({format: 2, dirty: true, version: 1, draft: {writing: 'Unsent edit'}}));
 const readonly = make({storage, work: {id: 'work', status: 'submitted', state: {writing: 'Actual submitted text', speaking: {mode: 'live', note: 'Actual note'}}}});
 assert.equal(readonly.draft.writing, 'Actual submitted text'); assert.equal(readonly.draft.speaking.note, 'Actual note');
 assert.match(storage.getItem('uid:work:recovery'), /Unsent edit/);
 draft.dispose(); readonly.dispose();
});

test('course draft: server success stays successful when localStorage is unavailable', async () => {
 let count = 0; const draft = make({storage: {getItem: () => null, setItem: () => { throw Error('Quota'); }}, send: async body => {
  count++; return {id: 'work', status: 'started', state: {writing: body.writing, draftVersion: count}};
 }});
 try { draft.update({writing: 'Saved to account'}); await draft.flush(); assert.equal(count, 1); assert.equal(draft.dirty, false); assert.equal(draft.error, ''); assert.match(draft.sync, /Hisobga saqlandi/); }
 finally { draft.dispose(); }
});

test('course draft: conflicts retain local text and require an explicit version choice', async () => {
 const remote = {id: 'work', status: 'started', state: {writing: 'Other device', draftVersion: 4}};
 const calls = [], draft = make({fetchRemote: async () => remote, send: async body => {
  calls.push(body); if (body.expectedDraftVersion !== 4) throw Object.assign(Error('Other device updated this work'), {code: 'P7231'});
  return {...remote, state: {writing: body.writing, draftVersion: 5}};
 }});
 try {
  draft.update({writing: 'Keep my local text'}); await assert.rejects(draft.flush()); assert.equal(draft.conflict, true); assert.equal(draft.draft.writing, 'Keep my local text');
  await assert.rejects(draft.flush()); assert.equal(calls.length, 1, 'no silent overwrite or retry loop');
  await draft.resolveConflict(true); assert.equal(calls[1].expectedDraftVersion, 4); assert.equal(draft.draft.writing, 'Keep my local text'); assert.equal(draft.version, 5);
 } finally { draft.dispose(); }
 const second = make({fetchRemote: async () => remote, send: async () => remote}); second.update({writing: 'Recovery text'});
 await second.resolveConflict(false); assert.equal(second.draft.writing, 'Other device'); assert.match(second.storage.getItem('uid:work:recovery'), /Recovery text/); second.dispose();
});
