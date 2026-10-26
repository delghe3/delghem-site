// Real DÈLGHEM A1 raster previews: selector only; underlying DXF files unchanged.
for(const container of document.querySelectorAll('#production-rc-tabs')){
 const zone=document.getElementById('production-drawings');
 const current=document.getElementById('rc-sheet-active-image');
 const link=document.getElementById('rc-sheet-a1-feature');
 if(!zone||!current||!link)continue;
 const buttons=[...container.querySelectorAll('[data-rc-sheet]')];
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const src=button.dataset.rcSrc;
  if(!/^\.{1,2}\/assets\/rc-drawings\/armature-d2-a1-0[1-5]\.webp$/.test(src))return;
  buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  link.href=src;
  current.src=src;
  const it=document.documentElement.lang==='it';
  current.alt=(it?'Tavola reale A1 armature DÈLGHEM D2 n. ':'Authentic DÈLGHEM D2 A1 RC reinforcement sheet no. ')+button.dataset.rcSheet;
 }));
}
