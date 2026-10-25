/**
 * Native Mac DÈLGHEM opening sequence.
 * Seven unchanged left-anchored type-in stages precede one instantaneous
 * neon tagline. The line remains fully visible for five whole seconds
 * BEFORE the closing transition starts.
 */
export const INTRO_WORD_STAGES=Object.freeze(['D','DE','DEL','DELG','DELGH','DELGHE','DELGHEM']);
const INTRO_LETTER_INTERVAL_MS=455;
export const INTRO_TAGLINE_REVEAL_MS=2930;
export const INTRO_TAGLINE_HOLD_MS=5000;
export const INTRO_EXIT_DURATION_MS=390;
export const INTRO_EXIT_START_MS=INTRO_TAGLINE_REVEAL_MS+INTRO_TAGLINE_HOLD_MS;
export const INTRO_DURATION_MS=INTRO_EXIT_START_MS+INTRO_EXIT_DURATION_MS;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function introAt(elapsedMs=0){
 const elapsed=clamp(Number.isFinite(elapsedMs)?elapsedMs:0,0,INTRO_DURATION_MS);
 const stage=clamp(Math.floor(elapsed/INTRO_LETTER_INTERVAL_MS),0,INTRO_WORD_STAGES.length-1);
 return {
  word:INTRO_WORD_STAGES[stage],
  stage,
  progress:elapsed/INTRO_DURATION_MS,
  tagline:elapsed>=INTRO_TAGLINE_REVEAL_MS,
  exit:elapsed>=INTRO_EXIT_START_MS,
  done:elapsed>=INTRO_DURATION_MS,
  elapsed
 };
}
