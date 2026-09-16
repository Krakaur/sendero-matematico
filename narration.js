export function localSpanishVoice(synth=globalThis.speechSynthesis) {
  return synth?.getVoices().find(v=>v.localService && /^es(?:-|_)/i.test(v.lang));
}
export function narrateLocally(text,onEnd=()=>{}) {
 const synth=globalThis.speechSynthesis,voice=localSpanishVoice(synth);
 if(!voice)return false;
 synth.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.85;
 utterance.onend=onEnd;utterance.onerror=onEnd;synth.speak(utterance);return true;
}
