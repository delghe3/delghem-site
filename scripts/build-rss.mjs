/**
 * Regenerate bilingual public RSS from current article metadata.
 * No legacy numerical engine dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const feed=[
 {file:'rss.xml',lang:'en-GB',title:'DÈLGHEM · Apple Silicon structural FEM insights',link:'https://www.delghe.com/',
 description:'Real Kratos engineering benchmarks and native structural FEM development updates.',
 slugs:['en/nonlinear-pushover-ida-mac','en/3d-fem-stress-contours','en/apple-silicon-fem-software-licensing']},
 {file:'it/rss.xml',lang:'it-IT',title:'DÈLGHEM · approfondimenti FEM per Apple Silicon',link:'https://www.delghe.com/it/',
 description:'Risultati Kratos, modellazione nativa FEM per Apple Silicon e sviluppo di DÈLGHEM.',
 slugs:['analisi-pushover-ida-mac','mappe-tensioni-fem-3d','licenza-software-fem-apple-silicon']}
];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
for(const f of feed){
 const pub='Sat, 24 Oct 2026 07:00:00 GMT';
 const x=['<?xml version="1.0" encoding="utf-8"?>','<rss version="2.0">','  <channel>',
  '    <title>'+esc(f.title)+'</title>','    <link>'+esc(f.link)+'</link>',
  '    <description>'+esc(f.description)+'</description>',
  '    <language>'+f.lang+'</language>','    <lastBuildDate>'+pub+'</lastBuildDate>'];
 for(const slug of f.slugs){
  const h=fs.readFileSync(path.join(root,slug,'index.html'),'utf8');
  const title=h.match(/<title>(.*?)<\/title>/s)?.[1];
  const description=h.match(/<meta name="description" content="([^"]+)"/)?.[1];
  if(!title||!description)throw Error('Missing metadata: '+slug);
  const url='https://www.delghe.com/'+slug+'/';
  x.push('    <item>','      <title>'+esc(decode(title))+'</title>',
   '      <link>'+url+'</link>',
   '      <description>'+esc(decode(description))+'</description>',
   '      <pubDate>'+pub+'</pubDate>',
   '      <guid isPermaLink="true">'+url+'</guid>','    </item>');
 }
 x.push('  </channel>','</rss>','');
 fs.writeFileSync(path.join(root,f.file),x.join('\n'));
 console.log('KRATOS_RSS_GENERATED',f.file,'items',f.slugs.length);
}
