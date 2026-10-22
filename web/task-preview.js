import {REASONING_SUPPORT_FAMILIES,reasoningScaffoldHTML,reasoningSupportEvent} from './reasoning-support.js';
import {validateTasks,equivalent,taskDescription} from './assignments.js';
import {assignedItems} from './task-content.js';
import {workshopContentV1} from './workshop-catalog.js';
import {workshopModelCorrect} from './assigned-workshop.js';
import {modelHTML,modelEvidenceText} from './workshop-view.js';
import {REASONING_C9_FAMILIES} from './reasoning-c9.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const TASK_DATA_NOTICE='Al vincular un aula, las tareas asignadas completas se entregan con respuestas, ayudas, revisiones y notas opcionales. El control de compartir talleres libres no detiene estas entregas. Evita datos personales en las notas.';

function taskObjective(t){
 if(t.contentId==='reasoning-supported-pack')return REASONING_SUPPORT_FAMILIES.find(f=>f.id===t.parameters.family)?.description||'Interpretar relaciones con apoyos optativos registrados.';
 if(t.contentId==='reasoning-fixed-pack'&&t.contentVersion===2)return REASONING_C9_FAMILIES.find(f=>f.id===t.parameters.family)?.description||'Interpretar y resolver las relaciones de este paquete.';
 if(t.contentId==='reasoning-fixed-pack')return t.parameters.family==='dos_pasos'?'Relacionar grupos iguales y retirada; una estrategia equivalente es a × (b − 1). No representa todos los problemas de dos pasos.':'Reconocer la cantidad por grupo que falta; no evalúa toda suficiencia de información.';
 if(t.contentId==='represent-fixed-pack')return 'Elegir la expresión que representa la situación, distinguiendo la relación del cálculo.';
 if(t.contentId==='workshop-fixed-project')return 'Construir, comprobar y revisar una relación matemática; elegir una explicación y afrontar una segunda construcción.';
 return 'Practicar los hechos y operaciones fijados en este paquete, conservando errores y apoyos.';
}
function conditions(t){
 const common=['Sin carrera, puntuación por rapidez ni adaptación durante esta tarea.','Se puede entregar con errores; cerrar no acredita dominio.'];
 if(t.contentId==='reasoning-supported-pack')return [...common,'Interacción 6: apoyo visual y orientación específica de una elección incorrecta sólo cuando el estudiante los solicita. Cada presentación conserva texto y versión.','Pista y solución también optativas; un error no muestra automáticamente la solución. El apoyo no resuelve incógnitas.','Las respuestas después de una ayuda no se mezclan con primera respuesta independiente. Los ítems derivan de C9@2, pero esta condición apoyada constituye contenido nuevo.','Cuatro respuestas, con cierre explícito; nota opcional. Nivel como banda declarada, sin calibración de dificultad.'];
 if(t.contentId==='workshop-fixed-project')return [...common,'Dos construcciones comprobadas, una fase de elección y revisión con entrega explícita.','Pista por fase; hasta 20 comprobaciones por construcción y 20 elecciones cronológicas. Nota propia opcional; no se presenta un modelo resuelto automáticamente.'];
 if(['represent-fixed-pack','reasoning-fixed-pack'].includes(t.contentId))return [...common,'Pistas y soluciones sólo al solicitarlas; un error no revela automáticamente la respuesta.','Después de responder todos los ítems, el estudiante decide entregar. La explicación propia es opcional y no se califica automáticamente.','El nivel indica una banda del catálogo; no dificultad calibrada ni progreso conceptual demostrado.'];
 return [...common,'La solución puede mostrarse automáticamente tras un error; estas condiciones difieren de los paquetes de razonamiento.','Cada ítem requiere respuesta; el último permite corregir o terminar mediante decisión explícita.'];
}

// Pure normalization: validation and clones only. No session, ID, clock, storage or network.
export function buildTaskPreview(task,previous=null){
 const normalized=validateTasks([task])[0];
 if(normalized.schema!=='sendero.assignment.v2')throw Error('La vista previa exige una tarea versionada.');
 const old=previous?validateTasks([previous])[0]:null;
 if(old&&(old.schema!==normalized.schema||old.classId!==normalized.classId||old.id!==normalized.id||normalized.version!==old.version+1))throw Error('La comparación debe corresponder a la versión anterior de esta misma tarea.');
 const workshop=normalized.contentId==='workshop-fixed-project'?workshopContentV1(normalized.parameters):null;
 let items=workshop?[]:assignedItems(normalized),variableChoices=false;
 if(!workshop&&items===null){
  if(normalized.contentId!=='multiply-fixed-table')throw Error('Contenido sin vista previa compatible.');
  variableChoices=true;items=Array.from({length:8},(_,i)=>({a:normalized.parameters.table,b:i+1,answer:normalized.parameters.table*(i+1),itemId:`item-${i+1}`}));
 }
 const keys=['title','trail','contentId','contentVersion','parameters','completionRule','recipientProfileIds'];
 const changes=old?keys.filter(k=>!equivalent(old[k],normalized[k])).map(field=>({field,before:structuredClone(old[field]),after:structuredClone(normalized[field])})):[];
 return {task:normalized,previous:old,description:taskDescription(normalized),objective:taskObjective(normalized),unit:workshop?'Un taller: dos construcciones y una fase de elección.':`${normalized.completionRule.count} ítems con respuesta; las revisiones no son ítems adicionales.`,conditions:conditions(normalized),items:structuredClone(items),workshop,variableChoices,changes};
}

function solvedModel(m){
 let result;
 switch(m.kind){
  case 'balance':result={value:m.total-m.a};break;
  case 'sharing':result={baskets:Array(m.a).fill(m.total/m.a)};break;
  case 'array':result={rows:m.a,columns:m.b};break;
  case 'fraction':result={selected:Array.from({length:m.take},(_,i)=>i)};break;
  case 'measure':result={rows:m.b,columns:m.a,value:2*(m.a+m.b)};break;
  case 'data':result={selected:[0,1],value:m.values[1]-m.values[0]};break;
  case 'pattern':result={selected:[m.sequence.at(-1)+m.step,m.sequence.at(-1)+2*m.step]};break;
  case 'route':for(const a of m.paths[0])for(const b of m.paths[1])for(const c of m.paths[2])if(a+b+c===m.target&&!result)result={path:[a,b,c]};break;
 }
 return result&&workshopModelCorrect(m,result)?result:null;
}
function workshopStageHTML(m,title,showReasons){
 const answer=solvedModel(m);
 return `<article class="task-preview-item"><h5>${esc(title)}</h5><p>${esc(m.prompt)}</p><fieldset disabled class="project-model"><legend>Modelo inicial y controles, desactivados en esta vista previa</legend>${modelHTML(m,structuredClone(m.initial))}</fieldset>${showReasons?`<p>Alternativas de explicación, en su orden fijo:</p><ol>${m.reasons.map(text=>`<li>${esc(text)}</li>`).join('')}</ol>`:''}<details class="task-preview-solution"><summary>Ver apoyo y solución de referencia · sólo docente</summary><p>Pista disponible: ${esc(m.hint)}</p><p>${answer?'Un modelo que cumple la condición: '+esc(modelEvidenceText(m,answer))+'.':'La condición debe revisarse en el contenido congelado; no se inventa un modelo resuelto.'}</p>${showReasons?`<p>Explicación editorial esperada: ${esc(m.reasons[m.reason])}</p>`:''}<p>Puede haber más de una construcción válida; la comprobación del juego decide si cumple su condición.</p></details></article>`;
}
function questionHTML(q,t,variable){
 const support=t.contentId==='reasoning-supported-pack'?`<details class="task-preview-support"><summary>Ver apoyo visual optativo · sólo docente</summary><p>Se muestra únicamente después de una solicitud registrada del alumno. Esta vista previa no registra una solicitud.</p>${reasoningScaffoldHTML(q,[reasoningSupportEvent(q,[],'scaffold')])}</details>`:'';
 const symbol=t.trail==='suma'?'+':t.trail==='resta'?'−':'×';
 const label=value=>q.labels?.[value]??value;
 return `<li class="task-preview-item"><p><strong>${esc(q.prompt||`${q.a} ${symbol} ${q.b}`)}</strong></p>${variable?'<p class="micro">Los factores son fijos. Las opciones y su orden se generan al jugar y no se congelan en esta tarea histórica.</p>':`<ol class="task-preview-choices">${q.options.map(value=>`<li>${esc(label(value))}</li>`).join('')}</ol>`}<details class="task-preview-solution"><summary>Ver respuesta y apoyos · sólo docente</summary><p>Respuesta esperada: ${esc(label(q.answer))}.</p>${q.hintText?`<p>Pista: ${esc(q.hintText)}</p>`:''}${q.explanation?`<p>Explicación editorial: ${esc(q.explanation)}</p>`:''}${q.solution?`<p>Solución: ${esc(q.solution)}</p>`:''}${q.errorFeedback?`<p>Retroalimentación editorial por opción:</p><ol>${q.options.map(value=>`<li>${esc(label(value))}: ${esc(q.errorFeedback[value]??'Sin texto específico.')}</li>`).join('')}</ol>`:''}</details>${support}</li>`;
}
function comparisonHTML(p){
 if(!p.previous)return '<p>Se creará una tarea nueva. No se modifica ninguna tarea anterior.</p>';
 const names={title:'Título',trail:'Ruta',contentId:'Familia de contenido',contentVersion:'Versión del contenido',parameters:'Parámetros',completionRule:'Unidad y cierre',recipientProfileIds:'Destinatarios'};
 return `<details class="task-version-comparison"><summary>Comparar con la versión ${p.previous.version}, conservada sin cambios</summary><p>La versión anterior permanece íntegra. Se publicará la versión ${p.task.version}.</p>${p.changes.length?`<dl>${p.changes.map(c=>`<dt>${esc(names[c.field])}</dt><dd><p>Anterior: ${esc(JSON.stringify(c.before))}</p><p>Nueva: ${esc(JSON.stringify(c.after))}</p></dd>`).join('')}</dl>`:'<p>No cambian título, contenido, condiciones ni destinatarios; sólo se crea otra versión y fecha de asignación.</p>'}</details>`;
}
export function taskPreviewHTML(preview){
 // Render only a freshly validated preview to avoid trusting caller-supplied descriptions/items.
 const p=buildTaskPreview(preview.task,preview.previous),t=p.task;
 return `<div class="task-preview-body"><h4>Vista previa de ${esc(t.title)} · versión ${t.version}</h4><p>${esc(p.description)}</p><dl class="task-preview-facts"><dt>Objetivo</dt><dd>${esc(p.objective)}</dd><dt>Unidad</dt><dd>${esc(p.unit)}</dd><dt>Contenido</dt><dd>${esc(t.contentId)} @ ${t.contentVersion}</dd><dt>Destinatarios</dt><dd>${t.recipientProfileIds.map(p=>'Perfil '+esc(p)).join(', ')}</dd></dl><details><summary>Condiciones de la práctica</summary><ul>${p.conditions.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></details><p class="assigned-data-notice">${esc(TASK_DATA_NOTICE)}</p>${comparisonHTML(p)}${p.workshop?workshopStageHTML(p.workshop.initial,'1. Construcción inicial y elección de explicación',true)+workshopStageHTML(p.workshop.probe,'2. Construcción posterior',false):`<p>Ítems y alternativas en el orden que define el contenido${p.variableChoices?', con la excepción declarada de opciones variables':''}:</p><ol class="task-preview-items">${p.items.map(q=>questionHTML(q,t,p.variableChoices)).join('')}</ol>`}<details class="task-preview-contract"><summary>Ver el contrato normalizado que se publicará</summary><pre>${esc(JSON.stringify(t,null,2))}</pre></details><p class="micro">Esta vista previa no crea una partida, no publica y no envía datos. Los apoyos y respuestas de referencia están cerrados hasta que el docente los despliega.</p></div>`;
}
