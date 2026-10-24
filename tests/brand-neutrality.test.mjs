import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const vendorPattern=new RegExp('para'+'llels','i');
const pagePaths=[
  'index.html','it/index.html','en/index.html',
  'software-fem-mac/index.html','en/native-structural-analysis-mac/index.html',
  'tecnologia-fem-mac/index.html','en/mac-fem-technology/index.html',
  'disegni-officina-acciaio/index.html','en/steel-workshop-drawings/index.html',
  'media-kit/index.html','en/media-kit/index.html'
];

test('no competitor-brand mention remains in public pages, URLs or translated JS dictionaries',()=>{
  for(const path of [...pagePaths,'locales.js','social.js','app.js']){
    assert.doesNotMatch(read(path),vendorPattern,path);
  }
});

test('Italian/English native comparison names virtualization generically',()=>{
  const it=read('it/index.html'),en=read('index.html');
  assert.match(it,/Software di virtualizzazione/);
  assert.match(en,/Virtualization software/);
  assert.match(it,/sistema operativo guest|sistema operativo ospite/);
  assert.match(en,/guest operating system/);
  assert.match(it,/L.impatto sulle prestazioni dipende/);
  assert.match(en,/Performance depends/);
});

test('brand-specific outbound documentation link is removed, while neutral authoritative sources stay available',()=>{
  const it=read('it/index.html'),en=read('index.html');
  for(const h of [it,en]){
    assert.ok(!h.includes('kb.'+'para'+'llels'+'.com'));
    assert.match(h,/developer\.apple\.com\/documentation\/apple-silicon/);
    assert.match(h,/learn\.microsoft\.com\/en-us\/windows\/arm/);
  }
});

test('technical FAQ discusses virtual machines and native macOS without suggesting unbenchmarked speed-ups',()=>{
  const it=read('software-fem-mac/index.html'),en=read('en/native-structural-analysis-mac/index.html');
  assert.match(it,/È necessaria una macchina virtuale/);
  assert.match(en,/Do I need a virtual machine/);
  assert.match(it,/Non segue tuttavia che ogni calcolo sia automaticamente più veloce/);
  assert.match(en,/This does not mean that every analysis is automatically faster/);
});

test('the bilingual runtime translations and visible pages use the same neutral claim',()=>{
  const loc=read('locales.js');
  for(const page of ['index.html','it/index.html']){
    assert.match(read(page),/data-i18n="technicalBody"/);
    assert.match(read(page),/data-i18n="footerNote"/);
  }
  assert.match(loc,/software di virtualizzazione/);
  assert.match(loc,/virtualization software/i);
});

test('preserves English-first navigation, donation, and counter without modifying DNS',()=>{
  assert.match(read('index.html'),/<html lang="en">/);
  assert.match(read('it/index.html'),/<html lang="it">/);
  assert.equal(read('CNAME').trim(),'www.delghe.com');
  for(const page of ['index.html','it/index.html']){
    const html=read(page);
    assert.match(html,/class="paypal-send-link"/);
    assert.match(html,/id="visitor-counter-total"/);
    assert.match(html,/href="\/it\/"/);
  }
});
