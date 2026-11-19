import { presets,createShow,sample,renderArcade } from './action.js';
import { ArcadeSound } from './audio.js';
const $=id=>document.getElementById(id),canvas=$('action'),sound=new ArcadeSound();
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let preset='overdrive',show=createShow(preset),time=1.25,playing=true,last=null,raf=0,manualKills=[],manualPulses=[],hitstop=0,lastBurst=-1;
let camera=!motion.matches,calm=false;
function draw(){
  const state=renderArcade(canvas,show,time,{camera,calm,manualKills,manualPulses});
  $('timeline').value=String(time/show.config.duration*100);$('clock').value=`${time.toFixed(1).padStart(4,'0')} / ${show.config.duration.toFixed(1)}`;
  if(playing)sound.frame(time,state.hits);return state;
}
function ui(){
  document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===preset)));
  $('play').textContent=playing?'Pause':'Play';$('play').setAttribute('aria-pressed',String(playing));
  $('camera').setAttribute('aria-pressed',String(camera));$('sound').setAttribute('aria-pressed',String(sound.enabled));$('sound').textContent=sound.enabled?'Sound on':'Sound off';
  $('live').textContent=playing?'LIVE MOTION PREVIEW':'PAUSED / SCRUB TO INSPECT';$('description').textContent=show.config.description;
  canvas.setAttribute('aria-label',`${show.config.name}: Black Signal geometry with Cold Front colors; moving pilots, rapid fire, enemy waves, and impact fragments.`);
}
function tick(now){if(!playing)return;const dt=last===null?0:Math.min((now-last)/1000,.06);last=now;if(hitstop>0)hitstop-=dt;else time+=dt;if(time>=show.config.duration){time%=show.config.duration;manualKills=[];manualPulses=[];sound.reset();lastBurst=-1;}const state=draw();const burst=state.pulses.find(x=>x.time!==lastBurst&&x.age<.05);if(burst){lastBurst=burst.time;hitstop=.035;}raf=requestAnimationFrame(tick);}
function stop(){playing=false;cancelAnimationFrame(raf);last=null;sound.suspend();ui();}
function start(){if(playing)return;playing=true;last=null;sound.resume().catch(()=>{});ui();raf=requestAnimationFrame(tick);}
function reset(key=preset){preset=key;show=createShow(key);time=1.25;manualKills=[];manualPulses=[];hitstop=0;lastBurst=-1;sound.reset();last=null;ui();draw();}
function pulse(){
  if(!playing)start();const state=sample(show,time,manualKills,manualPulses);manualPulses.push(time);
  const pending=new Set(manualKills.map(hit=>hit.id));
  const targets=state.enemies.filter(e=>!pending.has(e.id)).sort((a,b)=>b.radius-a.radius).slice(0,9);
  targets.forEach((e,i)=>manualKills.push({id:e.id,time:time+i*.012,angle:e.angle,radius:e.radius}));
  $('feedback').textContent=`Shockwave released: ${targets.length} targets.`;sound.pulse();draw();
}
$('play').onclick=()=>playing?stop():start();$('replay').onclick=()=>{reset();start();};$('pulse').onclick=pulse;
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{reset(b.dataset.preset);start();});
$('timeline').oninput=()=>{stop();time=Number($('timeline').value)/100*show.config.duration;manualKills=[];manualPulses=[];draw();};
$('camera').onclick=()=>{camera=!camera;ui();draw();};
$('sound').onclick=async()=>{try{await sound.toggle();if(!playing)sound.suspend();ui();}catch{$('sound').textContent='Audio unavailable';}};
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.target.matches('button,input,a')){e.preventDefault();pulse();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
motion.addEventListener('change',e=>{if(e.matches){camera=false;calm=true;ui();draw();}});
new ResizeObserver(draw).observe(canvas);ui();draw();raf=requestAnimationFrame(tick);

// Recording is a user-triggered, local export of this canvas; no upload occurs.
let recording=null;
$('record').onclick=()=>{
  if(recording||!canvas.captureStream||typeof MediaRecorder==='undefined')return;
  reset();start();
  const stream=canvas.captureStream(30),chunks=[];
  const mime=['video/mp4','video/webm;codecs=vp8','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:3000000});recording=rec;
  $('record').disabled=true;$('record').textContent='Recording…';
  rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  rec.onstop=()=>{
    stream.getTracks().forEach(track=>track.stop());
    const blob=new Blob(chunks,{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`cold-signal-${preset}.${mime.startsWith('video/mp4')?'mp4':'webm'}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
    recording=null;$('record').disabled=false;$('record').textContent='Save 8s clip';
  };
  rec.start();setTimeout(()=>{if(rec.state==='recording')rec.stop();},8000);
};
if(!canvas.captureStream||typeof MediaRecorder==='undefined'){$('record').disabled=true;$('record').textContent='Clip export unavailable';}
