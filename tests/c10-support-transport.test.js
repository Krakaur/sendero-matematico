import test from 'node:test';
import assert from 'node:assert/strict';
import {TASK_SCHEMA,assignedEvidence,sessionKey,validateAssignedProgress,validateAssignedSession} from '../web/assignments.js';
import {SCHEMA,newAssignedSession,recordAttempt,recordSupport,recordSolution,recordReasoningSupport,advanceAssignedSession,validateReport} from '../web/core.js';
import {REASONING_SUPPORT_FAMILIES} from '../web/reasoning-support.js';
import {taskFormHTML,taskFromForm,createTaskDraftController,assignmentReportHTML} from '../web/assignment-view.js';
import {buildTaskPreview,taskPreviewHTML} from '../web/task-preview.js';
import {openDatabase,issueAccess,receiver} from '../server/receiver.mjs';

const profiles=['0001001','0001002','0001003','0001004'];
function makeTask(){const f=REASONING_SUPPORT_FAMILIES[0];return {schema:TASK_SCHEMA,classId:'c10-supported-local',id:'c10-supported',version:1,title:'Relaciones con apoyo optativo',trail:'razonar',contentId:'reasoning-supported-pack',contentVersion:1,parameters:{family:f.id,level:f.level,variant:1},completionRule:{kind:'answered_items',count:4},recipientProfileIds:profiles,assignedAt:'2026-10-21T00:00:00Z'};}
const report=s=>({schema:SCHEMA,profile:s.profile,sessions:[s]});
function complete(task,profile,trajectory){
 const s=newAssignedSession(task,profile);
 for(const q of s.questions){
  q.activeMs=1000;
  if(trajectory===1||trajectory===3)assert.equal(recordReasoningSupport(q,'scaffold'),true);
  if(trajectory>=2){assert.equal(recordAttempt(q,q.options.find(n=>n!==q.answer)),true);assert.equal(q.solutionShown,false);assert.equal(recordReasoningSupport(q,'feedback'),true);}
  if(trajectory===3){recordSupport(q);recordSolution(q);q.reflection='Examiné la relación y revisé mi elección.';}
  recordAttempt(q,q.answer);advanceAssignedSession(s);
 }
 return s;
}

test('C10 protocolo 6: construcción, pendientes, métricas y condiciones históricas se mantienen separados',()=>{
 const task=makeTask(),sessions=profiles.map((p,i)=>complete(task,p,i));
 sessions.forEach(s=>{assert.equal(s.taskProtocol,6);assert.equal(s.index,3);validateReport(report(s));validateAssignedSession(s,[task],task.classId);});
 const first=assignedEvidence(sessions[0]),scaffold=assignedEvidence(sessions[1]),feedback=assignedEvidence(sessions[2]),all=assignedEvidence(sessions[3]);
 assert.equal(first.independent,4);assert.equal(scaffold.independent,0);assert.equal(scaffold.first,4);assert.equal(scaffold.scaffolds,4);assert.equal(scaffold.hints,0,'El apoyo no se registra como pista falsa.');
 assert.equal(feedback.feedbackItems,4);assert.equal(feedback.feedbackRequests,4);assert.equal(feedback.solutions,0);assert.equal(feedback.final,4);
 assert.equal(all.hints,4);assert.equal(all.solutions,4);assert.equal(all.scaffolds,4);assert.equal(all.independent,0);
 const pending=newAssignedSession(task,profiles[0]);validateAssignedProgress(pending);recordReasoningSupport(pending.questions[0],'scaffold');validateAssignedProgress(pending);
 const future=structuredClone(pending);recordReasoningSupport(future.questions[1],'scaffold');assert.throws(()=>validateAssignedProgress(future));
 const legacy={...task,contentId:'reasoning-fixed-pack',contentVersion:2},historical=newAssignedSession(legacy,profiles[0]);
 assert.equal(historical.taskProtocol,3);const oldBefore=JSON.stringify(historical);
 assert.equal(recordReasoningSupport(historical.questions[0],'scaffold'),false);assert.equal(JSON.stringify(historical),oldBefore);
 const oldQuestion=historical.questions[0];recordAttempt(oldQuestion,oldQuestion.options.find(n=>n!==oldQuestion.answer));assert.equal(oldQuestion.solutionShown,false);
 oldQuestion.events.push(structuredClone(pending.questions[0].events[0]));assert.throws(()=>validateAssignedProgress(historical),'Interacción 3 no admite eventos nuevos.');
});

test('C10 docente: catálogo apoyado, preview cerrado y publicación exigen capability propia',()=>{
 const task=makeTask(),link={classId:task.classId,tasks:[],students:profiles.map(profile=>({profile})),capabilities:['assignments-v2','assignments-reasoning-supported-v1']};
 const html=taskFormHTML({classroom:link});for(const f of REASONING_SUPPORT_FAMILIES)assert.ok(html.includes('supported-'+f.id));
 assert.equal((html.match(/value="supported-/g)||[]).length,6);
 const form=new FormData();for(const [key,value]of Object.entries({title:task.title,content:'supported-'+task.parameters.family,variant:'1'}))form.set(key,value);profiles.forEach(p=>form.append('recipient',p));
 const direct=taskFromForm(form,link,()=>task.id,task.assignedAt);assert.deepEqual(direct,task);
 const controller=createTaskDraftController(link,()=>task.id,()=>task.assignedAt),preview=controller.preview(form),before=JSON.stringify(preview);
 const previewHTML=taskPreviewHTML(preview);assert.equal(JSON.stringify(preview),before);assert.deepEqual(controller.taskForPublish(form),task);
 assert.equal((previewHTML.match(/<details class="task-preview-support">/g)||[]).length,4);assert.doesNotMatch(previewHTML,/<details[^>]*open/);
 assert.match(previewHTML,/interacción 6/i);assert.match(previewHTML,/no registra una solicitud/);
 const unsupported={...link,capabilities:['assignments-v2','assignments-reasoning-expanded-v2']};
 assert.throws(()=>createTaskDraftController(unsupported,()=>task.id).preview(form));
 const changed=structuredClone(task);changed.parameters.variant=2;assert.equal(buildTaskPreview(changed).items.length,4);
});

test('C10 transporte local: cuatro perfiles, replay idempotente y rechazo atómico de evidencia adulterada',async()=>{
 const task=makeTask(),db=openDatabase(':memory:');db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run(task.classId,'Prueba sintética de apoyos');
 const teacher='t'.repeat(64),tokens=['a','b','c','d'].map(c=>c.repeat(64));issueAccess(db,task.classId,'teacher',teacher);tokens.forEach(token=>issueAccess(db,task.classId,'student',token));
 const server=receiver(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const endpoint=`http://127.0.0.1:${server.address().port}`;
 const request=async(path,body,token)=>{const r=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 try{
  const cap=await request('/capabilities',null,teacher);assert.ok(cap.data.features.includes('assignments-reasoning-supported-v1'));assert.ok(cap.data.features.includes('assignments-reasoning-expanded-v2'));
  const previous=await request('/tasks',null,teacher);assert.equal((await request('/tasks',{tasks:[task],expectedRevision:previous.data.revision},teacher)).status,200);
  const expected=profiles.map((p,i)=>complete(task,p,i));
  for(let i=0;i<expected.length;i++)for(let replay=0;replay<2;replay++){
    const ack=await request('/reports',report(expected[i]),tokens[i]);assert.equal(ack.status,200,JSON.stringify(ack.data));assert.deepEqual(ack.data.accepted,[expected[i].id]);assert.equal(ack.data.profile,profiles[i]);
  }
  const corruptions=[
   s=>s.questions[0].events.find(e=>e.type==='scaffold').text='Texto no presentado',
   s=>s.questions[0].events.find(e=>e.type==='feedback').correctedChoice=s.questions[0].answer,
   s=>s.questions[0].hint=false,
   s=>s.taskProtocol=3,
   s=>s.questions[0].events.push({type:'hint'}),
   s=>s.index=0,
   s=>s.questions[0].labels[0]='Contenido ajeno',
   s=>s.questions[0].scaffoldShown=true,
   s=>s.adaptation='enabled'
  ];
  for(let i=0;i<corruptions.length;i++){
   const altered=structuredClone(expected[3]);altered.id='000-invalid-'+i;corruptions[i](altered);
   assert.throws(()=>validateReport(report(altered)));
   const rejected=await request('/reports',report(altered),tokens[3]);assert.equal(rejected.status,400,JSON.stringify(rejected.data));
  }
  const fresh=complete(task,profiles[0],1),conflict=structuredClone(expected[0]);conflict.questions[0].reflection='Mismo id, contenido diferente';
  const atomic=await request('/reports',{...report(fresh),sessions:[fresh,conflict]},tokens[0]);assert.equal(atomic.status,409);
  const received=await request('/reports',null,teacher);assert.equal(received.status,200);
  const rows=received.data.reports.flatMap(r=>r.sessions);assert.equal(rows.length,4);assert.equal(new Set(rows.map(sessionKey)).size,4);assert.ok(!rows.some(s=>s.id===fresh.id));
  for(const s of expected)assert.deepEqual(rows.find(r=>sessionKey(r)===sessionKey(s)),s);
  const state={classroom:{tasks:[task]},teacher:rows,teacherConfirmations:Object.fromEntries(rows.map(s=>[sessionKey(s),{classId:task.classId,profile:s.profile,source:'server-read',confirmedAt:'2026-10-21T23:00:00Z'}]))};
  const html=assignmentReportHTML(state,true);assert.match(html,/interacción 6/);assert.match(html,/elección comentada/);assert.match(html,/Texto presentado y conservado/);assert.doesNotMatch(html,/0 × 0/);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
