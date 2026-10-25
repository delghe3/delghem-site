import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const names=['eight-storey','football-canopy','steel-arch-bridge','timber-terminal','masonry-aggregate'];
test('Bilingual press kits show real 3D native concepts separately from screenshots of the application',()=>{
 for(const file of ['media-kit/index.html','en/media-kit/index.html']){
  const html=read(file);
  assert.match(html,/id="showcase-native-models"/);
  assert.match(html,/media-showcase-grid/);
  assert.match(html,/unverif|non verificat|not verified|not a structural/i);
  for(const id of names){
   const photo='assets/real-d2/showcase-previews/'+id+'.webp';
   assert.ok(html.includes(photo),file+' missing '+photo);
   assert.ok(statSync(resolve(root,photo)).size>15000,id+' preview genuine substantive bitmap');
  }
  assert.ok(html.indexOf('id="showcase-native-models"')<html.indexOf('id="assets"'),file+' showcase should precede app screenshots');
  assert.match(html,/class="media-image-grid"/);
 }
});
test('Sitemap indexes only the matching real D2 concept previews on both homepages and media pages',()=>{
 const xml=read('sitemap.xml');
 for(const id of names.slice(1)){
  const url='https://www.delghe.com/assets/real-d2/showcase-previews/'+id+'.webp';
  assert.ok(xml.includes('<image:loc>'+url+'</image:loc>'),id);
 }
 assert.match(xml,/2026-10-25/);
});
test('Native D2 showcase source remains editable and never described as a calculated, certified project',()=>{
 const readme=read('README.md');
 assert.match(readme,/Carosello 3D/);
 for(const id of names.slice(1))assert.match(read('assets/real-d2/SHOWCASE_PROVENANCE.txt'),new RegExp(id));
 assert.match(readme,/non.*(?:dimensionat|verificat|calcolat)/i);
});
