import test from 'node:test';
import assert from 'node:assert/strict';
import {finishSummary} from '../web/race-finish.js';

const session=elapsed=>({race:{protocol:1,elapsedMs:elapsed,finishMs:[50000,40000,60000],names:['Nube','Rayo','Chispa']},questions:Array.from({length:8},()=>({done:true,answer:6,attempts:[6],hint:false}))});
test('Finish standings distinguish arrived rivals from those still on the river',()=>{
  const s=session(45000),before=JSON.stringify(s),r=finishSummary(s,'Luma');
  assert.equal(r.rank,2);assert.equal(r.standings.find(e=>e.player).place,2);
  assert.deepEqual(r.standings.map(e=>e.name),['Rayo','Luma','Nube','Chispa']);
  assert.deepEqual(r.standings.map(e=>e.arrived),[true,true,false,false]);
  assert.equal(r.standings[2].place,null);assert.equal(JSON.stringify(s),before);
});
test('Finish standings retain exact ties, first and fourth place',()=>{
  const tie=finishSummary(session(40000));
  assert.equal(tie.rank,1);assert.equal(tie.standings.find(e=>e.player).place,1);
  assert.equal(tie.standings.find(e=>e.name==='Rayo').place,1);
  assert.equal(finishSummary(session(20000)).rank,1);
  assert.equal(finishSummary(session(70000)).rank,4);
});
test('The recap distinguishes initial accuracy, recovery and unassisted game rewards',()=>{
  const s=session(45000);s.questions[2].attempts=[5,6];s.questions[4].hint=true;
  const r=finishSummary(s);
  assert.equal(r.initialCorrect,7);assert.equal(r.recovered,1);assert.equal(r.points,110);assert.equal(r.best,3);
});
