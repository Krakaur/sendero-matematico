import {mkdirSync,writeFileSync} from 'node:fs';
import {newRace,raceStats} from '../web/race.js';
const scenarios={faster:.9,reference:1,recovery:1.1,slower:1.2,verySlow:1.6},rows=[];
for(const trail of ['suma','resta','multi','tablas20'])for(let level=1;level<=4;level++)for(const mode of ['gentle','balanced','challenge']){
 const ranks=Object.fromEntries(Object.keys(scenarios).map(s=>[s,[0,0,0,0]]));
 let reference;
 for(let seed=0;seed<100;seed++){
  const race=newRace([],trail,level,seed,mode);reference=race.referencePaceMs;
  for(const [name,factor] of Object.entries(scenarios)){
   const questions=Array.from({length:8},(_,i)=>({done:true,answer:4,attempts:name==='recovery'&&i===3?[5,4]:[4]}));
   ranks[name][raceStats({race,questions},race.targetMs*factor).rank-1]++;
  }
 }
 rows.push({trail,level,mode,referencePaceMs:reference,seeds:100,ranks});
}
mkdirSync('docs/qa-web-0.7.0',{recursive:true});
writeFileSync('docs/qa-web-0.7.0/rivals-matrix.json',JSON.stringify({version:'0.7.0',uniqueConfigurations:4800,simulatedFinishes:24000,scenarios,interpretation:'Synthetic total-time scenarios; not observed child performance. Recovery includes one corrected error and 10% extra total time.',rows},null,2)+'\n');
console.log(JSON.stringify({uniqueConfigurations:4800,simulatedFinishes:24000,rows:rows.length}));
