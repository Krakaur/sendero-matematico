async (page) => {
  // Run qa-web-regatta-prepare.js first: mode changes apply to the next session.
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  await page.setViewportSize({width:1280,height:800});
  await page.goto(page.url().split('#')[0]+'#explorar');
  await page.locator('[data-mode="calm"]').click();
  await page.locator('[data-trail="multi"]').first().click();
  await page.locator('.answers').waitFor();
  if((await read()).current.race || await page.locator('.regatta').count()) throw Error('Calm mode contains a race');
  for(let i=0;i<8;i++) {
    const q=(await read()).current.questions[i];
    await page.locator('[data-answer="'+q.answer+'"]').click();
  }
  await page.getByRole('heading',{name:'¡Llegaste a la meta!',exact:true}).waitFor();
  await page.goto(page.url().split('#')[0]+'#explorar');
  await page.locator('[data-trail="razonar"]').first().click();
  await page.locator('.word-problem').waitFor();
  if((await read()).current.race || await page.locator('.regatta').count()) throw Error('Reasoning mode contains a race');
  const q=(await read()).current.questions[0];
  await page.locator('[data-answer="'+q.answer+'"]').click();
  await page.locator('#next').click();
  if((await read()).current.index!==1) throw Error('Reasoning mode did not advance');
  if(errors.length) throw Error(errors.join('\n'));
  return {calmCompleted:true,reasoningAdvanced:true,noCompetitionInOtherModes:true,errors};
}
