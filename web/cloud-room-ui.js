import {validateLiveParticipation} from './cloud-room-contract.js';
import {csvCell} from './enrollment.js';

// Heartbeats update the confirmed clock, not the identity of interactive DOM.
export function cloudViewKey(snapshot,{records=[],current=null,role='',reduced=false,connected=false}={}){
  if(!snapshot)return JSON.stringify({role,current});
  const {serverNow,elapsedMs,presenceVersion,version,...visible}=snapshot;
  if(visible.self){const {generation,nextSeq,seatVersion,...self}=visible.self;visible.self=self;}
  return JSON.stringify({snapshot:visible,records,reduced,connected});
}
export function cloudArchiveState(snapshot,entries=[]){
  const players=Array.isArray(snapshot?.players)?snapshot.players:[];
  const seats=new Map(players.map(p=>[p.seat,p])),seen=new Set(),profiles=new Set(),received=new Set();
  let invalid=seats.size===players.length?0:1;
  for(const entry of entries){
    const r=entry?.record;
    try{validateLiveParticipation(r);}catch{invalid++;continue;}
    const player=seats.get(r.seat);
    const sameConfig=['mode','trail','level','circuit'].every(key=>r[key]===snapshot?.config?.[key]);
    if(r.roomId!==snapshot?.id||r.participants!==seats.size||r.roomStatus!==snapshot?.status||
      r.condition!==snapshot?.condition||r.contentVersion!==snapshot?.contentVersion||!sameConfig||
      r.terminalReason!==snapshot?.terminalReason||r.activeElapsedMs!==snapshot?.elapsedMs||
      !player||r.alias!==player.name||r.metrics.correctFinal!==player.index||
      seen.has(r.seat)||profiles.has(r.profile)){invalid++;continue;}
    seen.add(r.seat);profiles.add(r.profile);
    if(entry.delivery==='received')received.add(r.seat);
  }
  return {expected:seats.size,received:received.size,invalid,
    complete:seats.size>0&&received.size===seats.size&&invalid===0};
}
export function cloudFocusIdentity(root){
  const el=root.ownerDocument.activeElement;
  if(!el||!root.contains(el))return null;
  const question=root.querySelector('[data-cloud-question]')?.dataset.cloudQuestion;
  if(el.dataset.cloudChoice!==undefined)return {choice:el.dataset.cloudChoice,question};
  if(el.id)return {id:el.id,question};
  if(el.name&&el.closest('#cloud-create-form'))return {name:el.name};
  if(el.tagName==='SUMMARY'&&el.parentElement.dataset.cloudDetail)return {detail:el.parentElement.dataset.cloudDetail};
  return null;
}
export function captureCloudUI(root){
  return {
    focus:cloudFocusIdentity(root),
    fields:[...root.querySelectorAll('#cloud-create-form [name]')].map(el=>[el.name,el.value]),
    details:[...root.querySelectorAll('details[data-cloud-detail][open]')].map(el=>el.dataset.cloudDetail)
  };
}
export function restoreCloudUI(root,saved,{focus=true}={}){
  for(const [name,value] of saved.fields||[]){
    const el=[...root.querySelectorAll('#cloud-create-form [name]')].find(x=>x.name===name);
    if(el&&[...el.options].some(x=>x.value===value))el.value=value;
  }
  for(const el of root.querySelectorAll('details[data-cloud-detail]'))el.open=(saved.details||[]).includes(el.dataset.cloudDetail);
  if(focus)restoreCloudFocus(root,saved.focus);
}
export function restoreCloudFocus(root,key){
  if(!key)return;
  const question=root.querySelector('[data-cloud-question]')?.dataset.cloudQuestion;
  let el=null;
  if(key.choice!==undefined){
    if(question===key.question)el=[...root.querySelectorAll('[data-cloud-choice]')].find(x=>x.dataset.cloudChoice===key.choice);
    if(!el||el.disabled)el=root.querySelector('#cloud-question-title')||root.querySelector('#cloud-room-title');
  }else if(key.id){
    el=[...root.querySelectorAll('[id]')].find(x=>x.id===key.id);
    if(!el||el.disabled||(key.id==='cloud-hint'&&question!==key.question))el=root.querySelector('#cloud-question-title')||root.querySelector('#cloud-room-title');
  }else if(key.name)el=[...root.querySelectorAll('#cloud-create-form [name]')].find(x=>x.name===key.name);
  else if(key.detail)el=[...root.querySelectorAll('details[data-cloud-detail]')].find(x=>x.dataset.cloudDetail===key.detail)?.querySelector('summary');
  if(el&&!el.disabled)el.focus({preventScroll:true});
}
const text=(root,selector,value)=>{const el=root.querySelector(selector);if(el&&el.textContent!==value)el.textContent=value;};
const disable=(el,value)=>{if(el&&el.disabled!==!!value)el.disabled=!!value;};
export function patchCloudUI(root,{snapshot,message='',pending=null,connected=false,busy=false}={}){
  text(root,'#cloud-message',message||'Se muestran los avances confirmados.');
  if(snapshot)text(root,'#cloud-clock',(snapshot.elapsedMs/1000).toFixed(1));
  const action=pending?.action?.type;
  const pendingText=pending?(action==='answer'?'Respuesta pendiente de confirmación del servidor.':'Acción pendiente de confirmación del servidor.')+(connected?' Espera antes de intentar otra acción.':' La conexión está detenida; reconecta para recuperar el acuse.'):'';
  text(root,'#cloud-pending',pendingText);
  const pendingEl=root.querySelector('#cloud-pending');if(pendingEl)pendingEl.hidden=!pending;
  const console=root.querySelector('[data-cloud-question]');if(console)console.setAttribute('aria-busy',pending?'true':'false');
  if(snapshot){
    const q=snapshot.question,canAnswer=!!snapshot.self&&connected&&snapshot.status==='running'&&!pending&&!busy;
    for(const el of root.querySelectorAll('[data-cloud-choice]'))disable(el,!canAnswer||q?.chosen.includes(Number(el.dataset.cloudChoice)));
    disable(root.querySelector('#cloud-hint'),!canAnswer);
    disable(root.querySelector('#cloud-ready'),!connected||!!pending||busy);
    disable(root.querySelector('#cloud-pause'),!connected||!!pending||busy||!['running','countdown','ready'].includes(snapshot.status));
  }
  for(const id of ['cloud-discover','cloud-enter','cloud-teacher-refresh','cloud-close-room','cloud-archive','cloud-csv','cloud-reconnect','cloud-transfer'])disable(root.querySelector('#'+id),busy);
  for(const el of root.querySelectorAll('#cloud-create-form button'))disable(el,busy);
}
export function cloudKeyChoice(event){
  if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.isComposing||
    event.target?.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(event.target?.tagName))return null;
  const index=['1','2','3','4'].indexOf(event.key);return index<0?null:index;
}
export function cloudRecordsCSV(entries,{source='imported',roomId=null,serviceOrigin=''}={}){
  if(!['server-read','imported'].includes(source))throw Error('Procedencia de exportación no admitida.');
  if(!entries.length)throw Error('Todavía no hay participaciones para exportar.');
  const origin=source==='server-read'&&serviceOrigin?new URL(serviceOrigin).origin:'';
  const ids=new Set();
  const records=entries.map(entry=>{
    const r=validateLiveParticipation(entry.record);
    if(ids.has(r.id)||(roomId!==null&&r.roomId!==roomId))throw Error('La exportación contiene registros duplicados o de otra sala.');
    ids.add(r.id);return {r,delivery:source==='server-read'?(entry.delivery==='received'?'received':'pending'):'unverified'};
  });
  const headers=['export_schema','source','source_scope','service_origin','delivery','record_schema','record_id','room_id','profile','seat','alias','condition','content_version','mode','trail','level','circuit','seed','participants','started_at','completed_at','status','room_status','terminal_reason','active_elapsed_ms','finished_ms','rank_eligible','planned','responded','correct_final','first_correct','first_independent','hints','errors','questions_json','pause_intervals_json'];
  const rows=records.map(({r,delivery})=>['sendero.cloud-csv.v1',source,
    source==='server-read'?'authenticated classroom read; receipt is not teacher reading':'imported; server origin unverified',
    origin,delivery,r.schema,r.id,r.roomId,r.profile,r.seat,r.alias,r.condition,r.contentVersion,r.mode,r.trail,r.level,r.circuit,r.seed,r.participants,r.startedAt,r.completedAt,r.status,r.roomStatus,r.terminalReason,r.activeElapsedMs,r.finishedMs,r.rankEligible,r.metrics.planned,r.metrics.responded,r.metrics.correctFinal,r.metrics.firstCorrect,r.metrics.firstIndependent,r.metrics.hints,r.metrics.errors,JSON.stringify(r.questions),JSON.stringify(r.pauseIntervals)]);
  return [headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
