"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Vernissage Museum Template — the home page of an art and history museum,
 * hung the way a museum hangs its walls.
 *
 * One visual language runs through the page: every image sits inside a gilt
 * hairline frame that draws itself on as it scrolls into view, every caption
 * is set like a wall label, and the hero is a slow, lit gallery.
 *
 * - Hero: a carousel of featured exhibitions. The photo breathes (a long,
 *   slow scale), the title rises word by word out of a clip, and the gilt
 *   frame draws around the stage. Arrows, dots, keyboard, and an autoplay
 *   hairline that pauses under the pointer.
 * - Welcome: a photograph of a marble bust is re-drawn at runtime as a
 *   graphite study on the paper (grayscale, inverted blur, colour dodge,
 *   then an elliptical fade), and scrubs into view as you scroll.
 * - Exhibitions: hover or focus a row and the banner above crossfades to it.
 * - Visitor info: a split band with live "open now / closed" state computed
 *   from the opening hours prop, and today's row marked in gold.
 * - Collection: a three-column hang that reveals piece by piece, paginated
 *   by "Load more", with a keyboard-navigable lightbox.
 * - Services: an accordion with line icons. Footer with the wordmark.
 * - GSAP + ScrollTrigger inside one gsap.context (reverted on unmount) and
 *   gsap.matchMedia so `prefers-reduced-motion` renders the page finished.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

// ---- public types ---------------------------------------------------------------

export type VernissagePreset = "gilt" | "lapis" | "moss"

export type VernissageColors = {
  /** Page paper. */
  paper?: string
  /** Slightly deeper paper for alternating bands. */
  paper2?: string
  /** Type and rules. */
  ink?: string
  /** Secondary text. */
  muted?: string
  /** The gilt: frames, wordmark, markers. */
  gold?: string
  /** The dark bands (visitor info, footer) and the hero tint. */
  band?: string
  /** The accent where it sits on a dark band or a photograph. */
  goldOnBand?: string
}

export type VernissageImage = {
  src: string
  alt?: string
  /** Where the crop centres, 0–1 on each axis. Default [0.5, 0.5]. */
  focus?: [number, number]
}

export type VernissageLink = { label: string; href: string }

export type VernissageSlide = {
  /** Dates or a short kicker above the title. */
  kicker?: string
  title: string
  cta?: VernissageLink
  image: string | VernissageImage
}

export type VernissageExhibition = {
  title: string
  dates: string
  blurb: string
  image: string | VernissageImage
  href?: string
}

/** Opening hours as 24h decimal numbers, e.g. [10, 17.5] for 10 am – 5:30 pm. */
export type VernissageDayHours = [number, number] | null

export type VernissageArtwork = {
  title: string
  artist: string
  year?: string
  image: string | VernissageImage
  /** Aspect ratio of the piece, so the hang keeps its shape while images load. Default [4, 5]. */
  ratio?: [number, number]
  href?: string
}

export type VernissageService = {
  title: string
  body: string
  icon?: "audio" | "camera" | "dining" | "shop" | "ticket" | "access"
  link?: VernissageLink
}

export type VernissageMuseum = {
  /** Wordmark text, set in the serif. */
  name?: string
  tagline?: string
  address?: string
  phone?: string
  email?: string
}

export type VernissageHero = {
  slides?: VernissageSlide[]
  /** Milliseconds per slide. 0 turns autoplay off. Default 7000. */
  autoplay?: number
}

export type VernissageWelcome = {
  title?: string
  body?: string
  link?: VernissageLink
  /** The photograph re-drawn as a graphite study. */
  image?: string | VernissageImage
  /** Draw the study at runtime. Off shows the photo as a soft duotone. */
  sketch?: boolean
}

export type VernissagePrice = { label: string; value: string }

export type VernissageVisitor = {
  title?: string
  pricesTitle?: string
  prices?: VernissagePrice[]
  hoursTitle?: string
  link?: VernissageLink
  image?: string | VernissageImage
}

export type VernissageCollection = {
  title?: string
  intro?: string
  viewAll?: VernissageLink
  items?: VernissageArtwork[]
  /** How many pieces hang before "Load more". Default 6. */
  pageSize?: number
  loadMore?: string
}

export type VernissageFooterColumn = { title: string; links: VernissageLink[] }

export type VernissageFooter = {
  columns?: VernissageFooterColumn[]
  social?: VernissageLink[]
  copyright?: string
}

export type VernissageMuseumTemplateProps = {
  /** Height of the hero stage. Must be a definite length. */
  height?: string
  preset?: VernissagePreset
  colors?: VernissageColors
  /** "auto" follows a `.dark` ancestor. */
  theme?: "auto" | "light" | "dark"
  /** Stylesheet for the fonts; null loads nothing and uses the stacks as they are. */
  fontHref?: string | null
  /** CSS font-family stacks. */
  fonts?: { sans?: string; serif?: string }
  museum?: VernissageMuseum
  /** Links left and right of the wordmark. In-page hrefs ("#exhibitions", "#collection", "#visit", "#services", "#about", "#top") scroll. */
  nav?: { left?: VernissageLink[]; right?: VernissageLink[] }
  languages?: string[]
  /** Sunday first, seven entries. null is a closed day. */
  hours?: VernissageDayHours[]
  /** The clock the open/closed state is computed from. Default: the visitor's. */
  now?: Date
  hero?: VernissageHero
  welcome?: VernissageWelcome
  exhibitions?: { title?: string; viewAll?: VernissageLink; items?: VernissageExhibition[]; more?: string }
  visitor?: VernissageVisitor
  collection?: VernissageCollection
  services?: { title?: string; items?: VernissageService[] }
  footer?: VernissageFooter
  onNavigate?: (href: string) => void
  onSearch?: (query: string) => void
  onLanguage?: (code: string) => void
  onExhibition?: (exhibition: VernissageExhibition) => void
  onArtwork?: (artwork: VernissageArtwork) => void
  className?: string
}

// ---- defaults ---------------------------------------------------------------------

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@400;500;600&display=swap"

const SANS = 'Montserrat, "Avenir Next", "Helvetica Neue", Arial, sans-serif'
const SERIF = '"Cormorant Garamond", "Cormorant", "EB Garamond", Garamond, "Times New Roman", serif'

const PALETTES = {
  gilt: { paper: "#f4f0e6", paper2: "#ece6d8", ink: "#1a1813", muted: "#6e6757", gold: "#b8923a", band: "#141311", goldOnBand: "#cfa64e" },
  lapis: { paper: "#f1f0ea", paper2: "#e6e6de", ink: "#15192a", muted: "#5d6275", gold: "#2d4f9e", band: "#0f1322", goldOnBand: "#9db4f0" },
  moss: { paper: "#f2f0e8", paper2: "#e7e5d8", ink: "#1b1f16", muted: "#646a57", gold: "#8a7a2e", band: "#141710", goldOnBand: "#cbbb68" },
}

const U = (id: string, w: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&q=80"

const DEFAULT_MUSEUM = {
  name: "aurelian",
  tagline: "Museum of Art & History",
  address: "48 Larkspur Row, Brooklyn, NY 11205",
  phone: "+1 (718) 555 0148",
  email: "visit@aurelian.museum",
}

const DEFAULT_NAV = {
  left: [
    { label: "Home", href: "#top" },
    { label: "Exhibitions", href: "#exhibitions" },
    { label: "Collection", href: "#collection" },
    { label: "About", href: "#about" },
  ],
  right: [
    { label: "Events", href: "#events" },
    { label: "Journal", href: "#journal" },
    { label: "Shop", href: "#shop" },
    { label: "Visit", href: "#visit" },
  ],
}

const DEFAULT_LANGUAGES = ["EN", "FR", "DE", "ES"]

/** Sunday first. */
const DEFAULT_HOURS: VernissageDayHours[] = [[11, 17], null, [10, 17], [10, 17], [10, 17], [10, 17], [10, 17]]

const DEFAULT_SLIDES: VernissageSlide[] = [
  {
    kicker: "February 10 — April 28",
    title: "Masterpieces of the Department of Prints and Drawings",
    cta: { label: "Learn more", href: "#exhibitions" },
    image: { src: U("1637578035109-a28d894f3d2f", 2200), focus: [0.5, 0.45], alt: "A gallery of old master paintings with a cannon on the floor" },
  },
  {
    kicker: "May 6 — August 30",
    title: "The Dutch Interior: Light, Linen and Silence",
    cta: { label: "Learn more", href: "#exhibitions" },
    image: { src: U("1758380742154-44738eb92832", 2200), focus: [0.5, 0.35], alt: "Visitors in a dark gallery lit on gold-framed paintings" },
  },
  {
    kicker: "Opening September 12",
    title: "Landscape as Memory: Northern Painting 1840–1910",
    cta: { label: "Learn more", href: "#exhibitions" },
    image: { src: U("1736023164636-c41930fb9e10", 2200), focus: [0.5, 0.5], alt: "Visitors reading a wall text beside a gold-framed landscape" },
  },
]

const DEFAULT_WELCOME: { title: string; body: string; link: VernissageLink; image: VernissageImage; sketch: boolean } = {
  title: "Welcome to the Art and History Museum Aurelian",
  body:
    "The collection is the reason people come. The research, the exhibitions and the schools programme are the reason they come back; together they have given the Aurelian its place among the museums of the world for a hundred and twelve years.",
  link: { label: "More about", href: "#about" },
  image: { src: U("1764992117731-b41b680387dd", 1400), focus: [0.45, 0.5], alt: "A marble bust beside a window, in slatted light" },
  sketch: true,
}

const DEFAULT_EXHIBITIONS: VernissageExhibition[] = [
  {
    title: "Johan Zoffany: The Painted Room",
    dates: "February 10 — April 28, 2026",
    blurb: "Forty conversation pieces and the sketchbooks behind them, shown together for the first time since they left the painter's studio.",
    image: { src: U("1736023164636-c41930fb9e10", 1800), focus: [0.5, 0.5], alt: "Visitors beside a gold-framed landscape painting" },
    href: "#exhibitions",
  },
  {
    title: "Pressing Matters: Record Sleeves 1966–1970",
    dates: "March 3 — June 14, 2026",
    blurb: "Five years in which the twelve-inch square became a gallery of its own. Original artwork, proofs and the records themselves.",
    image: { src: U("1681490443016-30ae75a1647b", 1800), focus: [0.5, 0.5], alt: "A visitor walking through a white gallery of framed paintings" },
    href: "#exhibitions",
  },
  {
    title: "Bernard van Orley and the Brussels Looms",
    dates: "April 18 — September 6, 2026",
    blurb: "Cartoons, tapestries and stained glass from the workshop that dressed the courts of Europe, with three panels newly conserved.",
    image: { src: U("1769117695165-6ecb44ff1150", 1800), focus: [0.5, 0.4], alt: "A dimly lit gallery corridor hung with framed works" },
    href: "#exhibitions",
  },
]

const DEFAULT_VISITOR: { title: string; pricesTitle: string; prices: VernissagePrice[]; hoursTitle: string; link: VernissageLink; image: VernissageImage } = {
  title: "Visitor Info",
  pricesTitle: "Admission prices",
  prices: [
    { label: "Adults", value: "$15.00" },
    { label: "Groups from 10 p.", value: "$12.00" },
    { label: "Youth 19 – 24", value: "$8.00" },
    { label: "Under 18", value: "Free" },
  ],
  hoursTitle: "Opening hours",
  link: { label: "Plan your visit", href: "#visit" },
  image: { src: U("1758380742154-44738eb92832", 1600), focus: [0.5, 0.4], alt: "Visitors in a dark gallery lit on gold-framed paintings" },
}

const DEFAULT_COLLECTION: VernissageArtwork[] = [
  { title: "Vase of Flowers", artist: "Jan Davidsz. de Heem", year: "1670", ratio: [400, 569], image: { src: U("1579783900882-c0d3dad7b119", 1200), alt: "A dense bouquet in a glass vase on a stone ledge" } },
  { title: "Gebirgssee", artist: "Adolf Zdrazila", year: "1900", ratio: [400, 339], image: { src: U("1699569848351-f28e87e185ec", 1200), alt: "A mountain lake in a yellow autumn valley" } },
  { title: "Sapho", artist: "Jean-Baptiste Regnault", year: "c. 1790", ratio: [400, 322], image: { src: U("1655455561178-0d3c092d0edb", 1200), alt: "A reclining figure asleep beside a lyre" } },
  { title: "Portrait of a Young Woman", artist: "Netherlandish", year: "1480 – 1499", ratio: [400, 602], image: { src: U("1752317591841-bbca8ed3eb0b", 1200), alt: "A young woman in profile in a red dress and white headdress" } },
  { title: "Tronie of an Old Man", artist: "Rembrandt van Rijn", year: "c. 1630", ratio: [400, 489], image: { src: U("1579009120139-f41119c5e2ba", 1200), alt: "An old man in a fur coat and black cap" } },
  { title: "Banquet Still Life", artist: "Adriaen van Utrecht", year: "1644", ratio: [400, 301], image: { src: U("1588260275894-4f51cc4c12b1", 1200), alt: "A table heaped with fruit, lobster and a parrot" } },
  { title: "Landscape from Romsdalen", artist: "Johan Fredrik Eckersberg", year: "1858", ratio: [400, 294], image: { src: U("1700405495181-69f35790a8aa", 1200), alt: "A Norwegian valley beneath a sharp peak and cloud" } },
  { title: "Saint Sebastian", artist: "attr. Lorenzo Lippi", year: "c. 1630", ratio: [400, 512], image: { src: U("1743341491576-15ee095a83ac", 1200), alt: "A young man with arrows looking upward" } },
  { title: "Portrait of a Woman", artist: "Dutch", year: "1667", ratio: [400, 495], image: { src: U("1582561424725-ad87a9a79fa3", 1200), alt: "A woman in a red gown with pearls beside a curtain" } },
  { title: "Portrait of Madame Simon", artist: "Eugène Delacroix", year: "1850", ratio: [400, 572], image: { src: U("1694727329633-7760a2bd8d0f", 1200), alt: "A woman in a white dress seated by a fireplace" } },
  { title: "Still Life with Flowers", artist: "Jakub Bogdan", year: "c. 1690", ratio: [400, 305], image: { src: U("1700213396551-48c119a84c8e", 1200), alt: "Red and white flowers against a dark ground" } },
  { title: "The Lamentation", artist: "Dutch", year: "1640", ratio: [400, 370], image: { src: U("1581592717605-765045be25bb", 1200), alt: "Mourning figures around a reclining body" } },
]

const DEFAULT_SERVICES: VernissageService[] = [
  { title: "Audioguide", icon: "audio", body: "Ninety minutes in eight languages, narrated by the curators. Pick one up at the cloakroom or stream it on your own phone with the museum Wi-Fi.", link: { label: "Download the app", href: "#services" } },
  { title: "Photography", icon: "camera", body: "Photographs without flash are welcome in the permanent collection. Loan exhibitions are marked at the door; tripods and video need a permit from the press office.", link: { label: "Request a permit", href: "#services" } },
  { title: "Restaurant and Café", icon: "dining", body: "The Orangery serves lunch from noon under the glass roof; the café by the cloisters pours until closing. Both are open without a ticket.", link: { label: "See the menu", href: "#services" } },
  { title: "Shop", icon: "shop", body: "Catalogues, prints from the collection, and the museum's own stationery. Members take ten percent off everything, every day.", link: { label: "Browse online", href: "#shop" } },
]

const DEFAULT_FOOTER = {
  columns: [
    { title: "Links", links: [{ label: "Home", href: "#top" }, { label: "Exhibitions", href: "#exhibitions" }, { label: "Collection", href: "#collection" }, { label: "Events", href: "#events" }] },
    { title: "Information", links: [{ label: "About", href: "#about" }, { label: "Visit", href: "#visit" }, { label: "Journal", href: "#journal" }, { label: "Shop", href: "#shop" }] },
    { title: "Social", links: [{ label: "Instagram", href: "#" }, { label: "Facebook", href: "#" }, { label: "X", href: "#" }] },
  ],
  social: [{ label: "Instagram", href: "#" }, { label: "Facebook", href: "#" }, { label: "X", href: "#" }],
  copyright: "© 2026 Aurelian Museum of Art & History. All rights reserved.",
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// ---- logic (lifted into tests) ----------------------------------------------------

// #region hours
/** 17.5 → "5:30 pm", 10 → "10 am", 12 → "12 pm", 0 → "12 am". */
function fmtHour(h: number) {
  const whole = Math.floor(h)
  const mins = Math.round((h - whole) * 60)
  const ampm = whole >= 12 && whole < 24 ? "pm" : "am"
  let hr = whole % 12
  if (hr === 0) hr = 12
  return hr + (mins ? ":" + String(mins).padStart(2, "0") : "") + " " + ampm
}

/** Live state of the doors for the top bar. `now` is a Date; `hours` is Sunday-first. */
function openState(hours: VernissageDayHours[], now: Date, days: string[]) {
  const d = now.getDay()
  const t = now.getHours() + now.getMinutes() / 60
  const today = hours[d] || null
  if (today && t >= today[0] && t < today[1]) return { open: true, label: "Open today · " + fmtHour(today[0]) + " – " + fmtHour(today[1]) }
  if (today && t < today[0]) return { open: false, label: "Opens today at " + fmtHour(today[0]) }
  for (let i = 1; i <= 7; i++) {
    const n = hours[(d + i) % 7]
    if (n) return { open: false, label: "Closed now · opens " + (i === 1 ? "tomorrow" : days[(d + i) % 7]) + " at " + fmtHour(n[0]) }
  }
  return { open: false, label: "Closed" }
}

/** Runs of consecutive days with the same hours, Monday first: "Tuesday – Saturday" / "10 am – 5 pm". */
function groupHours(hours: VernissageDayHours[], days: string[]) {
  const order = [1, 2, 3, 4, 5, 6, 0]
  const key = (h: VernissageDayHours) => (h ? h[0] + "-" + h[1] : "closed")
  const out: { days: string; hours: string; indices: number[] }[] = []
  let run: number[] = []
  const flush = () => {
    if (!run.length) return
    const h = hours[run[0]]
    const label = run.length === 1 ? days[run[0]] : run.length === 2 ? days[run[0]] + " and " + days[run[1]] : days[run[0]] + " – " + days[run[run.length - 1]]
    out.push({ days: run.length === 1 && run[0] === 0 ? "Sundays" : label, hours: h ? fmtHour(h[0]) + " – " + fmtHour(h[1]) : "Closed", indices: run })
    run = []
  }
  for (const d of order) {
    if (run.length && key(hours[run[run.length - 1]]) !== key(hours[d])) flush()
    run.push(d)
  }
  flush()
  return out
}
// #endregion

// #region sketch
/** Luminance of an RGBA buffer, 0–255. */
function toGray(data: Uint8ClampedArray, w: number, h: number) {
  const g = new Float32Array(w * h)
  for (let i = 0, p = 0; i < g.length; i++, p += 4) g[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]
  return g
}

/** Separable box blur with running sums; two passes of it read as a gaussian. */
function boxBlur(src: Float32Array, w: number, h: number, r: number) {
  r = Math.max(0, Math.round(r))
  if (!r) return Float32Array.from(src)
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  const span = r * 2 + 1
  for (let y = 0; y < h; y++) {
    const row = y * w
    let acc = 0
    for (let x = -r; x <= r; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))]
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / span
      acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / span
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]
    }
  }
  return out
}

/** Colour-dodge of the grey against its inverted blur: the classic pencil study. 0–255, white is paper. */
function dodge(g: number, blurred: number) {
  const inv = 255 - blurred
  if (inv >= 255) return 255
  return Math.min(255, (g * 255) / (255 - inv))
}

/**
 * Graphite coverage per pixel, 0–1: 0 is clean paper, 1 is full tone. `strength`
 * darkens the faint dodge result; `fade` is the width of the elliptical edge fade
 * as a fraction of the half-size (0 for none).
 */
function sketchCoverage(data: Uint8ClampedArray, w: number, h: number, radius: number, strength: number, fade: number) {
  const g = toGray(data, w, h)
  const b = boxBlur(boxBlur(g, w, h, radius), w, h, radius)
  const out = new Float32Array(w * h)
  const cx = (w - 1) / 2
  const cy = (h - 1) / 2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      let v = (255 - dodge(g[i], b[i])) / 255
      // a touch of the tone itself so flat shadow still carries some graphite
      v = v * strength + ((255 - g[i]) / 255) * 0.08
      if (fade > 0) {
        const nx = (x - cx) / (cx || 1)
        const ny = (y - cy) / (cy || 1)
        const d = Math.sqrt(nx * nx + ny * ny)
        const edge = 1 - fade
        if (d > edge) v *= Math.max(0, 1 - (d - edge) / fade)
      }
      out[i] = v > 1 ? 1 : v < 0 ? 0 : v
    }
  }
  return out
}
// #endregion

// #region paging
function wrap(i: number, n: number) {
  return n <= 0 ? 0 : ((i % n) + n) % n
}
function splitWords(s: string) {
  return s.split(/\s+/).filter(Boolean)
}
function nextShown(shown: number, size: number, total: number) {
  return Math.min(total, shown + Math.max(1, size))
}
// #endregion

function toImage(v: string | VernissageImage | undefined, fallback: VernissageImage): VernissageImage {
  if (!v) return fallback
  if (typeof v === "string") return { src: v, alt: fallback.alt }
  return { alt: fallback.alt, ...v }
}
function focusPos(img: VernissageImage) {
  const f = img.focus || [0.5, 0.5]
  return Math.round(f[0] * 100) + "% " + Math.round(f[1] * 100) + "%"
}
function parseRgb(s: string) {
  const m = s.match(/(\d+(?:\.\d+)?)/g)
  if (!m || m.length < 3) return [26, 24, 19]
  return [+m[0], +m[1], +m[2]]
}

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

// ---- small parts ------------------------------------------------------------------

function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  const body = (() => {
    switch (name) {
      case "arrow":
        return <path d="M3 12h17M14 6l6 6-6 6" {...p} />
      case "arrow-left":
        return <path d="M21 12H4M10 6l-6 6 6 6" {...p} />
      case "chevron":
        return <path d="M6 9l6 6 6-6" {...p} />
      case "search":
        return <g {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></g>
      case "globe":
        return <g {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></g>
      case "pin":
        return <g {...p}><path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></g>
      case "clock":
        return <g {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></g>
      case "menu":
        return <path d="M4 7h16M4 12h16M4 17h16" {...p} />
      case "close":
        return <path d="M6 6l12 12M18 6L6 18" {...p} />
      case "audio":
        return <g {...p}><path d="M4 13a8 8 0 0 1 16 0" /><path d="M4 13v5a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2zM20 13v5a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2z" /></g>
      case "camera":
        return <g {...p}><path d="M4 8.5h3l1.5-2.5h7L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.2" /></g>
      case "dining":
        return <g {...p}><path d="M5 3v7a2.5 2.5 0 0 0 5 0V3M7.5 3v18M17.5 3c-2 2-2.5 5-2.5 9h2.5v9" /></g>
      case "shop":
        return <g {...p}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></g>
      case "ticket":
        return <g {...p}><path d="M3 9a2 2 0 0 0 0 6v4h18v-4a2 2 0 0 0 0-6V5H3v4z" /><path d="M13 5v14" strokeDasharray="2 2" /></g>
      case "access":
        return <g {...p}><circle cx="12" cy="5" r="1.6" /><path d="M9 10h6l-1 5h3l1 5M9 10l1 5 3 0" /><path d="M6 14a5 5 0 0 0 7 6" /></g>
      case "instagram":
        return <g {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17" cy="7" r=".6" fill="currentColor" /></g>
      case "facebook":
        return <path d="M14 8h2.5V4.5H14A4 4 0 0 0 10 8.5V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.8c0-.5.3-.8.5-.8z" {...p} />
      case "x":
        return <path d="M4 4l16 16M20 4L4 20" {...p} />
      default:
        return <circle cx="12" cy="12" r="3" {...p} />
    }
  })()
  return (
    <svg className={"vmt-ic " + className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {body}
    </svg>
  )
}

/** A photograph hung in a gilt hairline frame. The rect draws on through `--draw`. */
function Frame({
  image,
  ratio,
  className = "",
  sizes,
  children,
  style,
}: {
  image: VernissageImage
  ratio?: [number, number]
  className?: string
  sizes?: string
  children?: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <figure className={"vmt-frame " + className} style={{ ...(ratio ? { aspectRatio: ratio[0] + " / " + ratio[1] } : {}), ...(style || {}) }}>
      <img className="vmt-frame-img" src={image.src} alt={image.alt || ""} loading="lazy" decoding="async" sizes={sizes} style={{ objectPosition: focusPos(image) }} />
      <svg className="vmt-fr" aria-hidden="true" focusable="false">
        <rect width="100%" height="100%" pathLength={1} />
      </svg>
      {children}
    </figure>
  )
}

/**
 * The photograph re-drawn as a graphite study. The pixels are read once (cross-
 * origin, so a tainted image falls back to a soft duotone of the photo), run
 * through the dodge, then painted in the current `color` so dark mode works.
 */
function Sketch({ image, enabled, className = "" }: { image: VernissageImage; enabled: boolean; className?: string }) {
  const box = React.useRef(null as HTMLDivElement | null)
  const cv = React.useRef(null as HTMLCanvasElement | null)
  const [state, setState] = React.useState(enabled ? "drawing" : "flat")

  React.useEffect(() => {
    if (!enabled) {
      setState("flat")
      return
    }
    const el = box.current
    const canvas = cv.current
    if (!el || !canvas) return
    let alive = true
    let raf = 0
    let coverage: Float32Array | null = null
    let cw = 0
    let ch = 0
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.decoding = "async"

    const paint = () => {
      if (!alive || !coverage) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const r = el.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = Math.max(1, Math.round(r.width * dpr))
      const H = Math.max(1, Math.round(r.height * dpr))
      canvas.width = W
      canvas.height = H
      const [ir, ig, ib] = parseRgb(getComputedStyle(canvas).color)
      const off = document.createElement("canvas")
      off.width = cw
      off.height = ch
      const octx = off.getContext("2d")
      if (!octx) return
      const out = octx.createImageData(cw, ch)
      for (let i = 0, p = 0; i < coverage.length; i++, p += 4) {
        out.data[p] = ir
        out.data[p + 1] = ig
        out.data[p + 2] = ib
        out.data[p + 3] = Math.round(coverage[i] * 235)
      }
      octx.putImageData(out, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(off, 0, 0, W, H)
    }

    const build = () => {
      if (!alive) return
      const r = el.getBoundingClientRect()
      const aspect = r.height > 0 && r.width > 0 ? r.width / r.height : 1
      // the study is computed at a modest size: the dodge is per pixel
      cw = Math.min(820, Math.max(240, Math.round(r.width)))
      ch = Math.max(1, Math.round(cw / aspect))
      const off = document.createElement("canvas")
      off.width = cw
      off.height = ch
      const octx = off.getContext("2d", { willReadFrequently: true })
      if (!octx) return setState("flat")
      // cover-crop the photo around its focus
      const f = image.focus || [0.5, 0.5]
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
      const sw = img.naturalWidth * s
      const sh = img.naturalHeight * s
      octx.drawImage(img, (cw - sw) * f[0], (ch - sh) * f[1], sw, sh)
      let data: ImageData
      try {
        data = octx.getImageData(0, 0, cw, ch)
      } catch {
        setState("flat")
        return
      }
      coverage = sketchCoverage(data.data, cw, ch, Math.max(2, cw / 110), 2.6, 0.42)
      paint()
      setState("drawn")
    }

    img.onload = () => {
      if (!alive) return
      raf = requestAnimationFrame(build)
    }
    img.onerror = () => alive && setState("flat")
    img.src = image.src
    const ro = new ResizeObserver(() => {
      if (!coverage) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(paint)
    })
    ro.observe(el)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [image.src, image.focus, enabled])

  return (
    <div ref={box} className={"vmt-sketch is-" + state + " " + className} role="img" aria-label={image.alt || ""}>
      <canvas ref={cv} className="vmt-sketch-cv" />
      {state === "flat" && <img className="vmt-sketch-flat" src={image.src} alt="" loading="lazy" decoding="async" style={{ objectPosition: focusPos(image) }} />}
    </div>
  )
}

const REDUCE = "(prefers-reduced-motion: reduce)"

/** Pieces rise into their frames as they enter; the frame draws, the photo settles. */
function revealArts(nodes: Element[]) {
  if (typeof window === "undefined" || window.matchMedia(REDUCE).matches) return
  nodes.forEach((n, i) => {
    const img = n.querySelector(".vmt-frame-img")
    const frame = n.querySelector(".vmt-frame")
    const st = { trigger: n, start: "top 90%", once: true }
    gsap.fromTo(n, { clipPath: "inset(100% 0% 0% 0%)", y: 48 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.3, delay: (i % 3) * 0.09, ease: "power3.out", scrollTrigger: st })
    if (img) gsap.fromTo(img, { scale: 1.14 }, { scale: 1, duration: 2, delay: (i % 3) * 0.09, ease: "power2.out", clearProps: "transform", scrollTrigger: st })
    if (frame) gsap.fromTo(frame, { "--draw": 0 }, { "--draw": 1, duration: 1.6, delay: 0.3 + (i % 3) * 0.09, ease: "power2.inOut", scrollTrigger: st })
  })
}

function socialIcon(label: string) {
  const l = label.toLowerCase()
  if (l.includes("insta")) return "instagram"
  if (l.includes("face")) return "facebook"
  return "x"
}

// ---- the template -----------------------------------------------------------------

export default function VernissageMuseumTemplate({
  height = "100svh",
  preset = "gilt",
  colors,
  theme = "auto",
  fontHref = FONT_HREF,
  fonts,
  museum,
  nav,
  languages = DEFAULT_LANGUAGES,
  hours = DEFAULT_HOURS,
  now,
  hero,
  welcome,
  exhibitions,
  visitor,
  collection,
  services,
  footer,
  onNavigate,
  onSearch,
  onLanguage,
  onExhibition,
  onArtwork,
  className = "",
}: VernissageMuseumTemplateProps) {
  const pal = { ...(PALETTES[preset] || PALETTES.gilt), ...(colors || {}) }
  const m = { ...DEFAULT_MUSEUM, ...(museum || {}) }
  const navL = nav?.left ?? DEFAULT_NAV.left
  const navR = nav?.right ?? DEFAULT_NAV.right
  const langs = languages.length ? languages : DEFAULT_LANGUAGES
  const hoursList = hours.length === 7 ? hours : DEFAULT_HOURS
  const slides = hero?.slides?.length ? hero.slides : DEFAULT_SLIDES
  const autoplay = hero?.autoplay ?? 7000
  const w = { ...DEFAULT_WELCOME, ...(welcome || {}) }
  const wImage = toImage(w.image, DEFAULT_WELCOME.image)
  const exTitle = exhibitions?.title ?? "Upcoming Exhibitions"
  const exAll = exhibitions?.viewAll ?? { label: "View all exhibitions", href: "#exhibitions" }
  const exItems = exhibitions?.items?.length ? exhibitions.items : DEFAULT_EXHIBITIONS
  const exMore = exhibitions?.more ?? "More info"
  const v = { ...DEFAULT_VISITOR, ...(visitor || {}) }
  const vImage = toImage(v.image, DEFAULT_VISITOR.image)
  const col = {
    title: "Collection",
    intro: "A hundred thousand works, from a Roman glass bead to last year's acquisitions. Here is a first room of twelve, re-hung each season.",
    viewAll: { label: "View all collection", href: "#collection" },
    pageSize: 6,
    loadMore: "Load more",
    ...(collection || {}),
  }
  const arts = collection?.items?.length ? collection.items : DEFAULT_COLLECTION
  const svTitle = services?.title ?? "Services"
  const svItems = services?.items?.length ? services.items : DEFAULT_SERVICES
  const ft = { ...DEFAULT_FOOTER, ...(footer || {}) }
  const sans = fonts?.sans ?? SANS
  const serif = fonts?.serif ?? SERIF
  const n = slides.length
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")

  const root = React.useRef(null as HTMLDivElement | null)
  const page = React.useRef(null as HTMLDivElement | null)
  const heroRef = React.useRef(null as HTMLElement | null)
  const barRef = React.useRef(null as HTMLElement | null)
  const apRef = React.useRef(null as HTMLElement | null)
  const apTween = React.useRef(null as gsap.core.Tween | null)
  const hovering = React.useRef(false)
  const ctxRef = React.useRef(null as gsap.Context | null)
  const prevSlide = React.useRef(0)
  const pendingReveal = React.useRef(-1)
  const closeRef = React.useRef(null as HTMLButtonElement | null)
  const hangRef = React.useRef(null as HTMLDivElement | null)
  const langRef = React.useRef(null as HTMLDivElement | null)

  const [slide, setSlide] = React.useState(0)
  const [activeEx, setActiveEx] = React.useState(0)
  const [shown, setShown] = React.useState(Math.min(arts.length, Math.max(1, col.pageSize)))
  const [lightbox, setLightbox] = React.useState(-1)
  const [openSvc, setOpenSvc] = React.useState(0)
  const [menu, setMenu] = React.useState(false)
  const [search, setSearch] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [langOpen, setLangOpen] = React.useState(false)
  const [lang, setLang] = React.useState(langs[0])
  const [clock, setClock] = React.useState(() => now || new Date())
  const [cols, setCols] = React.useState(3)

  const doors = openState(hoursList, clock, DAYS)
  const hourRows = groupHours(hoursList, DAYS)
  const todayIdx = clock.getDay()
  const lbOpen = lightbox >= 0

  // the clock behind "open now": the prop, or the visitor's, re-read every minute
  React.useEffect(() => {
    if (now) {
      setClock(now)
      return
    }
    setClock(new Date())
    const id = setInterval(() => setClock(new Date()), 60000)
    return () => clearInterval(id)
  }, [now])

  // fonts: a <link> only when asked for; re-measure once they land
  React.useEffect(() => {
    if (!fontHref) return
    const done = () => ScrollTrigger.refresh()
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(done).catch(() => {})
  }, [fontHref])

  // the hang: one, two or three columns from the component's own width
  React.useEffect(() => {
    const el = hangRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const wd = entries[0]?.contentRect.width || el.clientWidth
      setCols(wd < 540 ? 1 : wd < 880 ? 2 : 3)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ---- navigation ----
  const go = (e: React.MouseEvent, href: string) => {
    onNavigate?.(href)
    setMenu(false)
    if (!href.startsWith("#")) return
    e.preventDefault()
    const key = href.slice(1)
    const el = root.current
    if (!el) return
    const target = key === "top" || key === "" ? el : (el.querySelector('[data-vmt-sec="' + key + '"]') as HTMLElement | null)
    if (!target) return
    target.scrollIntoView({ behavior: window.matchMedia(REDUCE).matches ? "auto" : "smooth", block: "start" })
  }

  const goSlide = (i: number) => {
    setSlide(wrap(i, n))
  }

  const pauseAuto = () => {
    hovering.current = true
    apTween.current?.pause()
  }
  const resumeAuto = () => {
    hovering.current = false
    apTween.current?.resume()
  }

  const loadMore = () => {
    pendingReveal.current = shown
    setShown(nextShown(shown, col.pageSize, arts.length))
  }

  const openArt = (i: number) => {
    onArtwork?.(arts[i])
    setLightbox(i)
  }

  // ---- choreography ----
  useIso(() => {
    const el = root.current
    const pg = page.current
    if (!el || !pg) return
    const ctx = gsap.context(() => {
      const header = el.querySelector(".vmt-header") as HTMLElement | null
      ScrollTrigger.create({
        trigger: pg,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (barRef.current) barRef.current.style.transform = "scaleX(" + self.progress.toFixed(4) + ")"
          if (header) {
            const y = self.scroll()
            header.classList.toggle("is-solid", y > 24)
            header.classList.toggle("is-tucked", self.direction === 1 && y > 360)
          }
        },
      })

      const mm = gsap.matchMedia()
      mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, (c) => {
        const { motion } = c.conditions as { motion: boolean }
        if (!motion) return

        // the hero: the photo settles, the frame draws, the title rises out of its clip
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } })
        intro
          .fromTo(".vmt-hero-slide.is-active .vmt-hero-img", { scale: 1.16 }, { scale: 1, duration: 3.6, ease: "power2.out" }, 0)
          .fromTo(".vmt-hero", { "--draw": 0 }, { "--draw": 1, duration: 2.4, ease: "power2.inOut" }, 0.2)
          .from(".vmt-topbar, .vmt-header", { autoAlpha: 0, y: -12, duration: 0.9, stagger: 0.08 }, 0.1)
          .from(".vmt-hero .vmt-rise", { y: 26, autoAlpha: 0, duration: 1, stagger: 0.1 }, 0.55)
          .from(".vmt-hero .vmt-w", { yPercent: 112, duration: 1.2, stagger: 0.05 }, 0.6)
          .from(".vmt-hero-arrow, .vmt-hero-foot", { autoAlpha: 0, duration: 1 }, 1.2)

        gsap
          .timeline({ scrollTrigger: { trigger: ".vmt-hero", start: "top top", end: "bottom top", scrub: 0.6 } })
          .to(".vmt-hero-media", { yPercent: 14, ease: "none" }, 0)
          .to(".vmt-hero-content", { yPercent: -36, autoAlpha: 0, ease: "none" }, 0)
          .to(".vmt-hero-fr, .vmt-hero-foot, .vmt-hero-arrow", { autoAlpha: 0, ease: "none", duration: 0.5 }, 0)

        // welcome: copy rises, the study scrubs on from the left and drifts
        gsap.from(".vmt-welcome .vmt-rise", { y: 30, autoAlpha: 0, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".vmt-welcome", start: "top 72%", once: true } })
        gsap.fromTo(".vmt-sketch", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".vmt-welcome", start: "top 82%", end: "center 50%", scrub: 0.5 } })
        gsap.fromTo(".vmt-welcome-art", { yPercent: 7 }, { yPercent: -7, ease: "none", scrollTrigger: { trigger: ".vmt-welcome", start: "top bottom", end: "bottom top", scrub: true } })

        // section heads and rules
        el.querySelectorAll(".vmt-head").forEach((h) => {
          gsap.from(h.querySelectorAll(".vmt-rise"), { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 86%", once: true } })
        })
        el.querySelectorAll(".vmt-rule").forEach((r) => {
          gsap.from(r, { scaleX: 0, transformOrigin: "0% 50%", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: r, start: "top 90%", once: true } })
        })
        // every other frame draws on as it enters
        el.querySelectorAll(".vmt-frame:not(.vmt-art-frame)").forEach((f) => {
          gsap.fromTo(f, { "--draw": 0 }, { "--draw": 1, duration: 1.8, ease: "power2.inOut", scrollTrigger: { trigger: f, start: "top 85%", once: true } })
        })

        // exhibitions: the banner lifts into view, the rows follow
        gsap.from(".vmt-ex-banner", { clipPath: "inset(100% 0% 0% 0%)", y: 40, duration: 1.5, ease: "power3.out", scrollTrigger: { trigger: ".vmt-ex-banner", start: "top 85%", once: true } })
        gsap.from(".vmt-ex-row", { y: 28, autoAlpha: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".vmt-ex-list", start: "top 85%", once: true } })
        gsap.from(".vmt-intro", { y: 20, autoAlpha: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".vmt-intro", start: "top 88%", once: true } })

        // visitor info: the photo slides past its frame, the panel's rows arrive
        gsap.fromTo(".vmt-visit-frame .vmt-frame-img", { yPercent: -7, scale: 1.16 }, { yPercent: 7, scale: 1.16, ease: "none", scrollTrigger: { trigger: ".vmt-visit", start: "top bottom", end: "bottom top", scrub: true } })
        gsap.from(".vmt-visit-panel .vmt-rise", { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: ".vmt-visit-panel", start: "top 72%", once: true } })

        // the hang, services, footer
        revealArts(Array.from(el.querySelectorAll(".vmt-art")))
        gsap.from(".vmt-svc", { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".vmt-svcs", start: "top 85%", once: true } })
        gsap.from(".vmt-foot .vmt-rise", { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".vmt-foot", start: "top 85%", once: true } })
      })
    }, el)
    ctxRef.current = ctx
    return () => {
      ctxRef.current = null
      ctx.revert()
    }
  }, [])

  // newly hung pieces after "Load more"
  useIso(() => {
    if (pendingReveal.current < 0) return
    const from = pendingReveal.current
    pendingReveal.current = -1
    const el = root.current
    if (!el) return
    const nodes = Array.from(el.querySelectorAll(".vmt-art")).filter((a) => Number((a as HTMLElement).dataset.i) >= from)
    const ctx = ctxRef.current
    if (ctx) ctx.add(() => revealArts(nodes))
    ScrollTrigger.refresh()
  }, [shown])

  React.useEffect(() => {
    ScrollTrigger.refresh()
  }, [cols, openSvc])

  // slide change: crossfade, the incoming photo settles, the title rises again
  useIso(() => {
    const h = heroRef.current
    if (!h) return
    const from = prevSlide.current
    prevSlide.current = slide
    if (from === slide) return
    const slidesEl = h.querySelectorAll(".vmt-hero-slide")
    const inEl = slidesEl[slide]
    const outEl = slidesEl[from]
    if (!inEl || !outEl) return
    const ctx = gsap.context(() => {
      if (window.matchMedia(REDUCE).matches) return
      const tl = gsap.timeline()
      tl.fromTo(outEl, { autoAlpha: 1 }, { autoAlpha: 0, duration: 1.2, ease: "power2.inOut" }, 0)
        .fromTo(inEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.1, ease: "power2.inOut" }, 0)
        .fromTo(inEl.querySelector(".vmt-hero-img"), { scale: 1.12 }, { scale: 1, duration: 6, ease: "power2.out" }, 0)
        .to(outEl.querySelector(".vmt-hero-img"), { scale: 1.06, duration: 1.2, ease: "power2.inOut" }, 0)
        .from(h.querySelectorAll(".vmt-w"), { yPercent: 112, duration: 1.1, stagger: 0.045, ease: "expo.out" }, 0.15)
        .from(h.querySelectorAll(".vmt-hero-content .vmt-rise"), { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" }, 0.25)
    }, h)
    return () => ctx.revert()
  }, [slide])

  // autoplay: a gold hairline fills under the active dot, then the next slide
  React.useEffect(() => {
    const bar = apRef.current
    apTween.current?.kill()
    apTween.current = null
    if (!bar) return
    if (!autoplay || n < 2 || window.matchMedia(REDUCE).matches) {
      gsap.set(bar, { scaleX: 0 })
      return
    }
    const tw = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: autoplay / 1000, ease: "none", transformOrigin: "0% 50%", paused: hovering.current, onComplete: () => setSlide((s) => wrap(s + 1, n)) })
    apTween.current = tw
    return () => {
      tw.kill()
    }
  }, [slide, autoplay, n])

  // hero keyboard: arrows move the carousel while it has focus
  const onHeroKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") goSlide(slide + 1)
    else if (e.key === "ArrowLeft") goSlide(slide - 1)
  }

  // lightbox and drawer: Escape, arrows, scroll lock, focus
  React.useEffect(() => {
    if (!lbOpen && !menu) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightbox(-1)
        setMenu(false)
      }
      if (lbOpen && e.key === "ArrowRight") setLightbox((i) => wrap(i + 1, arts.length))
      if (lbOpen && e.key === "ArrowLeft") setLightbox((i) => wrap(i - 1, arts.length))
    }
    document.addEventListener("keydown", onKey)
    const body = document.body
    const was = body.style.overflow
    body.style.overflow = "hidden"
    if (lbOpen) closeRef.current?.focus()
    return () => {
      document.removeEventListener("keydown", onKey)
      body.style.overflow = was
      prev?.focus?.()
    }
  }, [lbOpen, menu, arts.length])

  // language menu closes on an outside pointer
  React.useEffect(() => {
    if (!langOpen) return
    const onDown = (e: PointerEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLangOpen(false)
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [langOpen])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query.trim())
    setSearch(false)
  }

  const cur = slides[slide]
  const curImg = toImage(cur.image, DEFAULT_SLIDES[0].image as VernissageImage)
  const columns = Array.from({ length: cols }, (_, c) => arts.slice(0, shown).map((a, i) => ({ a, i })).filter((x) => x.i % cols === c))
  const lbArt = lbOpen ? arts[lightbox] : null
  const lbImg = lbArt ? toImage(lbArt.image, { src: "", alt: lbArt.title }) : null
  const link = (l: VernissageLink, cls: string, key: number) => (
    <a key={key} className={cls} href={l.href} onClick={(e) => go(e, l.href)}>
      {l.label}
    </a>
  )
  const more = (l: VernissageLink, extra = "") => (
    <a className={"vmt-more " + extra} href={l.href} onClick={(e) => go(e, l.href)}>
      <span>{l.label}</span>
      <svg width="44" height="12" viewBox="0 0 44 12" aria-hidden="true" focusable="false">
        <path d="M0 6h41M35 1l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </a>
  )

  return (
    <div
      ref={root}
      className={"vmt-root" + (theme === "dark" ? " vmt-dark" : theme === "light" ? " vmt-light" : "") + (className ? " " + className : "")}
      style={
        {
          "--h": height,
          "--c-paper": pal.paper,
          "--c-paper2": pal.paper2,
          "--c-ink": pal.ink,
          "--c-muted": pal.muted,
          "--c-gold": pal.gold,
          "--c-band": pal.band,
          "--c-gold2": pal.goldOnBand,
          "--sans": sans,
          "--serif": serif,
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>
      {fontHref && <link rel="stylesheet" href={fontHref} />}

      <div ref={page} className="vmt-page">
        {/* top bar */}
        <div className="vmt-topbar">
          <p className="vmt-tb-item vmt-tb-open">
            <i className={"vmt-dot" + (doors.open ? " is-open" : "")} aria-hidden="true" />
            <span>{doors.label}</span>
          </p>
          <p className="vmt-tb-item vmt-tb-addr">
            <Icon name="pin" size={13} />
            <span>{m.address}</span>
          </p>
          <div className="vmt-tb-right">
            <button type="button" className="vmt-tb-btn" aria-expanded={search} onClick={() => setSearch((s) => !s)}>
              <Icon name="search" size={14} />
              <span>Search</span>
            </button>
            <div ref={langRef} className="vmt-lang">
              <button type="button" className="vmt-tb-btn" aria-haspopup="listbox" aria-expanded={langOpen} onClick={() => setLangOpen((o) => !o)}>
                <Icon name="globe" size={14} />
                <span>{lang}</span>
                <Icon name="chevron" size={12} className="vmt-lang-chev" />
              </button>
              {langOpen && (
                <ul className="vmt-lang-menu" role="listbox" aria-label="Language">
                  {langs.map((code) => (
                    <li key={code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={code === lang}
                        onClick={() => {
                          setLang(code)
                          setLangOpen(false)
                          onLanguage?.(code)
                        }}
                      >
                        {code}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* header */}
        <header className={"vmt-header" + (menu ? " is-open" : "") + (search ? " is-search" : "")}>
          <button type="button" className="vmt-burger" aria-expanded={menu} aria-label={menu ? "Close menu" : "Open menu"} onClick={() => setMenu((o) => !o)}>
            <Icon name={menu ? "close" : "menu"} size={22} />
          </button>
          <nav className="vmt-nav vmt-nav-l" aria-label="Primary">
            {navL.map((l, i) => link(l, "vmt-nav-a", i))}
          </nav>
          <a className="vmt-brand" href="#top" onClick={(e) => go(e, "#top")} aria-label={m.name + " — home"}>
            {m.name}
          </a>
          <nav className="vmt-nav vmt-nav-r" aria-label="Secondary">
            {navR.map((l, i) => link(l, "vmt-nav-a", i))}
          </nav>
          <button type="button" className="vmt-burger is-search" aria-label="Search" aria-expanded={search} onClick={() => setSearch((s) => !s)}>
            <Icon name="search" size={20} />
          </button>
          {search && (
            <form className="vmt-search" role="search" onSubmit={submitSearch}>
              <Icon name="search" size={18} />
              <input autoFocus type="search" placeholder="Search the collection, exhibitions and events" aria-label="Search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setSearch(false)} />
              <button type="submit" className="vmt-search-go">
                Search
              </button>
              <button type="button" className="vmt-search-x" aria-label="Close search" onClick={() => setSearch(false)}>
                <Icon name="close" size={18} />
              </button>
            </form>
          )}
          <i className="vmt-progress" aria-hidden="true">
            <b ref={(el) => (barRef.current = el)} />
          </i>
        </header>

        {/* hero */}
        <section
          ref={heroRef}
          className="vmt-hero"
          data-vmt-sec="top"
          aria-roledescription="carousel"
          aria-label="Featured exhibitions"
          onPointerEnter={pauseAuto}
          onPointerLeave={resumeAuto}
          onFocus={pauseAuto}
          onBlur={resumeAuto}
          onKeyDown={onHeroKey}
        >
          <div className="vmt-hero-media">
            {slides.map((s, i) => {
              const img = toImage(s.image, DEFAULT_SLIDES[0].image as VernissageImage)
              return (
                <div key={i} className={"vmt-hero-slide" + (i === slide ? " is-active" : "")} aria-hidden={i !== slide}>
                  <img className="vmt-hero-img" src={img.src} alt={img.alt || ""} style={{ objectPosition: focusPos(img) }} loading={i === 0 ? "eager" : "lazy"} decoding="async" />
                </div>
              )
            })}
            <div className="vmt-hero-tint" aria-hidden="true" />
          </div>
          <svg className="vmt-hero-fr" aria-hidden="true" focusable="false">
            <rect width="100%" height="100%" pathLength={1} />
          </svg>

          <div className="vmt-hero-content" aria-live="polite">
            <div className="vmt-hero-copy" key={slide}>
            {cur.kicker && (
              <p className="vmt-hero-kicker vmt-rise">
                <i aria-hidden="true" />
                <span>{cur.kicker}</span>
                <i aria-hidden="true" />
              </p>
            )}
            <h1 className="vmt-hero-title" aria-label={cur.title}>
              {splitWords(cur.title).map((word, i) => (
                <span className="vmt-wm" key={i} aria-hidden="true">
                  <span className="vmt-w">{word}</span>
                </span>
              ))}
            </h1>
            {cur.cta && (
              <a className="vmt-btn vmt-btn-light vmt-rise" href={cur.cta.href} onClick={(e) => go(e, cur.cta!.href)}>
                {cur.cta.label}
              </a>
            )}
            <span className="vmt-sr">{curImg.alt}</span>
            </div>
          </div>

          {n > 1 && (
            <>
              <button type="button" className="vmt-hero-arrow is-prev" aria-label="Previous exhibition" onClick={() => goSlide(slide - 1)}>
                <Icon name="arrow-left" size={20} />
              </button>
              <button type="button" className="vmt-hero-arrow is-next" aria-label="Next exhibition" onClick={() => goSlide(slide + 1)}>
                <Icon name="arrow" size={20} />
              </button>
              <div className="vmt-hero-foot">
                <span className="vmt-hero-count">
                  {String(slide + 1).padStart(2, "0")}
                  <i aria-hidden="true" />
                  {String(n).padStart(2, "0")}
                </span>
                <div className="vmt-hero-dots" role="tablist" aria-label="Exhibitions">
                  {slides.map((s, i) => (
                    <button key={i} type="button" role="tab" aria-selected={i === slide} aria-label={s.title} className={"vmt-hero-dot" + (i === slide ? " is-on" : "")} onClick={() => goSlide(i)}>
                      <i ref={i === slide ? (el) => (apRef.current = el) : undefined} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* welcome */}
        <section className="vmt-welcome" data-vmt-sec="about">
          <div className="vmt-wrap vmt-welcome-grid">
            <div className="vmt-welcome-copy">
              <h2 className="vmt-h2 vmt-rise">{w.title}</h2>
              <p className="vmt-lead vmt-rise">{w.body}</p>
              <div className="vmt-rise">{more(w.link)}</div>
            </div>
            <div className="vmt-welcome-art">
              <Sketch image={wImage} enabled={w.sketch !== false} />
            </div>
          </div>
        </section>

        {/* exhibitions */}
        <section className="vmt-ex vmt-band2" data-vmt-sec="exhibitions">
          <div className="vmt-wrap">
            <div className="vmt-head">
              <h2 className="vmt-h2 vmt-rise">{exTitle}</h2>
              <div className="vmt-rise">{more(exAll)}</div>
            </div>
            <i className="vmt-rule" aria-hidden="true" />
            <div className="vmt-ex-banner">
              {exItems.map((x, i) => (
                <Frame key={i} image={toImage(x.image, DEFAULT_EXHIBITIONS[0].image as VernissageImage)} className={"vmt-ex-slide" + (i === activeEx ? " is-active" : "")} sizes="(min-width: 1200px) 1180px, 100vw" />
              ))}
              <div className="vmt-ex-tag" aria-hidden="true">
                <span className="vmt-label vmt-gold">{String(activeEx + 1).padStart(2, "0")}</span>
                <span>{exItems[activeEx]?.title}</span>
              </div>
            </div>
            <ul className="vmt-ex-list">
              {exItems.map((x, i) => (
                <li key={i} className={"vmt-ex-row" + (i === activeEx ? " is-active" : "")} onPointerEnter={() => setActiveEx(i)} onFocus={() => setActiveEx(i)}>
                  <div className="vmt-ex-name">
                    <h3>{x.title}</h3>
                    <p className="vmt-label">{x.dates}</p>
                  </div>
                  <p className="vmt-ex-blurb">{x.blurb}</p>
                  <a
                    className="vmt-btn vmt-btn-ghost"
                    href={x.href || "#exhibitions"}
                    onClick={(e) => {
                      onExhibition?.(x)
                      go(e, x.href || "#exhibitions")
                    }}
                  >
                    {exMore}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* visitor info */}
        <section className="vmt-visit" data-vmt-sec="visit">
          <div className="vmt-visit-photo">
            <Frame image={vImage} className="vmt-visit-frame" sizes="(min-width: 760px) 55vw, 100vw" />
          </div>
          <div className="vmt-visit-panel">
            <div className="vmt-visit-inner">
              <h2 className="vmt-h2 vmt-rise">{v.title}</h2>
              <p className="vmt-label vmt-gold vmt-sub vmt-rise">{v.pricesTitle}</p>
              <dl className="vmt-rows">
                {v.prices.map((p, i) => (
                  <div key={i} className="vmt-row vmt-rise">
                    <dt>{p.label}</dt>
                    <i aria-hidden="true" />
                    <dd>{p.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="vmt-label vmt-gold vmt-sub vmt-rise">
                {v.hoursTitle}
                <span className={"vmt-open" + (doors.open ? " is-open" : "")}>
                  <i aria-hidden="true" />
                  {doors.open ? "Open now" : "Closed now"}
                </span>
              </p>
              <dl className="vmt-rows">
                {hourRows.map((r, i) => (
                  <div key={i} className={"vmt-row vmt-rise" + (r.indices.includes(todayIdx) ? " is-today" : "")}>
                    <dt>{r.days}</dt>
                    <i aria-hidden="true" />
                    <dd>{r.hours}</dd>
                  </div>
                ))}
              </dl>
              <div className="vmt-rise vmt-visit-more">{more(v.link, "is-light")}</div>
            </div>
          </div>
        </section>

        {/* collection */}
        <section className="vmt-col" data-vmt-sec="collection">
          <div className="vmt-wrap">
            <div className="vmt-head">
              <h2 className="vmt-h2 vmt-rise">{col.title}</h2>
              <div className="vmt-rise">{more(col.viewAll)}</div>
            </div>
            <i className="vmt-rule" aria-hidden="true" />
            <p className="vmt-intro">{col.intro}</p>
            <div ref={hangRef} className="vmt-hang" style={{ "--cols": cols } as React.CSSProperties}>
              {columns.map((list, c) => (
                <div key={c} className="vmt-hang-col">
                  {list.map(({ a, i }) => {
                    const img = toImage(a.image, { src: "", alt: a.title })
                    return (
                      <article key={i} className="vmt-art" data-i={i}>
                        <Frame image={img} ratio={a.ratio || [4, 5]} className="vmt-art-frame" sizes="(min-width: 900px) 33vw, (min-width: 540px) 50vw, 100vw">
                          <button type="button" className="vmt-art-btn" onClick={() => openArt(i)} aria-label={"View " + a.title + " by " + a.artist}>
                            <span className="vmt-art-view vmt-label">View</span>
                          </button>
                        </Frame>
                        <h3 className="vmt-art-title">{a.title}</h3>
                        <p className="vmt-art-meta">
                          {a.artist}
                          {a.year ? ", " + a.year : ""}
                        </p>
                      </article>
                    )
                  })}
                </div>
              ))}
            </div>
            {shown < arts.length && (
              <div className="vmt-col-foot">
                <button type="button" className="vmt-btn vmt-btn-dark" onClick={loadMore}>
                  {col.loadMore}
                </button>
                <span className="vmt-label vmt-muted">
                  {shown} of {arts.length}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* services */}
        <section className="vmt-svc-sec vmt-band2" data-vmt-sec="services">
          <div className="vmt-wrap">
            <div className="vmt-head">
              <h2 className="vmt-h2 vmt-rise">{svTitle}</h2>
            </div>
            <i className="vmt-rule" aria-hidden="true" />
            <div className="vmt-svcs">
              {svItems.map((s, i) => {
                const open = openSvc === i
                const id = uid + "-svc-" + i
                return (
                  <div key={i} className={"vmt-svc" + (open ? " is-open" : "")}>
                    <h3>
                      <button type="button" className="vmt-svc-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpenSvc(open ? -1 : i)}>
                        <span className="vmt-svc-ic">
                          <Icon name={s.icon || "ticket"} size={20} />
                        </span>
                        <span className="vmt-svc-title">{s.title}</span>
                        <Icon name="chevron" size={16} className="vmt-svc-chev" />
                      </button>
                    </h3>
                    <div id={id} className="vmt-svc-panel" role="region" aria-hidden={!open}>
                      <div className="vmt-svc-clip">
                        <div className="vmt-svc-inner">
                          <p>{s.body}</p>
                          {s.link && more(s.link)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="vmt-foot">
          <div className="vmt-wrap vmt-foot-grid">
            <div className="vmt-foot-brand vmt-rise">
              <a className="vmt-brand is-foot" href="#top" onClick={(e) => go(e, "#top")}>
                {m.name}
              </a>
              <p className="vmt-foot-tag">{m.tagline}</p>
              <address>
                {m.address}
                <br />
                {m.phone}
                <br />
                <a href={"mailto:" + m.email}>{m.email}</a>
              </address>
            </div>
            {ft.columns.map((c, i) => (
              <div key={i} className="vmt-foot-col vmt-rise">
                <h4 className="vmt-label vmt-gold">{c.title}</h4>
                <ul>
                  {c.links.map((l, j) => (
                    <li key={j}>{link(l, "vmt-foot-a", j)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="vmt-wrap vmt-foot-bar">
            <div className="vmt-foot-social">
              {ft.social.map((s, i) => (
                <a key={i} href={s.href} aria-label={s.label} title={s.label} onClick={(e) => go(e, s.href)}>
                  <Icon name={socialIcon(s.label)} size={16} />
                </a>
              ))}
            </div>
            <p className="vmt-label vmt-foot-copy">{ft.copyright}</p>
          </div>
        </footer>
      </div>

      {/* mobile drawer (outside the container so position: fixed is the viewport) */}
      <div className={"vmt-drawer" + (menu ? " is-open" : "")} aria-hidden={!menu}>
        <div className="vmt-drawer-top">
          <span className="vmt-brand">{m.name}</span>
          <button type="button" className="vmt-drawer-x" aria-label="Close menu" onClick={() => setMenu(false)} tabIndex={menu ? 0 : -1}>
            <Icon name="close" size={22} />
          </button>
        </div>
        <nav className="vmt-drawer-nav" aria-label="Menu">
          {[...navL, ...navR].map((l, i) => (
            <a key={i} href={l.href} style={{ transitionDelay: (menu ? 0.12 + i * 0.05 : 0) + "s" }} onClick={(e) => go(e, l.href)} tabIndex={menu ? 0 : -1}>
              <span className="vmt-label vmt-gold">{String(i + 1).padStart(2, "0")}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <p className="vmt-drawer-foot">
          <span>{doors.label}</span>
          <span>{m.address}</span>
        </p>
      </div>

      {/* lightbox */}
      {lbArt && lbImg && (
        <div className="vmt-lb" role="dialog" aria-modal="true" aria-label={lbArt.title} onClick={(e) => e.target === e.currentTarget && setLightbox(-1)}>
          <button ref={closeRef} type="button" className="vmt-lb-x" aria-label="Close" onClick={() => setLightbox(-1)}>
            <Icon name="close" size={20} />
          </button>
          {arts.length > 1 && (
            <button type="button" className="vmt-hero-arrow is-prev" aria-label="Previous work" onClick={() => setLightbox(wrap(lightbox - 1, arts.length))}>
              <Icon name="arrow-left" size={20} />
            </button>
          )}
          <figure key={lightbox} className="vmt-lb-fig">
            <div className="vmt-lb-frame">
              <img src={lbImg.src} alt={lbImg.alt || lbArt.title} />
              <svg className="vmt-fr" aria-hidden="true" focusable="false">
                <rect width="100%" height="100%" pathLength={1} />
              </svg>
            </div>
            <figcaption>
              <span className="vmt-label vmt-gold">
                {String(lightbox + 1).padStart(2, "0")} / {String(arts.length).padStart(2, "0")}
              </span>
              <strong>{lbArt.title}</strong>
              <span className="vmt-lb-meta">
                {lbArt.artist}
                {lbArt.year ? ", " + lbArt.year : ""}
              </span>
              {lbArt.href && more({ label: "Read about this work", href: lbArt.href }, "is-light")}
            </figcaption>
          </figure>
          {arts.length > 1 && (
            <button type="button" className="vmt-hero-arrow is-next" aria-label="Next work" onClick={() => setLightbox(wrap(lightbox + 1, arts.length))}>
              <Icon name="arrow" size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---- styles (scoped to .vmt-) ----------------------------------------------------

const CSS = `
.vmt-root{--paper:var(--c-paper);--paper2:var(--c-paper2);--ink:var(--c-ink);--muted:var(--c-muted);--gold:var(--c-gold2);--band:var(--c-band);--on-band:var(--c-paper);--on-band-muted:color-mix(in oklab,var(--c-paper) 62%,var(--c-band));--line:color-mix(in oklab,var(--ink) 15%,transparent);--line-band:color-mix(in oklab,var(--on-band) 16%,transparent);--ease:cubic-bezier(.22,1,.36,1);--hh:74px;--tb:34px;position:relative;width:100%;background:var(--paper);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.vmt-root.vmt-dark,:where(.dark) .vmt-root:not(.vmt-light){--paper:color-mix(in oklab,var(--c-band),#ffffff 5%);--paper2:color-mix(in oklab,var(--c-band),#ffffff 9%);--ink:var(--c-paper);--muted:color-mix(in oklab,var(--c-paper) 64%,var(--c-band));--gold:color-mix(in oklab,var(--c-gold2),#ffffff 24%);--band:color-mix(in oklab,var(--c-band),#000000 45%)}
:where(.vmt-root) *,:where(.vmt-root) *::before,:where(.vmt-root) *::after{box-sizing:border-box}
.vmt-page{container-type:inline-size;position:relative;width:100%}
:where(.vmt-root) a{color:inherit;text-decoration:none}
:where(.vmt-root) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}
:where(.vmt-root) :where(h1,h2,h3,h4,p,dl,dd,ul,figure,address){margin:0;padding:0}
:where(.vmt-root) ul{list-style:none}
:where(.vmt-root) address{font-style:normal}
:where(.vmt-root) img{max-width:none}
:where(.vmt-root) :focus-visible{outline:1.5px solid var(--gold);outline-offset:3px}
.vmt-ic{display:block;flex:none}
.vmt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.vmt-wrap{width:min(1180px,100% - 2 * clamp(20px,5cqi,64px));margin-inline:auto}
.vmt-label{font-family:var(--sans);font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
.vmt-gold{color:var(--gold)}
.vmt-muted{color:var(--muted)}
.vmt-h2{font-family:var(--sans);font-weight:600;font-size:clamp(24px,2.6cqi,34px);line-height:1.18;letter-spacing:-.01em;text-wrap:balance}
.vmt-lead{font-family:var(--serif);font-size:clamp(18px,1.6cqi,21px);line-height:1.6;color:var(--muted);max-width:34em}
.vmt-band2{background:var(--paper2)}

/* buttons and links */
.vmt-more{display:inline-flex;align-items:center;gap:14px;font-family:var(--sans);font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--ink);padding:10px 0;transition:color .3s var(--ease)}
.vmt-more svg{transition:transform .45s var(--ease)}
.vmt-more:hover{color:var(--gold)}
.vmt-more:hover svg{transform:translateX(8px)}
.vmt-more.is-light{color:var(--on-band)}
.vmt-more.is-light:hover{color:var(--gold)}
.vmt-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 26px;border-radius:999px;font-family:var(--sans);font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap;overflow:hidden;isolation:isolate;transition:color .45s var(--ease),border-color .45s var(--ease),transform .45s var(--ease)}
.vmt-btn::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;transform:translateY(101%);transition:transform .55s var(--ease)}
.vmt-btn:hover::before{transform:translateY(0)}
.vmt-btn:active{transform:scale(.97)}
.vmt-btn-light{background:var(--c-paper);color:var(--c-ink)}
.vmt-btn-light::before{background:var(--c-gold2)}
.vmt-btn-light:hover{color:#fff}
.vmt-btn-ghost{border:1px solid var(--line);color:var(--ink);min-height:40px;padding:0 22px}
.vmt-btn-ghost::before{background:var(--ink)}
.vmt-btn-ghost:hover{color:var(--paper);border-color:var(--ink)}
.vmt-btn-dark{background:var(--ink);color:var(--paper);min-height:48px;padding:0 34px}
.vmt-btn-dark::before{background:var(--gold)}
.vmt-btn-dark:hover{color:#fff}

/* gilt frames */
.vmt-frame{position:relative;overflow:hidden;background:color-mix(in oklab,var(--ink) 8%,var(--paper));--draw:1}
.vmt-frame-img{position:absolute;inset:0;display:block;width:100%;height:100%;max-width:none;object-fit:cover;transform-origin:50% 50%;transition:transform 1.2s var(--ease)}
.vmt-fr{position:absolute;inset:10px;width:calc(100% - 20px);height:calc(100% - 20px);overflow:visible;pointer-events:none;z-index:2}
.vmt-fr rect{fill:none;stroke:var(--c-gold2);stroke-width:2;stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw,1));opacity:.85}

.vmt-visit,.vmt-foot{--gold:var(--c-gold2)}

/* top bar */
.vmt-topbar{position:relative;z-index:31;display:flex;align-items:center;gap:24px;height:var(--tb);padding:0 clamp(16px,2.4cqi,32px);background:var(--c-band);color:color-mix(in oklab,var(--c-paper) 74%,var(--c-band));font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}
.vmt-tb-item{display:flex;align-items:center;gap:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.vmt-tb-addr{margin-left:auto}
.vmt-tb-right{display:flex;align-items:center;gap:6px}
.vmt-tb-btn{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 10px;border-radius:999px;letter-spacing:.08em;text-transform:uppercase;transition:color .3s var(--ease),background .3s var(--ease)}
.vmt-tb-btn:hover{color:var(--c-paper);background:color-mix(in oklab,var(--c-paper) 9%,transparent)}
.vmt-dot{width:7px;height:7px;border-radius:50%;border:1.2px solid currentColor;flex:none}
.vmt-dot.is-open{background:var(--c-gold2);border-color:var(--c-gold2);box-shadow:0 0 0 0 color-mix(in oklab,var(--c-gold2) 60%,transparent);animation:vmt-pulse 2.4s var(--ease) infinite}
@keyframes vmt-pulse{0%{box-shadow:0 0 0 0 color-mix(in oklab,var(--c-gold2) 55%,transparent)}70%,100%{box-shadow:0 0 0 7px transparent}}
.vmt-lang{position:relative}
.vmt-lang-chev{transition:transform .3s var(--ease)}
.vmt-tb-btn[aria-expanded="true"] .vmt-lang-chev{transform:rotate(180deg)}
.vmt-lang-menu{position:absolute;right:0;top:calc(100% + 6px);min-width:96px;padding:6px;background:var(--c-band);border:1px solid color-mix(in oklab,var(--c-paper) 14%,transparent);border-radius:12px;box-shadow:0 18px 40px -16px #000;animation:vmt-pop .28s var(--ease)}
.vmt-lang-menu button{display:block;width:100%;text-align:left;padding:8px 12px;border-radius:8px;letter-spacing:.12em}
.vmt-lang-menu button:hover,.vmt-lang-menu button[aria-selected="true"]{background:color-mix(in oklab,var(--c-paper) 9%,transparent);color:var(--c-paper)}
.vmt-lang-menu button[aria-selected="true"]{color:var(--c-gold2)}
@keyframes vmt-pop{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:none}}

/* header */
.vmt-header{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;height:var(--hh);margin-bottom:calc(-1 * var(--hh));padding:0 clamp(16px,2.4cqi,32px);color:var(--c-paper);transition:transform .6s var(--ease),background-color .5s var(--ease),box-shadow .5s var(--ease)}
.vmt-header::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to bottom,color-mix(in oklab,var(--c-band) 55%,transparent),transparent);transition:opacity .5s var(--ease)}
.vmt-header.is-solid{background:color-mix(in oklab,var(--c-band) 92%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 1px 0 color-mix(in oklab,var(--c-paper) 8%,transparent)}
.vmt-header.is-solid::before{opacity:0}
.vmt-header.is-tucked:not(.is-open):not(.is-search){transform:translateY(-100%)}
.vmt-nav{display:flex;align-items:center;gap:clamp(18px,2.4cqi,38px)}
.vmt-nav-r{justify-content:flex-end}
.vmt-nav-a{position:relative;font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;padding:10px 0;opacity:.88;transition:opacity .3s var(--ease)}
.vmt-nav-a::after{content:"";position:absolute;left:0;right:0;bottom:4px;height:1px;background:var(--c-gold2);transform:scaleX(0);transform-origin:100% 50%;transition:transform .45s var(--ease)}
.vmt-nav-a:hover{opacity:1}
.vmt-nav-a:hover::after{transform:scaleX(1);transform-origin:0% 50%}
.vmt-brand{font-family:var(--serif);font-weight:600;font-size:clamp(28px,2.6cqi,36px);letter-spacing:.02em;line-height:1;text-transform:lowercase;color:var(--c-paper);padding:6px 10px;transition:color .3s var(--ease)}
.vmt-brand:hover{color:var(--c-gold2)}
.vmt-brand.is-foot{color:var(--c-gold2);padding:0;font-size:clamp(34px,3.4cqi,44px)}
.vmt-burger{display:none;width:44px;height:44px;align-items:center;justify-content:center;border-radius:50%}
.vmt-burger.is-search{justify-self:end}
.vmt-progress{position:absolute;left:0;right:0;bottom:0;height:1px;overflow:hidden;opacity:0;transition:opacity .4s}
.vmt-header.is-solid .vmt-progress{opacity:1}
.vmt-progress b{display:block;height:100%;background:var(--c-gold2);transform:scaleX(0);transform-origin:0 50%}
.vmt-search{position:absolute;left:0;right:0;top:100%;display:flex;align-items:center;gap:14px;padding:14px clamp(16px,2.4cqi,32px);background:var(--c-band);color:var(--c-paper);border-top:1px solid color-mix(in oklab,var(--c-paper) 10%,transparent);animation:vmt-pop .3s var(--ease)}
.vmt-search input{flex:1;min-width:0;height:44px;background:none;border:0;border-bottom:1px solid color-mix(in oklab,var(--c-paper) 25%,transparent);color:inherit;font-family:var(--serif);font-size:20px;outline:none}
.vmt-search input:focus{border-bottom-color:var(--c-gold2)}
.vmt-search input::placeholder{color:color-mix(in oklab,var(--c-paper) 45%,transparent)}
.vmt-search-go{font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;padding:12px 4px;color:var(--c-gold2)}
.vmt-search-x{width:40px;height:40px;display:grid;place-items:center;border-radius:50%}

/* hero */
.vmt-hero{position:relative;height:calc(var(--h) - var(--tb));min-height:540px;overflow:hidden;background:var(--c-band);color:var(--c-paper);--draw:1;isolation:isolate}
.vmt-hero-media{position:absolute;inset:-6% 0 0 0;will-change:transform}
.vmt-hero-slide{position:absolute;inset:0;opacity:0;visibility:hidden}
.vmt-hero-slide.is-active{opacity:1;visibility:visible}
.vmt-hero-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block}
.vmt-hero-tint{position:absolute;inset:0;background:radial-gradient(ellipse 72% 50% at 50% 52%,color-mix(in oklab,var(--c-band) 52%,transparent),transparent 74%),linear-gradient(to bottom,color-mix(in oklab,var(--c-band) 50%,transparent) 0%,transparent 26%,transparent 62%,color-mix(in oklab,var(--c-band) 72%,transparent) 100%)}
.vmt-hero-fr{position:absolute;inset:calc(var(--hh) + 14px) clamp(14px,2cqi,28px) clamp(14px,2cqi,28px);width:calc(100% - 2 * clamp(14px,2cqi,28px));height:calc(100% - var(--hh) - 14px - clamp(14px,2cqi,28px));pointer-events:none;z-index:2;overflow:visible}
.vmt-hero-fr rect{fill:none;stroke:color-mix(in oklab,var(--c-gold2) 80%,#fff);stroke-width:2;stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw,1));opacity:.75}
.vmt-hero-content{position:absolute;inset:0;z-index:3;display:grid;place-items:center;text-align:center;padding:calc(var(--hh) + 20px) clamp(24px,8cqi,140px) 90px}
.vmt-hero-copy{display:flex;flex-direction:column;align-items:center;gap:clamp(18px,2cqi,28px);max-width:980px}
.vmt-hero-kicker{display:flex;align-items:center;gap:14px;font-family:var(--serif);font-style:italic;font-size:clamp(16px,1.5cqi,20px);letter-spacing:.02em;color:color-mix(in oklab,var(--c-paper) 90%,var(--c-gold2))}
.vmt-hero-kicker i{display:block;width:34px;height:1px;background:var(--c-gold2)}
.vmt-hero-title{font-family:var(--sans);font-weight:600;font-size:clamp(34px,5.2cqi,76px);line-height:1.08;letter-spacing:-.015em;text-wrap:balance;text-shadow:0 2px 30px color-mix(in oklab,var(--c-band) 45%,transparent)}
.vmt-wm{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .12em .08em;margin:0 -.06em}
.vmt-w{display:inline-block;will-change:transform}
.vmt-hero-arrow{position:absolute;top:50%;z-index:4;width:52px;height:52px;margin-top:-26px;display:grid;place-items:center;border-radius:50%;color:var(--c-paper);border:1px solid color-mix(in oklab,var(--c-paper) 34%,transparent);background:color-mix(in oklab,var(--c-band) 18%,transparent);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:background .4s var(--ease),border-color .4s var(--ease),transform .4s var(--ease)}
.vmt-hero-arrow:hover{background:var(--c-gold2);border-color:var(--c-gold2)}
.vmt-hero-arrow.is-prev{left:clamp(26px,3.6cqi,56px)}
.vmt-hero-arrow.is-next{right:clamp(26px,3.6cqi,56px)}
.vmt-hero-arrow.is-prev:hover{transform:translateX(-3px)}
.vmt-hero-arrow.is-next:hover{transform:translateX(3px)}
.vmt-hero-foot{position:absolute;left:0;right:0;bottom:clamp(30px,4cqi,50px);z-index:4;pointer-events:none;display:flex;align-items:center;justify-content:center;gap:22px}
.vmt-hero-count{display:flex;align-items:center;gap:10px;font-size:10.5px;font-weight:600;letter-spacing:.16em;font-variant-numeric:tabular-nums}
.vmt-hero-count i{display:block;width:18px;height:1px;background:currentColor;opacity:.5}
.vmt-hero-dots{display:flex;gap:4px;pointer-events:auto}
.vmt-hero-dot{width:48px;height:32px;display:flex;align-items:center;position:relative}
.vmt-hero-dot::before{content:"";position:absolute;left:4px;right:4px;top:50%;height:1px;background:color-mix(in oklab,var(--c-paper) 38%,transparent);transition:background .3s}
.vmt-hero-dot:hover::before{background:var(--c-paper)}
.vmt-hero-dot i{position:absolute;left:4px;right:4px;top:calc(50% - .5px);height:2px;background:var(--c-gold2);transform:scaleX(0);transform-origin:0 50%}
.vmt-hero-dot.is-on i{transform:scaleX(1)}
.vmt-hero-dot:not(.is-on) i{transform:scaleX(0) !important}

/* welcome */
.vmt-welcome{position:relative;padding:clamp(72px,9cqi,140px) 0;overflow:hidden}
.vmt-welcome-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:center;gap:clamp(28px,5cqi,80px)}
.vmt-welcome-copy{display:flex;flex-direction:column;gap:24px;position:relative;z-index:1}
.vmt-welcome-copy .vmt-h2{font-size:clamp(28px,3.1cqi,42px);max-width:13em}
.vmt-welcome-art{position:relative}
.vmt-sketch{position:relative;width:118%;margin-left:-4%;aspect-ratio:5 / 4;color:var(--ink)}
.vmt-sketch-cv{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;color:inherit;opacity:0;transition:opacity 1.2s var(--ease)}
.vmt-sketch.is-drawn .vmt-sketch-cv{opacity:.92}
.vmt-sketch-flat{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;filter:grayscale(1) contrast(1.15) brightness(1.08);mix-blend-mode:multiply;opacity:.5;-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 45%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 45%,transparent 100%)}
.vmt-dark .vmt-sketch-flat,:where(.dark) .vmt-root:not(.vmt-light) .vmt-sketch-flat{mix-blend-mode:screen;filter:grayscale(1) invert(1) contrast(1.1)}

/* section heads */
.vmt-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap}
.vmt-rule{display:block;height:1.5px;background:var(--ink);margin:18px 0 clamp(26px,3cqi,40px);opacity:.82}

/* exhibitions */
.vmt-ex{padding:clamp(72px,9cqi,130px) 0}
.vmt-ex-banner{position:relative;aspect-ratio:21 / 8;min-height:220px;margin-bottom:clamp(20px,2.4cqi,34px)}
.vmt-ex-slide{position:absolute !important;inset:0;opacity:0;transition:opacity .9s var(--ease)}
.vmt-ex-slide .vmt-frame-img{transform:scale(1.06);transition:transform 2.2s var(--ease)}
.vmt-ex-slide.is-active{opacity:1;z-index:1}
.vmt-ex-slide.is-active .vmt-frame-img{transform:scale(1)}
.vmt-ex-tag{position:absolute;left:24px;bottom:24px;z-index:3;display:flex;align-items:center;gap:12px;padding:10px 16px;background:color-mix(in oklab,var(--c-band) 80%,transparent);color:var(--c-paper);font-family:var(--serif);font-style:italic;font-size:16px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.vmt-ex-list{display:flex;flex-direction:column}
.vmt-ex-row{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr) auto;align-items:center;gap:clamp(18px,3cqi,48px);padding:clamp(20px,2.2cqi,28px) 0 clamp(20px,2.2cqi,28px) 0;border-bottom:1px solid var(--line);transition:padding .5s var(--ease)}
.vmt-ex-row::before{content:"";position:absolute;left:0;top:50%;width:14px;height:1.5px;background:var(--gold);transform:scaleX(0);transform-origin:0 50%;transition:transform .5s var(--ease)}
.vmt-ex-row.is-active{padding-left:28px}
.vmt-ex-row.is-active::before{transform:scaleX(1)}
.vmt-ex-name h3{font-family:var(--sans);font-weight:600;font-size:clamp(15px,1.3cqi,17px);line-height:1.35;margin-bottom:8px}
.vmt-ex-name .vmt-label{color:var(--muted);font-weight:500;letter-spacing:.1em}
.vmt-ex-row.is-active .vmt-ex-name .vmt-label{color:var(--gold)}
.vmt-ex-blurb{font-family:var(--serif);font-size:17px;line-height:1.55;color:var(--muted)}

/* visitor info */
.vmt-visit{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,1fr);background:var(--band);color:var(--on-band)}
.vmt-visit-photo{position:relative;min-height:clamp(420px,46cqi,640px)}
.vmt-visit-frame{position:absolute !important;inset:0}
.vmt-visit-panel{display:flex;align-items:center;padding:clamp(48px,6cqi,96px) clamp(24px,6cqi,96px)}
.vmt-visit-inner{width:100%;max-width:440px}
.vmt-visit-inner .vmt-h2{margin-bottom:clamp(22px,2.6cqi,34px)}
.vmt-sub{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:28px 0 10px}
.vmt-sub:first-of-type{margin-top:0}
.vmt-open{display:inline-flex;align-items:center;gap:7px;color:var(--on-band-muted);letter-spacing:.12em}
.vmt-open i{width:6px;height:6px;border-radius:50%;border:1px solid currentColor}
.vmt-open.is-open{color:var(--on-band)}
.vmt-open.is-open i{background:var(--c-gold2);border-color:var(--c-gold2);animation:vmt-pulse 2.4s var(--ease) infinite}
.vmt-rows{display:flex;flex-direction:column;border-top:1px solid var(--line-band)}
.vmt-row{display:flex;align-items:baseline;gap:12px;padding:11px 0;border-bottom:1px solid var(--line-band);font-family:var(--serif);font-size:18px;color:var(--on-band-muted);transition:color .3s var(--ease)}
.vmt-row dt{white-space:nowrap}
.vmt-row i{flex:1;min-width:16px;border-bottom:1px dotted color-mix(in oklab,var(--on-band) 24%,transparent);transform:translateY(-4px)}
.vmt-row dd{white-space:nowrap;font-variant-numeric:tabular-nums}
.vmt-row:hover{color:var(--on-band)}
.vmt-row.is-today{color:var(--on-band)}
.vmt-row.is-today dt::after{content:"today";margin-left:10px;font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--c-gold2);vertical-align:2px}
.vmt-visit-more{margin-top:26px}

/* collection */
.vmt-col{padding:clamp(72px,9cqi,130px) 0}
.vmt-intro{font-family:var(--serif);font-size:18px;line-height:1.55;color:var(--muted);max-width:36em;margin:-8px 0 clamp(30px,4cqi,56px)}
.vmt-hang{display:grid;grid-template-columns:repeat(var(--cols,3),minmax(0,1fr));gap:clamp(20px,3cqi,44px);align-items:start}
.vmt-hang-col{display:flex;flex-direction:column;gap:clamp(34px,4cqi,56px)}
.vmt-hang-col:nth-child(2){padding-top:clamp(0px,6cqi,90px)}
.vmt-art{position:relative}
.vmt-art-frame{width:100%;box-shadow:0 1px 0 var(--line),0 24px 44px -32px color-mix(in oklab,var(--c-band) 70%,transparent);transition:box-shadow .6s var(--ease)}
.vmt-art-btn{position:absolute;inset:0;z-index:3;display:flex;align-items:flex-end;justify-content:flex-end;padding:20px;cursor:zoom-in}
.vmt-art-view{display:inline-flex;align-items:center;height:30px;padding:0 14px;border-radius:999px;background:var(--c-paper);color:var(--c-ink);opacity:0;transform:translateY(8px);transition:opacity .4s var(--ease),transform .5s var(--ease)}
.vmt-art:hover .vmt-art-view,.vmt-art-btn:focus-visible .vmt-art-view{opacity:1;transform:none}
.vmt-art:hover .vmt-frame-img{transform:scale(1.045)}
.vmt-art:hover .vmt-art-frame{box-shadow:0 1px 0 var(--line),0 34px 60px -30px color-mix(in oklab,var(--c-band) 80%,transparent)}
.vmt-art-btn:focus-visible{outline-offset:-6px}
.vmt-art-title{font-family:var(--sans);font-weight:600;font-size:15px;line-height:1.35;margin-top:18px}
.vmt-art-meta{font-family:var(--serif);font-style:italic;font-size:16px;color:var(--muted);margin-top:4px}
.vmt-col-foot{display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:clamp(48px,6cqi,80px)}

/* services */
.vmt-svc-sec{padding:clamp(72px,8cqi,120px) 0}
.vmt-svcs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:clamp(24px,5cqi,72px);align-items:start}
.vmt-svc{border-bottom:1px solid var(--line)}
.vmt-svc-btn{display:flex;align-items:center;gap:16px;width:100%;min-height:68px;text-align:left}
.vmt-svc-ic{display:grid;place-items:center;width:40px;height:40px;color:var(--gold);transition:transform .5s var(--ease)}
.vmt-svc-btn:hover .vmt-svc-ic{transform:rotate(-8deg) scale(1.08)}
.vmt-svc-title{flex:1;font-size:13px;font-weight:600;letter-spacing:.02em}
.vmt-svc-chev{color:var(--muted);transition:transform .5s var(--ease),color .3s}
.vmt-svc.is-open .vmt-svc-chev{transform:rotate(180deg);color:var(--gold)}
.vmt-svc-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .6s var(--ease)}
.vmt-svc.is-open .vmt-svc-panel{grid-template-rows:1fr}
.vmt-svc-clip{overflow:hidden;min-height:0}
.vmt-svc-inner{padding:0 0 24px 56px;opacity:0;transform:translateY(-6px);visibility:hidden;transition:opacity .4s var(--ease),transform .5s var(--ease),visibility 0s .5s}
.vmt-svc.is-open .vmt-svc-inner{opacity:1;transform:none;visibility:visible;transition:opacity .5s var(--ease) .1s,transform .6s var(--ease) .1s,visibility 0s}
.vmt-svc-inner p{font-family:var(--serif);font-size:17px;line-height:1.55;color:var(--muted);margin-bottom:6px}

/* footer */
.vmt-foot{background:var(--band);color:var(--on-band);padding:clamp(64px,7cqi,104px) 0 0}
.vmt-foot-grid{display:grid;grid-template-columns:minmax(0,1.6fr) repeat(3,minmax(0,.7fr));gap:clamp(28px,4cqi,56px);padding-bottom:clamp(48px,6cqi,84px)}
.vmt-foot-tag{font-family:var(--serif);font-style:italic;font-size:18px;margin:14px 0 18px;color:var(--on-band)}
.vmt-foot-brand address{font-family:var(--serif);font-size:17px;line-height:1.65;color:var(--on-band-muted)}
.vmt-foot-brand address a{border-bottom:1px solid var(--line-band);transition:color .3s,border-color .3s}
.vmt-foot-brand address a:hover{color:var(--c-gold2);border-color:var(--c-gold2)}
.vmt-foot-col h4{margin-bottom:18px}
.vmt-foot-col ul{display:flex;flex-direction:column;gap:2px}
.vmt-foot-a{display:inline-block;padding:6px 0;font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--on-band-muted);transition:color .3s var(--ease),transform .4s var(--ease)}
.vmt-foot-a:hover{color:var(--on-band);transform:translateX(4px)}
.vmt-foot-bar{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;padding:22px 0 28px;border-top:1px solid var(--line-band)}
.vmt-foot-social{display:flex;gap:8px}
.vmt-foot-social a{width:38px;height:38px;display:grid;place-items:center;border-radius:50%;border:1px solid var(--line-band);color:var(--on-band-muted);transition:color .3s,border-color .3s,background .3s}
.vmt-foot-social a:hover{color:var(--c-band);background:var(--c-gold2);border-color:var(--c-gold2)}
.vmt-foot-copy{color:var(--on-band-muted);font-weight:500;letter-spacing:.12em}

/* mobile drawer */
.vmt-drawer{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;padding:16px 24px 28px;background:var(--c-band);color:var(--c-paper);clip-path:inset(0 0 100% 0);visibility:hidden;transition:clip-path .7s var(--ease),visibility 0s .7s}
.vmt-drawer.is-open{clip-path:inset(0 0 0 0);visibility:visible;transition:clip-path .7s var(--ease),visibility 0s}
.vmt-drawer-top{display:flex;align-items:center;justify-content:space-between;height:52px}
.vmt-drawer-x{width:44px;height:44px;display:grid;place-items:center;border-radius:50%}
.vmt-drawer-nav{display:flex;flex-direction:column;margin-top:5vh}
.vmt-drawer-nav a{display:flex;align-items:baseline;gap:16px;padding:12px 0;border-bottom:1px solid color-mix(in oklab,var(--c-paper) 10%,transparent);font-family:var(--serif);font-size:clamp(28px,8vw,42px);line-height:1.1;opacity:0;transform:translateY(18px);transition:opacity .5s var(--ease),transform .6s var(--ease),color .3s}
.vmt-drawer.is-open .vmt-drawer-nav a{opacity:1;transform:none}
.vmt-drawer-nav a:hover{color:var(--c-gold2)}
.vmt-drawer-foot{margin-top:auto;display:flex;flex-direction:column;gap:6px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:color-mix(in oklab,var(--c-paper) 60%,transparent)}

/* lightbox */
.vmt-lb{position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:clamp(20px,5vw,72px) clamp(16px,9vw,140px);background:color-mix(in oklab,var(--c-band) 94%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:vmt-fade .4s var(--ease)}
.vmt-lb-fig{display:flex;flex-direction:column;align-items:center;gap:22px;max-width:100%;max-height:100%;animation:vmt-lift .7s var(--ease)}
.vmt-lb-frame{position:relative;padding:14px;background:color-mix(in oklab,var(--c-paper) 6%,transparent)}
.vmt-lb-frame img{display:block;max-width:min(78vw,1000px);max-height:calc(100svh - 230px);width:auto;height:auto;object-fit:contain}
.vmt-lb-frame .vmt-fr{inset:5px;width:calc(100% - 10px);height:calc(100% - 10px)}
.vmt-lb figcaption{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;color:var(--c-paper)}
.vmt-lb figcaption strong{font-size:16px;font-weight:600}
.vmt-lb-meta{font-family:var(--serif);font-style:italic;font-size:17px;color:color-mix(in oklab,var(--c-paper) 65%,transparent)}
.vmt-lb-x{position:absolute;top:18px;right:18px;width:46px;height:46px;display:grid;place-items:center;border-radius:50%;color:var(--c-paper);border:1px solid color-mix(in oklab,var(--c-paper) 25%,transparent);transition:background .3s,transform .4s var(--ease)}
.vmt-lb-x:hover{background:var(--c-gold2);transform:rotate(90deg)}
.vmt-lb .vmt-hero-arrow{position:fixed}
@keyframes vmt-fade{from{opacity:0}to{opacity:1}}
@keyframes vmt-lift{from{opacity:0;transform:translateY(24px) scale(.98)}to{opacity:1;transform:none}}

/* the component's own width, not the window's */
@container (max-width: 1080px){
  .vmt-tb-addr{display:none}
  .vmt-tb-right{margin-left:auto}
}
@container (max-width: 920px){
  .vmt-nav{display:none}
  .vmt-burger{display:inline-flex}
  .vmt-header{grid-template-columns:44px 1fr 44px}
  .vmt-brand{justify-self:center}
  .vmt-ex-row{grid-template-columns:minmax(0,1fr) auto;row-gap:10px}
  .vmt-ex-blurb{grid-column:1 / -1;grid-row:2}
  .vmt-ex-row .vmt-btn{grid-row:1;grid-column:2}
  .vmt-visit{grid-template-columns:1fr}
  .vmt-visit-photo{min-height:clamp(300px,62cqi,480px)}
  .vmt-foot-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .vmt-foot-brand{grid-column:1 / -1}
}
@container (max-width: 760px){
  .vmt-welcome-grid{grid-template-columns:1fr}
  .vmt-welcome-art{order:-1;margin:0 -8%}
  .vmt-sketch{width:100%;margin-left:0}
  .vmt-hero-tint{background:linear-gradient(to bottom,color-mix(in oklab,var(--c-band) 55%,transparent),color-mix(in oklab,var(--c-band) 42%,transparent) 40%,color-mix(in oklab,var(--c-band) 78%,transparent))}
  .vmt-svcs{grid-template-columns:1fr}
  .vmt-hero-arrow.is-prev,.vmt-hero-arrow.is-next{top:auto;bottom:clamp(22px,4cqi,42px);margin-top:0;width:44px;height:44px}
  .vmt-hero-foot{bottom:clamp(30px,5cqi,52px)}
  .vmt-hero-count{display:none}
  .vmt-ex-banner{aspect-ratio:4 / 3}
  .vmt-ex-tag{left:14px;right:14px;bottom:14px;font-size:15px}
  .vmt-hang-col:nth-child(2){padding-top:48px}
}
@container (max-width: 560px){
  .vmt-tb-open{font-size:9.5px}
  .vmt-tb-btn span{display:none}
  .vmt-hero{min-height:560px}
  .vmt-hero-kicker i{width:18px}
  .vmt-hero-dot{width:34px}
  .vmt-ex-row.is-active{padding-left:20px}
  .vmt-ex-row{grid-template-columns:1fr}
  .vmt-ex-row .vmt-btn{grid-row:auto;grid-column:auto;justify-self:start}
  .vmt-ex-blurb{grid-row:auto}
  .vmt-foot-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .vmt-hang-col:nth-child(2){padding-top:0}
  .vmt-search input{font-size:17px}
  .vmt-lb .vmt-hero-arrow{bottom:18px;top:auto;margin-top:0}
}

@media (prefers-reduced-motion: reduce){
  .vmt-root *,.vmt-root *::before,.vmt-root *::after{transition-duration:.01ms !important;animation:none !important}
  .vmt-ex-slide .vmt-frame-img,.vmt-art:hover .vmt-frame-img{transform:none}
}
`
