import { BAR_SECONDS, BAR_STEPS, STEP_SECONDS, chords, suspendedChord } from './audio-chart.js';

export { BPM, STEP_SECONDS } from './audio-chart.js';
export const CUE_STEP_SECONDS = STEP_SECONDS / 2;

const phaseEnergy = {
  BREATH: 0,
  INGRESS: 1,
  CROSSCURRENT: 2,
  PRESSURE: 2,
  CONVERGENCE: 3,
  'FINAL SURGE': 4,
  'BRING THEM BACK': 1,
};

const opening = { 3: 0, 11: 1 };
const answer = { 2: 2, 10: 0 };
export const hz = note => 440 * 2 ** ((note - 69) / 12);

function cueNotes(chord) {
  chord ??= chords[0];
  const root = 60 + chord.bass % 12;
  const third = [3, 4, 5].find(interval => chord.pad.some(note => (note + 24 - root) % 12 === interval));
  return [root, root + (third ?? 7), root + 7];
}

// An eighth-note pattern of chord degrees for the short combat hits.
const hitDegrees = [0, 2, 0, 1, 0, 2, 1, 2, 2, 1, 0, 2, 1, 2, 1, 0];

export function cuePart(chord, step = 0) {
  const notes = cueNotes(chord);
  const eighth = Math.max(0, Math.floor(step / 2)) % hitDegrees.length;
  const degree = hitDegrees[eighth];
  const roll = notes.map((_, index) => {
    const voice = degree + index;
    return notes[voice % notes.length] + (voice >= notes.length ? 12 : 0);
  });
  return { notes, roll, answer: eighth >= BAR_STEPS / 2, upbeat: eighth % 2 === 1 };
}

function drums(play, at, position, energy, restrained = false) {
  const quarter = position % 4;
  if (quarter === 0) {
    const volume = [0, .225, .335, .40, .47][energy];
    play({ pitch: 148, slide: 48, slideTime: .077, duration: .355, volume,
      attack: .003, hold: energy >= 3 ? .046 : .036 }, at);
    play({ pitch: 218, slide: 76, slideTime: .048, type: 'round', cutoff: 590,
      sweep: 240, duration: .108, volume: volume * .31 }, at);
    play({ noise: 'bandpass', cutoff: 1560, sweep: 720, offset: .07,
      duration: .043, volume: volume * .22 }, at);
  }
  if (restrained) return;
  if (quarter === 2) {
    play({ noise: 'bandpass', cutoff: 7300, sweep: 4900, offset: .06 + position * .009,
      duration: energy >= 3 ? .19 : .085, volume: energy >= 3 ? .25 : .12,
      attack: .009, pan: .32, wet: energy >= 3 ? .22 : 0 }, at + .008);
  } else if (energy >= 3 && (quarter === 3 || position === 9)) {
    play({ noise: 'highpass', cutoff: 8400, offset: .13 + position * .008, duration: .052,
      volume: .12, pan: -.42 }, at + .014);
  }
  if (energy >= 2 && position % 8 === 4) {
    const volume = energy === 4 ? .22 : .13;
    for (const [delay, level, offset, pan] of [[0, .6, .06, -.27], [.012, .72, .17, .29], [.027, 1, .02, .04]]) {
      play({ noise: 'bandpass', cutoff: 1790, sweep: 790, offset, duration: delay === .027 ? .23 : .047,
        volume: volume * level, pan, wet: .36 }, at + delay);
    }
  }
}

const bassSyncopations = [{ 2: 0, 6: 0, 9: 7, 14: 0 }, { 2: 0, 5: 0, 10: 0, 13: 12 }];

function bass(play, at, position, root, energy, answerBar, syncopated = false) {
  const interval = syncopated ? bassSyncopations[Number(answerBar)][position] : 0;
  const offbeat = syncopated ? interval !== undefined : position % 4 === 2;
  const pickup = syncopated ? interval > 0 : energy >= 2 && (position === 7 || (answerBar && position === 15));
  if (!offbeat && !pickup) return;
  const pitch = hz(root + (syncopated ? interval : pickup && position === 15 ? 7 : 0));
  const duration = pickup ? .107 : position === 6 && energy >= 2 ? .12 : .211;
  const volume = [0, .116, .174, .218, .25][energy] * (pickup ? .55 : 1);
  play({ pitch: pitch / 2, duration, volume, attack: .016, hold: pickup ? .022 : .068 }, at + .007);
  play({ pitch, type: 'round', cutoff: energy >= 3 ? 730 : 510, sweep: 165,
    duration, volume: volume * .81, attack: .012, hold: pickup ? .016 : .048 }, at + .007);
}

function pad(play, at, chord, energy) {
  const volume = [.014, .038, .045, .058, .067][energy];
  const spread = [-.76, .58, -.40, .79];
  chord.pad.forEach((note, index) => {
    play({ pitch: hz(note) * (index % 2 ? 1.0027 : .9971), type: 'strings',
      cutoff: 330 + index * 65, bloom: [energy >= 3 ? 1240 : 760, .93], sweep: 380,
      duration: BAR_SECONDS + .94, attack: .63 + index * .088, hold: .63,
      volume, pan: spread[index], wet: .68 }, at);
  });
}

function lead(play, at, position, chord, energy, answerBar, octave = 0) {
  const phrase = answerBar ? answer : opening;
  if (!(position in phrase)) return;
  if (energy <= 1 && position !== (answerBar ? 10 : 11)) return;
  if (energy === 0 && !answerBar) return;
  const pitch = hz(chord.lead[phrase[position]] + octave * 12);
  const volume = [.029, .052, .088, .112, .139][energy];
  const duration = position <= 3 ? .78 : .67;
  const brightness = energy >= 3 ? 2100 : 1120;
  play({ pitch, type: 'horn', cutoff: 530, bloom: [brightness, .235], sweep: 460,
    duration, volume, attack: .066, hold: .18, pan: -.25, wet: .53 }, at);
  play({ pitch: pitch * 1.005, type: 'horn', cutoff: 610, bloom: [brightness * .76, .29], sweep: 440,
    duration, volume: volume * .65, attack: .112, hold: .16, pan: .45, wet: .83 }, at + .035);
  if (energy === 4) {
    play({ pitch: position <= 3 ? pitch / 2 : pitch * 2, type: 'strings', cutoff: 1390, sweep: 680,
      duration: .86, volume: .071, attack: .15, hold: .17, pan: -.51, wet: .66 }, at + .066);
  }
  play({ pitch, type: 'horn', cutoff: 760, sweep: 390, duration: .70,
    volume: volume * .28, attack: .091, pan: .77, wet: .70 }, at + 3 * STEP_SECONDS);
}

export function playScoreStep(play, step, at, phase) {
  const bar = Math.floor(step / BAR_STEPS);
  const position = step % BAR_STEPS;
  const answerBar = bar % 2 === 1;
  const overtime = phase === 'BRING THEM BACK';
  const energy = phaseEnergy[phase] ?? 1;
  const chord = chords[overtime ? 0 : Math.floor(bar / 2) % chords.length];
  if (position === 0) pad(play, at, chord, energy);
  if (energy > 0) {
    drums(play, at, position, energy);
    bass(play, at, position, chord.bass, energy, answerBar);
  }
  if (!overtime || answerBar) lead(play, at, position, chord, energy, answerBar);
  if (energy >= 3 && answerBar && position === 12) {
    play({ noise: 'bandpass', cutoff: 360, bloom: [3800, .37], sweep: 5200, duration: 4 * STEP_SECONDS,
      attack: .35, volume: .25, pan: -.31, wet: .55 }, at);
  }
  return chord;
}

const surgeChords = [...chords, suspendedChord];
const fullSurge = [0, 0, 1, 3, 2, 1, 4, 4];
const halfSurge = [0, 0, 1, 1, 3, 3, 2, 2, 0, 0, 1, 3, 2, 1, 4, 4];

function overtimePulse(play, position, at) {
  if (position === 0) pad(play, at, suspendedChord, 1);
  if (position % 8 === 0) {
    play({ pitch: 72, slide: 43, slideTime: .09, duration: .27, volume: .22, hold: .035 }, at);
  }
  if (position === 11) lead(play, at, position, suspendedChord, 1, false);
  return suspendedChord;
}

export function playChartStep(play, chart, step, at, crewDown) {
  const bar = Math.floor(step / BAR_STEPS), position = step % BAR_STEPS;
  const phrase = chart.bars[bar];
  if (!phrase) return crewDown ? overtimePulse(play, position, at) : suspendedChord;

  const { chord, energy, motif, syncopated, octave, kickUntil = 4 } = phrase;
  const answerBar = bar % 2 === 1;
  const resting = energy > 0 && crewDown;
  const harmony = resting ? suspendedChord : chord;
  const wall = phrase.spawns.some(spawn => spawn.wall && spawn.beat * 4 === position);
  const wallPickup = position === 12 && chart.bars[bar + 1]?.spawns.some(spawn => spawn.wall && spawn.beat === 0);
  if (position === 0) {
    pad(play, at, harmony, resting ? 1 : energy);
    if (phrase.drop) {
      play({ pitch: hz(resting ? 49 : chord.bass + 7), type: 'horn', cutoff: 650,
        bloom: [1850, .19], sweep: 580, duration: .81, volume: resting ? .075 : .15,
        attack: .025, hold: .17, pan: -.25, wet: .75 }, at);
    }
  }
  if (motif && !resting) lead(play, at, position, chord, energy, answerBar, octave);
  const longSwell = phrase.swell && position === 8;
  if (longSwell || wallPickup) {
    play({ noise: 'bandpass', cutoff: 360, bloom: [4100, .30], sweep: 4700,
      duration: longSwell ? .90 : .45, volume: longSwell ? .20 : .125,
      attack: .29, pan: -.34, wet: .58 }, at);
  }
  if (wall) {
    play({ pitch: hz(harmony.bass), type: 'round', cutoff: 960, sweep: 620,
      duration: .48, volume: .10, attack: .025, wet: .52 }, at);
  }
  if (energy && position < kickUntil * 4 && (!resting || position % 8 === 0)) {
    drums(play, at, position, resting ? 1 : energy, resting || wall);
    if (!resting && (energy > 1 || phrase.bass)) bass(play, at, position, chord.bass, energy, answerBar, syncopated);
  }
  return harmony;
}

export function playFinaleStep(play, step, at, section, marks, crewDown, timeScale) {
  const bar = Math.floor(step / BAR_STEPS);
  const position = step % BAR_STEPS;
  if (section === 'breath') {
    const chord = bar === 0 ? chords[1] : suspendedChord;
    if (position === 0) pad(play, at, chord, 0);
    const toSurge = marks.surgeAt - marks.breathAt - step * STEP_SECONDS;
    if (toSurge > .34 && toSurge <= .34 + STEP_SECONDS) {
      play({ noise: 'bandpass', cutoff: 300, bloom: [2500, .31], sweep: 3300, duration: .42,
        attack: .32, volume: .16, pan: -.28, wet: .72 }, at);
    }
    return chord;
  }

  if (section === 'overtime') {
    return overtimePulse(play, position, at);
  }

  const bars = timeScale === .5 ? halfSurge : fullSurge;
  const remaining = marks.deadlineAt - marks.squadAt - step * STEP_SECONDS;
  if (remaining <= 0) return suspendedChord;
  const chord = surgeChords[bars[Math.min(bar, bars.length - 1)]];
  const cadence = remaining <= 12 * STEP_SECONDS;
  const harmony = crewDown || cadence ? suspendedChord : chord;
  if (position === 0) pad(play, at, harmony, crewDown || cadence ? 1 : 4);
  if (step === 0) {
    play({ pitch: hz(49), type: 'horn', cutoff: 680, bloom: [1480, .12], sweep: 510,
      duration: .92, volume: .14, attack: .018, hold: .11, wet: .65 }, at);
  }
  if (!cadence) drums(play, at, position, crewDown ? 1 : 4, crewDown);
  if (!crewDown && !cadence) {
    bass(play, at, position, chord.bass, 4, bar % 2 === 1);
    lead(play, at, position, chord, 4, bar % 2 === 1);
  } else if (position === 11) {
    lead(play, at, position, suspendedChord, 1, false);
  }
  return harmony;
}
