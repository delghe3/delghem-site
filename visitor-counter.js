/* DÈLGHEM: real, server-persisted page-view count.
   No cookies, localStorage, synthetic initial values, or private API keys.
   Counts start when this integration is published. One page load = one view.
   Provider: countapi.mileshilliard.com; the shared key is public by design. */
(()=> {
  'use strict';
  const el=document.getElementById('visitor-counter-total');
  if(!el)return;
  const endpoint='https://countapi.mileshilliard.com/api/v1/hit/delghe_com_pageviews_20261023';
  const controller=new AbortController();
  const cancel=setTimeout(()=>controller.abort(),8000);
  fetch(endpoint,{method:'GET',cache:'no-store',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal})
   .then(response=>{ if(!response.ok)throw new Error('Counter request failed'); return response.json(); })
   .then(data=>{ const count=Number(data.value); if(!Number.isSafeInteger(count)||count<0)throw new Error('Invalid counter value'); el.textContent=new Intl.NumberFormat(document.documentElement.lang||'it').format(count); })
   .catch(()=>{el.textContent='—';el.title=document.documentElement.lang==='en'?'Count temporarily unavailable':'Conteggio temporaneamente non disponibile';})
   .finally(()=>clearTimeout(cancel));
})();
