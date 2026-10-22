import test from 'node:test';
import assert from 'node:assert/strict';
import {newAssignedSession,recordReasoningSupport,recordAttempt,advanceAssignedSession,dimensions} from '../web/core.js';
import {learningReviewHTML} from '../web/learning-review.js';
import {make} from './c9-fixtures.mjs';
import {REASONING_SUPPORT_FAMILIES} from '../web/reasoning-support.js';
function complete(support){const t={...make(REASONING_SUPPORT_FAMILIES[0]),contentId:'reasoning-supported-pack',contentVersion:1},s=newAssignedSession(t,'000901');for(const q of s.questions){if(support)recordReasoningSupport(q,'scaffold');recordAttempt(q,q.answer);advanceAssignedSession(s);}return s;}
test('C10 student summary cannot call scaffold-supported first answers independent',()=>{const s=complete(true),d=dimensions([s]);assert.equal(d.first,4);assert.equal(d.independent,0);const html=learningReviewHTML(s);assert.match(html,/4 retos necesitaron/);assert.doesNotMatch(html,/Completaste los retos sin ayuda inicial/);assert.equal((html.match(/con ayuda/g)||[]).length,5);});
test('C10 student summary distinguishes truly unassisted answers without changing historic protocols',()=>{const s=complete(false);assert.equal(dimensions([s]).independent,4);assert.match(learningReviewHTML(s),/Completaste los retos sin ayuda inicial/);const historic=structuredClone(s);for(const q of historic.questions){q.supportProtocol=3;q.events.unshift({type:'scaffold'});}assert.equal(dimensions([historic]).independent,4,'Legacy metric contract is not retroactively reinterpreted.');});
