/**
 * Real native DÈLGHEM D2 EIGHT-storey tower + asymmetric annexes: RC core,
 * S355 steel frames, GL24h pitched roofs and DIRECT pad footings. Validated as EDITABLE model
 * by D2. Geotechnical / structural design has NOT been performed or certified.
 */
import {complexDemo} from './assets/real-d2/complex-demo-geometry.mjs?v=20261024-8floor-d2a';
import {showcaseModels} from './assets/real-d2/showcase-geometry.mjs?v=20261025-showcase15seo';
export const MODEL_SHOWCASE_DURATION_MS=5000;
const models=[complexDemo,...showcaseModels];
const towerShowcase={
 id:'eight-storey',titleIt:'Torre mista a otto piani',titleEn:'Eight-storey mixed tower',
 subtitleIt:'212 nodi · 514 aste · 24 plinti · struttura non verificata',
 subtitleEn:'212 nodes · 514 members · 24 pad footings · unverified concept',
 tagIt:'8 PIANI · S355 / C30/37 / GL24h',
 tagEn:'8 STOREYS · S355 / C30/37 / GL24h',
 materials:['S355','C30/37','GL24h']
};
const showcaseMeta=[towerShowcase,...showcaseModels];
let mixedDemo=complexDemo;
let mid=complexDemo.bbox.min.map((v,i)=>(v+complexDemo.bbox.max[i])/2);
let extent=complexDemo.bbox.max.map((v,i)=>v-complexDemo.bbox.min[i]);
let towerHeight=complexDemo.levels.at(-1);
let roofHeight=complexDemo.bbox.max[2];
let isTallConcept=complexDemo.storeyCount>=8;

// 360° in about 18.5 seconds, perceptible without abrupt motion.
export const DEFAULT_ORBIT_SPEED = 0.34;
const FRAME_INTERVAL=1000/19;

const TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Seven physically meaningful camera orientations. Pitch is allowed to pass
// over and under the structural model, for a genuine complete 360-degree orbit.
export const CAMERA_PRESETS=Object.freeze({
 iso:{yaw:-.92,pitch:.78},
 top:{yaw:-.68,pitch:Math.PI/2},
 bottom:{yaw:-.68,pitch:-Math.PI/2},
 front:{yaw:0,pitch:0},
 back:{yaw:Math.PI,pitch:0},
 left:{yaw:-Math.PI/2,pitch:0},
 right:{yaw:Math.PI/2,pitch:0}
});
export const normalizeAngle=value=>((value+Math.PI)%TAU+TAU)%TAU-Math.PI;

const plus=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const minus=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const times=(v,k)=>[v[0]*k,v[1]*k,v[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>times(v,1/(Math.hypot(...v)||1));
const light=norm([-.50,-.35,1.2]);
const colors={
  'steel-column':[23,85,168],
  'rc-column':[182,197,203],
  'main-beam':[27,155,211],
  'secondary-beam':[40,190,210],
  'brace':[244,109,70],
  'rc-wall':[168,182,195],
  'rc-floor':[100,197,219],
  'rc-roof':[100,205,207],
  'wood-deck':[218,174,103],
  'wood-roof':[246,178,90],
  'steel-roof':[92,185,222],
  'rc-balcony':[100,205,209],
  'rc-beam':[183,198,210],
  'rc-footing':[197,214,224],
  'foundation-tie':[130,169,192],
  'steel-truss':[58,100,234],
  'steel-purlin':[47,140,197],
  'cantilever':[20,174,217],
  'wood-post':[183,118,61],
  'wood-beam':[199,138,64],
  'wood-truss':[250,170,73],
  'wood-purlin':[253,199,110],
  'stadium-arch':[26,94,181],
  'stadium-bottom-chord':[26,124,187],
  'stadium-diagonal':[71,136,186],
  'stadium-web':[62,148,180],
  'stadium-purlin':[83,178,212],
  'stadium-roof':[116,198,220],
  'stadium-roof-brace':[237,131,64],
  'stadium-column-brace':[228,116,61],
  'stadium-winkler-grade-beam':[109,152,162],
  'stadium-ring-beam':[43,139,194],
  'football-pitch':[57,151,101],
  'arch-upper-rib':[22,86,161],
  'arch-lower-rib':[35,116,192],
  'arch-lattice':[64,143,214],
  'arch-web':[64,148,204],
  'arch-hanger':[232,140,59],
  'arch-transverse-tie':[66,176,198],
  'deck-tie':[28,98,174],
  'deck-crossbeam':[42,161,205],
  'deck-centre-girder':[75,167,208],
  'deck-lateral-brace':[216,117,62],
  'bridge-rail-post':[223,155,93],
  'bridge-rail':[222,174,112],
  'rc-bridge-deck':[161,204,210],
  'glulam-vault':[237,156,65],
  'glulam-bottom-chord':[194,117,54],
  'glulam-diagonal':[205,128,63],
  'glulam-web':[209,138,71],
  'glulam-purlin':[247,182,93],
  'glulam-secondary':[237,180,112],
  'glulam-roof':[235,194,138],
  'rc-terminal-mezzanine':[166,191,202],
  'terminal-mezzanine-beam':[30,132,204],
  'terminal-edge-beam':[42,158,206],
  'terminal-ring-beam':[65,151,198],
  'terminal-cantilever':[38,172,200],
  'terminal-steel-canopy':[129,203,213],
  'terminal-winkler-grade-beam':[107,157,173],
  // Historic aggregate: real structural masonry wall shell faces, with
  // openings absent from the native QUAD4 mesh; seven genuine timber roofs.
  'masonry-wall':[211,174,126],
  'stone-wall':[164,166,149],
  'timber-roof':[223,155,78],
  'timber-floor':[184,136,84],
  'timber-rafter':[204,124,63],
  'timber-purlin':[190,123,63],
  'timber-ridge':[164,91,45],
  'timber-tie':[179,114,66],
  'timber-king-post':[185,118,75],
  'timber-floor-joist':[173,108,55]
};

function crossSection(section){
  const {b,h,tw,tf}=section,B=b/2,H=h/2;
  if(section.material==='rc'||section.material==='wood'||section.shape==='rect'){
    // Real rectangular native D2 reinforced concrete and GL24h sections.
    return [[-B,-H],[B,-H],[B,H],[-B,H]];
  }
  const T=tw/2;
  // True HE and IPE flanges and web from the D2 catalog properties.
  return [[-B,-H],[B,-H],[B,-H+tf],[T,-H+tf],[T,H-tf],[B,H-tf],
    [B,H],[-B,H],[-B,H-tf],[-T,H-tf],[-T,-H+tf],[-B,-H+tf]];
}

// Solid I-profile faces use the exact D2 section dimensions and roll axis.
function makeGeometry(){
  const faces=[];
  for(const member of mixedDemo.members){
    const a=mixedDemo.nodes[member.a],b=mixedDemo.nodes[member.b];
    const axis=norm(minus(b,a));
    const roll=member.orientation??[0,1,0];
    let u=minus(roll,times(axis,dot(axis,roll)));
    if(Math.hypot(...u)<.005)u=cross(axis,[0,0,1]);
    if(Math.hypot(...u)<.005)u=[1,0,0];
    u=norm(u);
    const v=norm(cross(axis,u));
    const outline=crossSection(mixedDemo.sections[member.section]);
    const vertex=(p,node)=>plus(node,plus(times(u,p[0]),times(v,p[1])));
    const atA=outline.map(p=>vertex(p,a)),atB=outline.map(p=>vertex(p,b));
    for(let i=0;i<outline.length;i++){
      const k=(i+1)%outline.length;
      const vertices=[atA[i],atB[i],atB[k],atA[k]];
      const normal=norm(cross(minus(vertices[1],vertices[0]),minus(vertices[3],vertices[0])));
      faces.push({vertices,normal,kind:member.kind,side:i,height:(a[2]+b[2])/2});
    }
    faces.push({vertices:atA.slice().reverse(),normal:times(axis,-1),kind:member.kind,side:12,height:a[2]});
    faces.push({vertices:atB,normal:axis,kind:member.kind,side:13,height:b[2]});
  }
  // Concrete shear-wall and floor QUAD shells are present in the real,
  // DÈLGHEM-validated mixed .hfm.json model (not added as screen decoration).
  for(const shell of mixedDemo.shells){
    const corners=shell.nodes.map(i=>mixedDemo.nodes[i]);
    const n=norm(cross(minus(corners[1],corners[0]),minus(corners[3],corners[0])));
    const d=times(n,shell.thickness/2);
    const positive=corners.map(x=>plus(x,d)),negative=corners.map(x=>minus(x,d));
    const z=corners.reduce((sum,v)=>sum+v[2],0)/corners.length;
    faces.push({vertices:positive,normal:n,kind:shell.kind,side:30,height:z});
    faces.push({vertices:negative.slice().reverse(),normal:times(n,-1),kind:shell.kind,side:31,height:z});
    for(let i=0;i<4;i++){
      const k=(i+1)%4;
      const vertices=[positive[i],positive[k],negative[k],negative[i]];
      const normal=norm(cross(minus(vertices[1],vertices[0]),minus(vertices[3],vertices[0])));
      faces.push({vertices,normal,kind:shell.kind,side:32+i,height:z});
    }
  }
  // Foundations are not decorative: geometry comes from the D2
  // foundationSystem.items of type DIRECT and belongs to native support IDs.
  for(const footing of mixedDemo.footings){
    const {x,y,z,widthM,lengthM,thicknessM}=footing;
    const X=widthM/2,Y=lengthM/2,Z=thicknessM/2;
    const corners=[
      [x-X,y-Y,z-Z],[x+X,y-Y,z-Z],[x+X,y+Y,z-Z],[x-X,y+Y,z-Z],
      [x-X,y-Y,z+Z],[x+X,y-Y,z+Z],[x+X,y+Y,z+Z],[x-X,y+Y,z+Z]
    ];
    for(const indices of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){
      const vertices=indices.map(i=>corners[i]);
      const normal=norm(cross(minus(vertices[1],vertices[0]),minus(vertices[3],vertices[0])));
      faces.push({vertices,normal,kind:footing.kind,side:34,height:z});
    }
  }
  return faces;
}
let faces=makeGeometry();
const geometryCache=new Map([['eight-storey',faces]]);

export function initModelStage(){
  const canvas=document.getElementById('structure-canvas');
  if(!canvas||!canvas.getContext)return {setMotion(){},setView(){},destroy(){}};
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return {setMotion(){},setView(){},destroy(){}};
  const stage=canvas.closest('.structure-stage'),controls=[...document.querySelectorAll('[data-model-view]')];
  const italian=document.documentElement.lang==='it';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,dpr=1,scale=1,yaw=-.97,pitch=.72,mode='structure';
  let projectionMode='perspective',zoomFactor=1,cameraPreset='iso';
  let camera={cs:1,sn:0,cp:1,sp:0};
  let motion=false,visible=true,dragging=false,pointer=null,start=null,phase=0,last=0,raf=0,disposed=false;
  let modelIndex=0,slideElapsed=0,clockLast=0;
  const showcaseRoot=document.getElementById('model-showcase');
  const dots=[...document.querySelectorAll('[data-showcase-index]')];
  const counter=document.getElementById('model-showcase-counter');
  const headline=document.getElementById('model-showcase-title');
  const origin=document.querySelector('.model-origin');
  const modelLabel=document.querySelector('.model-concept-label');
  const pauseBtn=document.getElementById('model-showcase-pause');
  const modelMaterialKey=document.querySelector('.model-material-key');
  const cameraButtons=[...document.querySelectorAll('[data-model-camera]')];
  const cameraStatus=document.getElementById('model-view-readout');
  const projectionButton=document.getElementById('model-projection-toggle');
  const zoomLevel=document.getElementById('model-zoom-level');
  const foundationButton=document.getElementById('model-foundations-toggle');
  const cameraLabels=italian?{
    iso:'Assonometrica',top:'Dall’alto',bottom:'Dal basso',front:'Frontale',
    back:'Posteriore',left:'Laterale sinistra',right:'Laterale destra',
    free:'Orbita libera'
  }:{
    iso:'Isometric',top:'Top',bottom:'Underside',front:'Front',
    back:'Rear',left:'Left side',right:'Right side',free:'Free orbit'
  };
  function refreshCameraControls(){
    for(const b of cameraButtons){
      b.setAttribute('aria-pressed',String(cameraPreset===b.dataset.modelCamera));
    }
    if(cameraStatus)cameraStatus.textContent=mode==='foundations'
      ?(italian?'Fondazioni D2':'Native foundations')
      :(cameraLabels[cameraPreset]??cameraLabels.free);
    if(foundationButton){
      const supported=(mixedDemo.footings?.length??0)>0;
      foundationButton.disabled=!supported;
      foundationButton.hidden=!supported;
      foundationButton.setAttribute('aria-pressed',String(mode==='foundations'));
    }
    if(projectionButton){
      const orthographic=projectionMode==='orthographic';
      projectionButton.setAttribute('aria-pressed',String(orthographic));
      projectionButton.textContent=orthographic?'ORTO':'PROSP';
      projectionButton.title=italian
        ?(orthographic?'Proiezione ortogonale — attiva prospettica':'Proiezione prospettica — attiva ortogonale')
        :(orthographic?'Orthographic projection — switch to perspective':'Perspective projection — switch to orthographic');
    }
    if(zoomLevel)zoomLevel.textContent=Math.round(zoomFactor*100)+'%';
    stage.dataset.cameraYaw=String(Number(normalizeAngle(yaw).toFixed(4)));
    stage.dataset.cameraPitch=String(Number(normalizeAngle(pitch).toFixed(4)));
    stage.dataset.cameraPreset=cameraPreset;
    stage.dataset.projection=projectionMode;
    stage.dataset.zoom=String(Number(zoomFactor.toFixed(3)));
  }
  function pauseForInteraction(){
    if(!carouselPaused&&!carouselReducedMotion){
      carouselPaused=true;
      refreshShowcase();
    }
    const rotate=document.getElementById('rotate-model');
    if(rotate?.getAttribute('aria-pressed')==='true'&&!rotate.disabled){
      rotate.click(); // use application's own state handler to keep UI in sync
    }
  }
  function setCameraView(view,{interactive=true}={}){
    if(!Object.hasOwn(CAMERA_PRESETS,view))return;
    const target=CAMERA_PRESETS[view];
    yaw=view==='iso'?[-.97,-.77,-.94,-.88,-.74][modelIndex]:target.yaw;
    pitch=view==='iso'?[.76,.80,.66,.79,.78][modelIndex]:target.pitch;
    cameraPreset=view;
    if(interactive)pauseForInteraction();
    refreshCameraControls();
    render();
  }
  function toggleFoundations(){
    if(!(mixedDemo.footings?.length>0))return;
    mode=mode==='foundations'?'structure':'foundations';
    legend.hidden=true;
    controls.forEach(b=>b.setAttribute('aria-pressed',
      String(mode==='structure'&&b.dataset.modelView==='structure')));
    pauseForInteraction();
    refreshCameraControls();
    resize(); // camera framing accounts for foundation-only extents
  }
  function changeZoom(factor,{interactive=true}={}){
    zoomFactor=clamp(zoomFactor*factor,.53,2.8);
    if(interactive)pauseForInteraction();
    refreshCameraControls();
    resize();
  }

  let carouselReducedMotion=reduced.matches;
  let carouselPaused=carouselReducedMotion;
  const titleFor=meta=>italian?meta.titleIt:meta.titleEn;
  foundationButton?.addEventListener('click',toggleFoundations);
  cameraButtons.forEach(b=>b.addEventListener('click',()=>setCameraView(b.dataset.modelCamera)));
  document.getElementById('model-zoom-in')?.addEventListener('click',()=>changeZoom(1.2));
  document.getElementById('model-zoom-out')?.addEventListener('click',()=>changeZoom(1/1.2));
  projectionButton?.addEventListener('click',()=>{
    projectionMode=projectionMode==='perspective'?'orthographic':'perspective';
    pauseForInteraction();refreshCameraControls();render();
  });

  const detailFor=meta=>italian?meta.subtitleIt:meta.subtitleEn;
  function progressUI(){
    const ratio=clamp(slideElapsed/MODEL_SHOWCASE_DURATION_MS,0,1);
    for(const button of dots){
      const key=Number(button.dataset.showcaseIndex);
      const selected=key===modelIndex;
      button.setAttribute('aria-current',String(selected));
      const fill=button.querySelector('.model-showcase-fill');
      if(fill)fill.style.transform='scaleX('+(selected?ratio:0)+')';
    }
  }
  function refreshShowcase(){
    const meta=showcaseMeta[modelIndex],source=models[modelIndex];
    stage.dataset.modelIndex=String(modelIndex);
    stage.dataset.modelId=meta.id;
    if(counter)counter.textContent=String(modelIndex+1).padStart(2,'0')+' / '+String(models.length).padStart(2,'0');
    if(headline){headline.textContent=titleFor(meta);headline.title=titleFor(meta);}
    if(origin)origin.textContent=detailFor(meta);
    if(modelLabel)modelLabel.textContent=modelIndex===0
       ?(italian?towerShowcase.tagIt:towerShowcase.tagEn)
       :modelIndex===1
       ?(italian?'COPERTURA · 114 × 84 M':'FOOTBALL ROOF · 114 × 84 M')
       :modelIndex===2
       ?(italian?'PONTE AD ARCO · LUCE 96 M':'TIED-ARCH BRIDGE · 96 M')
       :modelIndex===3
       ?(italian?'VOLTE GL24h · 84 × 54 M':'GLULAM VAULTS · 84 × 54 M')
       :(italian?'AGGREGATO IN MURATURA · 90 × 60 M':'MASONRY AGGREGATE · 90 × 60 M');
    if(modelMaterialKey){
      const materials=new Set(source.materials);
      modelMaterialKey.setAttribute('aria-label',
        (italian?'Materiali effettivi del modello: ':'Model source materials: ')+[...materials].join(', '));
      for(const label of modelMaterialKey.querySelectorAll('span')){
        const grade=label.textContent.trim();
        label.hidden=!materials.has(grade);
      }
    }
    if(pauseBtn){
      pauseBtn.setAttribute('aria-pressed',String(carouselPaused));
      pauseBtn.textContent=carouselPaused?'▶':'Ⅱ';
      const label=carouselReducedMotion
        ?(italian?'Avanzamento manuale: movimento ridotto':'Manual navigation: reduced motion')
        :carouselPaused?(italian?'Riprendi la sequenza':'Resume slideshow')
         :(italian?'Metti in pausa la sequenza':'Pause slideshow');
      pauseBtn.title=label;pauseBtn.setAttribute('aria-label',label);
      pauseBtn.disabled=carouselReducedMotion;
    }
    progressUI();
  }
  function setModelIndex(next){
    const count=models.length;
    if(!Number.isFinite(Number(next)))return;
    const target=((Math.trunc(Number(next))%count)+count)%count;
    modelIndex=target;
    const nextModel=models[target];
    // Each new specimen begins in its honest native geometry, not in a
    // qualitative "deformed" or "forces" view inherited from a prior slide.
    mode='structure';
    legend.hidden=true;
    controls.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.modelView==='structure')));
    mixedDemo=nextModel;
    mid=mixedDemo.bbox.min.map((v,i)=>(v+mixedDemo.bbox.max[i])/2);
    extent=mixedDemo.bbox.max.map((v,i)=>v-mixedDemo.bbox.min[i]);
    towerHeight=nextModel.levels?.at(-1)??Math.max(1,extent[2]);
    roofHeight=mixedDemo.bbox.max[2];
    isTallConcept=target===0&&nextModel.storeyCount>=8;
    yaw=[-.97,-.77,-.94,-.88,-.74][target]??-.97;
    pitch=[.76,.80,.66,.79,.78][target]??.76;
    cameraPreset='iso';zoomFactor=1;
    const key=showcaseMeta[target].id;
    if(!geometryCache.has(key))geometryCache.set(key,makeGeometry());
    faces=geometryCache.get(key);
    slideElapsed=0;
    clockLast=0;
    refreshShowcase();refreshCameraControls();
    resize();
  }
  dots.forEach(b=>b.addEventListener('click',()=>setModelIndex(b.dataset.showcaseIndex)));
  document.getElementById('model-showcase-prev')?.addEventListener('click',()=>setModelIndex(modelIndex-1));
  document.getElementById('model-showcase-next')?.addEventListener('click',()=>setModelIndex(modelIndex+1));
  pauseBtn?.addEventListener('click',()=>{
    if(carouselReducedMotion)return;
    carouselPaused=!carouselPaused;
    clockLast=0;
    refreshShowcase();schedule();
  });

  canvas.style.touchAction='none'; // unrestricted mouse, touch and stylus 3D orbit
  canvas.tabIndex=0;
  const legend=document.createElement('div');
  legend.className='model-legend';legend.hidden=true;
  legend.innerHTML=italian
    ? '<strong class="legend-head">COLORI ILLUSTRATIVI</strong><div class="legend-gradient"></div><div class="legend-ends"><span>QUALITATIVO</span><span>NON CALCOLATO</span></div><small>Nessuna sollecitazione FEM calcolata</small>'
    : '<strong class="legend-head">ILLUSTRATIVE COLORS</strong><div class="legend-gradient"></div><div class="legend-ends"><span>QUALITATIVE</span><span>NOT COMPUTED</span></div><small>No computed FEM forces</small>';
  stage.append(legend);

  function displaced(p){
    if(mode!=='deformed')return p;
    const z=clamp(p[2]/Math.max(1,towerHeight),0,1),k=z*z;
    return [p[0]+k*(.55+.04*Math.sin(phase+p[1]*.1)),
      p[1]+k*(.15+.03*Math.cos(phase+p[0]*.1)),p[2]];
  }
  function project(p,original=false){
    const q=original?p:displaced(p);
    const x=q[0]-mid[0],y=q[1]-mid[1],z=q[2]-(mode==='foundations'?0:mid[2]);
    const {cs,sn,cp,sp}=camera;
    const xx=x*cs-y*sn;
    // Real 3D camera direction: +pitch views the structure FROM ABOVE,
    // -pitch views FROM BELOW. depth>0 denotes farther geometry, so the
    // painter's descending depth order correctly exposes roof faces.
    const depth=(x*sn+y*cs)*cp-z*sp;
    const yy=(x*sn+y*cs)*sp-z*cp;
    const radius=Math.max(1,Math.hypot(...extent));
    const persp=projectionMode==='orthographic'?1:clamp(1-depth/(radius*2.5),.69,1.32);
    const centering=mode==='foundations'?.35:modelIndex===4?.43:modelIndex===1?.43:modelIndex===2?.42:.52;
    return {x:width*.50+xx*scale*persp,y:height*centering+yy*scale*persp,depth};
  }
  function poly(points,color,border='rgba(18,54,66,.12)'){
    ctx.beginPath();
    points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fillStyle=color;ctx.fill();
    if(border){
      ctx.lineWidth=.45;ctx.strokeStyle=border;ctx.stroke();
    }
  }
  function rgba(color,k,alpha=1){
    const values=color.map(v=>Math.round(clamp(v*k,0,255)));
    return 'rgba('+values.join(',')+','+alpha+')';
  }
  function drawBackdrop(){
    const bg=ctx.createRadialGradient(width*.54,height*.39,8,width*.51,height*.44,Math.max(width,height)*.72);
    bg.addColorStop(0,'rgba(141,202,198,.14)');
    bg.addColorStop(1,'rgba(225,239,238,0)');
    ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='rgba(42,93,115,.12)';ctx.lineWidth=.85;
    for(const x of mixedDemo.gridX){
      const a=project([x,mixedDemo.bbox.min[1]-1,0],true),b=project([x,mixedDemo.bbox.max[1]+1,0],true);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    for(const y of mixedDemo.gridY){
      const a=project([mixedDemo.bbox.min[0]-1,y,0],true),b=project([mixedDemo.bbox.max[0]+1,y,0],true);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
  function drawGhost(){
    if(mode!=='deformed')return;
    ctx.strokeStyle='rgba(42,78,91,.2)';ctx.lineWidth=1.2;
    for(const member of mixedDemo.members){
      const a=project(mixedDemo.nodes[member.a],true);
      const b=project(mixedDemo.nodes[member.b],true);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
  // Nonstructural playing-surface FINISH lines, laid over the actual native
  // on-grade slab (105 × 68 m). These white paint markings are never claimed
  // as FEM elements or computed structural results.
  function paintFootballMarkings(){
    if(modelIndex!==1||mode!=='structure')return;
    const Z=.11,plot=(x,y)=>project([x,y,Z],true);
    const path=(points,close=false)=>{
      ctx.beginPath();
      points.forEach(([x,y],i)=>{
        const p=plot(x,y);
        if(i===0)ctx.moveTo(p.x,p.y);
        else ctx.lineTo(p.x,p.y);
      });
      if(close)ctx.closePath();
      ctx.stroke();
    };
    ctx.save();
    ctx.strokeStyle='rgba(248,255,246,.93)';
    ctx.lineWidth=Math.max(1.05,Math.min(2.2,width/450));
    ctx.lineCap='round';
    path([[-52.5,-34],[52.5,-34],[52.5,34],[-52.5,34]],true);
    path([[0,-34],[0,34]]);
    const circle=Array.from({length:49},(_,i)=>{
      const a=i*Math.PI*2/48;
      return [9.15*Math.cos(a),9.15*Math.sin(a)];
    });
    path(circle,true);
    for(const side of [-1,1]){
      const x0=side*52.5,x1=side*(52.5-16.5),x2=side*(52.5-5.5);
      path([[x0,-20.16],[x1,-20.16],[x1,20.16],[x0,20.16]]);
      path([[x0,-9.16],[x2,-9.16],[x2,9.16],[x0,9.16]]);
      const penalty=plot(side*(52.5-11),0);
      ctx.fillStyle='rgba(248,255,246,.93)';
      ctx.beginPath();ctx.arc(penalty.x,penalty.y,Math.max(1.3,width/500),0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function paintFaces(){
    // The masonry aggregate is deliberately opaque and architectural. Draw
    // only outward-facing QUAD4 masonry/wood panels so hidden wall backs and
    // floor undersides do not wash out the roofs and window openings.
    // Other four native D2 models preserve their established drawing order.
    const near=modelIndex===4?[-camera.sn*camera.cp,-camera.cs*camera.cp,camera.sp]:null;
    const solidKinds=new Set(['masonry-wall','stone-wall','timber-roof','timber-floor']);
    const foundationKinds=new Set([
      'rc-footing','foundation-tie','stadium-winkler-grade-beam','terminal-winkler-grade-beam'
    ]);
    const sourceFaces=mode==='foundations'
      ?faces.filter(face=>foundationKinds.has(face.kind)):faces;
    const selected=near?sourceFaces.filter(face=>!solidKinds.has(face.kind)||dot(face.normal,near)>=-.001):sourceFaces;
    // Depth-sort faces rather than overpainting member centerlines: real I flanges/web are visible.
    const projected=selected.map(face=>{
      const points=face.vertices.map(p=>project(p));
      return {face,points,depth:points.reduce((sum,p)=>sum+p.depth,0)/points.length};
    }).sort((a,b)=>{
      // The green football pitch is an actual on-grade QUAD4 panel.
      // Always draw it BEHIND the steel canopy rather than painting it
      // across the roof. Footer pedestals likewise remain below the shell.
      // Do not alter sorting of the original eight-storey D2 model.
      if(modelIndex!==0){
        const priority=x=>x.face.kind==='football-pitch'?-2:
          x.face.kind==='rc-footing'?-1:0;
        const delta=priority(a)-priority(b);
        if(delta)return delta;
      }
      return b.depth-a.depth;
    });
    let pitchMarked=false;
    for(const item of projected){
      if(modelIndex===1&&!pitchMarked&&item.face.kind!=='football-pitch'){
        paintFootballMarkings();
        pitchMarked=true;
      }
      const {face,points}=item;
      const lighting=clamp(.78+dot(face.normal,light)*.25,.48,1.10);
      const base=colors[face.kind]??colors.primary;
      let pigment=base;
      if(mode==='forces'&&face.kind!=='rc-floor'&&face.kind!=='rc-wall'){
        // Qualitative gradient only: NOT calculated forces or a solver result.
        const heightRatio=clamp(face.height/Math.max(1,roofHeight),0,1);
        pigment=[Math.round(30+173*heightRatio),Math.round(128+19*Math.sin(heightRatio*Math.PI)),Math.round(203-122*heightRatio)];
      }
      // Semi-transparent concrete floors expose the contrasting structural skeleton.
      const opacity=['rc-floor','rc-roof','rc-balcony','rc-bridge-deck','rc-terminal-mezzanine'].includes(face.kind)?.22:
        face.kind==='football-pitch'?.86:
        face.kind==='stadium-roof'?.22:
        face.kind==='glulam-roof'?.48:
        face.kind==='terminal-steel-canopy'?.26:
        face.kind==='wood-roof'?.64:face.kind==='wood-deck'?.28:
        face.kind==='steel-roof'?.43:
        face.kind==='timber-roof'?.64:
        face.kind==='timber-floor'?.22:
        ['masonry-wall','stone-wall'].includes(face.kind)?.93:
        face.kind==='rc-wall'?.74:1;
      const border=['rc-floor','rc-roof','rc-balcony','wood-deck','wood-roof','steel-roof','stadium-roof','glulam-roof','football-pitch','rc-bridge-deck','terminal-steel-canopy','rc-terminal-mezzanine','timber-roof','timber-floor','masonry-wall','stone-wall'].includes(face.kind)?'rgba(39,95,123,.23)':'rgba(22,49,70,.23)';
      poly(points,rgba(pigment,lighting,opacity),border);
    }
  }
  // The two pinned and two rolling boundary supports are ACTUAL native D2
  // endpoint node constraints. These are only standard FEM glyphs showing the
  // fixed/free DOFs, never hidden decorative piers under the deck.
  function paintBridgeBearings(){
    if(modelIndex!==2||mode!=='structure'||!mixedDemo.supports?.length)return;
    ctx.save();
    for(const support of mixedDemo.supports){
      const p=project([support.x,support.y,support.z],true);
      const s=clamp(width/67,7,12);
      ctx.strokeStyle='#214c5f';
      ctx.fillStyle=support.kind==='hinge'?'#f5a36b':'#a7dce7';
      ctx.lineWidth=1.8;
      ctx.beginPath();
      ctx.moveTo(p.x,p.y+2);
      ctx.lineTo(p.x-s,p.y+s*1.28);
      ctx.lineTo(p.x+s,p.y+s*1.28);
      ctx.closePath();ctx.fill();ctx.stroke();
      if(support.kind==='roller'){
        for(const offset of [-s*.42,s*.42]){
          ctx.beginPath();
          ctx.arc(p.x+offset,p.y+s*1.58,s*.22,0,Math.PI*2);
          ctx.fillStyle='#eaf6f4';ctx.fill();ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.moveTo(p.x-s*1.24,p.y+s*(support.kind==='hinge'?1.42:1.95));
      ctx.lineTo(p.x+s*1.24,p.y+s*(support.kind==='hinge'?1.42:1.95));
      ctx.strokeStyle='#527883';ctx.stroke();
      ctx.font='850 '+Math.max(8,Math.min(10,width/110))+'px system-ui';
      ctx.textAlign='center';
      ctx.fillStyle=support.kind==='hinge'?'#98583a':'#2b7b97';
      ctx.fillText(support.kind==='hinge'?(italian?'CERNIERA':'PIN'):
       (italian?'CARRELLO':'ROLLER'),
       p.x,p.y+s*(support.kind==='hinge'?2.85:3.3));
    }
    ctx.restore();
  }
  function axisTriad(){
    const x=38,y=height-49,origin=mid;
    const pivot=project(origin,true);
    // Project the global basis with the very same camera as the structural model.
    for(const [vector,color,label] of [
      [[1,0,0],'#b96b50','X'],[[0,1,0],'#367da7','Y'],[[0,0,1],'#39977d','Z']
    ]){
      const end=project(plus(origin,vector),true);
      const length=26/(Math.hypot(end.x-pivot.x,end.y-pivot.y)||1);
      const dx=(end.x-pivot.x)*length,dy=(end.y-pivot.y)*length;
      ctx.strokeStyle=color;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);ctx.stroke();
      ctx.fillStyle=color;ctx.font='700 10px system-ui';ctx.fillText(label,x+dx+4,y+dy);
    }
  }
  function labels(){
    ctx.textAlign='left';ctx.fillStyle='rgba(29,76,93,.83)';
    ctx.font='700 10px Manrope,system-ui,sans-serif';
    if(width>480)ctx.fillText(modelIndex===0
      ?'DÈLGHEM D2 · '+complexDemo.storeyCount+' STOREYS · C30/37 / S355 / GL24h'
      :'DÈLGHEM D2 · '+showcaseMeta[modelIndex].id.toUpperCase().replaceAll('-',' '),
      Math.max(15,width*.045),height*.10);
  }
  function render(){
    if(disposed||width<2||height<2)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    camera={cs:Math.cos(yaw),sn:Math.sin(yaw),cp:Math.cos(pitch),sp:Math.sin(pitch)};
    drawBackdrop();drawGhost();paintFaces();paintBridgeBearings();axisTriad();
    stage.classList.add('model-ready');
  }
  function resize(){
    const r=canvas.getBoundingClientRect();
    width=Math.max(1,r.width);height=Math.max(1,r.height);
    dpr=Math.min(window.devicePixelRatio||1,width<480?1.4:1.8);
    canvas.width=Math.max(1,Math.round(width*dpr));
    canvas.height=Math.max(1,Math.round(height*dpr));
    // Fit the native D2 model bounding volume through a 360-degree camera orbit.
    const orbitDiameter=Math.hypot(extent[0],extent[1]);
    scale=Math.min(width/(orbitDiameter*1.13),height/(orbitDiameter*.68+extent[2]*.78));
    if(modelIndex===4)scale*=.78; // seven actual masonry volumes and their courtyard
    if(modelIndex===1)scale*=.79; // 114x84 m stadium: keep edges above carousel controls
    if(modelIndex===2)scale*=.73; // 96 m bridge: both bearings and the complete arch visible above controls
    if(mode==='foundations')scale*=.68; // entire pad/grade-beam network stays above the bottom controls
    scale*=zoomFactor;
    render();
  }
  // One clock drives the 5-second slideshow and the existing 3D orbit.
  // When the hero is offscreen or the page is backgrounded, BOTH pause.
  // A manual "stop rotating" click does NOT stop the slideshow.
  function tick(timestamp){
    raf=0;
    // Some embedded browsers deliver reduced-motion change events only after
    // a further media update. A running frame therefore rechecks the actual
    // preference before displaying or advancing the next animation.
    if(reduced.matches!==carouselReducedMotion){
      carouselReducedMotion=reduced.matches;
      carouselPaused=carouselReducedMotion;
      refreshShowcase();
    }
    if(disposed||!visible||document.hidden||reduced.matches){clockLast=0;last=0;return;}
    if(!clockLast)clockLast=timestamp;
    const dtMs=Math.min(100,Math.max(0,timestamp-clockLast));
    clockLast=timestamp;
    if(!carouselPaused&&!dragging){
      slideElapsed+=dtMs;
      if(slideElapsed>=MODEL_SHOWCASE_DURATION_MS){
        setModelIndex(modelIndex+1);
        clockLast=timestamp;
      }
      progressUI();
    }
    if(motion){
      if(!last)last=timestamp;
      const elapsed=timestamp-last;
      if(elapsed>=FRAME_INTERVAL*(width<480?1.27:1)){
        const dt=Math.min(.10,elapsed/1000);
        last=timestamp;
        if(!dragging)yaw=normalizeAngle(yaw+dt*DEFAULT_ORBIT_SPEED);
        phase+=dt;
        render();
      }
    }else last=0;
    if(motion||!carouselPaused)raf=requestAnimationFrame(tick);
  }
  function schedule(){
    if(disposed||raf||!visible||document.hidden||reduced.matches)return;
    if(!motion&&carouselPaused)return;
    clockLast=0;last=0;raf=requestAnimationFrame(tick);
  }
  function setMotion(value){
    motion=!!value;
    if(motion||!carouselPaused)schedule();
    else if(raf){cancelAnimationFrame(raf);raf=0;render();}
  }
  function setView(next){
    if(!['structure','deformed','forces'].includes(next))return;
    mode=next;legend.hidden=next!=='forces';
    controls.forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.modelView===next)));
    refreshCameraControls();
    resize(); // restore stage framing when exiting isolated foundation view
  }
  controls.forEach(c=>c.addEventListener('click',()=>setView(c.dataset.modelView)));
  // Pointer capture allows an arbitrarily long true 360 degree rotation in
  // both azimuth and elevation; two touch pointers additionally pinch-zoom.
  // No old +/-0.05 ... 0.95 elevation clamp: underside and top are reachable.
  const pointers=new Map();
  let pinchStartDistance=0,pinchStartZoom=1;
  const pointDistance=()=>{
    const values=[...pointers.values()];
    return values.length<2?0:Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);
  };
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    pauseForInteraction();
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    dragging=true;
    pointer=e.pointerId;
    if(pointers.size===1)start={x:e.clientX,y:e.clientY,yaw,pitch};
    if(pointers.size===2){
      pinchStartDistance=Math.max(1,pointDistance());
      pinchStartZoom=zoomFactor;
      start=null;
    }
    try{canvas.setPointerCapture(e.pointerId);}catch(_){}
    canvas.focus({preventScroll:true});
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size>=2){
      zoomFactor=clamp(pinchStartZoom*(pointDistance()/pinchStartDistance),.53,2.8);
      refreshCameraControls();resize();
      return;
    }
    if(!dragging||!start)return;
    yaw=normalizeAngle(start.yaw+(e.clientX-start.x)*.009);
    pitch=normalizeAngle(start.pitch+(e.clientY-start.y)*.009);
    cameraPreset='free';
    refreshCameraControls();render();
  });
  const stop=e=>{
    if(!pointers.has(e.pointerId))return;
    pointers.delete(e.pointerId);
    if(canvas.hasPointerCapture(e.pointerId))
      canvas.releasePointerCapture(e.pointerId);
    if(pointers.size===1){
      const [id,remaining]=[...pointers.entries()][0];
      pointer=id;start={x:remaining.x,y:remaining.y,yaw,pitch};
      dragging=true;
    }else if(pointers.size===0){
      dragging=false;pointer=null;start=null;
    }
  };
  canvas.addEventListener('pointerup',stop);
  canvas.addEventListener('pointercancel',stop);
  canvas.addEventListener('lostpointercapture',e=>{
    if(pointers.has(e.pointerId))stop(e);
  });
  canvas.addEventListener('wheel',e=>{
    // Inside the dedicated interactive model canvas, the wheel is a standard
    // camera zoom rather than a scrolling action. Outside it page scrolls.
    e.preventDefault();
    changeZoom(Math.exp(-clamp(e.deltaY,-240,240)*.0017));
  },{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','+','-','=','0'].includes(e.key))return;
    e.preventDefault();
    if(e.key==='Home'||e.key==='0'){
      zoomFactor=1;
      setCameraView('iso');
      resize();
      return;
    }
    if(e.key==='+'||e.key==='='){changeZoom(1.2);return;}
    if(e.key==='-'){changeZoom(1/1.2);return;}
    pauseForInteraction();
    if(e.key==='ArrowLeft')yaw=normalizeAngle(yaw-.17);
    if(e.key==='ArrowRight')yaw=normalizeAngle(yaw+.17);
    if(e.key==='ArrowUp')pitch=normalizeAngle(pitch-.16);
    if(e.key==='ArrowDown')pitch=normalizeAngle(pitch+.16);
    cameraPreset='free';refreshCameraControls();render();
  });
  document.getElementById('reset-model')?.addEventListener('click',()=>{
    zoomFactor=1;projectionMode='perspective';
    setCameraView('iso');
    resize();
    canvas.focus({preventScroll:true});
  });
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const intersection=new IntersectionObserver(entries=>{
    visible=entries.some(e=>e.isIntersecting);
    if(!visible&&raf){cancelAnimationFrame(raf);raf=0;clockLast=0;last=0;}
    if(visible)schedule();
  });
  intersection.observe(canvas);
  const visibility=()=>{
    if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;clockLast=0;last=0;}
    else preference();
  };
  const preference=()=>{
    carouselReducedMotion=reduced.matches;
    carouselPaused=reduced.matches;
    refreshShowcase();
    if(reduced.matches&&raf){cancelAnimationFrame(raf);raf=0;clockLast=0;last=0;}
    else schedule();
  };
  document.addEventListener('visibilitychange',visibility);
  reduced.addEventListener?.('change',preference);
  refreshShowcase();refreshCameraControls();resize();schedule();
  return {
    setMotion,setView,setModelIndex,setCameraView,
    destroy(){
      disposed=true;if(raf)cancelAnimationFrame(raf);
      observer.disconnect();intersection.disconnect();
      document.removeEventListener('visibilitychange',visibility);
      reduced.removeEventListener?.('change',preference);
      legend.remove();stage.classList.remove('model-ready');
    }
  };
}
