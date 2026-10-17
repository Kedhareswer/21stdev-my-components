"use client"

// Split Horizon Travel Template — a complete small-group travel site in one file.
// The hero is a page split down a seam: linen paper on one side, the world on
// the other, and the headline runs straight across the join, ink on the paper
// and white over the view. Drag the seam to open more of the world. Under it:
// a tour finder you type into (it understands "under 1500" and "7 days"), a
// staggered row of tours you can drag, save and open, an editorial "how we
// travel" spread with a halftone card, a booking form with questions beside
// it, a wordmark footer, and a full-screen night menu whose pill follows your
// pointer between two drifting rows of places.
//
// Every landscape is drawn here as seeded SVG (peaks with snow and shadowed
// faces, water with reflections, forests, balloons, temples), so nothing loads
// at runtime. Every one of them is a prop: pass `image` to use your own photo.
import * as React from "react"

export type ShtScene =
  | "alpine"
  | "polar"
  | "savanna"
  | "coast"
  | "fjord"
  | "balloons"
  | "temple"
  | "river"
  | "dunes"
  | "cabin"

export type ShtRegion = "Mountains" | "Coast" | "Wild" | "Islands" | "Culture"

export type ShtTour = {
  id: string
  name: string
  country: string
  region?: ShtRegion | string
  /** Price per person, in whole currency units. */
  price: number
  days: number
  /** A drawn landscape. Ignored when `image` is set. */
  scene?: ShtScene
  /** Your own photo URL. */
  image?: string
  imageAlt?: string
  summary?: string
  highlights?: string[]
  itinerary?: { title: string; text?: string }[]
  group?: string
  level?: string
  tags?: string[]
}

export type ShtSlide = {
  place: string
  coords?: string
  scene?: ShtScene
  image?: string
  imageAlt?: string
  /** The card in the corner of the view. `tour` is the id it opens. */
  gem?: { kicker?: string; title?: string; text: string; tour?: string; scene?: ShtScene; image?: string; cta?: string } | null
}

export type ShtTarget = "top" | "about" | "tours" | "booking" | "faq" | "saved"

export type ShtLink = { label: string; target?: ShtTarget; href?: string }

export type ShtStep = {
  title: string
  text: string
  /** "stone" carries the halftone, "ink" is the dark card, "image" is a picture card. */
  tone?: "stone" | "ink" | "image"
  scene?: ShtScene
  image?: string
}

export type ShtEnquiry = { tour: string; month: string; travellers: number; name: string; email: string; note: string }

export type ShtPaletteName = "linen" | "glacier" | "olive"

export type ShtPalette = {
  paper: string
  surface: string
  ink: string
  muted: string
  line: string
  stone: string
  stoneInk: string
  night: string
  nightInk: string
  accent: string
  accentInk: string
}

export interface SplitHorizonTravelTemplateProps {
  /** Wordmark in the bar, the menu and the footer. */
  brand?: string
  /** Replaces the drawn mark. */
  logo?: React.ReactNode
  hero?: {
    title?: string
    text?: string
    /** 0–1, where the seam rests. */
    split?: number
    slides?: ShtSlide[]
    /** Seconds per slide. 0 stops the slideshow. */
    interval?: number
  }
  /** The small index in the hero's corner and beside the tours. */
  nav?: ShtLink[]
  search?: { placeholder?: string; label?: string; suggestions?: string[] }
  tours?: ShtTour[]
  /** Ids saved on first render. */
  defaultSaved?: string[]
  onSaveChange?: (ids: string[]) => void
  currency?: string
  about?: {
    kicker?: string
    title?: string
    footnote?: string
    stats?: { value: string; label: string }[]
    steps?: ShtStep[]
  } | null
  booking?: { kicker?: string; title?: string; text?: string } | null
  faq?: { title?: string; items?: { q: string; a: string }[]; contact?: { label: string; value: string; href?: string }[] } | null
  menu?: (ShtLink & { count?: "saved" })[]
  footer?: { note?: string; links?: ShtLink[] } | null
  palette?: ShtPaletteName | ShtPaletteInput
  /** "system" follows the host's `.dark` class, then the OS. */
  theme?: "system" | "light" | "dark"
  /** Called with the form. Return (or resolve to) `false`, or throw, to show an error. */
  onEnquire?: (data: ShtEnquiry) => unknown
  displayFont?: string
  serifFont?: string
  /** Height of the hero. A definite length, so it survives any host layout. */
  height?: string
  className?: string
}

// #region content
const PALETTES = {
  linen: {
    light: { paper: "#eee8df", surface: "#f7f3ed", ink: "#121317", muted: "#6a655e", line: "rgba(18,19,23,.12)", stone: "#b9b4a5", stoneInk: "#16171a", night: "#111318", nightInk: "#f1ece4", accent: "#121317", accentInk: "#f7f3ed" },
    dark: { paper: "#121316", surface: "#1a1b1f", ink: "#ede7dd", muted: "#a09a91", line: "rgba(237,231,221,.13)", stone: "#3b3933", stoneInk: "#ede7dd", night: "#08090b", nightInk: "#f1ece4", accent: "#ede7dd", accentInk: "#121316" },
  },
  glacier: {
    light: { paper: "#e6eaec", surface: "#f3f5f6", ink: "#0f1720", muted: "#5d6872", line: "rgba(15,23,32,.12)", stone: "#aebcc3", stoneInk: "#0f1720", night: "#0c141d", nightInk: "#eaf1f5", accent: "#0f1720", accentInk: "#f3f5f6" },
    dark: { paper: "#0e141a", surface: "#151d25", ink: "#e5edf2", muted: "#93a2ad", line: "rgba(229,237,242,.13)", stone: "#2c3a44", stoneInk: "#e5edf2", night: "#060a0e", nightInk: "#eaf1f5", accent: "#e5edf2", accentInk: "#0e141a" },
  },
  olive: {
    light: { paper: "#e9e6da", surface: "#f4f2ea", ink: "#171a12", muted: "#66675a", line: "rgba(23,26,18,.13)", stone: "#b3b296", stoneInk: "#171a12", night: "#181b13", nightInk: "#efeee2", accent: "#34411f", accentInk: "#f4f2ea" },
    dark: { paper: "#121410", surface: "#1a1d16", ink: "#e9e8da", muted: "#a2a28f", line: "rgba(233,232,218,.13)", stone: "#3a3c2c", stoneInk: "#e9e8da", night: "#0a0b08", nightInk: "#efeee2", accent: "#c9d49a", accentInk: "#121410" },
  },
}

const DEFAULT_TOURS: ShtTour[] = [
  {
    id: "lofoten",
    name: "Lofoten Islands",
    country: "Norway",
    region: "Islands",
    price: 1800,
    days: 8,
    scene: "polar",
    group: "Max 10",
    level: "Moderate",
    tags: ["winter", "aurora", "fjords", "hiking", "snow"],
    summary: "Granite peaks straight out of the sea, red fishing cabins on stilts and, if the sky is kind, the aurora over Reine.",
    highlights: ["Two nights in a restored rorbu on the water", "Ridge walk to Reinebringen at first light", "Aurora watch with a local photographer"],
    itinerary: [
      { title: "Bodø to Svolvær", text: "Ferry across the Vestfjord, welcome dinner of skrei." },
      { title: "Henningsvær", text: "The football pitch on the rocks, galleries and a short coastal hike." },
      { title: "Reine", text: "Sunrise on Reinebringen, an afternoon on the water." },
      { title: "Nusfjord to Å", text: "Old trading posts, stockfish racks and the end of the road." },
    ],
  },
  {
    id: "serengeti",
    name: "Serengeti National Park",
    country: "Tanzania",
    region: "Wild",
    price: 2400,
    days: 9,
    scene: "savanna",
    group: "Max 6",
    level: "Easy",
    tags: ["safari", "wildlife", "migration", "sunset"],
    summary: "Open-roof game drives with a naturalist guide, timed to the great migration, and nights in a camp with no fences.",
    highlights: ["Six game drives in open-roof Land Cruisers", "A balloon over the Seronera at dawn", "Bush breakfast beside a hippo pool"],
    itinerary: [
      { title: "Arusha", text: "Arrival, coffee farm lunch and briefing." },
      { title: "Ngorongoro Crater", text: "A full day on the crater floor." },
      { title: "Central Serengeti", text: "Three days following the herds." },
      { title: "Lake Ndutu", text: "Calving season and the big cats that follow it." },
    ],
  },
  {
    id: "algarve",
    name: "Algarve Coast",
    country: "Portugal",
    region: "Coast",
    price: 1300,
    days: 6,
    scene: "coast",
    group: "Max 12",
    level: "Easy",
    tags: ["beach", "cliffs", "kayak", "food", "sun"],
    summary: "Golden cliffs, sea caves you paddle into, grilled sardines in Ferragudo and the Seven Hanging Valleys trail.",
    highlights: ["Kayak into the Benagil caves before the boats", "Seven Hanging Valleys trail", "Cataplana cooking class in Silves"],
    itinerary: [
      { title: "Faro to Lagos", text: "Old town walk and a sunset at Ponta da Piedade." },
      { title: "Benagil by kayak", text: "Into the caves at 8am, lunch on the beach." },
      { title: "Hanging Valleys", text: "Six kilometres of cliff path, a swim at Marinha." },
    ],
  },
  {
    id: "skye",
    name: "Isle of Skye",
    country: "Scotland",
    region: "Islands",
    price: 1600,
    days: 7,
    scene: "fjord",
    group: "Max 10",
    level: "Moderate",
    tags: ["hiking", "lochs", "whisky", "castles"],
    summary: "Lochs that hold the sky, the Old Man of Storr in the mist, and a peat fire in a croft at the end of every day.",
    highlights: ["The Quiraing loop with a local guide", "A private tasting at Talisker", "Wild swim in the Fairy Pools"],
    itinerary: [
      { title: "Inverness to Portree", text: "Via Eilean Donan and the Skye bridge." },
      { title: "Trotternish", text: "Storr at first light, the Quiraing in the afternoon." },
      { title: "Minginish", text: "Fairy Pools, Talisker and the Cuillin ridge." },
    ],
  },
  {
    id: "cappadocia",
    name: "Cappadocia",
    country: "Türkiye",
    region: "Culture",
    price: 1450,
    days: 6,
    scene: "balloons",
    group: "Max 12",
    level: "Easy",
    tags: ["balloons", "caves", "sunrise", "food"],
    summary: "Fairy chimneys, cave churches and two hundred balloons rising together at sunrise over the Göreme valleys.",
    highlights: ["Sunrise balloon flight with champagne landing", "Two nights in a cave hotel", "Pottery in Avanos with a master potter"],
    itinerary: [
      { title: "Kayseri to Göreme", text: "Open-air museum and a sunset ridge." },
      { title: "Balloons", text: "Up at five, in the air by six." },
      { title: "Ihlara Valley", text: "Riverside walk between rock churches." },
    ],
  },
  {
    id: "soca",
    name: "Soča Valley",
    country: "Slovenia",
    region: "Mountains",
    price: 1250,
    days: 6,
    scene: "river",
    group: "Max 10",
    level: "Active",
    tags: ["river", "kayak", "hiking", "forest", "alps"],
    summary: "An emerald river through the Julian Alps. Raft it, walk it, swim it, and eat trout from it at a farm in Trenta.",
    highlights: ["Rafting the upper Soča", "The Kozjak waterfall gorge", "Farm stay with a wood-fired dinner"],
    itinerary: [
      { title: "Ljubljana to Bovec", text: "Over the Vršič pass, 50 hairpins." },
      { title: "On the water", text: "Rafting in the morning, canyon walk after." },
    ],
  },
  {
    id: "wadirum",
    name: "Wadi Rum",
    country: "Jordan",
    region: "Wild",
    price: 1550,
    days: 7,
    scene: "dunes",
    group: "Max 8",
    level: "Moderate",
    tags: ["desert", "stars", "petra", "camels"],
    summary: "Red sand, sandstone towers and a Bedouin camp under more stars than you knew were there. Petra by candlelight.",
    highlights: ["Two nights in a Bedouin camp", "Petra by night", "Jeep and camel crossing of the valley"],
    itinerary: [
      { title: "Amman to Petra", text: "The King's Highway, Petra by night." },
      { title: "Into Wadi Rum", text: "Jeep across the valley, sunset from a dune." },
    ],
  },
  {
    id: "angkor",
    name: "Angkor",
    country: "Cambodia",
    region: "Culture",
    price: 1350,
    days: 7,
    scene: "temple",
    group: "Max 12",
    level: "Easy",
    tags: ["temples", "sunrise", "food", "history"],
    summary: "Sunrise behind the towers of Angkor Wat, the faces of the Bayon, and Ta Prohm with the jungle growing through it.",
    highlights: ["Angkor Wat at sunrise with an archaeologist", "Tuk-tuk to Banteay Srei", "Floating villages of the Tonlé Sap"],
    itinerary: [
      { title: "Siem Reap", text: "Night market and a Khmer cooking lesson." },
      { title: "Angkor Wat", text: "Sunrise, then the bas-reliefs before the crowds." },
    ],
  },
  {
    id: "faroe",
    name: "Faroe Islands",
    country: "Denmark",
    region: "Islands",
    price: 1950,
    days: 6,
    scene: "cabin",
    group: "Max 8",
    level: "Moderate",
    tags: ["hidden gem", "cliffs", "puffins", "hiking", "cabin"],
    summary: "Turf-roofed cabins on the edge of the Atlantic, puffins on Mykines and waterfalls falling straight into the sea.",
    highlights: ["Three nights in a cliff-top cabin", "Boat to the puffins of Mykines", "Dinner at a heimablídni home kitchen"],
    itinerary: [
      { title: "Vágar", text: "Múlafossur waterfall and the lake above the ocean." },
      { title: "Mykines", text: "A day with the puffins." },
    ],
  },
]

const DEFAULT_SLIDES: ShtSlide[] = [
  {
    place: "Dolomites, Italy",
    coords: "46.41° N · 11.84° E",
    scene: "alpine",
    gem: { kicker: "Hidden Gems", text: "Explore our handpicked collection of authentic stays and secluded retreats, where nature meets comfort in perfect harmony.", tour: "faroe", scene: "cabin" },
  },
  {
    place: "Lofoten, Norway",
    coords: "67.93° N · 13.09° E",
    scene: "polar",
    gem: { kicker: "This winter", text: "Eight days among granite peaks and red cabins on stilts, with an aurora watch on every clear night.", tour: "lofoten", scene: "polar" },
  },
  {
    place: "Serengeti, Tanzania",
    coords: "2.33° S · 34.83° E",
    scene: "savanna",
    gem: { kicker: "Migration season", text: "Open-roof drives timed to the herds, and a camp with no fences between you and the plains.", tour: "serengeti", scene: "savanna" },
  },
  {
    place: "Isle of Skye, Scotland",
    coords: "57.27° N · 6.21° W",
    scene: "fjord",
    gem: { kicker: "Slow travel", text: "Lochs that hold the sky and a peat fire at the end of every walk. Seven days, ten people.", tour: "skye", scene: "fjord" },
  },
]

const DEFAULT_NAV: ShtLink[] = [
  { label: "About", target: "about" },
  { label: "Destinations", target: "tours" },
  { label: "Booking", target: "booking" },
  { label: "FAQ", target: "faq" },
  { label: "Account", href: "#account" },
]

const DEFAULT_MENU: (ShtLink & { count?: "saved" })[] = [
  { label: "My trips", target: "booking" },
  { label: "Saved", target: "saved", count: "saved" },
  { label: "Booking", target: "booking" },
  { label: "Popular", target: "tours" },
  { label: "News", target: "about" },
  { label: "Contact", target: "faq" },
  { label: "Account", href: "#account" },
]

const DEFAULT_STEPS: ShtStep[] = [
  { title: "Start with how you like to travel", text: "A thirty-minute call about pace, comfort and the things you never want to do again. No forms, no packages.", tone: "stone" },
  { title: "", text: "", tone: "image", scene: "alpine" },
  { title: "We build the route around you", text: "Local guides we have walked with, stays we have slept in, and days with room left in them on purpose.", tone: "ink" },
  { title: "Someone picks up, day and night", text: "One planner from first call to final mile, on the phone at any hour while you are away.", tone: "stone" },
]

const DEFAULT_FAQ = [
  { q: "How big are the groups?", a: "Between six and twelve travellers, never more. Many departures run with eight." },
  { q: "Can I travel solo?", a: "About a third of our travellers do. You can share a room with another solo traveller of the same gender, or pay a single supplement." },
  { q: "What is included in the price?", a: "Stays, guides, all transport during the trip and most meals. Flights to the start point are not included, but we can book them for you." },
  { q: "What if I need to cancel?", a: "Full refund up to 60 days before departure, 50% up to 30 days. After that we will move you to another date at no cost." },
]
const DEFAULT_CONTACT = [
  { label: "Talk to a planner", value: "+44 20 7946 0321", href: "tel:+442079460321" },
  { label: "Write to us", value: "hello@wayfold.travel", href: "mailto:hello@wayfold.travel" },
  { label: "Hours", value: "Mon–Sat, 8am–8pm GMT" },
]
// #endregion content

// #region logic
type Pt = [number, number]
type ShtItem = {
  d: string
  fill: string | string[]
  o?: number
  depth?: number
  clip?: number
  stroke?: string
  sw?: number
  blur?: number
  gx?: boolean
  radial?: boolean
}
type ShtSceneData = { sky: string[]; items: ShtItem[] }

const W = 1600
const H = 1000

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const r1 = (n: number) => Math.round(n * 10) / 10

function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeNoise(seed: number) {
  const rnd = mulberry32(seed)
  const t: number[] = []
  for (let i = 0; i < 512; i++) t.push(rnd())
  return (x: number) => {
    const i = Math.floor(x)
    const f = x - i
    const a = t[((i % 512) + 512) % 512]
    const b = t[(((i + 1) % 512) + 512) % 512]
    const u = f * f * (3 - 2 * f)
    return a + (b - a) * u
  }
}

type RidgeOpts = {
  base: number
  amp: number
  freq: number
  oct?: number
  ridged?: number
  /** Designed summits: [x, height, half-width]. */
  bumps?: [number, number, number][]
  flat?: number
  step?: number
}

/** A skyline as points, from beyond the left edge to beyond the right. */
function ridgePts(seed: number, o: RidgeOpts) {
  const n = makeNoise(seed)
  const step = o.step ?? 8
  const oct = o.oct ?? 4
  const ridged = o.ridged ?? 0
  const pts: Pt[] = []
  for (let x = -80; x <= W + 80; x += step) {
    let v = 0
    let a = 1
    let f = o.freq
    let norm = 0
    for (let k = 0; k < oct; k++) {
      let s = n(x * f + k * 31.7)
      if (ridged) s = (1 - ridged) * s + ridged * (1 - Math.abs(2 * s - 1))
      v += s * a
      norm += a
      a *= 0.5
      f *= 2.03
    }
    v = clamp((v / norm - 0.2) / 0.6, 0, 1)
    let y = o.base - v * o.amp
    if (o.bumps)
      for (const [bx, bh, bw] of o.bumps) {
        const skew = (n(bx * 0.013 + 3) - 0.5) * 0.7
        const t = 1 - Math.abs(x - bx) / (bw * (x < bx ? 1 + skew : 1 - skew))
        if (t > 0) {
          const crag = 1 - Math.abs(2 * n(x * 0.022 + bx) - 1)
          y -= bh * Math.pow(t, 1.15) * (0.8 + 0.3 * n(x * 0.031 + 7)) + bh * 0.16 * t * (crag - 0.5) * (ridged ? 1 : 0.3)
        }
      }
    if (o.flat != null) y = Math.max(y, o.flat)
    pts.push([x, y])
  }
  return pts
}

function areaD(pts: Pt[], bottom = H + 40) {
  let d = "M" + r1(pts[0][0]) + " " + r1(bottom)
  for (const p of pts) d += "L" + r1(p[0]) + " " + r1(p[1])
  return d + "L" + r1(pts[pts.length - 1][0]) + " " + r1(bottom) + "Z"
}

function mirrorPts(pts: Pt[], axis: number): Pt[] {
  return pts.map((p) => [p[0], 2 * axis - p[1]] as Pt)
}

/** Local summits: lower than every point within `win` steps either side. */
function peaksOf(pts: Pt[], win: number) {
  const out: number[] = []
  for (let i = win; i < pts.length - win; i++) {
    let ok = true
    for (let k = i - win; k <= i + win && ok; k++) if (k !== i && pts[k][1] < pts[i][1]) ok = false
    if (ok && (!out.length || i - out[out.length - 1] > win)) out.push(i)
  }
  return out
}

/** The shadowed east face of each summit, as one path (clip it to the ridge). */
function shadeD(pts: Pt[], seed: number, bottom: number, win = 9) {
  const n = makeNoise(seed)
  const peaks = peaksOf(pts, win)
  let d = ""
  peaks.forEach((i, pi) => {
    const end = pi + 1 < peaks.length ? peaks[pi + 1] : pts.length - 1
    let j = i + 1
    for (let k = i + 1; k < end; k++) if (pts[k][1] > pts[j][1]) j = k
    if (j - i < 2 || pts[j][1] - pts[i][1] < 34) return
    const [xi, yi] = pts[i]
    const [xj] = pts[j]
    d += "M" + r1(xi) + " " + r1(yi)
    for (let k = i + 1; k <= j; k++) d += "L" + r1(pts[k][0]) + " " + r1(pts[k][1])
    const foot = Math.max(bottom, pts[j][1] + 20)
    d += "L" + r1(xj - (xj - xi) * 0.18) + " " + r1(foot)
    const steps = 14
    for (let s = steps; s >= 0; s--) {
      const t = s / steps
      const x = xi + (xj - xi) * 0.42 * t + (n(t * 6 + i) - 0.5) * 34 * t
      const y = yi + (foot - yi) * t
      d += "L" + r1(x) + " " + r1(y)
    }
    d += "Z"
  })
  return d
}

/** Everything above a ragged snow line (clip it to the ridge). */
function snowD(line: number, seed: number, amp = 40) {
  const n = makeNoise(seed)
  let d = "M-80 -40L" + (W + 80) + " -40"
  for (let x = W + 80; x >= -80; x -= 10) {
    const y = line + (n(x * 0.008) - 0.5) * amp * 2 + (n(x * 0.06 + 40) - 0.5) * amp * 0.9
    d += "L" + x + " " + r1(y)
  }
  return d + "Z"
}

const circ = (cx: number, cy: number, r: number) =>
  "M" + r1(cx - r) + " " + r1(cy) + "a" + r1(r) + " " + r1(r) + " 0 1 0 " + r1(2 * r) + " 0a" + r1(r) + " " + r1(r) + " 0 1 0 " + r1(-2 * r) + " 0Z"
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  "M" + r1(cx - rx) + " " + r1(cy) + "a" + r1(rx) + " " + r1(ry) + " 0 1 0 " + r1(2 * rx) + " 0a" + r1(rx) + " " + r1(ry) + " 0 1 0 " + r1(-2 * rx) + " 0Z"

function cloudD(x: number, y: number, s: number, rnd: () => number) {
  let d = ""
  const n = 6 + Math.floor(rnd() * 3)
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const lift = Math.sin(t * Math.PI)
    d += circ(x + (t - 0.5) * s * 2.6, y - lift * s * 0.55 + rnd() * s * 0.12, s * (0.42 + lift * 0.5 + rnd() * 0.12))
  }
  return d + ell(x, y + s * 0.18, s * 1.45, s * 0.26)
}

function pineD(x: number, y: number, h: number) {
  const w = h * 0.3
  let d = "M" + r1(x - h * 0.025) + " " + r1(y) + "h" + r1(h * 0.05) + "v" + r1(-h * 0.2) + "h" + r1(-h * 0.05) + "Z"
  for (let k = 0; k < 4; k++) {
    const yk = y - h * 0.12 - k * h * 0.2
    const wk = w * (1 - k * 0.2)
    const th = h * 0.36
    d += "M" + r1(x - wk) + " " + r1(yk) + "Q" + r1(x - wk * 0.25) + " " + r1(yk - th * 0.3) + " " + r1(x) + " " + r1(yk - th) + "Q" + r1(x + wk * 0.25) + " " + r1(yk - th * 0.3) + " " + r1(x + wk) + " " + r1(yk) + "Z"
  }
  return d
}

/** Pines stood along a ridge, plus the ridge below them, as one mass. */
function forestD(pts: Pt[], seed: number, size: number, every: number) {
  const rnd = mulberry32(seed)
  let d = areaD(pts)
  for (let i = 0; i < pts.length; i += every) {
    const [x, y] = pts[i]
    d += pineD(x + (rnd() - 0.5) * every * 6, y + 6, size * (0.6 + rnd() * 0.7))
  }
  return d
}

function acaciaD(x: number, y: number, s: number) {
  const k = (v: number) => r1(v * s)
  let d =
    "M" + r1(x - k(9)) + " " + r1(y) + "L" + r1(x - k(5)) + " " + r1(y - k(120)) + "L" + r1(x - k(70)) + " " + r1(y - k(190)) + "L" + r1(x - k(62)) + " " + r1(y - k(195)) +
    "L" + r1(x - k(1)) + " " + r1(y - k(140)) + "L" + r1(x + k(26)) + " " + r1(y - k(205)) + "L" + r1(x + k(34)) + " " + r1(y - k(202)) + "L" + r1(x + k(8)) + " " + r1(y - k(135)) +
    "L" + r1(x + k(80)) + " " + r1(y - k(186)) + "L" + r1(x + k(86)) + " " + r1(y - k(180)) + "L" + r1(x + k(9)) + " " + r1(y - k(112)) + "L" + r1(x + k(10)) + " " + r1(y) + "Z"
  d += ell(x - k(30), y - k(206), k(118), k(22)) + ell(x + k(46), y - k(200), k(104), k(19)) + ell(x + k(8), y - k(222), k(80), k(17)) + ell(x - k(92), y - k(196), k(52), k(12)) + ell(x + k(118), y - k(190), k(48), k(11))
  return d
}

function balloonD(x: number, y: number, r: number, sx = 1) {
  const c = (dx: number, dy: number) => r1(x + dx * r * sx) + " " + r1(y + dy * r)
  return "M" + c(0, -1) + "C" + c(1.32, -1) + " " + c(0.92, 0.55) + " " + c(0.3, 0.98) + "L" + c(-0.3, 0.98) + "C" + c(-0.92, 0.55) + " " + c(-1.32, -1) + " " + c(0, -1) + "Z"
}

function balloonItems(x: number, y: number, r: number, a: string, b: string, depth: number): ShtItem[] {
  const basket = "M" + r1(x - r * 0.17) + " " + r1(y + r * 1.22) + "h" + r1(r * 0.34) + "v" + r1(r * 0.24) + "h" + r1(-r * 0.34) + "Z"
  const ropes = "M" + r1(x - r * 0.28) + " " + r1(y + r * 0.98) + "L" + r1(x - r * 0.15) + " " + r1(y + r * 1.22) + "M" + r1(x + r * 0.28) + " " + r1(y + r * 0.98) + "L" + r1(x + r * 0.15) + " " + r1(y + r * 1.22)
  return [
    { d: balloonD(x, y, r), fill: a, depth },
    { d: balloonD(x, y, r, 0.6), fill: b, depth },
    { d: balloonD(x, y, r, 0.22), fill: a, depth },
    { d: balloonD(x, y, r), fill: ["rgba(255,255,255,.28)", "rgba(255,255,255,0)", "rgba(40,20,30,.32)"], gx: true, depth },
    { d: ropes, fill: "none", stroke: "#4a3326", sw: Math.max(1, r * 0.03), depth },
    { d: basket, fill: "#5b3a24", depth },
  ]
}

function chimneyD(x: number, y: number, h: number, w: number) {
  return (
    "M" + r1(x - w) + " " + r1(y) + "Q" + r1(x - w * 0.6) + " " + r1(y - h * 0.6) + " " + r1(x - w * 0.24) + " " + r1(y - h) + "L" + r1(x + w * 0.24) + " " + r1(y - h) +
    "Q" + r1(x + w * 0.6) + " " + r1(y - h * 0.6) + " " + r1(x + w) + " " + r1(y) + "Z" + ell(x, y - h - w * 0.12, w * 0.42, w * 0.2)
  )
}

function towerD(x: number, y: number, h: number, w: number) {
  return (
    "M" + r1(x - w / 2) + " " + r1(y) + "L" + r1(x - w * 0.42) + " " + r1(y - h * 0.32) + "C" + r1(x - w * 0.48) + " " + r1(y - h * 0.7) + " " + r1(x - w * 0.12) + " " + r1(y - h * 0.9) + " " + r1(x) + " " + r1(y - h) +
    "C" + r1(x + w * 0.12) + " " + r1(y - h * 0.9) + " " + r1(x + w * 0.48) + " " + r1(y - h * 0.7) + " " + r1(x + w * 0.42) + " " + r1(y - h * 0.32) + "L" + r1(x + w / 2) + " " + r1(y) + "Z"
  )
}

function figureD(x: number, y: number, h: number) {
  const k = h / 10
  return (
    circ(x, y - 9.1 * k, 0.9 * k) +
    "M" + r1(x - 1.1 * k) + " " + r1(y - 8 * k) + "L" + r1(x + 1.1 * k) + " " + r1(y - 8 * k) + "L" + r1(x + 1.3 * k) + " " + r1(y - 4.6 * k) + "L" + r1(x + 0.9 * k) + " " + r1(y) +
    "L" + r1(x + 0.25 * k) + " " + r1(y) + "L" + r1(x) + " " + r1(y - 3.6 * k) + "L" + r1(x - 0.25 * k) + " " + r1(y) + "L" + r1(x - 0.9 * k) + " " + r1(y) + "L" + r1(x - 1.3 * k) + " " + r1(y - 4.6 * k) + "Z" +
    "M" + r1(x - 1.2 * k) + " " + r1(y - 7.8 * k) + "L" + r1(x - 2.2 * k) + " " + r1(y - 7.2 * k) + "L" + r1(x - 2.1 * k) + " " + r1(y - 4.8 * k) + "L" + r1(x - 1.2 * k) + " " + r1(y - 5 * k) + "Z"
  )
}

function birdsD(x: number, y: number, s: number, n: number, rnd: () => number) {
  let d = ""
  for (let i = 0; i < n; i++) {
    const bx = x + (rnd() - 0.5) * s * 14
    const by = y + (rnd() - 0.5) * s * 6
    const k = s * (0.6 + rnd() * 0.6)
    d += "M" + r1(bx - k) + " " + r1(by) + "Q" + r1(bx - k * 0.5) + " " + r1(by - k * 0.55) + " " + r1(bx) + " " + r1(by) + "Q" + r1(bx + k * 0.5) + " " + r1(by - k * 0.55) + " " + r1(bx + k) + " " + r1(by)
  }
  return d
}

function grassD(base: number, amp: number, seed: number, count: number, hMin: number, hMax: number) {
  const rnd = mulberry32(seed)
  let d = ""
  for (let i = 0; i < count; i++) {
    const x = rnd() * (W + 120) - 60
    const y = base + rnd() * amp
    const h = hMin + rnd() * (hMax - hMin)
    const lean = (rnd() - 0.5) * h * 0.7
    d += "M" + r1(x) + " " + r1(y) + "q" + r1(lean * 0.3) + " " + r1(-h * 0.55) + " " + r1(lean) + " " + r1(-h)
  }
  return d
}

function dotsD(base: number, amp: number, seed: number, count: number, rMin: number, rMax: number) {
  const rnd = mulberry32(seed)
  let d = ""
  for (let i = 0; i < count; i++) {
    const y = base + Math.pow(rnd(), 0.8) * amp
    d += circ(rnd() * (W + 80) - 40, y, rMin + rnd() * (rMax - rMin) * ((y - base) / amp + 0.4))
  }
  return d
}

function shimmerD(top: number, bottom: number, seed: number, count: number) {
  const rnd = mulberry32(seed)
  let d = ""
  for (let i = 0; i < count; i++) {
    const t = Math.pow(rnd(), 1.6)
    const y = top + t * (bottom - top)
    const x = rnd() * W
    const w = 12 + t * 90 * rnd()
    d += "M" + r1(x) + " " + r1(y) + "h" + r1(w)
  }
  return d
}

/** A ridge with its snow, its shadowed faces and an optional reflection. */
function mountain(
  seed: number,
  o: RidgeOpts,
  look: { rock: string[]; gully?: string; snow?: number; snowFill?: string[]; shade?: string; shadeO?: number; depth: number; mirror?: number; mirrorO?: number },
  items: ShtItem[],
) {
  const pts = ridgePts(seed, o)
  const at = items.length
  items.push({ d: areaD(pts), fill: look.rock, depth: look.depth })
  if (look.gully) items.push({ d: gulliesD(pts, seed + 7, 2, (o.amp + (o.bumps ? Math.max(...o.bumps.map((b) => b[1])) : 0)) * 0.5), fill: "none", stroke: look.gully, sw: 2.2, clip: at, depth: look.depth })
  if (look.snow != null) items.push({ d: snowD(look.snow, seed + 3), fill: look.snowFill ?? ["#fbfaf7", "#e6e9ee"], clip: at, depth: look.depth })
  if (look.shade) items.push({ d: shadeD(pts, seed + 5, o.base + 40), fill: [look.shade, look.shade, look.shade + "00"], o: look.shadeO ?? 0.4, clip: at, depth: look.depth })
  if (look.mirror != null) items.push({ d: areaD(mirrorPts(pts, look.mirror), -40), fill: look.rock.slice().reverse(), o: look.mirrorO ?? 0.35, depth: look.depth })
  return pts
}

/** Rock gullies: short strokes falling from the ridge (clip them to it). */
function gulliesD(pts: Pt[], seed: number, every: number, len: number) {
  const rnd = mulberry32(seed)
  let d = ""
  for (let i = 0; i < pts.length; i += every) {
    const [x, y] = pts[i]
    const l = len * (0.3 + rnd() * 0.9)
    const lean = (rnd() - 0.5) * l * 0.35
    d += "M" + r1(x + (rnd() - 0.5) * 6) + " " + r1(y + 4) + "q" + r1(lean * 0.5 + (rnd() - 0.5) * 8) + " " + r1(l * 0.5) + " " + r1(lean) + " " + r1(l)
  }
  return d
}

function haze(y: number, h: number, color: string, depth: number): ShtItem {
  return { d: "M-80 " + (y - h) + "H" + (W + 80) + "V" + (y + h) + "H-80Z", fill: [color.replace(/,[\d.]+\)$/, ",0)"), color, color.replace(/,[\d.]+\)$/, ",0)")], depth }
}

const SCENE_KINDS: ShtScene[] = ["alpine", "polar", "savanna", "coast", "fjord", "balloons", "temple", "river", "dunes", "cabin"]

/** Every drawn landscape, as plain shapes. Deterministic for a kind and seed. */
function buildScene(kind: ShtScene, seed = 1): ShtSceneData {
  const items: ShtItem[] = []
  const rnd = mulberry32(seed * 977 + hashString(kind))
  const s = seed * 101
  const clouds = (n: number, y0: number, y1: number, size: number, fill: string[], o = 0.95, blur = 2) => {
    for (let i = 0; i < n; i++) items.push({ d: cloudD(rnd() * W, y0 + rnd() * (y1 - y0), size * (0.55 + rnd() * 0.6), rnd), fill, o, blur: Math.min(2, Math.max(1, blur - 2)), depth: 0.15 })
  }
  const sun = (x: number, y: number, r: number, core: string, glow: string) => {
    items.push({ d: circ(x, y, r * 5), fill: [glow, glow.replace(/,[\d.]+\)$/, ",0)")], radial: true, depth: 0.05 })
    items.push({ d: circ(x, y, r), fill: core, depth: 0.05 })
  }
  switch (kind) {
    case "alpine": {
      clouds(4, 90, 260, 80, ["#ffffff", "#f3f6f9", "#dde6ef"], 1, 3)
      clouds(3, 300, 380, 50, ["#ffffff", "#eef2f6"], 0.75, 4)
      mountain(s + 1, { base: 560, amp: 150, freq: 0.004, ridged: 0.6, oct: 5, bumps: [[300, 120, 260]] }, { rock: ["#a9b4c3", "#8796a7"], gully: "rgba(60,74,96,.22)", snow: 420, shade: "#3b4c66", shadeO: 0.32, depth: 0.2 }, items)
      items.push(haze(560, 60, "rgba(222,230,236,.55)", 0.2))
      mountain(s + 2, { base: 640, amp: 120, freq: 0.0045, ridged: 0.85, oct: 5, bumps: [[1080, 330, 300], [1390, 250, 220], [760, 150, 170]] }, { rock: ["#a3a69f", "#6f6d66"], gully: "rgba(40,40,44,.26)", snow: 360, snowFill: ["#fffdf8", "#dfe3e6"], shade: "#283445", shadeO: 0.42, depth: 0.35 }, items)
      items.push(haze(650, 50, "rgba(214,226,222,.5)", 0.35))
      mountain(s + 3, { base: 720, amp: 110, freq: 0.0028, oct: 3, bumps: [[200, 90, 400]] }, { rock: ["#6f9a45", "#476f2c"], shade: "#1f3a1c", shadeO: 0.22, depth: 0.5 }, items)
      const hill = ridgePts(s + 9, { base: 690, amp: 60, freq: 0.003, oct: 3 })
      items.push({ d: forestD(hill.map((p) => [p[0], p[1] + 40] as Pt).filter((p) => p[0] < 520), s + 4, 34, 3), fill: "#2c4a25", o: 0.9, depth: 0.5 })
      mountain(s + 5, { base: 820, amp: 70, freq: 0.0025, oct: 3 }, { rock: ["#8db150", "#5e8a33"], depth: 0.7 }, items)
      mountain(s + 6, { base: 930, amp: 60, freq: 0.003, oct: 3, bumps: [[1450, 70, 380]] }, { rock: ["#4d7a2a", "#2f5119"], depth: 1 }, items)
      items.push({ d: grassD(880, 140, s + 7, 520, 18, 46), fill: "none", stroke: "#3a6420", sw: 2.2, depth: 1 })
      items.push({ d: dotsD(900, 110, s + 8, 120, 2, 6), fill: "#f3a03b", depth: 1 })
      items.push({ d: dotsD(890, 120, s + 10, 90, 2, 5), fill: "#f7f1e3", depth: 1 })
      items.push({ d: dotsD(905, 100, s + 11, 70, 2, 5), fill: "#b56bc9", depth: 1 })
      return { sky: ["#3f6fae", "#78a3d0", "#c5d8e6", "#ece6d6"], items }
    }
    case "polar": {
      clouds(3, 120, 260, 70, ["#fff8f4", "#e9d9de"], 0.75, 4)
      mountain(s + 1, { base: 600, amp: 180, freq: 0.005, ridged: 0.9, oct: 5, bumps: [[520, 300, 260], [880, 220, 200], [1260, 340, 280]] }, { rock: ["#c3cfdc", "#90a1b6"], gully: "rgba(70,90,120,.16)", snow: 640, snowFill: ["#fffaf7", "#e3e8f0"], shade: "#4f6488", shadeO: 0.36, depth: 0.25 }, items)
      items.push(haze(640, 70, "rgba(240,228,230,.6)", 0.25))
      mountain(s + 2, { base: 740, amp: 160, freq: 0.006, ridged: 0.9, oct: 5, bumps: [[160, 260, 240], [1500, 200, 220]] }, { rock: ["#8a9bb4", "#5c6f8c"], snow: 700, snowFill: ["#ffffff", "#dde4ee"], shade: "#33476b", shadeO: 0.3, depth: 0.45 }, items)
      items.push({ d: "M-80 760H" + (W + 80) + "V1040H-80Z", fill: ["#7a93ae", "#3d5470"], depth: 0.55 })
      items.push({ d: shimmerD(770, 860, s + 3, 60), fill: "none", stroke: "rgba(255,240,235,.5)", sw: 2, depth: 0.55 })
      mountain(s + 4, { base: 900, amp: 110, freq: 0.003, oct: 4, bumps: [[300, 120, 500]] }, { rock: ["#ffffff", "#d7dfea"], shade: "#6d83a6", shadeO: 0.35, depth: 0.85 }, items)
      items.push({ d: figureD(1110, 878, 34) + figureD(1150, 884, 30), fill: "#2b2f3a", depth: 0.85 })
      items.push({ d: "M1090 880 Q1200 900 1320 950", fill: "none", stroke: "rgba(80,100,140,.35)", sw: 3, depth: 0.85 })
      return { sky: ["#93acd0", "#c7cde0", "#f0dcd8", "#f8e6d6"], items }
    }
    case "savanna": {
      sun(1040, 600, 88, "#fff1c9", "rgba(255,214,140,.65)")
      clouds(3, 150, 300, 80, ["#ffd9a8", "#f0a878"], 0.55, 5)
      mountain(s + 1, { base: 650, amp: 50, freq: 0.002, oct: 3, bumps: [[300, 40, 300]] }, { rock: ["#d29b6c", "#c7895a"], depth: 0.2 }, items)
      items.push(haze(650, 40, "rgba(250,206,150,.6)", 0.2))
      mountain(s + 2, { base: 700, amp: 18, freq: 0.004, oct: 3 }, { rock: ["#b97a45", "#8a5530"], depth: 0.45 }, items)
      items.push({ d: grassD(700, 120, s + 3, 260, 8, 22), fill: "none", stroke: "rgba(90,52,24,.6)", sw: 1.6, depth: 0.45 })
      items.push({ d: acaciaD(330, 708, 0.42) + acaciaD(1440, 712, 0.3), fill: "#5d3a22", o: 0.85, depth: 0.45 })
      mountain(s + 4, { base: 900, amp: 40, freq: 0.003, oct: 3 }, { rock: ["#6d4223", "#3b2312"], depth: 0.9 }, items)
      items.push({ d: acaciaD(1080, 912, 1.65), fill: "#24170f", depth: 0.9 })
      items.push({ d: grassD(890, 140, s + 5, 420, 18, 52), fill: "none", stroke: "#2d1b0f", sw: 2.4, depth: 0.9 })
      items.push({ d: birdsD(620, 320, 14, 6, rnd), fill: "none", stroke: "#4a2a17", sw: 2.4, depth: 0.15 })
      return { sky: ["#e9824f", "#f2a660", "#f8cc86", "#fbe4b4"], items }
    }
    case "coast": {
      clouds(3, 120, 280, 80, ["#fff6ee", "#f1d7c6"], 0.8, 4)
      mountain(s + 2, { base: 560, amp: 40, freq: 0.003, oct: 3, bumps: [[1420, 70, 300]] }, { rock: ["#c8956a", "#b07a52"], depth: 0.25 }, items)
      items.push({ d: "M-80 548H" + (W + 80) + "V1040H-80Z", fill: ["#3f8ea6", "#2d7790", "#58b1b7", "#9bd6cf"], depth: 0.3 })
      items.push({ d: shimmerD(560, 900, s + 1, 110), fill: "none", stroke: "rgba(255,255,255,.4)", sw: 2, depth: 0.3 })
      const sand = "M" + 560 + " 1040C760 940 980 880 1700 860V1040Z"
      items.push({ d: sand, fill: ["#f5ddb8", "#e8c597"], depth: 0.8 })
      items.push({ d: "M600 1010C800 925 1000 872 1700 852", fill: "none", stroke: "rgba(255,255,255,.85)", sw: 6, depth: 0.8 })
      items.push({ d: "M640 990C840 912 1040 864 1700 842", fill: "none", stroke: "rgba(255,255,255,.4)", sw: 3, depth: 0.8 })
      const cliff = "M-80 1040V360C40 350 140 372 220 392C300 410 360 404 440 430C520 456 560 520 600 600C640 690 640 800 700 870C740 920 760 980 760 1040Z"
      items.push({ d: cliff, fill: ["#e2a764", "#c97c42", "#9a5631"], depth: 0.75 })
      const at = items.length - 1
      items.push({ d: "M-80 420C120 470 260 520 380 620C470 700 540 860 620 1040H-80Z", fill: "#7b3f22", o: 0.28, clip: at, depth: 0.75 })
      items.push({ d: "M-80 330C60 336 160 360 240 382C320 404 380 398 450 424L452 444C380 420 320 428 240 404C160 382 60 360 -80 356Z", fill: ["#8aa548", "#5f7d2c"], depth: 0.75 })
      items.push({ d: "M380 560L420 620M300 640L330 720M460 760L500 840M200 800L240 900", fill: "none", stroke: "rgba(110,55,25,.35)", sw: 4, depth: 0.75 })
      items.push({ d: birdsD(1000, 260, 10, 4, rnd), fill: "none", stroke: "#5a4a48", sw: 2, depth: 0.15 })
      return { sky: ["#86b6d6", "#c8dbe2", "#f4d9c6", "#f8e6d6"], items }
    }
    case "fjord": {
      clouds(4, 80, 300, 110, ["#f3f5f3", "#c9d3d6"], 0.7, 6)
      mountain(s + 1, { base: 540, amp: 120, freq: 0.003, oct: 4, bumps: [[1180, 120, 300]] }, { rock: ["#a9bac1", "#93a7b0"], depth: 0.2, mirror: 600, mirrorO: 0.25 }, items)
      items.push(haze(560, 50, "rgba(232,238,236,.6)", 0.2))
      mountain(s + 2, { base: 610, amp: 110, freq: 0.0036, oct: 4, bumps: [[860, 150, 260]] }, { rock: ["#71919a", "#4f6f78"], shade: "#2c4650", shadeO: 0.3, depth: 0.4, mirror: 610, mirrorO: 0.3 }, items)
      items.push({ d: "M-80 610H" + (W + 80) + "V1040H-80Z", fill: ["rgba(126,153,163,.55)", "rgba(60,90,104,.95)"], depth: 0.45 })
      items.push({ d: shimmerD(620, 900, s + 3, 90), fill: "none", stroke: "rgba(230,240,240,.4)", sw: 2, depth: 0.45 })
      const near = "M-80 1040V420C60 430 160 470 260 540C360 610 420 640 520 700C600 748 660 800 700 860C730 910 760 980 780 1040Z"
      items.push({ d: near, fill: ["#6c8b48", "#3f5a2a", "#26391c"], depth: 0.8 })
      const at = items.length - 1
      items.push({ d: grassD(460, 560, s + 4, 300, 10, 26), fill: "none", stroke: "rgba(40,60,26,.5)", sw: 1.8, clip: at, depth: 0.8 })
      items.push({ d: "M520 700L640 690L700 720L690 744L560 750Z", fill: "#4c4f4a", depth: 0.8 })
      items.push({ d: figureD(612, 694, 46), fill: "#1d2124", depth: 0.8 })
      items.push({ d: birdsD(1120, 300, 12, 3, rnd), fill: "none", stroke: "#4a5a60", sw: 2, depth: 0.15 })
      return { sky: ["#9fb6c4", "#c8d6dc", "#e9ede8", "#f2f1ea"], items }
    }
    case "balloons": {
      sun(300, 640, 60, "#fff4dc", "rgba(255,210,160,.6)")
      mountain(s + 1, { base: 640, amp: 60, freq: 0.002, oct: 3, flat: 590 }, { rock: ["#d1a888", "#c09173"], depth: 0.2 }, items)
      items.push(haze(650, 50, "rgba(246,214,184,.6)", 0.2))
      const rk = mulberry32(s + 2)
      let ch = ""
      for (let i = 0; i < 16; i++) ch += chimneyD(rk() * W, 760 + rk() * 40, 90 + rk() * 110, 26 + rk() * 22)
      items.push({ d: ch, fill: ["#d9a982", "#b07c58"], depth: 0.5 })
      mountain(s + 3, { base: 790, amp: 50, freq: 0.004, oct: 4 }, { rock: ["#c69168", "#8f5d3b"], shade: "#5a3420", shadeO: 0.25, depth: 0.55 }, items)
      let ch2 = ""
      for (let i = 0; i < 7; i++) ch2 += chimneyD(80 + i * 240 + rk() * 80, 960, 170 + rk() * 120, 44 + rk() * 18)
      items.push({ d: ch2, fill: ["#b77a50", "#7c4a2c"], depth: 0.9 })
      mountain(s + 4, { base: 960, amp: 40, freq: 0.004, oct: 3 }, { rock: ["#8b5734", "#5a3520"], depth: 0.9 }, items)
      const cols: [string, string][] = [["#d9473a", "#f2c14e"], ["#2f6e9e", "#f1e4cf"], ["#e88a3c", "#7a3b6b"], ["#f2c14e", "#d9473a"], ["#3d8a6b", "#f1e4cf"], ["#c43d5a", "#2f3e6e"]]
      const spots: [number, number, number][] = [[1120, 300, 74], [820, 220, 46], [1380, 180, 38], [560, 360, 30], [980, 460, 24], [1500, 420, 20], [700, 140, 18], [240, 260, 16], [1260, 520, 14], [420, 480, 12], [1440, 300, 12], [900, 560, 10]]
      spots.forEach(([x, y, r], i) => items.push(...balloonItems(x, y, r, cols[i % cols.length][0], cols[i % cols.length][1], 0.1 + (r / 74) * 0.5)))
      return { sky: ["#7f9ec2", "#c9b9c4", "#f2c4a0", "#f7dcc0"], items }
    }
    case "temple": {
      sun(800, 470, 70, "#fff0d6", "rgba(255,206,150,.55)")
      clouds(2, 160, 260, 90, ["#fbd8bb", "#efb898"], 0.5, 6)
      items.push({ d: forestD(ridgePts(s + 1, { base: 640, amp: 30, freq: 0.004, oct: 3 }), s + 2, 40, 4), fill: "#c99a7c", o: 0.8, depth: 0.2 })
      const base = 660
      let t = "M380 " + base + "h840v-30h-60v-26h-720v26h-60Z"
      t += towerD(800, 604, 300, 120) + towerD(640, 604, 210, 92) + towerD(960, 604, 210, 92) + towerD(510, 604, 150, 70) + towerD(1090, 604, 150, 70)
      items.push({ d: t, fill: ["#8e6a58", "#6e4d3f"], depth: 0.35 })
      items.push({ d: "M748 420h104M736 470h128M732 520h136M600 470h80M920 470h80M604 520h72M924 520h72", fill: "none", stroke: "rgba(255,226,196,.28)", sw: 3, depth: 0.35 })
      items.push(haze(650, 40, "rgba(248,214,180,.45)", 0.35))
      items.push({ d: "M-80 680H" + (W + 80) + "V1040H-80Z", fill: ["#e9b98f", "#9a7660"], depth: 0.5 })
      items.push({ d: towerD(800, 680, -300, 120) + towerD(640, 680, -210, 92) + towerD(960, 680, -210, 92), fill: "rgba(110,77,63,.35)", depth: 0.5 })
      items.push({ d: shimmerD(690, 900, s + 3, 70), fill: "none", stroke: "rgba(255,236,214,.45)", sw: 2, depth: 0.5 })
      const palms = (x: number, y: number, h: number) => {
        let d = "M" + x + " " + y + "q" + h * 0.06 + " " + -h * 0.5 + " " + h * 0.02 + " " + -h + "l6 0q" + h * 0.02 + " " + h * 0.5 + " " + (h * 0.04 - 6) + " " + h + "Z"
        for (let k = 0; k < 7; k++) {
          const a = (k / 6) * Math.PI
          d += "M" + (x + h * 0.02) + " " + (y - h) + "q" + r1(Math.cos(a) * h * 0.25) + " " + r1(-h * 0.18) + " " + r1(Math.cos(a) * h * 0.45) + " " + r1(-Math.sin(a) * h * 0.1 + h * 0.12) + "q" + r1(-Math.cos(a) * h * 0.2) + " " + r1(-h * 0.06) + " " + r1(-Math.cos(a) * h * 0.45) + " " + r1(-(-Math.sin(a) * h * 0.1 + h * 0.12)) + "Z"
        }
        return d
      }
      items.push({ d: palms(160, 980, 360) + palms(330, 1000, 280) + palms(1430, 990, 330), fill: "#2b1d18", depth: 0.95 })
      items.push({ d: "M-80 960C300 930 600 950 900 960C1200 970 1400 940 1700 950V1040H-80Z", fill: "#3a2620", depth: 0.95 })
      return { sky: ["#b9a6b8", "#eab9a0", "#f6cfa8", "#f9e2c6"], items }
    }
    case "river": {
      clouds(3, 100, 240, 80, ["#ffffff", "#dbe6ea"], 0.85, 4)
      mountain(s + 1, { base: 520, amp: 120, freq: 0.004, ridged: 0.8, oct: 5, bumps: [[760, 220, 240], [1240, 160, 220]] }, { rock: ["#a6b4ba", "#8597a0"], gully: "rgba(50,64,74,.25)", snow: 410, shade: "#3f5260", shadeO: 0.38, depth: 0.2 }, items)
      items.push(haze(540, 50, "rgba(220,232,230,.6)", 0.2))
      items.push({ d: forestD(ridgePts(s + 2, { base: 600, amp: 90, freq: 0.004, oct: 3, bumps: [[180, 80, 300], [1450, 90, 300]] }), s + 3, 46, 3), fill: "#3d5d47", depth: 0.4 })
      items.push(haze(640, 40, "rgba(210,226,220,.35)", 0.4))
      const leftBank = ridgePts(s + 4, { base: 700, amp: 160, freq: 0.004, oct: 3, bumps: [[0, 200, 600]] }).filter((p) => p[0] < 760)
      const rightBank = ridgePts(s + 5, { base: 700, amp: 160, freq: 0.004, oct: 3, bumps: [[1600, 200, 600]] }).filter((p) => p[0] > 860)
      const river = "M680 660C740 700 700 760 640 820C560 900 520 960 500 1040H1180C1100 960 1000 900 940 820C890 760 870 700 900 660Z"
      items.push({ d: river, fill: ["#6fd0bf", "#2fa49a", "#1c7f7a"], depth: 0.6 })
      items.push({ d: "M700 700C720 740 690 790 650 840M760 760C760 820 720 900 660 980M880 720C900 780 960 860 1040 960M820 690C830 740 840 800 860 860", fill: "none", stroke: "rgba(230,255,248,.55)", sw: 3, depth: 0.6 })
      items.push({ d: ell(860, 880, 34, 7), fill: "#d6402f", depth: 0.6 })
      items.push({ d: figureD(860, 880, 16), fill: "#1f2a2c", depth: 0.6 })
      items.push({ d: forestD(leftBank.map((p) => [p[0], p[1] + 80] as Pt), s + 6, 110, 2), fill: "#22402f", depth: 0.85 })
      items.push({ d: forestD(rightBank.map((p) => [p[0], p[1] + 90] as Pt), s + 7, 120, 2), fill: "#1b3527", depth: 0.85 })
      return { sky: ["#86b2cc", "#b8d4df", "#e2ece6", "#eef1e8"], items }
    }
    case "dunes": {
      sun(1180, 420, 64, "#fff3d8", "rgba(255,214,160,.55)")
      mountain(s + 1, { base: 600, amp: 60, freq: 0.003, oct: 3, flat: 520 }, { rock: ["#d58b5c", "#c77a4c"], depth: 0.2 }, items)
      items.push(haze(600, 40, "rgba(250,200,150,.5)", 0.2))
      const rock = "M180 720C200 600 230 470 300 420C340 390 380 400 410 380C450 350 520 360 560 400C600 440 610 520 640 560C680 600 720 640 740 720Z"
      items.push({ d: rock, fill: ["#c4643a", "#9c4524"], depth: 0.4 })
      const ra = items.length - 1
      items.push({ d: "M420 380C470 420 500 520 520 600C540 660 600 700 740 720V760H420Z", fill: "#6e2a16", o: 0.35, clip: ra, depth: 0.4 })
      items.push({ d: "M260 520H600M240 600H660M300 460H540", fill: "none", stroke: "rgba(110,40,20,.3)", sw: 3, clip: ra, depth: 0.4 })
      items.push({ d: "M-80 760C200 690 420 700 700 740C980 780 1240 700 1700 720V1040H-80Z", fill: ["#e5a265", "#cf8247"], depth: 0.55 })
      items.push({ d: "M-80 1040V900C200 760 460 790 760 860C1000 916 1200 820 1700 800V1040Z", fill: ["#f0b578", "#d98b4c"], depth: 0.85 })
      items.push({ d: "M760 860C1000 916 1200 820 1700 800V1040H900C880 960 830 900 760 860Z", fill: "#a85a2c", o: 0.3, depth: 0.85 })
      items.push({ d: "M1010 840c4-14 10-26 22-28c8-2 12 6 20 6c10 0 14-14 22-12c8 2 6 18 2 26l-4 10h-8l2-10c-6 2-14 2-22 0l-4 10h-8l2-12c-6 0-12 0-18 2l-2 10h-8Z" + figureD(1046, 820, 22), fill: "#3b1f12", depth: 0.85 })
      return { sky: ["#c98c7c", "#efa66e", "#f6c98f", "#f9e0b6"], items }
    }
    case "cabin": {
      clouds(4, 80, 300, 120, ["#f6f6f2", "#cfd6d8"], 0.75, 6)
      mountain(s + 2, { base: 480, amp: 60, freq: 0.003, oct: 3, bumps: [[300, 90, 260]] }, { rock: ["#8c9d9c", "#748786"], depth: 0.15 }, items)
      items.push({ d: "M-80 478H" + (W + 80) + "V1040H-80Z", fill: ["#8ba1aa", "#5d7883", "#45606a"], depth: 0.2 })
      items.push({ d: shimmerD(490, 900, s + 1, 100), fill: "none", stroke: "rgba(240,246,246,.4)", sw: 2, depth: 0.2 })
      const cliff = "M520 1040C560 880 600 760 700 700C820 630 1000 600 1200 600C1380 600 1560 612 1700 620V1040Z"
      items.push({ d: cliff, fill: ["#7a9a52", "#557533", "#38521f"], depth: 0.7 })
      const at = items.length - 1
      items.push({ d: "M520 1040C560 880 600 760 700 700L760 720C690 790 660 900 640 1040Z", fill: "#3f4740", o: 0.85, clip: at, depth: 0.7 })
      items.push({ d: grassD(600, 440, s + 3, 320, 8, 22), fill: "none", stroke: "rgba(40,64,22,.55)", sw: 1.8, clip: at, depth: 0.7 })
      items.push({ d: "M1700 1040C1500 900 1300 800 1170 640", fill: "none", stroke: "rgba(225,214,180,.8)", sw: 7, depth: 0.7 })
      items.push({ d: "M1050 650h150v-70h-150Z", fill: ["#f7f4ec", "#dcd8cd"], depth: 0.7 })
      items.push({ d: "M1036 584L1125 520L1214 584Z", fill: "#3b4a34", depth: 0.7 })
      items.push({ d: "M1112 650v-40h26v40ZM1068 610h26v-20h-26ZM1160 610h26v-20h-26ZM1170 548h14v-30h-14Z", fill: "#2a2b2a", depth: 0.7 })
      items.push({ d: "M1112 650v-40h26v40Z", fill: "#a24b32", depth: 0.7 })
      items.push({ d: birdsD(420, 260, 12, 5, rnd), fill: "none", stroke: "#56636a", sw: 2, depth: 0.15 })
      return { sky: ["#a9b8c0", "#ccd5d8", "#e6e8e4", "#f1efe8"], items }
    }
  }
  return { sky: ["#ccc", "#eee"], items }
}

function formatPrice(n: number, currency: string) {
  return currency + Math.round(n).toLocaleString("en-US")
}

/** Reads the finder's query: free words, plus "under 1500" and "7 days". */
function parseQuery(q: string) {
  let rest = " " + q.toLowerCase().replace(/[$€£,]/g, "") + " "
  let maxPrice: number | null = null
  let days: number | null = null
  rest = rest.replace(/\b(?:under|below|less than|max|<)\s*(\d{2,6})\b/g, (_m, n) => {
    maxPrice = +n
    return " "
  })
  rest = rest.replace(/\b(\d{1,2})\s*(?:days?|d|nights?)\b/g, (_m, n) => {
    days = +n
    return " "
  })
  const terms = rest.split(/\s+/).filter(Boolean)
  return { terms, maxPrice: maxPrice as number | null, days: days as number | null }
}

function matchTours(tours: ShtTour[], q: string, region: string, saved: string[]) {
  const { terms, maxPrice, days } = parseQuery(q)
  return tours.filter((t) => {
    if (region === "Saved" && !saved.includes(t.id)) return false
    if (region !== "All" && region !== "Saved" && t.region !== region) return false
    if (maxPrice != null && t.price > maxPrice) return false
    if (days != null && Math.abs(t.days - days) > 1) return false
    const hay = [t.name, t.country, t.region || "", ...(t.tags || [])].join(" ").toLowerCase()
    return terms.every((w) => hay.includes(w))
  })
}

function regionsOf(tours: ShtTour[]) {
  const out = ["All"]
  for (const t of tours) if (t.region && !out.includes(t.region)) out.push(t.region)
  return out.concat("Saved")
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : list.concat(id)
}

function nextIndex(i: number, key: string, n: number) {
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return i
}

/** The next `n` months from `from`, as { key: "2026-11", label: "Nov 2026" }. */
function upcomingMonths(from: Date, n: number) {
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const out: { key: string; label: string }[] = []
  let y = from.getFullYear()
  let m = from.getMonth() + 1
  for (let i = 0; i < n; i++, m++) {
    if (m > 11) {
      m = 0
      y++
    }
    out.push({ key: y + "-" + String(m + 1).padStart(2, "0"), label: names[m] + " " + y })
  }
  return out
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

/** A readable reference for an enquiry: stable per brand, email and tour. */
function enquiryRef(brand: string, email: string, tour: string) {
  const prefix = (brand.replace(/[^a-z]/gi, "").slice(0, 2) || "TR").toUpperCase()
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let h = hashString(email.trim().toLowerCase() + "|" + tour)
  let code = ""
  for (let i = 0; i < 5; i++) {
    code += abc[h % abc.length]
    h = Math.floor(h / abc.length) ^ (i * 2654435761)
    h >>>= 0
  }
  return prefix + "-" + code
}

/** Dots of the halftone card: a wedge pointing right that fades at its edges. */
function halftoneDots(cols: number, rows: number, gap: number, shape: "wedge" | "orb" = "wedge") {
  const out: { x: number; y: number; r: number }[] = []
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const u = i / (cols - 1)
      const v = (j / (rows - 1)) * 2 - 1
      let k: number
      if (shape === "orb") {
        // a low sun: full at its lower-left, fading up and to the right
        const d = Math.hypot(u - 0.18, (v - 0.35) * 0.9)
        k = clamp((0.82 - d) * 1.9, 0, 1) * clamp(1.15 - u * 0.6, 0, 1)
      } else {
        const inside = 1 - u * 0.95 - Math.abs(v) * 1.05
        k = clamp(inside * 2.3, 0, 1) * (0.35 + 0.65 * (1 - u))
      }
      if (k > 0.04) out.push({ x: r1(i * gap + (j % 2) * gap * 0.5), y: r1(j * gap * 0.87), r: r1(gap * 0.5 * Math.sqrt(k)) })
    }
  return out
}

function resolvePalette(p: ShtPaletteName | ShtPaletteInput | undefined, dark: boolean): ShtPalette {
  const name = typeof p === "string" && p in PALETTES ? (p as ShtPaletteName) : "linen"
  const base = PALETTES[name][dark ? "dark" : "light"]
  return typeof p === "object" && p ? { ...base, ...(dark ? {} : p) } : base
}
// #endregion logic

const SCENE_CACHE: { [k: string]: ShtSceneData } = {}
function sceneData(kind: ShtScene) {
  return SCENE_CACHE[kind] || (SCENE_CACHE[kind] = buildScene(kind))
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const read = () => setReduced(mq.matches)
    read()
    mq.addEventListener("change", read)
    return () => mq.removeEventListener("change", read)
  }, [])
  return reduced
}

function useTheme(pref: "system" | "light" | "dark") {
  const [dark, setDark] = React.useState(pref === "dark")
  React.useEffect(() => {
    if (pref !== "system") {
      setDark(pref === "dark")
      return
    }
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

/** A drawn landscape, or the photo that replaces it. */
function Picture({ scene, image, alt, className, eager }: { scene?: ShtScene; image?: string; alt?: string; className?: string; eager?: boolean }) {
  const uid = "sht" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const kind = scene && SCENE_KINDS.includes(scene) ? scene : "alpine"
  const data = sceneData(kind)
  const clips = new Set(data.items.map((it) => it.clip).filter((c) => c != null) as number[])
  return (
    <div className={"sht-pic " + (className || "")}>
      {image ? (
        <img className="sht-photo" src={image} alt={alt || ""} width={1600} height={1000} loading={eager ? "eager" : "lazy"} decoding="async" />
      ) : (
        <svg className="sht-svg" viewBox={"0 0 " + W + " " + H} preserveAspectRatio="xMidYMid slice" role="img" aria-label={alt || kind + " landscape"}>
          <defs>
            <linearGradient id={uid + "sky"} x1="0" y1="0" x2="0" y2="1">
              {data.sky.map((c, i) => (
                <stop key={i} offset={i / (data.sky.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
            {data.items.map((it, i) =>
              Array.isArray(it.fill) ? (
                it.radial ? (
                  <radialGradient key={i} id={uid + "g" + i}>
                    {it.fill.map((c, k) => (
                      <stop key={k} offset={k / (it.fill.length - 1)} stopColor={c} />
                    ))}
                  </radialGradient>
                ) : (
                  <linearGradient key={i} id={uid + "g" + i} x1="0" y1="0" x2={it.gx ? "1" : "0"} y2={it.gx ? "0" : "1"}>
                    {it.fill.map((c, k) => (
                      <stop key={k} offset={k / (it.fill.length - 1)} stopColor={c} />
                    ))}
                  </linearGradient>
                )
              ) : null,
            )}
            {[...clips].map((c) => (
              <clipPath key={c} id={uid + "c" + c}>
                <path d={data.items[c].d} />
              </clipPath>
            ))}
            {[1, 2].map((b) => (
              <filter key={b} id={uid + "b" + b} x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation={b} />
              </filter>
            ))}
            <filter id={uid + "grain"} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" stitchTiles="stitch" />
              <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0.55 0" />
            </filter>
          </defs>
          <rect x="-80" y="-80" width={W + 160} height={H + 160} fill={"url(#" + uid + "sky)"} />
          {data.items.map((it, i) => (
            <path
              key={i}
              className="sht-par"
              style={{ ["--d" as string]: it.depth ?? 0.5 } as React.CSSProperties}
              d={it.d}
              fill={Array.isArray(it.fill) ? "url(#" + uid + "g" + i + ")" : it.fill}
              opacity={it.o}
              stroke={it.stroke}
              strokeWidth={it.sw}
              strokeLinecap="round"
              clipPath={it.clip != null ? "url(#" + uid + "c" + it.clip + ")" : undefined}
              filter={it.blur ? "url(#" + uid + "b" + it.blur + ")" : undefined}
            />
          ))}
          <rect x="0" y="0" width={W} height={H} filter={"url(#" + uid + "grain)"} opacity="0.24" />
        </svg>
      )}
    </div>
  )
}

function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg className="sht-svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5c4.6 0 8 3.3 8 7.6 0 3.2-1.6 5.3-3.6 7.6-1.6 1.9-3 3.6-4.4 5.8-1.4-2.2-2.8-3.9-4.4-5.8C5.6 14.4 4 12.3 4 9.1c0-4.3 3.4-7.6 8-7.6Z" fill="currentColor" />
      <path d="M7.4 10.6l2.6-3.4 1.9 2.3 1.4-1.6 3.3 4.1c-1 .4-2.6.7-4.6.7-2 0-3.6-.4-4.6-1.1Z" fill="var(--sht-mark-cut, #eee8df)" />
    </svg>
  )
}

function Heart({ on }: { on: boolean }) {
  return (
    <svg className="sht-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-7.5-10.3C4.5 7.3 6.6 5 9.3 5c1.3 0 2.1.6 2.7 1.4.6-.8 1.4-1.4 2.7-1.4 2.7 0 4.8 2.3 4.8 5.2 0 5.7-7.5 10.3-7.5 10.3Z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

const Arrow = ({ flip }: { flip?: boolean }) => (
  <svg className="sht-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
    <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function IndexNav({ items, active, onGo, label }: { items: ShtLink[]; active: string; onGo: (l: ShtLink) => void; label: string }) {
  return (
    <nav className="sht-index" aria-label={label}>
      {items.map((l) => {
        const on = l.label === active
        return (
          <a
            key={l.label}
            href={l.href || "#" + (l.target || "")}
            className={"sht-index-a" + (on ? " is-on" : "")}
            aria-current={on ? "true" : undefined}
            onClick={(e) => {
              if (l.target) {
                e.preventDefault()
                onGo(l)
              }
            }}
          >
            <span className="sht-slash" aria-hidden="true">/</span>
            {l.label}
          </a>
        )
      })}
    </nav>
  )
}

export default function SplitHorizonTravelTemplate({
  brand = "Wayfold",
  logo,
  hero,
  nav = DEFAULT_NAV,
  search,
  tours = DEFAULT_TOURS,
  defaultSaved = ["lofoten", "serengeti", "skye", "cappadocia"],
  onSaveChange,
  currency = "$",
  about,
  booking,
  faq,
  menu = DEFAULT_MENU,
  footer,
  palette = "linen",
  theme = "system",
  onEnquire,
  displayFont,
  serifFont,
  height = "100svh",
  className,
}: SplitHorizonTravelTemplateProps) {
  const reduced = useReducedMotion()
  const dark = useTheme(theme)
  const pal = resolvePalette(palette, dark)

  const title = hero?.title ?? "Discover the beauty\nof the world around"
  const heroText = hero?.text ?? "Escape the ordinary and find inspiration in the most breathtaking corners of the globe. We curate unique travel experiences tailored to your rhythm and spirit."
  // On a phone the seam runs across, and rests lower so the headline stays on paper.
  const [narrow, setNarrow] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(max-width: 760px)")
    const read = () => setNarrow(mq.matches)
    read()
    mq.addEventListener("change", read)
    return () => mq.removeEventListener("change", read)
  }, [])
  const restSplit = narrow ? Math.max(0.6, clamp(hero?.split ?? 0.5, 0.2, 0.85)) : clamp(hero?.split ?? 0.5, 0.2, 0.85)
  const slides = hero?.slides && hero.slides.length ? hero.slides : DEFAULT_SLIDES
  const interval = hero?.interval ?? 7
  const tourById = (id?: string) => tours.find((t) => t.id === id)

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const heroRef = React.useRef(null as HTMLElement | null)
  const sections = React.useRef({} as { [k: string]: HTMLElement | null })

  /* ---------- the seam ---------- */
  const [split, setSplit] = React.useState(restSplit)
  const [touched, setTouched] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const splitRef = React.useRef(restSplit)
  const applySplit = React.useCallback((v: number) => {
    splitRef.current = v
    heroRef.current?.style.setProperty("--sht-split", String(v))
  }, [])
  React.useEffect(() => {
    // The world opens from the right edge on first paint.
    if (reduced) {
      applySplit(restSplit)
      setSplit(restSplit)
      return
    }
    let raf = 0
    const from = 0.97
    const t0 = performance.now() + 250
    applySplit(from)
    const tick = (now: number) => {
      const t = clamp((now - t0) / 1500, 0, 1)
      const e = 1 - Math.pow(1 - t, 4)
      applySplit(from + (restSplit - from) * e)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setSplit(restSplit)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, restSplit, applySplit])

  const splitFromEvent = (e: { clientX: number; clientY: number }) => {
    const el = heroRef.current
    if (!el) return splitRef.current
    const r = el.getBoundingClientRect()
    const vertical = r.width < 760
    const v = vertical ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width
    return clamp(v, 0.18, 0.86)
  }
  const onSeamDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDragging(true)
    setTouched(true)
  }
  const onSeamMove = (e: React.PointerEvent) => {
    if (!dragging) return
    applySplit(splitFromEvent(e))
  }
  const onSeamUp = () => {
    if (!dragging) return
    setDragging(false)
    setSplit(splitRef.current)
  }
  const onSeamKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.03
    let v = splitRef.current
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") v -= step
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") v += step
    else if (e.key === "Home") v = 0.18
    else if (e.key === "End") v = 0.86
    else if (e.key === "Enter" || e.key === " ") v = restSplit
    else return
    e.preventDefault()
    v = clamp(v, 0.18, 0.86)
    applySplit(v)
    setSplit(v)
    setTouched(true)
  }

  /* ---------- the view: parallax and slides ---------- */
  const [slide, setSlide] = React.useState(0)
  const [heroHold, setHeroHold] = React.useState(false)
  const autoplay = interval > 0 && !reduced && slides.length > 1
  const onHeroMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse") return
    const el = heroRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty("--sht-mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    el.style.setProperty("--sht-my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }
  const onHeroLeave = () => {
    heroRef.current?.style.setProperty("--sht-mx", "0")
    heroRef.current?.style.setProperty("--sht-my", "0")
    setHeroHold(false)
  }
  const cur = slides[slide % slides.length]

  /* ---------- saved ---------- */
  const [saved, setSaved] = React.useState(defaultSaved)
  const toggleSave = (id: string) => {
    setSaved((s) => {
      const n = toggleId(s, id)
      onSaveChange?.(n)
      return n
    })
  }

  /* ---------- finder ---------- */
  const [query, setQuery] = React.useState("")
  const [region, setRegion] = React.useState("All")
  const [qFocus, setQFocus] = React.useState(false)
  const inputRef = React.useRef(null as HTMLInputElement | null)
  const regions = regionsOf(tours)
  const shown = matchTours(tours, query, region, saved)
  const rowRef = React.useRef(null as HTMLDivElement | null)
  const drag = React.useRef({ on: false, x: 0, left: 0, moved: 0 })
  const [rowEdge, setRowEdge] = React.useState({ start: true, end: false, p: 0 })
  const readRow = React.useCallback(() => {
    const el = rowRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setRowEdge({ start: el.scrollLeft < 4, end: el.scrollLeft > max - 4, p: max > 0 ? el.scrollLeft / max : 1 })
  }, [])
  React.useEffect(() => {
    readRow()
    rowRef.current?.scrollTo({ left: 0 })
  }, [query, region, readRow])
  React.useEffect(() => {
    addEventListener("resize", readRow)
    return () => removeEventListener("resize", readRow)
  }, [readRow])
  const scrollRow = (dir: number) => {
    const el = rowRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: reduced ? "auto" : "smooth" })
  }
  const suggestions = search?.suggestions ?? ["fjords", "safari", "under 1500", "7 days", "islands"]

  /* ---------- detail ---------- */
  const [openId, setOpenId] = React.useState(null as string | null)
  const opened = tourById(openId || undefined)
  const lastFocus = React.useRef(null as HTMLElement | null)
  const dialogRef = React.useRef(null as HTMLDivElement | null)
  const openTour = (id?: string) => {
    if (!id || !tourById(id)) return
    lastFocus.current = document.activeElement as HTMLElement
    setOpenId(id)
  }
  const closeTour = () => {
    setOpenId(null)
    lastFocus.current?.focus?.()
  }

  /* ---------- menu ---------- */
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [pill, setPill] = React.useState(3)
  const menuBtn = React.useRef(null as HTMLButtonElement | null)
  const menuItems = React.useRef([] as (HTMLAnchorElement | null)[])
  const [pillBox, setPillBox] = React.useState({ y: 0, h: 0, w: 0 })
  React.useLayoutEffect(() => {
    if (!menuOpen) return
    const el = menuItems.current[pill]
    if (el) setPillBox({ y: el.offsetTop, h: el.offsetHeight, w: el.offsetWidth })
  }, [menuOpen, pill, saved.length])
  React.useEffect(() => {
    if (!menuOpen && !openId) return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = "hidden"
    return () => {
      html.style.overflow = prev
    }
  }, [menuOpen, openId])
  React.useEffect(() => {
    if (menuOpen) requestAnimationFrame(() => menuItems.current[pill]?.focus())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen])
  React.useEffect(() => {
    if (openId) requestAnimationFrame(() => dialogRef.current?.focus())
  }, [openId])
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (openId) closeTour()
      else if (menuOpen) {
        setMenuOpen(false)
        menuBtn.current?.focus()
      }
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  })

  /* ---------- the bar ---------- */
  const [scrolled, setScrolled] = React.useState(false)
  React.useEffect(() => {
    const el = heroRef.current
    if (!el || typeof IntersectionObserver !== "function") return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { rootMargin: "-72px 0px 0px 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ---------- reveal on scroll ---------- */
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = root.querySelectorAll(".sht-rise")
    if (reduced || typeof IntersectionObserver !== "function") {
      els.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in")
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [reduced, about, booking, faq])

  const go = (target?: ShtTarget) => {
    if (!target) return
    setMenuOpen(false)
    if (target === "saved") {
      setRegion("Saved")
      setQuery("")
      target = "tours"
    }
    const el = target === "top" ? rootRef.current : sections.current[target]
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }))
  }
  const goLink = (l: ShtLink) => go(l.target)

  /* ---------- booking ---------- */
  const [months, setMonths] = React.useState([] as { key: string; label: string }[])
  React.useEffect(() => setMonths(upcomingMonths(new Date(), 6)), [])
  const [form, setForm] = React.useState({ tour: tours[0]?.id || "", month: "", travellers: 2, name: "", email: "", note: "" })
  const [errors, setErrors] = React.useState({} as { [k: string]: string })
  const [status, setStatus] = React.useState("idle" as "idle" | "sending" | "done" | "error")
  const [ref, setRef] = React.useState("")
  const alive = React.useRef(true)
  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const nameRef = React.useRef(null as HTMLInputElement | null)
  const planTour = (id: string) => {
    setForm((f) => ({ ...f, tour: id }))
    setStatus("idle")
    setOpenId(null)
    go("booking")
    setTimeout(() => nameRef.current?.focus({ preventScroll: true }), reduced ? 0 : 700)
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err: { [k: string]: string } = {}
    if (!form.name.trim()) err.name = "Tell us your name."
    if (!isEmail(form.email)) err.email = "That email doesn't look right."
    if (!form.month) err.month = "Pick a month to travel."
    setErrors(err)
    if (Object.keys(err).length) return
    setStatus("sending")
    let ok = true
    try {
      if (onEnquire) {
        const res = await onEnquire({ ...form, month: months.find((m) => m.key === form.month)?.label || form.month })
        if (res === false) ok = false
      } else await new Promise((r) => setTimeout(r, 900))
    } catch {
      ok = false
    }
    if (!alive.current) return
    if (ok) setRef(enquiryRef(brand, form.email, form.tour))
    setStatus(ok ? "done" : "error")
  }

  /* ---------- content ---------- */
  const ab = about === null ? null : about || {}
  const steps = ab?.steps ?? DEFAULT_STEPS
  const stats = ab?.stats ?? [
    { value: "140+", label: "small-group departures a year" },
    { value: "38", label: "countries we have walked ourselves" },
    { value: "4.9", label: "average from 2,300 travellers" },
  ]
  const bk = booking === null ? null : booking || {}
  const fq = faq === null ? null : faq || {}
  const faqItems = fq?.items ?? DEFAULT_FAQ
  const [openQ, setOpenQ] = React.useState(0 as number | null)
  const ft = footer === null ? null : footer || {}
  const wordRef = React.useRef(null as HTMLParagraphElement | null)
  React.useEffect(() => {
    // The footer wordmark is set to fill the width, whatever the brand's length.
    const el = wordRef.current
    if (!el || typeof ResizeObserver !== "function") return
    const fit = () => {
      el.style.fontSize = ""
      const box = el.parentElement ? el.parentElement.clientWidth - parseFloat(getComputedStyle(el.parentElement).paddingLeft) * 2 : 0
      const w = el.scrollWidth
      if (box > 0 && w > 0) el.style.fontSize = Math.min(460, parseFloat(getComputedStyle(el).fontSize) * (box / w) * 0.995) + "px"
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (el.parentElement) ro.observe(el.parentElement)
    return () => ro.disconnect()
  }, [brand, footer])
  const ftLinks = ft?.links ?? nav
  const sizes = ["s", "l", "t", "m", "t", "s", "l", "m", "t"]
  const marquee = tours.slice(0, 8)
  const savedCount = saved.filter((id) => tours.some((t) => t.id === id)).length

  const style = {
    "--sht-paper": pal.paper,
    "--sht-surface": pal.surface,
    "--sht-ink": pal.ink,
    "--sht-muted": pal.muted,
    "--sht-line": pal.line,
    "--sht-stone": pal.stone,
    "--sht-stone-ink": pal.stoneInk,
    "--sht-night": pal.night,
    "--sht-night-ink": pal.nightInk,
    "--sht-accent": pal.accent,
    "--sht-accent-ink": pal.accentInk,
    "--sht-hero-h": height,
    "--sht-split": restSplit,
    "--sht-display": displayFont || '"Inter Display", "Inter Tight", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    "--sht-serif": serifFont || '"Instrument Serif", "Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, ui-serif, serif',
  } as React.CSSProperties

  const headline = title.split("\n")

  return (
    <div ref={rootRef} className={"sht-root" + (dark ? " is-dark" : "") + (className ? " " + className : "")} style={style} data-theme={dark ? "dark" : "light"}>
      <style>{SHT_CSS}</style>

      {/* the bar: sticky, takes no space, sits over the hero */}
      <div className={"sht-bar" + (scrolled ? " is-scrolled" : "")}>
        <a
          className="sht-brand"
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            go("top")
          }}
          aria-label={brand + ", back to top"}
        >
          <span className="sht-brand-mark">{logo || <Mark />}</span>
          <span className="sht-brand-name">{brand}</span>
        </a>
        <button
          ref={menuBtn}
          type="button"
          className="sht-burger"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* ---------- hero ---------- */}
      <header
        ref={heroRef}
        className={"sht-hero" + (dragging ? " is-dragging" : "") + (heroHold ? " is-held" : "")}
        onPointerMove={onHeroMove}
        onPointerEnter={() => setHeroHold(true)}
        onPointerLeave={onHeroLeave}
      >
        <div className="sht-pane">
          <div className="sht-hero-index">
            <IndexNav items={nav} active={nav[0]?.label || ""} onGo={goLink} label="Sections" />
          </div>
        </div>

        <div className="sht-view" aria-hidden={false}>
          {slides.map((s, i) => (
            <div key={i} className={"sht-slide" + (i === slide % slides.length ? " is-on" : "")} aria-hidden={i !== slide % slides.length}>
              <Picture scene={s.scene} image={s.image} alt={s.imageAlt || s.place} eager={i === 0} />
            </div>
          ))}
          <div className="sht-view-shade" />
          <div className="sht-place" aria-live="polite">
            <span className="sht-place-n">{String((slide % slides.length) + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
            <span className="sht-place-name">{cur.place}</span>
            {cur.coords && <span className="sht-place-c">{cur.coords}</span>}
          </div>
        </div>

        {/* the headline twice: ink over the paper, white over the view */}
        <div className="sht-copy">
          <h1 className="sht-h1">
            {headline.map((l, i) => (
              <span key={i} className="sht-h1-line" style={{ ["--i" as string]: i } as React.CSSProperties}>
                {l}
              </span>
            ))}
          </h1>
          <p className="sht-lede">{heroText}</p>
        </div>
        <div className="sht-copy sht-copy-light" aria-hidden="true">
          <div className="sht-h1">
            {headline.map((l, i) => (
              <span key={i} className="sht-h1-line" style={{ ["--i" as string]: i } as React.CSSProperties}>
                {l}
              </span>
            ))}
          </div>
          <p className="sht-lede">{heroText}</p>
        </div>

        <div
          className={"sht-seam" + (touched ? " is-touched" : "")}
          role="slider"
          tabIndex={0}
          aria-label="Drag to open more of the view"
          aria-orientation="horizontal"
          aria-valuemin={18}
          aria-valuemax={86}
          aria-valuenow={Math.round(split * 100)}
          aria-valuetext={Math.round((1 - split) * 100) + "% of the view open"}
          onPointerDown={onSeamDown}
          onPointerMove={onSeamMove}
          onPointerUp={onSeamUp}
          onPointerCancel={onSeamUp}
          onKeyDown={onSeamKey}
          onDoubleClick={() => {
            applySplit(restSplit)
            setSplit(restSplit)
          }}
        >
          <span className="sht-seam-line" />
          <span className="sht-seam-grip">
            <svg className="sht-svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="sht-seam-hint">Drag the horizon</span>
        </div>

        {cur.gem !== null && (
          <aside className="sht-gem" key={slide % slides.length}>
            <div className="sht-gem-pic">
              <Picture scene={cur.gem?.scene || tourById(cur.gem?.tour)?.scene} image={cur.gem?.image || tourById(cur.gem?.tour)?.image} alt="" />
            </div>
            <div className="sht-gem-body">
              <p className="sht-gem-k">{cur.gem?.kicker || cur.gem?.title || "Hidden Gems"}</p>
              <p className="sht-gem-t">{cur.gem?.text}</p>
              {cur.gem?.tour && tourById(cur.gem.tour) && (
                <button type="button" className="sht-btn sht-btn-sm" onClick={() => openTour(cur.gem?.tour)}>
                  {cur.gem.cta || "Explore More"}
                </button>
              )}
            </div>
          </aside>
        )}

        {slides.length > 1 && (
          <div className="sht-dots" role="tablist" aria-label="Featured places">
            {slides.map((s, i) => {
              const on = i === slide % slides.length
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-label={s.place}
                  tabIndex={on ? 0 : -1}
                  className={"sht-dot" + (on ? " is-on" : "")}
                  onClick={() => setSlide(i)}
                  onKeyDown={(e) => {
                    const n = nextIndex(i, e.key, slides.length)
                    if (n !== i) {
                      e.preventDefault()
                      setSlide(n)
                      ;(e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus()
                    }
                  }}
                >
                  {on && autoplay ? (
                    <span
                      key={slide}
                      className="sht-dot-fill"
                      style={{ animationDuration: interval + "s" }}
                      onAnimationEnd={() => setSlide((v) => (v + 1) % slides.length)}
                    />
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* ---------- finder ---------- */}
      <section className="sht-sec sht-finder" ref={(el) => (sections.current.tours = el)} data-sec="tours" aria-labelledby="sht-find-l">
        <div className="sht-search sht-rise">
          <label id="sht-find-l" htmlFor="sht-find" className="sht-vh">
            {search?.label || "Search tours"}
          </label>
          <div className={"sht-search-box" + (query ? " has-q" : "")}>
            {!query && (
              <span className={"sht-ph" + (qFocus ? " is-focus" : "")} aria-hidden="true">
                <span className="sht-caret" />
                {search?.placeholder || "Find your tour"}
              </span>
            )}
            <input
              id="sht-find"
              ref={inputRef}
              className="sht-search-in"
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder=""
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setQFocus(true)}
              onBlur={() => setQFocus(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query) {
                  e.stopPropagation()
                  setQuery("")
                }
              }}
            />
            {query && (
              <button type="button" className="sht-search-x" onClick={() => (setQuery(""), inputRef.current?.focus())} aria-label="Clear search">
                ×
              </button>
            )}
          </div>
          <div className={"sht-suggest" + (qFocus || query ? " is-on" : "")}>
            <span>Try</span>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="sht-suggest-b"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery(s)
                  inputRef.current?.focus()
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="sht-finder-grid">
          <div className="sht-finder-side">
            <IndexNav items={nav} active={nav[1]?.label || ""} onGo={goLink} label="Sections" />
          </div>
          <div className="sht-finder-main">
            <div className="sht-row-head">
              <h2 className="sht-row-title">{region === "All" ? "Popular" : region}</h2>
              <div className="sht-chips" role="group" aria-label="Filter by kind of trip">
                {regions.map((r) => (
                  <button key={r} type="button" className={"sht-chip" + (r === region ? " is-on" : "")} aria-pressed={r === region} onClick={() => setRegion(r)}>
                    {r}
                    {r === "Saved" && <span className="sht-chip-n">{savedCount}</span>}
                  </button>
                ))}
              </div>
              <div className="sht-row-nav">
                <span className="sht-count" aria-live="polite">
                  {shown.length} {shown.length === 1 ? "tour" : "tours"}
                </span>
                <button type="button" className="sht-round" onClick={() => scrollRow(-1)} disabled={rowEdge.start} aria-label="Previous tours">
                  <Arrow flip />
                </button>
                <button type="button" className="sht-round" onClick={() => scrollRow(1)} disabled={rowEdge.end} aria-label="More tours">
                  <Arrow />
                </button>
              </div>
            </div>

            {shown.length ? (
              <div
                ref={rowRef}
                className="sht-row"
                onScroll={readRow}
                onPointerDown={(e) => {
                  if (e.pointerType !== "mouse" || !rowRef.current) return
                  drag.current = { on: true, x: e.clientX, left: rowRef.current.scrollLeft, moved: 0 }
                }}
                onPointerMove={(e) => {
                  const d = drag.current
                  if (!d.on || !rowRef.current) return
                  d.moved = Math.max(d.moved, Math.abs(e.clientX - d.x))
                  if (d.moved > 4) {
                    rowRef.current.classList.add("is-grabbing")
                    rowRef.current.scrollLeft = d.left - (e.clientX - d.x)
                  }
                }}
                onPointerUp={() => {
                  drag.current.on = false
                  rowRef.current?.classList.remove("is-grabbing")
                }}
                onPointerLeave={() => {
                  drag.current.on = false
                  rowRef.current?.classList.remove("is-grabbing")
                }}
                onClickCapture={(e) => {
                  if (drag.current.moved > 6) {
                    e.preventDefault()
                    e.stopPropagation()
                    drag.current.moved = 0
                  }
                }}
              >
                {shown.map((t, i) => {
                  const isSaved = saved.includes(t.id)
                  return (
                    <article key={t.id} className={"sht-card sht-card-" + sizes[i % sizes.length]} style={{ ["--i" as string]: i } as React.CSSProperties}>
                      <button type="button" className="sht-card-hit" onClick={() => openTour(t.id)} aria-label={"Open " + t.name + ", " + t.country}>
                        <span className="sht-card-pic">
                          <Picture scene={t.scene} image={t.image} alt={t.imageAlt || t.name} />
                          <span className="sht-card-days">{t.days} days</span>
                          <span className="sht-card-view">
                            View tour <Arrow />
                          </span>
                        </span>
                        <span className="sht-card-name">
                          {t.name}, {t.country}
                        </span>
                        <span className="sht-card-price">
                          {formatPrice(t.price, currency)} / person
                        </span>
                      </button>
                      <button
                        type="button"
                        className={"sht-save" + (isSaved ? " is-on" : "")}
                        aria-pressed={isSaved}
                        aria-label={(isSaved ? "Remove " : "Save ") + t.name}
                        onClick={() => toggleSave(t.id)}
                      >
                        <Heart on={isSaved} />
                      </button>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="sht-empty">
                <p className="sht-empty-t">
                  {region === "Saved" && !query ? "Nothing saved yet." : "No tours match “" + (query || region) + "”."}
                </p>
                <p className="sht-empty-s">
                  {region === "Saved" && !query ? "Tap the heart on any tour to keep it here." : "Try a place, a kind of trip, or a budget like “under 2000”."}
                </p>
                <button type="button" className="sht-btn sht-btn-ghost" onClick={() => (setQuery(""), setRegion("All"))}>
                  Show every tour
                </button>
              </div>
            )}
            <div className="sht-progress" aria-hidden="true">
              <span style={{ transform: "scaleX(" + Math.max(0.08, rowEdge.p) + ")" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- about: the editorial spread ---------- */}
      {ab && (
        <section className="sht-sec sht-about" ref={(el) => (sections.current.about = el)} data-sec="about" aria-labelledby="sht-about-h">
          <div className="sht-about-side sht-rise">
            <p className="sht-kicker">{ab.kicker || "Journal / How we travel"}</p>
            <h2 id="sht-about-h" className="sht-serif-h">
              {ab.title || "From first idea to the final mile"}
            </h2>
            <dl className="sht-stats">
              {stats.map((s) => (
                <div key={s.label} className="sht-stat">
                  <dt>{s.value}</dt>
                  <dd>{s.label}</dd>
                </div>
              ))}
            </dl>
            <p className="sht-foot">{ab.footnote || "From first call\nto final mile"}</p>
          </div>
          <ol className="sht-steps">
            {(() => {
              let n = 0
              let stones = 0
              return steps.map((s, i) => {
                const tone = s.tone || "stone"
                const num = tone === "image" ? null : ++n
                const shape = tone === "stone" && stones++ % 2 ? "orb" : "wedge"
                return (
                  <li key={i} className={"sht-step sht-step-" + tone + " sht-rise"} style={{ ["--i" as string]: i } as React.CSSProperties} tabIndex={0}>
                    {tone === "image" ? (
                      <Picture scene={s.scene} image={s.image} alt={s.title || "A walker above the valley"} className="sht-step-pic" />
                    ) : (
                      <>
                        <span className="sht-step-n">/{String(num).padStart(2, "0")}</span>
                        {tone === "stone" && (
                          <svg className="sht-svg sht-halftone" viewBox="0 0 240 260" aria-hidden="true">
                            {halftoneDots(15, 19, 16, shape).map((d, k) => (
                              <circle key={k} cx={d.x} cy={d.y + 8} r={d.r} />
                            ))}
                          </svg>
                        )}
                        <div className="sht-step-copy">
                          <h3 className="sht-step-t">{s.title}</h3>
                          <p className="sht-step-p">{s.text}</p>
                        </div>
                      </>
                    )}
                  </li>
                )
              })
            })()}
          </ol>
        </section>
      )}

      {/* ---------- booking and questions ---------- */}
      {(bk || fq) && (
        <section className="sht-sec sht-book" ref={(el) => (sections.current.booking = el)} data-sec="booking" aria-label="Plan a trip">
          {fq && (
            <div className="sht-faq sht-rise" ref={(el) => (sections.current.faq = el)} data-sec="faq">
              <h2 className="sht-serif-h sht-serif-m">{fq.title || "Questions, answered"}</h2>
              <div className="sht-faq-list">
                {faqItems.map((it, i) => {
                  const open = openQ === i
                  return (
                    <div key={i} className={"sht-q" + (open ? " is-open" : "")}>
                      <h3 className="sht-q-h">
                        <button type="button" aria-expanded={open} aria-controls={"sht-qa-" + i} id={"sht-qb-" + i} onClick={() => setOpenQ(open ? null : i)}>
                          <span>{it.q}</span>
                          <span className="sht-q-plus" aria-hidden="true" />
                        </button>
                      </h3>
                      <div className="sht-q-a" id={"sht-qa-" + i} role="region" aria-labelledby={"sht-qb-" + i}>
                        <div>
                          <p>{it.a}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {(fq.contact ?? DEFAULT_CONTACT).length > 0 && (
                <dl className="sht-contact">
                  {(fq.contact ?? DEFAULT_CONTACT).map((c) => (
                    <div key={c.label}>
                      <dt>{c.label}</dt>
                      <dd>{c.href ? <a href={c.href}>{c.value}</a> : c.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}
          {bk && (
            <div className="sht-form-wrap sht-rise">
              <p className="sht-kicker">{bk.kicker || "Booking"}</p>
              <h2 className="sht-serif-h sht-serif-m">{bk.title || "Tell us where. We’ll handle the rest."}</h2>
              <p className="sht-form-lede">{bk.text || "A planner replies within one working day with dates, a route and a price. Nothing is charged until you say yes."}</p>
              {status === "done" ? (
                <div className="sht-done" role="status">
                  <div className="sht-done-pic">
                    <Picture scene={tourById(form.tour)?.scene} image={tourById(form.tour)?.image} alt="" />
                  </div>
                  <div className="sht-done-body">
                    <p className="sht-kicker">Enquiry received</p>
                    <p className="sht-done-t">
                      {tourById(form.tour)?.name}, {months.find((m) => m.key === form.month)?.label}
                    </p>
                    <p className="sht-done-s">
                      {form.travellers} {form.travellers === 1 ? "traveller" : "travellers"} · we will write to {form.email.trim()}
                    </p>
                    <p className="sht-ref">
                      Reference <strong>{ref}</strong>
                    </p>
                    <button type="button" className="sht-btn sht-btn-ghost" onClick={() => (setStatus("idle"), setForm((f) => ({ ...f, note: "" })))}>
                      Plan another trip
                    </button>
                  </div>
                </div>
              ) : (
                <form className="sht-form" onSubmit={submit} noValidate>
                  <div className="sht-field">
                    <label htmlFor="sht-f-tour">Trip</label>
                    <select id="sht-f-tour" value={form.tour} onChange={(e) => setForm({ ...form, tour: e.target.value })}>
                      {tours.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}, {t.country} · {formatPrice(t.price, currency)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <fieldset className="sht-field">
                    <legend>When</legend>
                    <div className="sht-months" aria-describedby={errors.month ? "sht-e-month" : undefined}>
                      {months.map((m) => (
                        <button key={m.key} type="button" className={"sht-month" + (form.month === m.key ? " is-on" : "")} aria-pressed={form.month === m.key} onClick={() => setForm({ ...form, month: m.key })}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                    {errors.month && (
                      <span className="sht-err" id="sht-e-month">
                        {errors.month}
                      </span>
                    )}
                  </fieldset>
                  <div className="sht-field sht-field-row">
                    <span className="sht-lab" id="sht-l-trav">
                      Travellers
                    </span>
                    <div className="sht-stepper" role="group" aria-labelledby="sht-l-trav">
                      <button type="button" onClick={() => setForm({ ...form, travellers: Math.max(1, form.travellers - 1) })} disabled={form.travellers <= 1} aria-label="One fewer traveller">
                        −
                      </button>
                      <output aria-live="polite">{form.travellers}</output>
                      <button type="button" onClick={() => setForm({ ...form, travellers: Math.min(12, form.travellers + 1) })} disabled={form.travellers >= 12} aria-label="One more traveller">
                        +
                      </button>
                    </div>
                  </div>
                  <div className="sht-two">
                    <div className="sht-field">
                      <label htmlFor="sht-f-name">Name</label>
                      <input id="sht-f-name" ref={nameRef} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "sht-e-name" : undefined} />
                      {errors.name && (
                        <span className="sht-err" id="sht-e-name">
                          {errors.name}
                        </span>
                      )}
                    </div>
                    <div className="sht-field">
                      <label htmlFor="sht-f-email">Email</label>
                      <input id="sht-f-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "sht-e-email" : undefined} />
                      {errors.email && (
                        <span className="sht-err" id="sht-e-email">
                          {errors.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="sht-field">
                    <label htmlFor="sht-f-note">Anything we should know? (optional)</label>
                    <textarea id="sht-f-note" rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="A birthday, a bad knee, a love of long lunches…" />
                  </div>
                  {status === "error" && (
                    <p className="sht-err" role="alert">
                      That didn’t go through. Please try again in a moment.
                    </p>
                  )}
                  <button type="submit" className="sht-btn sht-btn-lg" disabled={status === "sending"}>
                    {status === "sending" ? "Sending…" : "Send enquiry"}
                    <Arrow />
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      )}

      {/* ---------- footer ---------- */}
      {ft && (
        <footer className="sht-footer">
          <div className="sht-footer-top">
            <nav className="sht-footer-links" aria-label="Footer">
              {ftLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href || "#" + (l.target || "")}
                  onClick={(e) => {
                    if (l.target) {
                      e.preventDefault()
                      go(l.target)
                    }
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <button type="button" className="sht-top" onClick={() => go("top")}>
              Back to top ↑
            </button>
          </div>
          <p className="sht-wordmark" aria-hidden="true" ref={wordRef}>
            {brand}
          </p>
          <p className="sht-footer-note">{ft.note || "© " + brand + " Journeys. Small groups, slow roads, since 2014."}</p>
        </footer>
      )}

      {/* ---------- the night menu ---------- */}
      <div className={"sht-menu" + (menuOpen ? " is-open" : "")} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!menuOpen} {...(menuOpen ? {} : { inert: "" })}>
        <div className="sht-menu-bar">
          <span className="sht-brand sht-brand-night">
            <span className="sht-brand-mark">{logo || <Mark />}</span>
          </span>
          <button
            type="button"
            className="sht-x"
            aria-label="Close menu"
            onClick={() => {
              setMenuOpen(false)
              menuBtn.current?.focus()
            }}
          >
            <svg className="sht-svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="sht-menu-band" aria-hidden="true">
          <div className="sht-menu-track">
            {marquee.concat(marquee).map((t, i) => (
              <div key={i} className="sht-menu-tile">
                <Picture scene={t.scene} image={t.image} alt="" />
              </div>
            ))}
          </div>
        </div>
        <nav className="sht-menu-list" aria-label="Main">
          <span className="sht-menu-pill" style={{ transform: "translate(-50%," + pillBox.y + "px)", height: pillBox.h, width: pillBox.w + 28 }} aria-hidden="true" />
          {menu.map((m, i) => (
            <a
              key={m.label}
              ref={(el) => (menuItems.current[i] = el)}
              href={m.href || "#" + (m.target || "")}
              className={"sht-menu-a" + (pill === i ? " is-on" : "")}
              style={{ ["--i" as string]: i } as React.CSSProperties}
              onPointerEnter={() => setPill(i)}
              onFocus={() => setPill(i)}
              onKeyDown={(e) => {
                const n = nextIndex(i, e.key, menu.length)
                if (n !== i) {
                  e.preventDefault()
                  menuItems.current[n]?.focus()
                }
              }}
              onClick={(e) => {
                if (m.target) {
                  e.preventDefault()
                  go(m.target)
                } else setMenuOpen(false)
              }}
            >
              {m.label}
              {m.count === "saved" ? " (" + savedCount + ")" : ""}
            </a>
          ))}
        </nav>
        <p className="sht-menu-foot">
          <span>{brand} Journeys</span>
          <span>Esc to close</span>
        </p>
      </div>

      {/* ---------- a tour, opened ---------- */}
      {opened && (
        <div className="sht-modal" onMouseDown={(e) => e.target === e.currentTarget && closeTour()}>
          <div ref={dialogRef} className="sht-dialog" role="dialog" aria-modal="true" aria-labelledby="sht-d-h" tabIndex={-1}>
            <div className="sht-d-pic">
              <Picture scene={opened.scene} image={opened.image} alt={opened.imageAlt || opened.name} eager />
              <span className="sht-d-region">{opened.region}</span>
            </div>
            <div className="sht-d-body">
              <button type="button" className="sht-x sht-d-x" onClick={closeTour} aria-label="Close">
                <svg className="sht-svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              <p className="sht-kicker">{opened.country}</p>
              <h2 id="sht-d-h" className="sht-d-h">
                {opened.name}
              </h2>
              <dl className="sht-d-facts">
                <div>
                  <dt>From</dt>
                  <dd>{formatPrice(opened.price, currency)}</dd>
                </div>
                <div>
                  <dt>Length</dt>
                  <dd>{opened.days} days</dd>
                </div>
                {opened.group && (
                  <div>
                    <dt>Group</dt>
                    <dd>{opened.group}</dd>
                  </div>
                )}
                {opened.level && (
                  <div>
                    <dt>Pace</dt>
                    <dd>{opened.level}</dd>
                  </div>
                )}
              </dl>
              {opened.summary && <p className="sht-d-sum">{opened.summary}</p>}
              {opened.highlights && opened.highlights.length > 0 && (
                <ul className="sht-d-hl">
                  {opened.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
              {opened.itinerary && opened.itinerary.length > 0 && (
                <ol className="sht-d-it">
                  {opened.itinerary.map((d, i) => (
                    <li key={i}>
                      <span className="sht-d-day">Day {i + 1}</span>
                      <span>
                        <strong>{d.title}</strong>
                        {d.text && <span className="sht-d-txt">{d.text}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              <div className="sht-d-actions">
                <button type="button" className="sht-btn sht-btn-lg" onClick={() => planTour(opened.id)}>
                  Plan this trip <Arrow />
                </button>
                <button type="button" className={"sht-btn sht-btn-ghost sht-d-save" + (saved.includes(opened.id) ? " is-on" : "")} aria-pressed={saved.includes(opened.id)} onClick={() => toggleSave(opened.id)}>
                  <Heart on={saved.includes(opened.id)} />
                  {saved.includes(opened.id) ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SHT_CSS = `
.sht-root{--sht-r:22px;--sht-ease:cubic-bezier(.22,1,.36,1);--sht-mx:0;--sht-my:0;position:relative;background:var(--sht-paper);color:var(--sht-ink);font-family:var(--sht-display);-webkit-font-smoothing:antialiased;overflow-x:clip;color-scheme:light;--sht-mark-cut:var(--sht-paper)}
.sht-root.is-dark{color-scheme:dark}
.sht-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.sht-root :where(input,select,textarea){font:inherit;color:inherit}
.sht-root :where(h1,h2,h3,p,ol,ul,dl,dd,figure){margin:0;padding:0}
.sht-root :where(ol,ul){list-style:none}
.sht-root :where(a){color:inherit;text-decoration:none}
.sht-root :where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:8px}
.sht-svg{display:block;max-width:none;flex:none}
.sht-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.sht-pic{position:relative;overflow:hidden;background:var(--sht-stone)}
.sht-pic .sht-svg,.sht-photo{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block}
.sht-par{transform:translate3d(calc(var(--sht-mx) * var(--d) * -46px),calc(var(--sht-my) * var(--d) * -18px),0);transition:transform 1.1s var(--sht-ease)}

.sht-bar{position:sticky;top:0;z-index:40;height:0;display:flex;justify-content:space-between;align-items:flex-start;padding:0 clamp(28px,3.4vw,52px);pointer-events:none}
.sht-bar>*{pointer-events:auto;margin-top:clamp(28px,3.2vw,46px)}
.sht-brand{display:inline-flex;align-items:center;gap:10px;height:42px;padding:0 4px;border-radius:999px;transition:background .35s,padding .35s,box-shadow .35s;color:var(--sht-ink)}
.sht-brand-mark{display:grid;place-items:center}
.sht-brand-name{font-weight:600;font-size:15px;letter-spacing:-.01em;opacity:0;transform:translateX(-6px);transition:opacity .3s,transform .3s var(--sht-ease)}
.sht-burger{width:42px;height:42px;border-radius:999px;display:grid;place-content:center;gap:4px;color:#fff;transition:background .35s,color .35s,box-shadow .35s}
.sht-burger span{display:block;width:16px;height:1.5px;background:currentColor;border-radius:2px;transition:transform .3s var(--sht-ease)}
.sht-burger:hover span:nth-child(1){transform:translateX(-3px)}
.sht-burger:hover span:nth-child(3){transform:translateX(3px)}
.sht-bar.is-scrolled>*{margin-top:14px}
.sht-bar.is-scrolled .sht-brand{background:var(--sht-surface);padding:0 16px 0 12px;box-shadow:0 1px 0 var(--sht-line),0 10px 30px -18px rgba(0,0,0,.4)}
.sht-bar.is-scrolled .sht-brand-name{opacity:1;transform:none}
.sht-bar.is-scrolled .sht-burger{background:var(--sht-night);color:var(--sht-night-ink);box-shadow:0 10px 30px -14px rgba(0,0,0,.5)}

.sht-hero{position:relative;margin:12px;height:max(640px,calc(var(--sht-hero-h) - 24px));border-radius:var(--sht-r);overflow:hidden;background:var(--sht-paper);isolation:isolate;touch-action:pan-y}
.sht-root.is-dark .sht-hero{background:var(--sht-surface)}
.sht-pane{position:absolute;inset:0;background:inherit}
.sht-view{position:absolute;inset:0;clip-path:inset(0 0 0 calc(var(--sht-split) * 100%));z-index:1}
.sht-slide{position:absolute;inset:0;opacity:0;transform:scale(1.06);transition:opacity 1.2s var(--sht-ease),transform 2.4s var(--sht-ease)}
.sht-slide.is-on{opacity:1;transform:none}
.sht-slide .sht-pic{position:absolute;inset:-3%}
.sht-view-shade{position:absolute;inset:0;background:radial-gradient(ellipse 46% 30% at 50% 44%,rgba(10,14,20,.34),rgba(10,14,20,0) 100%),linear-gradient(180deg,rgba(10,14,20,.28),rgba(10,14,20,0) 22%,rgba(10,14,20,0) 70%,rgba(10,14,20,.3));pointer-events:none}
.sht-place{position:absolute;top:clamp(84px,9vw,112px);right:clamp(28px,3.4vw,52px);display:flex;flex-direction:column;align-items:flex-end;gap:3px;color:#fff;font-size:12px;letter-spacing:.02em;text-shadow:0 1px 12px rgba(0,0,0,.25)}
.sht-place-n{font-variant-numeric:tabular-nums;opacity:.75}
.sht-place-name{font-size:14px;font-weight:600}
.sht-place-c{opacity:.8;font-variant-numeric:tabular-nums}

.sht-copy{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px 8vh;pointer-events:none;color:var(--sht-ink)}
.sht-copy-light{color:#fff;clip-path:inset(0 0 0 calc(var(--sht-split) * 100%));z-index:3}
.sht-h1{font-family:var(--sht-display);font-weight:500;font-size:clamp(44px,6.1vw,96px);line-height:.98;letter-spacing:-.055em;max-width:12em}
.sht-h1-line{display:block;animation:sht-up 1.1s var(--sht-ease) both;animation-delay:calc(.15s + var(--i) * .09s)}
.sht-copy-light .sht-h1{text-shadow:0 2px 30px rgba(0,0,0,.22)}
.sht-lede{margin-top:clamp(18px,2vw,26px);max-width:31em;font-size:clamp(13px,1vw,15px);line-height:1.5;letter-spacing:-.005em;opacity:.82;animation:sht-up 1.1s var(--sht-ease) .38s both}
.sht-copy-light .sht-lede{opacity:1;text-shadow:0 1px 2px rgba(0,0,0,.35),0 1px 16px rgba(0,0,0,.45)}
@keyframes sht-up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}

.sht-seam{position:absolute;top:0;bottom:0;left:calc(var(--sht-split) * 100%);width:44px;margin-left:-22px;z-index:5;cursor:ew-resize;display:flex;align-items:center;justify-content:center;touch-action:none;outline:none}
.sht-seam-line{position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(255,255,255,.55);box-shadow:0 0 0 .5px rgba(0,0,0,.06);transform:scaleY(.0);transform-origin:top;animation:sht-line 1.4s var(--sht-ease) .9s forwards}
@keyframes sht-line{to{transform:scaleY(1)}}
.sht-seam-grip{position:relative;top:14vh;width:44px;height:44px;border-radius:999px;background:var(--sht-surface);color:var(--sht-ink);display:grid;place-items:center;box-shadow:0 8px 28px -10px rgba(0,0,0,.45),0 0 0 1px var(--sht-line);transition:transform .35s var(--sht-ease),background .3s;opacity:0;animation:sht-fade .6s ease 1.6s forwards}
.sht-seam:hover .sht-seam-grip,.sht-hero.is-dragging .sht-seam-grip{transform:scale(1.12)}
.sht-seam:focus-visible .sht-seam-grip{outline:2px solid var(--sht-ink);outline-offset:3px}
.sht-seam-hint{position:absolute;top:calc(50% + 14vh + 34px);white-space:nowrap;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:rgba(17,19,23,.55);padding:5px 10px;border-radius:999px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;animation:sht-fade .6s ease 2.1s forwards;transition:opacity .4s}
.sht-seam.is-touched .sht-seam-hint{animation:none;opacity:0}
@keyframes sht-fade{to{opacity:1}}
.sht-hero.is-dragging{cursor:ew-resize;user-select:none}

.sht-hero-index{position:absolute;left:clamp(28px,3.4vw,52px);bottom:clamp(26px,3vw,44px);z-index:4}
.sht-index{display:flex;flex-direction:column;gap:6px;font-size:12.5px;letter-spacing:-.005em}
.sht-index-a{display:inline-flex;align-items:baseline;gap:3px;color:var(--sht-ink);opacity:.72;transition:opacity .2s,transform .3s var(--sht-ease);width:max-content}
.sht-index-a:hover{opacity:1;transform:translateX(3px)}
.sht-slash{display:inline-block;width:0;overflow:hidden;opacity:0;transition:width .3s var(--sht-ease),opacity .3s}
.sht-index-a.is-on{opacity:1}
.sht-index-a.is-on .sht-slash,.sht-index-a:hover .sht-slash{width:.6em;opacity:1}

.sht-gem{position:absolute;z-index:6;right:clamp(20px,2.6vw,40px);bottom:clamp(44px,5vw,64px);width:min(420px,calc(100% - 40px));display:grid;grid-template-columns:44% 1fr;gap:14px;padding:10px;border-radius:18px;background:var(--sht-surface);color:var(--sht-ink);box-shadow:0 30px 60px -30px rgba(0,0,0,.55);animation:sht-gem .9s var(--sht-ease) both}
@keyframes sht-gem{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
.sht-gem-pic{border-radius:12px;overflow:hidden;min-height:132px;position:relative}
.sht-gem-pic .sht-pic{position:absolute;inset:0}
.sht-gem-body{display:flex;flex-direction:column;gap:8px;padding:6px 6px 6px 0}
.sht-gem-k{font-weight:600;font-size:15px;letter-spacing:-.015em}
.sht-gem-t{font-size:12.5px;line-height:1.45;color:var(--sht-muted)}
.sht-gem-body .sht-btn{margin-top:auto;align-self:flex-start}
.sht-dots{position:absolute;z-index:6;right:calc(clamp(20px,2.6vw,40px) + min(420px,calc(100% - 40px)) / 2);transform:translateX(50%);bottom:clamp(18px,2vw,26px);display:flex;gap:6px}
.sht-dot{position:relative;width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,.5);overflow:hidden;transition:width .45s var(--sht-ease),background .3s}
.sht-dot:hover{background:rgba(255,255,255,.85)}
.sht-dot.is-on{width:34px;background:rgba(255,255,255,.4)}
.sht-dot-fill{position:absolute;inset:0;background:#fff;transform-origin:left;animation:sht-fill linear both}
.sht-dot.is-on:not(:has(.sht-dot-fill)){background:#fff}
.sht-hero.is-held .sht-dot-fill,.sht-hero.is-dragging .sht-dot-fill{animation-play-state:paused}
@keyframes sht-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}

.sht-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:44px;padding:0 20px;border-radius:999px;background:var(--sht-accent);color:var(--sht-accent-ink);font-size:14px;font-weight:500;letter-spacing:-.01em;transition:transform .25s var(--sht-ease),opacity .2s,background .25s}
.sht-btn:hover{transform:translateY(-1px)}
.sht-btn:active{transform:scale(.97)}
.sht-btn:disabled{opacity:.6;cursor:default;transform:none}
.sht-btn .sht-svg{transition:transform .3s var(--sht-ease)}
.sht-btn:hover .sht-svg{transform:translateX(3px)}
.sht-btn-sm{height:32px;padding:0 14px;font-size:12px}
.sht-btn-lg{height:52px;padding:0 26px;font-size:15px}
.sht-btn-ghost{background:transparent;color:var(--sht-ink);box-shadow:inset 0 0 0 1px var(--sht-line)}
.sht-btn-ghost:hover{box-shadow:inset 0 0 0 1px var(--sht-ink)}

.sht-sec{position:relative;padding:clamp(72px,9vw,140px) clamp(20px,3.4vw,52px)}
.sht-rise{opacity:0;transform:translateY(26px);transition:opacity .9s var(--sht-ease),transform .9s var(--sht-ease);transition-delay:calc(var(--i,0) * 70ms)}
.sht-rise.is-in{opacity:1;transform:none}
.sht-kicker{font-size:12px;letter-spacing:.01em;color:var(--sht-muted)}

.sht-finder{padding-top:clamp(64px,8vw,120px)}
.sht-search{max-width:880px;margin:0 auto;display:flex;flex-direction:column;align-items:center}
.sht-search-box{position:relative;width:100%;display:flex;align-items:center;justify-content:center}
.sht-search-in{width:100%;border:0;background:transparent;outline:none;text-align:center;font-size:clamp(40px,5.6vw,84px);font-weight:300;letter-spacing:-.05em;line-height:1.15;padding:6px 48px;color:var(--sht-ink);caret-color:var(--sht-ink);-webkit-appearance:none;appearance:none}
.sht-search-box:not(.has-q) .sht-search-in{caret-color:transparent}
.sht-ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:clamp(40px,5.6vw,84px);font-weight:300;letter-spacing:-.05em;line-height:1.15;color:var(--sht-ink);pointer-events:none;white-space:nowrap}
.sht-ph{color:color-mix(in srgb,var(--sht-ink) 28%,transparent)}
.sht-search-in::-webkit-search-cancel-button{display:none}
.sht-root .sht-search-in:focus-visible{outline:none}
.sht-search-box:focus-within::after{content:"";position:absolute;left:20%;right:20%;bottom:0;height:1px;background:var(--sht-ink);opacity:.25}
.sht-caret{display:inline-block;width:1.5px;height:.9em;margin-right:.06em;background:var(--sht-ink);animation:sht-blink 1.1s steps(1) infinite}
.sht-ph.is-focus .sht-caret{width:2px}
@keyframes sht-blink{50%{opacity:0}}
.sht-search-x{position:absolute;right:0;width:40px;height:40px;border-radius:999px;font-size:26px;line-height:1;color:var(--sht-muted)}
.sht-search-x:hover{color:var(--sht-ink);background:var(--sht-line)}
.sht-suggest{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px;margin-top:14px;font-size:12.5px;color:var(--sht-muted);opacity:.0;transform:translateY(-4px);transition:opacity .3s,transform .3s var(--sht-ease)}
.sht-search:hover .sht-suggest,.sht-suggest.is-on{opacity:1;transform:none}
.sht-suggest-b{padding:5px 11px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--sht-line);color:var(--sht-ink);transition:background .2s}
.sht-suggest-b:hover{background:var(--sht-surface)}

.sht-finder-grid{display:grid;grid-template-columns:150px minmax(0,1fr);gap:24px;margin-top:clamp(48px,6vw,80px);align-items:end}
.sht-finder-side{align-self:end;padding-bottom:6px}
.sht-finder-main{min-width:0;grid-row:1}
.sht-finder-side{grid-row:1;grid-column:1}
.sht-finder-main{grid-column:2}
.sht-row-head{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px}
.sht-row-title{font-size:14px;font-weight:600;letter-spacing:-.01em;min-width:70px}
.sht-chips{display:flex;gap:6px;flex-wrap:wrap}
.sht-chip{height:30px;padding:0 12px;border-radius:999px;font-size:12.5px;box-shadow:inset 0 0 0 1px var(--sht-line);display:inline-flex;align-items:center;gap:6px;transition:background .25s,color .25s,box-shadow .25s}
.sht-chip:hover{box-shadow:inset 0 0 0 1px var(--sht-ink)}
.sht-chip.is-on{background:var(--sht-ink);color:var(--sht-paper);box-shadow:none}
.sht-chip-n{font-size:11px;opacity:.65;font-variant-numeric:tabular-nums}
.sht-row-nav{margin-left:auto;display:flex;align-items:center;gap:8px}
.sht-count{font-size:12.5px;color:var(--sht-muted);margin-right:6px;font-variant-numeric:tabular-nums}
.sht-round{width:38px;height:38px;border-radius:999px;display:grid;place-items:center;box-shadow:inset 0 0 0 1px var(--sht-line);transition:background .2s,opacity .2s}
.sht-round:hover:not(:disabled){background:var(--sht-ink);color:var(--sht-paper)}
.sht-round:disabled{opacity:.3;cursor:default}
.sht-row{display:flex;gap:clamp(12px,1.3vw,18px);align-items:flex-start;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:6px 2px 10px;margin:-6px -2px 0;cursor:grab;overscroll-behavior-x:contain}
.sht-row::-webkit-scrollbar{display:none}
.sht-row.is-grabbing{cursor:grabbing;scroll-snap-type:none}
.sht-row.is-grabbing .sht-card{pointer-events:none}
.sht-card{position:relative;flex:none;scroll-snap-align:start;animation:sht-card .7s var(--sht-ease) both;animation-delay:calc(var(--i) * 45ms)}
@keyframes sht-card{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.sht-card-hit{display:flex;flex-direction:column;align-items:flex-start;text-align:left;width:100%}
.sht-card-pic{position:relative;display:block;width:100%;border-radius:16px;overflow:hidden;background:var(--sht-stone)}
.sht-card-pic .sht-pic{position:absolute;inset:0;transition:transform 1s var(--sht-ease)}
.sht-card-hit:hover .sht-card-pic .sht-pic{transform:scale(1.05)}
.sht-card-s{width:clamp(190px,17vw,240px)}.sht-card-s .sht-card-pic{height:clamp(200px,17.5vw,250px)}
.sht-card-l{width:clamp(250px,24vw,340px)}.sht-card-l .sht-card-pic{height:clamp(220px,20vw,290px)}
.sht-card-t{width:clamp(210px,20vw,280px)}.sht-card-t .sht-card-pic{height:clamp(280px,25vw,360px)}
.sht-card-m{width:clamp(230px,21vw,300px)}.sht-card-m .sht-card-pic{height:clamp(180px,16.5vw,240px)}
.sht-card-days{position:absolute;left:10px;top:10px;font-size:11px;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.88);color:#121317;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.sht-card-view{position:absolute;left:10px;bottom:10px;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:7px 12px;border-radius:999px;background:#121317;color:#f7f3ed;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .4s var(--sht-ease)}
.sht-card-hit:hover .sht-card-view,.sht-card-hit:focus-visible .sht-card-view{opacity:1;transform:none}
.sht-card-name{margin-top:10px;font-size:13px;font-weight:500;letter-spacing:-.01em}
.sht-card-price{margin-top:2px;font-size:12px;color:var(--sht-muted);font-variant-numeric:tabular-nums}
.sht-save{position:absolute;top:8px;right:8px;width:34px;height:34px;border-radius:999px;display:grid;place-items:center;background:rgba(255,255,255,.88);color:#121317;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:transform .3s var(--sht-ease),background .2s,color .2s}
.sht-save:hover{transform:scale(1.08)}
.sht-save.is-on{color:#d2453a}
.sht-save.is-on .sht-svg{animation:sht-pop .45s var(--sht-ease)}
@keyframes sht-pop{40%{transform:scale(1.35)}}
.sht-progress{height:1px;background:var(--sht-line);margin-top:22px;overflow:hidden}
.sht-progress span{display:block;height:100%;background:var(--sht-ink);transform-origin:left;transition:transform .3s}
.sht-empty{padding:48px 0 30px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:280px}
.sht-empty-t{font-size:clamp(22px,2.2vw,30px);letter-spacing:-.03em}
.sht-empty-s{color:var(--sht-muted);font-size:14px;margin-bottom:12px}

.sht-about{display:grid;grid-template-columns:minmax(220px,.9fr) 2.6fr;gap:clamp(20px,2vw,28px);background:var(--sht-surface);margin:0 12px;border-radius:var(--sht-r);padding:clamp(24px,2.4vw,34px)}
.sht-about-side{display:flex;flex-direction:column;gap:20px;padding:6px 4px}
.sht-serif-h{font-family:var(--sht-serif);font-weight:400;font-size:clamp(40px,4.6vw,74px);line-height:.98;letter-spacing:-.02em}
.sht-serif-m{font-size:clamp(34px,3.6vw,56px)}
.sht-stats{display:flex;flex-direction:column;gap:14px;margin-top:8px}
.sht-stat{display:grid;grid-template-columns:62px 1fr;align-items:baseline;gap:10px;padding-top:12px;border-top:1px solid var(--sht-line)}
.sht-stat dt{font-family:var(--sht-serif);font-size:26px;letter-spacing:-.02em}
.sht-stat dd{font-size:12.5px;color:var(--sht-muted);line-height:1.35}
.sht-foot{margin-top:auto;font-size:12px;line-height:1.35;white-space:pre-line}
.sht-steps{display:flex;gap:clamp(10px,1vw,14px);min-height:clamp(440px,40vw,560px)}
.sht-step{position:relative;flex:1 1 0;min-width:0;border-radius:18px;overflow:hidden;padding:16px;display:flex;flex-direction:column;justify-content:flex-end;transition:flex-grow .7s var(--sht-ease),opacity .9s var(--sht-ease),transform .9s var(--sht-ease);outline-offset:3px}
.sht-steps:hover .sht-step:hover,.sht-step:focus-visible,.sht-step:focus-within{flex-grow:1.55}
.sht-step-stone{background:var(--sht-stone);color:var(--sht-stone-ink)}
.sht-step-ink{background:var(--sht-night);color:var(--sht-night-ink)}
.sht-root.is-dark .sht-step-ink{box-shadow:inset 0 0 0 1px var(--sht-line)}
.sht-step-image{padding:0}
.sht-step-pic{position:absolute;inset:0}
.sht-step-pic .sht-svg{transition:transform 1.4s var(--sht-ease)}
.sht-step-image:hover .sht-step-pic .sht-svg{transform:scale(1.06)}
.sht-step-n{position:absolute;top:14px;left:16px;font-size:12px;letter-spacing:.02em}
.sht-halftone{position:absolute;left:-6px;top:30px;width:min(78%,240px);height:auto;fill:currentColor;opacity:.92;transition:transform 1.2s var(--sht-ease)}
.sht-step-stone:hover .sht-halftone,.sht-step-stone:focus-visible .sht-halftone{transform:translateX(14px) scale(1.04)}
.sht-step-t{font-size:clamp(17px,1.45vw,21px);font-weight:600;line-height:1.15;letter-spacing:-.02em;max-width:14em}
.sht-step-p{margin-top:10px;font-size:13px;line-height:1.45;opacity:.82;max-width:26em}

.sht-book{display:grid;grid-template-columns:1fr 1.15fr;gap:clamp(36px,6vw,110px);align-items:start}
.sht-faq{display:flex;flex-direction:column;gap:28px;scroll-margin-top:90px}
.sht-faq-list{border-top:1px solid var(--sht-line)}
.sht-q{border-bottom:1px solid var(--sht-line)}
.sht-q-h button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 0;text-align:left;font-size:15.5px;font-weight:500;letter-spacing:-.01em}
.sht-q-plus{position:relative;width:14px;height:14px;flex:none}
.sht-q-plus::before,.sht-q-plus::after{content:"";position:absolute;left:0;right:0;top:50%;height:1.5px;margin-top:-.75px;background:currentColor;transition:transform .35s var(--sht-ease)}
.sht-q-plus::after{transform:rotate(90deg)}
.sht-q.is-open .sht-q-plus::after{transform:rotate(0)}
.sht-q-a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s var(--sht-ease)}
.sht-q.is-open .sht-q-a{grid-template-rows:1fr}
.sht-q-a>div{overflow:hidden}
.sht-q-a p{padding:0 30px 18px 0;font-size:14px;line-height:1.55;color:var(--sht-muted)}
.sht-contact{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:22px;border-radius:18px;background:var(--sht-night);color:var(--sht-night-ink)}
.sht-contact dt{font-size:11.5px;opacity:.6}
.sht-contact dd{margin-top:4px;font-size:14px;letter-spacing:-.01em}
.sht-contact a{text-decoration:underline;text-decoration-color:rgba(255,255,255,.3);text-underline-offset:3px}
.sht-contact a:hover{text-decoration-color:currentColor}
.sht-form-wrap{display:flex;flex-direction:column;gap:14px;background:var(--sht-surface);border-radius:var(--sht-r);padding:clamp(24px,3vw,44px);scroll-margin-top:90px}
.sht-form-lede{font-size:14px;line-height:1.5;color:var(--sht-muted);max-width:34em}
.sht-form{display:flex;flex-direction:column;gap:18px;margin-top:10px}
.sht-field{display:flex;flex-direction:column;gap:7px;border:0;margin:0;padding:0;min-width:0}
.sht-field label,.sht-field legend,.sht-lab{font-size:12px;color:var(--sht-muted);padding:0}
.sht-field legend{margin-bottom:7px}
.sht-field input,.sht-field select,.sht-field textarea{width:100%;border:0;border-radius:12px;background:var(--sht-paper);padding:13px 14px;font-size:14.5px;outline:none;box-shadow:inset 0 0 0 1px var(--sht-line);transition:box-shadow .2s}
.sht-field textarea{resize:vertical;min-height:84px}
.sht-field input:focus,.sht-field select:focus,.sht-field textarea:focus{box-shadow:inset 0 0 0 1.5px var(--sht-ink)}
.sht-field [aria-invalid="true"]{box-shadow:inset 0 0 0 1.5px #c2412f}
.sht-field-row{flex-direction:row;align-items:center;justify-content:space-between}
.sht-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.sht-months{display:flex;flex-wrap:wrap;gap:6px;min-height:36px}
.sht-month{height:36px;padding:0 14px;border-radius:999px;font-size:13px;box-shadow:inset 0 0 0 1px var(--sht-line);transition:background .2s,color .2s}
.sht-month:hover{box-shadow:inset 0 0 0 1px var(--sht-ink)}
.sht-month.is-on{background:var(--sht-ink);color:var(--sht-paper);box-shadow:none}
.sht-stepper{display:inline-flex;align-items:center;border-radius:999px;box-shadow:inset 0 0 0 1px var(--sht-line)}
.sht-stepper button{width:40px;height:40px;border-radius:999px;font-size:18px}
.sht-stepper button:disabled{opacity:.3;cursor:default}
.sht-stepper button:hover:not(:disabled){background:var(--sht-paper)}
.sht-stepper output{min-width:28px;text-align:center;font-variant-numeric:tabular-nums;font-size:15px}
.sht-err{font-size:12.5px;color:#c2412f}
.sht-root.is-dark .sht-err{color:#ff8a78}
.sht-root.is-dark .sht-field [aria-invalid="true"]{box-shadow:inset 0 0 0 1.5px #ff8a78}
.sht-form .sht-btn-lg{align-self:flex-start;margin-top:4px}
.sht-done{display:grid;grid-template-columns:150px 1fr;gap:18px;margin-top:10px;padding:10px;border-radius:18px;background:var(--sht-paper);animation:sht-gem .7s var(--sht-ease) both}
.sht-done-pic{position:relative;border-radius:12px;overflow:hidden;min-height:170px}
.sht-done-pic .sht-pic{position:absolute;inset:0}
.sht-done-body{display:flex;flex-direction:column;gap:6px;padding:8px 8px 8px 0}
.sht-done-t{font-size:20px;font-weight:600;letter-spacing:-.02em}
.sht-done-s{font-size:13px;color:var(--sht-muted)}
.sht-ref{font-size:13px;margin:6px 0 10px}
.sht-ref strong{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;padding:3px 8px;border-radius:6px;background:var(--sht-surface)}
.sht-done .sht-btn{align-self:flex-start}

.sht-footer{padding:clamp(48px,6vw,80px) clamp(20px,3.4vw,52px) 24px;overflow:hidden}
.sht-footer-top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap}
.sht-footer-links{display:flex;gap:22px;flex-wrap:wrap;font-size:13px}
.sht-footer-links a{opacity:.75;transition:opacity .2s}
.sht-footer-links a:hover{opacity:1}
.sht-top{font-size:13px;opacity:.75}
.sht-top:hover{opacity:1}
.sht-wordmark{font-family:var(--sht-display);font-weight:500;font-size:clamp(90px,21vw,340px);line-height:1;padding:0 .02em .04em 0;letter-spacing:-.07em;margin:clamp(30px,4vw,60px) 0 0 -.05em;white-space:nowrap;width:max-content}
.sht-footer-note{margin-top:22px;font-size:12px;color:var(--sht-muted)}

.sht-menu{position:fixed;inset:0;z-index:80;background:var(--sht-night);color:var(--sht-night-ink);display:flex;flex-direction:column;justify-content:center;align-items:center;clip-path:inset(0 0 100% 0 round 0 0 40px 40px);transition:clip-path .7s var(--sht-ease),visibility 0s linear .7s;visibility:hidden;--sht-mark-cut:var(--sht-night)}
.sht-menu.is-open{clip-path:inset(0 0 0 0 round 0);visibility:visible;transition:clip-path .7s var(--sht-ease),visibility 0s}
.sht-menu-bar{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:clamp(28px,3.2vw,46px) clamp(28px,3.4vw,52px) 0}
.sht-brand-night{color:var(--sht-night-ink)}
.sht-x{width:42px;height:42px;border-radius:999px;display:grid;place-items:center;transition:background .2s,transform .35s var(--sht-ease)}
.sht-x:hover{background:rgba(255,255,255,.1);transform:rotate(90deg)}
.sht-menu-band{position:absolute;left:0;right:0;top:50%;height:clamp(110px,13vw,170px);transform:translateY(-50%);overflow:hidden;-webkit-mask-image:linear-gradient(90deg,#000 0,#000 26%,transparent 34%,transparent 66%,#000 74%,#000 100%);mask-image:linear-gradient(90deg,#000 0,#000 26%,transparent 34%,transparent 66%,#000 74%,#000 100%)}
.sht-menu-track{display:flex;gap:14px;height:100%;width:max-content;animation:sht-marquee 60s linear infinite}
.sht-menu-tile{position:relative;height:100%;aspect-ratio:1.45;border-radius:14px;overflow:hidden;flex:none}
.sht-menu-tile .sht-pic{position:absolute;inset:0}
@keyframes sht-marquee{to{transform:translateX(-50%)}}
.sht-menu-list{position:relative;display:flex;flex-direction:column;align-items:center}
.sht-menu-pill{position:absolute;left:50%;top:0;border-radius:12px;background:var(--sht-night-ink);transition:transform .45s var(--sht-ease),width .45s var(--sht-ease),height .45s var(--sht-ease);pointer-events:none}
.sht-menu-a{position:relative;z-index:1;font-size:clamp(34px,4.4vw,60px);font-weight:600;letter-spacing:-.035em;line-height:1.12;padding:0 4px;color:var(--sht-night-ink);transition:color .3s,opacity .5s,transform .6s var(--sht-ease);opacity:0;transform:translateY(24px)}
.sht-menu.is-open .sht-menu-a{opacity:1;transform:none;transition-delay:calc(.18s + var(--i) * 45ms),calc(.18s + var(--i) * 45ms),0s}
.sht-menu-a.is-on{color:var(--sht-night)}
.sht-root .sht-menu-a:focus-visible{outline:none}
.sht-menu-foot{position:absolute;left:0;right:0;bottom:24px;display:flex;justify-content:space-between;padding:0 clamp(28px,3.4vw,52px);font-size:12px;opacity:.55}

.sht-modal{position:fixed;inset:0;z-index:90;background:rgba(8,9,11,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:grid;place-items:center;padding:24px;animation:sht-fade .3s ease both;opacity:0}
.sht-dialog{position:relative;display:grid;grid-template-columns:1fr 1fr;width:min(1040px,100%);max-height:min(720px,calc(100svh - 48px));border-radius:var(--sht-r);overflow:hidden;background:var(--sht-paper);color:var(--sht-ink);box-shadow:0 40px 100px -30px rgba(0,0,0,.6);animation:sht-gem .55s var(--sht-ease) both;outline:none}
.sht-d-pic{position:relative;min-height:320px}
.sht-d-pic .sht-pic{position:absolute;inset:0}
.sht-d-region{position:absolute;left:16px;top:16px;font-size:11px;padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.9);color:#121317}
.sht-d-body{position:relative;overflow-y:auto;padding:clamp(24px,3vw,40px);display:flex;flex-direction:column;gap:16px;overscroll-behavior:contain}
.sht-d-x{position:absolute;top:14px;right:14px}
.sht-d-x:hover{background:var(--sht-line)}
.sht-d-h{font-family:var(--sht-serif);font-weight:400;font-size:clamp(36px,3.6vw,52px);line-height:1;letter-spacing:-.02em;padding-right:40px}
.sht-d-facts{display:grid;grid-template-columns:repeat(4,auto);justify-content:start;gap:8px 26px;padding:14px 0;border-top:1px solid var(--sht-line);border-bottom:1px solid var(--sht-line)}
.sht-d-facts dt{font-size:11px;color:var(--sht-muted)}
.sht-d-facts dd{font-size:15px;font-weight:500;margin-top:2px}
.sht-d-sum{font-size:15px;line-height:1.55}
.sht-d-hl{display:flex;flex-direction:column;gap:7px}
.sht-d-hl li{position:relative;padding-left:18px;font-size:13.5px;line-height:1.45;color:var(--sht-muted)}
.sht-d-hl li::before{content:"";position:absolute;left:0;top:.55em;width:8px;height:1px;background:var(--sht-ink)}
.sht-d-it{display:flex;flex-direction:column}
.sht-d-it li{display:grid;grid-template-columns:62px 1fr;gap:10px;padding:10px 0;border-top:1px solid var(--sht-line);font-size:13.5px;line-height:1.4}
.sht-d-day{font-size:11.5px;color:var(--sht-muted);padding-top:2px}
.sht-d-txt{display:block;color:var(--sht-muted);margin-top:2px}
.sht-d-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;position:sticky;bottom:calc(-1 * clamp(24px,3vw,40px));padding:14px 0 clamp(24px,3vw,40px);margin-bottom:calc(-1 * clamp(24px,3vw,40px));background:linear-gradient(rgba(0,0,0,0),var(--sht-paper) 26%)}
.sht-d-save{height:52px}
.sht-d-save.is-on{color:#d2453a}

@media (max-width:1000px){
  .sht-about{grid-template-columns:1fr}
  .sht-steps{min-height:0;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin:0 -4px;padding:0 4px}
  .sht-steps::-webkit-scrollbar{display:none}
  .sht-step{flex:0 0 min(72vw,300px);height:420px;scroll-snap-align:start}
  .sht-steps:hover .sht-step:hover,.sht-step:focus-visible,.sht-step:focus-within{flex-grow:0}
  .sht-book{grid-template-columns:1fr}
  .sht-book .sht-form-wrap{order:-1}
  .sht-stats{flex-direction:row;flex-wrap:wrap}
  .sht-stat{flex:1 1 160px;grid-template-columns:1fr}
}
@media (max-width:760px){
  .sht-hero{margin:8px;height:max(700px,calc(var(--sht-hero-h) - 16px));border-radius:18px}
  .sht-view,.sht-copy-light{clip-path:inset(calc(var(--sht-split) * 100%) 0 0 0)}
  .sht-slide{top:calc(var(--sht-split) * 100% - 40px)}
  .sht-copy{justify-content:flex-start;padding:max(112px,15vh) 20px 0}
  .sht-h1{font-size:clamp(40px,11.5vw,60px)}
  .sht-lede{font-size:13px;max-width:24em}
  .sht-burger{color:var(--sht-ink)}
  .sht-seam{left:0;right:0;width:auto;margin-left:0;top:calc(var(--sht-split) * 100%);bottom:auto;height:44px;margin-top:-22px;cursor:ns-resize}
  .sht-seam-line{top:50%;bottom:auto;left:0;right:0;width:auto;height:1px;transform:scaleX(0);transform-origin:left;animation-name:sht-line-x}
  @keyframes sht-line-x{to{transform:scaleX(1)}}
  .sht-seam-grip{top:0;left:auto;margin-left:auto;margin-right:24px}
  .sht-seam-grip .sht-svg{transform:rotate(90deg)}
  .sht-seam-hint{display:none}
  .sht-hero-index{display:none}
  .sht-place{top:calc(var(--sht-split) * 100% + 30px);right:auto;left:20px;align-items:flex-start}
  .sht-gem{left:10px;right:10px;width:auto;bottom:34px;grid-template-columns:32% 1fr;gap:12px;padding:8px}
  .sht-gem-pic{min-height:96px}
  .sht-gem-t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .sht-finder-grid{margin-top:28px}
  .sht-dots{right:50%;bottom:14px}
  .sht-finder-grid{grid-template-columns:1fr}
  .sht-finder-side{display:none}
  .sht-finder-main{grid-column:1}
  .sht-row-nav .sht-round{display:none}
  .sht-row{margin-right:-20px;padding-right:20px}
  .sht-card-s{width:200px}.sht-card-s .sht-card-pic{height:210px}
  .sht-card-l{width:260px}.sht-card-l .sht-card-pic{height:230px}
  .sht-card-t{width:220px}.sht-card-t .sht-card-pic{height:290px}
  .sht-card-m{width:240px}.sht-card-m .sht-card-pic{height:190px}
  .sht-about{margin:0 8px;padding:20px}
  .sht-two{grid-template-columns:1fr}
  .sht-contact{grid-template-columns:1fr 1fr}
  .sht-done{grid-template-columns:1fr}
  .sht-done-pic{min-height:150px}
  .sht-modal{padding:0;place-items:end stretch}
  .sht-dialog{grid-template-columns:1fr;max-height:92svh;border-radius:22px 22px 0 0;overflow-y:auto}
  .sht-d-pic{min-height:220px}
  .sht-d-body{overflow:visible}
  .sht-d-facts{grid-template-columns:repeat(2,auto)}
  .sht-d-actions{bottom:0;padding-bottom:16px}
  .sht-menu-a{font-size:clamp(32px,9.5vw,44px)}
  .sht-menu-band{-webkit-mask-image:linear-gradient(90deg,#000 0,#000 4%,transparent 14%,transparent 86%,#000 96%,#000 100%);mask-image:linear-gradient(90deg,#000 0,#000 4%,transparent 14%,transparent 86%,#000 96%,#000 100%);opacity:.5}
}
@media (prefers-reduced-motion:reduce){
  .sht-root *,.sht-root *::before,.sht-root *::after{animation-duration:1ms !important;animation-delay:0s !important;animation-iteration-count:1 !important;transition-duration:1ms !important;transition-delay:0s !important}
  .sht-par{transform:none}
  .sht-menu-track{animation:none}
  .sht-caret{opacity:1}
}
`

/* Declared after the JSX so the 21st CLI tokenizer never meets a generic above it. */
export type ShtPaletteInput = Partial<ShtPalette>
