// Continue the isolated browser prepared by qa-web-upgrade-prepare.js after deployment.
async (page) => {
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://krakaur.github.io/sendero-matematico/actualizar.html');
  await page.waitForURL('**/#jugar');
  await page.locator('.solution-callout').waitFor();
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  const before=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('sendero.qa.upgradeExpected')));
  const after=await read();
  const version=await page.evaluate(async()=>(await import('./core.js')).VERSION);
  if(version!=='0.5.0')throw Error('Updated browser did not load web 0.5.0');
  for(const key of ['profile','sessions','adaptive'])if(JSON.stringify(after[key])!==JSON.stringify(before[key]))throw Error('Changed stored '+key);
  if(after.current.id!==before.current.id || after.current.index!==1 || after.current.race.protocol!==1)throw Error('Pending legacy race lost');
  if(JSON.stringify(after.current.race.finishMs)!==JSON.stringify(before.current.race.finishMs))throw Error('Legacy calibration changed');
  for(let i=0;i<2;i++) {
    if(JSON.stringify(after.current.questions[i].attempts)!==JSON.stringify(before.current.questions[i].attempts))throw Error('Attempt history changed');
    if(after.current.questions[i].firstResponseMs!==before.current.questions[i].firstResponseMs)throw Error('Response measurement changed');
  }
  for(let i=1;i<8;i++){
    const q=(await read()).current.questions[i];
    await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();
  }
  await page.getByRole('heading',{name:'¡Llegaste a la meta!',exact:true}).waitFor();
  await page.getByRole('button',{name:'Otra aventura ↗',exact:true}).click();
  const race=(await read()).current.race;
  if(race.protocol!==2)throw Error('New race did not adopt variable rivals');
  await page.getByText('Lista sin conexión',{exact:true}).waitFor();
  await page.context().setOffline(true);
  try {
    await page.reload();await page.locator('.regatta').waitFor();
    if((await read()).current.race.seed!==race.seed)throw Error('Seed lost on offline reload');
    const q=(await read()).current.questions[0];
    await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();
    if((await read()).current.index!==1)throw Error('Published game cannot advance offline');
    await page.screenshot({path:'output/playwright/ciclo-web-2-20261013/public-0.5.0.png',fullPage:true});
  } finally {await page.context().setOffline(false);}
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  if(errors.length)throw Error(errors.join('\n'));
  return {version,profilePreserved:true,historyPreserved:true,adaptationPreserved:true,firstResponsePreserved:true,pendingLegacyRaceCompleted:true,newProtocol:2,seedPersisted:true,publicOfflineReloadAndAnswer:true,errors};
}
