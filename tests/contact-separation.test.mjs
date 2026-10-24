import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(resolve(root,name),'utf8');
const homes=['index.html','it/index.html'];
const publicPages=[
  'index.html','it/index.html',
  'media-kit/index.html','en/media-kit/index.html',
  'software-fem-mac/index.html','en/native-structural-analysis-mac/index.html',
  'en/mac-fem-technology/index.html','tecnologia-fem-mac/index.html',
  'en/steel-workshop-drawings/index.html','disegni-officina-acciaio/index.html'
];

test('new public contact email is prominent at the top of both homepages and in footer',()=>{
 for(const page of homes){
  const html=read(page);
  const top=html.indexOf('class="contact-strip"');
  const hero=html.indexOf('class="hero chapter"');
  const footer=html.indexOf('<footer class="site-footer"');
  assert.ok(top>0&&top<hero,page+' contact email must appear before hero');
  assert.ok(html.slice(top,hero).includes('mailto:delghem@proton.me'),page+' missing public mail in top');
  assert.ok(html.slice(top,hero).includes('delghem@proton.me'),page+' missing visible public mail at top');
  assert.ok(html.slice(footer).includes('mailto:delghem@proton.me'),page+' public mail in footer');
  assert.ok(html.slice(footer).includes('delghem@proton.me'),page+' visible public mail in footer');
  assert.match(html,/class="contact-strip-link contact-email"/);
 }
});

test('commercial, informational and media enquiries use Proton, never PayPal email',()=>{
 for(const file of publicPages){
  const html=read(file);
  for(const match of html.matchAll(/mailto:([^"?#]+)/g)){
    assert.equal(match[1],'delghem@proton.me',file+' inconsistent mailto');
  }
 }
 const app=read('app.js');
 assert.match(app,/mailto:delghem@proton\.me/);
 assert.doesNotMatch(app,/mailto:ildelghe3@gmail\.com/);
 for(const p of ['media-kit/index.html','en/media-kit/index.html']){
  assert.match(read(p),/mailto:delghem@proton\.me/);
 }
});

test('donation account is untouched on English and Italian pages and its JS actions',()=>{
 for(const file of homes){
  const html=read(file);
  assert.match(html,/class="paypal-send-link"/);
  assert.match(html,/data-email="ildelghe3@gmail\.com"/);
  assert.match(html,/PAYPAL RECIPIENT|DESTINATARIO PAYPAL/);
  assert.match(html,/https:\/\/www\.paypal\.com\/myaccount\/transfer\/send/);
 }
 assert.match(read('support-actions.js'),/ildelghe3@gmail\.com/);
 assert.match(read('social.js'),/ildelghe3@gmail\.com/);
});

test('all new top contact blocks have mobile responsive design and visible calls to action',()=>{
 const css=read('style.css');
 assert.match(css,/\.contact-strip\{/);
 assert.match(css,/\.contact-strip-link\{/);
 assert.match(css,/@media\s*\(max-width:650px\)/);
 for(const file of homes){
  const html=read(file);
  assert.match(html,/Contact DÈLGHEM|Contatta DÈLGHEM/);
  assert.match(html,/Business & technical enquiries|Contatti e collaborazioni/i);
 }
});
