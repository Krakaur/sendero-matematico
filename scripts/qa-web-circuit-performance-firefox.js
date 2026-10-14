// Sustained Firefox measurement on the closed circuit. Not a physical-phone benchmark.
async(page)=>{
 await page.goto('http://127.0.0.1:8767/web/');await page.evaluate(async()=>{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())if(k.startsWith('sendero-'))await caches.delete(k);});await page.goto('about:blank');await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8767/web/#perfiles');
 if(await page.locator('#logout').count())await page.locator('#logout').click();const f=page.locator('#create-profile');await f.locator('[name=alias]').fill('Cadencia '+Date.now().toString().slice(-5));await f.locator('[name=password]').fill('sendero-prueba');await f.locator('[name=repeat]').fill('sendero-prueba');await f.getByRole('button',{name:'Crear y entrar',exact:true}).click();
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();
 const runs=[],latencies=[];
 for(let run=0;run<1;run++){
  await page.locator('#circuit-select').selectOption('cascada');await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
  await page.evaluate(()=>{
   window.__frameRun={frames:[],latencies:[],clicked:null,step:null,started:performance.now(),stopped:false};
   const listener=e=>{if(!e.target.closest('[data-answer]'))return;const p=window.__frameRun;p.clicked=performance.now();p.step=document.querySelector('#route-steps')?.textContent;};
   window.__probeListener=listener;document.addEventListener('click',listener,true);
   let previous=performance.now();const tick=t=>{const p=window.__frameRun;if(p.stopped)return;p.frames.push(t-previous);previous=t;const steps=document.querySelector('#route-steps');if(p.clicked!==null&&steps&&steps.textContent!==p.step){p.latencies.push(performance.now()-p.clicked);p.clicked=null;}requestAnimationFrame(tick);};requestAnimationFrame(tick);
  });
  for(let i=0;i<8;i++){
   await page.waitForTimeout(run<3?7700:1400);
   const s=(await read()).current,q=s.questions[s.index];await page.locator(`[data-answer="${q.answer}"]`).click();
  }
  await page.locator('#finish-title').waitFor();await page.waitForTimeout(900);
  const result=await page.evaluate(()=>{const p=window.__frameRun;p.stopped=true;document.removeEventListener('click',window.__probeListener,true);return {...p,elapsed:performance.now()-p.started,visibility:document.visibilityState,viewport:[innerWidth,innerHeight]};});
  const frames=result.frames.slice(3).sort((a,b)=>a-b);latencies.push(...result.latencies);
  runs.push({run:run+1,durationMs:result.elapsed,samples:frames.length,medianFrameMs:frames[Math.floor(frames.length*.5)],p95FrameMs:frames[Math.floor(frames.length*.95)],over50ms:frames.filter(x=>x>50).length,visibility:result.visibility,latencies:result.latencies});
  if(run===0)await page.screenshot({path:'output/playwright/ciclo-web-6-20261014/firefox/finish-final.png'});
  if(run<0)await page.locator('#play-again').click();
 }
 const sorted=latencies.sort((a,b)=>a-b),result={browser:'headless Firefox',viewport:[1280,800],runs,latency:{n:sorted.length,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1)},measure:'Capture-phase answer click to next animation frame with updated earned-distance feedback; rendering proxy, not photodiode latency'};
 if(runs.slice(0,3).some(r=>r.durationMs<60000)||sorted.length<8)throw Error('Insufficient performance sample');
 if(result.latency.p95Ms>100||runs.some(r=>r.p95FrameMs>33.4))throw Error('Performance target missed '+JSON.stringify(result));
 return result;
}
