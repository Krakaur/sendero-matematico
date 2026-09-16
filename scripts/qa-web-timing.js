async (page) => {
 await page.clock.install();
 await page.goto('http://127.0.0.1:4173/#explorar');
 await page.getByRole('button',{name:'Comenzar aventura',exact:false}).click();
 await page.clock.fastForward(61000);
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.state.v1')).current);
 let s=await read();
 if(!s.questions[0].timingInterrupted)throw Error('Idle interval eligible for fluency');
 await page.getByRole('button',{name:'Respuesta '+s.questions[0].answer,exact:true}).dblclick();
 s=await read();
 if(s.index!==1||s.questions[1].attempts.length!==0)throw Error('Double click answered the next question');
 await page.locator('#hint').click();
 s=await read();
 if(!s.questions[1].hint)throw Error('Hint not preserved');
 await page.getByRole('button',{name:'Respuesta '+s.questions[1].answer,exact:true}).click();
 s=await read();
 if(s.index!==2)throw Error('Assisted answer requires extra confirmation');
 const result=await page.evaluate(async()=>{
  const {fluency}=await import('/fluency.js');
  return fluency(JSON.parse(localStorage.getItem('sendero.state.v1')).current.questions.slice(0,2));
 });
 if(result.n!==0||result.excluded!==2)throw Error('Interrupted/assisted time included');
 return {simulatedIdleSeconds:61,doubleClickAdvancesOnce:true,hintsExcluded:true,result};
}
