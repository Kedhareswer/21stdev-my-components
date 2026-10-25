"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Benthos Collection Template — a launch page for an illustration collection,
 * laid out like the plate book it sells: vintage natural-history plates on
 * cream paper around a deep-green window full of watercolour seaweed, then a
 * pinboard of the things the collection makes (a Haeckel poster, palette
 * chips, a line-icon sheet, fabric swatches, a monogram, an envelope lined
 * with the reef), seamless patterns, framed prints and a licence.
 *
 * - The artwork is real: public-domain and CC BY plates (Haeckel, Scammon,
 *   Merculiano, Te Papa's Seaweeds of New Zealand) fetched from Wikimedia
 *   Commons and lifted off their paper at runtime in a Web Worker, so a
 *   whale or an octopus can break over the window's edge. Every piece is a
 *   prop; swap in your own scans or cut-outs.
 * - Seamless pattern tiles are composed on a canvas from the same cut-outs.
 * - Hand-drawn SVG versions of every creature stand in while plates load, if
 *   they are blocked, and as the line-icon sheet.
 * - The window is a clip-path. Scrolling morphs it from a rounded panel into
 *   the full-bleed deep, the reef drifts out and the whale swims across while
 *   the collection's contents count up.
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

/**
 * One piece of artwork. `src` must be CORS-readable (Wikimedia, Unsplash,
 * your own CDN). Set `key: false` for a PNG that already has transparency.
 */
export type BenthosArt = {
  src: string
  /** Fractional crop [x0, y0, x1, y1] of the source. */
  crop?: number[]
  /** Longest side of the cut-out in pixels. */
  max?: number
  /** Lift the drawing off its paper. Default true. */
  key?: boolean
  /** Islands smaller than this fraction of the largest are dropped. */
  keep?: number
  /** Key paper pockets enclosed by the drawing larger than this fraction of the image. */
  holes?: number
  /** Recolour by luminance: [dark, light]. Good for engravings. */
  duotone?: string[]
  alt?: string
}

export type BenthosArtwork = {
  whale?: BenthosArt | null
  octopus?: BenthosArt | null
  gorgonian?: BenthosArt | null
  starfish?: BenthosArt | null
  brittlestar?: BenthosArt | null
  kelp?: BenthosArt | null
  kelpLeft?: BenthosArt | null
  weedBrown?: BenthosArt | null
  weedGreen?: BenthosArt | null
  weedRed?: BenthosArt | null
  weedRose?: BenthosArt | null
  coral?: BenthosArt | null
  scallop?: BenthosArt | null
  nautilus?: BenthosArt | null
  crab?: BenthosArt | null
  /** The poster on the moodboard (shown as is, not keyed). */
  poster?: string | null
}

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

export type BenthosPatternKey = "reef-toile" | "shell-toss" | "octopus-slate" | "kelp-garden" | "night-reef" | "starfish-dot"

export type BenthosPattern = { key: BenthosPatternKey; name: string; note?: string }

export type BenthosPlate = {
  /** "Plate I" etc. Defaults to its roman numeral. */
  number?: string
  title: string
  latin?: string
  note?: string
  /** Built-in drawing, shown when there is no src or it fails to load. */
  art?: BenthosCreature
  /** The plate itself: a scan, a photo or your own artwork. */
  src?: string
  /** Who made it, shown in the lightbox. */
  credit?: string
  alt?: string
}

export type BenthosLicense = { id: string; name: string; blurb: string; price: number; features: string[]; featured?: boolean }

export type BenthosOrder = { license: string; seats: number; total: number; currency: string }

export type BenthosFooter = {
  title?: string
  body?: string
  links?: { label: string; href?: string }[]
  legal?: string
  /** Big letter on the monogram card. Defaults to the brand's first letter. */
  monogram?: string
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
  /** Replace any default plate or cut-out; null drops one back to the drawing. */
  artwork?: BenthosArtwork
  /** "plates" fetches the vintage artwork; "drawn" uses only the built-in SVG drawings (no network). */
  artMode?: "plates" | "drawn"
  /** Credit line for the artwork, shown in the footer. null hides it. */
  credits?: string | null
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

// Public-domain and CC BY plates on Wikimedia Commons (credits in the README).
// Thumbnail widths are the ones Wikimedia serves: 500, 960, 1280.
const WM = "https://upload.wikimedia.org/wikipedia/commons/"
const ASTERIDEA = WM + "thumb/5/5a/Haeckel_Asteridea.jpg/1280px-Haeckel_Asteridea.jpg"
const KALLYMENIA = WM + "thumb/5/5b/CA0008920080001_Watercolour_illustration_of_the_Kallymeniaceae_algae_Plate_75_from_Seaweeds_of_New_Zealand_Te_Papa_829925_85838.jpg/1280px-CA0008920080001_Watercolour_illustration_of_the_Kallymeniaceae_algae_Plate_75_from_Seaweeds_of_New_Zealand_Te_Papa_829925_85838.jpg"
const LESSONIA = WM + "thumb/a/ac/CA0008920020003_Watercolour_illustration_of_the_Lessonia_algae_Plate_31_from_Seaweeds_of_New_Zealand_Te_Papa_832679_311768.jpg/1280px-CA0008920020003_Watercolour_illustration_of_the_Lessonia_algae_Plate_31_from_Seaweeds_of_New_Zealand_Te_Papa_832679_311768.jpg"
const OCTOPUS = WM + "thumb/e/eb/Octopus_macropus_Merculiano.jpg/1280px-Octopus_macropus_Merculiano.jpg"
const ACTINIAE = WM + "thumb/a/a9/Haeckel_Actiniae.jpg/1280px-Haeckel_Actiniae.jpg"

const DEFAULT_ART = {
  whale: { src: WM + "thumb/e/eb/Whale_comparison_Public_Domian_photo_by_Charles_Melville_Scammon_for_coast_of_North_America_%281872%29.jpg/1280px-Whale_comparison_Public_Domian_photo_by_Charles_Melville_Scammon_for_coast_of_North_America_%281872%29.jpg", crop: [0.03, 0.13, 0.97, 0.53], max: 1200, alt: "A humpback whale, after C. M. Scammon (1874)" },
  octopus: { src: OCTOPUS, max: 1000, holes: 0.0012, alt: "Octopus macropus, after C. Merculiano (1896)" },
  gorgonian: { src: WM + "thumb/a/ad/Fauna_und_Flora_des_Golfes_von_Napel_-_Die_Gorgoniden_-_von_Koch_1887.png/500px-Fauna_und_Flora_des_Golfes_von_Napel_-_Die_Gorgoniden_-_von_Koch_1887.png", crop: [0.06, 0.07, 0.66, 0.95], keep: 0.25, max: 700 },
  starfish: { src: ASTERIDEA, crop: [0.05, 0.68, 0.4, 0.93], keep: 0.3, max: 600 },
  brittlestar: { src: ASTERIDEA, crop: [0.2, 0.27, 0.82, 0.67], keep: 0.3, holes: 0.0012, max: 800 },
  kelp: { src: LESSONIA, crop: [0.48, 0.01, 0.97, 0.985], max: 900 },
  kelpLeft: { src: LESSONIA, crop: [0.02, 0.01, 0.47, 0.985], max: 900 },
  weedBrown: { src: WM + "thumb/4/4d/CA0008920070001_Watercolour_illustration_of_the_Landsburgia_algae_Plate_46_from_Seaweeds_of_New_Zealand_Te_Papa_829923_172466.jpg/1280px-CA0008920070001_Watercolour_illustration_of_the_Landsburgia_algae_Plate_46_from_Seaweeds_of_New_Zealand_Te_Papa_829923_172466.jpg", crop: [0.08, 0.06, 0.7, 0.94], holes: 0.0012, max: 900 },
  weedGreen: { src: WM + "thumb/4/45/CA0008920050001_Watercolour_illustration_of_the_Enteromorpha_algae_Plate_3_from_Seaweeds_of_New_Zealand_Te_Papa_829664_172462.jpg/1280px-CA0008920050001_Watercolour_illustration_of_the_Enteromorpha_algae_Plate_3_from_Seaweeds_of_New_Zealand_Te_Papa_829664_172462.jpg", crop: [0.29, 0.3, 0.6, 0.97], max: 900 },
  weedRed: { src: KALLYMENIA, crop: [0, 0.06, 0.65, 0.42], holes: 0.0012, max: 900 },
  weedRose: { src: WM + "thumb/e/ee/CA0008920020001_Watercolour_illustration_of_the_Pachymenia_algae_Plate_71_from_Seaweeds_of_New_Zealand_Te_Papa_832669_311767.jpg/1280px-CA0008920020001_Watercolour_illustration_of_the_Pachymenia_algae_Plate_71_from_Seaweeds_of_New_Zealand_Te_Papa_832669_311767.jpg", crop: [0.5, 0.37, 0.99, 0.93], holes: 0.0012, max: 900 },
  coral: { src: KALLYMENIA, crop: [0.58, 0.31, 0.98, 0.6], keep: 0.3, holes: 0.0012, max: 700 },
  scallop: { src: WM + "thumb/7/75/PSM_V49_D563_Scallop_shell.jpg/960px-PSM_V49_D563_Scallop_shell.jpg", duotone: ["#7a3b22", "#f0d2a0"], max: 700 },
  nautilus: { src: WM + "thumb/f/f7/Schelp%2C_nautilus_pompilius_Schelpen_%28serietitel%29%2C_RP-P-OB-11.659.jpg/1280px-Schelp%2C_nautilus_pompilius_Schelpen_%28serietitel%29%2C_RP-P-OB-11.659.jpg", crop: [0.18, 0.06, 0.75, 0.86], duotone: ["#5b3a2a", "#ecd9b8"], max: 700 },
  crab: { src: WM + "thumb/d/d9/Kleiner_Taschenkrebs_%28Carcinus_maenas%29.jpg/1280px-Kleiner_Taschenkrebs_%28Carcinus_maenas%29.jpg", crop: [0, 0, 1, 0.9], max: 800 },
  poster: ACTINIAE,
} as BenthosArtwork

const DEFAULT_CREDITS =
  "Plates: E. Haeckel, Kunstformen der Natur (1904) · C. M. Scammon, The Marine Mammals (1874) · C. Merculiano (1896) · A. von Koch (1887) · Popular Science Monthly (1896) · Rijksmuseum (CC0) · N. M. Adams, Seaweeds of New Zealand, Te Papa (CC BY 4.0). Via Wikimedia Commons."

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
  title: "Two hundred and twenty pieces from the old plate books.",
  body: "Every plate was restored from a natural-history book, then cut out, cleaned and layered, with a line-drawn twin for every creature. Layer them, recolour them, tile them: the files are built to be taken apart.",
  stats: [
    { value: 120, label: "Cut-out elements", note: "transparent PNG + layered PSD" },
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
  title: "Discover the world of the Underwater Aesthetics collection!",
  body: "Loaded with watercolour elements, engraved creatures, posters and patterns, creating art has never been easier. Explore the old plate books of the deep: pin one to a wall, line an envelope with the reef, print a tote, brand a bathhouse. Start your dive now.",
  primary: "Browse the prints",
  secondary: "Copy a colour",
  posterNumber: "Tafel 49",
  posterTitle: "Actiniae",
  posterNote: "Sea anemones · after E. Haeckel",
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
  { key: "reef-toile", name: "Reef Toile", note: "whales, octopus and red coral on paper" },
  { key: "night-reef", name: "Night Reef", note: "a seaweed garden in deep water" },
  { key: "shell-toss", name: "Shell Toss", note: "scallops, nautilus and starfish on sand" },
  { key: "octopus-slate", name: "Octopus Slate", note: "Merculiano's octopus on slate blue" },
  { key: "kelp-garden", name: "Kelp Garden", note: "watercolour kelp in loose columns" },
  { key: "starfish-dot", name: "Starfish Dot", note: "a small polka of Haeckel starfish" },
] as BenthosPattern[]

const DEFAULT_PLATES = [
  { title: "Sea anemones", latin: "Actiniae", art: "coral", src: ACTINIAE, credit: "E. Haeckel, Kunstformen der Natur, plate 49 (1904). Public domain.", note: "Fifteen anemones in full colour, the plate that started the collection." },
  { title: "Jellyfish", latin: "Discomedusae", art: "jellyfish", src: WM + "thumb/d/de/Haeckel_Discomedusae_8.jpg/1280px-Haeckel_Discomedusae_8.jpg", credit: "E. Haeckel, Kunstformen der Natur, plate 8 (1904). Public domain.", note: "Desmonema annasethe trailing its frills, Haeckel's most reproduced plate." },
  { title: "Common octopus", latin: "Octopus macropus", art: "octopus", src: OCTOPUS, credit: "C. Merculiano, Naples (1896). Public domain.", note: "Painted from life at the Naples Zoological Station." },
  { title: "Starfish", latin: "Asteridea", art: "starfish", src: ASTERIDEA, credit: "E. Haeckel, Kunstformen der Natur, plate 40 (1904). Public domain.", note: "Twelve sea stars from above and below." },
  { title: "Kelp", latin: "Lessonia variegata", art: "kelp", src: LESSONIA, credit: "N. M. Adams, Seaweeds of New Zealand, plate 31. Te Papa, CC BY 4.0.", note: "Watercolour, the fronds laid out as they dry on paper." },
  { title: "Siphonophores", latin: "Siphonophorae", art: "jellyfish", src: WM + "thumb/0/05/Haeckel_Siphonophorae_59.jpg/1280px-Haeckel_Siphonophorae_59.jpg", credit: "E. Haeckel, Kunstformen der Natur, plate 59 (1904). Public domain.", note: "A colony that swims as one animal." },
  { title: "Brown algae", latin: "Fucoideae", art: "kelp", src: WM + "thumb/b/b5/Haeckel_Fucoideae.jpg/1280px-Haeckel_Fucoideae.jpg", credit: "E. Haeckel, Kunstformen der Natur, plate 65 (1904). Public domain.", note: "Engraved, the only plate in the set printed in one ink." },
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
  legal: "© 2026 Benthos Studio. Plates restored from public-domain scans.",
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

// ---- artwork ----------------------------------------------------------------------
//
// Plates are fetched (CORS), cropped, and their paper keyed out so a creature
// can sit on any background. The work runs in a Web Worker built from
// keyPaper's own source; where workers or OffscreenCanvas are missing it runs
// on the main thread. Results are cached per page as blob URLs.

// #region key
type KeyOpts = { lo?: number; hi?: number; keep?: number; holes?: number; duotone?: string[] }

/**
 * Lift a drawing off its paper, in place. Self-contained (it is shipped to a
 * worker as source). Paper is flooded in from the border, so pale highlights
 * inside the drawing stay opaque; large enclosed pockets of paper are keyed
 * when \`holes\` is set. Edge pixels get partial alpha with the paper colour
 * unmixed out of them, and specks smaller than \`keep\` × the largest island
 * are dropped. Returns the paper colour it found.
 */
function keyPaper(px: Uint8ClampedArray, w: number, h: number, o: KeyOpts) {
  const lo = o.lo ?? 0.05
  const hi = o.hi ?? 0.13
  const n = w * h
  // paper colour: per-channel median along the border
  const rs: number[] = []
  const gs: number[] = []
  const bs: number[] = []
  const step = Math.max(1, Math.floor((w + h) / 400))
  const take = (x: number, y: number) => {
    const i = (y * w + x) * 4
    rs.push(px[i])
    gs.push(px[i + 1])
    bs.push(px[i + 2])
  }
  for (let x = 0; x < w; x += step) {
    take(x, 0)
    take(x, h - 1)
  }
  for (let y = 0; y < h; y += step) {
    take(0, y)
    take(w - 1, y)
  }
  const med = (a: number[]) => a.sort((p, q) => p - q)[a.length >> 1]
  const pr = med(rs)
  const pg = med(gs)
  const pb = med(bs)
  // distance from the paper: darker counts fully, lighter (sheen) half
  const dist = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const r = px[i * 4]
    const g = px[i * 4 + 1]
    const b = px[i * 4 + 2]
    const dr = r < pr ? pr - r : (r - pr) * 0.5
    const dg = g < pg ? pg - g : (g - pg) * 0.5
    const db = b < pb ? pb - b : (b - pb) * 0.5
    dist[i] = Math.max(dr, dg, db) / 255
  }
  // flood the paper in from the border
  const paper = new Uint8Array(n)
  const stack = new Int32Array(n)
  let sp = 0
  const seed = (i: number) => {
    if (!paper[i] && dist[i] < hi) {
      paper[i] = 1
      stack[sp++] = i
    }
  }
  for (let x = 0; x < w; x++) {
    seed(x)
    seed((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    seed(y * w)
    seed(y * w + w - 1)
  }
  while (sp) {
    const i = stack[--sp]
    const x = i % w
    if (x > 0) seed(i - 1)
    if (x < w - 1) seed(i + 1)
    if (i >= w) seed(i - w)
    if (i < n - w) seed(i + w)
  }
  // enclosed pockets of paper (between arms, inside fronds)
  if (o.holes) {
    const min = n * o.holes
    const cut = hi * 0.85
    const pocket = new Int32Array(n)
    for (let i = 0; i < n; i++) {
      if (paper[i] || dist[i] >= cut) continue
      let size = 0
      sp = 0
      stack[sp++] = i
      paper[i] = 2
      while (sp) {
        const j = stack[--sp]
        pocket[size++] = j
        const x = j % w
        if (x > 0 && !paper[j - 1] && dist[j - 1] < cut) { paper[j - 1] = 2; stack[sp++] = j - 1 }
        if (x < w - 1 && !paper[j + 1] && dist[j + 1] < cut) { paper[j + 1] = 2; stack[sp++] = j + 1 }
        if (j >= w && !paper[j - w] && dist[j - w] < cut) { paper[j - w] = 2; stack[sp++] = j - w }
        if (j < n - w && !paper[j + w] && dist[j + w] < cut) { paper[j + w] = 2; stack[sp++] = j + w }
      }
      const v = size >= min ? 1 : 3
      for (let k = 0; k < size; k++) paper[pocket[k]] = v
    }
  }
  // alpha, with the paper colour unmixed from the soft edge
  for (let i = 0; i < n; i++) {
    const k = i * 4
    let a = 1
    if (paper[i] === 1) {
      const t = Math.max(0, Math.min(1, (dist[i] - lo) / (hi - lo)))
      a = t * t * (3 - 2 * t)
    }
    if (a <= 0.003) {
      px[k + 3] = 0
      continue
    }
    if (a < 1) {
      px[k] = Math.max(0, Math.min(255, pr + (px[k] - pr) / a))
      px[k + 1] = Math.max(0, Math.min(255, pg + (px[k + 1] - pg) / a))
      px[k + 2] = Math.max(0, Math.min(255, pb + (px[k + 2] - pb) / a))
    }
    px[k + 3] = Math.round(a * px[k + 3])
  }
  // islands: keep the big ones (grown by 2 px), drop captions, numbers, dust
  const keep = o.keep ?? 0.02
  const label = new Int32Array(n).fill(-1)
  const sizes: number[] = []
  for (let i = 0; i < n; i++) {
    if (label[i] !== -1 || px[i * 4 + 3] < 128) continue
    const id = sizes.length
    let size = 0
    sp = 0
    stack[sp++] = i
    label[i] = id
    while (sp) {
      const j = stack[--sp]
      size++
      const x = j % w
      if (x > 0 && label[j - 1] === -1 && px[(j - 1) * 4 + 3] >= 128) { label[j - 1] = id; stack[sp++] = j - 1 }
      if (x < w - 1 && label[j + 1] === -1 && px[(j + 1) * 4 + 3] >= 128) { label[j + 1] = id; stack[sp++] = j + 1 }
      if (j >= w && label[j - w] === -1 && px[(j - w) * 4 + 3] >= 128) { label[j - w] = id; stack[sp++] = j - w }
      if (j < n - w && label[j + w] === -1 && px[(j + w) * 4 + 3] >= 128) { label[j + w] = id; stack[sp++] = j + w }
    }
    sizes.push(size)
  }
  let big = 0
  for (const v of sizes) if (v > big) big = v
  let kept = new Uint8Array(n)
  for (let i = 0; i < n; i++) if (label[i] >= 0 && sizes[label[i]] >= big * keep) kept[i] = 1
  for (let pass = 0; pass < 2; pass++) {
    const grow = kept.slice()
    for (let i = 0; i < n; i++) {
      if (!kept[i]) continue
      const x = i % w
      if (x > 0) grow[i - 1] = 1
      if (x < w - 1) grow[i + 1] = 1
      if (i >= w) grow[i - w] = 1
      if (i < n - w) grow[i + w] = 1
    }
    kept = grow
  }
  for (let i = 0; i < n; i++) if (!kept[i]) px[i * 4 + 3] = 0
  if (o.duotone && o.duotone.length > 1) {
    const hex = (s: string) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
    const d = hex(o.duotone[0])
    const l = hex(o.duotone[1])
    for (let i = 0; i < n; i++) {
      const k = i * 4
      if (!px[k + 3]) continue
      const t = (0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]) / 255
      px[k] = d[0] + (l[0] - d[0]) * t
      px[k + 1] = d[1] + (l[1] - d[1]) * t
      px[k + 2] = d[2] + (l[2] - d[2]) * t
    }
  }
  return [pr, pg, pb]
}

/** Pixel crop rect and output size for a fractional crop and a longest side. */
function cropRect(iw: number, ih: number, crop: number[] | undefined, max: number) {
  const c = crop && crop.length === 4 ? crop : [0, 0, 1, 1]
  const sx = Math.max(0, Math.min(iw - 1, c[0] * iw))
  const sy = Math.max(0, Math.min(ih - 1, c[1] * ih))
  const sw = Math.max(1, Math.min(iw - sx, (c[2] - c[0]) * iw))
  const sh = Math.max(1, Math.min(ih - sy, (c[3] - c[1]) * ih))
  const sc = Math.min(1, max / Math.max(sw, sh))
  return { sx, sy, sw, sh, w: Math.max(1, Math.round(sw * sc)), h: Math.max(1, Math.round(sh * sc)) }
}
// #endregion

// #region tiles
/** Offsets at which an item must be drawn again so a tile wraps seamlessly. */
function wrapOffsets(x: number, y: number, r: number, W: number, H: number) {
  const xs = [0]
  const ys = [0]
  if (x - r < 0) xs.push(W)
  if (x + r > W) xs.push(-W)
  if (y - r < 0) ys.push(H)
  if (y + r > H) ys.push(-H)
  const out: number[][] = []
  for (const dx of xs) for (const dy of ys) out.push([dx, dy])
  return out
}
// #endregion

type Cut = { url: string; w: number; h: number }

// The worker's body. It is turned into source, so it may only use its
// argument and worker globals.
function workerMain(key: typeof keyPaper, rect: typeof cropRect) {
  const images: { [src: string]: Promise<ImageBitmap> } = {}
  const ctx = self as unknown as { onmessage: ((e: MessageEvent) => void) | null; postMessage: (m: unknown) => void }
  ctx.onmessage = async (e: MessageEvent) => {
    const { id, art } = e.data as { id: number; art: BenthosArt }
    try {
      images[art.src] =
        images[art.src] ||
        fetch(art.src, { mode: "cors", credentials: "omit" }).then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status)
          return r.blob().then((b) => createImageBitmap(b))
        })
      const bmp = await images[art.src]
      const r = rect(bmp.width, bmp.height, art.crop, art.max || 900)
      const c = new OffscreenCanvas(r.w, r.h)
      const g = c.getContext("2d") as OffscreenCanvasRenderingContext2D
      g.drawImage(bmp, r.sx, r.sy, r.sw, r.sh, 0, 0, r.w, r.h)
      if (art.key !== false || art.duotone) {
        const d = g.getImageData(0, 0, r.w, r.h)
        if (art.key !== false) key(d.data, r.w, r.h, { keep: art.keep, holes: art.holes, duotone: art.duotone })
        else key(d.data, r.w, r.h, { lo: 2, hi: 3, keep: 0, duotone: art.duotone })
        g.putImageData(d, 0, 0)
      }
      const blob = await c.convertToBlob({ type: "image/webp", quality: 0.9 })
      ctx.postMessage({ id, blob, w: r.w, h: r.h })
    } catch (err) {
      ctx.postMessage({ id, error: String(err) })
    }
  }
}

let worker: Worker | null | undefined
let jobId = 0
const jobs: { [id: number]: (v: Cut | null) => void } = {}
const cuts: { [k: string]: Promise<Cut | null> } = {}

function getWorker() {
  if (worker !== undefined) return worker
  worker = null
  try {
    if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") return null
    const code = "var K=" + keyPaper.toString() + ";var R=" + cropRect.toString() + ";(" + workerMain.toString() + ")(K,R)"
    const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }))
    const w = new Worker(url)
    w.onmessage = (e: MessageEvent) => {
      const { id, blob, w: cw, h: ch, error } = e.data as { id: number; blob?: Blob; w: number; h: number; error?: string }
      const done = jobs[id]
      delete jobs[id]
      if (done) done(blob && !error ? { url: URL.createObjectURL(blob), w: cw, h: ch } : null)
    }
    w.onerror = () => {
      // a CSP that refuses blob: workers lands here; finish on the main thread
      worker = null
      for (const id of Object.keys(jobs)) jobs[+id](null)
    }
    worker = w
  } catch {
    worker = null
  }
  return worker
}

function cutOnMain(art: BenthosArt): Promise<Cut | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.decoding = "async"
    img.onload = () => {
      try {
        const r = cropRect(img.naturalWidth, img.naturalHeight, art.crop, art.max || 900)
        const c = document.createElement("canvas")
        c.width = r.w
        c.height = r.h
        const g = c.getContext("2d")
        if (!g) return resolve(null)
        g.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, r.w, r.h)
        if (art.key !== false || art.duotone) {
          const d = g.getImageData(0, 0, r.w, r.h)
          if (art.key !== false) keyPaper(d.data, r.w, r.h, { keep: art.keep, holes: art.holes, duotone: art.duotone })
          else keyPaper(d.data, r.w, r.h, { lo: 2, hi: 3, keep: 0, duotone: art.duotone })
          g.putImageData(d, 0, 0)
        }
        c.toBlob((b) => resolve(b ? { url: URL.createObjectURL(b), w: r.w, h: r.h } : null), "image/webp", 0.9)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = art.src
  })
}

/** One cut-out, cached for the page. Resolves null when it cannot be made. */
function cutout(art: BenthosArt): Promise<Cut | null> {
  const k = [art.src, (art.crop || []).join(","), art.max || 0, art.key !== false, art.keep || 0, art.holes || 0, (art.duotone || []).join(",")].join("|")
  if (cuts[k] !== undefined) return cuts[k]
  const w = getWorker()
  cuts[k] = w
    ? new Promise<Cut | null>((resolve) => {
        const id = ++jobId
        jobs[id] = (v) => (v ? resolve(v) : cutOnMain(art).then(resolve))
        w.postMessage({ id, art })
      })
    : cutOnMain(art)
  return cuts[k]
}

/** Cut-outs by name: undefined while pending, null when unavailable. */
function useCutouts(art: { [k: string]: BenthosArt | null | undefined }, on: boolean, order: string[]) {
  const [state, setState] = React.useState({} as { [k: string]: Cut | null | undefined })
  const sig = on ? order.map((k) => (art[k] ? art[k]!.src + (art[k]!.crop || []).join(",") : "-")).join(";") : "off"
  React.useEffect(() => {
    if (!on || typeof window === "undefined") {
      const none: { [k: string]: null } = {}
      for (const k of order) none[k] = null
      setState(none)
      return
    }
    let alive = true
    for (const k of order) {
      const a = art[k]
      if (!a) {
        setState((s) => ({ ...s, [k]: null }))
        continue
      }
      cutout(a).then((c) => {
        if (alive) setState((s) => ({ ...s, [k]: c }))
      })
    }
    return () => {
      alive = false
    }
  }, [sig])
  return state
}

// ---- pattern tiles on canvas ------------------------------------------------------

type TileItem2 = { art: string; x: number; y: number; s: number; r?: number; flip?: boolean; alpha?: number; filter?: string }
type TileDef = { w: number; h: number; bg: string; items: TileItem2[] }

/** Seamless tiles composed from the cut-outs. Sizes are in tile pixels; s is the cut-out's longest side. */
const CANVAS_TILES: { [k: string]: TileDef } = {
  "reef-toile": {
    w: 900, h: 900, bg: "paper",
    items: [
      { art: "whale", x: 280, y: 190, s: 420, r: -6 },
      { art: "octopus", x: 720, y: 560, s: 330, r: 12 },
      { art: "gorgonian", x: 170, y: 640, s: 300, r: -10 },
      { art: "starfish", x: 560, y: 160, s: 140, r: 22 },
      { art: "scallop", x: 470, y: 760, s: 150, r: -14 },
      { art: "weedRed", x: 820, y: 120, s: 240, r: 30 },
      { art: "brittlestar", x: 420, y: 470, s: 170, r: 8 },
    ],
  },
  "night-reef": {
    w: 900, h: 760, bg: "deep",
    items: [
      { art: "kelp", x: 140, y: 380, s: 520, r: -4 },
      { art: "weedRose", x: 420, y: 520, s: 400, r: 6 },
      { art: "weedGreen", x: 640, y: 300, s: 420, r: -8 },
      { art: "gorgonian", x: 820, y: 600, s: 320, r: 4 },
      { art: "weedBrown", x: 300, y: 120, s: 300, r: 170 },
      { art: "coral", x: 790, y: 120, s: 220, r: 12 },
    ],
  },
  "shell-toss": {
    w: 760, h: 760, bg: "sand",
    items: [
      { art: "scallop", x: 170, y: 170, s: 230, r: -12 },
      { art: "nautilus", x: 560, y: 220, s: 230, r: 18 },
      { art: "starfish", x: 380, y: 450, s: 170, r: 30 },
      { art: "scallop", x: 610, y: 600, s: 190, r: 160 },
      { art: "starfish", x: 140, y: 590, s: 140, r: -20 },
      { art: "nautilus", x: 380, y: 720, s: 130, r: -40 },
    ],
  },
  "octopus-slate": {
    w: 820, h: 820, bg: "slate",
    items: [
      { art: "octopus", x: 220, y: 230, s: 380, r: -8 },
      { art: "octopus", x: 640, y: 640, s: 340, r: 168 },
      { art: "crab", x: 640, y: 180, s: 210, r: 18, filter: "grayscale(1) brightness(1.45) contrast(.85)" },
      { art: "crab", x: 200, y: 660, s: 180, r: -150, filter: "grayscale(1) brightness(1.45) contrast(.85)" },
    ],
  },
  "kelp-garden": {
    w: 840, h: 760, bg: "paper",
    items: [
      { art: "kelpLeft", x: 120, y: 380, s: 620 },
      { art: "weedGreen", x: 320, y: 400, s: 560, r: 4 },
      { art: "kelp", x: 540, y: 380, s: 640, r: -3 },
      { art: "weedBrown", x: 740, y: 390, s: 520, r: 5 },
    ],
  },
  "starfish-dot": {
    w: 380, h: 380, bg: "paper",
    items: [
      { art: "starfish", x: 95, y: 95, s: 110, r: 10 },
      { art: "starfish", x: 285, y: 285, s: 96, r: 46, alpha: 0.9 },
    ],
  },
}

const tileCache: { [k: string]: Promise<string | null> } = {}

function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** Compose one seamless tile from ready cut-outs; null when one it needs is missing. */
function composeTile(key: string, have: { [k: string]: Cut | null | undefined }, colors: { [k: string]: string }) {
  const def = CANVAS_TILES[key]
  if (!def) return Promise.resolve(null)
  const need = Array.from(new Set(def.items.map((i) => i.art)))
  if (need.some((k) => !have[k])) return Promise.resolve(null)
  const ck = key + "|" + need.map((k) => have[k]!.url).join(",") + "|" + colors[def.bg]
  if (tileCache[ck] !== undefined) return tileCache[ck]
  tileCache[ck] = Promise.all(need.map((k) => loadImage(have[k]!.url))).then((imgs) => {
    if (imgs.some((i) => !i)) return null
    const by: { [k: string]: HTMLImageElement } = {}
    need.forEach((k, i) => (by[k] = imgs[i]!))
    const c = document.createElement("canvas")
    c.width = def.w
    c.height = def.h
    const g = c.getContext("2d")
    if (!g) return null
    g.fillStyle = colors[def.bg] || def.bg
    g.fillRect(0, 0, def.w, def.h)
    for (const it of def.items) {
      const img = by[it.art]
      const sc = it.s / Math.max(img.naturalWidth, img.naturalHeight)
      const iw = img.naturalWidth * sc
      const ih = img.naturalHeight * sc
      const rad = Math.hypot(iw, ih) / 2
      for (const [dx, dy] of wrapOffsets(it.x, it.y, rad, def.w, def.h)) {
        g.save()
        g.globalAlpha = it.alpha ?? 1
        if (it.filter) g.filter = it.filter
        g.translate(it.x + dx, it.y + dy)
        g.rotate(((it.r || 0) * Math.PI) / 180)
        if (it.flip) g.scale(-1, 1)
        g.drawImage(img, -iw / 2, -ih / 2, iw, ih)
        g.restore()
      }
    }
    return new Promise<string | null>((resolve) => c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), "image/webp", 0.88))
  })
  return tileCache[ck]
}

function useTiles(keys: string[], have: { [k: string]: Cut | null | undefined }, colors: { [k: string]: string }) {
  const [tiles, setTiles] = React.useState({} as { [k: string]: string })
  const sig = keys.join(",") + "|" + Object.keys(have).filter((k) => have[k]).sort().join(",") + "|" + Object.values(colors).join(",")
  React.useEffect(() => {
    let alive = true
    for (const k of keys)
      composeTile(k, have, colors).then((url) => {
        if (alive && url) setTiles((t) => (t[k] === url ? t : { ...t, [k]: url }))
      })
    return () => {
      alive = false
    }
  }, [sig])
  return tiles
}

function validEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

function copyText(text: string) {
  const legacy = () =>
    new Promise((resolve, reject) => {
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
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return legacy()
  // some embeds never settle the permission prompt; give up on it after a moment
  return Promise.race([
    navigator.clipboard.writeText(text),
    new Promise((_, reject) => setTimeout(() => reject(new Error("clipboard timeout")), 700)),
  ]).catch(() => legacy())
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
  "reef-toile": {
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
  "octopus-slate": {
    w: 300, h: 300, bg: "var(--slate)",
    items: [
      { kind: "octopus", mode: "ink", x: 10, y: 0, s: 0.42, r: 0, seed: 3, color: "var(--light)" },
      { kind: "octopus", mode: "ink", x: 290, y: 300, s: 0.42, r: 180, seed: 5, color: "var(--light)" },
      { kind: "fish", mode: "ink", x: 220, y: 70, s: 0.55, r: 20, color: "var(--light)" },
      { kind: "fish", mode: "ink", x: 80, y: 230, s: 0.55, r: -160, color: "var(--light)" },
    ],
  },
  "kelp-garden": {
    w: 260, h: 250, bg: "var(--light)",
    items: [
      { kind: "kelp", mode: "wash", x: 44, y: 248, s: 1.02, seed: 2 },
      { kind: "kelp", mode: "wash", x: 130, y: 250, s: 0.96, seed: 12, r: 3 },
      { kind: "kelp", mode: "wash", x: 216, y: 248, s: 1.04, seed: 21, r: -2 },
    ],
  },
  "night-reef": {
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
    // a press only becomes a drag once it moves; until then the pointer is not
    // captured, so a plain click still reaches the button under it
    let pressed = false
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
      pressed = true
      const r = el.getBoundingClientRect()
      px = r.left + (r.width * parseFloat(pin[0])) / 100
      py = r.top + (r.height * parseFloat(pin[1])) / 100
      grab = pinAngle(px, py, e.clientX, e.clientY)
    }
    const move = (e: PointerEvent) => {
      if (!pressed) return
      if (!dragging) {
        if (Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return
        dragging = true
        moved = true
        try {
          el.setPointerCapture(e.pointerId)
        } catch {}
        el.classList.add("is-drag")
        onDragChange?.(true)
        gsap.killTweensOf(el)
      }
      gsap.set(el, { rotate: swingTo(tilt, grab, pinAngle(px, py, e.clientX, e.clientY)) })
    }
    const click = (e: MouseEvent) => {
      if (!moved) return
      moved = false
      e.stopPropagation()
      e.preventDefault()
    }
    const up = () => {
      pressed = false
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

/** A plate cut-out, or its drawn stand-in while it loads or when it cannot. */
function Art({ cut, kind, seed = 1, flip, className, style, alt, hidePending }: { cut: Cut | null | undefined; kind: BenthosCreature | "fish" | "anchor" | "urchin"; seed?: number; flip?: boolean; className?: string; style?: React.CSSProperties; alt?: string; hidePending?: boolean }) {
  if (cut)
    return (
      <img
        src={cut.url}
        width={cut.w}
        height={cut.h}
        alt={alt ?? ""}
        draggable={false}
        className={"bct-cut" + (flip ? " is-flip" : "") + (className ? " " + className : "")}
        style={style}
      />
    )
  return <Creature kind={kind} mode="wash" seed={seed} flip={kind === "whale" ? !flip : flip} className={(className ? className + " " : "") + (cut === undefined && hidePending ? "is-pending" : "")} style={style} title={alt} />
}

/** A box tiled with a pattern: the canvas tile when it is ready, the drawn SVG tile until then. */
function Swatch({ pattern, tile, size, fallbackScale, className, style, children }: { pattern: string; tile?: string; size: number; fallbackScale?: number; className?: string; style?: React.CSSProperties; children?: React.ReactNode }) {
  const def = CANVAS_TILES[pattern]
  return (
    <div className={"bct-swatch-fill" + (className ? " " + className : "")} style={style}>
      <PatternFill pattern={pattern} scale={fallbackScale ?? 0.5} />
      {tile && def && (
        <i
          className="bct-tile"
          style={{ backgroundImage: "url(" + tile + ")", backgroundSize: size + "px " + Math.round((size * def.h) / def.w) + "px" }}
        />
      )}
      {children}
    </div>
  )
}

/** An image that falls back to its drawing when it cannot load. */
function Scan({ src, alt, kind, lazy = true }: { src?: string | null; alt: string; kind: BenthosCreature; lazy?: boolean }) {
  const [failed, setFailed] = React.useState(false)
  if (!src || failed) return <Creature kind={kind} mode="wash" title={alt || undefined} />
  return <img src={src} alt={alt} loading={lazy ? "lazy" : undefined} decoding="async" onError={() => setFailed(true)} />
}

/** A framed plate: the scan itself, or the drawing when there is none. */
function Plate({ plate, index, className, big }: { plate: BenthosPlate; index: number; className?: string; big?: boolean }) {
  const [failed, setFailed] = React.useState(false)
  const num = plate.number ?? "Plate " + roman(index + 1)
  const scan = plate.src && !failed
  return (
    <figure className={"bct-plate" + (className ? " " + className : "") + (big ? " is-big" : "") + (scan ? " is-scan" : "")}>
      <div className="bct-plate-mat">
        <div className="bct-plate-art">
          {scan ? (
            <img src={plate.src} alt={plate.alt ?? plate.title + (plate.latin ? ", " + plate.latin : "")} loading="lazy" decoding="async" onError={() => setFailed(true)} />
          ) : (
            <>
              <Creature kind={plate.art ?? "nautilus"} mode="wash" seed={index + 3} />
              <Creature kind={plate.art ?? "nautilus"} mode="ink" seed={index + 3} className="bct-plate-ink" title={plate.title} />
            </>
          )}
        </div>
        <figcaption className="bct-plate-cap">
          {num && <span className="bct-plate-num">{num}</span>}
          <span className="bct-plate-title">{plate.title}</span>
          {plate.latin && <em className="bct-plate-latin">{plate.latin}</em>}
        </figcaption>
      </div>
    </figure>
  )
}

/** Text set along an arc (the hero tagline). */
function ArcText({ text, id, className }: { text: string; id: string; className?: string }) {
  return (
    <svg className={"bct-arc" + (className ? " " + className : "")} viewBox="0 0 1000 150" aria-hidden="true" focusable="false">
      <path id={id} d="M80,40 Q500,170 920,40" fill="none" />
      <text>
        <textPath href={"#" + id} startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  )
}

/** A gold-foil emblem: the studio's arch and sun, for the envelope and the slate card. */
function Emblem({ className, foil }: { className?: string; foil?: string }) {
  return (
    <svg className={"bct-emblem" + (className ? " " + className : "")} viewBox="0 0 80 80" aria-hidden="true" focusable="false">
      {foil && (
        <defs>
          <linearGradient id={foil} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6e3a6" />
            <stop offset=".45" stopColor="#c99a3e" />
            <stop offset=".7" stopColor="#fbecc0" />
            <stop offset="1" stopColor="#a8792a" />
          </linearGradient>
        </defs>
      )}
      <g fill="none" stroke={foil ? "url(#" + foil + ")" : "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18,62 H62 M24,62 C24,48 31,44 40,44 C49,44 56,48 56,62" />
        <path d="M40,40 V26 M30,43 L22,33 M50,43 L58,33 M27,48 L16,44 M53,48 L64,44 M34,41 L30,29 M46,41 L50,29" />
        <path d="M30,70 Q40,66 50,70" />
      </g>
    </svg>
  )
}

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

// the order plates are fetched in: the hero first
const ART_ORDER = ["whale", "octopus", "gorgonian", "kelp", "weedRose", "weedGreen", "weedBrown", "kelpLeft", "weedRed", "coral", "starfish", "scallop", "brittlestar", "nautilus", "crab"]
const HERO_ART = ["whale", "octopus", "gorgonian", "kelp", "weedRose", "weedGreen", "weedBrown", "starfish", "scallop", "coral"]

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
  artwork,
  artMode = "plates",
  credits = DEFAULT_CREDITS,
  onBuy,
  onSubscribe,
  alive = true,
  className,
}: BenthosCollectionTemplateProps) {
  const hero = { ...DEFAULT_HERO, ...heroIn }
  const deep = { ...DEFAULT_DEEP, ...deepIn }
  const board = { ...DEFAULT_MOODBOARD, ...boardIn }
  const pCopy = { kicker: "Seamless patterns", title: "Tile the reef", body: "Every pattern repeats without a seam at 6000 px. Pick one and it lines the envelope on the board above.", ...patternsCopy }
  const prCopy = { kicker: "Wall art", title: "Plates drawn to be framed", body: "Restored from the great natural-history plate books and printed on 300 gsm cotton rag at A2, or yours as a print-ready PDF.", ...printsCopy }
  const lCopy = { kicker: "Licence", title: "Take the whole ocean home", body: "One payment, every file, lifetime updates. Pick the licence that matches where the work will go.", seatsLabel: "Seats", button: "Buy", ...licenceCopy }
  const foot = { ...DEFAULT_FOOTER, ...footerIn }
  const c = { ...PALETTES[preset], ...colors }
  const art = { ...DEFAULT_ART, ...artwork } as { [k: string]: BenthosArt | null | undefined }
  const posterSrc = artwork && "poster" in artwork ? artwork.poster : (DEFAULT_ART.poster as string)

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
  const toastTimer = React.useRef(0)

  const [menu, setMenu] = React.useState(false)
  const [pattern, setPattern] = React.useState((patterns[0]?.key ?? "reef-toile") as string)
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
  const [heroReady, setHeroReady] = React.useState(false)

  const cut = useCutouts(art, artMode === "plates", ART_ORDER)
  const tileColors = React.useMemo(() => ({ paper: c.paper, deep: c.deep, sand: "#e8d6b6", slate: c.slate }), [c.paper, c.deep, c.slate])
  const tileKeys = React.useMemo(() => Array.from(new Set(patterns.map((p) => p.key as string).concat(["reef-toile", "shell-toss", "octopus-slate", "kelp-garden", "night-reef"]))), [patterns])
  const tiles = useTiles(tileKeys, cut, tileColors)

  // the hero's reef enters once its plates are in, or after a short wait
  const heroPending = HERO_ART.some((k) => cut[k] === undefined && art[k])
  React.useEffect(() => {
    if (!heroPending) {
      setHeroReady(true)
      return
    }
    const t = window.setTimeout(() => setHeroReady(true), 3200)
    return () => window.clearTimeout(t)
  }, [heroPending])

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
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 1900)
  }

  const copySwatch = (sw: BenthosSwatch) => {
    copyText(sw.hex).then(
      () => notify("Copied " + sw.hex + " · " + sw.name),
      () => notify(sw.name + " is " + sw.hex),
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
    onBuy?.({ license: chosen.id, seats: SEAT_TIERS[seats], total, currency })
    notify(chosen.name + " licence · " + currency + total)
  }

  const scrollShelf = (dir: number) => {
    const el = shelf.current
    if (!el) return
    const card = el.querySelector(".bct-shelf-item") as HTMLElement | null
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 280) + 28), behavior: reduced() ? "auto" : "smooth" })
  }

  // ---- lightbox focus + keys ----
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
    tl.fromTo(nu, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: "power3.out" }, 0)
    tl.to(el, { autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 0)
    return () => {
      tl.kill()
    }
  }, [pattern])

  // ---- the reef enters ----
  React.useEffect(() => {
    const st = stage.current
    if (!st || !heroReady) return
    const figs = Array.from(st.querySelectorAll(".bct-scene .bct-fig")) as HTMLElement[]
    const weeds = Array.from(st.querySelectorAll(".bct-weed")) as HTMLElement[]
    if (reduced() || still) {
      gsap.set(figs.concat(weeds), { autoAlpha: 1 })
      return
    }
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.fromTo(weeds, { yPercent: 28, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.8, stagger: 0.05 }, 0)
    tl.fromTo(
      figs,
      {
        x: (i: number, t: Element) => +(t.getAttribute("data-dx") || 0),
        y: (i: number, t: Element) => +(t.getAttribute("data-dy") || 0),
        rotate: (i: number, t: Element) => +(t.getAttribute("data-dr") || 0),
        autoAlpha: 0,
      },
      { x: 0, y: 0, rotate: 0, autoAlpha: 1, duration: 2, stagger: 0.07 },
      0.15,
    )
    return () => {
      tl.kill()
    }
  }, [heroReady])

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
      ScrollTrigger.create({ trigger: ".bct-envelope", start: "top 75%", once: true, onEnter: () => setEnvOpen(true) })

      const mm = gsap.matchMedia()
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 760px)" }, (cx) => {
        const { motion, wide } = cx.conditions as { motion: boolean; wide: boolean }
        if (!motion) {
          setStill(true)
          return
        }
        setStill(false)

        // the window opens
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .fromTo(st, { "--in": 0 }, { "--in": 1, duration: 2, ease: "expo.inOut" }, 0)
          .from(".bct-doodle", { autoAlpha: 0, scale: 0.8, duration: 1.2, stagger: 0.04 }, 0.3)
          .from(".bct-kicker", { y: 26, autoAlpha: 0, duration: 1.1 }, 0.5)
          .from(".bct-hero-copy > *", { y: 34, autoAlpha: 0, duration: 1.3, stagger: 0.09 }, 0.9)
          .from(".bct-badge", { scale: 0, rotate: -40, duration: 1.2, ease: "back.out(2)" }, 1.4)
          .from(".bct-arc", { y: 24, autoAlpha: 0, duration: 1.2 }, 1.3)
          .from(".bct-under > *", { y: 20, autoAlpha: 0, duration: 1, stagger: 0.08 }, 1.45)
          .from(".bct-strip-card", { y: 140, autoAlpha: 0, duration: 1.4, stagger: 0.05 }, 1.5)

        // the dive: panel → full bleed, the reef drifts out, the whale swims across
        gsap
          .timeline({ scrollTrigger: { trigger: ".bct-dive", start: "top top", end: "bottom bottom", scrub: 0.9 }, defaults: { ease: "none" } })
          .fromTo(st, { "--open": 0 }, { "--open": 1, duration: 0.42 }, 0)
          .to(".bct-hero-copy", { scale: 0.8, yPercent: -18, autoAlpha: 0, duration: 0.3, ease: "power1.in" }, 0.03)
          .to(".bct-badge", { autoAlpha: 0, scale: 0.6, duration: 0.2 }, 0.04)
          .to(".bct-kicker, .bct-arc", { yPercent: -60, autoAlpha: 0, duration: 0.2 }, 0)
          .to(".bct-under", { yPercent: 60, autoAlpha: 0, duration: 0.22 }, 0)
          .to(".bct-strip", { yPercent: 120, duration: 0.3, ease: "power1.in" }, 0)
          .to(".bct-doodle", { autoAlpha: 0, duration: 0.2 }, 0.04)
          .to(".bct-fig-drift", { y: (i: number, t: Element) => +(t.getAttribute("data-oy") || 160), x: (i: number, t: Element) => +(t.getAttribute("data-ox") || 0), autoAlpha: 0, duration: 0.4, ease: "power1.in" }, 0.02)
          .to(".bct-fig-octopus", { x: wide ? 260 : 120, y: -300, rotate: 16, autoAlpha: 0, duration: 0.42, ease: "power1.in" }, 0.02)
          .to(".bct-fig-whale", { xPercent: wide ? 300 : 190, yPercent: wide ? -40 : -60, rotate: -4, duration: 0.5, ease: "power1.inOut" }, 0.14)
          .to(".bct-forest", { "--rise": 1, duration: 0.42 }, 0)
          .fromTo(".bct-deep-copy > *", { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.2, stagger: 0.03, ease: "power2.out" }, 0.56)
          .fromTo(".bct-stat", { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.18, stagger: 0.025, ease: "power2.out" }, 0.62)
          .fromTo(".bct-formats", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.18 }, 0.8)

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
        gsap.from(".bct-board .bct-drop", {
          y: -70,
          autoAlpha: 0,
          rotate: (i: number) => (i % 2 ? 7 : -7),
          duration: 1.3,
          stagger: 0.07,
          ease: "back.out(1.2)",
          scrollTrigger: { trigger: ".bct-board", start: "top 70%", once: true },
        })
        gsap.from(".bct-board .bct-tack", { scale: 0, duration: 0.6, stagger: 0.04, ease: "back.out(3)", scrollTrigger: { trigger: ".bct-board", start: "top 64%", once: true } })
        gsap.from(".bct-board-copy > *", { y: 28, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".bct-board-copy", start: "top 82%", once: true } })
        gsap.from(".bct-board-whale", { x: -160, autoAlpha: 0, duration: 1.8, ease: "power3.out", scrollTrigger: { trigger: ".bct-board", start: "top 62%", once: true } })
        gsap.from(".bct-board-shell", { y: 40, rotate: -30, autoAlpha: 0, duration: 1.4, ease: "back.out(1.6)", scrollTrigger: { trigger: ".bct-swatches", start: "top 85%", once: true } })

        // patterns: the wallpaper wipes in, the list deals
        gsap.from(".bct-pat-stage", { clipPath: "inset(0% 100% 0% 0%)", duration: 1.4, ease: "power3.inOut", scrollTrigger: { trigger: ".bct-patterns", start: "top 70%", once: true } })
        gsap.from(".bct-pat-item", { x: 40, autoAlpha: 0, duration: 0.9, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".bct-pat-list", start: "top 82%", once: true } })

        // prints lean in
        gsap.from(".bct-shelf-item", { y: 60, rotate: (i: number) => (i % 2 ? 3 : -3), autoAlpha: 0, duration: 1.1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".bct-shelf", start: "top 80%", once: true } })

        // licence
        gsap.from(".bct-lic", { y: 50, autoAlpha: 0, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".bct-licence", start: "top 70%", once: true } })
        gsap.from(".bct-licence .bct-lic-fig", { y: 50, rotate: 14, autoAlpha: 0, duration: 1.5, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: ".bct-licence", start: "top 62%", once: true } })

        // footer
        gsap.from(".bct-foot-mark", { yPercent: 30, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".bct-footer", start: "top 85%", once: true } })
        gsap.from(".bct-foot-whale", { xPercent: -30, autoAlpha: 0, duration: 2, ease: "power2.out", scrollTrigger: { trigger: ".bct-footer", start: "top 70%", once: true } })

        gsap.utils.toArray(".bct-head").forEach((h) => {
          gsap.from((h as Element).children, { y: 26, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: h as Element, start: "top 84%", once: true } })
        })
      })
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
    const apply = () => {
      raf = 0
      layers.forEach((l, i) => {
        const d = +(l.getAttribute("data-depth") || 0)
        xs[i](nx * d * 22)
        ys[i](ny * d * 14)
      })
    }
    const onMove = (e: PointerEvent) => {
      const r = st.getBoundingClientRect()
      nx = ((e.clientX - r.left) / r.width - 0.5) * 2
      ny = ((e.clientY - r.top) / r.height - 0.5) * 2
      if (!raf) raf = requestAnimationFrame(apply)
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
    { kind: "fish", l: "5%", t: "16%", w: "4.2cqw", r: -12 },
    { kind: "nautilus", l: "89%", t: "12%", w: "3.6cqw", r: 10 },
    { kind: "anchor", l: "4%", t: "62%", w: "2.8cqw", r: 8 },
    { kind: "urchin", l: "92%", t: "56%", w: "3cqw", r: 0 },
    { kind: "fish", l: "86%", t: "33%", w: "3.6cqw", r: 165 },
    { kind: "scallop", l: "9%", t: "40%", w: "3cqw", r: 20 },
    { kind: "crab", l: "93%", t: "78%", w: "4cqw", r: -6 },
    { kind: "jellyfish", l: "3%", t: "84%", w: "2.6cqw", r: 14 },
    { kind: "starfish", l: "80%", t: "6%", w: "2.4cqw", r: 30 },
    { kind: "seafan", l: "13%", t: "4%", w: "3.4cqw", r: -8 },
  ] as { kind: BenthosCreature | "fish" | "anchor" | "urchin"; l: string; t: string; w: string; r: number }[]
  const icons = ["crab", "nautilus", "scallop", "starfish", "anchor", "fish", "urchin", "jellyfish", "seafan", "octopus", "kelp", "whale"] as (BenthosCreature | "fish" | "anchor" | "urchin")[]
  const swatchClip = React.useMemo(() => zigzag(14, 5), [])
  const monogram = (foot.monogram ?? brand.trim()[0] ?? "B").toUpperCase()
  const showPatterns = patterns.slice(0, 3)
  const strip = [
    { t: "tile", k: "reef-toile" },
    { t: "plate", i: 1 },
    { t: "tile", k: "night-reef" },
    { t: "chip", i: 0 },
    { t: "chip", i: 1 },
    { t: "chip", i: 2 },
    { t: "tile", k: "shell-toss" },
    { t: "plate", i: 3 },
    { t: "tile", k: "octopus-slate" },
  ]
  // the forest inside the window: [cut-out, drawn stand-in, left %, width %, depth]
  const forest = [
    ["kelp", "kelp", -2, 22, 0], ["weedBrown", "kelp", 13, 21, 0], ["kelpLeft", "kelp", 29, 18, 0], ["weedGreen", "kelp", 40, 11, 0], ["weedRed", "seafan", 46, 30, 0], ["kelp", "kelp", 66, 21, 0], ["weedBrown", "kelp", 81, 22, 0],
    ["weedGreen", "kelp", 3, 11, 1], ["weedRose", "coral", 15, 18, 1], ["weedBrown", "kelp", 31, 13, 1], ["weedGreen", "kelp", 57, 10, 1], ["weedRose", "coral", 64, 17, 1], ["coral", "coral", 80, 19, 1],
    ["gorgonian", "seafan", 6, 13, 2], ["weedGreen", "kelp", 88, 8, 2],
  ] as [string, BenthosCreature, number, number, number][]

  return (
    <IdCtx.Provider value={uid}>
      <div
        ref={root}
        className={"bct-root" + (theme === "dark" ? " bct-dark" : theme === "light" ? " bct-light" : "") + (alive ? " is-alive" : "") + (still ? " is-still" : "") + (heroReady ? " is-ready" : "") + (className ? " " + className : "")}
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

        {/* the dive: the hero window → the deep */}
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
                <div className="bct-forest" data-depth="-0.35">
                  {forest.map(([k, kind, left, width, depth], i) => (
                    <div key={i} className={"bct-weed is-d" + depth + (i % 3 === 1 ? " is-late" : "")} style={{ left: left + "%", width: width + "%" }}>
                      <Art cut={cut[k]} kind={kind} seed={i + 4} hidePending />
                    </div>
                  ))}
                  <i className="bct-haze" />
                  <i className="bct-dim" />
                </div>
                {bubbles.map((b, i) => (
                  <i key={i} className="bct-bubble" style={{ left: b.x + "%", width: b.s, height: b.s, animationDelay: "-" + b.d + "s", animationDuration: b.t + "s" }} />
                ))}
                <div className="bct-vignette" />
              </div>

              <div className="bct-hero-anchor" data-depth="0.12">
                <div className="bct-hero-copy">
                  <Arch />
                  <h1 className="bct-title">{hero.title}</h1>
                  <p className="bct-script">{hero.script}</p>
                  <Squiggle />
                  <p className="bct-byline">{hero.byline}</p>
                </div>
              </div>
              <div className="bct-badge" aria-hidden="true"><span>{hero.badge}</span></div>

              {/* the reef breaking over the window's edge */}
              <div className="bct-fig bct-fig-gorgonian bct-fig-drift" data-depth="0.45" data-dx="-50" data-dy="40" data-dr="-10" data-oy="-220" data-ox="-120">
                <Art cut={cut.gorgonian} kind="coral" seed={9} hidePending className="bct-sway" />
              </div>
              <div className="bct-fig bct-fig-kelp bct-fig-drift" data-depth="0.35" data-dx="-40" data-dy="90" data-oy="260" data-ox="-60">
                <Art cut={cut.weedGreen} kind="kelp" seed={2} hidePending className="bct-sway bct-sway-late" />
              </div>
              <div className="bct-fig bct-fig-star bct-fig-drift" data-depth="0.6" data-dx="-60" data-dy="70" data-dr="-50" data-oy="240" data-ox="-100">
                <Art cut={cut.starfish} kind="starfish" seed={4} hidePending />
              </div>
              <div className="bct-fig bct-fig-coral bct-fig-drift" data-depth="0.5" data-dx="70" data-dy="70" data-dr="12" data-oy="250" data-ox="140">
                <Art cut={cut.coral} kind="coral" seed={5} hidePending className="bct-sway" />
              </div>
              <div className="bct-fig bct-fig-scallop bct-fig-drift" data-depth="0.7" data-dx="80" data-dy="60" data-dr="34" data-oy="230" data-ox="150">
                <Art cut={cut.scallop} kind="scallop" hidePending />
              </div>
              <div className="bct-fig bct-fig-rose bct-fig-drift" data-depth="0.4" data-dx="60" data-dy="-40" data-dr="18" data-oy="-160" data-ox="160">
                <Art cut={cut.weedRose} kind="coral" seed={7} hidePending className="bct-sway bct-sway-late" />
              </div>
              <div className="bct-fig bct-fig-octopus" data-depth="0.28" data-dx="140" data-dy="-140" data-dr="18">
                <Art cut={cut.octopus} kind="octopus" seed={3} hidePending className="bct-octo" alt={art.octopus?.alt} />
              </div>
              <div className="bct-fig bct-fig-whale" data-depth="0.22" data-dx="-260" data-dy="50" data-dr="-5">
                <Art cut={cut.whale} kind="whale" flip hidePending className="bct-swim" alt={art.whale?.alt} />
              </div>

              <ArcText text={hero.tagline ?? ""} id={uid + "-arc"} />
              <div className="bct-under">
                <button type="button" className="bct-btn" onClick={() => go("licence")}>{hero.cta}</button>
                <button type="button" className="bct-link" onClick={() => go("moodboard")}>{hero.secondary} <span aria-hidden="true">↓</span></button>
              </div>

              <div className="bct-strip" aria-hidden="true">
                {strip.map((s, i) => {
                  const st = { "--i": i, "--n": strip.length } as React.CSSProperties
                  if (s.t === "tile")
                    return (
                      <div key={i} className="bct-strip-card is-tile" style={st}>
                        <Swatch pattern={s.k!} tile={tiles[s.k!]} size={150} fallbackScale={0.36} />
                      </div>
                    )
                  if (s.t === "plate") {
                    const p = plates[s.i! % Math.max(1, plates.length)]
                    return (
                      <div key={i} className="bct-strip-card is-plate" style={st}>
                        {p && <Scan src={p.src} alt="" kind={p.art ?? "jellyfish"} lazy={false} />}
                      </div>
                    )
                  }
                  const sw = palette[s.i! % Math.max(1, palette.length)]
                  return (
                    <div key={i} className="bct-strip-card is-chip" style={{ ...st, "--sw": sw?.hex } as React.CSSProperties}>
                      <span />
                      <b>{sw?.name}</b>
                      <small>{sw?.hex}</small>
                      <i className="bct-tack" style={{ left: "50%", top: "9px" }} />
                    </div>
                  )
                })}
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
          <Pinned className="bct-card bct-poster bct-drop" tilt={-1.6} tacks={[["50%", "10px"]]}>
            <Tape className="bct-tape-a" />
            <figure className="bct-poster-fig">
              <Scan src={posterSrc} alt={board.posterTitle + ", " + board.posterNote} kind="jellyfish" />
              <figcaption>
                <span>{board.posterNumber}</span>
                <b>{board.posterTitle}</b>
                <em>{board.posterNote}</em>
              </figcaption>
            </figure>
          </Pinned>

          <Pinned className="bct-card bct-markcard bct-drop" tilt={2.2} tacks={[["50%", "10px"]]}>
            <Emblem />
          </Pinned>

          <div className="bct-board-whale" aria-hidden="true">
            <Art cut={cut.whale} kind="whale" className="bct-swim" />
          </div>

          <Pinned className="bct-card bct-icons bct-drop" tilt={1.2} tacks={[["16px", "14px"], ["calc(100% - 16px)", "14px"]]}>
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
                <Pinned className="bct-chipcard bct-drop" tilt={[-3, 2, -1.5, 2.5, -2, 1][i % 6]} tacks={[["50%", "8px"]]} pin={["50%", "6%"]}>
                  <button type="button" className={"bct-chip" + (luminance(sw.hex) < 0.4 ? " is-dark" : "")} style={{ "--sw": sw.hex } as React.CSSProperties} onClick={() => copySwatch(sw)} aria-label={"Copy " + sw.name + " " + sw.hex}>
                    <span className="bct-chip-color" />
                    <span className="bct-chip-name">{sw.name}</span>
                    <span className="bct-chip-hex">{sw.hex}</span>
                  </button>
                </Pinned>
              </li>
            ))}
          </ul>

          <Pinned className="bct-card bct-letter-card bct-drop" tilt={-2.4} tacks={[["50%", "10px"]]}>
            <span className="bct-letter-glyph" aria-hidden="true" style={tiles["reef-toile"] ? { backgroundImage: "url(" + tiles["reef-toile"] + ")" } : undefined}>
              {monogram}
            </span>
            <div className="bct-letter-coral" aria-hidden="true">
              <Art cut={cut.gorgonian} kind="coral" seed={9} />
            </div>
          </Pinned>

          <div className="bct-swatches" aria-label="Pattern swatches">
            {showPatterns.map((p, i) => (
              <Pinned key={p.key} className={"bct-swatch bct-drop" + (p.key === pattern ? " is-on" : "")} tilt={[-4, 3, -2][i]} tacks={[["50%", "10px"]]} pin={["50%", "8%"]}>
                <span className="bct-swatch-shade">
                  <button type="button" className="bct-swatch-btn" style={{ clipPath: swatchClip }} onClick={() => pickPattern(p.key)} aria-pressed={p.key === pattern} aria-label={"Use " + p.name + " on the envelope"}>
                    <Swatch pattern={p.key} tile={tiles[p.key]} size={180} fallbackScale={0.4} />
                  </button>
                </span>
                <span className="bct-swatch-name">{p.name}</span>
              </Pinned>
            ))}
            <div className="bct-board-shell" aria-hidden="true">
              <Art cut={cut.scallop} kind="scallop" />
            </div>
          </div>

          <div className={"bct-envelope" + (envOpen ? " is-open" : "")}>
            <div className="bct-env-back">
              <Swatch pattern={pattern} tile={tiles[pattern]} size={180} fallbackScale={0.36} className="bct-env-lining" />
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
            <Emblem className="bct-env-foil" foil={uid + "-foil"} />
            <button type="button" className="bct-env-flap" aria-expanded={envOpen} aria-label={envOpen ? "Close the envelope" : "Open the envelope"} onClick={() => setEnvOpen((o) => !o)}>
              <span className="bct-env-flap-out" />
              <span className="bct-env-flap-in"><Swatch pattern={pattern} tile={tiles[pattern]} size={180} fallbackScale={0.36} /></span>
            </button>
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
            {prevPattern && <Swatch pattern={prevPattern} tile={tiles[prevPattern]} size={320} fallbackScale={0.72} className="bct-pat-old" />}
            <Swatch key={pattern} pattern={pattern} tile={tiles[pattern]} size={320} fallbackScale={0.72} className="bct-pat-new" />
            <div className="bct-pat-label">
              <span>{patterns.find((p) => p.key === pattern)?.name}</span>
              <em>6000 × 6000 px · seamless</em>
            </div>
          </div>
          <ul className="bct-pat-list" role="radiogroup" aria-label="Choose a pattern">
            {patterns.map((p, i) => (
              <li key={p.key} className="bct-pat-item">
                <button type="button" role="radio" aria-checked={p.key === pattern} className={"bct-pat-btn" + (p.key === pattern ? " is-on" : "")} onClick={() => pickPattern(p.key)}>
                  <Swatch pattern={p.key} tile={tiles[p.key]} size={90} fallbackScale={0.26} className="bct-pat-thumb" />
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
          <div className="bct-lic-fig bct-lic-fig-a" aria-hidden="true"><Art cut={cut.nautilus} kind="nautilus" /></div>
          <div className="bct-lic-fig bct-lic-fig-b" aria-hidden="true"><Art cut={cut.brittlestar} kind="starfish" seed={3} /></div>
        </section>

        {/* footer */}
        <footer className="bct-footer">
          <Wave className="bct-footer-wave" />
          <div className="bct-foot-whale" aria-hidden="true">
            {cut.whale ? <img src={cut.whale.url} alt="" className="bct-cut" /> : <Creature kind="whale" mode="ink" />}
          </div>
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
          {credits && artMode === "plates" && <p className="bct-foot-credits">{credits}</p>}
        </footer>

        {/* lightbox */}
        {lightbox !== null && plates[lightbox] && (
          <div className="bct-lightbox" role="dialog" aria-modal="true" aria-label={plates[lightbox].title} onClick={(e) => { if (e.target === e.currentTarget) setLightbox(null) }}>
            <div className="bct-lightbox-card">
              <Plate key={lightbox} plate={plates[lightbox]} index={lightbox} big />
              <div className="bct-lightbox-text">
                <p className="bct-eyebrow">{plates[lightbox].number ?? "Plate " + roman(lightbox + 1)} of {plates.length}</p>
                <h3>{plates[lightbox].title}</h3>
                {plates[lightbox].latin && <em>{plates[lightbox].latin}</em>}
                {plates[lightbox].note && <p>{plates[lightbox].note}</p>}
                {plates[lightbox].credit && <small className="bct-lightbox-credit">{plates[lightbox].credit}</small>}
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
.bct-root{--paper:var(--c-paper);--ink:var(--c-ink);--deep:var(--c-deep);--abyss:var(--c-abyss);--slate:var(--c-slate);--dusk:var(--c-dusk);--sand:var(--c-sand);--coral:var(--c-coral);--kelp:var(--c-kelp);--gold:var(--c-gold);--light:var(--c-paper);--dark:var(--c-ink);--card:color-mix(in oklab,var(--c-paper) 70%,#fff);--soft:color-mix(in oklab,var(--ink) 72%,var(--paper));--line:color-mix(in oklab,var(--ink) 16%,transparent);--band:color-mix(in oklab,var(--paper) 90%,var(--sand));--shadow:0 1px 1px rgba(30,24,16,.08),0 10px 18px -8px rgba(30,24,16,.18),0 34px 50px -30px rgba(30,24,16,.45);position:relative;isolation:isolate;width:100%;background:var(--paper);color:var(--ink);font-family:var(--label);container-type:inline-size;overflow-x:clip;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.bct-root.bct-dark,:where(.dark) .bct-root:not(.bct-light){--paper:color-mix(in oklab,var(--c-abyss) 30%,#0b0d10);--ink:var(--c-paper);--card:color-mix(in oklab,var(--c-paper) 92%,#fff);--soft:color-mix(in oklab,var(--c-paper) 72%,var(--c-abyss));--line:color-mix(in oklab,var(--c-paper) 16%,transparent);--band:color-mix(in oklab,var(--paper) 86%,var(--c-slate));--shadow:0 1px 1px rgba(0,0,0,.3),0 12px 20px -8px rgba(0,0,0,.45),0 40px 60px -30px rgba(0,0,0,.8)}
:where(.bct-root) button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit}
:where(.bct-root) :where(p,h1,h2,h3,ul,figure,fieldset){margin:0}
:where(.bct-root) :where(ul){padding:0;list-style:none}
:where(.bct-root) a{color:inherit}
.bct-root :where(button,a,input,[role=radio]):focus-visible{outline:2px solid var(--coral);outline-offset:3px}
.bct-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.bct-defs{position:absolute;width:0;height:0;overflow:hidden}
.bct-art{display:block;max-width:none}
.bct-cut{display:block;width:100%;height:auto;max-width:none;user-select:none;-webkit-user-select:none;animation:bct-fade .9s cubic-bezier(.2,.8,.2,1) both}
.bct-cut.is-flip{scale:-1 1}
.bct-root .is-pending{opacity:0}
.bct-fill{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:hidden}
.bct-swatch-fill{position:relative;overflow:hidden}
.bct-tile{position:absolute;inset:0;background-repeat:repeat;background-position:0 0;animation:bct-fade .8s ease both}
.bct-grain{position:absolute;inset:0;z-index:40;pointer-events:none;opacity:.22;mix-blend-mode:multiply;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");background-size:240px 240px}
.bct-dark .bct-grain,:where(.dark) .bct-root:not(.bct-light) .bct-grain{mix-blend-mode:soft-light;opacity:.4}

/* type + buttons */
.bct-eyebrow{display:flex;align-items:center;gap:10px;font:500 11px/1.2 var(--label);letter-spacing:.24em;text-transform:uppercase;color:var(--coral)}
.bct-eyebrow::before{content:"";width:22px;height:1px;background:currentColor;flex:none}
.bct-h2{font:500 clamp(34px,4.2cqw,60px)/1.04 var(--display);letter-spacing:-.005em;max-width:18ch}
.bct-lede{font:300 clamp(15px,1.12cqw,17px)/1.65 var(--label);color:var(--soft);max-width:46ch}
.bct-head{display:grid;gap:16px;padding:0 6cqw;margin-bottom:3cqw}
.bct-actions{display:flex;flex-wrap:wrap;gap:12px 22px;align-items:center;margin-top:6px}
.bct-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:46px;padding:0 26px;border-radius:999px;background:var(--ink);color:var(--paper);font:500 12.5px/1 var(--label);letter-spacing:.12em;text-transform:uppercase;transition:background .25s,translate .25s cubic-bezier(.2,.8,.2,1),scale .2s cubic-bezier(.2,.8,.2,1);white-space:nowrap}
.bct-btn:hover{background:var(--coral);color:#fff;translate:0 -1px}
.bct-btn:active{translate:0 0;scale:.98}
.bct-btn-sm{height:40px;padding:0 18px;font-size:11.5px}
.bct-btn-lg{height:54px;padding:0 32px;font-size:13px}
.bct-link{font:500 12.5px/1 var(--label);letter-spacing:.12em;text-transform:uppercase;text-decoration:underline;text-underline-offset:6px;text-decoration-color:color-mix(in oklab,currentColor 40%,transparent);transition:text-decoration-color .25s}
.bct-link:hover{text-decoration-color:currentColor}

/* header */
.bct-header{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:20px;height:64px;padding:0 clamp(16px,3cqw,40px);background:color-mix(in oklab,var(--paper) 82%,transparent);backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);border-bottom:1px solid var(--line);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.bct-header.is-tucked{transform:translateY(-100%)}
.bct-progress{position:absolute;left:0;right:0;bottom:-1px;height:2px;overflow:hidden}
.bct-progress i{display:block;height:100%;background:var(--coral);transform:scaleX(0);transform-origin:0 50%}
.bct-brand{display:flex;align-items:center;gap:10px}
.bct-brand-mark{width:28px;height:28px;color:var(--ink)}
.bct-brand-name{font:500 25px/1 var(--display);letter-spacing:.04em}
.bct-brand-note{font:400 10px/1 var(--label);letter-spacing:.28em;text-transform:uppercase;opacity:.6;margin-top:4px}
.bct-nav{display:flex;gap:2px;margin-left:auto}
.bct-nav :where(a,button){display:block;padding:9px 13px;border-radius:999px;font:500 11.5px/1 var(--label);letter-spacing:.16em;text-transform:uppercase;text-decoration:none;transition:background .2s,color .2s}
.bct-nav :where(a,button):hover{background:var(--ink);color:var(--paper)}
.bct-cta{display:flex;align-items:center;gap:10px;height:40px;padding:0 6px 0 18px;border-radius:999px;background:var(--ink);color:var(--paper);font:500 11.5px/1 var(--label);letter-spacing:.12em;text-transform:uppercase;transition:background .25s;white-space:nowrap}
.bct-cta:hover{background:var(--coral);color:#fff}
.bct-cta-price{display:inline-grid;place-items:center;height:28px;padding:0 10px;border-radius:999px;background:var(--coral);color:#fff;font-size:11px;letter-spacing:.04em}
.bct-cta:hover .bct-cta-price{background:var(--ink)}
.bct-burger{display:none;width:40px;height:40px;place-items:center;align-content:center;gap:6px;margin-left:auto}
.bct-burger i{display:block;width:20px;height:2px;background:currentColor;transition:transform .3s}
.bct-burger[aria-expanded=true] i:first-child{transform:translateY(4px) rotate(45deg)}
.bct-burger[aria-expanded=true] i:last-child{transform:translateY(-4px) rotate(-45deg)}

/* the dive: a rounded window opening into the deep */
.bct-dive{position:relative;height:calc(var(--h) * 2.3);margin-top:-64px}
.bct-stage{position:sticky;top:0;height:var(--h);min-height:640px;overflow:hidden;--in:1;--open:0;--wt:15;--wb:27;--wx:22;--wr:13;--k:calc(1 - var(--open));--cy:calc((var(--wt) + (100 - var(--wt) - var(--wb)) / 2) * 1%)}
.bct-scene{position:absolute;inset:0}
.bct-doodle{position:absolute;color:var(--ink);opacity:.16;pointer-events:none}
.bct-porthole{position:absolute;inset:0;background:var(--deep);clip-path:inset(calc((var(--wt) + (50 - var(--wt)) * (1 - var(--in))) * var(--k) * 1%) calc((var(--wx) + (50 - var(--wx)) * (1 - var(--in))) * var(--k) * 1%) calc((var(--wb) + (50 - var(--wb)) * (1 - var(--in))) * var(--k) * 1%) calc((var(--wx) + (50 - var(--wx)) * (1 - var(--in))) * var(--k) * 1%) round calc(var(--wr) * var(--k) * 1cqw))}
.bct-water{position:absolute;inset:0;background:radial-gradient(90% 70% at 50% 18%,color-mix(in oklab,var(--deep) 58%,#a9c4b6) 0%,var(--deep) 48%,var(--abyss) 100%)}
.bct-caustic{position:absolute;inset:-30%;mix-blend-mode:screen;opacity:.18;pointer-events:none;background:radial-gradient(closest-side,rgba(255,255,255,.55),transparent 70%) 12% 18%/32% 26% no-repeat,radial-gradient(closest-side,rgba(255,255,255,.4),transparent 70%) 70% 30%/40% 30% no-repeat,radial-gradient(closest-side,rgba(255,255,255,.35),transparent 70%) 40% 70%/36% 24% no-repeat}
.bct-caustic-b{opacity:.12;background:radial-gradient(closest-side,rgba(255,255,255,.5),transparent 70%) 80% 70%/34% 28% no-repeat,radial-gradient(closest-side,rgba(255,255,255,.4),transparent 70%) 24% 60%/42% 30% no-repeat,radial-gradient(closest-side,rgba(255,255,255,.3),transparent 70%) 55% 10%/30% 22% no-repeat}
.bct-rays{position:absolute;inset:0;mix-blend-mode:screen;opacity:.85;background:conic-gradient(from 160deg at 50% -30%,transparent 0 34%,rgba(255,255,255,.07) 35% 36.5%,transparent 38% 43%,rgba(255,255,255,.05) 44% 45%,transparent 47% 51%,rgba(255,255,255,.08) 52% 53.5%,transparent 55% 60%,rgba(255,255,255,.05) 61% 62%,transparent 64%)}
.bct-forest{position:absolute;--rise:0;--px:0;--py:0;top:calc(var(--wt) * var(--k) * 1%);bottom:calc(var(--wb) * var(--k) * 1%);left:calc(var(--wx) * var(--k) * 1%);right:calc(var(--wx) * var(--k) * 1%);translate:calc(var(--px) * 1px) calc(var(--py) * 1px)}
.bct-weed{position:absolute;bottom:-5%;transform-origin:50% 100%}
.bct-weed .bct-art,.bct-weed .bct-cut{width:100%;height:auto}
.bct-weed.is-d0{z-index:1;bottom:-8%;filter:brightness(.5) saturate(.6) hue-rotate(-12deg)}
.bct-weed.is-d1{z-index:3;bottom:-7%;filter:brightness(.7) saturate(.82)}
.bct-weed.is-d2{z-index:4;bottom:-4%;filter:brightness(.92) saturate(.95)}
.bct-haze{position:absolute;inset:-10% -10% 0;z-index:2;background:linear-gradient(180deg,color-mix(in oklab,var(--deep) 30%,transparent) 0%,color-mix(in oklab,var(--deep) 32%,transparent) 55%,color-mix(in oklab,var(--abyss) 50%,transparent) 100%)}
.bct-dim{position:absolute;inset:-10% -10% -2%;z-index:5;background:linear-gradient(90deg,var(--abyss) 0%,color-mix(in oklab,var(--abyss) 60%,transparent) 45%,color-mix(in oklab,var(--abyss) 30%,transparent) 100%);opacity:calc(var(--rise) * .62);pointer-events:none}
.bct-bubble{position:absolute;bottom:-24px;border-radius:50%;border:1px solid rgba(255,255,255,.5);background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.4),rgba(255,255,255,.04) 62%);opacity:0;display:none;z-index:5}
.is-alive .bct-bubble{display:block;animation-name:bct-rise;animation-timing-function:linear;animation-iteration-count:infinite}
.bct-vignette{position:absolute;inset:0;z-index:6;background:radial-gradient(34% 26% at 50% var(--cy),rgba(6,16,16,.34),transparent 100%),radial-gradient(70% 70% at 50% 50%,transparent 60%,rgba(0,0,0,.3) 100%)}
.bct-kicker{position:absolute;left:50%;top:calc(var(--wt) * 1% - 1.4cqw);transform:translate(-50%,-100%);font:400 clamp(22px,2.5cqw,38px)/1 var(--display);letter-spacing:.02em;white-space:nowrap}
.bct-hero-anchor{position:absolute;left:0;right:0;top:var(--cy);transform:translateY(-50%);z-index:7;display:grid;place-items:center;pointer-events:none;--px:0;--py:0;translate:calc(var(--px) * 1px) calc(var(--py) * 1px)}
.bct-hero-copy{display:flex;flex-direction:column;align-items:center;text-align:center;color:var(--c-paper);padding:0 8cqw}
.bct-arch{width:clamp(30px,3cqw,48px);height:auto;opacity:.85;margin-bottom:12px}
.bct-title{font:400 clamp(36px,5.5cqw,86px)/.95 var(--display);letter-spacing:.17em;text-transform:uppercase;padding-left:.17em;text-shadow:0 2px 28px rgba(0,0,0,.3)}
.bct-script{font:400 clamp(40px,5.6cqw,86px)/.8 var(--script);margin-top:-.12em;rotate:-4deg;text-shadow:0 2px 26px rgba(0,0,0,.3)}
.bct-squiggle{width:78px;opacity:.75;margin:14px 0 10px}
.bct-byline{font:400 10.5px/1 var(--label);letter-spacing:.34em;text-transform:uppercase;opacity:.8}
.bct-badge{position:absolute;z-index:8;left:calc(100% - var(--wx) * 1% - 3.6cqw);top:calc(var(--cy) - 1cqw);width:clamp(60px,6cqw,90px);aspect-ratio:1;border-radius:50%;background:var(--slate);color:var(--c-paper);display:grid;place-items:center;font:500 clamp(15px,1.6cqw,23px)/1 var(--display);letter-spacing:.02em;box-shadow:0 14px 30px -14px rgba(0,0,0,.55);pointer-events:none}
.bct-badge::after{content:"";position:absolute;inset:5px;border-radius:50%;border:1px dashed color-mix(in oklab,var(--c-paper) 55%,transparent)}
.bct-fig{position:absolute;z-index:9;pointer-events:none;--px:0;--py:0}
.bct-fig > *{translate:calc(var(--px) * 1px) calc(var(--py) * 1px)}
.bct-fig :where(.bct-art,.bct-cut){width:100%;height:auto}
.bct-root:not(.is-ready) .bct-scene .bct-fig,.bct-root:not(.is-ready) .bct-weed{opacity:0}
.bct-fig-whale{left:1.5cqw;top:45%;width:34cqw;z-index:11;filter:drop-shadow(0 16px 18px rgba(20,26,26,.28))}
.bct-fig-octopus{left:65cqw;top:calc(64px + .6cqw);width:16.5cqw;z-index:10;filter:drop-shadow(0 14px 16px rgba(30,20,10,.24))}
.bct-fig-gorgonian{left:15cqw;top:9%;width:10.5cqw;filter:drop-shadow(0 10px 10px rgba(30,20,10,.18))}
.bct-fig-kelp{left:18.6cqw;top:37%;width:6.2cqw}
.bct-fig-star{left:21.5cqw;top:63%;width:7.5cqw;rotate:-14deg;filter:drop-shadow(0 8px 10px rgba(30,20,10,.22))}
.bct-fig-coral{left:68.5cqw;top:55%;width:12.5cqw;filter:drop-shadow(0 10px 12px rgba(30,20,10,.2))}
.bct-fig-scallop{left:78.5cqw;top:63.5%;width:8cqw;rotate:12deg;filter:drop-shadow(0 10px 12px rgba(30,20,10,.25))}
.bct-fig-rose{left:78.6cqw;top:30%;width:7cqw;rotate:10deg}
.bct-arc{position:absolute;z-index:8;left:50%;top:calc(100% - var(--wb) * 1% + .2cqw);width:min(52cqw,760px);translate:-50% 0;overflow:visible;pointer-events:none}
.bct-arc text{font:italic 400 44px var(--display);fill:var(--ink);letter-spacing:.01em}
.bct-under{position:absolute;z-index:8;left:0;right:0;top:calc(100% - var(--wb) * 1% + 6.6cqw);display:flex;justify-content:center;align-items:center;gap:12px 26px;flex-wrap:wrap}
.bct-strip{position:absolute;z-index:12;left:50%;bottom:-8cqw;translate:-50% 0;display:flex;gap:1.1cqw;align-items:flex-end;pointer-events:none}
.bct-strip-card{position:relative;width:8.6cqw;height:12cqw;background:#fff;padding:5px;box-shadow:var(--shadow);rotate:calc((var(--i) - 4) * 1.7deg);translate:0 calc(abs(var(--i) - 4) * .55cqw);overflow:visible}
.bct-strip-card.is-tile > .bct-swatch-fill{position:absolute;inset:5px}
.bct-strip-card.is-plate img{display:block;width:100%;height:100%;object-fit:cover;max-width:none}
.bct-strip-card.is-plate .bct-art{width:100%;height:100%}
.bct-strip-card.is-chip{width:7.4cqw;height:10.4cqw;padding:5px 5px 0;display:grid;grid-template-rows:1fr auto auto;gap:2px;align-self:flex-start;margin-bottom:2.4cqw}
.bct-strip-card.is-chip span{background:var(--sw)}
.bct-strip-card.is-chip b{font:600 9px/1.1 var(--label);color:#222;margin-top:4px}
.bct-strip-card.is-chip small{font:400 8.5px/1 var(--label);color:#666;letter-spacing:.06em;padding-bottom:7px;text-transform:uppercase}
.bct-deep{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1.15fr;grid-template-areas:"copy stats" "formats formats";align-content:center;gap:2.6cqw 5cqw;padding:calc(64px + 3cqw) 7cqw 11cqw;color:var(--c-paper);pointer-events:none;z-index:13}
.bct-deep-copy{grid-area:copy;display:grid;gap:18px;align-content:center}
.bct-deep-copy > *,.bct-stat,.bct-formats{opacity:0}
.bct-deep .bct-eyebrow{color:var(--sand)}
.bct-deep .bct-lede{color:color-mix(in oklab,var(--c-paper) 82%,transparent)}
.bct-stats{grid-area:stats;display:grid;grid-template-columns:repeat(3,1fr);gap:1.8cqw 2cqw;align-self:center}
.bct-stat{display:grid;gap:5px;padding-top:14px;border-top:1px solid color-mix(in oklab,var(--c-paper) 25%,transparent)}
.bct-stat-n{font:300 clamp(38px,4.6cqw,72px)/1 var(--display);font-variant-numeric:tabular-nums}
.bct-stat-l{font:500 11px/1.3 var(--label);letter-spacing:.16em;text-transform:uppercase}
.bct-stat-note{font:300 13px/1.4 var(--label);opacity:.7}
.bct-formats{grid-area:formats;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font:500 11px/1 var(--label);letter-spacing:.2em;text-transform:uppercase}
.bct-formats span{margin-right:8px;opacity:.7}
.bct-formats em{font-style:normal;padding:8px 12px;border:1px solid color-mix(in oklab,var(--c-paper) 35%,transparent);border-radius:999px;letter-spacing:.12em}
.is-still .bct-dive{height:auto}
.is-still .bct-stage{position:relative;height:auto;min-height:0}
.is-still .bct-scene{position:relative;height:var(--h);min-height:640px}
.is-still .bct-deep{position:relative;inset:auto;background:var(--deep);padding:7cqw 7cqw 8cqw;pointer-events:auto}
.is-still .bct-deep :where(.bct-deep-copy > *,.bct-stat,.bct-formats){opacity:1}

/* the moodboard */
.bct-board{position:relative;display:grid;grid-template-columns:repeat(12,1fr);gap:3cqw 2cqw;padding:8cqw 5.5cqw 9cqw;align-items:start}
.bct-pinned{position:relative;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.bct-pinned.is-drag{cursor:grabbing;z-index:6}
.bct-card{background:var(--card);color:var(--dark);box-shadow:var(--shadow)}
.bct-tack{position:absolute;width:15px;height:15px;margin:-7px 0 0 -7px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff7d8 0,#e5c46e 22%,var(--gold) 48%,#6d4d14 100%);box-shadow:0 2px 2px rgba(0,0,0,.35),2px 9px 10px -4px rgba(0,0,0,.45);z-index:4;pointer-events:none}
.bct-tape{position:absolute;width:96px;height:28px;left:-26px;top:-8px;background:color-mix(in oklab,var(--sand) 70%,transparent);transform:rotate(-34deg);z-index:4;clip-path:polygon(2% 0,98% 4%,100% 96%,0 100%);pointer-events:none;mix-blend-mode:multiply;opacity:.9}
.bct-poster{grid-column:1/4;grid-row:1/3;width:100%;max-width:330px;justify-self:center;padding:12px 12px 14px}
.bct-poster-fig{display:grid;gap:10px}
.bct-poster-fig img{display:block;width:100%;height:auto;max-width:none;aspect-ratio:3289/4615;object-fit:cover;background:#e9e2d2}
.bct-poster-fig .bct-art{width:100%;height:auto;aspect-ratio:.72}
.bct-poster-fig figcaption{display:grid;justify-items:center;gap:2px;text-align:center}
.bct-poster-fig figcaption span{font:500 9px/1 var(--label);letter-spacing:.3em;text-transform:uppercase;opacity:.6}
.bct-poster-fig figcaption b{font:500 20px/1.1 var(--display);letter-spacing:.18em;text-transform:uppercase}
.bct-poster-fig figcaption em{font:italic 300 13px/1.2 var(--display);opacity:.72}
.bct-markcard{grid-column:4/6;grid-row:1;width:clamp(120px,10cqw,150px);aspect-ratio:1;background:var(--slate);color:var(--c-paper);display:grid;place-items:center;justify-self:center;margin-top:1.5cqw}
.bct-markcard .bct-emblem{width:62%;color:var(--c-paper)}
.bct-board-whale{grid-column:6/9;grid-row:1;align-self:center;width:100%;filter:drop-shadow(0 18px 18px rgba(20,26,26,.22))}
.bct-board-whale :where(.bct-art,.bct-cut){width:100%;height:auto}
.bct-icons{grid-column:9/13;grid-row:1;padding:30px 20px 14px;position:relative;overflow:hidden}
.bct-icons::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.55;mix-blend-mode:multiply;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='420'><filter id='c' x='0' y='0' width='100%25' height='100%25'><feTurbulence type='fractalNoise' baseFrequency='.006 .009' numOctaves='4' seed='7'/><feDiffuseLighting lighting-color='%23ffffff' surfaceScale='2.6'><feDistantLight azimuth='235' elevation='58'/></feDiffuseLighting></filter><rect width='100%25' height='100%25' filter='url(%23c)'/></svg>") center/cover}
.bct-card-title{position:relative;font:500 10.5px/1 var(--label);letter-spacing:.24em;text-transform:uppercase;margin-bottom:10px;opacity:.65}
.bct-icon-grid{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.bct-icon-grid li{position:relative;aspect-ratio:1;min-width:0}
.bct-icon-grid .bct-art{position:absolute;left:10px;top:10px;width:calc(100% - 20px);height:calc(100% - 20px);color:#3b4448}
.bct-board-copy{grid-column:4/10;grid-row:2;align-self:center;display:grid;justify-items:center;gap:18px;text-align:center;padding:0 2cqw}
.bct-board-copy .bct-eyebrow{justify-content:center}
.bct-board-copy .bct-h2{font-size:clamp(28px,3cqw,44px);line-height:1.12;text-transform:uppercase;letter-spacing:.06em;max-width:24ch;font-weight:400}
.bct-board-copy .bct-lede{font:italic 400 clamp(14px,1.15cqw,17px)/1.7 var(--display);max-width:56ch}
.bct-chips{grid-column:10/13;grid-row:2;display:grid;grid-template-columns:repeat(3,1fr);gap:18px 10px;padding:10px 4px 0;align-self:start}
.bct-chipcard{aspect-ratio:5/6.4;background:var(--card);color:var(--dark);box-shadow:var(--shadow)}
.bct-chip{display:grid;grid-template-rows:1fr auto auto;width:100%;height:100%;padding:5px 5px 8px;gap:2px}
.bct-chip-color{background:var(--sw);min-height:0;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.bct-chip:hover .bct-chip-color{transform:scale(1.03)}
.bct-chip-name{font:600 10px/1.1 var(--label);margin-top:6px;padding:0 2px}
.bct-chip-hex{font:400 9.5px/1 var(--label);letter-spacing:.08em;text-transform:uppercase;opacity:.6;padding:0 2px}
.bct-letter-card{grid-column:1/4;grid-row:3/5;width:min(100%,290px);aspect-ratio:1/1.05;justify-self:center;align-self:end;display:grid;place-items:center;overflow:visible;margin-top:2cqw;background:var(--c-deep);background-image:radial-gradient(80% 70% at 40% 30%,color-mix(in oklab,var(--c-deep) 70%,#9fbcae),var(--c-deep))}
.bct-letter-glyph{display:block;font:600 clamp(190px,19.5cqw,290px)/.86 var(--display);margin-top:-.04em;background-color:var(--c-paper);background-repeat:repeat;background-size:210px auto;background-position:22% 30%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;padding:0 .04em;filter:drop-shadow(0 2px 1px rgba(0,0,0,.25)) drop-shadow(0 12px 16px rgba(0,0,0,.25))}
.bct-letter-coral{position:absolute;right:-9%;bottom:-6%;width:46%;rotate:14deg;pointer-events:none;filter:drop-shadow(0 8px 8px rgba(30,20,10,.2))}
.bct-letter-coral :where(.bct-art,.bct-cut){width:100%;height:auto}
.bct-swatches{grid-column:4/9;grid-row:3/5;display:flex;gap:1.8cqw;align-items:flex-end;justify-content:center;align-self:end;padding-top:1cqw}
.bct-swatch{width:clamp(96px,9cqw,132px);display:grid;justify-items:center;gap:9px}
.bct-swatch-shade{display:block;width:100%;filter:drop-shadow(0 1px 1px rgba(30,24,16,.25)) drop-shadow(0 12px 12px rgba(30,24,16,.22))}
.bct-swatch-btn{position:relative;display:block;width:100%;aspect-ratio:1;background:#fff;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.bct-swatch-btn:hover{transform:scale(1.04)}
.bct-swatch-btn > .bct-swatch-fill{position:absolute;inset:0}
.bct-swatch-name{font:500 10px/1 var(--label);letter-spacing:.18em;text-transform:uppercase;opacity:.7;display:flex;gap:6px;align-items:center;white-space:nowrap}
.bct-swatch.is-on .bct-swatch-name{opacity:1}
.bct-swatch.is-on .bct-swatch-name::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--coral)}
.bct-board-shell{width:clamp(90px,8.5cqw,128px);align-self:center;rotate:-12deg;margin-left:.6cqw;filter:drop-shadow(0 14px 12px rgba(60,30,10,.3))}
.bct-board-shell :where(.bct-art,.bct-cut){width:100%;height:auto}
.bct-envelope{grid-column:9/13;grid-row:3/5;position:relative;width:min(100%,370px);aspect-ratio:300/190;justify-self:center;align-self:end;margin-top:30%;perspective:1100px;filter:drop-shadow(0 26px 28px rgba(20,30,40,.3))}
.bct-env-back{position:absolute;inset:0;background:var(--abyss);border-radius:3px;overflow:hidden}
.bct-env-lining{position:absolute;inset:0;clip-path:polygon(0 0,100% 0,50% 58%)}
.bct-env-letter{position:absolute;left:5%;right:5%;top:7%;bottom:0;z-index:1;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.bct-envelope.is-open .bct-env-letter{transform:translateY(-80%)}
.bct-letter{display:grid;gap:8px;min-height:100%;padding:18px 18px 16px;background:var(--card);color:var(--dark);border-radius:2px;box-shadow:0 10px 24px -14px rgba(0,0,0,.5)}
.bct-letter-title{font:500 19px/1.1 var(--display);text-transform:uppercase;letter-spacing:.1em}
.bct-letter-body{font:300 12.5px/1.5 var(--label);opacity:.82}
.bct-letter-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:4px}
.bct-letter-row input{min-width:0;height:40px;padding:0 12px;border:1px solid color-mix(in oklab,var(--dark) 28%,transparent);border-radius:999px;background:#fff;color:var(--dark);font:400 13px var(--label)}
.bct-letter-row input::placeholder{color:color-mix(in oklab,var(--dark) 45%,transparent)}
.bct-letter-row input[aria-invalid=true]{border-color:var(--coral)}
.bct-letter .bct-btn{background:var(--dark);color:var(--light)}
.bct-letter-err{font:400 11.5px/1.3 var(--label);color:var(--coral)}
.bct-letter-done{font:italic 400 15px/1.3 var(--display);color:var(--dark);padding:10px 0 4px}
.bct-env-front{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}
.bct-env-paper{fill:color-mix(in oklab,var(--dusk) 78%,var(--slate))}
.bct-env-seam{fill:none;stroke:rgba(0,0,0,.18);stroke-width:1}
.bct-env-foil{position:absolute;z-index:3;left:50%;top:70%;width:15%;translate:-50% -50%;pointer-events:none;filter:drop-shadow(0 1px 0 rgba(0,0,0,.25))}
.bct-env-flap{position:absolute;left:0;right:0;top:0;height:58%;transform-origin:50% 0;transform-style:preserve-3d;transition:transform .95s cubic-bezier(.45,0,.2,1),z-index 0s .42s;z-index:3}
.bct-envelope.is-open .bct-env-flap{transform:rotateX(180deg);z-index:0}
.bct-env-flap-out,.bct-env-flap-in{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;clip-path:polygon(0 0,100% 0,50% 100%);overflow:hidden}
.bct-env-flap-out{background:linear-gradient(180deg,color-mix(in oklab,var(--dusk) 92%,#fff),color-mix(in oklab,var(--dusk) 70%,var(--slate)))}
.bct-env-flap-in{transform:rotateX(180deg);background:var(--abyss)}
.bct-env-flap-in > .bct-swatch-fill{position:absolute;inset:0}

/* plates */
.bct-plate{background:var(--card);color:var(--dark);padding:4.5%;border:7px solid #1d2326;box-shadow:var(--shadow)}
.bct-plate-mat{display:grid;gap:10px;padding:7% 7% 8%;border:1px solid color-mix(in oklab,var(--dark) 22%,transparent)}
.bct-plate-art{position:relative;aspect-ratio:1/1.32;background:color-mix(in oklab,var(--c-paper) 70%,#fff)}
.bct-plate-art .bct-art,.bct-plate-art img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover}
.bct-plate.is-scan .bct-plate-art{box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}
.bct-plate-ink{opacity:.82}
.bct-plate-cap{display:grid;justify-items:center;gap:3px;text-align:center}
.bct-plate-num{font:500 9.5px/1 var(--label);letter-spacing:.3em;text-transform:uppercase;opacity:.7}
.bct-plate-title{font:500 clamp(15px,1.3cqw,20px)/1.1 var(--display);text-transform:uppercase;letter-spacing:.12em;max-width:100%;overflow-wrap:anywhere}
.bct-plate-latin{font:italic 300 13px/1.2 var(--display);opacity:.72}

/* patterns */
.bct-patterns{position:relative;display:grid;grid-template-columns:1.25fr .9fr;grid-template-areas:"head head" "stage list";gap:2cqw 4cqw;padding:7cqw 6cqw 8cqw;background:var(--band)}
.bct-patterns .bct-head{grid-area:head;padding:0}
.bct-pat-stage{grid-area:stage;position:relative;aspect-ratio:4/3;background:#fff;box-shadow:var(--shadow);overflow:hidden}
.bct-pat-stage > .bct-swatch-fill{position:absolute;inset:12px}
.bct-pat-label{position:absolute;left:30px;bottom:30px;display:grid;gap:3px;padding:12px 16px;background:var(--card);color:var(--dark);box-shadow:0 10px 24px -14px rgba(0,0,0,.5)}
.bct-pat-label span{font:500 16px/1 var(--display);letter-spacing:.16em;text-transform:uppercase}
.bct-pat-label em{font:400 10px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;font-style:normal;opacity:.7}
.bct-pat-list{grid-area:list;display:grid;gap:4px;align-self:center}
.bct-pat-btn{display:grid;grid-template-columns:62px 1fr;gap:16px;align-items:center;width:100%;padding:10px;border-radius:8px;border:1px solid transparent;transition:background .25s,border-color .25s}
.bct-pat-btn:hover{background:color-mix(in oklab,var(--ink) 6%,transparent)}
.bct-pat-btn.is-on{border-color:var(--ink)}
.bct-pat-thumb{width:62px;height:62px;border-radius:4px;border:3px solid #fff;box-shadow:0 0 0 1px var(--line)}
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
.bct-shelf-item{flex:0 0 clamp(220px,19cqw,290px);scroll-snap-align:start;transition:translate .5s cubic-bezier(.2,.8,.2,1),rotate .5s cubic-bezier(.2,.8,.2,1)}
.bct-shelf-item:nth-child(3n+2){flex-basis:clamp(240px,21cqw,320px)}
.bct-shelf-item:hover{translate:0 -10px;rotate:-.6deg}
.bct-shelf-edge{height:12px;margin:0 6cqw;border-top:2px solid color-mix(in oklab,var(--ink) 40%,transparent);background:linear-gradient(180deg,color-mix(in oklab,var(--ink) 14%,transparent),transparent)}

/* licence */
.bct-licence{position:relative;padding:7cqw 6cqw 9cqw;background:var(--band);overflow:hidden}
.bct-licence .bct-head{padding:0}
.bct-lic-grid{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:1.6cqw;margin-top:3cqw;z-index:1}
.bct-lic{position:relative;display:grid;gap:14px;align-content:start;padding:28px 24px 26px;background:var(--card);color:var(--dark);border:1px solid var(--line);cursor:pointer;transition:translate .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s,border-color .25s}
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
.bct-lic-fig{position:absolute;pointer-events:none;filter:drop-shadow(0 14px 14px rgba(40,25,10,.22))}
.bct-lic-fig :where(.bct-art,.bct-cut){width:100%;height:auto}
.bct-lic-fig-a{right:4cqw;top:2.5cqw;width:11cqw;rotate:-12deg}
.bct-lic-fig-b{right:20cqw;top:4cqw;width:9cqw;rotate:18deg}

/* footer */
.bct-footer{position:relative;background:var(--deep);color:var(--c-paper);padding:9cqw 6cqw 3cqw;overflow:hidden}
.bct-footer-wave{position:absolute;left:0;right:0;top:-1px;width:100%;height:4cqw;color:var(--band);transform:scaleY(-1)}
.bct-wave{display:block}
.bct-foot-whale{position:absolute;right:-5cqw;bottom:6cqw;width:42cqw;color:var(--c-paper);opacity:.22;pointer-events:none}
.bct-foot-whale :where(.bct-art,.bct-cut){width:100%;height:auto}
.bct-foot-whale .bct-cut{filter:grayscale(1) brightness(1.9) contrast(.9);mix-blend-mode:screen;opacity:.8}
.bct-foot-grid{position:relative;display:grid;grid-template-columns:1.5fr .8fr .8fr;gap:4cqw;align-items:start}
.bct-foot-mark{font:400 clamp(72px,11cqw,172px)/.9 var(--script);rotate:-3deg;transform-origin:0 100%;margin-bottom:14px;margin-left:.1em}
.bct-foot-body{font:300 15px/1.6 var(--label);max-width:34ch;opacity:.86}
.bct-foot-links,.bct-foot-social{display:grid;gap:12px;font:400 14px/1 var(--label);padding-top:1cqw}
.bct-foot-links :where(a,button),.bct-foot-social a{opacity:.86;text-decoration:none;transition:opacity .2s}
.bct-foot-links :where(a,button):hover,.bct-foot-social a:hover{opacity:1;text-decoration:underline;text-underline-offset:5px}
.bct-foot-legal{position:relative;margin-top:5cqw;padding-top:16px;border-top:1px solid color-mix(in oklab,var(--c-paper) 18%,transparent);font:300 12px/1.4 var(--label);opacity:.72}
.bct-foot-credits{position:relative;margin-top:8px;font:300 11px/1.5 var(--label);opacity:.55;max-width:110ch}

/* lightbox + toast */
.bct-lightbox{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:4vmin;background:color-mix(in oklab,var(--c-abyss) 84%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.bct-lightbox-card{position:relative;display:grid;grid-template-columns:minmax(240px,420px) minmax(240px,340px);gap:36px;align-items:center;padding:30px;max-width:min(96vw,920px);max-height:92vh;overflow:auto;background:var(--paper);color:var(--ink);box-shadow:0 50px 90px -40px rgba(0,0,0,.7)}
.bct-lightbox-text{display:grid;gap:6px}
.bct-lightbox-text h3{font:500 clamp(26px,3cqw,40px)/1.05 var(--display);margin-top:6px}
.bct-lightbox-text em{font:italic 300 16px/1.2 var(--display);color:var(--soft)}
.bct-lightbox-text p{font:300 15px/1.6 var(--label);color:var(--soft);margin-top:10px}
.bct-lightbox-credit{font:400 11.5px/1.5 var(--label);color:var(--soft);opacity:.85;margin-bottom:6px}
.bct-lightbox-nav{display:flex;gap:6px}
.bct-lightbox-close{position:absolute;right:12px;top:10px;width:40px;height:40px;border-radius:50%;font:300 28px/1 var(--display);display:grid;place-items:center;transition:background .2s,color .2s}
.bct-lightbox-close:hover{background:var(--ink);color:var(--paper)}
.bct-toast{position:fixed;left:50%;bottom:28px;z-index:70;transform:translate(-50%,16px);padding:11px 18px;border-radius:999px;background:var(--ink);color:var(--paper);font:500 13px/1 var(--label);opacity:0;pointer-events:none;transition:opacity .3s,transform .3s cubic-bezier(.2,.8,.2,1);box-shadow:0 20px 40px -20px rgba(0,0,0,.5)}
.bct-toast.is-on{opacity:1;transform:translate(-50%,0)}

/* life */
.is-alive .bct-caustic-a{animation:bct-drift-a 17s ease-in-out infinite alternate}
.is-alive .bct-caustic-b{animation:bct-drift-b 23s ease-in-out infinite alternate}
.is-alive .bct-rays{animation:bct-rays 15s ease-in-out infinite alternate}
.is-alive .bct-weed > *{animation:bct-sway 8s ease-in-out infinite alternate;transform-origin:50% 100%}
.is-alive .bct-weed.is-late > *{animation-delay:-4s;animation-duration:10s}
.is-alive .bct-sway{animation:bct-sway 7s ease-in-out infinite alternate;transform-origin:50% 100%}
.is-alive .bct-sway-late{animation-delay:-3.5s;animation-duration:8.5s}
.is-alive .bct-octo{animation:bct-float 9s ease-in-out infinite alternate;transform-origin:50% 30%}
.is-alive .bct-swim{animation:bct-swim 8s ease-in-out infinite alternate}
@keyframes bct-fade{from{opacity:0}to{opacity:1}}
@keyframes bct-rise{0%{transform:translate(0,0);opacity:0}8%{opacity:.85}100%{transform:translate(18px,calc(var(--h) * -1.05));opacity:0}}
@keyframes bct-drift-a{from{transform:translate(-3%,-2%) scale(1)}to{transform:translate(4%,3%) scale(1.12)}}
@keyframes bct-drift-b{from{transform:translate(3%,2%) scale(1.1)}to{transform:translate(-4%,-3%) scale(1)}}
@keyframes bct-rays{from{transform:rotate(-2deg) scaleX(1);opacity:.7}to{transform:rotate(2deg) scaleX(1.06);opacity:1}}
@keyframes bct-sway{from{transform:rotate(-2.2deg) skewX(1.4deg)}to{transform:rotate(2.2deg) skewX(-1.4deg)}}
@keyframes bct-float{from{transform:translateY(-1.5%) rotate(-1.5deg)}to{transform:translateY(1.5%) rotate(1.5deg)}}
@keyframes bct-swim{from{transform:translateY(-2%) rotate(-1deg)}to{transform:translateY(2%) rotate(1.2deg)}}
@media (prefers-reduced-motion:reduce){.bct-root :where(.bct-caustic,.bct-rays,.bct-sway,.bct-octo,.bct-swim,.bct-bubble,.bct-weed > *,.bct-cut,.bct-tile){animation:none}.bct-root .bct-bubble{display:none}.bct-root :where(.bct-env-letter,.bct-env-flap,.bct-header,.bct-lic,.bct-shelf-item,.bct-toast){transition-duration:0s}}

/* tablet */
@container (max-width: 1100px){
.bct-stage{--wx:14;--wt:16;--wb:29;--wr:12}
.bct-fig-whale{left:-6cqw;top:47%;width:42cqw}
.bct-fig-octopus{left:62cqw;top:7%;width:25cqw}
.bct-fig-gorgonian{left:6cqw;top:10%;width:14cqw}
.bct-fig-kelp{left:10.5cqw;top:38%;width:8cqw}
.bct-fig-star{left:13cqw;top:63%;width:9.5cqw}
.bct-fig-coral{left:72cqw;top:56%;width:15cqw}
.bct-fig-scallop{left:84cqw;top:64%;width:10cqw}
.bct-fig-rose{left:84cqw;top:24%;width:9cqw}
.bct-arc{width:70cqw}
.bct-under{top:calc(100% - var(--wb) * 1% + 10.5cqw)}
.bct-strip{bottom:-9cqw}
.bct-strip-card{width:11cqw;height:15cqw}
.bct-strip-card.is-chip{width:9.4cqw;height:13cqw}
.bct-deep{grid-template-columns:1fr;grid-template-areas:"copy" "stats" "formats";gap:3cqw;padding:calc(64px + 2cqw) 6cqw 6cqw}
.bct-board{gap:3.4cqw 2.4cqw}
.bct-poster{grid-column:1/5;grid-row:1/3}
.bct-markcard{grid-column:5/7;grid-row:1}
.bct-board-whale{grid-column:7/13;grid-row:1;width:100%;margin:0}
.bct-icons{grid-column:5/13;grid-row:2}
.bct-board-copy{grid-column:1/13;grid-row:3;padding:2cqw 4cqw}
.bct-chips{grid-column:1/7;grid-row:4;grid-template-columns:repeat(3,1fr)}
.bct-swatches{grid-column:7/13;grid-row:4;align-self:center;flex-wrap:wrap}
.bct-letter-card{grid-column:1/6;grid-row:5;align-self:center}
.bct-envelope{grid-column:6/13;grid-row:5;margin-top:22%}
.bct-patterns{grid-template-columns:1fr;grid-template-areas:"head" "stage" "list"}
.bct-pat-list{grid-template-columns:1fr 1fr}
.bct-head-row{grid-template-columns:1fr 1fr}
.bct-shelf-nav{grid-column:1/-1}
.bct-lic-grid{gap:2cqw}
.bct-lic-fig-b{display:none}
.bct-foot-grid{grid-template-columns:1.4fr 1fr 1fr}
}

/* phone */
@container (max-width: 760px){
.bct-header{gap:12px}
.bct-nav{display:none}
.bct-nav.is-open{display:grid;position:absolute;left:0;right:0;top:100%;padding:10px 16px 16px;background:color-mix(in oklab,var(--paper) 94%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.bct-nav.is-open :where(a,button){padding:12px 10px;border-radius:0;border-bottom:1px solid var(--line)}
.bct-cta{display:none}
.bct-burger{display:grid}
.bct-brand-note{display:none}
.bct-dive{height:calc(var(--h) * 2.1)}
.bct-stage{--wx:5;--wt:17;--wb:31;--wr:22;min-height:620px}
.bct-kicker{font-size:19px;top:calc(var(--wt) * 1% - 12px);left:6cqw;transform:translate(0,-100%)}
.bct-title{font-size:clamp(30px,10cqw,52px);letter-spacing:.12em;padding-left:.12em}
.bct-script{font-size:clamp(38px,12cqw,62px)}
.bct-arch{width:28px;margin-bottom:8px}
.bct-squiggle{width:58px;margin:10px 0 8px}
.bct-byline{font-size:9px;letter-spacing:.28em}
.bct-badge{left:auto;right:2cqw;top:calc(var(--cy) + 12%);width:56px;font-size:14px}
.bct-fig-whale{left:-16cqw;top:51%;width:66cqw}
.bct-fig-octopus{left:60cqw;top:calc(64px + 4px);width:38cqw}
.bct-fig-gorgonian{left:-3cqw;top:25%;width:19cqw}
.bct-fig-kelp,.bct-fig-rose,.bct-fig-star{display:none}
.bct-fig-coral{left:68cqw;top:56%;width:28cqw}
.bct-fig-scallop{display:none}
.bct-doodle{display:none}
.bct-arc{width:96cqw}
.bct-arc text{font-size:54px}
.bct-under{top:calc(100% - var(--wb) * 1% + 17cqw);padding:0 6cqw;flex-direction:column;gap:16px}
.bct-strip{display:none}
.bct-deep{grid-template-columns:1fr;grid-template-areas:"copy" "stats" "formats";gap:22px;padding:calc(64px + 14px) 6cqw 22px;align-content:center}
.bct-deep .bct-lede{font-size:14px}
.bct-stats{grid-template-columns:1fr 1fr;gap:14px 16px}
.bct-stat-n{font-size:34px}
.bct-stat-note{display:none}
.bct-formats em{padding:6px 9px}
.bct-board{grid-template-columns:1fr;gap:30px;padding:60px 6cqw 72px}
.bct-board > *{grid-column:1 !important;grid-row:auto !important}
.bct-board-copy{order:1;padding:0;text-align:left;justify-items:start}
.bct-board-copy .bct-eyebrow{justify-content:flex-start}
.bct-board-copy .bct-h2{font-size:clamp(26px,8cqw,34px)}
.bct-poster{order:2;max-width:300px;justify-self:start}
.bct-board-whale{order:3;width:100%;margin:0}
.bct-markcard{display:none}
.bct-icons{order:4}
.bct-chips{order:5;grid-template-columns:repeat(3,1fr);gap:16px 10px;padding:8px 0 0}
.bct-swatches{order:6;justify-content:flex-start;gap:14px;padding-top:4px;flex-wrap:wrap}
.bct-swatch{width:28%}
.bct-board-shell{width:24%}
.bct-letter-card{order:7;width:min(100%,280px);justify-self:start}
.bct-envelope{order:8;margin-top:36%;justify-self:center;width:min(100%,340px)}
.bct-letter{padding:14px}
.bct-letter-title{font-size:16px}
.bct-letter-row{grid-template-columns:1fr;gap:8px}
.bct-patterns{grid-template-columns:1fr;grid-template-areas:"head" "stage" "list";gap:22px;padding:56px 6cqw 64px}
.bct-pat-stage{aspect-ratio:1/1}
.bct-pat-stage > .bct-swatch-fill{inset:8px}
.bct-pat-label{left:18px;bottom:18px;padding:9px 12px}
.bct-pat-list{grid-template-columns:1fr}
.bct-prints{padding:56px 0 48px}
.bct-head{gap:12px;margin-bottom:22px}
.bct-head-row{grid-template-columns:1fr}
.bct-shelf{gap:16px;padding:16px 6cqw 14px}
.bct-shelf-item,.bct-shelf-item:nth-child(3n+2){flex-basis:72cqw}
.bct-licence{padding:56px 6cqw 64px}
.bct-lic-grid{grid-template-columns:1fr;gap:22px;margin-top:26px}
.bct-order{gap:18px;margin-top:28px;padding-top:22px}
.bct-total{margin-left:0;text-align:left;width:100%}
.bct-order .bct-btn{width:100%}
.bct-lic-fig-a{width:24cqw;top:30px;right:4cqw}
.bct-footer{padding:64px 6cqw 24px}
.bct-footer-wave{height:28px}
.bct-foot-grid{grid-template-columns:1fr;gap:28px}
.bct-foot-mark{font-size:clamp(64px,20cqw,96px)}
.bct-foot-whale{width:80cqw;right:-24cqw;bottom:60px;opacity:.16}
.bct-foot-legal{margin-top:36px}
.bct-lightbox-card{grid-template-columns:1fr;gap:22px;padding:20px;max-height:94vh}
.bct-lightbox-card .bct-plate{max-width:320px;margin:0 auto}
}
`
