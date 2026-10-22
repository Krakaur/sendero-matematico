// Persist on a boundary, never on each keystroke. The question object remains
// the single in-memory draft and is included in ordinary session saves.
export function bindBufferedReflection(input,question,persist) {
  if(!input||!question)return ()=>false;
  let saved=String(question.reflection||'');
  const flush=()=>{const current=String(question.reflection||'');if(current===saved)return false;if(persist()===false)return false;saved=current;return true;};
  input.addEventListener('input',()=>{question.reflection=input.value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').slice(0,600);});
  input.addEventListener('change',flush);
  input.addEventListener('blur',flush);
  return flush;
}
