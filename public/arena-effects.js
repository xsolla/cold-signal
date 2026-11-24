import { T, TAU, depthScale, overdriveRemaining, pointAt } from './rules.js';

export const arenaSpan = 690;
const extent = arenaSpan / 2;
const waveLimit = 8;
const particlesPerEmitter = 72;
const emitterLimit = 88;
const emitterStride = 16;

const cyan = [.24, .87, 1], violet = [.55, .35, 1], warm = [1, .39, .25], pink = [1, .28, .72];
const ice = [.64, .94, 1], mint = [.29, 1, .73];

// Each burst supplies its direction of travel, spread, and color to both the
// debris and the tunnel response. Durations use the same clock as Canvas cues.
const bursts = {
  kill: { count: 56, life: .78, speed: 310, curl: .8, light: .32, wave: .5, color: cyan },
  chain: { count: 46, life: .84, speed: 335, curl: 1.35, light: .28, wave: .58, color: violet },
  breach: { count: 64, life: .77, speed: 255, curl: .55, light: .48, wave: 1.05, color: warm, spread: Math.PI * .85 },
  blocked: { count: 42, life: .62, speed: 210, curl: .7, light: .36, wave: .65, color: ice, spread: Math.PI },
  down: { count: 66, life: .95, speed: 185, curl: .8, light: .42, wave: .85, color: warm },
  shield: { count: 42, life: .59, speed: 250, curl: 1.3, light: .36, wave: .65, color: ice },
  rescue: { count: 72, life: 1.08, speed: 275, curl: 1.9, light: .5, wave: 1.25, color: mint },
  mara: { count: 72, life: 1, speed: 270, curl: .6, light: .47, wave: 1.4, color: ice },
  ivo: { count: 72, life: 1.08, speed: 420, curl: .85, light: .48, wave: 1.55, color: cyan, spread: Math.PI * 1.2 },
  sana: { count: 72, life: 1.1, speed: 275, curl: 2.1, light: .49, wave: 1.4, color: pink },
  rook: { count: 72, life: .91, speed: 390, curl: 1.65, light: .47, wave: 1.4, color: mint, spread: Math.PI * .8 },
  muzzle: { count: 7, life: .17, speed: 106, curl: .35, light: .19, spread: 1.65 },
};

const fieldVertex = `#version 300 es
void main() {
  vec2 corner = vec2(gl_VertexID & 1, gl_VertexID >> 1);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

const fieldFragment = `#version 300 es
precision highp float;
uniform float u_size, u_time, u_overdrive, u_energy;
uniform int u_waveCount;
uniform vec4 u_waves[${waveLimit}]; // origin, age, strength
out vec4 light;

float gridLine(float coordinate, float width) {
  float distanceToLine = abs(fract(coordinate + 0.5) - 0.5);
  return 1.0 - smoothstep(0.0, width, distanceToLine);
}
float band(float offset, float width) {
  return 1.0 - smoothstep(0.0, width, abs(offset));
}
void main() {
  vec2 p = (gl_FragCoord.xy / u_size - 0.5) * vec2(${2 * extent}.0, -${2 * extent}.0);
  float radius = length(p);
  if (radius > 339.0 || radius < 24.0) discard;
  float activity = u_energy + u_overdrive * 0.62;
  vec2 warp = vec2(0.0);
  vec3 spectrum = vec3(0.0);
  float pressure = 0.0;
  for (int i = 0; i < u_waveCount; ++i) {
    vec4 wave = u_waves[i];
    vec2 offset = p - wave.xy;
    float dist = length(offset);
    float age = wave.z;
    float width = 11.0 + age * 24.0;
    float front = dist - (5.0 + age * (142.0 + wave.w * 42.0));
    float envelope = wave.w * (1.0 - age) * (1.0 - age);
    float push = band(front, width * 1.65) - 0.55 * band(front + width, width * 1.55);
    warp += offset / max(1.0, dist) * push * envelope * 21.0;
    pressure += envelope * band(front, width * 2.0);
    // Separated color peaks give the moving pressure front a prismatic edge.
    spectrum += vec3(band(front + 5.0, width), band(front - 2.0, width),
                     band(front - 7.0, width)) * envelope * vec3(0.67, 0.52, 1.0);
  }

  vec2 q = p + clamp(warp, -29.0, 29.0);
  float r = length(q);
  float angle = atan(q.y, q.x);
  float turn = r * 0.0047 + activity * 0.2 * sin(r * 0.031 - u_time * 2.8);
  float spokes = gridLine((angle + turn) * (24.0 / 6.283185), 0.064);
  float counterSpokes = gridLine((angle - turn) * (24.0 / 6.283185), 0.051);
  float rings = gridLine(r * 0.068 - u_time * 1.7, 0.082);
  float mesh = spokes * 0.32 + counterSpokes * (0.09 + activity * 0.18) + rings * 0.27;
  vec3 tint = mix(vec3(0.17, 0.30, 0.59), vec3(0.59, 0.17, 0.92),
                  0.5 + 0.5 * sin(angle * 4.0 - r * 0.045 + u_time * 1.8));
  vec3 rgb = tint * mesh * (0.27 + activity * 0.65 + min(1.0, pressure) * 0.69);
  rgb += min(vec3(1.1), spectrum) * (0.035 + mesh * 0.36);
  float hullFlow = 0.47 + 0.53 * pow(0.5 + 0.5 * cos(angle * 9.0 - u_time * 5.0), 3.0);
  rgb += tint * band(r - 273.0, 18.0) * hullFlow * u_overdrive * 0.36;
  rgb = min(vec3(0.5), rgb) * smoothstep(24.0, 47.0, radius) * (1.0 - smoothstep(285.0, 337.0, radius));
  light = vec4(rgb, max(max(rgb.r, rgb.g), rgb.b));
}`;

const particleVertex = `#version 300 es
precision highp float;
layout(location = 0) in vec4 origin; // xy, heading, spread
layout(location = 1) in vec4 timing; // age, life, scale, seed
layout(location = 2) in vec4 pigment; // rgb, count
layout(location = 3) in vec3 motion; // curl, light, speed
out vec2 uv;
flat out vec3 tint;
flat out float intensity;

float random(float seed) { return fract(sin(seed) * 43758.5453); }
void main() {
  float i = float(gl_InstanceID % ${particlesPerEmitter});
  float seed = timing.w * 0.137 + i * 1.71;
  float lifetime = timing.y * mix(0.51, 1.0, random(seed + 0.732));
  float t = timing.x / lifetime;
  if (i >= pigment.w || t >= 1.0) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    return;
  }
  float luck = random(seed + 18.52);
  float angle = origin.z + (random(seed) - 0.5) * origin.w;
  float curl = motion.x * mix(-1.0, 1.0, random(seed + 6.37));
  angle += curl * t * t;
  vec2 direction = vec2(cos(angle), sin(angle));
  float speed = motion.z * mix(0.17, 1.0, luck);
  float travel = (3.0 + luck * 12.0 + speed * timing.x * (1.04 - 0.49 * t)) * timing.z;
  vec2 center = origin.xy + direction * travel;
  vec2 tangent = vec2(cos(angle + curl * t), sin(angle + curl * t));
  uv = vec2(gl_VertexID & 1, gl_VertexID >> 1) * 2.0 - 1.0;
  float streak = (2.5 + speed * 0.049 * (1.0 - t)) * mix(0.22, 1.0, step(0.27, luck));
  float width = mix(1.9, 4.9, random(seed + 41.17)) * (1.0 - t * 0.38);
  vec2 p = center + (uv.x * tangent * streak + uv.y * vec2(-tangent.y, tangent.x) * width) * timing.z;
  gl_Position = vec4(p * vec2(1.0, -1.0) / ${extent}.0, 0.0, 1.0);

  vec3 alternate = mix(vec3(1.0, 0.15, 0.69), vec3(0.13, 0.83, 1.0), random(seed + 9.19));
  tint = mix(pigment.rgb, alternate, 0.48 * random(seed + 23.03));
  intensity = motion.y * (1.0 - t) * mix(0.5, 1.0, luck)
    * mix(0.54, 1.0, smoothstep(0.0, 0.075, timing.x))
    * (1.0 - smoothstep(304.0, 341.0, length(center)));
}`;

const particleFragment = `#version 300 es
precision mediump float;
in vec2 uv;
flat in vec3 tint;
flat in float intensity;
out vec4 light;
void main() {
  float tail = smoothstep(-1.0, 0.58, uv.x) * (1.0 - smoothstep(0.65, 1.0, uv.x));
  float glow = (1.0 - smoothstep(0.0, 1.0, abs(uv.y))) * (1.0 - smoothstep(0.4, 1.0, abs(uv.x)));
  float core = (1.0 - smoothstep(0.025, 0.31, abs(uv.y))) * tail;
  vec3 rgb = (tint * glow * 0.87 + mix(tint, vec3(1.0), 0.42) * core * 1.1) * intensity;
  light = vec4(rgb, max(max(rgb.r, rgb.g), rgb.b));
}`;

function makeProgram(gl, vertex, fragment, uniforms = []) {
  const program = gl.createProgram();
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (compiled) gl.attachShader(program, shader);
      gl.deleteShader(shader);
      if (!compiled) throw new Error('Arena shader compilation failed');
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Arena shader linking failed');
    return { program, ...Object.fromEntries(uniforms.map(name => [name, gl.getUniformLocation(program, `u_${name}`)])) };
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  }
}

export class ArenaEffects {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.gl = this.canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false });
    if (!this.gl) return;
    this.emitters = new Float32Array(emitterLimit * emitterStride);
    this.waves = new Float32Array(waveLimit * 4);
    this.canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      this.ready = false;
    });
    this.canvas.addEventListener('webglcontextrestored', () => this.initialize());
    this.initialize();
  }

  initialize() {
    const gl = this.gl;
    let field;
    try {
      field = makeProgram(gl, fieldVertex, fieldFragment, ['size', 'time', 'overdrive', 'energy', 'waveCount', 'waves']);
      this.particles = makeProgram(gl, particleVertex, particleFragment);
    } catch {
      if (field) gl.deleteProgram(field.program);
      return;
    }
    this.field = field;
    this.buffer = gl.createBuffer();
    this.particleLayout = gl.createVertexArray();
    gl.bindVertexArray(this.particleLayout);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.emitters.byteLength, gl.DYNAMIC_DRAW);
    for (let i = 0; i < 4; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, i === 3 ? 3 : 4, gl.FLOAT, false, emitterStride * 4, i * 16);
      gl.vertexAttribDivisor(i, particlesPerEmitter);
    }
    gl.bindVertexArray(null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.blendFunc(gl.ONE, gl.ONE);
    this.ready = true;
  }

  addEmitter(pos, heading, age, scale, seed, burst, color = burst.color, density = 1) {
    if (this.emitterCount >= emitterLimit) return;
    this.emitters.set([
      pos.x, pos.y, heading, burst.spread ?? TAU,
      age, burst.life, scale, seed,
      ...color, Math.round(burst.count * density),
      burst.curl, burst.light, burst.speed, 0,
    ], this.emitterCount++ * emitterStride);
  }

  draw(state, { effects, origins, time }, pixels, slot) {
    if (!this.ready || this.gl.isContextLost()) return null;
    const gl = this.gl;
    const size = Math.max(1, Math.min(640, Math.round(pixels)));
    if (this.canvas.width !== size || this.canvas.height !== size) {
      this.canvas.width = this.canvas.height = size;
      gl.viewport(0, 0, size, size);
    }
    this.emitterCount = 0;
    const shieldTime = state.status === 'playing'
      ? Math.max(0, ...state.players.map(pilot => overdriveRemaining(state, pilot))) : 0;
    const overdrive = Math.min(1, shieldTime / .36);
    const waves = [];
    const chainEnergy = effects.reduce((total, event) => event.type === 'kill'
      ? total + Math.max(0, 1 - (time - event.born) / .56) : total, 0);
    const density = Math.max(.34, 1 - chainEnergy * .044);
    for (const event of effects) {
      const { type, angle, radius, chainDepth, born, id } = event;
      const key = type === 'special' ? event.character : type === 'kill' && chainDepth ? 'chain'
        : type === 'breach' && !event.damage ? 'blocked' : type;
      const burst = bursts[key], age = time - born;
      if (!burst || age >= burst.life || !Number.isFinite(angle) || !Number.isFinite(radius)) continue;
      const pos = pointAt(angle, type === 'breach' ? T.radius + 6 : radius);
      const scale = Math.max(.63, Math.sqrt(depthScale(radius)));
      const heading = angle + (key === 'rook' ? Math.PI / 2 : key === 'ivo' ? Math.PI : 0);
      const color = key === 'kill' && event.kind !== 'rush' ? violet : burst.color;
      this.addEmitter(pos, heading, age, scale, id, burst, color, type === 'kill' ? density : 1);
      const progress = age / burst.life;
      const strength = burst.wave * (type === 'kill' ? scale * (.8 + .35 * density) : 1);
      waves.push({ pos, progress, strength, priority: strength * (1 - progress) ** 2 });
    }
    for (const bullet of state.bullets) {
      const start = origins.get(bullet.id);
      const age = (start - bullet.radius) / (T.bulletSpeed * state.timeScale);
      if (!(age >= 0 && age < bursts.muzzle.life)) continue;
      const color = bullet.owner === slot ? cyan : state.players[bullet.owner]?.character === 'sana' ? violet : ice;
      this.addEmitter(pointAt(bullet.angle, start), bullet.angle, age,
        Math.max(.5, depthScale(start)) * (1 + overdrive * .3), bullet.id, bursts.muzzle, color);
    }
    waves.sort((a, b) => b.priority - a.priority);
    const waveCount = Math.min(waveLimit, waves.length);
    for (let i = 0; i < waveCount; i++) {
      const { pos, progress, strength } = waves[i];
      this.waves.set([pos.x, pos.y, progress, strength], i * 4);
    }

    const field = this.field;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.useProgram(field.program);
    gl.uniform1f(field.size, size);
    gl.uniform1f(field.time, time);
    gl.uniform1f(field.overdrive, overdrive);
    gl.uniform1f(field.energy, Math.min(.85, chainEnergy * .12));
    gl.uniform1i(field.waveCount, waveCount);
    gl.uniform4fv(field.waves, this.waves);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (this.emitterCount) {
      gl.enable(gl.BLEND);
      gl.useProgram(this.particles.program);
      gl.bindVertexArray(this.particleLayout);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.emitters, 0, this.emitterCount * emitterStride);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.emitterCount * particlesPerEmitter);
      gl.bindVertexArray(null);
    }
    return this.canvas;
  }
}
