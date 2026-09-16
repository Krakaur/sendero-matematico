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
 return `<svg viewBox="0 0 84 60" aria-hidden="true"><ellipse cx="42" cy="55" rx="35" ry="4" fill="#083d67" opacity=".2"/><path d="M23 36V14L34 21 49 17 61 11 62 37Z" fill="${color}"/><path d="M29 34 42 28 56 34 43 43Z" fill="#fff3d2"/><circle cx="34" cy="27" r="3" fill="#102d52"/><circle cx="52" cy="27" r="3" fill="#102d52"/><path d="m39 33 4 5 4-5" fill="#102d52"/><path d="M5 41H79L65 55H21Z" fill="${color}"/><path d="M12 44H70" stroke="white" stroke-width="4"/><path d="m64 29 13 22" stroke="#173b62" stroke-width="4"/></svg>`;
}
export function competitionHTML(session,escape=s=>s,alias='Tú') {
 const r=raceStats(session),names=[alias,...session.race.names],colors=['#ffbd32','#ab8dff','#ff7797','#5ee6b2'];
 return `<section class="competition" aria-label="Carrera con tres rivales virtuales"><div class="race-banner"><strong>REGATA RELÁMPAGO</strong><span>⚑ META · 8 RETOS</span></div><div class="race-water">${names.map((name,i)=>`<div class="race-lane"><span class="lane-label">${escape(name)}${i?' · virtual':' · tú'}</span><div class="lane-course"><div class="competitor" data-racer="${i}" style="left:${100*(i?r.bots[i-1]:r.progress)}%">${racerSVG(colors[i],i)}</div><span class="lane-finish">▦</span></div></div>`).join('')}</div><div class="competition-score"><strong id="race-position">${r.rank} / 4</strong><span>posición</span><strong id="race-clock">${(session.race.elapsedMs/1000).toFixed(1)} s</strong><span>tiempo de carrera</span></div><p class="virtual-note">Nube, Rayo y Chispa son rivales simulados en este dispositivo.</p></section>`;
}
