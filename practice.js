import { makeQuestion } from './core.js';
export function rememberPractice(profile,trail,q){
  if(trail==='razonar')return;
  const memory=profile.practiceMemory??={}, track=memory[trail]??={step:0,facts:{}};
  const step=++track.step,key=`${q.a}:${q.b}`,old=track.facts[key];
  const ok=q.attempts.length===1&&q.attempts[0]===q.answer&&!q.hint;
  const success=ok?Math.min(5,(old?.success??0)+1):0;
  track.facts[key]={a:q.a,b:q.b,level:q.level,success,due:step+(ok?[3,5,10,20,35,60][success]:2)};
}
export function practiceQuestion(profile,trail,level,rng=Math.random){
  const q=makeQuestion(trail,level,rng),track=profile.practiceMemory?.[trail];
  if(!track||rng()>.65)return q;
  const due=Object.values(track.facts).filter(f=>f.level===level&&f.due<=track.step).sort((a,b)=>a.due-b.due)[0];
  if(!due)return q;
  q.a=due.a;q.b=due.b;q.answer=trail==='suma'?q.a+q.b:trail==='resta'?q.a-q.b:q.a*q.b;
  const options=new Set([q.answer]);while(options.size<4)options.add(Math.max(0,q.answer-5)+Math.floor(rng()*11));q.options=[...options];
  for(let i=3;i>0;i--){const j=Math.floor(rng()*(i+1));[q.options[i],q.options[j]]=[q.options[j],q.options[i]];}
  q.review=true;return q;
}
