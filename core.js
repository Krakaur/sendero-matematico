export const VERSION = "0.1.1";
export const SCHEMA = "sendero.report.v1";
export const TRAILS = {
  suma: {
    name: "El bosque de las sumas",
    short: "Sumas",
    symbol: "+",
    color: "green",
    description: "Reúne semillas y encuentra nuevos caminos.",
    skill: "Composición de números",
  },
  resta: {
    name: "El río de las restas",
    short: "Restas",
    symbol: "−",
    color: "blue",
    description: "Cruza el río, una pequeña aventura a la vez.",
    skill: "Diferencias entre cantidades",
  },
  multi: {
    name: "La huerta de los grupos",
    short: "Multiplicación",
    symbol: "×",
    color: "orange",
    description: "Descubre cuánto crece en cada grupo.",
    skill: "Grupos iguales",
  },
};
export function uid() {
  return crypto.randomUUID();
}
export function recordAttempt(question, value) {
  if (
    question.done ||
    !question.options.includes(value) ||
    question.attempts.includes(value)
  )
    return false;
  question.attempts.push(value);
  if (value !== question.answer) question.solutionShown = true;
  else question.done = true;
  return true;
}
export function adapt(state, question) {
  const next = {
    level: state.level,
    streak: state.streak || 0,
    support: state.support || 0,
  };
  if (
    question.attempts.length === 1 &&
    question.attempts[0] === question.answer &&
    !question.hint
  ) {
    next.streak++;
    next.support = 0;
    if (next.streak >= 3) {
      next.level = Math.min(4, next.level + 1);
      next.streak = 0;
    }
  } else {
    next.streak = 0;
    next.support++;
    if (next.support >= 2) {
      next.level = Math.max(1, next.level - 1);
      next.support = 0;
    }
  }
  return next;
}
export function makeQuestion(trail, level, rng = Math.random) {
  const int = (min, max) => min + Math.floor(rng() * (max - min + 1));
  let a, b, answer;
  if (trail === "multi") {
    a = int(2, [3, 5, 8, 10][level - 1]);
    b = int(2, [3, 5, 8, 10][level - 1]);
    answer = a * b;
  } else {
    const max = [5, 10, 20, 50][level - 1];
    a = int(1, max);
    b = int(1, max);
    if (trail === "resta" && a < b) [a, b] = [b, a];
    answer = trail === "resta" ? a - b : a + b;
  }
  const options = new Set([answer]);
  while (options.size < 4) {
    const candidate = answer + int(-Math.min(answer, 5), 5);
    options.add(candidate);
  }
  const values = [...options];
  for (let i = values.length - 1; i > 0; i--) {
    const j = int(0, i);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return {
    a,
    b,
    answer,
    level,
    options: values,
    attempts: [],
    hint: false,
    solutionShown: false,
    activeMs: 0,
  };
}
export function newSession(trail, level, profile) {
  return {
    id: uid(),
    profile,
    trail,
    level,
    version: VERSION,
    startedAt: new Date().toISOString(),
    completedAt: null,
    index: 0,
    questions: Array.from({ length: 8 }, () => makeQuestion(trail, level)),
  };
}
export function summarize(sessions) {
  const questions = sessions.flatMap((s) =>
    s.questions.filter((q) => q.attempts.length),
  );
  const first = questions.filter((q) => q.attempts[0] === q.answer).length;
  return {
    sessions: sessions.length,
    items: questions.length,
    first,
    accuracy: questions.length
      ? Math.round((100 * first) / questions.length)
      : null,
    hints: questions.filter((q) => q.hint).length,
    activeMs: questions.reduce((n, q) => n + q.activeMs, 0),
  };
}
export function dimensions(sessions) {
  const qs = sessions.flatMap((s) =>
    s.questions.filter((q) => q.attempts.length),
  );
  const n = qs.length,
    errors = qs.filter((q) => q.attempts[0] !== q.answer);
  return {
    n,
    first: qs.filter((q) => q.attempts[0] === q.answer).length,
    independent: qs.filter(
      (q) => q.attempts.length === 1 && q.attempts[0] === q.answer && !q.hint,
    ).length,
    hints: qs.filter((q) => q.hint).length,
    recovered: errors.filter(
      (q) => q.attempts.length === 2 && q.attempts.at(-1) === q.answer,
    ).length,
    errors: errors.length,
  };
}
export function validateReport(data) {
  if (
    !data ||
    data.schema !== SCHEMA ||
    typeof data.profile !== "string" ||
    !/^[a-zA-Z0-9-]{1,60}$/.test(data.profile) ||
    !Array.isArray(data.sessions) ||
    data.sessions.length > 5000
  )
    throw new Error("No es un informe de Sendero compatible.");
  for (const s of data.sessions) {
    if (
      !s ||
      typeof s.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(s.id) ||
      s.profile !== data.profile ||
      !Object.hasOwn(TRAILS, s.trail) ||
      ![1, 2, 3, 4].includes(s.level) ||
      typeof s.version !== "string" ||
      s.version.length > 20 ||
      !Number.isFinite(Date.parse(s.startedAt)) ||
      !Number.isFinite(Date.parse(s.completedAt)) ||
      !Array.isArray(s.questions) ||
      s.questions.length !== 8
    )
      throw new Error("El informe contiene una sesión no válida.");
    for (const q of s.questions) {
      if (
        !q ||
        ![1, 2, 3, 4].includes(q.level) ||
        ![q.a, q.b, q.answer, q.activeMs].every(Number.isFinite) ||
        !Number.isInteger(q.a) ||
        !Number.isInteger(q.b) ||
        q.a < 0 ||
        q.a > 50 ||
        q.b < 0 ||
        q.b > 50 ||
        q.activeMs < 0 ||
        q.activeMs > 86400000 ||
        typeof q.hint !== "boolean" ||
        (q.solutionShown !== undefined &&
          typeof q.solutionShown !== "boolean") ||
        !Array.isArray(q.attempts) ||
        q.attempts.length < 1 ||
        q.attempts.length > 20 ||
        !q.attempts.every((n) => Number.isInteger(n) && n >= 0 && n <= 2500) ||
        q.attempts.at(-1) !== q.answer
      )
        throw new Error("El informe contiene respuestas no válidas.");
      const expected =
        s.trail === "suma"
          ? q.a + q.b
          : s.trail === "resta"
            ? q.a - q.b
            : q.a * q.b;
      if (q.answer !== expected)
        throw new Error("Los resultados no coinciden con los ejercicios.");
    }
  }
  return data;
}
export function mergeSessions(existing, incoming) {
  const ids = new Map(existing.map((s) => [s.id, s]));
  let added = 0;
  for (const s of incoming) {
    if (!ids.has(s.id)) {
      ids.set(s.id, s);
      added++;
    }
  }
  return { sessions: [...ids.values()], added };
}
