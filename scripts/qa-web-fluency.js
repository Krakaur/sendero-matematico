async (page) => {
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width:390,height:844});
  await page.getByText('Lista sin conexión',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Comenzar aventura',exact:false}).click();
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.state.v1')));
  let q=(await state()).current.questions[0];
  await page.getByRole('button',{name:`Respuesta ${q.answer}`,exact:true}).click();
  let s=(await state()).current;
  if(s.index!==1||s.questions[0].firstResponseMs<=0)throw Error('Correct answer did not advance once or time missing');
  if(await page.locator('#next').count())throw Error('Redundant Next button in arithmetic');
  await page.screenshot({path:'output/playwright/031-one-tap.png'});
  q=s.questions[1];
  await page.getByRole('button',{name:`Respuesta ${q.options.find(n=>n!==q.answer)}`,exact:true}).click();
  await page.getByRole('region',{name:'Solución del ejercicio'}).waitFor();
  const firstMs=(await state()).current.questions[1].firstResponseMs;
  await page.screenshot({path:'output/playwright/031-correction.png'});
  await page.getByRole('button',{name:`Respuesta ${q.answer}`,exact:true}).click();
  s=(await state()).current;
  if(s.index!==2||s.questions[1].firstResponseMs!==firstMs||s.questions[1].attempts.length!==2)throw Error('Correction affected first-response metric');
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  await page.getByRole('button',{name:'Continuar mi aventura',exact:false}).click();
  if(!(await state()).current.questions[2].timingInterrupted)throw Error('Pause was not marked');
  await page.context().setOffline(true);
  await page.reload();
  for(let i=2;i<8;i++) {
    s=(await state()).current;q=s.questions[s.index];
    if(s.index!==i)throw Error('Skipped question');
    await page.getByRole('button',{name:`Respuesta ${q.answer}`,exact:true}).click();
  }
  if((await state()).current!==null||(await state()).sessions.length!==1)throw Error('Session not saved exactly once');
  await page.getByRole('link',{name:'Ver mi progreso',exact:true}).click();
  await page.getByRole('heading',{name:'Fluidez de cálculo',exact:true}).waitFor();
  await page.getByRole('heading',{name:'Fluidez de cálculo',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/031-progress.png'});
  const result=await page.evaluate(async()=>{
    const s=JSON.parse(localStorage.getItem('sendero.state.v1'));
    const {validateReport,SCHEMA}=await import('/core.js');
    const {fluency}=await import('/fluency.js');
    validateReport({schema:SCHEMA,profile:s.profile,sessions:s.sessions});
    return fluency(s.sessions[0].questions);
  });
  if(result.n!==7||result.correct!==6||result.excluded!==1)throw Error(JSON.stringify(result));
  await page.setViewportSize({width:320,height:640});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
  await page.setViewportSize({width:1280,height:900});
  await page.screenshot({path:'output/playwright/031-laptop.png'});
  await page.context().setOffline(false);
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({oneTap:true,offline:true,correctionPreserved:true,interruptionExcluded:true,result,errors}));
}
