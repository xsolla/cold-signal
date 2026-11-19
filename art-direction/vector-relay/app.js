import { treatments, clips, renderPoster, renderArena, renderBoard } from './studies.js';
const $=id=>document.getElementById(id), reduced=matchMedia('(prefers-reduced-motion: reduce)');
let treatment='black',clipIndex=1,phase=reduced.matches ? .55 : 0,mode='poster',playing=!reduced.matches,lastTime=null,frame=0;
const miniClips=[],boards=[];
for(const [key,t]of Object.entries(treatments)){
  const tab=document.createElement('button');tab.type='button';tab.textContent=t.name;tab.dataset.treatment=key;tab.onclick=()=>selectTreatment(key);$('treatment-tabs').append(tab);
  const card=document.createElement('article');card.className='treatment';card.innerHTML=`<header><h3>${t.name}</h3><p>${t.tag}</p></header><canvas role="img" aria-label="${t.name} environment, pilot, rescue and UI board"></canvas><div class="copy"><p><strong>${t.grammar}</strong></p><p>${t.motion}</p><p>${t.risk}</p></div><button type="button">Explore ${t.name} ↗</button>`;
  card.querySelector('button').onclick=()=>{selectTreatment(key);$('player').scrollIntoView({block:'start',behavior:'instant'});};$('treatment-grid').append(card);boards.push([card.querySelector('canvas'),key]);
}
clips.forEach((clip,i)=>{
  const button=document.createElement('button');button.type='button';button.className='clip-card';button.dataset.clip=clip.id;button.innerHTML=`<canvas role="img" aria-label="${clip.title} motion keyframe"></canvas><span>0${i+1} / ${clip.title}</span>`;button.onclick=()=>selectClip(i);$('clip-grid').append(button);miniClips.push([button.querySelector('canvas'),clip.id]);
});
function clip(){return clips[clipIndex];}
function draw(){
  const fn=mode==='arena'?renderArena:renderPoster;fn($('stage'),treatment,clip().id,phase,$('calm').checked);
  $('playhead').value=String(phase*100);$('time').value=`${(phase*clip().length).toFixed(1).padStart(4,'0')} / ${clip().length.toFixed(1).padStart(4,'0')}`;
}
function drawStills(){for(const [canvas,id]of miniClips)renderPoster(canvas,treatment,id,.58,true);for(const[canvas,key]of boards)renderBoard(canvas,key);}
function updateUI(){
  document.querySelectorAll('[data-treatment]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.treatment===treatment)));
  document.querySelectorAll('[data-clip]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.clip===clip().id)));
  $('poster-mode').setAttribute('aria-pressed',String(mode==='poster'));$('arena-mode').setAttribute('aria-pressed',String(mode==='arena'));
  $('clip-number').textContent=`${treatments[treatment].name.toUpperCase()} / EXAMPLE 0${clipIndex+1} OF 06`;
  $('clip-title').textContent=clip().title;$('clip-note').textContent=clip().note;
  $('context-note').textContent=mode==='arena'?'Fixed rescue fixture. Motion effects are illustrative; positions, depth and 50% rescue state do not advance.':'Cinematic motion concepts. These are original Canvas studies, not a running match.';
  $('stage').setAttribute('aria-label',`${treatments[treatment].name}, ${clip().title}, ${mode==='arena'?'fixed arena context':'cinematic motion poster'}`);
  $('play').textContent=playing?'Pause':'Play';$('play').setAttribute('aria-pressed',String(playing));$('play-status').textContent=playing?'PLAYING':'PAUSED';
}
function tick(now){if(!playing)return;const dt=lastTime===null?0:Math.min((now-lastTime)/1000,.08);lastTime=now;phase+=dt/clip().length;if(phase>=1){if($('sequence').checked){phase=0;clipIndex=(clipIndex+1)%clips.length;updateUI();}else{phase=1;stop();}}draw();if(playing)frame=requestAnimationFrame(tick);}
function start(){if(playing)return;if(phase>=1)phase=0;playing=true;lastTime=null;updateUI();frame=requestAnimationFrame(tick);}
function stop(){playing=false;lastTime=null;cancelAnimationFrame(frame);updateUI();}
function selectTreatment(key){treatment=key;updateUI();draw();drawStills();}
function selectClip(i){clipIndex=i;phase=$('calm').checked ? .55 : 0;lastTime=null;updateUI();draw();$('player').scrollIntoView({block:'start',behavior:'instant'});if(!$('calm').checked)start();}
$('play').onclick=()=>playing?stop():start();
$('replay').onclick=()=>{phase=$('calm').checked ? .55 : 0;lastTime=null;draw();if(!$('calm').checked)start();};
$('playhead').oninput=()=>{stop();phase=Number($('playhead').value)/100;draw();};
$('calm').checked=reduced.matches;
$('calm').onchange=()=>{if($('calm').checked){stop();phase=.55;}draw();};
$('poster-mode').onclick=()=>{mode='poster';updateUI();draw();};$('arena-mode').onclick=()=>{mode='arena';updateUI();draw();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
reduced.addEventListener('change',e=>{if(e.matches){$('calm').checked=true;stop();phase=.55;draw();}});
new ResizeObserver(()=>{draw();drawStills();}).observe($('stage'));
updateUI();draw();drawStills();if(playing)frame=requestAnimationFrame(tick);
