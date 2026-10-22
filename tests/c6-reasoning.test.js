import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {openDatabase,issueAccess,receiver} from '../server/receiver.mjs';
import {SCHEMA,newAssignedSession,recordAttempt,recordSupport,recordSolution,advanceAssignedSession,validateReport} from '../web/core.js';
import {TASK_SCHEMA,validateTasks,validateAssignedSession,validateAssignedProgress,equivalent,assignedEvidence,sessionKey} from '../web/assignments.js';
import {assignedItems} from '../web/task-content.js';
import {assignmentReportHTML,taskFromForm} from '../web/assignment-view.js';
const profiles=['000201','000202','000203','000204'];
const task=(level,count)=>({schema:TASK_SCHEMA,classId:'c6-local',id:`represent-${level}-${count}`,version:1,title:`Representar ${level}/${count}`,trail:'razonar',contentId:'represent-fixed-pack',contentVersion:1,parameters:{level},completionRule:{kind:'answered_items',count},recipientProfileIds:profiles,assignedAt:'2026-10-21T00:00:00Z'});
const tasks=[1,2].flatMap(level=>[4,6,8].map(count=>task(level,count)));
const report=s=>({schema:SCHEMA,profile:s.profile,sessions:[s]});
function complete(t,profile,pattern=0){
 let s=newAssignedSession(t,profile);
 for(let i=0;i<s.questions.length;i++){
  const q=s.questions[i];q.activeMs=1500;
  if(pattern===2)recordSupport(q);
  if(pattern===1||pattern===3){recordAttempt(q,q.options.find(n=>n!==q.answer));assert.equal(q.solutionShown,false);assert(!q.events.some(e=>e.type==='solution'));}
  if(pattern===3){recordSolution(q);assert.equal(q.hint,false);q.reflection='Elegí la relación entre las cantidades.';}
  if(pattern!==1)recordAttempt(q,q.answer);
  assert.equal(s.completedAt,null);s=JSON.parse(JSON.stringify(s));advanceAssignedSession(s);
 }
 return s;
}
test('C6 six packages and four trajectories retain independent evidence and explicit closure',()=>{
 validateTasks(tasks);
 for(const t of tasks)for(let i=0;i<profiles.length;i++){
  const s=complete(t,profiles[i],i),n=t.completionRule.count,e=assignedEvidence(s);
  validateReport(report(s));validateAssignedSession(s,tasks,t.classId);
  assert.equal(s.questions.length,n);assert.equal(s.completionAction.kind,'finish-task');
  assert.deepEqual([e.first,e.independent,e.final,e.hints,e.solutions],[[n,n,n,0,0],[0,0,0,0,0],[n,0,n,n,0],[0,0,n,0,n]][i]);
  assert(Buffer.byteLength(JSON.stringify(s))<=32768);
 }
});
test('C6 immutable stimulus, option semantics, support and closure reject alteration',()=>{
 const s=complete(task(1,4),profiles[0]);
 for(const mutate of [x=>x.questions[0].prompt+='x',x=>x.questions[0].hintText='x',x=>x.questions[0].labels.reverse(),x=>x.questions[0].options.reverse(),x=>x.questions[0].explanation='x',x=>x.questions[0].bankId='other',x=>x.questions[0].reflection='x'.repeat(601),x=>x.questions[0].events.unshift({type:'solution'}),x=>delete x.completionAction,x=>x.taskProtocol=2]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>validateReport(report(bad)));}
 assert.throws(()=>validateTasks([{...task(1,4),parameters:{level:3}}]));
 assert.throws(()=>validateTasks([{...task(1,4),completionRule:{kind:'answered_items',count:5}}]));
 const items=assignedItems(task(1,8));assert.equal(new Set(items.slice(0,4).map(q=>q.options.indexOf(q.answer))).size,4);items[0].prompt='mutated';assert.notEqual(assignedItems(task(1,8))[0].prompt,'mutated');
});
test('C6 teacher form and report show labels, optional reflection and real denominators',()=>{
 const f=new FormData();for(const [k,v] of Object.entries({title:'Representar',content:'represent-fixed-pack',level:'2',count:'6',recipient:profiles[0]}))f.append(k,v);
 const t=taskFromForm(f,{classId:'c6-local',tasks:[]},()=> 'new-id');validateTasks([t]);assert.equal(t.completionRule.count,6);
 const sessions=profiles.map((p,i)=>complete(task(1,4),p,i));sessions[3].questions[0].reflection='<script>unsafe</script>';
 const state={teacher:sessions,classroom:{tasks:[task(1,4)]},teacherConfirmations:Object.fromEntries(sessions.map(s=>[sessionKey(s),{classId:'c6-local',profile:s.profile,source:'server-read',confirmedAt:s.completedAt}]))};
 const html=assignmentReportHTML(state,true);assert(html.includes('4/4 perfiles'));assert(html.includes('Respondidos: 4/4'));assert(html.includes('5 + 4'));assert(html.includes('solución solicitada y mostrada'));assert(html.includes('Interacción 3'));assert(!html.includes('<script>unsafe'));assert(html.includes('&lt;script&gt;'));assert(html.includes('Sin explicación propia registrada'));
});
test('C6 24 actual local HTTP deliveries reach teacher, and replay adds zero records',async()=>{
 const db=openDatabase(':memory:');db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run('c6-local','C6 synthetic');
 const teacher='t'.repeat(64),tokens=['a','b','c','d'].map(c=>c.repeat(64));issueAccess(db,'c6-local','teacher',teacher);tokens.forEach(token=>issueAccess(db,'c6-local','student',token));
 const server=receiver(db);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});let requests=0;
 const req=async(path,body,token)=>{requests++;const r=await fetch(`http://127.0.0.1:${server.address().port}${path}`,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 try{
  const before=await req('/tasks',null,teacher);assert.equal((await req('/tasks',{tasks,expectedRevision:before.data.revision},teacher)).status,200);
  const sessions=[];
  for(let i=0;i<4;i++){
   assert.equal((await req('/enrollment',{profile:profiles[i],enrollment:{school:'Escuela sintética',grade:'3',group:'A',listNumber:i+1}},tokens[i])).status,200);
   for(const t of tasks){const s=complete(t,profiles[i],i);sessions.push(s);for(let replay=0;replay<2;replay++){const ack=await req('/reports',report(s),tokens[i]);assert.equal(ack.status,200);assert.equal(ack.data.classId,t.classId);assert.equal(ack.data.profile,s.profile);assert.deepEqual(ack.data.accepted,[s.id]);}}
  }
  const response=await req('/reports',null,teacher);assert.equal(response.status,200);const received=response.data.reports.flatMap(r=>r.sessions);assert.equal(received.length,24);assert.equal(new Set(received.map(sessionKey)).size,24);assert.deepEqual(received.map(sessionKey).sort(),sessions.map(sessionKey).sort());for(const s of sessions)assert(equivalent(received.find(r=>sessionKey(r)===sessionKey(s)),s));
  const maximum=Math.max(...sessions.map(s=>Buffer.byteLength(JSON.stringify(s))));assert(maximum<=32768);
  const source={tasks,sessions:received,teacherConfirmations:Object.fromEntries(received.map(s=>[sessionKey(s),{classId:'c6-local',profile:s.profile,source:'server-read',confirmedAt:response.data.confirmedAt}]))};
  if(process.env.C6_EVIDENCE)writeFileSync(process.env.C6_EVIDENCE,JSON.stringify({publicRequests:0,requests,received:24,replays:24,duplicates:0,maxSessionBytes:maximum,workerSessionLimit:32768,source},null,2));
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});

test('C6 pending snapshot rejects missing items, mismatched references, invalid index and future evidence',()=>{
 const s=newAssignedSession(task(1,4),profiles[0]);validateAssignedProgress(s);recordSupport(s.questions[0]);validateAssignedProgress(s);
 for(const mutate of [x=>x.questions.pop(),x=>x.assignmentVersion=2,x=>x.index=4,x=>x.questions[1].reflection='future',x=>x.questions[1].events.push({type:'hint'}),x=>x.completedAt=new Date().toISOString(),x=>x.questions[0].solutionShown='true',x=>x.questions[0].activeMs=Infinity,x=>x.questions[0].activeMs=86400001,x=>x.questions[0].timingProtocol=1,x=>x.id='bad id',x=>x.version=null]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>validateAssignedProgress(bad));}
 recordAttempt(s.questions[0],s.questions[0].answer);validateAssignedProgress(s);advanceAssignedSession(s);validateAssignedProgress(JSON.parse(JSON.stringify(s)));
});
test('C6 UTF8 limits cover longest normal explanations and malicious escaped or extra data',()=>{
 const s=complete(task(2,8),profiles[3],3);for(const q of s.questions)q.reflection='漢'.repeat(600);validateReport(report(s));assert(Buffer.byteLength(JSON.stringify(s))<=32768);
 const escaped=structuredClone(s);escaped.questions[0].reflection=String.fromCharCode(0).repeat(600);assert.throws(()=>validateReport(report(escaped)));
 const oversized=structuredClone(s);oversized.extra='x'.repeat(32768);assert.throws(()=>validateReport(report(oversized)));
});
