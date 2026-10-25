/**
 * Public publisher-authorized DÈLGHEM engineering banner kit.
 * Produces accessible copyable HTML that links to the real official site,
 * uses already-public image assets, and discloses sponsored/nofollow status.
 * No requests, trackers, remote publication or automated promotion.
 */
const cards=[...document.querySelectorAll('.banner-format-card')];
const example=document.querySelector('[name="banner-embed"]');
const status=document.getElementById('banner-copy-status');
const makeSnippet=(button)=>{
 const rel=button.dataset.bannerImage;
 const width=Number(button.dataset.bannerWidth),height=Number(button.dataset.bannerHeight);
 const language=button.dataset.bannerLang==='it'?'it':'en';
 if(!/^\/assets\/banners\/delghem-(?:leaderboard|billboard|rectangle|skyscraper|square)-(?:en|it)\.webp$/.test(rel)
 ||!Number.isInteger(width)||!Number.isInteger(height))return '';
 const site='https://www.delghe.com/'+(language==='it'?'it/':'');
 const asset='https://www.delghe.com'+rel;
 const alt=language==='it'
 ?'DÈLGHEM: software FEM nativo per Mac Apple Silicon, progetto vAlpha1 in sviluppo'
 :'DÈLGHEM: native Mac Apple Silicon FEM engineering, vAlpha1 in development';
 return '<a href="'+site+'" target="_blank" rel="sponsored nofollow noopener noreferrer">'+
 '<img src="'+asset+'" width="'+width+'" height="'+height+
 '" loading="lazy" decoding="async" alt="'+alt+'"></a>';
};
function choose(button){
 const snippet=makeSnippet(button);
 if(!snippet||!example)return '';
 example.value=snippet;
 example.dataset.banner=button.dataset.bannerImage;
 for(const card of cards)card.dataset.selected=String(card.contains(button));
 if(status)status.textContent=button.dataset.bannerLang==='it'
  ?'Codice HTML pronto da copiare. Pubblica solo dove autorizzato.'
  :'HTML snippet ready. Publish only where permitted.';
 return snippet;
}
for(const button of document.querySelectorAll('.banner-code-copy')){
 button.addEventListener('click',async()=>{
  const code=choose(button);
  if(!code)return;
  try{
   if(!navigator.clipboard?.writeText)throw Error('Browser clipboard is unavailable');
   await navigator.clipboard.writeText(code);
   if(status)status.textContent=button.dataset.bannerLang==='it'
    ?'Codice banner copiato. Ricorda di richiedere l’autorizzazione al sito ospitante.'
    :'Banner HTML copied. Please obtain publisher permission before embedding.';
  }catch{
   if(example){example.focus();example.select();}
   if(status)status.textContent=button.dataset.bannerLang==='it'
    ?'Seleziona e copia il codice nella casella qui sopra.'
    :'Select and copy the HTML shown above.';
  }
 });
}
if(cards.length)choose(cards[0].querySelector('.banner-code-copy'));
