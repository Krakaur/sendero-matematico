import {LIVE_SCHEMA,LIVE_LIMITS,liveId,liveShape,liveBytes,liveCanonical,validateLiveEnvelope} from './cloud-room-contract.js';
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function validAck(ack,envelope){
  liveShape(ack,['actionId','clientSeq','code','committed','observedVersion','committedVersion','at']);
  if(ack.actionId!==envelope.actionId||ack.clientSeq!==envelope.clientSeq||typeof ack.code!=='string'||!/^\w{1,80}$/.test(ack.code)||typeof ack.committed!=='boolean'||ack.committed!==(ack.code==='accepted')||!integer(ack.observedVersion)||!integer(ack.committedVersion,ack.observedVersion)||!integer(ack.at))throw Error('El acuse no corresponde a la acción pendiente. Se conserva para revisión.');
  return ack;
}
const errors={live_disabled:'Las partidas de aula todavía no están habilitadas.',profile_required:'Vuelve a tu perfil y vincúlalo al aula antes de jugar.',socket_owned:'Este perfil ya tiene una conexión. Usa Continuar aquí para transferirla.',room_full_or_locked:'La sala ya está completa o comenzó. No se sustituyen participantes durante una partida.',live_daily_admissions:'Se alcanzó el límite diario de salas de prueba.',daily_budget:'Se alcanzó la cuota diaria. La conexión se detuvo.',revoked:'Este acceso al aula ya no está disponible.',ticket_rate:'Se alcanzó el límite de intentos de conexión. Espera antes de volver a intentarlo.',archive_pending:'La sala anterior espera el acuse de su informe. El docente puede revisar el archivo.'};
export function cloudAccessFromState(state){
  const c=state?.classroom;if(!c?.enabled||!['teacher','student'].includes(c.role)||typeof c.token!=='string'||!liveId(c.classId)||!liveId(state.profile))throw Error('Abre tu perfil vinculado al aula para usar esta modalidad.');
  const endpoint=new URL(c.endpoint);if(endpoint.protocol!=='https:'&&!(['localhost','127.0.0.1'].includes(endpoint.hostname)&&endpoint.protocol==='http:'))throw Error('El aula necesita una dirección segura.');
  return{endpoint:endpoint.origin,token:c.token,classroom:c.classId,role:c.role,profile:state.profile};
}
export class CloudRoomLink {
  constructor(access,{snapshot=()=>{},status=()=>{},receipt=()=>{},fetcher=(...args)=>globalThis.fetch(...args),Socket=globalThis.WebSocket,storage=globalThis.localStorage,accessCurrent=()=>true}={}){
    this.access=access;this.accessCurrent=accessCurrent;this.connectAttempt=0;this.onSnapshot=snapshot;this.onStatus=status;this.onReceipt=receipt;this.fetcher=fetcher;this.Socket=Socket;this.storage=storage;this.instanceId=crypto.randomUUID();this.ws=null;this.snapshot=null;this.roomId=null;this.pending=null;this.pendingKey=null;this.pendingSeat=null;this.pendingSources=[];this.connected=false;this.closed=false;this.timer=null;this.retryAt=0;this.frames=0;this.restored=false;
  }
  ensureAccess(){
    let valid=false;try{valid=this.accessCurrent(this.access)===true;}catch{}
    if(valid)return true;
    this.close();this.onStatus('El perfil se desvinculó o cambió su acceso. La sala dejó de enviar acciones; se conservan las respuestas y pendientes anteriores.');return false;
  }
  async request(path,data){
    if(!this.ensureAccess())throw Error('Vuelve a vincular el perfil antes de consultar la sala.');
    if(Date.now()<this.retryAt)throw Error('La cuota o la conexión requiere esperar antes del siguiente intento.');
    const response=await this.fetcher(this.access.endpoint+path,{method:data===undefined?'GET':'POST',headers:{Authorization:`Bearer ${this.access.token}`,...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)}),cache:'no-store'});
    let result;try{result=await response.json();}catch{throw Error('El aula no devolvió una respuesta válida.');}
    if(!response.ok){if([429,503].includes(response.status)){this.retryAt=Date.now()+Math.max(60,Number(response.headers.get('Retry-After'))||60)*1000;this.stopSocket();}const e=Error(errors[result.error]||`La operación no se confirmó (${result.error||response.status}).`);e.code=result.error;e.status=response.status;throw e;}
    return result;
  }
  async capabilities(){const result=await this.request('/capabilities');if(!result.features?.includes('classroom-live-websocket-v1'))throw Error(errors.live_disabled);return result;}
  async current(){await this.capabilities();if(this.access.role==='student')await this.recoverOutstanding();const result=await this.request('/live/rooms/current');return result.room;}
  async create(config){await this.capabilities();const result=await this.request('/live/rooms',{actionId:crypto.randomUUID(),config});this.roomId=result.roomId;return this.refreshTeacher();}
  async refreshTeacher(){const result=await this.request(`/live/rooms/${this.roomId}`);this.snapshot=result.snapshot;if(result.snapshot.self)await this.recoverRoom(this.roomId,result.snapshot.self.generation);this.onSnapshot(result.snapshot,result.records||[]);return result;}
  async connect(roomId,{transfer=false}={}){
    if(!liveId(roomId))throw Error('La sala no es válida.');this.stopSocket();this.closed=false;this.roomId=roomId;this.restored=false;this.frames=0;
    const attempt=++this.connectAttempt,stillCurrent=()=>!this.closed&&attempt===this.connectAttempt&&this.ensureAccess();
    const member=await this.request(`/live/rooms/${roomId}/join`,{actionId:crypto.randomUUID()});
    if(!stillCurrent())return;
    const owner=transfer?await this.request(`/live/rooms/${roomId}/transfer`,{actionId:crypto.randomUUID(),confirmTransfer:true}):member;
    if(!stillCurrent())return;
    const credential=await this.request(`/live/rooms/${roomId}/tickets`,{generation:owner.generation});
    if(!stillCurrent())return;
    const target=new URL(credential.socketUrl),base=new URL(this.access.endpoint);
    if(target.host!==base.host||target.pathname!=='/live/socket'||target.search||!['ws:','wss:'].includes(target.protocol)||!/^\w{64}$/.test(credential.ticket))throw Error('La dirección de conexión del aula no es válida.');
    if(base.protocol==='https:'&&target.protocol!=='wss:')throw Error('Se requiere una conexión cifrada.');
    const ws=new this.Socket(target.href,['sendero.live.v1',`ticket.${credential.ticket}`]);this.ws=ws;
    ws.onopen=()=>{this.onStatus('Conexión abierta; esperando confirmar mi asiento.');};
    ws.onmessage=event=>{if(this.ws!==ws||typeof event.data!=='string'||liveBytes(event.data)>65536)return;try{this.receive(JSON.parse(event.data));}catch(e){this.onStatus(e.message);this.stopSocket();}};
    ws.onerror=()=>{if(this.ws===ws)this.onStatus('La conexión no se confirmó. Puedes reconectar o transferir el perfil de forma explícita.');};
    ws.onclose=()=>{if(this.ws!==ws)return;this.connected=false;clearInterval(this.timer);this.timer=null;this.onStatus('Conexión cerrada. El servidor conserva los avances confirmados. Reconecta para continuar.');};
    this.onStatus('Conectando con el aula…');
  }
  key(generation,roomId=this.roomId){return `sendero.live.outbox.${roomId}.${this.access.profile}.${generation}`;}
  indexKey(){return `sendero.live.pending.${this.access.classroom}.${this.access.profile}`;}
  index(){
    const value=JSON.parse(this.storage.getItem(this.indexKey())||'[]');
    if(!Array.isArray(value)||value.length>8||value.some(x=>!liveId(x.roomId)||!Array.isArray(x.generations)||x.generations.length>9||x.generations.some(g=>!integer(g,0,1000))))throw Error('El índice de envíos pendientes necesita revisión; no se descartaron acciones.');
    const actual=value.map(room=>({...room,generations:room.generations.filter(g=>this.storage.getItem(this.key(g,room.roomId))!==null)})).filter(room=>room.generations.length);
    // An index write can precede a failed draft write. Prune absent keys, never extant drafts.
    if(JSON.stringify(actual)!==JSON.stringify(value))this.storage.setItem(this.indexKey(),JSON.stringify(actual));
    return actual;
  }
  register(roomId,generation){
    const index=this.index();let room=index.find(x=>x.roomId===roomId);
    if(!room){if(index.length>=8)throw Error('Conserva o revisa los envíos pendientes de otras salas antes de continuar.');room={roomId,generations:[]};index.push(room);}
    if(!room.generations.includes(generation)){if(room.generations.length>=9)throw Error('Se alcanzó el límite local de recuperaciones para esta sala.');room.generations.push(generation);}
    this.storage.setItem(this.indexKey(),JSON.stringify(index));
  }
  claims(roomId,generationHint){
    const generations=new Set(this.index().find(x=>x.roomId===roomId)?.generations||[]);
    // Compatibility with a pending draft saved before the bounded room index existed.
    if(integer(generationHint,0,1000))for(let g=generationHint;g>=Math.max(0,generationHint-8);g--)generations.add(g);
    const found=[];
    for(const generation of [...generations].sort((a,b)=>b-a)){
      const key=this.key(generation,roomId),raw=this.storage.getItem(key);if(!raw)continue;
      const saved=JSON.parse(raw);validateLiveEnvelope(saved.envelope);
      if(saved.envelope.roomId!==roomId||typeof saved.owner!=='string'||!integer(saved.savedAt)||saved.profile&&saved.profile!==this.access.profile||saved.classroom&&saved.classroom!==this.access.classroom)throw Error('Un envío local no corresponde al perfil o sala; se conserva para revisión.');
      found.push({key,raw,saved,generation});
    }
    return found;
  }
  forgetClaims(claims){
    for(const claim of claims)if(this.storage.getItem(claim.key)===claim.raw)this.storage.removeItem(claim.key);
    const index=this.index().map(room=>({...room,generations:room.generations.filter(g=>this.storage.getItem(this.key(g,room.roomId))!==null)})).filter(room=>room.generations.length);
    this.storage.setItem(this.indexKey(),JSON.stringify(index));
  }
  async recoverOutstanding(){
    const rooms=this.index();let unresolved=0;
    // At most one proof request per remembered room and eight per explicit discovery.
    for(const room of rooms){try{const result=await this.recoverRoom(room.roomId);if(result==='pending')unresolved++;}catch(e){if(e.status===401||e.status===403)throw e;unresolved++;}}
    if(unresolved)this.onStatus(`Hay ${unresolved} sala(s) con un envío todavía sin prueba suficiente. Se conserva en este dispositivo; no se reenviará a otra sala.`);
  }
  async recoverRoom(roomId,generationHint){
    const candidates=this.claims(roomId,generationHint).sort((a,b)=>a.saved.envelope.clientSeq-b.saved.envelope.clientSeq);if(!candidates.length)return 'empty';
    const envelope=candidates[0].saved.envelope,canonical=liveCanonical(envelope),claims=candidates.filter(x=>liveCanonical(x.saved.envelope)===canonical),expectedHash=await digest(canonical);
    const proof=await this.request(`/live/rooms/${roomId}/receipt`,{envelope});
    liveShape(proof,['schema','roomId','profile','seat','actionId','clientSeq','payloadHash','resolution','receipt','terminal','retainedUntil']);
    if(proof.schema!=='sendero.live-receipt.v1'||proof.roomId!==roomId||proof.profile!==this.access.profile||proof.actionId!==envelope.actionId||proof.clientSeq!==envelope.clientSeq||proof.payloadHash!==expectedHash||!integer(proof.seat,0,3)||claims.some(x=>x.saved.seat!==undefined&&x.saved.seat!==proof.seat)||!integer(proof.retainedUntil)||typeof proof.terminal!=='boolean'||!['receipt','not_committed','pending'].includes(proof.resolution))throw Error('La recuperación no coincide con el envío guardado. Se conserva sin confirmar.');
    if(proof.resolution==='pending'){if(proof.receipt!==null||proof.terminal)throw Error('La recuperación tiene un estado incoherente.');return 'pending';}
    if(proof.resolution==='receipt')validAck(proof.receipt,envelope);
    else if(!proof.terminal||proof.receipt!==null)throw Error('Falta la prueba del cierre de la sala.');
    this.forgetClaims(claims);
    if(this.pending&&liveCanonical(this.pending)===canonical){this.pending=null;this.pendingSources=[];}
    if(proof.receipt){this.onReceipt(proof.receipt);this.onStatus(proof.receipt.committed?'Se recuperó el acuse exacto de una acción anterior; no se aplicó dos veces.':`El servidor confirmó que la acción anterior fue rechazada (${proof.receipt.code}).`);}
    else this.onStatus('El servidor confirmó que esta acción no se registró antes del cierre. No se añade una respuesta ni un error matemático.');
    return proof.resolution;
  }
  restore(){
    if(this.restored||!this.snapshot?.self)return;this.restored=true;this.pendingKey=this.key(this.snapshot.self.generation);
    // Only a confirmed, exclusive socket reads/claims an outbox. Generations have separate keys.
    const claims=this.claims(this.roomId,this.snapshot.self.generation).filter(x=>x.saved.envelope.clientSeq<=this.snapshot.self.nextSeq).sort((a,b)=>a.saved.envelope.clientSeq-b.saved.envelope.clientSeq);
    if(!claims.length)return;
    this.pending=claims[0].saved.envelope;this.pendingSeat=this.snapshot.self.seat;this.pendingSources=claims.filter(x=>liveCanonical(x.saved.envelope)===liveCanonical(this.pending));
    if(this.pendingSources.some(x=>x.saved.seat!==undefined&&x.saved.seat!==this.pendingSeat))throw Error('El asiento del envío pendiente no coincide.');
    this.persist(true);this.onStatus('Recuperando el acuse de una acción pendiente…');this.sendFrame(this.pending);
  }
  persist(claim=false){
    if(!this.pendingKey)throw Error('El servidor todavía no confirmó el asiento.');
    try{
      const prior=JSON.parse(this.storage.getItem(this.pendingKey));if(prior&&prior.owner!==this.instanceId&&!claim)throw Error('ownership');
      this.register(this.roomId,this.snapshot.self.generation);
      const raw=JSON.stringify({owner:this.instanceId,savedAt:Date.now(),classroom:this.access.classroom,profile:this.access.profile,seat:this.pendingSeat,envelope:this.pending});this.storage.setItem(this.pendingKey,raw);
      if(this.storage.getItem(this.pendingKey)!==raw)throw Error('storage');
      this.pendingSources=this.pendingSources.filter(x=>x.key!==this.pendingKey);this.pendingSources.push({key:this.pendingKey,raw});
    }catch{throw Error('No se pudo conservar el envío pendiente con propiedad exclusiva en este dispositivo. No se envió la respuesta; revisa el almacenamiento antes de continuar.');}
  }
  clearPending(receipt,snapshot){
    if(!this.pending)return false;validAck(receipt,this.pending);
    if(snapshot.id!==this.pending.roomId||snapshot.self?.seat!==this.pendingSeat||!integer(snapshot.self.nextSeq,this.pending.clientSeq+1,65)||!integer(snapshot.self.generation,this.pending.connectionGeneration)||!integer(snapshot.version,receipt.committedVersion)||!integer(snapshot.serverNow,receipt.at))throw Error('El estado no confirma la identidad o secuencia del acuse. Se conserva el envío.');
    this.forgetClaims(this.pendingSources);this.pending=null;this.pendingSources=[];return true;
  }
  receive(message){
    if(message.type==='snapshot'||message.type==='ack'){
      const snapshot=message.snapshot;liveShape(snapshot,['schema','id','condition','contentVersion','config','status','version','presenceVersion','epoch','serverNow','expiresAt','startAt','elapsedMs','rankEligible','terminalReason','pauseReason','players','ranking'],['self','question','teacher']);
      if(snapshot.schema!==LIVE_SCHEMA||snapshot.id!==this.roomId||!snapshot.self||!Array.isArray(snapshot.players)||snapshot.players.length>4)throw Error('El servidor devolvió una sala inesperada.');
      // An invalid proof must not replace even the internal snapshot. A duplicate ACK
      // without a pending action is ignored; a later snapshot still updates the view.
      if(message.type==='ack'){if(!this.pending)return;this.clearPending(message.receipt,snapshot);}
      const firstConfirmation=!this.connected;this.snapshot=snapshot;this.connected=true;
      if(message.type==='ack')this.onReceipt(message.receipt);
      else if(firstConfirmation)this.onStatus('Conexión y asiento confirmados. Los avances sólo cambian al recibir un acuse del servidor.');
      this.onSnapshot(snapshot);if(!['completed','expired'].includes(snapshot.status))this.restore();
      if(['completed','expired'].includes(snapshot.status)){this.stopSocket();this.onStatus('La partida terminó. El docente puede consultar su evidencia y el estado del archivo.');return;}
      if(!this.timer)this.timer=setInterval(()=>{if(this.connected&&!this.closed)this.sendFrame({type:'heartbeat'});},LIVE_LIMITS.heartbeat);
    }else if(message.type==='error'){
      if([401,403,413,429,503].includes(message.status)){this.stopSocket();if([429,503].includes(message.status))this.retryAt=Date.now()+60000;}
      this.onStatus(errors[message.code]||`La acción no se confirmó (${message.code}). El envío pendiente se conserva para recuperar su acuse.`);
    }
  }
  sendFrame(value){
    if(!this.ensureAccess())return false;
    if(!this.ws||this.ws.readyState!==1)return false;
    if(++this.frames>LIVE_LIMITS.frames){this.stopSocket();this.onStatus('Se alcanzó el límite de mensajes de esta conexión.');return false;}
    this.ws.send(JSON.stringify(value));return true;
  }
  action(action){
    if(!this.ensureAccess())throw Error('El perfil ya no está vinculado a esta sala.');
    if(!this.connected||this.pending||!this.snapshot?.self)throw Error('Espera la confirmación de la conexión o de la respuesta anterior.');
    const s=this.snapshot;this.pendingSeat=s.self.seat;this.pendingSources=[];this.pending={schema:LIVE_SCHEMA,roomId:s.id,epoch:s.epoch,connectionGeneration:s.self.generation,clientSeq:s.self.nextSeq,actionId:crypto.randomUUID(),expectedVersion:s.version,expectedSeatVersion:s.self.seatVersion,action};
    this.persist();if(!this.sendFrame(this.pending))throw Error('La conexión se interrumpió. La acción quedó pendiente, sin acuse todavía.');
    this.onStatus('Esperando el acuse del servidor…');
  }
  hidden(){this.stopSocket();this.onStatus('La pestaña quedó inactiva. La partida se pausa al detectar el cierre; los cuatro deben confirmar para continuar.');}
  stopSocket(){clearInterval(this.timer);this.timer=null;this.connected=false;const socket=this.ws;this.ws=null;try{socket?.close();}catch{}}
  close(){this.closed=true;this.connectAttempt++;this.stopSocket();}
}
