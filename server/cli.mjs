import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {openDatabase,issueAccess,receiver} from './receiver.mjs';
const folder=resolve(process.env.SENDERO_DATA || 'server/private');await mkdir(folder,{recursive:true});
const db=openDatabase(resolve(folder,'sendero.sqlite'));
if(process.argv[2]==='create-class') {
 const endpoint=process.env.SENDERO_ENDPOINT;if(!endpoint)throw Error('Define SENDERO_ENDPOINT con el HTTPS del receptor o http://127.0.0.1:4180 para pruebas locales.');
 const id=randomUUID();db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run(id,process.argv[3]||'Mi grupo');
 for(let i=0;i<9;i++){
  const role=i===0?'teacher':'student',token=randomBytes(32).toString('hex');issueAccess(db,id,role,token);
  await writeFile(resolve(folder,`${id}-${role}-${i}.json`),JSON.stringify({schema:'sendero.invitation.v1',classId:id,role,endpoint,token},null,2),{mode:0o600,flag:'wx'});
 }
 console.log('Grupo creado. Invitaciones privadas guardadas en el directorio de datos; no publicarlas en GitHub.');db.close();
}else{
 const origins=(process.env.SENDERO_ORIGINS||'http://127.0.0.1:4173').split(',');
 receiver(db,{origins}).listen(Number(process.env.PORT||4180),'127.0.0.1',()=>console.log('Receptor local iniciado. Producción requiere proxy HTTPS y administración del servidor.'));
}
