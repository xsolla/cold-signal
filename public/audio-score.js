import { BAR_SECONDS, BAR_STEPS, STEP_SECONDS, chords, suspendedChord } from './audio-chart.js';

export { BPM, STEP_SECONDS } from './audio-chart.js';
export const CUE_STEP_SECONDS = STEP_SECONDS / 2;
export const pilotInstruments = Object.freeze({
  mara: 'Pulse bass', ivo: 'Synth brass', sana: 'Bowed strings', rook: 'Metal pluck',
});

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
  play({ pitch: pitch / 2, duration, volume, attack: .016, hold: pickup ? .022 : .068 }, at + .007, 'mara');
  play({ pitch, type: 'round', cutoff: energy >= 3 ? 730 : 510, sweep: 165,
    duration, volume: volume * .81, attack: .012, hold: pickup ? .016 : .048 }, at + .007, 'mara');
}

function bassPedal(play, at, position, chord) {
  if (position !== 2 && position !== 10) return;
  play({ pitch: hz(chord.bass), type: 'round', cutoff: 340, sweep: 160, duration: .47,
    volume: .095, attack: .026, hold: .07 }, at, 'mara');
}

function pad(play, at, chord, energy) {
  const volume = [.014, .038, .045, .058, .067][energy];
  const spread = [-.76, .58, -.40, .79];
  chord.pad.forEach((note, index) => {
    play({ pitch: hz(note) * (index % 2 ? 1.0027 : .9971), type: 'strings',
      cutoff: 330 + index * 65, bloom: [energy >= 3 ? 1240 : 760, .93], sweep: 380,
      duration: BAR_SECONDS + .94, attack: .63 + index * .088, hold: .63,
      volume, pan: spread[index], wet: .68 }, at, 'sana');
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
  play({ pitch, type: 'brass', cutoff: 530, bloom: [brightness, .235], sweep: 460,
    duration, volume, attack: .066, hold: .18, pan: -.25, wet: .53 }, at, 'ivo');
  play({ pitch: pitch * 1.005, type: 'brass', cutoff: 610, bloom: [brightness * .76, .29], sweep: 440,
    duration, volume: volume * .65, attack: .112, hold: .16, pan: .45, wet: .83 }, at + .035, 'ivo');
  if (energy === 4) {
    play({ pitch: position <= 3 ? pitch / 2 : pitch * 2, type: 'brass', cutoff: 1390, sweep: 680,
      duration: .86, volume: .069, attack: .15, hold: .17, pan: -.51, wet: .66 }, at + .066, 'ivo');
  }
  play({ pitch, type: 'brass', cutoff: 760, sweep: 390, duration: .70,
    volume: volume * .28, attack: .091, pan: .77, wet: .70 }, at + 3 * STEP_SECONDS, 'ivo');
}

function brassAnswer(play, at, position, chord, energy) {
  if (position !== 11) return;
  play({ pitch: hz(chord.lead[1]), type: 'brass', cutoff: 640, bloom: [1400, .19], sweep: 520,
    duration: .51, volume: .057 + energy * .011, attack: .058, hold: .12, pan: -.30, wet: .58 }, at, 'ivo');
}

function pluck(play, at, position, chord, energy, answerBar) {
  const pattern = answerBar ? { 1: 2, 5: 1, 13: 0, 15: 1 } : { 1: 0, 5: 1, 9: 2, 13: 1 };
  if (!(position in pattern) || (energy <= 1 && position !== 5 && position !== 13)) return;
  play({ pitch: hz(chord.lead[pattern[position]] + 12), type: 'pluck',
    cutoff: 1620 + energy * 380, sweep: 760, duration: .23, volume: .058 + energy * .011,
    attack: .007, hold: .022, pan: position < 8 ? .44 : -.38, wet: .40 }, at, 'rook');
}

const overdriveParts = {
  mara: { pattern: { 2: 0, 6: 0, 9: 2, 10: 0, 14: 0 }, transpose: -12,
    type: 'round', drive: true, cutoff: 1980, sweep: 510, duration: .21, volume: .23, attack: .010 },
  ivo: { pattern: { 0: 2, 4: 1, 8: 2, 11: 1, 12: 2 }, transpose: 0,
    type: 'brass', cutoff: 3150, sweep: 1050, duration: .32, volume: .225, attack: .028, wet: .15 },
  sana: { pattern: { 0: 1, 4: 2, 8: 1, 12: 2 }, transpose: 0,
    type: 'strings', cutoff: 2940, sweep: 1220, duration: .59, volume: .217, attack: .095, wet: .24 },
  rook: { pattern: { 1: 0, 3: 2, 5: 1, 9: 2, 11: 1, 15: 0 }, transpose: 12,
    type: 'pluck', cutoff: 4550, sweep: 1410, duration: .15, volume: .215, attack: .005, wet: .17 },
};

export function playOverdriveStep(play, chord, step, at, remaining, character, pan, duplicate, mix) {
  const part = overdriveParts[character];
  if (!part || remaining < .028) return;
  const { pattern, transpose, ...patch } = part;
  const degree = pattern[(step + BAR_STEPS - duplicate) % BAR_STEPS];
  if (degree === undefined) return;
  const note = cueNotes(chord)[degree] + transpose + [0, 12, -12, 0][duplicate];
  const duration = Math.min(patch.duration, remaining);
  play({ ...patch, pitch: hz(note), duration, attack: Math.min(patch.attack, duration / 3),
    volume: patch.volume * mix, pan, group: `overdrive-${character}` }, at);
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
  } else bassPedal(play, at, position, chord);
  if ((!overtime && energy > 0) || answerBar) lead(play, at, position, chord, energy, answerBar);
  else brassAnswer(play, at, position, chord, energy);
  pluck(play, at, position, chord, energy, answerBar);
  if (energy >= 3 && answerBar && position === 12) {
    play({ noise: 'bandpass', cutoff: 360, bloom: [3800, .37], sweep: 5200, duration: 4 * STEP_SECONDS,
      attack: .35, volume: .25, pan: -.31, wet: .55 }, at);
  }
  return chord;
}

const surgeChords = [...chords, suspendedChord];
const fullSurge = [0, 0, 1, 3, 2, 1, 4, 4];
const halfSurge = [0, 0, 1, 1, 3, 3, 2, 2, 0, 0, 1, 3, 2, 1, 4, 4];

function overtimePulse(play, position, at, chord = suspendedChord) {
  if (position === 0) pad(play, at, chord, 1);
  if (position % 8 === 0) {
    const transpose = 2 ** ((chord.bass - suspendedChord.bass) / 12);
    play({ pitch: 72 * transpose, slide: 43 * transpose, slideTime: .09, duration: .27, volume: .22, hold: .035 }, at);
  }
  if (position === 11) lead(play, at, position, chord, 1, false);
  bassPedal(play, at, position, chord);
  pluck(play, at, position, chord, 1, false);
  return chord;
}

const percussionSteps = [[], [7, 15], [3, 7, 11, 15], [1, 5, 9, 13, 15], [1, 3, 5, 7, 9, 11, 13, 15]];

function stageRhythm(play, chord, position, at, drive) {
  if (percussionSteps[drive].includes(position)) {
    play({ noise: 'bandpass', cutoff: 4800 + drive * 650, sweep: 3700, offset: .18 + position * .005,
      duration: .043 + drive * .007, volume: .055 + drive * .013, pan: position % 4 === 1 ? -.37 : .34 }, at);
  }
  if (drive >= 2 && (position === 5 || position === 13)) {
    const pitch = hz(chord.bass + (position === 5 ? 12 : 19));
    play({ pitch, type: 'round', cutoff: 410 + drive * 113, sweep: 290,
      duration: .14, attack: .008, hold: .024, volume: .061 + drive * .013, wet: .16 }, at, 'mara');
  }
  if (drive >= 3 && (position === 7 || (drive === 4 && position === 15))) {
    play({ pitch: hz(chord.lead[position === 7 ? 1 : 2] + 12), type: 'brass',
      cutoff: 950, bloom: [2050, .1], sweep: 680, duration: .32, volume: .040 + drive * .009,
      attack: .039, wet: .42, pan: position === 7 ? -.44 : .44 }, at, 'ivo');
  }
}

function breathTexture(play, chord, position, at, pulse) {
  if (position === 0) {
    play({ noise: 'bandpass', cutoff: 430, bloom: [730 + pulse * 140, .72],
      sweep: 510, offset: .035, duration: .43, attack: .15, volume: .055, pan: .24, wet: .72 }, at);
  }
  if (pulse > 1 && position % (pulse === 3 ? 4 : 8) === 0) {
    play({ pitch: hz(chord.bass), type: 'round', cutoff: 245, sweep: 140, duration: .31, volume: .071 + pulse * .021,
      attack: .044, hold: .052, wet: .19 }, at, 'mara');
  }
}

function formationAccent(play, { kind, degree, squads }, chord, at) {
  if (kind === 'gate-crossing') {
    play({ noise: 'bandpass', cutoff: 2500, sweep: 460, offset: .13,
      duration: .19, attack: .005, volume: .16, wet: .27 }, at);
    return;
  }
  if (kind === 'gate') {
    play({ pitch: hz(chord.bass), type: 'steel', cutoff: 1150, sweep: 365,
      duration: .25, attack: .014, volume: .14, wet: .37 }, at);
    return;
  }
  for (const [index, squad] of squads.entries()) {
    const pan = Math.cos(squad.angle) * .67;
    const pitch = hz(chord.lead[degree ?? index]);
    const sweep = kind === 'sweep';
    play({ pitch, type: kind === 'pincer' ? 'horn' : 'strike',
      ...(sweep && { slide: pitch * 2 ** (Math.sign(squad.bend) * 2 / 12), slideTime: .102 }),
      cutoff: kind === 'ladder' ? 1950 + degree * 390 : 2250, sweep: 740,
      duration: kind === 'pincer' ? .32 : .18, hold: .034, attack: .008,
      volume: kind === 'pincer' ? .095 : .154, pan, wet: .32 }, at);
  }
}

export function playChartStep(play, chart, step, at, crewDown) {
  const bar = Math.floor(step / BAR_STEPS), position = step % BAR_STEPS;
  const phrase = chart.bars[bar];
  const overtime = chart.overtimeChord ?? suspendedChord;
  if (!phrase) return crewDown ? overtimePulse(play, position, at, overtime) : overtime;

  const { chord, energy, motif, syncopated, octave, drive = 0, breathPulse, kickUntil = 4 } = phrase;
  const answerBar = bar % 2 === 1;
  const accents = chart.accents[step];
  const wall = phrase.spawns.some(spawn => spawn.wall && spawn.beat * 4 === position);
  const wallPickup = position === 12 && chart.bars[bar + 1]?.spawns.some(spawn => spawn.wall && spawn.beat === 0);
  if (position === 0) {
    pad(play, at, chord, energy);
    if (phrase.drop) {
      play({ pitch: hz(chord.bass + 7), type: 'horn', cutoff: 650,
        bloom: [1850 + drive * 230, .19], sweep: 580, duration: .81, volume: .15,
        attack: .025, hold: .17, pan: -.25, wet: .75 }, at);
    }
  }
  if (breathPulse) breathTexture(play, chord, position, at, breathPulse);
  if (!accents) {
    if (motif && (energy > 1 || answerBar)) lead(play, at, position, chord, energy, answerBar, octave);
    else brassAnswer(play, at, position, chord, energy);
    pluck(play, at, position, chord, energy, answerBar);
  }
  const longSwell = phrase.swell && position === 8;
  if (longSwell || wallPickup) {
    play({ noise: 'bandpass', cutoff: 360, bloom: [4100, .30], sweep: 4700,
      duration: longSwell ? .90 : .45, volume: longSwell ? .20 : .125,
      attack: .29, pan: -.34, wet: .58 }, at);
  }
  if (wall && !accents?.some(cue => cue.kind === 'gate')) {
    play({ pitch: hz(chord.bass), type: 'round', cutoff: 960, sweep: 620,
      duration: .48, volume: .10, attack: .025, wet: .52 }, at);
  }
  if (energy && position < kickUntil * 4) {
    drums(play, at, position, energy, wall);
    if (energy > 1 || phrase.bass) {
      bass(play, at, position, chord.bass, energy, answerBar, syncopated || drive >= 3);
    }
    if (energy > 1 && drive && !wall && !accents) {
      stageRhythm(play, chord, position, at, drive);
    }
  } else if (!energy && !(breathPulse > 1)) bassPedal(play, at, position, chord);
  for (const cue of accents ?? []) formationAccent(play, cue, chord, at);
  return chord;
}

export function playFinaleStep(play, step, at, section, marks, timeScale) {
  const bar = Math.floor(step / BAR_STEPS);
  const position = step % BAR_STEPS;
  if (section === 'breath') {
    const chord = bar === 0 ? chords[1] : suspendedChord;
    if (position === 0) pad(play, at, chord, 0);
    bassPedal(play, at, position, chord);
    brassAnswer(play, at, position, chord, 0);
    pluck(play, at, position, chord, 0, bar % 2 === 1);
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
  const harmony = cadence ? suspendedChord : chord;
  if (position === 0) pad(play, at, harmony, cadence ? 1 : 4);
  if (step === 0) {
    play({ pitch: hz(49), type: 'horn', cutoff: 680, bloom: [1480, .12], sweep: 510,
      duration: .92, volume: .14, attack: .018, hold: .11, wet: .65 }, at);
  }
  if (!cadence) {
    drums(play, at, position, 4);
    bass(play, at, position, chord.bass, 4, bar % 2 === 1);
    lead(play, at, position, chord, 4, bar % 2 === 1);
  } else if (position === 11) {
    lead(play, at, position, suspendedChord, 1, false);
  }
  pluck(play, at, position, harmony, cadence ? 1 : 4, bar % 2 === 1);
  return harmony;
}
