import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read = name => readFileSync(new URL('../web/'+name,import.meta.url),'utf8');

test('The offline indicator checks the worker cache and the complete local module graph is cached',()=>{
  const worker=read('sw.js'), app=read('app.js');
  const cache=worker.match(/const CACHE = `([^`]+)`/)[1];
  assert(app.includes('caches.open(`'+cache+'`)'),'Indicator refers to a different cache');
  const files=new Set([...worker.match(/const FILES = \[([\s\S]*?)\];/)[1].matchAll(/"\.\/([^"]*)"/g)].map(m=>m[1]));
  for(const file of files) if(file) assert(existsSync(new URL('../web/'+file,import.meta.url)),file+' missing');
  const pending=['app.js'];
  const visited=new Set();
  while(pending.length){
    const file=pending.pop();if(visited.has(file))continue;visited.add(file);
    assert(files.has(file),file+' unavailable offline');
    for(const dependency of read(file).matchAll(/(?:from\s*|import\s*)["']\.\/([^"']+)["']/g)) pending.push(dependency[1]);
  }
  for(const stylesheet of read('index.html').matchAll(/rel="stylesheet" href="\.\/([^"]+)"/g)) assert(files.has(stylesheet[1]),'Uncached stylesheet '+stylesheet[1]);
  for(const image of read('race-art.js').matchAll(/(?:src|href)="\.\/(assets\/[^"`]+)"/g))assert(files.has(image[1]),'Uncached illustration '+image[1]);
  for(const image of read('race-world.css').matchAll(/url\(['"]\.\/(assets\/[^'"]+)['"]\)/g))assert(files.has(image[1]),'Uncached sprite '+image[1]);
});
