import { Renderer } from './baseline/renderer.js';
import { looks, makeFixture, paintWorld, paintHUD, prepareCanvas, paintConcept, paintCalibration, paintMotion } from './scene.js';

const $=id=>document.getElementById(id), scene=$('scene'), fixture=makeFixture();
const choices=['relay','hull','resonance'];let selected='relay';
const baseline=new Renderer(scene);

for(const [i,key] of choices.entries()) {
  const look=looks[key],card=document.createElement('article');card.className='concept-card';
  card.innerHTML=`<header><span>0${i+1}</span><h3>${look.name}</h3></header><canvas role="img" aria-label="${look.name} concept board" data-concept="${key}"></canvas><div class="copy"><p class="grammar">${look.grammar}</p><p>${look.personality}</p><p class="risk">${look.risk}</p></div><button type="button">See ${look.name} in context ↗</button>`;
  card.querySelector('button').onclick=()=>{select(key);$('context-heading').scrollIntoView({behavior:'instant',block:'start'});};
  $('concepts').append(card);
  const motion=document.createElement('article');motion.className='motion-card';motion.innerHTML=`<h3>${look.name}</h3><canvas data-motion="${key}" role="img" aria-label="${look.name} abstract motion study"></canvas>`;$('motion-studies').append(motion);
  const mini=document.createElement('article');mini.className='mini';mini.innerHTML=`<h3>${look.name.toUpperCase()} / 320 × 200</h3><canvas data-mini="${key}" role="img" aria-label="${look.name} at thumbnail scale"></canvas>`;$('small-comparisons').append(mini);
}
for(const key of ['baseline',...choices]) {
  const button=document.createElement('button');button.type='button';button.textContent=looks[key].name;button.dataset.look=key;button.onclick=()=>select(key);$('directions').append(button);
}
function draw() {
  const w=scene.clientWidth,h=w/1.6;
  if(selected==='baseline') {
    baseline.resize();baseline.render(fixture,{joined:true,slot:0,reduced:true});
    paintHUD(baseline.ctx,w,h,'baseline');
  } else {
    const c=prepareCanvas(scene,w,h);paintWorld(c,w,h,selected,fixture);paintHUD(c,w,h,selected);
  }
  document.querySelectorAll('[data-concept]').forEach(canvas=>paintConcept(canvas,canvas.dataset.concept));
  document.querySelectorAll('[data-mini]').forEach(canvas=>{
    const width=canvas.clientWidth,c=prepareCanvas(canvas,width,width/1.6);paintWorld(c,width,width/1.6,canvas.dataset.mini,fixture);paintHUD(c,width,width/1.6,canvas.dataset.mini);
  });
  paintCalibration($('before'),false);paintCalibration($('after'),true);
  drawMotion();
}
function select(key) {
  selected=key;scene.setAttribute('aria-label',`${looks[key].name}: P1 approaches a downed P2 on the inner rail, with an approaching wall and five threat types.`);
  document.querySelectorAll('[data-look]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.look===key)));
  $('scene-title').textContent=looks[key].name.toUpperCase()+' / INNER-RAIL RESCUE';
  $('direction-note').textContent=looks[key].note||'Unmodified 0.3 renderer captured into the same constructed fixture. This preserves the existing shapes and perspective. The comparison HUD is shared by every candidate.';draw();
}
$('grayscale').onchange=()=>document.body.classList.toggle('gray',$('grayscale').checked);
new ResizeObserver(draw).observe(scene);

let motionPlaying=false,motionFrame=0,lastMotionTime=null;
function drawMotion(){const phase=Number($('motion-phase').value)/100;document.querySelectorAll('[data-motion]').forEach(canvas=>paintMotion(canvas,canvas.dataset.motion,phase));$('motion-value').value=`${Math.round(phase*100)}%`;}
function stopMotion(){motionPlaying=false;cancelAnimationFrame(motionFrame);lastMotionTime=null;$('motion-play').textContent='Play motion study';$('motion-play').setAttribute('aria-pressed','false');}
function animateMotion(now){if(!motionPlaying)return;if(lastMotionTime!==null)$('motion-phase').value=String(Math.min(100,Number($('motion-phase').value)+(now-lastMotionTime)/40));lastMotionTime=now;drawMotion();if(Number($('motion-phase').value)>=100){stopMotion();return;}motionFrame=requestAnimationFrame(animateMotion);}
$('motion-play').onclick=()=>{if(motionPlaying){stopMotion();return;}if(Number($('motion-phase').value)>=100)$('motion-phase').value='0';motionPlaying=true;lastMotionTime=null;$('motion-play').textContent='Pause motion study';$('motion-play').setAttribute('aria-pressed','true');motionFrame=requestAnimationFrame(animateMotion);};
$('motion-phase').oninput=()=>{stopMotion();drawMotion();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMotion();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)stopMotion();});

const reviewKey='delve-art-direction-trial-v1';
function getReview() {return {schema:1,game:'Delve Together',skillVersion:'1.1.0',preference:new FormData($('review')).get('preference'),notes:$('notes').value,savedAt:new Date().toISOString(),evidence:'Reviewer-supplied form content; not a recognition or playtest result.'};}
try {
  const saved=JSON.parse(localStorage.getItem(reviewKey));
  if(saved?.schema===1) {
    const radio=Array.from(document.querySelectorAll('input[name=preference]')).find(r=>r.value===saved.preference);if(radio)radio.checked=true;
    $('notes').value=typeof saved.notes==='string'?saved.notes:'';$('review-status').textContent='Restored your saved review from this browser.';
  }
} catch {$('review-status').textContent='Local storage is unavailable. You can still export your review.';}
$('review').onsubmit=e=>{
  e.preventDefault();const review=getReview();
  if(!review.preference&&!review.notes.trim()){$('review-status').textContent='Choose a direction or add a note first.';return;}
  try{localStorage.setItem(reviewKey,JSON.stringify(review));$('review-status').textContent='Saved in this browser. No game files were changed.';}
  catch{$('review-status').textContent='Could not save locally. Export your review to keep a copy.';}
};
$('export').onclick=()=>{
  const blob=new Blob([JSON.stringify(getReview(),null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='delve-art-direction-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('clear-review').onclick=()=>{try{localStorage.removeItem(reviewKey);$('review').reset();$('review-status').textContent='Review cleared. No preference is selected.';}catch{$('review-status').textContent='Could not clear browser storage.';}};
select(selected);
