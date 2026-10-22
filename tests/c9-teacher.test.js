import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REASONING_C9_FAMILIES} from '../web/reasoning-c9.js';
import {assignedItems} from '../web/task-content.js';
import {workshopContentV1} from '../web/workshop-catalog.js';
import {validateTasks,sessionKey,equivalent} from '../web/assignments.js';
import {buildTaskPreview,taskPreviewHTML,TASK_DATA_NOTICE} from '../web/task-preview.js';
import {taskFormHTML,taskFromForm,taskListHTML,assignmentReportHTML,createTaskDraftController,bindTaskFields} from '../web/assignment-view.js';
import {WORKSHOP_NAMES} from '../web/assigned-workshop.js';
import {profiles,task,completeReasoning,completeWorkshop} from './c8-fixtures.mjs';

const capabilities=['assignments-v2','assignments-reasoning-v1','assignments-arithmetic-v1','assignments-reasoning-expanded-v1','assignments-reasoning-expanded-v2','assignments-workshops-v1'];
const classroom=()=>({classId:'c9-local',tasks:[],students:profiles.map(profile=>({profile})),capabilities:[...capabilities]});
const fields=(content='multiply-fixed-table',changes={})=>{
 const f=new FormData();for(const [k,v]of Object.entries({revision:'',title:'Práctica C9',content,table:'3',level:'1',arithmeticLevel:'2',workshopLevel:'2',expandedLevel:'3',variant:'1',count:'4',...changes}))f.set(k,v);
 for(const profile of profiles)f.append('recipient',profile);return f;
};
const makeTask=(f,link=classroom())=>taskFromForm(f,link,()=> 'c9-task','2026-10-22T06:00:00Z');
const expectedInsideSolution=(html)=>{
 const stack=[];for(const m of html.matchAll(/<details\b[^>]*>|<\/details>|Respuesta esperada:|Explicación editorial esperada:/g)){
  if(m[0].startsWith('<details'))stack.push(m[0].includes('task-preview-solution'));
  else if(m[0]==='</details>')stack.pop();else assert(stack.some(Boolean),'A solution label escaped the teacher-only details.');
 }
};

test('C9 forms distinguish content versions, fixed catalog levels, tracked work and collapsed orientation',()=>{
 const html=taskFormHTML({classroom:classroom()});
 assert(html.indexOf('id="class-task"')<html.indexOf('id="class-task-legacy"'));
 assert(html.includes('<details class="legacy-task-orientation"><summary>'));
 assert(html.includes('type="button" class="secondary" data-task-preview'));
 assert(html.includes('type="submit" class="primary" data-task-publish aria-describedby="task-preview-status" disabled'));
 assert(html.includes('name="c9Level" disabled'));assert(html.includes('contenido v1'));assert(html.includes('contenido v2'));
 assert.equal(REASONING_C9_FAMILIES.length,6);
 for(const family of REASONING_C9_FAMILIES)for(const variant of [1,2]){
  const t=makeTask(fields('reasoning-v2-'+family.id,{variant:String(variant)}));validateTasks([t]);
  assert.equal(t.contentVersion,2);assert.deepEqual(t.parameters,{family:family.id,level:family.level,variant});assert.equal(t.completionRule.count,4);
  assert(html.includes(`value="reasoning-v2-${family.id}"`));
 }
 const v1=makeTask(fields('reasoning-dos_pasos'));assert.equal(v1.contentVersion,1);assert.deepEqual(v1.parameters,{family:'dos_pasos',level:3,variant:1});
 const unsupported=classroom();unsupported.capabilities=unsupported.capabilities.filter(x=>x!=='assignments-reasoning-expanded-v2');assert(!taskFormHTML({classroom:unsupported}).includes('value="reasoning-v2-'));
});

test('C9 preview uses exact validated item packs and all frozen workshop stimuli without mutating source data',()=>{
 for(const family of REASONING_C9_FAMILIES)for(const variant of [1,2]){
  const t=makeTask(fields('reasoning-v2-'+family.id,{variant:String(variant)})),before=structuredClone(t),p=buildTaskPreview(t);
  assert.deepEqual(p.task,t);assert.deepEqual(p.items,assignedItems(t));assert.equal(p.items.length,4);assert.deepEqual(t,before);
  p.items[0].prompt='modified preview copy';p.task.title='modified task copy';assert.deepEqual(t,before);assert.notEqual(assignedItems(t)[0].prompt,p.items[0].prompt);
 }
 let n=0;for(const project of Object.keys(WORKSHOP_NAMES))for(const level of [1,2,3,4])for(const variant of [1,2]){
  const t=task(project,level,variant),p=buildTaskPreview(t),html=taskPreviewHTML(p);
  assert.deepEqual(p.workshop,workshopContentV1(t.parameters));assert.deepEqual(p.items,[]);assert(html.includes(p.workshop.initial.prompt));assert(html.includes(p.workshop.probe.prompt));assert(!html.includes('no se inventa un modelo resuelto'));expectedInsideSolution(html);n++;
 }assert.equal(n,64);
 const legacy=buildTaskPreview(makeTask(fields()));assert.equal(legacy.variableChoices,true);assert.deepEqual(legacy.items.map(q=>[q.a,q.b]),Array.from({length:8},(_,i)=>[3,i+1]));assert(taskPreviewHTML(legacy).includes('Las opciones y su orden se generan al jugar'));
});

test('C9 preview renders literal options and keeps support/solutions in explicit closed teacher details',()=>{
 const contents=['represent-fixed-pack','arithmetic-suma','arithmetic-resta','arithmetic-tablas20','reasoning-dos_pasos',...REASONING_C9_FAMILIES.map(f=>'reasoning-v2-'+f.id)];
 for(const content of contents){
  const t=makeTask(fields(content)),p=buildTaskPreview(t),before=JSON.stringify(p),html=taskPreviewHTML(p);assert.equal(JSON.stringify(p),before);
  assert(html.includes('task-preview-solution'));assert(!html.includes('<details open'));expectedInsideSolution(html);assert(html.includes(TASK_DATA_NOTICE));
  for(const q of p.items)assert(html.includes(String(q.prompt||`${q.a} ${t.trail==='suma'?'+':t.trail==='resta'?'−':'×'} ${q.b}`).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')));
  const replacement=structuredClone(p);replacement.items[0].prompt='FORGED PREVIEW';assert(!taskPreviewHTML(replacement).includes('FORGED PREVIEW'));
 }
 const t=makeTask(fields('arithmetic-suma',{title:'<svg onload=alert(1)>'})),html=taskPreviewHTML(buildTaskPreview(t));assert(html.includes('&lt;svg'));assert(!html.includes('<svg onload'));
});

test('C9 publication preserves the exact preview ID, timestamp and normalized body, rejecting changes and invalidation',()=>{
 const link=classroom(),original=structuredClone(link);let ids=0,dates=0;
 const c=createTaskDraftController(link,()=>`draft-${++ids}`,()=>{dates++;return '2026-10-22T06:00:00Z';});const f=fields('reasoning-v2-'+REASONING_C9_FAMILIES[0].id);
 assert.throws(()=>c.taskForPublish(f));const preview=c.preview(f);assert(c.isReady());const published=c.taskForPublish(f);assert.deepEqual(published,preview.task);assert.equal(ids,1);assert.equal(dates,1);assert.deepEqual(link,original);
 published.title='external mutation';assert.notEqual(c.taskForPublish(f).title,published.title);
 const changed=fields('reasoning-v2-'+REASONING_C9_FAMILIES[0].id,{title:'Changed'});assert.throws(()=>c.taskForPublish(changed));
 const removed=structuredClone(link);removed.students.pop();assert.throws(()=>c.taskForPublish(f,removed));
 const elsewhere={...link,classId:'another-class'};assert.throws(()=>c.taskForPublish(f,elsewhere));
 c.invalidate();assert.equal(c.isReady(),false);assert.throws(()=>c.taskForPublish(f));
 const noCapability=classroom();noCapability.capabilities=noCapability.capabilities.filter(x=>x!=='assignments-reasoning-expanded-v2');assert.throws(()=>createTaskDraftController(noCapability,()=> 'x').preview(f));
 const nonexistent=fields('arithmetic-suma',{revision:'missing'});assert.throws(()=>createTaskDraftController(link,()=> 'x').preview(nonexistent));
});

test('C9 revision comparison preserves the previous task and refuses an intervening published version',()=>{
 const link=classroom(),old=makeTask(fields('arithmetic-suma'),link);link.tasks=[old];const original=structuredClone(link),f=fields('arithmetic-resta',{revision:old.id,title:'Revisión de la práctica'});
 const controller=createTaskDraftController(link,()=> 'unused',()=> '2026-10-22T06:10:00Z'),p=controller.preview(f);
 assert.equal(p.task.id,old.id);assert.equal(p.task.version,2);assert.deepEqual(p.previous,old);assert(p.changes.some(x=>x.field==='parameters')===false);assert(p.changes.some(x=>x.field==='trail'));assert.deepEqual(link,original);
 const html=taskPreviewHTML(p);assert(html.includes('Comparar con la versión 1'));assert(html.includes('Anterior:'));assert(html.includes('Nueva:'));
 const drift=structuredClone(link);drift.tasks.push({...old,version:2,assignedAt:'2026-10-22T06:05:00Z'});assert.throws(()=>controller.taskForPublish(f,drift));
 assert.throws(()=>buildTaskPreview({...p.task,id:'different'},old));assert(equivalent(controller.taskForPublish(f),p.task));
});

test('C9 reports use one responsive summary per profile while retaining source, versions and complete episodes',()=>{
 for(const family of REASONING_C9_FAMILIES){
  const t=makeTask(fields('reasoning-v2-'+family.id)),sessions=profiles.map((p,i)=>completeReasoning(t,p,i)),teacherConfirmations=Object.fromEntries(sessions.map((s,i)=>[sessionKey(s),{classId:t.classId,profile:s.profile,source:i%2?'server-read':'manual-file',confirmedAt:s.completedAt}]));
  const html=assignmentReportHTML({teacher:sessions,teacherConfirmations,classroom:{tasks:[t]}},true);
  assert.equal((html.match(/class="assignment-profile-card"/g)||[]).length,4);assert(!html.includes('min-width:600px'));assert(!html.includes('<table'));assert(html.includes('4/4 perfiles'));assert(html.includes('por archivo importado'));assert(html.includes('comprobados al consultar el servidor'));
  assert(html.includes(family.description));assert(html.includes('no dificultad calibrada'));assert(!html.includes('Cobertura acotada: falta la cantidad por grupo.'));
  for(const s of sessions){assert(html.includes('Perfil '+s.profile));assert(html.includes('Intento '+s.id));assert(html.includes('versión 1'));for(const q of s.questions)assert(html.includes(q.prompt.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')));}
 }
 const t=task('balance'),s=completeWorkshop(t,profiles[0],3);s.workshop.note='Nota reconstruible';const confirmation={[sessionKey(s)]:{classId:t.classId,profile:s.profile,source:'manual-file',confirmedAt:s.completedAt}};
 const html=assignmentReportHTML({teacher:[s],teacherConfirmations:confirmation,classroom:{tasks:[t]}},true);assert(html.includes('Orden de acciones registradas'));assert(html.includes('Nota reconstruible'));assert(html.includes('dos construcciones y una fase de elección'));assert(html.includes('Sin evidencia para interpretar'));
 const restored=assignmentReportHTML({profile:s.profile,sessions:[s]},false);assert(restored.includes('Catálogo y destinatario no verificados'));assert(restored.includes('Nota reconstruible'));assert(!restored.includes('0/0'));
 const card=taskListHTML({classroom:{tasks:[t]}});assert(card.includes('El control de compartir talleres libres no detiene esta entrega'));assert(card.includes('Evita datos personales'));
});

test('C9 input/change invalidates only the preview and publish readiness, without rebuilding the form',()=>{
 const events={},nodes={};for(const key of ['#task-preview','#task-preview-status','[data-task-publish]','#task-table-label','#task-content-condition','[data-task-preview]'])nodes[key]={innerHTML:'initial',hidden:false,disabled:false,addEventListener(type,fn){this[type]=fn;}};
 const form={dataset:{},innerHTML:'FORM IDENTITY',elements:{content:{value:'multiply-fixed-table',addEventListener(){}},table:{max:'12'},expandedLevel:{value:'3',options:[{value:'2'},{value:'3'},{value:'4'}]},c9Level:{}},querySelector:key=>nodes[key],querySelectorAll:()=>[],addEventListener(type,fn){events[type]=fn;}};
 const controller=bindTaskFields({querySelector:()=>form},{link:classroom(),uid:()=> 'draft'});
 for(const event of ['input','change']){controller.preview(fields());nodes['#task-preview'].innerHTML='OLD PREVIEW';nodes['#task-preview'].hidden=false;nodes['[data-task-publish]'].disabled=false;events[event]();assert.equal(controller.isReady(),false);assert.equal(nodes['[data-task-publish]'].disabled,true);assert.equal(nodes['#task-preview'].hidden,true);assert.equal(nodes['#task-preview'].innerHTML,'');assert.equal(form.innerHTML,'FORM IDENTITY');assert.equal(form.dataset.taskDirty,'true');}
});

test('C9 stylesheet defines a single-column narrow report without a mandatory wide table',()=>{
 const css=readFileSync(new URL('../web/teacher-c9.css',import.meta.url),'utf8');
 assert(css.includes('grid-template-columns:minmax(0,1fr)'));assert(css.includes('@media(max-width:600px)'));assert(css.includes('overflow-wrap:anywhere'));assert(css.includes('min-height:48px'));assert(!css.includes('min-width:600px'));
 // These source constraints are not a screenshot, CSS layout measurement or physical-phone test.
});
