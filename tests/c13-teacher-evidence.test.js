import test from 'node:test';
import assert from 'node:assert/strict';
import {newAssignedSession,recordAttempt,recordReasoningSupport,advanceAssignedSession,validateReport,SCHEMA} from '../web/core.js';
import {sessionKey} from '../web/assignments.js';
import {REASONING_SUPPORT_FAMILIES} from '../web/reasoning-support.js';
import {teachingInsights,teachingInsightsHTML,teachingEvidenceRows} from '../web/teaching-insights.js';
import {task} from './c8-fixtures.mjs';
const profiles=['000951','000952','000953','000954'];
export function c13Fixture({family=REASONING_SUPPORT_FAMILIES[0],variant=1,repeats=1}={}){
 const t={...task('balance'),classId:'c13-local',id:'c13-evidence-'+family.id.replaceAll('_','-'),recipientProfileIds:profiles,title:'Comprender relaciones con apoyo',contentId:'reasoning-supported-pack',contentVersion:1,parameters:{family:family.id,level:family.level,variant},completionRule:{kind:'answered_items',count:4}};
 const sessions=[],confirmations={};
 for(let repeat=0;repeat<repeats;repeat++)for(let pi=0;pi<profiles.length;pi++){
  const s=newAssignedSession(t,profiles[pi]);s.id=`c13-${family.id.replaceAll('_','-')}-${variant}-${pi}-${repeat}`;
  for(const q of s.questions){q.activeMs=1000;if(pi===1)recordReasoningSupport(q,'scaffold');if(pi>=2){recordAttempt(q,q.options.find(v=>v!==q.answer));recordReasoningSupport(q,'feedback');}if(pi!==3)recordAttempt(q,q.answer);advanceAssignedSession(s);}
  s.startedAt='2026-10-22T00:00:00.000Z';s.completedAt=`2026-10-22T01:${String(repeat).padStart(2,'0')}:00.000Z`;s.completionAction.at=s.completedAt;
  validateReport({schema:SCHEMA,profile:s.profile,sessions:[s]});sessions.push(s);
  confirmations[sessionKey(s)]={classId:t.classId,profile:s.profile,source:'server-read',confirmedAt:'2026-10-22T02:00:00Z'};
 }
 return {state:{classroom:{tasks:[t]},teacher:sessions,teacherConfirmations:confirmations},sessions,t};
}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('C13 item evidence: four exact trajectories compose each aggregate without changing denominators',()=>{
 const {state,sessions}=c13Fixture(),before=JSON.stringify(state),summary=teachingInsights(state),g=summary.tasks[0].groups[0],html=teachingInsightsHTML(summary);
 assert.equal(g.items.length,4);assert.equal(g.metrics.first.numerator,8);assert.equal(g.metrics.final.numerator,12);assert.equal(g.metrics.first.denominator,16);
 for(const item of g.items){assert.equal(item.observations.length,4);assert.deepEqual(item.observations.map(o=>o.profile).sort(),profiles);for(const o of item.observations)assert.equal(o.question,o.record.sourceRecord.questions[item.position-1]);}
 assert.equal((html.match(/class="insights-item-observation"/g)||[]).length,16);
 assert.equal((html.match(/Ver respuestas por perfil en este ítem \(4 cierres\)/g)||[]).length,4);
 for(const s of sessions)assert(html.includes(esc(s.id)));
 assert.equal(JSON.stringify(state),before);assert.equal(teachingEvidenceRows(summary).filter(r=>r.row_type==='question').length,16);
});
test('C13 support: all 48 canonical diagrams are reconstructed only from a recorded request',()=>{
 let checked=0;
 for(const family of REASONING_SUPPORT_FAMILIES)for(const variant of [1,2]){
  const {state}=c13Fixture({family,variant});let summary=teachingInsights(state);const html=teachingInsightsHTML(summary);
  for(const q of state.teacher[1].questions){assert(html.includes(esc(q.scaffold.title)));assert(html.includes(esc(q.scaffold.questionMark)));checked++;}
  assert.equal((html.match(/class="reasoning-scaffold"/g)||[]).length,8,'Four requested diagrams in each of two teacher views.');
  assert(!html.includes('no se puede reconstruir'),'Canonical scaffolds must not silently fall back to text.');
  for(const s of state.teacher.slice(2))for(const q of s.questions)for(const e of q.events.filter(e=>e.type==='feedback'))
    assert(html.includes(`Orientación solicitada · Elección comentada: ${esc(q.labels[e.correctedChoice])}<p class="insights-recorded-text">${esc(e.text)}</p>`));
  assert.match(html,/Reconstrucción del contenido versionado/);assert.match(html,/Elección comentada:/);
  const noHelp=teachingInsights({...state,teacher:[state.teacher[0]],teacherConfirmations:{}});
  assert(!teachingInsightsHTML(noHelp).includes('class="reasoning-scaffold"'));
 }
 assert.equal(checked,48);
});
test('C13 evidence: incompatible visual catalog retains event text and does not fabricate a diagram',()=>{
 const {state}=c13Fixture(),summary=teachingInsights(state),r=summary.tasks[0].profiles[1].attempts[0];
 const text=r.sourceRecord.questions[0].events[0].text;r.sourceRecord.questions[0].scaffold.title='unrecognized visual revision';
 const html=teachingInsightsHTML(summary);assert.match(html,/no se puede reconstruir/);assert(html.includes(esc(text)));assert(!html.includes('unrecognized visual revision'));
 // Defense after the validated projection only; imports still require canonical content.
});
test('C13 identities: stable semantic keys are unique and changes of version cannot inherit old keys',()=>{
 const {state}=c13Fixture(),a=teachingInsights(state),html=teachingInsightsHTML(a),keys=[...html.matchAll(/data-insight-key="([^"]*)"/g)].map(m=>m[1]);
 assert.equal(new Set(keys).size,keys.length);
 const b=structuredClone(a);b.tasks[0].task.version=2;const changed=teachingInsightsHTML(b);assert(!changed.includes('data-insight-key="'+esc(JSON.stringify(['c13-local',state.classroom.tasks[0].id,1]))+'"'));
 assert.match(html,/data-insight-context=/);
});
test('C13 repeated attempts: per-item display cap preserves all 12 observations in metrics and CSV',()=>{
 const {state}=c13Fixture({repeats:3}),summary=teachingInsights(state),html=teachingInsightsHTML(summary);
 assert.equal(summary.tasks[0].groups[0].items[0].observations.length,12);assert.equal(summary.tasks[0].groups[0].metrics.first.denominator,48);
 assert.equal((html.match(/class="insights-item-observation"/g)||[]).length,32);assert.match(html,/8 observaciones más recientes de 12/);
 assert.equal(teachingEvidenceRows(summary).filter(r=>r.row_type==='question').length,48);
});
