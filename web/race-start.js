import {canoeSVG,riverLandscape} from './race-art.js';

// Only newly prepared races opt in. Existing races resume with their original timing.
export function needsRaceStart(session) {
  return !!(session?.race?.launch==='ready' && !session.completedAt && session.index===0 && !session.questions.some(q=>q.attempts.length));
}
export function releaseRace(session,at=new Date().toISOString()) {
  if(!needsRaceStart(session))return false;
  session.race.launch='running';
  session.startedAt=at;
  return true;
}
export const COUNTDOWN_BEAT_MS=700;
export function countdownNumber(elapsed) { return Math.max(0,3-Math.floor(Math.max(0,elapsed)/COUNTDOWN_BEAT_MS)); }

function dockArt() {
  return `<svg class="launch-dock" viewBox="0 0 660 155" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dock-wood" x2="0" y2="1"><stop stop-color="#d6ad70"/><stop offset="1" stop-color="#957044"/></linearGradient></defs><path d="M0 75 255 42 332 155H0Z" fill="url(#dock-wood)" stroke="#6b573c" stroke-width="3"/><path d="m0 100 272-29M0 128l291-28m-220-35 2 90m83-101 23 102m67-116 45 115" stroke="#9c784b" stroke-width="4"/><path d="M26 67v82m218-111v67" stroke="#715439" stroke-width="12" stroke-linecap="round"/><path d="M27 75q88 34 215-29" fill="none" stroke="#ebd5a3" stroke-width="5"/><path d="M478 155q-8-55 9-84m-8 53q-23-40-49-34m62 65q14-65 51-70m-5 70q2-35 24-56" fill="none" stroke="#416d47" stroke-width="8"/><g fill="#90b26c"><path d="M485 96q-37-29-44-7 9 19 44 7Zm13 20q1-39 30-38 8 20-30 38Zm40 22q7-41 35-24-2 15-35 24Z"/></g><g fill="#efbb56"><circle cx="557" cy="98" r="9"/><circle cx="430" cy="89" r="7"/></g></svg>`;
}

export function raceStartHTML(session,escape,alias,trailName,sound,reducedMotion) {
  const names=['Luma',...session.race.names],colors=['#f6b94f','#b6a0d6','#e48a70','#8eb98e'];
  return `<section class="race-launch" aria-labelledby="launch-title">
    <div class="launch-scene" id="launch-scene">
      ${riverLandscape()}<div class="launch-canopy" aria-hidden="true"></div>
      <div class="launch-flags" aria-hidden="true">${'<i></i>'.repeat(9)}</div>
      <div class="launch-sign" aria-hidden="true"><span>BIENVENIDOS A</span><strong>LA COPA DEL RÍO</strong><svg viewBox="0 0 160 18"><path d="M5 8q15-9 30 0t30 0 30 0 30 0 30 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></div>
      <div class="launch-dragonfly" aria-hidden="true"><i></i><i></i><i></i></div>
      ${names.map((name,i)=>`<div class="launch-boat launch-boat-${i}" style="--racer-delay:${-i*.6}s">${canoeSVG(i,colors[i])}<span>${escape(name)}${i?'':' · Tú'}</span></div>`).join('')}
      ${dockArt()}
      <div class="launch-countdown" id="launch-countdown" hidden><span>PREPARA LOS REMOS</span><strong id="launch-number" aria-hidden="true">3</strong><div class="launch-lights" aria-hidden="true"><i></i><i></i><i></i></div><p>¡El río te espera!</p></div>
    </div>
    <div class="launch-brief"><span class="launch-eyebrow">UNA NUEVA AVENTURA</span><h1 id="launch-title" tabindex="-1">La copa del río</h1><div class="launch-chips"><span>${escape(trailName)}</span><span>Nivel ${session.race.level}</span><span>8 retos</span></div>
      <p class="launch-intro"><strong>${escape(alias)}, tú remas con Luma.</strong> Llega a la meta resolviendo los ocho retos.</p>
      <div class="launch-instructions"><p><span aria-hidden="true">↗</span><span><strong>Cada acierto te impulsa.</strong><small>Elige una respuesta y avanza por el río.</small></span></p><p><span aria-hidden="true">↻</span><span><strong>Si fallas, puedes corregir.</strong><small>Mira la solución y sigue remando.</small></span></p></div>
      <div class="launch-controls"><button id="race-ready" class="primary">¡A la salida! <span aria-hidden="true">→</span></button><button id="launch-cancel" class="secondary" hidden>Volver a preparar</button><p id="launch-promise">${reducedMotion?'Salida directa · movimiento reducido':'3, 2, 1… ¡al río!'}</p><button id="launch-sound" class="launch-sound" aria-pressed="${!!sound}">${sound?'♪ Sonido activado':'♪ Activar sonidos'}</button><a class="launch-back" href="#explorar">Elegir otro camino</a></div>
    </div>
    <div class="launch-rivals" aria-label="Tus rivales virtuales"><div class="launch-rivals-heading"><strong>Conoce a tus rivales</strong><span>Son personajes del juego</span></div>${session.race.names.map((name,i)=>`<div class="launch-rival"><span class="rival-portrait" aria-hidden="true">${canoeSVG(i+1,colors[i+1])}</span><span><strong>${escape(name)}</strong><small>${['Sale con energía','Alterna sus impulsos','Acelera al final'][i]}</small></span></div>`).join('')}</div>
    <details class="launch-settings"><summary>Sonido y movimiento</summary><div id="launch-settings-slot"></div></details>
  </section>`;
}
