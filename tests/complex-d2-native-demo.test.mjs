import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {homedir} from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const projectPath='assets/real-d2/complex-demonstration.hfm.json';
const geometryPath='assets/real-d2/complex-demo-geometry.mjs';
const sha=data=>createHash('sha256').update(data).digest('hex');

test('site complex 3D is derived from a real, reproducible native DÈLGHEM D2 project',async()=>{
  assert.ok(existsSync(resolve(root,projectPath)),'missing real .hfm.json model');
  const sourceBuffer=readFileSync(resolve(root,projectPath));
  const native=JSON.parse(sourceBuffer);
  assert.equal(native.schema,'hyperfem-1');
  assert.equal(native.units,'kN-m');
  assert.equal(native.foundationSystem?.schema,'delghem-d2-foundations-1');
  assert.ok(native.foundationSystem.items.length>=15);
  assert.ok(native.materials.some(m=>m.catalog?.key==='GL_GL24h'));
  assert.ok(native.materials.some(m=>m.catalog?.key==='OPEN_S355'));
  assert.ok(native.materials.some(m=>m.catalog?.key==='C30_37'));
  assert.ok(native.members.some(m=>m.type==='truss'&&m.material==='M_WOOD'));
  assert.ok(native.members.some(m=>m.type==='truss'&&m.material==='M_STEEL'));
  const {complexDemo}=await import('../'+geometryPath);
  assert.equal(complexDemo.source.derivedModelSha256,sha(sourceBuffer));
  assert.equal(complexDemo.nodes.length,native.nodes.length);
  assert.equal(complexDemo.members.length,native.members.length);
  assert.equal(complexDemo.shells.length,native.shells.length);
  assert.equal(complexDemo.footings.length,native.foundationSystem.items.filter(i=>i.type==='direct').length);
  assert.deepEqual(complexDemo.qualifications,{solved:false,designed:false,executive:false});
  const path=resolve(homedir(),'Desktop/D2/Progetto/src/core/model.mjs');
  if(existsSync(path)){
    const {validateEditableModel}=await import(pathToFileURL(path));
    assert.equal(validateEditableModel(native),native,'model must pass the actual D2 validator');
  }
});
test('asymmetric model visibly includes cantilevers, two truss systems, stepped roofs and native pad footings',async()=>{
  const {complexDemo}=await import('../'+geometryPath);
  const kinds=new Set(complexDemo.members.map(m=>m.kind));
  for(const kind of ['steel-truss','wood-truss','cantilever','wood-post','main-beam','rc-column'])
    assert.ok(kinds.has(kind),'Missing '+kind);
  assert.ok(complexDemo.footings.length>=15);
  assert.ok(complexDemo.members.filter(m=>m.kind==='steel-truss').length>=22);
  assert.ok(complexDemo.members.filter(m=>m.kind==='wood-truss').length>=22);
  assert.ok(complexDemo.members.filter(m=>m.kind==='cantilever').length>=5);
  assert.ok(new Set(complexDemo.roofLevels).size>=4,'require roofs at multiple elevations');
  const minX=Math.min(...complexDemo.nodes.map(p=>p[0]));
  assert.ok(minX<0,'west cantilever extends beyond the first ground support');
  const allFootings=new Set(complexDemo.footings.map(f=>f.nodeId));
  assert.equal(allFootings.size,complexDemo.footings.length);
  assert.ok(complexDemo.footings.every(f=>f.widthM>0&&f.lengthM>0&&f.thicknessM>0));
});
test('production renderer draws the actual new D2 structures with bright material colors',()=>{
  const js=read('model-stage.js');
  assert.match(js,/complex-demo-geometry\.mjs/);
  assert.match(js,/complexDemo/);
  assert.match(js,/mixedDemo\.footings/);
  assert.match(js,/wood-truss/);
  assert.match(js,/steel-truss/);
  assert.match(js,/rc-footing/);
  for(const page of ['index.html','it/index.html']){
    const source=read(page);
    assert.match(source,/capriat|truss/i);
    assert.match(source,/fondazion|foundation/i);
    assert.match(source,/non.*verificat|not.*verified|no numerical checks|no.*analysis/i);
  }
});
