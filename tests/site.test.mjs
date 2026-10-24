import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Every referenced ES module is present',()=>{
 for(const file of ['app.js','locales.js','model-stage.js','social.js'])
  assert.ok(fs.statSync(path.join(root,file)).isFile(),file);
});
test('Both languages have semantic technical feature catalogue and alpha launch notice',()=>{
 for(const name of ['index.html','it/index.html']){
  const html=read(name);
  assert.match(html,/id="capabilities"/);
  assert.ok((html.match(/class="capability-card"/g)||[]).length>=12);
  assert.match(html,/vAlpha1/);
  assert.match(html,/2027/);
  assert.match(html,/id="support"/);
  assert.match(html,/id="sharing"/);
 }
});
test('Photo gallery is explicitly based on actual app screenshots',()=>{
 const html=read('index.html');
 assert.ok((html.match(/data-shot="/g)||[]).length>=12);
 assert.match(html,/data-gallery-filter="all"/);
});
test('SEO and open graph reference existing assets',()=>{
 for(const name of ['index.html','it/index.html']){
  const html=read(name);
  assert.match(html,/rel="canonical"/);
  assert.match(html,/hreflang="it"/);
  assert.match(html,/hreflang="en"/);
  assert.match(html,/SoftwareApplication/);
  assert.match(html,/og:image/);
 }
 assert.ok(read('sitemap.xml').includes('/en/'));
 assert.ok(read('robots.txt').includes('Sitemap:'));
});
test('Built-in model exposes all three interactive modes',()=>{
 const html=read('index.html');
 for(const m of ['structure','deformed','forces'])assert.ok(html.includes('data-model-view="'+m+'"'));
 assert.match(read('model-stage.js'),/initModelStage/);
});
test('Social links are explicitly share and copy, never unsolicited posting',()=>{
 const code=read('social.js');
 for(const key of ['linkedin','facebook','whatsapp','twitter','navigator.share','navigator.clipboard'])assert.ok(code.includes(key),key);
});
test('Payment section never claims verified PayPal.Me destination',()=>{
 const html=read('index.html');
 assert.ok(html.includes('ildelghe3@gmail.com'));
 assert.ok(!html.includes('paypal.me/'));
});
test('Sixteen canonical destinations now cover engineering B2B and technical articles',()=>{
 const xml=read('sitemap.xml');
 assert.equal((xml.match(/<loc>/g)||[]).length,16);
 for(const [file,url] of [
  ['tecnologia-fem-mac/index.html','https://www.delghe.com/tecnologia-fem-mac/'],
  ['en/mac-fem-technology/index.html','https://www.delghe.com/en/mac-fem-technology/'],
  ['disegni-officina-acciaio/index.html','https://www.delghe.com/disegni-officina-acciaio/'],
  ['en/steel-workshop-drawings/index.html','https://www.delghe.com/en/steel-workshop-drawings/'],
  ['software-fem-mac/index.html','https://www.delghe.com/software-fem-mac/'],
  ['en/native-structural-analysis-mac/index.html','https://www.delghe.com/en/native-structural-analysis-mac/'],
  ['media-kit/index.html','https://www.delghe.com/media-kit/'],
  ['en/media-kit/index.html','https://www.delghe.com/en/media-kit/']]){
  assert.ok(read(file).includes('rel="canonical" href="'+url+'"'));
  assert.ok(xml.includes('<loc>'+url+'</loc>'));
  assert.match(read(file),/<h1>/);
 }
});
test('All 16 actual screenshot sources have full and thumbnail WebP assets',()=>{
 const entries=['model','steel-frame','steel-results','modal','static','mesh','slab','rc-analysis','rc-design','pile-cap','winkler','steel-design','report','genius','workshop','drawing'];
 for(const name of entries){
  for(const suffix of ['','-thumb']){
   const file=path.join(root,'assets/screenshots',name+suffix+'.webp');
   const bytes=fs.readFileSync(file);
   assert.ok(bytes.length>200,file);
   assert.equal(bytes.toString('ascii',0,4),'RIFF',file);
   assert.equal(bytes.toString('ascii',8,12),'WEBP',file);
  }
 }
});
test('No injected challenge script or dummy charitable payment claim remains',()=>{
 for(const name of ['index.html','it/index.html']){
  assert.doesNotMatch(read(name),/__CF\$cv/);
  assert.doesNotMatch(read(name),/paypal\.me\//i);
  assert.match(read(name),/https:\/\/www\.paypal\.com\/myaccount\/transfer\/(send|homepage)/);
 }
});
