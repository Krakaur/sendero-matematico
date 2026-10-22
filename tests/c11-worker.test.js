import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {LIVE_SCHEMA,validateLiveParticipation} from '../web/cloud-room-contract.js';
import {newSession,recordAttempt} from '../web/core.js';
import {validateMultiplayerRecord} from '../web/multiplayer-records.js';

// One bounded local transport scenario. No public traffic, persistent database or artifact writes.
test('C11 Worker SQLite DO: cuatro sockets, ticket único, avances auténticos y cuatro informes parciales',async()=>{
  const bundled=await build({entryPoints:['cloudflare/worker.mjs'],bundle:true,format:'esm',write:false,platform:'browser',target:'es2022'}),admin='c'.repeat(64);
  const runtime=new Miniflare(convertV4MiniflareOptions({modules:true,script:bundled.outputFiles[0].text,compatibilityDate:'2026-10-14',d1Databases:['DB'],durableObjects:{CLASSROOM_RACE:{className:'ClassroomRace',useSQLite:true}},bindings:{ADMIN_TOKEN_HASH:createHash('sha256').update(admin).digest('hex'),SERVICE_ENABLED:'true',LIVE_ROOMS_ENABLED:'true',ALLOWED_ORIGINS:'https://krakaur.github.io',MAX_DAILY_REQUESTS:'10000',MAX_DAILY_PER_ACCESS:'1000'}}));
  const sockets=[],profiles=['0001111','0001112','0001113','0001114'];
  const request=async(path,data,token=admin)=>{const r=await runtime.dispatchFetch('https://c11-local.test'+path,{method:data===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)})});return{status:r.status,headers:r.headers,data:await r.json()};};
  const observed=ws=>{const messages=[],waiters=[];ws.addEventListener('message',event=>{const m=JSON.parse(event.data);messages.push(m);for(const w of [...waiters])if(w.predicate(m)){clearTimeout(w.timer);waiters.splice(waiters.indexOf(w),1);w.resolve(m);}});ws.accept();return{ws,messages,wait(predicate){const existing=[...messages].reverse().find(predicate);if(existing)return Promise.resolve(existing);return new Promise((resolve,reject)=>{const w={predicate,resolve,timer:setTimeout(()=>{waiters.splice(waiters.indexOf(w),1);reject(Error('Local WebSocket observation timed out'));},6000)};waiters.push(w);});},latest(){return[...messages].reverse().find(m=>m.snapshot)?.snapshot;}};};
  try{
    const db=await runtime.getD1Database('DB');for(const name of ['0001_classroom.sql','0002_school_multiplayer.sql','0003_live_tickets.sql']){const sql=await readFile(new URL('../cloudflare/migrations/'+name,import.meta.url),'utf8');for(const statement of sql.match(/CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|INDEX)[\s\S]*?;/g))await db.prepare(statement).run();}
    const classroom=await request('/admin-api/rooms',{name:'C11 sintético'});assert.equal(classroom.status,201);const teacher=classroom.data.token;
    const created=await request('/live/rooms',{actionId:'create-test',config:{trail:'multi',level:1,circuit:'bosque',mode:'coop'}},teacher);assert.equal(created.status,201);assert(created.headers.has('X-D1-Rows-Written'));assert.match(created.headers.get('X-Live-D1-Accounting'),/frontdoor-only/);const roomId=created.data.roomId,tokens=[];
    const replay=await request('/live/rooms',{actionId:'create-test',config:{mode:'coop',circuit:'bosque',level:1,trail:'multi'}},teacher);assert.equal(replay.data.roomId,roomId);
    for(let i=0;i<4;i++){
      const invitation=await request('/students',{},teacher),token=invitation.data.token;tokens.push(token);
      assert.equal((await request('/enrollment',{profile:profiles[i],enrollment:{school:'Escuela sintética',grade:'3',group:'C11',listNumber:i+1}},token)).status,200);
      const joined=await request(`/live/rooms/${roomId}/join`,{actionId:'join-'+i},token);assert.equal(joined.status,200);assert.equal(joined.data.seat,i);assert(!Object.hasOwn(joined.data.snapshot,'question'));
      const ticket=await request(`/live/rooms/${roomId}/tickets`,{generation:0},token);assert.equal(ticket.status,200);
      const headers={Origin:'https://krakaur.github.io',Upgrade:'websocket','Sec-WebSocket-Protocol':'sendero.live.v1, ticket.'+ticket.data.ticket};
      const upgrade=await runtime.dispatchFetch('https://c11-local.test/live/socket',{headers});assert.equal(upgrade.status,101);assert(upgrade.headers.has('X-D1-Rows-Read'));const entry=observed(upgrade.webSocket);sockets.push(entry);await entry.wait(m=>m.type==='snapshot');
      const reuse=await runtime.dispatchFetch('https://c11-local.test/live/socket',{headers});assert.equal(reuse.status,401,'Un ticket usado no vuelve a conectar.');
    }
    for(let i=0;i<4;i++){
      const entry=sockets[i],s=entry.latest(),id='ready-'+i;
      entry.ws.send(JSON.stringify({schema:LIVE_SCHEMA,roomId,epoch:s.epoch,connectionGeneration:s.self.generation,clientSeq:s.self.nextSeq,actionId:id,expectedVersion:s.version,expectedSeatVersion:s.self.seatVersion,action:{type:'ready',value:true}}));
      const ack=await entry.wait(m=>m.type==='ack'&&m.receipt.actionId===id);assert.equal(ack.receipt.committed,true);
      // Await the resulting version on every socket before the next noncommutative ready.
      await Promise.all(sockets.map(x=>x.wait(m=>m.snapshot?.version>=ack.snapshot.version)));
    }
    await Promise.all(sockets.map(x=>x.wait(m=>m.snapshot?.status==='running')));
    for(let i=0;i<4;i++){
      const entry=sockets[i],s=entry.latest(),q=s.question,[a,b]=q.prompt.split(' × ').map(Number),choice=q.options.indexOf(a*b),id='answer-'+i;
      const envelope={schema:LIVE_SCHEMA,roomId,epoch:s.epoch,connectionGeneration:s.self.generation,clientSeq:s.self.nextSeq,actionId:id,expectedVersion:s.version,expectedSeatVersion:s.self.seatVersion,action:{type:'answer',questionId:q.id,questionIndex:q.index,choiceIndex:choice}};
      entry.ws.send(JSON.stringify(envelope));const ack=await entry.wait(m=>m.type==='ack'&&m.receipt.actionId===id);assert.equal(ack.receipt.committed,true);assert.equal(ack.snapshot.self.metrics.correctFinal,1);
      entry.ws.send(JSON.stringify({type:'heartbeat'}));
    }
    const spoof=newSession('multi',1,profiles[0]);for(const q of spoof.questions)recordAttempt(q,q.answer);Object.assign(spoof,{id:`live-${roomId}-s0-v1`,completedAt:new Date().toISOString(),finishedMs:1000,transport:'local',mode:'coop',participants:4,enrollment:{school:'Escuela sintética',grade:'3',group:'C11',listNumber:1}});validateMultiplayerRecord(spoof);
    const occupied=await request('/multiplayer',{schema:'sendero.multiplayer-report.v1',profile:profiles[0],multiplayer:[spoof]},tokens[0]);assert.equal(occupied.status,403);assert.equal(occupied.data.error,'server_records_only');assert.equal((await db.prepare('SELECT count(*) n FROM multiplayer WHERE id=?').bind(spoof.id).first()).n,0,'El alumno no reserva el ID que debe archivar el servidor.');
    const state=await request(`/live/rooms/${roomId}`,undefined,teacher);assert.equal(state.data.snapshot.players.length,4);
    assert.equal((await request(`/live/rooms/${roomId}/close`,{actionId:'close-test',expectedVersion:state.data.snapshot.version},teacher)).status,200);
    assert.equal((await request(`/live/rooms/${roomId}/archive`,{},teacher)).status,200);
    const reports=await request('/multiplayer?after=0',undefined,teacher),records=reports.data.reports.flatMap(r=>r.multiplayer);assert.equal(records.length,4);assert.equal(reports.data.confirmationSource,'server-read');
    for(const record of records){validateLiveParticipation(record);assert.equal(record.status,'partial');assert.equal(record.metrics.correctFinal,1);assert.equal(record.metrics.planned,8);}
    const own=records.find(r=>r.profile===profiles[0]);const forbidden=await request('/multiplayer',{schema:'sendero.multiplayer-report.v1',profile:own.profile,multiplayer:[own]},tokens[0]);assert.equal(forbidden.status,403);assert.equal(forbidden.data.error,'server_records_only');
    assert.equal((await db.prepare("SELECT requests FROM usage WHERE scope='live:admissions'").first()).requests,1,'Replay de creación no reserva otra admisión.');
    assert((await db.prepare('SELECT count(*) n FROM live_tickets').first()).n<=4);
  }finally{for(const entry of sockets)try{entry.ws.close();}catch{}await runtime.dispose();}
});
