import {fluency,interruptTiming} from '../web/fluency.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {openDatabase,issueAccess,receiver} from '../server/receiver.mjs';
import {SCHEMA,newAssignedSession,recordAttempt,recordSupport,advanceAssignedSession,validateReport} from '../web/core.js';
import {TASK_SCHEMA,validateTasks,validateAssignedProgress,equivalent,assignedEvidence,sessionKey} from '../web/assignments.js';
import {assignedItems} from '../web/task-content.js';
import {assignmentReportHTML,taskFromForm} from '../web/assignment-view.js';
const profiles=['000301','000302','000303','000304'];
const task=(trail,value,count)=>({schema:TASK_SCHEMA,classId:'c7-local',id:`${trail}-${value}-${count}`,version:1,title:`${trail} ${value}/${count}`,trail,contentId:'arithmetic-fixed-pack',contentVersion:1,parameters:trail==='tablas20'?{table:value}:{level:value},completionRule:{kind:'answered_items',count},recipientProfileIds:profiles,assignedAt:'2026-10-21T00:00:00Z'});
const report=s=>({schema:SCHEMA,profile:s.profile,sessions:[s]});
function complete(t,profile,pattern=0){let s=newAssignedSession(t,profile);for(let i=0;i<s.questions.length;i++){const q=s.questions[i];q.activeMs=1000;if(pattern===2)recordSupport(q);if(pattern===1||pattern===3){recordAttempt(q,q.options.find(n=>n!==q.answer));assert(q.solutionShown);}if(pattern!==1)recordAttempt(q,q.answer);validateAssignedProgress(s);assert.equal(s.completedAt,null);s=structuredClone(s);advanceAssignedSession(s);}validateReport(report(s));return s;}
test('C7 all 84 declared arithmetic packages retain their operands, length, protocol and balanced positions',()=>{
 let packages=0;for(const trail of ['suma','resta','tablas20'])for(let value=1;value<=(trail==='tablas20'?20:4);value++)for(const count of [4,6,8]){const t=task(trail,value,count);validateTasks([t]);const s=complete(t,profiles[0]);assert.equal(s.taskProtocol,4);assert.equal(s.questions.length,count);assert.equal(s.completionAction.kind,'finish-task');assert.equal(new Set(s.questions.slice(0,4).map(q=>q.options.indexOf(q.answer))).size,4);for(const q of s.questions)assert.equal(q.answer,trail==='suma'?q.a+q.b:trail==='resta'?q.a-q.b:q.a*q.b);packages++;}assert.equal(packages,84);
});
test('C7 pending and complete records reject altered stimuli, future evidence and ambiguous protocol',()=>{
 const t=task('tablas20',20,6),s=newAssignedSession(t,profiles[0]);validateAssignedProgress(s);
 for(const mutate of [x=>x.questions[0].a=19,x=>x.questions[0].options.reverse(),x=>x.taskProtocol=3,x=>x.questions.pop(),x=>recordAttempt(x.questions[1],x.questions[1].answer),x=>x.questions[0].supportProtocol=3,x=>x.questions[0].reflection='not allowed',x=>x.index=6]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>validateAssignedProgress(bad));}
 const done=complete(t,profiles[3],3);for(const mutate of [x=>delete x.completionAction,x=>x.questions[0].events.splice(1,1),x=>x.extra='x'.repeat(32768)]){const bad=structuredClone(done);mutate(bad);assert.throws(()=>validateReport(report(bad)));}
 for(const field of ['prompt','labels','bankId','solution','hintText']){const bad=structuredClone(done);bad.questions[0][field]=field==='labels'?['arbitrary']:'arbitrary';assert.throws(()=>validateReport(report(bad)));}
 for(const bad of [{...t,parameters:{table:21}},{...t,parameters:{table:20,level:1}},{...t,contentVersion:2},{...t,completionRule:{kind:'answered_items',count:5}}])assert.throws(()=>validateTasks([bad]));
 const items=assignedItems(t);items[0].a=19;assert.equal(assignedItems(t)[0].a,20);
});
test('C7 teacher form and reports preserve route, denominator and exposure condition',()=>{
 for(const trail of ['suma','resta','tablas20']){const f=new FormData();for(const [k,v]of Object.entries({title:'C7',content:`arithmetic-${trail}`,arithmeticLevel:'4',table:'20',count:'6',recipient:profiles[0]}))f.append(k,v);const t=taskFromForm(f,{classId:'c7-local',tasks:[]},()=>trail);validateTasks([t]);assert.equal(t.trail,trail);assert.equal(t.parameters[trail==='tablas20'?'table':'level'],trail==='tablas20'?20:4);const s=complete(t,profiles[0]);const html=assignmentReportHTML({teacher:[s],classroom:{tasks:[t]},teacherConfirmations:{[sessionKey(s)]:{classId:t.classId,profile:s.profile,confirmedAt:s.completedAt}}},true);assert(html.includes('Respondidos: 6/6'));assert(html.includes('Interacción 4'));assert(!html.includes('Representación esperada'));assert(!html.includes('undefined'));}
});
test('C7 twelve actual HTTP deliveries preserve four trajectories and twelve replays add no records',async()=>{
 const tasks=[task('suma',4,4),task('resta',4,6),task('tablas20',20,8)],db=openDatabase(':memory:');db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run('c7-local','C7 synthetic');const teacher='t'.repeat(64),tokens=['a','b','c','d'].map(c=>c.repeat(64));issueAccess(db,'c7-local','teacher',teacher);tokens.forEach(token=>issueAccess(db,'c7-local','student',token));const server=receiver(db);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});let requests=0;const req=async(path,body,token)=>{requests++;const r=await fetch(`http://127.0.0.1:${server.address().port}${path}`,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 try{const before=await req('/tasks',null,teacher);assert.equal((await req('/tasks',{tasks,expectedRevision:before.data.revision},teacher)).status,200);const sessions=[];for(let i=0;i<4;i++){assert.equal((await req('/enrollment',{profile:profiles[i],enrollment:{school:'Escuela sintética',grade:'3',group:'C7',listNumber:i+1}},tokens[i])).status,200);for(const t of tasks){const s=complete(t,profiles[i],i),n=t.completionRule.count,e=assignedEvidence(s);assert.deepEqual([e.first,e.independent,e.final,e.hints,e.solutions],[[n,n,n,0,0],[0,0,0,0,n],[n,0,n,n,0],[0,0,n,0,n]][i]);sessions.push(s);for(let j=0;j<2;j++){const ack=await req('/reports',report(s),tokens[i]);assert.equal(ack.status,200);assert.equal(ack.data.classId,t.classId);assert.equal(ack.data.profile,s.profile);assert.deepEqual(ack.data.accepted,[s.id]);}}}const res=await req('/reports',null,teacher);assert.equal(res.status,200);const received=res.data.reports.flatMap(r=>r.sessions);assert.equal(received.length,12);assert.equal(new Set(received.map(sessionKey)).size,12);for(const s of sessions)assert(equivalent(received.find(r=>sessionKey(r)===sessionKey(s)),s));const maxSessionBytes=Math.max(...received.map(s=>Buffer.byteLength(JSON.stringify(s))));assert(maxSessionBytes<=32768);if(process.env.C7_EVIDENCE)writeFileSync(process.env.C7_EVIDENCE,JSON.stringify({publicRequests:0,requests,received:12,replays:12,duplicates:0,maxSessionBytes,source:{tasks,sessions:received,teacherConfirmations:Object.fromEntries(received.map(s=>[sessionKey(s),{classId:'c7-local',profile:s.profile,source:'server-read',confirmedAt:res.data.confirmedAt}]))}},null,2));}
 finally{await new Promise(resolve=>server.close(resolve));db.close();}
});

test('C7 arithmetic timing measures first response and excludes hints, interruptions and old missing timing',()=>{
 const t=task('suma',1,4),s=newAssignedSession(t,profiles[0]);
 const q=s.questions[0];q.activeMs=2000;recordAttempt(q,q.options.find(n=>n!==q.answer));q.activeMs+=5000;recordAttempt(q,q.answer);assert.equal(q.firstResponseMs,2000);
 const q2=s.questions[1];q2.activeMs=3000;recordAttempt(q2,q2.answer);
 const q3=s.questions[2];recordSupport(q3);q3.activeMs=4000;recordAttempt(q3,q3.answer);
 const q4=s.questions[3];interruptTiming(q4);q4.activeMs=5000;recordAttempt(q4,q4.answer);
 const f=fluency(s.questions);assert.deepEqual({n:f.n,ms:f.ms,correct:f.correct,rate:f.rate},{n:2,ms:5000,correct:1,rate:12});
 const old=structuredClone(q2);delete old.timingProtocol;delete old.firstResponseMs;delete old.timingInterrupted;assert.equal(fluency([old]).n,0);
});

test('C7 restores a classic pending task without fabricating future first-response times',()=>{
 const t={...task('suma',1,8),trail:'multi',contentId:'multiply-fixed-table',parameters:{table:3}},s=newAssignedSession(t,profiles[0]);
 assert.equal(s.taskProtocol,2);assert.equal(s.questions[0].firstResponseMs,undefined);validateAssignedProgress(structuredClone(s));
 s.questions[0].activeMs=2000;recordAttempt(s.questions[0],s.questions[0].answer);advanceAssignedSession(s);validateAssignedProgress(structuredClone(s));assert.equal(s.questions[1].firstResponseMs,undefined);
 const bad=structuredClone(s);delete bad.questions[0].firstResponseMs;assert.throws(()=>validateAssignedProgress(bad));
});
