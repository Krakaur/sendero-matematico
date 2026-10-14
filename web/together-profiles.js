import { profileList, profileKey, loginProfile } from "./profiles.js";
import { normalizeEnrollment, escapeHTML as esc } from "./enrollment.js";
import {
  participationRecord,
  saveParticipation,
} from "./multiplayer-records.js";
import { exchangeClassroom, applyExchange } from "./classroom.js";

// These bindings belong to this tab only. Never attach them to a room snapshot.
export function togetherProfiles(storage, tabStorage, onChange) {
  const key = "sendero.together.profiles";
  let bindings = [null, null],
    captured = null,
    message = "",
    persistError = false;
  const processed = new Set(),
    syncing = new Set();
  const list = () => profileList(storage).filter((p) => p.role === "student");
  const binding = (id) => {
    const p = list().find((p) => p.id === id);
    if (!p) return null;
    const s = JSON.parse(storage.getItem(profileKey(id)));
    return s?.profile === id
      ? { id, name: p.name, enrollment: normalizeEnrollment(s.enrollment) }
      : null;
  };
  try {
    const saved = JSON.parse(tabStorage.getItem(key));
    if (saved?.bindings?.length === 2) {
      bindings = saved.bindings.map((b) => b && binding(b.id));
      captured = saved.captured;
    } else bindings[0] = binding(tabStorage.getItem("sendero.active"));
  } catch {}
  const persist = () => {
    try {
      tabStorage.setItem(key, JSON.stringify({ bindings, captured }));
    } catch {
      persistError = true;
    }
  };
  function panel() {
    let profiles = [];
    try {
      profiles = list();
    } catch {
      message = "No se pudo leer la lista de perfiles.";
    }
    return `<section class="room-profile-panel"><h2>Guardar mi participación</h2><p>Elige un perfil local o juega como invitado. Tu alias y tus datos escolares no se muestran a tus compañeros. En una sala por enlace se usa solo el primer perfil; la segunda plaza es para compartir esta pantalla.</p><div class="room-profile-grid">${[0, 1].map((i) => `<form data-profile-seat="${i}"><h3>${i ? "Segunda persona · misma pantalla" : "Mi perfil"}</h3><p>${bindings[i] ? `Vinculado: <strong>${esc(bindings[i].name)}</strong>` : "Invitado · sin expediente"}</p><label>Perfil<select name="profile"><option value="">Invitado</option>${profiles.map((p) => `<option value="${esc(p.id)}" ${bindings[i]?.id === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label><label>Contraseña del perfil<input name="password" type="password" autocomplete="current-password"></label><button class="secondary" type="submit">Usar este perfil</button></form>`).join("")}</div><p><a href="./#perfiles">Crear perfil o completar mis datos escolares</a></p><p role="status">${esc(message)}</p></section>`;
  }
  function bind(root) {
    root.addEventListener("submit", async (e) => {
      const form = e.target.closest("[data-profile-seat]");
      if (!form) return;
      e.preventDefault();
      const seat = Number(form.dataset.profileSeat),
        f = new FormData(form),
        id = f.get("profile"),
        button = form.querySelector("button");
      button.disabled = true;
      try {
        if (!id) bindings[seat] = null;
        else {
          if (bindings[1 - seat]?.id === id)
            throw Error("Cada persona necesita un perfil distinto.");
          const result = await loginProfile(storage, id, f.get("password"));
          if (result.profile.role !== "student")
            throw Error("Elige un perfil de estudiante.");
          bindings[seat] = binding(id);
        }
        captured = null;
        message = bindings[seat]
          ? "Perfil vinculado. Se guardarán tus próximas participaciones."
          : "Jugarás como invitado, sin guardar un expediente.";
        persist();
      } catch (error) {
        message = error.message;
      } finally {
        onChange();
      }
    });
  }
  async function sync(id) {
    if (syncing.has(id)) return;
    const pk = profileKey(id);
    let state;
    try {
      state = JSON.parse(storage.getItem(pk));
    } catch {
      return;
    }
    if (
      !state?.classroom?.enabled ||
      !state.classroom.includeMultiplayer ||
      state.classroom.retryAt > Date.now() ||
      globalThis.navigator?.onLine === false
    )
      return;
    const token = state.classroom.token;
    syncing.add(id);
    try {
      const result = await exchangeClassroom(structuredClone(state));
      const latest = JSON.parse(storage.getItem(pk));
      if (latest?.classroom?.token !== token || !latest.classroom.enabled)
        return;
      applyExchange(latest, result);
      storage.setItem(pk, JSON.stringify(latest));
      message = latest.classroom.multiplayerReceived?.length
        ? "Participación guardada; el aula confirmó los envíos disponibles."
        : "Participación guardada. Revisa la sincronización desde tu perfil.";
    } catch (error) {
      const latest = JSON.parse(storage.getItem(pk));
      if (latest?.classroom?.token === token) {
        latest.classroom.error = error.message;
        latest.classroom.retryAt = Date.now() + (error.retryAfter || 60) * 1000;
        storage.setItem(pk, JSON.stringify(latest));
      }
      message =
        "Participación guardada en este dispositivo. El aula no pudo confirmar el envío; vuelve a tu perfil para reintentar.";
    } finally {
      syncing.delete(id);
      onChange();
    }
  }
  function capture(match, kind, localId) {
    if (!match) return;
    if (captured?.matchId !== match.id) {
      // Refresh enrollment at the beginning of a new match, never mid-match.
      const selected = bindings.map((b) => b && binding(b.id));
      captured = { matchId: match.id, bindings: selected };
      persist();
    }
    const players =
      kind === "local"
        ? match.players
        : match.players.filter((p) => p.id === localId);
    for (const p of players) {
      const b = captured.bindings[kind === "local" ? p.seat : 0],
        recordId = match.id + "-" + p.seat;
      if (!b || p.index !== 8 || processed.has(recordId)) continue;
      try {
        const record = participationRecord(
          match,
          p.id,
          b,
          kind === "local" ? "local" : "online",
        );
        if (record) {
          saveParticipation(storage, profileKey(b.id), record);
          processed.add(recordId);
          message =
            "Participación guardada en tu perfil, separada de la práctica individual.";
          void sync(b.id);
        }
      } catch (error) {
        processed.add(recordId);
        message = "No se pudo guardar la participación: " + error.message;
      }
    }
  }
  function status() {
    return `<p class="room-notice" role="status">${esc(message || "Los perfiles vinculados guardan sus resultados al completar los ocho retos. Los invitados no generan expediente.")}${persistError ? " No se pudo conservar la vinculación para recuperar esta pestaña." : ""}</p><a class="room-return" href="./#progreso">Ver mis resultados y sincronizar el aula</a>`;
  }
  return { panel, bind, capture, status };
}
