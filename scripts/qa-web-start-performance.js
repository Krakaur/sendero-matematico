// Three consecutive 60-second browser samples, including starts, answers and finishes.
// Measures browser scheduling, not physical display latency or child performance.
async(page)=>{
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 await page.setViewportSize({width:1280,height:800});
 await page.goto(page.url().split('#')[0]+'#explorar');
 if(await page.locator('#quick-start').count())await page.locator('#quick-start').click();
 else await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();
 if(await page.locator('#race-ready').count())await page.locator('#race-ready').click();
 await page.locator('.answers').waitFor();
 if(await page.locator('#sound').getAttribute('aria-pressed')==='true')await page.locator('#sound').click();
 await page.evaluate(()=>{
  window.__perf={latencies:[],longTasks:[]};
  document.addEventListener('click',event=>{
   if(!event.target.closest('[data-answer]'))return;
   const start=performance.now();
   requestAnimationFrame(()=>requestAnimationFrame(()=>window.__perf.latencies.push(performance.now()-start)));
  },true);
  if(PerformanceObserver.supportedEntryTypes.includes('longtask')){
   const observer=new PerformanceObserver(list=>window.__perf.longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration}))));
   observer.observe({type:'longtask'});window.__perf.observer=observer;
  }
 });
 const runs=[];let answers=0;
 for(let run=0;run<3;run++){
  await page.evaluate(()=>{
   window.__frames={active:true,start:performance.now(),previous:null,intervals:[],hidden:0};
   const frame=now=>{const f=window.__frames;if(!f.active)return;if(f.previous!==null)f.intervals.push(now-f.previous);f.previous=now;if(document.hidden)f.hidden++;requestAnimationFrame(frame);};requestAnimationFrame(frame);
  });
  const deadline=Date.now()+60000;
  while(Date.now()<deadline){
   if(await page.locator('#finish-title').count()){await page.locator('#play-again').click();await page.locator('#race-ready').click();await page.locator('.answers').waitFor();}
   await page.waitForTimeout(Math.min(3200,Math.max(0,deadline-Date.now())));
   if(Date.now()>=deadline)break;
   const s=(await read()).current;if(!s)continue;const q=s.questions[s.index];
   if(answers%7===3){await page.locator(`[data-answer="${q.options.find(x=>x!==q.answer)}"]`).click();await page.locator('.solution-callout').waitFor();await page.waitForTimeout(350);}
   await page.locator(`[data-answer="${q.answer}"]`).click();answers++;
   if(s.index===7)await page.locator('#finish-title').waitFor();
  }
  runs.push(await page.evaluate(()=>{const f=window.__frames;f.active=false;return {durationMs:performance.now()-f.start,intervals:f.intervals,hiddenFrames:f.hidden};}));
 }
 const detail=await page.evaluate(()=>({latencies:window.__perf.latencies,longTasks:window.__perf.longTasks,environment:{userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,devicePixelRatio,viewport:{width:innerWidth,height:innerHeight},visibility:document.visibilityState}}));
 const stats=values=>{const s=[...values].sort((a,b)=>a-b);return {n:s.length,medianMs:s[Math.floor(s.length*.5)],p95Ms:s[Math.ceil(s.length*.95)-1],maxMs:s.at(-1),over100ms:s.filter(x=>x>100).length};};
 const frames=runs.map(r=>({durationMs:r.durationMs,hiddenFrames:r.hiddenFrames,...stats(r.intervals)})),latency=stats(detail.latencies);
 if(detail.latencies.length<30||runs.some(r=>r.hiddenFrames))throw Error('Insufficient or hidden performance samples');
 return {version:'0.6.0',environment:detail.environment,frameIntervals:frames,responseVisualProxy:latency,responseProxyDefinition:'Capture-phase click to second requestAnimationFrame; no screen or audio hardware latency measurement',longTasks:detail.longTasks,answers,targets:{frameP95Ms:33.4,responseP95Ms:100},frameTargetMet:frames.every(f=>f.p95Ms<=33.4),responseTargetMet:latency.p95Ms<=100};
}
