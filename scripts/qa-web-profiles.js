async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('heading',{name:'¿Quién va a usar Sendero?'}).waitFor();
 const create=async(name,password)=>{
   const form=page.locator('#create-profile');await form.locator('[name=alias]').fill(name);
   await form.locator('[name=password]').fill(password);await form.locator('[name=repeat]').fill(password);
   await form.getByRole('button',{name:'Crear y entrar'}).click();
   await page.getByRole('button',{name:'Comenzar aventura',exact:false}).waitFor();
 };
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 await create('Luna','sendero-luna');const first=(await read()).profile;
 await page.getByRole('button',{name:'Comenzar aventura',exact:false}).click();
 const q=(await read()).current.questions[0];
 await page.getByRole('button',{name:'Respuesta '+q.answer,exact:true}).click();
 if((await read()).current.index!==1)throw Error('No one tap');
 await page.getByRole('link',{name:/Perfil activo:/}).click();
 await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
 await create('Sol','sendero-sol');const second=(await read()).profile;
 if(first===second || (await read()).current)throw Error('Profiles mixed');
 await page.getByRole('link',{name:/Perfil activo:/}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
 const form=page.locator('#login-profile');await form.locator('select').selectOption(first);
 await form.locator('[name=password]').fill('incorrecta');await form.getByRole('button',{name:'Entrar',exact:true}).click();
 await page.getByText('Contraseña incorrecta.',{exact:true}).waitFor();
 await form.locator('[name=password]').fill('sendero-luna');await form.getByRole('button',{name:'Entrar',exact:true}).click();
 await page.getByRole('button',{name:'Continuar mi aventura',exact:false}).waitFor();
 if((await read()).profile!==first || (await read()).current.index!==1)throw Error('Pending state lost');
 await page.getByText('Lista sin conexión',{exact:true}).waitFor();
 await page.context().setOffline(true);await page.reload();
 await page.getByRole('button',{name:'Continuar mi aventura',exact:false}).click();
 if((await read()).current.index!==1)throw Error('Offline state lost');
 await page.screenshot({path:'output/playwright/040-profile-active.png'});
 await page.context().setOffline(false);
 if(errors.length)throw Error(errors.join('\n'));
 return {twoProfiles:true,passwordCheck:true,pendingPreserved:true,offline:true,errors};
}
