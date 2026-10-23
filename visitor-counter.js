/* DÈLGHEM: real, server-persisted page-view count.
   No cookies, localStorage, synthetic initial values, or private API keys.
   Counts start when this integration is published. One page load = one view.
   Provider: countapi.mileshilliard.com; the shared key is public by design. */
(()=> {
  'use strict';
  const el=document.getElementById('visitor-counter-total');
  if(!el)return;
  // Keep test-site and production visits separate.
  const hostname=location.hostname.toLowerCase();
  const key=hostname==='delghe.com'||hostname==='www.delghe.com'
    ? 'delghe_com_pageviews_20261023'
    : hostname==='delghe3.github.io' ? 'delghem_github_preview_pageviews_20261023' : '';
  if(!key)return;
  const endpoint='https://countapi.mileshilliard.com/api/v1/hit/'+key;
  const controller=new AbortController();
  const cancel=setTimeout(()=>controller.abort(),8000);
  fetch(endpoint,{method:'GET',cache:'no-store',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal})
   .then(response=>{ if(!response.ok)throw new Error('Counter request failed'); return response.json(); })
   .then(data=>{ const count=Number(data.value); if(!Number.isSafeInteger(count)||count<0)throw new Error('Invalid counter value'); el.textContent=new Intl.NumberFormat(document.documentElement.lang||'it').format(count); })
   .catch(()=>{el.textContent='—';el.title=document.documentElement.lang==='en'?'Count temporarily unavailable':'Conteggio temporaneamente non disponibile';})
   .finally(()=>clearTimeout(cancel));
})();
