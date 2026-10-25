"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Vernissage Museum Template — the home page of an art and history museum.
 *
 * Warm paper, a gilt accent, a grand lit gallery in the hero and real
 * paintings everywhere else: the page a museum would actually ship, with
 * exhibitions, live opening hours, admission, the collection and services.
 *
 * - Hero: a carousel of featured exhibitions. It opens like a pair of gallery
 *   doors; each next room is drawn across like a curtain while the old one
 *   slides away beneath it; titles rise word by word. Thin edge arrows, dots
 *   with an autoplay hairline that pauses under the pointer, ←/→ keys.
 * - Welcome: a baroque pen-and-wash drawing printed onto the paper, laid
 *   down by an ink-wipe mask as you scroll. Pass `sketch` to re-draw any
 *   photograph as a graphite study at runtime instead.
 * - Exhibitions: hover or focus a row and the next painting wipes up into
 *   the banner, which drifts with scroll.
 * - Visitor info: a split band; the wall slides open, prices and grouped
 *   hours sit in a two-column table, with a live "open now" state.
 * - Collection: a three-column hang that rises piece by piece, "Load more",
 *   a "View" cursor, and a lightbox the painting morphs into from the wall.
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
  /** The drawing beside the welcome copy. A drawing or engraving on paper reads best (it is printed with multiply). */
  image?: string | VernissageImage
  /** Treat `image` as a photograph and re-draw it at runtime as a graphite study. */
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
  gilt: { paper: "#f8f5ee", paper2: "#efebe2", ink: "#1c1a16", muted: "#736d62", gold: "#a8833a", band: "#141311", goldOnBand: "#cfa64e" },
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
    kicker: "February 10, 2026 — April 28, 2026",
    title: "Masterpieces of the Department of Prints and Drawings",
    cta: { label: "Learn more", href: "#exhibitions" },
    image: { src: U("1775416343921-6dfe2cf21424", 2400), focus: [0.5, 0.42], alt: "An ornate gallery with a painted ceiling, a chandelier and a red carpet between gilt-framed paintings" },
  },
  {
    kicker: "May 6, 2026 — August 30, 2026",
    title: "The Salon Hang: Four Hundred Paintings, One Room",
    cta: { label: "Learn more", href: "#exhibitions" },
    image: { src: U("1735605918310-73ad27a5dd6b", 2400), focus: [0.5, 0.5], alt: "A skylit gallery hung floor to ceiling with gilt-framed paintings" },
  },
  {
    kicker: "Opening September 12, 2026",
    title: "Raphael's Cartoons and the Art of the Tapestry",
    cta: { label: "Learn more", href: "#exhibitions" },
    image: { src: U("1747918157024-a1e1c77336fa", 2400), focus: [0.5, 0.45], alt: "A dark vaulted hall with great paintings lit above curved benches" },
  },
]

const DEFAULT_WELCOME: { title: string; body: string; link: VernissageLink; image: VernissageImage; sketch: boolean } = {
  title: "Welcome to the Art and History Museum Aurelian",
  body:
    "Not only the outstanding quality of the collection, but also our level of activity in research, exhibitions and education gives the Aurelian its place among the museums of the world. A hundred and twelve years in, the doors are still free on Thursday evenings.",
  link: { label: "More about", href: "#about" },
  image: { src: U("1787060142023-8989f3ca77f2", 1600), focus: [0.5, 0.45], alt: "A pen and wash drawing of Saint Bruno kneeling in ecstasy beneath cherubs" },
  sketch: false,
}

const DEFAULT_EXHIBITIONS: VernissageExhibition[] = [
  {
    title: "Unique Exhibition: Willem van Haecht",
    dates: "February 10, 2026 — April 28, 2026",
    blurb: "A painted gallery inside a gallery. Van Haecht's crowded cabinet of 1630, shown beside the twenty-three pictures it copies, borrowed back from eleven collections.",
    image: { src: U("1745237826674-1fb299b72913", 2000), focus: [0.5, 0.55], alt: "Apelles Painting Campaspe by Willem van Haecht: a gallery crowded with paintings, sculpture and visitors" },
    href: "#exhibitions",
  },
  {
    title: "Records & Rebels: The Phantom Horseman",
    dates: "March 3, 2026 — June 14, 2026",
    blurb: "John Gilbert painted the same charge for twenty years. The battle canvases, the sketchbooks and the press cuttings that made him famous, in one long room.",
    image: { src: U("1580136579312-94651dfd596d", 2000), focus: [0.5, 0.5], alt: "The Phantom Horseman by Sir John Gilbert: a storm of armoured riders" },
    href: "#exhibitions",
  },
  {
    title: "The Dutch Table: Still Lifes 1620–1680",
    dates: "April 18, 2026 — September 6, 2026",
    blurb: "Lobster, lemons, a parrot and a silver ewer: forty banquet pieces on what the Golden Age ate, bought and wanted the neighbours to see.",
    image: { src: U("1588260275894-4f51cc4c12b1", 2000), focus: [0.5, 0.5], alt: "Banquet Still Life by Adriaen van Utrecht: a table heaped with fruit, lobster and silver" },
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
  link: { label: "More info", href: "#visit" },
  image: { src: U("1554907984-15263bfd63bd", 1800), focus: [0.4, 0.5], alt: "A red damask gallery wall hung with gilt-framed paintings above white panelling" },
}

const DEFAULT_COLLECTION: VernissageArtwork[] = [
  { title: "Flower Still Life with a Timepiece", artist: "Willem van Aelst", year: "1663", ratio: [420, 544], image: { src: U("1579783901586-d88db74b4fe4", 1200), alt: "Flowers, butterflies and a pocket watch on a marble ledge" } },
  { title: "Cypresses", artist: "Vincent van Gogh", year: "1889", ratio: [420, 537], image: { src: U("1782849494146-596db4cc305d", 1200), alt: "A flame-shaped cypress under a crescent moon" } },
  { title: "Artemisia", artist: "Guido Reni", year: "1638 – 1639", ratio: [420, 516], image: { src: U("1576503918400-0b982e6a98bf", 1200), alt: "A woman in a white headdress holding a blue bowl" } },
  { title: "Fischerhaus bei Lübbenau", artist: "Bertha Violet de Chevalier", year: "1882", ratio: [420, 271], image: { src: U("1745761500009-0c62402a06b0", 1200), alt: "A thatched fisherman's house beside a canal at dusk" } },
  { title: "Olive Trees", artist: "Vincent van Gogh", year: "1889", ratio: [420, 332], image: { src: U("1782849324101-3ae636a0e270", 1200), alt: "Olive trees under a cloudy sky" } },
  { title: "Tronie of an Old Man", artist: "Rembrandt van Rijn", year: "c. 1630", ratio: [400, 489], image: { src: U("1579009120139-f41119c5e2ba", 1200), alt: "An old man in a fur coat and black cap" } },
  { title: "Vase of Flowers", artist: "Jan Davidsz. de Heem", year: "1670", ratio: [400, 569], image: { src: U("1579783900882-c0d3dad7b119", 1200), alt: "A dense bouquet in a glass vase on a stone ledge" } },
  { title: "Portrait of Madame Simon", artist: "Eugène Delacroix", year: "1850", ratio: [400, 572], image: { src: U("1694727329633-7760a2bd8d0f", 1200), alt: "A woman in a white dress seated by a fireplace" } },
  { title: "Landscape from Romsdalen", artist: "Johan Fredrik Eckersberg", year: "1858", ratio: [400, 294], image: { src: U("1700405495181-69f35790a8aa", 1200), alt: "A Norwegian valley beneath a sharp peak and cloud" } },
  { title: "Portrait of a Young Woman", artist: "Netherlandish", year: "1480 – 1499", ratio: [400, 602], image: { src: U("1752317591841-bbca8ed3eb0b", 1200), alt: "A young woman in profile in a red dress and white headdress" } },
  { title: "Saint Sebastian", artist: "attr. Lorenzo Lippi", year: "c. 1630", ratio: [400, 512], image: { src: U("1743341491576-15ee095a83ac", 1200), alt: "A young man with arrows looking upward" } },
  { title: "Sapho", artist: "Jean-Baptiste Regnault", ratio: [400, 322], image: { src: U("1655455561178-0d3c092d0edb", 1200), alt: "A reclining figure asleep beside a lyre" } },
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
const reduced = () => typeof window !== "undefined" && window.matchMedia(REDUCE).matches

/** A heading whose words rise out of a mask as it enters. */
function Split({ text, className = "", as = "h2" }: { text: string; className?: string; as?: "h2" | "h3" | "p" }) {
  const Tag = as
  return (
    <Tag className={"vmt-split " + className} aria-label={text}>
      {splitWords(text).map((w, i) => (
        <React.Fragment key={i}>
          <span className="vmt-sm" aria-hidden="true">
            <span className="vmt-sw">{w}</span>
          </span>{" "}
        </React.Fragment>
      ))}
    </Tag>
  )
}

/** Pieces of the hang rise into place: the mat opens upward, the painting settles inside it. */
function revealArts(nodes: Element[]) {
  if (reduced()) return
  nodes.forEach((n, i) => {
    const media = n.querySelector(".vmt-art-media")
    const img = n.querySelector(".vmt-art-img")
    const cap = n.querySelectorAll(".vmt-art-cap > *")
    const st = { trigger: n, start: "top 92%", once: true }
    const d = (i % 3) * 0.08
    if (media) gsap.fromTo(media, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.25, delay: d, ease: "expo.inOut", scrollTrigger: st })
    if (img) gsap.fromTo(img, { scale: 1.35, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 1.8, delay: d, ease: "expo.out", clearProps: "transform", scrollTrigger: st })
    if (cap.length) gsap.from(cap, { y: 14, autoAlpha: 0, duration: 0.8, delay: d + 0.45, stagger: 0.06, ease: "power3.out", scrollTrigger: st })
  })
}

function socialIcon(label: string) {
  const l = label.toLowerCase()
  if (l.includes("insta")) return "instagram"
  if (l.includes("face")) return "facebook"
  return "x"
}

/** The lightbox box for a work: as large as fits, keeping its ratio. */
function lightboxBox(ratio: [number, number]) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxW = Math.min(vw * (vw < 640 ? 0.9 : 0.72), 1040)
  const maxH = Math.max(160, vh - (vw < 640 ? 250 : 220))
  const s = Math.min(maxW / ratio[0], maxH / ratio[1])
  return { width: Math.round(ratio[0] * s), height: Math.round(ratio[1] * s) }
}

const ARROW_L = (
  <svg width="54" height="14" viewBox="0 0 54 14" aria-hidden="true" focusable="false">
    <path className="vmt-arr-shaft" d="M2 7h50" />
    <path d="M8 1L2 7l6 6" />
  </svg>
)
const ARROW_R = (
  <svg width="54" height="14" viewBox="0 0 54 14" aria-hidden="true" focusable="false">
    <path className="vmt-arr-shaft" d="M2 7h50" />
    <path d="M46 1l6 6-6 6" />
  </svg>
)

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
    intro: "Our collection holds more than 100,000 works of art and design, dating from ancient times to today.",
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
  const slideTl = React.useRef(null as gsap.core.Timeline | null)
  const hovering = React.useRef(false)
  const ctxRef = React.useRef(null as gsap.Context | null)
  const prevSlide = React.useRef(0)
  const dirRef = React.useRef(1)
  const pendingReveal = React.useRef(-1)
  const closeRef = React.useRef(null as HTMLButtonElement | null)
  const hangRef = React.useRef(null as HTMLDivElement | null)
  const langRef = React.useRef(null as HTMLDivElement | null)
  const cursorRef = React.useRef(null as HTMLDivElement | null)
  const lbRef = React.useRef(null as HTMLDivElement | null)
  const fromRect = React.useRef(null as DOMRect | null)
  const closing = React.useRef(false)

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
  const [box, setBox] = React.useState({ width: 0, height: 0 })

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
      setCols(wd < 520 ? 1 : wd < 760 ? 2 : 3)
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
    target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" })
  }

  const goSlide = (i: number, dir?: number) => {
    const next = wrap(i, n)
    if (next === slide) return
    dirRef.current = dir ?? (i > slide ? 1 : -1)
    setSlide(next)
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

  const openArt = (i: number, from: Element | null) => {
    onArtwork?.(arts[i])
    fromRect.current = from ? from.getBoundingClientRect() : null
    closing.current = false
    setBox(lightboxBox(arts[i].ratio || [4, 5]))
    setLightbox(i)
  }

  const stepArt = (d: number) => {
    const i = wrap(lightbox + d, arts.length)
    fromRect.current = null
    setBox(lightboxBox(arts[i].ratio || [4, 5]))
    setLightbox(i)
  }

  // close: the work flies back to its place on the wall, if that place is on screen
  const closeArt = () => {
    if (closing.current) return
    const lb = lbRef.current
    const media = lb?.querySelector(".vmt-lb-media") as HTMLElement | null
    const thumb = root.current?.querySelector('.vmt-art[data-i="' + lightbox + '"] .vmt-art-media') as HTMLElement | null
    if (!lb || !media || reduced()) {
      setLightbox(-1)
      return
    }
    closing.current = true
    const to = media.getBoundingClientRect()
    const r = thumb?.getBoundingClientRect()
    const onScreen = r && r.bottom > 0 && r.top < window.innerHeight
    const tl = gsap.timeline({
      onComplete: () => {
        closing.current = false
        setLightbox(-1)
      },
    })
    tl.to(lb.querySelectorAll(".vmt-lb-cap, .vmt-lb-x, .vmt-lb-arrow"), { autoAlpha: 0, duration: 0.25 }, 0)
    if (onScreen && r) {
      tl.to(media, { x: r.left - to.left, y: r.top - to.top, scaleX: r.width / to.width, scaleY: r.height / to.height, transformOrigin: "0 0", duration: 0.75, ease: "expo.inOut" }, 0)
      tl.to(lb, { "--lb-a": 0, duration: 0.6, ease: "power2.inOut" }, 0.1)
    } else {
      tl.to(media, { autoAlpha: 0, y: 30, duration: 0.4, ease: "power2.in" }, 0)
      tl.to(lb, { "--lb-a": 0, duration: 0.4 }, 0)
    }
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
            const top = -pg.getBoundingClientRect().top
            header.classList.toggle("is-solid", top > 24)
            header.classList.toggle("is-tucked", self.direction === 1 && top > 480)
          }
        },
      })

      const mm = gsap.matchMedia()
      mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, (c) => {
        const { motion } = c.conditions as { motion: boolean }
        if (!motion) return

        // the hero opens like a pair of gallery doors, then the copy rises
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } })
        intro
          .fromTo(".vmt-hero-media", { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "expo.inOut", clearProps: "clipPath" }, 0)
          .fromTo(".vmt-hero-slide.is-active .vmt-hero-img", { scale: 1.32 }, { scale: 1, duration: 3.2, ease: "power3.out" }, 0)
          .from(".vmt-topbar, .vmt-header", { autoAlpha: 0, y: -14, duration: 1, stagger: 0.08 }, 0.7)
          .from(".vmt-hero .vmt-rise", { y: 24, autoAlpha: 0, duration: 1, stagger: 0.12 }, 1.05)
          .from(".vmt-hero .vmt-w", { yPercent: 115, rotate: 4, duration: 1.3, stagger: 0.045 }, 1.1)
          // the inner parts enter; the scroll-out below fades their parents, so the two never fight
          .from(".vmt-hero-arrow.is-prev svg", { x: -30, autoAlpha: 0, duration: 1.2 }, 1.3)
          .from(".vmt-hero-arrow.is-next svg", { x: 30, autoAlpha: 0, duration: 1.2 }, 1.3)
          .from(".vmt-hero-dots", { autoAlpha: 0, y: 12, duration: 1 }, 1.5)

        // leaving the hero: the room recedes, the copy lifts away
        gsap
          .timeline({ scrollTrigger: { trigger: ".vmt-hero", start: "top top", end: "bottom top", scrub: 0.6 } })
          .to(".vmt-hero-media", { yPercent: 22, scale: 1.08, ease: "none" }, 0)
          .to(".vmt-hero-content", { yPercent: -40, autoAlpha: 0, ease: "none" }, 0)
          .to(".vmt-hero-foot, .vmt-hero-arrow", { autoAlpha: 0, ease: "none", duration: 0.4 }, 0)

        // headings: words rise out of their masks; rules draw across
        el.querySelectorAll(".vmt-split").forEach((h) => {
          if (h.closest(".vmt-hero")) return
          gsap.from(h.querySelectorAll(".vmt-sw"), { yPercent: 115, duration: 1.1, stagger: 0.05, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 88%", once: true } })
        })
        el.querySelectorAll(".vmt-rule").forEach((r) => {
          gsap.from(r, { scaleX: 0, transformOrigin: "0% 50%", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: r, start: "top 92%", once: true } })
        })
        el.querySelectorAll(".vmt-reveal").forEach((r) => {
          gsap.from(r, { y: 26, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: r, start: "top 90%", once: true } })
        })

        // welcome: the drawing is laid down in ink as you scroll, and drifts
        gsap.fromTo(".vmt-drawing-wrap", { "--ink": 0 }, { "--ink": 1, ease: "none", scrollTrigger: { trigger: ".vmt-welcome", start: "top 85%", end: "center 45%", scrub: 0.8 } })
        gsap.fromTo(".vmt-drawing-wrap", { yPercent: 6, rotate: -1.2, scale: 1.06 }, { yPercent: -6, rotate: 0.6, scale: 1, ease: "none", scrollTrigger: { trigger: ".vmt-welcome", start: "top bottom", end: "bottom top", scrub: true } })

        // exhibitions: the banner opens from the top, its painting drifts; the rows follow
        gsap.fromTo(".vmt-ex-banner", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".vmt-ex-banner", start: "top 86%", once: true } })
        gsap.fromTo(".vmt-ex-par", { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: ".vmt-ex-banner", start: "top bottom", end: "bottom top", scrub: true } })
        gsap.from(".vmt-ex-row", { y: 30, autoAlpha: 0, duration: 1, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".vmt-ex-list", start: "top 88%", once: true } })

        // visitor info: the wall slides open from the left, the panel's rows arrive
        gsap.fromTo(".vmt-visit-photo", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".vmt-visit", start: "top 75%", once: true } })
        gsap.fromTo(".vmt-visit-img", { scale: 1.25, xPercent: -6 }, { scale: 1.08, xPercent: 0, duration: 2.4, ease: "expo.out", scrollTrigger: { trigger: ".vmt-visit", start: "top 75%", once: true } })
        gsap.fromTo(".vmt-visit-par", { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".vmt-visit", start: "top bottom", end: "bottom top", scrub: true } })
        gsap.from(".vmt-visit-panel .vmt-rise", { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: ".vmt-visit-panel", start: "top 70%", once: true } })

        // the hang, services, footer
        revealArts(Array.from(el.querySelectorAll(".vmt-art")))
        gsap.from(".vmt-svc", { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".vmt-svcs", start: "top 88%", once: true } })
        gsap.from(".vmt-svc-ic svg", { scale: 0.4, rotate: -30, autoAlpha: 0, duration: 1.1, stagger: 0.08, ease: "back.out(2)", scrollTrigger: { trigger: ".vmt-svcs", start: "top 88%", once: true } })
        gsap.from(".vmt-foot .vmt-rise", { y: 26, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".vmt-foot", start: "top 88%", once: true } })
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

  // slide change: the next room is drawn across like a curtain, the old one slides away beneath it
  useIso(() => {
    const h = heroRef.current
    if (!h) return
    const from = prevSlide.current
    prevSlide.current = slide
    if (from === slide) return
    const all = Array.from(h.querySelectorAll(".vmt-hero-slide")) as HTMLElement[]
    const inEl = all[slide]
    const outEl = all[from]
    if (!inEl || !outEl || reduced()) return
    const dir = dirRef.current
    slideTl.current?.progress(1).kill()
    all.forEach((s) => s !== inEl && s !== outEl && gsap.set(s, { clearProps: "all" }))
    const inImg = inEl.querySelector(".vmt-hero-img")
    const outImg = outEl.querySelector(".vmt-hero-img")
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(outEl, { clearProps: "all" })
        gsap.set([inEl], { clearProps: "zIndex,clipPath" })
        if (outImg) gsap.set(outImg, { clearProps: "transform" })
      },
    })
    tl.set(outEl, { autoAlpha: 1, zIndex: 1 })
      .set(inEl, { autoAlpha: 1, zIndex: 2 })
      .fromTo(inEl, { clipPath: dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" }, 0)
      .fromTo(inImg, { xPercent: dir * 18, scale: 1.18 }, { xPercent: 0, scale: 1, duration: 2.2, ease: "expo.out" }, 0)
      .to(outImg, { xPercent: -dir * 14, scale: 1.04, duration: 1.4, ease: "expo.inOut" }, 0)
      .from(h.querySelectorAll(".vmt-hero-copy .vmt-w"), { yPercent: 115, rotate: 3, duration: 1.2, stagger: 0.04, ease: "expo.out" }, 0.55)
      .from(h.querySelectorAll(".vmt-hero-copy .vmt-rise"), { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" }, 0.65)
    slideTl.current = tl
  }, [slide])

  React.useEffect(() => () => {
    slideTl.current?.kill()
  }, [])

  // autoplay: a gold hairline fills under the active dot, then the next room
  React.useEffect(() => {
    const bar = apRef.current
    apTween.current?.kill()
    apTween.current = null
    if (!bar) return
    if (!autoplay || n < 2 || reduced()) {
      gsap.set(bar, { scaleX: 0 })
      return
    }
    const tw = gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: autoplay / 1000,
        ease: "none",
        transformOrigin: "0% 50%",
        paused: hovering.current,
        onComplete: () => {
          dirRef.current = 1
          setSlide((s) => wrap(s + 1, n))
        },
      },
    )
    apTween.current = tw
    return () => {
      tw.kill()
    }
  }, [slide, autoplay, n])

  const onHeroKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") goSlide(slide + 1, 1)
    else if (e.key === "ArrowLeft") goSlide(slide - 1, -1)
  }

  // the lightbox opens by morphing the painting off the wall into place
  useIso(() => {
    const lb = lbRef.current
    if (!lbOpen || !lb) return
    const media = lb.querySelector(".vmt-lb-media") as HTMLElement | null
    if (!media || reduced()) {
      if (lb) lb.style.setProperty("--lb-a", "1")
      return
    }
    const r = fromRect.current
    const ctx = gsap.context(() => {
      const to = media.getBoundingClientRect()
      if (r && to.width > 0) {
        gsap.fromTo(lb, { "--lb-a": 0 }, { "--lb-a": 1, duration: 0.6, ease: "power2.out" })
        gsap.fromTo(
          media,
          { x: r.left - to.left, y: r.top - to.top, scaleX: r.width / to.width, scaleY: r.height / to.height, transformOrigin: "0 0" },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.95, ease: "expo.inOut" },
        )
        gsap.from(lb.querySelectorAll(".vmt-lb-cap > *, .vmt-lb-x, .vmt-lb-arrow"), { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.05, ease: "power3.out", delay: 0.55 })
      } else {
        lb.style.setProperty("--lb-a", "1")
        gsap.fromTo(media, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "expo.out" })
        gsap.from(lb.querySelectorAll(".vmt-lb-cap > *"), { y: 12, autoAlpha: 0, duration: 0.6, stagger: 0.05, ease: "power3.out", delay: 0.1 })
      }
    }, lb)
    fromRect.current = null
    return () => ctx.revert()
  }, [lightbox])

  // lightbox and drawer: Escape, arrows, scroll lock, focus, resize
  React.useEffect(() => {
    if (!lbOpen && !menu) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lbOpen) closeArt()
        setMenu(false)
      }
      if (lbOpen && e.key === "ArrowRight") stepArt(1)
      if (lbOpen && e.key === "ArrowLeft") stepArt(-1)
    }
    const onResize = () => lbOpen && setBox(lightboxBox(arts[lightbox].ratio || [4, 5]))
    document.addEventListener("keydown", onKey)
    window.addEventListener("resize", onResize)
    const body = document.body
    const was = body.style.overflow
    body.style.overflow = "hidden"
    if (lbOpen) closeRef.current?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onResize)
      body.style.overflow = was
      if (!lbOpen || lightbox < 0) prev?.focus?.({ preventScroll: true })
    }
  }, [lbOpen, menu, lightbox, arts.length])

  // the "View" cursor over the hang (fine pointers only)
  React.useEffect(() => {
    const hang = hangRef.current
    const cur = cursorRef.current
    if (!hang || !cur || !window.matchMedia("(pointer: fine)").matches) return
    const qx = gsap.quickTo(cur, "x", { duration: 0.45, ease: "power3.out" })
    const qy = gsap.quickTo(cur, "y", { duration: 0.45, ease: "power3.out" })
    let on = false
    const onMove = (e: PointerEvent) => {
      qx(e.clientX)
      qy(e.clientY)
      const over = !!(e.target as Element).closest?.(".vmt-art-btn")
      if (over !== on) {
        on = over
        gsap.to(cur, { scale: over ? 1 : 0, autoAlpha: over ? 1 : 0, duration: over ? 0.5 : 0.3, ease: over ? "expo.out" : "power2.in" })
      }
    }
    const onLeave = () => {
      on = false
      gsap.to(cur, { scale: 0, autoAlpha: 0, duration: 0.3 })
    }
    gsap.set(cur, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 })
    hang.addEventListener("pointermove", onMove)
    hang.addEventListener("pointerleave", onLeave)
    return () => {
      hang.removeEventListener("pointermove", onMove)
      hang.removeEventListener("pointerleave", onLeave)
    }
  }, [])

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
      <svg width="40" height="10" viewBox="0 0 40 10" aria-hidden="true" focusable="false">
        <path className="vmt-arr-shaft" d="M0 5h38" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <path d="M33 1l5 4-5 4" fill="none" stroke="currentColor" strokeWidth="1.1" />
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
            <Icon name="pin" size={12} />
            <span>{m.address}</span>
          </p>
          <div className="vmt-tb-right">
            <button type="button" className="vmt-tb-btn" aria-expanded={search} onClick={() => setSearch((s) => !s)}>
              <Icon name="search" size={13} />
              <span>Search</span>
            </button>
            <div ref={langRef} className="vmt-lang">
              <button type="button" className="vmt-tb-btn" aria-haspopup="listbox" aria-expanded={langOpen} onClick={() => setLangOpen((o) => !o)}>
                <Icon name="globe" size={13} />
                <span>{lang}</span>
                <Icon name="chevron" size={11} className="vmt-lang-chev" />
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

          <div className="vmt-hero-content" aria-live="polite">
            <div className="vmt-hero-copy" key={slide}>
              {cur.kicker && <p className="vmt-hero-kicker vmt-rise">{cur.kicker}</p>}
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
              <button type="button" className="vmt-hero-arrow is-prev" aria-label="Previous exhibition" onClick={() => goSlide(slide - 1, -1)}>
                {ARROW_L}
              </button>
              <button type="button" className="vmt-hero-arrow is-next" aria-label="Next exhibition" onClick={() => goSlide(slide + 1, 1)}>
                {ARROW_R}
              </button>
              <div className="vmt-hero-foot">
                <div className="vmt-hero-dots" role="tablist" aria-label="Exhibitions">
                  {slides.map((s, i) => (
                    <button key={i} type="button" role="tab" aria-selected={i === slide} aria-label={s.title} className={"vmt-hero-dot" + (i === slide ? " is-on" : "")} onClick={() => goSlide(i)}>
                      <span className="vmt-hero-num">{String(i + 1).padStart(2, "0")}</span>
                      <i className="vmt-hero-track">
                        <i ref={i === slide ? (el) => (apRef.current = el) : undefined} />
                      </i>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* welcome */}
        <section className="vmt-welcome" data-vmt-sec="about">
          <div className="vmt-drawing-wrap" style={{ "--ink": 1 } as React.CSSProperties}>
            {w.sketch ? <Sketch image={wImage} enabled /> : <img className="vmt-drawing" src={wImage.src} alt={wImage.alt || ""} loading="lazy" decoding="async" style={{ objectPosition: focusPos(wImage) }} />}
          </div>
          <div className="vmt-wrap vmt-welcome-grid">
            <div className="vmt-welcome-copy">
              <Split text={w.title} className="vmt-h2 vmt-h2-xl" />
              <p className="vmt-lead vmt-reveal">{w.body}</p>
              <div className="vmt-reveal">{more(w.link)}</div>
            </div>
          </div>
        </section>

        {/* exhibitions */}
        <section className="vmt-ex" data-vmt-sec="exhibitions">
          <div className="vmt-wrap">
            <div className="vmt-head">
              <Split text={exTitle} className="vmt-h2" />
              <div className="vmt-reveal">{more(exAll)}</div>
            </div>
            <i className="vmt-rule" aria-hidden="true" />
            <div className="vmt-ex-banner">
              <div className="vmt-ex-par">
                {exItems.map((x, i) => {
                  const img = toImage(x.image, DEFAULT_EXHIBITIONS[0].image as VernissageImage)
                  return (
                    <div key={i} className={"vmt-ex-slide" + (i === activeEx ? " is-active" : "")} aria-hidden={i !== activeEx}>
                      <img className="vmt-ex-img" src={img.src} alt={img.alt || ""} loading="lazy" decoding="async" style={{ objectPosition: focusPos(img) }} />
                    </div>
                  )
                })}
              </div>
              <span className="vmt-ex-count" aria-hidden="true">
                {String(activeEx + 1).padStart(2, "0")} / {String(exItems.length).padStart(2, "0")}
              </span>
            </div>
            <ul className="vmt-ex-list">
              {exItems.map((x, i) => (
                <li key={i} className={"vmt-ex-row" + (i === activeEx ? " is-active" : "")} onPointerEnter={() => setActiveEx(i)} onFocus={() => setActiveEx(i)}>
                  <div className="vmt-ex-name">
                    <h3>{x.title}</h3>
                    <p>{x.dates}</p>
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
            <div className="vmt-visit-par">
              <img className="vmt-visit-img" src={vImage.src} alt={vImage.alt || ""} loading="lazy" decoding="async" style={{ objectPosition: focusPos(vImage) }} />
            </div>
          </div>
          <div className="vmt-visit-panel">
            <div className="vmt-visit-inner">
              <h2 className="vmt-h2 vmt-visit-title vmt-rise">{v.title}</h2>
              <p className="vmt-tab-title vmt-rise">{v.pricesTitle}</p>
              <dl className="vmt-tab vmt-rise">
                {v.prices.map((p, i) => (
                  <React.Fragment key={i}>
                    <dt>{p.label}</dt>
                    <dd>{p.value}</dd>
                  </React.Fragment>
                ))}
              </dl>
              <p className="vmt-tab-title vmt-rise">
                <span>{v.hoursTitle}</span>
                <span className={"vmt-open" + (doors.open ? " is-open" : "")}>
                  <i aria-hidden="true" />
                  {doors.open ? "Open now" : "Closed now"}
                </span>
              </p>
              <dl className="vmt-tab vmt-rise">
                {hourRows.map((r, i) => {
                  const today = r.indices.includes(todayIdx)
                  return (
                    <React.Fragment key={i}>
                      <dt className={today ? "is-today" : ""}>{r.days}</dt>
                      <dd className={today ? "is-today" : ""}>{r.hours}</dd>
                    </React.Fragment>
                  )
                })}
              </dl>
              <div className="vmt-rise vmt-visit-more">{more(v.link, "is-light")}</div>
            </div>
          </div>
        </section>

        {/* collection */}
        <section className="vmt-col" data-vmt-sec="collection">
          <div className="vmt-wrap">
            <div className="vmt-head">
              <Split text={col.title} className="vmt-h2" />
              <div className="vmt-reveal">{more(col.viewAll)}</div>
            </div>
            <i className="vmt-rule" aria-hidden="true" />
            <p className="vmt-intro vmt-reveal">{col.intro}</p>
            <div ref={hangRef} className="vmt-hang" style={{ "--cols": cols } as React.CSSProperties}>
              {columns.map((list, c) => (
                <div key={c} className="vmt-hang-col">
                  {list.map(({ a, i }) => {
                    const img = toImage(a.image, { src: "", alt: a.title })
                    const r = a.ratio || [4, 5]
                    return (
                      <article key={i} className="vmt-art" data-i={i}>
                        <div className="vmt-art-media" style={{ aspectRatio: r[0] + " / " + r[1] }}>
                          <img className="vmt-art-img" src={img.src} alt={img.alt || ""} loading="lazy" decoding="async" style={{ objectPosition: focusPos(img) }} />
                          <button type="button" className="vmt-art-btn" onClick={(e) => openArt(i, (e.currentTarget as HTMLElement).parentElement)} aria-label={"View " + a.title + " by " + a.artist} />
                        </div>
                        <div className="vmt-art-cap">
                          <h3 className="vmt-art-title">{a.title}</h3>
                          <p className="vmt-art-meta">
                            {a.artist}
                            {a.year ? ", " + a.year : ""}
                          </p>
                        </div>
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
                <span className="vmt-col-count">
                  {shown} of {arts.length}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* services */}
        <section className="vmt-svc-sec" data-vmt-sec="services">
          <div className="vmt-wrap">
            <div className="vmt-head">
              <Split text={svTitle} className="vmt-h2" />
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
                          <Icon name={s.icon || "ticket"} size={30} />
                        </span>
                        <span className="vmt-svc-title">{s.title}</span>
                        <Icon name="chevron" size={15} className="vmt-svc-chev" />
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
              <address>
                <span className="vmt-foot-tag">{m.tagline}</span>
                {m.address}
                <br />
                {m.phone}
                <br />
                <a href={"mailto:" + m.email}>{m.email}</a>
              </address>
            </div>
            {ft.columns.map((c, i) => (
              <div key={i} className="vmt-foot-col vmt-rise">
                <h4>{c.title}</h4>
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
                  <Icon name={socialIcon(s.label)} size={14} />
                </a>
              ))}
            </div>
            <p className="vmt-foot-copy">{ft.copyright}</p>
          </div>
        </footer>
      </div>

      {/* fixed layers live outside the container so position: fixed is the viewport */}
      <div ref={cursorRef} className="vmt-cursor" aria-hidden="true">
        View
      </div>

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
              <span className="vmt-drawer-num">{String(i + 1).padStart(2, "0")}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <p className="vmt-drawer-foot">
          <span>{doors.label}</span>
          <span>{m.address}</span>
        </p>
      </div>

      {lbArt && lbImg && (
        <div ref={lbRef} className="vmt-lb" role="dialog" aria-modal="true" aria-label={lbArt.title} onClick={(e) => e.target === e.currentTarget && closeArt()}>
          <button ref={closeRef} type="button" className="vmt-lb-x" aria-label="Close" onClick={closeArt}>
            <Icon name="close" size={20} />
          </button>
          {arts.length > 1 && (
            <button type="button" className="vmt-lb-arrow is-prev" aria-label="Previous work" onClick={() => stepArt(-1)}>
              {ARROW_L}
            </button>
          )}
          <figure className="vmt-lb-fig">
            <div className="vmt-lb-media" key={lightbox} style={{ width: box.width, height: box.height }}>
              <img src={lbImg.src} alt={lbImg.alt || lbArt.title} />
              <svg className="vmt-fr" aria-hidden="true" focusable="false">
                <rect width="100%" height="100%" pathLength={1} />
              </svg>
            </div>
            <figcaption className="vmt-lb-cap" key={"c" + lightbox}>
              <span className="vmt-lb-n">
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
            <button type="button" className="vmt-lb-arrow is-next" aria-label="Next work" onClick={() => stepArt(1)}>
              {ARROW_R}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---- styles (scoped to .vmt-) ----------------------------------------------------

const CSS = `
.vmt-root{--paper:var(--c-paper);--paper2:var(--c-paper2);--ink:var(--c-ink);--muted:var(--c-muted);--gold:var(--c-gold);--band:var(--c-band);--on-band:var(--c-paper);--on-band-muted:color-mix(in oklab,var(--c-paper) 58%,var(--c-band));--line:color-mix(in oklab,var(--ink) 14%,transparent);--line-band:color-mix(in oklab,var(--on-band) 16%,transparent);--ease:cubic-bezier(.22,1,.36,1);--ease-io:cubic-bezier(.76,0,.24,1);--hh:72px;--tb:32px;position:relative;width:100%;background:var(--paper);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.vmt-root.vmt-dark,:where(.dark) .vmt-root:not(.vmt-light){--paper:color-mix(in oklab,var(--c-band),#ffffff 5%);--paper2:color-mix(in oklab,var(--c-band),#ffffff 8%);--ink:var(--c-paper);--muted:color-mix(in oklab,var(--c-paper) 62%,var(--c-band));--gold:var(--c-gold2);--band:color-mix(in oklab,var(--c-band),#000000 45%)}
:where(.vmt-root) *,:where(.vmt-root) *::before,:where(.vmt-root) *::after{box-sizing:border-box}
.vmt-page{container-type:inline-size;position:relative;width:100%}
:where(.vmt-root) a{color:inherit;text-decoration:none}
:where(.vmt-root) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}
:where(.vmt-root) :where(h1,h2,h3,h4,p,dl,dt,dd,ul,figure,address){margin:0;padding:0}
:where(.vmt-root) ul{list-style:none}
:where(.vmt-root) address{font-style:normal}
:where(.vmt-root) img{max-width:none}
:where(.vmt-root) :focus-visible{outline:1.5px solid var(--gold);outline-offset:3px}
.vmt-ic{display:block;flex:none}
.vmt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.vmt-wrap{width:min(calc(52cqi + 220px),100% - 2 * clamp(20px,5cqi,64px));margin-inline:auto}
.vmt-h2{font-family:var(--sans);font-weight:600;font-size:clamp(22px,1.95cqi,28px);line-height:1.22;letter-spacing:-.005em}
.vmt-h2-xl{font-size:clamp(26px,2.45cqi,36px);line-height:1.2}
.vmt-split{text-wrap:balance}
.vmt-sm{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em}
.vmt-sw{display:inline-block;will-change:transform}
.vmt-lead{font-family:var(--serif);font-size:clamp(16px,1.25cqi,18px);line-height:1.7;color:var(--muted)}

/* links and buttons */
.vmt-more{display:inline-flex;align-items:center;gap:14px;font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);padding:10px 0;transition:color .3s var(--ease)}
.vmt-more .vmt-arr-shaft{transform-origin:100% 50%;transition:transform .5s var(--ease)}
.vmt-more svg{overflow:visible;transition:transform .5s var(--ease)}
.vmt-more:hover{color:var(--gold)}
.vmt-more:hover svg{transform:translateX(6px)}
.vmt-more:hover .vmt-arr-shaft{transform:scaleX(1.25)}
.vmt-more.is-light{color:var(--on-band)}
.vmt-more.is-light:hover{color:var(--c-gold2)}
.vmt-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 24px;border-radius:999px;font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;white-space:nowrap;overflow:hidden;isolation:isolate;transition:color .45s var(--ease),border-color .45s var(--ease),transform .45s var(--ease)}
.vmt-btn::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;transform:translateY(101%);transition:transform .55s var(--ease)}
.vmt-btn:hover::before{transform:translateY(0)}
.vmt-btn:active{transform:scale(.97)}
.vmt-btn-light{background:var(--c-paper);color:var(--c-ink)}
.vmt-btn-light::before{background:var(--c-gold2)}
.vmt-btn-ghost{border:1px solid var(--line);color:var(--ink);min-height:34px;padding:0 20px}
.vmt-btn-ghost::before{background:var(--ink)}
.vmt-btn-ghost:hover{color:var(--paper);border-color:var(--ink)}
.vmt-btn-dark{background:var(--ink);color:var(--paper);min-height:40px;padding:0 30px}
.vmt-btn-dark::before{background:var(--gold)}
.vmt-btn-dark:hover{color:#fff}

/* gilt hairline (lightbox) */
.vmt-fr{position:absolute;inset:8px;width:calc(100% - 16px);height:calc(100% - 16px);overflow:visible;pointer-events:none;z-index:2}
.vmt-fr rect{fill:none;stroke:var(--c-gold2);stroke-width:2;stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw,1));opacity:.7}
.vmt-visit,.vmt-foot{--gold:var(--c-gold2)}

/* top bar */
.vmt-topbar{position:relative;z-index:31;display:flex;align-items:center;gap:24px;height:var(--tb);padding:0 clamp(16px,2.4cqi,34px);background:var(--c-band);color:color-mix(in oklab,var(--c-paper) 70%,var(--c-band));font-size:9.5px;letter-spacing:.1em;text-transform:uppercase}
.vmt-tb-item{display:flex;align-items:center;gap:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.vmt-tb-addr{margin-left:auto}
.vmt-tb-right{display:flex;align-items:center;gap:4px}
.vmt-tb-btn{display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 10px;border-radius:999px;letter-spacing:.1em;text-transform:uppercase;transition:color .3s var(--ease),background .3s var(--ease)}
.vmt-tb-btn:hover{color:var(--c-paper);background:color-mix(in oklab,var(--c-paper) 9%,transparent)}
.vmt-dot{width:6px;height:6px;border-radius:50%;border:1.2px solid currentColor;flex:none}
.vmt-dot.is-open{background:var(--c-gold2);border-color:var(--c-gold2);animation:vmt-pulse 2.4s var(--ease) infinite}
@keyframes vmt-pulse{0%{box-shadow:0 0 0 0 color-mix(in oklab,var(--c-gold2) 55%,transparent)}70%,100%{box-shadow:0 0 0 7px transparent}}
.vmt-lang{position:relative}
.vmt-lang-chev{transition:transform .3s var(--ease)}
.vmt-tb-btn[aria-expanded="true"] .vmt-lang-chev{transform:rotate(180deg)}
.vmt-lang-menu{position:absolute;right:0;top:calc(100% + 6px);min-width:96px;padding:6px;background:var(--c-band);border:1px solid color-mix(in oklab,var(--c-paper) 14%,transparent);border-radius:12px;box-shadow:0 18px 40px -16px #000;animation:vmt-pop .28s var(--ease)}
.vmt-lang-menu button{display:block;width:100%;text-align:left;padding:8px 12px;border-radius:8px;letter-spacing:.12em}
.vmt-lang-menu button:hover{background:color-mix(in oklab,var(--c-paper) 9%,transparent);color:var(--c-paper)}
.vmt-lang-menu button[aria-selected="true"]{color:var(--c-gold2)}
@keyframes vmt-pop{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:none}}

/* header */
.vmt-header{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;height:var(--hh);margin-bottom:calc(-1 * var(--hh));padding:0 clamp(16px,2.4cqi,34px);color:var(--c-paper);transition:transform .7s var(--ease),background-color .5s var(--ease),box-shadow .5s var(--ease)}
.vmt-header::before{content:"";position:absolute;inset:0 0 -30px;z-index:-1;background:linear-gradient(to bottom,color-mix(in oklab,var(--c-band) 60%,transparent),transparent);pointer-events:none;transition:opacity .5s var(--ease)}
.vmt-header.is-solid{background:color-mix(in oklab,var(--c-band) 94%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.vmt-header.is-solid::before{opacity:0}
.vmt-header.is-tucked:not(.is-open):not(.is-search){transform:translateY(-100%)}
.vmt-nav{display:flex;align-items:center;gap:clamp(16px,2.2cqi,34px)}
.vmt-nav-r{justify-content:flex-end}
.vmt-nav-a{position:relative;font-size:9.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;padding:10px 0;opacity:.9;transition:opacity .3s var(--ease)}
.vmt-nav-a::after{content:"";position:absolute;left:0;right:0;bottom:4px;height:1px;background:var(--c-gold2);transform:scaleX(0);transform-origin:100% 50%;transition:transform .45s var(--ease)}
.vmt-nav-a:hover{opacity:1}
.vmt-nav-a:hover::after{transform:scaleX(1);transform-origin:0% 50%}
.vmt-brand{font-family:var(--serif);font-weight:700;font-size:clamp(26px,2.3cqi,34px);letter-spacing:.03em;line-height:1;text-transform:lowercase;color:var(--c-paper);padding:6px 10px;transition:color .3s var(--ease)}
.vmt-brand:hover{color:var(--c-gold2)}
.vmt-brand.is-foot{display:inline-block;color:var(--c-gold2);padding:0;font-size:clamp(30px,2.6cqi,38px);margin-bottom:22px}
.vmt-burger{display:none;width:44px;height:44px;align-items:center;justify-content:center;border-radius:50%}
.vmt-burger.is-search{justify-self:end}
.vmt-progress{position:absolute;left:0;right:0;bottom:0;height:1px;overflow:hidden;opacity:0;transition:opacity .4s}
.vmt-header.is-solid .vmt-progress{opacity:1}
.vmt-progress b{display:block;height:100%;background:var(--c-gold2);transform:scaleX(0);transform-origin:0 50%}
.vmt-search{position:absolute;left:0;right:0;top:100%;display:flex;align-items:center;gap:14px;padding:14px clamp(16px,2.4cqi,34px);background:var(--c-band);color:var(--c-paper);border-top:1px solid color-mix(in oklab,var(--c-paper) 10%,transparent);animation:vmt-pop .3s var(--ease)}
.vmt-search input{flex:1;min-width:0;height:44px;background:none;border:0;border-bottom:1px solid color-mix(in oklab,var(--c-paper) 25%,transparent);color:inherit;font-family:var(--serif);font-size:20px;outline:none}
.vmt-search input:focus{border-bottom-color:var(--c-gold2)}
.vmt-search input::placeholder{color:color-mix(in oklab,var(--c-paper) 45%,transparent)}
.vmt-search-go{font-size:9.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;padding:12px 4px;color:var(--c-gold2)}
.vmt-search-x{width:40px;height:40px;display:grid;place-items:center;border-radius:50%}

/* hero */
.vmt-hero{position:relative;height:max(540px,min(calc(var(--h) - var(--tb)),calc(50cqi + 80px)));overflow:hidden;background:var(--c-band);color:var(--c-paper);isolation:isolate}
.vmt-hero-media{position:absolute;inset:0;overflow:hidden;will-change:transform}
.vmt-hero-slide{position:absolute;inset:0;visibility:hidden;overflow:hidden}
.vmt-hero-slide.is-active{visibility:visible}
.vmt-hero-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;will-change:transform}
.vmt-hero-tint{position:absolute;inset:0;z-index:3;pointer-events:none;background:radial-gradient(ellipse 58% 44% at 50% 50%,color-mix(in oklab,var(--c-band) 58%,transparent),transparent 80%),linear-gradient(color-mix(in oklab,var(--c-band) 16%,transparent),color-mix(in oklab,var(--c-band) 16%,transparent)),linear-gradient(to bottom,color-mix(in oklab,var(--c-band) 58%,transparent) 0%,transparent 28%,transparent 66%,color-mix(in oklab,var(--c-band) 62%,transparent) 100%)}
.vmt-hero-content{position:absolute;inset:0;z-index:4;display:grid;place-items:center;text-align:center;padding:calc(var(--hh) + 10px) clamp(70px,11cqi,190px) 80px}
.vmt-hero-copy{display:flex;flex-direction:column;align-items:center;gap:clamp(14px,1.6cqi,22px);max-width:900px}
.vmt-hero-kicker{font-family:var(--serif);font-size:clamp(14px,1.15cqi,17px);letter-spacing:.02em;color:color-mix(in oklab,var(--c-paper) 92%,var(--c-gold2))}
.vmt-hero-title{font-family:var(--sans);font-weight:600;font-size:clamp(30px,3.9cqi,60px);line-height:1.12;letter-spacing:-.012em;text-wrap:balance;text-shadow:0 2px 34px color-mix(in oklab,var(--c-band) 55%,transparent)}
.vmt-wm{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .13em .1em;margin:0 -.065em -.1em}
.vmt-w{display:inline-block;will-change:transform;transform-origin:0 100%}
.vmt-hero-copy .vmt-btn{margin-top:6px}
.vmt-hero-arrow{position:absolute;top:50%;z-index:5;display:grid;place-items:center;width:72px;height:56px;margin-top:-28px;color:var(--c-paper);opacity:.85;transition:opacity .3s,transform .5s var(--ease)}
.vmt-hero-arrow svg,.vmt-lb-arrow svg{overflow:visible;fill:none;stroke:currentColor;stroke-width:1.2}
.vmt-hero-arrow .vmt-arr-shaft,.vmt-lb-arrow .vmt-arr-shaft{transition:transform .5s var(--ease)}
.vmt-hero-arrow.is-prev .vmt-arr-shaft,.vmt-lb-arrow.is-prev .vmt-arr-shaft{transform-origin:0 50%}
.vmt-hero-arrow.is-next .vmt-arr-shaft,.vmt-lb-arrow.is-next .vmt-arr-shaft{transform-origin:100% 50%}
.vmt-hero-arrow:hover,.vmt-lb-arrow:hover{opacity:1}
.vmt-hero-arrow.is-prev:hover{transform:translateX(-6px)}
.vmt-hero-arrow.is-next:hover{transform:translateX(6px)}
.vmt-hero-arrow:hover .vmt-arr-shaft,.vmt-lb-arrow:hover .vmt-arr-shaft{transform:scaleX(.7)}
.vmt-hero-arrow.is-prev{left:clamp(12px,2.6cqi,44px)}
.vmt-hero-arrow.is-next{right:clamp(12px,2.6cqi,44px)}
.vmt-hero-foot{position:absolute;left:0;right:0;bottom:clamp(24px,3cqi,40px);z-index:5;display:flex;justify-content:center;pointer-events:none}
.vmt-hero-dots{display:flex;gap:18px;pointer-events:auto}
.vmt-hero-dot{display:flex;align-items:center;gap:10px;height:36px;color:color-mix(in oklab,var(--c-paper) 55%,transparent);transition:color .3s}
.vmt-hero-dot:hover,.vmt-hero-dot.is-on{color:var(--c-paper)}
.vmt-hero-num{font-size:9.5px;font-weight:600;letter-spacing:.16em;font-variant-numeric:tabular-nums}
.vmt-hero-track{position:relative;display:block;width:34px;height:1px;background:color-mix(in oklab,var(--c-paper) 30%,transparent);transition:width .6s var(--ease)}
.vmt-hero-dot.is-on .vmt-hero-track{width:64px}
.vmt-hero-track i{position:absolute;inset:-.5px 0;background:var(--c-gold2);transform:scaleX(0);transform-origin:0 50%}
.vmt-hero-dot:not(.is-on) .vmt-hero-track i{transform:scaleX(0) !important}

/* welcome */
.vmt-welcome{position:relative;overflow:hidden;background:var(--paper2);min-height:clamp(480px,44cqi,700px);display:flex;align-items:center;padding:clamp(72px,8cqi,120px) 0}
.vmt-drawing-wrap{position:absolute;top:-16%;bottom:-16%;right:max(-1cqi,-20px);aspect-ratio:.74;pointer-events:none;mix-blend-mode:multiply;-webkit-mask-image:linear-gradient(155deg,#000 calc(var(--ink,1) * 150% - 50%),transparent calc(var(--ink,1) * 150% - 8%)),radial-gradient(ellipse 50% 50% at 50% 50%,#000 58%,transparent 100%);mask-image:linear-gradient(155deg,#000 calc(var(--ink,1) * 150% - 50%),transparent calc(var(--ink,1) * 150% - 8%)),radial-gradient(ellipse 50% 50% at 50% 50%,#000 58%,transparent 100%);-webkit-mask-composite:source-in;mask-composite:intersect}
.vmt-drawing{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;filter:grayscale(1) sepia(.28) contrast(1.6) brightness(1.2);opacity:.8}
.vmt-drawing-wrap .vmt-sketch{position:absolute;inset:0;width:100%;height:100%}
.vmt-dark .vmt-drawing-wrap,:where(.dark) .vmt-root:not(.vmt-light) .vmt-drawing-wrap{mix-blend-mode:screen}
.vmt-dark .vmt-drawing,:where(.dark) .vmt-root:not(.vmt-light) .vmt-drawing{filter:invert(1) grayscale(1) contrast(2.4) brightness(.62) sepia(.35);opacity:.8}
.vmt-welcome-grid{position:relative;z-index:1}
.vmt-welcome-copy{display:flex;flex-direction:column;gap:22px;max-width:min(430px,52%)}
.vmt-sketch{position:relative;width:100%;aspect-ratio:5 / 4;color:var(--ink)}
.vmt-sketch-cv{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;color:inherit;opacity:0;transition:opacity 1.2s var(--ease)}
.vmt-sketch.is-drawn .vmt-sketch-cv{opacity:.9}
.vmt-sketch-flat{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;filter:grayscale(1) contrast(1.15) brightness(1.08);opacity:.5}

/* section heads */
.vmt-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap}
.vmt-rule{display:block;height:2px;background:color-mix(in oklab,var(--ink) 72%,transparent);margin:16px 0 clamp(24px,2.6cqi,34px)}

/* exhibitions */
.vmt-ex{padding:clamp(72px,8cqi,120px) 0 clamp(64px,7cqi,100px)}
.vmt-ex-banner{position:relative;aspect-ratio:3.1 / 1;min-height:200px;overflow:hidden;background:var(--paper2);margin-bottom:clamp(16px,1.6cqi,22px)}
.vmt-ex-par{position:absolute;inset:-8% 0}
.vmt-ex-slide{position:absolute;inset:0;overflow:hidden;clip-path:inset(100% 0% 0% 0%);z-index:0;transition:clip-path 0s linear 1s}
.vmt-ex-slide.is-active{clip-path:inset(0% 0% 0% 0%);z-index:2;transition:clip-path 1s var(--ease-io)}
.vmt-ex-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;transform:scale(1.16);transition:transform 0s 1s}
.vmt-ex-slide.is-active .vmt-ex-img{transform:scale(1);transition:transform 1.8s var(--ease)}
.vmt-ex-count{position:absolute;right:14px;bottom:14px;z-index:3;padding:6px 10px;border-radius:999px;background:color-mix(in oklab,var(--c-band) 72%,transparent);color:var(--c-paper);font-size:9.5px;font-weight:600;letter-spacing:.16em;font-variant-numeric:tabular-nums;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.vmt-ex-list{display:flex;flex-direction:column}
.vmt-ex-row{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.55fr) auto;align-items:center;gap:clamp(18px,3cqi,44px);padding:clamp(18px,1.9cqi,24px) 0;border-bottom:1px solid var(--line);transition:padding .5s var(--ease)}
.vmt-ex-row::before{content:"";position:absolute;left:0;top:50%;width:12px;height:1.5px;background:var(--gold);transform:scaleX(0);transform-origin:0 50%;transition:transform .5s var(--ease)}
.vmt-ex-row.is-active{padding-left:24px}
.vmt-ex-row.is-active::before{transform:scaleX(1)}
.vmt-ex-name h3{font-family:var(--sans);font-weight:600;font-size:13px;line-height:1.38;max-width:15em;margin-bottom:5px;transition:color .3s}
.vmt-ex-name p{font-size:9.5px;letter-spacing:.04em;color:var(--muted)}
.vmt-ex-row.is-active .vmt-ex-name p{color:var(--gold)}
.vmt-ex-blurb{font-family:var(--serif);font-size:14.5px;line-height:1.55;color:var(--muted)}

/* visitor info */
.vmt-visit{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);background:var(--band);color:var(--on-band)}
.vmt-visit-photo{position:relative;min-height:clamp(400px,40cqi,600px);overflow:hidden}
.vmt-visit-par{position:absolute;inset:-8% 0;overflow:hidden}
.vmt-visit-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;transform:scale(1.08)}
.vmt-visit-panel{display:flex;align-items:center;padding:clamp(48px,6cqi,96px) clamp(24px,6.5cqi,110px)}
.vmt-visit-inner{width:100%;max-width:380px}
.vmt-visit-title{font-size:clamp(26px,2.4cqi,34px);margin-bottom:clamp(22px,2.4cqi,30px)}
.vmt-tab-title{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:10.5px;font-weight:600;letter-spacing:.02em;padding-bottom:8px;margin:24px 0 10px;border-bottom:1px solid var(--line-band)}
.vmt-tab-title:first-of-type{margin-top:0}
.vmt-tab{display:grid;grid-template-columns:max-content 1fr;row-gap:2px;font-family:var(--serif);font-size:15px;line-height:1.55;color:var(--on-band-muted)}
.vmt-tab dt{padding-right:clamp(20px,2.4cqi,36px)}
.vmt-tab dd{padding-left:clamp(14px,1.6cqi,22px);border-left:1px solid var(--line-band);font-variant-numeric:tabular-nums}
.vmt-tab .is-today{color:var(--on-band)}
.vmt-tab dt.is-today::after{content:"today";margin-left:8px;font-family:var(--sans);font-size:8.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--c-gold2);vertical-align:2px}
.vmt-open{display:inline-flex;align-items:center;gap:7px;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--on-band-muted)}
.vmt-open i{width:6px;height:6px;border-radius:50%;border:1px solid currentColor}
.vmt-open.is-open{color:var(--on-band)}
.vmt-open.is-open i{background:var(--c-gold2);border-color:var(--c-gold2);animation:vmt-pulse 2.4s var(--ease) infinite}
.vmt-visit-more{margin-top:22px}

/* collection */
.vmt-col{padding:clamp(72px,8cqi,120px) 0}
.vmt-intro{font-size:11.5px;line-height:1.7;color:var(--muted);max-width:30em;margin:-6px 0 clamp(24px,2.6cqi,34px)}
.vmt-hang{display:grid;grid-template-columns:repeat(var(--cols,3),minmax(0,1fr));gap:clamp(16px,2cqi,28px);align-items:start}
.vmt-hang-col{display:flex;flex-direction:column;gap:clamp(24px,2.6cqi,36px)}
.vmt-art-media{position:relative;overflow:hidden;background:color-mix(in oklab,var(--ink) 8%,var(--paper))}
.vmt-art-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;transition:transform 1.1s var(--ease),filter .6s var(--ease)}
.vmt-art-btn{position:absolute;inset:0;z-index:2;cursor:zoom-in}
.vmt-art-btn:focus-visible{outline-offset:-4px}
.vmt-art:hover .vmt-art-img{transform:scale(1.05)}
.vmt-art-cap{padding-top:12px}
.vmt-art-title{display:inline;font-family:var(--sans);font-weight:600;font-size:12.5px;line-height:1.4;background:linear-gradient(currentColor,currentColor) 0 100% / 0 1px no-repeat;transition:background-size .6s var(--ease)}
.vmt-art:hover .vmt-art-title{background-size:100% 1px}
.vmt-art-meta{font-size:9.5px;line-height:1.5;color:var(--muted);margin-top:5px;letter-spacing:.02em}
.vmt-col-foot{display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:clamp(40px,4.4cqi,60px)}
.vmt-col-count{font-size:9.5px;font-weight:600;letter-spacing:.16em;color:var(--muted)}

/* services */
.vmt-svc-sec{background:var(--paper2);padding:clamp(64px,7cqi,104px) 0}
.vmt-svcs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:clamp(24px,3.4cqi,48px);align-items:start}
.vmt-svc{border-bottom:1px solid var(--line)}
.vmt-svc-btn{display:flex;align-items:center;gap:14px;width:100%;min-height:62px;text-align:left}
.vmt-svc-ic{display:grid;place-items:center;width:38px;height:38px;color:var(--gold);transition:transform .5s var(--ease)}
.vmt-svc-ic svg [stroke]{stroke-width:1.1}
.vmt-svc-btn:hover .vmt-svc-ic{transform:rotate(-8deg) scale(1.08)}
.vmt-svc-title{flex:1;font-size:11.5px;font-weight:600;letter-spacing:.02em}
.vmt-svc-chev{color:var(--muted);transition:transform .5s var(--ease),color .3s}
.vmt-svc.is-open .vmt-svc-chev{transform:rotate(180deg);color:var(--gold)}
.vmt-svc-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .6s var(--ease)}
.vmt-svc.is-open .vmt-svc-panel{grid-template-rows:1fr}
.vmt-svc-clip{overflow:hidden;min-height:0}
.vmt-svc-inner{padding:0 0 22px 52px;opacity:0;transform:translateY(-6px);visibility:hidden;transition:opacity .4s var(--ease),transform .5s var(--ease),visibility 0s .5s}
.vmt-svc.is-open .vmt-svc-inner{opacity:1;transform:none;visibility:visible;transition:opacity .5s var(--ease) .1s,transform .6s var(--ease) .1s,visibility 0s}
.vmt-svc-inner p{font-family:var(--serif);font-size:15px;line-height:1.6;color:var(--muted);margin-bottom:4px}

/* footer */
.vmt-foot{background:var(--band);color:var(--on-band);padding:clamp(56px,6cqi,88px) 0 0}
.vmt-foot-grid{display:grid;grid-template-columns:minmax(0,1.7fr) repeat(3,minmax(0,.7fr));gap:clamp(24px,3.4cqi,48px);padding-bottom:clamp(44px,5cqi,72px)}
.vmt-foot-brand address{display:flex;flex-direction:column;font-family:var(--serif);font-size:15px;line-height:1.6;color:var(--on-band)}
.vmt-foot-tag{display:block}
.vmt-foot-brand address a{align-self:flex-start;color:var(--on-band-muted);border-bottom:1px solid var(--line-band);transition:color .3s,border-color .3s}
.vmt-foot-brand address a:hover{color:var(--c-gold2);border-color:var(--c-gold2)}
.vmt-foot-col h4{font-size:11px;font-weight:600;margin-bottom:16px;color:var(--on-band)}
.vmt-foot-col ul{display:flex;flex-direction:column;gap:1px}
.vmt-foot-a{display:inline-block;padding:5px 0;font-size:9px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--on-band-muted);transition:color .3s var(--ease),transform .4s var(--ease)}
.vmt-foot-a:hover{color:var(--on-band);transform:translateX(4px)}
.vmt-foot-bar{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;padding:20px 0 26px;border-top:1px solid var(--line-band)}
.vmt-foot-social{display:flex;gap:6px}
.vmt-foot-social a{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;color:var(--on-band-muted);transition:color .3s,background .3s}
.vmt-foot-social a:hover{color:var(--c-band);background:var(--c-gold2)}
.vmt-foot-copy{font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--on-band-muted)}

/* "View" cursor */
.vmt-cursor{position:fixed;left:0;top:0;z-index:55;width:86px;height:86px;display:grid;place-items:center;border-radius:50%;background:var(--c-paper);color:var(--c-ink);font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;pointer-events:none;opacity:0;box-shadow:0 14px 40px -18px color-mix(in oklab,var(--c-band) 80%,transparent)}

/* mobile drawer */
.vmt-drawer{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;padding:16px 24px 28px;background:var(--c-band);color:var(--c-paper);clip-path:inset(0 0 100% 0);visibility:hidden;transition:clip-path .7s var(--ease-io),visibility 0s .7s}
.vmt-drawer.is-open{clip-path:inset(0 0 0 0);visibility:visible;transition:clip-path .7s var(--ease-io),visibility 0s}
.vmt-drawer-top{display:flex;align-items:center;justify-content:space-between;height:52px}
.vmt-drawer-x{width:44px;height:44px;display:grid;place-items:center;border-radius:50%}
.vmt-drawer-nav{display:flex;flex-direction:column;margin-top:5vh}
.vmt-drawer-nav a{display:flex;align-items:baseline;gap:16px;padding:12px 0;border-bottom:1px solid color-mix(in oklab,var(--c-paper) 10%,transparent);font-family:var(--serif);font-size:clamp(28px,8vw,42px);line-height:1.1;opacity:0;transform:translateY(18px);transition:opacity .5s var(--ease),transform .6s var(--ease),color .3s}
.vmt-drawer.is-open .vmt-drawer-nav a{opacity:1;transform:none}
.vmt-drawer-nav a:hover{color:var(--c-gold2)}
.vmt-drawer-num{font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.16em;color:var(--c-gold2)}
.vmt-drawer-foot{margin-top:auto;display:flex;flex-direction:column;gap:6px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:color-mix(in oklab,var(--c-paper) 60%,transparent)}

/* lightbox */
.vmt-lb{position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:20px;--lb-a:1}
.vmt-lb::before{content:"";position:absolute;inset:0;background:var(--c-band);opacity:calc(var(--lb-a) * .96)}
.vmt-lb-fig{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:18px}
.vmt-lb-media{position:relative;overflow:hidden;box-shadow:0 40px 80px -40px #000;will-change:transform}
.vmt-lb-media img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block}
.vmt-lb-cap{display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;color:var(--c-paper)}
.vmt-lb-n{font-size:9.5px;font-weight:600;letter-spacing:.18em;color:var(--c-gold2)}
.vmt-lb-cap strong{font-size:15px;font-weight:600}
.vmt-lb-meta{font-family:var(--serif);font-style:italic;font-size:16px;color:color-mix(in oklab,var(--c-paper) 62%,transparent)}
.vmt-lb-x{position:absolute;top:16px;right:16px;z-index:2;width:46px;height:46px;display:grid;place-items:center;border-radius:50%;color:var(--c-paper);border:1px solid color-mix(in oklab,var(--c-paper) 22%,transparent);transition:background .3s,transform .5s var(--ease)}
.vmt-lb-x:hover{background:var(--c-gold2);color:var(--c-band);transform:rotate(90deg)}
.vmt-lb-arrow{position:absolute;top:50%;z-index:2;width:72px;height:56px;margin-top:-28px;display:grid;place-items:center;color:var(--c-paper);opacity:.75;transition:opacity .3s}
.vmt-lb-arrow.is-prev{left:clamp(8px,3vw,40px)}
.vmt-lb-arrow.is-next{right:clamp(8px,3vw,40px)}

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
  .vmt-ex-row{grid-template-columns:minmax(0,1fr) auto;row-gap:8px}
  .vmt-ex-blurb{grid-column:1 / -1;grid-row:2}
  .vmt-ex-row .vmt-btn{grid-row:1;grid-column:2}
  .vmt-foot-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .vmt-foot-brand{grid-column:1 / -1}
}
@container (max-width: 760px){
  .vmt-welcome{flex-direction:column;align-items:stretch;padding-top:0}
  .vmt-drawing-wrap{position:relative;top:auto;bottom:auto;right:auto;width:min(100%,520px);height:auto;aspect-ratio:.82;margin:0 auto -18%;align-self:center}
  .vmt-welcome-copy{max-width:none}
  .vmt-visit{grid-template-columns:1fr}
  .vmt-visit-photo{min-height:clamp(280px,64cqi,440px)}
  .vmt-svcs{grid-template-columns:1fr}
  .vmt-hero-arrow{top:auto;bottom:clamp(14px,3cqi,30px);margin-top:0;width:56px}
  .vmt-hero-content{padding-inline:24px}
  .vmt-ex-banner{aspect-ratio:16 / 10}
}
@container (max-width: 560px){
  .vmt-tb-open{font-size:9px}
  .vmt-tb-btn span{display:none}
  .vmt-hero{height:max(600px,min(calc(var(--h) - var(--tb)),180cqi))}
  .vmt-hero-num{display:none}
  .vmt-hero-dots{gap:10px}
  .vmt-hero-track{width:22px}
  .vmt-hero-dot.is-on .vmt-hero-track{width:40px}
  .vmt-ex-row.is-active{padding-left:18px}
  .vmt-ex-row{grid-template-columns:1fr}
  .vmt-ex-row .vmt-btn{grid-row:auto;grid-column:auto;justify-self:start}
  .vmt-ex-blurb{grid-row:auto}
  .vmt-foot-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .vmt-search input{font-size:17px}
  .vmt-lb-arrow{top:auto;bottom:14px;margin-top:0}
}

@media (prefers-reduced-motion: reduce){
  .vmt-root *,.vmt-root *::before,.vmt-root *::after{transition-duration:.01ms !important;transition-delay:0s !important;animation:none !important}
  .vmt-art:hover .vmt-art-img{transform:none}
}
`
