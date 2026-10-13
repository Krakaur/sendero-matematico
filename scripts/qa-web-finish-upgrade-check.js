// Continue the isolated browser prepared before deployment.
async(page)=>{
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://krakaur.github.io/sendero-matematico/actualizar.html');
  await page.waitForURL('**/#jugar');
  await page.locator('.solution-callout').waitFor();
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  const before=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('sendero.qa.upgradeExpected'))),after=await read();
  if(before.sessions.length<1)throw Error('Upgrade fixture needs nonempty completed history');
  const version=await page.evaluate(async()=>(await import('./core.js')).VERSION);
  if(version!=='0.5.1')throw Error('Expected public web 0.5.1');
  for(const key of ['profile','sessions','adaptive'])if(JSON.stringify(after[key])!==JSON.stringify(before[key]))throw Error('Changed stored '+key);
  if(after.current.id!==before.current.id||after.current.index!==1)throw Error('Pending race lost');
  for(const key of ['protocol','seed','cadence','finishMs','level','targetMs'])if(JSON.stringify(after.current.race[key])!==JSON.stringify(before.current.race[key]))throw Error('Changed saved race '+key);
  for(let i=0;i<2;i++){
    if(JSON.stringify(after.current.questions[i].attempts)!==JSON.stringify(before.current.questions[i].attempts))throw Error('Attempt history changed');
    if(after.current.questions[i].firstResponseMs!==before.current.questions[i].firstResponseMs)throw Error('First-response timing changed');
  }
  for(let i=1;i<8;i++){const q=(await read()).current.questions[i];await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();}
  await page.locator('#finish-title').waitFor();
  if((await read()).sessions.length!==before.sessions.length+1)throw Error('Completion count mismatch');
  await page.waitForTimeout(900);
  await page.screenshot({path:'output/playwright/ciclo-web-3-20261013/public-0.5.1.png',fullPage:true});
  await page.locator('#play-again').click();
  const current=(await read()).current;
  if(current.version!=='0.5.1'||current.id===before.current.id||current.index!==0)throw Error('Replay did not create a new race');
  await page.getByText('Lista sin conexión',{exact:true}).waitFor();
  await page.context().setOffline(true);
  try{
    await page.reload();await page.locator('.regatta').waitFor();
    if((await read()).current.race.seed!==current.race.seed)throw Error('Seed lost offline');
    const q=(await read()).current.questions[0];
    await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();
    if((await read()).current.index!==1)throw Error('Public game cannot advance offline');
  }finally{await page.context().setOffline(false);}
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  if(errors.length)throw Error(errors.join('\n'));
  return {sourceVersion:'0.5.0',version,profilePreserved:true,historyPreserved:true,retainedCompletedSessions:before.sessions.length,adaptationPreserved:true,pendingRaceAndRivalsPreserved:true,attemptsAndFirstResponsePreserved:true,previousRaceCompletedExactlyOnce:true,replayCreatesNewSession:true,publicOfflineReloadAndAnswer:true,errors};
}
