import { T, RINGS, TAU, makeMatch, projectRadius, depthScale, pointAt, enemySize, safeInWall } from './baseline/rules.js';

export const looks = {
  baseline: { name: 'Current game', bg: '#10120f', field: '#1b2218', rail: '#a4b296', grid: '#3a4735', ink: '#eeeee5', signal: '#d4f45b', danger: '#ff826a', type: 'monospace' },
  relay: { name: 'Vector Relay', bg: '#080f16', field: '#101f2b', rail: '#536d7c', grid: '#203647', ink: '#ecf3eb', signal: '#9ff9d2', danger: '#ff927c', type: 'monospace',
    grammar: 'Forked pilots · open vectors · instrument marks',
    personality: 'A coordinated rescue signal in a dark, precise machine.',
    risk: 'Fine inner-rail strokes need calibration. Keep background markings quiet.',
    note: 'Open, two-pronged pilot contours contrast with solid threat wedges. The rescue uses an open circular bracket and paired bars. Sparse range marks keep the machine precise without making the arena a luminous grid.' },
  hull: { name: 'Pressure Hull', bg: '#171312', field: '#29201c', rail: '#987d6e', grid: '#49382e', ink: '#f3e7da', signal: '#ffb38d', danger: '#ff7167', type: 'Arial',
    grammar: 'Clamp-shaped pilots · solid plates · stencil cuts',
    personality: 'Heavy salvage equipment inside a failing pressure shaft.',
    risk: 'Large background plates can compete with the moving wall. Keep them dark.',
    note: 'Blunt U-shaped rescue craft, broad plate masses, and cut corners suggest physical equipment. Moving wall segments stay much brighter than the shaft. A downed craft becomes a broken round lifebuoy, with progress on its own outer arc.' },
  resonance: { name: 'Elastic Current', bg: '#f3efdf', field: '#e9e3d4', rail: '#8e8793', grid: '#d1c9c0', ink: '#201c2d', signal: '#5941ba', danger: '#ba3b2a', type: 'Georgia',
    grammar: 'Swept pilots · ivory field · interrupted wave forms',
    personality: 'An ink-sharp chamber that gathers and releases elastic energy.',
    risk: 'Curved symbols converge at small sizes; avoid glow and secondary rings.',
    note: 'Pilots use swept open fins; threats use filled ink cores on an ivory field. Long paired arcs replace radial spokes. This takes fluid shape change and strong light/dark framing from the iQOO reference without reproducing its logo or characters. Curved forms remain the riskiest candidate at inner depth.' }
};

// Deliberately constructed, not a capture of a natural play session.
export function makeFixture() {
  const s = makeMatch(17321, { count: 4, timeScale: .5 });
  Object.assign(s, { time: 39, elapsed: 78, score: 17350, phase: 'PRESSURE' });
  const positions = [[-.92, 0], [-.76, 0], [2.22, 2], [3.75, 1]];
  s.players.forEach((p, i) => Object.assign(p, { angle: positions[i][0], ring: positions[i][1], radius: RINGS[positions[i][1]], prevRadius: RINGS[positions[i][1]], protection: 0 }));
  Object.assign(s.players[1], { down: true, rescue: T.rescueSeconds * .5 });
  s.enemies = [
    { type: 'rush', angle: -1.7, radius: 146 },
    { type: 'rush', angle: 2.05, radius: 202 },
    { type: 'flank', angle: .68, radius: 190 },
    { type: 'suppress', angle: 2.75, radius: 136 },
    { type: 'skimmer', angle: .03, radius: RINGS[1], mode: 'patrol', ring: 1 },
    { type: 'stalker', angle: 4.2, radius: RINGS[0], mode: 'patrol', ring: 0 },
    { type: 'rush', angle: .7, radius: 26, preview: 1 }
  ].map((e, i) => ({ id: 10 + i, hp: 1, ...e }));
  s.walls = [{ id: 20, radius: 92, gaps: [{ angle: -.85, width: 1.1 }, { angle: 2.7, width: .7 }] }];
  s.zones = [{ id: 21, angle: .2, minRadius: RINGS[0], maxRadius: RINGS[1], width: .38, age: .8, warn: 2.4, life: 1 }];
  s.bullets = [
    { owner: 0, angle: -.92, radius: 100 }, { owner: 0, angle: -.92, radius: 59 },
    { owner: 2, angle: 2.22, radius: 213 }, { owner: 2, angle: 2.22, radius: 164 },
    { owner: 3, angle: 3.75, radius: 152 }
  ];
  return s;
}

function path(c, points, fill, stroke, line = 1) {
  c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = line; c.stroke(); }
}
function polygon(c, radius, n, angle, fill, stroke, line = 1) {
  path(c, Array.from({length:n}, (_,i) => [Math.cos(angle+i*TAU/n)*radius,Math.sin(angle+i*TAU/n)*radius]), fill, stroke, line);
}
function arc(c, r, color, line = 1, start = 0, end = TAU) {
  c.beginPath(); c.arc(0,0,r,start,end); c.lineWidth=line; c.strokeStyle=color; c.stroke();
}

export function pilotGlyph(c, key, p, scale = 1, revised = true, character = 0) {
  c.save(); c.scale(scale, scale); c.lineJoin = 'miter'; c.lineCap = 'butt';
  if (p.down) {
    if (revised) {
      arc(c, 13, p.danger, key === 'hull' ? 5 : 2.5, -.34, Math.PI - .34);
      arc(c, 13, p.danger, key === 'hull' ? 5 : 2.5, Math.PI + .34, TAU - .34);
      c.fillStyle = p.ink; c.fillRect(-5,-4,3,8); c.fillRect(2,-4,3,8);
    } else {
      polygon(c,15,4,Math.PI/4,p.bg,p.danger,2);
      path(c,[[-5,-5],[5,5],[0,0],[5,-5],[-5,5]],null,p.danger,2);
    }
    arc(c,23,p.signal,3,-Math.PI/2,Math.PI/2);
  } else {
    if (key === 'relay') path(c,[[-12,11],[-10,-11],[-4,-4],[0,4],[4,-4],[10,-11],[12,11],[5,8],[0,12],[-5,8]],p.signal,null);
    if (key === 'hull') path(c,[[-12,-11],[-5,-11],[-5,2],[5,2],[5,-11],[12,-11],[12,9],[8,12],[-8,12],[-12,9]],p.signal,null);
    if (key === 'resonance') {
      c.strokeStyle=p.signal; c.lineWidth=4;
      for(const sign of [-1,1]) { c.beginPath();c.moveTo(sign*12,-9);c.quadraticCurveTo(sign*12,7,sign*2,12);c.stroke(); }
      path(c,[[0,-8],[4,-2],[0,3],[-4,-2]],p.signal,null);
    }
    // Class motif is distinct from the common friendly craft contour.
    polygon(c,2.7,3+character,Math.PI/2,p.bg,null);
  }
  c.restore();
}

export function threatGlyph(c, key, kind, p, size = 10) {
  const n = {rush:3,flank:4,suppress:6,skimmer:4,stalker:3}[kind];
  const angle = ['skimmer','flank'].includes(kind) ? Math.PI/4 : -Math.PI/2;
  const patrol = ['skimmer','stalker'].includes(kind), color = patrol ? p.danger : p.ink;
  if (key === 'resonance' && kind === 'suppress') {
    arc(c,size,color,2.5,.15,TAU-.5); polygon(c,size*.4,3,angle,p.danger,null); return;
  }
  if (key === 'hull') {
    polygon(c,size,n,angle,color,null);
    c.fillStyle=p.bg; c.fillRect(-size*.65,-1.8,size*1.3,3.6);
  } else {
    polygon(c,size,n,angle,kind === 'rush' ? color : p.bg,kind === 'rush' ? null : color,2);
    if (kind !== 'rush') polygon(c,size*.33,kind === 'suppress' ? 3 : n,angle,color,null);
  }
  if (kind === 'stalker') { c.fillStyle=p.bg;c.fillRect(-size,-size*.15,size*.7,size*.3); }
}

function tunnel(c, key, p, own) {
  const core=projectRadius(T.coreRadius);
  c.fillStyle=p.field;c.beginPath();c.arc(0,0,268,0,TAU);c.fill();
  if(key === 'hull') {
    for(let i=0;i<12;i++) {
      const a=i*TAU/12+.04,b=(i+1)*TAU/12-.04;
      c.fillStyle=i%2 ? '#30291f' : '#241f19';c.beginPath();c.arc(0,0,267,a,b);c.arc(0,0,core,b,a,true);c.closePath();c.fill();
      c.save();c.rotate(a);c.fillStyle=p.grid;c.fillRect(245,-2,10,4);c.restore();
    }
  } else if(key === 'relay') {
    for(let i=0;i<16;i++) {
      const a=i*TAU/16;c.strokeStyle=p.grid;c.lineWidth=.7;c.beginPath();c.moveTo(Math.cos(a)*core,Math.sin(a)*core);c.lineTo(Math.cos(a)*268,Math.sin(a)*268);c.stroke();
    }
    for(let i=0;i<48;i++) {c.save();c.rotate(i*TAU/48);c.fillStyle=i%4===0?p.rail:p.grid;c.fillRect(271,-.4,i%4===0?8:3,.8);c.restore();}
  } else {
    for(const r of [56,92,153,216,267]) {
      arc(c,r,p.grid,1,.05,TAU-.4);arc(c,r+3,p.grid,.6,.3,TAU-.7);
    }
  }
  RINGS.forEach((r,i)=>{
    const active=own?.ring===i, radius=projectRadius(r);
    arc(c,radius,active?p.signal:p.rail,active?1.7:1);
    if(key==='hull') {
      c.save();c.setLineDash([3,13]);arc(c,radius+4,p.grid,2);c.restore();
    }
    c.fillStyle=active?p.signal:p.rail;c.font='8px monospace';c.textAlign='left';
    c.fillText(`${3-i} / ${['INNER','MIDDLE','OUTER'][i]}`,Math.cos(-.45)*(radius+6),Math.sin(-.45)*(radius+6)-4);
  });
  c.fillStyle=p.bg;c.beginPath();c.arc(0,0,core,0,TAU);c.fill();
}

export function paintWorld(c, width, height, key, state, { labels = true, revised = true } = {}) {
  const p=looks[key];c.save();c.fillStyle=p.bg;c.fillRect(0,0,width,height);
  const scale=Math.min(width,height)/690;
  c.translate(width/2,height*.53);c.scale(scale,scale);tunnel(c,key,p,state.players[0]);
  for(const z of state.zones) {
    c.save();c.strokeStyle=p.danger;c.lineWidth=1.5;c.setLineDash([4,4]);
    for(const r of [z.minRadius,z.maxRadius]) arc(c,projectRadius(r),p.danger,1.5,z.angle-z.width/2,z.angle+z.width/2);
    const a=pointAt(z.angle,z.minRadius),b=pointAt(z.angle,z.maxRadius);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.restore();
  }
  const entities=[];
  for(const wall of state.walls) entities.push({radius:wall.radius,draw(){
    const r=projectRadius(wall.radius),ds=depthScale(wall.radius);
    for(let i=0;i<200;i++){const a=i*TAU/200;if(!safeInWall(wall,a+TAU/400))arc(c,r,p.ink,10*ds,a,a+TAU/200+.002);}
    for(const gap of wall.gaps) for(const sign of [-1,1]) {const a=gap.angle+sign*gap.width/2;c.save();c.rotate(a);c.fillStyle=p.signal;c.fillRect(r-10*ds,-ds,20*ds,2*ds);c.restore();}
  }});
  for(const e of state.enemies) entities.push({radius:e.radius,draw(){
    const pt=pointAt(e.angle,e.radius),ds=depthScale(e.radius),size=Math.max(e.radius<=T.coreRadius?2:0,enemySize(e)*ds);
    c.save();c.translate(pt.x,pt.y);c.rotate(e.angle+Math.PI/2);c.scale(size/10,size/10);threatGlyph(c,key,e.type,p);c.restore();
    if(e.mode==='patrol') arc(c,projectRadius(e.radius),p.danger,Math.max(.5,ds),e.angle-.15,e.angle+.15);
  }});
  for(const b of state.bullets) entities.push({radius:b.radius,draw(){
    const from=pointAt(b.angle,b.radius),to=pointAt(b.angle,b.radius+8);c.strokeStyle=b.owner===0?p.signal:p.ink;c.lineWidth=Math.max(.5,2.5*depthScale(b.radius));c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);c.stroke();
  }});
  for(const ship of state.players) entities.push({radius:ship.radius,draw(){
    const pt=pointAt(ship.angle,ship.radius),ds=depthScale(ship.radius),colors={...p,signal:ship.id===0?p.signal:p.ink,down:ship.down};
    c.save();c.translate(pt.x,pt.y);c.rotate(ship.angle+Math.PI/2);pilotGlyph(c,key,{...colors,signal:p.signal},ds,revised,ship.id);
    if(!ship.down&&ship.id!==0){ // Friendly silhouettes stay consistent; local ownership has a separate dot.
      // Repaint the same craft in the crew's paper color.
      pilotGlyph(c,key,{...colors,signal:p.ink},ds,revised,ship.id);
    }
    c.restore();
    if(labels) {
      const lr=projectRadius(ship.radius)+18*Math.max(.6,ds);c.fillStyle=ship.down?p.danger:ship.id===0?p.signal:p.ink;c.font='9px monospace';c.textAlign='center';
      c.fillText(ship.down?'P2 RESCUE 50%':`P${ship.id+1} ${ship.id===0?'YOU':['MARA','IVO','SANA','ROOK'][ship.id]}`,Math.cos(ship.angle)*lr,Math.sin(ship.angle)*lr+(Math.sin(ship.angle)>0?10:-5));
    }
  }});
  entities.sort((a,b)=>a.radius-b.radius).forEach(e=>e.draw());
  arc(c,projectRadius(T.coreRadius),p.rail,1);arc(c,3,p.danger,.8);
  c.restore();
}

export function paintHUD(c,width,height,key) {
  const p=looks[key],scale=width/1200;c.save();c.scale(scale,scale);
  const h=height/scale;
  c.fillStyle=p.ink;c.font='bold 13px Arial';c.textAlign='left';c.fillText('DELVE TOGETHER',30,31);
  c.fillStyle=p.rail;c.font='9px monospace';c.textAlign='right';c.fillText('LOCAL SESSION     SOUND OFF     REDUCE MOTION',1170,31);
  c.strokeStyle=p.grid;c.beginPath();c.moveTo(30,48);c.lineTo(1170,48);c.stroke();
  c.textAlign='left';c.fillStyle=p.rail;c.font='9px monospace';c.fillText('SURVIVE THE SURGE',30,77);
  c.fillStyle=p.ink;c.font=`bold 35px ${p.type}`;c.fillText('01:18',30,116);c.fillStyle=p.rail;c.font='11px monospace';c.fillText('/ 03:00',135,114);
  c.fillStyle=p.signal;c.font='10px monospace';c.fillText('PRESSURE · 0.5×',30,138);
  c.textAlign='right';c.fillStyle=p.ink;c.fillText('ROOM DEMO01      LEAVE',1170,77);
  c.fillStyle=p.signal;c.fillText('▲ P1 YOU   ◇ P2 DOWN INNER   ⬟ P3 SANA   ⬡ P4 ROOK',1170,104);
  c.fillStyle=p.ink;c.fillText('TEAM SCORE  017350',1170,129);
  c.strokeStyle=p.grid;c.beginPath();c.moveTo(30,h-52);c.lineTo(1170,h-52);c.stroke();
  c.textAlign='left';c.fillStyle=p.rail;c.font='10px monospace';c.fillText('A D  ORBIT     W S  DEPTH     SPACE  ABILITY     ◇ SAME RING TO RESCUE',30,h-25);
  c.textAlign='right';c.fillStyle=p.signal;c.fillText('BULWARK  READY     ━━━━━━━',1170,h-25);
  c.restore();
}

export function prepareCanvas(canvas, width, height) {
  const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);
  const c=canvas.getContext('2d');c.setTransform(d,0,0,d,0,0);return c;
}

export function paintConcept(canvas,key) {
  const p=looks[key],w=canvas.clientWidth,h=w/1.75,c=prepareCanvas(canvas,w,h),k=w/400;
  c.save();c.scale(k,k);c.fillStyle=p.bg;c.fillRect(0,0,400,229);
  c.save();c.beginPath();c.rect(0,0,210,229);c.clip();c.translate(102,113);c.scale(.36,.36);tunnel(c,key,p,{ring:1});c.restore();
  c.strokeStyle=p.grid;c.beginPath();c.moveTo(210,0);c.lineTo(210,229);c.stroke();
  c.fillStyle=p.rail;c.font='8px monospace';c.fillText('TUNNEL / ENVIRONMENT',14,20);c.fillText('PILOT / THREATS',225,20);
  c.save();c.translate(254,65);pilotGlyph(c,key,p,1.6);c.restore();
  c.save();c.translate(325,65);pilotGlyph(c,key,{...p,down:true},1);c.restore();
  ['rush','flank','suppress'].forEach((kind,i)=>{c.save();c.translate(244+i*52,126);threatGlyph(c,key,kind,p,11);c.restore();});
  c.fillStyle=p.grid;c.fillRect(225,163,157,50);c.fillStyle=p.signal;c.font=`bold 14px ${p.type}`;c.fillText('BULWARK',235,184);c.font='8px monospace';c.fillText('READY   ━━━━━━━━━',235,200);c.restore();
}

export function paintCalibration(canvas,revised) {
  const w=canvas.clientWidth,h=150,c=prepareCanvas(canvas,w,h),p=looks.relay;
  c.fillStyle=p.bg;c.fillRect(0,0,w,h);
  RINGS.slice().reverse().forEach((r,i)=>{
    const x=w*(i+1)/4,ds=depthScale(r);c.save();c.translate(x,61);pilotGlyph(c,'relay',{...p,down:true},ds,revised);c.restore();
    c.fillStyle=p.rail;c.font='9px monospace';c.textAlign='center';c.fillText(['OUTER','MIDDLE','INNER'][i],x,112);c.fillText(`${(26*ds).toFixed(1)}px NOMINAL`,x,129);
  });
}

// Abstract motion swatches only. The gameplay fixture and its timing never advance.
export function paintMotion(canvas,key,phase) {
  const w=canvas.clientWidth,h=180,c=prepareCanvas(canvas,w,h),p=looks[key],k=Math.min(w/340,1);
  c.fillStyle=p.bg;c.fillRect(0,0,w,h);c.save();c.translate(w/2,87);c.scale(k,k);
  const gather=Math.sin(Math.PI*phase),release=Math.max(0,(phase-.45)/.55),ease=release*release*(3-2*release);
  arc(c,58,p.grid,1);arc(c,74,p.grid,.7);
  if(key==='relay') {
    // Discrete radial blocks: hold, gather, separate. No rotating arena.
    const r=52-gather*12+ease*18;
    for(let i=0;i<8;i++){c.save();c.rotate(i*TAU/8);c.fillStyle=i%2?p.ink:p.signal;c.fillRect(r,-3,7+gather*7,6);c.restore();}
    c.strokeStyle=p.signal;c.lineWidth=2;c.beginPath();c.moveTo(-14,0);c.lineTo(-4,0);c.moveTo(4,0);c.lineTo(14,0);c.stroke();
  } else if(key==='hull') {
    // Tension expressed through a closing clamp and a compact release stroke.
    const inset=23-gather*13;
    c.fillStyle=p.signal;c.fillRect(-inset-23,-27,13,54);c.fillRect(inset+10,-27,13,54);
    c.fillRect(-inset-23,-27,23,9);c.fillRect(inset,-27,23,9);
    c.fillRect(-inset-23,18,23,9);c.fillRect(inset,18,23,9);
    for(let i=0;i<6;i++){c.save();c.rotate(i*TAU/6);c.fillStyle=p.ink;c.fillRect(41+ease*25,-2,3+ease*8,4);c.restore();}
  } else {
    // Smoothly tensioned band and asymmetric openings; no copied letterforms.
    c.lineWidth=8;c.lineCap='round';
    for(let i=0;i<3;i++) {
      c.save();c.rotate(i*TAU/3);c.strokeStyle=i===1?p.ink:p.signal;c.beginPath();
      c.moveTo(-24-gather*8,-25);c.bezierCurveTo(-52,5+gather*24,18+ease*16,46,32+gather*8,7-ease*19);c.stroke();c.restore();
    }
  }
  c.fillStyle=p.rail;c.font='8px monospace';c.textAlign='center';c.fillText(phase<.33?'HOLD':phase<.67?'GATHER':'RELEASE',0,80);c.restore();
}
