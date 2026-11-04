import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const video='assets/video/delghem-alpha-demo-3d.mp4';
const poster='assets/video/delghem-alpha-demo-cover.webp';
for(const [file,language] of [['index.html','en'],['it/index.html','it']]){
 test(language+' homepage features the genuine seven-minute demo immediately after the introductory presentation',()=>{
  const html=readFileSync(resolve(root,file),'utf8');
  const hero=html.indexOf('class="hero chapter"');
  const section=html.indexOf('id="alpha-demo"');
  const next=html.indexOf('id="silicon-performance"');
  assert.ok(hero>=0&&section>hero&&next>section,'Video follows presentation and precedes rest of site');
  assert.match(html,new RegExp('<video[^>]+controls[^>]+poster="[^"]*'+poster.replaceAll('/','\\/')+'"'));
  assert.match(html,/preload="none"/);
  assert.match(html,/playsinline/);
  assert.ok(html.includes(video));
  assert.ok(html.includes('VideoObject'));
 });
}
test('compressed H264 demo and actual poster are present, streamable and below the GitHub hard limit',()=>{
 const movie=statSync(resolve(root,video));
 const image=statSync(resolve(root,poster));
 assert.ok(movie.size>1_000_000&&movie.size<95_000_000,'compressed video '+movie.size);
 assert.ok(image.size>4_000,'poster '+image.size);
});
