import { botInputs } from './bots.js';
import { CREW, T, characterById, cleanInput, makeMatch, phaseAt, step } from './rules.js';

export function soloRoster(character) {
  const pilot = characterById(character).id;
  return [pilot, ...CREW.map(other => other.id).filter(id => id !== pilot)];
}

export function createSoloSession(firstSeed = 17321) {
  const pulseKeys = ['inward', 'outward', 'special'];
  let state, input, taps, crewInputs, paused;
  let accumulator = 0, tick = 0, seed = firstSeed;
  function clearInput() {
    input = cleanInput();
    taps = {};
  }
  return {
    get state() { return state; },
    get paused() { return paused; },
    start(character, timeScale, { finale = false, encounter, repeatSeed = false } = {}) {
      state = makeMatch(finale || repeatSeed ? firstSeed : seed++, {
        count: 4, timeScale, characters: soloRoster(character), encounter,
      });
      if (finale) {
        state.time = T.finalBreathAt;
        state.elapsed = state.time / state.timeScale;
        state.phase = phaseAt(state.time);
      }
      paused = false;
      accumulator = tick = 0;
      clearInput();
    },
    setInput(raw) {
      if (paused || state?.status !== 'playing') return;
      const next = cleanInput(raw);
      for (const key of pulseKeys) if (next[key] && !input[key]) taps[key] = true;
      input = next;
    },
    setPaused(value) {
      if (state?.status !== 'playing') return;
      paused = value;
      accumulator = 0;
      clearInput();
    },
    advance(seconds) {
      if (paused || state?.status !== 'playing') return;
      accumulator += Math.max(0, Math.min(seconds, .12));
      while (accumulator + 1e-9 >= T.step && state.status === 'playing') {
        if (tick++ % 4 === 0) crewInputs = botInputs(state);
        step(state, [{ ...input, taps }, ...crewInputs]);
        taps = {};
        accumulator = Math.max(0, accumulator - T.step);
      }
    }
  };
}
