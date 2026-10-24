import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const pairs=[
 ['rss.xml','index.html','en-GB','en/nonlinear-pushover-ida-mac','en/3d-fem-stress-contours','en/apple-silicon-fem-software-licensing'],
 ['it/rss.xml','it/index.html','it-IT','analisi-pushover-ida-mac','mappe-tensioni-fem-3d','licenza-software-fem-apple-silicon']
];
test('Engineering-content RSS feeds in both languages include only real canonical articles with descriptive summaries',()=>{
 for(const [feed,home,language,...slugs] of pairs){
  const xml=read(feed);
  assert.match(xml,/<rss version="2\.0">/);
  assert.match(xml,new RegExp('<language>'+language+'</language>'));
  assert.equal((xml.match(/<item>/g)||[]).length,3);
  for(const slug of slugs){
   const url='https://www.delghe.com/'+slug+'/';
   assert.ok(xml.includes('<link>'+url+'</link>'),slug+' feed');
   assert.ok(xml.includes('<guid isPermaLink="true">'+url+'</guid>'),slug+' feed guid');
  }
  assert.match(read(home),/rel="alternate" type="application\/rss\+xml"/);
 }
});
