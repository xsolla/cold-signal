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

const curve = (beat, angle, size, bend, spacing = .20) =>
  ({ beat, squad: { angle, size, leader: 'rush', bend, spacing } });
const sweep = (beat, angle, size, bend) => ({ kind: 'sweep', beat, spawns: [curve(beat, angle, size, bend)] });
const pincer = (beat, angle, left, right) => ({ kind: 'pincer', beat, spawns: [
  curve(beat, angle - .90, left, .65, .13), curve(beat, angle + .90, right, -.65, .13),
] });
const ladder = (beat, angle, size, leader, degree) =>
  ({ kind: 'ladder', beat, degree, spawns: [pack(beat, angle, size, leader)] });
function gate(beat, angle, width, travelBeats = 3) {
  const travelSeconds = travelBeats * 4 * STEP_SECONDS;
  return { kind: 'gate', beat, travelBeats, spawns: [{ beat, wall: { angle, width, travelSeconds, radius: 327 } }] };
}

// Groups play as recurring phrases. These bars replace the ordinary packs
// and reinforcements at the same spot in the complete run.
const figures = new Map([
  // Teach a sweep early, then answer it from the opposite direction.
  [2, [sweep(0, -2.12, 3, .72)]],
  [3, [sweep(1, -1.23, 3, .72)]],
  [4, [sweep(0, -.31, 3, .72)]],
  [9, [sweep(0, 1.45, 4, -.72)]],
  [10, [sweep(0, .68, 3, -.72), sweep(2, -.30, 3, -.55)]],
  [13, [pincer(0, -1.48, 4, 3)]],
  [14, [pincer(0, 1.55, 3, 4)]],
  // Crosscurrent switches the safe route and then repeats the entrance in reverse.
  [18, [sweep(0, -2.54, 4, .74)]],
  [19, [sweep(0, -1.49, 4, .74), sweep(2.5, -.40, 3, .74)]],
  [20, [sweep(0, 1.86, 4, -.74), sweep(2.5, .52, 4, -.74)]],
  [25, [pincer(0, -1.44, 4, 4)]],
  [26, [gate(0, -2.04, 1.63), ladder(2, .91, 4, 'skimmer', 1)]],
  [27, [gate(0, -1.08, 1.63), sweep(2, -2.26, 4, .73), sweep(3, 1.70, 4, -.73)]],
  // Pressure's drop opens both arms, then staggered depths pull fire between rails.
  [37, [pincer(0, -1.46, 4, 4), ladder(2, 1.49, 4, 'skimmer', 1)]],
  [38, [pincer(0, 1.24, 4, 4)]],
  [41, [ladder(0, -1.87, 5, 'stalker', 0), ladder(1.5, -.59, 4, 'skimmer', 1), ladder(3, .69, 5, 'suppress', 2)]],
  [42, [ladder(0, 1.75, 4, 'skimmer', 1), ladder(2, 2.73, 4, 'stalker', 0)]],
  [43, [gate(0, -1.88, 1.37), ladder(1.5, -.72, 5, 'suppress', 2), ladder(3, 1.52, 4, 'skimmer', 1)]],
  [44, [gate(0, -.90, 1.43), pincer(2, 2.4, 5, 4)]],
  [49, [ladder(0, 2.75, 5, 'stalker', 0), ladder(1.5, -.46, 4, 'skimmer', 1), ladder(3, -1.76, 3, 'suppress', 2)]],
  [50, [gate(0, -1.27, 1.46), pincer(2, .85, 4, 4)]],
  // Convergence combines bends, walls and patrols in the same phrases.
  [61, [pincer(0, -1.53, 5, 4), sweep(1.5, 2.45, 5, -.93)]],
  [62, [sweep(0, .80, 4, .96), ladder(3, -2.48, 4, 'skimmer', 1)]],
  [64, [ladder(0, -.80, 4, 'stalker', 0), ladder(1, .89, 4, 'skimmer', 1), ladder(2.5, 2.35, 4, 'suppress', 2)]],
  [65, [pincer(0, -.22, 4, 4), ladder(2, 2.41, 4, 'suppress', 2)]],
  [69, [pincer(0, -1.86, 5, 4)]],
  [70, [gate(0, -1.78, 1.41), pincer(2, 1.21, 4, 4)]],
  [71, [gate(0, -.78, 1.41), ladder(1, -.09, 4, 'stalker', 0), ladder(2.5, 1.37, 5, 'skimmer', 1), ladder(3.5, 2.66, 4, 'suppress', 2)]],
  // The finale revisits each idea in tighter succession.
  [81, [pincer(0, -1.48, 5, 4), ladder(1, 2.75, 5, 'skimmer', 1), sweep(2, .15, 4, .88)]],
  [82, [sweep(0, .51, 4, -.88), sweep(1.5, -1.21, 5, -.88), sweep(3, -2.48, 4, .88)]],
  [83, [gate(0, -.84, 1.39), pincer(2, 1.88, 5, 4)]],
  [84, [gate(0, -1.88, 1.39), ladder(0, -2.7, 5, 'stalker', 0), ladder(1.5, 1.21, 5, 'skimmer', 1), ladder(3, .09, 4, 'suppress', 2)]],
  [87, [sweep(0, -2.60, 5, .92), sweep(1.5, -1.28, 5, .92), sweep(3, .30, 4, .92)]],
  [88, [pincer(0, 1.51, 5, 4)]],
  [92, [ladder(0, -2.32, 5, 'stalker', 0), ladder(2, .41, 5, 'skimmer', 1)]],
  [93, [gate(0, -2.10, 1.41), ladder(2, .68, 4, 'suppress', 2), sweep(3, -2.65, 5, .78)]],
  [94, [gate(0, -1.09, 1.41), pincer(0, -1.46, 5, 4), pincer(2, 1.69, 5, 4)]],
  [96, [sweep(0, -2.64, 5, .90), sweep(1.5, -1.38, 5, .90), sweep(3, -.16, 4, .90)]],
  [97, [pincer(0, 1.51, 5, 4), sweep(1.5, -1.35, 4, -.82)]],
]);

function compileChart(id, sections, choreography = new Map()) {
  const bars = [], phases = [];
  const cues = [], accents = [];
  for (const [phase, section] of sections) {
    phases.push({ phase, at: bars.length * BAR_SECONDS });
    for (const phrase of section) {
      const barIndex = bars.length;
      const barFigures = choreography.get(barIndex + 1);
      bars.push(barFigures ? { ...phrase, spawns: barFigures.flatMap(figure => figure.spawns) } : phrase);
      for (const { kind, beat, degree, spawns, travelBeats } of barFigures ?? []) {
        const step = barIndex * BAR_STEPS + beat * 4;
        const cue = { kind, degree, at: step * STEP_SECONDS, squads: spawns.flatMap(spawn => spawn.squad ?? []),
          wall: spawns.find(spawn => spawn.wall)?.wall };
        cues.push(cue);
        (accents[step] ??= []).push(cue);
        if (travelBeats) {
          const arrival = step + travelBeats * 4;
          const crossing = { kind: 'gate-crossing', at: arrival * STEP_SECONDS, wall: cue.wall };
          cues.push(crossing);
          (accents[arrival] ??= []).push(crossing);
        }
      }
    }
  }
  const spawns = bars.flatMap(({ spawns }, index) => spawns.map(({ beat, ...spawn }) => ({
    ...spawn, at: index * BAR_SECONDS + beat * 4 * STEP_SECONDS,
  })));
  cues.sort((a, b) => a.at - b.at);
  return { id, bars, phases, spawns, cues, accents, endAt: bars.length * BAR_SECONDS };
}

function transpose(chord, semitones) {
  return {
    bass: chord.bass + semitones,
    pad: chord.pad.map(note => note + semitones),
    lead: chord.lead.map(note => note + semitones),
  };
}

// Reinforcements answer the existing packs from another lane or beat so one
// chain can't sweep both. Bar numbers here are relative to their stage.
const ingressReinforcements = [
  [7, pack(2, .34, 3)],
  [10, pack(2, 1.54, 3)],
  [12, pack(3, -1.45, 3)],
  [14, pack(3, -.57, 3)],
];
const crosscurrentReinforcements = [
  [1, pack(2.5, 1.13, 3)],
  [4, pack(2.5, -2.73, 4)],
  [7, pack(2.5, 2.92, 3, 'flank')],
  [11, pack(2, 1.37, 4)],
  [15, pack(2, -.72, 4)],
];
const pressureReinforcements = [
  [1, pack(1, .45, 4, 'flank')],
  [3, pack(0, -.72, 4)],
  [5, pack(1, .86, 4, 'skimmer')],
  [7, pack(0, -2.00, 4, 'flank')],
  [8, pack(2, .31, 4)],
  [9, pack(2, -2.59, 4)],
  [11, pack(2, .37, 4, 'skimmer')],
  [13, pack(1, .83, 4, 'flank')],
  [14, pack(0, -2.55, 4)],
  [16, pack(1, 2.87, 4)],
  [17, pack(0, -2.01, 4, 'flank')],
  [19, pack(1.5, 2.75, 4)],
];
const convergenceReinforcements = [
  [1, pack(1.5, -.35, 5)],
  [2, pack(3, .47, 4)],
  [4, pack(1, -2.65, 4)],
  [5, pack(3, -2.41, 4)],
  [7, pack(1.5, 2.81, 5, 'stalker')],
  [8, pack(0, -1.55, 5), pack(2.5, -.42, 4)],
  [10, pack(3, -2.52, 4, 'skimmer')],
  [11, pack(1.5, 2.71, 5)],
  [13, pack(0, 1.89, 5, 'flank')],
  [14, pack(1, 2.96, 5)],
  [15, pack(1.5, .14, 4)],
];
const surgeReinforcements = [
  [1, pack(1, 2.75, 5, 'skimmer'), pack(2, .15, 4)],
  [2, pack(1, -1.48, 5)],
  [3, pack(0, -.65, 5)],
  [4, pack(1, 2.55, 5, 'flank')],
  [5, pack(3, -2.40, 5)],
  [6, pack(0, -1.28, 5, 'stalker')],
  [7, pack(1, 1.54, 5)],
  [8, pack(0, .83, 5, 'suppress')],
  [9, pack(0, -2.53, 5)],
  [10, pack(1, -1.44, 5)],
  [11, pack(1.5, 2.95, 5)],
  [12, pack(1, -2.29, 5, 'flank')],
  [13, pack(0, .04, 5)],
  [14, pack(1, -2.61, 5), pack(2.5, .57, 4)],
  [15, pack(1, -1.65, 5)],
  [16, pack(1, .21, 5, 'skimmer'), pack(2.5, 1.61, 5)],
  [17, pack(0, -2.77, 5), pack(1.5, -.77, 4)],
];

function combatStage(section, { semitones, drive, reinforcements, wallWidth = 1, wallSpeed = 0 }) {
  const voicings = new Map([...chords, suspendedChord].map(chord => [chord, transpose(chord, semitones)]));
  const additions = new Map(reinforcements.map(([number, ...spawns]) => [number, spawns]));
  return section.map((phrase, index) => {
    const firstBar = index === 0 && drive > 0;
    const spawns = [...phrase.spawns, ...(additions.get(index + 1) ?? [])].sort((a, b) => a.beat - b.beat);
    return {
      ...phrase,
      chord: voicings.get(firstBar ? FSharpMinor : phrase.chord),
      energy: phrase.energy < 2 ? phrase.energy : Math.max(phrase.energy, [2, 2, 3, 3, 4][drive]),
      drop: firstBar || phrase.drop,
      drive,
      spawns: spawns.map(spawn => spawn.wall ? { ...spawn, wall: {
        ...spawn.wall, width: spawn.wall.width * wallWidth, speed: spawn.wall.speed + wallSpeed,
      } } : spawn),
    };
  });
}

function breathStage(tonic, pivot, pulse) {
  return [
    bar(tonic, 0, [], { breathPulse: pulse }),
    bar(tonic, 0, [], { ...theme, breathPulse: pulse }),
    bar(tonic, 0, [], { breathPulse: pulse }),
    bar(pivot, 0, [], { ...swell, breathPulse: pulse }),
  ];
}

const finalKeyShift = 5;
export const sortieChart = compileChart('sortie', [
  ['INGRESS', combatStage(ingress, { semitones: 0, drive: 0, reinforcements: ingressReinforcements })],
  ['CROSSCURRENT', combatStage(crosscurrent, {
    semitones: 1, drive: 1, reinforcements: crosscurrentReinforcements,
  })],
  ['BREATH', breathStage(transpose(DMajor, 1), transpose(CSharpSuspended, 2), 1)],
  ['PRESSURE', combatStage([...firstPressure, ...secondPressure], {
    semitones: 2, drive: 2, reinforcements: pressureReinforcements, wallWidth: .93,
  })],
  ['BREATH', breathStage(transpose(DMajor, 2), transpose(CSharpSuspended, 4), 2)],
  ['CONVERGENCE', combatStage(convergence, {
    semitones: 4, drive: 3, reinforcements: convergenceReinforcements, wallWidth: .93, wallSpeed: 3,
  })],
  ['BREATH', breathStage(transpose(DMajor, -1), transpose(CSharpSuspended, finalKeyShift), 3)],
  ['FINAL SURGE', combatStage(finalSurge, {
    semitones: finalKeyShift, drive: 4, reinforcements: surgeReinforcements, wallWidth: .90, wallSpeed: 6,
  })],
], figures);
sortieChart.clearTranspose = finalKeyShift;
sortieChart.overtimeChord = transpose(CSharpSuspended, finalKeyShift);

export const pressureChart = compileChart('pressure', [
  ['BREATH', firstBreath],
  ['PRESSURE', firstPressure],
]);
