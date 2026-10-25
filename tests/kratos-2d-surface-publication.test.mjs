import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=p=>JSON.parse(read(p));
test('Three genuine QUAD4 Kratos 2D surfaces preserve mesh holes, finite Gauss face stresses and source input SHA256',async()=>{
 const result=data('assets/fem-lab/kratos-2d-surfaces.json');
 assert.equal(result.schema,'delghem-kratos-2d-surface-suite-1');
 assert.equal(result.engine,'KratosMultiphysics');
 assert.equal(result.cases.length,3);
 const names=['skewed-double-opening-slab','double-window-shear-wall','l-shaped-transfer-plate'];
 for(const [i,c] of result.cases.entries()){
  assert.equal(c.id,names[i]);
  assert.equal(c.sourceEngine,'KratosMultiphysics');
  assert.equal(c.analysis,'static / linear elastic');
  assert.ok(c.mesh.shells>=260&&c.mesh.shells<=300);
  assert.ok(c.mesh.nodes<=512);
  assert.ok(c.diagnostics.residual<1e-7&&Number.isFinite(c.diagnostics.maxAbsDisplacementM));
  assert.equal(c.completeStructuralVerification,false);
  assert.equal(c.mesh.shells,c.elements.length);
  assert.equal(c.mesh.gaussPerShell,4);
  assert.match(c.stressRecovery,/N\/h/);
  const input=data('assets/fem-lab/'+c.sourceFile);
  assert.equal(input.schema,'hyperfem-1');
  const sha=(await import('node:crypto')).createHash('sha256').update(read('assets/fem-lab/'+c.sourceFile)).digest('hex');
  assert.equal(c.sourceSha256,sha);
  const flat=c.elements.flatMap(e=>e.gauss.flatMap(g=>g.top.concat(g.bottom)));
  assert.ok(flat.every(Number.isFinite));
  assert.ok(flat.some(x=>x>0));
  assert.ok(c.elements.every(e=>e.vertices.length===4&&e.gauss.length===4));
 }
});
test('Three Kratos surfaces are prominently visible within full scrollable FEM section in both languages with no tab-only access',()=>{
 for(const page of ['index.html','it/index.html']){
  const html=read(page);
  const a=html.indexOf('id="fem-lab"'),b=html.indexOf('id="technical-library"');
  const lab=html.slice(a,b);
  assert.ok(a>=0&&b>a);
  assert.match(lab,/id="surface-lab"/);
  assert.match(lab,/id="surface-lab-controls"/);
  assert.match(lab,/id="surface-field"/);
  assert.match(lab,/id="surface-face"/);
  assert.match(lab,/id="surface-mesh-toggle"/);
  for(const key of ['skewed-double-opening-slab','double-window-shear-wall','l-shaped-transfer-plate']){
   assert.ok(lab.includes('data-surface="'+key+'"'),key);
   assert.ok(lab.includes('surface-'+key+'.webp'),key+' static recovery image');
  }
  assert.ok(lab.includes('id="surface-focus-status"'));
  assert.match(html,/surface-studio\.js\?v=/);
 }
 const script=read('surface-studio.js');
 for(const phrase of ['kratos-2d-surfaces.json','vonMisesMPa','sigma11MPa','sigma22MPa','tau12MPa','devicePixelRatio' ,'pointermove','getContext'])assert.ok(script.includes(phrase),phrase);
 assert.match(read('style.css'),/\.surface-studio/);
});
