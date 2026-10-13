"use client"

import * as React from "react"

/**
 * Guilloché Enamel — an engine-turned silver plate under translucent enamel,
 * the way the dial of a fine watch is made, as a full-bleed surface.
 *
 * Every groove is real geometry computed per pixel: a snailed spiral round a
 * polished boss, a ring of barleycorn where two rose-engine passes cross, and
 * a field of flame-cut sunburst rays, divided by two polished beads. Each cut is a round-nosed scallop, so it
 * throws light like metal does: an anisotropic highlight running along the
 * tool marks, a dim studio in the walls that face it, and a glassy enamel
 * coat on top with its own soft gloss of the lamp. The enamel pools deeper in
 * the grooves and thins over the beads, which is what gives flinqué its colour.
 *
 * The pointer is the lamp. Press and hold to bring it down low, the way a
 * watchmaker rakes light across a dial. On load the rose engine cuts the
 * pattern into a bare silver blank from the centre out, then the enamel is
 * fired over it.
 *
 * Self-contained: raw WebGL2, React is the only import, no CSS file.
 */

export type GuillocheColors = {
  /** The enamel, as seen over polished silver. White is a clear lacquer. */
  enamel: string
  /** The metal under it. */
  metal: string
}

export const GUILLOCHE_PRESETS = {
  cobalt: { enamel: "#6a96f0", metal: "#e6e8ec" },
  forest: { enamel: "#4f8a6a", metal: "#e4e6ea" },
  salmon: { enamel: "#ffffff", metal: "#eaa48c" },
  argent: { enamel: "#ffffff", metal: "#d8dadd" },
} satisfies { [k: string]: GuillocheColors }

export type GuillochePreset = keyof typeof GUILLOCHE_PRESETS

export type GuillocheEnamelProps = {
  /**
   * Explicit height. The canvas fills this box, so it must be a definite
   * length. "100%" only works if every ancestor also has one.
   */
  height?: string
  /** Named finish. `colors` overrides either field on top of it. */
  preset?: GuillochePreset
  /** enamel / metal as hex (#rgb or #rrggbb). */
  colors?: { [K in keyof GuillocheColors]?: string }
  /** Where the rosette sits. "right" leaves the left side quiet for copy. */
  align?: "left" | "center" | "right"
  /** Size of the rosette. The groove pitch never changes, only the zones. */
  scale?: number
  /** Thickness of the enamel. 0 is bare metal, 1.6 is deep and inky. */
  depth?: number
  /** Brightness of the lamp. */
  light?: number
  /** Edge darkening, 0 to 1. */
  vignette?: number
  /** Cut the pattern into a mirror blank on mount. */
  intro?: boolean
  /** The pointer moves the lamp, press lowers it. Off, the lamp drifts. */
  interactive?: boolean
  /** Device-pixel-ratio cap. The shader supersamples, so 1.5 is plenty. */
  maxDpr?: number
  /** Rendered above the plate. */
  children?: React.ReactNode
  className?: string
}

// #region math
export function hexToRgb(hex: string) {
  let h = String(hex).trim().replace(/^#/, "")
  if (h.length === 3 || h.length === 4) {
    h = h
      .slice(0, 3)
      .split("")
      .map((c) => c + c)
      .join("")
  } else if (h.length === 8) {
    h = h.slice(0, 6)
  }
  if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0]
  const n = parseInt(h, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/** CSS rgba() from any accepted hex, for the no-WebGL fallback. */
export function rgba(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.round(c * 255))
  return "rgba(" + r + "," + g + "," + b + "," + alpha + ")"
}

/** sRGB hex to linear light, which is what the shader mixes in. */
export function hexToLinear(hex: string) {
  return hexToRgb(hex).map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
}

/** Rosette centre in shader units (canvas heights, origin at the middle). */
export function rosetteCenter(aspect: number, align: "left" | "center" | "right") {
  const off = Math.min(0.36, Math.max(0, (aspect - 0.8) * 0.38))
  return { x: align === "left" ? -off : align === "right" ? off : 0, y: aspect < 1 ? 0.04 : -0.03 }
}

/** The engine-turning schedule: 0 is a mirror blank, 1 is fully cut. */
export function cutProgress(elapsed: number, duration: number) {
  const t = Math.min(1, Math.max(0, elapsed / duration))
  // ease-in-out, so the tool starts and finishes like a machine, not a wipe
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
// #endregion

const INTRO_SECONDS = 2.1

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform vec3 uLight;      // lamp: xy in canvas heights from the centre, z height above the plate
uniform vec2 uCenter;     // rosette centre
uniform float uScale;     // rosette radius scale
uniform float uPitch;     // groove pitch multiplier, so cuts keep their size in CSS pixels
uniform float uCut;       // 0 mirror blank, 1 fully engine-turned
uniform vec3 uEnamel;     // linear
uniform vec3 uMetal;      // linear
uniform float uDepth;     // enamel thickness
uniform float uLamp;      // lamp brightness
uniform float uVignette;
uniform float uSamples;   // 4 on a 1x screen, 2 where pixels are already small or in software

out vec4 outColor;

const float TAU = 6.28318530718;
const float PI = 3.14159265359;
const float TAN_CUT = 0.36;     // wall slope at the cusp, about 20 degrees

struct Surf {
  vec2 g;      // height gradient
  vec2 t;      // groove direction, which is also the tool-mark direction
  float d;     // depth: 1 at the bottom of a cut, 0 on a ridge, below 0 on a raised bead
  float aT;    // roughness along the tool marks
  float aB;    // roughness across them
};

// The cutter is round-nosed, so each cut is a scallop: its slope runs
// straight from one wall to the other, and neighbouring cuts meet in a sharp
// cusp. x is the position across the cut, -1 at one cusp, 0 at the bottom.
float across(float f) { return 2.0 * f - 1.0; }

// Grooves finer than the pixel grid stop resolving: fade their facets out and
// let the roughness carry the averaged sheen instead, so they never alias.
float resolve(float cyclesPerUnit) {
  float cpp = cyclesPerUnit / uRes.y;
  return 1.0 - smoothstep(0.16, 0.4, cpp);
}

Surf cutAlong(float phi, vec2 grad, float roughT, float roughB) {
  Surf s;
  float gl = max(length(grad), 1e-4);
  vec2 n = grad / gl;
  float x = across(fract(phi));
  float k = resolve(gl);
  s.g = x * TAN_CUT * k * n;
  s.t = vec2(-n.y, n.x);
  s.d = (1.0 - x * x) * k;
  s.aT = roughT;
  s.aB = mix(0.55, roughB, k);
  return s;
}

Surf blank() {
  Surf s;
  s.g = vec2(0.0);
  s.t = vec2(1.0, 0.0);
  s.d = 0.0;
  s.aT = 0.03;
  s.aB = 0.03;
  return s;
}

// Where the cutting tool is right now, during the engine-turning intro.
float gTool = 0.0;

void toolAt(float dist, float c) {
  if (c > 0.0 && c < 1.0) gTool = max(gTool, exp(-dist * dist / 6e-6));
}

Surf surface(vec2 p) {
  gTool = 0.0;
  vec2 q = p - uCenter;
  float r = max(length(q), 1e-4);
  float th = atan(q.y, q.x);
  vec2 er = q / r;
  vec2 et = vec2(-er.y, er.x);

  float R0 = 0.23 * uScale;
  float R1 = 0.6 * uScale;
  float bead = 0.0062 * uPitch;

  // The cutter works outward from the centre: everything inside the front is
  // engine-turned and beaded, everything outside is still the polished blank.
  vec2 halfRes = vec2(0.5 * uRes.x / uRes.y, 0.5);
  float front = uCut * (length(abs(uCenter) + halfRes) + 0.02);
  if (uCut < 1.0) {
    toolAt(r - front, uCut);
    if (r > front) return blank();
  }

  // The boss at the centre, where a dial's hands would sit: a small polished
  // dome turned before any pattern was cut.
  float boss = 0.02 * uScale;
  if (r < boss) {
    Surf s;
    float x = r / boss;
    float y = sqrt(max(1.0 - x * x, 0.04));
    s.g = -er * (x / y) * 0.45;
    s.t = et;
    s.d = -1.0;
    s.aT = 0.025;
    s.aB = 0.03;
    return s;
  }

  // Polished beads between the zones: half-round and raised, with the fine
  // cusp the cutter leaves where each bead meets the field.
  for (int i = 0; i < 2; i++) {
    float Rk = i == 0 ? R0 : R1;
    float x = (r - Rk) / bead;
    if (abs(x) < 1.0) {
      Surf s;
      float y = sqrt(max(1.0 - x * x, 0.04));
      s.g = -er * (x / y) * 0.55;
      s.t = et;
      s.d = -0.8 * y;
      s.aT = 0.025;
      s.aB = 0.03;
      return s;
    }
    if (abs(x) < 1.45) {
      Surf s;
      s.g = er * sign(x) * 0.5;
      s.t = et;
      s.d = 1.5;
      s.aT = 0.2;
      s.aB = 0.45;
      return s;
    }
  }

  if (r < R0) {
    // Colimaçon: a single spiral cut from the centre out, the snailing on
    // the back of a movement. One continuous groove, so it never seams.
    float P = 0.0062 * uPitch;
    float phi = r / P + th / TAU;
    vec2 grad = er / P + et / (TAU * r);
    return cutAlong(phi, grad, 0.04, 0.12);
  }

  if (r < R1) {
    // Grain d'orge (barleycorn): the rose engine cuts every ring twice, the
    // second pass half a lobe out of phase. Where the two cuts cross they
    // leave rows of grains; the deeper cut wins at every point.
    float P = 0.0062 * uPitch;
    float N = 48.0;
    float A = 0.0034 * uPitch;
    float sn = sin(N * th);
    float lean = A * cos(N * th) * N / r;
    Surf a = cutAlong((r + A * sn) / P, (er + et * lean) / P, 0.05, 0.3);
    Surf b = cutAlong((r - A * sn) / P, (er - et * lean) / P, 0.05, 0.3);
    if (a.d > b.d) return a;
    return b;
  }

  // Flame-cut sunburst: rays from the centre that sway as they run out, too
  // fine to count, so they read as satin with a curved flare of light in it.
  float N = floor(900.0 / uPitch);
  float b = 2.6;
  float k = 8.0 / uScale;
  return cutAlong(N * th / TAU + b * sin(k * r), et * (N / (TAU * r)) + er * (b * k * cos(k * r)), 0.05, 0.36);
}

// The room the plate sits in: dark, with a big diffuser panel high on the
// left, a hard strip light along its edge, and a faint warm bounce from the
// lower right. Facets that face them pick them up; the rest stay deep.
vec3 env(vec3 R) {
  vec3 pd = normalize(vec3(-0.5, 0.38, 1.0));
  float panel = smoothstep(0.86, 0.98, dot(R, pd));
  vec3 sd = normalize(vec3(-0.78, 0.2, 1.0));
  float strip = smoothstep(0.955, 0.99, dot(R, sd));
  vec3 td = normalize(vec3(0.05, 0.62, 1.0));
  float top = smoothstep(0.93, 0.99, dot(R, td));
  vec3 bd = normalize(vec3(0.7, -0.45, 1.0));
  float bounce = smoothstep(0.82, 0.99, dot(R, bd));
  return vec3(0.03) + vec3(0.05, 0.052, 0.056) * clamp(0.5 - 0.6 * R.x + 0.4 * R.y, 0.0, 1.2)
    + vec3(0.85, 0.9, 1.0) * panel * 0.1
    + vec3(1.0) * strip * 1.3
    + vec3(0.9, 0.94, 1.0) * top * 0.28
    + vec3(1.0, 0.92, 0.82) * bounce * 0.1;
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// The lamp is a tall softbox hanging flat above the plate. Follow a reflected
// ray up to it: a feathered elliptical pool, no corners, spread wider by
// however rough the surface that reflects it is.
float softbox(vec3 P3, vec3 R, float rough) {
  if (R.z <= 0.0) return 0.0;
  float t = (uLight.z - P3.z) / R.z;
  vec2 hit = P3.xy + R.xy * t - uLight.xy;
  float spread = 1.0 + rough * t * 6.0;
  vec2 u = hit / (vec2(0.1, 0.22) * spread);
  float d = length(u);
  // a defined oval with a feathered rim, hot toward its middle
  return (1.0 - smoothstep(0.7, 1.0, d)) * (0.6 + 0.4 * exp(-d * d * 3.0)) / spread;
}

vec3 shade(vec2 p) {
  Surf s = surface(p);
  vec3 P3 = vec3(p, 0.0);
  vec3 N = normalize(vec3(-s.g, 1.0));
  vec3 cam = vec3(0.0, 0.0, 2.6);
  vec3 V = normalize(cam - P3);
  vec3 Lv = uLight - P3;
  float dist2 = dot(Lv, Lv);
  vec3 L = Lv * inversesqrt(dist2);
  vec3 H = normalize(L + V);

  vec3 T = normalize(vec3(s.t, 0.0) - N * dot(N, vec3(s.t, 0.0)));
  vec3 B = cross(N, T);

  // Ward anisotropic highlight, widened a little for the size of the lamp.
  float aT = s.aT + 0.03;
  float aB = s.aB + 0.03;
  float NL = max(dot(N, L), 0.0);
  float NV = max(dot(N, V), 1e-3);
  float hn = max(dot(H, N), 1e-3);
  float ht = dot(H, T) / aT;
  float hb = dot(H, B) / aB;
  float ward = exp(-(ht * ht + hb * hb) / (hn * hn)) / (4.0 * PI * aT * aB * sqrt(max(NL * NV, 1e-4))) * NL;
  vec3 lampCol = vec3(1.0, 0.96, 0.9);
  vec3 key = lampCol * ward * uLamp * 1.7 / (0.3 + dist2);
  // Soft-cap the lamp so a low lamp rakes a streak instead of blowing out.
  key *= 3.5 / (3.5 + max(key.r, max(key.g, key.b)));
  vec3 R = reflect(-V, N);
  // Polished metal (the blank, the beads) is a mirror: it shows the softbox
  // itself, sharp, instead of a lobe.
  float polish = 1.0 - smoothstep(0.045, 0.07, max(s.aT, s.aB));
  key = mix(key, lampCol * softbox(P3, R, s.aB) * uLamp * 3.2, polish);

  // The room, blurred along the direction the tool marks scatter it.
  vec3 room = (env(R) + env(normalize(R + B * aB)) + env(normalize(R - B * aB))) / 3.0;

  // Polished parts (beads, boss) mirror the bright ceiling on their upper
  // face and the dark room below, which is what makes a bead read as chrome.
  room += vec3(0.55, 0.57, 0.6) * polish * smoothstep(-0.05, 0.45, R.y) * smoothstep(0.75, 0.97, R.z + 0.2);
  vec3 metal = uMetal * (key + room);

  // Through the enamel: it pools in the cuts and thins over the beads. The
  // colour is defined as one pass over polished metal, so thickness is an
  // exponent on it.
  float thick = uDepth * (1.0 + 1.3 * s.d);
  vec3 col = metal * pow(max(uEnamel, vec3(1e-3)), vec3(max(thick, 0.0)));
  // a touch of light scattered inside the glass
  col += uEnamel * uDepth * 0.006 * (1.0 + s.d);

  // The fired enamel is glassy and almost flat (a faint orange peel), so it
  // carries a soft gloss of the lamp on top of everything under it.
  if (uDepth > 0.0) {
    vec2 peel = vec2(noise(p * 11.0), noise(p * 11.0 + 7.3)) - 0.5;
    vec3 Rc = reflect(-V, normalize(vec3(peel * 0.01, 1.0)));
    float F = 0.04 + 0.96 * pow(1.0 - V.z, 5.0);
    col += lampCol * softbox(P3, Rc, 0.0) * F * uLamp * 3.2 * min(uDepth, 1.0);
  }
  // the fresh burr thrown up by the cutter
  col += vec3(1.0, 0.97, 0.92) * gTool * 0.9;
  return col;
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  float px = 1.0 / uRes.y;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) * px;

  // Rotated-grid supersampling: the cusps between cuts are hard-edged by
  // design. Dense screens get two samples; their pixels are already small.
  vec3 col = shade(uv + px * vec2(0.125, 0.375));
  if (uSamples > 1.5) col += shade(uv + px * vec2(-0.125, -0.375));
  if (uSamples > 2.5) {
    col += shade(uv + px * vec2(-0.375, 0.125)) + shade(uv + px * vec2(0.375, -0.125));
  }
  col /= uSamples;

  float vig = smoothstep(1.35, 0.2, length(uv * vec2(0.8, 1.0)));
  col *= mix(1.0, vig, uVignette);

  // A photographic shoulder: the hottest glints bleach toward the lamp's
  // white, the way they do on film, instead of clipping as flat colour.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3(lum) * vec3(1.0, 0.98, 0.95), smoothstep(0.25, 1.6, lum) * 0.7);
  col = aces(col * 1.35);
  col = pow(col, vec3(1.0 / 2.2));
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`

function compile(gl: WebGL2RenderingContext, vert: string, frag: string) {
  const program = gl.createProgram()
  if (!program) return null
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vert],
    [gl.FRAGMENT_SHADER, frag],
  ] as const) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("guilloche-enamel:", gl.getShaderInfoLog(shader))
      return null
    }
    gl.attachShader(program, shader)
    gl.deleteShader(shader)
  }
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("guilloche-enamel:", gl.getProgramInfoLog(program))
    return null
  }
  return program
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return reduced
}

export default function GuillocheEnamel({
  height = "100svh",
  preset = "cobalt",
  colors,
  align = "right",
  scale = 1,
  depth = 1,
  light = 1,
  vignette = 0.55,
  intro = true,
  interactive = true,
  maxDpr = 1.5,
  children,
  className = "",
}: GuillocheEnamelProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const kickRef = React.useRef((() => {}) as () => void)
  const reduced = usePrefersReducedMotion()
  const [generation, setGeneration] = React.useState(0)
  const [failed, setFailed] = React.useState(false)

  const finish = { ...(GUILLOCHE_PRESETS[preset] ?? GUILLOCHE_PRESETS.cobalt), ...colors }

  const params = {
    enamel: hexToLinear(finish.enamel),
    metal: hexToLinear(finish.metal),
    align,
    scale,
    depth,
    light,
    vignette,
  }
  const paramsRef = React.useRef(params)
  paramsRef.current = params

  const paramKey = JSON.stringify(params)
  React.useEffect(() => {
    kickRef.current()
  }, [paramKey])

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
    const program = compile(gl, VERT, FRAG)
    if (!program) {
      setFailed(true)
      return
    }
    const vao = gl.createVertexArray()
    // A software rasteriser (SwiftShader, llvmpipe: no GPU, or a capture
    // sandbox) gets two samples per pixel so it still animates.
    const info = gl.getExtension("WEBGL_debug_renderer_info")
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
    const software = /swiftshader|llvmpipe|software/i.test(renderer)

    const u = (name: string) => gl.getUniformLocation(program, name)
    const loc = {
      res: u("uRes"),
      light: u("uLight"),
      center: u("uCenter"),
      scale: u("uScale"),
      pitch: u("uPitch"),
      cut: u("uCut"),
      enamel: u("uEnamel"),
      metal: u("uMetal"),
      depth: u("uDepth"),
      lamp: u("uLamp"),
      vignette: u("uVignette"),
      samples: u("uSamples"),
    }

    // Lamp state in shader units. It rests up and to the left of the rosette,
    // where the rays throw their longest flare.
    const HIGH = 0.6
    const LOW = 0.4
    const lamp = { x: 0, y: 0.2, z: HIGH }
    const target = { x: 0, y: 0.2, z: HIGH }
    let steering = false
    let placed = false
    let clock = 0
    // The intro runs on the wall clock from the first frame, so a slow GPU
    // shows it choppier but never longer.
    let cutStart = intro && !reduced ? -1 : -Infinity
    let last = 0
    let raf = 0
    let visible = true
    // The finish on screen eases toward the requested one, so switching
    // presets reads as the plate changing, not a cut.
    const shown = { enamel: paramsRef.current.enamel.slice(), metal: paramsRef.current.metal.slice() }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, Math.max(0.5, maxDpr))
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    const rest = (aspect: number) => {
      const c = rosetteCenter(aspect, paramsRef.current.align)
      return { x: c.x - 0.34 * Math.min(1, aspect), y: c.y + 0.26 }
    }

    let lastRender = 0
    const draw = (now: number) => {
      raf = 0
      // Once the intro is done and nobody is steering, the lamp only drifts:
      // 20 fps is plenty for that and cuts the GPU's work by two thirds.
      if (!reduced && !steering && lastRender && now - lastRender < 48 && now - cutStart > INTRO_SECONDS * 1000 + 700) {
        raf = requestAnimationFrame(draw)
        return
      }
      lastRender = now
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016
      last = now
      resize()
      const P = paramsRef.current
      const aspect = canvas.width / canvas.height
      const home = rest(aspect)

      if (!placed) {
        lamp.x = target.x = home.x
        lamp.y = target.y = home.y
        placed = true
      }

      if (reduced) {
        if (!steering) {
          target.x = home.x
          target.y = home.y
        }
        lamp.x = target.x
        lamp.y = target.y
        lamp.z = target.z
      } else {
        clock += dt
        // Nobody holding the lamp: it drifts slowly around its resting place.
        if (!steering) {
          target.x = home.x + Math.sin(clock * 0.23) * 0.22 * Math.min(aspect, 1.6)
          target.y = home.y + Math.sin(clock * 0.17 + 1.1) * 0.14
        }
        const k = 1 - Math.exp(-dt * (steering ? 6 : 1.4))
        lamp.x += (target.x - lamp.x) * k
        lamp.y += (target.y - lamp.y) * k
        lamp.z += (target.z - lamp.z) * (1 - Math.exp(-dt * 5))
      }
      const fade = reduced ? 1 : 1 - Math.exp(-dt * 12)
      for (let i = 0; i < 3; i++) {
        shown.enamel[i] += (P.enamel[i] - shown.enamel[i]) * fade
        shown.metal[i] += (P.metal[i] - shown.metal[i]) * fade
      }

      const c = rosetteCenter(aspect, P.align)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.uniform2f(loc.res, canvas.width, canvas.height)
      gl.uniform3f(loc.light, lamp.x, lamp.y, lamp.z)
      gl.uniform2f(loc.center, c.x, c.y)
      gl.uniform1f(loc.scale, P.scale * Math.min(1, Math.max(0.66, aspect * 0.95)))
      if (cutStart === -1) cutStart = now
      // Tuned at 900 CSS px tall; a shorter box keeps the same cut size.
      gl.uniform1f(loc.pitch, Math.min(3, Math.max(0.7, 900 / Math.max(1, canvas.clientHeight))))
      gl.uniform1f(loc.cut, cutProgress((now - cutStart) / 1000, INTRO_SECONDS))
      gl.uniform3fv(loc.enamel, shown.enamel)
      gl.uniform3fv(loc.metal, shown.metal)
      // Cut the bare silver first, then fire the enamel in over 0.6 s.
      const fired = Math.min(1, Math.max(0, ((now - cutStart) / 1000 - INTRO_SECONDS * 0.9) / 0.6))
      gl.uniform1f(loc.depth, P.depth * fired * fired * (3 - 2 * fired))
      gl.uniform1f(loc.lamp, P.light)
      gl.uniform1f(loc.vignette, P.vignette)
      gl.uniform1f(loc.samples, software ? 2 : canvas.width / Math.max(1, canvas.clientWidth) > 1.05 ? 2 : 4)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindVertexArray(null)

      if (!reduced && visible) raf = requestAnimationFrame(draw)
    }

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw)
    }
    kickRef.current = kick
    kick()

    const resizeObserver = new ResizeObserver(kick)
    resizeObserver.observe(canvas)

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) {
        last = 0
        kick()
      }
    })
    visibility.observe(root)

    const toShader = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const h = rect.height || 1
      return {
        x: (e.clientX - rect.left - rect.width / 2) / h,
        y: -(e.clientY - rect.top - rect.height / 2) / h,
      }
    }
    const onMove = (e: PointerEvent) => {
      if (!interactive) return
      // A finger only steers while it is down; a mouse steers on hover.
      if (e.pointerType !== "mouse" && e.buttons === 0) return
      const p = toShader(e)
      target.x = p.x
      target.y = p.y
      steering = true
      if (reduced) kick()
    }
    const onDown = (e: PointerEvent) => {
      if (!interactive) return
      const p = toShader(e)
      target.x = p.x
      target.y = p.y
      target.z = LOW
      steering = true
      kick()
    }
    const onUp = (e: PointerEvent) => {
      target.z = HIGH
      if (e.pointerType !== "mouse") steering = false
      kick()
    }
    const onLeave = () => {
      target.z = HIGH
      steering = false
      kick()
    }

    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onRestored = () => setGeneration((g) => g + 1)

    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointerup", onUp)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("pointercancel", onLeave)
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)

    return () => {
      cancelAnimationFrame(raf)
      kickRef.current = () => {}
      resizeObserver.disconnect()
      visibility.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("pointercancel", onLeave)
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      gl.deleteProgram(program)
      gl.deleteVertexArray(vao)
    }
  }, [interactive, reduced, generation, maxDpr, intro])

  return (
    <div
      ref={rootRef}
      className={"relative w-full overflow-hidden " + className}
      style={{ height, background: "#07090d", touchAction: "pan-y" }}
    >
      {failed ? (
        // No WebGL2: a still of the plate's colour, lit from the same corner.
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "repeating-conic-gradient(from 0deg at 68% 52%, rgba(255,255,255,0.05) 0deg 0.4deg, rgba(0,0,0,0.05) 0.4deg 0.8deg), " +
              "radial-gradient(ellipse 55% 45% at 32% 28%, " + rgba(finish.enamel, 0.66) + ", transparent 70%), " +
              "radial-gradient(circle at 68% 52%, " + rgba(finish.metal, 0.33) + ", #07090d 80%)",
          }}
        />
      ) : (
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      )}
      {children != null && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}
