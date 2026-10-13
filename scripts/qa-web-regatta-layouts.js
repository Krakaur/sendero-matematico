async (page) => {
  const results=[];
  for(const [width,height] of [[1280,800],[390,844],[360,640],[854,480]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(()=>scrollTo(0,0));
    const result=await page.evaluate(()=>({
      viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,
      answers:[...document.querySelectorAll('.answer')].map(el=>({text:el.textContent,x:el.getBoundingClientRect().x,right:el.getBoundingClientRect().right,bottom:el.getBoundingClientRect().bottom})),
      equation:document.querySelector('.equation').getBoundingClientRect().toJSON(),
      position:document.querySelector('#race-position').getBoundingClientRect().toJSON()
    }));
    if(result.scrollWidth>width || result.answers.some(a=>a.x<0||a.right>width||a.bottom>height)) throw Error('Answers require scrolling: '+JSON.stringify(result));
    if(result.position.bottom>height) throw Error('Position not visible');
    await page.screenshot({path:'output/playwright/ciclo-web-20261013/layout-'+width+'x'+height+'.png'});
    results.push(result);
  }
  return {layouts:results,allAnswersAndPositionVisible:true,physicalDevice:false};
}
