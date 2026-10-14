async(page)=>{
 const context=await page.context().browser().newContext({viewport:{width:1280,height:720},serviceWorkers:'block'}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 try{
  const base='http://127.0.0.1:8768/';await p.goto(base);const f=p.locator('#create-profile');await f.locator('[name=alias]').fill('Catálogo QA');for(const name of ['password','repeat'])await f.locator(`[name=${name}]`).fill('sendero-prueba');await f.locator('button').click();await p.locator('[data-mode="calm"]').waitFor();
  const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  const records=[];
  for(const trail of ['suma','resta','multi','tablas20']){
   await p.goto(base+'#explorar');await p.locator('[data-mode="calm"]').click();await p.locator(`[data-trail="${trail}"]`).first().click();
   await p.locator('#written-result').waitFor();
   let q=(await read()).current.questions[0];const wrong=q.answer+25;
   await p.locator('#written-result').fill(String(wrong));await p.locator('#written-answer button').click();
   if((await read()).current.questions[0].attempts[0]!==wrong)throw Error('Written error was lost');
   await p.locator('#hint').click();await p.locator('[data-explore="1"]').click();if((await read()).current.questions[0].exploreCount!==1)throw Error('Workbench did not move');
   for(const [width,height] of [[1280,720],[390,844],[320,568],[854,480]]){await p.setViewportSize({width,height});if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Calm overflow '+trail+'/'+width);}
   await p.setViewportSize({width:1280,height:800});await p.screenshot({path:`output/playwright/web-0.9.0/calm-${trail}.png`,fullPage:true});
   for(let i=0;i<8;i++){q=(await read()).current.questions[i];await p.locator('#written-result').fill(String(q.answer));await p.locator('#written-answer button').click();}
   await p.getByRole('heading',{name:'¡Llegaste a la meta!',exact:true}).waitFor();
   const finished=(await read()).sessions.at(-1);if(finished.questions[0].attempts.length!==2||!finished.questions[0].hint)throw Error('Correction/help not preserved');
   records.push({trail,completed:true,writtenResponse:true,workbench:true});
  }
  await p.goto(base+'#taller');await p.locator('#reasoning-bank').click();await p.locator('.word-problem').waitFor();
  let q=(await read()).current.questions[0];await p.locator(`[data-answer="${q.options.find(n=>n!==q.answer)}"]`).click();
  if(await p.locator('.solution-callout').count())throw Error('Bank revealed the answer on first error');
  await p.setViewportSize({width:1280,height:720});await p.evaluate(()=>scrollTo(0,0));
  const position=await p.locator('.bottom-nav').evaluate(e=>getComputedStyle(e).position);if(position==='fixed')throw Error('Navigation still covers reasoning');
  await p.locator('#show-reasoning-solution').click();await p.locator('.solution-callout').waitFor();
  for(let i=0;i<8;i++){q=(await read()).current.questions[i];await p.locator(`[data-answer="${q.answer}"]`).click();await p.locator('#next').click();}
  await p.getByRole('heading',{name:'¡Tu sendero florece!'}).waitFor();
  if(errors.length)throw Error(errors.join('\n'));return {calm:records,bankCompleted:true,bankScaffoldBeforeSolution:true,reasoningNavigationUncovered:true,errors};
 }finally{await context.close();}
}
