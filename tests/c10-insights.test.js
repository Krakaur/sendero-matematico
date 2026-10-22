import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TASK_SCHEMA,sessionKey,assignmentKey} from '../web/assignments.js';
import {newAssignedSession,recordAttempt,recordSolution,advanceAssignedSession} from '../web/core.js';
import {REASONING_C9_FAMILIES} from '../web/reasoning-c9.js';
import {teachingInsights,teachingInsightsHTML,teachingEvidenceRows,teachingEvidenceCSV,teachingCSVCell,TEACHING_EVIDENCE_COLUMNS} from '../web/teaching-insights.js';
import {profiles,workshopTasks,completeWorkshop,completeReasoning,reasoningTasks} from './c8-fixtures.mjs';

const clone = structuredClone;
const c9Tasks = () => REASONING_C9_FAMILIES.flatMap(f => [1,2].map(variant => ({
  schema:TASK_SCHEMA,classId:'c10-local',id:`c10-${f.id.replaceAll('_','-')}-${variant}`,version:1,
  title:`${f.name} ${variant}`,trail:'razonar',contentId:'reasoning-fixed-pack',contentVersion:2,
  parameters:{family:f.id,level:f.level,variant},completionRule:{kind:'answered_items',count:4},
  recipientProfileIds:profiles,assignedAt:'2026-10-21T00:00:00Z',
})));
const proof = (s,source='server-read') => ({classId:s.assignment.classId,profile:s.profile,source,confirmedAt:'2026-10-21T22:00:00Z'});
const stateFor = (tasks,sessions) => ({classroom:{tasks},teacher:sessions,teacherConfirmations:{}});
function matrix() {
  const tasks = [...workshopTasks('c10-local'),...c9Tasks()],state = stateFor(tasks,[]);
  for (const t of tasks) profiles.forEach((p,index) => {
    const s = t.contentId === 'workshop-fixed-project' ? completeWorkshop(t,p,index) : completeReasoning(t,p,index);
    state.teacher.push(s);
    if (index !== 2) state.teacherConfirmations[sessionKey(s)] = proof(s,['server-read','manual-file',null,'client-observed-server-read'][index]);
  });
  return state;
}
function parseCSV(text) {
  const rows = [],row = []; let cell = '',quoted = false;
  for (let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') {if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if(c==='\r'&&text[i+1]==='\n'&&!quoted){row.push(cell);rows.push(row.splice(0));cell='';i++;}
    else cell+=c;
  }
  row.push(cell);rows.push(row);const [headers,...body]=rows;
  return body.map(values => Object.fromEntries(headers.map((key,index) => [key,values[index]])));
}
function restoreRows(rows) {
  const sessions = [];
  for (const head of rows.filter(r => r.row_type==='session')) {
    const own = rows.filter(r => r.class_id===head.class_id&&r.profile===head.profile&&r.session_id===head.session_id);
    const s=JSON.parse(head.payload_json);s.questions=[];
    if(Number(head.protocol)===5) {
      const w=JSON.parse(own.find(r=>r.row_type==='workshop-state').payload_json);
      w.content={};w.events=own.filter(r=>r.row_type==='workshop-event').sort((a,b)=>Number(a.sequence)-Number(b.sequence)).map(r=>JSON.parse(r.payload_json));
      for(const [phase,key] of [['build','initial'],['verify','probe']]) {
        w.content[key]=JSON.parse(own.find(r=>r.row_type==='initial-model'&&r.phase===phase).payload_json).content;
        w[key]={...JSON.parse(own.find(r=>r.row_type==='final-model'&&r.phase===phase).payload_json),
          checks:w.events.filter(e=>e.type==='check'&&e.phase===phase).map(({model,correct})=>({model,correct}))};
      }
      w.explanation={...JSON.parse(own.find(r=>r.row_type==='explanation-state').payload_json),attempts:w.events.filter(e=>e.type==='reason').map(e=>e.value)};
      w.note=JSON.parse(own.find(r=>r.row_type==='workshop-note').payload_json).note;s.workshop=w;
    } else {
      s.questions=own.filter(r=>r.row_type==='question').sort((a,b)=>Number(a.sequence)-Number(b.sequence)).map(row=>{
        const q=JSON.parse(row.payload_json);
        q.events=own.filter(r=>r.row_type==='question-event'&&r.item_id===row.item_id).sort((a,b)=>Number(a.sequence)-Number(b.sequence)).map(r=>JSON.parse(r.payload_json));
        const note=own.find(r=>r.row_type==='question-note'&&r.item_id===row.item_id);
        if(note)q.reflection=JSON.parse(note.payload_json).reflection;
        return q;
      });
    }
    sessions.push(s);
  }
  return sessions;
}

test('C10: 32 talleres y 48 cierres @2 mantienen perfiles, unidades y procedencias distintas',()=>{
  const state=matrix(),before=JSON.stringify(state),summary=teachingInsights(state);
  assert.equal(JSON.stringify(state),before,'La proyección no altera el estado ni sus contratos.');
  assert.equal(summary.totals.taskVersions,20);assert.equal(summary.totals.assignedClosures,80);
  assert.equal(summary.totals.matchedClosures,80);assert.equal(summary.totals.unmatchedClosures,0);
  assert.equal(summary.totals.recipientMemberships,80,'Pertenencias a 20 tareas, no 80 personas.');
  assert.equal(summary.reconciliation.diagnostics.conservationDifference,0);
  const constructions=summary.tasks.filter(t=>t.task.contentId==='workshop-fixed-project');
  const questions=summary.tasks.filter(t=>t.task.contentVersion===2);
  assert.equal(constructions.reduce((n,t)=>n+t.coverage.closures,0),32);
  assert.equal(questions.reduce((n,t)=>n+t.coverage.closures,0),48);
  assert.equal(questions.flatMap(t=>t.groups).reduce((n,g)=>n+g.metrics.answered,0),192);
  for(const t of summary.tasks) {
    assert.equal(t.coverage.denominator,4);assert.equal(t.coverage.visible,4);
    assert.equal(t.coverage.received,2);assert.equal(t.coverage.imported,1);assert.equal(t.coverage.unverified,1);
    assert.equal(t.coverage.withoutDocumentedTransport,1);assert.equal(t.coverage.missing,0);
    assert.deepEqual(t.coverage.partition,{received:2,imported:1,unverified:1,missing:0});
    assert.equal(t.groups.length,3);assert.ok(t.suggestions.length);
    assert.ok(!Object.hasOwn(t,'mastery'));assert.ok(!Object.hasOwn(t,'score'));
  }
  for(const t of constructions) {
    const m=t.groups.find(g=>g.source==='received').metrics;
    assert.equal(m.initial.first.numerator,1);assert.equal(m.initial.first.denominator,2);
    assert.equal(m.initial.final.numerator,2);assert.equal(m.initial.checks,3);
    assert.equal(m.probe.first.numerator,1);assert.equal(m.probe.final.numerator,2);
    assert.equal(m.explanation.first.numerator,1);assert.equal(m.explanation.final.numerator,2);
    assert.equal(m.explanation.choices,3);assert.equal(m.explanation.final.denominator,2);
    const hinted=t.groups.find(g=>g.source==='unverified').metrics;
    assert.equal(hinted.initial.first.numerator,1);assert.equal(hinted.initial.firstWithoutHelp.numerator,0);
  }
  for(const t of questions) {
    const g=t.groups.find(g=>g.source==='received'),m=g.metrics;
    assert.equal(m.first.numerator,4);assert.equal(m.first.denominator,8);
    assert.equal(m.firstWithoutHelp.numerator,4);assert.equal(m.final.numerator,8);
    assert.equal(m.solutions.numerator,0);assert.equal(g.items.length,4);
    assert.ok(g.items.every(i=>i.metrics.first.numerator===1&&i.metrics.first.denominator===2&&i.metrics.final.numerator===2));
  }
});

test('C10: ausencia, copia idéntica y conflicto se separan de un desempeño cero',()=>{
  const t=workshopTasks('c10-local')[0],s=completeWorkshop(t),state=stateFor([t],[s,clone(s)]);
  state.teacherConfirmations[sessionKey(s)]=proof(s);
  let summary=teachingInsights(state),item=summary.tasks[0];
  assert.equal(summary.reconciliation.totals.duplicates,1);assert.equal(item.coverage.closures,1);
  assert.equal(item.coverage.missing,3);assert.equal(item.groups[0].metrics.initial.final.denominator,1);
  const altered=clone(s);altered.workshop.note='Otro contenido con el mismo identificador.';state.teacher.push(altered);
  summary=teachingInsights(state);assert.equal(summary.reconciliation.totals.conflicting,3);
  assert.equal(summary.totals.assignedClosures,0);assert.equal(summary.tasks[0].coverage.missing,4);
  assert.equal(summary.tasks[0].groups.length,0);
});

test('C10: recibos inválidos y procedencias concurrentes no inventan recepción ni suman personas',()=>{
  const t=workshopTasks('c10-local')[0],a=completeWorkshop(t),b=completeWorkshop(t),c=completeWorkshop(t);
  const state=stateFor([t],[a,b,c]);
  state.teacherConfirmations[sessionKey(a)]=proof(a,'manual-file');
  state.teacherConfirmations[sessionKey(b)]=proof(b);
  state.teacherConfirmations[sessionKey(c)]={...proof(c),confirmedAt:'not-a-date'};
  const summary=teachingInsights(state),coverage=summary.tasks[0].coverage;
  assert.equal(coverage.visible,1);assert.equal(coverage.received,1);assert.equal(coverage.imported,1);assert.equal(coverage.unverified,1);
  assert.deepEqual(coverage.partition,{received:1,imported:0,unverified:0,missing:3});
  assert.equal(coverage.closures,3);assert.equal(summary.tasks[0].profiles[0].attempts.length,3);
  state.teacherConfirmations[sessionKey(b)]={...proof(b),profile:profiles[3]};
  assert.equal(teachingInsights(state).tasks[0].coverage.received,0);
  state.teacherConfirmations[sessionKey(b)]={...proof(b),classId:'other-class'};
  assert.equal(teachingInsights(state).reconciliation.totals.invalid,1);
});

test('C10: versiones, variantes y el contenido @1 previo nunca se fusionan con @2',()=>{
  const first=c9Tasks()[0],second={...clone(first),version:2,parameters:{...first.parameters,variant:2}};
  const previous=reasoningTasks()[0],sessions=[completeReasoning(first),completeReasoning(second),completeReasoning(previous)];
  const summary=teachingInsights(stateFor([first,second,previous],sessions));
  assert.equal(summary.tasks.length,3);assert.equal(summary.totals.assignedClosures,3);
  assert.deepEqual(summary.tasks.find(t=>t.key===assignmentKey(second)).priorVersions,[1]);
  assert.ok(summary.tasks.every(t=>t.coverage.closures===1&&t.coverage.missing===3));
  assert.equal(new Set(summary.tasks.map(t=>t.key)).size,3);
});

test('C10: intentos sin catálogo o de destinatario no verificado siguen exportables sin cobertura ficticia',()=>{
  const t=workshopTasks('c10-local')[0],s=completeWorkshop(t,profiles[3]),narrow={...clone(t),recipientProfileIds:profiles.slice(0,3)};
  const state=stateFor([narrow],[s]);state.teacherConfirmations[sessionKey(s)]=proof(s,'manual-file');
  let summary=teachingInsights(state);
  assert.equal(summary.tasks[0].coverage.denominator,3);assert.equal(summary.tasks[0].coverage.missing,3);
  assert.equal(summary.unmatched.length,1);assert.equal(summary.totals.matchedClosures,0);
  assert.ok(teachingEvidenceRows(summary).every(r=>r.catalog_status==='catalog-or-recipient-unverified'));
  delete state.classroom;summary=teachingInsights(state);
  assert.equal(summary.tasks.length,0);assert.equal(summary.unmatched.length,1);
  assert.deepEqual(restoreRows(teachingEvidenceRows(summary)),[s]);
  const html=teachingInsightsHTML(summary);assert.match(html,/no se inventan destinatarios/i);assert.doesNotMatch(html,/0\/0/);
});

test('C10: copias del catálogo no duplican denominadores y contratos contradictorios quedan fuera',()=>{
  const t=workshopTasks('c10-local')[0],s=completeWorkshop(t),state=stateFor([t,clone(t)],[s]);
  let summary=teachingInsights(state);
  assert.equal(summary.tasks.length,1);assert.equal(summary.totals.recipientMemberships,4);
  assert.equal(summary.catalogDiagnostics[0].status,'duplicate');
  state.classroom.tasks.push({...clone(t),title:'Contrato con igual identidad y otro título'});
  summary=teachingInsights(state);assert.equal(summary.tasks.length,0);assert.equal(summary.unmatched.length,1);
  assert.equal(summary.catalogDiagnostics[0].status,'conflicting');
});

test('C10: pendientes e informes inválidos se registran como exclusiones, no como intentos fallidos',()=>{
  const t=workshopTasks('c10-local')[0],pending=newAssignedSession(t,profiles[0]),invalid=completeWorkshop(t,profiles[1]);
  invalid.workshop.initial.checks[0].correct=!invalid.workshop.initial.checks[0].correct;
  const summary=teachingInsights(stateFor([t],[pending,invalid]));
  assert.equal(summary.reconciliation.totals.incomplete,1);assert.equal(summary.reconciliation.totals.invalid,1);
  assert.equal(summary.tasks[0].coverage.closures,0);assert.equal(summary.tasks[0].coverage.missing,4);
  assert.deepEqual(teachingEvidenceRows(summary),[]);assert.equal(summary.reconciliation.diagnostics.conservationDifference,0);
});

test('C10: interacciones históricas 1 y 2 mantienen resultados separados dentro de una misma versión',()=>{
  const t={...c9Tasks()[0],id:'c10-multiply',contentId:'multiply-fixed-table',contentVersion:1,trail:'multi',
    parameters:{table:2},completionRule:{kind:'answered_items',count:8}};
  const current=completeReasoning(t,profiles[0]),historical=completeReasoning(t,profiles[1]);
  historical.taskProtocol=1;delete historical.completionAction;
  const summary=teachingInsights(stateFor([t],[current,historical]));
  assert.deepEqual(summary.tasks[0].groups.map(g=>g.protocol),[1,2]);
  assert.ok(summary.tasks[0].groups.every(g=>g.metrics.answered===8));
  assert.match(summary.tasks[0].groups[0].condition,/sin la misma oportunidad de revisión/);
});

test('C10: exportación de 80 cierres reconstruye cada estímulo, modelo, comprobación, elección y nota sin pérdida',()=>{
  const state=matrix(),summary=teachingInsights(state),rows=teachingEvidenceRows(summary);
  const restored=restoreRows(rows),byKey=new Map(restored.map(s=>[sessionKey(s),s]));
  assert.equal(restored.length,80);assert.equal(byKey.size,80);
  for(const s of state.teacher)assert.deepEqual(byKey.get(sessionKey(s)),s);
  const workshops=state.teacher.filter(s=>s.taskProtocol===5),questions=state.teacher.filter(s=>s.taskProtocol!==5).flatMap(s=>s.questions);
  assert.equal(rows.filter(r=>r.row_type==='initial-model').length,64);
  assert.equal(rows.filter(r=>r.row_type==='final-model').length,64);
  assert.equal(rows.filter(r=>r.row_type==='workshop-event').length,workshops.reduce((n,s)=>n+s.workshop.events.length,0));
  assert.equal(rows.filter(r=>r.row_type==='workshop-event'&&r.unit==='check').length,workshops.reduce((n,s)=>n+s.workshop.initial.checks.length+s.workshop.probe.checks.length,0));
  assert.equal(rows.filter(r=>r.row_type==='question').length,192);
  assert.equal(rows.filter(r=>r.row_type==='question-event').length,questions.reduce((n,q)=>n+q.events.length,0));
  assert.ok(rows.filter(r=>r.row_type.endsWith('-event')).every(r=>r.active_ms===undefined),'No se distribuye tiempo de ítem entre eventos sin reloj.');
  const parsed=parseCSV(teachingEvidenceCSV(summary));
  assert.equal(parsed.length,rows.length);assert.equal(Object.keys(parsed[0]).length,TEACHING_EVIDENCE_COLUMNS.length);
  const csvRestored=new Map(restoreRows(parsed).map(s=>[sessionKey(s),s]));
  for(const s of state.teacher)assert.deepEqual(csvRestored.get(sessionKey(s)),s);
});

test('C10: CSV neutraliza fórmulas y conserva texto original entre comillas, saltos y JSON',()=>{
  for(const value of ['="SUM(1,2)"','+cmd','-2+3','@SUM(A1)','  =1','\t=1','\r=1','\nhello','\uFEFF=1','\u200B=1'])
    assert.ok(teachingCSVCell(value).startsWith('"\''),JSON.stringify(value));
  assert.equal(teachingCSVCell('texto, "citado"'),'"texto, ""citado"""');
  const t=workshopTasks('c10-local')[0],s=completeWorkshop(t);
  s.workshop.note='="HIPERVINCULO(\"https://invalid.example\")"\n<script>falso</script>';
  const state=stateFor([t],[s]),summary=teachingInsights(state),rows=parseCSV(teachingEvidenceCSV(summary));
  const note=rows.find(r=>r.row_type==='workshop-note');assert.ok(note.note.startsWith('\''));
  assert.equal(JSON.parse(note.payload_json).note,s.workshop.note);
  assert.deepEqual(restoreRows(rows),[s]);
});

test('C10: ayudas y solución solicitada mantienen sus denominadores y no son inferidas como aprendizaje',()=>{
  const t=c9Tasks()[0],s=newAssignedSession(t,profiles[0]);
  for(const q of s.questions){recordAttempt(q,q.options.find(n=>n!==q.answer));recordSolution(q);recordAttempt(q,q.answer);advanceAssignedSession(s);}
  const summary=teachingInsights(stateFor([t],[s])),g=summary.tasks[0].groups[0],m=g.metrics;
  assert.equal(m.first.numerator,0);assert.equal(m.final.numerator,4);assert.equal(m.solutions.numerator,4);
  assert.equal(m.solutions.denominator,4);assert.equal(m.firstWithoutHelp.numerator,0);
  assert.ok(summary.tasks[0].suggestions.some(s=>s.code==='inspect-revision'&&s.text.includes('no demuestra aprendizaje')));
});

test('C10: HTML conserva jerarquía, denominadores, procedencia textual y no exige tablas anchas',()=>{
  const t=workshopTasks('c10-local')[0];t.title='<img src=x onerror=alert(1)>';
  const s=completeWorkshop(t),summary=teachingInsights(stateFor([t],[s])),html=teachingInsightsHTML(summary);
  assert.match(html,/¿Quién entregó\?/);assert.match(html,/¿Qué revisar\?/);assert.match(html,/¿Qué falta\?/);
  assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img src=x/);
  assert.match(html,/Construcción inicial/);assert.match(html,/Segunda construcción/);assert.match(html,/Elección de explicación/);
  assert.match(html,/Disponible sin constancia/);assert.match(html,/1\/4 perfiles/);
  assert.doesNotMatch(html,/<table|<details\s+open|<script/i);
  assert.match(html,/CSV de preguntas histórico no incluye talleres/);
  const css=readFileSync(new URL('../web/teaching-insights.css',import.meta.url),'utf8');
  assert.ok(Buffer.byteLength(css)<=8192);assert.match(css,/minmax\(0,1fr\)/);assert.match(css,/focus-visible/);
  assert.doesNotMatch(css,/(?:^|[;{])\s*min-width:\s*(?:600|700|800)px/);
  // Source constraints do not replace coordinated browser checks at 320/360/390 px.
});
