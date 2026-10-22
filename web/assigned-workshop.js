import {workshopContentV1,WORKSHOP_NAMES} from './workshop-catalog.js';
import {workshopModelCorrect,workshopModelShape} from './workshop-model-v1.js';
export {WORKSHOP_NAMES,workshopModelCorrect,workshopModelShape};
const clone=structuredClone;
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const same=(a,b)=>JSON.stringify(canon(a))===JSON.stringify(canon(b));
const keys=(x,fields)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===fields.split(' ').sort().join('|');
function require(ok,message='Evidencia del taller no válida.'){if(!ok)throw Error(message);}
export function validWorkshopTask(t){
 return t?.contentId==='workshop-fixed-project'&&t.contentVersion===1&&t.trail==='razonar'
 &&keys(t.parameters,'project level variant')&&[1,2,3,4].includes(t.parameters.level)&&[1,2].includes(t.parameters.variant)
 &&Object.hasOwn(WORKSHOP_NAMES,t.parameters.project)&&keys(t.completionRule,'kind count')
 &&t.completionRule.kind==='reviewed_project'&&t.completionRule.count===1;
}
export const workshopTaskDescription=t=>`${WORKSHOP_NAMES[t.parameters.project]} · nivel ${t.parameters.level} · variante ${t.parameters.variant} · contenido v${t.contentVersion}`;
export function newAssignedWorkshop(task){
 require(validWorkshopTask(task),'Taller asignado no compatible.');
 const content=workshopContentV1(task.parameters);
 return {schema:'sendero.assigned-workshop.v1',content,phase:'build',initial:{model:clone(content.initial.initial),checks:[],hint:false},explanation:{attempts:[],hint:false},probe:{model:clone(content.probe.initial),checks:[],hint:false},events:[],note:''};
}
export const workshopPhaseKey=w=>w.phase==='build'?'initial':w.phase==='verify'?'probe':w.phase==='explain'?'explanation':null;
export const assignedWorkshopMission=w=>w.content[w.phase==='verify'||w.phase==='review'?'probe':'initial'];
export function workshopCanContinue(w){
 const key=workshopPhaseKey(w);
 if(key==='explanation')return w.explanation.attempts.length>0;
 return !!key&&!!w[key].checks.length&&same(w[key].model,w[key].checks.at(-1).model);
}
function modelAction(m,x,a){
 if(a.type==='reset')return clone(m.initial);
 const out=clone(x);
 if(a.type==='change'&&['value','rows','columns'].includes(a.key)&&Object.hasOwn(out,a.key)&&[1,-1,5,-5].includes(a.delta))out[a.key]=Math.max(a.key==='value'?0:1,Math.min(a.key==='value'?60:10,out[a.key]+a.delta));
 else if(a.type==='basket'&&m.kind==='sharing'&&Number.isInteger(a.index)&&a.index>=0&&a.index<m.a&&[-1,1].includes(a.delta)){
  if(a.delta>0&&out.baskets.reduce((sum,n)=>sum+n,0)>=m.total||a.delta<0&&out.baskets[a.index]===0)return null;
  out.baskets[a.index]+=a.delta;
 }else if(a.type==='select'&&['fraction','data','pattern'].includes(m.kind)){
  const allowed=m.kind==='fraction'?Array.from({length:m.parts},(_,i)=>i):m.kind==='data'?[0,1,2]:m.tiles;
  if(!allowed.includes(a.value))return null;
  if(out.selected.includes(a.value))out.selected=out.selected.filter(n=>n!==a.value);
  else if(out.selected.length<(m.kind==='fraction'?m.parts:2))out.selected.push(a.value);else return null;
 }else if(a.type==='path'&&m.kind==='route'&&Number.isInteger(a.index)&&m.paths[a.index]?.includes(a.value))out.path[a.index]=a.value;
 else return null;
 return workshopModelShape(m,out)?out:null;
}
// Checks preserve the visible construction. Ordinary control clicks are not evidence
// of reasoning and are not logged; their current model is retained while pending.
export function applyAssignedWorkshopAction(w,a){
 if(!w||!a)return false;
 if(a.type==='note'){if(typeof a.value!=='string'||a.value.length>600)return false;w.note=a.value;return true;}
 const key=workshopPhaseKey(w);if(!key)return false;
 const m=assignedWorkshopMission(w),part=w[key];
 if(a.type==='hint'&&!part.hint){part.hint=true;w.events.push({type:'hint',phase:w.phase});return true;}
 if(a.type==='reason'&&key==='explanation'&&Number.isInteger(a.value)&&a.value>=0&&a.value<m.reasons.length&&part.attempts.length<20&&part.attempts.at(-1)!==a.value){
  part.attempts.push(a.value);w.events.push({type:'reason',value:a.value});return true;
 }
 if(a.type==='continue'&&workshopCanContinue(w)){
  w.events.push({type:'continue',phase:w.phase});w.phase={build:'explain',explain:'verify',verify:'review'}[w.phase];return true;
 }
 if(key==='explanation')return false;
 if(a.type==='check'&&part.checks.length<20){
  const check={model:clone(part.model),correct:workshopModelCorrect(m,part.model)};
  part.checks.push(check);w.events.push({type:'check',phase:w.phase,...clone(check)});return true;
 }
 // At the evidence limit retain the last checked model so closure remains possible.
 if(part.checks.length>=20)return false;
 const model=modelAction(m,part.model,a);if(!model)return false;part.model=model;return true;
}
export function validateAssignedWorkshop(s,pending=false){
 require(validWorkshopTask(s.assignment)&&s.taskProtocol===5&&s.level===s.assignment.parameters.level&&s.index===0);
 require(Array.isArray(s.questions)&&s.questions.length===0&&s.responseMode==='construction'&&!s.race&&s.adaptation===undefined,'Condiciones constructivas incompatibles.');
 const w=s.workshop;
 require(keys(w,'schema content phase initial explanation probe events note')&&w.schema==='sendero.assigned-workshop.v1');
 require(same(w.content,workshopContentV1(s.assignment.parameters)),'El contenido del taller no coincide con su versión congelada.');
 require(typeof w.note==='string'&&w.note.length<=600&&Array.isArray(w.events)&&w.events.length<=66);
 require(keys(w.initial,'model checks hint')&&keys(w.probe,'model checks hint')&&keys(w.explanation,'attempts hint'));
 const replay=newAssignedWorkshop(s.assignment);
 for(const event of w.events){
  if(event?.type==='check'){
   require(keys(event,'type phase model correct')&&event.phase===replay.phase&&['build','verify'].includes(event.phase));
   const key=workshopPhaseKey(replay),m=assignedWorkshopMission(replay);
   require(workshopModelShape(m,event.model)&&event.correct===workshopModelCorrect(m,event.model));replay[key].model=clone(event.model);
   require(applyAssignedWorkshopAction(replay,{type:'check'}));
  }else if(event?.type==='hint'){
   require(keys(event,'type phase')&&event.phase===replay.phase);require(applyAssignedWorkshopAction(replay,{type:'hint'}));
  }else if(event?.type==='continue'){
   require(keys(event,'type phase')&&event.phase===replay.phase);require(applyAssignedWorkshopAction(replay,{type:'continue'}));
  }else if(event?.type==='reason'){
   require(keys(event,'type value'));require(applyAssignedWorkshopAction(replay,{type:'reason',value:event.value}));
  }else throw Error('Acción constructiva desconocida.');
 }
 const key=workshopPhaseKey(replay);
 if(key==='initial'||key==='probe'){
  require(workshopModelShape(assignedWorkshopMission(replay),w[key].model));
  if(replay[key].checks.length>=20)require(same(w[key].model,replay[key].model));
  replay[key].model=clone(w[key].model);
 }
 replay.note=w.note;require(same(w,replay),'Las fases, modelos y ayudas no coinciden con su secuencia.');
 require(pending||w.phase==='review','Faltan fases requeridas antes de entregar.');
 return true;
}
export function workshopEvidence(s){
 const w=s.workshop,summary=part=>({checks:part.checks.length,first:part.checks[0]?.correct??null,final:part.checks.at(-1)?.correct??null,hint:part.hint,
  firstWithoutHint:part.checks.length>0&&part.checks[0].correct&&!w.events.slice(0,w.events.findIndex(e=>e.type==='check'&&e.phase===(part===w.initial?'build':'verify'))).some(e=>e.type==='hint'&&e.phase===(part===w.initial?'build':'verify'))});
 return {kind:'construction',initial:summary(w.initial),probe:summary(w.probe),explanation:{attempts:w.explanation.attempts.length,first:w.explanation.attempts.length?w.explanation.attempts[0]===w.content.initial.reason:null,final:w.explanation.attempts.length?w.explanation.attempts.at(-1)===w.content.initial.reason:null,hint:w.explanation.hint},notes:w.note.trim()?1:0};
}
