import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const text=x=>readFileSync(resolve(root,x),'utf8');
const json=x=>JSON.parse(text(x));
test('Native terminal has 52 Winkler grade beams connecting all 32 pad footings, with positive soil springs',async()=>{
 const m=json('assets/real-d2/showcase-timber-terminal.hfm.json');
 const p=m.foundationSystem?.items??[],pads=p.filter(x=>x.type==='direct'),winkler=p.filter(x=>x.type==='winkler');
 assert.equal(pads.length,32);
 assert.equal(winkler.length,52,'28 longitudinal, 16 transverse and eight inner-court connections');
 assert.ok(winkler.every(x=>x.contactWidthM>=.5&&x.contactWidthM<=1.1));
 assert.ok(m.foundationSystem.soilLayers.length>=1);
 const members=new Map(m.members.map(x=>[x.id,x])),nodes=new Map(m.nodes.map(x=>[x.id,x]));
 const adjacency=new Map();
 for(const f of winkler){
  const b=members.get(f.memberId);
  assert.ok(b,'Winkler entry references actual D2 concrete member');
  assert.equal(b.material,'M_RC');
  const a=nodes.get(b.n1),c=nodes.get(b.n2);
  assert.ok(a&&c&&Math.abs(a.z)<1e-8&&Math.abs(c.z)<1e-8);
  assert.ok(a.springs?.[2]>0&&c.springs?.[2]>0);
  const length=Math.hypot(a.x-c.x,a.y-c.y);
  assert.ok(length>=7&&length<=13,'no fictitious 36m unsupported grade beam');
  for(const [u,v] of [[a.id,c.id],[c.id,a.id]]){
   if(!adjacency.has(u))adjacency.set(u,[]);
   adjacency.get(u).push(v);
  }
 }
 const padNodes=new Set(pads.map(f=>f.nodeId));
 assert.equal(padNodes.size,32);
 const visited=new Set(),queue=[pads[0].nodeId];
 while(queue.length){
  const a=queue.pop();
  if(visited.has(a))continue;
  visited.add(a);
  for(const b of adjacency.get(a)??[])queue.push(b);
 }
 for(const id of padNodes)assert.ok(visited.has(id),'disconnected concrete footing '+id);
 const {showcaseModels}=await import('../assets/real-d2/showcase-geometry.mjs');
 const t=showcaseModels.find(x=>x.id==='timber-terminal');
 assert.equal(t.winklerCount,52);
 assert.equal(t.members.filter(x=>x.kind==='terminal-winkler-grade-beam').length,52);
 assert.equal(t.footings.length,32);
 const {createHash}=await import('node:crypto');
 const digest=createHash('sha256').update(readFileSync(resolve(root,'assets/real-d2/showcase-timber-terminal.hfm.json'))).digest('hex');
 assert.equal(t.source.derivedModelSha256,digest);
});
test('Five-model 3D scene exposes seven camera preset controls plus zoom and perspective projection in IT/EN',()=>{
 const views=['iso','top','bottom','front','back','left','right'];
 for(const name of ['index.html','it/index.html']){
  const h=text(name);
  assert.match(h,/id="model-camera-controls"/);
  assert.match(h,/id="model-projection-toggle"/);
  assert.match(h,/id="model-zoom-in"/);
  assert.match(h,/id="model-zoom-out"/);
  assert.match(h,/id="model-view-readout"/);
  for(const view of views)assert.ok(h.includes('data-model-camera="'+view+'"'),name+' '+view);
  assert.match(h,/id="model-showcase-counter"[^>]*>01 \/ 05</);
 }
 const js=text('model-stage.js');
 for(const symbol of ['CAMERA_PRESETS','setCameraView','projectionMode','zoomFactor','model-projection-toggle','model-zoom-in','model-zoom-out','normalizeAngle','wheel','pointermove'])assert.ok(js.includes(symbol),symbol);
 assert.doesNotMatch(js,/pitch=clamp\([^;]*,-\.05,\.95\)/);
 assert.match(text('style.css'),/\.model-camera-dock/);
});
test('Terminal and stadium foundation inspection controls show only true typed D2 Winkler members and existing concrete footings',()=>{
 for(const page of ['index.html','it/index.html']){
  const html=text(page);
  assert.match(html,/id="model-foundations-toggle"/);
  assert.match(html,/aria-pressed="false"/);
 }
 const js=text('model-stage.js');
 assert.match(js,/model-foundations-toggle/);
 assert.match(js,/stadium-winkler-grade-beam/);
 assert.match(js,/terminal-winkler-grade-beam/);
 assert.match(js,/mode==='foundations'/);
 assert.match(js,/mixedDemo\.footings/);
 const t=json('assets/real-d2/showcase-timber-terminal.hfm.json');
 assert.equal(t.foundationSystem.items.filter(x=>x.type==='winkler').length,52);
});
test('Site has a modern engineering-first hierarchy: hero above donation, clear proof and editorial navigation',()=>{
 for(const name of ['index.html','it/index.html']){
  const h=text(name),header=h.indexOf('<header class="site-header'),hero=h.indexOf('<section class="hero'),donate=h.indexOf('<section class="support-banner');
  assert.ok(header>=0&&hero>header,name+' header before hero');
  assert.ok(donate>hero,name+' donation after hero');
  assert.ok(h.includes('id="showcase-guide"'));
  assert.ok(h.includes('class="hero-proof"'));
  assert.ok(h.includes('class="editorial-hub"'));
  assert.ok(h.includes('id="editorial-hub"'));
  for(const target of ['#app','#fem-lab','#native','#genius'])assert.ok(h.includes('href="'+target+'"'));
  for(const target of ['id="fem-lab"','id="gallery"','id="genius"','id="workflow"','id="capabilities"'])assert.ok(h.includes(target));
  assert.match(h,/mailto:delghem@proton\.me/);
 }
 const css=text('style.css');
 assert.match(css,/\.hero-proof/);
 assert.match(css,/\.editorial-hub/);
});
