#!/usr/bin/env python3
"""Public, openly subscribable bilingual technical updates, zero paid services."""
from pathlib import Path
import re,html,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent
BASE='https://www.delghe.com/'
groups=[
 ('rss.xml','en-GB','DÈLGHEM · Apple Silicon structural FEM insights','DÈLGHEM engineering development and technical benchmark updates',
  ['en/nonlinear-pushover-ida-mac','en/3d-fem-stress-contours','en/apple-silicon-fem-software-licensing']),
 ('it/rss.xml','it-IT','DÈLGHEM · approfondimenti FEM per Apple Silicon','Aggiornamenti tecnici sui benchmark FEM e sul progetto DÈLGHEM in sviluppo',
  ['analisi-pushover-ida-mac','mappe-tensioni-fem-3d','licenza-software-fem-apple-silicon'])
]
for file,language,title,description,slugs in groups:
 xml=ET.Element('rss',{'version':'2.0'})
 ch=ET.SubElement(xml,'channel')
 for tag,val in [('title',title),('link',BASE+('it/' if language=='it-IT' else '')),('description',description),
                 ('language',language),('lastBuildDate','Sat, 24 Oct 2026 07:00:00 GMT')]:
  ET.SubElement(ch,tag).text=val
 for slug in slugs:
  s=(root/slug/'index.html').read_text()
  t=html.unescape(re.search(r'<title>(.*?)</title>',s,re.S).group(1))
  desc=html.unescape(re.search(r'<meta name="description" content="([^"]+)"',s).group(1))
  url=BASE+slug+'/'
  item=ET.SubElement(ch,'item')
  for tag,val in [('title',t),('link',url),('description',desc),('pubDate','Sat, 24 Oct 2026 07:00:00 GMT')]:
   ET.SubElement(item,tag).text=val
  ET.SubElement(item,'guid',{'isPermaLink':'true'}).text=url
 ET.indent(xml,space='  ')
 out=root/file;out.parent.mkdir(parents=True,exist_ok=True)
 ET.ElementTree(xml).write(out,encoding='utf-8',xml_declaration=True,short_empty_elements=True)
 print('RSS_FEED',file,out.stat().st_size,'items',len(slugs))
for page,language in [('index.html','en'),('it/index.html','it')]:
 p=root/page;s=p.read_text()
 marker='  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">\n'
 assert s.count(marker)==1,(page,s.count(marker))
 link='  <link rel="alternate" type="application/rss+xml" title="'+('DÈLGHEM structural FEM updates' if language=='en' else 'DÈLGHEM aggiornamenti FEM')+'" href="/'+('rss.xml' if language=='en' else 'it/rss.xml')+'">\n'
 if link not in s:s=s.replace(marker,marker+link,1)
 p.write_text(s)
 print('LINKED',page,'RSS')
