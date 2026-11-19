// Original procedural preview audio. Starts only from the sound button.
export class ArcadeSound {
  constructor(){this.enabled=false;this.ctx=null;this.lastBeat=-1;this.lastHit=-1;}
  async toggle(){
    if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.32;this.master.connect(this.ctx.destination);}
    this.enabled=!this.enabled;
    if(this.enabled)await this.ctx.resume();else await this.ctx.suspend();
    return this.enabled;
  }
  tone(frequency,end,duration,level,type='triangle'){
    if(!this.enabled||this.ctx.state!=='running')return;
    const now=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(frequency,now);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+duration);g.gain.setValueAtTime(level,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(g);g.connect(this.master);o.start(now);o.stop(now+duration+.01);
  }
  frame(t,hits){
    if(!this.enabled)return;
    const beat=Math.floor(t/.2);
    if(beat!==this.lastBeat){this.lastBeat=beat;const bass=[55,55,82.41,73.42,55,110,82.41,49][((beat%8)+8)%8];this.tone(bass,bass,.12,.12,'sawtooth');if(beat%2===0)this.tone(120,38,.14,.28,'sine');else this.tone(4400,1200,.025,.025,'square');}
    const hit=hits.find(h=>h.age<.06&&h.time!==this.lastHit);
    if(hit){this.lastHit=hit.time;this.tone(900+(hit.id%5)*170,130,.055,.055,'triangle');}
  }
  pulse(){this.tone(240,32,.32,.35,'sawtooth');}
  suspend(){if(this.ctx?.state==='running')this.ctx.suspend();}
  async resume(){if(this.enabled&&this.ctx)await this.ctx.resume();}
  reset(){this.lastBeat=-1;this.lastHit=-1;}
}
