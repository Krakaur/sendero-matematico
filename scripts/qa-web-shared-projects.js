async(page)=>{
 const context=await page.context().browser().newContext({viewport:{width:1280,height:800},serviceWorkers:'block'}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 try{
  await p.goto('http://127.0.0.1:8768/juntos.html');await p.locator('#room-trail').selectOption('razonar');
  if(await p.locator('#room-mode').inputValue()!=='coop'||!await p.locator('#room-mode').isDisabled())throw Error('Reasoning was made competitive');
  await p.locator('#local-create').click();
  const start=async()=>{for(const id of ['local-0','local-1'])await p.locator(`button[data-ready="${id}"]`).click();await p.locator('#room-start').click();await p.locator('[data-project-check]:enabled').first().waitFor();};
  await start();
  const read=()=>p.evaluate(()=>JSON.parse(sessionStorage.getItem('sendero.together.local')));
  const model=seat=>p.evaluate(async seat=>{const {currentMission,solvedModel}=await import('./workshop.js');const s=JSON.parse(sessionStorage.getItem('sendero.together.local')).players[seat].workshop,m=currentMission(s);return {mission:m,solution:solvedModel(m),record:s.records[s.index]};},seat);
  async function construct(seat){const root=p.locator(`.room-project[data-seat="${seat}"]`),{solution,record}=await model(seat);
   for(const key of ['value','rows','columns'])if(solution[key]!==undefined){const delta=solution[key]-record.model[key];for(let n=0;n<Math.abs(delta);n++)await root.locator(`[data-project-change="${key}"][data-delta="${Math.sign(delta)}"]`).click();}
   if(solution.baskets)for(let i=0;i<solution.baskets.length;i++)for(let n=record.model.baskets[i];n<solution.baskets[i];n++)await root.locator(`[data-project-basket="${i}"][data-delta="1"]`).click();
   if(solution.selected)for(const n of solution.selected)await root.locator(`[data-project-select="${n}"]`).click();
   if(solution.path)for(let i=0;i<3;i++)await root.locator(`[data-project-path="${i}"][data-value="${solution.path[i]}"]`).click();
  }
  for(let i=0;i<8;i++){
   for(let seat=0;seat<2;seat++){
    const root=p.locator(`.room-project[data-seat="${seat}"]`),m=(await model(seat)).mission;
    if(i===0&&seat===0)await root.locator('[data-project-check]').click();
    await construct(seat);await root.locator('[data-project-check]').click();await root.locator(`[data-project-reason="${m.reason}"]`).click();
    if((await model(seat)).record.phase==='verify'){await construct(seat);await root.locator('[data-project-check]').click();}
    await root.locator('[data-project-next]').click();
   }
   if(i===0){await p.locator('#room-pause').click();const before=await read();await p.reload();await p.locator('#room-start').waitFor();if(JSON.stringify((await read()).players.map(x=>x.workshop))!==JSON.stringify(before.players.map(x=>x.workshop)))throw Error('Shared projects lost after reload');await start();}
   if(i===1){for(const [width,height] of [[1280,800],[390,844],[320,568],[854,480]]){await p.setViewportSize({width,height});const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)throw Error('Shared project overflow '+width);await p.screenshot({path:`output/playwright/web-0.9.0/shared-projects-${width}.png`,fullPage:true});}}
  }
  await p.locator('.room-summary').waitFor();if(await p.getByRole('columnheader',{name:'Posición',exact:true}).count())throw Error('Projects ranked participants');
  if((await read()).players.some(x=>!x.workshop.completedAt))throw Error('Shared project ended early');
  if(errors.length)throw Error(errors.join('\n'));return {projectsPerPerson:8,localParticipants:2,correctionThenNewConstruction:true,reloadPreserved:true,smallScreens:true,noRanking:true,errors};
 }finally{await context.close();}
}
