async (page) => {
  const candidate = !page.url().includes('baseline-web');
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const output = 'output/playwright/ciclo-web-20261013/';
  const prefix = candidate ? 'candidate' : 'baseline';
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('sendero.profile.' + sessionStorage.getItem('sendero.active'))));
  await page.getByRole('button', {name: /MULTIPLICACIÓN La huerta/}).click();
  await page.locator('.competition').waitFor();
  await page.getByRole('button', {name:'Activar sonidos',exact:true}).click();
  await page.screenshot({path:output+prefix+'-start.png',fullPage:true});
  const checks = {candidate, viewport:page.viewportSize(), scenePersisted:[], animationPersisted:[], responseMs:[]};
  const handle = await page.locator('.competition').elementHandle();
  if (candidate) await page.evaluate(() => { window.__raceAnimation = document.querySelector('.boat-bob').getAnimations()[0]; });
  const startLevel = (await read()).current.race.level;
  for (let index=0; index<8; index++) {
    const session = (await read()).current;
    if (session.index !== index) throw Error('Automatic progression lost');
    const q = session.questions[index];
    if (q.level !== startLevel) throw Error('Level changed during a race');
    // Deliberate pauses model reading time; these timings are synthetic, not child data.
    await page.waitForTimeout(1500);
    if (index===2) {
      await page.getByRole('button',{name:'Respuesta '+q.options.find(x=>x!==q.answer),exact:true}).click();
      await page.locator('.solution-callout').waitFor();
      await page.screenshot({path:output+prefix+'-error.png',fullPage:true});
      if (candidate && await page.evaluate(() => window.__raceAnimation !== document.querySelector('.boat-bob').getAnimations()[0])) throw Error('Error response restarted scene animation');
      await page.waitForTimeout(1400);
    }
    const started = Date.now();
    await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();
    checks.responseMs.push(Date.now()-started); // Driver round trip, NOT physical/input latency.
    if (index<7 && candidate) {
      const same = await handle.evaluate(element=>element===document.querySelector('.competition'));
      const sameAnimation = await page.evaluate(() => window.__raceAnimation===document.querySelector('.boat-bob').getAnimations()[0]);
      checks.scenePersisted.push(same); checks.animationPersisted.push(sameAnimation);
      if (!same || !sameAnimation) throw Error('Scene or animation recreated between questions');
    }
  }
  await page.getByRole('heading',{name:'¡Llegaste a la meta!',exact:true}).waitFor();
  await page.screenshot({path:output+prefix+'-finish.png',fullPage:true});
  const completed = (await read()).sessions.at(-1);
  if(completed.questions.length!==8 || completed.questions[2].attempts.length!==2) throw Error('Attempts or completion lost');
  if(completed.questions[2].attempts[0]===completed.questions[2].answer) throw Error('Initial mistake lost');
  checks.completed = true; checks.fixedLevel = true; checks.errorAndRecovery = true;
  checks.schoolMetrics = {firstAttemptCorrect:completed.questions.filter(q=>q.attempts[0]===q.answer).length, questions:8};
  checks.errors = errors;
  if (errors.length) throw Error(errors.join('\n'));
  return checks;
}
