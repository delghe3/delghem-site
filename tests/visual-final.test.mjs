import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(resolve(root,'model-stage.js'),'utf8');
test('opening FEM hero renders recognisable metal profiles rather than line-only frame',()=>{
 assert.match(source,/function drawIProfile/);
 assert.match(source,/flangeBand/);
 assert.match(source,/webBand/);
 assert.match(source,/function ribbon/);
});
test('opening FEM hero has authentic structural arrangement of X braces on perimeter bays',()=>{
 assert.match(source,/kind:'brace'/);
 assert.match(source,/function drawBrace/);
 assert.match(source,/idx\(i,j,k\+1\)/);
});
test('all UI modes and interactions remain present, no fictitious solver claims',()=>{
 assert.match(source,/view==='deformed'/);
 assert.match(source,/view==='forces'/);
 assert.match(source,/setMotion/);
 assert.match(source,/pointermove/);
 assert.match(source,/keydown/);
 assert.match(source,/ResizeObserver/);
 assert.match(source,/No engineering solver/);
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
