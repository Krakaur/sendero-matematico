import { VERSION, SCHEMA, validateReport } from "./core.js";
import {LIVE_RECORD,validateLiveParticipation} from './cloud-room-contract.js';
import { validWorkshop } from "./workshop.js";
import { normalizeEnrollment, validEnrollment } from "./enrollment.js";
export const MULTIPLAYER_SCHEMA = "sendero.multiplayer-report.v1";
export function validateMultiplayerRecord(r) {
  if(r?.schema===LIVE_RECORD)return validateLiveParticipation(r);
  if (
    !r ||
    typeof r.id !== "string" ||
    !/^[a-zA-Z0-9-]{1,80}$/.test(r.id) ||
    typeof r.profile !== "string" ||
    !/^[a-zA-Z0-9-]{1,60}$/.test(r.profile) ||
    !["race", "coop"].includes(r.mode) ||
    !["local", "online"].includes(r.transport) ||
    !Number.isInteger(r.participants) ||
    r.participants < 2 ||
    r.participants > 4 ||
    !Number.isFinite(Date.parse(r.completedAt)) ||
    !Number.isFinite(r.finishedMs) ||
    r.finishedMs < 0 ||
    r.finishedMs > 86400000 ||
    !validEnrollment(r.enrollment)
  )
    throw Error("Participación multijugador no válida.");
  if (r.project) {
    if (
      typeof r.version !== "string" ||
      r.version.length > 20 ||
      !Number.isFinite(Date.parse(r.startedAt)) ||
      r.trail !== "razonar" ||
      r.mode !== "coop" ||
      !r.project.completedAt ||
      !validWorkshop(r.project) ||
      r.level !== r.project.level
    )
      throw Error("Proyecto compartido no válido.");
  } else validateReport({ schema: SCHEMA, profile: r.profile, sessions: [r] });
  return r;
}
export function validateMultiplayerReport(report) {
  if (
    report?.schema !== MULTIPLAYER_SCHEMA ||
    typeof report.profile !== "string" ||
    !Array.isArray(report.multiplayer) ||
    report.multiplayer.length > 5000
  )
    throw Error("Informe multijugador no válido.");
  report.multiplayer.forEach((r) => {
    validateMultiplayerRecord(r);
    if (r.profile !== report.profile)
      throw Error("El perfil no coincide con la participación.");
  });
  return report;
}
export function mergeMultiplayer(existing = [], incoming = []) {
  const canonical = (x) =>
    Array.isArray(x)
      ? x.map(canonical)
      : x && typeof x === "object"
        ? Object.fromEntries(
            Object.keys(x)
              .sort()
              .map((k) => [k, canonical(x[k])]),
          )
        : x;
  const result = new Map(existing.map((r) => [r.profile + ":" + r.id, r]));
  for (const r of incoming) {
    validateMultiplayerRecord(r);
    const key = r.profile + ":" + r.id;
    if (
      result.has(key) &&
      JSON.stringify(canonical(result.get(key))) !==
        JSON.stringify(canonical(r))
    )
      throw Error(
        "Hay dos contenidos para la misma participación. Se conservó el informe anterior; revisa el archivo recibido.",
      );
    if (!result.has(key)) result.set(key, structuredClone(r));
  }
  if (result.size > 5000)
    throw Error(
      "Se alcanzó el límite de participaciones. Exporta una copia antes de continuar.",
    );
  return [...result.values()];
}
export function participationRecord(
  match,
  playerId,
  binding,
  transport,
  at = new Date().toISOString(),
) {
  const p = match.players.find((p) => p.id === playerId);
  if (!p || p.index !== 8 || p.finishedMs === null || !binding) return null;
  const record = {
    id: match.id + "-" + p.seat,
    profile: binding.id,
    version: VERSION,
    trail: match.config.trail,
    level: match.config.level,
    mode: match.config.mode,
    transport,
    participants: match.players.length,
    startedAt: match.startedAt || at,
    completedAt: at,
    finishedMs: p.finishedMs,
    enrollment: normalizeEnrollment(binding.enrollment),
  };
  if (p.workshop) {
    record.project = structuredClone(p.workshop);
    for (const r of record.project.records) r.note = "";
  } else record.questions = structuredClone(p.questions);
  return validateMultiplayerRecord(record);
}
// Read the latest state, so another tab's individual progress is retained.
export function saveParticipation(storage, key, record) {
  const state = JSON.parse(storage.getItem(key));
  if (!state || state.profile !== record.profile)
    throw Error("No se encontró el perfil vinculado.");
  if ((state.multiplayerHistory || []).some((r) => r.id === record.id))
    return false;
  state.multiplayerHistory = mergeMultiplayer(state.multiplayerHistory || [], [
    record,
  ]);
  storage.setItem(key, JSON.stringify(state));
  return true;
}
