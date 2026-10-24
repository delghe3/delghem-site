import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>readFileSync(resolve(root,p),'utf8');
test('Four published pages use same release version on their shared CSS stylesheet, preventing stale carousel and media-kit layouts',()=>{
 const pagePaths=['index.html','it/index.html','media-kit/index.html','en/media-kit/index.html'];
 const names=[];
 for(const p of pagePaths){
  const match=file(p).match(/<link rel="stylesheet" href="[^"]*style\.css\?v=([a-zA-Z0-9_-]+)"/);
  assert.ok(match,p+' must cache-bust CSS after carousel layout update');
  names.push(match[1]);
 }
 assert.equal(new Set(names).size,1,'all four pages must ship one exact CSS revision');
 assert.match(names[0],/^20261025-showcase[a-zA-Z0-9_-]+$/);
});
test('Carousel JavaScript loader and geometry module agree on stylesheet release',()=>{
 const home=file('it/index.html');
 const release=home.match(/style\.css\?v=([a-zA-Z0-9_-]+)/)?.[1];
 assert.ok(release);
 assert.ok(home.includes('app.js?v='+release));
 assert.ok(file('index.html').includes('app.js?v='+release));
 assert.ok(file('app.js').includes('model-stage.js?v='+release));
 assert.ok(file('model-stage.js').includes('showcase-geometry.mjs?v='+release));
});
test('Reduced-motion preference changes while page is open must update autoplay decision',()=>{
 const js=file('model-stage.js');
 assert.match(js,/let carouselReducedMotion\s*=/);
 assert.match(js,/carouselReducedMotion\s*=\s*reduced\.matches/);
 assert.match(js,/pauseBtn\.disabled\s*=\s*carouselReducedMotion/);
});
