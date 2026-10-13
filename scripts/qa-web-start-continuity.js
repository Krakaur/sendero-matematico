// Fresh synthetic profile; real logout/login and cancellation controls.
async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();await page.locator('#race-ready').waitFor();
 const before=(await read()).current;
 await page.goto(page.url().split('#')[0]+'#perfiles');await page.locator('#logout').click();
 await page.locator('#login-profile [name=profile]').selectOption(before.profile);
 await page.locator('#login-profile [name=password]').fill('sendero-prueba');
 await page.locator('#login-profile').getByRole('button',{name:'Entrar',exact:true}).click();
 await page.locator('#quick-start').click();await page.locator('#race-ready').waitFor();
 const unchanged=async()=>{const s=(await read()).current;if(s.id!==before.id||s.race.elapsedMs!==0||s.questions[0].timingInterrupted||s.questions[0].activeMs||s.questions[0].attempts.length)throw Error('Unstarted race was timed or invalidated');};
 await unchanged();
 await page.locator('#race-ready').click();await page.waitForTimeout(500);await page.locator('#launch-cancel').click();
 await page.locator('#race-ready').waitFor();await page.waitForTimeout(2000);await unchanged();
 await page.locator('#race-ready').click();await page.waitForTimeout(300);
 await page.goto(page.url().split('#')[0]+'docentes.html');await page.goBack();
 await page.locator('#race-ready').waitFor();await unchanged();
 await page.locator('#race-ready').click();await page.waitForTimeout(300);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#race-ready').waitFor();await unchanged();
 await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
 const q=(await read()).current.questions[0];await page.waitForTimeout(250);await page.locator(`[data-answer="${q.answer}"]`).click();
 const answered=(await read()).current.questions[0];
 if(answered.timingInterrupted||!answered.firstResponseMs)throw Error('Relogin lost valid first response');
 await page.emulateMedia({reducedMotion:'no-preference'});
 if(errors.length)throw Error(errors.join('\n'));
 return {version:'0.6.0',logoutLoginKeepsPreparedRaceUntimed:true,cancelButtonWorks:true,leavePageAndBackResetsCountdown:true,osMotionChangeCancelsCountdown:true,firstResponseAfterReloginMs:answered.firstResponseMs,errors};
}
