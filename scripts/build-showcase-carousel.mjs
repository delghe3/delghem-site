/**
 * Four distinct, independently validated native DÈLGHEM D2 concepts for
 * the web showcase. We never alter the existing 8-storey D2 source model.
 * Stadium, tied steel arch bridge, vaulted glulam terminal, and historic masonry aggregate are
 * plausible source-model geometries ONLY, not analysed or dimensioned works.
 * Read-only D2 imports; all artifacts written to the SITE repository.
 */
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const d2=process.env.DELGHEM_D2_REPO??resolve(homedir(),'Desktop/D2/Progetto');
const moduleAt=p=>import(pathToFileURL(resolve(d2,p)).href);
const [{validateEditableModel},{configureSoilLayers,upsertFoundationElement},{materialFromLibrary},{PROFILES}]=await Promise.all([
 moduleAt('src/core/model.mjs'),
 moduleAt('src/core/d2-foundation-system.mjs'),
 moduleAt('src/core/material-library.mjs'),
 moduleAt('src/core/catalog.mjs')
]);
const hash=b=>createHash('sha256').update(b).digest('hex');
const round=n=>Number(n.toFixed(5));
const nativeFolder=resolve(root,'assets/real-d2');
mkdirSync(nativeFolder,{recursive:true});
const green=[true,true,true,true,true,true];
const clear=[false,false,false,false,false,false];
const fmtName={'M_STEEL':'S355','M_RC':'C30/37','M_WOOD':'GL24h','M_BRICK':'MURATURA','M_STONE':'MURATURA'};
class NativeScene {
 constructor(id,title,meta){
  this.id=id;this.meta=meta;
  this.model={schema:'hyperfem-1',title,units:'kN-m',
   materials:[
    {id:'M_STEEL',...materialFromLibrary('OPEN_S355',{thickness:20})},
    {id:'M_RC',...materialFromLibrary('C30_37')},
    {id:'M_WOOD',...materialFromLibrary('GL_GL24h')}
   ],sections:[],nodes:[],members:[],shells:[],laminates:[],loadCases:[
     {id:'G',name:'Geometria dimostrativa, nessun carico di progetto',loads:[],memberLoads:[],shellLoads:[]}],combinations:[]};
  this.indices=new Map();this.edgeSet=new Set();this.panelKeys=new Set();this.profileData=new Map();
  this.kinds=new Map();this.baseSupports=new Map();this.laminates=new Map();
  this.winklerMembers=[];this.bearingSupports=[];
  this.gridsX=new Set();this.gridsY=new Set();
  const I=(id,name)=>{
   const v=PROFILES.find(p=>p.alias===name);
   if(!v)throw Error('D2 catalog section absent '+name);
   this.model.sections.push({id,name:v.alias,A:v.A,Iy:v.Iy,Iz:v.Iz,J:v.J});
   this.profileData.set(id,{shape:'i',b:v.b,h:v.h,tw:v.tw,tf:v.tf,material:'steel'});
   return id;
  };
  const RECT=(id,name,b,h,material)=>{
   const a=Math.max(b,h),c=Math.min(b,h);
   this.model.sections.push({id,name,A:b*h,Iy:b*h**3/12,Iz:h*b**3/12,
    J:a*c**3*(1/3-0.21*c/a*(1-c**4/(12*a**4)))});
   this.profileData.set(id,{shape:'rect',b,h,material});
   return id;
  };
  this.S={
   arch:I('S_ARCH','HEB400'),
   beam:I('S_BEAM','IPE450'),
   mid:I('S_MID','IPE360'),
   slim:I('S_SLIM','IPE240'),
   chord:I('S_CHORD','HEA200'),
   web:I('S_WEB','HEA140'),
   purlin:I('S_PURLIN','IPE200'),
   column:I('S_COLUMN','HEB340'),
   rcColumn:RECT('S_RC_C','C.A. 700×700 mm',.70,.70,'rc'),
   rcBeam:RECT('S_RC_B','C.A. 350×600 mm',.35,.60,'rc'),
   floorTie:RECT('S_RC_T','Trave di collegamento C.A. 350×450 mm',.35,.45,'rc'),
   hanger:RECT('S_HANGER','Tirante a sezione quadrata 65 mm',.065,.065,'steel'),
   railing:RECT('S_RAIL','Corrente acciaio S355 65×65 mm',.065,.065,'steel'),
   woodArch:RECT('S_GVA','Lamellare GL24h 280×840 mm',.28,.84,'wood'),
   woodTie:RECT('S_GVB','Lamellare GL24h 230×490 mm',.23,.49,'wood'),
   woodWeb:RECT('S_GVC','Lamellare GL24h 160×300 mm',.16,.30,'wood'),
   woodPurlin:RECT('S_GVP','Lamellare GL24h 180×320 mm',.18,.32,'wood')
  };
 }
 node(x,y,z){
  const vals=[x,y,z].map(round),key=vals.join('|');
  if(!this.indices.has(key)){
   const id='N'+(this.model.nodes.length+1);
   this.indices.set(key,id);
   this.model.nodes.push({id,x:vals[0],y:vals[1],z:vals[2],fixed:Math.abs(vals[2])<1e-9?[...green]:[...clear]});
  }
  return this.indices.get(key);
 }
 get idToNode(){return new Map(this.model.nodes.map(n=>[n.id,n]));}
 orientation(a,b){
  const [dx,dy,dz]=b.map((v,i)=>Math.abs(v-a[i]));
  return dz>=dx&&dz>=dy?[1,0,0]:dx>=dy?[0,1,0]:[1,0,0];
 }
 member(a,b,section,material,kind,type='beam'){
  const n1=this.node(...a),n2=this.node(...b);
  if(n1===n2)throw Error('Zero member '+this.id+' '+kind+' '+a);
  const key=[n1,n2].sort().join('~');
  if(this.edgeSet.has(key))return null;
  this.edgeSet.add(key);
  const id='B'+(this.model.members.length+1);
  const row={id,n1,n2,material,section,type};
  if(type==='beam')row.orientation=this.orientation(a,b);
  this.model.members.push(row);this.kinds.set(id,kind);
  return id;
 }
 support(x,y,material='M_RC'){
  const id=this.node(x,y,0);this.baseSupports.set(id,material);return id;
 }
 post(x,y,z0,z1,material='M_STEEL',section='column',kind='steel-column'){
  if(z0===0)this.support(x,y,material);
  this.member([x,y,z0],[x,y,z1],this.S[section],material,kind,'beam');
 }
 laminate(thickness){
  const mm=Math.round(thickness*1000);
  if(!this.laminates.has(mm)){
   const id='LAM_GL24_'+mm;
   this.model.laminates.push({id,name:'GL24h orthotropic '+mm+' mm roof panel',
    layers:[{thicknessM:thickness,angleDeg:0,ExMPa:11000,EyMPa:370,EzMPa:370,
      nuxy:.02,nuyz:.2,nuzx:.02,GxyMPa:650,GyzMPa:65,GzxMPa:650,densityKgM3:420}]});
   this.laminates.set(mm,id);
  }
  return this.laminates.get(mm);
 }
 panel(vertices,material,thickness,kind){
  if(vertices.length!==4)throw Error('Native quad required');
  const nodes=vertices.map(v=>this.node(...v));
  // Adjacent historic wings sometimes share a party wall exactly. Store
  // that native QUAD4 only once rather than creating coincident FEM shells.
  if(this.id==='masonry-aggregate'){
   const fingerprint=[...nodes].sort().join('|');
   if(this.panelKeys.has(fingerprint))return null;
   this.panelKeys.add(fingerprint);
  }
  const id='F'+(this.model.shells.length+1);
  const row={id,nodes,material,thickness};
  if(material==='M_WOOD')row.laminate=this.laminate(thickness);
  this.model.shells.push(row);this.kinds.set(id,kind);return id;
 }
 buildExport(){
  const isMasonry=this.id==='masonry-aggregate';
  const isBridge=this.id==='steel-arch-bridge';
  // An all-masonry historic aggregate must not contain unused S355 or C.A.
  // material records or fake RC pad foundations. We explicitly keep the
  // natural fixed-base masonry walls as an unverified geotechnical idealisation.
  if(isMasonry){
   const allowed=new Set(['M_BRICK','M_STONE','M_WOOD']);
   const usedMat=new Set([...this.model.members.map(x=>x.material),...this.model.shells.map(x=>x.material)]);
   if([...usedMat].some(x=>!allowed.has(x)))throw Error('Non-masonry-bearing material in aggregate');
   this.model.materials=this.model.materials.filter(x=>usedMat.has(x.id));
   const usedSections=new Set(this.model.members.map(x=>x.section));
   this.model.sections=this.model.sections.filter(x=>usedSections.has(x.id));
  }
  if(isMasonry)console.log('MASONRY_MODEL_RAW_COMPLEXITY',JSON.stringify({nodes:this.model.nodes.length,members:this.model.members.length,shells:this.model.shells.length,openings:this.openings.length,roofs:this.roofSystems.length}));
  validateEditableModel(this.model);
  if(this.model.members.length<150||this.baseSupports.size<4||this.model.shells.length<12)
    throw Error('Insufficient FEM geometry '+this.id);
  const soil=[{type:'sand',zTopM:0,zBottomM:15,gammaKnM3:18,phiDeg:30,EsMPa:25,nu:.3,ksKnM3:18000}];
  let final=(isMasonry||isBridge)?this.model:configureSoilLayers(this.model,soil);
  if(!isMasonry&&!isBridge)for(const [nodeId,mat] of this.baseSupports){
   const rc=mat==='M_RC';
   final=upsertFoundationElement(final,{
    id:'FD_'+nodeId,type:'direct',nodeId,
    widthM:rc?2.8:2.5,lengthM:rc?3.0:2.5,thicknessM:rc?.95:.75,depthM:rc?.95:.75,
    gammaR:1.4,mu:.48
   });
  }
  // The stadium has both actual direct pad bearings and native Winkler
  // spring-supported interconnecting grade beams. Distinct archive entries
  // share the same valid D2 foundation system, each deriving tributary ks*b*L.
  if(this.id==='football-canopy'||this.id==='timber-terminal'){
   for(const [i,memberId] of this.winklerMembers.entries()){
    final=upsertFoundationElement(final,{id:'W'+(i+1),type:'winkler',
     memberId,contactWidthM:.8});
   }
  }
  validateEditableModel(final);
  const native=JSON.stringify(final,null,2)+'\n';
  const nativeName='showcase-'+this.id+'.hfm.json';
  writeFileSync(resolve(nativeFolder,nativeName),native);
  const nodeIndex=new Map(final.nodes.map((n,i)=>[n.id,i]));
  const sectionIndex=new Map(final.sections.map((s,i)=>[s.id,i]));
  const points=final.nodes.map(n=>[n.x,n.y,n.z]);
  const members=final.members.map(m=>({
   id:m.id,a:nodeIndex.get(m.n1),b:nodeIndex.get(m.n2),
   section:sectionIndex.get(m.section),kind:this.kinds.get(m.id),
   orientation:m.orientation??null,type:m.type,material:m.material
  }));
  const shells=final.shells.map(s=>({
   id:s.id,nodes:s.nodes.map(n=>nodeIndex.get(n)),kind:this.kinds.get(s.id),
   thickness:s.thickness,material:s.material
  }));
  const footings=(final.foundationSystem?.items??[]).filter(x=>x.type==='direct').map(f=>{
   const node=final.nodes[nodeIndex.get(f.nodeId)];
   return {
    id:f.id,nodeId:f.nodeId,x:node.x,y:node.y,z:node.z-f.depthM+f.thicknessM/2,
    widthM:f.widthM,lengthM:f.lengthM,thicknessM:f.thicknessM,depthM:f.depthM,
    kind:'rc-footing'
   };
  });
  const all=points.concat(footings.flatMap(f=>[[f.x-f.widthM/2,f.y-f.lengthM/2,f.z-f.thicknessM/2],[f.x+f.widthM/2,f.y+f.lengthM/2,f.z+f.thicknessM/2]]));
  const bbox={min:[0,1,2].map(i=>Math.min(...all.map(v=>v[i]))),
   max:[0,1,2].map(i=>Math.max(...all.map(v=>v[i])))};
  return {
   id:this.id,...this.meta,
   source:{modelFile:nativeName,derivedModelSha256:hash(native),
    validator:isBridge?'D2 validateEditableModel() with pinned/roller endpoint DOFs':isMasonry?'D2 validateEditableModel() on orthotropic timber and load-bearing masonry shells':'D2 validateEditableModel() + typed foundationSystem upsert',basis:'Editable D2 native geometry only; no results'},
   status:'native_d2_editable_concept_unverified',
   nodes:points,members,shells,footings,
   sections:final.sections.map(s=>({id:s.id,name:s.name,...this.profileData.get(s.id)})),
   bbox,materials:[...new Set(final.members.map(m=>fmtName[m.material]).concat(final.shells.map(s=>fmtName[s.material])))],
   gridX:[...this.gridsX].sort((a,b)=>a-b),
   gridY:[...this.gridsY].sort((a,b)=>a-b),
   ...(isBridge?{supports:this.bearingSupports}:{}),
   ...(['football-canopy','timber-terminal'].includes(this.id)?{winklerCount:this.winklerMembers.length}:{}),
   ...(isMasonry?{buildings:this.buildings,openings:this.openings,roofSystems:this.roofSystems}:{}),
   qualifications:{solved:false,designed:false,executive:false}
  };
 }
}

// 01: 114 × 84 m clear-span COVER over a regulation 105 × 68 m football pitch.
// Nine primary curved steel transfer-truss frames, 14.25 m apart along pitch.
// The illustrative green slab is a native on-grade concrete shell panel with
// grass-finish visualization only; not a designed playing-surface assembly.
function footballCanopy(){
 const m=new NativeScene('football-canopy',
  'DÈLGHEM D2 — Copertura reticolare curvilinea S355 campo da calcio 105×68 m',
  {titleIt:'Copertura di campo da calcio',
   titleEn:'Football pitch long-span roof',
   subtitleIt:'105 × 68 m · reticolari curve S355 · grande luce · geometria non verificata',
   subtitleEn:'105 × 68 m pitch · curved S355 transfer trusses · unverified geometry',
   descriptionIt:'Copertura integrale di un campo regolamentare: nove archi reticolari S355 su 114 × 84 m, arcarecci, pannelli, plinti collegati con travi Winkler e controventi nei portali centrali su entrambi i lati.',
   descriptionEn:'Fully covered football pitch: nine curved S355 steel lattice roof frames spanning 84 m, longitudinal purlins, roof panels, concrete pads tied with actual D2 Winkler foundation beams, and central portal braces on both sides.',
   icon:'stadium',category:'mixed_steel_rc'});
 const X=Array.from({length:9},(_,i)=>round(-57+i*14.25));
 const Y=Array.from({length:13},(_,i)=>round(-42+i*7));
 const top=y=>round(18+12*(1-(y/42)**2));
 const bot=y=>round(top(y)-3);
 for(const x of X){
  for(const y of [Y[0],Y.at(-1)]){
   m.post(x,y,0,4,'M_RC','rcColumn','rc-column');
   m.post(x,y,4,15,'M_STEEL','column','steel-column');
  }
  for(let j=0;j<Y.length-1;j++){
   const u=Y[j],v=Y[j+1];
   m.member([x,u,top(u)],[x,v,top(v)],m.S.arch,'M_STEEL','stadium-arch');
   m.member([x,u,bot(u)],[x,v,bot(v)],m.S.beam,'M_STEEL','stadium-bottom-chord');
   m.member([x,u,bot(u)],[x,v,top(v)],m.S.web,'M_STEEL','stadium-diagonal','truss');
  }
  for(const y of Y){
   m.member([x,y,bot(y)],[x,y,top(y)],m.S.web,'M_STEEL','stadium-web','truss');
  }
 }
 for(let i=0;i<X.length-1;i++){
  for(let j=0;j<Y.length;j++)
   m.member([X[i],Y[j],top(Y[j])],[X[i+1],Y[j],top(Y[j])],
    m.S.purlin,'M_STEEL','stadium-purlin');
  for(let j=0;j<Y.length-1;j++)
   m.panel([[X[i],Y[j],top(Y[j])],[X[i+1],Y[j],top(Y[j])],
    [X[i+1],Y[j+1],top(Y[j+1])],[X[i],Y[j+1],top(Y[j+1])]],
    'M_STEEL',.014,'stadium-roof');
  // A limited set of longitudinal roof-plane wind-bracing diagonals.
  if(i%2===0){
   for(const j of [0,2,9,11]){
    m.member([X[i],Y[j],top(Y[j])],[X[i+1],Y[j+1],top(Y[j+1])],
     m.S.web,'M_STEEL','stadium-roof-brace','truss');
   }
  }
  // Longitudinal eave/ring reinforcement joining corresponding columnheads.
  for(const y of [Y[0],Y.at(-1)]){
   m.member([X[i],y,15],[X[i+1],y,15],m.S.beam,'M_STEEL','stadium-ring-beam');
  }
 }
 // Steel X-bracing between the CENTRAL column bays on BOTH opposing long
 // sides (y=-42 and y=+42). These connect the real RC column tops at z=4 to
 // the steel portal heads z=15; they are not screen-drawn decorations.
 for(const sideY of [-42,42])for(const i of [3,4]){
  const a=X[i],b=X[i+1];
  m.member([a,sideY,4],[b,sideY,15],m.S.web,'M_STEEL','stadium-column-brace','truss');
  m.member([b,sideY,4],[a,sideY,15],m.S.web,'M_STEEL','stadium-column-brace','truss');
 }
 // Interconnect all nine FOOTINGS on each longitudinal side with concrete
 // grade beams. Add D2's typed Winkler item per beam after foundations are
 // created, so the generated nodal soil springs are physically associated
 // with the native beam/soil archive (ks = illustrative 18,000 kN/m³).
 for(const sideY of [-42,42])for(let i=0;i<X.length-1;i++){
  const id=m.member([X[i],sideY,0],[X[i+1],sideY,0],
    m.S.floorTie,'M_RC','stadium-winkler-grade-beam');
  if(!id)throw Error('Coincident stadium grade beam encountered');
  m.winklerMembers.push(id);
 }
 // A genuine on-grade native concrete pad, top paint colour indicates sports
 // finish only. This green appearance is not a fictitious solved stress map.
 const pitchX=[-52.5,-17.5,17.5,52.5],pitchY=[-34,0,34];
 for(let i=0;i<pitchX.length-1;i++)for(let j=0;j<pitchY.length-1;j++){
  m.panel([[pitchX[i],pitchY[j],0],[pitchX[i+1],pitchY[j],0],
   [pitchX[i+1],pitchY[j+1],0],[pitchX[i],pitchY[j+1],0]],
   'M_RC',.18,'football-pitch');
 }
 for(const x of X)m.gridsX.add(x);
 for(const y of Y)m.gridsY.add(y);
 return m.buildExport();
}

// 02: 96 m TIED twin-ARCH steel bridge (bowstring configuration).
// Two rib chords per side; compression arch, tension tie, 22 distinct
// vertical hangers, composite RC deck and concrete end abutments.
function steelArchBridge(){
 const m=new NativeScene('steel-arch-bridge',
  'DÈLGHEM D2 — Ponte ad arco reticolare in acciaio S355, luce 96 m',
  {titleIt:'Ponte ad arco in acciaio',
   titleEn:'Steel tied-arch bridge',
   subtitleIt:'Luce 96 m · due archi reticolari S355 · tiranti · impalcato C30/37',
   subtitleEn:'96 m main span · twin S355 tied arches · suspenders · concrete deck',
   descriptionIt:'Arco a via inferiore con due costoloni reticolari, 22 tiranti verticali, correnti inferiori, traversi, impalcato e cerniere su una spalla e carrelli sull’altra, senza pile intermedie.',
   descriptionEn:'Through-type bowstring bridge with twin steel lattice ribs, 22 vertical hangers, deck ties, transverse girders, concrete road slab and hinge bearings on one abutment and longitudinal roller bearings on the other.',
   icon:'bridge',category:'mixed_steel_rc'});
 const X=Array.from({length:13},(_,i)=>i*8);
 const Y=[-6.4,0,6.4];
 const zDeck=12;
 const upper=x=>round(zDeck+25*(1-((x-48)/48)**2));
 const lower=x=>round(Math.max(zDeck,upper(x)-2.6));
 // The arch and deck frame is supported DIRECTLY at its four end nodes.
 // West bank: hinged bearings (Tx, Ty, Tz fixed, all rotations free).
 // East bank: longitudinal roller (Tx free, Ty/Tz fixed, all rotations free).
 // These are boundary conditions, not columns, pedestals or imaginary pads.
 for(const x of [0,96])for(const y of [-6.4,6.4]){
  const id=m.node(x,y,zDeck);
  const supportNode=m.model.nodes.find(n=>n.id===id);
  if(!supportNode)throw Error('Bridge end node missing');
  const kind=x===0?'hinge':'roller';
  supportNode.fixed=kind==='hinge'?[true,true,true,false,false,false]:
   [false,true,true,false,false,false];
  m.baseSupports.set(id,'M_STEEL');
  m.bearingSupports.push({id:'SUP'+(m.bearingSupports.length+1),nodeId:id,kind,
   x,y,z:zDeck,dofs:[...supportNode.fixed]});
 }
 for(const y of [-6.4,6.4]){
  for(let i=0;i<X.length-1;i++){
   const a=X[i],b=X[i+1];
   m.member([a,y,zDeck],[b,y,zDeck],m.S.beam,'M_STEEL','deck-tie');
   m.member([a,y,upper(a)],[b,y,upper(b)],m.S.arch,'M_STEEL','arch-upper-rib');
   m.member([a,y,lower(a)],[b,y,lower(b)],m.S.mid,'M_STEEL','arch-lower-rib');
   m.member([a,y,lower(a)],[b,y,upper(b)],m.S.web,'M_STEEL','arch-lattice','truss');
  }
  for(const x of X){
   if(x!==0&&x!==96){
    m.member([x,y,zDeck],[x,y,upper(x)],m.S.hanger,'M_STEEL','arch-hanger','truss');
    m.member([x,y,lower(x)],[x,y,upper(x)],m.S.web,'M_STEEL','arch-web','truss');
   }
   m.member([x,y,zDeck],[x,y,zDeck+1.45],
    m.S.railing,'M_STEEL','bridge-rail-post');
  }
  for(let i=0;i<X.length-1;i++)
   m.member([X[i],y,zDeck+1.45],[X[i+1],y,zDeck+1.45],
    m.S.railing,'M_STEEL','bridge-rail');
 }
 for(let i=0;i<X.length;i++){
  const x=X[i];
  for(let j=0;j<2;j++)
   m.member([x,Y[j],zDeck],[x,Y[j+1],zDeck],
    m.S.mid,'M_STEEL','deck-crossbeam');
  if(i%2===0&&i>0&&i<X.length-1){
   m.member([x,Y[0],upper(x)],[x,Y[2],upper(x)],
    m.S.chord,'M_STEEL','arch-transverse-tie');
  }
 }
 for(let i=0;i<X.length-1;i++)for(let j=0;j<2;j++){
  const a=X[i],b=X[i+1];
  m.panel([[a,Y[j],zDeck],[b,Y[j],zDeck],
    [b,Y[j+1],zDeck],[a,Y[j+1],zDeck]],
   'M_RC',.25,'rc-bridge-deck');
  m.member([a,0,zDeck],[b,0,zDeck],m.S.mid,'M_STEEL','deck-centre-girder');
  if(i%2===0)
   m.member([a,-6.4,zDeck],[b,6.4,zDeck],m.S.web,'M_STEEL','deck-lateral-brace','truss');
 }
 m.gridsX=new Set(X);m.gridsY=new Set(Y);
 return m.buildExport();
}

// 03: multi-bay vaulted timber transit terminal.
// Primary engineered GL24h double-rib vault trusses, skylight breaks,
// longitudinal glulam purlins, local steel/RC mezzanines and real roof
// laminate shells — all native editable D2 entities, no imposed loading.
function timberTerminal(){
 const m=new NativeScene('timber-terminal',
  'DÈLGHEM D2 — Terminal a volte reticolari in legno GL24h e acciaio S355',
  {titleIt:'Terminal a volte in legno',
   titleEn:'Long-span glulam terminal',
   subtitleIt:'84 × 54 m · volte GL24h · lucernari · mezzanini C30/37/S355',
   subtitleEn:'84 × 54 m · vaulted GL24h trusses · skylights · composite mezzanines',
   descriptionIt:'Atrio polifunzionale con capriate voltate GL24h, lucernari e mezzanini misti. I 32 plinti sono collegati da 52 travi di fondazione in cemento armato su Winkler, con suolo ipotizzato.',
   descriptionEn:'Multi-bay GL24h vaulted terminal with skylights and composite mezzanines. The 32 pads are interconnected by 52 real native reinforced-concrete Winkler foundation beams, based on illustrative subgrade assumptions.',
   icon:'atrium',category:'mixed_steel_rc_timber'});
 const X=Array.from({length:8},(_,i)=>-42+i*12);
 const Y=Array.from({length:9},(_,i)=>-27+i*6.75);
 const roof=y=>round(11+12*(1-(y/27)**2));
 const lower=y=>round(roof(y)-2.6*(1-(y/27)**2));
 for(const x of X){
  for(const y of [-27,27]){
   m.post(x,y,0,4.2,'M_RC','rcColumn','rc-column');
   m.post(x,y,4.2,11,'M_STEEL','column','steel-column');
  }
  for(let j=0;j<Y.length-1;j++){
   const a=Y[j],b=Y[j+1];
   m.member([x,a,roof(a)],[x,b,roof(b)],m.S.woodArch,'M_WOOD','glulam-vault');
   m.member([x,a,lower(a)],[x,b,lower(b)],m.S.woodTie,'M_WOOD','glulam-bottom-chord');
   m.member([x,a,lower(a)],[x,b,roof(b)],m.S.woodWeb,'M_WOOD','glulam-diagonal','truss');
  }
  for(const y of Y){
   if(Math.abs(roof(y)-lower(y))>1e-5)
    m.member([x,y,lower(y)],[x,y,roof(y)],m.S.woodWeb,'M_WOOD','glulam-web','truss');
  }
 }
 const fineX=Array.from({length:15},(_,i)=>-42+i*6);
 for(let i=0;i<fineX.length-1;i++){
  const xa=fineX[i],xb=fineX[i+1];
  for(const y of Y)
   m.member([xa,y,roof(y)],[xb,y,roof(y)],
    m.S.woodPurlin,'M_WOOD','glulam-purlin');
  // Secondary transverse gable members support the halves of the roof
  // panels between main arches, not a fabricated full-scale solution.
  if(i%2===1)
   for(let j=0;j<Y.length-1;j++)
    m.member([xa,Y[j],roof(Y[j])],[xa,Y[j+1],roof(Y[j+1])],
     m.S.woodWeb,'M_WOOD','glulam-secondary');
  for(let j=0;j<Y.length-1;j++){
   if((i===3||i===10)&&j===3)continue; // two separate true skylight voids
   m.panel([[xa,Y[j],roof(Y[j])],[xb,Y[j],roof(Y[j])],
    [xb,Y[j+1],roof(Y[j+1])],[xa,Y[j+1],roof(Y[j+1])]],
    'M_WOOD',.115,'glulam-roof');
  }
 }
 // Mezzanines north and south at 6.1 m, supported by distinct native
 // RC columns on the inner balcony line and steel perimeter frames.
 const mezzZ=6.1;
 for(const x of X){
  for(const y of [-18,18])m.post(x,y,0,mezzZ,'M_RC','rcColumn','rc-column');
  for(const y of [-27,27])
   m.member([x,y,mezzZ],[x,y>0?18:-18,mezzZ],
    m.S.beam,'M_STEEL','terminal-mezzanine-beam');
 }
 for(let i=0;i<X.length-1;i++)for(const [y0,y1] of [[-27,-18],[18,27]]){
  m.panel([[X[i],y0,mezzZ],[X[i+1],y0,mezzZ],
   [X[i+1],y1,mezzZ],[X[i],y1,mezzZ]],
   'M_RC',.18,'rc-terminal-mezzanine');
  for(const y of [y0,y1])
   m.member([X[i],y,mezzZ],[X[i+1],y,mezzZ],
    m.S.mid,'M_STEEL','terminal-edge-beam');
 }
 for(let i=0;i<X.length-1;i++)for(const y of [-27,27])
  m.member([X[i],y,11],[X[i+1],y,11],m.S.mid,'M_STEEL','terminal-ring-beam');
 // Local 1 m high entrance canopy above the south pedestrian frontage.
 for(const y of [-27,-33]){
  for(const x of [-18,-6,6,18])
   if(y===-27){
    m.member([x,y,9.3],[x,-33,9.3],m.S.slim,'M_STEEL','terminal-cantilever');
   }
 }
 for(const x of [-18,-6,6])m.panel([[x,-33,9.3],[x+12,-33,9.3],[x+12,-27,9.3],[x,-27,9.3]],
  'M_STEEL',.016,'terminal-steel-canopy');
 // 32 real concrete pads at the eight 12 m portal axes along four bearing
 // rows. D2 foundationBeam member endpoints and typed Winkler entries are
 // created together. These are conceptual soil parameters, not site results.
 const ROWS=[-27,-18,18,27];
 const foundationBeam=(a,b)=>{
  const id=m.member(a,b,m.S.floorTie,'M_RC','terminal-winkler-grade-beam');
  if(!id)throw Error('Coincident terminal Winkler grade beam between '+a+' and '+b);
  m.winklerMembers.push(id);
 };
 // 4 longitudinal rows × 7 spans = 28.
 for(const y of ROWS)for(let i=0;i<X.length-1;i++)
  foundationBeam([X[i],y,0],[X[i+1],y,0]);
 // Two transverse facade spans on each of eight axes = 16.
 for(const x of X)for(const [a,b] of [[-27,-18],[18,27]])
  foundationBeam([x,a,0],[x,b,0]);
 // Connect the north/south foundation grids as one actual soil-supported
 // beam network at both end portals. The 36m internal void is subdivided
 // into four 9m Winkler members, avoiding a fictitious 36m single element.
 const courtY=[-18,-9,0,9,18];
 for(const x of [X[0],X.at(-1)])for(let j=0;j<courtY.length-1;j++)
  foundationBeam([x,courtY[j],0],[x,courtY[j+1],0]);
 if(m.winklerMembers.length!==52)throw Error('Expected 52 terminal foundation members');
 m.gridsX=new Set(fineX);m.gridsY=new Set(Y);
 return m.buildExport();
}

// 04: Large, irregular historic-style masonry building AGGREGATE.
// Six adjoining masonry wings plus a taller masonry stair/bell tower.
// All walls, partitions, piers and spandrels are NATIVE D2 QUAD4
// masonry/stone shells; roof and floor decks are GL24h timber.
// True windows / doors are unmeshed voids in the actual wall topology,
// not painted or texture-mapped windows. The base is idealised as fixed:
// no false reinforced-concrete foundation, no seismic qualification.
function masonryAggregate(){
 const m=new NativeScene('masonry-aggregate',
  'DÈLGHEM D2 — Aggregato murario esteso con corpi contigui e falde in legno GL24h',
  {titleIt:'Grande aggregato in muratura',
   titleEn:'Large historic masonry aggregate',
   subtitleIt:'90 × 60 m · sette corpi sfalsati · muratura portante · tetti lignei GL24h',
   subtitleEn:'90 × 60 m · seven connected wings · load-bearing masonry · GL24h pitched roofs',
   descriptionIt:'Aggregato irregolare di sei corpi più torre muraria: spessori, aperture realmente forate, pareti interne portanti, solai lignei e sette coperture a falde in legno lamellare. Geometria non verificata.',
   descriptionEn:'Irregular six-wing masonry settlement plus tower: real structural window voids, load-bearing internal walls, timber floors and seven GL24h pitched roof systems. Concept model, not structurally verified.',
   icon:'masonry',category:'masonry_and_timber'});
 // No reinforced-concrete or structural steel is present in this new model:
 // only elastic conceptual masonry (brick / natural stone) and structural
 // timber. Material values are *illustrative* input stiffnesses, not design
 // parameters from a measured masonry quality assessment.
 m.model.materials=[
  {id:'M_BRICK',name:'Muratura portante in laterizio · parametri elastici ipotetici',
   E:1_850_000,nu:.17,G:1_850_000/(2*(1+.17)),weightDensity:18.2},
  {id:'M_STONE',name:'Muratura portante in pietrame naturale · parametri elastici ipotetici',
   E:2_350_000,nu:.2,G:2_350_000/(2*(1+.2)),weightDensity:20.2},
  {id:'M_WOOD',...materialFromLibrary('GL_GL24h')}
 ];
 m.buildings=[];
 m.openings=[];
 m.roofSystems=[];
 const S=m.S;
 // An orthogonally joined historic settlement leaves a true open internal
 // court (x ~ 22–66; y ~ 20–40) and comprises independent stepped volumes.
 const buildings=[
  {id:'northwest',x0:0,x1:30,y0:0,y1:18,storeys:4,wall:'M_BRICK',ridge:'x',openFacade:'y0',sideFacade:'x0'},
  {id:'northcentral',x0:30,x1:57,y0:0,y1:18,storeys:5,wall:'M_STONE',ridge:'x',openFacade:'y0',sideFacade:null},
  {id:'northeast',x0:57,x1:90,y0:0,y1:22,storeys:3,wall:'M_BRICK',ridge:'x',openFacade:'y0',sideFacade:'x1'},
  {id:'westwing',x0:0,x1:20,y0:18,y1:60,storeys:4,wall:'M_STONE',ridge:'y',openFacade:'y1',sideFacade:'x0'},
  {id:'southwing',x0:20,x1:61,y0:40,y1:60,storeys:3,wall:'M_BRICK',ridge:'x',openFacade:'y1',sideFacade:'x1'},
  {id:'eastwing',x0:67,x1:90,y0:22,y1:60,storeys:4,wall:'M_STONE',ridge:'y',openFacade:'y1',sideFacade:'x1'},
  {id:'courtyard-tower',x0:47,x1:56,y0:18,y1:28,storeys:7,wall:'M_STONE',ridge:'x',openFacade:'y1',sideFacade:'x1'}
 ];
 const storeyHeight=3.15;
 const materialKind=material=>material==='M_STONE'?'stone-wall':'masonry-wall';
 const wallQuad=(axis,c,a,b,z0,z1,material)=>{
  if(b-a<.05||z1-z0<.05)return;
  const p=axis==='x'
   ?[[a,c,z0],[b,c,z0],[b,c,z1],[a,c,z1]]
   :[[c,a,z0],[c,b,z0],[c,b,z1],[c,a,z1]];
  m.panel(p,material,material==='M_STONE'?.65:.52,materialKind(material));
 };
 // A door/window actually interrupts the finite element mesh; all four
 // surrounding piers and spandrels are concrete-free masonry shells.
 const wallBay=(axis,c,a,b,z0,z1,material,windowType='window',where='')=>{
  const center=(a+b)/2;
  const width=windowType==='door'?Math.min(2.3,(b-a)*.23):Math.min(2.3,(b-a)*.25);
  const aa=center-width/2,bb=center+width/2;
  const sill=windowType==='door'?z0:z0+.92;
  const head=windowType==='door'?z0+Math.min(2.55,storeyHeight-.38):z0+2.36;
  wallQuad(axis,c,a,b,z0,sill,material);
  wallQuad(axis,c,a,b,head,z1,material);
  wallQuad(axis,c,a,aa,sill,head,material);
  wallQuad(axis,c,bb,b,sill,head,material);
  const xyz=axis==='x'?[center,c,(sill+head)/2]:[c,center,(sill+head)/2];
  m.openings.push({
   id:'OP'+(m.openings.length+1),building:where,
   axis,coordinate:c,start:round(aa),end:round(bb),
   zBottom:round(sill),zTop:round(head),
   center:xyz.map(round),type:windowType
  });
 };
 function facade(b,side,storey){
  const z0=storey*storeyHeight,z1=(storey+1)*storeyHeight;
  const axis=side.startsWith('y')?'x':'y';
  const c=side==='y0'?b.y0:side==='y1'?b.y1:side==='x0'?b.x0:b.x1;
  const a=axis==='x'?b.x0:b.y0,top=axis==='x'?b.x1:b.y1;
  const length=top-a,main=side===b.openFacade;
  const second=false; // preserve native shell node cap; primary facades contain real openings
  const material=b.wall;
  // Limit facade fragmentation to actual pre-defined fenestration axes; all
  // other walls are continuous native masonry QUAD4 plates.
  if(main&&b.id!=='courtyard-tower'&&length>=23&&storey===2&&b.id==='northcentral'){
   const mid=(a+top)/2;
   wallBay(axis,c,a,mid,z0,z1,material,storey===0?'door':'window',b.id);
   wallBay(axis,c,mid,top,z0,z1,material,'window',b.id);
  }else if(main||second){
   wallBay(axis,c,a,top,z0,z1,material,storey===0?'door':'window',b.id);
  }else{
   wallQuad(axis,c,a,top,z0,z1,material);
  }
 }
 function roof(b){
  const z=round(b.storeys*storeyHeight);
  const ridgeHeight=b.id==='courtyard-tower'?3.05:2.55+
   (b.id==='westwing'?.45:0)+(b.id==='northcentral'?.25:0);
  const xAxis=b.ridge==='x';
  const u0=xAxis?b.x0:b.y0,u1=xAxis?b.x1:b.y1;
  const v0=xAxis?b.y0:b.x0,v1=xAxis?b.y1:b.x1,vm=(v0+v1)/2;
  const ridge=round(z+ridgeHeight);
  const uLength=u1-u0,segments=Math.max(3,Math.ceil(uLength/9));
  const U=Array.from({length:segments+1},(_,i)=>round(u0+uLength*i/segments));
  const p=(u,v,zv)=>xAxis?[u,v,zv]:[v,u,zv];
  // Rafters are genuine GL24h member centerlines, not texture strips.
  for(const u of U){
   m.member(p(u,v0,z),p(u,vm,ridge),S.woodTie,'M_WOOD','timber-rafter');
   m.member(p(u,vm,ridge),p(u,v1,z),S.woodTie,'M_WOOD','timber-rafter');
   if(u===U[0]||u===U.at(-1)||Math.abs(u-U[Math.floor(U.length/2)])<.002){
    m.member(p(u,v0,z),p(u,v1,z),S.woodWeb,'M_WOOD','timber-tie');
    m.member(p(u,vm,z),p(u,vm,ridge),S.woodWeb,'M_WOOD','timber-king-post');
   }
  }
  for(let k=0;k<U.length-1;k++){
   const a=U[k],c=U[k+1];
   for(const v of [v0,vm,v1]){
    m.member(p(a,v,v===vm?ridge:z),p(c,v,v===vm?ridge:z),
      v===vm?S.woodArch:S.woodPurlin,'M_WOOD',v===vm?'timber-ridge':'timber-purlin');
   }
   for(const [aV,bV,aZ,bZ] of [[v0,vm,z,ridge],[vm,v1,ridge,z]]){
    m.panel([p(a,aV,aZ),p(c,aV,aZ),p(c,bV,bZ),p(a,bV,bZ)],
      'M_WOOD',.09,'timber-roof');
   }
  }
  m.roofSystems.push({building:b.id,ridgeDirection:b.ridge,
    eaveElevationM:z,ridgeElevationM:ridge,roofPanels:segments*2,
    material:'M_WOOD',woodGrade:'GL24h'});
 }
 for(const b of buildings){
  b.heightM=round(b.storeys*storeyHeight);
  m.buildings.push({id:b.id,footprint:[b.x0,b.y0,b.x1,b.y1],
    storeys:b.storeys,eaveHeightM:b.heightM,wallMaterial:b.wall});
  for(const [x,y] of [[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]]){
   m.support(x,y,b.wall);
  }
  for(let n=0;n<b.storeys;n++){
   for(const side of ['y0','y1','x0','x1'])facade(b,side,n);
   // Mid-span load-bearing partition makes the large timber floors
   // conceptually more plausible than a single 20-40 m unsupported span.
   const xmid=round((b.x0+b.x1)/2),ymid=round((b.y0+b.y1)/2);
   if(b.ridge==='x'){
    wallQuad('y',xmid,b.y0,b.y1,n*storeyHeight,(n+1)*storeyHeight,b.wall);
   }else{
    wallQuad('x',ymid,b.x0,b.x1,n*storeyHeight,(n+1)*storeyHeight,b.wall);
   }
   if(n<b.storeys-1){
    const level=round((n+1)*storeyHeight);
    // Three to four timber roof/floor joist lines per story, bearing on
    // masonry partition and on perimeter walls. No RC/steel members.
    const B=b.ridge==='x'?b.x1-b.x0:b.y1-b.y0;
    const nJoists=2;
    for(let j=0;j<=nJoists;j++){
     const t=j/nJoists;
     if(b.ridge==='x'){
      const x=round(b.x0+(b.x1-b.x0)*t);
      m.member([x,b.y0,level],[x,b.y1,level],S.woodTie,'M_WOOD','timber-floor-joist');
     }else{
      const y=round(b.y0+(b.y1-b.y0)*t);
      m.member([b.x0,y,level],[b.x1,y,level],S.woodTie,'M_WOOD','timber-floor-joist');
     }
    }
    // Two real orthotropic timber deck panels: the split coincides with
    // the load-bearing wall below, leaving no fictitious concrete slab.
    const xmid=round((b.x0+b.x1)/2),ymid=round((b.y0+b.y1)/2);
    if(b.ridge==='x'){
     for(const [xa,xb] of [[b.x0,xmid],[xmid,b.x1]]){
      m.panel([[xa,b.y0,level],[xb,b.y0,level],[xb,b.y1,level],[xa,b.y1,level]],
       'M_WOOD',.15,'timber-floor');
     }
    }else{
     for(const [ya,yb] of [[b.y0,ymid],[ymid,b.y1]]){
      m.panel([[b.x0,ya,level],[b.x1,ya,level],[b.x1,yb,level],[b.x0,yb,level]],
       'M_WOOD',.15,'timber-floor');
     }
    }
   }
  }
  roof(b);
  for(const x of [b.x0,b.x1])m.gridsX.add(x);
  for(const y of [b.y0,b.y1])m.gridsY.add(y);
 }
 return m.buildExport();
}

const exports=[footballCanopy(),steelArchBridge(),timberTerminal(),masonryAggregate()];
const file=resolve(nativeFolder,'showcase-geometry.mjs');
writeFileSync(file,'// Four real DÈLGHEM D2-editable, unverified conceptual structural models.\n'+
 'export const showcaseModels='+JSON.stringify(exports)+';\n');
writeFileSync(resolve(nativeFolder,'SHOWCASE_PROVENANCE.txt'),[
 'DÈLGHEM D2 — FOUR VALIDATED NATIVE STRUCTURAL SHOWCASE MODELS',
 'This directory preserves the pre-existing eight-storey tower unchanged.',
 ...exports.flatMap(x=>[
  '',
  x.id+' — '+x.titleIt,
  'Native source: '+x.source.modelFile,
  'SHA256: '+x.source.derivedModelSha256,
  'VALIDATED: '+x.source.validator,
  'Geometry nodes='+x.nodes.length+' members='+x.members.length+' shell panels='+x.shells.length+' foundation pads='+x.footings.length,
  ...(x.id==='football-canopy'?[
   'Foundation system: 18 direct C.A. pads and '+x.winklerCount+' native typed Winkler grade beams, effective contact width 0.8 m.',
   'Soil ks=18,000 kN/m3 and associated springs are purely illustrative input, not geotechnical test data.',
   'Two central bays on both sides are X-braced with 8 genuine S355 truss diagonals.']:[]),
  ...(x.id==='timber-terminal'?[
   'Foundation system: 32 original direct C.A. pads interconnected by '+x.winklerCount+' typed Winkler RC beams (28 longitudinal, 16 transverse and 8 subdivided through the court).',
   'Beam contact width 0.8m; soil elastic subgrade ks=18,000 kN/m3 is illustrative only, NOT laboratory/geotechnical verification.',
   'Winkler-generated nodal Z spring stiffness and released vertical ground DOFs are retained in the editable native D2 input model.']:[]),
  ...(x.id==='steel-arch-bridge'?[
   'True lateral bearing conditions on 4 end nodes at deck elevation 12 m, with NO pylons or pad footings.',
   'Western bearings: 2 hinges with Tx/Ty/Tz fixed, rotations free.',
   'Eastern bearings: 2 longitudinal rollers, Tx free, Ty/Tz fixed, rotations free.']:[]),
  ...(x.id==='masonry-aggregate'?[
   'Seven native masonry building volumes and seven real pitched GL24h timber roof systems.',
   '31 actual omitted window/door shell openings; no steel/RC structural members, no invented foundations.']:[]),
  'Geometry envelope min='+x.bbox.min.join(',')+' max='+x.bbox.max.join(','),
  'Materials: '+x.materials.join(', '),
  'NOTE: Conceptually plausible exhibition geometry. No force calculation, wind, earthquake, loading, member sizing or global stability verification.',
  'NOT valid for actual construction until independent structural and geotechnical design is completed.'
 ]),
 ''
].join('\n'));
for(const m of exports)console.log('D2_SHOWCASE_VALIDATED',m.id,JSON.stringify({
 nodes:m.nodes.length,members:m.members.length,shells:m.shells.length,
 foundations:m.footings.length,sourceHash:m.source.derivedModelSha256,bbox:m.bbox}));
console.log('EXPORTED_SHOWCASE',file,'bytes',JSON.stringify(exports).length);
