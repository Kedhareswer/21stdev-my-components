"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Mehndi Atelier Template — a storefront for an organic henna house.
 *
 * Maroon, olive and gold on cream parchment, the way a mehndi studio's
 * wedding card would be printed. The page is a real shop front: an
 * announcement ribbon, a lace-trimmed header with a working bag, a split hero
 * where a gold mandala draws itself on and the photograph "develops" like a
 * fresh stain, a best-sellers bento with quick-add, four collection plates, a
 * heritage plate framed by paisleys, a stain study you can play with, and a
 * footer.
 *
 * - Every ornament (mandala, paisley, rosette, lace) is generated in code from
 *   a seed: no image assets, crisp at any size, recoloured by the palette.
 * - Henna darkens for two days after it is applied. The stain study models
 *   that curve, and the hero photo plays the same idea on load.
 * - GSAP ScrollTrigger runs the choreography inside one `gsap.context`, under
 *   `gsap.matchMedia`, so reduced motion gets the finished page and nothing
 *   is left behind on unmount.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

// ---- public types ---------------------------------------------------------------

export type MehndiPreset = "heirloom" | "indigo" | "terracotta"

export type MehndiColors = {
  /** The parchment the page is printed on. */
  paper?: string
  /** Body ink. */
  ink?: string
  /** The dark wine of the hero's left panel, buttons and the footer. */
  maroon?: string
  /** The second dark: the hero's right panel. */
  olive?: string
  /** Ornament ink: mandala, paisleys, lace, rules. */
  gold?: string
  /** Pale plates: the collection cards. */
  sand?: string
  /** Rose-beige plates and highlights. */
  rose?: string
}

export type MehndiArt = {
  src: string
  alt?: string
  /** object-position, e.g. "50% 30%". */
  focus?: string
}

export type MehndiNavItem = { label: string; href?: string }

export type MehndiProduct = {
  id: string
  name: string
  /** One line under the name: weight, count, origin. */
  note?: string
  price: number
  image: string | MehndiArt
  /** A small ribbon on the photo: "Bestseller", "New", "Bridal". */
  badge?: string
}

export type MehndiCollection = {
  id: string
  title: string
  blurb: string
  cta?: string
  /** Plate colour. */
  tone?: "sand" | "rose" | "maroon" | "plum"
  href?: string
}

export type MehndiShade = { id: string; name: string; hex: string }

export type MehndiBagItem = { id: string; name: string; price: number; qty: number }

export type MehndiAtelierTemplateProps = {
  /** Height of the hero. Must be a definite length. */
  height?: string
  preset?: MehndiPreset
  colors?: MehndiColors
  /** "auto" follows a `.dark` ancestor. */
  theme?: "auto" | "light" | "dark"
  /** Stylesheet for the fonts; null loads nothing and uses the fallback stacks. */
  fontHref?: string | null
  brand?: { name?: string; tagline?: string; est?: string }
  /** Lines for the ribbon above the header. */
  announcements?: string[]
  /** Words for the italic band under the hero. */
  bandWords?: string[]
  nav?: MehndiNavItem[]
  hero?: {
    kicker?: string
    /** Headline lines. */
    title?: string[]
    sub?: string
    cta?: string
    /** The label on the photograph. */
    photoKicker?: string
    photoTitle?: string
    photoCta?: string
  }
  /** The large tile of the best-sellers bento. */
  feature?: { kicker?: string; title?: string; blurb?: string; cta?: string }
  sellers?: { kicker?: string; title?: string; blurb?: string }
  products?: MehndiProduct[]
  collections?: MehndiCollection[]
  heritage?: { kicker?: string; title?: string; body?: string[]; cta?: string }
  study?: { kicker?: string; title?: string; blurb?: string }
  shades?: MehndiShade[]
  images?: { hero?: string | MehndiArt; feature?: string | MehndiArt }
  currency?: string
  /** Seed for the generated ornaments. Change it for a different mandala. */
  seed?: number
  onAddToCart?: (item: MehndiBagItem, bag: MehndiBagItem[]) => void
  onCheckout?: (bag: MehndiBagItem[], total: number) => void
  onNavigate?: (target: string) => void
  className?: string
}

// ---- defaults ---------------------------------------------------------------------

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Marcellus&family=Jost:wght@400;500;600&display=swap"

const DISPLAY = '"Cormorant Garamond", "Cormorant", "EB Garamond", "Garamond", "Times New Roman", serif'
const WORDMARK = 'Marcellus, "Cinzel", "Trajan Pro", "Cormorant Garamond", Georgia, serif'
const LABEL = 'Jost, "Futura PT", "Avenir Next", "Helvetica Neue", Arial, sans-serif'

const PALETTES = {
  heirloom: { paper: "#f1e6d2", ink: "#2d1a13", maroon: "#5b191c", olive: "#3f4221", gold: "#c99b45", sand: "#e8d6bb", rose: "#d7b394" },
  indigo: { paper: "#ece7da", ink: "#141a2b", maroon: "#1c2447", olive: "#1f4a46", gold: "#c9a24a", sand: "#dcd8c7", rose: "#c7b9a0" },
  terracotta: { paper: "#f3e8d8", ink: "#33200f", maroon: "#8a3b22", olive: "#4d5a3a", gold: "#d2a152", sand: "#ead9c0", rose: "#dcb18e" },
}

const U = (id: string, w: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&q=80"

const DEFAULT_IMAGES = {
  hero: { src: U("1621801306185-8c0ccf9c8eb8", 1600), alt: "Two hands with intricate henna, held together against a dark background", focus: "50% 45%" },
  feature: { src: U("1599536884823-1bc4fb5f9dea", 1400), alt: "Round tins of spices and henna seen from above", focus: "50% 50%" },
}

const DEFAULT_BRAND = { name: "Mahadi", tagline: "Organic Henna Atelier", est: "Est. 1987 · Jaipur" }

const DEFAULT_ANNOUNCEMENTS = [
  "Complimentary shipping on orders over ₹999",
  "Bridal bookings open for the wedding season",
  "100% plant henna, lab-tested, no PPD ever",
  "Fresh cones rolled every Monday",
]

const DEFAULT_BAND = ["Organic", "Bridal", "Natural", "Hand-rolled"]

const DEFAULT_NAV = [
  { label: "Shop" },
  { label: "Bridal" },
  { label: "Cones" },
  { label: "Powder" },
  { label: "Tattoos" },
  { label: "Atelier" },
  { label: "Journal" },
]

const DEFAULT_HERO = {
  kicker: "Hand-sifted · Rajasthan leaf",
  title: ["Organic", "Henna"],
  sub: "Cones rolled by hand from this season's leaf, for a stain that deepens to wine over two days.",
  cta: "Shop the collection",
  photoKicker: "The wedding season",
  photoTitle: "Bridal Collections",
  photoCta: "Book an artist",
}

const DEFAULT_FEATURE = {
  kicker: "The trousseau",
  title: "Seven-piece bridal set",
  blurb: "Powder, twelve cones, sealing balm, aftercare oil and three stencil sheets, in a hand-stitched box.",
  cta: "Discover the set",
}

const DEFAULT_SELLERS = {
  kicker: "Our atelier",
  title: "Best Sellers",
  blurb: "What leaves the shop fastest: the cones and the powder, then everything that keeps the stain dark.",
}

const DEFAULT_PRODUCTS = [
  { id: "powder", name: "Rajasthani Henna Powder", note: "100 g · triple-sifted", price: 349, image: { src: U("1603122612817-2fe0e0631a93", 900), alt: "Henna powder in a silver bowl", focus: "50% 55%" }, badge: "Bestseller" },
  { id: "cones", name: "Bridal Cones", note: "Set of 12 · fresh-rolled", price: 899, image: { src: U("1774019410616-2b38e4eeabd2", 900), alt: "Henna being piped onto a hand from a cone", focus: "50% 50%" }, badge: "Bridal" },
  { id: "stencils", name: "Festive Stencil Sheets", note: "3 sheets · 40 motifs", price: 299, image: { src: U("1565368114375-ba1a4db7099f", 900), alt: "A hand with a fine black henna vine", focus: "50% 40%" } },
  { id: "balm", name: "Sugar-Lemon Seal", note: "60 ml · aftercare", price: 249, image: { src: U("1764640848891-9b23d3632ccf", 900), alt: "A henna-patterned hand resting on wood", focus: "50% 50%" }, badge: "New" },
]

const DEFAULT_COLLECTIONS = [
  { id: "natural", title: "Natural Henna", blurb: "Single-origin leaf, ground fresh and sifted three times. Nothing added, nothing hidden.", cta: "Shop powder", tone: "sand" },
  { id: "bridal", title: "Bridal Mehndi", blurb: "Cones, consultations and artists for the ceremony. The stain is ready in time for the vows.", cta: "Book bridal", tone: "rose" },
  { id: "tattoos", title: "Temporary Tattoos", blurb: "Jagua and henna stencils that last a fortnight. Festival-ready in twenty minutes.", cta: "Shop tattoos", tone: "maroon" },
  { id: "diy", title: "DIY Kits", blurb: "Everything a first cone needs, with a practice sheet and a recipe card from the atelier.", cta: "Shop kits", tone: "plum" },
] as MehndiCollection[]

const DEFAULT_HERITAGE = {
  kicker: "Heritage & Art",
  title: "Three generations of leaf",
  body: [
    "The atelier began as a single stall in Jaipur's Johari Bazaar, where our grandmother ground henna for the brides of the old city. The leaf still comes from the same Sojat farms, dried in shade so the lawsone stays strong.",
    "Every cone is rolled by hand the week it ships. We add only eucalyptus oil, sugar and lemon, which is why a Mahadi stain starts as pumpkin and finishes as wine.",
  ],
  cta: "Our story",
}

const DEFAULT_STUDY = {
  kicker: "The stain study",
  title: "Watch it deepen",
  blurb: "A fresh stain is orange. It oxidises for forty-eight hours before settling into its final colour. Pick a shade and drag the hours.",
}

const DEFAULT_SHADES = [
  { id: "cherry", name: "Cherry brown", hex: "#8c3b1e" },
  { id: "burgundy", name: "Burgundy", hex: "#6e2229" },
  { id: "mahogany", name: "Deep mahogany", hex: "#4e1f14" },
  { id: "jagua", name: "Jagua black", hex: "#1f1b2a" },
]

// ---- logic (lifted into tests) ----------------------------------------------------

// #region rng
/** Small seeded generator so every ornament repeats exactly between renders. */
function rng(seed: number) {
  let t = (seed >>> 0) || 1
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
// #endregion

// #region ornament
const fx = (n: number) => +n.toFixed(2)
function polar(r: number, a: number) {
  return [fx(r * Math.cos(a)), fx(r * Math.sin(a))]
}
/** A lens-shaped petal from radius r0 to r1 at angle a, `spread` radians wide. */
function petalPath(r0: number, r1: number, a: number, spread: number) {
  const mid = (r0 + r1) / 2
  const [x0, y0] = polar(r0, a)
  const [x1, y1] = polar(r1, a)
  const [cx1, cy1] = polar(mid, a + spread)
  const [cx2, cy2] = polar(mid, a - spread)
  return "M" + x0 + "," + y0 + "Q" + cx1 + "," + cy1 + " " + x1 + "," + y1 + "Q" + cx2 + "," + cy2 + " " + x0 + "," + y0 + "Z"
}
/** n arcs around a circle of radius r, bulging outward: a lace edge. */
function scallopPath(r: number, n: number, phase: number) {
  let d = ""
  const step = (Math.PI * 2) / n
  const chord = 2 * r * Math.sin(step / 2)
  const ar = fx(chord * 0.56)
  for (let i = 0; i < n; i++) {
    const [x0, y0] = polar(r, phase + i * step)
    const [x1, y1] = polar(r, phase + (i + 1) * step)
    d += (i ? "" : "M" + x0 + "," + y0) + "A" + ar + "," + ar + " 0 0 1 " + x1 + "," + y1
  }
  return d + "Z"
}
type Ring = { kind: "petal" | "spike" | "dots" | "circle" | "scallop" | "ticks"; r: number; r2: number; n: number; phase: number; spread: number }
/**
 * Lay out a mandala as rings from the centre to radius R. Each ring is one
 * kind of mark; kinds never repeat back to back so the eye keeps moving.
 */
function mandalaRings(seed: number, R: number) {
  const r = rng(seed)
  const kinds = ["petal", "dots", "scallop", "spike", "circle", "ticks"] as Ring["kind"][]
  const rings: Ring[] = []
  let radius = R * 0.07
  let last = ""
  rings.push({ kind: "circle", r: radius, r2: radius, n: 1, phase: 0, spread: 0 })
  while (radius < R * 0.96) {
    let kind = kinds[Math.floor(r() * kinds.length)]
    while (kind === last) kind = kinds[Math.floor(r() * kinds.length)]
    last = kind
    const band = R * (kind === "petal" || kind === "spike" ? 0.09 + r() * 0.09 : kind === "dots" ? 0.035 : kind === "ticks" ? 0.04 : 0.03)
    const n = kind === "circle" ? 1 : 8 * (1 + Math.floor(r() * 4)) // 8, 16, 24 or 32 repeats
    const next = radius + band
    rings.push({ kind, r: fx(radius + band * 0.08), r2: fx(next), n, phase: r() < 0.5 ? 0 : Math.PI / n, spread: fx(0.35 + r() * 0.3) })
    radius = next + R * 0.012
  }
  return rings
}
/** The SVG paths and dots for one ring. */
function ringMarks(ring: Ring) {
  const paths: string[] = []
  const dots: number[][] = []
  const step = (Math.PI * 2) / ring.n
  if (ring.kind === "circle") {
    paths.push("M" + fx(ring.r) + ",0A" + fx(ring.r) + "," + fx(ring.r) + " 0 1 1 " + fx(-ring.r) + ",0A" + fx(ring.r) + "," + fx(ring.r) + " 0 1 1 " + fx(ring.r) + ",0Z")
  } else if (ring.kind === "scallop") {
    paths.push(scallopPath(ring.r, ring.n, ring.phase))
  } else if (ring.kind === "petal" || ring.kind === "spike") {
    const spread = ring.kind === "spike" ? step * 0.42 : step * ring.spread
    for (let i = 0; i < ring.n; i++) paths.push(petalPath(ring.r, ring.r2, ring.phase + i * step, spread))
    if (ring.kind === "petal") {
      const inner = ring.r + (ring.r2 - ring.r) * 0.22
      const innerTop = ring.r + (ring.r2 - ring.r) * 0.78
      for (let i = 0; i < ring.n; i++) paths.push(petalPath(inner, innerTop, ring.phase + i * step, spread * 0.42))
    }
  } else if (ring.kind === "dots") {
    const rad = Math.max(0.6, (ring.r2 - ring.r) * 0.32)
    for (let i = 0; i < ring.n; i++) {
      const [x, y] = polar((ring.r + ring.r2) / 2, ring.phase + i * step)
      dots.push([x, y, fx(rad)])
    }
  } else {
    for (let i = 0; i < ring.n; i++) {
      const [x0, y0] = polar(ring.r, ring.phase + i * step)
      const [x1, y1] = polar(ring.r2, ring.phase + i * step)
      paths.push("M" + x0 + "," + y0 + "L" + x1 + "," + y1)
    }
  }
  return { paths, dots }
}
/** A paisley (boteh): a teardrop that curls at the top, with its echo lines and a spine of petals. */
function paisleyPaths() {
  const outline =
    "M0,-92C26,-92 52,-66 56,-30C60,8 36,40 20,66C10,82 -6,96 -26,92C-54,86 -62,56 -52,30C-44,8 -24,-4 -12,-24C-2,-42 -8,-68 -22,-80C-16,-88 -8,-92 0,-92Z"
  const echo = [0.8, 0.62].map((k) => "scale(" + k + ") translate(6,8)")
  const spine = "M-4,-70C10,-50 26,-22 22,12C18,40 2,60 -16,76"
  return { outline, echo, spine }
}
// #endregion

// #region stain
/** Hex → [r,g,b]. */
function hexRgb(hex: string) {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")
}
const FRESH = "#e8913d"
/**
 * Henna oxidises for ~48 hours: pumpkin orange on day one, then it darkens
 * fast and settles. Returns the stain colour `hours` after application.
 */
function stainAt(hours: number, finalHex: string) {
  const h = Math.min(48, Math.max(0, hours))
  const t = 1 - Math.pow(1 - h / 48, 2.2)
  const a = hexRgb(FRESH)
  const b = hexRgb(finalHex)
  return rgbHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
}
/** A fresh stain is translucent; it fills in as it darkens. */
function stainOpacity(hours: number) {
  const h = Math.min(48, Math.max(0, hours))
  return +(0.62 + 0.38 * (1 - Math.pow(1 - h / 48, 2))).toFixed(3)
}
// #endregion

// #region bag
function formatPrice(n: number, currency: string) {
  const s = Math.round(n).toString()
  // Indian grouping when the currency is rupees, thousands otherwise.
  if (currency === "₹" && s.length > 3) {
    const head = s.slice(0, -3)
    return currency + head.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + s.slice(-3)
  }
  return currency + s.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
function addToBag(bag: MehndiBagItem[], p: { id: string; name: string; price: number }) {
  const i = bag.findIndex((b) => b.id === p.id)
  if (i < 0) return [...bag, { id: p.id, name: p.name, price: p.price, qty: 1 }]
  return bag.map((b, j) => (j === i ? { ...b, qty: b.qty + 1 } : b))
}
function setQty(bag: MehndiBagItem[], id: string, qty: number) {
  if (qty <= 0) return bag.filter((b) => b.id !== id)
  return bag.map((b) => (b.id === id ? { ...b, qty } : b))
}
function bagTotal(bag: MehndiBagItem[]) {
  return bag.reduce((s, b) => s + b.price * b.qty, 0)
}
function bagCount(bag: MehndiBagItem[]) {
  return bag.reduce((s, b) => s + b.qty, 0)
}
// #endregion

// ---- ornaments ----------------------------------------------------------------------

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

const art = (v: string | MehndiArt | undefined, fallback: MehndiArt) => (!v ? fallback : typeof v === "string" ? { src: v, alt: fallback.alt, focus: fallback.focus } : { ...fallback, ...v })

function Mandala({ seed, size = 100, className = "", style, fill = true, strokeWidth = 0.55 }: { seed: number; size?: number; className?: string; style?: React.CSSProperties; fill?: boolean; strokeWidth?: number }) {
  const rings = React.useMemo(() => mandalaRings(seed, 98).map((ring) => ({ ring, ...ringMarks(ring) })), [seed])
  return (
    <svg className={"mat-mandala " + className} viewBox="-100 -100 200 200" width={size} height={size} aria-hidden="true" style={style}>
      {rings.map(({ ring, paths, dots }, i) => (
        <g key={i} className="mat-ring" style={{ "--i": i } as React.CSSProperties}>
          {paths.map((d, j) => (
            <path key={j} d={d} pathLength={1} fill={fill && ring.kind === "petal" ? "currentColor" : "none"} fillOpacity={fill ? 0.12 : 0} stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
          ))}
          {dots.map(([x, y, r], j) => (
            <circle key={"d" + j} cx={x} cy={y} r={r} fill="currentColor" />
          ))}
        </g>
      ))}
      <circle r="2.2" fill="currentColor" />
    </svg>
  )
}

function Paisley({ size = 120, className = "", style, flip = false }: { size?: number; className?: string; style?: React.CSSProperties; flip?: boolean }) {
  const { outline, echo, spine } = React.useMemo(paisleyPaths, [])
  return (
    <svg className={"mat-paisley " + className} viewBox="-70 -100 140 200" width={size} height={size * (200 / 140)} aria-hidden="true" style={style}>
      <g transform={flip ? "scale(-1,1)" : undefined} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path className="mat-draw" d={outline} pathLength={1} strokeWidth="1.6" fill="currentColor" fillOpacity="0.07" />
        {echo.map((t, i) => (
          <path key={i} className="mat-draw" d={outline} transform={t} pathLength={1} strokeWidth={1.1 - i * 0.3} />
        ))}
        <path className="mat-draw" d={spine} pathLength={1} strokeWidth="1" />
        {/* the bulb: a small rosette where the drop is widest */}
        <g transform="translate(4,34)">
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} className="mat-draw" d={petalPath(5, 19, (i * Math.PI) / 4, 0.4)} pathLength={1} strokeWidth="0.9" fill="currentColor" fillOpacity="0.1" />
          ))}
          {Array.from({ length: 8 }, (_, i) => {
            const [x, y] = polar(24, (i * Math.PI) / 4 + Math.PI / 8)
            return <circle key={"d" + i} className="mat-dot" cx={x} cy={y} r="1.5" fill="currentColor" stroke="none" />
          })}
          <circle className="mat-dot" r="2.6" fill="currentColor" stroke="none" />
        </g>
        {/* beads up the inside of the curl */}
        {Array.from({ length: 6 }, (_, i) => {
          const t = i / 5
          return <circle key={"s" + i} className="mat-dot" cx={fx(-30 + t * 16 + Math.sin(t * 3) * 4)} cy={fx(-4 - t * 62)} r={1.2 + (1 - t) * 1.2} fill="currentColor" stroke="none" />
        })}
      </g>
    </svg>
  )
}

function Rosette({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={"mat-rosette " + className} viewBox="-20 -20 40 40" width={size} height={size} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={petalPath(4, 18, (i * Math.PI) / 4, 0.42)} fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="0.9" />
      ))}
      <circle r="3.2" fill="currentColor" />
      {Array.from({ length: 8 }, (_, i) => {
        const [x, y] = polar(11, (i * Math.PI) / 4 + Math.PI / 8)
        return <circle key={"d" + i} cx={x} cy={y} r="1" fill="currentColor" />
      })}
    </svg>
  )
}

function Icon({ name }: { name: "search" | "user" | "bag" | "arrow" | "close" | "plus" | "minus" | "drop" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  switch (name) {
    case "search":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
      )
    case "user":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...common}>
          <circle cx="12" cy="8.5" r="4" />
          <path d="M4.5 20.5c1.4-3.6 4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
        </svg>
      )
    case "bag":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...common}>
          <path d="M5 8.5h14l-1 12H6z" />
          <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
        </svg>
      )
    case "arrow":
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...common}>
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      )
    case "close":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )
    case "plus":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case "minus":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" {...common}>
          <path d="M5 12h14" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor">
          <path d="M12 2.5c3 4.2 6 7.6 6 11.3a6 6 0 0 1-12 0c0-3.7 3-7.1 6-11.3z" />
        </svg>
      )
  }
}

/**
 * The lace trim: a row of scallops with a bead inside each, under the header
 * and along the drawer. The vertical one is a two-sided seam between the hero
 * panels.
 */
function Lace({ className = "", vertical = false }: { className?: string; vertical?: boolean }) {
  if (vertical) {
    const n = 120
    const right = Array.from({ length: n }, (_, i) => "M0," + i * 10 + "A5,5 0 0 1 0," + (i * 10 + 10)).join("")
    const left = Array.from({ length: n }, (_, i) => "M0," + i * 10 + "A5,5 0 0 0 0," + (i * 10 + 10)).join("")
    return (
      <svg className={"mat-lace is-vertical " + className} viewBox={"-7 0 14 " + n * 10} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d={right + left} fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="0.8" />
        {Array.from({ length: n }, (_, i) => (
          <circle key={i} cx="0" cy={i * 10 + 5} r="1.1" fill="currentColor" />
        ))}
      </svg>
    )
  }
  const n = 120
  const d = Array.from({ length: n }, (_, i) => "M" + i * 10 + ",0A5,5 0 0 1 " + (i * 10 + 10) + ",0").join("")
  return (
    <svg className={"mat-lace " + className} viewBox={"0 0 " + n * 10 + " 10"} preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="0.8" />
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={i * 10 + 5} cy="3.2" r="0.9" fill="currentColor" />
      ))}
    </svg>
  )
}

// ---- the stain study ---------------------------------------------------------------------

function StainStudy({ seed, shades, copy, labelFamily }: { seed: number; shades: MehndiShade[]; copy: { kicker: string; title: string; blurb: string }; labelFamily: string }) {
  const [shade, setShade] = React.useState(shades[0]?.id ?? "")
  const [hours, setHours] = React.useState(48)
  const current = shades.find((s) => s.id === shade) ?? shades[0]
  const color = stainAt(hours, current?.hex ?? "#5b191c")
  const opacity = stainOpacity(hours)
  const stage = hours < 6 ? "Fresh paste, just scraped off" : hours < 20 ? "Oxidising: pumpkin to rust" : hours < 40 ? "Deepening overnight" : "Settled: the final shade"
  return (
    <div className="mat-study">
      <div className="mat-study-copy">
        <p className="mat-eyebrow mat-rise">
          <Rosette size={18} /> {copy.kicker}
        </p>
        <h2 className="mat-h2 mat-rise">{copy.title}</h2>
        <p className="mat-lede mat-rise">{copy.blurb}</p>
        <div className="mat-shades mat-rise" role="radiogroup" aria-label="Final shade">
          {shades.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={s.id === current?.id} className={"mat-shade" + (s.id === current?.id ? " is-on" : "")} onClick={() => setShade(s.id)} style={{ "--sw": s.hex } as React.CSSProperties}>
              <i aria-hidden="true" />
              <span>{s.name}</span>
            </button>
          ))}
        </div>
        <label className="mat-hours mat-rise">
          <span className="mat-hours-row">
            <span>Hours since application</span>
            <b>
              {hours}
              <small>h</small>
            </b>
          </span>
          <input type="range" min={0} max={48} step={1} value={hours} onChange={(e) => setHours(+e.target.value)} />
          <span className="mat-hours-stage" aria-live="polite">
            {stage}
          </span>
        </label>
      </div>
      <div className="mat-skin mat-rise" style={{ "--stain": color, "--stain-a": opacity } as React.CSSProperties}>
        <div className="mat-skin-card">
          <Mandala seed={seed + 11} size={100} className="mat-skin-mandala" strokeWidth={0.9} />
          <div className="mat-skin-vine" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <Rosette key={i} size={14 + (i % 2) * 6} />
            ))}
          </div>
          <div className="mat-skin-chip" style={{ fontFamily: labelFamily }}>
            <i style={{ background: color }} aria-hidden="true" />
            <span>{current?.name}</span>
            <b>{color}</b>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- the template -------------------------------------------------------------------------

export default function MehndiAtelierTemplate({
  height = "100svh",
  preset = "heirloom",
  colors,
  theme = "auto",
  fontHref = FONT_HREF,
  brand,
  announcements = DEFAULT_ANNOUNCEMENTS,
  bandWords = DEFAULT_BAND,
  nav = DEFAULT_NAV,
  hero,
  feature,
  sellers,
  products = DEFAULT_PRODUCTS,
  collections = DEFAULT_COLLECTIONS,
  heritage,
  study,
  shades = DEFAULT_SHADES,
  images,
  currency = "₹",
  seed = 7,
  onAddToCart,
  onCheckout,
  onNavigate,
  className = "",
}: MehndiAtelierTemplateProps) {
  const pal = { ...PALETTES[preset], ...colors }
  const b = { ...DEFAULT_BRAND, ...brand }
  const h = { ...DEFAULT_HERO, ...hero }
  const f = { ...DEFAULT_FEATURE, ...feature }
  const s = { ...DEFAULT_SELLERS, ...sellers }
  const her = { ...DEFAULT_HERITAGE, ...heritage }
  const st = { ...DEFAULT_STUDY, ...study }
  const heroArt = art(images?.hero, DEFAULT_IMAGES.hero)
  const featureArt = art(images?.feature, DEFAULT_IMAGES.feature)

  const root = React.useRef(null as HTMLDivElement | null)
  const badgeRef = React.useRef(null as HTMLSpanElement | null)
  const [bag, setBag] = React.useState([] as MehndiBagItem[])
  const bagRef = React.useRef(bag)
  bagRef.current = bag
  const [drawer, setDrawer] = React.useState(false)
  const [menu, setMenu] = React.useState(false)
  const [toast, setToast] = React.useState(null as { id: number; text: string } | null)
  const toastTimer = React.useRef(0)

  const go = (target: string) => {
    setMenu(false)
    onNavigate?.(target)
  }

  const add = (p: MehndiProduct, from?: HTMLElement | null) => {
    const next = addToBag(bagRef.current, p)
    bagRef.current = next
    setBag(next)
    const item = next.find((i) => i.id === p.id)
    if (item) onAddToCart?.(item, next)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), text: p.name + " added to your bag" })
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const badge = badgeRef.current
    if (badge) gsap.fromTo(badge, { scale: 1.6, rotate: -12 }, { scale: 1, rotate: 0, duration: 0.7, ease: "elastic.out(1, 0.45)", overwrite: true })
    // a drop of henna flies from the button to the bag
    const r = root.current
    const bagBtn = r?.querySelector(".mat-bag-btn") as HTMLElement | null
    if (!from || !bagBtn || !r) return
    const a = from.getBoundingClientRect()
    const z = bagBtn.getBoundingClientRect()
    const rr = r.getBoundingClientRect()
    const drop = document.createElement("span")
    drop.className = "mat-flydrop"
    drop.style.left = a.left + a.width / 2 - rr.left + "px"
    drop.style.top = a.top + a.height / 2 - rr.top + "px"
    r.appendChild(drop)
    gsap
      .timeline({ onComplete: () => drop.remove() })
      .to(drop, { x: (z.left + z.width / 2 - rr.left) - (a.left + a.width / 2 - rr.left), y: (z.top + z.height / 2 - rr.top) - (a.top + a.height / 2 - rr.top), duration: 0.75, ease: "power2.in" }, 0)
      .to(drop, { scale: 0.3, duration: 0.75, ease: "power2.in" }, 0)
      .to(drop, { autoAlpha: 0, duration: 0.15 }, 0.65)
  }

  // the drawer: Escape closes, the body behind keeps its scroll
  React.useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [drawer])

  React.useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // ---- choreography ----
  useIso(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      const header = el.querySelector(".mat-header") as HTMLElement | null
      const bar = el.querySelector(".mat-progress i") as HTMLElement | null
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (bar) bar.style.transform = "scaleX(" + self.progress.toFixed(4) + ")"
          if (header) header.classList.toggle("is-tucked", self.direction === 1 && self.progress > 0.03 && self.scroll() > 160)
        },
      })

      const mm = gsap.matchMedia()
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 860px)" },
        (c) => {
          const { motion, wide } = c.conditions as { motion: boolean; wide: boolean }
          if (!motion) return

          // the hero prints itself: panels wipe, the mandala draws, the photo develops
          const intro = gsap.timeline({ defaults: { ease: "expo.out" } })
          intro
            .from(".mat-ribbon", { yPercent: -100, duration: 0.8 }, 0)
            .from(".mat-header-in > *", { y: -14, autoAlpha: 0, stagger: 0.06, duration: 0.8 }, 0.1)
            .fromTo(".mat-panel-left", { clipPath: wide ? "inset(0 100% 0 0)" : "inset(0 0 100% 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "expo.inOut" }, 0.15)
            .fromTo(".mat-panel-right", { clipPath: wide ? "inset(0 0 0 100%)" : "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0%)", duration: 1.4, ease: "expo.inOut" }, 0.3)
            .fromTo(".mat-hero-mandala .mat-ring", { "--draw": 1 }, { "--draw": 0, duration: 2.2, ease: "power2.inOut", stagger: 0.08 }, 0.5)
            .from(".mat-hero-mandala", { rotate: -40, scale: 0.8, transformOrigin: "50% 50%", duration: 2.6, ease: "expo.out" }, 0.4)
            .from(".mat-hero-title .mat-word", { yPercent: 110, rotate: 4, duration: 1.3, stagger: 0.12 }, 0.9)
            .from(".mat-panel-left .mat-rise", { y: 22, autoAlpha: 0, duration: 1, stagger: 0.08 }, 1.2)
            .fromTo(".mat-hero-photo", { scale: 1.18, filter: "sepia(0.85) saturate(0.55) brightness(0.85)" }, { scale: 1, filter: "sepia(0) saturate(1) brightness(1)", duration: 3.2, ease: "power2.out" }, 0.6)
            .from(".mat-panel-right .mat-rise", { y: 22, autoAlpha: 0, duration: 1, stagger: 0.08 }, 1.4)
            .from(".mat-hero .mat-corner", { scale: 0, transformOrigin: "50% 50%", duration: 1.2, ease: "back.out(1.6)", stagger: 0.08 }, 1.1)
            .fromTo(".mat-hero-split", { scaleY: 0 }, { scaleY: 1, transformOrigin: "50% 0%", duration: 1.2, ease: "power3.inOut" }, 0.8)
            .fromTo(".mat-develop i", { scaleX: 0 }, { scaleX: 1, transformOrigin: "0 50%", duration: 3.2, ease: "power2.out" }, 0.6)

          // hero: the mandala turns and the photo drifts as it leaves
          gsap
            .timeline({ scrollTrigger: { trigger: ".mat-hero", start: "top top", end: "bottom top", scrub: 0.6 } })
            .to(".mat-hero-mandala", { rotate: 50, ease: "none" }, 0)
            .to(".mat-hero-title", { yPercent: 28, autoAlpha: 0.25, ease: "none" }, 0)
            .to(".mat-hero-photo", { yPercent: 14, scale: 1.08, ease: "none" }, 0)
            .to(".mat-photo-label", { yPercent: -40, ease: "none" }, 0)

          // best sellers: heading, then the bento deals in
          gsap.from(".mat-sellers .mat-rise", { y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".mat-sellers", start: "top 75%", once: true } })
          gsap.from(".mat-bento > *", {
            y: 48,
            autoAlpha: 0,
            duration: 1.1,
            stagger: 0.09,
            ease: "expo.out",
            scrollTrigger: { trigger: ".mat-bento", start: "top 78%", once: true },
          })
          gsap.fromTo(".mat-feature-img", { scale: 1.16 }, { scale: 1, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: ".mat-bento", start: "top 78%", once: true } })
          gsap.to(".mat-feature-img", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".mat-bento", start: "top bottom", end: "bottom top", scrub: true } })

          // collection plates lift out of the page, each with its own rosette turning
          gsap.from(".mat-plate", {
            clipPath: "inset(100% 0% 0% 0%)",
            y: 30,
            duration: 1.1,
            stagger: 0.1,
            ease: "expo.out",
            scrollTrigger: { trigger: ".mat-plates", start: "top 76%", once: true },
          })
          gsap.from(".mat-plate .mat-plate-in > *", { y: 18, autoAlpha: 0, duration: 0.8, stagger: 0.05, ease: "power3.out", scrollTrigger: { trigger: ".mat-plates", start: "top 70%", once: true } })
          gsap.to(".mat-plate-mandala", { rotate: 90, ease: "none", scrollTrigger: { trigger: ".mat-plates", start: "top bottom", end: "bottom top", scrub: true } })

          // heritage: the paisleys draw on once the plate is in view, then drift
          gsap.fromTo(
            ".mat-heritage .mat-draw",
            { "--draw": 1 },
            { "--draw": 0, duration: 2.6, ease: "power2.inOut", stagger: 0.06, scrollTrigger: { trigger: ".mat-heritage", start: "top 72%", once: true } },
          )
          gsap.from(".mat-heritage .mat-dot", { scale: 0, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.05, ease: "back.out(2)", delay: 1.2, scrollTrigger: { trigger: ".mat-heritage", start: "top 72%", once: true } })
          gsap.from(".mat-heritage .mat-rise", { y: 26, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".mat-heritage", start: "top 70%", once: true } })
          gsap.to(".mat-heritage .mat-paisley", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".mat-heritage", start: "top bottom", end: "bottom top", scrub: true } })

          // the stain study
          gsap.from(".mat-studysec .mat-rise", { y: 26, autoAlpha: 0, duration: 1, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: ".mat-studysec", start: "top 72%", once: true } })
          gsap.fromTo(".mat-skin-mandala .mat-ring", { "--draw": 1 }, { "--draw": 0, duration: 2.4, ease: "power2.inOut", stagger: 0.07, scrollTrigger: { trigger: ".mat-studysec", start: "top 65%", once: true } })

          // footer rosette turns with the last of the scroll
          gsap.to(".mat-footer-mandala", { rotate: 60, ease: "none", scrollTrigger: { trigger: ".mat-footer", start: "top bottom", end: "bottom bottom", scrub: true } })
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  const count = bagCount(bag)
  const total = bagTotal(bag)
  const themeClass = theme === "dark" ? " mat-dark" : theme === "light" ? " mat-light" : ""
  const marquee = [...announcements, ...announcements]

  return (
    <div
      ref={root}
      className={"mat-root" + themeClass + (className ? " " + className : "")}
      style={
        {
          "--h": height,
          "--c-paper": pal.paper,
          "--c-ink": pal.ink,
          "--c-maroon": pal.maroon,
          "--c-olive": pal.olive,
          "--c-gold": pal.gold,
          "--c-sand": pal.sand,
          "--c-rose": pal.rose,
          "--display": DISPLAY,
          "--wordmark": WORDMARK,
          "--label": LABEL,
        } as React.CSSProperties
      }
    >
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* announcement ribbon */}
      <div className="mat-ribbon" aria-label="Announcements">
        <div className="mat-ribbon-track" aria-hidden="true">
          {marquee.map((t, i) => (
            <span key={i}>
              <Rosette size={10} /> {t}
            </span>
          ))}
        </div>
        <p className="mat-sr">{announcements.join(". ")}</p>
      </div>

      {/* header */}
      <header className="mat-header">
        <div className="mat-header-in">
          <button type="button" className="mat-burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <i />
            <i />
          </button>
          <button type="button" className="mat-brand" onClick={() => go("home")}>
            <Rosette size={26} className="mat-brand-rosette" />
            <span className="mat-brand-name">{b.name}</span>
            <span className="mat-brand-tag">{b.tagline}</span>
          </button>
          <nav className={"mat-nav" + (menu ? " is-open" : "")} aria-label="Primary">
            {nav.map((n) => (
              <a key={n.label} href={n.href ?? "#"} onClick={(e) => { if (!n.href) e.preventDefault(); go(n.label.toLowerCase()) }}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="mat-tools">
            <button type="button" aria-label="Search" onClick={() => go("search")}>
              <Icon name="search" />
            </button>
            <button type="button" aria-label="Account" onClick={() => go("account")}>
              <Icon name="user" />
            </button>
            <button type="button" className="mat-bag-btn" aria-label={"Bag, " + count + " item" + (count === 1 ? "" : "s")} onClick={() => setDrawer(true)}>
              <Icon name="bag" />
              <span ref={badgeRef} className={"mat-bag-badge" + (count ? " is-on" : "")} aria-hidden="true">
                {count}
              </span>
            </button>
          </div>
        </div>
        <Lace className="mat-header-lace" />
        <div className="mat-progress" aria-hidden="true">
          <i />
        </div>
      </header>

      {/* hero */}
      <section className="mat-hero" aria-label="Hero">
        <div className="mat-panel mat-panel-left">
          <Mandala seed={seed} size={100} className="mat-hero-mandala" />
          <Paisley className="mat-corner mat-corner-tl" size={60} />
          <Paisley className="mat-corner mat-corner-bl" size={60} flip />
          <div className="mat-hero-copy">
            <p className="mat-eyebrow mat-rise">
              <Rosette size={16} /> {h.kicker}
            </p>
            <h1 className="mat-hero-title" aria-label={h.title.join(" ")}>
              {h.title.map((w, i) => (
                <span key={i} className="mat-line" aria-hidden="true">
                  <span className="mat-word">{w}</span>
                </span>
              ))}
            </h1>
            <p className="mat-hero-sub mat-rise">{h.sub}</p>
            <div className="mat-hero-actions mat-rise">
              <button type="button" className="mat-btn mat-btn-gold" onClick={() => go("shop")}>
                {h.cta} <Icon name="arrow" />
              </button>
              <span className="mat-est">{b.est}</span>
            </div>
          </div>
        </div>
        <div className="mat-hero-split" aria-hidden="true">
          <Lace vertical />
        </div>
        <div className="mat-panel mat-panel-right">
          <img className="mat-hero-photo" src={heroArt.src} alt={heroArt.alt ?? ""} style={{ objectPosition: heroArt.focus }} decoding="async" />
          <div className="mat-photo-shade" aria-hidden="true" />
          <Paisley className="mat-corner mat-corner-tr" size={60} flip />
          <Paisley className="mat-corner mat-corner-br" size={60} />
          <div className="mat-photo-label">
            <p className="mat-eyebrow mat-rise">{h.photoKicker}</p>
            <h2 className="mat-photo-title mat-rise">{h.photoTitle}</h2>
            <button type="button" className="mat-btn mat-btn-ghost mat-rise" onClick={() => go("bridal")}>
              {h.photoCta} <Icon name="arrow" />
            </button>
          </div>
          <div className="mat-develop mat-rise" aria-hidden="true">
            <span>Stain developing</span>
            <i />
            <span>48h</span>
          </div>
        </div>
      </section>

      {/* ornament band */}
      <div className="mat-band" aria-hidden="true">
        <div className="mat-band-track">
          {Array.from({ length: Math.max(12, bandWords.length * 3) }, (_, i) => (
            <span key={i}>
              {bandWords[i % bandWords.length]} <Rosette size={12} />
            </span>
          ))}
        </div>
      </div>

      {/* best sellers */}
      <section className="mat-sellers" aria-labelledby="mat-sellers-title">
        <div className="mat-sec-head">
          <div>
            <p className="mat-eyebrow mat-rise">
              <Rosette size={16} /> {s.kicker}
            </p>
            <h2 id="mat-sellers-title" className="mat-h2 mat-rise">
              {s.title}
            </h2>
          </div>
          <p className="mat-lede mat-rise">{s.blurb}</p>
        </div>
        <div className="mat-bento">
          <article className="mat-feature">
            <img className="mat-feature-img" src={featureArt.src} alt={featureArt.alt ?? ""} style={{ objectPosition: featureArt.focus }} loading="lazy" decoding="async" />
            <div className="mat-feature-shade" aria-hidden="true" />
            <div className="mat-feature-copy">
              <p className="mat-eyebrow">{f.kicker}</p>
              <h3>{f.title}</h3>
              <p>{f.blurb}</p>
              <button type="button" className="mat-btn mat-btn-gold" onClick={() => go("trousseau")}>
                {f.cta} <Icon name="arrow" />
              </button>
            </div>
          </article>
          {products.map((p, i) => {
            const a = art(p.image, { src: "", alt: p.name })
            return (
              <article key={p.id} className="mat-product" style={{ "--i": i } as React.CSSProperties}>
                <div className="mat-product-media">
                  <img src={a.src} alt={a.alt ?? p.name} style={{ objectPosition: a.focus }} loading="lazy" decoding="async" />
                  {p.badge && <span className="mat-badge">{p.badge}</span>}
                  <Mandala seed={seed + 3 + i} size={100} className="mat-product-mandala" fill={false} strokeWidth={0.8} />
                  <button type="button" className="mat-quick" onClick={(e) => add(p, e.currentTarget)}>
                    <Icon name="drop" /> Add to bag
                  </button>
                </div>
                <div className="mat-product-row">
                  <div>
                    <h3>{p.name}</h3>
                    {p.note && <p>{p.note}</p>}
                  </div>
                  <b>{formatPrice(p.price, currency)}</b>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* collections */}
      <section className="mat-plates" aria-label="Collections">
        {collections.map((c, i) => (
          <article key={c.id} className={"mat-plate is-" + (c.tone ?? "sand")}>
            <Mandala seed={seed + 20 + i} size={100} className="mat-plate-mandala" fill={false} strokeWidth={0.6} />
            <div className="mat-plate-in">
              <span className="mat-plate-n">0{i + 1}</span>
              <h3>{c.title}</h3>
              <p>{c.blurb}</p>
              <a href={c.href ?? "#"} className="mat-btn mat-btn-small" onClick={(e) => { if (!c.href) e.preventDefault(); go(c.id) }}>
                {c.cta ?? "Explore"} <Icon name="arrow" />
              </a>
            </div>
          </article>
        ))}
      </section>

      {/* heritage */}
      <section className="mat-heritage" aria-labelledby="mat-heritage-title">
        <Paisley className="mat-heritage-paisley is-left" size={230} />
        <Paisley className="mat-heritage-paisley is-right" size={230} flip />
        <div className="mat-heritage-in">
          <p className="mat-eyebrow mat-rise is-center">
            <Rosette size={16} /> {her.kicker}
          </p>
          <h2 id="mat-heritage-title" className="mat-h2 mat-rise">
            {her.title}
          </h2>
          {her.body.map((para, i) => (
            <p key={i} className="mat-heritage-p mat-rise">
              {para}
            </p>
          ))}
          <button type="button" className="mat-btn mat-btn-maroon mat-rise" onClick={() => go("story")}>
            {her.cta} <Icon name="arrow" />
          </button>
          <div className="mat-heritage-foot mat-rise" aria-hidden="true">
            <span className="mat-rule" />
            <Rosette size={30} />
            <span className="mat-rule" />
          </div>
        </div>
      </section>

      {/* stain study */}
      <section className="mat-studysec" aria-label={st.title}>
        <StainStudy seed={seed} shades={shades} copy={st} labelFamily={LABEL} />
      </section>

      {/* footer */}
      <footer className="mat-footer">
        <Mandala seed={seed + 40} size={100} className="mat-footer-mandala" fill={false} strokeWidth={0.5} />
        <div className="mat-footer-in">
          <div className="mat-footer-brand">
            <Rosette size={34} />
            <p className="mat-footer-name">{b.name}</p>
            <p className="mat-footer-tag">{b.tagline}</p>
            <p className="mat-footer-est">{b.est}</p>
          </div>
          <div className="mat-footer-cols">
            {[
              { title: "Shop", links: ["Powder", "Cones", "Tattoos", "Kits", "Gift cards"] },
              { title: "Atelier", links: ["Bridal booking", "Find an artist", "Workshops", "Journal"] },
              { title: "Help", links: ["Shipping", "Stain care", "Returns", "Contact"] },
            ].map((col) => (
              <div key={col.title}>
                <p>{col.title}</p>
                {col.links.map((l) => (
                  <a key={l} href="#" onClick={(e) => { e.preventDefault(); go(l.toLowerCase()) }}>
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <form className="mat-news" onSubmit={(e) => { e.preventDefault(); go("newsletter") }}>
            <p>Letters from the atelier</p>
            <div className="mat-news-row">
              <input type="email" placeholder="your@email.com" aria-label="Email address" required />
              <button type="submit" className="mat-btn mat-btn-gold">
                Join <Icon name="arrow" />
              </button>
            </div>
            <small>One letter a month: the season's leaf, new motifs, early bridal dates.</small>
          </form>
        </div>
        <div className="mat-footer-bottom">
          <Lace className="mat-footer-lace" />
          <span>© {new Date().getFullYear()} {b.name}. Grown in Sojat, rolled in Jaipur.</span>
          <span>Henna is a plant. Patch-test first. Never black henna.</span>
        </div>
      </footer>

      {/* toast */}
      <div className={"mat-toast" + (toast ? " is-on" : "")} role="status" aria-live="polite">
        {toast && (
          <>
            <Icon name="drop" /> {toast.text}
          </>
        )}
      </div>

      {/* bag drawer */}
      <div className={"mat-drawer-wrap" + (drawer ? " is-open" : "")} aria-hidden={!drawer}>
        <button type="button" className="mat-scrim" aria-label="Close bag" tabIndex={drawer ? 0 : -1} onClick={() => setDrawer(false)} />
        <aside className="mat-drawer" role="dialog" aria-modal="true" aria-label="Your bag">
          <div className="mat-drawer-head">
            <p>
              Your bag <span>{count}</span>
            </p>
            <button type="button" aria-label="Close" tabIndex={drawer ? 0 : -1} onClick={() => setDrawer(false)}>
              <Icon name="close" />
            </button>
          </div>
          <Lace className="mat-drawer-lace" />
          {bag.length === 0 ? (
            <div className="mat-drawer-empty">
              <Mandala seed={seed + 5} size={120} fill={false} strokeWidth={0.7} />
              <p>Nothing here yet. The cones go first.</p>
            </div>
          ) : (
            <ul className="mat-drawer-list">
              {bag.map((item) => (
                <li key={item.id}>
                  <div>
                    <p>{item.name}</p>
                    <small>{formatPrice(item.price, currency)} each</small>
                  </div>
                  <div className="mat-qty">
                    <button type="button" aria-label={"One fewer " + item.name} tabIndex={drawer ? 0 : -1} onClick={() => setBag((prev) => setQty(prev, item.id, item.qty - 1))}>
                      <Icon name="minus" />
                    </button>
                    <span>{item.qty}</span>
                    <button type="button" aria-label={"One more " + item.name} tabIndex={drawer ? 0 : -1} onClick={() => setBag((prev) => setQty(prev, item.id, item.qty + 1))}>
                      <Icon name="plus" />
                    </button>
                  </div>
                  <b>{formatPrice(item.price * item.qty, currency)}</b>
                </li>
              ))}
            </ul>
          )}
          <div className="mat-drawer-foot">
            <div className="mat-drawer-total">
              <span>Subtotal</span>
              <b>{formatPrice(total, currency)}</b>
            </div>
            <button type="button" className="mat-btn mat-btn-gold mat-btn-wide" disabled={!bag.length} tabIndex={drawer ? 0 : -1} onClick={() => onCheckout?.(bag, total)}>
              Checkout <Icon name="arrow" />
            </button>
            <small>Shipping and stain-care notes at the next step.</small>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ---- styles ---------------------------------------------------------------------------------

const CSS = `
.mat-root{--paper:var(--c-paper);--ink:var(--c-ink);--maroon:var(--c-maroon);--olive:var(--c-olive);--gold:var(--c-gold);--sand:var(--c-sand);--rose:var(--c-rose);--plum:color-mix(in oklab,var(--c-maroon) 70%,#1a0a12);--cream:color-mix(in oklab,var(--c-paper) 70%,#ffffff);--soft:color-mix(in oklab,var(--ink) 68%,var(--paper));--line:color-mix(in oklab,var(--gold) 45%,transparent);--on-dark:color-mix(in oklab,var(--c-paper) 92%,#ffffff);position:relative;isolation:isolate;width:100%;background:var(--paper);color:var(--ink);font-family:var(--label);container-type:inline-size;overflow-x:clip;-webkit-font-smoothing:antialiased}
.mat-root.mat-dark,:where(.dark) .mat-root:not(.mat-light){--paper:color-mix(in oklab,var(--c-ink) 86%,#000);--ink:var(--c-paper);--sand:color-mix(in oklab,var(--c-ink) 70%,var(--c-sand));--rose:color-mix(in oklab,var(--c-ink) 55%,var(--c-rose));--cream:color-mix(in oklab,var(--c-ink) 80%,#000);--soft:color-mix(in oklab,var(--c-paper) 70%,var(--c-ink));--line:color-mix(in oklab,var(--gold) 40%,transparent)}
:where(.mat-root) button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
:where(.mat-root) :where(p,h1,h2,h3,ul){margin:0}
:where(.mat-root) ul{padding:0;list-style:none}
:where(.mat-root) a{color:inherit;text-decoration:none}
.mat-root button:focus-visible,.mat-root a:focus-visible,.mat-root input:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.mat-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.mat-mandala{display:block;color:var(--gold);overflow:visible}
.mat-ring path{stroke-dasharray:1;stroke-dashoffset:var(--draw,0)}
.mat-paisley{display:block;color:var(--gold);overflow:visible}
.mat-paisley .mat-draw{stroke-dasharray:1;stroke-dashoffset:var(--draw,0)}
.mat-rosette{display:inline-block;vertical-align:middle;color:var(--gold);flex:none}
.mat-lace{display:block;width:100%;height:10px;color:var(--gold)}
.mat-eyebrow{display:flex;align-items:center;gap:8px;font:500 11px/1.3 var(--label);letter-spacing:.22em;text-transform:uppercase;color:var(--gold)}
.mat-eyebrow.is-center{justify-content:center}
.mat-h2{font-family:var(--display);font-weight:500;font-size:clamp(40px,5.6cqw,74px);line-height:1;letter-spacing:-.01em;margin-top:14px}
.mat-lede{font:400 16px/1.65 var(--label);max-width:44ch;color:var(--soft)}
.mat-btn{display:inline-flex;align-items:center;gap:10px;height:46px;padding:0 22px;border-radius:999px;font:500 13px/1 var(--label);letter-spacing:.1em;text-transform:uppercase;border:1px solid transparent;transition:transform .25s cubic-bezier(.2,.8,.2,1),background .25s,color .25s,border-color .25s,box-shadow .25s;white-space:nowrap}
.mat-btn svg{transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.mat-btn:hover svg{transform:translateX(4px)}
.mat-btn:active{transform:scale(.97)}
.mat-btn:disabled{opacity:.45;cursor:not-allowed}
.mat-btn-gold{background:var(--gold);color:#2a1308;border-color:var(--gold)}
.mat-btn-gold:hover{background:color-mix(in oklab,var(--gold) 82%,#fff);box-shadow:0 10px 30px -12px color-mix(in oklab,var(--gold) 70%,transparent)}
.mat-btn-ghost{border-color:color-mix(in oklab,var(--on-dark) 55%,transparent);color:var(--on-dark)}
.mat-btn-ghost:hover{background:var(--on-dark);color:var(--olive);border-color:var(--on-dark)}
.mat-btn-maroon{background:var(--maroon);color:var(--on-dark);border-color:var(--maroon)}
.mat-btn-maroon:hover{background:var(--plum)}
.mat-btn-small{height:38px;padding:0 16px;font-size:11px;border-color:currentColor;background:transparent}
.mat-btn-small:hover{background:currentColor}
.mat-btn-small:hover svg{color:var(--sand)}
.mat-btn-wide{width:100%;justify-content:center}

/* ribbon */
.mat-ribbon{position:relative;z-index:31;height:32px;overflow:hidden;background:var(--maroon);color:var(--gold);font:500 11px/32px var(--label);letter-spacing:.14em;text-transform:uppercase}
.mat-ribbon-track{display:flex;width:max-content;gap:56px;padding-left:56px;animation:mat-marquee 46s linear infinite}
.mat-ribbon:hover .mat-ribbon-track{animation-play-state:paused}
.mat-ribbon-track span{display:inline-flex;align-items:center;gap:10px;white-space:nowrap}
@keyframes mat-marquee{to{transform:translateX(-50%)}}

/* header */
.mat-header{position:sticky;top:0;z-index:30;background:color-mix(in oklab,var(--paper) 90%,transparent);backdrop-filter:blur(10px) saturate(1.2);-webkit-backdrop-filter:blur(10px) saturate(1.2);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.mat-header.is-tucked{transform:translateY(-100%)}
.mat-header-in{display:flex;align-items:center;gap:28px;height:76px;padding:0 clamp(16px,3.2cqw,44px)}
.mat-header-lace{height:9px;opacity:.9}
.mat-progress{position:absolute;left:0;right:0;bottom:-2px;height:2px;overflow:hidden}
.mat-progress i{display:block;height:100%;background:var(--gold);transform:scaleX(0);transform-origin:0 50%}
.mat-brand{display:flex;align-items:center;gap:12px;flex:none}
.mat-brand-name{font-family:var(--wordmark);font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:var(--maroon)}
.mat-root.mat-dark .mat-brand-name,:where(.dark) .mat-root:not(.mat-light) .mat-brand-name{color:var(--gold)}
.mat-brand-tag{font:500 10px/1.2 var(--label);letter-spacing:.18em;text-transform:uppercase;color:var(--soft);padding-left:12px;border-left:1px solid var(--line)}
.mat-nav{display:flex;gap:2px;margin-left:auto}
.mat-nav a{position:relative;padding:10px 12px;font:500 12px/1 var(--label);letter-spacing:.16em;text-transform:uppercase;color:var(--ink);transition:color .2s}
.mat-nav a::after{content:"";position:absolute;left:12px;right:12px;bottom:4px;height:1px;background:var(--gold);transform:scaleX(0);transform-origin:0 50%;transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.mat-nav a:hover{color:var(--maroon)}
.mat-root.mat-dark .mat-nav a:hover,:where(.dark) .mat-root:not(.mat-light) .mat-nav a:hover{color:var(--gold)}
.mat-nav a:hover::after{transform:scaleX(1)}
.mat-tools{display:flex;gap:4px;flex:none}
.mat-tools button{position:relative;display:grid;place-items:center;width:40px;height:40px;border-radius:999px;transition:background .2s,color .2s}
.mat-tools button:hover{background:var(--maroon);color:var(--on-dark)}
.mat-bag-badge{position:absolute;top:2px;right:2px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:var(--gold);color:#2a1308;font:600 10px/18px var(--label);transform:scale(0);transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.mat-bag-badge.is-on{transform:scale(1)}
.mat-burger{display:none;width:40px;height:40px;place-items:center;align-content:center;gap:6px;flex:none}
.mat-burger i{display:block;width:20px;height:1.5px;background:currentColor;transition:transform .3s}
.mat-burger[aria-expanded=true] i:first-child{transform:translateY(3.75px) rotate(45deg)}
.mat-burger[aria-expanded=true] i:last-child{transform:translateY(-3.75px) rotate(-45deg)}

/* hero */
.mat-hero{position:relative;display:grid;grid-template-columns:1fr 1fr;height:var(--h);min-height:640px;overflow:hidden}
.mat-panel{position:relative;overflow:hidden;clip-path:inset(0 0 0 0)}
.mat-panel-left{background:radial-gradient(120% 90% at 100% 100%,color-mix(in oklab,var(--maroon) 70%,#000) 0%,var(--maroon) 55%,color-mix(in oklab,var(--maroon) 85%,var(--gold)) 100%);color:var(--on-dark)}
.mat-panel-right{background:radial-gradient(100% 100% at 0% 0%,color-mix(in oklab,var(--olive) 80%,#000) 0%,var(--olive) 60%,color-mix(in oklab,var(--olive) 80%,var(--gold)) 100%);color:var(--on-dark)}
.mat-hero-mandala{position:absolute;left:-18%;bottom:-24%;width:92%;height:auto;aspect-ratio:1;opacity:.55;color:var(--gold);will-change:transform}
.mat-hero-mandala .mat-ring:nth-child(odd){opacity:.9}
.mat-corner{position:absolute;opacity:.75;pointer-events:none}
.mat-corner-tl{left:18px;top:18px;transform:rotate(-35deg)}
.mat-corner-bl{left:18px;bottom:18px;transform:rotate(-145deg)}
.mat-corner-tr{right:18px;top:18px;transform:rotate(35deg)}
.mat-corner-br{right:18px;bottom:18px;transform:rotate(145deg)}
.mat-hero-copy{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;height:100%;padding:clamp(28px,6cqw,96px) clamp(24px,5cqw,80px);gap:22px}
.mat-hero-title{font-family:var(--display);font-weight:500;font-size:clamp(64px,9.4cqw,152px);line-height:.9;letter-spacing:-.015em;margin:4px 0 2px}
.mat-line{display:block;overflow:hidden;padding-bottom:.06em;margin-bottom:-.06em}
.mat-word{display:inline-block;will-change:transform}
.mat-line:nth-child(2) .mat-word{font-style:italic;font-weight:400;color:var(--gold);padding-left:.35em}
.mat-hero-sub{font:400 clamp(15px,1.25cqw,18px)/1.6 var(--label);max-width:38ch;color:color-mix(in oklab,var(--on-dark) 78%,transparent)}
.mat-hero-actions{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.mat-est{font:500 11px/1 var(--label);letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.mat-hero-split{position:absolute;left:50%;top:0;bottom:0;width:14px;margin-left:-7px;z-index:3;color:var(--gold);pointer-events:none}
.mat-lace.is-vertical{position:absolute;inset:0;width:100%;height:100%}
.mat-hero-photo{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;will-change:transform,filter}
.mat-photo-shade{position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in oklab,var(--olive) 35%,transparent) 0%,transparent 35%,transparent 55%,color-mix(in oklab,var(--olive) 88%,#000) 100%)}
.mat-photo-label{position:absolute;left:clamp(24px,5cqw,80px);right:clamp(24px,5cqw,80px);bottom:clamp(28px,6cqw,84px);z-index:2;display:flex;flex-direction:column;align-items:flex-start;gap:14px}
.mat-photo-title{font-family:var(--display);font-weight:500;font-size:clamp(38px,4.8cqw,72px);line-height:.95;letter-spacing:-.01em}
.mat-develop{position:absolute;right:clamp(24px,5cqw,80px);top:28px;z-index:2;display:flex;align-items:center;gap:10px;font:500 10px/1 var(--label);letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.mat-develop i{display:block;width:120px;height:1px;background:linear-gradient(90deg,#e8913d,var(--gold));transform-origin:0 50%}

/* band */
.mat-band{overflow:hidden;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--cream);color:var(--maroon)}
.mat-root.mat-dark .mat-band,:where(.dark) .mat-root:not(.mat-light) .mat-band{color:var(--gold)}
.mat-band-track{display:flex;width:max-content;gap:40px;padding:14px 40px 14px 0;font-family:var(--display);font-size:20px;font-style:italic;letter-spacing:.04em;animation:mat-marquee 28s linear infinite}
.mat-band-track span{display:inline-flex;align-items:center;gap:40px;white-space:nowrap}

/* best sellers */
.mat-sellers{padding:clamp(56px,8cqw,120px) clamp(16px,3.2cqw,44px)}
.mat-sec-head{display:grid;grid-template-columns:1fr auto;align-items:end;gap:24px 48px;margin-bottom:clamp(28px,4cqw,48px)}
.mat-sec-head .mat-lede{max-width:38ch;padding-bottom:6px}
.mat-bento{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(240px,auto);gap:18px}
.mat-feature{position:relative;grid-column:span 2;grid-row:span 2;overflow:hidden;border-radius:6px;background:var(--maroon);color:var(--on-dark);min-height:420px}
.mat-feature-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;will-change:transform}
.mat-feature-shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 25%,color-mix(in oklab,var(--maroon) 92%,#000) 100%)}
.mat-feature-copy{position:absolute;left:0;right:0;bottom:0;padding:clamp(22px,3cqw,40px);display:flex;flex-direction:column;align-items:flex-start;gap:12px}
.mat-feature-copy h3{font-family:var(--display);font-weight:500;font-size:clamp(32px,3.6cqw,52px);line-height:1}
.mat-feature-copy p:not(.mat-eyebrow){font:400 15px/1.6 var(--label);max-width:40ch;color:color-mix(in oklab,var(--on-dark) 80%,transparent)}
.mat-product{display:flex;flex-direction:column;gap:12px}
.mat-product-media{position:relative;overflow:hidden;border-radius:6px;aspect-ratio:4/4.6;background:var(--sand)}
.mat-product-media img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;transition:transform .9s cubic-bezier(.2,.8,.2,1),filter .6s}
.mat-product:hover .mat-product-media img{transform:scale(1.06)}
.mat-product-mandala{position:absolute;right:-22%;bottom:-22%;width:70%;height:auto;aspect-ratio:1;opacity:0;color:var(--on-dark);mix-blend-mode:screen;transform:rotate(-30deg) scale(.7);transition:opacity .6s,transform 1.2s cubic-bezier(.2,.8,.2,1);pointer-events:none}
.mat-product:hover .mat-product-mandala{opacity:.6;transform:rotate(0) scale(1)}
.mat-badge{position:absolute;left:12px;top:12px;padding:6px 10px;border-radius:999px;background:color-mix(in oklab,var(--paper) 90%,transparent);color:var(--maroon);font:600 10px/1 var(--label);letter-spacing:.16em;text-transform:uppercase;backdrop-filter:blur(6px)}
.mat-quick{position:absolute;left:12px;right:12px;bottom:12px;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;border-radius:999px;background:var(--gold);color:#2a1308;font:500 12px/1 var(--label);letter-spacing:.12em;text-transform:uppercase;transform:translateY(calc(100% + 16px));transition:transform .45s cubic-bezier(.2,.8,.2,1),background .2s}
.mat-product:hover .mat-quick,.mat-quick:focus-visible{transform:translateY(0)}
.mat-quick:hover{background:color-mix(in oklab,var(--gold) 82%,#fff)}
.mat-product-row{display:flex;justify-content:space-between;gap:14px;align-items:baseline}
.mat-product-row h3{font-family:var(--display);font-weight:600;font-size:21px;line-height:1.1}
.mat-product-row p{font:400 12px/1.4 var(--label);color:var(--soft);margin-top:4px}
.mat-product-row b{font:500 15px/1 var(--label);color:var(--maroon);white-space:nowrap}
.mat-root.mat-dark .mat-product-row b,:where(.dark) .mat-root:not(.mat-light) .mat-product-row b{color:var(--gold)}
.mat-flydrop{position:absolute;z-index:50;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--maroon);pointer-events:none;box-shadow:0 2px 8px color-mix(in oklab,var(--maroon) 50%,transparent)}

/* plates */
.mat-plates{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;padding:0 clamp(16px,3.2cqw,44px) clamp(56px,8cqw,120px)}
.mat-plate{position:relative;overflow:hidden;border-radius:6px;min-height:380px;padding:clamp(22px,2.6cqw,34px);display:flex;clip-path:inset(0 0 0 0);transition:transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .5s}
.mat-plate:hover{transform:translateY(-6px);box-shadow:0 30px 60px -30px color-mix(in oklab,var(--maroon) 45%,transparent)}
.mat-plate.is-sand{background:var(--sand);color:var(--maroon)}
.mat-plate.is-rose{background:var(--rose);color:var(--maroon)}
.mat-plate.is-maroon{background:var(--maroon);color:var(--on-dark)}
.mat-plate.is-plum{background:var(--plum);color:var(--on-dark)}
.mat-root.mat-dark .mat-plate.is-sand,.mat-root.mat-dark .mat-plate.is-rose,:where(.dark) .mat-root:not(.mat-light) .mat-plate.is-sand,:where(.dark) .mat-root:not(.mat-light) .mat-plate.is-rose{color:var(--c-paper)}
.mat-root.mat-dark .mat-plate.is-sand .mat-plate-mandala,.mat-root.mat-dark .mat-plate.is-rose .mat-plate-mandala,:where(.dark) .mat-root:not(.mat-light) .mat-plate.is-sand .mat-plate-mandala,:where(.dark) .mat-root:not(.mat-light) .mat-plate.is-rose .mat-plate-mandala{color:var(--gold);opacity:.26}
.mat-root.mat-dark .mat-plate.is-sand .mat-btn-small:hover,.mat-root.mat-dark .mat-plate.is-rose .mat-btn-small:hover,:where(.dark) .mat-root:not(.mat-light) .mat-plate.is-sand .mat-btn-small:hover,:where(.dark) .mat-root:not(.mat-light) .mat-plate.is-rose .mat-btn-small:hover{color:var(--c-ink)}
.mat-root.mat-dark .mat-plate.is-sand .mat-btn-small:hover svg,.mat-root.mat-dark .mat-plate.is-rose .mat-btn-small:hover svg,:where(.dark) .mat-root:not(.mat-light) .mat-plate.is-sand .mat-btn-small:hover svg,:where(.dark) .mat-root:not(.mat-light) .mat-plate.is-rose .mat-btn-small:hover svg{color:var(--c-ink)}
.mat-plate-mandala{position:absolute;right:-30%;top:-30%;width:95%;height:auto;aspect-ratio:1;opacity:.28;color:currentColor;pointer-events:none;will-change:transform}
.mat-plate.is-sand .mat-plate-mandala,.mat-plate.is-rose .mat-plate-mandala{color:var(--maroon);opacity:.16}
.mat-plate.is-maroon .mat-plate-mandala,.mat-plate.is-plum .mat-plate-mandala{color:var(--gold)}
.mat-plate-in{position:relative;z-index:1;display:flex;flex-direction:column;align-items:flex-start;gap:14px;margin-top:auto;width:100%}
.mat-plate-n{font:500 11px/1 var(--label);letter-spacing:.22em;color:var(--gold);margin-bottom:auto;padding-bottom:40px}
.mat-plate.is-sand .mat-plate-n,.mat-plate.is-rose .mat-plate-n{color:color-mix(in oklab,var(--maroon) 60%,var(--gold))}
.mat-plate h3{font-family:var(--display);font-weight:500;font-size:clamp(30px,2.9cqw,42px);line-height:1}
.mat-plate p{font:400 14px/1.6 var(--label);opacity:.85;max-width:30ch}
.mat-plate .mat-btn-small{margin-top:6px}
.mat-plate.is-sand .mat-btn-small:hover,.mat-plate.is-rose .mat-btn-small:hover{color:var(--sand)}
.mat-plate.is-sand .mat-btn-small:hover svg,.mat-plate.is-rose .mat-btn-small:hover svg{color:var(--sand)}
.mat-plate.is-maroon .mat-btn-small:hover,.mat-plate.is-plum .mat-btn-small:hover{color:var(--maroon)}
.mat-plate.is-maroon .mat-btn-small:hover svg,.mat-plate.is-plum .mat-btn-small:hover svg{color:var(--maroon)}

/* heritage */
.mat-heritage{position:relative;overflow:hidden;padding:clamp(72px,10cqw,150px) clamp(16px,3.2cqw,44px);background:var(--cream);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.mat-heritage-paisley{position:absolute;top:50%;opacity:.85;pointer-events:none;will-change:transform}
.mat-heritage-paisley.is-left{left:-2cqw;transform:translateY(-50%) rotate(-18deg)}
.mat-heritage-paisley.is-right{right:-2cqw;transform:translateY(-50%) rotate(18deg)}
.mat-heritage-in{position:relative;z-index:1;max-width:62ch;margin:0 auto;text-align:center;display:flex;flex-direction:column;align-items:center;gap:18px}
.mat-heritage .mat-h2{color:var(--maroon)}
.mat-root.mat-dark .mat-heritage .mat-h2,:where(.dark) .mat-root:not(.mat-light) .mat-heritage .mat-h2{color:var(--gold)}
.mat-heritage-p{font:400 16px/1.75 var(--label);color:var(--soft)}
.mat-heritage-p:first-of-type{font-family:var(--display);font-size:21px;line-height:1.5;color:var(--ink)}
.mat-heritage .mat-btn{margin-top:8px}
.mat-heritage-foot{display:flex;align-items:center;gap:18px;width:min(320px,100%);margin-top:22px}
.mat-rule{flex:1;height:1px;background:var(--line)}

/* stain study */
.mat-studysec{padding:clamp(56px,8cqw,120px) clamp(16px,3.2cqw,44px)}
.mat-study{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(28px,5cqw,72px);align-items:center}
.mat-study-copy{display:flex;flex-direction:column;gap:18px;align-items:flex-start}
.mat-shades{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
.mat-shade{display:inline-flex;align-items:center;gap:10px;height:42px;padding:0 16px 0 8px;border-radius:999px;border:1px solid var(--line);font:500 12px/1 var(--label);letter-spacing:.08em;transition:border-color .25s,background .25s,transform .25s}
.mat-shade i{display:block;width:26px;height:26px;border-radius:50%;background:var(--sw);box-shadow:inset 0 0 0 2px color-mix(in oklab,var(--paper) 60%,transparent)}
.mat-shade:hover{border-color:var(--gold);transform:translateY(-1px)}
.mat-shade.is-on{border-color:var(--maroon);background:var(--maroon);color:var(--on-dark)}
.mat-root.mat-dark .mat-shade.is-on,:where(.dark) .mat-root:not(.mat-light) .mat-shade.is-on{border-color:var(--gold);background:var(--gold);color:#2a1308}
.mat-hours{display:flex;flex-direction:column;gap:10px;width:min(420px,100%);margin-top:8px}
.mat-hours-row{display:flex;justify-content:space-between;align-items:baseline;font:500 11px/1 var(--label);letter-spacing:.18em;text-transform:uppercase;color:var(--soft)}
.mat-hours-row b{font-family:var(--display);font-weight:600;font-size:34px;letter-spacing:0;color:var(--maroon)}
.mat-root.mat-dark .mat-hours-row b,:where(.dark) .mat-root:not(.mat-light) .mat-hours-row b{color:var(--gold)}
.mat-hours-row small{font:500 12px/1 var(--label);margin-left:2px;color:var(--gold)}
.mat-hours input{-webkit-appearance:none;appearance:none;width:100%;height:28px;margin:0;background:transparent;cursor:pointer}
.mat-hours input::-webkit-slider-runnable-track{height:3px;border-radius:2px;background:linear-gradient(90deg,#e8913d 0%,var(--maroon) 100%)}
.mat-hours input::-moz-range-track{height:3px;border-radius:2px;background:linear-gradient(90deg,#e8913d 0%,var(--maroon) 100%)}
.mat-hours input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;margin-top:-9.5px;border-radius:50%;background:var(--paper);border:2px solid var(--gold);box-shadow:0 2px 10px color-mix(in oklab,var(--ink) 25%,transparent)}
.mat-hours input::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--paper);border:2px solid var(--gold)}
.mat-hours-stage{font-family:var(--display);font-style:italic;font-size:17px;color:var(--soft)}
.mat-skin{display:grid;place-items:center}
.mat-skin-card{position:relative;width:min(100%,440px);aspect-ratio:1;border-radius:8px;overflow:hidden;background:radial-gradient(120% 100% at 30% 20%,#f4d9c0 0%,#e4bd9c 55%,#d5a782 100%);box-shadow:0 40px 80px -40px color-mix(in oklab,var(--maroon) 50%,transparent),inset 0 0 0 1px color-mix(in oklab,var(--maroon) 15%,transparent);display:grid;place-items:center}
.mat-skin-card::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 50%,transparent 60%,color-mix(in oklab,#9a6a4c 30%,transparent) 100%);pointer-events:none}
.mat-skin-mandala{width:72%;height:auto;aspect-ratio:1;color:var(--stain);opacity:var(--stain-a);transition:color .35s,opacity .35s;filter:drop-shadow(0 0 .4px var(--stain))}
.mat-skin-vine{position:absolute;left:18px;top:18px;display:flex;flex-direction:column;gap:14px;color:var(--stain);opacity:var(--stain-a);transition:color .35s,opacity .35s}
.mat-skin-chip{position:absolute;right:14px;bottom:14px;display:flex;align-items:center;gap:10px;padding:8px 12px 8px 8px;border-radius:999px;background:color-mix(in oklab,var(--c-paper) 92%,#fff);color:var(--c-ink);font-size:12px;letter-spacing:.06em;box-shadow:0 10px 30px -14px rgba(0,0,0,.4)}
.mat-skin-chip i{display:block;width:22px;height:22px;border-radius:50%;transition:background .35s}
.mat-skin-chip b{font-weight:500;font-variant-numeric:tabular-nums;opacity:.6;text-transform:uppercase}

/* footer */
.mat-footer{position:relative;overflow:hidden;background:var(--maroon);color:var(--on-dark)}
.mat-footer-mandala{position:absolute;right:-16%;top:-30%;width:52%;height:auto;aspect-ratio:1;opacity:.22;pointer-events:none;will-change:transform}
.mat-footer-in{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:clamp(28px,5cqw,72px);padding:clamp(56px,7cqw,96px) clamp(16px,3.2cqw,44px) clamp(36px,4cqw,56px)}
.mat-footer-brand{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.mat-footer-name{font-family:var(--wordmark);font-size:30px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-top:8px}
.mat-footer-tag{font:500 11px/1.4 var(--label);letter-spacing:.2em;text-transform:uppercase;opacity:.75}
.mat-footer-est{font-family:var(--display);font-style:italic;font-size:16px;opacity:.7}
.mat-footer-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.mat-footer-cols p{font:500 11px/1 var(--label);letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:16px}
.mat-footer-cols a{display:block;padding:6px 0;font:400 14px/1.3 var(--label);opacity:.8;transition:opacity .2s,transform .2s}
.mat-footer-cols a:hover{opacity:1;transform:translateX(4px)}
.mat-news{display:flex;flex-direction:column;gap:12px}
.mat-news > p{font-family:var(--display);font-size:24px;line-height:1.1}
.mat-news-row{display:flex;gap:8px}
.mat-news input{flex:1;min-width:0;height:46px;padding:0 16px;border-radius:999px;border:1px solid color-mix(in oklab,var(--on-dark) 35%,transparent);background:color-mix(in oklab,var(--on-dark) 8%,transparent);color:inherit;font:400 14px/1 var(--label)}
.mat-news input::placeholder{color:color-mix(in oklab,var(--on-dark) 50%,transparent)}
.mat-news small{font:400 12px/1.5 var(--label);opacity:.6}
.mat-footer-bottom{position:relative;z-index:1;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:18px clamp(16px,3.2cqw,44px) 22px;font:400 12px/1.4 var(--label);opacity:.75;border-top:1px solid color-mix(in oklab,var(--gold) 35%,transparent)}
.mat-footer-lace{position:absolute;left:0;right:0;top:-1px;height:8px;opacity:.6}

/* toast + drawer */
.mat-toast{position:fixed;left:50%;bottom:24px;z-index:60;display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:999px;background:var(--maroon);color:var(--on-dark);font:500 13px/1 var(--label);letter-spacing:.04em;box-shadow:0 20px 50px -20px rgba(0,0,0,.5);transform:translate(-50%,20px);opacity:0;pointer-events:none;transition:transform .4s cubic-bezier(.2,.8,.2,1),opacity .3s}
.mat-toast.is-on{transform:translate(-50%,0);opacity:1}
.mat-toast svg{color:var(--gold)}
.mat-drawer-wrap{position:fixed;inset:0;z-index:70;pointer-events:none}
.mat-drawer-wrap.is-open{pointer-events:auto}
.mat-scrim{position:absolute;inset:0;background:color-mix(in oklab,var(--c-ink) 55%,transparent);opacity:0;transition:opacity .4s;cursor:pointer}
.mat-drawer-wrap.is-open .mat-scrim{opacity:1}
.mat-drawer{position:absolute;top:0;right:0;bottom:0;width:min(420px,100%);display:flex;flex-direction:column;background:var(--paper);color:var(--ink);box-shadow:-30px 0 60px -30px rgba(0,0,0,.45);transform:translateX(104%);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.mat-drawer-wrap.is-open .mat-drawer{transform:translateX(0)}
.mat-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 14px}
.mat-drawer-head p{font-family:var(--display);font-size:28px;font-weight:500}
.mat-drawer-head p span{font:500 12px/1 var(--label);letter-spacing:.1em;color:var(--gold);margin-left:8px}
.mat-drawer-head button{display:grid;place-items:center;width:38px;height:38px;border-radius:999px;transition:background .2s,color .2s}
.mat-drawer-head button:hover{background:var(--maroon);color:var(--on-dark)}
.mat-drawer-lace{height:8px;opacity:.9}
.mat-drawer-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;font-family:var(--display);font-style:italic;font-size:19px;color:var(--soft)}
.mat-drawer-empty .mat-mandala{opacity:.6}
.mat-drawer-list{flex:1;overflow:auto;padding:8px 24px}
.mat-drawer-list li{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:14px;padding:16px 0;border-bottom:1px solid var(--line)}
.mat-drawer-list li p{font-family:var(--display);font-weight:600;font-size:18px;line-height:1.1}
.mat-drawer-list li small{font:400 12px/1.4 var(--label);color:var(--soft)}
.mat-drawer-list li b{font:500 14px/1 var(--label);min-width:64px;text-align:right}
.mat-qty{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line);border-radius:999px;padding:2px}
.mat-qty button{display:grid;place-items:center;width:28px;height:28px;border-radius:999px;transition:background .2s,color .2s}
.mat-qty button:hover{background:var(--maroon);color:var(--on-dark)}
.mat-qty span{min-width:20px;text-align:center;font:500 13px/1 var(--label)}
.mat-drawer-foot{padding:16px 24px 24px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:12px}
.mat-drawer-total{display:flex;justify-content:space-between;align-items:baseline;font:500 12px/1 var(--label);letter-spacing:.16em;text-transform:uppercase;color:var(--soft)}
.mat-drawer-total b{font-family:var(--display);font-size:30px;font-weight:600;letter-spacing:0;color:var(--maroon)}
.mat-root.mat-dark .mat-drawer-total b,:where(.dark) .mat-root:not(.mat-light) .mat-drawer-total b{color:var(--gold)}
.mat-drawer-foot small{font:400 12px/1.5 var(--label);color:var(--soft);text-align:center}

/* tablets and narrow containers */
@container (max-width: 1100px){
  .mat-bento{grid-template-columns:repeat(2,1fr)}
  .mat-feature{grid-column:span 2;grid-row:span 1;min-height:360px}
  .mat-plates{grid-template-columns:repeat(2,1fr)}
  .mat-footer-in{grid-template-columns:1fr 1fr}
  .mat-news{grid-column:span 2}
}
@container (max-width: 900px){
  .mat-nav{display:none;position:absolute;top:76px;left:0;right:0;flex-direction:column;gap:0;padding:8px 16px 16px;background:var(--paper);border-bottom:1px solid var(--line)}
  .mat-nav.is-open{display:flex}
  .mat-nav a{padding:14px 4px;border-bottom:1px solid var(--line);font-size:14px}
  .mat-nav a::after{display:none}
  .mat-burger{display:grid}
  .mat-brand{margin-right:auto}
  .mat-brand-tag{display:none}
  .mat-tools{margin-left:0}
  .mat-hero{grid-template-columns:1fr;grid-template-rows:auto minmax(380px,1fr);height:auto;min-height:0}
  .mat-panel-left{min-height:calc(var(--h) * .72);min-height:max(520px,calc(var(--h) * .72))}
  .mat-panel-right{min-height:max(420px,calc(var(--h) * .6))}
  .mat-hero-split{left:0;right:0;top:auto;bottom:auto;width:auto;height:14px;margin:0;display:none}
  .mat-hero-mandala{left:auto;right:-30%;bottom:-32%;width:110%}
  .mat-hero-title{font-size:clamp(60px,16cqw,120px)}
  .mat-develop{top:18px;right:18px}
  .mat-develop i{width:70px}
  .mat-corner-tr{display:none}
  .mat-sec-head{grid-template-columns:1fr}
  .mat-study{grid-template-columns:1fr}
  .mat-heritage-paisley{opacity:.35}
}
@container (max-width: 640px){
  .mat-ribbon{font-size:10px}
  .mat-header-in{gap:12px;height:68px}
  .mat-nav{top:68px}
  .mat-brand-name{font-size:20px}
  .mat-hero-copy{padding:40px 20px}
  .mat-hero-title{font-size:clamp(56px,20cqw,96px)}
  .mat-photo-label{left:20px;right:20px;bottom:28px}
  .mat-corner{opacity:.45}
  .mat-band-track{font-size:16px}
  .mat-bento{grid-template-columns:1fr;gap:16px}
  .mat-feature{grid-column:span 1;min-height:380px}
  .mat-product-media{aspect-ratio:4/3.6}
  .mat-quick{transform:translateY(0)}
  .mat-plates{grid-template-columns:1fr}
  .mat-plate{min-height:300px}
  .mat-heritage-paisley{display:none}
  .mat-heritage-p:first-of-type{font-size:19px}
  .mat-hours-row b{font-size:28px}
  .mat-footer-in{grid-template-columns:1fr}
  .mat-news{grid-column:span 1}
  .mat-footer-cols{grid-template-columns:1fr 1fr}
  .mat-footer-bottom{flex-direction:column}
  .mat-toast{left:16px;right:16px;transform:translate(0,20px);width:auto}
  .mat-toast.is-on{transform:translate(0,0)}
}

@media (prefers-reduced-motion: reduce){
  .mat-ribbon-track,.mat-band-track{animation:none}
  .mat-header,.mat-plate,.mat-product-media img,.mat-product-mandala,.mat-quick,.mat-btn,.mat-drawer,.mat-toast,.mat-bag-badge{transition:none}
  .mat-product-mandala{opacity:.5;transform:none}
}
`
