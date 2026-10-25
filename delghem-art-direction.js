/**
 * Progressive, bilingual engineering story navigation.
 * No network, no duplicated data, no background polling, no additional
 * animation loop when the page is idle.
 */
const studioNav=document.getElementById('engineering-scene-nav');
if(studioNav){
 const root=document.getElementById('engineering-benchmarks');
 const links=[...studioNav.querySelectorAll('[data-scene-link]')];
 const scenes=links.map(link=>document.getElementById(link.dataset.sceneLink));
 const progress=document.getElementById('engineering-scene-progress');
 const prefersLessMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let updateFrame=0,lastActive=-1,requestedIndex=-1,requestedUntil=0;
 const reduce=()=>Boolean(prefersLessMotion?.matches);
 const activate=index=>{
  if(index===lastActive||index<0)return;
  lastActive=index;
  links.forEach((link,i)=>{
   if(i===index)link.setAttribute('aria-current','location');
   else link.removeAttribute('aria-current');
  });
  studioNav.dataset.activeScene=String(index+1);
 };
 const update=()=>{
  updateFrame=0;
  if(!root?.isConnected)return;
  // Strong preference for the heading just passed, rather than a hidden
  // small section that happens to cross the IntersectionObserver threshold.
  const stop=Math.min(250,window.innerHeight*.32);
  let selected=0;
  for(let i=0;i<scenes.length;i++){
   const scene=scenes[i];
   if(scene&&scene.getBoundingClientRect().top<=stop)selected=i;
  }
  // During a smooth anchor jump, hold the clicked active state until the
  // corresponding section arrives: no back-and-forth highlight flicker.
  if(requestedIndex>=0){
   if(performance.now()<requestedUntil){selected=requestedIndex;}
   else requestedIndex=-1;
  }
  activate(selected);
  const rect=root.getBoundingClientRect();
  const total=Math.max(1,rect.height-window.innerHeight*.26);
  const current=Math.max(0,Math.min(1,(-rect.top+window.innerHeight*.17)/total));
  if(progress)progress.style.width=(100*current).toFixed(2)+'%';
 };
 const schedule=()=>{if(!updateFrame)updateFrame=requestAnimationFrame(update);};
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(schedule,{rootMargin:'-18% 0px -55% 0px',threshold:[0,.1,.45]});
  for(const scene of scenes)if(scene)observer.observe(scene);
 }
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('hashchange',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 links.forEach((link,i)=>{
  link.addEventListener('click',event=>{
   const target=scenes[i];
   if(!target)return;
   event.preventDefault();
   if(location.hash!=='#'+target.id)history.pushState(null,'','#'+target.id);
   requestedIndex=i;requestedUntil=performance.now()+1600;
   activate(i);
   target.scrollIntoView({block:'start',behavior:reduce()?'auto':'smooth'});
   schedule();
  });
 });
 // Decorative scroll presence only when the corresponding lab exists.
 // The observer does not reveal/hide content, so assistive technology and
 // disabled JavaScript both retain all technical sections.
 schedule();
}
