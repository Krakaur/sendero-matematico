import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateLegacy,profileList,profileKey,createProfile,loginProfile,updateProfile} from '../web/profiles.js';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};};
const state=id=>({profile:id,sessions:[],teacher:[],current:{index:3},adaptive:{suma:{level:2}},practice:{seen:[1]}});
test('Legacy migration preserves identity, pending state and original backup exactly once',()=>{
 const db=storage(),old=JSON.stringify(state('legacy'));db.setItem('sendero.state.v1',old);
 assert.equal(migrateLegacy(db).id,'legacy');assert.equal(db.getItem(profileKey('legacy')),old);
 assert.equal(db.getItem('sendero.state.v1'),old);assert.equal(migrateLegacy(db),null);
 assert.equal(profileList(db).length,1);
});
test('Profile authentication, isolation, duplicate aliases and password change',async()=>{
 const db=storage();await createProfile(db,'Luna','sendero-luna','student',state('a'));
 await createProfile(db,'Sol','sendero-sol','teacher',state('b'));
 await assert.rejects(()=>loginProfile(db,'a','incorrecta'));
 assert.equal((await loginProfile(db,'b','sendero-sol')).state.profile,'b');
 await assert.rejects(()=>createProfile(db,'luna','sendero-otro','student',state('c')));
 await updateProfile(db,'a','Luna azul','sendero-luna','clave-nueva');
 await assert.rejects(()=>loginProfile(db,'a','sendero-luna'));
 assert.equal((await loginProfile(db,'a','clave-nueva')).profile.name,'Luna azul');
 assert.equal((await loginProfile(db,'b','sendero-sol')).state.practice.seen[0],1);
 assert.ok(!db.getItem('sendero.profiles.v1').includes('clave-nueva'));
});
test('Corrupt legacy data is not overwritten',()=>{
 const db=storage();db.setItem('sendero.state.v1','invalid');assert.throws(()=>migrateLegacy(db));
 assert.equal(db.getItem('sendero.state.v1'),'invalid');assert.equal(db.getItem('sendero.profiles.v1'),null);
});
