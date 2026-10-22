import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LIVE_SCHEMA,newLiveRoom,joinLiveRoom,connectLiveMember,reconcileLiveRoom,heartbeatLiveRoom,liveAction,liveCanonical,liveItem,expireLiveRoom,liveParticipation,validateLiveParticipation,liveSnapshot} from '../web/cloud-room-contract.js';
import {cloudViewKey,cloudArchiveState,cloudFocusIdentity,captureCloudUI,restoreCloudUI,restoreCloudFocus,patchCloudUI,cloudKeyChoice,cloudRecordsCSV} from '../web/cloud-room-ui.js';
import {cloudRoomHTML} from '../web/cloud-room-view.js';

const copy=x=>structuredClone(x);
const hash=x=>createHash('sha256').update(x).digest('hex');
const principals=Array.from({length:4},(_,seat)=>({classroom:'c12-ui-aula',role:'student',profile:`00096${seat+1}`,hash:hash(`c12-${seat}`),generation:0}));
const teacher={classroom:'c12-ui-aula',role:'teacher'};
function fixture(config={}){
  const r=newLiveRoom({id:'c12-ui-room',classroom:teacher.classroom,config:{trail:'multi',level:1,circuit:'bosque',mode:'coop',...config},seed:73,at:Date.parse('2026-01-01T00:00:00.000Z')});
  for(const [i,p] of principals.entries()){joinLiveRoom(r,p,r.clock);connectLiveMember(r,p,`socket-${i}`,0,r.clock);}
  const act=(seat,action)=>{
    const at=r.clock+200;
    for(const [i,p] of principals.entries())heartbeatLiveRoom(r,p,`socket-${i}`,at);
    const p=r.members[seat],e={schema:LIVE_SCHEMA,roomId:r.id,epoch:r.epoch,connectionGeneration:p.generation,clientSeq:p.nextSeq,actionId:`c12-ui-${seat}-${p.nextSeq}`,expectedVersion:r.version,expectedSeatVersion:p.seatVersion,action};
    const ack=liveAction(r,principals[seat],`socket-${seat}`,e,hash(liveCanonical(e)),at);assert.equal(ack.committed,true);return ack;
  };
  for(let seat=0;seat<4;seat++)act(seat,{type:'ready',value:true});
  reconcileLiveRoom(r,r.startAt+1);
  const running=liveSnapshot(r,principals[0]),q=liveItem(r,0,0);
  act(0,{type:'answer',questionId:q.id,questionIndex:0,choiceIndex:q.options.findIndex(v=>v!==q.answer)});
  act(0,{type:'hint',questionId:q.id,questionIndex:0});
  act(0,{type:'answer',questionId:q.id,questionIndex:0,choiceIndex:q.options.indexOf(q.answer)});
  expireLiveRoom(r,'teacher_closed',r.clock+200);
  const records=r.members.map(p=>({record:validateLiveParticipation(liveParticipation(r,p)),delivery:'received'}));
  return {running,snapshot:liveSnapshot(r,teacher),records};
}

test('C12 view signature preserves controls across heartbeat-only updates, without mutating the snapshot',()=>{
  const {running}=fixture(),before=copy(running),base=cloudViewKey(running,{connected:true});
  const heartbeat=copy(running);heartbeat.serverNow+=3000;heartbeat.elapsedMs+=3000;heartbeat.presenceVersion++;heartbeat.version++;
  heartbeat.self.generation++;heartbeat.self.nextSeq++;heartbeat.self.seatVersion++;
  assert.equal(cloudViewKey(heartbeat,{connected:true}),base);
  assert.deepEqual(running,before);
  const visibleChanges=[s=>s.question.chosen.push(1),s=>s.question.hint='Pista solicitada',s=>s.question.lastCorrect=false,s=>s.question.id='next-question',s=>s.players[1].connected=false,s=>s.players[1].index++,s=>s.status='paused',s=>s.epoch++];
  for(const alter of visibleChanges){const changed=copy(running);alter(changed);assert.notEqual(cloudViewKey(changed,{connected:true}),base);}
  assert.notEqual(cloudViewKey(running,{connected:false}),base);
  assert.notEqual(cloudViewKey(running,{connected:true,reduced:true}),base);
  assert.notEqual(cloudViewKey(null,{role:'teacher',current:null}),cloudViewKey(null,{role:'student',current:null}));
  const {snapshot,records}=fixture(),pending=copy(records);pending[0].delivery='pending';
  assert.notEqual(cloudViewKey(snapshot,{records}),cloudViewKey(snapshot,{records:pending}));
});

test('C12 keyboard numbers ignore composition, repeat, modifiers and editable fields',()=>{
  const key=(value,extra={})=>cloudKeyChoice({key:value,target:{tagName:'BUTTON'},...extra});
  assert.deepEqual(['1','2','3','4'].map(v=>key(v)),[0,1,2,3]);
  for(const flag of ['repeat','ctrlKey','metaKey','altKey','isComposing'])assert.equal(key('2',{[flag]:true}),null,flag);
  for(const tagName of ['INPUT','SELECT','TEXTAREA'])assert.equal(key('3',{target:{tagName}}),null,tagName);
  assert.equal(key('4',{target:{tagName:'SPAN',isContentEditable:true}}),null);
  for(const value of ['0','5','Enter','ArrowRight','!'])assert.equal(key(value),null,value);
});

test('C12 archive confirmation is separate from pedagogical completion and requires all receipts',()=>{
  const {snapshot,records}=fixture();assert(records.every(x=>x.record.status==='partial'));
  assert.deepEqual(cloudArchiveState(snapshot,records),{expected:4,received:4,invalid:0,complete:true});
  const partial=cloudArchiveState(snapshot,records.slice(0,3));assert.equal(partial.received,3);assert.equal(partial.complete,false);
  const pending=copy(records);pending[0].delivery='pending';assert.equal(cloudArchiveState(snapshot,pending).complete,false);
  const html=cloudRoomHTML(snapshot,{records:pending});assert.match(html,/3\/4 participaciones con acuse D1 confirmado/);assert.match(html,/id="cloud-archive"/);assert.doesNotMatch(html,/ Archivo de la sala confirmado\./);
  assert.match(cloudRoomHTML(snapshot,{records}),/Archivo de la sala confirmado/);
  assert.equal(cloudArchiveState({...snapshot,players:[]},[]).complete,false,'Zero participants is not a completed archive.');
});

test('C12 individually valid records from another condition cannot confirm the visible room',()=>{
  const {snapshot,records}=fixture();
  for(const config of [{mode:'race'},{trail:'suma'},{level:2},{circuit:'islas'}]){
    const other=fixture(config).records;for(const entry of other)validateLiveParticipation(entry.record);
    const result=cloudArchiveState(snapshot,other);assert.equal(result.complete,false,JSON.stringify(config));assert.equal(result.invalid,4);
  }
  const otherRoom=copy(records);for(const {record:r} of otherRoom){r.roomId='other-room';r.id=`live-other-room-s${r.seat}-v1`;validateLiveParticipation(r);}
  assert.equal(cloudArchiveState(snapshot,otherRoom).complete,false);
});

test('C12 archive binds visible progress, closure, content and participant identity without inventing absent fields',()=>{
  const {snapshot,records}=fixture();
  const alterations=[s=>s.players[0].index++,s=>s.players[0].name='Alias distinto',s=>s.elapsedMs++,s=>s.terminalReason='lifetime',s=>s.condition='other-condition',s=>s.contentVersion='other-version',s=>s.status='completed',s=>s.players[1].seat=s.players[0].seat];
  for(const alter of alterations){const changed=copy(snapshot);alter(changed);const result=cloudArchiveState(changed,records);assert.equal(result.complete,false);assert(result.invalid>0);}
  const repeatedProfile=copy(records);repeatedProfile[1].record.profile=repeatedProfile[0].record.profile;validateLiveParticipation(repeatedProfile[1].record);
  assert.equal(cloudArchiveState(snapshot,repeatedProfile).complete,false);
  assert.equal(cloudArchiveState(snapshot,[...records,copy(records[0])]).complete,false);
  const invalid=copy(records);invalid[0].record.metrics.correctFinal=8;assert.equal(cloudArchiveState(snapshot,invalid).complete,false);
});

// Small explicit DOM adapter for pure helper contracts. It does not certify browser focus/blur behavior.
function ui(){
  const document={activeElement:null},all=[];
  const node=(props={})=>{const n={dataset:{},tagName:'BUTTON',disabled:false,hidden:false,textContent:'',focusCalls:[],attributes:{},...props};n.focus=options=>{document.activeElement=n;n.focusCalls.push(options);};n.setAttribute=(key,value)=>{n.attributes[key]=value;};n.closest=selector=>selector==='#cloud-create-form'&&n.name?form:null;all.push(n);return n;};
  const form=node({id:'cloud-create-form',tagName:'FORM'}),question=node({dataset:{cloudQuestion:'q1'}}),choices=Array.from({length:4},(_,i)=>node({dataset:{cloudChoice:String(i)}}));
  const ids=new Map(['cloud-message','cloud-clock','cloud-pending','cloud-question-title','cloud-room-title','cloud-hint','cloud-ready','cloud-pause','cloud-discover','cloud-enter','cloud-csv'].map(id=>[id,node({id})]));
  const field=node({name:'mode',tagName:'SELECT',value:'coop',options:[{value:'coop'},{value:'race'}]});
  const detail=node({tagName:'DETAILS',dataset:{cloudDetail:'rules'},open:false}),summary=node({tagName:'SUMMARY',parentElement:detail});detail.querySelector=selector=>selector==='summary'?summary:null;
  const root={ownerDocument:document,contains:el=>all.includes(el),querySelectorAll(selector){return ({'[data-cloud-choice]':choices,'[id]':[...ids.values(),form],'#cloud-create-form [name]':[field],'details[data-cloud-detail]':[detail],'details[data-cloud-detail][open]':detail.open?[detail]:[],'#cloud-create-form button':[]})[selector]||[];},querySelector(selector){if(selector==='[data-cloud-question]')return question;if(selector.startsWith('#'))return ids.get(selector.slice(1))||null;return this.querySelectorAll(selector)[0]||null;}};
  return {root,document,question,choices,ids,field,detail,summary};
}

test('C12 pending is not evidence of emission; failed persistence keeps the actual message and confirmed progress',()=>{
  const dom=ui(),snapshot=fixture().running,before=copy(snapshot);
  patchCloudUI(dom.root,{snapshot,message:'No se envió: no se pudo guardar el pendiente.',pending:{action:{type:'answer'}},connected:true});
  assert.match(dom.ids.get('cloud-message').textContent,/No se envió/);
  assert.match(dom.ids.get('cloud-pending').textContent,/Respuesta pendiente de confirmación/);
  assert.doesNotMatch(dom.ids.get('cloud-pending').textContent,/enviada|recibida/i);
  assert(dom.choices.every(el=>el.disabled));assert.equal(dom.question.attributes['aria-busy'],'true');assert.deepEqual(snapshot,before);
  patchCloudUI(dom.root,{snapshot,pending:{action:{type:'answer'}},connected:false});assert.match(dom.ids.get('cloud-pending').textContent,/reconecta/);
  snapshot.question.chosen=[1];patchCloudUI(dom.root,{snapshot,pending:null,connected:true});
  assert.equal(dom.ids.get('cloud-pending').hidden,true);assert.equal(dom.question.attributes['aria-busy'],'false');assert.deepEqual(dom.choices.map(el=>el.disabled),[false,true,false,false]);
  patchCloudUI(dom.root,{snapshot,pending:null,connected:true,busy:true});assert(dom.choices.every(el=>el.disabled));
  patchCloudUI(dom.root,{snapshot:{...snapshot,status:'paused'},pending:null,connected:true});assert(dom.choices.every(el=>el.disabled));
});

test('C12 focus follows the same question only; a new or disabled answer moves to the heading',()=>{
  const d=ui();d.document.activeElement=d.choices[2];const key=cloudFocusIdentity(d.root);assert.deepEqual(key,{choice:'2',question:'q1'});
  restoreCloudFocus(d.root,key);assert.equal(d.document.activeElement,d.choices[2]);assert.deepEqual(d.choices[2].focusCalls.at(-1),{preventScroll:true});
  d.question.dataset.cloudQuestion='q2';restoreCloudFocus(d.root,key);assert.equal(d.document.activeElement,d.ids.get('cloud-question-title'));
  d.question.dataset.cloudQuestion='q1';d.choices[2].disabled=true;restoreCloudFocus(d.root,key);assert.equal(d.document.activeElement,d.ids.get('cloud-question-title'));
  d.question.dataset.cloudQuestion='q2';restoreCloudFocus(d.root,{id:'cloud-hint',question:'q1'});assert.equal(d.document.activeElement,d.ids.get('cloud-question-title'));
  d.document.activeElement={tagName:'INPUT'};assert.equal(cloudFocusIdentity(d.root),null,'An unrelated editor must not be captured.');
});

test('C12 form and disclosure restoration accepts available choices without stealing outside focus',()=>{
  const d=ui();d.field.value='race';d.detail.open=true;d.document.activeElement=d.field;const saved=captureCloudUI(d.root);
  d.field.value='coop';d.detail.open=false;const outside={tagName:'INPUT'};d.document.activeElement=outside;
  restoreCloudUI(d.root,saved,{focus:false});assert.equal(d.field.value,'race');assert.equal(d.detail.open,true);assert.equal(d.document.activeElement,outside);
  restoreCloudUI(d.root,{fields:[['mode','invented']],details:[],focus:null});assert.equal(d.field.value,'race');assert.equal(d.detail.open,false);
  d.document.activeElement=d.summary;assert.deepEqual(cloudFocusIdentity(d.root),{detail:'rules'});
  restoreCloudFocus(d.root,{detail:'rules'});assert.equal(d.document.activeElement,d.summary);
});

function parseCSV(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&c===','){row.push(cell);cell='';}else if(!quoted&&c==='\r'&&text[i+1]==='\n'){row.push(cell);rows.push(row);row=[];cell='';i++;}else cell+=c;}
  assert.equal(quoted,false);assert.deepEqual(row,[]);assert.equal(cell,'');const [headers,...data]=rows;return data.map(values=>{assert.equal(values.length,headers.length);return Object.fromEntries(headers.map((h,i)=>[h,values[i]]));});
}

test('C12 CSV preserves exact chronology and denominators but cannot upgrade imported receipt provenance',()=>{
  const {records,snapshot}=fixture(),before=copy(records);
  const remote=parseCSV(cloudRecordsCSV(records,{source:'server-read',roomId:snapshot.id,serviceOrigin:'https://aula.example.test/private?token=not-exported'}));
  assert.equal(remote.length,4);assert(remote.every(r=>r.delivery==='received'&&r.source==='server-read'&&r.service_origin==='https://aula.example.test'));
  for(let i=0;i<4;i++){const r=records[i].record;assert.equal(remote[i].profile,r.profile);assert.equal(Number(remote[i].seat),r.seat);assert.equal(Number(remote[i].planned),8);assert.equal(Number(remote[i].correct_final),r.metrics.correctFinal);assert.deepEqual(JSON.parse(remote[i].questions_json),r.questions);assert.deepEqual(JSON.parse(remote[i].pause_intervals_json),r.pauseIntervals);}
  const imported=parseCSV(cloudRecordsCSV(records,{source:'imported',serviceOrigin:'https://aula.example.test'}));assert(imported.every(r=>r.delivery==='unverified'&&r.service_origin===''&&r.source_scope.includes('unverified')));
  const pending=copy(records);pending[0].delivery='pending';assert.equal(parseCSV(cloudRecordsCSV(pending,{source:'server-read'}))[0].delivery,'pending');
  assert.deepEqual(records,before);
});

test('C12 CSV rejects duplicates and wrong-room exports, and escapes allowed formula-like identifiers',()=>{
  const {records}=fixture();
  assert.throws(()=>cloudRecordsCSV([]));assert.throws(()=>cloudRecordsCSV(records,{source:'invented'}));assert.throws(()=>cloudRecordsCSV([...records,records[0]]));assert.throws(()=>cloudRecordsCSV(records,{roomId:'different-room'}));
  const different=copy(records[0]);different.record.roomId='second-room';different.record.id='live-second-room-s0-v1';validateLiveParticipation(different.record);
  assert.equal(parseCSV(cloudRecordsCSV([records[0],different])).length,2,'Generic export allows multiple rooms only when roomId is unspecified.');
  assert.throws(()=>cloudRecordsCSV([records[0],different],{roomId:records[0].record.roomId}));
  const formulaLike=copy(records[0]);formulaLike.record.profile='-000941';validateLiveParticipation(formulaLike.record);assert.equal(parseCSV(cloudRecordsCSV([formulaLike]))[0].profile,"'-000941");
  const corrupt=copy(records[0]);corrupt.record.questions[0].item.prompt='=HYPERLINK("external")';assert.throws(()=>cloudRecordsCSV([corrupt]));
});
