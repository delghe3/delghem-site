import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const nearly=(a,b,t=1e-9)=>Math.abs(a-b)<=t;

test('DÈLGHEM portal rendered from its actual native D2 nodes and THREE members, never a fabricated second frame',async()=>{
 const {buildNativePortalScene}=await import('../steel-portal-renderer.mjs');
 const source=json('assets/engineering/portal-steel-d2.hfm.json');
 const result=json('assets/engineering/steel-frame-viscous-comparison.json');
 const scene=buildNativePortalScene(source,result.geometry);
 assert.deepEqual(scene.nodeIds,['BL','BR','TL','TR']);
 assert.deepEqual(scene.memberIds,['COL-L','COL-R','BEAM-TOP']);
 assert.equal(scene.sourceNodeCount,4);
 assert.equal(scene.sourceMemberCount,3);
 assert.equal(scene.solids.length,9,'three actual I-profile flange/web solids for each genuine source member');
 assert.equal(scene.columns.length,2);
 assert.equal(scene.beams.length,1);
 assert.equal(scene.fictitiousExtrusionMembers,0);
 assert.ok(scene.nodes.every(n=>n.y===0),'native planar portal is XZ, not a duplicated 3D four-column building');
 assert.ok(scene.columns.every(x=>x.profile==='HEB260'));
 assert.equal(scene.beams[0].profile,'IPE330');
 assert.deepEqual(scene.boundaryRestraints.map(x=>x.id),['BL','BR']);
 assert.ok(scene.boundaryRestraints.every(x=>x.fixed.every(Boolean)));
 assert.deepEqual(scene.damperAnchors,['BL','TR']);
 assert.equal(scene.numericalDimension,'2D / equivalent-SDOF');
});
test('Exact D2 catalog HEB260/IPE330 heights and flange/web dimensions control real I-section surfaces',async()=>{
 const {buildNativePortalScene}=await import('../steel-portal-renderer.mjs');
 const model=json('assets/engineering/portal-steel-d2.hfm.json');
 const comparison=json('assets/engineering/steel-frame-viscous-comparison.json');
 const scene=buildNativePortalScene(model,comparison.geometry);
 assert.deepEqual(Object.keys(comparison.geometry.sectionShapes).sort(),['S_HEB260','S_IPE330']);
 const H=comparison.geometry.sectionShapes.S_HEB260;
 const I=comparison.geometry.sectionShapes.S_IPE330;
 assert.ok(nearly(H.h,.26)&&nearly(H.b,.26)&&nearly(H.tw,.01)&&nearly(H.tf,.0175));
 assert.ok(nearly(I.h,.33)&&nearly(I.b,.16)&&nearly(I.tw,.0075)&&nearly(I.tf,.0115));
 assert.deepEqual(scene.solids.map(x=>x.sourceMemberId).sort(),[
  'BEAM-TOP','BEAM-TOP','BEAM-TOP','COL-L','COL-L','COL-L','COL-R','COL-R','COL-R'
 ]);
 for(const item of scene.solids){
  assert.ok(item.widthM>0&&item.thicknessM>0);
  assert.ok(item.sourceMemberId);
  assert.ok(['flange-near','flange-far','web'].includes(item.part));
 }
});
test('Native frame projection preserves fixed bases, physical joints and device exactly on the BL→TR line under response',async()=>{
 const {buildNativePortalScene,projectPortalScene}=await import('../steel-portal-renderer.mjs');
 const frame=json('assets/engineering/portal-steel-d2.hfm.json');
 const graph=json('assets/engineering/steel-frame-viscous-comparison.json');
 const scene=buildNativePortalScene(frame,graph.geometry);
 const base=projectPortalScene(scene,{width:830,height:440,yaw:-.55,pitch:.45,driftMM:0,exaggeration:12,withDamper:true});
 const moved=projectPortalScene(scene,{width:830,height:440,yaw:-.55,pitch:.45,driftMM:40,exaggeration:12,withDamper:true});
 assert.equal(base.portalMembers.length,3);
 assert.equal(base.columnMemberCount,2);
 assert.equal(base.damper.connectedTo[0],'BL');
 assert.equal(base.damper.connectedTo[1],'TR');
 assert.equal(base.damper.cylinderIsCoaxial,true);
 assert.ok(base.damper.lengthM>7&&base.damper.lengthM<8);
 assert.deepEqual(base.nodePositions.BL,moved.nodePositions.BL);
 assert.deepEqual(base.nodePositions.BR,moved.nodePositions.BR);
 assert.ok(nearly(moved.nodePositions.TR[0]-base.nodePositions.TR[0],.48));
 assert.ok(nearly(moved.nodePositions.TL[0]-base.nodePositions.TL[0],.48));
 assert.ok(nearly(moved.damper.end[0]-moved.nodePositions.TR[0],0));
 assert.ok(moved.structuralFaces.length>=45);
 assert.equal(moved.sourceMemberCount,3);
 const front=projectPortalScene(scene,{width:830,height:440,yaw:0,pitch:0,driftMM:0,exaggeration:12,withDamper:false});
 assert.equal(front.damper,null);
 assert.equal(front.portalMembers.length,3);
 assert.ok(front.viewport.width>0&&front.viewport.height>0);
});
test('3D portal Canvas draws only actual D2 source members and source-authenticated dimensions, with honest reduced-order scope',()=>{
 const main=read('engineering-simulations.js');
 const profile=read('steel-portal-renderer.mjs');
 assert.match(main,/portal-steel-d2\.hfm\.json/);
 assert.match(main,/renderNativeSteelPortal/);
 assert.doesNotMatch(main,/const portal=\[0,3\]/);
 assert.doesNotMatch(main,/for\(const offsetY of portal\)/);
 assert.match(main,/frameNative/);
 assert.match(profile,/portal\.geometry|member\.section|sourceMemberId/);
 for(const file of ['index.html','it/index.html']){
  const html=read(file);
  assert.match(html,/steel-damper-canvas/);
  assert.match(html,/Vista.*XZ|Front.*XZ/);
  assert.match(html,/modello.*piano|planar.*model/i);
  assert.match(html,/HEB260/);
  assert.match(html,/IPE330/);
  assert.match(html,/steel-frame-camera/);
 }
});

test('Structural source model remains directly inspectable from both languages and the media kit discloses planar D2 rendering',()=>{
 for(const htmlName of ['index.html','it/index.html']){
  const s=read(htmlName);
  assert.match(s,/class="eng-native-portal-link"/);
  assert.match(s,/portal-steel-d2\.hfm\.json/);
  assert.match(s,/XZ/);
  assert.match(s,/id="steel-frame-thickness"/);
  assert.match(s,/id="steel-frame-front"/);
 }
 for(const media of ['media-kit/index.html','en/media-kit/index.html']){
  const s=read(media);
  assert.match(s,/due pilastri|two HEB260 columns/i);
  assert.match(s,/HEB260/);
  assert.match(s,/IPE330/);
 }
});
