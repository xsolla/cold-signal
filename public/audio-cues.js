import { hz } from './audio-score.js';

function stab(note, options = {}) {
  return { pitch: hz(note), type: 'strike', cutoff: 2180, sweep: 620, resonance: 3.2, drive: true,
    duration: .31, volume: .235, attack: .012, hold: .042, ...options };
}

function wide(note, options = {}) {
  const patch = stab(note, options);
  return [
    { ...patch, pan: -.58, detune: -9, volume: patch.volume * .56 },
    { ...patch, pan: .58, detune: 10, volume: patch.volume * .51 },
  ];
}

function air(cutoff, sweep, options = {}) {
  return { noise: 'bandpass', cutoff, sweep, duration: .17, volume: .23,
    attack: .006, offset: .071, ...options };
}

export const abilities = {
  mara: ([root, third, fifth], answer) => [
    stab(root - 24, { type: 'round', cutoff: 660, sweep: 250, volume: .24, duration: .34 }),
    ...wide(root - 12, { cutoff: 2060, sweep: 710, duration: .40, hold: .072, volume: .25, wet: .48 }),
    stab((answer ? third : fifth) - 12, { cutoff: answer ? 1390 : 1710,
      duration: .31, volume: .15, delaySteps: 1, wet: .31 }),
    air(1800, 730, { duration: .16, volume: .20 }),
  ],
  ivo: ([root], answer) => [
    stab(root - 29, { slide: hz(root - 36), slideTime: .115, type: 'round',
      cutoff: 890, sweep: 220, duration: .42, volume: .31 }),
    ...wide(root - 19, { slide: hz(root - 12), slideTime: .16, cutoff: 580, bloom: [answer ? 2230 : 2860, .084],
      sweep: 750, duration: .49, hold: .11, volume: .30, wet: .32 }),
    air(3100, 840, { duration: .29, volume: .30, drive: true }),
  ],
  sana: ([root, third, fifth], answer) => [
    stab(root - 12, { cutoff: 1200, sweep: 530, duration: .27, volume: .22 }),
    stab((answer ? third : fifth) - 12, { cutoff: 2340, sweep: 880,
      duration: .32, volume: .18, delaySteps: 1, pan: -.27 }),
    ...wide(answer ? fifth : third, { cutoff: answer ? 2060 : 2460, sweep: 950,
      duration: .43, volume: .23, delaySteps: 2, wet: .41 }),
    air(2080, 1250, { duration: .12, volume: .16, offset: .20 }),
  ],
  rook: ([root, third, fifth], answer) => [
    stab((answer ? third : fifth) - 12, { slide: hz(root - 12), slideTime: .18, cutoff: 3800, sweep: 740,
      duration: .35, volume: .25, pan: -.32, wet: .23 }),
    stab((answer ? third : fifth) - 12, { slide: hz(root - 12), slideTime: .17, cutoff: 2910, sweep: 550,
      duration: .39, volume: .16, pan: .48, detune: 12, delaySteps: 1, wet: .36 }),
    air(3840, 1130, { attack: .019, duration: .31, volume: .29, pan: .23 }),
  ],
};

export const cues = {
  shield: ([root, third, fifth], answer) => [
    stab(root - 12, { cutoff: 1510, sweep: 560, duration: .22, volume: .26, hold: .024 }),
    stab(answer ? third : fifth, { type: 'steel', cutoff: 2800, sweep: 1250, duration: .29, volume: .127, wet: .32 }),
    air(2650, 810, { duration: .125, volume: .20 }),
  ],
  down: ([root]) => [
    stab(root - 12, { slide: hz(root - 26), slideTime: .24, cutoff: 1780, sweep: 290,
      duration: .55, volume: .31, hold: .075 }),
    ...wide(root - 11, { slide: hz(root - 24), slideTime: .22, type: 'steel', cutoff: 1940,
      sweep: 390, duration: .67, volume: .19, wet: .40 }),
    air(1720, 410, { duration: .34, volume: .24, drive: true }),
  ],
  rescue: ([root, third, fifth], answer) => [
    stab(root - 12, { cutoff: 1320, bloom: [2600, .049], sweep: 510, duration: .49,
      volume: .26, hold: .093 }),
    ...wide((answer ? third : fifth) - 12, { cutoff: 1640, bloom: [answer ? 2300 : 2760, .15], sweep: 920, duration: .56,
      volume: .24, delaySteps: 1, hold: .13, wet: .46 }),
    stab(answer ? fifth : third, { cutoff: 2430, sweep: 1190, duration: .46, volume: .152,
      delaySteps: 2, hold: .11, pan: -.16, wet: .41 }),
    air(2050, 1120, { duration: .16, volume: .16 }),
  ],
  won: () => [
    stab(42, { type: 'round', cutoff: 920, sweep: 420, duration: 1.30,
      volume: .23, attack: .023, hold: .23 }),
    ...wide(61, { cutoff: 1030, bloom: [3200, .19], sweep: 680,
      duration: 1.34, volume: .29, attack: .045, hold: .27, wet: .52 }),
    stab(69, { cutoff: 2040, bloom: [3000, .22], sweep: 980, duration: 1.22,
      volume: .16, attack: .054, hold: .24, delaySteps: 2, pan: -.31, wet: .43 }),
    stab(78, { cutoff: 2450, sweep: 860, duration: .89, volume: .108,
      delaySteps: 4, hold: .15, pan: .39, wet: .53 }),
  ],
  lost: () => [
    stab(42, { slide: hz(27), slideTime: .39, type: 'round', cutoff: 910, sweep: 210,
      duration: .82, volume: .30, hold: .14 }),
    ...wide(65, { slide: hz(49), slideTime: .29, type: 'steel', cutoff: 1960, sweep: 290,
      duration: 1.02, volume: .23, hold: .15, wet: .52 }),
    air(1830, 230, { duration: .46, volume: .29, drive: true }),
  ],
};

export const killHit = (note, index, upbeat) => stab(note - 12, {
  type: upbeat ? 'steel' : 'strike', slide: hz(note - 13), slideTime: .024,
  cutoff: (upbeat ? 2160 : 2520) + index * 450, sweep: 640 + index * 210,
  duration: [.12, .103, .18][index], volume: [.218, .149, .165][index],
  attack: .004, hold: .018, pan: [0, -.19, .22][index], wet: index === 2 ? .26 : 0,
});
export const killTransient = air(2960, 910, { duration: .062, volume: .177, attack: .0025 });

export function warningCue(root, kind) {
  const patch = stab(root - 12, { type: 'steel', cutoff: 2220, sweep: 710,
    duration: .15, volume: .28, attack: .008, hold: .042 });
  return [patch, { ...patch, delaySteps: 2, cutoff: 1720, volume: .197, wet: .22 },
    air(kind === 'wall' ? 1510 : 3070, 660, { duration: .22, volume: .205 })];
}

export function depthCue([root, third], direction, quiet, answer) {
  const note = (answer ? third : root) - (direction > 0 ? 19 : 12);
  return [
    stab(note, { type: answer ? 'horn' : 'strike', slide: hz(note + direction * 7), slideTime: .064,
      cutoff: direction > 0 ? 1310 : 2640, bloom: direction > 0 ? [answer ? 2510 : 3100, .047] : undefined,
      sweep: 680, duration: .19,
      volume: quiet ? .15 : .23, attack: .006, hold: .039 }),
    air(direction > 0 ? 2220 : 1540, 810, { duration: .12, volume: quiet ? .105 : .17 }),
  ];
}

export function readyCue([root, third, fifth], answer) {
  return [
    stab((answer ? root : fifth) - 12, { cutoff: 1840, sweep: 710, duration: .19, volume: .15, attack: .009 }),
    ...wide(answer ? third - 12 : root, { cutoff: answer ? 2010 : 2460, sweep: 960, duration: .32,
      volume: .24, delaySteps: 2, hold: .078, wet: .35 }),
    air(2460, 920, { delaySteps: 2, duration: .104, volume: .128 }),
  ];
}

export function holdCue(root, note, level, first = false, answer = false) {
  return [
    stab(root - (answer ? 17 : 12), { type: 'round', cutoff: 980, sweep: 430, duration: .22,
      volume: first ? .19 : .11 + level * .035, hold: .031, group: 'rescue-hold' }),
    stab(note, { cutoff: (answer ? 1220 : 1500) + level * 1150, sweep: 690, duration: first ? .28 : .26,
      volume: first ? .19 : .145 + level * .063, attack: .018, hold: .066, group: 'rescue-hold' }),
    ...(first ? [air(2180, 780, { duration: .12, volume: .17, group: 'rescue-hold' })] : []),
  ];
}

export function releaseCue(root) {
  return [
    stab(root - 12, { slide: hz(root - 19), slideTime: .083, type: 'steel', cutoff: 1890, sweep: 440,
      duration: .20, hold: .014, volume: .194 }),
    air(1200, 460, { duration: .11, volume: .13 }),
  ];
}
