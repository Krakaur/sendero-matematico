import test from 'node:test';
import assert from 'node:assert/strict';
import {NOTICE_VERSION,NOTICE_KEY,noticeAcknowledged,acknowledgeNotice} from '../web/research-notice.js';
const store=()=>{const data=new Map();return {data,getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
test('new browser shows information',()=>assert.equal(noticeAcknowledged(store()),false));
test('acknowledgement persists only information-read, not research consent',()=>{const s=store();assert.equal(acknowledgeNotice(s,'2026-10-21T00:00:00Z'),true);assert.equal(noticeAcknowledged(s),true);assert.deepEqual(JSON.parse(s.getItem(NOTICE_KEY)),{version:NOTICE_VERSION,acknowledgement:'information_acknowledged',at:'2026-10-21T00:00:00Z'});assert.equal(s.data.size,1);});
test('old version is shown again',()=>{const s=store();s.setItem(NOTICE_KEY,JSON.stringify({version:'older',acknowledgement:'information_acknowledged'}));assert.equal(noticeAcknowledged(s),false);});
test('malformed or consent-like stored value cannot hide information',()=>{const s=store();s.setItem(NOTICE_KEY,'{bad');assert.equal(noticeAcknowledged(s),false);s.setItem(NOTICE_KEY,JSON.stringify({version:NOTICE_VERSION,consent:true}));assert.equal(noticeAcknowledged(s),false);});
test('blocked storage remains usable without claiming persistence',()=>{const s={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};assert.equal(noticeAcknowledged(s),false);assert.equal(acknowledgeNotice(s),false);});
