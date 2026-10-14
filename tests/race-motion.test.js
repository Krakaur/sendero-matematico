import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceBoat,projectCourse} from '../web/race-motion.js';
import {newRace,rivalProgress,raceStats} from '../web/race.js';

test('Impulse motion is frame-rate independent, responds continuously and never grants free distance',()=>{
 const states=[30,60,120].map(fps=>{
  let s={position:0,velocity:0};
  for(let f=0;f<fps*8;f++){
   const target=f<fps*3?.125:.25,old=s.position;
   s=advanceBoat(s.position,s.velocity,target,1/fps);
   assert(s.position>=old&&s.position<=target&&s.velocity>=0);
  }
  return s;
 });
 assert(Math.abs(states[0].position-states[2].position)<1e-12);
 assert.deepEqual(advanceBoat(.2,.01,.25,0),{position:.2,velocity:.01});
 assert.deepEqual(advanceBoat(0,0,0,300),{position:0,velocity:0});
 assert(advanceBoat(0,0,.125,.1).position>0,'Visible response begins within 100 ms');
 assert(advanceBoat(0,0,.125,2).position<.125,'Impulse has sustained coasting');
});
test('Camera uses a common world projection and edge markers without clipping boats',()=>{
 for(const width of [280,360,1152])for(let p=0;p<=1;p+=.025)for(let b=0;b<=1;b+=.025){
  const r=projectCourse(b,p,width,88);
  assert(r.x>=40.48&&r.x<=width-40.48);assert(r.camera>=0&&r.camera<=width*1.45);
 }
 const a=projectCourse(.4,.5,1000,100),b=projectCourse(.5,.5,1000,100);
 assert(Math.abs(b.x-a.x-210)<1e-8);
});
test('Every level has attainable competition; choice and seed are fixed before play',()=>{
 const won={gentle:0,balanced:0,challenge:0};let cases=0;
 for(const trail of ['suma','resta','multi','tablas20'])for(let level=1;level<=4;level++)for(const mode of Object.keys(won))for(let seed=0;seed<100;seed++){
  const race=newRace([],trail,level,seed,mode),finish={race,questions:Array.from({length:8},()=>({done:true,answer:4,attempts:[4]}))};
  const rank=raceStats(finish,race.targetMs).rank;
  if(rank===1)won[mode]++;
  if(mode!=='challenge')assert.equal(rank,1,'Reference pace must win approachable settings');
  assert.equal(raceStats(finish,race.targetMs*.9).rank,1,'10% faster pace can win every setting');
  assert.equal(raceStats(finish,race.targetMs*1.6).rank,4,'Competition is not a guaranteed win');
  assert.deepEqual(JSON.parse(JSON.stringify(race)),newRace([],trail,level,seed,mode));cases++;
 }
 assert.equal(cases,4800);assert.equal(won.balanced,1600);assert.equal(won.gentle,1600);assert.equal(won.challenge,0);
});
test('Calibration measures successful resolution including corrections, with explicit level fallback',()=>{
 const q={done:true,answer:6,attempts:[5,6],activeMs:18000,firstResponseMs:600,level:2,timingProtocol:1};
 const history=[{trail:'multi',questions:Array.from({length:8},()=>({...q}))}];
 const r=newRace(history,'multi',2,1);assert.equal(r.referencePaceMs,18000);assert.equal(r.paceSource,'same-level');
 assert.equal(newRace(history,'multi',3,1).referencePaceMs,21600);
 assert.equal(newRace(history,'multi',1,1).referencePaceMs,15000);
 assert.equal(newRace(history,'suma',2,1).paceSource,'initial-level');
 for(const change of [{done:false},{attempts:[5]},{hint:true},{timingInterrupted:true},{activeMs:0}]){
  assert.equal(newRace([{trail:'multi',questions:history[0].questions.map(x=>({...x,...change}))}],'multi',2,1).calibrationN,0);
 }
 const slow=[{trail:'multi',questions:history[0].questions.map(x=>({...x,activeMs:60000}))}];
 assert.equal(newRace(slow,'multi',2,1).targetMs,480000,'No old 160-second cap for slower learners');
 assert(newRace([],'multi',4,1).targetMs>newRace([],'multi',1,1).targetMs);
});
test('Protocol 2 saved trajectories retain their exact historical curve',()=>{
 const race={protocol:2,finishMs:[50000,60000,70000],cadence:[{launch:.3,swing:.21,phase:1,waves:1}]};
 const t=.3,w=2*Math.PI,expected=t+.3*t*(1-t)+.21*(Math.sin(w*t+1)-Math.sin(1))/w;
 assert.equal(rivalProgress(race,0,15000),expected);
});
