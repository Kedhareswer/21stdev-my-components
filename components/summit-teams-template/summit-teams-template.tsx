"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type SttPhoto = { src: string; alt: string; focus?: string }
export type SttTone = "golden" | "alpenglow" | "lake" | "haze" | "night" | "dusk"
export type SttSection = "top" | "how" | "features" | "pricing" | "testimonials" | "footer"
export type SttNavLink = { label: string; to?: SttSection; href?: string }
export type SttBrand = { name: string; tagline: string }
export type SttHero = {
  eyebrow: string
  eyebrowTag: string
  eyebrowFaces: string[]
  title: string[]
  text: string
  cta: string
  photo: SttPhoto | null
}
export type SttLogo = { name: string; glyph: "ring" | "s" | "drop" | "none" | "wave" | "burst" | "bolt"; style: "caps" | "bold" | "light" | "italic" | "mono" }
export type SttStep = { title: string; text: string; card: "invite" | "roles" | "metrics" | "access" }
export type SttHeading = { label: string; title: string; text: string }
export type SttRole = "Admin" | "Manager" | "Member"
export type SttTodo = { id: string; title: string; tag: "Shared" | "Private"; date: string; done: boolean }
export type SttUser = {
  id: string
  name: string
  email: string
  role: SttRole
  status: "Active" | "Suspended" | "Invited"
  lastLogin: string
  avatar?: string
  deals: number
  projects: number
  todos: SttTodo[]
}
export type SttFeatureTab = { label: string; view: "users" | "activity" | "pipeline" | "access" }
export type SttDeal = { id: string; name: string; company: string; value: number; stage: number; owner: string }
export type SttActivity = { ranges: { label: string; values: number[] }[]; kpis: { label: string; value: string; delta: string }[]; feed: { who: string; what: string; when: string }[] }
export type SttAccess = { roles: string[]; permissions: { label: string; grants: boolean[] }[] }
export type SttPlan = {
  id: string
  name: string
  blurb: string
  price: number
  unit: string
  icon: "bolt" | "flag" | "spark"
  features: string[]
  cta: string
  featured?: boolean
}
export type SttPricing = SttHeading & { monthlyLabel: string; yearlyLabel: string; discount: number; ribbon: string; note: string; ribbonPhoto: SttPhoto | null }
export type SttTestimonial = { name: string; role: string; avatar?: string; quote: string }
export type SttCta = { title: string; text: string; primary: string; secondary: string; photo: SttPhoto | null; flags: boolean }
export type SttFooter = {
  text: string
  columns: { title: string; links: { label: string; href: string }[] }[]
  social: { label: string; icon: "instagram" | "tiktok" | "x" | "linkedin"; href: string }[]
  legal: string
  photo: SttPhoto | null
}

export type SummitTeamsTemplateProps = {
  brand?: SttBrand
  nav?: SttNavLink[]
  login?: string
  hero?: SttHero
  logos?: SttLogo[]
  how?: SttHeading & { cta: string; photo: SttPhoto | null }
  steps?: SttStep[]
  features?: SttHeading & { photo: SttPhoto | null }
  tabs?: SttFeatureTab[]
  users?: SttUser[]
  activity?: SttActivity
  deals?: SttDeal[]
  stages?: string[]
  access?: SttAccess
  pricing?: SttPricing
  plans?: SttPlan[]
  testimonialsHeading?: SttHeading
  testimonials?: SttTestimonial[]
  testimonialsPhoto?: SttPhoto | null
  cta?: SttCta
  footer?: SttFooter
  /** Warm highlight used for focus rings, live dots and the hero glow. */
  accent?: string
  /** Definite height of one "screen". Never inherited from a parent. */
  height?: string
  className?: string
  onJoin?: (email: string) => unknown
  onSelectPlan?: (plan: SttPlan, billing: "monthly" | "yearly") => unknown
  onCta?: (which: "primary" | "secondary") => unknown
}

// #region range
/* A painted mountain range, drawn per pixel: the fallback under every photograph,
   and what 21st's sandboxed cover capture sees. Seeded, so it is identical everywhere. */
type RGB = number[]
export type RangeTone = {
  sky: RGB[]
  horizon: number
  sun: [number, number]
  sunColor: RGB
  sunSize: number
  haze: RGB
  rockLit: RGB
  rockShadow: RGB
  snowLit: RGB
  snowShadow: RGB
  forest: RGB
  water: RGB
  snow: number
  snowLine: number
  mist: number
  peak: number
  peakX: number
  lake: boolean
  clouds: number
  stars: boolean
}

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

export const RANGE_TONES = {
  golden: {
    sky: ["#34405a", "#7d7c8e", "#d9a582", "#f7d2a2"].map(hex), horizon: 0.66, sun: [0.42, 0.6], sunColor: [255, 214, 158], sunSize: 0.22,
    haze: [200, 160, 146], rockLit: [226, 156, 112], rockShadow: [40, 38, 54], snowLit: [255, 238, 222], snowShadow: [138, 146, 176],
    forest: [20, 22, 24], water: [58, 66, 82], mist: 0.55, snowLine: 0.5, snow: 1, peak: 0, peakX: 0.5, lake: true, clouds: 0.75, stars: false,
  },
  alpenglow: {
    sky: ["#3a3446", "#8d6f7e", "#eaa983", "#ffd3a8"].map(hex), horizon: 0.7, sun: [0.88, 0.22], sunColor: [255, 196, 140], sunSize: 0.3,
    haze: [222, 164, 140], rockLit: [240, 126, 70], rockShadow: [92, 52, 54], snowLit: [255, 200, 156], snowShadow: [150, 116, 140],
    forest: [26, 18, 18], water: [70, 60, 70], mist: 1, snowLine: 0.42, snow: 1.4, peak: 1, peakX: 0.2, lake: false, clouds: 0.35, stars: false,
  },
  lake: {
    sky: ["#263840", "#4f6c72", "#9ab3ad", "#d6dfd4"].map(hex), horizon: 0.62, sun: [0.55, 0.28], sunColor: [246, 244, 226], sunSize: 0.18,
    haze: [170, 192, 186], rockLit: [168, 184, 172], rockShadow: [40, 58, 60], snowLit: [240, 246, 244], snowShadow: [130, 152, 162],
    forest: [14, 30, 28], water: [34, 72, 74], mist: 1, snowLine: 0.4, snow: 0.9, peak: 0, peakX: 0.5, lake: true, clouds: 0.5, stars: false,
  },
  haze: {
    sky: ["#1f2a44", "#45557a", "#8796b8", "#c8cede"].map(hex), horizon: 0.6, sun: [0.3, 0.4], sunColor: [236, 232, 246], sunSize: 0.2,
    haze: [150, 162, 196], rockLit: [126, 138, 172], rockShadow: [42, 50, 76], snowLit: [220, 226, 244], snowShadow: [110, 122, 160],
    forest: [16, 20, 34], water: [40, 50, 76], mist: 1, snowLine: 0.3, snow: 0, peak: 0, peakX: 0.5, lake: false, clouds: 0.3, stars: false,
  },
  night: {
    sky: ["#050811", "#0d172c", "#24345a", "#4a5b84"].map(hex), horizon: 0.62, sun: [0.5, 0.18], sunColor: [214, 224, 255], sunSize: 0.08,
    haze: [62, 76, 112], rockLit: [118, 132, 170], rockShadow: [24, 30, 48], snowLit: [214, 224, 250], snowShadow: [80, 96, 136],
    forest: [8, 10, 18], water: [20, 28, 48], mist: 1, snowLine: 0.45, snow: 1.2, peak: 0.6, peakX: 0.55, lake: false, clouds: 0.18, stars: true,
  },
  dusk: {
    sky: ["#2a2a40", "#685872", "#c48a7a", "#ebb592"].map(hex), horizon: 0.64, sun: [0.6, 0.56], sunColor: [255, 200, 170], sunSize: 0.24,
    haze: [180, 138, 140], rockLit: [204, 132, 118], rockShadow: [42, 36, 52], snowLit: [252, 224, 216], snowShadow: [128, 124, 156],
    forest: [20, 16, 22], water: [56, 50, 70], mist: 0.6, snowLine: 0.48, snow: 1, peak: 0, peakX: 0.5, lake: false, clouds: 0.6, stars: false,
  },
}

type RangePlan = { W: number; H: number; tone: RangeTone; seed: number; ridges: Float32Array[]; bases: Float32Array[]; slopes: Float32Array[]; lakeTop: number }

const RANGE_LAYERS = [
  { b: 0.6, a: 0.4, f: 1.5, snow: 0.09, fog: 0.4, mist: 0.6, trees: 0 },
  { b: 0.66, a: 0.28, f: 2.3, snow: 0.06, fog: 0.28, mist: 0.55, trees: 0 },
  { b: 0.72, a: 0.18, f: 3.3, snow: 0.03, fog: 0.18, mist: 0.5, trees: 0 },
  { b: 0.78, a: 0.11, f: 4.6, snow: 0, fog: 0.1, mist: 0.42, trees: 0.012 },
  { b: 0.83, a: 0.06, f: 6.5, snow: 0, fog: 0.04, mist: 0.3, trees: 0.022 },
  { b: 1.0, a: 0.34, f: 2.6, snow: 0, fog: 0, mist: 0, trees: 0.03 },
]

function hash2(x: number, y: number, s: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
function vnoise(x: number, y: number, s: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi, s)
  const b = hash2(xi + 1, yi, s)
  const c = hash2(xi, yi + 1, s)
  const d = hash2(xi + 1, yi + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number, s: number, oct: number) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let i = 0; i < oct; i++) {
    sum += amp * vnoise(x, y, s + i * 31)
    norm += amp
    amp *= 0.5
    x *= 2.03
    y *= 2.03
  }
  return sum / norm
}
function ridged(x: number, s: number, oct: number) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  let w = 1
  for (let i = 0; i < oct; i++) {
    const n = 1 - Math.abs(vnoise(x, 0.37 + i * 1.7, s + i * 13) * 2 - 1)
    const r = n * n * w
    w = Math.min(1, r * 1.6 + 0.25)
    sum += amp * r
    norm += amp
    amp *= 0.52
    x *= 2.1
  }
  return sum / norm
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smooth = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}

/** Ridgelines for every layer of a range, computed once per picture. */
export function planRange(W: number, H: number, tone: RangeTone, seed: number): RangePlan {
  const ridges: Float32Array[] = []
  const bases: Float32Array[] = []
  RANGE_LAYERS.forEach((L, i) => {
    const r = new Float32Array(W)
    const base = new Float32Array(W)
    const off = hash2(i, 7, seed) * 50
    for (let x = 0; x < W; x++) {
      const xn = x / W
      let a = L.a
      let b = L.b
      if (i === 0 && tone.peak) {
        const g = Math.exp(-(((xn - tone.peakX) / 0.2) ** 2))
        a *= mix(1, 0.45 + 1.45 * g, tone.peak)
        b -= 0.04 * tone.peak
      }
      if (i === RANGE_LAYERS.length - 1) a *= smooth(0.1, 0.5, Math.abs(xn - 0.5))
      const y = (b - a * ridged(xn * L.f * (W / H) * 0.62 + off, seed + i * 101, 7)) * H
      base[x] = y
      let t = 0
      if (L.trees) {
        const tw = Math.max(3, W * 0.006)
        const k = Math.floor(x / tw + hash2(i, 3, seed) * 9)
        const local = (x / tw) % 1
        const th = L.trees * H * (0.45 + 0.9 * hash2(k, i, seed + 5))
        t = th * Math.max(0, 1 - Math.abs(local * 2 - 1) * (1.1 + hash2(k, 9, seed) * 0.5))
      }
      r[x] = y - t
    }
    ridges.push(r)
    bases.push(base)
  })
  const win = Math.max(3, Math.round(W * 0.045))
  const slopes = bases.map((b) => {
    const sl = new Float32Array(W)
    for (let x = 0; x < W; x++) sl[x] = Math.max(-1.6, Math.min(1.6, (b[Math.min(W - 1, x + win)] - b[Math.max(0, x - win)]) / (2 * win)))
    return sl
  })
  return { W, H, tone, seed, ridges, bases, slopes, lakeTop: H * 0.82 }
}

function sky(P: RangePlan, x: number, y: number, out: number[]) {
  const { W, H, tone: t, seed } = P
  const xn = x / W
  const yn = y / H
  const s = t.sky
  const k = clamp01(yn / t.horizon) * (s.length - 1)
  const i = Math.min(s.length - 2, Math.floor(k))
  const f = k - i
  for (let c = 0; c < 3; c++) out[c] = mix(s[i][c], s[i + 1][c], f)
  const dx = (xn - t.sun[0]) * (W / H)
  const dy = yn - t.sun[1]
  const d = Math.sqrt(dx * dx + dy * dy)
  const glow = Math.exp(-((d / t.sunSize) ** 2)) * 0.75 + Math.exp(-d / (t.sunSize * 2.4)) * 0.3
  for (let c = 0; c < 3; c++) out[c] = mix(out[c], t.sunColor[c], clamp01(glow))
  if (t.clouds) {
    const n = fbm(xn * 3.2 * (W / H), yn * 11, seed + 900, 5)
    const band = smooth(0.02, 0.2, yn) * (1 - smooth(t.horizon * 0.6, t.horizon * 0.95, yn))
    const cl = smooth(0.5, 0.78, n) * band * t.clouds
    const lit = clamp01(1 - d * 1.4)
    const under = fbm(xn * 3.2 * (W / H), yn * 11 + 0.08, seed + 900, 3) < n ? 1 : 0.6
    for (let c = 0; c < 3; c++) out[c] = mix(out[c], mix(out[c] * 0.82 + 30 * under, t.sunColor[c], lit * 0.75), cl)
  }
  if (t.stars) {
    const h = hash2(x, y, seed + 77)
    if (h > 0.9965) {
      const b = (h - 0.9965) / 0.0035
      const fade = 1 - smooth(0.25, 0.6, yn)
      for (let c = 0; c < 3; c++) out[c] = mix(out[c], 255, b * fade)
    }
  }
}

function terrain(P: RangePlan, i: number, x: number, y: number, out: number[]) {
  const { W, H, tone: t, seed, ridges, bases } = P
  const L = RANGE_LAYERS[i]
  const xn = x / W
  const yn = y / H
  const r = ridges[i][x]
  const d = (y - r) / H
  const B = bases[i]
  const slope = (B[Math.min(W - 1, x + 2)] - B[Math.max(0, x - 2)]) / 4
  const S = P.slopes[i][x]
  const side = t.sun[0] > 0.5 ? 1 : -1
  const fx = L.f * 5.5 * (W / H)
  /* texture hangs from the crest and is sheared along the slope, so ribs and
     gullies run down the face instead of straight down the picture */
  const u = xn * fx - d * S * fx * 0.95
  const v = d * L.f * 7 + i * 3.7
  const n0 = fbm(u, v, seed + i * 41, 5)
  const n1 = fbm(u + 0.035, v, seed + i * 41, 5)
  const gully = Math.tanh((n1 - n0) * side * 16)
  const near = Math.exp(-d * 9)
  const face = Math.tanh(S * side * 1.5) * (0.35 + 0.65 * near) + Math.tanh(slope * side * 1.5) * Math.exp(-d * 40) * 0.6
  const tone2 = fbm(u * 0.35, v * 0.5, seed + i * 7, 3)
  let light = clamp01(0.4 + 0.3 * face + 0.55 * gully + (tone2 - 0.5) * 0.5)
  light *= 1 - clamp01(d * 1.6) * 0.45
  if (L.trees) {
    const tex = vnoise(x * 0.9, y * 0.35, seed + i)
    for (let c = 0; c < 3; c++) out[c] = mix(t.forest[c] * (0.75 + 0.5 * tex), t.rockLit[c] * 0.42, light * 0.3 * (1 - d * 3))
  } else {
    /* snow only on high ground: above the tone's snow line, thickest at the crest
       and lingering in the gullies */
    const line = t.snowLine + 0.14 * (fbm(xn * 9, 3.3, seed + 50 + i, 4) - 0.5) + 0.09 * (n0 - 0.5)
    const high = 1 - smooth(line - 0.03, line + 0.02, yn)
    const cap = 1 - smooth(L.snow * 0.6, L.snow, d + 0.03 * (n0 - 0.5))
    const couloir = smooth(0.55, 0.63, n0) * (1 - smooth(line, line + 0.09, yn))
    const snow = t.snow ? clamp01(Math.max(high * cap, couloir * (L.snow ? 1 : 0)) * t.snow) : 0
    for (let c = 0; c < 3; c++) {
      const rock = mix(t.rockShadow[c], t.rockLit[c], light)
      const sn = mix(t.snowShadow[c], t.snowLit[c], clamp01(light * 1.25 - 0.1))
      out[c] = mix(rock, sn, snow)
    }
    const rim = Math.exp((-d * H) / 2.2) * clamp01(light * 1.6 - 0.4) * 0.55
    for (let c = 0; c < 3; c++) out[c] = mix(out[c], t.sunColor[c], rim)
  }
  const dx = (xn - t.sun[0]) * (W / H)
  const glow = Math.exp(-((Math.sqrt(dx * dx + (yn - t.sun[1]) ** 2) / (t.sunSize * 2)) ** 2)) * 0.5
  const m = Math.pow(clamp01(d / 0.2), 1.5) * L.mist * t.mist
  for (let c = 0; c < 3; c++) {
    const hz = mix(t.haze[c], t.sunColor[c], glow)
    out[c] = mix(out[c], hz, L.fog * (0.4 + 0.6 * t.mist))
    out[c] = mix(out[c], hz, m)
  }
}

function layerAt(P: RangePlan, x: number, y: number, top: number) {
  for (let i = top; i >= 0; i--) if (y >= P.ridges[i][x]) return i
  return -1
}

/** One pixel of the range, without the foreground layer when `top` excludes it. */
export function shadePixel(P: RangePlan, x: number, y: number, top: number, out: number[]) {
  const last = RANGE_LAYERS.length - 1
  const i = layerAt(P, x, y, top)
  if (i === last) return terrain(P, i, x, y, out)
  const { W, H, tone: t, seed, lakeTop } = P
  if (t.lake && top === last && y > lakeTop) {
    const k = (y - lakeTop) / (H - lakeTop)
    const half = 0.08 + 0.5 * k + 0.04 * (vnoise(y * 0.05, 1, seed) - 0.5)
    if (Math.abs(x / W - 0.5) < half) {
      const rip = Math.sin(y * 1.3 + vnoise(x * 0.02, y * 0.3, seed + 3) * 6) * (1 + k * 3)
      const sx = Math.max(0, Math.min(W - 1, Math.round(x + rip)))
      const sy = Math.max(0, Math.round(2 * lakeTop - y - k * 6))
      shadePixel(P, sx, sy, last - 1, out)
      const glint = Math.exp(-(((x / W - t.sun[0]) / 0.03) ** 2)) * (vnoise(x * 0.3, y * 1.2, seed + 8) > 0.6 ? 0.5 : 0.1)
      for (let c = 0; c < 3; c++) out[c] = mix(mix(out[c] * 0.84, t.water[c], 0.28 + 0.4 * k), t.sunColor[c], glint * (1 - k))
      const edge = smooth(half - 0.012, half, Math.abs(x / W - 0.5))
      if (edge > 0) {
        const o2 = [0, 0, 0]
        const j = layerAt(P, x, y, last - 1)
        if (j < 0) sky(P, x, y, o2)
        else terrain(P, j, x, y, o2)
        for (let c = 0; c < 3; c++) out[c] = mix(out[c], o2[c], edge)
      }
      return
    }
  }
  if (i < 0) return sky(P, x, y, out)
  terrain(P, i, x, y, out)
}

/** Paints rows [y0, y1) into an RGBA buffer, with a little film grain. */
export function paintRows(P: RangePlan, buf: Uint8ClampedArray, y0: number, y1: number) {
  const out = [0, 0, 0]
  const last = RANGE_LAYERS.length - 1
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < P.W; x++) {
      shadePixel(P, x, y, last, out)
      const g = (hash2(x, y, P.seed + 999) - 0.5) * 9
      const o = (y * P.W + x) * 4
      buf[o] = out[0] + g
      buf[o + 1] = out[1] + g
      buf[o + 2] = out[2] + g
      buf[o + 3] = 255
    }
  }
}
// #endregion range

// #region logic
/** Monthly or yearly price, as the per-month figure plus what is billed. */
export function priceFor(monthly: number, billing: "monthly" | "yearly", discount: number) {
  const round = (n: number) => Math.round(n * 100) / 100
  if (billing === "monthly") return { perMonth: monthly, billed: monthly }
  const perMonth = round(monthly * (1 - discount))
  return { perMonth, billed: round(perMonth * 12) }
}

export function formatMoney(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

export function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

export function filterUsers(users: SttUser[], query: string, role: string) {
  const q = query.trim().toLowerCase()
  return users.filter(
    (u) => (role === "All" || u.role === role) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
  )
}

export function todoSummary(todos: SttTodo[]) {
  const done = todos.filter((t) => t.done).length
  return todos.length - done + " Pending, " + done + " completed"
}

/** Moves a deal one stage along the pipeline, stopping at the last stage. */
export function advanceDeal(deals: SttDeal[], id: string, stageCount: number) {
  return deals.map((d) => (d.id === id ? { ...d, stage: Math.min(stageCount - 1, d.stage + 1) } : d))
}

export function stageTotal(deals: SttDeal[], stage: number) {
  return deals.filter((d) => d.stage === stage).reduce((s, d) => s + d.value, 0)
}

export function compactMoney(n: number) {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
  if (n >= 1000) return "$" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  return "$" + n
}

/**
 * A smooth line and its filled area through `values`. The command structure
 * depends only on the number of values, so two series of equal length tween
 * into each other point for point.
 */
export function areaPath(values: number[], w: number, h: number, pad = 8) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, pad + (1 - (v - min) / span) * (h - pad * 2)])
  let line = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1)
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    line += " C" + [c1, c2, p2].map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")
  }
  return { line, area: line + " L" + w + "," + h + " L0," + h + " Z", points: pts }
}

/** A sagging string of prayer flags: the curve, and each flag's anchor and hang angle. */
export function flagString(x0: number, y0: number, x1: number, y1: number, sag: number, count: number) {
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2 + sag
  const at = (t: number) => {
    const u = 1 - t
    return {
      x: u * u * x0 + 2 * u * t * cx + t * t * x1,
      y: u * u * y0 + 2 * u * t * cy + t * t * y1,
      dx: 2 * u * (cx - x0) + 2 * t * (x1 - cx),
      dy: 2 * u * (cy - y0) + 2 * t * (y1 - cy),
    }
  }
  const flags = []
  for (let i = 0; i < count; i++) {
    const p = at((i + 0.5) / count)
    flags.push({ x: p.x, y: p.y, angle: (Math.atan2(p.dy, p.dx) * 180) / Math.PI })
  }
  return { d: "M" + x0 + "," + y0 + " Q" + cx + "," + cy + " " + x1 + "," + y1, flags }
}

export const FLAG_COLORS = ["#2f6fd6", "#f4f1ea", "#d8402f", "#2e9c5a", "#f2c230"]
// #endregion logic

// #region content
const UNSPLASH = "https://images.unsplash.com/photo-"
const photo = (id: string, alt: string, w: number, focus = "50% 50%") => ({ src: UNSPLASH + id + "?auto=format&fit=crop&w=" + w + "&q=80", alt, focus })
const face = (id: string) => UNSPLASH + id + "?auto=format&fit=crop&w=160&h=160&q=80&crop=faces"

export const DEFAULT_BRAND = { name: "Nexora", tagline: "Manage users, roles, projects, and activity with a dashboard built to keep your team organized and in control." }

export const DEFAULT_NAV = [
  { label: "Product", to: "how" },
  { label: "Solutions", to: "features" },
  { label: "Pricing", to: "pricing" },
  { label: "Blog", to: "testimonials" },
  { label: "Company", to: "footer" },
] as SttNavLink[]

export const DEFAULT_HERO = {
  eyebrow: "See the bigger picture",
  eyebrowTag: "for founders",
  eyebrowFaces: [face("1438761681033-6461ffad8d80"), face("1507003211169-0a1dd7228f2d"), face("1534528741775-53994a69daeb")],
  title: ["Everything your team", "needs, in one place."],
  text: "Manage members, permissions, activity, and account status without jumping between screens.",
  cta: "Join waitlist",
  photo: photo("1506905925346-21bda4d32df4", "Snowy peaks rising out of a sea of cloud at sunrise", 2400, "50% 60%"),
} as SttHero

export const DEFAULT_LOGOS = [
  { name: "Fernhall", glyph: "none", style: "caps" },
  { name: "Synthfold", glyph: "s", style: "bold" },
  { name: "dun psykolog", glyph: "drop", style: "light" },
  { name: "Strive", glyph: "ring", style: "bold" },
  { name: "SHOAL", glyph: "none", style: "italic" },
  { name: "Driftcloud", glyph: "wave", style: "mono" },
  { name: "Zenith", glyph: "burst", style: "bold" },
  { name: "Voltline", glyph: "bolt", style: "light" },
] as SttLogo[]

export const DEFAULT_HOW = {
  label: "How it works",
  title: "Manage your team in four simple steps",
  text: "Invite team members, assign roles and permissions, then monitor their activity and manage access from one centralized dashboard.",
  cta: "Try it now",
  photo: photo("1469474968028-56623f02e42e", "Late light pouring over a mountain ridge", 1600, "50% 40%"),
}

export const DEFAULT_STEPS = [
  { title: "Add Team Members", text: "Invite new users to your workspace with their email address. They land with the right defaults.", card: "invite" },
  { title: "Assign Roles", text: "Give every member a role in one click. Permissions follow the role, not the person.", card: "roles" },
  { title: "Monitor Activity", text: "See who owns which deals and projects, and how work is moving this week.", card: "metrics" },
  { title: "Manage Access", text: "Turn on two-factor, scope billing, or suspend an account the moment someone leaves.", card: "access" },
] as SttStep[]

export const DEFAULT_FEATURES = {
  label: "Features",
  title: "Everything you need to run a growing team",
  text: "Members, activity, pipeline and permissions in one powerful workspace. Click around: every panel below is live.",
  photo: photo("1501785888041-af3ef285b470", "A rowboat on a glassy alpine lake under green peaks", 2200, "50% 55%"),
}

export const DEFAULT_TABS = [
  { label: "User & Role Management", view: "users" },
  { label: "Activity Monitoring", view: "activity" },
  { label: "Projects & Deal Tracking", view: "pipeline" },
  { label: "Access & Account Control", view: "access" },
] as SttFeatureTab[]

const todos = (seed: number) =>
  [
    { id: "t1", title: "Review quarterly sales reports", tag: "Shared", date: "Oct 10, 2026", done: true },
    { id: "t2", title: "Prepare client presentation", tag: "Private", date: "Oct 12, 2026", done: false },
    { id: "t3", title: "Update team on pipeline changes", tag: "Shared", date: "Oct 14, 2026", done: seed % 3 === 0 },
    { id: "t4", title: "Schedule follow-up calls", tag: "Private", date: "Oct 16, 2026", done: false },
  ] as SttTodo[]

export const DEFAULT_USERS = [
  { id: "u1", name: "Mitchell Saint", email: "mitchell@nexora.co", role: "Admin", status: "Active", lastLogin: "Oct 9, 10:15", avatar: face("1507003211169-0a1dd7228f2d"), deals: 3, projects: 1, todos: todos(1) },
  { id: "u2", name: "Lena Rodriguez", email: "lena@nexora.co", role: "Manager", status: "Active", lastLogin: "Oct 9, 09:42", avatar: face("1438761681033-6461ffad8d80"), deals: 5, projects: 3, todos: todos(3) },
  { id: "u3", name: "Marcus Lee", email: "marcus@nexora.co", role: "Member", status: "Active", lastLogin: "Oct 8, 18:03", avatar: face("1500648767791-00dcc994a43e"), deals: 2, projects: 2, todos: todos(2) },
  { id: "u4", name: "Hannah Cho", email: "hannah@nexora.co", role: "Member", status: "Active", lastLogin: "Oct 8, 16:27", avatar: face("1534528741775-53994a69daeb"), deals: 1, projects: 4, todos: todos(6) },
  { id: "u5", name: "Aisha Mensah", email: "aisha@nexora.co", role: "Manager", status: "Active", lastLogin: "Oct 8, 11:50", avatar: face("1531123897727-8f129e1688ce"), deals: 7, projects: 2, todos: todos(4) },
  { id: "u6", name: "Daniel Hoffmann", email: "daniel@nexora.co", role: "Member", status: "Suspended", lastLogin: "Sep 30, 08:12", deals: 0, projects: 1, todos: todos(5) },
  { id: "u7", name: "Priya Raman", email: "priya@nexora.co", role: "Member", status: "Active", lastLogin: "Oct 7, 14:31", avatar: face("1494790108377-be9c29b29330"), deals: 4, projects: 2, todos: todos(9) },
  { id: "u8", name: "Ryan Patel", email: "ryan@nexora.co", role: "Admin", status: "Active", lastLogin: "Oct 7, 09:05", deals: 2, projects: 5, todos: todos(7) },
] as SttUser[]

export const DEFAULT_ACTIVITY = {
  ranges: [
    { label: "7D", values: [42, 48, 45, 60, 58, 72, 69, 81, 77, 88, 92, 98] },
    { label: "30D", values: [30, 52, 41, 47, 66, 58, 74, 62, 70, 86, 79, 94] },
    { label: "90D", values: [64, 58, 61, 55, 49, 57, 63, 70, 68, 75, 83, 90] },
  ],
  kpis: [
    { label: "Active now", value: "38", delta: "+6" },
    { label: "Sessions today", value: "412", delta: "+12%" },
    { label: "Avg. focus time", value: "3h 24m", delta: "+18m" },
  ],
  feed: [
    { who: "Lena Rodriguez", what: "moved Atlas Retail to Proposal", when: "2m" },
    { who: "Marcus Lee", what: "completed Prepare client presentation", when: "9m" },
    { who: "Aisha Mensah", what: "invited jo@fernhall.com as Member", when: "21m" },
    { who: "Mitchell Saint", what: "enabled two-factor for Managers", when: "1h" },
    { who: "Priya Raman", what: "opened the Q4 roadmap", when: "2h" },
    { who: "Hannah Cho", what: "shared Brand refresh with 4 people", when: "3h" },
    { who: "Ryan Patel", what: "exported October activity", when: "4h" },
    { who: "Daniel Hoffmann", what: "requested access to Billing", when: "5h" },
  ],
} as SttActivity

export const DEFAULT_STAGES = ["Lead", "Qualified", "Proposal", "Won"]

export const DEFAULT_DEALS = [
  { id: "d1", name: "Workspace rollout", company: "Atlas Retail", value: 48000, stage: 2, owner: "LR" },
  { id: "d2", name: "Seat expansion", company: "Fernhall", value: 12500, stage: 0, owner: "MS" },
  { id: "d3", name: "SSO add-on", company: "Synthfold", value: 8200, stage: 1, owner: "AM" },
  { id: "d4", name: "Annual renewal", company: "Driftcloud", value: 31000, stage: 3, owner: "RP" },
  { id: "d5", name: "Pilot, 40 seats", company: "Zenith", value: 9600, stage: 0, owner: "ML" },
  { id: "d6", name: "Agency plan", company: "Strive", value: 21400, stage: 1, owner: "HC" },
] as SttDeal[]

export const DEFAULT_ACCESS = {
  roles: ["Admin", "Manager", "Member"],
  permissions: [
    { label: "Invite members", grants: [true, true, false] },
    { label: "Edit roles", grants: [true, false, false] },
    { label: "View billing", grants: [true, true, false] },
    { label: "Export data", grants: [true, true, true] },
    { label: "Delete projects", grants: [true, false, false] },
  ],
} as SttAccess

export const DEFAULT_PRICING = {
  label: "Pricing & Plans",
  title: "Affordable Pricing Plans",
  text: "Flexible, transparent pricing to support your team's productivity and growth at every stage.",
  monthlyLabel: "Billed Monthly",
  yearlyLabel: "Billed yearly",
  discount: 0.2,
  ribbon: "Our Recommendation",
  note: "Renews automatically. Cancel anytime.",
  ribbonPhoto: photo("1464822759023-fed622ff2c3b", "Pines and river flats below a snowy range", 900, "50% 40%"),
} as SttPricing

export const DEFAULT_PLANS = [
  { id: "basic", name: "Basic Plan", blurb: "Everything you need to get started", price: 10, unit: "Per User", icon: "bolt", cta: "Get Started", features: ["Up to 5 users", "User management", "Role & permission control", "Email support"] },
  { id: "pro", name: "Pro Plan", blurb: "Advanced tools to manage and scale your team.", price: 25, unit: "20 Users", icon: "flag", cta: "Get Started", featured: true, features: ["Up to 25 users", "Advanced role management", "Projects & task tracking", "To-do lists & task assignments", "Custom reports", "Priority support"] },
  { id: "enterprise", name: "Enterprise Plan", blurb: "Complete control and security for large teams.", price: 39, unit: "50 Users", icon: "spark", cta: "Get Started", features: ["Unlimited users", "Everything in Team Pro", "Advanced analytics dashboard", "SSO & security controls", "Audit logs", "Dedicated account manager", "24/7 priority support"] },
] as SttPlan[]

export const DEFAULT_TESTIMONIALS_HEADING = {
  label: "Testimonials",
  title: "Trusted by teams that get more done",
  text: "See how teams use our platform to manage users, streamline workflows, and keep everyone aligned from one place.",
}

export const DEFAULT_TESTIMONIALS = [
  { name: "Adam Mork", role: "Project Manager at Kleo", avatar: face("1500648767791-00dcc994a43e"), quote: "We finally have one place to manage our entire team. From user access and roles to projects and activity, everything is visible and easy to control. It has made managing our growing team significantly simpler." },
  { name: "Lucien Krogel", role: "Project Manager at Fjord", avatar: face("1507003211169-0a1dd7228f2d"), quote: "Managing user permissions used to be a constant headache. Now we can add members, assign roles, and update access in seconds." },
  { name: "Ethan Parker", role: "Product Manager, SaaS startup", quote: "The activity overview gives our managers exactly the visibility they need without adding more complexity to the workflow." },
  { name: "Lena Rodriguez", role: "Growth Lead, SaaS company", avatar: face("1438761681033-6461ffad8d80"), quote: "We have much better visibility into who is working on what. It keeps our projects organized and our team accountable." },
  { name: "Marcus Lee", role: "Head of Product", avatar: face("1531123897727-8f129e1688ce"), quote: "Adding new team members and setting their permissions right takes minutes instead of hours. It has become part of our everyday workflow." },
  { name: "Daniel Hoffmann", role: "Startup operator", quote: "The dashboard gives us a clear picture of users, projects, tasks, and account activity without switching between different tools." },
  { name: "Priya Raman", role: "SaaS founder", avatar: face("1494790108377-be9c29b29330"), quote: "Simple to use, easy to manage, and built around the things our team actually needs. It has made our day-to-day administration much smoother." },
] as SttTestimonial[]

export const DEFAULT_TESTIMONIALS_PHOTO = photo("1500534314209-a25ddb2bd429", "Seven layers of blue ridges in evening haze", 1600)

export const DEFAULT_CTA = {
  title: "Bring your team management into one place",
  text: "Manage users, roles, projects, and activity with a dashboard built to keep your team organized and in control.",
  primary: "Start Free Trial",
  secondary: "Book a Demo",
  photo: photo("1519681393784-d120267933ba", "A snowy mountain under a sky full of stars", 2000, "50% 70%"),
  flags: true,
} as SttCta

export const DEFAULT_FOOTER = {
  text: "Manage users, roles, projects, and activity with a dashboard built to keep your team organized and in control.",
  columns: [
    { title: "Quicklinks", links: [{ label: "Research", href: "#" }, { label: "About", href: "#" }, { label: "Science", href: "#" }, { label: "Journal", href: "#" }, { label: "Reviews", href: "#" }] },
    { title: "Policy", links: [{ label: "Terms & conditions", href: "#" }, { label: "Privacy policy", href: "#" }, { label: "Cookie policy", href: "#" }, { label: "Returns & refund policy", href: "#" }] },
  ],
  social: [
    { label: "Instagram", icon: "instagram", href: "#" },
    { label: "TikTok", icon: "tiktok", href: "#" },
    { label: "X", icon: "x", href: "#" },
  ],
  legal: "All rights reserved.",
  photo: photo("1464822759023-fed622ff2c3b", "Pines and river flats below a snowy range", 2400, "50% 35%"),
} as SttFooter
// #endregion content

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

type IconName =
  | "arrow" | "chev" | "chevDown" | "check" | "user" | "users" | "mail" | "close" | "search" | "plus" | "bolt" | "flag" | "spark"
  | "grid" | "activity" | "folder" | "shield" | "settings" | "bell" | "star" | "menu" | "key" | "briefcase" | "clock" | "list"
  | "instagram" | "tiktok" | "x" | "linkedin" | "up"

function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className, "aria-hidden": true }
  switch (name) {
    case "arrow": return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    case "up": return <svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
    case "chev": return <svg {...p}><path d="M9 6l6 6-6 6" /></svg>
    case "chevDown": return <svg {...p}><path d="M6 9l6 6 6-6" /></svg>
    case "check": return <svg {...p}><path d="M5 12.5l4.2 4.2L19 7" /></svg>
    case "user": return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
    case "users": return <svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1.2-3.4 3.6-5 6.5-5s5.3 1.6 6.5 5" /><path d="M16 4.6a3.5 3.5 0 010 6.8M18 15.4c1.6.7 2.8 2.2 3.5 4.6" /></svg>
    case "mail": return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7l8 6 8-6" /></svg>
    case "close": return <svg {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case "search": return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>
    case "bolt": return <svg {...p} fill="currentColor" stroke="none"><path d="M13.6 2L5 13.4h5.6L9.4 22 18 10.6h-5.6z" /></svg>
    case "flag": return <svg {...p} fill="currentColor" stroke="none"><path d="M5 2.5h1.8V22H5z" /><path d="M7.5 3.5c3.2-1.6 5.6 1.4 9.7-.2l.9-.3v10.3c-4.3 1.8-6.8-1.3-10.6.3z" /></svg>
    case "spark": return <svg {...p} fill="currentColor" stroke="none"><path d="M12 1.5l2.3 6.5 6.2-3-3 6.2 6.5 2.3-6.5 2.3 3 6.2-6.2-3-2.3 6.5-2.3-6.5-6.2 3 3-6.2L1 13.5 7.5 11.2l-3-6.2 6.2 3z" /></svg>
    case "grid": return <svg {...p}><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></svg>
    case "activity": return <svg {...p}><path d="M3 12h4l3-7 4 14 3-7h4" /></svg>
    case "folder": return <svg {...p}><path d="M3 7.5A2.5 2.5 0 015.5 5H9l2 2.2h7.5A2.5 2.5 0 0121 9.7v7.8a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 17.5z" /></svg>
    case "shield": return <svg {...p}><path d="M12 3l7.5 3v5.5c0 4.8-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.7-7.5-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg>
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" /></svg>
    case "bell": return <svg {...p}><path d="M6 16.5V11a6 6 0 1112 0v5.5l1.5 2H4.5z" /><path d="M10 21h4" /></svg>
    case "star": return <svg {...p} fill="currentColor" stroke="none"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></svg>
    case "menu": return <svg {...p}><path d="M4 8h16M4 16h16" /></svg>
    case "key": return <svg {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M16 7l2.5 2.5M14 9l2 2" /></svg>
    case "briefcase": return <svg {...p}><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8.5 7V5.5A1.5 1.5 0 0110 4h4a1.5 1.5 0 011.5 1.5V7M3 12.5h18" /></svg>
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
    case "list": return <svg {...p}><path d="M9 6.5h11M9 12h11M9 17.5h11" /><path d="M4 6.5h.01M4 12h.01M4 17.5h.01" strokeWidth="2.6" /></svg>
    case "instagram": return <svg {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.2 6.8h.01" strokeWidth="2.4" /></svg>
    case "tiktok": return <svg {...p}><path d="M14 3.5v11.2a3.8 3.8 0 11-3.8-3.8" /><path d="M14 3.5c.5 2.8 2.4 4.6 5.5 4.8" /></svg>
    case "x": return <svg {...p}><path d="M4 4l16 16M20 4L4 20" /></svg>
    case "linkedin": return <svg {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M8 10.5V16M8 7.8v.01M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.4-2.6s2.1.9 2.1 2.6V16" /></svg>
  }
}

function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="stt-mark">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="currentColor" opacity="0.08" stroke="currentColor" strokeOpacity="0.3" />
      <path d="M6 23l6.2-9.5 3.6 5.2 3.2-4.6L26 23z" fill="currentColor" />
      <path d="M12.2 13.5l1.9 2.9-1.9-.8-1.6 1.2z" fill="var(--stt-bg)" opacity="0.9" />
      <circle cx="22.5" cy="9.5" r="2.2" fill="var(--stt-accent)" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Drawn mountains and photographs over them                           */
/* ------------------------------------------------------------------ */

const RANGE_JOBS = {} as { [key: string]: Promise<HTMLCanvasElement> | undefined }
let rangeQueue = Promise.resolve() as Promise<unknown>

/** Paints a range once per tone and seed, a few rows per frame, one picture at a time. */
function paintRange(tone: SttTone, seed: number, W: number, H: number) {
  const key = tone + "|" + seed + "|" + W
  const known = RANGE_JOBS[key]
  if (known) return known
  const job = rangeQueue.then(
    () =>
      new Promise<HTMLCanvasElement>((resolve) => {
        const cv = document.createElement("canvas")
        cv.width = W
        cv.height = H
        const ctx = cv.getContext("2d")
        if (!ctx) return resolve(cv)
        const img = ctx.createImageData(W, H)
        const plan = planRange(W, H, RANGE_TONES[tone] as RangeTone, seed)
        let y = 0
        const step = () => {
          const t0 = performance.now()
          while (y < H && performance.now() - t0 < 10) {
            paintRows(plan, img.data, y, Math.min(H, y + 6))
            y += 6
          }
          if (y < H) setTimeout(step, 0)
          else {
            ctx.putImageData(img, 0, 0)
            resolve(cv)
          }
        }
        step()
      }),
  )
  rangeQueue = job
  RANGE_JOBS[key] = job
  return job
}

function RangeCanvas({ tone, seed, small, large }: { tone: SttTone; seed: number; small?: boolean; large?: boolean }) {
  const ref = React.useRef(null as HTMLCanvasElement | null)
  const [painted, setPainted] = React.useState(false)
  const W = small ? 480 : large ? 1280 : 960
  const H = small ? 300 : large ? 800 : 600
  React.useEffect(() => {
    let alive = true
    setPainted(false)
    paintRange(tone, seed, W, H).then((src) => {
      const cv = ref.current
      const ctx = cv && cv.getContext("2d")
      if (!alive || !ctx) return
      ctx.drawImage(src, 0, 0)
      setPainted(true)
    })
    return () => {
      alive = false
    }
  }, [tone, seed, W])
  return <canvas ref={ref} className="stt-range" width={W} height={H} data-painted={painted ? "" : undefined} aria-hidden="true" />
}

function Photo({ photo, tone, seed = 1, eager, small, large, className }: { photo: SttPhoto | null; tone: SttTone; seed?: number; eager?: boolean; small?: boolean; large?: boolean; className?: string }) {
  const [state, setState] = React.useState("loading")
  const [waited, setWaited] = React.useState(false)
  const imgRef = React.useRef(null as HTMLImageElement | null)
  React.useEffect(() => {
    setState("loading")
    const im = imgRef.current
    if (im && im.complete) setState(im.naturalWidth ? "ready" : "error")
    /* paint the range only if the photograph is not here almost at once */
    const t = window.setTimeout(() => setWaited(true), 500)
    return () => clearTimeout(t)
  }, [photo && photo.src])
  const sky = (RANGE_TONES[tone] as RangeTone).sky.map((c) => "rgb(" + c.join(",") + ")")
  const needRange = !photo || state === "error" || (waited && state !== "ready")
  return (
    <div className={"stt-photo " + (className || "")} data-state={state} style={{ background: "linear-gradient(" + sky.join(",") + ")" }}>
      {needRange && <RangeCanvas tone={tone} seed={seed} small={small} large={large} />}
      {photo && state !== "error" && (
        <img
          ref={imgRef}
          className="stt-photo-img"
          src={photo.src}
          alt={photo.alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
          style={{ objectPosition: photo.focus || "50% 50%", maxWidth: "none" }}
        />
      )}
    </div>
  )
}

function Avatar({ name, src, size = 32 }: { name: string; src?: string; size?: number }) {
  const [failed, setFailed] = React.useState(false)
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)
  return (
    <span className="stt-avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: "linear-gradient(140deg, hsl(" + hue + " 32% 38%), hsl(" + ((hue + 40) % 360) + " 30% 22%))" }}>
      <span aria-hidden="true">{initials(name)}</span>
      {src && !failed && <img src={src} alt="" width={size} height={size} loading="lazy" onError={() => setFailed(true)} style={{ maxWidth: "none" }} />}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Hooks and helpers                                                   */
/* ------------------------------------------------------------------ */

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  useIsoLayoutEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

/** True while the element is at least partly on screen. */
function useInView(ref: React.RefObject<HTMLElement | null>, margin = "0px") {
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== "function") return setInView(true)
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return inView
}

/** The element that actually scrolls: a host's scrolling panel, or the window. */
function findScroller(el: HTMLElement): HTMLElement | Window {
  let p = el.parentElement
  while (p && p !== document.body && p !== document.documentElement) {
    const s = getComputedStyle(p)
    if (/(auto|scroll|overlay)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1) return p
    p = p.parentElement
  }
  return window
}

function scrollToEl(scroller: HTMLElement | Window, el: HTMLElement, smooth: boolean) {
  const behavior = smooth ? "smooth" : "auto"
  if (scroller === window) {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 8, behavior })
  } else {
    const s = scroller as HTMLElement
    s.scrollTo({ top: s.scrollTop + el.getBoundingClientRect().top - s.getBoundingClientRect().top - 8, behavior })
  }
}

/** Words wrapped for a masked rise. */
function Split({ text, className }: { text: string; className?: string }) {
  return (
    <span className={"stt-split " + (className || "")} aria-label={text}>
      {text.split(/\s+/).map((w, i) => (
        <React.Fragment key={i}>
          {i > 0 && " "}
          <span className="stt-w" aria-hidden="true">
            <span>{w}</span>
          </span>
        </React.Fragment>
      ))}
    </span>
  )
}

function SectionHead({ head, id, align = "split" }: { head: SttHeading; id: string; align?: "split" | "stack" }) {
  return (
    <div className={"stt-head stt-head-" + align}>
      <div>
        <span className="stt-pill" data-stt-reveal="">{head.label}</span>
        <h2 id={id} className="stt-h2">
          <Split text={head.title} />
        </h2>
      </div>
      <p className="stt-lede" data-stt-reveal="">{head.text}</p>
    </div>
  )
}

function Toggle({ on, onChange, label, small }: { on: boolean; onChange: (v: boolean) => void; label: string; small?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={"stt-switch" + (small ? " stt-switch-sm" : "")} data-on={on ? "" : undefined} onClick={() => onChange(!on)}>
      <span />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const STEP_MS = 5600

function StepCard({ kind, user, reduced }: { kind: SttStep["card"]; user: SttUser; reduced: boolean }) {
  const emails = ["jo@fernhall.com", "sam@synthfold.io", "ines@zenith.app"]
  const [typed, setTyped] = React.useState(reduced ? emails[0] : "")
  const [sent, setSent] = React.useState([] as string[])
  const [role, setRole] = React.useState(user.role as string)
  const [toggles, setToggles] = React.useState([true, true, false])
  const barsRef = React.useRef(null as HTMLDivElement | null)

  React.useEffect(() => {
    if (kind !== "invite" || reduced) return
    let alive = true
    let i = 0
    let ch = 0
    let timer = 0
    const tick = () => {
      if (!alive) return
      const word = emails[i % emails.length]
      ch++
      setTyped(word.slice(0, ch))
      if (ch < word.length) timer = window.setTimeout(tick, 55 + Math.random() * 50)
      else
        timer = window.setTimeout(() => {
          setSent((s) => [word, ...s].slice(0, 2))
          setTyped("")
          ch = 0
          i++
          timer = window.setTimeout(tick, 500)
        }, 700)
    }
    timer = window.setTimeout(tick, 450)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [kind, reduced])

  React.useEffect(() => {
    if (kind !== "metrics" || reduced || !barsRef.current) return
    const t = gsap.fromTo(barsRef.current.children, { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: "power3.out", stagger: 0.06, transformOrigin: "50% 100%" })
    return () => {
      t.kill()
    }
  }, [kind, reduced])

  if (kind === "invite")
    return (
      <>
        <div className="stt-card-top">
          <Icon name="mail" size={15} /> <span>Invite members</span>
        </div>
        <div className="stt-invite-row">
          <div className="stt-field" aria-hidden="true">
            <Icon name="mail" size={13} />
            <span>{typed || <em>name@company.com</em>}</span>
            {!reduced && <i className="stt-caret" />}
          </div>
          <span className="stt-chip">Member <Icon name="chevDown" size={12} /></span>
        </div>
        <div className="stt-btn stt-btn-light stt-btn-sm stt-btn-block" aria-hidden="true">Send invite <Icon name="arrow" size={13} /></div>
        <div className="stt-mini-label">Pending invites</div>
        <ul className="stt-pending">
          {(sent.length ? sent : ["ana@driftcloud.co"]).map((e) => (
            <li key={e}>
              <Avatar name={e} size={24} />
              <span className="stt-pending-mail">{e}</span>
              <b>Pending</b>
            </li>
          ))}
        </ul>
      </>
    )
  if (kind === "roles")
    return (
      <>
        <div className="stt-card-top">
          <Icon name="user" size={15} /> <span>User Details</span>
        </div>
        <div className="stt-who">
          <Avatar name={user.name} src={user.avatar} size={46} />
          <div>
            <strong>{user.name}</strong>
            <span>
              <Icon name="mail" size={12} /> {user.email}
            </span>
            <div className="stt-badges">
              <b className="stt-badge">{role}</b>
              <b className="stt-badge stt-badge-ok">Active</b>
            </div>
          </div>
        </div>
        <div className="stt-mini-label">Role</div>
        <div className="stt-seg" role="radiogroup" aria-label="Role">
          {["Admin", "Manager", "Member"].map((r) => (
            <button key={r} type="button" role="radio" aria-checked={role === r} data-on={role === r ? "" : undefined} onClick={() => setRole(r)}>
              {r}
            </button>
          ))}
        </div>
        <p className="stt-hint">{role === "Admin" ? "Full control of members, billing and settings." : role === "Manager" ? "Can invite members and manage projects." : "Works on assigned projects and tasks."}</p>
      </>
    )
  if (kind === "metrics")
    return (
      <>
        <div className="stt-card-top">
          <Icon name="activity" size={15} /> <span>User Metrics</span>
        </div>
        <div className="stt-metric">
          <span className="stt-metric-ic"><Icon name="briefcase" size={14} /></span>
          <div>
            <strong>Owned Deals</strong>
            <span>{user.deals} active deals</span>
          </div>
          <u>View Details</u>
        </div>
        <div className="stt-metric">
          <span className="stt-metric-ic"><Icon name="folder" size={14} /></span>
          <div>
            <strong>Active Projects</strong>
            <span>{user.projects} projects</span>
          </div>
          <u>View Projects</u>
        </div>
        <div className="stt-mini-label">Focus hours, this week</div>
        <div className="stt-bars" ref={barsRef}>
          {[38, 62, 48, 80, 70, 92, 56].map((h, i) => (
            <span key={i} style={{ height: h + "%" }} data-hi={i === 5 ? "" : undefined} />
          ))}
        </div>
      </>
    )
  const rows = ["Workspace access", "Two-factor authentication", "Billing visibility"]
  return (
    <>
      <div className="stt-card-top">
        <Icon name="shield" size={15} /> <span>Account Access</span>
      </div>
      <ul className="stt-access-list">
        {rows.map((r, i) => (
          <li key={r}>
            <span>{r}</span>
            <Toggle small on={toggles[i]} label={r} onChange={(v) => setToggles((t) => t.map((x, j) => (j === i ? v : x)))} />
          </li>
        ))}
      </ul>
      <div className="stt-status-row">
        <span>
          <i className="stt-dot" data-off={toggles[0] ? undefined : ""} /> {toggles[0] ? "Account active" : "Access paused"}
        </span>
        <button type="button" className="stt-btn stt-btn-ghost stt-btn-sm" onClick={() => setToggles([!toggles[0], toggles[1], toggles[2]])}>
          {toggles[0] ? "Suspend user" : "Restore"}
        </button>
      </div>
    </>
  )
}

function HowItWorks({ head, steps, user, reduced, onTry, uid }: { head: SttHeading & { cta: string; photo: SttPhoto | null }; steps: SttStep[]; user: SttUser; reduced: boolean; onTry: () => void; uid: string }) {
  const [active, setActive] = React.useState(0)
  const [hover, setHover] = React.useState(false)
  const secRef = React.useRef(null as HTMLElement | null)
  const cardRef = React.useRef(null as HTMLDivElement | null)
  const mediaRef = React.useRef(null as HTMLDivElement | null)
  const inView = useInView(secRef)
  const playing = inView && !hover && !reduced

  React.useEffect(() => {
    if (reduced) return
    const tl = gsap.timeline()
    if (cardRef.current) tl.fromTo(cardRef.current, { opacity: 0, y: 22, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out" }, 0)
    if (mediaRef.current) tl.to(mediaRef.current, { scale: 1.06 + active * 0.04, xPercent: -active * 2.2, duration: 1.6, ease: "power2.inOut" }, 0)
    return () => {
      tl.kill()
    }
  }, [active, reduced])

  return (
    <section className="stt-sec" id={uid + "-how"} ref={secRef} aria-labelledby={uid + "-how-t"}>
      <SectionHead head={head} id={uid + "-how-t"} />
      <div className="stt-how">
        <div className="stt-steps-col" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <ol className="stt-steps">
            {steps.map((s, i) => (
              <li key={s.title} data-active={i === active ? "" : undefined} data-done={i < active ? "" : undefined} data-stt-reveal="">
                <button type="button" aria-expanded={i === active} onClick={() => setActive(i)}>
                  <span className="stt-check" aria-hidden="true">
                    <Icon name="check" size={12} />
                  </span>
                  <span className="stt-step-title">{s.title}</span>
                  <span className="stt-step-num">0{i + 1}</span>
                </button>
                <div className="stt-step-body">
                  <p>{s.text}</p>
                </div>
                <span className="stt-step-rule" aria-hidden="true">
                  {i === active && (
                    <i
                      key={active + (playing ? "p" : "s")}
                      className="stt-step-progress"
                      style={{ animationDuration: STEP_MS + "ms", animationPlayState: playing ? "running" : "paused" }}
                      onAnimationEnd={() => setActive((a) => (a + 1) % steps.length)}
                    />
                  )}
                </span>
              </li>
            ))}
          </ol>
          <button type="button" className="stt-btn stt-btn-light stt-btn-sm stt-try" onClick={onTry} data-stt-reveal="">
            {head.cta} <Icon name="chev" size={13} />
          </button>
        </div>
        <div className="stt-how-visual" data-stt-reveal="">
          <div className="stt-how-media" ref={mediaRef}>
            <Photo photo={head.photo} tone="alpenglow" seed={3} />
          </div>
          <div className="stt-how-shade" />
          <div className="stt-float-card" aria-live="polite">
            <div ref={cardRef} key={active}>
              <StepCard kind={steps[active].card} user={user} reduced={reduced} />
            </div>
          </div>
          <div className="stt-step-dots" aria-hidden="true">
            {steps.map((s, i) => (
              <i key={s.title} data-on={i === active ? "" : undefined} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* The live app inside Features                                        */
/* ------------------------------------------------------------------ */

function UsersView({ users, setUsers, reduced }: { users: SttUser[]; setUsers: (fn: (u: SttUser[]) => SttUser[]) => void; reduced: boolean }) {
  const [query, setQuery] = React.useState("")
  const [role, setRole] = React.useState("All")
  const [selected, setSelected] = React.useState(users[0] ? users[0].id : "")
  const [mode, setMode] = React.useState("all")
  const [invite, setInvite] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState("Member" as SttRole)
  const [todosOpen, setTodosOpen] = React.useState(true)
  const detailRef = React.useRef(null as HTMLDivElement | null)
  const listRef = React.useRef(null as HTMLDivElement | null)
  const rows = filterUsers(users, query, role)
  const user = users.find((u) => u.id === selected) || null

  React.useEffect(() => {
    if (reduced || !detailRef.current) return
    const t = gsap.fromTo(detailRef.current.children, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" })
    return () => {
      t.kill()
    }
  }, [selected, reduced])

  const addInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmail(invite)) return
    const name = invite.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    const id = "inv" + Date.now()
    setUsers((u) => [{ id, name, email: invite.trim(), role: inviteRole, status: "Invited", lastLogin: "Never", deals: 0, projects: 0, todos: [] }, ...u])
    setInvite("")
    setSelected(id)
    setMode("all")
    setQuery("")
    setRole("All")
    requestAnimationFrame(() => {
      const row = listRef.current && listRef.current.querySelector("[data-row]")
      if (row && !reduced) gsap.fromTo(row, { backgroundColor: "rgba(243,178,122,.28)" }, { backgroundColor: "rgba(243,178,122,0)", duration: 1.6, ease: "power2.out", clearProps: "backgroundColor" })
    })
  }
  const toggleTodo = (tid: string) =>
    setUsers((all) => all.map((u) => (u.id === selected ? { ...u, todos: u.todos.map((t) => (t.id === tid ? { ...t, done: !t.done } : t)) } : u)))
  const setStatus = (on: boolean) => setUsers((all) => all.map((u) => (u.id === selected ? { ...u, status: on ? "Active" : "Suspended" } : u)))

  return (
    <div className="stt-users">
      <div className="stt-users-main">
        <div className="stt-app-title">
          <h3>Manage Users</h3>
          <span>View, manage, and monitor all workspace members.</span>
        </div>
        <div className="stt-toolbar">
          <div className="stt-seg stt-seg-sm" role="tablist" aria-label="Users">
            <button type="button" role="tab" aria-selected={mode === "all"} data-on={mode === "all" ? "" : undefined} onClick={() => setMode("all")}>All Users</button>
            <button type="button" role="tab" aria-selected={mode === "invite"} data-on={mode === "invite" ? "" : undefined} onClick={() => setMode("invite")}>Invite New User</button>
          </div>
          <label className="stt-search">
            <Icon name="search" size={13} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" aria-label="Search members" />
          </label>
          <div className="stt-filters" role="group" aria-label="Filter by role">
            {["All", "Admin", "Manager", "Member"].map((r) => (
              <button key={r} type="button" data-on={role === r ? "" : undefined} aria-pressed={role === r} onClick={() => setRole(r)}>{r}</button>
            ))}
          </div>
        </div>
        {mode === "invite" && (
          <form className="stt-invite-form" onSubmit={addInvite}>
            <Icon name="mail" size={14} />
            <input value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="teammate@company.com" aria-label="Email to invite" autoFocus />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as SttRole)} aria-label="Role">
              <option>Member</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>
            <button type="submit" className="stt-btn stt-btn-light stt-btn-sm" disabled={!isEmail(invite)}>Send invite</button>
          </form>
        )}
        <div className="stt-table" ref={listRef} role="table" aria-label="Members">
          <div className="stt-tr stt-th" role="row">
            <span role="columnheader">User</span>
            <span role="columnheader">Email</span>
            <span role="columnheader">Role</span>
            <span role="columnheader">Last Login</span>
          </div>
          {rows.map((u) => (
            <div key={u.id} role="row" data-row="" className="stt-tr" data-on={u.id === selected ? "" : undefined} tabIndex={0} onClick={() => setSelected(u.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(u.id))}>
              <span role="cell" className="stt-td-user">
                <Avatar name={u.name} src={u.avatar} size={24} />
                <b>{u.name}</b>
              </span>
              <span role="cell" className="stt-td-mute">{u.email}</span>
              <span role="cell">
                <i className="stt-role" data-role={u.role}>{u.role}</i>
              </span>
              <span role="cell" className="stt-td-mute">{u.status === "Invited" ? "Invite sent" : u.lastLogin}</span>
            </div>
          ))}
          {!rows.length && <div className="stt-empty">No members match "{query}".</div>}
        </div>
      </div>
      <aside className="stt-details" aria-label="User details">
        <div className="stt-details-head">
          <span><Icon name="user" size={14} /> User Details</span>
          {user && (
            <button type="button" className="stt-icon-btn" aria-label="Close details" onClick={() => setSelected("")}>
              <Icon name="close" size={12} />
            </button>
          )}
        </div>
        {user ? (
          <div ref={detailRef} key={user.id} className="stt-details-body">
            <div className="stt-who">
              <Avatar name={user.name} src={user.avatar} size={44} />
              <div>
                <strong>{user.name}</strong>
                <span><Icon name="mail" size={12} /> {user.email}</span>
                <div className="stt-badges">
                  <b className="stt-badge">{user.role}</b>
                  <b className={"stt-badge " + (user.status === "Active" ? "stt-badge-ok" : user.status === "Invited" ? "stt-badge-warm" : "stt-badge-off")}>{user.status}</b>
                </div>
              </div>
            </div>
            <div className="stt-mini-label">User Metrics</div>
            <div className="stt-metric">
              <span className="stt-metric-ic"><Icon name="briefcase" size={13} /></span>
              <div><strong>Owned Deals</strong><span>{user.deals} active deals</span></div>
              <u>View Details</u>
            </div>
            <div className="stt-metric">
              <span className="stt-metric-ic"><Icon name="folder" size={13} /></span>
              <div><strong>Active Projects</strong><span>{user.projects} projects</span></div>
              <u>View Projects</u>
            </div>
            <div className="stt-todo">
              <button type="button" className="stt-todo-head" aria-expanded={todosOpen} onClick={() => setTodosOpen(!todosOpen)}>
                <span className="stt-metric-ic"><Icon name="list" size={13} /></span>
                <div><strong>To-Do Lists</strong><span>{user.todos.length ? todoSummary(user.todos) : "Nothing assigned yet"}</span></div>
                <Icon name="chevDown" size={14} className={todosOpen ? "stt-rot" : ""} />
              </button>
              {todosOpen &&
                user.todos.map((t) => (
                  <label key={t.id} className="stt-todo-item" data-done={t.done ? "" : undefined}>
                    <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
                    <span className="stt-box" aria-hidden="true"><Icon name="check" size={10} /></span>
                    <span className="stt-todo-text">
                      <b>{t.title}</b>
                      <span><i>{t.tag}</i> {t.date}</span>
                    </span>
                  </label>
                ))}
            </div>
            <div className="stt-status-row">
              <span>Account Status</span>
              <Toggle small on={user.status === "Active"} label="Account active" onChange={setStatus} />
            </div>
          </div>
        ) : (
          <div className="stt-details-empty">
            <Icon name="users" size={22} />
            <p>Select a member to see their roles, metrics and tasks.</p>
          </div>
        )}
      </aside>
    </div>
  )
}

function ActivityView({ data, reduced, inView }: { data: SttActivity; reduced: boolean; inView: boolean }) {
  const [range, setRange] = React.useState(0)
  const [hover, setHover] = React.useState(-1)
  const [feed, setFeed] = React.useState(data.feed.slice(0, 5).map((f, i) => ({ ...f, key: "f" + i })))
  const lineRef = React.useRef(null as SVGPathElement | null)
  const areaRef = React.useRef(null as SVGPathElement | null)
  const first = React.useRef(true)
  const gid = "stta" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const W = 640
  const H = 220
  const paths = areaPath(data.ranges[range].values, W, H, 18)

  React.useEffect(() => {
    const line = lineRef.current
    const area = areaRef.current
    if (!line || !area) return
    if (first.current) {
      first.current = false
      line.setAttribute("d", paths.line)
      area.setAttribute("d", paths.area)
      if (!reduced) {
        const len = line.getTotalLength()
        gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", clearProps: "strokeDasharray,strokeDashoffset" })
        gsap.fromTo(area, { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.4 })
      }
      return
    }
    if (reduced) {
      line.setAttribute("d", paths.line)
      area.setAttribute("d", paths.area)
      return
    }
    const t = gsap.to([line, area], { attr: { d: (i: number) => (i ? paths.area : paths.line) }, duration: 0.9, ease: "power3.inOut" })
    return () => {
      t.kill()
    }
  }, [range, reduced])

  React.useEffect(() => {
    if (reduced || !inView) return
    let n = 5
    const id = window.setInterval(() => {
      const next = data.feed[n % data.feed.length]
      n++
      setFeed((f) => [{ ...next, when: "now", key: "f" + n }, ...f].slice(0, 5))
    }, 3800)
    return () => clearInterval(id)
  }, [reduced, inView, data.feed])

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    const n = data.ranges[range].values.length
    setHover(Math.max(0, Math.min(n - 1, Math.round((x / W) * (n - 1)))))
  }
  const hp = hover > -1 ? paths.points[hover] : null

  return (
    <div className="stt-activity">
      <div className="stt-app-title">
        <h3>Activity Monitoring</h3>
        <span>Live presence, sessions and what changed across the workspace.</span>
      </div>
      <div className="stt-kpis">
        {data.kpis.map((k) => (
          <div key={k.label} className="stt-kpi">
            <span>{k.label}</span>
            <strong>{k.value}</strong>
            <i>{k.delta}</i>
          </div>
        ))}
      </div>
      <div className="stt-activity-grid">
        <div className="stt-chart-card">
          <div className="stt-chart-head">
            <span>Active members</span>
            <div className="stt-seg stt-seg-sm" role="radiogroup" aria-label="Range">
              {data.ranges.map((r, i) => (
                <button key={r.label} type="button" role="radio" aria-checked={range === i} data-on={range === i ? "" : undefined} onClick={() => setRange(i)}>{r.label}</button>
              ))}
            </div>
          </div>
          <svg className="stt-chart" viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none" onMouseMove={onMove} onMouseLeave={() => setHover(-1)} role="img" aria-label={"Active members, " + data.ranges[range].label}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--stt-accent)" stopOpacity="0.35" />
                <stop offset="1" stopColor="var(--stt-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((g) => (
              <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} className="stt-grid-line" />
            ))}
            <path ref={areaRef} fill={"url(#" + gid + ")"} />
            <path ref={lineRef} fill="none" stroke="var(--stt-accent)" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
            {hp && <line x1={hp[0]} x2={hp[0]} y1="0" y2={H} className="stt-cross" />}
          </svg>
          {hp && (
            <div className="stt-tip" style={{ left: (hp[0] / W) * 100 + "%", top: (hp[1] / H) * 100 + "%" }}>
              {data.ranges[range].values[hover]} active
            </div>
          )}
        </div>
        <div className="stt-feed">
          <div className="stt-chart-head">
            <span><i className="stt-live" /> Live feed</span>
          </div>
          <ul>
            {feed.map((f) => (
              <li key={f.key} className="stt-feed-item">
                <Avatar name={f.who} size={22} />
                <p><b>{f.who}</b> {f.what}</p>
                <time>{f.when}</time>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function PipelineView({ deals: initial, stages, reduced }: { deals: SttDeal[]; stages: string[]; reduced: boolean }) {
  const [deals, setDeals] = React.useState(initial)
  const boardRef = React.useRef(null as HTMLDivElement | null)
  const snap = React.useRef(null as Map<string, DOMRect> | null)

  const advance = (id: string) => {
    const board = boardRef.current
    if (board && !reduced) {
      const m = new Map<string, DOMRect>()
      board.querySelectorAll("[data-deal]").forEach((el) => m.set((el as HTMLElement).dataset.deal || "", el.getBoundingClientRect()))
      snap.current = m
    }
    setDeals((d) => advanceDeal(d, id, stages.length))
  }
  useIsoLayoutEffect(() => {
    const prev = snap.current
    const board = boardRef.current
    if (!prev || !board) return
    snap.current = null
    board.querySelectorAll("[data-deal]").forEach((el) => {
      const r0 = prev.get((el as HTMLElement).dataset.deal || "")
      if (!r0) return
      const r1 = el.getBoundingClientRect()
      const dx = r0.left - r1.left
      const dy = r0.top - r1.top
      if (dx || dy) gsap.fromTo(el, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.65, ease: "power3.out", clearProps: "transform" })
    })
  }, [deals])

  const won = stageTotal(deals, stages.length - 1)
  const open = deals.filter((d) => d.stage < stages.length - 1).reduce((s, d) => s + d.value, 0)

  return (
    <div className="stt-pipeline">
      <div className="stt-app-title stt-app-title-row">
        <div>
          <h3>Projects & Deals</h3>
          <span>Click a card to move it forward. Totals follow.</span>
        </div>
        <div className="stt-pipe-sum">
          <span>Open <b>{compactMoney(open)}</b></span>
          <span>Won <b className="stt-won">{compactMoney(won)}</b></span>
        </div>
      </div>
      <div className="stt-board" ref={boardRef}>
        {stages.map((s, si) => {
          const col = deals.filter((d) => d.stage === si)
          return (
            <div key={s} className="stt-col">
              <div className="stt-col-head">
                <span>{s}</span>
                <i>{col.length}</i>
                <b>{compactMoney(stageTotal(deals, si))}</b>
              </div>
              {col.map((d) => (
                <button key={d.id} type="button" data-deal={d.id} className="stt-deal" data-won={si === stages.length - 1 ? "" : undefined} onClick={() => advance(d.id)} disabled={si === stages.length - 1} aria-label={d.name + ", " + d.company + ", " + s + (si < stages.length - 1 ? ". Move to " + stages[si + 1] : "")}>
                  <span className="stt-deal-top">
                    <b>{d.company}</b>
                    {si === stages.length - 1 ? <Icon name="check" size={13} /> : <Icon name="arrow" size={13} />}
                  </span>
                  <span className="stt-deal-name">{d.name}</span>
                  <span className="stt-deal-foot">
                    <i>{d.owner}</i>
                    <em>{compactMoney(d.value)}</em>
                  </span>
                </button>
              ))}
              {!col.length && <div className="stt-col-empty">Nothing here yet</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AccessView({ access, reduced }: { access: SttAccess; reduced: boolean }) {
  const [grid, setGrid] = React.useState(access.permissions.map((p) => p.grants.slice()))
  const [enforce, setEnforce] = React.useState({ sso: true, mfa: true })
  const [log, setLog] = React.useState([
    { k: "l0", t: "Mitchell Saint enabled SSO for the workspace", w: "1h" },
    { k: "l1", t: "Ryan Patel revoked Billing from Members", w: "3h" },
    { k: "l2", t: "Aisha Mensah suspended a guest account", w: "1d" },
  ])
  const logRef = React.useRef(null as HTMLUListElement | null)
  const push = (t: string) => {
    setLog((l) => [{ k: "l" + Date.now(), t, w: "now" }, ...l].slice(0, 5))
    requestAnimationFrame(() => {
      const li = logRef.current && logRef.current.firstElementChild
      if (li && !reduced) gsap.fromTo(li, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" })
    })
  }
  const flip = (pi: number, ri: number) => {
    const on = !grid[pi][ri]
    setGrid((g) => g.map((row, i) => (i === pi ? row.map((v, j) => (j === ri ? on : v)) : row)))
    push("You " + (on ? "granted " : "revoked ") + access.permissions[pi].label + (on ? " to " : " from ") + access.roles[ri] + "s")
  }
  return (
    <div className="stt-access">
      <div className="stt-access-main">
        <div className="stt-app-title">
          <h3>Access & Account Control</h3>
          <span>Permissions follow roles. Every change is logged.</span>
        </div>
        <div className="stt-matrix" role="table" aria-label="Permissions by role">
          <div className="stt-mrow stt-mhead" role="row">
            <span role="columnheader">Permission</span>
            {access.roles.map((r) => (
              <span key={r} role="columnheader">{r}</span>
            ))}
          </div>
          {access.permissions.map((p, pi) => (
            <div key={p.label} className="stt-mrow" role="row">
              <span role="rowheader">{p.label}</span>
              {access.roles.map((r, ri) => (
                <span key={r} role="cell">
                  <Toggle small on={grid[pi][ri]} label={p.label + " for " + r} onChange={() => flip(pi, ri)} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <aside className="stt-access-side">
        <div className="stt-enforce">
          <div>
            <strong><Icon name="key" size={13} /> Single sign-on</strong>
            <span>Require SSO for every member</span>
          </div>
          <Toggle small on={enforce.sso} label="Require SSO" onChange={(v) => (setEnforce({ ...enforce, sso: v }), push((v ? "You required" : "You relaxed") + " single sign-on"))} />
        </div>
        <div className="stt-enforce">
          <div>
            <strong><Icon name="shield" size={13} /> Two-factor</strong>
            <span>Enforce 2FA on next login</span>
          </div>
          <Toggle small on={enforce.mfa} label="Enforce two-factor" onChange={(v) => (setEnforce({ ...enforce, mfa: v }), push((v ? "You enforced" : "You relaxed") + " two-factor authentication"))} />
        </div>
        <div className="stt-mini-label">Audit log</div>
        <ul className="stt-log" ref={logRef}>
          {log.map((l) => (
            <li key={l.k}>
              <i />
              <p>{l.t}</p>
              <time>{l.w}</time>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

function Features({ head, tabs, users: initialUsers, activity, deals, stages, access, reduced, uid }: {
  head: SttHeading & { photo: SttPhoto | null }
  tabs: SttFeatureTab[]
  users: SttUser[]
  activity: SttActivity
  deals: SttDeal[]
  stages: string[]
  access: SttAccess
  reduced: boolean
  uid: string
}) {
  const [tab, setTab] = React.useState(0)
  const [users, setUsersState] = React.useState(initialUsers)
  const setUsers = (fn: (u: SttUser[]) => SttUser[]) => setUsersState(fn)
  const tabsRef = React.useRef(null as HTMLDivElement | null)
  const barRef = React.useRef(null as HTMLSpanElement | null)
  const panelRef = React.useRef(null as HTMLDivElement | null)
  const appRef = React.useRef(null as HTMLDivElement | null)
  const inView = useInView(appRef)
  const first = React.useRef(true)

  const placeBar = React.useCallback(
    (animate: boolean) => {
      const wrap = tabsRef.current
      const bar = barRef.current
      if (!wrap || !bar) return
      const btn = wrap.querySelectorAll("button")[tab] as HTMLElement | undefined
      if (!btn) return
      const to = { x: btn.offsetLeft, width: btn.offsetWidth }
      if (animate && !reduced) gsap.to(bar, { ...to, duration: 0.55, ease: "power3.inOut" })
      else gsap.set(bar, to)
      if (wrap.scrollWidth > wrap.clientWidth) wrap.scrollTo({ left: btn.offsetLeft - 16, behavior: reduced ? "auto" : "smooth" })
    },
    [tab, reduced],
  )
  useIsoLayoutEffect(() => {
    placeBar(!first.current)
    if (!first.current && panelRef.current && !reduced)
      gsap.fromTo(panelRef.current, { opacity: 0, y: 16, clipPath: "inset(0% 0% 14% 0%)" }, { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.out", clearProps: "clipPath" })
    first.current = false
  }, [tab])
  React.useEffect(() => {
    const on = () => placeBar(false)
    window.addEventListener("resize", on)
    return () => window.removeEventListener("resize", on)
  }, [placeBar])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const n = (tab + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length
    setTab(n)
    const b = tabsRef.current && (tabsRef.current.querySelectorAll("button")[n] as HTMLElement)
    if (b) b.focus()
  }
  const view = tabs[tab] ? tabs[tab].view : "users"
  const rail: IconName[] = ["grid", "users", "activity", "folder", "shield", "bell", "settings"]
  const railFor = { users: 1, activity: 2, pipeline: 3, access: 4 }

  return (
    <section className="stt-sec" id={uid + "-features"} aria-labelledby={uid + "-feat-t"}>
      <SectionHead head={head} id={uid + "-feat-t"} />
      <div className="stt-tabs" ref={tabsRef} role="tablist" aria-label="Features" onKeyDown={onKey} data-stt-reveal="">
        <span className="stt-tab-bar" ref={barRef} aria-hidden="true" />
        {tabs.map((t, i) => (
          <button key={t.label} type="button" role="tab" id={uid + "-tab" + i} aria-selected={tab === i} aria-controls={uid + "-panel"} tabIndex={tab === i ? 0 : -1} data-on={tab === i ? "" : undefined} onClick={() => setTab(i)}>
            <span>0{i + 1}</span> {t.label}
          </button>
        ))}
      </div>
      <div className="stt-stage">
        <div className="stt-stage-media">
          <Photo photo={head.photo} tone="lake" seed={5} />
        </div>
        <div className="stt-app-wrap">
          <div className="stt-app" ref={appRef}>
            <nav className="stt-rail" aria-label="App">
              <span className="stt-rail-logo">10<sup>x</sup></span>
              {rail.map((r, i) => (
                <button
                  key={r}
                  type="button"
                  aria-label={r}
                  data-on={railFor[view] === i ? "" : undefined}
                  onClick={() => {
                    const target = Object.entries(railFor).find(([, v]) => v === i)
                    const idx = target ? tabs.findIndex((t) => t.view === target[0]) : -1
                    if (idx > -1) setTab(idx)
                  }}
                >
                  <Icon name={r} size={15} />
                </button>
              ))}
            </nav>
            <div className="stt-panel" id={uid + "-panel"} role="tabpanel" aria-labelledby={uid + "-tab" + tab} ref={panelRef}>
              {view === "users" && <UsersView users={users} setUsers={setUsers} reduced={reduced} />}
              {view === "activity" && <ActivityView data={activity} reduced={reduced} inView={inView} />}
              {view === "pipeline" && <PipelineView deals={deals} stages={stages} reduced={reduced} />}
              {view === "access" && <AccessView access={access} reduced={reduced} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

function Price({ value, reduced }: { value: number; reduced: boolean }) {
  const ref = React.useRef(null as HTMLSpanElement | null)
  const shown = React.useRef(value)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      el.textContent = formatMoney(value)
      shown.current = value
      return
    }
    const o = { v: shown.current }
    const dec = !Number.isInteger(value)
    const t = gsap.to(o, {
      v: value,
      duration: 0.8,
      ease: "power3.out",
      onUpdate: () => {
        shown.current = o.v
        el.textContent = dec ? o.v.toFixed(2) : String(Math.round(o.v))
      },
    })
    gsap.fromTo(el, { y: -6, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" })
    return () => {
      t.kill()
    }
  }, [value, reduced])
  return <span ref={ref}>{formatMoney(value)}</span>
}

function Pricing({ head, plans, reduced, onSelect, uid }: { head: SttPricing; plans: SttPlan[]; reduced: boolean; onSelect?: (p: SttPlan, b: "monthly" | "yearly") => unknown; uid: string }) {
  const [billing, setBilling] = React.useState("monthly" as "monthly" | "yearly")
  const [chosen, setChosen] = React.useState("")
  const yearly = billing === "yearly"
  const spot = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--mx", e.clientX - r.left + "px")
    e.currentTarget.style.setProperty("--my", e.clientY - r.top + "px")
  }
  return (
    <section className="stt-sec" id={uid + "-pricing"} aria-labelledby={uid + "-price-t"}>
      <div className="stt-head stt-head-split stt-head-pricing">
        <div>
          <span className="stt-pill" data-stt-reveal="">{head.label}</span>
          <h2 id={uid + "-price-t"} className="stt-h2 stt-h2-strong">
            <Split text={head.title} />
          </h2>
          <p className="stt-lede stt-lede-left" data-stt-reveal="">{head.text}</p>
        </div>
        <div className="stt-billing" data-stt-reveal="">
          <button type="button" data-on={!yearly ? "" : undefined} onClick={() => setBilling("monthly")}>{head.monthlyLabel}</button>
          <Toggle on={yearly} label={head.yearlyLabel} onChange={(v) => setBilling(v ? "yearly" : "monthly")} />
          <button type="button" data-on={yearly ? "" : undefined} onClick={() => setBilling("yearly")}>{head.yearlyLabel}</button>
          <b className="stt-save" data-on={yearly ? "" : undefined}>Save {Math.round(head.discount * 100)}%</b>
        </div>
      </div>
      <div className="stt-plans">
        {plans.map((p) => {
          const pr = priceFor(p.price, billing, head.discount)
          return (
            <article key={p.id} className="stt-plan" data-featured={p.featured ? "" : undefined} onMouseMove={spot} data-stt-plan="">
              {p.featured && (
                <div className="stt-ribbon" aria-hidden="true">
                  <Photo photo={head.ribbonPhoto} tone="golden" seed={8} small />
                  <span>{head.ribbon} <Icon name="plus" size={11} /></span>
                </div>
              )}
              <div className="stt-plan-inner">
                <span className="stt-plan-icon"><Icon name={p.icon} size={30} /></span>
                <h3>{p.name}</h3>
                <p className="stt-plan-blurb">{p.blurb}</p>
                <div className="stt-price">
                  <strong>
                    $<Price value={pr.perMonth} reduced={reduced} />
                  </strong>
                  <span className="stt-unit"><Icon name={p.unit.toLowerCase().includes("per") ? "user" : "users"} size={11} /> {p.unit}</span>
                </div>
                <span className="stt-billed">{yearly ? "per month, $" + formatMoney(pr.billed) + " billed yearly" : "per month, billed monthly"}</span>
                <ul className="stt-feats">
                  {p.features.map((f) => (
                    <li key={f}>
                      <span className="stt-tick"><Icon name="check" size={10} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={"stt-btn stt-btn-block " + (p.featured ? "stt-btn-dark" : "stt-btn-light")}
                  data-chosen={chosen === p.id ? "" : undefined}
                  onClick={() => {
                    setChosen(p.id)
                    if (onSelect) onSelect(p, billing)
                  }}
                >
                  {chosen === p.id ? (
                    <>
                      <Icon name="check" size={14} /> Selected
                    </>
                  ) : (
                    <>
                      {p.cta} <Icon name="chev" size={13} />
                    </>
                  )}
                </button>
                <span className="stt-renew">{head.note}</span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

function Testimonials({ head, items, photo: bg, reduced, uid }: { head: SttHeading; items: SttTestimonial[]; photo: SttPhoto | null; reduced: boolean; uid: string }) {
  const [active, setActive] = React.useState(0)
  const [hold, setHold] = React.useState(false)
  const quoteRef = React.useRef(null as HTMLDivElement | null)
  const secRef = React.useRef(null as HTMLElement | null)
  const inView = useInView(secRef)
  const first = React.useRef(true)
  const t = items[active] || items[0]

  React.useEffect(() => {
    if (reduced || !inView || hold || items.length < 2) return
    const id = window.setTimeout(() => setActive((a) => (a + 1) % items.length), 7000)
    return () => clearTimeout(id)
  }, [active, reduced, inView, hold, items.length])

  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const el = quoteRef.current
    if (!el || reduced) return
    const words = el.querySelectorAll(".stt-qw")
    const tl = gsap.timeline()
    tl.fromTo(words, { opacity: 0, y: 14, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, stagger: 0.012, ease: "power3.out" })
    tl.fromTo(el.querySelectorAll(".stt-quote-author, .stt-stars"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.15)
    return () => {
      tl.kill()
    }
  }, [active, reduced])

  const half = Math.ceil(items.length / 2)
  const cols = [items.slice(0, half).map((x, i) => ({ x, i })), items.slice(half).map((x, i) => ({ x, i: i + half }))]

  return (
    <section className="stt-sec" id={uid + "-testimonials"} ref={secRef} aria-labelledby={uid + "-test-t"}>
      <SectionHead head={head} id={uid + "-test-t"} />
      <div className="stt-test" data-stt-reveal="" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
        <div className="stt-test-main" ref={quoteRef} aria-live="polite">
          <div className="stt-stars" aria-label="5 out of 5 stars">
            {[0, 1, 2, 3, 4].map((i) => (
              <Icon key={i} name="star" size={14} />
            ))}
          </div>
          <blockquote key={active}>
            {t.quote.split(/\s+/).map((w, i) => (
              <span key={i} className="stt-qw">{w} </span>
            ))}
          </blockquote>
          <div className="stt-test-foot">
            <div className="stt-quote-author">
              <Avatar name={t.name} src={t.avatar} size={36} />
              <div>
                <b>{t.name}</b>
                <span>{t.role}</span>
              </div>
            </div>
            <div className="stt-test-nav">
              <button type="button" className="stt-icon-btn" aria-label="Previous testimonial" onClick={() => setActive((a) => (a - 1 + items.length) % items.length)}>
                <Icon name="chev" size={14} className="stt-flip" />
              </button>
              <span>{String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
              <button type="button" className="stt-icon-btn" aria-label="Next testimonial" onClick={() => setActive((a) => (a + 1) % items.length)}>
                <Icon name="chev" size={14} />
              </button>
            </div>
          </div>
          {!reduced && <span key={"p" + active + (hold || !inView ? "h" : "")} className="stt-test-progress" data-paused={hold || !inView ? "" : undefined} aria-hidden="true" />}
        </div>
        <div className="stt-wall">
          <Photo photo={bg} tone="haze" seed={9} />
          <div className="stt-wall-cols">
            {cols.map((col, ci) => (
              <div key={ci} className="stt-wall-col" data-dir={ci ? "down" : "up"}>
                <div className="stt-wall-track">
                  {[0, 1].map((copy) =>
                    col.map(({ x, i }) => (
                      <button key={copy + "-" + i} type="button" className="stt-tcard" data-on={i === active ? "" : undefined} aria-hidden={copy ? true : undefined} tabIndex={copy ? -1 : 0} onClick={() => setActive(i)}>
                        <span className="stt-tcard-who">
                          <Avatar name={x.name} src={x.avatar} size={30} />
                          <span>
                            <b>{x.name}</b>
                            <i>{x.role}</i>
                          </span>
                        </span>
                        <span className="stt-tcard-q">{x.quote}</span>
                      </button>
                    )),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* CTA with prayer flags                                               */
/* ------------------------------------------------------------------ */

function PrayerFlags() {
  const strings = React.useMemo(() => [flagString(-40, 70, 1040, 20, 120, 22), flagString(-40, 10, 1040, 150, 150, 20)], [])
  return (
    <svg className="stt-flags" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {strings.map((s, si) => (
        <g key={si} className="stt-flag-string" opacity={si ? 0.7 : 1}>
          <path d={s.d} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.2" className="stt-flag-line" />
          {s.flags.map((f, i) => (
            <g key={i} transform={"translate(" + f.x.toFixed(1) + " " + f.y.toFixed(1) + ") rotate(" + f.angle.toFixed(1) + ")"}>
              <g className="stt-flag" style={{ animationDelay: -((i * 0.37 + si * 0.9) % 3.2) + "s", animationDuration: 2.6 + ((i * 7) % 5) * 0.25 + "s" }}>
                <path d={si ? "M-13 0 H13 L12 30 L-12 31 Z" : "M-16 0 H16 L15 38 L-15 39 Z"} fill={FLAG_COLORS[(i + si * 2) % FLAG_COLORS.length]} opacity="0.92" />
                <circle cx="0" cy={si ? 14 : 18} r={si ? 4 : 5} fill="none" stroke="rgba(0,0,0,.28)" strokeWidth="1" />
                <path d={si ? "M-8 24 H8" : "M-10 30 H10"} stroke="rgba(0,0,0,.22)" strokeWidth="1" />
              </g>
            </g>
          ))}
        </g>
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Waitlist dialog                                                     */
/* ------------------------------------------------------------------ */

function Waitlist({ open, onClose, onJoin, brand, reduced }: { open: boolean; onClose: () => void; onJoin?: (email: string) => unknown; brand: string; reduced: boolean }) {
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState("idle" as "idle" | "error" | "sending" | "done")
  const boxRef = React.useRef(null as HTMLDivElement | null)
  const inputRef = React.useRef(null as HTMLInputElement | null)

  React.useEffect(() => {
    if (!open) return
    setState("idle")
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    if (boxRef.current && !reduced) gsap.fromTo(boxRef.current, { opacity: 0, y: 24, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" })
    const f = window.setTimeout(() => inputRef.current && inputRef.current.focus(), 60)
    return () => {
      window.removeEventListener("keydown", onKey)
      clearTimeout(f)
      if (prev && prev.focus) prev.focus()
    }
  }, [open])

  if (!open) return null
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) return setState("error")
    setState("sending")
    try {
      await Promise.all([onJoin ? onJoin(email.trim()) : null, new Promise((r) => setTimeout(r, reduced ? 0 : 900))])
      setState("done")
    } catch {
      setState("error")
    }
  }
  return (
    <div className="stt-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="stt-dialog" ref={boxRef} role="dialog" aria-modal="true" aria-labelledby="stt-wl-title">
        <button type="button" className="stt-icon-btn stt-dialog-x" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={13} />
        </button>
        <BrandMark size={34} />
        {state === "done" ? (
          <div className="stt-done">
            <span className="stt-done-ic"><Icon name="check" size={22} /></span>
            <h3 id="stt-wl-title">You're on the list</h3>
            <p>We'll write to <b>{email}</b> when your {brand} workspace is ready.</p>
            <button type="button" className="stt-btn stt-btn-light" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h3 id="stt-wl-title">Join the {brand} waitlist</h3>
            <p>Early teams get three months of Pro on us, and a say in what ships next.</p>
            <div className="stt-wl-field" data-error={state === "error" ? "" : undefined}>
              <Icon name="mail" size={15} />
              <input ref={inputRef} type="email" value={email} onChange={(e) => (setEmail(e.target.value), state === "error" && setState("idle"))} placeholder="you@company.com" aria-label="Work email" aria-invalid={state === "error"} aria-describedby="stt-wl-err" />
            </div>
            <span id="stt-wl-err" className="stt-wl-err">{state === "error" ? "That doesn't look like an email address." : ""}</span>
            <button type="submit" className="stt-btn stt-btn-light stt-btn-block" disabled={state === "sending"} data-busy={state === "sending" ? "" : undefined}>
              {state === "sending" ? <i className="stt-spin" aria-label="Sending" /> : <>Join waitlist <Icon name="arrow" size={14} /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* The template                                                        */
/* ------------------------------------------------------------------ */

export default function SummitTeamsTemplate(props: SummitTeamsTemplateProps) {
  const {
    brand = DEFAULT_BRAND,
    nav = DEFAULT_NAV,
    login = "Log in",
    hero = DEFAULT_HERO,
    logos = DEFAULT_LOGOS,
    how = DEFAULT_HOW,
    steps = DEFAULT_STEPS,
    features = DEFAULT_FEATURES,
    tabs = DEFAULT_TABS,
    users = DEFAULT_USERS,
    activity = DEFAULT_ACTIVITY,
    deals = DEFAULT_DEALS,
    stages = DEFAULT_STAGES,
    access = DEFAULT_ACCESS,
    pricing = DEFAULT_PRICING,
    plans = DEFAULT_PLANS,
    testimonialsHeading = DEFAULT_TESTIMONIALS_HEADING,
    testimonials = DEFAULT_TESTIMONIALS,
    testimonialsPhoto = DEFAULT_TESTIMONIALS_PHOTO,
    cta = DEFAULT_CTA,
    footer = DEFAULT_FOOTER,
    accent = "#f3b27a",
    height = "100svh",
    className,
    onJoin,
    onSelectPlan,
    onCta,
  } = props
  const reduced = useReducedMotion()
  const uid = "stt" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const [waitlist, setWaitlist] = React.useState(false)
  const [menu, setMenu] = React.useState(false)
  const [current, setCurrent] = React.useState("top" as SttSection)
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const navRef = React.useRef(null as HTMLDivElement | null)
  const scrollerRef = React.useRef(null as HTMLElement | Window | null)

  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)
    const R = reduced
    const scroller = findScroller(root)
    scrollerRef.current = scroller
    const q = gsap.utils.selector(root)
    const ctx = gsap.context(() => {
      /* the nav turns into a floating glass pill once the page moves */
      ScrollTrigger.create({
        trigger: root,
        scroller,
        start: "top+=80 top",
        end: "bottom top",
        onToggle: (self) => navRef.current && navRef.current.toggleAttribute("data-scrolled", self.isActive),
      })
      /* which section the nav should mark */
      const ids: SttSection[] = ["how", "features", "pricing", "testimonials", "footer"]
      ids.forEach((id) => {
        const el = root.querySelector("#" + uid + "-" + id)
        if (el)
          ScrollTrigger.create({
            trigger: el,
            scroller,
            start: "top 45%",
            end: "bottom 45%",
            onToggle: (self) => self.isActive && setCurrent(id),
            onLeaveBack: () => id === "how" && setCurrent("top"),
          })
      })

      const hero = root.querySelector(".stt-hero") as HTMLElement | null
      if (!R && hero) {
        /* load: the range settles, the words rise out of their masks */
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } })
        intro
          .fromTo(q(".stt-hero-media"), { scale: 1.22 }, { scale: 1.06, duration: 2.4, ease: "power2.out" }, 0)
          .fromTo(q(".stt-hero-glow"), { opacity: 0 }, { opacity: 1, duration: 2 }, 0.2)
          .fromTo(q(".stt-nav-inner"), { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.3)
          .fromTo(q(".stt-eyebrow"), { y: 16, opacity: 0, filter: "blur(6px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9 }, 0.45)
          .fromTo(q(".stt-hero-title .stt-w > span"), { yPercent: 110, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.07 }, 0.55)
          .fromTo(q(".stt-hero-text, .stt-hero-cta"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 1)
          .fromTo(q(".stt-scroll-cue"), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.5)

        /* scroll: the frame closes in, the range sinks, the copy lifts away */
        const tl = gsap.timeline({ scrollTrigger: { trigger: hero, scroller, start: "top top", end: "bottom top", scrub: 0.6 } })
        tl.fromTo(q(".stt-hero-frame"), { clipPath: "inset(0px 0px 0px 0px round 28px)" }, { clipPath: "inset(70px 48px 0px 48px round 44px)", ease: "none" }, 0)
          .to(q(".stt-hero-media"), { yPercent: 16, scale: 1.16, ease: "none" }, 0)
          .to(q(".stt-hero-copy"), { yPercent: -36, opacity: 0, ease: "none" }, 0)
          .to(q(".stt-mist"), { xPercent: 12, opacity: 0.2, ease: "none" }, 0)

        /* pointer parallax on the hero */
        if (typeof matchMedia === "function" && matchMedia("(hover: hover)").matches) {
          const mx = gsap.quickTo(q(".stt-hero-media")[0], "x", { duration: 1.4, ease: "power3" })
          const my = gsap.quickTo(q(".stt-hero-media")[0], "y", { duration: 1.4, ease: "power3" })
          const cx = gsap.quickTo(q(".stt-hero-copy")[0], "x", { duration: 1.6, ease: "power3" })
          const move = (e: PointerEvent) => {
            const r = hero.getBoundingClientRect()
            const nx = (e.clientX - r.left) / r.width - 0.5
            const ny = (e.clientY - r.top) / r.height - 0.5
            mx(nx * -26)
            my(ny * -16)
            cx(nx * 10)
          }
          hero.addEventListener("pointermove", move)
          return () => hero.removeEventListener("pointermove", move)
        }
      }
    }, root)

    const ctx2 = gsap.context(() => {
      if (R) return
      /* section headlines rise word by word */
      q(".stt-h2").forEach((h) => {
        gsap.fromTo(h.querySelectorAll(".stt-w > span"), { yPercent: 105 }, { yPercent: 0, duration: 1, ease: "power3.out", stagger: 0.05, scrollTrigger: { trigger: h, scroller, start: "top 88%", once: true } })
      })
      const reveals = q("[data-stt-reveal]").filter((el) => !el.closest(".stt-hero"))
      gsap.set(reveals, { opacity: 0, y: 30 })
      ScrollTrigger.batch(reveals, {
        scroller,
        start: "top 90%",
        once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.08, overwrite: true }),
      })

      /* the app tilts up out of the lake and lies flat as it arrives */
      const app = q(".stt-app-wrap")[0]
      if (app) {
        gsap.fromTo(app, { rotateX: 24, scale: 0.86, y: 80, opacity: 0.75 }, { rotateX: 0, scale: 1, y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: q(".stt-stage")[0], scroller, start: "top 95%", end: "top 40%", scrub: 0.6 } })
        gsap.fromTo(q(".stt-stage-media"), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: q(".stt-stage")[0], scroller, start: "top bottom", end: "bottom top", scrub: true } })
      }

      /* plans deal in, the recommended one last, its ribbon sliding up */
      const plansEl = q(".stt-plans")[0]
      if (plansEl) {
        const tl = gsap.timeline({ scrollTrigger: { trigger: plansEl, scroller, start: "top 82%", once: true } })
        tl.fromTo(q("[data-stt-plan]:not([data-featured])"), { y: 70, opacity: 0, rotate: (i: number) => (i ? 3 : -3) }, { y: 0, opacity: 1, rotate: 0, duration: 1, ease: "power3.out", stagger: 0.1 })
          .fromTo(q("[data-stt-plan][data-featured]"), { y: 110, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: "power4.out" }, 0.15)
          .fromTo(q(".stt-ribbon"), { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: "power3.out" }, 0.75)
      }

      /* the CTA card opens like a window onto the range */
      const card = q(".stt-cta-card")[0]
      if (card) {
        const tl = gsap.timeline({ scrollTrigger: { trigger: card, scroller, start: "top bottom", end: "center 55%", scrub: 0.6 } })
        tl.fromTo(card, { clipPath: "inset(10% 16% 10% 16% round 48px)" }, { clipPath: "inset(0% 0% 0% 0% round 28px)", ease: "none" }, 0)
          .fromTo(q(".stt-cta-media"), { scale: 1.3 }, { scale: 1, ease: "none" }, 0)
          .fromTo(q(".stt-flag-string"), { y: -80 }, { y: 0, ease: "none", stagger: 0.1 }, 0)
        root.querySelectorAll(".stt-flag-line").forEach((line) => {
          const len = (line as SVGPathElement).getTotalLength()
          gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: card, scroller, start: "top 90%", end: "center 60%", scrub: true } })
        })
      }

      /* the wordmark spreads out of the ground */
      const foot = q(".stt-footer")[0]
      if (foot) {
        gsap.fromTo(q(".stt-wordmark-text"), { attr: { y: 560 } }, { attr: { y: 330 }, ease: "none", scrollTrigger: { trigger: foot, scroller, start: "top bottom", end: "bottom bottom", scrub: 0.6 } })
        gsap.fromTo(q(".stt-wordmark-text"), { attr: { textLength: 1180 } }, { attr: { textLength: 1560 }, ease: "none", scrollTrigger: { trigger: foot, scroller, start: "top 80%", end: "bottom bottom", scrub: 0.6 } })
        gsap.fromTo(q(".stt-footer-media"), { yPercent: -12 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: foot, scroller, start: "top bottom", end: "bottom bottom", scrub: true } })
      }
    }, root)

    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    ro.observe(root)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      ctx2.revert()
      ctx.revert()
    }
  }, [reduced])

  const go = (to: SttSection) => {
    setMenu(false)
    const root = rootRef.current
    if (!root) return
    const el = to === "top" ? root : (root.querySelector("#" + uid + "-" + to) as HTMLElement | null)
    if (el) scrollToEl(scrollerRef.current || window, el, !reduced)
  }
  const navClick = (l: SttNavLink) => (e: React.MouseEvent) => {
    if (l.to) {
      e.preventDefault()
      go(l.to)
    }
  }
  const year = new Date().getFullYear()

  return (
    <div
      ref={rootRef}
      className={"stt-root " + (className || "")}
      data-motion={reduced ? "reduced" : "full"}
      style={{ "--stt-h": height, "--stt-accent": accent } as React.CSSProperties}
    >
      <style>{STT_CSS}</style>

      <div className="stt-navwrap">
        <div className="stt-nav" ref={navRef}>
          <div className="stt-nav-inner">
            <a href="#" className="stt-logo" onClick={(e) => (e.preventDefault(), go("top"))} aria-label={brand.name + ", back to top"}>
              <BrandMark />
              <span>{brand.name}</span>
            </a>
            <nav className="stt-links" aria-label="Primary">
              {nav.map((l) => (
                <a key={l.label} href={l.href || "#"} onClick={navClick(l)} aria-current={l.to && l.to === current ? "true" : undefined}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="stt-nav-cta">
              <a href="#" className="stt-login" onClick={(e) => e.preventDefault()}>{login}</a>
              <button type="button" className="stt-btn stt-btn-light stt-btn-sm" onClick={() => setWaitlist(true)}>{hero.cta}</button>
              <button type="button" className="stt-icon-btn stt-burger" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu(!menu)}>
                <Icon name={menu ? "close" : "menu"} size={16} />
              </button>
            </div>
          </div>
          {menu && (
            <div className="stt-sheet">
              {nav.map((l) => (
                <a key={l.label} href={l.href || "#"} onClick={navClick(l)}>
                  {l.label} <Icon name="arrow" size={14} />
                </a>
              ))}
              <a href="#" onClick={(e) => e.preventDefault()}>{login}</a>
            </div>
          )}
        </div>
      </div>

      <main>
        <section className="stt-hero" aria-labelledby={uid + "-title"}>
          <div className="stt-hero-frame">
            <div className="stt-hero-media">
              <Photo photo={hero.photo} tone="golden" seed={2} eager large />
            </div>
            <div className="stt-hero-glow" aria-hidden="true" />
            <div className="stt-mist" aria-hidden="true" />
            <div className="stt-hero-fade" aria-hidden="true" />
            <div className="stt-hero-copy">
              <span className="stt-eyebrow">
                {hero.eyebrow}
                <span className="stt-eyebrow-tag">
                  <span className="stt-faces">
                    {hero.eyebrowFaces.map((f, i) => (
                      <Avatar key={i} name={"Founder " + (i + 1)} src={f} size={18} />
                    ))}
                  </span>
                  {hero.eyebrowTag}
                </span>
              </span>
              <h1 id={uid + "-title"} className="stt-hero-title">
                {hero.title.map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && " "}
                    <span className="stt-line">
                      <Split text={line} />
                    </span>
                  </React.Fragment>
                ))}
              </h1>
              <p className="stt-hero-text">{hero.text}</p>
              <button type="button" className="stt-btn stt-btn-light stt-hero-cta" onClick={() => setWaitlist(true)}>
                {hero.cta}
                <span className="stt-btn-arrow"><Icon name="arrow" size={14} /></span>
              </button>
            </div>
            <button type="button" className="stt-scroll-cue" onClick={() => go("how")} aria-label="Scroll to how it works">
              <span />
            </button>
          </div>
        </section>

        <div className="stt-logos" aria-label="Teams using us">
          <div className="stt-logos-track">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy ? true : undefined}>
                {logos.map((l) => (
                  <li key={l.name} className={"stt-logo-" + l.style}>
                    {l.glyph !== "none" && <LogoGlyph glyph={l.glyph} />}
                    {l.name}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <HowItWorks head={how} steps={steps} user={users[0] || DEFAULT_USERS[0]} reduced={reduced} onTry={() => go("features")} uid={uid} />

        <Features head={features} tabs={tabs} users={users} activity={activity} deals={deals} stages={stages} access={access} reduced={reduced} uid={uid} />

        <Pricing head={pricing} plans={plans} reduced={reduced} onSelect={onSelectPlan} uid={uid} />

        <Testimonials head={testimonialsHeading} items={testimonials} photo={testimonialsPhoto} reduced={reduced} uid={uid} />

        <section className="stt-sec stt-cta" aria-labelledby={uid + "-cta-t"}>
          <div className="stt-cta-card">
            <div className="stt-cta-media">
              <Photo photo={cta.photo} tone="night" seed={11} />
            </div>
            {cta.flags && <PrayerFlags />}
            <div className="stt-cta-shade" aria-hidden="true" />
            <div className="stt-cta-copy">
              <h2 id={uid + "-cta-t"}>{cta.title}</h2>
              <p>{cta.text}</p>
              <div className="stt-cta-btns">
                <button type="button" className="stt-btn stt-btn-dark" onClick={() => (onCta ? onCta("primary") : setWaitlist(true))}>
                  {cta.primary}
                </button>
                <button type="button" className="stt-btn stt-btn-light" onClick={() => onCta && onCta("secondary")}>
                  {cta.secondary}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="stt-footer" id={uid + "-footer"}>
        <div className="stt-footer-media" aria-hidden="true">
          <Photo photo={footer.photo} tone="golden" seed={13} large />
        </div>
        <div className="stt-footer-shade" aria-hidden="true" />
        <div className="stt-footer-top">
          <div className="stt-footer-brand">
            <strong>{brand.name}</strong>
            <p>{footer.text}</p>
            <div className="stt-social">
              {footer.social.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} title={s.label}>
                  <Icon name={s.icon} size={17} />
                </a>
              ))}
            </div>
          </div>
          <div className="stt-footer-cols">
            {footer.columns.map((c) => (
              <div key={c.title}>
                <h3>{c.title}</h3>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <svg className="stt-wordmark" viewBox="0 0 1600 380" aria-label={brand.name} role="img">
          <defs>
            <linearGradient id={uid + "-wm"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <text className="stt-wordmark-text" x="800" y="330" textAnchor="middle" textLength="1560" lengthAdjust="spacingAndGlyphs" fill={"url(#" + uid + "-wm)"}>
            {brand.name}
          </text>
        </svg>
        <div className="stt-footer-bottom">
          <span>
            © {year} {brand.name}. {footer.legal}
          </span>
          <button type="button" className="stt-totop" onClick={() => go("top")}>
            Back to top <Icon name="up" size={13} />
          </button>
        </div>
      </footer>

      <Waitlist open={waitlist} onClose={() => setWaitlist(false)} onJoin={onJoin} brand={brand.name} reduced={reduced} />
    </div>
  )
}

function LogoGlyph({ glyph }: { glyph: SttLogo["glyph"] }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true, className: "stt-logo-glyph" }
  if (glyph === "s") return <svg {...p}><path d="M17 6.5C15.8 5 14 4.5 12 4.5 8.8 4.5 7 6 7 8.2c0 5 10 2.6 10 7.6 0 2.3-2 3.7-5 3.7-2.2 0-4.1-.7-5.3-2.3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
  if (glyph === "drop") return <svg {...p}><path d="M12 3c4 4.6 6.5 8 6.5 11a6.5 6.5 0 01-13 0C5.5 11 8 7.6 12 3z" fill="currentColor" /></svg>
  if (glyph === "ring") return <svg {...p}><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="30 6" /></svg>
  if (glyph === "wave") return <svg {...p}><path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
  if (glyph === "burst") return <svg {...p}><path d="M12 2l2 7 7-3-4.5 6 4.5 6-7-3-2 7-2-7-7 3 4.5-6L3 6l7 3z" fill="currentColor" /></svg>
  return <svg {...p}><path d="M13.6 2L5 13.4h5.6L9.4 22 18 10.6h-5.6z" fill="currentColor" /></svg>
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const STT_CSS = `
.stt-root{--stt-bg:#0a0a0b;--stt-panel:#121214;--stt-panel-2:#18181b;--stt-panel-3:#202024;--stt-line:rgba(255,255,255,.08);--stt-line-2:rgba(255,255,255,.14);--stt-text:#f5f3ef;--stt-mute:rgba(245,243,239,.6);--stt-dim:rgba(245,243,239,.38);--stt-ok:#5ad08a;--stt-r:22px;position:relative;min-height:var(--stt-h);background:var(--stt-bg);color:var(--stt-text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;overflow-x:clip;isolation:isolate;text-align:left}
.stt-root :where(svg,canvas,img){display:block;max-width:none}
.stt-root :where(h1,h2,h3,p,ul,ol,blockquote,figure){margin:0;padding:0}
.stt-root :where(ul,ol){list-style:none}
.stt-root :where(button,input,select){font:inherit;color:inherit}
.stt-root :where(button){background:none;border:0;cursor:pointer;padding:0}
.stt-root :where(a){color:inherit;text-decoration:none}
.stt-root :focus-visible{outline:2px solid var(--stt-accent);outline-offset:3px;border-radius:10px}
.stt-root ::selection{background:var(--stt-accent);color:#120c08}

.stt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 20px;border-radius:999px;font-size:14px;font-weight:550;letter-spacing:-.01em;white-space:nowrap;transition:transform .35s cubic-bezier(.2,.8,.2,1),background-color .25s,box-shadow .35s,color .25s}
.stt-btn:hover{transform:translateY(-1px)}
.stt-btn:active{transform:translateY(0) scale(.98)}
.stt-btn:disabled{opacity:.55;cursor:default;transform:none}
.stt-btn-sm{height:34px;padding:0 15px;font-size:13px}
.stt-btn-block{width:100%}
.stt-btn-light{background:#f7f5f1;color:#121214;box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 8px 24px -10px rgba(255,255,255,.35)}
.stt-btn-light:hover{background:#fff;box-shadow:0 1px 0 #fff inset,0 12px 30px -10px rgba(255,255,255,.45)}
.stt-btn-dark{background:#151517;color:#f7f5f1;box-shadow:0 0 0 1px rgba(255,255,255,.1) inset}
.stt-btn-dark:hover{background:#000}
.stt-btn-ghost{background:rgba(255,255,255,.06);color:var(--stt-text);box-shadow:0 0 0 1px var(--stt-line-2) inset}
.stt-btn[data-chosen]{background:var(--stt-ok);color:#06140c}
.stt-btn-arrow{display:grid;place-items:center;width:24px;height:24px;margin-right:-10px;border-radius:50%;background:#121214;color:#fff;transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.stt-btn:hover .stt-btn-arrow{transform:translateX(3px) rotate(-30deg)}
.stt-icon-btn{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.06);box-shadow:0 0 0 1px var(--stt-line) inset;color:var(--stt-text);transition:background-color .2s}
.stt-icon-btn:hover{background:rgba(255,255,255,.12)}
.stt-flip{transform:scaleX(-1)}
.stt-rot{transform:rotate(180deg)}

.stt-navwrap{position:sticky;top:0;z-index:60;height:0}
.stt-nav{position:absolute;left:0;right:0;top:0;padding:22px clamp(20px,4.6vw,64px) 0;transition:padding .5s cubic-bezier(.2,.8,.2,1)}
.stt-nav-inner{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;max-width:1240px;margin:0 auto;padding:8px 8px 8px 14px;border-radius:999px;transition:background-color .5s,box-shadow .5s,max-width .6s cubic-bezier(.2,.8,.2,1),backdrop-filter .5s}
.stt-nav[data-scrolled]{padding-top:12px}
.stt-nav[data-scrolled] .stt-nav-inner{max-width:980px;background:rgba(14,14,16,.62);box-shadow:0 0 0 1px rgba(255,255,255,.09) inset,0 18px 40px -18px rgba(0,0,0,.7);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4)}
.stt-logo{display:inline-flex;align-items:center;gap:10px;font-weight:600;letter-spacing:-.02em;font-size:16px;justify-self:start;color:#fff}
.stt-logo span{opacity:0;transform:translateX(-6px);transition:opacity .4s,transform .4s}
.stt-nav[data-scrolled] .stt-logo span{opacity:1;transform:none}
.stt-links{display:flex;gap:4px}
.stt-links a{position:relative;padding:7px 13px;font-size:13.5px;color:rgba(255,255,255,.82);border-radius:999px;transition:color .2s,background-color .25s}
.stt-links a:hover{color:#fff;background:rgba(255,255,255,.08)}
.stt-links a[aria-current]{color:#fff}
.stt-links a[aria-current]::after{content:"";position:absolute;left:50%;bottom:1px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:var(--stt-accent)}
.stt-nav-cta{display:flex;align-items:center;gap:6px;justify-self:end}
.stt-login{padding:7px 12px;font-size:13.5px;color:rgba(255,255,255,.85)}
.stt-login:hover{color:#fff}
.stt-burger{display:none}
.stt-sheet{display:none}

.stt-hero{position:relative;height:max(var(--stt-h),660px);padding:12px}
.stt-hero-frame{position:relative;height:calc(max(var(--stt-h),660px) - 24px);border-radius:28px;overflow:hidden;clip-path:inset(0px 0px 0px 0px round 28px);background:#1a1717}
.stt-hero-media{position:absolute;inset:-4%;transform:scale(1.06);will-change:transform}
.stt-hero-glow{position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 34%,rgba(255,196,140,.28),transparent 70%);mix-blend-mode:screen;pointer-events:none}
.stt-mist{position:absolute;left:-20%;right:-20%;bottom:16%;height:34%;background:radial-gradient(50% 50% at 30% 60%,rgba(255,235,220,.16),transparent 70%),radial-gradient(40% 50% at 75% 50%,rgba(255,235,220,.12),transparent 70%);filter:blur(10px);pointer-events:none;animation:stt-drift 22s ease-in-out infinite alternate}
.stt-hero-fade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,11,.5) 0%,rgba(10,10,11,0) 22%,rgba(10,10,11,0) 52%,rgba(10,10,11,.55) 80%,var(--stt-bg) 100%);pointer-events:none}
.stt-hero-copy{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;padding:clamp(130px,19vh,190px) 20px 0;max-width:900px;margin:0 auto}
.stt-eyebrow{display:inline-flex;align-items:center;gap:10px;padding:5px 6px 5px 14px;border-radius:999px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.86);background:rgba(20,16,14,.28);box-shadow:0 0 0 1px rgba(255,255,255,.16) inset;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.stt-eyebrow-tag{display:inline-flex;align-items:center;gap:7px;padding:3px 10px 3px 4px;border-radius:999px;background:rgba(255,255,255,.12);letter-spacing:.02em;text-transform:none;font-size:12px}
.stt-faces{display:inline-flex}
.stt-faces .stt-avatar{margin-left:-6px;box-shadow:0 0 0 1.5px rgba(30,24,22,.9)}
.stt-faces .stt-avatar:first-child{margin-left:0}
.stt-hero-title{margin-top:24px;font-size:clamp(42px,5.4vw,78px);line-height:1.02;letter-spacing:-.045em;font-weight:400;color:#fff}
.stt-line{display:block}
.stt-split{display:inline}
.stt-w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em}
.stt-w>span{display:inline-block;will-change:transform}
.stt-hero-text{max-width:480px;margin-top:22px;color:rgba(255,255,255,.9);text-shadow:0 1px 18px rgba(30,16,10,.55),0 0 2px rgba(30,16,10,.3);font-size:clamp(14px,1.2vw,16px);line-height:1.6}
.stt-hero-cta{margin-top:28px;height:46px;padding:0 6px 0 22px}
.stt-hero-cta .stt-btn-arrow{margin-right:0}
.stt-scroll-cue{position:absolute;left:50%;bottom:28px;z-index:3;width:24px;height:38px;margin-left:-12px;border-radius:14px;box-shadow:0 0 0 1.5px rgba(255,255,255,.4) inset}
.stt-scroll-cue span{position:absolute;left:50%;top:8px;width:3px;height:7px;margin-left:-1.5px;border-radius:2px;background:#fff;animation:stt-cue 1.8s cubic-bezier(.6,0,.3,1) infinite}

.stt-logos{position:relative;padding:34px 0 18px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)}
.stt-logos-track{display:flex;width:max-content;animation:stt-marquee 38s linear infinite}
.stt-logos:hover .stt-logos-track{animation-play-state:paused}
.stt-logos ul{display:flex;align-items:center;gap:clamp(44px,6vw,84px);padding-right:clamp(44px,6vw,84px)}
.stt-logos li{display:inline-flex;align-items:center;gap:8px;font-size:19px;color:rgba(245,243,239,.55);white-space:nowrap;transition:color .3s}
.stt-logos li:hover{color:#fff}
.stt-logo-caps{letter-spacing:.1em;text-transform:uppercase;font-size:17px;font-weight:450}
.stt-logo-bold{font-weight:700;letter-spacing:-.03em}
.stt-logo-light{font-weight:400;font-size:15px}
.stt-logo-italic{font-weight:800;font-style:italic;letter-spacing:.02em}
.stt-logo-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px}

.stt-sec{position:relative;max-width:1240px;margin:0 auto;padding:clamp(80px,11vw,140px) clamp(20px,4.6vw,64px) 0}
.stt-head{display:grid;gap:22px;margin-bottom:clamp(40px,5vw,64px)}
.stt-head-split{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);align-items:end}
.stt-pill{display:inline-flex;padding:4px 11px;border-radius:999px;background:#f5f3ef;color:#121214;font-size:12px;font-weight:550;letter-spacing:-.01em}
.stt-h2{margin-top:18px;font-size:clamp(30px,3.2vw,44px);line-height:1.1;letter-spacing:-.035em;font-weight:400;max-width:620px;color:#fff}
.stt-h2-strong{font-weight:600}
.stt-lede{max-width:420px;justify-self:end;color:var(--stt-mute);font-size:14px;line-height:1.65}
.stt-lede-left{justify-self:start;margin-top:14px;max-width:440px}

.stt-how{display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1fr);gap:clamp(28px,5vw,72px);align-items:stretch}
.stt-steps-col{display:flex;flex-direction:column;justify-content:space-between;gap:36px}
.stt-steps li{position:relative;padding:16px 0 18px}
.stt-steps button{display:flex;align-items:center;gap:14px;width:100%;text-align:left}
.stt-check{display:grid;place-items:center;flex:none;width:20px;height:20px;border-radius:5px;background:transparent;box-shadow:0 0 0 1.5px rgba(255,255,255,.5) inset;color:#121214;transition:background-color .35s,box-shadow .35s}
.stt-check svg{opacity:0;transform:scale(.5);transition:opacity .3s,transform .4s cubic-bezier(.2,1.4,.4,1)}
.stt-steps li[data-active] .stt-check,.stt-steps li[data-done] .stt-check{background:#f5f3ef;box-shadow:none}
.stt-steps li[data-active] .stt-check svg,.stt-steps li[data-done] .stt-check svg{opacity:1;transform:none}
.stt-step-title{flex:1;font-size:17px;font-weight:500;letter-spacing:-.02em;color:var(--stt-mute);transition:color .3s}
.stt-steps li[data-active] .stt-step-title,.stt-steps button:hover .stt-step-title{color:#fff}
.stt-step-num{font-size:12px;color:var(--stt-dim);font-variant-numeric:tabular-nums}
.stt-step-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .55s cubic-bezier(.2,.8,.2,1),opacity .4s;opacity:0}
.stt-step-body p{overflow:hidden;padding-left:34px;max-width:380px;color:var(--stt-mute);font-size:13.5px;line-height:1.6}
.stt-steps li[data-active] .stt-step-body{grid-template-rows:1fr;opacity:1}
.stt-steps li[data-active] .stt-step-body p{padding-top:8px}
.stt-step-rule{position:absolute;left:34px;right:0;bottom:0;height:1px;background-image:linear-gradient(90deg,rgba(255,255,255,.28) 50%,transparent 50%);background-size:6px 1px}
.stt-step-progress{position:absolute;left:0;top:0;height:1px;width:100%;background:var(--stt-accent);transform-origin:0 50%;transform:scaleX(0);animation:stt-fill linear forwards;box-shadow:0 0 12px var(--stt-accent)}
.stt-try{align-self:flex-start;padding:0 12px 0 16px}

.stt-how-visual{position:relative;min-height:440px;border-radius:var(--stt-r);overflow:hidden;background:#241a16;box-shadow:0 0 0 1px var(--stt-line) inset}
.stt-how-media{position:absolute;inset:0;transform:scale(1.06);transform-origin:30% 50%}
.stt-how-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,11,0) 30%,rgba(10,10,11,.45))}
.stt-float-card{position:absolute;left:26%;top:15%;right:-36px;padding:20px 56px 22px 20px;border-radius:18px 0 0 18px;background:rgba(40,40,44,.72);box-shadow:0 0 0 1px rgba(255,255,255,.1) inset,0 30px 60px -20px rgba(0,0,0,.7);-webkit-backdrop-filter:blur(22px) saturate(1.3);backdrop-filter:blur(22px) saturate(1.3);min-height:280px}
.stt-step-dots{position:absolute;left:20px;bottom:18px;display:flex;gap:6px}
.stt-step-dots i{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.4);transition:width .45s cubic-bezier(.2,.8,.2,1),background-color .3s}
.stt-step-dots i[data-on]{width:22px;background:#fff}
.stt-card-top{display:flex;align-items:center;gap:8px;padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid var(--stt-line);font-size:14px;font-weight:550}
.stt-who{display:flex;gap:14px;align-items:center}
.stt-who strong{display:block;font-size:15px;font-weight:550;letter-spacing:-.01em}
.stt-who>div>span{display:flex;align-items:center;gap:5px;margin-top:2px;font-size:12px;color:var(--stt-mute)}
.stt-badges{display:flex;gap:6px;margin-top:8px}
.stt-badge{padding:2px 9px;border-radius:6px;font-size:11px;font-weight:550;background:#0d0d0f;color:#fff;box-shadow:0 0 0 1px var(--stt-line-2) inset}
.stt-badge-ok{background:rgba(90,208,138,.16);color:var(--stt-ok);box-shadow:none}
.stt-badge-off{background:rgba(255,255,255,.08);color:var(--stt-mute);box-shadow:none}
.stt-badge-warm{background:rgba(243,178,122,.16);color:var(--stt-accent);box-shadow:none}
.stt-mini-label{margin:16px 0 8px;font-size:12px;font-weight:550;color:var(--stt-mute)}
.stt-hint{margin-top:10px;font-size:12px;color:var(--stt-mute)}
.stt-chip{display:inline-flex;align-items:center;gap:4px;height:34px;padding:0 10px;border-radius:9px;font-size:12px;background:rgba(255,255,255,.06);box-shadow:0 0 0 1px var(--stt-line) inset;white-space:nowrap}
.stt-invite-row{display:flex;gap:8px;margin-bottom:10px}
.stt-field{flex:1;display:flex;align-items:center;gap:8px;height:34px;padding:0 10px;border-radius:9px;background:rgba(0,0,0,.25);box-shadow:0 0 0 1px var(--stt-line-2) inset;font-size:12.5px;min-width:0;overflow:hidden;white-space:nowrap}
.stt-field em{font-style:normal;color:var(--stt-dim)}
.stt-caret{width:1.5px;height:14px;margin-left:-6px;background:var(--stt-accent);animation:stt-blink 1s steps(2) infinite}
.stt-pending li{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--stt-line);font-size:12.5px}
.stt-pending-mail{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stt-pending b{font-size:11px;font-weight:550;color:var(--stt-accent)}
.stt-metric{display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:8px;border-radius:12px;background:rgba(255,255,255,.05);box-shadow:0 0 0 1px var(--stt-line) inset}
.stt-metric>div{flex:1;min-width:0}
.stt-metric strong{display:block;font-size:12.5px;font-weight:550}
.stt-metric span{font-size:11px;color:var(--stt-mute)}
.stt-metric u{font-size:11px;text-underline-offset:3px;color:var(--stt-text);white-space:nowrap}
.stt-metric-ic{display:grid;place-items:center;flex:none;width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.07);color:var(--stt-mute)}
.stt-bars{display:flex;align-items:flex-end;gap:7px;height:64px}
.stt-bars span{flex:1;border-radius:5px 5px 2px 2px;background:rgba(255,255,255,.18)}
.stt-bars span[data-hi]{background:var(--stt-accent)}
.stt-access-list li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--stt-line);font-size:13px}
.stt-status-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;font-size:12.5px;color:var(--stt-mute)}
.stt-status-row>span{display:inline-flex;align-items:center;gap:8px}
.stt-dot{width:8px;height:8px;border-radius:50%;background:var(--stt-ok);box-shadow:0 0 0 4px rgba(90,208,138,.18)}
.stt-dot[data-off]{background:#d06a5a;box-shadow:0 0 0 4px rgba(208,106,90,.18)}

.stt-seg{position:relative;display:inline-flex;padding:3px;border-radius:10px;background:rgba(0,0,0,.28);box-shadow:0 0 0 1px var(--stt-line) inset}
.stt-seg button{position:relative;padding:6px 12px;border-radius:7px;font-size:12px;color:var(--stt-mute);transition:color .2s,background-color .3s,box-shadow .3s}
.stt-seg button[data-on]{background:rgba(255,255,255,.12);color:#fff;box-shadow:0 1px 0 rgba(255,255,255,.08) inset,0 2px 8px rgba(0,0,0,.3)}
.stt-seg-sm button{padding:4px 10px;font-size:11.5px}

.stt-switch{position:relative;flex:none;width:38px;height:22px;border-radius:999px;background:rgba(255,255,255,.16);transition:background-color .3s}
.stt-switch span{position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.4);transition:transform .4s cubic-bezier(.3,1.4,.5,1)}
.stt-switch[data-on]{background:var(--stt-ok)}
.stt-switch[data-on] span{transform:translateX(16px)}
.stt-switch-sm{width:32px;height:18px}
.stt-switch-sm span{width:12px;height:12px}
.stt-switch-sm[data-on] span{transform:translateX(14px)}

.stt-tabs{position:relative;display:flex;gap:6px;margin-bottom:30px;overflow-x:auto;scrollbar-width:none;padding:4px}
.stt-tabs::-webkit-scrollbar{display:none}
.stt-tab-bar{position:absolute;left:0;top:4px;bottom:4px;width:0;border-radius:6px;background:#202024;box-shadow:0 0 0 1px var(--stt-line-2) inset}
.stt-tabs button{position:relative;z-index:1;flex:1 0 auto;padding:12px 22px;font-size:13px;color:var(--stt-mute);white-space:nowrap;transition:color .25s}
.stt-tabs button span{color:var(--stt-dim);margin-right:6px;font-variant-numeric:tabular-nums}
.stt-tabs button[data-on],.stt-tabs button:hover{color:#fff}

.stt-stage{position:relative;padding:clamp(30px,5vw,64px) clamp(12px,3vw,40px) 0;border-radius:var(--stt-r) var(--stt-r) 0 0;overflow:hidden;perspective:1600px;background:#14211f}
.stt-stage-media{position:absolute;inset:0;transform-origin:50% 100%}
.stt-stage::after{content:"";position:absolute;left:0;right:0;bottom:0;height:90px;background:linear-gradient(transparent,var(--stt-bg));pointer-events:none}
.stt-app-wrap{position:relative;z-index:1;transform-origin:50% 0;will-change:transform}
.stt-app{display:flex;height:600px;max-width:1080px;margin:0 auto;border-radius:18px 18px 0 0;background:rgba(18,18,20,.94);box-shadow:0 0 0 1px rgba(255,255,255,.1) inset,0 40px 90px -30px rgba(0,0,0,.8);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);overflow:hidden}
.stt-rail{display:flex;flex-direction:column;align-items:center;gap:6px;flex:none;width:58px;padding:16px 0;border-right:1px solid var(--stt-line)}
.stt-rail-logo{font-weight:700;font-size:17px;letter-spacing:-.04em;margin-bottom:14px}
.stt-rail-logo sup{font-size:9px;color:var(--stt-accent)}
.stt-rail button{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;color:var(--stt-dim);transition:color .2s,background-color .25s}
.stt-rail button:hover{color:#fff}
.stt-rail button[data-on]{color:#fff;background:rgba(255,255,255,.08)}
.stt-panel{flex:1;min-width:0;overflow:hidden;display:flex}
.stt-panel>*{flex:1;min-width:0}
.stt-app-title h3{font-size:17px;font-weight:600;letter-spacing:-.02em}
.stt-app-title span{display:block;margin-top:2px;font-size:12px;color:var(--stt-dim)}
.stt-app-title-row{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}

.stt-users{display:flex;min-height:0}
.stt-users-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;padding:20px;overflow:hidden}
.stt-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.stt-search{display:flex;align-items:center;gap:7px;flex:1;min-width:140px;height:30px;padding:0 10px;border-radius:9px;background:rgba(0,0,0,.25);box-shadow:0 0 0 1px var(--stt-line) inset;color:var(--stt-dim)}
.stt-search input{flex:1;min-width:0;background:none;border:0;outline:0;font-size:12.5px;color:var(--stt-text)}
.stt-search:focus-within{box-shadow:0 0 0 1px var(--stt-accent) inset}
.stt-filters{display:flex;gap:4px}
.stt-filters button{padding:5px 10px;border-radius:999px;font-size:11.5px;color:var(--stt-mute);box-shadow:0 0 0 1px var(--stt-line) inset;transition:all .2s}
.stt-filters button[data-on]{background:#f5f3ef;color:#121214;box-shadow:none}
.stt-invite-form{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 12px;border-radius:12px;background:rgba(243,178,122,.07);box-shadow:0 0 0 1px rgba(243,178,122,.3) inset;color:var(--stt-accent);animation:stt-pop .4s cubic-bezier(.2,.8,.2,1)}
.stt-invite-form input{flex:1;min-width:0;background:none;border:0;outline:0;font-size:13px;color:var(--stt-text)}
.stt-invite-form select{height:30px;padding:0 8px;border-radius:8px;border:0;background:rgba(255,255,255,.08);font-size:12px;color:var(--stt-text)}
.stt-invite-form select option{background:#18181b}
.stt-table{flex:1;min-height:0;overflow:auto;border-radius:12px;box-shadow:0 0 0 1px var(--stt-line) inset;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}
.stt-tr{display:grid;grid-template-columns:1.25fr 1.4fr .8fr .9fr;align-items:center;gap:10px;padding:9px 14px;font-size:12.5px;border-bottom:1px solid var(--stt-line);cursor:pointer;transition:background-color .2s}
.stt-tr:hover{background:rgba(255,255,255,.035)}
.stt-tr[data-on]{background:rgba(255,255,255,.07)}
.stt-th{position:sticky;top:0;z-index:1;background:#16161a;cursor:default;font-size:11px;color:var(--stt-dim);text-transform:uppercase;letter-spacing:.06em}
.stt-th:hover{background:#16161a}
.stt-td-user{display:flex;align-items:center;gap:9px;min-width:0}
.stt-td-user b{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stt-td-mute{color:var(--stt-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stt-role{display:inline-block;padding:2px 8px;border-radius:6px;font-style:normal;font-size:11px;background:rgba(255,255,255,.07);color:var(--stt-mute)}
.stt-role[data-role="Admin"]{background:#f5f3ef;color:#121214}
.stt-role[data-role="Manager"]{background:rgba(243,178,122,.16);color:var(--stt-accent)}
.stt-empty{padding:30px;text-align:center;font-size:12.5px;color:var(--stt-dim)}
.stt-details{flex:none;width:300px;display:flex;flex-direction:column;border-left:1px solid var(--stt-line);background:rgba(255,255,255,.02);min-height:0}
.stt-details-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--stt-line);font-size:13px;font-weight:550}
.stt-details-head>span{display:inline-flex;align-items:center;gap:7px}
.stt-details-head .stt-icon-btn{width:24px;height:24px}
.stt-details-body{flex:1;min-height:0;overflow:auto;padding:16px 18px 18px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}
.stt-details-empty{flex:1;display:grid;place-items:center;align-content:center;gap:10px;padding:30px;text-align:center;color:var(--stt-dim);font-size:12.5px}
.stt-todo{margin-top:8px;padding:4px 12px 8px;border-radius:12px;background:rgba(255,255,255,.05);box-shadow:0 0 0 1px var(--stt-line) inset}
.stt-todo-head{display:flex;align-items:center;gap:10px;width:100%;padding:8px 0;text-align:left}
.stt-todo-head>div{flex:1}
.stt-todo-head strong{display:block;font-size:12.5px;font-weight:550}
.stt-todo-head span{font-size:11px;color:var(--stt-mute)}
.stt-todo-head svg{transition:transform .35s}
.stt-todo-item{position:relative;display:flex;gap:10px;align-items:flex-start;margin-top:6px;padding:9px 10px;border-radius:10px;background:rgba(0,0,0,.25);box-shadow:0 0 0 1px var(--stt-line) inset;cursor:pointer;transition:background-color .2s}
.stt-todo-item:hover{background:rgba(0,0,0,.35)}
.stt-todo-item input{position:absolute;opacity:0;width:1px;height:1px}
.stt-box{display:grid;place-items:center;flex:none;width:15px;height:15px;margin-top:1px;border-radius:4px;box-shadow:0 0 0 1.5px rgba(255,255,255,.4) inset;color:#121214;transition:all .25s}
.stt-box svg{opacity:0;transform:scale(.4);transition:all .3s cubic-bezier(.2,1.5,.4,1)}
.stt-todo-item[data-done] .stt-box{background:#5a8cf0;box-shadow:none;color:#fff}
.stt-todo-item[data-done] .stt-box svg{opacity:1;transform:none}
.stt-todo-item input:focus-visible+.stt-box{outline:2px solid var(--stt-accent);outline-offset:2px}
.stt-todo-text b{display:block;font-size:12px;font-weight:500;transition:color .25s}
.stt-todo-item[data-done] .stt-todo-text b{color:var(--stt-dim);text-decoration:line-through}
.stt-todo-text span{display:flex;gap:6px;align-items:center;margin-top:3px;font-size:10.5px;color:var(--stt-dim)}
.stt-todo-text i{font-style:normal;padding:1px 6px;border-radius:4px;background:#0b0b0d;color:var(--stt-mute)}

.stt-activity{display:flex;flex-direction:column;gap:14px;padding:20px;overflow:auto}
.stt-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.stt-kpi{position:relative;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.04);box-shadow:0 0 0 1px var(--stt-line) inset}
.stt-kpi span{display:block;font-size:11.5px;color:var(--stt-mute)}
.stt-kpi strong{display:block;margin-top:6px;font-size:24px;font-weight:550;letter-spacing:-.03em}
.stt-kpi i{position:absolute;right:14px;top:14px;font-style:normal;font-size:11px;color:var(--stt-ok)}
.stt-activity-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:10px;flex:1;min-height:0}
.stt-chart-card,.stt-feed{position:relative;display:flex;flex-direction:column;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.03);box-shadow:0 0 0 1px var(--stt-line) inset;min-height:0}
.stt-chart-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:12.5px;font-weight:550}
.stt-chart-head>span{display:inline-flex;align-items:center;gap:8px}
.stt-chart{flex:1;width:100%;height:auto;min-height:200px;cursor:crosshair}
.stt-grid-line{stroke:rgba(255,255,255,.07);stroke-dasharray:3 5;vector-effect:non-scaling-stroke}
.stt-cross{stroke:rgba(255,255,255,.35);stroke-dasharray:2 3;vector-effect:non-scaling-stroke}
.stt-tip{position:absolute;margin:24px 0 0 16px;transform:translate(-50%,-150%);padding:4px 8px;border-radius:7px;background:#f5f3ef;color:#121214;font-size:11px;font-weight:600;pointer-events:none;white-space:nowrap}
.stt-live{width:7px;height:7px;border-radius:50%;background:var(--stt-ok);box-shadow:0 0 0 0 rgba(90,208,138,.6);animation:stt-pulse 1.8s infinite}
.stt-feed ul{display:flex;flex-direction:column;gap:2px;overflow:hidden}
.stt-feed-item{display:flex;align-items:flex-start;gap:9px;padding:8px 0;border-bottom:1px solid var(--stt-line);animation:stt-in .5s cubic-bezier(.2,.8,.2,1)}
.stt-feed-item p{flex:1;font-size:12px;color:var(--stt-mute);line-height:1.45}
.stt-feed-item b{font-weight:550;color:var(--stt-text)}
.stt-feed-item time{font-size:10.5px;color:var(--stt-dim);white-space:nowrap}

.stt-pipeline{display:flex;flex-direction:column;gap:16px;padding:20px;overflow:auto}
.stt-pipe-sum{display:flex;gap:16px;font-size:12px;color:var(--stt-mute)}
.stt-pipe-sum b{display:block;font-size:18px;font-weight:600;color:var(--stt-text);letter-spacing:-.02em}
.stt-pipe-sum .stt-won{color:var(--stt-ok)}
.stt-board{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:10px;flex:1;min-height:0}
.stt-col{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:14px;background:rgba(255,255,255,.03);box-shadow:0 0 0 1px var(--stt-line) inset}
.stt-col-head{display:flex;align-items:center;gap:7px;padding:2px 4px 6px;font-size:12px;font-weight:550}
.stt-col-head i{font-style:normal;padding:0 6px;border-radius:5px;background:rgba(255,255,255,.08);font-size:10.5px;color:var(--stt-mute)}
.stt-col-head b{margin-left:auto;font-weight:500;font-size:11px;color:var(--stt-dim)}
.stt-deal{display:flex;flex-direction:column;gap:6px;padding:11px 12px;border-radius:11px;text-align:left;background:#1c1c20;box-shadow:0 0 0 1px var(--stt-line-2) inset,0 6px 16px -10px rgba(0,0,0,.8);transition:box-shadow .25s,background-color .25s}
.stt-deal:hover:not(:disabled){background:#232328;box-shadow:0 0 0 1px rgba(243,178,122,.5) inset,0 10px 24px -12px rgba(0,0,0,.9)}
.stt-deal:disabled{cursor:default}
.stt-deal[data-won]{background:rgba(90,208,138,.08);box-shadow:0 0 0 1px rgba(90,208,138,.25) inset}
.stt-deal-top{display:flex;justify-content:space-between;align-items:center;font-size:12.5px}
.stt-deal-top b{font-weight:550}
.stt-deal-top svg{color:var(--stt-dim);transition:transform .3s,color .2s}
.stt-deal:hover:not(:disabled) .stt-deal-top svg{color:var(--stt-accent);transform:translateX(2px)}
.stt-deal[data-won] .stt-deal-top svg{color:var(--stt-ok)}
.stt-deal-name{font-size:11.5px;color:var(--stt-mute)}
.stt-deal-foot{display:flex;justify-content:space-between;align-items:center}
.stt-deal-foot i{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;font-style:normal;font-size:9px;font-weight:600;background:rgba(255,255,255,.1)}
.stt-deal-foot em{font-style:normal;font-size:12px;font-weight:550}
.stt-col-empty{padding:16px 6px;text-align:center;font-size:11px;color:var(--stt-dim);border-radius:10px;box-shadow:0 0 0 1px var(--stt-line) inset;border:1px dashed transparent}

.stt-access{display:flex;min-height:0}
.stt-access-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:16px;padding:20px;overflow:auto}
.stt-matrix{border-radius:14px;box-shadow:0 0 0 1px var(--stt-line) inset;overflow:hidden}
.stt-mrow{display:grid;grid-template-columns:1.6fr repeat(3,1fr);align-items:center;padding:12px 16px;border-bottom:1px solid var(--stt-line);font-size:12.5px}
.stt-mrow:last-child{border-bottom:0}
.stt-mrow>span:not(:first-child){display:flex;justify-content:center}
.stt-mhead{font-size:11px;color:var(--stt-dim);text-transform:uppercase;letter-spacing:.06em;background:rgba(255,255,255,.03)}
.stt-access-side{flex:none;width:290px;padding:20px 18px;border-left:1px solid var(--stt-line);overflow:auto}
.stt-enforce{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;margin-bottom:8px;border-radius:12px;background:rgba(255,255,255,.04);box-shadow:0 0 0 1px var(--stt-line) inset}
.stt-enforce strong{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:550}
.stt-enforce span{font-size:11px;color:var(--stt-mute)}
.stt-log li{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--stt-line)}
.stt-log i{flex:none;width:6px;height:6px;margin-top:6px;border-radius:50%;background:var(--stt-accent)}
.stt-log p{flex:1;font-size:11.5px;color:var(--stt-mute);line-height:1.45}
.stt-log time{font-size:10.5px;color:var(--stt-dim)}

.stt-head-pricing{align-items:end}
.stt-billing{justify-self:end;display:flex;align-items:center;gap:10px;font-size:13px;color:var(--stt-dim)}
.stt-billing>button{color:var(--stt-dim);transition:color .2s}
.stt-billing>button[data-on]{color:#fff}
.stt-save{padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;background:rgba(90,208,138,.14);color:var(--stt-ok);opacity:.45;transition:opacity .3s,transform .4s cubic-bezier(.3,1.5,.5,1)}
.stt-save[data-on]{opacity:1;transform:scale(1.06)}
.stt-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:stretch;padding-top:34px}
.stt-plan{--mx:50%;--my:0px;position:relative;display:flex;flex-direction:column;border-radius:var(--stt-r);background:var(--stt-panel);box-shadow:0 0 0 1px var(--stt-line) inset;transition:transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .4s}
.stt-plan::before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(320px circle at var(--mx) var(--my),rgba(255,255,255,.07),transparent 60%);opacity:0;transition:opacity .4s;pointer-events:none}
.stt-plan:hover{transform:translateY(-6px);box-shadow:0 0 0 1px var(--stt-line-2) inset,0 30px 60px -30px rgba(0,0,0,.9)}
.stt-plan:hover::before{opacity:1}
.stt-plan[data-featured]{background:#fbfaf7;color:#121214;box-shadow:0 30px 70px -30px rgba(243,178,122,.35)}
.stt-plan[data-featured]::before{background:radial-gradient(320px circle at var(--mx) var(--my),rgba(243,178,122,.14),transparent 60%)}
.stt-ribbon{position:absolute;left:0;right:0;bottom:calc(100% - 22px);height:56px;border-radius:var(--stt-r) var(--stt-r) 0 0;overflow:hidden;z-index:0}
.stt-ribbon>span{position:absolute;left:0;right:0;top:7px;display:flex;align-items:center;justify-content:center;gap:5px;font-size:11.5px;font-weight:550;color:#1b120c;text-shadow:0 1px 0 rgba(255,255,255,.4)}
.stt-ribbon .stt-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(rgba(255,228,200,.35),rgba(255,228,200,.1))}
.stt-plan-inner{position:relative;z-index:1;display:flex;flex-direction:column;flex:1;padding:24px;border-radius:inherit;background:inherit}
.stt-plan-icon{display:block;margin-bottom:26px;color:#d9d6cf}
.stt-plan[data-featured] .stt-plan-icon{color:#121214}
.stt-plan h3{font-size:17px;font-weight:600;letter-spacing:-.02em}
.stt-plan-blurb{margin-top:4px;font-size:12.5px;color:var(--stt-mute);min-height:2.6em}
.stt-plan[data-featured] .stt-plan-blurb,.stt-plan[data-featured] .stt-billed,.stt-plan[data-featured] .stt-renew{color:rgba(18,18,20,.58)}
.stt-price{display:flex;align-items:center;gap:10px;margin-top:22px}
.stt-price strong{font-size:44px;font-weight:600;letter-spacing:-.05em;line-height:1;font-variant-numeric:tabular-nums}
.stt-price strong span{display:inline-block}
.stt-unit{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:10.5px;font-weight:550;background:#232327;color:#fff}
.stt-plan[data-featured] .stt-unit{background:#121214}
.stt-billed{display:block;margin-top:8px;padding-bottom:20px;border-bottom:1px solid var(--stt-line-2);font-size:11.5px;color:var(--stt-dim)}
.stt-plan[data-featured] .stt-billed{border-color:rgba(18,18,20,.12)}
.stt-feats{flex:1;display:flex;flex-direction:column;gap:11px;padding:22px 0 30px}
.stt-feats li{display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(245,243,239,.82)}
.stt-plan[data-featured] .stt-feats li{color:#121214}
.stt-tick{display:grid;place-items:center;flex:none;width:16px;height:16px;border-radius:4px;background:rgba(255,255,255,.14);color:#fff}
.stt-plan[data-featured] .stt-tick{background:#121214}
.stt-renew{display:block;margin-top:12px;text-align:center;font-size:11px;color:var(--stt-dim)}

.stt-test{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);min-height:560px;border-radius:var(--stt-r);overflow:hidden;box-shadow:0 0 0 1px var(--stt-line) inset;background:var(--stt-panel)}
.stt-test-main{position:relative;display:flex;flex-direction:column;justify-content:center;gap:22px;padding:clamp(24px,4vw,48px)}
.stt-stars{display:flex;gap:3px;color:var(--stt-accent)}
.stt-test-main blockquote{font-size:clamp(20px,2.1vw,27px);line-height:1.28;letter-spacing:-.025em;font-weight:450;color:#fff;min-height:7.7em}
.stt-qw{display:inline-block;white-space:pre}
.stt-test-foot{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:auto}
.stt-quote-author{display:flex;align-items:center;gap:12px}
.stt-quote-author b{display:block;font-size:13.5px;font-weight:550}
.stt-quote-author span{font-size:12px;color:var(--stt-mute)}
.stt-test-nav{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--stt-dim);font-variant-numeric:tabular-nums}
.stt-test-progress{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--stt-accent);transform-origin:0 50%;animation:stt-fill 7s linear forwards}
.stt-test-progress[data-paused]{animation-play-state:paused}
.stt-wall{position:relative;overflow:hidden;min-height:420px}
.stt-wall-cols{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 14px;-webkit-mask-image:linear-gradient(transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(transparent,#000 12%,#000 88%,transparent)}
.stt-wall-col{overflow:hidden}
.stt-wall-track{display:flex;flex-direction:column;gap:12px;padding-top:12px;animation:stt-up 34s linear infinite}
.stt-wall-col[data-dir="down"] .stt-wall-track{animation-name:stt-down;animation-duration:40s}
.stt-wall:hover .stt-wall-track{animation-play-state:paused}
.stt-tcard{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:4px;text-align:left;background:#fbfaf7;color:#121214;box-shadow:0 14px 30px -14px rgba(0,0,0,.6);transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s}
.stt-tcard:hover{transform:translateY(-3px) rotate(-.6deg)}
.stt-tcard[data-on]{box-shadow:0 0 0 2px var(--stt-accent),0 14px 30px -14px rgba(0,0,0,.6)}
.stt-tcard-who{display:flex;gap:9px;align-items:center}
.stt-tcard-who b{display:block;font-size:12px;font-weight:600}
.stt-tcard-who i{display:block;font-style:normal;font-size:10.5px;color:rgba(18,18,20,.58)}
.stt-tcard-q{font-size:11.5px;line-height:1.5;color:rgba(18,18,20,.72)}

.stt-cta{padding-bottom:clamp(80px,10vw,130px)}
.stt-cta-card{position:relative;max-width:920px;min-height:460px;margin:0 auto;border-radius:28px;overflow:hidden;display:grid;place-items:center;clip-path:inset(0% 0% 0% 0% round 28px);background:#0d1220}
.stt-cta-media{position:absolute;inset:0}
.stt-flags{position:absolute;inset:0;width:100%;height:100%;z-index:1}
.stt-flag{transform-box:fill-box;transform-origin:50% 0;animation:stt-flutter 3s ease-in-out infinite}
.stt-cta-shade{position:absolute;inset:0;z-index:1;background:radial-gradient(60% 70% at 50% 60%,rgba(8,10,18,.55),rgba(8,10,18,.15) 70%),linear-gradient(rgba(8,10,18,.1),rgba(8,10,18,.5))}
.stt-cta-copy{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;max-width:520px;padding:150px 24px 64px;text-align:center}
.stt-cta-copy h2{font-size:clamp(28px,3.4vw,40px);line-height:1.12;letter-spacing:-.035em;font-weight:500;color:#fff}
.stt-cta-copy p{margin-top:14px;font-size:13.5px;color:rgba(255,255,255,.75);max-width:420px}
.stt-cta-btns{display:flex;gap:10px;margin-top:26px;flex-wrap:wrap;justify-content:center}

.stt-footer{position:relative;overflow:hidden;padding:clamp(40px,6vw,70px) clamp(20px,4.6vw,64px) 0;min-height:max(calc(var(--stt-h) * .9),620px);display:flex;flex-direction:column}
.stt-footer-media{position:absolute;left:0;right:0;bottom:0;height:78%}
.stt-footer-shade{position:absolute;inset:0;background:linear-gradient(var(--stt-bg) 22%,rgba(10,10,11,.55) 50%,rgba(10,10,11,.15) 72%,rgba(10,10,11,.5))}
.stt-footer-top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:40px;max-width:1240px;width:100%;margin:0 auto;flex-wrap:wrap}
.stt-footer-brand{max-width:420px}
.stt-footer-brand strong{font-size:26px;font-weight:600;letter-spacing:-.03em}
.stt-footer-brand p{margin-top:10px;font-size:14px;color:var(--stt-mute)}
.stt-social{display:flex;gap:8px;margin-top:18px}
.stt-social a{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.06);box-shadow:0 0 0 1px var(--stt-line) inset;transition:background-color .2s,transform .3s}
.stt-social a:hover{background:rgba(255,255,255,.14);transform:translateY(-2px)}
.stt-footer-cols{display:flex;gap:clamp(40px,6vw,80px)}
.stt-footer-cols h3{font-size:13px;font-weight:550;margin-bottom:12px}
.stt-footer-cols li{margin-bottom:7px}
.stt-footer-cols a{font-size:13px;color:var(--stt-mute);transition:color .2s}
.stt-footer-cols a:hover{color:#fff}
.stt-wordmark{position:relative;z-index:1;width:100%;height:auto;margin-top:auto;overflow:visible}
.stt-wordmark-text{font-family:"Times New Roman",Times,ui-serif,Georgia,serif;font-size:390px;letter-spacing:-.02em;mix-blend-mode:normal}
.stt-footer-bottom{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:16px;max-width:1240px;width:100%;margin:0 auto;padding:16px 0 22px;border-top:1px solid rgba(255,255,255,.14);font-size:12px;color:rgba(255,255,255,.7)}
.stt-totop{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,.85)}
.stt-totop:hover{color:#fff}

.stt-photo{position:absolute;inset:0;overflow:hidden;background:#151316}
.stt-range{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;max-width:none;opacity:0;transition:opacity 1s ease}
.stt-range[data-painted]{opacity:1}
.stt-hero-media .stt-range{top:9%}
.stt-photo-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;max-width:none;opacity:0;transition:opacity 1.1s ease}
.stt-photo[data-state="ready"] .stt-photo-img{opacity:1}
.stt-avatar{position:relative;display:inline-grid;place-items:center;flex:none;border-radius:50%;overflow:hidden;color:#fff;font-weight:600;letter-spacing:.02em}
.stt-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;max-width:none}

.stt-modal{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:rgba(5,5,6,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:stt-fade .3s ease}
.stt-dialog{position:relative;width:min(420px,100%);padding:28px;border-radius:24px;background:#151517;box-shadow:0 0 0 1px var(--stt-line-2) inset,0 40px 100px -20px rgba(0,0,0,.9);color:var(--stt-text)}
.stt-dialog-x{position:absolute;right:16px;top:16px}
.stt-dialog h3{margin-top:18px;font-size:22px;font-weight:600;letter-spacing:-.03em}
.stt-dialog p{margin-top:6px;font-size:13.5px;color:var(--stt-mute)}
.stt-wl-field{display:flex;align-items:center;gap:10px;height:46px;margin-top:22px;padding:0 14px;border-radius:12px;background:rgba(0,0,0,.35);box-shadow:0 0 0 1px var(--stt-line-2) inset;color:var(--stt-dim);transition:box-shadow .2s}
.stt-wl-field:focus-within{box-shadow:0 0 0 1px var(--stt-accent) inset}
.stt-wl-field[data-error]{box-shadow:0 0 0 1px #e0705f inset;animation:stt-shake .4s}
.stt-wl-field input{flex:1;min-width:0;background:none;border:0;outline:0;font-size:14px;color:var(--stt-text)}
.stt-wl-err{display:block;min-height:20px;padding-top:4px;font-size:12px;color:#e0705f}
.stt-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(0,0,0,.2);border-top-color:#121214;animation:stt-rot .7s linear infinite}
.stt-done{text-align:left}
.stt-done-ic{display:grid;place-items:center;width:46px;height:46px;margin-top:18px;border-radius:50%;background:var(--stt-ok);color:#06140c;animation:stt-popin .6s cubic-bezier(.3,1.6,.5,1)}
.stt-done .stt-btn{margin-top:22px}

@keyframes stt-marquee{to{transform:translateX(-50%)}}
@keyframes stt-up{to{transform:translateY(-50%)}}
@keyframes stt-down{from{transform:translateY(-50%)}to{transform:translateY(0)}}
@keyframes stt-fill{to{transform:scaleX(1)}}
@keyframes stt-cue{0%{transform:translateY(0);opacity:0}30%{opacity:1}100%{transform:translateY(14px);opacity:0}}
@keyframes stt-drift{to{transform:translateX(6%)}}
@keyframes stt-blink{50%{opacity:0}}
@keyframes stt-pulse{70%{box-shadow:0 0 0 7px rgba(90,208,138,0)}100%{box-shadow:0 0 0 0 rgba(90,208,138,0)}}
@keyframes stt-in{from{opacity:0;transform:translateY(-8px)}}
@keyframes stt-pop{from{opacity:0;transform:translateY(-6px) scale(.98)}}
@keyframes stt-popin{from{transform:scale(.3);opacity:0}}
@keyframes stt-fade{from{opacity:0}}
@keyframes stt-rot{to{transform:rotate(360deg)}}
@keyframes stt-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
@keyframes stt-flutter{0%,100%{transform:skewY(0deg) scaleX(1) rotate(0deg)}30%{transform:skewY(7deg) scaleX(.9) rotate(3deg)}65%{transform:skewY(-5deg) scaleX(.96) rotate(-2deg)}}

@media (max-width:1024px){
.stt-links{display:none}
.stt-nav-inner{grid-template-columns:1fr auto}
.stt-logo span{opacity:1;transform:none}
.stt-burger{display:grid}
.stt-sheet{display:flex;flex-direction:column;max-width:980px;margin:8px auto 0;padding:8px;border-radius:20px;background:rgba(14,14,16,.92);box-shadow:0 0 0 1px rgba(255,255,255,.1) inset;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);animation:stt-pop .35s cubic-bezier(.2,.8,.2,1)}
.stt-sheet a{display:flex;justify-content:space-between;align-items:center;padding:14px 14px;border-radius:12px;font-size:15px}
.stt-sheet a:hover{background:rgba(255,255,255,.06)}
.stt-head-split{grid-template-columns:1fr}
.stt-lede,.stt-billing{justify-self:start}
.stt-how{grid-template-columns:1fr}
.stt-details,.stt-access-side{width:260px}
.stt-plans{grid-template-columns:1fr;max-width:460px;margin:0 auto;gap:56px}
.stt-test{grid-template-columns:1fr}
.stt-wall{min-height:460px}
}
@media (max-width:760px){
.stt-root{font-size:14px}
.stt-login,.stt-nav-cta .stt-btn{display:none}
.stt-nav{padding:14px 14px 0}
.stt-hero{padding:8px}
.stt-hero-frame{height:calc(max(var(--stt-h),660px) - 16px)}
.stt-eyebrow{font-size:9.5px;letter-spacing:.1em}
.stt-hero-title{font-size:clamp(34px,9.6vw,44px);line-height:1.04}
.stt-line{display:inline}
.stt-float-card{left:16px;right:16px;top:auto;bottom:44px;padding:16px;border-radius:16px;min-height:0}
.stt-how-visual{min-height:520px}
.stt-tabs button{padding:10px 14px;font-size:12px}
.stt-app{height:640px}
.stt-rail{display:none}
.stt-users{flex-direction:column}
.stt-details{width:auto;border-left:0;border-top:1px solid var(--stt-line);max-height:300px}
.stt-tr{grid-template-columns:1.4fr .8fr}
.stt-tr>span:nth-child(2),.stt-tr>span:nth-child(4){display:none}
.stt-filters{display:none}
.stt-kpis{grid-template-columns:1fr 1fr 1fr;gap:6px}
.stt-kpi{padding:10px}
.stt-kpi strong{font-size:17px}
.stt-kpi i{display:none}
.stt-activity-grid{grid-template-columns:1fr}
.stt-board{grid-template-columns:repeat(4,minmax(150px,1fr));overflow-x:auto}
.stt-access{flex-direction:column}
.stt-access-side{width:auto;border-left:0;border-top:1px solid var(--stt-line)}
.stt-mrow{grid-template-columns:1.4fr repeat(3,.8fr);padding:10px 12px;font-size:12px}
.stt-mhead{font-size:9.5px}
.stt-app-title-row{flex-direction:column;align-items:flex-start}
.stt-billing{flex-wrap:wrap}
.stt-wall-cols{grid-template-columns:1fr}
.stt-wall-col[data-dir="down"]{display:none}
.stt-test-main blockquote{min-height:0}
.stt-footer-cols{gap:40px}
.stt-footer-bottom{flex-direction:column;align-items:flex-start}
}
@media (prefers-reduced-motion:reduce){
.stt-logos-track,.stt-wall-track,.stt-mist,.stt-flag,.stt-scroll-cue span,.stt-live,.stt-caret{animation:none}
.stt-btn,.stt-plan,.stt-tcard{transition:none}
}
.stt-root[data-motion="reduced"] .stt-logos-track,.stt-root[data-motion="reduced"] .stt-wall-track,.stt-root[data-motion="reduced"] .stt-flag,.stt-root[data-motion="reduced"] .stt-mist{animation:none}
.stt-root[data-motion="reduced"] .stt-wall-cols{position:relative;inset:auto;padding:14px}
.stt-root[data-motion="reduced"] .stt-wall-track [aria-hidden]{display:none}
`
