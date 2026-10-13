import {raceStats,rivalProgress} from './race.js';
import {canoeSVG,riverLandscape} from './race-art.js';

export function finishSummary(session,alias='Tú') {
  const stats=raceStats(session),elapsed=session.race.elapsedMs;
  const entrants=[{player:true,name:alias,kind:0,time:elapsed,arrived:true,progress:1},...session.race.names.map((name,i)=>({player:false,name,kind:i+1,time:session.race.finishMs[i],arrived:session.race.finishMs[i]<=elapsed,progress:rivalProgress(session.race,i,elapsed)}))];
  const arrived=entrants.filter(e=>e.arrived);
  const standings=entrants.sort((a,b)=>Number(b.arrived)-Number(a.arrived)||(a.arrived?a.time-b.time||a.kind-b.kind:b.progress-a.progress)).map(e=>({...e,place:e.arrived?1+arrived.filter(other=>other.time<e.time).length:null}));
  return {...stats,elapsed,standings,initialCorrect:session.questions.filter(q=>q.attempts[0]===q.answer).length,recovered:session.questions.filter(q=>q.done&&q.attempts.length>1).length};
}

function trophySVG() {
  return `<svg viewBox="0 0 120 140" aria-hidden="true"><path d="M30 26H12V45Q12 72 39 70M90 26H108V45Q108 72 81 70" fill="none" stroke="#c28a39" stroke-width="9"/><path d="M30 18H90L85 62Q80 83 60 85Q40 83 35 62Z" fill="#f3cc68" stroke="#b47c30" stroke-width="3"/><path d="M39 24H54L51 66Q42 59 39 24" fill="#fff0b2"/><path d="M53 83H67V106H83V120H37V106H53Z" fill="#d69b48"/><path d="m60 36 5 10 11 2-8 8 2 12-10-6-10 6 2-12-8-8 11-2Z" fill="#fff4cb"/><path d="M30 124H90" stroke="#785f3d" stroke-width="8" stroke-linecap="round"/></svg>`;
}

export function raceFinishHTML(session,escape,alias,nextLevel,trailName,detailsHTML) {
  const r=finishSummary(session,alias),colors=['#f6b94f','#b6a0d6','#e48a70','#8eb98e'];
  const encouragement=r.rank===1?'¡La copa del río es tuya!':r.recovered?`Retomaste ${r.recovered===1?'un reto':r.recovered+' retos'} tras corregir. ¡Recorrido completo!`:'¡Ocho retos, una aventura completa!';
  return `<section class="regatta-result" aria-labelledby="finish-title">
    <div class="finish-hero" aria-hidden="true">${riverLandscape()}<div class="finish-bunting"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="finish-fox">${canoeSVG(0,colors[0])}</div><div class="finish-trophy">${trophySVG()}</div><div class="finish-leaves">${Array.from({length:9},(_,i)=>`<i style="--leaf:${i}"></i>`).join('')}</div><div class="finish-dock"></div></div>
    <div class="finish-content"><span class="finish-eyebrow">COPA DEL RÍO · ${escape(trailName)}</span><h1 id="finish-title" tabindex="-1">¡Llegaste a la meta!</h1><p class="finish-encouragement">${encouragement}</p>
    <div class="finish-highlights"><div><strong>${r.rank}<small> / 4</small></strong><span>posición</span></div><div><strong>${r.points}</strong><span>puntos de juego</span></div><div><strong>${(r.elapsed/1000).toFixed(1)}<small> s</small></strong><span>en el río</span></div></div>
    <div class="finish-actions"><button class="primary" id="play-again" data-trail="${escape(session.trail)}">Volver al río <span aria-hidden="true">↗</span></button><a class="secondary" href="#explorar">Elegir otro camino</a><p>${escape(trailName)} · Nivel ${nextLevel} · 8 retos nuevos</p></div></div>
    <div class="finish-recap"><p><strong>${r.initialCorrect} de 8</strong> aciertos iniciales <span>·</span> <strong>${r.best}</strong> seguidos como mejor racha</p><details class="finish-details"><summary>Ver esta carrera y mis resultados</summary><ol class="finish-standings" aria-label="Posiciones al cruzar tu meta">${r.standings.map(e=>`<li class="${e.player?'is-player':''}"><span class="finish-place">${e.place===null?'—':e.place+'.º'}</span><span class="finish-racer" aria-hidden="true">${canoeSVG(e.kind,colors[e.kind])}</span><span class="finish-name">${escape(e.name)}<small>${e.player?'Tú · Luma':'Rival virtual'}</small></span><span class="finish-time">${e.arrived?(e.time/1000).toFixed(1)+' s':'En el río'}</span></li>`).join('')}</ol><p class="finish-explanation">Posiciones al terminar tus ocho retos. Quienes seguían remando aparecen como «En el río». Los puntos de juego no son una calificación escolar.</p>${detailsHTML}<a href="#progreso">Ver mi progreso completo ↗</a></details></div>
  </section>`;
}
