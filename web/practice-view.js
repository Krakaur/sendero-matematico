const safe = (n) => (Number.isInteger(n) && n >= 0 && n <= 50 ? n : 0);
export function calmSceneHTML(trail, index, count=8) {
  const names = {
      suma: [
        "El sendero de las semillas",
        "Cada reto hace crecer el bosque.",
        "✿",
      ],
      resta: [
        "Los puentes del río",
        "Encuentra lo que queda y abre otro paso.",
        "⌁",
      ],
      multi: [
        "El vivero de los grupos",
        "Organiza las plantas en grupos iguales.",
        "▦",
      ],
      tablas20: [
        "El invernadero grande",
        "Explora productos con grupos más grandes.",
        "✦",
      ],
    },
    [title, text, icon] = names[trail];
  return `<section class="calm-scene" aria-label="${title}: ${index} de ${count} retos completados"><div><span class="eyebrow">A MI RITMO</span><h2>${title}</h2><p>${text}</p></div><div class="calm-garden" aria-hidden="true">${Array.from({ length: count }, (_, i) => `<span class="${i < index ? "grown" : ""}">${i < index ? icon : "·"}</span>`).join("")}</div></section>`;
}
export function writtenAnswerHTML(q) {
  return `<form id="written-answer" class="written-answer"><label for="written-result">Construye tu respuesta</label><div><input id="written-result" name="result" type="number" inputmode="numeric" min="0" max="2500" step="1" required autocomplete="off" placeholder="Resultado" aria-describedby="feedback"><button class="primary">Comprobar</button></div></form>`;
}
export function workbenchHTML(trail, q) {
  const a = safe(q.a),
    b = Math.max(
      0,
      Math.min(
        trail === "resta" ? a : Math.max(20, safe(q.b)),
        Number(q.exploreCount) || 0,
      ),
    ),
    multiply = ["multi", "tablas20"].includes(trail),
    subtract = trail === "resta";
  const value = multiply ? a * b : subtract ? a - b : a + b;
  return `<aside class="arithmetic-workbench"><h3>Explora la operación</h3><p>${multiply ? `Mantén ${a} grupos y cambia cuántos elementos tiene cada grupo.` : `Empieza en ${a}. Cambia cuántos ${subtract ? "retiras" : "añades"}.`}</p><div class="workbench-model">${multiply ? Array.from({ length: Math.min(a, 20) }, (_, i) => `<span><small>Grupo ${i + 1}</small><strong>${b}</strong></span>`).join("") : `<span class="workbench-start">${a}</span><b>${subtract ? "−" : "+"}</b><span>${b}</span><b>=</b><span class="workbench-result">${value}</span>`}</div><div class="workbench-controls"><button class="soft-button" data-explore="-1" aria-label="Quitar uno del modelo" ${b === 0 ? "disabled" : ""}>−</button><output>${b}</output><button class="soft-button" data-explore="1" aria-label="Añadir uno al modelo" ${b === (subtract ? a : Math.min(50, Math.max(20, q.b))) ? "disabled" : ""}>+</button></div>${multiply ? `<p>${a} grupos × ${b} en cada grupo = ${value} elementos.</p>` : ""}<p>Relaciona este modelo con el reto. Abrirlo queda registrado como ayuda.</p></aside>`;
}
