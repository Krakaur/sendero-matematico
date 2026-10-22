import {REASONING_C9_FAMILIES} from './reasoning-c9.js';
import {buildTaskPreview,taskPreviewHTML} from './task-preview.js';
import {equivalent} from './assignments.js';
import {WORKSHOP_NAMES} from './assigned-workshop.js';
import {workshopEvidenceHTML} from './assigned-workshop-view.js';
import {SCHEMA,validateReport} from './core.js';
import {deliveryStatus} from './classroom.js';
import {TASK_SCHEMA,isAssignedTask,latestTasks,assignmentRows,assignmentKey,assignmentMatches,taskDescription,assignedEvidence,sessionKey} from './assignments.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function taskListHTML(state,teacher=false) {
  const tasks=latestTasks(state.classroom?.tasks||[]);
  if(!tasks.length)return '';
  return '<h3>Tareas del aula</h3>'+tasks.map(t=>`<div class="session-row"><div><strong>${esc(t.title)}</strong><p>${isAssignedTask(t)?`${esc(taskDescription(t))} · versión ${t.version} · ${t.contentId==='workshop-fixed-project'?'un taller: dos construcciones y una elección':t.completionRule.count+' respuestas'} · sin cronómetro ni adaptación`:'Práctica anterior: sin versión ni atribución verificable'}</p></div>${teacher?'':`<button class="secondary" ${isAssignedTask(t)?`data-assignment="${esc(t.id)}" data-version="${t.version}"`:`data-trail="${esc(t.trail)}"`}>${isAssignedTask(t)?'Abrir tarea':'Práctica libre'}</button>${isAssignedTask(t)?'<p class="micro assigned-data-notice">Esta tarea se compartirá con tu docente cuando la completes: respuestas, ayudas, revisiones y tu nota opcional. El control de compartir talleres libres no detiene esta entrega. Evita datos personales en la nota.</p>':''}`}</div>`).join('');
}
export function legacyTaskFromForm(form,uid) {return {id:uid(),title:String(form.get('title')||'').trim(),trail:String(form.get('trail')||'')};}
function legacyTaskFormHTML() {return `<form id="class-task-legacy" class="profile-form"><h3>Práctica orientativa</h3><p>Recomienda una ruta. Se conserva el seguimiento general de las partidas, pero no se atribuyen resultados a este encargo ni a una versión.</p><label>Título de la orientación<input name="title" maxlength="100" required></label><label>Ruta recomendada<select name="trail"><option value="suma">Sumas</option><option value="resta">Restas</option><option value="multi">Multiplicación libre</option><option value="tablas20">Tablas ampliadas</option><option value="razonar">Razonamiento</option></select></label><button class="secondary">Publicar orientación sin seguimiento por tarea</button></form>`;}
export function taskFormHTML(state) {
  const link=state.classroom,legacy=`<details class="legacy-task-orientation"><summary>Orientación libre sin seguimiento por tarea</summary>${legacyTaskFormHTML()}</details>`;
  if(!link?.capabilities?.includes('assignments-v2'))return '<p>Conecta el aula para comprobar si el servidor admite tareas versionadas.</p>'+legacy;
  const tasks=latestTasks(link.tasks||[]).filter(isAssignedTask),profiles=[...new Set((link.students||[]).map(s=>s.profile).filter(Boolean))];
  const options=[['multiply-fixed-table','Multiplicación: tabla fija (1–12)']];
  if(link.capabilities.includes('assignments-reasoning-v1'))options.push(['represent-fixed-pack','Representar situaciones · contenido v1']);
  if(link.capabilities.includes('assignments-arithmetic-v1'))options.push(['arithmetic-suma','Sumas: paquete fijo'],['arithmetic-resta','Restas: paquete fijo'],['arithmetic-tablas20','Tablas ampliadas: tabla fija (1–20)']);
  if(link.capabilities.includes('assignments-reasoning-expanded-v1'))options.push(['reasoning-dos_pasos','Dos pasos: grupos y retirada · contenido v1'],['reasoning-dato_faltante','Información faltante: cantidad por grupo · contenido v1']);
  if(link.capabilities.includes('assignments-reasoning-expanded-v2'))for(const f of REASONING_C9_FAMILIES)options.push(['reasoning-v2-'+f.id,f.name+' · contenido v2']);
  if(link.capabilities.includes('assignments-workshops-v1'))for(const [key,name]of Object.entries(WORKSHOP_NAMES))options.push(['workshop-'+key,'Taller: '+name]);
  return `<form id="class-task" class="profile-form teacher-task-form"><h3>Asignar una práctica con seguimiento</h3><p>Elige el contenido y los destinatarios. Revisa exactamente qué recibirán antes de publicar.</p><label>Nueva tarea o revisión<select name="revision"><option value="">Crear otra tarea</option>${tasks.map(t=>`<option value="${esc(t.id)}">Nueva versión de ${esc(t.title)} (actual: ${t.version})</option>`).join('')}</select></label><label>Título<input name="title" maxlength="100" required></label><label>Contenido<select name="content">${options.map(([id,label])=>`<option value="${esc(id)}">${esc(label)}</option>`).join('')}</select></label><label data-task-field="reasoning" style="display:none">Nivel de representación<select name="level"><option>1</option><option>2</option></select></label><label data-task-field="arithmetic" style="display:none">Nivel de suma o resta<select name="arithmeticLevel"><option>1</option><option>2</option><option>3</option><option>4</option></select></label><label data-task-field="workshop" style="display:none">Nivel del taller<select name="workshopLevel"><option>1</option><option>2</option><option>3</option><option>4</option></select></label><label data-task-field="expanded" style="display:none">Nivel del paquete v1<select name="expandedLevel"><option>2</option><option>3</option><option>4</option></select></label><label data-task-field="c9" style="display:none">Nivel fijo del catálogo v2<select name="c9Level" disabled><option>2</option></select></label><label data-task-field="variant" style="display:none">Variante fija<select name="variant"><option>1</option><option>2</option></select></label><label data-task-field="count" style="display:none">Número de retos<select name="count"><option>4</option><option>6</option><option>8</option></select></label><label data-task-field="table"><span id="task-table-label">Tabla (1–12)</span><input name="table" type="number" min="1" max="12" value="2" required></label><fieldset class="task-recipients"><legend>Destinatarios de esta versión</legend>${profiles.length?profiles.map(p=>`<label><input type="checkbox" name="recipient" value="${esc(p)}" checked> Perfil ${esc(p)}</label>`).join(''):'<p>Los estudiantes deben vincular su invitación y conectar el aula para aparecer aquí.</p>'}</fieldset><p id="task-content-condition" class="micro"></p><p class="micro">Cada revisión conserva las versiones anteriores. Estas tareas no usan carrera ni adaptación. Un cierre o acuse no equivale a dominio.</p><div class="task-publish-actions"><button type="button" class="secondary" data-task-preview aria-describedby="task-preview-status" ${profiles.length?'':'disabled'}>Vista previa antes de publicar</button><button type="submit" class="primary" data-task-publish aria-describedby="task-preview-status" disabled>Publicar esta versión</button></div><p id="task-preview-status" role="status">La vista previa no publica ni envía datos.</p><section id="task-preview" tabindex="-1" aria-label="Vista previa docente" hidden></section></form>${legacy}`;
}
export function taskFromForm(form,link,uid,at=new Date().toISOString()) {
  const previous=(link.tasks||[]).filter(t=>isAssignedTask(t)&&t.classId===link.classId&&t.id===form.get('revision')).sort((a,b)=>b.version-a.version)[0];
  const content=String(form.get('content')||''),c9=content.startsWith('reasoning-v2-'),workshop=content.startsWith('workshop-'),expanded=!c9&&content.startsWith('reasoning-'),reasoning=content==='represent-fixed-pack',arithmetic=content.startsWith('arithmetic-');
  const catalog=c9?REASONING_C9_FAMILIES.find(f=>f.id===content.slice(13)):null;
  if(c9&&!catalog)throw Error('Familia de razonamiento v2 no compatible.');
  const trail=arithmetic?content.slice(11):reasoning||expanded||c9||workshop?'razonar':'multi';
  const parameters=workshop?{project:content.slice(9),level:Number(form.get('workshopLevel')),variant:Number(form.get('variant'))}:c9?{family:catalog.id,level:catalog.level,variant:Number(form.get('variant'))}:expanded?{family:content.slice(10),level:Number(form.get('expandedLevel')),variant:Number(form.get('variant'))}:reasoning?{level:Number(form.get('level'))}:arithmetic&&trail!=='tablas20'?{level:Number(form.get('arithmeticLevel'))}:{table:Number(form.get('table'))};
  return {schema:TASK_SCHEMA,classId:link.classId,id:previous?.id||uid(),version:previous?previous.version+1:1,title:String(form.get('title')||'').trim(),trail,contentId:workshop?'workshop-fixed-project':expanded||c9?'reasoning-fixed-pack':arithmetic?'arithmetic-fixed-pack':reasoning?'represent-fixed-pack':'multiply-fixed-table',contentVersion:c9?2:1,parameters,completionRule:{kind:workshop?'reviewed_project':'answered_items',count:workshop?1:expanded||c9?4:reasoning||arithmetic?Number(form.get('count')):8},recipientProfileIds:form.getAll('recipient'),assignedAt:at};
}
function reasoningScope(s){
 const t=s.assignment;if(t?.contentId!=='reasoning-fixed-pack')return '';
 if(t.contentVersion===2)return `${REASONING_C9_FAMILIES.find(f=>f.id===t.parameters.family)?.description||'Familia de razonamiento v2.'} Nivel fijo del catálogo; no dificultad calibrada. Cuatro situaciones no constituyen una prueba de razonamiento general.`;
 return t.parameters.family==='dos_pasos'?'Cobertura acotada: total de grupos y retirada; resolver como a × (b − 1) también es válido. No representa todas las situaciones de dos pasos.':'Cobertura acotada: falta la cantidad por grupo. Cambiar números no acredita progresión conceptual.';
}
function episodeHTML(entry,delivery=null) {
  const s=entry.session,e=entry.evidence,c=entry.confirmation;
  const representation=s.taskProtocol===3&&['represent-fixed-pack','reasoning-fixed-pack'].includes(s.assignment?.contentId);
  const transport=delivery?`<p class="micro">${delivery.stage==='acknowledged'?'Acuse del servidor guardado en este dispositivo.':delivery.stage==='send_attempted'?'Se registró un intento de envío; aún no hay acuse guardado. No necesitas repetir la partida.':'Cierre local; todavía sin intento de envío registrado.'}${delivery.attempt?` Intentos de envío registrados: ${delivery.attempt.attemptCount}. Último: ${esc(delivery.attempt.lastAttemptAt)}.`:''}</p>`:'';
  if(s.taskProtocol===5)return `<details><summary>Intento ${esc(s.id)} · taller con tres fases</summary><p>Cierre declarado por dispositivo: ${esc(s.completedAt)}. ${c?`Recepción: ${esc(c.receivedAt||c.confirmedAt)} (${c.source==='manual-file'?'archivo importado; identidad y catálogo no verificados':c.source==='server-acknowledgement'?'acuse de esta entrega':'presencia comprobada al consultar el servidor; no primera fecha de entrega'}).`:'Sin acuse en este dispositivo.'}</p>${transport}${workshopEvidenceHTML(s)}</details>`;
  const names={wrong:'error',correct:'acierto',hint:'pista solicitada',solution:s.taskProtocol===3?'solución solicitada y mostrada':'solución mostrada automáticamente'};
  return `<details><summary>Intento ${esc(s.id)} · ${e.first}/${e.answered} aciertos iniciales</summary><p>Respondidos: ${e.answered}/${s.questions.length} · aciertos finales: ${e.final}/${e.answered} · aciertos a la primera sin apoyo: ${e.independent}/${e.answered} · pistas: ${e.hints} · soluciones mostradas: ${e.solutions}.</p><p class="micro">Cierre declarado por dispositivo: ${esc(s.completedAt)}. ${c?`Recepción: ${esc(c.receivedAt||c.confirmedAt)} (${c.source==='manual-file'?'archivo importado; identidad y catálogo no verificados':c.source==='server-acknowledgement'?'acuse del servidor de esta entrega':'presencia comprobada al consultar el servidor; no fecha de primera entrega'}).`:'Sin acuse en este dispositivo.'}</p>${transport}${reasoningScope(s)?`<p class="micro">${esc(reasoningScope(s))}</p>`:''}<ol>${s.questions.map(q=>`<li><strong>${esc(representation?q.prompt:`${q.a} ${s.trail==='suma'?'+':s.trail==='resta'?'−':'×'} ${q.b}`)}</strong>: ${q.events.map(ev=>`${names[ev.type]}${ev.value!==undefined?' '+(representation?(q.labels?.[ev.value]??ev.value):ev.value):''}`).map(esc).join(' → ')}. ${representation?'Representación esperada':'Respuesta esperada'}: ${esc(representation?(q.labels?.[q.answer]??q.answer):q.answer)}.${q.reflection?.trim()?`<p>Explicación propia (sin calificación automática): ${esc(q.reflection)}</p>`:s.taskProtocol===3?'<p>Sin explicación propia registrada; era opcional.</p>':''}</li>`).join('')}</ol><p class="micro">${s.taskProtocol===3?'Interacción 3: pistas y soluciones sólo al solicitarlas; el error no revela la respuesta. Cierre explícito después de responder. La explicación propia es opcional y descriptiva.':s.taskProtocol===4?'Interacción 4: paquete aritmético fijo de longitud declarada; solución automática tras error, cierre explícito y condiciones conservadas por versión.':s.taskProtocol===2?'Interacción 2: el último reto permite corregir o terminar, incluso si queda un error. Decisión de cierre registrada por el dispositivo; no verifica la identidad ni un gesto humano.':'Interacción 1 (histórica): el último reto cerraba al responder; no ofrecía el mismo reintento que los anteriores. Los aciertos finales no tienen igual oportunidad de corrección por posición.'} No comparar protocolos como condiciones equivalentes.</p><p>Para observar: pide explicar un error concreto o representar de otra manera la relación del problema. La secuencia no demuestra por sí sola comprensión, causa conceptual ni aprendizaje.</p></details>`;
}
function unmatchedAttemptsHTML(sessions,confirmations,teacher){
  if(!sessions.length)return '';
  return `<section class="unmatched-assignments"><h3>Intentos fuera del catálogo disponible</h3><p>Catálogo y destinatario no verificados en esta consulta. Puedes examinar el contenido y las acciones conservadas en cada intento; no se calcula cobertura del grupo ni se atribuye una asignación válida por coincidencia de contenido. La ausencia de catálogo puede deberse a una importación o a la restauración de una copia sin vinculación de aula.</p>${sessions.map(s=>{
    try{
      validateReport({schema:SCHEMA,profile:s.profile,sessions:[s]});
      const saved=confirmations[sessionKey(s)],at=saved?.receivedAt||saved?.confirmedAt;
      const confirmation=saved&&saved.classId===s.assignment.classId&&saved.profile===s.profile&&['manual-file','server-read','client-observed-server-read','server-acknowledgement'].includes(saved.source)&&typeof at==='string'&&Number.isFinite(Date.parse(at))?saved:null;
      return `<article><h4>Perfil ${esc(s.profile)} · ${esc(s.assignment.title)} · versión declarada ${s.assignmentVersion}</h4><p>Snapshot conservado: aula ${esc(s.assignment.classId)} · ${esc(taskDescription(s.assignment))}. ${teacher?'Registro disponible en este dispositivo docente; sólo se muestra recepción cuando existe una constancia contextual.':'Cierre disponible en este perfil y dispositivo. Sin constancia no se infiere envío ni recepción.'} La validación de formato y contenido no verifica quién recibió la tarea ni quién respondió.</p>${episodeHTML({session:s,evidence:assignedEvidence(s),confirmation})}</article>`;
    }catch(error){return `<p>Hay un registro conservado cuyo formato o contenido no puede interpretarse en esta versión: ${esc(error.message)}. No se inventa una reconstrucción; conserva su archivo original.</p>`;}
  }).join('')}</section>`;
}
function profileCardHTML(task,row,state,teacher){
 const sources={manual:0,server:0,ack:0,local:0};
 for(const a of row.attempts){const source=a.confirmation?.source;if(source==='manual-file')sources.manual++;else if(source==='server-acknowledgement')sources.ack++;else if(['server-read','client-observed-server-read'].includes(source))sources.server++;else sources.local++;}
 const origin=[sources.manual?`${sources.manual} por archivo importado`:null,sources.server?`${sources.server} comprobados al consultar el servidor`:null,sources.ack?`${sources.ack} con acuse de entrega`:null,sources.local?`${sources.local} sin constancia de recepción interpretable`:null].filter(Boolean).join('; ');
 return `<article class="assignment-profile-card"><h4>Perfil ${esc(row.profile)}</h4><p class="assignment-profile-status">${esc(row.status)}</p><p>${row.confirmed} intentos recibidos · ${row.attempts.length} cierres visibles.</p>${origin?`<p class="micro">Procedencia: ${esc(origin)}.</p>`:''}<p class="micro">${task.contentId==='workshop-fixed-project'?'Por cierre: dos construcciones y una fase de elección. Revisiones y comprobaciones no son preguntas independientes.':`${task.completionRule.count} respuestas por cierre; aciertos iniciales y finales se mantienen separados.`}</p>${row.attempts.length?`<details class="assignment-profile-detail"><summary>Ver evidencia de Perfil ${esc(row.profile)} · versión ${task.version}</summary><p>${esc(task.title)} · ${esc(taskDescription(task))} · perfil ${esc(row.profile)} · tarea ${esc(task.id)} · versión ${task.version}.</p>${row.attempts.map(entry=>episodeHTML(entry,teacher?null:deliveryStatus(state,entry.session))).join('')}</details>`:'<p>Sin evidencia para interpretar. Comprobar con el estudiante si hay trabajo local pendiente.</p>'}</article>`;
}
export function assignmentReportHTML(state,teacher=false) {
 const all=(state.classroom?.tasks||[]).filter(isAssignedTask),sessions=teacher?(state.teacher||[]):(state.sessions||[]),confirmations=teacher?(state.teacherConfirmations||{}):(state.classroom?.confirmations||{});
 const tasks=teacher?all:all.filter(t=>t.recipientProfileIds.includes(state.profile));
 const legacy=sessions.filter(s=>!s.assignment).length,unmatchedSessions=sessions.filter(s=>s.assignment&&!tasks.some(t=>assignmentMatches(s,t)&&t.recipientProfileIds.includes(s.profile)));
 if(!tasks.length&&!legacy&&!unmatchedSessions.length)return '';
 return `<section class="panel assignment-report-c9" id="assignment-report"><h2>Seguimiento por tarea y versión</h2><p>${teacher?'Aquí constan informes disponibles en este dispositivo, desde el aula o importados como archivo. Sin informe recibido no significa que el alumno no trabajó.':'Tu cierre local y el acuse del servidor se muestran por separado. Un reintento pendiente no borra un informe anterior.'}</p><p class="micro">Cada perfil tiene un resumen y su evidencia desplegable. Se conservan todos los intentos, sus condiciones y procedencia.</p>${tasks.map(task=>{
  const rows=assignmentRows(task,sessions,confirmations,teacher?'teacher':'student',state.current),n=rows.filter(r=>r.confirmed>0).length;
  return `<details open class="assignment-task-group"><summary>${esc(task.title)} · versión ${task.version} · ${esc(taskDescription(task))}</summary><p class="micro">${esc(task.id)} · ${teacher?`${n}/${rows.length} perfiles con informe recibido. Universo: destinatarios de esta versión; no porcentaje de aprendizaje.`:'Tu entrega en esta versión. Esta vista sólo muestra tu perfil, no la cobertura del grupo.'}</p><div class="assignment-profile-grid">${rows.map(row=>profileCardHTML(task,row,state,teacher)).join('')}</div></details>`;
 }).join('')}${unmatchedAttemptsHTML(unmatchedSessions,confirmations,teacher)}<p class="micro">${legacy} partidas libres o anteriores sin asignación verificable. ${unmatchedSessions.length} partidas con tarea declarada fuera del catálogo de esta consulta. No se atribuyen por coincidencia de contenido.</p><p class="micro">Un acuse no implica lectura docente ni identifica a la persona que respondió. Una importación de archivo no equivale a confirmación del servidor. Las versiones antiguas siguen visibles para conservar el contexto.</p></section>`;
}
function previousTask(form,link){
 const revision=String(form.get('revision')||'');
 const task=(link.tasks||[]).filter(t=>isAssignedTask(t)&&t.classId===link.classId&&t.id===revision).sort((a,b)=>b.version-a.version)[0]||null;
 if(revision&&!task)throw Error('La versión anterior ya no está disponible. Actualiza el aula y revisa otra vez.');
 return task;
}
function checkDraftContext(task,link){
 const required=task.contentId==='reasoning-fixed-pack'?`assignments-reasoning-expanded-v${task.contentVersion}`:task.contentId==='workshop-fixed-project'?'assignments-workshops-v1':task.contentId==='arithmetic-fixed-pack'?'assignments-arithmetic-v1':task.contentId==='represent-fixed-pack'?'assignments-reasoning-v1':'assignments-v2';
 if(!link?.capabilities?.includes('assignments-v2')||!link.capabilities.includes(required))throw Error('El aula no confirma compatibilidad con este contenido.');
 const enrolled=new Set((link.students||[]).map(s=>s.profile));
 if(task.recipientProfileIds.some(id=>!enrolled.has(id)))throw Error('Hay destinatarios que ya no figuran en el aula. Actualiza la selección.');
}
export function createTaskDraftController(link,uid,clock=()=>new Date().toISOString()){
 let pending=null;
 const normalize=(form,currentLink,id,at)=>{const previous=previousTask(form,currentLink),task=taskFromForm(form,currentLink,()=>id,at);checkDraftContext(task,currentLink);return buildTaskPreview(task,previous);};
 return {
  preview(form,currentLink=link){pending=null;const p=normalize(form,currentLink,uid(),clock());pending=structuredClone(p);return structuredClone(p);},
  invalidate(){pending=null;},
  isReady(){return pending!==null;},
  taskForPublish(form,currentLink=link){
   if(!pending)throw Error('Abre la vista previa antes de publicar esta versión.');
   const current=normalize(form,currentLink,pending.task.id,pending.task.assignedAt);
   if(!equivalent(current.task,pending.task)||!equivalent(current.previous,pending.previous))throw Error('La tarea o el aula cambiaron después de la vista previa. Revísala de nuevo.');
   return structuredClone(pending.task);
  }
 };
}

export function bindTaskFields(root,context={}){
 const form=root.querySelector('#class-task');if(!form)return null;
 const controller=context.link?createTaskDraftController(context.link,context.uid||(()=>crypto.randomUUID()),context.clock):null;
 const preview=form.querySelector('#task-preview'),status=form.querySelector('#task-preview-status'),publish=form.querySelector('[data-task-publish]');
 const invalidate=()=>{form.dataset.taskDirty='true';controller?.invalidate();publish.disabled=true;preview.hidden=true;preview.innerHTML='';status.textContent='La vista previa no publica ni envía datos. Revísala después de cualquier cambio.';};
 const update=()=>{
  const kind=form.elements.content.value,c9=kind.startsWith('reasoning-v2-'),arithmetic=kind==='arithmetic-suma'||kind==='arithmetic-resta',reasoning=kind==='represent-fixed-pack',workshop=kind.startsWith('workshop-'),expanded=!c9&&kind.startsWith('reasoning-');
  for(const label of form.querySelectorAll('[data-task-field]')){const show={reasoning,arithmetic,workshop,expanded,c9,variant:workshop||expanded||c9,count:reasoning||kind.startsWith('arithmetic-'),table:!reasoning&&!arithmetic&&!workshop&&!expanded&&!c9}[label.dataset.taskField];label.style.display=show?'grid':'none';for(const input of label.querySelectorAll('input,select'))input.disabled=!show;}
  form.elements.table.max=kind==='arithmetic-tablas20'?'20':'12';form.querySelector('#task-table-label').textContent=`Tabla (1–${form.elements.table.max})`;
  const levels=kind==='reasoning-dato_faltante'?['2']:['3','4'];for(const option of form.elements.expandedLevel.options)option.disabled=!levels.includes(option.value);if(!levels.includes(form.elements.expandedLevel.value))form.elements.expandedLevel.value=levels[0];
  const catalog=c9?REASONING_C9_FAMILIES.find(f=>f.id===kind.slice(13)):null;
  form.elements.c9Level.innerHTML=catalog?`<option value="${catalog.level}" selected>${catalog.level}</option>`:'<option>2</option>';form.elements.c9Level.disabled=true;
  form.querySelector('#task-content-condition').textContent=catalog?`${catalog.description} Cuatro ítems por variante. Nivel fijo ${catalog.level} del catálogo; no dificultad calibrada.`:workshop?'Un taller: construir, elegir explicación, comprobar otra construcción y entregar. Se admiten errores y nota opcional.':expanded?kind==='reasoning-dos_pasos'?'Cuatro situaciones: total de grupos y retirada. Los niveles cambian cantidades, sin progresión conceptual validada.':'Cuatro situaciones: reconocer la cantidad por grupo que falta. No evalúan toda suficiencia de información.':kind==='multiply-fixed-table'?'Ocho retos de una tabla de 1 a 12. Factores fijos; alternativas generadas al jugar.':'Paquete de 4, 6 u 8 retos. Basta responder, aunque haya errores.';
 };
 form.elements.content.addEventListener('change',update);
 form.addEventListener('input',invalidate);form.addEventListener('change',invalidate);
 form.querySelector('[data-task-preview]').addEventListener('click',()=>{
  invalidate();if(form.reportValidity?.()===false)return;
  try{if(!controller)throw Error('Actualiza la aplicación para revisar y publicar tareas.');const value=controller.preview(new FormData(form));preview.innerHTML=taskPreviewHTML(value);preview.hidden=false;publish.disabled=false;status.textContent='Vista previa lista. Publicar enviará exactamente esta versión y sus destinatarios.';preview.focus({preventScroll:false});}
  catch(error){status.textContent=error.message;}
 });
 update();return controller;
}
