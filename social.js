// Opt-in sharing, real screenshot lightbox, and secure PayPal handoff.
// Never posts, tracks or processes payments automatically.
const lang=document.documentElement.lang==='en'?'en':'it';
const site=lang==='it'?'https://www.delghe.com/it/':'https://www.delghe.com/';
const title=lang==='it'
 ? 'DÈLGHEM — software FEM nativo per Mac Apple Silicon, alpha prevista gennaio 2027'
 : 'DÈLGHEM — native Apple Silicon structural FEM software, alpha planned January 2027';
const copy=async value=>{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return;}
  const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.left='-10000px';
  document.body.append(input);input.select();
  if(!document.execCommand('copy')){input.remove();throw new Error('Copy unavailable');}
  input.remove();
};
const say=(it,en)=>lang==='it'?it:en;
const status=document.getElementById('share-status');
const report=(message)=>{if(status)status.textContent=message;};
const encoded=encodeURIComponent;
const networks={
  linkedin:'https://www.linkedin.com/sharing/share-offsite/?url='+encoded(site),
  facebook:'https://www.facebook.com/sharer/sharer.php?u='+encoded(site),
  whatsapp:'https://api.whatsapp.com/send?text='+encoded(title+' '+site),
  twitter:'https://twitter.com/intent/tweet?text='+encoded(title)+'&url='+encoded(site)
};
document.querySelectorAll('[data-social]').forEach(link=>{
  const type=link.dataset.social;if(!networks[type])return;
  link.href=networks[type];link.target='_blank';link.rel='noopener noreferrer';
});
document.getElementById('share-native')?.addEventListener('click',async()=>{
  try{
    if(navigator.share){await navigator.share({title:'DÈLGHEM',text:title,url:site});}
    else{await copy(site);report(say('Link copiato: puoi condividerlo.','Link copied; ready to share.'));}
  }catch(error){if(error?.name!=='AbortError')report(say('Condivisione non disponibile.','Sharing unavailable.'));}
});
document.getElementById('share-copy')?.addEventListener('click',async()=>{
  try{await copy(site);report(say('Indirizzo del sito copiato.','Website address copied.'));}
  catch{report(say('Copia il link dalla barra degli indirizzi.','Copy the link from the address bar.'));}
});
document.getElementById('paypal-copy')?.addEventListener('click',async()=>{
  try{await copy('ildelghe3@gmail.com');}
  catch{ /* The recipient is printed directly beside this control. */ }
  const target=document.getElementById('paypal-copy-status');
  if(target)target.textContent=say('Destinatario: ildelghe3@gmail.com. Inseriscilo nel sito ufficiale PayPal.','Recipient: ildelghe3@gmail.com. Enter it on the official PayPal website.');
});
const photoDialog=document.getElementById('photo-dialog');
const photoImage=document.getElementById('photo-image');
const photoCaption=document.getElementById('photo-dialog-caption');
const photoReturn=[];
const photoButtons=[...document.querySelectorAll('[data-shot]')];
const filters=[...document.querySelectorAll('[data-gallery-filter]')];
const setFilter=filter=>{
  for(const button of filters)button.setAttribute('aria-pressed',String(button.dataset.galleryFilter===filter));
  let visible=0;
  for(const button of photoButtons){
    const show=filter==='all'||button.dataset.group===filter;
    button.hidden=!show;if(show)visible++;
  }
  const count=document.getElementById('screenshots-count');
  if(count)count.textContent=String(visible);
};
filters.forEach(button=>button.addEventListener('click',()=>setFilter(button.dataset.galleryFilter)));
photoButtons.forEach(button=>button.addEventListener('click',()=>{
  if(!photoDialog||!photoImage)return;
  const image=button.querySelector('img');
  const full=button.dataset.full;
  if(!full||!image)return;
  photoReturn.push(button);
  photoImage.src=full;photoImage.alt=image.alt;
  if(photoCaption)photoCaption.textContent=button.dataset.caption||image.alt;
  photoDialog.showModal();document.body.classList.add('photo-open');
}));
document.getElementById('photo-dialog-close')?.addEventListener('click',()=>photoDialog?.close());
photoDialog?.addEventListener('close',()=>{
  document.body.classList.remove('photo-open');
  photoImage.removeAttribute('src');
  photoReturn.pop()?.focus({preventScroll:true});
});
photoDialog?.addEventListener('click',event=>{
  if(event.target===photoDialog)photoDialog.close();
});
setFilter('all');
