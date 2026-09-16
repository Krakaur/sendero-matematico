import test from 'node:test';import assert from 'node:assert/strict';
import {openDatabase,issueAccess,receiver} from '../server/receiver.mjs';
import {newSession,recordAttempt,SCHEMA} from '../web/core.js';
import {readInvitation,exchangeClassroom,applyExchange,classroomRequest} from '../web/classroom.js';
test('Delivery receipt, deduplication, role separation, tasks and revocation',async()=>{
 const db=openDatabase(':memory:');db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run('group-a','Aula de prueba');
 const student='s'.repeat(64),teacher='t'.repeat(64);issueAccess(db,'group-a','student',student);issueAccess(db,'group-a','teacher',teacher);
 const server=receiver(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const endpoint=`http://127.0.0.1:${server.address().port}`;
 const link=(role,token)=>readInvitation({schema:'sendero.invitation.v1',classId:'group-a',role,token,endpoint},role);
 try {
  const session=newSession('suma',1,'profile-a');for(const q of session.questions){q.activeMs=1000;recordAttempt(q,q.answer);q.done=true;}session.completedAt=new Date().toISOString();session.index=7;
  const s={profile:'profile-a',sessions:[session],teacher:[],classroom:link('student',student)};
  const t={profile:'teacher-a',sessions:[],teacher:[],classroom:link('teacher',teacher)};
  await classroomRequest(t.classroom,'/tasks',{tasks:[{id:'task-1',title:'Sumas de hoy',trail:'suma'}]});
  const result=await exchangeClassroom(s);assert.deepEqual(result.received,[session.id]);applyExchange(s,result);assert.equal(s.classroom.tasks[0].id,'task-1');
  await classroomRequest(s.classroom,'/reports',{schema:SCHEMA,profile:s.profile,sessions:s.sessions});
  applyExchange(t,await exchangeClassroom(t));assert.equal(t.teacher.length,1);
  await assert.rejects(()=>classroomRequest(s.classroom,'/reports'));
  await assert.rejects(()=>classroomRequest(s.classroom,'/tasks',{tasks:[]}));
  const altered=structuredClone(session);altered.questions[0].activeMs+=100;
  await assert.rejects(()=>classroomRequest(s.classroom,'/reports',{schema:SCHEMA,profile:s.profile,sessions:[altered]}));
  assert.equal(db.prepare('SELECT count(*) as n FROM sessions').get().n,1);
  db.prepare('DELETE FROM access WHERE role=?').run('student');await assert.rejects(()=>exchangeClassroom(s));
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
