"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Seraph Foundry Template — a launch page for a display typeface, printed in
 * two riso inks.
 *
 * The page is a type specimen a foundry would actually ship: a hero set in
 * the face, the face in use on a record sleeve, a live tester, a glyph
 * inspector, licensing with a running total, and a closing "Thank You" plate.
 * Everything speaks one visual language: hot-pink line engravings, navy ink
 * on grey paper, calligraphic swashes, four-point stars.
 *
 * - The engravings are real photographs, re-cut at runtime into pink line
 *   engravings on a canvas (a tonal line pass plus a cross-hatch for the
 *   shadows, then riso speckle). Swap any photo through `images`.
 * - The swashes are broad-nib strokes computed from a centreline, so thick
 *   and thin fall where a pen would put them, at any size.
 * - The display face is variable: the hero thickens as you scroll past it,
 *   letters swell under the pointer, and the tester and inspector drive its
 *   weight axis directly.
 * - GSAP ScrollTrigger runs the choreography; sticky stages (not pin
 *   spacers) hold the record sleeve while it plays out.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

// ---- public types ---------------------------------------------------------------

export type SeraphPreset = "riso" | "verdigris" | "ember"

export type SeraphColors = {
  /** Page paper. */
  paper?: string
  /** Main ink: type, rules, the dark bands. */
  ink?: string
  /** Second ink: engravings, stars, accents. */
  accent?: string
  /** The pale band behind the hero headline. */
  tint?: string
  /** Highlight letters inside the headline. */
  blue?: string
}

export type SeraphArt = {
  src: string
  /** Where the crop centres, 0–1 on each axis. Default [0.5, 0.5]. */
  focus?: [number, number]
  /** Input black and white points for the engraving, 0–1. Default [0.12, 0.9]. */
  levels?: [number, number]
  alt?: string
}

export type SeraphImages = {
  /** Hero crest, left of the headline. */
  crest?: string | SeraphArt
  /** The record sleeve artwork. */
  sleeve?: string | SeraphArt
  /** The ornament behind the sleeve on the dark band. */
  ornament?: string | SeraphArt
  /** The figure in the closing plate. */
  angel?: string | SeraphArt
}

export type SeraphTypeface = {
  /** Name of the face being sold. */
  name?: string
  /** Who made it. */
  foundry?: string
  /** CSS font-family stack for the display face (a variable font with a wght axis reads best). */
  family?: string
  /** CSS font-family stack for labels and body copy. */
  labelFamily?: string
  /** How many glyphs to brag about. */
  glyphs?: number
  /** The weight axis range. */
  weights?: [number, number]
}

export type SeraphHero = {
  kicker?: string
  sub?: string
  /** Headline lines. Wrap letters in [brackets] to print them in the highlight ink. */
  lines?: string[]
  credit?: string
  note?: string
}

export type SeraphPressing = { title: string; kicker: string; label: string }

export type SeraphLicense = { id: string; name: string; blurb: string; price: number; unit: string }

export type SeraphOrder = { licenses: string[]; seats: number; total: number; currency: string }

export type SeraphFoundryTemplateProps = {
  /** Height of one stage (hero, sleeve, finale). Must be a definite length. */
  height?: string
  preset?: SeraphPreset
  colors?: SeraphColors
  /** "auto" follows a `.dark` ancestor. */
  theme?: "auto" | "light" | "dark"
  typeface?: SeraphTypeface
  /** Stylesheet for the fonts; null loads nothing and uses the stacks as they are. */
  fontHref?: string | null
  hero?: SeraphHero
  pressings?: SeraphPressing[]
  /** Phrases offered in the tester. The first one is set on load. */
  samples?: string[]
  licenses?: SeraphLicense[]
  currency?: string
  images?: SeraphImages
  /** Re-cut photos as line engravings. Off shows them as a flat duotone. */
  engrave?: boolean
  closing?: { kicker?: string; title?: string; vertical?: string }
  onBuy?: (order: SeraphOrder) => void
  className?: string
}

// ---- defaults ---------------------------------------------------------------------

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@100..900&family=Poppins:wght@400;500;600;700&display=swap"

const DISPLAY = '"Grenze Gotisch", "UnifrakturMaguntia", "Old English Text MT", "Palatino Linotype", Georgia, serif'
const LABEL = 'Poppins, "Avenir Next", "Helvetica Neue", Arial, sans-serif'

const PALETTES = {
  riso: { paper: "#e7e4df", ink: "#28287a", accent: "#ec1e63", tint: "#f4adc7", blue: "#4c5ccb" },
  verdigris: { paper: "#e5e6de", ink: "#0f3f3a", accent: "#ef4f23", tint: "#f6bba2", blue: "#2a8576" },
  ember: { paper: "#ece5d8", ink: "#3a0d1b", accent: "#f2780f", tint: "#f8cd98", blue: "#9a2a40" },
}

const U = (id: string, w: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&q=80"

const DEFAULT_IMAGES = {
  crest: { src: U("1561084763-cf94ae5d59ac", 1400), focus: [0.5, 0.35], levels: [0.08, 0.86], alt: "A winged stone figure with a skull for a face" },
  sleeve: { src: U("1565854713475-6e297773a53f", 1200), focus: [0.5, 0.3], levels: [0.04, 0.74], alt: "The Trevi Fountain: an arch flanked by statues" },
  ornament: { src: U("1565123005357-a99c149b7dbe", 1200), focus: [0.5, 0.4], levels: [0.06, 0.8], alt: "Baroque fountain statues in a niche" },
  angel: { src: U("1758651794755-465d25631649", 1400), focus: [0.5, 0.3], levels: [0.2, 0.86], alt: "A marble angel with open wings against the sky" },
}

const DEFAULT_HERO = {
  kicker: "Shadow & Deadsky",
  sub: "Throne of transformation",
  lines: ["Gr[an]der", "the", "He[av]en"],
  credit: "Originally designed by",
  note:
    "A realm where the sky itself bends under the weight of fate, and the gods whisper through shadow and starfire. It is not a place of ending, it is a throne of transformation.",
}

const DEFAULT_PRESSINGS = [
  { title: "Burnout", kicker: "Mythical Symbols", label: "URN" },
  { title: "Requiem", kicker: "Hymns for Ruin", label: "QUI" },
  { title: "Halcyon", kicker: "Seven Seraphs", label: "LCY" },
]

const DEFAULT_SAMPLES = [
  "Sing of thrones and starfire",
  "Grander the Heaven",
  "Burnout & Requiem, 1987",
  "Abcdefghijklmnopqrstuvwxyz",
]

const DEFAULT_LICENSES = [
  { id: "desktop", name: "Desktop", blurb: "Install it on workstations. Print, packaging, merch and logos.", price: 49, unit: "per workstation tier" },
  { id: "web", name: "Web", blurb: "Self-host the WOFF2 on one domain, up to 50k monthly views.", price: 69, unit: "per domain" },
  { id: "app", name: "App", blurb: "Embed it in one iOS, Android or desktop application.", price: 129, unit: "per title" },
]

const SEAT_TIERS = [1, 3, 5, 10, 25]

const GLYPH_SETS = [
  { id: "upper", label: "Uppercase", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { id: "lower", label: "Lowercase", chars: "abcdefghijklmnopqrstuvwxyz" },
  { id: "figures", label: "Figures", chars: "0123456789$€£¥%#" },
  { id: "marks", label: "Marks", chars: "&?!@*()[]{}«»§¶†‡" },
  { id: "extended", label: "Extended", chars: "ÀÁÂÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÖØŒÙÚÛÜßæœ" },
]

// ---- logic (lifted into tests) ----------------------------------------------------

// #region split
/** "Gr[an]der" → letters, with the bracketed ones flagged for the highlight ink. */
function splitMarked(line: string) {
  const out: { ch: string; hi: boolean }[] = []
  let hi = false
  for (const ch of line) {
    if (ch === "[") hi = true
    else if (ch === "]") hi = false
    else out.push({ ch, hi })
  }
  return out
}
function plainText(line: string) {
  return line.replace(/[[\]]/g, "")
}
// #endregion

// #region nib
type Pt = [number, number]

/** Uniform Catmull–Rom through the points, `per` samples per segment. */
function spline(pts: Pt[], per: number) {
  const out: Pt[] = []
  const n = pts.length
  if (n < 2) return pts.slice()
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(n - 1, i + 2)]
    for (let s = 0; s < per; s++) {
      const t = s / per
      const t2 = t * t
      const t3 = t2 * t
      const at = (k: number) =>
        0.5 *
        (2 * p1[k] +
          (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)
      out.push([at(0), at(1)])
    }
  }
  out.push([pts[n - 1][0], pts[n - 1][1]])
  return out
}

type NibOpts = { width: number; angle: number; min: number; taper: number; per?: number }

const r1 = (n: number) => String(Math.round(n * 10) / 10)

/**
 * A broad-nib stroke along a centreline. The nib is a flat edge held at
 * `angle`, so the stroke is widest where it travels across the nib and a
 * hairline where it travels along it; both ends taper. Returns the filled
 * outline, the centreline (for the draw-on mask) and its length.
 */
function nibStroke(pts: Pt[], o: NibOpts) {
  const c = spline(pts, o.per ?? 20)
  const m = c.length
  const acc = new Float64Array(m)
  for (let i = 1; i < m; i++) acc[i] = acc[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1])
  const L = acc[m - 1] || 1
  const left: string[] = []
  const right: string[] = []
  const widths: number[] = []
  for (let i = 0; i < m; i++) {
    const a = c[Math.max(0, i - 1)]
    const b = c[Math.min(m - 1, i + 1)]
    let tx = b[0] - a[0]
    let ty = b[1] - a[1]
    const tl = Math.hypot(tx, ty) || 1
    tx /= tl
    ty /= tl
    const u = acc[i] / L
    const end = Math.max(0, Math.min(1, u / o.taper, (1 - u) / o.taper))
    const w =
      o.width * (o.min + (1 - o.min) * Math.abs(Math.sin(Math.atan2(ty, tx) - o.angle))) * (0.2 + 0.8 * Math.sqrt(end))
    widths.push(w)
    const h = w / 2
    left.push(r1(c[i][0] - ty * h) + "," + r1(c[i][1] + tx * h))
    right.push(r1(c[i][0] + ty * h) + "," + r1(c[i][1] - tx * h))
  }
  right.reverse()
  return {
    d: "M" + left.join("L") + "L" + right.join("L") + "Z",
    line: "M" + c.map((p) => r1(p[0]) + "," + r1(p[1])).join("L"),
    length: L,
    start: c[0],
    end: c[m - 1],
    widths,
  }
}

/** Four-point star with concave sides, centred on 0,0, radius r. */
function starPath(r: number, pinch = 0.16) {
  const p = r * pinch
  return (
    "M0," + r1(-r) +
    "C" + r1(p) + "," + r1(-p) + " " + r1(p) + "," + r1(-p) + " " + r1(r) + ",0" +
    "C" + r1(p) + "," + r1(p) + " " + r1(p) + "," + r1(p) + " 0," + r1(r) +
    "C" + r1(-p) + "," + r1(p) + " " + r1(-p) + "," + r1(p) + " " + r1(-r) + ",0" +
    "C" + r1(-p) + "," + r1(-p) + " " + r1(-p) + "," + r1(-p) + " 0," + r1(-r) + "Z"
  )
}
// #endregion

// #region engrave
function levels(v: number, lo: number, hi: number) {
  return Math.min(1, Math.max(0, (v - lo) / Math.max(1e-6, hi - lo)))
}

/** Ink a line carries at luminance l: 0 is bare paper, 1 fills the line's pitch. */
function coverage(l: number, threshold: number, gamma: number) {
  if (l >= threshold) return 0
  return Math.pow(1 - l / threshold, gamma)
}

/**
 * RGBA pixels → a luminance grid in 0–1 with levels applied, faded to white
 * towards an elliptical edge so the cut sits on the paper like a vignette.
 */
function toneGrid(rgba: ArrayLike<number>, gw: number, gh: number, lo: number, hi: number, fade: number) {
  const out = new Float32Array(gw * gh)
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x
      const l = (0.2126 * rgba[i * 4] + 0.7152 * rgba[i * 4 + 1] + 0.0722 * rgba[i * 4 + 2]) / 255
      let v = levels(l, lo, hi)
      if (fade > 0) {
        const ex = (x / Math.max(1, gw - 1) - 0.5) * 2
        const ey = (y / Math.max(1, gh - 1) - 0.5) * 2
        const e = Math.hypot(ex, ey)
        const k = Math.min(1, Math.max(0, (e - (1 - fade)) / fade))
        const s = k * k * (3 - 2 * k)
        v = v + (1 - v) * s
      }
      out[i] = v
    }
  }
  return out
}

function sampleLum(lum: Float32Array, gw: number, gh: number, x: number, y: number) {
  const x0 = Math.max(0, Math.min(gw - 1, Math.floor(x)))
  const y0 = Math.max(0, Math.min(gh - 1, Math.floor(y)))
  const x1 = Math.min(gw - 1, x0 + 1)
  const y1 = Math.min(gh - 1, y0 + 1)
  const fx = Math.max(0, Math.min(1, x - x0))
  const fy = Math.max(0, Math.min(1, y - y0))
  const a = lum[y0 * gw + x0] + (lum[y0 * gw + x1] - lum[y0 * gw + x0]) * fx
  const b = lum[y1 * gw + x0] + (lum[y1 * gw + x1] - lum[y1 * gw + x0]) * fx
  return a + (b - a) * fy
}

type EngraveOpts = {
  /** Distance between lines, field px. */
  spacing: number
  /** Line direction, radians. */
  angle: number
  /** Luminance above which a line carries no ink. */
  threshold: number
  gamma: number
  /** How far dark tones push a line off its course, in pitches. */
  bend: number
  /** Sample step along a line, field px. */
  step: number
  /** Share of the pitch a fully dark line fills. */
  fill: number
}

/**
 * Line-engrave a luminance grid onto a W×H field. Each run is a ribbon of
 * [x+, y+, x−, y−] pairs along one line, broken wherever the tone is too pale
 * to carry ink, so paper stays clean paper.
 */
function engrave(lum: Float32Array, gw: number, gh: number, W: number, H: number, o: EngraveOpts) {
  const runs: Float32Array[] = []
  const ca = Math.cos(o.angle)
  const sa = Math.sin(o.angle)
  const R = Math.hypot(W, H) / 2
  const cx = W / 2
  const cy = H / 2
  for (let k = -R; k <= R; k += o.spacing) {
    let cur: number[] = []
    const flush = () => {
      if (cur.length >= 8) runs.push(Float32Array.from(cur))
      cur = []
    }
    for (let t = -R; t <= R; t += o.step) {
      const bx = cx + ca * t - sa * k
      const by = cy + sa * t + ca * k
      if (bx < 0 || by < 0 || bx > W || by > H) {
        flush()
        continue
      }
      const l = sampleLum(lum, gw, gh, (bx / W) * (gw - 1), (by / H) * (gh - 1))
      const c = coverage(l, o.threshold, o.gamma)
      if (c < 0.035) {
        flush()
        continue
      }
      const off = (0.5 - l) * o.bend * o.spacing
      const px = bx - sa * off
      const py = by + ca * off
      const h = (c * o.spacing * o.fill) / 2
      cur.push(px - sa * h, py + ca * h, px + sa * h, py - ca * h)
    }
    flush()
  }
  return runs
}

/** Seeded PRNG, so a cut speckles the same way on every redraw. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// #endregion

// #region license
function seatMultiplier(seats: number) {
  if (seats <= 1) return 1
  if (seats <= 3) return 2
  if (seats <= 5) return 3
  if (seats <= 10) return 5
  return 9
}

function orderTotal(prices: number[], seats: number) {
  const sum = prices.reduce((a, b) => a + b, 0)
  const bundle = prices.length >= 3 ? 0.8 : prices.length === 2 ? 0.9 : 1
  return Math.round(sum * seatMultiplier(seats) * bundle)
}
// #endregion

// ---- small pieces -------------------------------------------------------------------

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function Star({ size = 24, ring = false, className = "", style }: { size?: number; ring?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={"sft-star " + className} width={size} height={size} viewBox="-12 -12 24 24" aria-hidden="true" style={style}>
      {ring && <circle r="5.2" fill="none" stroke="currentColor" strokeWidth="1.1" />}
      <path d={starPath(11.5, 0.12)} fill="currentColor" />
    </svg>
  )
}

function Arrows({ n = 3, className = "" }: { n?: number; className?: string }) {
  return (
    <span className={"sft-arrows " + className} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} viewBox="0 0 12 12" width="12" height="12">
          <path d="M2 2 L10 10 M10 3.5 V10 H3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
      ))}
    </span>
  )
}

function Barcode({ seed = 7 }: { seed?: number }) {
  const r = rng(seed)
  const bars: { x: number; w: number }[] = []
  let x = 0
  while (x < 46) {
    const w = r() < 0.4 ? 2.2 : 1
    bars.push({ x, w })
    x += w + (r() < 0.5 ? 1.4 : 2.4)
  }
  return (
    <svg className="sft-barcode" viewBox="0 0 48 16" width="48" height="16" aria-hidden="true">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height="16" fill="currentColor" />
      ))}
    </svg>
  )
}

function Globe() {
  return (
    <svg viewBox="0 0 28 16" width="28" height="16" aria-hidden="true" className="sft-globe">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="7" cy="8" r="6.5" />
        <ellipse cx="7" cy="8" rx="3" ry="6.5" />
        <path d="M0.5 8h13M1.6 4.5h10.8M1.6 11.5h10.8" />
        <circle cx="21" cy="8" r="6.5" />
        <ellipse cx="21" cy="8" rx="3" ry="6.5" />
        <path d="M14.5 8h13M15.6 4.5h10.8M15.6 11.5h10.8" />
      </g>
    </svg>
  )
}

function Orbit() {
  return (
    <svg viewBox="-14 -9 28 18" width="28" height="18" aria-hidden="true" className="sft-orbit">
      <g fill="none" stroke="currentColor" strokeWidth="1.1">
        <ellipse rx="12" ry="4.2" transform="rotate(-18)" />
        <ellipse rx="12" ry="4.2" transform="rotate(18)" />
      </g>
      <circle r="1.8" fill="currentColor" />
    </svg>
  )
}

// ---- engraving --------------------------------------------------------------------

function toArt(v: string | SeraphArt | undefined, fallback: SeraphArt): SeraphArt {
  if (!v) return fallback
  if (typeof v === "string") return { src: v }
  return v
}

/**
 * A photo re-cut as a riso line engraving. Draws once per size; a CORS-blocked
 * or failed image (or `engrave={false}`) falls back to a flat duotone of the
 * same photo so the slot is never empty.
 */
function Engraving({
  art,
  ink,
  className = "",
  pitch = 3.4,
  fade = 0.3,
  engrave: on = true,
  seed = 1,
}: {
  art: SeraphArt
  ink: string
  className?: string
  pitch?: number
  fade?: number
  engrave?: boolean
  seed?: number
}) {
  const wrap = React.useRef(null as HTMLDivElement | null)
  const canvas = React.useRef(null as HTMLCanvasElement | null)
  const [state, setState] = React.useState(on ? "idle" : "flat")
  const fx = art.focus ? art.focus[0] : 0.5
  const fy = art.focus ? art.focus[1] : 0.5
  const lo = art.levels ? art.levels[0] : 0.12
  const hi = art.levels ? art.levels[1] : 0.9

  React.useEffect(() => {
    if (!on) {
      setState("flat")
      return
    }
    const el = wrap.current
    const cv = canvas.current
    if (!el || !cv) return
    let alive = true
    let timer = 0
    let lastW = 0
    let lastH = 0
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.decoding = "async"

    const draw = () => {
      if (!alive || !img.naturalWidth) return
      const r = el.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = Math.round(r.width * dpr)
      const H = Math.round(r.height * dpr)
      if (W < 8 || H < 8 || (W === lastW && H === lastH)) return
      lastW = W
      lastH = H
      const gw = Math.max(32, Math.min(520, Math.round(r.width / 1.5)))
      const gh = Math.max(32, Math.round((gw * H) / W))
      const off = document.createElement("canvas")
      off.width = gw
      off.height = gh
      const o = off.getContext("2d", { willReadFrequently: true })
      if (!o) return
      const s = Math.max(gw / img.naturalWidth, gh / img.naturalHeight)
      const dw = img.naturalWidth * s
      const dh = img.naturalHeight * s
      o.fillStyle = "#fff"
      o.fillRect(0, 0, gw, gh)
      o.drawImage(img, (gw - dw) * fx, (gh - dh) * fy, dw, dh)
      let data: Uint8ClampedArray
      try {
        data = o.getImageData(0, 0, gw, gh).data
      } catch {
        setState("flat")
        return
      }
      const lum = toneGrid(data, gw, gh, lo, hi, fade)
      cv.width = W
      cv.height = H
      const c = cv.getContext("2d")
      if (!c) return
      c.clearRect(0, 0, W, H)
      c.fillStyle = ink
      const sp = pitch * dpr
      const paint = (runs: Float32Array[]) => {
        c.beginPath()
        for (const run of runs) {
          c.moveTo(run[0], run[1])
          for (let i = 4; i < run.length; i += 4) c.lineTo(run[i], run[i + 1])
          for (let i = run.length - 2; i >= 0; i -= 4) c.lineTo(run[i], run[i + 1])
          c.closePath()
        }
        c.fill()
      }
      paint(engrave(lum, gw, gh, W, H, { spacing: sp, angle: 0, threshold: 1, gamma: 1.15, bend: 0.9, step: 2 * dpr, fill: 0.94 }))
      paint(engrave(lum, gw, gh, W, H, { spacing: sp * 1.2, angle: -0.95, threshold: 0.34, gamma: 1, bend: 0.25, step: 2 * dpr, fill: 0.72 }))
      // riso speckle: ink that didn't take
      const rand = rng(seed * 977 + W)
      c.globalCompositeOperation = "destination-out"
      c.fillStyle = "#000"
      const n = Math.round((W * H) / (900 * dpr))
      for (let i = 0; i < n; i++) {
        const z = (0.5 + rand() * 1.3) * dpr
        c.globalAlpha = 0.35 + rand() * 0.65
        c.fillRect(rand() * W, rand() * H, z, z)
      }
      c.globalAlpha = 1
      c.globalCompositeOperation = "source-over"
      setState("ready")
    }

    img.onload = () => draw()
    img.onerror = () => alive && setState("flat")
    img.src = art.src
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(draw, 140)
    })
    ro.observe(el)
    return () => {
      alive = false
      ro.disconnect()
      window.clearTimeout(timer)
      img.onload = null
      img.onerror = null
    }
  }, [art.src, ink, on, pitch, fade, fx, fy, lo, hi, seed])

  return (
    <div ref={wrap} className={"sft-engr " + className} data-state={state} role="img" aria-label={art.alt || ""}>
      {state === "flat" && (
        <img className="sft-engr-flat" src={art.src} alt="" style={{ objectPosition: fx * 100 + "% " + fy * 100 + "%" }} />
      )}
      <canvas ref={canvas} className="sft-engr-cv" aria-hidden="true" />
    </div>
  )
}

// ---- swashes --------------------------------------------------------------------------

type Swash = { pts: Pt[]; w: number; dot?: "start" | "end" | "both" }

/** Hero: a curl entering top-left, a long sweep over the top, a tail under the last line. */
const HERO_SWASHES: Swash[] = [
  {
    pts: [[0.12, 0.3], [0.07, 0.33], [0.03, 0.27], [0.06, 0.19], [0.14, 0.2], [0.2, 0.1], [0.4, 0.02], [0.65, 0.0], [0.86, 0.04], [0.97, 0.13], [0.95, 0.21], [0.89, 0.18]],
    w: 0.022,
    dot: "end",
  },
  {
    pts: [[0.2, 0.69], [0.12, 0.74], [0.11, 0.86], [0.2, 0.98], [0.45, 1.02], [0.72, 1.0], [0.92, 0.94], [1.02, 0.82], [0.98, 0.72], [0.92, 0.77]],
    w: 0.02,
    dot: "end",
  },
  { pts: [[0.24, 0.52], [0.33, 0.49], [0.41, 0.51]], w: 0.01, dot: "start" },
  { pts: [[0.6, 0.51], [0.7, 0.48], [0.79, 0.5], [0.82, 0.46]], w: 0.01, dot: "end" },
]

const SLEEVE_SWASHES: Swash[] = [
  { pts: [[0.09, 0.5], [0.02, 0.58], [-0.03, 0.44], [0.02, 0.28], [0.1, 0.3], [0.08, 0.42]], w: 0.06, dot: "start" },
  { pts: [[-0.06, 0.86], [0.2, 1.04], [0.55, 1.07], [0.85, 1.0], [1.03, 0.86], [1.01, 0.68], [0.95, 0.74]], w: 0.07, dot: "end" },
  { pts: [[0.62, 0.0], [0.82, -0.08], [1.0, -0.02], [1.06, 0.16]], w: 0.04, dot: "end" },
]

const CLOSING_SWASHES: Swash[] = [
  {
    pts: [[0.06, 0.48], [0.02, 0.36], [0.08, 0.2], [0.2, 0.08], [0.36, 0.02], [0.55, 0.0], [0.75, 0.04], [0.9, 0.14], [0.96, 0.26]],
    w: 0.045,
    dot: "end",
  },
  { pts: [[0.04, 0.86], [0.2, 0.98], [0.48, 1.02], [0.76, 0.98], [0.98, 0.88], [1.01, 0.76]], w: 0.04, dot: "both" },
]

function Swashes({ set, className = "", nib = 0.32 }: { set: Swash[]; className?: string; nib?: number }) {
  const svg = React.useRef(null as SVGSVGElement | null)
  const [box, setBox] = React.useState([0, 0])
  const uid = "sft" + React.useId().replace(/[^a-zA-Z0-9]/g, "")

  React.useEffect(() => {
    const host = svg.current?.parentElement
    if (!host) return
    const read = () => {
      const r = host.getBoundingClientRect()
      setBox((b) => (Math.abs(b[0] - r.width) < 1 && Math.abs(b[1] - r.height) < 1 ? b : [r.width, r.height]))
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  const strokes = React.useMemo(() => {
    const [W, H] = box
    if (!W || !H) return []
    return set.map((s) => {
      const width = s.w * Math.min(H * 1.6, W)
      const pts = s.pts.map((p) => [p[0] * W, p[1] * H] as Pt)
      return { ...nibStroke(pts, { width, angle: nib, min: 0.1, taper: 0.12 }), width, dot: s.dot }
    })
  }, [box, set, nib])

  return (
    <svg
      ref={svg}
      className={"sft-swashes " + className}
      viewBox={"0 0 " + Math.max(1, box[0]) + " " + Math.max(1, box[1])}
      aria-hidden="true"
    >
      <defs>
        {strokes.map((s, i) => (
          <mask key={i} id={uid + i} maskUnits="userSpaceOnUse" x={-box[0]} y={-box[1]} width={box[0] * 3} height={box[1] * 3}>
            <path
              d={s.line}
              className="sft-swash-mask"
              fill="none"
              stroke="#fff"
              strokeWidth={s.width * 1.6 + 4}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
            />
          </mask>
        ))}
      </defs>
      {strokes.map((s, i) => (
        <g key={i}>
          <path d={s.d} fill="currentColor" mask={"url(#" + uid + i + ")"} />
          {(s.dot === "end" || s.dot === "both") && (
            <circle className="sft-swash-dot" cx={s.end[0]} cy={s.end[1]} r={Math.max(2, s.width * 0.42)} fill="currentColor" />
          )}
          {(s.dot === "start" || s.dot === "both") && (
            <circle className="sft-swash-dot sft-swash-dot-s" cx={s.start[0]} cy={s.start[1]} r={Math.max(2, s.width * 0.42)} fill="currentColor" />
          )}
        </g>
      ))}
    </svg>
  )
}

function Chars({ text, className = "sft-ch" }: { text: string; className?: string }) {
  return (
    <>
      {splitMarked(text).map((c, i) => (
        <span key={i} className={className + (c.hi ? " is-hi" : "") + (c.ch === " " ? " is-sp" : "")} aria-hidden="true">
          {c.ch === " " ? " " : c.ch}
        </span>
      ))}
    </>
  )
}

// ---- the template ---------------------------------------------------------------------

export default function SeraphFoundryTemplate({
  height = "100svh",
  preset = "riso",
  colors,
  theme = "auto",
  typeface,
  fontHref = FONT_HREF,
  hero,
  pressings = DEFAULT_PRESSINGS,
  samples = DEFAULT_SAMPLES,
  licenses = DEFAULT_LICENSES,
  currency = "$",
  images,
  engrave = true,
  closing,
  onBuy,
  className = "",
}: SeraphFoundryTemplateProps) {
  const pal = { ...(PALETTES[preset] || PALETTES.riso), ...(colors || {}) }
  const face = {
    name: typeface?.name ?? "Seraphine",
    foundry: typeface?.foundry ?? "Ashgrove Type Co.",
    family: typeface?.family ?? DISPLAY,
    labelFamily: typeface?.labelFamily ?? LABEL,
    glyphs: typeface?.glyphs ?? 963,
    weights: typeface?.weights ?? ([100, 900] as [number, number]),
  }
  const h = { ...DEFAULT_HERO, ...(hero || {}) }
  const close = { kicker: "Best of Regards", title: "Thank You", vertical: "Trademark", ...(closing || {}) }
  const art = {
    crest: toArt(images?.crest, DEFAULT_IMAGES.crest as SeraphArt),
    sleeve: toArt(images?.sleeve, DEFAULT_IMAGES.sleeve as SeraphArt),
    ornament: toArt(images?.ornament, DEFAULT_IMAGES.ornament as SeraphArt),
    angel: toArt(images?.angel, DEFAULT_IMAGES.angel as SeraphArt),
  }
  const presses = pressings.length ? pressings : DEFAULT_PRESSINGS
  const [wMin, wMax] = face.weights

  const root = React.useRef(null as HTMLDivElement | null)
  const refs = {
    top: React.useRef(null as HTMLElement | null),
    pressing: React.useRef(null as HTMLElement | null),
    tester: React.useRef(null as HTMLElement | null),
    glyphs: React.useRef(null as HTMLElement | null),
    licenses: React.useRef(null as HTMLElement | null),
  }
  const titleRef = React.useRef(null as HTMLHeadingElement | null)
  const sleeveTitle = React.useRef(null as HTMLDivElement | null)
  const spinRef = React.useRef(null as HTMLDivElement | null)
  const testerOut = React.useRef(null as HTMLDivElement | null)
  const countRef = React.useRef(null as HTMLSpanElement | null)
  const gridRef = React.useRef(null as HTMLDivElement | null)
  const glyphRef = React.useRef(null as HTMLSpanElement | null)
  const [metrics, setMetrics] = React.useState({} as React.CSSProperties)

  const [press, setPress] = React.useState(0)
  const [playing, setPlaying] = React.useState(true)
  const [size, setSize] = React.useState(96)
  const [weight, setWeight] = React.useState(520)
  const [track, setTrack] = React.useState(0)
  const [caseMode, setCaseMode] = React.useState("as")
  const [inkMode, setInkMode] = React.useState("ink")
  const [sample, setSample] = React.useState(0)
  const [cat, setCat] = React.useState(GLYPH_SETS[0].id)
  const [glyph, setGlyph] = React.useState("A")
  const [gWeight, setGWeight] = React.useState(500)
  const [picked, setPicked] = React.useState([licenses[0]?.id].filter(Boolean) as string[])
  const [seats, setSeats] = React.useState(1)
  const [bought, setBought] = React.useState(false)
  const [menu, setMenu] = React.useState(false)

  const playingRef = React.useRef(playing)
  playingRef.current = playing

  // fonts: a <link> only when asked for
  React.useEffect(() => {
    if (!fontHref) return
    const done = () => ScrollTrigger.refresh()
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(done).catch(() => {})
  }, [fontHref])

  // inspector guides sit on the face's real cap height, x-height and baseline
  React.useEffect(() => {
    const el = glyphRef.current
    if (!el) return
    let alive = true
    const measure = () => {
      if (!alive) return
      const cs = getComputedStyle(el)
      const c = document.createElement("canvas").getContext("2d")
      if (!c) return
      c.font = cs.fontWeight + " 100px " + cs.fontFamily
      const H = c.measureText("H")
      const x = c.measureText("x")
      const A = H.fontBoundingBoxAscent || 80
      const D = H.fontBoundingBoxDescent || 20
      const base = (1 - (A + D) / 100) / 2 + A / 100
      setMetrics({
        "--base": base.toFixed(3) + "em",
        "--cap": (base - H.actualBoundingBoxAscent / 100).toFixed(3) + "em",
        "--xh": (base - x.actualBoundingBoxAscent / 100).toFixed(3) + "em",
      } as React.CSSProperties)
    }
    measure()
    document.fonts?.ready.then(measure).catch(() => {})
    return () => {
      alive = false
    }
  }, [gWeight])

  // ---- choreography ----
  useIso(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      const header = el.querySelector(".sft-header") as HTMLElement | null
      const bar = el.querySelector(".sft-progress i") as HTMLElement | null
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (bar) bar.style.transform = "scaleX(" + self.progress.toFixed(4) + ")"
          if (header) header.classList.toggle("is-tucked", self.direction === 1 && self.progress > 0.02)
        },
      })

      const mm = gsap.matchMedia()
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 760px)" },
        (c) => {
          const { motion, wide } = c.conditions as { motion: boolean; wide: boolean }
          if (!motion) return

          // hero entrance
          const intro = gsap.timeline({ defaults: { ease: "expo.out" } })
          intro
            .from(".sft-hero .sft-band", { scaleX: 0, transformOrigin: "0% 50%", duration: 1.5, ease: "expo.inOut" })
            .fromTo(".sft-hero .sft-crest", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.8, ease: "power3.inOut" }, 0.15)
            .from(".sft-hero .sft-ch", { yPercent: 118, rotate: 7, "--wl": -340, duration: 1.3, stagger: 0.038 }, 0.4)
            .fromTo(".sft-hero .sft-swashes", { "--draw": 0 }, { "--draw": 1, duration: 2.4, ease: "power2.inOut" }, 0.8)
            .from(".sft-hero .sft-rise", { y: 18, autoAlpha: 0, duration: 1, stagger: 0.07 }, 1.0)
            .from(".sft-hero .sft-star", { scale: 0, rotate: -200, duration: 1.3, stagger: 0.12, ease: "back.out(2.2)" }, 1.1)

          // hero: the face thickens as it leaves
          gsap
            .timeline({ scrollTrigger: { trigger: ".sft-hero", start: "top top", end: "bottom top", scrub: 0.7 } })
            .to(".sft-hero .sft-title", { "--wb": 860, yPercent: 16, scale: 0.94, ease: "none" }, 0)
            .to(".sft-hero .sft-crest", { yPercent: -12, ease: "none" }, 0)
            .to(".sft-hero .sft-band", { scaleY: 0.55, ease: "none" }, 0)
            .to(".sft-hero .sft-kicker", { yPercent: -60, autoAlpha: 0, ease: "none" }, 0)

          // pressing: sleeve settles, the record slides out and turns
          gsap
            .timeline({ scrollTrigger: { trigger: ".sft-press", start: "top bottom", end: "bottom bottom", scrub: 0.8 } })
            .fromTo(".sft-vword", { yPercent: 18 }, { yPercent: -38, ease: "none", duration: 1 }, 0)
            .fromTo(".sft-orn", { yPercent: 10, scale: 1.12 }, { yPercent: -6, scale: 1, ease: "none", duration: 1 }, 0)
            .fromTo(".sft-sleeve", { rotate: -7, yPercent: 30, scale: 0.86 }, { rotate: 0, yPercent: 0, scale: 1, ease: "power2.out", duration: 0.42 }, 0)
            .fromTo(
              ".sft-disc-slide",
              { xPercent: 0, yPercent: 0 },
              { xPercent: wide ? 56 : 0, yPercent: wide ? 0 : 44, ease: "power2.inOut", duration: 0.4 },
              0.42,
            )
            .fromTo(".sft-disc-turn", { rotate: 0 }, { rotate: 400, ease: "none", duration: 0.58 }, 0.42)
            .fromTo(".sft-sleeve .sft-swashes", { "--draw": 0 }, { "--draw": 1, ease: "none", duration: 0.4 }, 0.2)
            .from(".sft-press-foot > *", { y: 24, autoAlpha: 0, stagger: 0.04, duration: 0.2 }, 0.5)

          // tester: the specimen grows into its weight
          gsap.from(".sft-tester-out", {
            "--wl": -420,
            letterSpacing: "0.18em",
            duration: 1.8,
            ease: "expo.out",
            scrollTrigger: { trigger: ".sft-tester", start: "top 70%", once: true },
          })
          gsap.from(".sft-tester .sft-rise", {
            y: 22,
            autoAlpha: 0,
            stagger: 0.06,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: ".sft-tester", start: "top 75%", once: true },
          })

          // glyphs: count up, cells deal in
          const counter = { v: 0 }
          gsap.to(counter, {
            v: face.glyphs,
            duration: 1.8,
            ease: "power3.out",
            scrollTrigger: { trigger: ".sft-glyphs", start: "top 70%", once: true },
            onUpdate: () => {
              if (countRef.current) countRef.current.textContent = String(Math.round(counter.v))
            },
          })
          gsap.from(".sft-glyphs .sft-cell", {
            scale: 0.5,
            autoAlpha: 0,
            duration: 0.7,
            ease: "back.out(1.8)",
            stagger: { each: 0.018, grid: "auto", from: "start" },
            scrollTrigger: { trigger: ".sft-glyph-grid", start: "top 80%", once: true },
          })
          gsap.from(".sft-inspect", {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 1.2,
            ease: "power3.inOut",
            scrollTrigger: { trigger: ".sft-glyphs", start: "top 70%", once: true },
          })

          // licenses
          gsap.from(".sft-lic", {
            y: 60,
            rotate: (i: number) => (i - 1) * 2.5,
            autoAlpha: 0,
            duration: 1,
            stagger: 0.1,
            ease: "expo.out",
            scrollTrigger: { trigger: ".sft-licenses", start: "top 70%", once: true },
          })

          // closing plate
          gsap
            .timeline({ scrollTrigger: { trigger: ".sft-close", start: "top 85%", end: "center center", scrub: 0.8 } })
            .fromTo(".sft-square", { scale: 0.62, yPercent: 14 }, { scale: 1, yPercent: 0, ease: "none" }, 0)
            .fromTo(".sft-angel", { yPercent: 18, clipPath: "inset(100% 0% 0% 0%)" }, { yPercent: 0, clipPath: "inset(0% 0% 0% 0%)", ease: "none" }, 0)
            .fromTo(".sft-close .sft-ty", { x: (i: number, _t: Element, all: Element[]) => (i - (all.length - 1) / 2) * 34, autoAlpha: 0, "--wl": -360 }, { x: 0, autoAlpha: 1, "--wl": 0, ease: "power2.out", stagger: 0.03 }, 0.15)
            .fromTo(".sft-close .sft-swashes", { "--draw": 0 }, { "--draw": 1, ease: "none" }, 0.3)
            .fromTo(".sft-trademark", { yPercent: 30 }, { yPercent: -10, ease: "none" }, 0)
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  // hero letters swell under the pointer
  React.useEffect(() => {
    const title = titleRef.current
    if (!title || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const chars = Array.from(title.querySelectorAll(".sft-ch")) as HTMLElement[]
    const setters = chars.map((ch) => gsap.quickTo(ch, "--wh", { duration: 0.5, ease: "power3.out" }))
    let raf = 0
    let px = 0
    let py = 0
    const apply = () => {
      raf = 0
      for (let i = 0; i < chars.length; i++) {
        const r = chars[i].getBoundingClientRect()
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2))
        const s = Math.max(120, r.height * 0.9)
        setters[i](Math.round(380 * Math.exp(-(d * d) / (s * s))))
      }
    }
    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const onLeave = () => setters.forEach((s) => s(0))
    const hero = title.closest(".sft-hero") as HTMLElement | null
    hero?.addEventListener("pointermove", onMove)
    hero?.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      hero?.removeEventListener("pointermove", onMove)
      hero?.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  // the record: spins while playing, scratches under a drag, coasts on release
  React.useEffect(() => {
    const disc = spinRef.current
    if (!disc) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let angle = 0
    let vel = 0
    let dragging = false
    let last = 0
    let visible = true
    const rpm = 33.3 * 6 // degrees per second
    const tick = (_t: number, dt: number) => {
      if (!visible) return
      const s = Math.min(0.05, dt / 1000)
      if (!dragging) {
        const target = playingRef.current && !reduced ? rpm : 0
        vel += (target - vel) * Math.min(1, s * 2.2)
        angle += vel * s
      }
      disc.style.transform = "rotate(" + angle.toFixed(2) + "deg)"
    }
    gsap.ticker.add(tick)
    const centre = () => {
      const r = disc.getBoundingClientRect()
      return [r.left + r.width / 2, r.top + r.height / 2]
    }
    const at = (e: PointerEvent) => {
      const [cx, cy] = centre()
      return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
    }
    let lastT = 0
    const down = (e: PointerEvent) => {
      dragging = true
      last = at(e)
      lastT = performance.now()
      disc.setPointerCapture(e.pointerId)
      disc.classList.add("is-grab")
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const a = at(e)
      let d = a - last
      if (d > 180) d -= 360
      if (d < -180) d += 360
      const now = performance.now()
      const dt = Math.max(1, now - lastT) / 1000
      angle += d
      vel = vel * 0.6 + (d / dt) * 0.4
      last = a
      lastT = now
    }
    const up = (e: PointerEvent) => {
      dragging = false
      disc.classList.remove("is-grab")
      if (disc.hasPointerCapture(e.pointerId)) disc.releasePointerCapture(e.pointerId)
    }
    disc.addEventListener("pointerdown", down)
    disc.addEventListener("pointermove", move)
    disc.addEventListener("pointerup", up)
    disc.addEventListener("pointercancel", up)
    const io = new IntersectionObserver((es) => (visible = es[0]?.isIntersecting ?? true))
    io.observe(disc)
    return () => {
      gsap.ticker.remove(tick)
      io.disconnect()
      disc.removeEventListener("pointerdown", down)
      disc.removeEventListener("pointermove", move)
      disc.removeEventListener("pointerup", up)
      disc.removeEventListener("pointercancel", up)
    }
  }, [])

  // a new pressing: the sleeve title deals back in
  const firstPress = React.useRef(true)
  useIso(() => {
    if (firstPress.current) {
      firstPress.current = false
      return
    }
    const t = sleeveTitle.current
    if (!t || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const tw = gsap.fromTo(
      t.querySelectorAll(".sft-sch"),
      { yPercent: 110, autoAlpha: 0, "--wl": -360 },
      { yPercent: 0, autoAlpha: 1, "--wl": 0, duration: 0.7, stagger: 0.04, ease: "expo.out" },
    )
    const k = gsap.fromTo(root.current?.querySelectorAll(".sft-sleeve-kicker, .sft-label-word") || [], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.1 })
    return () => {
      tw.kill()
      k.kill()
    }
  }, [press])

  const choosePress = (i: number) => {
    if (i === press) return
    const t = sleeveTitle.current
    if (!t || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPress(i)
      return
    }
    gsap.to(t.querySelectorAll(".sft-sch"), {
      yPercent: -110,
      autoAlpha: 0,
      duration: 0.28,
      stagger: 0.02,
      ease: "power2.in",
      onComplete: () => setPress(i),
    })
  }

  // a new glyph set deals in
  const firstCat = React.useRef(true)
  React.useEffect(() => {
    if (firstCat.current) {
      firstCat.current = false
      return
    }
    const g = gridRef.current
    if (!g || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const tw = gsap.fromTo(
      g.querySelectorAll(".sft-cell"),
      { scale: 0.6, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(1.8)", stagger: { each: 0.015, grid: "auto", from: "start" } },
    )
    return () => {
      tw.kill()
    }
  }, [cat])

  const go = (k: keyof typeof refs) => {
    setMenu(false)
    const t = refs[k].current
    if (!t) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
  }

  const chosen = licenses.filter((l) => picked.includes(l.id))
  const total = orderTotal(
    chosen.map((l) => l.price),
    seats,
  )
  const money = (n: number) => currency + n.toLocaleString("en-US")
  const buy = () => {
    if (!chosen.length) return
    onBuy?.({ licenses: chosen.map((l) => l.id), seats, total, currency })
    setBought(true)
    window.setTimeout(() => setBought(false), 2600)
  }

  const p = presses[Math.min(press, presses.length - 1)]
  const set = GLYPH_SETS.find((g) => g.id === cat) || GLYPH_SETS[0]
  const testerText = samples[sample] ?? samples[0] ?? ""
  const transform = caseMode === "upper" ? "uppercase" : caseMode === "lower" ? "lowercase" : "none"
  const testerInk = inkMode === "accent" ? "var(--accent)" : inkMode === "blue" ? "var(--blue)" : "var(--ink)"

  const vars = {
    "--h": height,
    "--c-paper": pal.paper,
    "--c-ink": pal.ink,
    "--c-accent": pal.accent,
    "--c-tint": pal.tint,
    "--c-blue": pal.blue,
    "--display": face.family,
    "--label": face.labelFamily,
  } as React.CSSProperties

  const nav = [
    { k: "pressing" as const, label: "In use" },
    { k: "tester" as const, label: "Tester" },
    { k: "glyphs" as const, label: "Glyphs" },
    { k: "licenses" as const, label: "Licensing" },
  ]

  return (
    <div
      ref={root}
      className={"sft-root" + (theme === "dark" ? " sft-dark" : theme === "light" ? " sft-light" : "") + (className ? " " + className : "")}
      style={vars}
    >
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{CSS}</style>
      <div className="sft-grain" aria-hidden="true" style={{ backgroundImage: GRAIN }} />

      {/* ---- header ---- */}
      <header className="sft-header">
        <div className="sft-progress" aria-hidden="true">
          <i />
        </div>
        <button type="button" className="sft-brand" onClick={() => go("top")} aria-label={face.foundry + ", back to top"}>
          <Star size={20} ring />
          <span className="sft-brand-name">{face.foundry}</span>
        </button>
        <nav className={"sft-nav" + (menu ? " is-open" : "")} aria-label="Specimen">
          {nav.map((n, i) => (
            <button key={n.k} type="button" onClick={() => go(n.k)}>
              <span className="sft-nav-n">0{i + 1}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <button type="button" className="sft-cta" onClick={() => go("licenses")}>
          Buy {face.name}
          <span className="sft-cta-price">from {money(licenses[0]?.price ?? 0)}</span>
        </button>
        <button
          type="button"
          className="sft-burger"
          aria-expanded={menu}
          aria-label={menu ? "Close menu" : "Open menu"}
          onClick={() => setMenu((m) => !m)}
        >
          <i />
          <i />
        </button>
      </header>

      {/* ---- hero ---- */}
      <section ref={refs.top} className="sft-hero" aria-label={face.name + " specimen"}>
        <div className="sft-band" aria-hidden="true" />
        <Engraving art={art.crest} ink={pal.accent} className="sft-crest" engrave={engrave} seed={3} fade={0.34} />

        <div className="sft-kicker">
          <Star size={34} ring className="sft-kicker-star" />
          <div>
            <p className="sft-kicker-title">{h.kicker}</p>
            <p className="sft-kicker-sub">
              <Arrows /> <span>{h.sub}</span>
            </p>
          </div>
        </div>

        <h1 ref={titleRef} className="sft-title" aria-label={h.lines.map(plainText).join(" ")}>
          {h.lines.map((ln, i) => (
            <span key={i} className={"sft-line" + (i === 1 && h.lines.length === 3 ? " is-small" : "")}>
              <Chars text={ln} />
            </span>
          ))}
          <Swashes set={HERO_SWASHES} />
          <Star size={44} className="sft-star-a" />
          <Star size={30} className="sft-star-b" />
          <Star size={26} className="sft-star-c" />
        </h1>

        <div className="sft-hero-foot">
          <p className="sft-credit sft-rise">
            <span>{h.credit}</span>
            <strong>{face.foundry}</strong>
          </p>
          <p className="sft-note sft-rise">{h.note}</p>
        </div>
        <p className="sft-scrollcue sft-rise" aria-hidden="true">
          Scroll the specimen <Arrows n={1} />
        </p>
      </section>

      {/* ---- in use: record sleeve ---- */}
      <section ref={refs.pressing} className="sft-press" aria-label="The face in use: a record sleeve">
        <div className="sft-press-stage">
          <div className="sft-vword" aria-hidden="true">
            <span className="sft-vword-in">{p.title}</span>
          </div>
          <Engraving art={art.ornament} ink={pal.accent} className="sft-orn" engrave={engrave} seed={5} fade={0.42} pitch={3.8} />

          <div className="sft-record">
            <div className="sft-disc-slide">
              <div className="sft-disc-turn">
                <div ref={spinRef} className="sft-disc" role="img" aria-label={"A black vinyl record, " + p.title + ". Drag to scratch."}>
                  <div className="sft-disc-label">
                    <span className="sft-label-word">{p.label}</span>
                    <i className="sft-disc-hole" />
                  </div>
                </div>
              </div>
              <div className="sft-disc-sheen" aria-hidden="true" />
            </div>

            <div className="sft-sleeve">
              <div className="sft-sleeve-in">
                <div className="sft-sleeve-head">
                  <Star size={18} ring />
                  <span className="sft-sleeve-kicker">{p.kicker}</span>
                  <Star size={18} ring />
                </div>
                <Engraving art={art.sleeve} ink={pal.accent} className="sft-sleeve-art" engrave={engrave} seed={9} fade={0.22} pitch={2.6} />
                <div ref={sleeveTitle} className="sft-sleeve-title" aria-label={p.title}>
                  <Chars text={p.title} className="sft-sch" />
                  <Swashes set={SLEEVE_SWASHES} nib={0.5} />
                </div>
                <p className="sft-sleeve-foundry">{face.foundry}</p>
              </div>
            </div>
          </div>

          <div className="sft-press-foot">
            <p className="sft-eyebrow">
              <span>01</span> Type in use — record sleeve
            </p>
            <div className="sft-chips" role="radiogroup" aria-label="Pressing">
              {presses.map((pr, i) => (
                <button key={pr.title} type="button" role="radio" aria-checked={i === press} className="sft-chip" onClick={() => choosePress(i)}>
                  {pr.title}
                </button>
              ))}
            </div>
            <button type="button" className="sft-play" aria-pressed={playing} onClick={() => setPlaying((v) => !v)}>
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                {playing ? <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" /> : <path d="M4 2.5l9 5.5-9 5.5z" fill="currentColor" />}
              </svg>
              {playing ? "Pause" : "Play"} <span className="sft-play-hint">· drag the record to scratch</span>
            </button>
          </div>
        </div>
      </section>

      {/* ---- tester ---- */}
      <section ref={refs.tester} className="sft-tester" aria-labelledby="sft-tester-h">
        <div className="sft-sec-head">
          <p className="sft-eyebrow sft-rise">
            <span>02</span> Type tester
          </p>
          <h2 id="sft-tester-h" className="sft-h2 sft-rise">
            Set it in stone
          </h2>
          <p className="sft-lede sft-rise">
            One variable axis, {wMin} to {wMax}. Type over the specimen, or pick a phrase.
          </p>
        </div>

        <div className="sft-controls sft-rise">
          <label className="sft-range">
            <span>
              Size <b>{size}px</b>
            </span>
            <input type="range" min={28} max={220} value={size} onChange={(e) => setSize(+e.target.value)} />
          </label>
          <label className="sft-range">
            <span>
              Weight <b>{weight}</b>
            </span>
            <input type="range" min={wMin} max={wMax} step={10} value={weight} onChange={(e) => setWeight(+e.target.value)} />
          </label>
          <label className="sft-range">
            <span>
              Tracking <b>{(track / 100).toFixed(2)}em</b>
            </span>
            <input type="range" min={-6} max={30} value={track} onChange={(e) => setTrack(+e.target.value)} />
          </label>
          <div className="sft-seg" role="radiogroup" aria-label="Case">
            {[
              ["as", "Aa", "As typed"],
              ["upper", "AA", "Uppercase"],
              ["lower", "aa", "Lowercase"],
            ].map(([k, l, name]) => (
              <button key={k} type="button" role="radio" aria-checked={caseMode === k} aria-label={name} onClick={() => setCaseMode(k)}>
                {l}
              </button>
            ))}
          </div>
          <div className="sft-seg sft-inks" role="radiogroup" aria-label="Ink">
            {[
              ["ink", "Navy ink"],
              ["accent", "Pink ink"],
              ["blue", "Blue ink"],
            ].map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={inkMode === k} aria-label={l} onClick={() => setInkMode(k)}>
                <i data-ink={k} />
              </button>
            ))}
          </div>
        </div>

        <div
          ref={testerOut}
          key={sample}
          className="sft-tester-out"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          role="textbox"
          aria-multiline="true"
          aria-label="Type tester, editable"
          style={
            {
              fontSize: size + "px",
              "--tw": weight,
              letterSpacing: track / 100 + "em",
              textTransform: transform,
              color: testerInk,
            } as React.CSSProperties
          }
        >
          {testerText}
        </div>

        <div className="sft-samples sft-rise" role="radiogroup" aria-label="Sample phrases">
          {samples.map((s, i) => (
            <button key={i} type="button" role="radio" aria-checked={i === sample} className="sft-chip sft-chip-ink" onClick={() => setSample(i)}>
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* ---- glyphs ---- */}
      <section ref={refs.glyphs} className="sft-glyphs" aria-labelledby="sft-glyphs-h">
        <div className="sft-glyph-head">
          <div>
            <p className="sft-eyebrow">
              <span>03</span> Character set
            </p>
            <h2 id="sft-glyphs-h" className="sft-h2">
              Every glyph, cut by hand
            </h2>
          </div>
          <div className="sft-badge">
            <span className="sft-badge-icons">
              <Orbit />
              <Orbit />
            </span>
            <span className="sft-badge-row">
              <small>With
                <br />
                over</small>
              <span ref={countRef} className="sft-count">
                {face.glyphs}
              </span>
            </span>
            <span className="sft-badge-tag">Glyphs inside</span>
          </div>
        </div>

        <div className="sft-glyph-body">
          <div className="sft-inspect" aria-live="polite">
            <div className="sft-inspect-meta">
              <span>U+{(glyph.codePointAt(0) || 0).toString(16).toUpperCase().padStart(4, "0")}</span>
              <span>wght {gWeight}</span>
            </div>
            <div className="sft-inspect-glyph" style={{ "--tw": gWeight } as React.CSSProperties}>
              <span ref={glyphRef} style={metrics}>
                <i className="sft-guide sft-guide-cap" />
                <i className="sft-guide sft-guide-x" />
                <i className="sft-guide sft-guide-base" />
                {glyph}
              </span>
            </div>
            <label className="sft-range sft-range-paper">
              <span>
                Weight <b>{gWeight}</b>
              </span>
              <input type="range" min={wMin} max={wMax} step={10} value={gWeight} onChange={(e) => setGWeight(+e.target.value)} />
            </label>
            <p className="sft-inspect-name">
              {face.name} · {set.label}
            </p>
          </div>

          <div className="sft-glyph-side">
            <div className="sft-tabs" role="tablist" aria-label="Glyph sets">
              {GLYPH_SETS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={g.id === cat}
                  onClick={() => {
                    setCat(g.id)
                    setGlyph(Array.from(g.chars)[0])
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div ref={gridRef} className="sft-glyph-grid" role="tabpanel" aria-label={set.label}>
              {Array.from(set.chars).map((ch) => (
                <button
                  key={cat + ch}
                  type="button"
                  className="sft-cell"
                  aria-pressed={ch === glyph}
                  aria-label={"Inspect " + ch}
                  onPointerEnter={() => setGlyph(ch)}
                  onFocus={() => setGlyph(ch)}
                  onClick={() => setGlyph(ch)}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- licensing ---- */}
      <section ref={refs.licenses} className="sft-licenses" aria-labelledby="sft-lic-h">
        <div className="sft-sec-head sft-sec-head-dark">
          <p className="sft-eyebrow">
            <span>04</span> Licensing
          </p>
          <h2 id="sft-lic-h" className="sft-h2">
            Take {face.name} home
          </h2>
          <p className="sft-lede">Pick the licences you need. Two together save 10%, all three save 20%.</p>
        </div>
        <div className="sft-lic-grid">
          {licenses.map((l, i) => {
            const on = picked.includes(l.id)
            return (
              <button
                key={l.id}
                type="button"
                className="sft-lic"
                aria-pressed={on}
                onClick={() => setPicked((cur) => (cur.includes(l.id) ? cur.filter((x) => x !== l.id) : [...cur, l.id]))}
              >
                <span className="sft-lic-top">
                  <span className="sft-lic-n">0{i + 1}</span>
                  <span className="sft-lic-check" aria-hidden="true">
                    <svg viewBox="0 0 16 16" width="14" height="14">
                      <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    </svg>
                  </span>
                </span>
                <span className="sft-lic-name">{l.name}</span>
                <span className="sft-lic-blurb">{l.blurb}</span>
                <span className="sft-lic-price">
                  {money(l.price * seatMultiplier(seats))}
                  <small>{l.unit}</small>
                </span>
              </button>
            )
          })}
        </div>
        <div className="sft-checkout">
          <div className="sft-seats" role="radiogroup" aria-label="Seats">
            <span className="sft-seats-label">Seats</span>
            {SEAT_TIERS.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={seats === s} onClick={() => setSeats(s)}>
                {s}
              </button>
            ))}
          </div>
          <p className="sft-total" aria-live="polite">
            <span>Total</span>
            <b>{chosen.length ? money(total) : "—"}</b>
          </p>
          <button type="button" className="sft-buy" disabled={!chosen.length} onClick={buy}>
            {bought ? "Added to cart ✓" : chosen.length ? "Add to cart" : "Pick a licence"}
          </button>
        </div>
      </section>

      {/* ---- closing plate ---- */}
      <section className="sft-close" aria-label={close.title}>
        <div className="sft-square" aria-hidden="true" />
        <Engraving art={art.angel} ink={pal.accent} className="sft-angel" engrave={engrave} seed={11} fade={0.26} />
        <p className="sft-regards">{close.kicker}</p>
        <div className="sft-close-badge">
          <span className="sft-badge-icons">
            <Orbit />
            <Orbit />
          </span>
          <span className="sft-badge-row">
            <small>With
              <br />
              over</small>
            <span className="sft-count">{face.glyphs}</span>
          </span>
          <span className="sft-badge-tag">Glyphs inside</span>
        </div>
        <i className="sft-bullet" aria-hidden="true" />
        <h2 className="sft-ty-title" aria-label={close.title}>
          <span className="sft-ty-in">
            <Chars text={close.title} className="sft-ty" />
          </span>
          <Swashes set={CLOSING_SWASHES} nib={0.42} />
          <Star size={40} className="sft-ty-star" />
        </h2>
        <div className="sft-close-foot">
          <div className="sft-close-credit">
            <Globe />
            <p className="sft-credit">
              <span>{h.credit}</span>
              <strong>{face.foundry}</strong>
            </p>
          </div>
          <div className="sft-close-name">
            <p>
              {face.name}
              <br />
              Typeface
            </p>
            <span className="sft-close-marks">
              <Arrows />
              <Barcode />
            </span>
          </div>
        </div>
        <div className="sft-trademark" aria-hidden="true">
          <span>{close.vertical}</span>
        </div>
      </section>

      <footer className="sft-footer">
        <span>
          © {new Date().getFullYear()} {face.foundry}
        </span>
        <span className="sft-footer-links">
          {nav.map((n) => (
            <button key={n.k} type="button" onClick={() => go(n.k)}>
              {n.label}
            </button>
          ))}
        </span>
        <button type="button" className="sft-top" onClick={() => go("top")}>
          Back to top ↑
        </button>
      </footer>
    </div>
  )
}

// ---- styles ---------------------------------------------------------------------------

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.15'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")"

const CSS = `
.sft-root{--paper:var(--c-paper);--ink:var(--c-ink);--accent:var(--c-accent);--tint:var(--c-tint);--blue:var(--c-blue);--band:var(--c-ink);--on-band:var(--c-paper);--soft:color-mix(in oklab,var(--ink) 74%,var(--paper));--line:color-mix(in oklab,var(--ink) 22%,transparent);position:relative;isolation:isolate;width:100%;background:var(--paper);color:var(--ink);font-family:var(--label);container-type:inline-size;overflow-x:clip;-webkit-font-smoothing:antialiased}
.sft-root.sft-dark,:where(.dark) .sft-root:not(.sft-light){--paper:color-mix(in oklab,var(--c-ink) 52%,#07071a);--ink:var(--c-paper);--tint:color-mix(in oklab,var(--c-accent) 34%,var(--paper));--blue:color-mix(in oklab,var(--c-blue) 55%,#ffffff);--band:color-mix(in oklab,var(--c-ink) 30%,#040410);--on-band:var(--c-paper)}
:where(.sft-root) button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.sft-root button:focus-visible,.sft-root input:focus-visible,.sft-tester-out:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
:where(.sft-root) :where(p,h1,h2){margin:0}
.sft-grain{position:absolute;inset:0;z-index:40;pointer-events:none;opacity:.32;mix-blend-mode:multiply;background-size:240px 240px}
.sft-dark .sft-grain,:where(.dark) .sft-root:not(.sft-light) .sft-grain{mix-blend-mode:soft-light;opacity:.5}

.sft-eyebrow{font:600 12px/1.2 var(--label);letter-spacing:.16em;text-transform:uppercase;display:flex;gap:10px;align-items:center}
.sft-eyebrow span{display:inline-grid;place-items:center;min-width:28px;height:20px;padding:0 6px;background:var(--accent);color:#fff;letter-spacing:.06em}
.sft-h2{font-family:var(--display);font-weight:520;font-size:clamp(44px,8cqw,112px);line-height:.92;letter-spacing:-.01em}
.sft-lede{font:500 15px/1.6 var(--label);max-width:42ch;color:var(--soft)}
.sft-arrows{display:inline-flex;gap:3px;color:var(--accent);vertical-align:middle}
.sft-star{color:var(--accent);display:block;flex:none}

/* header */
.sft-header{position:sticky;top:0;z-index:30;height:64px;display:flex;align-items:center;gap:24px;padding:0 clamp(16px,3cqw,40px);background:color-mix(in oklab,var(--paper) 86%,transparent);backdrop-filter:blur(8px) saturate(1.2);-webkit-backdrop-filter:blur(8px) saturate(1.2);border-bottom:1px solid var(--line);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.sft-header.is-tucked{transform:translateY(-100%)}
.sft-progress{position:absolute;left:0;right:0;bottom:-1px;height:2px;overflow:hidden}
.sft-progress i{display:block;height:100%;background:var(--accent);transform:scaleX(0);transform-origin:0 50%}
.sft-brand{display:flex;align-items:center;gap:10px;font-weight:600}
.sft-brand-name{font-family:var(--display);font-size:24px;font-weight:600;letter-spacing:.01em}
.sft-nav{display:flex;gap:4px;margin-left:auto}
.sft-nav button{display:flex;align-items:baseline;gap:6px;padding:8px 12px;font:600 12px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;border-radius:999px;transition:background .2s,color .2s}
.sft-nav button:hover{background:var(--ink);color:var(--paper)}
.sft-nav-n{font-size:9px;color:var(--accent);letter-spacing:.06em}
.sft-nav button:hover .sft-nav-n{color:var(--tint)}
.sft-cta{display:flex;align-items:center;gap:10px;height:40px;padding:0 6px 0 18px;background:var(--ink);color:var(--paper);font:600 13px/1 var(--label);letter-spacing:.04em;border-radius:999px;transition:transform .2s cubic-bezier(.2,.8,.2,1),background .2s}
.sft-cta:hover{background:var(--accent)}
.sft-cta:active{transform:scale(.97)}
.sft-cta-price{display:inline-grid;place-items:center;height:28px;padding:0 10px;border-radius:999px;background:var(--accent);color:#fff;font-size:11px}
.sft-cta:hover .sft-cta-price{background:var(--ink)}
.sft-burger{display:none;width:40px;height:40px;place-items:center;align-content:center;gap:6px}
.sft-burger i{display:block;width:20px;height:2px;background:currentColor;transition:transform .3s}
.sft-burger[aria-expanded=true] i:first-child{transform:translateY(4px) rotate(45deg)}
.sft-burger[aria-expanded=true] i:last-child{transform:translateY(-4px) rotate(-45deg)}

/* hero */
.sft-hero{position:relative;height:var(--h);min-height:640px;margin-top:-64px;overflow:hidden}
.sft-band{position:absolute;left:0;right:0;top:24%;height:44%;background:var(--tint)}
.sft-crest{position:absolute;left:1.5cqw;top:9%;width:34cqw;height:84%;clip-path:inset(0% 0% 0% 0%)}
.sft-kicker{position:absolute;right:4.5cqw;top:calc(64px + 3%);display:flex;align-items:center;gap:18px;z-index:3}
.sft-kicker-title{font-family:var(--display);font-weight:600;font-size:clamp(22px,3.1cqw,46px);line-height:1;color:var(--accent);text-transform:uppercase;transform:skewX(-8deg)}
.sft-kicker-sub{margin-top:8px;font:600 12px/1 var(--label);letter-spacing:.12em;text-transform:uppercase;display:flex;align-items:center;gap:10px}
.sft-title{--wb:440;position:absolute;left:17cqw;right:5cqw;top:23%;z-index:2;display:flex;flex-direction:column;align-items:center;font-family:var(--display);font-weight:400;color:var(--ink);line-height:.82;text-transform:uppercase;transform-origin:50% 0;cursor:default}
.sft-line{display:block;white-space:nowrap;font-size:clamp(64px,15.2cqw,232px);overflow:hidden;padding:0 .04em .06em;margin-bottom:-.06em}
.sft-line.is-small{font-size:clamp(28px,5.4cqw,84px);line-height:.95;padding-bottom:.08em}
.sft-line:last-of-type{margin-left:12cqw}
.sft-ch,.sft-sch,.sft-ty{--wl:0;--wh:0;display:inline-block;font-weight:clamp(100,calc(var(--wb,440) + var(--wl) + var(--wh)),900);will-change:transform}
.sft-ch.is-hi{color:var(--blue)}
.sft-ch.is-sp{width:.25em}
.sft-swashes{--draw:1;position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;color:var(--ink)}
.sft-swash-mask{stroke-dashoffset:calc(1 - var(--draw))}
.sft-swash-dot{opacity:clamp(0,calc((var(--draw) - .92) * 14),1)}
.sft-swash-dot-s{opacity:clamp(0,calc(var(--draw) * 8),1)}
.sft-title .sft-swashes{inset:-6% -4% -10% -6%;width:110%;height:116%}
.sft-star-a,.sft-star-b,.sft-star-c{position:absolute;color:var(--ink)}
.sft-star-a{left:-3%;top:44%}
.sft-star-b{right:-1%;top:4%}
.sft-star-c{left:22%;bottom:-4%;color:var(--accent)}
.sft-star-a,.sft-star-b,.sft-ty-star{animation:sft-twinkle 3.6s ease-in-out infinite}
.sft-star-b{animation-delay:-1.2s}
@keyframes sft-twinkle{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(.72) rotate(45deg)}}
.sft-hero-foot{position:absolute;left:36cqw;right:4.5cqw;bottom:5%;display:flex;justify-content:space-between;align-items:flex-end;gap:32px;z-index:3}
.sft-credit{display:flex;flex-direction:column;gap:4px}
.sft-credit span{font:600 11px/1 var(--label);letter-spacing:.16em;text-transform:uppercase}
.sft-credit strong{font-family:var(--display);font-weight:600;font-size:clamp(20px,2.2cqw,30px);line-height:1;text-transform:uppercase;transform:skewX(-8deg);transform-origin:0 100%}
.sft-note{max-width:44ch;font:600 10.5px/1.55 var(--label);letter-spacing:.08em;text-transform:uppercase;text-align:justify;text-align-last:right;color:var(--soft)}
.sft-scrollcue{position:absolute;left:4.5cqw;bottom:5%;z-index:3;display:flex;gap:8px;align-items:center;font:600 10.5px/1 var(--label);letter-spacing:.16em;text-transform:uppercase;color:var(--soft)}

/* engraving */
.sft-engr{position:relative;overflow:hidden;pointer-events:none}
.sft-engr-cv{position:absolute;inset:0;width:100%;height:100%;max-width:none;opacity:0;transition:opacity .9s ease}
.sft-engr[data-state=ready] .sft-engr-cv{opacity:1}
.sft-engr[data-state=flat]{background:var(--accent);mix-blend-mode:multiply;isolation:isolate;-webkit-mask-image:radial-gradient(closest-side,#000 70%,transparent);mask-image:radial-gradient(closest-side,#000 70%,transparent)}
.sft-engr-flat{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;filter:grayscale(1) contrast(1.35) brightness(1.1);mix-blend-mode:screen}

/* pressing */
.sft-press{position:relative;height:calc(var(--h) * 2.6);background:var(--band);color:var(--on-band)}
.sft-press-stage{position:sticky;top:0;height:var(--h);min-height:620px;overflow:hidden}
.sft-vword{position:absolute;left:.5cqw;top:-10%;bottom:-10%;display:flex;align-items:center;pointer-events:none}
.sft-vword-in{display:block;writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--display);font-weight:600;font-size:clamp(90px,15cqw,240px);line-height:.8;color:var(--accent);text-transform:uppercase;white-space:nowrap}
.sft-orn{position:absolute;right:-6cqw;top:4%;width:52cqw;height:92%;opacity:.95}
.sft-record{--s:min(64vh,40cqw,560px);position:absolute;left:calc(50% - var(--s) * .62);top:calc(50% - var(--s) * .56);width:var(--s);height:var(--s)}
.sft-disc-slide{position:absolute;inset:2%;z-index:1}
.sft-disc-turn{position:absolute;inset:0}
.sft-disc{position:absolute;inset:0;border-radius:50%;cursor:grab;touch-action:none;background:radial-gradient(circle,transparent 0 31%,#0c0c10 31.4% 33%,transparent 33.2%),repeating-radial-gradient(circle,#131317 0 1.2px,#1d1d23 1.6px 2.6px,#101014 3px 3.8px),#111;box-shadow:0 30px 60px -20px rgba(0,0,0,.55),inset 0 0 0 2px #050507}
.sft-disc.is-grab{cursor:grabbing}
.sft-disc-label{position:absolute;inset:34%;border-radius:50%;background:var(--c-paper);display:grid;place-items:center;overflow:hidden}
.sft-label-word{font-family:var(--display);font-weight:640;font-size:calc(var(--s) * .1);color:var(--c-accent);text-transform:uppercase;line-height:1}
.sft-disc-hole{position:absolute;left:50%;top:50%;width:7%;height:7%;margin:-3.5% 0 0 -3.5%;border-radius:50%;background:var(--c-ink)}
.sft-disc-sheen{position:absolute;inset:0;border-radius:50%;pointer-events:none;background:conic-gradient(from 20deg,transparent 0 6%,rgba(255,255,255,.13) 11%,transparent 17% 50%,rgba(255,255,255,.1) 56%,transparent 62%);-webkit-mask:radial-gradient(circle,transparent 34%,#000 34.5%);mask:radial-gradient(circle,transparent 34%,#000 34.5%)}
.sft-sleeve{position:absolute;inset:0;z-index:2;background:var(--c-paper);color:var(--c-ink);box-shadow:0 40px 70px -30px rgba(0,0,0,.6),0 2px 0 rgba(255,255,255,.4) inset;container-type:size}
.sft-sleeve-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:6cqh 7cqw 5cqh}
.sft-sleeve-head{display:flex;align-items:center;gap:4cqw;color:var(--c-accent)}
.sft-sleeve-kicker{font-family:var(--display);font-weight:560;font-size:7.4cqw;line-height:1;text-transform:uppercase;color:var(--c-ink);white-space:nowrap}
.sft-sleeve-art{position:relative;width:96%;flex:1;margin:2cqh 0 -4cqh}
.sft-sleeve-title{position:relative;font-family:var(--display);font-size:16cqw;line-height:.9;text-transform:uppercase;color:var(--c-ink);padding:0 4cqw;overflow:visible}
.sft-sleeve-title .sft-swashes{inset:-14% -10% -20% -12%;width:122%;height:134%;color:var(--c-ink)}
.sft-sch{--wb:560}
.sft-sch:nth-child(3n+2){color:var(--c-blue)}
.sft-sleeve-foundry{margin-top:6.5cqh;font-family:var(--display);font-weight:620;font-size:4.6cqw;letter-spacing:.02em;text-transform:uppercase;color:var(--c-accent);transform:skewX(-8deg)}
.sft-press-foot{position:absolute;left:clamp(16px,14cqw,220px);right:clamp(16px,4cqw,56px);bottom:4%;display:flex;align-items:center;gap:18px;flex-wrap:wrap;z-index:3}
.sft-press-foot .sft-eyebrow{color:var(--on-band)}
.sft-chips{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}
.sft-chip{height:34px;padding:0 14px;border-radius:999px;border:1px solid color-mix(in oklab,currentColor 40%,transparent);font:600 12px/1 var(--label);letter-spacing:.1em;text-transform:uppercase;transition:background .2s,color .2s,border-color .2s,transform .15s}
.sft-chip:hover{border-color:var(--accent)}
.sft-chip:active{transform:scale(.96)}
.sft-chip[aria-checked=true]{background:var(--accent);border-color:var(--accent);color:#fff}
.sft-play{display:flex;align-items:center;gap:8px;height:34px;padding:0 14px;border-radius:999px;background:var(--on-band);font:600 12px/1 var(--label);letter-spacing:.1em;text-transform:uppercase}
.sft-play{color:var(--band)}
.sft-play-hint{opacity:.6;text-transform:none;letter-spacing:.02em;font-weight:500}

/* tester */
.sft-tester{position:relative;padding:clamp(72px,10cqw,140px) clamp(16px,4.5cqw,64px) clamp(64px,8cqw,120px)}
.sft-sec-head{display:grid;grid-template-columns:1fr auto;gap:18px 40px;align-items:end;margin-bottom:40px}
.sft-sec-head .sft-eyebrow{grid-column:1/-1}
.sft-controls{display:flex;flex-wrap:wrap;gap:14px 28px;align-items:end;padding:18px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.sft-range{display:flex;flex-direction:column;gap:8px;min-width:150px;flex:1;max-width:240px}
.sft-range span{display:flex;justify-content:space-between;font:600 11px/1 var(--label);letter-spacing:.14em;text-transform:uppercase}
.sft-range b{font-weight:600;color:var(--accent);letter-spacing:.04em}
.sft-range input{appearance:none;-webkit-appearance:none;width:100%;height:22px;background:transparent;margin:0;cursor:pointer}
.sft-range input::-webkit-slider-runnable-track{height:2px;background:var(--ink)}
.sft-range input::-moz-range-track{height:2px;background:var(--ink)}
.sft-range input::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;margin-top:-8px;background:var(--accent);border:0;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);transition:transform .15s}
.sft-range input::-moz-range-thumb{width:18px;height:18px;border:0;border-radius:0;background:var(--accent);clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)}
.sft-range input:active::-webkit-slider-thumb{transform:scale(1.35) rotate(45deg)}
.sft-seg{display:flex;border:1px solid var(--ink);border-radius:999px;padding:3px;gap:2px}
.sft-seg button{min-width:44px;height:30px;padding:0 10px;border-radius:999px;font:600 13px/1 var(--display);transition:background .2s,color .2s}
.sft-seg button[aria-checked=true]{background:var(--ink);color:var(--paper)}
.sft-inks i{display:block;width:14px;height:14px;border-radius:50%;margin:auto;box-shadow:0 0 0 1px var(--paper)}
.sft-inks i[data-ink=ink]{background:var(--ink)}
.sft-inks i[data-ink=accent]{background:var(--accent)}
.sft-inks i[data-ink=blue]{background:var(--blue)}
.sft-inks button[aria-checked=true]{background:none}
.sft-inks button[aria-checked=true] i{box-shadow:0 0 0 3px var(--paper),0 0 0 4.5px var(--ink)}
.sft-tester-out{--wl:0;--tw:520;margin:28px 0 24px;min-height:1.1em;font-family:var(--display);font-weight:clamp(100,calc(var(--tw) + var(--wl)),900);line-height:.98;overflow-wrap:anywhere;outline:none;transition:color .3s;caret-color:var(--accent)}
.sft-samples{display:flex;flex-wrap:wrap;gap:8px}
.sft-chip-ink{text-transform:none;letter-spacing:.02em;font-weight:500}

/* glyphs */
.sft-glyphs{position:relative;padding:clamp(72px,9cqw,130px) clamp(16px,4.5cqw,64px);background:var(--tint)}
.sft-glyph-head{display:flex;justify-content:space-between;align-items:flex-end;gap:32px;margin-bottom:40px}
.sft-glyph-head .sft-eyebrow{margin-bottom:18px}
.sft-badge,.sft-close-badge{display:flex;flex-direction:column;align-items:flex-end;gap:6px;color:var(--ink)}
.sft-badge-icons{display:flex;gap:8px;color:var(--ink)}
.sft-badge-row{display:flex;align-items:center;gap:10px}
.sft-badge-row small{font:700 10px/1.15 var(--label);letter-spacing:.1em;text-transform:uppercase;text-align:right}
.sft-count{font-family:var(--display);font-weight:600;font-size:clamp(48px,6cqw,84px);line-height:.85;font-variant-numeric:tabular-nums}
.sft-badge-tag{background:var(--accent);color:#fff;font:700 10px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;padding:5px 10px}
.sft-glyph-body{display:grid;grid-template-columns:minmax(260px,5fr) 7fr;gap:clamp(20px,3cqw,48px);align-items:start}
.sft-inspect{position:sticky;top:84px;background:var(--paper);padding:20px 22px 22px;display:flex;flex-direction:column;gap:14px;clip-path:inset(0% 0% 0% 0%);box-shadow:0 1px 0 var(--line)}
.sft-inspect-meta{display:flex;justify-content:space-between;font:600 11px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.sft-inspect-glyph{--tw:500;position:relative;isolation:isolate;height:clamp(240px,30cqw,400px);display:grid;place-items:center;font-family:var(--display);font-weight:clamp(100,var(--tw),900);font-size:clamp(170px,22cqw,300px);line-height:1;color:var(--ink);overflow:hidden}
.sft-inspect-glyph span{position:relative;display:block;line-height:1;transition:font-weight .2s}
.sft-guide{position:absolute;left:-400px;right:-400px;height:0;border-top:1px solid color-mix(in oklab,var(--accent) 70%,transparent);z-index:-1}
.sft-guide-cap{top:var(--cap,.2em)}
.sft-guide-x{top:var(--xh,.42em);border-top-style:dashed}
.sft-guide-base{top:var(--base,.78em)}
.sft-inspect-name{font:600 11px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}
.sft-range-paper{max-width:none}
.sft-tabs{display:flex;flex-wrap:wrap;gap:4px 18px;margin-bottom:16px;border-bottom:1px solid var(--line)}
.sft-tabs button{position:relative;padding:10px 0 12px;font:600 12px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;color:var(--soft);transition:color .2s}
.sft-tabs button::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--accent);transform:scaleX(0);transform-origin:0 50%;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.sft-tabs button[aria-selected=true]{color:var(--ink)}
.sft-tabs button[aria-selected=true]::after{transform:scaleX(1)}
.sft-glyph-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:1px}
.sft-cell{aspect-ratio:1;display:grid;place-items:center;background:color-mix(in oklab,var(--tint) 62%,var(--paper));box-shadow:0 0 0 .5px var(--line);font-family:var(--display);font-size:clamp(26px,3cqw,40px);font-weight:460;transition:background .18s,color .18s}
.sft-cell:hover{background:var(--paper)}
.sft-cell[aria-pressed=true]{background:var(--ink);color:var(--paper)}

/* licensing */
.sft-licenses{position:relative;padding:clamp(72px,9cqw,130px) clamp(16px,4.5cqw,64px);background:var(--band);color:var(--on-band)}
.sft-licenses .sft-lede{color:color-mix(in oklab,var(--on-band) 78%,transparent)}
.sft-lic-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.sft-lic{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:14px;padding:22px 22px 24px;min-height:300px;text-align:left;background:var(--c-paper);transition:translate .35s cubic-bezier(.2,.8,.2,1),rotate .35s cubic-bezier(.2,.8,.2,1),scale .2s,box-shadow .35s}
.sft-lic{color:var(--c-ink)}
.sft-lic:hover{translate:0 -6px;rotate:-.6deg}
.sft-lic:active{scale:.99}
.sft-lic[aria-pressed=true]{box-shadow:0 0 0 3px var(--c-accent),0 30px 50px -28px rgba(0,0,0,.6)}
.sft-lic-top{display:flex;justify-content:space-between;width:100%;align-items:center}
.sft-lic-n{font:600 11px/1 var(--label);letter-spacing:.16em;color:var(--c-accent)}
.sft-lic-check{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1.5px solid var(--c-ink);color:transparent;transition:background .2s,color .2s,border-color .2s}
.sft-lic[aria-pressed=true] .sft-lic-check{background:var(--c-accent);border-color:var(--c-accent);color:#fff}
.sft-lic-name{font-family:var(--display);font-weight:560;font-size:clamp(44px,5cqw,68px);line-height:.9;text-transform:uppercase}
.sft-lic-blurb{font:500 14px/1.55 var(--label);color:color-mix(in oklab,var(--c-ink) 78%,var(--c-paper));max-width:30ch}
.sft-lic-price{margin-top:auto;display:flex;flex-direction:column;gap:4px;font-family:var(--display);font-weight:600;font-size:40px;line-height:1}
.sft-lic-price small{font:600 10px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;color:color-mix(in oklab,var(--c-ink) 70%,var(--c-paper))}
.sft-checkout{display:flex;align-items:center;flex-wrap:wrap;gap:16px 28px;margin-top:24px;padding-top:24px;border-top:1px solid color-mix(in oklab,var(--on-band) 25%,transparent)}
.sft-seats{display:flex;align-items:center;gap:4px}
.sft-seats-label{font:600 11px/1 var(--label);letter-spacing:.16em;text-transform:uppercase;margin-right:10px}
.sft-seats button{min-width:40px;height:34px;border-radius:999px;font:600 13px/1 var(--label);transition:background .2s,color .2s}
.sft-seats button[aria-checked=true]{background:var(--on-band);color:var(--band)}
.sft-total{margin-left:auto;display:flex;align-items:baseline;gap:12px}
.sft-total span{font:600 11px/1 var(--label);letter-spacing:.16em;text-transform:uppercase}
.sft-total b{font-family:var(--display);font-weight:600;font-size:48px;line-height:1;font-variant-numeric:tabular-nums}
.sft-buy{height:52px;padding:0 28px;border-radius:999px;background:var(--c-accent);font:600 14px/1 var(--label);letter-spacing:.06em;text-transform:uppercase;transition:transform .2s cubic-bezier(.2,.8,.2,1),opacity .2s}
.sft-buy{color:#fff}
.sft-buy:hover{transform:translateY(-2px)}
.sft-buy:active{transform:scale(.97)}
.sft-buy:disabled{opacity:.45;cursor:not-allowed;transform:none}

/* closing plate */
.sft-close{position:relative;height:var(--h);min-height:720px;overflow:hidden}
.sft-square{position:absolute;left:33cqw;width:34cqw;top:20%;bottom:6%;background:var(--tint)}
.sft-angel{position:absolute;left:24cqw;width:52cqw;top:3%;bottom:2%;clip-path:inset(0% 0% 0% 0%)}
.sft-regards{position:absolute;left:4.5cqw;top:14%;font-family:var(--display);font-weight:600;font-size:clamp(30px,4.4cqw,64px);line-height:.95;text-transform:uppercase;max-width:6.4em;transform:skewX(-6deg);transform-origin:0 100%}
.sft-close-badge{position:absolute;right:7cqw;top:12%}
.sft-bullet{position:absolute;left:12cqw;top:41%;width:22px;height:22px;background:var(--accent)}
.sft-ty-title{position:absolute;left:5cqw;right:5cqw;top:44%;z-index:2;display:flex;justify-content:center;font-family:var(--display);font-size:clamp(76px,15.5cqw,250px);line-height:.9;color:var(--ink)}
.sft-ty-in{display:block;padding:0 .1em;transform:skewX(-9deg);white-space:nowrap}
.sft-ty{--wb:620}
.sft-ty-title .sft-swashes{inset:-24% 2% -26% 0;width:98%;height:150%}
.sft-ty-star{position:absolute;left:5%;top:20%;color:var(--ink)}
.sft-close-foot{position:absolute;left:4.5cqw;right:7cqw;bottom:5%;display:flex;justify-content:space-between;align-items:flex-end;z-index:3}
.sft-close-credit{display:flex;flex-direction:column;gap:14px;color:var(--ink)}
.sft-close-name{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.sft-close-name p{font-family:var(--display);font-weight:600;font-size:clamp(26px,3.2cqw,46px);line-height:.95;text-transform:uppercase;color:var(--accent);text-align:right;transform:skewX(-6deg)}
.sft-close-marks{display:flex;gap:14px;align-items:center;color:var(--ink)}
.sft-trademark{position:absolute;right:-1.2cqw;top:30%;bottom:-20%;pointer-events:none}
.sft-trademark span{display:block;writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--display);font-weight:600;font-size:clamp(60px,8cqw,130px);line-height:.8;text-transform:uppercase;color:var(--accent);white-space:nowrap}
.sft-footer{display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:22px clamp(16px,4.5cqw,64px);border-top:1px solid var(--line);font:600 11px/1 var(--label);letter-spacing:.14em;text-transform:uppercase}
.sft-footer-links{display:flex;gap:18px;margin:0 auto}
.sft-footer button:hover{color:var(--accent)}

/* phones and narrow containers */
@container (max-width: 900px){
  .sft-nav{display:none;position:absolute;top:64px;left:0;right:0;flex-direction:column;gap:0;padding:8px 16px 16px;background:var(--paper);border-bottom:1px solid var(--line)}
  .sft-nav.is-open{display:flex}
  .sft-nav button{padding:14px 4px;border-radius:0;border-bottom:1px solid var(--line);font-size:14px}
  .sft-burger{display:grid}
  .sft-cta{margin-left:auto}
  .sft-cta-price{display:none}
  .sft-lic-grid{grid-template-columns:1fr}
  .sft-lic{min-height:0}
  .sft-glyph-body{grid-template-columns:1fr}
  .sft-inspect{position:relative;top:0}
}
@container (max-width: 640px){
  .sft-brand-name{display:none}
  .sft-hero{min-height:680px}
  .sft-band{top:30%;height:36%}
  .sft-crest{left:-14cqw;top:18%;width:80cqw;height:66%;opacity:.55}
  .sft-kicker{right:16px;left:16px;top:calc(64px + 3%);justify-content:flex-end}
  .sft-title{left:16px;right:16px;top:30%}
  .sft-line{font-size:23cqw}
  .sft-line.is-small{font-size:9cqw}
  .sft-line:last-of-type{margin-left:0}
  .sft-hero-foot{left:16px;right:16px;flex-direction:column;align-items:flex-start;gap:14px;bottom:4%}
  .sft-note{text-align:left;text-align-last:left}
  .sft-scrollcue{display:none}
  .sft-orn{right:-30cqw;width:100cqw;opacity:.5}
  .sft-record{--s:min(78cqw,48vh);left:calc(50% - var(--s) / 2);top:12%}
  .sft-vword-in{font-size:36cqw;opacity:.85}
  .sft-press-foot{left:16px;right:16px;gap:10px}
  .sft-chips{margin-left:0}
  .sft-play-hint{display:none}
  .sft-sec-head{grid-template-columns:1fr}
  .sft-glyph-head{flex-direction:column;align-items:flex-start}
  .sft-badge{align-items:flex-start}
  .sft-glyph-grid{grid-template-columns:repeat(auto-fill,minmax(52px,1fr))}
  .sft-checkout{flex-direction:column;align-items:stretch}
  .sft-total{margin-left:0;justify-content:space-between}
  .sft-close{min-height:760px}
  .sft-square{left:14cqw;width:72cqw;top:22%;bottom:16%}
  .sft-angel{left:-4cqw;width:108cqw;top:10%;bottom:12%}
  .sft-regards{top:calc(64px + 2%);font-size:10cqw}
  .sft-close-badge{right:16px;top:calc(64px + 2%)}
  .sft-bullet{display:none}
  .sft-ty-title{top:46%;font-size:22cqw;left:8px;right:8px}
  .sft-close-foot{left:16px;right:16px;bottom:3%}
  .sft-trademark{display:none}
  .sft-footer-links{display:none}
}

@media (prefers-reduced-motion: reduce){
  .sft-star-a,.sft-star-b,.sft-ty-star{animation:none}
  .sft-header,.sft-lic,.sft-tabs button::after{transition:none}
}
`
