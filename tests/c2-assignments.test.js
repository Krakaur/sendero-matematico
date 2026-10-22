import test from 'node:test';
import assert from 'node:assert/strict';
import {SCHEMA,newAssignedSession,recordAttempt,recordSupport,advanceAssignedSession,validateReport,mergeSessions} from '../web/core.js';
import {TASK_SCHEMA,sessionKey,assignmentRows,assignedEvidence,mergeTaskHistory,visibleTasks,validateAssignedSession} from '../web/assignments.js';
import {assignmentReportHTML,taskListHTML,taskFormHTML,legacyTaskFromForm} from '../web/assignment-view.js';
import {exchangeClassroom,applyExchange} from '../web/classroom.js';
const profiles=['000101','000102','000103','000104'];
const task=(id='A',version=1,table=2)=>({schema:TASK_SCHEMA,classId:'c2',id,version,title:'Tarea '+id,trail:'multi',contentId:'multiply-fixed-table',contentVersion:1,parameters:{table},completionRule:{kind:'answered_items',count:8},recipientProfileIds:profiles,assignedAt:'2026-10-21T23:00:00Z'});
function play(t,p,pattern=0){const s=newAssignedSession(t,p);for(let i=0;i<8;i++){const q=s.questions[s.index];q.activeMs=1000;if(pattern===1&&i===0)recordSupport(q);if(pattern===2&&i===0){recordAttempt(q,q.options.find(n=>n!==q.answer));recordSupport(q);}recordAttempt(q,pattern===3&&i===7?q.options.find(n=>n!==q.answer):q.answer);advanceAssignedSession(s);}return s;}
const report=s=>({schema:SCHEMA,profile:s.profile,sessions:[s]});
test('C2 runtime: exact four-by-two matrix survives serialization and renders separate reports',()=>{
 const tasks=[task('A'),task('B',1,3)],sessions=profiles.flatMap((p,i)=>tasks.map(t=>play(t,p,i)));
 const restored=JSON.parse(JSON.stringify(sessions));restored.forEach(s=>validateReport(report(s)));
 assert.deepEqual(new Set(restored.map(s=>`${s.profile}/${s.assignmentId}@${s.assignmentVersion}`)),new Set(profiles.flatMap(p=>['A','B'].map(id=>`${p}/${id}@1`))));
 const confirmations=Object.fromEntries(restored.map(s=>[sessionKey(s),{classId:'c2',profile:s.profile,confirmedAt:'2026-10-21T23:01:00Z',source:'server-read'}]));
 for(const t of tasks){const rows=assignmentRows(t,restored,confirmations);assert.equal(rows.length,4);assert(rows.every(r=>r.confirmed===1));}
 const html=assignmentReportHTML({teacher:restored,teacherConfirmations:confirmations,classroom:{tasks}},true);
 assert.equal((html.match(/4\/4 perfiles/g)||[]).length,2);assert.match(html,/solución mostrada automáticamente/);assert.match(html,/pista solicitada/);
 const v2=task('A',2,5);const history=mergeTaskHistory(tasks,[v2],'c2');assert.equal(history.length,3);assert(assignmentRows(v2,restored,confirmations).every(r=>r.confirmed===0));assert(restored.every(s=>s.assignmentVersion===1));
});
test('C2 runtime: completion means eight responses; final error remains visible and valid',()=>{
 const s=play(task(),'000104',3);assert(s.completedAt);assert.notEqual(s.questions[7].done,true);assert.equal(assignedEvidence(s).answered,8);assert.equal(assignedEvidence(s).final,7);validateReport(report(s));
 const unfinished=newAssignedSession(task(),'000101');assert.throws(()=>advanceAssignedSession(unfinished));assert.equal(unfinished.completedAt,null);
});
test('C2 runtime: first response, independent response, hint and automatic solution are distinct',()=>{
 const supported=play(task(),'000102',1);assert.deepEqual(assignedEvidence(supported),{answered:8,first:8,independent:7,final:8,hints:1,solutions:0,reflections:0});
 const corrected=play(task(),'000103',2);assert.deepEqual(corrected.questions[0].events.map(e=>e.type),['wrong','solution','hint','correct']);assert.equal(assignedEvidence(corrected).first,7);assert.equal(assignedEvidence(corrected).independent,7);
});
test('C2 runtime: snapshot and conditions cannot be forged or assigned retrospectively',()=>{
 const t=task(),s=play(t,'000101');assert(!('recipientProfileIds' in s.assignment));assert.deepEqual(visibleTasks([t],'000102')[0].recipientProfileIds,['000102']);
 for(const mutate of [s=>s.assignmentVersion=2,s=>s.questions[0].b=2,s=>s.level=4,s=>s.questions[0].options=[1,1,1,1],s=>delete s.questions[0].events,s=>s.assignment.parameters.table=3]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>validateAssignedSession(bad,[t],'c2'));}
 const orphan=structuredClone(s);delete orphan.assignment;assert.throws(()=>validateReport(report(orphan)));
 assert.throws(()=>mergeTaskHistory([t],[{...t,title:'Changed'}],'c2'));
});
test('C2 runtime: pending repeat preserves earlier receipt and report distinguishes absence',()=>{
 const t=task(),old=play(t,'000101'),pending=play(t,'000101'),confirm={[sessionKey(old)]:{classId:'c2',profile:'000101',source:'server-read'}};
 const teacher=assignmentRows(t,[old,pending],confirm);assert.equal(teacher[0].confirmed,1);assert.equal(teacher[0].attempts.length,1);assert.equal(teacher[1].status,'Sin informe recibido');
 const student=assignmentRows(t,[old,pending],confirm,'student');assert.equal(student[0].confirmed,1);assert.match(student[0].status,/sin acuse/);assert.equal(student[0].attempts.length,2);
 const sharedId=play(t,'000102');sharedId.id=old.id;assert.equal(mergeSessions([old],[sharedId]).added,1);
 assert.equal(mergeSessions([old],[JSON.parse(JSON.stringify(old))]).added,0);const conflict=structuredClone(old);conflict.questions[0].activeMs++;assert.throws(()=>mergeSessions([old],[conflict]));
});
test('C2 client: first connection enrolls before tasks; partial or excessive receipts never confirm',async()=>{
 const s=play(task(),'000101');const state={profile:'000101',sessions:[s],teacher:[],classroom:{enabled:true,role:'student',classId:'c2',token:'test-token',endpoint:'http://127.0.0.1',received:[]}};
 const paths=[];let malformed=false;
 const fetcher=async(url,opt)=>{const path=new URL(url).pathname;paths.push(path);let data;
  if(path==='/capabilities')data={features:['enrollment','assignments-v2']};
  if(path==='/enrollment'){const b=JSON.parse(opt.body);data={classId:'c2',...b};}
  if(path==='/tasks')data={tasks:visibleTasks([task()],state.profile),revision:'revision-1'};
  if(path==='/reports')data={classId:'c2',profile:state.profile,accepted:malformed?[s.id,'unrequested']:[s.id],receivedAt:new Date().toISOString()};
  return new Response(JSON.stringify(data));};
 const result=await exchangeClassroom(state,fetcher);assert(paths.indexOf('/enrollment')<paths.indexOf('/tasks'));applyExchange(state,result);assert.equal(state.classroom.tasks[0].id,'A');assert.equal(state.classroom.confirmations[sessionKey(s)].source,'server-acknowledgement');
 state.classroom.received=[];state.classroom.confirmations={};malformed=true;await assert.rejects(exchangeClassroom(state,fetcher),/confirmación/);
});
test('C2 client: cross-class work stays local; visible task controls retain exact references',async()=>{
 const s=play(task(),'000101');const state={profile:'000101',sessions:[s],teacher:[],classroom:{enabled:true,role:'student',classId:'another-class',token:'test-token',endpoint:'http://127.0.0.1',received:[],capabilities:[],capabilitiesAt:Date.now()}};
 let sent=false;await exchangeClassroom(state,async(url)=>{if(url.endsWith('/reports'))sent=true;return new Response(JSON.stringify({tasks:[],revision:'r'}));});assert.equal(sent,false);
 const html=taskListHTML({classroom:{tasks:[task(),task('A',2,3)]}});assert.match(html,/data-assignment="A" data-version="2"/);assert.doesNotMatch(html,/data-version="1"/);
 const form=taskFormHTML({classroom:{capabilities:['assignments-v2'],tasks:[],students:[]}});assert.match(form,/disabled/);assert.match(form,/class-task-legacy/);for(const trail of ['suma','resta','tablas20','razonar']){assert(form.includes(`value="${trail}"`));assert.deepEqual(legacyTaskFromForm({get:k=>k==='trail'?trail:'Orientación'},()=> 'legacy'),{id:'legacy',title:'Orientación',trail});}
});
