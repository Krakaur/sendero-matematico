// C11 is a new, server-authoritative condition. Do not reinterpret room protocol 1.
export const LIVE_SCHEMA = 'sendero.live-room.v1';
export const LIVE_RECORD = 'sendero.cloud-participation.v1';
export const LIVE_CONDITION = 'cloud-race-ws-v1';
export const LIVE_CONTENT = 'cloud-arithmetic-fixed@1';
export const LIVE_NAMES = Object.freeze(['Luma','Nube','Rayo','Chispa']);
export const LIVE_LIMITS = Object.freeze({players:4,items:8,ttl:1200000,lease:9000,heartbeat:3000,countdown:2100,actions:64,frames:512,roomFrames:2048,connections:8,frameBytes:2048,stateBytes:131072,stateSoftBytes:114688,recordBytes:32768,alarms:512,recoveryRooms:8,recoveryBytes:131072,recoveryTtl:86400000});
export const isServerLiveId=id=>typeof id==='string'&&id.startsWith('live-');
export const LIVE_RULES = Object.freeze({
  progression:'Un error queda registrado y no avanza. Corregir cierra el reto. Hay ocho retos y cuatro alternativas; cada alternativa sólo puede elegirse una vez. La pista es opcional y no muestra la solución.',
  cooperation:'El objetivo es que las cuatro personas resuelvan sus ocho retos. No hay clasificación. Completar exige corrección; no equivale a una tarea que permite entregar respuestas incorrectas.',
  race:'Carrera opcional: primero se ordenan los aciertos iniciales sin pista; después, menos errores; finalmente, el tiempo activo del servidor. Pedir pista puede cambiar esa posición. El podio no mide dominio ni el valor de una persona.',
  interruption:'Una interrupción técnica conserva las respuestas, detiene el tiempo común y elimina el podio. Los cuatro confirman antes de continuar. El tiempo incluye la red y no es tiempo cognitivo aislado.',
  chance:'Elegir por descarte o acertar por azar sigue siendo posible. Los errores no producen progreso y la rapidez errónea no decide el resultado.'
});
export class LiveError extends Error { constructor(code,status=400){super(code);this.code=code;this.status=status;} }
export const liveAssert=(ok,code='invalid_live_request',status=400)=>{if(!ok)throw new LiveError(code,status);};
export const liveId=x=>typeof x==='string'&&/^[A-Za-z0-9-]{1,80}$/.test(x);
export const liveCanonical=x=>JSON.stringify(canon(x));
function canon(x){return Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;}
export const liveBytes=x=>new TextEncoder().encode(typeof x==='string'?x:JSON.stringify(x)).byteLength;
export function liveShape(x,keys,optional=[]){liveAssert(x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>keys.includes(k)||optional.includes(k))&&keys.every(k=>Object.hasOwn(x,k)),'shape');return x;}
const integer=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(Date.parse(x)).toISOString()===x;
export function validateLiveConfig(c){liveShape(c,['trail','level','circuit','mode']);liveAssert(['suma','resta','multi','tablas20'].includes(c.trail)&&integer(c.level,1,4)&&['bosque','islas','cascada'].includes(c.circuit)&&['race','coop'].includes(c.mode),'config');return c;}
function rng(seed){let n=seed>>>0;return()=>{n=(n+0x6d2b79f5)>>>0;let t=Math.imul(n^(n>>>15),n|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
// Frozen version 1 generator; future changes require another content/condition version.
export function liveDeck(config,seed){
  validateLiveConfig(config);liveAssert(integer(seed,0,4294967295),'seed');
  const random=rng(seed),seen=new Set(),deck=[];
  for(let i=0;i<8;i++){
    let a,b,key;
    const maximum=(config.trail==='suma'||config.trail==='resta'?[10,20,50,100]:config.trail==='tablas20'?[5,10,15,20]:[3,5,8,12])[config.level-1];
    for(let tries=0;tries<100;tries++){a=1+Math.floor(random()*maximum);b=1+Math.floor(random()*maximum);if(config.trail==='resta'&&b>a)[a,b]=[b,a];key=`${a}:${b}`;if(!seen.has(key))break;}
    seen.add(key);const op=config.trail==='suma'?'+':config.trail==='resta'?'−':'×',answer=op==='+'?a+b:op==='−'?a-b:a*b;
    const choices=new Set([answer]);for(const value of [answer+1,Math.max(0,answer-1),answer+2,answer+3]){choices.add(value);if(choices.size===4)break;}
    const options=[...choices];for(let j=3;j>0;j--){const k=Math.floor(random()*(j+1));[options[j],options[k]]=[options[k],options[j]];}
    deck.push({id:`cloud1-${i+1}`,a,b,prompt:`${a} ${op} ${b}`,answer,options,hint:op==='+'?'Puedes reunir las dos cantidades por partes.':op==='−'?'Puedes contar la distancia entre las cantidades.':'Puedes organizar grupos iguales y sumar sus cantidades.'});
  }
  return deck;
}
export function liveItem(room,seat,index){const q=structuredClone(room.deck[index]),shift=(seat+index)%4;q.options=q.options.slice(shift).concat(q.options.slice(0,shift));return q;}
export function newLiveRoom({id,classroom,config,seed,at}){
  liveAssert(liveId(id)&&liveId(classroom)&&integer(at,0,Number.MAX_SAFE_INTEGER),'room');validateLiveConfig(config);
  return {schema:LIVE_SCHEMA,id,classroom,condition:LIVE_CONDITION,contentVersion:LIVE_CONTENT,config:structuredClone(config),seed,deck:liveDeck(config,seed),status:'lobby',version:0,presenceVersion:0,epoch:0,createdAt:at,expiresAt:at+LIVE_LIMITS.ttl,clock:at,startedAt:null,startAt:null,runAt:null,elapsedMs:0,terminalAt:null,terminalReason:null,locked:false,rankEligible:true,pauseIntervals:[],members:[],receipts:[],frames:0,alarmCount:0};
}
export function liveClock(room,at){liveAssert(integer(at,0,Number.MAX_SAFE_INTEGER),'clock');room.clock=Math.max(room.clock,at);return room.clock;}
export const liveElapsed=(r,at=r.clock)=>Math.min(LIVE_LIMITS.ttl,r.elapsedMs+(r.status==='running'?Math.max(0,at-r.runAt):0));
export function livePause(r,reason,at,technical=true){
  if(['completed','expired'].includes(r.status))return false;
  at=Math.max(r.runAt??r.createdAt,Math.min(at,r.clock));
  if(r.status==='running')r.elapsedMs=liveElapsed(r,at);
  if(['running','countdown','ready'].includes(r.status)||r.locked){
    if(r.status!=='paused')r.pauseIntervals.push({reason,effectiveAt:at,detectedAt:r.clock,resumedAt:null,technical});
    r.status='paused';r.runAt=null;r.startAt=null;if(technical)r.rankEligible=false;
  }
  r.members.forEach(p=>{p.ready=false;});r.version++;return true;
}
export function expireLiveRoom(r,reason,at){
  if(['completed','expired'].includes(r.status))return false;
  const time=liveClock(r,at);if(r.status==='running')r.elapsedMs=liveElapsed(r,Math.min(time,r.expiresAt));
  r.status='expired';r.terminalAt=time;r.terminalReason=reason;r.rankEligible=false;r.runAt=null;r.startAt=null;r.members.forEach(p=>p.ready=false);r.version++;return true;
}
export function reconcileLiveRoom(r,at){
  const time=liveClock(r,at);if(['completed','expired'].includes(r.status))return;
  const missing=r.members.filter(p=>p.socketId&&p.leaseUntil<=Math.min(time,r.expiresAt));
  if(missing.length){const effective=Math.min(...missing.map(p=>p.leaseUntil));missing.forEach(p=>{p.socketId=null;p.ready=false;});r.presenceVersion++;livePause(r,'connection',effective,true);}
  if(time>=r.expiresAt){expireLiveRoom(r,'lifetime',time);return;}
  if(r.status==='countdown'&&time>=r.startAt){r.status='running';r.runAt=r.startAt;r.startedAt??=r.startAt;r.pauseIntervals.filter(x=>x.resumedAt===null).forEach(x=>x.resumedAt=r.startAt);r.startAt=null;r.version++;}
}
export function joinLiveRoom(r,principal,at){
  reconcileLiveRoom(r,at);liveAssert(principal.classroom===r.classroom&&principal.role==='student'&&liveId(principal.profile),'membership',403);
  const old=r.members.find(p=>p.profile===principal.profile);if(old)return old;
  liveAssert(!r.locked&&!['completed','expired'].includes(r.status)&&r.members.length<4,'room_full_or_locked',409);
  const p={profile:principal.profile,seat:r.members.length,accessHash:principal.hash,alias:LIVE_NAMES[r.members.length],generation:0,socketId:null,leaseUntil:0,ready:false,index:0,seatVersion:0,nextSeq:1,frames:0,connections:0,connectTimes:[],rateAt:r.clock,rateTokens:4,rateViolations:0,lastAnswerAt:-1000,finishedMs:null,questions:Array.from({length:8},()=>({events:[],closedAt:null,closedActiveMs:null}))};
  r.members.push(p);r.version++;return p;
}
export function ownLiveMember(r,principal){liveAssert(principal?.classroom===r.classroom&&principal.role==='student','membership',403);const p=r.members.find(p=>p.profile===principal.profile);liveAssert(p,'membership',403);return p;}
export function connectLiveMember(r,principal,socketId,generation,at){
  reconcileLiveRoom(r,at);const p=ownLiveMember(r,principal);
  liveAssert(!['completed','expired'].includes(r.status),'room_closed',409);liveAssert(generation===p.generation,'connection_generation',409);
  liveAssert(!p.socketId,'socket_owned',409);liveAssert(p.connections<LIVE_LIMITS.connections,'connection_limit',429);
  p.connectTimes=p.connectTimes.filter(t=>t>r.clock-60000);liveAssert(p.connectTimes.length<2,'connection_rate',429);
  p.connectTimes.push(r.clock);p.connections++;p.socketId=socketId;p.accessHash=principal.hash;p.leaseUntil=r.clock+LIVE_LIMITS.lease;p.ready=false;r.presenceVersion++;
  if(!r.locked&&r.members.length===4)r.status='ready';return p;
}
export function transferLiveMember(r,principal,at){reconcileLiveRoom(r,at);const p=ownLiveMember(r,principal);liveAssert(!['completed','expired'].includes(r.status),'room_closed',409);livePause(r,'transfer',r.clock,true);p.generation++;p.socketId=null;p.leaseUntil=0;p.accessHash=principal.hash;p.ready=false;r.presenceVersion++;return p;}
export function disconnectLiveMember(r,principal,socketId,at,reason='connection'){
  reconcileLiveRoom(r,at);const p=ownLiveMember(r,principal);if(p.socketId!==socketId)return false;p.socketId=null;p.leaseUntil=0;p.ready=false;r.presenceVersion++;livePause(r,reason,r.clock,true);return true;
}
export function countLiveFrame(r,principal,socketId,at){
  reconcileLiveRoom(r,at);const p=ownLiveMember(r,principal);liveAssert(p.socketId===socketId&&p.generation===principal.generation,'socket_owner',403);
  r.frames++;p.frames++;if(r.frames>LIVE_LIMITS.roomFrames||p.frames>LIVE_LIMITS.frames){expireLiveRoom(r,'message_limit',r.clock);throw new LiveError('message_limit',429);}
  p.rateTokens=Math.min(4,p.rateTokens+Math.max(0,r.clock-p.rateAt)/500);p.rateAt=r.clock;
  if(p.rateTokens<1){p.rateViolations++;if(p.rateViolations>=3)disconnectLiveMember(r,principal,socketId,r.clock,'rate_limit');throw new LiveError('message_rate',429);}
  p.rateTokens-=1;return p;
}
export function heartbeatLiveRoom(r,principal,socketId,at){reconcileLiveRoom(r,at);const p=ownLiveMember(r,principal);liveAssert(p.socketId===socketId&&p.generation===principal.generation,'socket_owner',403);liveAssert(!['completed','expired'].includes(r.status),'room_closed',409);p.leaseUntil=r.clock+LIVE_LIMITS.lease;r.presenceVersion++;}
export function validateLiveEnvelope(e){
  liveShape(e,['schema','roomId','epoch','connectionGeneration','clientSeq','actionId','expectedVersion','expectedSeatVersion','action']);
  liveAssert(e.schema===LIVE_SCHEMA&&liveId(e.roomId)&&liveId(e.actionId)&&integer(e.epoch,0,1000)&&integer(e.connectionGeneration,0,1000)&&integer(e.clientSeq,1,64)&&integer(e.expectedVersion,0,100000)&&integer(e.expectedSeatVersion,0,64)&&liveBytes(e)<=LIVE_LIMITS.frameBytes,'envelope');
  if(e.action?.type==='answer'){liveShape(e.action,['type','questionId','questionIndex','choiceIndex']);liveAssert(liveId(e.action.questionId)&&integer(e.action.questionIndex,0,7)&&integer(e.action.choiceIndex,0,3),'answer');}
  else if(e.action?.type==='hint'){liveShape(e.action,['type','questionId','questionIndex']);liveAssert(liveId(e.action.questionId)&&integer(e.action.questionIndex,0,7),'hint');}
  else if(e.action?.type==='ready'){liveShape(e.action,['type','value']);liveAssert(typeof e.action.value==='boolean','ready');}
  else if(e.action?.type==='pause'){liveShape(e.action,['type','reason']);liveAssert(['requested','hidden'].includes(e.action.reason),'pause');}
  else throw new LiveError('action_type');return e;
}
export function liveAction(r,principal,socketId,e,payloadHash,at){
  validateLiveEnvelope(e);liveAssert(e.roomId===r.id,'room',403);const p=ownLiveMember(r,principal);
  // Authorization and ownership precede receipt lookup; a valid new socket may recover its own old receipt.
  liveAssert(p.socketId===socketId&&p.generation===principal.generation&&p.accessHash===principal.hash,'socket_owner',403);
  const existing=r.receipts.find(x=>x.actionId===e.actionId);
  if(existing){liveAssert(existing.seat===p.seat&&existing.profile===p.profile&&existing.roomId===r.id,'receipt_owner',403);liveAssert(existing.payloadHash===payloadHash,'action_conflict',409);return structuredClone(existing.ack);}
  liveAssert(e.clientSeq===p.nextSeq,'sequence',409);liveAssert(p.nextSeq<=64,'action_limit',429);
  reconcileLiveRoom(r,at);const observed=r.version;
  let code='accepted';
  try{
    liveAssert(!['completed','expired'].includes(r.status),'room_closed',409);
    liveAssert(e.connectionGeneration===p.generation&&e.epoch===r.epoch,'stale_epoch',409);
    liveAssert(p.socketId===socketId&&p.leaseUntil>r.clock,'connection',409);
    liveAssert(e.expectedVersion<=r.version&&e.expectedSeatVersion===p.seatVersion,'version',409);
    const a=e.action;
    if(a.type==='ready'){
      liveAssert(['lobby','ready','paused'].includes(r.status)&&e.expectedVersion===r.version,'state_changed',409);p.ready=a.value;r.version++;
      if(r.members.length===4&&r.members.every(m=>m.ready&&m.socketId&&m.leaseUntil>r.clock)){
        r.locked=true;r.epoch++;r.status='countdown';r.startAt=r.clock+LIVE_LIMITS.countdown;r.version++;
      }
    }else if(a.type==='pause'){
      liveAssert(e.expectedVersion===r.version,'state_changed',409);livePause(r,a.reason,r.clock,true);
    }else{
      liveAssert(r.status==='running'&&p.index<8,'not_running',409);
      liveAssert(a.questionIndex===p.index&&a.questionId===r.deck[p.index].id,'question_changed',409);
      const q=p.questions[p.index],item=liveItem(r,p.seat,p.index);
      if(a.type==='hint'){
        liveAssert(!q.events.some(x=>x.type==='hint'),'hint_already_shown',409);q.events.push({type:'hint',at:r.clock,activeMs:liveElapsed(r),text:item.hint,version:LIVE_CONTENT});
      }else{
        liveAssert(r.clock-p.lastAnswerAt>=140,'answer_rate',429);liveAssert(!q.events.some(x=>x.type==='answer'&&x.choice===a.choiceIndex),'choice_repeated',409);
        const value=item.options[a.choiceIndex],correct=value===item.answer;q.events.push({type:'answer',choice:a.choiceIndex,value,correct,at:r.clock,activeMs:liveElapsed(r)});p.lastAnswerAt=r.clock;
        if(correct){q.closedAt=r.clock;q.closedActiveMs=liveElapsed(r);p.index++;if(p.index===8)p.finishedMs=liveElapsed(r);}
      }
      p.seatVersion++;r.version++;
      if(r.members.every(m=>m.index===8)){r.elapsedMs=liveElapsed(r);r.status='completed';r.terminalAt=r.clock;r.terminalReason='all_correct';r.runAt=null;r.version++;}
    }
  }catch(error){if(!(error instanceof LiveError))throw error;code=error.code;}
  const ack={actionId:e.actionId,clientSeq:e.clientSeq,code,committed:code==='accepted',observedVersion:observed,committedVersion:r.version,at:r.clock};
  r.receipts.push({roomId:r.id,profile:p.profile,seat:p.seat,actionId:e.actionId,payloadHash,ack});p.nextSeq++;
  return structuredClone(ack);
}
export function liveMetrics(p){
  const answers=p.questions.map(q=>q.events.filter(e=>e.type==='answer'));
  return {planned:8,responded:answers.filter(a=>a.length).length,correctFinal:p.questions.filter(q=>q.closedAt!==null).length,firstCorrect:answers.filter(a=>a[0]?.correct).length,firstIndependent:p.questions.filter((q,i)=>answers[i][0]?.correct&&!q.events.slice(0,q.events.indexOf(answers[i][0])).some(e=>e.type==='hint')).length,errors:answers.flat().filter(a=>!a.correct).length,hints:p.questions.filter(q=>q.events.some(e=>e.type==='hint')).length};
}
export function liveRanking(r){
  if(r.config.mode!=='race'||r.status!=='completed'||!r.rankEligible)return [];
  const rows=r.members.map(p=>({seat:p.seat,alias:p.alias,...liveMetrics(p),finishedMs:p.finishedMs})).sort((a,b)=>b.firstIndependent-a.firstIndependent||a.errors-b.errors||a.finishedMs-b.finishedMs||a.seat-b.seat);
  let anchor=null;for(let i=0;i<rows.length;i++){const x=rows[i];if(anchor&&x.firstIndependent===anchor.firstIndependent&&x.errors===anchor.errors&&x.finishedMs-anchor.finishedMs<=1000)x.place=anchor.place;else{x.place=i+1;anchor=x;}}
  return rows;
}
export function liveSnapshot(r,principal){
  const teacher=principal?.role==='teacher'&&principal.classroom===r.classroom,p=teacher?null:ownLiveMember(r,principal);
  const result={schema:LIVE_SCHEMA,id:r.id,condition:r.condition,contentVersion:r.contentVersion,config:structuredClone(r.config),status:r.status,version:r.version,presenceVersion:r.presenceVersion,epoch:r.epoch,serverNow:r.clock,expiresAt:r.expiresAt,startAt:r.startAt,elapsedMs:liveElapsed(r),rankEligible:r.rankEligible,terminalReason:r.terminalReason,pauseReason:r.pauseIntervals.at(-1)?.reason||null,players:r.members.map(m=>({seat:m.seat,name:m.alias,index:m.index,ready:m.ready,connected:!!m.socketId&&m.leaseUntil>r.clock})),ranking:liveRanking(r).map(x=>teacher?x:({seat:x.seat,alias:x.alias,place:x.place}))};
  // Initial questions are never sent before the common server clock starts.
  // Pauses hide them too: a subsequent question must not leak after the last commit.
  if(p){result.self={seat:p.seat,generation:p.generation,nextSeq:p.nextSeq,seatVersion:p.seatVersion,metrics:liveMetrics(p)};if(p.index<8&&r.status==='running'){const item=liveItem(r,p.seat,p.index),events=p.questions[p.index].events;result.question={id:item.id,index:p.index,prompt:item.prompt,options:item.options,chosen:events.filter(e=>e.type==='answer').map(e=>e.choice),hint:events.some(e=>e.type==='hint')?item.hint:null,lastCorrect:events.filter(e=>e.type==='answer').at(-1)?.correct??null};}}
  else result.teacher=true;liveAssert(liveBytes(result)<=16384,'snapshot_size',413);return result;
}
export function liveParticipation(r,p){
  liveAssert(['completed','expired'].includes(r.status),'not_terminal',409);
  const record={schema:LIVE_RECORD,id:`live-${r.id}-s${p.seat}-v1`,roomId:r.id,profile:p.profile,seat:p.seat,alias:p.alias,condition:LIVE_CONDITION,contentVersion:LIVE_CONTENT,mode:r.config.mode,trail:r.config.trail,level:r.config.level,circuit:r.config.circuit,seed:r.seed,participants:r.members.length,startedAt:r.startedAt===null?null:new Date(r.startedAt).toISOString(),completedAt:new Date(r.terminalAt).toISOString(),status:p.index===8?'complete':'partial',roomStatus:r.status,terminalReason:r.terminalReason,finishedMs:p.finishedMs,activeElapsedMs:r.elapsedMs,rankEligible:r.rankEligible&&r.status==='completed'&&r.config.mode==='race',pauseIntervals:structuredClone(r.pauseIntervals),questions:p.questions.map((q,i)=>({item:liveItem(r,p.seat,i),...structuredClone(q)})),metrics:liveMetrics(p)};
  validateLiveParticipation(record);return record;
}
export function validateLiveParticipation(r){
  liveShape(r,['schema','id','roomId','profile','seat','alias','condition','contentVersion','mode','trail','level','circuit','seed','participants','startedAt','completedAt','status','roomStatus','terminalReason','finishedMs','activeElapsedMs','rankEligible','pauseIntervals','questions','metrics']);
  liveAssert(r.schema===LIVE_RECORD&&liveId(r.roomId)&&liveId(r.profile)&&integer(r.seat,0,3)&&r.alias===LIVE_NAMES[r.seat]&&r.id===`live-${r.roomId}-s${r.seat}-v1`&&r.condition===LIVE_CONDITION&&r.contentVersion===LIVE_CONTENT,'record');
  const config={trail:r.trail,level:r.level,circuit:r.circuit,mode:r.mode},room={deck:liveDeck(config,r.seed)};
  liveAssert(integer(r.participants,1,4)&&r.seat<r.participants&&['complete','partial'].includes(r.status)&&['completed','expired'].includes(r.roomStatus)&&['all_correct','lifetime','teacher_closed','message_limit','alarm_limit','action_limit','state_limit'].includes(r.terminalReason)&&typeof r.rankEligible==='boolean'&&integer(r.activeElapsedMs,0,LIVE_LIMITS.ttl)&&iso(r.completedAt)&&(r.startedAt===null||iso(r.startedAt)),'record_metadata');
  liveAssert(Array.isArray(r.questions)&&r.questions.length===8&&Array.isArray(r.pauseIntervals)&&r.pauseIntervals.length<=64,'record_evidence');
  liveAssert(r.startedAt===null||Date.parse(r.startedAt)<=Date.parse(r.completedAt),'start_time');
  liveAssert(r.roomStatus!=='completed'||r.terminalReason==='all_correct','terminal_reason');
  let closed=0,lastAt=r.startedAt===null?0:Date.parse(r.startedAt),lastActive=0;
  for(let i=0;i<8;i++){
    const q=r.questions[i];liveShape(q,['item','events','closedAt','closedActiveMs']);liveAssert(liveCanonical(q.item)===liveCanonical(liveItem(room,r.seat,i))&&Array.isArray(q.events)&&q.events.length<=5,'item');
    if(r.startedAt===null)liveAssert(q.events.length===0,'not_started');
    let done=false,hint=false;const choices=new Set();
    if(i>closed)liveAssert(q.events.length===0,'future_item');
    for(const e of q.events){
      liveAssert(!done&&integer(e.at,lastAt,Date.parse(r.completedAt))&&integer(e.activeMs,lastActive,r.activeElapsedMs),'event_time');lastAt=e.at;lastActive=e.activeMs;
      if(e.type==='hint'){liveShape(e,['type','at','activeMs','text','version']);liveAssert(!hint&&e.text===q.item.hint&&e.version===LIVE_CONTENT,'hint');hint=true;}
      else {liveShape(e,['type','choice','value','correct','at','activeMs']);liveAssert(e.type==='answer'&&integer(e.choice,0,3)&&!choices.has(e.choice)&&e.value===q.item.options[e.choice]&&e.correct===(e.value===q.item.answer),'answer');choices.add(e.choice);done=e.correct;}
    }
    if(done){liveAssert(i===closed&&q.closedAt===q.events.at(-1).at&&q.closedActiveMs===q.events.at(-1).activeMs,'closure');closed++;}
    else liveAssert(q.closedAt===null&&q.closedActiveMs===null,'closure');
  }
  let lastPause=0;for(const p of r.pauseIntervals){liveShape(p,['reason','effectiveAt','detectedAt','resumedAt','technical']);liveAssert(typeof p.reason==='string'&&p.reason.length<=40&&integer(p.effectiveAt,lastPause,Date.parse(r.completedAt))&&integer(p.detectedAt,p.effectiveAt,Date.parse(r.completedAt))&&(p.resumedAt===null||integer(p.resumedAt,p.effectiveAt,Date.parse(r.completedAt)))&&typeof p.technical==='boolean','pause');lastPause=p.effectiveAt;}
  liveAssert((r.status==='complete')===(closed===8)&&(r.finishedMs===null?closed<8:r.finishedMs===r.questions[7].closedActiveMs)&&(r.roomStatus!=='completed'||(r.participants===4&&closed===8))&&(!r.rankEligible||(r.mode==='race'&&r.roomStatus==='completed'&&!r.pauseIntervals.some(p=>p.technical))),'completion');
  liveAssert(liveCanonical(r.metrics)===liveCanonical(liveMetrics({questions:r.questions}))&&liveBytes(r)<=LIVE_LIMITS.recordBytes,'metrics_or_size');return r;
}
