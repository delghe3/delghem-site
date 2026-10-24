import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const home=[['en','index.html'],['it','it/index.html']];
const articles=[
 ['en','en/mac-fem-technology/index.html'],
 ['it','tecnologia-fem-mac/index.html'],
 ['en','en/native-structural-analysis-mac/index.html'],
 ['it','software-fem-mac/index.html'],
 ['en','en/steel-workshop-drawings/index.html'],
 ['it','disegni-officina-acciaio/index.html'],
 ['en','en/media-kit/index.html'],
 ['it','media-kit/index.html'],
];
test('Homepage prominently features three verified D2 steel captures in both languages',()=>{
 for(const [lang,file] of home){
  const html=read(file);
  assert.match(html,/id="steel-authentic-showcase"/,lang);
  const section=html.split('id="steel-authentic-showcase"')[1].split('</section>')[0];
  for(const name of ['steel-frame','drawing','workshop']){
   assert.match(section,new RegExp('assets/screenshots/'+name+'\\.webp'),lang+' missing '+name);
  }
  assert.match(section,/class="steel-story-grid"/);
  assert.match(section,lang==='it'?/schermate autentiche/i:/real (application )?captures/i);
 }
});
test('Every technical/media page visibly exposes English and Italiano with flags',()=>{
 for(const [lang,file] of articles){
  const html=read(file);
  assert.match(html,/class="page-language-switch"/,file);
  assert.match(html,/🇬🇧/,file);
  assert.match(html,/🇮🇹/,file);
  assert.match(html,/>English<\/span>/,file);
  assert.match(html,/>Italiano<\/span>/,file);
  assert.match(html,/aria-current="page"/,file);
 }
});
test('No UNIBO/Frontiers messages are present in public copy, capture provenance remains real',()=>{
 for(const [lang,file] of [...home,...articles]){
  assert.doesNotMatch(read(file),/unibo|frontiers/i,file);
 }
 for(const name of ['steel-frame','drawing','workshop']){
  const p=resolve(root,'assets/screenshots',name+'.webp');
  assert.ok(existsSync(p)&&statSync(p).size>4000,name);
 }
 const provenance=read('assets/screenshots/CAPTURE_PROVENANCE.md');
 assert.match(provenance,/DÈLGHEM D2/);
 assert.match(provenance,/schermate autentiche|originale/);
});
