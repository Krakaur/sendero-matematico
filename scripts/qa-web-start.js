// Run qa-web-regatta-prepare.js in an isolated browser first.
async(page)=>{
 const browser=await page.evaluate(()=>navigator.userAgent.includes('Firefox')?'firefox':'chromium');
 const out=`output/playwright/ciclo-web-4-20261013/${browser}/`,errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 await page.reload();
 await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();
 await page.locator('#race-ready').waitFor();
 const original=(await read()).current;
 const untouched=async()=>{
  const s=(await read()).current;
  if(s.id!==original.id||s.race.launch!=='ready'||s.race.elapsedMs!==0||s.questions[0].activeMs!==0||s.questions[0].timingInterrupted||s.questions.some(q=>q.attempts.length)||JSON.stringify(s.race.finishMs)!==JSON.stringify(original.race.finishMs))throw Error('Preparation altered timing, attempts or rivals');
  if(await page.locator('.answers').count())throw Error('Question exposed before the start');
 };
 await page.waitForTimeout(1200);await untouched();
 const layouts=[];
 for(const [width,height] of [[1280,800],[390,844],[360,640],[320,568],[854,480]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
  const layout=await page.evaluate(()=>{
   const b=document.querySelector('#race-ready').getBoundingClientRect();
   const center=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
   return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,buttonTop:b.top,buttonBottom:b.bottom,buttonHeight:b.height,uncovered:!!center?.closest('#race-ready')};
  });
  if(layout.scrollWidth>width||layout.buttonBottom>height||layout.buttonTop<0||layout.buttonHeight<44||!layout.uncovered)throw Error('Start action clipped: '+JSON.stringify(layout));
  layouts.push(layout);await page.screenshot({path:out+`preparation-${width}x${height}.png`,fullPage:false,timeout:10000});
 }
 await page.setViewportSize({width:1280,height:800});
 await page.locator('#race-ready').click();await page.waitForTimeout(250);
 await page.screenshot({path:out+'countdown.png',fullPage:false,timeout:10000});
 await page.keyboard.press('Escape');await page.waitForTimeout(2200);await untouched();
 await page.locator('#race-ready').click();await page.waitForTimeout(200);await page.reload();await page.locator('#race-ready').waitFor();await untouched();
 await page.locator('#race-ready').click();await page.waitForTimeout(200);
 // The automation browser keeps background tabs visible. Exercise the production
 // listener with an explicit synthetic visibility event, and label it as such.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(2300);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.locator('#race-ready').waitFor();await untouched();
 await page.locator('#race-ready').click();await page.waitForTimeout(150);await page.locator('.launch-back').click();
 await page.locator('#quick-start').click();await page.locator('#race-ready').waitFor();await untouched();
 await page.locator('#launch-sound').click();
 await page.evaluate(async()=>{
  window.__launchEvents=[];const {RiverAudio}=await import('./race-audio.js'),play=RiverAudio.prototype.play;
  RiverAudio.prototype.play=function(event,enabled,...args){if(enabled)window.__launchEvents.push({event,time:performance.now()});return play.call(this,event,enabled,...args);};
 });
 await page.locator('#race-ready').focus();
 const clicked=Date.now();await page.keyboard.press('Enter');
 await page.locator('.answers').waitFor();
 const launchDuration=Date.now()-clicked;
 const focus=await page.evaluate(()=>document.activeElement.classList.contains('equation'));
 if(!focus||launchDuration<2000||launchDuration>3500)throw Error('Keyboard start timing or focus incorrect: '+launchDuration);
 await page.waitForTimeout(300);
 const q=(await read()).current.questions[0];await page.locator(`[data-answer="${q.answer}"]`).click();
 const first=(await read()).current.questions[0];
 if(first.timingInterrupted||first.firstResponseMs<250||first.firstResponseMs>1300)throw Error('Preparation/countdown contaminates first response: '+JSON.stringify(first));
 const sounds=await page.evaluate(()=>window.__launchEvents.filter(e=>['countdown','start'].includes(e.event)));
 if(sounds.map(e=>e.event).join(',')!=='countdown,countdown,countdown,start')throw Error('Wrong countdown sound sequence');
 for(let i=1;i<8;i++){
  const q=(await read()).current.questions[i];
  if(i===3){await page.locator(`[data-answer="${q.options.find(x=>x!==q.answer)}"]`).click();await page.locator('.solution-callout').waitFor();}
  await page.locator(`[data-answer="${q.answer}"]`).click();
 }
 await page.locator('#finish-title').waitFor();await page.locator('#play-again').click();await page.locator('#race-ready').waitFor();
 if((await read()).current.id===original.id||!(await read()).sessions.some(s=>s.id===original.id))throw Error('Replay lost the completed race');
 await page.locator('.launch-settings > summary').click();
 await page.locator('#reduce-motion').click();await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
 if(await page.locator('#launch-countdown').count())throw Error('Profile reduced motion still counts down');
 await page.getByRole('button',{name:'Pausar',exact:true}).click();await page.locator('#quick-start').click();
 if(await page.locator('#race-ready').count())throw Error('Started race was forced through preparation again');
 for(let i=0;i<8;i++){const q=(await read()).current.questions[i];await page.locator(`[data-answer="${q.answer}"]`).click();}
 await page.locator('#finish-title').waitFor();await page.locator('#play-again').click();
 await page.locator('.launch-settings > summary').click();await page.locator('#reduce-motion').click();
 await page.emulateMedia({reducedMotion:'reduce'});
 const animated=await page.evaluate(()=>document.querySelector('.launch-boat .boat-bob').getAnimations().length);
 if(animated)throw Error('OS reduced motion still animates preparation');
 await page.getByText('Lista sin conexión',{exact:true}).waitFor();
 await page.context().setOffline(true);
 try{
  await page.reload();await page.locator('#race-ready').waitFor();
  await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
  const q=(await read()).current.questions[0];await page.locator(`[data-answer="${q.answer}"]`).click();
  if((await read()).current.index!==1)throw Error('Offline start cannot answer');
 }finally{await page.context().setOffline(false);await page.emulateMedia({reducedMotion:'no-preference'});}
 if(errors.length)throw Error(errors.join('\n'));
 return {version:'0.6.0',layouts,preparationDoesNotConsumeTime:true,noQuestionBeforeStart:true,escapeCancel:true,reloadDuringCountdown:true,syntheticVisibilityEventCancelsCountdown:true,navigationCancelsCountdown:true,keyboardStart:true,launchDurationMs:launchDuration,firstResponseMs:first.firstResponseMs,countdownSoundSequence:sounds.map(e=>e.event),soundIntervalsMs:sounds.slice(1).map((e,i)=>e.time-sounds[i].time),replayPreparesNextRace:true,resumeSkipsPreparation:true,profileReducedMotion:true,osReducedMotion:true,offlineStartAndAnswer:true,errors};
}
