/**
 * Deterministic shared time cursor for the two DÈLGHEM D2 time histories and
 * their common synthetic analytical ground acceleration. No physics altered.
 *
 * User-visible auto-animation is an accessible opt-out demonstration:
 * animate ONLY while scene is in view, tab visible, motion not reduced
 * and user has not manually paused. Both models use the same sample index.
 */
export function shouldAutoplay({
 visible=false,
 documentVisible=true,
 reducedMotion=false,
 userPaused=false
}={}){
 return Boolean(visible&&documentVisible&&!reducedMotion&&!userPaused);
}

export function nextLoopedFrame({
 indexFraction=0,
 elapsedMs=0,
 dtSec=.01,
 count=0,
 speed=2
}={}){
 if(!Number.isFinite(indexFraction)||!Number.isFinite(elapsedMs)||
  !Number.isFinite(dtSec)||!Number.isFinite(speed)||count<2||
  dtSec<=0||speed<=0||elapsedMs<0)throw Error('Invalid synchronized DÈLGHEM playback parameters');
 const period=count-1;
 const t=((indexFraction+elapsedMs/1000/dtSec*speed)%period+period)%period;
 const index=Math.max(0,Math.min(count-1,Math.round(t)));
 return {index,indexFraction:t,loopTimeS:t*dtSec};
}
