import {validateAssignedWorkshop,workshopEvidence} from './assigned-workshop.js';
import {validateReasoningSupportEvents,reasoningSupportEvidence} from './reasoning-support.js';
import {assignedItems,taskDescription,validContentTask,validAssignedItem} from './task-content.js';
export {taskDescription};
// Runtime contract C2. C1's demonstration remains unchanged and is not a transport format.
export const TASK_SCHEMA = 'sendero.assignment.v2';
const trails = ['suma','resta','multi','tablas20','razonar'];
const id = x => typeof x==='string' && /^[a-zA-Z0-9-]{1,80}$/.test(x);
const int = (x,a,b) => Number.isInteger(x)&&x>=a&&x<=b;
const iso = x => typeof x==='string' && /(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
function require(ok,msg='Contrato de tarea no válido.') {if(!ok)throw Error(msg);}
function keys(x,fields) {require(x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===fields.split(' ').sort().join('|'));}
export const canonical = x => Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
export const equivalent = (a,b) => JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export const isAssignedTask = t => t?.schema===TASK_SCHEMA;
export const sessionKey = s => `${s.assignment?.classId||''}/${s.profile}/${s.id}`;
export const assignmentKey = t => `${t.classId}/${t.id}@${t.version}`;
function validateTask(t,recipients=true) {
  keys(t,'schema classId id version title trail contentId contentVersion parameters completionRule assignedAt'+(recipients?' recipientProfileIds':''));
  require(isAssignedTask(t)&&id(t.classId)&&id(t.id)&&int(t.version,1,100000));
  require(typeof t.title==='string'&&t.title.trim().length>0&&t.title.length<=100);
  if(['represent-fixed-pack','arithmetic-fixed-pack','reasoning-fixed-pack','reasoning-supported-pack','workshop-fixed-project'].includes(t.contentId)){require(validContentTask(t),'Paquete de contenido no compatible.');}
  else {require(t.trail==='multi'&&t.contentId==='multiply-fixed-table'&&t.contentVersion===1,'Paquete de contenido no compatible. Actualiza Sendero para abrir contenidos nuevos.');
  keys(t.parameters,'table');require(int(t.parameters.table,1,12));
  keys(t.completionRule,'kind count');require(t.completionRule.kind==='answered_items'&&t.completionRule.count===8);}
  require(iso(t.assignedAt));
  if(recipients) require(Array.isArray(t.recipientProfileIds)&&t.recipientProfileIds.length>0&&t.recipientProfileIds.length<=60&&t.recipientProfileIds.every(id)&&new Set(t.recipientProfileIds).size===t.recipientProfileIds.length,'Destinatarios de tarea no válidos.');
  return t;
}
export function validateTasks(tasks) {
  require(Array.isArray(tasks)&&tasks.length<=100,'Lista de tareas no válida.');
  const unique=new Set();
  return tasks.map(t=>{
    if(isAssignedTask(t))validateTask(t);
    else {keys(t,'id title trail');require(id(t.id)&&typeof t.title==='string'&&t.title.trim().length>0&&t.title.length<=100&&trails.includes(t.trail),'Tarea anterior no válida.');}
    const k=isAssignedTask(t)?assignmentKey(t):'legacy/'+t.id;
    require(!unique.has(k),'Tarea/version duplicada.');unique.add(k);return structuredClone(t);
  });
}
export function assignmentSnapshot(task) {validateTask(task);const {recipientProfileIds,...snapshot}=task;return structuredClone(snapshot);}
export function mergeTaskHistory(existing,incoming,classId) {
  const old=validateTasks(existing),next=validateTasks(incoming),merged=[...old];
  for(const t of next) {
    if(isAssignedTask(t))require(t.classId===classId,'Tarea de otra aula.');
    const found=merged.find(x=>isAssignedTask(t)?isAssignedTask(x)&&assignmentKey(x)===assignmentKey(t):!isAssignedTask(x)&&x.id===t.id);
    if(found){require(equivalent(found,t),'Una versión publicada es inmutable; crea la siguiente versión.');continue;}
    if(isAssignedTask(t)){
      const versions=merged.filter(x=>isAssignedTask(x)&&x.classId===t.classId&&x.id===t.id).map(x=>x.version);
      require(t.version===(versions.length?Math.max(...versions)+1:1),'La nueva versión debe ser consecutiva.');
    }
    merged.push(t);
  }
  require(merged.length<=100,'Límite de historial de tareas alcanzado.');return merged;
}
export function visibleTasks(tasks,profile) {
  return validateTasks(tasks).filter(t=>!isAssignedTask(t)||t.recipientProfileIds.includes(profile)).map(t=>isAssignedTask(t)?{...t,recipientProfileIds:[profile]}:t);
}
export function latestTasks(tasks) {
  return tasks.filter(t=>!isAssignedTask(t)||!tasks.some(x=>isAssignedTask(x)&&x.id===t.id&&x.classId===t.classId&&x.version>t.version));
}
export function validateAssignedProgress(s) {require(!!s.assignment,'Falta la tarea pendiente.');return validateAssignedSession(s,null,null,true);}
export function validateAssignedSession(s,tasks=null,classId=null,pending=false) {
  if(s.assignment===undefined){require(s.assignmentId===undefined&&s.assignmentVersion===undefined&&s.taskProtocol===undefined,'Referencia de tarea incompleta.');return true;}
  const a=validateTask(s.assignment,false);
  require(id(s.id)&&typeof s.version==='string'&&s.version.length<=20,'Identidad de sesión no válida.');
  if(s.taskProtocol>=3)require(new TextEncoder().encode(JSON.stringify(s)).length<=32768,'El registro supera el límite de entrega de 32 KiB.');
  if(pending)require(int(s.index,0,a.completionRule.count-1)&&s.completedAt===null&&s.completionAction===undefined,'Avance pendiente incompatible con la tarea.');
  if(s.taskProtocol===6)require(s.adaptation===undefined&&(pending||s.index===a.completionRule.count-1),'Condición o índice de cierre no compatible con la interacción 6.');
  require(s.assignmentId===a.id&&typeof s.assignmentId==='string'&&int(s.assignmentVersion,1,100000)&&s.assignmentVersion===a.version&&(a.contentId==='workshop-fixed-project'?s.taskProtocol===5:a.contentId==='reasoning-supported-pack'?s.taskProtocol===6:['represent-fixed-pack','reasoning-fixed-pack'].includes(a.contentId)?s.taskProtocol===3:a.contentId==='arithmetic-fixed-pack'?s.taskProtocol===4:[1,2].includes(s.taskProtocol)),'Referencia de tarea no coincide.');
  require(id(s.profile)&&s.trail===a.trail&&!s.race&&s.responseMode===(s.taskProtocol===5?'construction':'choice'),'Condiciones de práctica asignada incompatibles.');
  require(Array.isArray(s.questions)&&s.questions.length===(s.taskProtocol===5?0:a.completionRule.count)&&iso(s.startedAt)&&(pending||iso(s.completedAt)&&Date.parse(s.completedAt)>=Date.parse(s.startedAt)),'Cierre de tarea no válido.');
  if(pending){}
  else if(s.taskProtocol>=2){keys(s.completionAction,'kind at');require(s.completionAction.kind==='finish-task'&&s.completionAction.at===s.completedAt,'Falta la decisión explícita de terminar la tarea.');}
  else require(s.completionAction===undefined,'El protocolo histórico no registra decisión de cierre.');
  if(classId!==null)require(a.classId===classId,'Asignación de otra aula.');
  if(tasks!==null){
    const master=validateTasks(tasks).find(t=>isAssignedTask(t)&&assignmentKey(t)===assignmentKey(a));
    require(master&&master.recipientProfileIds.includes(s.profile)&&equivalent(assignmentSnapshot(master),a),'La sesión no corresponde al catálogo o destinatario asignado.');
  }
  if(s.taskProtocol===5)return validateAssignedWorkshop(s,pending);
  require(s.workshop===undefined,'Evidencia constructiva fuera de su protocolo.');
  const pack=assignedItems(a);
  const level=pack?pack[0].level:a.parameters.table<=3?1:a.parameters.table<=5?2:a.parameters.table<=8?3:4;
  require(s.level===level,'Nivel diferente de las condiciones asignadas.');
  s.questions.forEach((q,i)=>{
    require(q&&Number.isFinite(q.activeMs)&&q.activeMs>=0&&q.activeMs<=86400000&&typeof q.hint==='boolean'&&(typeof q.solutionShown==='boolean'||s.taskProtocol<3&&q.solutionShown===undefined),'Estado de ítem no transportable.');
    if(q.timingProtocol!==undefined)require(q.timingProtocol===1&&typeof q.timingInterrupted==='boolean'&&((pending&&q.attempts?.length===0&&q.firstResponseMs===undefined)||(Number.isFinite(q.firstResponseMs)&&q.firstResponseMs>=0&&q.firstResponseMs<=q.activeMs)),'Tiempo de respuesta no válido.');
    require(pack?validAssignedItem(q,pack[i]):q.itemId===`item-${i+1}`&&q.a===a.parameters.table&&q.b===i+1&&q.answer===q.a*q.b,'Estímulo diferente del contenido asignado.');
    if(['reasoning-fixed-pack','reasoning-supported-pack'].includes(a.contentId)){
      const fields=[...Object.keys(pack[i]),'attempts','events','hint','solutionShown','solutionRequested','done','activeMs','supportProtocol','responseMode','reflection'];
      require(Object.keys(q).every(k=>fields.includes(k)),'Campos ajenos al contenido congelado de razonamiento.');
    }
    if(s.taskProtocol===4){const fields=[...Object.keys(pack[i]),'attempts','events','hint','solutionShown','solutionRequested','done','activeMs','supportProtocol','responseMode','timingProtocol','timingInterrupted','firstResponseMs'];require(Object.keys(q).every(k=>fields.includes(k))&&q.solutionRequested===false,'Campos ajenos al paquete aritmético.');}
    require(q.reflection===undefined||([3,6].includes(s.taskProtocol)&&typeof q.reflection==='string'&&q.reflection.length<=600&&new TextEncoder().encode(JSON.stringify(q.reflection)).length<=2402),'Explicación propia no válida.');
    require(Array.isArray(q.attempts),'Faltan respuestas.');
    require(q.level===level&&[undefined,'choice'].includes(q.responseMode)&&Array.isArray(q.options)&&q.options.length===4&&new Set(q.options).size===4&&q.options.every(n=>int(n,0,2500))&&q.options.includes(q.answer)&&q.attempts.every(n=>q.options.includes(n)),'Opciones incompatibles con la tarea.');
    require(Array.isArray(q.events)&&q.events.length>=(pending?0:1)&&q.events.length<=42&&Array.isArray(q.attempts)&&(pending&&i>=s.index||q.attempts.length>=1),'Falta secuencia de evidencia.');
    if(s.taskProtocol===6){
      const replay=validateReasoningSupportEvents(q,q.events,{pending:pending&&i>=s.index});
      require(q.supportProtocol===6&&equivalent(replay.attempts,q.attempts)&&replay.hint===q.hint&&replay.solutionShown===q.solutionShown&&replay.solutionRequested===q.solutionRequested&&replay.done===q.done,'El estado del ítem no coincide con la secuencia de interacción 6.');
      if(pending&&i>s.index)require(q.events.length===0&&q.attempts.length===0&&!q.hint&&!q.solutionShown&&!q.reflection,'Evidencia en un reto que aún no se ha abierto.');
      return;
    }
    const answers=[];let hint=false,solution=false,correct=false;
    for(const ev of q.events){
      require(!correct,'No se registran acciones después de una respuesta correcta terminal.');
      if(ev?.type==='wrong'||ev?.type==='correct'){
        keys(ev,'type value');require(int(ev.value,0,2500)&&!answers.includes(ev.value));
        require((ev.type==='correct')===(ev.value===q.answer),'Tipo de respuesta inconsistente.');
        answers.push(ev.value);correct=ev.type==='correct';
      }else if(ev?.type==='hint'){keys(ev,'type');require(!hint,'Pista repetida.');hint=true;}
      else if(ev?.type==='solution'){keys(ev,'type');require(!solution&&answers.length>0&&answers.at(-1)!==q.answer,'Solución automática sin error previo.');solution=true;}
      else throw Error('Evento desconocido.');
    }
    if(s.taskProtocol>=3)require(q.supportProtocol===s.taskProtocol&&q.done===correct,'Estado de interacción distinto del protocolo.');
    require(equivalent(answers,q.attempts)&&hint===q.hint&&solution===!!q.solutionShown,'Evidencia y resumen del ítem difieren.');
    if(s.taskProtocol!==3)require(!answers.some(n=>n!==q.answer)||solution,'Falta la solución automática del protocolo declarado.');
    else {require(q.supportProtocol===3&&typeof q.solutionRequested==='boolean'&&q.solutionRequested===solution&&q.done===correct,'La solución solicitada o el estado de respuesta no coincide con su exposición.');
    }
    if(pending&&i>s.index)require(q.events.length===0&&!q.hint&&!q.solutionShown&&!q.reflection,'Evidencia en un reto que aún no se ha abierto.');
  });return true;
}
export function assignedEvidence(s) {
  if(s.taskProtocol===5)return workshopEvidence(s);
  const answered=s.questions.filter(q=>q.attempts.length);
  const support=s.taskProtocol===6?answered.map(q=>reasoningSupportEvidence(q,q.events)):null;
  return {answered:answered.length,first:answered.filter(q=>q.attempts[0]===q.answer).length,
    independent:answered.filter(q=>q.events?.[0]?.type==='correct').length,
    final:answered.filter(q=>q.attempts.at(-1)===q.answer).length,
    hints:answered.filter(q=>q.hint).length,solutions:answered.filter(q=>q.solutionShown).length,reflections:answered.filter(q=>q.reflection?.trim()).length,
    ...(support?{scaffolds:support.reduce((n,e)=>n+e.scaffolds,0),feedbackItems:support.reduce((n,e)=>n+e.feedbackItems,0),feedbackRequests:support.reduce((n,e)=>n+e.feedbackRequests,0)}:{})};
}
export const assignmentMatches=(s,t)=>!!s.assignment&&assignmentKey(s.assignment)===assignmentKey(t)&&equivalent(s.assignment,assignmentSnapshot(t));
export function assignmentRows(task,sessions,confirmations={},perspective='teacher',current=null) {
  validateTask(task);
  return task.recipientProfileIds.map(profile=>{
    const attempts=sessions.filter(s=>s.profile===profile&&assignmentMatches(s,task));
    const confirmed=attempts.filter(s=>confirmations[sessionKey(s)]?.classId===task.classId&&confirmations[sessionKey(s)]?.profile===profile);
    const visible=perspective==='teacher'?confirmed:attempts;
    const pending=attempts.filter(s=>!confirmed.includes(s));
    const inProgress=perspective==='student'&&current?.profile===profile&&current.assignment&&assignmentMatches(current,task);
    const status=perspective==='teacher'?(confirmed.length?'Informe recibido':'Sin informe recibido'):
      pending.length?'Completada en este dispositivo; sin acuse':inProgress?'Partida en curso en este dispositivo':confirmed.length?'Informe recibido':'Sin evidencia en este dispositivo';
    return {profile,status,confirmed:confirmed.length,attempts:visible.map(s=>({session:s,evidence:assignedEvidence(s),confirmation:confirmations[sessionKey(s)]||null}))};
  });
}
