async (page) => {
  await page.getByText('Lista sin conexión', {exact:true}).waitFor();
  await page.reload();
  await page.getByRole('button', {name:'Comenzar aventura', exact:false}).click();
  const q = await page.evaluate(() => JSON.parse(localStorage.getItem('sendero.state.v1')).current.questions[0]);
  await page.getByRole('button', {name:`Respuesta ${q.answer}`, exact:true}).click();
  await page.locator('#next').waitFor();
  return await page.evaluate(async () => {
    const s = JSON.parse(localStorage.getItem('sendero.state.v1'));
    sessionStorage.setItem('upgrade-before', JSON.stringify(s));
    return {version:(await import('/core.js')).VERSION, oldNext:!!document.querySelector('#next'), index:s.current.index, done:s.current.questions[0].done, caches:await caches.keys()};
  });
}
