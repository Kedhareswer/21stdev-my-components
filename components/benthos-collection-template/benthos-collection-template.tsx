"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Benthos Collection Template — a launch page for an illustration collection,
 * drawn the way a naturalist's plate book would be: watercolour creatures on
 * cream paper around a deep-green porthole, then a pinboard of the things the
 * collection makes (palette chips, a line-icon sheet, pattern swatches, a
 * poster, an envelope lined with coral), seamless patterns, framed prints and
 * a licence.
 *
 * - Every creature (whale, octopus, nautilus, jellyfish, sea fan, branching
 *   coral, kelp, scallop, starfish, crab) is generated from a handful of
 *   points and a seed, then painted twice: as a granulated watercolour wash
 *   and as an ink line drawing. The same geometry fills the hero, the icon
 *   sheet, the patterns and the prints, so the whole page is one hand.
 * - The hero porthole is a clip-path. Scrolling morphs it from an oval into
 *   the full-bleed deep, the creatures drift out and the whale swims across
 *   while the collection's contents count up.
 * - Pinned cards swing on their tacks when dragged and spring back.
 * - GSAP + ScrollTrigger run the choreography inside one context; the dive
 *   stage is CSS `position: sticky`, never a pin spacer.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

// ---- public types ---------------------------------------------------------------

export type BenthosPreset = "tidewater" | "midnight" | "coralline"

export type BenthosColors = {
  /** Page paper. */
  paper?: string
  /** Ink: type, rules, line drawings. */
  ink?: string
  /** The porthole and the deep section. */
  deep?: string
  /** The darkest water at the bottom of the deep. */
  abyss?: string
  /** Slate blue: the whale, chips, labels. */
  slate?: string
  /** Dusty blue: secondary surfaces. */
  dusk?: string
  /** Sand: shells, cards, the envelope paper. */
  sand?: string
  /** Coral red: the octopus, branching coral, accents, CTAs. */
  coral?: string
  /** Kelp green. */
  kelp?: string
  /** Ochre: the sea fan, the tacks. */
  gold?: string
}

export type BenthosCreature =
  | "whale"
  | "octopus"
  | "nautilus"
  | "jellyfish"
  | "seafan"
  | "coral"
  | "kelp"
  | "scallop"
  | "starfish"
  | "crab"

export type BenthosNavItem = { label: string; href?: string; section?: "collection" | "moodboard" | "patterns" | "prints" | "licence" }

export type BenthosHero = {
  kicker?: string
  /** The big serif word inside the porthole. */
  title?: string
  /** The script word under it. */
  script?: string
  /** The round badge, e.g. "220+". */
  badge?: string
  byline?: string
  tagline?: string
  cta?: string
  secondary?: string
}

export type BenthosStat = { value: number; label: string; note?: string }

export type BenthosDeep = {
  kicker?: string
  title?: string
  body?: string
  stats?: BenthosStat[]
  formats?: string[]
}

export type BenthosSwatch = { name: string; hex: string }

export type BenthosMoodboard = {
  kicker?: string
  title?: string
  body?: string
  primary?: string
  secondary?: string
  /** Caption under the poster card. */
  posterNumber?: string
  posterTitle?: string
  posterNote?: string
  iconsTitle?: string
  envelopeTitle?: string
  envelopeBody?: string
  envelopeButton?: string
  envelopePlaceholder?: string
  envelopeDone?: string
}

export type BenthosPatternKey = "coral-reef" | "shell-toss" | "octopus-ink" | "kelp-stripe" | "jelly-bloom" | "starfish-dot"

export type BenthosPattern = { key: BenthosPatternKey; name: string; note?: string }

export type BenthosPlate = {
  /** "Plate I" etc. Defaults to its roman numeral. */
  number?: string
  title: string
  latin?: string
  note?: string
  /** Built-in drawing. Ignored when src is given. */
  art?: BenthosCreature
  /** A photo or your own artwork instead of a drawing. */
  src?: string
  alt?: string
}

export type BenthosLicense = { id: string; name: string; blurb: string; price: number; features: string[]; featured?: boolean }

export type BenthosOrder = { license: string; seats: number; total: number; currency: string }

export type BenthosFooter = {
  title?: string
  body?: string
  links?: { label: string; href?: string }[]
  legal?: string
}

export type BenthosCollectionTemplateProps = {
  /** Height of the hero / dive stage. Must be a definite length. */
  height?: string
  preset?: BenthosPreset
  colors?: BenthosColors
  /** "auto" follows a `.dark` ancestor. */
  theme?: "auto" | "light" | "dark"
  /** Stylesheet for the fonts; null loads nothing and uses the fallback stacks. */
  fontHref?: string | null
  brand?: string
  brandNote?: string
  nav?: BenthosNavItem[]
  hero?: BenthosHero
  deep?: BenthosDeep
  moodboard?: BenthosMoodboard
  palette?: BenthosSwatch[]
  patterns?: BenthosPattern[]
  patternsCopy?: { kicker?: string; title?: string; body?: string }
  plates?: BenthosPlate[]
  printsCopy?: { kicker?: string; title?: string; body?: string }
  licenses?: BenthosLicense[]
  licenceCopy?: { kicker?: string; title?: string; body?: string; seatsLabel?: string; button?: string }
  currency?: string
  footer?: BenthosFooter
  socials?: { label: string; href: string }[]
  onBuy?: (order: BenthosOrder) => void
  onSubscribe?: (email: string) => void
  /** Pointer parallax, idle sway and bubbles. */
  alive?: boolean
  className?: string
}

// ---- defaults ---------------------------------------------------------------------

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Mrs+Saint+Delafield&family=Jost:wght@400;500;600&display=swap"

const DISPLAY = '"Cormorant Garamond", Cormorant, "EB Garamond", Garamond, "Times New Roman", serif'
const SCRIPT = '"Mrs Saint Delafield", "Snell Roundhand", "Apple Chancery", "Brush Script MT", cursive'
const LABEL = 'Jost, Futura, "Avenir Next", "Century Gothic", "Helvetica Neue", Arial, sans-serif'

const PALETTES = {
  tidewater: { paper: "#f1ece2", ink: "#27343a", deep: "#2d4a47", abyss: "#15292a", slate: "#6b7d92", dusk: "#93a3b4", sand: "#d8c4a0", coral: "#c6512f", kelp: "#5b7352", gold: "#c6a04c" },
  midnight: { paper: "#e6eaec", ink: "#1b2a36", deep: "#16303d", abyss: "#0a1a24", slate: "#4a6b86", dusk: "#8aa3b8", sand: "#d3c3a6", coral: "#d98a3c", kelp: "#3f6e68", gold: "#c9b36a" },
  coralline: { paper: "#f7eee6", ink: "#3a2f33", deep: "#3b3f58", abyss: "#232538", slate: "#7a7290", dusk: "#b2a9bd", sand: "#ecc9ad", coral: "#e0665a", kelp: "#6c8a68", gold: "#d1a657" },
}

const DEFAULT_NAV = [
  { label: "Collection", section: "collection" },
  { label: "Moodboard", section: "moodboard" },
  { label: "Patterns", section: "patterns" },
  { label: "Prints", section: "prints" },
  { label: "Licence", section: "licence" },
] as BenthosNavItem[]

const DEFAULT_HERO = {
  kicker: "Vintage & Modern",
  title: "Underwater",
  script: "aesthetics",
  badge: "220+",
  byline: "by Benthos Studio",
  tagline: "illustrations, patterns, wall art & more",
  cta: "Get the collection",
  secondary: "See what's inside",
}

const DEFAULT_DEEP = {
  kicker: "What's inside",
  title: "Two hundred and twenty pieces, one hand.",
  body: "Every creature was painted in watercolour and then drawn again in ink, so the washes and the line work match. Layer them, recolour them, tile them: the files are built to be taken apart.",
  stats: [
    { value: 120, label: "Watercolour elements", note: "transparent PNG + layered PSD" },
    { value: 40, label: "Line icons", note: "SVG, single stroke" },
    { value: 24, label: "Seamless patterns", note: "6000 px tiles" },
    { value: 18, label: "Wall-art prints", note: "A2, 300 dpi" },
    { value: 12, label: "Stationery mockups", note: "envelopes, cards, labels" },
    { value: 6, label: "Colour palettes", note: "ASE + CSS" },
  ],
  formats: ["PNG", "SVG", "PSD", "PDF", "Procreate", "ASE"],
}

const DEFAULT_MOODBOARD = {
  kicker: "The collection in use",
  title: "Discover the world of the Underwater Aesthetics collection",
  body: "Washes, line work, posters and patterns that all come from the same pen. Pin a plate to a wall, line an envelope with coral, print a tote, brand a bathhouse. Start with one creature and the rest of the reef follows.",
  primary: "Browse the prints",
  secondary: "Copy a colour",
  posterNumber: "Plate IV",
  posterTitle: "Medusae",
  posterNote: "Aurelia aurita · 1 of 18 prints",
  iconsTitle: "Line icons · 40",
  envelopeTitle: "Letters from the deep",
  envelopeBody: "New plates, free swatches and the occasional tide chart. One letter a month.",
  envelopeButton: "Subscribe",
  envelopePlaceholder: "you@harbour.co",
  envelopeDone: "Sealed and sent.",
}

const DEFAULT_PALETTE = [
  { name: "Slate Tide", hex: "#6b7d92" },
  { name: "Dusk Blue", hex: "#93a3b4" },
  { name: "Driftwood", hex: "#d8c4a0" },
  { name: "Deep Kelp", hex: "#2d4a47" },
  { name: "Coral Ink", hex: "#c6512f" },
  { name: "Pearl Paper", hex: "#f1ece2" },
] as BenthosSwatch[]

const DEFAULT_PATTERNS = [
  { key: "coral-reef", name: "Coral Reef", note: "branching coral and sea fans on paper" },
  { key: "shell-toss", name: "Shell Toss", note: "scallops and starfish on sand" },
  { key: "octopus-ink", name: "Octopus Ink", note: "ink octopuses on slate" },
  { key: "kelp-stripe", name: "Kelp Stripe", note: "feather kelp in columns" },
  { key: "jelly-bloom", name: "Jelly Bloom", note: "moon jellies in the deep" },
  { key: "starfish-dot", name: "Starfish Dot", note: "a tiny polka of starfish" },
] as BenthosPattern[]

const DEFAULT_PLATES = [
  { title: "Common octopus", latin: "Octopus vulgaris", art: "octopus", note: "Eight arms, each drawn from its own seed." },
  { title: "Humpback whale", latin: "Megaptera novaeangliae", art: "whale", note: "Throat pleats and a long white pectoral." },
  { title: "Chambered nautilus", latin: "Nautilus pompilius", art: "nautilus", note: "A logarithmic spiral with its septa." },
  { title: "Moon jelly", latin: "Aurelia aurita", art: "jellyfish", note: "Four gonad rings under a scalloped bell." },
  { title: "Venus sea fan", latin: "Gorgonia ventalina", art: "seafan", note: "A lattice grown branch by branch." },
  { title: "Edible crab", latin: "Cancer pagurus", art: "crab", note: "The pie-crust carapace, claws tucked." },
] as BenthosPlate[]

const DEFAULT_LICENSES = [
  { id: "personal", name: "Personal", blurb: "For your own walls, journals and gifts.", price: 29, features: ["All 220+ files", "PNG, SVG, PDF", "Lifetime updates"] },
  { id: "commercial", name: "Commercial", blurb: "Client work, products, up to 5,000 units.", price: 49, features: ["Everything in Personal", "PSD + Procreate sources", "Up to 5,000 end products", "Shop & social use"], featured: true },
  { id: "extended", name: "Extended", blurb: "Unlimited products, print on demand, apps.", price: 129, features: ["Everything in Commercial", "Unlimited end products", "Print on demand", "Priority requests"] },
]

const DEFAULT_FOOTER: BenthosFooter = {
  title: "Benthos",
  body: "Illustration from the sea floor up. Drawn in Lisbon, printed everywhere.",
  links: [
    { label: "Collections" },
    { label: "Prints" },
    { label: "Licensing" },
    { label: "Journal" },
    { label: "Contact" },
  ],
  legal: "© 2026 Benthos Studio. All plates drawn by hand.",
}

const DEFAULT_SOCIALS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
  { label: "Behance", href: "https://www.behance.net" },
]

const SEAT_TIERS = [1, 5, 20, 100]

// ---- geometry ---------------------------------------------------------------------

// #region curves
type Pt = [number, number]

const r1 = (n: number) => Math.round(n * 10) / 10

/** Catmull-Rom through every point, emitted as cubic béziers. */
function smoothPath(pts: Pt[], closed: boolean, tension = 1) {
  const n = pts.length
  if (n < 2) return ""
  const at = (i: number): Pt => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))])
  let d = "M" + r1(pts[0][0]) + "," + r1(pts[0][1])
  const segs = closed ? n : n - 1
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const k = tension / 6
    d +=
      "C" + r1(p1[0] + (p2[0] - p0[0]) * k) + "," + r1(p1[1] + (p2[1] - p0[1]) * k) +
      " " + r1(p2[0] - (p3[0] - p1[0]) * k) + "," + r1(p2[1] - (p3[1] - p1[1]) * k) +
      " " + r1(p2[0]) + "," + r1(p2[1])
  }
  return closed ? d + "Z" : d
}

/** A centreline swept with a width profile (0–1 along it) into a closed outline. */
function ribbon(center: Pt[], width: (t: number) => number) {
  const n = center.length
  const L: Pt[] = []
  const R: Pt[] = []
  for (let i = 0; i < n; i++) {
    const a = center[Math.max(0, i - 1)]
    const b = center[Math.min(n - 1, i + 1)]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const nx = -(b[1] - a[1]) / len
    const ny = (b[0] - a[0]) / len
    const w = width(n > 1 ? i / (n - 1) : 0) / 2
    L.push([center[i][0] + nx * w, center[i][1] + ny * w])
    R.push([center[i][0] - nx * w, center[i][1] - ny * w])
  }
  return smoothPath(L.concat(R.reverse()), true)
}

/** mulberry32 */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A tendril: walk `length` from (x, y) at `angle`, bending `bend` radians over
 * the walk, curling harder towards the tip, with a sine wobble.
 */
function tendril(x: number, y: number, angle: number, length: number, bend: number, curl: number, wave: number, seed: number, steps = 26): Pt[] {
  const R = rng(seed)
  const ph = R() * 6.283
  const pts: Pt[] = []
  let h = angle
  const ds = length / steps
  for (let i = 0; i <= steps; i++) {
    pts.push([x, y])
    const t = i / steps
    h += (bend + curl * t * t * 3) / steps + (wave * Math.sin(t * 9 + ph)) / steps
    x += Math.cos(h) * ds * (1 - 0.35 * t * t)
    y += Math.sin(h) * ds * (1 - 0.35 * t * t)
  }
  return pts
}

/** Logarithmic spiral r = a·e^(b·θ), sampled from t0 to t1. */
function spiral(cx: number, cy: number, a: number, b: number, t0: number, t1: number, steps: number): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps
    const r = a * Math.exp(b * t)
    pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r])
  }
  return pts
}

/** Polar outline r(θ) sampled into a closed smooth path. */
function polar(cx: number, cy: number, radius: (t: number) => number, steps: number, rot = 0): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const r = radius(t)
    pts.push([cx + Math.cos(t + rot) * r, cy + Math.sin(t + rot) * r])
  }
  return pts
}
// #endregion

// #region coral
type Seg = { x1: number; y1: number; x2: number; y2: number; d: number; w: number }

type TreeOpts = {
  x: number
  y: number
  angle: number
  length: number
  depth: number
  spread: number
  decay: number
  width: number
  jitter: number
  /** branches per node by depth */
  kids: (d: number, R: () => number) => number
}

/** Grow a branching tree. Deterministic for a seed. Segments carry depth and width. */
function growTree(seed: number, o: TreeOpts) {
  const R = rng(seed)
  const out: Seg[] = []
  const grow = (x: number, y: number, a: number, len: number, d: number, w: number) => {
    if (d >= o.depth || len < 1.5) return
    const n = o.kids(d, R)
    for (let j = 0; j < n; j++) {
      const t = n > 1 ? j / (n - 1) - 0.5 : 0
      const na = a + t * o.spread + (R() - 0.5) * o.jitter
      const nl = len * (0.8 + R() * 0.4)
      const x2 = x + Math.cos(na) * nl
      const y2 = y + Math.sin(na) * nl
      out.push({ x1: x, y1: y, x2, y2, d, w })
      grow(x2, y2, na, nl * o.decay, d + 1, w * 0.78)
    }
  }
  grow(o.x, o.y, o.angle, o.length, 0, o.width)
  return out
}

const SEA_FAN: TreeOpts = { x: 0, y: 0, angle: -Math.PI / 2, length: 42, depth: 7, spread: 1.05, decay: 0.8, width: 4.2, jitter: 0.4, kids: (d, R) => (d < 2 ? 3 : R() < 0.75 ? 2 : 3) }
const RED_CORAL: TreeOpts = { x: 0, y: 0, angle: -Math.PI / 2, length: 46, depth: 5, spread: 1.15, decay: 0.76, width: 13, jitter: 0.5, kids: (d, R) => (d === 0 ? 2 : R() < 0.4 ? 3 : 2) }
// #endregion

// #region order
/** Seat tiers 1 / 5 / 20 / 100 multiply the licence by 1 / 2.4 / 5 / 9. */
function seatMultiplier(seats: number) {
  if (seats >= 100) return 9
  if (seats >= 20) return 5
  if (seats >= 5) return 2.4
  return 1
}
function orderTotal(price: number, seats: number) {
  return Math.round(price * seatMultiplier(seats))
}
function roman(n: number) {
  const t: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]
  let s = ""
  for (const [v, r] of t) while (n >= v) { s += r; n -= v }
  return s
}
// #endregion

// #region pins
/** Degrees of a vector from the pin to a point, 0 = straight down, clockwise positive. */
function pinAngle(px: number, py: number, x: number, y: number) {
  return (Math.atan2(x - px, y - py) * 180) / Math.PI
}
/** The card's rotation while dragged: rest plus how far the grab point has swung, clamped. */
function swingTo(rest: number, grabAngle: number, nowAngle: number, limit = 38) {
  let d = grabAngle - nowAngle
  d = ((d + 540) % 360) - 180
  return Math.max(rest - limit, Math.min(rest + limit, rest + d))
}
// #endregion

function validEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.setAttribute("readonly", "")
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand("copy")
      ta.remove()
      ok ? resolve(undefined) : reject(new Error("copy failed"))
    } catch (e) {
      reject(e)
    }
  })
}

function hexToRgb(hex: string) {
  const m = hex.replace("#", "")
  const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// ---- the creatures ---------------------------------------------------------------
//
// Each one is a <g> in its own box (VIEW), drawn from a few points and a seed.
// mode "wash" paints granulated watercolour; mode "ink" draws it in one line
// weight (non-scaling, so an icon and a print share the same pen).

const IdCtx = React.createContext("bct")

type Mode = "wash" | "ink"
type ArtProps = { mode: Mode; seed?: number }

const VIEW = {
  whale: [0, 0, 420, 200],
  octopus: [0, 0, 300, 330],
  nautilus: [-70, -70, 140, 140],
  jellyfish: [-80, -90, 160, 200],
  seafan: [-120, -210, 240, 215],
  coral: [-110, -200, 220, 205],
  kelp: [-60, -220, 120, 225],
  scallop: [0, 0, 120, 110],
  starfish: [-70, -70, 140, 140],
  crab: [-150, -90, 300, 160],
  fish: [-62, -30, 124, 60],
  anchor: [-40, -50, 80, 100],
  urchin: [-40, -40, 80, 80],
} as { [k: string]: number[] }

const ink = (extra?: React.CSSProperties): React.CSSProperties => ({ fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round", ...extra })
const INK_ATTR = { vectorEffect: "non-scaling-stroke" as const }
const useHatch = () => "url(#" + React.useContext(IdCtx) + "-hatch)"

function Defs({ id }: { id: string }) {
  return (
    <svg className="bct-defs" aria-hidden="true" focusable="false">
      <defs>
        <filter id={id + "-wash"} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="9" xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="9" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.7 0 0 0 -0.62" result="grainA" />
          <feComposite in="grainA" in2="shape" operator="in" result="grainIn" />
          <feFlood floodColor="#1c1612" floodOpacity="0.3" result="dark" />
          <feComposite in="dark" in2="grainIn" operator="in" result="grainDark" />
          <feMorphology in="shape" operator="erode" radius="2.4" result="inner" />
          <feGaussianBlur in="inner" stdDeviation="2.2" result="innerBlur" />
          <feComposite in="shape" in2="innerBlur" operator="out" result="edge" />
          <feFlood floodColor="#1c1612" floodOpacity="0.26" result="dark2" />
          <feComposite in="dark2" in2="edge" operator="in" result="edgeDark" />
          <feMerge>
            <feMergeNode in="shape" />
            <feMergeNode in="grainDark" />
            <feMergeNode in="edgeDark" />
          </feMerge>
        </filter>
        <filter id={id + "-ink"} x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="2" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <pattern id={id + "-hatch"} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="0.9" />
        </pattern>
      </defs>
    </svg>
  )
}

/** Wraps a creature <g> in its own <svg>. */
function Creature({ kind, mode = "wash", seed = 1, flip, className, style, title }: { kind: BenthosCreature | "fish" | "anchor" | "urchin"; mode?: Mode; seed?: number; flip?: boolean; className?: string; style?: React.CSSProperties; title?: string }) {
  const [x, y, w, h] = VIEW[kind]
  const Art = ART[kind]
  return (
    <svg viewBox={x + " " + y + " " + w + " " + h} className={"bct-art bct-art-" + kind + (className ? " " + className : "")} style={style} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined} overflow="visible">
      {title && <title>{title}</title>}
      <g transform={flip ? "translate(" + (2 * x + w) + " 0) scale(-1 1)" : undefined}>
        <Art mode={mode} seed={seed} />
      </g>
    </svg>
  )
}

/** The filter + blend wrapper every creature paints inside. */
function Paint({ mode, children, color }: { mode: Mode; children: React.ReactNode; color?: string }) {
  const id = React.useContext(IdCtx)
  return (
    <g filter={"url(#" + id + (mode === "wash" ? "-wash" : "-ink") + ")"} style={mode === "ink" && color ? { color } : undefined}>
      {children}
    </g>
  )
}

const WHALE_BODY: Pt[] = [[408, 124], [388, 96], [352, 72], [300, 56], [240, 54], [200, 60], [186, 44], [170, 64], [128, 82], [88, 98], [60, 106], [44, 112], [42, 120], [62, 132], [100, 146], [160, 164], [220, 176], [282, 176], [336, 164], [378, 146], [400, 134]]
const WHALE_FLUKE: Pt[] = [[54, 106], [30, 82], [10, 60], [0, 72], [12, 100], [22, 116], [12, 132], [0, 154], [6, 166], [30, 142], [54, 128]]
const WHALE_FIN: Pt[] = [[318, 142], [296, 158], [246, 180], [198, 196], [170, 196], [186, 184], [238, 166], [290, 146]]
const WHALE_BELLY: Pt[] = [[400, 134], [378, 146], [336, 164], [282, 176], [220, 176], [160, 164], [100, 146], [62, 132], [92, 128], [150, 144], [220, 156], [300, 152], [352, 140], [382, 126]]

function WhaleArt({ mode }: ArtProps) {
  const hatch = useHatch()
  const body = smoothPath(WHALE_BODY, true)
  const fluke = smoothPath(WHALE_FLUKE, true)
  const fin = smoothPath(WHALE_FIN, true)
  const mouth = smoothPath([[404, 126], [374, 138], [334, 154], [294, 162]], false)
  const pleats = [0, 1, 2, 3, 4].map((k) => smoothPath([[388 - k * 3, 138 + k * 5.5], [340 - k * 7, 158 + k * 3.5], [284 - k * 10, 166 + k * 1.5]], false))
  const back = ribbon([[386, 92], [330, 74], [260, 66], [200, 74], [128, 90]], () => 18)
  const shade = ribbon([[386, 134], [320, 158], [240, 172], [150, 160], [80, 134]], (t) => 24 * Math.sin(Math.PI * t) + 6)
  if (mode === "ink")
    return (
      <Paint mode="ink">
        <path d={fluke} style={ink()} {...INK_ATTR} />
        <path d={fin} style={ink()} {...INK_ATTR} />
        <path d={body} style={ink()} {...INK_ATTR} />
        <path d={mouth} style={ink()} {...INK_ATTR} />
        {pleats.map((d, i) => <path key={i} d={d} style={ink({ strokeWidth: 0.9 })} {...INK_ATTR} />)}
        <circle cx="366" cy="108" r="3.4" style={{ fill: "currentColor" }} />
        <path d="M338,76 q6,-4 12,0" style={ink({ strokeWidth: 0.9 })} {...INK_ATTR} />
        <path d={shade} style={{ fill: hatch, opacity: 0.6 }} />
      </Paint>
    )
  return (
    <Paint mode="wash">
      <path d={fluke} style={{ fill: "var(--slate)", opacity: 0.92 }} />
      <path d={body} style={{ fill: "var(--slate)", opacity: 0.95 }} />
      <path d={WHALE_BELLY.length ? smoothPath(WHALE_BELLY, true) : ""} style={{ fill: "var(--light)", opacity: 0.55 }} />
      <path d={shade} style={{ fill: "var(--dark)", opacity: 0.22, mixBlendMode: "multiply" }} />
      <path d={back} style={{ fill: "var(--light)", opacity: 0.3 }} />
      <path d={fin} style={{ fill: "var(--light)", opacity: 0.86 }} />
      <path d={fin} style={{ fill: "var(--slate)", opacity: 0.35, mixBlendMode: "multiply" }} />
      <path d={mouth} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: 1.6, opacity: 0.7, strokeLinecap: "round" }} />
      {pleats.map((d, i) => <path key={i} d={d} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: 1, opacity: 0.4, strokeLinecap: "round" }} />)}
      <circle cx="366" cy="108" r="3.4" style={{ fill: "var(--dark)" }} />
      <circle cx="367.4" cy="106.8" r="1" style={{ fill: "var(--light)" }} />
    </Paint>
  )
}

const OCTO_MANTLE: Pt[] = [[150, 8], [202, 24], [238, 78], [230, 138], [198, 170], [150, 180], [102, 170], [70, 138], [62, 78], [98, 24]]

function octopusArms(seed: number) {
  const R = rng(seed)
  const arms: { pts: Pt[]; w0: number }[] = []
  for (let i = 0; i < 8; i++) {
    const a = 0.1 * Math.PI + (0.8 * Math.PI * i) / 7
    const side = i < 4 ? -1 : 1
    const bx = 150 + Math.cos(a) * 58
    const by = 168 + Math.sin(a) * 26
    const len = 150 + R() * 70
    const bend = side * (0.2 + R() * 0.5) * (i === 3 || i === 4 ? -1 : 1)
    const curl = side * (1.4 + R() * 1.6)
    arms.push({ pts: tendril(bx, by, a + (R() - 0.5) * 0.3, len, bend, curl, 1.2, seed * 7 + i), w0: 20 + R() * 8 })
  }
  return arms
}

function OctopusArt({ mode, seed = 3 }: ArtProps) {
  const hatch = useHatch()
  const arms = React.useMemo(() => octopusArms(seed), [seed])
  const mantle = smoothPath(OCTO_MANTLE, true)
  const hood = smoothPath([[150, 8], [202, 24], [238, 78], [232, 118], [200, 106], [150, 100], [100, 106], [68, 118], [62, 78], [98, 24]], true)
  const armPaths = arms.map((a) => ribbon(a.pts, (t) => a.w0 * Math.pow(1 - t, 0.85) + 2.2))
  const suckers = arms.flatMap((a, i) =>
    a.pts
      .map((p, k) => {
        if (k < 3 || k % 2 || k > a.pts.length - 2) return null
        const t = k / (a.pts.length - 1)
        const q = a.pts[k + 1]
        const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1
        const w = a.w0 * Math.pow(1 - t, 0.85) + 2.2
        const side = i < 4 ? 1 : -1
        const nx = (-(q[1] - p[1]) / len) * side
        const ny = ((q[0] - p[0]) / len) * side
        return { x: p[0] + nx * w * 0.28, y: p[1] + ny * w * 0.28, r: Math.max(0.8, w * 0.17) }
      })
      .filter(Boolean) as { x: number; y: number; r: number }[],
  )
  const R = rng(seed + 11)
  const spots = Array.from({ length: 22 }, () => ({ x: 92 + R() * 116, y: 24 + R() * 110, r: 1.6 + R() * 2.6 }))
  if (mode === "ink")
    return (
      <Paint mode="ink">
        {armPaths.map((d, i) => <path key={i} d={d} style={ink()} {...INK_ATTR} />)}
        {suckers.map((s, i) => <circle key={i} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} style={ink({ strokeWidth: 0.8 })} {...INK_ATTR} />)}
        <path d={mantle} style={ink()} {...INK_ATTR} />
        <ellipse cx="96" cy="150" rx="15" ry="11" style={ink()} {...INK_ATTR} />
        <ellipse cx="204" cy="150" rx="15" ry="11" style={ink()} {...INK_ATTR} />
        <rect x="90" y="148.5" width="12" height="3.4" rx="1.6" style={{ fill: "currentColor" }} />
        <rect x="198" y="148.5" width="12" height="3.4" rx="1.6" style={{ fill: "currentColor" }} />
        {spots.map((s, i) => <circle key={i} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r * 0.6)} style={{ fill: "currentColor", opacity: 0.5 }} />)}
        <path d={hood} style={{ fill: hatch, opacity: 0.45 }} />
      </Paint>
    )
  return (
    <Paint mode="wash">
      {armPaths.map((d, i) => <path key={i} d={d} style={{ fill: "var(--coral)", opacity: 0.9 }} />)}
      <path d={mantle} style={{ fill: "var(--coral)", opacity: 0.95 }} />
      <path d={hood} style={{ fill: "var(--dark)", opacity: 0.28, mixBlendMode: "multiply" }} />
      <path d={smoothPath([[120, 40], [170, 30], [206, 60], [186, 70], [140, 62]], true)} style={{ fill: "var(--light)", opacity: 0.32 }} />
      {spots.map((s, i) => <circle key={i} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} style={{ fill: "var(--light)", opacity: 0.5 }} />)}
      <ellipse cx="96" cy="150" rx="15" ry="11" style={{ fill: "var(--sand)" }} />
      <ellipse cx="204" cy="150" rx="15" ry="11" style={{ fill: "var(--sand)" }} />
      <rect x="90" y="148.5" width="12" height="3.4" rx="1.6" style={{ fill: "var(--dark)" }} />
      <rect x="198" y="148.5" width="12" height="3.4" rx="1.6" style={{ fill: "var(--dark)" }} />
      {suckers.map((s, i) => <circle key={i} cx={r1(s.x)} cy={r1(s.y)} r={r1(s.r)} style={{ fill: "var(--light)", opacity: 0.55 }} />)}
    </Paint>
  )
}

function NautilusArt({ mode }: ArtProps) {
  const hatch = useHatch()
  const b = 0.18
  const tMax = 4.6 * Math.PI
  const a = 60 / Math.exp(b * tMax)
  const outer = spiral(0, 0, a, b, tMax - 2 * Math.PI, tMax, 64)
  const inner = spiral(0, 0, a, b, tMax - 4 * Math.PI, tMax - 2 * Math.PI, 64)
  const band = smoothPath(outer.concat(inner.slice().reverse()), true, 0.6)
  const coil = smoothPath(spiral(0, 0, a, b, 0.4, tMax - 2 * Math.PI, 90), false, 0.8)
  const septa: string[] = []
  for (let t = tMax - 2 * Math.PI + 0.25; t < tMax - 1.15; t += 0.36) {
    const ro = a * Math.exp(b * t)
    const ri = a * Math.exp(b * (t - 2 * Math.PI))
    const o: Pt = [Math.cos(t) * ro, Math.sin(t) * ro]
    const i: Pt = [Math.cos(t) * ri, Math.sin(t) * ri]
    const tb = t - 0.22
    const rm = (ro + ri) / 2
    septa.push("M" + r1(i[0]) + "," + r1(i[1]) + "Q" + r1(Math.cos(tb) * rm) + "," + r1(Math.sin(tb) * rm) + " " + r1(o[0]) + "," + r1(o[1]))
  }
  const flames: string[] = []
  for (let k = 0; k < 9; k++) {
    const t = tMax - 2 * Math.PI + 0.5 + k * 0.6
    const ro = a * Math.exp(b * t)
    const ri = a * Math.exp(b * (t - 2 * Math.PI))
    const pts: Pt[] = [0.15, 0.4, 0.65, 0.98].map((f) => {
      const r = ri + (ro - ri) * f
      const tt = t + f * 0.14
      return [Math.cos(tt) * r, Math.sin(tt) * r]
    })
    flames.push(ribbon(pts, (f) => 2 + f * 7))
  }
  if (mode === "ink")
    return (
      <Paint mode="ink">
        <path d={band} style={ink()} {...INK_ATTR} />
        <path d={coil} style={ink({ strokeWidth: 1 })} {...INK_ATTR} />
        {septa.map((d, i) => <path key={i} d={d} style={ink({ strokeWidth: 0.9 })} {...INK_ATTR} />)}
        <path d={smoothPath(outer.slice(0, 28).concat(inner.slice(0, 28).reverse()), true, 0.6)} style={{ fill: hatch, opacity: 0.45 }} />
      </Paint>
    )
  return (
    <Paint mode="wash">
      <path d={band} style={{ fill: "var(--sand)", opacity: 0.95 }} />
      <path d={smoothPath(spiral(0, 0, a, b, 0.4, tMax - 2 * Math.PI, 90).concat([[0, 0]]), true, 0.8)} style={{ fill: "var(--sand)", opacity: 0.8 }} />
      {flames.map((d, i) => <path key={i} d={d} style={{ fill: "var(--coral)", opacity: 0.55, mixBlendMode: "multiply" }} />)}
      <path d={coil} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: 1.2, opacity: 0.6 }} />
      {septa.map((d, i) => <path key={i} d={d} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: 1, opacity: 0.45 }} />)}
      <path d={band} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: 1.2, opacity: 0.5 }} />
    </Paint>
  )
}

function JellyfishArt({ mode, seed = 5 }: ArtProps) {
  const hatch = useHatch()
  const bell = "M-70,0 C-70,-50 -36,-84 0,-84 C36,-84 70,-50 70,0"
  let edge = "M70,0"
  for (let i = 0; i < 7; i++) {
    const x = 70 - i * 20
    edge += " Q" + (x - 10) + ",9 " + (x - 20) + ",0"
  }
  const arms = [-9, -3, 3, 9].map((x, i) => ribbon(tendril(x, 2, Math.PI / 2 + (x / 9) * 0.25, 92, (x / 9) * 0.5, 0, 3.2, seed * 3 + i, 22), (t) => 7 * (1 - t) + 1.2))
  const R = rng(seed)
  const tentacles = Array.from({ length: 15 }, (_, i) => {
    const x = -64 + i * 9.1
    return smoothPath(tendril(x, 1, Math.PI / 2, 46 + R() * 34, (R() - 0.5) * 0.6, 0, 3.6, seed * 5 + i, 18), false)
  })
  const gonads = [[-14, -40], [14, -40], [-14, -18], [14, -18]] as Pt[]
  if (mode === "ink")
    return (
      <Paint mode="ink">
        {tentacles.map((d, i) => <path key={i} d={d} style={ink({ strokeWidth: 0.8 })} {...INK_ATTR} />)}
        {arms.map((d, i) => <path key={i} d={d} style={ink()} {...INK_ATTR} />)}
        <path d={bell + " " + edge.slice(5) + "Z"} style={ink()} {...INK_ATTR} />
        {gonads.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="12" ry="10" style={ink({ strokeWidth: 0.9 })} {...INK_ATTR} />)}
        <path d="M-56,-12 C-40,-60 40,-60 56,-12" style={ink({ strokeWidth: 0.8 })} {...INK_ATTR} />
        <path d={"M-70,0 C-70,-50 -36,-84 0,-84 C-20,-84 -42,-60 -50,-10 Z"} style={{ fill: hatch, opacity: 0.45 }} />
      </Paint>
    )
  return (
    <Paint mode="wash">
      {tentacles.map((d, i) => <path key={i} d={d} style={{ fill: "none", stroke: "var(--dusk)", strokeWidth: 1.4, opacity: 0.8 }} />)}
      {arms.map((d, i) => <path key={i} d={d} style={{ fill: "var(--dusk)", opacity: 0.8 }} />)}
      <path d={bell + " " + edge.slice(5) + "Z"} style={{ fill: "var(--dusk)", opacity: 0.72 }} />
      <path d="M-52,-14 C-40,-62 40,-62 52,-14 C30,-30 -30,-30 -52,-14Z" style={{ fill: "var(--light)", opacity: 0.45 }} />
      {gonads.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="12" ry="10" style={{ fill: "var(--slate)", opacity: 0.5, mixBlendMode: "multiply" }} />)}
      <path d={bell + " " + edge.slice(5) + "Z"} style={{ fill: "none", stroke: "var(--slate)", strokeWidth: 1.1, opacity: 0.55 }} />
    </Paint>
  )
}

function treePaths(segs: Seg[]) {
  const by: { [d: number]: { d: string; w: number } } = {}
  for (const s of segs) {
    const e = (by[s.d] = by[s.d] || { d: "", w: s.w })
    e.d += "M" + r1(s.x1) + "," + r1(s.y1) + "L" + r1(s.x2) + "," + r1(s.y2)
  }
  return Object.keys(by).map((k) => by[+k])
}

function SeaFanArt({ mode, seed = 7 }: ArtProps) {
  const segs = React.useMemo(() => growTree(seed, SEA_FAN), [seed])
  const paths = treePaths(segs)
  const stroke = mode === "ink" ? "currentColor" : "var(--gold)"
  return (
    <Paint mode={mode}>
      <path d="M-14,0 Q-4,-14 0,-16 Q4,-14 14,0 Z" style={{ fill: mode === "ink" ? "none" : "var(--gold)", stroke, strokeWidth: 1.2, strokeLinejoin: "round" }} />
      {paths.map((p, i) => <path key={i} d={p.d} style={{ fill: "none", stroke, strokeWidth: mode === "ink" ? Math.max(0.6, p.w * 0.32) : p.w, strokeLinecap: "round", opacity: mode === "ink" ? 1 : 0.92 }} />)}
    </Paint>
  )
}

function CoralArt({ mode, seed = 9 }: ArtProps) {
  const segs = React.useMemo(() => growTree(seed, RED_CORAL), [seed])
  const paths = treePaths(segs)
  const tips = segs.filter((s) => s.d === RED_CORAL.depth - 1)
  const stroke = mode === "ink" ? "currentColor" : "var(--coral)"
  return (
    <Paint mode={mode}>
      {paths.map((p, i) => <path key={i} d={p.d} style={{ fill: "none", stroke, strokeWidth: mode === "ink" ? Math.max(0.9, p.w * 0.55) : p.w, strokeLinecap: "round", opacity: mode === "ink" ? 1 : 0.93 }} />)}
      {mode === "ink" && tips.map((t, i) => <circle key={i} cx={r1(t.x2)} cy={r1(t.y2)} r={Math.max(1.2, t.w * 0.42)} style={ink({ strokeWidth: 0.8 })} {...INK_ATTR} />)}
      {mode === "wash" && paths.slice(0, 2).map((p, i) => <path key={i} d={p.d} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: p.w * 0.42, strokeLinecap: "round", opacity: 0.22, mixBlendMode: "multiply" }} />)}
    </Paint>
  )
}

function kelpPaths(seed: number) {
  const stem = tendril(0, 0, -Math.PI / 2, 205, 0.25, 0.1, 2.2, seed, 30)
  let leaves = ""
  for (let i = 3; i < stem.length - 1; i++) {
    const p = stem[i]
    const q = stem[i + 1]
    const t = i / (stem.length - 1)
    const len = 6 + 18 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.35)
    const h = Math.atan2(q[1] - p[1], q[0] - p[0])
    const side = i % 2 ? 1 : -1
    const a = h + side * 1.05
    const tip: Pt = [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len]
    const c1: Pt = [p[0] + Math.cos(a - side * 0.5) * len * 0.55, p[1] + Math.sin(a - side * 0.5) * len * 0.55]
    const c2: Pt = [p[0] + Math.cos(a + side * 0.5) * len * 0.55, p[1] + Math.sin(a + side * 0.5) * len * 0.55]
    leaves += "M" + r1(p[0]) + "," + r1(p[1]) + "Q" + r1(c1[0]) + "," + r1(c1[1]) + " " + r1(tip[0]) + "," + r1(tip[1]) + "Q" + r1(c2[0]) + "," + r1(c2[1]) + " " + r1(p[0]) + "," + r1(p[1]) + "Z"
  }
  return { stem: smoothPath(stem, false), leaves }
}

function KelpArt({ mode, seed = 2 }: ArtProps) {
  const { stem, leaves } = React.useMemo(() => kelpPaths(seed), [seed])
  if (mode === "ink")
    return (
      <Paint mode="ink">
        <path d={stem} style={ink()} {...INK_ATTR} />
        <path d={leaves} style={ink({ strokeWidth: 0.9 })} {...INK_ATTR} />
      </Paint>
    )
  return (
    <Paint mode="wash">
      <path d={leaves} style={{ fill: "var(--kelp)", opacity: 0.86 }} />
      <path d={stem} style={{ fill: "none", stroke: "var(--kelp)", strokeWidth: 3.2, strokeLinecap: "round" }} />
      <path d={stem} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: 1, opacity: 0.3, strokeLinecap: "round" }} />
    </Paint>
  )
}

function scallopPaths() {
  const H: Pt = [60, 92]
  const ridges = 11
  const t0 = -Math.PI * 0.92
  const t1 = -Math.PI * 0.08
  const edge: Pt[] = []
  const N = 110
  for (let i = 0; i <= N; i++) {
    const f = i / N
    const t = t0 + (t1 - t0) * f
    const r = 72 * (1 + 0.045 * Math.cos(ridges * f * Math.PI * 2 + Math.PI)) * (1 - 0.12 * Math.pow(Math.abs(f - 0.5) * 2, 3))
    edge.push([H[0] + Math.cos(t) * r, H[1] + Math.sin(t) * r * 0.92])
  }
  let shell = "M" + r1(H[0] - 15) + "," + r1(H[1])
  for (const p of edge) shell += "L" + r1(p[0]) + "," + r1(p[1])
  shell += "L" + r1(H[0] + 15) + "," + r1(H[1]) + "Z"
  const lines: string[] = []
  for (let k = 0; k < ridges; k++) {
    const f = (k + 0.5) / ridges
    const p = edge[Math.round(f * N)]
    lines.push("M" + r1(H[0]) + "," + r1(H[1] - 4) + "Q" + r1((H[0] + p[0]) / 2 + (p[0] - H[0]) * 0.06) + "," + r1((H[1] + p[1]) / 2) + " " + r1(p[0]) + "," + r1(p[1]))
  }
  return { shell, lines, ears: "M44,84h12v10h-12zM64,84h12v10h-12z" }
}

function ScallopArt({ mode }: ArtProps) {
  const { shell, lines, ears } = React.useMemo(scallopPaths, [])
  if (mode === "ink")
    return (
      <Paint mode="ink">
        <path d={ears} style={ink()} {...INK_ATTR} />
        <path d={shell} style={ink()} {...INK_ATTR} />
        {lines.map((d, i) => <path key={i} d={d} style={ink({ strokeWidth: 0.9 })} {...INK_ATTR} />)}
      </Paint>
    )
  return (
    <Paint mode="wash">
      <path d={ears} style={{ fill: "var(--sand)" }} />
      <path d={shell} style={{ fill: "var(--sand)", opacity: 0.96 }} />
      <path d={shell} style={{ fill: "var(--coral)", opacity: 0.18, mixBlendMode: "multiply" }} />
      <path d="M60,88 L22,42 Q60,16 98,42 Z" style={{ fill: "var(--light)", opacity: 0.35 }} />
      {lines.map((d, i) => <path key={i} d={d} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: 1.1, opacity: 0.38, strokeLinecap: "round" }} />)}
      <path d={shell} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: 1.1, opacity: 0.45 }} />
    </Paint>
  )
}

function StarfishArt({ mode, seed = 4 }: ArtProps) {
  const rot = (seed % 5) * 0.21
  const outline = smoothPath(polar(0, 0, (t) => 62 * (0.34 + 0.66 * Math.pow((1 + Math.cos(5 * t)) / 2, 1.7)), 90, rot), true, 1)
  const dots: { x: number; y: number; r: number }[] = []
  for (let k = 0; k < 5; k++) {
    const a = (k * Math.PI * 2) / 5 + rot
    for (let s = 0; s < 6; s++) {
      const d = 10 + s * 8.5
      const r = 3.1 - s * 0.38
      dots.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r })
      if (s < 4) {
        const off = 7 - s * 1.3
        dots.push({ x: Math.cos(a) * (d + 3) + Math.cos(a + Math.PI / 2) * off, y: Math.sin(a) * (d + 3) + Math.sin(a + Math.PI / 2) * off, r: r * 0.6 })
        dots.push({ x: Math.cos(a) * (d + 3) - Math.cos(a + Math.PI / 2) * off, y: Math.sin(a) * (d + 3) - Math.sin(a + Math.PI / 2) * off, r: r * 0.6 })
      }
    }
  }
  if (mode === "ink")
    return (
      <Paint mode="ink">
        <path d={outline} style={ink()} {...INK_ATTR} />
        {dots.map((d, i) => <circle key={i} cx={r1(d.x)} cy={r1(d.y)} r={r1(d.r * 0.75)} style={{ fill: "currentColor" }} />)}
      </Paint>
    )
  return (
    <Paint mode="wash">
      <path d={outline} style={{ fill: "var(--sand)", opacity: 0.96 }} />
      <path d={outline} style={{ fill: "var(--coral)", opacity: 0.3, mixBlendMode: "multiply" }} />
      {dots.map((d, i) => <circle key={i} cx={r1(d.x)} cy={r1(d.y)} r={r1(d.r)} style={{ fill: "var(--dark)", opacity: 0.4 }} />)}
    </Paint>
  )
}

function CrabArt({ mode }: ArtProps) {
  const hatch = useHatch()
  const body = smoothPath([[-74, -6], [-54, -42], [0, -52], [54, -42], [74, -6], [58, 30], [0, 42], [-58, 30]], true)
  const pincer = smoothPath([[-112, -50], [-132, -70], [-148, -60], [-142, -44], [-128, -36], [-122, -24], [-104, -34]], true, 0.9)
  const arm = "M-70,-12 L-102,-26 L-114,-50"
  const legs = [0, 1, 2, 3].map((i) => "M" + (-64 + i * 2) + "," + (6 + i * 9) + " L" + (-98 - i * 2) + "," + (6 + i * 15) + " L" + (-114 - i * 2) + "," + (36 + i * 12))
  const eyes = "M-20,-48 L-25,-66 M20,-48 L25,-66"
  const side = (k: number) => (
    <g key={k} transform={k ? "scale(-1 1)" : undefined}>
      {legs.map((d, i) => <path key={i} d={d} style={mode === "ink" ? ink() : { fill: "none", stroke: "var(--coral)", strokeWidth: 7, strokeLinecap: "round", strokeLinejoin: "round" }} {...(mode === "ink" ? INK_ATTR : {})} />)}
      <path d={arm} style={mode === "ink" ? ink() : { fill: "none", stroke: "var(--coral)", strokeWidth: 12, strokeLinecap: "round", strokeLinejoin: "round" }} {...(mode === "ink" ? INK_ATTR : {})} />
      <path d={pincer} style={mode === "ink" ? ink() : { fill: "var(--coral)" }} {...(mode === "ink" ? INK_ATTR : {})} />
      <path d="M-146,-58 L-128,-52" style={mode === "ink" ? ink({ strokeWidth: 0.9 }) : { fill: "none", stroke: "var(--dark)", strokeWidth: 1.2, opacity: 0.5 }} {...(mode === "ink" ? INK_ATTR : {})} />
    </g>
  )
  if (mode === "ink")
    return (
      <Paint mode="ink">
        {side(0)}
        {side(1)}
        <path d={body} style={ink()} {...INK_ATTR} />
        <path d={eyes} style={ink()} {...INK_ATTR} />
        <circle cx="-26" cy="-69" r="4" style={{ fill: "currentColor" }} />
        <circle cx="26" cy="-69" r="4" style={{ fill: "currentColor" }} />
        <path d="M-50,-36 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0 q6,-6 12,0" style={ink({ strokeWidth: 0.9 })} {...INK_ATTR} />
        <path d={smoothPath([[-74, -6], [-58, 30], [0, 42], [58, 30], [74, -6], [40, 10], [0, 16], [-40, 10]], true)} style={{ fill: hatch, opacity: 0.45 }} />
      </Paint>
    )
  return (
    <Paint mode="wash">
      {side(0)}
      {side(1)}
      <path d={body} style={{ fill: "var(--coral)", opacity: 0.95 }} />
      <path d={smoothPath([[-74, -6], [-58, 30], [0, 42], [58, 30], [74, -6], [40, 10], [0, 16], [-40, 10]], true)} style={{ fill: "var(--dark)", opacity: 0.22, mixBlendMode: "multiply" }} />
      <path d={smoothPath([[-46, -34], [0, -44], [46, -34], [30, -24], [0, -22], [-30, -24]], true)} style={{ fill: "var(--light)", opacity: 0.3 }} />
      <path d={eyes} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: 2, strokeLinecap: "round" }} />
      <circle cx="-26" cy="-69" r="4.5" style={{ fill: "var(--dark)" }} />
      <circle cx="26" cy="-69" r="4.5" style={{ fill: "var(--dark)" }} />
    </Paint>
  )
}

function FishArt({ mode }: ArtProps) {
  const body = smoothPath([[-40, 0], [-22, -16], [8, -17], [32, -6], [40, 0], [32, 6], [8, 17], [-22, 16]], true)
  const tail = "M-38,0 L-58,-14 L-52,0 L-58,14 Z"
  if (mode === "ink")
    return (
      <Paint mode="ink">
        <path d={tail} style={ink()} {...INK_ATTR} />
        <path d={body} style={ink()} {...INK_ATTR} />
        <path d="M16,-13 Q9,0 16,13" style={ink({ strokeWidth: 0.9 })} {...INK_ATTR} />
        <circle cx="26" cy="-3" r="2.2" style={{ fill: "currentColor" }} />
      </Paint>
    )
  return (
    <Paint mode="wash">
      <path d={tail} style={{ fill: "var(--slate)", opacity: 0.85 }} />
      <path d={body} style={{ fill: "var(--slate)", opacity: 0.92 }} />
      <circle cx="26" cy="-3" r="2.2" style={{ fill: "var(--dark)" }} />
    </Paint>
  )
}

function AnchorArt({ mode }: ArtProps) {
  const s = mode === "ink" ? ink({ strokeWidth: 1.5 }) : { fill: "none", stroke: "var(--slate)", strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  return (
    <Paint mode={mode}>
      <circle cx="0" cy="-38" r="7" style={s} {...(mode === "ink" ? INK_ATTR : {})} />
      <path d="M0,-31 V38 M-18,-18 H18 M-34,10 C-30,34 -10,42 0,42 C10,42 30,34 34,10 M-34,10 L-30,22 M34,10 L30,22" style={s} {...(mode === "ink" ? INK_ATTR : {})} />
    </Paint>
  )
}

function UrchinArt({ mode, seed = 6 }: ArtProps) {
  const R = rng(seed)
  let spines = ""
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    const r2 = 19 + R() * 16
    spines += "M" + r1(Math.cos(a) * 15) + "," + r1(Math.sin(a) * 15) + "L" + r1(Math.cos(a) * r2) + "," + r1(Math.sin(a) * r2)
  }
  if (mode === "ink")
    return (
      <Paint mode="ink">
        <circle cx="0" cy="0" r="16" style={ink()} {...INK_ATTR} />
        <path d={spines} style={ink({ strokeWidth: 1 })} {...INK_ATTR} />
      </Paint>
    )
  return (
    <Paint mode="wash">
      <path d={spines} style={{ fill: "none", stroke: "var(--dark)", strokeWidth: 1.6, strokeLinecap: "round", opacity: 0.8 }} />
      <circle cx="0" cy="0" r="16" style={{ fill: "var(--dark)", opacity: 0.85 }} />
    </Paint>
  )
}

const ART: { [k: string]: (p: ArtProps) => React.ReactElement } = {
  whale: WhaleArt,
  octopus: OctopusArt,
  nautilus: NautilusArt,
  jellyfish: JellyfishArt,
  seafan: SeaFanArt,
  coral: CoralArt,
  kelp: KelpArt,
  scallop: ScallopArt,
  starfish: StarfishArt,
  crab: CrabArt,
  fish: FishArt,
  anchor: AnchorArt,
  urchin: UrchinArt,
}

// ---- patterns -------------------------------------------------------------------

type TileItem = { kind: string; mode: Mode; x: number; y: number; s: number; r?: number; seed?: number; color?: string; opacity?: number }
type Tile = { w: number; h: number; bg: string; items: TileItem[] }

const TILES: { [k: string]: Tile } = {
  "coral-reef": {
    w: 280, h: 280, bg: "var(--light)",
    items: [
      { kind: "coral", mode: "wash", x: 78, y: 262, s: 0.5, seed: 9 },
      { kind: "seafan", mode: "wash", x: 206, y: 270, s: 0.46, seed: 7 },
      { kind: "starfish", mode: "wash", x: 224, y: 70, s: 0.3, r: 18, seed: 4 },
      { kind: "scallop", mode: "wash", x: 16, y: 30, s: 0.42, r: 8 },
      { kind: "fish", mode: "ink", x: 132, y: 118, s: 0.5, r: -12, color: "var(--slate)" },
      { kind: "urchin", mode: "ink", x: 140, y: 36, s: 0.42, color: "var(--slate)" },
    ],
  },
  "shell-toss": {
    w: 260, h: 260, bg: "color-mix(in oklab, var(--sand) 62%, var(--light))",
    items: [
      { kind: "scallop", mode: "wash", x: 18, y: 22, s: 0.52, r: -10 },
      { kind: "scallop", mode: "wash", x: 150, y: 150, s: 0.46, r: 160 },
      { kind: "starfish", mode: "wash", x: 196, y: 64, s: 0.34, r: 30, seed: 2 },
      { kind: "starfish", mode: "wash", x: 70, y: 196, s: 0.3, r: -40, seed: 3 },
      { kind: "nautilus", mode: "wash", x: 206, y: 210, s: 0.36, r: 20 },
      { kind: "urchin", mode: "ink", x: 120, y: 112, s: 0.5, color: "var(--dark)" },
    ],
  },
  "octopus-ink": {
    w: 300, h: 300, bg: "var(--slate)",
    items: [
      { kind: "octopus", mode: "ink", x: 10, y: 0, s: 0.42, r: 0, seed: 3, color: "var(--light)" },
      { kind: "octopus", mode: "ink", x: 290, y: 300, s: 0.42, r: 180, seed: 5, color: "var(--light)" },
      { kind: "fish", mode: "ink", x: 220, y: 70, s: 0.55, r: 20, color: "var(--light)" },
      { kind: "fish", mode: "ink", x: 80, y: 230, s: 0.55, r: -160, color: "var(--light)" },
    ],
  },
  "kelp-stripe": {
    w: 260, h: 250, bg: "var(--light)",
    items: [
      { kind: "kelp", mode: "wash", x: 44, y: 248, s: 1.02, seed: 2 },
      { kind: "kelp", mode: "wash", x: 130, y: 250, s: 0.96, seed: 12, r: 3 },
      { kind: "kelp", mode: "wash", x: 216, y: 248, s: 1.04, seed: 21, r: -2 },
    ],
  },
  "jelly-bloom": {
    w: 300, h: 320, bg: "var(--deep)",
    items: [
      { kind: "jellyfish", mode: "wash", x: 90, y: 90, s: 0.62, seed: 5 },
      { kind: "jellyfish", mode: "wash", x: 230, y: 200, s: 0.44, r: 14, seed: 8 },
      { kind: "jellyfish", mode: "ink", x: 232, y: 40, s: 0.3, r: -18, seed: 9, color: "var(--dusk)" },
      { kind: "fish", mode: "ink", x: 60, y: 272, s: 0.5, r: 8, color: "var(--dusk)" },
    ],
  },
  "starfish-dot": {
    w: 150, h: 150, bg: "var(--light)",
    items: [
      { kind: "starfish", mode: "wash", x: 38, y: 38, s: 0.24, r: 10, seed: 1 },
      { kind: "starfish", mode: "ink", x: 112, y: 112, s: 0.22, r: 40, seed: 2, color: "var(--slate)" },
    ],
  },
}

function TileDefs({ id, keys }: { id: string; keys: string[] }) {
  return (
    <svg className="bct-defs" aria-hidden="true" focusable="false">
      <defs>
        {keys.map((key) => {
          const t = TILES[key]
          if (!t) return null
          return (
            <pattern key={key} id={id + "-pat-" + key} width={t.w} height={t.h} patternUnits="userSpaceOnUse">
              <rect width={t.w} height={t.h} style={{ fill: t.bg }} />
              {t.items.map((it, i) => {
                const Art = ART[it.kind]
                return (
                  <g key={i} transform={"translate(" + it.x + " " + it.y + ") scale(" + it.s + ") rotate(" + (it.r || 0) + ")"} style={{ color: it.color, opacity: it.opacity }}>
                    <Art mode={it.mode} seed={it.seed ?? 1} />
                  </g>
                )
              })}
            </pattern>
          )
        })}
      </defs>
    </svg>
  )
}

/** A box filled with a seamless tile, scaled. */
function PatternFill({ pattern, scale = 1, className, style }: { pattern: string; scale?: number; className?: string; style?: React.CSSProperties }) {
  const id = React.useContext(IdCtx)
  const n = 6000 / scale
  return (
    <svg className={"bct-fill" + (className ? " " + className : "")} style={style} aria-hidden="true" focusable="false" preserveAspectRatio="xMinYMin slice">
      <g transform={"scale(" + scale + ")"}>
        <rect width={n} height={n} fill={"url(#" + id + "-pat-" + pattern + ")"} />
      </g>
    </svg>
  )
}

/** A zig-zag (pinking-shear) clip for fabric swatches. */
function zigzag(teeth: number, depth: number) {
  const pts: string[] = []
  const step = 100 / teeth
  for (let i = 0; i <= teeth; i++) pts.push(i * step + "% " + (i % 2 ? depth + "px" : "0"))
  for (let i = 1; i < teeth; i++) pts.push((i % 2 ? "calc(100% - " + depth + "px)" : "100%") + " " + i * step + "%")
  for (let i = teeth; i >= 0; i--) pts.push(i * step + "% " + (i % 2 ? "calc(100% - " + depth + "px)" : "100%"))
  for (let i = teeth - 1; i > 0; i--) pts.push((i % 2 ? depth + "px" : "0") + " " + i * step + "%")
  return "polygon(" + pts.join(",") + ")"
}

// ---- small parts ----------------------------------------------------------------

function Tack({ x, y }: { x: string; y: string }) {
  return <i className="bct-tack" style={{ left: x, top: y }} aria-hidden="true" />
}

function Tape({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <i className={"bct-tape" + (className ? " " + className : "")} style={style} aria-hidden="true" />
}

function Wave({ className }: { className?: string }) {
  return (
    <svg className={"bct-wave" + (className ? " " + className : "")} viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0,30 C150,60 300,0 450,30 C600,60 750,0 900,30 C1050,60 1150,10 1200,30 L1200,60 L0,60 Z" fill="currentColor" />
    </svg>
  )
}

function Squiggle({ className }: { className?: string }) {
  return (
    <svg className={"bct-squiggle" + (className ? " " + className : "")} viewBox="0 0 120 14" aria-hidden="true" focusable="false">
      <path d="M2,8 C12,0 20,0 30,8 S48,16 58,8 S76,0 86,8 S104,16 118,8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function Arch() {
  return (
    <svg className="bct-arch" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14,58 V30 A18,18 0 0 1 50,30 V58 Z" />
        <path d="M14,58 H50 M32,58 V12 M14,40 H50 M14,30 L50,58 M50,30 L14,58" />
        <path d="M22,22 Q32,12 42,22" />
      </g>
    </svg>
  )
}

/** A pinned card that swings on its tack when dragged. */
function Pinned({ className, tilt = 0, pin = ["50%", "6%"], tacks = [["50%", "10px"]], children, style, onDragChange }: { className?: string; tilt?: number; pin?: [string, string]; tacks?: [string, string][] | null; children: React.ReactNode; style?: React.CSSProperties; onDragChange?: (on: boolean) => void }) {
  const ref = React.useRef(null as HTMLDivElement | null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.set(el, { rotate: tilt, transformOrigin: pin[0] + " " + pin[1] })
    let dragging = false
    let grab = 0
    let px = 0
    let py = 0
    let sx = 0
    let sy = 0
    let moved = false
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("a,input,textarea,select,[data-nodrag]")) return
      sx = e.clientX
      sy = e.clientY
      moved = false
      const r = el.getBoundingClientRect()
      px = r.left + (r.width * parseFloat(pin[0])) / 100
      py = r.top + (r.height * parseFloat(pin[1])) / 100
      grab = pinAngle(px, py, e.clientX, e.clientY)
      dragging = true
      el.setPointerCapture(e.pointerId)
      el.classList.add("is-drag")
      onDragChange?.(true)
      gsap.killTweensOf(el)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 6) moved = true
      gsap.set(el, { rotate: swingTo(tilt, grab, pinAngle(px, py, e.clientX, e.clientY)) })
    }
    const click = (e: MouseEvent) => {
      if (!moved) return
      moved = false
      e.stopPropagation()
      e.preventDefault()
    }
    const up = () => {
      if (!dragging) return
      dragging = false
      el.classList.remove("is-drag")
      onDragChange?.(false)
      gsap.to(el, { rotate: tilt, duration: 1.7, ease: "elastic.out(1, 0.32)" })
    }
    el.addEventListener("pointerdown", down)
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up)
    el.addEventListener("pointercancel", up)
    el.addEventListener("click", click, true)
    return () => {
      el.removeEventListener("click", click, true)
      el.removeEventListener("pointerdown", down)
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerup", up)
      el.removeEventListener("pointercancel", up)
    }
  }, [tilt, pin[0], pin[1]])
  return (
    <div ref={ref} className={"bct-pinned" + (className ? " " + className : "")} style={style}>
      {children}
      {tacks && tacks.map(([x, y], i) => <Tack key={i} x={x} y={y} />)}
    </div>
  )
}

/** A framed plate: wash under ink, or a photo, with a caption. */
function Plate({ plate, index, className, big }: { plate: BenthosPlate; index: number; className?: string; big?: boolean }) {
  const num = plate.number ?? "Plate " + roman(index + 1)
  return (
    <figure className={"bct-plate" + (className ? " " + className : "") + (big ? " is-big" : "")}>
      <div className="bct-plate-mat">
        <div className="bct-plate-art">
          {plate.src ? (
            <img src={plate.src} alt={plate.alt ?? plate.title} loading="lazy" decoding="async" />
          ) : (
            <>
              <Creature kind={plate.art ?? "nautilus"} mode="wash" seed={index + 3} />
              <Creature kind={plate.art ?? "nautilus"} mode="ink" seed={index + 3} className="bct-plate-ink" title={plate.title} />
            </>
          )}
        </div>
        <figcaption className="bct-plate-cap">
          <span className="bct-plate-num">{num}</span>
          <span className="bct-plate-title">{plate.title}</span>
          {plate.latin && <em className="bct-plate-latin">{plate.latin}</em>}
        </figcaption>
      </div>
    </figure>
  )
}

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

// ---- the template ---------------------------------------------------------------

export default function BenthosCollectionTemplate({
  height = "100svh",
  preset = "tidewater",
  colors,
  theme = "auto",
  fontHref = FONT_HREF,
  brand = "Benthos",
  brandNote = "Studio",
  nav = DEFAULT_NAV,
  hero: heroIn,
  deep: deepIn,
  moodboard: boardIn,
  palette = DEFAULT_PALETTE,
  patterns = DEFAULT_PATTERNS,
  patternsCopy,
  plates = DEFAULT_PLATES,
  printsCopy,
  licenses = DEFAULT_LICENSES,
  licenceCopy,
  currency = "$",
  footer: footerIn,
  socials = DEFAULT_SOCIALS,
  onBuy,
  onSubscribe,
  alive = true,
  className,
}: BenthosCollectionTemplateProps) {
  const hero = { ...DEFAULT_HERO, ...heroIn }
  const deep = { ...DEFAULT_DEEP, ...deepIn }
  const board = { ...DEFAULT_MOODBOARD, ...boardIn }
  const pCopy = { kicker: "Seamless patterns", title: "Tile the reef", body: "Every pattern repeats without a seam at 6000 px. Pick one and it lines the envelope on the board above.", ...patternsCopy }
  const prCopy = { kicker: "Wall art", title: "Eighteen plates, drawn to be framed", body: "Wash first, then ink, the way the old plate books were made. Printed on 300 gsm cotton rag at A2, or yours as a PDF to print anywhere.", ...printsCopy }
  const lCopy = { kicker: "Licence", title: "Take the whole ocean home", body: "One payment, every file, lifetime updates. Pick the licence that matches where the work will go.", seatsLabel: "Seats", button: "Buy", ...licenceCopy }
  const foot = { ...DEFAULT_FOOTER, ...footerIn }
  const c = { ...PALETTES[preset], ...colors }

  const rawId = React.useId()
  const uid = "bct" + rawId.replace(/[^a-zA-Z0-9]/g, "")
  const root = React.useRef(null as HTMLDivElement | null)
  const stage = React.useRef(null as HTMLDivElement | null)
  const sections = {
    collection: React.useRef(null as HTMLElement | null),
    moodboard: React.useRef(null as HTMLElement | null),
    patterns: React.useRef(null as HTMLElement | null),
    prints: React.useRef(null as HTMLElement | null),
    licence: React.useRef(null as HTMLElement | null),
  }
  const shelf = React.useRef(null as HTMLDivElement | null)
  const closeBtn = React.useRef(null as HTMLButtonElement | null)
  const lastFocus = React.useRef(null as HTMLElement | null)

  const [menu, setMenu] = React.useState(false)
  const [pattern, setPattern] = React.useState((patterns[0]?.key ?? "coral-reef") as string)
  const [prevPattern, setPrevPattern] = React.useState(null as string | null)
  const [envOpen, setEnvOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [sent, setSent] = React.useState(false)
  const [emailErr, setEmailErr] = React.useState(false)
  const [toast, setToast] = React.useState("")
  const [lightbox, setLightbox] = React.useState(null as number | null)
  const [tier, setTier] = React.useState(licenses.find((l) => l.featured)?.id ?? licenses[0]?.id ?? "")
  const [seats, setSeats] = React.useState(0)
  const [still, setStill] = React.useState(false)

  const tileKeys = React.useMemo(() => Array.from(new Set(patterns.map((p) => p.key).concat(["coral-reef", "shell-toss", "starfish-dot"]))), [patterns])
  const chosen = licenses.find((l) => l.id === tier) ?? licenses[0]
  const total = chosen ? orderTotal(chosen.price, SEAT_TIERS[seats]) : 0

  const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const go = (section?: string) => {
    const el = section && (sections as { [k: string]: React.MutableRefObject<HTMLElement | null> })[section]?.current
    setMenu(false)
    if (!el) return
    el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" })
  }

  const notify = (msg: string) => {
    setToast(msg)
    window.clearTimeout((notify as unknown as { t: number }).t)
    ;(notify as unknown as { t: number }).t = window.setTimeout(() => setToast(""), 1800)
  }

  const copySwatch = (sw: BenthosSwatch) => {
    copyText(sw.hex).then(
      () => notify("Copied " + sw.hex + " · " + sw.name),
      () => notify("Copying is blocked here"),
    )
  }

  const pickPattern = (key: string) => {
    if (key === pattern) return
    setPrevPattern(pattern)
    setPattern(key)
  }

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validEmail(email)) {
      setEmailErr(true)
      return
    }
    setEmailErr(false)
    setSent(true)
    onSubscribe?.(email.trim())
  }

  const buy = () => {
    if (!chosen) return
    const order = { license: chosen.id, seats: SEAT_TIERS[seats], total, currency }
    onBuy?.(order)
    notify(chosen.name + " licence · " + currency + total)
  }

  const scrollShelf = (dir: number) => {
    const el = shelf.current
    if (!el) return
    const card = el.querySelector(".bct-shelf-item") as HTMLElement | null
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 280) + 28), behavior: reduced() ? "auto" : "smooth" })
  }

  // ---- lightbox focus + escape ----
  React.useEffect(() => {
    if (lightbox === null) return
    lastFocus.current = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null)
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % plates.length))
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + plates.length) % plates.length))
    }
    window.addEventListener("keydown", key)
    return () => {
      window.removeEventListener("keydown", key)
      lastFocus.current?.focus?.()
    }
  }, [lightbox !== null])

  // ---- pattern crossfade ----
  React.useEffect(() => {
    if (!prevPattern || !root.current) return
    const el = root.current.querySelector(".bct-pat-old") as HTMLElement | null
    const nu = root.current.querySelector(".bct-pat-new") as HTMLElement | null
    if (!el || !nu || reduced()) {
      setPrevPattern(null)
      return
    }
    const tl = gsap.timeline({ onComplete: () => setPrevPattern(null) })
    tl.fromTo(nu, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: "power3.out" }, 0)
    tl.to(el, { autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 0)
    return () => {
      tl.kill()
    }
  }, [pattern])

  // ---- choreography ----
  useIso(() => {
    const el = root.current
    const st = stage.current
    if (!el || !st) return
    const ctx = gsap.context(() => {
      const header = el.querySelector(".bct-header") as HTMLElement | null
      const bar = el.querySelector(".bct-progress i") as HTMLElement | null
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (bar) bar.style.transform = "scaleX(" + self.progress.toFixed(4) + ")"
          if (header) header.classList.toggle("is-tucked", self.direction === 1 && self.progress > 0.02 && self.progress < 0.985)
        },
      })
      ScrollTrigger.create({ trigger: ".bct-envelope", start: "top 72%", once: true, onEnter: () => setEnvOpen(true) })

      const mm = gsap.matchMedia()
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 760px)" },
        (cx) => {
          const { motion, wide } = cx.conditions as { motion: boolean; wide: boolean }
          if (!motion) {
            setStill(true)
            return
          }
          setStill(false)

          // the hero opens
          const intro = gsap.timeline({ defaults: { ease: "expo.out" } })
          intro
            .fromTo(st, { "--in": 0 }, { "--in": 1, duration: 1.9, ease: "expo.inOut" }, 0)
            .from(".bct-doodle", { autoAlpha: 0, scale: 0.8, duration: 1.2, stagger: 0.05 }, 0.2)
            .from(".bct-kicker", { y: 30, autoAlpha: 0, duration: 1.1 }, 0.5)
            .from(".bct-scene .bct-fig", { x: (i: number, t: Element) => +(t.getAttribute("data-dx") || 0), y: (i: number, t: Element) => +(t.getAttribute("data-dy") || 0), rotate: (i: number, t: Element) => +(t.getAttribute("data-dr") || 0), autoAlpha: 0, duration: 1.8, stagger: 0.08, ease: "power3.out" }, 0.55)
            .fromTo(".bct-grow", { "--draw": 0 }, { "--draw": 1, duration: 1.6, ease: "power2.inOut", stagger: 0.1 }, 0.8)
            .from(".bct-hero-copy > *", { y: 34, autoAlpha: 0, duration: 1.2, stagger: 0.09 }, 0.9)
            .from(".bct-badge", { scale: 0, rotate: -40, duration: 1.2, ease: "back.out(2)" }, 1.4)
            .from(".bct-under > *", { y: 22, autoAlpha: 0, duration: 1, stagger: 0.08 }, 1.5)
            .from(".bct-peek-card", { y: 120, autoAlpha: 0, duration: 1.3, stagger: 0.05, ease: "expo.out" }, 1.6)
            .from(".bct-bubble", { autoAlpha: 0, duration: 1 }, 1.4)

          // the dive: oval → full bleed, creatures out, whale across, contents in
          const dive = gsap.timeline({ scrollTrigger: { trigger: ".bct-dive", start: "top top", end: "bottom bottom", scrub: 0.9 }, defaults: { ease: "none" } })
          dive
            .fromTo(st, { "--open": 0 }, { "--open": 1, duration: 0.42 }, 0)
            .to(".bct-hero-copy", { scale: 0.78, yPercent: -16, autoAlpha: 0, duration: 0.3, ease: "power1.in" }, 0.03)
            .to(".bct-badge", { autoAlpha: 0, scale: 0.6, duration: 0.2 }, 0.05)
            .to(".bct-kicker", { yPercent: -80, autoAlpha: 0, duration: 0.2 }, 0)
            .to(".bct-under", { yPercent: 60, autoAlpha: 0, duration: 0.26 }, 0)
            .to(".bct-peek", { yPercent: 130, duration: 0.3, ease: "power1.in" }, 0)
            .to(".bct-doodle", { autoAlpha: 0, duration: 0.2 }, 0.05)
            .to(".bct-fig-drift", { y: (i: number, t: Element) => +(t.getAttribute("data-oy") || 160), x: (i: number, t: Element) => +(t.getAttribute("data-ox") || 0), autoAlpha: 0, duration: 0.42, ease: "power1.in" }, 0.02)
            .to(".bct-fig-octopus", { x: wide ? 220 : 120, y: -260, rotate: 18, autoAlpha: 0, duration: 0.42, ease: "power1.in" }, 0.02)
            .to(".bct-fig-whale", { xPercent: wide ? 330 : 190, yPercent: wide ? -34 : -60, rotate: -5, duration: 0.5, ease: "power1.inOut" }, 0.16)
            .fromTo(".bct-deep-copy > *", { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.2, stagger: 0.03, ease: "power2.out" }, 0.56)
            .fromTo(".bct-stat", { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.18, stagger: 0.025, ease: "power2.out" }, 0.62)
            .fromTo(".bct-formats", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.18 }, 0.8)

          // the numbers count once the contents are on screen
          const counters = Array.from(el.querySelectorAll(".bct-stat-n")) as HTMLElement[]
          ScrollTrigger.create({
            trigger: ".bct-dive",
            start: "62% bottom",
            once: true,
            onEnter: () => {
              counters.forEach((n, i) => {
                const target = +(n.getAttribute("data-value") || 0)
                const o = { v: 0 }
                gsap.to(o, { v: target, duration: 1.7, delay: i * 0.08, ease: "power3.out", onUpdate: () => { n.textContent = String(Math.round(o.v)) } })
              })
            },
          })

          // the board: cards drop onto their tacks
          gsap.from(".bct-board .bct-pinned", {
            y: -60,
            autoAlpha: 0,
            rotate: (i: number, t: Element) => +(gsap.getProperty(t, "rotate") || 0) + 9,
            duration: 1.3,
            stagger: 0.07,
            ease: "back.out(1.2)",
            scrollTrigger: { trigger: ".bct-board", start: "top 68%", once: true },
          })
          gsap.from(".bct-board .bct-tack", { scale: 0, duration: 0.6, stagger: 0.05, ease: "back.out(3)", scrollTrigger: { trigger: ".bct-board", start: "top 64%", once: true } })
          gsap.from(".bct-board-copy > *", { y: 28, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".bct-board-copy", start: "top 80%", once: true } })
          gsap.from(".bct-board-whale", { x: -120, autoAlpha: 0, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: ".bct-board", start: "top 60%", once: true } })

          // patterns: the wallpaper wipes in, the list deals
          gsap.from(".bct-pat-stage", { clipPath: "inset(0% 100% 0% 0%)", duration: 1.4, ease: "power3.inOut", scrollTrigger: { trigger: ".bct-patterns", start: "top 70%", once: true } })
          gsap.from(".bct-pat-item", { x: 40, autoAlpha: 0, duration: 0.9, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".bct-pat-list", start: "top 80%", once: true } })

          // prints: the plates lean in
          gsap.from(".bct-shelf-item", { y: 60, rotate: (i: number) => (i % 2 ? 3 : -3), autoAlpha: 0, duration: 1.1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".bct-shelf", start: "top 78%", once: true } })

          // licence
          gsap.from(".bct-lic", { y: 50, autoAlpha: 0, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".bct-licence", start: "top 70%", once: true } })
          gsap.from(".bct-licence .bct-fig", { y: 40, rotate: 10, autoAlpha: 0, duration: 1.4, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: ".bct-licence", start: "top 60%", once: true } })

          // footer wordmark
          gsap.from(".bct-foot-mark", { yPercent: 30, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".bct-footer", start: "top 85%", once: true } })
          gsap.from(".bct-foot-whale", { xPercent: -30, autoAlpha: 0, duration: 2, ease: "power2.out", scrollTrigger: { trigger: ".bct-footer", start: "top 70%", once: true } })

          // section headings everywhere
          gsap.utils.toArray(".bct-head").forEach((h) => {
            gsap.from((h as Element).children, { y: 26, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: h as Element, start: "top 82%", once: true } })
          })
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  // ---- pointer parallax in the hero ----
  React.useEffect(() => {
    const st = stage.current
    if (!st || !alive || reduced()) return
    const layers = Array.from(st.querySelectorAll("[data-depth]")) as HTMLElement[]
    const xs = layers.map((l) => gsap.quickTo(l, "--px", { duration: 1.2, ease: "power3.out" }))
    const ys = layers.map((l) => gsap.quickTo(l, "--py", { duration: 1.2, ease: "power3.out" }))
    let raf = 0
    let nx = 0
    let ny = 0
    const onMove = (e: PointerEvent) => {
      const r = st.getBoundingClientRect()
      nx = ((e.clientX - r.left) / r.width - 0.5) * 2
      ny = ((e.clientY - r.top) / r.height - 0.5) * 2
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const apply = () => {
      raf = 0
      layers.forEach((l, i) => {
        const d = +(l.getAttribute("data-depth") || 0)
        xs[i](nx * d * 18)
        ys[i](ny * d * 12)
      })
    }
    const onLeave = () => {
      nx = 0
      ny = 0
      if (!raf) raf = requestAnimationFrame(apply)
    }
    st.addEventListener("pointermove", onMove)
    st.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      st.removeEventListener("pointermove", onMove)
      st.removeEventListener("pointerleave", onLeave)
    }
  }, [alive])

  const vars = {
    "--c-paper": c.paper,
    "--c-ink": c.ink,
    "--c-deep": c.deep,
    "--c-abyss": c.abyss,
    "--c-slate": c.slate,
    "--c-dusk": c.dusk,
    "--c-sand": c.sand,
    "--c-coral": c.coral,
    "--c-kelp": c.kelp,
    "--c-gold": c.gold,
    "--h": height,
    "--display": DISPLAY,
    "--script": SCRIPT,
    "--label": LABEL,
  } as React.CSSProperties

  const bubbles = React.useMemo(() => Array.from({ length: 12 }, (_, i) => ({ x: 8 + ((i * 37) % 84), s: 6 + ((i * 13) % 11), d: (i * 1.7) % 9, t: 9 + ((i * 5) % 7) })), [])
  const doodles = [
    { kind: "fish", l: "6%", t: "14%", w: "4.5cqw", r: -12 },
    { kind: "nautilus", l: "88%", t: "10%", w: "4cqw", r: 10 },
    { kind: "anchor", l: "4%", t: "68%", w: "3cqw", r: 8 },
    { kind: "urchin", l: "90%", t: "60%", w: "3.2cqw", r: 0 },
    { kind: "fish", l: "84%", t: "34%", w: "3.8cqw", r: 165 },
    { kind: "starfish", l: "11%", t: "44%", w: "3.4cqw", r: 20 },
    { kind: "crab", l: "93%", t: "40%", w: "4.2cqw", r: -6 },
    { kind: "jellyfish", l: "20%", t: "80%", w: "3cqw", r: 14 },
  ] as { kind: BenthosCreature | "fish" | "anchor" | "urchin"; l: string; t: string; w: string; r: number }[]
  const icons = ["crab", "nautilus", "scallop", "starfish", "anchor", "fish", "urchin", "jellyfish", "seafan", "octopus", "kelp", "whale"] as (BenthosCreature | "fish" | "anchor" | "urchin")[]
  const swatchClip = React.useMemo(() => zigzag(12, 6), [])

  return (
    <IdCtx.Provider value={uid}>
      <div
        ref={root}
        className={"bct-root" + (theme === "dark" ? " bct-dark" : theme === "light" ? " bct-light" : "") + (alive ? " is-alive" : "") + (still ? " is-still" : "") + (className ? " " + className : "")}
        style={vars}
      >
        {fontHref && <link rel="stylesheet" href={fontHref} />}
        <style>{CSS}</style>
        <Defs id={uid} />
        <TileDefs id={uid} keys={tileKeys} />
        <i className="bct-grain" aria-hidden="true" />

        {/* header */}
        <header className="bct-header">
          <button type="button" className="bct-brand" onClick={() => window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" })} aria-label={brand + " — back to top"}>
            <Creature kind="nautilus" mode="ink" className="bct-brand-mark" />
            <span className="bct-brand-name">{brand}</span>
            {brandNote && <span className="bct-brand-note">{brandNote}</span>}
          </button>
          <nav className={"bct-nav" + (menu ? " is-open" : "")} aria-label="Sections">
            {nav.map((n, i) =>
              n.href ? (
                <a key={i} href={n.href}>{n.label}</a>
              ) : (
                <button key={i} type="button" onClick={() => go(n.section)}>{n.label}</button>
              ),
            )}
          </nav>
          <button type="button" className="bct-cta" onClick={() => go("licence")}>
            {hero.cta}
            <span className="bct-cta-price">{currency}{chosen?.price ?? ""}</span>
          </button>
          <button type="button" className="bct-burger" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu((m) => !m)}>
            <i />
            <i />
          </button>
          <div className="bct-progress" aria-hidden="true"><i /></div>
        </header>

        {/* the dive: hero porthole → the deep */}
        <section className="bct-dive" ref={sections.collection} aria-label="Collection">
          <div className="bct-stage" ref={stage}>
            <div className="bct-scene">
            {doodles.map((d, i) => (
              <Creature key={i} kind={d.kind} mode="ink" className="bct-doodle" style={{ left: d.l, top: d.t, width: d.w, transform: "rotate(" + d.r + "deg)" }} />
            ))}

            <p className="bct-kicker">{hero.kicker}</p>

            <div className="bct-porthole" aria-hidden="true">
              <div className="bct-water" />
              <div className="bct-caustic bct-caustic-a" />
              <div className="bct-caustic bct-caustic-b" />
              <div className="bct-rays" />
              <div className="bct-silhouettes" data-depth="-0.4">
                <Creature kind="kelp" mode="wash" seed={4} className="bct-sil bct-sil-a" />
                <Creature kind="kelp" mode="wash" seed={14} className="bct-sil bct-sil-b" />
                <Creature kind="seafan" mode="wash" seed={11} className="bct-sil bct-sil-c" />
                <Creature kind="coral" mode="wash" seed={2} className="bct-sil bct-sil-d" />
                <Creature kind="kelp" mode="wash" seed={23} className="bct-sil bct-sil-e" />
              </div>
              {bubbles.map((b, i) => (
                <i key={i} className="bct-bubble" style={{ left: b.x + "%", width: b.s, height: b.s, animationDelay: "-" + b.d + "s", animationDuration: b.t + "s" }} />
              ))}
              <div className="bct-vignette" />
            </div>

            <div className="bct-hero-anchor" data-depth="0.15">
              <div className="bct-hero-copy">
                <Arch />
                <h1 className="bct-title">{hero.title}</h1>
                <p className="bct-script">{hero.script}</p>
                <Squiggle />
                <p className="bct-byline">{hero.byline}</p>
              </div>
            </div>
            <div className="bct-badge" aria-hidden="true"><span>{hero.badge}</span></div>

            {/* the reef around the porthole */}
            <div className="bct-fig bct-fig-coral bct-fig-drift bct-grow" data-depth="0.5" data-dx="-60" data-dy="40" data-dr="-12" data-oy="220" data-ox="-80">
              <Creature kind="coral" mode="wash" seed={9} />
            </div>
            <div className="bct-fig bct-fig-kelp-a bct-fig-drift bct-grow" data-depth="0.35" data-dx="-40" data-dy="80" data-oy="260" data-ox="-40">
              <Creature kind="kelp" mode="wash" seed={2} className="bct-sway" />
            </div>
            <div className="bct-fig bct-fig-kelp-b bct-fig-drift bct-grow" data-depth="0.4" data-dx="40" data-dy="-60" data-dr="20" data-oy="-200" data-ox="120">
              <Creature kind="kelp" mode="wash" seed={7} className="bct-sway bct-sway-late" />
            </div>
            <div className="bct-fig bct-fig-fan bct-fig-drift bct-grow" data-depth="0.45" data-dx="80" data-dy="60" data-dr="10" data-oy="240" data-ox="140">
              <Creature kind="seafan" mode="wash" seed={7} />
            </div>
            <div className="bct-fig bct-fig-scallop bct-fig-drift" data-depth="0.6" data-dx="60" data-dy="60" data-dr="30" data-oy="200" data-ox="120">
              <Creature kind="scallop" mode="wash" />
            </div>
            <div className="bct-fig bct-fig-star bct-fig-drift" data-depth="0.55" data-dx="-60" data-dy="60" data-dr="-50" data-oy="220" data-ox="-90">
              <Creature kind="starfish" mode="wash" seed={4} />
            </div>
            <div className="bct-fig bct-fig-crab bct-fig-drift" data-depth="0.7" data-dx="80" data-dy="80" data-dr="8" data-oy="240" data-ox="160">
              <Creature kind="crab" mode="wash" />
            </div>
            <div className="bct-fig bct-fig-fish bct-fig-drift" data-depth="0.8" data-dx="-120" data-dy="0" data-dr="-8" data-oy="-120" data-ox="-220">
              <Creature kind="fish" mode="wash" />
            </div>
            <div className="bct-fig bct-fig-octopus" data-depth="0.3" data-dx="120" data-dy="-120" data-dr="16">
              <Creature kind="octopus" mode="wash" seed={3} className="bct-octo" />
            </div>
            <div className="bct-fig bct-fig-whale" data-depth="0.25" data-dx="-220" data-dy="60" data-dr="-6">
              <Creature kind="whale" mode="wash" flip className="bct-swim" />
            </div>

            <div className="bct-under">
              <p className="bct-tagline">{hero.tagline}</p>
              <div className="bct-under-actions">
                <button type="button" className="bct-btn" onClick={() => go("licence")}>{hero.cta}</button>
                <button type="button" className="bct-link" onClick={() => go("moodboard")}>{hero.secondary} <span aria-hidden="true">↓</span></button>
              </div>
            </div>

            <div className="bct-peek" aria-hidden="true">
              {tileKeys.slice(0, 4).map((k, i) => (
                <div key={k} className="bct-peek-card" style={{ "--i": i } as React.CSSProperties}><PatternFill pattern={k} scale={0.42} /></div>
              ))}
              {palette.slice(0, 3).map((sw, i) => (
                <div key={sw.hex} className="bct-peek-card bct-peek-chip" style={{ "--i": i + 4, "--sw": sw.hex } as React.CSSProperties}><span /><b>{sw.hex}</b></div>
              ))}
            </div>

            </div>

            {/* the deep: what's inside */}
            <div className="bct-deep">
              <div className="bct-deep-copy">
                <p className="bct-eyebrow">{deep.kicker}</p>
                <h2 className="bct-h2">{deep.title}</h2>
                <p className="bct-lede">{deep.body}</p>
              </div>
              <ul className="bct-stats">
                {(deep.stats ?? []).map((s, i) => (
                  <li key={i} className="bct-stat">
                    <b className="bct-stat-n" data-value={s.value}>{s.value}</b>
                    <span className="bct-stat-l">{s.label}</span>
                    {s.note && <span className="bct-stat-note">{s.note}</span>}
                  </li>
                ))}
              </ul>
              <p className="bct-formats">
                <span>Formats</span>
                {(deep.formats ?? []).map((f) => <em key={f}>{f}</em>)}
              </p>
            </div>
          </div>
        </section>

        {/* the moodboard */}
        <section className="bct-board" ref={sections.moodboard} aria-label="Moodboard">
          <Pinned className="bct-card bct-poster" tilt={-2.2} tacks={null}>
            <Tape className="bct-tape-a" />
            <Plate plate={{ number: board.posterNumber, title: board.posterTitle ?? "", latin: board.posterNote, art: "jellyfish" }} index={3} big />
          </Pinned>

          <Pinned className="bct-card bct-markcard" tilt={1.6} tacks={[["50%", "8px"]]}>
            <Creature kind="nautilus" mode="ink" className="bct-markcard-icon" />
            <span>{brand}</span>
          </Pinned>

          <div className="bct-board-whale" aria-hidden="true">
            <Creature kind="whale" mode="wash" className="bct-swim" />
          </div>

          <Pinned className="bct-card bct-icons" tilt={1.4} tacks={[["14px", "12px"], ["calc(100% - 14px)", "12px"]]}>
            <p className="bct-card-title">{board.iconsTitle}</p>
            <ul className="bct-icon-grid">
              {icons.map((k) => (
                <li key={k}><Creature kind={k} mode="ink" title={k} /></li>
              ))}
            </ul>
          </Pinned>

          <div className="bct-board-copy">
            <p className="bct-eyebrow">{board.kicker}</p>
            <h2 className="bct-h2">{board.title}</h2>
            <p className="bct-lede">{board.body}</p>
            <div className="bct-actions">
              <button type="button" className="bct-btn" onClick={() => go("prints")}>{board.primary}</button>
              <button type="button" className="bct-link" onClick={() => palette[0] && copySwatch(palette[0])}>{board.secondary}</button>
            </div>
          </div>

          <ul className="bct-chips" aria-label="Palette">
            {palette.map((sw, i) => (
              <li key={sw.hex}>
                <Pinned className="bct-chipcard" tilt={[-3, 2, -1.5, 2.5, -2, 1][i % 6]} tacks={[["50%", "7px"]]} pin={["50%", "6%"]}>
                  <button type="button" className={"bct-chip" + (luminance(sw.hex) < 0.4 ? " is-dark" : "")} style={{ "--sw": sw.hex } as React.CSSProperties} onClick={() => copySwatch(sw)} aria-label={"Copy " + sw.name + " " + sw.hex}>
                    <span className="bct-chip-color" />
                    <span className="bct-chip-name">{sw.name}</span>
                    <span className="bct-chip-hex">{sw.hex}</span>
                  </button>
                </Pinned>
              </li>
            ))}
          </ul>

          <div className="bct-swatches" aria-label="Pattern swatches">
            {patterns.slice(0, 3).map((p, i) => (
              <Pinned key={p.key} className={"bct-swatch" + (p.key === pattern ? " is-on" : "")} tilt={[-4, 3, -2][i]} tacks={[["50%", "10px"]]} pin={["50%", "8%"]}>
                <button type="button" className="bct-swatch-btn" style={{ clipPath: swatchClip }} onClick={() => pickPattern(p.key)} aria-pressed={p.key === pattern} aria-label={"Use " + p.name + " on the envelope"}>
                  <PatternFill pattern={p.key} scale={0.4} />
                </button>
                <span className="bct-swatch-name">{p.name}</span>
              </Pinned>
            ))}
          </div>

          <div className="bct-board-shell" aria-hidden="true">
            <Creature kind="scallop" mode="wash" />
            <Creature kind="starfish" mode="wash" seed={2} />
          </div>

          <div className={"bct-envelope" + (envOpen ? " is-open" : "")}>
            <div className="bct-env-back">
              <PatternFill pattern={pattern} scale={0.38} className="bct-env-lining" />
            </div>
            <div className="bct-env-letter">
              <form className="bct-letter" onSubmit={subscribe} noValidate>
                <p className="bct-letter-title">{board.envelopeTitle}</p>
                <p className="bct-letter-body">{board.envelopeBody}</p>
                {sent ? (
                  <p className="bct-letter-done" role="status">{board.envelopeDone}</p>
                ) : (
                  <div className="bct-letter-row">
                    <label className="bct-sr" htmlFor={uid + "-email"}>Email</label>
                    <input id={uid + "-email"} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailErr(false) }} placeholder={board.envelopePlaceholder} aria-invalid={emailErr || undefined} aria-describedby={emailErr ? uid + "-err" : undefined} />
                    <button type="submit" className="bct-btn bct-btn-sm">{board.envelopeButton}</button>
                  </div>
                )}
                {emailErr && <p id={uid + "-err"} className="bct-letter-err">That address doesn't look right.</p>}
              </form>
            </div>
            <svg className="bct-env-front" viewBox="0 0 300 180" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M0,0 L150,104 L300,0 L300,180 L0,180 Z" className="bct-env-paper" />
              <path d="M0,180 L150,104 L300,180" className="bct-env-seam" />
            </svg>
            <button type="button" className="bct-env-flap" aria-expanded={envOpen} aria-label={envOpen ? "Close the envelope" : "Open the envelope"} onClick={() => setEnvOpen((o) => !o)}>
              <span className="bct-env-flap-out" />
              <span className="bct-env-flap-in"><PatternFill pattern={pattern} scale={0.38} /></span>
            </button>
            <Creature kind="fish" mode="ink" className="bct-env-fish" />
          </div>
        </section>

        {/* patterns */}
        <section className="bct-patterns" ref={sections.patterns} aria-label="Patterns">
          <div className="bct-head">
            <p className="bct-eyebrow">{pCopy.kicker}</p>
            <h2 className="bct-h2">{pCopy.title}</h2>
            <p className="bct-lede">{pCopy.body}</p>
          </div>
          <div className="bct-pat-stage" aria-hidden="true">
            {prevPattern && <PatternFill pattern={prevPattern} scale={0.72} className="bct-pat-old" />}
            <PatternFill key={pattern} pattern={pattern} scale={0.72} className="bct-pat-new" />
            <div className="bct-pat-label">
              <span>{patterns.find((p) => p.key === pattern)?.name}</span>
              <em>6000 × 6000 px · seamless</em>
            </div>
          </div>
          <ul className="bct-pat-list" role="radiogroup" aria-label="Choose a pattern">
            {patterns.map((p, i) => (
              <li key={p.key} className="bct-pat-item">
                <button type="button" role="radio" aria-checked={p.key === pattern} className={"bct-pat-btn" + (p.key === pattern ? " is-on" : "")} onClick={() => pickPattern(p.key)}>
                  <span className="bct-pat-thumb"><PatternFill pattern={p.key} scale={0.3} /></span>
                  <span className="bct-pat-text">
                    <b>{String(i + 1).padStart(2, "0")} · {p.name}</b>
                    {p.note && <small>{p.note}</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* prints */}
        <section className="bct-prints" ref={sections.prints} aria-label="Prints">
          <div className="bct-head bct-head-row">
            <div>
              <p className="bct-eyebrow">{prCopy.kicker}</p>
              <h2 className="bct-h2">{prCopy.title}</h2>
            </div>
            <p className="bct-lede">{prCopy.body}</p>
            <div className="bct-shelf-nav">
              <button type="button" onClick={() => scrollShelf(-1)} aria-label="Previous plates">←</button>
              <button type="button" onClick={() => scrollShelf(1)} aria-label="Next plates">→</button>
            </div>
          </div>
          <div className="bct-shelf" ref={shelf}>
            {plates.map((p, i) => (
              <button key={i} type="button" className="bct-shelf-item" onClick={() => setLightbox(i)} aria-label={"Open " + (p.number ?? "Plate " + roman(i + 1)) + ": " + p.title}>
                <Plate plate={p} index={i} />
              </button>
            ))}
          </div>
          <div className="bct-shelf-edge" aria-hidden="true" />
        </section>

        {/* licence */}
        <section className="bct-licence" ref={sections.licence} aria-label="Licence">
          <div className="bct-head">
            <p className="bct-eyebrow">{lCopy.kicker}</p>
            <h2 className="bct-h2">{lCopy.title}</h2>
            <p className="bct-lede">{lCopy.body}</p>
          </div>
          <div className="bct-lic-grid">
            {licenses.map((l) => (
              <label key={l.id} className={"bct-lic" + (l.id === tier ? " is-on" : "") + (l.featured ? " is-featured" : "")}>
                <input type="radio" name={uid + "-tier"} value={l.id} checked={l.id === tier} onChange={() => setTier(l.id)} className="bct-sr" />
                <span className="bct-lic-top">
                  <span className="bct-lic-name">{l.name}</span>
                  <span className="bct-lic-price"><small>{currency}</small>{l.price}</span>
                </span>
                <span className="bct-lic-blurb">{l.blurb}</span>
                <ul className="bct-lic-list">
                  {l.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                {l.featured && <span className="bct-lic-tag">Most chosen</span>}
              </label>
            ))}
          </div>
          <div className="bct-order">
            <fieldset className="bct-seats">
              <legend>{lCopy.seatsLabel}</legend>
              {SEAT_TIERS.map((n, i) => (
                <label key={n} className={i === seats ? "is-on" : ""}>
                  <input type="radio" name={uid + "-seats"} className="bct-sr" checked={i === seats} onChange={() => setSeats(i)} />
                  {n === 100 ? "Studio" : n}
                </label>
              ))}
            </fieldset>
            <p className="bct-total" aria-live="polite">
              <span>{chosen?.name} · {SEAT_TIERS[seats] === 100 ? "studio" : SEAT_TIERS[seats] + (SEAT_TIERS[seats] === 1 ? " seat" : " seats")}</span>
              <b>{currency}{total}</b>
            </p>
            <button type="button" className="bct-btn bct-btn-lg" onClick={buy}>{lCopy.button} {chosen?.name}</button>
          </div>
          <div className="bct-fig bct-lic-fig-a" aria-hidden="true"><Creature kind="nautilus" mode="wash" /></div>
          <div className="bct-fig bct-lic-fig-b" aria-hidden="true"><Creature kind="starfish" mode="wash" seed={3} /></div>
        </section>

        {/* footer */}
        <footer className="bct-footer">
          <Wave className="bct-footer-wave" />
          <div className="bct-foot-whale" aria-hidden="true"><Creature kind="whale" mode="ink" /></div>
          <div className="bct-foot-grid">
            <div className="bct-foot-about">
              <p className="bct-foot-mark">{foot.title}</p>
              <p className="bct-foot-body">{foot.body}</p>
            </div>
            <ul className="bct-foot-links">
              {(foot.links ?? []).map((l, i) => (
                <li key={i}>{l.href ? <a href={l.href}>{l.label}</a> : <button type="button" onClick={() => go(i === 0 ? "collection" : i === 1 ? "prints" : "licence")}>{l.label}</button>}</li>
              ))}
            </ul>
            <ul className="bct-foot-social">
              {socials.map((s) => (
                <li key={s.label}><a href={s.href} target="_blank" rel="noreferrer">{s.label}</a></li>
              ))}
            </ul>
          </div>
          <p className="bct-foot-legal">{foot.legal}</p>
        </footer>

        {/* lightbox */}
        {lightbox !== null && plates[lightbox] && (
          <div className="bct-lightbox" role="dialog" aria-modal="true" aria-label={plates[lightbox].title} onClick={(e) => { if (e.target === e.currentTarget) setLightbox(null) }}>
            <div className="bct-lightbox-card">
              <Plate plate={plates[lightbox]} index={lightbox} big />
              <div className="bct-lightbox-text">
                <p className="bct-eyebrow">{plates[lightbox].number ?? "Plate " + roman(lightbox + 1)} of {plates.length}</p>
                <h3>{plates[lightbox].title}</h3>
                {plates[lightbox].latin && <em>{plates[lightbox].latin}</em>}
                {plates[lightbox].note && <p>{plates[lightbox].note}</p>}
                <div className="bct-actions">
                  <button type="button" className="bct-btn" onClick={() => { setLightbox(null); go("licence") }}>Included in every licence</button>
                  <div className="bct-lightbox-nav">
                    <button type="button" onClick={() => setLightbox((lightbox - 1 + plates.length) % plates.length)} aria-label="Previous plate">←</button>
                    <button type="button" onClick={() => setLightbox((lightbox + 1) % plates.length)} aria-label="Next plate">→</button>
                  </div>
                </div>
              </div>
              <button ref={closeBtn} type="button" className="bct-lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">×</button>
            </div>
          </div>
        )}

        <div className={"bct-toast" + (toast ? " is-on" : "")} role="status" aria-live="polite">{toast}</div>
      </div>
    </IdCtx.Provider>
  )
}

// ---- styles -----------------------------------------------------------------------

const CSS = `
.bct-root{--paper:var(--c-paper);--ink:var(--c-ink);--deep:var(--c-deep);--abyss:var(--c-abyss);--slate:var(--c-slate);--dusk:var(--c-dusk);--sand:var(--c-sand);--coral:var(--c-coral);--kelp:var(--c-kelp);--gold:var(--c-gold);--light:var(--c-paper);--dark:var(--c-ink);--card:color-mix(in oklab,var(--c-paper) 80%,#fff);--soft:color-mix(in oklab,var(--ink) 72%,var(--paper));--line:color-mix(in oklab,var(--ink) 16%,transparent);--band:color-mix(in oklab,var(--paper) 88%,var(--sand));position:relative;isolation:isolate;width:100%;background:var(--paper);color:var(--ink);font-family:var(--label);container-type:inline-size;overflow-x:clip;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.bct-root.bct-dark,:where(.dark) .bct-root:not(.bct-light){--paper:color-mix(in oklab,var(--c-abyss) 78%,#070b0d);--ink:var(--c-paper);--card:color-mix(in oklab,var(--c-abyss) 60%,#243034);--soft:color-mix(in oklab,var(--c-paper) 72%,var(--c-abyss));--line:color-mix(in oklab,var(--c-paper) 16%,transparent);--band:color-mix(in oklab,var(--paper) 86%,var(--c-slate))}
:where(.bct-root) button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit}
:where(.bct-root) :where(p,h1,h2,h3,ul,figure,fieldset){margin:0}
:where(.bct-root) :where(ul){padding:0;list-style:none}
:where(.bct-root) a{color:inherit}
.bct-root :where(button,a,input,[role=radio]):focus-visible{outline:2px solid var(--coral);outline-offset:3px}
.bct-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.bct-defs{position:absolute;width:0;height:0;overflow:hidden}
.bct-art{display:block;max-width:none}
.bct-fill{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:hidden}
.bct-grain{position:absolute;inset:0;z-index:40;pointer-events:none;opacity:.26;mix-blend-mode:multiply;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");background-size:240px 240px}
.bct-dark .bct-grain,:where(.dark) .bct-root:not(.bct-light) .bct-grain{mix-blend-mode:soft-light;opacity:.45}

/* type + buttons */
.bct-eyebrow{display:flex;align-items:center;gap:10px;font:500 11px/1.2 var(--label);letter-spacing:.22em;text-transform:uppercase;color:var(--coral)}
.bct-eyebrow::before{content:"";width:22px;height:1px;background:currentColor;flex:none}
.bct-h2{font:500 clamp(34px,4.4cqw,62px)/1.02 var(--display);letter-spacing:-.005em;max-width:18ch}
.bct-lede{font:300 clamp(15px,1.15cqw,17px)/1.65 var(--label);color:var(--soft);max-width:46ch}
.bct-head{display:grid;gap:16px;padding:0 6cqw;margin-bottom:3cqw}
.bct-actions{display:flex;flex-wrap:wrap;gap:12px 22px;align-items:center;margin-top:6px}
.bct-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:46px;padding:0 24px;border-radius:999px;background:var(--ink);color:var(--paper);font:500 13px/1 var(--label);letter-spacing:.06em;text-transform:uppercase;transition:background .25s,transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s;white-space:nowrap}
.bct-btn:hover{background:var(--coral);color:#fff;transform:translateY(-1px)}
.bct-btn:active{transform:translateY(0) scale(.98)}
.bct-btn-sm{height:40px;padding:0 18px;font-size:12px}
.bct-btn-lg{height:54px;padding:0 32px;font-size:14px}
.bct-link{font:500 13px/1 var(--label);letter-spacing:.06em;text-transform:uppercase;text-decoration:underline;text-underline-offset:6px;text-decoration-color:color-mix(in oklab,currentColor 40%,transparent);transition:text-decoration-color .25s}
.bct-link:hover{text-decoration-color:currentColor}

/* header */
.bct-header{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:20px;height:64px;padding:0 clamp(16px,3cqw,40px);background:color-mix(in oklab,var(--paper) 84%,transparent);backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);border-bottom:1px solid var(--line);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.bct-header.is-tucked{transform:translateY(-100%)}
.bct-progress{position:absolute;left:0;right:0;bottom:-1px;height:2px;overflow:hidden}
.bct-progress i{display:block;height:100%;background:var(--coral);transform:scaleX(0);transform-origin:0 50%}
.bct-brand{display:flex;align-items:center;gap:10px}
.bct-brand-mark{width:28px;height:28px;color:var(--ink)}
.bct-brand-name{font:500 24px/1 var(--display);letter-spacing:.04em}
.bct-brand-note{font:400 10px/1 var(--label);letter-spacing:.26em;text-transform:uppercase;opacity:.6;margin-top:4px}
.bct-nav{display:flex;gap:2px;margin-left:auto}
.bct-nav :where(a,button){display:block;padding:9px 13px;border-radius:999px;font:500 12px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;text-decoration:none;transition:background .2s,color .2s}
.bct-nav :where(a,button):hover{background:var(--ink);color:var(--paper)}
.bct-cta{display:flex;align-items:center;gap:10px;height:40px;padding:0 6px 0 18px;border-radius:999px;background:var(--ink);color:var(--paper);font:500 12px/1 var(--label);letter-spacing:.08em;text-transform:uppercase;transition:background .25s;white-space:nowrap}
.bct-cta:hover{background:var(--coral);color:#fff}
.bct-cta-price{display:inline-grid;place-items:center;height:28px;padding:0 10px;border-radius:999px;background:var(--coral);color:#fff;font-size:11px}
.bct-cta:hover .bct-cta-price{background:var(--ink)}
.bct-burger{display:none;width:40px;height:40px;place-items:center;align-content:center;gap:6px;margin-left:auto}
.bct-burger i{display:block;width:20px;height:2px;background:currentColor;transition:transform .3s}
.bct-burger[aria-expanded=true] i:first-child{transform:translateY(4px) rotate(45deg)}
.bct-burger[aria-expanded=true] i:last-child{transform:translateY(-4px) rotate(-45deg)}

/* the dive */
.bct-dive{position:relative;height:calc(var(--h) * 2.3);margin-top:-64px}
.bct-stage{position:sticky;top:0;height:var(--h);min-height:620px;overflow:hidden;--in:1;--open:0;--rx0:27;--ry0:32;--cy:49%}
.bct-scene{position:absolute;inset:0}
.bct-doodle{position:absolute;color:var(--ink);opacity:.2;pointer-events:none}
.bct-porthole{position:absolute;inset:0;background:var(--deep);clip-path:ellipse(calc(max(0, var(--rx0) * var(--in) + (90 - var(--rx0)) * var(--open)) * 1%) calc(max(0, var(--ry0) * var(--in) + (90 - var(--ry0)) * var(--open)) * 1%) at 50% var(--cy))}
.bct-water{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 12%,color-mix(in oklab,var(--deep) 62%,#8fb3a8) 0%,var(--deep) 46%,var(--abyss) 100%)}
.bct-caustic{position:absolute;inset:-30%;mix-blend-mode:screen;opacity:.2;pointer-events:none;background:radial-gradient(closest-side,rgba(255,255,255,.55),transparent 70%) 12% 18%/32% 26% no-repeat,radial-gradient(closest-side,rgba(255,255,255,.4),transparent 70%) 70% 30%/40% 30% no-repeat,radial-gradient(closest-side,rgba(255,255,255,.35),transparent 70%) 40% 70%/36% 24% no-repeat}
.bct-caustic-b{opacity:.14;background:radial-gradient(closest-side,rgba(255,255,255,.5),transparent 70%) 80% 70%/34% 28% no-repeat,radial-gradient(closest-side,rgba(255,255,255,.4),transparent 70%) 24% 60%/42% 30% no-repeat,radial-gradient(closest-side,rgba(255,255,255,.3),transparent 70%) 55% 10%/30% 22% no-repeat}
.bct-rays{position:absolute;inset:0;mix-blend-mode:screen;opacity:.9;background:conic-gradient(from 160deg at 50% -30%,transparent 0 34%,rgba(255,255,255,.07) 35% 36.5%,transparent 38% 43%,rgba(255,255,255,.05) 44% 45%,transparent 47% 51%,rgba(255,255,255,.08) 52% 53.5%,transparent 55% 60%,rgba(255,255,255,.05) 61% 62%,transparent 64%)}
.bct-silhouettes{position:absolute;inset:0;--px:0;--py:0;translate:calc(var(--px) * 1px) calc(var(--py) * 1px)}
.bct-sil{position:absolute;bottom:-1%;opacity:.5;filter:saturate(.55) brightness(.62)}
.bct-sil-a{left:27%;width:9cqw}
.bct-sil-b{left:62%;width:7cqw;bottom:-3%}
.bct-sil-c{left:42%;width:13cqw;bottom:-2%}
.bct-sil-d{left:33%;width:9cqw;bottom:-4%}
.bct-sil-e{left:70%;width:5.5cqw}
.bct-bubble{position:absolute;bottom:-24px;border-radius:50%;border:1px solid rgba(255,255,255,.5);background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.4),rgba(255,255,255,.04) 62%);opacity:0;display:none}
.is-alive .bct-bubble{display:block;animation-name:bct-rise;animation-timing-function:linear;animation-iteration-count:infinite}
.bct-vignette{position:absolute;inset:0;background:radial-gradient(60% 62% at 50% 48%,transparent 56%,rgba(0,0,0,.38) 100%)}
.bct-kicker{position:absolute;left:50%;top:calc(var(--cy) - var(--ry0) * 1% - 2.2cqw);transform:translate(-50%,-100%);font:400 clamp(22px,2.6cqw,38px)/1 var(--display);letter-spacing:.02em;white-space:nowrap}
.bct-hero-anchor{position:absolute;left:0;right:0;top:var(--cy);transform:translateY(-50%);display:grid;place-items:center;pointer-events:none;--px:0;--py:0;translate:calc(var(--px) * 1px) calc(var(--py) * 1px)}
.bct-hero-copy{display:flex;flex-direction:column;align-items:center;text-align:center;color:var(--c-paper);padding:0 8cqw}
.bct-arch{width:clamp(34px,3.2cqw,54px);height:auto;opacity:.8;margin-bottom:14px}
.bct-title{font:500 clamp(36px,5.5cqw,88px)/.95 var(--display);letter-spacing:.14em;text-transform:uppercase;padding-left:.14em;text-shadow:0 2px 30px rgba(0,0,0,.25)}
.bct-script{font:400 clamp(40px,6.2cqw,96px)/.8 var(--script);margin-top:-.14em;rotate:-4deg;text-shadow:0 2px 30px rgba(0,0,0,.25)}
.bct-squiggle{width:84px;opacity:.7;margin:18px 0 12px}
.bct-byline{font:400 11px/1 var(--label);letter-spacing:.32em;text-transform:uppercase;opacity:.78}
.bct-badge{position:absolute;left:calc(50% + var(--rx0) * 1% - 3.4cqw);top:calc(var(--cy) - 3.4cqw);width:clamp(58px,5.8cqw,88px);aspect-ratio:1;border-radius:50%;background:var(--slate);color:var(--c-paper);display:grid;place-items:center;font:500 clamp(14px,1.5cqw,22px)/1 var(--display);letter-spacing:.02em;box-shadow:0 14px 30px -14px rgba(0,0,0,.55);pointer-events:none}
.bct-badge::after{content:"";position:absolute;inset:5px;border-radius:50%;border:1px dashed color-mix(in oklab,var(--c-paper) 55%,transparent)}
.bct-fig{position:absolute;pointer-events:none;--px:0;--py:0;translate:calc(var(--px) * 1px) calc(var(--py) * 1px)}
.bct-fig .bct-art{width:100%;height:auto}
.bct-grow{clip-path:circle(calc(var(--draw,1) * 125%) at 50% 100%)}
.bct-fig-whale{left:1cqw;top:40%;width:31cqw;filter:drop-shadow(0 12px 14px rgba(0,0,0,.14))}
.bct-fig-octopus{left:61cqw;top:4%;width:19cqw;filter:drop-shadow(0 12px 14px rgba(0,0,0,.14))}
.bct-fig-coral{left:21cqw;top:10%;width:12cqw}
.bct-fig-kelp-a{left:26cqw;top:48%;width:6cqw}
.bct-fig-kelp-b{left:78cqw;top:38%;width:5.5cqw;rotate:14deg}
.bct-fig-fan{left:70cqw;top:54%;width:14cqw}
.bct-fig-scallop{left:83cqw;top:68%;width:6.5cqw}
.bct-fig-star{left:17cqw;top:66%;width:6cqw}
.bct-fig-crab{left:86cqw;top:80%;width:8.5cqw}
.bct-fig-fish{left:8cqw;top:24%;width:5cqw}
.bct-under{position:absolute;left:0;right:0;top:calc(var(--cy) + var(--ry0) * 1% + 1.6cqw);display:grid;justify-items:center;gap:16px;text-align:center}
.bct-tagline{font:italic 400 clamp(18px,2cqw,28px)/1.2 var(--display)}
.bct-under-actions{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:14px 24px}
.bct-peek{position:absolute;left:50%;bottom:-2.6cqw;transform:translateX(-50%);display:flex;gap:1.2cqw;align-items:flex-end;pointer-events:none}
.bct-peek-card{position:relative;width:9cqw;height:6.4cqw;background:var(--light);border:3px solid #fff;border-radius:3px;box-shadow:0 14px 26px -14px rgba(0,0,0,.5);rotate:calc((var(--i) - 3) * 2.2deg);translate:0 calc(abs(var(--i) - 3) * .35cqw);overflow:hidden}
.bct-peek-chip{display:grid;grid-template-rows:1fr auto}
.bct-peek-chip span{background:var(--sw)}
.bct-peek-chip b{font:500 9px/1 var(--label);letter-spacing:.08em;padding:5px 7px;color:var(--dark);text-transform:uppercase}
.bct-deep{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1.15fr;grid-template-areas:"copy stats" "formats formats";align-content:center;gap:2.6cqw 5cqw;padding:calc(64px + 3cqw) 7cqw 9cqw;color:var(--c-paper);pointer-events:none}
.bct-deep-copy{grid-area:copy;display:grid;gap:18px;align-content:center}
.bct-deep-copy > *,.bct-stat,.bct-formats{opacity:0}
.bct-deep .bct-eyebrow{color:var(--sand)}
.bct-deep .bct-lede{color:color-mix(in oklab,var(--c-paper) 80%,transparent)}
.bct-stats{grid-area:stats;display:grid;grid-template-columns:repeat(3,1fr);gap:1.8cqw 2cqw;align-self:center}
.bct-stat{display:grid;gap:5px;padding-top:14px;border-top:1px solid color-mix(in oklab,var(--c-paper) 25%,transparent)}
.bct-stat-n{font:300 clamp(38px,4.6cqw,72px)/1 var(--display);font-variant-numeric:tabular-nums}
.bct-stat-l{font:500 11px/1.3 var(--label);letter-spacing:.16em;text-transform:uppercase}
.bct-stat-note{font:300 13px/1.4 var(--label);opacity:.68}
.bct-formats{grid-area:formats;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font:500 11px/1 var(--label);letter-spacing:.2em;text-transform:uppercase}
.bct-formats span{margin-right:8px;opacity:.7}
.bct-formats em{font-style:normal;padding:8px 12px;border:1px solid color-mix(in oklab,var(--c-paper) 35%,transparent);border-radius:999px;letter-spacing:.12em}
.is-still .bct-dive{height:auto}
.is-still .bct-stage{position:relative;height:auto;min-height:0}
.is-still .bct-scene{position:relative;height:var(--h);min-height:620px}
.is-still .bct-deep{position:relative;inset:auto;background:var(--deep);padding:7cqw 7cqw 8cqw;pointer-events:auto}
.is-still .bct-deep :where(.bct-deep-copy > *,.bct-stat,.bct-formats){opacity:1}

/* the moodboard */
.bct-board{position:relative;display:grid;grid-template-columns:repeat(12,1fr);gap:2.6cqw 2cqw;padding:7cqw 6cqw 9cqw;align-items:start}
.bct-pinned{position:relative;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.bct-pinned.is-drag{cursor:grabbing;z-index:6}
.bct-card{background:var(--light);color:var(--dark);box-shadow:0 1px 0 rgba(0,0,0,.05),0 22px 44px -26px rgba(20,30,30,.55);transition:box-shadow .4s}
.bct-pinned:hover .bct-card,.bct-card.bct-pinned:hover{box-shadow:0 1px 0 rgba(0,0,0,.05),0 32px 56px -28px rgba(20,30,30,.6)}
.bct-tack{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#fff6d2,var(--gold) 46%,#6d4d14 100%);box-shadow:0 2px 3px rgba(0,0,0,.4),0 8px 12px -5px rgba(0,0,0,.45);z-index:4;pointer-events:none}
.bct-tape{position:absolute;width:92px;height:26px;left:-22px;top:-9px;background:color-mix(in oklab,var(--sand) 72%,transparent);transform:rotate(-7deg);z-index:4;clip-path:polygon(1% 0,99% 3%,100% 97%,0 100%);pointer-events:none;mix-blend-mode:multiply}
.bct-poster{grid-column:1/4;grid-row:1/4;width:100%;max-width:340px;justify-self:center}
.bct-poster .bct-plate{border:0;padding:6%}
.bct-markcard{grid-column:4/6;grid-row:1;width:clamp(110px,9cqw,140px);aspect-ratio:1;background:var(--slate);color:var(--c-paper);display:grid;place-content:center;justify-items:center;gap:8px;justify-self:center;font:400 10px/1 var(--label);letter-spacing:.28em;text-transform:uppercase}
.bct-markcard-icon{width:46%;color:var(--c-paper)}
.bct-board-whale{grid-column:6/9;grid-row:1;align-self:center;width:100%;filter:drop-shadow(0 14px 18px rgba(0,0,0,.14))}
.bct-board-whale .bct-art{width:100%;height:auto}
.bct-icons{grid-column:9/13;grid-row:1;padding:30px 18px 12px}
.bct-card-title{font:500 11px/1 var(--label);letter-spacing:.22em;text-transform:uppercase;margin-bottom:12px;opacity:.7}
.bct-icon-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.bct-icon-grid li{position:relative;aspect-ratio:1;min-width:0}
.bct-icon-grid .bct-art{position:absolute;left:9px;top:9px;width:calc(100% - 18px);height:calc(100% - 18px)}
.bct-board-copy{grid-column:4/9;grid-row:2/4;align-self:center;display:grid;justify-items:center;gap:18px;text-align:center;padding:1cqw 2cqw}
.bct-board-copy .bct-h2{font-size:clamp(30px,3.6cqw,52px);text-transform:uppercase;letter-spacing:.04em;max-width:none;font-weight:400}
.bct-board-copy .bct-lede{font:italic 300 clamp(14px,1.1cqw,16px)/1.7 var(--display);max-width:52ch}
.bct-chips{grid-column:9/13;grid-row:2;display:grid;grid-template-columns:repeat(3,1fr);gap:18px 10px;padding:14px 4px 0}
.bct-chipcard{aspect-ratio:5/6.2;background:var(--light);color:var(--dark);box-shadow:0 1px 0 rgba(0,0,0,.05),0 18px 34px -22px rgba(20,30,30,.55)}
.bct-chip{display:grid;grid-template-rows:1fr auto auto;width:100%;height:100%;padding:5px 5px 7px;gap:2px}
.bct-chip-color{background:var(--sw);min-height:0;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.bct-chip:hover .bct-chip-color{transform:scale(1.03)}
.bct-chip-name{font:500 10px/1.1 var(--label);margin-top:5px;padding:0 2px}
.bct-chip-hex{font:300 9.5px/1 var(--label);letter-spacing:.08em;text-transform:uppercase;opacity:.6;padding:0 2px}
.bct-swatches{grid-column:4/8;grid-row:4;display:flex;gap:2cqw;align-items:flex-end;justify-content:center;padding-top:1cqw}
.bct-swatch{width:clamp(96px,9.4cqw,136px);display:grid;justify-items:center;gap:8px}
.bct-swatch-btn{position:relative;display:block;width:100%;aspect-ratio:1;background:var(--light);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.bct-swatch-btn:hover{transform:scale(1.04)}
.bct-swatch-btn .bct-fill{inset:5px;width:calc(100% - 10px);height:calc(100% - 10px)}
.bct-swatch-name{font:500 10px/1 var(--label);letter-spacing:.18em;text-transform:uppercase;opacity:.7;display:flex;gap:6px;align-items:center}
.bct-swatch.is-on .bct-swatch-name{opacity:1}
.bct-swatch.is-on .bct-swatch-name::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--coral)}
.bct-board-shell{grid-column:8/9;grid-row:4;display:grid;gap:4px;align-self:end;justify-items:center}
.bct-board-shell .bct-art{width:6cqw;max-width:88px;height:auto}
.bct-board-shell .bct-art-starfish{width:4.6cqw;max-width:70px;rotate:22deg}
.bct-envelope{grid-column:9/13;grid-row:3/5;position:relative;width:min(100%,360px);aspect-ratio:300/180;justify-self:center;align-self:end;margin-top:36%;perspective:1100px;filter:drop-shadow(0 26px 30px rgba(20,30,30,.28))}
.bct-env-back{position:absolute;inset:0;background:color-mix(in oklab,var(--sand) 88%,#000);border-radius:3px;overflow:hidden}
.bct-env-lining{clip-path:polygon(0 0,100% 0,50% 60%)}
.bct-env-letter{position:absolute;left:5%;right:5%;top:7%;bottom:0;z-index:1;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.bct-envelope.is-open .bct-env-letter{transform:translateY(-78%)}
.bct-letter{display:grid;gap:8px;min-height:100%;padding:18px 18px 16px;background:var(--light);color:var(--dark);border-radius:2px;box-shadow:0 10px 24px -14px rgba(0,0,0,.5)}
.bct-letter-title{font:500 20px/1.1 var(--display);text-transform:uppercase;letter-spacing:.08em}
.bct-letter-body{font:300 12.5px/1.5 var(--label);opacity:.8}
.bct-letter-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:4px}
.bct-letter-row input{min-width:0;height:40px;padding:0 12px;border:1px solid color-mix(in oklab,var(--dark) 28%,transparent);border-radius:999px;background:#fff;color:var(--dark);font:400 13px var(--label)}
.bct-letter-row input::placeholder{color:color-mix(in oklab,var(--dark) 45%,transparent)}
.bct-letter-row input[aria-invalid=true]{border-color:var(--coral)}
.bct-letter .bct-btn{background:var(--dark);color:var(--light)}
.bct-letter-err{font:400 11.5px/1.3 var(--label);color:var(--coral)}
.bct-letter-done{font:italic 400 15px/1.3 var(--display);color:var(--dark);padding:10px 0 4px}
.bct-env-front{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}
.bct-env-paper{fill:var(--sand)}
.bct-env-seam{fill:none;stroke:rgba(0,0,0,.16);stroke-width:1}
.bct-env-flap{position:absolute;left:0;right:0;top:0;height:60%;transform-origin:50% 0;transform-style:preserve-3d;transition:transform .95s cubic-bezier(.45,0,.2,1),z-index 0s .42s;z-index:3}
.bct-envelope.is-open .bct-env-flap{transform:rotateX(180deg);z-index:0}
.bct-env-flap-out,.bct-env-flap-in{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;clip-path:polygon(0 0,100% 0,50% 100%);overflow:hidden}
.bct-env-flap-out{background:linear-gradient(180deg,color-mix(in oklab,var(--sand) 94%,#fff),color-mix(in oklab,var(--sand) 86%,#000))}
.bct-env-flap-in{transform:rotateX(180deg);background:var(--light)}
.bct-env-fish{position:absolute;right:7%;bottom:9%;width:36px;color:var(--dark);opacity:.55;z-index:2;pointer-events:none}
.bct-plate{background:var(--light);color:var(--dark);padding:4.5%;border:7px solid color-mix(in oklab,var(--c-ink) 82%,#000);box-shadow:0 1px 0 rgba(0,0,0,.08),0 26px 44px -28px rgba(0,0,0,.6)}
.bct-plate-mat{display:grid;gap:10px;padding:7% 7% 8%;border:1px solid color-mix(in oklab,var(--dark) 24%,transparent)}
.bct-plate-art{position:relative;aspect-ratio:1/1.08}
.bct-plate-art .bct-art,.bct-plate-art img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover}
.bct-plate-ink{opacity:.82}
.bct-plate-cap{display:grid;justify-items:center;gap:3px;text-align:center}
.bct-plate-num{font:500 9.5px/1 var(--label);letter-spacing:.3em;text-transform:uppercase;opacity:.7}
.bct-plate-num:empty{display:none}
.bct-plate-title{font:500 clamp(15px,1.4cqw,21px)/1.1 var(--display);text-transform:uppercase;letter-spacing:.1em;max-width:100%;overflow-wrap:anywhere}
.bct-poster .bct-plate-title{font-size:clamp(20px,1.9cqw,28px);letter-spacing:.16em}
.bct-plate-latin{font:italic 300 13px/1.2 var(--display);opacity:.72}

/* patterns */
.bct-patterns{position:relative;display:grid;grid-template-columns:1.25fr .9fr;grid-template-areas:"head head" "stage list";gap:2cqw 4cqw;padding:7cqw 6cqw 8cqw;background:var(--band)}
.bct-patterns .bct-head{grid-area:head;padding:0}
.bct-pat-stage{grid-area:stage;position:relative;aspect-ratio:4/3;background:var(--light);box-shadow:0 1px 0 rgba(0,0,0,.06),0 36px 60px -40px rgba(0,0,0,.6);overflow:hidden}
.bct-pat-stage .bct-fill{inset:12px;width:calc(100% - 24px);height:calc(100% - 24px)}
.bct-pat-label{position:absolute;left:30px;bottom:30px;display:grid;gap:3px;padding:12px 16px;background:var(--light);color:var(--dark);box-shadow:0 10px 24px -14px rgba(0,0,0,.5)}
.bct-pat-label span{font:500 16px/1 var(--display);letter-spacing:.16em;text-transform:uppercase}
.bct-pat-label em{font:300 10px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;font-style:normal;opacity:.7}
.bct-pat-list{grid-area:list;display:grid;gap:4px;align-self:center}
.bct-pat-btn{display:grid;grid-template-columns:58px 1fr;gap:16px;align-items:center;width:100%;padding:10px;border-radius:8px;border:1px solid transparent;transition:background .25s,border-color .25s}
.bct-pat-btn:hover{background:color-mix(in oklab,var(--ink) 6%,transparent)}
.bct-pat-btn.is-on{border-color:var(--ink)}
.bct-pat-thumb{position:relative;width:58px;height:58px;border-radius:4px;overflow:hidden;border:3px solid var(--light);box-shadow:0 0 0 1px var(--line)}
.bct-pat-text{display:grid;gap:3px}
.bct-pat-text b{font:500 15px/1.2 var(--label)}
.bct-pat-text small{font:300 12.5px/1.4 var(--label);color:var(--soft)}

/* prints */
.bct-prints{position:relative;padding:7cqw 0 6cqw;overflow:hidden}
.bct-head-row{grid-template-columns:1.1fr 1fr auto;align-items:end;gap:2cqw 4cqw}
.bct-head-row > div:first-child{display:grid;gap:16px}
.bct-shelf-nav{display:flex;gap:6px}
.bct-shelf-nav button,.bct-lightbox-nav button{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;font:400 18px/1 var(--label);transition:background .2s,color .2s}
.bct-shelf-nav button:hover,.bct-lightbox-nav button:hover{background:var(--ink);color:var(--paper)}
.bct-shelf{display:flex;align-items:flex-end;gap:2.2cqw;padding:2.5cqw 6cqw 2cqw;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;scroll-padding:0 6cqw}
.bct-shelf::-webkit-scrollbar{display:none}
.bct-shelf-item{flex:0 0 clamp(220px,21cqw,300px);scroll-snap-align:start;transition:translate .5s cubic-bezier(.2,.8,.2,1),rotate .5s cubic-bezier(.2,.8,.2,1)}
.bct-shelf-item:hover{translate:0 -10px;rotate:-.6deg}
.bct-shelf-edge{height:12px;margin:0 6cqw;border-top:2px solid color-mix(in oklab,var(--ink) 40%,transparent);background:linear-gradient(180deg,color-mix(in oklab,var(--ink) 14%,transparent),transparent)}

/* licence */
.bct-licence{position:relative;padding:7cqw 6cqw 9cqw;background:var(--band);overflow:hidden}
.bct-licence .bct-head{padding:0}
.bct-lic-grid{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:1.6cqw;margin-top:3cqw;z-index:1}
.bct-lic{position:relative;display:grid;gap:14px;align-content:start;padding:28px 24px 26px;background:var(--light);color:var(--dark);border:1px solid var(--line);cursor:pointer;transition:translate .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s,border-color .25s}
.bct-lic:hover{translate:0 -3px}
.bct-lic.is-on{border-color:var(--coral);box-shadow:0 0 0 1.5px var(--coral),0 34px 54px -40px rgba(0,0,0,.55);translate:0 -5px}
.bct-lic:focus-within{outline:2px solid var(--coral);outline-offset:3px}
.bct-lic-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.bct-lic-name{font:500 clamp(18px,1.6cqw,24px)/1 var(--display);text-transform:uppercase;letter-spacing:.12em}
.bct-lic-price{font:300 clamp(30px,2.8cqw,44px)/1 var(--display)}
.bct-lic-price small{font-size:.5em;vertical-align:top;margin-right:2px;line-height:1.6}
.bct-lic-blurb{font:300 14px/1.5 var(--label);opacity:.82}
.bct-lic-list{display:grid;gap:7px;font:400 13px/1.4 var(--label);padding-top:12px;border-top:1px solid color-mix(in oklab,var(--dark) 14%,transparent)}
.bct-lic-list li{display:flex;gap:10px;align-items:baseline}
.bct-lic-list li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--coral);flex:none;translate:0 -1px}
.bct-lic-tag{position:absolute;top:-12px;left:22px;padding:7px 11px;border-radius:999px;background:var(--coral);color:#fff;font:600 9.5px/1 var(--label);letter-spacing:.2em;text-transform:uppercase}
.bct-order{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:2cqw;margin-top:2.6cqw;padding-top:2cqw;border-top:1px solid var(--line);z-index:1}
.bct-seats{display:flex;flex-wrap:wrap;gap:6px;border:0;padding:0;align-items:center}
.bct-seats legend{float:left;font:500 11px/1 var(--label);letter-spacing:.22em;text-transform:uppercase;margin-right:14px;color:var(--soft)}
.bct-seats label{padding:9px 15px;border-radius:999px;border:1px solid var(--line);font:500 13px/1 var(--label);cursor:pointer;transition:background .2s,color .2s,border-color .2s}
.bct-seats label.is-on{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.bct-seats label:focus-within{outline:2px solid var(--coral);outline-offset:2px}
.bct-total{margin-left:auto;display:grid;text-align:right;gap:4px}
.bct-total span{font:400 11px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}
.bct-total b{font:300 clamp(28px,2.6cqw,40px)/1 var(--display)}
.bct-lic-fig-a{right:4cqw;top:3cqw;width:9cqw;rotate:-12deg}
.bct-lic-fig-b{left:3cqw;bottom:3cqw;width:6cqw;rotate:18deg}

/* footer */
.bct-footer{position:relative;background:var(--deep);color:var(--c-paper);padding:9cqw 6cqw 3cqw;overflow:hidden}
.bct-footer-wave{position:absolute;left:0;right:0;top:-1px;width:100%;height:4cqw;color:var(--band);transform:scaleY(-1)}
.bct-wave{display:block}
.bct-foot-whale{position:absolute;right:-6cqw;bottom:4cqw;width:40cqw;color:var(--c-paper);opacity:.2;pointer-events:none}
.bct-foot-whale .bct-art{width:100%;height:auto}
.bct-foot-grid{position:relative;display:grid;grid-template-columns:1.5fr .8fr .8fr;gap:4cqw;align-items:start}
.bct-foot-mark{font:400 clamp(72px,11cqw,172px)/.9 var(--script);rotate:-3deg;transform-origin:0 100%;margin-bottom:14px;margin-left:.1em}
.bct-foot-body{font:300 15px/1.6 var(--label);max-width:34ch;opacity:.85}
.bct-foot-links,.bct-foot-social{display:grid;gap:12px;font:400 14px/1 var(--label);padding-top:1cqw}
.bct-foot-links :where(a,button),.bct-foot-social a{opacity:.85;text-decoration:none;transition:opacity .2s}
.bct-foot-links :where(a,button):hover,.bct-foot-social a:hover{opacity:1;text-decoration:underline;text-underline-offset:5px}
.bct-foot-legal{position:relative;margin-top:5cqw;padding-top:16px;border-top:1px solid color-mix(in oklab,var(--c-paper) 18%,transparent);font:300 12px/1.4 var(--label);opacity:.65}

/* lightbox + toast */
.bct-lightbox{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:4vmin;background:color-mix(in oklab,var(--c-abyss) 82%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.bct-lightbox-card{position:relative;display:grid;grid-template-columns:minmax(240px,400px) minmax(240px,340px);gap:36px;align-items:center;padding:30px;max-width:min(96vw,900px);max-height:92vh;overflow:auto;background:var(--paper);color:var(--ink);box-shadow:0 50px 90px -40px rgba(0,0,0,.7)}
.bct-lightbox-text{display:grid;gap:6px}
.bct-lightbox-text h3{font:500 clamp(26px,3cqw,40px)/1.05 var(--display);margin-top:6px}
.bct-lightbox-text em{font:italic 300 16px/1.2 var(--display);color:var(--soft)}
.bct-lightbox-text p{font:300 15px/1.6 var(--label);color:var(--soft);margin-top:10px}
.bct-lightbox-nav{display:flex;gap:6px}
.bct-lightbox-close{position:absolute;right:12px;top:10px;width:40px;height:40px;border-radius:50%;font:300 28px/1 var(--display);display:grid;place-items:center;transition:background .2s,color .2s}
.bct-lightbox-close:hover{background:var(--ink);color:var(--paper)}
.bct-toast{position:fixed;left:50%;bottom:28px;z-index:70;transform:translate(-50%,16px);padding:11px 18px;border-radius:999px;background:var(--ink);color:var(--paper);font:500 13px/1 var(--label);opacity:0;pointer-events:none;transition:opacity .3s,transform .3s cubic-bezier(.2,.8,.2,1);box-shadow:0 20px 40px -20px rgba(0,0,0,.5)}
.bct-toast.is-on{opacity:1;transform:translate(-50%,0)}

/* life */
.is-alive .bct-caustic-a{animation:bct-drift-a 17s ease-in-out infinite alternate}
.is-alive .bct-caustic-b{animation:bct-drift-b 23s ease-in-out infinite alternate}
.is-alive .bct-rays{animation:bct-rays 15s ease-in-out infinite alternate}
.is-alive .bct-sway{animation:bct-sway 7s ease-in-out infinite alternate;transform-origin:50% 100%}
.is-alive .bct-sway-late{animation-delay:-3.5s;animation-duration:8.5s}
.is-alive .bct-octo{animation:bct-float 9s ease-in-out infinite alternate;transform-origin:50% 30%}
.is-alive .bct-swim{animation:bct-swim 8s ease-in-out infinite alternate}
.is-alive .bct-sil{animation:bct-sway 9s ease-in-out infinite alternate;transform-origin:50% 100%}
.is-alive .bct-sil-b,.is-alive .bct-sil-d{animation-delay:-4s;animation-duration:11s}
@keyframes bct-rise{0%{transform:translate(0,0);opacity:0}8%{opacity:.85}100%{transform:translate(18px,calc(var(--h) * -1.05));opacity:0}}
@keyframes bct-drift-a{from{transform:translate(-3%,-2%) scale(1)}to{transform:translate(4%,3%) scale(1.12)}}
@keyframes bct-drift-b{from{transform:translate(3%,2%) scale(1.1)}to{transform:translate(-4%,-3%) scale(1)}}
@keyframes bct-rays{from{transform:rotate(-2deg) scaleX(1);opacity:.7}to{transform:rotate(2deg) scaleX(1.06);opacity:1}}
@keyframes bct-sway{from{transform:rotate(-2.5deg) skewX(1.5deg)}to{transform:rotate(2.5deg) skewX(-1.5deg)}}
@keyframes bct-float{from{transform:translateY(-1.5%) rotate(-1.5deg)}to{transform:translateY(1.5%) rotate(1.5deg)}}
@keyframes bct-swim{from{transform:translateY(-2%) rotate(-1deg)}to{transform:translateY(2%) rotate(1.2deg)}}
@media (prefers-reduced-motion:reduce){.bct-root :where(.bct-caustic,.bct-rays,.bct-sway,.bct-octo,.bct-swim,.bct-sil,.bct-bubble){animation:none}.bct-root .bct-bubble{display:none}.bct-root :where(.bct-env-letter,.bct-env-flap,.bct-header,.bct-lic,.bct-shelf-item,.bct-toast){transition-duration:0s}}

/* tablet */
@container (max-width: 1100px){
.bct-stage{--rx0:36;--ry0:32}
.bct-fig-whale{left:-7cqw;top:38%;width:46cqw}
.bct-fig-octopus{left:60cqw;top:-3%;width:27cqw}
.bct-fig-coral{left:10cqw;top:9%;width:16cqw}
.bct-fig-kelp-a{left:17cqw;top:50%;width:8cqw}
.bct-fig-kelp-b{left:78cqw;top:10%;width:7cqw}
.bct-fig-fan{left:70cqw;top:50%;width:19cqw}
.bct-fig-scallop{left:86cqw;top:70%;width:8cqw}
.bct-fig-star{left:8cqw;top:70%;width:8cqw}
.bct-fig-crab{display:none}
.bct-fig-fish{left:5cqw;top:22%;width:7cqw}
.bct-badge{left:calc(50% + var(--rx0) * 1% - 3.4cqw)}
.bct-peek-card{width:12cqw;height:8.4cqw}
.bct-deep{grid-template-columns:1fr;grid-template-areas:"copy" "stats" "formats";gap:3cqw;padding:calc(64px + 2cqw) 6cqw 6cqw}
.bct-stats{gap:1.6cqw 2.4cqw}
.bct-board{gap:3cqw 2.4cqw}
.bct-poster{grid-column:1/5;grid-row:1/3}
.bct-markcard{grid-column:5/7;grid-row:1}
.bct-board-whale{grid-column:7/9;grid-row:1}
.bct-icons{grid-column:9/13;grid-row:1}
.bct-board-copy{grid-column:5/13;grid-row:2;padding:1cqw 0}
.bct-chips{grid-column:1/7;grid-row:3;grid-template-columns:repeat(6,1fr);align-self:start}
.bct-swatches{grid-column:7/13;grid-row:3;justify-content:flex-start}
.bct-board-shell{grid-column:1/3;grid-row:4;justify-items:start}
.bct-envelope{grid-column:4/11;grid-row:4;margin-top:22%;justify-self:center}
.bct-patterns{grid-template-columns:1fr;grid-template-areas:"head" "stage" "list"}
.bct-pat-list{grid-template-columns:1fr 1fr}
.bct-head-row{grid-template-columns:1fr 1fr}
.bct-shelf-nav{grid-column:1/-1}
.bct-lic-grid{gap:2cqw}
.bct-foot-grid{grid-template-columns:1.4fr 1fr 1fr}
}

/* phone */
@container (max-width: 760px){
.bct-header{gap:12px}
.bct-nav{display:none}
.bct-nav.is-open{display:grid;position:absolute;left:0;right:0;top:100%;padding:10px 16px 16px;background:color-mix(in oklab,var(--paper) 94%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.bct-nav.is-open :where(a,button){padding:12px 10px;border-radius:0;border-bottom:1px solid var(--line)}
.bct-cta{display:none}
.bct-burger{display:grid}
.bct-brand-note{display:none}
.bct-dive{height:calc(var(--h) * 2.1)}
.bct-stage{--rx0:46;--ry0:29;--cy:46%;min-height:600px}
.bct-kicker{font-size:19px;top:calc(var(--cy) - var(--ry0) * 1% - 14px);left:6cqw;transform:translate(0,-100%)}
.bct-title{font-size:clamp(34px,11cqw,60px);letter-spacing:.1em}
.bct-script{font-size:clamp(40px,11cqw,64px)}
.bct-arch{width:30px;margin-bottom:8px}
.bct-squiggle{width:64px;margin:10px 0 8px}
.bct-byline{font-size:9.5px;letter-spacing:.26em}
.bct-badge{left:auto;right:3cqw;top:calc(var(--cy) + 14%);width:56px;font-size:14px}
.bct-fig-whale{left:-14cqw;top:55%;width:72cqw}
.bct-fig-octopus{left:58cqw;top:6%;width:44cqw}
.bct-fig-coral{left:0;top:16%;width:24cqw}
.bct-fig-kelp-a{display:none}
.bct-fig-kelp-b{left:82cqw;top:24%;width:11cqw}
.bct-fig-fan{left:66cqw;top:62%;width:30cqw}
.bct-fig-scallop{left:4cqw;top:78%;width:13cqw;display:block}
.bct-fig-star,.bct-fig-crab,.bct-fig-fish{display:none}
.bct-doodle{display:none}
.bct-under{top:calc(var(--cy) + var(--ry0) * 1% + 14px);padding:0 6cqw;gap:12px}
.bct-tagline{font-size:17px}
.bct-under-actions{gap:10px 16px}
.bct-peek{display:none}
.bct-deep{grid-template-columns:1fr;grid-template-areas:"copy" "stats" "formats";gap:22px;padding:calc(64px + 14px) 6cqw 22px;align-content:center}
.bct-deep .bct-lede{font-size:14px}
.bct-stats{grid-template-columns:1fr 1fr;gap:14px 16px}
.bct-stat-n{font-size:34px}
.bct-stat-note{display:none}
.bct-formats em{padding:6px 9px}
.bct-board{grid-template-columns:1fr;gap:26px;padding:56px 6cqw 72px}
.bct-board > *{grid-column:1 !important;grid-row:auto !important}
.bct-board-copy{order:1;padding:0;text-align:left;justify-items:start}
.bct-poster{order:2;max-width:320px;justify-self:start}
.bct-markcard,.bct-board-whale,.bct-board-shell{display:none}
.bct-icons{order:3}
.bct-chips{order:4;grid-template-columns:repeat(3,1fr);gap:16px 10px;padding:8px 0 0}
.bct-swatches{order:5;justify-content:flex-start;gap:14px;padding-top:4px}
.bct-swatch{width:30%}
.bct-envelope{order:6;margin-top:34%;justify-self:center;width:min(100%,340px)}
.bct-letter{padding:14px}
.bct-letter-title{font-size:17px}
.bct-letter-row{grid-template-columns:1fr;gap:8px}
.bct-patterns{grid-template-columns:1fr;grid-template-areas:"head" "stage" "list";gap:22px;padding:56px 6cqw 64px}
.bct-pat-stage{aspect-ratio:1/1}
.bct-pat-stage .bct-fill{inset:8px;width:calc(100% - 16px);height:calc(100% - 16px)}
.bct-pat-label{left:18px;bottom:18px;padding:9px 12px}
.bct-pat-list{grid-template-columns:1fr}
.bct-prints{padding:56px 0 48px}
.bct-head{gap:12px;margin-bottom:22px}
.bct-head-row{grid-template-columns:1fr}
.bct-shelf{gap:16px;padding:16px 6cqw 14px}
.bct-shelf-item{flex-basis:72cqw}
.bct-licence{padding:56px 6cqw 64px}
.bct-lic-grid{grid-template-columns:1fr;gap:22px;margin-top:26px}
.bct-order{gap:18px;margin-top:28px;padding-top:22px}
.bct-total{margin-left:0;text-align:left;width:100%}
.bct-order .bct-btn{width:100%}
.bct-lic-fig-a,.bct-lic-fig-b{display:none}
.bct-footer{padding:64px 6cqw 24px}
.bct-footer-wave{height:28px}
.bct-foot-grid{grid-template-columns:1fr;gap:28px}
.bct-foot-mark{font-size:clamp(64px,20cqw,96px)}
.bct-foot-whale{width:70cqw;right:-20cqw;bottom:40px;opacity:.14}
.bct-foot-legal{margin-top:36px}
.bct-lightbox-card{grid-template-columns:1fr;gap:22px;padding:20px;max-height:94vh}
.bct-lightbox-card .bct-plate{max-width:320px;margin:0 auto}
}
`
