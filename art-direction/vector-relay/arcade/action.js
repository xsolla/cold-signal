import { treatments } from '../studies.js';
import { pilotGlyph, threatGlyph } from '../../scene.js';
import { TAU, RINGS, projectRadius, depthScale, pointAt } from '../../baseline/rules.js';

const paletteKeys = ['bg','field','line','muted','paper','signal','danger','accent'];
export const direction = Object.freeze({ ...treatments.black,
  ...Object.fromEntries(paletteKeys.map(key => [key, treatments.blue[key]])), name:'Cold Signal' });
export const presets = {
  crossfire:{name:'Crossfire',duration:16,rate:5.5,travel:1,shots:.095,burstTimes:[2.6,7.0,11.4],description:'Four pilots, crossing depths, sustained fire, hard impacts.'},
  overdrive:{name:'Overdrive',duration:14,rate:15,travel:1.85,shots:.055,burstTimes:[1.8,4.0,6.2,8.4,10.6,12.8],description:'Denser waves, tighter cuts, rapid chain detonations.'},
  rescue:{name:'Rescue rush',duration:16,rate:5.6,travel:1.12,shots:.085,burstTimes:[2.0,5.9,10.8],description:'Fight through the wave, reach the downed pilot, release the rescue burst.'}
};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const fract=x=>x-Math.floor(x);
const rnd=n=>fract(Math.sin(n*127.1+311.7)*43758.5453123);
const lerp=(a,b,t)=>a+(b-a)*t;
const colors={bg:direction.bg,ink:direction.paper,signal:direction.signal,danger:direction.danger};

// Editorial choreography for motion evaluation, not a gameplay simulation.
export function playerAt(preset,id,time){
  const p=presets[preset],t=time*p.travel;
  let angle=-Math.PI/2+id*TAU/4+t*.65+Math.sin(t*1.5+id*1.6)*.7;
  const step=Math.floor((t+id*.9)/2.2),phase=fract((t+id*.9)/2.2),ring=[2,1,2,0,1,2][((step%6)+6)%6];
  const prior=[2,1,2,0,1,2][(((step-1)%6)+6)%6];
  let radius=lerp(RINGS[prior],RINGS[ring],smooth(phase/.16)),down=false,rescue=0;
  if(preset==='rescue' && id===1 && time<6){angle=1.0;radius=RINGS[2];down=true;rescue=smooth((time-4.3)/1.4);}
  if(preset==='rescue' && id===0 && time>2.8 && time<6.15){
    const f=smooth((time-2.8)/1.45);angle=lerp(angle, .86, f);radius=lerp(radius,RINGS[2],f);
  }
  if(preset==='rescue' && ((id===1&&time>=6&&time<6.8)||(id===0&&time>=6.15&&time<7.1))){
    const start=id===1?6:6.15,end=id===1?6.8:7.1,anchor=id===1?1:.86,f=smooth((time-start)/(end-start));
    angle=anchor+Math.atan2(Math.sin(angle-anchor),Math.cos(angle-anchor))*f;radius=lerp(RINGS[2],radius,f);
  }
  return {id,angle,radius,ring,down,rescue};
}

export function createShow(preset='crossfire'){
  const config=presets[preset],enemies=[];
  function add(id,kill,owner,burst=false){
    if(preset==='rescue'&&owner===1&&kill<6.2)owner=2;
    const ship=playerAt(preset,owner,kill-.13),radius=Math.min(ship.radius-18,145+rnd(id+7)*60);
    const flight=(ship.radius-radius)/880,shot=kill-flight;
    const aim=playerAt(preset,owner,shot);
    const hitRadius=Math.max(48,aim.radius-flight*880);
    enemies.push({id,owner,kill,shot,spawn:kill-(1.6+rnd(id+4)*1.1)/config.travel,
      angle:aim.angle,radius:hitRadius,kind:['rush','rush','flank','skimmer','suppress','stalker'][id%6],burst});
  }
  let id=0;
  for(let t=-1.4;t<config.duration;t+=1/config.rate)add(++id,t+(rnd(id)*.07),id%4);
  for(const t of config.burstTimes)for(let j=0;j<8;j++)add(++id,t+j*.022,j%4,true);
  enemies.sort((a,b)=>a.kill-b.kill);
  return {preset,config,enemies};
}

export function sample(show,time,manualKills=[],manualPulses=[]){
  const t=clamp(Number.isFinite(time)?time:0,0,show.config.duration),dead=new Set(manualKills.filter(x=>x.time<=t).map(x=>x.id));
  const players=Array.from({length:4},(_,id)=>playerAt(show.preset,id,t));
  const enemies=show.enemies.filter(e=>t>=e.spawn&&t<e.kill&&!dead.has(e.id)).map(e=>{
    const f=clamp((t-e.spawn)/(e.kill-e.spawn));
    return {...e,radius:lerp(18,e.radius,f),angle:e.angle+Math.sin((1-f)*Math.PI)*.2*(e.id%2?1:-1)};
  });
  const hits=show.enemies.filter(e=>e.kill<=t&&e.kill>t-.62&&!dead.has(e.id)).map(e=>({...e,time:e.kill,age:t-e.kill}));
  for(const hit of manualKills)if(t>=hit.time&&t<hit.time+.62)hits.push({...hit,age:t-hit.time,burst:true});
  const pulses=[...show.config.burstTimes,...manualPulses];
  if(show.preset==='rescue')pulses.push(6.0);
  const activePulses=pulses.filter(x=>t>=x&&t<x+.7).map(time=>({time,age:t-time}));
  const completed=show.enemies.filter(e=>e.kill>=0&&e.kill<=t&&!dead.has(e.id)).length+manualKills.filter(e=>e.time<=t).length;
  return {time:t,players,enemies,hits,pulses:activePulses,score:completed*100,combo:completed?Math.min(99,4+Math.floor(completed/2)):0};
}

function ring(c,r,color,width=1,start=0,end=TAU){
  c.beginPath();c.arc(0,0,Math.max(.01,r),start,end);c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function line(c,x1,y1,x2,y2,color,width=1){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function text(c,value,x,y,size,color,align='left',bold=false){c.font=`${bold?'bold ':''}${size}px ui-monospace, SFMono-Regular, Consolas, monospace`;c.fillStyle=color;c.textAlign=align;c.fillText(value,x,y);}
function drawPilot(c,ship,alpha=1){
  const pt=pointAt(ship.angle,ship.radius),scale=Math.max(.48,depthScale(ship.radius)),t=direction;
  c.save();c.globalAlpha*=alpha;c.translate(pt.x,pt.y);c.rotate(ship.angle+Math.PI/2);
  const color=ship.id===0?t.signal:ship.id===2?t.accent:t.paper;
  pilotGlyph(c,'relay',{...colors,signal:color,down:ship.down},scale,true,ship.id);
  if(ship.down){
    ring(c,23*scale,t.bg,4.5*scale);
    ring(c,23*scale,t.signal,3*scale,-Math.PI/2,-Math.PI/2+Math.max(.002,ship.rescue)*TAU);
  }
  c.restore();
}

function tunnel(c,t,travel,calm){
  const p=direction;
  const fog=c.createRadialGradient(0,0,18,0,0,330);fog.addColorStop(0,p.field);fog.addColorStop(1,p.bg);
  c.fillStyle=fog;c.beginPath();c.arc(0,0,330,0,TAU);c.fill();
  for(let i=0;i<32;i++){
    const a=i*TAU/32;
    c.save();c.globalAlpha=i%4===0?.5:.6;line(c,Math.cos(a)*24,Math.sin(a)*24,Math.cos(a)*330,Math.sin(a)*330,i%4===0?p.muted:p.line,i%4===0?1.3:.7);c.restore();
  }
  for(let i=0;i<14;i++){
    const f=fract(i/14+(calm?0:t*.65*travel));
    c.save();c.globalAlpha=.12+f*.18;ring(c,26+f*f*302,p.line,Math.max(.5,f*1.3));c.restore();
  }
  for(let i=0;i<60;i++){
    const a=i*TAU/60,r=278;
    line(c,Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(i%5===0?292:282),Math.sin(a)*(i%5===0?292:282),i%5===0?p.muted:p.line,i%5===0?1.5:.8);
  }
  RINGS.forEach((r,i)=>{ring(c,projectRadius(r),i===2?p.muted:p.line,i===2?1.3:1);});
  for(let i=0;i<28;i++){
    const f=fract(t*(calm?.4:1.5)*travel+rnd(i)),a=rnd(i+43)*TAU,r=28+f*f*300;
    c.save();c.globalAlpha=f*.38;line(c,Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(r+8+f*27),Math.sin(a)*(r+8+f*27),i%4===0?p.signal:p.accent,.7+f);c.restore();
  }
  c.fillStyle=p.bg;c.beginPath();c.arc(0,0,projectRadius(44),0,TAU);c.fill();
  ring(c,projectRadius(44),p.muted,1);ring(c,4,p.signal,1.5);
}

function wall(c,time,config,index){
  const p=direction,age=fract((time+index*1.6)/4.4),radius=lerp(315,38,age),scale=depthScale(Math.min(240,radius));
  const gap=time*.36+index*2.6,width=1.0;
  c.save();c.globalAlpha=.7;ring(c,projectRadius(radius),p.accent,Math.max(2,7*scale),gap+width/2,gap+TAU-width/2);
  for(const s of [-1,1]){const a=gap+s*width/2,r=projectRadius(radius);line(c,Math.cos(a)*(r-10),Math.sin(a)*(r-10),Math.cos(a)*(r+10),Math.sin(a)*(r+10),p.signal,2);}
  c.restore();
}

function shot(c,angle,radius,color,width=1.6){
  const a=pointAt(angle,radius),b=pointAt(angle,radius+26),tail=pointAt(angle,radius+65);
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.3;line(c,b.x,b.y,tail.x,tail.y,color,width*2);c.globalAlpha=1;line(c,a.x,a.y,b.x,b.y,color,width);c.restore();
}

function explosion(c,hit,calm){
  const p=direction,pt=pointAt(hit.angle,hit.radius),age=hit.age,d=age/.62,fade=(1-d)**2;
  c.save();c.translate(pt.x,pt.y);c.globalCompositeOperation='lighter';
  c.globalAlpha=clamp(fade*.9);ring(c,5+age*83,p.signal,Math.max(.4,2.5*(1-d)));
  if(age<.09){c.globalAlpha=(1-age/.09)*.8;line(c,-13,0,13,0,p.paper,2);line(c,0,-13,0,13,p.paper,2);}
  const count=calm?8:20;
  for(let i=0;i<count;i++){
    const a=rnd(hit.id*13+i)*TAU,speed=45+rnd(hit.id*7+i)*210,r=speed*age;
    c.globalAlpha=clamp(fade*(.35+rnd(i+hit.id)*.65));
    const len=2+(1-d)*9;
    line(c,Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(r+len),Math.sin(a)*(r+len),i%3===0?p.danger:i%2?p.accent:p.signal,i%4===0?2.5:1.1);
  }
  c.restore();
}

export function drawArcade(c,width,height,show,time,{camera=true,calm=false,manualKills=[],manualPulses=[]}={}){
  const p=direction,frame=sample(show,time,manualKills,manualPulses),t=frame.time;
  c.save();c.fillStyle=p.bg;c.fillRect(0,0,width,height);
  const scale=Math.min(width/650,height/560)*1.04,cx=width/2,cy=height*.52;
  const impact=Math.min(1,frame.hits.reduce((m,h)=>Math.max(m,Math.exp(-h.age*18)*.36),0)+frame.pulses.reduce((m,x)=>Math.max(m,Math.exp(-x.age*12)),0));
  const punch=camera&&!calm?impact:0;
  c.save();c.translate(cx+Math.sin(t*131)*punch*5,cy+Math.cos(t*157)*punch*4);c.scale(scale*(1+punch*.025),scale*(1+punch*.025));
  tunnel(c,t,show.config.travel,calm);
  wall(c,t,show.config,0);if(show.preset==='overdrive')wall(c,t,show.config,1);
  for(let owner=0;owner<4;owner++)for(let i=0;i<7;i++){
    const age=fract(t/show.config.shots)*show.config.shots+i*show.config.shots,ship=playerAt(show.preset,owner,t-age),r=ship.radius-880*age;
    if(!ship.down&&r>46)shot(c,ship.angle,r,owner===0?p.signal:owner===2?p.accent:p.paper,Math.max(.8,2*depthScale(r)));
  }
  for(const e of show.enemies){
    if(t>=e.shot&&t<e.kill){
      const ship=playerAt(show.preset,e.owner,e.shot),r=ship.radius-(t-e.shot)*880;
      if(r>44)shot(c,e.angle,r,p.signal,2.2);
    }
  }
  for(const e of frame.enemies){
    const pos=pointAt(e.angle,e.radius),size=Math.max(6.5,15*depthScale(e.radius));
    c.save();c.translate(pos.x,pos.y);c.rotate(e.angle+Math.PI/2);c.scale(size/10,size/10);
    threatGlyph(c,'relay',e.kind,{...colors,ink:e.kind==='rush'?p.paper:p.danger,danger:p.danger},10);c.restore();
    const tail=pointAt(e.angle,e.radius-16);c.save();c.globalAlpha=.28;line(c,tail.x,tail.y,pos.x,pos.y,p.danger,1);c.restore();
  }
  for(const pulse of frame.pulses){
    const a=pulse.age/.7;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-a)*.6;
    ring(c,20+a*310,p.signal,6*(1-a)+.5,-.2,TAU-1.0);
    ring(c,12+a*275,p.accent,2,1.0,TAU+.3);c.restore();
    if(pulse.age<.3){text(c,'SECTOR CLEAR',0,-34-pulse.age*30,12,p.signal,'center',true);}
  }
  frame.hits.forEach(hit=>explosion(c,hit,calm));
  for(const ship of frame.players){
    if(!ship.down)for(let i=calm?2:7;i>=1;i--)drawPilot(c,playerAt(show.preset,ship.id,t-i*.025),(.12-i*.012));
    drawPilot(c,ship);
    const pos=pointAt(ship.angle,ship.radius),ds=depthScale(ship.radius);
    const label=ship.down?`P2 RESCUE ${Math.round(ship.rescue*100)}%`:`P${ship.id+1}`;
    text(c,label,pos.x,pos.y+Math.max(17,23*ds),8,ship.down?p.danger:p.muted,'center');
  }
  const recent=frame.hits.filter(h=>h.age<.4&&h.time>=0);
  for(const hit of recent.slice(-4)){const pt=pointAt(hit.angle,hit.radius);c.save();c.globalAlpha=1-hit.age/.4;text(c,'+100',pt.x+12,pt.y-12-hit.age*35,9,p.signal);c.restore();}
  if(show.preset==='rescue'&&t>=6&&t<7.1){c.save();c.globalAlpha=1-smooth((t-6.5)/.6);text(c,'BACK IN THE FIGHT',0,116,20,p.signal,'center',true);c.restore();}
  c.restore();
  // Screen-space HUD remains crisp while the world receives bounded camera punch.
  const compact=width<650,pad=compact?16:28;
  text(c,'DELVE TOGETHER',pad,30,compact?10:13,p.paper,'left',true);
  text(c,'VECTOR RELAY / COLD SIGNAL',pad,49,compact?7:9,p.muted);
  text(c,'TEAM SCORE',pad,89,8,p.muted);text(c,String(frame.score).padStart(6,'0'),pad,115,compact?22:31,p.paper,'left',true);
  text(c,`CHAIN ×${String(frame.combo).padStart(2,'0')}`,width-pad,89,compact?15:26,p.signal,'right',true);
  text(c,show.config.name.toUpperCase(),width-pad,111,9,p.muted,'right');
  const down=frame.players.filter(x=>x.down).length;
  text(c,down?'03 ACTIVE / 01 DOWN':'04 ACTIVE / AUTO FIRE',width-pad,30,compact?7:9,down?p.danger:p.muted,'right');
  for(let i=0;i<4;i++){c.fillStyle=frame.players[i].down?p.danger:i===0?p.signal:i===2?p.accent:p.paper;c.fillRect(width-pad-59+i*16,43,10,3);}
  line(c,pad,height-42,width-pad,height-42,p.line,1);
  text(c,'SPACE / SHOCKWAVE',pad,height-23,compact?8:10,p.signal);
  text(c,'BLACK SIGNAL STRUCTURE × COLD FRONT PALETTE',width-pad,height-23,compact?5:8,p.muted,'right');
  c.restore();return frame;
}

export function renderArcade(canvas,show,time,options={}){
  const d=Math.min(devicePixelRatio||1,1.5),w=canvas.clientWidth,h=canvas.clientHeight;
  const bw=Math.round(w*d/2)*2,bh=Math.round(h*d/2)*2;
  if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}
  const c=canvas.getContext('2d');c.setTransform(d,0,0,d,0,0);return drawArcade(c,w,h,show,time,options);
}
