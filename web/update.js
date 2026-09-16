// This entry point also works when an old app tab cannot receive update notices.
// It never reads, rewrites or clears the learner's stored data.
const status = document.querySelector('#update-status');
const retry = document.querySelector('#retry');
retry.addEventListener('click', () => location.reload());
let waitingForVersion = false;
const deadline = setTimeout(() => {
  waitingForVersion = false;
  status.textContent = 'No se completó la actualización. Comprueba la conexión y vuelve a intentarlo. Tu progreso no se ha borrado.';
  retry.hidden = false;
}, 25000);
async function update() {
  if(!('serviceWorker' in navigator)) throw Error('Service workers unavailable');
  navigator.serviceWorker.addEventListener('message', event => {
    if(waitingForVersion && event.data?.type === 'SENDER_VERSION') {
      clearTimeout(deadline);
      status.textContent = `Versión ${event.data.version} preparada. Abriendo el juego…`;
      location.replace('./#jugar');
    }
  });
  const registration = await navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'});
  await registration.update();
  const installing = registration.installing || registration.waiting;
  if(installing && installing.state !== 'activated') await new Promise((resolve, reject) => {
    installing.addEventListener('statechange', () => {
      if(installing.state === 'activated') resolve();
      if(installing.state === 'redundant') reject(Error('Installation failed'));
    });
  });
  await navigator.serviceWorker.ready;
  waitingForVersion = true;
  registration.active?.postMessage({type:'GET_VERSION'});
}
update().catch(() => {
  clearTimeout(deadline);
  status.textContent = 'No se pudo descargar la actualización. Comprueba la conexión y reintenta; tus datos siguen guardados.';
  retry.hidden = false;
});
