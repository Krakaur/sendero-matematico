import {validEnrollment} from './enrollment.js';
// Mathematical projects: construction, justification and a fresh check after support.
// No speed score. The evidence belongs to this activity, not general mathematical ability.
export const WORKSHOP_VERSION = 1;
export function mergeWorkshopReports(existing = [], incoming = []) {
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
  const groups = new Map();
  let count = 0;
  if (!Array.isArray(existing) || !Array.isArray(incoming))
    throw Error("Informes de proyectos no válidos.");
  for (const group of [...existing, ...incoming]) {
    if (
      typeof group.profile !== "string" ||
      !/^[a-zA-Z0-9-]{1,60}$/.test(group.profile) ||
      !Array.isArray(group.projects) ||
      group.projects.some((s) => !s.completedAt || !validWorkshop(s))
    )
      throw Error("Informe de proyectos no válido.");
    if (!groups.has(group.profile)) groups.set(group.profile, new Map());
    const records = groups.get(group.profile);
    for (const p of group.projects) {
      const old = records.get(p.id);
      if (
        old &&
        JSON.stringify(canonical(old)) !== JSON.stringify(canonical(p))
      )
        throw Error(
          "Un proyecto recibido tiene cambios incompatibles. Se conserva el registro anterior.",
        );
      if (!old) {
        if (++count > 5000)
          throw Error("Demasiados proyectos para este perfil docente.");
        records.set(p.id, structuredClone(p));
      }
    }
  }
  return [...groups].map(([profile, records]) => ({
    profile,
    projects: [...records.values()],
  }));
}
export const PROJECTS = {
  balance: {
    name: "El puente en equilibrio",
    short: "Equilibrio",
    icon: "⚖",
    skill: "Encontrar una cantidad desconocida",
  },
  sharing: {
    name: "La cosecha compartida",
    short: "Reparto",
    icon: "◉",
    skill: "Conservar el total y repartir por igual",
  },
  array: {
    name: "El vivero de Luma",
    short: "Grupos",
    icon: "✿",
    skill: "Construir filas y columnas",
  },
  fraction: {
    name: "El picnic de las partes",
    short: "Fracciones",
    icon: "◒",
    skill: "Representar partes iguales de un entero",
  },
  measure: {
    name: "El jardín y su cerca",
    short: "Medición",
    icon: "▧",
    skill: "Distinguir superficie y contorno",
  },
  data: {
    name: "El observatorio del bosque",
    short: "Datos",
    icon: "▥",
    skill: "Seleccionar datos y comparar cantidades",
  },
  pattern: {
    name: "Las luces del sendero",
    short: "Patrones",
    icon: "✦",
    skill: "Identificar y continuar una regularidad",
  },
  route: {
    name: "La expedición del río",
    short: "Planificación",
    icon: "⌁",
    skill: "Combinar decisiones bajo una condición",
  },
};
export const PROJECT_ORDER = Object.keys(PROJECTS);
export function randomSource(seed) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
const clone = (x) => structuredClone(x);
function shuffled(a, rng) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function mission(kind, level, seed) {
  if (
    !Object.hasOwn(PROJECTS, kind) ||
    !Number.isInteger(level) ||
    level < 1 ||
    level > 4 ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 4294967295
  )
    throw Error("Misión no válida.");
  const rng = randomSource(seed),
    int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  const a = int(2, 3 + level),
    b = int(2, 3 + level);
  const m = { kind, level, seed, a, b };
  let correct, others;
  if (kind === "balance") {
    m.total = a + b;
    m.prompt = `En el lado izquierdo hay ${m.total} piedras y en el derecho hay ${a}. Añade piedras a la derecha hasta que ambos lados tengan la misma cantidad.`;
    m.initial = { value: 0 };
    m.hint =
      "Añade piedras al lado incompleto. Compara el total de los dos lados.";
    correct = `Las ${a} piedras y las que añadí suman ${m.total}.`;
    others = [
      `Debo añadir otras ${m.total} piedras, sin contar las que había.`,
      `El lado con más piedras siempre está equilibrado.`,
    ];
  } else if (kind === "sharing") {
    m.a = Math.min(a, 4);
    m.total = m.a * b;
    m.prompt = `Reparte ${m.total} frutos entre ${m.a} cestas. Usa todos y deja la misma cantidad en cada cesta.`;
    m.initial = { baskets: Array(m.a).fill(0) };
    m.hint = "Entrega un fruto a cada cesta por turno. No debe sobrar ninguno.";
    correct = "Usé todos los frutos y las cestas contienen cantidades iguales.";
    others = [
      "Basta con que una cesta esté llena.",
      "Puedo dejar frutos sin repartir si las cestas parecen iguales.",
    ];
  } else if (kind === "array") {
    m.prompt = `Organiza el vivero en ${a} filas con ${b} plantas en cada fila.`;
    m.initial = { rows: 1, columns: 1 };
    m.hint =
      "Cada fila es horizontal. Cuenta las filas de arriba abajo y las plantas que hay en una sola fila.";
    correct = `Cada una de las ${a} filas aporta ${b} plantas: ${a} × ${b}.`;
    others = [
      `El total siempre es ${a} + ${b}.`,
      "Las filas y las plantas de cada fila son la misma medida.",
    ];
  } else if (kind === "fraction") {
    m.parts = [2, 4, 6, 8][Math.min(3, level - 1 + (seed % 2))];
    m.take = int(1, m.parts - 1);
    m.prompt = `Este pan está dividido en ${m.parts} partes iguales. Prepara ${m.take}/${m.parts} para el picnic.`;
    m.initial = { selected: [] };
    m.hint =
      "El número de abajo indica todas las partes iguales. El de arriba indica cuántas separar.";
    correct = `Seleccioné ${m.take} de las ${m.parts} partes iguales del mismo pan.`;
    others = [
      `Debo seleccionar ${m.parts} panes completos.`,
      "El tamaño de las partes puede ser diferente.",
    ];
  } else if (kind === "measure") {
    m.prompt = `El jardín mide ${a} cuadros de largo y ${b} de ancho. Construye el rectángulo y calcula cuántos tramos de cerca rodean su borde.`;
    m.initial = { rows: 1, columns: 1, value: 0 };
    m.hint =
      "La cerca recorre los cuatro lados. Los cuadros del interior miden otra cosa: la superficie.";
    correct = `El borde mide ${a} + ${b} + ${a} + ${b} tramos.`;
    others = [
      `Los tramos del borde son ${a} × ${b}.`,
      "Solo cuento un lado largo y uno corto.",
    ];
  } else if (kind === "data") {
    m.values = [a, a + b, int(1, 8)];
    m.prompt =
      "Observa la cosecha. Selecciona Manzanas y Peras; después representa cuántas manzanas más hay que peras.";
    m.initial = { selected: [], value: 0 };
    m.hint =
      "Usa las dos categorías que pide el problema. La diferencia es la parte que no tiene pareja.";
    correct = `Comparé ${a + b} manzanas con ${a} peras y busqué su diferencia.`;
    others = [
      "Sumé también las ciruelas aunque no se preguntan.",
      "Comparar siempre significa sumar las cantidades.",
    ];
  } else if (kind === "pattern") {
    m.step = int(1, level + 2);
    m.sequence = [a, a + m.step, a + 2 * m.step];
    m.tiles = shuffled(
      Array.from({ length: 6 }, (_, i) => a + (i + 1) * m.step),
      rng,
    );
    m.prompt = `Las luces siguen esta regla: ${m.sequence.join(", ")}. Coloca las dos cantidades siguientes en orden.`;
    m.initial = { selected: [] };
    m.hint =
      "Compara dos cantidades consecutivas. Prueba si el mismo cambio explica los dos pasos conocidos.";
    correct = `Cada paso añade ${m.step}; mantuve ese cambio en los dos lugares.`;
    others = [
      "Elegí las dos cantidades más grandes.",
      "El cambio entre pasos puede variar sin seguir ninguna regla.",
    ];
  } else {
    m.paths = [
      shuffled([a, a + 2], rng),
      shuffled([b, b + 3], rng),
      shuffled([2, 7], rng),
    ];
    m.target = a + b + 7;
    m.prompt = `Lleva suministros al refugio. Elige un tramo en cada etapa para recorrer exactamente ${m.target} pasos en total.`;
    m.initial = { path: [null, null, null] };
    m.hint =
      "Suma los tramos elegidos. Si te pasas, cambia uno y vuelve a comprobar el total.";
    correct = `Elegí tres tramos cuya suma es ${m.target}.`;
    others = [
      "Siempre debo elegir el tramo más largo.",
      "Solo importa la longitud del último tramo.",
    ];
  }
  m.reasons = shuffled([correct, ...others], rng);
  m.reason = m.reasons.indexOf(correct);
  return m;
}
export function modelCorrect(m, x) {
  if (!x || typeof x !== "object") return false;
  switch (m.kind) {
    case "balance":
      return x.value === m.b;
    case "sharing":
      return (
        Array.isArray(x.baskets) &&
        x.baskets.length === m.a &&
        x.baskets.every((n) => n === m.b)
      );
    case "array":
      return x.rows === m.a && x.columns === m.b;
    case "fraction":
      return (
        Array.isArray(x.selected) &&
        x.selected.length === m.take &&
        new Set(x.selected).size === m.take &&
        x.selected.every((n) => Number.isInteger(n) && n >= 0 && n < m.parts)
      );
    case "measure":
      return x.columns === m.a && x.rows === m.b && x.value === 2 * (m.a + m.b);
    case "data":
      return (
        Array.isArray(x.selected) &&
        x.selected.length === 2 &&
        x.selected.includes(0) &&
        x.selected.includes(1) &&
        x.value === m.b
      );
    case "pattern":
      return (
        Array.isArray(x.selected) &&
        x.selected.length === 2 &&
        x.selected[0] === m.a + 3 * m.step &&
        x.selected[1] === m.a + 4 * m.step
      );
    case "route":
      return (
        Array.isArray(x.path) &&
        x.path.length === 3 &&
        x.path.every((n, i) => m.paths[i].includes(n)) &&
        x.path.reduce((a, b) => a + b, 0) === m.target
      );
  }
  return false;
}
export function solvedModel(m) {
  switch (m.kind) {
    case "balance":
      return { value: m.b };
    case "sharing":
      return { baskets: Array(m.a).fill(m.b) };
    case "array":
      return { rows: m.a, columns: m.b };
    case "fraction":
      return { selected: Array.from({ length: m.take }, (_, i) => i) };
    case "measure":
      return { rows: m.b, columns: m.a, value: 2 * (m.a + m.b) };
    case "data":
      return { selected: [0, 1], value: m.b };
    case "pattern":
      return { selected: [m.a + 3 * m.step, m.a + 4 * m.step] };
    case "route":
      for (const a of m.paths[0])
        for (const b of m.paths[1])
          for (const c of m.paths[2])
            if (a + b + c === m.target) return { path: [a, b, c] };
  }
}
export function newWorkshop(level, seed, focus = "all") {
  if (focus !== "all" && !Object.hasOwn(PROJECTS, focus))
    throw Error("Proyecto no válido.");
  const order = focus === "all" ? PROJECT_ORDER : Array(8).fill(focus);
  return {
    schema: "sendero.workshop.v1",
    id: crypto.randomUUID(),
    level,
    seed,
    focus,
    index: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
    records: order.map((kind, i) => {
      const m = mission(kind, level, (seed + i * 7919) >>> 0);
      return {
        kind,
        seed: m.seed,
        model: clone(m.initial),
        phase: "build",
        checks: [],
        reasonAttempts: [],
        hint: false,
        verification: null,
        explanation: "",
      };
    }),
  };
}
function verificationSeed(kind, level, seed) {
  const signature = (m) =>
    JSON.stringify(
      m.kind === "fraction"
        ? [m.parts, m.take]
        : m.kind === "data"
          ? m.values
          : m.kind === "route"
            ? [m.paths, m.target]
            : [m.a, m.b, m.step],
    );
  const text = signature(mission(kind, level, seed));
  for (let i = 1; i < 100; i++) {
    const next = (seed + i * 104729) >>> 0;
    if (
      signature(mission(kind, level, next)) !== text &&
      !modelCorrect(
        mission(kind, level, next),
        solvedModel(mission(kind, level, seed)),
      )
    )
      return next;
  }
  throw Error("No se pudo preparar otro reto.");
}
export function currentMission(session) {
  const r = session.records[session.index];
  return mission(
    r.kind,
    session.level,
    r.verification && ["verify", "done"].includes(r.phase)
      ? r.verification.seed
      : r.seed,
  );
}
export function applyWorkshopAction(s, action) {
  if (!s || s.completedAt || !action) return false;
  const r = s.records[s.index],
    m = currentMission(s),
    x = r.model;
  if (action.type === "note") {
    r.explanation = String(action.value || "").slice(0, 600);
    return true;
  }
  if (action.type === "hint" && r.phase !== "done") {
    r.hint = true;
    return true;
  }
  if (action.type === "reason" && r.phase === "explain") {
    if (
      !Number.isInteger(action.value) ||
      action.value < 0 ||
      action.value >= m.reasons.length ||
      r.reasonAttempts.includes(action.value)
    )
      return false;
    r.reasonAttempts.push(action.value);
    if (action.value === m.reason) {
      if (
        r.hint ||
        r.checks.some((c) => !c.correct) ||
        r.reasonAttempts.length > 1
      ) {
        const seed = verificationSeed(r.kind, s.level, r.seed),
          probe = mission(r.kind, s.level, seed);
        r.verification = { seed, checks: [], hintAtStart: r.hint };
        r.phase = "verify";
        r.model = clone(probe.initial);
      } else r.phase = "done";
    }
    return true;
  }
  if (action.type === "next" && r.phase === "done") {
    if (s.index === 7) s.completedAt = new Date().toISOString();
    else s.index++;
    return true;
  }
  if (!["build", "verify"].includes(r.phase)) return false;
  if (action.type === "check") {
    const correct = modelCorrect(m, x),
      checks = r.phase === "verify" ? r.verification.checks : r.checks;
    if (checks.length >= 100 && !modelCorrect(m, r.model)) return false;
    checks.push({ model: clone(x), correct });
    if (correct) r.phase = r.phase === "verify" ? "done" : "explain";
    return true;
  }
  if (action.type === "reset") {
    r.model = clone(m.initial);
    return true;
  }
  if (action.type === "change") {
    const key = action.key,
      delta = action.delta;
    if (
      !["value", "rows", "columns"].includes(key) ||
      !Object.hasOwn(x, key) ||
      ![1, -1, 5, -5].includes(delta)
    )
      return false;
    x[key] = Math.max(
      key === "value" ? 0 : 1,
      Math.min(key === "value" ? 60 : 10, x[key] + delta),
    );
    return true;
  }
  if (action.type === "basket" && m.kind === "sharing") {
    if (
      !Number.isInteger(action.index) ||
      action.index < 0 ||
      action.index >= m.a ||
      ![-1, 1].includes(action.delta)
    )
      return false;
    const left = m.total - x.baskets.reduce((a, b) => a + b, 0);
    if (
      (action.delta > 0 && left <= 0) ||
      (action.delta < 0 && x.baskets[action.index] === 0)
    )
      return false;
    x.baskets[action.index] += action.delta;
    return true;
  }
  if (
    action.type === "select" &&
    ["fraction", "data", "pattern"].includes(m.kind)
  ) {
    const allowed =
      m.kind === "fraction"
        ? Array.from({ length: m.parts }, (_, i) => i)
        : m.kind === "data"
          ? [0, 1, 2]
          : m.tiles;
    if (!allowed.includes(action.value)) return false;
    if (x.selected.includes(action.value))
      x.selected = x.selected.filter((v) => v !== action.value);
    else if (x.selected.length < (m.kind === "fraction" ? m.parts : 2))
      x.selected.push(action.value);
    return true;
  }
  if (
    action.type === "path" &&
    m.kind === "route" &&
    Number.isInteger(action.index) &&
    m.paths[action.index]?.includes(action.value)
  ) {
    x.path[action.index] = action.value;
    return true;
  }
  return false;
}
export function workshopSummary(s) {
  return {
    completed: s.records.filter((r) => r.phase === "done").length,
    independent: s.records.filter(
      (r) =>
        r.phase === "done" &&
        !r.hint &&
        r.checks.length === 1 &&
        r.checks[0].correct &&
        r.reasonAttempts.length === 1,
    ).length,
    modelErrors: s.records.reduce(
      (n, r) => n + r.checks.filter((c) => !c.correct).length,
      0,
    ),
    reasonErrors: s.records.reduce(
      (n, r) => n + Math.max(0, r.reasonAttempts.length - 1),
      0,
    ),
    verified: s.records.filter((r) => r.verification?.checks.at(-1)?.correct)
      .length,
    notes: s.records.filter((r) => r.explanation.trim()).length,
  };
}
function modelShape(m, x) {
  if (
    !x ||
    typeof x !== "object" ||
    Array.isArray(x) ||
    Object.keys(x).some((k) => !Object.hasOwn(m.initial, k)) ||
    Object.keys(m.initial).some((k) => !Object.hasOwn(x, k))
  )
    return false;
  const integer = (n, max, min = 0) =>
    Number.isInteger(n) && n >= min && n <= max;
  if (Object.hasOwn(x, "value") && !integer(x.value, 60)) return false;
  if (
    Object.hasOwn(x, "rows") &&
    (!integer(x.rows, 10, 1) || !integer(x.columns, 10, 1))
  )
    return false;
  if (
    x.baskets &&
    (!Array.isArray(x.baskets) ||
      x.baskets.length !== m.a ||
      x.baskets.some((n) => !integer(n, m.total)) ||
      x.baskets.reduce((a, b) => a + b, 0) > m.total)
  )
    return false;
  if (x.selected) {
    const allowed =
      m.kind === "fraction"
        ? Array.from({ length: m.parts }, (_, i) => i)
        : m.kind === "data"
          ? [0, 1, 2]
          : m.tiles;
    if (
      !Array.isArray(x.selected) ||
      x.selected.length > (m.kind === "fraction" ? m.parts : 2) ||
      new Set(x.selected).size !== x.selected.length ||
      x.selected.some((n) => !allowed.includes(n))
    )
      return false;
  }
  if (
    x.path &&
    (!Array.isArray(x.path) ||
      x.path.length !== 3 ||
      x.path.some((n, i) => n !== null && !m.paths[i].includes(n)))
  )
    return false;
  return true;
}
export function validWorkshop(s) {
  if (s?.enrollment !== undefined && !validEnrollment(s.enrollment)) return false;
  if (
    !s ||
    s.schema !== "sendero.workshop.v1" ||
    typeof s.id !== "string" ||
    s.id.length > 80 ||
    !Number.isInteger(s.index) ||
    s.index < 0 ||
    s.index > 7 ||
    !Array.isArray(s.records) ||
    s.records.length !== 8 ||
    !Number.isFinite(Date.parse(s.startedAt)) ||
    (s.completedAt !== null && !Number.isFinite(Date.parse(s.completedAt)))
  )
    return false;
  if (
    (s.focus !== "all" && !Object.hasOwn(PROJECTS, s.focus)) ||
    !Number.isInteger(s.seed) ||
    s.seed < 0 ||
    s.seed > 4294967295 ||
    (s.completedAt && s.index !== 7)
  )
    return false;
  try {
    return s.records.every((r, i) => {
      if (
        r.kind !== (s.focus === "all" ? PROJECT_ORDER[i] : s.focus) ||
        r.seed !== (s.seed + i * 7919) >>> 0
      )
        return false;
      const m = mission(r.kind, s.level, r.seed);
      if (
        !["build", "explain", "verify", "done"].includes(r.phase) ||
        typeof r.hint !== "boolean" ||
        typeof r.explanation !== "string" ||
        r.explanation.length > 600 ||
        !Array.isArray(r.checks) ||
        r.checks.length > 101 ||
        !Array.isArray(r.reasonAttempts) ||
        r.reasonAttempts.length > 3 ||
        new Set(r.reasonAttempts).size !== r.reasonAttempts.length ||
        r.reasonAttempts.some((n) => !Number.isInteger(n) || n < 0 || n > 2) ||
        JSON.stringify(r.model).length > 1000
      )
        return false;
      if (
        !r.checks.every(
          (c) =>
            modelShape(m, c.model) && c.correct === modelCorrect(m, c.model),
        )
      )
        return false;
      if (
        r.checks.slice(0, -1).some((c) => c.correct) ||
        (r.phase === "build" && r.checks.some((c) => c.correct)) ||
        r.reasonAttempts.slice(0, -1).includes(m.reason) ||
        (r.phase === "explain" && r.reasonAttempts.includes(m.reason))
      )
        return false;
      if (
        ["explain", "verify", "done"].includes(r.phase) &&
        !r.checks.at(-1)?.correct
      )
        return false;
      if (
        ["verify", "done"].includes(r.phase) &&
        r.reasonAttempts.at(-1) !== m.reason
      )
        return false;
      const shown =
        r.verification && ["verify", "done"].includes(r.phase)
          ? mission(r.kind, s.level, r.verification.seed)
          : m;
      if (!modelShape(shown, r.model)) return false;
      if (
        (["explain", "done"].includes(r.phase) &&
          !modelCorrect(shown, r.model)) ||
        (r.verification && !["verify", "done"].includes(r.phase))
      )
        return false;
      if (r.verification) {
        const v = mission(
          r.kind,
          s.level,
          verificationSeed(r.kind, s.level, r.seed),
        );
        if (
          r.verification.seed !== v.seed ||
          !Array.isArray(r.verification.checks) ||
          r.verification.checks.length > 101 ||
          !r.verification.checks.every(
            (c) =>
              modelShape(v, c.model) && c.correct === modelCorrect(v, c.model),
          ) ||
          (r.phase === "done" && !r.verification.checks.at(-1)?.correct)
        )
          return false;
      }
      if (
        r.phase === "done" &&
        (r.hint ||
          r.checks.some((c) => !c.correct) ||
          r.reasonAttempts.length > 1) &&
        !r.verification
      )
        return false;
      if (
        (i < s.index && r.phase !== "done") ||
        (s.completedAt && r.phase !== "done")
      )
        return false;
      if (
        i > s.index &&
        (r.phase !== "build" ||
          r.checks.length ||
          r.reasonAttempts.length ||
          r.hint ||
          r.verification)
      )
        return false;
      return true;
    });
  } catch {
    return false;
  }
}
