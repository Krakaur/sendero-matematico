const {_electron}=require(process.argv[2]);
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 const app=await _electron.launch({executablePath:path.resolve('dist/win-unpacked/Sendero.exe'),args:['--user-data-dir='+path.resolve('output/playwright/windows-031-'+Date.now())]});
 try {
  const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.getByRole('button',{name:'Comenzar aventura',exact:false}).click();
  for(let i=0;i<8;i++){
   const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.state.v1')).current);
   if(s.index!==i)throw Error('Wrong automatic advance');
   await page.getByRole('button',{name:'Respuesta '+s.questions[i].answer,exact:true}).click();
  }
  await page.getByRole('link',{name:'Ver mi progreso',exact:true}).click();
  await page.getByRole('heading',{name:'Fluidez de cálculo',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/031-windows.png'});
  const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.state.v1')));
  if(s.sessions.length!==1||s.current!==null||s.sessions[0].questions.some(q=>q.firstResponseMs<=0))throw Error('Missing persisted timing');
  if(errors.length)throw Error(errors.join('\n'));
  const result={packagedApp:true,fileProtocol:page.url().startsWith('file:'),oneTap:true,completed:1,version:s.sessions[0].version,errors};
  fs.writeFileSync('output/playwright/031-windows-result.json',JSON.stringify(result,null,2));console.log(result);
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
