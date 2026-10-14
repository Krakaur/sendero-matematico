// Targeted contrast/layout and alternative-control checks, not a WCAG certification.
async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(page.url().split('#')[0]+'#jugar');
 if(!await page.locator('.answers,#race-ready,#finish-title').count())await page.locator('[data-trail="multi"]').first().click();
 if(await page.locator('.answers').count()){
  while(await page.locator('.answers').count()){
   const q=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))).current;return s.questions[s.index];});
   await page.locator(`[data-answer="${q.answer}"]`).click();
   if(await page.locator('.regatta-arriving').count())await page.locator('#finish-title').waitFor();
  }
 }
 if(await page.locator('#finish-title').count())await page.locator('#play-again').click();
 await page.locator('#race-ready').waitFor();
 const contrast=await page.evaluate(()=>{
  const rgb=value=>(value.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
  const light=c=>c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const background=el=>{for(let p=el;p;p=p.parentElement){const c=getComputedStyle(p).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent')return rgb(c);}return [255,255,255];};
  return [...document.querySelectorAll('.launch-brief h1,.launch-eyebrow,.launch-intro,.launch-intro strong,.launch-chips span,.launch-instructions strong,.launch-instructions small,#race-ready,#launch-sound,.launch-back,.launch-rival strong,.launch-rival small,.launch-settings > summary,.launch-boat > span,.challenge-picker legend,.challenge-picker button strong,.challenge-picker button small')].filter(el=>el.getBoundingClientRect().height>0).map(el=>{
   const fg=rgb(getComputedStyle(el).color),bg=background(el),a=light(fg),b=light(bg);
   return {text:el.textContent.trim(),foreground:fg,background:bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });
 });
 if(contrast.some(x=>x.ratio<4.5))throw Error('Functional text contrast below 4.5: '+JSON.stringify(contrast.filter(x=>x.ratio<4.5)));
 // The exact allowed maximum-length alias exercises wrapping without touching real profiles.
 await page.goto(page.url().split('#')[0]+'#perfiles');
 await page.getByText('Mi alias y contraseña',{exact:true}).click();
 await page.locator('#edit-profile [name=alias]').fill('Exploradora del bosque Q');
 await page.locator('#edit-profile [name=previous]').fill('sendero-prueba');
 await page.locator('#edit-profile').getByRole('button',{name:'Guardar cambios',exact:true}).click();
 await page.getByText('Cambios guardados.',{exact:true}).waitFor();
 await page.goto(page.url().split('#')[0]+'#jugar');await page.locator('#race-ready').waitFor();
 await page.setViewportSize({width:320,height:568});
 const layout=await page.evaluate(()=>({startBottom:document.querySelector('#race-ready').getBoundingClientRect().bottom,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth}));
 if(layout.overflow||layout.startBottom>layout.height)throw Error('Long alias hides start: '+JSON.stringify(layout));
 await page.screenshot({path:'output/playwright/ciclo-web-5-20261014/long-alias-320.png'});
 await page.setViewportSize({width:1280,height:800});
 // Record the app's request; native dialog rendering is outside this check.
 await page.evaluate(()=>{window.__nativeConfirm=window.confirm;window.__discardRequests=[];window.confirm=message=>{window.__discardRequests.push(message);return false;};});
 await page.locator('.launch-back').click();await page.locator('[data-trail="suma"]').first().click();await page.locator('#race-ready').waitFor();
 if(await page.evaluate(()=>window.__discardRequests.length))throw Error('Unplayed preparation asks to discard nonexistent answers');
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))).current);
 if(before.trail!=='suma')throw Error('Cannot choose another trail before playing');
 await page.locator('#race-ready').dblclick();await page.locator('.answers').waitFor();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))).current);
 if(after.id!==before.id||after.race.launch!=='running')throw Error('Double start creates/replaces race');
 await page.getByRole('button',{name:'Pausar',exact:true}).click();
 await page.locator('[data-trail="multi"]').first().click();
 const dialogs=await page.evaluate(()=>{window.confirm=window.__nativeConfirm;return window.__discardRequests;});
 if(dialogs.length!==1)throw Error('Started race no longer protects its pending data');
 if(errors.length)throw Error(errors.join('\n'));
 return {version:'0.7.0',minimumContrast:Math.min(...contrast.map(x=>x.ratio)),contrast,longAliasVisible:layout,unplayedTrailChangeWithoutDiscardDialog:true,startedRaceRequestsDiscardConfirmation:true,confirmationMethod:'Instrumented window.confirm returning false; native dialog appearance not evaluated',doubleStartKeepsOneSession:true,errors};
}
