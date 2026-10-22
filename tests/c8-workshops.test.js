import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {openDatabase,issueAccess,receiver} from '../server/receiver.mjs';
import {newAssignedSession,advanceAssignedSession,validateReport,summarize} from '../web/core.js';
import {validateTasks,validateAssignedSession,validateAssignedProgress,equivalent,sessionKey} from '../web/assignments.js';
import {applyAssignedWorkshopAction,WORKSHOP_NAMES,workshopEvidence} from '../web/assigned-workshop.js';
import {assignmentReportHTML,taskFromForm} from '../web/assignment-view.js';
import {assignedWorkshopHTML,assignedWorkshopFinishedHTML,workshopEvidenceHTML,bindAssignedWorkshop} from '../web/assigned-workshop-view.js';
import {summarizeReconciliation} from '../web/reconciliation.js';
import {validateSnapshot} from '../web/backup.js';
import {exchangeClassroom,applyExchange,readInvitation} from '../web/classroom.js';
import {profiles,task,workshopTasks,report,completeWorkshop,reasoningTasks,completeReasoning,solution} from './c8-fixtures.mjs';

test('C8 all 64 frozen workshop configurations close with two constructions, a choice and an explicit decision',()=>{
 let n=0;for(const project of Object.keys(WORKSHOP_NAMES))for(let level=1;level<=4;level++)for(const variant of [1,2]){
  const t=task(project,level,variant);validateTasks([t]);const s=completeWorkshop(t);validateReport(report(s));validateAssignedSession(s,[t],t.classId);
  assert.equal(s.taskProtocol,5);assert.deepEqual(s.questions,[]);assert.equal(s.workshop.phase,'review');assert.equal(s.completionAction.kind,'finish-task');
  assert.equal(s.workshop.initial.checks[0].correct,true);assert.equal(s.workshop.probe.checks[0].correct,true);assert.equal(s.workshop.explanation.attempts.length,1);assert(Buffer.byteLength(JSON.stringify(s))<32768);n++;
 }assert.equal(n,64);
});
test('C8 evidence preserves wrong, supported and revised trajectories without equating closure with correctness',()=>{
 for(let i=0;i<4;i++)for(const t of workshopTasks()){
  const s=completeWorkshop(t,profiles[i],i),e=workshopEvidence(s);validateReport(report(s));
  assert.equal(e.initial.first,i===0||i===2);assert.equal(e.initial.final,i!==1);assert.equal(e.initial.firstWithoutHint,i===0);assert.equal(e.probe.final,i!==1);assert.equal(e.explanation.first,i===0||i===2);assert.equal(e.explanation.final,i!==1);
 }
});
test('C8 pending phases restore exactly and cannot advance an unchecked edit or manufacture future work',()=>{
 const t=task('balance'),s=newAssignedSession(t,profiles[0]);
 const check=()=>{const copy=structuredClone(s);validateAssignedProgress(copy);const data={profile:{id:s.profile,name:'Prueba C8',role:'student'},state:{profile:s.profile,sessions:[],teacher:[],adaptive:{},current:copy}};validateSnapshot(data);assert(equivalent(data.state.current,s));};
 check();applyAssignedWorkshopAction(s.workshop,{type:'check'});applyAssignedWorkshopAction(s.workshop,{type:'change',key:'value',delta:1});assert.equal(applyAssignedWorkshopAction(s.workshop,{type:'continue'}),false);check();
 applyAssignedWorkshopAction(s.workshop,{type:'check'});applyAssignedWorkshopAction(s.workshop,{type:'continue'});check();assert.throws(()=>advanceAssignedSession(s));
 applyAssignedWorkshopAction(s.workshop,{type:'reason',value:0});applyAssignedWorkshopAction(s.workshop,{type:'continue'});check();
 const forged=structuredClone(s);forged.workshop.probe.hint=true;assert.throws(()=>validateAssignedProgress(forged));
 applyAssignedWorkshopAction(s.workshop,{type:'check'});applyAssignedWorkshopAction(s.workshop,{type:'continue'});check();assert.equal(s.completedAt,null);advanceAssignedSession(s);validateReport(report(s));
});
test('C8 rejects changed content, forged phase evidence, identity mismatch, incompatible fields and UTF8 overflow',()=>{
 const s=completeWorkshop(task('fraction'),profiles[0]);
 for(const mutate of [x=>x.workshop.content.initial.prompt+='x',x=>x.workshop.content.probe.initial.selected.push(0),x=>x.workshop.initial.checks[0].correct=false,x=>x.workshop.initial.hint=true,x=>x.workshop.events.pop(),x=>x.workshop.phase='verify',x=>x.workshop.note='x'.repeat(601),x=>delete x.completionAction,x=>x.assignmentVersion=2,x=>x.questions.push({}),x=>x.taskProtocol=3,x=>x.index=1,x=>x.adaptation={},x=>x.extra='漢'.repeat(12000),x=>x.workshop.extra='unsupported']){const bad=structuredClone(s);mutate(bad);assert.throws(()=>validateReport(report(bad)));}
 assert.throws(()=>validateAssignedSession(s,[{...task('fraction'),recipientProfileIds:[profiles[1]]}],'c8-local'));
 const wrongClass={...task('fraction'),classId:'another'};assert.throws(()=>validateAssignedSession(s,[wrongClass],'another'));
 for(const parameters of [{project:'unknown',level:1,variant:1},{project:'balance',level:5,variant:1},{project:'balance',level:1,variant:3},{project:'balance',level:1,variant:1,seed:1}])assert.throws(()=>validateTasks([{...task('balance'),parameters}]));
});
test('C8 task form and teacher report preserve construction units and reasoning labels',()=>{
 for(const project of Object.keys(WORKSHOP_NAMES)){
  const f=new FormData();for(const [k,v]of Object.entries({title:'C8',content:`workshop-${project}`,workshopLevel:'4',variant:'2',recipient:profiles[0]}))f.append(k,v);
  const t=taskFromForm(f,{classId:'c8-local',tasks:[]},()=>project);validateTasks([t]);assert.deepEqual(t.parameters,{project,level:4,variant:2});
  const s=completeWorkshop(t,profiles[0],1);s.workshop.note='<img src=x onerror=alert(1)>';
  const html=assignmentReportHTML({teacher:[s],classroom:{tasks:[t]},teacherConfirmations:{[sessionKey(s)]:{classId:t.classId,profile:s.profile,source:'server-read',confirmedAt:s.completedAt}}},true);
  assert(html.includes('1/1 perfiles'));assert(html.includes('construcciones requeridas'));assert(html.includes('aún no cumple'));assert(html.includes('&lt;img'));assert(!html.includes('<img src=x'));assert(!html.includes('0/0'));assert(!html.includes('undefined'));
 }
 for(const t of reasoningTasks()){validateTasks([t]);for(let i=0;i<4;i++){const s=completeReasoning(t,profiles[i],i);validateReport(report(s));assert.equal(s.questions.length,4);assert.equal(new Set(s.questions.map(q=>q.options.indexOf(q.answer))).size,4);const f=new FormData();for(const [k,v]of Object.entries({title:t.title,content:`reasoning-${t.parameters.family}`,expandedLevel:String(t.parameters.level),variant:String(t.parameters.variant),recipient:profiles[i]}))f.append(k,v);validateTasks([taskFromForm(f,{classId:'c8-local',tasks:[]},()=>t.id)]);}}
});
test('C8 reconciliation retains session receipt identity and separates construction units from questions',()=>{
 const tasks=workshopTasks(),sessions=tasks.map(t=>completeWorkshop(t));const rs=completeReasoning(reasoningTasks()[0]);sessions.push(rs);
 const state={teacher:sessions,teacherConfirmations:Object.fromEntries(sessions.map(s=>[sessionKey(s),{classId:'c8-local',profile:s.profile,source:'server-read',confirmedAt:s.completedAt}]))};
 const r=summarizeReconciliation(state,true);assert.equal(r.totals.canonicalEntries,9);assert.equal(r.totals.invalid,0);assert.equal(r.totals.evidenceUnits.assignedWorkshopMissions,8);assert.equal(r.totals.evidenceUnits.assignedInitialChecks,8);assert.equal(r.totals.evidenceUnits.assignedProbeChecks,8);assert.equal(r.totals.evidenceUnits.sessionQuestions,4);assert.equal(summarize(sessions).sessions,1);assert(r.records.every(x=>x.provenance.source==='server-read'));assert.equal(r.diagnostics.conservationDifference,0);
});
test('C8 32 local HTTP workshop deliveries and 32 equivalent replays reach teacher without duplicates',async()=>{
 const db=openDatabase(':memory:');db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run('c8-local','C8 synthetic');
 const teacher='t'.repeat(64),tokens=['a','b','c','d'].map(c=>c.repeat(64));issueAccess(db,'c8-local','teacher',teacher);tokens.forEach(token=>issueAccess(db,'c8-local','student',token));
 const server=receiver(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let requests=0;const endpoint=`http://127.0.0.1:${server.address().port}`;
 const req=async(path,body,token)=>{requests++;const r=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};};
 try{
  const tasks=workshopTasks(),before=await req('/tasks',null,teacher);assert.equal((await req('/tasks',{tasks,expectedRevision:before.data.revision},teacher)).status,200);const sessions=[];
  for(let i=0;i<4;i++){
   assert.equal((await req('/enrollment',{profile:profiles[i],enrollment:{school:'Escuela sintética',grade:'3',group:'C8',listNumber:i+1}},tokens[i])).status,200);
   for(const t of tasks){const s=completeWorkshop(t,profiles[i],i);sessions.push(s);for(let replay=0;replay<2;replay++){const ack=await req('/reports',report(s),tokens[i]);assert.equal(ack.status,200);assert.equal(ack.data.classId,t.classId);assert.equal(ack.data.profile,s.profile);assert.deepEqual(ack.data.accepted,[s.id]);assert(Number.isFinite(Date.parse(ack.data.receivedAt)));}}
  }
  const response=await req('/reports',null,teacher),received=response.data.reports.flatMap(r=>r.sessions);assert.equal(received.length,32);assert.equal(new Set(received.map(sessionKey)).size,32);for(const s of sessions)assert(equivalent(received.find(x=>sessionKey(x)===sessionKey(s)),s));
  const changed=structuredClone(sessions[0]);changed.workshop.note='Un cuerpo distinto con la misma identidad';assert.notEqual((await req('/reports',report(changed),tokens[0])).status,200);assert.equal(db.prepare('SELECT count(*) AS n FROM sessions').get().n,32);
  const student={profile:profiles[0],sessions:[],teacher:[],classroom:readInvitation({schema:'sendero.invitation.v1',classId:'c8-local',role:'student',token:tokens[0],endpoint},'student')};
  applyExchange(student,await exchangeClassroom(student));for(const name of ['assignments-reasoning-v1','assignments-arithmetic-v1','assignments-workshops-v1','assignments-reasoning-expanded-v1'])assert(student.classroom.capabilities.includes(name));
  const source={tasks,sessions:received,teacherConfirmations:Object.fromEntries(received.map(s=>[sessionKey(s),{classId:'c8-local',profile:s.profile,source:'server-read',confirmedAt:response.data.confirmedAt}]))};
  if(process.env.C8_EVIDENCE)writeFileSync(process.env.C8_EVIDENCE,JSON.stringify({publicRequests:0,requests,received:32,replays:32,duplicates:0,maxSessionBytes:Math.max(...received.map(s=>Buffer.byteLength(JSON.stringify(s)))),source},null,2));
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});

test('C8 rejects falsy array models and orphan pending task protocols',()=>{
 for(const [project,field]of [['sharing','baskets'],['fraction','selected'],['pattern','selected'],['data','selected'],['route','path']])for(const value of [null,false,0,'']){
  const pending=newAssignedSession(task(project),profiles[0]);pending.workshop.initial.model[field]=value;assert.throws(()=>validateAssignedProgress(pending));
  const closed=completeWorkshop(task(project)),check=closed.workshop.initial.checks[0],event=closed.workshop.events.find(e=>e.type==='check');check.model[field]=value;event.model[field]=value;closed.workshop.initial.model[field]=value;check.correct=false;event.correct=false;assert.throws(()=>validateReport(report(closed)));
 }
 const current=newAssignedSession(task('balance'),profiles[0]);delete current.assignment;
 const snapshot={profile:{id:current.profile,name:'Prueba C8',role:'student'},state:{profile:current.profile,sessions:[],teacher:[],adaptive:{},current}};assert.throws(()=>validateSnapshot(snapshot));
});

test('C8 expanded reasoning rejects semantic fields absent from the catalog while preserving optional reflection',()=>{
 const t=reasoningTasks().find(t=>t.parameters.family==='dos_pasos'),s=completeReasoning(t);
 for(const mutate of [q=>q.labels={[q.answer]:'TEXTO AJENO'},q=>q.prompt='CONSIGNA AJENA',q=>q.explanation='EXPLICACIÓN AJENA',q=>q.hintText='PISTA AJENA',q=>q.displayAnswer='RESPUESTA AJENA',q=>q.title='TÍTULO AJENO',q=>q.timingProtocol=1]){
  const closed=structuredClone(s);mutate(closed.questions[0]);assert.throws(()=>validateReport(report(closed)));
  const pending=newAssignedSession(t,profiles[0]);mutate(pending.questions[0]);assert.throws(()=>validateAssignedProgress(pending));
 }
 const reflected=structuredClone(s);reflected.questions[0].reflection='<script>nota propia</script>';validateReport(report(reflected));
 const html=assignmentReportHTML({teacher:[reflected],classroom:{tasks:[t]},teacherConfirmations:{[sessionKey(reflected)]:{classId:t.classId,profile:reflected.profile,source:'server-read',confirmedAt:reflected.completedAt}}},true);
 assert(html.includes('&lt;script&gt;nota propia&lt;/script&gt;'));assert(!html.includes('<script>nota propia'));
});

test('C8 imported or restored workshops remain readable without a catalog and do not fabricate group coverage',()=>{
 const s=completeWorkshop(task('balance'),profiles[0],3);s.workshop.note='NOTA PROPIA CONSERVADA';validateReport(report(s));
 const imported={profile:'000899',teacher:[s],teacherConfirmations:{[sessionKey(s)]:{classId:s.assignment.classId,profile:s.profile,source:'manual-file',confirmedAt:s.completedAt}}};
 const student=validateSnapshot({profile:{id:s.profile,name:'Perfil C8',role:'student'},state:{profile:s.profile,current:null,sessions:[s],teacher:[],adaptive:{},classroom:{tasks:[task('balance')]}}}).state;
 assert.equal(student.classroom,undefined);
 for(const [state,teacher]of [[imported,true],[student,false]]){
  const html=assignmentReportHTML(state,teacher);assert(html.includes('Intentos fuera del catálogo disponible'));assert(html.includes('Catálogo y destinatario no verificados'));assert(html.includes(s.workshop.content.initial.prompt));assert(html.includes(s.workshop.content.probe.prompt));assert(html.includes('Comprobación 1'));assert(html.includes('NOTA PROPIA CONSERVADA'));assert(html.includes('Construcción posterior'));
  assert(!html.includes('0/0'));assert(!html.includes('perfiles con informe recibido'));assert(!html.includes('acuse del servidor de esta entrega'));
  if(teacher)assert(html.includes('archivo importado; identidad y catálogo no verificados'));else assert(html.includes('Sin acuse en este dispositivo.'));
 }
 const forged=structuredClone(imported);forged.teacher[0].workshop.content.initial.prompt='ESTÍMULO FALSIFICADO';const rejected=assignmentReportHTML(forged,true);assert(rejected.includes('no puede interpretarse'));assert(!rejected.includes('ESTÍMULO FALSIFICADO'));
});

test('C8 six reasoning variants keep balanced but distinct answer-position sequences',()=>{
 const sequences=reasoningTasks().map(t=>newAssignedSession(t,profiles[0]).questions.map(q=>q.options.indexOf(q.answer)));
 assert.equal(new Set(sequences.map(x=>JSON.stringify(x))).size,6);for(const sequence of sequences)assert.deepEqual([...sequence].sort(),[0,1,2,3]);
});

test('C8 visible construction evidence includes available paths, tiles and chart values for both stimuli',()=>{
 for(const project of ['route','pattern','data']){
  const s=completeWorkshop(task(project));const html=assignmentReportHTML({profile:s.profile,sessions:[s]},false);
  for(const m of [s.workshop.content.initial,s.workshop.content.probe]){
   if(project==='route'){assert(html.includes('Tramos disponibles, en el orden presentado'));for(const [i,paths]of m.paths.entries())assert(html.includes(`Etapa ${i+1}: ${paths.join(' o ')} pasos`));}
   if(project==='pattern'){assert(html.includes('Fichas disponibles, en el orden presentado'));assert(html.includes(m.tiles.join(', ')));assert(html.includes(m.sequence.join(', ')));}
   if(project==='data'){assert(html.includes('Cantidades presentadas'));for(const [i,value]of m.values.entries())assert(html.includes(`${['Peras','Manzanas','Ciruelas'][i]}: ${value}`));}
  }
  assert(html.includes('Alternativas presentadas, en su orden original'));
 }
});


test('C8 explanation revisits preserve correct-wrong-correct history and reject consecutive repeats',()=>{
 const s=newAssignedSession(task('balance'),profiles[0]),w=s.workshop;
 const act=a=>assert.equal(applyAssignedWorkshopAction(w,a),true);
 act({type:'check'});act({type:'continue'});
 const correct=w.content.initial.reason,wrong=(correct+1)%w.content.initial.reasons.length;
 act({type:'reason',value:correct});
 const duplicate=structuredClone(s);duplicate.workshop.explanation.attempts.push(correct);duplicate.workshop.events.push({type:'reason',value:correct});assert.throws(()=>validateAssignedProgress(duplicate));
 assert.equal(applyAssignedWorkshopAction(w,{type:'reason',value:correct}),false);
 act({type:'reason',value:wrong});
 const revisitable=assignedWorkshopHTML(s);assert(revisitable.includes(`data-project-reason="${correct}" >`));assert(revisitable.includes(`data-project-reason="${wrong}" disabled`));
 act({type:'reason',value:correct});validateAssignedProgress(s);
 assert.deepEqual(w.explanation.attempts,[correct,wrong,correct]);assert.deepEqual(w.events.filter(e=>e.type==='reason').map(e=>e.value),[correct,wrong,correct]);
 assert(assignedWorkshopHTML(s).includes('Elecciones registradas: 3/20.'));
 act({type:'continue'});act({type:'check'});act({type:'continue'});advanceAssignedSession(s);validateReport(report(s));
 assert.equal(workshopEvidence(s).explanation.first,true);assert.equal(workshopEvidence(s).explanation.final,true);assert.equal(workshopEvidence(s).explanation.attempts,3);
 const html=assignmentReportHTML({profile:s.profile,sessions:[s]},false);assert(html.includes('no oportunidades independientes'));assert(html.includes('no corresponde a la relación'));
});

test('C8 all configurations retain bounded 20-choice histories and 66-event maximum without misleading limit text',()=>{
 for(const project of Object.keys(WORKSHOP_NAMES))for(let level=1;level<=4;level++)for(const variant of [1,2]){
  const s=newAssignedSession(task(project,level,variant),profiles[0]),w=s.workshop;
  const act=a=>assert.equal(applyAssignedWorkshopAction(w,a),true);
  act({type:'hint'});for(let i=0;i<20;i++)act({type:'check'});
  const buildHTML=assignedWorkshopHTML(s);assert(buildHTML.includes('Alcanzaste el límite de comprobaciones'));assert(!buildHTML.includes('Puedes revisarlo o continuar.'));assert.equal(applyAssignedWorkshopAction(w,{type:'check'}),false);assert.equal(applyAssignedWorkshopAction(w,{type:'reset'}),false);validateAssignedProgress(s);
  act({type:'continue'});act({type:'hint'});
  const correct=w.content.initial.reason,wrong=(correct+1)%w.content.initial.reasons.length;
  const choices=Array.from({length:20},(_,i)=>i%2?wrong:correct);for(const value of choices)act({type:'reason',value});
  assert.deepEqual(w.explanation.attempts,choices);assert.equal(applyAssignedWorkshopAction(w,{type:'reason',value:correct}),false);validateAssignedProgress(s);
  const limitHTML=assignedWorkshopHTML(s);assert(limitHTML.includes('Elecciones registradas: 20/20.'));assert(limitHTML.includes('Alcanzaste el límite de elecciones'));assert(!limitHTML.includes('Puedes revisar otra opción'));for(let i=0;i<w.content.initial.reasons.length;i++)assert(limitHTML.includes(`data-project-reason="${i}" disabled`));
  const extraChoice=structuredClone(s);extraChoice.workshop.explanation.attempts.push(correct);extraChoice.workshop.events.push({type:'reason',value:correct});assert.throws(()=>validateAssignedProgress(extraChoice));
  act({type:'continue'});act({type:'hint'});for(let i=0;i<20;i++)act({type:'check'});act({type:'continue'});act({type:'note',value:'漢'.repeat(600)});
  assert.equal(w.events.length,66);advanceAssignedSession(s);validateReport(report(s));assert(Buffer.byteLength(JSON.stringify(s))<=32768);
  const overflow=structuredClone(s);overflow.workshop.events.push({type:'continue',phase:'verify'});assert.equal(overflow.workshop.events.length,67);assert.throws(()=>validateReport(report(overflow)));
 }
});

test('C8 student review keeps delivery and optional note before a closed, complete evidence drawer',()=>{
 const marker='<details class="student-workshop-details"><summary>Ver mis construcciones y elecciones</summary>';
 for(let trajectory=0;trajectory<4;trajectory++){
  const s=completeWorkshop(task('balance'),profiles[trajectory],trajectory);s.workshop.note='<nota propia>';
  const evidence=workshopEvidenceHTML(s),review=assignedWorkshopHTML(s),finished=assignedWorkshopFinishedHTML(s,true);
  for(const html of [review,finished]){
   const boundary=html.indexOf(marker);assert(boundary>0);assert(html.includes(marker+evidence+'</details>'));
   const visibleBeforeDetails=html.slice(0,boundary);assert(!visibleBeforeDetails.includes('Interacción 5'));assert(!visibleBeforeDetails.includes('denominadores'));assert(!visibleBeforeDetails.includes('transferencia independiente'));
   assert(visibleBeforeDetails.includes('Has comprobado dos construcciones y elegido una explicación.'));assert(visibleBeforeDetails.includes('Primera construcción:'));assert(visibleBeforeDetails.includes('Segunda construcción:'));assert(visibleBeforeDetails.includes('Última explicación:'));
   assert(html.includes('Orden de acciones registradas'));assert(html.includes('Construcción posterior'));assert(html.includes('&lt;nota propia&gt;'));assert(!html.includes('<nota propia>'));
  }
  const noteStart=review.indexOf('<div class="project-discovery">'),noteEnd=review.indexOf('</div>',noteStart),textarea=review.indexOf('<textarea id="assigned-workshop-note"');
  assert(noteStart>0&&textarea>noteStart&&textarea<noteEnd);assert(review.includes('<label for="assigned-workshop-note">'));
  assert(noteEnd<review.indexOf('data-assigned-finish'));assert(review.indexOf('data-assigned-finish')<review.indexOf(marker));assert(review.includes('Escribir esta nota es opcional.'));
  assert(finished.indexOf('href="#progreso"')<finished.indexOf(marker));assert(!finished.includes('data-assigned-finish'));assert(finished.includes('puedes ver si tu docente la recibió'));
  const unsaved=assignedWorkshopFinishedHTML(s,false);assert(unsaved.includes('No pudimos confirmar el guardado'));assert(!unsaved.includes('Tu tarea está guardada'));
 }
});


test('C8 explanation grid wrapper preserves reason selectors and focus after a choice',()=>{
 const s=newAssignedSession(task('balance'),profiles[0]);applyAssignedWorkshopAction(s.workshop,{type:'check'});applyAssignedWorkshopAction(s.workshop,{type:'continue'});
 const html=assignedWorkshopHTML(s);assert(html.includes('<div class="project-explain"><div><button'));for(let i=0;i<s.workshop.content.initial.reasons.length;i++)assert(html.includes(`data-project-reason="${i}"`));
 let buttons=[],saves=0,renders=0,focused='';const makeButtons=()=>{buttons=s.workshop.content.initial.reasons.map((_,i)=>({dataset:{projectReason:String(i)},disabled:s.workshop.explanation.attempts.at(-1)===i,hasAttribute:()=>false,addEventListener(type,handler){this[type]=handler;},focus(){focused='button-'+i;}}));};makeButtons();
 const root={querySelector:selector=>selector==='#assigned-workshop-prompt'?{focus(){focused='prompt';}}:null,querySelectorAll:()=>buttons};
 bindAssignedWorkshop(root,s,{save(){saves++;},render(){renders++;makeButtons();},finish(){assert.fail('A reason choice must not submit the task.');}});
 buttons[0].click();assert.equal(saves,1);assert.equal(renders,1);assert.deepEqual(s.workshop.explanation.attempts,[0]);assert.equal(focused,'prompt');assert.equal(s.workshop.phase,'explain');
});
