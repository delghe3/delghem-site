#!/usr/bin/env python3
"""Finish owner-controlled SEO: crawlable internal links, sitemap, IndexNow key.
Safe idempotent integration; all changes apply solely to static website.
"""
from pathlib import Path
from html import escape as esc
import json,re,secrets,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent
BASE='https://www.delghe.com/'
pair=[
 ('analisi-pushover-ida-mac','en/nonlinear-pushover-ida-mac','Curve Pushover e IDA: risultati reali','Real nonlinear Pushover and IDA curves'),
 ('mappe-tensioni-fem-3d','en/3d-fem-stress-contours','Mappe tensionali FEM 3D su shell','3D shell stress-contour benchmarks'),
 ('licenza-software-fem-apple-silicon','en/apple-silicon-fem-software-licensing','Licenza esclusiva per software house','Exclusive source-code licensing for software houses')
]
for name,italian in [('index.html',False),('it/index.html',True)]:
 page=root/name;s=page.read_text()
 # Add three descriptive, crawlable references inside the actual technical
 # articles hub. No key-word-stuffed footer link farm.
 match=re.search(r'<div class="technical-links">(.{0,2000}?)</div>',s,re.S)
 assert match,(name,'technical-links missing')
 content=match.group(1)
 for it,en,t_it,t_en in pair:
  href='/'+(it if italian else en)+'/'
  assert href not in content,(name,'duplicate SEO link',href)
  label=t_it if italian else t_en
  content+='<a href="'+href+'">'+esc(label)+' <span aria-hidden="true">↗</span></a>'
 s=s[:match.start(1)]+content+s[match.end(1):]
 # Link the high-value exact topic sections to the corresponding in-depth
 # content. Internal crawlability works even when JavaScript is disabled.
 start=s.index('<section class="fem-lab-section');end=s.index('<section class="genius-section',start)
 laboratory=s[start:end]
 extra='<nav class="fem-lab-deep-links" aria-label="'+('Approfondimenti tecnici sulle analisi' if italian else 'Read the technical evidence')+'">'
 for it,en,t_it,t_en in pair[:2]:
  extra+='<a href="/'+(it if italian else en)+'/">'+esc(t_it if italian else t_en)+' ↗</a>'
 extra+='</nav>\n    '
 anchor='<div class="fem-lab-source">'
 assert laboratory.count(anchor)==1
 laboratory=laboratory.replace(anchor,extra+anchor,1)
 s=s[:start]+laboratory+s[end:]
 # Put a clear but unobtrusive software-house action under existing business
 # contact CTA. There is no checkout or invented sales status.
 href='/'+(pair[2][0] if italian else pair[2][1])+'/'
 txt='Proposta riservata alle software house: licenza e codice sorgente ↗' if italian else 'For software houses: source-code licensing proposal ↗'
 marker='<a class="footer-brand" href="#home">'
 assert s.count(marker)==1
 s=s.replace(marker,'<a class="seo-footer-business" href="'+href+'">'+txt+'</a>'+marker,1)
 page.write_text(s)
 print('INTERNAL LINKS',name,'new',len(pair)+2+1)
# Repair contextual link from old Mac technology page (was linking to itself
# or other-language copy under a misleading label) and append new topic links.
for name,italian in [('tecnologia-fem-mac/index.html',True),('en/mac-fem-technology/index.html',False)]:
 page=root/name;s=page.read_text()
 a=s.index('<div class="guide-links">');b=s.index('</div>',a)+len('</div>')
 home='/it/' if italian else '/'
 links='<div class="guide-links"><a href="'+home+'">'+('Torna al sito' if italian else 'Back to website')+' ↗</a>'
 for it,en,t_it,t_en in pair:
  links+='<a href="/'+(it if italian else en)+'/">'+(t_it if italian else t_en)+' ↗</a>'
 links+='</div>'
 s=s[:a]+links+s[b:]
 page.write_text(s)
# Media kits link back to the new technical and licensing primary sources.
for name,italian in [('media-kit/index.html',True),('en/media-kit/index.html',False)]:
 page=root/name;s=page.read_text()
 match=re.search(r'(<section class="media-facts">)',s)
 assert match,(name,'media facts')
 links='<nav class="seo-media-resource-links" aria-label="'+('Schede di approfondimento' if italian else 'Technical resources')+'">'
 for it,en,t_it,t_en in pair:
  links+='<a href="/'+(it if italian else en)+'/">'+(t_it if italian else t_en)+' ↗</a>'
 links+='</nav>'
 s=s[:match.start()]+links+s[match.start():]
 page.write_text(s)
# Append semantic CSS blocks rather than tamper with browser canvas layout.
css=root/'style.css'
css.write_text(css.read_text()+'''
/* Discoverable editorial engineering articles and industrial licensing pages. */
.seo-article .seo-main{max-width:1480px}
.seo-article .seo-hero{max-width:1100px}
.seo-article .seo-hero>h1{max-width:22ch;text-wrap:balance}
.seo-article .seo-hero>.guide-lead{max-width:72ch}
.seo-article .seo-article-meta{display:flex;flex-wrap:wrap;gap:9px 22px;color:#397282;font-size:11px;font-weight:850;letter-spacing:.055em;margin:23px 0}
.seo-article .seo-cover{background:#e1f2ee;border:1px solid #d0e7e1;border-radius:12px;overflow:hidden}
.seo-article .seo-cover img{display:block;width:100%;height:auto;max-height:610px;object-fit:contain;object-position:center}
.seo-article .seo-cover figcaption{color:#466b73;font-size:11px;line-height:1.65;padding:14px 20px}
.seo-article .seo-reading{max-width:1100px}
.seo-article .seo-reading .seo-part{scroll-margin-top:110px;margin:0 0 52px}
.seo-article .seo-reading .seo-part h2{margin:0 0 19px;font-size:clamp(25px,2.75vw,35px)}
.seo-article .seo-reading .seo-part p{font-size:15px;line-height:1.95;margin:0 0 17px}
.seo-article .seo-reading a:not(.button){text-decoration:underline;text-underline-offset:3px;color:#216f86;font-weight:780}
.seo-article .seo-internal-toc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 23px;border-top:1px solid #cadcda;border-bottom:1px solid #cadcda;padding:19px 0;margin:8px 0 54px}
.seo-article .seo-internal-toc strong{grid-column:1/-1;font-size:11px;letter-spacing:.09em;color:#255b66}
.seo-article .seo-internal-toc a{font-size:12px!important;font-weight:800;line-height:1.5}
.seo-article .seo-result-figure{margin:28px 0 35px;border:1px solid #cadee0;border-radius:10px;background:#edf7f3;overflow:hidden}
.seo-article .seo-result-figure a{display:block}
.seo-article .seo-result-figure img{display:block;width:100%;height:auto;max-height:620px;object-fit:contain}
.seo-article .seo-result-figure figcaption{padding:13px 18px;font-size:11px;line-height:1.65;color:#436c75}
.seo-article .seo-faq{margin-top:53px;border-top:1px solid #c6dcda;padding-top:30px}
.seo-article .seo-faq-entry{margin:20px 0 25px}
.seo-article .seo-faq-entry h3{font-size:18px;letter-spacing:-.025em;color:#244f5b}
.seo-article .seo-faq-entry p{font-size:13px;line-height:1.8}
.seo-article .seo-related-links{padding:31px 0;margin:30px 0;border-top:1px solid #cadeda}
.seo-article .seo-related-links h2{font-size:21px;margin-bottom:19px}
.seo-article .seo-related-links>div{display:grid;grid-template-columns:1fr 1fr;gap:9px 18px}
.seo-article .seo-related-links a{display:block;background:#e5f2ed;border-radius:6px;padding:13px;font-size:12px}
.fem-lab-deep-links,.seo-media-resource-links{display:flex;flex-wrap:wrap;gap:11px;margin:25px 0}
.fem-lab-deep-links a{border:1px solid #71aeb2;border-radius:8px;color:#e7f9f5;padding:13px 16px;font-size:11px;font-weight:850;background:#214e5e}
.fem-lab-deep-links a:hover{background:#2b6c7c}
.seo-media-resource-links{padding:20px;margin:0 auto;max-width:1350px}
.seo-media-resource-links a{font-size:12px;font-weight:850;color:#267788;background:#e7f4f0;border-radius:5px;padding:12px 14px}
.seo-footer-business{display:inline-block;font-size:10px;text-decoration:underline;text-underline-offset:3px;color:#649aa6}
@media(max-width:720px){.seo-article .seo-reading .seo-part p{font-size:13px;line-height:1.85}.seo-article .seo-internal-toc,.seo-article .seo-related-links>div{grid-template-columns:1fr}.seo-article .seo-cover img{max-height:430px}.seo-footer-business{font-size:9px}}
''')
# Add page entries with alternate language mapping to existing image sitemap.
xml=root/'sitemap.xml'
content=xml.read_text()
for it,en,_,_ in pair:
 for link_lang in ('it','en'):
  slug=it if link_lang=='it' else en
  loc=BASE+slug+'/'
  assert '<loc>'+loc+'</loc>' not in content,'duplicate sitemap '+loc
  image='assets/real-d2/complex-frame-poster.webp' if slug.startswith('licenza-') or slug.endswith('-licensing') else ('assets/fem-lab/gallery/pushover-plastic-x-actual-solver.webp' if slug.startswith('analisi-') or 'pushover-ida' in slug else 'assets/fem-lab/gallery/stress-actual-solver.webp')
  entry='<url><loc>'+loc+'</loc><lastmod>2026-10-24</lastmod>'
  for code,target in [('it',BASE+it+'/'),('it-IT',BASE+it+'/'),('en',BASE+en+'/'),('en-GB',BASE+en+'/'),('x-default',BASE+en+'/')]:
   entry+='<xhtml:link rel="alternate" hreflang="'+code+'" href="'+target+'" />'
  entry+='<image:image><image:loc>'+BASE+image+'</image:loc></image:image></url>'
  content=content.replace('</urlset>',entry+'</urlset>',1)
ET.fromstring(content)
xml.write_text(content)
# IndexNow key is documented public proof of domain ownership, not an account
# password. Persist it for future URL submission rather than regenerating.
files=[x for x in root.iterdir() if re.fullmatch(r'[a-z0-9-]{32}\.txt',x.name) and x.is_file() and x.read_text().strip()==x.stem]
if files:
 print('INDEXNOW_REUSE',files[0].name)
else:
 key=secrets.token_hex(16)
 (root/(key+'.txt')).write_text(key)
 print('INDEXNOW_CREATED',key+'.txt')
print('SITEMAP_REGENERATED',len(ET.fromstring(xml.read_text())))
