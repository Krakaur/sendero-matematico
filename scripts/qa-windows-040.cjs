const {_electron}=require(process.argv[2]);
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 const app=await _electron.launch({executablePath:path.resolve('dist/win-unpacked/Sendero.exe'),args:['--user-data-dir='+path.resolve('output/playwright/windows-040-'+Date.now())]});
 try {
  const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const f=page.locator('#create-profile');await f.locator('[name=alias]').fill('Windows QA');await f.locator('[name=password]').fill('sendero-prueba');await f.locator('[name=repeat]').fill('sendero-prueba');await f.getByRole('button',{name:'Crear y entrar'}).click();
  await page.getByRole('button',{name:'Comenzar aventura',exact:false}).click();
  for(let i=0;i<8;i++){
   const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))).current);
   if(s.index!==i)throw Error('Wrong automatic advance');
   await page.getByRole('button',{name:'Respuesta '+s.questions[i].answer,exact:true}).click();
  }
  await page.getByRole('link',{name:'Ver mi progreso',exact:true}).click();
  await page.getByRole('heading',{name:'Precisión y ritmo',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/040-windows.png'});
  const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
  if(s.sessions.length!==1||s.current!==null||s.sessions[0].questions.some(q=>q.firstResponseMs<=0))throw Error('Missing persisted timing');
  if(errors.length)throw Error(errors.join('\n'));
  const result={packagedApp:true,fileProtocol:page.url().startsWith('file:'),oneTap:true,completed:1,version:s.sessions[0].version,errors};
  fs.writeFileSync('output/playwright/040-windows-result.json',JSON.stringify(result,null,2));console.log(result);
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
