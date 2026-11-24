import { CREW } from './rules.js';
import { pilotInstruments } from './audio-score.js';

export const arenaKeys = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'special', KeyW: 'inward', ArrowUp: 'inward', KeyS: 'outward', ArrowDown: 'outward' };

export const formatTime = seconds => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainder = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${minutes}:${remainder}`;
};

export function mountPilotPicker(list, onSelect) {
  for (const character of CREW) {
    const instrument = pilotInstruments[character.id];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'character-card';
    button.dataset.character = character.id;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.setAttribute('aria-label', `${character.name}, ${character.role}, ${character.ability}, ${instrument}`);
    button.setAttribute('aria-describedby', `ability-description-${character.id}`);
    button.innerHTML = `<span class="character-icon">${character.symbol}</span><strong>${character.name}</strong><span class="character-role">${character.role} · ${instrument}</span><span class="character-power">${character.ability}</span><span id="ability-description-${character.id}" class="character-description">${character.description}</span><em>“${character.quote}”</em>`;
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
