import test from 'node:test';import assert from 'node:assert/strict';
import {encryptBackup,decryptBackup,restoreSnapshot} from '../web/backup.js';import {newSession} from '../web/core.js';import {profileKey,loginProfile} from '../web/profiles.js';
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
