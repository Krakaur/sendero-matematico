async(mainPage)=>{
 const context=await mainPage.context().browser().newContext({viewport:{width:1280,height:800},serviceWorkers:'block'}),page=await context.newPage();
 try{
  await page.goto('http://127.0.0.1:8768/');const f=page.locator('#create-profile');await f.locator('[name=alias]').fill('Proyectos QA');for(const n of ['password','repeat'])await f.locator(`[name=${n}]`).fill('sendero-prueba');await f.locator('button').click();await page.locator('[data-mode=calm]').waitFor();
  const exercise=async (page) => {
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const base=page.url().split('#')[0];
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  await page.goto(base+'#taller');
  await page.locator('[data-project-new="all"]').click();
  const results=[];
  const model=()=>page.evaluate(async()=>{const {currentMission,solvedModel}=await import('./workshop.js'),s=JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))).workshop,m=currentMission(s);return {mission:m,solution:solvedModel(m),record:s.records[s.index]};});
  async function construct(){
    const {solution,record}=await model();
    for(const key of ['value','rows','columns'])if(solution[key]!==undefined){
      const delta=solution[key]-record.model[key];
      for(let n=0;n<Math.abs(delta);n++)await page.locator(`[data-project-change="${key}"][data-delta="${Math.sign(delta)}"]`).click();
    }
    if(solution.baskets)for(let i=0;i<solution.baskets.length;i++)for(let n=record.model.baskets[i];n<solution.baskets[i];n++)await page.locator(`[data-project-basket="${i}"][data-delta="1"]`).click();
    if(solution.selected)for(const value of solution.selected)await page.locator(`[data-project-select="${value}"]`).click();
    if(solution.path)for(let i=0;i<3;i++)await page.locator(`[data-project-path="${i}"][data-value="${solution.path[i]}"]`).click();
  }
  for(let i=0;i<8;i++){
    const m=(await model()).mission;
    if(i===0)await page.locator('[data-project-check]').click();
    await construct();
    if(i===1){const before=(await read()).workshop;await page.reload();await page.locator('[data-project-check]').waitFor();if(JSON.stringify((await read()).workshop)!==JSON.stringify(before))throw Error('Reload lost project model');}
    await page.setViewportSize({width:1280,height:800});
    await page.screenshot({path:`output/playwright/web-0.9.0/project-${m.kind}.png`,fullPage:true});
    await page.setViewportSize({width:320,height:568});
    const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,small:[...document.querySelectorAll('.project-game button')].filter(b=>{const r=b.getBoundingClientRect();return r.width&&r.height&&(r.width<43||r.height<43);}).map(b=>b.outerHTML.slice(0,160))}));
    if(layout.overflow||layout.small.length)throw Error(JSON.stringify({kind:m.kind,layout}));
    await page.screenshot({path:`output/playwright/web-0.9.0/project-${m.kind}-mobile.png`,fullPage:true});
    await page.locator('[data-project-check]').click();
    await page.locator(`[data-project-reason="${m.reason}"]`).click();
    if((await model()).record.phase==='verify'){
      await construct();await page.locator('[data-project-check]').click();
    }
    await page.locator('#project-note').fill('Prueba sintética: explicación conservada.');
    results.push({kind:m.kind,phase:(await model()).record.phase,layout});
    await page.locator('[data-project-next]').click();
  }
  await page.getByRole('heading',{name:'¡El bosque tiene nuevas ideas!'}).waitFor();
  const state=await read();
  if(state.workshopHistory.length!==1||!state.workshop.completedAt)throw Error('Workshop history not recorded once');
  await page.reload();
  if((await read()).workshopHistory.length!==1)throw Error('Reload duplicated completion');
  await page.goto(base+'#progreso');
  await page.getByRole('heading',{name:'Proyectos de razonamiento'}).waitFor();
  if(errors.length)throw Error(errors.join('\n'));
  return {projects:results,completed:true,historyPreserved:true,errors};
}
;
  return await exercise(page);
 }finally{await context.close();}
}
