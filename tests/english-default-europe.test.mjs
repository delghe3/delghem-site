import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=rel=>readFileSync(resolve(root,rel),'utf8');
const englishUrl='https://www.delghe.com/';
const italianUrl='https://www.delghe.com/it/';
test('public home is English and Italian has its own indexable /it/ home',()=>{
 const en=read('index.html'), it=read('it/index.html');
 assert.match(en,/<html lang="en">/);
 assert.match(it,/<html lang="it">/);
 assert.match(en,/rel="canonical" href="https:\/\/www.delghe.com\/"/);
 assert.match(it,/rel="canonical" href="https:\/\/www.delghe.com\/it\/"/);
});
test('two distinct large flag language controls on English and Italian',()=>{
 for(const file of ['index.html','it/index.html']){
  const s=read(file);
  assert.match(s,/<a[^>]+data-language="en"[^>]*>[^<]*<span class="lang-flag">🇬🇧<\/span><span[^>]*>English<\/span>/);
  assert.match(s,/<a[^>]+data-language="it"[^>]*>[^<]*<span class="lang-flag">🇮🇹<\/span><span[^>]*>Italiano<\/span>/);
  assert.match(s,/href="\/it\/"/);
  assert.match(s,/href="\/"/);
  assert.match(s,/hreflang="x-default" href="https:\/\/www.delghe.com\/"/);
 }
});
test('legacy /en/ does not compete for canonical indexing',()=>{
 const legacy=read('en/index.html');
 assert.match(legacy,/noindex,follow/);
 assert.match(legacy,/content="0; url=\/"/);
 assert.match(legacy,/rel="canonical" href="https:\/\/www.delghe.com\/"/);
});
test('whole-site SEO pairs reciprocate with English x-default and no Italian root duplicates',()=>{
 const xml=read('sitemap.xml');
 assert.equal((xml.match(/<loc>/g)||[]).length,10);
 assert.ok(xml.includes('<loc>'+englishUrl+'</loc>'));
 assert.ok(xml.includes('<loc>'+italianUrl+'</loc>'));
 assert.doesNotMatch(xml,/<loc>https:\/\/www.delghe.com\/en\/<\/loc>/);
 for(const f of ['index.html','it/index.html']){
  const s=read(f);
  assert.ok(s.includes('hreflang="en" href="'+englishUrl+'"'));
  assert.ok(s.includes('hreflang="it" href="'+italianUrl+'"'));
  assert.ok(s.includes('hreflang="x-default" href="'+englishUrl+'"'));
 }
});
test('top PayPal and visitor count survive both language routes',()=>{
 for(const f of ['index.html','it/index.html']){
  const s=read(f);
  const position=s.indexOf('class="support-banner"');
  const top=s.slice(position,s.indexOf('</section>',position));
  assert.match(top,/class="paypal-send-link"/);
  assert.match(top,/id="visitor-counter-total"/);
  assert.match(top,/ildelghe3@gmail\.com/);
  assert.equal((s.match(/id="visitor-counter-total"/g)||[]).length,1);
  assert.match(s,/assets\/screenshots\/drawing-thumb.webp/);
 }
});
test('European SEO navigation retains real content without fabricated localization',()=>{
 for(const f of ['index.html','it/index.html']){
  const s=read(f);
  assert.match(s,/name="robots" content="index,follow/);
  assert.match(s,/property="og:image"/);
  assert.match(s,/SoftwareApplication/);
  assert.doesNotMatch(s,/unibo|frontiers/i);
 }
 const css=read('style.css');
 assert.match(css,/\.language-control.*\.language-link/);
 assert.match(css,/@media\(max-width:600px\)/);
});
