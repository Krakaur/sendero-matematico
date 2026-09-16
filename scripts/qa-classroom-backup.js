async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 await page.getByRole('button',{name:'Pausar',exact:true}).click();
 await page.getByRole('link',{name:'Docentes',exact:true}).click();
 await page.locator('#class-invite').setInputFiles('qa-private/student-invitation.json');
 await page.getByText(/Última confirmación:/).waitFor();
 if(!(await read()).classroom.received.length)throw Error('No receipt');
 await page.getByRole('link',{name:/Perfil activo:/}).click();
 await page.locator('#backup-profile [name=password]').fill('respaldo-seguro');
 const downloadPromise=page.waitForEvent('download');await page.locator('#backup-profile button').click();const download=await downloadPromise;await download.saveAs('qa-private/browser-backup.json');
 const old=(await read()).profile,current=(await read()).current.id;
 await page.locator('#restore-profile [name=file]').setInputFiles('qa-private/browser-backup.json');await page.locator('#restore-profile [name=password]').fill('respaldo-seguro');await page.locator('#restore-profile [name=new-password]').fill('sendero-nueva');await page.locator('#restore-profile button').click();
 await page.getByText('Perfil recuperado. Entra con la nueva contraseña.',{exact:true}).waitFor();
 await page.locator('#login-profile [name=password]').fill('sendero-nueva');await page.locator('#login-profile button').click();await page.getByRole('button',{name:/Continuar mi aventura/}).waitFor();
 if((await read()).profile!==old||(await read()).current.id!==current||(await read()).classroom)throw Error('Restore mismatch');
 await page.getByRole('link',{name:/Perfil activo:/}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
 const f=page.locator('#create-profile');await f.locator('[name=alias]').fill('Docente QA');await f.locator('[name=role]').selectOption('teacher');await f.locator('[name=password]').fill('docente-prueba');await f.locator('[name=repeat]').fill('docente-prueba');await f.getByRole('button',{name:'Crear y entrar'}).click();
 await page.locator('#class-invite').setInputFiles('qa-private/teacher-invitation.json');await page.getByText(/Última confirmación:/).waitFor();
 if((await read()).teacher.length!==1)throw Error('Teacher did not receive');
 await page.locator('#class-task [name=title]').fill('Sumas de la semana');await page.locator('#class-task button').click();await page.getByText('Sumas de la semana',{exact:true}).waitFor();
 await page.screenshot({path:'output/playwright/040-teacher.png',fullPage:true});if(errors.length)throw Error(errors.join('\n'));
 return {syntheticReceipt:true,teacherReceived:true,taskPublishedLocally:true,encryptedBackupRestored:true,errors};
}
