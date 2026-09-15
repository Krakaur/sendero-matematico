const { _electron } = require(process.argv[2]);
const path=require('node:path'),fs=require('node:fs');
(async()=>{
  const dir=path.resolve('output/playwright/windows-profile');
  const app=await _electron.launch({executablePath:path.resolve('dist/win-unpacked/Sendero.exe'),args:['--user-data-dir='+dir]});
  try {
    const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.getByRole('button',{name:/RAZONAMIENTO El taller/}).click();
    let q=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('sendero.state.v1'));return s.current.questions[0];});
    if(!q.bankId)throw Error('Packaged bank unavailable');
    await page.getByRole('button',{name:q.labels?q.labels[q.answer]:String(q.answer),exact:true}).click();
    await page.getByRole('button',{name:/Siguiente paso/}).waitFor();
    await page.screenshot({path:'output/playwright/windows-bank.png'});
    if(errors.length)throw Error(errors.join('\n'));
    const result={packagedApp:true,fileProtocol:page.url().startsWith('file:'),bankQuestion:q.bankId,answerAccepted:true,errors};
    fs.writeFileSync('output/playwright/windows-result.json',JSON.stringify(result,null,2));console.log(result);
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
