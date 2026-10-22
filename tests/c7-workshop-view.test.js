import test from 'node:test';
import assert from 'node:assert/strict';
import {mission,solvedModel,newWorkshop,currentMission,applyWorkshopAction,validWorkshop} from '../web/workshop.js';
import {modelHTML,workshopProgressHTML,workshopHTML,workshopControlIdentity} from '../web/workshop-view.js';

function completedWorkshop() {
  const s=newWorkshop(2,321);
  for(let i=0;i<8;i++) {
    let m=currentMission(s),r=s.records[i];
    if(i===0) {applyWorkshopAction(s,{type:'check'});applyWorkshopAction(s,{type:'hint'});}
    r.model=solvedModel(m);applyWorkshopAction(s,{type:'check'});
    if(i===1)applyWorkshopAction(s,{type:'reason',value:(m.reason+1)%3});
    applyWorkshopAction(s,{type:'reason',value:m.reason});
    if(r.phase==='verify') {
      if(i===1)applyWorkshopAction(s,{type:'hint'});
      m=currentMission(s);r.model=solvedModel(m);applyWorkshopAction(s,{type:'check'});
    }
    applyWorkshopAction(s,{type:'next'});
  }
  assert(validWorkshop(s));return s;
}

test('C7 report reconstructs all eight model families, preserving initial failure and later correction',()=>{
  const s=completedWorkshop(),html=workshopProgressHTML([s]);
  assert.equal((html.match(/class="project-record"/g)||[]).length,8);
  assert(html.includes('8/8 retos resueltos'));assert(html.includes(s.id));assert(html.includes(s.startedAt));
  const m=mission('balance',s.level,s.records[0].seed),r=s.records[0];
  assert(html.includes(`${m.a} iniciales + 0 añadidas = ${m.a}`));
  assert(html.includes(`${m.a} iniciales + ${r.checks[1].model.value} añadidas = ${m.total}`));
  assert(html.includes('Comprobación 1: aún no cumple la condición'));
  assert(html.includes('Comprobación 2: cumple la condición'));
  for(const label of ['Cesta 1:','plantas.','partes elegidas:','Cerca propuesta:','Categorías elegidas:','Continuación elegida en orden:','Etapa 1:'])assert(html.includes(label),label);
});

test('C7 report identifies the chosen explanations, support uncertainty and separate new probe',()=>{
  const s=completedWorkshop(),r=s.records[1],m=mission(r.kind,s.level,r.seed);
  const html=workshopProgressHTML([s]);
  assert(html.includes(m.reasons[r.reasonAttempts[0]]));
  assert(html.includes(m.reasons[r.reasonAttempts[1]]));
  assert(html.includes('no corresponde al modelo'));
  assert(html.includes('La pista ya estaba abierta al iniciar esta fase'));
  assert(html.includes('No constaba una pista abierta al iniciar esta fase'));
  assert(html.includes('no distingue una petición posterior'));
  assert(html.includes('no acredita por sí sola transferencia independiente'));
  assert(html.includes('no afecta al resultado'));
  const older=structuredClone(s);
  delete older.records[0].verification.hintAtStart;
  assert(validWorkshop(older));
  assert(workshopProgressHTML([older]).includes('No consta si la pista estaba abierta al iniciar esta fase'));
});

test('C7 report treats the optional student note as text and does not create active markup',()=>{
  const s=completedWorkshop();
  s.records[0].explanation='<img src=x onerror="alert(1)"> & <script>bad()</script>';
  assert(validWorkshop(s));
  const html=workshopProgressHTML([s]);
  assert(!html.includes('<img src=x'));
  assert(!html.includes('<script>bad()'));
  assert(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &lt;script&gt;'));
  assert(html.includes('Nota propia opcional'));
  assert(!html.includes('Construiste y justificaste'));
});

test('C7 report does not turn absent checks into a claim of no work, and discloses the six-session display limit',()=>{
  const s=newWorkshop(1,33),html=workshopProgressHTML([s]);
  assert(html.includes('Sin comprobación registrada en esta fase'));
  assert(html.includes('no permite concluir que no hubo trabajo'));
  assert(html.includes('0/8 retos resueltos'));
  assert(!html.includes('0%'));
  const history=Array.from({length:7},()=>structuredClone(s));
  assert(workshopProgressHTML(history).includes('últimas 6 de 7 sesiones disponibles en esta vista'));
});

test('C7 fraction layout defines a complete unit and exposes selected state beyond color',()=>{
  for(const [level,parts,columns] of [[1,2,2],[2,4,4],[3,6,3],[4,8,4]]) {
    const m=mission('fraction',level,2),x=solvedModel(m),html=modelHTML(m,x);
    assert.equal(m.parts,parts);
    assert(html.includes(`--bread-cols:${columns}`));
    assert.equal(parts%columns,0);
    assert.equal((html.match(/class="bread-piece"/g)||[]).length,parts);
    assert.equal((html.match(/aria-pressed="true"/g)||[]).length,m.take);
    assert.equal((html.match(/>✓<\/span>/g)||[]).length,m.take);
  }
});

test('C7 control identities survive selection state changes and distinguish model actions',()=>{
  assert.equal(workshopControlIdentity({projectSelect:'1'}),workshopControlIdentity({projectSelect:'1',pressed:'true'}));
  assert.notEqual(workshopControlIdentity({projectSelect:'1'}),workshopControlIdentity({projectSelect:'2'}));
  assert.notEqual(workshopControlIdentity({projectChange:'rows',delta:'1'}),workshopControlIdentity({projectChange:'columns',delta:'1'}));
  assert.notEqual(workshopControlIdentity({projectPath:'1',value:'5'}),workshopControlIdentity({projectPath:'2',value:'5'}));
  assert.equal(workshopControlIdentity({}),null);
});

test('C7 starting and finishing copy declares eight tasks and does not equate selection with authored explanation',()=>{
  const hub=workshopHTML({workshop:null,workshopHistory:[]});
  assert(hub.includes('Cada proyecto individual abre ocho retos de esa familia'));
  assert.equal((hub.match(/Comenzar ocho retos/g)||[]).length,8);
  const done=workshopHTML({workshop:completedWorkshop()});
  assert(done.includes('Construiste modelos y elegiste explicaciones en ocho retos'));
  assert(!done.includes('justificaste'));
});
