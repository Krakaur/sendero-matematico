import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {createPortable,loginPortable,uploadPortable,fetchPortable} from '../web/portable-account.js';
import {validateSnapshot,restoreSnapshot} from '../web/backup.js';
import {newAssignedSession,recordReasoningSupport} from '../web/core.js';
import {PROFILE_INDEX} from '../web/profiles.js';
import {TASK_SCHEMA} from '../web/assignments.js';
import {REASONING_SUPPORT_FAMILIES} from '../web/reasoning-support.js';

test('portable copy accepts a paused supported-reasoning task and preserves its evidence',()=>{
  const family=REASONING_SUPPORT_FAMILIES[0],profile='000102';
  const task={schema:TASK_SCHEMA,classId:'000-class',id:'000-supported',version:1,title:'Relaciones con apoyo',trail:'razonar',contentId:'reasoning-supported-pack',contentVersion:1,parameters:{family:family.id,level:family.level,variant:1},completionRule:{kind:'answered_items',count:4},recipientProfileIds:[profile],assignedAt:'2026-10-21T00:00:00Z'};
  const current=newAssignedSession(task,profile);
  recordReasoningSupport(current.questions[0],'scaffold');
  current.questions[0].reflection='Explicación de prueba';
  const copy=validateSnapshot({profile:{id:profile,name:'Prueba 000102',role:'student'},state:{profile,sessions:[],teacher:[],adaptive:{},current}});
  assert.equal(copy.state.current.questions[0].reflection,'Explicación de prueba');
  assert.equal(copy.state.current.taskProtocol,6);
});

test('recovery rolls back profile and index when saving its device credential fails',async()=>{
  const values=new Map([[PROFILE_INDEX,'[]']]);
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const snapshot=validateSnapshot({profile:{id:'000104',name:'Prueba 000104',role:'student'},state:{profile:'000104',sessions:[],teacher:[],adaptive:{},current:null}});
  await assert.rejects(restoreSnapshot(storage,snapshot,'Test-only-strong-passphrase',{afterWrite:()=>{throw Error('auth store failed');}}),/auth store failed/);
  assert.equal(storage.getItem('sendero.profile.000104'),null);
  assert.equal(storage.getItem(PROFILE_INDEX),'[]');
});

test('portable account: encrypted registration, recovery, CAS and account isolation',async()=>{
  const bundle=await build({entryPoints:['cloudflare/worker.mjs'],bundle:true,format:'esm',write:false,platform:'browser',target:'es2022'});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-10-14',d1Databases:['DB'],bindings:{SERVICE_ENABLED:'true',ALLOWED_ORIGINS:'https://krakaur.github.io',MAX_DAILY_REQUESTS:'10000'}}));
  try{
    const db=await mf.getD1Database('DB');
    for(const name of ['0001_classroom.sql','0004_portable_accounts.sql']){
      const sql=await readFile(new URL('../cloudflare/migrations/'+name,import.meta.url),'utf8');
      for(const statement of sql.match(/CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|INDEX)[\s\S]*?;/g)||[])await db.prepare(statement).run();
    }
    const fetcher=(url,options)=>mf.dispatchFetch(url,options);
    const storage=new Map();const local={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
    const profile={id:'000101',name:'Prueba 000101',role:'student'};
    const state={profile:profile.id,sessions:[],teacher:[],adaptive:{},current:null,sound:false};
    const password='Test-only-strong-passphrase-000101';
    const created=await createPortable(profile,state,password,local,fetcher);
    assert.match(created.code,/^[A-F0-9]{4}(?:-[A-F0-9]{4}){7}$/);
    const row=await db.prepare('SELECT snapshot,verifier_hash,revision FROM portable_accounts').first();
    assert.equal(row.revision,1);
    assert(!row.snapshot.includes(profile.name));
    assert(!row.snapshot.includes(password));
    assert(!row.verifier_hash.includes(password));
    const other={id:'000103',name:'Prueba 000103',role:'student'};
    const otherPassword='Test-only-strong-passphrase-000103';
    const otherAccount=await createPortable(other,{...state,profile:other.id},otherPassword,local,fetcher);
    await assert.rejects(loginPortable(created.code,otherPassword,fetcher),error=>error.status===401);
    assert.equal((await loginPortable(otherAccount.code,otherPassword,fetcher)).snapshot.profile.id,other.id);
    await assert.rejects(loginPortable(created.code,password,async()=>Response.json({salt:'invalid'})),/desafío incompatible/);
    await assert.rejects(loginPortable(created.code,'wrong password',fetcher));
    const recovered=await loginPortable(created.code,password,fetcher);
    assert.deepEqual(recovered.snapshot.state.sessions,[]);
    assert.equal(recovered.snapshot.profile.id,profile.id);
    const changed={...state,adaptive:{suma:{level:2,streak:1,support:0}}};
    const updated=await uploadPortable(profile,changed,created.auth,fetcher);
    assert.equal(updated.revision,2);
    const remote=await fetchPortable(recovered.auth,fetcher);
    assert.equal(remote.revision,2);
    assert.equal(remote.snapshot.state.adaptive.suma.level,2);
    await assert.rejects(uploadPortable(profile,{...state,sound:true},recovered.auth,fetcher),error=>error.status===409);
    assert.equal((await fetchPortable(updated,fetcher)).snapshot.state.sound,false);
    let pending;
    const lostAck=async(url,options)=>{const response=await fetcher(url,options);if(url.endsWith('/portable/save')&&response.ok)throw Error('ack lost');return response;};
    const changedAgain={...changed,sound:true};
    await assert.rejects(uploadPortable(profile,changedAgain,updated,lostAck,value=>{pending=value;}),/ack lost/);
    assert.equal((await fetchPortable(updated,fetcher)).revision,3);
    const replayed=await uploadPortable(profile,changedAgain,{...updated,pending},fetcher);
    assert.equal(replayed.revision,3);
    const altered={...pending,snapshot:{...pending.snapshot,data:pending.snapshot.data.slice(0,-4)+'AAAA'}};
    const forged=await fetcher('https://sendero-aula.dirkhans.workers.dev/portable/save',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${updated.token}`},body:JSON.stringify(altered)});
    assert.equal(forged.status,409);
    const revoked=await fetcher('https://sendero-aula.dirkhans.workers.dev/portable/logout',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${updated.token}`},body:'{}'});
    assert.equal(revoked.status,200);
    await assert.rejects(fetchPortable(updated,fetcher),error=>error.status===401);
    const unauthorized=await mf.dispatchFetch('https://sendero-aula.dirkhans.workers.dev/portable/state',{headers:{Authorization:'Bearer '+'0'.repeat(64)}});
    assert.equal(unauthorized.status,401);
    await db.prepare("WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<98) INSERT INTO portable_accounts(code_hash,salt,verifier_hash,profile_id,revision,snapshot,created_at,updated_at) SELECT printf('%064x',x), '0000000000000000000000==', printf('%064x',x), '000xxx', 1, '{}', '2026-10-22', '2026-10-22' FROM n").run();
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM portable_accounts').first()).n,100);
    await assert.rejects(createPortable({id:'000105',name:'Prueba 000105',role:'student'},{...state,profile:'000105'},password,local,fetcher),error=>error.status===503);
  }finally{await mf.dispose();}
});
