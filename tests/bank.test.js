import test from 'node:test';
import assert from 'node:assert/strict';
import { BANK } from '../web/bank-data.js';
import { bankQuestion, validBankQuestion, reasoningDimensions } from '../web/bank.js';
import { adapt, makeQuestion, recordAttempt, validateReport, SCHEMA } from '../web/core.js';
import { rememberPractice, practiceQuestion } from '../web/practice.js';

test('Every bank item has a unique prompt, a coherent answer and four valid choices',()=>{
  const ids=new Set(),prompts=new Set();
  for(const q of BANK){
    assert(!ids.has(q.id));ids.add(q.id);assert(!prompts.has(q.prompt));prompts.add(q.prompt);
    const a=q.a,b=q.b;
    const expected={reunir:a+b,quitar:a,completar:b,comparar:b,grupos:a*b,repartir:b,agrupar:a,dos_pasos:a*b-a,perimetro:2*(a+b),area:a*b,fraccion:b,datos:a+b,patron:4*a,tiempo:b,representar:0,dato_faltante:0}[q.family];
    assert.equal(q.answer,expected,q.id);assert.equal(new Set(q.options).size,4);assert(q.options.includes(q.answer));
    assert(!/[{}]/.test(q.prompt));assert(q.prompt.endsWith('?'));assert(q.explanation.length>20);
    assert(q.options.every(n=>Number.isInteger(n)&&n>=0));
    if(q.labels)assert.equal(new Set(q.labels).size,4);
  }
});
test('Reserved situations have no templates in common with practice',()=>{
  const practice=new Set(BANK.filter(q=>q.pool==='practice').map(q=>q.template));
  for(const q of BANK.filter(q=>q.pool==='transfer'))assert(!practice.has(q.template));
});
test('Selection never repeats an item before exhausting its pool, survives restart and isolates profiles',()=>{
  let p={};const other={};const ids=new Set();const count=BANK.filter(q=>q.level===1&&q.pool==='practice').length;
  for(let i=0;i<count;i++){const q=bankQuestion(p,1,false);assert(!ids.has(q.id));ids.add(q.id);assert(q.novel);if(i===100)p=JSON.parse(JSON.stringify(p));}
  assert.equal(bankQuestion(p,1,false).novel,false);assert.equal(bankQuestion(other,1,false).novel,true);
  assert.equal(bankQuestion(p,1,true).pool,'transfer');
});
test('Recent wording is avoided while alternatives remain',()=>{
  const p={};let recent=[];
  for(let i=0;i<100;i++){const q=bankQuestion(p,3);assert(!recent.includes(q.template));recent=[...recent,q.template].slice(-8);}
});
test('Bank report round trip verifies original content and separates assisted transfer',()=>{
  const p={};const qs=Array.from({length:8},(_,i)=>bankQuestion(p,2,i===7));
  for(const q of qs)recordAttempt(q,q.answer);qs[7].hint=true;
  const report={schema:SCHEMA,profile:'test',sessions:[{id:'session',profile:'test',trail:'razonar',level:2,version:'0.3.0',startedAt:new Date().toISOString(),completedAt:new Date().toISOString(),questions:qs}]};
  validateReport(report);assert.equal(reasoningDimensions(report.sessions)['Situaciones reservadas'].independent,0);
  qs[0].prompt='Un enunciado manipulado';assert(!validBankQuestion(qs[0]));assert.throws(()=>validateReport(report));
});
test('Extended tables reach both factors 20 and reasoning needs six independent answers',()=>{
  let calls=0;const q=makeQuestion('tablas20',4,()=>++calls<=2?0.999:Math.random());assert.equal(q.a,20);assert.equal(q.b,20);assert.equal(q.answer,400);
  const item=bankQuestion({},1);recordAttempt(item,item.answer);assert.equal(adapt({level:1,streak:4},item).level,1);assert.equal(adapt({level:1,streak:5},item).level,2);
});
test('Assisted facts return sooner and only in the matching arithmetic track and level',()=>{
  const p={},q={a:4,b:7,answer:28,level:2,attempts:[27,28],hint:false};
  rememberPractice(p,'multi',q);assert.equal(p.practiceMemory.multi.facts['4:7'].due,3);
  p.practiceMemory.multi.step=10;
  let seed=11;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  const results=Array.from({length:100},()=>practiceQuestion(p,'multi',2,rng));
  assert(results.some(q=>q.review&&q.a===4&&q.b===7));
  assert(!practiceQuestion(p,'tablas20',2,rng).review);
  assert(!practiceQuestion(p,'multi',1,rng).review);
  q.attempts=[28];rememberPractice(p,'multi',q);assert.equal(p.practiceMemory.multi.facts['4:7'].due,16);
});
