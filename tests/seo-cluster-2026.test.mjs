import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const base='https://www.delghe.com/';
const pairs=[
 ['tavole-cemento-armato-mac','en/reinforced-concrete-drawings-mac'],
 ['computo-materiali-fem-mac','en/structural-material-takeoff-mac'],
 ['isolatori-sismici-dissipatori-confronto','en/seismic-isolators-vs-viscous-dampers'],
 ['reports/it','reports/en']
];
function get(p){return read((p?p+'/':'')+'index.html');}
test('eight new canonical source pages and technical reports are discoverable in precise sitemap',()=>{
 const sitemap=read('sitemap.xml'),urls=[...sitemap.matchAll(/<loc>(https:\/\/www\.delghe\.com\/[^<]*)<\/loc>/g)].map(a=>a[1]);
 assert.equal(urls.length,30);
 assert.equal(new Set(urls).size,30);
 for(const [it,en] of pairs)for(const slug of [it,en]){
  assert.ok(urls.includes(base+slug+'/'),slug);
  assert.ok(existsSync(resolve(root,slug,'index.html')));
  assert.ok(sitemap.includes('<lastmod>2026-10-26</lastmod>'));
  const body=get(slug);
  assert.ok(body.includes('rel="canonical" href="'+base+slug+'/"'),slug);
  assert.ok(body.includes('hreflang="it" href="'+base+it+'/"'),slug+' it');
  assert.ok(body.includes('hreflang="en" href="'+base+en+'/"'),slug+' en');
  assert.ok(body.includes('hreflang="x-default" href="'+base+en+'/"'),slug+' x default');
 }
});
test('each of six new articles has unique search intent, visible technical text and valid source images',()=>{
 const all=[];
 for(const [it,en] of pairs.slice(0,3)){
  for(const [slug,locale] of [[it,'it'],[en,'en']]){
   const body=get(slug);
   assert.match(body,new RegExp('<html lang="'+locale+'">'));
   const title=body.match(/<title>(.*?)<\/title>/)?.[1];
   assert.ok(title.length>42&&title.length<90,title);
   all.push(title);
   const desc=body.match(/<meta name="description" content="([^"]+)"/)?.[1];
   assert.ok(desc.length>100&&desc.length<190,desc.length+' '+slug);
   assert.equal((body.match(/<h1>/g)||[]).length,1);
   assert.ok((body.match(/<h2>/g)||[]).length>=5);
   assert.ok((body.match(/<section class="seo-section(?: seo-questions)?"/g)||[]).length>=5);
   assert.ok(body.replace(/<[^>]*>/g,' ').split(/\s+/).length>540,slug);
   const img=body.match(/<img src="https:\/\/www\.delghe\.com\/([^"]+)"/)?.[1];
   assert.ok(img&&existsSync(resolve(root,img)),'image '+slug);
   const graph=JSON.parse(body.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1])['@graph'];
   assert.ok(graph.some(x=>x['@type']==='Article'&&x.dateModified==='2026-10-26'));
   assert.ok(graph.some(x=>x['@type']==='BreadcrumbList'));
   assert.match(body,/not certified|not signed|no.*(contract|estimate)|non.*(esecutivo|firmato|preventivo)|non costituisc|cannot replace|cannot establish|non.*sostituire/i);
  }
 }
 assert.equal(new Set(all).size,6,'each topic has independent title');
});
test('homes introduce visible crawlable topical navigation, native Mac intent and truthful software status',()=>{
 for(const file of ['index.html','it/index.html']){
  const html=read(file);
  assert.match(html,/id="engineering-guides"/);
  assert.match(html,/class="seo-documentation-cards"/);
  assert.match(html,/SoftwareApplication/);
  assert.match(html,/<title>DÈLGHEM.*Mac/);
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1])['@graph'];
  const software=graph.find(e=>e['@type']==='SoftwareApplication');
  assert.equal(software.creativeWorkStatus.startsWith('In '),true);
  assert.ok(!('aggregateRating' in software)&&!('offers' in software));
  assert.equal(graph.find(e=>e['@type']==='ItemList').itemListElement.length,3);
  const isIt=file.startsWith('it/');
  for(const slugs of pairs.slice(0,3))assert.ok(html.includes('href="/'+slugs[isIt?0:1]+'/"'));
 }
});
test('existing product articles link to topical guides without altering established canonicals',()=>{
 const lookups=[
 ['software-fem-mac','computo-materiali-fem-mac'],
 ['en/native-structural-analysis-mac','en/structural-material-takeoff-mac'],
 ['disegni-officina-acciaio','tavole-cemento-armato-mac'],
 ['en/steel-workshop-drawings','en/reinforced-concrete-drawings-mac'],
 ['dissipatori-viscosi-fem-mac','isolatori-sismici-dissipatori-confronto'],
 ['en/viscous-dampers-steel-fem-mac','en/seismic-isolators-vs-viscous-dampers']
 ];
 for(const [from,to] of lookups){
  const text=get(from);assert.ok(text.includes('href="/'+to+'/"'));
  assert.ok(text.includes('rel="canonical" href="'+base+from+'/"'));
 }
});
