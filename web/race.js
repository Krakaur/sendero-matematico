import {canoeSVG, riverLandscape} from './race-art.js';
// Game rewards and simulated competition are independent of educational fluency.
export const CHALLENGES={gentle:{name:'Paseo',description:'Más margen para pensar',factors:[1.25,1.36,1.51]},balanced:{name:'Carrera',description:'Rivales a tu ritmo',factors:[1.04,1.12,1.23]},challenge:{name:'Desafío',description:'Un poco más de velocidad',factors:[.93,1.01,1.11]}};
export function newRace(sessions,trail,level,seed=Math.floor(Math.random()*4294967296),challenge='balanced') {
 if(!Object.hasOwn(CHALLENGES,challenge))challenge='balanced';
 // Completed resolution time includes correction. A quick wrong attempt is
 // never evidence of fluent solving. Interrupted/helped items are excluded.
 const valid=sessions.filter(s=>s.trail===trail).flatMap(s=>s.questions).filter(q=>q.done&&q.attempts?.at(-1)===q.answer&&q.timingProtocol===1&&!q.hint&&!q.timingInterrupted&&q.activeMs>=500&&q.activeMs<=120000);
 let samples=valid.filter(q=>q.level===level).slice(-24),source='same-level';
 if(samples.length<5){samples=valid.filter(q=>Math.abs(q.level-level)===1).slice(-24);source='adjacent-level';}
 const times=samples.map(q=>q.activeMs*Math.pow(1.2,level-q.level)).sort((a,b)=>a-b);
 const calibrated=times.length>=5;
 const pace=calibrated?times[Math.floor(times.length/2)]:[8000,10000,12000,15000][Math.max(0,Math.min(3,level-1))];
 const target=Math.max(12000,Math.min(960000,pace*8));
 // The entire course is fixed now. No rival reacts to later player answers.
 let randomState=Number(seed)>>>0;
 const random=()=>{randomState=(randomState+0x6D2B79F5)>>>0;let x=randomState;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};
 const factors=CHALLENGES[challenge].factors.map(f=>f+(random()-.5)*.04);
 for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[factors[i],factors[j]]=[factors[j],factors[i]];}
 const finishMs=factors.map(f=>Math.round(target*f));
 const cadence=[.3,0,-.3].map((launch,i)=>({launch,swing:(i===1?.48:.2)+random()*.04,phase:random()*Math.PI*2,waves:i===1?2:1}));
 return {protocol:3,seed:Number(seed)>>>0,elapsedMs:0,level,challenge,calibrationN:calibrated?times.length:0,paceSource:calibrated?source:'initial-level',referencePaceMs:target/8,targetMs:target,finishMs,cadence,names:['Nube','Rayo','Chispa']};
}
export function rivalProgress(race,index,elapsed) {
 const t=Math.max(0,Math.min(1,elapsed/race.finishMs[index]));
 const c=race.protocol>=2?race.cadence?.[index]:null;
 if(!c || t===0 || t===1)return t;
 // Integral of a strictly positive pace: continuous, monotone and exact at the finish.
 const w=2*Math.PI*c.waves;
 return t+c.launch*t*(1-t)+c.swing*(Math.sin(w*t+c.phase)-Math.sin(c.phase))/w;
}
export function rivalEffort(race,index,elapsed) {
 const c=race.protocol>=2?race.cadence?.[index]:null,t=elapsed/race.finishMs[index];
 if(t>=1)return 'finished';
 if(!c)return 'steady';
 const pace=1+c.launch*(1-2*t)+c.swing*Math.cos(2*Math.PI*c.waves*t+c.phase);
 return pace>1.15?'surge':pace<.85?'glide':'steady';
}
export function raceStats(session,elapsed=session.race?.elapsedMs||0) {
 const done=session.questions.filter(q=>q.done),first=done.filter(q=>q.attempts.length===1&&q.attempts[0]===q.answer&&!q.hint).length;
 let streak=0,best=0;for(const q of done){streak=q.attempts.length===1&&q.attempts[0]===q.answer&&!q.hint?streak+1:0;best=Math.max(best,streak);}
 const progress=done.length/8,bots=(session.race?.finishMs||[]).map((_,i)=>rivalProgress(session.race,i,elapsed));
 // At the finish use exact times; unfinished players follow visible progress.
 const rank=1+bots.filter((p,i)=>progress===1?session.race.finishMs[i]<elapsed:p>progress).length;
 return {points:done.length*10+first*5,streak,best,progress,bots,rank};
}
export function raceLevel(session) {
 const correct=session.questions.filter(q=>q.attempts.length===1&&q.attempts[0]===q.answer&&!q.hint).length,level=session.race.level;
 return correct>=7?Math.min(4,level+1):correct<=4?Math.max(1,level-1):level;
}
export function racerSVG(color,kind=0) {
 return canoeSVG(kind,color);
}
export function competitionHTML(session,escape=s=>s,alias='Tú') {
 const r=raceStats(session),names=[alias,...session.race.names],colors=['#f6b94f','#b6a0d6','#e48a70','#8eb98e'];
 const finished=!!session.completedAt;
 return `<section class="competition regatta ${finished?'regatta-finished':''}" data-race-id="${escape(session.id)}" aria-label="Carrera con tres rivales virtuales">
 <div class="race-banner"><div><span class="regatta-kicker">COPA DEL RÍO</span><strong id="route-segment">El bosque de luz</strong></div><div class="route-pearls" aria-label="Retos completados"><span id="route-steps">${Math.round(r.progress*8)} / 8</span><span aria-hidden="true">${Array.from({length:8},(_,i)=>`<i class="route-pearl ${i<r.progress*8?'passed':''}"></i>`).join('')}</span></div></div>
 <div class="race-stage">${riverLandscape()}<div class="finish-ribbon" aria-hidden="true"><span>META</span></div>
 ${names.map((name,i)=>`<div class="race-lane ${i?'':'player-lane'}" style="--lane:${i?i-1:3}"><div class="lane-course"><div class="competitor" data-racer="${i}" data-effort="${finished?'finished':'steady'}" style="--racer-delay:${-i*.37}s"><span class="boat-wake" aria-hidden="true"></span>${racerSVG(colors[i],i)}<span class="lane-label"><span class="lane-name" title="${escape(name)}">${i?escape(name):'Tú · Luma'}</span><span class="edge-arrow" aria-hidden="true"></span></span><span class="race-spark" aria-hidden="true">✦</span><span class="water-splash" aria-hidden="true"><i></i><i></i><i></i></span></div></div></div>`).join('')}
 <div class="river-foreground" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
 <div class="race-message" id="race-message">${finished?'¡Una aventura más, una nueva conquista!':'Cada respuesta te lleva más lejos'}</div></div>
 <div class="competition-score"><span class="position-pill"><strong id="race-position">${r.rank} / 4</strong> <span>posición</span></span><div class="course-map" aria-label="Recorrido de los cuatro participantes">${names.map((name,i)=>`<i data-map-racer="${i}" style="--map-color:${colors[i]};--map-lane:${i};left:${100*(i?r.bots[i-1]:r.progress)}%" title="${escape(name)}"></i>`).join('')}</div><span class="race-time"><strong id="race-clock">${(session.race.elapsedMs/1000).toFixed(1)} s</strong></span></div>
 <p class="virtual-note">Nube, Rayo y Chispa son competidores del juego · ${CHALLENGES[session.race.challenge]?.name||'Carrera'}</p></section>`;
}
