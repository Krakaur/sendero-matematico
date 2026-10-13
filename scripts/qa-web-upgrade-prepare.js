async (page) => {
  await page.setViewportSize({width:1280,height:800});
  const form=page.locator('#create-profile');
  await page.goto('https://krakaur.github.io/sendero-matematico/#perfiles');
  await form.locator('[name=alias]').fill('QA actualización '+Date.now().toString().slice(-5));
  await form.locator('[name=password]').fill('sendero-prueba');
  await form.locator('[name=repeat]').fill('sendero-prueba');
  await form.getByRole('button',{name:'Crear y entrar',exact:true}).click();
  await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  let s=(await read()).current;
  if(s.version!=='0.4.0' || s.race.protocol!==1)throw Error('Public source is no longer the expected version');
  await page.getByRole('button',{name:'Respuesta '+s.questions[0].answer,exact:true}).click();
  s=(await read()).current;
  await page.getByRole('button',{name:'Respuesta '+s.questions[1].options.find(x=>x!==s.questions[1].answer),exact:true}).click();
  await page.locator('.solution-callout').waitFor();
  await page.screenshot({path:'output/playwright/ciclo-web-2-20261013/public-before-upgrade.png',fullPage:true});
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  await page.getByText('Lista sin conexión',{exact:true}).waitFor();
  return await page.evaluate(()=>{
    const before=JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active')));
    sessionStorage.setItem('sendero.qa.upgradeExpected',JSON.stringify(before));
    return {sourceVersion:before.current.version,protocol:before.current.race.protocol,index:before.current.index,profile:before.profile,expectedStored:true};
  });
}
