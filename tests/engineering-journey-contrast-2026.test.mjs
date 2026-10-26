import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import{resolve,dirname}from'node:path';
import{fileURLToPath}from'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
test('Both locales present a new sequence: genius > modelling > FEM results > authentic D2 drawing gallery > Apple Silicon',()=>{
 for(const file of ['index.html','it/index.html']){
  const html=read(file);
  const a=html.indexOf('id="engineering-benchmarks"'),g=html.indexOf('id="genius"'),m=html.indexOf('id="app"'),r=html.indexOf('id="fem-lab"'),o=html.indexOf('id="production-drawings"'),n=html.indexOf('id="native"'),t=html.indexOf('id="technical-library"');
  assert.ok(a<g&&g<m&&m<r&&r<o&&o<n&&n<t,file+' journey');
  assert.equal((html.match(/id="genius"/g)||[]).length,1,file);
  assert.equal((html.match(/id="production-drawings"/g)||[]).length,1,file);
  assert.equal((html.match(/class="engineering-track-item/g)||[]).length,4);
  const intro=html.slice(html.indexOf('id="editorial-hub"'),html.indexOf('<section class="contact-strip"'));
  const first=intro.indexOf('href="#genius"');
  assert.ok(first>=0);
  assert.ok(first<intro.indexOf('href="#app"'));
  assert.ok(first<intro.indexOf('href="#fem-lab"'));
  assert.ok(first<intro.indexOf('href="#production-drawings"'));
  for(const id of ['rc-composite-board','steel-composite-board'])assert.ok(html.includes('id="'+id+'"'),file+': '+id);
  assert.match(html,/not certified|non certifica|non (?:è|sono).*esecutiv|preliminar/i);
  assert.ok(html.includes('contrast-recovery.css?v=20261026-dossier4'));
 }
});

test('Only real existing D2 drawing assets, never invented construction-ready sheets',()=>{
 for(const f of ['assets/rc-drawings/armature-d2-a1-01.webp',
  'assets/rc-drawings/rc-beam-BX1-detail.webp',
  'assets/screenshots/drawing.webp',
  'assets/real-d2/floor-assembly.webp',
  'assets/rc-drawings/PROVENANCE.txt']){
  assert.ok(statSync(resolve(root,f)).size>40,f);
 }
 for(const h of ['index.html','it/index.html']){
  const html=read(h);
  assert.match(html,/87/);
  assert.match(html,/A1/);
  assert.match(html,/steel-workshop-drawings|steel-authentic-showcase/);
 }
});

test('Purposeful contrast: restore the dark foundations beneath white Genius and FEM text',()=>{
 const css=read('contrast-recovery.css');
 for(const selector of ['.genius-section','.fem-lab-section','.genius-copy','.fem-lab-heading','.editorial-hub','.production-drawings','.production-sheet'])assert.ok(css.includes(selector));
 assert.match(css,/#0[0-9a-f]{5}|#1[0-9a-f]{5}/i);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\s*\(max-width:\s*650px\)/);
 assert.match(css,/prefers-reduced-motion/);
});
