import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const R=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(R,f),'utf8');
test('Genius makes validated text-to-model workflow a prominent industrial capability in English and Italian',()=>{
 for(const [p,lang] of [['index.html','en'],['it/index.html','it']]){
  const h=read(p);
  const section=h.slice(h.indexOf('<section class="genius-section'),h.indexOf('<section class="workflow-section'));
  for(const code of ['genius-feature-grid','genius-workflow','genius-command-cases','genius-trust-note','genius-visual-stack']){
   assert.match(section,new RegExp('class="'+code),p+' missing '+code);
  }
  for(const term of lang==='en'
    ? ['Preview','Apply','Undo','load','Pushover']
    : ['Anteprima','Applica','Annulla','carichi','Pushover']){
   assert.ok(section.toLowerCase().includes(term.toLowerCase()),p+' missing '+term);
  }
  assert.match(section,/genuine|autentic/i);
  assert.match(section,/data-i18n="geniusDescription"/);
  assert.match(section,/id="open-genius"/);
  assert.match(section,/id="genius-image"/);
 }
});
test('Genius imagery comes from real DÈLGHEM D2 screenshots and is lightbox-ready',()=>{
 for(const file of ['assets/genius/genius-workflow-en.webp','assets/genius/genius-workflow-it.webp','assets/genius/genius-steel.webp','assets/genius/genius-help.webp']){
  const path=resolve(R,file);
  assert.ok(existsSync(path),file);
  assert.ok(statSync(path).size>20000,file+' too small');
  const magic=readFileSync(path);assert.equal(magic.toString('ascii',8,12),'WEBP');
 }
 const app=read('app.js');
 assert.match(app,/genius-workflow-en\.webp/);
 assert.match(app,/genius-workflow-it\.webp/);
 const provenance=read('assets/genius/PROVENANCE.txt');
 assert.match(provenance,/actual DÈLGHEM D2/);
});
test('Genius promotion makes bounded implemented abilities explicit rather than claiming untested AI autonomy',()=>{
 const app=read('app.js');
 for(const word of ['genius','updateLanguage'])assert.ok(app.includes(word));
 for(const file of ['index.html','it/index.html']){
  const h=read(file);
  assert.match(h,/not a certified|non costituisce una verifica|non sostituisce/i);
  assert.doesNotMatch(h,/automaticamente verificat|guaranteed optimization|certified AI design/i);
 }
});
