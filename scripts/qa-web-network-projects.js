async(page)=>{
 const base='http://127.0.0.1:8768/',browser=page.context().browser(),contexts=[],errors=[];
 const fresh=async()=>{const c=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});contexts.push(c);const p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));return p;};
 try{
  const host=await fresh();await host.goto(base+'juntos.html');await host.locator('#room-trail').selectOption('razonar');await host.locator('#online-create').click();await host.locator('#room-invitation').waitFor({timeout:30000});const invitation=await host.locator('#room-invitation').inputValue(),pages=[host];
  for(let i=1;i<4;i++){const p=await fresh();await p.goto(invitation);await p.locator('#online-join').click();await p.locator('button[data-ready]').waitFor({timeout:30000});pages.push(p);}
  const read=()=>host.evaluate(()=>JSON.parse(sessionStorage.getItem('sendero.together.host')).snapshot);
  const start=async()=>{for(const p of pages)await p.locator('button[data-ready]').click();await host.locator('#room-start:enabled').waitFor();await host.locator('#room-start').click();for(const p of pages)await p.locator('[data-project-check]:enabled').waitFor();};await start();
  const model=seat=>host.evaluate(async seat=>{const {currentMission,solvedModel}=await import('./workshop.js');const s=JSON.parse(sessionStorage.getItem('sendero.together.host')).snapshot.players[seat].workshop,m=currentMission(s);return {m,solution:solvedModel(m),r:s.records[s.index]};},seat);
  async function click(p,selector){await p.locator(selector+':enabled').click();await p.waitForFunction(()=>!document.querySelector('.room-project > fieldset:disabled'));}
  async function construct(p,seat){const {solution,r}=await model(seat);for(const key of ['value','rows','columns'])if(solution[key]!==undefined){const delta=solution[key]-r.model[key];for(let n=0;n<Math.abs(delta);n++)await click(p,`[data-project-change="${key}"][data-delta="${Math.sign(delta)}"]`);}if(solution.baskets)for(let i=0;i<solution.baskets.length;i++)for(let n=r.model.baskets[i];n<solution.baskets[i];n++)await click(p,`[data-project-basket="${i}"][data-delta="1"]`);if(solution.selected)for(const n of solution.selected)await click(p,`[data-project-select="${n}"]`);if(solution.path)for(let i=0;i<3;i++)await click(p,`[data-project-path="${i}"][data-value="${solution.path[i]}"]`);}
  for(let i=0;i<8;i++){
   for(let seat=0;seat<4;seat++){const p=pages[seat],{m}=await model(seat);if(i===0&&seat===1)await click(p,'[data-project-check]');await construct(p,seat);await click(p,'[data-project-check]');await click(p,`[data-project-reason="${m.reason}"]`);if((await model(seat)).r.phase==='verify'){await construct(p,seat);await click(p,'[data-project-check]');}await click(p,'[data-project-next]');}
   if(i===0){await pages[1].reload();await pages[1].locator('button[data-ready]').waitFor({timeout:30000});const snapshot=await read();if(snapshot.players.some(x=>x.index!==1))throw Error('Project reconnect lost progress');await start();}
  }
  for(const p of pages)await p.locator('.room-summary').waitFor();if(await host.getByRole('columnheader',{name:'Tiempo',exact:true}).count())throw Error('Reasoning summary pressures speed');const snapshot=await read();if(snapshot.players.some(p=>!p.workshop.completedAt))throw Error('Incomplete project match');
  const summaries=await Promise.all(pages.map(p=>p.locator('tbody').innerText()));if(summaries.some(s=>s!==summaries[0]))throw Error('Final project results differ');if(errors.length)throw Error(errors.join('\n'));
  return {participants:4,physicalMachines:1,completedProjects:32,reconnectedGuestPreserved:true,identicalResults:true,errors};
 }finally{for(const c of contexts)await c.close();}
}
