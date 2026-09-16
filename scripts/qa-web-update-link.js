async (page) => {
  await page.goto('http://127.0.0.1:4174/actualizar.html');
  await page.getByText('La carrera del río',{exact:true}).waitFor({timeout:30000});
  const result=await page.evaluate(async()=>{
    const before=JSON.parse(sessionStorage.getItem('upgrade-before'));
    const after=JSON.parse(localStorage.getItem('sendero.state.v1'));
    if(before.profile!==after.profile || before.current.id!==after.current.id)throw Error('Identity changed');
    if(after.current.index!==1 || document.querySelector('#next'))throw Error('Legacy question not advanced once');
    if(JSON.stringify(before.current.questions[0])!==JSON.stringify(after.current.questions[0]))throw Error('Answer changed');
    if(JSON.stringify(before.current.adaptation)!==JSON.stringify(after.current.adaptation))throw Error('Adaptation changed');
    return {version:(await import('/core.js')).VERSION,profilePreserved:true,answerPreserved:true,adaptationPreserved:true,index:after.current.index,caches:await caches.keys()};
  });
  await page.context().setOffline(true);
  await page.reload();
  await page.getByText('La carrera del río',{exact:true}).waitFor();
  const index=await page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.state.v1')).current.index);
  if(index!==1)throw Error('Migration repeated on reload');
  await page.context().setOffline(false);
  return {...result,directUpdateLink:true,offlineReload:true};
}
