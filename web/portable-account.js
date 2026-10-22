import {validateSnapshot} from './backup.js';

export const PORTABLE_ENDPOINT = 'https://sendero-aula.dirkhans.workers.dev';
const schema='sendero.portable.v1';
const tokenPattern=/^[a-f0-9]{64}$/;
const validRevision=value=>Number.isSafeInteger(value)&&value>=1;
const keyFor=id=>`sendero.portable.${id}`;
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const sha256=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));
const fromHex=s=>Uint8Array.from(s.match(/../g),x=>parseInt(x,16));
const encode=bytes=>{let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out);};
const decode=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
export const displayCode=code=>code.toUpperCase().match(/.{1,4}/g).join('-');
export const normalizeCode=code=>String(code||'').replace(/[\s-]/g,'').toLowerCase();

async function keys(code,password,salt) {
  if(!/^[a-f0-9]{32}$/.test(code))throw Error('El código debe tener 32 caracteres hexadecimales.');
  if(typeof password!=='string'||password.length<10||password.length>128)throw Error('Usa una contraseña de 10 a 128 caracteres.');
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:decode(salt),iterations:210000,hash:'SHA-256'},material,512));
  const cipher=await crypto.subtle.importKey('raw',bits.subarray(32),{name:'AES-GCM'},false,['encrypt','decrypt']);
  return {verifier:hex(bits.subarray(0,32)),cipher,secret:encode(bits.subarray(32))};
}
async function request(path,body,token,fetcher=fetch) {
  const response=await fetcher(PORTABLE_ENDPOINT+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const error=Error(data.error==='account_capacity'?'Se alcanzó la capacidad piloto de cuentas. Conserva una copia local y consulta de nuevo más adelante.':response.status===409?'La copia en la nube cambió en otro dispositivo. No se sobrescribió.':response.status===429?'Se alcanzó el límite diario de este servicio.':response.status===503?'La nube está temporalmente pausada.':response.status===401?'Código o contraseña incorrectos.':data.error||`Servidor: ${response.status}`);error.status=response.status;throw error;}
  return data;
}
async function compress(bytes) {
  const framed=(mode,payload)=>{const out=new Uint8Array(payload.length+1);out[0]=mode;out.set(payload,1);return out;};
  if(!('CompressionStream' in globalThis))return framed(0,bytes);
  const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  const packed=new Uint8Array(await new Response(stream).arrayBuffer());
  return packed.length<bytes.length?framed(1,packed):framed(0,bytes);
}
async function expand(bytes) {
  const MAX_PLAIN=8*1024*1024;
  if(bytes[0]===0){if(bytes.length>MAX_PLAIN+1)throw Error('La copia supera el límite de lectura.');return bytes.subarray(1);}
  if(bytes[0]!==1||!('DecompressionStream' in globalThis))throw Error('Este navegador no puede abrir la copia comprimida.');
  const reader=new Blob([bytes.subarray(1)]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const parts=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_PLAIN){await reader.cancel();throw Error('La copia descomprimida supera 8 MiB.');}parts.push(value);}
  const out=new Uint8Array(size);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length;}return out;
}
async function encrypt(profile,state,cipher) {
  const snapshot=validateSnapshot({profile:{id:profile.id,name:profile.name,role:profile.role},state:structuredClone(state)});
  const serialized=new TextEncoder().encode(JSON.stringify(snapshot));
  if(serialized.length>8*1024*1024)throw Error('El progreso supera 8 MiB. Descarga un respaldo local; la copia remota anterior se conserva.');
  const plain=await compress(serialized);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const data=encode(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(schema)},cipher,plain)));
  if(data.length>512*1024)throw Error('La copia cifrada excede el límite de 512 KiB. Descarga un respaldo local; no se ha reemplazado la copia en la nube.');
  return {schema,iv:encode(iv),data};
}
async function decrypt(envelope,cipher) {
  if(envelope?.schema!==schema||typeof envelope.data!=='string'||envelope.data.length>512*1024||typeof envelope.iv!=='string')throw Error('Copia remota incompatible.');
  try {
    const bytes=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(envelope.iv),additionalData:new TextEncoder().encode(schema)},cipher,decode(envelope.data)));
    return validateSnapshot(JSON.parse(new TextDecoder().decode(await expand(bytes))));
  }catch{throw Error('No se pudo descifrar la copia remota. Conserva los datos de este dispositivo.');}
}
export const portableAuth=(storage,id)=>{try{const value=JSON.parse(storage.getItem(keyFor(id)));return value?.token&&value?.secret?value:null;}catch{return null;}};
export const storePortableAuth=(storage,id,auth)=>storage.setItem(keyFor(id),JSON.stringify(auth));

export async function createPortable(profile,state,password,storage,fetcher=fetch,onCode=()=>{}) {
  const code=hex(crypto.getRandomValues(new Uint8Array(16)));
  const salt=encode(crypto.getRandomValues(new Uint8Array(16)));
  const derived=await keys(code,password,salt);
  onCode(displayCode(code));
  const snapshot=await encrypt(profile,state,derived.cipher);
  const result=await request('/portable/register',{code,salt,verifier:derived.verifier,profileId:profile.id,snapshot},null,fetcher);
  if(!tokenPattern.test(result.token)||result.revision!==1)throw Error('El servidor no confirmó correctamente la cuenta; conserva el código y vuelve a consultar antes de crear otra.');
  const auth={token:result.token,secret:derived.secret,code:displayCode(code),revision:result.revision,syncedAt:new Date().toISOString()};
  let localSaved=true;try{storePortableAuth(storage,profile.id,auth);}catch{localSaved=false;}
  return {code:displayCode(code),auth,localSaved};
}

export async function loginPortable(inputCode,password,fetcher=fetch) {
  const code=normalizeCode(inputCode);
  if(!/^[a-f0-9]{32}$/.test(code))throw Error('Código de cuenta no válido.');
  const {salt}=await request('/portable/challenge',{code},null,fetcher);
  if(typeof salt!=='string'||!/^[A-Za-z0-9+/]{22}==$/.test(salt))throw Error('El servidor devolvió un desafío incompatible.');
  const derived=await keys(code,password,salt);
  const result=await request('/portable/login',{code,verifier:derived.verifier},null,fetcher);
  if(!tokenPattern.test(result.token)||!validRevision(result.revision)||typeof result.profileId!=='string')throw Error('El servidor no confirmó correctamente el acceso.');
  const snapshot=await decrypt(result.snapshot,derived.cipher);
  if(snapshot.profile.id!==result.profileId)throw Error('La copia y la cuenta no corresponden.');
  const auth={token:result.token,secret:derived.secret,code:displayCode(code),revision:result.revision,syncedAt:new Date().toISOString()};
  return {snapshot,auth};
}

export async function uploadPortable(profile,state,auth,fetcher=fetch,onPrepared=()=>{}) {
  let pending=auth.pending;
  if(!pending) {
    const cipher=await crypto.subtle.importKey('raw',decode(auth.secret),{name:'AES-GCM'},false,['encrypt']);
    pending={expectedRevision:auth.revision,operationId:hex(crypto.getRandomValues(new Uint8Array(16))),snapshot:await encrypt(profile,state,cipher)};
    await onPrepared(pending); // Persist before sending so an uncertain acknowledgement can be retried byte-for-byte.
  }
  const result=await request('/portable/save',pending,auth.token,fetcher);
  if(result.revision!==pending.expectedRevision+1||result.operationId!==pending.operationId||result.snapshotDigest!==await sha256(JSON.stringify(pending.snapshot)))throw Error('El servidor no confirmó íntegramente la copia. Se conservará el envío pendiente para reintentar.');
  const {pending:unused,...base}=auth;
  return {...base,revision:result.revision,syncedAt:new Date().toISOString()};
}

export async function fetchPortable(auth,fetcher=fetch) {
  const result=await request('/portable/state',null,auth.token,fetcher);
  if(!validRevision(result.revision)||typeof result.profileId!=='string')throw Error('El servidor devolvió una revisión incompatible.');
  const cipher=await crypto.subtle.importKey('raw',decode(auth.secret),{name:'AES-GCM'},false,['decrypt']);
  const snapshot=await decrypt(result.snapshot,cipher);
  if(snapshot.profile.id!==result.profileId)throw Error('La cuenta y su copia cifrada no corresponden.');
  return {snapshot,revision:result.revision};
}
export async function revokePortable(auth,fetcher=fetch) {
  return request('/portable/logout',{},auth.token,fetcher);
}
