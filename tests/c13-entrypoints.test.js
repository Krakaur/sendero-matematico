import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// Parse the actual shipped entrypoints, including import syntax not exercised by
// engine tests. No build, package install, browser or network is involved.
for(const file of ['app.js','together.js','sw.js'])test(`C13 shipped entrypoint parses: ${file}`,()=>{
 const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL('../web/'+file,import.meta.url))],{encoding:'utf8',timeout:15000,windowsHide:true});
 assert.equal(result.status,0,result.stderr||result.error?.message);
});
