import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
test('DÈLGHEM Spessori control switches only representation, preserving all four native nodes, three actual members and 2D dynamic source',()=>{
 for(const page of ['index.html','it/index.html']){
  const s=readFileSync(resolve(site,page),'utf8');
  assert.match(s,/id="steel-frame-thickness"/);
  assert.match(s,/aria-pressed="true"/);
  assert.match(s,/Spessori|Sections/);
 }
 const main=readFileSync(resolve(site,'engineering-simulations.js'),'utf8');
 const render=readFileSync(resolve(site,'steel-portal-renderer.mjs'),'utf8');
 assert.match(main,/steel-frame-thickness/);
 assert.match(main,/showThickness/);
 assert.match(render,/showThickness\s*=\s*true/);
 assert.match(render,/if\(showThickness\)/);
 assert.match(main,/dataset\.nativeMemberCount|dataset\.nativeMembers/);
 assert.doesNotMatch(render,/portal=\[0,3\]/);
});
