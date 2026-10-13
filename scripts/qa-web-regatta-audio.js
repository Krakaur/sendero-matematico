async (page) => {
  const rendered = await page.evaluate(async () => {
    const {playMotif, RiverAudio} = await import('./race-audio.js');
    const events = ['start','correct','error','recover','finish'];
    const context = new OfflineAudioContext(1,44100*10,44100);
    // Schedule each motif in its own two-second interval using the production renderer.
    for (let i=0;i<events.length;i++) {
      const at = i*2;
      const shifted = {currentTime:at,destination:context.destination,createOscillator:()=>context.createOscillator(),createGain:()=>context.createGain()};
      playMotif(shifted,events[i],.65);
    }
    const result = await context.startRendering();
    const data = result.getChannelData(0);
    let peak = 0;
    for(const value of data) { if(!Number.isFinite(value)) throw Error('Nonfinite audio'); peak=Math.max(peak,Math.abs(value)); }
    if(peak>=1 || peak<.01) throw Error('Clipping or missing signal');
    const silent = new OfflineAudioContext(1,44100,44100);
    playMotif(silent,'finish',0);
    const muted = (await silent.startRendering()).getChannelData(0);
    if(muted.some(x=>x!==0)) throw Error('Zero effect volume is audible');
    const live = new RiverAudio();
    live.play('correct',false,.65);
    if(live.context) throw Error('Disabled sound created an audio context');
    live.play('finish',true,.65);
    live.river(true,.2);
    live.mute();
    await new Promise(resolve=>setTimeout(resolve,40));
    if(live.effects.gain.value!==0 || live.ambience!==null) throw Error('Mute leaves sound enabled: gain='+live.effects.gain.value+', river='+(live.ambience!==null)+', context='+live.context.state);
    await live.context.close();
    return {events,peak,sampleRate:result.sampleRate,samples:Array.from(data)};
  });
  const file='output/playwright/ciclo-web-20261013/motivos-del-juego.wav';
  const downloaded=page.waitForEvent('download');
  await page.evaluate(rendered=>{
    const pcm=new ArrayBuffer(44+rendered.samples.length*2),view=new DataView(pcm);
    const text=(s,at)=>[...s].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
    text('RIFF',0);view.setUint32(4,pcm.byteLength-8,true);text('WAVEfmt ',8);
    view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
    view.setUint32(24,rendered.sampleRate,true);view.setUint32(28,rendered.sampleRate*2,true);
    view.setUint16(32,2,true);view.setUint16(34,16,true);text('data',36);view.setUint32(40,pcm.byteLength-44,true);
    rendered.samples.forEach((x,i)=>view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,x))*32767),true));
    const url=URL.createObjectURL(new Blob([pcm],{type:'audio/wav'}));
    const link=document.createElement('a');link.href=url;link.download='motivos-del-juego.wav';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  },rendered);
  await (await downloaded).saveAs(file);
  return {file,events:rendered.events,peak:rendered.peak,durationSeconds:10,renderer:'Production playMotif in OfflineAudioContext',zeroVolumeSilent:true,disabledCreatesNoContext:true,muteStopsEffectsAndRiver:true,perceptualAssessment:'pending'};
}
