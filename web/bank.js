import { BANK, BANK_VERSION } from './bank-data.js';
const byId = new Map(BANK.map(q => [q.id, q]));
const pools = new Map();
for(const q of BANK) {const key=`${q.level}-${q.pool}`; if(!pools.has(key))pools.set(key,[]);pools.get(key).push(q);}
export const bankCount = BANK.length;
export function bankQuestion(profile, level, transfer=false, rng=Math.random) {
  const pool=transfer?'transfer':'practice', key=`${level}-${pool}`;
  const history=profile.bankHistory??={};
  const used=history[key]??={seen:{},cycle:0};
  let eligible=pools.get(key).filter(q=>!used.seen[q.id]);
  if(!eligible.length){used.seen={};used.cycle++;eligible=pools.get(key);}
  const recent=history.recent??=[],families=history.families??=[];
  const score=q=>(recent.includes(q.template)?0:4)+(families.includes(q.family)?0:2);
  const best=Math.max(...eligible.map(score));eligible=eligible.filter(q=>score(q)===best);
  const item=eligible[Math.floor(rng()*eligible.length)];used.seen[item.id]=true;
  history.recent=[...recent,item.template].slice(-8);history.families=[...families,item.family].slice(-2);
  const q=structuredClone(item);
  for(let i=q.options.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[q.options[i],q.options[j]]=[q.options[j],q.options[i]];}
  return {...q,bankId:q.id,bankVersion:BANK_VERSION,novel:used.cycle===0,cycle:used.cycle,attempts:[],hint:false,solutionShown:false,activeMs:0,done:false};
}
export function validBankQuestion(q){
  const original=byId.get(q.bankId);if(!original||q.bankVersion!==BANK_VERSION)return false;
  for(const field of ['a','b','answer','level','prompt','explanation','solution','pool','dimension','template','family','labels'])if(JSON.stringify(original[field])!==JSON.stringify(q[field]))return false;
  return Array.isArray(q.options)&&q.options.length===4&&new Set(q.options).size===4&&q.options.every(n=>original.options.includes(n))&&q.attempts.every(n=>original.options.includes(n));
}
export const optionText=(q,n)=>q.labels?q.labels[n]:String(n);
export function reasoningDimensions(sessions){
  const rows={};
  for(const q of sessions.flatMap(s=>s.questions)){
    if(!q.bankId||!q.attempts.length)continue;
    const independent=q.attempts.length===1&&q.attempts[0]===q.answer&&!q.hint;
    const keys=[q.dimension];if(q.pool==='transfer'&&q.novel)keys.push('Situaciones reservadas');
    for(const key of keys){const row=rows[key]??={total:0,independent:0};row.total++;if(independent)row.independent++;}
  }
  return rows;
}
