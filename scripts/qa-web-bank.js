async (page) => {
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.context().setOffline(false);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/#acerca');
  await page.getByText('Borrar los datos de este dispositivo',{exact:true}).click();
  await page.evaluate(()=>{window.confirm=()=>true;});
  await page.getByRole('button',{name:'Borrar datos locales…',exact:true}).click();
  await page.evaluate(async()=>{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())await caches.delete(k);});
  await page.goto('http://127.0.0.1:4173/');
  await page.getByText('Lista sin conexión',{exact:true}).waitFor();
  await page.reload();
  await page.getByRole('button',{name:/RAZONAMIENTO El taller/}).click();
  const read=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('sendero.state.v1'));return s.current?.questions[s.current.index];});
  let q=await read();const firstId=q.bankId;
  await page.getByRole('button',{name:q.labels?q.labels[q.options.find(n=>n!==q.answer)]:String(q.options.find(n=>n!==q.answer)),exact:true}).click();
  await page.getByRole('region',{name:'Solución del ejercicio'}).waitFor();
  await page.screenshot({path:'output/playwright/final-mobile-correction.png'});
  await page.context().setOffline(true);await page.reload();q=await read();
  if(q.bankId!==firstId||!q.solutionShown||q.attempts.length!==1)throw Error('Pending answer lost offline');
  for(let i=0;i<8;i++){
    q=await read();
    if((q.pool==='transfer')!==(i===7))throw Error('Reserved pool mixed');
    await page.getByRole('button',{name:q.labels?q.labels[q.answer]:String(q.answer),exact:true}).click();
    await page.getByRole('button',{name:i===7?'Ver mis descubrimientos':'Siguiente paso',exact:false}).click();
  }
  await page.getByRole('link',{name:'Ver mi progreso',exact:true}).click();
  await page.getByRole('heading',{name:'Problemas para pensar',exact:true}).waitFor();
  await page.screenshot({path:'output/playwright/final-mobile-progress.png',fullPage:true});
  const result=await page.evaluate(async()=>{
    const s=JSON.parse(localStorage.getItem('sendero.state.v1'));
    const {validateReport,SCHEMA}=await import('./core.js');
    validateReport({schema:SCHEMA,profile:s.profile,sessions:s.sessions});
    return {sessions:s.sessions.length,questions:s.sessions[0].questions.length,firstAnswerPreserved:s.sessions[0].questions[0].attempts.length===2,history:!!s.bankHistory};
  });
  await page.setViewportSize({width:320,height:740});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow at 320px');
  await page.setViewportSize({width:1280,height:900});
  await page.screenshot({path:'output/playwright/final-laptop-progress.png'});
  await page.context().setOffline(false);
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({...result,offline:true,mobile320:true,laptop1280:true,errors}));
}
