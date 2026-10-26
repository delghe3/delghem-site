/**
 * DÈLGHEM source-backed material quantity preview.
 * Never merges reinforcement archive weights into the independent
 * mixed-frame demonstrator takeoff; no cost schedule is fabricated.
 */
const materialsRoot=document.getElementById('materials-takeoff');
if(materialsRoot){
 const it=document.documentElement.lang==='it';
 const t=(en,ital)=>it?ital:en;
 const nf=(x,n=2)=>Number(x).toLocaleString(it?'it-IT':'en-GB',{
  minimumFractionDigits:n,maximumFractionDigits:n});
 const panels=materialsRoot.querySelector('#materials-quantities');
 const totals=materialsRoot.querySelector('#materials-totals');
 const buttons=[...materialsRoot.querySelectorAll('[data-material-metric]')];
 const metric={
  lengthM:{unit:'m',title:t('Total member centreline length','Lunghezza assi aste')},
  volumeM3:{unit:'m³',title:t('Total member volume','Volume totale delle aste')},
  massKg:{unit:'kg',title:t('Total model-derived member mass','Massa totale delle aste')}
 };
 const source=it?'../assets/technical-documents/delghem-quantity-evidence.json':'./assets/technical-documents/delghem-quantity-evidence.json';
 const render=(data,field)=>{
  const values=data.groups.map(g=>Number(g[field]));
  const max=Math.max(1,...values);
  panels.replaceChildren();
  data.groups.forEach((g,i)=>{
   const row=document.createElement('div');row.className='materials-row';row.dataset.material=g.key;
   const label=document.createElement('div');label.className='materials-row-name';
   const strong=document.createElement('strong');strong.textContent=g.materialName;
   const small=document.createElement('small');
   small.textContent=nf(g.count,0)+' '+t('members','aste')+' / '+g.key;
   label.append(strong,small);
   const track=document.createElement('div');track.className='materials-row-track';
   const fill=document.createElement('div');fill.className='materials-row-fill';
   fill.style.width=(100*values[i]/max).toFixed(2)+'%';track.append(fill);
   const value=document.createElement('div');value.className='materials-row-value';
   value.textContent=nf(values[i])+' '+metric[field].unit;
   row.append(label,track,value);panels.append(row);
  });
  const total=data.groups.reduce((sum,g)=>sum+Number(g[field]),0);
  totals.replaceChildren();
  const span=document.createElement('span');span.textContent=metric[field].title;
  const strong=document.createElement('strong');strong.textContent=nf(total)+' '+metric[field].unit;
  totals.append(span,strong);
  materialsRoot.querySelector('#materials-rebar-weight').textContent=nf(data.rebarArchive.totalBarKg)+' kg';
  // Separate shell faces and quantities: do NOT add these to member totals.
  const shellTable=materialsRoot.querySelector('#materials-shell-table');
  if(shellTable&&data.shellGroups){
   shellTable.replaceChildren();
   data.shellGroups.forEach(g=>{
    const row=document.createElement('div');row.className='materials-shell-row';
    const name=document.createElement('strong');name.textContent=g.materialName;
    const measure=document.createElement('span');measure.textContent=nf(g.count,0)+' '+t('shells','shell')+' · '+nf(g.areaM2)+' m²';
    const volume=document.createElement('b');volume.textContent=nf(g.volumeM3)+' m³';
    row.append(name,measure,volume);shellTable.append(row);
   });
  }

  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.materialMetric===field)));
 };
 fetch(source).then(resp=>{if(!resp.ok)throw Error('Missing D2 source takeoff');return resp.json()})
 .then(data=>{
  if(data.schema!=='delghem-d2-demonstration-takeoff-v1')throw Error('Takeoff schema mismatch');
  if(data.modelCounts.members!==514||data.groups.length!==3)throw Error('Wrong model version');
  let selected='volumeM3';
  buttons.forEach(button=>button.addEventListener('click',()=>{
   selected=button.dataset.materialMetric;
   if(metric[selected])render(data,selected);
  }));
  render(data,selected);
 }).catch(()=>{
  panels.textContent=t('The model-derived quantity file could not be loaded. Original source download remains available.',
     'Il file delle quantità derivate dal modello non è disponibile. I dati originali restano scaricabili.');
  totals.textContent='—';
 });
}
