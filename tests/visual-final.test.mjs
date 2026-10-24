import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(resolve(root,'model-stage.js'),'utf8');
test('opening hero uses genuine geometrical I-section flanges, web and concrete elements',()=>{
 assert.match(source,/complex-demo-geometry\.mjs/);
 assert.match(source,/function crossSection/);
 assert.match(source,/const \{b,h,tw,tf\}=section/);
 assert.match(source,/rc-floor/);
 assert.match(source,/rc-wall/);
 assert.match(source,/paintFaces/);
});
test('opening eight-storey frame uses only eight carefully placed D2 braces',async ()=>{
 const {complexDemo}=await import('../assets/real-d2/complex-demo-geometry.mjs');
 assert.equal(complexDemo.members.filter(x=>x.kind==='brace').length,8);
 assert.equal(complexDemo.members.length,514);
 assert.equal(complexDemo.nodes.length,212);
 assert.match(source,/mixedDemo.members/);
});
test('structure, deformation and color modes remain explicitly demonstrative',()=>{
 assert.match(source,/mode!=='deformed'/);
 assert.match(source,/mode==='forces'/);
 assert.match(source,/setMotion/);
 assert.match(source,/pointermove/);
 assert.match(source,/keydown/);
 assert.match(source,/ResizeObserver/);
 assert.match(source,/Geotechnical \/ structural design has NOT been performed/);
});
test('floor carpentry and colored real D2 screenshots are embedded in both home pages',()=>{
 for (const name of ['index.html','it/index.html']){
  const html=readFileSync(resolve(root,name),'utf8');
  assert.match(html,/id="floor-carpentry-showcase"/);
  for(const pic of ['floor-plan','floor-assembly','fem-results']){
   assert.match(html,new RegExp('assets/real-d2/'+pic+'.webp'));
   assert.ok(existsSync(resolve(root,'assets/real-d2',pic+'.webp')));
  }
  assert.match(html,/actual.*DÈLGHEM|autentic.*DÈLGHEM/i);
  assert.doesNotMatch(html,/Unibo Frontiers/i);
 }
});
