import test from 'node:test';
import assert from 'node:assert/strict';
import {newAssignedSession,recordAttempt,recordSupport,recordSolution,recordReasoningSupport,advanceAssignedSession,validateReport,SCHEMA} from '../web/core.js';
import {sessionKey} from '../web/assignments.js';
import {REASONING_SUPPORT_FAMILIES} from '../web/reasoning-support.js';
import {teachingInsights,teachingInsightsHTML,teachingEvidenceRows,teachingEvidenceCSV} from '../web/teaching-insights.js';
import {profiles,task,completeWorkshop} from './c8-fixtures.mjs';

const clone=structuredClone;
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const classId='c12-teaching-local';
const project=(family='balance')=>({...task(family,2,1,classId),id:`c12-profile-${family}`});
function supportedTask(){const f=REASONING_SUPPORT_FAMILIES[0];return {...project(),id:'c12-profile-supported',title:'Comparar con apoyo optativo',contentId:'reasoning-supported-pack',contentVersion:1,parameters:{family:f.id,level:f.level,variant:1},completionRule:{kind:'answered_items',count:4}};}
function supported(t,profile,trajectory=0){
  const s=newAssignedSession(t,profile);
  for(const q of s.questions){
    q.activeMs=1000;
    if(trajectory===1)assert.equal(recordReasoningSupport(q,'scaffold'),true);
    if(trajectory>=2){assert.equal(recordAttempt(q,q.options.find(v=>v!==q.answer)),true);assert.equal(recordReasoningSupport(q,'feedback'),true);}
    if(trajectory===3){assert.equal(recordSupport(q),true);assert.equal(recordSolution(q),true);q.reflection='Revisé, pero conservo mi elección final.';}
    else assert.equal(recordAttempt(q,q.answer),true);
    advanceAssignedSession(s);
  }
  validateReport({schema:SCHEMA,profile,sessions:[s]});return s;
}
function stateFor(tasks,sessions){return {classroom:{tasks},teacher:sessions,teacherConfirmations:{}};}
function matrix(){
  const reasoning=supportedTask(),workshop=project(),sessions=[];
  for(let i=0;i<4;i++){sessions.push(supported(reasoning,profiles[i],i));sessions.push(completeWorkshop(workshop,profiles[i],[0,2,3,1][i]));}
  const state=stateFor([reasoning,workshop],sessions);
  for(const s of sessions){if(s.profile!==profiles[2])state.teacherConfirmations[sessionKey(s)]={classId,profile:s.profile,source:s.profile===profiles[1]?'manual-file':'server-read',confirmedAt:'2026-10-22T00:00:00Z'};}
  return {state,sessions,reasoning,workshop};
}
function attemptHTML(html,id){const own=html.split(/<details class="insights-attempt"[^>]*>/).slice(1).find(part=>part.includes(`Registro ${esc(id)} ·`));assert(own,`Attempt ${id} must be reachable from its profile`);return own;}

test('C12 teacher: four profiles can reach all eight real protocol-6/protocol-5 trajectories',()=>{
  const {state,sessions}=matrix(),before=JSON.stringify(state),summary=teachingInsights(state),html=teachingInsightsHTML(summary);
  assert.equal(summary.totals.matchedClosures,8);assert.equal(summary.totals.unmatchedClosures,0);
  assert.equal((html.match(/class="insights-attempt"/g)||[]).length,8);
  assert.equal((html.match(/class="insights-profile-evidence"/g)||[]).length,8,'Each profile has one disclosure in each of its two tasks.');
  for(const s of sessions){const own=attemptHTML(html,s.id);assert(own.includes(`interacción ${s.taskProtocol}`));assert(own.includes(esc(s.completedAt)));}
  assert.match(html,/Consulta del servidor con fecha declarada/);assert.match(html,/Importación manual documentada/);assert.match(html,/Sin clasificar/);
  assert.equal(JSON.stringify(state),before,'Opening the evidence projection must not change stored sessions.');
});

test('C12 teacher: all alternatives, recorded support and wrong final choices remain visible without inferred success',()=>{
  const {state,sessions}=matrix(),summary=teachingInsights(state),html=teachingInsightsHTML(summary);
  for(const s of sessions.filter(s=>s.taskProtocol===6)){
    const own=attemptHTML(html,s.id);
    for(const q of s.questions)assert(own.includes('Alternativas: '+q.options.map(v=>esc(q.labels[v]??v)).join(' · ')+'.'));
  }
  const wrong=sessions.find(s=>s.taskProtocol===6&&s.profile===profiles[3]),own=attemptHTML(html,wrong.id);
  assert(wrong.questions.every(q=>q.attempts.at(-1)!==q.answer));
  const events=own.slice(0,own.indexOf('</ol>'));
  assert(events.indexOf('Respuesta incorrecta')<events.indexOf('Orientación solicitada'));
  assert(events.indexOf('Orientación solicitada')<events.indexOf('Pista solicitada'));
  assert(events.indexOf('Pista solicitada')<events.indexOf('Solución mostrada'));
  assert(!events.includes('Respuesta correcta'),'Showing a solution must not fabricate a correct answer event.');
  const group=summary.tasks.find(t=>t.task.id===wrong.assignment.id).groups.find(g=>g.source==='received');
  assert.equal(group.metrics.final.numerator,4);assert.equal(group.metrics.final.denominator,8,'Four correct and four final-wrong items share this synthetic received condition.');
  const rows=teachingEvidenceRows(summary).filter(r=>r.session_id===wrong.id&&r.row_type==='question');
  assert.equal(rows.length,4);assert(rows.every(r=>{const q=JSON.parse(r.payload_json);return q.attempts.at(-1)!==q.answer&&!q.done;}));
});

test('C12 teacher: workshop alternatives and both frozen stimuli survive the detail view',()=>{
  for(const family of ['pattern','data','route']){
    const t=project(family),s=completeWorkshop(t,profiles[0],3),summary=teachingInsights(stateFor([t],[s])),html=attemptHTML(teachingInsightsHTML(summary),s.id);
    assert.match(html,/Construcción inicial/);assert.match(html,/Segunda construcción/);assert.match(html,/Alternativas de explicación presentadas/);
    for(const key of ['initial','probe']){const m=s.workshop.content[key];assert(html.includes(esc(m.prompt)));for(const field of ['values','sequence','tiles','paths'])if(Array.isArray(m[field]))assert(html.includes(esc(JSON.stringify(m[field]))),`${family}/${key}/${field}`);}
    for(const reason of s.workshop.content.initial.reasons)assert(html.includes(esc(reason)));
    assert.match(html,/Secuencia de eventos registrados del taller/);
    const exportRows=teachingEvidenceRows(summary);for(const [phase,key] of [['build','initial'],['verify','probe']]){
      assert.deepEqual(JSON.parse(exportRows.find(r=>r.row_type==='initial-model'&&r.phase===phase).payload_json).content,s.workshop.content[key]);
      assert.deepEqual(JSON.parse(exportRows.find(r=>r.row_type==='final-model'&&r.phase===phase).payload_json).model,s.workshop[key].model);
    }
  }
  const t=project(),wrong=completeWorkshop(t,profiles[3],1),summary=teachingInsights(stateFor([t],[wrong])),html=attemptHTML(teachingInsightsHTML(summary),wrong.id);
  assert.equal(wrong.workshop.initial.checks.at(-1).correct,false);assert.equal(wrong.workshop.probe.checks.at(-1).correct,false);
  assert.match(html,/no cumple la condición/);assert.match(html,/no corresponde al modelo previsto/);
  assert.equal(summary.tasks[0].groups[0].metrics.probe.final.numerator,0);
});

test('C12 teacher: notes are text, including HTML-like and quoted content, in both protocols',()=>{
  const {state,sessions}=matrix(),payload='<img src=x onerror="alert(1)"> & <script>nota</script>';
  const qSession=sessions.find(s=>s.taskProtocol===6),wSession=sessions.find(s=>s.taskProtocol===5);
  qSession.questions[0].reflection=payload;wSession.workshop.note=payload;
  for(const s of [qSession,wSession])validateReport({schema:SCHEMA,profile:s.profile,sessions:[s]});
  const summary=teachingInsights(state),html=teachingInsightsHTML(summary);assert.equal(summary.totals.matchedClosures,8);
  for(const s of [qSession,wSession])assert(attemptHTML(html,s.id).includes(esc(payload)));
  assert(!html.includes('<img src=x'));assert(!html.includes('<script>nota'));
  const rows=teachingEvidenceRows(summary);assert.equal(JSON.parse(rows.find(r=>r.session_id===qSession.id&&r.row_type==='question-note').payload_json).reflection,payload);assert.equal(JSON.parse(rows.find(r=>r.session_id===wSession.id&&r.row_type==='workshop-note').payload_json).note,payload);
});

test('C12 renderer defense: absent legacy event arrays retain answer order without fabricating aid chronology',()=>{
  const t={...project(),id:'c12-profile-legacy',trail:'multi',contentId:'multiply-fixed-table',parameters:{table:2},completionRule:{kind:'answered_items',count:8}};
  const make=profile=>{const s=newAssignedSession(t,profile);for(const q of s.questions){q.activeMs=1000;recordSupport(q);recordAttempt(q,q.options.find(v=>v!==q.answer));recordAttempt(q,q.answer);advanceAssignedSession(s);}return s;};
  const current=make(profiles[0]),historical=make(profiles[1]);historical.taskProtocol=1;delete historical.completionAction;
  const summary=teachingInsights(stateFor([t],[current,historical]));assert.equal(summary.totals.matchedClosures,2);
  // Deliberately alter only the validated projection to exercise the renderer's defensive fallback.
  // Such a missing-event record is not newly admitted by today's report validator.
  for(const p of summary.tasks[0].profiles)for(const r of p.attempts)for(const q of r.sourceRecord.questions)delete q.events;
  const html=teachingInsightsHTML(summary);
  for(const s of [current,historical]){const own=attemptHTML(html,s.id),sequence=own.slice(0,own.indexOf('</ol>'));assert(sequence.indexOf('Respuesta incorrecta')<sequence.indexOf('Respuesta correcta'));assert(!sequence.includes('Pista solicitada'));assert(!sequence.includes('Solución mostrada'));assert.match(own,/no consta el orden de las ayudas/);}
});

test('C12 renderer defense: a workshop-shaped extra cannot replace a non-P5 question trajectory',()=>{
  const t=supportedTask(),s=supported(t,profiles[0]),summary=teachingInsights(stateFor([t],[s]));assert.equal(summary.totals.matchedClosures,1);
  const r=summary.tasks[0].profiles[0].attempts[0];r.sourceRecord.workshop={malformed:'MUST-NOT-RENDER'};
  const html=teachingInsightsHTML(summary);assert.match(html,/Ítem 1:/);assert(!html.includes('MUST-NOT-RENDER'));assert(!html.includes('Modelo final conservado'));
  // The injection is renderer-only; imports remain subject to protocol validation.
});

test('C12 teacher: visual cap selects eight latest closures while metrics and exports retain all nine',()=>{
  const t=supportedTask(),sessions=Array.from({length:9},(_,i)=>{
    const s=supported(t,profiles[0],i===0?3:0);s.id=`c12-profile-cap-${i}`;s.startedAt='2026-10-21T00:00:00.000Z';s.completedAt=`2026-10-21T01:0${i}:00.000Z`;s.completionAction.at=s.completedAt;validateReport({schema:SCHEMA,profile:s.profile,sessions:[s]});return s;
  });
  const summary=teachingInsights(stateFor([t],sessions)),before=JSON.stringify(summary),html=teachingInsightsHTML(summary);
  assert.match(html,/Se muestran los 8 cierres más recientes de 9/);assert.equal((html.match(/class="insights-attempt"/g)||[]).length,8);
  assert(!html.includes('Registro c12-profile-cap-0 ·'));for(let i=1;i<9;i++)assert(html.includes(`Registro c12-profile-cap-${i} ·`));
  assert(html.indexOf('Registro c12-profile-cap-8 ·')<html.indexOf('Registro c12-profile-cap-1 ·'));
  assert.equal(summary.tasks[0].coverage.closures,9);assert.equal(summary.tasks[0].coverage.visible,1);assert.equal(summary.tasks[0].groups[0].metrics.final.numerator,32);assert.equal(summary.tasks[0].groups[0].metrics.final.denominator,36);
  assert.equal(JSON.stringify(summary),before,'Rendering must not trim the analytical projection.');
  const rows=teachingEvidenceRows(summary),csv=teachingEvidenceCSV(summary);assert.equal(rows.filter(r=>r.row_type==='session').length,9);assert.equal(rows.filter(r=>r.row_type==='question').length,36);
  for(const s of sessions){assert(rows.some(r=>r.row_type==='session'&&r.session_id===s.id));assert(csv.includes(s.id));}
  const oldest=rows.filter(r=>r.row_type==='question'&&r.session_id===sessions[0].id);assert(oldest.every(r=>{const q=JSON.parse(r.payload_json);return q.attempts.at(-1)!==q.answer;}),'The hidden oldest closure still affects metrics and remains exportable as final-wrong.');
});
