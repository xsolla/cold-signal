import { pilotGlyph, threatGlyph, makeFixture } from '../scene.js';
import { TAU, T, RINGS, pointAt, projectRadius, depthScale, enemySize, safeInWall } from '../baseline/rules.js';

export const treatments = {
  black: {name:'Black Signal', tag:'Precision under pressure', bg:'#080d11', field:'#111f28', line:'#334b58', muted:'#8babb9', paper:'#eff9ee', signal:'#abf8ce', danger:'#ff8b70', accent:'#b9c8ff', font:'monospace',
    grammar:'Open wireframes / segmented instruments / tight monospaced type', motion:'Long anticipation, fast radial separation, precise settling.', risk:'Fine detail needs restraint at inner depth.'},
  red: {name:'Red Shift', tag:'A crew running hot', bg:'#ed543e', field:'#ce4433', line:'#ad3e31', muted:'#6d2e29', paper:'#ffedcf', signal:'#fff2d6', danger:'#291c23', accent:'#1d2533', font:'Impact, sans-serif',
    grammar:'Solid cut planes / blunt masks / oversized compressed type', motion:'Opposing shutters, elastic overshoot, strong held poses.', risk:'Solid scenery must stay behind the active decision.'},
  blue: {name:'Cold Front', tag:'Energy held in glass', bg:'#101a3a', field:'#182a51', line:'#334678', muted:'#93a9d6', paper:'#eef7ff', signal:'#79e5ff', danger:'#ffaf91', accent:'#8d85ff', font:'Arial, sans-serif',
    grammar:'Prismatic ribbons / layered depth / outlined display type', motion:'Delayed sheets, smooth compression, a broad outward release.', risk:'Refraction is for transitions; targets retain a crisp single edge.'}
};
export const clips = [
  {id:'arrival', title:'Link established', words:['LINK','ESTABLISHED'], length:5, note:'Four separated signals arrive, hold, and lock into one crew.', use:'Room ready / run introduction'},
  {id:'surge', title:'Surge incoming', words:['SURGE','INCOMING'], length:4.8, note:'An iris gathers tension before the graphic field opens outward.', use:'Surge transition / promotional beat'},
  {id:'rescue', title:'No one left behind', words:['NO ONE','LEFT BEHIND'], length:5.5, note:'Two signals connect. A bracket closes its circuit, then releases.', use:'Rescue confirmation'},
  {id:'shockwave', title:'Make a way', words:['MAKE','A WAY'], length:4.5, note:'A compact wedge becomes a sector-wide release with a deliberate gap.', use:'Ivo ability / impact language'},
  {id:'laststand', title:'One remains', words:['ONE','REMAINS'], length:5.5, note:'The composition closes around one bright signal. Tension stays held.', use:'Last survivor / downed crew'},
  {id:'victory', title:'All make it out', words:['ALL MAKE','IT OUT'], length:5.2, note:'Four signals rise together as the surrounding structure separates.', use:'Shared victory / end card'}
];
export const fixture = makeFixture();
const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const out=x=>1-(1-clamp(x))**3;
const windowed=(p,a,b)=>clamp((p-a)/(b-a));
export function envelope(p) {
  p=clamp(Number.isFinite(p)?p:0);
  return {p, gather:smooth(windowed(p,.08,.40)), release:out(windowed(p,.39,.68)), fade:1-smooth(windowed(p,.82,1)), hold:windowed(p,.12,.35)};
}
function artEnvelope(key,p){
  const e=envelope(p);
  if(key==='red'){const x=windowed(e.p,.32,.70)-1;e.release=1+2.25*x*x*x+1.25*x*x;}
  if(key==='black')e.release=out(windowed(e.p,.42,.60));
  if(key==='blue')e.release=smooth(windowed(e.p,.43,.83));
  return e;
}
function ring(c,r,color,line=1,a=0,b=TAU){c.beginPath();c.arc(0,0,Math.max(.01,r),a,b);c.strokeStyle=color;c.lineWidth=line;c.stroke();}
function poly(c,pts,fill,stroke,line=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
function segment(c,r,width,start,end,color){c.beginPath();c.arc(0,0,r,start,end);c.lineWidth=width;c.lineCap='butt';c.strokeStyle=color;c.stroke();}
const colors=t=>({bg:t.bg,ink:t.paper,signal:t.signal,danger:t.danger});
function pilot(c,t,x,y,size=1,angle=0,down=false){c.save();c.translate(x,y);c.rotate(angle);pilotGlyph(c,'relay',{...colors(t),down},size,true);c.restore();}

function field(c,t,key,r=250,p=.48,quiet=false){
  const e=artEnvelope(key,p),gain=quiet ? .16 : 1;
  c.save();c.globalAlpha*=quiet ? .28 : 1;
  if(key==='black'){
    for(let i=0;i<32;i++){
      const a=i*TAU/32,ri=r*(.24+.08*e.gather),ro=r*(1.04+.11*e.release*gain);
      c.strokeStyle=i%4===0?t.muted:t.line;c.lineWidth=i%4===0?1.2:.65;
      c.beginPath();c.moveTo(Math.cos(a)*ri,Math.sin(a)*ri);c.lineTo(Math.cos(a)*ro,Math.sin(a)*ro);c.stroke();
      c.save();c.rotate(a);c.fillStyle=i%4===0?t.signal:t.line;c.fillRect(r*1.09,-1,i%4===0?12:4,2);c.restore();
    }
    for(const k of [.29,.49,.74,1]) ring(c,r*k,t.line,k===1?2:1);
    for(let i=0;i<6;i++) segment(c,r*(.87+.02*Math.sin(i)),5,i*TAU/6+.06,i*TAU/6+.24,t.muted);
  } else if(key==='red') {
    for(let i=0;i<8;i++){
      const a=i*TAU/8+.05,rr=r*(.68+.32*e.release*gain),inner=r*(.24+.1*e.gather);
      c.save();c.rotate(a);poly(c,[[inner,-9],[rr,-rr*.32],[rr,rr*.17],[inner,9]],i%2?t.line:t.field);c.restore();
    }
    ring(c,r*.89,t.accent,Math.max(2,r*.08),.08,TAU-.3);
    for(let i=0;i<4;i++){c.save();c.rotate(i*TAU/4);c.fillStyle=t.paper;c.fillRect(r*.93,-r*.065,r*.18,r*.13);c.restore();}
    ring(c,r*.41,t.accent,2);
  } else {
    for(let i=5;i>=0;i--){
      const delayed=envelope(clamp(p-i*.025));
      c.save();c.rotate(-.38+i*.1+(delayed.release-.5)*.12*gain);const rr=r*(.49+i*.105+(i%2?.04:-.02)*delayed.gather*gain);
      const g=c.createLinearGradient(-rr,-rr,rr,rr);g.addColorStop(0,i%2?t.accent:t.signal);g.addColorStop(.45,t.field);g.addColorStop(1,t.bg);
      c.globalAlpha*=(quiet ? .1 : .45)-i*.015;
      poly(c,[[-rr*.65,-rr],[rr*.67,-rr*.82],[rr,rr*.45],[rr*.38,rr],[-rr,rr*.22]],g);
      c.strokeStyle=i%2?t.accent:t.signal;c.lineWidth=1;c.beginPath();c.moveTo(-rr*.65,-rr);c.lineTo(rr*.67,-rr*.82);c.lineTo(rr,rr*.45);c.stroke();c.restore();
    }
    ring(c,r*.76,t.line,1);ring(c,r*.39,t.muted,1);
  }
  c.restore();
}

export function drawBoard(c,w,h,key){
  const t=treatments[key],s=w/420;c.save();c.scale(s,s);c.fillStyle=t.bg;c.fillRect(0,0,420,h/s);
  c.save();c.beginPath();c.rect(0,0,235,240);c.clip();c.translate(115,125);field(c,t,key,88,.55);pilot(c,t,0,-80,1);c.restore();
  c.fillStyle=t.muted;c.font='8px monospace';c.fillText('TUNNEL / SHAPE / VALUE',14,19);
  c.strokeStyle=t.line;c.beginPath();c.moveTo(236,0);c.lineTo(236,240);c.stroke();
  c.fillStyle=t.muted;c.fillText('PILOT / RESCUE',250,19);pilot(c,t,274,67,1.5);pilot(c,t,356,67,1.1,0,true);
  c.save();c.translate(264,124);threatGlyph(c,'relay','rush',colors(t),9);c.restore();
  c.save();c.translate(309,124);threatGlyph(c,'relay','flank',colors(t),9);c.restore();
  c.save();c.translate(356,124);threatGlyph(c,'relay','suppress',colors(t),9);c.restore();
  c.fillStyle=key==='red'?t.accent:t.field;c.fillRect(250,163,153,51);c.fillStyle=t.signal;c.font=`bold 20px ${t.font}`;c.fillText('RELAY / 01',259,185);c.font='8px monospace';c.fillText('LINK ACTIVE  ━━━━━',259,203);c.restore();
}

function setCanvas(canvas){
  const w=canvas.clientWidth,h=canvas.clientHeight,d=Math.min(devicePixelRatio||1,1.75),bw=Math.round(w*d),bh=Math.round(h*d);
  if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}
  const c=canvas.getContext('2d');c.setTransform(d,0,0,d,0,0);return {c,w,h};
}
export function renderBoard(canvas,key){const {c,w,h}=setCanvas(canvas);drawBoard(c,w,h,key);}

function motionEmblem(c,t,key,clip,p,r=220,calm=false){
  const e=artEnvelope(key,p),gain=calm ? .22 : 1;
  const tension=1-.12*e.gather+.32*e.release*gain;
  c.save();
  if(clip==='surge'){
    for(let i=0;i<12;i++){
      c.save();c.rotate(i*TAU/12+.04);const ri=r*(.30-.08*e.gather),ro=r*(.55+.7*e.release*gain);
      c.globalAlpha*=(.18+(i%3===0?.65:.12))*e.fade;
      if(key==='red')poly(c,[[ri,-4],[ro,-25],[ro,18],[ri,4]],i%2?t.paper:t.accent);
      else if(key==='blue'){const g=c.createLinearGradient(ri,0,ro,0);g.addColorStop(0,t.accent);g.addColorStop(1,t.signal);poly(c,[[ri,-2],[ro,-17],[ro,3],[ri,2]],g);}
      else {c.strokeStyle=i%3===0?t.signal:t.paper;c.lineWidth=i%3===0?3:1;c.beginPath();c.moveTo(ri,0);c.lineTo(ro,0);c.stroke();}
      c.restore();
    }
    ring(c,r*.31*tension,t.signal,5,-.2,Math.PI*.82);ring(c,r*.31*tension,t.paper,2,Math.PI+.14,TAU-.3);
    pilot(c,t,0,0,2.25);
  } else if(clip==='rescue'){
    const approach=out(windowed(p,.02,.42)),gap=100-55*approach;
    const progress=smooth(windowed(p,.25,.71));
    c.save();c.strokeStyle=t.signal;c.lineWidth=key==='red'?8:2;c.setLineDash([8,5]);c.beginPath();c.moveTo(-gap+14,0);c.lineTo(gap-14,0);c.stroke();c.restore();
    pilot(c,t,-gap,0,2.3,-.2);pilot(c,t,gap,0,2.3,.2,progress<.98);
    c.save();c.translate(gap,0);ring(c,62,t.signal,4,-Math.PI/2,-Math.PI/2+Math.max(.005,progress)*TAU);c.restore();
    if(p>.5){c.save();c.globalAlpha*=Math.max(0,1-e.release)*.6;ring(c,90+e.release*130,t.signal,2);c.restore();}
  } else if(clip==='arrival'||clip==='victory'){
    const settle=out(windowed(p,.05,.54));
    for(let i=0;i<4;i++){
      const a=-Math.PI/2+i*TAU/4,rr=clip==='arrival'?r*(1.4-settle*.86):r*(.48+e.release*.4*gain);
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr-(clip==='victory'?e.release*58*gain:0);
      c.save();c.globalAlpha*=.2+.8*settle;pilot(c,t,x,y,2,a+Math.PI/2);c.restore();
      c.save();c.strokeStyle=t.line;c.lineWidth=1;c.beginPath();c.moveTo(Math.cos(a)*40,Math.sin(a)*40);c.lineTo(x,y);c.stroke();c.restore();
    }
    ring(c,clip==='arrival'?65:90,t.signal,3,-Math.PI/2,-Math.PI/2+Math.max(.01,settle)*TAU);
    if(clip==='victory') {c.fillStyle=t.paper;c.font='bold 28px monospace';c.textAlign='center';c.fillText('04 / 04',0,10);}
  } else if(clip==='shockwave'){
    const rr=35+e.release*r*1.12*gain;
    for(let i=0;i<3;i++){c.save();c.globalAlpha*=(.8-i*.2)*e.fade;segment(c,Math.max(8,rr-i*18),key==='red'?14:4,-2.8,-.35,i%2?t.paper:t.signal);c.restore();}
    pilot(c,t,0,85,2.8);for(let i=0;i<5;i++){c.save();c.translate((i-2)*60,-80-e.release*60*gain);c.globalAlpha*=1-e.release*.9;threatGlyph(c,'relay',i%2?'flank':'rush',colors(t),14);c.restore();}
  } else {
    for(let i=0;i<4;i++){const a=-Math.PI/2+i*TAU/4,rr=r*(.65-.17*e.gather*gain);c.save();c.globalAlpha*=i===0?1:.4;pilot(c,t,Math.cos(a)*rr,Math.sin(a)*rr,2.3,a+Math.PI/2,i!==0);c.restore();}
    for(let i=0;i<4;i++)segment(c,r*(.96-.10*e.gather*gain),key==='red'?18:3,i*TAU/4+.16,(i+1)*TAU/4-.16,t.danger);
  }
  c.restore();
}

export function drawPoster(c,w,h,key,clipId,phase,calm=false){
  const t=treatments[key],clip=clips.find(x=>x.id===clipId)||clips[1],p=clamp(phase),e=envelope(p),sx=w/1200,sy=h/680;
  c.save();c.scale(sx,sy);c.fillStyle=t.bg;c.fillRect(0,0,1200,680);
  if(key==='red'){
    const shutter=(1-out(windowed(p,.04,.38)))*(calm?15:160);
    c.fillStyle=t.accent;c.globalAlpha=.16;
    poly(c,[[760-shutter,85],[1200,85],[1200,310],[630-shutter,310]],t.accent);
    poly(c,[[980+shutter,410],[1200,410],[1200,587],[800+shutter,587]],t.accent);c.globalAlpha=1;
  }
  const cx=key==='red'?852:840,cy=342;
  c.save();c.translate(cx,cy);field(c,t,key,260,p);motionEmblem(c,t,key,clip.id,p,205,calm);c.restore();
  // Display typography belongs to the cinematic study, never to the in-match HUD.
  c.save();c.beginPath();c.rect(38,115,620,445);c.clip();
  const enter=out(windowed(p,0,.25)),slide=calm?0:(1-enter)*90;
  const size=clip.words[1].length>10?99:clip.words[0].length>7?116:136;
  c.translate(0,slide);c.font=`900 ${size}px ${key==='black'?'Arial, sans-serif':'Impact, Arial Black, sans-serif'}`;c.textAlign='left';
  if(key==='blue'){c.lineWidth=1.4;c.strokeStyle=t.paper;c.strokeText(clip.words[0],40,288,580);c.fillStyle=t.signal;c.fillText(clip.words[1],40,416,580);}
  else {c.fillStyle=key==='red'?t.accent:t.paper;c.fillText(clip.words[0],40,288,580);c.fillStyle=key==='red'?t.paper:t.signal;c.fillText(clip.words[1],40,416,580);}
  c.restore();
  c.fillStyle=t.muted;c.font='11px monospace';c.textAlign='left';c.fillText('DELVE TOGETHER  /  VECTOR RELAY',40,42);c.textAlign='right';c.fillText(`MOTION STUDY  ${String(clips.indexOf(clip)+1).padStart(2,'0')} / 06`,1160,42);
  c.fillStyle=key==='red'?t.accent:t.muted;c.font='10px monospace';c.textAlign='left';c.fillText('FOUR PILOTS. ONE WAY THROUGH.',40,602);
  c.fillText(`${t.name.toUpperCase()} / ${e.p<.38?'ANTICIPATION':e.p<.69?'RELEASE':'SETTLE'}`,40,634);
  c.textAlign='right';c.fillText('THE ONLY WAY OUT IS TOGETHER',1160,634);
  c.strokeStyle=t.line;c.lineWidth=1;c.beginPath();c.moveTo(40,64);c.lineTo(1160,64);c.moveTo(40,615);c.lineTo(1160,615);c.stroke();
  // Cropped edge treatments change the composition, not the subject identity.
  if(key==='red'){c.fillStyle=t.accent;c.fillRect(0,90,10,460);c.fillRect(1190,90,10,460);}
  if(key==='blue'){c.strokeStyle=t.signal;c.lineWidth=2;c.beginPath();c.moveTo(1120,84);c.lineTo(1160,84);c.lineTo(1160,125);c.stroke();}
  c.restore();
}

export function renderPoster(canvas,key,clip,p,calm=false){const {c,w,h}=setCanvas(canvas);drawPoster(c,w,h,key,clip,p,calm);}

export function drawArena(c,w,h,key,clipId,phase,calm=false){
  const t=treatments[key],s=fixture,scale=Math.min(w,h)/690;
  c.save();c.fillStyle=t.bg;c.fillRect(0,0,w,h);c.translate(w/2,h*.53);c.scale(scale,scale);
  field(c,t,key,267,phase,true);
  c.save();c.globalAlpha=calm ? .06 : .13;motionEmblem(c,t,key,clipId,phase,205,calm);c.restore();
  RINGS.forEach((r,i)=>{ring(c,projectRadius(r),i===0?t.signal:t.muted,i===0?1.7:1);c.fillStyle=i===0?t.signal:t.muted;c.font='8px monospace';c.textAlign='left';c.fillText(`${3-i} / ${['INNER','MIDDLE','OUTER'][i]}`,Math.cos(-.45)*(projectRadius(r)+6),Math.sin(-.45)*(projectRadius(r)+6)-4);});
  c.fillStyle=t.bg;c.beginPath();c.arc(0,0,projectRadius(T.coreRadius),0,TAU);c.fill();
  for(const z of s.zones){c.save();c.setLineDash([4,4]);for(const r of [z.minRadius,z.maxRadius])ring(c,projectRadius(r),t.danger,1.5,z.angle-z.width/2,z.angle+z.width/2);c.restore();}
  const entities=[];
  for(const wall of s.walls)entities.push({radius:wall.radius,draw(){const r=projectRadius(wall.radius),ds=depthScale(wall.radius);for(let i=0;i<200;i++){const a=i*TAU/200;if(!safeInWall(wall,a+TAU/400))segment(c,r,10*ds,a,a+TAU/200+.002,t.paper);}for(const g of wall.gaps)for(const sign of [-1,1]){c.save();c.rotate(g.angle+sign*g.width/2);c.fillStyle=t.signal;c.fillRect(r-10*ds,-ds,20*ds,ds*2);c.restore();}}});
  for(const enemy of s.enemies)entities.push({radius:enemy.radius,draw(){const pt=pointAt(enemy.angle,enemy.radius),size=Math.max(enemy.radius<=T.coreRadius?2:0,enemySize(enemy)*depthScale(enemy.radius));c.save();c.translate(pt.x,pt.y);c.rotate(enemy.angle+Math.PI/2);c.scale(size/10,size/10);threatGlyph(c,'relay',enemy.type,colors(t),10);c.restore();if(enemy.mode==='patrol')ring(c,projectRadius(enemy.radius),t.danger,Math.max(.5,depthScale(enemy.radius)),enemy.angle-.15,enemy.angle+.15);}});
  for(const bullet of s.bullets)entities.push({radius:bullet.radius,draw(){const a=pointAt(bullet.angle,bullet.radius),b=pointAt(bullet.angle,bullet.radius+8);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle=bullet.owner===0?t.signal:t.paper;c.lineWidth=Math.max(.5,2.5*depthScale(bullet.radius));c.stroke();}});
  for(const ship of s.players)entities.push({radius:ship.radius,draw(){const pt=pointAt(ship.angle,ship.radius),ds=depthScale(ship.radius);pilot(c,{...t,signal:ship.id===0||ship.down?t.signal:t.paper},pt.x,pt.y,ds,ship.angle+Math.PI/2,ship.down);const lr=projectRadius(ship.radius)+18*Math.max(.6,ds);c.font='9px monospace';c.textAlign='center';c.fillStyle=ship.down?t.danger:t.paper;c.fillText(ship.down?'P2 RESCUE 50%':`P${ship.id+1} ${ship.id===0?'YOU':['MARA','IVO','SANA','ROOK'][ship.id]}`,Math.cos(ship.angle)*lr,Math.sin(ship.angle)*lr+(Math.sin(ship.angle)>0?10:-5));}});
  entities.sort((a,b)=>a.radius-b.radius).forEach(x=>x.draw());ring(c,projectRadius(T.coreRadius),t.muted,1);ring(c,3,t.danger,.8);c.restore();
  const k=w/1200;c.save();c.scale(k,k);const hh=h/k;
  c.fillStyle=t.paper;c.font='bold 13px Arial';c.textAlign='left';c.fillText('DELVE TOGETHER',30,31);
  c.fillStyle=t.muted;c.font='9px monospace';c.textAlign='right';c.fillText('LOCAL SESSION     SOUND OFF     REDUCE MOTION',1170,31);
  c.strokeStyle=t.line;c.beginPath();c.moveTo(30,48);c.lineTo(1170,48);c.stroke();
  c.textAlign='left';c.fillStyle=t.muted;c.font='9px monospace';c.fillText('SURVIVE THE SURGE',30,77);
  c.fillStyle=t.paper;c.font='bold 35px monospace';c.fillText('01:18',30,116);c.fillStyle=t.muted;c.font='11px monospace';c.fillText('/ 03:00',135,114);
  c.fillStyle=t.signal;c.font='10px monospace';c.fillText('PRESSURE · 0.5×',30,138);
  c.textAlign='right';c.fillStyle=t.paper;c.fillText('ROOM DEMO01      LEAVE',1170,77);
  c.fillStyle=t.signal;c.fillText('▲ P1 YOU   ◇ P2 DOWN INNER   ⬟ P3 SANA   ⬡ P4 ROOK',1170,104);
  c.fillStyle=t.paper;c.fillText('TEAM SCORE  017350',1170,129);
  c.strokeStyle=t.line;c.beginPath();c.moveTo(30,hh-52);c.lineTo(1170,hh-52);c.stroke();
  c.textAlign='left';c.fillStyle=t.muted;c.font='10px monospace';c.fillText('A D  ORBIT     W S  DEPTH     SPACE  ABILITY     ◇ SAME RING TO RESCUE',30,hh-25);
  c.textAlign='right';c.fillStyle=t.signal;c.fillText('BULWARK  READY     ━━━━━━━',1170,hh-25);c.restore();
}
export function renderArena(canvas,key,clip,p,calm=false){const {c,w,h}=setCanvas(canvas);drawArena(c,w,h,key,clip,p,calm);}
