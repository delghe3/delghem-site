import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const obj=p=>JSON.parse(read(p));
const hash=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');

test('Pile stress maps include real D2 non-linear shaft/tip force profiles and exact layered effective stress',()=>{
 const p=obj('assets/engineering/pile-stratigraphic-stress.json');
 assert.equal(p.schema,'delghem-d2-pile-stratigraphy-influence-1');
 assert.equal(p.completeGeotechnicalVerification,false);
 assert.equal(p.cases.length,2);
 for(const c of p.cases){
  assert.ok(['layered-sand','layered-clay'].includes(c.id));
  assert.equal(c.inputSource,'DÈLGHEM D2 t-z/q-z');
  assert.match(c.influenceMethod,/illustrative|approximate/i);
  assert.match(c.baselineMethod,/exact.*layered/i);
  assert.equal(c.pile.diameterM,.6);assert.equal(c.pile.lengthM,15);
  assert.equal(c.loadKN,700);
  assert.ok(c.grid.nx>=101&&c.grid.nz>=111);
  assert.equal(c.grid.sigmaLithostaticKPa.length,c.grid.nx*c.grid.nz);
  assert.equal(c.grid.sigmaInfluenceKPa.length,c.grid.nx*c.grid.nz);
  assert.ok(c.grid.sigmaInfluenceKPa.every(n=>Number.isFinite(n)&&n>=0));
  assert.ok(c.grid.sigmaLithostaticKPa.every(n=>Number.isFinite(n)&&n>=0));
  assert.ok(c.shaftNodes.length>=28);
  assert.ok(Math.abs(c.shaftNodes.reduce((s,x)=>s+x.reactionKN,0)+c.toeReactionKN-700)<1e-4);
  assert.ok(c.pile.headSettlementMM>0);
  assert.equal(c.layers[0].topM,0);assert.equal(c.layers.at(-1).bottomM,c.grid.zMaxM);
  assert.equal(c.grid.sigmaLithostaticKPa[0],0);
  assert.ok(c.grid.sigmaLithostaticKPa.at(-1)>190);
  assert.ok(c.grid.maxInfluenceKPa>0);
  assert.equal(c.sourceHashSha256,hash('assets/engineering/'+c.nativeInputFile));
 }
});
test('Comparative D2 single-storey steel frame uses actual native solver 2D-frame stiffness and two time-history solutions',()=>{
 const d=obj('assets/engineering/steel-frame-viscous-comparison.json');
 assert.equal(d.schema,'delghem-steel-frame-viscous-comparison-1');
 assert.equal(d.nativeTimeHistoryEngine,'DÈLGHEM D2 hystereticMDOF');
 assert.equal(d.analysisDomain,'calibrated-equivalent-SDOF');
 assert.equal(d.comparison.usesKratosSeismicDeviceRoute,false);
 assert.deepEqual(d.geometry.nodes.map(n=>n.id),['BL','BR','TL','TR']);
 assert.deepEqual(d.geometry.beams.map(b=>b.id),['COL-L','COL-R','BEAM-TOP']);
 assert.equal(d.geometry.bayWidthM,6);
 assert.equal(d.geometry.heightM,4);
 assert.ok(d.frameStiffness.source.includes('Euler-Bernoulli'));
 assert.ok(d.frameStiffness.lateralKNM>300&&d.frameStiffness.lateralKNM<20000);
 assert.ok(d.input.dtSec<=.01&&d.input.accelerationMS2.length>=1401);
 assert.equal(d.cases.length,2);
 for(const c of d.cases){
  assert.equal(c.completeSeismicVerification,false);
  assert.equal(c.records.length,d.input.accelerationMS2.length);
  assert.ok(c.records.every(p=>Number.isFinite(p.displacementMM)&&Number.isFinite(p.velocityMS)&&Number.isFinite(p.roofAccelerationMS2)&&Number.isFinite(p.timeS)));
  assert.ok(c.energyAudit.maxNewtonResidual<1e-7);
  assert.ok(c.peakDriftPercent>0);
 }
 const a=d.cases.find(c=>c.id==='without'),b=d.cases.find(c=>c.id==='with');
 assert.equal(a.damperCkNsM,0);
 assert.equal(b.damperCkNsM,180);
 assert.ok(b.peakDisplacementMM<a.peakDisplacementMM,'damper case must lower the actual computed maximum displacement for chosen input');
 assert.ok(b.viscousDamperEnergyKNM>0);
 assert.ok(a.viscousDamperEnergyKNM===0);
 assert.ok(Math.abs(b.effectiveDampingKNsM-180*(6/Math.hypot(6,4))**2)<1e-7);
 assert.ok(d.comparison.driftReductionPercent>5&&d.comparison.driftReductionPercent<100);
 assert.match(d.input.recordType,/analytical/i);
});
test('Foundation section visibly embeds layered stress map and real animated 3D frame with actual D2 benchmark response controls',()=>{
 for(const file of ['index.html','it/index.html']){
  const html=read(file);
  const a=html.indexOf('id="engineering-benchmarks"'),b=html.indexOf('id="technical-library"',a);
  const scope=html.slice(a,b);
  assert.match(scope,/id="soil-stress-canvas"/);
  assert.match(scope,/id="soil-stress-field"/);
  assert.match(scope,/id="soil-stress-legend"/);
  assert.match(scope,/id="soil-stress-probe"/);
  assert.match(scope,/id="soil-profile-depth"/);
  assert.match(scope,/id="steel-damper-canvas"/);
  assert.match(scope,/id="steel-frame-toggle"/);
  assert.match(scope,/id="steel-frame-play"/);
  assert.match(scope,/id="steel-frame-time"/);
  assert.match(scope,/id="steel-frame-response"/);
  assert.match(scope,/id="steel-drift-reduction"/);
  assert.match(scope,/id="steel-damper-energy"/);
  assert.match(scope,/id="eng-device-law-details"/);
  assert.ok(html.includes('engineering-simulations.js?v='));
 }
 const js=read('engineering-simulations.js');
 for(const str of ['pile-stratigraphic-stress.json','steel-frame-viscous-comparison.json','pointermove','requestAnimationFrame','steel-frame-toggle','soil-stress-canvas'])assert.ok(js.includes(str),str);
 const css=read('style.css');
 assert.match(css,/\.soil-stress-scene/);
 assert.match(css,/\.steel-frame-scene/);
});
test('Engineering source provenance explains real D2 solves, exact gravity stress, proxy influence and SDOF limits',()=>{
 const p=read('assets/engineering/PROVENANCE.txt');
 assert.match(p,/PILE STRATIGRAPHY/i);
 assert.match(p,/EXACT.*lithostatic|exact.*gravity/i);
 assert.match(p,/APPROXIMATE.*stress influence|illustrative.*influence/i);
 assert.match(p,/FRAME TIME-HISTORY/i);
 assert.match(p,/equivalent.*SDOF/i);
 assert.match(p,/NOT Kratos.*viscous/i);
 assert.ok(statSync(resolve(root,'assets/engineering/pile-stratigraphic-stress.json')).size>50000);
 assert.ok(statSync(resolve(root,'assets/engineering/steel-frame-viscous-comparison.json')).size>30000);
});

test('Pile section makes native D2 shaft/toe reactions and computed settlement explicitly visible, not only a coloured stress proxy',()=>{
 const source=obj('assets/engineering/pile-stratigraphic-stress.json');
 for(const c of source.cases){
  const shaft=c.shaftNodes.reduce((s,n)=>s+n.reactionKN,0);
  assert.ok(shaft>0);
  assert.ok(c.toeReactionKN>0);
  assert.ok(Math.abs(shaft+c.toeReactionKN-c.loadKN)<1e-4);
 }
 for(const file of ['index.html','it/index.html']){
  const html=read(file);
  const a=html.indexOf('id="soil-stress-scene"');
  const b=html.indexOf('id="eng-pile-load-details"',a);
  const portion=html.slice(a,b);
  assert.match(portion,/id="soil-shaft-force"/);
  assert.match(portion,/id="soil-tip-force"/);
  assert.match(portion,/id="soil-head-settlement"/);
  assert.match(portion,/FUSTO|SHAFT/);
 }
 const script=read('engineering-simulations.js');
 assert.match(script,/sample\.shaftNodes\.reduce\(/);
 assert.match(script,/\$\('soil-shaft-force'\)\.textContent/);
 assert.match(script,/\$\('soil-tip-force'\)\.textContent/);
 assert.match(script,/\$\('soil-head-settlement'\)\.textContent/);
 assert.match(script,/shaft.*transfer.*vertically|vertical.*shaft.*transfer/i);
 assert.match(read('style.css'),/\.soil-reaction-strip/);
});
