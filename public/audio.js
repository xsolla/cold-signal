import { cuePart, CUE_STEP_SECONDS, pilotInstruments, playFinaleStep, playChartStep, playScoreStep, STEP_SECONDS } from './audio-score.js';
import { pressureChart, sortieChart } from './audio-chart.js';
import { abilities, cues, depthCue, holdCue, killHit, killTransient,
  readyCue, releaseCue, warningCue } from './audio-cues.js';

const LOOKAHEAD = .10;
const START_LEAD = .022;
const SILENCE = .0001;
const NOISE_SEED = 0x2c4b19;
const ROOM_SEEDS = [0x293918, 0x6d2b79];
const ROOM_LEVEL = .85;
const OUTPUT_LEVEL = .85;
const BEAT_SECONDS = STEP_SECONDS * 4;
const PILOTS = Object.keys(pilotInstruments);

// Harmonic amplitudes for the original synth patches. Web Audio band-limits
// these waves at playback pitch, including during glides.
const harmonics = {
  round: [0, 1, .36, .21, .077, .045, .028, .012],
  horn: [0, .92, .78, .48, .26, .24, .11, .15, .068, .082, .046, .025, .023, .01],
  brass: [0, 1, .31, .74, .22, .38, .12, .19, .06, .08, .04, .036, .02],
  strings: [0, .95, .58, .44, .29, .19, .14, .10, .067, .045, .039, .026, .017],
  strike: [0, .88, .82, .63, .46, .41, .31, .23, .22, .15, .13, .09, .077, .06, .038, .029, .022],
  steel: [0, .86, .62, .18, .49, .24, .065, .23, .095, .104, .05, .08, .037, .043, .02],
  pluck: [0, 1, .11, .53, .065, .28, .035, .16, .025, .052],
};

function noiseFrom(seed) {
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 2147483648 - 1;
  };
}

function noiseBuffer(context) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate / 2), context.sampleRate);
  const next = noiseFrom(NOISE_SEED);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = next();
  return buffer;
}

function roomImpulse(context) {
  const rate = context.sampleRate;
  const frames = Math.ceil(2.7 * rate);
  const buffer = context.createBuffer(2, frames, rate);
  const damping = 1 - Math.exp(-2 * Math.PI * 3200 / rate);
  const highpass = 1 - Math.exp(-2 * Math.PI * 210 / rate);
  const decay = Math.exp(-2.65 / rate);
  for (const [channel, seed] of ROOM_SEEDS.entries()) {
    const out = buffer.getChannelData(channel), next = noiseFrom(seed);
    const onset = Math.round((.026 + channel * .012) * rate);
    let low = 0, damped = 0, gain = .037 * Math.sqrt(48000 / rate);
    for (let i = onset; i < frames; i++) {
      damped += damping * (next() - damped);
      low += highpass * (damped - low);
      const edge = Math.min(1, (i - onset) / (.055 * rate), (frames - 1 - i) / (.075 * rate));
      out[i] = (damped - low) * gain * edge;
      gain *= decay;
    }
    for (const [delay, level] of [[.029, .15], [.063, -.10], [.109, .07], [.172, -.044]]) {
      out[Math.round((delay + .013 * channel) * rate)] += level;
    }
  }
  return buffer;
}

function shortRoom(context, longRoom) {
  const rate = context.sampleRate;
  const frames = Math.round(.72 * rate);
  const room = context.createBuffer(2, frames, rate);
  for (let channel = 0; channel < 2; channel++) {
    const source = longRoom.getChannelData(channel), output = room.getChannelData(channel);
    for (let i = 0; i < frames; i++) {
      const fade = Math.min(1, (frames - 1 - i) / (rate * .1));
      output[i] = source[i] * Math.exp(-4.6 * i / rate) * fade;
    }
  }
  return room;
}

const driveCurve = Float32Array.from({ length: 1025 }, (_, i) => Math.tanh(2.2 * (i / 512 - 1)) / Math.tanh(2.2));

export class Sound {
  constructor(context = null, { syncedFinale = true, syncedPressure = true } = {}) {
    this.context = context;
    this.syncedFinale = syncedFinale;
    this.syncedPressure = syncedPressure;
    this.enabled = false;
    this.holding = false;
    this.nextStep = 0;
    this.nextAt = null;
    this.phase = null;
    this.finaleSection = null;
    this.killUntil = 0;
    this.abilityUntil = 0;
    this.duckUntil = 0;
    this.rescueHold = null;
    this.voices = new Set();
    this.pilotParts = new Map();
    this.playMusic = (patch, at, pilot) => this.play(patch, at, 'music', pilot);
  }

  get active() { return this.enabled && !this.holding && this.context?.state === 'running'; }

  chartFor(state) {
    const id = state?.encounter?.id;
    if (id === sortieChart.id) return sortieChart;
    if (this.syncedPressure && id === pressureChart.id) return pressureChart;
  }

  async enable() {
    this.context ||= new (window.AudioContext || window.webkitAudioContext)();
    await this.context.resume();
    this.impulse ||= roomImpulse(this.context);
    this.effectsImpulse ||= shortRoom(this.context, this.impulse);
    this.holding = false;
    this.enabled = true;
  }

  bus(name) {
    if (!this.buses) {
      const output = this.context.createGain();
      output.gain.value = OUTPUT_LEVEL;
      output.connect(this.context.destination);
      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -15;
      compressor.knee.value = 10;
      compressor.ratio.value = 5;
      compressor.attack.value = .002;
      compressor.release.value = .12;
      compressor.connect(output);
      const music = this.context.createGain(), effects = this.context.createGain();
      music.connect(output);
      effects.connect(compressor);
      this.buses = { music, effects };
    }
    return this.buses[name];
  }

  space(bus) {
    const key = bus === 'music' ? 'room' : 'effectsRoom';
    if (!this[key]) {
      const context = this.context;
      const convolver = context.createConvolver(), level = context.createGain();
      this.impulse ||= roomImpulse(context);
      convolver.normalize = false;
      convolver.buffer = bus === 'music' ? this.impulse : (this.effectsImpulse ||= shortRoom(context, this.impulse));
      level.gain.value = ROOM_LEVEL;
      convolver.connect(level).connect(this.bus(bus));
      this[key] = { convolver, level };
    }
    return this[key].convolver;
  }

  pilotPart(pilot) {
    let part = this.pilotParts.get(pilot);
    if (!part) {
      const dry = this.context.createGain(), wet = this.context.createGain();
      dry.connect(this.bus('music'));
      part = { dry, wet, level: undefined };
      this.pilotParts.set(pilot, part);
    }
    return part;
  }

  syncPilotMix(players, now) {
    if (!players?.some(player => Object.hasOwn(pilotInstruments, player.character))) return false;
    for (const pilot of PILOTS) {
      const assigned = players.filter(player => player.character === pilot);
      const level = assigned.length ? assigned.filter(player => !player.down).length / assigned.length : 0;
      const part = this.pilotPart(pilot);
      if (level === part.level) continue;
      const returning = level > part.level;
      const anchor = this.nextAt === null ? now : this.nextAt - (this.nextStep % 4) * STEP_SECONDS;
      const at = returning ? Math.max(now, anchor + Math.ceil((now - anchor) / BEAT_SECONDS - 1e-8) * BEAT_SECONDS) : now;
      for (const { gain } of [part.dry, part.wet]) {
        if (part.level === undefined) gain.setValueAtTime(level, now);
        else {
          if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
          else gain.cancelScheduledValues(now);
          gain.setTargetAtTime(level, at, returning ? .024 : .014);
        }
      }
      part.level = level;
    }
    return true;
  }

  play({
    pitch, slide, slideTime, noise, offset = 0, type = 'sine', cutoff, bloom, sweep,
    resonance, drive = false, detune = 0, pan = 0, attack = .004, hold = 0, duration, volume, wet = 0, group,
  }, at, bus = 'effects', pilot) {
    const context = this.context, end = at + duration;
    let source;
    if (noise) {
      this.noise ||= noiseBuffer(context);
      source = context.createBufferSource();
      source.buffer = this.noise;
    } else {
      source = context.createOscillator();
      if (Object.hasOwn(harmonics, type)) {
        this.waves ||= new Map();
        if (!this.waves.has(type)) {
          const partials = Float32Array.from(harmonics[type]);
          this.waves.set(type, context.createPeriodicWave(new Float32Array(partials.length), partials));
        }
        source.setPeriodicWave(this.waves.get(type));
      } else source.type = type;
      if (detune) source.detune.value = detune;
      source.frequency.setValueAtTime(pitch, at);
      if (slide) source.frequency.exponentialRampToValueAtTime(slide, slideTime ? at + slideTime : end);
    }

    let output = source;
    if (cutoff) {
      const filter = context.createBiquadFilter();
      filter.type = noise || 'lowpass';
      filter.Q.value = resonance ?? (noise === 'bandpass' ? .85 : .66);
      filter.frequency.setValueAtTime(cutoff, at);
      if (bloom) filter.frequency.exponentialRampToValueAtTime(bloom[0], at + bloom[1]);
      if (sweep) filter.frequency.exponentialRampToValueAtTime(sweep, end);
      output = output.connect(filter);
    }

    if (drive) {
      const shaper = context.createWaveShaper();
      shaper.curve = driveCurve;
      shaper.oversample = '2x';
      output = output.connect(shaper);
    }
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(SILENCE, at);
    envelope.gain.linearRampToValueAtTime(volume, at + attack);
    if (hold) envelope.gain.setValueAtTime(volume, at + attack + hold);
    envelope.gain.exponentialRampToValueAtTime(SILENCE, end);
    output = output.connect(envelope);
    if (pan && context.createStereoPanner) {
      const stereo = context.createStereoPanner();
      stereo.pan.value = pan;
      output = output.connect(stereo);
    }
    const part = pilot && this.pilotPart(pilot);
    output.connect(part ? part.dry : this.bus(bus));
    let send;
    if (wet) {
      send = context.createGain();
      send.gain.value = wet;
      if (part && !part.wetConnected) {
        part.wet.connect(this.space(bus));
        part.wetConnected = true;
      }
      output.connect(send).connect(part ? part.wet : this.space(bus));
    }

    const voice = { source, envelope: envelope.gain, at, end, bus, group };
    this.voices.add(voice);
    source.onended = () => {
      source.disconnect();
      send?.disconnect();
      this.voices.delete(voice);
    };
    if (noise) source.start(at, offset);
    else source.start(at);
    source.stop(end);
  }

  tick(state, paused) {
    if (state?.status !== 'playing' || paused || !this.active) return;
    const now = this.context.currentTime;
    this.alignClock(state, now);
    this.syncPilotMix(state.players, now);
    // Drop missed steps after a stalled frame instead of playing a burst of
    // overdue notes. The grid is based on audio time at either simulation pace.
    if (this.nextAt < now) {
      const missed = Math.ceil((now - this.nextAt) / STEP_SECONDS);
      this.nextStep += missed;
      this.nextAt += missed * STEP_SECONDS;
    }
    const finale = this.syncedFinale && state.finale;
    const chart = this.chartFor(state);
    const crewDown = chart && state.players.some(player => player.down);
    while (this.nextAt < now + LOOKAHEAD) {
      let chord;
      if (chart) {
        chord = playChartStep(this.playMusic, chart, this.nextStep, this.nextAt, crewDown);
      } else if (finale) {
        chord = playFinaleStep(this.playMusic, this.nextStep, this.nextAt, this.finaleSection, finale, state.timeScale);
      } else {
        if (!this.phase || this.nextStep % 4 === 0) this.phase = state.phase;
        chord = playScoreStep(this.playMusic, this.nextStep, this.nextAt, this.phase);
      }
      this.scoreFeedback(chord, this.nextStep, this.nextAt);
      this.nextStep++;
      this.nextAt += STEP_SECONDS;
    }
  }

  alignClock(state, now) {
    if (state?.status !== 'playing') return;
    if (state.encounter) {
      this.alignElapsedClock(state.elapsed, now, this.nextAt === null && this.nextStep === 0, .085);
      return;
    }
    if (!this.syncedFinale || !state.finale) {
      this.nextAt ??= now + START_LEAD;
      return;
    }
    const marks = state.finale;
    const section = state.phase === 'BRING THEM BACK' ? 'overtime' : marks.squadAt != null ? 'surge' : 'breath';
    const origin = section === 'overtime' ? marks.deadlineAt : section === 'surge' ? marks.squadAt : marks.breathAt;
    const elapsed = Math.max(0, state.elapsed - origin);
    const entering = section !== this.finaleSection;
    this.finaleSection = section;
    this.alignElapsedClock(elapsed, now, entering, .24);
  }

  alignElapsedClock(elapsed, now, entering, driftLimit) {
    const drift = this.nextAt === null ? 0 : this.nextAt - now - START_LEAD - (this.nextStep * STEP_SECONDS - elapsed);
    if (entering || Math.abs(drift) > driftLimit) {
      for (const voice of this.voices) if (voice.bus === 'music') this.stopVoice(voice, now, .045);
      this.cancelQueuedHarmony(now);
      this.nextAt = null;
    }
    if (this.nextAt === null) {
      // Start with a downbeat when the reveal is fresh. After mute, pause or
      // a large clock correction, continue at the next position in the phrase.
      const fresh = entering && elapsed <= .12;
      this.nextStep = fresh ? 0 : Math.ceil(elapsed / STEP_SECONDS - 1e-6);
      this.nextAt = now + START_LEAD + Math.max(0, this.nextStep * STEP_SECONDS - elapsed);
    }
  }

  cueTime(at) {
    if (this.nextAt === null) return at;
    // Every score step is two cue steps. Keep the subdivision anchored even
    // when the next score note has already been queued ahead of playback.
    const steps = Math.ceil((at - this.nextAt) / CUE_STEP_SECONDS - 1e-9);
    return Math.max(at, this.nextAt + steps * CUE_STEP_SECONDS);
  }

  harmonyAt(at) {
    return this.nextHarmony?.at <= at ? this.nextHarmony.chord : this.previousHarmony;
  }

  cuePartAt(at) {
    const step = this.nextAt === null ? 0
      : this.nextStep + Math.round((at - this.nextAt) / CUE_STEP_SECONDS) / 2;
    return cuePart(this.harmonyAt(at), step);
  }

  cancelQueuedHarmony(at) {
    this.previousHarmony = this.harmonyAt(at);
    this.nextHarmony = null;
  }

  scoreFeedback(chord, step, at) {
    const previous = this.harmonyAt(at);
    if (previous !== chord) {
      this.previousHarmony = previous;
      this.nextHarmony = { chord, at };
    }
    if (!this.rescueHold || step % 4 !== 0 || at - this.rescueHold.startedAt < .19) return;
    const { notes, answer } = cuePart(chord, step);
    const level = Math.min(2, Math.floor(this.rescueHold.progress * 3));
    this.playCue(holdCue(notes[0], notes[level], level, false, answer), at);
  }

  feedback({ depth, ready, warning, rescue, rescueStarted, rescueBroken }, state) {
    const at = this.context?.currentTime ?? 0;
    const previous = this.rescueHold;
    if (previous && previous.target !== rescue?.target) {
      for (const voice of this.voices) if (voice.group === 'rescue-hold') this.stopVoice(voice, at, .018);
    }
    this.rescueHold = rescue && { ...rescue, startedAt: previous?.target === rescue.target ? previous.startedAt : at };
    if (!this.active) return;

    this.alignClock(state, at);
    if (!warning && !depth && !ready && !rescueStarted && !rescueBroken) return;
    const { notes, answer } = this.cuePartAt(this.cueTime(at));
    const [root, , fifth] = notes;
    if (warning) {
      this.duck(at, .72, .135);
      this.playCue(warningCue(root, warning), at);
    }
    if (depth) this.playCue(depthCue(notes, depth, !!warning, answer), at);
    if (ready && !warning) this.playCue(readyCue(notes, answer), at);
    if (rescueStarted) this.playCue(holdCue(root, fifth - 12, 0, true), at);
    else if (rescueBroken) this.playCue(releaseCue(root), at);
  }

  events(events, state) {
    if (!this.active) return;
    const at = this.context.currentTime;
    this.alignClock(state, at);
    const onset = this.cueTime(at);
    const { notes, roll, answer, upbeat } = this.cuePartAt(onset);
    const outcome = events.find(event => event.type === 'won' || event.type === 'lost');
    if (outcome) {
      // Stop the score including lookahead notes before the outcome chord.
      this.stopVoices(.014);
      const chart = this.chartFor(state);
      const synced = chart || (this.syncedFinale && (state?.finale || this.finaleSection));
      if (outcome.type === 'won' && synced) {
        const rescued = events.some(event => event.type === 'rescue');
        if (rescued) this.playCue(cues.rescue(notes, answer), at);
        this.playCue(cues.won(chart?.clearTranspose), rescued ? onset + 4 * CUE_STEP_SECONDS : at);
      } else this.playCue(cues[outcome.type](), at);
      return;
    }

    const pilotMix = this.syncPilotMix(state?.players, at);
    const played = new Set();
    const crewCue = events.some(event => event.type === 'rescue' || event.type === 'down');
    const abilityStack = events.filter(event => event.type === 'special').length > 1;
    let kills = 0;
    for (const { type, character } of events) {
      if (type === 'kill') {
        kills++;
        continue;
      }
      const cue = type === 'special' ? abilities[character] : cues[type];
      if (!cue || played.has(cue)) continue;
      played.add(cue);
      if (!pilotMix && type === 'rescue') this.duck(at, .32, .36);
      else if (!pilotMix && type === 'down') this.duck(at, .39, .25);
      if (type === 'special') {
        const level = at < this.abilityUntil ? .34 : crewCue ? .67 : 1;
        this.abilityUntil = at + .16;
        this.duck(at, abilityStack ? .43 : .67, .16);
        this.playCue(cue(notes, answer), at, level);
      } else this.playCue(cue(notes, answer), at);
    }
    if (!kills || at < this.killUntil) return;
    const taps = kills >= 6 ? 3 : kills > 1 ? 2 : 1;
    if (taps === 3) this.duck(at, .75, .12);
    this.play(killTransient, at);
    for (let i = 0; i < taps; i++) {
      const patch = killHit(roll[i], i, upbeat);
      const when = onset + i * CUE_STEP_SECONDS;
      this.play(patch, when);
      this.killUntil = when + patch.duration;
    }
  }

  playCue(cue, at, level = 1) {
    const onset = this.cueTime(at);
    for (const patch of cue) {
      const delay = patch.delaySteps ?? 0;
      const when = patch.noise && !delay ? at : onset + delay * CUE_STEP_SECONDS;
      this.play(level === 1 ? patch : { ...patch, volume: patch.volume * level }, when);
    }
  }

  duck(at, level, hold) {
    if (at < this.duckUntil && level > this.duckLevel) return;
    this.duckUntil = at + hold;
    this.duckLevel = level;
    const gain = this.bus('music').gain;
    gain.cancelScheduledValues(at);
    gain.setTargetAtTime(level, at, .011);
    gain.setTargetAtTime(1, this.duckUntil, .108);
  }

  stopVoice(voice, at, fade) {
    if (voice.end <= at) return;
    if (fade && voice.at < at && voice.envelope.cancelAndHoldAtTime) {
      voice.end = Math.min(at + fade, voice.end);
      voice.envelope.cancelAndHoldAtTime(at);
      voice.envelope.linearRampToValueAtTime(0, voice.end);
      voice.source.stop(voice.end);
    } else {
      voice.source.stop(at);
      this.voices.delete(voice);
    }
  }

  stopVoices(fade = 0) {
    if (!this.context) return;
    const at = this.context.currentTime;
    for (const voice of this.voices) this.stopVoice(voice, at, fade);
    const gain = this.buses?.music.gain;
    gain?.cancelScheduledValues(at);
    gain?.setValueAtTime(1, at);
    if (!fade) {
      for (const { dry, wet } of this.pilotParts.values()) {
        dry.disconnect();
        wet.disconnect();
      }
      this.pilotParts.clear();
    }
    if (this.room) {
      if (fade) {
        this.room.level.gain.setValueAtTime(ROOM_LEVEL, at);
        this.room.level.gain.linearRampToValueAtTime(0, at + .58);
      } else {
        this.room.convolver.disconnect();
        this.room.level.disconnect();
        this.room = null;
      }
    }
    if (this.effectsRoom && !fade) {
      this.effectsRoom.convolver.disconnect();
      this.effectsRoom.level.disconnect();
      this.effectsRoom = null;
    }
    this.duckUntil = 0;
    this.killUntil = 0;
    this.abilityUntil = 0;
  }

  reset() {
    this.stopVoices();
    this.nextStep = 0;
    this.nextAt = null;
    this.phase = null;
    this.finaleSection = null;
    this.rescueHold = null;
    this.previousHarmony = this.nextHarmony = null;
  }

  async suspend() {
    this.holding = true;
    const context = this.context;
    if (!context) return;
    this.cancelQueuedHarmony(context.currentTime);
    if (this.nextAt !== null) {
      // Requeue only grid positions scheduled ahead of the pause.
      const queued = Math.max(0, Math.ceil((this.nextAt - context.currentTime) / STEP_SECONDS) - 1);
      this.nextStep -= queued;
      this.nextAt = null;
      this.phase = null;
    }
    this.stopVoices();
    if (context.state === 'running' && !this.suspending) {
      this.suspending = context.suspend();
      try { await this.suspending; } finally { this.suspending = null; }
    }
  }

  async resume() {
    if (!this.enabled || !this.context) return;
    this.holding = false;
    if (this.suspending || this.context.state === 'suspended') await this.context.resume();
  }
}
