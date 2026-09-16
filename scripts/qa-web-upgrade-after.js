async (page) => {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const changed = new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once:true}));
    await registration.update();
    await changed;
  });
  await page.reload();
  await page.getByText('La carrera del río', {exact:true}).waitFor();
  const verify = async () => page.evaluate(async () => {
    const before = JSON.parse(sessionStorage.getItem('upgrade-before'));
    const after = JSON.parse(localStorage.getItem('sendero.state.v1'));
    if(before.profile !== after.profile || before.current.id !== after.current.id) throw Error('Identity changed');
    if(after.current.index !== 1 || document.querySelector('#next')) throw Error('Old next not migrated exactly once');
    if(JSON.stringify(before.current.questions[0]) !== JSON.stringify(after.current.questions[0])) throw Error('Historic answer modified');
    if(JSON.stringify(before.current.adaptation) !== JSON.stringify(after.current.adaptation)) throw Error('Adaptation counted twice');
    return {version:(await import('/core.js')).VERSION, index:after.current.index, profilePreserved:true, legacyAnswerUnchanged:true, adaptationUnchanged:true, caches:await caches.keys()};
  });
  const first = await verify();
  await page.context().setOffline(true);
  await page.reload();
  const offline = await verify();
  await page.context().setOffline(false);
  return {first, offline, migrationExactlyOnce:true};
}
