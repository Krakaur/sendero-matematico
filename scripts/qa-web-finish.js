// Use an isolated synthetic profile created by qa-web-regatta-prepare.js first.
async(page)=>{
  const out='output/playwright/ciclo-web-3-20261013/',errors=[];
  await page.reload();
  page.on('pageerror',e=>errors.push(String(e)));
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  await page.evaluate(async()=>{
    window.__finishSounds=[];const {RiverAudio}=await import('./race-audio.js'),play=RiverAudio.prototype.play;
    RiverAudio.prototype.play=function(event,...args){window.__finishSounds.push(event);return play.call(this,event,...args);};
  });
  await page.getByRole('button',{name:'Activar sonidos',exact:true}).click();
  await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();
  const before=(await read()).sessions.length;
  for(let i=0;i<8;i++){
    const q=(await read()).current.questions[i];
    await page.waitForTimeout(550);
    if(i===2){await page.getByRole('button',{name:'Respuesta '+q.options.find(x=>x!==q.answer),exact:true}).click();await page.locator('.solution-callout').waitFor();}
    await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();
  }
  if(await page.locator('.regatta-arriving').count()!==1)throw Error('Missing arrival on the live river');
  const saved=await read();
  if(saved.current!==null||saved.sessions.length!==before+1||!page.url().endsWith('#logro'))throw Error('Arrival was not saved before animation');
  await page.screenshot({path:out+'arrival.png',fullPage:true});
  await page.locator('#finish-title').waitFor();
  if((await read()).sessions.length!==before+1)throw Error('Duplicate completion');
  const sounds=await page.evaluate(()=>window.__finishSounds.filter(e=>e==='finish').length);
  if(sounds!==1)throw Error('Finish sound must fire exactly once');
  await page.locator('.finish-details > summary').click();
  if(await page.locator('.finish-standings li').count()!==4)throw Error('Missing finish standings');
  if(!await page.getByText('En el río',{exact:true}).count())throw Error('Unfinished rivals presented as arrived');
  await page.screenshot({path:out+'details.png',fullPage:true});
  await page.locator('.finish-details > summary').click();
  const layouts=[];
  for(const [width,height] of [[1280,800],[390,844],[360,640],[854,480]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>scrollTo(0,0));
    const layout=await page.evaluate(()=>{
      const bounds=el=>{const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,height:b.height};};
      return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,replay:bounds(document.querySelector('#play-again')),exit:bounds(document.querySelector('.finish-actions a')),navTop:document.querySelector('nav').getBoundingClientRect().top};
    });
    if(layout.scrollWidth>width || [layout.replay,layout.exit].some(b=>b.top<0||b.bottom>height||b.bottom>layout.navTop||b.height<44))throw Error('Finish choices clipped or covered: '+JSON.stringify(layout));
    layouts.push(layout);await page.screenshot({path:out+`finish-${width}x${height}.png`,fullPage:true});
  }
  await page.setViewportSize({width:1280,height:800});
  await page.locator('#play-again').click();
  let state=await read();
  if(state.current.index!==0 || state.current.race.level!==2 || state.current.id===saved.sessions.at(-1).id || state.sessions.length!==before+1)throw Error('Replay lost history, reused session or ignored next level');
  await page.locator('.race-settings summary').click();
  await page.getByRole('button',{name:'Reducir movimiento',exact:true}).click();
  for(let i=0;i<7;i++){
    const q=(await read()).current.questions[i];
    if(i===1){await page.getByRole('button',{name:'Respuesta '+q.options.find(x=>x!==q.answer),exact:true}).click();await page.locator('.solution-callout').waitFor();}
    await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();
  }
  // Explicit synthetic fixture: exercise fourth-place presentation without a long wait.
  await page.evaluate(()=>sessionStorage.setItem('sendero.qa.fourth','1'));
  await page.addInitScript(()=>{
    if(sessionStorage.getItem('sendero.qa.fourth')!=='1')return;
    sessionStorage.removeItem('sendero.qa.fourth');
    const key='sendero.profile.'+sessionStorage.getItem('sendero.active'),s=JSON.parse(localStorage.getItem(key));
    s.current.race.elapsedMs=Math.max(...s.current.race.finishMs)+1000;
    localStorage.setItem(key,JSON.stringify(s));
  });
  await page.reload();await page.locator('.answers').waitFor();
  let q=(await read()).current.questions[7];
  await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();
  await page.locator('#finish-title').waitFor();
  if(await page.locator('.regatta-arriving').count())throw Error('Reduced motion retains arrival animation');
  const fourth=await page.locator('.finish-highlights > div').first().innerText();
  if(!fourth.includes('4 / 4'))throw Error('Fourth place not shown');
  if(!await page.locator('#play-again').isVisible())throw Error('Fourth place blocks replay');
  await page.screenshot({path:out+'fourth-place.png',fullPage:true});
  await page.setViewportSize({width:360,height:640});
  const recoveredLayout=await page.evaluate(()=>({buttonBottom:document.querySelector('#play-again').getBoundingClientRect().bottom,navTop:document.querySelector('nav').getBoundingClientRect().top}));
  if(recoveredLayout.buttonBottom>recoveredLayout.navTop)throw Error('Recovery text hides replay on small screens: '+JSON.stringify(recoveredLayout));
  await page.screenshot({path:out+'fourth-place-mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:800});
  await page.locator('#play-again').click();
  await page.locator('.race-settings summary').click();await page.getByRole('button',{name:'Reducir movimiento',exact:true}).click();
  const count=(await read()).sessions.length;
  for(let i=0;i<8;i++){q=(await read()).current.questions[i];await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();}
  if(!await page.locator('.regatta-arriving').count())throw Error('No animation to interrupt');
  await page.reload();await page.locator('#finish-title').waitFor();
  if((await read()).sessions.length!==count+1 || (await read()).current!==null)throw Error('Reload during arrival lost or duplicated session');
  await page.getByText('Lista sin conexión',{exact:true}).waitFor();
  await page.context().setOffline(true);
  try {await page.reload();await page.locator('#play-again').click();await page.locator('.answers').waitFor();if((await read()).current.index!==0)throw Error('Cannot replay offline');}
  finally {await page.context().setOffline(false);}
  if(errors.length)throw Error(errors.join('\n'));
  return {version:'0.5.1',completionSavedBeforeAnimation:true,finishSoundCount:sounds,firstAndFourthPlace:true,recoveryReplayVisibleOnSmallScreen:true,replayPreservesHistoryAndNextLevel:true,reloadDuringArrivalExactlyOnce:true,reducedMotion:true,offlineReplay:true,layouts,errors};
}
