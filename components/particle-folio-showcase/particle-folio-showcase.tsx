"use client"

import * as React from "react"

/**
 * Particle Folio Showcase — a portfolio-directory promo laid out on a sunlit
 * cutting mat, with desk clutter around the edges.
 *
 * Top: a browser window showing the directory's grid of curated portfolios.
 * Below: a fan of three portfolio cards. Stepping the carousel dissolves the
 * centre card's cover into sand-like particles that blow off on a breeze and
 * settle back as the next cover, the same particles changing colour in flight.
 *
 * How the dissolve stays seamless: both covers are painted once into
 * device-resolution pixel buffers. Each frame starts from the outgoing cover,
 * clears the cells whose particle has left, pastes the incoming cover into the
 * cells whose particle has landed, and draws the particles still in the air.
 * The first frame is the old cover pixel-for-pixel and the last frame is the new
 * one, so the swap to the real <img> on either side never shows.
 *
 * The mat is the shader from sunlit-cutting-mat, copied in rather than
 * imported because 21st ships one file per component.
 *
 * Self-contained: raw WebGL2 + canvas 2D, React is the only import.
 */

export interface FolioCompany {
  /** Shown as a tooltip and to screen readers. */
  name: string
  /** Badge fill, any CSS colour. */
  color?: string
  /** Badge text. Defaults to the first two letters of `name`. */
  initials?: string
}

export interface FolioItem {
  /** Cover image. Must be same-origin, a data: URL, or served with CORS for the dissolve; otherwise it crossfades. */
  src: string
  alt?: string
  /** Designer's name. */
  name: string
  country?: string
  /** e.g. "Product Designer". */
  role?: string
  /** e.g. "Interactive". Shown after the role. */
  style?: string
  /** e.g. "2 years". */
  experience?: string
  /** Avatar fill, any CSS colour. */
  accent?: string
  companies?: FolioCompany[]
}

export interface ParticleFolioShowcaseProps {
  items: FolioItem[]
  /** Big headline above the browser window. */
  heading?: string
  /** The three hand-placed notes. */
  captions?: { showcase?: string; details?: string; companies?: string }
  /** Heading inside the browser window. */
  pageTitle?: string
  /** Tabs in the browser window's nav; the first reads as active. */
  tabs?: string[]
  /** Filter chips under the browser heading. */
  filters?: string[]
  /** Primary and secondary nav buttons. */
  ctaLabel?: string
  loginLabel?: string
  /** Fake address in the browser bar. */
  url?: string
  /** Index shown first. */
  initialIndex?: number
  /** Advance every n ms. 0 turns it off. Pauses on hover and focus. */
  autoplay?: number
  /** Dissolve length in ms. */
  duration?: number
  /** Particle size in CSS px. Smaller is finer sand and more work per frame. */
  particleSize?: number
  /** Fired with the new index whenever the carousel moves. */
  onChange?: (index: number) => void
  /** Mat colour, #rrggbb. */
  matColor?: string
  /** Sunlight colour, #rrggbb. */
  sunColor?: string
  /** Sunlight strength. 0 overcast, 1.6 harsh noon. */
  intensity?: number
  /** Light animation speed. 0 freezes it. */
  speed?: number
  /** Draw the desk clutter (scissors, clips, paper balls…). */
  showProps?: boolean
  /** Minimum root height. A definite length — never a percentage. */
  height?: string
  className?: string
}

/* ------------------------------------------------------------------------ */
/* Pure helpers — lifted out and executed by tests/particle-folio-showcase   */
/* ------------------------------------------------------------------------ */

// #region particles
/** Wrap any integer into 0..n-1. */
export function wrapIndex(i: number, n: number) {
  if (n <= 0) return 0
  return ((i % n) + n) % n
}

export function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function smoothstep(a: number, b: number, v: number) {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** Source crop that fills dw×dh from an iw×ih image, like object-fit: cover. */
export function coverCrop(iw: number, ih: number, dw: number, dh: number) {
  if (iw <= 0 || ih <= 0 || dw <= 0 || dh <= 0) return { sx: 0, sy: 0, sw: Math.max(0, iw), sh: Math.max(0, ih) }
  const s = Math.max(dw / iw, dh / ih)
  const sw = dw / s
  const sh = dh / s
  return { sx: (iw - sw) / 2, sy: (ih - sh) / 2, sw, sh }
}

/** Deterministic 0..1 generator, so the dissolve looks the same every time. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Each particle spends this share of the timeline in the air. */
export const FLIGHT = 0.42

/**
 * When a particle at (x, y) in a w×h cover lifts off, as a share of the
 * timeline. The wind blows from the left, so the left edge goes first; a
 * little noise keeps the front ragged. Always within 0..1-FLIGHT, so every
 * particle has landed by t = 1.
 */
export function liftOff(x: number, y: number, w: number, h: number, r: number) {
  const nx = w > 0 ? clamp01(x / w) : 0
  const ny = h > 0 ? clamp01(y / h) : 0
  const d = 0.5 * (0.8 * nx + 0.2 * (1 - ny)) + 0.08 * clamp01(r)
  return Math.min(1 - FLIGHT, Math.max(0, d))
}

/** Offset from home at flight progress u (0..1) along a closed cubic loop. */
export function flightOffset(u: number, ox1: number, oy1: number, ox2: number, oy2: number) {
  const e = easeInOutCubic(clamp01(u))
  const a = 3 * (1 - e) * (1 - e) * e
  const b = 3 * (1 - e) * e * e
  return { x: a * ox1 + b * ox2, y: a * oy1 + b * oy2 }
}

/** Two-letter badge text from a company name. */
export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
// #endregion particles

/* ------------------------------------------------------------------------ */
/* The mat — vendored from components/sunlit-cutting-mat                     */
/* ------------------------------------------------------------------------ */

function fitGrid(span: number, unit: number) {
  const count = Math.max(1, Math.round(span / Math.max(4, unit)))
  return { count, step: span / count }
}

function labelEvery(step: number) {
  return step >= 22 ? 1 : step >= 11 ? 2 : 5
}

function borderFor(unit: number) {
  return Math.min(30, Math.max(16, Math.round(unit * 0.72)))
}

function hexToLinear(hex: string) {
  let h = hex.trim().replace("#", "")
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0]
  return [0, 2, 4].map((i) => Math.pow(parseInt(h.slice(i, i + 2), 16) / 255, 2.2))
}

function drawMat(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, unit: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.globalCompositeOperation = "source-over"
  ctx.globalAlpha = 1
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = "lighter"

  const b = borderFor(unit)
  const iw = w - 2 * b
  const ih = h - 2 * b
  if (iw <= 0 || ih <= 0) return

  ctx.fillStyle = "#0f0"
  ctx.fillRect(0, 0, w, b)
  ctx.fillRect(0, h - b, w, b)
  ctx.fillRect(0, b, b, ih)
  ctx.fillRect(w - b, b, b, ih)

  const gx = fitGrid(iw, unit)
  const gy = fitGrid(ih, unit)
  const X = (i: number) => b + i * gx.step
  const Y = (j: number) => h - b - j * gy.step
  const snap = (v: number, lw: number) => (Math.round(v * dpr) + ((lw * dpr) % 2) / 2) / dpr

  ctx.strokeStyle = "#f00"
  ctx.fillStyle = "#f00"
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  }

  for (const major of [false, true]) {
    ctx.lineWidth = major ? 2 : 1
    ctx.globalAlpha = major ? 0.92 : 0.2
    for (let i = 0; i <= gx.count; i++) {
      if ((i % 5 === 0 || i === gx.count) !== major) continue
      const x = snap(X(i), ctx.lineWidth)
      line(x, b, x, h - b)
    }
    for (let j = 0; j <= gy.count; j++) {
      if ((j % 5 === 0 || j === gy.count) !== major) continue
      const y = snap(Y(j), ctx.lineWidth)
      line(b, y, w - b, y)
    }
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(b, b, iw, ih)
  ctx.clip()
  ctx.lineWidth = 1.25
  ctx.globalAlpha = 0.85
  const n = Math.max(gx.count, gy.count)
  line(X(0), Y(0), X(n), Y(n))
  ctx.restore()

  const every = labelEvery(Math.min(gx.step, gy.step))
  ctx.lineWidth = 1
  ctx.font = "500 " + Math.round(b * 0.36) + "px ui-sans-serif, system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  const mid = b * 0.42
  for (let i = 0; i <= gx.count; i++) {
    const x = snap(X(i), 1)
    const len = b * (i % 5 === 0 ? 0.36 : 0.2)
    ctx.globalAlpha = 0.9
    line(x, b, x, b - len)
    line(x, h - b, x, h - b + len)
    if (i % every === 0) {
      ctx.globalAlpha = 0.8
      ctx.fillText(String(i), X(i), mid)
      ctx.fillText(String(i), X(i), h - mid)
    }
  }
  for (let j = 0; j <= gy.count; j++) {
    const y = snap(Y(j), 1)
    const len = b * (j % 5 === 0 ? 0.36 : 0.2)
    ctx.globalAlpha = 0.9
    line(b, y, b - len, y)
    line(w - b, y, w - b + len, y)
    if (j % every === 0) {
      ctx.globalAlpha = 0.8
      ctx.fillText(String(j), mid, Y(j))
      ctx.fillText(String(j), w - mid, Y(j))
    }
  }
  ctx.globalAlpha = 1
}

const VERTEX_SRC = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAGMENT_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uInk;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uMat;
uniform vec3 uSun;
uniform float uIntensity;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s / 0.9375;
}

float sunlight(vec2 p, float t) {
  float a = -0.72 + 0.03 * sin(t * 0.19) + 0.015 * sin(t * 0.47 + 1.3);
  vec2 dir = vec2(cos(a), sin(a));
  vec2 nrm = vec2(-dir.y, dir.x);
  float along = dot(p, dir);
  float across = dot(p, nrm);
  float pen = 0.55 + 0.45 * noise(vec2(along * 0.9 + 4.0, t * 0.03));
  float s = across * 3.1 + 0.25 * sin(t * 0.11) + t * 0.012;
  float band = sin(6.2831853 * s) + 0.45 * sin(6.2831853 * s * 0.43 + 1.7);
  float slats = smoothstep(-pen, pen, band + 0.15);
  vec2 wind = vec2(t * 0.03 + 0.05 * sin(t * 0.37), 0.04 * sin(t * 0.23) + 0.02 * sin(t * 0.83));
  float f = fbm(p * 1.6 + wind) * 0.7 + fbm(p * 2.8 - wind * 1.4 + 9.0) * 0.3;
  float leaves = mix(0.3, 1.0, smoothstep(0.36, 0.6, f));
  float pool = 0.45 + 0.55 * smoothstep(-1.1, 0.7, dot(p, vec2(-0.55, 0.83)) + 0.12 * sin(t * 0.05));
  return slats * leaves * pool;
}

void main() {
  vec2 frag = vUv * uResolution;
  float m = min(uResolution.x, uResolution.y);
  vec2 p = (frag - 0.5 * uResolution) / m;
  float t = uTime;

  vec2 texel = 1.0 / uResolution;
  vec4 ink = texture(uInk, vUv);
  float glow = 0.25 * (texture(uInk, vUv + vec2(2.0, 0.0) * texel).r
                     + texture(uInk, vUv - vec2(2.0, 0.0) * texel).r
                     + texture(uInk, vUv + vec2(0.0, 2.0) * texel).r
                     + texture(uInk, vUv - vec2(0.0, 2.0) * texel).r);

  float grain = hash(floor(frag)) - 0.5;
  float mottle = fbm(p * 5.0 + 3.1) - 0.5;
  vec3 mat = uMat * (1.0 + grain * 0.06 + mottle * 0.14);
  mat *= mix(1.0, 0.6, ink.g);
  vec3 albedo = mat;

  float L = sunlight(p, t) * uIntensity;

  vec3 sky = vec3(0.5, 0.66, 0.74);
  vec3 col = albedo * (sky * 0.95 + uSun * L * 1.3);
  col += uMat * uSun * vec3(0.9, 1.15, 0.6) * L * 0.55;
  col = mix(col, vec3(0.78, 0.85, 0.82) + uSun * L * 0.5, ink.r * 0.92);
  col += vec3(0.8) * glow * (0.05 + 0.12 * L);

  col = 1.0 - exp(-col * 1.2);
  vec2 v = vUv - 0.5;
  col *= 1.0 - 0.35 * dot(v, v);
  col = pow(col, vec3(1.0 / 2.2));
  col += (hash(frag + fract(t) * 91.7) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}`

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const h = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", h)
    return () => mq.removeEventListener("change", h)
  }, [])
  return reduced
}

interface MatProps {
  color: string
  sunColor: string
  intensity: number
  speed: number
  reduced: boolean
  onFail: () => void
}

/** The sunlit mat, filling its positioned parent. */
function CuttingMat({ color, sunColor, intensity, speed, reduced, onFail }: MatProps) {
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const [generation, setGeneration] = React.useState(0)
  const cfg = React.useRef({ color, sunColor, intensity, speed })
  cfg.current = { color, sunColor, intensity, speed }
  const failRef = React.useRef(onFail)
  failRef.current = onFail
  const UNIT = 32

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false })
    const ink2d = document.createElement("canvas")
    const ctx = ink2d.getContext("2d")
    if (!gl || !ctx) {
      failRef.current()
      return
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC)
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC)
    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (!gl.isContextLost()) failRef.current()
      gl.deleteProgram(program)
      return
    }
    gl.useProgram(program)

    const vao = gl.createVertexArray()
    const buffer = gl.createBuffer()
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, "aPos")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    const u = (name: string) => gl.getUniformLocation(program, name)
    const uInk = u("uInk")
    const uResolution = u("uResolution")
    const uTime = u("uTime")
    const uMat = u("uMat")
    const uSun = u("uSun")
    const uIntensity = u("uIntensity")
    gl.uniform1i(uInk, 0)

    let dirty = true
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, canvas.clientWidth)
      const h = Math.max(1, canvas.clientHeight)
      canvas.width = ink2d.width = Math.round(w * dpr)
      canvas.height = ink2d.height = Math.round(h * dpr)
      drawMat(ctx, w, h, dpr, UNIT)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ink2d)
      gl.viewport(0, 0, canvas.width, canvas.height)
      dirty = false
    }

    const render = (time: number) => {
      if (dirty) resize()
      const c = cfg.current
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform1f(uTime, time)
      gl.uniform3fv(uMat, hexToLinear(c.color))
      gl.uniform3fv(uSun, hexToLinear(c.sunColor))
      gl.uniform1f(uIntensity, c.intensity)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const T0 = 40
    let raf = 0
    let sim = T0
    let last = performance.now()
    const frame = (now: number) => {
      sim += Math.min(0.1, (now - last) / 1000) * cfg.current.speed
      last = now
      render(sim)
      raf = requestAnimationFrame(frame)
    }

    const observer = new ResizeObserver(() => {
      dirty = true
      if (reduced) render(T0)
    })
    observer.observe(canvas)

    if (reduced) render(T0)
    else raf = requestAnimationFrame(frame)

    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
    }
    const onRestored = () => setGeneration((g) => g + 1)
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
    }
  }, [reduced, generation])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", display: "block" }}
    />
  )
}

/* ------------------------------------------------------------------------ */
/* Desk clutter — inline SVG, decorative                                     */
/* ------------------------------------------------------------------------ */

/** A crumpled ball of paper: a lumpy outline cut into shaded facets. */
function PaperBall({ seed, size }: { seed: number; size: number }) {
  const shapes = React.useMemo(() => {
    const rnd = mulberry32(seed)
    const n = 13
    const pts: [number, number][] = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.3
      const r = 44 * (0.8 + rnd() * 0.2)
      pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r])
    }
    const inner: [number, number][] = []
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rnd() * 0.8
      const r = 12 + rnd() * 16
      inner.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r])
    }
    const tones = ["#fbfbf8", "#efefea", "#e2e2dc", "#d3d3cc", "#f6f6f2", "#c7c7c0"]
    const facets: { d: string; fill: string }[] = []
    for (let i = 0; i < n; i++) {
      const p = pts[i]
      const q = pts[(i + 1) % n]
      const c = inner[Math.floor((i / n) * 5)]
      // light comes from the top-left, so facets facing that way are brighter
      const mx = (p[0] + q[0]) / 2 - 50
      const my = (p[1] + q[1]) / 2 - 50
      const lit = (-mx - my) / 62
      const k = Math.max(0, Math.min(tones.length - 1, Math.round(2.5 - lit * 2.5 + (rnd() - 0.5) * 2)))
      facets.push({ d: "M" + p.join(" ") + "L" + q.join(" ") + "L" + c.join(" ") + "Z", fill: tones[k] })
    }
    for (let i = 0; i < 5; i++) {
      const a = inner[i]
      const b = inner[(i + 1) % 5]
      facets.push({ d: "M" + a.join(" ") + "L" + b.join(" ") + "L50 50Z", fill: tones[Math.floor(rnd() * 3)] })
    }
    const creases: string[] = []
    for (let i = 0; i < 9; i++) {
      const p = pts[Math.floor(rnd() * n)]
      const c = inner[Math.floor(rnd() * 5)]
      creases.push("M" + p.join(" ") + "L" + c.join(" "))
    }
    return { outline: "M" + pts.map((p) => p.join(" ")).join("L") + "Z", facets, creases }
  }, [seed])
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ maxWidth: "none" }}>
      <path d={shapes.outline} fill="#ecece6" />
      {shapes.facets.map((f, i) => (
        <path key={i} d={f.d} fill={f.fill} stroke="#bdbdb5" strokeWidth={0.4} strokeLinejoin="round" />
      ))}
      {shapes.creases.map((d, i) => (
        <path key={"c" + i} d={d} stroke="#a9a9a1" strokeWidth={0.6} opacity={0.6} fill="none" />
      ))}
    </svg>
  )
}

function BinderClip({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} style={{ maxWidth: "none" }}>
      <path d="M38 52 C30 30 24 16 30 8 C36 2 46 6 48 14 L56 52" fill="none" stroke="#c9ced6" strokeWidth={4.5} strokeLinecap="round" />
      <path d="M82 52 C90 30 96 16 90 8 C84 2 74 6 72 14 L64 52" fill="none" stroke="#aab0b9" strokeWidth={4.5} strokeLinecap="round" />
      <path d="M18 54 L102 54 L92 108 L28 108 Z" fill="#141414" />
      <path d="M18 54 L102 54 L99 64 L21 64 Z" fill="#3a3a3a" />
      <path d="M26 100 L94 100 L92 108 L28 108 Z" fill="#050505" />
      <path d="M30 70 L48 70" stroke="#555" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

function PaperClip({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 30 80" width={size * 0.375} height={size} style={{ maxWidth: "none" }}>
      <path
        d="M10 18 V62 A8 8 0 0 0 26 62 V12 A9 9 0 0 0 8 12 V58 A3 3 0 0 0 14 58 V22"
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </svg>
  )
}

function Scissors({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 160 100" width={size * 1.6} height={size} style={{ maxWidth: "none" }}>
      <path d="M70 46 L156 30 L158 34 L74 54 Z" fill="#d7dbe0" />
      <path d="M70 54 L154 66 L152 70 L72 60 Z" fill="#b9bec6" />
      <circle cx={72} cy={51} r={3} fill="#6c7380" />
      <ellipse cx={36} cy={30} rx={24} ry={16} fill="none" stroke="#2557d6" strokeWidth={10} transform="rotate(-14 36 30)" />
      <ellipse cx={34} cy={72} rx={22} ry={15} fill="none" stroke="#1f49b8" strokeWidth={10} transform="rotate(12 34 72)" />
      <path d="M56 38 L72 48" stroke="#2557d6" strokeWidth={9} strokeLinecap="round" />
      <path d="M54 64 L72 56" stroke="#1f49b8" strokeWidth={9} strokeLinecap="round" />
    </svg>
  )
}

function Glasses({ size, uid }: { size: number; uid: string }) {
  const pat = uid + "tort"
  return (
    <svg viewBox="0 0 220 110" width={size * 2} height={size} style={{ maxWidth: "none" }}>
      <defs>
        <pattern id={pat} width={18} height={18} patternUnits="userSpaceOnUse">
          <rect width={18} height={18} fill="#6b3b1f" />
          <circle cx={4} cy={5} r={4} fill="#2b170c" />
          <circle cx={13} cy={12} r={5} fill="#3a1f10" />
          <circle cx={14} cy={3} r={2} fill="#a8682f" />
          <circle cx={5} cy={14} r={2.5} fill="#c4853e" />
        </pattern>
      </defs>
      <path d="M8 40 L-40 20" stroke={"url(#" + pat + ")"} strokeWidth={6} strokeLinecap="round" />
      <path d="M212 40 L210 104" stroke={"url(#" + pat + ")"} strokeWidth={6} strokeLinecap="round" />
      <rect x={10} y={30} width={84} height={58} rx={20} fill="rgba(220,235,245,0.18)" stroke={"url(#" + pat + ")"} strokeWidth={8} />
      <rect x={124} y={30} width={84} height={58} rx={20} fill="rgba(220,235,245,0.18)" stroke={"url(#" + pat + ")"} strokeWidth={8} />
      <path d="M94 46 Q109 34 124 46" fill="none" stroke={"url(#" + pat + ")"} strokeWidth={7} />
      <path d="M24 42 L42 38" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.55} />
      <path d="M138 42 L156 38" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.55} />
    </svg>
  )
}

function Earphones({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 120 200" width={size * 0.6} height={size} style={{ maxWidth: "none" }}>
      <path
        d="M30 46 C20 90 70 80 74 120 C78 160 20 150 34 190 M86 52 C100 90 40 110 60 140 C80 170 118 160 108 200"
        fill="none"
        stroke="#f4f4f2"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path d="M60 140 C 80 120 100 130 92 96" fill="none" stroke="#e9e9e6" strokeWidth={2.4} />
      <rect x={24} y={22} width={10} height={26} rx={5} fill="#f2f2f0" transform="rotate(-10 29 35)" />
      <ellipse cx={30} cy={18} rx={13} ry={11} fill="#fafaf9" />
      <ellipse cx={27} cy={15} rx={5} ry={3} fill="#fff" />
      <rect x={82} y={28} width={10} height={26} rx={5} fill="#ececea" transform="rotate(12 87 41)" />
      <ellipse cx={88} cy={24} rx={13} ry={11} fill="#f5f5f3" />
      <ellipse cx={92} cy={22} rx={5} ry={4} fill="#9aa0a6" opacity={0.6} />
    </svg>
  )
}

function Star({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ maxWidth: "none" }}>
      <path d="M50 6 L62 38 L96 38 L68 58 L79 92 L50 72 L21 92 L32 58 L4 38 L38 38 Z" fill="#e3e5e8" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
      <path d="M50 6 L50 72 L21 92 L32 58 L4 38 L38 38 Z" fill="#c9ccd1" />
    </svg>
  )
}

function Pen({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 30 300" width={size * 0.1} height={size} style={{ maxWidth: "none" }}>
      <path d="M10 270 L15 296 L20 270 Z" fill="#c9ccd1" />
      <rect x={8} y={60} width={14} height={212} rx={3} fill="#d5232f" />
      <rect x={8} y={60} width={4} height={212} fill="#ef4a52" />
      <rect x={7} y={10} width={16} height={56} rx={6} fill="#b81c27" />
      <rect x={20} y={16} width={4} height={60} rx={2} fill="#dfe2e6" />
      <rect x={7} y={60} width={16} height={6} fill="#e9eaec" />
    </svg>
  )
}

function Folders({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 260 160" width={size * 1.625} height={size} style={{ maxWidth: "none" }}>
      <g transform="rotate(-6 130 80)">
        <path d="M14 30 L90 30 L104 18 L240 18 L240 150 L14 150 Z" fill="#d97f97" />
      </g>
      <g transform="rotate(3 130 80)">
        <path d="M20 40 L110 40 L124 26 L246 26 L246 156 L20 156 Z" fill="#ec9db1" />
        <path d="M20 46 L246 46" stroke="#d6849a" strokeWidth={2} />
      </g>
      <g transform="rotate(-2 130 80)">
        <path d="M8 56 L250 52 L252 160 L10 160 Z" fill="#f4b3c3" />
        <path d="M8 56 L250 52" stroke="#fdd6e0" strokeWidth={3} />
        <path d="M30 100 L120 98" stroke="#e595aa" strokeWidth={2} />
      </g>
    </svg>
  )
}

/** Every piece sits on the edges, so the content stays clear. */
function DeskProps() {
  const uid = React.useId().replace(/:/g, "")
  const shadow = { filter: "drop-shadow(6px 10px 8px rgba(0,0,0,0.38))" }
  const pos = (style: React.CSSProperties): React.CSSProperties => ({ position: "absolute", ...shadow, ...style })
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div style={pos({ top: -38, left: "6%" })}>
        <PaperBall seed={7} size={130} />
      </div>
      <div style={pos({ top: -12, left: "38%", transform: "rotate(18deg)" })}>
        <PaperClip size={70} color="#2a6fe0" />
      </div>
      <div style={pos({ top: 6, left: "42%", transform: "rotate(-34deg)" })}>
        <PaperClip size={64} color="#3b82f6" />
      </div>
      <div style={pos({ top: 26, left: "47%", transform: "rotate(62deg)" })}>
        <PaperClip size={58} color="#1d4ed8" />
      </div>
      <div className="hidden md:block" style={pos({ top: "16%", left: -54, transform: "rotate(-28deg)" })}>
        <Scissors size={90} />
      </div>
      <div className="hidden md:block" style={pos({ top: "14%", right: -24, transform: "rotate(28deg)" })}>
        <BinderClip size={110} />
      </div>
      <div className="hidden lg:block" style={pos({ top: "38%", left: -60, transform: "rotate(-14deg)" })}>
        <Glasses size={84} uid={uid} />
      </div>
      <div className="hidden lg:block" style={pos({ top: "30%", right: 6, transform: "rotate(-8deg)" })}>
        <Earphones size={200} />
      </div>
      <div className="hidden sm:block" style={pos({ top: "47%", left: "9%", transform: "rotate(12deg)" })}>
        <Star size={30} />
      </div>
      <div className="hidden sm:block" style={pos({ bottom: -170, left: "8%", transform: "rotate(16deg)" })}>
        <Pen size={300} />
      </div>
      <div className="hidden sm:block" style={pos({ bottom: -60, right: "18%", transform: "rotate(-4deg)" })}>
        <Folders size={150} />
      </div>
      <div style={pos({ bottom: -40, left: -30 })}>
        <PaperBall seed={23} size={110} />
      </div>
      <div className="hidden md:block" style={pos({ top: "62%", right: -40 })}>
        <PaperBall seed={41} size={100} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Small UI bits                                                             */
/* ------------------------------------------------------------------------ */

function Avatar({ item, size }: { item: FolioItem; size: number }) {
  const parts = item.name.trim().split(/\s+/)
  const ini = ((parts[0] || "?")[0] + (parts[1] ? parts[1][0] : "")).toUpperCase()
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: "linear-gradient(135deg, " + (item.accent || "#7c5cff") + ", #1a1a1a)",
        boxShadow: "0 0 0 2px #fff",
      }}
    >
      {ini}
    </span>
  )
}

function Verified({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} style={{ maxWidth: "none", flex: "none" }} aria-hidden="true">
      <path d="M8 1l1.8 1.3 2.2-.1.7 2.1 1.8 1.3-.7 2.1.7 2.1-1.8 1.3-.7 2.1-2.2-.1L8 15l-1.8-1.3-2.2.1-.7-2.1L1.5 10.4l.7-2.1-.7-2.1 1.8-1.3.7-2.1 2.2.1z" fill="#2f80ed" />
      <path d="M5.2 8.2l1.9 1.8 3.7-3.8" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Bookmark() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} style={{ maxWidth: "none" }} aria-hidden="true">
      <path d="M4 2h8v12l-4-3-4 3z" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

function CompanyBadges({ companies, size }: { companies: FolioCompany[]; size: number }) {
  if (companies.length === 0) return null
  return (
    <span className="flex items-center">
      {companies.slice(0, 3).map((c, i) => (
        <span
          key={c.name + i}
          title={c.name}
          className="inline-flex items-center justify-center rounded-full font-bold text-white"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.34,
            marginLeft: i === 0 ? 0 : -size * 0.22,
            background: c.color || "#111",
            boxShadow: "0 0 0 2px #fff",
            letterSpacing: "-0.02em",
          }}
        >
          <span className="sr-only">{c.name}</span>
          <span aria-hidden="true">{c.initials || initialsOf(c.name)}</span>
        </span>
      ))}
    </span>
  )
}

function Cursor() {
  return (
    <svg viewBox="0 0 20 24" width={22} height={26} style={{ maxWidth: "none" }} aria-hidden="true">
      <path d="M2 2 L2 19 L6.5 15 L9.6 22 L12.6 20.8 L9.6 14 L15.5 14 Z" fill="#0b0b0b" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  )
}

const PFS_CSS = `
.pfs-note{color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.55),0 2px 10px rgba(0,0,0,.45);font-weight:600;letter-spacing:-.01em;line-height:1.05}
.pfs-fade{animation:pfs-fade .5s cubic-bezier(.2,.7,.2,1) both}
@keyframes pfs-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.pfs-cursor{animation:pfs-cursor .6s cubic-bezier(.2,.9,.3,1.4) both}
@keyframes pfs-cursor{from{opacity:0;transform:translate(18px,18px) scale(.8)}to{opacity:1;transform:none}}
.pfs-scroll::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.pfs-fade,.pfs-cursor{animation:none}}
`

/* ------------------------------------------------------------------------ */
/* The dissolve                                                              */
/* ------------------------------------------------------------------------ */

const imageCache = new Map()

function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = imageCache.get(src) as Promise<HTMLImageElement> | undefined
  if (hit) return hit
  const p = new Promise((resolve: (img: HTMLImageElement) => void, reject) => {
    const img = document.createElement("img")
    if (!src.startsWith("data:") && !src.startsWith("blob:")) img.crossOrigin = "anonymous"
    img.decoding = "async"
    img.onload = () => resolve(img)
    img.onerror = () => {
      imageCache.delete(src)
      reject(new Error("image failed: " + src))
    }
    img.src = src
  })
  imageCache.set(src, p)
  return p
}

function roundedRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  c.beginPath()
  c.moveTo(x + rr, y)
  c.arcTo(x + w, y, x + w, y + h, rr)
  c.arcTo(x + w, y + h, x, y + h, rr)
  c.arcTo(x, y + h, x, y, rr)
  c.arcTo(x, y, x + w, y, rr)
  c.closePath()
}

interface Stage {
  cw: number
  ch: number
  pad: number
  dpr: number
  w: number
  h: number
  radius: number
}

/** The cover painted into a full-stage pixel buffer, plus one averaged colour per particle cell. */
function paintCover(img: HTMLImageElement, s: Stage, cols: number, rows: number) {
  const c = document.createElement("canvas")
  c.width = s.cw
  c.height = s.ch
  const ctx = c.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  const x = Math.round(s.pad * s.dpr)
  const y = Math.round(s.pad * s.dpr)
  const w = Math.round(s.w * s.dpr)
  const h = Math.round(s.h * s.dpr)
  ctx.save()
  roundedRect(ctx, x, y, w, h, s.radius * s.dpr)
  ctx.clip()
  const crop = coverCrop(img.naturalWidth, img.naturalHeight, w, h)
  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, x, y, w, h)
  ctx.restore()
  const small = document.createElement("canvas")
  small.width = cols
  small.height = rows
  const sctx = small.getContext("2d", { willReadFrequently: true })
  if (!sctx) return null
  sctx.imageSmoothingQuality = "high"
  sctx.drawImage(c, x, y, w, h, 0, 0, cols, rows)
  // getImageData throws on a cross-origin image without CORS — the caller crossfades instead
  const full = ctx.getImageData(0, 0, s.cw, s.ch)
  const avg = sctx.getImageData(0, 0, cols, rows).data
  return { base: new Uint32Array(full.data.buffer.slice(0)), avg }
}

/* ------------------------------------------------------------------------ */
/* The component                                                             */
/* ------------------------------------------------------------------------ */

export default function ParticleFolioShowcase({
  items,
  heading = "This portfolio website",
  captions,
  pageTitle = "Curated Portfolios For You !",
  tabs = ["Portfolios", "Case Studies", "Job Tracker"],
  filters = ["All", "Northwind", "Lumen", "Parcel", "Orbit", "Kiln", "Tandem"],
  ctaLabel = "Submit Portfolio",
  loginLabel = "Log in/Signup",
  url = "folio.directory/curated",
  initialIndex = 0,
  autoplay = 0,
  duration = 1800,
  particleSize = 2,
  onChange,
  matColor = "#0c7f55",
  sunColor = "#fff0cf",
  intensity = 1,
  speed = 1,
  showProps = true,
  height = "100svh",
  className = "",
}: ParticleFolioShowcaseProps) {
  const n = items.length
  const reduced = usePrefersReducedMotion()
  const [matFailed, setMatFailed] = React.useState(false)
  const [index, setIndex] = React.useState(initialIndex)
  const [busy, setBusy] = React.useState(false)
  const [hover, setHover] = React.useState(false)
  const [filter, setFilter] = React.useState(0)

  const safe = n > 0 ? wrapIndex(index, n) : 0
  const indexRef = React.useRef(safe)
  indexRef.current = safe
  const coverRef = React.useRef(null as HTMLDivElement | null)
  const imgRef = React.useRef(null as HTMLImageElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const runRef = React.useRef(0)
  const rafRef = React.useRef(0)
  const cfg = React.useRef({ duration, particleSize, reduced, onChange })
  cfg.current = { duration, particleSize, reduced, onChange }

  const item = n > 0 ? items[safe] : null

  React.useEffect(() => () => {
    runRef.current++
    cancelAnimationFrame(rafRef.current)
  }, [])

  const settle = React.useCallback(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (img) img.style.opacity = "1"
    if (canvas) canvas.style.opacity = "0"
    setBusy(false)
  }, [])

  const go = React.useCallback(
    (raw: number) => {
      if (n === 0) return
      const next = wrapIndex(raw, n)
      const from = indexRef.current
      if (next === from) return
      const run = ++runRef.current
      cancelAnimationFrame(rafRef.current)
      const commit = () => {
        indexRef.current = next
        setIndex(next)
        cfg.current.onChange?.(next)
      }
      const cover = coverRef.current
      const canvas = canvasRef.current
      if (cfg.current.reduced || !cover || !canvas) {
        settle()
        commit()
        return
      }
      setBusy(true)
      Promise.all([loadImage(items[from].src), loadImage(items[next].src)])
        .then(([a, b]) => {
          if (run !== runRef.current) return
          const w = cover.offsetWidth
          const h = cover.offsetHeight
          if (w < 4 || h < 4) throw new Error("no room")
          const dpr = Math.min(window.devicePixelRatio || 1, 2)
          const pad = Math.round(Math.max(80, w * 0.45))
          const stage: Stage = {
            w,
            h,
            pad,
            dpr,
            cw: Math.round((w + pad * 2) * dpr),
            ch: Math.round((h + pad * 2) * dpr),
            radius: 12,
          }
          const step = Math.max(1, cfg.current.particleSize)
          const cols = Math.max(1, Math.ceil(w / step))
          const rows = Math.max(1, Math.ceil(h / step))
          const A = paintCover(a, stage, cols, rows)
          const B = paintCover(b, stage, cols, rows)
          if (!A || !B) throw new Error("no 2d")

          canvas.width = stage.cw
          canvas.height = stage.ch
          canvas.style.left = -pad + "px"
          canvas.style.top = -pad + "px"
          canvas.style.width = w + pad * 2 + "px"
          canvas.style.height = h + pad * 2 + "px"
          const ctx = canvas.getContext("2d")
          if (!ctx) throw new Error("no 2d")
          const frame = ctx.createImageData(stage.cw, stage.ch)
          const buf = new Uint32Array(frame.data.buffer)

          // ---- the particles: one per cell, all flying the same breeze ----
          const count = cols * rows
          const x0 = new Int32Array(count)
          const x1 = new Int32Array(count)
          const y0 = new Int32Array(count)
          const y1 = new Int32Array(count)
          const hx = new Float32Array(count)
          const hy = new Float32Array(count)
          const ox1 = new Float32Array(count)
          const oy1 = new Float32Array(count)
          const ox2 = new Float32Array(count)
          const oy2 = new Float32Array(count)
          const delay = new Float32Array(count)
          const rnd = mulberry32(next * 7919 + from * 104729 + 1)
          const right = Math.round((pad + w) * dpr)
          const bottom = Math.round((pad + h) * dpr)
          const reach = Math.min(pad * 0.95, Math.max(w, h) * 0.42)
          for (let r = 0, k = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++, k++) {
              const cx = c * step
              const cy = r * step
              x0[k] = Math.min(right, Math.round((pad + cx) * dpr))
              x1[k] = Math.min(right, Math.round((pad + cx + step) * dpr))
              y0[k] = Math.min(bottom, Math.round((pad + cy) * dpr))
              y1[k] = Math.min(bottom, Math.round((pad + cy + step) * dpr))
              hx[k] = (pad + cx + step / 2) * dpr
              hy[k] = (pad + cy + step / 2) * dpr
              // up and to the right, then curl back round to land
              const th = -0.45 + (rnd() - 0.5) * 0.9
              const rad = reach * (0.3 + 0.7 * rnd()) * dpr
              ox1[k] = Math.cos(th) * rad * 1.3
              oy1[k] = Math.sin(th) * rad * 1.3
              const th2 = th + 0.55 + rnd() * 0.7
              ox2[k] = Math.cos(th2) * rad
              oy2[k] = Math.sin(th2) * rad
              delay[k] = liftOff(cx, cy, w, h, rnd())
            }
          }

          const cw = stage.cw
          const ch = stage.ch
          const baseA = A.base
          const baseB = B.base
          const ca = A.avg
          const cb = B.avg
          const little = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1

          const draw = (t: number) => {
            buf.set(baseA)
            // pass 1: holes where a particle has left, the new cover where it has landed
            for (let k = 0; k < count; k++) {
              const u = (t - delay[k]) / FLIGHT
              if (u <= 0) continue
              const landed = u >= 1
              for (let yy = y0[k]; yy < y1[k]; yy++) {
                const row = yy * cw
                for (let xx = x0[k]; xx < x1[k]; xx++) buf[row + xx] = landed ? baseB[row + xx] : 0
              }
            }
            // pass 2: everything in the air
            for (let k = 0; k < count; k++) {
              const u = (t - delay[k]) / FLIGHT
              if (u <= 0 || u >= 1) continue
              const j = k * 4
              const m = smoothstep(0.3, 0.7, u)
              const al = ca[j + 3] + (cb[j + 3] - ca[j + 3]) * m
              if (al < 24) continue
              const lift = Math.sin(Math.PI * u)
              const glint = 0.22 * lift
              const r = Math.min(255, (ca[j] + (cb[j] - ca[j]) * m) * (1 - glint) + 255 * glint)
              const g = Math.min(255, (ca[j + 1] + (cb[j + 1] - ca[j + 1]) * m) * (1 - glint) + 248 * glint)
              const bl = Math.min(255, (ca[j + 2] + (cb[j + 2] - ca[j + 2]) * m) * (1 - glint) + 225 * glint)
              const px = little
                ? ((al & 255) << 24) | ((bl & 255) << 16) | ((g & 255) << 8) | (r & 255)
                : ((r & 255) << 24) | ((g & 255) << 16) | ((bl & 255) << 8) | (al & 255)
              const off = flightOffset(u, ox1[k], oy1[k], ox2[k], oy2[k])
              const size = Math.max(1, step * dpr * (1 - 0.2 * lift))
              const sx = Math.round(hx[k] + off.x - size / 2)
              const sy = Math.round(hy[k] + off.y - size / 2)
              const ex = Math.min(cw, sx + Math.round(size))
              const ey = Math.min(ch, sy + Math.round(size))
              for (let yy = Math.max(0, sy); yy < ey; yy++) {
                const row = yy * cw
                for (let xx = Math.max(0, sx); xx < ex; xx++) buf[row + xx] = px >>> 0
              }
            }
            ctx.putImageData(frame, 0, 0)
          }

          // first frame is the old cover exactly, so the swap below never shows
          draw(0)
          canvas.style.opacity = "1"
          if (imgRef.current) imgRef.current.style.opacity = "0"
          commit()

          const start = performance.now()
          const tick = (now: number) => {
            if (run !== runRef.current) return
            const t = Math.min(1, (now - start) / Math.max(200, cfg.current.duration))
            draw(t)
            if (t < 1) rafRef.current = requestAnimationFrame(tick)
            else {
              const img = imgRef.current
              // wait for the real <img> to hold the new cover before uncovering it
              const done = () => run === runRef.current && settle()
              if (img && img.decode) img.decode().then(done, done)
              else done()
            }
          }
          rafRef.current = requestAnimationFrame(tick)
        })
        .catch(() => {
          // tainted or failed image: a plain swap rather than a stuck carousel
          if (run !== runRef.current) return
          settle()
          commit()
        })
    },
    [items, n, settle],
  )

  // autoplay, paused on hover/focus and while the tab is hidden
  React.useEffect(() => {
    if (!autoplay || n < 2 || hover || busy || reduced) return
    const id = window.setTimeout(() => {
      if (!document.hidden) go(indexRef.current + 1)
    }, Math.max(autoplay, duration + 400))
    return () => window.clearTimeout(id)
  }, [autoplay, n, hover, busy, reduced, index, go, duration])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault()
      go(indexRef.current + 1)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      go(indexRef.current - 1)
    }
  }

  const cap = {
    showcase: "Showcases the best design portfolios",
    details: "Along with the details of the designer",
    companies: "and the companies they have worked with",
    ...captions,
  }

  const prev = n > 1 ? items[wrapIndex(safe - 1, n)] : null
  const next = n > 1 ? items[wrapIndex(safe + 1, n)] : null
  const gridItems = items.slice(0, 6)

  return (
    <section
      className={"relative w-full overflow-hidden " + className}
      style={{
        minHeight: height,
        backgroundColor: matColor,
        backgroundImage: matFailed
          ? "linear-gradient(rgba(255,255,255,0.6) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.6) 2px, transparent 2px)"
          : undefined,
        backgroundSize: matFailed ? "160px 160px" : undefined,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <style>{PFS_CSS}</style>
      {!matFailed && (
        <CuttingMat
          color={matColor}
          sunColor={sunColor}
          intensity={intensity}
          speed={speed}
          reduced={reduced}
          onFail={() => setMatFailed(true)}
        />
      )}
      {showProps && <DeskProps />}

      <div
        className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-x-10 gap-y-10 px-4 py-16 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:py-20"
        style={{ minHeight: height }}
      >
        {/* ---------------- the website ---------------- */}
        <div className="min-w-0">
          <h2 className="pfs-note mb-4 text-center text-3xl sm:text-4xl lg:text-left lg:text-[2.6rem]">{heading}</h2>

          <div
            className="overflow-hidden rounded-xl bg-white text-[#111] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.25)]"
            style={{ transform: "rotate(-0.6deg)" }}
          >
            <div className="flex items-center gap-2 border-b border-black/5 bg-[#f3f3f1] px-3 py-2">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </span>
              <span className="mx-auto max-w-[60%] truncate rounded-md bg-white px-3 py-0.5 text-[10px] text-black/50 shadow-inner">{url}</span>
              <span className="w-10" aria-hidden="true" />
            </div>

            <div className="px-3 pb-4 pt-2 sm:px-5">
              <nav className="flex items-center gap-3 border-b border-black/5 pb-2 text-[10px] sm:text-[11px]">
                {tabs.map((t, i) => (
                  <span key={t} className={i === 0 ? "border-b-2 border-black pb-1 font-semibold" : "pb-1 text-black/55"}>
                    {t}
                  </span>
                ))}
                <span className="ml-auto hidden rounded-full bg-black px-2.5 py-1 text-[10px] font-medium text-white sm:inline">{ctaLabel}</span>
                <span className="rounded-full border border-black/15 px-2.5 py-1 text-[10px]">{loginLabel}</span>
              </nav>

              <p className="mt-3 text-[13px] font-semibold sm:text-sm">{pageTitle}</p>

              <div className="pfs-scroll mt-2 flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {filters.map((f, i) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(i)}
                    aria-pressed={filter === i}
                    className={
                      "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] transition-colors motion-reduce:transition-none " +
                      (filter === i ? "border-black bg-black text-white" : "border-black/10 bg-white text-black/70 hover:border-black/30")
                    }
                  >
                    {f}
                  </button>
                ))}
                <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full border border-black/10 px-2.5 py-0.5 text-[10px] text-black/40 sm:flex">
                  <svg viewBox="0 0 16 16" width={10} height={10} style={{ maxWidth: "none" }} aria-hidden="true">
                    <circle cx={7} cy={7} r={4.5} fill="none" stroke="currentColor" strokeWidth={1.6} />
                    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
                  </svg>
                  Search Artists
                </span>
              </div>

              <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                {gridItems.map((it, i) => {
                  const active = i === safe
                  return (
                    <li key={it.src + i} className={i >= 4 ? "hidden sm:block" : undefined}>
                      <button
                        type="button"
                        onClick={() => go(i)}
                        aria-label={"Show " + it.name + "'s portfolio"}
                        aria-current={active ? "true" : undefined}
                        className={
                          "group relative block w-full rounded-lg text-left outline-none transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-black motion-reduce:transition-none " +
                          (active ? "-translate-y-0.5" : "hover:-translate-y-0.5")
                        }
                      >
                        <span
                          className={
                            "relative block aspect-[16/10] overflow-hidden rounded-lg bg-neutral-200 ring-1 transition-shadow motion-reduce:transition-none " +
                            (active ? "shadow-[0_6px_16px_-4px_rgba(0,0,0,0.35)] ring-black" : "ring-black/5")
                          }
                        >
                          <img
                            src={it.src}
                            alt=""
                            width={320}
                            height={200}
                            loading="lazy"
                            draggable={false}
                            className="absolute inset-0 h-full w-full object-cover"
                            style={{ maxWidth: "none" }}
                          />
                        </span>
                        <span className="mt-1.5 flex items-center gap-1.5">
                          <Avatar item={it} size={16} />
                          <span className="min-w-0 truncate text-[10px] font-semibold">{it.name}</span>
                          {it.country && <span className="hidden truncate text-[9px] text-black/45 md:inline">· {it.country}</span>}
                        </span>
                        <span className="block truncate pl-[22px] text-[9px] text-black/50">{it.role}</span>
                        {active && (
                          <span key={"cur" + index} className="pfs-cursor pointer-events-none absolute -bottom-3 right-2">
                            <Cursor />
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <p className="pfs-note mt-4 max-w-[15ch] text-xl sm:text-2xl" style={{ transform: "rotate(-1.5deg)" }}>
            {cap.showcase}
          </p>
        </div>

        {/* ---------------- the card fan ---------------- */}
        <div
          className="min-w-0"
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured portfolios"
          tabIndex={0}
          onKeyDown={onKey}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          style={{ outline: "none" }}
        >
          <div className="relative mx-auto w-[min(72vw,340px)] pt-4">
            {[prev, next].map((side, si) =>
              side ? (
                <button
                  key={si}
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => go(safe + (si === 0 ? -1 : 1))}
                  className="absolute inset-x-0 top-4 rounded-2xl bg-white p-2.5 text-left text-[#111] shadow-[0_18px_36px_-10px_rgba(0,0,0,0.55)] transition-[transform,filter] duration-500 hover:brightness-105 motion-reduce:transition-none"
                  style={{
                    transform:
                      si === 0
                        ? "translateX(-46%) translateY(26px) rotate(-10deg) scale(0.86)"
                        : "translateX(46%) translateY(26px) rotate(10deg) scale(0.86)",
                    transformOrigin: si === 0 ? "100% 100%" : "0% 100%",
                    zIndex: 1,
                  }}
                >
                  <span className="relative block aspect-[16/11] overflow-hidden rounded-xl bg-neutral-200">
                    <img
                      src={side.src}
                      alt=""
                      width={340}
                      height={234}
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ maxWidth: "none" }}
                    />
                  </span>
                  <span className="mt-3 flex items-center gap-2 px-1">
                    <Avatar item={side} size={24} />
                    <span className="truncate text-sm font-semibold">{side.name}</span>
                  </span>
                  <span className="block truncate px-1 pl-9 text-[11px] text-black/50">{side.role}</span>
                  <span className="mt-3 flex items-end justify-between px-1 pb-1">
                    <span className="text-[11px] font-semibold">{side.experience}</span>
                    <CompanyBadges companies={side.companies || []} size={22} />
                  </span>
                </button>
              ) : null,
            )}

            {item && (
              <article
                className="relative rounded-2xl bg-white p-2.5 text-[#111] shadow-[0_30px_60px_-14px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.2)]"
                style={{ zIndex: 3 }}
                aria-live="polite"
              >
                <div ref={coverRef} className="relative aspect-[16/11]">
                  <div className="absolute inset-0 overflow-hidden rounded-xl bg-neutral-200">
                    <img
                      ref={imgRef}
                      src={item.src}
                      alt={item.alt || item.name + "'s portfolio cover"}
                      width={340}
                      height={234}
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ maxWidth: "none" }}
                    />
                  </div>
                  <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute"
                    style={{ opacity: 0, maxWidth: "none", zIndex: 5 }}
                  />
                  <span className="absolute right-2 top-2 z-[6] flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-black shadow">
                    <Bookmark />
                  </span>
                  <span className="absolute -bottom-5 left-3 z-[6]">
                    <Avatar item={item} size={44} />
                  </span>
                </div>
                <div key={safe} className="pfs-fade px-1.5 pb-1.5 pt-7">
                  <p className="flex items-center gap-1.5 text-[17px] font-semibold leading-tight">
                    <span className="truncate">{item.name}</span>
                    <Verified size={14} />
                    {item.country && <span className="truncate text-xs font-normal text-black/50">· {item.country}</span>}
                  </p>
                  <p className="mt-0.5 truncate text-[12.5px] text-black/60">
                    {item.role}
                    {item.style ? " · " + item.style : ""}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold leading-tight">{item.experience}</p>
                      <p className="text-[11px] text-black/45">Experience</p>
                    </div>
                    <CompanyBadges companies={item.companies || []} size={30} />
                  </div>
                </div>
              </article>
            )}
          </div>

          {n > 1 && (
            <div className="relative z-10 mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => go(safe - 1)}
                aria-label="Previous portfolio"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-[0_6px_14px_-4px_rgba(0,0,0,0.5)] transition-transform hover:-translate-x-0.5 active:scale-95 motion-reduce:transition-none"
              >
                <svg viewBox="0 0 16 16" width={16} height={16} style={{ maxWidth: "none" }} aria-hidden="true">
                  <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex items-center gap-1.5" role="group" aria-label="Choose a portfolio">
                {items.map((it, i) => (
                  <button
                    key={it.src + i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={"Portfolio " + (i + 1) + " of " + n + ": " + it.name}
                    aria-current={i === safe ? "true" : undefined}
                    className={
                      "h-2 rounded-full transition-all duration-300 motion-reduce:transition-none " +
                      (i === safe ? "w-6 bg-white" : "w-2 bg-white/45 hover:bg-white/75")
                    }
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => go(safe + 1)}
                aria-label="Next portfolio"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-[0_6px_14px_-4px_rgba(0,0,0,0.5)] transition-transform hover:translate-x-0.5 active:scale-95 motion-reduce:transition-none"
              >
                <svg viewBox="0 0 16 16" width={16} height={16} style={{ maxWidth: "none" }} aria-hidden="true">
                  <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-6">
            <p className="pfs-note text-base sm:text-lg" style={{ transform: "rotate(-2deg)" }}>
              {cap.details}
            </p>
            <p className="pfs-note text-right text-base sm:text-lg" style={{ transform: "rotate(1.5deg)" }}>
              {cap.companies}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
