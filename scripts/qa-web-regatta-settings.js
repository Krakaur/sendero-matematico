async (page) => {
  const output = 'output/playwright/ciclo-web-20261013/';
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  await page.getByRole('button',{name:'Otra aventura ↗',exact:true}).click();
  await page.locator('.competition').waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.locator('.race-settings summary').click();
  await page.locator('#effect-volume').fill('35');
  await page.locator('#river-volume').fill('10');
  await page.getByRole('button',{name:'Reducir movimiento',exact:true}).click();
  if (!(await read()).reducedMotion) throw Error('Reduced motion not stored');
  const stopped = await page.locator('.boat-bob').first().evaluate(el => getComputedStyle(el).animationName === 'none');
  if(!stopped) throw Error('Reduced motion does not stop animation');
  await page.getByRole('button',{name:'Desactivar sonidos',exact:true}).click();
  const before = await read();
  await page.reload();
  await page.locator('.answers').waitFor();
  await page.getByText('Lista sin conexión',{exact:true}).waitFor();
  const restored = await read();
  if(restored.sound!==false || restored.effectsVolume!==.35 || restored.riverVolume!==.1 || !restored.reducedMotion) throw Error('Sensory preferences did not survive reload');
  if(restored.current.id!==before.current.id) throw Error('Pending race lost on reload');
  const screen = await page.evaluate(() => ({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('.answer')].map(b=>({x:b.getBoundingClientRect().x,width:b.getBoundingClientRect().width,top:b.getBoundingClientRect().top,bottom:b.getBoundingClientRect().bottom}))}));
  if(screen.scrollWidth>screen.width || screen.buttons.some(b=>b.x<0 || b.x+b.width>screen.width)) throw Error('Horizontal overflow on mobile');
  await page.screenshot({path:output+'candidate-mobile.png',fullPage:true});
  await page.context().setOffline(true);
  try {
    await page.reload(); await page.locator('.answers').waitFor();
    if((await read()).current.id!==before.current.id) throw Error('Offline race lost');
    const q=(await read()).current.questions[0];
    await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();
    if((await read()).current.index!==1) throw Error('Cannot progress offline');
    await page.screenshot({path:output+'candidate-offline.png',fullPage:true});
  } finally { await page.context().setOffline(false); }
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  const paused=(await read()).current.race.elapsedMs;
  await page.waitForTimeout(1000);
  await page.getByRole('button',{name:/Continuar mi aventura/}).click();
  const resumed=(await read()).current.race.elapsedMs;
  if(Math.abs(resumed-paused)>100) throw Error('Paused time counted as race time');
  return {mobile:screen,offlineReloadAndAnswer:true,profileAndPendingRace:true,volumePersistence:true,mutePersistence:true,reducedMotion:true,pauseTimeExcluded:true};
}
