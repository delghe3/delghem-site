import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const cases=JSON.parse(read('assets/engineering/steel-frame-viscous-comparison.json'));

test('viscous engineering evidence is located directly after the hero, before secondary app, Genius or the FEM catalogue, without duplicate sections',()=>{
 for(const name of ['index.html','it/index.html']){
  const h=read(name),hero=h.indexOf('<section class="hero chapter"'),
   engineering=h.indexOf('<section class="engineering-benchmarks'),
   editorial=h.indexOf('<section class="editorial-hub"'),
   application=h.indexOf('<section class="app-section'),
   genius=h.indexOf('<section class="genius-section');
  assert.ok(hero>=0&&hero<engineering&&engineering<editorial&&editorial<genius&&genius<application,name);
  assert.equal((h.match(/id="engineering-benchmarks"/g)||[]).length,1);
  const block=h.slice(engineering,editorial);
  assert.ok(block.indexOf('class="eng-graph-card eng-device-card')<block.indexOf('class="eng-graph-card eng-pile-card'));
  assert.match(block,/class="eng-graph-card eng-device-card eng-device-card--spotlight"/);
 }
});

test('default compare mode has TWO simultaneous physically distinct D2 portals and one input accelerogram, all visible without pressing Play',()=>{
 for(const name of ['index.html','it/index.html']){
  const h=read(name);
  const block=h.slice(h.indexOf('<section class="engineering-benchmarks'),
    h.indexOf('<section class="editorial-hub"'));
  assert.match(block,/id="steel-frame-comparison"/);
  assert.match(block,/id="steel-bare-canvas"/);
  assert.match(block,/id="steel-damper-canvas"/);
  assert.match(block,/data-case="without"/);
  assert.match(block,/data-case="with"/);
  assert.match(block,/id="steel-frame-accelerogram"/);
  assert.match(block,/id="steel-accelerogram-marker"/);
  assert.match(block,/id="steel-accelerogram-reveal"/);
  assert.match(block,/id="steel-input-acceleration"/);
  assert.match(block,/id="steel-bare-live-displacement"/);
  assert.match(block,/id="steel-damped-live-displacement"/);
  assert.match(block,/id="steel-frame-toggle"/);
  assert.match(block,/<option value="compare" selected>/);
  assert.match(block,/id="steel-frame-play"/);
  assert.match(block,/class="steel-response-panel"/);
  assert.match(block,/analitic|synthetic/i);
  assert.equal((block.match(/class="steel-frame-case/g)||[]).length,2);
 }
});

test('a single shared timestep drives two completed D2 Newmark solutions and the synthetic analytical ground acceleration',()=>{
 assert.equal(cases.cases.length,2);
 assert.equal(cases.cases[0].records.length,cases.cases[1].records.length);
 assert.equal(cases.cases[0].records.length,cases.input.accelerationMS2.length);
 assert.deepEqual(cases.cases.map(c=>c.id),['without','with']);
 const inputTime=cases.input.dtSec;
 assert.equal(inputTime,0.01);
 assert.match(cases.input.recordType,/Analytical/);
 const viewer=read('engineering-simulations.js');
 assert.match(viewer,/paintFramePair/);
 assert.match(viewer,/steel-bare-canvas/);
 assert.match(viewer,/steel-damper-canvas/);
 assert.match(viewer,/steel-frame-accelerogram/);
 assert.match(viewer,/frameView\.index/);
 assert.match(viewer,/dataset\.sampleIndex/);
 assert.match(viewer,/IntersectionObserver/);
 assert.match(viewer,/prefers-reduced-motion/);
 assert.match(viewer,/visibilitychange/);
 assert.match(viewer,/document\.hidden/);
 assert.match(viewer,/shouldAutoplay/);
 assert.match(viewer,/nextLoopedFrame/);
 assert.match(viewer,/dataset\.focus/);
 assert.doesNotMatch(viewer,/if\(frameView\.index===frameData\.cases\[0\]\.records\.length-1\)\s*{\s*frameView\.playing=false/);
});

test('autoplay advances and loops deterministically only while visible and motion is permitted',async()=>{
 const mod=await import('../engineering-playback.mjs');
 assert.equal(mod.shouldAutoplay({visible:true,documentVisible:true,reducedMotion:false,userPaused:false}),true);
 assert.equal(mod.shouldAutoplay({visible:false,documentVisible:true,reducedMotion:false,userPaused:false}),false);
 assert.equal(mod.shouldAutoplay({visible:true,documentVisible:false,reducedMotion:false,userPaused:false}),false);
 assert.equal(mod.shouldAutoplay({visible:true,documentVisible:true,reducedMotion:true,userPaused:false}),false);
 assert.equal(mod.shouldAutoplay({visible:true,documentVisible:true,reducedMotion:false,userPaused:true}),false);
 let state=mod.nextLoopedFrame({indexFraction:1730,elapsedMs:600,dtSec:0.01,count:1801,speed:2});
 assert.ok(state.index<200&&state.index>=0,'autoplay wraps after the 18 s input without stopping');
 assert.equal(state.index,Math.round(state.indexFraction));
 assert.ok(state.indexFraction>0);
 state=mod.nextLoopedFrame({indexFraction:0,elapsedMs:80,dtSec:0.01,count:1801,speed:2});
 assert.equal(state.index,16);
 assert.ok(mod.nextLoopedFrame({indexFraction:90,elapsedMs:0,dtSec:0.01,count:1801,speed:2}).index===90);
});

test('Narrow dual-canvas FEM view omits colliding verbose labels while retaining real member geometry and separate live cards',()=>{
 const renderer=read('steel-portal-renderer.mjs');
 assert.match(renderer,/if\(width<280\)\{/);
 assert.match(renderer,/D2 · XZ/);
 assert.match(renderer,/return draw;/);
 for(const name of ['index.html','it/index.html']){
  const html=read(name);
  assert.match(html,/id="steel-bare-live-displacement"/);
  assert.match(html,/id="steel-damped-live-displacement"/);
 }
});
