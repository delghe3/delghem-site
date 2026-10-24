import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const model=()=>JSON.parse(read('assets/real-d2/complex-demonstration.hfm.json'));
const exported=()=>import('../assets/real-d2/complex-demo-geometry.mjs');
test('homepage 3D model is a genuine 8-storey D2 editable mixed-material tower, not a 3-storey low-rise',async()=>{
 const m=model(),{complexDemo:g}=await exported();
 assert.equal(g.storeyCount,8);
 assert.equal(g.levels.length,9,'ground + eight separate elevated storeys');
 assert.ok(g.levels[0]===0&&g.levels[8]>=27&&g.levels.every((z,i)=>i===0||z>g.levels[i-1]),'eight floors above ground');
 assert.equal(m.schema,'hyperfem-1');
 assert.ok(m.shells.filter(e=>e.material==='M_RC').length>=40,'8-floor RC composite model must have actual shell deck');
 assert.ok(m.members.filter(e=>e.material==='M_RC').length>=15,'continuous reinforced concrete core');
 assert.ok(m.members.filter(e=>e.material==='M_STEEL').length>=130,'substantial native steel framing');
 assert.ok(m.members.filter(e=>e.material==='M_WOOD').length>=35,'real timber trusses, posts and purlins');
 assert.ok(g.nodes.length>=140&&g.members.length>=320,'geometrical complexity visibly exceeds first 3-storey build');
 assert.ok(g.footings.length>=20,'every source basement support has a D2 DIRECT footing');
 assert.deepEqual(g.qualifications,{solved:false,designed:false,executive:false});
});
test('eight-storey architectural structure has differentiated REAL pitched roofs, setbacks, RC core and balcony slabs',async()=>{
 const {complexDemo:g}=await exported();
 const kinds=new Set(g.members.map(m=>m.kind));
 for(const name of ['steel-truss','wood-truss','steel-column','rc-column','main-beam','secondary-beam','cantilever','wood-purlin','steel-purlin']){
   assert.ok(kinds.has(name),name);
 }
 const faceTypes=new Set(g.shells.map(s=>s.kind));
 for(const name of ['rc-floor','rc-wall','rc-balcony','wood-roof','steel-roof','rc-roof'])assert.ok(faceTypes.has(name),'missing '+name);
 assert.ok(g.roofLevels.length>=5,'different timber/steel/RC roof heights');
 assert.ok(Math.max(...g.roofLevels)>g.levels.at(-1),'pitched rooftop above eighth floor');
 assert.ok(g.members.filter(m=>m.kind==='brace').length<=14,'avoid a messy facade filled with braces');
 const highZ=g.levels[8],high=g.members.filter(m=>m.kind==='steel-column'||m.kind==='rc-column').filter(m=>{
   const a=g.nodes[m.a],b=g.nodes[m.b];return Math.min(a[2],b[2])>=g.levels[7]&&Math.max(a[2],b[2])===highZ;
 });
 assert.ok(high.length>=8,'eight-storey vertical columns must actually continue to eighth floor');
 assert.ok(Math.min(...g.nodes.map(p=>p[0]))<0,'balconies visible beyond the west facade');
});
test('homepage labels truthfully describe an eight-storey unverified FEM input and show matching source screenshot',()=>{
 for(const path of ['index.html','it/index.html']){
  const s=read(path);
  assert.match(s,/8\s*(?:storeys|stories|floors|piani)/i,path);
  assert.match(s,/S355\s*\/\s*C30\/37\s*\/\s*GL24h/);
  assert.match(s,/capriat|truss/i);
  assert.match(s,/non\s*verificat|unverified|no numerical checks|no.*analysis/i);
  assert.match(s,/complex-frame-poster\.webp/);
 }
 const stage=read('model-stage.js');
 assert.match(stage,/complex-demo-geometry\.mjs/);
 assert.doesNotMatch(stage,/12\.65/,'renderer must derive height from actual changing model');
});
