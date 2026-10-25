import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('DELGHEM assembles normally, neon tagline pops in, waits five full seconds, then exits smoothly',async()=>{
 const timeline=await import('../site-intro-timeline.mjs');
 assert.equal(timeline.INTRO_TAGLINE_REVEAL_MS,2930);
 assert.equal(timeline.INTRO_TAGLINE_HOLD_MS,5000);
 assert.equal(timeline.INTRO_EXIT_START_MS,7930);
 assert.equal(timeline.INTRO_DURATION_MS,8320);
 assert.deepEqual(timeline.INTRO_WORD_STAGES,['D','DE','DEL','DELG','DELGH','DELGHE','DELGHEM']);
 const at=ms=>timeline.introAt(ms);
 assert.equal(at(0).word,'D');
 assert.equal(at(500).word,'DE');
 assert.equal(at(1000).word,'DEL');
 assert.equal(at(1500).word,'DELG');
 assert.equal(at(2000).word,'DELGH');
 assert.equal(at(2500).word,'DELGHE');
 assert.equal(at(3000).word,'DELGHEM');
 assert.equal(at(3500).word,'DELGHEM');
 assert.equal(at(4999).word,'DELGHEM');
 assert.ok(!at(4999).done);
 assert.ok(!at(2929).tagline);
 assert.ok(at(2930).tagline);
 assert.ok(at(3000).tagline);
 assert.ok(!at(7929).exit);
 assert.ok(at(7930).exit);
 assert.ok(!at(8319).done);
 assert.equal(at(8320).done,true);
 assert.equal(at(9000).done,true);
 assert.ok(!at(1000).tagline);
 for(let ms=0;ms<=8320;ms+=100)
  assert.ok(at(ms).progress>=0&&at(ms).progress<=1&&at(ms).progress>=at(Math.max(0,ms-100)).progress);
});

test('Two homepages deliver animated splash before the rest of the site with real Kratos FEM artwork and exact English Apple Silicon caption',()=>{
 for(const [file,lang,prefix] of [
  ['index.html','en','./'],['it/index.html','it','../']
 ]){
  const html=read(file);
  const intro=html.indexOf('id="site-intro"');
  const header=html.indexOf('<header class="site-header"');
  assert.ok(intro>=0&&intro<header,file+' intro must appear before header');
  assert.match(html,/id="site-intro-word"[^>]*>D</);
  assert.match(html,/id="site-intro-progress"/);
  assert.match(html,/id="site-intro-mesh"/);
  assert.match(html,/id="site-intro-skip"/);
  assert.match(html,/id="site-intro-tagline"/);
  assert.match(html,/Superior performance through native Apple Silicon\./);
  assert.match(html,/aria-label="DELGHEM"/);
  assert.match(html,/site-intro\.js\?v=20261025-neonhold/);
  assert.match(html,/intro-neon\.css\?v=20261025-neonhold/);
  assert.match(html,/style\.css\?v=20261025-showcase15seo/);
  assert.match(html,/kratos.*surface|surface-skewed-double-opening-slab\.webp/);
  assert.ok(html.includes(prefix+'assets/fem-lab/gallery/surface-skewed-double-opening-slab.webp'));
  assert.match(html,/<noscript><style>[\s\S]*site-intro[\s\S]*<\/style><\/noscript>/);
  assert.ok(html.indexOf('id="site-intro"')<html.indexOf('id="support-top"'));
  assert.ok(html.includes('id="steel-frame-comparison"'),file+' source-backed comparative damper must remain');
  assert.ok(html.includes('id="visitor-counter-total"'),file+' visitor baseline and PayPal stay in top strip');
  assert.equal((html.match(/<main(?:\s|>)/g)||[]).length,1,'exactly one main landmark when intro overlays the site');
  assert.ok(html.includes('id="steel-frame-accelerogram"'),file+' native D2 automatic two-frame input stays visible');

 }
});

test('Splash animation has no dependency on external APIs, uses one RAF, cleans up, and honors accessibility controls',()=>{
 const js=read('site-intro.js');
 const css=read('style.css');
 assert.match(js,/import\s+\{introAt,INTRO_DURATION_MS,INTRO_EXIT_START_MS,INTRO_TAGLINE_HOLD_MS\}/);
 assert.match(js,/requestAnimationFrame/);
 assert.match(js,/cancelAnimationFrame/);
 assert.match(js,/prefers-reduced-motion/);
 assert.match(js,/site-intro-skip/);
 assert.match(js,/is-dismissed/);
 assert.match(js,/site-intro-word/);
 assert.match(js,/site-intro-progress/);
 assert.match(js,/site-intro-tagline/);
 assert.match(js,/introAt\(/);
 assert.match(css,/\.site-intro\{/);
 assert.match(css,/\.site-intro__word/);
 assert.match(css,/\.site-intro__tagline/);
 assert.match(css,/\.site-intro__mesh/);
 assert.match(css,/\.site-intro\.is-dismissed/);
 assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
 assert.doesNotMatch(js,/fetch\(|localStorage|sessionStorage|network|WebSocket|new Image\(/i);
});

test('Neon subtitle is revealed abruptly, pulses with a glowing halo and stays five seconds before transition',()=>{
 const css=read('intro-neon.css');
 const js=read('site-intro.js');
 for(const [pattern,message] of [
  [/\.site-intro__tagline\s*\{[^}]*transition:\s*none/s,'no fade on tagline'],
  [/\.site-intro\[data-phase="complete"\] \.site-intro__tagline/s,'instant subtitle display'],
  [/@keyframes introTaglineNeonStrike/,'neon ignition keyframes'],
  [/text-shadow:/,'neon text halo'],
  [/introFailsafe\s+9\.3s/,'extended failsafe'],
  [/@media\s*\(prefers-reduced-motion:\s*reduce\)/,'reduced-motion support']
 ])assert.match(css,pattern,message);
 assert.match(js,/site-intro-timeline\.mjs\?v=20261025-neonhold/);
 assert.match(js,/INTRO_TAGLINE_HOLD_MS/);
 for(const f of ['index.html','it/index.html'])assert.match(read(f),/class="intro-label-hold"/);
});
