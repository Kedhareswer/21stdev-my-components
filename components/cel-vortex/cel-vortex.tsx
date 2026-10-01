"use client"

import * as React from "react"

/**
 * Cel Vortex — a hand-inked warp tunnel, the impact frame from an old cel
 * cartoon: a blown-out white core, and around it rings of rounded ink dashes
 * spiralling inward over a flat field of colour.
 *
 * One full-screen fragment pass. Space is unrolled into log-polar coordinates,
 * so every ring is the same shape at every radius and the tunnel is
 * self-similar — the rings can flow inward forever. Each ring is cut into
 * cells, and each cell holds at most one tapered capsule whose length, width
 * and presence are driven by distance from the core: near the middle the
 * strokes fatten until they merge into solid paper and only blue nicks survive;
 * out at the rim they thin to drips and specks.
 *
 * The motion is drawn "on twos" by default: the picture only changes 12 times a
 * second, and every new drawing nudges the linework with a fresh noise seed —
 * the boil of a hand-traced cel. Set `fps: 0` for buttery motion instead.
 *
 * The pointer drags the eye of the vortex; holding down (or Space/Enter when
 * focused) surges it — faster spin, faster inflow, the core blows open — and
 * every click sends a shock ring out through the ink.
 *
 * Self-contained: raw WebGL2, React is the only import. No textures, no image
 * assets, no CSS file. The canvas sizes itself from its own box, never the
 * window, and releases every GL object on unmount.
 */

export type VortexParams = {
  // the tunnel
  /** Rings per e-fold of radius. More reads finer and busier. */
  rings: number
  /** Cells around each ring. Whole number; more means shorter dashes. */
  segments: number
  /** Spiral twist, radians per e-fold. 0 is concentric rings. */
  twist: number
  /** Radius of the solid white core, as a fraction of the shorter side. */
  coreRadius: number
  /** How far past the core the ink thins out to nothing. */
  spread: number
  /** How lumpy the core's edge is. */
  wobble: number
  /** Lobes on the wobble. Low is blobby, high is ragged. */
  wobbleScale: number
  // the strokes
  /** Dash half-length, in cells, at the short / long end of the range. */
  lenMin: number
  lenMax: number
  /** Dash half-width, in ring heights. Past 0.5 neighbours merge. */
  widthMin: number
  widthMax: number
  /** Tail thickness relative to the head. 1 is a plain capsule. */
  taper: number
  /** How far a dash wanders off its ring's centreline in the thin zone. */
  jitter: number
  /** Fraction of cells inked out at the rim, where the ink is sparsest. */
  presence: number
  /** Extra fine specks scattered through the outer field. */
  specks: number
  // motion
  /** Rings per second flowing into the core. */
  inflow: number
  /** Radians per second the rings turn. Each ring has its own gear. */
  spin: number
  /** Drawings per second. 12 is "on twos"; 0 is smooth. */
  fps: number
  /** How far each new drawing shifts the linework. Only when fps > 0. */
  boil: number
  /** Global clock multiplier. */
  speed: number
  // the pointer
  /** Resting eye of the vortex, 0..1 of the box (y up). */
  centerX: number
  centerY: number
  /** How far the eye follows the pointer, 0..1. */
  follow: number
  /** Spin / inflow multiplier at full surge. */
  surgeBoost: number
  /** How much the core opens at full surge. */
  surgeOpen: number
  /** Shock ring speed, shorter sides per second. */
  pulseSpeed: number
  // post
  /** A soft light bloom of paper colour bleeding out of the core. */
  halo: number
  vignette: number
  grain: number
  // palette
  inkColor: string
  paperColor: string
}

export const VORTEX_DEFAULTS: VortexParams = {
  rings: 13,
  segments: 34,
  twist: 0.55,
  coreRadius: 0.25,
  spread: 0.5,
  wobble: 0.22,
  wobbleScale: 2.6,

  lenMin: 0.35,
  lenMax: 0.95,
  widthMin: 0.24,
  widthMax: 0.62,
  taper: 0.62,
  jitter: 0.5,
  presence: 0.16,
  specks: 0.7,

  inflow: 0.55,
  spin: 0.32,
  fps: 12,
  boil: 1,
  speed: 1,

  centerX: 0.5,
  centerY: 0.5,
  follow: 0.22,
  surgeBoost: 3.2,
  surgeOpen: 0.45,
  pulseSpeed: 0.9,

  halo: 0.35,
  vignette: 0.18,
  grain: 0.035,

  inkColor: "#2f6fd6",
  paperColor: "#eceef1",
}

/** Overlays on the defaults. Named for the look, not the numbers. */
export const VORTEX_PRESETS: Record<string, Partial<VortexParams>> = {
  cobalt: {},
  sumi: {
    inkColor: "#16130f", paperColor: "#efe8d8",
    twist: 0.9, spin: 0.22, inflow: 0.4, taper: 0.3, wobble: 0.3, fps: 8, boil: 1.4,
  },
  tangerine: {
    inkColor: "#ff5b1f", paperColor: "#fff3e3",
    rings: 11, segments: 26, twist: 1.3, spin: 0.5, coreRadius: 0.17, halo: 0.5,
  },
  bubblegum: {
    inkColor: "#ff4f9a", paperColor: "#fff1f6",
    rings: 15, segments: 40, twist: -0.6, widthMax: 0.62, taper: 0.7, wobble: 0.3,
  },
  abyss: {
    // Inverted: a dark hole punched through a pale page.
    inkColor: "#e9ecf2", paperColor: "#0d1a4a",
    twist: -0.8, spin: 0.4, inflow: 0.7, coreRadius: 0.16, spread: 0.5, halo: 0.15, vignette: 0,
  },
  matcha: {
    inkColor: "#3f7d4a", paperColor: "#f1f4e6",
    rings: 10, segments: 22, lenMax: 1.4, twist: 0.3, spin: 0.18, inflow: 0.3, fps: 6, boil: 1.8,
  },
}

const MAX_PULSES = 4

type Kind = "f" | "c"
type Slot = [keyof VortexParams, Kind]

/** Which parameters reach the shader, and as what. `c` is a hex colour. */
const UNIFORMS: Slot[] = [
  ["rings", "f"], ["segments", "f"], ["twist", "f"], ["coreRadius", "f"], ["spread", "f"],
  ["wobble", "f"], ["wobbleScale", "f"],
  ["lenMin", "f"], ["lenMax", "f"], ["widthMin", "f"], ["widthMax", "f"], ["taper", "f"],
  ["jitter", "f"], ["presence", "f"], ["specks", "f"], ["boil", "f"],
  ["halo", "f"], ["vignette", "f"], ["grain", "f"],
  ["inkColor", "c"], ["paperColor", "c"],
]

const uName = (k: string) => "u" + k[0].toUpperCase() + k.slice(1)
const declare = (slots: Slot[]) =>
  slots.map(([k, kind]) => "uniform " + (kind === "c" ? "vec3" : "float") + " " + uName(k) + ";").join("\n")

const VERT = `#version 300 es
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

// Rings repeat every RING_WRAP indices, so the inflow phase can wrap without a
// jump, and every ring gear is a multiple of 1/10 turn-rate, so the spin phase
// can wrap at 20π without one either. The JS wraps at the same numbers.
const RING_WRAP = 256
const SPIN_WRAP = Math.PI * 20

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform vec2 uCenter;
uniform float uFlow;
uniform float uSpin;
uniform float uSurge;
uniform float uSurgeOpen;
uniform float uSeed;
uniform vec4 uPulse[${MAX_PULSES}];
${declare(UNIFORMS)}
out vec4 frag;

const float TAU = 6.28318530718;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec4 hash42(vec2 p){
  vec4 p4 = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
  p4 += dot(p4, p4.wzxy + 33.33);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i), b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0)), d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// The core's edge, as a function of angle. Sampled on a circle in noise space
// so it is seamless all the way round.
float coreAt(float a){
  vec2 c = vec2(cos(a), sin(a)) * uWobbleScale;
  float n = vnoise(c + vec2(uTime * 0.11, 3.7)) * 0.65 + vnoise(c * 2.3 - vec2(1.9, uTime * 0.07)) * 0.35;
  return uCoreRadius * (1.0 + uSurge * uSurgeOpen) * (1.0 + uWobble * (n - 0.5) * 2.0);
}

// How much ink a radius wants: 1 at the core, 0 well past it, plus any shock
// ring passing through.
float density(float r, float core){
  float d = 1.0 - smoothstep(core * 0.92, core + uSpread, r);
  for (int i = 0; i < ${MAX_PULSES}; i++) {
    vec4 pu = uPulse[i];
    float age = uTime - pu.x;
    if (pu.y <= 0.0 || age < 0.0 || age > 1.8) continue;
    float front = core + age * pu.z;
    float w = 0.05 + age * 0.06;
    d += exp(-pow((r - front) / w, 2.0)) * (1.0 - age / 1.8) * 0.75 * pu.y;
  }
  return clamp(d, 0.0, 1.0);
}

// One layer of dashes. Returns coverage 0..1 at this pixel.
//   N, S: rings per e-fold and cells per ring
//   lr, a: log-radius and angle of the pixel
//   aa: one CSS pixel, in units of the local radius
//   specks: 1 for the fine speck layer, 0 for the main strokes
float dashes(float N, float S, float lr, float a, float core, float aa, float flow, float salt, float specks){
  float v = lr * N + flow;
  float cellW = TAU / S;
  float cellH = 1.0 / N;
  float m = 0.0;

  // Fat dashes near the core reach into the rings either side, so the
  // neighbours are searched too — otherwise every ring boundary would show as
  // a hairline seam. Specks are tiny and stay in their own ring.
  int reach = specks > 0.5 ? 0 : 1;
  for (int dr = -1; dr <= 1; dr++) {
    if (abs(dr) > reach) continue;
    float ring = floor(v) + float(dr);
    float ringId = mod(ring, ${RING_WRAP}.0);
    float fv = v - ring - 0.5;
    float gear = (7.0 + floor(hash12(vec2(ringId, salt)) * 7.0)) / 10.0;
    float ang = a + uTwist * lr + uSpin * gear * (specks > 0.5 ? 1.35 : 1.0);
    float u = ang / TAU * S;
    // Density at the ring's own centreline, so a dash keeps one shape along
    // its whole length rather than tapering with the pixel's radius.
    float rc = exp((ring + 0.5 - flow) / N);
    float dc = density(rc, core);
    float full = smoothstep(0.8, 1.0, dc);

    for (int k = -1; k <= 1; k++) {
      float jj = floor(u) + float(k);
      // Not mod(): it divides by reciprocal and can land on S instead of 0,
      // which tears every dash crossing the seam where atan wraps.
      float cell = jj - S * floor((jj + 0.5) / S);
      vec4 h = hash42(vec2(ringId * 1.618 + salt, cell + salt * 3.1));
      vec4 h2 = hash42(vec2(cell * 0.73 - salt, ringId + 19.0));

      float keep;
      float hl;
      float hw;
      float cu = (h2.x - 0.5) * 0.6;
      float cv = (h.w - 0.5) * mix(uJitter, 0.35, dc);
      if (specks > 0.5) {
        float zone = smoothstep(core * 0.9, core + uSpread * 0.4, rc);
        keep = step(h.x, uSpecks * 0.22 * zone);
        hl = cellW * (0.06 + 0.3 * h.y * h.y);
        hw = cellH * (0.1 + 0.12 * h.z);
      } else {
        keep = step(h.x, mix(uPresence, 1.0, smoothstep(0.0, 0.55, dc)));
        hl = cellW * mix(uLenMin, uLenMax, h.y) * mix(0.42, 1.0, dc);
        hw = cellH * mix(uWidthMin, uWidthMax, h.z) * mix(0.6, 1.0, dc);
        // Full density: every dash fattens past its ring and stretches past its
        // neighbours, so the core reads as solid paper with a few nicks left.
        hw = mix(hw, cellH * (0.6 + 0.25 * h2.y), full);
        hl = mix(hl, cellW * (0.9 + 0.5 * h2.z), full);
      }
      // Never let a dash outgrow the 3x3 neighbourhood that draws it, or it
      // gets sliced flat where the search stops.
      hw = min(hw, cellH * (1.4 - abs(cv)) - aa);
      hl = max(min(hl, cellW * (1.4 - abs(cu)) - hw * (1.0 + abs(uTwist)) - aa), 0.0);
      if (keep < 0.5) continue;

      float y = (fv - cv) * cellH;
      // The twist shears cell space (u depends on log-radius), which would
      // skew every round cap into a slanted flat cut. Undo it locally.
      float x = (u - jj - 0.5 - cu) * cellW - uTwist * y;
      // Head leads in the direction of spin; the tail drags thinner behind it.
      float s = clamp(x, -hl, hl);
      float t = (s + hl) / max(2.0 * hl, 1e-5);
      float w = hw * mix(mix(uTaper, 1.0, full), 1.0, t);
      float sd = length(vec2(x - s, y)) - w;
      m = max(m, 1.0 - smoothstep(-aa, aa, sd));
    }
  }
  return m;
}

void main(){
  vec2 resCss = uRes / uDpr;
  vec2 css = gl_FragCoord.xy / uDpr;
  float minSide = min(resCss.x, resCss.y);
  vec2 p = (css - uCenter) / minSide;

  // The boil: every new drawing traces the same frame with a slightly
  // different hand.
  vec2 bq = p * 5.0;
  p += (vec2(vnoise(bq + uSeed), vnoise(bq - uSeed + 7.3)) - 0.5) * uBoil * 0.006;

  float r = max(length(p), 1e-4);
  float a = atan(p.y, p.x);
  float lr = log(r);
  float core = coreAt(a);
  float aa = 0.75 / (r * minSide);

  float m = dashes(uRings, floor(max(uSegments, 3.0)), lr, a, core, aa, uFlow, 0.0, 0.0);
  m = max(m, dashes(uRings * 1.9, floor(max(uSegments, 3.0) * 1.7), lr, a, core, aa, uFlow * 1.4, 41.0, 1.0));

  // The blown-out middle.
  float aaR = 0.9 / minSide;
  m = max(m, 1.0 - smoothstep(core * 0.78 - aaR, core * 0.78 + aaR, r));

  vec3 col = mix(uInkColor, uPaperColor, m);

  // Light bleeding out of the hole into the ink around it.
  float glow = exp(-max(r - core, 0.0) / max(uSpread * 0.45, 1e-3));
  col = mix(col, uPaperColor, uHalo * 0.22 * glow * (1.0 - m));

  vec2 vu = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - uVignette * smoothstep(0.3, 0.9, length(vu * vec2(uRes.x / uRes.y, 1.0)));
  col += (hash12(floor(css) + uSeed * 13.0 + fract(uTime) * 61.0) - 0.5) * uGrain;
  frag = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

// #region motion
/** "#f0a" / "#ff00aa" → [r, g, b] in 0..1. Anything unparsable is black. */
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "")
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0]
  const v = parseInt(h, 16)
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]
}

/**
 * Which drawing a moment belongs to. With `fps` above zero the clock is cut
 * into held frames, like cels shot on twos; at zero every frame is new.
 */
export function drawingIndex(t: number, fps: number, frame: number) {
  return fps > 0 ? Math.floor(t * fps) : frame
}

/** A per-drawing noise seed: different every drawing, same for the same one. */
export function boilSeed(index: number) {
  const f = index * 0.6180339887
  return (f - Math.floor(f)) * 64
}

/** Wrap a phase into [0, m) — exact for the negative side too. */
export function wrap(v: number, m: number) {
  return ((v % m) + m) % m
}

/** Ease `v` toward `target` at rate `k` per second. Never overshoots. */
export function ease(v: number, target: number, dt: number, k: number) {
  return v + (target - v) * (1 - Math.exp(-Math.max(dt, 0) * k))
}

/** The idle eye: drifts on incommensurate sines, a slow small lazy orbit. */
export function idleEye(t: number) {
  return [
    0.045 * Math.sin(t * 0.23) + 0.02 * Math.sin(t * 0.071 + 1.7),
    0.04 * Math.cos(t * 0.19) + 0.018 * Math.cos(t * 0.053 + 4.1),
  ]
}
// #endregion

export type CelVortexProps = {
  /**
   * Explicit height. The canvas fills this box, so it must be a definite
   * length — "100%" only works if every ancestor has one too.
   */
  height?: string
  /** A named palette + feel, layered over the defaults. */
  preset?: keyof typeof VORTEX_PRESETS
  /** Overrides layered over the preset. */
  params?: Partial<VortexParams>
  /** Pointer steers the eye; press surges; click sends a shock ring. */
  interactive?: boolean
  /** "scroll" keeps page scrolling on touch; "draw" takes the gesture. */
  touch?: "scroll" | "draw"
  /** Device-pixel-ratio cap. The shader is per-pixel, so 2 is plenty. */
  maxDpr?: number
  /** Content laid over the vortex. Pointer events pass through unless opted in. */
  children?: React.ReactNode
  className?: string
}

export default function CelVortex({
  height = "100svh",
  preset = "cobalt",
  params,
  interactive = true,
  touch = "scroll",
  maxDpr = 2,
  children,
  className = "",
}: CelVortexProps) {
  const rootRef = React.useRef<HTMLElement>(null)
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
  const P = React.useMemo<VortexParams>(
    () => ({ ...VORTEX_DEFAULTS, ...(VORTEX_PRESETS[preset] ?? {}), ...(params ?? {}) }),
    [preset, params],
  )
  // The loop reads through a ref, so tuning a value never restarts WebGL.
  const paramsRef = React.useRef(P)
  paramsRef.current = P
  const repaintRef = React.useRef<() => void>(() => {})

  // Reduced motion draws once — so a new preset has to ask for a new frame.
  React.useEffect(() => {
    repaintRef.current()
  }, [P])

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      powerPreference: "high-performance",
    })
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
        console.error("cel-vortex:", gl.getShaderInfoLog(s))
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
      console.error("cel-vortex:", gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      setFailed(true)
      return
    }

    const loc = (n: string) => gl.getUniformLocation(program, n)
    const tuned = UNIFORMS.map(([k, kind]) => [loc(uName(k)), k, kind] as const)
    const U = {
      res: loc("uRes"), dpr: loc("uDpr"), time: loc("uTime"), center: loc("uCenter"),
      flow: loc("uFlow"), spin: loc("uSpin"), surge: loc("uSurge"), surgeOpen: loc("uSurgeOpen"),
      seed: loc("uSeed"), pulse: loc("uPulse"),
    }
    const vao = gl.createVertexArray()

    // ---- sizing, from the element rather than the window --------------------
    let cssW = 1
    let cssH = 1
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, Math.max(maxDpr, 0.5))
      cssW = Math.max(canvas.clientWidth, 1)
      cssH = Math.max(canvas.clientHeight, 1)
      const w = Math.floor(cssW * dpr)
      const h = Math.floor(cssH * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      if (reduced) paint()
    }

    // ---- the clock ----------------------------------------------------------
    // Reduced motion freezes on a frame that is already well into the flow.
    const FROZEN = 9
    let flow = reduced ? FROZEN * VORTEX_DEFAULTS.inflow : 0
    let spin = reduced ? FROZEN * VORTEX_DEFAULTS.spin : 0
    let surge = 0
    let surgeTarget = 0
    let lastNow = performance.now()
    let clockT = reduced ? FROZEN : 0
    let frameNo = 0
    let lastDrawing = -1
    const held = { flow, spin, surge, t: clockT, cx: 0.5, cy: 0.5, seed: 0 }
    const pulses = new Float32Array(MAX_PULSES * 4)
    let pulseNext = 0

    // ---- the pointer --------------------------------------------------------
    let targetX = 0.5
    let targetY = 0.5
    let eyeX = paramsRef.current.centerX
    let eyeY = paramsRef.current.centerY
    let inside = false
    let lastTouched = -1e9

    const toUv = (e: PointerEvent): [number, number] => {
      const r = canvas.getBoundingClientRect()
      return [
        Math.min(Math.max((e.clientX - r.left) / Math.max(r.width, 1), 0), 1),
        Math.min(Math.max(1 - (e.clientY - r.top) / Math.max(r.height, 1), 0), 1),
      ]
    }
    const fromOverlay = (e: Event) =>
      !!(e.target as HTMLElement | null)?.closest("a,button,input,textarea,select,label,[role=button]")

    const onMove = (e: PointerEvent) => {
      if (!interactive) return
      ;[targetX, targetY] = toUv(e)
      inside = true
      lastTouched = performance.now() / 1000
    }
    const onLeave = () => {
      inside = false
      surgeTarget = 0
    }
    const pulse = (strength: number) => {
      pulses.set([held.t + (reduced ? -10 : 0), reduced ? 0 : strength, paramsRef.current.pulseSpeed, 0], pulseNext * 4)
      pulseNext = (pulseNext + 1) % MAX_PULSES
    }
    const onDown = (e: PointerEvent) => {
      if (!interactive || e.button > 0 || fromOverlay(e)) return
      ;[targetX, targetY] = toUv(e)
      inside = true
      lastTouched = performance.now() / 1000
      surgeTarget = 1
      pulse(1)
    }
    const onUp = () => {
      surgeTarget = 0
    }
    // Space or Enter, while the vortex itself has focus, is the same press.
    const onKeyDown = (e: KeyboardEvent) => {
      if (!interactive || e.target !== root || (e.key !== " " && e.key !== "Enter")) return
      e.preventDefault()
      if (!e.repeat) pulse(1)
      surgeTarget = 1
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") surgeTarget = 0
    }

    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("pointercancel", onLeave)
    window.addEventListener("pointerup", onUp)
    root.addEventListener("keydown", onKeyDown)
    root.addEventListener("keyup", onKeyUp)
    root.addEventListener("blur", onUp)

    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onRestored = () => setGeneration((g) => g + 1)
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)

    // ---- one frame ----------------------------------------------------------
    const paint = () => {
      const p = paramsRef.current
      const now = performance.now()
      // A stalled tab resumes where it left off rather than jumping ahead.
      const dt = reduced ? 0 : Math.min(Math.max((now - lastNow) / 1000, 0), 0.1) * p.speed
      lastNow = now
      clockT += dt
      frameNo++

      surge = reduced ? 0 : ease(surge, surgeTarget, dt, surgeTarget > surge ? 5 : 2.2)
      const boost = 1 + surge * (p.surgeBoost - 1)
      flow = wrap(flow + dt * p.inflow * boost, RING_WRAP)
      spin = wrap(spin + dt * p.spin * boost, SPIN_WRAP)

      // With no hand on it the eye drifts on its own, so it never sits dead.
      const idle = !inside || now / 1000 - lastTouched > 4
      const [ix, iy] = idleEye(clockT)
      const wantX = p.centerX + (idle ? ix : (targetX - p.centerX) * p.follow)
      const wantY = p.centerY + (idle ? iy : (targetY - p.centerY) * p.follow)
      eyeX = reduced ? p.centerX : ease(eyeX, wantX, dt, idle ? 1.2 : 4)
      eyeY = reduced ? p.centerY : ease(eyeY, wantY, dt, idle ? 1.2 : 4)

      // Only a new drawing picks up the new state; between drawings the cel is
      // held, exactly as it would be on film.
      const drawing = drawingIndex(clockT, p.fps, frameNo)
      if (drawing !== lastDrawing || reduced) {
        lastDrawing = drawing
        held.flow = flow
        held.spin = spin
        held.surge = surge
        held.t = clockT
        held.cx = eyeX
        held.cy = eyeY
        held.seed = p.fps > 0 ? boilSeed(drawing) : 0
      }

      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      for (const [l, key, kind] of tuned) {
        const v = p[key]
        if (kind === "c") gl.uniform3fv(l, hexToRgb(v as string))
        else gl.uniform1f(l, key === "boil" && p.fps <= 0 ? 0 : (v as number))
      }
      gl.uniform2f(U.res, canvas.width, canvas.height)
      gl.uniform1f(U.dpr, canvas.width / cssW)
      gl.uniform1f(U.time, held.t)
      gl.uniform2f(U.center, held.cx * cssW, held.cy * cssH)
      gl.uniform1f(U.flow, held.flow)
      gl.uniform1f(U.spin, held.spin)
      gl.uniform1f(U.surge, held.surge)
      gl.uniform1f(U.surgeOpen, p.surgeOpen)
      gl.uniform1f(U.seed, held.seed)
      gl.uniform4fv(U.pulse, pulses)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    repaintRef.current = () => {
      if (reduced) paint()
    }

    // ---- loop, paused whenever nobody can see it -----------------------------
    let raf = 0
    let visible = true
    const frame = () => {
      raf = 0
      paint()
      if (visible && !document.hidden) raf = requestAnimationFrame(frame)
    }
    const wake = () => {
      if (reduced || raf || !visible || document.hidden) return
      lastNow = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting)
      wake()
    })
    io.observe(root)
    document.addEventListener("visibilitychange", wake)

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    // Paint before the first rAF so nothing ever flashes an empty canvas.
    paint()
    if (reduced) {
      // Nothing moves; one drawing is the whole piece.
    } else {
      wake()
    }

    return () => {
      repaintRef.current = () => {}
      cancelAnimationFrame(raf)
      observer.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", wake)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("pointercancel", onLeave)
      window.removeEventListener("pointerup", onUp)
      root.removeEventListener("keydown", onKeyDown)
      root.removeEventListener("keyup", onKeyUp)
      root.removeEventListener("blur", onUp)
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
    }
  }, [interactive, reduced, generation, maxDpr])

  return (
    <section
      ref={rootRef}
      tabIndex={interactive ? 0 : undefined}
      className={
        "relative w-full overflow-hidden outline-none " +
        (interactive ? "cursor-grab active:cursor-grabbing " : "") +
        (touch === "draw" ? "touch-none " : "touch-pan-y ") +
        className
      }
      style={{ height, backgroundColor: P.inkColor }}
      aria-label={
        interactive
          ? "An inked vortex. Move to steer it, press and hold to surge it."
          : "An inked vortex spiralling into a white core"
      }
    >
      {failed ? (
        // No WebGL2: a still picture of the same tunnel beats a blank box.
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-conic-gradient(from 0deg at 50% 50%, " + P.paperColor + " 0deg 3deg, transparent 3deg 9deg)," +
              "radial-gradient(circle at 50% 50%, " + P.paperColor + " 0 18%, transparent 46%)," +
              P.inkColor,
          }}
        />
      ) : (
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      )}
      {children ? (
        <div className="pointer-events-none relative z-10 flex h-full w-full flex-col">{children}</div>
      ) : null}
    </section>
  )
}
