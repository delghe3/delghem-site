import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
test('Both language homepages advertise true-source 1200x630 Open Graph images, not fake screenshots',()=>{
 for(const [html,img] of [['index.html','delghem-apple-silicon-en.png'],['it/index.html','delghem-apple-silicon-it.png']]){
  const text=readFileSync(resolve(root,html),'utf8'),file=readFileSync(resolve(root,'assets/social',img));
  assert.ok(file.length>20000,img+' must be substantial');
  assert.equal(file.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(file.readUInt32BE(16),1200);assert.equal(file.readUInt32BE(20),630);
  for(const line of [
    '<meta property="og:image" content="https://www.delghe.com/assets/social/'+img+'">',
    '<meta name="twitter:image" content="https://www.delghe.com/assets/social/'+img+'">'
  ])assert.ok(text.includes(line),html+' must advertise correct asset');
 }
});
