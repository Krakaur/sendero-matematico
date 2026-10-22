import {normalizeEnrollment} from './enrollment.js';
import {
  PROJECTS,
  PROJECT_ORDER,
  newWorkshop,
  currentMission,
  applyWorkshopAction,
  workshopSummary,
  mission,
} from "./workshop.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const button = (text, attributes = "", className = "soft-button") =>
  `<button class="${className}" ${attributes}>${text}</button>`;
const dots = (n) =>
  Array.from({ length: n }, () => '<i aria-hidden="true"></i>').join("");
function stepper(key, value, label) {
  return `<div class="project-stepper"><span>${label}</span><div>${button("−", `data-project-change="${key}" data-delta="-1" aria-label="Quitar uno: ${label}"`)}<output aria-label="${label}">${value}</output>${button("+", `data-project-change="${key}" data-delta="1" aria-label="Añadir uno: ${label}"`)}</div>${key === "value" ? `<div>${button("−5", `data-project-change="${key}" data-delta="-5" aria-label="Quitar cinco: ${label}"`)}${button("+5", `data-project-change="${key}" data-delta="5" aria-label="Añadir cinco: ${label}"`)}</div>` : ""}</div>`;
}
export function modelHTML(m, x) {
  if (m.kind === "balance")
    return `<div class="project-balance"><div><span>Capacidad</span><strong>${m.total}</strong><div class="project-pebbles">${dots(m.total)}</div></div><b aria-hidden="true">⚖</b><div><span>Ya había ${m.a}; añadiste ${x.value}</span><strong>${m.a + x.value}</strong><div class="project-pebbles">${dots(m.a + x.value)}</div></div></div>${stepper("value", x.value, "Piedras que añades")}`;
  if (m.kind === "sharing")
    return `<p class="project-stock">Frutos por repartir: <strong>${m.total - x.baskets.reduce((a, b) => a + b, 0)}</strong></p><div class="project-baskets">${x.baskets.map((n, i) => `<section><h3>Cesta ${i + 1}</h3><div class="project-fruits" role="img" aria-label="${n} frutos">${dots(n)}</div><strong>${n}</strong><div>${button("−", `data-project-basket="${i}" data-delta="-1" aria-label="Retirar un fruto de cesta ${i + 1}"`)}${button("+", `data-project-basket="${i}" data-delta="1" aria-label="Añadir un fruto a cesta ${i + 1}"`)}</div></section>`).join("")}</div>`;
  if (m.kind === "array" || m.kind === "measure")
    return `<div class="project-garden ${m.kind === "measure" ? "with-fence" : ""}" style="--cols:${x.columns}" role="img" aria-label="${x.rows} filas y ${x.columns} columnas: ${x.rows * x.columns} cuadros de superficie">${Array.from({ length: x.rows * x.columns }, () => `<i aria-hidden="true">${m.kind === "array" ? "✿" : ""}</i>`).join("")}</div><p class="project-model-caption">${x.rows} filas × ${x.columns} columnas · ${x.rows * x.columns} ${m.kind === "array" ? "plantas" : "cuadros de superficie"}</p><div class="project-steppers">${stepper("rows", x.rows, "Filas")}${stepper("columns", x.columns, "Columnas")}</div>${m.kind === "measure" ? stepper("value", x.value, "Tramos de cerca") : ""}`;
  if (m.kind === "fraction")
    return `<div class="project-bread" style="--bread-cols:${m.parts === 6 ? 3 : Math.min(4, m.parts)}" role="group" aria-label="Un pan con ${m.parts} partes iguales">${Array.from({ length: m.parts }, (_, i) => button(`<span aria-hidden="true">${x.selected.includes(i) ? "✓" : "▧"}</span><small>Parte ${i + 1}</small>`, `data-project-select="${i}" aria-pressed="${x.selected.includes(i)}"`, "bread-piece")).join("")}</div><p class="project-model-caption">Seleccionaste ${x.selected.length} de ${m.parts} partes.</p>`;
  if (m.kind === "data")
    return `<div class="project-chart" role="group" aria-label="Cosecha: peras, manzanas y ciruelas">${m.values.map((n, i) => button(`<strong>${n}</strong><span class="project-bar" style="--height:${n * 8}px" aria-hidden="true"></span><span>${["Peras", "Manzanas", "Ciruelas"][i]}</span>`, `data-project-select="${i}" aria-pressed="${x.selected.includes(i)}"`, "chart-column")).join("")}</div>${stepper("value", x.value, "Diferencia entre las dos cantidades")}`;
  if (m.kind === "pattern")
    return `<div class="project-lights" aria-label="Serie y dos lugares por completar">${[...m.sequence, x.selected[0] ?? "?", x.selected[1] ?? "?"].map((n) => `<span>${n}</span>`).join("")}</div><p>Toca las fichas en orden. Vuelve a tocar una para retirarla.</p><div class="project-tiles">${m.tiles.map((n) => button(n, `data-project-select="${n}" aria-pressed="${x.selected.includes(n)}"`)).join("")}</div>`;
  const total = x.path.reduce((a, b) => a + (b ?? 0), 0);
  return `<div class="project-route">${m.paths.map((paths, i) => `<section><span>Etapa ${i + 1}</span>${paths.map((n) => button(`${n} pasos`, `data-project-path="${i}" data-value="${n}" aria-pressed="${x.path[i] === n}"`)).join("")}</section>`).join("")}</div><div class="project-distance"><span>Salida</span><meter min="0" max="${m.target + 10}" value="${total}" aria-label="Pasos seleccionados"></meter><strong>${total} / ${m.target} pasos</strong></div>`;
}
export function modelEvidenceText(m, x) {
  if (!x) return "Sin modelo registrado.";
  if (m.kind === "balance") return `${m.a} iniciales + ${x.value} añadidas = ${m.a + x.value}; objetivo: ${m.total}.`;
  if (m.kind === "sharing") return `${x.baskets.map((n, i) => `Cesta ${i + 1}: ${n}`).join("; ")}. Repartidos: ${x.baskets.reduce((a, b) => a + b, 0)} de ${m.total}.`;
  if (m.kind === "array" || m.kind === "measure") return `${x.rows} filas × ${x.columns} columnas = ${x.rows * x.columns} ${m.kind === "array" ? "plantas" : "cuadros de superficie"}.${m.kind === "measure" ? ` Cerca propuesta: ${x.value} tramos.` : ""}`;
  if (m.kind === "fraction") return `${x.selected.length} de ${m.parts} partes; partes elegidas: ${x.selected.length ? x.selected.map(n => n + 1).join(", ") : "ninguna"}.`;
  if (m.kind === "data") return `Cosecha: ${m.values.map((n, i) => `${["Peras", "Manzanas", "Ciruelas"][i]} ${n}`).join(", ")}. Categorías elegidas: ${x.selected.length ? x.selected.map(i => ["Peras", "Manzanas", "Ciruelas"][i]).join(" y ") : "ninguna"}; diferencia propuesta: ${x.value}.`;
  if (m.kind === "pattern") return `Serie inicial: ${m.sequence.join(", ")}. Continuación elegida en orden: ${x.selected.length ? x.selected.join(", ") : "sin elegir"}.`;
  return `${x.path.map((n, i) => `Etapa ${i + 1}: ${n === null ? "sin elegir" : n}`).join("; ")}. Total elegido: ${x.path.reduce((a, b) => a + (b ?? 0), 0)}; objetivo: ${m.target}.`;
}
function checksEvidenceHTML(m, checks) {
  if (!checks.length) return "<p>Sin comprobación registrada en esta fase; no permite concluir que no hubo trabajo.</p>";
  return `<ol class="project-checks">${checks.map((check, i) => `<li><strong>Comprobación ${i + 1}: ${check.correct ? "cumple la condición" : "aún no cumple la condición"}.</strong> ${esc(modelEvidenceText(m, check.model))}</li>`).join("")}</ol>`;
}
function projectEvidenceHTML(s, r, i) {
  const original = mission(r.kind, s.level, r.seed);
  const probe = r.verification ? mission(r.kind, s.level, r.verification.seed) : null;
  return `<details class="project-record"><summary>Reto ${i + 1} · ${esc(PROJECTS[r.kind].short)} · ${r.phase === "done" ? "resuelto" : "en proceso"}</summary><p><strong>Consigna inicial:</strong> ${esc(original.prompt)}</p><p>Pista registrada en el proyecto: ${r.hint ? "sí" : "no"}. Este formato no separa todas las solicitudes de ayuda por fase.</p><h4>Construcción inicial</h4>${checksEvidenceHTML(original, r.checks)}<h4>Explicaciones elegidas</h4>${r.reasonAttempts.length ? `<ol>${r.reasonAttempts.map(n => `<li>${esc(original.reasons[n])} <span class="project-evidence-label">(${n === original.reason ? "corresponde al modelo" : "no corresponde al modelo"})</span></li>`).join("")}</ol>` : "<p>Sin elección registrada.</p>"}${probe ? `<section class="project-probe"><h4>Comprobación posterior con otro reto</h4><p>${esc(probe.prompt)}</p><p>${r.verification.hintAtStart === true ? "La pista ya estaba abierta al iniciar esta fase." : r.verification.hintAtStart === false ? "No constaba una pista abierta al iniciar esta fase; este registro no distingue una petición posterior." : "No consta si la pista estaba abierta al iniciar esta fase."} Esta comprobación no acredita por sí sola transferencia independiente.</p>${checksEvidenceHTML(probe, r.verification.checks)}</section>` : "<p>No se registró una comprobación posterior.</p>"}<p><strong>Nota propia opcional:</strong> ${r.explanation ? esc(r.explanation) : "sin nota registrada; no afecta al resultado."}</p><p class="micro">Las explicaciones elegidas son opciones del sistema. La nota propia no recibe calificación automática.</p></details>`;
}
export function workshopProgressHTML(history = []) {
  if (!history.length) return "";
  const last = history.slice(-6).reverse();
  return `<section class="panel project-history"><h2>Proyectos de razonamiento</h2><p>Construcción, explicación elegida y comprobación se muestran por separado. La nota propia no recibe una calificación automática.</p>${history.length > 6 ? `<p class="micro">Esta vista muestra las últimas 6 de ${history.length} sesiones disponibles en esta vista; este límite de presentación no elimina los registros anteriores.</p>` : ""}${last
    .map((s) => {
      const v = workshopSummary(s);
      return `<article><strong>${esc(s.focus === "all" ? "Expedición de ocho proyectos" : PROJECTS[s.focus].name)} · Nivel ${s.level}</strong><p class="micro">Sesión: ${esc(s.id)} · Inicio: ${esc(s.startedAt)} · Cierre: ${esc(s.completedAt||"pendiente")}</p><p>${v.completed}/${s.records.length} retos resueltos · ${v.independent} con modelo y explicación elegida correctos al primer intento sin pista registrada · ${v.verified} comprobaciones posteriores resueltas.</p><details><summary>Ver construcciones y elecciones por reto</summary>${s.records.map((r, i) => projectEvidenceHTML(s, r, i)).join("")}</details></article>`;
    })
    .join(
      "",
    )}<p class="micro">Describe estas tareas; no acredita dominio general ni explicación oral.</p></section>`;
}
export function workshopHTML(state) {
  const s = state.workshop;
  if (!s)
    return `<section class="project-hub"><header class="project-hero"><span class="eyebrow">EL TALLER DE LAS IDEAS</span><h1>Construye. Comprueba.<br>Explica tu descubrimiento.</h1><p>Ocho proyectos para pensar con las manos. Puedes cambiar el modelo, ensayar una estrategia y revisar lo que sucede. Cada proyecto individual abre ocho retos de esa familia. Sin reloj ni rivales.</p></header><div class="project-start panel"><label>Nivel de cantidades<select id="project-level">${[1, 2, 3, 4].map((l) => `<option value="${l}" ${l === (state.workshopLevel || 1) ? "selected" : ""}>Nivel ${l}</option>`).join("")}</select></label>${button("Comenzar los ocho proyectos", 'data-project-new="all"', "primary")}<p>Los niveles cambian las cantidades. No equivalen a grados escolares.</p></div><div class="project-catalog">${PROJECT_ORDER.map((k) => `<article><span class="project-icon" aria-hidden="true">${PROJECTS[k].icon}</span><h2>${PROJECTS[k].name}</h2><p>${PROJECTS[k].skill}.</p>${button("Comenzar ocho retos", `data-project-new="${k}"`)}</article>`).join("")}</div><section class="panel"><h2>Situaciones para leer y pensar</h2><p>También conservas el banco de 6.630 problemas y variantes. Puedes retomarlo con sus pistas y registro anterior.</p>${button("Abrir el banco de situaciones", 'id="reasoning-bank"', "secondary")}</section>${workshopProgressHTML(state.workshopHistory)}<a class="secondary" href="#explorar">Volver a los caminos</a></section>`;
  if (s.completedAt) {
    const v = workshopSummary(s);
    return `<section class="project-finish"><span class="project-icon" aria-hidden="true">✿</span><span class="eyebrow">PROYECTO COMPLETADO</span><h1>¡El bosque tiene nuevas ideas!</h1><p>Construiste modelos y elegiste explicaciones en ocho retos.</p><div class="project-evidence"><div><strong>${v.independent}/8</strong><span>Modelo y explicación elegida correctos al primer intento sin pista registrada</span></div><div><strong>${v.verified}</strong><span>Comprobaciones con un reto diferente</span></div></div>${workshopProgressHTML([s])}<div class="button-row">${button("Elegir otro proyecto", "data-project-hub", "primary")}<a class="secondary" href="#progreso">Ver mi progreso</a>${button("Descargar evidencias", "data-project-export")}</div></section>`;
  }
  const r = s.records[s.index],
    m = currentMission(s),
    info = PROJECTS[r.kind],
    original = mission(r.kind, s.level, r.seed),
    checks = r.phase === "verify" ? r.verification.checks : r.checks;
  const last = checks.at(-1),
    locked = ["explain", "done"].includes(r.phase);
  return `<section class="project-game"><header class="project-top"><div><span class="eyebrow">PROYECTO ${s.index + 1} DE 8 · NIVEL ${s.level}</span><h1>${info.name}</h1></div><a class="soft-button" href="#explorar">Pausar y guardar</a></header><ol class="project-map" aria-label="Progreso de los ocho proyectos">${s.records.map((p, i) => `<li ${i === s.index ? 'aria-current="step"' : ""} class="${p.phase === "done" ? "complete" : ""}"><span aria-hidden="true">${PROJECTS[p.kind].icon}</span><span class="sr-only">${PROJECTS[p.kind].short}: ${p.phase === "done" ? "completado" : i === s.index ? "actual" : "pendiente"}</span></li>`).join("")}</ol><div class="project-task"><span class="project-phase">${r.phase === "verify" ? "Ahora, otro reto sin ver la solución anterior" : r.phase === "explain" ? "Elige la explicación de la relación matemática" : r.phase === "done" ? "Modelo construido y explicación elegida" : "Construye tu solución"}</span><h2 tabindex="-1" id="project-prompt">${esc(m.prompt)}</h2><div class="project-model ${locked ? "model-locked" : ""}"><fieldset ${locked ? "disabled" : ""}><legend class="sr-only">Modelo matemático</legend>${modelHTML(m, r.model)}</fieldset></div>${["build", "verify"].includes(r.phase) ? `<div class="project-controls">${button("Comprobar mi modelo", "data-project-check", "primary")}${button("Reiniciar el modelo", "data-project-reset")}${button("Una pista", "data-project-hint")}</div><p class="project-feedback" role="status">${last && !last.correct ? "Todavía no cumple todas las condiciones. Revisa el modelo y prueba otra estrategia." : "Puedes probar cambios. Se registran al pulsar «Comprobar mi modelo»."}</p>${r.hint ? `<aside class="hint-box"><p>${esc(m.hint)}</p></aside>` : ""}` : ""}${r.phase === "explain" ? `<section class="project-explain"><h3>¿Por qué funciona tu construcción?</h3><div>${original.reasons.map((text, i) => button(esc(text), `data-project-reason="${i}" ${r.reasonAttempts.includes(i) ? "disabled" : ""}`)).join("")}</div><p role="status">${r.reasonAttempts.length ? "Esa explicación no describe la relación del modelo. Mira sus cantidades y vuelve a elegir." : "Elige una explicación que corresponda a lo que construiste."}</p></section>` : ""}${r.phase === "done" ? `<section class="project-discovery" role="status"><h3>La idea que encontraste</h3><p>${esc(m.reasons[m.reason])}</p>${r.verification ? "<p>También resolviste una nueva construcción después de la revisión.</p>" : ""}<label for="project-note">Cuéntalo con tus palabras o explícalo a otra persona (opcional)</label><textarea id="project-note" maxlength="600" rows="3" placeholder="Lo resolví así…">${esc(r.explanation)}</textarea>${button(s.index === 7 ? "Guardar mis descubrimientos" : "Ir al siguiente proyecto", "data-project-next", "primary")}</section>` : ""}</div><p class="micro">Tu ritmo no se puntúa. Una explicación elegida es evidencia de esta tarea; no sustituye conversar sobre cómo la pensaste.</p></section>`;
}
export function bindWorkshop(root, state, { save, render, bank, download }) {
  root.querySelector("#project-level")?.addEventListener("change", (e) => {
    state.workshopLevel = Number(e.target.value);
    save();
  });
  root.querySelector("#reasoning-bank")?.addEventListener("click", bank);
  root.querySelector("#project-note")?.addEventListener("input", (e) => {
    applyWorkshopAction(state.workshop, {
      type: "note",
      value: e.target.value,
    });
    save();
  });
  root.querySelectorAll("[data-project-new]").forEach((b) =>
    b.addEventListener("click", () => {
      state.workshop = newWorkshop(
        state.workshopLevel || 1,
        crypto.getRandomValues(new Uint32Array(1))[0],
        b.dataset.projectNew,
      );
      state.workshop.enrollment=normalizeEnrollment(state.enrollment);
      save();
      render();
      window.scrollTo(0, 0);
    }),
  );
  root.querySelector("[data-project-hub]")?.addEventListener("click", () => {
    state.workshop = null;
    save();
    render();
    window.scrollTo(0, 0);
  });
  root
    .querySelector("[data-project-export]")
    ?.addEventListener("click", () =>
      download(
        "sendero-proyectos.json",
        JSON.stringify(
          {
            schema: "sendero.workshop-report.v1",
            profile: state.profile,
            projects: state.workshopHistory || [],
          },
          null,
          2,
        ),
        "application/json",
      ),
    );
  for (const b of root.querySelectorAll(
    "[data-project-change],[data-project-basket],[data-project-select],[data-project-path],[data-project-check],[data-project-reset],[data-project-hint],[data-project-reason],[data-project-next]",
  ))
    b.addEventListener("click", () => {
      const action = workshopControlAction(b.dataset);
      const phase = state.workshop.records[state.workshop.index].phase,
        oldIndex = state.workshop.index;
      if (!applyWorkshopAction(state.workshop, action)) return;
      if (state.workshop.completedAt) {
        state.workshopHistory ??= [];
        if (!state.workshopHistory.some((s) => s.id === state.workshop.id))
          state.workshopHistory.push(structuredClone(state.workshop));
      }
      save();
      const focus = workshopControlIdentity(b.dataset);
      render();
      if (
        state.workshop.index !== oldIndex ||
        state.workshop.records[state.workshop.index].phase !== phase
      ) {
        root.querySelector("#project-prompt")?.focus({ preventScroll: true });
        if (action.type === "next") window.scrollTo(0, 0);
      } else {
        const restored = [...root.querySelectorAll("button")]
          .find((el) => !el.disabled && workshopControlIdentity(el.dataset) === focus);
        (restored || root.querySelector("#project-prompt"))?.focus({ preventScroll: true });
      }
    });
}

export function workshopControlIdentity(d) {
  const action = workshopControlAction(d);
  return action ? JSON.stringify(action) : null;
}
export function workshopControlAction(d) {
  if (!Object.keys(d).some((k) => k.startsWith("project"))) return null;
  return d.projectChange !== undefined
    ? { type: "change", key: d.projectChange, delta: Number(d.delta) }
    : d.projectBasket !== undefined
      ? {
          type: "basket",
          index: Number(d.projectBasket),
          delta: Number(d.delta),
        }
      : d.projectSelect !== undefined
        ? { type: "select", value: Number(d.projectSelect) }
        : d.projectPath !== undefined
          ? {
              type: "path",
              index: Number(d.projectPath),
              value: Number(d.value),
            }
          : d.projectReason !== undefined
            ? { type: "reason", value: Number(d.projectReason) }
            : {
                type:
                  d.projectCheck !== undefined
                    ? "check"
                    : d.projectReset !== undefined
                      ? "reset"
                      : d.projectHint !== undefined
                        ? "hint"
                        : "next",
              };
}
