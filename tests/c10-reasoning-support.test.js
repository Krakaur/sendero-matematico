import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {REASONING_C9_FAMILIES,reasoningC9Items} from '../web/reasoning-c9.js';
import {REASONING_SUPPORT_FAMILIES,REASONING_SUPPORT_SOURCE,REASONING_SUPPORT_VERSION,REASONING_SUPPORT_PROTOCOL,
  validReasoningSupportedTask,reasoningSupportedItems,reasoningSupportedDescription,reasoningScaffoldText,
  reasoningSupportEvent,validateReasoningSupportEvents,reasoningSupportEvidence,reasoningScaffoldHTML,reasoningFeedbackHTML} from '../web/reasoning-support.js';

const tasks=()=>REASONING_SUPPORT_FAMILIES.flatMap(f=>[1,2].map(variant=>({contentId:'reasoning-supported-pack',contentVersion:1,trail:'razonar',
  parameters:{family:f.id,level:f.level,variant},completionRule:{kind:'answered_items',count:4}})));
const all=()=>tasks().flatMap(reasoningSupportedItems);
const clone=structuredClone;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fullTrajectory(q){
  const events=[];
  events.push(reasoningSupportEvent(q,events,'scaffold'));
  for(const value of q.options.filter(n=>n!==q.answer)){
    events.push({type:'wrong',value});events.push(reasoningSupportEvent(q,events,'feedback'));
  }
  events.push({type:'hint'},{type:'solution'},{type:'correct',value:q.answer});
  return events;
}

test('C10 apoyado: 48 copias semánticas C9 conservan procedencia sin cambiar el banco anterior',()=>{
  assert.equal(REASONING_SUPPORT_PROTOCOL,6);assert.deepEqual(REASONING_SUPPORT_FAMILIES,REASONING_C9_FAMILIES);
  assert.equal(tasks().length,12);const items=all();assert.equal(items.length,48);
  assert.equal(new Set(items.map(q=>q.bankId)).size,48);assert.equal(new Set(items.map(q=>q.sourceBankId)).size,48);
  assert.equal(REASONING_SUPPORT_SOURCE.sha256Encoding,'utf8-lf');
  const sourceHash=createHash('sha256').update(readFileSync(new URL('../web/reasoning-c9.js',import.meta.url),'utf8').replace(/\r\n/g,'\n')).digest('hex');
  assert.equal(sourceHash,REASONING_SUPPORT_SOURCE.sha256,'La derivación exige la fuente C9 congelada declarada.');
  for(const task of tasks()){
    assert.equal(validReasoningSupportedTask(task),true);
    const source=reasoningC9Items({...task,contentId:'reasoning-fixed-pack',contentVersion:2});
    const copies=reasoningSupportedItems(task);
    copies.forEach((q,index)=>{
      const s=source[index];assert.equal(q.sourceBankId,s.bankId);assert.equal(q.sourceBankVersion,'reasoning-fixed-pack@2');
      assert.equal(q.bankVersion,REASONING_SUPPORT_VERSION);assert.equal(q.bankId,s.bankId.replace(/^c9-/,'c10s-'));
      for(const [key,value] of Object.entries(s))if(!['id','bankId','bankVersion','context'].includes(key))assert.deepEqual(q[key],value,`${q.bankId}/${key}`);
      assert.equal(q.scaffoldVersion,1);assert.ok(q.scaffold.rows.length>=2);assert.ok(q.scaffold.title);
    });
    copies[0].scaffold.title='cambio local';copies[0].labels[0]='texto ajeno';
    assert.notEqual(reasoningSupportedItems(task)[0].scaffold.title,'cambio local');assert.deepEqual(reasoningC9Items({...task,contentId:'reasoning-fixed-pack',contentVersion:2}),source);
    assert.match(reasoningSupportedDescription(task),/sólo a solicitud/);assert.match(reasoningSupportedDescription(task),/sin calibración/);
  }
  const invalid=tasks()[0];invalid.parameters.extra=1;assert.equal(validReasoningSupportedTask(invalid),false);
  assert.throws(()=>reasoningSupportedItems(invalid));assert.equal(reasoningSupportedItems({contentId:'reasoning-fixed-pack'}),null);
  assert.equal(validReasoningSupportedTask({...tasks()[0],contentVersion:2}),false);
});

test('C10 apoyado: ninguno de los 48 apoyos se muestra sin solicitud y todos conservan datos y unidades',()=>{
  const types=new Set(),scales={};
  for(const q of all()){
    assert.equal(reasoningScaffoldHTML(q),'');assert.equal(reasoningFeedbackHTML(q),'');
    const event=reasoningSupportEvent(q,[],'scaffold'),html=reasoningScaffoldHTML(q,[event]);
    assert.equal(event.text,reasoningScaffoldText(q));assert.equal(event.scaffoldVersion,1);
    if(html.includes("<svg")){assert.match(html,/aria-hidden="true"/);assert.match(html,/focusable="false"/);}
    assert.match(html,/aria-label="Apoyo visual solicitado"/);
    assert.ok(html.includes(esc(q.scaffold.title)));assert.ok(html.includes(esc(q.scaffold.description)));
    assert.ok(html.includes(esc(q.scaffold.questionMark)));
    for(const row of q.scaffold.rows){assert.ok(html.includes(esc(row.label)));assert.ok(html.includes(esc(row.value===null?'?':row.value)));if(row.unit)assert.ok(html.includes(esc(row.unit)));}
    assert.ok(!html.includes(esc(q.explanation)));assert.ok(q.errorFeedback.every(text=>!html.includes(esc(text))));
    assert.doesNotMatch(html,/data-answer|data-correct|<script|<foreignObject|onload=|onclick=|<animate|<image|<use/i);
    if(q.scaffold.scale==='not-to-scale')assert.match(html,/no a escala/);
    if(q.scaffold.type==='rectangle'){assert.equal((html.match(/<rect /g)||[]).length,1);assert.match(html,/scaffold-dimensions/);}
    if(q.scaffold.scale==='zero'){
      assert.equal(q.scaffold.type,'table');assert.ok(q.scaffold.rows.every(r=>typeof r.value==='number'&&r.unit===q.scaffold.rows[0].unit));
      assert.match(html,/Barras desde cero/);
    }
    types.add(q.scaffold.type);scales[q.scaffold.scale]=(scales[q.scaffold.scale]||0)+1;
  }
  assert.equal(types.size,6);assert.deepEqual(scales,{'not-to-scale':16,none:28,zero:4});
});

test('C10 apoyado: 48 replay máximos conservan 10 eventos, tres feedbacks y respuesta asistida',()=>{
  for(const q of all()){
    const events=fullTrajectory(q),state=validateReasoningSupportEvents(q,events),evidence=reasoningSupportEvidence(q,events);
    assert.equal(events.length,10);assert.equal(state.attempts.length,4);assert.equal(state.feedbackChoices.length,3);
    assert.equal(state.scaffoldShown,true);assert.equal(state.hint,true);assert.equal(state.solutionRequested,true);
    assert.equal(state.done,true);assert.equal(state.first,false);assert.equal(state.final,true);assert.equal(state.firstWithoutHelp,false);
    assert.deepEqual([evidence.answered,evidence.first,evidence.independent,evidence.final,evidence.hints,evidence.solutions,evidence.scaffolds,evidence.feedbackItems,evidence.feedbackRequests],[1,0,0,1,1,1,1,1,3]);
    const html=reasoningFeedbackHTML(q,events);for(const event of events.filter(e=>e.type==='feedback')){
      assert.ok(html.includes(esc(event.text)));assert.ok(html.includes(esc(q.labels[event.correctedChoice])));
    }
    assert.equal(reasoningSupportEvent(q,events,'scaffold'),null);assert.equal(reasoningSupportEvent(q,events,'feedback'),null);
  }
});

test('C10 apoyado: acertar tras una representación no se cuenta como primera respuesta independiente',()=>{
  const q=all()[0],independent=[{type:'correct',value:q.answer}],scaffold=reasoningSupportEvent(q,[],'scaffold');
  assert.equal(reasoningSupportEvidence(q,independent).independent,1);
  const e=reasoningSupportEvidence(q,[scaffold,...independent]);assert.equal(e.first,1);assert.equal(e.final,1);assert.equal(e.independent,0);
  assert.equal(reasoningSupportEvidence(q,[{type:'hint'},...independent]).independent,0);
});

test('C10 apoyado: feedback solicita una orientación de la última elección incorrecta, sin sustituirla por la respuesta correcta',()=>{
  const q=all()[0],wrong=q.options.filter(n=>n!==q.answer),events=[{type:'wrong',value:wrong[0]}];
  assert.equal(reasoningSupportEvent(q,[],'feedback'),null);
  const feedback=reasoningSupportEvent(q,events,'feedback');assert.equal(feedback.correctedChoice,wrong[0]);assert.equal(feedback.text,q.errorFeedback[wrong[0]]);
  assert.notEqual(feedback.correctedChoice,q.answer);events.push(feedback);
  assert.equal(reasoningSupportEvent(q,events,'feedback'),null);
  events.push({type:'wrong',value:wrong[1]});const second=reasoningSupportEvent(q,events,'feedback');
  assert.equal(second.correctedChoice,wrong[1]);assert.throws(()=>validateReasoningSupportEvents(q,[...events,feedback]));
  assert.equal(validateReasoningSupportEvents(q,[...events,second]).final,false,'Cerrar con un error sigue siendo admisible.');
});

test('C10 apoyado: rechazo de texto/versión/elección extraños, repeticiones, eventos terminales y contenido alterado',()=>{
  const q=all()[0],wrong=q.options.find(n=>n!==q.answer),scaffold=reasoningSupportEvent(q,[],'scaffold');
  const feedback=reasoningSupportEvent(q,[{type:'wrong',value:wrong}],'feedback');
  for(const forged of [{...scaffold,text:'texto no presentado'},{...scaffold,scaffoldVersion:2},{...scaffold,sourceBankId:'otro'},
    {...scaffold,extra:true}])assert.throws(()=>validateReasoningSupportEvents(q,[forged,{type:'correct',value:q.answer}]));
  for(const forged of [{...feedback,text:'elige la respuesta correcta'},{...feedback,correctedChoice:q.answer},{...feedback,feedbackVersion:2},
    {...feedback,bankVersion:'reasoning-fixed-pack@2'},{...feedback,extra:true}])assert.throws(()=>validateReasoningSupportEvents(q,[{type:'wrong',value:wrong},forged]));
  assert.throws(()=>validateReasoningSupportEvents(q,[scaffold,scaffold,{type:'wrong',value:wrong}]));
  assert.throws(()=>validateReasoningSupportEvents(q,[{type:'correct',value:q.answer},scaffold]));
  assert.throws(()=>validateReasoningSupportEvents(q,[{type:'wrong',value:wrong},{type:'wrong',value:wrong}]));
  assert.throws(()=>validateReasoningSupportEvents(q,[feedback]));assert.throws(()=>validateReasoningSupportEvents(q,[{type:'solution'}]));
  assert.throws(()=>validateReasoningSupportEvents(q,[{type:'correct',value:wrong}]));assert.throws(()=>validateReasoningSupportEvents(q,[]));
  assert.throws(()=>validateReasoningSupportEvents(q,[...fullTrajectory(q),{type:'hint'}]));
  assert.deepEqual(validateReasoningSupportEvents(q,[],{pending:true}).attempts,[]);
  const tampered=clone(q);tampered.scaffold.title='<img onerror=alert(1)>';
  assert.throws(()=>reasoningScaffoldHTML(tampered,[scaffold]));assert.throws(()=>reasoningScaffoldText(tampered));
  const semantic=clone(q);semantic.prompt='Otra tarea';assert.throws(()=>reasoningSupportEvent(semantic,[],'scaffold'));
});

test('C10 apoyado: 12 snapshots máximos previstos quedan bajo el límite de transporte de 32 KiB',()=>{
  for(const task of tasks()){
    const session={id:'000-c10-supported',profile:'000801',trail:'razonar',level:task.parameters.level,version:'c10-candidate',
      startedAt:'2026-10-21T00:00:00Z',completedAt:'2026-10-21T00:02:00Z',index:3,
      assignment:{schema:'sendero.assignment.v2',classId:'000-class',id:'000-supported',version:1,title:'Razonamiento con apoyos optativos',assignedAt:'2026-10-21T00:00:00Z',...task},
      assignmentId:'000-supported',assignmentVersion:1,taskProtocol:6,responseMode:'choice',completionAction:{kind:'finish-task',at:'2026-10-21T00:02:00Z'},
      questions:reasoningSupportedItems(task).map(q=>{
        const events=fullTrajectory(q),s=validateReasoningSupportEvents(q,events);
        // 600 UTF-16 characters and exactly 2402 JSON bytes: the existing
        // reflection envelope's maximum, rather than a short ASCII note.
        return {...q,attempts:s.attempts,events,hint:s.hint,solutionShown:s.solutionShown,solutionRequested:s.solutionRequested,done:s.done,activeMs:1000,supportProtocol:6,reflection:'\u0000'.repeat(360)+'a'.repeat(240)};
      })};
    assert.ok(Buffer.byteLength(JSON.stringify(session))<=32768,JSON.stringify(task.parameters));
  }
  // This is a bounded payload check; root must separately exercise shared server
  // validation, strict field whitelist and HTTP receipt/import rejection.
});
