import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>readFileSync(resolve(root,p),'utf8');
test('owner-provided 87,600 visit base is transparent; automatic additions begin at historical snapshot',()=>{
 const js=file('visitor-counter.js');
 assert.match(js,/INITIAL_REPORTED_VISITS\s*=\s*87600/);
 assert.match(js,/RECORDED_AT_BASELINE\s*=\s*2671/);
 assert.match(js,/Math\.max\(0\s*,\s*count\s*-\s*RECORDED_AT_BASELINE\)/);
 assert.match(js,/INITIAL_REPORTED_VISITS\s*\+\s*newViews/);
 assert.match(js,/delghe_com_pageviews_20261023/);
 for(const [path,phrase] of [['index.html','owner-reported'],['it/index.html','dichiarato dal titolare']]){
  const s=file(path);
  assert.match(s,/id="visitor-counter-total">87[.,]600/);
  assert.match(s,new RegExp(phrase,'i'));
  assert.match(s,/24.10.2026/);
 }
});
