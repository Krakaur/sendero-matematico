import { LOCAL_KEYS, createLocalMatch, localAnswer } from "./together-local.js";
import {togetherProfiles} from './together-profiles.js';
import {workshopHTML,workshopProgressHTML,workshopControlAction} from './workshop-view.js';
import { TRAILS, VERSION } from "./core.js";
import {
  CIRCUITS,
  circuitPicker,
  CircuitView,
  courseGeometry,
  coursePoint,
} from "./circuit.js";
import { canoeSVG } from "./race-art.js";
import { advanceBoat } from "./race-motion.js";
import { mathSupportHTML, learningReviewHTML } from "./learning-review.js";
import {
  createMatch,
  addPlayer,
  playerAction,
  startMatch,
  pauseMatch,
  disconnectPlayer,
  reconnectPlayer,
  removeWaitingPlayer,
  tickMatch,
  publicSnapshot,
  validSnapshot,
  matchResults,
} from "./room.js";
import { RoomLink, readRoomInvitation } from "./room-link.js";
import {profileKey} from './profiles.js';
import {CloudRoomLink,cloudAccessFromState} from './cloud-room-link.js';
import {cloudEntryHTML,cloudSetupHTML,cloudRoomHTML,mountCloudScene} from './cloud-room-view.js';
let cloudLink=null,cloudSnapshot=null,cloudRecords=[],cloudCurrent=null,cloudMessage='',cloudAccess=null,cloudDispose=null;
const cloudPositions=new Map();
const main = document.querySelector("#main"),
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
let localCount = 4;
try { const saved = Number(sessionStorage.getItem("sendero.together.size")); if ([2, 3, 4].includes(saved)) localCount = saved; } catch {}
let match = null,
  kind = null,
  localId = null,
  link = null,
  invitation = "",
  error = "",
  busy = false,
  view = null,
  raf = null,
  lastFrame = null,
  displayPositions = [],
  snapshotAt = 0,
  sendAt = 0,
  pendingUntil = 0;
let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
  knownRevision = -1,
  knownStatus = "",
  consoleKeys = new Map(),
  lastAnnounced = "";
const now = () => performance.now(),
  announce = (s) => {
    if (s !== lastAnnounced) {
      document.querySelector("#room-announcer").textContent = s;
      lastAnnounced = s;
    }
  };
const local = () => kind === "local",
  authority = () => local() || kind === "host";
const freshSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const configuration = () => ({
  trail: document.querySelector("#room-trail").value,
  level: Number(document.querySelector("#room-level").value),
  mode: document.querySelector("#room-trail").value==='razonar'?'coop':document.querySelector("#room-mode").value,
  circuit: document.querySelector("#circuit-select").value,
  seed: freshSeed(),
});
function getReduced() {
  return reduced || matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function stopView() {
  cancelAnimationFrame(raf);
  raf = null;
  view?.dispose();
  view = null;
  lastFrame = null;
  consoleKeys.clear();
}
function reset(keepRecovery=false) {
  cloudLink?.close();cloudLink=null;cloudDispose?.();cloudDispose=null;cloudSnapshot=null;cloudRecords=[];cloudPositions.clear();
  stopView();
  document.body.classList.remove("room-many-local", "room-reasoning");
  link?.close();
  link = null;
  match = null;
  kind = null;
  localId = null;
  invitation = "";
  knownRevision = -1;
  knownStatus = "";
  pendingUntil = 0;
  error = "";
  try {
    sessionStorage.removeItem("sendero.together.local");
    if(!keepRecovery){sessionStorage.removeItem("sendero.together.host");sessionStorage.removeItem("sendero.together.guest");}
  } catch {}
}
function saveLocal() {
  if(kind==='host'&&match&&link?.id)try{sessionStorage.setItem('sendero.together.host',JSON.stringify({snapshot:publicSnapshot(match,now()),connection:link.hostRecovery()}));}catch{}
  if (!local() || !match) return;
  try {
    sessionStorage.setItem(
      "sendero.together.local",
      JSON.stringify(publicSnapshot(match, now())),
    );
  } catch {}
}
function errorHTML() {
  return error ? `<p class="room-error" role="alert">${esc(error)}</p>` : "";
}
const profiles=togetherProfiles(localStorage,sessionStorage,()=>{if(match)render(true);else{const panel=main.querySelector('.room-profile-panel');if(panel)panel.outerHTML=profiles.panel(localCount);}});
profiles.bind(main);
function setup() {
  document.body.classList.remove('room-reasoning');
  stopView();
  let incoming = "";
  try {
    if (location.hash)
      (readRoomInvitation(location.href), (incoming = location.href));
  } catch {
    error =
      "La invitación está incompleta. Pide que te compartan el enlace completo.";
  }
  main.innerHTML = `<section class="room-intro"><div><span class="eyebrow">JUGAR, PENSAR Y COMPARTIR</span><h1>El río se disfruta<br>en compañía.</h1><p>Resuelvan los mismos ocho retos. Pueden competir o ayudar a que todo el equipo llegue a la meta.</p><p class="room-notice">Personajes diferentes, mismas condiciones: contenido, nivel y circuito compartidos. Cada persona responde sus propios retos.</p></div><div class="room-hero" aria-hidden="true"><strong>La copa compartida</strong>${canoeSVG(0)}${canoeSVG(1)}</div></section>${errorHTML()}<section class="room-setup"><label class="room-local-count">Personas en esta pantalla<select id="local-count">${[2,3,4].map(n=>`<option value="${n}" ${n===localCount?"selected":""}>${n} estudiantes</option>`).join("")}</select></label>${profiles.panel(localCount)}<h2>Preparen el recorrido</h2><div class="room-fields"><label>Contenido<select id="room-trail">${["suma", "resta", "multi", "tablas20", "razonar"].map((t) => `<option value="${t}" ${t === "multi" ? "selected" : ""}>${TRAILS[t].short}</option>`).join("")}</select></label><label>Nivel de cantidades<select id="room-level">${[1, 2, 3, 4].map((l) => `<option value="${l}">Nivel ${l}</option>`).join("")}</select></label><label>Forma de jugar<select id="room-mode"><option value="race">Carrera amistosa</option><option value="coop">Llegar en equipo</option></select></label>${circuitPicker()}</div><div class="room-choices"><button class="primary" id="local-create" ${busy ? "disabled" : ""}>Jugar ${localCount} en esta pantalla</button><button class="secondary" id="online-create" ${busy ? "disabled" : ""}>Crear sala por enlace</button></div><p class="room-notice">En esta pantalla: de dos a cuatro zonas de respuesta. Cada participante puede tocar sus botones o usar su grupo de teclas. Para tres o cuatro, conviene una pantalla grande o táctil; en teléfonos pequeños, usen un dispositivo por persona. Funciona sin internet cuando el juego está preparado. Por enlace: de dos a cuatro personas, cada una en su dispositivo.</p><details><summary>Cómo funcionan las salas privadas</summary><p class="room-notice">Solo entra quien tenga la invitación. Al crear o unirse, PeerJS conecta los navegadores y recibe datos técnicos de conexión; los retos y respuestas viajan entre participantes. No se envía tu perfil ni historial. No hay cámara, micrófono ni chat. Algunas redes impiden la conexión directa: si ocurre, prueben otra red o compartan pantalla. Mantén abierta la pestaña que creó la sala.</p></details><div class="room-join"><label for="invite-input">¿Te compartieron una invitación?</label><input id="invite-input" type="text" maxlength="500" placeholder="Pega aquí el enlace de la sala" value="${esc(incoming)}"><button class="secondary" id="online-join" ${busy ? "disabled" : ""}>Entrar en la sala</button></div><p id="connect-status" role="status" class="room-notice">${busy ? "Conectando…" : ""}</p></section><a class="room-return" href="./">Volver a mi aventura individual</a><p class="room-notice">Los perfiles vinculados conservan un registro multijugador separado: puede incluir colaboración y no verifica quién responde. Web ${VERSION}.</p>`;
  main.insertAdjacentHTML('beforeend',cloudEntryHTML());
}
function renderCloud(){
  cloudDispose?.();cloudDispose=null;
  const focus=document.activeElement,focusId=focus?.id,focusChoice=focus?.dataset?.cloudChoice;
  main.innerHTML=cloudSnapshot?cloudRoomHTML(cloudSnapshot,{message:cloudMessage,pending:!!cloudLink?.pending,records:cloudRecords,connected:cloudLink?.connected===true}):cloudSetupHTML(cloudAccess,cloudCurrent,cloudMessage);
  if(cloudSnapshot)cloudDispose=mountCloudScene(main,cloudSnapshot,{reduced:getReduced(),previous:cloudPositions});
  const replacement=focusId?document.getElementById(focusId):focusChoice!==undefined?main.querySelector(`[data-cloud-choice="${focusChoice}"]`):null;
  if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});
}
async function openCloud(){
  reset();
  try{
    const id=sessionStorage.getItem('sendero.active'),state=id&&JSON.parse(localStorage.getItem(profileKey(id)));
    cloudAccess=cloudAccessFromState(state);kind='cloud';cloudMessage='Consultando disponibilidad del aula…';cloudCurrent=null;renderCloud();
    cloudLink=new CloudRoomLink(cloudAccess,{accessCurrent:access=>{try{const state=JSON.parse(localStorage.getItem(profileKey(access.profile))),current=cloudAccessFromState(state);return ['endpoint','token','classroom','role','profile'].every(k=>current[k]===access[k]);}catch{return false;}},snapshot:(snapshot,records=[])=>{if(kind!=='cloud')return;cloudSnapshot=snapshot;cloudRecords=records;renderCloud();},status:message=>{if(kind!=='cloud')return;cloudMessage=message;renderCloud();},receipt:receipt=>{if(kind!=='cloud')return;cloudMessage=receipt.committed?'Acción aceptada por el servidor.':`La acción anterior no cambió el juego (${receipt.code}). Revisa el estado y vuelve a intentarlo si corresponde.`;renderCloud();}});
    cloudCurrent=await cloudLink.current();if(kind==='cloud')renderCloud();
  }catch(e){error=e.message;kind=null;setup();}
}
async function cloudClick(button){
  try{
    if(button.id==='cloud-exit'){reset();setup();return;}
    if(button.id==='cloud-discover'){cloudCurrent=await cloudLink.current();cloudSnapshot=null;renderCloud();return;}
    if(button.id==='cloud-enter'){cloudLink.roomId=cloudCurrent.id;if(cloudAccess.role==='teacher'||cloudCurrent.terminal)await cloudLink.refreshTeacher();else await cloudLink.connect(cloudCurrent.id);return;}
    if(button.id==='cloud-teacher-refresh'){await cloudLink.refreshTeacher();return;}
    if(button.id==='cloud-close-room'){await cloudLink.request(`/live/rooms/${cloudSnapshot.id}/close`,{actionId:crypto.randomUUID(),expectedVersion:cloudSnapshot.version});await cloudLink.refreshTeacher();return;}
    if(button.id==='cloud-archive'){await cloudLink.request(`/live/rooms/${cloudSnapshot.id}/archive`,{});await cloudLink.refreshTeacher();return;}
    if(button.id==='cloud-reconnect'||button.id==='cloud-transfer'){await cloudLink.connect(cloudSnapshot?.id||cloudCurrent.id,{transfer:button.id==='cloud-transfer'});return;}
    const s=cloudSnapshot;if(!s?.self)return;
    if(button.id==='cloud-ready')cloudLink.action({type:'ready',value:!s.players.find(p=>p.seat===s.self.seat)?.ready});
    if(button.id==='cloud-pause')cloudLink.action({type:'pause',reason:'requested'});
    if(button.id==='cloud-hint')cloudLink.action({type:'hint',questionId:s.question.id,questionIndex:s.question.index});
    if(button.dataset.cloudChoice!==undefined)cloudLink.action({type:'answer',questionId:s.question.id,questionIndex:s.question.index,choiceIndex:Number(button.dataset.cloudChoice)});
  }catch(e){cloudMessage=e.message;renderCloud();}
}
main.addEventListener('submit',async event=>{
  if(event.target.id!=='cloud-create-form')return;event.preventDefault();const values=new FormData(event.target);event.target.querySelector('button').disabled=true;
  try{await cloudLink.create({trail:values.get('trail'),level:Number(values.get('level')),mode:values.get('mode'),circuit:values.get('circuit')});}
  catch(e){cloudMessage=e.message;renderCloud();}
});
function roster() {
  return `<div class="room-roster">${match.players.map((p) => `<article class="room-person" data-ready="${p.ready}">${canoeSVG(p.seat)}<strong>${p.name}${p.id === localId && !local() ? " · Tú" : ""}</strong><small>${!p.connected ? "Sin conexión" : p.ready ? "Preparado para salir" : "Preparando el recorrido"}</small>${!p.connected&&authority()&&match.status==='lobby'?`<button class="soft-button" data-remove-waiting="${esc(p.id)}">Liberar esta plaza</button>`:""}${local() || p.id === localId ? `<button class="${p.ready ? "secondary" : "primary"}" data-ready="${esc(p.id)}" ${!p.connected ? "disabled" : ""}>${p.ready ? "Todavía no" : `Estoy listo · ${p.name}`}</button>` : ""}</article>`).join("")}</div>`;
}
function lobby() {
  stopView();
  const ready =
      match.players.length >= 2 &&
      match.players.every((p) => p.ready && p.connected),
    paused = match.status === "paused";
  main.innerHTML = `<section class="room-setup"><span class="eyebrow">${paused ? "PAUSA COMPARTIDA" : "LA COPA COMPARTIDA"}</span><h1>${paused ? "Tomamos un respiro" : "Todos a la salida"}</h1><p>${TRAILS[match.config.trail].short} · Nivel ${match.config.level} · ${CIRCUITS[match.config.circuit].name} · ${match.config.mode === "coop" ? "Llegar en equipo" : "Carrera amistosa"}</p>${paused ? `<p class="room-paused">${esc(match.reason)} El reloj de todos está detenido. Cada participante debe confirmar para continuar.</p>` : ""}${errorHTML()}${kind === "host" && !paused ? `<label for="room-invitation">Invita a quienes van a jugar contigo</label><input class="room-link-field" id="room-invitation" readonly value="${esc(invitation)}"><button id="copy-invitation" class="soft-button">Copiar invitación</button><p id="copy-status" class="room-notice" role="status">La sala admite hasta cuatro personas. Compartan el enlace de forma privada.</p>` : ""}${roster()}${paused&&authority()&&match.players.filter(p=>p.connected).length>=2?'<button id="room-restart-connected" class="secondary">Nuevo recorrido con quienes siguen</button>':''}${kind==='guest'&&error?'<button id="room-reconnect" class="primary">Reconectar y conservar mi avance</button>':''}<div class="room-choices">${authority() ? `<button class="primary" id="room-start" ${ready ? "" : "disabled"}>${paused ? "Continuar juntos" : "¡Al río!"}</button>` : '<p class="room-notice">Cuando todos estén listos, quien creó la sala dará la salida.</p>'}<button class="secondary" id="room-exit">${paused ? "Terminar este recorrido" : "Volver a preparar"}</button></div><p class="room-notice">${match.config.mode === "coop" ? "La meta se consigue cuando todo el equipo termina. Pueden explicar estrategias a quien lo necesite." : "Gana quien termina primero. La carrera continúa hasta que todos completan sus retos. Corregir permite seguir avanzando."}</p></section>`;
}
function sceneHTML() {
  return `<div class="room-scene"><canvas class="circuit-canvas" aria-hidden="true"></canvas>${match.players.map((p) => `<div class="competitor" data-room-racer="${p.seat}">${canoeSVG(p.seat)}<span class="lane-label">${p.name}</span></div>`).join("")}<span class="room-scene-status">${CIRCUITS[match.config.circuit].name}</span><div class="room-countdown" hidden><strong id="room-count"></strong><span>¡El río nos espera!</span></div></div>`;
}
function mapHTML() {
  const points = courseGeometry(match.config.circuit).points.filter(
      (_, i) => i % 8 === 0,
    ),
    d = points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
  return `<svg class="room-map" viewBox="0 0 3200 ${courseGeometry(match.config.circuit).height}" role="img" aria-label="Mapa del circuito con sus curvas y participantes"><path d="${d}"/>${match.players.map((p) => `<circle data-room-map="${p.seat}" r="60" fill="${["#efb342", "#baa1d4", "#df865c", "#8faa72"][p.seat]}"/>`).join("")}</svg>`;
}
function consoleHTML(p) {
  if(p.workshop){
    if(p.index===8)return `<article class="player-console" data-seat="${p.seat}"><h2>${p.name}: proyectos completados</h2><p>Puedes explicar una estrategia a tu equipo mientras termina.</p></article>`;
    const waiting=match.status!=='running'||pendingUntil>now();
    const html=workshopHTML({workshop:p.workshop}).replaceAll('id="project-',`id="player-${p.seat}-project-`).replaceAll('for="project-',`for="player-${p.seat}-project-`);
    return `<article class="player-console room-project" data-seat="${p.seat}" data-project-owner="${esc(p.id)}"><h2>${p.name} · Proyecto ${p.index+1}/8</h2><fieldset ${waiting?'disabled':''}><legend class="sr-only">Construcción de ${p.name}</legend>${html}</fieldset></article>`;
  }
  if (p.index === 8)
    return `<article class="player-console" data-seat="${p.seat}"><strong>${p.name} llegó a la meta.</strong><p class="console-feedback">El recorrido continúa para las demás personas.${match.config.mode === "coop" ? " Puedes explicar una estrategia a tu equipo." : ""}</p><p>${p.questions.filter((q) => q.attempts[0] === q.answer).length}/8 aciertos iniciales.</p></article>`;
  const q = p.questions[p.index],
    failing = q.attempts.length > 0,
    keys = LOCAL_KEYS[p.seat].map(k => k.toUpperCase()),
    waiting = match.status !== "running" || pendingUntil > now();
  return `<article class="player-console" data-seat="${p.seat}"><div class="console-heading"><strong>${p.name}${!local() ? " · Tú" : ""}</strong><span>Reto ${p.index + 1} / 8</span></div><div class="console-equation" tabindex="-1" aria-label="${q.a} ${match.config.trail === "suma" ? "más" : match.config.trail === "resta" ? "menos" : "por"} ${q.b}, ¿cuánto es?">${q.a} ${TRAILS[match.config.trail].symbol} ${q.b} = ${failing ? q.answer : "?"}</div><div class="console-answers">${q.options.map((v, i) => `<button data-room-answer="${v}" data-player="${esc(p.id)}" data-question="${p.index}" class="${failing && v === q.answer ? "correct" : ""} ${q.attempts.includes(v) ? "wrong" : ""}" ${waiting || q.attempts.includes(v) ? "disabled" : ""} aria-label="${p.name}: respuesta ${v}">${v}</button>`).join("")}</div><p class="console-feedback" role="status">${waiting ? "Esperando la salida…" : failing ? `La respuesta es ${q.answer}. Mira la explicación y selecciónala para continuar.` : "Cada respuesta correcta impulsa tu embarcación."}</p><div class="console-bottom"><span class="key-legend">${local() ? keys.map((k) => `<kbd>${k}</kbd>`).join(" ") : "Teclas 1 2 3 4"}</span><button class="soft-button" data-room-hint="${esc(p.id)}" data-question="${p.index}" ${waiting || q.hint ? "disabled" : ""}>${q.hint ? "Pista abierta" : "Una pista"}</button></div>${q.hint || failing ? mathSupportHTML(match.config.trail, q) : ""}</article>`;
}
function updateConsoles() {
  const players = local()
      ? match.players
      : match.players.filter((p) => p.id === localId),
    container = main.querySelector(".room-answers");
  if (!container) return;
  for (const p of players) {
    const q = p.questions[p.index],
      key = JSON.stringify([
        p.index,
        q?.attempts,
        q?.hint,
        p.workshop,
        match.status,
        pendingUntil > now(),
      ]);
    if (consoleKeys.get(p.id) === key) continue;
    const activeData=document.activeElement?.dataset?{...document.activeElement.dataset}:{};
    const old = container.querySelector(`[data-seat="${p.seat}"]`),
      focused = old?.contains(document.activeElement),
      t = document.createElement("template");
    t.innerHTML = consoleHTML(p);
    if (old) old.replaceWith(t.content);
    else container.append(t.content);
    consoleKeys.set(p.id, key);
    if(focused&&p.workshop){
      const console=container.querySelector(`[data-seat="${p.seat}"]`);
      const next=[...console.querySelectorAll('button')].find(b=>Object.keys(activeData).length&&Object.entries(activeData).every(([k,v])=>b.dataset[k]===v));
      (next||console.querySelector('h2[tabindex]'))?.focus({preventScroll:true});
    }
    if (focused && p.index < 8 && !p.workshop)
      container
        .querySelector(`[data-seat="${p.seat}"] .console-equation`)
        ?.focus({ preventScroll: true });
  }
}
function play() {
  document.body.classList.toggle('room-reasoning',match.config.trail==='razonar');
  document.body.classList.toggle("room-many-local",local() && match.players.length > 2);
  if (!main.querySelector(".room-scene")) {
    stopView();
    main.innerHTML = `<div class="room-controls"><div><h1>${match.config.mode === "coop" ? "Llegamos en equipo" : "Carrera amistosa"}</h1><p>${TRAILS[match.config.trail].short} · Nivel ${match.config.level} · ${match.players.length} personas</p></div><button id="room-pause" class="soft-button">Pausar para todos</button></div>${sceneHTML()}<div class="room-progress"><span id="room-team-progress"></span>${mapHTML()}<strong id="room-clock">0.0 s</strong></div><div class="room-live-standings" aria-label="Retos completados por participante"></div><div class="room-answers ${local() ? "" : "solo"}" data-count="${match.players.length}"></div><p class="room-notice">${local() ? `${match.players.length} personas, ${match.players.length} zonas de respuesta independientes. Las teclas de cada participante aparecen debajo de sus respuestas.` : "Mantén esta pestaña visible. Si alguien necesita salir, la partida se pausa para todos."}</p>`;
    view = new CircuitView(main.querySelector("canvas"), match.config.circuit);
    displayPositions = match.players.map((p) => ({
      position: p.index / 8,
      velocity: 0,
    }));
  }
  updateConsoles();
  if (!raf) raf = requestAnimationFrame(frame);
}
function finish() {
  stopView();
  const rows = matchResults(match),
    winner = rows
      .filter((p) => p.place === 1)
      .map((p) => p.name)
      .join(" y "),
    coop = match.config.mode === "coop", projects = match.config.trail === "razonar";
  main.innerHTML = `<section class="room-summary">${errorHTML()}<span class="eyebrow">RECORRIDO COMPLETO</span><h1>${coop ? "¡Todo el equipo llegó!" : rows.filter((p) => p.place === 1).length > 1 ? "¡Llegada compartida!" : `${winner} llega primero`}</h1><p>${coop ? "Cada participante completó sus ocho retos." : "La posición describe esta carrera; la precisión y las ayudas se interpretan por separado."}</p><div class="table-wrap"><table><caption class="sr-only">Resultados de la partida compartida</caption><thead><tr>${coop ? "" : "<th>Posición</th>"}<th>Participante</th><th>${projects?"Modelo inicial correcto":"Primera respuesta"}</th><th>${projects?"Modelo y explicación iniciales sin ayuda":"Sin ayuda"}</th><th>${projects?"Con revisión o ayuda":"Correcciones"}</th>${projects?"":"<th>Tiempo</th>"}</tr></thead><tbody>${rows.map((p) => `<tr>${coop ? "" : `<td>${p.place}.º</td>`}<td>${p.name}</td><td>${p.first}/8</td><td>${p.independent}/8</td><td>${p.corrected}</td>${projects?"":`<td>${(p.finishedMs / 1000).toFixed(1)} s</td>`}</tr>`).join("")}</tbody></table></div>${!local() && !coop ? `<p class="room-notice">Se considera llegada compartida una diferencia de hasta ${Math.round(match.tieWindowMs)} ms por la incertidumbre de conexión. Es una carrera amistosa, sin clasificación pública ni acreditación de identidad.</p>` : ""}<div class="room-choices">${authority() ? '<button id="room-rematch" class="primary">Otro recorrido juntos</button>' : "<p>Quien creó la sala puede preparar otra partida.</p>"}<button id="room-exit" class="secondary">Elegir otra experiencia</button></div>${match.players
    .filter((p) => local() || p.id === localId)
    .map(
      (p) =>
        `<h2>${p.name}: pensar después de jugar</h2>${p.workshop?workshopProgressHTML([p.workshop]):learningReviewHTML({ trail: match.config.trail, questions: p.questions })}`,
    )
    .join(
      "",
    )}<p class="room-notice">La cooperación y la ayuda entre personas hacen que estos resultados tengan un contexto diferente al de la práctica individual. Se conservan por separado cuando se vinculó un perfil.</p>${profiles.status()}</section>`;
  announce(
    coop
      ? "Todo el equipo completó el recorrido."
      : `Recorrido completo. Primera posición: ${winner}.`,
  );
}
function render(force = false) {
  if(kind==='cloud'){renderCloud();return;}
  if (!match) {
    setup();
    return;
  }
  if (
    !force &&
    knownRevision === match.revision &&
    knownStatus === match.status
  )
    return;
  profiles.capture(match,kind,localId);
  knownRevision = match.revision;
  knownStatus = match.status;
  if (["lobby", "paused"].includes(match.status)) lobby();
  else if (match.status === "finished") finish();
  else play();
  saveLocal();
}
function frame(t) {
  raf = null;
  if (!view || !match) return;
  if (authority()) tickMatch(match, t);
  if (!["running", "countdown"].includes(match.status)) {
    render(true);
    return;
  }
  const dt =
    lastFrame === null ? 0 : Math.min(0.1, Math.max(0, (t - lastFrame) / 1000));
  lastFrame = t;
  match.players.forEach((p, i) => {
    displayPositions[i] ??= { position: p.index / 8, velocity: 0 };
    displayPositions[i] = getReduced()
      ? { position: p.index / 8, velocity: 0 }
      : advanceBoat(
          displayPositions[i].position,
          displayPositions[i].velocity,
          p.index / 8,
          dt,
          p.index === 8 ? 4 : 1.6,
        );
  });
  const follow = local()
    ? displayPositions.reduce((s, p) => s + p.position, 0) /
      displayPositions.length
    : displayPositions[match.players.findIndex((p) => p.id === localId)]
        ?.position || 0;
  const scene = main.querySelector(".room-scene"),
    w = scene.clientWidth,
    h = scene.clientHeight,
    cam = view.draw(follow, w, h, getReduced(),local()?null:match.players.find(p=>p.id===localId)?.seat??0);
  scene.querySelectorAll("[data-room-racer]").forEach((el, i) => {
    const p = view.project(
      displayPositions[i].position,
      match.players[i].seat,
      cam,
      w,
      h,
      el.offsetWidth,
    );
    el.style.transform = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0)`;
    el.querySelector(".canoe-art").style.rotate = `${p.angle.toFixed(2)}deg`;
    el.dataset.edge = p.edge;
  });
  main.querySelectorAll("[data-room-map]").forEach((el, i) => {
    const p = coursePoint(
      match.config.circuit,
      displayPositions[i].position,
      match.players[i].seat,
    );
    el.setAttribute("cx", p.x);
    el.setAttribute("cy", p.y);
  });
  const elapsed =
    match.elapsedMs +
    (!authority() && match.status === "running"
      ? Math.min(1100, t - snapshotAt)
      : 0);
  main.querySelector("#room-clock").textContent = match.config.trail==='razonar'?'Sin prisa':(elapsed / 1000).toFixed(1) + " s";
  main.querySelector("#room-team-progress").textContent =
    `${match.players.reduce((s, p) => s + p.index, 0)} / ${match.players.length * 8} retos${match.config.mode === "coop" ? " del equipo" : ""}`;
  const statusKey = match.players.map((p) => p.index).join(",");
  if (scene.dataset.progress !== statusKey) {
    main.querySelector(".room-live-standings").innerHTML = match.players
      .map(
        (p) =>
          `<span>${p.name} · ${p.index}/8${p.index === 8 ? " · Meta" : ""}</span>`,
      )
      .join("");
    scene.dataset.progress = statusKey;
  }
  const count = main.querySelector(".room-countdown");
  count.hidden = match.status !== "countdown";
  if (!count.hidden) {
    const remaining = authority()
      ? match.startAt - t
      : match.countdownMs - (t - snapshotAt);
    main.querySelector("#room-count").textContent = Math.max(
      1,
      Math.ceil(remaining / 700),
    );
  }
  if (match.status !== knownStatus) {
    knownStatus = match.status;
    updateConsoles();
    announce("¡Al río! Ya pueden responder.");
  }
  updateConsoles();
  raf = requestAnimationFrame(frame);
}
function transmit() {
  if (kind === "host" && match) link?.broadcast(publicSnapshot(match, now()));
}
function act(id, action) {
  if (authority()) {
    if (playerAction(match, id, action, now())) {
      transmit();
      render();
    }
  } else {
    if (pendingUntil > now() && ["answer", "hint", "project"].includes(action.type))
      return;
    link?.send(action);
    if (["answer", "hint", "project"].includes(action.type)) {
      pendingUntil = now() + 1800;
      updateConsoles();
    }
  }
}
function networkError(message) {
  error = message;
  busy = false;
  if (match) {
    if (match.status === "finished") {
      error =
        "La sala se ha cerrado. Los resultados de este recorrido se conservan.";
    } else if (authority()) pauseMatch(match, message, now());
    else {
      match.status = "paused";
      match.reason = message;
      match.players.forEach((p) => {
        p.ready = false;
        p.connected = false;
      });
    }
    transmit();
    render(true);
  } else setup();
  announce(error);
}
async function createOnline(config,recovery=null) {
  reset(!!recovery);
  busy = true;
  setup();
  kind = "host";
  link = new RoomLink({
    join: (id) => (match ? reconnectPlayer(match,id)||addPlayer(match, id) : false),
    connected: () => {
      transmit();
      render(true);
    },
    action: (id, a) => {
      if (!a || !["ready", "answer", "hint", "pause", "project"].includes(a.type)) return;
      act(id, a);
    },
    close: (id) => {
      if (match) {
        disconnectPlayer(match, id, now());
        transmit();
        render(true);
      }
    },
    slow: (id) => {
      if (match) {
        pauseMatch(
          match,
          "La conexión se ha detenido. Esperamos antes de continuar.",
          now(),
        );
        transmit();
        render(true);
      }
    },
    latency: (id, rtt) => {
      if (!match) return;
      match.tieWindowMs = Math.min(1000, Math.max(match.tieWindowMs, 150, rtt));
      if (rtt > 1500 && match.status === "running") {
        pauseMatch(
          match,
          "La conexión es demasiado lenta para mantener una carrera comparable.",
          now(),
        );
        transmit();
        render(true);
      }
    },
    error: networkError,
  });
  try {
    invitation = await link.create(recovery?.connection);
    if (link.closed) return;
    localId = link.id;
    match = recovery?.snapshot || createMatch(config);
    if(recovery){
      match.lastTick=null;match.startAt=null;
      if(match.status!=='finished'){match.status=match.players.length>1?'paused':'lobby';match.reason='La sala se recuperó. Reconecten desde sus pestañas y confirmen para continuar.';}
      for(const p of match.players){p.connected=p.id===localId;p.ready=false;p.lastInputMs=-1000;}
      match.revision++;
    }else addPlayer(match, localId);
    busy = false;
    render(true);
  } catch (e) {
    link?.close();
    networkError(e.message);
  }
}
async function joinOnline(value) {
  let invite;
  try {
    invite = readRoomInvitation(value);
  } catch (e) {
    error = e.message;
    setup();
    return;
  }
  reset();
  busy = true;
  setup();
  kind = "guest";
  invitation=value;
  try{sessionStorage.setItem('sendero.together.guest',value);}catch{}
  link = new RoomLink({
    snapshot: (s, id) => {
      if (!validSnapshot(s)) {
        networkError(
          "La sala envió un estado no válido. Vuelve a preparar la partida.",
        );
        link.close();
        return;
      }
      if (match && s.id === match.id && s.revision < match.revision) return;
      const changed = match?.id !== s.id;
      match = s;
      localId = id;
      snapshotAt = now();
      pendingUntil = 0;
      busy = false;
      error = "";
      if (changed) {
        stopView();
        knownStatus = "";
        knownRevision = -1;
      }
      render();
    },
    close: () =>
      networkError(
        "Se perdió la conexión con la sala. No se adjudica una victoria. Puedes reconectar desde esta pestaña.",
      ),
    slow: () =>
      networkError("La sala dejó de responder. La partida queda detenida."),
    error: networkError,
  });
  try {
    await link.join(invite);
  } catch (e) {
    link?.close();
    networkError(e.message);
  }
}
main.addEventListener("change", (e) => {
  if (e.target.id !== "local-count") return;
  const count = Number(e.target.value);
  if (![2, 3, 4].includes(count)) return;
  localCount = count;
  try { sessionStorage.setItem("sendero.together.size", String(count)); } catch {}
  main.querySelector(".room-profile-panel").outerHTML = profiles.panel(count);
  main.querySelector("#local-create").textContent = `Jugar ${count} en esta pantalla`;
});
main.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled || e.detail > 1) return;
  if(b.id==='cloud-open'){await openCloud();return;}
  if(kind==='cloud'){await cloudClick(b);return;}
  if (b.id === "local-create") {
    const config = configuration();
    reset();
    kind = "local";
    localId = "local-0";
    match = createLocalMatch(config, localCount);
    render(true);
  }
  if (b.id === "online-create") createOnline(configuration());
  if (b.id === "online-join")
    joinOnline(document.querySelector("#invite-input").value);
  const owner=b.closest('[data-project-owner]');
  if(owner){const p=match.players.find(p=>p.id===owner.dataset.projectOwner),change=workshopControlAction(b.dataset);if(p&&change)act(p.id,{type:'project',index:p.index,change});return;}
  if(b.dataset.removeWaiting&&authority()&&removeWaitingPlayer(match,b.dataset.removeWaiting)){transmit();render(true);return;}
  if(b.id==='room-reconnect'){const target=invitation;link?.close();joinOnline(target);return;}
  if (b.dataset.ready) act(b.dataset.ready, { type: "ready" });
  if (b.id === "room-start" && authority() && startMatch(match, now())) {
    transmit();
    render(true);
  }
  if (b.id === "room-pause") act(localId, { type: "pause" });
  if (b.dataset.roomAnswer !== undefined)
    act(b.dataset.player, {
      type: "answer",
      index: Number(b.dataset.question),
      value: Number(b.dataset.roomAnswer),
    });
  if (b.dataset.roomHint)
    act(b.dataset.roomHint, {
      type: "hint",
      index: Number(b.dataset.question),
    });
  if (b.id === "copy-invitation") {
    try {
      await navigator.clipboard.writeText(invitation);
      document.querySelector("#copy-status").textContent =
        "Invitación copiada. Compártela con quienes van a jugar.";
    } catch {
      document.querySelector("#room-invitation").select();
      document.querySelector("#copy-status").textContent =
        "Selecciona y copia el enlace para compartirlo.";
    }
  }
  if (b.id === "room-exit") {
    reset();
    history.replaceState(null, "", location.pathname);
    setup();
  }
  if (["room-rematch","room-restart-connected"].includes(b.id) && authority()) {
    const config = { ...match.config, seed: freshSeed() },
      ids = match.players.filter((p) => p.connected).map((p) => p.id);
    match = createMatch(config);
    ids.forEach((id) => addPlayer(match, id));
    stopView();
    transmit();
    render(true);
  }
});
document.addEventListener("keydown", (e) => {
  if (
    e.repeat ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    !match ||
    match.status !== "running" ||
    match.config.trail==='razonar' ||
    ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)
  )
    return;
  if (local()) {
    const input = localAnswer(match, e.key);
    if (!input) return;
    e.preventDefault();
    act(input.player, input.action);
    return;
  }
  const at = ["1", "2", "3", "4"].indexOf(e.key);
  const p = match.players.find(p => p.id === localId), q = p?.questions[p.index];
  if (at < 0 || !q) return;
  e.preventDefault();
  act(p.id, { type: "answer", index: p.index, value: q.options[at] });
});
document.querySelector("#motion-toggle").addEventListener("click", (e) => {
  reduced = !reduced;
  document.body.classList.toggle("reduced-motion", reduced);
  e.currentTarget.setAttribute("aria-pressed", reduced);
  if(kind==='cloud')renderCloud();
});
window.addEventListener('storage',event=>{if(kind==='cloud'&&cloudAccess&&(!event.key||event.key===profileKey(cloudAccess.profile)))cloudLink?.ensureAccess();});
document.addEventListener("visibilitychange", () => {
  if(kind==='cloud'&&document.hidden){cloudLink?.hidden();return;}
  if (
    document.hidden &&
    match &&
    ["running", "countdown"].includes(match.status)
  ) {
    act(localId, { type: "pause" });
    saveLocal();
  }
});
window.addEventListener("pagehide", () => {
  cloudLink?.close();cloudDispose?.();
  if (local()) {
    pauseMatch(
      match,
      "Volviste al recorrido. Confirmen para continuar.",
      now(),
    );
    saveLocal();
  }
  if(kind==='host'&&match){pauseMatch(match,'El anfitrión está volviendo a conectar.',now());saveLocal();}
  link?.close();
});
setInterval(() => {
  if (!match) return;
  if (authority()) {
    tickMatch(match, now());
    if (kind === "host" && now() - sendAt > 900) {
      sendAt = now();
      transmit();
    }
    render();
  }
}, 100);
try {
  const saved = JSON.parse(sessionStorage.getItem("sendero.together.local"));
  if (saved && validSnapshot(saved) && [2, 3, 4].includes(saved.players.length) && saved.players.every(p => p.id === `local-${p.seat}`)) {
    match = saved;
    kind = "local";
    localCount = match.players.length;
    localId = "local-0";
    match.lastTick = null;
    if (match.status !== "finished") {
      match.status = "paused";
      match.reason = "Recorrido recuperado en esta pantalla.";
      match.players.forEach((p) => {
        p.ready = false;
        p.connected = true;
        p.lastInputMs = -1000;
      });
    }
  }
} catch {}
if (location.hash && match) {
  match = null;
  kind = null;
  localId = null;
}
if(!match){
  try{
    const saved=JSON.parse(sessionStorage.getItem('sendero.together.host'));
    const guest=sessionStorage.getItem('sendero.together.guest');
    if(saved&&validSnapshot(saved.snapshot)&&saved.connection?.room&&saved.connection?.key&&!location.hash)createOnline(saved.snapshot.config,saved);
    else if(guest&&(!location.hash||guest===location.href))joinOnline(guest);
  }catch{}
}
document.body.classList.toggle("reduced-motion", reduced);
document.querySelector("#motion-toggle").setAttribute("aria-pressed", reduced);
render(true);
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});

main.addEventListener('change',e=>{if(e.target.id==='room-trail'){const reasoning=e.target.value==='razonar';const mode=document.querySelector('#room-mode');if(reasoning)mode.value='coop';mode.disabled=reasoning;}});
