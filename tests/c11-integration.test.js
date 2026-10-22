import test from 'node:test';
import assert from 'node:assert/strict';
import {newSession,recordAttempt,SCHEMA} from '../web/core.js';
import {LIVE_RECORD,newLiveRoom,joinLiveRoom,expireLiveRoom,liveParticipation,validateLiveParticipation} from '../web/cloud-room-contract.js';
import {validateMultiplayerReport,validateMultiplayerRecord,MULTIPLAYER_SCHEMA} from '../web/multiplayer-records.js';
import {importMultiplayerCopies,exchangeClassroom,applyExchange} from '../web/classroom.js';
import {summarizeReconciliation,RECONCILIATION_STATUS_LABELS} from '../web/reconciliation.js';
import {reconciliationSummaryHTML,reconciliationCSV} from '../web/reconciliation-view.js';
import {cloudTeacherReportHTML} from '../web/cloud-room-view.js';

const profiles=['0001151','0001152','0001153','0001154'];
const classId='c11-integracion-aula',at='2026-10-22T16:00:00.000Z';
function cloudRecords(id='c11-integration-room'){
  const room=newLiveRoom({id,classroom:classId,seed:101,at:Date.parse(at),config:{trail:'multi',level:1,circuit:'bosque',mode:'coop'}});
  for(const profile of profiles)joinLiveRoom(room,{classroom:classId,role:'student',profile,hash:'a'.repeat(64)},room.clock);
  expireLiveRoom(room,'teacher_closed',room.clock+1000);
  return room.members.map(member=>liveParticipation(room,member));
}
function legacyRecord(){
  const record=newSession('suma',1,profiles[0]);for(const q of record.questions)recordAttempt(q,q.answer);
  Object.assign(record,{id:'legacy-c11',completedAt:new Date().toISOString(),finishedMs:1000,transport:'local',mode:'coop',participants:4,enrollment:{school:'Escuela sintética',grade:'3',group:'C11',listNumber:1}});
  return validateMultiplayerRecord(record);
}
function state(role='teacher'){
  return {profile:role==='teacher'?'0001190':profiles[0],sessions:[],teacher:[],teacherProjects:[],teacherMultiplayer:[],multiplayerHistory:[],classroom:{enabled:true,role,endpoint:'https://local-test.invalid',classId,token:'synthetic-only-no-real-credential',capabilities:['multiplayer','paged-reports'],capabilitiesAt:Date.now(),tasks:[],multiplayerCursor:0,received:[]}};
}

test('C11 integración: cuatro copias cloud se conservan y no alteran denominadores ni CSV C4',()=>{
  const teacher=state(),cloud=cloudRecords(),legacy=legacyRecord();
  // Untrusted wrapper claims are not reception proofs; import retains only validated records.
  const manual=cloud.flatMap(record=>validateMultiplayerReport({schema:MULTIPLAYER_SCHEMA,profile:record.profile,multiplayer:[record],confirmationSource:'server-read',accepted:[record.id]}).multiplayer);
  importMultiplayerCopies(teacher,[legacy,...manual]);importMultiplayerCopies(teacher,manual);
  assert.equal(teacher.teacherMultiplayer.length,5);assert(!teacher.teacherMultiplayerConfirmations);assert(!teacher.teacherConfirmations);
  const before=JSON.stringify(teacher),summary=summarizeReconciliation(teacher,true);
  assert.equal(JSON.stringify(teacher),before,'El análisis no modifica ni elimina registros.');
  assert.equal(summary.totals.inspectedEntries,5);assert.equal(summary.totals.inputEntries,1);assert.equal(summary.ledger.length,1);assert.equal(summary.totals.canonicalEntries,1);assert.equal(summary.totals.evidenceUnits.participationQuestions,8);
  assert.equal(summary.outsideLegacy.count,4);assert.equal(summary.outsideLegacy.label,RECONCILIATION_STATUS_LABELS.outside_legacy);assert(summary.outsideLegacy.entries.every(row=>row.status==='outside_legacy'&&row.href==='#cloud-participation-report'&&row.reason.includes('panel propio')));
  assert.equal(summary.totals.invalid,0);assert.equal(summary.totals.incomplete,0);assert.equal(summary.diagnostics.conservationDifference,0);assert.equal(summary.totals.inspectedEntries,summary.totals.inputEntries+summary.outsideLegacy.count);
  for(const rows of Object.values(summary.partitions)){assert.equal(rows.reduce((n,row)=>n+row.count,0),1);assert(rows.every(row=>row.denominator===1));}
  const csv=reconciliationCSV(summary);assert(csv.includes(legacy.id));assert(cloud.every(record=>!csv.includes(record.id)));
  assert.match(reconciliationSummaryHTML(summary),/Diferencia de conservación: 0/);
  const html=cloudTeacherReportHTML(cloud.map(record=>({record,delivery:'received'})));assert.match(html,/Importado, sin acuse verificado/);assert(!html.includes('Lectura autenticada'));assert(!html.includes('Acuse D1 confirmado'));assert.equal([...html.matchAll(/<dt>Retos con respuesta<\/dt>\s*<dd>0\/8<\/dd>/g)].length,4);
  const filtered=summarizeReconciliation(teacher,true,{student:'absent'});assert.equal(filtered.totals.visibleEntries,0);assert.equal(filtered.outsideLegacy.count,4,'La frontera no desaparece al filtrar otro universo.');
});

test('C11 integración: sincronizar conserva copias sin fabricar procedencia histórica o acuses persistentes',async()=>{
  const teacher=state(),cloud=cloudRecords(),paths=[];
  const fetcher=async(url,options)=>{
    const path=new URL(url).pathname+new URL(url).search;paths.push(path);assert.equal(options.method,'GET');
    if(path==='/tasks')return Response.json({tasks:[]});
    if(path==='/reports?after=0')return Response.json({reports:[],cursor:0,confirmedAt:at,confirmationSource:'server-read'});
    if(path==='/multiplayer?after=0'||path==='/multiplayer?after=4')return Response.json({reports:cloud.map(record=>({schema:MULTIPLAYER_SCHEMA,profile:record.profile,multiplayer:[record]})),cursor:4,confirmedAt:at,confirmationSource:'server-read'});
    throw Error('Unexpected mock path '+path);
  };
  applyExchange(teacher,await exchangeClassroom(teacher,fetcher));assert.equal(teacher.teacherMultiplayer.length,4);assert.equal(teacher.classroom.multiplayerCursor,4);
  applyExchange(teacher,await exchangeClassroom(teacher,fetcher));assert.equal(teacher.teacherMultiplayer.length,4);assert(paths.includes('/multiplayer?after=4'));
  assert(!teacher.teacherMultiplayerConfirmations);assert(teacher.teacherMultiplayer.every(record=>!Object.hasOwn(record,'classId')),'No se injerta el aula actualmente vinculada en el cuerpo canónico.');
  const html=cloudTeacherReportHTML(teacher.teacherMultiplayer.map(record=>({record})),{source:'imported'});assert.match(html,/sin acuse verificado/);assert(!html.includes('Acuse D1 confirmado'));
  assert.equal(summarizeReconciliation(teacher,true).totals.denominator,0);assert.equal(summarizeReconciliation(teacher,true).outsideLegacy.count,4);
});

test('C11 integración: conflictos canónicos o proyectos inválidos no adelantan cursor ni mutan colecciones',()=>{
  const teacher=state(),cloud=cloudRecords();importMultiplayerCopies(teacher,cloud);teacher.classroom.multiplayerCursor=4;
  const changed=structuredClone(cloud[0]);changed.mode='race';validateLiveParticipation(changed);
  const before=JSON.stringify(teacher);assert.throws(()=>importMultiplayerCopies(teacher,[changed]),/misma participación/);assert.equal(JSON.stringify(teacher),before);
  assert.throws(()=>applyExchange(teacher,{tasks:[],sessions:[],multiplayer:[changed],multiplayerCursor:5,at}),/misma participación/);assert.equal(JSON.stringify(teacher),before);
  const more=cloudRecords('another-cloud-room');assert.throws(()=>applyExchange(teacher,{tasks:[],sessions:[],multiplayer:more,multiplayerCursor:8,projects:[{profile:profiles[0],projects:[{}]}],at}));assert.equal(JSON.stringify(teacher),before,'Un fallo en otra colección tampoco deja los registros cloud parcialmente aplicados.');
});

test('C11 integración: el alumno sólo carga el registro histórico permitido y conserva los excluidos',async()=>{
  const student=state('student'),cloud=cloudRecords()[0],legacy=legacyRecord(),reserved=structuredClone(legacy);reserved.id='live-reserved-id';validateMultiplayerRecord(reserved);
  student.classroom.includeMultiplayer=true;student.multiplayerHistory=[cloud,reserved,legacy];const saved=JSON.stringify(student.multiplayerHistory),posted=[];
  const fetcher=async(url,options)=>{
    const path=new URL(url).pathname;
    if(path==='/tasks')return Response.json({tasks:[]});
    if(path==='/multiplayer'){const body=JSON.parse(options.body);posted.push(body);return Response.json({profile:student.profile,classId,accepted:body.multiplayer.map(record=>record.id)});}
    throw Error('Unexpected mock path '+path);
  };
  const result=await exchangeClassroom(student,fetcher);assert.equal(posted.length,1);assert.deepEqual(posted[0].multiplayer.map(record=>record.id),[legacy.id]);assert(posted[0].multiplayer.every(record=>record.schema!==LIVE_RECORD&&!record.id.startsWith('live-')));
  applyExchange(student,result);assert.deepEqual(student.classroom.multiplayerReceived,[legacy.id]);assert.equal(JSON.stringify(student.multiplayerHistory),saved,'Excluir de transporte no borra ni reinterpreta el historial.');
});
