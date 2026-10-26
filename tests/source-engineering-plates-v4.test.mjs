import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import{fileURLToPath}from'node:url';
const dir=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const path=x=>resolve(dir,x);
const read=x=>readFileSync(path(x),'utf8');
const source=JSON.parse(read('assets/technical-documents/delghem-drawing-evidence-v2.json'));
const manifest=JSON.parse(read('assets/technical-documents/drawing-source-v2-manifest.json'));
const kr=JSON.parse(read('assets/fem-lab/advanced-shell-results.json'));
test('real original RC frame geometry: 48 nodes, 87 members, 5 m bays, 3 × 3.2 m levels',()=>{
 const m=source.rc;
 assert.equal(m.nodes.length,48);
 assert.equal(m.members.length,87);
 assert.deepEqual([...new Set(m.nodes.map(n=>n.x))].sort((a,b)=>a-b),[0,5,10,15]);
 assert.deepEqual([...new Set(m.nodes.map(n=>n.y))].sort((a,b)=>a-b),[0,5,10]);
 assert.deepEqual([...new Set(m.nodes.map(n=>n.z))].sort((a,b)=>a-b),[0,3.2,6.4,9.6]);
 const nodes=new Set(m.nodes.map(n=>n.id));
 for(const el of m.members)assert.ok(nodes.has(el.n1)&&nodes.has(el.n2),el.id);
 assert.equal(manifest.rc.archiveA1,87);
 assert.equal(manifest.rc.completeExecutiveDesign,false);
});
test('real D2 steel output has 28 valid source-connected bolt groups and dimensioned plate layouts',()=>{
 const s=source.steel;assert.equal(s.boltDesigns.length,28);
 assert.equal(s.cases.length,28);
 assert.equal(s.members.length,35);
 for(const c of s.boltDesigns){
  assert.equal(c.rows,4);assert.equal(c.cols,2);
  assert.equal(c.diameterMm,30);assert.equal(c.holeDiameterMm,33);
  assert.equal(c.plateThicknessMm,40);
  assert.equal(c.pitchMm,270);assert.equal(c.gaugeMm,250);
  assert.equal(2*c.edgeTransverseMm+c.gaugeMm,480);
  assert.equal(2*c.edgeAlongMm+(c.rows-1)*c.pitchMm,1050);
 }
 assert.equal(s.completeConnectionVerification,false);
 assert.ok(s.cases.every(c=>c.maxUtilization>0&&c.maxUtilization<1));
 assert.equal(manifest.steel.boltGroups,28);
});
test('separate Kratos B01 source actually has Gauss-based von Mises values and honest solver scope',()=>{
 assert.equal(kr.sourceEngine,'KratosMultiphysics');
 assert.equal(kr.elements.length,176);assert.equal(kr.beams.length,66);
 const sample=kr.elements.flatMap(el=>el.gauss.flatMap(g=>[
  g.top.vonMisesMPa,g.bottom.vonMisesMPa]));
 assert.equal(sample.length,1408);
 assert.ok(Math.abs(Math.max(...sample)-manifest.kratos.vonMisesMaxMPa)<.000001);
 assert.ok(Math.abs(Math.min(...sample)-manifest.kratos.vonMisesMinMPa)<.000001);
 assert.ok(kr.residual<1e-8);
 assert.equal(manifest.kratos.sameDrawingModel,false);
});
test('all five vectors are XML-valid, full-resolution and preserve limits',()=>{
 for(const file of manifest.plates){
  const asset=path('assets/technical-documents/'+file);
  assert.ok(statSync(asset).size>16000,file);
  execFileSync('xmllint',['--noout',asset]);
  const xml=read('assets/technical-documents/'+file);
  assert.match(xml,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(xml,/NOT FOR CONSTRUCTION/);
  assert.match(xml,/DÈLGHEM/);
 }
 assert.match(read('assets/technical-documents/delghem-steel-bolting-fabrication.svg'),/250 mm/);
 assert.match(read('assets/technical-documents/delghem-steel-bolting-fabrication.svg'),/270 mm/);
 assert.match(read('assets/technical-documents/delghem-steel-portal-detail.svg'),/0\.539/);
 assert.match(read('assets/technical-documents/delghem-rc-engineering-ga.svg'),/5 000 mm/);
 assert.match(read('assets/technical-documents/delghem-kratos-source-benchmark.svg'),/INDEPENDENT NUMERICAL BENCHMARK/);
});
test('IT/EN pages offer full-sheet tabs and contextual Kratos companion without fake matching design results',()=>{
 for(const page of ['index.html','it/index.html']){
  const html=read(page);
  for(const file of manifest.plates)assert.ok(html.includes(file),page+' '+file);
  assert.equal((html.match(/data-tech-sheet=/g)||[]).length,4);
  assert.equal((html.match(/data-tech-file=/g)||[]).length,4);
  assert.match(html,/KRATOS MULTIPHYSICS \/ B01/);
  assert.match(html,/id="rc-drawing-code"/);
  assert.match(html,/id="steel-drawing-code"/);
  assert.match(html,/delghem-drawing-evidence|model.*D2|modello.*D2/i);
  assert.ok(html.indexOf('id="production-drawings"')<html.indexOf('id="materials-takeoff"'));
 }
 const ui=read('production-drawings.js');
 assert.match(ui,/setAttribute\('aria-pressed'/);
 assert.match(ui,/valid\.includes/);
 assert.match(ui,/viewer\.href/);
});
