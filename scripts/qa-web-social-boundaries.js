async(page)=>{
 const base='http://127.0.0.1:8767/web/',contexts=[];
 await page.goto(base+'juntos.html');if(await page.locator('#room-exit').count())await page.locator('#room-exit').click();
 await page.locator('#online-create').click();await page.locator('#room-invitation').waitFor({timeout:25000});const invitation=await page.locator('#room-invitation').inputValue();
 const guest=async(url)=>{const c=await page.context().browser().newContext();contexts.push(c);const p=await c.newPage();await p.goto(url);await p.locator('#online-join').click();return p;};
 const bad=new URL(invitation),params=new URLSearchParams(bad.hash.slice(1));params.set('llave','0'.repeat(32));bad.hash=params.toString();const rejected=await guest(bad.href);await rejected.locator('.room-error').waitFor({timeout:30000});
 if(await page.locator('.room-person').count()!==1)throw Error('Wrong key joined the room');
 const participants=[];for(let i=0;i<3;i++){const p=await guest(invitation);await p.locator('button[data-ready]').waitFor({timeout:30000});participants.push(p);}
 await page.waitForFunction(()=>document.querySelectorAll('.room-person').length===4);const fifth=await guest(invitation);await fifth.locator('.room-error').waitFor({timeout:30000});
 if(await page.locator('.room-person').count()!==4)throw Error('Capacity boundary failed');
 const result={wrongKeyRejected:true,fifthParticipantRejected:true,hostRosterUnaffected:true,wrongKeyMessage:await rejected.locator('.room-error').innerText(),fullRoomMessage:await fifth.locator('.room-error').innerText()};
 await page.locator('#room-exit').click();for(const c of contexts)await c.close();return result;
}
