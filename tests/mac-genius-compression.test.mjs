import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
test('Apple Silicon is explained in one concise Mac feature pathway with optional deep detail, not invented benchmarks',()=>{
 for(const n of ['index.html','it/index.html']){
  const s=read(n),a=s.indexOf('<section class="native-section'),b=s.indexOf('<section class="genius-section',a);
  const region=s.slice(a,b);
  assert.ok(a>=0&&b>a);
  assert.match(region,/class="mac-capabilities"/);
  assert.match(region,/class="native-technical-depth"/);
  assert.match(region,/Apple Silicon/);
  assert.match(region,/ARM64/);
  for(const path of ['#model-showcase','#fem-lab','#genius','#engineering-benchmarks'])assert.ok(region.includes('href="'+path+'"'),n+path);
  assert.match(region,/KratosMultiphysics/);
  assert.match(region,/senza|without/i);
  assert.doesNotMatch(region,/x10 faster|100x faster|certified complete/i);
 }
 const css=read('style.css');
 assert.match(css,/\.mac-capabilities/);
});
test('Genius preview has functional copy command button with feedback and honest no-execution disclosure',()=>{
 for(const n of ['index.html','it/index.html']){
  const s=read(n);
  assert.match(s,/id="genius-copy-command"/);
  assert.match(s,/id="genius-copy-status"/);
  assert.match(s,/class="genius-deep-dive"/);
  assert.match(s,/questo sito non esegue comandi|website does not execute Genius commands/i);
 }
 const js=read('genius-demo.js');
 assert.match(js,/genius-copy-command/);
 assert.match(js,/clipboard\.writeText/);
 assert.match(js,/genius-copy-status/);
});
