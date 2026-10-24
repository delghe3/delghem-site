/* DÈLGHEM D2 FEM LAB: strictly visualizes the frozen real solver result export.
 * Distinct benchmark models: NO invented results, yield/collapse or fragility.
 * Uses browser Canvas2D and inline SVG only; no browser-specific WebGL dependency.
 */
const labRoot=document.getElementById('fem-lab');
if(labRoot){
  const it=document.documentElement.lang==='it';
  const $=id=>labRoot.querySelector('#'+id);
  const $$=s=>[...labRoot.querySelectorAll(s)];
  const fmt=(v,n=3)=>Number(v).toLocaleString(it?'it-IT':'en-GB',{maximumFractionDigits:n,minimumFractionDigits:0});
  const msg=(en,ita)=>it?ita:en;
  const labels={
    disp:msg('Control displacement [mm]','Spostamento nodo [mm]'),
    shear:msg('Base shear [kN]','Taglio alla base [kN]'),
    pga:msg('Input PGA [g]','PGA in ingresso [g]'),
    drift:msg('Peak drift [%]','Drift massimo [%]'),
    accel:msg('Acceleration [g]','Accelerazione [g]'),
    time:msg('Time [s]','Tempo [s]')
  };
  const NS='http://www.w3.org/2000/svg';
  const fields={vonMisesMPa:'σVM',sigma11MPa:'σ11',sigma22MPa:'σ22',tau12MPa:'τ12'};
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const palette=['#354cb2','#1b91c9','#3dbf9e','#f0d452','#ed8b38','#d54854'];
  function heat(x){
    const t=clamp(x,0,1)*(palette.length-1),i=Math.min(palette.length-2,Math.floor(t)),q=t-i;
    const a=palette[i].slice(1).match(/../g).map(v=>parseInt(v,16));
    const b=palette[i+1].slice(1).match(/../g).map(v=>parseInt(v,16));
    return 'rgb('+a.map((v,j)=>Math.round(lerp(v,b[j],q))).join(',')+')';
  }
  const formatAxis=v=>{
    if(!Number.isFinite(v))return '—';
    if(v===0)return '0';
    const a=Math.abs(v);
    if(a<.001)return v.toExponential(1);
    if(a<.1)return Number(v.toFixed(4)).toString();
    if(a<1)return Number(v.toFixed(3)).toString();
    if(a<10)return Number(v.toFixed(2)).toString();
    return Number(v.toFixed(1)).toString();
  };
  function svgNode(parent,tag,attrs={},value=''){
    const el=document.createElementNS(NS,tag);
    Object.entries(attrs).forEach(([name,v])=>el.setAttribute(name,String(v)));
    if(value)el.textContent=value;
    parent.append(el);return el;
  }
  function chartAxes(svg,xmax,ymin,ymax,xlabel,ylabel){
    svg.replaceChildren();
    const L=105,R=860,T=43,B=375,W=R-L,H=B-T;
    const xx=x=>L+x/Math.max(xmax,1e-12)*W;
    const yy=y=>B-(y-ymin)/Math.max(ymax-ymin,1e-12)*H;
    svgNode(svg,'rect',{x:0,y:0,width:900,height:470,fill:'transparent'});
    for(let i=0;i<=5;i++){
      const y=lerp(ymin,ymax,i/5),px=yy(y),x=xmax*i/5;
      svgNode(svg,'line',{x1:L,y1:px,x2:R,y2:px,stroke:'#a9c9c9','stroke-opacity':.68});
      svgNode(svg,'text',{x:L-16,y:px+4,'text-anchor':'end',fill:'#466a70','font-size':12},formatAxis(y));
      svgNode(svg,'line',{x1:xx(x),y1:T,x2:xx(x),y2:B,stroke:'#c8d9d6'});
      svgNode(svg,'text',{x:xx(x),y:B+25,'text-anchor':'middle',fill:'#466a70','font-size':12},formatAxis(x));
    }
    svgNode(svg,'line',{x1:L,y1:T,x2:L,y2:B,stroke:'#385f6a','stroke-width':2});
    svgNode(svg,'line',{x1:L,y1:B,x2:R,y2:B,stroke:'#385f6a','stroke-width':2});
    svgNode(svg,'text',{x:(L+R)/2,y:445,'text-anchor':'middle','font-size':15,'font-weight':750,fill:'#184957'},xlabel);
    svgNode(svg,'text',{transform:'translate(25,209) rotate(-90)','text-anchor':'middle','font-size':15,'font-weight':750,fill:'#184957'},ylabel);
    return {xx,yy,L,R,T,B};
  }
  function pointLine(svg,rows,xy,color,label){
    const points=rows.map(row=>[xy.xx(row.x),xy.yy(row.y),row]);
    svgNode(svg,'polyline',{points:points.map(x=>x[0]+','+x[1]).join(' '),fill:'none',stroke:color,'stroke-width':3.2,'stroke-linejoin':'round','stroke-linecap':'round'});
    points.forEach(([x,y,row])=>{
      const p=svgNode(svg,'circle',{cx:x,cy:y,r:5.2,fill:color,stroke:'#ffffff','stroke-width':2,tabindex:0,'aria-label':label+' '+formatAxis(row.x)+' / '+formatAxis(row.y)});
      svgNode(p,'title',{},label+' · '+formatAxis(row.x)+' / '+formatAxis(row.y));
    });
  }
  let data=null;
  const state={active:'stress',field:'vonMisesMPa',face:'top',yaw:-.54,pitch:.43,hovered:null,selected:null,drag:null};
  const stressCanvas=$('lab-stress-canvas');
  const ctx=stressCanvas.getContext('2d',{alpha:false});
  let cssWidth=1000,cssHeight=510,dpr=1,drawQueue=0,polys=[];
  function rotate(p,c){
    const x=p[0]-c[0],y=p[1]-c[1],z=p[2]-c[2];
    const cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);
    const u=x*cy-y*sy,v=x*sy+y*cy;
    return {x:u,y:v*sp-z*cp,depth:v*cp+z*sp};
  }
  const center=[1.05,1.05,1.5];
  function faceValue(element){
    const face=state.face,field=state.field;
    return element.gauss.reduce((sum,g)=>sum+g[face][field],0)/element.gauss.length;
  }
  function displayStress(){
    if(!ctx||!data)return;
    const canvas=stressCanvas,w=canvas.clientWidth,h=canvas.clientHeight;
    if(w<2||h<2)return;
    if(w!==cssWidth||h!==cssHeight||canvas.width!==Math.round(w*dpr)){
      cssWidth=w;cssHeight=h;dpr=Math.min(window.devicePixelRatio||1,w<460?1.3:1.65);
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle='#e7f3f1';ctx.fillRect(0,0,w,h);
    const measure=data.stress.elements;
    const values=measure.map(faceValue),min=Math.min(...values),max=Math.max(...values);
    $('lab-stress-min').textContent=formatAxis(min);
    $('lab-stress-max').textContent=formatAxis(max);
    const scale=Math.min(w/5.35,h/4.9)*1.05;
    polys=measure.map((el,i)=>{
      const vertices=el.vertices.map(p=>rotate(p,center));
      return {id:el.id,value:values[i],
        points:vertices.map(p=>({x:w*.51+p.x*scale,y:h*.515+p.y*scale})),
        depth:vertices.reduce((sum,p)=>sum+p.depth,0)/vertices.length};
    }).sort((a,b)=>b.depth-a.depth);
    ctx.strokeStyle='rgba(37,101,111,.15)';ctx.lineWidth=.9;
    for(let y=-2;y<=3;y++){ctx.beginPath();ctx.moveTo(0,h*.80+y*16);ctx.lineTo(w,h*.80+y*16);ctx.stroke();}
    for(const shape of polys){
      ctx.beginPath();shape.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      ctx.closePath();ctx.fillStyle=heat((shape.value-min)/(max-min||1));ctx.fill();
      const focus=shape.id===state.selected||shape.id===state.hovered;
      ctx.strokeStyle=focus?'#102e46':'rgba(22,64,81,.52)';ctx.lineWidth=focus?3.1:.65;ctx.stroke();
    }
    const chosen=measure.find(s=>s.id===state.selected);
    $('lab-stress-selected').textContent=chosen?.id??'—';
    $('lab-stress-readout').textContent=chosen
       ? fields[state.field]+' / '+(state.face==='top'?msg('top face','faccia superiore'):msg('bottom face','faccia inferiore'))+': '+fmt(faceValue(chosen),5)+' MPa · '+msg('4 Gauss points averaged for display','media di 4 punti di Gauss per la visualizzazione')
       :msg('Select a panel to inspect computed values.','Seleziona una piastra per leggere i valori calcolati.');
  }
  function scheduleStress(){
    if(drawQueue)return;
    drawQueue=requestAnimationFrame(()=>{drawQueue=0;displayStress();});
  }
  function insidePolygon(x,y,pts){
    let inside=false;
    for(let i=0,j=pts.length-1;i<pts.length;j=i++){
      const a=pts[i],b=pts[j];
      if(((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x))inside=!inside;
    }
    return inside;
  }
  function hit(e){
    const box=stressCanvas.getBoundingClientRect(),x=e.clientX-box.left,y=e.clientY-box.top;
    return [...polys].reverse().find(p=>insidePolygon(x,y,p.points))?.id??null;
  }
  if(stressCanvas&&ctx){
    stressCanvas.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      state.drag={x:e.clientX,y:e.clientY,yaw:state.yaw,pitch:state.pitch,moved:false};
      if(stressCanvas.setPointerCapture)stressCanvas.setPointerCapture(e.pointerId);
    });
    stressCanvas.addEventListener('pointermove',e=>{
      if(state.drag){
        const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;
        if(Math.hypot(dx,dy)>4)state.drag.moved=true;
        state.yaw=state.drag.yaw+dx*.011;state.pitch=clamp(state.drag.pitch+dy*.009,-.5,1.33);
        scheduleStress();
      }else{const h=hit(e);if(state.hovered!==h){state.hovered=h;scheduleStress();}}
    });
    stressCanvas.addEventListener('pointerup',e=>{
      if(state.drag&&!state.drag.moved){state.selected=hit(e);scheduleStress();}
      state.drag=null;
    });
    stressCanvas.addEventListener('pointercancel',()=>{state.drag=null;});
    stressCanvas.addEventListener('pointerleave',()=>{if(!state.drag){state.hovered=null;scheduleStress();}});
    stressCanvas.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;
      e.preventDefault();
      if(e.key==='Home'){state.yaw=-.54;state.pitch=.43;}
      else if(e.key==='ArrowLeft')state.yaw-=.15;
      else if(e.key==='ArrowRight')state.yaw+=.15;
      else if(e.key==='ArrowUp')state.pitch=clamp(state.pitch-.10,-.5,1.33);
      else state.pitch=clamp(state.pitch+.10,-.5,1.33);
      scheduleStress();
    });
  }
  $('lab-stress-field').addEventListener('change',e=>{state.field=e.target.value;scheduleStress();});
  $('lab-stress-face').addEventListener('change',e=>{state.face=e.target.value;scheduleStress();});
  function drawPushover(){
    const svg=$('lab-pushover-svg'),rows=data.pushover.points;
    $('lab-pushover-count').textContent=fmt(rows.length,0);
    const X=Math.max(...rows.map(p=>p.displacementMM))*1.13,Y=Math.max(...rows.map(p=>p.baseShearKN))*1.17;
    const axes=chartAxes(svg,X,0,Y,labels.disp,labels.shear);
    pointLine(svg,rows.map(p=>({x:p.displacementMM,y:p.baseShearKN})),axes,'#087d9e','Kratos elastic');
    svgNode(svg,'text',{x:axes.R-8,y:axes.T+13,'text-anchor':'end',fill:'#af683f','font-weight':800,'font-size':12},
      msg('ELASTIC RESPONSE · NOT PLASTIC CAPACITY','RISPOSTA ELASTICA · NON CAPACITÀ PLASTICA'));
  }
  function drawIDA(){
    const svg=$('lab-ida-svg'),rows=data.ida.records,
      runs=rows.flatMap(r=>r.runs);
    $('lab-ida-count').textContent=fmt(runs.length,0);
    const maxX=Math.max(...runs.map(r=>r.pgaG))*1.17,maxY=Math.max(...runs.map(r=>r.peakDriftPercent))*1.17;
    const axes=chartAxes(svg,maxX,0,maxY,labels.pga,labels.drift);
    rows.forEach((record,i)=>{
      pointLine(svg,record.runs.map(r=>({x:r.pgaG,y:r.peakDriftPercent})),axes,i?'#cc7248':'#087f9f',record.id);
    });
    svgNode(svg,'text',{x:axes.R-9,y:axes.T+10,'text-anchor':'end',fill:'#9b623a','font-size':12,'font-weight':800},
      msg('DIAGNOSTIC · NO COLLAPSE','DIAGNOSTICA · NESSUN COLLASSO'));
  }
  function drawAccelerogram(){
    const r=data.ida.records.find(r=>r.id===$('lab-record').value)??data.ida.records[0],
          factor=Number($('lab-scale').value),svg=$('lab-accelerograms-svg'),series=r.accelerogramG;
    const points=series.map((v,i)=>({x:i*r.dt,y:v*factor}));
    const peak=Math.max(...points.map(p=>Math.abs(p.y))),Y=Math.max(peak*1.2,1e-11);
    const axes=chartAxes(svg,(points.at(-1)?.x??1),-Y,Y,labels.time,labels.accel);
    pointLine(svg,points,axes,'#0e86a6',r.id);
    $('lab-accelerogram-pga').textContent=formatAxis(peak)+' g';
    $('lab-accelerogram-dt').textContent=fmt(r.dt,4)+' s';
    $('lab-accelerogram-samples').textContent=fmt(series.length,0);
  }
  $('lab-record').addEventListener('change',()=>{
    const r=data?.ida.records.find(x=>x.id===$('lab-record').value);if(!r)return;
    const select=$('lab-scale');select.replaceChildren();
    for(const run of r.runs){
      const op=document.createElement('option');op.value=String(run.scale);
      op.textContent=fmt(run.scale,3);select.append(op);
    }
    drawAccelerogram();
  });
  $('lab-scale').addEventListener('change',()=>{if(data)drawAccelerogram();});
  const tabs=$$('[data-lab-tab]');
  const activate=key=>{
    if(!['stress','pushover','ida','accelerograms'].includes(key))return;
    state.active=key;
    tabs.forEach(btn=>{
      const yes=btn.dataset.labTab===key;
      btn.setAttribute('aria-selected',String(yes));btn.tabIndex=yes?0:-1;
      const panel=$('lab-panel-'+btn.dataset.labTab);panel.hidden=!yes;
    });
    if(!data)return;
    if(key==='stress')scheduleStress();
    if(key==='pushover')drawPushover();
    if(key==='ida')drawIDA();
    if(key==='accelerograms')drawAccelerogram();
  };
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(tab.dataset.labTab));
    tab.addEventListener('keydown',e=>{
      const keys=['ArrowLeft','ArrowRight','Home','End'];
      if(!keys.includes(e.key))return;
      e.preventDefault();
      const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:
        (index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      activate(tabs[next].dataset.labTab);tabs[next].focus();
    });
  });
  if('ResizeObserver' in window){
    const obs=new ResizeObserver(()=>{if(state.active==='stress')scheduleStress();});
    obs.observe(stressCanvas);
  }else window.addEventListener('resize',scheduleStress,{passive:true});
  const pathname=new URL('./assets/fem-lab/actual-analysis-results.json',import.meta.url);
  fetch(pathname,{cache:'force-cache',credentials:'omit'}).then(resp=>{
    if(!resp.ok)throw Error('D2 data '+resp.status);return resp.json();
  }).then(result=>{
    if(result?.schema!=='delghem-fem-lab-data-1'||result.stress?.elements?.length!==128||
      result.ida?.records?.length!==2||result.pushover?.material!=='elastic'||result.ida.fragilityAvailable!==false)
      throw Error('Unexpected benchmark metadata');
    data=result;
    const record=$('lab-record'),scale=$('lab-scale');
    record.replaceChildren();
    result.ida.records.forEach(r=>{
      const o=document.createElement('option');o.value=r.id;o.textContent=r.id;record.append(o);
    });
    scale.replaceChildren();
    result.ida.records[0].runs.forEach(r=>{
      const o=document.createElement('option');o.value=String(r.scale);o.textContent=fmt(r.scale);scale.append(o);
    });
    activate(state.active);
  }).catch(error=>{
    console.error('DÈLGHEM FEM Lab source data unavailable:',error);
    $('lab-data-error').hidden=false;
  });
}
