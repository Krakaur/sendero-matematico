import {validateReport,mergeSessions} from '../web/core.js';
import {fluency} from '../web/fluency.js';
// Aggregation/minimization, not a proof of anonymity. No identifiers in output.
export function aggregateResearch(reports,{minimumParticipants=5}={}) {
 if(!Number.isInteger(minimumParticipants)||minimumParticipants<5)throw Error('La supresión requiere al menos cinco participantes por celda.');
 const people=new Map();
 for(const input of reports){const r=validateReport(input);people.set(r.profile,mergeSessions(people.get(r.profile)||[],r.sessions).sessions);}
 const cells=new Map();
 for(const sessions of people.values()) {
  const own=new Map();
  for(const s of sessions)for(const q of s.questions){
   const key=s.trail+'|'+q.level;if(!own.has(key))own.set(key,[]);own.get(key).push(q);
  }
  for(const [key,questions] of own){
   const q=questions.slice(-80),f=fluency(q);
   const row={accuracy:q.filter(q=>q.attempts[0]===q.answer).length/q.length*100,rate:f.rate};
   if(!cells.has(key))cells.set(key,[]);cells.get(key).push(row);
  }
 }
 const rows=[];
 for(const [key,participants] of cells){
  if(participants.length<minimumParticipants)continue;
  const rates=participants.map(p=>p.rate).filter(r=>r!==null).sort((a,b)=>a-b),n=rates.length;
  const median=n%2?rates[(n-1)/2]:(rates[n/2-1]+rates[n/2])/2;
  const [content,level]=key.split('|');
  rows.push({content,level:Number(level),participants:participants.length,meanInitialAccuracy:Number((participants.reduce((a,p)=>a+p.accuracy,0)/participants.length).toFixed(1)),medianResponseRate:n>=minimumParticipants?Number(median.toFixed(1)):null});
 }
 return {schema:'sendero.research.aggregate.v1',minimumParticipants,contributionLimitPerCell:80,rows};
}
