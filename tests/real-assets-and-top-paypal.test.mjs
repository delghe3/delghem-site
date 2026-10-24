import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const name of ['index.html','it/index.html']){
 test(name+': Paypal and original appeal appear at top, before hero',()=>{
  const page=read(name);
  const top=page.indexOf('<section class="support-banner"');
  assert.ok(top>0);
  assert.ok(top<page.indexOf('<section class="hero'));
  const fragment=page.slice(top,page.indexOf('</section>',top));
  assert.match(fragment,/class="paypal-personal-appeal"/);
  assert.match(fragment,/class="paypal-send-link"/);
  assert.match(fragment,/ildelghe3@gmail\.com/);
  assert.ok(fragment.indexOf('class="paypal-personal-appeal"')<fragment.indexOf('class="paypal-send-link"'));
  const bottom=page.slice(page.indexOf('<section class="support-section'),page.indexOf('</section>',page.indexOf('<section class="support-section')));
  assert.doesNotMatch(bottom,/class="paypal-send-link"/);
  assert.doesNotMatch(bottom,/class="paypal-personal-appeal"/);
 });
}
test('real DÈLGHEM program captures replace poor carpentry thumbnails and full images',()=>{
 for(const item of ['steel-frame','drawing','workshop']){
  for(const suffix of ['', '-thumb']){
   const file='assets/screenshots/'+item+suffix+'.webp';
   assert.ok(fs.statSync(path.join(root,file)).size>1200,file);
  }
 }
 assert.ok(fs.existsSync(path.join(root,'assets/screenshots/CAPTURE_PROVENANCE.md')));
});
test('no UNIBO frontiers labels in site content',()=>{
 for(const relative of ['index.html','en/index.html','disegni-officina-acciaio/index.html','en/steel-workshop-drawings/index.html','media-kit/index.html','en/media-kit/index.html','style.css','app.js','social.js']){
  assert.doesNotMatch(read(relative),/unibo\s*frontiers|frontiers\s*unibo|unibo|frontiers/i,relative);
 }
});
for(const name of ['index.html','it/index.html']){
 test(name+': visitor count is at the top next to PayPal and not in footer',()=>{
   const html=read(name);
   const start=html.indexOf('<section class="support-banner"');
   const end=html.indexOf('</section>',start);
   const footer=html.indexOf('<footer class="site-footer"');
   assert.ok(start>=0&&end>start&&footer>end);
   assert.equal((html.match(/id="visitor-counter-total"/g)||[]).length,1,'single counter');
   assert.match(html.slice(start,end),/id="visitor-counter-total"/);
   assert.doesNotMatch(html.slice(footer),/id="visitor-counter-total"/);
   assert.match(read('visitor-counter.js'),/delghe_com_pageviews_20261023/);
 });
}
