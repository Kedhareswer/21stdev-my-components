"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/*
 * Fresco Interview Template: a long-read interview set inside a painted
 * Baroque ceiling. The sky is a sticky stage of cumulus banks painted on
 * canvas (a seeded puff field, lit from above, graded to the palette) that
 * drift past at their own depths as the page scrolls. Marble angels and
 * cherubs are real photographs of sculpture, lifted off their skies in a
 * canvas keyer and re-graded to the same fresco palette, so they read as
 * painted into the clouds. The headline sinks behind a bank of cloud, the
 * pull-quote is pinned while a twisting red ribbon draws itself through it,
 * and the next story rises out of the clouds at the end.
 *
 * Everything renders without the photographs: the first frame is finished
 * before any image arrives, and a figure that cannot be fetched simply
 * stays out of the sky.
 */

export type FitFigure = {
  src: string
  alt?: string
  /** How the figure is lifted off its background: `edges` keys against the photo's own edge colour (clear skies, studio walls), `luma` keeps the lit parts and drops the dark (paintings, night shots), `none` shows the photo in a soft oval. */
  key?: "edges" | "luma" | "none"
  /** Key thresholds, 0 to 1: below the first is background, above the second is subject. */
  range?: [number, number]
  /** Crop before keying, as fractions: x, y, width, height. */
  crop?: [number, number, number, number]
  /** Fade out the bottom of the figure into the clouds, as a fraction of its height. */
  fade?: number
  /** How much of the photo's own colour survives the fresco grade, 0 to 1. */
  keep?: number
  /** Position and size on its stage, in percent of the stage width/height. */
  x: number
  y: number
  w: number
  /** Parallax depth: 0 sits on the page, 1 floats far behind it. */
  depth?: number
  rotate?: number
  flip?: boolean
  /** Idle float amplitude in pixels. */
  drift?: number
  /** Stand in front of the copy instead of behind it. */
  front?: boolean
}
export type FitBackdrop = {
  src: string
  alt?: string
  /** Crop before grading, as fractions: x, y, width, height. */
  crop?: [number, number, number, number]
  /** How much of the painting's own colour survives the grade, 0 to 1. */
  keep?: number
  gamma?: number
  /** object-position of the cover crop, e.g. "50% 40%". */
  focus?: string
  /** How the edges dissolve into the sky: `hero` fades the top a little and the bottom fully, `stage` fades both, `none` keeps it square. */
  mask?: "hero" | "stage" | "none"
  opacity?: number
}
export type FitQA = { q: string; a: string }
export type FitIconName = "instagram" | "x" | "linkedin" | "youtube" | "link"
export type FitLink = { label: string; href: string; icon?: FitIconName }
export type FitSeries = { name: string; issue: string; href?: string }
export type FitStory = {
  kicker: string
  title: string[]
  subject: string
  deck: string
  cta?: FitLink | null
  figures: FitFigure[]
  /** A painting behind the hero: a fresco photograph, graded to the palette. */
  backdrop?: FitBackdrop | null
}
export type FitQuote = { text: string; cite?: string; figure?: FitFigure | null; backdrop?: FitBackdrop | null }
export type FitQASection = { title: string; items: FitQA[]; ornament?: "pearl" | "none" | FitFigure }
export type FitNext = { label: string; title: string[]; blurb?: string; href: string; figure?: FitFigure | null; backdrop?: FitBackdrop | null }
export type FitCloudColors = { shadow: string; mid: string; light: string; rim: string }
export type FitTone = { a: string; b: string; c: string; sunX: number; sunY: number; sun: number; banks: number }
export type FitPalette = {
  cloud: FitCloudColors
  marble: [string, string, string]
  /** The ramp paintings are graded through, and how much of their own colour they keep. */
  fresco: [string, string, string]
  frescoKeep: number
  ink: string
  muted: string
  gold: string
  ribbon: string
  ribbonDark: string
  veil: string
  tones: { hero: FitTone; qa: FitTone; quote: FitTone; next: FitTone }
}
export type FitLabels = { index?: string; next?: string; scroll?: string; progress?: string; nextStory?: string; menu?: string; top?: string }

export type FrescoInterviewTemplateProps = {
  series?: FitSeries
  story?: FitStory
  sections?: FitQASection[]
  quote?: FitQuote | null
  next?: FitNext | null
  social?: FitLink[]
  legal?: FitLink[]
  labels?: FitLabels
  palette?: "auto" | "dusk" | "dawn" | "nocturne" | FitPalette
  theme?: "system" | "light" | "dark"
  seed?: number
  onNext?: (next: FitNext) => unknown
  height?: string
  className?: string
}

// #region content
const UNSPLASH = "https://images.unsplash.com/photo-"

export const DEFAULT_SERIES: FitSeries = { name: "Studio Visit", issue: "Vol. 04", href: "#" }

export const DEFAULT_STORY: FitStory = {
  kicker: "Interview 03",
  title: ["Loud", "Quiet"],
  subject: "Tomas Reyes, founder of Loud Quiet",
  deck: "**Loud Quiet** _got a locked-down city singing to itself from the rooftops._",
  cta: { label: "See Loud Quiet's site", href: "#" },
  backdrop: {
    src: UNSPLASH + "1768296100606-72e7ff614831",
    alt: "A Baroque ceiling fresco: figures and cherubs on clouds around a burst of light",
    crop: [0, 0.16, 1, 0.64],
    focus: "50% 45%",
    mask: "hero",
    gamma: 1.12,
  },
  figures: [
    {
      src: UNSPLASH + "1782897955905-fb23f7db40bd",
      alt: "A marble angel with open wings, looking down",
      key: "edges",
      range: [0.05, 0.16],
      crop: [0.05, 0.02, 0.9, 0.9],
      fade: 0.18,
      x: -4,
      y: 4,
      w: 24,
      depth: 0.7,
      rotate: -8,
      flip: true,
      drift: 10,
    },
    {
      src: UNSPLASH + "1758651794755-465d25631649",
      alt: "A marble angel holding a garment",
      key: "edges",
      range: [0.1, 0.24],
      crop: [0.05, 0, 0.9, 0.86],
      fade: 0.2,
      x: 76,
      y: 2,
      w: 24,
      depth: 0.55,
      rotate: 10,
      drift: 8,
    },
    {
      src: UNSPLASH + "1552420226-d747b0765a84",
      alt: "A bronze faun leaping with a flute",
      key: "edges",
      range: [0.1, 0.26],
      crop: [0.25, 0, 0.6, 1],
      fade: 0.3,
      keep: 0.12,
      x: 4,
      y: 44,
      w: 17,
      depth: 0.22,
      rotate: -4,
      flip: true,
      drift: 7,
      front: true,
    },
    {
      src: UNSPLASH + "1561593074-6a8c9d822cef",
      alt: "A bronze dancer with one arm raised, holding a shell",
      key: "edges",
      range: [0.16, 0.32],
      crop: [0.1, 0, 0.8, 1],
      fade: 0.3,
      keep: 0.1,
      x: 79,
      y: 46,
      w: 18,
      depth: 0.22,
      rotate: 4,
      drift: 7,
      front: true,
    },
    {
      src: UNSPLASH + "1571033690858-b336bfa1dd0f",
      alt: "A marble figure looking up into the light",
      key: "edges",
      range: [0.2, 0.34],
      crop: [0.02, 0.2, 0.96, 0.8],
      fade: 0.42,
      x: 37,
      y: 50,
      w: 26,
      depth: 0.08,
      drift: 5,
      front: true,
    },
  ],
}

export const DEFAULT_SECTIONS: FitQASection[] = [
  {
    title: "Q & A",
    ornament: "pearl",
    items: [
      {
        q: "Welcome Tomas. So how did you start out with Loud Quiet?",
        a: "I was three months into a job I did not like, in a flat I liked even less, and the only thing that got me out of bed was a Thursday choir in a church hall. Then the spring came when everything closed. No hall, no Thursday. I stood on the roof one evening and sang the tenor line on my own, mostly to feel something, and a window across the street opened and someone sang the alto back at me.",
      },
      {
        q: "How did you know where to start?",
        a: "I did not. I printed forty sheets of music, folded them into paper planes and threw them off the roof. Eleven people turned up the next evening. We had no conductor, no parts and a traffic warden for a metronome. It was awful and it was the best night of the year.",
      },
      {
        q: "So what was the first pivot?",
        a: "Realising the roof was the point. Nobody wanted to sing into a laptop. They wanted to stand somewhere high with the sky over them and hear a stranger's voice come back off a building. So we stopped trying to be a choir online and became a choir for roofs, fire escapes, balconies and car parks.",
      },
      {
        q: "What was the initial reaction?",
        a: "Complaints, honestly, and then flowers. The council wrote to us twice. The second letter asked if we would sing at the memorial garden on a Sunday. That was the moment the neighbours stopped calling it noise and started calling it the eight o'clock.",
      },
      {
        q: "Where did you pivot from there?",
        a: "Into a thing that could last. We built a map of safe roofs, a library of arrangements in three keys so anyone could join, and a rota of leads so I could stay home with a cold without the whole thing stopping. Loud Quiet is now forty-one roofs in nine cities and I have met almost none of the people on them.",
      },
      {
        q: "Do you find there is a new appreciation for singing together?",
        a: "I think people found out what their own voice is for. Not performing, not being good, just being heard across a street. We are allowed back indoors now and most of us have not gone. Indoors is quieter, somehow.",
      },
    ],
  },
  {
    title: "Q & A",
    ornament: {
      src: UNSPLASH + "1758651794755-465d25631649",
      alt: "The head and wings of a marble angel",
      key: "edges",
      range: [0.1, 0.24],
      crop: [0.12, 0.02, 0.76, 0.5],
      fade: 0.42,
      x: 0,
      y: 0,
      w: 100,
      depth: 0.4,
      rotate: 6,
      flip: true,
      drift: 7,
    },
    items: [
      {
        q: "Has singing always been a part of your life?",
        a: "My grandmother sang while she cooked and I thought that was what kitchens sounded like. I did not sing in front of anyone until I was twenty-six. I was a terrible teenager about it. Now I lead a hundred people in a harmony from a roof with a broken drainpipe and I think she would find that very funny.",
      },
      {
        q: "Did you find an inspiration in the struggle?",
        a: "The limits made it. No hall meant no permission, which meant anyone could start one. No conductor meant everybody had to listen harder. The thing that was supposed to stop us is the whole design.",
      },
      {
        q: "How has it evolved during the year?",
        a: "The song list got stranger and better. People bring lullabies in languages I had never heard and we learn them by ear in an evening. We stopped printing music. We started printing the words to pin to the inside of coats.",
      },
      {
        q: "Any advice for someone getting started?",
        a: "Pick a time and keep it, even when it is only you. Do not ask anyone to be good. Sing the low part if you are nervous, nobody can hear the low part. And bring tea, in a flask, enough for twelve.",
      },
      {
        q: "Looking back, what will you take away from the year?",
        a: "That a city is a hundred thousand rooms with people in them who would quite like to hear you. We only ever needed to open a window.",
      },
    ],
  },
]

export const DEFAULT_QUOTE: FitQuote = {
  text: "**Breath, harmony** _and a little company are more important than ever._",
  cite: "Tomas Reyes",
  backdrop: {
    src: UNSPLASH + "1780821637422-4a5703aea411",
    alt: "A pale ceiling fresco of angels and cherubs on cream clouds",
    crop: [0.08, 0.2, 0.84, 0.44],
    focus: "50% 45%",
    mask: "stage",
    keep: 0.42,
    opacity: 0.92,
  },
  figure: {
    src: UNSPLASH + "1775309678950-4d087e17d140",
    alt: "A painted angel with wings folded, seated on a rock",
    key: "luma",
    range: [0.18, 0.44],
    crop: [0.04, 0.03, 0.92, 0.9],
    fade: 0.28,
    keep: 0.45,
    x: 70,
    y: 20,
    w: 28,
    depth: 0.5,
    drift: 9,
  },
}

export const DEFAULT_NEXT: FitNext = {
  label: "Next story",
  title: ["Ines", "Varga"],
  blurb: "The stage designer who built a theatre in a multi-storey car park.",
  href: "#",
  backdrop: {
    src: UNSPLASH + "1583119912267-cc97c911e416",
    alt: "A ceiling fresco of cherubs in peach robes on a pale sky",
    crop: [0, 0.05, 1, 0.9],
    focus: "50% 60%",
    mask: "stage",
    keep: 0.5,
  },
  figure: {
    src: UNSPLASH + "1782897955905-fb23f7db40bd",
    alt: "A marble angel with open wings",
    key: "edges",
    range: [0.05, 0.16],
    crop: [0.05, 0.02, 0.9, 0.9],
    fade: 0.34,
    x: 67,
    y: 18,
    w: 22,
    depth: 0.2,
    drift: 8,
    front: true,
  },
}

export const DEFAULT_SOCIAL: FitLink[] = [
  { label: "Instagram", href: "#", icon: "instagram" },
  { label: "X", href: "#", icon: "x" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
]

export const DEFAULT_LEGAL: FitLink[] = [
  { label: "Privacy policy", href: "#" },
  { label: "Terms of service", href: "#" },
]

export const DEFAULT_LABELS = {
  index: "Index",
  next: "Next",
  scroll: "Scroll",
  progress: "Reading progress",
  nextStory: "Read the next story",
  menu: "Menu",
  top: "Top",
}

export const PALETTES = {
  dusk: {
    cloud: { shadow: "#4a1d1e", mid: "#8e5347", light: "#e4c0ad", rim: "#fbeee4" },
    marble: ["#3a140f", "#b86e4a", "#ffe7c9"],
    fresco: ["#1c0608", "#8a3728", "#f8d2ab"],
    frescoKeep: 0.58,
    ink: "#fbeee2",
    muted: "#e6c6b1",
    gold: "#e8b36c",
    ribbon: "#c9342c",
    ribbonDark: "#731a15",
    veil: "#2a0c0a",
    tones: {
      hero: { a: "#1f0709", b: "#521818", c: "#a4422c", sunX: 50, sunY: 118, sun: 0.8, banks: 0.9 },
      qa: { a: "#1c0708", b: "#3f1111", c: "#6a271b", sunX: 85, sunY: 100, sun: 0.3, banks: 0.45 },
      quote: { a: "#3d1210", b: "#8a3a24", c: "#e0a068", sunX: 50, sunY: 70, sun: 1, banks: 0.9 },
      next: { a: "#220a0b", b: "#5a1e19", c: "#b8603a", sunX: 50, sunY: 112, sun: 0.9, banks: 0.9 },
    },
  } as FitPalette,
  dawn: {
    cloud: { shadow: "#9a7865", mid: "#d5b9a4", light: "#f7e9da", rim: "#ffffff" },
    marble: ["#5a3b2c", "#c99a7a", "#fff4e6"],
    fresco: ["#4a2a22", "#c99a7c", "#fff4e8"],
    frescoKeep: 0.7,
    ink: "#2c1a14",
    muted: "#6b4b3c",
    gold: "#a8702f",
    ribbon: "#c9342c",
    ribbonDark: "#8a2219",
    veil: "#e9d3bf",
    tones: {
      hero: { a: "#8fa8be", b: "#d4c3b0", c: "#f3d8ba", sunX: 50, sunY: 112, sun: 0.9, banks: 1 },
      qa: { a: "#d9c7b4", b: "#ead9c6", c: "#f1e1cf", sunX: 85, sunY: 100, sun: 0.4, banks: 0.55 },
      quote: { a: "#9fb4c8", b: "#e2cdb5", c: "#ffd9ad", sunX: 50, sunY: 70, sun: 1, banks: 1 },
      next: { a: "#8aa4bc", b: "#d1bfaa", c: "#f0d5b6", sunX: 50, sunY: 110, sun: 0.9, banks: 1 },
    },
  } as FitPalette,
  nocturne: {
    cloud: { shadow: "#23264a", mid: "#5c5f8c", light: "#c9c6dc", rim: "#f6f1f2" },
    marble: ["#121428", "#6c6f99", "#f2ecf6"],
    fresco: ["#0c0e22", "#5a5a8c", "#f1e8f2"],
    frescoKeep: 0.3,
    ink: "#f1edf7",
    muted: "#c3bdd6",
    gold: "#e9c87a",
    ribbon: "#d5443a",
    ribbonDark: "#7c1f1a",
    veil: "#0b0d1c",
    tones: {
      hero: { a: "#0a0c1c", b: "#1f2446", c: "#5c4a7a", sunX: 50, sunY: 118, sun: 0.7, banks: 1 },
      qa: { a: "#080a17", b: "#141833", c: "#262a52", sunX: 85, sunY: 100, sun: 0.3, banks: 0.45 },
      quote: { a: "#0f1228", b: "#2b2f5c", c: "#8a6a8f", sunX: 50, sunY: 70, sun: 0.9, banks: 1 },
      next: { a: "#090b19", b: "#1b1f3f", c: "#4e4270", sunX: 50, sunY: 112, sun: 0.7, banks: 1 },
    },
  } as FitPalette,
}
// #endregion content

// #region logic
export function resolvePalette(p: FrescoInterviewTemplateProps["palette"], dark: boolean): FitPalette {
  if (p && typeof p === "object") return p
  if (!p || p === "auto") return dark ? PALETTES.dusk : PALETTES.dawn
  return (PALETTES as { [k: string]: FitPalette })[p] || PALETTES.dusk
}

export function sized(src: string, w: number) {
  if (!/^https:\/\/images\.unsplash\.com\/photo-/.test(src)) return src
  return src.split("?")[0] + "?auto=format&fit=max&q=80&w=" + Math.round(w)
}

export function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v
}

export function sstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

export function hexRgb(hex: string) {
  const h = hex.replace("#", "")
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0)
}

export function mixHex(a: string, b: string, t: number) {
  const x = hexRgb(a)
  const y = hexRgb(b)
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * clamp(t, 0, 1)).toString(16).padStart(2, "0")).join("")
}

/** `**bold**` and `_italic_` inside copy. */
export function richParts(text: string) {
  const out = [] as { text: string; kind: "plain" | "bold" | "italic" }[]
  const re = /(\*\*|_)(.+?)\1/g
  let last = 0
  let m = re.exec(text)
  while (m) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), kind: "plain" })
    out.push({ text: m[2], kind: m[1] === "**" ? "bold" : "italic" })
    last = m.index + m[0].length
    m = re.exec(text)
  }
  if (last < text.length) out.push({ text: text.slice(last), kind: "plain" })
  return out
}

export function plain(text: string) {
  return text.replace(/(\*\*|_)(.+?)\1/g, "$2")
}

/** Words of rich copy, each keeping its style, so they can rise one by one. */
export function richWords(text: string) {
  const out = [] as { text: string; kind: "plain" | "bold" | "italic" }[]
  for (const p of richParts(text)) {
    for (const w of p.text.split(/\s+/)) if (w) out.push({ text: w, kind: p.kind })
  }
  return out
}

/** Deterministic pseudo-random numbers, so every cloud holds still between renders. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Smooth value noise on a seeded 256 x 256 lattice. */
export function makeNoise(seed: number) {
  const r = rng(seed)
  const P = 256
  const lat = new Float32Array(P * P)
  for (let i = 0; i < P * P; i++) lat[i] = r()
  return (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = x - xi
    const fy = y - yi
    const u = fx * fx * (3 - 2 * fx)
    const v = fy * fy * (3 - 2 * fy)
    const x0 = xi & 255
    const x1 = (xi + 1) & 255
    const y0 = (yi & 255) * P
    const y1 = ((yi + 1) & 255) * P
    const a = lat[y0 + x0]
    const b = lat[y0 + x1]
    const c = lat[y1 + x0]
    const d = lat[y1 + x1]
    return a + (b - a) * u + ((c - a) + (a - b - c + d) * u) * v
  }
}

export function fbm(n: (x: number, y: number) => number, x: number, y: number, oct: number) {
  let s = 0
  let a = 0.5
  let f = 1
  let norm = 0
  for (let i = 0; i < oct; i++) {
    s += a * n(x * f, y * f)
    norm += a
    a *= 0.5
    f *= 2.03
    x += 3.1
    y += 7.7
  }
  return s / norm
}

/** Separable box blur of a float field. */
export function blurField(src: Float32Array, W: number, H: number, rad: number) {
  const tmp = new Float32Array(W * H)
  const out = new Float32Array(W * H)
  const k = 2 * rad + 1
  for (let y = 0; y < H; y++) {
    let s = 0
    for (let x = -rad; x <= rad; x++) s += src[y * W + clamp(x, 0, W - 1)]
    for (let x = 0; x < W; x++) {
      tmp[y * W + x] = s / k
      s += src[y * W + clamp(x + rad + 1, 0, W - 1)] - src[y * W + clamp(x - rad, 0, W - 1)]
    }
  }
  for (let x = 0; x < W; x++) {
    let s = 0
    for (let y = -rad; y <= rad; y++) s += tmp[clamp(y, 0, H - 1) * W + x]
    for (let y = 0; y < H; y++) {
      out[y * W + x] = s / k
      s += tmp[clamp(y + rad + 1, 0, H - 1) * W + x] - tmp[clamp(y - rad, 0, H - 1) * W + x]
    }
  }
  return out
}

/** The puffs of one bank: primaries along a spine, lobes on their crowns, a skirt and a body. */
export function cloudPuffs(W: number, H: number, seed: number) {
  const r = rng(seed)
  const puffs = [] as number[][]
  const sil = (t: number) => Math.pow(clamp(Math.min(t, 1 - t) * 2.6, 0, 1), 0.55)
  const add = (x: number, y: number, rad: number, ry?: number, wgt?: number) => {
    rad = Math.min(rad, H * 0.42)
    const ryy = ry == null ? rad * 0.92 : ry
    x = clamp(x, rad * 1.05, W - rad * 1.05)
    y = clamp(y, ryy * 1.05, H - ryy * 0.9)
    puffs.push([x, y, rad, ryy, wgt == null ? 1 : wgt])
  }
  const heap = seed % 3 === 0
  const count = heap ? 2 + Math.floor(r() * 2) : Math.max(3, Math.round(W / (H * 0.5)))
  const wave = r() * 6.28
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    const h = sil(t)
    const cx = W * (0.08 + 0.84 * t) + (r() - 0.5) * W * 0.06
    const rad = H * ((heap ? 0.2 : 0.17) + (heap ? 0.26 : 0.2) * h * (0.6 + 0.7 * r()))
    const cy = H * (0.62 - (heap ? 0.2 : 0.12) * h + 0.07 * Math.sin(t * 5.5 + wave)) + (r() - 0.5) * H * 0.06
    add(cx, cy, rad, heap ? rad * 1.08 : undefined)
    const k = 3 + Math.floor(r() * 3)
    for (let j = 0; j < k; j++) {
      const ang = -Math.PI * (0.08 + 0.84 * r())
      const rr = rad * (0.46 + 0.24 * r())
      add(cx + Math.cos(ang) * rad * 0.62, cy + Math.sin(ang) * rad * 0.66, rr)
    }
    const m = 1 + Math.floor(r() * 2)
    for (let j = 0; j < m; j++) {
      const ang = -Math.PI * (0.15 + 0.7 * r())
      const rr = rad * (0.24 + 0.12 * r())
      add(cx + Math.cos(ang) * rad * 0.74, cy + Math.sin(ang) * rad * 0.82, rr)
    }
  }
  const skirt = Math.max(4, Math.round(W / (H * 0.16)))
  for (let i = 0; i < skirt; i++) {
    const t = (i + 0.5) / skirt
    const h = sil(t)
    add(W * (0.1 + 0.8 * t), H * 0.74 + (r() - 0.5) * H * 0.04, H * (0.14 + 0.07 * r()) * (0.6 + 0.5 * h))
  }
  puffs.push([W / 2, H * 0.68, W * 0.42, H * 0.2, 0.7])
  return puffs
}

/**
 * Paint one bank of cloud into an RGBA buffer: a warped puff field gives the
 * silhouette, a blurred copy of it gives the volume, light from above lights
 * the crowns and leaves the bellies in shadow, and a cream rim catches the
 * sun on the thin edges.
 */
export function paintCloudPixels(W: number, H: number, seed: number, pal: FitCloudColors, opt?: { relief?: number; soft?: number; fluff?: number; grain?: number; light?: number[] }) {
  const o = opt || {}
  const n = makeNoise(seed * 7 + 1)
  const sh = hexRgb(pal.shadow)
  const md = hexRgb(pal.mid)
  const lt = hexRgb(pal.light)
  const rm = hexRgb(pal.rim)
  const puffs = cloudPuffs(W, H, seed)
  const D = new Float32Array(W * H)
  const sc = 1 / (H * 0.3)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const wx = fbm(n, x * sc + 11, y * sc + 5, 2) - 0.5
      const wy = fbm(n, x * sc + 40, y * sc + 90, 2) - 0.5
      const px = x + wx * H * 0.08
      const py = y + wy * H * 0.08
      let f = 0
      for (let i = 0; i < puffs.length; i++) {
        const p = puffs[i]
        const dx = (px - p[0]) / p[2]
        const dy = (py - p[1]) / p[3]
        const q = 1 - (dx * dx + dy * dy)
        if (q > 0) f += q * q * p[4]
      }
      const tex = fbm(n, x * sc * 1.2 + 7, y * sc * 1.2 + 3, 4)
      D[y * W + x] = f * (0.75 + 0.5 * tex) - 0.3
    }
  }
  const Ds0 = blurField(D, W, H, Math.max(1, Math.round(H * (o.soft == null ? 0.02 : o.soft))))
  const fl1 = 1 / (H * 0.2)
  const fluff = o.fluff == null ? 0.1 : o.fluff
  const Ds = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      Ds[i] = Ds0[i] + (fbm(n, x * fl1 + 55, y * fl1 + 21, 3) - 0.5) * fluff * sstep(0, 0.3, Ds0[i])
    }
  }
  const out = new Uint8ClampedArray(W * H * 4)
  const L = o.light || [-0.45, -0.85, 0.4]
  const ll = Math.hypot(L[0], L[1], L[2]) || 1
  const lx = L[0] / ll
  const ly = L[1] / ll
  const lz = L[2] / ll
  const k = ((o.relief == null ? 38 : o.relief) * H) / 256
  const fine = 1 / (H * 0.06)
  const grain = o.grain == null ? 0.1 : o.grain
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const v = D[i]
      let a = sstep(0, 0.4, v)
      if (a <= 0.003) continue
      const vs = Ds[i]
      const x0 = x > 0 ? Ds[i - 1] : vs
      const x1 = x < W - 1 ? Ds[i + 1] : vs
      const y0 = y > 0 ? Ds[i - W] : vs
      const y1 = y < H - 1 ? Ds[i + W] : vs
      let nx = -(x1 - x0) * k
      let ny = -(y1 - y0) * k
      let nz = 1
      const nl = Math.hypot(nx, ny, nz)
      nx /= nl
      ny /= nl
      nz /= nl
      const lam = clamp(nx * lx + ny * ly + nz * lz, -1, 1)
      const s = clamp(0.5 + lam * 0.75, 0, 1)
      const dense = sstep(0.2, 1.3, Ds0[i])
      const fl = fbm(n, x * fine + 99, y * fine + 13, 4)
      let cr = md[0] + (sh[0] - md[0]) * dense * 0.5
      let cg = md[1] + (sh[1] - md[1]) * dense * 0.5
      let cb = md[2] + (sh[2] - md[2]) * dense * 0.5
      const sh2 = Math.pow(1 - s, 1.35) * 0.82
      cr += (sh[0] - cr) * sh2
      cg += (sh[1] - cg) * sh2
      cb += (sh[2] - cb) * sh2
      const hi = Math.pow(s, 1.6) * 0.88
      cr += (lt[0] - cr) * hi
      cg += (lt[1] - cg) * hi
      cb += (lt[2] - cb) * hi
      const crown = sstep(0.72, 1, s) * 0.8 * (1 - dense * 0.5)
      cr += (rm[0] - cr) * crown
      cg += (rm[1] - cg) * crown
      cb += (rm[2] - cb) * crown
      const edge = sstep(0.75, 0, a) * Math.pow(s, 1.1) * 0.95
      cr += (rm[0] - cr) * edge
      cg += (rm[1] - cg) * edge
      cb += (rm[2] - cb) * edge
      const bottom = sstep(0.5, 1, y / H) * 0.3 * (0.4 + 0.6 * dense)
      cr += (sh[0] - cr) * bottom
      cg += (sh[1] - cg) * bottom
      cb += (sh[2] - cb) * bottom
      a *= 1 - sstep(0.84, 1, y / H) * 0.6
      const g = 1 + (fl - 0.5) * grain
      out[i * 4] = clamp(cr * g, 0, 255)
      out[i * 4 + 1] = clamp(cg * g, 0, 255)
      out[i * 4 + 2] = clamp(cb * g, 0, 255)
      out[i * 4 + 3] = 255 * a
    }
  }
  return out
}

/** Map luminance through a three-stop ramp, keeping some of the photo's own colour. */
export function gradePixels(d: Uint8ClampedArray, W: number, H: number, ramp: [string, string, string], keep: number, gamma = 1) {
  const sh = hexRgb(ramp[0])
  const md = hexRgb(ramp[1])
  const lt = hexRgb(ramp[2])
  for (let i = 0; i < W * H; i++) {
    const r = d[i * 4]
    const g = d[i * 4 + 1]
    const b = d[i * 4 + 2]
    let L = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    if (gamma !== 1) L = Math.pow(L, gamma)
    let cr: number
    let cg: number
    let cb: number
    if (L < 0.5) {
      const t = L * 2
      cr = sh[0] + (md[0] - sh[0]) * t
      cg = sh[1] + (md[1] - sh[1]) * t
      cb = sh[2] + (md[2] - sh[2]) * t
    } else {
      const t = (L - 0.5) * 2
      cr = md[0] + (lt[0] - md[0]) * t
      cg = md[1] + (lt[1] - md[1]) * t
      cb = md[2] + (lt[2] - md[2]) * t
    }
    d[i * 4] = cr + (r - cr) * keep
    d[i * 4 + 1] = cg + (g - cg) * keep
    d[i * 4 + 2] = cb + (b - cb) * keep
  }
}

/**
 * Lift a photographed figure off its background, in place, and grade it to
 * the fresco: `edges` reads the background colour off the left and right
 * edges of every row (so gradient skies key cleanly), `luma` keeps the light
 * and drops the dark. Luminance is then mapped through the marble ramp, with
 * a little of the photo's own colour kept for the stone.
 */
export function keyPixels(d: Uint8ClampedArray, W: number, H: number, o: { mode: "edges" | "luma" | "none"; range?: [number, number]; fade?: number; ramp: [string, string, string]; keep?: number }) {
  const lo = o.range ? o.range[0] : o.mode === "luma" ? 0.12 : 0.07
  const hi = o.range ? o.range[1] : o.mode === "luma" ? 0.4 : 0.2
  const A = new Float32Array(W * H)
  const dist = (a: number[], b: number[]) => Math.sqrt(((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / 3) / 255
  if (o.mode === "edges") {
    const m = Math.max(2, Math.round(W * 0.012))
    const keyL = new Float32Array(H * 3)
    const keyR = new Float32Array(H * 3)
    for (let y = 0; y < H; y++) {
      const l = [0, 0, 0]
      const r = [0, 0, 0]
      for (let x = 0; x < m; x++) {
        for (let k = 0; k < 3; k++) {
          l[k] += d[(y * W + x) * 4 + k]
          r[k] += d[(y * W + W - 1 - x) * 4 + k]
        }
      }
      for (let k = 0; k < 3; k++) {
        keyL[y * 3 + k] = l[k] / m
        keyR[y * 3 + k] = r[k] / m
      }
    }
    let ref = [0, 0, 0]
    const top = Math.max(2, Math.round(H * 0.01))
    let cnt = 0
    for (let y = 0; y < top; y++) {
      for (let x = 0; x < W; x++) {
        for (let k = 0; k < 3; k++) ref[k] += d[(y * W + x) * 4 + k]
        cnt++
      }
    }
    ref = ref.map((v) => v / cnt)
    // per row: both edges when both look like background (so a sideways gradient keys too), else the one that does
    const kl = new Float32Array(H * 3)
    const kr = new Float32Array(H * 3)
    for (let y = 0; y < H; y++) {
      const l = [keyL[y * 3], keyL[y * 3 + 1], keyL[y * 3 + 2]]
      const r = [keyR[y * 3], keyR[y * 3 + 1], keyR[y * 3 + 2]]
      const dl = dist(l, ref)
      const dr = dist(r, ref)
      const okL = dl < 0.22
      const okR = dr < 0.22
      const a = okL ? l : okR ? r : ref
      const b = okR ? r : okL ? l : ref
      for (let q = 0; q < 3; q++) {
        kl[y * 3 + q] = a[q]
        kr[y * 3 + q] = b[q]
      }
    }
    const rad = Math.round(H * 0.03)
    const sl = new Float32Array(H * 3)
    const sr = new Float32Array(H * 3)
    for (let y = 0; y < H; y++) {
      const s = [0, 0, 0, 0, 0, 0]
      let nn = 0
      for (let j = -rad; j <= rad; j++) {
        const yy = clamp(y + j, 0, H - 1)
        for (let q = 0; q < 3; q++) {
          s[q] += kl[yy * 3 + q]
          s[q + 3] += kr[yy * 3 + q]
        }
        nn++
      }
      for (let q = 0; q < 3; q++) {
        sl[y * 3 + q] = s[q] / nn
        sr[y * 3 + q] = s[q + 3] / nn
      }
    }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        const t = x / (W - 1)
        const p = [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]
        const k = [sl[y * 3] + (sr[y * 3] - sl[y * 3]) * t, sl[y * 3 + 1] + (sr[y * 3 + 1] - sl[y * 3 + 1]) * t, sl[y * 3 + 2] + (sr[y * 3 + 2] - sl[y * 3 + 2]) * t]
        const lp = (p[0] + p[1] + p[2]) / 3 + 1
        const lk = (k[0] + k[1] + k[2]) / 3 + 1
        let dc = 0
        for (let q = 0; q < 3; q++) {
          const e = p[q] / lp - k[q] / lk
          dc += e * e
        }
        dc = Math.sqrt(dc / 3)
        A[i] = sstep(lo, hi, dist(p, k) * 0.7 + dc * 0.9)
      }
    }
  } else if (o.mode === "luma") {
    for (let i = 0; i < W * H; i++) {
      const L = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255
      A[i] = sstep(lo, hi, L)
    }
  } else {
    // a soft oval
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = (x / W - 0.5) * 2
        const dy = (y / H - 0.5) * 2
        A[y * W + x] = 1 - sstep(0.55, 1, Math.hypot(dx, dy))
      }
    }
  }
  // erode a pixel, then soften, so the edge reads as a brush edge rather than a cut
  const B = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let mn = 1
      for (let j = -1; j <= 1; j++) for (let i2 = -1; i2 <= 1; i2++) mn = Math.min(mn, A[clamp(y + j, 0, H - 1) * W + clamp(x + i2, 0, W - 1)])
      B[y * W + x] = mn
    }
  }
  const sh = hexRgb(o.ramp[0])
  const md = hexRgb(o.ramp[1])
  const lt = hexRgb(o.ramp[2])
  const keep = o.keep == null ? 0.25 : o.keep
  const fade = o.fade || 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      let s = 0
      for (let j = -1; j <= 1; j++) for (let i2 = -1; i2 <= 1; i2++) s += B[clamp(y + j, 0, H - 1) * W + clamp(x + i2, 0, W - 1)]
      let a = s / 9
      if (fade > 0) a *= 1 - sstep(1 - fade, 1, y / H)
      const r = d[i * 4]
      const g = d[i * 4 + 1]
      const b = d[i * 4 + 2]
      const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      let cr: number
      let cg: number
      let cb: number
      if (L < 0.5) {
        const t = L * 2
        cr = sh[0] + (md[0] - sh[0]) * t
        cg = sh[1] + (md[1] - sh[1]) * t
        cb = sh[2] + (md[2] - sh[2]) * t
      } else {
        const t = (L - 0.5) * 2
        cr = md[0] + (lt[0] - md[0]) * t
        cg = md[1] + (lt[1] - md[1]) * t
        cb = md[2] + (lt[2] - md[2]) * t
      }
      const kp = keep * sstep(0.45, 1, a)
      d[i * 4] = cr + (r - cr) * kp
      d[i * 4 + 1] = cg + (g - cg) * kp
      d[i * 4 + 2] = cb + (b - cb) * kp
      d[i * 4 + 3] = Math.round(a * 255)
    }
  }
}

/**
 * A twisting ribbon through a box: a wavy centreline with a twist along it,
 * returned as one closed shape (its two edges) plus gradient stops that shade
 * the silk by how much each part faces the light, and a highlight along the
 * top edge. `progress` draws it in from the left; `time` makes it wave.
 */
export function ribbonPaths(W: number, H: number, time: number, progress: number, width: number, stops = RIB_STOPS) {
  const N = 96
  const top = [] as number[][]
  const bot = [] as number[][]
  const lit = [] as number[]
  const pt = (t: number) => [W * (-0.06 + 1.12 * t), H * (0.5 + 0.13 * Math.sin(t * 6.283 * 1.35 + time * 0.55) + 0.05 * Math.sin(t * 6.283 * 0.45 - time * 0.3 + 1.7))]
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const p = pt(t)
    const q = pt(Math.min(1, t + 0.002))
    let tx = q[0] - p[0]
    let ty = q[1] - p[1]
    const tl = Math.hypot(tx, ty) || 1
    tx /= tl
    ty /= tl
    const theta = t * 6.283 * 1.3 + time * 0.8 + 0.6
    const c = Math.cos(theta)
    const hw = width * (0.07 + 0.93 * Math.abs(c))
    top.push([p[0] - ty * hw, p[1] + tx * hw])
    bot.push([p[0] + ty * hw, p[1] - tx * hw])
    // the face turned up is lit; the back is in shadow; both darken into the twist
    lit.push(c >= 0 ? 0.5 + 0.5 * Math.pow(c, 0.7) : 0.3 - 0.22 * Math.pow(-c, 0.7))
  }
  const shown = Math.round(clamp(progress, 0, 1) * N)
  const f = (v: number[]) => v[0].toFixed(1) + " " + v[1].toFixed(1)
  let shape = ""
  let edge = ""
  if (shown > 0) {
    shape = "M" + f(top[0])
    for (let i = 1; i <= shown; i++) shape += " L" + f(top[i])
    for (let i = shown; i >= 0; i--) shape += " L" + f(bot[i])
    shape += " Z"
    edge = "M" + f(top[0])
    for (let i = 1; i <= shown; i++) edge += " L" + f(top[i])
  }
  const grad = [] as { offset: number; lit: number }[]
  for (let k = 0; k < stops; k++) {
    const i = Math.round((k / (stops - 1)) * N)
    grad.push({ offset: clamp(top[i][0] / W, 0, 1), lit: lit[i] })
  }
  return { shape, edge, stops: grad, x0: top[0][0], x1: top[N][0] }
}

export const RIB_STOPS = 33

/** A scallop shell as SVG paths: the fan, its ridges and the nacre lip, hinged at the bottom centre. */
export function shellPaths(cx: number, cy: number, r: number, scallops: number, spanDeg: number) {
  const a0 = -Math.PI / 2 - (spanDeg * Math.PI) / 360
  const a1 = -Math.PI / 2 + (spanDeg * Math.PI) / 360
  const f = (x: number, y: number) => x.toFixed(1) + " " + y.toFixed(1)
  const at = (ang: number, rad: number) => [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]
  let fan = "M" + f(cx, cy)
  let ridges = ""
  const valleys = [] as number[]
  for (let i = 0; i <= scallops; i++) {
    const ang = a0 + ((a1 - a0) * i) / scallops
    valleys.push(ang)
    const p = at(ang, r * 0.94)
    if (i === 0) fan += " L" + f(p[0], p[1])
    else {
      const mid = a0 + ((a1 - a0) * (i - 0.5)) / scallops
      const c = at(mid, r * 1.06)
      fan += " Q" + f(c[0], c[1]) + " " + f(p[0], p[1])
    }
  }
  fan += " Z"
  for (let i = 1; i < scallops; i++) {
    const p = at(valleys[i], r * 0.94)
    const c = at(valleys[i] + (valleys[i] - (a0 + a1) / 2) * 0.12, r * 0.5)
    ridges += "M" + f(cx, cy) + " Q" + f(c[0], c[1]) + " " + f(p[0], p[1])
  }
  let lip = "M" + f(cx, cy)
  for (let i = 0; i <= scallops; i++) {
    const ang = a0 + ((a1 - a0) * i) / scallops
    const p = at(ang, r * 0.76)
    if (i === 0) lip += " L" + f(p[0], p[1])
    else {
      const mid = a0 + ((a1 - a0) * (i - 0.5)) / scallops
      const c = at(mid, r * 0.86)
      lip += " Q" + f(c[0], c[1]) + " " + f(p[0], p[1])
    }
  }
  lip += " Z"
  return { fan, ridges, lip }
}

/** The position of a sky bank for a scroll offset: it wraps once it has left the top. */
export function wrapY(base: number, speed: number, scrolled: number, stage: number, bankH: number) {
  const R = stage + bankH
  const y = base - scrolled * speed
  return ((((y + bankH) % R) + R) % R) - bankH
}

export const SKY_BANKS = [
  { seed: 3, left: 4, width: 38, base: 0.02, speed: 0.09, alpha: 0.5 },
  { seed: 11, left: 52, width: 46, base: 0.3, speed: 0.16, alpha: 0.62 },
  { seed: 19, left: -10, width: 64, base: 0.58, speed: 0.26, alpha: 0.8 },
  { seed: 23, left: 46, width: 58, base: 0.96, speed: 0.4, alpha: 0.9 },
  { seed: 31, left: -14, width: 84, base: 1.34, speed: 0.56, alpha: 0.92 },
]
// #endregion logic

/* ------------------------------------------------------------------ */
/* Hooks and helpers                                                   */
/* ------------------------------------------------------------------ */

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function prefersReduced() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
}

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

function useDark(pref: "system" | "light" | "dark") {
  const [dark, setDark] = React.useState(pref === "dark")
  useIsoLayoutEffect(() => {
    if (pref !== "system") return setDark(pref === "dark")
    const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null
    const read = () => {
      const el = document.documentElement
      if (el.classList.contains("dark")) return setDark(true)
      if (el.classList.contains("light")) return setDark(false)
      setDark(!!(mq && mq.matches))
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    if (mq) mq.addEventListener("change", read)
    return () => {
      mo.disconnect()
      if (mq) mq.removeEventListener("change", read)
    }
  }, [pref])
  return dark
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

function scrollToEl(scroller: HTMLElement | Window, el: HTMLElement, extra: number, smooth: boolean) {
  const behavior = smooth ? "smooth" : "auto"
  if (scroller === window) {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + extra, behavior })
  } else {
    const s = scroller as HTMLElement
    s.scrollTo({ top: s.scrollTop + el.getBoundingClientRect().top - s.getBoundingClientRect().top + extra, behavior })
  }
}

/* Painted banks are shared between every instance and theme, and painted one
   or two per frame so the page never stalls while the sky fills in. */
const CLOUD_CACHE = {} as { [k: string]: Uint8ClampedArray }
let cloudQueue = [] as { pr: number; run: () => void }[]
let cloudPump = 0
function pumpClouds() {
  cloudPump = 0
  const start = performance.now()
  while (cloudQueue.length && performance.now() - start < 18) {
    const job = cloudQueue.shift()
    if (job) job.run()
  }
  if (cloudQueue.length) cloudPump = requestAnimationFrame(pumpClouds)
}
function scheduleCloud(pr: number, run: () => void) {
  cloudQueue.push({ pr, run })
  cloudQueue.sort((a, b) => a.pr - b.pr)
  if (!cloudPump) cloudPump = requestAnimationFrame(pumpClouds)
  return () => {
    cloudQueue = cloudQueue.filter((j) => j.run !== run)
  }
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function CloudBank(props: { seed: number; pal: FitCloudColors; res?: number; priority?: number; className?: string; style?: React.CSSProperties }) {
  const { seed, pal, res = 560, priority = 5, className, style } = props
  const ref = React.useRef(null as HTMLCanvasElement | null)
  const key = seed + "|" + pal.shadow + pal.mid + pal.light + pal.rim + "|" + res
  useIsoLayoutEffect(() => {
    const c = ref.current
    if (!c) return
    const W = res
    const H = Math.round(res / 2)
    const draw = () => {
      let buf = CLOUD_CACHE[key]
      if (!buf) buf = CLOUD_CACHE[key] = paintCloudPixels(W, H, seed, pal)
      c.width = W
      c.height = H
      const g = c.getContext("2d")
      if (!g) return
      const im = g.createImageData(W, H)
      im.data.set(buf)
      g.putImageData(im, 0, 0)
      c.dataset.ready = "1"
    }
    if (CLOUD_CACHE[key]) {
      draw()
      return
    }
    return scheduleCloud(priority, draw)
  }, [key])
  return <canvas ref={ref} className={"fit-cloud" + (className ? " " + className : "")} style={style} width={res} height={Math.round(res / 2)} aria-hidden="true" />
}

/**
 * A photographed figure, keyed and graded on a canvas. Hosts that refuse CORS
 * taint the canvas, so the photo then shows plain inside a soft oval instead;
 * a photo that never arrives leaves the sky alone.
 */
function Figure(props: { fig: FitFigure; ramp: [string, string, string]; className?: string; style?: React.CSSProperties; priority?: number }) {
  const { fig, ramp, className, style } = props
  const ref = React.useRef(null as HTMLCanvasElement | null)
  const [state, setState] = React.useState("loading" as "loading" | "ready" | "plain" | "failed")
  const [cors, setCors] = React.useState(true)
  const rampKey = ramp.join()
  React.useEffect(() => {
    let live = true
    setState("loading")
    const img = new Image()
    if (cors) img.crossOrigin = "anonymous"
    img.decoding = "async"
    img.onload = () => {
      if (!live) return
      const c = ref.current
      if (!c) return
      const crop = fig.crop || [0, 0, 1, 1]
      const sx = Math.round(img.naturalWidth * crop[0])
      const sy = Math.round(img.naturalHeight * crop[1])
      const sw = Math.max(1, Math.round(img.naturalWidth * crop[2]))
      const shh = Math.max(1, Math.round(img.naturalHeight * crop[3]))
      const scale = Math.min(1, 900 / Math.max(sw, shh))
      const W = Math.max(1, Math.round(sw * scale))
      const H = Math.max(1, Math.round(shh * scale))
      c.width = W
      c.height = H
      const g = c.getContext("2d", { willReadFrequently: true })
      if (!g) return setState("failed")
      g.drawImage(img, sx, sy, sw, shh, 0, 0, W, H)
      let im: ImageData | null = null
      try {
        im = g.getImageData(0, 0, W, H)
      } catch {
        im = null // a host without CORS taints the canvas
      }
      if (!im) return setState("plain")
      keyPixels(im.data, W, H, { mode: fig.key || "edges", range: fig.range, fade: fig.fade, ramp, keep: fig.keep })
      g.putImageData(im, 0, 0)
      setState("ready")
    }
    img.onerror = () => {
      if (!live) return
      if (cors) setCors(false)
      else setState("failed")
    }
    img.src = sized(fig.src, 1200)
    return () => {
      live = false
    }
  }, [fig.src, fig.key, fig.crop && fig.crop.join(), fig.range && fig.range.join(), fig.fade, fig.keep, rampKey, cors])
  const depth = fig.depth == null ? 0.3 : fig.depth
  return (
    <div
      className={"fit-fig" + (className ? " " + className : "")}
      data-depth={depth}
      data-state={state}
      style={{ left: fig.x + "%", top: fig.y + "%", "--fit-w": fig.w + "%", "--fit-drift": (fig.drift == null ? 8 : fig.drift) + "px", "--fit-rot": (fig.rotate || 0) + "deg", "--fit-flip": fig.flip ? -1 : 1, ...style } as React.CSSProperties}
    >
      <div className="fit-fig-in">
        <div className="fit-fig-rot">
          <div className="fit-fig-float">
            <canvas ref={ref} className="fit-fig-canvas" role={fig.alt ? "img" : undefined} aria-label={fig.alt} aria-hidden={fig.alt ? undefined : true} style={{ display: state === "plain" ? "none" : undefined }} />
            {state === "plain" && <img className="fit-fig-img" src={sized(fig.src, 1200)} alt={fig.alt || ""} style={{ maxWidth: "none" }} />}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * A painting behind a stage: a fresco photograph, cropped, graded through the
 * palette's ramp and dissolved into the sky at its edges. A host without CORS
 * shows it plain with a CSS grade instead.
 */
function Backdrop(props: { bd: FitBackdrop; ramp: [string, string, string]; keep: number; className?: string }) {
  const { bd, ramp, keep, className } = props
  const ref = React.useRef(null as HTMLCanvasElement | null)
  const [state, setState] = React.useState("loading" as "loading" | "ready" | "plain" | "failed")
  const [cors, setCors] = React.useState(true)
  const rampKey = ramp.join()
  const k = bd.keep == null ? keep : bd.keep
  React.useEffect(() => {
    let live = true
    setState("loading")
    const img = new Image()
    if (cors) img.crossOrigin = "anonymous"
    img.decoding = "async"
    img.onload = () => {
      if (!live) return
      const c = ref.current
      if (!c) return
      const crop = bd.crop || [0, 0, 1, 1]
      const sx = Math.round(img.naturalWidth * crop[0])
      const sy = Math.round(img.naturalHeight * crop[1])
      const sw = Math.max(1, Math.round(img.naturalWidth * crop[2]))
      const shh = Math.max(1, Math.round(img.naturalHeight * crop[3]))
      const scale = Math.min(1, 1600 / Math.max(sw, shh))
      const W = Math.max(1, Math.round(sw * scale))
      const H = Math.max(1, Math.round(shh * scale))
      c.width = W
      c.height = H
      const g = c.getContext("2d", { willReadFrequently: true })
      if (!g) return setState("failed")
      g.drawImage(img, sx, sy, sw, shh, 0, 0, W, H)
      let im: ImageData | null = null
      try {
        im = g.getImageData(0, 0, W, H)
      } catch {
        im = null // a host without CORS taints the canvas
      }
      if (!im) return setState("plain")
      gradePixels(im.data, W, H, ramp, k, bd.gamma || 1)
      g.putImageData(im, 0, 0)
      setState("ready")
    }
    img.onerror = () => {
      if (!live) return
      if (cors) setCors(false)
      else setState("failed")
    }
    img.src = sized(bd.src, 1800)
    return () => {
      live = false
    }
  }, [bd.src, bd.crop && bd.crop.join(), bd.gamma, k, rampKey, cors])
  return (
    <div className={"fit-bd" + (className ? " " + className : "")} data-state={state} data-mask={bd.mask || "stage"} style={{ opacity: bd.opacity == null ? 1 : bd.opacity }} aria-hidden="true">
      <canvas ref={ref} className="fit-bd-canvas" style={{ objectPosition: bd.focus, display: state === "plain" ? "none" : undefined }} />
      {state === "plain" && <img className="fit-bd-img" src={sized(bd.src, 1800)} alt="" style={{ maxWidth: "none", objectPosition: bd.focus }} />}
    </div>
  )
}

function Icon({ name }: { name: FitIconName }) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
      </svg>
    )
  }
  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 3h4.6l4.1 5.9L17.6 3H20l-6.2 7.4L21 21h-4.6l-4.5-6.4L6.4 21H4l6.8-8.1z" fill="currentColor" />
      </svg>
    )
  }
  if (name === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 9h3v11H5zM6.5 4a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM10 9h2.9v1.6c.5-.9 1.7-1.9 3.5-1.9 3.3 0 3.6 2.2 3.6 5V20h-3v-5.5c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V20H10z" fill="currentColor" />
      </svg>
    )
  }
  if (name === "youtube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg className="fit-arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Rich copy inline: bold sans and italic serif. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {richParts(text).map((p, i) => (p.kind === "bold" ? <strong key={i}>{p.text}</strong> : p.kind === "italic" ? <em key={i}>{p.text}</em> : <React.Fragment key={i}>{p.text}</React.Fragment>))}
    </>
  )
}

/** Rich copy as one span per word, so the words can rise one by one. */
function RichWords({ text }: { text: string }) {
  const words = richWords(text)
  return (
    <>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className={"fit-w fit-w-" + w.kind}>{w.text}</span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </>
  )
}

/** A pearl in an open shell: the treasure beside the first Q & A. */
function Pearl({ uid }: { uid: string }) {
  const ref = React.useRef(null as HTMLDivElement | null)
  const shell = React.useMemo(() => shellPaths(120, 152, 108, 9, 168), [])
  const lower = React.useMemo(() => shellPaths(120, 150, 100, 9, 150), [])
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType === "touch") return
    const r = el.getBoundingClientRect()
    const x = clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5)
    const y = clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5)
    el.style.setProperty("--fit-px", x.toFixed(3))
    el.style.setProperty("--fit-py", y.toFixed(3))
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty("--fit-px", "0")
    el.style.setProperty("--fit-py", "0")
  }
  return (
    <div ref={ref} className="fit-pearl-wrap" onPointerMove={onMove} onPointerLeave={onLeave} aria-hidden="true">
      <svg className="fit-shell" viewBox="0 0 240 190">
        <defs>
          <radialGradient id={uid + "-shell"} cx="50%" cy="82%" r="70%">
            <stop offset="0" stopColor="#fff6ea" />
            <stop offset="0.5" stopColor="#e4c3a6" />
            <stop offset="0.85" stopColor="#a66d4e" />
            <stop offset="1" stopColor="#5e3324" />
          </radialGradient>
          <radialGradient id={uid + "-shellin"} cx="50%" cy="90%" r="75%">
            <stop offset="0" stopColor="#fffaf3" />
            <stop offset="0.6" stopColor="#f3dcc8" stopOpacity="0.9" />
            <stop offset="1" stopColor="#d9a98c" stopOpacity="0.4" />
          </radialGradient>
          <linearGradient id={uid + "-shellow"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b57a58" />
            <stop offset="1" stopColor="#4a2418" />
          </linearGradient>
        </defs>
        <g transform="translate(0 6) scale(1 -0.34) translate(0 -440)">
          <path d={lower.fan} fill={"url(#" + uid + "-shellow)"} />
        </g>
        <path d={shell.fan} fill={"url(#" + uid + "-shell)"} />
        <path d={shell.ridges} fill="none" stroke="#6a3a28" strokeOpacity="0.3" strokeWidth="1.1" />
        <path d={shell.lip} fill={"url(#" + uid + "-shellin)"} opacity="0.9" />
      </svg>
      <div className="fit-pearl">
        <i className="fit-pearl-sheen" />
        <i className="fit-pearl-spot" />
      </div>
      <i className="fit-pearl-shadow" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const FIT_CSS = `
.fit-root{--fit-serif:"Playfair Display","Didot","Bodoni 72","Bodoni MT","Libre Bodoni",Georgia,"Times New Roman",serif;--fit-sans:"Helvetica Neue",Helvetica,Arial,"Inter",system-ui,sans-serif;--fit-head:68px;--fit-display:clamp(60px,15.5vw,236px);--fit-px:0;--fit-py:0;position:relative;min-height:var(--fit-h);background:var(--fit-sky-c);color:var(--fit-ink);font-family:var(--fit-sans);overflow-x:clip;isolation:isolate;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.fit-root :where(svg,canvas,img){display:block;max-width:none}
.fit-root :where(a){color:inherit;text-decoration:none}
.fit-root :where(a,button):focus-visible{outline:2px solid var(--fit-gold);outline-offset:4px;border-radius:2px}
.fit-root :where(p,h1,h2,h3){margin:0}
.fit-sky{position:sticky;top:0;height:var(--fit-h);margin-bottom:calc(var(--fit-h) * -1);z-index:0;overflow:hidden;pointer-events:none}
.fit-sky-grad{position:absolute;inset:0;background:linear-gradient(180deg,var(--fit-sky-a) 0%,var(--fit-sky-b) 52%,var(--fit-sky-c) 100%);transition:none}
.fit-sun{position:absolute;left:var(--fit-sun-x);top:var(--fit-sun-y);width:130vmax;height:130vmax;transform:translate(-50%,-50%);opacity:var(--fit-sun-a);background:radial-gradient(closest-side,color-mix(in srgb,var(--fit-glow) 62%,transparent),color-mix(in srgb,var(--fit-glow) 22%,transparent) 32%,transparent 68%)}
.fit-banks{position:absolute;inset:0;opacity:var(--fit-banks-a,1)}
.fit-bank{position:absolute;top:0;will-change:transform}
.fit-bank-drift{will-change:transform}
.fit-cloud{width:100%;height:auto;opacity:0;transition:opacity 1.1s ease;filter:blur(.7px)}
.fit-cloud[data-ready]{opacity:1}
.fit-grain{position:absolute;inset:0;width:100%;height:100%;opacity:.09;mix-blend-mode:soft-light;pointer-events:none}
.fit-page{position:relative;z-index:1}
.fit-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.fit-foot-alone{padding-top:40px}
.fit-head{position:sticky;top:0;z-index:40;height:var(--fit-head);margin-bottom:calc(var(--fit-head) * -1);display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 clamp(16px,3vw,40px);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;line-height:1.35}
.fit-head:before{content:"";position:absolute;inset:0 0 -48px;background:linear-gradient(180deg,color-mix(in srgb,var(--fit-veil) 82%,transparent),color-mix(in srgb,var(--fit-veil) 40%,transparent) 55%,transparent);pointer-events:none;z-index:-1;opacity:0;transition:opacity .5s}
.fit-root[data-scrolled="1"] .fit-head:before{opacity:1}
.fit-mark{display:flex;flex-direction:column;align-items:flex-start;gap:2px}
.fit-mark b{font-weight:700;letter-spacing:.2em}
.fit-mark small{font-size:9px;letter-spacing:.2em;opacity:.7}
.fit-head-mid{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;opacity:0;transition:opacity .5s,transform .5s;pointer-events:none;white-space:nowrap}
.fit-root[data-scrolled="1"] .fit-head-mid{opacity:1}
.fit-head-mid i{font-style:normal;color:var(--fit-gold);margin-right:10px}
.fit-head-nav{display:flex;gap:clamp(14px,2.4vw,30px);align-items:center}
.fit-link{position:relative;padding:6px 0;display:inline-flex;align-items:center;gap:8px}
.fit-link:after{content:"";position:absolute;left:0;right:0;bottom:2px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:right;transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.fit-link:hover:after,.fit-link:focus-visible:after{transform:scaleX(1);transform-origin:left}
.fit-arrow{width:12px;height:12px;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.fit-link:hover .fit-arrow{transform:translateX(3px)}
.fit-progress{position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--fit-gold);transform:scaleX(0);transform-origin:left;opacity:.9}
.fit-hero{position:relative;min-height:max(var(--fit-h),640px);display:grid;place-items:center;padding:calc(var(--fit-head) + 4vh) 16px 14vh}
.fit-stage{position:absolute;inset:0;pointer-events:none}
.fit-bd{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.fit-bd-canvas,.fit-bd-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;max-width:none;opacity:0;transition:opacity 1.6s ease}
.fit-bd[data-state="ready"] .fit-bd-canvas,.fit-bd[data-state="plain"] .fit-bd-img{opacity:1}
.fit-bd-img{filter:sepia(.55) saturate(.8) contrast(1.05) brightness(.85)}
.fit-bd[data-mask="hero"]{-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,.5),#000 24%,#000 66%,transparent 100%);mask-image:linear-gradient(180deg,rgba(0,0,0,.5),#000 24%,#000 66%,transparent 100%)}
.fit-bd[data-mask="stage"]{-webkit-mask-image:linear-gradient(180deg,transparent,#000 16%,#000 84%,transparent);mask-image:linear-gradient(180deg,transparent,#000 16%,#000 84%,transparent)}
.fit-hero-veil{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse 46% 40% at 50% 46%,color-mix(in srgb,var(--fit-veil) 42%,transparent),transparent 100%)}
.fit-quote-veil{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse 54% 44% at 50% 44%,color-mix(in srgb,var(--fit-veil) 58%,transparent),color-mix(in srgb,var(--fit-veil) 22%,transparent) 60%,transparent 100%)}
.fit-fig{position:absolute;width:var(--fit-w);pointer-events:none;will-change:transform}
.fit-fig-rot{transform:rotate(var(--fit-rot)) scaleX(var(--fit-flip))}
.fit-fig-float{animation:fit-float 7.5s ease-in-out infinite alternate}
.fit-fig-canvas,.fit-fig-img{width:100%;height:auto;opacity:0;transition:opacity 1.4s ease,transform 1.4s cubic-bezier(.2,.8,.2,1);transform:translateY(12px)}
.fit-fig[data-state="ready"] .fit-fig-canvas,.fit-fig[data-state="plain"] .fit-fig-img{opacity:1;transform:none}
.fit-fig-img{-webkit-mask-image:radial-gradient(ellipse 48% 46% at 50% 50%,#000 55%,transparent 100%);mask-image:radial-gradient(ellipse 48% 46% at 50% 50%,#000 55%,transparent 100%);filter:sepia(.5) saturate(.7) contrast(1.05)}
.fit-fig-s1{filter:drop-shadow(0 14px 30px color-mix(in srgb,var(--fit-veil) 55%,transparent))}
.fit-title{position:relative;z-index:2;text-align:center;text-transform:uppercase;line-height:.84;letter-spacing:.02em;color:var(--fit-ink);text-shadow:0 2px 40px color-mix(in srgb,var(--fit-veil) 40%,transparent)}
.fit-title span{display:block}
.fit-title-l1{font-family:var(--fit-serif);font-weight:400;font-size:var(--fit-display);letter-spacing:.08em;margin-left:.08em}
.fit-title-l2{font-family:var(--fit-sans);font-weight:800;font-size:calc(var(--fit-display) * 1.02);letter-spacing:-.025em;margin-top:-.02em}
.fit-kicker{display:inline-flex;align-items:center;gap:12px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--fit-gold);margin-bottom:clamp(16px,3vh,32px)}
.fit-kicker:before,.fit-kicker:after{content:"";width:28px;height:1px;background:currentColor;opacity:.8}
.fit-hero-copy{position:relative;z-index:2;text-align:center}
.fit-hero .fit-stage{z-index:1}
.fit-hero-front{position:absolute;left:-14%;right:-14%;bottom:-26%;height:34%;z-index:3;pointer-events:none;opacity:.94}
.fit-stage-front{position:absolute;inset:0;z-index:4;pointer-events:none}
.fit-hero-front .fit-bank{top:auto}
.fit-cue{position:absolute;left:50%;bottom:3.5vh;transform:translateX(-50%);z-index:4;display:flex;flex-direction:column;align-items:center;gap:10px;font-size:9.5px;letter-spacing:.3em;text-transform:uppercase;opacity:.8}
.fit-cue i{position:relative;width:1px;height:38px;background:color-mix(in srgb,var(--fit-ink) 35%,transparent);overflow:hidden}
.fit-cue i:after{content:"";position:absolute;left:0;top:-40%;width:1px;height:40%;background:var(--fit-ink);animation:fit-cue 1.9s cubic-bezier(.6,0,.3,1) infinite}
.fit-deck{position:relative;z-index:4;max-width:860px;margin:0 auto;padding:clamp(40px,10vh,120px) 20px clamp(56px,12vh,140px);text-align:center}
.fit-deck p{font-family:var(--fit-serif);font-weight:400;font-size:clamp(28px,4.3vw,58px);line-height:1.08;letter-spacing:-.01em;text-wrap:balance}
.fit-deck p strong,.fit-quote-text .fit-w-bold{font-family:var(--fit-sans);font-weight:800;letter-spacing:-.02em}
.fit-deck p em,.fit-quote-text .fit-w-italic{font-family:var(--fit-serif);font-style:italic;font-weight:400}
.fit-btn{display:inline-flex;align-items:center;gap:10px;margin-top:clamp(24px,5vh,44px);padding:14px 26px;border:1px solid color-mix(in srgb,var(--fit-ink) 70%,transparent);border-radius:999px;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;transition:background-color .35s,color .35s,border-color .35s,transform .35s cubic-bezier(.2,.8,.2,1)}
.fit-btn:hover{background:var(--fit-ink);color:var(--fit-sky-b);border-color:var(--fit-ink);transform:translateY(-2px)}
.fit-qa{position:relative;z-index:2;padding:clamp(40px,8vh,110px) clamp(16px,5vw,80px) clamp(40px,10vh,120px)}
.fit-qa-veil{position:absolute;inset:-6% 0;background:radial-gradient(ellipse 72% 58% at 50% 50%,color-mix(in srgb,var(--fit-veil) 74%,transparent),color-mix(in srgb,var(--fit-veil) 30%,transparent) 55%,transparent 80%);pointer-events:none;z-index:-1}
.fit-qa-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;max-width:1040px;margin:0 auto clamp(28px,6vh,64px)}
.fit-qa-title{font-family:var(--fit-serif);line-height:.8;display:inline-grid;grid-template-columns:auto auto;align-items:start;gap:0 .05em}
.fit-qa-title .fit-q1{font-size:clamp(72px,9vw,128px);font-weight:400;grid-row:1}
.fit-qa-title .fit-amp{font-family:var(--fit-sans);font-weight:800;font-size:clamp(24px,3vw,40px);align-self:end;margin-bottom:.35em}
.fit-qa-title .fit-q2{font-size:clamp(56px,7vw,100px);font-weight:400;grid-column:2;grid-row:2;margin-top:-.15em}
.fit-qa-orn{position:relative;width:clamp(150px,22vw,300px);flex:none}
.fit-qa-orn .fit-fig{position:relative;left:auto!important;top:auto!important;width:100%!important}
.fit-qa-grid{max-width:1040px;margin:0 auto;columns:2;column-gap:clamp(40px,7vw,110px)}
.fit-qa-item{break-inside:avoid;-webkit-column-break-inside:avoid;page-break-inside:avoid;margin:0 0 clamp(28px,4.5vh,52px);padding-top:16px;position:relative}
.fit-rule{position:absolute;left:0;top:0;width:34px;height:1px;background:var(--fit-gold);transform:scaleX(0);transform-origin:left}
.fit-q{font-family:var(--fit-sans);font-weight:700;font-size:11.5px;line-height:1.45;letter-spacing:.15em;text-transform:uppercase;margin:0 0 10px;color:var(--fit-ink)}
.fit-a{font-size:15.5px;line-height:1.62;color:var(--fit-muted);max-width:46ch}
.fit-quote{position:relative;z-index:2;height:calc(var(--fit-h) * 1.9)}
.fit-quote-stick{position:sticky;top:0;height:var(--fit-h);min-height:560px;display:grid;place-items:center;overflow:hidden;padding:calc(var(--fit-head) + 2vh) 20px 24vh}
.fit-ribbon{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
.fit-quote-text{position:relative;z-index:2;max-width:1000px;text-align:center;font-family:var(--fit-serif);font-size:clamp(30px,4.8vw,72px);line-height:1.04;letter-spacing:-.01em;text-wrap:balance;text-shadow:0 2px 30px color-mix(in srgb,var(--fit-veil) 45%,transparent)}
.fit-quote-text .fit-w{display:inline-block;will-change:transform,opacity}
.fit-cite{margin-top:clamp(18px,3vh,30px);font-family:var(--fit-sans);font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--fit-gold);display:flex;justify-content:center;align-items:center;gap:12px}
.fit-cite:before{content:"";width:28px;height:1px;background:currentColor}
.fit-quote-front{position:absolute;left:-14%;right:-14%;bottom:-24%;height:30%;z-index:3;pointer-events:none;opacity:.94}
.fit-quote-front .fit-bank{top:auto}
.fit-next{position:relative;z-index:2;min-height:max(var(--fit-h),640px);display:grid;grid-template-rows:1fr auto;overflow:hidden}
.fit-next-link{position:relative;display:grid;place-items:center;padding:calc(var(--fit-head) + 8vh) 20px 6vh;text-align:center;cursor:pointer}
.fit-next-label{position:relative;z-index:5;font-family:var(--fit-sans);font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--fit-gold);margin-bottom:clamp(14px,3vh,28px);display:inline-flex;align-items:center;gap:12px}
.fit-next-label:before{content:"";width:28px;height:1px;background:currentColor}
.fit-next-title{position:relative;z-index:2;text-transform:uppercase;line-height:.84;text-shadow:0 2px 40px color-mix(in srgb,var(--fit-veil) 45%,transparent)}
.fit-next-title span{display:block;clip-path:inset(0 -.4em -.04em -.4em);padding:0 .06em}
.fit-next-title span b{display:block;font-weight:inherit;transition:letter-spacing .7s cubic-bezier(.2,.8,.2,1)}
.fit-next-title .fit-nt1{font-family:var(--fit-serif);font-weight:400;font-size:calc(var(--fit-display) * .74);letter-spacing:.08em}
.fit-next-title .fit-nt2{font-family:var(--fit-sans);font-weight:800;font-size:calc(var(--fit-display) * .78);letter-spacing:-.02em}
.fit-next-link:hover .fit-nt1 b,.fit-next-link:focus-visible .fit-nt1 b{letter-spacing:.16em}
.fit-next-link:hover .fit-nt2 b,.fit-next-link:focus-visible .fit-nt2 b{letter-spacing:.02em}
.fit-next-blurb{position:relative;z-index:5;margin-top:clamp(16px,3vh,28px);font-family:var(--fit-serif);font-style:italic;font-size:clamp(16px,1.6vw,22px);line-height:1.4;max-width:34ch;color:var(--fit-ink);text-shadow:0 1px 2px color-mix(in srgb,var(--fit-veil) 70%,transparent),0 2px 26px color-mix(in srgb,var(--fit-veil) 85%,transparent)}
.fit-next-go{position:relative;z-index:5;margin-top:clamp(18px,3vh,30px);display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border:1px solid color-mix(in srgb,var(--fit-ink) 55%,transparent);border-radius:999px;background:color-mix(in srgb,var(--fit-veil) 55%,transparent);font-family:var(--fit-sans);font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;transition:background-color .35s,color .35s}
.fit-next-link:hover .fit-next-go,.fit-next-link:focus-visible .fit-next-go{background:var(--fit-ink);color:var(--fit-veil)}
.fit-next-stage{position:absolute;inset:0;z-index:1;pointer-events:none;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.fit-next-front{position:absolute;left:-14%;right:-14%;bottom:-20%;height:28%;opacity:.94;z-index:3;pointer-events:none;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.fit-next-stage-front{position:absolute;inset:0;z-index:4;pointer-events:none;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.fit-next-link:hover ~ .fit-next-stage-front,.fit-next-link:focus-visible ~ .fit-next-stage-front{transform:translateY(-4%)}
.fit-next-front .fit-bank{top:auto}
.fit-next-link:hover ~ .fit-next-front,.fit-next-link:focus-visible ~ .fit-next-front{transform:translateY(7%)}
.fit-next-link:hover ~ .fit-next-stage,.fit-next-link:focus-visible ~ .fit-next-stage{transform:translateY(-3%)}
.fit-foot{position:relative;z-index:5;display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:0 clamp(16px,3vw,40px) 22px;font-family:var(--fit-sans);font-size:10px;letter-spacing:.16em;text-transform:uppercase;line-height:1.4}
.fit-foot-l,.fit-foot-r{display:flex;align-items:center;gap:clamp(14px,2.4vw,28px)}
.fit-social{display:flex;gap:12px}
.fit-social a{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;transition:background-color .3s,transform .3s cubic-bezier(.2,.8,.2,1)}
.fit-social a:hover{background:color-mix(in srgb,var(--fit-ink) 14%,transparent);transform:translateY(-2px)}
.fit-social svg{width:15px;height:15px}
.fit-top{display:inline-flex;align-items:center;gap:8px;background:none;border:0;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;cursor:pointer;padding:6px 0}
.fit-top svg{width:12px;height:12px;transform:rotate(-90deg);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.fit-top:hover svg{transform:rotate(-90deg) translateX(3px)}
.fit-pearl-wrap{position:relative;width:100%;aspect-ratio:240/190;pointer-events:auto;perspective:600px}
.fit-shell{position:absolute;left:0;right:0;bottom:0;width:100%;height:auto;filter:drop-shadow(0 18px 24px color-mix(in srgb,var(--fit-veil) 55%,transparent))}
.fit-pearl{position:absolute;left:50%;bottom:34%;width:34%;aspect-ratio:1;border-radius:50%;transform:translate(-50%,0) translate(calc(var(--fit-px) * 10px),calc(var(--fit-py) * 8px));transition:transform .6s cubic-bezier(.2,.8,.2,1);background:radial-gradient(circle at 36% 30%,#fffdf9 0,#f6ebe6 22%,#dcc9c6 52%,#a58f93 78%,#6f5a5f 100%)}
.fit-pearl-sheen{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 210deg,rgba(255,170,190,.0),rgba(255,210,170,.45),rgba(190,230,255,.45),rgba(220,200,255,.35),rgba(255,170,190,.0));mix-blend-mode:soft-light;opacity:.9}
.fit-pearl-spot{position:absolute;left:calc(26% + var(--fit-px) * 14%);top:calc(16% + var(--fit-py) * 12%);width:24%;height:18%;border-radius:50%;background:radial-gradient(closest-side,#fff,rgba(255,255,255,0));transition:left .6s,top .6s;filter:blur(.5px)}
.fit-pearl:after{content:"";position:absolute;left:14%;right:14%;bottom:6%;height:22%;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--fit-glow) 55%,transparent),transparent);opacity:.8}
.fit-pearl-shadow{position:absolute;left:50%;bottom:31%;width:36%;height:9%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--fit-veil) 60%,transparent),transparent);filter:blur(4px)}
@keyframes fit-float{from{transform:translateY(calc(var(--fit-drift) * -1))}to{transform:translateY(var(--fit-drift))}}
@keyframes fit-cue{0%{top:-40%}60%{top:100%}100%{top:100%}}
@media (max-width:760px){
.fit-root{--fit-head:60px}
.fit-head{font-size:9.5px}
.fit-head-mid{display:none}
.fit-hero{padding-bottom:10vh}
.fit-qa-grid{columns:1}
.fit-stage .fit-fig,.fit-stage-front .fit-fig,.fit-next-stage .fit-fig,.fit-next-stage-front .fit-fig{width:calc(var(--fit-w) * 1.5)}
.fit-hero .fit-stage .fit-fig{width:calc(var(--fit-w) * 1.3)}
.fit-banks .fit-bank{min-width:560px}
.fit-hero-front .fit-bank,.fit-quote-front .fit-bank,.fit-next-front .fit-bank{min-width:150%}
.fit-hero-front .fit-bank + .fit-bank,.fit-quote-front .fit-bank + .fit-bank,.fit-next-front .fit-bank + .fit-bank{left:-20%!important}
.fit-hero{padding-bottom:16vh}
.fit-qa-head{flex-direction:column;align-items:flex-start}
.fit-qa-orn{width:min(60vw,240px);align-self:flex-end;margin-top:-10vh}
.fit-a{max-width:none}
.fit-foot{flex-direction:column;align-items:flex-start;gap:14px}
.fit-quote{height:calc(var(--fit-h) * 1.6)}
}
@media (hover:none){.fit-pearl{transition:none}}
.fit-root[data-motion="reduced"] .fit-fig-float{animation:none}
.fit-root[data-motion="reduced"] .fit-cue i:after{animation:none;top:0}
.fit-root[data-motion="reduced"] .fit-quote{height:auto}
.fit-root[data-motion="reduced"] .fit-quote-stick{position:relative}
.fit-root[data-motion="reduced"] .fit-rule{transform:none}
.fit-root[data-motion="reduced"] .fit-cloud,.fit-root[data-motion="reduced"] .fit-fig-canvas,.fit-root[data-motion="reduced"] .fit-fig-img{transition:none}
@media (prefers-reduced-motion:reduce){.fit-fig-float{animation:none}.fit-cue i:after{animation:none;top:0}}
`

/* ------------------------------------------------------------------ */
/* The template                                                        */
/* ------------------------------------------------------------------ */

export default function FrescoInterviewTemplate(props: FrescoInterviewTemplateProps) {
  const {
    series = DEFAULT_SERIES,
    story = DEFAULT_STORY,
    sections = DEFAULT_SECTIONS,
    quote = DEFAULT_QUOTE,
    next = DEFAULT_NEXT,
    social = DEFAULT_SOCIAL,
    legal = DEFAULT_LEGAL,
    labels: labelsIn,
    palette = "auto",
    theme = "system",
    seed = 1,
    onNext,
    height = "100svh",
    className,
  } = props
  const labels = { ...DEFAULT_LABELS, ...(labelsIn || {}) }
  const dark = useDark(theme)
  const reduced = useReducedMotion()
  const pal = resolvePalette(palette, dark)
  const uid = "fit" + React.useId().replace(/[^a-zA-Z0-9]/g, "")

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const skyRef = React.useRef(null as HTMLDivElement | null)
  const banksRef = React.useRef(null as HTMLDivElement | null)
  const progressRef = React.useRef(null as HTMLElement | null)
  const heroRef = React.useRef(null as HTMLElement | null)
  const quoteRef = React.useRef(null as HTMLElement | null)
  const stickRef = React.useRef(null as HTMLDivElement | null)
  const ribbonRef = React.useRef(null as SVGSVGElement | null)
  const ribShape = React.useRef(null as SVGPathElement | null)
  const ribGrad = React.useRef(null as SVGLinearGradientElement | null)
  const ribEdge = React.useRef(null as SVGPathElement | null)
  const nextRef = React.useRef(null as HTMLElement | null)
  const scrollerRef = React.useRef(null as HTMLElement | Window | null)

  const hero = pal.tones.hero
  const layoutKey = [reduced, hero.a, pal.tones.qa.a, sections.length, !!quote, !!next, story.figures.length, seed].join("|")

  useIsoLayoutEffect(() => {
    const root = rootRef.current
    const sky = skyRef.current
    if (!root || !sky) return
    gsap.registerPlugin(ScrollTrigger)
    const R = reduced
    const scroller = findScroller(root)
    scrollerRef.current = scroller
    const ctx = gsap.context((self) => {
      /* sky tone per section */
      const applyTone = (t: FitTone, instant?: boolean) =>
        gsap.to(sky, {
          "--fit-sky-a": t.a,
          "--fit-sky-b": t.b,
          "--fit-sky-c": t.c,
          "--fit-sun-x": t.sunX + "%",
          "--fit-sun-y": t.sunY + "%",
          "--fit-sun-a": t.sun,
          "--fit-banks-a": t.banks,
          duration: instant || R ? 0 : 1.6,
          ease: "power2.inOut",
          overwrite: true,
        })
      applyTone(pal.tones.hero, true)
      const toneOf = (el: Element | null, tone: FitTone) => {
        if (!el) return
        ScrollTrigger.create({
          trigger: el,
          scroller,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => {
            if (self.isActive) applyTone(tone)
          },
        })
      }
      toneOf(heroRef.current, pal.tones.hero)
      root.querySelectorAll(".fit-qa").forEach((el) => toneOf(el, pal.tones.qa))
      toneOf(quoteRef.current, pal.tones.quote)
      toneOf(nextRef.current, pal.tones.next)

      /* the sky: banks wrap past at their own depths */
      const banks = Array.from(banksRef.current ? banksRef.current.querySelectorAll(".fit-bank") : []) as HTMLElement[]
      let stage = sky.clientHeight
      let bankH = banks.map((b) => b.offsetHeight)
      const measure = () => {
        stage = sky.clientHeight
        bankH = banks.map((b) => b.offsetHeight)
      }
      const place = (scrolled: number) => {
        for (let i = 0; i < banks.length; i++) {
          const cfg = SKY_BANKS[i % SKY_BANKS.length]
          const y = R ? cfg.base * stage * 0.72 : wrapY(cfg.base * stage, cfg.speed, scrolled, stage, bankH[i] || stage * 0.4)
          banks[i].style.transform = "translate3d(0," + y.toFixed(1) + "px,0)"
        }
      }
      ScrollTrigger.create({
        trigger: root,
        scroller,
        start: "top top",
        end: "bottom bottom",
        onRefreshInit: measure,
        onRefresh: (self) => place(Math.max(0, self.scroll() - self.start)),
        onUpdate: (self) => {
          const scrolled = Math.max(0, self.scroll() - self.start)
          place(scrolled)
          if (progressRef.current) progressRef.current.style.transform = "scaleX(" + self.progress.toFixed(4) + ")"
          root.dataset.scrolled = scrolled > stage * 0.55 ? "1" : "0"
        },
      })
      place(0)
      if (!R) {
        banks.forEach((b, i) => {
          const drift = b.querySelector(".fit-bank-drift")
          if (drift) gsap.fromTo(drift, { xPercent: -1.6 }, { xPercent: 1.6, duration: 26 + i * 6, yoyo: true, repeat: -1, ease: "sine.inOut" })
        })
      }

      /* hero: the headline sinks behind the front bank */
      const heroEl = heroRef.current
      if (heroEl) {
        const title = heroEl.querySelector(".fit-title")
        const copy = heroEl.querySelector(".fit-hero-copy")
        const front = heroEl.querySelectorAll(".fit-hero-front .fit-bank")
        const figs = Array.from(heroEl.querySelectorAll(".fit-stage > .fit-fig, .fit-stage-front > .fit-fig")) as HTMLElement[]
        const cue = heroEl.querySelector(".fit-cue")
        const hbd = heroEl.querySelector(".fit-bd")
        if (!R) {
          const tl = gsap.timeline({ scrollTrigger: { trigger: heroEl, scroller, start: "top top", end: "bottom top", scrub: true } })
          if (hbd) tl.fromTo(hbd, { yPercent: 0, scale: 1 }, { yPercent: 14, scale: 1.06, ease: "none", duration: 1 }, 0)
          if (copy) tl.fromTo(copy, { yPercent: 0 }, { yPercent: -34, ease: "none", duration: 1 }, 0)
          if (title) tl.fromTo(title, { opacity: 1 }, { opacity: 0, ease: "power1.in", duration: 0.55 }, 0.25)
          front.forEach((b, i) => tl.fromTo(b, { yPercent: 0 }, { yPercent: -36 - i * 10, ease: "none", duration: 1 }, 0))
          figs.forEach((f) => {
            const d = parseFloat(f.dataset.depth || "0.3")
            tl.fromTo(f, { yPercent: 0 }, { yPercent: -(8 + d * 46), ease: "none", duration: 1 }, 0)
          })
          if (cue) tl.fromTo(cue, { opacity: 0.8 }, { opacity: 0, duration: 0.2, ease: "none" }, 0)
          /* page one */
          const intro = gsap.timeline({ defaults: { ease: "power3.out" } })
          intro.fromTo(heroEl.querySelectorAll(".fit-title > span"), { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.3, stagger: 0.14 }, 0.1)
          intro.fromTo(heroEl.querySelector(".fit-kicker"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9 }, 0.5)
          intro.fromTo(front, { yPercent: 14, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.8, stagger: 0.12, ease: "power2.out", clearProps: "yPercent,opacity" }, 0)
          if (cue) intro.fromTo(cue, { opacity: 0 }, { opacity: 0.8, duration: 0.8 }, 1.2)
          /* the pointer tilts the scene by depth */
          if (typeof matchMedia === "function" && matchMedia("(hover: hover)").matches) {
            const movers = figs.map((f) => {
              const inner = f.querySelector(".fit-fig-in") as HTMLElement | null
              const d = parseFloat(f.dataset.depth || "0.3")
              return inner ? { x: gsap.quickTo(inner, "x", { duration: 1.4, ease: "power3" }), y: gsap.quickTo(inner, "y", { duration: 1.4, ease: "power3" }), amp: 34 * (1.15 - d) } : null
            })
            const tx = copy ? gsap.quickTo(copy, "x", { duration: 1.6, ease: "power3" }) : null
            const onMove = (e: PointerEvent) => {
              const r = heroEl.getBoundingClientRect()
              const nx = clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5)
              const ny = clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5)
              movers.forEach((m) => {
                if (!m) return
                m.x(-nx * m.amp)
                m.y(-ny * m.amp * 0.6)
              })
              if (tx) tx(nx * 10)
            }
            const onLeave = () => {
              movers.forEach((m) => {
                if (!m) return
                m.x(0)
                m.y(0)
              })
              if (tx) tx(0)
            }
            heroEl.addEventListener("pointermove", onMove)
            heroEl.addEventListener("pointerleave", onLeave)
            self.add(() => () => {
              heroEl.removeEventListener("pointermove", onMove)
              heroEl.removeEventListener("pointerleave", onLeave)
            })
          }
        }
      }

      /* copy rises as it is reached */
      const reveals = Array.from(root.querySelectorAll(".fit-reveal"))
      const rules = Array.from(root.querySelectorAll(".fit-rule"))
      if (!R) {
        gsap.set(reveals, { opacity: 0, y: 32 })
        ScrollTrigger.batch(reveals, {
          scroller,
          start: "top 90%",
          once: true,
          onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.08, overwrite: true }),
        })
        ScrollTrigger.batch(rules, {
          scroller,
          start: "top 88%",
          once: true,
          onEnter: (els) => gsap.to(els, { scaleX: 1, duration: 0.9, ease: "power2.out", stagger: 0.08, delay: 0.2, overwrite: true }),
        })
      } else {
        gsap.set(rules, { scaleX: 1 })
      }

      /* the pull-quote: pinned while the ribbon draws and the words arrive */
      const quoteEl = quoteRef.current
      const stick = stickRef.current
      const svg = ribbonRef.current
      const rib = { p: R ? 1 : 0, w: 1000, h: 420 }
      if (quoteEl && stick && svg && ribEdge.current && ribShape.current && ribGrad.current) {
        const shapeEl = ribShape.current
        const gradEl = ribGrad.current
        const stopEls = Array.from(gradEl.querySelectorAll("stop"))
        const ed = ribEdge.current
        const dark = pal.ribbonDark
        const red = pal.ribbon
        const pale = mixHex(pal.ribbon, "#ffd9c2", 0.42)
        const shade = (l: number) => (l < 0.5 ? mixHex(dark, red, l * 2) : mixHex(red, pale, (l - 0.5) * 2))
        const size = () => {
          rib.w = Math.max(320, stick.clientWidth)
          rib.h = Math.max(320, stick.clientHeight)
          svg.setAttribute("viewBox", "0 0 " + rib.w + " " + rib.h)
        }
        size()
        const draw = () => {
          const t = R ? 0 : gsap.ticker.time
          const p = ribbonPaths(rib.w, rib.h, t, rib.p, clamp(rib.w * 0.034, 20, 52), stopEls.length)
          shapeEl.setAttribute("d", p.shape || "M0 0")
          ed.setAttribute("d", p.edge || "M0 0")
          gradEl.setAttribute("x1", p.x0.toFixed(1))
          gradEl.setAttribute("x2", p.x1.toFixed(1))
          for (let i = 0; i < stopEls.length; i++) {
            stopEls[i].setAttribute("offset", p.stops[i].offset.toFixed(4))
            stopEls[i].setAttribute("stop-color", shade(p.stops[i].lit))
          }
        }
        draw()
        const words = stick.querySelectorAll(".fit-w")
        const cite = stick.querySelector(".fit-cite")
        const qfig = stick.querySelectorAll(".fit-stage > .fit-fig, .fit-stage-front > .fit-fig")
        const qfront = stick.querySelectorAll(".fit-quote-front .fit-bank")
        const qbd = stick.querySelector(".fit-bd")
        if (!R) {
          const tl = gsap.timeline({ scrollTrigger: { trigger: quoteEl, scroller, start: "top top", end: "bottom bottom", scrub: 0.5, onRefreshInit: size } })
          tl.fromTo(words, { opacity: 0, y: 44, rotate: 1.5 }, { opacity: 1, y: 0, rotate: 0, duration: 0.42, ease: "power2.out", stagger: { each: 0.34 / Math.max(1, words.length) } }, 0.06)
          if (cite) tl.fromTo(cite, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.16, ease: "power2.out" }, 0.5)
          tl.to(rib, { p: 1, duration: 0.62, ease: "none" }, 0.02)
          if (qbd) tl.fromTo(qbd, { scale: 1.08, yPercent: -3 }, { scale: 1, yPercent: 3, duration: 1, ease: "none" }, 0)
          qfig.forEach((f) => tl.fromTo(f, { yPercent: 26 }, { yPercent: -18, duration: 1, ease: "none" }, 0))
          qfront.forEach((b, i) => tl.fromTo(b, { yPercent: 14 + i * 5 }, { yPercent: -10 - i * 5, duration: 1, ease: "none" }, 0))
          ScrollTrigger.create({
            trigger: quoteEl,
            scroller,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => {
              if (self.isActive) gsap.ticker.add(draw)
              else gsap.ticker.remove(draw)
            },
          })
          self.add(() => () => gsap.ticker.remove(draw))
        }
      }

      /* the next story rises out of the clouds */
      const nextEl = nextRef.current
      if (nextEl && !R) {
        const lines = nextEl.querySelectorAll(".fit-next-title b")
        const nfig = nextEl.querySelectorAll(".fit-next-stage .fit-fig, .fit-next-stage-front .fit-fig")
        const nfront = nextEl.querySelectorAll(".fit-next-front .fit-bank")
        const rest = nextEl.querySelectorAll(".fit-next-label,.fit-next-blurb,.fit-next-go")
        const nbd = nextEl.querySelector(".fit-bd")
        const tl = gsap.timeline({ scrollTrigger: { trigger: nextEl, scroller, start: "top 85%", end: "top 12%", scrub: 0.5 } })
        if (nbd) tl.fromTo(nbd, { yPercent: -10, scale: 1.08 }, { yPercent: 0, scale: 1, duration: 1, ease: "none" }, 0)
        tl.fromTo(lines, { yPercent: 108 }, { yPercent: 0, duration: 1, ease: "power2.out", stagger: 0.14 }, 0)
        nfig.forEach((f) => tl.fromTo(f, { yPercent: 38, opacity: 0.4 }, { yPercent: 0, opacity: 1, duration: 1, ease: "none" }, 0))
        nfront.forEach((b, i) => tl.fromTo(b, { yPercent: 24 + i * 6 }, { yPercent: 0, duration: 1, ease: "none" }, 0))
        tl.fromTo(rest, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 0.45)
      }
    }, root)

    /* late layout changes (fonts, images, host panels) re-measure the triggers */
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    ro.observe(root)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      ctx.revert()
    }
  }, [layoutKey])

  const goNext = (e: React.MouseEvent) => {
    if (next && onNext) {
      e.preventDefault()
      onNext(next)
    }
  }
  const toTop = () => {
    const root = rootRef.current
    if (!root) return
    scrollToEl(scrollerRef.current || window, root, 0, !reduced)
  }

  const markWords = series.name.split(/\s+/)
  const Mark = ({ as }: { as: "a" | "span" }) => {
    const inner = (
      <>
        {markWords.map((w, i) => (
          <b key={i}>{w}</b>
        ))}
        <small>{series.issue}</small>
      </>
    )
    return as === "a" ? (
      <a className="fit-mark" href={series.href || "#"} aria-label={series.name + " " + series.issue}>
        {inner}
      </a>
    ) : (
      <span className="fit-mark">{inner}</span>
    )
  }

  const titleOf = (title: string) => {
    const m = title.match(/^(\S+)\s*&\s*(\S+)$/)
    if (!m) return <h2 className="fit-qa-title fit-reveal">{title}</h2>
    return (
      <h2 className="fit-qa-title fit-reveal" aria-label={title}>
        <span className="fit-q1" aria-hidden="true">
          {m[1]}
        </span>
        <span className="fit-amp" aria-hidden="true">
          &amp;
        </span>
        <span className="fit-q2" aria-hidden="true">
          {m[2]}
        </span>
      </h2>
    )
  }

  const bank = (seedOf: number, left: string, width: string, bottom: string, res: number, priority: number, alpha?: number) => (
    <div className="fit-bank" style={{ left, width, bottom, opacity: alpha == null ? 1 : alpha }}>
      <CloudBank seed={seedOf + seed * 97} pal={pal.cloud} res={res} priority={priority} />
    </div>
  )

  const quoteStage = quote ? (
    <section ref={quoteRef} className="fit-quote" aria-label={plain(quote.text)}>
      <div ref={stickRef} className="fit-quote-stick">
        {quote.backdrop ? <Backdrop bd={quote.backdrop} ramp={pal.fresco} keep={pal.frescoKeep} /> : null}
        <div className="fit-quote-veil" aria-hidden="true" />
        <svg ref={ribbonRef} className="fit-ribbon" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient ref={ribGrad} id={uid + "-rib"} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">
              {Array.from({ length: RIB_STOPS }, (_, i) => (
                <stop key={i} offset={i / (RIB_STOPS - 1)} stopColor={pal.ribbon} />
              ))}
            </linearGradient>
          </defs>
          <path ref={ribShape} d="M0 0" fill={"url(#" + uid + "-rib)"} />
          <path ref={ribEdge} d="M0 0" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="fit-stage">{quote.figure && !quote.figure.front ? <Figure fig={quote.figure} ramp={pal.marble} className="fit-fig-s1" /> : null}</div>
        <blockquote className="fit-quote-text">
          <p>
            <RichWords text={quote.text} />
          </p>
          {quote.cite ? <footer className="fit-cite">{quote.cite}</footer> : null}
        </blockquote>
        <div className="fit-stage-front">{quote.figure && quote.figure.front ? <Figure fig={quote.figure} ramp={pal.marble} className="fit-fig-s1" /> : null}</div>
        <div className="fit-quote-front">
          {bank(53, "-6%", "72%", "-12%", 960, 2)}
          {bank(59, "46%", "62%", "-2%", 800, 2)}
        </div>
      </div>
    </section>
  ) : null

  return (
    <div
      ref={rootRef}
      className={"fit-root" + (className ? " " + className : "")}
      data-theme={dark ? "dark" : "light"}
      data-motion={reduced ? "reduced" : "full"}
      data-scrolled="0"
      style={
        {
          "--fit-h": height,
          "--fit-ink": pal.ink,
          "--fit-muted": pal.muted,
          "--fit-gold": pal.gold,
          "--fit-veil": pal.veil,
          "--fit-glow": pal.cloud.light,
          "--fit-sky-a": hero.a,
          "--fit-sky-b": hero.b,
          "--fit-sky-c": hero.c,
          "--fit-sun-x": hero.sunX + "%",
          "--fit-sun-y": hero.sunY + "%",
          "--fit-sun-a": hero.sun,
          "--fit-banks-a": hero.banks,
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: FIT_CSS }} />

      <div ref={skyRef} className="fit-sky" aria-hidden="true">
        <div className="fit-sky-grad" />
        <div className="fit-sun" />
        <div ref={banksRef} className="fit-banks">
          {SKY_BANKS.map((b, i) => (
            <div key={i} className="fit-bank" style={{ left: b.left + "%", width: b.width + "%", opacity: b.alpha }}>
              <div className="fit-bank-drift">
                <CloudBank seed={b.seed + seed * 97} pal={pal.cloud} res={i >= 3 ? 800 : 640} priority={i < 3 ? 1 : 3} />
              </div>
            </div>
          ))}
        </div>
        <svg className="fit-grain">
          <filter id={uid + "-grain"}>
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1 0" />
          </filter>
          <rect width="100%" height="100%" filter={"url(#" + uid + "-grain)"} />
        </svg>
      </div>

      <div className="fit-page">
        <header className="fit-head">
          <Mark as="a" />
          <div className="fit-head-mid" aria-hidden="true">
            <i>{story.kicker}</i>
            {story.title.join(" ")}
          </div>
          <nav className="fit-head-nav" aria-label={series.name}>
            <a className="fit-link" href={series.href || "#"}>
              {labels.index}
            </a>
            {next ? (
              <a className="fit-link" href={next.href} onClick={goNext}>
                {labels.next}
                <Arrow />
              </a>
            ) : null}
          </nav>
          <i ref={progressRef} className="fit-progress" aria-hidden="true" />
        </header>

        <main>
          <section ref={heroRef} className="fit-hero" aria-labelledby={uid + "-title"}>
            {story.backdrop ? <Backdrop bd={story.backdrop} ramp={pal.fresco} keep={pal.frescoKeep} /> : null}
            <div className="fit-hero-veil" aria-hidden="true" />
            <div className="fit-stage">
              {story.figures.map((f, i) => (f.front ? null : <Figure key={i} fig={f} ramp={pal.marble} className="fit-fig-s1" />))}
            </div>
            <div className="fit-hero-copy">
              <p className="fit-kicker">{story.kicker}</p>
              <h1 id={uid + "-title"} className="fit-title">
                {story.title.map((l, i) => (
                  <span key={i} className={i % 2 === 0 ? "fit-title-l1" : "fit-title-l2"}>
                    {l}
                  </span>
                ))}
              </h1>
              <p className="fit-sr">{story.subject}</p>
            </div>
            <div className="fit-hero-front">
              {bank(41, "-4%", "70%", "-8%", 960, 0)}
              {bank(43, "42%", "64%", "2%", 960, 0)}
            </div>
            <div className="fit-stage-front">
              {story.figures.map((f, i) => (f.front ? <Figure key={i} fig={f} ramp={pal.marble} className="fit-fig-s1" /> : null))}
            </div>
            <div className="fit-cue" aria-hidden="true">
              {labels.scroll}
              <i />
            </div>
          </section>

          <section className="fit-deck" aria-label={story.subject}>
            <p className="fit-reveal">
              <Rich text={story.deck} />
            </p>
            {story.cta ? (
              <a className="fit-btn fit-reveal" href={story.cta.href}>
                {story.cta.label}
                <Arrow />
              </a>
            ) : null}
          </section>

          {sections.map((sec, si) => (
            <React.Fragment key={si}>
              <section className="fit-qa" aria-label={sec.title}>
                <div className="fit-qa-veil" />
                <div className="fit-qa-head">
                  {titleOf(sec.title)}
                  {sec.ornament && sec.ornament !== "none" ? (
                    <div className="fit-qa-orn fit-reveal">{sec.ornament === "pearl" ? <Pearl uid={uid + si} /> : <Figure fig={sec.ornament} ramp={pal.marble} className="fit-fig-s1" />}</div>
                  ) : null}
                </div>
                <div className="fit-qa-grid">
                  {sec.items.map((it, i) => (
                    <div key={i} className="fit-qa-item fit-reveal">
                      <i className="fit-rule" aria-hidden="true" />
                      <h3 className="fit-q">{it.q}</h3>
                      <p className="fit-a">{it.a}</p>
                    </div>
                  ))}
                </div>
              </section>
              {si === 0 ? quoteStage : null}
            </React.Fragment>
          ))}
          {sections.length === 0 ? quoteStage : null}
        </main>

        {next ? (
          <section ref={nextRef} className="fit-next" aria-label={next.label}>
            {next.backdrop ? <Backdrop bd={next.backdrop} ramp={pal.fresco} keep={pal.frescoKeep} /> : null}
            <a className="fit-next-link" href={next.href} onClick={goNext}>
              <span className="fit-next-label">{next.label}</span>
              <span className="fit-next-title" role="heading" aria-level={2}>
                {next.title.map((l, i) => (
                  <span key={i} className={i % 2 === 0 ? "fit-nt1" : "fit-nt2"}>
                    <b>{l}</b>
                  </span>
                ))}
              </span>
              {next.blurb ? <span className="fit-next-blurb">{next.blurb}</span> : null}
              <span className="fit-next-go">
                {labels.nextStory}
                <Arrow />
              </span>
            </a>
            <div className="fit-next-stage">{next.figure && !next.figure.front ? <Figure fig={next.figure} ramp={pal.marble} className="fit-fig-s1" /> : null}</div>
            <div className="fit-next-stage-front">{next.figure && next.figure.front ? <Figure fig={next.figure} ramp={pal.marble} className="fit-fig-s1" /> : null}</div>
            <div className="fit-next-front">
              {bank(61, "-8%", "70%", "-14%", 960, 4)}
              {bank(67, "44%", "64%", "-4%", 800, 4)}
            </div>
            <footer className="fit-foot">
              <div className="fit-foot-l">
                <Mark as="span" />
                {social.length ? (
                  <nav className="fit-social" aria-label="Social">
                    {social.map((s, i) => (
                      <a key={i} href={s.href} aria-label={s.label} title={s.label}>
                        <Icon name={s.icon || "link"} />
                      </a>
                    ))}
                  </nav>
                ) : null}
                {legal[0] ? (
                  <a className="fit-link" href={legal[0].href}>
                    {legal[0].label}
                  </a>
                ) : null}
              </div>
              <div className="fit-foot-r">
                {legal.slice(1).map((l, i) => (
                  <a key={i} className="fit-link" href={l.href}>
                    {l.label}
                  </a>
                ))}
                <button type="button" className="fit-top" onClick={toTop}>
                  {labels.top}
                  <Arrow />
                </button>
              </div>
            </footer>
          </section>
        ) : (
          <footer className="fit-foot fit-foot-alone">
            <div className="fit-foot-l">
              <Mark as="span" />
            </div>
            <div className="fit-foot-r">
              {legal.map((l, i) => (
                <a key={i} className="fit-link" href={l.href}>
                  {l.label}
                </a>
              ))}
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}
