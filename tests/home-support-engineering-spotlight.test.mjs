import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

for(const [file,language] of [['index.html','en'],['it/index.html','it']]){
 test(language+': one genuine PayPal donation and the only visitor counter appear at the BEGINNING of the page, before the 3D hero',()=>{
   const html=read(file);
   const main=html.indexOf('<main id="main">');
   const support=html.indexOf('<section class="support-banner support-banner-top"');
   const hero=html.indexOf('<section class="hero chapter"');
   assert.ok(main>=0&&support>main&&hero>support,
     'top visit/donate section is before hero and inside main');
   assert.ok(support-main<160,
     'support strip is the first meaningful section within main');
   assert.ok(hero-support<4800,
     'support should remain compact, not a long standalone fundraising page');
   assert.equal((html.match(/id="support-top"/g)||[]).length,1);
   assert.equal((html.match(/id="visitor-counter-total"/g)||[]).length,1);
   assert.equal((html.match(/class="paypal-send-link"/g)||[]).length,1);
   const region=html.slice(support,hero);
   assert.match(region,/class="visitor-counter/);
   assert.match(region,/id="visitor-counter-total"/);
   assert.match(region,/paypal-personal-appeal/);
   assert.match(region,/paypal-send-link/);
   assert.match(region,/id="paypal-copy-status"/);
   assert.match(region,/data-email="ildelghe3@gmail\.com"/);
   assert.match(region,/www\.paypal\.com\/myaccount\/transfer\/send/);
   assert.match(region,language==='it'?/VISITATORI/:/VISITORS/);
   assert.doesNotMatch(region,language==='it'?/>VISITORS</:/>VISITATORI</);
   assert.match(region,/id="visitor-counter-total">122[.,]300/);
   assert.doesNotMatch(html.slice(hero),/<section class="support-banner(?: |")/,
     'the old footer donation must be moved, not duplicated');
 });
 test(language+': native D2 piles and viscous frame lead the hero, while Genius now leads the editorial hub',()=>{
   const html=read(file);
   const hero=html.slice(html.indexOf('<section class="hero chapter"'),
     html.indexOf('<section class="editorial-hub"'));
   const intro=html.slice(html.indexOf('<section class="editorial-hub"'),
     html.indexOf('<section class="contact-strip"'));
   assert.match(hero,/class="hero-engineering-link"/);
   assert.match(hero,/href="#engineering-benchmarks"/);
   assert.match(intro,/engineering-track-item--featured/);
   assert.match(intro,/href="#genius"/);
   assert.match(intro,/assets\/genius\/genius-workflow-(it|en)\.webp/);
   assert.match(intro,/assets\/genius\/genius-steel\.webp/);
   assert.match(intro,/Genius|assistant|modello|model/i);
   assert.match(html,/id="soil-stress-scene"/);
   assert.match(html,/id="steel-frame-scene"/);
   assert.equal((intro.match(/class="engineering-track-item/g)||[]).length,4,
     'replace a redundant overview card, do not lengthen navigation');
 });
}
test('top-page donor/support/counter is visually compact and correctly responsive',()=>{
 const css=read('style.css');
 assert.match(css,/\.support-banner-top/);
 assert.match(css,/\.support-banner-top \.support-banner-inner/);
 assert.match(css,/\.support-banner-top \.visitor-counter/);
 assert.match(css,/\.engineering-track-item--featured/);
 assert.match(css,/\.hero-engineering-link/);
 assert.match(css,/@media\s*\(max-width:\s*650px\)/);
});
test('counter still uses its reported-baseline + additional page views, not a fabricated count of unique visitors',()=>{
 const js=read('visitor-counter.js');
 assert.match(js,/INITIAL_REPORTED_VISITS\s*=\s*122300/);
 assert.match(js,/RECORDED_AT_BASELINE\s*=\s*2671/);
 assert.match(js,/countapi\.mileshilliard\.com/);
 assert.match(js,/not a verified count of unique people/);
 const support=read('support-actions.js');
 assert.match(support,/navigator\.clipboard/);
 assert.match(support,/ildelghe3@gmail\.com/);
});
