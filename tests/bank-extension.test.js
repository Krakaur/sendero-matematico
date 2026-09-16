import test from 'node:test';import assert from 'node:assert/strict';
import {EXTRA_BANK} from '../web/bank-extra.js';import {validBankQuestion} from '../web/bank.js';
test('Extension answers are correct, alternatives distinct, and old content is separately versioned',()=>{
 const ids=new Set(),prompts=new Set(),practice=new Set(EXTRA_BANK.filter(q=>q.pool==='practice').map(q=>q.template));
 for(const q of EXTRA_BANK){
  assert(!ids.has(q.id));ids.add(q.id);assert(!prompts.has(q.prompt));prompts.add(q.prompt);
  if(q.family==='posicion')assert.equal(q.answer,10*q.a+q.b);
  if(q.family==='unidades')assert.equal(q.answer,10*q.a);
  if(q.family==='comparacion')assert.equal(q.answer,Math.min(q.a,q.b));
  if(q.family==='decimal')assert.equal(Math.round(Number(q.labels[q.answer].replace(',','.'))*10),q.a+q.b);
  if(q.family==='equivalencia'){
   const equivalents=q.labels.map(x=>x.split('/').map(Number)).map(([a,b])=>a*q.b===b*q.a);
   assert.equal(equivalents.filter(Boolean).length,1);assert(equivalents[q.answer]);
  }
  if(q.labels)assert.equal(new Set(q.labels).size,4);
  assert.equal(q.contentVersion,'0.4.0');if(q.pool==='transfer')assert(!practice.has(q.template));
  const answered={...q,bankId:q.id,bankVersion:q.contentVersion,attempts:[q.answer]};assert(validBankQuestion(answered));
  assert(!validBankQuestion({...answered,bankVersion:'0.3.0'}));
 }
 assert.equal(EXTRA_BANK.length,360);
});
