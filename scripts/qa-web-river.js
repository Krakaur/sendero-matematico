async (page) => {
  const errors=[]; page.on('pageerror', e=>errors.push(String(e)));
  await page.getByText('Lista sin conexión',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Comenzar aventura',exact:false}).click();
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.state.v1')));
  const layouts=[];
  for(const [width,height] of [[390,844],[320,640],[1280,900],[844,390]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(()=>scrollTo(0,0));
    const bounds=await page.locator('.answers').boundingBox();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(overflow || bounds.y+bounds.height>height) throw Error(`Answers do not fit ${width}x${height}: ${JSON.stringify(bounds)}`);
    layouts.push({width,height,answersBottom:bounds.y+bounds.height,overflow});
    await page.screenshot({path:`output/playwright/032-river-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});
  let s=(await state()).current, q=s.questions[0];
  await page.getByRole('button',{name:`Respuesta ${q.answer}`,exact:true}).click();
  if((await state()).current.index!==1 || await page.locator('#next').count())throw Error('One tap failed');
  await page.emulateMedia({reducedMotion:'reduce'});
  if(await page.locator('.race-boat').evaluate(el=>getComputedStyle(el).animationName)!=='none')throw Error('Reduced motion failed');
  q=(await state()).current.questions[1];
  await page.getByRole('button',{name:`Respuesta ${q.options.find(n=>n!==q.answer)}`,exact:true}).click();
  await page.getByRole('region',{name:'Solución del ejercicio'}).waitFor();
  await page.screenshot({path:'output/playwright/032-correction.png',fullPage:true});
  const first=(await state()).current.questions[1].firstResponseMs;
  await page.getByRole('button',{name:`Respuesta ${q.answer}`,exact:true}).click();
  if((await state()).current.questions[1].firstResponseMs!==first)throw Error('Correction changes time');
  for(let i=2;i<8;i++) {
    s=(await state()).current;q=s.questions[s.index];
    await page.getByRole('button',{name:`Respuesta ${q.answer}`,exact:true}).click();
  }
  await page.getByRole('heading',{name:'¡Llegaste a la meta!',exact:true}).waitFor();
  await page.getByRole('img',{name:'Luma ha recorrido 8 de 8 tramos del río'}).waitFor();
  if((await state()).sessions.length!==1)throw Error('Wrong session count');
  await page.screenshot({path:'output/playwright/032-finish.png',fullPage:true});
  if(errors.length)throw Error(errors.join('\n'));
  return {layouts,oneTap:true,correctionTimePreserved:true,reducedMotion:true,finish:true,errors};
}
