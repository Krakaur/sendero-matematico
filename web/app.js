import {newRace,raceStats,raceLevel,competitionHTML} from "./race.js";
import {encryptBackup,decryptBackup,restoreSnapshot} from "./backup.js";
import {renderFluency} from "./results.js";
import {narrateLocally} from "./narration.js";
import {readInvitation, exchangeClassroom, applyExchange, classroomRequest, validateTasks} from "./classroom.js";
import {profileList, migrateLegacy, createProfile, loginProfile, updateProfile, profileKey} from "./profiles.js";
import { fluency, interruptTiming } from "./fluency.js";
import { rememberPractice, practiceQuestion } from "./practice.js";
import { bankQuestion, optionText, reasoningDimensions, bankCount } from "./bank.js";
import {
  VERSION,
  recordAttempt,
  SCHEMA,
  TRAILS,
  uid,
  newSession,
  makeQuestion,
  adapt,
  summarize,
  dimensions,
  validateReport,
  mergeSessions,
} from "./core.js";
const $ = (s) => document.querySelector(s),
  main = $("#main");
let KEY = null, activeProfile = null;
const desktop = navigator.userAgent.includes("SenderoDesktop/1");
const android =
  navigator.userAgent.includes("SenderoAndroid/1") && !!window.SenderoAndroid;
const bundled = desktop || android;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fresh = () => ({
  profile: uid(),
  sessions: [],
  current: null,
  adaptive: {},
  teacher: [],
  sound: false,
  exportedAt: null,
});
let state = fresh();
let storageOK = true;
try {
  const migrated = migrateLegacy(localStorage);
  const id = sessionStorage.getItem('sendero.active') || migrated?.id;
  activeProfile = profileList(localStorage).find(p=>p.id===id) || null;
  if(activeProfile) {
    KEY=profileKey(activeProfile.id);
    state=JSON.parse(localStorage.getItem(KEY));
    if(!state || state.profile!==activeProfile.id || !Array.isArray(state.sessions))throw Error();
    sessionStorage.setItem('sendero.active',activeProfile.id);
  }
} catch { activeProfile=null;KEY=null;storageOK=false; }
let timerStart = null,
  idleTimer = null,
  audioContext = null,
  installPrompt = null;
let raceMove = null;
function raceElapsed(){return (state.current?.race?.elapsedMs||0)+(timerStart===null?0:Math.min(60000,Math.max(0,performance.now()-timerStart)));}
function updateRace(){
 if(!state.current?.race||document.hidden||location.hash!=='#jugar')return;
 const ms=raceElapsed(),r=raceStats(state.current,ms);
 document.querySelectorAll('[data-racer]').forEach(el=>{const i=Number(el.dataset.racer);el.style.left=100*(i?r.bots[i-1]:r.progress)+'%';});
 if($('#race-position'))$('#race-position').textContent=r.rank+' / 4';
 if($('#race-clock'))$('#race-clock').textContent=(ms/1000).toFixed(1)+' s';
}
setInterval(updateRace,120);
function storageWarning() {
  const el = $("#storage-alert");
  el.hidden = false;
  el.textContent =
    "No se pudo guardar en este dispositivo. Exporta tus resultados antes de cerrar. Comprueba que haya espacio y que el almacenamiento esté permitido.";
}
function save() {
  if(!KEY || !activeProfile) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOK = true;
  } catch {
    storageOK = false;
    storageWarning();
  }
}
if (!storageOK) storageWarning();
else save();
interruptTiming(state.current?.questions[state.current.index]);
function announce(text) {
  $("#announce").textContent = text;
}
let syncBusy = false;
function classroomHTML() {
  const link=state.classroom,teacherRole=activeProfile?.role==='teacher';
  const pending=state.sessions.filter(s=>!link?.received?.includes(s.id)).length;
  return `<section class="panel"><h2>${teacherRole?'Mi aula y las tareas':'Compartir con mi docente'}</h2>${link?`<p>Aula vinculada: ${esc(new URL(link.endpoint).host)}. ${teacherRole?'Recepción de informes habilitada.':`${pending} aventuras pendientes de confirmar.`}</p><p>${link.lastReceipt?'Última confirmación: '+esc(new Date(link.lastReceipt).toLocaleString('es')):'Todavía sin confirmación del servidor.'}</p><p role="status">${esc(link.error||'')}</p><div class="button-row"><button id="sync-now" class="primary">Conectar ahora</button><button id="unlink-class" class="secondary">Desvincular</button></div>`:'<p>Importa una invitación entregada por la persona responsable del aula. Sin invitación, puedes seguir compartiendo los informes mediante archivos.</p>'}
  <details><summary>${link?'Cambiar invitación':'Vincular con un aula'}</summary><p>La invitación contiene una clave privada y el servidor de destino. Al confirmar, se enviarán automáticamente las aventuras completas de este perfil cuando el juego esté abierto y haya conexión. No se enviarán contraseñas ni alias.</p><label>Archivo de invitación<input id="class-invite" type="file" accept=".json,application/json"></label><p id="class-status" role="status"></p></details>
  ${link?.tasks?.length?`<h3>Tareas del aula</h3>${link.tasks.map(t=>`<div class="session-row"><div><strong>${esc(t.title)}</strong><p>${TRAILS[t.trail].short}</p></div>${teacherRole?'':`<button class="secondary" data-trail="${t.trail}">Practicar</button>`}</div>`).join('')}`:''}
  ${teacherRole&&link?`<form id="class-task" class="profile-form"><h3>Asignar una práctica al grupo</h3><label>Título<input name="title" maxlength="100" required></label><label>Contenido<select name="trail">${Object.entries(TRAILS).map(([id,t])=>`<option value="${id}">${t.short}</option>`).join('')}</select></label><button class="primary">Publicar tarea</button></form>`:''}<p class="micro">La confirmación registra recepción técnica, no que el docente haya leído el informe. Las tareas orientan la práctica adaptativa y no son exámenes.</p></section>`;
}
async function syncClassroom() {
  if(syncBusy||!activeProfile||!state.classroom?.enabled||!navigator.onLine)return;
  const id=state.profile,link=JSON.stringify(state.classroom),snapshot=structuredClone(state);
  syncBusy=true;
  try {
    const result=await exchangeClassroom(snapshot);
    const current=activeProfile?.id===id?state:JSON.parse(localStorage.getItem(profileKey(id)));
    if(current?.classroom?.token!==snapshot.classroom.token)return;
    applyExchange(current,result);
    if(activeProfile?.id===id)save();else localStorage.setItem(profileKey(id),JSON.stringify(current));
  }catch(e){if(activeProfile?.id===id&&JSON.stringify(state.classroom)===link){state.classroom.error=e.message;save();}}
  finally {syncBusy=false;if(activeProfile?.id===id&&location.hash==='#docentes')render(false);}
}
function bindClassroom() {
  $('#sync-now')?.addEventListener('click',syncClassroom);
  $('#unlink-class')?.addEventListener('click',()=>{delete state.classroom;save();render(false);});
  $('#class-invite')?.addEventListener('change',async e=>{
    try {
      const file=e.target.files[0];if(!file||file.size>10000)throw Error('Invitación demasiado grande.');
      const link=readInvitation(JSON.parse(await file.text()),activeProfile.role);
      if(!confirm(`¿Vincular este perfil con ${new URL(link.endpoint).origin}? Se compartirán los informes completos con ese servidor. La invitación es privada.`))return;
      state.classroom=link;save();render(false);syncClassroom();
    }catch(err){$('#class-status').textContent=err.message;}
  });
  $('#class-task')?.addEventListener('submit',async e=>{
    e.preventDefault();const b=e.currentTarget.querySelector('button');b.disabled=true;
    const f=new FormData(e.currentTarget),id=state.profile,link=structuredClone(state.classroom);
    try {const tasks=validateTasks([...(link.tasks||[]),{id:uid(),title:f.get('title'),trail:f.get('trail')}]);await classroomRequest(link,'/tasks',{tasks});if(state.profile===id){state.classroom.tasks=tasks;save();render(false);}}
    catch(err){if(state.profile===id){state.classroom.error=err.message;save();render(false);}}
    finally{b.disabled=false;}
  });
}
window.addEventListener('online',syncClassroom);
setInterval(()=>{if(!document.hidden)syncClassroom();},60000);
function profilesScreen() {
  let profiles=[];try{profiles=profileList(localStorage);}catch{return '<section class="panel"><h1>No se pudo abrir la lista de perfiles</h1><p>El almacenamiento está dañado. No se ha reemplazado. Conserva los datos del navegador para recuperación técnica.</p></section>';}
  return `<header class="page-head"><span class="eyebrow">Un cuaderno para cada persona</span><h1>¿Quién va a usar Sendero?</h1><p>Los perfiles y las contraseñas funcionan sin internet en este navegador o instalación. No son cuentas en línea.</p></header>
  ${activeProfile?`<section class="panel"><h2>Estás usando: ${esc(activeProfile.name)}</h2><div class="button-row"><a class="primary" href="#explorar">Continuar</a><button class="secondary" id="logout">Cerrar sesión</button></div><details><summary>Mi alias y contraseña</summary><form id="edit-profile" class="profile-form"><label>Alias<input name="alias" value="${esc(activeProfile.name)}" minlength="2" maxlength="24" required></label>${activeProfile.password?'<label>Contraseña actual<input name="previous" type="password" autocomplete="current-password" required></label>':'<p>Tu registro anterior está conservado. Añade una contraseña para separar el acceso.</p>'}<label>Nueva contraseña<input name="password" type="password" autocomplete="new-password" minlength="6" maxlength="128" ${activeProfile.password?'':'required'}></label><button class="primary">Guardar cambios</button></form></details></section>`:''}
  ${profiles.length?`<section class="panel"><h2>Entrar en un perfil</h2><form id="login-profile" class="profile-form"><label>Perfil<select name="profile">${profiles.map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${p.role==='teacher'?'Docente':'Estudiante'}${p.password?'':' · sin contraseña'}</option>`).join('')}</select></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" maxlength="128"></label><button class="primary">Entrar</button></form></section>`:''}
  ${profiles.length<8?`<section class="panel"><h2>Crear un perfil</h2><form id="create-profile" class="profile-form"><label>Alias<input name="alias" minlength="2" maxlength="24" autocomplete="nickname" placeholder="Por ejemplo, Colibrí" required></label><label>Usaré Sendero como<select name="role"><option value="student">Estudiante</option><option value="teacher">Docente o acompañante</option></select></label><label>Contraseña<input name="password" type="password" autocomplete="new-password" minlength="6" maxlength="128" required></label><label>Repetir contraseña<input name="repeat" type="password" autocomplete="new-password" minlength="6" maxlength="128" required></label><button class="primary">Crear y entrar</button></form></section>`:''}
  <section class="panel"><h2>Copia protegida y recuperación</h2><p>Conserva aventuras, partida pendiente y adaptación. La contraseña del respaldo permite recuperar el perfil y elegir una nueva contraseña de acceso. Guarda el archivo y la clave por separado. El aula debe volver a vincularse.</p>${activeProfile?`<form id="backup-profile" class="profile-form"><label>Contraseña para el respaldo<input name="password" type="password" minlength="10" maxlength="128" autocomplete="new-password" required></label><button class="primary">Descargar copia protegida</button></form>`:''}<form id="restore-profile" class="profile-form"><label>Archivo de respaldo<input name="file" type="file" accept=".json,application/json" required></label><label>Contraseña del respaldo<input name="password" type="password" minlength="10" maxlength="128" required></label><label>Nueva contraseña del perfil<input name="new-password" type="password" minlength="6" maxlength="128" autocomplete="new-password" required></label><button class="secondary">Recuperar perfil</button></form><p class="micro">La copia está cifrada. Los datos activos del navegador no lo están. Este formato recupera perfiles web y Windows; no restaura una base Android.</p></section><p id="profile-message" role="status"></p><p class="micro">Hasta ocho perfiles por instalación. El acceso local no cifra los datos guardados ni verifica identidad docente. No hay recuperación remota de contraseñas. Conserva una copia de tus datos.</p>`;
}
function enterProfile(p,s) {
  stopTimer(true);save();
  if(KEY && !storageOK)throw Error("No se pudo guardar el perfil anterior. Exporta una copia antes de cambiar.");
  activeProfile=p;KEY=profileKey(p.id);state=s;
  interruptTiming(state.current?.questions[state.current.index]);
  sessionStorage.setItem('sendero.active',p.id);
  location.hash=p.role==='teacher'?'#docentes':'#explorar';render();syncClassroom();
}
function bindProfiles() {
  $('#backup-profile')?.addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget,b=form.querySelector('button');b.disabled=true;
    try {stopTimer(true);save();const copy=await encryptBackup(activeProfile,state,new FormData(form).get('password'));download(`sendero-respaldo-${profileCode()}.json`,JSON.stringify(copy),'application/json');form.reset();$('#profile-message').textContent='Copia preparada. Conserva también su contraseña.';}
    catch(err){$('#profile-message').textContent=err.message;}finally{b.disabled=false;}
  });
  $('#restore-profile')?.addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget,b=form.querySelector('button');b.disabled=true;
    try {const f=new FormData(form),file=f.get('file');if(file.size>30*1024*1024)throw Error('El respaldo supera 30 MB.');const copy=await decryptBackup(JSON.parse(await file.text()),f.get('password'));
      if(!confirm(`¿Restaurar el perfil ${copy.profile.name}? Si ya existe, se reemplazará su estado con esta copia y cambiará su contraseña. Se conservará un registro local previo para recuperación técnica.`))return;
      stopTimer(true);save();await restoreSnapshot(localStorage,copy,f.get('new-password'));activeProfile=null;KEY=null;state=fresh();sessionStorage.removeItem('sendero.active');render(false);$('#profile-message').textContent='Perfil recuperado. Entra con la nueva contraseña.';
    }catch(err){$('#profile-message').textContent=err.message;}finally{b.disabled=false;}
  });
  $('#logout')?.addEventListener('click',()=>{
    stopTimer(true);save();if(!storageOK)return;activeProfile=null;KEY=null;state=fresh();sessionStorage.removeItem('sendero.active');render(false);
  });
  for(const id of ['create-profile','login-profile','edit-profile']) {
    $('#'+id)?.addEventListener('submit',async e=>{
      e.preventDefault();const form=e.currentTarget,button=form.querySelector('button');button.disabled=true;
      const data=new FormData(form);
      try {
        if(id==='create-profile') {
          if(data.get('password')!==data.get('repeat'))throw Error('Las contraseñas no coinciden.');
          const s=fresh(),p=await createProfile(localStorage,data.get('alias'),data.get('password'),data.get('role'),s);enterProfile(p,s);
        } else if(id==='login-profile') {
          const result=await loginProfile(localStorage,data.get('profile'),data.get('password'));enterProfile(result.profile,result.state);
        } else {
          activeProfile=await updateProfile(localStorage,activeProfile.id,data.get('alias'),data.get('previous')||'',data.get('password'));render(false);$('#profile-message').textContent='Cambios guardados.';
        }
      } catch(error) {$('#profile-message').textContent=error.message;$('#profile-message').scrollIntoView({block:'nearest'});}
      finally {button.disabled=false;}
    });
  }
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
  });
}
function duration(ms) {
  return ms < 60000
    ? `${Math.round(ms / 1000)} s`
    : `${Math.round(ms / 60000)} min`;
}
function profileCode() {
  return state.profile.slice(0, 8).toUpperCase();
}
function levelName(level) {
  return [
    "Primeros pasos",
    "Un poco más lejos",
    "Nuevos caminos",
    "Gran exploración",
  ][level - 1];
}
function statsHTML(s) {
  return `<div class="stats"><div class="stat"><strong>${s.sessions}</strong><span>aventuras completas</span></div><div class="stat"><strong>${s.items}</strong><span>ejercicios practicados</span></div><div class="stat"><strong>${s.accuracy === null ? "—" : s.accuracy + "%"}</strong><span>aciertos al primer intento</span></div><div class="stat"><strong>${s.hints}</strong><span>ejercicios con ayuda</span></div></div>`;
}
function reasoningHTML(sessions) {
 const rows=Object.entries(reasoningDimensions(sessions));if(!rows.length)return "";
 return `<section class="panel dimensions"><h3>Problemas para pensar</h3>${rows.map(([label,d])=>{const pct=Math.round(100*d.independent/d.total);return `<div class="dimension"><div class="dimension-title"><strong>${esc(label)}</strong><span>${d.independent}/${d.total} · ${pct}% sin ayuda</span></div><div class="dimension-bar ${pct<50?"amber":pct<80?"sage":"teal"}" role="meter" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div></div>`;}).join("")}<p>Estos resultados describen las tareas practicadas. No miden por sí solos razonamiento general ni explicación oral.</p></section>`;
}
function fluencyHTML(sessions) { return renderFluency(sessions); }
function dimensionsHTML(sessions) {
  const d = dimensions(sessions);
  const rows = [
    [
      "Precisión inicial",
      d.first,
      d.n,
      "Primera respuesta correcta; puede incluir una pista.",
      "performance",
    ],
    [
      "Resolución sin ayuda",
      d.independent,
      d.n,
      "Acierto al primer intento sin abrir la pista.",
      "performance",
    ],
    [
      "Uso de pistas",
      d.hints,
      d.n,
      "Apoyos consultados. Usarlos no es un fallo.",
      "support",
    ],
    [
      "Corrección al segundo intento",
      d.recovered,
      d.errors,
      "Entre ejercicios con error inicial. Puede incluir la solución visible; no mide dominio.",
      "recovery",
    ],
  ];
  return `<section class="panel dimensions"><span class="eyebrow">Varias miradas, ninguna etiqueta</span><h3>Mapa de la práctica</h3><p class="micro">Descripción de lo realizado. Sin puntuación global ni diagnóstico de dominio.</p>${rows
    .map(([name, num, den, desc, type]) => {
      const pct = den ? Math.round((100 * num) / den) : 0;
      const color =
        type === "performance"
          ? pct < 50
            ? "amber"
            : pct < 80
              ? "sage"
              : "teal"
          : type === "support"
            ? "blue"
            : "purple";
      const band =
        type === "performance" && den
          ? pct < 50
            ? "0–59%"
            : pct < 80
              ? "60–84%"
              : "85–100%"
          : "Descriptivo";
      return `<div class="dimension"><div class="dimension-title"><strong>${name}</strong><span>${den ? `${num}/${den} · ${pct}%` : "Sin observaciones"}</span></div><div class="dimension-bar ${color}" ${den ? `role="meter" aria-label="${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"` : ""}><span style="width:${pct}%"></span></div><p>${desc} <span class="range-label">${den ? band : ""}</span></p></div>`;
    })
    .join(
      "",
    )}<p class="micro">Bandas de color descriptivas, sin validación como umbrales educativos. Interpreta por nivel y contenido en la tabla detallada.</p></section>`;
}
function home() {
  const total = state.sessions.length;
  return `<section class="hero fade-in"><div class="hero-copy"><span class="eyebrow">Pequeños pasos. Grandes descubrimientos.</span><h1>Las matemáticas<br>te llevan <em>lejos.</em></h1><p>Practica cálculo y resuelve situaciones con Luma. Compite en el río o practica con calma. Tú eliges cómo jugar.</p><button class="primary" id="quick-start">${state.current ? "Continuar mi aventura" : "Comenzar aventura"} <span aria-hidden="true">↗</span></button><span class="micro">8 desafíos · Sin anuncios · También sin internet</span></div><div class="hero-art"><img src="./landscape.svg" alt="Luma, una pequeña zorra con bufanda, explora un sendero entre montañas, árboles y una casita."><div class="art-label"><strong>Tu próxima aventura está aquí</strong>${total ? `${total} ${total === 1 ? "sendero recorrido" : "senderos recorridos"}` : "Todo comienza con un pequeño paso"}</div></div></section><section class="mode-picker" aria-label="Forma de jugar"><div><span class="eyebrow">ELIGE TU EXPERIENCIA</span><h2>¿Carrera o exploración?</h2></div><div class="mode-options"><button data-mode="race" class="mode-card ${(state.playMode||'race')==='race'?'selected':''}" aria-pressed="${(state.playMode||'race')==='race'}"><strong>⚑ Carrera del río</strong><span>Tres rivales virtuales · puntos · tu propio reto</span></button><button data-mode="calm" class="mode-card ${state.playMode==='calm'?'selected':''}" aria-pressed="${state.playMode==='calm'}"><strong>✧ A mi ritmo</strong><span>Explora sin competir · todas las ayudas</span></button></div><p class="micro">El taller de razonamiento siempre va sin carrera. La elección se aplica a la siguiente aventura.</p></section><section aria-labelledby="trails-title"><div class="section-header"><h2 id="trails-title">Elige tu camino</h2><span class="micro">La dificultad crece contigo</span></div><div class="trail-grid">${Object.entries(
    TRAILS,
  )
    .map(
      ([id, t]) =>
        `<button class="trail" data-trail="${id}"><div class="trail-pic ${t.color}" aria-hidden="true"><span class="trail-symbol">${t.symbol}</span></div><div class="trail-body"><div class="trail-top"><small>${t.short.toUpperCase()}</small><span aria-hidden="true">↗</span></div><h3>${t.name}</h3><p>${t.description}</p><div class="trail-footer"><span>${levelName(state.adaptive[id]?.level || 1)}</span><span>8 pasos</span></div></div></button>`,
    )
    .join(
      "",
    )}</div></section><div class="notice"><span class="notice-icon" aria-hidden="true">⌁</span><p><strong>Tu aventura también va sin internet.</strong>Prepara el juego una vez y lleva tus descubrimientos contigo.</p></div><div class="download-strip"><p><strong>Lleva Sendero contigo.</strong> Descarga el juego completo para usarlo sin internet.</p><div class="button-row"><a class="soft-button" href="https://github.com/Krakaur/sendero-matematico/releases/download/v0.4.0/Sendero-Nativo-0.4.0.apk" target="_blank" rel="noopener">Android 14–16 · APK nativa ↓</a><a class="soft-button" href="https://github.com/Krakaur/sendero-matematico/releases/download/v0.4.0/Sendero-0.4.0-Windows-x64.exe" target="_blank" rel="noopener">Windows ↓</a></div></div><p class="footer-note">Explorador ${profileCode()} · Progreso guardado en este dispositivo</p>`;
}
const reportFilters={days:'all',trail:'all'};
function progress() {
  const cutoff=reportFilters.days==='all'?0:Date.now()-Number(reportFilters.days)*86400000;
  const visibleSessions=state.sessions.filter(s=>Date.parse(s.completedAt)>=cutoff&&(reportFilters.trail==='all'||s.trail===reportFilters.trail));
  const stats = summarize(visibleSessions);
  return `<header class="page-head fade-in"><span class="eyebrow">Cada intento es un paso</span><h1>${esc(activeProfile?.name || "Mi perfil")}<br>Tu progreso.</h1><p>Aquí quedan tus descubrimientos. Los puntos del juego no son una calificación escolar.</p></header><form id="result-filters" class="result-filters"><label>Periodo<select name="days"><option value="all" ${reportFilters.days==='all'?'selected':''}>Todo el historial</option><option value="7" ${reportFilters.days==='7'?'selected':''}>Últimos 7 días</option><option value="30" ${reportFilters.days==='30'?'selected':''}>Últimos 30 días</option></select></label><label>Contenido<select name="trail"><option value="all">Todos</option>${Object.entries(TRAILS).map(([id,t])=>`<option value="${id}" ${reportFilters.trail===id?'selected':''}>${t.short}</option>`).join('')}</select></label></form>${statsHTML(stats)}${dimensionsHTML(visibleSessions)}${fluencyHTML(visibleSessions)}${reasoningHTML(visibleSessions)}${
    !visibleSessions.length
      ? `<section class="panel empty"><div class="empty-art" aria-hidden="true">❋</div><h2>El camino empieza contigo</h2><p>Completa una aventura para ver tus primeros resultados. Si haces una pausa, podrás continuar después.</p><a class="primary" href="#explorar">Elegir un camino ↗</a></section>`
      : `<section class="panel"><h3>Tus caminos</h3>${Object.entries(TRAILS)
          .map(([id, t]) => {
            const s = summarize(visibleSessions.filter((s) => s.trail === id));
            return `<div class="session-row"><div><strong>${t.name}</strong><p>${s.items} ejercicios · ${s.hints} con ayuda</p></div><span class="pill">${levelName(state.adaptive[id]?.level || 1)}</span></div>`;
          })
          .join(
            "",
          )}</section><section class="panel"><h3>Últimas aventuras</h3>${visibleSessions
          .slice(-10)
          .reverse()
          .map((s) => {
            const r = summarize([s]);
            return `<div class="session-row"><div><strong>${TRAILS[s.trail].short}</strong><p>${fmtDate(s.completedAt)} · ${duration(r.activeMs)} de interacción estimada</p></div><span>${r.first}/8 al primer intento</span></div>`;
          })
          .join("")}</section>`
  }<div class="notice"><p><strong>Tu progreso te pertenece.</strong>Exporta una copia para tu docente o para conservarla. Borrar los datos del navegador o desinstalar puede eliminar este cuaderno.</p></div><div class="button-row"><button class="primary" id="export-report" ${state.sessions.length ? "" : "disabled"}>Guardar informe completo ↓</button><a class="secondary" href="#docentes">Ver informe detallado</a></div>`;
}
function levelTable(sessions) {
  let html = "";
  for (const [id, t] of Object.entries(TRAILS)) {
    for (let level = 1; level <= 4; level++) {
      const qs = sessions
        .filter((s) => s.trail === id)
        .flatMap((s) => s.questions)
        .filter((q) => q.level === level);
      if (!qs.length) continue;
      const first = qs.filter((q) => q.attempts[0] === q.answer).length;
      const noHelp = qs.filter(
        (q) => q.attempts[0] === q.answer && !q.hint,
      ).length;
      html += `<tr><td>${t.short}</td><td>${level}</td><td>${qs.length}</td><td>${first} (${Math.round((100 * first) / qs.length)}%)</td><td>${noHelp}</td><td>${qs.filter((q) => q.hint).length}</td></tr>`;
    }
  }
  return html
    ? `<div class="table-wrap"><table><caption class="sr-only">Resultados separados por contenido y dificultad</caption><thead><tr><th>Contenido</th><th>Nivel</th><th>Ejercicios</th><th>Primer intento</th><th>Sin ayuda</th><th>Con ayuda</th></tr></thead><tbody>${html}</tbody></table></div>`
    : "<p>Aún no hay aventuras completas. El informe aparecerá después de la primera.</p>";
}
function teacher() {
  return `<header class="page-head fade-in"><span class="eyebrow">Observar para acompañar</span><h1>Una mirada<br>a cada paso.</h1><p>Informes locales para orientar la práctica. Perfiles locales e informes por estudiante. La entrega automática requiere una invitación a un aula configurada; la investigación permanece desactivada.</p></header><section class="panel"><h3>Este dispositivo · ${profileCode()}</h3><p>Perfil activo: ${esc(activeProfile?.name || "")}. Cada estudiante tiene su propio acceso local. El código del informe no verifica la identidad ni crea una cuenta en línea.</p>${statsHTML(summarize(state.sessions))}${levelTable(state.sessions)}<div class="button-row"><button id="export-report" class="primary" ${state.sessions.length ? "" : "disabled"}>Exportar informe JSON ↓</button><button id="export-csv" class="secondary" ${state.sessions.length ? "" : "disabled"}>Detalle CSV ↓</button></div><p class="micro">${state.exportedAt ? `Última exportación: ${fmtDate(state.exportedAt)}. Exportar no confirma recepción por el docente.` : "Sin exportaciones registradas."} Solo se exportan aventuras completas.</p></section>${dimensionsHTML(state.sessions)}${fluencyHTML(state.sessions)}${reasoningHTML(state.sessions)}<section class="panel"><h3>Recibir informes de estudiantes</h3><p>El estudiante lleva su archivo JSON al centro educativo. Puedes abrir varios informes aquí; las sesiones repetidas se cuentan una sola vez.</p><div class="button-row"><label for="import-file" class="sr-only">Seleccionar informes JSON de Sendero</label><input id="import-file" type="file" accept=".json,application/json" multiple></div><p id="import-status" role="status" class="micro"></p>${state.teacher.length ? `<div class="table-wrap"><table><caption class="sr-only">Informes recibidos en este dispositivo</caption><thead><tr><th>Perfil</th><th>Contenido</th><th>Aventuras</th><th>Ejercicios</th><th>Última práctica</th></tr></thead><tbody>${teacherRows()}</tbody></table></div>${importedProfiles()}` : '<p class="micro">No hay informes recibidos. Se guardarán solamente en este dispositivo.</p>'}</section><section class="panel"><h3>Cómo interpretar los resultados</h3><details open><summary>Práctica adaptativa, no diagnóstico</summary><p>Hay cuatro niveles de cantidades. Tres respuestas consecutivas correctas al primer intento y sin ayuda suben un nivel; dos ejercicios consecutivos con error o ayuda lo reducen. En carrera se conserva el nivel durante ocho retos: siete u ocho aciertos iniciales sin ayuda suben un nivel para la siguiente; cuatro o menos lo reducen. Los rivales ajustan su ritmo a tiempos previos del mismo contenido y nivel. El tiempo no decide el nivel matemático. Son reglas iniciales transparentes, todavía sin validación educativa.</p></details><details><summary>Qué significan los indicadores</summary><p>Primer intento: la primera respuesta coincide con el resultado, haya o no ayuda. Sin ayuda: acierto al primer intento sin abrir la pista. Los errores anteriores a la corrección se conservan. El tiempo es una estimación de interacción: se pausa al salir, ocultar la app o tras 60 segundos sin interacción. No equivale a atención ni asistencia escolar.</p></details><details><summary>Comparaciones y evaluación formal</summary><p>Compara por contenido y dificultad; un porcentaje global puede cambiar porque cambiaron los ejercicios. Estas actividades domiciliarias no verifican identidad, supervisión ni ayuda externa. Complementan el criterio docente; no acreditan por sí solas aprendizaje, autoría o una calificación.</p></details><details><summary>Privacidad y conservación</summary><p>Puedes usar un alias; no necesitas nombre completo, correo ni escuela. Los códigos persistentes y las fechas pueden permitir vincular registros: estos informes no deben considerarse anónimos. Entrégalos solo al adulto autorizado. Solo se transmiten al servidor docente si se vincula expresamente una invitación. La investigación requerirá un procedimiento separado.</p></details></section>`;
}
function teacherRows() {
  const profiles = [...new Set(state.teacher.map((s) => s.profile))];
  return profiles
    .map((p) => {
      const ss = state.teacher.filter((s) => s.profile === p);
      return `<tr><td>${esc(p.slice(0, 8).toUpperCase())}</td><td>${[...new Set(ss.map((s) => TRAILS[s.trail].short))].join(", ")}</td><td>${ss.length}</td><td>${ss.length * 8}</td><td>${fmtDate(
        ss
          .map((s) => s.completedAt)
          .sort()
          .at(-1),
      )}</td></tr>`;
    })
    .join("");
}
function importedProfiles() {
  return [...new Set(state.teacher.map((s) => s.profile))]
    .map((profile) => {
      const sessions = state.teacher.filter((s) => s.profile === profile);
      return `<details><summary>Perfil ${esc(profile.slice(0, 8).toUpperCase())} · ${sessions.length} aventuras</summary>${dimensionsHTML(sessions)}${fluencyHTML(sessions)}${reasoningHTML(sessions)}${levelTable(sessions)}</details>`;
    })
    .join("");
}
function about() {
  return `<header class="page-head fade-in"><span class="eyebrow">Matemáticas que van contigo</span><h1>Un pequeño juego.<br>Muchos caminos.</h1><p>Sendero es un recurso gratuito de práctica matemática pensado para aprender a tu ritmo, incluso con conectividad intermitente.</p></header><section class="panel"><h3>Llévalo contigo</h3><p id="offline-explanation">${bundled ? "Esta edición incluye todos los recursos del juego y funciona sin conexión desde la instalación." : "Abre esta página con internet y espera el indicador «Lista sin conexión». Después podrás volver al mismo enlace sin internet en este navegador."}</p><div class="button-row"><button class="primary" id="install">Instalar o preparar ↗</button><button class="secondary" id="persist">Proteger almacenamiento local</button></div><p id="install-status" class="micro" role="status"></p><p>En Android: menú del navegador → Instalar aplicación o Añadir a pantalla de inicio. En Windows con Edge o Chrome: usa la opción de instalación del navegador.</p><p><a href="https://github.com/Krakaur/sendero-matematico/releases/latest" target="_blank" rel="noopener">Descargas para Android y Windows ↗</a></p></section><section class="panel"><h3>Para familias y docentes</h3><p>Si aún está aprendiendo a leer, una persona adulta puede leer el enunciado sin indicar la operación. Empieza con sumas y restas pequeñas; explora los grupos iguales cuando tenga sentido para el estudiante. Cada aventura contiene ocho ejercicios y se puede pausar. Las pistas forman parte del aprendizaje. Cada reto completado da puntos; el acierto inicial sin ayuda añade una bonificación.</p><p>El registro es local. Conserva una copia del informe antes de borrar datos o cambiar de equipo. La entrega al docente solo se activa al vincular una invitación. No tiene publicidad ni recopila datos para investigación.</p></section><section class="panel"><h3>Una invitación a colaborar</h3><p><a href="./docentes.html" target="_blank" rel="noopener">Guía breve para familias y docentes</a></p><p>Desarrollo: Dirk Hans Krakaur Floranes. Buscamos colaboración docente e investigadora para evaluar usabilidad, pertinencia y funcionamiento en contextos de conectividad intermitente.</p><p><a href="https://github.com/Krakaur/sendero-matematico" target="_blank" rel="noopener">Código, documentación y contacto en GitHub ↗</a></p><p class="micro">Versión ${VERSION} · Prototipo educativo. No es un instrumento diagnóstico validado. Ilustraciones originales en SVG. Licencia MIT.</p></section><section class="panel"><h3>Datos y alojamiento</h3><p>Las respuestas permanecen en este dispositivo salvo exportación manual o vinculación explícita con un servidor docente. GitHub Pages aloja la versión web y puede registrar datos técnicos de acceso, como la dirección IP. No incorporamos analítica ni rastreadores.</p><details><summary>Borrar los datos de este dispositivo</summary><p>Esta acción elimina aventuras, dificultad adaptativa e informes recibidos aquí. Guarda antes las copias que necesites.</p><div class="button-row"><button class="soft-button danger" id="reset-data">Borrar datos locales…</button></div></details></section>`;
}
function stopTimer(interrupted = false) {
  if (interrupted) interruptTiming(state.current?.questions[state.current.index]);
  if (timerStart !== null && state.current) {
    if(state.current.race)state.current.race.elapsedMs= Math.min(86400000,raceElapsed());
    const q = state.current.questions[state.current.index];
    if (performance.now() - timerStart >= 60000) interruptTiming(q);
    if (q && !q.done)
      q.activeMs += Math.min(
        60000,
        Math.max(0, performance.now() - timerStart),
      );
  }
  timerStart = null;
  clearTimeout(idleTimer);
}
function startTimer() {
  if(!activeProfile) return;
  if (document.hidden || !state.current || location.hash !== "#jugar") return;
  const q = state.current.questions[state.current.index];
  if (q?.done) return;
  if (timerStart === null) timerStart = performance.now();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    stopTimer(true);
    save();
  }, 60000);
}
function game() {
  const s = state.current;
  if (!s) {
    location.hash = "#explorar";
    return "";
  }
  const q = s.questions[s.index],
    t = TRAILS[s.trail];
  if (q.attempts.some((n) => n !== q.answer)) q.solutionShown = true;
  if(q.bankId)return reasoningGame(s,q);
  const answered = s.questions.slice(0, s.index + 1).filter(x => x.attempts.length);
  const initial = answered.filter(x => x.attempts[0] === x.answer).length;
  const f = fluency(answered.filter(x => x.level === q.level));
  const moved = raceMove?.id === s.id && raceMove.index === s.index;
  const from = moved ? s.index - 1 : s.index;
  raceMove = null;
  return `<section class="game-shell arcade"><div class="game-top"><div><strong>${s.race?"Regata relámpago":"Exploración del río"}</strong><small>${t.short} · Nivel ${q.level} · Web ${VERSION}</small></div><button id="pause" class="soft-button">Pausar</button></div>
    <div class="race-hud"><div><span>Recorrido</span><strong>${s.index}<small> / 8</small></strong></div><div><span>Acierto inicial</span><strong>${answered.length ? Math.round(100 * initial / answered.length) + '<small>%</small>' : '—'}</strong></div><div title="Aciertos iniciales por minuto de respuesta del nivel actual; sin pistas ni interrupciones"><span>Aciertos/min · N${q.level}</span><strong>${f.n ? f.rate.toFixed(1) : '—'}</strong></div></div>
    ${s.race?competitionHTML(s,esc,activeProfile.name):raceHTML(from, s.index)}
    <div class="question-card"><div class="question-meta"><span>RETO ${s.index + 1} / 8</span><span>${levelName(q.level)}</span></div><h1 class="equation ${q.solutionShown ? 'sr-only' : ''}" tabindex="-1" aria-label="${q.a} ${s.trail === 'suma' ? 'más' : s.trail === 'resta' ? 'menos' : 'por'} ${q.b}, ¿cuánto es?">${q.a} ${t.symbol} ${q.b} <span class="unknown">= ?</span></h1>${q.solutionShown ? solutionHTML(s, q) : ''}
    <div class="answers">${q.options.map(n => `<button class="answer ${q.solutionShown && n === q.answer ? 'correct' : ''} ${q.attempts.includes(n) ? 'wrong' : ''}" data-answer="${n}" ${q.attempts.includes(n) ? 'disabled' : ''} aria-label="Respuesta ${n}">${n}</button>`).join('')}</div>
    <div class="feedback ${q.solutionShown ? 'error' : ''}" role="status" id="feedback">${q.solutionShown ? 'Mira la solución y toca la respuesta destacada.' : moved ? '¡Bien! Tu siguiente reto ya está aquí.' : 'Toca una respuesta para avanzar.'}</div>${q.hint ? hintHTML(s, q) : ''}<div class="game-controls"><span>${s.race?`${raceStats(s).points} puntos · ${raceStats(s).streak} aciertos seguidos`:"Sin límite de tiempo"}</span><button id="hint" class="soft-button" ${q.hint ? 'disabled' : ''}>${q.hint ? 'Pista abierta' : '✧ Una pista'}</button></div></div>
    <p class="game-note">Rapidez del nivel actual: ${f.n} ${f.n === 1 ? 'ejercicio' : 'ejercicios'} medidos. Tu precisión y tus tiempos se guardan por separado.</p></section>`;
}
function raceHTML(from, to) {
  return `<div class="river-scene" role="img" aria-label="Luma ha recorrido ${to} de 8 tramos del río"><svg class="river-world" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="800" height="200" fill="#c5ece8"/><circle cx="674" cy="38" r="24" fill="#ffe7a2"/><path d="M0 87 100 15 198 89 327 26 442 90 578 20 680 85 800 10V170H0" fill="#92c3af"/><path d="M0 110Q130 60 260 104T520 94T800 78V200H0" fill="#4d957c"/><path d="M0 115Q170 97 370 116T800 108V200H0" fill="#68c8d6"/><path d="M0 126Q180 109 370 128T800 120" fill="none" stroke="#b5f1eb" stroke-width="5"/><g fill="#246b58"><path d="m32 109 22-70 23 70zm80-7 18-57 20 57zm428 4 22-67 21 67zm171 5 24-79 24 79z"/></g><g stroke="#b5f1eb" stroke-width="3" stroke-linecap="round"><path d="M25 164h45m75 16h42m53-34h66m81 27h42m96-30h61m29 40h38m75-20h59"/></g><path d="M0 194Q160 169 290 197T570 189T800 188V200H0" fill="#e6d5a1"/></svg><div class="river-track"><div class="race-boat" style="--from:${from / 8 * 100}%;--to:${to / 8 * 100}%"><svg viewBox="0 0 100 90" aria-hidden="true"><ellipse cx="49" cy="79" rx="43" ry="6" fill="#277e8c" opacity=".3"/><path d="m29 49 1-33 15 10 23-11 4 35-19 14z" fill="#dd8242"/><path d="m34 47 16-7 17 6-15 14z" fill="#fff1cf"/><path d="m33 25 7 6-6 4zm31 0-7 6 7 4z" fill="#663d36"/><circle cx="42" cy="39" r="3" fill="#193e3c"/><circle cx="61" cy="39" r="3" fill="#193e3c"/><path d="m47 48 5 5 5-5" fill="#193e3c"/><path d="m10 60 78-2-18 21H30z" fill="#e6ad46"/><path d="M15 63h65" stroke="#fff0a9" stroke-width="5"/><path d="m69 44 17 29" stroke="#614938" stroke-width="5" stroke-linecap="round"/></svg></div><div class="finish-flag" aria-hidden="true">⚑<span>META</span></div></div><div class="river-milestones" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i class="${i < to ? 'passed' : ''}"></i>`).join('')}</div></div>`;
}
function reasoningGame(s,q) {
 return `<section class="game-shell"><div class="game-top"><div><strong>El taller de las ideas</strong><small>Reto ${s.index+1} de 8 · ${levelName(q.level)}</small></div><button id="pause" class="soft-button">Pausar</button></div><div class="progress-track" role="progressbar" aria-label="Avance" aria-valuemin="0" aria-valuemax="8" aria-valuenow="${s.index}"><div class="progress-fill" style="width:${s.index/8*100}%"></div></div><div class="question-card reasoning"><div class="question-meta">${esc(q.dimension)}${q.pool==='transfer'?(q.novel?' · Reto nuevo':' · Repaso'):''}</div><h1 class="word-problem">${esc(q.prompt)}</h1>${q.solutionShown||q.done?solutionHTML(s,q):''}<div class="answers ${q.labels?'word-answers':''}">${q.options.map(n=>`<button class="answer ${(q.done||q.solutionShown)&&n===q.answer?'correct':''}" data-answer="${n}" ${q.done||q.attempts.includes(n)?'disabled':''}>${esc(optionText(q,n))}</button>`).join('')}</div><div id="feedback" class="feedback" role="status">${q.done?'¡Un paso más!':q.solutionShown?'Observa la solución y vuelve a intentarlo.':'Piensa qué te pregunta la situación.'}</div>${q.hint?hintHTML(s,q):''}<div class="game-controls">${q.done?`<button id="next" class="primary">${s.index===7?'Ver mis descubrimientos':'Siguiente paso'} →</button>`:`<button id="hint" class="soft-button" ${q.hint?'disabled':''}>Una pista</button>`}</div><p class="micro">Puedes dibujar en papel. Al terminar, explica cómo lo pensaste a alguien que te acompañe.</p></div></section>`;
}
function hintHTML(s, q) {
  if(q.bankId)return `<aside class="hint-box"><p>${esc(q.hintText)}</p></aside>`;
  const dots = (n, alt = false, cross = 0) =>
    Array.from(
      { length: n },
      (_, i) =>
        `<span class="bead ${alt ? "alt" : ""} ${i >= n - cross ? "crossed" : ""}"></span>`,
    ).join("");
  let text, visual;
  if (s.trail === "suma") {
    text = `Empieza en ${q.a} y avanza ${q.b} pasos. Junta los dos grupos.`;
    visual =
      q.a + q.b <= 40
        ? `<div class="bead-group">${dots(q.a)}</div><b>+</b><div class="bead-group">${dots(q.b, true)}</div>`
        : `<strong>${q.a} + ${Math.floor(q.b / 10) * 10} + ${q.b % 10}</strong>`;
  }
  if (s.trail === "resta") {
    text = `Empieza con ${q.a} y quita ${q.b}. Cuenta lo que queda.`;
    visual =
      q.a <= 30
        ? `<div class="bead-group" style="max-width:230px">${dots(q.a, false, q.b)}</div>`
        : `<strong>${q.a} − ${Math.floor(q.b / 10) * 10} − ${q.b % 10}</strong>`;
  }
  if (s.trail === "multi" || s.trail === "tablas20") {
    text = `Son ${q.a} grupos de ${q.b}. Puedes sumar ${q.b} varias veces.`;
    visual = Array.from(
      { length: q.a },
      () => `<div class="bead-group">${dots(q.b)}</div>`,
    ).join("");
  }
  return `<aside class="hint-box"><p>${text}</p><div class="bead-groups" aria-hidden="true">${visual}</div></aside>`;
}
function solutionHTML(s, q) {
  if(q.bankId)return `<section class="solution-callout" tabindex="-1" aria-label="Solución del ejercicio"><strong>¡${esc(q.solution)}!</strong><p>${esc(q.explanation)}</p><p>${q.done ? "Ya puedes continuar." : "Elige la respuesta para practicarla."}</p></section>`;
  const explanation =
    s.trail === "suma"
      ? `Al juntar ${q.a} y ${q.b}, obtienes ${q.answer}.`
      : s.trail === "resta"
        ? `Si a ${q.a} le quitas ${q.b}, quedan ${q.answer}.`
        : `${q.a} grupos de ${q.b} contienen ${q.answer} en total.`;
  return `<section class="solution-callout" tabindex="-1" aria-label="Solución del ejercicio"><span>¡Descubramos la respuesta!</span><strong>¡${q.a} ${TRAILS[s.trail].symbol} ${q.b} = ${q.answer}!</strong><p>${explanation}</p><p class="solution-action">${q.done ? "Ya puedes continuar." : `Ahora toca el ${q.answer} para comprobarlo.`}</p></section>`;
}
function finished() {
  const s = state.sessions.at(-1);
  if (!s) return home();
  const r = summarize([s]);
  return `<section class="celebration fade-in"><span class="eyebrow">Aventura completada</span>${s.race?competitionHTML(s,esc,activeProfile.name):s.trail !== "razonar" ? raceHTML(7,8) : '<div class="medal" aria-hidden="true">❋</div>'}<h1>${s.trail !== "razonar" ? "¡Llegaste a la meta!" : "¡Tu sendero florece!"}</h1><p>${esc(activeProfile?.name||"Estudiante")}, completaste ocho ejercicios. Aquí están tus resultados.</p>${s.race?`<div class="race-award"><strong>¡${raceStats(s).rank}.º lugar · ${raceStats(s).points} puntos!</strong><p>${raceStats(s).best} aciertos seguidos como mejor racha. Tu próxima carrera empieza en nivel ${state.adaptive[s.trail]?.level||1}.</p><small>Puntos de juego: 10 por reto completado + 5 por acierto inicial sin ayuda. Nunca pierdes puntos.</small></div>`:""}${statsHTML(r)}${s.trail !== "razonar" ? fluencyHTML([s]) : ""}<div class="panel"><h3>Una semilla más para tu camino</h3><p>Llevas ${state.sessions.length} ${state.sessions.length === 1 ? "aventura completa" : "aventuras completas"}. Las pistas y los nuevos intentos también te ayudan a aprender.</p></div><div class="button-row"><button class="primary" id="play-again" data-trail="${s.trail}">Otra aventura ↗</button><a class="secondary" href="#progreso">Ver mi progreso</a></div><a class="micro" href="#explorar">Explorar otro camino</a></section>`;
}
function render(persistState = true) {
  globalThis.speechSynthesis?.cancel();
  stopTimer();
  // Older versions saved a solved arithmetic item before the extra Next tap.
  // Adaptation already happened at answer time; only advance, exactly once.
  if (location.hash === '#jugar' && state.current) {
    const pending = state.current.questions[state.current.index];
    if (pending.done && !pending.bankId) { next(); return; }
  }
  if (persistState) save();
  const requestedRoute = location.hash.slice(1) || "explorar";
  const route = activeProfile || requestedRoute === 'acerca' ? requestedRoute : 'perfiles';
  $('#profile-switch').textContent = activeProfile ? activeProfile.name + ' · Cambiar' : 'Entrar / Crear perfil';
  $('#profile-switch').setAttribute('aria-label', activeProfile ? 'Perfil activo: '+activeProfile.name+'. Cambiar perfil' : 'Entrar o crear perfil');
  document.body.classList.toggle('arcade-playing', route === 'jugar' && !!state.current && state.current.trail !== 'razonar');
  main.innerHTML = (
    {
      perfiles: profilesScreen,
      explorar: home,
      progreso: progress,
      docentes: teacher,
      acerca: about,
      jugar: game,
      logro: finished,
    }[route] || home
  )();
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const active = a.dataset.nav === route;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  main
    .querySelector("#quick-start")
    ?.addEventListener("click", () =>
      state.current ? goGame() : begin("suma"),
    );
  main
    .querySelectorAll("[data-trail]")
    .forEach((b) => b.addEventListener("click", () => begin(b.dataset.trail)));
  main.querySelector("#pause")?.addEventListener("click", () => {
    stopTimer(true);
    save();
    location.hash = "#explorar";
  });
  main
    .querySelectorAll("[data-answer]")
    .forEach((b) =>
      b.addEventListener("click", (e) => { if(e.detail < 2) answer(Number(b.dataset.answer)); }),
    );
  main.querySelector("#hint")?.addEventListener("click", () => {
    stopTimer();
    state.current.questions[state.current.index].hint = true;
    save();
    render();
    announce("Pista abierta. " + main.querySelector(".hint-box p").textContent);
  });
  main.querySelector("#next")?.addEventListener("click", next);
  main.querySelector("#export-report")?.addEventListener("click", exportReport);
  main.querySelector("#export-csv")?.addEventListener("click", exportCSV);
  main.querySelector("#import-file")?.addEventListener("change", importReports);
  main.querySelector("#install")?.addEventListener("click", install);
  main.querySelector("#persist")?.addEventListener("click", persist);
  main.querySelector("#reset-data")?.addEventListener("click", () => {
    if (
      confirm(
        "¿Borrar las aventuras e informes de este perfil? Los otros perfiles se conservarán. Esta acción no se puede deshacer.",
      )
    ) {
      state = {...fresh(),profile:activeProfile.id};
      save();
      render();
    }
  });
  if(route==='docentes' && activeProfile) { main.insertAdjacentHTML('afterbegin',classroomHTML());bindClassroom(); main.firstElementChild.querySelectorAll('[data-trail]').forEach(b=>b.addEventListener('click',()=>begin(b.dataset.trail))); }
  if(route==='jugar' && state.current) {
    main.querySelector('.game-controls')?.insertAdjacentHTML('beforeend','<button id="read-problem" class="soft-button">Escuchar</button>');
    $('#read-problem')?.addEventListener('click',()=>{
      const q=state.current.questions[state.current.index];stopTimer(true);save();
      const text=q.bankId?q.prompt:`${q.a} ${state.current.trail==='suma'?'más':state.current.trail==='resta'?'menos':'por'} ${q.b}. ¿Cuánto es?`;
      if(!narrateLocally(text,()=>startTimer())) {announce('No hay una voz española sin conexión instalada. Pide a alguien que lea el ejercicio.');$('#feedback').textContent='No hay voz española local disponible en este dispositivo.';startTimer();}
    });
  }
  $('#result-filters')?.addEventListener('change',e=>{const form=e.currentTarget;reportFilters.days=form.elements.days.value;reportFilters.trail=form.elements.trail.value;render(false);});
  main.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.playMode=b.dataset.mode;save();render(false);}));
  $('#sound').setAttribute('aria-pressed',String(state.sound));
  $('#sound').setAttribute('aria-label',state.sound?'Desactivar sonidos':'Activar sonidos');
  bindProfiles();
  startTimer();
}
function goGame() {
  if (location.hash === "#jugar") render();
  else location.hash = "#jugar";
}
function begin(trail) {
  if(!activeProfile){location.hash="#perfiles";return;}
  if (state.current) {
    if (state.current.trail === trail) {
      goGame();
      return;
    }
    if (
      !confirm(
        "Tienes una aventura en pausa. ¿Dejarla y empezar otro camino? Los intentos de esa aventura incompleta se eliminarán.",
      )
    )
      return;
  }
  const a = state.adaptive[trail] || { level: 1, streak: 0, support: 0 };
  state.current = trail === "razonar" ? {id:uid(),profile:state.profile,trail,level:a.level,version:VERSION,startedAt:new Date().toISOString(),completedAt:null,index:0,questions:[bankQuestion(state,a.level)]} : newSession(trail, a.level, state.profile);
  if(trail !== "razonar")state.current.questions[0]=practiceQuestion(state,trail,a.level);
  state.current.adaptation = { ...a };
  if(trail!=="razonar"&&(state.playMode||"race")==="race")state.current.race=newRace(state.sessions,trail,a.level);
  save();
  goGame();
}
function answer(n) {
  const s = state.current;
  if (!s) return;
  const q = s.questions[s.index];
  if (q.done || q.attempts.includes(n) || !q.options.includes(n)) return;
  stopTimer();
  recordAttempt(q, n);
  if (n === q.answer) {
    q.done = true;
    if(!s.race)s.adaptation = adapt(s.adaptation, q);
    tone(true);
  } else tone(false);
  if (q.done && !q.bankId) {
    announce(`¡Correcto! ${q.a} ${TRAILS[s.trail].symbol} ${q.b} es ${q.answer}.`);
    next();
    return;
  }
  save();
  render();
  if (q.done) {
    $("#next")?.focus();
    announce(
      q.bankId ? `Correcto. ${q.solution}. ${q.explanation}` : `Correcto. ${q.a} ${TRAILS[s.trail].symbol} ${q.b} es ${q.answer}.`,
    );
  } else {
    $(".solution-callout")?.focus();
    announce(
      q.bankId ? `Mira la solución: ${q.solution}. ${q.explanation}` : `Mira la solución: ${q.a} ${TRAILS[s.trail].symbol} ${q.b} es ${q.answer}. Ahora toca ${q.answer}.`,
    );
  }
}
function next() {
  const s = state.current;
  if (!s || !s.questions[s.index].done) return;
  rememberPractice(state,s.trail,s.questions[s.index]);
  if (s.index === 7) {
    s.completedAt = new Date().toISOString();
    state.sessions.push(s);
    if(s.race)s.adaptation={level:raceLevel(s),streak:0,support:0};
    state.adaptive[s.trail] = { ...s.adaptation };
    state.current = null;
    save();
    syncClassroom();
    location.hash = "#logro";
    tone(true);
    return;
  }
  s.index++;
  if (s.trail !== 'razonar') raceMove = {id:s.id, index:s.index};
  s.questions[s.index] = s.trail === "razonar" ? bankQuestion(state,s.adaptation.level,s.index === 7) : practiceQuestion(state,s.trail, s.race?s.race.level:s.adaptation.level);
  save();
  render();
  main.querySelector(".equation, .word-problem")?.setAttribute("tabindex", "-1");
  main.querySelector(".equation, .word-problem")?.focus({preventScroll:true});
}
function download(name, text, type) {
  if (android) {
    window.SenderoAndroid.saveFile(name, text, type);
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function exportReport() {
  if (!state.sessions.length) return;
  const at = new Date().toISOString();
  download(
    `sendero-${profileCode()}-${at.slice(0, 10)}.json`,
    JSON.stringify(
      {
        schema: SCHEMA,
        version: VERSION,
        profile: state.profile,
        exportedAt: at,
        sessions: state.sessions,
      },
      null,
      2,
    ),
    "application/json",
  );
  if (!android) state.exportedAt = at;
  save();
  render();
  announce(
    "Informe preparado para guardar. Entrégalo a tu docente por un medio autorizado.",
  );
}
function exportCSV() {
  const rows = [
    [
      "perfil",
      "sesion",
      "contenido",
      "nivel",
      "inicio_declarado_dispositivo",
      "fin_declarado_dispositivo",
      "a",
      "b",
      "respuesta_correcta",
      "intentos",
      "primer_intento_correcto",
      "pista",
      "solucion_mostrada",
      "interaccion_ms_estimados",
      "version", "actividad", "banco", "dimension", "reserva", "nueva", "enunciado", "explicacion", "respuesta_texto", "protocolo_tiempo", "primera_respuesta_ms", "tiempo_interrumpido",
    ],
  ];
  for (const s of state.sessions)
    for (const q of s.questions)
      rows.push([
        s.profile,
        s.id,
        s.trail,
        q.level,
        s.startedAt,
        s.completedAt,
        q.a,
        q.b,
        q.answer,
        q.attempts.join("|"),
        q.attempts[0] === q.answer,
        q.hint,
        q.solutionShown ?? "no registrado",
        Math.round(q.activeMs),
        s.version, q.bankId??"", q.bankVersion??"", q.dimension??"", q.pool??"", q.novel??"", q.prompt??"", q.explanation??"", optionText(q,q.answer), q.timingProtocol??"", q.firstResponseMs??"", q.timingInterrupted??"",
      ]);
  download(
    `sendero-${profileCode()}.csv`,
    "\uFEFF" +
      rows
        .map((row) =>
          row.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
        )
        .join("\r\n"),
    "text/csv;charset=utf-8",
  );
}
async function importReports(event) {
  let added = 0,
    errors = [];
  for (const file of event.target.files) {
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("El archivo supera 10 MB.");
      const report = validateReport(JSON.parse(await file.text()));
      const result = mergeSessions(state.teacher, report.sessions);
      state.teacher = result.sessions;
      added += result.added;
    } catch (e) {
      errors.push(`${file.name}: ${e.message}`);
    }
  }
  save();
  render();
  $("#import-status").textContent =
    `${added} sesiones nuevas incorporadas. ${errors.join(" ")}`;
}
function tone(correct) {
  if (!state.sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    const osc = audioContext.createOscillator(),
      g = audioContext.createGain();
    osc.connect(g);
    g.connect(audioContext.destination);
    osc.type = "sine";
    osc.frequency.value = correct ? 660 : 330;
    g.gain.setValueAtTime(0.06, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);
  } catch {}
}
$("#sound").setAttribute("aria-pressed", String(state.sound));
$("#sound").setAttribute(
  "aria-label",
  state.sound ? "Desactivar sonidos" : "Activar sonidos",
);
$("#sound").addEventListener("click", () => {
  state.sound = !state.sound;
  $("#sound").setAttribute("aria-pressed", String(state.sound));
  $("#sound").setAttribute(
    "aria-label",
    state.sound ? "Desactivar sonidos" : "Activar sonidos",
  );
  save();
  tone(true);
});
window.addEventListener("hashchange", () => {
  if(location.hash !== "#jugar") stopTimer(true);
  render();
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopTimer(true);
    save();
  } else startTimer();
});
window.addEventListener("pagehide", () => {
  stopTimer(true);
  save();
});
document.addEventListener("pointerdown", () => {
  if (state.current && location.hash === "#jugar") startTimer();
});
document.addEventListener("keydown", () => {
  if (state.current && location.hash === "#jugar") startTimer();
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
});
async function install() {
  if (installPrompt) {
    await installPrompt.prompt();
    installPrompt = null;
  } else
    $("#install-status").textContent = bundled
      ? `Ya estás usando la edición de ${android ? "Android" : "Windows"}.`
      : "Usa el menú de Chrome o Edge → Instalar aplicación. Si no aparece, espera «Lista sin conexión» y vuelve a intentarlo.";
}
async function persist() {
  if (bundled) {
    $("#install-status").textContent =
      "Esta aplicación guarda el progreso en sus datos locales. Exporta informes antes de desinstalarla o borrar sus datos.";
    return;
  }
  try {
    const granted = await navigator.storage?.persist?.();
    $("#install-status").textContent = granted
      ? "El navegador concedió almacenamiento persistente. Conserva también copias del informe."
      : "El navegador no concedió persistencia. El juego puede funcionar, pero conserva una copia de tus informes.";
  } catch {
    $("#install-status").textContent =
      "No se pudo solicitar almacenamiento persistente. Conserva copias de tus informes.";
  }
}
async function offline() {
  const badge = $("#offline-badge");
  if (bundled) {
    badge.textContent = "Incluida sin conexión";
    return;
  }
  if (!("serviceWorker" in navigator)) {
    badge.textContent = "Sin modo sin conexión";
    return;
  }
  const cached = async () => {
    if (!("caches" in window)) return false;
    const cache = await caches.open(`sendero-${VERSION}-regatta-final`);
    const files = [
      "./index.html",
      "./app.js",
      "./core.js",
      "./style.css",
      "./landscape.svg",
      "./icon.svg",
      "./fluency.js",
      "./bank.js",
      "./bank-data.js",
      "./practice.js",
    ];
    return (
      await Promise.all(
        files.map((file) => cache.match(new URL(file, location.href))),
      )
    ).every(Boolean);
  };
  const checkVersion = () => navigator.serviceWorker.controller?.postMessage({type:'GET_VERSION'});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    checkVersion();
    cached().then(ready => { if(ready) badge.textContent = 'Lista sin conexión'; });
  });
  navigator.serviceWorker.addEventListener('message', event => {
    if(event.data?.type === 'SENDER_VERSION' && event.data.version !== VERSION)
      $('#update-banner').hidden = false;
  });
  $('#apply-update').addEventListener('click', () => {
    stopTimer(true);
    save();
    if(storageOK) location.reload();
  });
  try {
    if (await cached()) badge.textContent = "Lista sin conexión";
    const registration = await navigator.serviceWorker.register("./sw.js", {updateViaCache:'none'});
    registration.update().catch(() => {});
    await navigator.serviceWorker.ready;
    checkVersion();
    badge.textContent = (await cached())
      ? "Lista sin conexión"
      : "Preparación pendiente";
  } catch {
    badge.textContent = (await cached())
      ? "Lista sin conexión"
      : "Preparación pendiente";
  }
}
window.addEventListener("storage", (event) => {
  if (!KEY || event.key !== KEY || !event.newValue) return;
  try {
    stopTimer();
    const incoming = JSON.parse(event.newValue);
    if (
      incoming.profile &&
      Array.isArray(incoming.sessions) &&
      Array.isArray(incoming.teacher)
    ) {
      state = incoming;
      render(false);
      announce("El progreso se actualizó desde otra pestaña.");
    }
  } catch {
    storageWarning();
  }
});
render();
offline();
syncClassroom();

if (android) {
  document.documentElement.classList.add("android-app");
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='https://github.com/']");
    if (!link) return;
    event.preventDefault();
    window.SenderoAndroid.openExternal(link.href);
  });
  window.addEventListener("sendero-export-result", (event) => {
    if (event.detail === true) {
      state.exportedAt = new Date().toISOString();
      save();
      render(false);
      announce(
        "Archivo guardado. Exportar no confirma recepción por el docente.",
      );
    }
  });
  window.addEventListener("sendero-pause", () => {
    stopTimer();
    save();
  });
  window.SenderoAndroid.ready();
}
