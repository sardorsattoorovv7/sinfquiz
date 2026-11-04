import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {typingApostrophes,typingContentApostrophes} from '../src/typing-punctuation.js';
import {typingMatch} from '../src/competition-typing.js';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('typing course prompts use a keyboard apostrophe and preserve exact non-apostrophe grading',()=>{
 for(const file of ['data/typing-lessons.json','data/english-typing-lessons.json']){
  const source=read(file),data=JSON.parse(source);assert.ok(data.length>0);
  assert.doesNotMatch(source,/[\u2018\u2019\u02bb\u02bc\uff07]/);
  for(const item of data){assert.equal(typingMatch(item.text,item.text).accuracy,100);assert.ok(typingMatch(item.text,item.text+'!').accuracy<100);}
 }
 const old="O‘quvchi ma’lumotni o‘qiydi, gʻoya bilan oʻrtoqlashadi.";
 const expected="O'quvchi ma'lumotni o'qiydi, g'oya bilan o'rtoqlashadi.";
 assert.equal(typingApostrophes(old),expected);assert.equal(typingMatch(expected,typingApostrophes(old)).accuracy,100);
 assert.notEqual(typingApostrophes('A, B.'),typingApostrophes('a B'));
});

test('fresh Supabase typing seeds agree with the canonical local long-text course',()=>{
 const lines=read('supabase-migration-7.28.sql').split(/\r?\n/).filter(l=>l.startsWith('insert into public.sq_typing_content('));assert.equal(lines.length,7);
 for(const line of lines){const first=line.indexOf("'["),end=line.lastIndexOf("]'::jsonb"),data=JSON.parse(line.slice(first+1,end+1).replaceAll("''","'"));assert.deepEqual(typingContentApostrophes(data),data);if(line.includes("('longtext','ALL'"))assert.deepEqual(data.map(x=>x.text),JSON.parse(read('data/typing-lessons.json')).map(x=>x.text));}
});

test('existing-database content patch is repeatable and preserves active attempts and result history',async()=>{
 const db=new PGlite();
 try{
  await db.exec('create table sq_typing_content(mode text,level text,stages jsonb); create table sq_typing_sessions(data jsonb); create table typing_results(data jsonb);');
  const original=[{id:'existing-id',text:'O‘quvchi ma’lumotni o‘qiydi.',words:[{meaning:'gʻoya'}],level:2}];
  await db.query('insert into sq_typing_content values($1,$2,$3)',['longtext','ALL',JSON.stringify(original)]);
  await db.query('insert into sq_typing_sessions values($1)',[JSON.stringify({stages:original,index:1,score:87})]);
  await db.query('insert into typing_results values($1)',[JSON.stringify({accuracy:97.4,wpm:42})]);
  await db.exec(read('supabase-typing-apostrophes.sql'));await db.exec(read('supabase-typing-apostrophes.sql'));
  assert.deepEqual((await db.query('select stages from sq_typing_content')).rows[0].stages,typingContentApostrophes(original));
  assert.deepEqual((await db.query('select data from sq_typing_sessions')).rows[0].data,{stages:original,index:1,score:87});
  assert.deepEqual((await db.query('select data from typing_results')).rows[0].data,{accuracy:97.4,wpm:42});
 }finally{await db.close();}
});
