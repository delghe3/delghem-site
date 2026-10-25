import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {recoverSharedVertexField,sampleRecoveredQuad,paintPixelContours} from '../contour-shading.mjs';
const home=resolve(dirname(fileURLToPath(import.meta.url)),'..');

test('shared nodal smoothing is C0 continuous across adjoining QUAD4 borders',()=>{
 const elements=[
  {id:'a',vertices:[[0,0],[1,0],[1,1],[0,1]],gauss:[0,0,100,100]},
  {id:'b',vertices:[[1,0],[2,0],[2,1],[1,1]],gauss:[500,500,600,600]}
 ];
 const key=(el,i)=>el.vertices[i].join(',');
 const result=recoverSharedVertexField(elements,x=>x.gauss,key);
 assert.equal(result.length,2);
 assert.equal(result[0][1],result[1][0]);
 assert.equal(result[0][2],result[1][3]);
 for(let v=0;v<=1;v+=.05){
  const left=sampleRecoveredQuad(result[0],1,v);
  const right=sampleRecoveredQuad(result[1],0,v);
  assert.ok(Math.abs(left-right)<1e-8,'shared edge mismatch '+v);
 }
 assert.deepEqual(elements[0].gauss,[0,0,100,100]);
 assert.deepEqual(elements[1].gauss,[500,500,600,600]);
});

test('continuous rasterizer uses per-pixel RGB gradients, does not fill geometric holes, and preserves shared colors',()=>{
 const width=120,height=60;
 const image=new Uint8ClampedArray(width*height*4);
 const stops=['#164171','#5bc8bf','#ef6850'];
 const rect=(x0,x1,vals)=>({pts:[{x:x0,y:5},{x:x1,y:5},{x:x1,y:55},{x:x0,y:55}],values:vals});
 const a=rect(2,45,[0,.5,.5,0]), b=rect(45,85,[.5,1,1,.5]);
 // Opening / empty region at x=85...119 intentionally not rasterized.
 paintPixelContours(image,width,height,[a,b],stops,0,1);
 const at=(x,y)=>[...image.slice((y*width+x)*4,(y*width+x)*4+4)];
 assert.equal(at(105,30)[3],0,'hole must remain transparent');
 assert.equal(at(22,30)[3],255);
 assert.equal(at(65,30)[3],255);
 const colors=new Set();for(let x=4;x<=82;x++)colors.add(at(x,30).slice(0,3).join(','));
 assert.ok(colors.size>50,'high-resolution interpolated gradient expected; found '+colors.size+' colors');
 const left=at(44,30),right=at(45,30);
 assert.ok(Math.max(...left.slice(0,3).map((c,i)=>Math.abs(c-right[i])))<6,'neighboring edge color mismatch');
});

test('both FEM renderers use the shared pixel rasterizer rather than cell-by-cell polygon painting',()=>{
 for(const file of ['surface-studio.js','fem-lab.js']){
  const js=readFileSync(resolve(home,file),'utf8');
  assert.match(js,/recoverSharedVertexField\(/);
  assert.match(js,/drawContinuousContours\(/);
  assert.match(js,/aliasing/);
 }
});
