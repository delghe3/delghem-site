import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>readFileSync(resolve(root,p),'utf8');
const data=()=>JSON.parse(file('assets/fem-lab/actual-analysis-results.json'));
test('Lab data comes from D2 solver result records with explicit source hashes and truthful limitations',()=>{
 const d=data();assert.equal(d.schema,'delghem-fem-lab-data-1');
 assert.equal(d.stress.engine,'OpenSeesPy');
 assert.equal(d.stress.elements.length,128);
 assert.ok(d.stress.elements.every(e=>e.gauss.length===4&&e.vertices.length===4));
 for(const e of d.stress.elements)for(const g of e.gauss)for(const face of ['top','bottom']){
  for(const k of ['sigma11MPa','sigma22MPa','tau12MPa','vonMisesMPa'])assert.ok(Number.isFinite(g[face][k]),e.id);
 }
 assert.equal(d.pushover.material,'elastic');
 assert.equal(d.pushover.nonLinearCapacityVerified,false);
 assert.ok(d.pushover.points.length>=8);
 assert.ok(d.pushover.points.every(p=>Number.isFinite(p.displacementMM)&&Number.isFinite(p.baseShearKN)));
 assert.equal(d.ida.records.length,2);
 assert.ok(d.ida.records.every(r=>r.runs.length===2&&r.accelerogramG.length>30&&r.dt>0));
 assert.equal(d.ida.collapseObserved,false);assert.equal(d.ida.fragilityAvailable,false);
 for(const x of [d.stress,d.pushover,d.ida])assert.match(x.sourceSha256,/^[a-f0-9]{64}$/);
 assert.ok(!file('assets/fem-lab/actual-analysis-results.json').includes('/Users/'));
});
test('Four source-backed analyses remain visible in both languages without click-to-reveal tabs',()=>{
 for(const p of ['index.html','it/index.html']){
  const html=file(p),start=html.indexOf('<section class="fem-lab-section'),end=html.indexOf('<section class="genius-section',start),section=html.slice(start,end);
  assert.ok(section.length>5000,p);
  assert.match(section,/class="lab-scroll-index"/);
  assert.doesNotMatch(section,/data-lab-tab/);
  assert.doesNotMatch(section,/role="tabpanel"/);
  for(const id of ['stress','pushover','ida','accelerograms']){
   assert.match(section,new RegExp('id="lab-panel-'+id+'"'));
   assert.doesNotMatch(section,new RegExp('id="lab-panel-'+id+'"[^>]*hidden'));
  }
  for(const id of ['lab-stress-canvas','lab-stress-field','lab-stress-face','lab-pushover-svg','lab-ida-svg','lab-accelerograms-svg','lab-response-svg'])assert.match(section,new RegExp('id="'+id+'"'));
  assert.match(section,/diagnostic|diagnostici|diagnostiche/i);
  assert.match(html,/fem-lab\.js/);
 }
 const js=file('fem-lab.js');
 assert.match(js,/requestAnimationFrame|addEventListener/);
 assert.match(js,/pointerdown/);
 assert.match(js,/native-nonlinear-ida\.json/);
 assert.match(js,/advanced-shell-results\.json/);
 assert.match(js,/maxPlasticStrain/);
 assert.match(file('style.css'),/\.fem-lab-section/);
});
test('Exporter ships with D2 reproducibility provenance, not arbitrary hand-authored chart rows',()=>{
 const script=file('scripts/extract-fem-lab-results.py');
 for(const term of ['core-cut-native-8.json','pushover-engine-report.json','ida-suite.json','sha256','faceStresses'])assert.ok(script.includes(term),term);
 const csv=file('assets/fem-lab/PROVENANCE.txt');
 assert.match(csv,/source/i);assert.match(csv,/SHA256/);assert.match(csv,/not.*certified|non.*certificat/i);
});
