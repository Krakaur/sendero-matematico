import test from 'node:test';import assert from 'node:assert/strict';import {newRace,raceStats,raceLevel,rivalProgress} from '../web/race.js';
test('Virtual race calibration, positions and rewards remain separate from school scores',()=>{
 const s={race:newRace([],'suma',2,1),questions:[]};assert.equal(s.race.calibrationN,0);assert.equal(s.race.protocol,3);
 assert.equal(raceStats(s,10000).rank,4);
 s.questions=Array.from({length:8},()=>({done:true,answer:3,attempts:[3],hint:false}));
 assert.equal(raceStats(s,1000).rank,1);assert.equal(raceStats(s,200000).rank,4);assert.equal(raceStats(s).points,120);assert.equal(raceLevel(s),3);
 s.questions.forEach(q=>q.attempts=[2,3]);assert.equal(raceStats(s).points,80);assert.equal(raceLevel(s),1);
 const history=[{trail:'suma',questions:Array.from({length:6},()=>({level:2,timingProtocol:1,firstResponseMs:2000,activeMs:2000,done:true,answer:4,attempts:[4]}))}];
 assert(newRace(history,'suma',2).finishMs[1]<s.race.finishMs[1]);assert.equal(newRace(history,'multi',2).calibrationN,0);
});

test('Seeded rivals vary finish orders and pace while preserving trajectories after save/reload',()=>{
 const orders=new Set(); let leadChanges=0;
 for(let seed=1;seed<=10;seed++) {
  const race=newRace([],'multi',1,seed),restored=JSON.parse(JSON.stringify(race));
  assert.deepEqual(race,newRace([],'multi',1,seed));
  orders.add(race.finishMs.map((ms,i)=>[ms,i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(''));
  let previousOrder;
  for(let ms=0;ms<=80000;ms+=100) {
   const positions=race.finishMs.map((_,i)=>rivalProgress(race,i,ms));
   assert.deepEqual(positions,restored.finishMs.map((_,i)=>rivalProgress(restored,i,ms)));
   positions.forEach((p,i)=>{assert(p>=0&&p<=1);assert(p>=rivalProgress(race,i,ms-100));});
   const order=positions.map((p,i)=>[p,i]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]).join('');
   if(ms>100 && ms<Math.min(...race.finishMs) && previousOrder!==order)leadChanges++;
   previousOrder=order;
  }
  race.finishMs.forEach((ms,i)=>{assert.equal(rivalProgress(race,i,0),0);assert.equal(rivalProgress(race,i,ms),1);});
 }
 assert(orders.size>=2); assert(leadChanges>0,'Rivals should overtake each other');
});

test('Faster answers cannot worsen rank under the same seed, and answers do not change the rivals',()=>{
 const q=()=>({done:true,answer:4,attempts:[4],hint:false});
 for(let seed=1;seed<=10;seed++) {
  const race=newRace([],'multi',1,seed),initial=JSON.stringify(race);
  for(let completed=1;completed<=8;completed++) {
   const s={race,questions:Array.from({length:completed},q)};
   const ranks=[3000,6000,10000].map(delay=>raceStats(s,completed*delay).rank);
   assert(ranks[0]<=ranks[1] && ranks[1]<=ranks[2]);
   const atTime=raceStats(s,20000).bots;
   assert.deepEqual(atTime,raceStats({race,questions:[]},20000).bots);
   assert.equal(JSON.stringify(race),initial);
  }
 }
});

test('Legacy pending races and completed reports retain their original linear positions and finish order',()=>{
 const race={protocol:1,level:2,elapsedMs:15000,finishMs:[60000,50000,40000],names:['Nube','Rayo','Chispa']};
 const s={race,questions:[{done:true,answer:2,attempts:[2]}]};
 assert.deepEqual(raceStats(s).bots,[.25,.3,.375]); assert.equal(raceStats(s).rank,4);
 s.questions=Array.from({length:8},()=>({done:true,answer:2,attempts:[2]}));
 assert.equal(raceStats(s,50000).rank,2); assert.equal(raceStats(s,60001).rank,4);
});
