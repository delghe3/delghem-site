import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('Distinctive engineering visual language loads after all original styles in both locales',()=>{
 for(const file of ['index.html','it/index.html']){
  const html=read(file);
  const css=html.indexOf('delghem-art-direction.css?v=20261026-studio01');
  assert.ok(css>0);
  assert.ok(css>html.indexOf('seismic-isolators.css?v='));
  assert.ok(html.includes('delghem-art-direction.js?v=20261026-studio01'));
  assert.ok(html.includes('id="engineering-scene-nav"'));
  assert.ok(html.indexOf('id="engineering-scene-nav"')<html.indexOf('id="steel-frame-scene"'));
  for(const id of ['steel-frame-scene','seismic-isolation','soil-stress-scene'])
   assert.match(html,new RegExp('href="#'+id+'"'));
  assert.equal((html.match(/id="engineering-scene-nav"/g)||[]).length,1);
  assert.match(html,/data-scene-link/);
  assert.match(html,/id="engineering-scene-progress"/);
  for(const id of ['steel-bare-canvas','steel-damper-canvas','isolation-fixed-canvas','isolation-isolated-canvas','soil-stress-canvas','lab-stress-canvas'])
   assert.ok(html.includes('id="'+id+'"'),'retain engineering demo '+id);
 }
});

test('Navigation tracks active engineering scenes with observer, accessible link status, safe reduced motion',()=>{
 const script=read('delghem-art-direction.js');
 assert.match(script,/IntersectionObserver/);
 assert.match(script,/requestAnimationFrame/);
 assert.match(script,/prefers-reduced-motion/);
 assert.match(script,/aria-current/);
 assert.match(script,/scrollIntoView/);
 assert.match(script,/visibilitychange/);
 assert.doesNotMatch(script,/setInterval|setTimeout/);
});

test('Art-directed layout has responsive vivid FEM styling, reduced motion fallback, keyboard focus and progressive enhancement',()=>{
 const css=read('delghem-art-direction.css');
 for(const key of ['.engineering-scene-nav','.hero','.structure-stage','.eng-isolation-card','.eng-device-card--spotlight','.eng-pile-card','.seismic-demand-strip','.editorial-hub','.fem-lab-section','.site-header'])
  assert.ok(css.includes(key),'missing '+key);
 assert.match(css,/@media\s*\(max-width:\s*650px\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/linear-gradient|radial-gradient/);
 assert.match(css,/repeating-linear-gradient/);
});

test('Editorial overview stays four purposeful topic links and avoids repeated substantive disclaimer text',()=>{
 for(const file of ['index.html','it/index.html']){
  const html=read(file);
  const start=html.indexOf('<section class="editorial-hub"');
  const end=html.indexOf('<section class="contact-strip"',start);
  const overview=html.slice(start,end);
  assert.equal((overview.match(/class="engineering-track-item/g)||[]).length,4);
  assert.ok(overview.length<5000,'overview should not repeat long technical sections');
  assert.match(overview,/pile-stratigraphy-(en|it)\.webp/);
  assert.match(overview,/steel-viscous-frame-(en|it)\.webp/);
  assert.ok(html.includes('eng-stress-qualification'));
  assert.ok(html.includes('isolation-method-note'));
  assert.ok(html.includes('eng-proof-limit'));
 }
});
