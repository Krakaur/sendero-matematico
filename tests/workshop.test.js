import test from 'node:test';
import assert from 'node:assert/strict';
import {PROJECT_ORDER,mission,solvedModel,modelCorrect,newWorkshop,currentMission,applyWorkshopAction,workshopSummary,validWorkshop,mergeWorkshopReports} from '../web/workshop.js';

test('All eight projects have feasible models in every level; distinct mathematical conditions matter',()=>{
  for(const kind of PROJECT_ORDER)for(let level=1;level<=4;level++)for(let seed=0;seed<100;seed++){
    const m=mission(kind,level,seed),solution=solvedModel(m);
    assert(modelCorrect(m,solution),`${kind}/${level}/${seed}`);
    assert(!modelCorrect(m,m.initial),`${kind} should require construction`);
    assert(m.reason>=0&&m.reason<3);
  }
  const sharing=mission('sharing',2,3),unequal=solvedModel(sharing);
  unequal.baskets[0]++;unequal.baskets[1]--;
  assert(!modelCorrect(sharing,unequal),'Conserving total alone does not establish equal sharing');
  const fraction=mission('fraction',3,4),duplicates=Array(fraction.take).fill(0);
  if(fraction.take>1)assert(!modelCorrect(fraction,{selected:duplicates}));
  const garden=mission('measure',2,12),areaInstead=solvedModel(garden);areaInstead.value=garden.a*garden.b;
  if(areaInstead.value!==2*(garden.a+garden.b))assert(!modelCorrect(garden,areaInstead));
});
test('Repeated unsuccessful checks never prevent a later valid construction or its follow-up',()=>{
 const s=newWorkshop(1,123),r=s.records[0];
 for(let i=0;i<110;i++)applyWorkshopAction(s,{type:'check'});
 assert.equal(r.checks.length,100);
 const m=currentMission(s);r.model=solvedModel(m);assert(applyWorkshopAction(s,{type:'check'}));
 applyWorkshopAction(s,{type:'reason',value:m.reason});assert.equal(r.phase,'verify');
 for(let i=0;i<110;i++)applyWorkshopAction(s,{type:'check'});
 r.model=solvedModel(currentMission(s));assert(applyWorkshopAction(s,{type:'check'}));
 assert.equal(r.phase,'done');assert(validWorkshop(s));
});

test('A model alone cannot complete a project; evidence and new checks survive serialization',()=>{
  const s=newWorkshop(2,1234);
  for(let i=0;i<8;i++){
    let m=currentMission(s),r=s.records[i];
    assert.equal(applyWorkshopAction(s,{type:'next'}),false);
    if(i===0)applyWorkshopAction(s,{type:'check'});
    if(i===1)applyWorkshopAction(s,{type:'hint'});
    r.model=solvedModel(m);applyWorkshopAction(s,{type:'check'});
    assert.equal(r.phase,'explain');
    assert.equal(applyWorkshopAction(s,{type:'next'}),false);
    if(i===2)applyWorkshopAction(s,{type:'reason',value:(m.reason+1)%3});
    applyWorkshopAction(s,{type:'reason',value:m.reason});
    if(i<3){assert.equal(r.phase,'verify');m=currentMission(s);r.model=solvedModel(m);applyWorkshopAction(s,{type:'check'});}
    assert.equal(r.phase,'done');assert(validWorkshop(JSON.parse(JSON.stringify(s))));
    applyWorkshopAction(s,{type:'next'});
  }
  assert(s.completedAt);assert(validWorkshop(s));
  assert.deepEqual(workshopSummary(s),{completed:8,independent:5,modelErrors:1,reasonErrors:1,verified:3,notes:0});
  const forged=structuredClone(s);forged.records[0].checks[0].correct=true;assert(!validWorkshop(forged));
});

test('Correction prompts a different construction for every project and level',()=>{
  for(const kind of PROJECT_ORDER)for(let level=1;level<=4;level++)for(let seed=0;seed<20;seed++){
    const s=newWorkshop(level,seed,kind),m=currentMission(s),r=s.records[0];
    applyWorkshopAction(s,{type:'hint'});r.model=solvedModel(m);applyWorkshopAction(s,{type:'check'});applyWorkshopAction(s,{type:'reason',value:m.reason});
    const v=currentMission(s);assert.notDeepEqual(solvedModel(v),solvedModel(m),`${kind}/${level}/${seed}: copied model must not pass`);
  }
});

test('Malformed imported state and invalid control actions are rejected',()=>{
  const s=newWorkshop(1,42);assert(validWorkshop(s));
  assert.equal(applyWorkshopAction(s,{type:'change',key:'__proto__',delta:1}),false);
  assert.equal(applyWorkshopAction(s,{type:'reason',value:1}),false);
  const forged=structuredClone(s);forged.records[0].model.value='<img>';assert(!validWorkshop(forged));
  const incomplete=structuredClone(s);incomplete.completedAt=new Date().toISOString();assert(!validWorkshop(incomplete));
  const sharing=newWorkshop(1,2,'sharing');
  for(let i=0;i<100;i++)applyWorkshopAction(sharing,{type:'basket',index:0,delta:1});
  assert.equal(sharing.records[0].model.baskets[0],currentMission(sharing).total);assert(validWorkshop(sharing));
});

test('Manual and classroom project reports merge without duplicates and preserve conflicting evidence',()=>{
 const p=newWorkshop(1,77);while(!p.completedAt){const m=currentMission(p);p.records[p.index].model=solvedModel(m);applyWorkshopAction(p,{type:'check'});applyWorkshopAction(p,{type:'reason',value:m.reason});applyWorkshopAction(p,{type:'next'});}
 const group={profile:'qa-manual',projects:[p]},existing=mergeWorkshopReports([],[group]);assert.equal(mergeWorkshopReports(existing,[group])[0].projects.length,1);
 const changed=structuredClone(group);changed.projects[0].records[0].explanation='Another explanation';assert.throws(()=>mergeWorkshopReports(existing,[changed]),/incompatibles/);assert.equal(existing[0].projects[0].records[0].explanation,'');
 assert.throws(()=>mergeWorkshopReports([],[{profile:'qa',projects:[newWorkshop(1,2)]}]),/no válido/);
});
