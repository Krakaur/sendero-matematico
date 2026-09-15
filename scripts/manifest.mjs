import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {extractFile} from '@electron/asar';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=[];
for(const name of await readdir('web')){const path=`web/${name}`;if((await stat(path)).isFile()){const bytes=await readFile(path);files.push({path,bytes:bytes.length,sha256:sha(bytes)});}}
for(const path of ['desktop/main.cjs','package.json','package-lock.json','tests/core.test.js']){const bytes=await readFile(path);files.push({path,bytes:bytes.length,sha256:sha(bytes)});}
for(const path of ['web/app.js','web/core.js','web/style.css','web/index.html','desktop/main.cjs']){
 const packed=extractFile('dist/win-unpacked/resources/app.asar',path);
 if(sha(packed)!==sha(await readFile(path)))throw Error(`Packaged source mismatch: ${path}`);
}
const artifact='Sendero-0.1.0-Windows-x64.exe';
const bytes=await readFile(`dist/${artifact}`);
const release={version:'0.1.0',generatedAt:new Date().toISOString(),files,windows:{artifact,bytes:bytes.length,sha256:sha(bytes),signature:'unsigned',packagedSourceMatches:true}};
await writeFile('docs/BUILD_MANIFEST.json',JSON.stringify(release,null,2)+'\n');
await writeFile('dist/SHA256SUMS.txt',`${sha(bytes)}  ${artifact}\n`);
console.log(JSON.stringify({webBytes:files.filter(f=>f.path.startsWith('web/')).reduce((n,f)=>n+f.bytes,0),windows:release.windows},null,2));
