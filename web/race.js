import {canoeSVG, riverLandscape} from './race-art.js';
// Game rewards and simulated competition are independent of educational fluency.
export function newRace(sessions,trail,level,seed=Math.floor(Math.random()*4294967296)) {
 const times=sessions.filter(s=>s.trail===trail).flatMap(s=>s.questions).filter(q=>q.level===level&&q.timingProtocol===1&&!q.hint&&!q.timingInterrupted&&q.firstResponseMs>=500&&q.firstResponseMs<=60000).slice(-24).map(q=>q.firstResponseMs).sort((a,b)=>a-b);
 const pace=times.length>=5?times[Math.floor(times.length/2)]:6000;
 const target=Math.max(24000,Math.min(160000,pace*8));
 // The entire course is fixed now. No rival reacts to later player answers.
 let randomState=Number(seed)>>>0;
 const random=()=>{randomState=(randomState+0x6D2B79F5)>>>0;let x=randomState;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};
 const finishMs=Array.from({length:3},()=>Math.round(target*(.86+random()*.28)));
 const cadence=[.3,0,-.3].map((launch,i)=>({launch,swing:(i===1?.48:.2)+random()*.04,phase:random()*Math.PI*2,waves:i===1?2:1}));
 return {protocol:2,seed:Number(seed)>>>0,elapsedMs:0,level,calibrationN:times.length,targetMs:target,finishMs,cadence,names:['Nube','Rayo','Chispa']};
}
export function rivalProgress(race,index,elapsed) {
 const t=Math.max(0,Math.min(1,elapsed/race.finishMs[index]));
 const c=race.protocol===2?race.cadence?.[index]:null;
 if(!c || t===0 || t===1)return t;
 // Integral of a strictly positive pace: continuous, monotone and exact at the finish.
 const w=2*Math.PI*c.waves;
 return t+c.launch*t*(1-t)+c.swing*(Math.sin(w*t+c.phase)-Math.sin(c.phase))/w;
}
export function rivalEffort(race,index,elapsed) {
 const c=race.protocol===2?race.cadence?.[index]:null,t=elapsed/race.finishMs[index];
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
 <div class="race-banner"><div><span class="regatta-kicker">SENDERO · COPA DEL RÍO</span><strong>Regata del bosque</strong></div><span class="regatta-badge">${finished?'¡Meta!':'8 retos'}</span></div>
 <div class="race-stage">${riverLandscape()}<div class="finish-ribbon" aria-hidden="true"><span>META</span></div>
 ${names.map((name,i)=>`<div class="race-lane ${i?'':'player-lane'}"><span class="lane-label"><span class="lane-name" title="${escape(name)}">${escape(name)}</span><small>${i?(session.race.protocol===2?['','salida ágil','por impulsos','remate fuerte'][i]:['','conejo','nutria','tortuga'][i]):'Tú · Luma'}</small></span><div class="lane-course"><div class="competitor" data-racer="${i}" data-effort="${finished?'finished':'steady'}" style="left:${100*(i?r.bots[i-1]:r.progress)}%;--racer-delay:${-i*.37}s"><span class="boat-wake" aria-hidden="true"></span>${racerSVG(colors[i],i)}<span class="race-spark" aria-hidden="true">✦</span></div></div></div>`).join('')}
 <div class="race-message" id="race-message">${finished?'¡Una aventura más, una nueva conquista!':'Cada respuesta te lleva más lejos'}</div></div>
 <div class="competition-score"><span class="position-pill"><strong id="race-position">${r.rank} / 4</strong> <span>posición</span></span><span class="race-time"><strong id="race-clock">${(session.race.elapsedMs/1000).toFixed(1)} s</strong><span>en el río</span></span></div>
 <p class="virtual-note">Compites con Nube, Rayo y Chispa · rivales virtuales</p></section>`;
}
