import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const src=JSON.parse(read('assets/real-d2/complex-demonstration.hfm.json'));
const q=JSON.parse(read('assets/technical-documents/delghem-quantity-evidence.json'));
const nodes=Object.fromEntries(src.nodes.map(n=>[n.id,n]));
const sections=Object.fromEntries(src.sections.map(s=>[s.id,s]));
const materials=Object.fromEntries(src.materials.map(m=>[m.id,m]));
test('takeoff: 514 independent 1D elements, lengths and volumes computed directly from source nodes/sections',()=>{
 assert.equal(q.modelCounts.members,src.members.length);
 assert.equal(q.modelCounts.nodes,src.nodes.length);
 assert.equal(q.modelCounts.shells,src.shells.length);
 const agg={};
 for(const m of src.members){
  const a=nodes[m.n1],b=nodes[m.n2];
  const L=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  const v=L*sections[m.section].A;
  const row=agg[m.material]??={count:0,length:0,volume:0};
  row.count++;row.length+=L;row.volume+=v;
 }
 for(const [mat,row] of Object.entries(agg)){
  const actual=q.byMaterial[mat];
  assert.equal(actual.count,row.count);
  assert.ok(Math.abs(actual.lengthM-row.length)<.01,mat+' length');
  assert.ok(Math.abs(actual.volumeM3-row.volume)<.01,mat+' volume');
  const mass=row.volume*materials[mat].weightDensity*1000/9.80665;
  assert.ok(Math.abs(actual.massKg-mass)<.01,mat+' mass');
 }
});
test('takeoff: 112 shell surface areas and thickness-derived volumes are independently measured',()=>{
 assert.equal(src.shells.length,112);
 const agg={};
 for(const s of src.shells){
  const pts=s.nodes.map(id=>nodes[id]);const p=pts[0];let area=0;
  for(let i=1;i<pts.length-1;i++){
   const a=pts[i],b=pts[i+1],u=[a.x-p.x,a.y-p.y,a.z-p.z],v=[b.x-p.x,b.y-p.y,b.z-p.z];
   area+=.5*Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);
  }
  const row=agg[s.material]??={count:0,area:0,volume:0};row.count++;row.area+=area;row.volume+=area*s.thickness;
 }
 for(const [k,x] of Object.entries(agg)){
  const row=q.shellTakeoff[k];assert.equal(row.count,x.count);
  assert.ok(Math.abs(row.areaM2-x.area)<.02);
  assert.ok(Math.abs(row.volumeM3-x.volume)<.02);
 }
 assert.equal(q.rebarArchive.sheetCount,87);
 assert.ok(Math.abs(q.rebarArchive.totalBarKg-5239.487)<.01);
});
test('two genuine source-backed multiview drawings plus source PDF and complete original DXF archives',()=>{
 const base='assets/technical-documents/';
 for(const [file,magic] of [
  ['Armature-87-tavole-A1.zip','PK'],
  ['Acciaio-28-tavole-A1.zip','PK'],
  ['Armature-cinque-tavole-A1.pdf','%PDF'],
  ['Acciaio-tre-tavole-A1.pdf','%PDF']]){
  assert.ok(statSync(resolve(root,base+file)).size>1200,file);
  assert.ok(readFileSync(resolve(root,base+file)).subarray(0,magic.length).equals(Buffer.from(magic)),file+' file signature');
 }
 for(const type of ['rc','steel']){
  for(const version of ['assembly-sheet','multiview-board']){
   const content=read(base+'delghem-'+type+'-'+version+'.svg');
   assert.match(content,/<svg /);
   assert.match(content,/SOURCE|DXF|ORIGINAL/);
   assert.match(content,/NOT FOR CONSTRUCTION|PRELIMINARY|NOT EXECUTIVE/);
   assert.ok(statSync(resolve(root,base+'delghem-'+type+'-'+version+'.svg')).size>14000);
  }
 }
 const steel=read(base+'delghem-steel-assembly-sheet.svg');
 assert.match(steel,/BOLTED CONNECTION/);
 assert.match(steel,/BULLONE|WASHER|NUT/);
 assert.match(steel,/NOT VERIFIED|NOT FOR CONSTRUCTION/);
});
test('site chapters are ordered as requested and link to printable reports and source download',()=>{
 for(const page of ['index.html','it/index.html']){
  const h=read(page);
  const ids=['production-drawings','materials-takeoff','technical-reports','native'];
  const positions=ids.map(id=>h.indexOf('id="'+id+'"'));
  assert.ok(positions.every((p,i)=>p>=0&&(i===0||p>positions[i-1])),page);
  for(const name of ['delghem-rc-assembly-sheet.svg','delghem-steel-assembly-sheet.svg',
   'Armature-87-tavole-A1.zip','Acciaio-28-tavole-A1.zip',
   'delghem-material-takeoff.csv','delghem-quantity-evidence.json']) assert.ok(h.includes(name),page+' '+name);
  assert.match(h,/id="materials-shell-table"/);
  assert.equal((h.match(/class="reports-card reports-card--/g)||[]).length,3);
 }
});
test('technical reports provide model + quantity + provenance, prints, and openly declare no certification',()=>{
 for(const language of ['it','en']){
  const page=read('reports/'+language+'/index.html');
  for(const id of ['report-model','report-quantity','report-provenance'])assert.ok(page.includes('id="'+id+'"'));
  assert.match(page,/window.print\(\)/);
  assert.match(page,/shell|Shell/);
  assert.match(page,/514/);
  assert.match(page,/87/);
  assert.match(page,/completeExecutiveDesign = false/);
  assert.match(page,/NOT|NON/);
  assert.doesNotMatch(page,/certified complete design|completeExecutiveDesign = true/);
 }
 const csv=read('assets/technical-documents/delghem-material-takeoff.csv');
 assert.match(csv,/M_STEEL/);
 assert.match(csv,/SHELL/);
 assert.match(csv,/DIFFERENT PROJECT/);
});
