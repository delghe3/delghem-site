import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');

test('new steel multibay isolation chapter follows viscous dampers and precedes piles in both languages',()=>{
 for(const p of ['index.html','it/index.html']){
  const h=read(p);
  const damper=h.indexOf('id="steel-frame-scene"');
  const isolator=h.indexOf('id="seismic-isolation"');
  const piles=h.indexOf('class="eng-graph-card eng-pile-card"');
  assert.ok(damper>=0&&isolator>damper&&piles>isolator,p);
  for(const id of ['isolation-fixed-canvas','isolation-isolated-canvas','isolation-play','isolation-restart','isolation-time','isolation-input-chart','isolation-response-chart','isolation-metric','isolation-accel-reduction','isolation-drift-reduction','isolation-base-travel']){
   assert.ok(h.includes('id="'+id+'"'),p+': '+id);
  }
  assert.match(h,/4.bay|4 campate|quattro campate|four.bay/i);
  assert.match(h,/illustrative|illustrativ|dimostrativ/i);
  assert.match(h,/isolat/i);
  assert.match(h,/seismic-isolators\.js\?v=/);
  assert.match(h,/seismic-isolators\.css\?v=/);
 }
});

test('Newmark model implements 3-storey fixed vs base-isolated response using identical input',async()=>{
 const {computeIsolationComparison}=await import('../seismic-isolation-model.mjs');
 const s=computeIsolationComparison();
 assert.equal(s.schema,'delghem-isolation-illustrative-model-1');
 assert.equal(s.geometry.baysX,4);
 assert.equal(s.geometry.baysY,2);
 assert.equal(s.geometry.storeys,3);
 assert.ok(s.timeline.length>400);
 assert.equal(s.timeline.length,s.fixed.length);
 assert.equal(s.fixed.length,s.isolated.length);
 assert.ok(s.fixed.every(p=>Math.abs(p.baseDisplacementMM)<1e-10));
 assert.ok(s.isolated.some(p=>Math.abs(p.baseDisplacementMM)>1));
 for(let i=0;i<s.timeline.length;i++){
  assert.equal(s.fixed[i].timeS,s.isolated[i].timeS);
  assert.equal(s.timeline[i].accelerationMS2,s.fixed[i].groundAccelerationMS2);
  assert.equal(s.timeline[i].accelerationMS2,s.isolated[i].groundAccelerationMS2);
  for(const x of [s.fixed[i],s.isolated[i]])
   assert.ok([x.roofDisplacementMM,x.roofAbsoluteAccelerationMS2,x.baseDisplacementMM,x.maxStoryDriftMM].every(Number.isFinite));
 }
 assert.ok(s.peaks.fixedAcceleration>0);
 assert.ok(s.peaks.isolatedAcceleration>0);
 assert.ok(s.peaks.isolationTravelMM>1);
 assert.ok(s.peaks.isolatedAcceleration<s.peaks.fixedAcceleration,'base isolators should reduce acceleration for the chosen diagnostic example');
 assert.ok(s.peaks.isolatedStoryDriftMM<s.peaks.fixedStoryDriftMM,'isolators should reduce interstorey drift for the chosen diagnostic example');
});

test('readouts distinguish isolator displacement from superstructure drift and refrain from claiming Kratos or certification',()=>{
 const js=read('seismic-isolators.js'),model=read('seismic-isolation-model.mjs');
 assert.match(js,/IntersectionObserver/);
 assert.match(js,/prefers-reduced-motion/);
 assert.match(js,/requestAnimationFrame/);
 assert.match(js,/document\.hidden/);
 assert.match(js,/isolation-time/);
 assert.match(js,/isolation-metric/);
 assert.match(js,/roofAbsoluteAccelerationMS2/);
 assert.match(model,/Newmark/);
 assert.match(model,/isolationTravelMM/);
 assert.doesNotMatch(model,/KratosMultiphysics/);
});
