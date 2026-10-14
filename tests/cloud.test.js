import test from 'node:test';import assert from 'node:assert/strict';
import {openDatabase,issueAccess,receiver} from '../server/receiver.mjs';
import {saveCloudCopy,restoreCloudCopy} from '../web/cloud.js';
import {classroomRequest,readInvitation,exchangeClassroom,applyExchange} from '../web/classroom.js';
import {newWorkshop,currentMission,solvedModel,applyWorkshopAction} from '../web/workshop.js';
test('Remote copies are encrypted, survive a new device, reject stale writers and isolate invitations',async()=>{
 const db=openDatabase(':memory:');db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run('qa','QA');
 const student='s'.repeat(64),other='o'.repeat(64),teacher='t'.repeat(64);
 for(const [role,token] of [['student',student],['student',other],['teacher',teacher]])issueAccess(db,'qa',role,token);
 const server=receiver(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));const endpoint=`http://127.0.0.1:${server.address().port}`;
 const invitation=(role,token)=>({schema:'sendero.invitation.v1',classId:'qa',role,token,endpoint});
 const profile={id:'qa-profile',name:'Prueba cifrada',role:'student'},state={profile:profile.id,sessions:[],teacher:[],adaptive:{},current:null,workshop:newWorkshop(2,123),classroom:readInvitation(invitation('student',student),'student')};
 try{
  applyWorkshopAction(state.workshop,{type:'change',key:'value',delta:1});
  const first=await saveCloudCopy(profile,state,'copia-segura-09');assert.equal(first.revision,1);state.cloudRevision=1;
  const raw=db.prepare('SELECT envelope FROM vaults').get().envelope;assert(!raw.includes(profile.name)&&!raw.includes('workshop'));
  const second=await saveCloudCopy(profile,state,'copia-segura-09');assert.equal(second.revision,2);
  await assert.rejects(()=>saveCloudCopy(profile,state,'copia-segura-09'),/versión remota/);
  await assert.rejects(()=>classroomRequest(readInvitation(invitation('student',other),'student'),'/vault'),/No existe/);
  const map=new Map(),store={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  await assert.rejects(()=>restoreCloudCopy(store,invitation('student',student),'clave-incorrecta','clave-nueva'));
  const restored=await restoreCloudCopy(store,invitation('student',student),'copia-segura-09','clave-nueva');
  assert.equal(restored.state.cloudRevision,2);assert.equal(restored.state.workshop.records[0].model.value,1);assert.equal(restored.profile.id,profile.id);
  const teacherLink=readInvitation(invitation('teacher',teacher),'teacher');
  const issued=await classroomRequest(teacherLink,'/students',{});assert.equal(issued.role,'student');
  await assert.rejects(()=>classroomRequest(state.classroom,'/students',{}));
  const roster=await classroomRequest(teacherLink,'/students');const row=roster.students.find(s=>s.profile===profile.id);assert(row);
  await classroomRequest(teacherLink,'/students/revoke',{id:row.id});assert.equal(db.prepare('SELECT count(*) AS n FROM vaults').get().n,0);
  await assert.rejects(()=>classroomRequest(state.classroom,'/vault'),/revocada/);
 }finally{await new Promise(r=>server.close(r));db.close();}
});
test('Project delivery is opt-in, deduplicated and visible only to the classroom teacher',async()=>{
 const db=openDatabase(':memory:');db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run('qa','QA');issueAccess(db,'qa','student','s'.repeat(64));issueAccess(db,'qa','teacher','t'.repeat(64));
 const server=receiver(db);await new Promise(r=>server.listen(0,'127.0.0.1',r));const endpoint=`http://127.0.0.1:${server.address().port}`;
 const link=(role,token)=>readInvitation({schema:'sendero.invitation.v1',classId:'qa',role,token,endpoint},role);
 const project=newWorkshop(1,321);
 while(!project.completedAt){const m=currentMission(project);project.records[project.index].model=solvedModel(m);for(const a of [{type:'check'},{type:'reason',value:m.reason},{type:'next'}])applyWorkshopAction(project,a);}
 const student={profile:'qa-projects',sessions:[],teacher:[],workshopHistory:[project],classroom:link('student','s'.repeat(64))},teacher={profile:'qa-teacher',sessions:[],teacher:[],classroom:link('teacher','t'.repeat(64))};
 try{
  applyExchange(student,await exchangeClassroom(student));assert.equal(db.prepare('SELECT count(*) AS n FROM projects').get().n,0);
  student.classroom.includeProjects=true;applyExchange(student,await exchangeClassroom(student));applyExchange(student,await exchangeClassroom(student));assert.equal(db.prepare('SELECT count(*) AS n FROM projects').get().n,1);
  applyExchange(teacher,await exchangeClassroom(teacher));assert.equal(teacher.teacherProjects[0].projects[0].id,project.id);
  await assert.rejects(()=>classroomRequest(student.classroom,'/projects'));
  await assert.rejects(()=>classroomRequest(student.classroom,'/projects',{profile:'other-profile',projects:[project]}));
 }finally{await new Promise(r=>server.close(r));db.close();}
});
