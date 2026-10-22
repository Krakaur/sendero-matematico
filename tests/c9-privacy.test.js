import test from 'node:test';
import assert from 'node:assert/strict';
import {exchangeClassroom,readInvitation} from '../web/classroom.js';
import {classroomRosterHTML} from '../web/cloud-view.js';
import {newWorkshop,currentMission,solvedModel,applyWorkshopAction} from '../web/workshop.js';
import {task,completeWorkshop} from './c8-fixtures.mjs';
const freeProject=()=>{const p=newWorkshop(1,77);while(!p.completedAt){const m=currentMission(p);p.records[p.index].model=solvedModel(m);applyWorkshopAction(p,{type:'check'});applyWorkshopAction(p,{type:'reason',value:m.reason});applyWorkshopAction(p,{type:'next'});}return p;};
test('C9 four channel cases distinguish assigned notes from optional free projects and disconnected delivery',async()=>{
 const t=task('balance'),session=completeWorkshop(t);session.workshop.note='Nota sintética de tarea asignada';const project=freeProject();
 for(const [includeProjects,enabled]of [[false,true],[true,true],[false,false],[true,false]]){
 const link={...readInvitation({schema:'sendero.invitation.v1',classId:t.classId,role:'student',token:'s'.repeat(64),endpoint:'http://127.0.0.1:4180'},'student'),enabled,includeProjects,capabilities:['projects'],capabilitiesAt:Date.now()};const state={profile:session.profile,sessions:[session],workshopHistory:[project],classroom:link};const calls=[];
 const fetcher=async(url,options)=>{const path=new URL(url).pathname,body=options.body?JSON.parse(options.body):null;calls.push({path,body});const data=path==='/tasks'?{tasks:[t]}:path==='/projects'?{profile:state.profile,classId:t.classId,accepted:[project.id]}:{profile:state.profile,classId:t.classId,accepted:[session.id],receivedAt:new Date().toISOString()};return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});};
 await exchangeClassroom(state,fetcher);assert.equal(calls.filter(c=>c.path==='/projects').length,enabled&&includeProjects?1:0);assert.equal(calls.filter(c=>c.path==='/reports').length,enabled?1:0);if(enabled)assert.equal(calls.find(c=>c.path==='/reports').body.sessions[0].workshop.note,session.workshop.note);else assert.equal(calls.length,0);
 const html=classroomRosterHTML(state);assert(html.includes('sólo a los talleres libres'));assert(html.includes('aunque este control esté desactivado'));assert(html.includes('Desvincular el aula'));
 }
});
