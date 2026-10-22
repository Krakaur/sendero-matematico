import test from 'node:test';
import assert from 'node:assert/strict';
import {learningReviewHTML} from '../web/learning-review.js';
import {resultGroups,renderFluency} from '../web/results.js';

const question=extra=>({a:2,b:3,answer:6,level:1,attempts:[6],hint:false,timingProtocol:1,timingInterrupted:false,firstResponseMs:2000,...extra});
const session=questions=>({trail:'multi',completedAt:'2026-01-01T00:00:00.000Z',questions});

test('C12 learning review describes recorded support without inferring that an initially correct child needed it',()=>{
  for(const type of ['scaffold','feedback','solution']){
    const q=question({bankId:'synthetic-supported',prompt:'Compara cantidades',explanation:'Comprueba la diferencia',supportProtocol:6,events:[{type}]});
    const html=learningReviewHTML({...session([q]),trail:'razonar'});
    assert.match(html,/1 reto registró ayuda o un intento incorrecto/);assert.match(html,/· con ayuda/);
    assert.doesNotMatch(html,/necesit|Completaste los retos sin ayuda inicial/);
  }
  const correctWithHint=learningReviewHTML(session([question({hint:true})]));assert.match(correctWithHint,/registró ayuda/);assert.doesNotMatch(correctWithHint,/necesit/);
});

test('C12 learning review retains correction history and does not reinterpret support events in older protocols',()=>{
  const changed=question({attempts:[5,4,6]}),html=learningReviewHTML(session([changed,question({hint:true})]));
  assert.match(html,/2 retos registraron ayuda o un intento incorrecto/);assert.match(html,/· corregido/);assert.match(html,/· con ayuda/);
  const historical=question({supportProtocol:3,events:[{type:'scaffold'}]});assert.match(learningReviewHTML(session([historical])),/Completaste los retos sin ayuda inicial/);
  assert.match(learningReviewHTML({...session([changed]),race:{}}),/La posición en la carrera no mide comprensión/);
});

test('C12 results count exercises with an initial error, not all wrong choices or corrected final responses',()=>{
  const one=session([question({attempts:[5,4,6]}),question({hint:true}),question({attempts:[]})]),rows=resultGroups([one]);
  assert.equal(rows.length,1);assert.equal(rows[0].total,2);assert.equal(rows[0].first,1);assert.equal(rows[0].errors,1);assert.equal(rows[0].fluency.n,1);assert.equal(rows[0].fluency.correct,0);
  const html=renderFluency([one]);assert.match(html,/1 ejercicio con un error inicial/);assert.doesNotMatch(html,/2 ejercicios con un error inicial/);assert.match(html,/1\/2 ejercicios con tiempo válido/);
  assert.match(html,/Precisión: primeras respuestas correctas entre ejercicios contestados; puede incluir una pista/);
  const two=renderFluency([session([question({attempts:[3,6]}),question({attempts:[4,6]})])]);assert.match(two,/2 ejercicios con un error inicial/);
});

test('C12 results remain arithmetic-only and make no overall mastery claim from the new labels',()=>{
  assert.equal(renderFluency([{...session([question({bankId:'reasoning'})]),trail:'razonar'}]),'');
  const html=renderFluency([session([question()])]);assert.match(html,/0 ejercicios con un error inicial/);assert.match(html,/no calificaciones ni umbrales validados de dominio/);assert.match(html,/Una mejora observada no demuestra por sí sola aprendizaje/);
});
