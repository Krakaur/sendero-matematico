// Run qa-web-regatta-prepare.js first. All inputs are synthetic.
async (page) => {
  const output='output/playwright/ciclo-web-2-20261013/',errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  await page.evaluate(async()=>{
    const {RiverAudio}=await import('./race-audio.js');
    window.__soundEvents=[];
    const play=RiverAudio.prototype.play;
    RiverAudio.prototype.play=function(event,...args){window.__soundEvents.push(event);return play.call(this,event,...args);};
    window.__positionMessages=[];
    new MutationObserver(()=>{
      const scene=document.querySelector('.regatta');
      if(scene?.dataset.response==='pass')window.__positionMessages.push(scene.querySelector('#race-message').textContent);
    }).observe(document.querySelector('#main'),{subtree:true,childList:true,attributes:true,attributeFilter:['data-response']});
  });
  await page.getByRole('button',{name:'Activar sonidos',exact:true}).click();
  await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();
  await page.locator('.regatta').waitFor();
  const initial=await read();
  if(initial.current.race.protocol!==2 || initial.current.version!=='0.5.0')throw Error('Expected web 0.5.0 and race protocol 2');
  const raceBefore=initial.current.race;
  const scene=await page.locator('.regatta').elementHandle();
  await page.screenshot({path:output+'start.png',fullPage:true});
  const positions=[],delays=[7200,7500,5200,5300,4800,5200,4000,4200];
  for(let i=0;i<8;i++) {
    await page.waitForTimeout(delays[i]);
    const q=(await read()).current.questions[i];
    if(i===2){
      await page.getByRole('button',{name:'Respuesta '+q.options.find(x=>x!==q.answer),exact:true}).click();
      await page.locator('.solution-callout').waitFor();
      await page.screenshot({path:output+'error.png',fullPage:true});
      await page.waitForTimeout(1200);
    }
    await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();
    if(i<7){
      if(!await scene.evaluate(el=>el===document.querySelector('.regatta')))throw Error('Scene replaced between questions');
      positions.push(await page.locator('#race-position').innerText());
      if(i===3)await page.screenshot({path:output+'overtake.png',fullPage:true});
    }
  }
  await page.getByRole('heading',{name:'¡Llegaste a la meta!',exact:true}).waitFor();
  await page.screenshot({path:output+'finish.png',fullPage:true});
  const completed=(await read()).sessions.at(-1);
  if(completed.questions.filter(q=>q.attempts[0]===q.answer).length!==7)throw Error('First-answer accuracy changed');
  if(JSON.stringify(completed.race.cadence)!==JSON.stringify(raceBefore.cadence) || JSON.stringify(completed.race.finishMs)!==JSON.stringify(raceBefore.finishMs))throw Error('Rivals changed mid-race');
  const events=await page.evaluate(()=>({sounds:window.__soundEvents,passes:[...new Set(window.__positionMessages)]}));
  for(const event of ['start','correct','error','recover','pass','finish'])if(!events.sounds.includes(event))throw Error('Missing audio event '+event);
  if(!events.passes.length)throw Error('No visible overtake feedback');
  if(errors.length)throw Error(errors.join('\n'));
  return {version:'0.5.0',seed:completed.race.seed,completed:true,scenePersisted:7,initialCorrect:7,rivalsUnchanged:true,positions,...events,errors};
}
