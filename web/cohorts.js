import {
  normalizeEnrollment,
  schoolKey,
  csvCell,
  escapeHTML as esc,
} from "./enrollment.js";
import { TRAILS } from "./core.js";
export function cohortRows(state, teacher = false) {
  const rows = [];
  const add = (record, profile, context, transport = "individual") => {
    const enrollment = normalizeEnrollment(record.enrollment);
    const project = record.project || (record.records ? record : null);
    const base = {
      ...enrollment,
      id: record.id,
      profile,
      at: record.completedAt,
      trail: record.trail || "razonar",
      context,
      transport,
    };
    if (project) {
      rows.push({
        ...base,
        level: project.level,
        items: project.records.length,
        first: project.records.filter((r) => r.checks[0]?.correct).length,
        independent: project.records.filter(
          (r) =>
            r.checks[0]?.correct && r.reasonAttempts.length === 1 && !r.hint,
        ).length,
        kind: "Modelo y justificación",
        activeMs: null,
      });
      return;
    }
    for (const level of [...new Set(record.questions.map((q) => q.level))]) {
      const qs = record.questions.filter((q) => q.level === level);
      rows.push({
        ...base,
        level,
        items: qs.length,
        first: qs.filter((q) => q.attempts[0] === q.answer).length,
        independent: qs.filter((q) => q.attempts[0] === q.answer && !q.hint)
          .length,
        kind:
          record.trail === "razonar"
            ? "Respuesta a ejercicio"
            : "Respuesta aritmética",
        activeMs: qs.reduce((n, q) => n + q.activeMs, 0),
      });
    }
  };
  for (const s of teacher ? state.teacher || [] : state.sessions || [])
    add(
      s,
      s.profile,
      s.race
        ? "Individual · rivales digitales"
        : s.responseMode === "write"
          ? "Individual · escritura"
          : "Individual · opciones",
    );
  const projectReports = teacher
    ? state.teacherProjects || []
    : [{ profile: state.profile, projects: state.workshopHistory || [] }];
  for (const r of projectReports)
    for (const p of r.projects) add(p, r.profile, "Individual · construcción");
  for (const r of teacher
    ? state.teacherMultiplayer || []
    : state.multiplayerHistory || [])
    add(
      r,
      r.profile,
      r.mode === "coop"
        ? "Multijugador · cooperación"
        : "Multijugador · competición",
      r.transport,
    );
  return rows;
}
export function filterCohorts(rows, filters = {}) {
  return rows.filter((r) =>
    ["school", "grade", "group", "context", "profile", "listNumber"].every(
      (k) => !filters[k] || schoolKey(r[k]) === schoolKey(filters[k]),
    ),
  );
}
export function summarizeCohorts(rows) {
  const groups = new Map();
  for (const r of rows) {
    const key = JSON.stringify(
      [
        "school",
        "grade",
        "group",
        "trail",
        "context",
        "transport",
        "kind",
        "level",
      ].map((k) => schoolKey(r[k])),
    );
    if (!groups.has(key))
      groups.set(key, {
        ...r,
        profiles: new Set(),
        activities: new Set(),
        byStudent: new Map(),
        items: 0,
        first: 0,
        independent: 0,
      });
    const g = groups.get(key);
    g.profiles.add(r.profile);
    g.activities.add(r.profile + ":" + r.id);
    g.items += r.items;
    g.first += r.first;
    g.independent += r.independent;
    const s = g.byStudent.get(r.profile) || { first: 0, items: 0 };
    s.first += r.first;
    s.items += r.items;
    g.byStudent.set(r.profile, s);
  }
  return [...groups.values()].map((g) => ({
    ...g,
    students: g.profiles.size,
    activities: g.activities.size,
    percent: g.items ? (100 * g.first) / g.items : null,
    studentMean:
      [...g.byStudent.values()].reduce(
        (n, s) => n + (100 * s.first) / s.items,
        0,
      ) / g.profiles.size,
  }));
}
export function cohortCSV(rows, aggregate = false) {
  const headings = [
    "escuela",
    "grado",
    "grupo",
    ...(aggregate
      ? ["estudiantes", "actividades"]
      : ["numero_lista", "perfil", "actividad", "fecha_dispositivo"]),
    "contenido",
    "nivel_cantidades",
    "contexto",
    "dispositivos",
    "tipo_evidencia",
    "ejercicios",
    "primer_acierto",
    "sin_ayuda",
    ...(aggregate ? ["porcentaje_por_ejercicio", "media_por_estudiante"] : []),
  ];
  const data = aggregate ? summarizeCohorts(rows) : rows;
  return (
    "\uFEFF" +
    [
      headings,
      ...data.map((r) => [
        r.school,
        r.grade,
        r.group,
        ...(aggregate
          ? [r.students, r.activities]
          : [r.listNumber, r.profile, r.id, r.at]),
        r.trail,
        r.level,
        r.context,
        r.transport,
        r.kind,
        r.items,
        r.first,
        r.independent,
        ...(aggregate
          ? [r.percent?.toFixed(2), r.studentMean?.toFixed(2)]
          : []),
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
export function cohortPanel(state, teacher = false) {
  const rows = cohortRows(state, teacher);
  const select = (key, label) =>
    `<label>${label}<select name="${key}"><option value="">Todos</option>${[
      ...new Set(rows.map((r) => r[key]).filter(Boolean)),
    ]
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((v) => `<option value="${esc(v)}">${esc(v)}</option>`)
      .join("")}</select></label>`;
  return `<section class="panel cohort-panel"><h2>${teacher ? "Análisis del aula por escuela y grupo" : "Mis actividades y participaciones compartidas"}</h2><p>La práctica individual, la competición entre personas y la cooperación se analizan por separado. El grado escolar no equivale al nivel de cantidades del juego.</p><form id="cohort-filters" class="room-fields">${select("school", "Escuela")}${select("grade", "Grado escolar")}${select("group", "Grupo")}${select("context", "Contexto")}<label>Número de lista<input name="listNumber" type="number" min="1" max="999" placeholder="Todos"></label><button class="secondary">Aplicar filtros</button><button class="soft-button" type="reset">Limpiar filtros</button></form><div id="cohort-results" aria-live="polite"></div><div class="button-row"><button id="cohort-csv" class="secondary">Exportar actividades filtradas CSV</button><button id="cohort-summary-csv" class="secondary">Exportar resumen filtrado CSV</button></div><details><summary>Interpretación y datos faltantes</summary><p>Solo se cuentan actividades completas y recibidas. N es el número de perfiles distintos, no identidades verificadas. Un alumno con varios perfiles puede contarse varias veces; un número de lista repetido no se fusiona automáticamente. Los registros sin adscripción conservan «Sin registrar». Cambiar un grupo afecta actividades nuevas, no el pasado.</p><p>El porcentaje por ejercicio pondera más a quien practica más. La media por estudiante da igual peso a cada perfil dentro de la misma fila. No sumes las filas de distintos niveles para contar personas. Una muestra pequeña, contenidos distintos o ayuda entre compañeros impiden interpretar estos datos como una calificación o un efecto causal de aprendizaje.</p><p>Los archivos CSV incluyen escuela, grupo y número de lista y no están cifrados. Entrégalos únicamente a personas autorizadas. Las participaciones multijugador son declaraciones del navegador, no resultados certificados por un servidor de partidas.</p></details><p><a href="./juntos.html">Jugar con otras personas</a></p></section>`;
}
export function bindCohorts(root, state, teacher, download) {
  const form = root.querySelector("#cohort-filters");
  if (!form) return;
  const all = cohortRows(state, teacher);
  let filtered = all;
  function paint() {
    const groups = summarizeCohorts(filtered),
      missing = filtered.filter(
        (r) => !r.school || !r.grade || !r.group || r.listNumber === null,
      ).length;
    root.querySelector("#cohort-results").innerHTML =
      `<p>Perfiles: ${new Set(filtered.map((r) => r.profile)).size} · Actividades: ${new Set(filtered.map((r) => r.profile + ":" + r.id)).size} · ${missing} registros por nivel con adscripción incompleta.</p>${groups.length ? `<div class="table-wrap"><table><caption>Resultados separados por contenido, nivel y contexto</caption><thead><tr><th>Escuela · grado · grupo</th><th>Contenido y contexto</th><th>Nivel</th><th>N perfiles</th><th>Actividades</th><th>Primer acierto</th><th>Sin ayuda</th><th>Media por estudiante</th></tr></thead><tbody>${groups.map((g) => `<tr><td>${[g.school, g.grade, g.group].map((x) => esc(x || "Sin registrar")).join(" · ")}</td><td>${esc(TRAILS[g.trail]?.short || g.trail)} · ${esc(g.context)}${g.transport === "individual" ? "" : g.transport === "local" ? " · misma pantalla" : " · por enlace"}<br><small>${esc(g.kind)}</small></td><td>${g.level}</td><td>${g.students}</td><td>${g.activities}</td><td>${g.first}/${g.items} (${g.percent.toFixed(1)}%)</td><td>${g.independent}/${g.items}</td><td>${g.studentMean.toFixed(1)}%</td></tr>`).join("")}</tbody></table></div>` : "<p>No hay actividades completas que coincidan con los filtros.</p>"}`;
    root.querySelector("#cohort-csv").disabled = !filtered.length;
    root.querySelector("#cohort-summary-csv").disabled = !filtered.length;
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    filtered = filterCohorts(all, Object.fromEntries(new FormData(form)));
    paint();
  });
  form.addEventListener("reset", () => {
    filtered = all;
    paint();
  });
  root
    .querySelector("#cohort-csv")
    .addEventListener("click", () =>
      download(
        "sendero-actividades-escolares.csv",
        cohortCSV(filtered),
        "text/csv;charset=utf-8",
      ),
    );
  root
    .querySelector("#cohort-summary-csv")
    .addEventListener("click", () =>
      download(
        "sendero-resumen-escolar.csv",
        cohortCSV(filtered, true),
        "text/csv;charset=utf-8",
      ),
    );
  paint();
}
