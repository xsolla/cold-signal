import { CREW, T, characterById, hullShielded, overdriveRemaining, powerReady } from './rules.js';
import { pilotInstruments } from './audio-score.js';
import { drawFork, PALETTE } from './cold-signal.js';

export const arenaKeys = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'special', KeyW: 'inward', ArrowUp: 'inward', KeyS: 'outward', ArrowDown: 'outward' };

export const formatTime = seconds => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainder = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${minutes}:${remainder}`;
};

export function showCombatMeters(state, slot) {
  const pilot = state.players[slot];
  const character = characterById(pilot.character);
  const remaining = overdriveRemaining(state, pilot);
  const power = remaining ? Math.ceil(100 * remaining / T.overdriveSeconds) : Math.floor(100 * pilot.powerCharge / character.powerKills);
  const ready = powerReady(state, pilot);
  const status = remaining ? 'OVERDRIVE' : pilot.down ? 'DOWNED' : ready ? 'SPACE READY' : `${pilot.powerCharge}/${character.powerKills}`;
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element.textContent !== value) element.textContent = value;
  };
  setText('ability-name', character.ability.toUpperCase());
  setText('ability-state', status);
  const bar = document.getElementById('ability-bar');
  if (bar.getAttribute('aria-valuenow') !== String(power)) {
    bar.style.setProperty('--charge', `${power}%`);
    bar.setAttribute('aria-valuenow', String(power));
  }
  const powerText = remaining ? `${power}% · Overdrive active`
    : `${pilot.powerCharge} of ${character.powerKills} kills${ready ? ' · Press Space' : ''}`;
  if (bar.getAttribute('aria-valuetext') !== powerText) bar.setAttribute('aria-valuetext', powerText);
  const meter = document.getElementById('ability');
  const meterState = remaining ? 'overdrive' : pilot.down ? 'down' : ready ? 'ready' : 'charging';
  if (meter.dataset.state !== meterState) meter.dataset.state = meterState;

  const hull = document.getElementById('hull');
  hull.classList.toggle('critical', state.hull <= T.hullMax * .25);
  setText('hull-value', `${Math.ceil(100 * state.hull / T.hullMax)}%`);
  document.getElementById('hull-shield').hidden = !hullShielded(state);
}

export function mountCrewReadout(list, count) {
  const chips = Array.from({ length: count }, () => {
    const chip = document.createElement('span');
    chip.append(document.createElement('strong'), ' ', document.createElement('small'));
    return chip;
  });
  list.replaceChildren(...chips);
  return chips;
}

export function showCrewSignal(chip, name, status, { local, down, overdrive, offline }) {
  const identity = chip.firstElementChild, detail = chip.lastElementChild;
  if (identity.textContent !== name) identity.textContent = name;
  if (detail.textContent !== status) detail.textContent = status;
  chip.title = overdrive ? 'Overdrive active' : '';
  chip.classList.toggle('you', local);
  chip.classList.toggle('down', down);
  chip.classList.toggle('offline', offline);
  chip.classList.toggle('overdrive', overdrive);
}

export function mountPilotPicker(list, onSelect) {
  for (const character of CREW) {
    const instrument = pilotInstruments[character.id];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'character-card';
    button.dataset.character = character.id;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.setAttribute('aria-label', `${character.name}, ${character.role}, ${character.ability}, ${instrument}, ${character.powerKills} kills to charge`);
    button.setAttribute('aria-describedby', `ability-description-${character.id}`);
    button.innerHTML = `<span class="character-art" aria-hidden="true"><img alt="" width="72" height="56"></span><span class="character-icon" aria-hidden="true">${character.symbol}</span><strong>${character.name}</strong><span class="character-role">${character.role} · ${instrument}</span><span class="character-power">${character.ability} · ${character.powerKills} kills</span><span id="ability-description-${character.id}" class="character-description">${character.description}</span>`;
    const portrait = document.createElement('canvas');
    portrait.width = 144;
    portrait.height = 112;
    const art = portrait.getContext('2d');
    art.translate(72, 56);
    art.scale(3, 3);
    drawFork(art, character.id === 'sana' ? PALETTE.accent : PALETTE.signal, PALETTE.paper, character.sides);
    button.querySelector('img').src = portrait.toDataURL();
    button.onclick = () => onSelect(character);
    list.append(button);
  }
  list.addEventListener('keydown', event => {
    const direction = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    if (!direction) return;
    const cards = [...list.children];
    const index = cards.indexOf(event.target);
    if (index < 0) return;
    event.preventDefault();
    const next = cards[(index + direction + cards.length) % cards.length];
    next.focus({ preventScroll: true });
    next.click();
  });
}

export function showSelectedPilot(list, id) {
  let selected;
  for (const button of list.children) {
    const checked = button.dataset.character === id;
    button.setAttribute('aria-checked', String(checked));
    button.tabIndex = checked ? 0 : -1;
    if (checked) selected = button;
  }
  return selected;
}
