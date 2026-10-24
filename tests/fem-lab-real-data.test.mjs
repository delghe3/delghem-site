import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=x=>fs.readFileSync(path.join(root,x),'utf8');
const data=x=>JSON.parse(file(x));
test('Only native Kratos solver shell output is published and physical MPa reconstruction is documented',()=>{
 const d=data('assets/fem-lab/advanced-shell-results.json');
 assert.equal(d.schema,'delghem-showcase-shell-1');
 assert.equal(d.sourceEngine,'KratosMultiphysics');
 assert.equal(d.mesh.shellCount,176);
 assert.equal(d.elements.length,176);
 assert.equal(d.beams.length,66);
 assert.ok(d.residual<1e-7);
 assert.match(d.stressRecovery,/N\/h/);
 assert.match(d.rawSolverResultSha256,/^[a-f0-9]{64}$/);
 for(const element of d.elements)for(const gp of element.gauss){
  for(const face of ['top','bottom'])
   for(const f of ['sigma11MPa','sigma22MPa','tau12MPa','vonMisesMPa'])
    assert.ok(Number.isFinite(gp[face][f]),element.id+' '+f);
 }
});
test('Steel material plasticity comes only from an actual completed Kratos axial cyclic load history',()=>{
 const d=data('assets/fem-lab/native-kratos-cyclic.json');
 assert.equal(d.engine,'KratosMultiphysics');
 assert.equal(d.analysis,'nonlinear-static');
 assert.equal(d.complete,true);
 assert.equal(d.material,'steel-fiber');
 assert.equal(d.geometry,'axial');
 assert.equal(d.states.length,240);
 assert.equal(d.branches.length,5);
 assert.ok(d.maxPlasticStrain>1e-3);
 assert.ok(d.states.every(x=>Number.isFinite(x.axialForceKN)&&Number.isFinite(x.displacementMM)&&Number.isFinite(x.maxPlasticStrain)&&x.converged));
 assert.ok(d.branches.every(b=>b.points.length===48));
 assert.equal(d.claimsGlobalPushoverCapacity,false);
 assert.ok(d.states.some(x=>x.axialForceKN>0)&&d.states.some(x=>x.axialForceKN<0));
 assert.match(d.sourceSha256,/^[a-f0-9]{64}$/);
});
test('IDA and acceleration data remain genuinely computed by Kratos',()=>{
 const d=data('assets/fem-lab/native-nonlinear-ida.json');
 assert.equal(d.schema,'delghem-showcase-steel-ida-1');
 assert.equal(d.models.length,2);
 assert.equal(d.noFragilityClaim,true);
 for(const m of d.models){
  assert.equal(m.engine,'KratosMultiphysics');
  assert.equal(m.runs.length,8);
  assert.ok(m.inputRecordG.length>500);
  assert.ok(m.runs.every(r=>r.status==='completed'&&r.trajectory.length>200));
 }
});
test('All four source-backed analytical chapters are visible in IT and EN even without client scripts',()=>{
 for(const p of ['index.html','it/index.html']){
  const html=file(p),start=html.indexOf('<section class="fem-lab-section'),
    end=html.indexOf('<section class="genius-section',start),s=html.slice(start,end);
  assert.ok(s.length>7000);
  for(const id of ['stress','pushover','ida','accelerograms']){
   assert.match(s,new RegExp('id="lab-panel-'+id+'"'));
   assert.doesNotMatch(s,new RegExp('id="lab-panel-'+id+'"[^>]*hidden'));
  }
  assert.match(s,/id="lab-stress-canvas"/);
  assert.match(s,/id="lab-pushover-svg"/);
  assert.match(s,/id="lab-ida-svg"/);
  assert.match(s,/id="lab-accelerograms-svg"/);
  assert.match(s,/KratosMultiphysics/);
  assert.match(s,/assial|axial/i);
  assert.match(s,/non.*Pushover|not.*lateral Pushover|non.*curva/i);
  assert.match(html,/fem-lab\.js/);
 }
 const script=file('fem-lab.js');
 assert.match(script,/native-kratos-cyclic\.json/);
 assert.match(script,/advanced-shell-results\.json/);
 assert.match(script,/native-nonlinear-ida\.json/);
 assert.match(script,/pointerdown/);
 assert.match(file('style.css'),/\.fem-lab-section/);
});
test('Site retains detailed honest provenance and reproducible Kratos-only source scripts',()=>{
 const provenance=file('assets/fem-lab/PROVENANCE.txt');
 assert.match(provenance,/KratosMultiphysics/);
 assert.match(provenance,/SHA256/);
 assert.match(provenance,/not.*certified|non.*certificat/i);
 for(const s of ['build-kratos-shell.mjs','build-kratos-cyclic.mjs','build-advanced-ida.mjs']){
  assert.ok(fs.statSync(path.join(root,'scripts',s)).size>500);
 }
});
