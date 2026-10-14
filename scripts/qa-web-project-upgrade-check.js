async(page)=>{
 await page.goto('https://krakaur.github.io/sendero-matematico/actualizar.html');
 await page.waitForURL('**/#jugar');await page.getByText('Lista sin conexión',{exact:true}).waitFor({timeout:20000});
 const before=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('sendero.qa.projectsUpgrade'))),read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 const after=await read();
 if(!before||JSON.stringify(before.sessions)!==JSON.stringify(after.sessions)||before.current.id!==after.current.id)throw Error('Upgrade changed saved history');
 for(const key of ['protocol','seed','cadence','finishMs','level','targetMs'])if(JSON.stringify(before.current.race[key])!==JSON.stringify(after.current.race[key]))throw Error('Upgrade changed rivals '+key);
 for(let i=0;i<2;i++)if(JSON.stringify(before.current.questions[i].attempts)!==JSON.stringify(after.current.questions[i].attempts)||before.current.questions[i].firstResponseMs!==after.current.questions[i].firstResponseMs)throw Error('Upgrade changed attempts or first-response time');
 const version=await page.evaluate(async()=>{const {VERSION}=await import('./core.js');return VERSION;});if(version!=='0.9.0')throw Error('Old code still served');
 await page.locator('.solution-callout').waitFor();
 let s=(await read()).current;while(s){const q=s.questions[s.index];await page.locator(`[data-answer="${q.answer}"]`).click();s=(await read()).current;}
 await page.locator('#finish-title').waitFor();await page.locator('#play-again').click();await page.locator('#race-ready').waitFor();
 if((await read()).current.race.protocol!==3||(await read()).current.version!=='0.9.0')throw Error('New race not upgraded');
 await page.getByText('Lista sin conexión',{exact:true}).waitFor();await page.context().setOffline(true);
 try{await page.reload();await page.locator('#race-ready').waitFor();await page.locator('#race-ready').click();await page.locator('.answers').waitFor();const q=(await read()).current.questions[0];await page.locator(`[data-answer="${q.answer}"]`).click();await page.waitForTimeout(1000);await page.screenshot({path:'output/playwright/web-0.9.0/public-upgraded-offline.png'});}finally{await page.context().setOffline(false);}
 await page.getByRole('button',{name:'Pausar',exact:true}).click();await page.goto('https://krakaur.github.io/sendero-matematico/#taller');await page.locator('[data-project-new=all]').click();await page.getByText('Lista sin conexión',{exact:true}).waitFor();await page.context().setOffline(true);try{await page.reload();await page.locator('[data-project-change=value][data-delta="1"]').click();await page.screenshot({path:'output/playwright/web-0.9.0/public-project-offline.png',fullPage:true});}finally{await page.context().setOffline(false);}return {version,historyPreserved:true,oldPendingProtocol:3,oldRaceFinished:true,newRaceProtocol:3,offlineArtAndAnswer:true,offlineProjectConstruction:true,completedSessions:(await read()).sessions.length};
}
