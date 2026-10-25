/** Source-backed DÈLGHEM D2 pile numerical responses and parameter-validated viscous law.
 * Device plots are constitutive illustrations, not building FEM time-histories.
 */
const engineeringRoot=document.getElementById('engineering-benchmarks');
if(engineeringRoot){
 const it=document.documentElement.lang==='it',$=id=>engineeringRoot.querySelector('#'+id);
 const NS='http://www.w3.org/2000/svg',f=(x,k=2)=>Number(x).toLocaleString(it?'it-IT':'en-GB',{maximumFractionDigits:k});
 const mk=(parent,tag,attrs={},title)=>{
  const n=document.createElementNS(NS,tag);
  Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));
  if(title!=null)n.textContent=String(title);
  parent.append(n);return n;
 };
 const L=103,R=863,T=40,B=375;
 const axes=(svg,{xmin=0,xmax=1,ymin=0,ymax=1,xlabel='',ylabel=''})=>{
  svg.replaceChildren();
  const x=v=>L+(v-xmin)*(R-L)/(xmax-xmin),y=v=>B-(v-ymin)*(B-T)/(ymax-ymin);
  for(let i=0;i<=5;i++){
   const tx=xmin+(xmax-xmin)*i/5,ty=ymin+(ymax-ymin)*i/5;
   mk(svg,'line',{x1:x(tx),x2:x(tx),y1:T,y2:B,stroke:'#d8e6e4','stroke-width':1});
   mk(svg,'line',{x1:L,x2:R,y1:y(ty),y2:y(ty),stroke:'#d8e6e4','stroke-width':1});
   mk(svg,'text',{x:x(tx),y:B+25,'text-anchor':'middle',fill:'#527781','font-size':12},f(tx,2));
   mk(svg,'text',{x:L-11,y:y(ty)+4,'text-anchor':'end',fill:'#527781','font-size':12},f(ty,2));
  }
  mk(svg,'path',{d:'M'+L+','+T+' V'+B+' H'+R,stroke:'#275d6c','stroke-width':2.2,fill:'none'});
  if(ymin<0&&ymax>0)mk(svg,'line',{x1:L,y1:y(0),x2:R,y2:y(0),stroke:'#5b9ba7','stroke-dasharray':'6 7'});
  if(xmin<0&&xmax>0)mk(svg,'line',{x1:x(0),y1:T,x2:x(0),y2:B,stroke:'#5b9ba7','stroke-dasharray':'6 7'});
  mk(svg,'text',{x:485,y:446,'text-anchor':'middle',fill:'#214b5d','font-size':15,'font-weight':750},xlabel);
  mk(svg,'text',{transform:'translate(22,207) rotate(-90)','text-anchor':'middle',fill:'#214b5d','font-size':15,'font-weight':750},ylabel);
  return {x,y};
 };
 const trace=(svg,pts,ax,color,width=3,fill=false)=>{
  const d=pts.map((p,i)=>(i?'L':'M')+ax.x(p.x).toFixed(2)+','+ax.y(p.y).toFixed(2)).join(' ');
  if(fill)mk(svg,'path',{d:d+'Z',fill:color,opacity:.16});
  mk(svg,'path',{d,stroke:color,'stroke-width':width,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'});
 };
 const marker=(svg,p,a,color,title)=>{
  const node=mk(svg,'circle',{cx:a.x(p.x),cy:a.y(p.y),r:7,fill:color,stroke:'#fff','stroke-width':2.4});
  mk(node,'title',{},title);
 };
 (async()=>{
  try{
   const response=await fetch(new URL('./assets/engineering/soil-piles-and-dampers.json',import.meta.url),{cache:'no-cache'});
   if(!response.ok)throw Error('D2 native source HTTP '+response.status);
   const data=await response.json();
   if(data.schema!=='delghem-d2-geo-and-viscous-benchmarks-1'||data.piles?.length!==2||
     data.devices?.length!==2||data.completeGeotechnicalVerification!==false||data.completeStructuralVerification!==false)
    throw Error('Source input/qualification mismatch');
   function renderPile(){
    const source=data.piles.find(p=>p.id===$('pile-soil-select').value);
    if(!source?.converged||Math.abs(source.residualKN)>1e-4)throw Error('Pile numerical equilibrium incomplete');
    const svg=$('pile-curve');
    const pts=[{x:0,y:0},...source.sampledCurve.map(p=>({x:p.settlementMM,y:p.reactionKN}))];
    const high=Math.max(800,...pts.map(p=>p.y));
    const a=axes(svg,{xmax:Math.ceil(pts.at(-1).x/2)*2,ymax:Math.ceil(high*1.15/200)*200,
     xlabel:it?'Cedimento del palo [mm]':'Pile settlement [mm]',ylabel:it?'Carico assiale [kN]':'Axial load [kN]'});
    trace(svg,pts,a,source.kind==='sand'?'#12839e':'#ae724e',4.3);
    const selected={x:source.headSettlementMM,y:700};
    mk(svg,'line',{x1:L,x2:a.x(selected.x),y1:a.y(700),y2:a.y(700),stroke:'#bb765e','stroke-dasharray':'5 6','stroke-width':1.5});
    marker(svg,selected,a,'#dc754e','N = 700 kN; w = '+f(selected.x)+' mm');
    mk(svg,'text',{x:Math.min(R-15,a.x(selected.x)+15),y:a.y(700)-18,
     fill:'#a75f48','font-size':13,'font-weight':840},'700 kN');
    $('pile-settlement').textContent=f(source.headSettlementMM)+' mm';
    $('pile-tip-load').textContent=f(source.tipReactionKN,1)+' kN';
    $('pile-shaft-load').textContent=f(source.shaftReactionKN,1)+' kN';
    engineeringRoot.querySelector('.eng-pile-card').dataset.chartReady='true';
   }
   function renderDamper(){
    const source=data.devices.find(p=>String(p.alpha)===$('damper-alpha-select').value);
    if(!source||source.energyPerCycleKNM<=0)throw Error('Invalid passive viscous device');
    const force=$('damper-velocity-curve');
    const fy=Math.ceil(Math.max(...source.velocityCurve.map(p=>Math.abs(p.forceKN)))*1.14/25)*25;
    const a=axes(force,{xmin:-.5,xmax:.5,ymin:-fy,ymax:fy,
     xlabel:it?'Velocità relativa [m/s]':'Relative velocity [m/s]',
     ylabel:it?'Forza viscosa [kN]':'Viscous force [kN]'});
    trace(force,source.velocityCurve.map(p=>({x:p.velocityMS,y:p.forceKN})),a,'#0f859d',4);
    marker(force,{x:0,y:0},a,'#cf7454','v = 0');
    const loop=$('damper-loop-curve'),cycle=source.cycle.map(p=>({x:p.displacementMM,y:p.forceKN}));
    const cy=Math.ceil(Math.max(...cycle.map(p=>Math.abs(p.y)))*1.18/25)*25;
    const b=axes(loop,{xmin:-32,xmax:32,ymin:-cy,ymax:cy,
     xlabel:it?'Spostamento [mm]':'Displacement [mm]',ylabel:it?'Forza [kN]':'Force [kN]'});
    trace(loop,cycle,b,'#db7a55',3.6,true);
    marker(loop,cycle[0],b,'#167b98','t = 0');
    $('damper-max-force').textContent=f(source.maxForceKN,1)+' kN';
    $('damper-energy').textContent=f(source.energyPerCycleKNM,2)+' kN·m';
    engineeringRoot.querySelector('.eng-device-card').dataset.chartReady='true';
   }
   $('pile-soil-select').addEventListener('change',renderPile);
   $('damper-alpha-select').addEventListener('change',renderDamper);
   renderPile();renderDamper();
   engineeringRoot.dataset.ready='true';
  }catch(error){engineeringRoot.dataset.ready='false';console.error('D2 numerical benchmark missing',error);}
 })();
}
