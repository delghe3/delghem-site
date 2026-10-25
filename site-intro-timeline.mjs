/**
 * Immutable 5-second DELGHEM introductory word-build sequence.
 * This is display choreography, not a performance benchmark.
 * The browser runtime uses the same pure states to update aria, words,
 * tagline and the single completion time without independent timers.
 */
export const INTRO_DURATION_MS=5000;
export const INTRO_WORD_STAGES=Object.freeze(['D','DE','DEL','DELG','DELGH','DELGHE','DELGHEM']);
const INTRO_LETTER_INTERVAL_MS=455;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function introAt(elapsedMs=0){
 const elapsed=clamp(Number.isFinite(elapsedMs)?elapsedMs:0,0,INTRO_DURATION_MS);
 const stage=clamp(Math.floor(elapsed/INTRO_LETTER_INTERVAL_MS),0,INTRO_WORD_STAGES.length-1);
 return {
  word:INTRO_WORD_STAGES[stage],
  stage,
  progress:elapsed/INTRO_DURATION_MS,
  tagline:elapsed>=2930,
  exit:elapsed>=4610,
  done:elapsed>=INTRO_DURATION_MS,
  elapsed
 };
}
