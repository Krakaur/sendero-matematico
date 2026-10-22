import test from 'node:test';
import assert from 'node:assert/strict';
import {captureTeacherReading,restoreTeacherReading,refreshTeacherReading} from '../web/teacher-reading-state.js';

// Explicit DOM adapter for identity/state contracts, not a browser accessibility test.
function fixture({context='["aula-A"]',attempt='attempt-1',extra=false}={}) {
  const doc={modal:false,focused:true,activeElement:null,hasFocus(){return this.focused;},
    querySelector(){return this.modal?{}:null;},defaultView:{scrollX:0,scrollY:520,innerHeight:800,scrollTo(v){this.restored=v;this.scrollX=v.left;this.scrollY=v.top;}}};
  function node(tag,attrs={},parent=null) {
    const n={tagName:tag,attrs,children:[],parentElement:parent,ownerDocument:doc,open:false,disabled:false,layoutTop:620,layoutHeight:48,layoutWidth:260,
      getAttribute(k){return this.attrs[k]??null;},setAttribute(k,v){this.attrs[k]=v;},
      getBoundingClientRect(){return {top:this.layoutTop-this.ownerDocument.defaultView.scrollY,height:this.layoutHeight,width:this.layoutWidth};},
      contains(x){for(let p=x;p;p=p.parentElement)if(p===this)return true;return false;},
      closest(selector){for(let p=this;p;p=p.parentElement){if(selector.includes('[hidden]')&&('hidden' in p.attrs||'inert' in p.attrs||p.attrs['aria-hidden']==='true'))return p;}return null;},
      focus(){doc.activeElement=this;},scrollIntoView(){this.scrolled=true;},
      querySelectorAll(){const result=[];function visit(p){for(const child of p.children){if(child.attrs['data-insight-key'])result.push(child);visit(child);}}visit(this);return result;}};
    parent?.children.push(n);return n;
  }
  doc.body=node('BODY');doc.documentElement=node('HTML');doc.activeElement=doc.body;
  const root=node('SECTION',{'data-insight-context':context},doc.body);
  const task=node('DETAILS',{'data-insight-key':'task-v1'},root),taskSummary=node('SUMMARY',{},task);
  const profile=node('DETAILS',{'data-insight-key':'profile-000101'},task),profileSummary=node('SUMMARY',{},profile);
  const attemptNode=node('DETAILS',{'data-insight-key':attempt},profile),summary=node('SUMMARY',{},attemptNode);
  const button=node('BUTTON',{'data-insight-key':'go-to-question'},attemptNode);
  const question=node('DETAILS',{'data-insight-key':'question-1'},attemptNode),questionSummary=node('SUMMARY',{},question);
  if(extra)node('DETAILS',{'data-insight-key':'new-attempt'},profile);
  const main={ownerDocument:doc,querySelector(){return this.root;},root};
  return {doc,root,node,main,task,taskSummary,profile,profileSummary,attempt:attemptNode,summary,button,question,questionSummary};
}
function reparentDocument(next,previous) {
  const doc=previous.doc;
  function attach(n){n.ownerDocument=doc;for(const c of n.children)attach(c);}
  attach(next.root);next.root.parentElement=doc.body;
  // Test adapter focus is explicitly rebound; no browser behavior is inferred.
  for(const n of [next.root,...next.root.querySelectorAll(),next.taskSummary,next.profileSummary,next.summary,next.questionSummary])n.focus=()=>{doc.activeElement=n;};
  doc.activeElement=doc.body;return doc;
}
test('sync refresh preserves open and closed disclosure identity when new evidence appears',()=>{
  const before=fixture();before.task.open=true;before.profile.open=true;before.attempt.open=true;
  before.summary.focus();const saved=captureTeacherReading(before.root,'profile/aula/teacher');
  const after=fixture({extra:true});reparentDocument(after,before);
  const result=restoreTeacherReading(after.root,saved,'profile/aula/teacher');
  assert.equal(result.focused,true);assert.equal(before.doc.activeElement,after.summary);
  assert.equal(after.task.open,true);assert.equal(after.profile.open,true);assert.equal(after.attempt.open,true);
  assert.equal(after.question.open,false);assert.equal(after.root.querySelectorAll().find(n=>n.getAttribute('data-insight-key')==='new-attempt').open,false);
  assert.equal(before.doc.defaultView.restored.top,520);
});
test('a different profile, route or catalog context cannot inherit reading state',()=>{
  const f=fixture();f.attempt.open=true;f.summary.focus();const saved=captureTeacherReading(f.root,'profile-A/aula/docentes');
  for(const context of ['profile-B/aula/docentes','profile-A/aula/progreso']){
    const result=restoreTeacherReading(f.root,saved,context);assert.equal(result.reason,'context-changed');
  }
  const other=fixture({context:'["aula-B"]'});
  assert.equal(restoreTeacherReading(other.root,saved,'profile-A/aula/docentes').reason,'context-changed');
  assert.equal(other.attempt.open,false);
});
test('focus falls back to surviving parent disclosure when an attempt leaves the recent window',()=>{
  const before=fixture();before.task.open=true;before.profile.open=true;before.summary.focus();
  const saved=captureTeacherReading(before.root,'same');
  const after=fixture({attempt:'attempt-9'});reparentDocument(after,before);after.profileSummary.layoutTop=740;
  assert.equal(restoreTeacherReading(after.root,saved,'same').focused,true);
  assert.equal(before.doc.activeElement,after.profileSummary);
  assert.equal(after.profileSummary.getBoundingClientRect().top,100);
});
test('restore does not steal surviving exterior focus; a modal prevents refresh',()=>{
  const before=fixture();before.summary.focus();const saved=captureTeacherReading(before.root,'same');
  const outside=before.node('INPUT');before.doc.activeElement=outside;
  assert.equal(restoreTeacherReading(before.root,saved,'same').focused,false);assert.equal(before.doc.activeElement,outside);
  before.doc.modal=true;let renders=0;
  assert.equal(refreshTeacherReading(before.main,{getContext:()=> 'same',render:()=>renders++}).rendered,false);
  assert.equal(renders,0);assert.equal(restoreTeacherReading(before.root,saved,'same').reason,'modal-open');
});
test('a hidden browser document restores disclosures without moving focus or scroll',()=>{
  const f=fixture();f.task.open=true;f.summary.focus();f.doc.focused=false;
  const saved=captureTeacherReading(f.root,'same');f.task.open=false;f.doc.activeElement=f.doc.body;
  const result=restoreTeacherReading(f.root,saved,'same');
  assert.equal(f.task.open,true);assert.equal(result.focused,false);assert.equal(f.doc.defaultView.restored,undefined);
});
test('duplicate semantic keys are omitted rather than selecting an unrelated record',()=>{
  const f=fixture();f.node('DETAILS',{'data-insight-key':'question-1'},f.root);
  assert.equal(captureTeacherReading(f.root,'same').details.some(x=>x.key==='question-1'),false);
});
test('content inserted above the same summary preserves its viewport offset, not absolute scrollY',()=>{
  const before=fixture();before.task.open=true;before.profile.open=true;before.summary.focus();
  const saved=captureTeacherReading(before.root,'same');assert.equal(saved.focusTop,100);
  const after=fixture({extra:true});reparentDocument(after,before);after.summary.layoutTop=900;
  const result=restoreTeacherReading(after.root,saved,'same');
  assert.equal(result.position,'relative-requested');assert.equal(before.doc.defaultView.restored.top,800);
  assert.equal(after.summary.getBoundingClientRect().top,100);
});
test('unknown or off-screen geometry preserves semantic focus without requesting a scroll jump',()=>{
  for(const cause of ['zero-area','off-screen','unknown-new']) {
    const before=fixture();before.summary.focus();
    if(cause==='zero-area')before.summary.layoutWidth=0;
    if(cause==='off-screen')before.summary.layoutTop=1600;
    const saved=captureTeacherReading(before.root,'same');
    const after=fixture();reparentDocument(after,before);
    if(cause==='unknown-new')after.summary.layoutHeight=0;
    const result=restoreTeacherReading(after.root,saved,'same');
    assert.equal(result.focused,true);assert.equal(result.position,'not-requested');
    assert.equal(before.doc.defaultView.restored,undefined);
  }
});
test('body focus is not a reading anchor and does not restore scroll or seize a disclosure',()=>{
  const before=fixture();before.task.open=true;
  const saved=captureTeacherReading(before.root,'same');assert.deepEqual(saved.focus,[]);assert.equal(saved.focusTop,null);
  const after=fixture();reparentDocument(after,before);
  const result=restoreTeacherReading(after.root,saved,'same');
  assert.equal(result.focused,false);assert.equal(after.task.open,true);
  assert.equal(before.doc.activeElement,before.doc.body);assert.equal(before.doc.defaultView.restored,undefined);
});
