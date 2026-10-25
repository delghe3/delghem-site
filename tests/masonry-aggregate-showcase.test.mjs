import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(resolve(root,name),'utf8');
const digest=name=>createHash('sha256').update(readFileSync(resolve(root,name))).digest('hex');
const unchanged={
 'assets/real-d2/complex-demonstration.hfm.json':'baaab78550ed055a3dedfea96a301305896481dc3e279164fc11ca026ccab31f',
 'assets/real-d2/showcase-timber-terminal.hfm.json':'2f36ef63a9126e8e0e5cae51f8c3065ba98d9f1ac3fc1437d4344f6544e7d8bb'
};
test('The original eight-storey tower and timber terminal remain physically unchanged when bridge, stadium and masonry are improved',async()=>{
 for(const [file,hash] of Object.entries(unchanged))assert.equal(digest(file),hash,file);
 const {showcaseModels}=await import('../assets/real-d2/showcase-geometry.mjs');
 assert.deepEqual(showcaseModels.map(m=>m.id),[
  'football-canopy','steel-arch-bridge','timber-terminal','masonry-aggregate'
 ]);
});
test('Fifth concept is a large irregular historic masonry aggregate with multiple buildings and true timber pitched roofs',async()=>{
 const {showcaseModels}=await import('../assets/real-d2/showcase-geometry.mjs');
 const m=showcaseModels.at(-1);
 assert.equal(m.id,'masonry-aggregate');
 assert.ok(m.bbox.max[0]-m.bbox.min[0]>=88,'large connected settlement footprint');
 assert.ok(m.bbox.max[1]-m.bbox.min[1]>=57,'large settlement depth');
 assert.ok(m.bbox.max[2]>=23,'multiple stepped roof heights and bell tower');
 assert.ok(m.buildings.length>=5,'several distinct masonry wings and tower');
 assert.ok(new Set(m.buildings.map(b=>b.storeys)).size>=3,'height variation in the aggregate');
 assert.ok(m.openings.length>=18,'real facade window / door openings');
 assert.ok(m.roofSystems.length>=5,'real separate pitched timber roofs');
 assert.ok(m.shells.filter(s=>s.kind==='masonry-wall'||s.kind==='stone-wall').length>=80,'native wall shell system');
 assert.ok(m.shells.filter(s=>s.kind==='timber-roof').length>=35,'physical pitched roof shells');
 assert.ok(m.members.filter(s=>s.kind==='timber-rafter'||s.kind==='timber-purlin'||s.kind==='timber-ridge').length>=70);
 assert.ok(m.nodes.length<=512&&m.shells.length<=512,'inside actual D2 source validator caps');
 assert.deepEqual(m.qualifications,{solved:false,designed:false,executive:false});
});
test('Masonry model has no RC or steel load bearing elements; roof and storey beams are timber only',async()=>{
 const {showcaseModels}=await import('../assets/real-d2/showcase-geometry.mjs');
 const m=showcaseModels.at(-1);
 const originalName='assets/real-d2/showcase-masonry-aggregate.hfm.json';
 assert.equal(m.source.modelFile,'showcase-masonry-aggregate.hfm.json');
 assert.equal(m.source.derivedModelSha256,digest(originalName));
 const native=JSON.parse(read(originalName));
 assert.equal(native.schema,'hyperfem-1');
 assert.deepEqual(new Set(native.materials.map(v=>v.id)),new Set(['M_BRICK','M_STONE','M_WOOD']));
 assert.ok(native.members.every(b=>b.material==='M_WOOD'));
 assert.ok(native.shells.every(s=>['M_BRICK','M_STONE','M_WOOD'].includes(s.material)));
 assert.ok(native.shells.some(s=>s.material==='M_STONE'));
 assert.ok(native.shells.some(s=>s.material==='M_BRICK'));
 assert.ok(native.shells.filter(s=>s.material==='M_WOOD').every(s=>s.laminate));
 assert.ok(native.laminates.length>=1);
 assert.ok(native.nodes.some(n=>n.fixed.every(v=>v===true)),'foundation edge fixed only as a concept');
 assert.equal(native.foundationSystem?.items?.length??0,0,'no fake RC pad foundations for a masonry building');
 assert.equal(m.footings.length,0);
 assert.ok(m.materials.includes('MURATURA')&&m.materials.includes('GL24h'));
 assert.ok(!m.materials.includes('S355')&&!m.materials.includes('C30/37'));
});
test('Actual wall shell holes correspond to metadata window openings rather than painted-on faux apertures',async()=>{
 const {showcaseModels}=await import('../assets/real-d2/showcase-geometry.mjs');
 const model=showcaseModels.at(-1);
 const walls=model.shells.filter(s=>s.kind==='masonry-wall'||s.kind==='stone-wall');
 let examined=0;
 for(const opening of model.openings.filter(o=>o.type==='window').slice(0,20)){
  // A shell facade panel cannot contain the center of an actual omitted window.
  const pt=opening.center;
  const blocked=walls.some(s=>{
   const q=s.nodes.map(i=>model.nodes[i]);
   const d=opening.axis;
   const normalAxis=d==='x'?1:0;
   if(!q.every(v=>Math.abs(v[normalAxis]-pt[normalAxis])<1e-4))return false;
   const aa=q.map(v=>v[d==='x'?0:1]),zz=q.map(v=>v[2]);
   return pt[d==='x'?0:1]>Math.min(...aa)+1e-4&&pt[d==='x'?0:1]<Math.max(...aa)-1e-4
    &&pt[2]>Math.min(...zz)+1e-4&&pt[2]<Math.max(...zz)-1e-4;
  });
  assert.ok(!blocked,'masonry window should be a real structural geometric hole '+JSON.stringify(opening));
  examined++;
 }
 assert.ok(examined>=10);
});
test('Five-item carousel has Italian/English fifth tile with 5-second progress and correctly loaded native file',()=>{
 for(const file of ['index.html','it/index.html']){
  const h=read(file);
  assert.match(h,/id="model-showcase"/);
  assert.match(h,/data-showcase-index="4"/);
  assert.match(h,/id="model-showcase-counter"[^>]*>01 \/ 05</);
  assert.match(h,/muratura|masonry/i);
 }
 const js=read('model-stage.js');
 assert.match(js,/MODEL_SHOWCASE_DURATION_MS\s*=\s*5000/);
 assert.match(js,/showcase-geometry\.mjs/);
 assert.match(js,/showcaseModels/);
 assert.match(js,/masonry-wall/);
 assert.match(read('style.css'),/mat-masonry/);
 assert.match(read('README.md'),/aggregato.*muratura/i);
 assert.ok(existsSync(resolve(root,'assets/real-d2/showcase-previews/masonry-aggregate.webp')));
 assert.ok(statSync(resolve(root,'assets/real-d2/showcase-previews/masonry-aggregate.webp')).size>30000);
});
test('Both media kits and sitemap expose the fifth authentic D2 masonry snapshot without calling it calculated',()=>{
 for(const html of ['media-kit/index.html','en/media-kit/index.html']){
  const source=read(html);
  assert.ok(source.includes('assets/real-d2/showcase-previews/masonry-aggregate.webp'));
  assert.equal((source.match(/class="media-showcase-card"/g)||[]).length,5);
  assert.match(source,/non.*verificat|unverified|not.*structural/i);
 }
 const sitemap=read('sitemap.xml');
 assert.ok(sitemap.includes('https://www.delghe.com/assets/real-d2/showcase-previews/masonry-aggregate.webp'));
});
