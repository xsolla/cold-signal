import { T, ringName, CREW, characterById, moveSpeed, delta, wrap, cleanInput, controlledInput } from './rules.js';
import { Renderer } from './renderer.js';
import { Sound } from './audio.js';
const $ = id => document.getElementById(id);
const canvas = $('arena'), renderer = new Renderer(canvas), sound = new Sound();
let socket, code = '', slot = 0, snapshot = null, ready = [], connected = [], characters = [];
let config = { count: 4, timeScale: .5 }, pauses = [], diagnostics = false, controlled = false, userPaused = false;
let input = cleanInput(), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let predicted = null, lastFrame = performance.now(), lastEvent = 0, notice = '', connectionAttempts = 0, openedClients = 0;
const params = new URLSearchParams(location.search);
function send(message) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); }
function status(text, error = false) { $('connection').textContent = text; $('connection').classList.toggle('error', error); }
function showAudio() { $('mute').textContent = sound.enabled ? 'SOUND ON' : 'SOUND OFF'; $('mute').setAttribute('aria-pressed', String(!sound.enabled)); }
async function unlockAudio() { try { await sound.enable(); showAudio(); } catch { status('Audio unavailable. You can still play.'); } }
function setInput(next) { input = cleanInput(next); send({ type: 'input', input }); }
const formatTime = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
function entryOptions() {
  const scale = Number($('pace').value), count = Number($('crew-count').value);
  $('duration-label').textContent = `${scale === .5 ? '3 MIN' : '90 SEC'} · ${scale}×`;
  $('size-label').textContent = `${count} PLAYERS`;
}
function resetRoom() {
  renderer.resetEffects();
  code = ''; snapshot = null; predicted = null; ready = []; connected = []; characters = [];
  lastEvent = 0; pauses = []; userPaused = false; input = cleanInput(); controlled = false; openedClients = 0; notice = '';
  document.body.classList.remove('in-room'); $('entry').hidden = false; $('hud').hidden = true;
  $('overlay').hidden = true; $('pause').hidden = true; $('ability').hidden = true; $('footer-status').textContent = 'AUTO FIRE · COOPERATIVE PVE';
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
      $('entry').hidden = true; $('hud').hidden = false; $('pause').hidden = false; $('ability').hidden = false;
      canvas.focus();
    }
    if (msg.type === 'state') {
      if (snapshot?.status !== 'playing' && msg.state?.status === 'playing') {
        renderer.resetEffects();
        predicted = null; lastEvent = 0; userPaused = false; canvas.focus();
      }
      snapshot = msg.state; ready = msg.ready; connected = msg.connected; pauses = msg.paused;
      config = msg.config; characters = msg.characters;
      if (snapshot) {
        const a = snapshot.players[slot].angle;
        if (predicted === null || Math.abs(delta(a, predicted)) > .35 || snapshot.players[slot].down) predicted = a;
        else predicted = wrap(predicted + delta(a, predicted) * .22);
        const events = snapshot.events.filter(event => event.id > lastEvent);
        if (events.length) {
          lastEvent = events.at(-1).id;
          if (!pauses.some(Boolean)) sound.events(events);
        }
      }
      if (controlled && diagnostics && connected[slot] && !ready[slot] && snapshot?.status !== 'playing') send({ type: 'ready' });
      if (pauses.some(Boolean) || snapshot?.status !== 'playing') sound.suspend();
      else if (!document.hidden || controlled) sound.resume();
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
for (const character of CREW) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'character-card';
  button.dataset.character = character.id; button.setAttribute('role', 'radio'); button.setAttribute('aria-checked', 'false');
  button.setAttribute('aria-label', `${character.name}, ${character.role}, ${character.ability}`);
  button.innerHTML = `<span class="character-icon">${character.symbol}</span><strong>${character.name}</strong><span class="character-role">${character.role}</span><span class="character-power">${character.ability}</span><span class="character-description">${character.description}</span><em>“${character.quote}”</em>`;
  button.onclick = () => { $('lobby-error').textContent = ''; send({ type: 'character', character: character.id }); };
  $('character-select').append(button);
}
function updateUI() {
  if (!code) return;
  $('score').textContent = String(snapshot?.score || 0).padStart(6, '0');
  const time = snapshot?.time || 0, scale = config.timeScale;
  $('clock').innerHTML = `${formatTime(time / scale)}<span> / ${formatTime(T.duration / scale)}</span>`;
  $('phase').textContent = `${snapshot?.phase || 'ASSEMBLING CREW'} · ${scale}×`;
  $('crew').replaceChildren(...Array.from({ length: config.count }, (_, id) => {
    const chip = document.createElement('span'), p = snapshot?.players[id], character = characterById(p?.character || characters[id]);
    chip.className = (p?.down ? 'down ' : '') + (id === slot ? 'you' : '');
    chip.textContent = `${character.symbol} P${id + 1} ${id === slot ? 'YOU' : character.name.toUpperCase()} ${!connected[id] ? '—' : p?.down ? `DOWN ${ringName(p.ring)}` : p ? ringName(p.ring) : '●'}`;
    return chip;
  }));
  const own = snapshot?.players[slot], picked = characterById(characters[slot]);
  const currentCharacter = characterById(own?.character || picked.id);
  $('ability-name').textContent = currentCharacter.ability.toUpperCase();
  $('ability-state').textContent = own?.down ? 'DOWNED' : own?.specialCooldown > 0 ? `${Math.ceil(own.specialCooldown / scale)}s` : 'READY';
  const charge = Math.round(100 * (1 - (own?.specialCooldown || 0) / currentCharacter.cooldown));
  $('ability-bar').style.setProperty('--charge', `${charge}%`); $('ability-bar').setAttribute('aria-valuenow', String(charge));
  $('footer-status').textContent = controlled ? 'CONTROLLED TEST CLIENT' : own?.down ? `DOWNED · ${ringName(own.ring)} RING` : `AUTO FIRE · ${ringName(own?.ring)} RING`;
  $('arena-note').textContent = notice || (snapshot?.players.some(p => p.down) ? 'MATCH THEIR RING. STAY CLOSE TO RESCUE. FIRE IS AUTOMATIC.' : 'HIT A PACK TO START A CHAIN. THE BULLSEYE BLOCKS YOUR FIRE.');
  for (const button of $('character-select').children) button.setAttribute('aria-checked', String(button.dataset.character === picked.id));
  const selecting = !snapshot || ['won', 'lost'].includes(snapshot.status);
  $('character-select').hidden = !selecting; $('lobby-note').hidden = !selecting;
  $('overlay').classList.toggle('selecting', selecting);
  const show = (kicker, title, copy, readyButton = false, resumeButton = false) => {
    $('overlay').hidden = false; $('overlay-kicker').textContent = kicker; $('overlay-title').innerHTML = title;
    $('overlay-copy').textContent = copy; $('ready').hidden = !readyButton; $('resume').hidden = !resumeButton;
    $('ready').disabled = ready[slot]; $('ready').innerHTML = ready[slot] ? 'READY. WAITING FOR CREW…' : `READY AS ${picked.name.toUpperCase()} <span>→</span>`;
  };
  if (snapshot?.status === 'interrupted') return show('CONNECTION INTERRUPTED', 'REGROUP.<br>TRY AGAIN.', notice || 'Leave this room and form a fresh crew.');
  if (!snapshot) return show(`ROOM ${code} · ${connected.filter(Boolean).length}/${config.count} PILOTS · ${scale}×`, 'CHOOSE YOUR CREW.',
    connected.every(Boolean) ? 'A/D orbits. W/S jumps between three rings. Everyone shoots automatically. Press Space for your ability. Every pilot must finish.' : `Share the code. ${config.count - connected.filter(Boolean).length} more pilots needed. Choose your character while they join.`, true);
  if (snapshot.status === 'won') return show('TEAM CLEAR · ' + snapshot.score.toLocaleString() + ' POINTS', 'ALL THE WAY.<br>ALL OF US.', `${snapshot.rescues} rescues. Every ship made it through. Pick a character and ready up.`, true);
  if (snapshot.status === 'lost') return show('CREW LOST · ' + Math.floor(time / scale) + ' SECONDS', 'WE GO<br>AGAIN.', 'The tunnel took the crew. Cover each other. Time your abilities. Risk the rescue.', true);
  if (pauses.some(Boolean)) return show('SESSION PAUSED', 'HOLD<br>POSITION.', pauses[slot] ? 'Your client is paused. Resume when you are ready.' : 'Waiting for a crew member to return.', false, pauses[slot]);
  $('overlay').hidden = true; $('ready').hidden = true; $('resume').hidden = true;
}
$('create').onclick = async () => { await unlockAudio(); send({ type: 'create', count: Number($('crew-count').value), timeScale: Number($('pace').value) }); };
$('join').onclick = async () => { await unlockAudio(); send({ type: 'join', code: $('room-input').value }); };
$('room-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('join').click(); });
$('ready').onclick = async () => { await unlockAudio(); setInput({}); send({ type: 'ready' }); canvas.focus(); };
$('leave').onclick = () => { send({ type: 'leave' }); resetRoom(); status('Room server ready. Bring your crew.'); };
$('mute').onclick = async () => { if (sound.enabled) { sound.enabled = false; await sound.suspend(); } else await unlockAudio(); showAudio(); if (code) canvas.focus({ preventScroll: true }); };
$('motion').onclick = () => { reduced = !reduced; $('motion').setAttribute('aria-pressed', String(reduced)); $('motion').textContent = reduced ? 'MOTION REDUCED' : 'REDUCE MOTION'; if (code) canvas.focus({ preventScroll: true }); };
function pauseSession(value) { userPaused = value; setInput({}); send({ type: 'pause', paused: value || (document.hidden && !controlled) }); }
$('pause').onclick = () => pauseSession(!userPaused);
$('resume').onclick = () => { pauseSession(false); canvas.focus(); };
function key(event, down) {
  if (!code || event.target.matches('input, textarea, button, select') || controlled) return;
  const name = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'special', KeyW: 'inward', ArrowUp: 'inward', KeyS: 'outward', ArrowDown: 'outward' }[event.code];
  if (name) { event.preventDefault(); if (input[name] !== down) setInput({ ...input, [name]: down }); }
  if (down && !event.repeat && event.code === 'Escape') pauseSession(!userPaused);
}
window.addEventListener('keydown', e => key(e, true)); window.addEventListener('keyup', e => key(e, false));
window.addEventListener('blur', () => { if (!controlled) setInput({}); });
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
for (const action of ['tunnel', 'drill', 'final', 'wipe']) $(action).onclick = () => {
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
    sound.tick(snapshot, false);
  }
  renderer.render(snapshot, { joined: !!code, slot, reduced, paused: pauses.some(Boolean), now, predicted, roster: characters, crewCount: config.count }); requestAnimationFrame(frame);
}
$('crew-count').onchange = entryOptions; $('pace').onchange = entryOptions;
$('motion').setAttribute('aria-pressed', String(reduced)); $('motion').textContent = reduced ? 'MOTION REDUCED' : 'REDUCE MOTION'; entryOptions(); showAudio();
$('create').disabled = true; $('join').disabled = true; connect(); requestAnimationFrame(frame);
