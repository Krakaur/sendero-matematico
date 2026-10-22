import test from 'node:test';
import assert from 'node:assert/strict';
import {newAssignedSession,recordAttempt,recordSupport,advanceAssignedSession,requiresAssignedFinish,validateReport,SCHEMA,mergeSessions} from '../web/core.js';
import {TASK_SCHEMA,assignedEvidence,validateAssignedSession,sessionKey} from '../web/assignments.js';
import {assignmentReportHTML} from '../web/assignment-view.js';
import {resultGroups} from '../web/results.js';
const task={schema:TASK_SCHEMA,classId:'c5-local',id:'C5-A',version:1,title:'C5 tabla2',trail:'multi',contentId:'multiply-fixed-table',contentVersion:1,parameters:{table:2},completionRule:{kind:'answered_items',count:8},recipientProfileIds:['000191','000192','000193','000194'],assignedAt:'2026-10-21T00:00:00Z'};
const report=s=>({schema:SCHEMA,profile:s.profile,sessions:[s]});
function atLast(profile='000191') { const s=newAssignedSession(task,profile);for(let i=0;i<7;i++){recordAttempt(s.questions[s.index],s.questions[s.index].answer);advanceAssignedSession(s);}return s; }
test('C5 last item preserves three distinct trajectories and waits across serialization',()=>{
 for(const [pattern,expected] of [['wrong',[7,7,7]],['corrected',[7,7,8]],['hint',[8,7,8]]]){
  let s=atLast();const q=s.questions[7];assert.equal(s.taskProtocol,2);assert(requiresAssignedFinish(s));
  if(pattern==='hint')recordSupport(q);else recordAttempt(q,q.options.find(n=>n!==q.answer));
  if(pattern!=='wrong')recordAttempt(q,q.answer);
  assert.equal(s.completedAt,null);assert.equal(s.completionAction,undefined);
  const before=structuredClone(s.questions);s=JSON.parse(JSON.stringify(s));assert(requiresAssignedFinish(s));assert.equal(s.completedAt,null);
  advanceAssignedSession(s);assert.deepEqual(s.questions,before);assert.equal(s.completionAction.at,s.completedAt);assert.equal(s.completionAction.kind,'finish-task');
  const e=assignedEvidence(s);assert.deepEqual([e.first,e.independent,e.final],expected);validateReport(report(s));
  assert.equal(mergeSessions([s],[JSON.parse(JSON.stringify(s))]).added,0);assert.throws(()=>advanceAssignedSession(s));
 }
});
test('C5 final correct response remains pending, and unattempted finish is rejected',()=>{
 const s=atLast();assert.throws(()=>advanceAssignedSession(s));recordAttempt(s.questions[7],s.questions[7].answer);
 assert(requiresAssignedFinish(s));assert.equal(s.completedAt,null);assert.equal(s.completionAction,undefined);
 const restored=JSON.parse(JSON.stringify(s));assert(requiresAssignedFinish(restored));advanceAssignedSession(restored);validateAssignedSession(restored,[task],task.classId);
});
test('C5 protocol and closure marker are validated; historical evidence remains unchanged',()=>{
 const s=atLast();recordAttempt(s.questions[7],s.questions[7].answer);advanceAssignedSession(s);
 for(const change of [x=>delete x.completionAction,x=>x.completionAction.kind='automatic',x=>x.completionAction.at='2000-01-01T00:00:00Z',x=>x.taskProtocol=3,x=>x.completionAction.extra=true]){const bad=structuredClone(s);change(bad);assert.throws(()=>validateReport(report(bad)));}
 const old=structuredClone(s);old.id='historical';old.taskProtocol=1;delete old.completionAction;const bytes=JSON.stringify(old);validateReport(report(old));assert.equal(JSON.stringify(old),bytes);
 const rows=resultGroups([old,s]);assert.equal(rows.length,2);assert(rows.some(r=>r.conditionLabel.includes('interacción 1')));assert(rows.some(r=>r.conditionLabel.includes('interacción 2')));
 const state={teacher:[old,s],teacherConfirmations:Object.fromEntries([old,s].map(x=>[sessionKey(x),{classId:task.classId,profile:x.profile,source:'server-read',confirmedAt:x.completedAt}])),classroom:{tasks:[task]}};
 const html=assignmentReportHTML(state,true);assert(html.includes('Interacción 1 (histórica)'));assert(html.includes('Interacción 2:'));assert(html.includes('2 intentos recibidos · 2 cierres visibles.'));assert.equal((html.match(/<summary>Intento /g)||[]).length,2);
});

// Added before r7 execution; r6 was not applied after UI exposed the player's offscreen clamp.
import {CircuitView,courseGeometry} from '../web/circuit.js';
import {writeFileSync} from 'node:fs';
test('C5 following and fixed cameras keep the player inside all three circuits at sampled progress',()=>{
 const sizes=[{width:1097,height:283,boat:88},{width:294,height:160,boat:68},{width:364,height:210,boat:68}];
 const observations=[];
 for(const reduced of [false,true])for(const id of ['bosque','islas','cascada'])for(const size of sizes){
  const view={course:courseGeometry(id),projectedMarkers:[]};
  for(let step=0;step<=64;step++){
   const progress=step/64,cam=CircuitView.prototype.camera.call(view,progress,size.width,size.height,reduced);
   const projected=CircuitView.prototype.project.call(view,progress,0,cam,size.width,size.height,size.boat);
   assert.equal(projected.edge,'',`${id} ${size.width}x${size.height} progress${progress}: player clamped`);
   assert(projected.x>=size.boat/2&&projected.x<=size.width-size.boat/2);
   assert(projected.y>=40&&projected.y<=size.height-35);
   observations.push({id,reduced,width:size.width,height:size.height,progress,edge:projected.edge,x:projected.x,y:projected.y});
  }
 }
 assert.equal(observations.length,1170);
 if(process.env.C5_CAMERA_METRICS)writeFileSync(process.env.C5_CAMERA_METRICS,JSON.stringify({checked:observations.length,denominator:1170,normal:observations.filter(o=>!o.reduced).length,reduced:observations.filter(o=>o.reduced).length,scope:'Three circuits x three measured scene sizes x 65 progress samples x two motion modes; pure production camera/project, no rendered human judgement',observations}));
});
