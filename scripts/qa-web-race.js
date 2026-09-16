async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewportSize({width:390,height:844});
 const f=page.locator('#create-profile');await f.locator('[name=alias]').fill('Luma QA');await f.locator('[name=password]').fill('sendero-prueba');await f.locator('[name=repeat]').fill('sendero-prueba');await f.getByRole('button',{name:'Crear y entrar'}).click();
 await page.getByRole('button',{name:'Comenzar aventura',exact:false}).click();
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 await page.locator('.competition').waitFor();await page.screenshot({path:'output/playwright/040-cycle1-race-mobile.png',fullPage:true});
 let s=(await read()).current,q=s.questions[0];if(!s.race)throw Error('Race absent');
 await page.getByRole('button',{name:'Respuesta '+q.options.find(n=>n!==q.answer),exact:true}).click();
 await page.locator('.solution-callout').waitFor();await page.screenshot({path:'output/playwright/040-cycle1-correction.png',fullPage:true});
 await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();if((await read()).current.index!==1)throw Error('Extra tap required');
 await page.getByRole('button',{name:'Pausar',exact:true}).click();let paused=(await read()).current.race.elapsedMs;
 await page.getByRole('button',{name:'Continuar mi aventura',exact:false}).click();
 for(let i=1;i<8;i++){s=(await read()).current;q=s.questions[s.index];if(q.level!==1)throw Error('Race changed level');await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();}
 await page.getByRole('heading',{name:'¡Llegaste a la meta!',exact:true}).waitFor();
 s=(await read()).sessions.at(-1);if(s.race.elapsedMs<paused||s.questions[0].attempts.length!==2)throw Error('Metrics lost');
 await page.screenshot({path:'output/playwright/040-cycle1-results.png',fullPage:true});
 await page.getByRole('link',{name:'Explorar otro camino'}).click();await page.getByRole('button',{name:/A mi ritmo/}).click();
 await page.getByRole('button',{name:'Comenzar aventura',exact:false}).click();if((await read()).current.race)throw Error('Calm has competition');
 await page.getByText('Lista sin conexión',{exact:true}).waitFor();await page.context().setOffline(true);await page.reload();await page.locator('.answers').waitFor();await page.context().setOffline(false);
 if(errors.length)throw Error(errors.join('\n'));return {race:true,oneTap:true,correction:true,fixedLevel:true,calm:true,offline:true,errors};
}
