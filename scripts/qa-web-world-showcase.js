// A paced complete race, including one correction. Synthetic local profile.
async(page)=>{
 await page.goto('http://127.0.0.1:8765/web/#perfiles');await page.setViewportSize({width:1280,height:800});if(await page.locator('#logout').count())await page.locator('#logout').click();
 const f=page.locator('#create-profile');await f.locator('[name=alias]').fill('Luna');await f.locator('[name=password]').fill('sendero-prueba');await f.locator('[name=repeat]').fill('sendero-prueba');await f.getByRole('button',{name:'Crear y entrar',exact:true}).click();await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();await page.locator('#race-ready').waitFor();await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(600);
 await page.screenshot({path:'output/playwright/ciclo-web-5-20261014/showcase-preparation.png'});await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 for(let i=0;i<8;i++){
  await page.waitForTimeout(6900);const q=(await read()).current.questions[i];
  if(i===2){await page.locator(`[data-answer="${q.options.find(n=>n!==q.answer)}"]`).click();await page.waitForTimeout(1000);await page.screenshot({path:'output/playwright/ciclo-web-5-20261014/showcase-recovery.png'});}
  await page.locator(`[data-answer="${q.answer}"]`).click();
  if([3,5].includes(i)){await page.waitForTimeout(800);await page.screenshot({path:`output/playwright/ciclo-web-5-20261014/showcase-race-${i+1}.png`});}
 }
 await page.locator('#finish-title').waitFor();await page.waitForTimeout(1200);await page.screenshot({path:'output/playwright/ciclo-web-5-20261014/showcase-finish.png'});
 const s=(await read()).sessions.at(-1);return {completed:true,elapsedMs:s.race.elapsedMs,questions:s.questions.length,firstAttemptCorrect:s.questions.filter(q=>q.attempts.length===1).length,challenge:s.race.challenge,seed:s.race.seed};
}
