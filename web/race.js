import {canoeSVG, riverLandscape} from './race-art.js';
// Game rewards and simulated competition are independent of educational fluency.
export function newRace(sessions,trail,level) {
 const times=sessions.filter(s=>s.trail===trail).flatMap(s=>s.questions).filter(q=>q.level===level&&q.timingProtocol===1&&!q.hint&&!q.timingInterrupted&&q.firstResponseMs>=500&&q.firstResponseMs<=60000).slice(-24).map(q=>q.firstResponseMs).sort((a,b)=>a-b);
 const pace=times.length>=5?times[Math.floor(times.length/2)]:6000;
 const target=Math.max(24000,Math.min(160000,pace*8*1.2));
 return {protocol:1,elapsedMs:0,level,calibrationN:times.length,finishMs:[target*1.22,target,target*.82],names:['Nube','Rayo','Chispa']};
}
export function raceStats(session,elapsed=session.race?.elapsedMs||0) {
 const done=session.questions.filter(q=>q.done),first=done.filter(q=>q.attempts.length===1&&q.attempts[0]===q.answer&&!q.hint).length;
 let streak=0,best=0;for(const q of done){streak=q.attempts.length===1&&q.attempts[0]===q.answer&&!q.hint?streak+1:0;best=Math.max(best,streak);}
 const progress=done.length/8,bots=(session.race?.finishMs||[]).map(ms=>Math.min(1,elapsed/ms));
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
 ${names.map((name,i)=>`<div class="race-lane ${i?'':'player-lane'}"><span class="lane-label"><span class="lane-name" title="${escape(name)}">${escape(name)}</span><small>${i?['','conejo','nutria','tortuga'][i]:'Tú · Luma'}</small></span><div class="lane-course"><div class="competitor" data-racer="${i}" style="left:${100*(i?r.bots[i-1]:r.progress)}%;--racer-delay:${-i*.37}s"><span class="boat-wake" aria-hidden="true"></span>${racerSVG(colors[i],i)}<span class="race-spark" aria-hidden="true">✦</span></div></div></div>`).join('')}
 <div class="race-message" id="race-message">${finished?'¡Una aventura más, una nueva conquista!':'Cada respuesta te lleva más lejos'}</div></div>
 <div class="competition-score"><span class="position-pill"><strong id="race-position">${r.rank} / 4</strong> <span>posición</span></span><span class="race-time"><strong id="race-clock">${(session.race.elapsedMs/1000).toFixed(1)} s</strong><span>en el río</span></span></div>
 <p class="virtual-note">Compites con Nube, Rayo y Chispa · rivales virtuales</p></section>`;
}
