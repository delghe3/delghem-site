import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=name=>readFileSync(resolve(root,name),'utf8');
const homes=['index.html','it/index.html'];

test('model originates in actual DÈLGHEM D2 geometry, with nonexecutive mixed-RC derivation',async ()=>{
 const {mixedDemo}=await import('../assets/real-d2/mixed-demo-geometry.mjs');
 assert.equal(mixedDemo.nodes.length,60);
 assert.equal(mixedDemo.members.length,124);
 assert.equal(mixedDemo.shells.length,30);
 assert.equal(mixedDemo.members.filter(m=>m.kind==='brace').length,8);
 assert.deepEqual(mixedDemo.gridX,[0,6,12,18]);
 assert.deepEqual(mixedDemo.gridY,[0,5,10]);
 assert.deepEqual(mixedDemo.levels,[0,3.6,7.2,10.8,14.4]);
 assert.equal(new Set(mixedDemo.members.map(m=>m.id)).size,124);
 for(const m of mixedDemo.members)assert.ok(mixedDemo.nodes[m.a]&&mixedDemo.nodes[m.b],m.id);
 assert.match(mixedDemo.source.baseSha256,/^[a-f0-9]{64}$/);
 assert.match(mixedDemo.source.derivedModelSha256,/^[a-f0-9]{64}$/);
 assert.equal(mixedDemo.status,'conceptual_mixed_demonstration_unverified');
});
test('3D viewer uses real RC shell and member dimensions and retains keyboard orbit',()=>{
 const js=file('model-stage.js');
 assert.match(js,/complex-demo-geometry\.mjs/);
 assert.match(js,/const \{b,h,tw,tf\}=section/);
 assert.match(js,/crossSection/);
 assert.match(js,/paintFaces/);
 assert.match(js,/mixedDemo.shells/);
 assert.match(js,/mixedDemo.members/);
 assert.doesNotMatch(js,/X=\[-2\.5,-\.85/);
 assert.match(js,/setMotion/);
 assert.match(js,/mode!=='deformed'/);
 assert.match(js,/mode==='forces'/);
});
test('both homepages show loading poster and accurately qualified mixed-model labels',()=>{
 for(const name of homes){
  const h=file(name);
  assert.match(h,/class="model-poster"/);
  assert.match(h,/assets\/real-d2\/complex-frame-poster\.webp/);
  assert.match(h,/212.*514|514.*212/);
  assert.match(h,/8\s*(?:STOREYS|PIANI)/i);
  assert.match(h,/id="structure-canvas"/);
  assert.match(h,/model-disclaimer/);
 }
 const css=file('style.css');
 assert.match(css,/\.model-poster/);
 assert.match(css,/\.model-ready/);
});
test('contact banner on Chrome offers send and copy actions with clear labels in both languages',()=>{
 for(const name of homes){
  const h=file(name),part=h.slice(h.indexOf('<section class="contact-strip"'),h.indexOf('<section class="hero chapter"'));
  assert.match(part,/mailto:delghem@proton\.me/);
  assert.match(part,/class="contact-copy-button"/);
  assert.match(part,/id="contact-copy-status"/);
  assert.match(part,/aria-live="polite"/);
  assert.match(part,/class="contact-strip-link contact-email"/);
  assert.match(part,/Business & technical enquiries|Contatti e collaborazioni/i);
 }
 const js=file('contact-actions.js');
 assert.match(js,/navigator\.clipboard/);
 assert.match(js,/delghem@proton\.me/);
 assert.match(js,/contact-copy-status/);
 assert.match(file('style.css'),/\.contact-strip-inner/);
 assert.match(file('style.css'),/@media\s*\(max-width:650px\)/);
});

test('donation address, visitor counter, native disclaimers and Europe language SEO unchanged',()=>{
 for(const name of homes){
  const s=file(name);
  assert.match(s,/data-email="ildelghe3@gmail\.com"/);
  assert.equal((s.match(/id="visitor-counter-total"/g)||[]).length,1);
  assert.match(s,/hreflang="x-default"/);
  assert.match(s,/href="\/it\/"/);
 }
 assert.equal(file('CNAME').trim(),'www.delghe.com');
});
