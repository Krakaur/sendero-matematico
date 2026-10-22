import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {LIVE_SCHEMA,LIVE_LIMITS,LIVE_RECORD,liveCanonical,liveBytes,newLiveRoom,joinLiveRoom,connectLiveMember,transferLiveMember,heartbeatLiveRoom,reconcileLiveRoom,liveItem,liveAction,liveMetrics,liveRanking,liveSnapshot,expireLiveRoom,liveParticipation,validateLiveParticipation,countLiveFrame} from '../web/cloud-room-contract.js';
import {ClassroomRace} from '../cloudflare/classroom-race.mjs';
import {CloudRoomLink} from '../web/cloud-room-link.js';
import {cloudTeacherReportHTML,cloudRoomHTML} from '../web/cloud-room-view.js';

const hash=x=>createHash('sha256').update(x).digest('hex');
const teacher={classroom:'c11-aula',role:'teacher',profile:null,hash:hash('teacher')};
const principals=Array.from({length:4},(_,i)=>({classroom:teacher.classroom,role:'student',profile:`000110${i+1}`,hash:hash(`student${i}`),generation:0}));
const config={trail:'multi',level:2,circuit:'cascada',mode:'coop'};
function setup(mode='coop',at=Date.now()-4000){
  const r=newLiveRoom({id:'c11-room',classroom:teacher.classroom,config:{...config,mode},seed:731,at});
  principals.forEach((p,i)=>{joinLiveRoom(r,p,at);connectLiveMember(r,p,`socket-${i}`,0,at);});
  for(let i=0;i<4;i++)act(r,i,{type:'ready',value:true});
  reconcileLiveRoom(r,r.startAt+1);return r;
}
function envelope(r,seat,action,id){const p=r.members[seat];return{schema:LIVE_SCHEMA,roomId:r.id,epoch:r.epoch,connectionGeneration:p.generation,clientSeq:p.nextSeq,actionId:id||`action-${seat}-${p.nextSeq}`,expectedVersion:r.version,expectedSeatVersion:p.seatVersion,action};}
function act(r,seat,action,extra={}){
  const at=r.clock+200;
  for(const p of r.members)if(p.socketId)heartbeatLiveRoom(r,{...principals[p.seat],generation:p.generation},p.socketId,at);
  const e=extra.envelope||envelope(r,seat,action,extra.id),p=r.members[seat];return liveAction(r,{...principals[seat],generation:p.generation},p.socketId,e,hash(liveCanonical(e)),at);
}
function answer(r,seat,correct=true){const p=r.members[seat],q=liveItem(r,seat,p.index);return act(r,seat,{type:'answer',questionId:q.id,questionIndex:p.index,choiceIndex:q.options.findIndex(v=>(v===q.answer)===correct)});}
function finish(r){for(let q=0;q<8;q++)for(let seat=0;seat<4;seat++)if(r.members[seat].index===q)answer(r,seat);return r;}

test('C11: error, corrección, pista y clasificación tienen reglas distintas del cierre libre',()=>{
  const r=setup('race');const original=r.members[0].index;
  const wrong=answer(r,0,false);assert.equal(wrong.committed,true);assert.equal(r.members[0].index,original);
  const q=liveItem(r,2,0);act(r,2,{type:'hint',questionId:q.id,questionIndex:0});answer(r,2);
  assert.equal(liveMetrics(r.members[2]).firstCorrect,1);assert.equal(liveMetrics(r.members[2]).firstIndependent,0);
  finish(r);assert.equal(r.status,'completed');assert(r.members.every(p=>p.index===8));
  const ranking=liveRanking(r);assert(ranking.find(x=>x.seat===1).place<ranking.find(x=>x.seat===0).place,'La rapidez con un error no supera ocho aciertos iniciales.');
  assert.equal(liveMetrics(r.members[0]).errors,1);assert.equal(liveMetrics(r.members[0]).correctFinal,8);
  assert.equal(liveMetrics(r.members[2]).hints,1);
  for(const p of r.members)validateLiveParticipation(liveParticipation(r,p));
  const coop=setup();finish(coop);assert.deepEqual(liveRanking(coop),[]);
});

test('C11: propietario del recibo antes de lookup; replay propio conserva un único acuse tras transferencia',()=>{
  const r=setup(),e=envelope(r,0,{type:'hint',questionId:r.deck[0].id,questionIndex:0},'same-id'),digest=hash(liveCanonical(e));
  const ack=liveAction(r,principals[0],'socket-0',e,digest,r.clock+200),count=r.receipts.length;
  assert.throws(()=>liveAction(r,principals[1],'socket-1',e,digest,r.clock+200),/receipt_owner/);
  const p=transferLiveMember(r,principals[0],r.clock+200),owner={...principals[0],generation:p.generation};
  connectLiveMember(r,owner,'replacement',p.generation,r.clock+1);
  assert.deepEqual(liveAction(r,owner,'replacement',e,digest,r.clock+1),ack);assert.equal(r.receipts.length,count);
  assert.throws(()=>liveAction(r,owner,'replacement',e,hash('changed'),r.clock+1),/action_conflict/);
  assert.throws(()=>liveAction(r,principals[0],'socket-0',e,digest,r.clock+1),/socket_owner/);
});

test('C11: un socket vigente y cuatro ready; pausa por lease usa reloj servidor monótono',()=>{
  const waiting=newLiveRoom({id:'waiting',classroom:teacher.classroom,config,seed:11,at:Date.now()});
  for(let seat=0;seat<4;seat++){joinLiveRoom(waiting,principals[seat],waiting.clock);connectLiveMember(waiting,principals[seat],`socket-${seat}`,0,waiting.clock);assert(!Object.hasOwn(liveSnapshot(waiting,principals[0]),'question'),'No se entrega la consigna antes del reloj común.');}
  const concurrent=envelope(waiting,1,{type:'ready',value:true});act(waiting,0,{type:'ready',value:true});const rejected=act(waiting,1,concurrent.action,{envelope:concurrent});assert.equal(rejected.committed,false);assert.equal(rejected.code,'state_changed');assert.equal(waiting.members[1].ready,false);
  for(let seat=1;seat<4;seat++)act(waiting,seat,{type:'ready',value:true});assert.equal(waiting.status,'countdown');assert(!Object.hasOwn(liveSnapshot(waiting,principals[0]),'question'));reconcileLiveRoom(waiting,waiting.startAt);assert(Object.hasOwn(liveSnapshot(waiting,principals[0]),'question'));
  const r=setup();assert.throws(()=>connectLiveMember(r,principals[0],'second',0,r.clock),/socket_owned/);
  const elapsed=r.clock-r.runAt,oldEpoch=r.epoch,deadline=Math.min(...r.members.map(p=>p.leaseUntil));
  reconcileLiveRoom(r,deadline+500);assert.equal(r.status,'paused');assert.equal(r.pauseIntervals[0].effectiveAt,deadline);assert.equal(r.pauseIntervals[0].detectedAt,deadline+500);assert.equal(r.rankEligible,false);
  const pausedElapsed=r.elapsedMs;reconcileLiveRoom(r,r.clock-1000);assert.equal(r.elapsedMs,pausedElapsed);assert(r.elapsedMs>=elapsed);
  assert(!Object.hasOwn(liveSnapshot(r,principals[0]),'question'),'Una pausa tampoco revela el siguiente ítem antes de reanudar.');
  principals.forEach((p,i)=>connectLiveMember(r,p,`reconnected-${i}`,0,r.clock+1));
  for(let i=0;i<3;i++)act(r,i,{type:'ready',value:true});assert.equal(r.status,'paused');
  act(r,3,{type:'ready',value:true});assert.equal(r.status,'countdown');assert.equal(r.epoch,oldEpoch+1);
  const at=r.startAt;reconcileLiveRoom(r,at+1);assert.equal(r.status,'running');assert.equal(r.pauseIntervals[0].resumedAt,at);
  finish(r);assert.deepEqual(liveRanking(r),[]);
});

test('C11: proyección de compañeros no filtra identidad ni respuestas; informe completo conserva condición',()=>{
  const r=setup(),s=liveSnapshot(r,principals[0]),text=JSON.stringify(s);
  assert(!text.includes(principals[0].profile));assert(!text.includes(principals[1].hash));assert(!Object.hasOwn(s,'seed'));assert(!Object.hasOwn(s.question,'answer'));assert(!Object.hasOwn(s.players[1],'questions'));assert(!Object.hasOwn(s,'classroom'));
  answer(r,0,false);expireLiveRoom(r,'teacher_closed',r.clock+1);
  const record=liveParticipation(r,r.members[0]);assert.equal(record.status,'partial');assert.equal(record.metrics.responded,1);assert.equal(record.metrics.correctFinal,0);
  const html=cloudTeacherReportHTML([{record,delivery:'pending'}],{source:'server-read'});assert.match(html,/Pendiente de acuse D1/);assert.match(html,/1\/8 respondidos/);assert.match(html,/incorrecta/);assert.match(html,/Solución docente/);
  const imported=cloudTeacherReportHTML([{record,delivery:'received'}]);assert.match(imported,/Importado, sin acuse verificado/);
  const learner=cloudRoomHTML(liveSnapshot(r,principals[0]));assert(!learner.includes('Solución docente'));
  const race=finish(setup('race')),studentRanking=liveSnapshot(race,principals[0]).ranking;
  assert.equal(studentRanking.length,4);for(const row of studentRanking)assert.deepEqual(Object.keys(row).sort(),['alias','place','seat']);
  assert(liveSnapshot(race,teacher).ranking.every(row=>Number.isFinite(row.finishedMs)&&Object.hasOwn(row,'errors')));
  assert.equal(liveSnapshot(race,principals[0]).self.metrics.planned,8);
  assert(!cloudRoomHTML(liveSnapshot(race,principals[0])).includes('undefined'));
});

test('C11: registros canónicos rechazan estímulo extra, corrección falsa, futuro y métricas alteradas',()=>{
  const r=finish(setup()),record=liveParticipation(r,r.members[0]);
  for(const alter of [x=>x.questions[0].item.prompt='Texto ajeno',x=>x.questions[0].item.labels={0:'Falso'},x=>x.questions[0].events[0].correct=false,x=>x.metrics.firstCorrect=99,x=>x.questions[0].events[0].activeMs=-1,x=>x.questions[0].events.push({...x.questions[0].events[0]})]){const bad=structuredClone(record);alter(bad);assert.throws(()=>validateLiveParticipation(bad));}
  const partial=setup();answer(partial,0);expireLiveRoom(partial,'lifetime',partial.expiresAt);const bad=liveParticipation(partial,partial.members[0]);bad.questions[2].events=structuredClone(bad.questions[0].events);assert.throws(()=>validateLiveParticipation(bad));
});

function fakeDatabase(){
  const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE access(hash TEXT PRIMARY KEY,room TEXT,role TEXT,profile TEXT);CREATE TABLE usage(day TEXT,scope TEXT,requests INTEGER,PRIMARY KEY(day,scope));CREATE TABLE multiplayer(room TEXT,profile TEXT,id TEXT,body TEXT,UNIQUE(room,profile,id));');
  for(const p of [teacher,...principals])db.prepare('INSERT INTO access VALUES(?,?,?,?)').run(p.hash,p.classroom,p.role,p.profile);
  let failBefore=false,loseAck=false;
  const api={
    prepare(sql){
      return {bind(...args){
        return {sql,args,
          async first(){return db.prepare(sql).get(...args)||null;},
          async all(){const rows=db.prepare(sql).all(...args);return {results:rows,meta:{rows_read:rows.length,rows_written:0}};},
          async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),rows_read:0,rows_written:Number(r.changes)}};}
        };
      }};
    },
    async batch(statements){
      if(failBefore)throw Error('simulated outage');
      db.exec('BEGIN');
      try{for(const s of statements)db.prepare(s.sql).run(...s.args);db.exec('COMMIT');}
      catch(e){db.exec('ROLLBACK');throw e;}
      if(loseAck){loseAck=false;throw Error('committed without ack');}
      return [];
    }
  };
  return{db,api,setFail:v=>{failBefore=v;},loseAck:()=>{loseAck=true;}};
}
function fakeContext(){
  const db=new DatabaseSync(':memory:'),sockets=[];let alarm=null,queue=Promise.resolve();
  const ctx={storage:{sql:{exec(sql,...args){const q=db.prepare(sql);let rows=[];if(q.columns().length)rows=q.all(...args);else q.run(...args);return{toArray:()=>rows};}},transactionSync(fn){db.exec('BEGIN');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}},getAlarm:async()=>alarm,setAlarm:async n=>{alarm=n;},deleteAlarm:async()=>{alarm=null;}},blockConcurrencyWhile(fn){const run=queue.then(fn);queue=run.catch(()=>{});return run;},getWebSockets:()=>sockets.filter(s=>!s.closed),setHibernatableWebSocketEventTimeout(){},acceptWebSocket(ws){sockets.push(ws);}};
  return{ctx,db,sockets};
}
function fakeSocket(principal,seat){const messages=[];return{messages,closed:false,deserializeAttachment:()=>({roomId:'c11-room',principal,socketId:`socket-${seat}`}),send(value){messages.push(JSON.parse(value));},close(){this.closed=true;}};}
function fixture(){const d1=fakeDatabase(),local=fakeContext(),env={DB:d1.api,SERVICE_ENABLED:'true',LIVE_ROOMS_ENABLED:'true'},object=new ClassroomRace(local.ctx,env),r=setup();object.write(r);principals.forEach((p,i)=>local.sockets.push(fakeSocket(p,i)));return{d1,local,env,object,r};}
const command=(p,name,data)=>new Request('https://live.internal/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({principal:p,command:name,data})});

test('C11: SQLite recreado conserva acuse, barrera antes de borrar D1 impide acción posterior',async()=>{
  const f=fixture();try{
    const e=envelope(f.r,0,{type:'hint',questionId:f.r.deck[0].id,questionIndex:0});await f.object.webSocketMessage(f.local.sockets[0],JSON.stringify(e));
    assert.equal(f.object.room().members[0].questions[0].events.length,1);
    const restored=new ClassroomRace(f.local.ctx,f.env);await restored.webSocketMessage(f.local.sockets[0],JSON.stringify(e));assert.equal(restored.room().members[0].questions[0].events.length,1);
    const result=await restored.fetch(command(teacher,'revoke',{hash:principals[0].hash}));assert.equal(result.status,200);
    assert(f.d1.db.prepare('SELECT hash FROM access WHERE hash=?').get(principals[0].hash),'La barrera ya protege aun antes del borrado D1.');
    const next=envelope(restored.room(),0,{type:'answer',questionId:f.r.deck[0].id,questionIndex:0,choiceIndex:0});await restored.webSocketMessage(f.local.sockets[0],JSON.stringify(next));assert.equal(restored.room().members[0].questions[0].events.length,1);assert.equal(f.local.sockets[0].closed,true);
    f.d1.db.prepare('DELETE FROM access WHERE hash=?').run(principals[0].hash);const denied=await restored.fetch(command(principals[0],'get',{roomId:f.r.id}));assert.equal(denied.status,401);
  }finally{f.local.db.close();f.d1.db.close();}
});

test('C11: parcial y outbox sobreviven a commit sin acuse; reintentos y namespace son acotados',async()=>{
  const f=fixture();try{
    f.object.mutate(r=>{answer(r,0);expireLiveRoom(r,'teacher_closed',r.clock+1);});
    assert.equal(f.object.rows('SELECT id FROM live_outbox WHERE delivered=0').length,4);
    f.d1.loseAck();await f.object.flush();assert.equal(f.d1.db.prepare('SELECT count(*) n FROM multiplayer').get().n,4);assert.equal(f.object.rows('SELECT id FROM live_outbox WHERE delivered=0').length,4);
    const restored=new ClassroomRace(f.local.ctx,f.env);await restored.flush();assert.equal(restored.rows('SELECT id FROM live_outbox WHERE delivered=0').length,0);assert.equal(f.d1.db.prepare('SELECT count(*) n FROM multiplayer').get().n,4);
    const created=await restored.fetch(command(teacher,'create',{config,actionId:'new-room'}));assert.equal(created.status,201);assert.notEqual((await created.json()).roomId,f.r.id);assert.equal(restored.room().receipts.length,0);assert.equal(restored.room().members.length,0);
    const current=restored.room();joinLiveRoom(current,principals[0],current.clock);expireLiveRoom(current,'lifetime',current.expiresAt);restored.write(current);restored.mutate(()=>{});f.d1.setFail(true);
    for(let i=0;i<5;i++)await restored.flush();assert(restored.rows('SELECT attempts FROM live_outbox').every(x=>x.attempts===3));assert.equal(restored.rows('SELECT id FROM live_outbox WHERE delivered=0').length,1);
    const blocked=await restored.fetch(command(teacher,'create',{config,actionId:'blocked-room'}));assert.equal(blocked.status,409);assert.equal((await blocked.json()).error,'archive_pending');
  }finally{f.local.db.close();f.d1.db.close();}
});

test('C11: límites de frames/TTL son técnicos y no producen errores matemáticos',()=>{
  const r=setup();r.members[0].frames=LIVE_LIMITS.frames;
  assert.throws(()=>countLiveFrame(r,principals[0],'socket-0',r.clock),/message_limit/);assert.equal(r.status,'expired');assert.equal(r.terminalReason,'message_limit');assert.equal(liveMetrics(r.members[0]).errors,0);
  const r2=setup();const earlier=r2.clock;reconcileLiveRoom(r2,earlier-100000);assert.equal(r2.clock,earlier);reconcileLiveRoom(r2,r2.expiresAt);assert.equal(r2.status,'expired');assert.equal(r2.elapsedMs<=LIVE_LIMITS.ttl,true);
});

test('C11: acuse final perdido se recupera por HTTP también tras otra sala, sin repetir ni filtrar',async()=>{
  const f=fixture();try{
    f.object.mutate(r=>{for(let q=0;q<8;q++)for(let seat=0;seat<4;seat++)if(!(q===7&&seat===3))answer(r,seat);});
    const before=f.object.room(),item=liveItem(before,3,7),last=envelope(before,3,{type:'answer',questionId:item.id,questionIndex:7,choiceIndex:item.options.indexOf(item.answer)},'lost-final');
    f.local.sockets[3].send=()=>{};await f.object.webSocketMessage(f.local.sockets[3],JSON.stringify(last));
    assert.equal(f.object.room().status,'completed');const count=f.object.room().receipts.length,ack=f.object.room().receipts.find(x=>x.actionId===last.actionId).ack;
    const recovered=await f.object.fetch(command(principals[3],'receipt',{roomId:before.id,envelope:last})),proof=await recovered.json();assert.equal(recovered.status,200);assert.equal(proof.resolution,'receipt');assert.deepEqual(proof.receipt,ack);assert.equal(proof.payloadHash,hash(liveCanonical(last)));assert.equal(f.object.room().receipts.length,count);
    await f.object.flush();const created=await f.object.fetch(command(teacher,'create',{config,actionId:'after-lost-final'}));assert.equal(created.status,201);assert.notEqual(f.object.room().id,before.id);
    const archived=await f.object.fetch(command(principals[3],'receipt',{roomId:before.id,envelope:last}));assert.equal(archived.status,200);assert.deepEqual(await archived.json(),proof);
    const other=await f.object.fetch(command(principals[2],'receipt',{roomId:before.id,envelope:last}));assert.equal(other.status,403);
    const changed=structuredClone(last);changed.action.choiceIndex=(changed.action.choiceIndex+1)%4;assert.equal((await f.object.fetch(command(principals[3],'receipt',{roomId:before.id,envelope:changed}))).status,409);
    const never={...last,actionId:'never-received',clientSeq:last.clientSeq+1,action:{type:'pause',reason:'requested'}};const missing=await f.object.fetch(command(principals[3],'receipt',{roomId:before.id,envelope:never}));const noCommit=await missing.json();assert.equal(noCommit.resolution,'not_committed');assert.equal(noCommit.receipt,null);assert.equal(noCommit.terminal,true);
    f.object.sql.exec('UPDATE live_recovery SET expiresAt=0 WHERE roomId=?',before.id);const expired=await f.object.fetch(command(principals[3],'receipt',{roomId:before.id,envelope:last}));assert.equal(expired.status,410);assert.equal((await expired.json()).error,'receipt_expired');
  }finally{f.local.db.close();f.d1.db.close();}
});

test('C11: margen de estado permite cierre técnico y reserva de recuperación no elimina pruebas vigentes',async()=>{
  const f=fixture();try{
    f.object.mutate(r=>{r.testPadding='x'.repeat(LIVE_LIMITS.stateSoftBytes-liveBytes(r)+8);});assert.equal(f.object.room().terminalReason,'state_limit');assert(liveBytes(f.object.room())<=LIVE_LIMITS.stateBytes);assert.equal(f.object.rows('SELECT id FROM live_outbox').length,4);
    await f.object.flush();for(let i=1;i<8;i++)f.object.sql.exec('INSERT INTO live_recovery(roomId,classroom,body,expiresAt) VALUES(?,?,?,?)','retained-'+i,teacher.classroom,'{}',Date.now()+60000);
    const denied=await f.object.fetch(command(teacher,'create',{config,actionId:'no-recovery-slot'}));assert.equal(denied.status,429);assert.equal((await denied.json()).error,'recovery_capacity');assert.equal(f.object.rows('SELECT roomId FROM live_recovery').length,8);assert.equal(f.object.room().id,f.r.id);
  }finally{f.local.db.close();f.d1.db.close();}
});

test('C11: transferencia, replay y acuse borran todas las copias propias, sin borrar borradores cambiados',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},access={endpoint:'https://class.test',profile:principals[0].profile,role:'student',token:'test',classroom:teacher.classroom};
  const link=new CloudRoomLink(access,{storage,fetcher:()=>{throw Error('no network');},Socket:class{}}),r=setup();link.roomId=r.id;link.snapshot=liveSnapshot(r,principals[0]);link.connected=true;link.pendingKey=link.key(0);link.ws={readyState:1,send(){},close(){}};
  link.action({type:'hint',questionId:r.deck[0].id,questionIndex:0});const first=JSON.parse(storage.getItem(link.pendingKey));assert(first.envelope);assert(!JSON.stringify(first).includes('test'));
  const e=first.envelope,ack=liveAction(r,principals[0],'socket-0',e,hash(liveCanonical(e)),r.clock+200),p=transferLiveMember(r,principals[0],r.clock+200),owner={...principals[0],generation:p.generation};connectLiveMember(r,owner,'replacement',p.generation,r.clock+1);link.close();
  const sent=[],next=new CloudRoomLink(access,{storage});next.roomId=r.id;next.snapshot=liveSnapshot(r,owner);next.connected=true;next.ws={readyState:1,send:x=>sent.push(JSON.parse(x)),close(){}};next.restore();assert.equal(sent.length,1);assert.equal(sent[0].actionId,e.actionId);assert(storage.getItem(next.key(0)));assert(storage.getItem(next.key(1)));
  const previousSnapshot=next.snapshot;assert.throws(()=>next.receive({type:'ack',receipt:{...ack,clientSeq:ack.clientSeq+1},snapshot:{...next.snapshot,version:next.snapshot.version+1}}));assert.equal(next.snapshot,previousSnapshot,'Un acuse falso tampoco reemplaza el estado interno.');assert(next.pending);assert(storage.getItem(next.key(0)));
  next.clearPending(ack,next.snapshot);assert.equal(storage.getItem(next.key(0)),null);assert.equal(storage.getItem(next.key(1)),null);next.close();
  const reload=new CloudRoomLink(access,{storage});reload.roomId=r.id;reload.snapshot=liveSnapshot(r,owner);reload.ws={readyState:1,send:x=>sent.push(x),close(){}};reload.restore();assert.equal(sent.length,1,'La recarga no vuelve a enviar la copia anterior.');reload.connected=true;reload.action({type:'ready',value:true});const saved=JSON.parse(storage.getItem(reload.pendingKey)),accepted=liveAction(r,owner,'replacement',saved.envelope,hash(liveCanonical(saved.envelope)),r.clock+200);
  storage.setItem(reload.pendingKey,JSON.stringify({...saved,owner:'another-tab'}));reload.clearPending(accepted,liveSnapshot(r,owner));assert(storage.getItem(reload.pendingKey),'No borra datos cuyo propietario local cambió.');reload.close();
});

test('C11: índice de otra sala recupera un acuse exacto y conserva una prueba falsa o caducada',async()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},access={endpoint:'https://class.test',profile:principals[0].profile,role:'student',token:'test',classroom:teacher.classroom},r=setup(),link=new CloudRoomLink(access,{storage});link.roomId=r.id;link.snapshot=liveSnapshot(r,principals[0]);link.connected=true;link.pendingKey=link.key(0);link.ws={readyState:1,send(){},close(){}};link.action({type:'hint',questionId:r.deck[0].id,questionIndex:0});const e=link.pending,ack=liveAction(r,principals[0],'socket-0',e,hash(liveCanonical(e)),r.clock+200);link.close();
  const proof={schema:'sendero.live-receipt.v1',roomId:r.id,profile:principals[0].profile,seat:0,actionId:e.actionId,clientSeq:e.clientSeq,payloadHash:hash(liveCanonical(e)),resolution:'receipt',receipt:ack,terminal:true,retainedUntil:Date.now()+86400000};let bad=true,requests=0;
  const reload=new CloudRoomLink(access,{storage,fetcher:async url=>{requests++;assert(url.endsWith(`/live/rooms/${r.id}/receipt`));return Response.json(bad?{...proof,payloadHash:'0'.repeat(64)}:proof);}});reload.roomId='another-room';await assert.rejects(reload.recoverRoom(r.id));assert(storage.getItem(link.key(0)));bad=false;await reload.recoverOutstanding();assert.equal(requests,2);assert.equal(storage.getItem(link.key(0)),null);assert.deepEqual(reload.index(),[]);
  const limited={...storage,setItem(key,value){if(key.startsWith('sendero.live.outbox.'))throw Error('simulated quota');storage.setItem(key,value);}},failed=new CloudRoomLink(access,{storage:limited});failed.roomId=r.id;failed.snapshot=liveSnapshot(r,principals[0]);failed.pendingKey=failed.key(0);failed.connected=true;failed.ws={readyState:1,send(){throw Error('Must not send when persistence fails');},close(){}};
  assert.throws(()=>failed.action({type:'pause',reason:'requested'}),/No se pudo conservar/);assert(storage.getItem(failed.indexKey()));assert.deepEqual(failed.index(),[],'Una entrada de índice sin envolvente real se poda sin borrar otro borrador.');failed.close();
});


test('C11: desvincular detiene nuevas consultas y frames sin borrar pendientes existentes',async()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  let current=true,fetches=0,frames=0,closed=0;const notices=[];
  const access={endpoint:'https://class.test',profile:principals[0].profile,role:'student',token:'test',classroom:teacher.classroom};
  const link=new CloudRoomLink(access,{storage,accessCurrent:()=>current,status:s=>notices.push(s),fetcher:async()=>{fetches++;return Response.json({ok:true});}});
  await link.request('/before');assert.equal(fetches,1);
  link.ws={readyState:1,send(){frames++;},close(){closed++;}};link.connected=true;
  values.set('unrelated-pending','preserve');current=false;
  assert.equal(link.sendFrame({type:'heartbeat'}),false);assert.equal(frames,0);assert.equal(closed,1);
  await assert.rejects(link.request('/after'),/vincular/);assert.equal(fetches,1);
  assert.throws(()=>link.action({type:'pause',reason:'requested'}),/vinculado/);assert.equal(link.pending,null);
  assert.equal(values.get('unrelated-pending'),'preserve');assert(notices.some(s=>s.includes('desvinculó')));
});


test('C11: ticket diferido no abre otro socket después de salir, desvincular o iniciar otra conexión',async()=>{
  for(const reason of ['unlinked','closed','superseded']){
    let current=true,release,entered,sockets=0;const reached=new Promise(r=>{entered=r;}),ticket=new Promise(r=>{release=r;});
    const access={endpoint:'https://class.test',profile:principals[0].profile,role:'student',token:'test',classroom:teacher.classroom};
    const values=new Map([['pending-evidence','keep']]),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
    const link=new CloudRoomLink(access,{storage,accessCurrent:()=>current,Socket:class{constructor(){sockets++;}},fetcher:async url=>{
      if(url.endsWith('/join'))return Response.json({generation:0});
      if(url.endsWith('/tickets')){entered();await ticket;return Response.json({ticket:'a'.repeat(64),socketUrl:'wss://class.test/live/socket'});}
      throw Error('Unexpected request');
    }});
    const connecting=link.connect('race-deferred');await reached;
    if(reason==='unlinked')current=false;else if(reason==='closed')link.close();else link.connectAttempt++;
    release();await connecting;assert.equal(sockets,0,reason);assert.equal(values.get('pending-evidence'),'keep');link.close();
  }
});

// Browser fetch needs its native receiver; a detached injected mock hid this regression.
test('C11: default fetch preserves its global receiver', async()=>{
 const original=globalThis.fetch;let observed=false;
 globalThis.fetch=function(){assert.equal(this,globalThis);observed=true;return Promise.resolve({ok:true,json:async()=>({ok:true})});};
 try{const link=new CloudRoomLink({endpoint:'https://example.invalid',token:'test'},{storage:{}});assert.deepEqual(await link.request('/health'),{ok:true});assert.equal(observed,true);}finally{globalThis.fetch=original;}
});
