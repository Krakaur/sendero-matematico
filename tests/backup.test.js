import test from 'node:test';import assert from 'node:assert/strict';
import {encryptBackup,decryptBackup,restoreSnapshot} from '../web/backup.js';import {newSession,recordAttempt} from '../web/core.js';import {profileKey,loginProfile} from '../web/profiles.js';
import {newWorkshop,currentMission,solvedModel,applyWorkshopAction} from '../web/workshop.js';
test('Encrypted backup restores pending work with a new password and rejects tampering',async()=>{
 const profile={id:'test-backup',name:'Colibri',role:'student'},state={profile:profile.id,sessions:[],teacher:[],adaptive:{suma:{level:2}},current:newSession('suma',2,profile.id),classroom:{token:'must-not-be-exported'},practiceMemory:{suma:{step:4}}};
 const envelope=await encryptBackup(profile,state,'respaldo-seguro');assert(!JSON.stringify(envelope).includes('Colibri'));
 const snapshot=await decryptBackup(envelope,'respaldo-seguro');assert.equal(snapshot.state.current.id,state.current.id);assert(!snapshot.state.classroom);
 await assert.rejects(()=>decryptBackup(envelope,'contraseña-erronea'));
 await assert.rejects(()=>decryptBackup({...envelope,data:(envelope.data[0]==='A'?'B':'A')+envelope.data.slice(1)},'respaldo-seguro'));
 const map=new Map(),db={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 await restoreSnapshot(db,snapshot,'nueva-clave');assert.equal((await loginProfile(db,profile.id,'nueva-clave')).state.practiceMemory.suma.step,4);
 assert.equal(JSON.parse(db.getItem(profileKey(profile.id))).current.id,state.current.id);
});
test('A protected copy preserves written errors and completed and pending construction evidence',async()=>{
 const profile={id:'qa-project-copy',name:'QA backup',role:'student'},completed=newWorkshop(2,134);
 while(!completed.completedAt){const m=currentMission(completed);completed.records[completed.index].model=solvedModel(m);applyWorkshopAction(completed,{type:'check'});applyWorkshopAction(completed,{type:'reason',value:m.reason});applyWorkshopAction(completed,{type:'next'});}
 const current=newSession('suma',1,profile.id);current.responseMode='write';current.questions[0].responseMode='write';recordAttempt(current.questions[0],2499);
 const state={profile:profile.id,sessions:[],teacher:[],adaptive:{},current,workshop:newWorkshop(3,567),workshopHistory:[completed]};
 const snapshot=await decryptBackup(await encryptBackup(profile,state,'copia-proyectos'),'copia-proyectos');assert.deepEqual(snapshot.state,state);
 const invalid=structuredClone(state);invalid.workshop.focus='missing';await assert.rejects(()=>encryptBackup(profile,invalid,'copia-proyectos'),/Proyectos/);
});
