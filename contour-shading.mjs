/**
 * Bounded graphical interpolation of FOUR measured quadrature samples
 * within ONE Kratos QUAD4 element. Inputs are ordered (xi,eta):
 * (-,-), (+,-), (+,+), (-,+).
 *
 * The map is display-only: no stress recovery, extrapolated extrema,
 * new nodal values, blending between adjacent elements or solver edits.
 */
export function sampleGaussScalar(samples,u,v){
 if(!Array.isArray(samples)||samples.length!==4||samples.some(x=>!Number.isFinite(x)))
  throw new TypeError('Exactly four finite Gauss scalars required');
 const low=(1-1/Math.sqrt(3))/2;
 const high=1-low;
 const clip=x=>Math.max(0,Math.min(1,x));
 const x=clip((u-low)/(high-low)),y=clip((v-low)/(high-low));
 const [a,b,c,d]=samples;
 return (1-x)*(1-y)*a+x*(1-y)*b+x*y*c+(1-x)*y*d;
}
