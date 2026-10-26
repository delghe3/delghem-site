import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(root,f),'utf8');
const files=[
  'index.html','it/index.html',
  'tecnologia-fem-mac/index.html','en/mac-fem-technology/index.html',
  'disegni-officina-acciaio/index.html','en/steel-workshop-drawings/index.html',
  'software-fem-mac/index.html','en/native-structural-analysis-mac/index.html',
  'media-kit/index.html','en/media-kit/index.html'
];
const base='https://www.delghe.com';
const graphFor=html=>[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
const flatten=graphs=>graphs.flatMap(obj=>obj['@graph']??[obj]);

test('Homepage SoftwareApplication links to current canonical English root, not deprecated /en/',()=>{
 const apps=flatten(graphFor(read('index.html'))).filter(g=>g['@type']==='SoftwareApplication');
 assert.equal(apps.length,1);
 assert.equal(apps[0].url,base+'/');
 assert.deepEqual(apps[0].inLanguage,['en','it']);
 assert.equal(apps[0]['@id'],base+'/#software');
});

test('Italian homepage graph identifies the same bilingual product without pointing at former language path',()=>{
 const apps=flatten(graphFor(read('it/index.html'))).filter(g=>g['@type']==='SoftwareApplication');
 assert.equal(apps.length,1);
 assert.equal(apps[0].url,base+'/');
 assert.deepEqual(apps[0].inLanguage,['en','it']);
});

test('Every subordinate page breadcrumb identifies its language-specific current homepage',()=>{
 for(const path of files.slice(2)){
  const lang=path.startsWith('en/')?'en':'it';
  const expected=lang==='en'?base+'/':base+'/it/';
  const html=read(path);
  const breadcrumbs=flatten(graphFor(html)).filter(g=>g['@type']==='BreadcrumbList');
  assert.equal(breadcrumbs.length,1,'BreadcrumbList missing in '+path);
  assert.equal(breadcrumbs[0].itemListElement[0].item,expected,path);
 }
});

test('Sitemap has full-resolution genuine software image URLs (including JS lightbox assets) for both homepages',()=>{
 const xml=read('sitemap.xml');
 assert.match(xml,/xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
 const pages=(xml.match(/<loc>/g)||[]).length;
 assert.equal(pages,30);
 const pics=[...xml.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map(x=>x[1]);
 assert.ok(pics.length>=20,'Too few searchable real screenshots');
 assert.ok(pics.some(x=>x.includes('/assets/screenshots/model.webp')));
 assert.ok(pics.some(x=>x.includes('/assets/screenshots/drawing.webp')));
 assert.ok(pics.some(x=>x.includes('/assets/screenshots/workshop.webp')));
 for(const url of pics){
  assert.ok(url.startsWith(base+'/'),url);
  assert.ok(existsSync(resolve(root,url.slice(base.length+1))),url);
 }
});

test('Crawlability remains open with self canonical and real-language alternates',()=>{
 const robots=read('robots.txt');
 assert.match(robots,/User-agent: \*/);
 assert.match(robots,/Allow: \//);
 assert.match(robots,/Sitemap: https:\/\/www\.delghe\.com\/sitemap\.xml/);
 for(const name of files){
  const html=read(name);
  assert.doesNotMatch(html,/<meta[^>]+name="robots"[^>]+noindex/i,name);
  assert.match(html,/rel="canonical"/,name);
  assert.match(html,/hreflang="en"/,name);
  assert.match(html,/hreflang="it"/,name);
 }
});
