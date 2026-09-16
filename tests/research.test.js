import test from 'node:test';import assert from 'node:assert/strict';
import {aggregateResearch} from '../research/aggregate.mjs';import {newSession,recordAttempt,SCHEMA} from '../web/core.js';
function report(profile){const s=newSession('suma',1,profile);for(const q of s.questions){q.activeMs=2000;recordAttempt(q,q.answer);q.done=true;}s.index=7;s.completedAt=new Date().toISOString();return {schema:SCHEMA,profile,sessions:[s]};}
test('Research output suppresses small cohorts, deduplicates people and excludes identifiers',()=>{
 const r=Array.from({length:5},(_,i)=>report('synthetic-'+i));
 assert.deepEqual(aggregateResearch(r.slice(0,4)).rows,[]);
 const output=aggregateResearch([...r,r[0]]);assert.equal(output.rows.length,1);assert.equal(output.rows[0].participants,5);assert.equal(output.rows[0].medianResponseRate,30);
 const text=JSON.stringify(output);for(const record of r){assert.ok(!text.includes(record.profile));assert.ok(!text.includes(record.sessions[0].id));assert.ok(!text.includes(record.sessions[0].startedAt));}
 assert.throws(()=>aggregateResearch(r,{minimumParticipants:1}));
});
