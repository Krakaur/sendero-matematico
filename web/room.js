import {newWorkshop,applyWorkshopAction,validWorkshop,workshopSummary} from './workshop.js';
import { makeQuestion, recordAttempt } from "./core.js";
import { CIRCUITS } from "./circuit.js";
export const ROOM_PROTOCOL = 1;
export const PLAYER_NAMES = ["Luma", "Nube", "Rayo", "Chispa"];
export function seededRandom(seed) {
  let n = seed >>> 0;
  return () => {
    n = (n + 0x6d2b79f5) >>> 0;
    let t = Math.imul(n ^ (n >>> 15), n | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function validConfig(c) {
  return (
    !!c &&
    ["suma", "resta", "multi", "tablas20", "razonar"].includes(c.trail) &&
    Number.isInteger(c.level) &&
    c.level >= 1 &&
    c.level <= 4 &&
    Object.hasOwn(CIRCUITS, c.circuit) &&
    ["race", "coop"].includes(c.mode) &&
    (c.trail!=="razonar"||c.mode==="coop") &&
    Number.isInteger(c.seed) &&
    c.seed >= 0 &&
    c.seed <= 4294967295
  );
}
export function sharedDeck(config) {
  if (!validConfig(config)) throw Error("Configuración de partida no válida.");
  if(config.trail==='razonar')return [];
  const rng = seededRandom(config.seed),
    deck = [],
    seen = new Set();
  for (let i = 0; i < 8; i++) {
    let q;
    for (let tries = 0; tries < 100; tries++) {
      q = makeQuestion(config.trail, config.level, rng);
      if (!seen.has(`${q.a}:${q.b}`)) break;
    }
    seen.add(`${q.a}:${q.b}`);
    deck.push(q);
  }
  return deck;
}
export function createMatch(config, id = crypto.randomUUID()) {
  if (!validConfig(config)) throw Error("Configuración de partida no válida.");
  return {
    protocol: ROOM_PROTOCOL,
    id,
    revision: 0,
    config: { ...config },
    status: "lobby",
    players: [],
    elapsedMs: 0,
    lastTick: null,
    startAt: null,
    reason: "",
    tieWindowMs: 0,
  };
}
export function addPlayer(match, id) {
  if (
    match.status !== "lobby" ||
    (match.players.length >= 4 && !match.players.some(p=>!p.connected)) ||
    typeof id !== "string" ||
    id.length > 80 ||
    match.players.some((p) => p.id === id)
  )
    return false;
  const vacant=match.players.findIndex(p=>!p.connected);
  const seat=vacant>=0?vacant:match.players.length;
  const player={
    id,
    seat,
    name: PLAYER_NAMES[seat],
    ready: false,
    connected: true,
    index: 0,
    finishedMs: null,
    lastInputMs: -1000,
    ...(match.config.trail==='razonar'?{workshop:newWorkshop(match.config.level,match.config.seed)}:{}),
    questions: sharedDeck(match.config).map((q, i) => ({
      ...q,
      options: [
        ...q.options.slice((seat + i) % 4),
        ...q.options.slice(0, (seat + i) % 4),
      ],
    })),
  };
  if(vacant>=0)match.players[vacant]=player;else match.players.push(player);
  match.revision++;
  return true;
}
export function reconnectPlayer(match,id){
  const p=match.players.find(p=>p.id===id);if(!p||p.connected)return false;
  p.connected=true;p.ready=false;p.lastInputMs=-1000;match.revision++;return true;
}
export function removeWaitingPlayer(match,id){
  if(match.status!=='lobby')return false;const at=match.players.findIndex(p=>p.id===id&&!p.connected);
  if(at<0)return false;match.players.splice(at,1);match.players.forEach((p,i)=>{p.seat=i;p.name=PLAYER_NAMES[i];});match.revision++;return true;
}
export function tickMatch(match, now) {
  if (!Number.isFinite(now)) return;
  if (match.status === "countdown" && now >= match.startAt) {
    match.status = "running";
    match.lastTick = match.startAt;
    match.revision++;
  }
  if (match.status !== "running") return;
  const dt = Math.max(0, now - match.lastTick);
  match.lastTick = now;
  match.elapsedMs += dt;
  for (const p of match.players)
    if (p.index < 8 && p.questions[p.index]) p.questions[p.index].activeMs += dt;
}
export function pauseMatch(match, reason, now) {
  tickMatch(match, now);
  if (!["running", "countdown"].includes(match.status)) return false;
  match.status = "paused";
  match.reason = String(reason).slice(0, 120);
  match.lastTick = null;
  match.startAt = null;
  for (const p of match.players) {
    p.ready = false;
    const q = p.questions[p.index];
    if (q && !q.attempts.length) q.timingInterrupted = true;
  }
  match.revision++;
  return true;
}
export function startMatch(match, now) {
  if (
    !["lobby", "paused"].includes(match.status) ||
    match.players.length < 2 ||
    !match.players.every((p) => p.ready && p.connected) ||
    !Number.isFinite(now)
  )
    return false;
  match.startedAt ??= new Date().toISOString();
  match.status = "countdown";
  match.startAt = now + 2100;
  match.lastTick = null;
  match.reason = "";
  match.revision++;
  return true;
}
export function playerAction(match, id, action, now) {
  const p = match.players.find((p) => p.id === id);
  if (!p || !p.connected || !action || typeof action !== "object") return false;
  tickMatch(match, now);
  if (action.type === "ready" && ["lobby", "paused"].includes(match.status)) {
    p.ready = !p.ready;
    match.revision++;
    return true;
  }
  if (action.type === "pause")
    return pauseMatch(match, `${p.name} ha pedido una pausa.`, now);
  if(action.type==='project'&&match.config.trail==='razonar'){
    if(match.status!=='running'||p.index>=8||action.index!==p.index||!applyWorkshopAction(p.workshop,action.change))return false;
    p.index=p.workshop.completedAt?8:p.workshop.index;
    if(p.index===8)p.finishedMs=match.elapsedMs;
    if(match.players.every(p=>p.index===8)){match.status='finished';match.lastTick=null;}
    match.revision++;return true;
  }
  if (
    match.status !== "running" ||
    p.index >= 8 ||
    action.index !== p.index ||
    now - p.lastInputMs < 140
  )
    return false;
  const q = p.questions[p.index];
  if(!q)return false;
  if (action.type === "hint") {
    if (q.hint) return false;
    q.hint = true;
    p.lastInputMs = now;
    match.revision++;
    return true;
  }
  if (
    action.type !== "answer" ||
    !Number.isInteger(action.value) ||
    !recordAttempt(q, action.value)
  )
    return false;
  p.lastInputMs = now;
  if (q.done) {
    p.index++;
    if (p.index === 8) p.finishedMs = match.elapsedMs;
  }
  if (match.players.every((p) => p.index === 8)) {
    match.status = "finished";
    match.lastTick = null;
  }
  match.revision++;
  return true;
}
export function disconnectPlayer(match, id, now) {
  const p = match.players.find((p) => p.id === id);
  if (!p) return;
  pauseMatch(
    match,
    `${p.name} perdió la conexión. No se adjudica una victoria por desconexión.`,
    now,
  );
  p.connected = false;
  p.ready = false;
  match.revision++;
}
export function matchResults(match) {
  if(match.config.trail==='razonar')return match.players.map(p=>{const s=workshopSummary(p.workshop);return {id:p.id,name:p.name,seat:p.seat,finishedMs:p.finishedMs,completed:s.completed,first:p.workshop.records.filter(r=>r.checks[0]?.correct).length,independent:s.independent,corrected:8-s.independent,hints:p.workshop.records.filter(r=>r.hint).length,place:null};});
  const arrived = match.players
      .filter((p) => p.finishedMs !== null)
      .sort((a, b) => a.finishedMs - b.finishedMs),
    window = Math.max(0, match.tieWindowMs || 0),
    places = new Map();
  let groupStart = -Infinity,
    place = 0;
  for (let i = 0; i < arrived.length; i++) {
    const p = arrived[i];
    if (p.finishedMs > groupStart + window) {
      groupStart = p.finishedMs;
      place = i + 1;
    }
    places.set(p.id, place);
  }
  return match.players
    .map((p) => ({
      id: p.id,
      name: p.name,
      seat: p.seat,
      finishedMs: p.finishedMs,
      completed: p.index,
      first: p.questions.filter((q) => q.attempts[0] === q.answer).length,
      independent: p.questions.filter(
        (q) => q.attempts[0] === q.answer && !q.hint,
      ).length,
      corrected: p.questions.filter((q) => q.done && q.attempts.length > 1)
        .length,
      hints: p.questions.filter((q) => q.hint).length,
      place:
        p.finishedMs === null || match.config.mode === "coop"
          ? null
          : places.get(p.id),
    }))
    .sort((a, b) => (a.finishedMs ?? Infinity) - (b.finishedMs ?? Infinity));
}
export function publicSnapshot(match, now) {
  tickMatch(match, now);
  return {
    ...structuredClone(match),
    lastTick: null,
    startAt: null,
    countdownMs:
      match.status === "countdown" ? Math.max(0, match.startAt - now) : 0,
  };
}
export function validSnapshot(s) {
  if (
    !s ||
    s.protocol !== 1 ||
    typeof s.id !== "string" ||
    s.id.length > 80 ||
    !validConfig(s.config) ||
    !Number.isInteger(s.revision) ||
    s.revision < 0 ||
    !["lobby", "countdown", "running", "paused", "finished"].includes(
      s.status,
    ) ||
    !Number.isFinite(s.elapsedMs) ||
    s.elapsedMs < 0 ||
    s.elapsedMs > 86400000 ||
    !Array.isArray(s.players) ||
    s.players.length > 4 ||
    !Number.isFinite(s.countdownMs) ||
    s.countdownMs < 0 ||
    s.countdownMs > 2200
  )
    return false;
  if (
    !Number.isFinite(s.tieWindowMs) ||
    s.tieWindowMs < 0 ||
    s.tieWindowMs > 1000
  )
    return false;
  const deck = sharedDeck(s.config),
    ids = new Set();
  return s.players.every((p, i) => {
    if (
      typeof p.id !== "string" ||
      p.id.length > 80 ||
      ids.has(p.id) ||
      p.seat !== i ||
      p.name !== PLAYER_NAMES[i] ||
      !Number.isInteger(p.index) ||
      p.index < 0 ||
      p.index > 8 ||
      !Array.isArray(p.questions) ||
      p.questions.length !== (s.config.trail==='razonar'?0:8) ||
      typeof p.ready !== "boolean" ||
      typeof p.connected !== "boolean" ||
      !(
        p.finishedMs === null ||
        (Number.isFinite(p.finishedMs) &&
          p.finishedMs >= 0 &&
          p.finishedMs <= s.elapsedMs)
      )
    )
      return false;
    ids.add(p.id);
    if(s.config.trail==='razonar')return validWorkshop(p.workshop)&&p.workshop.level===s.config.level&&p.workshop.seed===s.config.seed&&p.index===(p.workshop.completedAt?8:p.workshop.index);
    return p.questions.every(
      (q, j) =>
        q.a === deck[j].a &&
        q.b === deck[j].b &&
        q.answer === deck[j].answer &&
        q.level === s.config.level &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        new Set(q.options).size === 4 &&
        q.options.every((n) => deck[j].options.includes(n)) &&
        Array.isArray(q.attempts) &&
        q.attempts.length <= 4 &&
        new Set(q.attempts).size === q.attempts.length &&
        q.attempts.every((n) => q.options.includes(n)) &&
        !!q.done === j < p.index &&
        (!q.done || q.attempts.at(-1) === q.answer) &&
        Number.isFinite(q.activeMs) &&
        q.activeMs >= 0 &&
        q.activeMs <= 86400000,
    );
  });
}
