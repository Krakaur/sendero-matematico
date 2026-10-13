// Run in a separate, disposable browser against public web 0.5.1 before deployment.
async(page)=>{
  await page.setViewportSize({width:1280,height:800});
  await page.goto('https://krakaur.github.io/sendero-matematico/#perfiles');
  const form=page.locator('#create-profile');
  await form.locator('[name=alias]').fill('QA cierre '+Date.now().toString().slice(-5));
  await form.locator('[name=password]').fill('sendero-prueba');
  await form.locator('[name=repeat]').fill('sendero-prueba');
  await form.getByRole('button',{name:'Crear y entrar',exact:true}).click();
  await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  let s=(await read()).current;
  if(s.version!=='0.5.1'||s.race.protocol!==2)throw Error('Unexpected public source version');
  for(let i=0;i<8;i++){const q=(await read()).current.questions[i];await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();}
  await page.getByRole('heading',{name:'¡Llegaste a la meta!',exact:true}).waitFor();
  await page.locator('#play-again').click();
  s=(await read()).current;
  await page.getByRole('button',{name:'Respuesta '+s.questions[0].answer,exact:true}).click();
  s=(await read()).current;
  await page.getByRole('button',{name:'Respuesta '+s.questions[1].options.find(x=>x!==s.questions[1].answer),exact:true}).click();
  await page.locator('.solution-callout').waitFor();
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  await page.getByText('Lista sin conexión',{exact:true}).waitFor();
  await page.screenshot({path:'output/playwright/ciclo-web-4-20261013/public-before-upgrade.png',fullPage:true});
  return await page.evaluate(()=>{
    const before=JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active')));
    sessionStorage.setItem('sendero.qa.upgradeExpected',JSON.stringify(before));
    return {sourceVersion:before.current.version,protocol:before.current.race.protocol,index:before.current.index,completedSessions:before.sessions.length,expectedStored:true};
  });
}
