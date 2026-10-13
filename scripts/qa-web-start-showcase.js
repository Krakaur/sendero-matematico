// Visual walkthrough. Playwright video does not record audio; use the separate PCM sample.
async(page)=>{
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();await page.locator('#race-ready').waitFor();
 await page.waitForTimeout(2400);await page.locator('#launch-sound').click();
 await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
 for(let i=0;i<8;i++){
  const q=(await read()).current.questions[i];await page.waitForTimeout(900);
  if(i===2){await page.locator(`[data-answer="${q.options.find(x=>x!==q.answer)}"]`).click();await page.waitForTimeout(1800);}
  await page.locator(`[data-answer="${q.answer}"]`).click();
 }
 await page.locator('#finish-title').waitFor();await page.waitForTimeout(2400);
 await page.locator('#play-again').click();await page.locator('#race-ready').waitFor();await page.waitForTimeout(1800);
 return {version:'0.6.0',visualWalkthrough:'preparation, start, eight answers, error, recovery, finish, replay',completedSessions:(await read()).sessions.length};
}
