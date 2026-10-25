"use client"

import * as React from "react"

/**
 * Strobe Diva Footer — a site footer laid out like a screen-printed fashion
 * poster. A paper top half carries a seal, the house's founding year and a
 * barcode, with the link columns tracked small in the flanks. In the middle a
 * figure in a brocade gown stands in front of a red sun, arms raised, with a
 * wheel of stroboscopic echo arms fanned out behind her. Below, the wordmark
 * fills a black band edge to edge in distressed red, cut off at the foot by
 * the floor, where the legal line and a back-to-top sit.
 *
 * The signature: move the pointer and the whole wheel of arms turns to follow
 * it, every echo on a softer spring than the one before, so a quick sweep
 * stretches the fan into a motion trail that collapses again when you stop.
 * Move high and the fan opens, move low and it folds. The pointer also
 * polishes the print: the grit in the wordmark clears in a lens around it.
 * Click the sun to replay the whole entrance.
 *
 * No dependencies and nothing fetched: React is the only import. The figure,
 * the seal, the barcode, the grit and the grain are all SVG built from
 * numbers, and the wordmark is set in whatever heavy face the page has and
 * measured to fill the band exactly.
 */

// #region strobe
// Pure maths: springs, the wheel, the copier's tone and grain, the backdrop
// key, the barcode and the type fit. Lifted out and run by
// tests/strobe-diva-footer.test.mjs.

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)

/** One semi-implicit Euler step of a damped spring toward `target`. Returns [x, v]. */
export const springStep = (
  x: number,
  v: number,
  target: number,
  k: number,
  zeta: number,
  dt: number,
): [number, number] => {
  const c = 2 * zeta * Math.sqrt(k)
  const a = k * (target - x) - c * v
  const nv = v + a * dt
  return [x + nv * dt, nv]
}

export const settled = (x: number, v: number, target: number, eps: number = 0.02): boolean =>
  Math.abs(x - target) < eps && Math.abs(v) < eps * 6

/** Echo `i` sits on a softer spring than echo `i - 1`: that lag is the trail. */
export const stiffness = (i: number): number => 200 / (1 + i * 0.5)

/** How far echo `i` fans out from the real arm, in degrees. The real arm (0) never moves. */
export const fanAngle = (i: number, step: number, spread: number, open: boolean): number =>
  open && i > 0 ? i * step * spread : 0

/**
 * Echo `i`'s angle on screen, in degrees, clockwise positive. `dir` is -1 for
 * the left arm (it opens anticlockwise) and +1 for the right. The swing turns
 * the whole wheel the same way on both sides; the real arm stays on the body.
 */
export const armAngle = (i: number, dir: number, step: number, spread: number, swing: number, open: boolean): number =>
  i === 0 ? 0 : clamp(dir * fanAngle(i, step, spread, open) + swing, -165, 165)

/** Each echo is a copy of a copy, printed a little larger, like a copier left on 104%. */
export const echoScale = (i: number, opened: number): number => 1 + i * 0.06 * clamp(opened, 0, 1)

/** Pointer position in the stage (0–1 each) → how the wheel turns and how wide it opens. */
export const pointerDrive = (nx: number, ny: number): { swing: number; spread: number } => ({
  swing: clamp((nx - 0.5) * 2, -1, 1) * 18,
  spread: clamp(1 + (0.5 - ny) * 0.5, 0.74, 1.24),
})

/** "#c9171e" or "#c11" → [r, g, b]; anything else → null. */
export const hexRgb = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? "").trim())
  if (!m) return null
  const s = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
}

/** sRGB bytes → luma, 0–1. */
export const luma = (r: number, g: number, b: number): number => (0.299 * r + 0.587 * g + 0.114 * b) / 255

/** The copier's contrast: a steep S-curve around `mid`. 0 is ink, 1 is paper. */
export const tone = (l: number, mid: number, k: number): number => 1 / (1 + Math.exp(-(l - mid) * k))

/** A deterministic hash of a pixel → [0, 1). */
export const hash2 = (x: number, y: number, seed: number): number => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** Copier grain: clumps a `cell` wide with a little per-pixel fizz, 0–1. */
export const grain = (x: number, y: number, cell: number, seed: number): number => {
  const c = cell > 1 ? cell : 1
  return 0.62 * hash2(Math.floor(x / c), Math.floor(y / c), seed) + 0.38 * hash2(x, y, seed + 7)
}

/**
 * 1 where the subject is. The backdrop is flood-filled in from the edges, so
 * light inside the subject stays, and only the gaps that reach the outside
 * (between the strands of a mesh cape, say) open up.
 */
export const keyMask = (lum: Float32Array, w: number, h: number, light: boolean, thresh: number): Uint8Array => {
  const n = w * h
  const bg = new Uint8Array(n)
  const q = new Int32Array(n)
  let head = 0
  let tail = 0
  const push = (i: number) => {
    if (bg[i]) return
    if (light ? lum[i] >= thresh : lum[i] <= thresh) {
      bg[i] = 1
      q[tail++] = i
    }
  }
  for (let x = 0; x < w; x++) {
    push(x)
    push((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    push(y * w)
    push(y * w + w - 1)
  }
  while (head < tail) {
    const i = q[head++]
    const x = i % w
    if (x > 0) push(i - 1)
    if (x < w - 1) push(i + 1)
    if (i >= w) push(i - w)
    if (i < n - w) push(i + w)
  }
  const m = new Uint8Array(n)
  for (let i = 0; i < n; i++) m[i] = bg[i] ? 0 : 1
  return m
}

/** Grow a mask by `r` px (an octagon, two separable passes): the paper rim of a cut-out. */
export const dilate = (m: Uint8Array, w: number, h: number, r: number): Uint8Array => {
  const R = Math.max(0, Math.round(r))
  if (!R) return m.slice()
  const a = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const row = y * w
    let last = -1e9
    for (let x = 0; x < w; x++) {
      if (m[row + x]) last = x
      if (x - last <= R) a[row + x] = 1
    }
    last = 1e9
    for (let x = w - 1; x >= 0; x--) {
      if (m[row + x]) last = x
      if (last - x <= R) a[row + x] = 1
    }
  }
  const b = new Uint8Array(w * h)
  for (let x = 0; x < w; x++) {
    let last = -1e9
    for (let y = 0; y < h; y++) {
      if (a[y * w + x]) last = y
      if (y - last <= R) b[y * w + x] = 1
    }
    last = 1e9
    for (let y = h - 1; y >= 0; y--) {
      if (a[y * w + x]) last = y
      if (last - y <= R) b[y * w + x] = 1
    }
  }
  return b
}

/** EAN-style left-hand digit patterns: 7 modules each, 1 = bar. */
export const EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"]

/** A digit string → the module string of a guarded EAN-style barcode. Non-digits are dropped. */
export const barcodeModules = (digits: string): string => {
  const d = String(digits ?? "").replace(/\D/g, "")
  if (!d) return ""
  let m = "101"
  for (const c of d) m += EAN_L[+c]
  return m + "101"
}

/** Runs of bars in a module string: { x, w } in modules. */
export const barcodeBars = (modules: string): { x: number; w: number }[] => {
  const bars: { x: number; w: number }[] = []
  let i = 0
  while (i < modules.length) {
    if (modules[i] === "1") {
      let j = i
      while (j < modules.length && modules[j] === "1") j++
      bars.push({ x: i, w: j - i })
      i = j
    } else i++
  }
  return bars
}

/**
 * Scale a measured word (its ink width and cap height) onto a box, filling the
 * width and the height separately for the condensed poster look, with the
 * stretch held to a range so no face is pulled into a caricature.
 */
export const fitScale = (textW: number, textH: number, boxW: number, boxH: number): { sx: number; sy: number } => {
  if (!(textW > 0) || !(textH > 0) || !(boxW > 0) || !(boxH > 0)) return { sx: 0, sy: 0 }
  const sx = boxW / textW
  const sy = clamp(boxH / textH, sx * 0.8, sx * 2.6)
  return { sx, sy }
}

/**
 * Where the figure stands in the stage (feet on the floor, centred), how big
 * the sun is and where it sits: centred on the head. All in CSS px.
 * `aspect` is the figure's width / height, `headY` the head's height in it (0–1).
 */
export const figureBox = (
  w: number,
  h: number,
  aspect: number,
  headY: number,
  narrow: boolean,
): { F: number; W: number; left: number; top: number; disc: number; discTop: number; band: number } => {
  const a = aspect > 0.15 ? aspect : 0.15
  const F = Math.max(0, Math.min(h * 0.9, (w * (narrow ? 0.92 : 0.5)) / a))
  const W = F * a
  const top = h - F
  const disc = Math.min(F * 0.56, w * 0.9)
  return { F, W, left: (w - W) / 2, top, disc, discTop: top + F * clamp(headY, 0, 1) - disc / 2, band: h * 0.44 }
}

/** Entrance storyboard, ms after the footer is first seen. */
export const STORY = { head: 0, disc: 80, letter: 220, letterStep: 46, figure: 380, scan: 950, arms: 120, armStep: 70, columns: 1000, legal: 1100 }

// #endregion

const PRESETS: { [k: string]: StrobePalette } = {
  crimson: { paper: "#efeae2", ink: "#0f0e0d", accent: "#c9171e", figure: "#0f0e0d", figureLight: "#f5f2eb" },
  midnight: { paper: "#141313", ink: "#ebe6dc", accent: "#e3211b", figure: "#0e0d0d", figureLight: "#efe9de" },
  cobalt: { paper: "#e9ecf0", ink: "#0a0f24", accent: "#1f3fd9", figure: "#0a0f24", figureLight: "#f3f5f8" },
  gilt: { paper: "#f1ece1", ink: "#171310", accent: "#c08f2c", figure: "#171310", figureLight: "#f7f2e7" },
}

const DISPLAY_FONT = 'Impact, Haettenschweiler, "Franklin Gothic Medium", "Arial Narrow", "Helvetica Neue", Arial, sans-serif'
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace'

const DEFAULT_COLUMNS: StrobeColumn[] = [
  {
    title: "Maison",
    links: [
      { label: "Our story", href: "#story" },
      { label: "Ateliers", href: "#ateliers" },
      { label: "Sustainability", href: "#sustainability" },
      { label: "Careers", href: "#careers" },
    ],
  },
  {
    title: "Collections",
    links: [
      { label: "Autumn / Winter 26", href: "#aw26" },
      { label: "Resort", href: "#resort" },
      { label: "Accessories", href: "#accessories" },
      { label: "Fragrance", href: "#fragrance" },
      { label: "Archive", href: "#archive" },
    ],
  },
  {
    title: "Clients",
    links: [
      { label: "Book an appointment", href: "#appointment" },
      { label: "Shipping & returns", href: "#shipping" },
      { label: "Size guide", href: "#sizes" },
      { label: "Garment care", href: "#care" },
    ],
  },
  {
    title: "Follow",
    links: [
      { label: "Instagram", href: "https://instagram.com" },
      { label: "TikTok", href: "https://tiktok.com" },
      { label: "Pinterest", href: "https://pinterest.com" },
      { label: "Journal", href: "#journal" },
    ],
  },
]

const DEFAULT_LEGAL_LINKS: StrobeLink[] = [
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
  { label: "Cookies", href: "#cookies" },
]

const GESTURES = ["open", "peace", "point", "horns", "open", "fist", "peace", "point", "open", "horns"]

const SDF_CSS = `
.sdf { position: relative; isolation: isolate; width: 100%; display: grid; grid-template-rows: auto 1fr auto; overflow: hidden; background: var(--sdf-paper); color: var(--sdf-ink); font-family: var(--sdf-mono); font-size: 13px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
.sdf *, .sdf *::before, .sdf *::after { box-sizing: border-box; }
.sdf[data-layout="narrow"] { grid-template-rows: auto auto auto auto; height: auto !important; min-height: 0 !important; }
.sdf-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.sdf-head { position: relative; z-index: 5; display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; gap: 16px; padding: 22px 28px 0; min-height: 104px; }
.sdf[data-layout="narrow"] .sdf-head { padding: 18px 18px 0; min-height: 88px; }
.sdf-seal { width: 64px; height: 64px; display: block; }
.sdf[data-layout="narrow"] .sdf-seal { width: 52px; height: 52px; }
.sdf-seal-ring { transform-origin: 50px 50px; }
.sdf-seal:hover .sdf-seal-ring { animation: sdf-spin 14s linear infinite; }
.sdf-seal text { font-family: var(--sdf-mono); fill: currentColor; }
.sdf-seal .sdf-seal-mark { font-family: var(--sdf-display); font-weight: 900; }
.sdf-year { text-align: center; font-size: 12px; letter-spacing: 0.26em; text-transform: uppercase; padding-top: 8px; white-space: nowrap; }
.sdf-year b { font-weight: 400; display: block; font-size: 17px; letter-spacing: 0.3em; margin-top: 2px; }
.sdf-code { justify-self: end; width: 122px; text-align: right; }
.sdf[data-layout="narrow"] .sdf-code { width: 96px; }
.sdf-code svg { display: block; width: 100%; height: 34px; }
.sdf-code rect { fill: currentColor; transform-origin: 50% 100%; transform-box: fill-box; }
.sdf-code span { display: block; font-size: 10px; letter-spacing: 0.32em; margin-top: 3px; white-space: nowrap; }

.sdf-stage { position: relative; overflow: hidden; touch-action: pan-y; }
.sdf[data-layout="narrow"] .sdf-stage { height: clamp(430px, 118vw, 620px); }
.sdf-disc { position: absolute; z-index: 1; left: var(--sdf-disc-left, 50%); top: var(--sdf-disc-top); width: var(--sdf-disc); height: var(--sdf-disc); margin: 0; padding: 0; border: 0; border-radius: 50%; background: var(--sdf-accent); cursor: pointer; transform: translate(calc(-50% + var(--sdf-dx, 0px)), var(--sdf-dy, 0px)); transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); -webkit-tap-highlight-color: transparent; }
.sdf-disc::before { content: ""; position: absolute; inset: 0; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--sdf-paper); opacity: 0; transition: opacity 0.3s; }
.sdf-disc:hover::before { opacity: 0.35; inset: 6%; }
.sdf-disc:focus-visible { outline: 2px solid var(--sdf-ink); outline-offset: 4px; }
.sdf-disc::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--sdf-accent); opacity: 0; pointer-events: none; }
.sdf-disc[data-pulse="1"]::after { animation: sdf-pulse 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.sdf-disc svg { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 50%; pointer-events: none; }

.sdf-band { position: absolute; z-index: 2; left: 0; right: 0; bottom: 0; height: var(--sdf-band); background: var(--sdf-ink); overflow: hidden; }
.sdf-word { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.sdf-word text { font-family: var(--sdf-display); font-weight: 900; font-size: 100px; fill: var(--sdf-accent); }
.sdf-word .sdf-measure { visibility: hidden; }
.sdf-let { transform-box: fill-box; transform-origin: 50% 85%; }
.sdf-word-lens { opacity: 0; transition: opacity 0.4s; }
.sdf-band[data-lens="1"] .sdf-word-lens { opacity: 1; }

.sdf-photo { position: absolute; z-index: 3; inset: 0; width: 100%; height: 100%; max-width: none; pointer-events: none; display: block; }
.sdf-figure { position: absolute; z-index: 3; left: 50%; bottom: 0; height: var(--sdf-fig); width: calc(var(--sdf-fig) * 0.4878); transform: translateX(-50%); pointer-events: none; }
.sdf-figure svg { display: block; width: 100%; height: 100%; overflow: visible; }

.sdf-flank { position: absolute; z-index: 4; top: 10px; display: grid; grid-auto-flow: column; gap: 36px; }
.sdf-flank-l { left: 28px; }
.sdf-flank-r { right: 28px; text-align: right; }
.sdf[data-layout="mid"] .sdf-flank { grid-auto-flow: row; gap: 22px; }
.sdf-cols { position: relative; z-index: 2; background: var(--sdf-ink); color: var(--sdf-paper); display: grid; grid-template-columns: 1fr 1fr; gap: 26px 18px; padding: 26px 18px 30px; }
.sdf-col h3 { margin: 0 0 10px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase; color: var(--sdf-accent); }
.sdf-col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; }
.sdf-col a { color: inherit; text-decoration: none; font-size: 12.5px; letter-spacing: 0.02em; background-image: linear-gradient(var(--sdf-accent), var(--sdf-accent)); background-repeat: no-repeat; background-size: 0 1px; background-position: 0 100%; transition: background-size 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), color 0.2s; padding-bottom: 1px; }
.sdf-flank-r .sdf-col a { background-position: 100% 100%; }
.sdf-col a:hover, .sdf-col a:focus-visible { background-size: 100% 1px; color: var(--sdf-accent); outline: none; }

.sdf-legal { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 18px; min-height: 56px; padding: 0 28px; background: var(--sdf-ink); color: var(--sdf-paper); font-size: 11px; letter-spacing: 0.08em; }
.sdf[data-layout="narrow"] .sdf-legal { flex-wrap: wrap; padding: 14px 18px; gap: 10px 18px; }
.sdf-legal::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--sdf-paper); opacity: 0.18; }
.sdf-floor { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.sdf-floor line { stroke: var(--sdf-paper); stroke-width: 1; opacity: 0.16; vector-effect: non-scaling-stroke; }
.sdf-legal > :not(.sdf-floor) { position: relative; white-space: nowrap; }
.sdf-legal-links { display: flex; gap: 18px; margin: 0; padding: 0; list-style: none; }
.sdf-legal a { color: inherit; text-decoration: none; opacity: 0.78; transition: opacity 0.2s, color 0.2s; }
.sdf-legal a:hover, .sdf-legal a:focus-visible { opacity: 1; color: var(--sdf-accent); outline: none; }
.sdf-top { display: inline-flex; align-items: center; gap: 10px; margin: 0; padding: 0; border: 0; background: none; color: inherit; font: inherit; letter-spacing: inherit; text-transform: uppercase; cursor: pointer; }
.sdf-top svg { width: 14px; height: 14px; transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.sdf-top:hover svg, .sdf-top:focus-visible svg { transform: translateY(-3px); }
.sdf-top:hover, .sdf-top:focus-visible { color: var(--sdf-accent); outline: none; }
.sdf-top:focus-visible, .sdf-legal a:focus-visible, .sdf-col a:focus-visible { box-shadow: 0 0 0 2px var(--sdf-accent); border-radius: 2px; }

.sdf-grain { position: absolute; inset: 0; z-index: 8; width: 100%; height: 100%; pointer-events: none; mix-blend-mode: overlay; opacity: var(--sdf-grain); }

/* entrance: nothing moves until the footer has been seen */
.sdf[data-seen="0"] .sdf-ent, .sdf[data-seen="0"] .sdf-let, .sdf[data-seen="0"] .sdf-code rect { opacity: 0; }
.sdf[data-seen="1"] .sdf-ent { animation: sdf-up 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: var(--d); }
.sdf[data-seen="1"] .sdf-ent-disc { animation: sdf-rise 1s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: var(--d); }
.sdf[data-seen="1"] .sdf-ent-fig { animation: sdf-print 0.75s cubic-bezier(0.4, 0, 0.2, 1) backwards; animation-delay: var(--d); }
.sdf[data-seen="1"] .sdf-let { animation: sdf-stamp 0.55s cubic-bezier(0.16, 1.3, 0.3, 1) both; animation-delay: var(--d); }
.sdf[data-seen="1"] .sdf-code rect { animation: sdf-bar 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: var(--d); }

@keyframes sdf-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes sdf-rise { from { opacity: 0; transform: translate(-50%, 6%) scale(0.72); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
@keyframes sdf-print { from { clip-path: inset(-40% -80% 100% -80%); } to { clip-path: inset(-40% -80% 0 -80%); } }
@keyframes sdf-stamp { from { opacity: 0; transform: scale(1.28) translateY(-3%); } 55% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes sdf-bar { from { opacity: 0; transform: scaleY(0); } to { opacity: 1; transform: none; } }
@keyframes sdf-spin { to { transform: rotate(360deg); } }
@keyframes sdf-pulse { from { opacity: 0.9; transform: scale(1); } to { opacity: 0; transform: scale(1.5); } }

@media (prefers-reduced-motion: reduce) {
  .sdf .sdf-ent, .sdf .sdf-ent-disc, .sdf .sdf-ent-fig, .sdf .sdf-let, .sdf .sdf-code rect { animation: none !important; opacity: 1 !important; transform: none !important; clip-path: none !important; }
  .sdf .sdf-ent-disc { transform: translate(-50%, 0) !important; }
  .sdf-disc { transition: none; }
  .sdf-seal:hover .sdf-seal-ring { animation: none; }
  .sdf-disc[data-pulse="1"]::after { animation: none; }
}
`

/* ---------------------------------------------------------------- hooks */

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia === "undefined") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

/* ---------------------------------------------------------------- pieces */

/** A hand at the wrist, pointing along `dir`, in one of a few gestures. */
function Hand(props: { x: number; y: number; dx: number; dy: number; gesture: string; color: string }) {
  const { x, y, dx, dy, gesture, color } = props
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const base = Math.atan2(uy, ux)
  const px = x + ux * 9
  const py = y + uy * 9
  let fingers: number[] = []
  let flen = 19
  let palm = 9.5
  let thumb: [number, number] | null = [-80, 13]
  if (gesture === "open") fingers = [-38, -13, 12, 36]
  else if (gesture === "peace") {
    fingers = [-15, 15]
    flen = 20
    thumb = [-76, 10]
  } else if (gesture === "point") {
    fingers = [0]
    flen = 21
    thumb = [-76, 11]
  } else if (gesture === "horns") {
    fingers = [-36, 36]
    flen = 19
    thumb = [-76, 10]
  } else {
    palm = 11.5
    thumb = [-62, 7]
  }
  const deg = Math.PI / 180
  const line = (a: number, l: number, key: string) => (
    <line
      key={key}
      x1={px}
      y1={py}
      x2={px + Math.cos(base + a * deg) * l}
      y2={py + Math.sin(base + a * deg) * l}
      stroke={color}
      strokeWidth={5}
      strokeLinecap="round"
    />
  )
  return (
    <g>
      <circle cx={px} cy={py} r={palm} fill={color} />
      {fingers.map((a, i) => line(a, flen, "f" + i))}
      {thumb ? line(thumb[0], thumb[1], "t") : null}
    </g>
  )
}

/** One arm in the left-side frame: shoulder (158, 268), elbow out, hand up over the head. */
function Arm(props: { gesture: string; color: string }) {
  const c = props.color
  return (
    <g>
      <path d="M158 268 L100 192" stroke={c} strokeWidth={21} strokeLinecap="round" fill="none" />
      <path d="M100 192 L128 112" stroke={c} strokeWidth={17} strokeLinecap="round" fill="none" />
      <circle cx={100} cy={192} r={10.5} fill={c} />
      <Hand x={128} y={112} dx={22} dy={-36} gesture={props.gesture} color={c} />
    </g>
  )
}

const GOWN = "M156 346 C 150 430, 62 600, 26 790 Q 200 814 374 790 C 338 600, 250 430, 244 346 Z"

type ArmRefs = { l: (SVGGElement | null)[]; r: (SVGGElement | null)[] }

/** The figure. Echo arms sit behind the body; refs let the spring loop turn them. */
function Figure(props: { id: string; arms: number; color: string; light: string; mark: string; refs: ArmRefs }) {
  const { id, arms, color, light, mark, refs } = props
  const n = Math.max(0, Math.min(10, Math.round(arms)))
  const echoes: number[] = []
  for (let i = n; i >= 1; i--) echoes.push(i)
  const lace = id + "-lace"
  const dots = id + "-dots"
  const folds = id + "-folds"
  const hem = id + "-hem"
  const round = id + "-round"
  const faceR = id + "-face"
  return (
    <svg viewBox="0 0 400 820" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={lace} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M12 0 L24 12 L12 24 L0 12 Z" fill="none" stroke={light} strokeWidth="0.8" opacity="0.55" />
          <g fill={light} opacity="0.8">
            <ellipse cx="12" cy="7.6" rx="1.7" ry="3.4" />
            <ellipse cx="12" cy="16.4" rx="1.7" ry="3.4" />
            <ellipse cx="7.6" cy="12" rx="3.4" ry="1.7" />
            <ellipse cx="16.4" cy="12" rx="3.4" ry="1.7" />
            <circle cx="12" cy="12" r="1.1" fill={color} />
            <circle cx="0" cy="0" r="1.3" />
            <circle cx="24" cy="0" r="1.3" />
            <circle cx="0" cy="24" r="1.3" />
            <circle cx="24" cy="24" r="1.3" />
            <circle cx="12" cy="0" r="0.7" />
            <circle cx="0" cy="12" r="0.7" />
            <circle cx="24" cy="12" r="0.7" />
            <circle cx="12" cy="24" r="0.7" />
          </g>
        </pattern>
        <pattern id={dots} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.05" fill={color} opacity="0.5" />
        </pattern>
        <linearGradient id={folds} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9a9a9a" />
          <stop offset="0.1" stopColor="#fff" />
          <stop offset="0.2" stopColor="#8a8a8a" />
          <stop offset="0.32" stopColor="#fff" />
          <stop offset="0.44" stopColor="#6e6e6e" />
          <stop offset="0.55" stopColor="#f4f4f4" />
          <stop offset="0.66" stopColor="#7a7a7a" />
          <stop offset="0.78" stopColor="#fff" />
          <stop offset="0.9" stopColor="#5e5e5e" />
          <stop offset="1" stopColor="#8a8a8a" />
        </linearGradient>
        <mask id={folds + "m"} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="820">
          <rect x="0" y="300" width="400" height="520" fill={"url(#" + folds + ")"} />
        </mask>
        <linearGradient id={hem} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.7" stopColor={color} stopOpacity="0" />
          <stop offset="1" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={round} cx="0.42" cy="0.4" r="0.72">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.6" stopColor={color} stopOpacity="0.05" />
          <stop offset="1" stopColor={color} stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id={faceR} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.7" stopColor={color} stopOpacity="0.04" />
          <stop offset="1" stopColor={color} stopOpacity="0.42" />
        </radialGradient>
      </defs>

      {/* echo arms, outermost first so the nearer ones paint over them */}
      <g>
        {echoes.map((i) => (
          <g key={"l" + i} ref={(el) => (refs.l[i] = el)} transform="rotate(0 158 268)">
            <Arm gesture={GESTURES[i % GESTURES.length]} color={color} />
          </g>
        ))}
        <g transform="matrix(-1 0 0 1 400 0)">
          {echoes.map((i) => (
            <g key={"r" + i} ref={(el) => (refs.r[i] = el)} transform="rotate(0 158 268)">
              <Arm gesture={GESTURES[(i + 2) % GESTURES.length]} color={color} />
            </g>
          ))}
        </g>
      </g>

      {/* gown */}
      <path d={GOWN} fill={color} />
      <path d={GOWN} fill={"url(#" + lace + ")"} mask={"url(#" + folds + "m)"} />
      <path d={GOWN} fill={"url(#" + hem + ")"} />

      {/* midriff and belt */}
      <path d="M163 298 C 158 318, 158 334, 162 350 L 238 350 C 242 334, 242 318, 237 298 Z" fill={light} />
      <path d="M163 298 C 158 318, 158 334, 162 350 L 238 350 C 242 334, 242 318, 237 298 Z" fill={"url(#" + dots + ")"} />
      <path d="M163 298 C 158 318, 158 334, 162 350 L 238 350 C 242 334, 242 318, 237 298 Z" fill={"url(#" + round + ")"} />
      <path d="M155 340 Q 200 352 245 340 L 246 352 Q 200 364 154 352 Z" fill={color} />
      <circle cx="200" cy="348" r="7.5" fill="none" stroke={light} strokeWidth="2.4" />
      <circle cx="200" cy="348" r="2" fill={light} />

      {/* top */}
      <path d="M148 262 Q 200 248 252 262 L 249 304 Q 200 316 151 304 Z" fill={color} />
      <circle cx="200" cy="282" r="15" fill={light} />
      <circle cx="200" cy="282" r="11.5" fill="none" stroke={color} strokeWidth="1.2" />
      <text x="200" y="287.5" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily={DISPLAY_FONT} fill={color}>
        {mark}
      </text>

      {/* neck and head */}
      <rect x="189" y="236" width="22" height="32" fill={light} />
      <rect x="189" y="236" width="22" height="32" fill={"url(#" + dots + ")"} />
      <path d="M189 240 Q 200 266 211 240 L 211 268 L 189 268 Z" fill={color} opacity="0.3" />
      <circle cx="200" cy="170" r="9.5" fill={color} />
      <ellipse cx="200" cy="194" rx="29" ry="25" fill={color} />
      <ellipse cx="200" cy="213" rx="25" ry="31" fill={light} />
      <ellipse cx="200" cy="213" rx="25" ry="31" fill={"url(#" + dots + ")"} opacity="0.55" />
      <ellipse cx="200" cy="213" rx="25" ry="31" fill={"url(#" + faceR + ")"} />
      <path d="M175 208 Q 178 184 200 182 Q 222 184 225 208 Q 215 194 200 193 Q 185 194 175 208 Z" fill={color} />
      <g fill={color}>
        <rect x="176" y="202" width="21" height="12.5" rx="5.5" />
        <rect x="203" y="202" width="21" height="12.5" rx="5.5" />
        <rect x="196" y="206" width="8" height="2.2" />
        <rect x="170" y="205" width="7" height="2" />
        <rect x="223" y="205" width="7" height="2" />
      </g>
      <path d="M192.5 233.5 Q 200 238.5 207.5 233.5 Q 200 231.5 192.5 233.5 Z" fill={color} opacity="0.85" />

      {/* real arms */}
      <g ref={(el) => (refs.l[0] = el)} transform="rotate(0 158 268)">
        <Arm gesture="open" color={color} />
      </g>
      <g transform="matrix(-1 0 0 1 400 0)">
        <g ref={(el) => (refs.r[0] = el)} transform="rotate(0 158 268)">
          <Arm gesture="open" color={color} />
        </g>
      </g>
    </svg>
  )
}

/** The seal: brand text running round a ring, the initial in the middle. */
function Seal(props: { id: string; text: string; mark: string }) {
  const circ = props.id + "-c"
  let ring = props.text.trim()
  if (ring && !/[·•|/]$/.test(ring)) ring += " ·"
  let run = ""
  while (ring && run.length < 44) run += ring + " "
  return (
    <svg className="sdf-seal" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <path id={circ} d="M50 50 m -36 0 a 36 36 0 1 1 72 0 a 36 36 0 1 1 -72 0" />
      </defs>
      <circle cx="50" cy="50" r="48.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="1" />
      <g className="sdf-seal-ring">
        <text fontSize="8.6" fontWeight="700" letterSpacing="1.4">
          <textPath href={"#" + circ} startOffset="0">
            {run}
          </textPath>
        </text>
      </g>
      <text className="sdf-seal-mark" x="50" y="59.5" textAnchor="middle" fontSize="27">
        {props.mark}
      </text>
    </svg>
  )
}

function Barcode(props: { digits: string; seen: boolean }) {
  const modules = barcodeModules(props.digits)
  const bars = barcodeBars(modules)
  const w = Math.max(1, modules.length)
  return (
    <div className="sdf-code" aria-hidden="true">
      <svg viewBox={"0 0 " + w + " 40"} preserveAspectRatio="none" focusable="false">
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={40} style={{ ["--d" as string]: STORY.head + 120 + i * 18 + "ms" }} />
        ))}
      </svg>
      <span>{props.digits.replace(/\D/g, "")}</span>
    </div>
  )
}

/** The wordmark, measured and stretched to fill the band, printed with grit. */
function Wordmark(props: { id: string; word: string; font: string; w: number; h: number; grit: number; lensRef: React.MutableRefObject<SVGRadialGradientElement | null>; run: number }) {
  const { id, word, font, w, h, grit, lensRef, run } = props
  const measureRef = React.useRef(null as SVGTextElement | null)
  const [layout, setLayout] = React.useState({ adv: [] as number[], bx: 0, by: 0, bw: 0, bh: 0 })
  const letters = Array.from(word)

  React.useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return
    const measure = () => {
      try {
        // the ink box, not the font box: a canvas reports where the caps actually are
        const cv = typeof document !== "undefined" ? document.createElement("canvas") : null
        const ctx = cv ? cv.getContext("2d") : null
        if (ctx && "actualBoundingBoxAscent" in ctx.measureText("A")) {
          ctx.font = "900 100px " + font
          const mw = ctx.measureText(word)
          const adv: number[] = []
          for (const ch of letters) adv.push(ctx.measureText(ch).width)
          if (mw.actualBoundingBoxAscent > 0) {
            setLayout({
              adv,
              bx: -mw.actualBoundingBoxLeft,
              by: -mw.actualBoundingBoxAscent,
              bw: mw.actualBoundingBoxLeft + mw.actualBoundingBoxRight,
              bh: mw.actualBoundingBoxAscent + mw.actualBoundingBoxDescent,
            })
            return
          }
        }
        // fallback: the SVG font box, with caps taken as 72% of it
        const box = el.getBBox()
        const adv: number[] = []
        for (let i = 0; i < letters.length; i++) adv.push(el.getSubStringLength(i, 1))
        setLayout({ adv, bx: box.x, by: box.y + box.height * 0.2, bw: box.width, bh: box.height * 0.72 })
      } catch {}
    }
    measure()
    if (typeof document !== "undefined" && (document as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready) {
      let alive = true
      ;(document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready.then(() => alive && measure())
      return () => {
        alive = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, font])

  const pad = Math.max(8, w * 0.012)
  const track = -2.5
  const total = layout.adv.reduce((a, b) => a + b, 0) + track * Math.max(0, letters.length - 1)
  const inkW = layout.bw > 0 ? Math.min(total, layout.bw + track * Math.max(0, letters.length - 1)) : total
  const { sx, sy } = fitScale(inkW, layout.bh, w - pad * 2, h * 0.98)
  const ready = sx > 0 && sy > 0 && w > 0 && h > 0
  const ty = h * 1.05 - (layout.by + layout.bh) * sy
  const tx = pad - layout.bx * sx
  const grit1 = id + "-grit"
  const lensG = id + "-lensg"
  const lensM = id + "-lens"
  // holes open where the noise alpha falls under a threshold: the lower it is, the fewer holes
  const g = clamp(grit, 0, 1)
  // the grain is sized to the band, so a phone's smaller letters don't print as holes
  const fq = clamp(320 / Math.max(1, h), 1, 2.2)
  const speck = 0.2 + g * 0.14
  const streak = 0.07 + g * 0.09
  let x = 0
  const placed = letters.map((ch, i) => {
    const lx = x
    x += (layout.adv[i] || 0) + track
    return { ch, x: lx, i }
  })
  const glyphs = (cls: string) =>
    placed.map((p) => (
      <text key={run + ":" + p.i} className={cls} x={p.x} y={0} style={{ ["--d" as string]: STORY.letter + p.i * STORY.letterStep + "ms" }}>
        {p.ch}
      </text>
    ))
  return (
    <svg className="sdf-word" viewBox={"0 0 " + Math.max(1, w) + " " + Math.max(1, h)} aria-hidden="true" focusable="false">
      <defs>
        <filter id={grit1} x="-2%" y="-5%" width="104%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={(0.028 * fq).toFixed(4)} numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale={(2 + g * 6) / fq} xChannelSelector="R" yChannelSelector="G" result="rag" />
          <feTurbulence type="fractalNoise" baseFrequency={(0.55 * fq).toFixed(3)} numOctaves="2" seed="11" result="fine" />
          <feColorMatrix in="fine" type="matrix" values={"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 30 " + (-30 * speck).toFixed(3)} result="specks" />
          <feComposite in="rag" in2="specks" operator="in" result="cut1" />
          <feTurbulence type="fractalNoise" baseFrequency={(0.01 * fq).toFixed(4) + " " + (0.45 * fq).toFixed(3)} numOctaves="3" seed="17" result="long" />
          <feColorMatrix in="long" type="matrix" values={"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 30 " + (-30 * streak).toFixed(3)} result="streaks" />
          <feComposite in="cut1" in2="streaks" operator="in" />
        </filter>
        <radialGradient id={lensG} gradientUnits="userSpaceOnUse" cx="-1000" cy="-1000" r={Math.max(90, h * 0.42)} ref={lensRef}>
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={lensM} maskUnits="userSpaceOnUse" x="0" y="0" width={Math.max(1, w)} height={Math.max(1, h)}>
          <rect x="0" y="0" width={Math.max(1, w)} height={Math.max(1, h)} fill={"url(#" + lensG + ")"} />
        </mask>
      </defs>
      <text ref={measureRef} className="sdf-measure" x="0" y="0">
        {word}
      </text>
      {ready ? (
        <g filter={"url(#" + grit1 + ")"}>
          <g transform={"translate(" + tx + " " + ty + ") scale(" + sx + " " + sy + ")"}>{glyphs("sdf-let")}</g>
        </g>
      ) : null}
      {ready ? (
        <g className="sdf-word-lens" mask={"url(#" + lensM + ")"}>
          <g transform={"translate(" + tx + " " + ty + ") scale(" + sx + " " + sy + ")"}>{glyphs("sdf-let sdf-let-solid")}</g>
        </g>
      ) : null}
    </svg>
  )
}

function Column(props: { col: StrobeColumn }) {
  const { col } = props
  return (
    <div className="sdf-col">
      <h3>{col.title}</h3>
      <ul>
        {col.links.map((l, i) => (
          <li key={i}>
            <a href={l.href || "#"} target={l.external ? "_blank" : undefined} rel={l.external ? "noreferrer" : undefined}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------------------------------------------------------------- the photocopy */

type Sim = {
  l: { x: number; v: number }[]
  r: { x: number; v: number }[]
  swing: number
  spread: number
  openAt: number
  scanAt: number
  raf: number
  last: number
  visible: boolean
  reduced: boolean
  step: number
  n: number
}

type Copy = {
  /** the whole figure, keyed, toned, grained and rimmed */
  fig: HTMLCanvasElement
  /** per arm: the cut-out, one sprite per generation (index 1 = first echo) */
  arms: { dir: number; px: number; py: number; ox: number; oy: number; gens: HTMLCanvasElement[] }[]
  pad: number
  dpr: number
  F: number
}

const SCAN_MS = 1150

/** Key, tone, grain and rim a photo into a copier print, and cut its arms out for the echoes. */
function printCopy(img: HTMLImageElement, cfg: StrobeFigure, F: number, dpr: number, inkHex: string, paperHex: string, gens: number): Copy | null {
  const ink = hexRgb(inkHex) || [15, 14, 13]
  const paper = hexRgb(paperHex) || [245, 242, 235]
  const crop = cfg.crop || [0, 0, 1, 1]
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  if (!nw || !nh) return null
  const sx = crop[0] * nw
  const sy = crop[1] * nh
  const cw = (crop[2] - crop[0]) * nw
  const ch = (crop[3] - crop[1]) * nh
  const H = Math.max(2, Math.round(F * dpr))
  const W = Math.max(2, Math.round((H * cw) / ch))
  const pad = Math.ceil(5 * dpr)
  const TW = W + pad * 2
  const TH = H + pad * 2
  const light = cfg.backdrop !== "dark"
  const work = document.createElement("canvas")
  work.width = TW
  work.height = TH
  const wx = work.getContext("2d", { willReadFrequently: true })
  if (!wx) return null
  wx.fillStyle = light ? "#fff" : "#000"
  wx.fillRect(0, 0, TW, TH)
  wx.drawImage(img, sx, sy, cw, ch, pad, pad, W, H)
  let src: ImageData
  try {
    src = wx.getImageData(0, 0, TW, TH)
  } catch {
    return null // a host without CORS taints the canvas: fall back to the drawn figure
  }
  const n = TW * TH
  const lum = new Float32Array(n)
  for (let i = 0, j = 0; i < n; i++, j += 4) lum[i] = luma(src.data[j], src.data[j + 1], src.data[j + 2])
  const mask = keyMask(lum, TW, TH, light, light ? 0.92 : 0.08)
  const rim = dilate(mask, TW, TH, 2.6 * dpr)
  const cell = 1.4 * dpr
  const mid = cfg.tone ?? 0.46
  const k = 11

  const paint = (x0: number, y0: number, w: number, h: number, bias: number, seed: number): HTMLCanvasElement => {
    const c = document.createElement("canvas")
    c.width = Math.max(1, w)
    c.height = Math.max(1, h)
    const cx = c.getContext("2d")
    if (!cx) return c
    const out = cx.createImageData(c.width, c.height)
    const d = out.data
    for (let y = 0; y < h; y++) {
      const yy = y + y0
      if (yy < 0 || yy >= TH) continue
      for (let x = 0; x < w; x++) {
        const xx = x + x0
        if (xx < 0 || xx >= TW) continue
        const i = yy * TW + xx
        const o = (y * w + x) * 4
        if (mask[i]) {
          const t = tone(lum[i], mid + bias, k)
          const col = t > grain(xx, yy, cell, seed) ? paper : ink
          d[o] = col[0]
          d[o + 1] = col[1]
          d[o + 2] = col[2]
          d[o + 3] = 255
        } else if (rim[i]) {
          d[o] = paper[0]
          d[o + 1] = paper[1]
          d[o + 2] = paper[2]
          d[o + 3] = 255
        }
      }
    }
    cx.putImageData(out, 0, 0)
    return c
  }

  const fig = paint(0, 0, TW, TH, 0, 3)
  const toPx = (p: [number, number]): [number, number] => [pad + ((p[0] - crop[0]) / (crop[2] - crop[0])) * W, pad + ((p[1] - crop[1]) / (crop[3] - crop[1])) * H]
  const headX = toPx(cfg.head || [0.5, 0.2])[0]
  const arms = (cfg.arms || []).map((arm) => {
    const pts = arm.outline.map(toPx)
    const [px, py] = toPx(arm.pivot)
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
    const r = Math.ceil(3 * dpr)
    x0 = Math.max(0, Math.floor(x0) - r)
    y0 = Math.max(0, Math.floor(y0) - r)
    x1 = Math.min(TW, Math.ceil(x1) + r)
    y1 = Math.min(TH, Math.ceil(y1) + r)
    const list: HTMLCanvasElement[] = [fig]
    for (let g = 1; g <= gens; g++) {
      // every generation prints darker: a copy of a copy
      const c = paint(x0, y0, x1 - x0, y1 - y0, 0.018 * g, 11 + g * 17)
      const cx = c.getContext("2d")
      if (cx) {
        cx.globalCompositeOperation = "destination-in"
        cx.beginPath()
        pts.forEach(([x, y], q) => (q ? cx.lineTo(x - x0, y - y0) : cx.moveTo(x - x0, y - y0)))
        cx.closePath()
        cx.fill()
      }
      list.push(c)
    }
    return { dir: px < headX ? -1 : 1, px, py, ox: x0, oy: y0, gens: list }
  })
  return { fig, arms, pad, dpr, F }
}

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** The photograph, printed by a copier: one canvas over the stage, drawn by the spring loop. */
function PhotoFigure(props: {
  cfg: StrobeFigure
  box: { F: number; W: number; left: number; top: number }
  w: number
  h: number
  ink: string
  paper: string
  gens: number
  sim: React.MutableRefObject<Sim>
  drawRef: React.MutableRefObject<((now: number) => void) | null>
  onState: (s: "ready" | "error") => void
  wake: () => void
}) {
  const { cfg, box, w, h, ink, paper, gens, sim, drawRef, onState, wake } = props
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const [img, setImg] = React.useState(null as HTMLImageElement | null)
  const copy = React.useRef(null as Copy | null)
  const boxRef = React.useRef(box)
  boxRef.current = box

  // load once per source; CORS is required to read the pixels
  React.useEffect(() => {
    let alive = true
    const im = new Image()
    im.crossOrigin = "anonymous"
    im.decoding = "async"
    im.onload = () => alive && setImg(im)
    im.onerror = () => alive && onState("error")
    im.src = cfg.src
    return () => {
      alive = false
      im.onload = null
      im.onerror = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.src])

  const draw = React.useCallback((now: number) => {
    const cv = canvasRef.current
    const cp = copy.current
    if (!cv || !cp) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    const s = sim.current
    const dpr = cp.dpr
    const b = boxRef.current
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // the copy was printed at cp.F; a small resize just scales it until it reprints
    const k = b.F / cp.F
    const ox = b.left - (cp.pad / dpr) * k
    const oy = b.top - (cp.pad / dpr) * k
    const p = s.reduced || s.scanAt < 0 ? 1 : clamp((now - s.scanAt) / SCAN_MS, 0, 1)
    const reveal = b.top + b.F * 1.02 * easeInOut(p)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, cv.width / dpr, reveal)
    ctx.clip()
    // echoes, outermost first, behind the body
    for (let a = 0; a < cp.arms.length; a++) {
      const arm = cp.arms[a]
      const st = arm.dir < 0 ? s.l : s.r
      const px = ox + (arm.px / dpr) * k
      const py = oy + (arm.py / dpr) * k
      for (let i = Math.min(arm.gens.length - 1, s.n); i >= 1; i--) {
        const ang = st[i] ? st[i].x : 0
        const opened = Math.abs(ang) / Math.max(1, i * s.step * 0.6)
        if (Math.abs(ang) < 0.4) continue
        const spr = arm.gens[i]
        const sc = echoScale(i, opened) * k
        ctx.save()
        ctx.translate(px, py)
        ctx.rotate((ang * Math.PI) / 180)
        ctx.scale(sc, sc)
        ctx.drawImage(spr, (arm.ox - arm.px) / dpr, (arm.oy - arm.py) / dpr, spr.width / dpr, spr.height / dpr)
        ctx.restore()
      }
    }
    ctx.drawImage(cp.fig, ox, oy, (cp.fig.width / dpr) * k, (cp.fig.height / dpr) * k)
    ctx.restore()
    if (p > 0 && p < 1) {
      // the copier's lamp, sweeping down
      const x0 = b.left - b.W * 0.9
      const x1 = b.left + b.W * 1.9
      const g = ctx.createLinearGradient(0, reveal - 34, 0, reveal + 10)
      const pc = hexRgb(paper) || [245, 242, 235]
      const rgba = (a: number) => "rgba(" + pc[0] + "," + pc[1] + "," + pc[2] + "," + a + ")"
      g.addColorStop(0, rgba(0))
      g.addColorStop(0.75, rgba(0.55))
      g.addColorStop(0.9, rgba(0.95))
      g.addColorStop(1, rgba(0))
      ctx.fillStyle = g
      ctx.fillRect(x0, reveal - 34, x1 - x0, 44)
    }
  }, [paper, sim])

  // (re)print when the photo lands, the size changes much or the colours change
  React.useEffect(() => {
    if (!img || !(box.F > 40)) return
    const dpr = Math.min(2, typeof devicePixelRatio === "number" && devicePixelRatio > 0 ? devicePixelRatio : 1)
    const cp = copy.current
    if (cp && Math.abs(cp.F - box.F) / cp.F < 0.06 && cp.dpr === dpr && (cp as Copy & { key?: string }).key === ink + paper + gens) return
    const t = setTimeout(
      () => {
        const next = printCopy(img, cfg, box.F, dpr, ink, paper, gens)
        if (!next) {
          onState("error")
          return
        }
        ;(next as Copy & { key?: string }).key = ink + paper + gens
        const first = !copy.current
        copy.current = next
        if (first) onState("ready")
        draw(typeof performance !== "undefined" ? performance.now() : 0)
        wake()
      },
      copy.current ? 140 : 0,
    )
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, box.F, ink, paper, gens])

  // the canvas covers the stage
  React.useLayoutEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dpr = Math.min(2, typeof devicePixelRatio === "number" && devicePixelRatio > 0 ? devicePixelRatio : 1)
    cv.width = Math.max(1, Math.round(w * dpr))
    cv.height = Math.max(1, Math.round(h * dpr))
    draw(typeof performance !== "undefined" ? performance.now() : 0)
  }, [w, h, box.F, box.left, draw])

  React.useEffect(() => {
    drawRef.current = draw
    return () => {
      if (drawRef.current === draw) drawRef.current = null
    }
  }, [draw, drawRef])

  return <canvas ref={canvasRef} className="sdf-photo" role="img" aria-label={cfg.alt || ""} />
}

/* ---------------------------------------------------------------- component */

const DEFAULT_FIGURE: StrobeFigure = {
  src: "https://images.unsplash.com/photo-1654787616600-59ce4b023edf?w=1200&q=80&fm=jpg&fit=max",
  alt: "A dancer in a black gown and a beaded cape, arms raised over her head",
  ratio: 1000 / 1499,
  crop: [0.29, 0.045, 0.71, 0.845],
  head: [0.47, 0.215],
  backdrop: "light",
  arms: [
    {
      pivot: [0.342, 0.188],
      outline: [[0.312, 0.19], [0.328, 0.15], [0.4, 0.088], [0.45, 0.055], [0.5, 0.058], [0.518, 0.074], [0.505, 0.096], [0.46, 0.106], [0.405, 0.135], [0.362, 0.188], [0.345, 0.21]],
    },
    {
      pivot: [0.668, 0.19],
      outline: [[0.698, 0.185], [0.672, 0.138], [0.62, 0.098], [0.565, 0.068], [0.515, 0.068], [0.498, 0.088], [0.53, 0.104], [0.58, 0.122], [0.628, 0.162], [0.652, 0.205], [0.68, 0.212]],
    },
  ],
}

/** The drawn figure's own proportions, for when there is no photograph. */
const DRAWN = { aspect: 400 / 820, head: 0.26 }

export default function StrobeDivaFooter({
  wordmark = "ARDENTE",
  mark,
  sealText = "Ardente · Maison de couture ·",
  established = "1978",
  barcode = "7736831210",
  columns = DEFAULT_COLUMNS,
  copyright = "© 2026 Maison Ardente",
  legalLinks = DEFAULT_LEGAL_LINKS,
  backToTop = true,
  onBackToTop,
  figure = DEFAULT_FIGURE,
  arms = 7,
  fanStep = 19,
  preset = "crimson",
  palette,
  grit = 0.6,
  grain: grainAmount = 0.16,
  interactive = true,
  labels,
  fontFamily = DISPLAY_FONT,
  monoFamily = MONO_FONT,
  height = "100svh",
  className = "",
}: StrobeDivaFooterProps) {
  const pal = { ...(PRESETS[preset] || PRESETS.crimson), ...(palette || {}) }
  const text = {
    established: "Est.",
    backToTop: "Back to top",
    replay: "Replay the entrance",
    ...(labels || {}),
  }
  const initial = mark ?? (wordmark.trim().charAt(0) || "A").toUpperCase()
  const reduced = useReducedMotion()
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const id = "sdf" + uid
  const echoes = Math.max(0, Math.min(10, Math.round(arms)))

  const rootRef = React.useRef(null as HTMLElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const bandRef = React.useRef(null as HTMLDivElement | null)
  const discRef = React.useRef(null as HTMLButtonElement | null)
  const lensRef = React.useRef(null as SVGRadialGradientElement | null)
  const armRefs = React.useRef({ l: [], r: [] } as ArmRefs)
  const drawRef = React.useRef(null as ((now: number) => void) | null)

  const [layout, setLayout] = React.useState("wide")
  const [size, setSize] = React.useState({ w: 0, h: 0 })
  const [seen, setSeen] = React.useState(false)
  const [run, setRun] = React.useState(0)
  const [pulse, setPulse] = React.useState(0)
  const [photo, setPhoto] = React.useState(figure ? "loading" : "none")

  React.useEffect(() => setPhoto(figure ? "loading" : "none"), [figure?.src])

  // layout mode from the footer's own width; stage size for the figure, sun and band
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    const measure = () => {
      const w = root.clientWidth
      setLayout(w < 720 ? "narrow" : w < 1040 ? "mid" : "wide")
      setSize({ w: stage.clientWidth, h: stage.clientHeight })
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])

  // the entrance plays once the footer is actually on screen
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setSeen(true)
      },
      { threshold: 0.2 },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  const narrow = layout === "narrow"
  const usePhoto = !!figure && photo !== "error"
  const crop = figure?.crop || [0, 0, 1, 1]
  const ratio = figure?.ratio || 2 / 3
  const aspect = usePhoto ? ((crop[2] - crop[0]) * ratio) / (crop[3] - crop[1]) : DRAWN.aspect
  const headY = usePhoto ? ((figure?.head?.[1] ?? 0.2) - crop[1]) / (crop[3] - crop[1]) : DRAWN.head
  const headX = usePhoto ? ((figure?.head?.[0] ?? 0.5) - crop[0]) / (crop[2] - crop[0]) : 0.5
  const m = figureBox(size.w, size.h, aspect, headY, narrow)
  const discLeft = m.left + m.W * headX

  // ---- the wheel of echo arms: springs driven by the pointer and the storyboard
  const sim = React.useRef({ l: [], r: [], swing: 0, spread: 1, openAt: -1, scanAt: -1, raf: 0, last: 0, visible: true, reduced: false, step: fanStep, n: echoes } as Sim)
  sim.current.reduced = reduced
  sim.current.step = fanStep
  sim.current.n = echoes

  const wake = React.useCallback(() => {
    const s = sim.current
    if (s.raf || typeof requestAnimationFrame === "undefined") return
    s.last = 0
    const frame = (now: number) => {
      s.raf = 0
      const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 1 / 60
      s.last = now
      const refs = armRefs.current
      let moving = false
      for (let i = 0; i <= s.n; i++) {
        const open = s.openAt >= 0 && now >= s.openAt + i * STORY.armStep
        const tl = armAngle(i, -1, s.step, s.spread, s.swing, open)
        const tr = armAngle(i, 1, s.step, s.spread, s.swing, open)
        if (!s.l[i]) s.l[i] = { x: 0, v: 0 }
        if (!s.r[i]) s.r[i] = { x: 0, v: 0 }
        if (s.reduced) {
          s.l[i] = { x: tl, v: 0 }
          s.r[i] = { x: tr, v: 0 }
        } else {
          // sub-steps keep the stiff springs stable at low frame rates
          const k = stiffness(i)
          let a = s.l[i]
          let b = s.r[i]
          for (let q = 0; q < 3; q++) {
            const la = springStep(a.x, a.v, tl, k, 0.72, dt / 3)
            const lb = springStep(b.x, b.v, tr, k, 0.72, dt / 3)
            a = { x: la[0], v: la[1] }
            b = { x: lb[0], v: lb[1] }
          }
          s.l[i] = a
          s.r[i] = b
        }
        if (!settled(s.l[i].x, s.l[i].v, tl) || !settled(s.r[i].x, s.r[i].v, tr)) moving = true
        if (s.openAt >= 0 && now < s.openAt + i * STORY.armStep) moving = true
        // the drawn figure: left arms turn in their own frame, right arms are mirrored
        const gl = refs.l[i]
        const gr = refs.r[i]
        if (gl) gl.setAttribute("transform", "rotate(" + s.l[i].x.toFixed(3) + " 158 268)")
        if (gr) gr.setAttribute("transform", "rotate(" + (-s.r[i].x).toFixed(3) + " 158 268)")
      }
      if (s.scanAt >= 0 && !s.reduced && now < s.scanAt + SCAN_MS + 40) moving = true
      if (s.openAt < 0 && s.scanAt >= 0 && now < s.scanAt + SCAN_MS) moving = true
      if (drawRef.current) drawRef.current(now)
      if (moving && s.visible) s.raf = requestAnimationFrame(frame)
    }
    s.raf = requestAnimationFrame(frame)
  }, [])

  // the storyboard: print the figure, then fan the echoes out (again on every replay)
  React.useEffect(() => {
    if (!seen) return
    if (usePhoto && photo !== "ready") return
    const s = sim.current
    const now = typeof performance !== "undefined" ? performance.now() : 0
    if (reduced) {
      s.scanAt = -1
      s.openAt = now
    } else {
      s.scanAt = now + (run ? 60 : STORY.figure)
      s.openAt = usePhoto ? s.scanAt + SCAN_MS * 0.78 : now + STORY.figure + 440
    }
    wake()
    // keep the loop alive through the lead-in, while nothing is moving yet
    const t = setTimeout(wake, Math.max(0, s.scanAt - now))
    const t2 = setTimeout(wake, Math.max(0, s.openAt - now))
    return () => {
      clearTimeout(t)
      clearTimeout(t2)
    }
  }, [seen, run, reduced, photo, usePhoto, wake])

  // sleep off-screen; the loop stops on its own once every spring is still
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        sim.current.visible = e.isIntersecting
        if (e.isIntersecting) wake()
      }
    })
    io.observe(root)
    return () => io.disconnect()
  }, [wake])

  React.useEffect(() => {
    const s = sim.current
    return () => {
      if (s.raf) cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [])

  // pointer: turns the wheel, parallaxes the sun, polishes the print
  React.useEffect(() => {
    const stage = stageRef.current
    const band = bandRef.current
    if (!stage || !band || !interactive) return
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return
      const nx = (e.clientX - r.left) / r.width
      const ny = (e.clientY - r.top) / r.height
      const d = pointerDrive(nx, ny)
      sim.current.swing = d.swing
      sim.current.spread = d.spread
      wake()
      const disc = discRef.current
      if (disc && !sim.current.reduced) {
        disc.style.setProperty("--sdf-dx", ((0.5 - nx) * r.width * 0.03).toFixed(1) + "px")
        disc.style.setProperty("--sdf-dy", ((0.5 - ny) * r.height * 0.03).toFixed(1) + "px")
      }
      const b = band.getBoundingClientRect()
      const g = lensRef.current
      const inside = e.clientY >= b.top && e.clientY <= b.bottom
      if (g) {
        g.setAttribute("cx", (e.clientX - b.left).toFixed(1))
        g.setAttribute("cy", (e.clientY - b.top).toFixed(1))
      }
      band.setAttribute("data-lens", inside ? "1" : "0")
    }
    const onLeave = () => {
      sim.current.swing = 0
      sim.current.spread = 1
      wake()
      const disc = discRef.current
      if (disc) {
        disc.style.setProperty("--sdf-dx", "0px")
        disc.style.setProperty("--sdf-dy", "0px")
      }
      band.setAttribute("data-lens", "0")
    }
    stage.addEventListener("pointermove", onMove)
    stage.addEventListener("pointerleave", onLeave)
    return () => {
      stage.removeEventListener("pointermove", onMove)
      stage.removeEventListener("pointerleave", onLeave)
    }
  }, [interactive, wake])

  const replay = () => {
    const s = sim.current
    // clap: every echo back behind the real arm, then the copier prints her again
    s.openAt = -1
    for (const a of s.l) {
      a.x = 0
      a.v = 0
    }
    for (const a of s.r) {
      a.x = 0
      a.v = 0
    }
    setPulse((p) => p + 1)
    setRun((r) => r + 1)
    setSeen(true)
  }

  const toTop = () => {
    if (onBackToTop) onBackToTop()
    else if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
  }

  const style = {
    "--sdf-paper": pal.paper,
    "--sdf-ink": pal.ink,
    "--sdf-accent": pal.accent,
    "--sdf-display": fontFamily,
    "--sdf-mono": monoFamily,
    "--sdf-grain": String(clamp(grainAmount, 0, 1)),
    height,
    minHeight: "640px",
  } as React.CSSProperties

  const stageStyle = {
    "--sdf-fig": m.F.toFixed(1) + "px",
    "--sdf-disc": m.disc.toFixed(1) + "px",
    "--sdf-disc-top": m.discTop.toFixed(1) + "px",
    "--sdf-disc-left": discLeft.toFixed(1) + "px",
    "--sdf-band": m.band.toFixed(1) + "px",
  } as React.CSSProperties

  const delay = (ms: number) => ({ ["--d" as string]: ms + "ms" }) as React.CSSProperties
  const left = columns.slice(0, Math.ceil(columns.length / 2))
  const right = columns.slice(Math.ceil(columns.length / 2))
  const floorLines: number[] = []
  for (let x = -60; x <= 160; x += 11) floorLines.push(x)

  return (
    <footer
      ref={rootRef}
      className={"sdf " + className}
      style={style}
      data-layout={layout}
      data-seen={seen ? "1" : "0"}
      aria-label={wordmark + " footer"}
    >
      <style dangerouslySetInnerHTML={{ __html: SDF_CSS }} />

      <div className="sdf-head">
        <div className="sdf-ent" style={delay(STORY.head)}>
          <Seal id={id} text={sealText} mark={initial} />
        </div>
        <div className="sdf-year sdf-ent" style={delay(STORY.head + 60)}>
          {text.established}
          <b>{established}</b>
        </div>
        <Barcode digits={barcode} seen={seen} />
      </div>

      <div ref={stageRef} className="sdf-stage" style={stageStyle}>
        <button
          key={"disc" + run}
          ref={discRef}
          type="button"
          className="sdf-disc sdf-ent-disc"
          style={delay(STORY.disc)}
          data-pulse={pulse > 0 ? "1" : "0"}
          aria-label={text.replay}
          onClick={replay}
        >
          <svg aria-hidden="true" focusable="false">
            <filter id={id + "-sun"} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="5" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 -0.2" />
            </filter>
            <rect width="100%" height="100%" fill={pal.ink} filter={"url(#" + id + "-sun)"} opacity="0.28" />
          </svg>
        </button>

        <div ref={bandRef} className="sdf-band" data-lens="0">
          <Wordmark id={id} word={wordmark} font={fontFamily} w={size.w} h={m.band} grit={grit} lensRef={lensRef} run={run} />
        </div>

        {usePhoto && figure ? (
          <PhotoFigure
            cfg={figure}
            box={m}
            w={size.w}
            h={size.h}
            ink={pal.figure}
            paper={pal.figureLight}
            gens={echoes}
            sim={sim}
            drawRef={drawRef}
            onState={(st) => setPhoto(st)}
            wake={wake}
          />
        ) : (
          <div key={"fig" + run} className="sdf-figure sdf-ent-fig" style={delay(STORY.figure)}>
            <Figure id={id} arms={echoes} color={pal.figure} light={pal.figureLight} mark={initial} refs={armRefs.current} />
          </div>
        )}

        {!narrow ? (
          <>
            <nav className="sdf-flank sdf-flank-l sdf-ent" style={delay(STORY.columns)} aria-label="Footer links">
              {left.map((c, i) => (
                <Column key={i} col={c} />
              ))}
            </nav>
            <nav className="sdf-flank sdf-flank-r sdf-ent" style={delay(STORY.columns + 80)} aria-label="More footer links">
              {right.map((c, i) => (
                <Column key={i} col={c} />
              ))}
            </nav>
          </>
        ) : null}
      </div>

      {narrow ? (
        <nav className="sdf-cols" aria-label="Footer links">
          {columns.map((c, i) => (
            <Column key={i} col={c} />
          ))}
        </nav>
      ) : null}

      <div className="sdf-legal">
        <svg className="sdf-floor" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {floorLines.map((x) => (
            <line key={x} x1="50" y1="-34" x2={x} y2="10" />
          ))}
        </svg>
        <span className="sdf-ent" style={delay(STORY.legal)}>
          {copyright}
        </span>
        {legalLinks.length ? (
          <ul className="sdf-legal-links sdf-ent" style={delay(STORY.legal + 60)}>
            {legalLinks.map((l, i) => (
              <li key={i}>
                <a href={l.href || "#"}>{l.label}</a>
              </li>
            ))}
          </ul>
        ) : null}
        {backToTop ? (
          <button type="button" className="sdf-top sdf-ent" style={delay(STORY.legal + 120)} onClick={toTop}>
            {text.backToTop}
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>

      <p className="sdf-sr">{wordmark}</p>

      <svg className="sdf-grain" aria-hidden="true" focusable="false">
        <filter id={id + "-grain"} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="9" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter={"url(#" + id + "-grain)"} />
      </svg>
    </footer>
  )
}

/* ---------------------------------------------------------------- types */

export type StrobeLink = { label: string; href?: string; external?: boolean }
export type StrobeColumn = { title: string; links: StrobeLink[] }
export type StrobePalette = {
  /** The top half and the small type on the band. */
  paper: string
  /** The band, the floor and the small type on the paper. */
  ink: string
  /** The sun and the wordmark. */
  accent: string
  /** The figure's ink (hex). */
  figure: string
  /** The figure's paper and its cut-out rim (hex). */
  figureLight: string
}
export type StrobeLabels = { established: string; backToTop: string; replay: string }

/** A photograph to print as the figure. All points are 0–1 of the photo's width and height. */
export type StrobeFigure = {
  /** Needs CORS (images.unsplash.com has it), so the pixels can be read. */
  src: string
  alt?: string
  /** The photo's width / height, so the layout is right before it loads. */
  ratio?: number
  /** The person: [left, top, right, bottom]. The bottom edge stands on the floor. */
  crop?: [number, number, number, number]
  /** The head: the sun centres on it. */
  head?: [number, number]
  /** What to key out: a plain light ("light") or dark ("dark") backdrop. */
  backdrop?: "light" | "dark"
  /** Copier contrast midpoint, 0–1. Higher prints darker. Default 0.46. */
  tone?: number
  /** Arms to clone into the wheel: each turns about its `pivot` (the shoulder). */
  arms?: { pivot: [number, number]; outline: [number, number][] }[]
}

export type StrobeDivaFooterProps = {
  /** The giant word in the band. Short, all caps, reads best. */
  wordmark?: string
  /** The initial in the seal. Defaults to the wordmark's first letter. */
  mark?: string
  /** Text running round the seal. */
  sealText?: string
  /** The founding year under "Est." */
  established?: string
  /** Digits for the barcode, top right. */
  barcode?: string
  /** Link columns: the first half in the left flank, the rest in the right. */
  columns?: StrobeColumn[]
  copyright?: string
  legalLinks?: StrobeLink[]
  backToTop?: boolean
  onBackToTop?: () => void
  /** The photograph, printed as a photocopy. `null` uses the drawn figure. */
  figure?: StrobeFigure | null
  /** Echo arms per side, 0–10. */
  arms?: number
  /** Degrees between echoes. */
  fanStep?: number
  preset?: "crimson" | "midnight" | "cobalt" | "gilt"
  palette?: Partial<StrobePalette>
  /** How distressed the wordmark prints, 0–1. */
  grit?: number
  /** Film grain over the whole footer, 0–1. */
  grain?: number
  /** Pointer response: the wheel, the sun's parallax and the lens. */
  interactive?: boolean
  labels?: Partial<StrobeLabels>
  /** The wordmark face. Any heavy sans is stretched to fill the band. */
  fontFamily?: string
  /** The face for the small type. */
  monoFamily?: string
  /** A definite length, never a percentage. Phones size to content. */
  height?: string
  className?: string
}
