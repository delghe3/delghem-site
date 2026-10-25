import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>readFileSync(resolve(root,p),'utf8');
test('user-requested 122,300 displayed visit baseline is transparent; automatic additions begin at historical snapshot',()=>{
 const js=file('visitor-counter.js');
 assert.match(js,/INITIAL_REPORTED_VISITS\s*=\s*122300/);
 assert.match(js,/RECORDED_AT_BASELINE\s*=\s*2671/);
 assert.match(js,/Math\.max\(0\s*,\s*count\s*-\s*RECORDED_AT_BASELINE\)/);
 assert.match(js,/INITIAL_REPORTED_VISITS\s*\+\s*newViews/);
 assert.match(js,/delghe_com_pageviews_20261023/);
 for(const path of ['index.html','it/index.html']){
  const s=file(path);
  assert.match(s,/id="visitor-counter-total">122[.,]300/);
  assert.doesNotMatch(s,/visitor-counter__note/);
  assert.match(s,/<span class="visitor-counter__eyebrow">VISITORS|<span class="visitor-counter__eyebrow">VISITATORI/);
 }
});
