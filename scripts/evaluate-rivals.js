import {mkdirSync,writeFileSync} from 'node:fs';
import {newRace,raceStats,rivalProgress} from '../web/race.js';
const output='docs/qa-web-0.5.0';
const runs=[];let crossings=0;
for(let seed=1;seed<=10;seed++) {
  const race=newRace([],'multi',1,seed);
  const samples=[];let previous;
  for(let ms=1000;ms<Math.min(...race.finishMs);ms+=1000) {
    const bots=race.finishMs.map((_,i)=>rivalProgress(race,i,ms));
    const order=bots.map((p,i)=>[p,i]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]).join('');
    if(previous && order!==previous)crossings++;
    previous=order;
    if(ms%5000===0)samples.push({elapsedMs:ms,positions:bots.map(p=>Number(p.toFixed(5)))});
  }
  const scenarios=[3000,6000,10000].map(responseMs=>{
    const questions=[];
    const checkpoints=[];
    for(let i=1;i<=8;i++){
      questions.push({done:true,answer:6,attempts:[6],hint:false});
      checkpoints.push(raceStats({race,questions},responseMs*i).rank);
    }
    return {responseMs,checkpoints,finishRank:checkpoints.at(-1)};
  });
  runs.push({seed,finishMs:race.finishMs,finishOrder:race.finishMs.map((ms,i)=>[ms,race.names[i]]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]),scenarios,samples});
}
const orders=new Set(runs.map(r=>r.finishOrder.join(',')));
const pairedMonotonic=runs.every(r=>r.scenarios[0].checkpoints.every((rank,i)=>rank<=r.scenarios[1].checkpoints[i]&&r.scenarios[1].checkpoints[i]<=r.scenarios[2].checkpoints[i]));
if(orders.size<2||!crossings||!pairedMonotonic)throw Error('Competition criteria failed');
mkdirSync(output,{recursive:true});
const report={protocol:2,seeds:10,scenarios:30,distinctFinishOrders:orders.size,observedLeadOrderChanges:crossings,pairedMonotonic,runs,limitation:'Synthetic deterministic simulation; not perceived fairness or child outcomes.'};
writeFileSync(output+'/rival-scenarios.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({seeds:10,scenarios:30,distinctFinishOrders:orders.size,observedLeadOrderChanges:crossings,pairedMonotonic}));
