import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'assets/real-d2',name),'utf8'));
const near=(a,b)=>Math.abs(a-b)<1e-7;
test('Steel tied-arch bridge is directly pinned on west side and longitudinally rolling on east, without support columns or RC pad footings',()=>{
 const bridge=read('showcase-steel-arch-bridge.hfm.json');
 const nodes=bridge.nodes.filter(n=>[0,96].includes(n.x)&&[-6.4,6.4].includes(n.y)&&near(n.z,12));
 assert.equal(nodes.length,4);
 for(const node of nodes){
  assert.deepEqual(node.fixed,node.x===0?[true,true,true,false,false,false]:[false,true,true,false,false,false],
   'Left bank anchored hinge, right bank longitudinal roller; no bending moment restraints');
 }
 assert.equal(bridge.members.filter(m=>m.material==='M_RC').length,0);
 assert.equal(bridge.foundationSystem?.items?.length??0,0);
 assert.ok(bridge.nodes.filter(n=>near(n.z,0)).length===0,'No structural node for pillars to terrain');
 const kinds=JSON.parse(fs.readFileSync(path.join(root,'assets/real-d2','showcase-geometry.mjs'),'utf8').match(/export const showcaseModels=(.*);/s)[1]).find(m=>m.id==='steel-arch-bridge');
 assert.equal(kinds.footings.length,0);
 assert.equal(kinds.supports.filter(s=>s.kind==='hinge').length,2);
 assert.equal(kinds.supports.filter(s=>s.kind==='roller').length,2);
});
test('Football stadium footing beams are true named D2 Winkler foundations and two central braced bays per side are structural trusses',()=>{
 const stadium=read('showcase-football-canopy.hfm.json');
 const family=stadium.foundationSystem.items;
 const pads=family.filter(f=>f.type==='direct');
 const winkler=family.filter(f=>f.type==='winkler');
 assert.equal(pads.length,18,'Nine columns on each of the two sides');
 assert.equal(winkler.length,16,'8 connections for each of two side foundations');
 assert.ok(winkler.every(f=>f.contactWidthM>.3&&f.contactWidthM<2));
 const nodes=new Map(stadium.nodes.map(n=>[n.id,n]));
 const beams=new Map(stadium.members.map(m=>[m.id,m]));
 for(const f of winkler){
  const m=beams.get(f.memberId);
  assert.ok(m,'Winkler foundation refers to actual D2 member');
  assert.equal(m.material,'M_RC');
  const a=nodes.get(m.n1),b=nodes.get(m.n2);
  assert.ok(near(a.z,0)&&near(b.z,0));
  assert.ok(near(a.y,b.y)&&[-42,42].includes(a.y));
  assert.ok(near(Math.abs(a.x-b.x),14.25));
  assert.ok(a.springs?.[2]>0&&b.springs?.[2]>0);
 }
 const showcase=fs.readFileSync(path.join(root,'assets/real-d2/showcase-geometry.mjs'),'utf8');
 const json=JSON.parse(showcase.match(/export const showcaseModels=(.*);/s)[1]).find(s=>s.id==='football-canopy');
 const braced=json.members.filter(m=>m.kind==='stadium-column-brace');
 assert.equal(braced.length,8,'X braces on both flanks, between two pairs of centre columns');
 for(const b of braced){
  assert.equal(b.material,'M_STEEL');
  const a=json.nodes[b.a],c=json.nodes[b.b];
  assert.ok([-42,42].includes(a[1])&&near(a[1],c[1]));
  assert.ok([4,15].includes(a[2])&&[4,15].includes(c[2]));
  assert.ok([-14.25,0,14.25].includes(a[0])&&[-14.25,0,14.25].includes(c[0]));
 }
});
test('The original eight-storey building source stays unchanged while foundation models are upgraded',()=>{
 const before={
  'complex-demonstration.hfm.json':'baaab78550ed055a3dedfea96a301305896481dc3e279164fc11ca026ccab31f',
 };
 const {createHash}=requireHash();
 for(const [f,expected] of Object.entries(before)){
  const digest=createHash('sha256').update(fs.readFileSync(path.join(root,'assets/real-d2',f))).digest('hex');
  assert.equal(digest,expected,f);
 }
});
function requireHash(){return {createHash:requireCryptoHash}}
import {createHash as requireCryptoHash} from 'node:crypto';
