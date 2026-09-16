import {SCHEMA,TRAILS,validateReport,mergeSessions} from './core.js';
export function readInvitation(data,role) {
  if(data?.schema!=='sendero.invitation.v1'||data.role!==role||!['teacher','student'].includes(role)||typeof data.token!=='string'||data.token.length<32||typeof data.classId!=='string')throw Error('La invitación no corresponde a este tipo de perfil.');
  const u=new URL(data.endpoint);
  if(u.username||u.password||u.search||u.hash||!(u.protocol==='https:'||(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname))))throw Error('La dirección del aula debe usar HTTPS.');
  return {schema:data.schema,role,token:data.token,classId:data.classId,endpoint:u.href.replace(/\/$/,''),enabled:true,received:[],tasks:[]};
}
export function validateTasks(tasks) {
  if(!Array.isArray(tasks)||tasks.length>100)throw Error('Lista de tareas no válida.');
  return tasks.map(t=>{
    if(typeof t.id!=='string'||t.id.length>80||typeof t.title!=='string'||t.title.length<1||t.title.length>100||!Object.hasOwn(TRAILS,t.trail))throw Error('Tarea no válida.');
    return {id:t.id,title:t.title,trail:t.trail};
  });
}
export async function classroomRequest(link,path,body,fetcher=fetch) {
  const r=await fetcher(link.endpoint+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+link.token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error(r.status===401?'La invitación ha caducado o fue revocada.':'El aula no pudo confirmar la operación. Se reintentará al volver a conectar.');
  const text=await r.text();if(text.length>10*1024*1024)throw Error('Respuesta demasiado grande.');
  return JSON.parse(text);
}
export async function exchangeClassroom(state,fetcher=fetch) {
  const link=state.classroom;if(!link?.enabled)return null;
  const tasks=validateTasks((await classroomRequest(link,'/tasks',null,fetcher)).tasks);
  if(link.role==='teacher') {
    const data=await classroomRequest(link,'/reports',null,fetcher);
    if(!Array.isArray(data.reports))throw Error('Informes no válidos.');
    const sessions=data.reports.flatMap(r=>validateReport(r).sessions);
    return {tasks,sessions,at:new Date().toISOString()};
  }
  const pending=state.sessions.filter(s=>!link.received?.includes(s.id));
  if(!pending.length)return {tasks,received:[],at:new Date().toISOString()};
  const report={schema:SCHEMA,profile:state.profile,sessions:pending};validateReport(report);
  const receipt=await classroomRequest(link,'/reports',report,fetcher);
  if(receipt.classId!==link.classId||receipt.profile!==state.profile||!Array.isArray(receipt.accepted)||pending.some(s=>!receipt.accepted.includes(s.id)))throw Error('La confirmación no coincide con los informes enviados.');
  return {tasks,received:receipt.accepted,at:receipt.receivedAt};
}
export function applyExchange(state,result) {
  if(!result)return;
  state.classroom.tasks=result.tasks;state.classroom.lastReceipt=result.at;
  if(result.sessions)state.teacher=mergeSessions(state.teacher,result.sessions).sessions;
  if(result.received)state.classroom.received=[...new Set([...(state.classroom.received||[]),...result.received])];
  state.classroom.error=null;
}
