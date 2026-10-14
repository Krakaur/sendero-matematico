const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function mathStrategy(trail, q) {
  const { a, b, answer } = q;
  if (trail === "suma") {
    const tens = Math.floor(b / 10) * 10,
      ones = b % 10;
    return {
      title: "Juntar y avanzar",
      text: `Empieza en ${a} y avanza ${b}.`,
      relation: tens
        ? `${a} + ${tens} + ${ones} = ${a + tens} + ${ones} = ${answer}`
        : `${a} + ${b} = ${answer}`,
      inverse: `Comprueba: ${answer} − ${b} = ${a}.`,
    };
  }
  if (trail === "resta")
    return {
      title: "Quitar y comprobar",
      text: `Desde ${a}, retrocede ${b}.`,
      relation: `${a} − ${b} = ${answer}`,
      inverse: `Comprueba sumando: ${answer} + ${b} = ${a}.`,
    };
  const split = b > 10 ? 10 : b > 5 ? 5 : Math.max(1, b - 1),
    rest = b - split;
  return {
    title: "Grupos iguales",
    text: `Hay ${a} grupos de ${b}. Puedes separar cada grupo para calcular.`,
    relation: rest
      ? `${a} × ${b} = (${a} × ${split}) + (${a} × ${rest}) = ${a * split} + ${a * rest} = ${answer}`
      : `${a} × ${b} = ${answer}`,
    inverse: `Intercambiar filas y columnas conserva la cantidad: ${b} × ${a} = ${answer}.`,
    split,
  };
}
export function mathSupportHTML(trail, q) {
  if (q.bankId)
    return `<aside class="hint-box math-support"><p>${esc(q.explanation)}</p></aside>`;
  const s = mathStrategy(trail, q);
  let visual = "";
  if (trail === "multi" || trail === "tablas20") {
    if (q.a * q.b <= 100)
      visual = `<div class="math-array" style="--columns:${q.b}" role="img" aria-label="${q.a} filas de ${q.b}; ${q.answer} elementos en total">${Array.from({ length: q.a * q.b }, (_, i) => `<i class="${i % q.b >= s.split ? "partition" : ""}" aria-hidden="true"></i>`).join("")}</div>`;
  } else {
    const max = Math.max(1, q.a, q.answer),
      x = (v) => 25 + (v / max) * 290,
      from = x(q.a),
      to = x(q.answer),
      end = to >= from ? to - 6 : to + 6;
    visual = `<svg class="number-route" viewBox="0 0 340 85" role="img" aria-label="${esc(s.text)} Llegas a ${q.answer}."><path d="M25 57H315" stroke="#587c6d" stroke-width="2"/><path d="M${from} 50 Q${(from + to) / 2} 0 ${to} 50 L${end} 44" fill="none" stroke="#a26a26" stroke-width="3"/><text x="${from}" y="76" text-anchor="middle">${q.a}</text>${q.a !== q.answer ? `<text x="${to}" y="76" text-anchor="middle">${q.answer}</text>` : ""}<text x="${(from + to) / 2}" y="20" text-anchor="middle">${trail === "resta" ? "−" : "+"}${q.b}</text></svg>`;
  }
  return `<aside class="hint-box math-support"><strong>${s.title}</strong><p>${s.text}</p>${visual}<p class="math-relation">${s.relation}</p><p>${s.inverse}</p></aside>`;
}
export function learningReviewHTML(session) {
  const needs = session.questions.filter(
      (q) => q.hint || q.attempts?.[0] !== q.answer,
    ),
    items = needs.length ? needs : session.questions.slice(-1);
  return `<section class="learning-review"><h2>Lo que aprendemos del recorrido</h2><p>${needs.length ? `${needs.length} retos necesitaron ayuda o corrección. Revisa la idea que permite resolverlos.` : "Completaste los retos sin ayuda inicial. Elige una estrategia y explica por qué funciona."} La posición en la carrera no mide comprensión.</p>${items.map((q) => `<details><summary>${q.bankId ? esc(q.prompt) : `${q.a} ${session.trail === "suma" ? "+" : session.trail === "resta" ? "−" : "×"} ${q.b}`} · ${q.hint ? "con ayuda" : q.attempts?.length > 1 ? "corregido" : "para explicar"}</summary>${mathSupportHTML(session.trail, q)}<p>Sin mirar la solución, explica el procedimiento a otra persona. Después compruébalo.</p></details>`).join("")}</section>`;
}
