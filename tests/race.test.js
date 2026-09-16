import test from 'node:test';import assert from 'node:assert/strict';import {newRace,raceStats,raceLevel} from '../web/race.js';
test('Virtual race calibration, positions and rewards remain separate from school scores',()=>{
 const s={race:newRace([],'suma',2),questions:[]};assert.equal(s.race.calibrationN,0);assert(s.race.finishMs[0]>s.race.finishMs[2]);
 assert.equal(raceStats(s,10000).rank,4);
 s.questions=Array.from({length:8},()=>({done:true,answer:3,attempts:[3],hint:false}));
 assert.equal(raceStats(s,1000).rank,1);assert.equal(raceStats(s,200000).rank,4);assert.equal(raceStats(s).points,120);assert.equal(raceLevel(s),3);
 s.questions.forEach(q=>q.attempts=[2,3]);assert.equal(raceStats(s).points,80);assert.equal(raceLevel(s),1);
 const history=[{trail:'suma',questions:Array.from({length:6},()=>({level:2,firstResponseMs:2000}))}];
 assert(newRace(history,'suma',2).finishMs[1]<s.race.finishMs[1]);assert.equal(newRace(history,'multi',2).calibrationN,0);
});
