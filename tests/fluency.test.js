import test from 'node:test';
import assert from 'node:assert/strict';
import {fluency,interruptTiming} from '../web/fluency.js';
import {makeQuestion,recordAttempt} from '../web/core.js';
function question(ms,correct=true) {
  const q=makeQuestion('suma',1);q.activeMs=ms;
  recordAttempt(q,correct?q.answer:q.options.find(n=>n!==q.answer));return q;
}
test('Initial errors contribute time, but corrections never add fluency credit',()=>{
  const a=question(2000),b=question(4000,false);
  b.activeMs+=90000;recordAttempt(b,b.answer);
  assert.equal(b.firstResponseMs,4000);
  assert.deepEqual(fluency([a,b]),{n:2,excluded:0,correct:1,ms:6000,rate:10,accuracy:50});
});
test('Legacy, interrupted, assisted, reasoning and zero-duration records are excluded',()=>{
  const legacy=question(1000);delete legacy.timingProtocol;
  const interrupted=makeQuestion('suma',1);interruptTiming(interrupted);interrupted.activeMs=2000;recordAttempt(interrupted,interrupted.answer);
  const assisted=question(1000);assisted.hint=true;
  const bank=question(1000);bank.bankId='reserved';
  assert.equal(fluency([legacy,interrupted,assisted,bank,question(0)]).rate,null);
  assert.equal(fluency([question(1000),legacy,interrupted,assisted,bank,question(0)]).excluded,5);
});
test('Rates use pooled durations, not the mean of per-item rates',()=>{
  assert.equal(fluency([question(1000),question(9000)]).rate,12);
});
test('Interruption after the first answer does not invalidate captured response time',()=>{
  const q=question(1000,false);interruptTiming(q);assert.equal(q.timingInterrupted,false);
  recordAttempt(q,q.answer);assert.equal(fluency([q]).rate,0);
});
