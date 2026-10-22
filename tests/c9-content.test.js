import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {REASONING_C9_FAMILIES,reasoningC9Items} from '../web/reasoning-c9.js';
import {assignedItems,validContentTask} from '../web/task-content.js';
import {validateTasks,validateAssignedSession,sessionKey} from '../web/assignments.js';
import {validateReport,newAssignedSession,recordAttempt,advanceAssignedSession} from '../web/core.js';
import {task,report,completeReasoning,reasoningTasks} from './c8-fixtures.mjs';
import {openDatabase,issueAccess,receiver} from '../server/receiver.mjs';
import {make,c9Tasks} from './c9-fixtures.mjs';
test('C9 48 frozen items, six families, two variants and structural diversity; v1 remains compatible',()=>{
 assert.equal(REASONING_C9_FAMILIES.length,6);const ids=new Set();
 for(const f of REASONING_C9_FAMILIES){const structures=new Set();for(const v of [1,2]){const t=make(f,v);validateTasks([t]);const qs=assignedItems(t);assert.equal(qs.length,4);assert.deepEqual(qs,reasoningC9Items(t));assert.equal(new Set(qs.map(q=>q.options.indexOf(q.answer))).size,4);
 for(const q of qs){assert(!ids.has(q.bankId));ids.add(q.bankId);structures.add(q.structure);assert.equal(q.bankVersion,'reasoning-fixed-pack@2');assert.equal(q.labels.length,4);assert.equal(q.errorFeedback.length,4);assert.equal(new Set(q.labels).size,4);assert(q.explanation.length>20);assert(q.hintText.length>15);assert(q.process);assert.equal(q.labels[q.answer],q.solution);}
 const s=completeReasoning(t,'000901');validateReport(report(s));validateAssignedSession(s,[t],t.classId);assert(Buffer.byteLength(JSON.stringify(s))<32768);
 }assert(structures.size>=2,`${f.id}: mathematical structures required`);}
 assert.equal(ids.size,48);for(const t of reasoningTasks()){assert(validContentTask(t));validateReport(report(completeReasoning(t)));}
});
test('C9 pending items preserve metadata, and altered frozen content or unsupported conditions are rejected',()=>{
 const t=c9Tasks()[0],s=newAssignedSession(t,'000901');const q=s.questions[0];recordAttempt(q,q.answer);advanceAssignedSession(s);
 assert.equal(s.questions[0].structure,assignedItems(t)[0].structure);
 const done=completeReasoning(t,'000901');for(const change of [s=>s.questions[0].structure='altered',s=>s.questions[0].errorFeedback[0]='altered',s=>s.questions[0].hintText='altered',s=>s.questions[0].options.reverse(),s=>s.assignment.contentVersion=1]){const x=structuredClone(done);change(x);assert.throws(()=>validateReport(report(x)));}
 for(const change of [t=>t.contentVersion=3,t=>t.parameters.variant=3,t=>t.parameters.level=9,t=>t.parameters.family='unknown',t=>t.parameters.extra=true,t=>t.completionRule.count=8]){const x=structuredClone(t);change(x);assert.throws(()=>validateTasks([x]));}
});
test('C9 four students deliver 48 assigned v2 sessions to the local teacher and replay without duplication',async()=>{
 const db=openDatabase(':memory:');db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run('c9-local','C9 synthetic');const teacher='t'.repeat(64),tokens=['a','b','c','d'].map(c=>c.repeat(64));issueAccess(db,'c9-local','teacher',teacher);tokens.forEach(token=>issueAccess(db,'c9-local','student',token));
 const server=receiver(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));const endpoint=`http://127.0.0.1:${server.address().port}`;let requests=0;
 const req=async(path,body,token)=>{requests++;const r=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 try{const tasks=c9Tasks(),before=await req('/tasks',null,teacher);assert.equal((await req('/tasks',{tasks,expectedRevision:before.data.revision},teacher)).status,200);const expected=[];
 for(let i=0;i<4;i++){const profile=`00090${i+1}`,sessions=tasks.map(t=>completeReasoning(t,profile,i));expected.push(...sessions);const payload={...report(sessions[0]),sessions};for(let k=0;k<2;k++){const r=await req('/reports',payload,tokens[i]);assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.accepted.length,12);}}
 const received=await req('/reports',null,teacher);assert.equal(received.status,200);const rows=received.data.reports.flatMap(r=>r.sessions);assert.equal(rows.length,48);assert.equal(new Set(rows.map(sessionKey)).size,48);assert.deepEqual(new Set(rows.map(sessionKey)),new Set(expected.map(sessionKey)));
 const cap=await req('/capabilities',null,teacher);assert(cap.data.features.includes('assignments-reasoning-expanded-v2'));
 if(process.env.C9_EVIDENCE)writeFileSync(process.env.C9_EVIDENCE,JSON.stringify({schema:'sendero.c9.local-transport.v1',requests,publicRequests:0,profiles:4,tasks:12,sessions:48,replayed:48,unique:48,teacherReports:received.data.reports,limitations:'Local HTTP, synthetic trajectories; not public D1 or human evidence.'},null,2));
 }finally{await new Promise(r=>server.close(r));db.close();}
});
