import {TRAILS} from './core.js';import {fluency} from './fluency.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function resultGroups(sessions) {
 const rows=[];
 for(const [trail,t] of Object.entries(TRAILS)) {
  if(trail==='razonar')continue;
  for(let level=1;level<=4;level++) {
   const ss=sessions.filter(s=>s.trail===trail).sort((a,b)=>a.completedAt.localeCompare(b.completedAt));
   const questions=ss.flatMap(s=>s.questions).filter(q=>q.level===level&&q.attempts.length);
   if(!questions.length)continue;
   const first=questions.filter(q=>q.attempts[0]===q.answer).length;
   rows.push({trail,title:t.short,level,total:questions.length,first,errors:questions.length-first,percent:Math.round(100*first/questions.length),fluency:fluency(questions),recent:ss.map(s=>({at:s.completedAt,...fluency(s.questions.filter(q=>q.level===level))})).filter(f=>f.n).slice(-6)});
  }
 }
 return rows;
}
export function renderFluency(sessions) {
 const groups=resultGroups(sessions);if(!groups.length)return '';
 return `<section class="panel results-panel"><h2>Precisión y ritmo</h2><p>Lee ambos datos juntos. Compara el mismo contenido y nivel.</p><div class="result-groups">${groups.map(g=>{
  const f=g.fluency,max=Math.max(1,...g.recent.map(r=>r.rate)),tone=g.percent<50?'terracotta':g.percent<80?'amber':'green';
  return `<article class="result-card"><h3>${esc(g.title)} <span>Nivel ${g.level}</span></h3><div class="result-pair"><div><span>Aciertos al primer intento</span><strong>${g.first}<small> de ${g.total}</small></strong><p>${g.errors} ${g.errors===1?'ejercicio necesitó':'ejercicios necesitaron'} corrección</p></div><div><span>Ritmo de respuesta</span><strong>${f.n?f.rate.toFixed(1):'—'}</strong><p>aciertos sin pista por minuto de respuesta</p></div></div><div class="result-meter ${tone}" role="meter" aria-label="Precisión inicial" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${g.percent}"><i style="width:${g.percent}%"></i></div><p class="result-caption">${g.percent}% de aciertos iniciales · ${f.n} ejercicios con tiempo válido${f.n<5?' · Pocos datos: sigue practicando.':''}</p>
  ${g.recent.length>1?`<details open><summary>Tu evolución en este nivel</summary><ol class="result-history">${g.recent.map(r=>`<li><span>${esc(new Date(r.at).toLocaleDateString('es',{day:'numeric',month:'short'}))}</span><div><i style="width:${r.rate/max*100}%"></i></div><strong>${r.rate.toFixed(1)}/min</strong><small>${r.accuracy.toFixed(0)}% · ${r.n} ejercicios</small></li>`).join('')}</ol><p class="micro">Barras azules: ritmo. Escala propia de este panel: 0 a ${max.toFixed(1)} aciertos/min. No compara niveles diferentes.</p></details>`:''}
  <details><summary>Cómo se obtuvo este resultado</summary><p>Ritmo: 60 × aciertos iniciales sin pista, dividido entre los segundos hasta la primera respuesta de los ejercicios válidos. Los errores iniciales aportan tiempo. ${f.excluded} ejercicios quedaron fuera de rapidez por ayudas, interrupciones o falta de tiempos compatibles. Las correcciones y transiciones no se incluyen.</p><p>Precisión: primeras respuestas correctas entre ejercicios contestados; puede incluir una pista. Colores: menos de 50%, 50–79% y 80–100%. Son descripciones de esta práctica, no calificaciones ni umbrales validados de dominio. Una mejora observada no demuestra por sí sola aprendizaje.</p></details></article>`;
 }).join('')}</div></section>`;
}
