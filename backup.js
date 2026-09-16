import {validateReport,SCHEMA,TRAILS} from './core.js';import {validBankQuestion} from './bank.js';
import {profileList,profileKey,passwordRecord,PROFILE_INDEX} from './profiles.js';
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const base64=b=>{let s='';for(const x of new Uint8Array(b))s+=String.fromCharCode(x);return btoa(s);};
const schema='sendero.backup.v1',iterations=210000;
async function key(password,salt){if(typeof password!=='string'||password.length<10||password.length>128)throw Error('Usa una contraseña de respaldo de 10 a 128 caracteres.');const raw=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
export function validateSnapshot(data) {
 const p=data?.profile,s=data?.state;
 if(!p||!s||typeof p.name!=='string'||p.name.length<2||p.name.length>24||!['student','teacher'].includes(p.role)||p.id!==s.profile)throw Error('Perfil de respaldo no válido.');
 validateReport({schema:SCHEMA,profile:s.profile,sessions:s.sessions});
 if(!Array.isArray(s.teacher)||s.teacher.length>5000||!s.adaptive||typeof s.adaptive!=='object')throw Error('Estado no válido.');
 for(const item of s.teacher)validateReport({schema:SCHEMA,profile:item.profile,sessions:[item]});
 if(s.current){
  const c=s.current;if(c.profile!==s.profile||!Object.hasOwn(TRAILS,c.trail)||!Number.isInteger(c.index)||c.index<0||c.index>7||!Array.isArray(c.questions)||!c.questions[c.index])throw Error('Partida pendiente no válida.');
  for(const q of c.questions){
   if(!Number.isInteger(q.level)||q.level<1||q.level>4||!Array.isArray(q.attempts)||!Array.isArray(q.options)||q.options.length!==4||new Set(q.options).size!==4||!q.options.includes(q.answer)||!q.attempts.every(n=>q.options.includes(n))||!Number.isFinite(q.activeMs)||q.activeMs<0)throw Error('Ejercicio pendiente no válido.');
   if(q.bankId){if(!validBankQuestion(q))throw Error('Banco incompatible.');}
   else {if(![q.a,q.b,q.answer,...q.options].every(n=>Number.isInteger(n)&&n>=0&&n<=2500)||q.a>50||q.b>50)throw Error('Cantidades inválidas.');const answer=c.trail==='suma'?q.a+q.b:c.trail==='resta'?q.a-q.b:q.a*q.b;if(q.answer!==answer)throw Error('Operación pendiente no válida.');}
  }
 }
 // Tokens are not portable by default: re-link with the adult on the destination.
 delete s.classroom;
 return data;
}
export async function encryptBackup(profile,state,password) {
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const data={profile:{id:profile.id,name:profile.name,role:profile.role},state:structuredClone(state)};delete data.state.classroom;
 validateSnapshot(data);const plaintext=new TextEncoder().encode(JSON.stringify(data));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(schema)},await key(password,salt),plaintext);
 return {schema,kdf:'PBKDF2-SHA256',iterations,cipher:'AES-256-GCM',salt:base64(salt),iv:base64(iv),data:base64(encrypted)};
}
export async function decryptBackup(envelope,password) {
 if(envelope?.schema!==schema||envelope.iterations!==iterations||envelope.kdf!=='PBKDF2-SHA256'||envelope.cipher!=='AES-256-GCM'||typeof envelope.data!=='string'||envelope.data.length>28*1024*1024)throw Error('Formato de respaldo no válido.');
 try {const salt=bytes(envelope.salt),iv=bytes(envelope.iv);if(salt.length!==16||iv.length!==12)throw Error();
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(schema)},await key(password,salt),bytes(envelope.data));
 return validateSnapshot(JSON.parse(new TextDecoder().decode(plain)));
 }catch{throw Error('No se pudo abrir el respaldo. Comprueba la contraseña, integridad y versión del archivo.');}
}
export async function restoreSnapshot(storage,snapshot,newPassword) {
 const {profile,state}=validateSnapshot(structuredClone(snapshot)),credential=await passwordRecord(newPassword),list=profileList(storage),existing=list.findIndex(p=>p.id===profile.id);
 if(existing<0&&list.length>=8)throw Error('No hay espacio para otro perfil.');
 if(list.some(p=>p.id!==profile.id&&p.name.toLocaleLowerCase('es')===profile.name.toLocaleLowerCase('es')))throw Error('Otro perfil ya utiliza ese alias. Cambia su alias antes de recuperar la copia.');
 const key=profileKey(profile.id),previous=storage.getItem(key),oldIndex=storage.getItem(PROFILE_INDEX);
 if(previous)storage.setItem(`sendero.restore.previous.${profile.id}`,previous);
 const p={...profile,password:credential};if(existing<0)list.push(p);else list[existing]=p;
 try{storage.setItem(key,JSON.stringify(state));storage.setItem(PROFILE_INDEX,JSON.stringify(list));}
 catch(error){if(previous)storage.setItem(key,previous);if(oldIndex)storage.setItem(PROFILE_INDEX,oldIndex);throw error;}
 return p;
}
