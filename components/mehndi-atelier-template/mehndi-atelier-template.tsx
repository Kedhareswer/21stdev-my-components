"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Mehndi Atelier Template — a storefront for an organic henna house.
 *
 * Maroon, olive and burnished gold on parchment, dressed the way a mehndi
 * house's wedding card is: damask grounds, brocade borders, Mughal arches,
 * filigree corners, paisleys and mandalas. It is a working shop: announcement
 * strip with search, a damask brand band, a tabbed nav with dropdowns that
 * sticks, a split hero, best sellers in arched frames with quick-add, a bento
 * of collections with a design booker, four collection plates, a heritage
 * plate, a stain study and a footer.
 *
 * - Every ornament is generated in code: mandalas from seeded rings, paisleys
 *   sampled from a bezier outline (scallops, feather band, echoes, a rosette
 *   core), filigree from waves and spirals, arches from a two-centred curve
 *   cut into cusps. No image assets; all of it recolours with the palette.
 * - The hero's arch window is a real morph: the cusped arch is regenerated
 *   every frame and swings open into the full panel as you scroll.
 * - GSAP ScrollTrigger runs the choreography inside one `gsap.context`, under
 *   `gsap.matchMedia`, so reduced motion gets the finished page and nothing is
 *   left behind on unmount.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

// ---- public types ---------------------------------------------------------------

export type MehndiPreset = "heirloom" | "indigo" | "terracotta"

export type MehndiColors = {
  /** The parchment the page is printed on. */
  paper?: string
  /** Body ink. */
  ink?: string
  /** The wine of the hero's left panel, the nav, the dark cards and the footer. */
  maroon?: string
  /** The hero's right panel. */
  olive?: string
  /** Burnished gold: ornaments, rules, display type. */
  gold?: string
  /** Pale plates. */
  sand?: string
  /** Rose-beige plates. */
  rose?: string
}

export type MehndiArt = {
  src: string
  alt?: string
  /** Where the crop centres, "50% 30%" style (x then y). */
  focus?: string
}

export type MehndiNavItem = { label: string; href?: string; children?: { label: string; href?: string }[] }

export type MehndiProduct = {
  id: string
  name: string
  /** One line under the name: weight, count, origin. */
  note?: string
  price: number
  image: string | MehndiArt
  /** A small ribbon on the arch: "Bestseller", "New", "Bridal". */
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

export type MehndiDesign = { name: string; time: string; price: number }

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
  /** Lines for the strip above the brand band. */
  announcements?: string[]
  nav?: MehndiNavItem[]
  hero?: {
    kicker?: string
    /** Headline lines. */
    title?: string[]
    sub?: string
    cta?: string
    photoKicker?: string
    photoTitle?: string
    photoCta?: string
    /** Text that runs round the spinning seal beside the arch. */
    seal?: string
  }
  /** The twin heading over the best sellers: `lead` sits left of the medallion, `title` right. */
  sellers?: { lead?: string; title?: string; blurb?: string }
  products?: MehndiProduct[]
  /** The bento's large photo tile. */
  feature?: { kicker?: string; title?: string; blurb?: string; cta?: string }
  /** The two dark cards beside it. */
  highlights?: { title: string; blurb: string; cta?: string }[]
  /** The design booker card. */
  designs?: { kicker?: string; title?: string; blurb?: string; cta?: string; items?: MehndiDesign[] }
  collectionsHead?: { kicker?: string; title?: string }
  collections?: MehndiCollection[]
  heritage?: { kicker?: string; title?: string; body?: string[]; cta?: string }
  study?: { kicker?: string; title?: string; blurb?: string }
  shades?: MehndiShade[]
  images?: { hero?: string | MehndiArt; feature?: string | MehndiArt }
  currency?: string
  /** Seed for the generated ornaments. Change it for different mandalas and paisleys. */
  seed?: number
  onAddToCart?: (item: MehndiBagItem, bag: MehndiBagItem[]) => void
  onCheckout?: (bag: MehndiBagItem[], total: number) => void
  /** Every link and button without an href lands here: "shop", "search:cones", "book:Bridal feet"… */
  onNavigate?: (target: string) => void
  className?: string
}

// ---- defaults ---------------------------------------------------------------------

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Jost:wght@400;500;600&display=swap"

const DISPLAY = '"Cormorant Garamond", "Cormorant", "EB Garamond", Garamond, "Times New Roman", serif'
const CAPS = 'Cinzel, "Trajan Pro", "Cormorant SC", "Cormorant Garamond", Georgia, serif'
const LABEL = 'Jost, "Futura PT", "Avenir Next", "Helvetica Neue", Arial, sans-serif'

const PALETTES = {
  heirloom: { paper: "#f3e8d4", ink: "#2d1a13", maroon: "#5a181c", olive: "#3c3f1f", gold: "#c69a48", sand: "#e7d3b2", rose: "#d9b48f" },
  indigo: { paper: "#efe9db", ink: "#141a2b", maroon: "#1d2549", olive: "#1d4743", gold: "#c9a24a", sand: "#ddd7c3", rose: "#c9b89a" },
  terracotta: { paper: "#f4e8d6", ink: "#33200f", maroon: "#7f3420", olive: "#4b5636", gold: "#d2a152", sand: "#ead6b8", rose: "#ddb08b" },
}

const U = (id: string, w: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&q=80"

const DEFAULT_IMAGES = {
  hero: { src: U("1621801306185-8c0ccf9c8eb8", 1600), alt: "Two hands with intricate henna held together against a dark green ground", focus: "74% 50%" },
  feature: { src: U("1730003873829-09b4b16444c1", 1600), alt: "Hands covered in bridal henna resting on a red and gold carpet", focus: "50% 45%" },
}

const DEFAULT_BRAND = { name: "Mahadi", tagline: "Organic Henna Atelier", est: "Est. 1987 · Jaipur" }

const DEFAULT_ANNOUNCEMENTS = [
  "Complimentary shipping on orders over ₹999",
  "Bridal bookings open for the wedding season",
  "100% plant henna, lab-tested, never PPD",
  "Fresh cones rolled every Monday",
]

const DEFAULT_NAV = [
  { label: "Shop", children: [{ label: "Henna powder" }, { label: "Cones" }, { label: "Aftercare" }, { label: "Gift boxes" }] },
  { label: "Bridal", children: [{ label: "Book an artist" }, { label: "Trousseau sets" }, { label: "Consultation" }] },
  { label: "Cones" },
  { label: "Tattoos", children: [{ label: "Stencils" }, { label: "Jagua gel" }] },
  { label: "Kits" },
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
  seal: "100% plant henna · Sojat leaf · rolled by hand · ",
}

const DEFAULT_SELLERS = {
  lead: "Organic Henna",
  title: "Best Sellers",
  blurb: "What leaves the atelier fastest: the cones and the powder, then everything that keeps the stain dark.",
}

const DEFAULT_PRODUCTS = [
  { id: "powder", name: "Rajasthani Henna Powder", note: "100 g · triple-sifted", price: 349, image: { src: U("1603122612817-2fe0e0631a93", 900), alt: "Henna powder heaped in a silver bowl", focus: "55% 50%" }, badge: "Bestseller" },
  { id: "cones", name: "Bridal Cones", note: "Set of 12 · fresh-rolled", price: 899, image: { src: U("1774019410616-2b38e4eeabd2", 900), alt: "Henna piped onto a hand from a cone", focus: "42% 55%" }, badge: "Bridal" },
  { id: "trousseau", name: "Mehndi Night Set", note: "Cones, oil, seal · boxed", price: 1499, image: { src: U("1738849760236-541fcdd3931d", 900), alt: "Two hennaed palms with flower bracelets", focus: "50% 55%" } },
  { id: "seal", name: "Sugar-Lemon Seal", note: "60 ml · aftercare", price: 249, image: { src: U("1771498897921-91522949362e", 900), alt: "An artist drawing henna on a palm", focus: "50% 40%" }, badge: "New" },
]

const DEFAULT_FEATURE = {
  kicker: "The trousseau",
  title: "Bridal Trousseau",
  blurb: "Powder, twelve cones, eucalyptus oil, the sugar-lemon seal and three stencil sheets, in a hand-stitched box.",
  cta: "Discover the set",
}

const DEFAULT_HIGHLIGHTS = [
  { title: "Natural Henna Cones", blurb: "Rolled the week they ship. Dark in a day.", cta: "Shop cones" },
  { title: "Temporary Mehndi Kits", blurb: "Stencils and jagua for a fortnight's wear.", cta: "Shop kits" },
]

const DEFAULT_DESIGNS = {
  kicker: "Book a design",
  title: "Mehndi Designs",
  blurb: "Choose a style; an atelier artist comes to you.",
  cta: "Book this design",
  items: [
    { name: "Arabic vine", time: "40 min", price: 1500 },
    { name: "Rajasthani full hand", time: "3 h", price: 6500 },
    { name: "Bridal feet", time: "2 h", price: 4500 },
    { name: "Minimal finger caps", time: "15 min", price: 600 },
  ],
}

const DEFAULT_COLLECTIONS_HEAD = { kicker: "Shop by ritual", title: "The Mehndi Edit" }

const DEFAULT_COLLECTIONS = [
  { id: "natural", title: "Natural Henna", blurb: "Single-origin leaf, ground fresh and sifted three times. Nothing added, nothing hidden.", cta: "Shop powder", tone: "sand" },
  { id: "bridal", title: "Bridal Mehndi", blurb: "Cones, consultations and artists for the ceremony, so the stain peaks for the vows.", cta: "Book bridal", tone: "rose" },
  { id: "tattoos", title: "Temporary Tattoos", blurb: "Jagua and henna stencils that last a fortnight. Festival-ready in twenty minutes.", cta: "Shop tattoos", tone: "maroon" },
  { id: "diy", title: "DIY Kits", blurb: "Everything a first cone needs, with a practice sheet and the atelier's recipe card.", cta: "Shop kits", tone: "plum" },
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
  let t = seed >>> 0 || 1
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
    const n = kind === "circle" ? 1 : 8 * (1 + Math.floor(r() * 4))
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
// #endregion

// #region curve
type Pt = [number, number]
/** A point on a cubic bezier given as [x0,y0,x1,y1,x2,y2,x3,y3]. */
function bez(s: number[], t: number): Pt {
  const u = 1 - t
  return [
    u * u * u * s[0] + 3 * u * u * t * s[2] + 3 * u * t * t * s[4] + t * t * t * s[6],
    u * u * u * s[1] + 3 * u * u * t * s[3] + 3 * u * t * t * s[5] + t * t * t * s[7],
  ]
}
function sampleCubics(segs: number[][], per: number) {
  const out: Pt[] = []
  for (const s of segs) for (let i = 0; i < per; i++) out.push(bez(s, i / per))
  return out
}
/** Walk a polyline and drop a point every `step` units of arc length. */
function resample(pts: Pt[], step: number, closed: boolean) {
  const P = closed ? pts.concat([pts[0]]) : pts
  const out: Pt[] = [[P[0][0], P[0][1]]]
  let need = step
  for (let i = 1; i < P.length; i++) {
    let ax = P[i - 1][0]
    let ay = P[i - 1][1]
    const bx = P[i][0]
    const by = P[i][1]
    let seg = Math.hypot(bx - ax, by - ay)
    while (seg >= need && seg > 0) {
      const k = need / seg
      ax += (bx - ax) * k
      ay += (by - ay) * k
      out.push([ax, ay])
      seg -= need
      need = step
    }
    need -= seg
  }
  if (closed && out.length > 2) {
    const l = out[out.length - 1]
    if (Math.hypot(l[0] - P[0][0], l[1] - P[0][1]) < step * 0.5) out.pop()
  }
  return out
}
/** Signed area; positive is clockwise on screen (y down). */
function area(pts: Pt[]) {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    s += a[0] * b[1] - b[0] * a[1]
  }
  return s / 2
}
function centroid(pts: Pt[]): Pt {
  let cx = 0
  let cy = 0
  let A = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const c = a[0] * b[1] - b[0] * a[1]
    A += c
    cx += (a[0] + b[0]) * c
    cy += (a[1] + b[1]) * c
  }
  return [cx / (3 * A), cy / (3 * A)]
}
/** Unit normals pointing out of a closed loop. */
function normals(pts: Pt[]) {
  const s = area(pts) > 0 ? 1 : -1
  const n = pts.length
  return pts.map((_, i) => {
    const a = pts[(i - 1 + n) % n]
    const b = pts[(i + 1) % n]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    return [(s * dy) / l, (-s * dx) / l] as Pt
  })
}
/** Catmull-Rom through the points, written as cubic beziers. */
function smoothPath(pts: Pt[], closed: boolean) {
  const n = pts.length
  if (n < 2) return ""
  const get = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))])
  let d = "M" + fx(pts[0][0]) + "," + fx(pts[0][1])
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1)
    const p1 = get(i)
    const p2 = get(i + 1)
    const p3 = get(i + 2)
    d +=
      "C" + fx(p1[0] + (p2[0] - p0[0]) / 6) + "," + fx(p1[1] + (p2[1] - p0[1]) / 6) +
      " " + fx(p2[0] - (p3[0] - p1[0]) / 6) + "," + fx(p2[1] - (p3[1] - p1[1]) / 6) +
      " " + fx(p2[0]) + "," + fx(p2[1])
  }
  return d + (closed ? "Z" : "")
}
/** A leaf from a to b, w wide either side of its midrib. */
function leafPath(a: Pt, b: Pt, w: number) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy) || 1
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const px = (-dy / l) * w
  const py = (dx / l) * w
  return "M" + fx(a[0]) + "," + fx(a[1]) + "Q" + fx(mx + px) + "," + fx(my + py) + " " + fx(b[0]) + "," + fx(b[1]) + "Q" + fx(mx - px) + "," + fx(my - py) + " " + fx(a[0]) + "," + fx(a[1]) + "Z"
}
function dotPath(c: Pt, r: number) {
  return "M" + fx(c[0] - r) + "," + fx(c[1]) + "a" + fx(r) + "," + fx(r) + " 0 1 0 " + fx(2 * r) + ",0a" + fx(r) + "," + fx(r) + " 0 1 0 " + fx(-2 * r) + ",0"
}
/** A spiral that leaves `start` heading along `heading` and curls `turns` times, tightening. */
function spiral(start: Pt, heading: number, r0: number, turns: number, dir: number, steps: number) {
  const cx = start[0] + Math.cos(heading + (dir * Math.PI) / 2) * r0
  const cy = start[1] + Math.sin(heading + (dir * Math.PI) / 2) * r0
  const a0 = Math.atan2(start[1] - cy, start[0] - cx)
  const out: Pt[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const r = r0 * (1 - 0.82 * t)
    const a = a0 + dir * t * turns * Math.PI * 2
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return out
}
// #endregion

// #region arch
/**
 * A cusped Mughal arch filling the box (x, y, w, h): a pointed two-centred
 * crown cut into `lobes` scallops a side, on straight jambs. `k` morphs it:
 * 1 is the full arch, 0 is the plain rectangle it opens into. The command
 * count never changes with k, so it can be regenerated every frame.
 */
function archPath(x: number, y: number, w: number, h: number, k: number, lobes: number) {
  w = Math.max(w, 0.001)
  h = Math.max(h, 0)
  k = Math.min(1, Math.max(0, k))
  const want = Math.min(w * 0.62, h * 0.72)
  const riseU = Math.max(want, w / 2 + 1e-6)
  const squash = (want / riseU) * k
  const d = (riseU * riseU - (w * w) / 4) / w
  const R = w / 2 + d
  const sy = y + want * k
  const th1 = Math.atan2(riseU, -d)
  const left: Pt[] = []
  for (let i = 0; i <= lobes; i++) {
    const th = Math.PI + ((th1 - Math.PI) * i) / lobes
    left.push([x + R + R * Math.cos(th), sy - R * Math.sin(th) * squash])
  }
  const right = left.slice(0, -1).reverse().map((p) => [2 * x + w - p[0], p[1]] as Pt)
  const crown = left.concat(right)
  let p = "M" + fx(x) + "," + fx(y + h) + "L" + fx(x) + "," + fx(sy)
  for (let i = 1; i < crown.length; i++) {
    const a = crown[i - 1]
    const b = crown[i]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const bulge = 0.34 * k
    p += "Q" + fx((a[0] + b[0]) / 2 + dy * bulge) + "," + fx((a[1] + b[1]) / 2 - dx * bulge) + " " + fx(b[0]) + "," + fx(b[1])
  }
  return p + "L" + fx(x + w) + "," + fx(y + h) + "Z"
}
// #endregion

// #region paisley
/** The boteh's outline: a round bulb that tapers into a hooked tip. */
const BOTEH = [
  [-34, -124, -6, -136, 34, -120, 52, -86],
  [52, -86, 70, -52, 78, -12, 70, 24],
  [70, 24, 60, 70, 24, 98, -14, 98],
  [-14, 98, -54, 98, -82, 68, -80, 28],
  [-80, 28, -78, -6, -58, -34, -38, -56],
  [-38, -56, -22, -72, -14, -92, -28, -104],
  [-28, -104, -40, -112, -48, -122, -34, -124],
]
/**
 * Dress the boteh the way a mehndi artist would: a scalloped lace edge with a
 * bead in every scallop, a band of feathers inside the outline, two echo
 * lines with a bead row between, a rosette in the bulb and a vine up into
 * the hook.
 */
function paisleyOrnament(seed: number) {
  const r = rng(seed)
  const raw = sampleCubics(BOTEH, 24)
  const outline = resample(raw, 3, true)
  const c0 = centroid(outline)
  let minY = Infinity
  let maxY = -Infinity
  for (const p of outline) {
    minY = Math.min(minY, p[1])
    maxY = Math.max(maxY, p[1])
  }
  const c: Pt = [c0[0], c0[1] + (maxY - minY) * 0.1]
  let rin = Infinity
  for (const p of outline) rin = Math.min(rin, Math.hypot(p[0] - c[0], p[1] - c[1]))
  const scale = (pts: Pt[], k: number) => pts.map((p) => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k] as Pt)

  // lace edge
  const ring = resample(raw, 12, true)
  const rn = normals(ring)
  const off = ring.map((p, i) => [p[0] + rn[i][0] * 6, p[1] + rn[i][1] * 6] as Pt)
  const on = normals(off)
  let scallops = "M" + fx(off[0][0]) + "," + fx(off[0][1])
  const beads: string[] = []
  for (let i = 0; i < off.length; i++) {
    const a = off[i]
    const b = off[(i + 1) % off.length]
    const n0 = on[i]
    const n1 = on[(i + 1) % off.length]
    const nx = (n0[0] + n1[0]) / 2
    const ny = (n0[1] + n1[1]) / 2
    const ch = Math.hypot(b[0] - a[0], b[1] - a[1])
    const mx = (a[0] + b[0]) / 2 + nx * ch * 0.62
    const my = (a[1] + b[1]) / 2 + ny * ch * 0.62
    scallops += "Q" + fx(mx) + "," + fx(my) + " " + fx(b[0]) + "," + fx(b[1])
    beads.push(dotPath([(a[0] + b[0]) / 2 + nx * (ch * 0.62 + 5), (a[1] + b[1]) / 2 + ny * (ch * 0.62 + 5)], 1.5))
  }

  // feathers lie along the inside of the outline, tips pointing in
  const fpts = resample(raw, 10, true)
  const fn = normals(fpts)
  const feathers = fpts.map((p, i) => leafPath([p[0] - fn[i][0] * 2.5, p[1] - fn[i][1] * 2.5], [p[0] - fn[i][0] * 13, p[1] - fn[i][1] * 13], 2.6))

  const echo1 = scale(outline, 0.78)
  const echo2 = scale(outline, 0.62)
  const beadRow = resample(scale(outline, 0.7), 8, true).map((p) => dotPath(p, 1.25))

  // the rosette in the bulb
  const R = rin * 0.4
  const petals = Array.from({ length: 10 }, (_, i) => petalPath(R * 0.22, R, (i * Math.PI) / 5, 0.32))
  const inner = Array.from({ length: 10 }, (_, i) => petalPath(R * 0.3, R * 0.72, (i * Math.PI) / 5 + Math.PI / 10, 0.22))
  const ringDots = Array.from({ length: 20 }, (_, i) => dotPath(polar(R * 1.16, (i * Math.PI) / 10) as Pt, 1.1))

  // a vine from the rosette up into the hook, leaves alternating
  let top = outline[0]
  for (const p of outline) if (p[1] < top[1]) top = p
  const tipIn: Pt = [c[0] + (top[0] - c[0]) * 0.66, c[1] + (top[1] - c[1]) * 0.66]
  const len = Math.hypot(tipIn[0] - c[0], tipIn[1] - c[1]) || 1
  const start: Pt = [c[0] + ((tipIn[0] - c[0]) * R * 1.35) / len, c[1] + ((tipIn[1] - c[1]) * R * 1.35) / len]
  const bendX = (r() - 0.5) * 18
  const vinePts: Pt[] = []
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    vinePts.push([start[0] + (tipIn[0] - start[0]) * t + Math.sin(t * Math.PI) * (14 + bendX), start[1] + (tipIn[1] - start[1]) * t])
  }
  const vineEnd = vinePts[vinePts.length - 1]
  const prev = vinePts[vinePts.length - 2]
  const curl = spiral(vineEnd, Math.atan2(vineEnd[1] - prev[1], vineEnd[0] - prev[0]), 6, 1.1, 1, 18)
  const vine = smoothPath(vinePts.concat(curl.slice(1)), false)
  const leaves: string[] = []
  for (let i = 2; i < 16; i += 2) {
    const p = vinePts[i]
    const q = vinePts[i + 1]
    const hd = Math.atan2(q[1] - p[1], q[0] - p[0])
    const side = (i / 2) % 2 ? 1 : -1
    const a = hd + side * 0.95
    const L = 13 - i * 0.35
    leaves.push(leafPath(p, [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L], L * 0.3))
  }

  return {
    outline: smoothPath(resample(raw, 6, true), true),
    scallops: scallops + "Z",
    beads: beads.join(""),
    feathers: feathers.join(""),
    echo1: smoothPath(resample(echo1, 6, true), true),
    echo2: smoothPath(resample(echo2, 6, true), true),
    beadRow: beadRow.join(""),
    core: { cx: fx(c[0]), cy: fx(c[1]), petals: petals.join(""), inner: inner.join(""), ringDots: ringDots.join(""), r: fx(R) },
    vine,
    leaves: leaves.join(""),
  }
}
// #endregion

// #region filigree
/**
 * One arm of a filigree: a wave that dies away along x, a tendril curling off
 * every crest, leaves in the troughs and a curl at the end.
 */
function filigreeArm(len: number, amp: number, waves: number, seed: number) {
  const r = rng(seed)
  const N = 64
  const vine: Pt[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    vine.push([t * len, amp * Math.sin(t * waves * Math.PI) * (1 - 0.45 * t)])
  }
  const end = vine[N]
  const pre = vine[N - 1]
  const endSide = Math.sin(waves * Math.PI - 0.01) >= 0 ? 1 : -1
  const curl = spiral(end, Math.atan2(end[1] - pre[1], end[0] - pre[0]), amp * 0.5, 1.15, endSide, 26)
  const tendrils: string[] = []
  const leaves: string[] = []
  const dots: string[] = []
  for (let k = 0; k < waves; k++) {
    const i = Math.round(((k + 0.5) / waves) * N)
    const p = vine[i]
    const q = vine[Math.min(N, i + 1)]
    const h = Math.atan2(q[1] - p[1], q[0] - p[0])
    const side = p[1] >= 0 ? 1 : -1
    const out = h + side * (0.75 + r() * 0.25)
    const sp = spiral(p, out, amp * (0.42 + r() * 0.16) * (1 - 0.35 * (k / waves)), 1.05 + r() * 0.25, -side, 24)
    tendrils.push(smoothPath(sp, false))
    dots.push(dotPath(sp[sp.length - 1], 1.3))
    // a pair of leaves on the inside of the wave
    const j = Math.round((k / waves) * N + N / waves / 5)
    const lp = vine[Math.min(N - 1, j)]
    const lq = vine[Math.min(N, j + 1)]
    const lh = Math.atan2(lq[1] - lp[1], lq[0] - lp[0])
    const ls = lp[1] >= 0 ? -1 : 1
    const L = amp * (0.62 + r() * 0.2)
    leaves.push(leafPath(lp, [lp[0] + Math.cos(lh + ls * 0.7) * L, lp[1] + Math.sin(lh + ls * 0.7) * L], L * 0.26))
    leaves.push(leafPath(lp, [lp[0] + Math.cos(lh + ls * 1.5) * L * 0.7, lp[1] + Math.sin(lh + ls * 1.5) * L * 0.7], L * 0.2))
  }
  dots.push(dotPath(curl[curl.length - 1], 1.6))
  return { vine: smoothPath(vine.concat(curl.slice(1)), false), tendrils, leaves: leaves.join(""), dots: dots.join("") }
}
// #endregion

// #region stain
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
const useUid = (prefix: string) => prefix + React.useId().replace(/[^a-zA-Z0-9]/g, "")
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const art = (v: string | MehndiArt | undefined, fallback: MehndiArt) => (!v ? fallback : typeof v === "string" ? { src: v, alt: fallback.alt, focus: fallback.focus } : { ...fallback, ...v })

function Mandala({ seed, className = "", style, fill = true, strokeWidth = 0.55 }: { seed: number; className?: string; style?: React.CSSProperties; fill?: boolean; strokeWidth?: number }) {
  const rings = React.useMemo(() => mandalaRings(seed, 98).map((ring) => ({ ring, ...ringMarks(ring) })), [seed])
  return (
    <svg className={"mat-mandala " + className} viewBox="-100 -100 200 200" aria-hidden="true" style={style}>
      {rings.map(({ ring, paths, dots }, i) => (
        <g key={i} className="mat-ring">
          {paths.map((d, j) => (
            <path key={j} d={d} pathLength={1} fill={fill && ring.kind === "petal" ? "currentColor" : "none"} fillOpacity={fill ? 0.16 : 0} stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
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

function Rosette({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={"mat-rosette " + className} viewBox="-20 -20 40 40" width={size} height={size} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={petalPath(4, 18, (i * Math.PI) / 4, 0.42)} fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.9" />
      ))}
      <circle r="3.2" fill="currentColor" />
      {Array.from({ length: 8 }, (_, i) => {
        const [x, y] = polar(11, (i * Math.PI) / 4 + Math.PI / 8)
        return <circle key={"d" + i} cx={x} cy={y} r="1" fill="currentColor" />
      })}
    </svg>
  )
}

/** A round seal: double ring, scalloped edge, rosette inside. */
function Emblem({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={"mat-emblem " + className} viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true">
      <path d={scallopPath(44, 24, 0)} fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.2" />
      <circle r="37" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle r="33" fill="none" stroke="currentColor" strokeWidth="0.6" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={petalPath(6, 28, (i * Math.PI) / 6, 0.3)} fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1" />
      ))}
      <circle r="6" fill="currentColor" />
    </svg>
  )
}

/** A repeating gold band: rule, diamond, ring, beads. */
function Brocade({ className = "", vertical = false }: { className?: string; vertical?: boolean }) {
  const id = useUid("mbr")
  return (
    <svg className={"mat-brocade" + (vertical ? " is-v" : "") + (className ? " " + className : "")} aria-hidden="true">
      <defs>
        <pattern id={id} width="28" height="16" patternUnits="userSpaceOnUse" patternTransform={vertical ? "rotate(90)" : undefined}>
          <path d="M0,0.7H28M0,15.3H28" stroke="currentColor" strokeWidth="0.9" />
          <path d="M14,3.4L18.4,8L14,12.6L9.6,8Z" fill="currentColor" />
          <circle cx="0" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="28" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="0" cy="8" r="1.1" fill="currentColor" />
          <circle cx="28" cy="8" r="1.1" fill="currentColor" />
          {[[6, 4.2], [6, 11.8], [22, 4.2], [22, 11.8]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="0.85" fill="currentColor" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={"url(#" + id + ")"} />
    </svg>
  )
}

/** The damask ground: an ogee lattice with a rosette in every cell. */
function Damask({ className = "" }: { className?: string }) {
  const id = useUid("mdm")
  return (
    <svg className={"mat-damask" + (className ? " " + className : "")} aria-hidden="true">
      <defs>
        <pattern id={id} width="96" height="124" patternUnits="userSpaceOnUse">
          <path d="M48,2Q66,40 94,62Q66,84 48,122Q30,84 2,62Q30,40 48,2Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <g transform="translate(48,62)">
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d={petalPath(3, 15, (i * Math.PI) / 4, 0.4)} fill="currentColor" fillOpacity="0.5" />
            ))}
            <circle r="2.4" fill="currentColor" />
            <path d={leafPath([0, -18], [0, -34], 4)} fill="currentColor" fillOpacity="0.6" />
            <path d={leafPath([0, 18], [0, 34], 4)} fill="currentColor" fillOpacity="0.6" />
          </g>
          {[[0, 0], [96, 0], [0, 124], [96, 124]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="currentColor" />
          ))}
          {[[48, 2], [94, 62], [48, 122], [2, 62]].map(([x, y], i) => (
            <circle key={"n" + i} cx={x} cy={y} r="1.6" fill="currentColor" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={"url(#" + id + ")"} />
    </svg>
  )
}

/** A filigree corner: two arms along the edges and a fan of petals in the angle. */
function Filigree({ corner = "tl", seed = 1, className = "" }: { corner?: "tl" | "tr" | "bl" | "br"; seed?: number; className?: string }) {
  const g = React.useMemo(
    () => ({ a: filigreeArm(178, 20, 3, seed), b: filigreeArm(178, 20, 3, seed + 1), c: filigreeArm(104, 11, 2, seed + 2), d: filigreeArm(104, 11, 2, seed + 3) }),
    [seed],
  )
  const flip = corner === "tr" ? "translate(200,0) scale(-1,1)" : corner === "bl" ? "translate(0,200) scale(1,-1)" : corner === "br" ? "translate(200,200) scale(-1,-1)" : undefined
  const arm = (a: ReturnType<typeof filigreeArm>, t: string, w: number) => (
    <g transform={t}>
      <path className="mat-dr" d={a.vine} pathLength={1} fill="none" stroke="currentColor" strokeWidth={2 * w} strokeLinecap="round" />
      {a.tendrils.map((d, i) => (
        <path key={i} className="mat-dr" d={d} pathLength={1} fill="none" stroke="currentColor" strokeWidth={1.4 * w} strokeLinecap="round" />
      ))}
      <path className="mat-fl" d={a.leaves} fill="currentColor" fillOpacity="0.7" stroke="currentColor" strokeWidth="0.7" />
      <path className="mat-fl" d={a.dots} fill="currentColor" />
    </g>
  )
  return (
    <svg className={"mat-filigree is-" + corner + (className ? " " + className : "")} viewBox="0 0 200 200" aria-hidden="true">
      <g transform={flip}>
        {arm(g.a, "translate(12,12)", 1)}
        {arm(g.b, "translate(12,12) rotate(90) scale(1,-1)", 1)}
        {arm(g.c, "translate(46,42)", 0.7)}
        {arm(g.d, "translate(42,46) rotate(90) scale(1,-1)", 0.7)}
        <g transform="translate(12,12)">
          {[0.12, 0.36, 0.6, 0.785, 0.97, 1.21, 1.45].map((a, i) => (
            <path key={i} className="mat-fl" d={petalPath(6, i === 3 ? 56 : i % 2 ? 30 : 44, a, i === 3 ? 0.16 : 0.2)} fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1" />
          ))}
          <circle className="mat-fl" r="9" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle className="mat-fl" r="5" fill="currentColor" />
          {Array.from({ length: 5 }, (_, i) => {
            const [x, y] = polar(64, 0.785 + (i - 2) * 0.16)
            return <circle key={i} className="mat-fl" cx={x} cy={y} r={i === 2 ? 2.6 : 1.6} fill="currentColor" />
          })}
        </g>
      </g>
    </svg>
  )
}

/** A horizontal flourish: a lotus in the middle and a scrolling arm either side. */
function Flourish({ className = "", seed = 4 }: { className?: string; seed?: number }) {
  const a = React.useMemo(() => filigreeArm(150, 8, 2, seed), [seed])
  const side = (t: string) => (
    <g transform={t}>
      <path className="mat-dr" d={a.vine} pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {a.tendrils.map((d, i) => (
        <path key={i} className="mat-dr" d={d} pathLength={1} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      ))}
      <path className="mat-fl" d={a.leaves} fill="currentColor" fillOpacity="0.6" />
      <path className="mat-fl" d={a.dots} fill="currentColor" />
    </g>
  )
  return (
    <svg className={"mat-flourish" + (className ? " " + className : "")} viewBox="-200 -26 400 52" aria-hidden="true">
      {side("translate(22,0)")}
      {side("translate(-22,0) scale(-1,1)")}
      <g className="mat-fl">
        {[-1.5708, -0.95, -2.19, 1.5708].map((ang, i) => (
          <path key={i} d={petalPath(3, i === 3 ? 12 : i === 0 ? 20 : 15, ang, 0.36)} fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="0.9" />
        ))}
        <circle r="3.6" fill="currentColor" />
      </g>
    </svg>
  )
}

/** A dressed paisley. */
function Paisley({ seed = 3, className = "", flip = false }: { seed?: number; className?: string; flip?: boolean }) {
  const p = React.useMemo(() => paisleyOrnament(seed), [seed])
  return (
    <svg className={"mat-paisley" + (className ? " " + className : "")} viewBox="-100 -142 200 252" aria-hidden="true">
      <g transform={flip ? "scale(-1,1)" : undefined} strokeLinecap="round" strokeLinejoin="round">
        <g className="mat-fills">
          <path d={p.outline} fill="currentColor" fillOpacity="0.16" />
          <path d={p.echo1} fill="currentColor" fillOpacity="0.08" />
          <path d={p.echo2} fill="currentColor" fillOpacity="0.14" />
          <path d={p.feathers} fill="currentColor" fillOpacity="0.75" />
          <path d={p.beads} fill="currentColor" />
          <path d={p.beadRow} fill="currentColor" />
          <g transform={"translate(" + p.core.cx + "," + p.core.cy + ")"}>
            <path d={p.core.petals} fill="currentColor" fillOpacity="0.28" />
            <path d={p.core.inner} fill="currentColor" fillOpacity="0.5" />
            <path d={p.core.ringDots} fill="currentColor" />
            <circle r={p.core.r * 0.18} fill="currentColor" />
          </g>
          <path d={p.leaves} fill="currentColor" fillOpacity="0.6" />
        </g>
        <g fill="none" stroke="currentColor">
          <path className="mat-dr" d={p.scallops} pathLength={1} strokeWidth="1.1" />
          <path className="mat-dr" d={p.outline} pathLength={1} strokeWidth="2.4" />
          <path className="mat-dr" d={p.echo1} pathLength={1} strokeWidth="1.3" />
          <path className="mat-dr" d={p.echo2} pathLength={1} strokeWidth="1" />
          <path className="mat-dr" d={p.vine} pathLength={1} strokeWidth="1.2" />
          <g transform={"translate(" + p.core.cx + "," + p.core.cy + ")"}>
            <path className="mat-dr" d={p.core.petals} pathLength={1} strokeWidth="0.9" />
            <circle className="mat-dr" r={p.core.r * 1.32} pathLength={1} strokeWidth="0.9" />
          </g>
        </g>
      </g>
    </svg>
  )
}

/** A photo in a cusped arch with a double gold frame. */
function ArchPhoto({ a, className = "", children }: { a: MehndiArt; className?: string; children?: React.ReactNode }) {
  const id = useUid("mar")
  const W = 300
  const H = 390
  const [fxp, fyp] = (a.focus ?? "50% 50%").split(" ").map((v) => parseFloat(v) / 100)
  const align = "x" + (fxp < 0.34 ? "Min" : fxp > 0.66 ? "Max" : "Mid") + "Y" + (fyp < 0.34 ? "Min" : fyp > 0.66 ? "Max" : "Mid")
  return (
    <div className={"mat-arch " + className}>
      <svg viewBox={"-14 -18 " + (W + 28) + " " + (H + 30)} role="img" aria-label={a.alt ?? ""}>
        <defs>
          <clipPath id={id}>
            <path d={archPath(0, 0, W, H, 1, 4)} />
          </clipPath>
        </defs>
        <g clipPath={"url(#" + id + ")"}>
          <rect width={W} height={H} fill="var(--mat-sand)" />
          <image className="mat-arch-img" href={a.src} x="0" y="0" width={W} height={H} preserveAspectRatio={align + " slice"} />
          <rect className="mat-arch-tint" width={W} height={H} />
        </g>
        <path className="mat-dr mat-arch-line" d={archPath(-10, -14, W + 20, H + 24, 1, 4)} pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path className="mat-dr mat-arch-line" d={archPath(7, 9, W - 14, H - 16, 1, 4)} pathLength={1} fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>
      {children}
    </div>
  )
}

/** Text running round a circle; the ring of text turns. */
function Seal({ text, className = "" }: { text: string; className?: string }) {
  const id = useUid("msl")
  return (
    <svg className={"mat-seal " + className} viewBox="-60 -60 120 120" aria-hidden="true">
      <defs>
        <path id={id} d="M0,-46A46,46 0 1 1 0,46A46,46 0 1 1 0,-46" />
      </defs>
      <circle r="58" fill="var(--mat-maroon)" />
      <circle r="55" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle r="36" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <g className="mat-seal-turn">
        <text fontSize="9.4" letterSpacing="2.4" fill="currentColor" style={{ fontFamily: "var(--caps)" }}>
          <textPath href={"#" + id}>{text + text}</textPath>
        </text>
      </g>
      <g transform="scale(0.62)">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={petalPath(6, 44, (i * Math.PI) / 4, 0.34)} fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.3" />
        ))}
        <circle r="7" fill="currentColor" />
      </g>
    </svg>
  )
}

function Icon({ name }: { name: "search" | "user" | "bag" | "arrow" | "close" | "plus" | "minus" | "drop" | "heart" | "chev" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  switch (name) {
    case "search":
      return (
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
      )
    case "user":
      return (
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" {...common}>
          <circle cx="12" cy="8.5" r="4" />
          <path d="M4.5 20.5c1.4-3.6 4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
        </svg>
      )
    case "heart":
      return (
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" {...common}>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
      )
    case "bag":
      return (
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" {...common}>
          <path d="M5 8.5h14l-1 12H6z" />
          <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
        </svg>
      )
    case "arrow":
      return (
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" {...common}>
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      )
    case "chev":
      return (
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" {...common} strokeWidth={2}>
          <path d="M6 9l6 6 6-6" />
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

/** A centred section heading: kicker, title, flourish. */
function SectionHead({ kicker, title, blurb }: { kicker?: string; title: string; blurb?: string }) {
  return (
    <div className="mat-head">
      {kicker && (
        <p className="mat-kicker mat-rise">
          <Rosette size={12} /> {kicker} <Rosette size={12} />
        </p>
      )}
      <h2 className="mat-h2 mat-rise">{title}</h2>
      <Flourish className="mat-head-flourish" />
      {blurb && <p className="mat-lede mat-rise">{blurb}</p>}
    </div>
  )
}

// ---- the stain study ---------------------------------------------------------------------

function StainStudy({ seed, shades, copy }: { seed: number; shades: MehndiShade[]; copy: { kicker: string; title: string; blurb: string } }) {
  const [shade, setShade] = React.useState(shades[0]?.id ?? "")
  const [hours, setHours] = React.useState(48)
  const current = shades.find((s) => s.id === shade) ?? shades[0]
  const color = stainAt(hours, current?.hex ?? "#5b191c")
  const opacity = stainOpacity(hours)
  const stage = hours < 6 ? "Fresh paste, just scraped off" : hours < 20 ? "Oxidising: pumpkin to rust" : hours < 40 ? "Deepening overnight" : "Settled: the final shade"
  return (
    <div className="mat-study">
      <div className="mat-study-copy">
        <p className="mat-kicker is-left mat-rise">
          <Rosette size={12} /> {copy.kicker}
        </p>
        <h2 className="mat-h2 mat-rise">{copy.title}</h2>
        <Flourish className="mat-study-flourish" seed={9} />
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
      <div className="mat-thaali mat-rise" style={{ "--stain": color, "--stain-a": opacity } as React.CSSProperties}>
        <svg className="mat-thaali-rim" viewBox="-110 -110 220 220" aria-hidden="true">
          <path d={scallopPath(104, 48, 0)} fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" />
          <circle r="98" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <circle r="93" fill="none" stroke="currentColor" strokeWidth="0.8" />
          {Array.from({ length: 48 }, (_, i) => {
            const [x, y] = polar(108.5, (i * Math.PI) / 24 + Math.PI / 48)
            return <circle key={i} cx={x} cy={y} r="1.3" fill="currentColor" />
          })}
        </svg>
        <div className="mat-skin">
          <Mandala seed={seed + 11} className="mat-skin-mandala" strokeWidth={1.1} />
        </div>
        <div className="mat-skin-chip">
          <i style={{ background: color }} aria-hidden="true" />
          <span>{current?.name}</span>
          <b>{color}</b>
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
  nav = DEFAULT_NAV,
  hero,
  sellers,
  products = DEFAULT_PRODUCTS,
  feature,
  highlights = DEFAULT_HIGHLIGHTS,
  designs,
  collectionsHead,
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
  const s = { ...DEFAULT_SELLERS, ...sellers }
  const f = { ...DEFAULT_FEATURE, ...feature }
  const dz = { ...DEFAULT_DESIGNS, ...designs }
  const ch = { ...DEFAULT_COLLECTIONS_HEAD, ...collectionsHead }
  const her = { ...DEFAULT_HERITAGE, ...heritage }
  const st = { ...DEFAULT_STUDY, ...study }
  const heroArt = art(images?.hero, DEFAULT_IMAGES.hero)
  const featureArt = art(images?.feature, DEFAULT_IMAGES.feature)

  const root = React.useRef(null as HTMLDivElement | null)
  const [bag, setBag] = React.useState([] as MehndiBagItem[])
  const bagRef = React.useRef(bag)
  bagRef.current = bag
  const [drawer, setDrawer] = React.useState(false)
  const [menu, setMenu] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [design, setDesign] = React.useState(0)
  const [toast, setToast] = React.useState(null as { id: number; text: string } | null)
  const toastTimer = React.useRef(0)

  // the hero window: a cusped arch regenerated every frame
  const panelRef = React.useRef(null as HTMLDivElement | null)
  const winImg = React.useRef(null as HTMLImageElement | null)
  const winSvg = React.useRef(null as SVGSVGElement | null)
  const winOuter = React.useRef(null as SVGPathElement | null)
  const winInner = React.useRef(null as SVGPathElement | null)
  const win = React.useRef({ W: 0, H: 0, grow: 1, open: 0 })

  const paint = React.useCallback(() => {
    const ws = win.current
    const panel = panelRef.current
    const img = winImg.current
    if (!panel || !img || !ws.W) return
    const { W, H, grow, open } = ws
    const ah0 = Math.min(H * 0.6, (W * 0.66) / 0.76)
    const aw0 = ah0 * 0.76
    const ax0 = (W - aw0) / 2
    const ay0 = Math.max(28, H * 0.085)
    const g = Math.min(1, Math.max(0, grow))
    const x = lerp(ax0, 0, open)
    const y = lerp(ay0 + ah0 * (1 - g), 0, open)
    const w = lerp(aw0, W, open)
    const hh = lerp(ah0 * g, H, open)
    const k = 1 - open
    img.style.clipPath = 'path("' + archPath(x, y, w, hh, k, 4) + '")'
    panel.style.setProperty("--ax", ax0 + "px")
    panel.style.setProperty("--ay", ay0 + "px")
    panel.style.setProperty("--aw", aw0 + "px")
    panel.style.setProperty("--ah", ah0 + "px")
    panel.style.setProperty("--open", open.toFixed(3))
    winSvg.current?.setAttribute("viewBox", "0 0 " + W + " " + H)
    winOuter.current?.setAttribute("d", archPath(x - 12, y - 16, w + 24, hh + 16 + 12 * g, k, 4))
    winInner.current?.setAttribute("d", archPath(x + 8, y + 10, Math.max(0, w - 16), Math.max(0, hh - 18), k, 4))
  }, [])

  useIso(() => {
    const panel = panelRef.current
    if (!panel) return
    const measure = () => {
      win.current.W = panel.clientWidth
      win.current.H = panel.clientHeight
      paint()
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(panel)
    return () => ro.disconnect()
  }, [paint])

  const go = (target: string) => {
    setMenu(false)
    onNavigate?.(target)
  }

  const add = (p: { id: string; name: string; price: number }, from?: HTMLElement | null) => {
    const next = addToBag(bagRef.current, p)
    bagRef.current = next
    setBag(next)
    const item = next.find((i) => i.id === p.id)
    if (item) onAddToCart?.(item, next)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), text: p.name + " added to your bag" })
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const r = root.current
    if (!r) return
    gsap.fromTo(r.querySelectorAll(".mat-bag-badge"), { scale: 1.7, rotate: -14 }, { scale: 1, rotate: 0, duration: 0.8, ease: "elastic.out(1, 0.42)", overwrite: true })
    // a drop of henna flies from the button to whichever bag is on screen
    const bags = Array.from(r.querySelectorAll(".mat-bag-btn")) as HTMLElement[]
    const target = bags
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .find((t) => t.rect.width > 0 && t.rect.bottom > 0 && t.rect.top < window.innerHeight && getComputedStyle(t.el).opacity !== "0")
    if (!from || !target) return
    const a = from.getBoundingClientRect()
    const z = target.rect
    const drop = document.createElement("span")
    drop.className = "mat-flydrop"
    drop.style.left = a.left + a.width / 2 + "px"
    drop.style.top = a.top + a.height / 2 + "px"
    r.appendChild(drop)
    const dx = z.left + z.width / 2 - (a.left + a.width / 2)
    const dy = z.top + z.height / 2 - (a.top + a.height / 2)
    gsap
      .timeline({ onComplete: () => drop.remove() })
      .to(drop, { x: dx, duration: 0.8, ease: "power1.in" }, 0)
      .to(drop, { y: dy, duration: 0.8, ease: "back.in(2.2)" }, 0)
      .to(drop, { scale: 0.35, duration: 0.8, ease: "power2.in" }, 0)
      .to(drop, { autoAlpha: 0, duration: 0.12 }, 0.7)
  }

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
      const bar = el.querySelector(".mat-progress i") as HTMLElement | null
      const navbar = el.querySelector(".mat-navbar") as HTMLElement | null
      const band = el.querySelector(".mat-band") as HTMLElement | null
      // once the brand band has scrolled away, the nav picks up the wordmark and the bag
      const stick = () => navbar?.classList.toggle("is-stuck", !!band && band.getBoundingClientRect().bottom <= 1)
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (bar) bar.style.transform = "scaleX(" + self.progress.toFixed(4) + ")"
          stick()
        },
        onRefresh: stick,
      })

      const mm = gsap.matchMedia()
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 900px)" }, (c) => {
        const { motion, wide } = c.conditions as { motion: boolean; wide: boolean }
        const proxy = win.current
        if (!motion) {
          proxy.grow = 1
          proxy.open = 0
          paint()
          return
        }

        // header: the band prints, the wordmark gathers, the tabs drop in
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .from(".mat-strip-in > *", { y: -12, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0)
          .from(".mat-word-ch", { yPercent: 120, rotateX: -80, autoAlpha: 0, duration: 1.2, stagger: 0.05, transformOrigin: "50% 100%" }, 0.1)
          .from(".mat-band-side", { autoAlpha: 0, y: 10, duration: 1, stagger: 0.1 }, 0.3)
          .fromTo(".mat-navbar .mat-brocade", { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: "expo.inOut", transformOrigin: "50% 50%" }, 0.1)
          .from(".mat-tab", { y: -16, autoAlpha: 0, duration: 0.8, stagger: 0.05 }, 0.45)

        // hero: panels open like doors, the frame and filigree draw, the window rises
        proxy.grow = 0
        proxy.open = 0
        paint()
        gsap
          .timeline({ defaults: { ease: "expo.out" }, delay: 0.15 })
          .fromTo(".mat-panel-l", { clipPath: wide ? "inset(0 100% 0 0)" : "inset(0 0 100% 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.5, ease: "expo.inOut" }, 0)
          .fromTo(".mat-panel-r", { clipPath: wide ? "inset(0 0 0 100%)" : "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0%)", duration: 1.5, ease: "expo.inOut" }, 0.08)
          .fromTo(".mat-hero-frame i", { scaleX: 0, scaleY: 0 }, { scaleX: 1, scaleY: 1, duration: 1.6, ease: "expo.inOut", stagger: 0.06 }, 0.5)
          .fromTo(".mat-hero .mat-filigree .mat-dr", { "--draw": 1 }, { "--draw": 0, duration: 2.4, ease: "power2.inOut", stagger: 0.02 }, 0.6)
          .from(".mat-hero .mat-filigree .mat-fl", { autoAlpha: 0, duration: 1, stagger: 0.015 }, 1.4)
          .fromTo(".mat-split-mandala .mat-ring path", { "--draw": 1 }, { "--draw": 0, duration: 2.4, ease: "power2.inOut", stagger: 0.003 }, 0.7)
          .from(".mat-split-mandala", { rotate: -90, duration: 2.8 }, 0.5)
          .from(".mat-hero-title .mat-word", { yPercent: 115, rotate: 3, duration: 1.4, stagger: 0.14 }, 1.0)
          .fromTo(".mat-hero-flourish .mat-dr", { "--draw": 1 }, { "--draw": 0, duration: 1.6, ease: "power2.inOut" }, 1.4)
          .from(".mat-hero-flourish .mat-fl", { autoAlpha: 0, scale: 0, transformOrigin: "50% 50%", duration: 0.8, stagger: 0.04 }, 1.7)
          .from(".mat-panel-l .mat-rise", { y: 22, autoAlpha: 0, duration: 1, stagger: 0.08 }, 1.3)
          .to(proxy, { grow: 1, duration: 1.8, ease: "expo.inOut", onUpdate: paint }, 0.7)
          .fromTo(".mat-win-line", { "--draw": 1 }, { "--draw": 0, duration: 2, ease: "power2.inOut", stagger: 0.15 }, 1.1)
          .fromTo(".mat-win-img", { scale: 1.25 }, { scale: 1, duration: 2.6, ease: "power3.out" }, 0.7)
          .from(".mat-hero-seal", { scale: 0, rotate: -180, duration: 1.4, ease: "back.out(1.6)" }, 1.8)
          .from(".mat-panel-r .mat-rise", { y: 22, autoAlpha: 0, duration: 1, stagger: 0.08 }, 1.6)

        // hero scroll: the arch swings open into the whole panel; the mandala turns
        gsap.to(proxy, {
          open: 1,
          ease: "none",
          onUpdate: paint,
          scrollTrigger: { trigger: ".mat-panel-r", start: wide ? "top top" : "center center", end: "bottom top", scrub: 0.6 },
        })
        gsap
          .timeline({ scrollTrigger: { trigger: ".mat-hero", start: "top top", end: "bottom top", scrub: 0.6 } })
          .to(".mat-split-mandala", { rotate: 70, ease: "none" }, 0)
          .to(".mat-hero-copy", { yPercent: 22, autoAlpha: 0.2, ease: "none" }, 0)
          .to(".mat-hero .mat-filigree", { scale: 1.12, ease: "none" }, 0)
        gsap.to(".mat-seal-turn", { rotate: 360, svgOrigin: "0 0", duration: 26, ease: "none", repeat: -1 })

        // twin heading: the medallion turns in, the words slide off it
        gsap
          .timeline({ scrollTrigger: { trigger: ".mat-twin", start: "top 82%", toggleActions: "play none none none" }, defaults: { ease: "expo.out" } })
          .from(".mat-twin .mat-emblem", { scale: 0, rotate: -180, duration: 1.4 }, 0)
          .from(".mat-twin-l", { x: 60, autoAlpha: 0, duration: 1.3 }, 0.2)
          .from(".mat-twin-r", { x: -60, autoAlpha: 0, duration: 1.3 }, 0.2)
          .fromTo(".mat-twin .mat-dr", { "--draw": 1 }, { "--draw": 0, duration: 1.6, ease: "power2.inOut" }, 0.3)
          .from(".mat-twin .mat-fl", { autoAlpha: 0, duration: 0.8 }, 0.9)
          .from(".mat-sellers > .mat-lede", { y: 18, autoAlpha: 0, duration: 1 }, 0.5)

        // arched products: frames draw, photos settle into them
        gsap.utils.toArray(".mat-product").forEach((card, i) => {
          const node = card as HTMLElement
          gsap
            .timeline({ scrollTrigger: { trigger: node, start: "top 86%", toggleActions: "play none none none" }, delay: (i % 4) * 0.1 })
            .from(node, { y: 50, autoAlpha: 0, duration: 1.2, ease: "expo.out" }, 0)
            .fromTo(node.querySelectorAll(".mat-arch-line"), { "--draw": 1 }, { "--draw": 0, duration: 1.8, ease: "power2.inOut", stagger: 0.12 }, 0.1)
        })

        // section heads: flourish draws from the lotus outward
        gsap.utils.toArray(".mat-head").forEach((head) => {
          const node = head as HTMLElement
          gsap
            .timeline({ scrollTrigger: { trigger: node, start: "top 82%", toggleActions: "play none none none" } })
            .from(node.querySelectorAll(".mat-rise"), { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, 0)
            .fromTo(node.querySelectorAll(".mat-dr"), { "--draw": 1 }, { "--draw": 0, duration: 1.6, ease: "power2.inOut" }, 0.2)
            .from(node.querySelectorAll(".mat-fl"), { autoAlpha: 0, duration: 0.7, stagger: 0.03 }, 0.6)
        })

        // bento: tiles unfold, the framed label draws, the list deals in
        gsap
          .timeline({ scrollTrigger: { trigger: ".mat-bento", start: "top 78%", toggleActions: "play none none none" }, defaults: { ease: "expo.out" } })
          .from(".mat-bento > *", { clipPath: "inset(10% 10% 10% 10%)", autoAlpha: 0, duration: 1.3, stagger: 0.1 }, 0)
          .fromTo(".mat-frame-box i", { scaleX: 0, scaleY: 0 }, { scaleX: 1, scaleY: 1, duration: 1.2, ease: "expo.inOut", stagger: 0.05 }, 0.5)
          .from(".mat-design-row", { x: 26, autoAlpha: 0, duration: 0.8, stagger: 0.06 }, 0.6)
          .fromTo(".mat-bento .mat-filigree .mat-dr", { "--draw": 1 }, { "--draw": 0, duration: 2, ease: "power2.inOut" }, 0.4)
        gsap.fromTo(".mat-tile-img", { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: ".mat-bento", start: "top bottom", end: "bottom top", scrub: true } })

        // collection plates: they lift out of the page; each medallion turns with scroll
        gsap.from(".mat-plate", {
          y: 70,
          rotateX: -14,
          transformPerspective: 900,
          transformOrigin: "50% 100%",
          autoAlpha: 0,
          duration: 1.3,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: ".mat-plates", start: "top 85%", toggleActions: "play none none none" },
        })
        gsap.to(".mat-plate-mandala", { rotate: 120, ease: "none", scrollTrigger: { trigger: ".mat-plates", start: "top bottom", end: "bottom top", scrub: true } })

        // heritage: the paisleys draw themselves, then sway with scroll
        gsap
          .timeline({ scrollTrigger: { trigger: ".mat-heritage", start: "top 70%", toggleActions: "play none none none" } })
          .fromTo(".mat-heritage .mat-paisley .mat-dr", { "--draw": 1 }, { "--draw": 0, duration: 3, ease: "power2.inOut", stagger: 0.08 }, 0)
          .from(".mat-heritage .mat-paisley .mat-fills", { autoAlpha: 0, duration: 1.6, ease: "power2.out" }, 1.2)
          .fromTo(".mat-heritage .mat-filigree .mat-dr", { "--draw": 1 }, { "--draw": 0, duration: 2.2, ease: "power2.inOut" }, 0.2)
          .from(".mat-heritage .mat-filigree .mat-fl", { autoAlpha: 0, duration: 1 }, 1.2)
          .from(".mat-heritage-in .mat-rise", { y: 26, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, 0.3)
          .fromTo(".mat-heritage-in .mat-dr", { "--draw": 1 }, { "--draw": 0, duration: 1.6, ease: "power2.inOut" }, 0.6)
          .from(".mat-heritage-in .mat-emblem", { scale: 0, rotate: -120, duration: 1.4, ease: "back.out(1.6)" }, 1)
        gsap
          .timeline({ scrollTrigger: { trigger: ".mat-heritage", start: "top bottom", end: "bottom top", scrub: true } })
          .fromTo(".mat-paisley-l", { yPercent: 8, rotate: -16 }, { yPercent: -8, rotate: -6, ease: "none" }, 0)
          .fromTo(".mat-paisley-r", { yPercent: 8, rotate: 16 }, { yPercent: -8, rotate: 6, ease: "none" }, 0)

        // the stain study
        gsap
          .timeline({ scrollTrigger: { trigger: ".mat-studysec", start: "top 72%", toggleActions: "play none none none" } })
          .from(".mat-studysec .mat-rise", { y: 26, autoAlpha: 0, duration: 1, stagger: 0.07, ease: "power3.out" }, 0)
          .fromTo(".mat-study-flourish .mat-dr", { "--draw": 1 }, { "--draw": 0, duration: 1.4, ease: "power2.inOut" }, 0.3)
          .from(".mat-thaali-rim", { rotate: -90, scale: 0.7, duration: 1.8, ease: "expo.out" }, 0.1)
          .fromTo(".mat-skin-mandala .mat-ring path", { "--draw": 1 }, { "--draw": 0, duration: 2.4, ease: "power2.inOut", stagger: 0.004 }, 0.4)

        // footer: the medallion turns with the last of the scroll
        gsap.to(".mat-footer-mandala", { rotate: 90, ease: "none", scrollTrigger: { trigger: ".mat-footer", start: "top bottom", end: "bottom bottom", scrub: true } })
        gsap.from(".mat-footer-brand > *", { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".mat-footer", start: "top 85%", toggleActions: "play none none none" } })
      })
    }, el)
    return () => ctx.revert()
  }, [paint])

  const count = bagCount(bag)
  const total = bagTotal(bag)
  const themeClass = theme === "dark" ? " mat-dark" : theme === "light" ? " mat-light" : ""
  const marquee = [...announcements, ...announcements]
  const chosen = dz.items[design] ?? dz.items[0]

  const bagButton = (extra: string) => (
    <button type="button" className={"mat-bag-btn " + extra} aria-label={"Bag, " + count + " item" + (count === 1 ? "" : "s")} onClick={() => setDrawer(true)}>
      <Icon name="bag" />
      <span className={"mat-bag-badge" + (count ? " is-on" : "")} aria-hidden="true">
        {count}
      </span>
    </button>
  )

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
          "--caps": CAPS,
          "--label": LABEL,
        } as React.CSSProperties
      }
    >
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* the page is the size container; the fixed overlays below sit outside it,
          because a container is the containing block for position:fixed */}
      <div className="mat-page">
      {/* announcement strip with search */}
      <div className="mat-strip">
        <div className="mat-strip-in">
          <div className="mat-marquee" aria-hidden="true">
            <div className="mat-marquee-track">
              {marquee.map((t, i) => (
                <span key={i}>
                  <Rosette size={10} /> {t}
                </span>
              ))}
            </div>
          </div>
          <p className="mat-sr">{announcements.join(". ")}</p>
          <form
            className="mat-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              go("search:" + query.trim())
            }}
          >
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cones, powder, artists…" aria-label="Search the atelier" />
            <button type="submit" aria-label="Search">
              <Icon name="search" />
            </button>
          </form>
        </div>
      </div>

      {/* brand band on damask */}
      <div className="mat-band">
        <Damask className="mat-band-damask" />
        <div className="mat-band-in">
          <div className="mat-band-side is-left">
            <Emblem size={46} />
            <span>
              {b.tagline}
              <small>{b.est}</small>
            </span>
          </div>
          <button type="button" className="mat-wordmark" onClick={() => go("home")} aria-label={b.name + ", home"}>
            {Array.from(b.name.toUpperCase()).map((chr, i) => (
              <span key={i} className="mat-word-ch" aria-hidden="true">
                {chr}
              </span>
            ))}
          </button>
          <div className="mat-band-side is-right">
            <button type="button" className="mat-icon-btn mat-only-narrow" aria-label="Search" onClick={() => go("search")}>
              <Icon name="search" />
            </button>
            <button type="button" className="mat-icon-btn" aria-label="Account" onClick={() => go("account")}>
              <Icon name="user" />
            </button>
            <button type="button" className="mat-icon-btn mat-only-wide" aria-label="Wishlist" onClick={() => go("wishlist")}>
              <Icon name="heart" />
            </button>
            {bagButton("mat-icon-btn")}
            <span className="mat-band-total mat-only-wide">{formatPrice(total, currency)}</span>
          </div>
        </div>
      </div>

      {/* tabbed nav: sticks, picks up the wordmark and the bag when it does */}
      <header className="mat-navbar">
        <Brocade className="mat-navbar-edge" />
        <div className="mat-navbar-in">
          <button type="button" className="mat-mini-mark" onClick={() => go("home")} tabIndex={-1} aria-hidden="true">
            <Rosette size={18} /> {b.name.toUpperCase()}
          </button>
          <button type="button" className="mat-burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <span className="mat-burger-lines" aria-hidden="true">
              <i />
              <i />
            </span>
            Menu
          </button>
          <nav className={"mat-nav" + (menu ? " is-open" : "")} aria-label="Primary">
            {nav.map((n) => (
              <div key={n.label} className={"mat-tab" + (n.children?.length ? " has-sub" : "")}>
                <a
                  href={n.href ?? "#"}
                  onClick={(e) => {
                    if (!n.href) e.preventDefault()
                    go(n.label.toLowerCase())
                  }}
                >
                  {n.label}
                  {!!n.children?.length && <Icon name="chev" />}
                </a>
                {!!n.children?.length && (
                  <div className="mat-sub">
                    <Rosette size={16} className="mat-sub-rosette" />
                    {n.children.map((c) => (
                      <a
                        key={c.label}
                        href={c.href ?? "#"}
                        onClick={(e) => {
                          if (!c.href) e.preventDefault()
                          go(c.label.toLowerCase())
                        }}
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          {bagButton("mat-mini-bag")}
        </div>
        <Brocade className="mat-navbar-edge" />
        <div className="mat-progress" aria-hidden="true">
          <i />
        </div>
      </header>

      {/* hero */}
      <section className="mat-hero" aria-label="Hero">
        <div className="mat-panel mat-panel-l">
          <Damask className="mat-panel-damask" />
          <Mandala seed={seed} className="mat-split-mandala is-l" />
          <Filigree corner="tl" seed={seed} className="mat-hero-fil is-tl" />
          <Filigree corner="bl" seed={seed + 2} className="mat-hero-fil is-bl" />
          <div className="mat-hero-copy">
            <p className="mat-kicker mat-rise">
              <Rosette size={12} /> {h.kicker} <Rosette size={12} />
            </p>
            <h1 className="mat-hero-title" aria-label={h.title.join(" ")}>
              {h.title.map((w, i) => (
                <span key={i} className="mat-line" aria-hidden="true">
                  <span className="mat-word">{w}</span>
                </span>
              ))}
            </h1>
            <Flourish className="mat-hero-flourish" />
            <p className="mat-hero-sub mat-rise">{h.sub}</p>
            <div className="mat-hero-actions mat-rise">
              <button type="button" className="mat-btn mat-btn-line" onClick={() => go("shop")}>
                <Rosette size={16} /> {h.cta}
              </button>
            </div>
            <p className="mat-est mat-rise">{b.est}</p>
          </div>
        </div>
        <div className="mat-panel mat-panel-r" ref={panelRef}>
          <Damask className="mat-panel-damask" />
          <Mandala seed={seed} className="mat-split-mandala is-r" />
          <Filigree corner="tr" seed={seed + 4} className="mat-hero-fil is-tr" />
          <Filigree corner="br" seed={seed + 6} className="mat-hero-fil is-br" />
          <img ref={winImg} className="mat-win-img" src={heroArt.src} alt={heroArt.alt ?? ""} style={{ objectPosition: heroArt.focus }} decoding="async" />
          <div className="mat-win-shade" aria-hidden="true" />
          <svg ref={winSvg} className="mat-win-lines" aria-hidden="true" preserveAspectRatio="none">
            <path ref={winOuter} className="mat-win-line mat-dr" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path ref={winInner} className="mat-win-line mat-dr" pathLength={1} fill="none" stroke="currentColor" strokeWidth="0.9" />
          </svg>
          <Seal text={h.seal} className="mat-hero-seal" />
          <div className="mat-photo-label">
            <p className="mat-kicker mat-rise">
              <Rosette size={12} /> {h.photoKicker} <Rosette size={12} />
            </p>
            <h2 className="mat-photo-title mat-rise">{h.photoTitle}</h2>
            <button type="button" className="mat-btn mat-btn-ghost mat-rise" onClick={() => go("bridal")}>
              {h.photoCta} <Icon name="arrow" />
            </button>
          </div>
        </div>
        <div className="mat-hero-frame" aria-hidden="true">
          <i className="is-t" />
          <i className="is-b" />
          <i className="is-l" />
          <i className="is-r" />
        </div>
        <Brocade className="mat-hero-split" vertical />
        <Brocade className="mat-hero-sill" />
      </section>

      {/* best sellers */}
      <section className="mat-sellers" aria-labelledby="mat-sellers-title">
        <div className="mat-twin">
          <p className="mat-twin-l">{s.lead}</p>
          <div className="mat-twin-mid" aria-hidden="true">
            <Flourish className="mat-twin-flourish" seed={11} />
            <Emblem size={64} />
          </div>
          <h2 id="mat-sellers-title" className="mat-twin-r">
            {s.title}
          </h2>
        </div>
        <p className="mat-lede">{s.blurb}</p>
        <div className="mat-products">
          {products.map((p) => {
            const a = art(p.image, { src: "", alt: p.name, focus: "50% 50%" })
            return (
              <article key={p.id} className="mat-product">
                <ArchPhoto a={a} className="mat-product-arch">
                  {p.badge && <span className="mat-badge">{p.badge}</span>}
                  <button type="button" className="mat-quick" onClick={(e) => add(p, e.currentTarget)}>
                    <Icon name="drop" />
                    <span className="mat-quick-long">Add to bag</span>
                    <span className="mat-quick-short">Add</span>
                  </button>
                </ArchPhoto>
                <Rosette size={14} className="mat-product-rosette" />
                <h3>{p.name}</h3>
                {p.note && <p className="mat-product-note">{p.note}</p>}
                <p className="mat-product-price">{formatPrice(p.price, currency)}</p>
              </article>
            )
          })}
        </div>
      </section>

      {/* collections bento */}
      <section className="mat-edit" aria-label={ch.title}>
        <SectionHead kicker={ch.kicker} title={ch.title} />
        <div className="mat-bento">
          <article className="mat-tile">
            <img className="mat-tile-img" src={featureArt.src} alt={featureArt.alt ?? ""} style={{ objectPosition: featureArt.focus }} loading="lazy" decoding="async" />
            <div className="mat-tile-shade" aria-hidden="true" />
            <div className="mat-frame-box">
              <i className="is-t" />
              <i className="is-b" />
              <i className="is-l" />
              <i className="is-r" />
              <p className="mat-kicker">{f.kicker}</p>
              <h3>{f.title}</h3>
              <p className="mat-frame-blurb">{f.blurb}</p>
              <button type="button" className="mat-btn mat-btn-gold" onClick={() => go("trousseau")}>
                {f.cta} <Icon name="arrow" />
              </button>
            </div>
          </article>
          {highlights.slice(0, 2).map((hl, i) => (
            <article key={hl.title} className={"mat-hl" + (i ? " is-deep" : "")}>
              <Damask className="mat-hl-damask" />
              <Filigree corner="tl" seed={seed + 30 + i} className="mat-hl-fil" />
              <div className="mat-hl-in">
                <h3>{hl.title}</h3>
                <p>{hl.blurb}</p>
                <button type="button" className="mat-btn mat-btn-sm mat-btn-copper" onClick={() => go(hl.title.toLowerCase())}>
                  {hl.cta ?? "Explore"}
                </button>
              </div>
            </article>
          ))}
          <article className="mat-designs">
            <Filigree corner="tl" seed={seed + 40} className="mat-designs-fil is-tl" />
            <Filigree corner="tr" seed={seed + 41} className="mat-designs-fil is-tr" />
            <Filigree corner="bl" seed={seed + 42} className="mat-designs-fil is-bl" />
            <Filigree corner="br" seed={seed + 43} className="mat-designs-fil is-br" />
            <div className="mat-designs-in">
              <p className="mat-kicker">{dz.kicker}</p>
              <h3>{dz.title}</h3>
              <p className="mat-designs-blurb">{dz.blurb}</p>
              <div className="mat-design-list" role="radiogroup" aria-label={dz.title}>
                {dz.items.map((it, i) => (
                  <button key={it.name} type="button" role="radio" aria-checked={i === design} className={"mat-design-row" + (i === design ? " is-on" : "")} onClick={() => setDesign(i)}>
                    <span>{it.name}</span>
                    <small>{it.time}</small>
                  </button>
                ))}
              </div>
              <p className="mat-design-sum" aria-live="polite">
                <span>From</span> <b>{formatPrice(chosen?.price ?? 0, currency)}</b> <span>· {chosen?.time}</span>
              </p>
              <button type="button" className="mat-btn mat-btn-maroon" onClick={() => go("book:" + (chosen?.name ?? ""))}>
                {dz.cta} <Icon name="arrow" />
              </button>
            </div>
          </article>
        </div>

        <div className="mat-plates">
          {collections.map((c, i) => (
            <article key={c.id} className={"mat-plate is-" + (c.tone ?? "sand")}>
              <Damask className="mat-plate-damask" />
              <Mandala seed={seed + 20 + i} className="mat-plate-mandala" fill={false} strokeWidth={0.6} />
              <div className="mat-plate-in">
                <Emblem size={34} />
                <h3>{c.title}</h3>
                <p>{c.blurb}</p>
                <a
                  href={c.href ?? "#"}
                  className="mat-btn mat-btn-sm mat-btn-copper"
                  onClick={(e) => {
                    if (!c.href) e.preventDefault()
                    go(c.id)
                  }}
                >
                  {c.cta ?? "Explore"}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* heritage */}
      <section className="mat-heritage" aria-labelledby="mat-heritage-title">
        <Damask className="mat-heritage-damask" />
        <Filigree corner="tl" seed={seed + 50} className="mat-her-fil is-tl" />
        <Filigree corner="tr" seed={seed + 51} className="mat-her-fil is-tr" />
        <Filigree corner="bl" seed={seed + 52} className="mat-her-fil is-bl" />
        <Filigree corner="br" seed={seed + 53} className="mat-her-fil is-br" />
        <Paisley seed={seed} className="mat-paisley-l" />
        <Paisley seed={seed + 1} className="mat-paisley-r" flip />
        <div className="mat-heritage-in">
          <p className="mat-kicker mat-rise">
            <Rosette size={12} /> {her.kicker} <Rosette size={12} />
          </p>
          <h2 id="mat-heritage-title" className="mat-h2 mat-rise">
            {her.title}
          </h2>
          <Flourish className="mat-heritage-flourish" seed={6} />
          {her.body.map((para, i) => (
            <p key={i} className="mat-heritage-p mat-rise">
              {para}
            </p>
          ))}
          <button type="button" className="mat-btn mat-btn-maroon mat-rise" onClick={() => go("story")}>
            {her.cta} <Icon name="arrow" />
          </button>
          <Emblem size={72} className="mat-heritage-emblem" />
        </div>
      </section>

      {/* stain study */}
      <section className="mat-studysec" aria-label={st.title}>
        <StainStudy seed={seed} shades={shades} copy={st} />
      </section>

      {/* footer */}
      <footer className="mat-footer">
        <Brocade className="mat-footer-edge" />
        <Damask className="mat-footer-damask" />
        <Mandala seed={seed + 40} className="mat-footer-mandala" fill={false} strokeWidth={0.5} />
        <div className="mat-footer-brand">
          <Emblem size={56} />
          <p className="mat-footer-name">{b.name.toUpperCase()}</p>
          <p className="mat-footer-tag">{b.tagline}</p>
          <Flourish className="mat-footer-flourish" seed={13} />
        </div>
        <div className="mat-footer-in">
          <div className="mat-footer-cols">
            {[
              { title: "Shop", links: ["Powder", "Cones", "Tattoos", "Kits", "Gift cards"] },
              { title: "Atelier", links: ["Bridal booking", "Find an artist", "Workshops", "Journal"] },
              { title: "Help", links: ["Shipping", "Stain care", "Returns", "Contact"] },
            ].map((col) => (
              <div key={col.title}>
                <p>{col.title}</p>
                {col.links.map((l) => (
                  <a
                    key={l}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      go(l.toLowerCase())
                    }}
                  >
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <form
            className="mat-news"
            onSubmit={(e) => {
              e.preventDefault()
              go("newsletter")
            }}
          >
            <p>Letters from the atelier</p>
            <div className="mat-news-row">
              <input type="email" placeholder="your@email.com" aria-label="Email address" required />
              <button type="submit" className="mat-btn mat-btn-gold">
                Join
              </button>
            </div>
            <small>One letter a month: the season's leaf, new motifs, early bridal dates.</small>
          </form>
        </div>
        <div className="mat-footer-bottom">
          <span>
            © {new Date().getFullYear()} {b.name}. {b.est}.
          </span>
          <span>Henna is a plant. Patch-test first. Never black henna.</span>
        </div>
      </footer>
      </div>

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
          <Brocade className="mat-drawer-edge" />
          {bag.length === 0 ? (
            <div className="mat-drawer-empty">
              <Emblem size={96} />
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
.mat-root{--paper:var(--c-paper);--ink:var(--c-ink);--maroon:var(--c-maroon);--olive:var(--c-olive);--gold:var(--c-gold);--sand:var(--c-sand);--rose:var(--c-rose);--mat-maroon:var(--c-maroon);--mat-sand:var(--c-sand);--deep:color-mix(in oklab,var(--c-maroon) 78%,#0c0406);--copper:color-mix(in oklab,var(--c-gold) 55%,var(--c-maroon));--gold-hi:color-mix(in oklab,var(--c-gold) 50%,#fff3cf);--gold-lo:color-mix(in oklab,var(--c-gold) 62%,#3b2306);--cream:color-mix(in oklab,var(--c-paper) 72%,#ffffff);--soft:color-mix(in oklab,var(--ink) 70%,var(--paper));--line:color-mix(in oklab,var(--gold) 55%,transparent);--on-dark:color-mix(in oklab,var(--c-paper) 94%,#ffffff);--gilt:linear-gradient(100deg,var(--gold-lo) 0%,var(--gold-hi) 26%,var(--gold) 46%,var(--gold-hi) 64%,var(--gold-lo) 100%);position:relative;isolation:isolate;width:100%;background:var(--paper);color:var(--ink);font-family:var(--display);-webkit-font-smoothing:antialiased}
.mat-page{position:relative;width:100%;container-type:inline-size;overflow-x:clip}
.mat-root.mat-dark,:where(.dark) .mat-root:not(.mat-light){--paper:color-mix(in oklab,var(--c-ink) 84%,#000);--ink:var(--c-paper);--sand:color-mix(in oklab,var(--c-gold) 30%,color-mix(in oklab,var(--c-ink) 82%,#000));--rose:color-mix(in oklab,var(--c-rose) 34%,color-mix(in oklab,var(--c-maroon) 60%,#000));--mat-sand:color-mix(in oklab,var(--c-gold) 30%,color-mix(in oklab,var(--c-ink) 82%,#000));--cream:color-mix(in oklab,var(--c-ink) 76%,#000);--soft:color-mix(in oklab,var(--c-paper) 70%,var(--c-ink))}
:where(.mat-root) button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
:where(.mat-root) :where(p,h1,h2,h3,ul){margin:0}
:where(.mat-root) ul{padding:0;list-style:none}
:where(.mat-root) a{color:inherit;text-decoration:none}
.mat-root button:focus-visible,.mat-root a:focus-visible,.mat-root input:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.mat-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.mat-root::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.55;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45 0 0 0 0 .3 0 0 0 0 .15 0 0 0 .09 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.mat-mandala{display:block;color:var(--gold);overflow:visible}
.mat-ring path,.mat-dr{stroke-dasharray:1;stroke-dashoffset:var(--draw,0)}
.mat-rosette,.mat-emblem{display:inline-block;vertical-align:middle;color:var(--gold);flex:none}
.mat-brocade{display:block;width:100%;height:16px;color:var(--gold)}
.mat-brocade.is-v{width:16px;height:100%}
.mat-damask{position:absolute;inset:0;width:100%;height:100%;color:var(--gold);opacity:.1;pointer-events:none}
.mat-filigree{display:block;color:var(--gold);overflow:visible;pointer-events:none}
.mat-flourish{display:block;width:min(300px,80%);height:auto;color:var(--gold);overflow:visible}
.mat-paisley{display:block;color:var(--gold);overflow:visible;pointer-events:none}
.mat-kicker{display:flex;align-items:center;justify-content:center;gap:10px;font:500 11px/1.3 var(--caps);letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}
.mat-kicker.is-left{justify-content:flex-start}
.mat-h2{font-family:var(--display);font-weight:500;font-size:clamp(40px,5.2cqw,72px);line-height:1.02;letter-spacing:-.005em;color:var(--maroon)}
.mat-root.mat-dark .mat-h2,:where(.dark) .mat-root:not(.mat-light) .mat-h2{color:var(--gold-hi)}
.mat-lede{font:400 19px/1.6 var(--display);max-width:46ch;color:var(--soft)}
.mat-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;margin:0 auto clamp(34px,4.5cqw,56px)}

/* buttons */
.mat-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:48px;padding:0 26px;border-radius:999px;font:500 12px/1 var(--caps);letter-spacing:.18em;text-transform:uppercase;border:1px solid transparent;white-space:nowrap;transition:transform .3s cubic-bezier(.2,.8,.2,1),background .3s,color .3s,border-color .3s,box-shadow .3s}
.mat-btn svg{transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.mat-btn:hover svg{transform:translateX(3px)}
.mat-btn:hover .mat-rosette{transform:rotate(90deg)}
.mat-btn:active{transform:scale(.97)}
.mat-btn:disabled{opacity:.45;cursor:not-allowed}
.mat-btn-line{border-color:var(--gold);color:var(--gold-hi);background:color-mix(in oklab,var(--gold) 8%,transparent);box-shadow:inset 0 0 0 3px color-mix(in oklab,var(--maroon) 80%,transparent),inset 0 0 0 4px color-mix(in oklab,var(--gold) 40%,transparent)}
.mat-btn-line:hover{background:var(--gold);color:#2a1308}
.mat-btn-line:hover .mat-rosette{color:#2a1308}
.mat-btn-gold{background:var(--gilt);background-size:200% 100%;color:#2a1308;border-color:var(--gold);transition:background-position .6s,transform .3s,box-shadow .3s}
.mat-btn-gold:hover{background-position:100% 0;box-shadow:0 12px 30px -14px color-mix(in oklab,var(--gold) 80%,transparent)}
.mat-btn-ghost{border-color:color-mix(in oklab,var(--gold) 70%,transparent);color:var(--on-dark);background:color-mix(in oklab,var(--olive) 40%,transparent);backdrop-filter:blur(4px)}
.mat-btn-ghost:hover{background:var(--gold);color:#2a1308;border-color:var(--gold)}
.mat-btn-maroon{background:var(--maroon);color:var(--on-dark);border-color:var(--maroon);box-shadow:inset 0 0 0 3px var(--maroon),inset 0 0 0 4px color-mix(in oklab,var(--gold) 55%,transparent)}
.mat-btn-maroon:hover{background:var(--deep)}
.mat-btn-copper{background:var(--copper);color:var(--on-dark);border-color:var(--copper)}
.mat-btn-copper:hover{background:var(--gold);color:#2a1308;border-color:var(--gold)}
.mat-btn-sm{height:38px;padding:0 20px;font-size:10px}
.mat-btn-wide{width:100%}

/* strip */
.mat-strip{position:relative;z-index:32;background:var(--deep);color:var(--gold);border-bottom:1px solid color-mix(in oklab,var(--gold) 30%,transparent)}
.mat-strip-in{display:flex;align-items:center;gap:20px;height:38px;padding:0 clamp(16px,3cqw,40px)}
.mat-marquee{flex:1;min-width:0;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.mat-marquee-track{display:flex;width:max-content;gap:54px;font:500 10.5px/38px var(--caps);letter-spacing:.2em;text-transform:uppercase;animation:mat-marquee 52s linear infinite}
.mat-marquee:hover .mat-marquee-track{animation-play-state:paused}
.mat-marquee-track span{display:inline-flex;align-items:center;gap:10px;white-space:nowrap}
@keyframes mat-marquee{to{transform:translateX(-50%)}}
.mat-search{display:flex;align-items:center;height:26px;width:min(280px,30cqw);border-radius:3px;background:color-mix(in oklab,var(--c-paper) 94%,#fff);color:var(--c-ink);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--gold) 60%,transparent)}
.mat-search input{flex:1;min-width:0;height:100%;padding:0 10px;border:0;background:none;color:inherit;font:400 13px/1 var(--label);outline:none}
.mat-search input::placeholder{color:color-mix(in oklab,var(--c-ink) 45%,transparent)}
.mat-search button{display:grid;place-items:center;width:30px;height:26px;border-radius:0 3px 3px 0;background:var(--gold);color:#2a1308}

/* brand band */
.mat-band{position:relative;z-index:2;overflow:hidden;background:linear-gradient(180deg,color-mix(in oklab,var(--gold) 34%,var(--paper)) 0%,color-mix(in oklab,var(--gold) 22%,var(--paper)) 100%)}
.mat-band-damask{opacity:.32;color:color-mix(in oklab,var(--gold) 80%,var(--maroon))}
.mat-root.mat-dark .mat-band,:where(.dark) .mat-root:not(.mat-light) .mat-band{background:linear-gradient(180deg,color-mix(in oklab,var(--gold) 22%,var(--paper)),color-mix(in oklab,var(--gold) 12%,var(--paper)))}
.mat-band-in{position:relative;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;height:96px;padding:0 clamp(16px,3cqw,40px)}
.mat-band-side{display:flex;align-items:center;gap:12px}
.mat-band-side.is-left{font:500 11px/1.35 var(--caps);letter-spacing:.2em;text-transform:uppercase;color:var(--maroon)}
.mat-band-side.is-left .mat-emblem{color:var(--maroon)}
.mat-band-side.is-left small{display:block;font:italic 400 14px/1.3 var(--display);letter-spacing:.02em;text-transform:none;color:var(--soft)}
.mat-root.mat-dark .mat-band-side.is-left,.mat-root.mat-dark .mat-band-side.is-left .mat-emblem,:where(.dark) .mat-root:not(.mat-light) .mat-band-side.is-left,:where(.dark) .mat-root:not(.mat-light) .mat-band-side.is-left .mat-emblem{color:var(--gold-hi)}
.mat-band-side.is-right{justify-content:flex-end;gap:4px}
.mat-band-total{margin-left:6px;font:500 13px/1 var(--label);letter-spacing:.06em;color:var(--maroon)}
.mat-root.mat-dark .mat-band-total,:where(.dark) .mat-root:not(.mat-light) .mat-band-total{color:var(--gold-hi)}
.mat-wordmark{display:flex;gap:.12em;font:600 clamp(34px,4.2cqw,56px)/1 var(--caps);letter-spacing:.06em;perspective:600px;color:var(--maroon);text-shadow:0 1px 0 color-mix(in oklab,var(--gold-hi) 80%,transparent),0 -1px 0 color-mix(in oklab,var(--maroon) 40%,#000)}
.mat-root.mat-dark .mat-wordmark,:where(.dark) .mat-root:not(.mat-light) .mat-wordmark{color:var(--gold-hi);text-shadow:none}
.mat-word-ch{display:inline-block}
.mat-icon-btn,.mat-mini-bag{position:relative;display:grid;place-items:center;width:42px;height:42px;border-radius:999px;color:var(--maroon);transition:background .25s,color .25s}
.mat-root.mat-dark .mat-icon-btn,:where(.dark) .mat-root:not(.mat-light) .mat-icon-btn{color:var(--gold-hi)}
.mat-icon-btn:hover{background:var(--maroon);color:var(--gold-hi)}
.mat-bag-badge{position:absolute;top:2px;right:1px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:var(--maroon);color:var(--gold-hi);box-shadow:0 0 0 1.5px var(--gold);font:600 10px/18px var(--label);transform:scale(0);transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.mat-bag-badge.is-on{transform:scale(1)}
.mat-only-narrow{display:none}

/* navbar */
.mat-navbar{position:sticky;top:0;z-index:30;background:linear-gradient(180deg,color-mix(in oklab,var(--maroon) 90%,#fff) 0%,var(--maroon) 40%,var(--deep) 100%);color:var(--gold-hi);box-shadow:0 12px 28px -18px rgba(0,0,0,.55)}
.mat-navbar-edge{height:12px;opacity:.85}
.mat-navbar-in{position:relative;display:flex;align-items:stretch;justify-content:center;height:52px;padding:0 clamp(12px,2.4cqw,32px)}
.mat-nav{display:flex;align-items:stretch}
.mat-tab{position:relative;display:flex;border-left:1px solid color-mix(in oklab,var(--gold) 40%,transparent)}
.mat-tab:last-child{border-right:1px solid color-mix(in oklab,var(--gold) 40%,transparent)}
.mat-tab > a{display:flex;align-items:center;gap:8px;padding:0 clamp(14px,1.8cqw,28px);font:500 12px/1 var(--caps);letter-spacing:.2em;text-transform:uppercase;color:var(--gold-hi);transition:background .25s,color .25s}
.mat-tab > a svg{opacity:.7;transition:transform .3s}
.mat-tab:hover > a,.mat-tab:focus-within > a{background:color-mix(in oklab,var(--gold) 16%,transparent);color:#fff}
.mat-tab:hover > a svg,.mat-tab:focus-within > a svg{transform:rotate(180deg)}
.mat-tab::after{content:"";position:absolute;left:50%;bottom:6px;width:5px;height:5px;background:var(--gold);transform:translateX(-50%) rotate(45deg) scale(0);transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.mat-tab:hover::after{transform:translateX(-50%) rotate(45deg) scale(1)}
.mat-sub{position:absolute;top:100%;left:-1px;min-width:220px;display:flex;flex-direction:column;padding:20px 8px 10px;background:var(--cream);border:1px solid var(--line);box-shadow:0 30px 60px -30px rgba(0,0,0,.5);opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .25s,transform .35s cubic-bezier(.2,.8,.2,1),visibility .25s;z-index:5}
.mat-sub::before{content:"";position:absolute;inset:4px;border:1px solid color-mix(in oklab,var(--gold) 35%,transparent);pointer-events:none}
.mat-sub-rosette{position:absolute;top:-9px;left:22px;background:var(--cream);border-radius:50%}
.mat-tab:hover .mat-sub,.mat-tab:focus-within .mat-sub{opacity:1;visibility:visible;transform:translateY(0)}
.mat-sub a{position:relative;padding:11px 14px;font:500 18px/1.1 var(--display);color:var(--ink);transition:color .2s,padding .3s}
.mat-sub a:hover{color:var(--maroon);padding-left:20px}
.mat-sub a::before{content:"";position:absolute;left:6px;top:50%;width:5px;height:5px;background:var(--gold);transform:translateY(-50%) rotate(45deg) scale(0);transition:transform .25s}
.mat-sub a:hover::before{transform:translateY(-50%) rotate(45deg) scale(1)}
.mat-mini-mark{position:absolute;left:clamp(12px,2.4cqw,32px);top:50%;display:flex;align-items:center;gap:8px;font:600 17px/1 var(--caps);letter-spacing:.14em;color:var(--gold-hi);opacity:0;transform:translate(-10px,-50%);pointer-events:none;transition:opacity .4s,transform .4s cubic-bezier(.2,.8,.2,1)}
.mat-mini-bag{position:absolute;right:clamp(8px,2cqw,28px);top:50%;color:var(--gold-hi);opacity:0;transform:translate(10px,-50%);pointer-events:none;transition:opacity .4s,transform .4s cubic-bezier(.2,.8,.2,1),background .25s}
.mat-mini-bag:hover{background:color-mix(in oklab,var(--gold) 20%,transparent)}
.mat-navbar.is-stuck .mat-mini-mark,.mat-navbar.is-stuck .mat-mini-bag{opacity:1;transform:translate(0,-50%);pointer-events:auto}
.mat-burger{display:none;align-items:center;gap:10px;font:500 12px/1 var(--caps);letter-spacing:.2em;text-transform:uppercase;color:var(--gold-hi)}
.mat-burger-lines{position:relative;display:block;width:18px;height:12px}
.mat-burger-lines i{position:absolute;left:0;right:0;height:1.5px;background:currentColor;transition:transform .3s,top .3s}
.mat-burger-lines i:first-child{top:2px}
.mat-burger-lines i:last-child{top:9px}
.mat-burger[aria-expanded=true] .mat-burger-lines i:first-child{top:5.5px;transform:rotate(45deg)}
.mat-burger[aria-expanded=true] .mat-burger-lines i:last-child{top:5.5px;transform:rotate(-45deg)}
.mat-progress{position:absolute;left:0;right:0;bottom:0;height:2px;overflow:hidden}
.mat-progress i{display:block;height:100%;background:var(--gilt);transform:scaleX(0);transform-origin:0 50%}

/* hero */
.mat-hero{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;height:var(--h);min-height:660px;overflow:hidden;background:var(--deep)}
.mat-panel{position:relative;overflow:hidden;clip-path:inset(0 0 0 0)}
.mat-panel-l{background:radial-gradient(90% 70% at 30% 40%,color-mix(in oklab,var(--maroon) 88%,var(--gold)) 0%,var(--maroon) 46%,var(--deep) 100%);color:var(--on-dark)}
.mat-panel-r{background:radial-gradient(90% 70% at 60% 45%,color-mix(in oklab,var(--olive) 86%,var(--gold)) 0%,var(--olive) 50%,color-mix(in oklab,var(--olive) 70%,#000) 100%);color:var(--on-dark)}
.mat-panel-damask{opacity:.09}
.mat-split-mandala{position:absolute;top:50%;width:min(78%,calc(var(--h) * .8));aspect-ratio:1;height:auto;opacity:.5;will-change:transform}
.mat-split-mandala.is-l{right:0;translate:50% -50%}
.mat-split-mandala.is-r{left:0;translate:-50% -50%;opacity:.4}
.mat-hero-fil{position:absolute;width:clamp(150px,19cqw,290px);height:auto;aspect-ratio:1;opacity:.9;z-index:1}
.mat-hero-fil.is-tl{left:12px;top:12px;transform-origin:0 0}
.mat-hero-fil.is-bl{left:12px;bottom:22px;transform-origin:0 100%}
.mat-hero-fil.is-tr{right:12px;top:12px;transform-origin:100% 0}
.mat-hero-fil.is-br{right:12px;bottom:22px;transform-origin:100% 100%}
.mat-hero-copy::before{content:"";position:absolute;left:50%;top:50%;width:min(620px,92%);aspect-ratio:1;translate:-50% -50%;z-index:-1;background:radial-gradient(closest-side,color-mix(in oklab,var(--maroon) 92%,#000) 0%,color-mix(in oklab,var(--maroon) 70%,transparent) 55%,transparent 100%);pointer-events:none}
.mat-hero-copy{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;height:100%;padding:clamp(40px,6cqw,96px) clamp(24px,5cqw,80px);gap:18px}
.mat-hero-title{font-family:var(--display);font-weight:500;font-size:clamp(68px,9.2cqw,150px);line-height:.88;letter-spacing:-.01em;margin:6px 0 0}
.mat-line{display:block;overflow:hidden;padding:.02em .1em .12em;margin-bottom:-.1em}
.mat-word{display:inline-block;background:var(--gilt);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:mat-gilt 7s ease-in-out infinite alternate;will-change:transform}
.mat-line:nth-child(2) .mat-word{font-style:italic;font-weight:500}
@keyframes mat-gilt{from{background-position:0% 0}to{background-position:100% 0}}
.mat-hero-flourish{width:min(260px,70%)}
.mat-hero-sub{font:400 clamp(17px,1.4cqw,21px)/1.55 var(--display);max-width:34ch;color:color-mix(in oklab,var(--on-dark) 84%,transparent)}
.mat-hero-actions{margin-top:8px}
.mat-est{font:500 10.5px/1 var(--caps);letter-spacing:.3em;text-transform:uppercase;color:color-mix(in oklab,var(--gold) 80%,transparent)}
.mat-win-img{position:absolute;inset:0;z-index:2;width:100%;height:100%;max-width:none;object-fit:cover;clip-path:inset(8% 17% 34% 17% round 50% 50% 0 0);will-change:transform}
.mat-win-shade{position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(180deg,transparent 40%,color-mix(in oklab,var(--olive) 92%,#000) 100%);opacity:var(--open,0)}
.mat-win-lines{position:absolute;inset:0;z-index:3;width:100%;height:100%;color:var(--gold);pointer-events:none;opacity:calc(1 - var(--open,0) * 1.4);filter:drop-shadow(0 0 6px color-mix(in oklab,var(--gold) 40%,transparent))}
.mat-hero-seal{position:absolute;z-index:4;width:clamp(92px,9cqw,128px);height:auto;aspect-ratio:1;left:calc(var(--ax,30%) - 46px);top:calc(var(--ay,10%) + var(--ah,60%) * .52);color:var(--gold-hi);opacity:calc(1 - var(--open,0) * 1.6);filter:drop-shadow(0 10px 20px rgba(0,0,0,.35))}
.mat-photo-label{position:absolute;left:24px;right:24px;bottom:clamp(40px,6.5%,72px);z-index:4;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px}
.mat-photo-title{font-family:var(--display);font-weight:500;font-size:clamp(38px,4.2cqw,64px);line-height:1;letter-spacing:.02em;font-variant:small-caps;color:var(--on-dark);text-shadow:0 2px 24px rgba(0,0,0,.45)}
.mat-hero-frame{position:absolute;inset:14px 14px 30px;z-index:5;pointer-events:none}
.mat-hero-frame i{position:absolute;background:color-mix(in oklab,var(--gold) 75%,transparent)}
.mat-hero-frame .is-t,.mat-hero-frame .is-b{left:0;right:0;height:1px;transform-origin:50% 50%}
.mat-hero-frame .is-t{top:0;box-shadow:0 4px 0 -3px var(--gold)}
.mat-hero-frame .is-b{bottom:0;box-shadow:0 -4px 0 -3px var(--gold)}
.mat-hero-frame .is-l,.mat-hero-frame .is-r{top:0;bottom:0;width:1px;transform-origin:50% 50%}
.mat-hero-frame .is-l{left:0;box-shadow:4px 0 0 -3px var(--gold)}
.mat-hero-frame .is-r{right:0;box-shadow:-4px 0 0 -3px var(--gold)}
.mat-hero-split{position:absolute;left:50%;top:0;bottom:16px;margin-left:-8px;z-index:6}
.mat-hero-sill{position:absolute;left:0;right:0;bottom:0;z-index:6;background:var(--deep)}

/* twin heading + products */
.mat-sellers{position:relative;z-index:1;padding:clamp(64px,8cqw,120px) clamp(16px,3.2cqw,48px) clamp(48px,6cqw,96px);text-align:center}
.mat-twin{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:clamp(16px,3cqw,44px);margin-bottom:18px}
.mat-twin-l,.mat-twin-r{font-family:var(--display);font-weight:500;font-size:clamp(34px,4.2cqw,60px);line-height:1;color:var(--maroon)}
.mat-root.mat-dark .mat-twin-l,.mat-root.mat-dark .mat-twin-r,:where(.dark) .mat-root:not(.mat-light) .mat-twin-l,:where(.dark) .mat-root:not(.mat-light) .mat-twin-r{color:var(--gold-hi)}
.mat-twin-l{text-align:right;font-style:italic;color:var(--copper)}
.mat-twin-r{text-align:left}
.mat-twin-mid{position:relative;display:grid;place-items:center;width:clamp(180px,22cqw,300px)}
.mat-twin-flourish{position:absolute;width:100%}
.mat-twin-mid .mat-emblem{position:relative;color:var(--gold);background:var(--paper);border-radius:50%;padding:4px}
.mat-sellers > .mat-lede{margin:0 auto clamp(36px,4.5cqw,60px)}
.mat-products{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(18px,2.6cqw,40px);text-align:center}
.mat-product{display:flex;flex-direction:column;align-items:center;gap:8px}
.mat-arch{position:relative;width:100%;color:var(--gold)}
.mat-arch svg{display:block;width:100%;height:auto;overflow:visible}
.mat-arch-img{transform-box:fill-box;transform-origin:50% 50%;transition:transform 1.1s cubic-bezier(.2,.8,.2,1)}
.mat-arch-tint{fill:var(--maroon);opacity:0;transition:opacity .5s}
.mat-product:hover .mat-arch-img{transform:scale(1.07)}
.mat-product:hover .mat-arch-tint{opacity:.18}
.mat-badge{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);padding:6px 12px;background:var(--maroon);color:var(--gold-hi);font:500 9.5px/1 var(--caps);letter-spacing:.2em;text-transform:uppercase;white-space:nowrap;box-shadow:0 0 0 1px var(--gold),0 0 0 3px var(--maroon),0 0 0 4px color-mix(in oklab,var(--gold) 50%,transparent)}
.mat-quick{position:absolute;left:50%;bottom:9%;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 18px;border-radius:999px;background:var(--gilt);background-size:200% 100%;color:#2a1308;font:500 10.5px/1 var(--caps);letter-spacing:.18em;text-transform:uppercase;white-space:nowrap;opacity:0;transform:translate(-50%,14px);transition:opacity .35s,transform .45s cubic-bezier(.2,.8,.2,1),background-position .6s;box-shadow:0 12px 26px -12px rgba(0,0,0,.5)}
.mat-product:hover .mat-quick,.mat-quick:focus-visible{opacity:1;transform:translate(-50%,0)}
.mat-quick:hover{background-position:100% 0}
.mat-quick-short{display:none}
.mat-product-rosette{margin-top:14px}
.mat-product h3{font:600 clamp(20px,1.7cqw,25px)/1.15 var(--display);color:var(--ink)}
.mat-product-note{font:500 10.5px/1.4 var(--caps);letter-spacing:.16em;text-transform:uppercase;color:var(--soft)}
.mat-product-price{font:italic 500 22px/1 var(--display);color:var(--copper)}
.mat-root.mat-dark .mat-product-price,:where(.dark) .mat-root:not(.mat-light) .mat-product-price{color:var(--gold-hi)}
.mat-flydrop{position:fixed;z-index:80;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--copper);pointer-events:none;box-shadow:0 0 0 2px var(--gold-hi),0 4px 12px rgba(0,0,0,.35)}

/* bento */
.mat-edit{position:relative;z-index:1;padding:clamp(56px,7cqw,104px) clamp(16px,3.2cqw,48px) clamp(64px,8cqw,120px);background:linear-gradient(180deg,transparent,color-mix(in oklab,var(--sand) 40%,transparent) 30%,transparent)}
.mat-bento{display:grid;grid-template-columns:1.25fr 1.25fr 1fr 1.15fr;grid-template-rows:repeat(2,minmax(230px,auto));gap:16px}
.mat-tile{position:relative;grid-column:1 / span 2;grid-row:1 / span 2;overflow:hidden;min-height:480px;background:var(--maroon);box-shadow:inset 0 0 0 1px var(--line)}
.mat-tile-img{position:absolute;inset:-6% 0;width:100%;height:112%;max-width:none;object-fit:cover;will-change:transform}
.mat-tile-shade{position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 60%,transparent 0%,color-mix(in oklab,var(--deep) 55%,transparent) 100%)}
.mat-frame-box{position:absolute;left:50%;bottom:clamp(20px,4%,40px);transform:translateX(-50%);width:min(440px,calc(100% - 40px));display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:28px 30px 26px;background:color-mix(in oklab,var(--cream) 94%,transparent);backdrop-filter:blur(6px)}
.mat-frame-box > i{position:absolute;background:var(--gold)}
.mat-frame-box .is-t,.mat-frame-box .is-b{left:8px;right:8px;height:1px}
.mat-frame-box .is-t{top:8px}
.mat-frame-box .is-b{bottom:8px}
.mat-frame-box .is-l,.mat-frame-box .is-r{top:8px;bottom:8px;width:1px}
.mat-frame-box .is-l{left:8px}
.mat-frame-box .is-r{right:8px}
.mat-frame-box::before,.mat-frame-box::after{content:"";position:absolute;width:7px;height:7px;background:var(--gold);transform:rotate(45deg)}
.mat-frame-box::before{left:4.5px;top:4.5px}
.mat-frame-box::after{right:4.5px;bottom:4.5px}
.mat-frame-box h3{font:500 clamp(30px,3cqw,42px)/1 var(--display);color:var(--maroon);font-variant:small-caps;letter-spacing:.02em}
.mat-root.mat-dark .mat-frame-box h3,:where(.dark) .mat-root:not(.mat-light) .mat-frame-box h3{color:var(--gold-hi)}
.mat-frame-blurb{font:400 16px/1.5 var(--display);color:var(--soft);max-width:36ch}
.mat-hl{position:relative;grid-column:3;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px 22px;background:linear-gradient(160deg,color-mix(in oklab,var(--maroon) 85%,var(--gold)) 0%,var(--maroon) 60%);color:var(--on-dark);box-shadow:inset 0 0 0 1px var(--line),inset 0 0 0 6px var(--maroon),inset 0 0 0 7px color-mix(in oklab,var(--gold) 40%,transparent);transition:translate .5s cubic-bezier(.2,.8,.2,1)}
.mat-hl.is-deep{background:linear-gradient(160deg,var(--maroon) 0%,var(--deep) 70%);box-shadow:inset 0 0 0 1px var(--line),inset 0 0 0 6px var(--deep),inset 0 0 0 7px color-mix(in oklab,var(--gold) 40%,transparent)}
.mat-hl:hover{translate:0 -4px}
.mat-hl-damask{opacity:.12}
.mat-hl-fil{position:absolute;left:4px;top:4px;width:86px;height:auto;aspect-ratio:1;opacity:.85}
.mat-hl-in{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px}
.mat-hl h3{font:500 clamp(22px,1.9cqw,28px)/1.12 var(--caps);letter-spacing:.06em;text-transform:uppercase;color:var(--gold-hi)}
.mat-hl p{font:400 16px/1.45 var(--display);opacity:.86;max-width:24ch}
.mat-designs{position:relative;grid-column:4;grid-row:1 / span 2;overflow:hidden;padding:44px 30px 34px;background:var(--cream);box-shadow:inset 0 0 0 1px var(--line),inset 0 0 0 7px var(--cream),inset 0 0 0 8px color-mix(in oklab,var(--gold) 40%,transparent)}
.mat-designs-fil{position:absolute;width:96px;height:auto;aspect-ratio:1}
.mat-designs-fil.is-tl{left:2px;top:2px}
.mat-designs-fil.is-tr{right:2px;top:2px}
.mat-designs-fil.is-bl{left:2px;bottom:2px}
.mat-designs-fil.is-br{right:2px;bottom:2px}
.mat-designs-in{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;height:100%}
.mat-designs h3{font:500 clamp(26px,2.3cqw,34px)/1.05 var(--caps);letter-spacing:.04em;text-transform:uppercase;color:var(--maroon)}
.mat-root.mat-dark .mat-designs h3,:where(.dark) .mat-root:not(.mat-light) .mat-designs h3{color:var(--gold-hi)}
.mat-designs-blurb{font:italic 400 17px/1.4 var(--display);color:var(--soft)}
.mat-design-list{width:100%;margin-top:6px;border-top:1px solid var(--line)}
.mat-design-row{position:relative;display:flex;justify-content:space-between;align-items:baseline;gap:10px;width:100%;padding:13px 10px;border-bottom:1px solid var(--line);font:500 17px/1.2 var(--display);text-align:left;transition:background .25s,color .25s,padding .3s}
.mat-design-row small{font:500 10px/1 var(--caps);letter-spacing:.14em;text-transform:uppercase;color:var(--soft);white-space:nowrap}
.mat-design-row::before{content:"";position:absolute;left:-3px;top:50%;width:6px;height:6px;background:var(--gold);transform:translateY(-50%) rotate(45deg) scale(0);transition:transform .3s}
.mat-design-row:hover{padding-left:16px}
.mat-design-row.is-on{color:var(--maroon);padding-left:16px;background:color-mix(in oklab,var(--gold) 12%,transparent)}
.mat-root.mat-dark .mat-design-row.is-on,:where(.dark) .mat-root:not(.mat-light) .mat-design-row.is-on{color:var(--gold-hi)}
.mat-design-row.is-on::before{transform:translateY(-50%) rotate(45deg) scale(1)}
.mat-design-sum{margin-top:auto;padding-top:10px;font:400 16px/1 var(--display);color:var(--soft)}
.mat-design-sum b{font:italic 600 26px/1 var(--display);color:var(--copper)}

/* plates */
.mat-plates{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px}
.mat-plate{position:relative;overflow:hidden;min-height:340px;padding:40px 26px 34px;display:flex;align-items:center;justify-content:center;text-align:center;transition:translate .6s cubic-bezier(.2,.8,.2,1),box-shadow .6s}
.mat-plate:hover{translate:0 -6px}
.mat-plate.is-sand{background:var(--sand);color:var(--maroon);box-shadow:inset 0 0 0 1px var(--line),inset 0 0 0 7px var(--sand),inset 0 0 0 8px color-mix(in oklab,var(--gold) 45%,transparent)}
.mat-plate.is-rose{background:var(--rose);color:var(--maroon);box-shadow:inset 0 0 0 1px var(--line),inset 0 0 0 7px var(--rose),inset 0 0 0 8px color-mix(in oklab,var(--gold) 45%,transparent)}
.mat-plate.is-maroon{background:var(--maroon);color:var(--on-dark);box-shadow:inset 0 0 0 1px var(--line),inset 0 0 0 7px var(--maroon),inset 0 0 0 8px color-mix(in oklab,var(--gold) 45%,transparent)}
.mat-plate.is-plum{background:var(--deep);color:var(--on-dark);box-shadow:inset 0 0 0 1px var(--line),inset 0 0 0 7px var(--deep),inset 0 0 0 8px color-mix(in oklab,var(--gold) 45%,transparent)}
.mat-root.mat-dark .mat-plate.is-sand,.mat-root.mat-dark .mat-plate.is-rose,:where(.dark) .mat-root:not(.mat-light) .mat-plate.is-sand,:where(.dark) .mat-root:not(.mat-light) .mat-plate.is-rose{color:var(--c-paper)}
.mat-plate-damask{opacity:.14}
.mat-plate.is-sand .mat-plate-damask,.mat-plate.is-rose .mat-plate-damask{color:var(--maroon);opacity:.07}
.mat-plate-mandala{position:absolute;left:-25%;top:50%;width:150%;height:auto;aspect-ratio:1;translate:0 -50%;opacity:.16;pointer-events:none;will-change:transform}
.mat-plate.is-sand .mat-plate-mandala,.mat-plate.is-rose .mat-plate-mandala{color:var(--maroon);opacity:.1}
.mat-plate-in{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px}
.mat-plate .mat-emblem{color:var(--gold)}
.mat-plate.is-sand .mat-emblem,.mat-plate.is-rose .mat-emblem{color:var(--copper)}
.mat-plate h3{font:500 clamp(32px,2.9cqw,44px)/1 var(--display);letter-spacing:-.005em}
.mat-plate p{font:400 16.5px/1.5 var(--display);opacity:.86;max-width:26ch}

/* heritage */
.mat-heritage{position:relative;z-index:1;overflow:hidden;padding:clamp(90px,11cqw,170px) clamp(16px,3.2cqw,48px);background:var(--cream);box-shadow:inset 0 0 0 16px var(--paper),inset 0 0 0 17px var(--line),inset 0 0 0 21px var(--paper),inset 0 0 0 22px color-mix(in oklab,var(--gold) 35%,transparent)}
.mat-heritage-damask{opacity:.06}
.mat-her-fil{position:absolute;width:clamp(110px,13cqw,190px);height:auto;aspect-ratio:1;z-index:1}
.mat-her-fil.is-tl{left:22px;top:22px}
.mat-her-fil.is-tr{right:22px;top:22px}
.mat-her-fil.is-bl{left:22px;bottom:22px}
.mat-her-fil.is-br{right:22px;bottom:22px}
.mat-paisley-l,.mat-paisley-r{position:absolute;top:50%;height:min(86%,640px);width:auto;aspect-ratio:200/252;translate:0 -50%;will-change:transform}
.mat-paisley-l{left:max(-2cqw,-30px)}
.mat-paisley-r{right:max(-2cqw,-30px)}
.mat-heritage-in{position:relative;z-index:2;max-width:min(780px,58cqw);margin:0 auto;text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px}
.mat-heritage-flourish{width:min(320px,80%)}
.mat-heritage-p{font:400 19px/1.7 var(--display);color:var(--soft);max-width:56ch}
.mat-heritage .mat-btn{margin-top:10px}
.mat-heritage-emblem{margin-top:22px}

/* stain study */
.mat-studysec{position:relative;z-index:1;padding:clamp(64px,8cqw,120px) clamp(16px,3.2cqw,48px)}
.mat-study{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(28px,5cqw,80px);align-items:center;max-width:1240px;margin:0 auto}
.mat-study-copy{display:flex;flex-direction:column;gap:16px;align-items:flex-start}
.mat-study-flourish{width:220px;margin-left:-28px}
.mat-shades{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
.mat-shade{display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 18px 0 8px;border-radius:999px;border:1px solid var(--line);font:500 16px/1 var(--display);transition:border-color .25s,background .25s,transform .25s,color .25s}
.mat-shade i{display:block;width:28px;height:28px;border-radius:50%;background:var(--sw);box-shadow:inset 0 0 0 2px color-mix(in oklab,var(--paper) 60%,transparent),0 0 0 1px var(--gold)}
.mat-shade:hover{border-color:var(--gold);transform:translateY(-1px)}
.mat-shade.is-on{border-color:var(--maroon);background:var(--maroon);color:var(--on-dark)}
.mat-root.mat-dark .mat-shade.is-on,:where(.dark) .mat-root:not(.mat-light) .mat-shade.is-on{border-color:var(--gold);background:var(--gold);color:#2a1308}
.mat-hours{display:flex;flex-direction:column;gap:10px;width:min(440px,100%);margin-top:10px}
.mat-hours-row{display:flex;justify-content:space-between;align-items:baseline;font:500 10.5px/1 var(--caps);letter-spacing:.2em;text-transform:uppercase;color:var(--soft)}
.mat-hours-row b{font:600 40px/1 var(--display);letter-spacing:0;color:var(--maroon)}
.mat-root.mat-dark .mat-hours-row b,:where(.dark) .mat-root:not(.mat-light) .mat-hours-row b{color:var(--gold-hi)}
.mat-hours-row small{font:500 13px/1 var(--display);margin-left:2px;color:var(--gold)}
.mat-hours input{-webkit-appearance:none;appearance:none;width:100%;height:28px;margin:0;background:transparent;cursor:pointer}
.mat-hours input::-webkit-slider-runnable-track{height:3px;border-radius:2px;background:linear-gradient(90deg,#e8913d 0%,var(--maroon) 100%)}
.mat-hours input::-moz-range-track{height:3px;border-radius:2px;background:linear-gradient(90deg,#e8913d 0%,var(--maroon) 100%)}
.mat-hours input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:24px;height:24px;margin-top:-10.5px;border-radius:50%;background:var(--paper);border:2px solid var(--gold);box-shadow:0 2px 10px color-mix(in oklab,var(--ink) 25%,transparent)}
.mat-hours input::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--paper);border:2px solid var(--gold)}
.mat-hours-stage{font:italic 400 18px/1.3 var(--display);color:var(--soft)}
.mat-thaali{position:relative;width:min(100%,480px);aspect-ratio:1;margin:0 auto;display:grid;place-items:center}
.mat-thaali-rim{position:absolute;inset:0;width:100%;height:100%;color:var(--gold);filter:drop-shadow(0 30px 40px color-mix(in oklab,var(--maroon) 35%,transparent))}
.mat-skin{position:relative;width:84%;aspect-ratio:1;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:radial-gradient(110% 100% at 30% 20%,#f4d9c0 0%,#e4bd9c 55%,#cf9f7a 100%);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--maroon) 18%,transparent),inset 0 -20px 40px -20px rgba(80,40,20,.35)}
.mat-skin-mandala{width:84%;height:auto;aspect-ratio:1;color:var(--stain);opacity:var(--stain-a);transition:color .35s,opacity .35s;filter:drop-shadow(0 0 .4px var(--stain))}
.mat-skin-chip{position:absolute;right:2%;bottom:6%;display:flex;align-items:center;gap:10px;padding:8px 14px 8px 8px;border-radius:999px;background:color-mix(in oklab,var(--c-paper) 94%,#fff);color:var(--c-ink);font:500 15px/1 var(--display);box-shadow:0 0 0 1px var(--gold),0 12px 30px -14px rgba(0,0,0,.45)}
.mat-skin-chip i{display:block;width:22px;height:22px;border-radius:50%;transition:background .35s}
.mat-skin-chip b{font:500 11px/1 var(--label);letter-spacing:.06em;font-variant-numeric:tabular-nums;opacity:.6;text-transform:uppercase}

/* footer */
.mat-footer{position:relative;z-index:1;overflow:hidden;background:linear-gradient(180deg,var(--maroon) 0%,var(--deep) 100%);color:var(--on-dark)}
.mat-footer-edge{opacity:.9}
.mat-footer-damask{opacity:.07}
.mat-footer-mandala{position:absolute;left:50%;top:-30%;width:min(900px,90%);height:auto;aspect-ratio:1;translate:-50% 0;opacity:.08;pointer-events:none;will-change:transform}
.mat-footer-brand{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:clamp(56px,7cqw,96px) 16px 10px;text-align:center}
.mat-footer-name{font:600 clamp(36px,4.4cqw,60px)/1 var(--caps);letter-spacing:.16em;background:var(--gilt);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;margin-top:6px}
.mat-footer-tag{font:500 11px/1.4 var(--caps);letter-spacing:.3em;text-transform:uppercase;color:var(--gold)}
.mat-footer-flourish{width:min(280px,70%);margin-top:6px}
.mat-footer-in{position:relative;display:grid;grid-template-columns:1.4fr 1fr;gap:clamp(28px,5cqw,80px);padding:clamp(28px,4cqw,56px) clamp(16px,3.2cqw,48px) clamp(36px,4cqw,56px);max-width:1240px;margin:0 auto}
.mat-footer-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.mat-footer-cols p{font:500 11px/1 var(--caps);letter-spacing:.24em;text-transform:uppercase;color:var(--gold);margin-bottom:16px}
.mat-footer-cols a{display:block;padding:6px 0;font:400 17px/1.3 var(--display);opacity:.82;transition:opacity .2s,transform .25s,color .2s}
.mat-footer-cols a:hover{opacity:1;color:var(--gold-hi);transform:translateX(4px)}
.mat-news{display:flex;flex-direction:column;gap:12px}
.mat-news > p{font:500 28px/1.1 var(--display);color:var(--gold-hi)}
.mat-news-row{display:flex;gap:8px}
.mat-news input{flex:1;min-width:0;height:48px;padding:0 18px;border-radius:999px;border:1px solid color-mix(in oklab,var(--gold) 50%,transparent);background:color-mix(in oklab,var(--on-dark) 6%,transparent);color:inherit;font:400 17px/1 var(--display)}
.mat-news input::placeholder{color:color-mix(in oklab,var(--on-dark) 45%,transparent)}
.mat-news small{font:italic 400 15px/1.5 var(--display);opacity:.65}
.mat-footer-bottom{position:relative;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:18px clamp(16px,3.2cqw,48px) 24px;font:500 10px/1.5 var(--caps);letter-spacing:.16em;text-transform:uppercase;opacity:.7;border-top:1px solid color-mix(in oklab,var(--gold) 35%,transparent)}

/* toast + drawer */
.mat-toast{position:fixed;left:50%;bottom:24px;z-index:60;display:flex;align-items:center;gap:10px;padding:13px 20px;border-radius:999px;background:var(--maroon);color:var(--on-dark);font:500 16px/1 var(--display);box-shadow:0 0 0 1px var(--gold),0 20px 50px -20px rgba(0,0,0,.5);transform:translate(-50%,20px);opacity:0;pointer-events:none;transition:transform .4s cubic-bezier(.2,.8,.2,1),opacity .3s}
.mat-toast.is-on{transform:translate(-50%,0);opacity:1}
.mat-toast svg{color:var(--gold)}
.mat-drawer-wrap{position:fixed;inset:0;z-index:70;pointer-events:none}
.mat-drawer-wrap.is-open{pointer-events:auto}
.mat-scrim{position:absolute;inset:0;background:color-mix(in oklab,var(--c-ink) 55%,transparent);opacity:0;transition:opacity .4s;cursor:pointer}
.mat-drawer-wrap.is-open .mat-scrim{opacity:1}
.mat-drawer{position:absolute;top:0;right:0;bottom:0;width:min(430px,100%);display:flex;flex-direction:column;background:var(--paper);color:var(--ink);box-shadow:-30px 0 60px -30px rgba(0,0,0,.45);transform:translateX(104%);transition:transform .55s cubic-bezier(.2,.8,.2,1)}
.mat-drawer-wrap.is-open .mat-drawer{transform:translateX(0)}
.mat-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 14px}
.mat-drawer-head p{font:500 30px/1 var(--display)}
.mat-drawer-head p span{font:500 12px/1 var(--caps);letter-spacing:.1em;color:var(--gold);margin-left:8px}
.mat-drawer-head button{display:grid;place-items:center;width:38px;height:38px;border-radius:999px;transition:background .2s,color .2s}
.mat-drawer-head button:hover{background:var(--maroon);color:var(--on-dark)}
.mat-drawer-edge{height:12px}
.mat-drawer-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;font:italic 400 20px/1.4 var(--display);color:var(--soft)}
.mat-drawer-list{flex:1;overflow:auto;padding:8px 24px}
.mat-drawer-list li{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:14px;padding:16px 0;border-bottom:1px solid var(--line)}
.mat-drawer-list li p{font:600 19px/1.1 var(--display)}
.mat-drawer-list li small{font:400 14px/1.4 var(--display);color:var(--soft)}
.mat-drawer-list li b{font:500 15px/1 var(--label);min-width:64px;text-align:right}
.mat-qty{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line);border-radius:999px;padding:2px}
.mat-qty button{display:grid;place-items:center;width:28px;height:28px;border-radius:999px;transition:background .2s,color .2s}
.mat-qty button:hover{background:var(--maroon);color:var(--on-dark)}
.mat-qty span{min-width:20px;text-align:center;font:500 13px/1 var(--label)}
.mat-drawer-foot{padding:16px 24px 24px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:12px}
.mat-drawer-total{display:flex;justify-content:space-between;align-items:baseline;font:500 11px/1 var(--caps);letter-spacing:.2em;text-transform:uppercase;color:var(--soft)}
.mat-drawer-total b{font:600 32px/1 var(--display);letter-spacing:0;color:var(--maroon)}
.mat-root.mat-dark .mat-drawer-total b,:where(.dark) .mat-root:not(.mat-light) .mat-drawer-total b{color:var(--gold-hi)}
.mat-drawer-foot small{font:italic 400 15px/1.5 var(--display);color:var(--soft);text-align:center}

/* narrower containers */
@container (max-width: 1180px){
  .mat-products{grid-template-columns:repeat(2,1fr);max-width:760px;margin:0 auto}
  .mat-bento{grid-template-columns:1fr 1fr;grid-template-rows:auto}
  .mat-tile{grid-column:1 / span 2;grid-row:auto;min-height:440px}
  .mat-hl{grid-column:auto;min-height:240px}
  .mat-designs{grid-column:1 / span 2;grid-row:auto}
  .mat-plates{grid-template-columns:repeat(2,1fr)}
  .mat-tab > a{padding:0 14px;letter-spacing:.14em}
}
@container (max-width: 900px){
  .mat-search{display:none}
  .mat-band-in{grid-template-columns:auto 1fr auto;height:78px;gap:12px}
  .mat-band-side.is-left span{display:none}
  .mat-wordmark{justify-content:center;font-size:clamp(28px,8cqw,40px)}
  .mat-only-narrow{display:grid}
  .mat-only-wide{display:none}
  .mat-burger{display:flex}
  .mat-navbar-in{justify-content:center;height:48px}
  .mat-nav{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;padding:8px 16px 18px;background:var(--deep);border-bottom:1px solid var(--line);max-height:70vh;overflow:auto}
  .mat-nav.is-open{display:flex}
  .mat-tab{flex-direction:column;border:0;border-bottom:1px solid color-mix(in oklab,var(--gold) 25%,transparent)}
  .mat-tab:last-child{border-right:0}
  .mat-tab > a{padding:16px 4px;font-size:13px}
  .mat-tab::after{display:none}
  .mat-sub{position:static;opacity:1;visibility:visible;transform:none;min-width:0;padding:0 0 10px 14px;background:none;border:0;box-shadow:none}
  .mat-sub::before,.mat-sub-rosette{display:none}
  .mat-sub a{color:var(--on-dark);font-size:17px;padding:8px 6px}
  .mat-hero{grid-template-columns:1fr;grid-template-rows:auto auto;height:auto;min-height:0}
  .mat-panel-l{min-height:max(560px,calc(var(--h) * .78))}
  .mat-panel-r{min-height:max(580px,calc(var(--h) * .72))}
  .mat-split-mandala{width:min(110%,560px)}
  .mat-split-mandala.is-l{right:auto;left:50%;top:100%;translate:-50% -50%}
  .mat-split-mandala.is-r{left:50%;top:0;translate:-50% -50%}
  .mat-hero-split{display:none}
  .mat-hero-title{font-size:clamp(64px,17cqw,120px)}
  .mat-twin{grid-template-columns:1fr;gap:10px}
  .mat-twin-l,.mat-twin-r{text-align:center}
  .mat-twin-mid{margin:0 auto;order:-1}
  .mat-study{grid-template-columns:1fr}
  .mat-paisley-l,.mat-paisley-r{opacity:.3}
  .mat-heritage-in{max-width:640px}
  .mat-footer-in{grid-template-columns:1fr}
}
@container (max-width: 640px){
  .mat-strip-in{height:34px}
  .mat-marquee-track{line-height:34px}
  .mat-band-in{height:70px;padding:0 10px}
  .mat-icon-btn{width:38px;height:38px}
  .mat-hero-fil{width:110px}
  .mat-hero-copy{padding:56px 22px}
  .mat-products{grid-template-columns:1fr 1fr;gap:14px 12px}
  .mat-product h3{font-size:18px}
  .mat-quick{opacity:1;transform:translate(-50%,0);height:34px;padding:0 14px;font-size:9.5px;letter-spacing:.16em}
  .mat-quick-long{display:none}
  .mat-quick-short{display:inline}
  .mat-badge{top:24%;font-size:8px;padding:5px 8px}
  .mat-bento{grid-template-columns:1fr}
  .mat-tile,.mat-designs{grid-column:auto}
  .mat-tile{min-height:520px}
  .mat-frame-box{padding:24px 18px}
  .mat-plates{grid-template-columns:1fr}
  .mat-plate{min-height:300px}
  .mat-paisley-l,.mat-paisley-r{display:none}
  .mat-her-fil{width:90px}
  .mat-heritage-p{font-size:18px}
  .mat-study-flourish{margin-left:-20px}
  .mat-footer-cols{grid-template-columns:1fr 1fr}
  .mat-footer-bottom{flex-direction:column}
}
@media (max-width: 640px){
  .mat-toast{left:16px;right:16px;transform:translate(0,20px);width:auto}
  .mat-toast.is-on{transform:translate(0,0)}
}

@media (prefers-reduced-motion: reduce){
  .mat-marquee-track,.mat-word{animation:none}
  .mat-navbar,.mat-plate,.mat-hl,.mat-arch-img,.mat-quick,.mat-btn,.mat-drawer,.mat-toast,.mat-bag-badge,.mat-sub,.mat-mini-mark,.mat-mini-bag,.mat-design-row{transition:none}
}
`
