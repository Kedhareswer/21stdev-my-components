"use client"

// Chladni Plate — a square brass plate, clamped at its centre, dusted with fine
// sand under one low lamp. Draw a bow across its edge and the plate rings: the
// sand is thrown off everywhere the brass is moving and comes to rest only on
// the still lines between, so every note draws its own figure.
//
// The plate is real standing-wave maths: free-edged square plate modes, the
// classic cos(nπx)cos(mπy) ± cos(mπx)cos(nπy) pairs, with the centre a node
// because that is where the plate is held. Where you bow along the edge and how
// fast you draw decide which mode locks in (a bow cannot excite a mode at one of
// its nodes). Every grain is integrated on its own: it hops where the brass
// accelerates faster than gravity, flies a ballistic arc, lands, and creeps into
// the still line once the plate quietens. Drag a fingertip across the plate to
// plough the sand aside; bow again and it gathers back.
//
// One file, React only, WebGL2. Nothing is fetched. The grains are splatted
// into a density map that the brass shader reads as a heightfield, so ridges
// have height, catch the lamp on one flank and throw short shadows on the
// other. It draws only while something moves, then holds the frame.

import * as React from "react"

export interface ChladniPlateProps {
  /** "day" (soapstone bench), "night" (black epoxy bench, lamp only), or "auto" to follow a `.dark` class on <html>. Defaults to "auto". */
  light?: "auto" | "day" | "night"
  /** "center" keeps the plate in the middle. "aside" moves it right on wide frames and to the top on narrow ones, leaving room for copy. */
  align?: "center" | "aside"
  /** The first time it scrolls into view, the plate is bowed once by itself. Defaults to true. */
  autoBow?: boolean
  /** Bow the edge, plough the sand. Defaults to true. */
  interactive?: boolean
  /** The pill in the corner that names the note and bows the plate when pressed. Defaults to true. */
  hint?: boolean
  /** Which figure the sand sits in on the first frame, as an index into the plate's modes (0–18, low note to high). Defaults to 13. */
  figure?: number
  /** Reshuffles the grains. */
  seed?: number
  /** Content laid over the bench. The overlay passes pointer events through; its links and buttons take them. */
  children?: React.ReactNode
  /** Root height. A definite length, never a percentage. */
  height?: string
  className?: string
}

// #region chladni
// Pure helpers, lifted out and executed by tests/chladni-plate.test.mjs.

/** Small seeded PRNG (mulberry32). */
export function cpRandom(seed: number) {
  let a = (seed >>> 0) || 1
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The plate's modes [n, m, sign], lowest note first. Each is a symmetric or
 * antisymmetric pair of free-edge plate modes with a node at the clamped centre.
 * Pure lattices and modes whose centre is a broad dead star are left out.
 */
export const CP_MODES = [
  [0, 2, -1], [0, 3, 1], [1, 3, 1], [0, 4, -1], [1, 4, 1], [2, 4, -1], [2, 5, 1], [2, 5, -1],
  [3, 5, 1], [3, 6, 1], [3, 6, -1], [2, 7, 1], [3, 7, 1], [4, 7, 1], [4, 7, -1], [2, 8, -1],
  [3, 8, 1], [5, 7, 1], [5, 8, 1],
]

/** Displacement of mode `k` at plate point (x, y), both 0–1. Normalised to −1…1. */
export function cpU(k: number, x: number, y: number) {
  const [n, m, s] = CP_MODES[k]
  const P = Math.PI
  return 0.5 * (Math.cos(n * P * x) * Math.cos(m * P * y) + s * Math.cos(m * P * x) * Math.cos(n * P * y))
}

/** The mode sampled on a G × G grid: displacement and its gradient (per plate width), interleaved. */
export function cpGrid(k: number, G: number) {
  const [n, m, s] = CP_MODES[k]
  const P = Math.PI
  const out = new Float32Array(G * G * 3)
  for (let j = 0; j < G; j++) {
    const y = j / (G - 1)
    for (let i = 0; i < G; i++) {
      const x = i / (G - 1)
      const cnx = Math.cos(n * P * x), cmx = Math.cos(m * P * x), cny = Math.cos(n * P * y), cmy = Math.cos(m * P * y)
      const snx = Math.sin(n * P * x), smx = Math.sin(m * P * x), sny = Math.sin(n * P * y), smy = Math.sin(m * P * y)
      const o = (j * G + i) * 3
      out[o] = 0.5 * (cnx * cmy + s * cmx * cny)
      out[o + 1] = 0.5 * (-n * P * snx * cmy - s * m * P * smx * cny)
      out[o + 2] = 0.5 * (-m * P * cnx * smy - s * n * P * cmx * sny)
    }
  }
  return out
}

/** Bilinear sample of a cpGrid at (x, y) into out[0..2]. */
export function cpSample(grid: Float32Array, G: number, x: number, y: number, out: Float32Array) {
  const fx = Math.min(G - 1.001, Math.max(0, x * (G - 1)))
  const fy = Math.min(G - 1.001, Math.max(0, y * (G - 1)))
  const i = fx | 0
  const j = fy | 0
  const tx = fx - i
  const ty = fy - j
  const a = (j * G + i) * 3
  const b = a + 3
  const c = a + G * 3
  const d = c + 3
  for (let q = 0; q < 3; q++) {
    const top = grid[a + q] + (grid[b + q] - grid[a + q]) * tx
    const bot = grid[c + q] + (grid[d + q] - grid[c + q]) * tx
    out[q] = top + (bot - top) * ty
  }
}

/** Pitch of mode k in Hz. A plate's frequency climbs with n² + m². */
export function cpHz(k: number) {
  const [n, m] = CP_MODES[k]
  return 37 * (n * n + m * m)
}

/** Nearest note name for a frequency, e.g. 440 → "A4". */
export function cpNote(hz: number) {
  const names = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]
  const midi = Math.round(69 + 12 * Math.log2(hz / 440))
  return names[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1)
}

/**
 * Which mode a bow at plate point (x, y) on the edge excites, drawn with energy
 * e (0–1). A slow bow speaks in the low modes, a fast one in the high; and a bow
 * placed on one of a mode's nodes cannot drive it at all.
 */
export function cpPick(x: number, y: number, e: number) {
  const K = CP_MODES.length
  const want = Math.max(0, Math.min(1, e))
  let best = 0
  let score = -1
  for (let k = 0; k < K; k++) {
    const amp = Math.abs(cpU(k, x, y))
    const r = k / (K - 1) - want
    const sc = amp * amp * Math.exp(-(r * r) / 0.02)
    if (sc > score) {
      score = sc
      best = k
    }
  }
  return best
}

/**
 * Where on the right edge (0 top, 1 bottom) and how hard to bow, so the plate
 * changes figure visibly: to `prefer` if it can, else a mode a few notes away,
 * never the current one's mirror twin.
 */
export function cpAutoStroke(k: number, prefer: number) {
  let best = [0.3, 0.55]
  let far = -1
  for (let s = 0.08; s <= 0.46; s += 0.02) {
    for (let e = 0.3; e <= 0.8; e += 0.05) {
      const j = cpPick(1, s, e)
      const [n, m] = CP_MODES[j]
      const twin = n === CP_MODES[k][0] && m === CP_MODES[k][1]
      const d = twin ? 0 : (j === prefer ? 10 : Math.min(Math.abs(j - k), 5)) - Math.abs(e - 0.55) - Math.abs(s - 0.3)
      if (d > far) {
        far = d
        best = [s, e]
      }
    }
  }
  return best
}

/** Where the plate sits: [centre x, centre y, side], CSS px. */
export function cpLayout(w: number, h: number, align: string) {
  if (align === "aside") {
    if (w >= 768) {
      const S = Math.min(h * 0.78, w * 0.5)
      const m = Math.max(w * 0.07, (h - S) / 2)
      return [w - m - S / 2, h / 2, S]
    }
    const S = Math.min(w * 0.86, h * 0.54)
    return [w / 2, (w - S) / 2 + S / 2, S]
  }
  const S = Math.min(w * 0.84, h * 0.78)
  return [w / 2, h / 2, S]
}

/** Device pixels per CSS px, so the canvas stays inside `budget` pixels. Drops below 1 on huge frames. */
export function cpScale(w: number, h: number, dpr: number, budget: number) {
  return Math.max(0.35, Math.min(dpr, 2, Math.sqrt(budget / Math.max(1, w * h))))
}

/** How many grains for a plate `side` CSS px across. Node lines lengthen with the plate. */
export function cpGrains(side: number, soft: boolean) {
  const n = Math.round(Math.max(16000, Math.min(76000, side * 105)))
  return soft ? Math.round(n * 0.45) : n
}

/**
 * Grains already gathered on mode k's still lines, as they sit after a long ring:
 * xyz per grain, z the height above the brass (0 = resting). A few strays stay out.
 */
export function cpScatter(k: number, count: number, seed: number) {
  const rand = cpRandom(seed)
  const out = new Float32Array(count * 3)
  const G = 160
  const grid = cpGrid(k, G)
  const s = new Float32Array(3)
  let made = 0
  let guard = 0
  while (made < count && guard++ < count * 400) {
    const x = rand()
    const y = rand()
    if (Math.hypot(x - 0.5, y - 0.5) < CP_WASHER) continue
    // Distance to the nearest still line, to first order, and a heap a few grains wide across it.
    cpSample(grid, G, x, y, s)
    const d = Math.abs(s[0]) / Math.max(2.5, Math.hypot(s[1], s[2]))
    const stray = rand() < 0.01
    if (!stray && rand() > Math.exp(-(d * d) / 0.00003)) continue
    out[made * 3] = x
    out[made * 3 + 1] = y
    made++
  }
  return out
}

// Grain physics, in plate widths and seconds.
/** Radius of the clamp's washer: sand can't lie on it. */
export const CP_WASHER = 0.058
/** Fraction of full ring at which the brass outruns gravity and throws sand. */
export const CP_THROW = 0.16
const CP_GRAV = 2.4
/** How fast resting grains creep toward the still line, per second at full ring. */
const CP_CREEP = 6
/** How far a resting grain wanders along its still line per step, at full ring. */
const CP_WANDER = 0.009
/** Below this ring amplitude nothing on the plate moves at all. */
export const CP_QUIET = 0.035

/**
 * One fixed step for every grain. `pos` is xyz, `vel` is xyz. `amp` is the plate's
 * ring amplitude (0 silent, ~1 bowed hard). Returns how many grains are still in
 * the air or moving, so the caller knows when to sleep.
 */
export function cpStep(pos: Float32Array, vel: Float32Array, grid: Float32Array, G: number, amp: number, dt: number, rand: () => number) {
  const s = new Float32Array(3)
  let busy = 0
  const n = pos.length / 3
  const quiet = amp < CP_QUIET
  for (let i = 0; i < n; i++) {
    const o = i * 3
    let x = pos[o]
    let y = pos[o + 1]
    let z = pos[o + 2]
    if (z > 0 || vel[o + 2] > 0) {
      // In flight: a ballistic arc.
      x += vel[o] * dt
      y += vel[o + 1] * dt
      vel[o + 2] -= CP_GRAV * dt
      z += vel[o + 2] * dt
      if (z <= 0) {
        z = 0
        vel[o] = 0
        vel[o + 1] = 0
        vel[o + 2] = 0
      }
      busy++
    } else if (!quiet) {
      cpSample(grid, G, x, y, s)
      const a = amp * Math.abs(s[0])
      const sg = s[0] < 0 ? -1 : 1
      const gl = Math.hypot(s[1], s[2]) + 1e-6
      if (a > CP_THROW) {
        // The brass under it is moving faster than gravity: thrown, mostly downhill in |u|.
        const e = a - CP_THROW
        vel[o + 2] = 0.07 + 0.3 * e * (0.55 + 0.9 * rand())
        const along = (0.02 + 0.22 * e) * (0.4 + 0.8 * rand())
        const jit = 0.12 * e
        vel[o] = (-sg * s[1] / gl) * along + (rand() - 0.5) * jit
        vel[o + 1] = (-sg * s[2] / gl) * along + (rand() - 0.5) * jit
        z = 1e-5
        busy++
      } else {
        // Still on the brass, but it trembles: the grain creeps toward the still line.
        const g2 = s[1] * s[1] + s[2] * s[2] + 1e-4
        const mx = (-s[0] * s[1]) / g2
        const my = (-s[0] * s[2]) / g2
        const ml = Math.hypot(mx, my)
        const f = Math.min(1, CP_CREEP * amp * dt) * Math.min(1, 0.003 / (ml * Math.min(1, CP_CREEP * amp * dt) + 1e-9))
        x += mx * f
        y += my * f
        // It jostles: a little across the line, more along it, so the line fills in evenly.
        const sq = Math.sqrt(amp)
        const across = (rand() + rand() + rand() - 1.5) * 0.0026 * sq
        const run = (rand() + rand() + rand() - 1.5) * CP_WANDER * sq
        const gl2 = Math.sqrt(g2)
        x += (s[1] * across - s[2] * run) / gl2
        y += (s[2] * across + s[1] * run) / gl2
      }
    }
    // Sand that lands on the washer slides off it.
    const wx = x - 0.5
    const wy = y - 0.5
    const wr = Math.hypot(wx, wy)
    if (wr < CP_WASHER && z <= 0) {
      const f = (CP_WASHER + 0.002) / (wr || 1e-6)
      x = 0.5 + (wr ? wx : 0.001) * f
      y = 0.5 + wy * f
    }
    // A thin raised lip keeps the sand on the plate.
    if (x < 0.002) { x = 0.004 - x; vel[o] = Math.abs(vel[o]) * 0.4 }
    if (x > 0.998) { x = 1.996 - x; vel[o] = -Math.abs(vel[o]) * 0.4 }
    if (y < 0.002) { y = 0.004 - y; vel[o + 1] = Math.abs(vel[o + 1]) * 0.4 }
    if (y > 0.998) { y = 1.996 - y; vel[o + 1] = -Math.abs(vel[o + 1]) * 0.4 }
    pos[o] = x
    pos[o + 1] = y
    pos[o + 2] = z
  }
  return busy
}

/**
 * A fingertip dragged from (ax, ay) to (bx, by) ploughs a channel `r` wide:
 * every resting grain inside is pushed out to the nearer bank. Returns grains moved.
 */
export function cpPlough(pos: Float32Array, ax: number, ay: number, bx: number, by: number, r: number, rand: () => number) {
  const dx = bx - ax
  const dy = by - ay
  const L2 = dx * dx + dy * dy || 1e-9
  const n = pos.length / 3
  let moved = 0
  const x0 = Math.min(ax, bx) - r
  const x1 = Math.max(ax, bx) + r
  const y0 = Math.min(ay, by) - r
  const y1 = Math.max(ay, by) + r
  for (let i = 0; i < n; i++) {
    const o = i * 3
    const x = pos[o]
    const y = pos[o + 1]
    if (x < x0 || x > x1 || y < y0 || y > y1 || pos[o + 2] > 0) continue
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2))
    const cx = ax + dx * t
    const cy = ay + dy * t
    let ox = x - cx
    let oy = y - cy
    const d = Math.hypot(ox, oy)
    if (d >= r) continue
    if (d < 1e-6) {
      ox = -dy
      oy = dx
    }
    const l = Math.hypot(ox, oy) || 1
    // Shoved to the bank, heaped a little beyond it.
    const to = r * (1 + 0.35 * rand() * rand())
    pos[o] = Math.min(0.997, Math.max(0.003, cx + (ox / l) * to))
    pos[o + 1] = Math.min(0.997, Math.max(0.003, cy + (oy / l) * to))
    moved++
  }
  return moved
}
// #endregion

const QUAD = `#version 300 es
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

// Grains into the density map: pass 0 the resting sand, 1 the shadows of grains in flight, 2 the flying grains.
const SPLAT_V = `#version 300 es
layout(location = 0) in vec3 aG;
uniform float uPass;
uniform vec2 uShadow;
uniform float uPt;
out float vW;
void main() {
  float air = step(0.00001, aG.z);
  vec2 p = aG.xy;
  float w = uPass < 0.5 ? 1.0 - air : air;
  if (uPass > 0.5 && uPass < 1.5) p += uShadow * aG.z;
  vW = w;
  gl_Position = w > 0.0 ? vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0) : vec4(2.0, 2.0, 0.0, 1.0);
  gl_PointSize = uPt;
}
`
const SPLAT_F = `#version 300 es
precision highp float;
in float vW;
uniform float uPass;
uniform float uGain;
out vec4 o;
void main() {
  vec2 d = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(d, d);
  if (r2 > 1.0) discard;
  float g = exp(-r2 * 2.2) * vW * uGain;
  o = uPass < 0.5 ? vec4(g, 0.0, 0.0, 0.0) : (uPass < 1.5 ? vec4(0.0, g, 0.0, 0.0) : vec4(0.0, 0.0, g, 0.0));
}
`

// The bench, the brass, the sand and the bow, lit by one lamp.
const SHOW = `#version 300 es
precision highp float;
uniform sampler2D uDen;
uniform vec2 uRes;
uniform float uDpr;
uniform vec3 uPlate;
uniform vec3 uLamp;
uniform float uNight;
uniform float uA;
uniform vec3 uMode;
uniform vec4 uBow;
uniform vec4 uBow2;
uniform float uDenRead;
uniform sampler2D uBg;
uniform float uPass;
out vec4 o;

const float PI = 3.14159265;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; }
  return s;
}
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// The lamp: a shaded tungsten bulb aimed at the plate. Returns direction to it; irradiance in w.
vec4 lamp(vec3 P) {
  vec3 d = uLamp - P;
  float dist = length(d);
  vec3 L = d / dist;
  vec3 aim = normalize(vec3(uPlate.xy, 0.0) - uLamp);
  float cone = smoothstep(0.74, 0.96, dot(-L, aim));
  float ref = length(uLamp - vec3(uPlate.xy, 0.0));
  float E = cone * (ref * ref) / (dist * dist);
  return vec4(L, E);
}

// Sand height in CSS px at plate uv, from the density map's blurred level.
float sandH(vec2 uv, float lod) {
  float d = textureLod(uDen, vec2(uv.x, 1.0 - uv.y), lod).r * uDenRead;
  return (1.0 - exp(-0.16 * d)) * 4.2;
}

// The brass, for a surface normal n.
vec3 brass(vec3 n, vec3 V, vec4 Lw, vec2 rv, float r, float tarnish, float S) {
  vec3 L = Lw.xyz;
  vec3 H = normalize(L + V);
  float nl = max(dot(n, L), 0.0);
  float nh = max(dot(n, H), 0.0);
  vec3 F0 = mix(vec3(1.0, 0.7, 0.27), vec3(0.62, 0.38, 0.16), tarnish);
  // Spun finish: fine concentric lathe lines, an anisotropic streak through the centre.
  vec3 T = normalize(vec3(-rv.y, rv.x, 0.0) + vec3(1e-4, 0.0, 0.0));
  float th = dot(T, H);
  float lathe = 0.82 + 0.18 * sin(r * 2.4 + vnoise(vec2(r * 0.05, 3.0)) * 6.0);
  float aniso = pow(sqrt(max(0.0, 1.0 - th * th)), 260.0) * pow(nh, 4.0) * lathe;
  float a2 = 0.09;
  float dd = nh * nh * (a2 - 1.0) + 1.0;
  float iso = a2 / (PI * dd * dd);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);
  float shine = (1.0 - 0.7 * tarnish);
  vec3 spec = F * (iso * 0.55 + aniso * 2.4) * shine * nl * Lw.w;
  vec3 rough = F0 * nl * Lw.w * 0.3;
  vec3 env = F0 * mix(vec3(0.035, 0.026, 0.018), vec3(0.11, 0.1, 0.085), 1.0 - uNight);
  return spec + rough + env;
}

// Everything that holds still between frames: the bench with the plate's shadow, the brass, the clamp.
vec3 ground(vec2 p) {
  float S = uPlate.z;
  vec2 c = uPlate.xy;
  float hb = 0.1 * S;
  float edge = sdBox(p - c, vec2(0.5 * S));
  vec3 V = normalize(vec3(c, 2.6 * S) - vec3(p, 0.0));
  if (edge > 0.0) {
    // The bench, some way below the plate.
    vec3 P = vec3(p, -hb);
    vec4 Lw = lamp(P);
    vec2 q = P.xy + Lw.xy * (hb / max(Lw.z, 0.05));
    float pen = 0.06 * S;
    float sh = smoothstep(-pen, pen, sdBox(q - c, vec2(0.5 * S)));
    float ao = mix(0.55, 1.0, smoothstep(0.0, 0.14 * S, edge));
    float vein = fbm(p * 0.006 + 3.0);
    vec3 alb = mix(vec3(0.1, 0.115, 0.11) * (0.82 + 0.36 * vein), vec3(0.03, 0.029, 0.028), uNight);
    float amb = mix(0.55, 0.06, uNight);
    return alb * (Lw.w * max(Lw.z, 0.0) * 2.4 * sh + amb * ao);
  }
  vec3 P = vec3(p, 0.0);
  vec4 Lw = lamp(P);
  vec2 q = (p - (c - 0.5 * S)) / S;
  vec2 rv = p - c;
  float r = length(rv);
  float tarnish = smoothstep(0.5, 0.85, fbm(q * 3.0 + 11.0)) * 0.22 + smoothstep(0.7, 1.0, max(abs(q.x - 0.5), abs(q.y - 0.5)) * 2.0) * 0.3;
  tarnish += smoothstep(0.78, 0.95, vnoise(q * 60.0)) * 0.06;
  // Bevel: the outer edge rolls over and catches or loses the light.
  vec2 qa = abs(rv) - 0.5 * S;
  vec2 nO = qa.x > qa.y ? vec2(sign(rv.x), 0.0) : vec2(0.0, sign(rv.y));
  float bev = 1.0 - smoothstep(0.0, 2.2, -edge);
  vec3 n = normalize(vec3(nO * bev * 1.1, 1.0));
  vec3 base;
  if (uA > 0.001) {
    // While it rings, the brass tilts back and forth along the mode's slopes; the eye sees both.
    float cnx = cos(uMode.x * PI * q.x), cmx = cos(uMode.y * PI * q.x), cny = cos(uMode.x * PI * q.y), cmy = cos(uMode.y * PI * q.y);
    float snx = sin(uMode.x * PI * q.x), smx = sin(uMode.y * PI * q.x), sny = sin(uMode.x * PI * q.y), smy = sin(uMode.y * PI * q.y);
    vec2 g = 0.5 * vec2(-uMode.x * PI * snx * cmy - uMode.z * uMode.y * PI * smx * cny, -uMode.y * PI * cnx * smy - uMode.z * uMode.x * PI * cmx * sny);
    float tilt = uA * 0.022;
    base = 0.5 * (brass(normalize(n + vec3(g * tilt, 0.0)), V, Lw, rv, r, tarnish, S) + brass(normalize(n - vec3(g * tilt, 0.0)), V, Lw, rv, r, tarnish, S));
  } else {
    base = brass(n, V, Lw, rv, r, tarnish, S);
  }
  // The centre clamp: a nickel cap nut on a washer, and their shadows.
  float rw = 0.052 * S;
  float rn = 0.03 * S;
  vec2 sw = p + Lw.xy / max(Lw.z, 0.05) * (0.006 * S);
  float washSh = 1.0 - 0.35 * (1.0 - smoothstep(rw - 1.0, rw + 3.0, length(sw - c)));
  vec3 Hn = normalize(Lw.xyz + V);
  if (r < rw) {
    vec3 nn = vec3(0.0, 0.0, 1.0);
    if (r > rw - 1.6) nn = normalize(vec3(rv / r * 0.9, 1.0));
    float ring = 0.85 + 0.15 * sin(r * 3.1);
    base = vec3(0.7, 0.68, 0.64) * (0.1 + 0.32 * max(dot(nn, Lw.xyz), 0.0) * Lw.w) + vec3(0.95, 0.9, 0.82) * pow(max(dot(nn, Hn), 0.0), 30.0) * Lw.w * ring * 1.1;
    washSh = 1.0;
  }
  if (r < rn) {
    float h = sqrt(max(0.0, 1.0 - (r * r) / (rn * rn)));
    vec3 nn = normalize(vec3(rv / rn, h * 1.2 + 0.05));
    base = vec3(0.7, 0.69, 0.66) * (0.08 + 0.4 * max(dot(nn, Lw.xyz), 0.0) * Lw.w) + vec3(1.0, 0.95, 0.88) * pow(max(dot(nn, Hn), 0.0), 70.0) * Lw.w * 2.0;
    base *= 0.85 + 0.15 * smoothstep(0.0, 1.2, abs(sin(atan(rv.y, rv.x) * 3.0)));
  }
  return base * washSh;
}

// Filmic shoulder so the lamp's hot spot rolls off instead of clipping, then gamma; and back.
vec3 encode(vec3 c) { return pow(1.0 - exp(-c * 1.25), vec3(1.0 / 2.2)); }
vec3 decode(vec3 c) { return -log(1.0 - pow(min(c, vec3(0.996)), vec3(2.2))) / 1.25; }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  if (uPass < 0.5) {
    o = vec4(encode(ground(p)), 1.0);
    return;
  }
  vec3 col = uPass > 1.5 ? ground(p) : decode(texelFetch(uBg, ivec2(gl_FragCoord.xy), 0).rgb);
  float S = uPlate.z;
  vec2 c = uPlate.xy;
  float hb = 0.1 * S;
  float edge = sdBox(p - c, vec2(0.5 * S));
  vec3 V = normalize(vec3(c, 2.6 * S) - vec3(p, 0.0));

  // Bow geometry, shared by the shadow pass and the bow itself.
  vec2 ba = uBow.zw;
  vec2 bb = vec2(-ba.y, ba.x);
  float bLen = 0.62 * S;
  float bz = (0.012 + 0.07 * uBow2.y) * S;

  if (edge > 0.0) {
    // The bow's shadow falls further on the bench than on the plate.
    if (uBow2.z > 0.0) {
      vec4 Lw = lamp(vec3(p, -hb));
      vec2 ps = p + Lw.xy / max(Lw.z, 0.05) * (bz + hb);
      float t = dot(ps - uBow.xy, ba) - uBow2.x;
      float k = dot(ps - uBow.xy, bb);
      float m = smoothstep(-0.02 * S, 0.02 * S, t) * smoothstep(-0.02 * S, 0.02 * S, bLen - t);
      float bs = m * (1.0 - smoothstep(0.006 * S, 0.05 * S, abs(k - 0.008 * S)));
      col *= 1.0 - 0.4 * bs * uBow2.z;
    }
  } else {
    vec4 Lw = lamp(vec3(p, 0.0));
    vec2 q = (p - (c - 0.5 * S)) / S;
    float r = length(p - c);
    // The cap nut's shadow reaches across the sand too.
    vec2 sq = p + Lw.xy / max(Lw.z, 0.05) * (0.035 * S);
    float rn = 0.03 * S;
    float capSh = r < 0.052 * S ? 1.0 : 1.0 - 0.6 * (1.0 - smoothstep(rn - 3.0, rn + 5.0, length(sq - c)));
    vec3 base = col * capSh;

    // Sand: a heightfield from the grain density.
    vec2 uv = q;
    vec3 den = texture(uDen, vec2(uv.x, 1.0 - uv.y)).rgb * uDenRead;
    float hr = 1.0 - exp(-0.16 * den.r);
    float h0 = sandH(uv, 1.0);
    float hb2 = sandH(uv, 3.0);
    vec3 ns = vec3(0.0, 0.0, 1.0);
    float shade = 1.0;
    // Bare brass far from any sand skips the heightfield work.
    if (hb2 > 0.004 || hr > 0.0) {
      float ex = 2.0 / S;
      float hx = sandH(uv + vec2(ex, 0.0), 1.0) - h0;
      float hy = sandH(uv + vec2(0.0, ex), 1.0) - h0;
      ns = normalize(vec3(-hx / 2.0, -hy / 2.0, 1.0) * vec3(2.2, 2.2, 1.0));
      // Short shadows: march toward the lamp over the heightfield.
      vec2 ld = normalize(Lw.xy + 1e-5);
      float slope = Lw.z / max(length(Lw.xy), 1e-3);
      for (int i = 1; i <= 5; i++) {
        float d = float(i) * 2.2;
        float hh = sandH(uv + ld * d / S, 1.3);
        shade = min(shade, 1.0 - smoothstep(0.0, 0.8, hh - (h0 + d * slope)) * 0.7);
      }
    }
    float ao = 1.0 - clamp((hb2 - h0) * 0.12, 0.0, 0.3) - clamp(h0 * 0.06, 0.0, 0.12);
    float cover = smoothstep(0.04, 0.4, hr) * step(0.058 * S, r);
    float grainN = hash(floor(p * uDpr * 1.0) + 17.0);
    vec3 salb = vec3(0.9, 0.88, 0.83) * (0.8 + 0.34 * grainN);
    // Sand in shadow still gets the brass's warm bounce.
    vec3 amb = mix(vec3(0.3, 0.29, 0.26), vec3(0.16, 0.13, 0.09), uNight);
    vec3 sand = salb * (Lw.w * max(dot(ns, Lw.xyz), 0.0) * 1.2 * max(shade, 0.4) + amb * ao);
    vec3 Hs = normalize(Lw.xyz + V);
    sand += step(0.975, grainN) * pow(max(dot(ns, Hs), 0.0), 6.0) * Lw.w * 0.9 * shade;
    base *= mix(1.0, shade, 0.9);
    col = mix(base, sand * capSh, cover);
    // Grains in the air: their shadows on the brass, and the grains themselves.
    col *= 1.0 - 0.5 * min(den.g * 0.35, 1.0);
    float fly = min(den.b * 0.6, 1.0);
    col = mix(col, salb * (Lw.w * Lw.z * 1.2 + amb), fly * 0.9);
    // Bow shadow on the plate.
    if (uBow2.z > 0.0) {
      vec2 ps = p + Lw.xy / max(Lw.z, 0.05) * bz;
      float t = dot(ps - uBow.xy, ba) - uBow2.x;
      float k = dot(ps - uBow.xy, bb);
      float m = smoothstep(-0.01 * S, 0.01 * S, t) * smoothstep(-0.01 * S, 0.01 * S, bLen - t);
      float bs = m * (1.0 - smoothstep(0.004 * S, 0.026 * S + bz * 0.3, abs(k - 0.008 * S)));
      col *= 1.0 - 0.55 * bs * uBow2.z;
    }
  }

  // The bow: horsehair and a pernambuco stick lying across the edge, tip over the brass.
  if (uBow2.z > 0.0) {
    vec4 Lw = lamp(vec3(p, bz));
    vec3 Hb = normalize(Lw.xyz + V);
    float t = dot(p - uBow.xy, ba) - uBow2.x;
    float k = dot(p - uBow.xy, bb);
    float u = t;
    float hw = 0.0072 * S;
    float aa = 0.8;
    float inL = smoothstep(-aa, aa, u) * smoothstep(-aa, aa, bLen - u);
    // Hair ribbon: pale, faintly translucent, combed into fine strands.
    float hair = (1.0 - smoothstep(hw - aa, hw + aa, abs(k))) * step(0.03 * S, u) * step(u, bLen - 0.07 * S);
    float fib = 0.78 + 0.22 * hash(vec2(floor((k + hw) * 2.2), 3.0)) + 0.06 * sin(u * 0.4);
    float roll = 1.0 - 0.35 * pow(abs(k) / hw, 2.0);
    vec3 hairC = vec3(0.93, 0.89, 0.8) * fib * roll * (0.22 + 1.05 * Lw.w * Lw.z) + mix(vec3(0.18), vec3(0.02), uNight) * 0.35;
    // Stick: varnished pernambuco, cambered toward the hair at both ends.
    float ks = 0.0095 * S + 0.012 * S * sin(PI * clamp(u / bLen, 0.0, 1.0));
    float sw = 0.0062 * S;
    float sd = (k - ks) / sw;
    float stick = (1.0 - smoothstep(1.0 - aa / sw, 1.0 + aa / sw, abs(sd))) * smoothstep(-aa, aa, u - 0.004 * S) * smoothstep(-aa, aa, bLen - u);
    vec3 sn = normalize(vec3(bb * sd, sqrt(max(0.0, 1.0 - sd * sd)) + 0.05));
    vec3 stickC = vec3(0.36, 0.13, 0.05) * (0.1 + 0.95 * max(dot(sn, Lw.xyz), 0.0) * Lw.w) + vec3(1.0, 0.86, 0.7) * pow(max(dot(sn, Hb), 0.0), 36.0) * Lw.w * 0.9;
    // The head at the inner end with its ivory face, the ebony frog with a pearl eye at the outer.
    float head = step(0.0, u) * step(u, 0.03 * S) * (1.0 - smoothstep(0.0135 * S - aa, 0.0135 * S + aa, abs(k - 0.0035 * S)));
    vec3 tipC = mix(vec3(0.36, 0.13, 0.05) * (0.15 + 0.8 * Lw.w * Lw.z), vec3(0.9, 0.88, 0.82) * (0.3 + 0.8 * Lw.w * Lw.z), step(u, 0.008 * S));
    float fu = u - (bLen - 0.085 * S);
    float frog = step(0.0, fu) * step(fu, 0.085 * S) * (1.0 - smoothstep(0.0145 * S - aa, 0.0145 * S + aa, abs(k - 0.004 * S)));
    float eye = 1.0 - smoothstep(0.004 * S - aa, 0.004 * S + aa, length(vec2(fu - 0.04 * S, k - 0.004 * S)));
    vec3 frogC = vec3(0.03, 0.026, 0.024) * (0.5 + Lw.w) + vec3(0.7, 0.65, 0.6) * pow(max(Hb.z, 0.0), 24.0) * Lw.w * 0.25;
    frogC = mix(frogC, vec3(0.86, 0.9, 0.92) * (0.35 + 0.75 * Lw.w), eye);
    float tip = head;
    float vis = uBow2.z;
    col = mix(col, hairC, hair * vis * 0.92);
    col = mix(col, stickC, stick * vis);
    col = mix(col, tipC, tip * vis);
    col = mix(col, frogC, frog * vis);
  }

  o = vec4(encode(col) + (hash(gl_FragCoord.xy) - 0.5) / 255.0, 1.0);
}
`

const STEP_S = 1 / 60
// Ring-down time constant once the bow leaves, seconds.
const CP_RING = 1.1

const CP_CSS = `
.cp-root { position: relative; width: 100%; overflow: hidden; isolation: isolate; touch-action: pan-y; user-select: none; -webkit-user-select: none; background: #2c3230; }
.cp-root.cp-night { background: #070707; }
.cp-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; opacity: 0; transition: opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1); }
.cp-root canvas[data-ready] { opacity: 1; }
.cp-fallback { position: absolute; inset: 0; background: radial-gradient(60% 60% at 40% 35%, #3c4442, #1d2120); }
.cp-fallback i { position: absolute; left: 50%; top: 50%; width: min(78vmin, 84%); aspect-ratio: 1; transform: translate(-50%, -50%); background: radial-gradient(circle at 30% 28%, #d9b46a, #8a6a34 70%); box-shadow: 18px 24px 40px rgba(0,0,0,0.45); }
.cp-over { position: relative; z-index: 1; height: 100%; pointer-events: none; }
.cp-over a, .cp-over button, .cp-over input, .cp-over [data-interactive] { pointer-events: auto; }
.cp-pill { position: absolute; z-index: 2; left: 16px; bottom: 16px; display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 14px; border: 0; border-radius: 999px; background: rgba(12, 11, 10, 0.72); color: rgba(246, 240, 228, 0.92); font: 500 11px/1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms ease; }
.cp-pill:active { transform: scale(0.96); }
.cp-pill:focus-visible { outline: 2px solid #e6c47a; outline-offset: 2px; }
.cp-pill b { font-weight: 500; font-variant-numeric: tabular-nums; letter-spacing: 0.06em; text-transform: none; color: #e6c47a; }
@media (hover: hover) and (pointer: fine) { .cp-pill:hover { background: rgba(12, 11, 10, 0.86); } }
@media (prefers-reduced-motion: reduce) { .cp-root canvas, .cp-pill { transition: none; } }
`

const LABEL = "A square brass plate dusted with sand lying in a Chladni figure. Draw a bow across its edge to make it ring and the sand gathers into a new figure."

export default function ChladniPlate({
  light = "auto",
  align = "center",
  autoBow = true,
  interactive = true,
  hint = true,
  figure = 13,
  seed = 7,
  children,
  height = "100svh",
  className = "",
}: ChladniPlateProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const noteRef = React.useRef(null as HTMLElement | null)
  const [failed, setFailed] = React.useState(false)
  const [dark, setDark] = React.useState(false)
  const night = light === "night" || (light === "auto" && dark)
  const api = React.useRef({ night, interactive, autoBow, redraw: () => {}, bow: () => {} })
  api.current.night = night
  api.current.interactive = interactive
  api.current.autoBow = autoBow

  // "auto" follows the page: a .dark class on <html>, as 21st and shadcn set it.
  React.useEffect(() => {
    if (light !== "auto") return
    const el = document.documentElement
    const read = () => setDark(el.classList.contains("dark"))
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [light])

  React.useEffect(() => {
    api.current.redraw()
  }, [night])

  const first = Math.max(0, Math.min(CP_MODES.length - 1, Math.round(figure)))

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: true })
    if (!gl) {
      setFailed(true)
      return
    }
    // A software renderer (21st's capture, some VMs) gets fewer pixels and fewer grains.
    const info = gl.getExtension("WEBGL_debug_renderer_info")
    const soft = !!info && /swiftshader|llvmpipe|software|basic render/i.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)))
    const floatOk = !!gl.getExtension("EXT_color_buffer_float")
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type) as WebGLShader
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      return sh
    }
    const shaders = [] as WebGLShader[]
    const make = (vsrc: string, fsrc: string) => {
      const vs = compile(gl.VERTEX_SHADER, vsrc)
      const fs = compile(gl.FRAGMENT_SHADER, fsrc)
      shaders.push(vs, fs)
      const pr = gl.createProgram() as WebGLProgram
      gl.attachShader(pr, vs)
      gl.attachShader(pr, fs)
      gl.linkProgram(pr)
      const u: { [k: string]: WebGLUniformLocation | null } = {}
      const count = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS) as number
      for (let i = 0; i < count; i++) {
        const a = gl.getActiveUniform(pr, i)
        if (a) u[a.name] = gl.getUniformLocation(pr, a.name)
      }
      return { pr, u, ok: !!gl.getProgramParameter(pr, gl.LINK_STATUS) }
    }
    const splat = make(SPLAT_V, SPLAT_F)
    const show = make(QUAD, SHOW)
    if (!splat.ok || !show.ok) {
      gl.deleteProgram(splat.pr)
      gl.deleteProgram(show.pr)
      for (const s of shaders) gl.deleteShader(s)
      setFailed(true)
      return
    }

    const vao = gl.createVertexArray()
    const quad = gl.createBuffer()
    const quadVao = gl.createVertexArray()
    gl.bindVertexArray(quadVao)
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const gbuf = gl.createBuffer()
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, gbuf)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)

    const den = gl.createTexture()
    const denFbo = gl.createFramebuffer()
    // The still parts of the scene, drawn once per size and theme.
    const bg = gl.createTexture()
    const bgFbo = gl.createFramebuffer()
    let bgNight = -1
    // Float density accumulates freely; an 8-bit fallback stores it scaled down.
    const denWrite = floatOk ? 1 : 1 / 24
    const denRead = floatOk ? 1 : 24

    const G = 192
    const rand = cpRandom(seed * 7919 + 13)
    let mode = first
    let grid = cpGrid(mode, G)
    let pos = new Float32Array(0)
    let vel = new Float32Array(0)
    let w = 0
    let h = 0
    let scale = 1
    let plate = [0, 0, 1]
    let D = 256
    let amp = 0
    let busy = 0
    let acc = 0
    let raf = 0
    let last = 0
    let visible = true
    let seen = false
    let autoTimer = 0
    let noteTimer = 0
    let hold = 0
    let dirty = true
    // The bow: where it touches, which edge, how far it has slid, lifted, how visible, how hard it is drawn.
    const bow = { x: 0, y: 0, nx: 1, ny: 0, ex: 1, ey: 0.3, slide: 0.1, lift: 1, liftTo: 1, vis: 0, visTo: 0, energy: 0, peak: 0, down: false, want: -1, wantT: 0 }
    const finger = { down: false, x: 0, y: 0, fresh: true }
    let auto: { t0: number; dur: number; s: number; e: number } | null = null
    const ploughs = [] as number[]

    const place = () => {
      const n = cpGrains(plate[2], soft)
      pos = cpScatter(mode, n, seed)
      vel = new Float32Array(n * 3)
      dirty = true
    }

    const build = () => {
      D = Math.max(64, Math.min(soft ? 720 : 1400, Math.round(plate[2] * scale)))
      gl.bindTexture(gl.TEXTURE_2D, den)
      if (floatOk) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, D, D, 0, gl.RGBA, gl.HALF_FLOAT, null)
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, D, D, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.bindFramebuffer(gl.FRAMEBUFFER, denFbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, den, 0)
      gl.bindTexture(gl.TEXTURE_2D, bg)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.bindFramebuffer(gl.FRAMEBUFFER, bgFbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bg, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      bgNight = -1
    }

    // Lamp: up and to the left of the plate, a little above a plate-width high.
    const lampAt = () => [plate[0] - 0.95 * plate[2], plate[1] - 0.75 * plate[2], 0.72 * plate[2]]

    const render = () => {
      const S = plate[2]
      const L = lampAt()
      // Shadow offset per unit height, in plate widths, from the lamp over the plate's middle.
      const dx = plate[0] - L[0]
      const dy = plate[1] - L[1]
      const sx = dx / L[2]
      const sy = dy / L[2]
      if (dirty) {
        gl.bindBuffer(gl.ARRAY_BUFFER, gbuf)
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW)
        gl.bindFramebuffer(gl.FRAMEBUFFER, denFbo)
        gl.viewport(0, 0, D, D)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE)
        gl.useProgram(splat.pr)
        gl.bindVertexArray(vao)
        const grainPx = Math.max(0.9, 0.0016 * S)
        gl.uniform1f(splat.u.uPt, Math.max(1.5, 2.6 * grainPx * (D / S)))
        gl.uniform1f(splat.u.uGain, denWrite)
        gl.uniform2f(splat.u.uShadow, sx, sy)
        const n = pos.length / 3
        for (let pass = 0; pass < (busy ? 3 : 1); pass++) {
          gl.uniform1f(splat.u.uPass, pass)
          gl.drawArrays(gl.POINTS, 0, n)
        }
        gl.disable(gl.BLEND)
        gl.bindTexture(gl.TEXTURE_2D, den)
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        dirty = false
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(show.pr)
      gl.bindVertexArray(quadVao)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, bg)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, den)
      const u = show.u
      gl.uniform1i(u.uDen, 0)
      gl.uniform1i(u.uBg, 1)
      gl.uniform2f(u.uRes, canvas.width, canvas.height)
      gl.uniform1f(u.uDpr, scale)
      gl.uniform3f(u.uPlate, plate[0], plate[1], S)
      gl.uniform3f(u.uLamp, L[0], L[1], L[2])
      gl.uniform1f(u.uNight, api.current.night ? 1 : 0)
      gl.uniform1f(u.uA, reduce ? 0 : amp)
      const md = CP_MODES[mode]
      gl.uniform3f(u.uMode, md[0], md[1], md[2])
      gl.uniform4f(u.uBow, bow.x, bow.y, bow.nx, bow.ny)
      gl.uniform4f(u.uBow2, (-0.03 - bow.slide * 0.7) * S, bow.lift, bow.vis, 0)
      gl.uniform1f(u.uDenRead, denRead)
      const nightNow = api.current.night ? 1 : 0
      // A GPU redraws the brass live while it rings, to show it shimmer; otherwise the cached still is enough.
      const live = !soft && !reduce && amp > 0.001
      if (!live && bgNight !== nightNow) {
        gl.uniform1f(u.uA, 0)
        gl.uniform1f(u.uPass, 0)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, bgFbo)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.bindTexture(gl.TEXTURE_2D, bg)
        gl.activeTexture(gl.TEXTURE0)
        gl.uniform1f(u.uA, reduce ? 0 : amp)
        bgNight = nightNow
      }
      gl.uniform1f(u.uPass, live ? 2 : 1)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindVertexArray(null)
    }

    const showNote = () => {
      const el = noteRef.current
      if (!el) return
      const hz = cpHz(mode)
      el.textContent = cpNote(hz) + " " + hz + " Hz"
      if (!reduce && el.animate) el.animate([{ opacity: 0, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" })
      clearTimeout(noteTimer)
      noteTimer = window.setTimeout(() => {
        if (noteRef.current) noteRef.current.textContent = ""
      }, 4200)
    }

    const setMode = (k: number) => {
      if (k === mode) return
      mode = k
      grid = cpGrid(mode, G)
      // The old note dies as the new one takes the plate.
      amp *= 0.35
      showNote()
    }

    // Snap the bow to the nearest point on the plate's edge from CSS point (px, py).
    const aim = (px: number, py: number) => {
      const [cx, cy, S] = plate
      const rx = (px - cx) / S
      const ry = (py - cy) / S
      let ex = Math.min(0.5, Math.max(-0.5, rx))
      let ey = Math.min(0.5, Math.max(-0.5, ry))
      if (Math.abs(rx) > Math.abs(ry)) {
        ex = rx < 0 ? -0.5 : 0.5
        bow.nx = rx < 0 ? -1 : 1
        bow.ny = 0
        ey = Math.min(0.46, Math.max(-0.46, ey))
      } else {
        ey = ry < 0 ? -0.5 : 0.5
        bow.nx = 0
        bow.ny = ry < 0 ? -1 : 1
        ex = Math.min(0.46, Math.max(-0.46, ex))
      }
      bow.ex = ex + 0.5
      bow.ey = ey + 0.5
      bow.x = cx + ex * S
      bow.y = cy + ey * S
    }

    // Slide the contact along the edge it is on, following the pointer.
    const along = (px: number, py: number) => {
      const [cx, cy, S] = plate
      if (bow.nx !== 0) {
        const ey = Math.min(0.46, Math.max(-0.46, (py - cy) / S))
        bow.ey = ey + 0.5
        bow.y = cy + ey * S
      } else {
        const ex = Math.min(0.46, Math.max(-0.46, (px - cx) / S))
        bow.ex = ex + 0.5
        bow.x = cx + ex * S
      }
    }

    // Simulated seconds. The bow's timeline runs on it, so a slow renderer plays the stroke slower rather than cutting it short.
    let simT = 0
    const simulate = (dt: number) => {
      simT += dt
      const now = simT * 1000
      // The bow: an automatic stroke, or the pointer's.
      if (auto) {
        const t = (now - auto.t0) / auto.dur
        if (t >= 1) {
          auto = null
          bow.energy = 0
          bow.liftTo = 1
          bow.visTo = 0
        } else {
          const env = Math.sin(Math.PI * Math.min(1, t * 1.15))
          bow.energy = auto.e * env
          bow.peak = auto.e
          bow.slide = 0.02 + 0.22 * (0.5 - 0.5 * Math.cos(Math.PI * t))
          bow.liftTo = t > 0.9 ? 1 : 0
          bow.visTo = 1
        }
      } else if (!bow.down) {
        bow.energy *= Math.exp(-dt / 0.08)
      }
      bow.lift += (bow.liftTo - bow.lift) * (1 - Math.exp(-dt / 0.09))
      // The bow comes in a touch slower than it leaves.
      bow.vis += (bow.visTo - bow.vis) * (1 - Math.exp(-dt / (bow.visTo > bow.vis ? 0.12 : 0.07)))
      if (Math.abs(bow.vis - bow.visTo) < 0.004) bow.vis = bow.visTo
      if (Math.abs(bow.lift - bow.liftTo) < 0.004) bow.lift = bow.liftTo
      const drawing = bow.energy > 0.04 && bow.lift < 0.5
      // A note speaks from how hard the stroke is drawn, not from its first slow inch.
      if (!auto) bow.peak = Math.max(bow.energy, bow.peak * Math.exp(-dt / 0.5))
      if (drawing) {
        // The mode that locks in, with a little hysteresis so a wobbling hand doesn't flicker it.
        const k = cpPick(bow.ex, bow.ey, bow.peak)
        if (k !== mode) {
          if (k !== bow.want) {
            bow.want = k
            bow.wantT = now
          } else if (now - bow.wantT > 140 || amp < 0.1) setMode(k)
        }
        const target = Math.min(1.15, 0.45 + 0.8 * bow.energy)
        amp += (target - amp) * (1 - Math.exp(-dt / 0.14))
      } else {
        // Ring-down once the bow leaves.
        amp *= Math.exp(-dt / CP_RING)
        if (amp < 0.004) amp = 0
      }
      while (ploughs.length) {
        const seg = ploughs.splice(0, 4)
        if (cpPlough(pos, seg[0], seg[1], seg[2], seg[3], 0.024, rand)) dirty = true
      }
      busy = cpStep(pos, vel, grid, G, amp, dt, rand)
      if (busy || amp >= CP_QUIET) dirty = true
    }

    const active = () =>
      amp > 0 || busy > 0 || !!auto || bow.down || finger.down || Math.abs(bow.vis - bow.visTo) > 0 || Math.abs(bow.lift - bow.liftTo) > 0 || ploughs.length > 0

    const frame = (now: number) => {
      raf = 0
      if (!visible) return
      const dt = last ? Math.min(soft ? 0.7 : 0.1, (now - last) / 1000) : STEP_S
      last = now
      acc += dt
      // A software renderer draws few frames, so the sand catches up on wall time between them.
      const most = soft ? 40 : 4
      let steps = 0
      while (acc >= STEP_S && steps < most) {
        simulate(STEP_S)
        acc -= STEP_S
        steps++
      }
      if (steps === most) acc = 0
      render()
      if (active()) raf = requestAnimationFrame(frame)
      else last = 0
    }
    const wake = () => {
      if (!raf && visible) {
        last = 0
        acc = 0
        raf = requestAnimationFrame(frame)
      }
    }

    const startAuto = (delay: number) => {
      clearTimeout(autoTimer)
      autoTimer = window.setTimeout(() => {
        if (bow.down) return
        // Bow the right edge where it gives a clearly different figure from the one on the plate.
        const [s, e] = cpAutoStroke(mode, 9)
        aim(plate[0] + plate[2], plate[1] + (s - 0.5) * plate[2])
        bow.slide = 0.02
        bow.lift = 1
        auto = { t0: simT * 1000, dur: 1900, s, e }
        wake()
      }, delay)
    }
    api.current.bow = () => {
      if (reduce) {
        // No theatre: the plate is bowed off-screen and the sand is shown where it settles.
        let k = mode
        for (let tries = 0; tries < 8 && k === mode; tries++) k = cpPick(1, 0.1 + rand() * 0.38, rand())
        setMode(k)
        amp = 0.9
        for (let i = 0; i < 600 && (amp > 0 || busy); i++) {
          amp = i < 150 ? 0.9 : amp * Math.exp(-STEP_S / CP_RING)
          if (amp < 0.004) amp = 0
          busy = cpStep(pos, vel, grid, G, amp, STEP_S, rand)
        }
        amp = 0
        busy = 0
        dirty = true
        render()
        return
      }
      startAuto(0)
    }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      const nw = Math.max(1, Math.round(rect.width))
      const nh = Math.max(1, Math.round(rect.height))
      scale = cpScale(nw, nh, window.devicePixelRatio || 1, soft ? 480000 : 2200000)
      canvas.width = Math.round(nw * scale)
      canvas.height = Math.round(nh * scale)
      const oldS = plate[2]
      w = nw
      h = nh
      plate = cpLayout(w, h, align)
      // The sand lives in plate units, so it survives any resize; only a big change in size re-dusts it.
      if (!pos.length || Math.abs(plate[2] - oldS) / oldS > 0.35) place()
      build()
      dirty = true
      render()
      canvas.setAttribute("data-ready", "")
    }

    api.current.redraw = () => {
      if (!raf) render()
    }

    const local = (e: PointerEvent) => {
      const b = root.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top]
    }
    // Rim zone: a band just inside and outside the plate's edge, where a bow can be laid on.
    const rim = (px: number, py: number) => {
      const [cx, cy, S] = plate
      const d = Math.max(Math.abs(px - cx), Math.abs(py - cy)) - S / 2
      return d > -Math.max(18, 0.07 * S) && d < Math.max(44, 0.16 * S)
    }
    const inside = (px: number, py: number) => {
      const [cx, cy, S] = plate
      return Math.max(Math.abs(px - cx), Math.abs(py - cy)) < S / 2
    }
    const toPlate = (px: number, py: number) => [(px - (plate[0] - plate[2] / 2)) / plate[2], (py - (plate[1] - plate[2] / 2)) / plate[2]]

    let lastMove = 0
    let lastP = [0, 0]
    const onMove = (e: PointerEvent) => {
      if (!api.current.interactive) return
      const p = local(e)
      if (hold && Math.hypot(p[0] - lastP[0], p[1] - lastP[1]) > 10) {
        clearTimeout(hold)
        hold = 0
      }
      // When the hand moved, not when a busy page got round to it.
      const now = e.timeStamp || performance.now()
      if (bow.down) {
        const dtm = Math.max(8, now - lastMove) / 1000
        const ddx = p[0] - lastP[0]
        const ddy = p[1] - lastP[1]
        // Along the bow's axis is the stroke; across it moves the contact along the edge.
        const stroke = ddx * bow.nx + ddy * bow.ny
        const speed = Math.abs(stroke) / dtm / plate[2]
        bow.energy += (Math.min(1, speed / 1.7) - bow.energy) * Math.min(1, dtm / 0.12)
        // Drawn outward the bow travels outward, so less of it hangs over the brass.
        bow.slide = Math.min(0.25, Math.max(0, bow.slide - stroke / plate[2] / 0.7))
        along(p[0], p[1])
      } else if (finger.down) {
        const a = toPlate(lastP[0], lastP[1])
        const b = toPlate(p[0], p[1])
        ploughs.push(a[0], a[1], b[0], b[1])
      } else if (e.pointerType === "mouse" && !auto) {
        if (rim(p[0], p[1])) {
          aim(p[0], p[1])
          bow.visTo = 1
          bow.liftTo = 1
          root.style.cursor = "grab"
        } else {
          bow.visTo = 0
          root.style.cursor = ""
        }
      }
      lastP = p
      lastMove = now
      wake()
    }
    const begin = (e: PointerEvent, p: number[]) => {
      hold = 0
      if (rim(p[0], p[1])) {
        auto = null
        clearTimeout(autoTimer)
        aim(p[0], p[1])
        bow.down = true
        bow.liftTo = 0
        bow.visTo = 1
        if (e.pointerType !== "mouse") bow.vis = 1
        bow.energy = 0
        bow.peak = 0
        bow.want = -1
        root.style.cursor = "grabbing"
      } else if (inside(p[0], p[1])) {
        finger.down = true
      } else return
      lastP = p
      lastMove = e.timeStamp || performance.now()
      try {
        root.setPointerCapture(e.pointerId)
      } catch (_) {
        // Capture is a nicety; bowing still works without it.
      }
      wake()
    }
    const onDown = (e: PointerEvent) => {
      if (!api.current.interactive || e.button > 0 || bow.down || finger.down) return
      if ((e.target as HTMLElement).closest("a,button,input,textarea,select,[data-interactive]")) return
      const p = local(e)
      // On touch the page must still scroll: a finger takes the bow only after resting a moment.
      if (e.pointerType === "touch") {
        clearTimeout(hold)
        lastP = p
        hold = window.setTimeout(() => begin(e, p), 220)
        return
      }
      begin(e, p)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (bow.down || finger.down) e.preventDefault()
    }
    const onUp = (e: PointerEvent) => {
      clearTimeout(hold)
      hold = 0
      if (bow.down) {
        bow.down = false
        bow.liftTo = 1
        if (e.pointerType !== "mouse") bow.visTo = 0
        root.style.cursor = e.pointerType === "mouse" ? "grab" : ""
      }
      finger.down = false
      wake()
    }
    const onLeave = () => {
      if (bow.down || auto) return
      bow.visTo = 0
      root.style.cursor = ""
      wake()
    }

    const lost = (ev: Event) => {
      ev.preventDefault()
      cancelAnimationFrame(raf)
      raf = 0
      setFailed(true)
    }
    canvas.addEventListener("webglcontextlost", lost)
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointerup", onUp)
    root.addEventListener("pointercancel", onUp)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("touchmove", onTouchMove, { passive: false })
    const ro = new ResizeObserver(resize)
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true
      if (visible && !seen) {
        seen = true
        if (api.current.autoBow && !reduce) startAuto(1100)
      }
      if (visible) wake()
    })
    io.observe(root)
    resize()

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(autoTimer)
      clearTimeout(noteTimer)
      clearTimeout(hold)
      ro.disconnect()
      io.disconnect()
      api.current.redraw = () => {}
      api.current.bow = () => {}
      canvas.removeEventListener("webglcontextlost", lost)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointercancel", onUp)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("touchmove", onTouchMove)
      gl.deleteTexture(den)
      gl.deleteFramebuffer(denFbo)
      gl.deleteTexture(bg)
      gl.deleteFramebuffer(bgFbo)
      gl.deleteBuffer(gbuf)
      gl.deleteBuffer(quad)
      gl.deleteVertexArray(vao)
      gl.deleteVertexArray(quadVao)
      gl.deleteProgram(splat.pr)
      gl.deleteProgram(show.pr)
      for (const s of shaders) gl.deleteShader(s)
    }
  }, [align, seed, first])

  return (
    <div
      ref={rootRef}
      className={"cp-root" + (night ? " cp-night" : "") + (className ? " " + className : "")}
      style={{ height }}
    >
      <style>{CP_CSS}</style>
      {failed ? (
        <div className="cp-fallback" role="img" aria-label={LABEL}>
          <i />
        </div>
      ) : (
        <canvas ref={canvasRef} role="img" aria-label={LABEL} />
      )}
      {children ? <div className="cp-over">{children}</div> : null}
      {hint && interactive && !failed ? (
        <button type="button" className="cp-pill" onClick={() => api.current.bow()}>
          Bow the edge <b ref={noteRef} aria-live="polite" />
        </button>
      ) : null}
    </div>
  )
}
