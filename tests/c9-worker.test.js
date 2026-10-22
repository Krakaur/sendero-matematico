import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {equivalent,sessionKey} from '../web/assignments.js';
import {report,completeReasoning} from './c8-fixtures.mjs';
import {c9Tasks} from './c9-fixtures.mjs';
const profiles=['000901','000902','000903','000904'];

test('C9 Worker/D1 receives 48 v2 reasoning reports, replay and atomic conflict rejection',async()=>{
 const bundle=await build({entryPoints:['cloudflare/worker.mjs'],bundle:true,format:'esm',write:false,platform:'browser',target:'es2022'}),admin='a'.repeat(64);
 const runtime=new Miniflare(convertV4MiniflareOptions({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-10-14',d1Databases:['DB'],bindings:{ADMIN_TOKEN_HASH:createHash('sha256').update(admin).digest('hex'),SERVICE_ENABLED:'true',ALLOWED_ORIGINS:'https://krakaur.github.io',MAX_DAILY_REQUESTS:'10000',MAX_DAILY_PER_ACCESS:'1000'}}));
 const evidence={publicRequests:0,requests:0,d1RowsRead:0,d1RowsWritten:0,reportedD1Calls:0,unknownD1Calls:0,cpuMilliseconds:null,cpuLimit:'Local execution does not measure public Workers CPU.'};
 const req=async(path,body,token=admin)=>{const response=await runtime.dispatchFetch('https://c9-local.test'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});evidence.requests++;const read=response.headers.get('X-D1-Rows-Read'),written=response.headers.get('X-D1-Rows-Written');if(read!==null&&written!==null){evidence.reportedD1Calls++;evidence.d1RowsRead+=Number(read);evidence.d1RowsWritten+=Number(written);}else evidence.unknownD1Calls++;return {status:response.status,data:await response.json()};};
 try{
  const db=await runtime.getD1Database('DB');let sql='';for(const file of ['0001_classroom.sql','0002_school_multiplayer.sql'])sql+=await readFile(new URL('../cloudflare/migrations/'+file,import.meta.url),'utf8');for(const statement of sql.match(/CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|INDEX)[\s\S]*?;/g))await db.prepare(statement).run();
  const room=await req('/admin-api/rooms',{name:'C9 pruebas sintéticas'});assert.equal(room.status,201);const teacher=room.data.token,classId=room.data.classId;
  const tasks=c9Tasks().map(t=>({...t,classId})),revision=(await req('/tasks',null,teacher)).data.revision;
  assert.equal((await req('/tasks',{tasks,expectedRevision:revision},teacher)).status,200);
  const tokens=[],sessions=[];let reasoningReplays=0;
  const reorder=x=>Array.isArray(x)?x.map(reorder):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).reverse().map(([key,value])=>[key,reorder(value)])):x;
  for(let i=0;i<4;i++){
   const inv=await req('/students',{},teacher);assert.equal(inv.status,200);tokens.push(inv.data.token);
   assert.equal((await req('/enrollment',{profile:profiles[i],enrollment:{school:'Escuela sintética',grade:'3',group:'C9',listNumber:i+1}},tokens[i])).status,200);
   for(const t of tasks){
    const s=completeReasoning(t,profiles[i],i);sessions.push(s);
    const ack=await req('/reports',report(s),tokens[i]);assert.equal(ack.status,200);assert.equal(ack.data.classId,classId);assert.equal(ack.data.profile,s.profile);assert.deepEqual(ack.data.accepted,[s.id]);assert(Number.isFinite(Date.parse(ack.data.receivedAt)));
    if(i===0){const replay=await req('/reports',reorder(report(s)),tokens[i]);assert.equal(replay.status,200);assert.deepEqual(replay.data.accepted,[s.id]);reasoningReplays++;}
   }
  }
  assert.equal(reasoningReplays,12);
  const altered=structuredClone(sessions[0]);altered.questions[0].reflection='Conflicto canónico';const fresh=completeReasoning(tasks[0],profiles[0]);
  const conflict=await req('/reports',{...report(fresh),sessions:[fresh,altered]},tokens[0]);assert.notEqual(conflict.status,200);
  let cursor=0,more=true,received=[],pages=0;while(more&&pages<20){const res=await req('/reports?after='+cursor,null,teacher);assert.equal(res.status,200);received.push(...res.data.reports.flatMap(r=>r.sessions));cursor=res.data.cursor;more=res.data.more;pages++;}
  assert.equal(more,false);assert.equal(received.length,48);assert.equal(new Set(received.map(sessionKey)).size,48);assert(!received.some(s=>s.id===fresh.id));for(const s of sessions)assert(equivalent(received.find(x=>sessionKey(x)===sessionKey(s)),s));
  Object.assign(evidence,{reasoningReceived:48,reasoningReplays,duplicates:0,atomicConflictRejected:true,maxSessionBytes:Math.max(...sessions.map(s=>Buffer.byteLength(JSON.stringify(s)))),pages});
  if(process.env.C9_WORKER_EVIDENCE)await writeFile(process.env.C9_WORKER_EVIDENCE,JSON.stringify(evidence,null,2));
 }finally{await runtime.dispose();}
});
