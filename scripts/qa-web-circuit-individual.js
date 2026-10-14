// Isolated QA profile only. Invoke with Playwright CLI run-code --filename.
async(page)=>{
 const browser=await page.evaluate(()=>navigator.userAgent.includes('Firefox')?'firefox':'chromium');
 const out=`output/playwright/ciclo-web-6-20261014/${browser}/`,errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const base='http://127.0.0.1:8767/web/';
 await page.goto(base);await page.evaluate(async()=>{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())if(k.startsWith('sendero-'))await caches.delete(k);});
 await page.goto('about:blank');await page.goto(base+'#perfiles');await page.setViewportSize({width:1280,height:800});
 if(await page.locator('#logout').count())await page.locator('#logout').click();
 const form=page.locator('#create-profile');await form.locator('[name=alias]').fill('Río QA '+Date.now().toString().slice(-5));await form.locator('[name=password]').fill('sendero-prueba');await form.locator('[name=repeat]').fill('sendero-prueba');await form.getByRole('button',{name:'Crear y entrar',exact:true}).click();
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();await page.locator('#race-ready').waitFor();
 await page.locator('#circuit-select').selectOption('cascada');const prepared=(await read()).current; if(prepared.race.circuit!=='cascada')throw Error('Course selection was not saved');
 for(const mode of ['gentle','challenge','balanced']){
  await page.locator(`[data-challenge="${mode}"]`).click();const s=(await read()).current;
  if(s.id!==prepared.id||s.race.seed!==prepared.race.seed||s.race.level!==prepared.race.level||s.race.elapsedMs!==0||s.race.challenge!==mode||s.race.circuit!=='cascada'||JSON.stringify(s.questions)!==JSON.stringify(prepared.questions))throw Error('Challenge selection changes the educational task or time');
 }
 const assets=await page.evaluate(()=>[...document.querySelectorAll('.launch-boat .racer-sprite')].map(x=>({image:getComputedStyle(x).backgroundImage,position:getComputedStyle(x).backgroundPosition})));
 if(assets.length!==4||new Set(assets.map(x=>x.position)).size!==4||assets.some(x=>!x.image.includes('river-racers-v1.png')))throw Error('Incorrect sprite atlas structure');
 const layouts=[];
 for(const [width,height] of [[1280,800],[390,844],[360,640],[320,568],[854,480]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
  const layout=await page.evaluate(()=>{const b=document.querySelector('#race-ready').getBoundingClientRect();return {scene:'preparation',width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,bottom:b.bottom,touchHeight:b.height,uncovered:!!document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('#race-ready')};});
  if(layout.scrollWidth>width||layout.bottom>height||layout.touchHeight<44||!layout.uncovered)throw Error('Preparation layout '+JSON.stringify(layout));layouts.push(layout);
  await page.screenshot({path:out+`preparation-${width}.png`,timeout:10000});
 }
 await page.setViewportSize({width:1280,height:800});await page.locator('#race-ready').click();await page.waitForTimeout(150);await page.keyboard.press('Escape');
 await page.waitForTimeout(2200);if((await read()).current.race.elapsedMs!==0)throw Error('Cancelled countdown consumes race time');
 await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
 const first=(await read()).current.questions[0];
 await page.evaluate(()=>{
  window.__riverProbe={frames:[],clicked:null,firstMotion:null};
  document.addEventListener('click',()=>window.__riverProbe.clicked=performance.now(),{capture:true,once:true});
  let previous=performance.now();const tick=t=>{const boat=document.querySelector('[data-racer="0"]');if(!boat)return;const p=window.__riverProbe;p.frames.push(t-previous);previous=t;if(p.clicked&&Number(boat.dataset.progress)>0&&p.firstMotion===null)p.firstMotion=performance.now()-p.clicked;if(p.frames.length<180)requestAnimationFrame(tick);};requestAnimationFrame(tick);
 });
 await page.locator(`[data-answer="${first.answer}"]`).click();await page.waitForTimeout(3300);
 const probe=await page.evaluate(()=>window.__riverProbe),frames=probe.frames.slice(3).sort((a,b)=>a-b);
 const performanceResult={samples:frames.length,medianFrameMs:frames[Math.floor(frames.length*.5)],p95FrameMs:frames[Math.floor(frames.length*.95)],framesOver50ms:frames.filter(x=>x>50).length,firstVisibleMovementMs:probe.firstMotion};
 if(probe.firstMotion===null||probe.firstMotion>250)throw Error('Slow visible input response '+JSON.stringify(performanceResult));
 const seedSnapshot=(await read()).current.race;
 let current=(await read()).current,q=current.questions[current.index];
 const earned=await page.locator('#route-steps').textContent();
 await page.locator(`[data-answer="${q.options.find(n=>n!==q.answer)}"]`).click();await page.locator('.solution-callout').waitFor();
 if(await page.locator('#route-steps').textContent()!==earned)throw Error('Wrong answer grants distance');
 await page.screenshot({path:out+'recovery-desktop.png'});
 await page.locator(`[data-answer="${q.answer}"]`).click();
 await page.getByRole('button',{name:'Pausar',exact:true}).click();const paused=(await read()).current;await page.waitForTimeout(1200);
 if((await read()).current.race.elapsedMs!==paused.race.elapsedMs)throw Error('Pause consumes time');
 await page.locator('#quick-start').click();await page.locator('.answers').waitFor();
 if(await page.locator('#race-ready').count())throw Error('Resume unexpectedly repeats preparation');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 const hidden=(await read()).current.race.elapsedMs;await page.waitForTimeout(1000);
 if((await read()).current.race.elapsedMs!==hidden)throw Error('Hidden tab consumes time');
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 for(const [width,height] of [[1280,800],[390,844],[360,640],[320,568],[854,480]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
  const layout=await page.evaluate(()=>({scene:'race',width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('[data-answer]')].map(el=>{const b=el.getBoundingClientRect();return {bottom:b.bottom,width:b.width,height:b.height,uncovered:!!document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('[data-answer]')};})}));
  if(layout.scrollWidth>width||layout.buttons.some(b=>b.bottom>height||b.width<44||b.height<44||!b.uncovered))throw Error('Race layout '+JSON.stringify(layout));layouts.push(layout);
  await page.screenshot({path:out+`race-${width}.png`,timeout:10000});
 }
 await page.setViewportSize({width:1280,height:800});
 const beforeReload=(await read()).current;await page.reload();await page.locator('.answers').waitFor();
 if((await read()).current.id!==beforeReload.id||JSON.stringify((await read()).current.race.finishMs)!==JSON.stringify(seedSnapshot.finishMs)||JSON.stringify((await read()).current.race.cadence)!==JSON.stringify(seedSnapshot.cadence))throw Error('Reload changed opponents');
 await page.getByText('Lista sin conexión',{exact:true}).waitFor({timeout:15000});
 const cached=await page.evaluate(async()=>{const c=await caches.open('sendero-0.8.0-social-circuit-v1');return (await c.keys()).map(r=>new URL(r.url).pathname);});
 if(!cached.some(p=>p.endsWith('forest-river-v1.png'))||!cached.some(p=>p.endsWith('river-racers-v1.png')))throw Error('Art missing offline');
 await page.context().setOffline(true);
 try{await page.reload();await page.locator('.answers').waitFor();let s=(await read()).current;while(s){q=s.questions[s.index];await page.locator(`[data-answer="${q.answer}"]`).click();s=(await read()).current;}await page.locator('#finish-title').waitFor();await page.waitForTimeout(1000);await page.screenshot({path:out+'finish-offline.png'});}finally{await page.context().setOffline(false);}
 const finished=(await read()).sessions.at(-1);if(finished.questions.length!==8||finished.questions[1].attempts.length!==2)throw Error('Finish or recovery history lost');
 await page.locator('#play-again').click();await page.locator('#race-ready').waitFor();await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
 const rq=(await read()).current.questions[0];await page.locator(`[data-answer="${rq.answer}"]`).click();await page.waitForTimeout(150);
 const reduced=await page.evaluate(()=>({position:Number(document.querySelector('[data-racer="0"]').dataset.progress),background:document.querySelector('.regatta .river-panorama').style.transform,animations:document.querySelector('.regatta .boat-bob').getAnimations().length}));
 if(reduced.position!==.125||reduced.animations)throw Error('Reduced motion '+JSON.stringify(reduced));
 await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Pausar',exact:true}).click();
 if(errors.length)throw Error(errors.join('\n'));
 return {version:await page.evaluate(async()=>(await import('./core.js')).VERSION),browser,layouts,performance:performanceResult,challengeDoesNotChangeMath:true,wrongAnswerNoDistance:true,correctionPreserved:true,pauseFreezes:true,syntheticVisibilityEventFreezes:true,reloadKeepsRivals:true,offlineArtAndFullRace:true,cachedFiles:cached.length,reducedMotion:reduced,completedSessions:(await read()).sessions.length,errors};
}
