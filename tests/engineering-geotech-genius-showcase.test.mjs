import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const obj=p=>JSON.parse(read(p));
test('Real D2 geotechnical pile benchmark scenarios preserve positive shaft/tip reactions and numerical equilibrium',async()=>{
 const d=obj('assets/engineering/soil-piles-and-dampers.json');
 assert.equal(d.schema,'delghem-d2-geo-and-viscous-benchmarks-1');
 assert.equal(d.piles.length,2);
 assert.equal(d.completeGeotechnicalVerification,false);
 assert.deepEqual(d.piles.map(x=>x.id),['layered-sand','layered-clay']);
 for(const p of d.piles){
  assert.equal(p.converged,true);
  assert.ok(Math.abs(p.residualKN)<1e-4);
  assert.ok(Math.abs(p.shaftReactionKN+p.tipReactionKN-700)<1e-3);
  assert.ok(p.headSettlementMM>0&&p.headSettlementMM<30);
  assert.ok(p.sampledCurve.length>=32);
  assert.ok(p.sampledCurve.every(s=>Number.isFinite(s.reactionKN)&&Number.isFinite(s.settlementMM)));
  assert.match(p.inputSha256,/^[a-f0-9]{64}$/);
  const {createHash}=await import('node:crypto');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'assets/engineering',p.sourceInput))).digest('hex'),p.inputSha256);
 }
});
test('Two passive viscous devices meet real D2 input constraints and illustrate constitutive loops without building verification claims',()=>{
 const d=obj('assets/engineering/soil-piles-and-dampers.json');
 assert.deepEqual(d.devices.map(x=>x.alpha),[.5,1]);
 assert.equal(d.completeStructuralVerification,false);
 for(const x of d.devices){
  assert.ok(x.maxForceKN>0&&x.energyPerCycleKNM>0);
  assert.ok(x.cycle.length>=200&&x.velocityCurve.length>=100);
  assert.match(x.viscousLaw,/sgn/);
  assert.match(x.illustrationScope,/NOT dynamic FEM response/);
  assert.ok(x.cycle.every(p=>Number.isFinite(p.forceKN)&&Number.isFinite(p.displacementMM)));
 }
});
test('Site engineering proof section shows D2 pile loads and viscous α curves with interactive field selection in both languages',()=>{
 for(const file of ['index.html','it/index.html']){
  const h=read(file);
  assert.match(h,/id="engineering-benchmarks"/);
  assert.match(h,/id="pile-curve"/);
  assert.match(h,/id="damper-velocity-curve"/);
  assert.match(h,/id="damper-loop-curve"/);
  assert.match(h,/id="pile-soil-select"/);
  assert.match(h,/id="damper-alpha-select"/);
  assert.match(h,/engineering-benchmarks\.js\?v=/);
  assert.match(h,/assets\/app-foundation-real\.png/);
  assert.match(h,/id="engineering-benchmarks"/);
  assert.ok(h.indexOf('id="engineering-benchmarks"')>h.indexOf('id="fem-lab"'));
 }
 const js=read('engineering-benchmarks.js');
 for(const m of ['soil-piles-and-dampers.json','pile-curve','damper-alpha-select','damper-loop-curve'])assert.ok(js.includes(m),m);
 assert.match(read('style.css'),/\.engineering-benchmarks/);
});
test('Genius is given priority before FEM and redundant explanatory blocks are collapsed, not deleted',()=>{
 for(const file of ['index.html','it/index.html']){
  const h=read(file);
  assert.ok(h.indexOf('id="genius"')<h.indexOf('id="fem-lab"'));
  assert.match(h,/class="genius-deep-dive"/);
  assert.match(h,/class="genius-feature-grid"/);
  assert.match(h,/class="genius-command-cases"/);
  assert.ok(h.indexOf('id="genius-journey"')<h.indexOf('class="genius-deep-dive"'));
  assert.match(h,/class="genius-benefit-bar"/);
 }
});
