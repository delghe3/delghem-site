import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync,statSync,existsSync} from 'node:fs';
import {resolve,dirname,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const paths = [
  'index.html','it/index.html','software-fem-mac/index.html',
  'en/native-structural-analysis-mac/index.html',
  'tecnologia-fem-mac/index.html','en/mac-fem-technology/index.html',
  'disegni-officina-acciaio/index.html','en/steel-workshop-drawings/index.html',
  'media-kit/index.html','en/media-kit/index.html'
];
const read=p=>readFileSync(resolve(root,p),'utf8');
const canonical=h=>h.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const attrRefs=(h)=>[...h.matchAll(/<(?:a|img|script|link)\b[^>]*?\s(?:href|src)="([^"]+)"/gi)].map(m=>m[1]);
function resolvedAsset(from,url) {
  if(!url || /^(#|https?:|mailto:|tel:|data:|javascript:)/.test(url)) return null;
  const val=url.split(/[?#]/)[0];
  const abs=val.startsWith('/') ? resolve(root,val.replace(/^\/+/,'')) : resolve(root,dirname(from),val);
  if(abs!==root && !abs.startsWith(root+'/')) throw new Error('Escapes site root: '+from+' -> '+url);
  if(existsSync(abs) && statSync(abs).isDirectory()) return resolve(abs,'index.html');
  if(val.endsWith('/')) return resolve(abs,'index.html');
  return abs;
}
test('Ten canonical destinations each have exactly one HTML page',()=>{
 const found=new Set();
 for (const path of paths){
  const html=read(path);
  const link=canonical(html);
  assert.ok(link?.startsWith('https://www.delghe.com/'),path);
  assert.ok(!found.has(link),'Repeated canonical: '+link);
  found.add(link);
  assert.ok(html.includes('<html lang='),path);
  assert.match(html,/<meta name="description"/,path);
 }
 assert.equal(found.size,10);
});
test('All internal links and media paths resolve to actual published files',()=>{
 const missing=[];
 for (const file of paths){
  const html=read(file);
  for (const ref of attrRefs(html)){
    const target=resolvedAsset(file,ref);
    if(target && !existsSync(target)) missing.push(file+' -> '+ref);
  }
 }
 assert.deepEqual(missing,[]);
});
test('Sitemap covers every canonical destination, including media kits',()=>{
 const xml=read('sitemap.xml');
 for (const file of paths) assert.ok(xml.includes('<loc>'+canonical(read(file))+'</loc>'),file);
 assert.ok(read('robots.txt').includes('Sitemap: https://www.delghe.com/sitemap.xml'));
});
test('Real model images all exist and are non-empty',()=>{
 const files=readdirSync(resolve(root,'assets/screenshots')).filter(f=>f.endsWith('.webp'));
 assert.ok(files.length>=32);
 for (const file of files) assert.ok(statSync(resolve(root,'assets/screenshots',file)).size>100,'empty '+file);
});
test('Official support email copy is the same in both language versions',()=>{
 for(const file of ['index.html','it/index.html']){
  const html=read(file);
  assert.equal((html.match(/class="paypal-send-link"/g)||[]).length,1);
  assert.match(html,/https:\/\/www\.paypal\.com\/myaccount\/transfer\/send/);
  assert.match(html,/ildelghe3@gmail.com/);
  assert.doesNotMatch(html,/cgi-bin\/webscr\?cmd=_donations/);
 }
});
test('Media kits contain attribution language and working previews',()=>{
 for(const path of ['media-kit/index.html','en/media-kit/index.html']){
  assert.match(read(path),/assets\/screenshots\/steel-frame\.webp/);
  assert.match(read(path),/og:image/);
  assert.match(read(path),/BreadcrumbList/);
 }
});
