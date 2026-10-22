export const NOTICE_VERSION = '2026-10-21.1';
export const NOTICE_KEY = 'sendero.research-notice';
export function noticeAcknowledged(storage) {
  try { const value=JSON.parse(storage.getItem(NOTICE_KEY)); return value?.version===NOTICE_VERSION && value?.acknowledgement==='information_acknowledged'; }
  catch { return false; }
}
export function acknowledgeNotice(storage, at=new Date().toISOString()) {
  try { storage.setItem(NOTICE_KEY,JSON.stringify({version:NOTICE_VERSION,acknowledgement:'information_acknowledged',at})); return true; }
  catch { return false; }
}
export function mountResearchNotice(doc=document, getStorage=()=>localStorage) {
  if(doc.getElementById('research-notice'))return;
  const dialog=doc.createElement('dialog');
  dialog.id='research-notice';dialog.className='research-notice';
  dialog.setAttribute('aria-labelledby','research-notice-title');
  dialog.setAttribute('aria-describedby','research-notice-description');
  dialog.innerHTML=`<p class="research-eyebrow">Para estudiantes, familias y docentes</p><h2 id="research-notice-title">Un proyecto educativo en desarrollo</h2><div id="research-notice-description"><p><strong>Puedes jugar. Usar Sendero no te inscribe en una investigación.</strong></p><p>Sendero se desarrolla para apoyar el aprendizaje y futuros estudios educativos. Esta versión no activa la participación en un estudio ni envía datos a un estudio por cerrar este aviso.</p><p>Tu progreso usa el almacenamiento de este dispositivo. Si vinculas un aula, sus resultados se comparten con tu docente. Los códigos de perfil y datos escolares pueden permitir reconocer a un estudiante: no son datos anónimos.</p><p>Responsable: <strong>Dr. Hans Krakaur Floranes</strong>. El proyecto todavía no está adscrito a una institución.</p></div><p><a href="./terminos.html" target="_blank" rel="noopener">Leer condiciones, privacidad e investigación</a></p><div class="research-actions"><button type="button" class="primary" data-notice-close>Entendido, continuar</button></div><p class="research-note">Este botón sólo cierra la información; no otorga consentimiento para investigación. El recordatorio se guarda por navegador, no por estudiante.</p>`;
  doc.body.append(dialog);
  let storage;
  try{storage=getStorage();}catch{}
  const open=()=>{if(!dialog.open)dialog.showModal();};
  doc.querySelectorAll('[data-research-notice]').forEach(button=>button.addEventListener('click',open));
  dialog.querySelector('[data-notice-close]').addEventListener('click',()=>{
    const persisted=acknowledgeNotice(storage);
    dialog.close();
    const status=doc.querySelector('[data-notice-status]');
    if(status)status.textContent=persisted?'Aviso cerrado en este navegador. Puedes volver a abrirlo.':'El navegador no guardó el recordatorio. El aviso volverá a aparecer; puedes seguir jugando.';
  });
  // Escape closes only this presentation; without acknowledgement it reappears on reload.
  if(!noticeAcknowledged(storage))open();
}
if(typeof document!=='undefined')mountResearchNotice();
