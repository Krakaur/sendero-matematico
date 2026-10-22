import test from 'node:test';
import assert from 'node:assert/strict';
import {resultGroups,renderFluency} from '../web/results.js';
const q={level:1,attempts:[6],answer:6,hint:false,timingProtocol:1,firstResponseMs:2000};
const base={trail:'multi',completedAt:'2026-10-21T01:00:00Z',questions:[q]};
const task=(id,table,version=1)=>({...base,assignment:{classId:'A',id,version,title:id,contentId:'multiply-fixed-table',contentVersion:1,parameters:{table}}});
test('C4 separates fixed conditions and task versions from adaptive practice',()=>{
 const rows=resultGroups([base,task('T1',2),task('T2',12),task('T1',2,2)]);
 assert.equal(rows.length,4);assert.equal(new Set(rows.map(x=>x.condition)).size,4);assert(rows.every(r=>r.total===1));
 const html=renderFluency([base,task('T2',12)]);assert(html.includes('tabla 12'));assert(html.includes('1/1 ejercicios con tiempo válido'));
});
import {newAssignedSession,recordAttempt,advanceAssignedSession} from '../web/core.js';
import {TASK_SCHEMA,sessionKey} from '../web/assignments.js';
import {summarizeReconciliation} from '../web/reconciliation.js';
import {reconciliationSummaryHTML,reconciliationPanel,reconciliationCSV} from '../web/reconciliation-view.js';
const codes=['000101','000102','000103','000104'];
function receiptFixture(){
 const tasks=[2,6,8].map((table,i)=>({schema:TASK_SCHEMA,classId:'view-c4',id:'T'+i,version:1,title:'Tabla '+table,trail:'multi',contentId:'multiply-fixed-table',contentVersion:1,parameters:{table},completionRule:{kind:'answered_items',count:8},recipientProfileIds:codes,assignedAt:'2026-10-21T22:00:00Z'}));
 const teacher=codes.flatMap(profile=>tasks.map(t=>{const s=newAssignedSession(t,profile);for(let n=0;n<8;n++){const q=s.questions[s.index];recordAttempt(q,q.answer);advanceAssignedSession(s);}return s;}));
 return {teacher,teacherConfirmations:Object.fromEntries(teacher.map(s=>[sessionKey(s),{classId:'view-c4',profile:s.profile,confirmedAt:'2026-10-21T23:59:00Z',source:'server-read'}])),classroom:{tasks}};
}
test('C4 rendered metric cells retain the units and denominators of the four-profile matrix',()=>{
 const summary=summarizeReconciliation(receiptFixture(),true),html=reconciliationSummaryHTML(summary);
 const cells=[...html.matchAll(/<td data-c4-metric>([\s\S]*?)<\/td>/g)].map(m=>m[1]);
 assert.equal(cells.length,27);assert(cells.every(x=>/^\d+\/(12 cierres|4 perfiles)/.test(x)));
 assert(html.includes('12/12 cierres'));assert.equal((html.match(/diferencia 0<\/summary>/g)||[]).length,5);
 assert(html.includes('Sin clasificar'));assert(!html.includes('NaN'));
});
test('C4 empty report states absence and does not turn missing evidence into percentage failure',()=>{
 const html=reconciliationPanel({},true);assert(html.includes('universo vacío (0)'));assert(!html.includes('NaN'));assert(!html.includes('Infinity'));assert(!html.replace(/<[^>]*>/g,'').includes('0%')); // Assert visible text, not decorative CSS width.
 assert(html.includes('Sin clasificar'));
});
test('C4 CSV contains exactly the same filtered closures and escapes spreadsheet formulas',()=>{
 const state=receiptFixture(),all=summarizeReconciliation(state,true),student=all.records[0].dimensions.student;
 const selected=summarizeReconciliation(state,true,{student});const csv=reconciliationCSV(selected);
 assert.equal(selected.records.length,3);assert.equal(csv.split('\r\n').length,4);assert(csv.includes('000101'));assert(!csv.includes('000102'));
 state.teacher[0].enrollment={school:'=1+1',grade:'3',group:'A',listNumber:1};
 const escaped=reconciliationCSV(summarizeReconciliation(state,true));assert(escaped.includes("'=1+1"));
});
test('C4 school labels are rendered as text, not executable markup',()=>{
 const state=receiptFixture();state.teacher[0].enrollment={school:'<img src=x onerror=alert(1)>',grade:'3',group:'A',listNumber:1};
 const html=reconciliationPanel(state,true);assert(!html.includes('<img src=x'));assert(html.includes('&lt;img'));
});
