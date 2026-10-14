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
  tickMatch,
  publicSnapshot,
  validSnapshot,
  matchResults,
} from "./room.js";
import { RoomLink, readRoomInvitation } from "./room-link.js";
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
  mode: document.querySelector("#room-mode").value,
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
function reset() {
  stopView();
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
  } catch {}
}
function saveLocal() {
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
function setup() {
  stopView();
  let incoming = "";
  try {
    if (location.hash)
      (readRoomInvitation(location.href), (incoming = location.href));
  } catch {
    error =
      "La invitación está incompleta. Pide que te compartan el enlace completo.";
  }
  main.innerHTML = `<section class="room-intro"><div><span class="eyebrow">JUGAR, PENSAR Y COMPARTIR</span><h1>El río se disfruta<br>en compañía.</h1><p>Resuelvan los mismos ocho retos. Pueden competir o ayudar a que todo el equipo llegue a la meta.</p><p class="room-notice">Personajes diferentes, mismas condiciones: contenido, nivel y circuito compartidos. Cada persona responde sus propios retos.</p></div><div class="room-hero" aria-hidden="true"><strong>La copa compartida</strong>${canoeSVG(0)}${canoeSVG(1)}</div></section>${errorHTML()}<section class="room-setup"><h2>Preparen el recorrido</h2><div class="room-fields"><label>Contenido<select id="room-trail">${["suma", "resta", "multi", "tablas20"].map((t) => `<option value="${t}" ${t === "multi" ? "selected" : ""}>${TRAILS[t].short}</option>`).join("")}</select></label><label>Nivel de cantidades<select id="room-level">${[1, 2, 3, 4].map((l) => `<option value="${l}">Nivel ${l}</option>`).join("")}</select></label><label>Forma de jugar<select id="room-mode"><option value="race">Carrera amistosa</option><option value="coop">Llegar en equipo</option></select></label>${circuitPicker()}</div><div class="room-choices"><button class="primary" id="local-create" ${busy ? "disabled" : ""}>Dos en esta pantalla</button><button class="secondary" id="online-create" ${busy ? "disabled" : ""}>Crear sala por enlace</button></div><p class="room-notice">En esta pantalla: dos zonas de respuesta o teclas A S D F y J K L Ñ. Funciona sin internet cuando el juego está preparado. Por enlace: de dos a cuatro personas, cada una en su dispositivo.</p><details><summary>Cómo funcionan las salas privadas</summary><p class="room-notice">Solo entra quien tenga la invitación. Al crear o unirse, PeerJS conecta los navegadores y recibe datos técnicos de conexión; los retos y respuestas viajan entre participantes. No se envía tu perfil ni historial. No hay cámara, micrófono ni chat. Algunas redes impiden la conexión directa: si ocurre, prueben otra red o compartan pantalla. Mantén abierta la pestaña que creó la sala.</p></details><div class="room-join"><label for="invite-input">¿Te compartieron una invitación?</label><input id="invite-input" type="text" maxlength="500" placeholder="Pega aquí el enlace de la sala" value="${esc(incoming)}"><button class="secondary" id="online-join" ${busy ? "disabled" : ""}>Entrar en la sala</button></div><p id="connect-status" role="status" class="room-notice">${busy ? "Conectando…" : ""}</p></section><a class="room-return" href="./">Volver a mi aventura individual</a><p class="room-notice">Estos recorridos compartidos no se incorporan al expediente individual: pueden incluir colaboración y no verifican quién responde. Web ${VERSION}.</p>`;
}
function roster() {
  return `<div class="room-roster">${match.players.map((p) => `<article class="room-person" data-ready="${p.ready}">${canoeSVG(p.seat)}<strong>${p.name}${p.id === localId && !local() ? " · Tú" : ""}</strong><small>${!p.connected ? "Sin conexión" : p.ready ? "Preparado para salir" : "Preparando el recorrido"}</small>${local() || p.id === localId ? `<button class="${p.ready ? "secondary" : "primary"}" data-ready="${esc(p.id)}" ${!p.connected ? "disabled" : ""}>${p.ready ? "Todavía no" : `Estoy listo · ${p.name}`}</button>` : ""}</article>`).join("")}</div>`;
}
function lobby() {
  stopView();
  const ready =
      match.players.length >= 2 &&
      match.players.every((p) => p.ready && p.connected),
    paused = match.status === "paused";
  main.innerHTML = `<section class="room-setup"><span class="eyebrow">${paused ? "PAUSA COMPARTIDA" : "LA COPA COMPARTIDA"}</span><h1>${paused ? "Tomamos un respiro" : "Todos a la salida"}</h1><p>${TRAILS[match.config.trail].short} · Nivel ${match.config.level} · ${CIRCUITS[match.config.circuit].name} · ${match.config.mode === "coop" ? "Llegar en equipo" : "Carrera amistosa"}</p>${paused ? `<p class="room-paused">${esc(match.reason)} El reloj de todos está detenido. Cada participante debe confirmar para continuar.</p>` : ""}${errorHTML()}${kind === "host" && !paused ? `<label for="room-invitation">Invita a quienes van a jugar contigo</label><input class="room-link-field" id="room-invitation" readonly value="${esc(invitation)}"><button id="copy-invitation" class="soft-button">Copiar invitación</button><p id="copy-status" class="room-notice" role="status">La sala admite hasta cuatro personas. Compartan el enlace de forma privada.</p>` : ""}${roster()}<div class="room-choices">${authority() ? `<button class="primary" id="room-start" ${ready ? "" : "disabled"}>${paused ? "Continuar juntos" : "¡Al río!"}</button>` : '<p class="room-notice">Cuando todos estén listos, quien creó la sala dará la salida.</p>'}<button class="secondary" id="room-exit">${paused ? "Terminar este recorrido" : "Volver a preparar"}</button></div><p class="room-notice">${match.config.mode === "coop" ? "La meta se consigue cuando todo el equipo termina. Pueden explicar estrategias a quien lo necesite." : "Gana quien termina primero. La carrera continúa hasta que todos completan sus retos. Corregir permite seguir avanzando."}</p></section>`;
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
  if (p.index === 8)
    return `<article class="player-console" data-seat="${p.seat}"><strong>${p.name} llegó a la meta.</strong><p class="console-feedback">El recorrido continúa para las demás personas.${match.config.mode === "coop" ? " Puedes explicar una estrategia a tu equipo." : ""}</p><p>${p.questions.filter((q) => q.attempts[0] === q.answer).length}/8 aciertos iniciales.</p></article>`;
  const q = p.questions[p.index],
    failing = q.attempts.length > 0,
    keys = p.seat === 0 ? ["A", "S", "D", "F"] : ["J", "K", "L", "Ñ"],
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
        match.status,
        pendingUntil > now(),
      ]);
    if (consoleKeys.get(p.id) === key) continue;
    const old = container.querySelector(`[data-seat="${p.seat}"]`),
      focused = old?.contains(document.activeElement),
      t = document.createElement("template");
    t.innerHTML = consoleHTML(p);
    if (old) old.replaceWith(t.content);
    else container.append(t.content);
    consoleKeys.set(p.id, key);
    if (focused && p.index < 8)
      container
        .querySelector(`[data-seat="${p.seat}"] .console-equation`)
        ?.focus({ preventScroll: true });
  }
}
function play() {
  if (!main.querySelector(".room-scene")) {
    stopView();
    main.innerHTML = `<div class="room-controls"><div><h1>${match.config.mode === "coop" ? "Llegamos en equipo" : "Carrera amistosa"}</h1><p>${TRAILS[match.config.trail].short} · Nivel ${match.config.level} · ${match.players.length} personas</p></div><button id="room-pause" class="soft-button">Pausar para todos</button></div>${sceneHTML()}<div class="room-progress"><span id="room-team-progress"></span>${mapHTML()}<strong id="room-clock">0.0 s</strong></div><div class="room-live-standings" aria-label="Retos completados por participante"></div><div class="room-answers ${local() ? "" : "solo"}"></div><p class="room-notice">${local() ? "Dos personas, dos zonas de respuesta." : "Mantén esta pestaña visible. Si alguien necesita salir, la partida se pausa para todos."}</p>`;
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
    coop = match.config.mode === "coop";
  main.innerHTML = `<section class="room-summary">${errorHTML()}<span class="eyebrow">RECORRIDO COMPLETO</span><h1>${coop ? "¡Todo el equipo llegó!" : rows.filter((p) => p.place === 1).length > 1 ? "¡Llegada compartida!" : `${winner} llega primero`}</h1><p>${coop ? "Cada participante completó sus ocho retos." : "La posición describe esta carrera; la precisión y las ayudas se interpretan por separado."}</p><div class="table-wrap"><table><caption class="sr-only">Resultados de la partida compartida</caption><thead><tr>${coop ? "" : "<th>Posición</th>"}<th>Participante</th><th>Primera respuesta</th><th>Sin ayuda</th><th>Correcciones</th><th>Tiempo</th></tr></thead><tbody>${rows.map((p) => `<tr>${coop ? "" : `<td>${p.place}.º</td>`}<td>${p.name}</td><td>${p.first}/8</td><td>${p.independent}/8</td><td>${p.corrected}</td><td>${(p.finishedMs / 1000).toFixed(1)} s</td></tr>`).join("")}</tbody></table></div>${!local() ? `<p class="room-notice">Se considera llegada compartida una diferencia de hasta ${Math.round(match.tieWindowMs)} ms por la incertidumbre de conexión. Es una carrera amistosa, sin clasificación pública ni acreditación de identidad.</p>` : ""}<div class="room-choices">${authority() ? '<button id="room-rematch" class="primary">Otro recorrido juntos</button>' : "<p>Quien creó la sala puede preparar otra partida.</p>"}<button id="room-exit" class="secondary">Elegir otra experiencia</button></div>${match.players
    .filter((p) => local() || p.id === localId)
    .map(
      (p) =>
        `<h2>${p.name}: pensar después de jugar</h2>${learningReviewHTML({ trail: match.config.trail, questions: p.questions })}`,
    )
    .join(
      "",
    )}<p class="room-notice">La cooperación y la ayuda entre personas hacen que estos resultados tengan un contexto diferente al de la práctica individual. No se añaden al expediente individual.</p></section>`;
  announce(
    coop
      ? "Todo el equipo completó el recorrido."
      : `Recorrido completo. Primera posición: ${winner}.`,
  );
}
function render(force = false) {
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
    cam = view.draw(follow, w, h, getReduced());
  scene.querySelectorAll("[data-room-racer]").forEach((el, i) => {
    const p = view.project(
      displayPositions[i].position,
      i,
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
      i,
    );
    el.setAttribute("cx", p.x);
    el.setAttribute("cy", p.y);
  });
  const elapsed =
    match.elapsedMs +
    (!authority() && match.status === "running"
      ? Math.min(1100, t - snapshotAt)
      : 0);
  main.querySelector("#room-clock").textContent =
    (elapsed / 1000).toFixed(1) + " s";
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
    if (pendingUntil > now() && ["answer", "hint"].includes(action.type))
      return;
    link?.send(action);
    if (["answer", "hint"].includes(action.type)) {
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
async function createOnline(config) {
  reset();
  busy = true;
  setup();
  kind = "host";
  link = new RoomLink({
    join: (id) => (match ? addPlayer(match, id) : false),
    connected: () => {
      transmit();
      render(true);
    },
    action: (id, a) => {
      if (!a || !["ready", "answer", "hint", "pause"].includes(a.type)) return;
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
    invitation = await link.create();
    if (link.closed) return;
    localId = link.id;
    match = createMatch(config);
    addPlayer(match, localId);
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
        "Se perdió la conexión con la sala. No se adjudica una victoria. Pide un enlace nuevo.",
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
main.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled || e.detail > 1) return;
  if (b.id === "local-create") {
    const config = configuration();
    reset();
    kind = "local";
    localId = "local-0";
    match = createMatch(config);
    addPlayer(match, "local-0");
    addPlayer(match, "local-1");
    render(true);
  }
  if (b.id === "online-create") createOnline(configuration());
  if (b.id === "online-join")
    joinOnline(document.querySelector("#invite-input").value);
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
  if (b.id === "room-rematch" && authority()) {
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
    ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)
  )
    return;
  const key = e.key.toLowerCase(),
    keys = local()
      ? ["a", "s", "d", "f", "j", "k", "l", "ñ"]
      : ["1", "2", "3", "4"],
    at = keys.indexOf(key);
  if (at < 0) return;
  const p = local()
      ? match.players[Math.floor(at / 4)]
      : match.players.find((p) => p.id === localId),
    q = p?.questions[p.index];
  if (!q) return;
  e.preventDefault();
  act(p.id, { type: "answer", index: p.index, value: q.options[at % 4] });
});
document.querySelector("#motion-toggle").addEventListener("click", (e) => {
  reduced = !reduced;
  document.body.classList.toggle("reduced-motion", reduced);
  e.currentTarget.setAttribute("aria-pressed", reduced);
});
document.addEventListener("visibilitychange", () => {
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
  if (local()) {
    pauseMatch(
      match,
      "Volviste al recorrido. Confirmen para continuar.",
      now(),
    );
    saveLocal();
  }
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
  if (saved && validSnapshot(saved) && saved.players.length === 2) {
    match = saved;
    kind = "local";
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
document.body.classList.toggle("reduced-motion", reduced);
document.querySelector("#motion-toggle").setAttribute("aria-pressed", reduced);
render(true);
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("./sw.js").catch(() => {});
