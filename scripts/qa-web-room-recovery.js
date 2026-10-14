async(page)=>{
 const base='http://127.0.0.1:8768/',browser=page.context().browser(),contexts=[],errors=[];
 const fresh=async()=>{const c=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});contexts.push(c);const p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));return p;};
 try{
  const host=await fresh();await host.goto(base+'juntos.html');await host.locator('#online-create').click();await host.locator('#room-invitation').waitFor({timeout:30000});const invitation=await host.locator('#room-invitation').inputValue();
  const join=async()=>{const p=await fresh();await p.goto(invitation);await p.locator('#online-join').click();await p.locator('button[data-ready]').waitFor({timeout:30000});return p;};
  const departed=await join();await departed.close();await host.locator('[data-remove-waiting]').waitFor();await host.locator('[data-remove-waiting]').click();
  const guest=await join();await host.waitForFunction(()=>document.querySelectorAll('.room-person').length===2);
  async function start(){for(const p of [host,guest])await p.locator('button[data-ready]').click();await host.locator('#room-start:enabled').waitFor();await host.locator('#room-start').click();for(const p of [host,guest])await p.locator('[data-room-answer]:enabled').first().waitFor();}
  async function answer(p){const nums=(await p.locator('.console-equation').textContent()).match(/(\d+)\s*×\s*(\d+)/).slice(1).map(Number);const b=p.locator(`[data-room-answer="${nums[0]*nums[1]}"]`),index=await b.getAttribute('data-question');await b.click();await p.waitForFunction(i=>!document.querySelector(`[data-question="${i}"][data-room-answer]`),index);await p.waitForTimeout(170);}
  const read=()=>host.evaluate(()=>JSON.parse(sessionStorage.getItem('sendero.together.host')).snapshot);
  await start();await answer(host);await answer(guest);const before=await read();
  await guest.reload();await guest.locator('button[data-ready]').waitFor({timeout:30000});await host.locator('#room-start').waitFor();let recovered=await read();if(recovered.players[1].index!==1||!recovered.players[1].connected)throw Error('Guest reload lost identity or answers');
  await start();await answer(host);await answer(guest);
  await host.reload();await host.locator('#room-start').waitFor({timeout:30000});await guest.locator('#room-reconnect').waitFor({timeout:30000});await guest.locator('#room-reconnect').click();await guest.locator('button[data-ready]').waitFor({timeout:30000});await host.waitForFunction(()=>!document.querySelector('.room-person small')?.textContent.includes('Sin conexión')&&document.querySelectorAll('.room-person').length===2);
  recovered=await read();if(recovered.players.some(p=>p.index!==2))throw Error('Host reload lost the shared match');
  await start();for(let i=2;i<8;i++){await answer(host);await answer(guest);}await host.locator('.room-summary').waitFor();await guest.locator('.room-summary').waitFor();if(await host.locator('tbody').innerText()!==await guest.locator('tbody').innerText())throw Error('Results differ after reconnection');
  await host.screenshot({path:'output/playwright/web-0.9.0/recovered-network-finish.png',fullPage:true});
  if(errors.length)throw Error(errors.join('\n'));return {releasedLobbySeat:true,guestReloadPreserved:true,hostReloadPreserved:true,fullRaceAfterRecovery:true,identicalResults:true,physicalMachines:1,errors};
 }finally{for(const c of contexts)await c.close();}
}
