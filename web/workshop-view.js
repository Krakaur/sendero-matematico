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
    return `<div class="project-bread" role="group" aria-label="Un pan con ${m.parts} partes iguales">${Array.from({ length: m.parts }, (_, i) => button(`<span aria-hidden="true">▧</span><small>Parte ${i + 1}</small>`, `data-project-select="${i}" aria-pressed="${x.selected.includes(i)}"`, "bread-piece")).join("")}</div><p class="project-model-caption">Seleccionaste ${x.selected.length} de ${m.parts} partes.</p>`;
  if (m.kind === "data")
    return `<div class="project-chart" role="group" aria-label="Cosecha: peras, manzanas y ciruelas">${m.values.map((n, i) => button(`<strong>${n}</strong><span class="project-bar" style="--height:${n * 8}px" aria-hidden="true"></span><span>${["Peras", "Manzanas", "Ciruelas"][i]}</span>`, `data-project-select="${i}" aria-pressed="${x.selected.includes(i)}"`, "chart-column")).join("")}</div>${stepper("value", x.value, "Diferencia entre las dos cantidades")}`;
  if (m.kind === "pattern")
    return `<div class="project-lights" aria-label="Serie y dos lugares por completar">${[...m.sequence, x.selected[0] ?? "?", x.selected[1] ?? "?"].map((n) => `<span>${n}</span>`).join("")}</div><p>Toca las fichas en orden. Vuelve a tocar una para retirarla.</p><div class="project-tiles">${m.tiles.map((n) => button(n, `data-project-select="${n}" aria-pressed="${x.selected.includes(n)}"`)).join("")}</div>`;
  const total = x.path.reduce((a, b) => a + (b ?? 0), 0);
  return `<div class="project-route">${m.paths.map((paths, i) => `<section><span>Etapa ${i + 1}</span>${paths.map((n) => button(`${n} pasos`, `data-project-path="${i}" data-value="${n}" aria-pressed="${x.path[i] === n}"`)).join("")}</section>`).join("")}</div><div class="project-distance"><span>Salida</span><meter min="0" max="${m.target + 10}" value="${total}" aria-label="Pasos seleccionados"></meter><strong>${total} / ${m.target} pasos</strong></div>`;
}
export function workshopProgressHTML(history = []) {
  if (!history.length) return "";
  const last = history.slice(-6).reverse();
  return `<section class="panel project-history"><h2>Proyectos de razonamiento</h2><p>Construcción, explicación elegida y comprobación se registran por separado. La nota escrita no recibe una calificación automática.</p>${last
    .map((s) => {
      const v = workshopSummary(s);
      return `<article><strong>${s.focus === "all" ? "Expedición de ocho proyectos" : PROJECTS[s.focus].name} · Nivel ${s.level}</strong><p>${v.completed}/8 resueltos · ${v.independent} con modelo y justificación iniciales sin ayuda · ${v.verified} comprobaciones posteriores.</p><details><summary>Ver evidencias por proyecto</summary>${s.records.map((r) => `<p><strong>${PROJECTS[r.kind].short}:</strong> ${r.checks.length} comprobaciones del modelo; ${r.reasonAttempts.length} elecciones de explicación.${r.verification ? " Comprobación nueva: " + (r.verification.checks.at(-1)?.correct ? "resuelta" : "pendiente") + "." : ""}${r.explanation ? `<br>Nota del estudiante: ${esc(r.explanation)}` : ""}</p>`).join("")}</details></article>`;
    })
    .join(
      "",
    )}<p class="micro">Describe estas tareas; no acredita dominio general ni explicación oral.</p></section>`;
}
export function workshopHTML(state) {
  const s = state.workshop;
  if (!s)
    return `<section class="project-hub"><header class="project-hero"><span class="eyebrow">EL TALLER DE LAS IDEAS</span><h1>Construye. Comprueba.<br>Explica tu descubrimiento.</h1><p>Ocho proyectos para pensar con las manos. Puedes cambiar el modelo, ensayar una estrategia y revisar lo que sucede. Sin reloj ni rivales.</p></header><div class="project-start panel"><label>Nivel de cantidades<select id="project-level">${[1, 2, 3, 4].map((l) => `<option value="${l}" ${l === (state.workshopLevel || 1) ? "selected" : ""}>Nivel ${l}</option>`).join("")}</select></label>${button("Comenzar los ocho proyectos", 'data-project-new="all"', "primary")}<p>Los niveles cambian las cantidades. No equivalen a grados escolares.</p></div><div class="project-catalog">${PROJECT_ORDER.map((k) => `<article><span class="project-icon" aria-hidden="true">${PROJECTS[k].icon}</span><h2>${PROJECTS[k].name}</h2><p>${PROJECTS[k].skill}.</p>${button("Explorar este proyecto", `data-project-new="${k}"`)}</article>`).join("")}</div><section class="panel"><h2>Situaciones para leer y pensar</h2><p>También conservas el banco de 6.630 problemas y variantes. Puedes retomarlo con sus pistas y registro anterior.</p>${button("Abrir el banco de situaciones", 'id="reasoning-bank"', "secondary")}</section>${workshopProgressHTML(state.workshopHistory)}<a class="secondary" href="#explorar">Volver a los caminos</a></section>`;
  if (s.completedAt) {
    const v = workshopSummary(s);
    return `<section class="project-finish"><span class="project-icon" aria-hidden="true">✿</span><span class="eyebrow">PROYECTO COMPLETADO</span><h1>¡El bosque tiene nuevas ideas!</h1><p>Construiste y justificaste ocho soluciones.</p><div class="project-evidence"><div><strong>${v.independent}/8</strong><span>Modelo y justificación iniciales sin ayuda</span></div><div><strong>${v.verified}</strong><span>Comprobaciones con un reto diferente</span></div></div>${workshopProgressHTML([s])}<div class="button-row">${button("Elegir otro proyecto", "data-project-hub", "primary")}<a class="secondary" href="#progreso">Ver mi progreso</a>${button("Descargar evidencias", "data-project-export")}</div></section>`;
  }
  const r = s.records[s.index],
    m = currentMission(s),
    info = PROJECTS[r.kind],
    original = mission(r.kind, s.level, r.seed),
    checks = r.phase === "verify" ? r.verification.checks : r.checks;
  const last = checks.at(-1),
    locked = ["explain", "done"].includes(r.phase);
  return `<section class="project-game"><header class="project-top"><div><span class="eyebrow">PROYECTO ${s.index + 1} DE 8 · NIVEL ${s.level}</span><h1>${info.name}</h1></div><a class="soft-button" href="#explorar">Pausar y guardar</a></header><ol class="project-map" aria-label="Progreso de los ocho proyectos">${s.records.map((p, i) => `<li ${i === s.index ? 'aria-current="step"' : ""} class="${p.phase === "done" ? "complete" : ""}"><span aria-hidden="true">${PROJECTS[p.kind].icon}</span><span class="sr-only">${PROJECTS[p.kind].short}: ${p.phase === "done" ? "completado" : i === s.index ? "actual" : "pendiente"}</span></li>`).join("")}</ol><div class="project-task"><span class="project-phase">${r.phase === "verify" ? "Ahora, otro reto sin ver la solución anterior" : r.phase === "explain" ? "Explica la relación matemática" : r.phase === "done" ? "Solución construida y explicada" : "Construye tu solución"}</span><h2 tabindex="-1" id="project-prompt">${esc(m.prompt)}</h2><div class="project-model ${locked ? "model-locked" : ""}"><fieldset ${locked ? "disabled" : ""}><legend class="sr-only">Modelo matemático</legend>${modelHTML(m, r.model)}</fieldset></div>${["build", "verify"].includes(r.phase) ? `<div class="project-controls">${button("Comprobar mi modelo", "data-project-check", "primary")}${button("Reiniciar el modelo", "data-project-reset")}${button("Una pista", "data-project-hint")}</div><p class="project-feedback" role="status">${last && !last.correct ? "Todavía no cumple todas las condiciones. Revisa el modelo y prueba otra estrategia." : "Puedes probar cambios. Se registran al pulsar «Comprobar mi modelo»."}</p>${r.hint ? `<aside class="hint-box"><p>${esc(m.hint)}</p></aside>` : ""}` : ""}${r.phase === "explain" ? `<section class="project-explain"><h3>¿Por qué funciona tu construcción?</h3><div>${original.reasons.map((text, i) => button(esc(text), `data-project-reason="${i}" ${r.reasonAttempts.includes(i) ? "disabled" : ""}`)).join("")}</div><p role="status">${r.reasonAttempts.length ? "Esa explicación no describe la relación del modelo. Mira sus cantidades y vuelve a elegir." : "Elige una explicación que corresponda a lo que construiste."}</p></section>` : ""}${r.phase === "done" ? `<section class="project-discovery" role="status"><h3>La idea que encontraste</h3><p>${esc(m.reasons[m.reason])}</p>${r.verification ? "<p>También resolviste una nueva construcción después de la revisión.</p>" : ""}<label for="project-note">Cuéntalo con tus palabras o explícalo a otra persona (opcional)</label><textarea id="project-note" maxlength="600" rows="3" placeholder="Lo resolví así…">${esc(r.explanation)}</textarea>${button(s.index === 7 ? "Guardar mis descubrimientos" : "Ir al siguiente proyecto", "data-project-next", "primary")}</section>` : ""}</div><p class="micro">Tu ritmo no se puntúa. Una explicación elegida es evidencia de esta tarea; no sustituye conversar sobre cómo la pensaste.</p></section>`;
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
      const focus = b.outerHTML;
      render();
      if (
        state.workshop.index !== oldIndex ||
        state.workshop.records[state.workshop.index].phase !== phase
      ) {
        root.querySelector("#project-prompt")?.focus({ preventScroll: true });
        if (action.type === "next") window.scrollTo(0, 0);
      } else
        [...root.querySelectorAll("button")]
          .find((el) => el.outerHTML === focus)
          ?.focus({ preventScroll: true });
    });
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
