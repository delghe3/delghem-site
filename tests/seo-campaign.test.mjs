import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const f=name=>readFileSync(resolve(root,name),'utf8');
const pairs=[
 ['analisi-pushover-ida-mac','en/nonlinear-pushover-ida-mac'],
 ['mappe-tensioni-fem-3d','en/3d-fem-stress-contours'],
 ['licenza-software-fem-apple-silicon','en/apple-silicon-fem-software-licensing']
];
test('six indexable, distinct bilingual technical/B2B SEO pages have accurate canonical/hreflang, unique titles and visible substance',()=>{
 const titles=new Set(),descriptions=new Set();
 for(const [it,en] of pairs)for(const slug of [it,en]){
  const dir=slug+'/index.html';
  assert.ok(existsSync(resolve(root,dir)),dir);
  const s=f(dir),link='https://www.delghe.com/'+slug+'/';
  const title=s.match(/<title>([^<]+)<\/title>/)?.[1],desc=s.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(title&&title.length>=32&&title.length<=95,slug+' title');
  assert.ok(desc&&desc.length>=85&&desc.length<=205,slug+' meta description');
  assert.ok(!titles.has(title),slug+' duplicate title');titles.add(title);
  assert.ok(!descriptions.has(desc),slug+' duplicate description');descriptions.add(desc);
  assert.ok(s.includes('<link rel="canonical" href="'+link+'">'),slug+' canonical');
  assert.ok(s.includes('<link rel="alternate" hreflang="it" href="https://www.delghe.com/'+it+'/">'),slug+' hreflang it');
  assert.ok(s.includes('<link rel="alternate" hreflang="en" href="https://www.delghe.com/'+en+'/">'),slug+' hreflang en');
  assert.match(s,/<h1>[^<]+<\/h1>/);
  assert.ok((s.match(/<h2>/g)||[]).length>=4,slug+' clear sections');
  assert.ok(s.includes('rel="canonical"')&&s.includes('max-image-preview:large'),slug+' crawlability');
  assert.ok(s.includes('application/ld+json'),slug+' schema');
  assert.match(s,/<img[^>]+width="\d+"[^>]+height="\d+"/);
  const textOnly=s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  assert.ok(textOnly.split(' ').length>=340,slug+' substantive real technical copy');
  assert.ok(s.includes('DÈLGHEM')&&s.includes('Apple Silicon'),slug+' topic');
 }
});
test('landing pages and site navigation interlink technical content and exclusive source-code licensing without checkout',()=>{
 for(const page of ['index.html','it/index.html']){
  const html=f(page);
  for(const [it,en] of pairs)assert.ok(html.includes('/'+(page==='index.html'?en:it)+'/'),page+' link');
 }
 const it=f(pairs[2][0]+'/index.html'),en=f(pairs[2][1]+'/index.html');
 for(const html of [it,en]){
  assert.match(html,/delghem@proton\.me/);
  assert.match(html,/exclusiv|esclusiv/i);
  assert.match(html,/royalt/i);
  assert.match(html,/licenz|licens/i);
  assert.doesNotMatch(html,/Buy now|Purchase now|Acquista ora|Stripe checkout|Paga adesso/i);
 }
});
test('sitemap declares all six canonical URLs once, includes new real D2 images, and IndexNow key is hosted',()=>{
 const sitemap=f('sitemap.xml');
 for(const [it,en] of pairs)for(const slug of [it,en]){
  const hit='<loc>https://www.delghe.com/'+slug+'/</loc>';
  assert.equal(sitemap.split(hit).length,2,slug+' unique sitemap entry');
 }
 assert.match(sitemap,/assets\/fem-lab\/gallery\/kratos-axial-loading\.webp/);
 assert.match(sitemap,/assets\/real-d2\/complex-frame-poster\.webp/);
 const keys=readdirSync(root).filter(n=>/^[a-z0-9-]{16,64}\.txt$/.test(n));
 assert.ok(keys.length>=1,'IndexNow key URL must exist at site root');
 const key=keys.find(name=>f(name).trim()===name.slice(0,-4));
 assert.ok(key,'IndexNow key file must match its basename');
});
