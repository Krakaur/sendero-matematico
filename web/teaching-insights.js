import {reasoningScaffoldHTML} from './reasoning-support.js';
import {modelEvidenceText} from './workshop-view.js';
import {summarizeReconciliation} from './reconciliation.js';
import {assignmentKey, assignmentMatches, assignmentRows, assignedEvidence, equivalent, isAssignedTask, sessionKey, validateTasks} from './assignments.js';

// Read-only projection. Reconciliation invokes validateReport and validates replay
// before any observation below is counted. This module never fetches or saves.
export const TEACHING_INSIGHTS_SCHEMA = 'sendero.teaching-insights.v1';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceNames = {received:'Consultado en servidor', imported:'Archivo importado', unverified:'Disponible sin constancia de transporte'};
const sourceOf = record => ['server-read','server-observed'].includes(record.provenance.source) ? 'received'
  : record.provenance.source === 'manual-import' ? 'imported' : 'unverified';
const metric = (numerator, denominator, unit, condition) => ({numerator, denominator, unit, condition});
const ratio = m => m.denominator ? `${m.numerator}/${m.denominator}` : 'Sin observaciones';
const sortText = (a,b) => String(a).localeCompare(String(b), 'es');
const conditions = protocol => ({
  1:'Interacción 1 histórica: solución automática tras error; la última respuesta cerraba sin la misma oportunidad de revisión.',
  2:'Interacción 2: solución automática tras error; cierre explícito y posibilidad de revisión final.',
  3:'Interacción 3: pista y solución sólo al solicitarlas; una respuesta correcta termina el ítem; cierre explícito.',
  4:'Interacción 4: paquete aritmético fijo; solución automática tras error; cierre explícito.',
  6:'Interacción 6: apoyo visual, pista, orientación específica y solución sólo a petición; sus eventos cambian la condición de respuesta.',
  5:'Interacción 5: dos construcciones distintas y una elección de explicación; hasta 20 comprobaciones por construcción y 20 elecciones; cierre explícito.',
}[protocol] || 'Condiciones no reconocidas');

function catalogOf(state) {
  const diagnostics = [], raw = state.classroom?.tasks ?? [];
  if (!Array.isArray(raw) || raw.length > 100) return {tasks:[], diagnostics:[{status:'invalid-catalog', reason:'Catálogo ausente de formato compatible o superior a 100 entradas; no se calcula cobertura.'}]};
  const grouped = new Map();
  raw.forEach((item,index) => {
    try {
      const task = validateTasks([item])[0];
      if (!isAssignedTask(task)) { diagnostics.push({index,status:'legacy',reason:'Orientación histórica sin destinatarios ni versión verificable.'}); return; }
      const key = assignmentKey(task);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({task,index});
    } catch (error) { diagnostics.push({index,status:'invalid',reason:error.message}); }
  });
  const tasks = [];
  for (const [key, entries] of grouped) {
    if (entries.some(entry => !equivalent(entry.task,entries[0].task))) {
      diagnostics.push({key,status:'conflicting',reason:'La misma tarea y versión tienen contratos diferentes; no se elige uno arbitrariamente.'});
    } else {
      tasks.push(entries[0].task);
      entries.slice(1).forEach(entry => diagnostics.push({index:entry.index,key,status:'duplicate',reason:'Copia equivalente del contrato omitida del denominador.'}));
    }
  }
  tasks.sort((a,b) => sortText(a.classId,b.classId) || sortText(a.id,b.id) || a.version-b.version);
  return {tasks,diagnostics};
}

function questionMetrics(entries) {
  const evidence = entries.map(record => assignedEvidence(record.sourceRecord));
  return questionMetricTotals(evidence,entries.length);
}
function questionMetricTotals(evidence,closures) {
  const sum = key => evidence.reduce((n,e) => n + (e[key]||0), 0), n = sum('answered');
  return {kind:'questions', closures,
    answered:n,
    first:metric(sum('first'),n,'ítems respondidos','Primera respuesta correcta, con o sin apoyo previo.'),
    firstWithoutHelp:metric(sum('independent'),n,'ítems respondidos','El primer evento del ítem es una respuesta correcta: no preceden error, pista, solución, apoyo visual ni orientación específica.'),
    final:metric(sum('final'),n,'ítems respondidos','Última respuesta registrada correcta; no implica desempeño independiente.'),
    hints:metric(sum('hints'),n,'ítems respondidos','Ítems con pista registrada, como máximo uno por ítem.'),
    solutions:metric(sum('solutions'),n,'ítems respondidos','Ítems con solución mostrada según el protocolo; no supone que se leyera.'),
    scaffolds:metric(sum('scaffolds'),n,'ítems respondidos','Ítems con apoyo visual solicitado. No acredita lectura ni aprendizaje.'),
    feedbackItems:metric(sum('feedbackItems'),n,'ítems respondidos','Ítems con orientación específica solicitada después de un error.'),
    feedbackRequests:metric(sum('feedbackRequests'),n,'solicitudes / ítems respondidos','Puede haber varias solicitudes por ítem; no es un porcentaje ni un número de estudiantes.'),
    reflections:metric(sum('reflections'),n,'ítems respondidos','Nota opcional presente; su contenido no recibe calificación automática.'),
  };
}
function itemMetrics(records) {
  const items = new Map(), recordBySource = new Map(records.map(r=>[r.sourceRecord,r]));
  for (const {sourceRecord:s} of records) s.questions.forEach((q,index) => {
    const itemId = q.itemId || q.id || `item-${index+1}`, key = `${index}/${itemId}`;
    if (!items.has(key)) items.set(key,{itemId,position:index+1,prompt:stimulus(q,s),observations:[]});
    items.get(key).observations.push({profile:s.profile,sessionId:s.id,question:q,record:recordBySource.get(s)});
  });
  return [...items.values()].map(({observations,...item}) => ({...item,observations,
    profileCount:new Set(observations.map(o => o.profile)).size,
    metrics:questionMetricTotals(observations.map(({question:q}) => ({answered:1,
      first:Number(q.attempts[0]===q.answer),independent:Number(q.events[0]?.type==='correct'),
      final:Number(q.attempts.at(-1)===q.answer),scaffolds:Number(q.events.some(e=>e.type==='scaffold')),feedbackItems:Number(q.events.some(e=>e.type==='feedback')),feedbackRequests:q.events.filter(e=>e.type==='feedback').length,hints:Number(q.hint),solutions:Number(!!q.solutionShown),reflections:Number(!!q.reflection?.trim()),
    })),observations.length),
  }));
}
function constructionMetrics(entries) {
  const evidence = entries.map(record => assignedEvidence(record.sourceRecord)), n = evidence.length;
  const part = key => ({
    first:metric(evidence.filter(e => e[key].first === true).length,n,'construcciones','Primera comprobación correcta; puede existir ayuda previa.'),
    firstWithoutHelp:metric(evidence.filter(e => e[key].firstWithoutHint).length,n,'construcciones','Primera comprobación correcta sin pista previa en esa fase; no acredita transferencia independiente.'),
    final:metric(evidence.filter(e => e[key].final === true).length,n,'construcciones','Última comprobación correcta de esta construcción.'),
    hints:metric(evidence.filter(e => e[key].hint).length,n,'construcciones','Construcciones con pista registrada en su fase.'),
    checks:evidence.reduce((sum,e) => sum+e[key].checks,0),
  });
  return {kind:'construction',closures:n,initial:part('initial'),probe:part('probe'),
    explanation:{
      first:metric(evidence.filter(e => e.explanation.first === true).length,n,'fases de elección de explicación','Primera opción elegida coincide con la explicación prevista.'),
      final:metric(evidence.filter(e => e.explanation.final === true).length,n,'fases de elección de explicación','Última opción elegida coincide con la explicación prevista; las revisiones no son oportunidades independientes.'),
      hints:metric(evidence.filter(e => e.explanation.hint).length,n,'fases de elección de explicación','Fases de explicación con pista registrada.'),
      choices:evidence.reduce((sum,e) => sum+e.explanation.attempts,0),
    },
    notes:metric(evidence.reduce((sum,e) => sum+e.notes,0),n,'cierres de taller','Nota opcional presente; no se infiere calidad de argumentación.'),
  };
}
function evidenceGroups(records) {
  const groups = new Map();
  for (const record of records) {
    const protocol = record.sourceRecord.taskProtocol, source = sourceOf(record), key = `${protocol}/${source}`;
    if (!groups.has(key)) groups.set(key,{key,protocol,source,sourceLabel:sourceNames[source],condition:conditions(protocol),records:[]});
    groups.get(key).records.push(record);
  }
  return [...groups.values()].sort((a,b) => a.protocol-b.protocol || sortText(a.source,b.source)).map(group => ({
    ...group, profileCount:new Set(group.records.map(r => r.profile)).size,
    metrics:group.protocol === 5 ? constructionMetrics(group.records) : questionMetrics(group.records),
    items:group.protocol === 5 ? [] : itemMetrics(group.records),
  }));
}
function suggestions(groups) {
  const result = [];
  for (const group of groups) {
    const m = group.metrics, add = (code,text) => result.push({code,protocol:group.protocol,source:group.source,text});
    if (m.kind === 'questions') {
      if (m.first.numerator < m.first.denominator) add('inspect-first','Revisar los ítems cuya primera respuesta fue incorrecta y pedir que se explique la relación representada. La secuencia no determina la causa del error.');
      if (m.final.numerator > m.first.numerator) add('inspect-revision','Comparar la respuesta inicial y la final junto con las ayudas utilizadas. La corrección posterior no demuestra aprendizaje por sí sola.');
      if (m.hints.numerator || m.solutions.numerator || m.scaffolds.numerator || m.feedbackItems.numerator) add('inspect-support','Examinar qué apoyo precedió a la respuesta y proponer otra representación; no clasificar el uso de ayuda como déficit.');
      if (!m.reflections.numerator) add('optional-explanation','No hay notas opcionales en este conjunto. Una conversación o representación adicional puede aportar evidencia; su ausencia no equivale a falta de comprensión.');
    } else {
      if (m.initial.first.numerator !== m.initial.final.numerator || m.probe.first.numerator !== m.probe.final.numerator || m.explanation.first.numerator !== m.explanation.final.numerator)
        add('inspect-construction-revision','Comparar los modelos comprobados y las elecciones en orden; identificar qué cambió y solicitar una justificación, sin atribuir automáticamente una concepción errónea.');
      if (m.initial.final.numerator < m.initial.final.denominator || m.probe.final.numerator < m.probe.final.denominator || m.explanation.final.numerator < m.explanation.final.denominator)
        add('inspect-construction','Revisar por separado la primera construcción, la segunda construcción y la explicación. Una unidad correcta no compensa las demás.');
      add('compare-two-stimuli','Contrastar ambos estímulos y sus modelos. La segunda construcción ocurre después de la primera y de su explicación: no es una medida independiente de transferencia.');
    }
    if (!result.some(r => r.protocol === group.protocol && r.source === group.source))
      add('deepen-explanation','Las respuestas observadas permiten solicitar una explicación o una situación diferente. No bastan para declarar dominio ni estimar una dificultad calibrada.');
  }
  return result;
}

export function teachingInsights(state = {}) {
  const reconciliation = summarizeReconciliation({teacher:state.teacher,teacherConfirmations:state.teacherConfirmations},true);
  const catalog = catalogOf(state), records = reconciliation.records.filter(r => r.sourceRecord.assignment);
  const matchedKeys = new Set(), tasks = catalog.tasks.map(task => {
    const matched = records.filter(r => task.recipientProfileIds.includes(r.profile) && assignmentMatches(r.sourceRecord,task));
    matched.forEach(r => matchedKeys.add(r.key));
    const bySession = new Map(matched.map(r => [sessionKey(r.sourceRecord),r]));
    // Student perspective exposes all admissible attempts; transport is classified
    // by validated reconciliation provenance, never by assignmentRows.confirmed.
    const profiles = assignmentRows(task,matched.map(r => r.sourceRecord),{},'student').map(row => {
      const attempts = row.attempts.map(a => bySession.get(sessionKey(a.session))), counts = {received:0,imported:0,unverified:0};
      attempts.forEach(r => counts[sourceOf(r)]++);
      return {profile:row.profile,attempts,counts,status:counts.received ? 'received' : counts.imported ? 'imported' : counts.unverified ? 'unverified' : 'missing'};
    });
    const n = profiles.length, count = fn => profiles.filter(fn).length, groups = evidenceGroups(matched);
    return {key:assignmentKey(task),task,profiles,groups,suggestions:suggestions(groups),
      priorVersions:catalog.tasks.filter(t => t.classId === task.classId && t.id === task.id && t.version < task.version).map(t => t.version),
      coverage:{denominator:n,unit:'perfiles destinatarios de esta versión; no personas verificadas',
        visible:count(p => p.attempts.length > 0),received:count(p => p.counts.received > 0),imported:count(p => p.counts.imported > 0),
        unverified:count(p => p.counts.unverified > 0),missing:count(p => p.attempts.length === 0),
        withoutDocumentedTransport:count(p => p.counts.received === 0 && p.counts.imported === 0),
        partition:Object.fromEntries(['received','imported','unverified','missing'].map(k => [k,count(p => p.status === k)])),
        closures:matched.length,
      },
    };
  });
  const unmatched = records.filter(r => !matchedKeys.has(r.key)).map(record => ({record,
    reason:catalog.tasks.some(t => assignmentKey(t) === assignmentKey(record.sourceRecord.assignment))
      ? 'El snapshot o el destinatario no coincide con el contrato disponible.' : 'No hay un contrato compatible en el catálogo disponible.',
  }));
  return {schema:TEACHING_INSIGHTS_SCHEMA,tasks,records,unmatched,catalogDiagnostics:catalog.diagnostics,
    reconciliation:{totals:reconciliation.totals,ledger:reconciliation.ledger,diagnostics:reconciliation.diagnostics},
    totals:{taskVersions:tasks.length,recipientMemberships:tasks.reduce((n,t) => n+t.coverage.denominator,0),
      assignedClosures:records.length,matchedClosures:matchedKeys.size,unmatchedClosures:unmatched.length,
      otherClosures:reconciliation.records.length-records.length},
    limits:[
      'La cobertura usa contratos y destinatarios del catálogo disponible; un perfil no verifica la identidad de una persona.',
      'Recibido significa presencia comprobada en una consulta del servidor; la fecha de consulta no es la primera fecha de entrega.',
      'Importado y sin constancia de transporte se muestran aparte. Un perfil puede tener intentos de varias procedencias; esos recuentos se solapan.',
      'Los denominadores de resultados son ítems o unidades constructivas en cierres únicos admisibles, no alumnos ni oportunidades independientes. Repetir una tarea genera otro intento.',
      'Versiones, variantes, protocolos y procedencias se conservan separados. No se calcula un índice global de dominio ni una comparación causal.',
      'Los registros no tienen tiempos por evento. El tiempo acumulado del ítem y el intervalo entre inicio y cierre no equivalen a tiempo de razonamiento verificado.',
      'El CSV de preguntas histórico no incluye talleres. Esta exportación conserva construcciones y eventos de tareas asignadas, incluidos los cierres fuera del catálogo; excluye registros inadmisibles y práctica libre.',
    ]};
}

const labels = {scaffolds:'Con apoyo visual',feedbackItems:'Con orientación específica',feedbackRequests:'Solicitudes de orientación',first:'Primera respuesta correcta',firstWithoutHelp:'Primera respuesta correcta sin apoyo previo',final:'Acierto final',hints:'Con pista',solutions:'Con solución mostrada',reflections:'Con nota opcional',notes:'Con nota opcional'};
function metricsHTML(metrics) {
  return `<dl class="insights-metrics">${Object.entries(metrics).filter(([,m]) => m && typeof m === 'object' && 'denominator' in m).map(([name,m]) => `<div><dt>${esc(labels[name] || name)}</dt><dd><strong>${esc(ratio(m))}</strong> ${esc(m.unit)}</dd><dd class="micro">${esc(m.condition)}</dd></div>`).join('')}</dl>`;
}
// Identities depend on immutable task/attempt coordinates, never table positions.
const uiKey=(...parts)=>esc(JSON.stringify(parts));
const taskCoordinates=t=>[t.classId,t.id,t.version];
function attemptCoordinates(r){return [...taskCoordinates(r.sourceRecord.assignment),'profile',r.profile,'attempt',r.sourceRecord.id];}
function choiceText(q,s,value){return representation(s)?(q.labels?.[value]??value):value;}
function questionEvidenceHTML(q,s,index,key){
  const names={correct:'Respuesta correcta',wrong:'Respuesta incorrecta',hint:'Pista solicitada',solution:'Solución mostrada',scaffold:'Apoyo visual solicitado',feedback:'Orientación solicitada'};
  const events=Array.isArray(q.events)?q.events:(q.attempts||[]).map(value=>({type:value===q.answer?'correct':'wrong',value}));
  return `<details class="insights-question" data-insight-key="${uiKey(...key)}"><summary>Ítem ${index+1}: ${esc(stimulus(q,s))}</summary><p>Alternativas: ${q.options.map(v=>esc(choiceText(q,s,v))).join(' · ')}.</p><ol class="insights-event-sequence">${events.map((e,ei)=>{
    let diagram='';
    if(e.type==='scaffold'&&s.taskProtocol===6){
      try{diagram=reasoningScaffoldHTML(q,events.slice(0,ei+1));}
      catch{diagram='<p>El diagrama no se puede reconstruir con el catálogo disponible. Se conserva el texto registrado.</p>';}
    }
    return `<li>${esc(names[e.type]||e.type)}${e.value!==undefined?`: ${esc(choiceText(q,s,e.value))}`:''}${e.type==='feedback'?` · Elección comentada: ${esc(choiceText(q,s,e.correctedChoice))}`:''}${e.text?`<p class="insights-recorded-text">${esc(e.text)}</p>`:''}${diagram?`<details class="insights-recorded-support" data-insight-key="${uiKey(...key,'support',ei)}"><summary>Ver el apoyo visual registrado</summary><p class="micro">Reconstrucción del contenido versionado solicitado en este evento; no es una captura de pantalla ni acredita que se haya leído.</p>${diagram}</details>`:''}</li>`;
  }).join('')}</ol>${!Array.isArray(q.events)?'<p>Registro histórico: se conserva el orden de respuestas; no consta el orden de las ayudas.</p>':''}${q.reflection?`<p>Nota opcional: ${esc(q.reflection)}</p>`:''}</details>`;
}
function itemObservationsHTML(item,group,task){
  const all=[...item.observations].sort((a,b)=>String(b.record.sourceRecord.completedAt).localeCompare(String(a.record.sourceRecord.completedAt))||sortText(a.profile,b.profile)||sortText(a.sessionId,b.sessionId)),shown=all.slice(0,8);
  const key=[...taskCoordinates(task),'group',group.key,'item',item.position,item.itemId];
  return `<details class="insights-item-observations" data-insight-key="${uiKey(...key)}"><summary>Ver respuestas por perfil en este ítem (${all.length} cierres)</summary><p>Estas respuestas componen el agregado anterior. Cada cierre conserva su perfil, condición y procedencia; no se elige el mejor resultado.</p>${all.length>8?`<p>Se muestran las 8 observaciones más recientes de ${all.length}; el agregado y la exportación conservan todas.</p>`:''}${shown.map(o=>`<section class="insights-item-observation"><h6>Perfil ${esc(o.profile)} · ${esc(o.record.sourceRecord.completedAt)}</h6><p class="micro">Registro ${esc(o.sessionId)} · ${esc(o.record.provenance.label)} · interacción ${o.record.sourceRecord.taskProtocol??1}</p>${questionEvidenceHTML(o.question,o.record.sourceRecord,item.position-1,[...key,'profile',o.profile,'attempt',o.sessionId])}</section>`).join('')}</details>`;
}
function groupHTML(group,task) {
  const m=group.metrics;
  return `<section class="insights-condition"><h5>${esc(group.sourceLabel)} · interacción ${group.protocol}</h5><p>${esc(group.condition)} Sin carrera ni adaptación.</p><p>${m.closures} cierres únicos · ${group.profileCount} perfiles de esta tarea y versión. Los cierres repetidos no son alumnos adicionales.</p>${m.kind==='questions'?`${metricsHTML(m)}<details data-insight-key="${uiKey(...taskCoordinates(task),'items',group.key)}"><summary>Localizar los ítems que conviene revisar</summary>${group.items.map(item=>`<section><h6>Ítem ${item.position}: ${esc(item.prompt)}</h6><p>${item.profileCount} perfiles; ${item.metrics.answered} respuestas en cierres distintos.</p>${metricsHTML(item.metrics)}${itemObservationsHTML(item,group,task)}</section>`).join('')}</details>`:`<h6>Construcción inicial</h6>${metricsHTML(m.initial)}<p>${m.initial.checks} comprobaciones, dentro de ${m.closures} construcciones.</p><h6>Segunda construcción</h6>${metricsHTML(m.probe)}<p>${m.probe.checks} comprobaciones, dentro de ${m.closures} construcciones.</p><h6>Elección de explicación</h6>${metricsHTML(m.explanation)}<p>${m.explanation.choices} elecciones cronológicas, dentro de ${m.closures} fases de explicación. Las revisiones no aumentan el denominador.</p>${metricsHTML({notes:m.notes})}`}</section>`;
}

function profileAttemptHTML(r){
  const s=r.sourceRecord,w=s.taskProtocol===5?s.workshop:null;
  const eventNames={correct:'Respuesta correcta',wrong:'Respuesta incorrecta',hint:'Pista solicitada',solution:'Solución mostrada',scaffold:'Apoyo visual solicitado',feedback:'Orientación solicitada'};
  const questions=!w?s.questions.map((q,i)=>questionEvidenceHTML(q,s,i,[...attemptCoordinates(r),'question',i])).join(''):'';
  const construction=w?['initial','probe'].map((key,i)=>`<section><h6>${i?'Segunda construcción':'Construcción inicial'}</h6><p>${esc(w.content[key].prompt)}</p><p>Modelo inicial disponible: ${esc(modelEvidenceText(w.content[key],w.content[key].initial))}</p>${["values","sequence","tiles","paths"].filter(k=>Array.isArray(w.content[key][k])).map(k=>`<p>${esc(({values:"Datos del estímulo",sequence:"Serie presentada",tiles:"Fichas disponibles",paths:"Caminos disponibles por etapa"})[k])}: ${esc(JSON.stringify(w.content[key][k]))}.</p>`).join("")}<p>Pista registrada en esta fase: ${w[key].hint?'sí':'no'}.</p><ol>${w[key].checks.map((c,j)=>`<li>Comprobación ${j+1}: ${c.correct?'cumple':'no cumple'} la condición. ${esc(modelEvidenceText(w.content[key],c.model))}</li>`).join('')}</ol><p>Modelo final conservado: ${esc(modelEvidenceText(w.content[key],w[key].model))}</p></section>`).join('')+`<section><h6>Alternativas de explicación presentadas</h6><ol>${w.content.initial.reasons.map(reason=>`<li>${esc(reason)}</li>`).join("")}</ol><h6>Explicaciones elegidas en orden</h6><ol>${w.explanation.attempts.map(a=>`<li>${esc(w.content.initial.reasons[a])} (${a===w.content.initial.reason?'corresponde':'no corresponde'} al modelo previsto).</li>`).join('')}</ol><p>Pista en explicación: ${w.explanation.hint?'sí':'no'}.</p><p>Nota opcional: ${esc(w.note||'Sin nota registrada.')}</p></section>`:'';
  return `<details class="insights-attempt" data-insight-key="${uiKey(...attemptCoordinates(r))}"><summary>Intento · ${esc(s.completedAt)} · ${esc(r.provenance.label)}</summary><p class="micro">Registro ${esc(s.id)} · interacción ${s.taskProtocol??1}. Inicio y cierre son fechas declaradas; no representan tiempo cognitivo.</p>${questions}${construction}${w?`<details data-insight-key="${uiKey(...attemptCoordinates(r),'events')}"><summary>Secuencia de eventos registrados del taller (${w.events.length})</summary><ol>${w.events.map(e=>`<li>${esc(({change:'Cambio del modelo',check:'Comprobación',continue:'Cambio de fase',reason:'Elección de explicación',hint:'Pista solicitada',note:'Nota guardada'})[e.type]||e.type)} · ${esc(({build:'construcción inicial',verify:'segunda construcción',explain:'explicación',review:'revisión'})[e.phase]||e.phase||'explicación')}${e.type==='reason'?`: ${esc(w.content.initial.reasons[e.value])}`:''}${e.model?` · ${esc(modelEvidenceText(w.content[e.phase==='verify'?'probe':'initial'],e.model))}`:''}</li>`).join('')}</ol></details>`:''}<p class="micro">El orden de eventos conserva las acciones registradas; solicitar ayuda no demuestra déficit y una corrección no demuestra aprendizaje por sí sola. No se califica automáticamente la nota.</p></details>`;
}
function profileEvidenceHTML(p,task){
  if(!p.attempts.length)return '<p>Sin cierre admisible disponible para este perfil.</p>';
  const ordered=[...p.attempts].sort((a,b)=>String(b.sourceRecord.completedAt).localeCompare(String(a.sourceRecord.completedAt))||sortText(a.id,b.id)),shown=ordered.slice(0,8);
  return `<details class="insights-profile-evidence" data-insight-key="${uiKey(...taskCoordinates(task),'profile',p.profile)}"><summary>Ver trayectoria del perfil ${esc(p.profile)} (${p.attempts.length} ${p.attempts.length===1?"cierre":"cierres"})</summary>${ordered.length>8?`<p>Se muestran los 8 cierres más recientes de ${ordered.length}. La exportación de evidencia conserva todos los cierres admisibles.</p>`:''}${shown.map(profileAttemptHTML).join('')}</details>`;
}

export function teachingInsightsHTML(summary) {
  const statusNames = {...sourceNames,missing:'Sin cierre admisible disponible'};
  return `<section class="teaching-insights" data-insight-context="${uiKey(...[...new Set(summary.tasks.map(x=>x.task.classId))].sort())}" aria-label="Seguimiento docente por tarea y versión"><h2>Seguimiento para decidir qué revisar</h2><p>Quién entregó · qué revisar · qué falta. ${summary.totals.taskVersions} versiones de tareas; ${summary.totals.matchedClosures} cierres vinculados al catálogo. Los resultados describen registros, no diagnósticos.</p>${summary.tasks.length ? summary.tasks.map(item => {
    const c = item.coverage,t = item.task;
    return `<details class="insights-task" data-insight-key="${uiKey(...taskCoordinates(t))}"><summary><strong>${esc(t.title)} · versión ${t.version}</strong><span>${c.visible}/${c.denominator} perfiles con cierre disponible</span></summary><h3>${esc(t.title)} · versión ${t.version}</h3><p class="micro">Aula ${esc(t.classId)} · tarea ${esc(t.id)} · ${esc(t.contentId)}@${t.contentVersion} · parámetros ${esc(JSON.stringify(t.parameters))}.${item.priorVersions.length ? ` Versiones previas conservadas por separado: ${item.priorVersions.join(', ')}.` : ''}</p><h4>¿Quién entregó?</h4><p>${c.visible}/${c.denominator} perfiles tienen algún cierre admisible. Servidor: ${c.received}/${c.denominator}; archivo importado: ${c.imported}/${c.denominator}; cierre sin constancia: ${c.unverified}/${c.denominator}. Estas procedencias pueden solaparse por perfil.</p><ul class="insights-profiles">${item.profiles.map(p => `<li><strong>Perfil ${esc(p.profile)}</strong><span>${esc(statusNames[p.status])}</span><small>${p.counts.received} ${p.counts.received===1?"cierre":"cierres"} en servidor · ${p.counts.imported} ${p.counts.imported===1?"importado":"importados"} · ${p.counts.unverified} sin constancia</small>${profileEvidenceHTML(p,t)}</li>`).join('')}</ul><h4>¿Qué revisar?</h4>${item.groups.length ? `<details data-insight-key="${uiKey(...taskCoordinates(t),'results')}"><summary>Ver resultados con denominadores y condiciones (${c.closures} cierres)</summary>${item.groups.map(g=>groupHTML(g,t)).join('')}</details><ul>${item.suggestions.map(s => `<li><strong>${esc(sourceNames[s.source])} · interacción ${s.protocol}:</strong> ${esc(s.text)}</li>`).join('')}</ul>` : '<p>No hay resultados admisibles para interpretar esta versión.</p>'}<h4>¿Qué falta?</h4><p>${c.missing}/${c.denominator} perfiles sin cierre disponible; ${c.withoutDocumentedTransport}/${c.denominator} sin constancia de consulta del servidor ni importación documentada. La ausencia de evidencia no demuestra que no hayan trabajado.</p></details>`;
  }).join('') : '<p>No hay un catálogo versionado admisible. No se inventan destinatarios ni un denominador de cobertura.</p>'}<details><summary>Cierres fuera del catálogo disponible (${summary.unmatched.length})</summary><p>Catálogo y destinatarios no verificados. Se conserva su evidencia en la exportación; no entra en la cobertura de una tarea disponible.</p>${summary.unmatched.map(({record:r,reason}) => `<p>Perfil ${esc(r.profile)} · ${esc(r.sourceRecord.assignment.title)} · versión ${r.sourceRecord.assignment.version} · intento ${esc(r.id)}. ${esc(reason)} ${esc(r.provenance.label)}.</p>`).join('')}</details><details><summary>Alcance y reconciliación de los datos</summary><p>Entradas: ${summary.reconciliation.totals.inputEntries}; cierres canónicos: ${summary.reconciliation.totals.canonicalEntries}; copias equivalentes omitidas: ${summary.reconciliation.totals.duplicates}; conflictos: ${summary.reconciliation.totals.conflicting}; inválidos: ${summary.reconciliation.totals.invalid}; sin cierre: ${summary.reconciliation.totals.incomplete}. Los registros excluidos no se transforman en ceros de desempeño.</p><ul>${summary.limits.map(text => `<li>${esc(text)}</li>`).join('')}</ul>${summary.catalogDiagnostics.map(d => `<p>${esc(d.status)}: ${esc(d.reason)}</p>`).join('')}</details></section>`;
}

export const TEACHING_EVIDENCE_COLUMNS = Object.freeze(['schema','row_type','unit','class_id','profile','session_id','task_id','task_version','content_id','content_version','catalog_status','protocol','condition','provenance','provenance_at','started_at','completed_at','phase','item_id','sequence','stimulus','model','correct','choice','reason','note','active_ms','timing_condition','payload_json']);
function representation(s){return [3,6].includes(s.taskProtocol)&&['represent-fixed-pack','reasoning-fixed-pack','reasoning-supported-pack'].includes(s.assignment?.contentId);}
function stimulus(q,s) { return representation(s) ? q.prompt : `${q.a} ${s.trail === 'suma' ? '+' : s.trail === 'resta' ? '−' : '×'} ${q.b}`; }
export function teachingEvidenceRows(summary) {
  const matched = new Set(summary.tasks.flatMap(t => t.profiles.flatMap(p => p.attempts.map(r => r.key)))), rows = [];
  for (const r of summary.records) {
    const s = r.sourceRecord,a = s.assignment;
    const common = {schema:'sendero.teaching-evidence.csv.v1',class_id:a.classId,profile:s.profile,session_id:s.id,
      task_id:a.id,task_version:a.version,content_id:a.contentId,content_version:a.contentVersion,
      catalog_status:matched.has(r.key) ? 'matched-recipient-and-snapshot' : 'catalog-or-recipient-unverified',
      protocol:s.taskProtocol,condition:conditions(s.taskProtocol),provenance:r.provenance.source,provenance_at:r.provenance.at || '',
      started_at:s.startedAt,completed_at:s.completedAt,timing_condition:'Sin tiempos por evento; inicio y cierre declarados por el dispositivo.'};
    const push = (fields,payload) => rows.push({...common,...fields,payload_json:JSON.stringify(payload)});
    const {questions,workshop,...sessionMeta} = s;
    push({row_type:'session',unit:'closure',sequence:0},sessionMeta);
    if (s.taskProtocol === 5) {
      const w = workshop;
      push({row_type:'workshop-state',unit:'metadata'},{schema:w.schema,phase:w.phase});
      for (const [phase,key] of [['build','initial'],['verify','probe']]) {
        const m = w.content[key];
        push({row_type:'initial-model',unit:'stimulus',phase,stimulus:m.prompt,model:JSON.stringify(m.initial)}, {content:m});
      }
      w.events.forEach((event,index) => {
        const phase = event.type === 'reason' ? 'explain' : event.phase, m = w.content[phase === 'verify' ? 'probe' : 'initial'];
        push({row_type:'workshop-event',unit:event.type,phase,sequence:index+1,stimulus:m.prompt,
          model:event.model ? JSON.stringify(event.model) : '',correct:event.correct ?? '',choice:event.value ?? '',
          reason:event.type === 'reason' ? m.reasons[event.value] : ''},event);
      });
      for (const [phase,key] of [['build','initial'],['verify','probe']])
        push({row_type:'final-model',unit:'phase-state',phase,model:JSON.stringify(w[key].model)}, {model:w[key].model,hint:w[key].hint});
      push({row_type:'explanation-state',unit:'phase-state',phase:'explain'}, {hint:w.explanation.hint});
      push({row_type:'workshop-note',unit:'optional-note',phase:'review',note:w.note}, {note:w.note});
    } else questions.forEach((q,index) => {
      const {events,reflection,...questionMeta} = q, item = {item_id:q.itemId || q.id || `item-${index+1}`,phase:'question',sequence:index+1,stimulus:stimulus(q,s)};
      push({...item,row_type:'question',unit:'answered-item',active_ms:q.activeMs,
        timing_condition:q.timingProtocol === 1 ? `Tiempo activo declarado; interrupción: ${q.timingInterrupted}. No hay tiempos por evento.` : 'Tiempo acumulado conservado sin protocolo de primera respuesta; no usar como velocidad comparable.'},questionMeta);
      events.forEach((event,sequence) => push({...item,row_type:'question-event',unit:event.type,sequence:sequence+1,
        choice:event.value ?? event.correctedChoice ?? '',reason:event.type==='feedback' ? 'Elección comentada: '+(q.labels?.[event.correctedChoice]??event.correctedChoice)+'; orientación: '+event.text : event.type==='scaffold' ? event.text : event.value === undefined ? '' : representation(s)?(q.labels?.[event.value]??event.value):event.value},event));
      if (reflection !== undefined) push({...item,row_type:'question-note',unit:'optional-note',note:reflection},{reflection});
    });
  }
  return rows;
}
// Quote every field and neutralise formula-leading strings, including spaces,
// tabs and BOM before = + - @. The original optional note survives losslessly
// inside payload_json (a JSON object), independently of its spreadsheet cell.
export function teachingCSVCell(value) {
  let text = String(value ?? '');
  if (/^(?:[\s\uFEFF\u200B]*[=+\-@]|[\t\r\n])/.test(text)) text = "'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
export function teachingEvidenceCSV(summary) {
  return [TEACHING_EVIDENCE_COLUMNS.map(teachingCSVCell).join(','),...teachingEvidenceRows(summary).map(row => TEACHING_EVIDENCE_COLUMNS.map(key => teachingCSVCell(row[key])).join(','))].join('\r\n');
}
