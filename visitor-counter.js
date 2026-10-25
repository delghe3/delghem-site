/* DÈLGHEM visitatori / visitors — owner-supplied baseline.
   User-requested displayed baseline: 122,300 on 25 October 2026; historical GET snapshot stays 2,671.
   Real counter reading at that transition (GET, no increment): 2,671.
   Increment is MAX(0, subsequent page-views - that snapshot).
   The counter is not a verified count of unique people. */
(() => {
  'use strict';
  const el=document.getElementById('visitor-counter-total');
  if(!el)return;
  const INITIAL_REPORTED_VISITS = 122300;
  const RECORDED_AT_BASELINE = 2671;
  const format=value=>new Intl.NumberFormat(document.documentElement.lang||'it').format(value);
  el.textContent=format(INITIAL_REPORTED_VISITS);
  const host=location.hostname.toLowerCase();
  if(host!=='www.delghe.com' && host!=='delghe.com')return;
  const controller=new AbortController();
  const cancel=setTimeout(()=>controller.abort(),8000);
  const endpoint='https://countapi.mileshilliard.com/api/v1/hit/delghe_com_pageviews_20261023';
  fetch(endpoint,{method:'GET',cache:'no-store',mode:'cors',credentials:'omit',
    referrerPolicy:'no-referrer',signal:controller.signal})
    .then(r=>{if(!r.ok)throw Error('Counter temporarily unavailable');return r.json()})
    .then(data=>{
      const count=Number(data.value);
      if(!Number.isSafeInteger(count)||count<0)throw Error('Invalid counter count');
      const newViews=Math.max(0,count - RECORDED_AT_BASELINE);
      el.textContent=format(INITIAL_REPORTED_VISITS + newViews);
      el.title=document.documentElement.lang==='it'
        ? 'Base di visite dichiarata: 122.300. Nuove visualizzazioni: '+format(newViews)
        : 'Owner-reported visit baseline: 122,300. New page views: '+format(newViews);
    })
    .catch(()=>{el.title=document.documentElement.lang==='it'
      ? 'Valore iniziale dichiarato; aggiornamento automatico temporaneamente non disponibile'
      : 'Reported baseline; live update temporarily unavailable'})
    .finally(()=>clearTimeout(cancel));
})();
