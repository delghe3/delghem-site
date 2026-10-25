/**
 * Illustrative educational steel-frame base-isolation comparison.
 *
 * 4 bays X × 2 bays Y × 3 storeys (visualized in 3D); the dynamics use a
 * deliberately separate 1D shear-building lumped-mass idealisation,
 * NOT a spatial FEM solution or a DÈLGHEM/Kratos certified benchmark.
 *
 * Relative-to-ground displacement DOFs:
 * fixed: floors 1..3, restrained ground;
 * isolated: base diaphragm + floors 1..3, elastic isolation at ground.
 *
 * M u¨ + C u˙ + K u = -M 1 a_g(t)
 * Average acceleration Newmark (beta=1/4, gamma=1/2).
 */
export const isolationParameters=Object.freeze({
 baysX:4,baysY:2,storeys:3,
 bayXM:5,bayYM:5,storeyHeightM:3.5,
 storyMassKg:160000,baseMassKg:90000,
 storyStiffnessNPerM:55e6,storyDampingNsPerM:185000,
 isolatorStiffnessNPerM:4.5e6,isolatorDampingNsPerM:850000,
 dtS:0.015,durationS:15
});
function assemble(isolated,p){
 const n=isolated?4:3;
 const M=Array(n).fill(0).map((_,i)=>isolated&&i===0?p.baseMassKg:p.storyMassKg);
 const K=Array.from({length:n},()=>Array(n).fill(0));
 const C=Array.from({length:n},()=>Array(n).fill(0));
 function spring(i,j,k,c){
  K[i][i]+=k;C[i][i]+=c;
  if(j<0)return;
  K[j][j]+=k;C[j][j]+=c;
  K[i][j]-=k;K[j][i]-=k;
  C[i][j]-=c;C[j][i]-=c;
 }
 if(isolated)spring(0,-1,p.isolatorStiffnessNPerM,p.isolatorDampingNsPerM);
 for(let story=0;story<3;story++){
  const upper=isolated?story+1:story;
  const lower=upper-1;
  spring(upper,lower,p.storyStiffnessNPerM,p.storyDampingNsPerM);
 }
 return {M,K,C,n,isolated};
}
function cholesky(matrix){
 const n=matrix.length,L=Array.from({length:n},()=>Array(n).fill(0));
 for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
  let s=matrix[i][j];
  for(let k=0;k<j;k++)s-=L[i][k]*L[j][k];
  if(i===j){
   if(!(s>0))throw new Error('Nonpositive Newmark effective matrix');
   L[i][j]=Math.sqrt(s);
  }else L[i][j]=s/L[j][j];
 }
 return L;
}
function solve(L,b){
 const n=b.length,y=Array(n).fill(0),x=Array(n).fill(0);
 for(let i=0;i<n;i++){
  let t=b[i];for(let j=0;j<i;j++)t-=L[i][j]*y[j];
  y[i]=t/L[i][i];
 }
 for(let i=n-1;i>=0;i--){
  let t=y[i];for(let j=i+1;j<n;j++)t-=L[j][i]*x[j];
  x[i]=t/L[i][i];
 }
 return x;
}
const mult=(A,v)=>A.map(row=>row.reduce((acc,k,j)=>acc+k*v[j],0));
const pi=Math.PI;
export function groundAcceleration(t){
 // Synthetic band-limited diagnostic shaking with smooth onset/cessation,
 // no relationship to an actual earthquake record or site spectrum.
 if(t<0||t>15)return 0;
 const rise=Math.min(1,t/2.0),fall=Math.min(1,(15-t)/2.0);
 const envelope=Math.max(0,rise*fall);
 return 2.65*envelope*(
   .55*Math.sin(2*pi*1.15*t)+
   .31*Math.sin(2*pi*2.1*t+.4)+
   .19*Math.sin(2*pi*.48*t+.95)
 );
}
function integrate(isolated,p,ag){
 const {M,K,C,n}=assemble(isolated,p);
 const dt=p.dtS,beta=.25,gamma=.5;
 const A=K.map((row,i)=>row.map((k,j)=>beta*dt*dt*k+gamma*dt*C[i][j]+(i===j?M[i]:0)));
 const L=cholesky(A);
 let u=Array(n).fill(0),v=Array(n).fill(0),a=Array(n).fill(0);
 let peakReachedStoryShearKN=0;
 const records=[];
 for(let step=0;step<ag.length;step++){
  const aground=ag[step],t=step*dt;
  if(step>0){
   const predictU=u.map((x,i)=>x+dt*v[i]+dt*dt*(.5-beta)*a[i]);
   const predictV=v.map((x,i)=>x+dt*(1-gamma)*a[i]);
   const Kp=mult(K,predictU),Cp=mult(C,predictV);
   const rhs=M.map((m,i)=>-m*aground-Kp[i]-Cp[i]);
   const aNext=solve(L,rhs);
   u=predictU.map((x,i)=>x+beta*dt*dt*aNext[i]);
   v=predictV.map((x,i)=>x+gamma*dt*aNext[i]);
   a=aNext;
  }
  const base=isolated?u[0]:0;
  const floors=isolated?u.slice(1):u;
  const relative=[base,...floors];
  const storyVelocityMS=isolated?v.slice():[0,...v];
  // Resultant lateral story shear (kΔu + cΔv) in the reduced-order
  // three-storey shear-building idealisation. These are NOT beam/column
  // FEM section forces or von Mises/local stresses.
  const storyShearKN=Array.from({length:3},(_,i)=>(
   p.storyStiffnessNPerM*(relative[i+1]-relative[i])+
   p.storyDampingNsPerM*(storyVelocityMS[i+1]-storyVelocityMS[i])
  )/1000);
  const maxStoryShearKN=Math.max(...storyShearKN.map(Math.abs));
  const criticalStory=storyShearKN.findIndex(x=>Math.abs(x)===maxStoryShearKN)+1;
  peakReachedStoryShearKN=Math.max(peakReachedStoryShearKN,maxStoryShearKN);
  const maxStoryDriftMM=Math.max(...relative.slice(1).map((x,i)=>Math.abs((x-relative[i])*1000)));
  records.push({
   timeS:Number(t.toFixed(4)),
   groundAccelerationMS2:aground,
   roofDisplacementMM:floors.at(-1)*1000,
   roofAbsoluteAccelerationMS2:a.at(-1)+aground,
   baseDisplacementMM:base*1000,
   baseShearKN:isolated?(p.isolatorStiffnessNPerM*u[0]+p.isolatorDampingNsPerM*v[0])/1000:0,
   maxStoryDriftMM,
   storyVelocityMS,
   storyShearKN,
   maxStoryShearKN,
   peakReachedStoryShearKN,
   criticalStory,
   levelsMM:relative.map(x=>x*1000)
  });
 }
 return records;
}
export function computeIsolationComparison(p=isolationParameters){
 const count=Math.round(p.durationS/p.dtS)+1;
 const ag=Array.from({length:count},(_,i)=>groundAcceleration(i*p.dtS));
 const fixed=integrate(false,p,ag),isolated=integrate(true,p,ag);
 const peak=(arr,sel)=>Math.max(...arr.map(v=>Math.abs(sel(v))));
 const peaks={
  fixedAcceleration:peak(fixed,x=>x.roofAbsoluteAccelerationMS2),
  isolatedAcceleration:peak(isolated,x=>x.roofAbsoluteAccelerationMS2),
  fixedStoryDriftMM:peak(fixed,x=>x.maxStoryDriftMM),
  isolatedStoryDriftMM:peak(isolated,x=>x.maxStoryDriftMM),
  isolationTravelMM:peak(isolated,x=>x.baseDisplacementMM),
  isolationShearKN:peak(isolated,x=>x.baseShearKN),
  fixedStoryShearKN:peak(fixed,x=>x.maxStoryShearKN),
  isolatedStoryShearKN:peak(isolated,x=>x.maxStoryShearKN)
 };
 return {
  schema:'delghem-isolation-illustrative-model-1',
  geometry:{baysX:p.baysX,baysY:p.baysY,storeys:p.storeys,bayXM:p.bayXM,bayYM:p.bayYM,storeyHeightM:p.storeyHeightM},
  input:'synthetic diagnostic ground acceleration, not recorded or spectrum-matched',
  numericalModel:'3-DOF fixed shear building vs 4-DOF isolated shear building; linear bearings; Newmark average acceleration',
  parameters:p,
  timeline:ag.map((x,i)=>({timeS:fixed[i].timeS,accelerationMS2:x})),
  fixed,isolated,peaks
 };
}
