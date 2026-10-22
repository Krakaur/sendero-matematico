import { saveCloudCopy, restoreCloudCopy } from "./cloud.js";
import { classroomRequest } from "./classroom.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function cloudProfileHTML(profile, state) {
  return `<section class="panel"><h2>Continuar en otro dispositivo</h2><p>Puedes usar tu copia protegida descargada o una copia cifrada en el servidor de tu aula. La opción remota requiere una invitación y un servidor disponible; GitHub Pages por sí solo no guarda cuentas.</p>${profile && state.classroom ? `<form id="cloud-save" class="profile-form"><p>Destino: <strong>${esc(new URL(state.classroom.endpoint).host)}</strong>. Se guardarán este perfil, sus proyectos y su partida pendiente. La contraseña de la copia no se envía al servidor.</p><label>Contraseña de la copia remota<input name="password" type="password" minlength="10" maxlength="128" autocomplete="new-password" required></label><button class="primary">Guardar copia cifrada en el aula</button><p>Versión confirmada: ${Number(state.cloudRevision) || 0}. Si otro equipo guardó cambios, se detendrá la sustitución para evitar perderlos.</p></form>` : ""}<details><summary>Recuperar una copia del aula</summary><form id="cloud-restore" class="profile-form"><p>Utiliza la misma invitación y la contraseña de la copia. Antes de sustituir un perfil existente, conserva una copia local de sus cambios. El aula se vinculará de nuevo y podrá recibir las aventuras completas.</p><label>Invitación del aula<input name="invitation" type="file" accept=".json,application/json" required></label><label>Contraseña de la copia remota<input name="password" type="password" minlength="10" maxlength="128" autocomplete="current-password" required></label><label>Nueva contraseña local<input name="new-password" type="password" minlength="6" maxlength="128" autocomplete="new-password" required></label><button class="secondary">Recuperar desde mi aula</button></form></details><p id="cloud-status" role="status"></p><p class="micro">Guardar y recuperar son acciones explícitas. No se fusionan automáticamente cambios de dos dispositivos. Sin la contraseña de la copia no podemos descifrarla.</p></section>`;
}
export function classroomRosterHTML(state) {
  const link = state.classroom;
  if (!link) return "";
  if (link.role === "student")
    return `<section class="panel"><label><input id="include-projects" type="checkbox" ${link.includeProjects ? "checked" : ""}> Compartir también mis talleres libres y sus notas con mi docente</label><label><input id="include-multiplayer" type="checkbox" ${link.includeMultiplayer?"checked":""}> Compartir mis participaciones multijugador y su adscripción escolar con mi docente</label><p>Las participaciones se reciben por separado; no incluyen datos escolares de los oponentes ni notas libres de proyectos compartidos.</p>${link.capabilities?.includes('multiplayer')?'':'<p>El aula todavía no ha confirmado soporte para participaciones multijugador. Hasta entonces, se conservarán aquí y podrán exportarse.</p>'}<p>Este control corresponde sólo a los talleres libres. Las tareas asignadas completas se entregan con sus respuestas, construcciones, ayudas, revisiones y notas opcionales aunque este control esté desactivado. Desvincular el aula detiene todas las entregas posteriores; no retira lo ya recibido. Evita datos personales en las notas.</p></section>`;
  if (!link.capabilities?.includes("students")) return "";
  return `<section class="panel"><h2>Participantes de esta aula</h2><p>Las invitaciones separan el acceso de cada estudiante. Se muestran códigos de perfil; no nombres personales.</p><button id="create-student-invitation" class="secondary">Crear una invitación de estudiante</button><p id="roster-status" role="status"></p>${(link.students || []).map((s) => `<div class="session-row"><span>${s.profile ? "Perfil " + esc(s.profile.slice(0, 8).toUpperCase()) : "Invitación aún sin vincular"} · ${esc(s.id.slice(0, 8))}${s.enrollment?`<br><small>${[s.enrollment.school,s.enrollment.grade,s.enrollment.group,s.enrollment.listNumber===null?'':'Lista '+s.enrollment.listNumber].map(x=>esc(x||'Sin registrar')).join(' · ')}</small>`:''}</span><button class="soft-button" data-revoke-student="${esc(s.id)}">Revocar acceso</button></div>`).join("")}<p class="micro">La revocación impide nuevos accesos y elimina su copia remota cifrada. Los informes ya entregados permanecen en el aula.</p></section>`;
}
export function bindCloud(
  root,
  profile,
  state,
  { save, render, enter, download, sync, isCurrent = () => true },
) {
  const status = (id, message) => {
    if (isCurrent() && root.querySelector(id))
      root.querySelector(id).textContent = message;
  };
  root.querySelector('#include-multiplayer')?.addEventListener('change',e=>{state.classroom.includeMultiplayer=e.target.checked;save();if(e.target.checked)sync();});
  root.querySelector("#include-projects")?.addEventListener("change", (e) => {
    state.classroom.includeProjects = e.target.checked;
    save();
    if (e.target.checked) sync();
  });
  root.querySelector("#cloud-save")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      b = form.querySelector("button"),
      password = new FormData(form).get("password");
    b.disabled = true;
    const destination = state.classroom.token;
    try {
      const result = await saveCloudCopy(profile, state, password);
      if (!isCurrent() || state.classroom?.token !== destination) return;
      state.cloudRevision = result.revision;
      save();
      form.reset();
      status(
        "#cloud-status",
        `Copia confirmada: versión ${result.revision}. Ya puedes recuperarla en el otro dispositivo.`,
      );
    } catch (error) {
      status("#cloud-status", error.message);
    } finally {
      b.disabled = false;
    }
  });
  root
    .querySelector("#cloud-restore")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.currentTarget,
        b = form.querySelector("button"),
        data = new FormData(form);
      b.disabled = true;
      try {
        const file = data.get("invitation");
        if (file.size > 10000)
          throw Error("La invitación es demasiado grande.");
        const invitation = JSON.parse(await file.text());
        const host = new URL(invitation.endpoint).host;
        if (
          !confirm(
            `¿Recuperar la copia desde ${host}? Si el perfil ya existe aquí, se sustituirá por la copia remota; se conservará además su estado local anterior para recuperación técnica.`,
          )
        )
          return;
        const result = await restoreCloudCopy(
          localStorage,
          invitation,
          data.get("password"),
          data.get("new-password"),
        );
        if (!isCurrent()) return;
        result.state.classroom = result.link;
        enter(result.profile, result.state);
      } catch (error) {
        status("#cloud-status", error.message);
      } finally {
        b.disabled = false;
      }
    });
  root
    .querySelector("#create-student-invitation")
    ?.addEventListener("click", async (e) => {
      const b = e.currentTarget;
      b.disabled = true;
      try {
        const invitation = await classroomRequest(
          state.classroom,
          "/students",
          {},
        );
        invitation.endpoint = state.classroom.endpoint;
        download(
          "sendero-invitacion-estudiante.json",
          JSON.stringify(invitation, null, 2),
          "application/json",
        );
        await sync();
      } catch (error) {
        root.querySelector("#roster-status").textContent = error.message;
      } finally {
        b.disabled = false;
      }
    });
  root.querySelectorAll("[data-revoke-student]").forEach((b) =>
    b.addEventListener("click", async () => {
      if (
        !confirm(
          "¿Revocar esta invitación? Se eliminará su copia remota cifrada y dejará de permitir accesos. Los informes entregados se conservarán.",
        )
      )
        return;
      b.disabled = true;
      try {
        await classroomRequest(state.classroom, "/students/revoke", {
          id: b.dataset.revokeStudent,
        });
        await sync();
      } catch (error) {
        root.querySelector("#roster-status").textContent = error.message;
      } finally {
        b.disabled = false;
      }
    }),
  );
}
