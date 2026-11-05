import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(resolve(root,file),'utf8');

for(const file of ['index.html','it/index.html']){
 test(file+' puts the demo first with an engaging headline and true 1x autoplay after the intro',()=>{
  const html=read(file);
  const section=html.indexOf('id="alpha-demo"');
  const hero=html.indexOf('class="hero chapter"');
  assert.ok(section>0&&hero>section,'demo must be before "Structural analysis on your Mac"');
  assert.match(html,/Watch DÈLGHEM Come to Life|Guarda DÈLGHEM prendere vita/);
  assert.match(html,/<video(?=[^>]*id="alpha-demo-video")(?=[^>]*autoplay)(?=[^>]*muted)(?=[^>]*playsinline)(?=[^>]*loop)[^>]*>/);

  assert.match(html,/alpha-demo-video\.js\?v=20261105-fullgui-1x/);
  assert.match(html,/07:00/);
  assert.doesNotMatch(html,/03:30|2× speed|a 2×|velocità 2×/);
  assert.match(html,/data-src="\/assets\/video\/delghem-alpha-demo-3d\.mp4\?v=20261105-fullgui-1x"/);
 });
}
test('site introduction announces its completion once and the video controller listens to that event',()=>{
 assert.match(read('site-intro.js'),/dispatchEvent\(new CustomEvent\('delghem:intro-complete'\)\)/);
 assert.match(read('alpha-demo-video.js'),/delghem:intro-complete/);
});
test('video starts only after intro, loads on demand, starts muted at 1x and shows manual fallback if blocked',async()=>{
 const events=new Map();
 const videoListeners=new Map();
 const source={dataset:{src:'/assets/video/delghem-alpha-demo-3d.mp4'},src:''};
 const manual={hidden:true,addEventListener(type,fn){this['on'+type]=fn}};
 let playCalls=0,loadCalls=0,fail=false;
 const video={
  muted:false,defaultMuted:false,playbackRate:1,defaultPlaybackRate:1,
  querySelector(s){assert.equal(s,'source[data-src]');return source},
  addEventListener(type,fn){videoListeners.set(type,fn)},
  load(){loadCalls++},
  play(){playCalls++;return fail?Promise.reject(new Error('autoplay blocked')):Promise.resolve()},
 };
 const intro={};
 const elements={'alpha-demo-video':video,'alpha-demo-play-fallback':manual,'site-intro':intro};
 const document={
  readyState:'complete',
  getElementById(k){return elements[k]||null},
  addEventListener(type,fn){events.set(type,fn)}
 };
 vm.runInNewContext(read('alpha-demo-video.js'),{document,console,Promise});
 assert.equal(playCalls,0,'intro overlay still open; must not autoplay');
 assert.equal(source.src,'','video must not load before intro ends');
 delete elements['site-intro'];
 events.get('delghem:intro-complete')();
 assert.equal(source.src,source.dataset.src);
 assert.equal(loadCalls,1);
 assert.equal(playCalls,1);
 assert.equal(video.muted,true);
 assert.equal(video.defaultMuted,true);
 assert.equal(video.playbackRate,1);
 assert.equal(video.defaultPlaybackRate,1);
 videoListeners.get('loadedmetadata')();
 assert.equal(video.playbackRate,1);
 // No duplicate restart if completion is announced more than once.
 events.get('delghem:intro-complete')();
 assert.equal(playCalls,1);
 // Manual fallback is an accessible real action, not an inert overlay.
 fail=true;
 const promise=video.play();
 await promise.catch(()=>{});
 assert.equal(typeof manual.onclick,'function');
});