import { RINGS, step, T, wrap } from '../src/rules.js';

export const baseline = '24fd042e63691ef93a5c5013b080ee6eb8bcc4c5';
export const chainRoll = 'f93091ff1f01e51653053bb962572f1dbdfae134';
export const seed = 17321;

// Construct a reachable co-occurrence: one shot clears a connected squad while
// a pilot on the firing pilot's rail finishes being rescued on the same tick.
export function cascade(state, count, rescue = false) {
  const before = state.eventId;
  const angle = state.players[0].angle;
  state.enemyClock = state.wallClock = 100;
  state.walls = [];
  state.zones = [];
  for (const player of state.players) player.cooldown = 100;
  state.enemies = Array.from({ length: count }, (_, i) => ({
    id: state.nextId++, angle: wrap(angle + i * .01), base: wrap(angle + i * .01),
    radius: 140, type: 'rush', hp: 1, preview: 0, age: 0,
    turn: 1, pulse: 10, mode: 'approach', ring: null,
  }));
  state.bullets = [{ id: state.nextId++, owner: 0, angle, radius: 144 }];
  if (rescue) {
    const ring = state.players[0].ring;
    Object.assign(state.players[0], { radius: RINGS[ring], rally: 0 });
    Object.assign(state.players[1], {
      angle, ring, radius: RINGS[ring], down: true,
      rescue: T.rescueSeconds - T.step * state.timeScale / 2,
    });
  }
  step(state);
  return state.events.filter(event => event.id > before);
}
