import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
test('Both homepages retain complete technical evidence but collapse six repetitive presentation sections into three optional detail panels',()=>{
 for(const file of ['index.html','it/index.html']){
  const s=read(file),a=s.indexOf('id="engineering-benchmarks"'),b=s.indexOf('id="release"');
  const section=s.slice(a,b);
  assert.match(section,/id="technical-library"/);
  assert.equal((section.match(/<details class="technical-library-details"/g)||[]).length,3);
  assert.ok(section.includes('id="workflow"'));
  assert.ok(section.includes('id="capabilities"'));
  assert.ok(section.includes('id="rc-drawings"'));
  assert.ok(section.includes('id="steel-authentic-showcase"'));
  assert.ok(section.includes('id="floor-carpentry-showcase"'));
  assert.ok(section.includes('id="gallery"'));
  assert.ok(section.includes('id="technical-library"'));
  assert.ok(s.indexOf('id="technical-library"')<s.indexOf('id="release"'));
  assert.match(section,/name="technical-deep-dives"/);
  assert.doesNotMatch(section,/<details class="technical-library-details"[^>]*open/);
 }
});
test('Deep section links and presentation slides reliably open their enclosing technical section',()=>{
 const app=read('app.js');
 assert.match(app,/function openTechnicalAncestor/);
 assert.match(app,/closest\('details\.technical-library-details'\)/);
 assert.match(app,/hashchange/);
 assert.match(app,/presentationGo/);
 const css=read('style.css');
 assert.match(css,/\.technical-library/);
 assert.match(css,/\.technical-library-details/);
 assert.match(css,/\.technical-library-details\[open\]/);
});
test('Critical numerical evidence and Genius remain outside collapsed details and always readable',()=>{
 for(const name of ['index.html','it/index.html']){
  const s=read(name);
  for(const id of ['genius','fem-lab','surface-lab','engineering-benchmarks']){
   const target=s.indexOf('id="'+id+'"');
   assert.ok(target>=0);
   assert.ok(target<s.indexOf('id="technical-library"'),name+' '+id);
  }
  assert.match(s,/id="genius-copy-command"/);
  assert.match(s,/id="surface-lab"/);
  assert.match(s,/id="pile-curve"/);
 }
});
