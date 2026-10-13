import test from 'node:test';
import assert from 'node:assert/strict';
import {newSession} from '../web/core.js';
import {newRace} from '../web/race.js';
import {needsRaceStart,releaseRace,countdownNumber} from '../web/race-start.js';

const prepared=()=>{const s=newSession('multi',1,'test');s.race={...newRace([],'multi',1,123),launch:'ready'};return s;};
test('Only explicitly prepared, untouched races need a start; legacy and resumed races remain playable',()=>{
  const s=prepared();assert.equal(needsRaceStart(s),true);
  const legacy=structuredClone(s);delete legacy.race.launch;assert.equal(needsRaceStart(legacy),false);
  assert.equal(needsRaceStart({...s,race:undefined}),false);
  assert.equal(needsRaceStart({...s,completedAt:'2026-10-13T22:00:00Z'}),false);
  assert.equal(needsRaceStart({...s,index:1}),false);
  s.questions[0].attempts=[s.questions[0].answer];assert.equal(needsRaceStart(s),false);
});
test('Starting is idempotent and preserves calibration, questions and zero response time',()=>{
  const s=prepared(),before=structuredClone(s),at='2026-10-13T22:00:00Z';
  assert.equal(releaseRace(s,at),true);assert.equal(releaseRace(s,'2026-10-14T22:00:00Z'),false);
  assert.equal(s.startedAt,at);assert.equal(s.race.launch,'running');
  const {launch,...race}=s.race,{launch:oldLaunch,...expected}=before.race;
  assert.deepEqual(race,expected);assert.deepEqual(s.questions,before.questions);
  assert.equal(s.race.elapsedMs,0);assert.equal(s.questions[0].activeMs,0);assert.equal(s.questions[0].timingInterrupted,false);
});
test('Preparation survives serialization without consuming or rerolling a race',()=>{
  const s=prepared(),loaded=JSON.parse(JSON.stringify(s));
  assert.equal(needsRaceStart(loaded),true);assert.equal(loaded.id,s.id);assert.deepEqual(loaded.race,s.race);
});
test('Countdown uses elapsed time and reaches release after three 700ms beats',()=>{
  assert.deepEqual([-1,0,699,700,1399,1400,2099,2100,10000].map(countdownNumber),[3,3,3,2,2,1,1,0,0]);
});
