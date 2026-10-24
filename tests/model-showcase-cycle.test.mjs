import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const sha=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
const models=['football-canopy','steel-arch-bridge','timber-terminal'];
test('Existing eight-storey D2 conceptual building stays the FIRST model unchanged in native form',async()=>{
 const source=JSON.parse(read('assets/real-d2/complex-demonstration.hfm.json'));
 const {complexDemo}=await import('../assets/real-d2/complex-demo-geometry.mjs');
 assert.equal(complexDemo.storeyCount,8);
 assert.equal(source.members.length,514);
 assert.equal(source.nodes.length,212);
 assert.equal(source.shells.length,112);
 assert.equal(source.foundationSystem.items.length,24);
 assert.equal(complexDemo.source.derivedModelSha256,sha('assets/real-d2/complex-demonstration.hfm.json'));
 const stage=read('model-stage.js');
 assert.match(stage,/complexDemo/);
 assert.match(stage,/MODEL_SHOWCASE_DURATION_MS\s*=\s*5000/);
});
test('Three distinct advanced structural concepts are real validated D2-native JSON files and not rendered stock images',async()=>{
 const module=await import('../assets/real-d2/showcase-geometry.mjs');
 assert.deepEqual(module.showcaseModels.map(m=>m.id),models);
 assert.equal(module.showcaseModels.length,3);
 for(const m of module.showcaseModels){
  assert.equal(m.source.modelFile,'showcase-'+m.id+'.hfm.json');
  const file='assets/real-d2/'+m.source.modelFile;
  assert.ok(existsSync(resolve(root,file)),file);
  const json=JSON.parse(read(file));
  assert.equal(json.schema,'hyperfem-1');
  assert.equal(m.source.derivedModelSha256,sha(file));
  assert.equal(json.nodes.length,m.nodes.length,m.id);
  assert.equal(json.members.length,m.members.length,m.id);
  assert.equal(json.shells.length,m.shells.length,m.id);
  assert.equal(json.foundationSystem.items.filter(f=>f.type==='direct').length,m.footings.length,m.id);
  assert.ok(json.sections.length>=6&&json.materials.length>=2);
  assert.ok(m.nodes.length>=80&&m.members.length>=170,m.id);
  assert.deepEqual(m.qualifications,{solved:false,designed:false,executive:false});
  assert.ok(m.titleIt&&m.titleEn&&m.subtitleIt&&m.subtitleEn,m.id);
  assert.ok(m.members.every(x=>Number.isInteger(x.a)&&Number.isInteger(x.b)&&x.section>=0));
  assert.ok(m.shells.every(x=>x.nodes.length===4&&x.nodes.every(Number.isInteger)));
 }
});
test('Covered 105x68 m football pitch is a realistic long-span covered building with actual primary lattice trusses and structural supports',async()=>{
 const {showcaseModels}=await import('../assets/real-d2/showcase-geometry.mjs');
 const m=showcaseModels[0],span=m.bbox.max[1]-m.bbox.min[1],length=m.bbox.max[0]-m.bbox.min[0];
 assert.ok(length>=112&&span>=78,{length,span});
 assert.ok(m.bbox.max[2]>=21,'arched long span roof with adequate clear height');
 const kinds=new Set(m.members.map(x=>x.kind));
 for(const kind of ['stadium-arch','stadium-bottom-chord','stadium-diagonal','stadium-purlin','rc-column'])assert.ok(kinds.has(kind),kind);
 assert.ok(m.members.filter(x=>x.kind==='stadium-diagonal').length>=65,'genuine articulated transfer-lattice');
 assert.ok(m.shells.filter(s=>s.kind==='stadium-roof').length>=40,'native real roof shell polygons');
 assert.ok(m.footings.length>=18);
});
test('Arch bridge is a tied twin-rib arch with structural steel hangers and RC deck, not arbitrary truss decoration',async()=>{
 const {showcaseModels}=await import('../assets/real-d2/showcase-geometry.mjs');
 const m=showcaseModels[1],span=m.bbox.max[0]-m.bbox.min[0];
 assert.ok(span>=90&&m.bbox.max[2]>=30);
 const kind=new Set(m.members.map(x=>x.kind));
 for(const name of ['arch-upper-rib','arch-lower-rib','arch-lattice','arch-hanger','deck-tie','deck-crossbeam'])assert.ok(kind.has(name),name);
 assert.ok(m.members.filter(x=>x.kind==='arch-hanger').length>=14);
 assert.ok(m.shells.filter(s=>s.kind==='rc-bridge-deck').length>=12);
 assert.ok(m.footings.length>=4);
});
test('Third concept is a naturally curved multi-bay engineered timber terminal with native laminated shell roof and RC/steel elements',async()=>{
 const {showcaseModels}=await import('../assets/real-d2/showcase-geometry.mjs');
 const m=showcaseModels[2],kinds=new Set(m.members.map(x=>x.kind));
 for(const name of ['glulam-vault','glulam-purlin','steel-column','rc-column'])assert.ok(kinds.has(name),name);
 const roof=m.shells.filter(x=>x.kind==='glulam-roof');
 assert.ok(roof.length>=30&&m.bbox.max[2]>=16);
 const original=JSON.parse(read('assets/real-d2/'+m.source.modelFile));
 assert.ok(original.laminates.length>=1);
 assert.ok(original.shells.filter(s=>s.material==='M_WOOD').every(s=>s.laminate));
});
test('The hero provides four selectable five-second cards, a visible progress track, pause and arrow controls in both languages',()=>{
 for(const p of ['index.html','it/index.html']){
  const h=read(p);
  assert.match(h,/id="model-showcase"/);
  assert.match(h,/id="model-showcase-progress"/);
  assert.match(h,/id="model-showcase-next"/);
  assert.match(h,/id="model-showcase-prev"/);
  assert.match(h,/id="model-showcase-pause"/);
  assert.match(h,/id="model-showcase-title"/);
  assert.match(h,/id="model-showcase-counter"/);
  assert.match(h,/data-showcase-index="3"/);
 }
 const js=read('model-stage.js');
 assert.match(js,/MODEL_SHOWCASE_DURATION_MS/);
 assert.match(js,/showcaseModels/);
 assert.match(js,/prefers-reduced-motion/);
 assert.match(js,/visibilitychange/);
 assert.match(js,/setModelIndex/);
 assert.match(read('style.css'),/\.model-showcase-progress/);
});
