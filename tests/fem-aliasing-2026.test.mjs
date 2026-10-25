import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');

test('FEM 3D and all three FEM 2D maps have bilingual ALIASING toggles and qualified interpolation meaning',()=>{
 for(const path of ['index.html','it/index.html']){
  const html=read(path);
  for(const id of ['lab-aliasing-toggle','surface-aliasing-toggle']){
   assert.match(html,new RegExp('id="'+id+'"[^>]*aria-pressed="false"[^>]*>ALIASING<'));
  }
  assert.match(html,/same element|stesso elemento/i);
  assert.match(html,/non modifica|does not change/i);
  assert.match(html,/fem-lab\.js\?v=20261025-aliasing17/);
  assert.match(html,/surface-studio\.js\?v=20261025-aliasing17/);
 }
});

test('Bilinear stress-color sampler reproduces Gauss values and never mixes discontinuous elements',async()=>{
 const {sampleGaussScalar}=await import('../contour-shading.mjs');
 const a=[0,100,60,20], b=[90,80,70,50];
 assert.ok(Math.abs(sampleGaussScalar(a,.5,.5)-45)<1e-10);
 const l=(1-1/Math.sqrt(3))/2,h=(1+1/Math.sqrt(3))/2;
 for(const [uv,want] of [[[l,l],0],[[h,l],100],[[h,h],60],[[l,h],20]]){
  assert.ok(Math.abs(sampleGaussScalar(a,...uv)-want)<1e-9);
 }
 for(const [u,v] of [[0,0],[1,1],[.1,.6],[.77,.44]]){
  assert.ok(sampleGaussScalar(a,u,v)>=0&&sampleGaussScalar(a,u,v)<=100);
  assert.ok(sampleGaussScalar(b,u,v)>=50&&sampleGaussScalar(b,u,v)<=90);
 }
 // A bounded interpolation cannot fabricate a stress peak greater than any
 // sampled Gauss value, and one element's values do not depend on neighbors.
 assert.ok(Math.abs(sampleGaussScalar([10,10,10,10],.45,.25)-10)<1e-10);
 assert.equal(sampleGaussScalar([10,10,10,10],.45,.25),sampleGaussScalar([10,10,10,10],.45,.25));
 assert.ok(Math.abs(sampleGaussScalar(a,.5,.5)-45)<1e-10);
});

test('Alias controls rerender only colors, preserve Kratos datasets, element topology and original picks',()=>{
 const surface=read('surface-studio.js'),stress=read('fem-lab.js');
 assert.match(surface,/surface-aliasing-toggle/);
 assert.match(stress,/lab-aliasing-toggle/);
 assert.match(surface,/sampleGaussScalar\(/);
 assert.match(stress,/sampleGaussScalar\(/);
 assert.match(surface,/aliasing\s*\?\s*8\s*:\s*2/);
 assert.match(stress,/view\.aliasing\s*\?\s*9\s*:\s*2/);
 assert.match(surface,/aria-pressed/);
 assert.match(stress,/aria-pressed/);
 for(const text of [stress,surface]){
  assert.doesNotMatch(text,/\.gauss\s*=|\.elements\s*=/);
  assert.match(text,/schedule/);
 }
});
