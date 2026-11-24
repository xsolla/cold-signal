export const BPM = 132;
export const STEP_SECONDS = 60 / BPM / 4;
export const BAR_STEPS = 16;
export const BAR_SECONDS = BAR_STEPS * STEP_SECONDS;

const FSharpMinor = { bass: 42, pad: [49, 57, 64, 66], lead: [61, 64, 69] };
const DMajor = { bass: 38, pad: [50, 57, 62, 66], lead: [61, 66, 69] };
const EAdd9 = { bass: 40, pad: [52, 59, 66, 68], lead: [59, 64, 68] };
const BMinor = { bass: 47, pad: [47, 54, 62, 69], lead: [59, 66, 69] };
const CSharpSuspended = { bass: 37, pad: [49, 56, 61, 66], lead: [61, 66, 68] };
export const chords = [FSharpMinor, DMajor, EAdd9, BMinor];
export const suspendedChord = CSharpSuspended;

const pack = (beat, angle, size, leader = 'rush') => ({ beat, squad: { angle, size, leader } });
const wall = (angle, width, speed = 128) => ({ beat: 0, wall: { angle, width, speed, radius: 327 } });
const bar = (chord, energy = 0, spawns = [], music = {}) => ({ chord, energy, spawns, ...music });
const theme = { motif: true };
const offbeat = { syncopated: true };
const answer = { motif: true, syncopated: true };
const drop = { motif: true, drop: true };
const swell = { swell: true };

const ingress = [
  // Bars 1–4. Establish the motif and give the first packs room.
  bar(FSharpMinor),
  bar(FSharpMinor, 0, [pack(0, -1.43, 3)], theme),
  bar(DMajor, 0, [pack(1, .18, 3)]),
  bar(DMajor, 0, [pack(0, 1.57, 3)], swell),
  // Bars 5–8. The first wall brings in the kick and offbeat bass.
  bar(FSharpMinor, 1, [wall(-.85, 1.85)], { ...drop, bass: true }),
  bar(FSharpMinor, 1, [pack(0, -2.19, 3)], { bass: true }),
  bar(EAdd9, 1, [pack(0, 2.82, 4)], { bass: true }),
  bar(EAdd9, 1, [pack(2, -.76, 3)], { ...theme, bass: true }),
  // Bars 9–12. Introduce rail threats and a second wall angle.
  bar(BMinor, 2, [pack(0, .35, 4, 'skimmer')], theme),
  bar(BMinor, 2, [pack(0, -1.65, 3)]),
  bar(DMajor, 2, [wall(-1.91, 1.72), pack(2, 1.42, 4)]),
  bar(EAdd9, 1, [pack(1, 2.85, 3)], theme),
  // Bars 13–16. A first crossing formation and a short drum break.
  bar(FSharpMinor, 2, [pack(0, -2.18, 4), pack(2, .23, 3)]),
  bar(FSharpMinor, 2, [pack(0, 1.31, 4, 'flank')], theme),
  bar(DMajor, 2, [pack(1.5, -.38, 4, 'stalker')]),
  bar(CSharpSuspended, 1, [], { swell: true, kickUntil: 2 }),
];

const crosscurrent = [
  // Bars 17–20. The gap rotates while the melody leaves space for depth hops.
  bar(BMinor, 2, [wall(-.73, 1.65), pack(1, -2.55, 4)]),
  bar(BMinor, 2, [pack(0, 1.45, 4, 'skimmer')], theme),
  bar(EAdd9, 2, [pack(0, -.27, 4), pack(2.5, 2.84, 3)]),
  bar(EAdd9, 2, [pack(0, -1.46, 4, 'flank')]),
  // Bars 21–24. New bass rhythm under a wall and an opposite-side patrol.
  bar(DMajor, 3, [wall(-2.22, 1.62), pack(2, .92, 4)], offbeat),
  bar(DMajor, 2, [pack(0, 2.53, 4, 'stalker')], answer),
  bar(FSharpMinor, 2, [pack(0, -2.64, 4), pack(2, -.48, 3)]),
  bar(FSharpMinor, 2, [pack(1, 1.58, 4, 'flank')], theme),
  // Bars 25–28. Split arcs, then give the answer to the SFX.
  bar(BMinor, 2, [pack(0, -1.41, 5), pack(2.5, 1.50, 3)], offbeat),
  bar(BMinor, 3, [wall(-1.17, 1.62), pack(2, 2.72, 4)], offbeat),
  bar(EAdd9, 2, [pack(0, .46, 4, 'skimmer')], answer),
  bar(EAdd9, 2, [pack(0, -2.40, 4, 'flank')]),
  // Bars 29–32. Unload the late wall before the first Breath.
  bar(DMajor, 3, [wall(-2.05, 1.65), pack(2, -1.72, 4)]),
  bar(DMajor, 2, [pack(0, 1.48, 4), pack(2.5, -.49, 3)]),
  bar(BMinor, 2, [pack(0, 2.70, 4)], theme),
  bar(CSharpSuspended, 1, [], { kickUntil: 2 }),
];

const firstBreath = [
  bar(DMajor),
  bar(DMajor, 0, [], theme),
  bar(EAdd9),
  bar(CSharpSuspended, 0, [], swell),
];

const firstPressure = [
  // Bars 37–48 are the existing Pressure rehearsal.
  bar(FSharpMinor, 3, [pack(0, -1.30, 5), pack(2, 1.50, 3)], drop),
  bar(FSharpMinor, 3, [pack(0, .15, 4, 'skimmer'), pack(2.5, -2.09, 4)]),
  bar(DMajor, 3, [wall(-.58, 1.55), pack(2, -2.40, 5, 'flank')]),
  bar(DMajor, 2, [pack(0, 1.42, 4), pack(2, -.47, 4, 'stalker')], theme),
  bar(BMinor, 3, [pack(0, -2.72, 5, 'flank'), pack(2, -.94, 5)], theme),
  bar(BMinor, 3, [pack(0, .47, 4, 'skimmer'), pack(2.5, 2.18, 4)]),
  bar(EAdd9, 3, [wall(-1.97, 1.42), pack(1.5, .55, 5, 'stalker')]),
  bar(EAdd9, 2, [pack(0, 2.72, 5, 'flank')], theme),
  bar(FSharpMinor, 4, [pack(0, -1.50, 5), pack(0, 1.64, 4, 'suppress')], theme),
  bar(DMajor, 3, [wall(-2.20, 1.55), pack(1.5, -2.60, 4, 'flank'), pack(2.5, .26, 3)]),
  bar(CSharpSuspended, 3, [pack(0, -1.30, 5, 'stalker')]),
  bar(CSharpSuspended, 1, [], { kickUntil: 2 }),
];

const secondPressure = [
  // Bars 49–56. Bring forward the syncopated bass and overlap the patrols.
  bar(BMinor, 3, [pack(0, 2.75, 4, 'skimmer'), pack(2, -.96, 4)], answer),
  bar(BMinor, 3, [wall(-1.30, 1.57), pack(2, .56, 4, 'flank')], offbeat),
  bar(EAdd9, 3, [pack(0, -2.36, 5, 'stalker')], offbeat),
  bar(EAdd9, 3, [pack(0, 1.22, 4), pack(2, -1.62, 4)], answer),
  bar(DMajor, 4, [wall(-.71, 1.52), pack(1.5, 2.57, 4, 'suppress')], offbeat),
  bar(DMajor, 3, [pack(0, -2.35, 4), pack(2, .05, 3)]),
  bar(FSharpMinor, 2, [pack(0, -1.42, 4), pack(0, 1.54, 4)], theme),
  bar(FSharpMinor, 1, [], { kickUntil: 2 }),
];

const secondBreath = [
  // Bars 57–60. Give the crew a recovery window.
  bar(DMajor),
  bar(EAdd9, 0, [], theme),
  bar(BMinor),
  bar(CSharpSuspended, 0, [], swell),
];

const convergence = [
  // Bars 61–64. Introduce a higher answer above the densest formations so far.
  bar(FSharpMinor, 3, [pack(0, -1.45, 5), pack(0, 1.60, 4, 'flank')], drop),
  bar(FSharpMinor, 3, [pack(0, 2.74, 4, 'skimmer')], offbeat),
  bar(DMajor, 3, [wall(-2.07, 1.55), pack(2, .35, 4)], offbeat),
  bar(DMajor, 3, [pack(0, -.55, 4, 'stalker'), pack(2.5, 1.12, 4)], { ...answer, octave: 1 }),
  // Bars 65–68. Force a choice between a closing gap and covering a beam lane.
  bar(BMinor, 4, [pack(0, -1.11, 4, 'suppress'), pack(0, 2.15, 4)], offbeat),
  bar(BMinor, 3, [wall(-.83, 1.52), pack(2, -2.26, 5)], offbeat),
  bar(EAdd9, 3, [pack(0, .21, 4, 'flank')], { ...answer, octave: 1 }),
  bar(EAdd9, 2, [pack(1, 1.78, 4, 'skimmer')], theme),
  // Bars 69–72. Reprise the first crossing formation in two directions.
  bar(DMajor, 3, [pack(0, -2.39, 5), pack(0, .68, 4)], offbeat),
  bar(DMajor, 3, [wall(-1.75, 1.55), pack(2, 2.42, 4, 'flank')]),
  bar(FSharpMinor, 4, [pack(0, -1.51, 4), pack(2.5, 1.26, 4, 'stalker')], { ...answer, octave: 1 }),
  bar(FSharpMinor, 3, [pack(0, -.15, 5, 'skimmer')]),
  // Bars 73–76. Last crossing into the quiet before the finale.
  bar(BMinor, 3, [wall(-2.33, 1.60), pack(2, -.54, 4)]),
  bar(EAdd9, 3, [pack(0, 1.53, 4), pack(2, -1.62, 4)], theme),
  bar(DMajor, 2, [pack(0, 2.79, 4)], theme),
  bar(CSharpSuspended, 1, [], { kickUntil: 2 }),
];

const finalBreath = [
  // Bars 77–80. Let the room decay into the suspended pickup.
  bar(DMajor),
  bar(EAdd9, 0, [], theme),
  bar(CSharpSuspended),
  bar(CSharpSuspended, 0, [], swell),
];

const finalSurge = [
  // Bars 81–84. Recall the opening theme on the first reveal.
  bar(FSharpMinor, 4, [pack(0, -1.42, 5), pack(0, 1.34, 4)], drop),
  bar(FSharpMinor, 4, [pack(0, .51, 4, 'flank'), pack(2.5, -2.38, 4)]),
  bar(DMajor, 3, [wall(-.85, 1.55, 144), pack(2, 2.04, 4, 'skimmer')]),
  bar(DMajor, 3, [pack(0, -1.71, 5), pack(2, .10, 4)], theme),
  // Bars 85–88. Bring back the low counter-rhythm and trade lanes.
  bar(BMinor, 4, [pack(0, 2.69, 4, 'suppress'), pack(0, -.82, 5)], answer),
  bar(BMinor, 3, [wall(-1.94, 1.55, 144), pack(2, 1.38, 4)], offbeat),
  bar(EAdd9, 4, [pack(0, -2.44, 5, 'flank'), pack(2.5, .38, 4)], offbeat),
  bar(EAdd9, 3, [pack(0, -1.42, 4, 'stalker')], theme),
  // Bars 89–92. Give the crew a half-phrase to recover between attacks.
  bar(DMajor, 3, [wall(-1.49, 1.62, 144), pack(2, 1.42, 4)]),
  bar(DMajor, 2, [pack(0, 2.50, 4)], theme),
  bar(BMinor, 4, [pack(0, -1.17, 5), pack(0, 1.88, 4, 'flank')], offbeat),
  bar(EAdd9, 3, [pack(0, .27, 5, 'skimmer')], answer),
  // Bars 93–96. Final crossfire and the full-height theme.
  bar(FSharpMinor, 4, [wall(-2.12, 1.58, 144), pack(2, -2.69, 4)], { ...theme, octave: 1 }),
  bar(FSharpMinor, 4, [pack(0, -1.38, 5), pack(0, 1.57, 4, 'suppress')], offbeat),
  bar(DMajor, 3, [pack(0, .39, 4, 'flank'), pack(2, 2.71, 3)]),
  bar(EAdd9, 3, [pack(0, -1.65, 4)], theme),
  // Bars 97–99. Three-bar cadence, then resolve or hold for a rescue.
  bar(BMinor, 2, [pack(0, 1.61, 4)], theme),
  bar(CSharpSuspended, 1),
  bar(CSharpSuspended, 1, [], { kickUntil: 2 }),
];

function compileChart(id, sections) {
  const bars = [], phases = [];
  for (const [phase, section] of sections) {
    phases.push({ phase, at: bars.length * BAR_SECONDS });
    bars.push(...section);
  }
  const spawns = bars.flatMap(({ spawns }, index) => spawns.map(({ beat, ...spawn }) => ({
    ...spawn, at: index * BAR_SECONDS + beat * 4 * STEP_SECONDS,
  })));
  return { id, bars, phases, spawns, endAt: bars.length * BAR_SECONDS };
}

export const sortieChart = compileChart('sortie', [
  ['INGRESS', ingress],
  ['CROSSCURRENT', crosscurrent],
  ['BREATH', firstBreath],
  ['PRESSURE', [...firstPressure, ...secondPressure]],
  ['BREATH', secondBreath],
  ['CONVERGENCE', convergence],
  ['BREATH', finalBreath],
  ['FINAL SURGE', finalSurge],
]);

export const pressureChart = compileChart('pressure', [
  ['BREATH', firstBreath],
  ['PRESSURE', firstPressure],
]);
