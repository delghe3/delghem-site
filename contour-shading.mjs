/**
 * Presentation-only FEM contour shading.
 *
 * OFF: original individual Gauss-point sectors.
 * ON : shared-node recovery followed by full-resolution per-pixel
 *      barycentric color interpolation (not a grid of painted squares).
 *
 * Never changes solver data or connects across missing QUAD4 elements.
 * For intersecting 3D planes the caller supplies a plane-qualified key.
 */
export function sampleGaussScalar(samples,u,v){
 if(!Array.isArray(samples)||samples.length!==4||samples.some(x=>!Number.isFinite(x)))
  throw new TypeError('Exactly four finite Gauss scalars required');
 const low=(1-1/Math.sqrt(3))/2,high=1-low;
 const clip=x=>Math.max(0,Math.min(1,x));
 const x=clip((u-low)/(high-low)),y=clip((v-low)/(high-low));
 const [a,b,c,d]=samples;
 return (1-x)*(1-y)*a+x*(1-y)*b+x*y*c+(1-x)*y*d;
}

/** Recover a graphical vertex color from incident local Gauss samples.
 * Every element that shares a vertex key receives the same averaged scalar.
 * This gives C0 continuity (not certified continuous nodal stresses).
 */
export function recoverSharedVertexField(elements,getSamples,getKey){
 const sums=new Map(),corners=[],adjacent=new Map();
 for(const el of elements){
  const samples=getSamples(el);
  if(samples.length!==4||samples.some(x=>!Number.isFinite(x)))
   throw new TypeError('Finite 2x2 Gauss values required for graphical recovery');
  const row=[];
  for(let i=0;i<4;i++){
   const key=String(getKey(el,i));
   const val=samples[i]; // Gauss sample nearest the physical vertex.
   const old=sums.get(key)??{sum:0,count:0};
   old.sum+=val;old.count+=1;sums.set(key,old);
   row.push(key);
  }
  corners.push(row);
  // Only actual finite-element edges contribute: no connection across holes.
  for(let i=0;i<4;i++){
   const a=row[i],b=row[(i+1)%4];
   if(!adjacent.has(a))adjacent.set(a,new Set());
   if(!adjacent.has(b))adjacent.set(b,new Set());
   if(a!==b){adjacent.get(a).add(b);adjacent.get(b).add(a);}
  }
 }
 let nodal=new Map([...sums].map(([key,x])=>[key,x.sum/x.count]));
 // Two weak Laplacian diffusion passes remove single-node color spikes
 // while keeping a continuous scalar at every shared vertex. This is
 // explicitly visual smoothing: originals/peaks stay in the Gauss readout.
 for(let step=0;step<2;step++){
  const next=new Map();
  for(const [key,value] of nodal){
   const neighbors=adjacent.get(key);
   if(!neighbors?.size){next.set(key,value);continue;}
   let total=0;
   for(const neighbor of neighbors)total+=nodal.get(neighbor);
   next.set(key,value*.7+(total/neighbors.size)*.3);
  }
  nodal=next;
 }
 return corners.map(row=>row.map(k=>nodal.get(k)));
}

export function sampleRecoveredQuad(values,u,v){
 const x=Math.max(0,Math.min(1,u)),y=Math.max(0,Math.min(1,v));
 return (1-x)*(1-y)*values[0]+x*(1-y)*values[1]+x*y*values[2]+(1-x)*y*values[3];
}

const paletteCache=new Map();
function paletteLUT(stops){
 const cacheKey=stops.join('|');
 if(paletteCache.has(cacheKey))return paletteCache.get(cacheKey);
 const colors=stops.map(c=>[1,3,5].map(k=>parseInt(c.slice(k,k+2),16)));
 const lut=new Uint8Array(4096*3);
 for(let i=0;i<4096;i++){
  const t=i/4095*(colors.length-1),k=Math.min(colors.length-2,Math.floor(t)),f=t-k;
  for(let channel=0;channel<3;channel++)
   lut[i*3+channel]=Math.round(colors[k][channel]*(1-f)+colors[k+1][channel]*f);
 }
 paletteCache.set(cacheKey,lut);
 return lut;
}

/** Rasterize an affine triangle. Full-resolution pixels and RGB LUT, so no
 * QUAD4 color blocks or interpolation-cell borders can appear.
 */
function paintTriangle(image,width,height,p0,p1,p2,s0,s1,s2,lut,min,scale){
 const a=p0,b=p1,c=p2;
 const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
 if(!Number.isFinite(denominator)||Math.abs(denominator)<1e-12)return;
 const inv=1/denominator;
 const xStart=Math.max(0,Math.ceil(Math.min(a.x,b.x,c.x)-.5));
 const xEnd=Math.min(width-1,Math.floor(Math.max(a.x,b.x,c.x)-.5));
 const yStart=Math.max(0,Math.ceil(Math.min(a.y,b.y,c.y)-.5));
 const yEnd=Math.min(height-1,Math.floor(Math.max(a.y,b.y,c.y)-.5));
 const dax=(b.y-c.y)*inv, dbx=(c.y-a.y)*inv;
 const day=(c.x-b.x)*inv, dby=(a.x-c.x)*inv;
 for(let y=yStart;y<=yEnd;y++){
  const py=y+.5;
  let wa=((b.y-c.y)*(xStart+.5-c.x)+(c.x-b.x)*(py-c.y))*inv;
  let wb=((c.y-a.y)*(xStart+.5-c.x)+(a.x-c.x)*(py-c.y))*inv;
  let offset=(y*width+xStart)*4;
  for(let x=xStart;x<=xEnd;x++,offset+=4){
   const wc=1-wa-wb;
   if(wa>=-1e-7&&wb>=-1e-7&&wc>=-1e-7){
    const scalar=wa*s0+wb*s1+wc*s2;
    const idx=Math.max(0,Math.min(4095,Math.round((scalar-min)*scale)))*3;
    image[offset]=lut[idx];
    image[offset+1]=lut[idx+1];
    image[offset+2]=lut[idx+2];
    image[offset+3]=255;
   }
   wa+=dax;wb+=dbx;
  }
 }
}

/** Entries: [{pts:[{x,y} x4], values:[number x4]}], all coordinates in
 * physical canvas pixels. Holes remain transparent, and shared node values
 * produce matching colors on conforming edges.
 */
export function paintPixelContours(image,width,height,quads,stops,min,max){
 if(image.length!==width*height*4)throw new RangeError('Invalid canvas pixel buffer');
 const lut=paletteLUT(stops);
 const scale=4095/Math.max(1e-12,max-min);
 for(const quad of quads){
  const [a,b,c,d]=quad.pts,[v0,v1,v2,v3]=quad.values;
  paintTriangle(image,width,height,a,b,c,v0,v1,v2,lut,min,scale);
  paintTriangle(image,width,height,a,c,d,v0,v2,v3,lut,min,scale);
 }
 return image;
}

/** Paint a transparent offscreen layer over the 2D canvas background.
 * Reuse the staging canvas across frame rotations/resizes.
 */
export function drawContinuousContours(ctx,layer,quads,stops,min,max,dpr){
 const w=ctx.canvas.width,h=ctx.canvas.height;
 if(layer.canvas.width!==w||layer.canvas.height!==h){
  layer.canvas.width=w;layer.canvas.height=h;
 }
 const image=layer.context.createImageData(w,h);
 const rasterQuads=quads.map(q=>({
  pts:q.pts.map(p=>({x:p.x*dpr,y:p.y*dpr})),values:q.values
 }));
 paintPixelContours(image.data,w,h,rasterQuads,stops,min,max);
 layer.context.putImageData(image,0,0);
 ctx.drawImage(layer.canvas,0,0,w/dpr,h/dpr);
}
