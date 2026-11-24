import { CREW, T, characterById, ringName } from './rules.js';
import { createSoloSession, soloRoster } from './solo-session.js';
import { arenaKeys, formatTime, mountPilotPicker, showSelectedPilot } from './pilot-ui.js';
import { Renderer } from './renderer.js';
import { Sound } from './audio.js';
import { pressureChart, sortieChart } from './audio-chart.js';
import { AudioFeedback } from './audio-feedback.js';

const $ = id => document.getElementById(id);
const canvas = $('arena'), picker = $('character-select'), overlay = $('overlay');
const query = new URLSearchParams(location.search);
const pressureMix = query.get('pressure');
const pressure = pressureMix === 'synced' || pressureMix === 'original';
const finaleMix = query.get('finale');
const rehearsal = !pressure && (finaleMix === 'synced' || finaleMix === 'original');
const renderer = new Renderer(canvas), session = createSoloSession();
const sound = new Sound(null, { syncedFinale: finaleMix !== 'original', syncedPressure: pressureMix !== 'original' });
const audioFeedback = new AudioFeedback();
const keys = new Set();
const crew = CREW.map(() => $('crew').appendChild(document.createElement('span')));
let pilot = CREW[0], view = 'select', lastFrame, lastEvent = 0;
let roster = soloRoster(pilot.id);
let wantsSound = true, reduced = false;

function text(id, value) {
  const element = $(id);
  if (element.textContent !== value) element.textContent = value;
}

function showPilot() {
  text('start-label', `${session.state?.status === 'won' || session.state?.status === 'lost' ? 'RETRY' : 'LAUNCH'} AS ${pilot.name.toUpperCase()}`);
  showSelectedPilot(picker, pilot.id);
}

function setView(next) {
  view = next;
  const choosing = next === 'select', running = next === 'run';
  overlay.hidden = running;
  overlay.classList.toggle('selecting', choosing);
  $('selection').hidden = !choosing;
  $('paused-actions').hidden = next !== 'pause';
  $('hud').hidden = choosing;
  $('ability').hidden = choosing;
  $('arena-note').hidden = choosing;
  $('pause').hidden = !running;
  canvas.inert = !running;
}

function heading(kicker, title, copy) {
  text('overlay-kicker', kicker);
  text('overlay-title', title);
  text('overlay-copy', copy);
}

function selectPilot(result) {
  setView('select');
  text('footer-status', 'DESKTOP KEYBOARD');
  if (result?.status === 'won') {
    heading(`TEAM CLEAR · ${result.score.toLocaleString()} POINTS`, 'ALL THE WAY. ALL OF US.',
      `${result.rescues} ${result.rescues === 1 ? 'rescue' : 'rescues'}. Every ship made it through.`);
  } else if (result?.status === 'lost') {
    heading(`CREW LOST · ${formatTime(result.elapsed)}`, 'WE GO AGAIN.', 'Pick a pilot and launch another run.');
  } else if (pressure) {
    heading(`BREATH INTO PRESSURE · ${pressureMix === 'synced' ? 'SYNCED' : 'ORIGINAL'} SCORE`, 'CHOOSE YOUR PILOT.',
      'Four bars of Breath, then twelve bars of Pressure. Fly with three AI wingmates. Retries use the same enemy seed.');
  } else if (rehearsal) {
    heading(`FINALE REHEARSAL · ${finaleMix === 'synced' ? 'SYNCED' : 'ORIGINAL'} SCORE`, 'CHOOSE YOUR PILOT.',
      'Start in the last Breath with three AI wingmates. Retries use the same enemy seed.');
  } else {
    heading('SOLO · 3 AI WINGMATES', 'CHOOSE YOUR PILOT.',
      'Match a downed pilot’s ring and stay close to rescue them. All four ships must make it through.');
  }
  showPilot();
  $('overlay-title').focus({ preventScroll: true });
}

async function syncSound() {
  $('mute').setAttribute('aria-pressed', String(!wantsSound));
  text('mute', wantsSound ? 'SOUND ON' : 'SOUND OFF');
  if (!wantsSound) {
    sound.enabled = false;
    return sound.suspend();
  }
  try {
    if (sound.enabled) await sound.resume();
    else await sound.enable();
    sound.enabled = wantsSound;
    if (!wantsSound || view === 'pause') await sound.suspend();
  } catch {
    wantsSound = false;
    sound.enabled = false;
    $('mute').setAttribute('aria-pressed', 'true');
    text('mute', 'SOUND UNAVAILABLE');
  }
}

function showMotion() {
  $('motion').setAttribute('aria-pressed', String(reduced));
  text('motion', reduced ? 'MOTION REDUCED' : 'REDUCE MOTION');
}

function updateHud(state) {
  text('clock', formatTime(state.elapsed));
  text('phase', state.phase === 'BRING THEM BACK' ? 'OVERTIME' : state.phase);
  text('score', String(state.score).padStart(6, '0'));
  for (const ally of state.players) {
    const character = characterById(ally.character);
    const chip = crew[ally.id], ring = ringName(ally.ring);
    chip.classList.toggle('down', ally.down);
    chip.classList.toggle('you', ally.id === 0);
    const label = `${character.symbol} ${ally.id === 0 ? 'YOU' : character.name.toUpperCase()} ${ally.down ? 'DOWN · ' : ''}${ring}`;
    if (chip.textContent !== label) chip.textContent = label;
  }
  const own = state.players[0];
  const remaining = Math.ceil(own.specialCooldown / state.timeScale);
  const charge = String(Math.round(100 * (1 - own.specialCooldown / pilot.cooldown)));
  text('ability-state', own.down ? 'DOWNED' : remaining ? `${remaining}s` : 'READY');
  const bar = $('ability-bar');
  if (bar.getAttribute('aria-valuenow') !== charge) {
    bar.style.setProperty('--charge', `${charge}%`);
    bar.setAttribute('aria-valuenow', charge);
  }
  text('arena-note', own.down ? 'YOUR CREW CAN RESCUE YOU.' : state.players.some(ally => ally.down)
    ? 'MATCH THEIR RING AND STAY CLOSE TO RESCUE.' : 'FIRE IS AUTOMATIC. HIT A PACK TO START A CHAIN.');
}

function start() {
  keys.clear();
  const pace = Number($('pace').value);
  const encounter = pressure ? pressureChart : !rehearsal && pace === .5 ? sortieChart : undefined;
  session.start(pilot.id, pace, { finale: rehearsal, encounter, repeatSeed: pressure });
  renderer.resetEffects();
  sound.reset();
  audioFeedback.reset();
  lastEvent = 0;
  lastFrame = undefined;
  text('duration', `/ ${formatTime(session.state.encounter?.endAt ?? T.duration / session.state.timeScale)}`);
  text('ability-name', pilot.ability.toUpperCase());
  text('footer-status', '');
  updateHud(session.state);
  setView('run');
  canvas.focus({ preventScroll: true });
  void syncSound();
}

function pause(focusResume) {
  if (view !== 'run') return;
  keys.clear();
  session.setPaused(true);
  setView('pause');
  heading('RUN PAUSED', 'HOLD POSITION.', 'Select Resume or press Esc to continue.');
  if (focusResume) $('resume').focus({ preventScroll: true });
  void sound.suspend();
}

function resume() {
  if (view !== 'pause' || document.hidden) return;
  session.setPaused(false);
  lastFrame = undefined;
  setView('run');
  canvas.focus({ preventScroll: true });
  void syncSound();
}

function input(event, pressed) {
  if (event.code === 'Escape' && pressed && !event.repeat && view !== 'select') {
    event.preventDefault();
    if (view === 'run') pause(true);
    else resume();
    return;
  }
  if (!arenaKeys[event.code] || view !== 'run' || (pressed && (event.target !== canvas || event.repeat))) return;
  if (event.target === canvas) event.preventDefault();
  if (pressed) keys.add(event.code);
  else keys.delete(event.code);
  session.setInput(Object.fromEntries([...keys].map(code => [arenaKeys[code], true])));
}

function frame(now) {
  if (view === 'run') {
    session.advance((now - (lastFrame ?? now)) / 1000);
    const state = session.state;
    if (state.eventId > lastEvent) {
      sound.events(state.events.filter(event => event.id > lastEvent), state);
      lastEvent = state.eventId;
    }
    if (state.status === 'playing') sound.feedback(audioFeedback.update(state), state);
    sound.tick(state, false);
    updateHud(state);
    if (state.status !== 'playing') selectPilot(state);
  }
  lastFrame = now;
  const state = view === 'select' ? null : session.state;
  renderer.render(state, { joined: true, reduced, paused: view === 'pause', now, roster });
  requestAnimationFrame(frame);
}

mountPilotPicker(picker, character => { pilot = character; roster = soloRoster(character.id); showPilot(); });
if (rehearsal || pressure) {
  const other = (pressure ? pressureMix : finaleMix) === 'synced' ? 'original' : 'synced';
  const comparison = $('compare-finale');
  comparison.hidden = false;
  comparison.href = `?${pressure ? 'pressure' : 'finale'}=${other}`;
  comparison.textContent = `TRY THE ${other.toUpperCase()} SCORE`;
  if (pressure) {
    $('pace').replaceChildren(new Option(`0.5× · ${Math.round(pressureChart.endAt)} seconds`, '0.5'));
  } else {
    for (const option of $('pace').options) {
      const pace = Number(option.value);
      option.textContent = `${pace}× · ${(T.duration - T.finalBreathAt) / pace} seconds`;
    }
  }
  selectPilot();
} else showPilot();
showMotion();
$('start').disabled = false;
$('start').onclick = start;
$('pause').onclick = () => pause(true);
$('resume').onclick = resume;
$('stop').onclick = () => { renderer.resetEffects(); selectPilot(); };
$('mute').onclick = event => {
  wantsSound = !wantsSound;
  void syncSound();
  if (event.detail && view === 'run') canvas.focus({ preventScroll: true });
};
$('motion').onclick = event => {
  reduced = !reduced;
  showMotion();
  if (event.detail && view === 'run') canvas.focus({ preventScroll: true });
};
window.addEventListener('keydown', event => input(event, true));
window.addEventListener('keyup', event => input(event, false));
window.addEventListener('blur', () => pause(false));
canvas.addEventListener('blur', () => { keys.clear(); session.setInput({}); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(false); });
requestAnimationFrame(frame);
