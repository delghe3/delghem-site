import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8'),sha=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
test('Bilingual home SEO leads with DELGHE DÈLGHEM Genius and native Apple Silicon, grounded in evidence, not certification claims',()=>{
 for(const [page,lang] of [['index.html','en'],['it/index.html','it']]){
  const html=read(page);
  assert.match(html,/<title>DELGHE[^<]+DÈLGHEM/);
  assert.match(html,/<meta name="description" content="DELGHE[^"]*Genius[^"]*Kratos[^"]*Apple Silicon[^"]*"/);
  assert.match(html,/<meta property="og:description" content="DELGHE[^"]*Genius[^"]*Kratos[^"]*"/);
  assert.match(html,/<meta name="twitter:description" content="DELGHE[^"]*Genius[^"]*Kratos[^"]*"/);
  const script=html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(script,page+' JSON-LD');
  const obj=JSON.parse(script[1]);assert.ok(obj['@graph'].some(x=>x['@type']==='SoftwareApplication'));
  assert.match(obj['@graph'].find(x=>x['@type']==='SoftwareApplication').description,/Genius.*Kratos/);
  assert.match(html,/surface-studio\.js\?v=20261025-smooth19/);
  assert.match(html,/engineering-benchmarks\.js\?v=20261025-showcase15seo/);
  assert.match(html,/genius-demo\.js\?v=20261025-showcase15seo/);
  assert.match(html,/style\.css\?v=20261025-showcase15seo/);
  assert.match(html,/fem-lab\.js\?v=20261025-smooth19/);
  assert.match(html,/app\.js\?v=20261025-showcase15seo/);
 }
 assert.match(read('app.js'),/model-stage\.js\?v=20261025-showcase15seo/);
 assert.match(read('app.js'),/locales\.js\?v=20261025-showcase15seo/);
 assert.match(read('model-stage.js'),/showcase-geometry\.mjs\?v=20261025-showcase15seo/);
});
test('New grounded FEM and foundation images have fallback assets and are discoverable through XML sitemap',()=>{
 const names=[
 'assets/fem-lab/gallery/surface-skewed-double-opening-slab.webp',
 'assets/fem-lab/gallery/surface-double-window-shear-wall.webp',
 'assets/fem-lab/gallery/surface-l-shaped-transfer-plate.webp',
 'assets/engineering/pile-curves.webp',
 'assets/engineering/damper-velocity.webp',
 'assets/engineering/damper-cycle.webp'
 ];
 const map=read('sitemap.xml');
 for(const name of names){
  assert.ok(statSync(resolve(root,name)).size>4500,name);
  assert.ok(map.includes('https://www.delghe.com/'+name),name+' missing sitemap');
 }
 assert.match(map,/<lastmod>2026-10-25<\/lastmod>/);
});
test('Technical source provenance transparently distinguishes Kratos FEM solve, D2 t-z pile solve and analytical viscous law',()=>{
 const x=read('assets/fem-lab/PROVENANCE.txt');
 const y=read('assets/engineering/PROVENANCE.txt');
 assert.match(x,/KRATOSMULTIPHYSICS/i);
 for(const id of ['skewed-double-opening-slab','double-window-shear-wall','l-shaped-transfer-plate']){
  assert.match(x,new RegExp(id));
 }
 assert.match(x,/not.*certified|non.*certificat/i);
 assert.match(y,/pile.*axial|t.z.q.z/i);
 assert.match(y,/constitutive.*NOT.*FEM|analytical.*NOT.*FEM/i);
 assert.match(y,/SHA256/);
 const script=read('scripts/build-social-cards.sh');
 assert.match(script,/BASH_SOURCE/);
 assert.match(script,/genius-workflow/);
 assert.match(script,/surface-skewed-double-opening-slab/);
});
