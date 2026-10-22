import {TASK_SCHEMA} from '../web/assignments.js';
import {newAssignedSession,advanceAssignedSession,recordAttempt,recordSupport,SCHEMA} from '../web/core.js';
import {applyAssignedWorkshopAction,WORKSHOP_NAMES} from '../web/assigned-workshop.js';
export const profiles=['000801','000802','000803','000804'];
export const task=(project,level=2,variant=1,classId='c8-local')=>({schema:TASK_SCHEMA,classId,id:`c8-${project}-${level}-${variant}`,version:1,title:`Taller ${project}`,trail:'razonar',contentId:'workshop-fixed-project',contentVersion:1,parameters:{project,level,variant},completionRule:{kind:'reviewed_project',count:1},recipientProfileIds:profiles,assignedAt:'2026-10-21T00:00:00Z'});
export const workshopTasks=(classId='c8-local')=>Object.keys(WORKSHOP_NAMES).map(project=>task(project,2,1,classId));
export const report=s=>({schema:SCHEMA,profile:s.profile,sessions:[s]});
// Explicit models by mathematical condition, independent of the runtime's checker.
export function solution(m){
 switch(m.kind){
  case 'balance':return {value:m.total-m.a};
  case 'sharing':return {baskets:Array(m.a).fill(m.total/m.a)};
  case 'array':return {rows:m.a,columns:m.b};
  case 'fraction':return {selected:Array.from({length:m.take},(_,i)=>i)};
  case 'measure':return {rows:m.b,columns:m.a,value:2*(m.a+m.b)};
  case 'data':return {selected:[0,1],value:m.values[1]-m.values[0]};
  case 'pattern':return {selected:[m.sequence.at(-1)+m.step,m.sequence.at(-1)+2*m.step]};
  case 'route':for(const a of m.paths[0])for(const b of m.paths[1])for(const c of m.paths[2])if(a+b+c===m.target)return {path:[a,b,c]};
 }
}
export function completeWorkshop(t,profile=profiles[0],trajectory=0){
 const s=newAssignedSession(t,profile),w=s.workshop;
 const act=a=>{if(!applyAssignedWorkshopAction(w,a))throw Error('Fixture action rejected '+a.type);};
 for(const key of ['initial','probe']){
  if(trajectory===2)act({type:'hint'});
  if(trajectory===1||trajectory===3)act({type:'check'});
  if(trajectory!==1){if(trajectory===3)act({type:'hint'});w[key].model=solution(w.content[key]);act({type:'check'});}
  act({type:'continue'});
  if(key==='initial'){
   if(trajectory===2)act({type:'hint'});
   if(trajectory===1||trajectory===3)act({type:'reason',value:(w.content.initial.reason+1)%3});
   if(trajectory!==1)act({type:'reason',value:w.content.initial.reason});
   act({type:'continue'});
  }
 }
 w.note=trajectory===3?'Probé una construcción, revisé la pista y cambié el modelo.':'';
 advanceAssignedSession(s);return s;
}
export const reasoningTasks=()=>[['dos_pasos',3],['dos_pasos',4],['dato_faltante',2]].flatMap(([family,level])=>[1,2].map(variant=>({...task('balance'),id:`c8-${family.replaceAll('_','-')}-${level}-${variant}`,title:`${family} ${level}/${variant}`,contentId:'reasoning-fixed-pack',parameters:{family,level,variant},completionRule:{kind:'answered_items',count:4}})));
export function completeReasoning(t,profile=profiles[0],trajectory=0){
 const s=newAssignedSession(t,profile);
 for(const q of s.questions){q.activeMs=1000;if(trajectory===2)recordSupport(q);if(trajectory===1||trajectory===3)recordAttempt(q,q.options.find(n=>n!==q.answer));if(trajectory!==1)recordAttempt(q,q.answer);advanceAssignedSession(s);}return s;
}
