import {readFile,writeFile,readdir} from 'node:fs/promises';import {resolve,extname} from 'node:path';
import {aggregateResearch} from './aggregate.mjs';
const [folder,output,authorization]=process.argv.slice(2);
if(!folder||!output||authorization!=='--authorized-dataset')throw Error('Uso: node research/export-aggregate.mjs CARPETA INFORME.json --authorized-dataset. Utilizar solo corpus sintético o con autorización y protocolo establecidos.');
const reports=[];for(const file of await readdir(folder)){if(extname(file)==='.json')reports.push(JSON.parse(await readFile(resolve(folder,file),'utf8')));}
await writeFile(resolve(output),JSON.stringify(aggregateResearch(reports),null,2),{flag:'wx'});
console.log('Agregado creado. Revisar riesgo de reidentificación antes de divulgarlo.');
