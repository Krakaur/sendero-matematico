// Capture only this game's Web Audio graph, never a microphone or system audio.
// Run with a new synthetic profile (qa-web-regatta-prepare.js).
async(page)=>{
 const out='output/playwright/ciclo-web-4-20261013/';
 await page.reload();await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).click();await page.locator('#race-ready').waitFor();
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sendero.profile.'+sessionStorage.getItem('sendero.active'))));
 if((await read()).sound)throw Error('Audio capture requires a fresh muted profile');
 await page.evaluate(async()=>{
  const capture=window.__gameAudio={events:[],chunks:[],processor:null},connect=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(destination,...args){
   const result=connect.call(this,destination,...args);
   if(destination===this.context.destination && this.context instanceof AudioContext){
    if(!capture.processor){
     capture.context=this.context;capture.graphStart=this.context.currentTime;
     // QA-only PCM tap avoids encoder timestamp gaps; this is not shipped code.
     capture.processor=this.context.createScriptProcessor(2048,1,1);
     capture.processor.onaudioprocess=e=>capture.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
     connect.call(capture.processor,this.context.destination); // zero output buffer
     capture.keepAlive=this.context.createConstantSource();capture.keepAlive.offset.value=0;
     connect.call(capture.keepAlive,capture.processor);capture.keepAlive.start();
    }
    connect.call(this,capture.processor);
   }
   return result;
  };
  const {RiverAudio}=await import('./race-audio.js'),play=RiverAudio.prototype.play;
  RiverAudio.prototype.play=function(event,enabled,...args){capture.events.push({event,enabled,time:performance.now()});return play.call(this,event,enabled,...args);};
 });
 await page.locator('#launch-sound').click();await page.waitForTimeout(600);
 await page.locator('#race-ready').click();await page.locator('.answers').waitFor();
 for(let i=0;i<8;i++){
  await page.waitForTimeout(600);const q=(await read()).current.questions[i];
  if(i===2){await page.locator(`[data-answer="${q.options.find(x=>x!==q.answer)}"]`).click();await page.waitForTimeout(700);}
  await page.locator(`[data-answer="${q.answer}"]`).click();
 }
 await page.locator('#finish-title').waitFor();await page.waitForTimeout(1500);
 await page.locator('#sound').click();
 await page.evaluate(()=>window.__gameAudio.mutedAt=window.__gameAudio.context.currentTime);
 await page.waitForFunction(()=>window.__gameAudio.context.currentTime-window.__gameAudio.mutedAt>=1.5,{},{timeout:10000});
 await page.evaluate(()=>{const c=window.__gameAudio;c.processor.onaudioprocess=null;c.processor.disconnect();c.keepAlive.stop();c.graphStop=c.context.currentTime;});
 const downloaded=page.waitForEvent('download');
 const result=await page.evaluate(async()=>{
  const capture=window.__gameAudio,rate=capture.context.sampleRate;
  const samples=new Float32Array(capture.chunks.reduce((n,chunk)=>n+chunk.length,0));let at=0;
  for(const chunk of capture.chunks){samples.set(chunk,at);at+=chunk.length;}
  let peak=0,sum=0,tailSum=0,tailN=0;
  for(let i=0;i<samples.length;i++){const value=samples[i];peak=Math.max(peak,Math.abs(value));sum+=value*value;if(i>samples.length-rate*.3){tailSum+=value*value;tailN++;}}
  const pcm=new ArrayBuffer(44+samples.length*2),view=new DataView(pcm),text=(s,at)=>[...s].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
  text('RIFF',0);view.setUint32(4,pcm.byteLength-8,true);text('WAVEfmt ',8);view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text('data',36);view.setUint32(40,pcm.byteLength-44,true);
  samples.forEach((x,i)=>view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,x))*32767),true));
  const url=URL.createObjectURL(new Blob([pcm],{type:'audio/wav'})),link=document.createElement('a');link.href=url;link.download='salida-y-carrera.wav';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  return {sampleRate:rate,durationSeconds:samples.length/rate,audioGraphSeconds:capture.graphStop-capture.graphStart,peak,rms:Math.sqrt(sum/samples.length),mutedTailRms:Math.sqrt(tailSum/tailN),events:capture.events.map(e=>({event:e.event,enabled:e.enabled,msFromFirstEvent:e.time-capture.events[0].time}))};
 });
 await (await downloaded).saveAs(out+'salida-y-carrera.wav');
 if(result.peak>=1||result.peak<.01||result.mutedTailRms>.001)throw Error('Missing signal, clipping or non-silent muted tail: '+JSON.stringify(result));
 return {version:'0.6.0',capture:'QA-only PCM tap of the production Web Audio graph; no microphone/system audio',file:out+'salida-y-carrera.wav',...result,perceptualListeningAssessment:'pending'};
}
