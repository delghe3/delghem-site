import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(resolve(root,'model-stage.js'),'utf8');
test('opening hero uses genuine geometrical I-section flanges, web and concrete elements',()=>{
 assert.match(source,/mixed-demo-geometry\.mjs/);
 assert.match(source,/function crossSection/);
 assert.match(source,/const \{b,h,tw,tf\}=section/);
 assert.match(source,/rc-floor/);
 assert.match(source,/rc-wall/);
 assert.match(source,/paintFaces/);
});
test('opening frame uses only eight retained D2 braces with actual endpoints',async ()=>{
 const {mixedDemo}=await import('../assets/real-d2/mixed-demo-geometry.mjs');
 assert.equal(mixedDemo.members.filter(x=>x.kind==='brace').length,8);
 assert.equal(mixedDemo.members.length,124);
 assert.equal(mixedDemo.nodes.length,60);
 assert.match(source,/mixedDemo.members/);
});
test('structure, deformation and color modes remain explicitly demonstrative',()=>{
 assert.match(source,/mode!=='deformed'/);
 assert.match(source,/mode==='forces'/);
 assert.match(source,/setMotion/);
 assert.match(source,/pointermove/);
 assert.match(source,/keydown/);
 assert.match(source,/ResizeObserver/);
 assert.match(source,/no FEM stress\/displacement result/);
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
