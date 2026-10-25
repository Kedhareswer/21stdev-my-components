"use client"

// Honey Label Footer — a site footer dressed as the wrap-around label of a jar
// of honey. A sage band carries the brand's medallion on a lollipop stem, a
// meadow of mint blossoms grows out of its top edge, and the label's own
// furniture does the footer's job: a Nutrition Facts panel, a real EAN-13
// barcode, a centre panel with the headline claim, two link columns, socials
// and the copyright strip.
//
// Storyboard. When the footer scrolls into view the label wraps on from the
// centre out, as if rolled round the jar. The meadow grows with it: stems
// draw upward, leaves unfurl as the stem passes them and the florets pop open
// from the bottom of each spike to its tip. The medallion's stem draws up from
// the arch and the medallion pops onto it; the panel rules draw, the type
// settles in a stagger, the barcode prints bar by bar. Then a bee takes off
// from the arch and forages from spike to spike.
//
// Live: a slow wind sways every stem on its own phase, the pointer parts the
// flowers as it moves through them and shakes loose a little pollen, the bee
// keeps clear of the pointer, and clicking the arch calls the bee home for a
// loop before it goes back to work.
//
// One file, React only. The meadow is drawn to a canvas from a seed, every
// mark is SVG in this file, and nothing is fetched.

import * as React from "react"

// #region label
// Pure: the seeded meadow, the stem curve, the leaf outline, the easings and
// the EAN-13 encoder. Lifted out and run by the test.

/** Height of the zone above the band where the medallion and the blossoms live. */
export const HLF_TOP = 250
/** How far below the band's top edge a stem may root. */
export const HLF_ROOTS = 84
/** The meadow canvas covers the tag zone and the band's top strip. */
export const HLF_MEADOW_H = HLF_TOP + 170
/** Half the width over which the wrap-and-grow stagger runs. */
export const HLF_STAGGER_W = 720

/** mulberry32: a small deterministic PRNG so every render grows the same meadow. */
export const hlfRng = (seed: number): (() => number) => {
  let a = (seed >>> 0) || 0x9e3779b9
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const hlfClamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)
export const hlfEaseOut = (t: number): number => {
  const x = hlfClamp(t, 0, 1)
  return 1 - Math.pow(1 - x, 3)
}
/** An entrance with a small overshoot: 0 → 1.12 → 1. */
export const hlfPop = (t: number): number => {
  const x = hlfClamp(t, 0, 1)
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

/** Mixes two #rrggbb colours. */
export const hlfMix = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const k = hlfClamp(t, 0, 1)
  const ch = (sh: number) => {
    const x = (pa >> sh) & 255
    const y = (pb >> sh) & 255
    return Math.round(x + (y - x) * k)
  }
  return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)
}

export interface HlfLeaf {
  /** Where on the stem it sits, 0 root → 1 tip. */
  t: number
  /** -1 left, 1 right. */
  side: number
  len: number
  wid: number
  /** Angle off the stem's tangent, radians. */
  ang: number
  teeth: number
}

export interface HlfFloret {
  x: number
  y: number
  r: number
  rot: number
  /** Index into the petal tones. */
  tone: number
  eye: boolean
}

export interface HlfWhorl {
  t: number
  rx: number
  ry: number
  florets: HlfFloret[]
}

export interface HlfStem {
  /** Horizontal position, px from the footer's centre. */
  x: number
  /** px below the band's top edge where it roots. */
  root: number
  h: number
  /** The tip's sideways lean, px. */
  bend: number
  /** 0 back, 1 mid, 2 front. */
  layer: number
  /** 0 leafy sprig, 1 flowering spike. */
  kind: number
  leaves: HlfLeaf[]
  whorls: HlfWhorl[]
  /** Tip bud size, 0 for none. */
  bud: number
  phase: number
  amp: number
  omega: number
  /** Growth start, seconds after the reveal. */
  delay: number
  /** Growth duration, seconds. */
  dur: number
}

export const HLF_LAYER_SCALE = [0.66, 0.84, 1]
export const HLF_LAYER_HAZE = [0.46, 0.18, 0]

/** A point on the stem (root at 0,0, up is -y) and its unit tangent. */
export const hlfStemAt = (stem: HlfStem, s: number): [number, number, number, number] => {
  const t = hlfClamp(s, 0, 1)
  const cx = stem.bend * 0.3
  const cy = -stem.h * 0.52
  const ex = stem.bend
  const ey = -stem.h
  const u = 1 - t
  const x = 2 * u * t * cx + t * t * ex
  const y = 2 * u * t * cy + t * t * ey
  let dx = 2 * u * cx + 2 * t * (ex - cx)
  let dy = 2 * u * cy + 2 * t * (ey - cy)
  const n = Math.hypot(dx, dy) || 1
  dx /= n
  dy /= n
  return [x, y, dx, dy]
}

/**
 * A serrated, lanceolate leaf outline in local coordinates: base at 0,0, tip
 * at len,0. Closed polygon, upper edge then lower edge back to the base.
 */
export const hlfLeafOutline = (leaf: HlfLeaf): number[][] => {
  const n = Math.max(4, Math.round(leaf.teeth))
  const upper: number[][] = []
  const lower: number[][] = []
  for (let k = 1; k < n; k++) {
    const f = k / n
    const x = leaf.len * f
    // widest just before the middle, pinched toward the tip
    const w = leaf.wid * Math.pow(Math.sin(Math.PI * Math.pow(f, 0.72)), 0.95)
    const tooth = k % 2 ? 1 : 0.86
    upper.push([x, -w * tooth])
    lower.push([x + leaf.len * 0.012, w * tooth])
  }
  return [[0, 0], ...upper, [leaf.len, 0], ...lower.reverse()]
}

/** The size of the box a stem can paint into, in local px (before layer scale). */
export const hlfStemBox = (stem: HlfStem): { left: number; right: number; top: number; bottom: number } => {
  const reach = stem.leaves.reduce((m, l) => Math.max(m, l.len * 1.05 + l.wid), 0) + 18
  return {
    left: Math.min(0, stem.bend) - reach,
    right: Math.max(0, stem.bend) + reach,
    top: -stem.h - 22,
    bottom: 26,
  }
}

/**
 * Grows the meadow: three depth layers of stems, denser at the back, spread
 * over `span` px centred on 0. `density` scales the count. Every number comes
 * from the seed.
 */
export const hlfMeadow = (seed: number, span: number, density: number): HlfStem[] => {
  const rng = hlfRng(seed)
  const stems: HlfStem[] = []
  const gaps = [46, 50, 58]
  const d = hlfClamp(Number.isFinite(density) ? density : 1, 0.25, 3)
  for (let layer = 0; layer < 3; layer++) {
    const gap = gaps[layer] / d
    const count = Math.max(2, Math.round(span / gap))
    for (let i = 0; i < count; i++) {
      const x = -span / 2 + (i + 0.5) * gap + (rng() - 0.5) * gap * 0.9
      // gaps in the planting, so it reads as a meadow and not a hedge
      if (rng() < 0.16) continue
      const spike = rng() < (layer === 2 ? 0.7 : 0.58)
      const h = (spike ? 122 : 64) + rng() * (spike ? 112 : 70)
      const bend = (rng() - 0.5) * h * 0.34
      const leaves: HlfLeaf[] = []
      const pairs = spike ? 3 + Math.floor(rng() * 2) : 3 + Math.floor(rng() * 3)
      const leafTop = spike ? 0.6 : 0.96
      for (let p = 0; p < pairs; p++) {
        const t = 0.1 + ((p + rng() * 0.5) / pairs) * (leafTop - 0.1)
        const size = (0.55 + (1 - t) * 0.6) * (spike ? 1 : 1.15)
        for (const side of [-1, 1]) {
          if (rng() < 0.12) continue
          leaves.push({
            t: hlfClamp(t + (rng() - 0.5) * 0.03, 0.04, 0.98),
            side,
            len: (23 + rng() * 17) * size,
            wid: (8 + rng() * 4.5) * size,
            ang: (0.66 + rng() * 0.5) * side,
            teeth: 11 + Math.floor(rng() * 6),
          })
        }
      }
      const whorls: HlfWhorl[] = []
      if (spike) {
        const n = 5 + Math.floor(rng() * 3)
        for (let w = 0; w < n; w++) {
          const t = 0.64 + (w / (n - 1)) * 0.32
          const taper = 1 - (w / (n - 1)) * 0.4
          const rx = (10 + rng() * 3.5) * taper
          const ry = rx * 0.6
          const florets: HlfFloret[] = []
          const m = 8 + Math.floor(rng() * 5)
          for (let f = 0; f < m; f++) {
            const a = (f / m) * Math.PI * 2 + rng() * 0.6
            const rr = 0.45 + rng() * 0.55
            florets.push({
              x: Math.cos(a) * rx * rr,
              y: Math.sin(a) * ry * rr,
              r: 2.2 + rng() * 1.3,
              rot: rng() * Math.PI,
              tone: rng() < 0.22 ? 0 : rng() < 0.5 ? 1 : rng() < 0.7 ? 2 : 3,
              eye: rng() < 0.4,
            })
          }
          whorls.push({ t, rx, ry, florets })
        }
      }
      const dist = Math.abs(x) / HLF_STAGGER_W
      stems.push({
        x,
        root: 10 + rng() * (HLF_ROOTS - 14),
        h,
        bend,
        layer,
        kind: spike ? 1 : 0,
        leaves,
        whorls,
        bud: spike ? 3 + rng() * 2 : 0,
        phase: rng() * Math.PI * 2,
        amp: (0.012 + rng() * 0.016) * (layer === 0 ? 0.7 : 1),
        omega: 0.55 + rng() * 0.6,
        delay: 0.22 + dist * 0.85 + rng() * 0.28,
        dur: 1.25 + rng() * 0.5,
      })
    }
  }
  // Painter's order: back to front, and within a layer the lower roots last so
  // the nearer plants sit in front.
  stems.sort((a, b) => a.layer - b.layer || a.root - b.root)
  return stems
}

// EAN-13. The seven-module patterns for the left-hand L set; G is each R
// pattern reversed and R is L inverted. The first digit is not drawn as bars:
// it chooses which of the six left digits use G.
export const HLF_EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"]
export const HLF_EAN_R = HLF_EAN_L.map((p) => p.replace(/[01]/g, (c) => (c === "0" ? "1" : "0")))
export const HLF_EAN_G = HLF_EAN_R.map((p) => p.split("").reverse().join(""))
export const HLF_EAN_PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"]

/** The check digit for twelve digits. */
export const hlfEanCheck = (twelve: string): number => {
  let sum = 0
  for (let i = 0; i < 12; i++) sum += (twelve.charCodeAt(i) - 48) * (i % 2 ? 3 : 1)
  return (10 - (sum % 10)) % 10
}

/**
 * Encodes any run of digits as an EAN-13: fewer than twelve are padded on the
 * left with zeros, twelve get their check digit, thirteen have it corrected.
 * Returns the thirteen digits and the 95 modules, 1 for a bar.
 */
export const hlfEan13 = (input: string): { digits: string; modules: string } => {
  const raw = String(input ?? "").replace(/\D/g, "")
  const twelve = raw.slice(0, 12).padStart(12, "0")
  const digits = twelve + hlfEanCheck(twelve)
  const parity = HLF_EAN_PARITY[digits.charCodeAt(0) - 48]
  let modules = "101"
  for (let i = 1; i <= 6; i++) {
    const d = digits.charCodeAt(i) - 48
    modules += parity[i - 1] === "L" ? HLF_EAN_L[d] : HLF_EAN_G[d]
  }
  modules += "01010"
  for (let i = 7; i <= 12; i++) modules += HLF_EAN_R[digits.charCodeAt(i) - 48]
  modules += "101"
  return { digits, modules }
}

/** Runs of bars in a module string: [start, width][]. */
export const hlfBars = (modules: string): number[][] => {
  const bars: number[][] = []
  let i = 0
  while (i < modules.length) {
    if (modules[i] === "1") {
      let j = i
      while (j < modules.length && modules[j] === "1") j++
      bars.push([i, j - i])
      i = j
    } else i++
  }
  return bars
}
// #endregion

export interface HlfPalette {
  /** The label band. */
  band: string
  /** The centre panel's fill. */
  panel: string
  /** The arch tab behind the small bee. */
  arch: string
  /** The medallion and its stem. */
  medal: string
  /** Type on the band. */
  ink: string
  /** Secondary type on the band. */
  muted: string
  /** Rules and borders on the band. */
  line: string
  /** The Nutrition Facts sticker. */
  paper: string
  paperInk: string
  /** Link hover and focus rings. */
  accent: string
  /** What the far blossoms fade toward. */
  haze: string
  stem: string
  /** Leaf shadow, mid and light. */
  leaf: [string, string, string]
  /** Petal tones: deep, mid, light, pale. */
  petal: [string, string, string, string]
  /** The floret's stamen dot. */
  eye: string
  /** Unopened tip buds. */
  bud: string
  pollen: string
  /** The bee's body and stripes. */
  bee: [string, string]
}

export type HlfPreset = "auto" | "mint" | "amber" | "lavender" | "night"

export interface HlfLink {
  label: string
  href?: string
}

export interface HlfColumn {
  title: string
  links: HlfLink[]
}

export type HlfSocialIcon = "instagram" | "facebook" | "x" | "youtube" | "linkedin" | "mail"

export interface HlfSocial {
  icon: HlfSocialIcon | React.ReactNode
  href?: string
  /** Accessible name. Defaults to the network's name. */
  label?: string
}

export interface HlfFactRow {
  label: string
  value?: string
  /** The "% Daily Value" column. */
  pct?: string
  /** Indented under the row above. */
  sub?: boolean
}

export interface HlfFacts {
  title?: string
  serving?: string
  /** The small line over the big one. Defaults to "Amount per serving". */
  amountLabel?: string
  /** The big line: "Calories" and "64". */
  headline?: [string, string]
  /** The right-aligned column header. Defaults to "% Daily Value*". */
  dvLabel?: string
  rows?: HlfFactRow[]
  footnote?: string
}

export interface HlfHeadline {
  /** Small line above the title. */
  eyebrow?: string
  title?: string
  /** Line under the rule: net weight, version, est. year… */
  meta?: string
}

export interface HlfClaim {
  value?: string
  label?: string
}

export interface HlfBlurb {
  title?: string
  paragraphs?: string[]
}

export interface HlfNewsletter {
  title?: string
  hint?: string
  placeholder?: string
  button?: string
  /** Shown after a successful submit. */
  thanks?: string
}

export interface HoneyLabelFooterProps {
  /** Brand name, in the medallion and the arch. */
  name?: string
  /** Where the medallion links to. */
  brandHref?: string
  /** The line arched over the medallion. */
  tagline?: string
  /** The small line under the name in the medallion. */
  medalNote?: string
  /** Replace the drawn bee mark in the medallion and the arch. */
  logo?: React.ReactNode
  /** The centre panel's left cell: a big value and its label. */
  claim?: HlfClaim
  /** The centre panel's right cell. */
  headline?: HlfHeadline
  /** The Nutrition Facts sticker. */
  facts?: HlfFacts
  /** Digits for the barcode. Twelve get a check digit; fewer are zero-padded. */
  barcode?: string
  /** The prose column beside the sticker. */
  blurb?: HlfBlurb
  /** The sign-up under the centre panel. Pass false to leave it out. */
  newsletter?: HlfNewsletter | false
  /** Called with the address when the sign-up is submitted. */
  onSubscribe?: (email: string) => void
  /** Link columns on the right of the band. */
  columns?: HlfColumn[]
  /** Round social tags in the bottom strip. */
  socials?: HlfSocial[]
  /** Bottom-left line. Defaults to "© <year> <name>. All rights reserved." */
  copyright?: string
  /** Small links beside the copyright. */
  legal?: HlfLink[]
  /** Colours. "auto" is mint, or night under a .dark ancestor. */
  preset?: HlfPreset
  /** Colour overrides, merged over the preset. */
  palette?: HlfPaletteOverrides
  /** Which meadow to grow. Any integer. */
  seed?: number
  /** How thick the meadow grows. 1 is the default spacing. */
  density?: number
  /** The slow wind and pointer sway. Defaults to true. */
  wind?: boolean
  /** The foraging bee. Defaults to true. */
  bee?: boolean
  /** Widest the content gets. Defaults to "1280px". */
  maxWidth?: string
  /** Face for the small type. */
  fontFamily?: string
  /** Face for the brand name. */
  displayFamily?: string
  /** Root height. A definite length, never a percentage. The footer grows past it when the content needs more room. */
  height?: string
  /** Extra root class names. */
  className?: string
}

const PRESETS: { [k: string]: HlfPalette } = {
  mint: {
    band: "#95b99f",
    panel: "#a3c3ac",
    arch: "#b8d1be",
    medal: "#95b99f",
    ink: "#13261b",
    muted: "#2d4a3a",
    line: "#1f3b2c",
    paper: "#fcfbf6",
    paperInk: "#121212",
    accent: "#514fae",
    haze: "#ffffff",
    stem: "#4a7e49",
    leaf: ["#2e6a3a", "#4f9151", "#8fc380"],
    petal: ["#4b4d9c", "#6c6bc3", "#908cd9", "#c3bff0"],
    eye: "#f7f4ff",
    bud: "#7d9c57",
    pollen: "#f5d35e",
    bee: ["#f0c33c", "#1b1b1b"],
  },
  amber: {
    band: "#e3a93b",
    panel: "#e9b54f",
    arch: "#f1c86f",
    medal: "#e3a93b",
    ink: "#2b1b07",
    muted: "#4b3310",
    line: "#3a2708",
    paper: "#fffaf0",
    paperInk: "#121212",
    accent: "#b4521a",
    haze: "#fff3d8",
    stem: "#5f7d2f",
    leaf: ["#3d5d22", "#6a8c3a", "#9fba60"],
    petal: ["#e6d7b4", "#f4e9d0", "#fdf7ea", "#ffffff"],
    eye: "#e2a32a",
    bud: "#a6b35f",
    pollen: "#fff1a6",
    bee: ["#f0c33c", "#1b1b1b"],
  },
  lavender: {
    band: "#b6b0d4",
    panel: "#c3bddd",
    arch: "#d2cde7",
    medal: "#b6b0d4",
    ink: "#201a37",
    muted: "#3a3356",
    line: "#2b244d",
    paper: "#fdfcff",
    paperInk: "#121212",
    accent: "#7a3e90",
    haze: "#ffffff",
    stem: "#5a7c5a",
    leaf: ["#3e6a4a", "#6f9a6a", "#a4c59a"],
    petal: ["#5c3d98", "#8156bf", "#a98ad8", "#d4c4ef"],
    eye: "#fff2c2",
    bud: "#879868",
    pollen: "#ffe58a",
    bee: ["#f0c33c", "#1b1b1b"],
  },
  night: {
    band: "#1f3b2f",
    panel: "#27493a",
    arch: "#2f5444",
    medal: "#1f3b2f",
    ink: "#eaf2e8",
    muted: "#b8cbbd",
    line: "#d2e2d5",
    paper: "#f6f3ea",
    paperInk: "#121212",
    accent: "#c9c4f7",
    haze: "#182b22",
    stem: "#5d9966",
    leaf: ["#2d6a44", "#4e9560", "#8ccd8f"],
    petal: ["#6a65c8", "#8e89e0", "#b4aff1", "#ddd9fb"],
    eye: "#ffffff",
    bud: "#7eab6a",
    pollen: "#ffe36a",
    bee: ["#f3c842", "#141414"],
  },
}

const SOCIAL_NAMES: { [k: string]: string } = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  mail: "Email",
}

const DEFAULT_FACTS: HlfFacts = {
  title: "Nutrition Facts",
  serving: "Serving size 1 tbsp (21 g)",
  amountLabel: "Amount per serving",
  headline: ["Calories", "64"],
  dvLabel: "% Daily Value*",
  rows: [
    { label: "Total Fat", value: "0 g", pct: "0%" },
    { label: "Sodium", value: "0 mg", pct: "0%" },
    { label: "Total Carbohydrate", value: "17 g", pct: "6%" },
    { label: "Total Sugars", value: "17 g", sub: true },
    { label: "Protein", value: "0 g" },
  ],
  footnote: "*Raw honey. Not for children under one year.",
}

const DEFAULT_COLUMNS: HlfColumn[] = [
  {
    title: "Shop",
    links: [{ label: "Mint blossom", href: "#" }, { label: "Wildflower", href: "#" }, { label: "Cut comb", href: "#" }, { label: "Gift sets", href: "#" }],
  },
  {
    title: "Hive",
    links: [{ label: "Our bees", href: "#" }, { label: "The valley", href: "#" }, { label: "Journal", href: "#" }, { label: "Stockists", href: "#" }],
  },
  {
    title: "Help",
    links: [{ label: "Shipping", href: "#" }, { label: "Returns", href: "#" }, { label: "Wholesale", href: "#" }, { label: "Contact", href: "#" }],
  },
]

const DEFAULT_SOCIALS: HlfSocial[] = [
  { icon: "instagram", href: "#" },
  { icon: "facebook", href: "#" },
  { icon: "youtube", href: "#" },
  { icon: "mail", href: "mailto:hello@example.com" },
]

const DEFAULT_NEWSLETTER: HlfNewsletter = {
  title: "The harvest letter",
  hint: "One email when the honey is in. Nothing else.",
  placeholder: "you@example.com",
  button: "Join",
  thanks: "You're on the list. The bees will let you know.",
}

const DEFAULT_FONT = 'Inter, "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif'
const DEFAULT_DISPLAY = '"SF Pro Rounded", ui-rounded, "Nunito", "Varela Round", "Quicksand", "Segoe UI", system-ui, sans-serif'

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

type HlfMote = { x: number; y: number; vx: number; vy: number; life: number; r: number }
type HlfSprite = { c: HTMLCanvasElement; ox: number; oy: number; s: number }
type HlfBeeState = {
  x: number
  y: number
  vx: number
  vy: number
  tx: number
  ty: number
  /** 0 asleep on the arch, 1 flying, 2 hovering at a flower, 3 called home. */
  mode: number
  until: number
  face: number
  seed: number
  /** The flower it is at, or -1. */
  at: number
}

/** Paints one stem at growth `p` (0..1) into a context already at its root. */
function paintStem(ctx: CanvasRenderingContext2D, stem: HlfStem, p: number, tones: HlfPalette) {
  const sl = hlfEaseOut(Math.min(1, p / 0.72))
  if (sl <= 0.001) return
  const steps = 14
  // the stem, as far as it has grown
  ctx.beginPath()
  for (let k = 0; k <= steps; k++) {
    const [x, y] = hlfStemAt(stem, (k / steps) * sl)
    if (k === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.strokeStyle = tones.stem
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.lineWidth = stem.kind ? 2.4 : 2
  ctx.stroke()
  // leaves unfurl as the tip passes them
  for (const leaf of stem.leaves) {
    const g = hlfPop(hlfClamp((sl - leaf.t) / 0.22, 0, 1))
    if (g <= 0.001) continue
    const [x, y, dx, dy] = hlfStemAt(stem, leaf.t)
    const tangent = Math.atan2(dy, dx)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tangent + leaf.ang + 0.05 * leaf.side)
    ctx.scale(g, g)
    const pts = hlfLeafOutline(leaf)
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.closePath()
    ctx.fillStyle = tones.leaf[1]
    ctx.fill()
    // the lit half
    ctx.beginPath()
    ctx.moveTo(0, 0)
    const half = Math.floor(pts.length / 2)
    for (let i = 1; i <= half; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.closePath()
    ctx.globalAlpha = 0.55
    ctx.fillStyle = tones.leaf[2]
    ctx.fill()
    ctx.globalAlpha = 1
    // midrib and three side veins
    ctx.beginPath()
    ctx.moveTo(1, 0)
    ctx.lineTo(leaf.len * 0.94, 0)
    for (let v = 1; v <= 3; v++) {
      const f = v / 4
      const vx = leaf.len * f
      const vw = leaf.wid * Math.sin(Math.PI * f) * 0.75
      ctx.moveTo(vx, 0)
      ctx.lineTo(vx + leaf.len * 0.1, -vw)
      ctx.moveTo(vx, 0)
      ctx.lineTo(vx + leaf.len * 0.1, vw)
    }
    ctx.strokeStyle = tones.leaf[0]
    ctx.lineWidth = 0.7
    ctx.globalAlpha = 0.7
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.restore()
  }
  // whorls bloom from the bottom of the spike to the tip
  for (const whorl of stem.whorls) {
    const g = hlfPop(hlfClamp((sl - whorl.t) / 0.2, 0, 1))
    if (g <= 0.001) continue
    const [x, y, dx, dy] = hlfStemAt(stem, whorl.t)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.atan2(dy, dx) + Math.PI / 2)
    ctx.scale(g, g)
    // two bracts under the whorl
    ctx.beginPath()
    ctx.moveTo(0, 2)
    ctx.quadraticCurveTo(-whorl.rx * 0.9, 1, -whorl.rx * 1.25, 6)
    ctx.quadraticCurveTo(-whorl.rx * 0.5, 4, 0, 2)
    ctx.moveTo(0, 2)
    ctx.quadraticCurveTo(whorl.rx * 0.9, 1, whorl.rx * 1.25, 6)
    ctx.quadraticCurveTo(whorl.rx * 0.5, 4, 0, 2)
    ctx.fillStyle = tones.leaf[1]
    ctx.fill()
    // the soft body of the whorl
    ctx.beginPath()
    ctx.ellipse(0, 0, whorl.rx, whorl.ry, 0, 0, Math.PI * 2)
    ctx.fillStyle = tones.petal[0]
    ctx.globalAlpha = 0.55
    ctx.fill()
    ctx.globalAlpha = 1
    for (const f of whorl.florets) {
      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.rotate(f.rot)
      ctx.fillStyle = tones.petal[f.tone]
      for (let q = 0; q < 4; q++) {
        ctx.beginPath()
        ctx.ellipse(f.r * 0.62, 0, f.r * 0.9, f.r * 0.5, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.rotate(Math.PI / 2)
      }
      if (f.eye) {
        ctx.beginPath()
        ctx.arc(0, 0, f.r * 0.32, 0, Math.PI * 2)
        ctx.fillStyle = tones.eye
        ctx.fill()
      }
      ctx.restore()
    }
    ctx.restore()
  }
  // the tip bud
  if (stem.bud > 0 && sl > 0.97) {
    const g = hlfPop(hlfClamp((sl - 0.97) / 0.03, 0, 1))
    const [x, y] = hlfStemAt(stem, 1)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(g, g)
    for (let k = 0; k < 3; k++) {
      ctx.beginPath()
      ctx.arc((k - 1) * stem.bud * 0.55, k === 1 ? -stem.bud * 0.5 : 0, stem.bud * 0.55, 0, Math.PI * 2)
      ctx.fillStyle = k === 1 ? tones.petal[2] : tones.bud
      ctx.fill()
    }
    ctx.restore()
  }
}

function hazed(p: HlfPalette, haze: number): HlfPalette {
  const m = (c: string) => hlfMix(c, p.haze, haze)
  return {
    ...p,
    stem: m(p.stem),
    leaf: [m(p.leaf[0]), m(p.leaf[1]), m(p.leaf[2])],
    petal: [m(p.petal[0]), m(p.petal[1]), m(p.petal[2]), m(p.petal[3])],
    eye: m(p.eye),
    bud: m(p.bud),
  }
}

const SOCIAL_PATHS: { [k: string]: React.ReactNode } = {
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path
      d="M13.6 21v-7.4h2.5l.4-2.9h-2.9V8.8c0-.8.2-1.4 1.4-1.4h1.6V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.1H8v2.9h2.5V21"
      fill="currentColor"
      stroke="none"
    />
  ),
  x: <path d="M5 4l14 16M19 4L5 20" />,
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
      <path d="M10 9v6l5-3z" fill="currentColor" stroke="none" />
    </>
  ),
  linkedin: (
    <path
      d="M5.2 3.6a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8zM3.6 9h3.2v11H3.6zM9.4 9h3.1v1.5c.4-.8 1.5-1.8 3.2-1.8 3.4 0 4 2.2 4 5.2V20h-3.2v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V20H9.4z"
      fill="currentColor"
      stroke="none"
    />
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3.5 7l8.5 6.5L20.5 7" />
    </>
  ),
}

const BeeMark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M46 48C32 42 18 30 20 14c16 0 30 16 28 34" />
    <path d="M46 48C40 36 32 28 27 22" strokeWidth="2.2" />
    <path d="M54 48c14-6 28-18 26-34-16 0-30 16-28 34" />
    <path d="M54 48c6-12 14-20 19-26" strokeWidth="2.2" />
    <path d="M50 46c11 0 20 9 20 20 0 13-9 25-20 25S30 79 30 66c0-11 9-20 20-20z" />
    <path d="M33 60c10-3 24-3 34 0M31 70c12-4 26-4 38 0M34 80c9-3 23-3 32 0" strokeWidth="3" />
    <path d="M50 91v6" />
    <circle cx="50" cy="42" r="5" />
    <path d="M47 38c-3-5-7-8-11-9M53 38c3-5 7-8 11-9" strokeWidth="2.6" />
    <circle cx="35.5" cy="28.5" r="2" fill="currentColor" stroke="none" />
    <circle cx="64.5" cy="28.5" r="2" fill="currentColor" stroke="none" />
  </svg>
)

const Link = ({ link, className, style }: { link: HlfLink; className: string; style?: React.CSSProperties }) =>
  link.href ? (
    <a className={className} href={link.href} style={style}>
      {link.label}
    </a>
  ) : (
    <span className={className} style={style}>
      {link.label}
    </span>
  )

export default function HoneyLabelFooter({
  name = "Humm",
  brandHref = "#",
  tagline = "Mint blossom honey",
  medalNote = "100% raw & unfiltered",
  logo,
  claim = { value: "100%", label: "raw & unfiltered" },
  headline = { eyebrow: "Single-origin honey", title: "Mint Blossom", meta: "Net wt. 300 g (10.6 oz)" },
  facts = DEFAULT_FACTS,
  barcode = "893421076310",
  blurb = {
    title: "What the bees made",
    paragraphs: [
      "Gathered from wild mint in bloom on the high valley slopes, then spun cold and poured straight into the jar. Nothing heated, nothing added.",
      "Expect it to crystallise in winter. Stand the jar in warm water and it comes back.",
    ],
  },
  newsletter = DEFAULT_NEWSLETTER,
  onSubscribe,
  columns = DEFAULT_COLUMNS,
  socials = DEFAULT_SOCIALS,
  copyright,
  legal = [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }],
  preset = "auto",
  palette,
  seed = 7,
  density = 1,
  wind = true,
  bee = true,
  maxWidth = "1280px",
  fontFamily = DEFAULT_FONT,
  displayFamily = DEFAULT_DISPLAY,
  height = "760px",
  className,
}: HoneyLabelFooterProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const rootRef = React.useRef(null as HTMLElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const beeRef = React.useRef(null as HTMLDivElement | null)
  const archRef = React.useRef(null as HTMLButtonElement | null)
  const [on, setOn] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)
  const [dark, setDark] = React.useState(false)
  const [calling, setCalling] = React.useState(false)
  const [joined, setJoined] = React.useState(false)
  const pointer = React.useRef({ x: -9999, y: -9999, vx: 0, vy: 0, in: false, at: 0 })
  const callRef = React.useRef(0)

  const base = preset === "auto" ? (dark ? PRESETS.night : PRESETS.mint) : PRESETS[preset] || PRESETS.mint
  const c: HlfPalette = { ...base, ...(palette || {}) } as HlfPalette
  const facts0 = { ...DEFAULT_FACTS, ...facts }
  const code = React.useMemo(() => hlfEan13(barcode), [barcode])
  const bars = React.useMemo(() => hlfBars(code.modules), [code.modules])
  const year = new Date().getFullYear()
  const stems = React.useMemo(() => hlfMeadow(Math.floor(seed) || 0, 3200, density), [seed, density])

  // ---- the host's theme and the visitor's motion preference ----
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const read = () => setDark(!!root.closest(".dark"))
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"], subtree: true })
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => setReduced(mq.matches)
    onMq()
    mq.addEventListener("change", onMq)
    return () => {
      mo.disconnect()
      mq.removeEventListener("change", onMq)
    }
  }, [])

  // ---- the reveal plays once, when a sixth of the footer is on screen ----
  const inViewRef = React.useRef(false)
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (typeof IntersectionObserver === "undefined") {
      inViewRef.current = true
      setOn(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          inViewRef.current = e.isIntersecting
          if (e.isIntersecting && e.intersectionRatio >= 0.12) setOn(true)
        }
      },
      { threshold: [0, 0.12, 0.5] },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  // ---- pointer, in the footer's own coordinates ----
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      const p = pointer.current
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      const now = performance.now()
      const dt = Math.max(8, now - p.at)
      if (p.in) {
        p.vx = ((x - p.x) / dt) * 1000
        p.vy = ((y - p.y) / dt) * 1000
      }
      p.x = x
      p.y = y
      p.at = now
      p.in = true
    }
    const onLeave = () => {
      pointer.current.in = false
      pointer.current.vx = 0
      pointer.current.vy = 0
    }
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    return () => {
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  // ---- the meadow, the pollen and the bee ----
  const opts = React.useRef({ wind, bee, reduced })
  opts.current = { wind, bee, reduced }
  const tones = React.useMemo(() => [hazed(c, HLF_LAYER_HAZE[0]), hazed(c, HLF_LAYER_HAZE[1]), hazed(c, HLF_LAYER_HAZE[2])], [c.haze, c.stem, c.leaf[0], c.leaf[1], c.leaf[2], c.petal[0], c.petal[1], c.petal[2], c.petal[3], c.eye, c.bud]) // eslint-disable-line react-hooks/exhaustive-deps
  const pollenRef = React.useRef(c.pollen)
  pollenRef.current = c.pollen
  // The reveal plays once: a theme or palette change rebuilds the sprites in
  // new colours without regrowing the meadow or sending the bee home.
  const startRef = React.useRef(0)
  const beeRef2 = React.useRef(null as HlfBeeState | null)

  useIso(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const beeEl = beeRef.current
    if (!root || !canvas || !on) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let dpr = 1
    let spriteDpr = 1
    let centre = 0
    const sprites: (HlfSprite | null)[] = stems.map(() => null)
    const bend = new Float32Array(stems.length)
    const bendV = new Float32Array(stems.length)
    const motes: HlfMote[] = []
    if (!startRef.current) startRef.current = performance.now()
    const t0 = startRef.current
    const progress = new Float32Array(stems.length)
    let raf = 0
    let last = performance.now()
    let grown = false
    let stillFrames = 0

    const fit = () => {
      const r = root.getBoundingClientRect()
      const w = Math.max(1, Math.round(r.width))
      const d = Math.min(2, window.devicePixelRatio || 1)
      if (w === width && d === dpr) return
      width = w
      dpr = d
      centre = w / 2
      canvas.width = Math.round(w * d)
      canvas.height = Math.round(HLF_MEADOW_H * d)
      canvas.style.width = w + "px"
      canvas.style.height = HLF_MEADOW_H + "px"
      const sd = Math.min(1.5, d)
      if (sd !== spriteDpr) {
        spriteDpr = sd
        sprites.fill(null)
      }
    }
    const ro = new ResizeObserver(() => {
      fit()
      stillFrames = 0
      if (!raf) raf = requestAnimationFrame(frame)
    })
    ro.observe(root)
    fit()

    const visible = (s: HlfStem) => Math.abs(s.x) < centre + 140

    const sprite = (i: number): HlfSprite => {
      const have = sprites[i]
      if (have) return have
      const s = stems[i]
      const box = hlfStemBox(s)
      const sc = HLF_LAYER_SCALE[s.layer] * spriteDpr
      const c2 = document.createElement("canvas")
      c2.width = Math.max(1, Math.ceil((box.right - box.left) * sc))
      c2.height = Math.max(1, Math.ceil((box.bottom - box.top) * sc))
      const x2 = c2.getContext("2d")
      if (x2) {
        x2.scale(sc, sc)
        x2.translate(-box.left, -box.top)
        paintStem(x2, s, 1, tones[s.layer])
      }
      const made = { c: c2, ox: box.left, oy: box.top, s: 1 / spriteDpr }
      sprites[i] = made
      return made
    }

    const fresh = !beeRef2.current
    const beeSt: HlfBeeState = beeRef2.current || { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, mode: 0, until: 0, face: 1, seed: 1, at: -1 }
    beeRef2.current = beeSt
    const beeRng = hlfRng(Math.floor(seed * 7919) + 3)
    const flowerAt = (i: number): [number, number] => {
      const s = stems[i]
      const [tx, ty] = hlfStemAt(s, 0.93)
      const sc = HLF_LAYER_SCALE[s.layer]
      return [centre + s.x + tx * sc, HLF_TOP + s.root + ty * sc]
    }
    const pickFlower = (avoid: number): number => {
      const pool: number[] = []
      for (let i = 0; i < stems.length; i++) {
        const s = stems[i]
        if (s.kind && s.layer > 0 && i !== avoid && Math.abs(s.x) < centre - 30 && Math.abs(s.x) > 150) pool.push(i)
      }
      if (!pool.length) return -1
      // prefer somewhere not too far from here, so it reads as foraging
      let best = pool[Math.floor(beeRng() * pool.length)]
      for (let k = 0; k < 3; k++) {
        const cand = pool[Math.floor(beeRng() * pool.length)]
        const [bx] = flowerAt(best)
        const [cx] = flowerAt(cand)
        if (Math.abs(cx - beeSt.x) < Math.abs(bx - beeSt.x) && Math.abs(cx - beeSt.x) > 90) best = cand
      }
      return best
    }
    const archPos = (): [number, number] => {
      const a = archRef.current
      if (!a) return [centre, HLF_TOP + 60]
      const ar = a.getBoundingClientRect()
      const rr = root.getBoundingClientRect()
      return [ar.left - rr.left + ar.width / 2, ar.top - rr.top + ar.height * 0.42]
    }
    if (fresh) {
      const [ax, ay] = archPos()
      beeSt.x = ax
      beeSt.y = ay
      beeSt.tx = ax
      beeSt.ty = ay
      beeSt.until = t0 + 2600
    }

    const spawn = (x: number, y: number, n: number, up: number) => {
      for (let k = 0; k < n && motes.length < 80; k++) {
        motes.push({
          x: x + (beeRng() - 0.5) * 8,
          y: y + (beeRng() - 0.5) * 6,
          vx: (beeRng() - 0.5) * 26,
          vy: -up * (10 + beeRng() * 22),
          life: 1,
          r: 1 + beeRng() * 1.4,
        })
      }
    }

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = (now - t0) / 1000
      const o = opts.current
      const p = pointer.current
      const still = o.reduced
      const pointerIn = p.in && p.y < HLF_MEADOW_H + 20
      let busy = false

      // --- growth ---
      let allGrown = true
      for (let i = 0; i < stems.length; i++) {
        const s = stems[i]
        const pr = still ? 1 : hlfClamp((t - s.delay) / s.dur, 0, 1)
        progress[i] = pr
        if (pr < 1 && visible(s)) allGrown = false
      }
      if (!allGrown) busy = true
      grown = allGrown

      // --- wind and the pointer parting the stems ---
      const windOn = o.wind && !still
      for (let i = 0; i < stems.length; i++) {
        const s = stems[i]
        if (!visible(s)) continue
        let target = 0
        if (windOn && pointerIn) {
          const sx = centre + s.x
          const sy = HLF_TOP + s.root
          const dx = p.x - sx
          const reachY = s.h * HLF_LAYER_SCALE[s.layer]
          const inY = p.y > sy - reachY - 24 && p.y < sy + 12
          const r = 120
          if (inY && Math.abs(dx) < r) {
            const k = 1 - Math.abs(dx) / r
            // lean away from the pointer, more when it is higher up the stem
            const lift = hlfClamp((sy - p.y) / reachY, 0.15, 1)
            target = -Math.sign(dx || 1) * k * k * 0.34 * lift
          }
        }
        const v = bendV[i] + (target - bend[i]) * 48 * dt - bendV[i] * 6.5 * dt
        bendV[i] = v
        bend[i] += v * dt
        if (Math.abs(bend[i]) > 0.002 || Math.abs(v) > 0.01) busy = true
      }

      // --- pollen: a quick pass through the flowers shakes some loose ---
      const speed = Math.hypot(p.vx, p.vy)
      if (windOn && pointerIn && speed > 260 && grown) {
        let nearest = -1
        let nd = 70
        for (let i = 0; i < stems.length; i++) {
          const s = stems[i]
          if (!s.kind || s.layer === 0) continue
          const [fx, fy] = flowerAt(i)
          const d = Math.hypot(fx - p.x, fy - p.y)
          if (d < nd) {
            nd = d
            nearest = i
          }
        }
        if (nearest >= 0 && beeRng() < 0.5) {
          const [fx, fy] = flowerAt(nearest)
          spawn(fx, fy, 1, 1)
        }
      }
      p.vx *= 0.8
      p.vy *= 0.8

      // --- the bee ---
      if (o.bee && still) {
        // reduced motion: it sits on a flower and stays there
        const b = beeSt
        if (b.at < 0 || b.mode !== 2) {
          const f = pickFlower(-1)
          if (f >= 0) {
            const [fx, fy] = flowerAt(f)
            b.x = fx
            b.y = fy - 9
            b.at = f
            b.mode = 2
            b.face = 1
          }
        }
        if (beeEl) {
          beeEl.style.transform = "translate(" + b.x.toFixed(1) + "px," + b.y.toFixed(1) + "px) translate(-13px,-10px)"
          beeEl.style.opacity = b.at >= 0 ? "1" : "0"
        }
      } else if (o.bee) {
        const b = beeSt
        if (callRef.current) {
          callRef.current = 0
          b.mode = 3
          b.until = now + 2800
          b.at = -1
        }
        if (b.mode === 0 && now > b.until && grown) {
          const f = pickFlower(-1)
          if (f >= 0) {
            const [fx, fy] = flowerAt(f)
            b.tx = fx
            b.ty = fy - 10
            b.at = f
            b.mode = 1
          }
        } else if (b.mode === 1) {
          const d = Math.hypot(b.tx - b.x, b.ty - b.y)
          if (d < 9) {
            b.mode = 2
            b.until = now + 1400 + beeRng() * 2200
            if (b.at >= 0) spawn(b.tx, b.ty + 8, 3, 0.6)
          }
        } else if (b.mode === 2) {
          const [fx, fy] = b.at >= 0 ? flowerAt(b.at) : [b.tx, b.ty]
          b.tx = fx + Math.sin(t * 2.1) * 7
          b.ty = fy - 10 + Math.cos(t * 3.3) * 4
          if (now > b.until) {
            const f = pickFlower(b.at)
            if (f >= 0) {
              const [nx, ny] = flowerAt(f)
              b.tx = nx
              b.ty = ny - 10
              b.at = f
              b.mode = 1
            } else b.until = now + 2000
          }
        } else if (b.mode === 3) {
          const [hx, hy] = archPos()
          const k = (now - (b.until - 2800)) / 2800
          const ang = k * Math.PI * 2 * 1.5 - Math.PI / 2
          b.tx = hx + Math.cos(ang) * 46
          b.ty = hy - 30 + Math.sin(ang) * 22
          if (now > b.until) {
            b.mode = 1
            const f = pickFlower(-1)
            if (f >= 0) {
              const [nx, ny] = flowerAt(f)
              b.tx = nx
              b.ty = ny - 10
              b.at = f
            }
          }
        }
        // steer: spring toward the target, stay clear of the pointer
        let ax2 = (b.tx - b.x) * 9
        let ay2 = (b.ty - b.y) * 9
        if (p.in) {
          const dx = b.x - p.x
          const dy = b.y - p.y
          const d = Math.hypot(dx, dy)
          if (d < 90 && d > 0.01) {
            const push = ((90 - d) / 90) * 2600
            ax2 += (dx / d) * push
            ay2 += (dy / d) * push
          }
        }
        b.vx += ax2 * dt
        b.vy += ay2 * dt
        const damp = Math.exp(-4.2 * dt)
        b.vx *= damp
        b.vy *= damp
        const sp = Math.hypot(b.vx, b.vy)
        const max = b.mode === 3 ? 260 : 190
        if (sp > max) {
          b.vx *= max / sp
          b.vy *= max / sp
        }
        b.x += b.vx * dt
        b.y += b.vy * dt + Math.sin(t * 9) * 0.25
        if (b.vx > 18) b.face = 1
        else if (b.vx < -18) b.face = -1
        if (beeEl) {
          const tilt = hlfClamp(b.vx * 0.06, -16, 16)
          beeEl.style.transform = "translate(" + b.x.toFixed(1) + "px," + b.y.toFixed(1) + "px) translate(-13px,-10px) rotate(" + tilt.toFixed(1) + "deg) scaleX(" + b.face + ")"
          beeEl.style.opacity = b.mode === 0 ? "0" : "1"
        }
        if (b.mode !== 0 || !grown) busy = true
      } else if (beeEl) beeEl.style.opacity = "0"

      // --- paint ---
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, HLF_MEADOW_H)
      for (let i = 0; i < stems.length; i++) {
        const s = stems[i]
        if (!visible(s)) continue
        const pr = progress[i]
        if (pr <= 0) continue
        const sway = windOn ? s.amp * Math.sin(t * s.omega + s.phase) + 0.012 * Math.sin(t * 0.37 + s.x * 0.004) : 0
        const ang = sway + bend[i]
        const sc = HLF_LAYER_SCALE[s.layer]
        ctx.save()
        ctx.translate(centre + s.x, HLF_TOP + s.root)
        ctx.rotate(ang)
        if (pr >= 1) {
          const sp = sprite(i)
          const k = sp.s
          ctx.drawImage(sp.c, sp.ox * sc, sp.oy * sc, sp.c.width * k, sp.c.height * k)
        } else {
          ctx.scale(sc, sc)
          paintStem(ctx, s, pr, tones[s.layer])
        }
        ctx.restore()
      }
      if (motes.length) {
        busy = true
        ctx.fillStyle = pollenRef.current
        for (let i = motes.length - 1; i >= 0; i--) {
          const m = motes[i]
          m.life -= dt * 0.55
          if (m.life <= 0) {
            motes.splice(i, 1)
            continue
          }
          m.x += (m.vx + Math.sin(t * 5 + m.r * 7) * 12) * dt
          m.y += m.vy * dt
          m.vy += 4 * dt
          ctx.globalAlpha = Math.min(1, m.life * 1.6) * 0.9
          ctx.beginPath()
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      if (windOn) busy = true
      if (busy) stillFrames = 0
      else stillFrames++
      // keep going while anything moves and the footer is on screen; a few
      // extra frames let the last transition settle
      if ((busy || stillFrames < 3) && (inViewRef.current || !grown)) raf = requestAnimationFrame(frame)
    }

    // the still frame first, so a paused page still shows a finished meadow
    raf = requestAnimationFrame(frame)
    // waking up when scrolled back on screen
    const onVis = () => {
      if (!raf && document.visibilityState === "visible") {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener("visibilitychange", onVis)
    const io2 =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (es) => {
              for (const e of es) {
                inViewRef.current = e.isIntersecting
                if (e.isIntersecting && !raf) {
                  last = performance.now()
                  raf = requestAnimationFrame(frame)
                }
              }
            },
            { threshold: 0 },
          )
    if (io2) io2.observe(root)
    const onEnter = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    root.addEventListener("pointermove", onEnter)

    return () => {
      cancelAnimationFrame(raf)
      raf = 0
      ro.disconnect()
      if (io2) io2.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      root.removeEventListener("pointermove", onEnter)
    }
  }, [on, stems, tones, seed])

  const callBee = () => {
    callRef.current = 1
    setCalling(true)
    window.setTimeout(() => setCalling(false), 900)
  }

  const news = newsletter ? { ...DEFAULT_NEWSLETTER, ...newsletter } : null
  const newsId = "hlf-news-" + uid
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const input = form.elements.namedItem(newsId) as HTMLInputElement | null
    const email = input ? input.value.trim() : ""
    if (!email) return
    if (onSubscribe) onSubscribe(email)
    setJoined(true)
    if (input) input.value = ""
  }

  const copy = copyright ?? "© " + year + " " + name + ". All rights reserved."
  const rows = facts0.rows || []
  const style = {
    "--hlf-band": c.band,
    "--hlf-panel": c.panel,
    "--hlf-arch": c.arch,
    "--hlf-medal": c.medal,
    "--hlf-ink": c.ink,
    "--hlf-muted": c.muted,
    "--hlf-line": c.line,
    "--hlf-paper": c.paper,
    "--hlf-paper-ink": c.paperInk,
    "--hlf-accent": c.accent,
    "--hlf-bee": c.bee[0],
    "--hlf-bee-ink": c.bee[1],
    "--hlf-display": displayFamily,
    minHeight: height,
    fontFamily,
  } as React.CSSProperties

  let d = 0.9
  const step = (by: number) => {
    const v = d
    d += by
    return { "--d": v.toFixed(2) + "s" } as React.CSSProperties
  }
  const mark = logo ?? <BeeMark className="hlf-mark" />
  const arcId = "hlf-arc-" + uid

  return (
    <footer
      ref={rootRef}
      className={"hlf" + (on ? " hlf-on" : "") + (reduced ? " hlf-rm" : "") + (calling ? " hlf-calling" : "") + (className ? " " + className : "")}
      style={style}
    >
      <style>{HLF_CSS}</style>

      <div className="hlf-band" aria-hidden="true" />

      <div className="hlf-meadow" aria-hidden="true">
        <canvas ref={canvasRef} className="hlf-canvas" />
        <div ref={beeRef} className="hlf-bee">
          <svg viewBox="0 0 26 20" width="26" height="20">
            <g className="hlf-wing hlf-wing-a">
              <ellipse cx="11" cy="5.5" rx="4.6" ry="3" transform="rotate(-24 11 5.5)" />
            </g>
            <g className="hlf-wing hlf-wing-b">
              <ellipse cx="16.5" cy="5.5" rx="4.6" ry="3" transform="rotate(-6 16.5 5.5)" />
            </g>
            <ellipse cx="14" cy="12" rx="8" ry="5.4" fill="var(--hlf-bee)" />
            <path d="M10.4 7.2c-.6 3.2-.6 6.4 0 9.6M14 6.6c-.4 3.6-.4 7.2 0 10.8M17.6 7.4c.6 3 .6 6.2 0 9.2" stroke="var(--hlf-bee-ink)" strokeWidth="1.9" fill="none" />
            <path d="M21.6 12.6l3 .9" stroke="var(--hlf-bee-ink)" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="6.2" cy="11.2" r="3.7" fill="var(--hlf-bee-ink)" />
            <circle cx="5.3" cy="10.3" r="1" fill="#fff" />
            <path d="M5 7.8c-.8-1.6-1.8-2.4-3-2.8M7.2 7.6c.2-1.8-.2-3-1-3.8" stroke="var(--hlf-bee-ink)" strokeWidth="1" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="hlf-body" style={{ maxWidth }}>
        <div className="hlf-grid">
          <div className="hlf-left">
          <div className="hlf-col-facts">
            <section className="hlf-facts" aria-label={facts0.title} style={step(0.1)}>
              <h3 className="hlf-facts-title">{facts0.title}</h3>
              {facts0.serving ? <p className="hlf-facts-serve">{facts0.serving}</p> : null}
              <span className="hlf-rule hlf-rule-xl" style={step(0.06)} />
              {facts0.headline ? (
                <>
                  {facts0.amountLabel ? <p className="hlf-facts-amount">{facts0.amountLabel}</p> : null}
                  <p className="hlf-facts-cal">
                    <span>{facts0.headline[0]}</span>
                    <span>{facts0.headline[1]}</span>
                  </p>
                  <span className="hlf-rule hlf-rule-md" style={step(0.06)} />
                </>
              ) : null}
              {facts0.dvLabel ? (
                <>
                  <p className="hlf-facts-dv">{facts0.dvLabel}</p>
                  <span className="hlf-rule" style={step(0.04)} />
                </>
              ) : null}
              {rows.map((r, i) => (
                <React.Fragment key={i}>
                  <p className={"hlf-facts-row" + (r.sub ? " hlf-facts-sub" : "")}>
                    <span>
                      <b>{r.label}</b> {r.value}
                    </span>
                    {r.pct ? <b>{r.pct}</b> : null}
                  </p>
                  <span className={"hlf-rule" + (i === rows.length - 1 ? " hlf-rule-lg" : "")} style={step(0.04)} />
                </React.Fragment>
              ))}
              {facts0.footnote ? <p className="hlf-facts-note">{facts0.footnote}</p> : null}
            </section>

            <div className="hlf-barcode" style={step(0.3)}>
              <svg viewBox="0 0 113 62" role="img" aria-label={"EAN-13 " + code.digits}>
                {bars.map(([x, w], i) => {
                  const guard = x < 3 || (x >= 45 && x < 50) || x >= 92
                  return (
                    <rect
                      key={i}
                      className="hlf-bar"
                      x={9 + x}
                      y={4}
                      width={w}
                      height={guard ? 50 : 44}
                      style={{ "--d": (1.5 + i * 0.012).toFixed(3) + "s" } as React.CSSProperties}
                    />
                  )
                })}
                <text className="hlf-bar-digits" x="7.5" y="59" textAnchor="end" fontSize="7" fontWeight="600" letterSpacing="0">
                  {code.digits[0]}
                </text>
                <text className="hlf-bar-digits" x="33.5" y="59" textAnchor="middle" fontSize="7" fontWeight="600" letterSpacing="1.3">
                  {code.digits.slice(1, 7)}
                </text>
                <text className="hlf-bar-digits" x="80.5" y="59" textAnchor="middle" fontSize="7" fontWeight="600" letterSpacing="1.3">
                  {code.digits.slice(7)}
                </text>
              </svg>
            </div>
          </div>

          <div className="hlf-col-blurb" style={step(0.1)}>
            {blurb.title ? <h3 className="hlf-h">{blurb.title}</h3> : null}
            {(blurb.paragraphs || []).map((p, i) => (
              <p key={i} className="hlf-p" style={step(0.08)}>
                {p}
              </p>
            ))}
          </div>
          </div>

          <div className="hlf-centre">
          <div className="hlf-tag">
            <span className="hlf-tag-stem" aria-hidden="true" />
            <a className="hlf-medal" href={brandHref} aria-label={name + " — " + tagline}>
              <svg className="hlf-medal-svg" viewBox="0 0 200 200" aria-hidden="true">
                <defs>
                  <path id={arcId} d="M28 100a72 72 0 0 1 144 0" />
                </defs>
                <circle cx="100" cy="100" r="99" fill="var(--hlf-medal)" />
                <circle className="hlf-medal-ring" cx="100" cy="100" r="93" fill="none" stroke="var(--hlf-ink)" strokeWidth="1" strokeDasharray="1.5 4.5" strokeLinecap="round" />
                <text className="hlf-medal-arc" fill="var(--hlf-ink)" fontSize="14" fontWeight="600" letterSpacing="2.4">
                  <textPath href={"#" + arcId} startOffset="50%" textAnchor="middle">
                    {tagline}
                  </textPath>
                </text>
              </svg>
              <span className="hlf-medal-mark">{mark}</span>
              <span className="hlf-medal-name">{name}</span>
              <span className="hlf-medal-note">{medalNote}</span>
              <span className="hlf-medal-rule" aria-hidden="true" />
            </a>
          </div>
            <button ref={archRef} type="button" className="hlf-arch" onClick={callBee} aria-label="Call the bee" title="Call the bee">
              <span className="hlf-arch-mark">{mark}</span>
              <span className="hlf-arch-name">{name}</span>
            </button>
            <div className="hlf-panel" style={step(0.15)}>
              <div className="hlf-claim">
                {claim.value ? <span className="hlf-claim-value">{claim.value}</span> : null}
                {claim.label ? <span className="hlf-claim-label">{claim.label}</span> : null}
              </div>
              <div className="hlf-headline">
                {headline.eyebrow ? <span className="hlf-eyebrow">{headline.eyebrow}</span> : null}
                {headline.title ? <span className="hlf-title">{headline.title}</span> : null}
                <span className="hlf-headline-rule" style={step(0.1)} />
                {headline.meta ? <span className="hlf-meta">{headline.meta}</span> : null}
              </div>
            </div>
            {news ? (
              <form className="hlf-news" style={step(0.12)} onSubmit={onSubmit}>
                <label className="hlf-news-label" htmlFor={newsId}>
                  <span className="hlf-h">{news.title}</span>
                  {news.hint ? <span className="hlf-news-hint">{news.hint}</span> : null}
                </label>
                <div className="hlf-news-row">
                  <input id={newsId} name={newsId} className="hlf-news-input" type="email" required autoComplete="email" placeholder={news.placeholder} />
                  <button type="submit" className="hlf-news-btn">
                    {news.button}
                  </button>
                </div>
                <p className="hlf-news-ok" aria-live="polite">
                  {joined ? news.thanks : ""}
                </p>
              </form>
            ) : null}
          </div>

          <nav className="hlf-cols" aria-label="Footer">
            {columns.map((col, i) => (
              <div key={i} className="hlf-col" style={step(0.1)}>
                <h3 className="hlf-h">{col.title}</h3>
                <ul>
                  {col.links.map((l, j) => (
                    <li key={j}>
                      <Link link={l} className="hlf-link" style={step(0.045)} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="hlf-strip" style={step(0.1)}>
          <p className="hlf-copy">
            <span>{copy}</span>
            {legal.map((l, i) => (
              <Link key={i} link={l} className="hlf-legal" />
            ))}
          </p>
          <ul className="hlf-socials">
            {socials.map((s, i) => {
              const key = typeof s.icon === "string" ? s.icon : ""
              const label = s.label || SOCIAL_NAMES[key] || "Social"
              const glyph =
                typeof s.icon === "string" ? (
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {SOCIAL_PATHS[key]}
                  </svg>
                ) : (
                  s.icon
                )
              return (
                <li key={i} style={step(0.06)}>
                  <a className="hlf-social" href={s.href || "#"} aria-label={label} title={label}>
                    {glyph}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export type HlfPaletteOverrides = Partial<HlfPalette>

const HLF_CSS = `
.hlf {
  --hlf-top: 250px;
  --hlf-ease: cubic-bezier(.2, .8, .2, 1);
  --hlf-pop: cubic-bezier(.34, 1.56, .64, 1);
  position: relative; width: 100%; isolation: isolate; overflow: hidden;
  color: var(--hlf-ink); line-height: 1.45; -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}
.hlf *, .hlf *::before, .hlf *::after { box-sizing: border-box; }
.hlf h3, .hlf p, .hlf ul { margin: 0; }
.hlf ul { list-style: none; padding: 0; }
.hlf a { color: inherit; text-decoration: none; }
.hlf :focus-visible { outline: 2px solid var(--hlf-accent); outline-offset: 3px; border-radius: 4px; }

/* ---- the band wraps on from the centre ---- */
.hlf-band {
  position: absolute; left: 0; right: 0; bottom: 0; top: var(--hlf-top); z-index: 0;
  background: var(--hlf-band);
  clip-path: inset(0 50% 0 50%);
  transition: clip-path 1.05s var(--hlf-ease);
}
.hlf-band::before {
  content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px;
  background: var(--hlf-line); opacity: .35;
}
.hlf-on .hlf-band { clip-path: inset(0 0 0 0); }

/* ---- the meadow ---- */
.hlf-meadow { position: absolute; left: 0; top: 0; right: 0; height: 420px; z-index: 1; pointer-events: none; }
.hlf-canvas { display: block; width: 100%; height: 420px; max-width: none; }
.hlf-bee {
  position: absolute; left: 0; top: 0; width: 26px; height: 20px; opacity: 0; will-change: transform;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, .18));
}
.hlf-bee svg { display: block; width: 26px; height: 20px; overflow: visible; }
.hlf-wing { fill: rgba(255, 255, 255, .78); stroke: rgba(20, 20, 20, .45); stroke-width: .8; transform-origin: 13.5px 9px; }
.hlf-wing-a { animation: hlf-flap .08s linear infinite alternate; }
.hlf-wing-b { animation: hlf-flap .08s linear infinite alternate-reverse; }
@keyframes hlf-flap { from { transform: rotate(-14deg) scaleY(1); } to { transform: rotate(14deg) scaleY(.7); } }

/* ---- the medallion on its stem ---- */
.hlf-tag {
  position: absolute; left: 50%; top: -350px; z-index: 0; width: 184px; height: 184px; margin-left: -92px;
  pointer-events: none;
}
.hlf-tag-stem {
  position: absolute; left: 50%; top: 170px; width: 18px; height: 112px; margin-left: -9px;
  background: var(--hlf-medal); transform-origin: 50% 100%; transform: scaleY(0);
  transition: transform .5s var(--hlf-ease) .75s;
}
.hlf-on .hlf-tag-stem { transform: scaleY(1); }
.hlf-medal {
  position: relative; display: block; width: 184px; height: 184px; border-radius: 50%; pointer-events: auto;
  transform: scale(.55); opacity: 0; transform-origin: 50% 100%;
  transition: transform .75s var(--hlf-pop) 1.05s, opacity .35s linear 1.05s, filter .4s var(--hlf-ease);
  filter: drop-shadow(0 10px 14px rgba(0, 0, 0, .12));
}
.hlf-on .hlf-medal { transform: scale(1); opacity: 1; }
.hlf-medal-svg { position: absolute; inset: 0; display: block; width: 184px; height: 184px; overflow: visible; }
.hlf-medal-arc, .hlf-medal-name, .hlf-medal-note, .hlf-medal-rule, .hlf-medal-mark {
  opacity: 0; transition: opacity .5s linear;
}
.hlf-on .hlf-medal-arc { opacity: 1; transition-delay: 1.45s; }
.hlf-on .hlf-medal-mark { opacity: 1; transition-delay: 1.55s; }
.hlf-on .hlf-medal-name { opacity: 1; transition-delay: 1.65s; }
.hlf-on .hlf-medal-note { opacity: 1; transition-delay: 1.75s; }
.hlf-on .hlf-medal-rule { opacity: 1; transition-delay: 1.85s; }
.hlf-medal-arc { font-family: inherit; }
.hlf-medal-ring { transform-origin: 100px 100px; }
.hlf-medal:hover .hlf-medal-ring, .hlf-medal:focus-visible .hlf-medal-ring { animation: hlf-turn 16s linear infinite; }
@keyframes hlf-turn { to { transform: rotate(360deg); } }
.hlf-medal-mark {
  position: absolute; left: 50%; top: 44px; width: 64px; height: 60px; margin-left: -32px;
  display: flex; align-items: center; justify-content: center; color: var(--hlf-ink);
}
.hlf-medal-mark .hlf-mark { width: 60px; height: 60px; display: block; }
.hlf-medal-mark > * { max-width: 64px; max-height: 60px; }
.hlf-medal-name {
  position: absolute; left: 0; right: 0; top: 104px; text-align: center; font-family: var(--hlf-display);
  font-size: 38px; font-weight: 900; letter-spacing: -1.2px; line-height: 1; color: var(--hlf-ink); white-space: nowrap;
}
.hlf-medal-note {
  position: absolute; left: 12px; right: 12px; top: 146px; text-align: center;
  font-size: 11px; font-weight: 600; letter-spacing: .04em; line-height: 1.1; color: var(--hlf-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hlf-medal-rule { position: absolute; left: 50%; top: 165px; width: 68px; height: 1.5px; margin-left: -34px; background: var(--hlf-ink); }
.hlf-medal:hover .hlf-medal-mark, .hlf-calling .hlf-medal-mark { animation: hlf-buzz .5s ease-in-out; }
@keyframes hlf-buzz {
  0%, 100% { transform: translate(0, 0) rotate(0); }
  20% { transform: translate(-1.5px, 1px) rotate(-4deg); }
  40% { transform: translate(1.5px, -1px) rotate(4deg); }
  60% { transform: translate(-1px, -1px) rotate(-3deg); }
  80% { transform: translate(1px, 1px) rotate(3deg); }
}

/* ---- the body ---- */
.hlf-body {
  position: relative; z-index: 2; margin: 0 auto; padding: calc(var(--hlf-top) + 100px) 32px 26px;
}
.hlf-grid {
  display: grid; grid-template-columns: minmax(0, 1fr) 372px minmax(0, 1fr);
  gap: 0 30px; align-items: start;
}
.hlf-left { display: grid; grid-template-columns: 208px minmax(0, 1fr); gap: 0 24px; align-items: start; }

/* the sticker */
.hlf-col-facts { margin-top: -40px; }
.hlf-facts {
  background: var(--hlf-paper); color: var(--hlf-paper-ink); border: 1.5px solid var(--hlf-paper-ink);
  padding: 8px 9px 7px; border-radius: 3px; line-height: 1.2; font-size: 11.5px;
  opacity: 0; transform: translateY(18px);
  transition: opacity .5s linear var(--d), transform .7s var(--hlf-ease) var(--d);
}
.hlf-on .hlf-facts { opacity: 1; transform: none; }
.hlf-facts-title { font-size: 23px; font-weight: 900; letter-spacing: -.5px; line-height: 1; }
.hlf-facts-serve { margin-top: 4px; font-size: 11.5px; font-weight: 500; }
.hlf-rule {
  display: block; height: 1px; background: var(--hlf-paper-ink); margin: 3px 0;
  transform-origin: 0 50%; transform: scaleX(0); transition: transform .5s var(--hlf-ease) var(--d);
}
.hlf-on .hlf-rule { transform: scaleX(1); }
.hlf-rule-xl { height: 8px; margin: 5px 0 3px; }
.hlf-rule-md { height: 4px; margin: 3px 0; }
.hlf-rule-lg { height: 6px; margin: 3px 0 5px; }
.hlf-facts-amount { font-size: 9px; font-weight: 700; }
.hlf-facts-cal { display: flex; justify-content: space-between; align-items: baseline; font-size: 20px; font-weight: 900; line-height: 1.05; }
.hlf-facts-cal span:last-child { font-size: 24px; }
.hlf-facts-dv { text-align: right; font-size: 9px; font-weight: 600; }
.hlf-facts-row { display: flex; justify-content: space-between; gap: 10px; padding: 1px 0; }
.hlf-facts-sub { padding-left: 12px; }
.hlf-facts-sub b { font-weight: 500; }
.hlf-facts-note { font-size: 9px; line-height: 1.3; opacity: .9; }

.hlf-barcode {
  margin-top: 14px; display: block; width: 208px; background: var(--hlf-paper); padding: 3px 5px 0; border-radius: 3px;
  opacity: 0; transition: opacity .4s linear var(--d);
}
.hlf-on .hlf-barcode { opacity: 1; }
.hlf-barcode svg { display: block; width: 100%; height: auto; max-width: none; }
.hlf-bar { fill: var(--hlf-paper-ink); transform-origin: 50% 54px; transform: scaleY(0); transition: transform .32s cubic-bezier(.2, .9, .3, 1) var(--d); }
.hlf-on .hlf-bar { transform: scaleY(1); }
.hlf-bar-digits { fill: var(--hlf-paper-ink); font-family: inherit; opacity: 0; transition: opacity .4s linear 2.3s; }
.hlf-on .hlf-bar-digits { opacity: 1; }

/* the prose */
.hlf-col-blurb { padding-top: 24px; max-width: 260px; }
.hlf-h {
  font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--hlf-ink);
  margin-bottom: 10px; opacity: 0; transform: translateY(10px);
  transition: opacity .45s linear var(--d), transform .6s var(--hlf-ease) var(--d);
}
.hlf-on .hlf-h { opacity: 1; transform: none; }
.hlf-p {
  font-size: 12.5px; line-height: 1.55; color: var(--hlf-muted); opacity: 0; transform: translateY(10px);
  transition: opacity .45s linear var(--d), transform .6s var(--hlf-ease) var(--d);
}
.hlf-p + .hlf-p { margin-top: 10px; }
.hlf-on .hlf-p { opacity: 1; transform: none; }

/* the arch and the centre panel */
.hlf-centre { position: relative; padding-top: 0; }
.hlf-arch {
  position: absolute; left: 50%; top: -80px; width: 156px; height: 82px; margin-left: -78px; padding: 0 0 6px; z-index: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 0;
  border: 1.5px solid var(--hlf-line); border-bottom: 0; border-radius: 78px 78px 0 0;
  background: var(--hlf-arch); color: var(--hlf-ink); cursor: pointer; font: inherit;
  -webkit-tap-highlight-color: transparent;
  transform: translateY(26px); opacity: 0;
  transition: transform .7s var(--hlf-ease) .62s, opacity .4s linear .62s, background .25s;
}
.hlf-on .hlf-arch { transform: none; opacity: 1; }
.hlf-arch:hover { background: color-mix(in srgb, var(--hlf-arch) 85%, #fff); }
.hlf-arch:active .hlf-arch-mark { transform: translateY(1px) scale(.96); }
.hlf-arch-mark { display: block; width: 34px; height: 34px; color: var(--hlf-ink); transition: transform .15s; }
.hlf-arch-mark .hlf-mark { width: 34px; height: 34px; display: block; }
.hlf-arch-mark > * { max-width: 34px; max-height: 34px; }
.hlf-calling .hlf-arch-mark { animation: hlf-buzz .5s ease-in-out; }
.hlf-arch-name { font-family: var(--hlf-display); font-size: 21px; font-weight: 900; letter-spacing: -.5px; line-height: 1; margin-top: 2px; }
.hlf-panel {
  display: grid; grid-template-columns: 118px 1fr; border: 1.5px solid var(--hlf-line); border-radius: 8px;
  background: var(--hlf-panel); min-height: 150px;
  opacity: 0; transform: translateY(16px);
  transition: opacity .5s linear var(--d), transform .7s var(--hlf-ease) var(--d);
}
.hlf-on .hlf-panel { opacity: 1; transform: none; }
.hlf-claim {
  display: flex; flex-direction: column; justify-content: center; padding: 18px 12px; text-align: center;
  border-right: 1.5px solid var(--hlf-line);
}
.hlf-claim-value { font-size: 34px; font-weight: 900; letter-spacing: -1px; line-height: 1; }
.hlf-claim-label { margin-top: 6px; font-size: 12px; font-weight: 500; color: var(--hlf-muted); line-height: 1.25; }
.hlf-headline { display: flex; flex-direction: column; justify-content: center; padding: 18px 20px; }
.hlf-eyebrow { font-size: 13px; font-weight: 500; letter-spacing: .01em; color: var(--hlf-muted); }
.hlf-title { margin-top: 3px; font-size: 23px; font-weight: 900; letter-spacing: -.3px; text-transform: uppercase; line-height: 1.05; }
.hlf-headline-rule {
  display: block; height: 1.5px; background: var(--hlf-line); margin: 10px 0 8px; width: 100%;
  transform-origin: 0 50%; transform: scaleX(0); transition: transform .6s var(--hlf-ease) var(--d);
}
.hlf-on .hlf-headline-rule { transform: scaleX(1); }
.hlf-meta { font-size: 13px; font-weight: 700; letter-spacing: .02em; }

/* the sign-up */
.hlf-news { margin-top: 22px; opacity: 0; transform: translateY(10px); transition: opacity .45s linear var(--d), transform .6s var(--hlf-ease) var(--d); }
.hlf-on .hlf-news { opacity: 1; transform: none; }
.hlf-news-label { display: flex; flex-direction: column; gap: 0; cursor: pointer; }
.hlf-news-label .hlf-h { margin-bottom: 3px; }
.hlf-news-hint { font-size: 12.5px; color: var(--hlf-muted); margin-bottom: 10px; }
.hlf-news-row {
  display: flex; align-items: stretch; height: 42px; border: 1.5px solid var(--hlf-line); border-radius: 999px; padding: 3px;
  background: color-mix(in srgb, var(--hlf-band) 70%, #fff 30%); transition: box-shadow .2s, background .2s;
}
.hlf-news-row:focus-within { box-shadow: 0 0 0 3px color-mix(in srgb, var(--hlf-accent) 35%, transparent); }
.hlf-news-input {
  flex: 1 1 auto; min-width: 0; border: 0; background: transparent; padding: 0 14px; font: inherit; font-size: 13.5px; color: var(--hlf-ink); outline: none;
}
.hlf-news-input::placeholder { color: var(--hlf-muted); opacity: .8; }
.hlf-news-btn {
  flex: 0 0 auto; border: 0; border-radius: 999px; padding: 0 18px; font: inherit; font-size: 13px; font-weight: 700; letter-spacing: .02em;
  background: var(--hlf-ink); color: var(--hlf-band); cursor: pointer; transition: transform .2s var(--hlf-pop), background .2s;
}
.hlf-news-btn:hover { transform: translateX(1px); background: var(--hlf-accent); }
.hlf-news-btn:active { transform: scale(.97); }
.hlf-news-ok { min-height: 18px; margin-top: 7px; font-size: 12px; font-weight: 600; color: var(--hlf-ink); }

/* the link columns */
.hlf-cols { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 18px 14px; padding-top: 24px; }
.hlf-col { min-width: 0; flex: 0 1 auto; }
.hlf-col ul { display: flex; flex-direction: column; gap: 7px; }
.hlf-link {
  display: inline-block; font-size: 13px; font-weight: 500; color: var(--hlf-ink); line-height: 1.3;
  background-image: linear-gradient(var(--hlf-accent), var(--hlf-accent)); background-repeat: no-repeat;
  background-size: 0 1.5px; background-position: 0 100%; padding-bottom: 1px;
  opacity: 0; transform: translateY(8px);
  transition: opacity .4s linear var(--d), transform .55s var(--hlf-ease) var(--d), background-size .3s var(--hlf-ease), color .2s;
}
.hlf-on .hlf-link { opacity: 1; transform: none; }
a.hlf-link:hover, a.hlf-link:focus-visible { background-size: 100% 1.5px; color: var(--hlf-accent); }

/* the bottom strip */
.hlf-strip {
  display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;
  margin-top: 34px; padding-top: 16px; border-top: 1px solid var(--hlf-line);
  opacity: 0; transition: opacity .5s linear var(--d);
}
.hlf-on .hlf-strip { opacity: 1; }
.hlf-copy { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: var(--hlf-muted); }
.hlf-legal { color: var(--hlf-ink); font-weight: 500; text-decoration: underline; text-decoration-color: transparent; text-underline-offset: 3px; transition: text-decoration-color .2s, color .2s; }
a.hlf-legal:hover { text-decoration-color: var(--hlf-accent); color: var(--hlf-accent); }
.hlf-socials { display: flex; gap: 8px; }
.hlf-socials li { opacity: 0; transform: translateY(8px); transition: opacity .4s linear var(--d), transform .5s var(--hlf-ease) var(--d); }
.hlf-on .hlf-socials li { opacity: 1; transform: none; }
.hlf-social {
  display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%;
  border: 1.5px solid var(--hlf-line); color: var(--hlf-ink); background: transparent;
  transition: transform .25s var(--hlf-pop), background .2s, color .2s, box-shadow .25s;
}
.hlf-social:hover, .hlf-social:focus-visible { transform: translateY(-3px); background: var(--hlf-ink); color: var(--hlf-band); box-shadow: 0 8px 14px -8px rgba(0, 0, 0, .5); }
.hlf-news-btn:hover { color: #fff; }
.hlf-social svg { display: block; }

/* ---- phones and narrow columns ---- */
@media (max-width: 1040px) {
  .hlf-grid { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .hlf-centre { order: 0; margin: 0 auto; width: 100%; max-width: 420px; }
  .hlf-left { order: 1; padding-top: 30px; grid-template-columns: 208px minmax(0, 1fr); gap: 0 32px; }
  .hlf-col-facts { margin-top: 0; }
  .hlf-col-blurb { max-width: 420px; padding-top: 0; }
  .hlf-cols { order: 2; padding-top: 30px; justify-content: flex-start; gap: 18px 56px; }
}
@media (max-width: 720px) {
  .hlf-body { padding: calc(var(--hlf-top) + 96px) 20px 22px; }
  .hlf-centre { max-width: 100%; }
  .hlf-left { grid-template-columns: minmax(0, 1fr); gap: 0; padding-top: 26px; }
  .hlf-col-facts { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 14px 18px; }
  .hlf-facts { width: 208px; }
  .hlf-barcode { margin-top: 0; }
  .hlf-col-blurb { max-width: 100%; padding-top: 22px; }
  .hlf-cols { gap: 18px 36px; }
  .hlf-strip { flex-direction: column-reverse; align-items: flex-start; }
}
@media (max-width: 420px) {
  .hlf-panel { grid-template-columns: 1fr; }
  .hlf-claim { border-right: 0; border-bottom: 1.5px solid var(--hlf-line); }
}

/* ---- reduced motion: everything in its finished state ---- */
@media (prefers-reduced-motion: reduce) {
  .hlf-band, .hlf-tag-stem, .hlf-medal, .hlf-medal-arc, .hlf-medal-name, .hlf-medal-note, .hlf-medal-rule, .hlf-medal-mark,
  .hlf-facts, .hlf-rule, .hlf-barcode, .hlf-bar, .hlf-bar-digits, .hlf-h, .hlf-p, .hlf-arch, .hlf-panel, .hlf-headline-rule,
  .hlf-link, .hlf-strip, .hlf-socials li, .hlf-social, .hlf-arch-mark, .hlf-news, .hlf-news-btn { transition: none !important; }
  .hlf-wing-a, .hlf-wing-b, .hlf-medal:hover .hlf-medal-ring, .hlf-medal:hover .hlf-medal-mark, .hlf-calling .hlf-medal-mark, .hlf-calling .hlf-arch-mark { animation: none !important; }
}
`
