import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const cases=[
 ['fondazioni-pali-winkler-mac/index.html','https://www.delghe.com/fondazioni-pali-winkler-mac/','it','https://www.delghe.com/en/pile-winkler-foundations-mac/','pali|fondazioni'],
 ['en/pile-winkler-foundations-mac/index.html','https://www.delghe.com/en/pile-winkler-foundations-mac/','en','https://www.delghe.com/fondazioni-pali-winkler-mac/','piles|foundations'],
 ['dissipatori-viscosi-fem-mac/index.html','https://www.delghe.com/dissipatori-viscosi-fem-mac/','it','https://www.delghe.com/en/viscous-dampers-steel-fem-mac/','dissipatori'],
 ['en/viscous-dampers-steel-fem-mac/index.html','https://www.delghe.com/en/viscous-dampers-steel-fem-mac/','en','https://www.delghe.com/dissipatori-viscosi-fem-mac/','dampers'],
 ['genius-assistente-fem-mac/index.html','https://www.delghe.com/genius-assistente-fem-mac/','it','https://www.delghe.com/en/genius-fem-assistant-mac/','Genius'],
 ['en/genius-fem-assistant-mac/index.html','https://www.delghe.com/en/genius-fem-assistant-mac/','en','https://www.delghe.com/genius-assistente-fem-mac/','Genius']
];
test('Six real engineering topic pages bilingual canonical crawlable with qualified source-backed claims',()=>{
 const titles=new Set();
 for(const [file,url,lang,sister,topic] of cases){
  const html=read(file);
  assert.ok(statSync(resolve(root,file)).size>4900,file);
  assert.ok(html.includes('<html lang="'+lang+'">'),file);
  assert.ok(html.includes('<link rel="canonical" href="'+url+'">'),file);
  assert.ok(html.includes('<link rel="alternate" hreflang="'+(lang==='it'?'en':'it')+'" href="'+sister+'">'),file);
  const title=html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert.ok(title&&title.length>=35&&title.length<=91,title);
  assert.ok(!titles.has(title),'duplicate topic title');titles.add(title);
  const desc=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(desc&&desc.length>=95&&desc.length<=190,file+' description length '+desc?.length);
  assert.equal((html.match(/<h1(?:\s[^>]*)?>/g)||[]).length,1,file);
  assert.match(html,new RegExp(topic,'i'),file+' topic');
  assert.match(html,/<script type="application\/ld\+json">/);
  assert.match(html,/"@type":"TechArticle"/);
  assert.match(html,/"@type":"BreadcrumbList"/);
  assert.match(html,/rel="alternate" hreflang="x-default"/);
  assert.match(html,/name="robots" content="index,follow/);
  assert.match(html,/src="[^"]+\.(?:webp|png)"/);
  assert.match(html,/not.*(code|certified|design)|non.*(verific|certificat)|non costituisc/i);
  assert.match(html,/href="\/(it\/)?#(engineering-benchmarks|genius)"/);
  assert.match(html,/href="\/(media-kit\/|en\/media-kit\/)"/);
 }
});
test('Sitemap has 22 unique canonical bilingual URLs, including six new technical resources',()=>{
 const xml=read('sitemap.xml');
 const urls=[...xml.matchAll(/<loc>(https:\/\/www\.delghe\.com\/[^<]*)<\/loc>/g)].map(m=>m[1]);
 assert.equal(urls.length,22);
 assert.equal(new Set(urls).size,22);
 for(const [file,url] of cases){
  assert.ok(urls.includes(url),file);
  assert.ok(!url.includes('#'));
 }
 assert.match(read('robots.txt'),/Sitemap: https:\/\/www\.delghe\.com\/sitemap\.xml/);
});
test('Ten grounded promotional banner composites in five engineering ad formats, IT/EN',()=>{
 for(const lang of ['it','en'])for(const [type,w,h] of [
  ['leaderboard',728,90],['billboard',970,250],['rectangle',300,250],
  ['skyscraper',300,600],['square',1080,1080]
 ]){
  const file='assets/banners/delghem-'+type+'-'+lang+'.webp';
  const data=readFileSync(resolve(root,file));
  assert.ok(data.length>3500,file);
  assert.equal(data.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(data.subarray(8,12).toString('ascii'),'WEBP');
  const verified=spawnSync('magick',['identify','-format','%wx%h',resolve(root,file)],{encoding:'utf8'});
  assert.equal(verified.status,0,file+' cannot decode');
  assert.equal(verified.stdout,w+'x'+h,file+' dimensions');
 }
 const generator=read('scripts/build-promo-banners.sh');
 assert.match(generator,/assets\/genius\/genius-workflow-/);
 assert.match(generator,/assets\/fem-lab\/gallery\/surface-skewed-double-opening-slab\.webp/);
 assert.match(generator,/magick/);
 assert.doesNotMatch(generator,/imagegen|generative|synthesized/i);
});
test('Bilingual media kit offers five original banner layouts and embeddable snippets only with publisher permission',()=>{
 for(const [file,lang] of [['media-kit/index.html','it'],['en/media-kit/index.html','en']]){
  const html=read(file);
  assert.match(html,/id="promotional-banners"/);
  assert.match(html,/class="banner-press-gallery"/);
  assert.equal((html.match(/class="banner-format-card"/g)||[]).length,5);
  assert.match(html,/name="banner-embed"/);
  assert.match(html,/class="banner-code-copy"/);
  for(const type of ['leaderboard','billboard','rectangle','skyscraper','square'])
   assert.ok(html.includes('delghem-'+type+'-'+lang+'.webp'),file+type);
  assert.match(html,/l’autorizzazione|permission/i);
  assert.match(html,/href="https:\/\/www\.delghe\.com\/(it\/)?"/);
  assert.match(html,/Download|Scarica/i);
  assert.match(html,/banner-kit\.js/);
 }
 const js=read('banner-kit.js');
 assert.match(js,/navigator\.clipboard\.writeText/);
 assert.match(js,/banner-code-copy/);
 assert.match(js,/banner-embed/);
});
test('Official GitHub README banner and site internal topic links discoverable',()=>{
 const readme=read('README.md');
 const homepage=read('index.html'),it=read('it/index.html');
 assert.match(readme,/delghem-billboard-it\.webp/);
 assert.match(readme,/delghem-leaderboard-en\.webp/);
 assert.match(readme,/https:\/\/www\.delghe\.com\//);
 for(const [file] of cases){
  const clean=file.slice(0,-'index.html'.length);
  assert.ok(homepage.includes('/'+clean)||it.includes('/'+clean),file+' not linked in site');
 }
 assert.match(homepage,/href="\/en\/media-kit\/#promotional-banners"/);
 assert.match(it,/href="\/media-kit\/#promotional-banners"/);
});
test('Transparent IndexNow key file and only domain-owned sitemap submissions',()=>{
 const shell=read('scripts/notify-indexnow.sh');
 assert.match(shell,/api\.indexnow\.org/);
 assert.match(shell,/keyLocation/);
 assert.match(shell,/site-indexnow\.key/);
 assert.match(shell,/sitemap\.xml/);
 const key=read('site-indexnow.key').trim();
 assert.match(key,/^[a-zA-Z0-9-]{8,128}$/);
 assert.ok(existsSync(resolve(root,key+'.txt')));
 assert.equal(read(key+'.txt').trim(),key);
});

test('Official press kit provides one download ZIP with all 10 authentic D2 promo banners and no font/source binaries',()=>{
 const zip='assets/banners/delghem-banners-it-en.zip';
 assert.ok(existsSync(resolve(root,zip)),zip+' must be publicly hosted');
 const archive=spawnSync('unzip',['-Z','-1',resolve(root,zip)],{encoding:'utf8'});
 assert.equal(archive.status,0,'ZIP readable');
 const files=archive.stdout.trim().split('\n').filter(Boolean);
 assert.equal(files.length,11,'exactly 10 WebP + one usage and provenance notice');
 assert.ok(files.includes('README-PROMO.txt'));
 for(const lang of ['it','en'])for(const type of ['leaderboard','billboard','rectangle','skyscraper','square']){
  assert.ok(files.includes('delghem-'+type+'-'+lang+'.webp'));
 }
 assert.ok(files.every(name=>!/\.(exe|dmg|ttf|otf|js|mjs|json)$/i.test(name)),
  'only images and a brief usage notice, no fonts or program code');
 for(const file of ['media-kit/index.html','en/media-kit/index.html']){
  const html=read(file);
  assert.match(html,/href="[^"]*delghem-banners-it-en\.zip"/);
  assert.match(html,/banner-bundle-download/);
 }
 assert.match(read('README.md'),/delghem-banners-it-en\.zip/);
});
