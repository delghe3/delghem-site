import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=x=>readFileSync(resolve(root,x),'utf8');
const graphIds=[
 'lab-pushover-svg','lab-pushover-y-svg','lab-plastic-svg',
 'lab-ida-svg','lab-ida-y-svg','lab-hysteresis-svg','lab-hysteresis-y-svg',
 'lab-accelerograms-svg','lab-accelerograms-y-svg','lab-response-svg','lab-response-y-svg'
];
test('Both published homepages version their coupled CSS and FEM JavaScript to avoid blank/black canvas from a stale JS bundle',()=>{
 const versions=[];
 for(const name of ['index.html','it/index.html']){
  const html=file(name),css=html.match(/href="(?:\.\.\/|\.\/)style\.css\?v=([^"]+)"/);
  const js=html.match(/src="(?:\.\.\/|\.\/)fem-lab\.js\?v=([^"]+)"/);
  assert.ok(css,name+': HTML must request fresh versioned stylesheet');
  assert.ok(js,name+': HTML must request fresh versioned FEM renderer');
  assert.equal(css[1],js[1],name+': CSS and JavaScript must have matching release identifier');
  assert.match(css[1],/^[\w.-]{8,80}$/);
  versions.push(css[1]);
 }
 assert.equal(versions[0],versions[1]);
});
test('Unrendered FEM model has an immediately visible real solver poster instead of a black/transparent canvas',()=>{
 for(const page of ['index.html','it/index.html']){
  const html=file(page);
  assert.match(html,/<img[^>]+id="lab-stress-poster"[^>]+src="[^"]*stress-actual-solver\.webp"/);
  assert.match(html,/id="lab-stress-canvas"/);
 }
 assert.ok(statSync(resolve(root,'assets/fem-lab/gallery/stress-actual-solver.webp')).size>25000);
 const js=file('fem-lab.js');
 assert.match(js,/data-lab-stress-ready|labRoot\.dataset\.labStressReady/);
 assert.match(js,/getImageData/);
 const css=file('style.css');
 assert.match(css,/data-lab-stress-ready/);
});
test('All 11 computed charts have visible solver-derived image fallbacks when JavaScript cannot initialize',()=>{
 for(const page of ['index.html','it/index.html']){
  const html=file(page),section=html.slice(html.indexOf('<section class="fem-lab-section'),html.indexOf('<section class="technical-library'));
  for(const id of graphIds){
   const pattern=new RegExp('<svg id="'+id+'"[^>]*><\\/svg>\\s*<img[^>]*class="lab-static-fallback"[^>]+src="[^"]*\\/gallery\\/[^"]+\\.webp"');
   assert.match(section,pattern,page+': '+id+' needs immediate credible fallback');
  }
 }
 const js=file('fem-lab.js'),css=file('style.css');
 assert.match(js,/labRoot\.dataset\.labChartsReady/);
 assert.match(css,/data-lab-charts-ready/);
});
