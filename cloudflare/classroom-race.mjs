import {LIVE_SCHEMA,LIVE_LIMITS,LiveError,liveAssert,liveId,liveShape,liveCanonical,liveBytes,validateLiveConfig,validateLiveEnvelope,newLiveRoom,joinLiveRoom,ownLiveMember,connectLiveMember,transferLiveMember,disconnectLiveMember,countLiveFrame,heartbeatLiveRoom,liveAction,reconcileLiveRoom,expireLiveRoom,liveSnapshot,liveParticipation,livePause} from '../web/cloud-room-contract.js';

export async function liveDigest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
const terminal=r=>['completed','expired'].includes(r.status);
const errorResponse=e=>Response.json({error:e instanceof LiveError?e.code:'live_unavailable'},{status:e.status||503});

// SQLite-only Durable Object. Public requests can reach it only through authenticated Worker routes.
export class ClassroomRace {
  constructor(ctx,env){
    this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS live_state (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS live_revocations (hash TEXT PRIMARY KEY, at INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS live_creations (id TEXT PRIMARY KEY, classroom TEXT NOT NULL, digest TEXT NOT NULL, result TEXT NOT NULL, at INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS live_outbox (id TEXT PRIMARY KEY, roomId TEXT NOT NULL, profile TEXT NOT NULL, body TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, manual INTEGER NOT NULL DEFAULT 0, delivered INTEGER NOT NULL DEFAULT 0)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS live_recovery (roomId TEXT PRIMARY KEY, classroom TEXT NOT NULL, body TEXT NOT NULL, expiresAt INTEGER NOT NULL)');
    ctx.setHibernatableWebSocketEventTimeout?.(5000);
  }
  rows(sql,...args){return this.sql.exec(sql,...args).toArray();}
  room(){const row=this.rows('SELECT body FROM live_state WHERE id=1')[0];return row?JSON.parse(row.body):null;}
  write(r){liveAssert(liveBytes(r)<=LIVE_LIMITS.stateBytes,'state_limit',413);this.sql.exec('INSERT INTO live_state(id,body) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body',JSON.stringify(r));}
  revoked(hash){return this.rows('SELECT hash FROM live_revocations WHERE hash=?',hash).length>0;}
  checkPrincipal(p){liveAssert(p&&['student','teacher'].includes(p.role)&&liveId(p.classroom)&&typeof p.hash==='string'&&/^[a-f0-9]{64}$/.test(p.hash)&&(p.role==='teacher'||liveId(p.profile)),'principal',403);liveAssert(!this.revoked(p.hash),'revoked',401);}
  async authorized(p){this.checkPrincipal(p);const row=await this.env.DB.prepare('SELECT room,role,profile FROM access WHERE hash=?').bind(p.hash).first();liveAssert(row&&row.room===p.classroom&&row.role===p.role&&(p.role==='teacher'||row.profile===p.profile),'revoked',401);}
  cleanupRecovery(){this.sql.exec('DELETE FROM live_recovery WHERE roomId IN (SELECT roomId FROM live_recovery WHERE expiresAt<=? LIMIT 8)',Date.now());}
  retainRecovery(r){
    if(!terminal(r)||Date.now()>=r.terminalAt+LIVE_LIMITS.recoveryTtl)return;
    const body=JSON.stringify({owners:r.members.map(p=>({profile:p.profile,seat:p.seat})),receipts:r.receipts});
    liveAssert(liveBytes(body)<=LIVE_LIMITS.recoveryBytes,'recovery_size',413);
    liveAssert(this.rows('SELECT roomId FROM live_recovery WHERE roomId=?',r.id).length||this.rows('SELECT count(*) AS n FROM live_recovery')[0].n<LIVE_LIMITS.recoveryRooms,'recovery_capacity',429);
    this.sql.exec('INSERT INTO live_recovery(roomId,classroom,body,expiresAt) VALUES(?,?,?,?) ON CONFLICT(roomId) DO UPDATE SET body=excluded.body',r.id,r.classroom,body,r.terminalAt+LIVE_LIMITS.recoveryTtl);
  }
  ensureOutbox(r){
    if(!terminal(r))return;
    this.retainRecovery(r);
    for(const p of r.members){const record=liveParticipation(r,p),body=liveCanonical(record);this.sql.exec('INSERT INTO live_outbox(id,roomId,profile,body) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING',record.id,r.id,p.profile,body);}
    const bytes=this.rows('SELECT COALESCE(sum(length(CAST(body AS BLOB))),0) AS n FROM live_outbox WHERE delivered=0')[0].n;liveAssert(bytes<=131072,'outbox_limit',413);
  }
  mutate(fn){
    let value,error;
    this.ctx.storage.transactionSync(()=>{
      const r=this.room();liveAssert(r,'room_missing',404);
      try{value=fn(r);}catch(e){if(!(e instanceof LiveError))throw e;error=e;}
      // Preserve terminal bookkeeping headroom rather than reject the next expiry write.
      if(!terminal(r)&&liveBytes(r)>LIVE_LIMITS.stateSoftBytes)expireLiveRoom(r,'state_limit',r.clock);
      this.ensureOutbox(r);this.write(r);
    });
    if(error)throw error;return value;
  }
  getSocket(attachment){return this.ctx.getWebSockets().find(ws=>{try{const a=ws.deserializeAttachment();return a.roomId===attachment.roomId&&a.socketId===attachment.socketId;}catch{return false;}});}
  closeStale(){const r=this.room();for(const ws of this.ctx.getWebSockets()){try{const a=ws.deserializeAttachment(),p=r?.members.find(p=>p.profile===a.principal.profile);if(!r||a.roomId!==r.id||!p||p.socketId!==a.socketId||p.generation!==a.principal.generation||this.revoked(a.principal.hash))ws.close(4001,'connection_replaced');}catch{try{ws.close(4001,'invalid_connection');}catch{}}}}
  broadcast(){const r=this.room();if(!r)return;this.closeStale();for(const ws of this.ctx.getWebSockets()){try{const a=ws.deserializeAttachment(),p=r.members.find(p=>p.profile===a.principal.profile);if(a.roomId===r.id&&p?.socketId===a.socketId&&!this.revoked(a.principal.hash))ws.send(JSON.stringify({type:'snapshot',snapshot:liveSnapshot(r,a.principal)}));}catch{}}}
  async schedule(){
    const r=this.room();if(!r)return;
    let due;
    if(terminal(r)){
      const pending=this.rows('SELECT attempts FROM live_outbox WHERE delivered=0');
      if(pending.some(x=>x.attempts<3))due=Date.now()+[1000,5000,30000][Math.min(...pending.map(x=>x.attempts),2)];
      else if(!pending.length)due=Math.max(Date.now()+1000,r.terminalAt+86400000);
      else due=null;
    }else{
      if(r.alarmCount>=LIVE_LIMITS.alarms){this.mutate(x=>expireLiveRoom(x,'alarm_limit',Date.now()));this.broadcast();return this.schedule();}
      const targets=[r.expiresAt];if(r.status==='countdown')targets.push(r.startAt);
      if(r.status!=='paused')for(const p of r.members)if(p.socketId)targets.push(p.leaseUntil);
      due=Math.min(...targets);
    }
    const recovery=this.rows('SELECT min(expiresAt) AS at FROM live_recovery')[0]?.at;
    if(recovery!==null&&recovery!==undefined)due=due===null?recovery:Math.min(due,recovery);
    if(due===null){await this.ctx.storage.deleteAlarm();return;}
    const current=await this.ctx.storage.getAlarm();if(current!==null&&current<=due)return;
    if(!terminal(r))this.mutate(x=>{x.alarmCount++;});await this.ctx.storage.setAlarm(Math.max(Date.now()+50,due));
  }
  control(r,p,id,type,fn){
    liveAssert(liveId(id),'action_id');r.controls??=[];const old=r.controls.find(x=>x.id===id);
    if(old){liveAssert(old.profile===p.profile&&old.type===type,'control_owner',403);return old.result;}
    liveAssert(r.controls.length<64,'control_limit',429);const result=fn();r.controls.push({id,profile:p.profile,type,result});return result;
  }
  async fetch(request){
    try{
      liveAssert(this.env.SERVICE_ENABLED==='true'&&this.env.LIVE_ROOMS_ENABLED==='true','live_disabled',503);
      const url=new URL(request.url);
      if(url.pathname==='/socket')return await this.upgrade(request);
      liveAssert(request.method==='POST','method',405);const {principal:p,command,data}=await request.json();await this.authorized(p);this.cleanupRecovery();
      if(command==='create')return await this.create(p,data);
      if(command==='receipt')return await this.recoverReceipt(p,data);
      if(command==='revoke'){
        liveAssert(p.role==='teacher'&&/^[a-f0-9]{64}$/.test(data.hash),'role',403);
        this.ctx.storage.transactionSync(()=>{
          this.sql.exec('DELETE FROM live_revocations WHERE hash IN (SELECT hash FROM live_revocations WHERE at<? LIMIT 60)',Date.now()-86400000);
          liveAssert(this.revoked(data.hash)||this.rows('SELECT count(*) AS n FROM live_revocations')[0].n<128,'revocation_storage_limit',429);
          this.sql.exec('INSERT INTO live_revocations(hash,at) VALUES(?,?) ON CONFLICT(hash) DO NOTHING',data.hash,Date.now());
          const r=this.room();if(r){liveAssert(r.classroom===p.classroom,'classroom',403);reconcileLiveRoom(r,Date.now());const member=r.members.find(m=>m.accessHash===data.hash);if(member){member.socketId=null;member.ready=false;livePause(r,'revoked',r.clock,true);}this.ensureOutbox(r);this.write(r);}
        });this.closeStale();this.broadcast();await this.schedule();return Response.json({fenced:true});
      }
      const current=this.room();if(!current){liveAssert(command==='current','room_missing',404);return Response.json({room:null});}
      liveAssert(current.classroom===p.classroom,'classroom',403);
      if(command==='current')return Response.json({room:!terminal(current)||p.role==='teacher'||current.members.some(m=>m.profile===p.profile)?{id:current.id,condition:current.condition,status:current.status,terminal:terminal(current),archivePending:this.rows('SELECT id FROM live_outbox WHERE delivered=0').length>0}:null});
      liveAssert(data?.roomId===current.id,'room_missing',404);
      let result;
      if(command==='join'){
        liveShape(data,['roomId','actionId']);result=this.mutate(r=>{this.checkPrincipal(p);const member=joinLiveRoom(r,p,Date.now());return{seat:member.seat,generation:member.generation,nextSeq:member.nextSeq,snapshot:liveSnapshot(r,p)};});
      }else if(command==='transfer'){
        liveShape(data,['roomId','actionId','confirmTransfer']);liveAssert(data.confirmTransfer===true,'transfer_confirmation');
        result=this.mutate(r=>{this.checkPrincipal(p);ownLiveMember(r,p);return this.control(r,p,data.actionId,'transfer',()=>{const m=transferLiveMember(r,p,Date.now());return {seat:m.seat,generation:m.generation,nextSeq:m.nextSeq};});});
      }else if(command==='ticket'){
        liveShape(data,['roomId','generation']);result=this.mutate(r=>{this.checkPrincipal(p);reconcileLiveRoom(r,Date.now());const m=ownLiveMember(r,p);liveAssert(!terminal(r)&&data.generation===m.generation&&!m.socketId,'socket_owned',409);m.ticketTimes=(m.ticketTimes||[]).filter(t=>t>r.clock-60000);liveAssert(m.ticketTimes.length<2&&(m.ticketCount||0)<16,'ticket_rate',429);m.ticketTimes.push(r.clock);m.ticketCount=(m.ticketCount||0)+1;return{seat:m.seat,generation:m.generation};});
      }else if(command==='get'){
        result=this.mutate(r=>{this.checkPrincipal(p);reconcileLiveRoom(r,Date.now());return{snapshot:liveSnapshot(r,p)};});
        if(p.role==='teacher')result.records=this.rows('SELECT body,delivered FROM live_outbox WHERE roomId=? ORDER BY profile',current.id).map(x=>({record:JSON.parse(x.body),delivery:x.delivered?'received':'pending'}));
      }else if(command==='close'){
        liveAssert(p.role==='teacher','role',403);liveShape(data,['roomId','actionId','expectedVersion']);result=this.mutate(r=>{this.checkPrincipal(p);liveAssert(terminal(r)||data.expectedVersion===r.version,'version',409);expireLiveRoom(r,'teacher_closed',Date.now());return{snapshot:liveSnapshot(r,p)};});
      }else if(command==='archive'){
        liveAssert(p.role==='teacher','role',403);await this.flush(true);result={pending:this.rows('SELECT id FROM live_outbox WHERE delivered=0').length};
      }else throw new LiveError('route',404);
      this.broadcast();await this.schedule();return Response.json(result);
    }catch(e){return errorResponse(e);}
  }
  async recoverReceipt(p,data){
    liveAssert(p.role==='student','role',403);liveShape(data,['roomId','envelope']);validateLiveEnvelope(data.envelope);liveAssert(data.roomId===data.envelope.roomId,'room',403);
    const e=data.envelope,payloadHash=await liveDigest(liveCanonical(e));this.checkPrincipal(p);
    let owners,receipts,closed,retainedUntil;
    const current=this.room();
    if(current?.id===data.roomId){
      const r=this.mutate(r=>{liveAssert(r.classroom===p.classroom,'classroom',403);ownLiveMember(r,p);reconcileLiveRoom(r,Date.now());return structuredClone(r);});
      owners=r.members;receipts=r.receipts;closed=terminal(r);retainedUntil=closed?r.terminalAt+LIVE_LIMITS.recoveryTtl:r.expiresAt+LIVE_LIMITS.recoveryTtl;
    }else{
      const row=this.rows('SELECT classroom,body,expiresAt FROM live_recovery WHERE roomId=?',data.roomId)[0];
      liveAssert(row&&row.expiresAt>Date.now(),'receipt_expired',410);liveAssert(row.classroom===p.classroom,'classroom',403);
      const body=JSON.parse(row.body);owners=body.owners;receipts=body.receipts;closed=true;retainedUntil=row.expiresAt;
    }
    liveAssert(retainedUntil>Date.now(),'receipt_expired',410);
    const owner=owners.find(x=>x.profile===p.profile);liveAssert(owner,'membership',403);
    // Membership is established before examining any receipt, including action-ID collisions.
    const receipt=receipts.find(x=>x.actionId===e.actionId);
    if(receipt){liveAssert(receipt.profile===p.profile&&receipt.seat===owner.seat&&receipt.roomId===data.roomId,'receipt_owner',403);liveAssert(receipt.payloadHash===payloadHash&&receipt.ack.clientSeq===e.clientSeq,'action_conflict',409);}
    else liveAssert(!receipts.some(x=>x.profile===p.profile&&x.ack.clientSeq===e.clientSeq),'sequence_conflict',409);
    const result={schema:'sendero.live-receipt.v1',roomId:data.roomId,profile:p.profile,seat:owner.seat,actionId:e.actionId,clientSeq:e.clientSeq,payloadHash,resolution:receipt?'receipt':closed?'not_committed':'pending',receipt:receipt?structuredClone(receipt.ack):null,terminal:closed,retainedUntil};
    this.broadcast();await this.schedule();return Response.json(result);
  }
  async create(p,data){
    liveAssert(p.role==='teacher','role',403);liveShape(data,['config','actionId']);validateLiveConfig(data.config);liveAssert(liveId(data.actionId),'action_id');
    const digest=await liveDigest(liveCanonical(data.config));
    return this.ctx.blockConcurrencyWhile(async()=>{
      const old=this.rows('SELECT * FROM live_creations WHERE id=?',data.actionId)[0];
      if(old){liveAssert(old.classroom===p.classroom&&old.digest===digest,'creation_conflict',409);const result=JSON.parse(old.result);liveAssert(!result.error,result.error||'creation_failed',409);return Response.json(result, {status:201});}
      const prior=this.room();liveAssert(!prior||terminal(prior),'room_active',409);liveAssert(!this.rows('SELECT id FROM live_outbox WHERE delivered=0').length,'archive_pending',409);
      this.cleanupRecovery();if(prior)this.retainRecovery(prior);
      // Reserve one of eight recovery slots before admitting another room; never evict an unexpired proof.
      liveAssert(this.rows('SELECT count(*) AS n FROM live_recovery')[0].n<LIVE_LIMITS.recoveryRooms,'recovery_capacity',429);
      this.sql.exec('DELETE FROM live_creations WHERE at<?',Date.now()-172800000);liveAssert(this.rows('SELECT id FROM live_creations').length<8,'creation_limit',429);
      this.sql.exec('INSERT INTO live_creations(id,classroom,digest,result,at) VALUES(?,?,?,?,?)',data.actionId,p.classroom,digest,JSON.stringify({error:'creation_interrupted'}),Date.now());
      const day=new Date().toISOString().slice(0,10);
      // Failed reservations remain spent; day-boundary carry can yield up to eight live rooms, not four.
      for(const [scope,limit] of [['live:admissions',4],[`live:class:${p.classroom}`,2]]){
        const reserved=await this.env.DB.prepare('INSERT INTO usage(day,scope,requests) VALUES(?,?,1) ON CONFLICT(day,scope) DO UPDATE SET requests=requests+1 WHERE requests<? RETURNING requests').bind(day,scope,limit).all();
        if(!reserved.results?.length){this.sql.exec('UPDATE live_creations SET result=? WHERE id=?',JSON.stringify({error:'live_daily_admissions'}),data.actionId);throw new LiveError('live_daily_admissions',429);}
      }
      await this.authorized(p);
      const r=newLiveRoom({id:crypto.randomUUID(),classroom:p.classroom,config:data.config,seed:crypto.getRandomValues(new Uint32Array(1))[0],at:Date.now()}),result={roomId:r.id,condition:r.condition,expiresAt:r.expiresAt,revision:r.version};
      this.ctx.storage.transactionSync(()=>{this.sql.exec('DELETE FROM live_outbox WHERE delivered=1');this.write(r);this.sql.exec('UPDATE live_creations SET result=? WHERE id=?',JSON.stringify(result),data.actionId);});
      this.closeStale();await this.schedule();return Response.json(result,{status:201});
    });
  }
  async upgrade(request){
    liveAssert(request.headers.get('Upgrade')?.toLowerCase()==='websocket','upgrade');
    const attachment=JSON.parse(request.headers.get('X-Sendero-Live')||'null');liveAssert(attachment&&liveId(attachment.roomId),'principal',403);const p=attachment.principal;await this.authorized(p);
    const socketId=crypto.randomUUID(),pair=new WebSocketPair(),client=pair[0],server=pair[1];
    this.mutate(r=>{this.checkPrincipal(p);liveAssert(r.id===attachment.roomId,'room',403);connectLiveMember(r,p,socketId,p.generation,Date.now());});
    try{this.ctx.acceptWebSocket(server);server.serializeAttachment({roomId:attachment.roomId,principal:p,socketId});}
    catch(e){this.mutate(r=>disconnectLiveMember(r,p,socketId,Date.now()));throw e;}
    server.send(JSON.stringify({type:'snapshot',snapshot:liveSnapshot(this.room(),p)}));this.broadcast();await this.schedule();
    return new Response(null,{status:101,webSocket:client,headers:{'Sec-WebSocket-Protocol':'sendero.live.v1'}});
  }
  async webSocketMessage(ws,message){
    let a;
    try{
      liveAssert(this.env.SERVICE_ENABLED==='true'&&this.env.LIVE_ROOMS_ENABLED==='true','live_disabled',503);
      a=ws.deserializeAttachment();liveAssert(a,'principal',403);
      const previousVersion=this.room()?.version;
      this.mutate(r=>{this.checkPrincipal(a.principal);liveAssert(r.id===a.roomId,'room',403);countLiveFrame(r,a.principal,a.socketId,Date.now());});
      liveAssert(typeof message==='string'&&liveBytes(message)<=LIVE_LIMITS.frameBytes,'frame_limit',413);const data=JSON.parse(message);
      if(data?.type==='heartbeat'){
        liveShape(data,['type']);const snapshot=this.mutate(r=>{this.checkPrincipal(a.principal);heartbeatLiveRoom(r,a.principal,a.socketId,Date.now());return liveSnapshot(r,a.principal);});
        ws.send(JSON.stringify({type:'heartbeat',serverNow:snapshot.serverNow,status:snapshot.status,version:snapshot.version}));
        // Only a real transition needs broadcast; presence heartbeats do not repaint every UI.
        if(snapshot.version!==previousVersion)this.broadcast();
      }else{
        await this.authorized(a.principal);const payloadHash=await liveDigest(liveCanonical(data));
        const ack=this.mutate(r=>{this.checkPrincipal(a.principal);const value=liveAction(r,a.principal,a.socketId,data,payloadHash,Date.now());if(ownLiveMember(r,a.principal).nextSeq>64&&!terminal(r))expireLiveRoom(r,'action_limit',r.clock);return value;});
        ws.send(JSON.stringify({type:'ack',receipt:ack,snapshot:liveSnapshot(this.room(),a.principal)}));this.broadcast();
      }
    }catch(e){
      try{ws.send(JSON.stringify({type:'error',code:e instanceof LiveError?e.code:'invalid_frame',status:e.status||400}));}catch{}
      if([401,403,413,429,503].includes(e.status)||!(e instanceof LiveError)){try{ws.close(4003,e instanceof LiveError?e.code:'invalid_frame');}catch{}}
    }
    this.closeStale();await this.schedule();
  }
  async webSocketClose(ws){try{const a=ws.deserializeAttachment();if(a)this.mutate(r=>{if(r.id===a.roomId)disconnectLiveMember(r,a.principal,a.socketId,Date.now());});}catch{}this.broadcast();await this.schedule();}
  async webSocketError(ws){return this.webSocketClose(ws);}
  async flush(manual=false){
    const room=this.room();if(!room||!terminal(room))return;
    const items=this.rows(`SELECT * FROM live_outbox WHERE delivered=0 AND ${manual?'manual<1':'attempts<3'} LIMIT 4`);
    if(!items.length)return;
    this.ctx.storage.transactionSync(()=>{for(const x of items)this.sql.exec(`UPDATE live_outbox SET ${manual?'manual=manual+1':'attempts=attempts+1'} WHERE id=?`,x.id);});
    try{
      await this.env.DB.batch(items.map(x=>this.env.DB.prepare('INSERT INTO multiplayer(room,profile,id,body) VALUES(?,?,?,?) ON CONFLICT(room,profile,id) DO NOTHING').bind(room.classroom,x.profile,x.id,x.body)));
      for(const x of items){const persisted=await this.env.DB.prepare('SELECT body FROM multiplayer WHERE room=? AND profile=? AND id=?').bind(room.classroom,x.profile,x.id).first();liveAssert(persisted?.body===x.body,'archive_conflict',409);this.sql.exec('UPDATE live_outbox SET delivered=1 WHERE id=?',x.id);}
    }catch{/* The bounded outbox remains recoverable; no unbounded retry or invented acknowledgement. */}
  }
  async alarm(){
    this.cleanupRecovery();
    const r=this.room();if(!r)return;
    this.mutate(x=>reconcileLiveRoom(x,Date.now()));await this.flush(false);
    const current=this.room();
    if(terminal(current)&&Date.now()>=current.terminalAt+86400000&&!this.rows('SELECT id FROM live_outbox WHERE delivered=0').length){
      this.ctx.storage.transactionSync(()=>{this.sql.exec('DELETE FROM live_state');this.sql.exec('DELETE FROM live_outbox WHERE delivered=1');this.sql.exec('DELETE FROM live_creations WHERE at<?',Date.now()-172800000);this.sql.exec('DELETE FROM live_revocations WHERE at<?',Date.now()-86400000);});this.closeStale();return;
    }
    this.broadcast();await this.schedule();
  }
}
