import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {englishDb, ids} from './english-fixture.js';

test('7.23.1: safe rerunnable upgrade, draft version conflicts, exact-token recovery, audio invalidation and class privacy', async () => {
 const {db, login, rpc, raw, owner} = await englishDb();
 try {
  await login(ids.student); let check = await rpc('checkStart', {kind: 'placement'});
  for (let i = 0; i < 4; i++) check = await rpc('checkAnswer', {id: check.id, cursor: i, skip: true});
  const work = (await rpc('begin', {baseId: 'en-pre-01'})).run, lesson = await raw('en-pre-01');
  // An installed 7.23 work has no draftVersion yet; no destructive data migration is needed.
  const before = await owner(() => db.query('select * from public.sq_en_runs'));
  const content = await owner(() => db.query('select id,revision,payload from public.sq_en_content order by id,revision'));
  const upgrade = readFileSync(new URL('../supabase-migration-7.23.1.sql', import.meta.url), 'utf8');
  await owner(() => db.exec(upgrade)); await owner(() => db.exec(upgrade));
  assert.deepEqual((await owner(() => db.query('select * from public.sq_en_runs'))).rows, before.rows);
  assert.deepEqual((await owner(() => db.query('select id,revision,payload from public.sq_en_content order by id,revision'))).rows, content.rows);
  await assert.rejects(db.query('select * from public.sq_en_content'));
  const path = `${ids.student}/${work.id}/recording.webm`;
  await db.query('insert into storage.objects(bucket_id,name) values($1,$2)', ['english-recordings', path]);
  const token = crypto.randomUUID(), firstBody = {id: work.id, writing: 'First device', speaking: {mode: 'recording', path}, expectedDraftVersion: 0, token};
  const first = await rpc('save', firstBody); assert.equal(first.state.draftVersion, 1);
  await rpc('save', {id: work.id, writing: 'Second device', expectedDraftVersion: 1});
  assert.deepEqual(await rpc('save', firstBody), first, 'committed request may be retried after response loss');
  await assert.rejects(rpc('save', {id: work.id, writing: 'Stale device', expectedDraftVersion: 0}), e => e.code === 'P7231');
  let run = (await rpc('run', {id: work.id})).run; assert.equal(run.state.writing, 'Second device');
  run = await rpc('save', {id: work.id, speaking: {mode: 'draft'}, expectedDraftVersion: 2});
  assert.deepEqual(run.state.speaking, {mode: 'draft'}); assert.equal(run.state.draftVersion, 3);
  await rpc('save', {id: work.id, completed: ['learn', 'vocabulary', 'listening'], writing: lesson.writing.model});
  for (const q of [...lesson.exercises, ...lesson.reading.questions, ...lesson.listening.questions]) await rpc('attempt', {id: work.id, questionId: q.id, answer: ['matching', 'table', 'collocation'].includes(q.type) ? q.answers : q.answers[0], heard: !!q.audio});
  await rpc('exit', {id: work.id, answers: Object.fromEntries(lesson.exit[0].map(q => [q.id, q.answers[0]]))});
  await assert.rejects(rpc('submit', {id: work.id}), /Speaking namunasini/);
  run = await rpc('save', {id: work.id, speaking: {mode: 'recording', path}});
  await assert.rejects(rpc('submit', {id: work.id, expectedDraftVersion: 0}), e => e.code === 'P7231');
  assert.equal((await rpc('submit', {id: work.id, expectedDraftVersion: run.state.draftVersion})).status, 'submitted');
  await assert.rejects(rpc('save', {id: work.id, speaking: {mode: 'draft'}}), /Topshirilgan/);
  let sample = await rpc('checkSave', {id: check.id, writing: 'My placement writing sample.', expectedDraftVersion: 0});
  assert.equal(sample.state.draftVersion, 1); assert.ok(sample.updatedAt);
  await assert.rejects(rpc('checkSave', {id: check.id, writing: 'Stale sample.', expectedDraftVersion: 0}), e => e.code === 'P7231');
  await rpc('checkSave', {id: check.id, speaking: {mode: 'draft'}, expectedDraftVersion: 1});
  await assert.rejects(rpc('checkSubmit', {id: check.id, writing: 'A full placement sample has more than thirty letters.', speaking: {mode: 'draft'}}), /to‘liq topshiring/);
  await login(ids.stranger); await assert.rejects(rpc('checkSave', {id: check.id, writing: 'Wrong owner'})); assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
  await login(ids.other); assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
  await login(ids.teacher); assert.equal((await db.query('select * from storage.objects')).rows.length, 1);
 } finally { await db.close(); }
});
