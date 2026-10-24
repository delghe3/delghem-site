import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const json=path=>JSON.parse(read(path));
const real=(s)=>s&&typeof s==='number'&&Number.isFinite(s);
test('Scrolling FEM laboratory shows four analytical chapters without click-to-reveal tabs',{timeout:10000},()=>{
 for(const lang of ['index.html','it/index.html']){
  const html=read(lang),s=html.slice(html.indexOf('<section class="fem-lab-section'),html.indexOf('<section class="genius-section'));
  assert.ok(s.length>6000,lang);
  assert.doesNotMatch(s,/data-lab-tab/);
  assert.doesNotMatch(s,/role="tabpanel"/);
  for(const id of ['stress','pushover','ida','accelerograms']){
   assert.ok(s.includes('id="lab-panel-'+id+'"'),id);
   assert.doesNotMatch(s,new RegExp('id="lab-panel-'+id+'"[^>]*hidden'));
  }
  assert.ok(['stress','pushover','ida','accelerograms'].every((x,i,a)=>i===0||s.indexOf('id="lab-panel-'+a[i-1]+'"')<s.indexOf('id="lab-panel-'+x+'"')),'correct scroll order');
  for(const id of ['lab-stress-canvas','lab-pushover-svg','lab-pushover-y-svg','lab-plastic-svg','lab-ida-svg','lab-ida-y-svg','lab-hysteresis-svg','lab-hysteresis-y-svg','lab-accelerograms-svg','lab-accelerograms-y-svg','lab-response-svg','lab-response-y-svg'])assert.ok(s.includes('id="'+id+'"'),lang+' '+id);
  assert.ok(s.includes('lab-scroll-index')&&s.includes('href="#lab-panel-ida"'));
  assert.match(s,/d2-pushover-original-ui/);
  assert.match(s,/d2-ida-original-ui/);
 }
 assert.match(read('fem-lab.js'),/native-nonlinear-ida\.json/);
 assert.match(read('fem-lab.js'),/native-plastic-pushover\.json/);
 assert.match(read('fem-lab.js'),/advanced-shell-results\.json/);
});
test('Advanced D2 shell contours are real nonlinear-adjacent detailed structural static results',()=>{
 const a=json('assets/fem-lab/advanced-shell-results.json');
 assert.equal(a.schema,'delghem-showcase-shell-1');
 assert.equal(a.sourceEngine,'OpenSeesPy');
 assert.ok(a.residual<1e-7);
 assert.equal(a.mesh.shellCount,176);
 assert.equal(a.elements.length,176);
 assert.equal(a.beams.length,66);
 assert.ok(a.mesh.nodeCount>=200);
 assert.match(a.sourceFixtureSha256,/^[a-f0-9]{64}$/);
 assert.match(a.rawSolverResultSha256,/^[a-f0-9]{64}$/);
 for(const e of a.elements){
  assert.equal(e.gauss.length,4);
  assert.equal(e.vertices.length,4);
  for(const x of e.gauss)for(const side of ['top','bottom'])for(const field of ['sigma11MPa','sigma22MPa','tau12MPa','vonMisesMPa'])assert.ok(Number.isFinite(x[side][field]));
 }
 assert.ok(a.beams.every(x=>x.n1&&x.n2&&x.a.length===3&&x.b.length===3));
});
test('Genuine steel fiber X/Y nonlinear Pushover capacity curves contain observed plastic branch, not a fabricated bending curve',()=>{
 const a=json('assets/fem-lab/native-plastic-pushover.json');
 assert.equal(a.schema,'delghem-showcase-plastic-pushover-1');
 assert.equal(a.realNonlinearBenchmarks.length,2);
 assert.deepEqual(a.realNonlinearBenchmarks.map(r=>r.direction),['X','Y']);
 for(const r of a.realNonlinearBenchmarks){
  assert.equal(r.sourceEngine,'OpenSeesPy');
  assert.equal(r.material,'steel-fiber');
  assert.equal(r.completed,true);
  assert.equal(r.completeStructuralVerification,false);
  assert.equal(r.points.length,32);
  assert.ok(r.maxPlasticStrain>1e-4);
  assert.ok(r.points.every(p=>Number.isFinite(p.shearKN)&&Number.isFinite(p.displacementMM)&&Number.isFinite(p.maxPlasticStrain)));
  const plastic=r.points.find(p=>p.maxPlasticStrain>1e-7);
  assert.ok(plastic&&plastic.displacementMM>r.points[0].displacementMM);
  const stiffness0=r.points[1].shearKN/r.points[1].displacementMM;
  const stiffnessAfter=(r.points.at(-1).shearKN-plastic.shearKN)/(r.points.at(-1).displacementMM-plastic.displacementMM);
  assert.ok(Math.abs(stiffnessAfter)<Math.abs(stiffness0)*.7,JSON.stringify({direction:r.direction,stiffness0,stiffnessAfter}));
  assert.match(r.rawSolverResultSha256,/^[a-f0-9]{64}$/);
 }
});
test('Genuine IDA uses 16 actual Kratos steel-fiber results and all native time histories',()=>{
 const a=json('assets/fem-lab/native-nonlinear-ida.json');
 assert.equal(a.schema,'delghem-showcase-steel-ida-1');
 assert.equal(a.models.length,2);
 const scales=[.05,.15,.3,.45,.6,.75,.9,1];
 for(const m of a.models){
  assert.equal(m.engine,'KratosMultiphysics');
  assert.equal(m.material,'steel-fiber');
  assert.equal(m.runs.length,8);
  assert.deepEqual(m.runs.map(x=>x.scale),scales);
  assert.ok(m.runs.every(x=>x.status==='completed'&&x.trajectory.length>=240));
  assert.ok(m.runs.slice(4).every(x=>x.maxPlasticStrain>0));
  assert.ok(m.runs.every(x=>x.trajectory.every(p=>Number.isFinite(p.timeS)&&Number.isFinite(p.groundAccelG)&&Number.isFinite(p.displacementMM)&&Number.isFinite(p.baseShearKN))));
  assert.match(m.nativeResultSha256,/^[a-f0-9]{64}$/);
  assert.equal(m.completeStructuralVerification,false);
 }
 assert.equal(a.noFragilityClaim,true);
});
test('Actual D2 screenshots are preserved unmodified with identifiable image bytes',()=>{
 for(const [name,hash] of [
  ['d2-ida-original-ui.png','603961008601ec9e18f1a7696e4ee11c5e3f2729260903d8a03e141efc5b4507'],
  ['d2-pushover-original-ui.png','01183a6318bcb5bc0d32aafad5471902cfbcbd04a45929e9c38da059d3190eff']
 ]){const b=readFileSync(resolve(root,'assets/fem-lab',name));assert.ok(b.length>100000);assert.equal(createHash('sha256').update(b).digest('hex'),hash);}
});
