"use client"

import * as React from "react"

/**
 * Marbled Flame — a wall of fire painted like marbled ink on raw canvas.
 *
 * One full-screen fragment pass. The flame is a signed field (a tilted front,
 * bent by three levels of domain-warped noise), and everything you see is read
 * off that one field: the saturated red rim, the salmon-to-cream heat ramp, the
 * black veins folded into it, and the loose ribbons that tear away into the
 * dark. The motion is a sideways sway that grows toward the tips — the base of
 * a flame barely moves, the licks at its edge swing — layered over a slow boil.
 *
 * Drag through it and the paint smears after your hand; click and it flares.
 * Left alone, it flares on its own every few seconds.
 *
 * Self-contained: raw WebGL (2 where available, 1 otherwise), React is the only
 * import. The canvas sizes itself from its own box, never the window.
 */

/** Everything the piece can be tuned by. A preset is a partial overlay. */
export type FlameParams = {
  // palette — any CSS hex, #rgb or #rrggbb
  /** The dark the fire burns against. */
  background: string
  /** Cloudy lift in the dark, so it reads as a surface rather than a void. */
  backgroundLift: string
  /** Scorched rim just outside the flame, and the haze around it. */
  deep: string
  /** The saturated edge colour — and the colour of every loose ribbon. */
  flame: string
  /** First step into the heat. */
  blush: string
  /** Second step. */
  glow: string
  /** The hottest point, deep in the mass. */
  core: string
  /** The dark streaks folded through the flame. */
  vein: string
  /** Floating flecks. */
  ember: string

  // shape
  /** Direction the fire comes from, in degrees. -70 is lower right. */
  angle: number
  /** How far the mass reaches into the frame. Around -0.3 … 0.4. */
  reach: number
  /** Bows the front so the fire is a bank rather than a straight wall. */
  curve: number
  /** Noise scale. Higher is busier, smaller marbling. */
  scale: number
  /** How long the licks stream along the front. 1 is isotropic. */
  stretch: number
  /** How hard the noise folds the front. */
  turbulence: number
  /** How much heat builds toward the core. */
  heat: number

  // motion
  /** Speed of the boil. */
  flow: number
  /** Sideways sway, as a fraction of the frame height. */
  sway: number
  /** Sway frequency. */
  swaySpeed: number
  /** How far the flame leans toward the pointer. */
  lean: number

  // detail
  /** Loose ribbons torn off into the dark. 0 … 1.5. */
  tendrils: number
  tendrilWidth: number
  /** Dark streaks through the mass. 0 … 1. */
  veins: number
  veinWidth: number
  /** Sandy canvas grain. 0 … 1.5. */
  grain: number
  /** Woven canvas texture in the dark. 0 … 1. */
  weave: number
  /** Floating flecks. 0 … 1. */
  embers: number
  emberSize: number
  vignette: number

  // interaction
  /** How far a drag drags the paint. */
  smear: number
  /** Seconds a smear takes to heal. */
  trailFade: number
  /** Size of the flare a click lights. */
  flare: number
  /** The fire flares by itself when nobody is touching it. */
  ambientFlares: boolean
  /** Seconds between ambient flares, roughly. */
  ambientEvery: number

  /** Drawing-buffer scale, 0.4 … 1. Lower is cheaper on large screens. */
  quality: number
}

export const FLAME_DEFAULTS: FlameParams = {
  background: "#03080a",
  backgroundLift: "#0a1a1e",
  deep: "#5a0610",
  flame: "#ee1530",
  blush: "#f06b62",
  glow: "#f6b58c",
  core: "#fff0c8",
  vein: "#150708",
  ember: "#e8643c",

  angle: -68,
  reach: -0.08,
  curve: 0.34,
  scale: 2.1,
  stretch: 2.4,
  turbulence: 1.15,
  heat: 1.35,

  flow: 0.09,
  sway: 0.05,
  swaySpeed: 0.9,
  lean: 0.12,

  tendrils: 1,
  tendrilWidth: 0.024,
  veins: 0.9,
  veinWidth: 0.026,
  grain: 1,
  weave: 0.55,
  embers: 0.6,
  emberSize: 1,
  vignette: 0.55,

  smear: 0.12,
  trailFade: 1.4,
  flare: 1,
  ambientFlares: true,
  ambientEvery: 3.2,

  quality: 1,
}

/** Named looks, each a partial overlay on the defaults. */
export const FLAME_PRESETS = {
  vermilion: {},
  azure: {
    background: "#02050c",
    backgroundLift: "#0a1328",
    deep: "#081a5c",
    flame: "#1f5bff",
    blush: "#3aa0ff",
    glow: "#8fe3ff",
    core: "#f2fbff",
    vein: "#02040c",
    ember: "#5aa8ff",
    swaySpeed: 1.2,
  },
  solar: {
    background: "#0a0602",
    backgroundLift: "#1c1206",
    deep: "#5c2002",
    flame: "#ff5a0a",
    blush: "#ff9a2a",
    glow: "#ffd36a",
    core: "#fffbe0",
    vein: "#1a0a02",
    ember: "#ffb040",
    heat: 1.6,
    reach: 0.06,
  },
  phantom: {
    background: "#06030b",
    backgroundLift: "#150b24",
    deep: "#3c0a4c",
    flame: "#c21cff",
    blush: "#ff4fa8",
    glow: "#ffa8c8",
    core: "#fff0f6",
    vein: "#0a030f",
    ember: "#ff5ad0",
    sway: 0.07,
    angle: -110,
  },
  verdigris: {
    background: "#020806",
    backgroundLift: "#08201a",
    deep: "#063a2a",
    flame: "#14d08a",
    blush: "#6ef0b0",
    glow: "#c4ffd8",
    core: "#f4fff4",
    vein: "#020a06",
    ember: "#4cf0a0",
    turbulence: 1.25,
    tendrils: 1.3,
  },
} satisfies Record<string, Partial<FlameParams>>

// #region logic
/** Parse #rgb / #rrggbb into 0..1 channels. Garbage reads as black, not NaN. */
export function hexToRgb(hex: string): [number, number, number] {
  let h = String(hex).trim().replace(/^#/, "")
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0]
  const n = parseInt(h, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/**
 * Pointer velocity in frame-heights per second, capped. A flick measured over
 * one short frame reads as an enormous speed, and uncapped it would tear the
 * whole flame across the screen in a single frame.
 */
export function pointerVelocity(dx: number, dy: number, dt: number, max: number): [number, number] {
  const s = Math.max(dt, 1 / 240)
  const vx = dx / s
  const vy = dy / s
  const m = Math.hypot(vx, vy)
  if (m <= max || m === 0) return [vx, vy]
  return [(vx / m) * max, (vy / m) * max]
}

/** Linear decay of a 0..1 life over `seconds`, never below zero. */
export function decay(life: number, dt: number, seconds: number) {
  return Math.max(0, life - dt / Math.max(seconds, 0.05))
}

/** Flare envelope: a fast strike, then a long exponential burn-out. */
export function flareEnvelope(age: number) {
  if (age < 0) return 0
  if (age < 0.15) return age / 0.15
  return Math.exp(-(age - 0.15) * 1.25)
}
// #endregion

const TRAIL = 10
const FLARES = 5

/** Scalar params fed straight to the shader as u<Name>. */
const FLOAT_KEYS = [
  "reach", "curve", "scale", "stretch", "turbulence", "heat", "flow", "sway", "swaySpeed",
  "tendrils", "tendrilWidth", "veins", "veinWidth", "grain", "weave", "embers",
  "emberSize", "vignette", "smear",
] as const
const COLOR_KEYS = [
  "background", "backgroundLift", "deep", "flame", "blush", "glow", "core", "vein", "ember",
] as const
const uName = (k: string) => "u" + k[0].toUpperCase() + k.slice(1)

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uPx;
uniform vec2 uAngle;
uniform float uLean;
uniform vec4 uTrail[${TRAIL}];
uniform float uTrailLife[${TRAIL}];
uniform vec4 uFlares[${FLARES}];

uniform vec3 uBackground;
uniform vec3 uBackgroundLift;
uniform vec3 uDeep;
uniform vec3 uFlame;
uniform vec3 uBlush;
uniform vec3 uGlow;
uniform vec3 uCore;
uniform vec3 uVein;
uniform vec3 uEmber;

uniform float uReach;
uniform float uCurve;
uniform float uScale;
uniform float uStretch;
uniform float uTurbulence;
uniform float uHeat;
uniform float uFlow;
uniform float uSway;
uniform float uSwaySpeed;
uniform float uTendrils;
uniform float uTendrilWidth;
uniform float uVeins;
uniform float uVeinWidth;
uniform float uGrain;
uniform float uWeave;
uniform float uEmbers;
uniform float uEmberSize;
uniform float uVignette;
uniform float uSmear;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
    u.y);
}
const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);
float fbm4(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = ROT * p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v / 0.9375;
}
float fbm5(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = ROT * p * 2.01 + vec2(4.1, 3.3);
    a *= 0.5;
  }
  return v / 0.96875;
}

// One layer of drifting flecks: a sparse grid, each live cell holds a short
// capsule at a random angle that twinkles.
float embers(vec2 p, float cells, float t, float seed, float density) {
  vec2 q = p * cells;
  vec2 id = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash12(id + seed);
  if (h > density) return 0.0;
  vec2 r = hash22(id * 1.37 + seed);
  vec2 d = f - (r - 0.5) * 0.6;
  float a = (r.x * 2.0 - 1.0) * 1.2 + 2.6;
  float c = cos(a);
  float s = sin(a);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  float len = mix(0.04, 0.2, r.y) * uEmberSize;
  d.x -= clamp(d.x, -len, len);
  float wid = 0.022 * uEmberSize;
  float k = 1.0 - smoothstep(wid * 0.4, wid, length(d));
  float tw = 0.55 + 0.45 * sin(t * (1.5 + 3.0 * r.x) + h * 40.0);
  return k * tw;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 p = (fc - 0.5 * uRes) / uRes.y;
  vec2 uv = fc / uRes;
  float t = uTime;
  vec2 n = uAngle;
  vec2 tg = vec2(-n.y, n.x);

  // --- the hand: a trail of samples that drags the paint after the pointer
  vec2 w = p;
  float touch = 0.0;
  for (int i = 0; i < ${TRAIL}; i++) {
    float life = uTrailLife[i];
    if (life <= 0.0) continue;
    vec4 tr = uTrail[i];
    vec2 d = p - tr.xy;
    float f = exp(-dot(d, d) * 26.0) * life;
    w -= tr.zw * f * uSmear;
    touch += f;
  }

  // --- the sway: tips swing, the base barely moves
  float d0 = dot(p, n) + uReach;
  float tip = clamp(0.3 - d0 * 1.4, 0.0, 1.4);
  float st = t * uSwaySpeed;
  float sw = sin(st + p.y * 2.4) + 0.55 * sin(st * 1.73 + p.y * 5.3 + 1.7) + 0.3 * sin(st * 2.9 - p.x * 3.1);
  w.x += uSway * sw * (0.3 + tip) + uLean * (0.25 + tip);
  w.y += uSway * 0.4 * cos(st * 0.83 + p.x * 2.1) * (0.3 + tip);

  // --- three levels of domain warp: the marbling
  // Worked in the front's own frame and stretched along it, so the paint
  // streams in long licks rather than round blots.
  float k = sqrt(max(uStretch, 0.2));
  vec2 s = vec2(dot(w, tg) / k, dot(w, n) * k) * uScale;
  float ft = t * uFlow;
  vec2 a = vec2(fbm4(s + vec2(0.0, ft * 0.7)), fbm4(s + vec2(5.2, 1.3) - vec2(ft * 0.6, 0.0)));
  vec2 b = vec2(
    fbm4(s + 3.6 * a + vec2(1.7, 9.2) + vec2(ft, 0.3 * ft)),
    fbm4(s + 3.6 * a + vec2(8.3, 2.8) - vec2(0.2 * ft, 0.8 * ft)));
  float m = fbm5(s + 2.4 * uTurbulence * b);

  // --- the field: > 0 is fire
  float along = dot(w, tg);
  float F = dot(w, n) + uReach - uCurve * along * along;
  F += ((m - 0.5) * 0.95 + (b.x - 0.5) * 0.55) * uTurbulence;

  for (int i = 0; i < ${FLARES}; i++) {
    vec4 fl = uFlares[i];
    if (fl.w <= 0.0) continue;
    vec2 d = p - fl.xy;
    float r = 0.07 + 0.22 * (1.0 - exp(-fl.z * 1.6));
    float env = fl.z < 0.15 ? fl.z / 0.15 : exp(-(fl.z - 0.15) * 1.25);
    F += fl.w * env * exp(-dot(d, d) / (r * r)) * (0.35 + 1.1 * m);
  }
  F += touch * 0.05;

  // sandy, dithered edges — paint dragged over rough canvas
  vec2 cell = floor(fc / max(uPx, 1.0));
  float g = hash12(cell);
  float g2 = hash12(cell + 71.3);
  F += (g - 0.5) * 0.045 * uGrain;

  // --- the dark
  float cloud = fbm4(p * 1.4 + vec2(0.02 * t, -0.01 * t));
  vec3 col = mix(uBackground, uBackgroundLift, smoothstep(0.35, 0.85, cloud) * 0.9);
  float haze = smoothstep(-0.45, 0.0, F);
  col = mix(col, uDeep, haze * haze * haze * 0.3);
  vec2 cp = fc / max(uPx, 1.0);
  float weave = sin(cp.x * 2.2) * sin(cp.y * 2.2);
  col *= 1.0 + uWeave * 0.28 * weave - uWeave * 0.1;

  // --- ribbons torn off into the dark
  float tn = fbm4(s * vec2(0.9, 1.5) + 2.6 * a + b * 1.2 + vec2(-ft * 0.5, 2.0));
  float rl = min(abs(tn - 0.46), abs(tn - 0.64) * 1.4);
  float tw = uTendrilWidth * (0.6 + 0.8 * a.y);
  float rib = 1.0 - smoothstep(tw * 0.35, tw, rl);
  float near = smoothstep(-0.95, -0.08, F);
  float broken = smoothstep(0.42, 0.64, fbm4(s * vec2(0.6, 1.1) + b * 2.0 + vec2(11.0, -ft)));
  rib *= near * broken * uTendrils;
  rib *= 0.75 + 0.5 * g2;
  vec3 ribCol = mix(uFlame, uBlush, (1.0 - smoothstep(0.0, tw * 0.4, rl)) * 0.35);
  col = mix(col, ribCol, clamp(rib, 0.0, 1.0));

  // --- the mass
  float mask = smoothstep(-0.004, 0.012, F);
  float h = clamp(F * uHeat + (m - 0.5) * 0.3 + (a.x - 0.5) * 0.2, 0.0, 1.0);
  vec3 fire = uFlame;
  fire = mix(fire, uBlush, smoothstep(0.06, 0.3, h));
  fire = mix(fire, uGlow, smoothstep(0.26, 0.6, h));
  fire = mix(fire, uCore, smoothstep(0.55, 0.95, h));
  fire = mix(uDeep, fire, smoothstep(0.0, 0.03, F));

  // veins folded through the paint, ringed in red
  float vn = fbm4(s * 1.6 + 4.2 * b + vec2(3.1, 7.7) + vec2(0.0, ft * 0.5));
  float vl = abs(vn - 0.5);
  float vw = uVeinWidth * (0.5 + 1.2 * b.y);
  float band = smoothstep(0.03, 0.12, F) * (1.0 - smoothstep(0.35, 0.8, h));
  float vein = (1.0 - smoothstep(vw * 0.45, vw, vl)) * band * uVeins;
  float halo = (1.0 - smoothstep(vw, vw * 3.0, vl)) * band * uVeins;
  fire = mix(fire, uFlame, halo * 0.55);
  fire = mix(fire, uVein, vein * (0.7 + 0.3 * g));

  // the grain: pigment speckle, stronger where the paint is thin
  float speck = step(0.9, g2) * uGrain;
  fire = mix(fire, fire * vec3(1.02, 0.72, 0.8), speck * 0.6);
  fire *= 1.0 + (g - 0.5) * 0.22 * uGrain;
  col = mix(col, fire, mask);
  col *= 1.0 + (g2 - 0.5) * 0.08 * uGrain;

  // --- flecks drifting up and away, swaying with the fire
  vec2 ep = p + vec2(t * 0.035, -t * 0.02);
  ep.x += uSway * 0.6 * sin(st * 0.7 + p.y * 3.0);
  float e = embers(ep, 13.0, t, 3.1, 0.2 * uEmbers)
    + 0.7 * embers(ep * 1.1 + vec2(t * 0.02, 0.0), 27.0, t, 17.7, 0.28 * uEmbers);
  e *= 1.0 - mask * 0.85;
  col = mix(col, mix(uEmber, uGlow, g2 * 0.6), clamp(e, 0.0, 1.0));

  // --- vignette
  float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.25, 1.0)));
  col *= mix(1.0, vig, uVignette);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

export type MarbledFlameProps = {
  /**
   * Explicit height. The canvas fills this box, so it must be a definite
   * length — "100%" only works if every ancestor has one too, which an
   * installed page usually does not.
   */
  height?: string
  /** A named look, layered over the defaults. */
  preset?: keyof typeof FLAME_PRESETS
  /** Overrides layered over the preset. */
  params?: Partial<FlameParams>
  /** Pointer smears and click flares. */
  interactive?: boolean
  /**
   * How touch is shared with the page. "scroll" keeps vertical scrolling;
   * "draw" takes the gesture, which is right full-bleed and wrong mid-article.
   */
  touch?: "scroll" | "draw"
  /** Content laid over the fire — a headline, a call to action. */
  children?: React.ReactNode
  className?: string
  "aria-label"?: string
}

export default function MarbledFlame({
  height = "100svh",
  preset = "vermilion",
  params,
  interactive = true,
  touch = "scroll",
  children,
  className = "",
  "aria-label": ariaLabel = "Marbled fire drifting across a dark canvas",
}: MarbledFlameProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = React.useState(false)
  const [generation, setGeneration] = React.useState(0)
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // Defaults < preset < explicit params.
  const P = React.useMemo<FlameParams>(
    () => ({ ...FLAME_DEFAULTS, ...(FLAME_PRESETS[preset] ?? {}), ...(params ?? {}) }),
    [preset, params],
  )
  // The loop reads through a ref, so retuning never rebuilds WebGL.
  const paramsRef = React.useRef(P)
  paramsRef.current = P
  const redrawRef = React.useRef<() => void>(() => {})
  React.useEffect(() => redrawRef.current(), [P])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const opts: WebGLContextAttributes = {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    }
    const gl = (canvas.getContext("webgl2", opts) ??
      canvas.getContext("webgl", opts)) as WebGLRenderingContext | null
    if (!gl) {
      setFailed(true)
      return
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)
      if (!s) return null
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("marbled-flame:", gl.getShaderInfoLog(s))
        gl.deleteShader(s)
        return null
      }
      return s
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    const program = vs && fs ? gl.createProgram() : null
    if (!program || !vs || !fs) {
      setFailed(true)
      return
    }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("marbled-flame:", gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      setFailed(true)
      return
    }
    gl.useProgram(program)

    // One oversized triangle covers the screen.
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, "aPos")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const loc = (n: string) => gl.getUniformLocation(program, n)
    const U = {
      res: loc("uRes"),
      time: loc("uTime"),
      px: loc("uPx"),
      angle: loc("uAngle"),
      lean: loc("uLean"),
      trail: loc("uTrail"),
      trailLife: loc("uTrailLife"),
      flares: loc("uFlares"),
    }
    const floats = FLOAT_KEYS.map((k) => [loc(uName(k)), k] as const)
    const colors = COLOR_KEYS.map((k) => [loc(uName(k)), k] as const)

    // Parsing nine hex strings every frame is waste; re-parse only when the
    // params object itself changes.
    let lastParams: FlameParams | null = null
    const uploadParams = (p: FlameParams) => {
      if (p === lastParams) return
      lastParams = p
      for (const [l, k] of floats) gl.uniform1f(l, p[k])
      for (const [l, k] of colors) {
        const [r, g, b] = hexToRgb(p[k])
        gl.uniform3f(l, r, g, b)
      }
      const a = (p.angle * Math.PI) / 180
      gl.uniform2f(U.angle, Math.cos(a), Math.sin(a))
    }

    // ---- sizing, from the element rather than the window --------------------
    let cssW = 1
    let cssH = 1
    let scale = 1
    const resize = () => {
      const q = Math.min(Math.max(paramsRef.current.quality, 0.4), 1)
      scale = Math.min(window.devicePixelRatio || 1, 1.75) * q
      cssW = Math.max(canvas.clientWidth, 1)
      cssH = Math.max(canvas.clientHeight, 1)
      const w = Math.max(1, Math.floor(cssW * scale))
      const h = Math.max(1, Math.floor(cssH * scale))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      if (reduced) paint()
    }

    // ---- the hand -----------------------------------------------------------
    const trail = new Float32Array(TRAIL * 4)
    const trailLife = new Float32Array(TRAIL)
    let trailHead = 0
    const flares = new Float32Array(FLARES * 4)
    let flareHead = 0

    const t0 = performance.now()
    const clock = () => (performance.now() - t0) / 1000

    // Pointer in the shader's space: centred, y up, one unit = frame height.
    const toSpace = (e: PointerEvent): [number, number] => {
      const r = canvas.getBoundingClientRect()
      const h = Math.max(r.height, 1)
      return [(e.clientX - r.left - r.width / 2) / h, (r.height / 2 - (e.clientY - r.top)) / h]
    }
    let last: { x: number; y: number; t: number } | null = null
    let lastTouched = -1e9
    let leanTarget = 0
    let lean = 0
    let pointerDown = false

    const pushTrail = (x: number, y: number, vx: number, vy: number) => {
      const i = trailHead
      trail[i * 4] = x
      trail[i * 4 + 1] = y
      trail[i * 4 + 2] = vx
      trail[i * 4 + 3] = vy
      trailLife[i] = 1
      trailHead = (trailHead + 1) % TRAIL
    }
    const ignite = (x: number, y: number, strength: number) => {
      const i = flareHead
      flares[i * 4] = x
      flares[i * 4 + 1] = y
      flares[i * 4 + 2] = 0
      flares[i * 4 + 3] = strength
      flareHead = (flareHead + 1) % FLARES
    }

    const onMove = (e: PointerEvent) => {
      if (!interactive) return
      const [x, y] = toSpace(e)
      const now = clock()
      const r = canvas.getBoundingClientRect()
      leanTarget = (x / Math.max(r.width / Math.max(r.height, 1), 0.1)) * 2
      lastTouched = now
      // Touch without a press is a scroll on its way through, not a stroke.
      if (e.pointerType !== "mouse" && !pointerDown) return
      if (last) {
        const dt = now - last.t
        const dx = x - last.x
        const dy = y - last.y
        // Sample densely enough that a sweep leaves no gaps, sparsely enough
        // that ten slots cover a stroke of useful length.
        if (Math.hypot(dx, dy) < 0.025 && dt < 0.06) return
        const [vx, vy] = pointerVelocity(dx, dy, dt, 3)
        pushTrail(x, y, vx, vy)
      }
      last = { x, y, t: now }
    }
    const onDown = (e: PointerEvent) => {
      if (!interactive) return
      const [x, y] = toSpace(e)
      pointerDown = true
      last = { x, y, t: clock() }
      lastTouched = clock()
      ignite(x, y, 0.55 * paramsRef.current.flare)
    }
    const onUp = () => {
      pointerDown = false
    }
    const onLeave = () => {
      pointerDown = false
      last = null
      leanTarget = 0
    }
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("pointercancel", onUp)
    canvas.addEventListener("pointerleave", onLeave)

    let raf = 0
    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onRestored = () => setGeneration((g) => g + 1)
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)

    // ---- the fire, left alone ----------------------------------------------
    let nextAmbient = 1.2
    const ambient = (t: number) => {
      const p = paramsRef.current
      if (!p.ambientFlares || t < nextAmbient) return
      nextAmbient = t + p.ambientEvery * (0.6 + Math.random() * 0.8)
      if (t - lastTouched < 2) return
      // Somewhere along the front, where a flare reads as the fire reaching.
      const a = (p.angle * Math.PI) / 180
      const nx = Math.cos(a)
      const ny = Math.sin(a)
      const aspect = cssW / cssH
      const along = (Math.random() - 0.5) * aspect * 0.9
      const back = -p.reach + p.curve * along * along - 0.05
      ignite(nx * back - ny * along, ny * back + nx * along, (0.3 + Math.random() * 0.25) * p.flare)
    }

    // ---- loop ---------------------------------------------------------------
    let time = 0
    const paint = () => {
      const p = paramsRef.current
      uploadParams(p)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(U.res, canvas.width, canvas.height)
      gl.uniform1f(U.time, time)
      gl.uniform1f(U.px, scale)
      gl.uniform1f(U.lean, lean)
      gl.uniform4fv(U.trail, trail)
      gl.uniform1fv(U.trailLife, trailLife)
      gl.uniform4fv(U.flares, flares)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    redrawRef.current = () => {
      if (reduced) paint()
    }

    let visible = true
    let prev = performance.now()
    const frame = (now: number) => {
      raf = 0
      const p = paramsRef.current
      const dt = Math.min((now - prev) / 1000, 0.1)
      prev = now
      time += dt
      for (let i = 0; i < TRAIL; i++) trailLife[i] = decay(trailLife[i], dt, p.trailFade)
      for (let i = 0; i < FLARES; i++) {
        if (flares[i * 4 + 3] <= 0) continue
        flares[i * 4 + 2] += dt
        if (flareEnvelope(flares[i * 4 + 2]) < 0.01) flares[i * 4 + 3] = 0
      }
      lean += (leanTarget * p.lean - lean) * Math.min(dt * 2.2, 1)
      ambient(time)
      paint()
      if (visible) raf = requestAnimationFrame(frame)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    // Offscreen, the fire costs a full-screen pass per frame for nobody.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !raf && !reduced) {
        prev = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(canvas)

    // Start a few seconds in, so the first frame is already mid-sway rather
    // than the symmetric t = 0 pose.
    time = 7.3
    if (reduced) {
      paint()
    } else {
      paint()
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      io.disconnect()
      redrawRef.current = () => {}
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      canvas.removeEventListener("pointerleave", onLeave)
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [interactive, reduced, generation])

  return (
    <section
      className={"relative w-full overflow-hidden " + className}
      style={{ height, background: P.background }}
      aria-label={ariaLabel}
    >
      {failed ? (
        // No WebGL: a still picture of the same fire beats a black box.
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 70% at 88% 92%, " + P.core + " 0%, " + P.glow + " 22%, " +
              P.blush + " 40%, " + P.flame + " 55%, " + P.deep + " 68%, transparent 80%), " +
              P.background,
          }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={
            "absolute inset-0 block h-full w-full " +
            (interactive ? "cursor-crosshair " : "") +
            (touch === "draw" ? "touch-none" : "touch-pan-y")
          }
        />
      )}
      {children ? <div className="pointer-events-none relative z-10 h-full w-full">{children}</div> : null}
    </section>
  )
}
