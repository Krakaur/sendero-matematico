// Local access control. Data is not encrypted at rest; never a server identity.
export const PROFILE_INDEX = 'sendero.profiles.v1';
export const LEGACY_KEY = 'sendero.state.v1';
export const profileKey = id => `sendero.profile.${id}`;
const iterations = 210000;
const hex = bytes => Array.from(bytes, x => x.toString(16).padStart(2,'0')).join('');
export async function passwordRecord(password, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  if(typeof password !== 'string' || password.length < 6 || password.length > 128) throw Error('Usa una contraseña de 6 a 128 caracteres.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations,hash:'SHA-256'},key,256);
  return {salt,hash:hex(new Uint8Array(bits)),iterations};
}
export function profileList(storage) {
  const raw = storage.getItem(PROFILE_INDEX);
  const list = raw ? JSON.parse(raw) : [];
  if(!Array.isArray(list) || list.length>8 || list.some(p=>!p.id||!p.name)) throw Error('No se pudo leer la lista de perfiles. No borres los datos.');
  return list;
}
export function migrateLegacy(storage) {
  if(storage.getItem(PROFILE_INDEX)) return null;
  const raw = storage.getItem(LEGACY_KEY);
  if(!raw) return null;
  const s = JSON.parse(raw);
  if(!s.profile || !Array.isArray(s.sessions) || !Array.isArray(s.teacher)) throw Error('El registro anterior no es válido. Se conserva sin modificar.');
  const p = {id:s.profile,name:'Mi perfil anterior',role:'student',password:null};
  storage.setItem(profileKey(p.id), raw);
  storage.setItem(PROFILE_INDEX, JSON.stringify([p]));
  return p;
}
export async function createProfile(storage, name, password, role, state) {
  name=name.trim();
  if(name.length<2 || name.length>24)throw Error('Usa un alias de 2 a 24 caracteres. No necesitas tu nombre completo.');
  if(!['student','teacher'].includes(role))throw Error('Tipo de perfil no válido.');
  const credential=await passwordRecord(password);
  const profiles=profileList(storage);
  if(profiles.length>=8)throw Error('Este dispositivo admite hasta ocho perfiles.');
  if(profiles.some(p=>p.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('Ese alias ya existe. Elige otro.');
  const p={id:state.profile,name,role,password:credential};
  storage.setItem(profileKey(p.id), JSON.stringify(state));
  storage.setItem(PROFILE_INDEX, JSON.stringify([...profiles,p]));
  return p;
}
export async function loginProfile(storage,id,password) {
  const p=profileList(storage).find(p=>p.id===id);
  if(!p)throw Error('No se encontró ese perfil.');
  if(p.password && (await passwordRecord(password,p.password.salt)).hash!==p.password.hash)throw Error('Contraseña incorrecta.');
  const s=JSON.parse(storage.getItem(profileKey(id)));
  if(!s || s.profile!==id || !Array.isArray(s.sessions) || !Array.isArray(s.teacher))throw Error('No se pudo abrir el progreso. Conserva los datos y utiliza una copia de respaldo.');
  return {profile:p,state:s};
}
export async function updateProfile(storage,id,name,previous,next) {
  await loginProfile(storage,id,previous);
  name=name.trim();
  if(name.length<2||name.length>24)throw Error('Usa un alias de 2 a 24 caracteres.');
  const credential=next?await passwordRecord(next):null;
  const list=profileList(storage),p=list.find(p=>p.id===id);
  if(list.some(p=>p.id!==id&&p.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('Ese alias ya existe.');
  p.name=name;if(credential)p.password=credential;
  storage.setItem(PROFILE_INDEX,JSON.stringify(list));return p;
}
