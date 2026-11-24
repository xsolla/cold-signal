import { T, ringName, characterById, moveSpeed, delta, wrap, cleanInput, controlledInput, overdriveRemaining } from './rules.js';
import { Renderer } from './renderer.js';
import { Sound } from './audio.js';
import { AudioFeedback } from './audio-feedback.js';
import { arenaKeys, formatTime, mountCrewReadout, mountPilotPicker, showCombatMeters, showCrewSignal, showSelectedPilot } from './pilot-ui.js';
const $ = id => document.getElementById(id);
const canvas = $('arena'), characterSelect = $('character-select');
const renderer = new Renderer(canvas), sound = new Sound();
const audioFeedback = new AudioFeedback();
let socket, code = '', slot = 0, snapshot = null, ready = [], connected = [], characters = [];
let config = { count: 4, timeScale: .5 }, pauses = [], diagnostics = false, controlled = false, userPaused = false;
let view = 'entry', soundPreference = null;
let crew = [];
let input = cleanInput(), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let predicted = null, lastFrame = performance.now(), lastEvent = 0, notice = '', connectionAttempts = 0, openedClients = 0;
const params = new URLSearchParams(location.search);
function send(message) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); }
function status(text, error = false) { $('connection').textContent = text; $('connection').classList.toggle('error', error); }
function showAudio() { $('mute').textContent = sound.enabled ? 'SOUND ON' : 'SOUND OFF'; $('mute').setAttribute('aria-pressed', String(!sound.enabled)); }
async function unlockAudio() {
  if (soundPreference === false || sound.enabled) return;
  try {
    await sound.enable();
    if (soundPreference === false) sound.enabled = false;
    showAudio();
    if (!sound.enabled || (code && view !== 'run')) await sound.suspend();
  } catch { status('Audio unavailable. You can still play.'); }
}
function setInput(next) { input = cleanInput(next); send({ type: 'input', input }); }
function entryOptions() {
  const scale = Number($('pace').value), count = Number($('crew-count').value);
  $('duration-label').textContent = `${scale === .5 ? '3 MIN' : '90 SEC'} · ${scale}×`;
  $('size-label').textContent = `${count} PLAYERS`;
}
function resetRoom() {
  renderer.resetEffects();
  sound.reset();
  audioFeedback.reset();
  void sound.suspend();
  code = ''; snapshot = null; predicted = null; ready = []; connected = []; characters = [];
  lastEvent = 0; pauses = []; userPaused = false; input = cleanInput(); controlled = false; openedClients = 0; notice = '';
  document.body.classList.remove('in-room', 'in-flight'); $('entry').hidden = false; $('hud').hidden = true;
  view = 'entry'; canvas.inert = true;
  $('overlay').hidden = true; $('pause').hidden = true; $('ability').hidden = true; $('leave').hidden = false;
  $('lobby-error').textContent = ''; $('arena-note').hidden = true; $('footer-status').textContent = 'AUTOMATIC FIRE';
}
function connect() {
  socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  socket.addEventListener('open', () => { connectionAttempts = 0; status('Room server ready. Bring your crew.'); $('create').disabled = false; $('join').disabled = false; });
  socket.addEventListener('message', event => {
    let msg; try { msg = JSON.parse(event.data); } catch { return; }
    if (msg.type === 'welcome') {
      diagnostics = msg.diagnostics; $('devtools').hidden = !diagnostics;
      if (diagnostics && params.get('room') && !code) {
        controlled = params.get('controlled') === '1'; send({ type: 'join', code: params.get('room') });
      }
    }
    if (msg.type === 'error') { status(msg.text, true); $('lobby-error').textContent = code ? msg.text : ''; }
    if (msg.type === 'notice') notice = msg.text;
    if (msg.type === 'joined') {
      code = msg.code; slot = msg.slot; config = msg.config; notice = ''; lastEvent = 0; predicted = null;
      $('room-code').textContent = code; document.body.classList.add('in-room');
      $('entry').hidden = true; $('hud').hidden = false;
    }
    if (msg.type === 'state') {
      if (snapshot?.status !== 'playing' && msg.state?.status === 'playing') {
        renderer.resetEffects();
        sound.reset();
        audioFeedback.reset();
        predicted = null; lastEvent = 0; userPaused = false;
      }
      snapshot = msg.state; ready = msg.ready; connected = msg.connected; pauses = msg.paused;
      config = msg.config; characters = msg.characters;
      const playing = snapshot?.status === 'playing';
      const finished = snapshot?.status === 'won' || snapshot?.status === 'lost';
      const silent = pauses.some(Boolean) || (document.hidden && !controlled);
      if (silent || (!playing && !finished)) void sound.suspend();
      else if (playing) void sound.resume();
      if (snapshot) {
        const a = snapshot.players[slot].angle;
        if (predicted === null || Math.abs(delta(a, predicted)) > .35 || snapshot.players[slot].down) predicted = a;
        else predicted = wrap(predicted + delta(a, predicted) * .22);
        const events = snapshot.events.filter(event => event.id > lastEvent);
        if (events.length) {
          lastEvent = events.at(-1).id;
          if (!silent && (playing || finished)) sound.events(events, snapshot);
        }
      }
      if (controlled && diagnostics && connected[slot] && !ready[slot] && snapshot?.status !== 'playing') send({ type: 'ready' });
      updateUI();
    }
  });
  socket.addEventListener('close', () => {
    resetRoom(); $('create').disabled = true; $('join').disabled = true;
    status('Connection lost. Reconnecting to the local server…', true);
    if (++connectionAttempts < 8) setTimeout(connect, 1500);
    else status('Room server unavailable. Refresh after the containers are running.', true);
  });
  socket.addEventListener('error', () => status('Cannot reach the local room server.', true));
}
mountPilotPicker(characterSelect, character => {
  $('lobby-error').textContent = '';
  send({ type: 'character', character: character.id });
});
function setOverlay(kicker, title, copy) {
  for (const [id, value] of [['overlay-kicker', kicker], ['overlay-title', title], ['overlay-copy', copy]]) {
    if ($(id).textContent !== value) $(id).textContent = value;
  }
}
function updateUI() {
  if (!code) return;
  $('score').textContent = String(snapshot?.score || 0).padStart(6, '0');
  const time = snapshot?.time || 0, scale = config.timeScale;
  const previousView = view;
  const status = snapshot?.status;
  if (status !== 'playing') view = status || 'lobby';
  else if (pauses.some(Boolean)) view = pauses[slot] ? 'local-pause' : 'crew-pause';
  else view = 'run';
  const selecting = ['lobby', 'won', 'lost'].includes(view);
  const running = view === 'run';

  if (!running && previousView === 'run') setInput({});
  document.body.classList.toggle('in-flight', running);
  canvas.inert = !running;
  $('pause').hidden = !running;
  $('ability').hidden = selecting || view === 'interrupted';
  $('hull').hidden = $('ability').hidden;
  $('clock').hidden = selecting;
  $('phase').hidden = selecting;
  $('score').parentElement.hidden = selecting;
  $('leave').hidden = view === 'interrupted';
  $('clock').innerHTML = `${formatTime(time / scale)}<span> / ${formatTime(T.duration / scale)}</span>`;
  $('phase').textContent = `${snapshot?.phase || 'ASSEMBLING CREW'} · ${scale}×`;
  if (crew.length !== config.count) crew = mountCrewReadout($('crew'), config.count);
  crew.forEach((chip, id) => {
    const pilot = snapshot?.players[id], character = characterById(selecting ? characters[id] : pilot?.character);
    const local = id === slot, offline = !connected[id], down = !selecting && !!pilot?.down;
    const overdrive = !selecting && !!pilot && overdriveRemaining(snapshot, pilot) > 0;
    const name = offline ? `P${id + 1}` : `${character.symbol} P${id + 1} ${local ? 'YOU' : character.name.toUpperCase()}`;
    const crewStatus = offline ? (selecting ? 'OPEN' : 'OFFLINE') : selecting ? (ready[id] ? 'READY' : 'JOINED') :
      `${down ? 'DOWN · ' : ''}${ringName(pilot.ring)}${overdrive ? ' ◆' : ''}`;
    showCrewSignal(chip, name, crewStatus, { local, down, overdrive, offline });
  });
  const own = snapshot?.players[slot], picked = characterById(characters[slot]);
  if (own && !selecting) showCombatMeters(snapshot, slot);
  $('footer-status').textContent = controlled ? 'CONTROLLED TEST CLIENT' : !own || selecting || view === 'interrupted' ? 'AUTOMATIC FIRE' :
    `${own.down ? 'DOWNED · ' : ''}${ringName(own.ring)} RING`;
  const rescue = own?.down ? 'YOUR CREW CAN RESCUE YOU.' : snapshot?.players.some(p => p.down) ? 'MATCH THEIR RING AND STAY CLOSE TO RESCUE.' : '';
  $('arena-note').textContent = notice || rescue;
  $('arena-note').hidden = !running || !(notice || rescue);
  const pickedButton = showSelectedPilot(characterSelect, picked.id);
  characterSelect.hidden = !selecting; $('lobby-note').hidden = !selecting;
  $('overlay').classList.toggle('selecting', selecting);
  $('overlay').hidden = running;
  $('ready').hidden = !selecting;
  $('resume').hidden = view !== 'local-pause';
  $('leave-interrupted').hidden = view !== 'interrupted';

  const readyLabel = ready[slot] ? `WAITING FOR CREW · ${ready.filter(Boolean).length}/${config.count} READY` : `READY AS ${picked.name.toUpperCase()}`;
  if ($('ready-label').textContent !== readyLabel) $('ready-label').textContent = readyLabel;
  $('ready').setAttribute('aria-disabled', String(!!ready[slot]));

  if (view === 'lobby') {
    const joined = connected.filter(Boolean).length;
    const missing = config.count - joined;
    setOverlay(`${joined}/${config.count} PILOTS · ${scale}×`, 'CHOOSE YOUR PILOT.',
      missing ? `Share the code. ${missing} more ${missing === 1 ? 'pilot' : 'pilots'} needed.` : 'Defend the hull. Match a downed pilot’s ring and stay close to rescue.');
  } else if (view === 'won') {
    setOverlay(`TEAM CLEAR · ${snapshot.score.toLocaleString()} POINTS`, 'ALL THE WAY. ALL OF US.',
      `${snapshot.rescues} ${snapshot.rescues === 1 ? 'rescue' : 'rescues'}. Every ship made it through. Pick a pilot and ready up for another run.`);
  } else if (view === 'lost') {
    setOverlay(`${snapshot.hull === 0 ? 'HULL LOST' : 'CREW LOST'} · ${Math.floor(time / scale)} SECONDS`, 'WE GO AGAIN.',
      'Pick a pilot and ready up to try again.');
  } else if (view === 'interrupted') {
    setOverlay('CONNECTION INTERRUPTED', 'REGROUP. TRY AGAIN.', notice || 'Leave this room and form a fresh crew.');
  } else if (!running) {
    setOverlay('SESSION PAUSED', 'HOLD POSITION.', view === 'local-pause' ?
      'You paused the crew. Select Resume or press Esc to continue.' : 'Waiting for a crew member to return.');
  }

  if (view !== previousView) {
    const focus = selecting ? pickedButton :
      { run: canvas, 'local-pause': $('resume'), 'crew-pause': $('overlay-title'), interrupted: $('leave-interrupted') }[view];
    focus?.focus({ preventScroll: true });
  }
}
$('create').onclick = () => {
  void unlockAudio();
  send({ type: 'create', count: Number($('crew-count').value), timeScale: Number($('pace').value) });
};
$('join').onclick = () => { void unlockAudio(); send({ type: 'join', code: $('room-input').value }); };
$('room-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('join').click(); });
$('ready').onclick = () => {
  if (ready[slot]) return;
  void unlockAudio();
  setInput({});
  send({ type: 'ready' });
};
function leaveRoom() {
  send({ type: 'leave' });
  resetRoom();
  status('Room server ready. Bring your crew.');
  $('create').focus({ preventScroll: true });
}
$('leave').onclick = leaveRoom;
$('leave-interrupted').onclick = leaveRoom;
$('mute').onclick = event => {
  soundPreference = !(soundPreference ?? sound.enabled);
  if (soundPreference) void unlockAudio();
  else {
    sound.enabled = false;
    showAudio();
    void sound.suspend();
  }
  if (event.detail && view === 'run') canvas.focus({ preventScroll: true });
};
$('motion').onclick = event => {
  reduced = !reduced;
  $('motion').setAttribute('aria-pressed', String(reduced));
  $('motion').textContent = reduced ? 'MOTION REDUCED' : 'REDUCE MOTION';
  if (event.detail && view === 'run') canvas.focus({ preventScroll: true });
};
function pauseSession(value) { userPaused = value; setInput({}); send({ type: 'pause', paused: value || (document.hidden && !controlled) }); }
$('pause').onclick = () => pauseSession(!userPaused);
$('resume').onclick = () => pauseSession(false);
function key(event, down) {
  if (controlled) return;
  const inArena = view === 'run' && event.target === canvas;
  if (down && !event.repeat && event.code === 'Escape' && (inArena || view === 'local-pause')) {
    event.preventDefault();
    pauseSession(view === 'run');
    return;
  }
  const name = arenaKeys[event.code];
  if (!name || (down && !inArena)) return;
  if (inArena) event.preventDefault();
  if (input[name] !== down) setInput({ ...input, [name]: down });
}
window.addEventListener('keydown', e => key(e, true)); window.addEventListener('keyup', e => key(e, false));
function releaseInputs() {
  if (!controlled && Object.values(input).some(Boolean)) setInput({});
}
window.addEventListener('blur', releaseInputs);
canvas.addEventListener('blur', releaseInputs);
document.addEventListener('visibilitychange', () => {
  if (controlled && diagnostics) return;
  setInput({}); send({ type: 'pause', paused: document.hidden || userPaused });
  if (document.hidden) sound.suspend();
});
$('partner').onclick = () => {
  if (!code) return status('Create a room before adding a controlled crew member.', true);
  if (connected.filter(Boolean).length >= config.count) return;
  window.open(`./?room=${code}&controlled=1`, `delve-controlled-${code}-${++openedClients}`, 'width=800,height=800');
  window.scrollTo(0, 0);
};
for (const action of ['tunnel', 'drill', 'final', 'wipe', 'charge']) $(action).onclick = () => {
  send({ type: 'diagnostic', action: action === 'drill' ? 'rescue' : action });
  canvas.focus({ preventScroll: true }); window.scrollTo(0, 0);
};
setInterval(() => {
  if (controlled && diagnostics && snapshot?.status === 'playing') input = controlledInput(snapshot, slot);
  if (code) send({ type: 'input', input });
}, 50);
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, .05); lastFrame = now;
  if (snapshot?.status === 'playing' && !pauses.some(Boolean)) {
    if (predicted !== null && !snapshot.players[slot].down) predicted = wrap(predicted + ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * moveSpeed(snapshot.players[slot]) * snapshot.timeScale * dt);
    sound.feedback(audioFeedback.update(snapshot, slot), snapshot);
    sound.tick(snapshot, false);
  }
  renderer.render(snapshot, { joined: !!code, slot, reduced, paused: pauses.some(Boolean), now, predicted, roster: characters, crewCount: config.count }); requestAnimationFrame(frame);
}
$('crew-count').onchange = entryOptions; $('pace').onchange = entryOptions;
$('motion').setAttribute('aria-pressed', String(reduced)); $('motion').textContent = reduced ? 'MOTION REDUCED' : 'REDUCE MOTION'; entryOptions(); showAudio();
$('create').disabled = true; $('join').disabled = true; connect(); requestAnimationFrame(frame);
