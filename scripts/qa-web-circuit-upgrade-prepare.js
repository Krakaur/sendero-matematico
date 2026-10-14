// Disposable public-origin profile, before replacing 0.7.0.
async(page)=>{
 await page.setViewportSize({width:1280,height:800});await page.goto('https://krakaur.github.io/sendero-matematico/#perfiles');
 const f=page.locator('#create-profile');await f.locator('[name=alias]').fill('Continuidad '+Date.now().toString().slice(-5));await f.locator('[name=password]').fill('sendero-prueba');await f.locator('[name=repeat]').fill('sendero-prueba');await f.getByRole('button',{name:'Crear y entrar',exact:true}).click();
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
 if((await read()).current.version!=='0.7.0'||(await read()).current.race.protocol!==3)throw Error('Wrong public baseline');
 for(let i=0;i<8;i++){const q=(await read()).current.questions[i];await page.locator(`[data-answer="${q.answer}"]`).click();}
 await page.locator('#finish-title').waitFor();await page.locator('#play-again').click();await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
 let q=(await read()).current.questions[0];await page.locator(`[data-answer="${q.answer}"]`).click();q=(await read()).current.questions[1];await page.locator(`[data-answer="${q.options.find(n=>n!==q.answer)}"]`).click();
 await page.getByRole('button',{name:'Pausar',exact:true}).click();await page.getByText('Lista sin conexión',{exact:true}).waitFor();
 const result=await page.evaluate(()=>{const before=JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active')));sessionStorage.setItem('sendero.qa.worldUpgrade',JSON.stringify(before));return {sourceVersion:before.current.version,protocol:before.current.race.protocol,index:before.current.index,completedSessions:before.sessions.length,expectedStored:true};});
 await page.goto('about:blank');return result;
}
