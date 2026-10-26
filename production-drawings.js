/**
 * DÈLGHEM engineering portfolio: two source-backed vector plates per
 * material. The original D2 CAD/DXF ZIP remains available separately.
 * No engineering result is recomputed by this viewer.
 */
const prefix=document.documentElement.lang==='it'?'../':'./';
const labels={rc:'C.A.',steel:'STEEL'};
for(const family of Object.keys(labels)){
 const panel=document.querySelector('.production-dossier--'+family);
 if(!panel)continue;
 const viewer=document.getElementById(family+'-composite-board');
 const visual=viewer?.querySelector('img');
 const code=document.getElementById(family+'-drawing-code');
 const buttons=[...panel.querySelectorAll('[data-tech-sheet="'+family+'"]')];
 if(!viewer||!visual||!code||buttons.length!==2)continue;
 for(const button of buttons){
  button.addEventListener('click',()=>{
   const name=button.dataset.techFile;
   const valid=family==='rc'?['delghem-rc-engineering-ga.svg','delghem-rc-reinforcement-schedule.svg']:
     ['delghem-steel-portal-detail.svg','delghem-steel-bolting-fabrication.svg'];
   if(!valid.includes(name))return;
   const path=prefix+'assets/technical-documents/'+name;
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   visual.src=path;
   viewer.href=path;
   code.textContent=button.dataset.techCode;
   visual.alt=family==='rc'?
     (document.documentElement.lang==='it'?'Tavola DÈLGHEM D2 di carpenteria/armatura con geometria e dettagli originali':'DÈLGHEM D2 RC technical sheet with source-based frame and reinforcement views'):
     (document.documentElement.lang==='it'?'Tavola DÈLGHEM D2 carpenteria metallica, nodi e bulloneria con quote di progetto':'DÈLGHEM D2 steel source-derived multi-view technical drawing and bolt group details');
  });
 }
}
