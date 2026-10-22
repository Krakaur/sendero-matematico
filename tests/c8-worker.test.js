import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {equivalent,sessionKey} from '../web/assignments.js';
import {profiles,workshopTasks,completeWorkshop,report,reasoningTasks,completeReasoning} from './c8-fixtures.mjs';

test('C8 Worker/D1 receives 32 workshops and 24 reasoning reports, canonical replay and atomic conflict rejection',async()=>{
 const bundle=await build({entryPoints:['cloudflare/worker.mjs'],bundle:true,format:'esm',write:false,platform:'browser',target:'es2022'}),admin='a'.repeat(64);
 const runtime=new Miniflare(convertV4MiniflareOptions({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-10-14',d1Databases:['DB'],bindings:{ADMIN_TOKEN_HASH:createHash('sha256').update(admin).digest('hex'),SERVICE_ENABLED:'true',ALLOWED_ORIGINS:'https://krakaur.github.io',MAX_DAILY_REQUESTS:'10000',MAX_DAILY_PER_ACCESS:'1000'}}));
 const evidence={publicRequests:0,requests:0,d1RowsRead:0,d1RowsWritten:0,reportedD1Calls:0,unknownD1Calls:0,cpuMilliseconds:null,cpuLimit:'Local execution does not measure public Workers CPU.'};
 const req=async(path,body,token=admin)=>{const response=await runtime.dispatchFetch('https://c8-local.test'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});evidence.requests++;const read=response.headers.get('X-D1-Rows-Read'),written=response.headers.get('X-D1-Rows-Written');if(read!==null&&written!==null){evidence.reportedD1Calls++;evidence.d1RowsRead+=Number(read);evidence.d1RowsWritten+=Number(written);}else evidence.unknownD1Calls++;return {status:response.status,data:await response.json()};};
 try{
  const db=await runtime.getD1Database('DB');let sql='';for(const file of ['0001_classroom.sql','0002_school_multiplayer.sql'])sql+=await readFile(new URL('../cloudflare/migrations/'+file,import.meta.url),'utf8');for(const statement of sql.match(/CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|INDEX)[\s\S]*?;/g))await db.prepare(statement).run();
  const room=await req('/admin-api/rooms',{name:'C8 pruebas sintéticas'});assert.equal(room.status,201);const teacher=room.data.token,classId=room.data.classId;
  const tasks=[...workshopTasks(classId),...reasoningTasks().map(t=>({...t,classId}))],revision=(await req('/tasks',null,teacher)).data.revision;
  assert.equal((await req('/tasks',{tasks,expectedRevision:revision},teacher)).status,200);
  const tokens=[],sessions=[];let workshopReplays=0;
  const reorder=x=>Array.isArray(x)?x.map(reorder):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).reverse().map(([key,value])=>[key,reorder(value)])):x;
  for(let i=0;i<4;i++){
   const inv=await req('/students',{},teacher);assert.equal(inv.status,200);tokens.push(inv.data.token);
   assert.equal((await req('/enrollment',{profile:profiles[i],enrollment:{school:'Escuela sintética',grade:'3',group:'C8',listNumber:i+1}},tokens[i])).status,200);
   for(const t of tasks){
    const s=t.contentId==='workshop-fixed-project'?completeWorkshop(t,profiles[i],i):completeReasoning(t,profiles[i],i);sessions.push(s);
    const ack=await req('/reports',report(s),tokens[i]);assert.equal(ack.status,200);assert.equal(ack.data.classId,classId);assert.equal(ack.data.profile,s.profile);assert.deepEqual(ack.data.accepted,[s.id]);assert(Number.isFinite(Date.parse(ack.data.receivedAt)));
    if(s.taskProtocol===5){const replay=await req('/reports',reorder(report(s)),tokens[i]);assert.equal(replay.status,200);assert.deepEqual(replay.data.accepted,[s.id]);workshopReplays++;}
   }
  }
  assert.equal(workshopReplays,32);
  const altered=structuredClone(sessions[0]);altered.workshop.note='Conflicto canónico';const fresh=completeWorkshop(tasks[0]);
  const conflict=await req('/reports',{...report(fresh),sessions:[fresh,altered]},tokens[0]);assert.notEqual(conflict.status,200);
  let cursor=0,more=true,received=[],pages=0;while(more&&pages<20){const res=await req('/reports?after='+cursor,null,teacher);assert.equal(res.status,200);received.push(...res.data.reports.flatMap(r=>r.sessions));cursor=res.data.cursor;more=res.data.more;pages++;}
  assert.equal(more,false);assert.equal(received.length,56);assert.equal(new Set(received.map(sessionKey)).size,56);assert(!received.some(s=>s.id===fresh.id));for(const s of sessions)assert(equivalent(received.find(x=>sessionKey(x)===sessionKey(s)),s));
  Object.assign(evidence,{workshopReceived:32,reasoningReceived:24,workshopReplays,duplicates:0,atomicConflictRejected:true,maxSessionBytes:Math.max(...sessions.map(s=>Buffer.byteLength(JSON.stringify(s)))),pages});
  if(process.env.C8_WORKER_EVIDENCE)await writeFile(process.env.C8_WORKER_EVIDENCE,JSON.stringify(evidence,null,2));
 }finally{await runtime.dispose();}
});
