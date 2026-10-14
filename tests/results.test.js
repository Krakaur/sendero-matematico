import test from 'node:test';import assert from 'node:assert/strict';import {resultGroups,renderFluency} from '../web/results.js';
test('Results separate precision from eligible speed and levels from one another',()=>{
 const q=(level,correct,hint=false)=>({level,attempts:[correct?2:3,2],answer:2,hint,timingProtocol:1,timingInterrupted:false,firstResponseMs:2000});
 const s={trail:'suma',completedAt:'2026-09-16T01:00:00Z',questions:[q(1,true),q(1,false),q(1,true,true),q(2,true)]};
 const rows=resultGroups([s]);assert.equal(rows.length,2);assert.equal(rows[0].first,2);assert.equal(rows[0].errors,1);assert.equal(rows[0].fluency.n,2);assert.equal(rows[0].fluency.rate,15);
 const html=renderFluency([s]);assert(html.includes('Cómo se obtuvo este resultado'));assert(!/>[^<]*\bn=/.test(html));assert(html.includes('Pocos datos'));
});
test('Written answers do not share a rate series with multiple-choice practice or races',()=>{
 const question={level:1,attempts:[2],answer:2,hint:false,timingProtocol:1,timingInterrupted:false,firstResponseMs:2000};
 const base={trail:'suma',completedAt:'2026-10-14T01:00:00Z',questions:[question]};
 const rows=resultGroups([base,{...base,responseMode:'write',questions:[{...question,firstResponseMs:4000}]},{...base,race:{}}]);
 assert.deepEqual(rows.map(r=>[r.mode,r.total,r.fluency.rate]),[['calm',1,30],['written',1,15],['race',1,30]]);
});
