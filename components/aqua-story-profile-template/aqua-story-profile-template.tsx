"use client"

// Aqua Story Profile Template — a personal profile page laid out like a
// scrapbooked Instagram story: aqua glass over a blurred street photo, white
// rimmed frames, caps labels, a hand-lettered script and stickers.
//
// The top of the page is a story player. The progress pill fills, the photo,
// the glass caption card, the date and the blurred backdrop all move to the
// next story; tap either side of the photo, pick a segment, or use the arrow
// keys. The small frame in the glass card is the story up next. The white
// card sends a note. Below it: a date ribbon whose "Account decorate" opens a
// sticker tray you drag onto the page, story highlights that open a full
// viewer, an "Exchange reviews" card with hearts you can tap, a wall of
// friend reviews you can add to, and "Play with me", a how-well-do-you-know-me
// quiz.
//
// The script lettering is drawn from glyph outlines in this file (Allura, SIL
// Open Font License), so no web font loads. Photos are Unsplash URLs and every
// one is a prop; each frame paints its own aqua film still underneath, so a
// photo that is slow, blocked or missing still leaves a finished frame.
import * as React from "react"

export type AspStory = {
  image: string
  alt?: string
  /** Replaces the bio in the glass card while this story is up. */
  caption?: string
  /** "07 July 2026": the day and month go on the first line, the year on the second. */
  date?: string
  location?: string
}

export type AspProfile = {
  name: string
  handle: string
  avatar?: string
  /** Caps line beside the avatar. */
  tagline?: string
  bio?: string
  url?: string
}

export type AspReview = {
  name: string
  handle?: string
  avatar?: string
  text: string
  /** 1 to 5. */
  hearts?: number
  /** "bestie since 2014", "classmate"… */
  tag?: string
  /** Shown as given, e.g. "06 JUL". */
  date?: string
}

export type AspHighlight = { label: string; cover?: string; slides: string[] }

export type AspQuestion = { q: string; options: string[]; answer: number }

export type AspStickerKind = "hibiscus" | "heart" | "sparkle" | "bow" | "cloud" | "butterfly" | "film" | "tape"

/** x is a fraction of the page width, y is pixels from the top of the page. */
export type AspSticker = { id?: string; kind: AspStickerKind; x: number; y: number; rotate?: number; size?: number }

/** A placed sticker, as stored. */
export type AspPlacedSticker = { id: string; kind: AspStickerKind; x: number; y: number; rotate: number; size: number }

export type AspPaletteName = "aqua" | "blush" | "matcha" | "midnight"

export type AspPalette = {
  /** Lightest tone: fallback skies, washes. */
  sky: string
  /** Mid tone: progress fill, rings, frame backing. */
  mist: string
  /** Darkest tone: ribbon tab, buttons, ink on paper. */
  deep: string
  /** Glass card fill (use alpha). */
  glass: string
  glassEdge: string
  /** Text on glass and photos. */
  ink: string
  paper: string
  paperInk: string
  paperMuted: string
  /** Input wells on paper. */
  field: string
  accent: string
  /** Colour laid over the blurred backdrop (use alpha). */
  wash: string
}

export type AspPaletteInput = {
  sky?: string
  mist?: string
  deep?: string
  glass?: string
  glassEdge?: string
  ink?: string
  paper?: string
  paperInk?: string
  paperMuted?: string
  field?: string
  accent?: string
  wash?: string
}

export type AspNote = { placeholder?: string; sent?: string }

export type AspRibbon = { date?: string; credit?: string; credit2?: string; action?: string }

export type AspExchange = {
  /** Script lettering. Letters, spaces and . , ! ? ' & - are drawn; anything else falls back to a cursive font. */
  title?: string
  image?: string
  text?: string
  tab?: string
  link?: { label?: string; url?: string; avatar?: string }
  /** The tilted sticker hanging off the card. */
  sticker?: string
  footCenter?: string
  footRight?: string
}

export type AspReviews = { title?: string; eyebrow?: string; items?: AspReview[]; write?: string }

export type AspHighlights = { title?: string; eyebrow?: string; items?: AspHighlight[] }

export type AspQuiz = { button?: string; title?: string; questions?: AspQuestion[] }

export type AquaStoryProfileTemplateProps = {
  profile?: AspProfile
  stories?: AspStory[]
  /** The white note card. `null` hides it. */
  note?: AspNote | null
  ribbon?: AspRibbon | null
  highlights?: AspHighlights | null
  exchange?: AspExchange | null
  reviews?: AspReviews | null
  quiz?: AspQuiz | null
  /** Starting count for the hearts. */
  likes?: number
  /** Stickers already on the page. */
  decorations?: AspSticker[]
  /** Keep stickers placed in decorate mode in localStorage, per handle. */
  persistDecorations?: boolean
  palette?: AspPaletteName | AspPaletteInput
  /** 0 to 1: how strongly photos are graded toward the palette. */
  tint?: number
  /** Milliseconds per story. */
  storyDuration?: number
  /** Minimum height of the story header. */
  height?: string
  className?: string
  /** Called with a note or a highlight reply. Return (or resolve to) `false`, or throw, to show an error. */
  onNote?: (text: string, context: string) => unknown
  /** Called with a new review before it goes on the wall. Return `false`, or throw, to refuse it. */
  onReview?: (review: AspReview) => unknown
  onLike?: (count: number) => void
  onDecorate?: (stickers: AspSticker[]) => void
}

// #region content
const UNSPLASH = "https://images.unsplash.com/photo-"
const photo = (id: string, w: number, h: number) => UNSPLASH + id + "?auto=format&fit=crop&w=" + w + "&h=" + h + "&q=80"
const face = (id: string) => UNSPLASH + id + "?auto=format&fit=crop&crop=faces&w=200&h=200&q=80"

const PALETTES: { [name: string]: AspPalette } = {
  aqua: {
    sky: "#d6eaf1",
    mist: "#8cbdd1",
    deep: "#1e4c5f",
    glass: "rgba(112, 166, 189, 0.46)",
    glassEdge: "rgba(255, 255, 255, 0.6)",
    ink: "#ffffff",
    paper: "#ffffff",
    paperInk: "#1b3945",
    paperMuted: "#5f7c88",
    field: "#e5ecef",
    accent: "#4a98bb",
    wash: "rgba(150, 200, 219, 0.42)",
  },
  blush: {
    sky: "#f7e3e8",
    mist: "#e2a7b7",
    deep: "#5b2a3b",
    glass: "rgba(204, 140, 160, 0.46)",
    glassEdge: "rgba(255, 255, 255, 0.62)",
    ink: "#ffffff",
    paper: "#fffafa",
    paperInk: "#4a2231",
    paperMuted: "#8d6573",
    field: "#f3e6ea",
    accent: "#cf6a8b",
    wash: "rgba(232, 178, 195, 0.42)",
  },
  matcha: {
    sky: "#e4eddb",
    mist: "#a3bf8d",
    deep: "#2c4724",
    glass: "rgba(132, 166, 112, 0.46)",
    glassEdge: "rgba(255, 255, 255, 0.6)",
    ink: "#ffffff",
    paper: "#fdfdf8",
    paperInk: "#243a1e",
    paperMuted: "#62785a",
    field: "#e9eee3",
    accent: "#6a9750",
    wash: "rgba(170, 200, 150, 0.42)",
  },
  midnight: {
    sky: "#2a3560",
    mist: "#7d8fd6",
    deep: "#0d1330",
    glass: "rgba(52, 64, 118, 0.5)",
    glassEdge: "rgba(200, 210, 255, 0.45)",
    ink: "#f3f5ff",
    paper: "#f4f5fb",
    paperInk: "#141a36",
    paperMuted: "#626a8f",
    field: "#e4e7f3",
    accent: "#8b9cff",
    wash: "rgba(16, 22, 52, 0.5)",
  },
}

const DEFAULT_PROFILE: AspProfile = {
  name: "Yuna Han",
  handle: "yunaa.blue",
  avatar: face("1517841905240-472988babdf9"),
  tagline: "add me to your close friends",
  bio: "collecting soft summer days on film. leave me a little review and i'll write you one back.",
  url: "https://instagram.com/yunaa.blue",
}

const DEFAULT_STORIES: AspStory[] = [
  {
    image: photo("1517841905240-472988babdf9", 1200, 1100),
    alt: "Yuna outdoors on a bright summer afternoon",
    caption: "writing proper friend reviews this week… some people deserve to hear it out loud",
    date: "07 July 2026",
    location: "Seongsu-dong, Seoul",
  },
  {
    image: photo("1524504388940-b1c1722653e1", 1200, 1100),
    alt: "A portrait in soft daylight",
    caption: "film roll no. 12: every frame a little out of focus, every frame a keeper",
    date: "12 July 2026",
    location: "Hannam-dong, Seoul",
  },
  {
    image: photo("1529626455594-4ff0802cfb7e", 1200, 1100),
    alt: "A portrait at blue hour",
    caption: "blue hour, cold americano, the good kind of tired",
    date: "19 July 2026",
    location: "Mangwon, Seoul",
  },
  {
    image: photo("1534528741775-53994a69daeb", 1200, 1100),
    alt: "A close portrait in warm light",
    caption: "if you can read this you're on the close friends list. leave me a note ♡",
    date: "26 July 2026",
    location: "Aewol, Jeju",
  },
]

const DEFAULT_HIGHLIGHTS: AspHighlight[] = [
  {
    label: "seoul",
    cover: photo("1477959858617-67f85cf4f1df", 300, 300),
    slides: [photo("1477959858617-67f85cf4f1df", 900, 1600), photo("1449824913935-59a10b8d2000", 900, 1600)],
  },
  {
    label: "film",
    cover: photo("1516035069371-29a1b244cc32", 300, 300),
    slides: [photo("1516035069371-29a1b244cc32", 900, 1600), photo("1524504388940-b1c1722653e1", 900, 1600)],
  },
  {
    label: "sea",
    cover: photo("1507525428034-b723cf961d3e", 300, 300),
    slides: [photo("1507525428034-b723cf961d3e", 900, 1600), photo("1505142468610-359e7d316be0", 900, 1600)],
  },
  {
    label: "cafés",
    cover: photo("1495474472287-4d71bcdd2085", 300, 300),
    slides: [photo("1495474472287-4d71bcdd2085", 900, 1600), photo("1509042239860-f550ce710b93", 900, 1600)],
  },
  {
    label: "green",
    cover: photo("1441974231531-c6227db76b6e", 300, 300),
    slides: [photo("1441974231531-c6227db76b6e", 900, 1600), photo("1470071459604-3b5ec3a7fe05", 900, 1600)],
  },
]

const DEFAULT_EXCHANGE: AspExchange = {
  title: "Exchange reviews",
  image: photo("1441974231531-c6227db76b6e", 1400, 640),
  text: "friends, strangers, mutuals: write one, no hesitation",
  tab: "open to everyone",
  link: { label: "@ yunaa.blue instagram", url: "https://instagram.com/yunaa.blue", avatar: face("1534528741775-53994a69daeb") },
  sticker: "@ yunaa.blue",
  footCenter: "more in my highlights",
  footRight: "new stickers every friday",
}

const DEFAULT_REVIEWS: AspReview[] = [
  {
    name: "Seo-yeon",
    handle: "seoyeon.jpg",
    avatar: face("1494790108377-be9c29b29330"),
    text: "remembers your coffee order, your bad days and your mum's birthday. would get lost in a new city with her again, ten out of ten.",
    hearts: 5,
    tag: "bestie since 2014",
    date: "06 JUL",
  },
  {
    name: "Daniel Park",
    handle: "dpark.wav",
    avatar: face("1507003211169-0a1dd7228f2d"),
    text: "lent me her film camera for a whole summer and only asked for one print back. the print is on my fridge.",
    hearts: 5,
    tag: "mutual turned friend",
    date: "02 JUL",
  },
  {
    name: "Mai Tran",
    handle: "maitran.notes",
    avatar: face("1438761681033-6461ffad8d80"),
    text: "explains the hardest lecture better than the professor, then drags you out for tteokbokki after.",
    hearts: 4,
    tag: "classmate",
    date: "28 JUN",
  },
  {
    name: "Jae Lim",
    handle: "jae.lim",
    avatar: face("1500648767791-00dcc994a43e"),
    text: "met her on a photo walk in mangwon. she kept pointing out light i'd been walking past for years.",
    hearts: 5,
    tag: "stranger → friend",
    date: "21 JUN",
  },
  {
    name: "Aiko Mori",
    handle: "aiko.mori",
    avatar: face("1544005313-94ddf0286df2"),
    text: "her voice notes run four minutes long and i listen to every second of them.",
    hearts: 5,
    tag: "pen pal",
    date: "14 JUN",
  },
]

const DEFAULT_QUESTIONS: AspQuestion[] = [
  { q: "my go-to coffee order?", options: ["iced americano", "oat latte", "matcha, always", "hot chocolate"], answer: 0 },
  { q: "the camera in my bag right now?", options: ["olympus mju II", "canon AE-1", "a disposable", "just my phone"], answer: 0 },
  { q: "a free saturday, where am i?", options: ["a gallery in hannam", "the beach in jeju", "in bed until 2pm", "a café with a window seat"], answer: 3 },
  { q: "this summer's comfort playlist?", options: ["k-indie", "frank ocean", "lo-fi beats", "90s city pop"], answer: 3 },
  { q: "favourite colour, no hints", options: ["sage green", "sky blue", "lilac", "black"], answer: 1 },
]

const STICKER_KINDS: AspStickerKind[] = ["hibiscus", "heart", "sparkle", "bow", "cloud", "butterfly", "film", "tape"]

const TAGS = ["bestie", "classmate", "mutual", "stranger → friend", "family"]

// The hearts beside the Exchange card: position and size in card-wrapper widths (cqw).
const BUBBLES = [
  { x: 86.5, y: -5, s: 9, glass: true },
  { x: 97, y: -7, s: 7.4, glass: false },
  { x: 85, y: 5.5, s: 6.6, glass: false },
  { x: 94, y: 3.5, s: 8.6, glass: false },
  { x: 87.5, y: 13.5, s: 4.2, glass: false },
  { x: 93, y: 13, s: 5.8, glass: true },
  { x: 91.5, y: 19.5, s: 2.8, glass: false },
]
// #endregion content

// #region logic
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Wraps an index through a list, for arrow keys and story steps. */
function step(i: number, by: number, n: number): number {
  if (n <= 0) return 0
  return (((i + by) % n) + n) % n
}

/** "07 July 2026" → ["07 JULY", "2026"]. A missing year leaves the second line empty. */
function splitDate(date: string | undefined): [string, string] {
  const parts = (date || "").trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ["", ""]
  const last = parts[parts.length - 1]
  if (parts.length > 1 && /^\d{4}$/.test(last)) return [parts.slice(0, -1).join(" ").toUpperCase(), last]
  return [parts.join(" ").toUpperCase(), ""]
}

/** 248 → "248", 1234 → "1.2k", 12000 → "12k", 1500000 → "1.5m". */
function formatCount(n: number): string {
  const v = Math.max(0, Math.floor(n))
  if (v < 1000) return String(v)
  const [d, s] = v < 1e6 ? [1e3, "k"] : [1e6, "m"]
  const x = v / d
  const r = x < 10 ? Math.floor(x * 10) / 10 : Math.floor(x)
  return String(r).replace(/\.0$/, "") + s
}

function initials(name: string): string {
  const w = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean)
  if (!w.length) return "♡"
  return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase()
}

/** 06 JUL style stamp for a review posted now. */
function dayStamp(d: Date): string {
  const m = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][d.getMonth()]
  return String(d.getDate()).padStart(2, "0") + " " + m
}

function reviewProblem(text: string): string | null {
  const t = text.trim()
  if (t.length < 3) return "write a few words first"
  if (t.length > 240) return "keep it under 240 characters"
  return null
}

function rankFor(score: number, total: number): string {
  if (total <= 0) return ""
  const r = score / total
  if (r >= 1) return "certified close friend"
  if (r >= 0.6) return "basically family"
  if (r > 0) return "mutual in training"
  return "coffee soon? we need to catch up"
}

/** Lays out a line of script from the glyph table. Unknown characters are counted, not drawn. */
function layoutScript(text: string): { parts: { x: number; d: string }[]; width: number; missing: number } {
  let x = 0
  let missing = 0
  const parts: { x: number; d: string }[] = []
  for (const ch of text) {
    const g = SCRIPT_GLYPHS[ch]
    if (!g) {
      missing++
      x += 120
      continue
    }
    if (g[1]) parts.push({ x, d: g[1] })
    x += g[0]
  }
  return { parts, width: x, missing }
}

function resolvePalette(p: AspPaletteName | AspPaletteInput | undefined): AspPalette {
  if (typeof p === "string") return PALETTES[p] || PALETTES.aqua
  const base = PALETTES.aqua
  if (!p) return base
  const out = { ...base }
  for (const k of Object.keys(base) as (keyof AspPalette)[]) {
    const v = p[k]
    if (typeof v === "string" && v) out[k] = v
  }
  return out
}

/** Keeps a dropped sticker on the page: x in [0.02, 0.98], y inside the page height. */
function placeSticker(x: number, y: number, height: number): { x: number; y: number } {
  return { x: clamp(x, 0.02, 0.98), y: clamp(y, 24, Math.max(24, height - 24)) }
}

function readStickers(raw: string | null): AspPlacedSticker[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    if (!Array.isArray(v)) return []
    return v
      .filter((s) => s && STICKER_KINDS.includes(s.kind) && Number.isFinite(s.x) && Number.isFinite(s.y))
      .slice(0, 60)
      .map((s) => ({ id: String(s.id || Math.random()), kind: s.kind, x: s.x, y: s.y, rotate: Number(s.rotate) || 0, size: Number(s.size) || 76 }))
  } catch {
    return []
  }
}
// #endregion logic

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

function useReducedMotion(): boolean {
  const [r, setR] = React.useState(() => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setR(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return r
}

function useInView(ref: { current: Element | null }, once: boolean, threshold = 0.25): boolean {
  const [v, setV] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setV(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setV(true)
          if (once) io.disconnect()
        } else if (!once) setV(false)
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, once, threshold])
  return v
}

/* ---------------------------------------------------------------- art */

/** An aqua film still, painted under every photo so a frame is never empty. */
function FilmStill({ seed = 0 }: { seed?: number }) {
  const id = "asp" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const kind = ((seed % 3) + 3) % 3
  const sky = { stopColor: "var(--asp-sky)" }
  const mist = { stopColor: "var(--asp-mist)" }
  return (
    <svg className="asp-still" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id + "s"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={sky} />
          <stop offset="0.62" style={mist} />
          <stop offset="1" style={{ stopColor: "var(--asp-deep)" }} />
        </linearGradient>
        <radialGradient id={id + "g"} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={id + "b"} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={id + "n"}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed + 3} />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.13 0" />
        </filter>
      </defs>
      <rect width="300" height="400" fill={"url(#" + id + "s)"} />
      <circle cx={kind === 1 ? 70 : 220} cy={kind === 2 ? 210 : 96} r="120" fill={"url(#" + id + "g)"} />
      <g filter={"url(#" + id + "b)"}>
        {kind === 0 && (
          <g style={{ fill: "var(--asp-deep)" }}>
            <rect x="-10" y="150" width="70" height="140" opacity="0.32" />
            <rect x="52" y="180" width="54" height="110" opacity="0.22" />
            <rect x="196" y="130" width="62" height="160" opacity="0.28" />
            <rect x="250" y="170" width="70" height="120" opacity="0.36" />
            <rect x="-10" y="272" width="330" height="140" opacity="0.18" />
          </g>
        )}
        {kind === 1 && (
          <g style={{ fill: "var(--asp-deep)" }}>
            <ellipse cx="40" cy="260" rx="110" ry="90" opacity="0.35" />
            <ellipse cx="250" cy="230" rx="120" ry="110" opacity="0.3" />
            <ellipse cx="150" cy="380" rx="200" ry="90" opacity="0.4" />
            <ellipse cx="190" cy="120" rx="60" ry="40" opacity="0.12" />
          </g>
        )}
        {kind === 2 && (
          <g>
            <rect x="-10" y="226" width="320" height="200" style={{ fill: "var(--asp-deep)" }} opacity="0.34" />
            <rect x="-10" y="222" width="320" height="6" fill="#fff" opacity="0.5" />
            <ellipse cx="150" cy="300" rx="90" ry="10" fill="#fff" opacity="0.28" />
          </g>
        )}
      </g>
      {kind === 0 && (
        <g fill="#fff" opacity="0.5">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const t = i - 3
            return <path key={i} d={`M${150 + t * 22} 300 L${150 + t * 22 + 12} 300 L${150 + t * 62 + 34} 400 L${150 + t * 62} 400Z`} />
          })}
        </g>
      )}
      {kind === 2 && (
        <g fill="#fff">
          {[
            [60, 250, 1.6],
            [120, 262, 1.1],
            [200, 248, 1.4],
            [240, 290, 1.2],
            [90, 310, 1],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} opacity="0.85" />
          ))}
        </g>
      )}
      <rect width="300" height="400" filter={"url(#" + id + "n)"} />
    </svg>
  )
}

/** A photo with its film still underneath. Fades in when it loads; if it never does, the still stays. */
function Photo({ src, alt = "", seed = 0, eager = false, className = "" }: { src?: string; alt?: string; seed?: number; eager?: boolean; className?: string }) {
  const ref = React.useRef(null as HTMLImageElement | null)
  const [loaded, setLoaded] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => {
    setLoaded(false)
    setFailed(false)
    const img = ref.current
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true)
  }, [src])
  return (
    <span className={"asp-photo " + className}>
      <FilmStill seed={seed} />
      {src && !failed ? (
        <img
          ref={ref}
          className="asp-photo-img"
          src={src}
          alt={alt}
          width={1200}
          height={1100}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          data-loaded={loaded ? "" : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  )
}

function Avatar({ src, name, className = "" }: { src?: string; name: string; className?: string }) {
  const [failed, setFailed] = React.useState(false)
  return (
    <span className={"asp-ava " + className} aria-hidden="true">
      <span className="asp-ava-init">{initials(name)}</span>
      {src && !failed ? (
        <img className="asp-ava-img" src={src} alt="" width={200} height={200} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} />
      ) : null}
    </span>
  )
}

const HEART = "M12 21.2s-7.6-4.7-9.7-9.4C.8 8.4 3 4.4 6.8 4.4c2.1 0 3.6 1.1 4.4 2.7.8-1.6 2.3-2.7 4.4-2.7 3.8 0 6 4 4.5 7.4-2.1 4.7-8.1 9.4-8.1 9.4z"

function Heart({ filled = true, className = "" }: { filled?: boolean; className?: string }) {
  return (
    <svg className={"asp-icon " + className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={HEART} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} strokeLinejoin="round" />
    </svg>
  )
}

function Icon({ name, className = "" }: { name: "pin" | "left" | "right" | "plus" | "send" | "x" | "pause" | "play" | "link"; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  return (
    <svg className={"asp-icon " + className} viewBox="0 0 24 24" aria-hidden="true">
      {name === "pin" && (
        <>
          <path d="M12 22s7-6.6 7-12.2A7 7 0 0 0 5 9.8C5 15.4 12 22 12 22z" fill="currentColor" />
          <circle cx="12" cy="9.8" r="2.6" fill="var(--asp-deep)" />
        </>
      )}
      {name === "left" && <path d="M15 5l-7 7 7 7" {...p} />}
      {name === "right" && <path d="M9 5l7 7-7 7" {...p} />}
      {name === "plus" && <path d="M12 5v14M5 12h14" {...p} />}
      {name === "send" && <path d="M12 19V5M6 11l6-6 6 6" {...p} />}
      {name === "x" && <path d="M6 6l12 12M18 6L6 18" {...p} />}
      {name === "pause" && <path d="M9 6v12M15 6v12" {...p} strokeWidth={3} />}
      {name === "play" && <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />}
      {name === "link" && <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" {...p} />}
    </svg>
  )
}

/** White line hibiscus, the profile card's mark. */
function Hibiscus({ className = "" }: { className?: string }) {
  return (
    <svg className={"asp-icon " + className} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="#fff">
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            transform={"rotate(" + i * 72 + " 32 32)"}
            d="M32 31C25 25 17.5 15 22 8.6c2.2-3.1 5.6-2.6 7.2-.6 1-2.4 4.4-3.4 6.8-.9 2.1-1.2 5-.4 6.2 2.4 2.6 6.4-4.2 15.2-10.2 21.5z"
          />
        ))}
      </g>
      <g fill="none" style={{ stroke: "var(--asp-mist)" }} strokeWidth="1.1" strokeLinecap="round" opacity="0.9">
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} transform={"rotate(" + i * 72 + " 32 32)"} d="M32 30C30.5 24 30 18 31.5 12" />
        ))}
      </g>
      <circle cx="32" cy="32" r="4.2" style={{ fill: "var(--asp-mist)" }} />
      <path d="M33 31l9-10" style={{ stroke: "var(--asp-deep)" }} strokeWidth="1.6" strokeLinecap="round" />
      {[
        [42, 21],
        [44.5, 22.5],
        [40.5, 18.8],
        [43.6, 19],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" style={{ fill: "var(--asp-deep)" }} />
      ))}
    </svg>
  )
}

/** A four-point twinkle. */
function Twinkle({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={"asp-icon " + className} style={style} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1c.9 6.2 4.8 10.1 11 11-6.2.9-10.1 4.8-11 11-.9-6.2-4.8-10.1-11-11 6.2-.9 10.1-4.8 11-11z" fill="currentColor" />
    </svg>
  )
}

/** The little "˚ ₊ ⊹ ♡" row on the note card, drawn so it never falls back to tofu. */
function NoteDeco({ className = "" }: { className?: string }) {
  return (
    <svg className={"asp-icon " + className} viewBox="0 0 120 24" aria-hidden="true">
      <g fill="currentColor">
        <path d="M30 4c.6 4 3 6.4 7 7-4 .6-6.4 3-7 7-.6-4-3-6.4-7-7 4-.6 6.4-3 7-7z" opacity="0.8" />
        <circle cx="46" cy="7" r="1.6" opacity="0.6" />
        <circle cx="52" cy="16" r="1.1" opacity="0.6" />
        <path d={HEART} transform="translate(57 2) scale(0.8)" />
        <circle cx="80" cy="15" r="1.3" opacity="0.6" />
        <path d="M90 6c.4 2.7 2 4.3 4.7 4.7-2.7.4-4.3 2-4.7 4.7-.4-2.7-2-4.3-4.7-4.7 2.7-.4 4.3-2 4.7-4.7z" opacity="0.7" />
      </g>
    </svg>
  )
}

/** Hand lettering from the glyph table, inked on when it scrolls in. */
function Script({ text, className = "", label }: { text: string; className?: string; label?: string }) {
  const ref = React.useRef(null as SVGSVGElement | null)
  const layout = React.useMemo(() => layoutScript(text), [text])
  const [armed, setArmed] = React.useState(false)
  const seen = useInView(ref, true, 0.4)
  const reduced = useReducedMotion()
  useIsoLayoutEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setArmed(true)
  }, [])
  if (layout.missing) {
    return (
      <span className={"asp-script asp-script-font " + className} aria-label={label}>
        {text}
      </span>
    )
  }
  const padX = 70
  const top = SCRIPT_ASC + 70
  const h = top - SCRIPT_DESC + 40
  return (
    <svg
      ref={ref}
      className={"asp-script " + className}
      viewBox={-padX + " " + -top + " " + (layout.width + padX * 2) + " " + h}
      role="img"
      aria-label={label || text}
      data-armed={armed && !reduced ? "" : undefined}
      data-in={seen ? "" : undefined}
    >
      {layout.parts.map((p, i) => (
        <path key={i} d={p.d} transform={"translate(" + p.x + " 0)"} pathLength={1} style={{ ["--i" as string]: i } as React.CSSProperties} />
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------ stickers */

function StickerArt({ kind }: { kind: AspStickerKind }) {
  const shapes = stickerShapes(kind)
  return (
    <svg className="asp-stk-svg" viewBox="0 0 100 100" aria-hidden="true">
      <g className="asp-stk-cut">{shapes}</g>
      <g>{shapes}</g>
    </svg>
  )
}

function stickerShapes(kind: AspStickerKind) {
  switch (kind) {
    case "hibiscus":
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              transform={"rotate(" + (i * 72 - 10) + " 50 52)"}
              d="M50 51C40 43 28 28 35 17c3.5-5 9-4.2 11.4-1 1.6-3.8 7-5.3 10.8-1.4 3.4-1.9 8-.6 9.8 3.8 4 10.2-6.7 24.2-17 32.6z"
              fill="#f58aa8"
            />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={"v" + i} transform={"rotate(" + (i * 72 - 10) + " 50 52)"} d="M50 50c-2-8-2.4-17-.4-26" fill="none" stroke="#e0607f" strokeWidth="1.2" strokeLinecap="round" />
          ))}
          <circle cx="50" cy="52" r="7" fill="#d9466c" />
          <path d="M51 51l13-15" stroke="#f7d36b" strokeWidth="2.4" strokeLinecap="round" />
          {[
            [64, 35],
            [67.5, 37.5],
            [61.5, 32],
            [66, 32.5],
          ].map(([x, y], i) => (
            <circle key={"s" + i} cx={x} cy={y} r="2" fill="#f2b632" />
          ))}
        </g>
      )
    case "heart":
      return (
        <g>
          <path d="M50 88S16 66 10 44C5 26 17 12 31 12c9 0 15.6 5 19 12 3.4-7 10-12 19-12 14 0 26 14 21 32-6 22-40 44-40 44z" fill="#5aa6c9" />
          <path d="M50 82S22 63 17 45c-3.6-13 4-25 15-25 8 0 13 4.6 16 11" fill="none" stroke="#7fc0dd" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
          <ellipse cx="28" cy="32" rx="7" ry="4.4" transform="rotate(-35 28 32)" fill="#fff" opacity="0.85" />
          <circle cx="37" cy="26" r="2" fill="#fff" opacity="0.8" />
        </g>
      )
    case "sparkle":
      return (
        <g>
          <path d="M44 6c3 18 13 28 31 31-18 3-28 13-31 31-3-18-13-28-31-31 18-3 28-13 31-31z" fill="#fff1a8" stroke="#e7c64a" strokeWidth="2" strokeLinejoin="round" />
          <path d="M76 56c1.6 9 6.5 13.9 15.5 15.5-9 1.6-13.9 6.5-15.5 15.5-1.6-9-6.5-13.9-15.5-15.5 9-1.6 13.9-6.5 15.5-15.5z" fill="#cfe9f5" stroke="#86bcd6" strokeWidth="2" strokeLinejoin="round" />
        </g>
      )
    case "bow":
      return (
        <g>
          <path d="M50 48C38 30 14 24 12 38c-2 13 18 22 38 12z" fill="#f6b8c8" stroke="#e48aa3" strokeWidth="2" />
          <path d="M50 48c12-18 36-24 38-10 2 13-18 22-38 12z" fill="#f6b8c8" stroke="#e48aa3" strokeWidth="2" />
          <path d="M46 52L30 86l10-3 6 9 5-38zM54 52l16 34-10-3-6 9-5-38z" fill="#f3a3b9" stroke="#e48aa3" strokeWidth="2" strokeLinejoin="round" />
          <rect x="43" y="42" width="14" height="14" rx="5" fill="#ef93ad" stroke="#e48aa3" strokeWidth="2" />
          <path d="M22 36c4-3 10-2 16 2" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
        </g>
      )
    case "cloud":
      return (
        <g>
          <path d="M26 74c-11 0-18-7-18-16 0-9 7-15 15-15 1-12 11-20 23-20 10 0 18 6 21 14 2-1 4-1 6-1 10 0 17 8 17 18s-7 20-18 20z" fill="#fff" stroke="#9cc7da" strokeWidth="2.4" />
          <path d="M24 64c4 2 10 2 14 0M60 66c4 2 10 2 14 0" fill="none" stroke="#d5e8f0" strokeWidth="3" strokeLinecap="round" />
        </g>
      )
    case "butterfly":
      return (
        <g>
          <path d="M49 50C40 30 22 12 12 22c-9 9 2 30 37 30z" fill="#7cb9d8" stroke="#3f88ad" strokeWidth="2" />
          <path d="M51 50C60 30 78 12 88 22c9 9-2 30-37 30z" fill="#7cb9d8" stroke="#3f88ad" strokeWidth="2" />
          <path d="M49 52C30 52 18 64 24 74c6 9 20 2 25-20zM51 52c19 0 31 12 25 22-6 9-20 2-25-20z" fill="#a9d4e8" stroke="#3f88ad" strokeWidth="2" />
          <circle cx="27" cy="28" r="4" fill="#fff" opacity="0.8" />
          <circle cx="73" cy="28" r="4" fill="#fff" opacity="0.8" />
          <rect x="47" y="36" width="6" height="40" rx="3" fill="#2b5e78" />
          <path d="M49 37c-3-8-8-12-12-13M51 37c3-8 8-12 12-13" fill="none" stroke="#2b5e78" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )
    case "film":
      return (
        <g transform="rotate(-8 50 50)">
          <rect x="8" y="28" width="84" height="44" rx="4" fill="#222a30" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <g key={i}>
              <rect x={13 + i * 10} y="31" width="5" height="4" rx="1" fill="#e8eef0" />
              <rect x={13 + i * 10} y="65" width="5" height="4" rx="1" fill="#e8eef0" />
            </g>
          ))}
          <rect x="13" y="38" width="22" height="24" rx="1.5" fill="#8cc2d8" />
          <rect x="39" y="38" width="22" height="24" rx="1.5" fill="#f2b7c6" />
          <rect x="65" y="38" width="22" height="24" rx="1.5" fill="#cfe1a8" />
        </g>
      )
    case "tape":
      return (
        <g transform="rotate(-10 50 50)">
          <path d="M6 36l4 3-4 3 4 3-4 3 4 3-4 3 4 3-4 3h88l-4-3 4-3-4-3 4-3-4-3 4-3-4-3 4-3-4-3z" fill="#cfe6f0" stroke="#9cc7da" strokeWidth="1.6" strokeLinejoin="round" />
          <text x="50" y="57" textAnchor="middle" fontSize="15" fontWeight="700" fill="#2e6f8c" fontFamily="Inter, Helvetica, Arial, sans-serif" letterSpacing="0.5">
            bestie ♡
          </text>
        </g>
      )
  }
}

/* ------------------------------------------------------------- dialogs */

function Modal({
  label,
  onClose,
  children,
  bare = false,
}: {
  label: string
  onClose: () => void
  children: React.ReactNode
  bare?: boolean
}) {
  const ref = React.useRef(null as HTMLDivElement | null)
  const close = React.useRef(onClose)
  close.current = onClose
  React.useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = "hidden"
    const el = ref.current
    const first = el?.querySelector("[data-autofocus]") as HTMLElement | null
    ;(first || el)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close.current()
        return
      }
      if (e.key !== "Tab" || !el) return
      const f = Array.from(el.querySelectorAll("button,[href],input,textarea,[tabindex]:not([tabindex='-1'])")).filter(
        (n) => !(n as HTMLElement).hasAttribute("disabled"),
      ) as HTMLElement[]
      if (!f.length) return
      const a = f[0]
      const b = f[f.length - 1]
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault()
        b.focus()
      } else if (!e.shiftKey && document.activeElement === b) {
        e.preventDefault()
        a.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      html.style.overflow = overflow
      prev?.focus?.()
    }
  }, [])
  return (
    <div
      className="asp-modal"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={ref} className={bare ? "asp-modal-bare" : "asp-sheet"} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </div>
    </div>
  )
}

function Composer({
  handle,
  onDone,
  onReview,
}: {
  handle: string
  onDone: (r: AspReview | null) => void
  onReview?: (r: AspReview) => unknown
}) {
  const [name, setName] = React.useState("")
  const [text, setText] = React.useState("")
  const [hearts, setHearts] = React.useState(5)
  const [tag, setTag] = React.useState(TAGS[0])
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState("")
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const problem = reviewProblem(text)
    if (problem) {
      setError(problem)
      return
    }
    const clean = name.trim().replace(/^@/, "")
    const review: AspReview = {
      name: clean || "a secret admirer",
      handle: clean && !/\s/.test(clean) ? clean.toLowerCase() : undefined,
      text: text.trim(),
      hearts,
      tag,
      date: dayStamp(new Date()),
    }
    setBusy(true)
    setError("")
    let ok = true
    try {
      if (onReview) {
        const res = await onReview(review)
        if (res === false) ok = false
      } else await new Promise((r) => setTimeout(r, 650))
    } catch {
      ok = false
    }
    setBusy(false)
    if (!ok) {
      setError("that didn't go through, try again?")
      return
    }
    onDone(review)
  }
  return (
    <form className="asp-compose" onSubmit={submit} noValidate>
      <button type="button" className="asp-x" onClick={() => onDone(null)} aria-label="Close">
        <Icon name="x" />
      </button>
      <Script text="Write a review" className="asp-sheet-script" />
      <p className="asp-sheet-sub">for @{handle} · it goes on the wall</p>
      <label className="asp-field">
        <span>your name or @</span>
        <input className="asp-in" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="leave blank to stay secret" data-autofocus="" />
      </label>
      <label className="asp-field">
        <span>
          your review <em>{text.trim().length}/240</em>
        </span>
        <textarea
          className="asp-in asp-ta"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (error) setError("")
          }}
          maxLength={260}
          rows={4}
          placeholder="the thing you'd never say out loud…"
          aria-invalid={error ? true : undefined}
          aria-describedby="asp-compose-err"
        />
      </label>
      <div className="asp-field" role="radiogroup" aria-label="Hearts">
        <span>hearts</span>
        <div className="asp-rate">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={hearts === n}
              aria-label={n + (n === 1 ? " heart" : " hearts")}
              className="asp-rate-btn"
              data-on={n <= hearts ? "" : undefined}
              onClick={() => setHearts(n)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                  e.preventDefault()
                  setHearts((h) => Math.min(5, h + 1))
                } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                  e.preventDefault()
                  setHearts((h) => Math.max(1, h - 1))
                }
              }}
              tabIndex={hearts === n ? 0 : -1}
            >
              <Heart />
            </button>
          ))}
        </div>
      </div>
      <div className="asp-field" role="radiogroup" aria-label="How you know them">
        <span>how you know them</span>
        <div className="asp-chips">
          {TAGS.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={tag === t} className="asp-chip" onClick={() => setTag(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <p className="asp-err" id="asp-compose-err" role="alert">
        {error}
      </p>
      <button type="submit" className="asp-btn" disabled={busy}>
        {busy ? "posting…" : "post it to the wall"}
      </button>
    </form>
  )
}

function Viewer({
  items,
  start,
  profile,
  dur,
  reduced,
  onClose,
  onReply,
}: {
  items: AspHighlight[]
  start: number
  profile: AspProfile
  dur: number
  reduced: boolean
  onClose: () => void
  onReply: (text: string, label: string) => void
}) {
  const [h, setH] = React.useState(start)
  const [s, setS] = React.useState(0)
  const [cycle, setCycle] = React.useState(0)
  const [hold, setHold] = React.useState(false)
  const [typing, setTyping] = React.useState(false)
  const [reply, setReply] = React.useState("")
  const item = items[h]
  const slides = item.slides.length ? item.slides : [item.cover || ""]
  const next = () => {
    if (s < slides.length - 1) setS(s + 1)
    else if (h < items.length - 1) {
      setH(h + 1)
      setS(0)
    } else {
      onClose()
      return
    }
    setCycle((c) => c + 1)
  }
  const prev = () => {
    if (s > 0) setS(s - 1)
    else if (h > 0) {
      setH(h - 1)
      setS(0)
    }
    setCycle((c) => c + 1)
  }
  const running = !reduced && !hold && !typing
  return (
    <div
      className="asp-viewer"
      data-paused={running ? undefined : ""}
      style={{ ["--asp-vdur" as string]: dur + "ms" } as React.CSSProperties}
      onKeyDown={(e) => {
        const t = e.target as HTMLElement
        if (t.tagName === "INPUT") return
        if (e.key === "ArrowRight") next()
        else if (e.key === "ArrowLeft") prev()
        else if (e.key === " ") {
          e.preventDefault()
          setHold((v) => !v)
        }
      }}
    >
      {slides.map((src, i) => (
        <div key={h + "-" + i} className="asp-vframe" data-on={i === s ? "" : undefined}>
          <Photo src={src} seed={h * 3 + i} eager={i === s} alt={item.label + " " + (i + 1)} />
        </div>
      ))}
      <div className="asp-vshade" aria-hidden="true" />
      <div className="asp-vbar">
        {slides.map((_, i) => (
          <span key={i} className="asp-vseg" data-s={i < s ? "done" : i === s ? "now" : "next"}>
            {i === s ? (
              <span key={cycle} className="asp-vseg-fill" data-static={reduced ? "" : undefined} onAnimationEnd={(e) => e.animationName === "asp-fill" && next()} />
            ) : (
              <span className="asp-vseg-fill" />
            )}
          </span>
        ))}
      </div>
      <div className="asp-vhead">
        <Avatar src={profile.avatar} name={profile.name} className="asp-vava" />
        <span className="asp-vwho">
          <strong>{profile.handle}</strong>
          <span>{item.label}</span>
        </span>
        <button type="button" className="asp-vbtn" onClick={() => setHold((v) => !v)} aria-label={hold ? "Play" : "Pause"} aria-pressed={hold}>
          <Icon name={hold ? "play" : "pause"} />
        </button>
        <button type="button" className="asp-vbtn" onClick={onClose} aria-label="Close" data-autofocus="">
          <Icon name="x" />
        </button>
      </div>
      <button
        type="button"
        className="asp-vtap asp-vtap-l"
        aria-label="Previous"
        onClick={prev}
        onPointerDown={() => setHold(true)}
        onPointerUp={() => setHold(false)}
        onPointerLeave={() => setHold(false)}
      />
      <button
        type="button"
        className="asp-vtap asp-vtap-r"
        aria-label="Next"
        onClick={next}
        onPointerDown={() => setHold(true)}
        onPointerUp={() => setHold(false)}
        onPointerLeave={() => setHold(false)}
      />
      <form
        className="asp-vreply"
        onSubmit={(e) => {
          e.preventDefault()
          if (!reply.trim()) return
          onReply(reply.trim(), item.label)
          setReply("")
          ;(document.activeElement as HTMLElement | null)?.blur?.()
        }}
      >
        <input
          className="asp-vin"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onFocus={() => setTyping(true)}
          onBlur={() => setTyping(false)}
          placeholder={"reply to " + profile.handle + "…"}
          aria-label={"Reply to " + profile.handle}
          maxLength={200}
        />
        <button type="submit" className="asp-vsend" aria-label="Send reply" disabled={!reply.trim()}>
          <Icon name="send" />
        </button>
      </form>
    </div>
  )
}

function Quiz({ name, title, questions, onClose, onReview }: { name: string; title: string; questions: AspQuestion[]; onClose: () => void; onReview: () => void }) {
  const [i, setI] = React.useState(0)
  const [picked, setPicked] = React.useState(-1)
  const [score, setScore] = React.useState(0)
  const done = i >= questions.length
  const q = questions[Math.min(i, questions.length - 1)]
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const pick = (k: number) => {
    if (picked >= 0) return
    setPicked(k)
    if (k === q.answer) setScore((s) => s + 1)
    timer.current = window.setTimeout(() => {
      setPicked(-1)
      setI((n) => n + 1)
    }, 1000)
  }
  return (
    <div className="asp-quiz">
      <button type="button" className="asp-x" onClick={onClose} aria-label="Close">
        <Icon name="x" />
      </button>
      <p className="asp-sheet-eyebrow">{title}</p>
      <div className="asp-qbar" aria-hidden="true">
        {questions.map((_, k) => (
          <span key={k} data-s={k < i ? "done" : k === i ? "now" : undefined} />
        ))}
      </div>
      {!done ? (
        <div key={i} className="asp-qbody">
          <p className="asp-qnum">
            question {i + 1} of {questions.length}
          </p>
          <h3 className="asp-qq">{q.q}</h3>
          <div className="asp-opts">
            {q.options.map((o, k) => (
              <button
                key={k}
                type="button"
                className="asp-opt"
                data-r={picked < 0 ? undefined : k === q.answer ? "right" : k === picked ? "wrong" : "dim"}
                onClick={() => pick(k)}
                aria-disabled={picked >= 0}
                data-autofocus={k === 0 ? "" : undefined}
              >
                <span>{o}</span>
                {picked >= 0 && k === q.answer ? <Heart className="asp-opt-heart" /> : null}
              </button>
            ))}
          </div>
          <p className="asp-live" aria-live="polite">
            {picked < 0 ? "" : picked === q.answer ? "yes! you know me" : "nope, it's " + q.options[q.answer]}
          </p>
        </div>
      ) : (
        <div className="asp-qend">
          <p className="asp-qscore">
            {score}
            <span>/{questions.length}</span>
          </p>
          <Script text={rankFor(score, questions.length).replace(/\?/g, "")} className="asp-qrank" label={rankFor(score, questions.length)} />
          <p className="asp-sheet-sub">thanks for playing with {name.split(" ")[0].toLowerCase()} ♡</p>
          <div className="asp-qacts">
            <button
              type="button"
              className="asp-btn asp-btn-ghost"
              data-autofocus=""
              onClick={() => {
                setI(0)
                setScore(0)
                setPicked(-1)
              }}
            >
              play again
            </button>
            <button type="button" className="asp-btn" onClick={onReview}>
              leave a review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- page */

export default function AquaStoryProfileTemplate({
  profile: profileProp,
  stories: storiesProp,
  note = {},
  ribbon = {},
  highlights = {},
  exchange = {},
  reviews = {},
  quiz = {},
  likes = 248,
  decorations,
  persistDecorations = true,
  palette = "aqua",
  tint = 0.35,
  storyDuration = 6000,
  height = "100svh",
  className = "",
  onNote,
  onReview,
  onLike,
  onDecorate,
}: AquaStoryProfileTemplateProps) {
  const profile = { ...DEFAULT_PROFILE, ...profileProp }
  const stories = storiesProp && storiesProp.length ? storiesProp : DEFAULT_STORIES
  const pal = resolvePalette(palette)
  const reduced = useReducedMotion()
  const n = stories.length

  /* stories */
  const [idx, setIdx] = React.useState(0)
  const [cycle, setCycle] = React.useState(0)
  const [userPaused, setUserPaused] = React.useState(false)
  const [hover, setHover] = React.useState(false)
  const [showLoc, setShowLoc] = React.useState(false)
  const [tabHidden, setTabHidden] = React.useState(false)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const stageSeen = useInView(stageRef, false, 0.2)
  const cur = stories[Math.min(idx, n - 1)]
  const upNext = stories[step(idx, 1, n)]
  const go = (i: number) => {
    setIdx(step(i, 0, n))
    setCycle((c) => c + 1)
  }
  React.useEffect(() => {
    const on = () => setTabHidden(document.hidden)
    document.addEventListener("visibilitychange", on)
    return () => document.removeEventListener("visibilitychange", on)
  }, [])

  /* overlays */
  const [composing, setComposing] = React.useState(false)
  const [viewing, setViewing] = React.useState(-1)
  const [playing, setPlaying] = React.useState(false)
  const [toast, setToast] = React.useState(null as null | { id: number; text: string })
  const toastTimer = React.useRef(0)
  const say = (text: string) => {
    window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), text })
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }
  React.useEffect(() => () => window.clearTimeout(toastTimer.current), [])


  /* note */
  const [noteText, setNoteText] = React.useState("")
  const [noteBusy, setNoteBusy] = React.useState(false)
  // typing a note holds the story; an empty, focused field does not
  const [noteFocus, setNoteFocus] = React.useState(false)
  const running = !reduced && !userPaused && !hover && !(noteFocus && noteText.trim() !== "") && stageSeen && !tabHidden && !composing && viewing < 0 && !playing && n > 1
  const [flyers, setFlyers] = React.useState([] as { id: number; text: string }[])
  const sendNote = async (text: string, context: string, fly: boolean) => {
    let ok = true
    try {
      if (onNote) {
        const r = await onNote(text, context)
        if (r === false) ok = false
      }
    } catch {
      ok = false
    }
    if (!ok) {
      say("couldn't send that, try again?")
      return false
    }
    if (fly && !reduced) setFlyers((f) => [...f, { id: Date.now() + Math.random(), text }].slice(-4))
    say((note && note.sent) || "sent to @" + profile.handle + " ♡")
    return true
  }

  /* hearts */
  const [likeCount, setLikeCount] = React.useState(likes)
  const [bursts, setBursts] = React.useState([] as { id: number; b: number; dx: number }[])
  const like = (b: number) => {
    const c = likeCount + 1
    setLikeCount(c)
    onLike?.(c)
    if (!reduced) {
      const now = Date.now()
      setBursts((list) => [...list, ...[0, 1, 2].map((k) => ({ id: now + k + Math.random(), b, dx: (k - 1) * 2.2 + (Math.random() - 0.5) * 2 }))].slice(-18))
    }
  }

  /* reviews */
  const [wall, setWall] = React.useState(() => ((reviews && reviews.items) || DEFAULT_REVIEWS).map((r, i) => ({ ...r, key: "r" + i })))
  const [fresh, setFresh] = React.useState("")
  const trackRef = React.useRef(null as HTMLDivElement | null)
  const scrollWall = (dir: number) => {
    const t = trackRef.current
    if (!t) return
    t.scrollBy({ left: dir * Math.min(t.clientWidth * 0.8, 640), behavior: reduced ? "auto" : "smooth" })
  }

  /* decorate */
  const pageRef = React.useRef(null as HTMLDivElement | null)
  const [deco, setDeco] = React.useState(false)
  const [stickers, setStickers] = React.useState(() =>
    (decorations || []).map((s, i): AspPlacedSticker => ({ kind: s.kind, x: s.x, y: s.y, size: s.size || 76, rotate: s.rotate || 0, id: s.id || "d" + i })),
  )
  const [ghost, setGhost] = React.useState(null as null | { kind: AspStickerKind; x: number; y: number })
  const drag = React.useRef(null as null | { kind?: AspStickerKind; id?: string; sx: number; sy: number; moved: boolean; ox: number; oy: number })
  const storeKey = "asp-stickers:" + profile.handle
  const loadedStore = React.useRef(false)
  React.useEffect(() => {
    if (!persistDecorations) return
    try {
      const saved = readStickers(window.localStorage.getItem(storeKey))
      if (saved.length) setStickers(saved)
    } catch {}
    loadedStore.current = true
  }, [persistDecorations, storeKey])
  const firstDeco = React.useRef(true)
  React.useEffect(() => {
    if (firstDeco.current) {
      firstDeco.current = false
      return
    }
    onDecorate?.(stickers)
    if (!persistDecorations || !loadedStore.current) return
    try {
      window.localStorage.setItem(storeKey, JSON.stringify(stickers))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stickers])

  const dropAt = (kind: AspStickerKind, clientX: number, clientY: number) => {
    const page = pageRef.current
    if (!page) return
    const r = page.getBoundingClientRect()
    const p = placeSticker((clientX - r.left) / r.width, clientY - r.top, r.height)
    setStickers((list) => [...list, { id: "s" + Date.now().toString(36) + Math.floor(Math.random() * 1e4), kind, x: p.x, y: p.y, rotate: Math.round((Math.random() - 0.5) * 30), size: 76 }].slice(-60))
  }
  const trayDown = (kind: AspStickerKind) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { kind, sx: e.clientX, sy: e.clientY, moved: false, ox: 0, oy: 0 }
  }
  const trayMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || !d.kind) return
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true
    if (d.moved) setGhost({ kind: d.kind, x: e.clientX, y: e.clientY })
  }
  const trayUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    setGhost(null)
    if (!d || !d.kind) return
    if (!d.moved) {
      dropNear(d.kind)
      return
    }
    {
      const tray = (e.currentTarget as HTMLElement).closest(".asp-tray")
      const tr = tray?.getBoundingClientRect()
      if (tr && e.clientY > tr.top - 8 && e.clientX > tr.left && e.clientX < tr.right) return
      dropAt(d.kind, e.clientX, e.clientY)
    }
  }
  // a press without a drag (or Enter) drops it somewhere near the middle of the screen
  const dropNear = (kind: AspStickerKind) =>
    dropAt(kind, window.innerWidth * (0.3 + Math.random() * 0.4), window.innerHeight * (0.3 + Math.random() * 0.3))
  const stkDown = (id: string) => (e: React.PointerEvent) => {
    if (!deco || e.button !== 0) return
    const page = pageRef.current
    const s = stickers.find((x) => x.id === id)
    if (!page || !s) return
    const r = page.getBoundingClientRect()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { id, sx: e.clientX, sy: e.clientY, moved: false, ox: s.x * r.width + r.left - e.clientX, oy: s.y + r.top - e.clientY }
  }
  const stkMove = (e: React.PointerEvent) => {
    const d = drag.current
    const page = pageRef.current
    if (!d || !d.id || !page) return
    d.moved = true
    const r = page.getBoundingClientRect()
    const p = placeSticker((e.clientX + d.ox - r.left) / r.width, e.clientY + d.oy - r.top, r.height)
    setStickers((list) => list.map((s) => (s.id === d.id ? { ...s, x: p.x, y: p.y } : s)))
  }
  const stkUp = () => {
    drag.current = null
  }
  const removeSticker = (id: string) => setStickers((list) => list.filter((s) => s.id !== id))

  const rootStyle = {
    "--asp-h": height,
    "--asp-sky": pal.sky,
    "--asp-mist": pal.mist,
    "--asp-deep": pal.deep,
    "--asp-glass": pal.glass,
    "--asp-glass-edge": pal.glassEdge,
    "--asp-ink": pal.ink,
    "--asp-paper": pal.paper,
    "--asp-paper-ink": pal.paperInk,
    "--asp-paper-muted": pal.paperMuted,
    "--asp-field": pal.field,
    "--asp-accent": pal.accent,
    "--asp-wash": pal.wash,
    "--asp-tint": String(clamp(tint, 0, 1)),
    "--asp-dur": storyDuration + "ms",
  } as React.CSSProperties

  const [d1, d2] = splitDate(cur.date)
  const ribbonDate = (ribbon && ribbon.date) || d1
  const hl = highlights ? (highlights.items && highlights.items.length ? highlights.items : DEFAULT_HIGHLIGHTS) : []
  const ex = exchange ? { ...DEFAULT_EXCHANGE, ...exchange, link: { ...DEFAULT_EXCHANGE.link, ...(exchange.link || {}) } } : null
  const questions = quiz ? (quiz.questions && quiz.questions.length ? quiz.questions : DEFAULT_QUESTIONS) : []
  const firstName = profile.name.split(" ")[0]
  const hlRef = React.useRef(null as HTMLElement | null)

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text)
      say(done)
    } catch {
      say(text)
    }
  }

  return (
    <div className={"asp-root " + className} style={rootStyle} data-deco={deco ? "" : undefined}>
      <style>{ASP_CSS}</style>

      {/* blurred street photo behind everything; sticky, so it stays put while the page scrolls */}
      <div className="asp-bg" aria-hidden="true">
        <span className="asp-bg-base" />
        {stories.map((s, i) => (
          <img
            key={i}
            className="asp-bg-img"
            src={s.image}
            alt=""
            width={1200}
            height={1100}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            data-on={i === idx ? "" : undefined}
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        ))}
        <span className="asp-bg-wash" />
        <svg className="asp-bg-zebra" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x="-200" y={520 + i * 90} width="1400" height="46" transform="rotate(-8 500 500)" fill="#fff" />
          ))}
        </svg>
      </div>

      <div className="asp-page" ref={pageRef}>
        {/* ---------------- story header ---------------- */}
        <section className="asp-hero" aria-label={profile.name + "'s stories"}>
          <span className="asp-side asp-side-l" aria-hidden="true">
            close friends only ✦ {d2 || "2026"} ✦ {(ribbon && ribbon.credit2) || "film diary"}
          </span>
          <span className="asp-side asp-side-r" aria-hidden="true">
            @{profile.handle} ✦ {cur.location || "somewhere soft"}
          </span>
          <div className="asp-col">
            <div
              className="asp-stage"
              ref={stageRef}
              data-paused={running ? undefined : ""}
              onKeyDown={(e) => {
                const t = e.target as HTMLElement
                if (t.tagName === "INPUT") return
                if (e.key === "ArrowRight") go(idx + 1)
                else if (e.key === "ArrowLeft") go(idx - 1)
              }}
            >
              <div className="asp-stage-in">
                <div className="asp-prog" role="group" aria-label="Stories">
                  {stories.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="asp-seg"
                      data-s={i < idx ? "done" : i === idx ? "now" : "next"}
                      aria-label={"Story " + (i + 1) + " of " + n + (s.date ? ", " + s.date : "")}
                      aria-current={i === idx ? "true" : undefined}
                      onClick={() => go(i)}
                    >
                      {i === idx ? (
                        <span
                          key={cycle}
                          className="asp-seg-fill"
                          data-static={reduced || n < 2 ? "" : undefined}
                          onAnimationEnd={(e) => {
                            if (e.animationName === "asp-fill") go(idx + 1)
                          }}
                        />
                      ) : (
                        <span className="asp-seg-fill" />
                      )}
                    </button>
                  ))}
                </div>

                <header className="asp-head">
                  <a className="asp-head-ava" href={profile.url || "#"} aria-label={profile.name + " on Instagram"} target={profile.url ? "_blank" : undefined} rel="noreferrer">
                    <Avatar src={profile.avatar} name={profile.name} />
                  </a>
                  <span className="asp-head-tag">{profile.tagline}</span>
                  <span className="asp-head-date" aria-live="polite">
                    {d1}
                    {d2 ? <br /> : null}
                    {d2}
                  </span>
                  <button
                    type="button"
                    className="asp-head-dots"
                    onClick={() => setUserPaused((v) => !v)}
                    aria-pressed={userPaused}
                    aria-label={userPaused ? "Play stories" : "Pause stories"}
                    title={userPaused ? "Play" : "Pause"}
                  >
                    {userPaused ? <Icon name="play" /> : <i aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    className="asp-head-pin"
                    onClick={() => setShowLoc((v) => !v)}
                    aria-expanded={showLoc}
                    aria-label={"Location" + (cur.location ? ": " + cur.location : "")}
                  >
                    <Icon name="pin" />
                  </button>
                </header>

                <div className="asp-main" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
                  {stories.map((s, i) => (
                    <div key={i} className="asp-frame" data-on={i === idx ? "" : undefined} aria-hidden={i === idx ? undefined : true}>
                      <Photo src={s.image} alt={s.alt} seed={i} eager={i < 2} />
                    </div>
                  ))}
                  <button type="button" className="asp-tap asp-tap-l" onClick={() => go(idx - 1)} aria-label="Previous story">
                    <Icon name="left" />
                  </button>
                  <button type="button" className="asp-tap asp-tap-r" onClick={() => go(idx + 1)} aria-label="Next story">
                    <Icon name="right" />
                  </button>
                  <span className="asp-loc" data-on={showLoc ? "" : undefined} aria-hidden={!showLoc}>
                    <Icon name="pin" />
                    {cur.location || "somewhere soft"}
                  </span>
                </div>

                <div className="asp-card" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
                  <a className="asp-card-name" href={profile.url || "#"} target={profile.url ? "_blank" : undefined} rel="noreferrer">
                    {profile.handle}
                  </a>
                  <Hibiscus className="asp-card-flower" />
                  <p key={idx} className="asp-card-bio">
                    {cur.caption || profile.bio}
                  </p>
                  <button type="button" className="asp-inset" onClick={() => go(idx + 1)} aria-label="Up next: skip to the next story">
                    {stories.map((s, i) => (
                      <span key={i} className="asp-frame" data-on={s === upNext ? "" : undefined}>
                        <Photo src={s.image} seed={i} />
                      </span>
                    ))}
                    <span className="asp-inset-tag">up next</span>
                  </button>
                </div>

                {note ? (
                  <form
                    className="asp-note"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const t = noteText.trim()
                      if (!t || noteBusy) return
                      setNoteBusy(true)
                      const ok = await sendNote(t, "story " + (idx + 1), true)
                      setNoteBusy(false)
                      if (ok) setNoteText("")
                    }}
                  >
                    <Avatar src={profile.avatar} name={profile.name} className="asp-note-ava" />
                    <NoteDeco className="asp-note-deco" />
                    <label className="asp-note-field" data-has={noteText.trim() ? "" : undefined}>
                      <span className="asp-sr">Send {firstName} a note</span>
                      <input
                        className="asp-note-in"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onFocus={() => setNoteFocus(true)}
                        onBlur={() => setNoteFocus(false)}
                        placeholder={note.placeholder || "say something…"}
                        maxLength={160}
                        enterKeyHint="send"
                      />
                      <button type="submit" className="asp-note-send" aria-label="Send note" disabled={!noteText.trim() || noteBusy}>
                        <Icon name="send" />
                      </button>
                    </label>
                  </form>
                ) : null}

                {flyers.map((f) => (
                  <span key={f.id} className="asp-fly" aria-hidden="true" onAnimationEnd={() => setFlyers((l) => l.filter((x) => x.id !== f.id))}>
                    {f.text}
                  </span>
                ))}

                <Twinkle className="asp-tw asp-tw-1" />
                <Twinkle className="asp-tw asp-tw-2" />
                <Twinkle className="asp-tw asp-tw-3" />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- date ribbon ---------------- */}
        {ribbon ? (
          <div className="asp-ribbon">
            <div className="asp-ribbon-in">
              <span className="asp-ribbon-date">{ribbonDate}</span>
              <span className="asp-ribbon-line" aria-hidden="true" />
              <span className="asp-ribbon-credit">
                {ribbon.credit || profile.name.split(" ")[0] + "." + (profile.name.split(" ")[1] || "")[0]}
                <br />
                {ribbon.credit2 || "film diary"}
              </span>
              <button type="button" className="asp-ribbon-act" aria-pressed={deco} onClick={() => setDeco((v) => !v)}>
                {deco ? "done decorating" : ribbon.action || "account decorate"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="asp-col asp-flow">
          {/* ---------------- highlights ---------------- */}
          {highlights && hl.length ? (
            <section className="asp-hl" ref={hlRef} aria-label="Story highlights">
              <div className="asp-sechead">
                <Script text={highlights.title || "Highlights"} className="asp-sec-script" />
                <p className="asp-eyebrow">{highlights.eyebrow || "tap one to watch"}</p>
              </div>
              <div className="asp-hl-row">
                {hl.map((h, i) => (
                  <button key={i} type="button" className="asp-hl-btn" onClick={() => setViewing(i)} aria-label={"Watch highlight: " + h.label}>
                    <span className="asp-hl-ring">
                      <span className="asp-hl-face">
                        <Photo src={h.cover || h.slides[0]} seed={i + 1} />
                      </span>
                    </span>
                    <span className="asp-hl-label">{h.label}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {/* ---------------- exchange reviews ---------------- */}
          {ex ? (
            <section className="asp-ex" aria-label={ex.title}>
              <div className="asp-ex-in">
                <span className="asp-ex-tab" aria-hidden="true">
                  ✦ {ex.tab} ✦
                </span>
                <div className="asp-ex-card">
                  <Photo src={ex.image} seed={1} />
                  <span className="asp-ex-shade" aria-hidden="true" />
                  <button type="button" className="asp-ex-plus" onClick={() => setComposing(true)} aria-label="Write a review">
                    <Icon name="plus" />
                  </button>
                  <p className="asp-ex-copy">{ex.text}</p>
                  <Script text={ex.title || "Exchange reviews"} className="asp-ex-title" />
                  <button type="button" className="asp-ex-ig" onClick={() => copy(ex.link.url || "", "link copied ♡")} aria-label={"Copy link: " + ex.link.url}>
                    <span className="asp-ex-ig-text">
                      <span className="asp-ex-ig-t">{ex.link.label}</span>
                      <span className="asp-ex-ig-u">{(ex.link.url || "").replace(/^https?:\/\//, "")}</span>
                    </span>
                    <Avatar src={ex.link.avatar} name={profile.name} className="asp-ex-ig-ava" />
                  </button>
                  <button
                    type="button"
                    className="asp-ex-foot asp-ex-foot-c"
                    onClick={() => hlRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" })}
                  >
                    {ex.footCenter}
                  </button>
                  <span className="asp-ex-foot asp-ex-foot-r">{ex.footRight}</span>
                </div>
                <button type="button" className="asp-ex-tag" onClick={() => copy("@" + profile.handle, "@" + profile.handle + " copied")}>
                  {ex.sticker}
                </button>
                <div className="asp-hearts" role="group" aria-label="Hearts">
                  {BUBBLES.map((b, i) => (
                    <button
                      key={i}
                      type="button"
                      className="asp-bub"
                      data-glass={b.glass ? "" : undefined}
                      style={{ left: b.x + "cqw", top: b.y + "cqw", width: b.s + "cqw", height: b.s + "cqw", animationDelay: -i * 0.7 + "s" } as React.CSSProperties}
                      onClick={() => like(i)}
                      aria-label="Send a heart"
                      tabIndex={i === 0 ? 0 : -1}
                    >
                      <Heart />
                    </button>
                  ))}
                  {bursts.map((p) => {
                    const b = BUBBLES[p.b]
                    return (
                      <span
                        key={p.id}
                        className="asp-burst"
                        style={{ left: b.x + b.s / 2 + p.dx + "cqw", top: b.y + b.s / 2 + "cqw" } as React.CSSProperties}
                        onAnimationEnd={() => setBursts((l) => l.filter((x) => x.id !== p.id))}
                      >
                        <Heart />
                      </span>
                    )
                  })}
                </div>
                <span className="asp-likes" aria-live="polite">
                  <Heart /> {formatCount(likeCount)}
                </span>
              </div>
            </section>
          ) : null}

          {/* ---------------- reviews wall ---------------- */}
          {reviews ? (
            <section className="asp-rev" aria-label="Friend reviews">
              <div className="asp-sechead">
                <Script text={reviews.title || "Friend reviews"} className="asp-sec-script" />
                <div className="asp-rev-nav">
                  <p className="asp-eyebrow">
                    {reviews.eyebrow || "wall of nice things"} · {wall.length}
                  </p>
                  <button type="button" className="asp-round" onClick={() => scrollWall(-1)} aria-label="Scroll reviews back">
                    <Icon name="left" />
                  </button>
                  <button type="button" className="asp-round" onClick={() => scrollWall(1)} aria-label="Scroll reviews forward">
                    <Icon name="right" />
                  </button>
                </div>
              </div>
              <div className="asp-rev-track" ref={trackRef} tabIndex={0} aria-label="Reviews, scroll sideways">
                <button type="button" className="asp-rcard asp-rcard-new" onClick={() => setComposing(true)}>
                  <span className="asp-rcard-plus">
                    <Icon name="plus" />
                  </span>
                  <span className="asp-rcard-newt">{reviews.write || "write one for " + firstName.toLowerCase()}</span>
                  <span className="asp-rcard-news">takes a minute, makes a week</span>
                </button>
                {wall.map((r, i) => (
                  <article
                    key={r.key}
                    className="asp-rcard"
                    data-new={r.key === fresh ? "" : undefined}
                    style={{ ["--r" as string]: (i % 2 ? 1.6 : -1.4) + "deg" } as React.CSSProperties}
                  >
                    <header className="asp-rcard-top">
                      <Avatar src={r.avatar} name={r.name} className="asp-rcard-ava" />
                      <span className="asp-rcard-who">
                        <strong>{r.name}</strong>
                        {r.handle && r.handle !== r.name ? <span>@{r.handle}</span> : null}
                      </span>
                    </header>
                    {r.tag ? <span className="asp-rcard-tag">{r.tag}</span> : null}
                    <p className="asp-rcard-text">{r.text}</p>
                    <footer className="asp-rcard-foot">
                      <span className="asp-rcard-hearts" aria-label={(r.hearts || 5) + " of 5 hearts"}>
                        {[1, 2, 3, 4, 5].map((k) => (
                          <Heart key={k} filled={k <= (r.hearts || 5)} />
                        ))}
                      </span>
                      <span className="asp-rcard-date">{r.date}</span>
                    </footer>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* ---------------- play with me ---------------- */}
          {quiz && questions.length ? (
            <div className="asp-play-wrap">
              <button type="button" className="asp-play" onClick={() => setPlaying(true)}>
                <Twinkle className="asp-play-tw asp-play-tw-1" />
                {quiz.button || "play with me !"}
                <Twinkle className="asp-play-tw asp-play-tw-2" />
              </button>
              <p className="asp-play-sub">how well do you know {firstName.toLowerCase()}? {questions.length} questions</p>
            </div>
          ) : null}

          <footer className="asp-foot">
            <span>© {d2 || "2026"} {profile.name}</span>
            <span>made for close friends ♡</span>
            <a href={profile.url || "#"} target={profile.url ? "_blank" : undefined} rel="noreferrer">
              @{profile.handle}
            </a>
          </footer>
        </div>

        {/* stickers live on the page, so they scroll with it */}
        <div className="asp-deco" aria-hidden={stickers.length ? undefined : true}>
          {stickers.map((s) => (
            <button
              key={s.id}
              type="button"
              className="asp-stk"
              style={{ left: s.x * 100 + "%", top: s.y + "px", ["--r" as string]: (s.rotate || 0) + "deg", ["--s" as string]: (s.size || 76) + "px" } as React.CSSProperties}
              tabIndex={deco ? 0 : -1}
              aria-label={s.kind + " sticker. Drag to move, Delete to remove"}
              onPointerDown={stkDown(s.id as string)}
              onPointerMove={stkMove}
              onPointerUp={stkUp}
              onPointerCancel={stkUp}
              onDoubleClick={() => deco && removeSticker(s.id as string)}
              onKeyDown={(e) => {
                if (!deco) return
                const page = pageRef.current
                const w = page ? page.getBoundingClientRect().width : 1000
                const mv = (dx: number, dy: number) => {
                  e.preventDefault()
                  setStickers((l) => l.map((x) => (x.id === s.id ? { ...x, x: clamp(x.x + dx / w, 0.02, 0.98), y: Math.max(24, x.y + dy) } : x)))
                }
                if (e.key === "Delete" || e.key === "Backspace") removeSticker(s.id as string)
                else if (e.key === "ArrowLeft") mv(-10, 0)
                else if (e.key === "ArrowRight") mv(10, 0)
                else if (e.key === "ArrowUp") mv(0, -10)
                else if (e.key === "ArrowDown") mv(0, 10)
                else if (e.key === "r" || e.key === "R") setStickers((l) => l.map((x) => (x.id === s.id ? { ...x, rotate: ((x.rotate || 0) + 15) % 360 } : x)))
              }}
            >
              <StickerArt kind={s.kind} />
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- overlays ---------------- */}
      {deco ? (
        <div className="asp-tray" role="toolbar" aria-label="Stickers: drag one onto the page, or press it to drop it">
          {STICKER_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className="asp-tray-btn"
              aria-label={"Add " + k + " sticker"}
              onPointerDown={trayDown(k)}
              onPointerMove={trayMove}
              onPointerUp={trayUp}
              onPointerCancel={() => {
                drag.current = null
                setGhost(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  dropNear(k)
                }
              }}
            >
              <StickerArt kind={k} />
            </button>
          ))}
          <span className="asp-tray-sep" aria-hidden="true" />
          <button type="button" className="asp-tray-txt" onClick={() => setStickers([])} disabled={!stickers.length}>
            clear
          </button>
          <button type="button" className="asp-tray-done" onClick={() => setDeco(false)}>
            done
          </button>
        </div>
      ) : null}
      {ghost ? (
        <span className="asp-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
          <StickerArt kind={ghost.kind} />
        </span>
      ) : null}

      {composing ? (
        <Modal label="Write a review" onClose={() => setComposing(false)}>
          <Composer
            handle={profile.handle}
            onReview={onReview}
            onDone={(r) => {
              setComposing(false)
              if (!r) return
              const key = "n" + Date.now()
              setWall((w) => [{ ...r, key }, ...w])
              setFresh(key)
              say("your review is on the wall ♡")
              window.setTimeout(() => {
                const t = trackRef.current
                t?.scrollTo({ left: 0, behavior: reduced ? "auto" : "smooth" })
                t?.closest("section")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" })
              }, 60)
            }}
          />
        </Modal>
      ) : null}

      {viewing >= 0 && hl[viewing] ? (
        <Modal label={"Highlight: " + hl[viewing].label} onClose={() => setViewing(-1)} bare>
          <Viewer
            items={hl}
            start={viewing}
            profile={profile}
            dur={Math.max(2500, storyDuration - 1000)}
            reduced={reduced}
            onClose={() => setViewing(-1)}
            onReply={(t, label) => sendNote(t, "highlight " + label, false)}
          />
        </Modal>
      ) : null}

      {playing ? (
        <Modal label={quiz?.title || "Play with me"} onClose={() => setPlaying(false)}>
          <Quiz
            name={profile.name}
            title={quiz?.title || "how well do you know " + firstName.toLowerCase() + "?"}
            questions={questions}
            onClose={() => setPlaying(false)}
            onReview={() => {
              setPlaying(false)
              setComposing(true)
            }}
          />
        </Modal>
      ) : null}

      <div className="asp-toast-slot" aria-live="polite" role="status">
        {toast ? (
          <span key={toast.id} className="asp-toast">
            {toast.text}
          </span>
        ) : null}
      </div>
    </div>
  )
}

const ASP_CSS = `
.asp-root{--asp-font:"Inter","Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;position:relative;isolation:isolate;overflow-x:clip;background:var(--asp-deep);color:var(--asp-ink);font-family:var(--asp-font);line-height:1.4;text-align:left;-webkit-font-smoothing:antialiased}
.asp-root :where(*,*::before,*::after){box-sizing:border-box}
.asp-root :where(button){font:inherit;color:inherit;text-transform:inherit;letter-spacing:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit;-webkit-tap-highlight-color:transparent}
.asp-root :where(input,textarea){font:inherit;color:inherit;margin:0}
.asp-root :where(h1,h2,h3,p,figure){margin:0}
.asp-root :where(a){color:inherit}
.asp-root :where(button,a,input,textarea,[tabindex]):focus-visible{outline:2px solid var(--asp-ink);outline-offset:3px}
.asp-sheet :where(button,a,input,textarea,[tabindex]):focus-visible,.asp-note :where(button,input):focus-visible,.asp-play:focus-visible,.asp-tray :where(button):focus-visible{outline-color:var(--asp-deep)}
.asp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.asp-icon{display:block;width:100%;height:100%;max-width:none;flex:none}

/* backdrop */
.asp-bg{position:sticky;top:0;height:100svh;margin-bottom:-100svh;overflow:hidden;z-index:0;pointer-events:none}
.asp-bg-base{position:absolute;inset:0;background:radial-gradient(120% 80% at 30% 20%,var(--asp-sky),var(--asp-mist) 55%,var(--asp-deep))}
.asp-bg-img{position:absolute;left:-8%;top:-8%;width:116%;height:116%;max-width:none;object-fit:cover;filter:blur(28px) saturate(1.05);opacity:0;transition:opacity 1.4s ease}
.asp-bg-img[data-on]{opacity:.9}
.asp-bg-wash{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.12),transparent 40%,rgba(0,0,0,.08)),var(--asp-wash)}
.asp-bg-zebra{position:absolute;inset:0;width:100%;height:100%;max-width:none;opacity:.1;filter:blur(3px)}

.asp-page{position:relative;z-index:1;padding:clamp(16px,2.6vw,32px) 0 40px}
.asp-col{position:relative;width:min(720px,calc(100% - 32px),calc(100svh * .86));margin:0 auto}
.asp-flow{width:min(720px,calc(100% - 32px))}

/* story header */
.asp-hero{position:relative;min-height:var(--asp-h);display:flex;flex-direction:column;justify-content:center;padding:8px 0 4px}
.asp-side{display:none}
@media (max-width:700px){.asp-hero{min-height:0;justify-content:flex-start;padding-top:4px}}
@media (min-width:1180px){
.asp-side{display:block;position:absolute;top:50%;writing-mode:vertical-rl;font-size:11px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;opacity:.75;white-space:nowrap;text-shadow:0 1px 10px rgba(0,0,0,.15)}
.asp-side-l{left:max(24px,calc(50% - 560px));transform:translateY(-50%) rotate(180deg)}
.asp-side-r{right:max(24px,calc(50% - 560px));transform:translateY(-50%)}
}
.asp-stage{position:relative;container-type:inline-size;width:100%}
.asp-stage-in{position:relative;height:95cqw}

.asp-prog{position:absolute;left:0;right:0;top:0;height:max(12px,3cqw);display:flex;gap:max(4px,.9cqw);padding:max(3px,.65cqw);border-radius:99px;background:rgba(255,255,255,.3);border:1px solid rgba(255,255,255,.65);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 6px 24px rgba(10,40,55,.12);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);z-index:5}
.asp-seg{position:relative;flex:1;border-radius:99px;overflow:hidden;background:rgba(255,255,255,.55);transition:background .2s}
.asp-seg:hover{background:rgba(255,255,255,.75)}
.asp-seg-fill{position:absolute;inset:0;border-radius:inherit;background:var(--asp-mist);transform:scaleX(0);transform-origin:left center}
.asp-seg[data-s=done] .asp-seg-fill{transform:none}
.asp-seg[data-s=now] .asp-seg-fill{animation:asp-fill var(--asp-dur) linear forwards}
.asp-seg[data-s=now] .asp-seg-fill[data-static]{animation:none;transform:none}
.asp-stage[data-paused] .asp-seg-fill{animation-play-state:paused}
@keyframes asp-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}

.asp-head{position:absolute;left:1.6cqw;right:1.4cqw;top:7.4cqw;display:flex;align-items:center;gap:3.4cqw;font-size:max(10px,1.85cqw);font-weight:700;line-height:1.08;letter-spacing:.02em;text-transform:uppercase;text-shadow:0 1px 10px rgba(10,40,55,.25);z-index:5}
.asp-head-ava{flex:none;display:block;border-radius:50%;transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.asp-head-ava:hover{transform:scale(1.06) rotate(-4deg)}
.asp-head-ava .asp-ava{width:max(34px,6.8cqw);height:max(34px,6.8cqw);border:max(2px,.36cqw) solid #fff;box-shadow:0 4px 14px rgba(10,40,55,.2)}
.asp-head-tag{max-width:15ch}
.asp-head-date{min-width:9ch}
.asp-head-dots{margin-left:auto;width:max(30px,5cqw);height:max(30px,5cqw);display:grid;place-items:center;border-radius:50%;transition:background .2s}
.asp-head-dots:hover,.asp-head-pin:hover{background:rgba(255,255,255,.2)}
.asp-head-dots i{display:block;width:max(4px,.75cqw);height:max(4px,.75cqw);border-radius:50%;background:#fff;box-shadow:max(6px,1.2cqw) 0 0 #fff;transform:translateX(calc(max(6px,1.2cqw) / -2))}
.asp-head-dots .asp-icon{width:50%;height:50%}
.asp-head-pin{width:max(30px,5cqw);height:max(30px,5cqw);display:grid;place-items:center;border-radius:50%;color:#fff;transition:background .2s}
.asp-head-pin .asp-icon{width:58%;height:58%;filter:drop-shadow(0 2px 6px rgba(10,40,55,.25))}

.asp-main{position:absolute;left:16.6%;top:21cqw;width:74.6%;height:68cqw;border:max(2px,.42cqw) solid #fff;border-radius:3.2cqw;overflow:hidden;background:var(--asp-mist);box-shadow:0 2.4cqw 6cqw rgba(10,40,55,.28);z-index:1}
.asp-frame{position:absolute;inset:0;opacity:0;transition:opacity .8s ease}
.asp-frame[data-on]{opacity:1}
.asp-main .asp-frame[data-on] .asp-photo-img{animation:asp-ken calc(var(--asp-dur) + 1.2s) ease-out both}
@keyframes asp-ken{from{transform:scale(1.07)}to{transform:scale(1)}}
.asp-tap{position:absolute;top:0;bottom:0;z-index:2;display:flex;align-items:center;color:#fff;opacity:0;transition:opacity .25s}
.asp-tap .asp-icon{width:max(26px,4.4cqw);height:max(26px,4.4cqw);padding:max(5px,.8cqw);border-radius:50%;background:rgba(255,255,255,.22);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.asp-tap-l{left:0;width:34%;justify-content:flex-start;padding-left:2cqw}
.asp-tap-r{right:0;width:66%;justify-content:flex-end;padding-right:2cqw}
.asp-main:hover .asp-tap,.asp-tap:focus-visible{opacity:1}
.asp-tap:focus-visible{outline-offset:-4px}
.asp-loc{position:absolute;right:2.4cqw;top:2.4cqw;z-index:3;display:flex;align-items:center;gap:.8cqw;padding:max(5px,.9cqw) max(10px,1.8cqw) max(5px,.9cqw) max(7px,1.2cqw);border-radius:99px;background:rgba(255,255,255,.88);color:var(--asp-paper-ink);font-size:max(11px,1.7cqw);font-weight:600;opacity:0;transform:translateY(-6px) scale(.96);transition:opacity .25s,transform .35s cubic-bezier(.2,.9,.25,1);pointer-events:none}
.asp-loc .asp-icon{width:max(13px,2cqw);height:max(13px,2cqw);color:var(--asp-accent)}
.asp-loc[data-on]{opacity:1;transform:none}

.asp-photo{position:absolute;inset:0;display:block;overflow:hidden;background:var(--asp-mist)}
.asp-still{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block}
.asp-photo-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;opacity:0;transition:opacity .6s ease}
.asp-photo-img[data-loaded]{opacity:1}
.asp-photo::after{content:"";position:absolute;inset:0;background:var(--asp-mist);mix-blend-mode:color;opacity:calc(var(--asp-tint) * .7);pointer-events:none}
.asp-photo::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(160deg,rgba(255,255,255,.18),transparent 45%);mix-blend-mode:soft-light;pointer-events:none}

.asp-card{position:absolute;left:3%;top:28.4cqw;width:40%;height:52cqw;padding:4.2cqw 3.2cqw 0;border-radius:3.2cqw;background:var(--asp-glass);border:1px solid var(--asp-glass-edge);box-shadow:0 2cqw 5.6cqw rgba(10,40,55,.24),inset 0 1px 0 rgba(255,255,255,.55);-webkit-backdrop-filter:blur(18px) saturate(1.25);backdrop-filter:blur(18px) saturate(1.25);z-index:3;text-shadow:0 1px 8px rgba(10,40,55,.22)}
.asp-card-name{display:inline-block;max-width:78%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:max(14px,3.3cqw);font-weight:700;letter-spacing:.01em;text-decoration:underline;text-decoration-thickness:max(1.5px,.3cqw);text-underline-offset:max(3px,.6cqw)}
.asp-card-flower{position:absolute;right:3cqw;top:3.4cqw;width:max(22px,5.4cqw);height:max(22px,5.4cqw);filter:drop-shadow(0 2px 6px rgba(10,40,55,.2));transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.asp-card:hover .asp-card-flower{transform:rotate(72deg) scale(1.06)}
.asp-card-bio{margin-top:2.2cqw;font-size:max(10.5px,2.05cqw);font-style:italic;font-weight:500;line-height:1.24;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden;animation:asp-up .6s cubic-bezier(.2,.8,.2,1) both}
@keyframes asp-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.asp-inset{position:absolute;left:3.2cqw;right:3.2cqw;bottom:3.2cqw;height:27.6cqw;border:max(2px,.4cqw) solid #fff;border-radius:2.6cqw;overflow:hidden;display:block;box-shadow:0 1cqw 3cqw rgba(10,40,55,.2);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.asp-inset:hover{transform:translateY(-.6cqw) rotate(-1deg)}
.asp-inset-tag{position:absolute;left:1.4cqw;bottom:1.4cqw;z-index:2;padding:max(2px,.4cqw) max(7px,1.2cqw);border-radius:99px;background:rgba(255,255,255,.85);color:var(--asp-paper-ink);font-size:max(9px,1.3cqw);font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-shadow:none}

.asp-note{position:absolute;left:58.2%;top:63.5cqw;width:39.4%;padding:5.6cqw 2.2cqw 2.4cqw;border-radius:2.6cqw;background:var(--asp-paper);color:var(--asp-paper-ink);box-shadow:0 2cqw 6cqw rgba(10,40,55,.28);z-index:4;text-align:center}
.asp-note-ava{position:absolute;left:50%;top:0;transform:translate(-50%,-55%);width:max(28px,6.2cqw);height:max(28px,6.2cqw);border:max(2px,.36cqw) solid #fff;box-shadow:0 3px 10px rgba(10,40,55,.2)}
.asp-note-deco{width:max(70px,15cqw);height:auto;aspect-ratio:5;margin:0 auto 2cqw;color:var(--asp-paper-ink)}
.asp-note-field{position:relative;display:flex;align-items:center;height:max(34px,7.2cqw);padding:0 max(4px,.8cqw) 0 max(8px,1.6cqw);border-radius:max(8px,1.5cqw);background:var(--asp-field);transition:box-shadow .2s;cursor:text}
.asp-note-field:focus-within{box-shadow:0 0 0 2px var(--asp-mist)}
.asp-note-in{flex:1;min-width:0;height:100%;text-overflow:ellipsis;border:0;background:none;outline:none;text-align:center;font-size:max(12px,1.85cqw);color:var(--asp-paper-ink)}
.asp-note-in::placeholder{color:var(--asp-paper-muted);opacity:1}
.asp-note-send{flex:none;width:0;height:max(24px,4.6cqw);border-radius:50%;display:grid;place-items:center;background:var(--asp-deep);color:#fff;opacity:0;transform:scale(.5);transition:opacity .2s,transform .3s cubic-bezier(.2,1.4,.4,1),width .25s}
.asp-note-send .asp-icon{width:60%;height:60%}
.asp-note-field[data-has] .asp-note-send{width:max(24px,4.6cqw);opacity:1;transform:none}
.asp-fly{position:absolute;left:60%;top:60cqw;max-width:36%;z-index:6;padding:max(6px,1.2cqw) max(10px,2.2cqw);border-radius:3cqw 3cqw 3cqw .6cqw;background:var(--asp-paper);color:var(--asp-paper-ink);font-size:max(12px,1.9cqw);font-weight:500;box-shadow:0 10px 30px rgba(10,40,55,.25);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;animation:asp-flyup 2.8s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes asp-flyup{0%{opacity:0;transform:translateY(2cqw) scale(.85)}12%{opacity:1;transform:translateY(0) scale(1)}70%{opacity:1}100%{opacity:0;transform:translate(-6cqw,-30cqw) rotate(-5deg) scale(.92)}}
.asp-tw{position:absolute;color:#fff;z-index:4;pointer-events:none;filter:drop-shadow(0 0 6px rgba(255,255,255,.6));animation:asp-twinkle 3.6s ease-in-out infinite}
.asp-tw-1{left:1%;top:24cqw;width:3.4cqw;height:3.4cqw}
.asp-tw-2{left:5.6%;top:21.6cqw;width:1.8cqw;height:1.8cqw;animation-delay:-1.2s}
.asp-tw-3{right:0;top:58cqw;width:2.6cqw;height:2.6cqw;animation-delay:-2.3s}
@keyframes asp-twinkle{0%,100%{opacity:.9;transform:scale(1) rotate(0)}50%{opacity:.35;transform:scale(.7) rotate(20deg)}}
@container (max-width:520px){
.asp-card{top:25.6cqw;height:60cqw;padding:3.8cqw 3cqw 0}
.asp-card-bio{-webkit-line-clamp:3;margin-top:1.6cqw}
.asp-inset{height:28cqw}
.asp-note{top:66cqw;padding-top:6.4cqw}
.asp-head-tag{max-width:13ch}
}

/* ribbon */
.asp-ribbon{position:relative;margin:clamp(20px,3vw,36px) 0 0;padding:clamp(14px,2vw,20px) 0;background:linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.2) 50%,rgba(255,255,255,.06));border-block:1px solid rgba(255,255,255,.65);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);text-shadow:0 1px 10px rgba(10,40,55,.2)}
.asp-ribbon-in{width:min(720px,calc(100% - 32px));margin:0 auto;display:grid;grid-template-columns:auto minmax(24px,1fr) auto auto;align-items:center;gap:clamp(14px,4vw,48px);font-size:clamp(11px,1.45vw,15px);font-weight:700;line-height:1.1;letter-spacing:.04em;text-transform:uppercase}
.asp-ribbon-date{white-space:nowrap}
.asp-ribbon-line{display:block;height:2px;max-width:150px;border-radius:2px;background:#fff;box-shadow:0 0 10px rgba(255,255,255,.5)}
.asp-ribbon-credit{text-align:center}
.asp-ribbon-act{position:relative;max-width:9.5ch;text-align:center;line-height:1.1}
.asp-ribbon-act::after{content:"";position:absolute;left:0;right:0;bottom:-6px;height:2px;border-radius:2px;background:#fff;transform:scaleX(0);transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.asp-ribbon-act:hover::after,.asp-ribbon-act[aria-pressed=true]::after{transform:none}

/* section heads */
.asp-sechead{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:clamp(10px,2vw,18px)}
.asp-sec-script{display:block;height:clamp(46px,7.4vw,70px);width:auto;max-width:70%;color:#fff;filter:drop-shadow(0 2px 10px rgba(10,40,55,.2));overflow:visible}
.asp-eyebrow{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding-bottom:10px;text-shadow:0 1px 8px rgba(10,40,55,.25);white-space:nowrap}

/* script ink-on */
.asp-script path{fill:currentColor;stroke:currentColor;stroke-width:1.4;stroke-dasharray:1 1;stroke-dashoffset:0}
.asp-script[data-armed] path{fill-opacity:0;stroke-dashoffset:1}
.asp-script[data-armed][data-in] path{animation:asp-ink 1.5s cubic-bezier(.45,.05,.3,1) forwards;animation-delay:calc(var(--i) * 45ms + .1s)}
@keyframes asp-ink{0%{fill-opacity:0;stroke-dashoffset:1}55%{fill-opacity:.15;stroke-dashoffset:0}100%{fill-opacity:1;stroke-dashoffset:0}}
.asp-script-font{font-family:"Allura","Great Vibes","Snell Roundhand","Apple Chancery","Segoe Script",cursive;font-weight:400;line-height:1;display:block}

/* highlights */
.asp-hl{margin-top:clamp(36px,6vw,64px)}
.asp-hl-row{display:flex;gap:clamp(14px,3.2vw,30px);overflow-x:auto;padding:6px 4px 10px;margin:0 -4px;scroll-snap-type:x mandatory;scrollbar-width:none}
.asp-hl-row::-webkit-scrollbar{display:none}
.asp-hl-btn{flex:none;width:clamp(68px,12vw,88px);display:flex;flex-direction:column;align-items:center;gap:8px;scroll-snap-align:start;border-radius:12px}
.asp-hl-ring{display:block;width:100%;aspect-ratio:1;padding:3px;border-radius:50%;background:conic-gradient(from 210deg,#fff,var(--asp-mist),#fff,var(--asp-accent),#fff);box-shadow:0 8px 22px rgba(10,40,55,.2);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.asp-hl-btn:hover .asp-hl-ring{transform:translateY(-4px) rotate(-6deg)}
.asp-hl-face{position:relative;display:block;width:100%;aspect-ratio:1;border-radius:50%;overflow:hidden;border:3px solid #fff}
.asp-hl-label{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;text-shadow:0 1px 8px rgba(10,40,55,.25)}

/* exchange */
.asp-ex{position:relative;container-type:inline-size;margin-top:clamp(40px,7vw,76px)}
.asp-ex-in{position:relative;height:52cqw}
.asp-ex-tab{position:absolute;left:28%;width:44%;top:1.2cqw;height:7cqw;padding-top:1.5cqw;border:max(2px,.42cqw) solid #fff;border-bottom:0;border-radius:5cqw 5cqw 0 0;background:var(--asp-deep);text-align:center;font-size:max(8px,1.35cqw);font-weight:700;letter-spacing:.24em;text-transform:uppercase;white-space:nowrap}
.asp-ex-card{position:absolute;left:7%;width:83%;top:6cqw;height:37cqw;border:max(2px,.45cqw) solid #fff;border-radius:3.4cqw;overflow:hidden;box-shadow:0 2.4cqw 6cqw rgba(10,40,55,.28);z-index:1}
.asp-ex-shade{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(10,40,55,.08),rgba(10,40,55,.3)),radial-gradient(70% 60% at 45% 62%,rgba(10,40,55,.18),transparent)}
.asp-ex-card>:not(.asp-photo):not(.asp-ex-shade){z-index:2}
.asp-ex-plus{position:absolute;left:5%;top:10%;width:max(26px,4.4cqw);height:max(26px,4.4cqw);padding:max(4px,.7cqw);border:max(1.5px,.32cqw) solid #fff;border-radius:50%;transition:transform .3s cubic-bezier(.2,1.4,.4,1),background .2s}
.asp-ex-plus:hover{transform:rotate(90deg) scale(1.08);background:rgba(255,255,255,.2)}
.asp-ex-copy{position:absolute;left:4.6%;top:27%;max-width:27%;font-size:max(10px,1.85cqw);line-height:1.18;font-weight:500;text-shadow:0 1px 8px rgba(10,40,55,.4)}
.asp-ex-title{position:absolute;left:15%;top:42%;width:64%;height:auto;color:#fff;overflow:visible;filter:drop-shadow(0 2px 12px rgba(10,40,55,.35));pointer-events:none}
.asp-ex-ig{position:absolute;right:9%;top:12%;width:42%;display:flex;align-items:center;gap:1.4cqw;padding:max(4px,1cqw) max(4px,1cqw) max(4px,1cqw) max(10px,2.4cqw);border-radius:99px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.75);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);text-shadow:0 1px 6px rgba(10,40,55,.3);transition:background .2s,transform .3s cubic-bezier(.2,.8,.2,1)}
.asp-ex-ig:hover{background:rgba(255,255,255,.32);transform:translateY(-2px)}
.asp-ex-ig-text{flex:1;min-width:0;display:flex;flex-direction:column}
.asp-ex-ig-t{font-size:max(9px,1.7cqw);font-weight:700;letter-spacing:.02em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.asp-ex-ig-u{font-size:max(8px,1.2cqw);opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.asp-ex-ig-ava{width:max(24px,5cqw);height:max(24px,5cqw);border:max(1.5px,.3cqw) solid #fff}
.asp-ex-foot{position:absolute;bottom:5.5%;font-size:max(9px,1.45cqw);font-weight:500;line-height:1.15;text-shadow:0 1px 6px rgba(10,40,55,.4)}
.asp-ex-foot-c{left:41%;text-decoration:underline;text-underline-offset:2px;text-decoration-color:rgba(255,255,255,.6)}
.asp-ex-foot-r{right:4%;max-width:17%;text-align:center}
.asp-ex-tag{position:absolute;left:.6%;top:35.5cqw;z-index:3;padding:max(5px,1cqw) max(12px,2.6cqw);border-radius:99px;background:var(--asp-paper);color:var(--asp-deep);border:max(1.5px,.34cqw) solid var(--asp-deep);font-size:max(11px,2.3cqw);font-weight:600;white-space:nowrap;transform:rotate(14deg);box-shadow:0 8px 20px rgba(10,40,55,.25);transition:transform .35s cubic-bezier(.2,1.3,.4,1)}
.asp-ex-tag:hover{transform:rotate(7deg) translateY(-.8cqw) scale(1.05)}
.asp-ex-tag:focus-visible{outline-color:var(--asp-paper)}
.asp-hearts{position:absolute;inset:0;pointer-events:none;z-index:4}
.asp-bub{position:absolute;pointer-events:auto;display:grid;place-items:center;border-radius:50%;background:var(--asp-paper);color:var(--asp-accent);box-shadow:0 6px 18px rgba(10,40,55,.18);animation:asp-bob 5.5s ease-in-out infinite;transition:transform .25s cubic-bezier(.2,1.4,.4,1)}
.asp-bub .asp-icon{width:58%;height:58%}
.asp-bub[data-glass]{background:rgba(255,255,255,.28);border:1px solid rgba(255,255,255,.8);color:#fff;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.asp-bub:hover{scale:1.1}
.asp-bub:active{scale:.9}
@keyframes asp-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-.9cqw)}}
.asp-burst{position:absolute;width:max(16px,2.8cqw);height:max(16px,2.8cqw);margin:calc(max(16px,2.8cqw) / -2) 0 0 calc(max(16px,2.8cqw) / -2);color:var(--asp-paper);filter:drop-shadow(0 2px 6px rgba(10,40,55,.3));animation:asp-burst 1.3s cubic-bezier(.2,.7,.3,1) forwards;pointer-events:none}
@keyframes asp-burst{0%{opacity:0;transform:translateY(0) scale(.4)}15%{opacity:1;transform:translateY(-2cqw) scale(1.1)}100%{opacity:0;transform:translateY(-16cqw) scale(.8) rotate(-14deg)}}
@container (max-width:520px){
.asp-ex-copy,.asp-ex-foot-r{display:none}
.asp-ex-title{left:10%;width:74%;top:44%}
.asp-ex-ig{width:50%;right:6%}
.asp-ex-foot-c{left:0;right:0;text-align:center}
}
.asp-likes{position:absolute;right:1%;top:45cqw;display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.6);font-size:max(11px,1.6cqw);font-weight:700;letter-spacing:.02em;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);z-index:4}
.asp-likes .asp-icon{width:1.05em;height:1.05em}

/* reviews */
.asp-rev{margin-top:clamp(28px,5vw,56px)}
.asp-rev-nav{display:flex;align-items:center;gap:8px}
.asp-rev-nav .asp-eyebrow{padding:0 6px 0 0}
@media (max-width:560px){.asp-round{display:none}}
.asp-round{width:40px;height:40px;padding:11px;border-radius:50%;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.7);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:background .2s,transform .2s}
.asp-round:hover{background:rgba(255,255,255,.36)}
.asp-round:active{transform:scale(.92)}
.asp-rev-track{display:flex;gap:18px;overflow-x:auto;--asp-gut:max(16px,calc(50vw - 360px));padding:16px var(--asp-gut) 30px;margin:0 calc(50% - 50vw);scroll-snap-type:x mandatory;scroll-padding-inline:var(--asp-gut);scrollbar-width:none;outline-offset:-4px}
.asp-rev-track::-webkit-scrollbar{display:none}
.asp-rcard{flex:none;width:min(300px,76vw);scroll-snap-align:start;position:relative;display:flex;flex-direction:column;padding:20px 20px 16px;border-radius:24px;background:var(--asp-glass);border:1px solid var(--asp-glass-edge);box-shadow:0 14px 34px rgba(10,40,55,.2),inset 0 1px 0 rgba(255,255,255,.5);-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2);transform:rotate(var(--r,0deg));transition:transform .45s cubic-bezier(.2,.8,.2,1);text-shadow:0 1px 8px rgba(10,40,55,.2)}
.asp-rcard:hover{transform:rotate(0) translateY(-5px)}
.asp-rcard[data-new]{animation:asp-pop .8s cubic-bezier(.2,1.3,.4,1) both}
@keyframes asp-pop{from{opacity:0;transform:translateY(24px) scale(.9) rotate(-6deg)}}
.asp-rcard-top{display:flex;align-items:center;gap:10px}
.asp-rcard-ava{width:42px;height:42px;border:2px solid #fff}
.asp-rcard-who{display:flex;flex-direction:column;min-width:0;line-height:1.2}
.asp-rcard-who strong{font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.asp-rcard-who span{font-size:12px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.asp-rcard-tag{align-self:flex-start;margin-top:12px;padding:3px 10px;border-radius:99px;border:1px solid rgba(255,255,255,.7);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.asp-rcard-text{flex:1;margin:12px 0 16px;font-size:15px;font-style:italic;line-height:1.42}
.asp-rcard-foot{display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid rgba(255,255,255,.4)}
.asp-rcard-hearts{display:flex;gap:3px}
.asp-rcard-hearts .asp-icon{width:16px;height:16px}
.asp-rcard-date{font-size:11px;font-weight:700;letter-spacing:.14em}
.asp-rcard-new{align-items:center;justify-content:center;gap:8px;text-align:center;min-height:240px;background:rgba(255,255,255,.1);border:1.5px dashed rgba(255,255,255,.8);box-shadow:none}
.asp-rcard-new:hover{background:rgba(255,255,255,.18)}
.asp-rcard-plus{width:52px;height:52px;padding:14px;margin-bottom:6px;border-radius:50%;background:var(--asp-paper);color:var(--asp-deep);box-shadow:0 8px 20px rgba(10,40,55,.2);transition:transform .35s cubic-bezier(.2,1.4,.4,1)}
.asp-rcard-new:hover .asp-rcard-plus{transform:rotate(90deg)}
.asp-rcard-newt{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.asp-rcard-news{font-size:13px;font-style:italic;opacity:.9}

/* play */
.asp-play-wrap{display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:clamp(20px,4vw,40px)}
.asp-play{position:relative;display:flex;align-items:center;gap:12px;padding:16px clamp(36px,8vw,64px);border-radius:99px;background:var(--asp-paper);color:var(--asp-deep);border:2.5px solid var(--asp-deep);font-size:clamp(13px,1.6vw,16px);font-weight:700;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 0 0 5px rgba(255,255,255,.3),0 14px 34px rgba(10,40,55,.28);transition:transform .3s cubic-bezier(.2,1.3,.4,1),box-shadow .3s}
.asp-play:hover{transform:translateY(-3px) rotate(-1.5deg);box-shadow:0 0 0 7px rgba(255,255,255,.35),0 18px 40px rgba(10,40,55,.3)}
.asp-play:active{transform:scale(.97)}
.asp-play-tw{width:14px;height:14px;color:var(--asp-accent);transition:transform .5s cubic-bezier(.2,1.3,.4,1)}
.asp-play:hover .asp-play-tw-1{transform:rotate(-90deg) scale(1.3)}
.asp-play:hover .asp-play-tw-2{transform:rotate(90deg) scale(1.3)}
.asp-play-sub{font-size:13px;font-style:italic;text-shadow:0 1px 8px rgba(10,40,55,.3)}

.asp-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px 20px;margin-top:clamp(44px,7vw,72px);padding-top:18px;border-top:1px solid rgba(255,255,255,.45);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;text-shadow:0 1px 8px rgba(10,40,55,.3)}
.asp-foot a{text-decoration:none}
.asp-foot a:hover{text-decoration:underline;text-underline-offset:3px}

/* avatars */
.asp-ava{position:relative;display:block;flex:none;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,var(--asp-sky),var(--asp-mist))}
.asp-ava-init{position:absolute;inset:0;display:grid;place-items:center;color:var(--asp-deep);font-size:12px;font-weight:700;letter-spacing:.02em;text-shadow:none}
.asp-ava-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block}

/* stickers */
.asp-deco{position:absolute;inset:0;z-index:20;pointer-events:none}
.asp-stk{position:absolute;width:var(--s);height:var(--s);transform:translate(-50%,-50%) rotate(var(--r));pointer-events:none;touch-action:none;border-radius:16px;transition:filter .2s}
.asp-root[data-deco] .asp-stk{pointer-events:auto;cursor:grab}
.asp-root[data-deco] .asp-stk:active{cursor:grabbing;filter:brightness(1.04)}
.asp-root[data-deco] .asp-stk:hover{filter:drop-shadow(0 0 0 #fff) brightness(1.05)}
.asp-stk-svg{display:block;width:100%;height:100%;max-width:none;overflow:visible;filter:drop-shadow(0 6px 10px rgba(10,30,40,.28))}
.asp-stk-cut *{fill:#fff !important;stroke:#fff !important;stroke-width:9px;stroke-linejoin:round}
.asp-root[data-deco] .asp-col{outline:1.5px dashed rgba(255,255,255,.55);outline-offset:14px;border-radius:14px}
.asp-tray{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));z-index:90;display:flex;align-items:center;gap:4px;max-width:calc(100vw - 24px);overflow-x:auto;padding:8px;border-radius:24px;background:rgba(255,255,255,.82);color:var(--asp-paper-ink);box-shadow:0 18px 50px rgba(10,40,55,.3);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);transform:translateX(-50%);animation:asp-tray .4s cubic-bezier(.2,.9,.25,1) both;scrollbar-width:none}
@keyframes asp-tray{from{opacity:0;transform:translate(-50%,20px)}}
.asp-tray-btn{flex:none;width:52px;height:52px;padding:6px;border-radius:14px;touch-action:none;transition:background .2s,transform .25s cubic-bezier(.2,1.4,.4,1)}
.asp-tray-btn:hover{background:var(--asp-field);transform:translateY(-3px) rotate(-6deg)}
.asp-tray-sep{flex:none;width:1px;height:30px;margin:0 6px;background:rgba(0,0,0,.12)}
.asp-tray-txt{flex:none;padding:10px 12px;border-radius:12px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.asp-tray-txt:disabled{opacity:.35;cursor:default}
.asp-tray-done{flex:none;padding:10px 16px;border-radius:14px;background:var(--asp-deep);color:#fff;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.asp-ghost{position:fixed;z-index:95;width:84px;height:84px;margin:-42px 0 0 -42px;pointer-events:none;transform:rotate(-8deg) scale(1.08)}

/* dialogs */
.asp-modal{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:16px;background:rgba(8,24,32,.5);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);animation:asp-fade .25s ease both}
@keyframes asp-fade{from{opacity:0}}
.asp-sheet{position:relative;width:min(440px,100%);max-height:calc(100svh - 32px);overflow:auto;padding:30px 24px 24px;border-radius:28px;background:var(--asp-paper);color:var(--asp-paper-ink);box-shadow:0 30px 80px rgba(8,24,32,.4);animation:asp-rise .4s cubic-bezier(.2,.9,.25,1) both;outline:none}
.asp-modal-bare{outline:none;max-width:100%;animation:asp-rise .4s cubic-bezier(.2,.9,.25,1) both}
@keyframes asp-rise{from{opacity:0;transform:translateY(18px) scale(.97)}}
.asp-x{position:absolute;right:14px;top:14px;width:36px;height:36px;padding:9px;border-radius:50%;background:var(--asp-field);z-index:3;transition:transform .25s}
.asp-x:hover{transform:rotate(90deg)}
.asp-sheet-script{display:block;height:56px;width:auto;max-width:86%;color:var(--asp-deep);margin-left:-6px;overflow:visible}
.asp-sheet-sub{margin-top:4px;font-size:13px;color:var(--asp-paper-muted)}
.asp-sheet-eyebrow{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--asp-paper-muted);padding-right:40px}
.asp-field{display:block;margin-top:16px}
.asp-field>span{display:flex;justify-content:space-between;margin-bottom:6px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--asp-paper-muted)}
.asp-field>span em{font-style:normal;letter-spacing:.04em}
.asp-in{display:block;width:100%;padding:12px 14px;border:1.5px solid transparent;border-radius:14px;background:var(--asp-field);font-size:15px;color:var(--asp-paper-ink);outline:none;transition:border-color .2s,background .2s}
.asp-in:focus{border-color:var(--asp-mist);background:var(--asp-paper)}
.asp-in::placeholder{color:var(--asp-paper-muted);opacity:.8}
.asp-in[aria-invalid=true]{border-color:#d9667f}
.asp-ta{resize:vertical;min-height:96px;line-height:1.45}
.asp-rate{display:flex;gap:6px}
.asp-rate-btn{width:36px;height:36px;padding:6px;border-radius:10px;color:var(--asp-field);transition:color .2s,transform .25s cubic-bezier(.2,1.4,.4,1)}
.asp-rate-btn[data-on]{color:var(--asp-accent)}
.asp-rate-btn:hover{transform:scale(1.15)}
.asp-rate-btn .asp-icon{stroke:var(--asp-accent);stroke-width:1.2}
.asp-chips{display:flex;flex-wrap:wrap;gap:8px}
.asp-chip{padding:8px 12px;border-radius:99px;background:var(--asp-field);font-size:13px;font-weight:500;transition:background .2s,color .2s}
.asp-chip[aria-checked=true]{background:var(--asp-deep);color:#fff}
.asp-err{min-height:20px;margin-top:10px;font-size:13px;color:#c2445f}
.asp-btn{display:block;width:100%;margin-top:6px;padding:14px 18px;border-radius:16px;background:var(--asp-deep);color:#fff;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-align:center;transition:transform .2s,opacity .2s}
.asp-btn:hover{transform:translateY(-1px)}
.asp-btn:disabled{opacity:.6;cursor:progress}
.asp-btn-ghost{background:var(--asp-field);color:var(--asp-paper-ink)}

/* quiz */
.asp-qbar{display:flex;gap:6px;margin-top:14px}
.asp-qbar span{flex:1;height:4px;border-radius:4px;background:var(--asp-field);transition:background .3s}
.asp-qbar span[data-s=done]{background:var(--asp-accent)}
.asp-qbar span[data-s=now]{background:var(--asp-mist)}
.asp-qbody{animation:asp-up .4s cubic-bezier(.2,.8,.2,1) both}
.asp-qnum{margin-top:22px;font-size:12px;font-style:italic;color:var(--asp-paper-muted)}
.asp-qq{margin-top:4px;font-size:24px;font-weight:700;line-height:1.2;letter-spacing:-.01em}
.asp-opts{display:flex;flex-direction:column;gap:10px;margin-top:18px}
.asp-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:14px 16px;border-radius:16px;background:var(--asp-field);font-size:15px;font-weight:500;transition:background .25s,color .25s,transform .2s,opacity .25s}
.asp-opt:hover{transform:translateX(3px)}
.asp-opt[data-r=right]{background:var(--asp-accent);color:#fff}
.asp-opt[data-r=wrong]{background:#f6dde3;color:#9b2f4a;animation:asp-shake .4s}
.asp-opt[data-r=dim]{opacity:.45}
.asp-opt-heart{width:18px;height:18px;animation:asp-pop .5s cubic-bezier(.2,1.4,.4,1) both}
@keyframes asp-shake{20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.asp-live{min-height:20px;margin-top:12px;font-size:13px;font-style:italic;color:var(--asp-paper-muted)}
.asp-qend{text-align:center;padding-top:10px;animation:asp-up .4s both}
.asp-qscore{font-size:72px;font-weight:800;line-height:1;letter-spacing:-.04em;color:var(--asp-deep)}
.asp-qscore span{font-size:28px;color:var(--asp-paper-muted)}
.asp-qrank{display:block;height:52px;width:auto;max-width:100%;margin:6px auto 0;color:var(--asp-accent);overflow:visible}
.asp-qacts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}

/* highlight viewer */
.asp-viewer{position:relative;height:min(86svh,780px);aspect-ratio:9/16;max-width:calc(100vw - 32px);border-radius:24px;overflow:hidden;background:var(--asp-deep);box-shadow:0 30px 90px rgba(0,0,0,.5);color:#fff}
.asp-vframe{position:absolute;inset:0;opacity:0;transition:opacity .45s ease}
.asp-vframe[data-on]{opacity:1}
.asp-vframe[data-on] .asp-photo-img{animation:asp-ken calc(var(--asp-vdur) + 1s) ease-out both}
.asp-vshade{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.4),transparent 22%,transparent 72%,rgba(0,0,0,.45))}
.asp-vbar{position:absolute;left:12px;right:12px;top:12px;z-index:3;display:flex;gap:4px}
.asp-vseg{position:relative;flex:1;height:3px;border-radius:3px;overflow:hidden;background:rgba(255,255,255,.4)}
.asp-vseg[data-s=done] .asp-vseg-fill{transform:none}
.asp-vseg[data-s=now] .asp-vseg-fill{animation:asp-fill var(--asp-vdur) linear forwards}
.asp-vseg[data-s=now] .asp-vseg-fill[data-static]{animation:none;transform:none}
.asp-viewer[data-paused] .asp-vseg-fill{animation-play-state:paused}
.asp-vseg-fill{position:absolute;inset:0;background:#fff;transform:scaleX(0);transform-origin:left center}
.asp-vhead{position:absolute;left:12px;right:8px;top:26px;z-index:4;display:flex;align-items:center;gap:10px}
.asp-vava{width:34px;height:34px;border:2px solid #fff}
.asp-vwho{flex:1;display:flex;flex-direction:column;line-height:1.2;font-size:13px;text-shadow:0 1px 6px rgba(0,0,0,.3)}
.asp-vwho span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.9}
.asp-vbtn{width:36px;height:36px;padding:9px;border-radius:50%;transition:background .2s}
.asp-vbtn:hover{background:rgba(255,255,255,.18)}
.asp-vtap{position:absolute;top:80px;bottom:76px;z-index:2}
.asp-vtap-l{left:0;width:34%}
.asp-vtap-r{right:0;width:66%}
.asp-vtap:focus-visible{outline-offset:-6px}
.asp-vreply{position:absolute;left:12px;right:12px;bottom:14px;z-index:4;display:flex;align-items:center;gap:8px}
.asp-vin{flex:1;min-width:0;height:44px;padding:0 18px;border-radius:99px;border:1.5px solid rgba(255,255,255,.75);background:rgba(255,255,255,.08);color:#fff;font-size:14px;outline:none;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.asp-vin::placeholder{color:rgba(255,255,255,.85)}
.asp-vin:focus{background:rgba(255,255,255,.18)}
.asp-vsend{width:44px;height:44px;padding:12px;border-radius:50%;background:#fff;color:var(--asp-deep);transition:opacity .2s,transform .2s}
.asp-vsend:disabled{opacity:.4}

/* toast */
.asp-toast-slot{position:fixed;left:0;right:0;bottom:24px;z-index:120;display:flex;justify-content:center;pointer-events:none}
.asp-root[data-deco] .asp-toast-slot{bottom:100px}
.asp-toast{padding:11px 20px;border-radius:99px;background:var(--asp-paper);color:var(--asp-paper-ink);font-size:13px;font-weight:600;box-shadow:0 14px 40px rgba(10,40,55,.3);animation:asp-toast 2.4s cubic-bezier(.2,.9,.25,1) both}
@keyframes asp-toast{0%{opacity:0;transform:translateY(14px) scale(.96)}10%{opacity:1;transform:none}85%{opacity:1;transform:none}100%{opacity:0;transform:translateY(6px)}}

@media (prefers-reduced-motion:reduce){
.asp-root *,.asp-root *::before,.asp-root *::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;animation-delay:0s !important;transition-duration:.001ms !important}
}
`

// #region glyphs
const SCRIPT_ASC = 320
const SCRIPT_DESC = -180
const SCRIPT_GLYPHS: { [ch: string]: [number, string] } = {
  "a": [181, "M128 4l0 0q-7 0-13-3-6-3-9-12l0 0q-1-4-1-10l0 0q0-9 3-20 2-11 5-18l0 0q-2 1-8 7-5 6-13 15-8 8-17 17-9 8-19 14-10 6-20 6l0 0q-6 0-14-4-7-4-11-10l0 0q-6-8-6-16l0 0q0-11 7-23 8-11 19-22 12-11 26-20 13-9 25-16 12-6 20-8l0 0q8-2 18-2l0 0q6 0 12 1 6 2 10 5l0 0q3 1 5 4 2 3 2 6l0 0q0 3-3 2l0 0q-3-5-9-6-5-1-11-1l0 0q-16 0-35 10-19 10-34 24l0 0q-5 4-13 14-8 10-15 22-7 11-7 21l0 0q0 5 3 9l0 0q1 3 5 3l0 0q6 0 15-6 9-6 19-15 10-8 19-16 8-8 11-12l0 0q2-2 8-8 6-6 13-14 7-7 12-12 5-5 7-5l0 0q2 0 7 1 4 1 7 3 4 2 2 5l0 0q-11 15-17 32-6 16-7 26l0 0q-1 2-1 3 0 1 0 3l0 0q0 16 11 16l0 0q6 0 16-7 10-7 21-17 10-10 19-20 8-9 12-14l0 0q1-1 2-1l0 0q2 0 3 1 1 2 0 4l0 0q-5 7-13 17-8 10-19 20-10 10-20 17l0 0q-5 4-13 7-8 3-16 3z"],
  "b": [153, "M32 11l0 0q-4 0-9-1-6 0-10-2-4-1-4-2l0 0q0 0 4-1 4-1 13-1l0 0q10 0 22-5 12-5 23-11 11-7 18-12l0 0q12-9 25-23 13-14 18-30l0 0q1-3 2-8 1-5 1-9l0 0q0-5-1-8-2-3-6-3l0 0q-8 0-17 5-9 4-16 10-8 6-14 11l0 0q-5 3-11 11-7 7-14 16-6 8-10 17-4 9-3 15l0 0q1 2-1 7-2 5-6 5l0 0q-4 0-9-7l0 0q-3-3-3-13l0 0q0-10 2-20 2-11 4-18l0 0q-4 5-7 10-3 6-12 16l0 0q-2 2-4 2l0 0q-3 0-3-4l0 0q0-2 2-4l0 0q14-18 24-31 10-13 12-19l0 0q4-8 9-21 5-13 12-28 7-15 14-30 7-14 14-24l0 0q6-9 14-19 8-9 18-15 10-7 22-7l0 0q4 0 9 2l0 0q1 0 2 0l0 0 4 2q1 0 2 0 0 0 0 0l0 0q12 7 12 19l0 0q0 10-7 22l0 0q-5 11-18 26-13 14-29 29-16 15-33 29-17 14-31 23l0 0q-4 8-7 18-3 10-5 20l0 0q8-12 18-23 10-11 17-17l0 0q13-10 24-17 12-6 22-6l0 0q5 0 12 3 7 4 13 9 6 5 6 10l0 0q0 1 1 2 0 1 0 3l0 0q0 10-6 22-6 11-15 21-9 10-19 18-10 8-17 13l0 0q-16 10-33 17-17 6-35 6zm28-115l0 0q19-12 37-28 19-16 34-34 16-18 26-34l0 0q6-10 6-19l0 0q0-4-2-7-2-3-6-3l0 0q-3 0-6 1-4 2-9 6l0 0q-16 13-31 32-14 19-26 41-12 23-23 45z"],
  "c": [125, "M63 4l0 0q-7 2-14 2l0 0q-18 0-29-9-12-8-12-24l0 0q0-10 6-23l0 0q4-10 14-22 11-12 26-23 14-11 29-19 15-7 27-7l0 0q4 0 8 1l0 0q4 2 7 4 3 3 3 9l0 0q0 1 0 2 0 1 0 3l0 0q0 1-2 5-2 4-4 7-2 3-4 2l0 0q-2-2-2-4l0 0q0-2 1-4 1-3 1-5l0 0q0-3-1-5-1-3-5-3l0 0q-7 0-19 7-12 7-25 18-12 12-22 25-10 14-14 27l0 0q-2 4-2 7 0 3 0 5l0 0q0 9 5 13 6 4 15 4l0 0q9 0 18-3l0 0q28-8 45-22 17-14 34-36l0 0q1-2 3-2 1 1 2 1l0 0q1 0 1 2l0 0q0 1-1 2 0 1 0 2l0 0q-18 23-38 41-21 17-51 22z"],
  "d": [150, "M123 44l0 0q-10-2-15-10-4-9-4-21l0 0q0-15 4-32 4-17 10-33 6-15 9-23l0 0q-9 11-21 24-12 13-25 24-13 12-24 19-12 8-21 8l0 0q-6 0-14-4-7-4-11-10l0 0q-6-8-6-16l0 0q0-11 7-23 8-11 19-22 12-11 26-20 13-9 25-16 12-6 20-8l0 0q4-1 8-1 5-1 10-1l0 0q6 0 12 1 6 2 10 5l0 0 1 1q10-22 21-45 12-22 25-41 13-19 28-30 15-12 31-12l0 0q2 0 4 1 2 0 4 0l0 0q10 2 14 7 4 5 4 12l0 0q0 5-2 10-2 6-5 11l0 0q-9 15-23 31-14 15-31 29-17 14-33 27-17 14-30 25l0 0q-6 14-12 33-6 19-10 32l0 0q-3 10-4 18-2 8-2 16l0 0q0 13 5 21l0 0q4 7 10 7l0 0q5 0 8-4l0 0q2 0 3-2 2-1 4-2l0 0q2-1 4-1l0 0q2 0 0 4l0 0q-1 1-3 3-1 2-3 4l0 0q-3 2-9 3-5 1-11 1l0 0q-2 0-3 0-2 0-4 0zm39-156l0 0q16-10 34-27 19-16 36-34 16-19 25-36l0 0q5-9 5-15l0 0q0-7-6-7l0 0q-6 0-15 7l0 0q-27 20-45 49-18 29-34 63zm-137 102l0 0q2 2 5 2l0 0q6 0 14-5 8-5 11-8l0 0q21-16 41-35 21-19 39-38l0 0q1-4 3-7 1-4 2-7l0 0q-6-2-14-2l0 0q-16 0-35 10-19 10-34 24l0 0q-5 4-13 14-8 10-15 22-7 11-7 21l0 0q0 5 3 9z"],
  "e": [128, "M52 6l0 0q-18 0-31-8-13-9-13-26l0 0q0-9 6-22l0 0q4-10 14-22 11-12 26-23 14-11 29-19 15-7 27-7l0 0q4 0 8 1l0 0q6 2 9 8 3 5 3 10l0 0q0 6-2 10-2 5-4 9l0 0q-7 11-21 19-13 8-27 13-14 5-22 6l0 0-1 0q-5 0-5-3l0 0q0-2 3-2l0 0q9-1 24-9 15-9 26-17l0 0q5-4 11-12 7-7 7-14l0 0q0-7-7-7l0 0q-4 0-7 2-4 1-7 2l0 0q-11 6-25 18-14 11-26 26-11 15-15 29l0 0q-2 4-2 7 0 3 0 5l0 0q0 10 6 14 6 4 15 4l0 0q13 0 27-6 14-6 27-15 13-9 24-20 11-10 19-20l0 0q1-2 3-2 1 0 2 1l0 0q1 0 1 2 0 2 0 3l0 0q-12 16-27 31-16 14-35 24-19 10-40 10z"],
  "f": [114, "M-28 136l0 0q-4 0-4-2l0 0q0-2 1-4l0 0q1-3 7-16 6-14 14-34 8-21 18-45 9-23 18-47 10-23 17-42l0 0q-7 1-13 1-5 1-8 1l0 0q-3 0-7-3-3-2-3-6l0 0q0-4 4-6 5-3 11-4 6-2 9-2l0 0q4 0 6 3 2 4 5 4l0 0 1 0q4-12 7-19 3-7 4-11l0 0q3-8 9-21 6-13 12-28 7-15 15-30 7-14 13-24l0 0q6-9 15-19 8-9 18-15 9-7 21-7l0 0q4 0 9 1 4 1 8 3l0 0q12 7 12 20l0 0q0 5-2 11-1 7-5 13l0 0q-5 12-17 28-11 16-27 33-15 17-32 33-16 16-31 28l0 0q10 0 21-1 11-1 22-1l0 0q2 0 5 0 3 1 3 2l0 0q0 1-1 2-2 1-7 2l0 0q-4 1-13 3-10 2-22 3-13 2-25 4l0 0q-6 14-13 34-8 20-15 40-8 20-14 36l0 0q-4 14-6 20-1 7-1 10l0 0 0 3q0 1 0 3 0 2-1 4l0 0q-8 19-10 25-2 7-7 10l0 0q-3 1-10 4-7 3-11 3zm93-205l0 0q15-11 31-27 15-16 30-34 15-18 27-36 12-18 20-31l0 0q7-11 7-21l0 0q0-11-8-11l0 0q-6 0-15 7l0 0q-7 6-18 19-11 13-21 28-10 16-18 30l0 0q-8 17-16 32-7 16-11 26-5 10-5 12l0 0q-2 3-3 6z"],
  "g": [166, "M-1 147l0 0q-5-1-8-3l0 0q-8-4-11-9-3-5-3-10l0 0q0-9 6-20 6-11 16-22l0 0q10-12 26-24 15-13 32-24 17-11 29-20l0 0q14-28 25-54 11-25 15-39l0 0q-8 10-18 21-9 11-14 17l0 0q-7 8-17 17-9 9-20 16-11 7-21 7l0 0q-6 0-13-4-7-4-12-10l0 0q-6-8-6-16l0 0q0-11 8-23 7-11 19-22 12-11 25-20 13-9 26-16 12-6 19-8l0 0q8-2 18-2l0 0q5 0 12 1 6 2 12 5 5 4 5 10l0 0q0 3-3 2l0 0q-3-5-8-6-6-1-11-1l0 0q-16 0-35 10-20 10-35 24l0 0q-5 4-13 14-8 10-15 22-7 11-7 21l0 0q0 5 3 9l0 0q1 2 5 2l0 0q8 0 19-7 11-7 23-17 12-10 24-22 12-12 21-22 9-10 14-15l0 0q1-2 3-3 2-1 4-1l0 0q6 0 13 4 7 3 6 5l0 0q-7 17-18 38-10 22-21 46l0 0q5-3 17-13 12-9 27-23 14-13 26-28l0 0q5-5 8-5l0 0q2 0 1 4-1 5-7 11l0 0q-6 8-17 18-11 11-24 22-12 11-23 19-10 9-16 12l0 0q-13 27-24 50-12 23-22 38l0 0q-6 10-15 20-9 11-20 18-11 7-23 7l0 0q-2 0-3-1-2 0-4 0zm-4-11l0 0q3 2 7 0 5-1 12-7l0 0q16-12 27-29 11-16 20-35 9-18 18-35l0 0q-16 12-35 28-20 16-36 31l0 0q-8 8-13 18-6 10-6 18l0 0q0 8 6 11z"],
  "h": [182, "M19 5l0 0q-3 0-1-3l0 0q0-2 4-12 3-9 8-23 5-13 10-28 5-14 10-25l0 0q-3 4-9 10-6 7-12 15-7 7-12 13l0 0q-1 1-2 1l0 0q-1 0-1-2l0 0q0-5 2-9l0 0q9-11 17-21 9-10 15-19l0 0q-4-2-4-6l0 0q0-5 6-5l0 0q2 0 4 1l0 0q0 0 0 0 1 0 1 1l0 0q2-3 4-5 1-3 2-6l0 0q2-3 7-13 5-11 12-25 8-14 18-29 10-15 21-28 11-13 24-21 12-8 25-8l0 0q1 0 3 1 1 0 3 0l0 0q10 2 14 7 4 5 4 12l0 0q0 5-2 10-2 6-5 11l0 0q-8 14-21 28-13 14-29 28-17 14-33 27-16 13-30 24l0 0q-10 21-15 37-5 15-8 25l0 0q5-6 13-16 9-10 20-22 12-12 24-23 12-11 22-18 11-7 19-7l0 0q9 0 9 10l0 0q0 9-6 21-7 11-12 19l0 0q-5 12-9 23-3 10-4 17l0 0q0 2 0 3 0 1 0 3l0 0q0 16 11 16l0 0q6 0 16-7 10-7 20-17 11-10 19-20 9-9 12-14l0 0q1-1 3-1l0 0q2 0 2 1 1 1 0 3l0 0q-4 7-12 17-8 10-19 21-10 10-20 17l0 0q-5 4-14 7-8 3-16 3l0 0q-6 0-12-3-6-3-9-12l0 0q-1-4-1-10l0 0q0-2 0-4 0-3 0-5l0 0q2-13 9-27 7-14 13-25l0 0q1-4 2-6 1-2 1-4l0 0q0-3-2-3l0 0q-3 0-9 3-6 4-16 13l0 0q-9 7-19 20-10 12-19 25-9 12-16 22-7 9-10 10l0 0q-2 2-9 4-8 3-11 3zm61-117l0 0q16-10 34-27 19-16 36-34 16-19 25-36l0 0q5-9 5-15l0 0q0-7-6-7l0 0q-3 0-6 2-4 1-9 5l0 0q-27 20-45 49-18 29-34 63z"],
  "i": [90, "M79-139l0 0q-5 0-11-1-5-1-5-8l0 0q0-1 5-5 6-5 11-9 6-5 7-6l0 0q7-5 9-5l0 0q2 0 0 5-2 5-2 9l0 0q0 2-3 7-2 5-5 9-3 4-6 4zm-43 143l0 0q-8 0-13-3-6-3-9-12l0 0q0-1-1-3 0-1 0-2l0 0q0-8 4-20 3-12 9-24l0 0q-3 4-6 8-3 5-9 12l0 0q-2 2-4 2l0 0q-3 0-3-4l0 0q0-2 2-4l0 0q10-13 19-23 8-11 12-18l0 0q0 0 0 0-1-1-1-1l0 0q0-1 2-4l0 0q3-9 6-16 4-6 8-7l0 0q0 0 1 0 1-1 2-1l0 0q4 0 8 2 3 2 3 6l0 0q0 4-2 9-3 5-7 13l0 0q-9 18-16 33-7 15-7 25l0 0q-1 2-1 3 0 1 0 3l0 0q0 16 11 16l0 0q6 0 16-7 10-7 20-17 11-10 19-20 9-9 12-14l0 0q1-1 3-1l0 0q1 0 2 1 1 1 0 3l0 0q-3 7-12 17-8 10-19 21-11 10-21 17l0 0q-5 4-13 7-7 3-15 3z"],
  "j": [86, "M105-161l0 0q-5 0-11-1-6-1-6-8l0 0q0 0 5-5 6-4 12-9 5-4 7-5l0 0q7-5 8-5l0 0q2 0 0 5-2 5-2 9l0 0q0 2-2 7-3 5-6 8-3 4-5 4zm-187 308l0 0q-2-1-4-2-2 0-3-1l0 0q-8-4-11-9-4-5-4-11l0 0q0-9 7-19 6-11 15-22l0 0q11-12 26-24 16-13 33-24 16-11 29-20l0 0q12-25 23-50 11-25 19-52l0 0q-4 6-12 15-8 9-13 16l0 0q-2 2-4 2l0 0q-2 0-2-2l0 0q0-3 1-4l0 0q10-13 21-26 10-14 15-21l0 0q2-3 8-3l0 0q7 0 14 4 6 4 5 6l0 0q-11 25-21 49-11 25-22 49l0 0q5-3 17-12 12-10 26-24 15-13 27-28l0 0q5-5 7-5l0 0q3 0 1 4-1 5-6 11l0 0q-7 8-18 18-11 11-23 22-12 11-23 19-10 9-16 12l0 0q-13 27-24 50-12 23-22 38l0 0q-6 10-16 20-9 11-20 18-10 7-23 7l0 0q-1 0-3-1-2 0-4 0zm-4-11l0 0q2 1 4 1l0 0q6 0 16-8l0 0q15-12 26-29 12-16 21-35 9-18 17-35l0 0q-15 12-35 28-20 16-35 31l0 0q-8 8-14 18-6 10-6 18l0 0q0 8 6 11z"],
  "k": [138, "M155 62l0 0q-15 0-28-11-13-11-25-28-11-17-19-38-7-21-11-40l0 0q-14 19-23 35-10 16-15 18l0 0q-2 2-9 4-7 3-11 3l0 0q-2 0-1-3l0 0q1-1 4-10 3-8 7-21 5-13 10-27 5-14 10-26l0 0q-4 4-10 11-5 6-12 16l0 0q-1 2-4 2l0 0q-2 0-2-2l0 0q0-3 2-6l0 0q6-7 12-15 7-9 13-18 6-8 9-13l0 0q-6-3-6-9l0 0q0-3 3-5 3-1 5 1l0 0q2 0 3 0l0 0q7-18 17-39 11-21 24-40 14-19 30-31 16-12 33-12l0 0q2 0 4 1 3 0 5 0l0 0q2 1 4 2 2 1 4 2l0 0q10 5 10 15l0 0q0 7-4 16-4 8-10 17-6 8-12 15-5 7-8 10l0 0q-20 20-43 37-22 16-39 23l0 0q-6 14-12 28-6 14-9 26-4 12-6 18l0 0q7-8 13-17 6-9 12-17l0 0q0-2 0-3 0-2 0-3l0 0q0-3 0-5 0-2 1-4l0 0q0-3 2-5 1-2 3-2l0 0q2 0 3 4l0 0q0 2 1 3 0 2 0 3l0 0q6-6 13-14 8-9 17-17 8-8 15-11l0 0q5-3 11-3l0 0q6 0 9 2 4 3 4 7l0 0q0 5-9 9l0 0q-6 3-17 8-10 5-21 13-12 7-20 15l0 0q6 21 12 37 6 15 14 29 8 13 22 31l0 0q9 10 19 16 9 7 17 7l0 0q7 0 9-3 3-3 3-8l0 0q0-5-3-11-2-6-5-10l0 0q-2-3-2-5l0 0q0-1 2-1l0 0q3 0 7 3l0 0q2 3 6 10 3 7 3 12l0 0q0 8-6 13-5 6-12 8-8 3-13 3zm-78-180l0 0q17-7 35-20 17-14 32-32l0 0q2-2 7-9 5-6 11-15 6-8 10-16 4-9 4-14l0 0q0-4-3-6l0 0q-1-1-3-1l0 0q-7 0-15 7l0 0q-27 20-45 46-18 26-33 60z"],
  "l": [94, "M42 4l0 0q-17 0-24-8-6-9-6-21l0 0q0-12 5-29 5-18 14-38 9-21 19-41 10-20 21-37 10-17 17-28l0 0q8-10 17-20 9-10 19-16 11-7 25-7l0 0q9 0 16 5 6 5 6 15l0 0q0 4-1 9-2 5-5 11l0 0q-24 42-58 78-34 36-71 67l0 0q-2 6-3 11-2 5-3 7l0 0q0 2 0 5 0 2 0 4l0 0q0 9 3 17 3 7 11 7l0 0q7 0 18-7 10-7 21-17 11-11 20-20 9-10 12-15l0 0q1-1 3-1l0 0q1 0 2 1 1 2 0 4l0 0q-4 7-13 17-9 10-19 20-11 11-21 18l0 0q-13 9-25 9zm-1-76l0 0q15-10 32-27 16-17 32-36 16-20 29-39 13-19 21-35l0 0q2-4 3-8 1-3 1-6l0 0q0-7-6-7l0 0q-6 0-14 6l0 0q-22 16-40 43-19 26-33 55-14 28-25 54z"],
  "m": [233, "M9 5l0 0q-3 0-2-3l0 0q2-2 6-14 4-11 10-27 5-15 10-30l0 0q-4 6-8 12-5 5-8 9l0 0q-1 1-2 1l0 0q-1 0-1-2l0 0q0-5 2-9l0 0q9-11 13-17 5-6 8-11 3-5 6-12l0 0q1-4 3-10 2-7 10-7l0 0q13 0 13 5l0 0q0 2-1 4-1 2-2 4l0 0q-4 10-10 24-6 14-10 27-5 12-7 19l0 0q4-6 13-16 9-10 20-22 12-12 24-23 12-11 23-19 11-7 18-7l0 0q9 0 9 11l0 0q0 8-6 20l0 0q-3 6-8 17-4 10-7 15l0 0q7-6 16-14 9-8 20-15 10-7 19-10l0 0q2-1 8-2 6-2 10-2l0 0q6 0 6 4l0 0q0 3-3 6l0 0q-7 10-12 22-5 12-9 22-3 11-4 17l0 0q0 2 0 3 0 1 0 3l0 0q0 16 10 16l0 0q7 0 17-7 10-7 20-17 11-10 19-20 9-9 12-14l0 0q1-1 2-1l0 0q2 0 3 1 1 1 0 3l0 0q-3 7-12 17-9 10-19 21-11 10-21 17l0 0q-5 4-13 7-8 3-16 3l0 0q-7 0-13-3-5-3-8-12l0 0q-1-4-1-9l0 0q0-9 2-20 2-12 5-19l0 0q2-6 6-13 3-7 6-12l0 0q-13 5-24 15-12 9-21 19-10 10-16 16l0 0q-2 5-6 8-5 2-9 2l0 0q-6 0-6-5l0 0q0-2 1-5l0 0q4-9 9-19 5-11 10-19 4-8 5-12l0 0q4-5 4-8l0 0q0-4-3-4l0 0q-3 0-9 4-7 4-17 13l0 0q-9 7-19 20-10 12-19 25-9 12-16 22-7 9-10 10l0 0q-2 2-9 4-7 3-11 3z"],
  "n": [162, "M-1 5l0 0q-3 0-1-3l0 0q1-2 4-11 3-8 7-20 5-12 9-25 4-13 8-24 4-11 6-18l0 0q1-2 2-7 1-4 3-8 3-4 9-4l0 0q12 0 12 6l0 0q0 2-2 7l0 0q-4 10-10 24-6 14-10 27-4 12-7 19l0 0q4-6 13-16 9-10 20-22 12-12 24-24 12-11 23-18 10-7 18-7l0 0q9 0 9 11l0 0q0 3-2 10l0 0q-3 10-9 20-5 9-10 20l0 0q-7 18-9 30l0 0q0 2 0 3 0 1 0 3l0 0q0 16 11 16l0 0q6 0 16-7 10-7 20-17 11-10 19-20 9-9 12-14l0 0q1-1 2-1l0 0q2 0 3 1 1 1 0 3l0 0q-3 7-12 17-9 10-19 21-10 10-20 17l0 0q-6 4-15 7-9 3-18 3l0 0q-11-1-16-8-5-6-5-16l0 0q0-10 5-23 4-12 9-23 5-10 8-16l0 0q4-6 4-10l0 0q0-3-3-3l0 0q-3 0-9 3-5 4-15 13l0 0q-9 7-19 20-10 12-19 25-9 12-16 22-7 9-10 10l0 0q-2 2-9 4-7 3-11 3z"],
  "o": [139, "M47 4l0 0q-11 0-19-5l0 0q-14-8-14-30l0 0q0-9 3-21l0 0q3-10 10-22 7-12 17-23 10-11 21-17 12-7 23-7l0 0q5 0 9 1l0 0q5 2 8 6 3 4 3 10l0 0q0 7-3 8-3 1-3-2l0 0q0 0 0-1 0-1 0-1l0 0q0-4-2-6-2-3-6-3l0 0q-7 0-16 7-10 7-19 18-10 12-18 25-7 14-9 27l0 0q-1 2-1 4 0 2 0 4l0 0q0 9 4 15 4 7 13 7l0 0q12 0 22-9 10-9 19-21 8-12 12-21l0 0q3-7 4-12 1-5 1-9l0 0q0-3 0-6-1-2-2-4l0 0q0-2 0-3l0 0q0-3 2-5 3-2 6-2l0 0q2 0 5 1l0 0q3 1 9 1 5 1 12 1l0 0q6 0 13-1 7 0 13-1l0 0q0-1 2-1l0 0q3 0 3 2l0 0q0 2-3 3l0 0q-14 6-25 7-11 0-19 0l0 0q1 10-4 21-6 12-11 21l0 0q-7 10-16 20-9 10-19 17-11 7-25 7z"],
  "p": [148, "M-51 137l0 0q-5 0-5-4l0 0q0-2 1-5l0 0q5-10 14-31 9-20 19-47 11-26 22-54l0 0q9-25 18-49 9-23 15-42 6-19 6-30l0 0q0-3 5-4 4 0 8 0l0 0q13 0 13 9l0 0q0 7-8 18l0 0q-7 12-12 24-5 12-11 25l0 0q10-13 18-25 9-12 20-21l0 0q9-7 17-11 9-4 19-4l0 0q10 0 21 5 10 5 12 15l0 0q0 2 0 3 0 1 0 3l0 0q0 14-8 27-8 13-19 24-12 10-21 17l0 0q-8 4-20 10-11 6-24 10-12 4-24 4l0 0q-7 0-12-2l0 0q-5 12-12 31-7 19-13 37l0 0q-2 8-2 13 1 5-2 13l0 0q-2 8-5 15-3 8-6 15l0 0q-1 1-5 4-4 3-10 5-5 2-9 2zm67-141l0 0q13 0 27-6 14-6 28-16 13-10 24-22 11-12 18-23l0 0q8-13 8-24l0 0q0-12-11-12l0 0q-2 0-6 1-4 1-10 4l0 0q-21 11-34 26-14 15-24 33-9 18-20 39z"],
  "q": [183, "M99 150l0 0q-8 0-15-4-7-4-12-12l0 0q-6-10-6-26l0 0q0-13 4-28 4-16 9-30 5-14 9-24l0 0q3-10 9-26 6-16 13-32 6-16 11-28 5-12 6-15l0 0q-9 11-21 24-12 13-25 24-13 12-24 19-12 8-21 8l0 0q-6 0-14-4-7-4-11-10l0 0q-6-8-6-17l0 0q0-11 7-23 7-11 18-22 11-11 23-20 13-9 25-15 11-7 19-9l0 0q3 0 8-1 4 0 9 0l0 0q8 0 16 1 7 2 12 5l0 0 1 1q3-6 6-12 2-6 5-12l0 0q2-3 7-4 5-2 11-2l0 0q4 0 8 2 3 1 3 5l0 0q0 6-13 17l0 0q-8 6-16 23-8 17-17 40-8 22-15 44l0 0q3 7 11 7l0 0q7 0 18-7 10-7 21-17 10-10 19-19 9-10 12-15l0 0q1-1 3-1l0 0q1 0 2 1 1 1 0 3l0 0q-4 7-12 17-9 10-19 21-11 10-21 17l0 0q-5 4-13 7-9 3-17 3l0 0q3 14 5 33 3 19 4 37 1 17 1 26l0 0q-3 26-14 38-11 12-23 12zm-69-157l0 0q6 0 17-8 11-7 25-19 13-11 26-24 13-12 23-22 10-10 14-14l0 0q1-3 1-4l0 0 3-7q1-1 1-3l0 0q-6-2-14-2l0 0q-16 0-35 10-19 10-34 24l0 0q-5 4-13 14-8 10-15 22-7 11-7 21l0 0q0 5 3 9l0 0q1 3 5 3zm67 146l0 0q12 0 18-9 7-10 9-23 2-14 2-26l0 0q0-4 0-8 0-5-1-7l0 0q0-13-2-30-3-18-5-29l0 0q0-1-1-3-1-1-2 2l0 0q-6 18-14 38-8 20-13 40-6 20-4 38l0 0q1 9 4 13 4 4 9 4z"],
  "r": [126, "M69 5l0 0q-7 0-12-3-5-3-7-12l0 0q-2-4-2-8l0 0q0-12 7-24 6-11 14-21 9-10 15-17l0 0q3-3 7-8 4-5 4-10l0 0q0-4-3-7-3-3-12-4l0 0q-4-1-9-1-4-1-8-1l0 0q-11 15-22 31-11 15-23 30l0 0q-2 3-4 3l0 0q-3 0-3-3l0 0q0-2 3-4l0 0q21-27 37-57l0 0q-2 0-6 0-4 0-7-1l0 0q-2 0-4-2-2-2-2-3l0 0q0-3 2-3l0 0q6-2 12-5 6-3 11-8l0 0q5-6 10-12 5-6 8-9l0 0q3-2 6-2l0 0q2 0 4 1 1 1 1 3l0 0q0 3-2 8l0 0q-4 5-8 12-4 7-8 12l0 0q8 1 15 1 7 1 15 1l0 0q4 0 7-1 4 0 8 0l0 0q12 0 12 6l0 0q0 4-4 10-4 6-10 13l0 0q-14 15-23 32-10 18-13 27l0 0q-3 9-3 14l0 0q0 10 7 10l0 0q7 0 17-7 10-7 20-17 10-9 19-19 8-9 12-14l0 0q1-1 2-1l0 0q2 0 3 1 1 2 0 4l0 0q-4 6-13 17-8 10-19 20-10 10-20 17l0 0q-5 4-14 7-9 4-17 4z"],
  "s": [118, "M20 20l0 0q-16 0-16-9l0 0q0-6 7-13l0 0q5-5 12-8 6-4 8-4l0 0q2 0 2 2 0 2-2 2l0 0q-4 3-9 7-5 4-5 9l0 0q0 6 8 6l0 0q9 0 19-5 10-5 19-14 8-8 14-17 5-8 5-15l0 0q0-5-4-9-3-5-14-11l0 0q-8-4-15-9-7-5-11-12l0 0q-3 6-8 14-5 8-12 16l0 0q-2 2-4 2l0 0q-3 0-3-2l0 0q0-1 2-4l0 0q11-12 16-23 5-11 7-17l0 0q2-11 11-22 9-10 23-18 13-8 27-12 13-4 24-4l0 0q11 0 19 4 9 4 9 12l0 0q0 5-3 11l0 0q-4 7-12 13l0 0q0 1-1 1l0 0q-3 0-3-3l0 0q0-2 2-4l0 0q3-3 5-7 2-4 2-7l0 0q0-8-9-8l0 0q-8 0-23 5-14 5-26 13l0 0q-13 8-23 19-9 10-9 18l0 0q0 4 3 8 2 3 10 7l0 0q4 3 11 7 7 3 13 7l0 0q16 10 16 21l0 0q0 9-8 18-8 10-21 18-12 7-26 12-14 5-27 5z"],
  "t": [90, "M36 4l0 0q-8 0-13-3-6-3-9-12l0 0q0-1-1-3 0-1 0-2l0 0q0-8 4-20 3-12 9-24l0 0q-3 4-6 8-3 5-9 12l0 0q-2 2-4 2l0 0q-3 0-3-4l0 0q0-2 2-4l0 0q10-13 19-23 8-11 12-18l0 0q0-1 2-5 3-4 7-12l0 0q-4 1-6 1-2 0-4 0l0 0q-2 0-4-2-2-3-1-6l0 0q2-6 9-7 7 0 12-1l0 0q0-1 2-1l0 0q4-8 9-17 4-8 7-14 3-5 3-6l0 0q8-13 11-17 2-4 6-5l0 0q4 0 9 1 5 0 7 3l0 0q1 2 1 4l0 0q0 4-1 7-2 4-4 6l0 0q-1 2-4 3-2 1-4 5l0 0q-4 8-9 17-5 9-10 17l0 0 5-1q9-1 18-2 8-1 20-1l0 0q2 0 4 1 2 1 2 2l0 0q0 1-10 4l0 0q-4 2-18 4-13 1-27 3l0 0q-4 8-7 13-4 5-5 7l0 0q-9 18-16 33-7 15-7 25l0 0q-1 2-1 3 0 1 0 3l0 0q0 16 11 16l0 0q6 0 16-7 10-7 20-17 11-10 19-20 9-9 12-14l0 0q1-1 3-1l0 0q1 0 2 1 1 1 0 3l0 0q-3 7-12 17-8 10-19 21-11 10-21 17l0 0q-5 4-13 7-7 3-15 3z"],
  "u": [178, "M123 4l0 0q-7 0-13-3-6-3-8-12l0 0q-1-2-1-5-1-2-1-5l0 0q0-10 3-22 2-12 5-20l0 0q-1 1-5 8-4 7-10 16-6 9-14 18-7 9-16 15-8 6-18 6l0 0q-6 0-15-4-9-4-13-10l0 0q-4-6-4-16l0 0q0-12 5-25 5-14 13-26l0 0q3-4 7-10 3-5 7-10 3-4 5-4l0 0q5-2 11-2l0 0q7 0 10 2l0 0q3 1 3 3l0 0q0 2-3 5l0 0q-5 4-12 12-8 8-15 19-8 11-12 25l0 0q-4 11-4 19l0 0q0 14 11 14l0 0q9 0 20-8 11-8 21-20 10-12 19-23 8-11 12-18l0 0q4-6 9-15 5-8 10-17 5-8 8-12l0 0q2 0 8 1 6 1 10 3 4 3 2 6l0 0q-2 4-7 13-5 8-10 17-5 8-8 13l0 0q-9 19-12 40l0 0q-1 2-1 3 0 1 0 3l0 0q0 16 11 16l0 0q6 0 16-7 10-7 21-17 10-10 19-20 9-9 12-14l0 0q1-1 2-1l0 0q2 0 3 1 1 1 0 3l0 0q-4 7-13 17-8 10-19 21-10 10-20 17l0 0q-5 4-13 7-8 3-16 3z"],
  "v": [126, "M29 13l0 0q-8 0-11-7-2-6-2-12l0 0q2-12 6-24 4-12 7-24l0 0q1-3 2-8 1-4 3-9l0 0q-3 4-7 9-3 4-7 10l0 0q-1 2-3 2l0 0q-2 0-3-2 0-2 1-4l0 0q9-13 15-23 5-9 7-15l0 0q1-8-2-14-3-5-9-5l0 0q-2 0-3 0-1 0-3 1l0 0q0 0 0 0 0 0-1 0l0 0q-1 0-1-1l0 0q0-1 2-5l0 0q2-1 6-1 5-1 9-1 4-1 5-1l0 0q5 0 10 1 5 1 8 5l0 0q2 2 3 5 1 3 1 6l0 0q0 3-3 9-2 5-4 12-3 7-5 12-2 6-3 8l0 0q-4 11-8 25-4 13-3 20l0 0q19-24 38-49 20-25 43-46l0 0q9-9 19-17 9-8 21-13l0 0q5-2 10-2l0 0q6 0 11 3 5 2 6 5l0 0q2 1 2 5l0 0q0 4-3 4l0 0q-1 0-3-1l0 0q-2-2-6-2-4 0-8 0l0 0q-8 0-21 8-13 9-27 22-15 14-29 30-15 16-27 32-12 16-20 29-8 12-8 19l0 0q0 2-2 3-2 1-3 1z"],
  "w": [220, "M128 1l0 0q-8 0-14-3-7-4-10-12l0 0q-2-9-2-23l0 0q0-7 1-14 1-7 2-12l0 0q-2 4-7 14-6 9-14 21-9 11-19 19-11 9-23 9l0 0q-16 0-22-9-6-8-6-19l0 0q0-14 5-29 6-15 12-24l0 0q3-4 9-12 5-8 11-15 5-7 7-8l0 0q2-1 5-1 3-1 6-1l0 0q6 0 10 3l0 0q4 1 4 4l0 0q0 1-2 3l0 0q-4 4-14 14-9 11-19 25-9 14-14 27l0 0q-5 13-5 22l0 0q0 12 9 12l0 0q8 0 24-13l0 0q11-9 21-22 11-13 20-28 9-14 16-27l0 0q1-2 7-2l0 0q6 0 13 3 7 3 4 7l0 0q-12 18-18 40l0 0q-1 5-2 12-2 7-2 14l0 0q0 7 3 12 2 5 8 5l0 0q4 0 7-1 3-1 8-4l0 0q15-8 30-21 14-14 25-31 12-17 15-34l0 0q1-4 1-11l0 0q0-8-2-16-3-7-10-10l0 0q-2-1-5-1-3 0-6 0l0 0-1 0q-2 0-2-2l0 0q0-2 2-2l0 0q5-2 13-2l0 0q7 0 14 3 8 2 11 9l0 0q3 8 3 15l0 0q0 15-9 32-8 17-22 32l0 0q-10 13-23 24-13 11-22 18l0 0q-5 4-14 7-8 3-17 3z"],
  "x": [164, "M-8 77l0 0q-4 0-4-5l0 0q0-14 9-31 8-17 21-34 12-16 25-30 13-14 21-23 9-9 9-10l0 0q0-4-3-12-2-7-6-13-4-7-9-7l0 0q-6 0-13 10-8 9-18 21l0 0q-2 3-4 3l0 0q-3 0-3-3l0 0q0-2 2-4l0 0q3-4 9-12 6-9 13-17 7-9 14-15 6-5 11-5l0 0q10 0 14 6 5 6 7 15 3 9 6 19l0 0q15-14 29-26 14-12 31-23l0 0q3-1 6-1l0 0q5 0 8 2 4 3 4 8l0 0q0 4-4 4-4 0-6 1l0 0q-15 5-23 11-8 6-15 11l0 0-28 23q0 4 4 16 5 11 10 22l0 0q8 14 17 14l0 0q7 0 13-4 7-5 13-11l0 0q10-11 19-23 9-12 13-18l0 0q2-1 3-1l0 0q2 0 3 1 1 2-1 4l0 0q-2 4-8 12-6 8-13 17-8 9-15 17l0 0q-11 10-19 13-8 4-15 4l0 0q-2 0-4 0-2-1-4-1l0 0q-9-2-15-10-7-9-11-19-5-11-8-18l0 0q-7 8-17 19-10 11-22 24-11 13-21 26-9 14-16 26-6 13-6 22l0 0q-1 5-3 5z"],
  "y": [166, "M-1 147l0 0q-5-1-8-3l0 0q-8-4-11-9-3-5-3-10l0 0q0-9 6-20 6-11 16-22l0 0q10-12 26-24 15-13 32-24 17-11 29-20l0 0q7-14 15-30 7-16 14-31 7-15 12-27 5-13 7-19l0 0q-6 7-15 19-8 11-18 24-10 12-21 23-10 12-22 19-11 7-22 7l0 0q-16 0-22-9-6-8-6-19l0 0q0-8 2-16 2-8 6-15l0 0q2-5 8-13 5-8 12-16 6-8 13-14 7-6 14-6l0 0q7 0 11 6 4 5 1 7l0 0q-6 5-16 14-9 9-18 20l0 0q-3 3-6 10-3 7-6 15-3 8-3 14l0 0q0 3 1 5 1 3 3 4l0 0q3 3 7 3l0 0q5 0 12-4 7-4 14-9l0 0q22-22 40-45 17-24 37-47l0 0q1-4 7-4l0 0q6 0 13 4 7 3 6 6l0 0q-4 8-9 21-6 13-13 28-7 16-14 31-6 15-12 27l0 0q5-3 17-12 13-10 27-24 15-14 27-28l0 0q3-3 4-3l0 0q2 0 2 3l0 0q0 3-2 7l0 0q-6 8-17 19-10 10-23 21-12 11-23 20-12 9-20 14l0 0q-13 27-24 50-12 23-22 38l0 0q-6 10-15 20-9 11-20 18-11 7-23 7l0 0q-2 0-3-1-2 0-4 0zm1-9l0 0q4 0 8-2 5-2 10-6l0 0q15-13 26-29 10-17 18-35 8-19 17-36l0 0q-16 12-35 28-20 16-36 31l0 0q-10 10-14 19-4 10-4 17l0 0q0 13 10 13z"],
  "z": [168, "M114 13l0 0q-8 3-17 3l0 0q-11 0-21-4-11-5-22-12l0 0q-7-4-16-7l0 0q-8 5-15 9-7 4-12 4l0 0q-3 0-5-1l0 0q-2-1-2-6l0 0q0-6 6-14 6-8 20-8l0 0q8 0 16 2l0 0q11-8 13-11l0 0q16-14 33-29 16-16 29-28l0 0q-10-3-18-5-8-2-17-4l0 0q-2 0-4 0-2 0-4 0l0 0q-9 0-15 3-7 3-12 8l0 0q-7 6-13 14-7 7-12 14l0 0q-2 2-4 5-2 3-4 1l0 0q-2-1-2-3l0 0q0-2 2-3l0 0q8-12 16-22 7-11 11-15l0 0q7-11 15-15 8-4 15-4l0 0q7 0 14 2 7 2 15 4l0 0q7 1 15 3 9 2 16 4l0 0q3-3 11-8 8-4 14-4l0 0q6 0 6 6l0 0q0 6-7 12-6 5-14 8-8 2-14 1l0 0q-13 12-33 28-19 16-35 31l0 0q-3 2-5 4-3 2-6 5l0 0q3 2 6 3 3 1 6 3l0 0q11 7 21 11 11 5 21 5l0 0q9 0 18-5l0 0q9-5 21-15 13-11 25-24 12-13 20-23l0 0q1-2 4-2l0 0q2 0 3 1 1 1 0 2l0 0q-3 6-11 15-7 8-17 18-9 10-19 19-10 8-17 14l0 0q-7 5-12 7-4 2-7 3z"],
  "A": [339, "M57 33l0 0q-13 0-25-4-12-5-20-14-8-10-8-25l0 0q0-3 2-6 2-3 4-3l0 0q3 0 3 9l0 0q0 14 11 22l0 0q10 6 25 6l0 0q16 0 33-6 16-6 32-16l0 0q18-12 40-35 22-22 46-49l0 0q-19-2-38-4-19-3-38-3l0 0q-13 0-26 3-13 2-23 10-11 7-16 21l0 0q0 1-1 3 0 2 0 4l0 0q0 4 2 8l0 0q0 2 0 2l0 0q0 4-3 4l0 0q-3 0-4-3l0 0q-4-7-4-18l0 0q0-21 8-33 7-11 21-15 13-4 28-4l0 0q7 0 14 1 8 0 15 1l0 0q17 2 36 6 19 3 38 7l0 0q21-24 41-49 20-25 38-47 17-22 30-38l0 0q0-1 1-2l0 0q1 0 1 0l0 0q5-3 12-5 6-1 9-1l0 0q4 0 4 4l0 0q0 1-2 4l0 0q-20 34-34 70-15 36-25 73l0 0-1 3q2 0 5 0 2 0 4 0l0 0q18 2 30-3l0 0q8-3 12-9l0 0q1-2 2-2l0 0q2 0 2 2 1 2 0 4l0 0q-4 8-16 12l0 0q-6 2-14 3-8 1-17 1l0 0-3 0-4-1-3 0q-6 22-8 46l0 0q-1 2-1 4 0 1 0 3l0 0q0 23 13 23l0 0q8 0 19-7 11-7 22-18 12-10 21-20 9-10 13-16l0 0q1-1 3-1l0 0q4 0 2 4l0 0q-1 1-7 10-6 8-16 19-10 12-24 23l0 0q-12 9-23 11-11 3-16 3l0 0q-11 0-18-10-7-11-7-27l0 0q0-11 3-24 2-12 5-24l0 0q-11-2-23-3-12-1-24-3l0 0q-24 29-48 55-24 25-45 41l0 0q-15 11-32 17-16 6-33 6zm207-121l0 0q7-28 17-56 10-28 19-52l0 0 2-4q-17 24-37 51-21 27-42 54l0 0q10 2 21 4 10 1 20 3z"],
  "B": [261, "M149 24l0 0q-23 0-38-8-15-9-18-28l0 0 0-2q-3 4-7 10-4 6-9 11-5 4-9 4l0 0q-1 0-5-1-4-1-7-2-4-1-4-3l0 0q-1-7 4-22 5-14 13-31 8-17 17-34 9-18 17-31 7-14 11-21l0 0q2-5 3-8 1-3 1-4l0 0q0-3-1-4l0 0q1-5 6-13 5-8 12-16 8-8 17-14 8-5 16-5l0 0q2 0 7 1 5 2 10 5 5 2 6 8l0 0q0 1 0 2l0 0q0 1-1 1l0 0q0 0-2 0-1-1-2-1l0 0q-9 0-20 9-11 9-22 23-12 15-22 33-11 17-21 35-10 18-17 33-7 15-11 24l0 0q-3 9-3 13l0 0q0 5 4 5l0 0q6 0 12-7l0 0q4-6 8-10 4-5 7-4l0 0q5 0 7 3 2 3 3 7 0 4 1 7l0 0q2 13 13 21 10 8 28 8l0 0q20 0 35-6 16-7 25-18 9-12 9-26l0 0q0-10-4-21-5-11-16-22l0 0q-8-11-19-20-11-9-19-17-8-8-8-13l0 0q0-5 7-9 6-4 10-4l0 0q9 0 24-3 14-4 29-10 15-6 28-14 12-7 18-15l0 0q4-4 6-9 2-5 2-10l0 0q0-8-6-14-7-6-22-9l0 0q-5-1-11-2-6 0-13 0l0 0q-20 0-47 4-27 4-54 11-28 7-52 18-24 11-39 25-16 14-18 31l0 0q0 10 5 15 6 6 13 8 8 3 12 5l0 0q4 2 4 3l0 0q0 2-4 2l0 0q-5 0-12-2-8-2-15-7-7-5-11-13-4-7-3-16l0 0q0-1-1-3 0-3 0-4l0 0q1-13 11-24 10-12 23-21 14-10 25-16l0 0q13-7 31-13 18-6 39-10 20-5 41-7 22-3 40-3l0 0q20 0 34 3l0 0q20 5 31 16 11 11 11 25l0 0q0 15-9 26-9 11-22 18-14 8-30 13-15 5-31 7-15 3-26 3l0 0q17 10 33 22 17 12 28 27 11 14 11 31l0 0q0 10-4 20-4 10-14 22l0 0q-12 15-33 24-21 8-46 8z"],
  "C": [214, "M84 18l0 0q-20 0-38-7-17-7-27-21-11-15-11-38l0 0q0-12 4-27l0 0q6-24 19-47 13-24 31-45 18-21 40-37 21-16 44-25 23-10 46-10l0 0q7 0 14 1l0 0q16 3 24 12 8 9 8 21l0 0q0 13-9 27-9 14-23 26-14 12-31 22-17 9-33 15-16 6-28 7l0 0q-8 0-8-4l0 0q0-3 3-5 3-3 7-3l0 0q32-3 59-19 27-17 41-45l0 0q3-6 5-12 2-6 2-12l0 0q0-8-5-15-5-6-18-6l0 0q-13 0-32 8-18 9-38 23-20 15-40 35-19 21-35 44-15 24-23 51l0 0q-6 16-6 29l0 0q0 25 17 36 17 11 44 11l0 0q23 0 51-8 28-8 54-24 26-17 44-42l0 0q2-2 3-2l0 0q2 0 3 2 2 1 0 3l0 0q-20 29-47 47-27 18-56 26-29 8-55 8z"],
  "D": [347, "M96 25l0 0q-8 0-13-5-4-4-7-11-2-6-3-12-1-6-1-9l0 0q0-13 1-23 1-9 3-19l0 0 0-2q0-2-1-5-1-2-2-5l0 0q0 0 0-1-1 0-1-1l0 0q0-2 3-5l0 0q3-2 7-4 4-1 7-1l0 0q2 0 3 1l0 0q1 1 1 1l0 0q0 3-2 7l0 0q-2 5-2 6-1 1-1 7l0 0q0 3 4 8 4 6 10 11 5 5 9 8 4 4 5 4l0 0q2-7 8-18 5-11 11-25 6-13 12-25 6-12 10-21l0 0q2-4 3-7 0-3 0-5l0 0q0-2 0-3 0-1-1-1l0 0q1-5 8-15 7-10 17-21 10-11 20-19 11-7 19-7l0 0q2 0 7 1 6 1 10 5 5 3 6 8l0 0 0 2q0 1 0 1l0 0q-1 0-2-1-1-1-3-1l0 0q-9 0-20 9-11 9-22 24-11 15-22 33-11 18-21 36-9 18-17 33-7 15-11 24l0 0q12 10 27 14 14 4 29 4l0 0q24 0 48-9 23-9 44-24 20-14 34-31l0 0q17-20 26-42 8-21 8-40l0 0q0-23-11-41-11-17-34-28-23-11-59-11l0 0q-25 0-52 6-28 5-53 15-25 9-45 22-20 13-32 29-12 15-12 31l0 0q0 10 6 15 7 5 15 8 8 2 12 4l0 0q3 2 3 3l0 0q0 3-4 3l0 0q-5 0-13-3-8-2-16-7-8-5-13-12-5-7-4-16l0 0q0-1 0-3 0-2 0-4l0 0q0-19 11-35 11-15 30-27 20-12 44-20 25-8 52-12 27-4 54-4l0 0q23 0 48 4 25 3 45 14 21 10 34 28 12 19 12 48l0 0q0 32-14 59-14 27-38 47-24 21-53 32-30 11-60 11l0 0q-21 0-40-5-19-5-33-16l0 0q0 1-3 7-3 6-8 13-4 6-8 11-5 5-9 5zm-2-12l0 0q3 0 7-6 3-7 6-14 3-8 4-9l0 0q-5-4-12-12-7-8-13-13l0 0q0 4 1 18 0 14 2 28l0 0q2 8 5 8z"],
  "E": [286, "M100 25l0 0q-16 0-32-3-16-3-30-9-13-7-21-19-7-12-7-30l0 0q0-20 9-34 10-14 25-22 16-9 34-14 18-4 36-7 17-2 30-2l0 0q-12-14-21-35-10-22-10-42l0 0q0-7 2-14 1-6 5-12l0 0q4-8 13-13 9-5 19-7 10-3 19-3l0 0q15 0 25 8 9 7 18 15l0 0q2 2 5 5 3 3 6 4l0 0q2 0 4 0 2 1 4 2l0 0q3 3 6 8 2 6 4 10l0 0q2 7 2 17l0 0q0 8-2 15-1 7-5 7l0 0q-2 0-5-4l0 0q-5-6-7-15-2-9-6-17l0 0q-5-10-10-19-6-9-14-15l0 0q-3-4-9-8-7-3-15-3l0 0q-6 0-10 2l0 0q-14 5-19 18-6 13-6 28l0 0q0 19 6 37 6 18 13 28l0 0q2 2 10 3 8 0 11 1l0 0q7 0 9 3 3 2 3 5l0 0q0 4-5 8l0 0q-2 2-7 2l0 0q-7 0-15-3-8-3-14-4l0 0q-12 1-28 4-15 4-31 10-17 7-30 17-14 9-23 21-8 13-9 27l0 0q0 16 13 28 12 11 46 11l0 0q16 0 35-3 18-2 36-7 18-5 33-10 15-5 25-10l0 0q7-4 18-11 11-8 22-17 10-10 17-20 7-10 7-20l0 0q0-1 0-2 0-1 0-2l0 0q-1-1 1-1 2 0 3 0l0 0q6 8 6 18l0 0q0 13-9 25-9 13-22 23-12 10-22 15l0 0q-13 7-30 13-18 6-37 10-19 4-37 7-18 2-32 2z"],
  "F": [212, "M36-118l0 0q-6-1-14-6-7-5-13-13-5-8-5-17l0 0q0-5 1-9l0 0q0-1 0-3 1-2 1-4l0 0q4-20 20-33 16-13 40-20 23-7 48-9l0 0q5 0 10-1 5 0 9 0l0 0q25 0 46 4 21 3 41 7 21 3 45 4l0 0q5-6 10-9 5-3 8-4l0 0q1 0 3 0l0 0q4 0 7 2 3 2 3 5l0 0q0 3-3 6l0 0q-3 3-8 6-5 4-11 10l0 0q-7 6-13 15-5 9-5 17l0 0q0 6 3 11l0 0q0 0 0 1l0 0q0 3-3 3l0 0q-2 0-5-3l0 0q-3-4-3-17l0 0q0-7 1-15 2-7 5-14l0 0q2-2 3-4 1-2 3-4l0 0q-30 1-58-3-28-3-56-3l0 0q-16 0-37 3-21 3-41 10-20 7-34 20-14 12-18 30l0 0q-1 1-1 3 0 1 0 2l0 0q0 8 4 13 5 5 11 8 6 4 9 7l0 0q3 1 3 3l0 0q0 1-2 2-2 0-4-1zm40 129l0 0q-2 0-5-1-4-1-7-2-3-1-4-3l0 0q0-8 5-23 5-14 13-32 9-18 18-36l0 0q-11 2-16 2l0 0q-4 0-7-3-3-3-3-8l0 0q0-4 4-7 4-3 10-4 5-2 8-2l0 0q5 0 7 4 2 4 4 4l0 0 1 0q6-12 11-20 5-9 7-14l0 0q4-7 4-12l0 0q0-2-1-3 0-1 0-1l0 0q1-5 6-13 5-8 13-16 7-8 16-14 8-5 16-5l0 0q3 0 9 2 6 2 11 6 4 4 4 10l0 0q-3-2-5-2l0 0q-11 0-24 12-13 11-26 30-13 18-25 39l0 0q7-1 14-1 6-1 13-2l0 0q15-2 30-4 15-2 29-2l0 0q3 0 6 0 2 1 2 2l0 0q0 1-1 3-2 1-7 3l0 0q-6 2-22 5-16 3-36 6-19 2-36 4l0 0q-10 19-18 36-8 16-12 26l0 0q-2 4-3 7-1 4-1 6l0 0q0 5 4 5l0 0q3 0 6-2 4-2 6-5l0 0q5-6 8-10 4-5 7-4l0 0q0 0 0 1l0 0q0 3-2 6-3 3-3 3l0 0q-3 4-8 11-4 7-10 12-5 6-10 6z"],
  "G": [319, "M113 148l0 0q-15 0-23-8-9-8-9-22l0 0q0-10 6-24 6-13 19-28l0 0q28-31 61-51 33-20 72-33l0 0q5-15 10-31 5-15 10-31l0 0q-20 18-43 36-24 18-50 31-27 12-55 12l0 0q-21 0-40-8-18-8-30-24-11-16-11-41l0 0q0-62 55-112l0 0q32-29 70-42 37-13 79-13l0 0q5 0 14 1 9 1 19 4 9 3 17 9 7 5 8 13l0 0q0 2 0 3 0 1 0 3l0 0q0 4-1 7-2 2-4 2l0 0q-4 0-4-6l0 0q-1-11-7-17-6-6-15-8-9-2-18-2l0 0q-15 0-36 7-20 6-43 17-23 11-45 26-22 15-40 33-18 17-29 37-11 20-11 40l0 0q0 27 18 39 19 13 47 13l0 0q27 0 57-10l0 0q23-7 39-17 17-10 32-24 14-13 31-29l0 0q7-18 19-24 12-5 22-5l0 0q5 0 10 1 4 1 6 1l0 0q3 0 3 2l0 0q0 4-5 3l0 0q-12-1-22 11-9 13-14 29l0 0q-6 14-10 29-5 15-11 30l0 0q21-6 31-6l0 0q4 0 6 1l0 0q2 2 2 4l0 0q0 3-3 2l0 0q-3-1-5-1l0 0q-6 0-14 2-8 2-14 5-6 2-8 6l0 0q-17 44-36 74-20 30-39 49-19 18-37 27-18 8-31 8zm11-10l0 0q15 0 29-12 15-11 28-29 13-18 24-39 11-20 19-38 8-19 12-30l0 0q-32 11-60 29-28 18-50 45l0 0q-12 15-18 28-5 12-5 22l0 0q0 11 6 17 5 7 15 7z"],
  "H": [300, "M-1 54l0 0q-13 0-22-7-10-6-13-18l0 0q-1-1-1-2 0-1 0-2l0 0q0-6 3-6l0 0q2 0 4 7l0 0q4 10 12 13 8 3 18 3l0 0q17 0 33-11 16-11 30-28 13-18 25-39 11-20 20-39 8-19 13-32l0 0q-5-1-10-1-5 0-11-1l0 0q-2 0-5 0-2 0-5 0l0 0q-13 0-25 2-13 3-23 10-10 7-14 21l0 0q-2 4-2 8l0 0q0 3 2 7l0 0q1 2 1 3l0 0q0 4-4 4l0 0q-3 0-5-3l0 0q-2-5-3-11-1-7-1-14l0 0q2-18 10-28 8-10 21-14 13-3 27-3l0 0q13 0 26 1 14 2 27 4l0 0q7-18 12-36 6-18 11-33l0 0q-12 11-26 16-14 5-26 7l0 0-1 0q-3 0-3-3l0 0q0-4 4-4l0 0q12-1 24-9 12-8 23-20 10-12 16-27l0 0q1-2 6-3 5-2 9-2l0 0q5 0 8 2 3 1 2 3l0 0q-7 19-18 49-12 30-26 63l0 0q25 5 49 11 25 5 47 8l0 0q8-17 17-34 8-18 15-36l0 0q2-4 2-6 1-3 1-5l0 0q0-2 0-3-1-1-1-2l0 0q0-4 5-12 4-8 11-16 8-8 16-14 8-5 16-5l0 0q2 0 8 2 6 1 12 5 5 4 4 10l0 0q-1 0-2-1-2-1-2-1l0 0q-9 0-19 10-10 10-20 25-10 15-19 32-9 16-16 30-7 15-10 23l0 0q6 0 16-2 9-1 17-4 9-3 13-9l0 0q1-1 2-1l0 0q2 0 2 1 1 2 0 5l0 0q-5 7-15 11-9 4-20 5-10 1-19 1l0 0q-4 9-8 22-4 13-7 26-3 13-3 23l0 0q0 7 2 12 3 5 9 5l0 0q9 0 20-7 11-7 22-17 11-11 20-21 10-10 15-16l0 0q0-1 2-1l0 0q1 0 2 1 1 1 0 3l0 0q0 2-7 11-7 9-19 22l0 0q-11 13-27 23-15 10-33 10l0 0q-13 0-18-9-6-8-6-20l0 0q0-12 4-26 4-14 7-22l0 0q2-5 4-10 3-5 5-10l0 0q-26-2-50-6-24-4-49-7l0 0q-7 15-17 35-10 21-22 42-13 22-29 40-15 19-33 30-18 12-37 12z"],
  "I": [172, "M21 4l0 0q-9 0-13-2-5-1-5-6l0 0q0-2 1-5 0-2 1-5l0 0q2-4 7-6 5-2 9-2l0 0q4 0 7 2l0 0q6 4 13 7 8 3 16 3l0 0q10 0 20-5 10-5 19-17l0 0q12-16 22-39 10-23 19-49 9-26 15-51 7-25 12-43l0 0q-21 2-41 7-19 6-32 16-13 9-13 24l0 0q0 8 5 13 4 5 10 8 6 2 9 4l0 0q3 2 3 3l0 0q0 3-3 1l0 0q-5-1-13-5-7-5-13-12-6-7-6-16l0 0q0-1-1-3 0-1 0-2l0 0q-1-16 8-26 8-10 23-17 14-7 32-10 18-3 36-3l0 0 2-4q0-2 4-3 4-1 8-1l0 0q4 0 7 1 2 1 2 3l0 0q0 2-2 5l0 0q13 1 24 4 11 3 19 7l0 0q3 1 7 5 3 4 3 6l0 0q0 2-3 2l0 0q-1 0-4 0-2-1-5-2l0 0q-8-3-20-4-12-1-26-1l0 0q-6 18-15 44-8 25-18 52-10 27-22 51-12 25-25 42l0 0q-4 4-8 8-4 4-8 7l0 0q22 0 41 0 18-1 30-2l0 0 3 0q4 0 4 2l0 0q0 2-2 5-3 2-4 3l0 0q-2 1-14 2-12 1-29 1-18 1-37 2-18 0-34 0-16 1-25 1z"],
  "J": [229, "M47 42l0 0q-15 0-24-9-9-8-9-23l0 0q0-10 5-23 6-13 19-28l0 0q27-32 61-51 33-20 72-32l0 0q3-10 8-26 5-15 11-33 6-17 14-31l0 0q-18-1-38 1-20 3-38 8-18 5-29 15-11 9-11 23l0 0q0 8 5 13 5 5 10 8 6 2 9 4l0 0q3 2 3 3l0 0q0 2-4 1l0 0q-13-3-23-14-9-11-9-24l0 0q-1-16 7-26 9-10 23-17 15-7 33-10 18-3 36-3l0 0q10 0 19 1 9 1 18 2l0 0q4-5 9-8 6-3 11-3l0 0q5 0 5 2l0 0q0 4-5 4l0 0q-5 1-11 7l0 0q5 2 10 3 4 2 8 4l0 0q3 1 7 5 3 4 3 6l0 0q0 2-2 2l0 0q-2 0-4 0-3-1-6-2l0 0q-10-3-24-4l0 0q-4 11-9 26-4 15-8 29-4 15-8 28l0 0q21-6 32-6l0 0q5 0 7 2l0 0q1 1 1 3l0 0q0 3-3 2l0 0q-2-1-5-1l0 0q-6 0-13 2-8 2-14 5-6 3-8 7l0 0q-16 43-35 74-18 30-37 49-20 18-37 27-18 8-32 8zm8-11l0 0q15 0 30-12 14-11 27-29 14-18 25-38 11-21 19-39 8-19 12-30l0 0q-33 11-61 29-28 18-50 45l0 0q-12 15-17 28-6 13-6 23l0 0q0 10 6 17 6 6 15 6z"],
  "K": [223, "M-55 54l0 0q-12 0-22-7-9-6-13-18l0 0q0-1 0-2 0-1 0-1l0 0q0-3 0-5 1-2 2-2l0 0q3 0 5 7l0 0q4 10 12 13 8 3 18 3l0 0q3 0 6 0 3 0 6-1l0 0q18-6 34-20 16-15 29-36 14-20 25-44 12-24 21-48 9-24 16-46 7-22 12-38l0 0q-11 11-25 16-14 5-26 7l0 0-1 0q-4 0-4-4l0 0q0-3 5-3l0 0q11-1 23-9 12-8 23-20 11-12 17-27l0 0q1-2 5-3 5-2 10-2l0 0q4 0 8 2 3 1 2 3l0 0q-16 39-31 79-15 40-34 79l0 0q8-10 17-20 9-10 19-21l0 0 0-5q0-3 0-6 0-2 1-5l0 0q1-2 2-4 2-3 3-3l0 0q2 0 3 5l0 0q0 2 0 3 1 1 1 3l0 0 1-1q3-4 13-13 10-8 24-20 14-12 29-25 15-13 29-24 14-11 24-19 10-8 13-9l0 0q6-3 11-5 5-1 8-1l0 0q7 0 10 3 3 2 3 6l0 0q0 7-9 12l0 0q-12 6-29 15-16 9-34 21-18 11-35 23-18 13-32 24-14 12-23 21l0 0q6 22 11 37 6 15 14 29 8 14 22 31l0 0q9 11 19 17 9 6 17 6l0 0q7 0 9-3 3-3 3-7l0 0q0-6-3-12-3-6-5-10l0 0q-2-3-2-4l0 0q0-2 2-2l0 0q4 0 7 4l0 0q2 2 6 9 3 7 3 12l0 0q0 8-6 13-5 6-12 9-8 2-13 2l0 0q-19 0-33-11-14-10-24-28-10-17-16-38-6-20-10-40l0 0q-17 20-34 40-17 21-27 35l0 0q-8 13-18 27-11 14-23 27-13 13-27 21-15 8-32 8z"],
  "L": [165, "M238 66l0 0q-17 0-35-5-18-5-33-11-16-6-28-10l0 0q-21-8-39-15-19-7-26-9l0 0q-39-10-55-10l0 0q-3 2-5 4-3 1-5 2l0 0q-2 0-4 0l0 0q-7 0-7-5l0 0q0-3 4-5l0 0q3-2 8-2 4 0 8-1l0 0q9-8 18-20 8-13 11-19l0 0q4-6 7-11 3-5 6-11l0 0q-7 2-13 3-7 2-14 2l0 0q-11 0-21-5-9-5-9-18l0 0q0-8 7-15 8-7 16-7l0 0q5 0 5 4l0 0q0 2-4 2l0 0q-4 0-8 5-4 5-4 11l0 0q0 4 3 8 3 4 9 4l0 0q6 2 13 2l0 0q11 0 23-4l0 0q6-11 11-22 5-11 10-22l0 0q10-22 20-42 11-21 21-38 10-16 18-24l0 0q15-14 30-20 16-6 28-6l0 0q2 0 5 0 2 0 4 0l0 0q15 3 21 11 6 7 6 18l0 0q0 6-1 12l0 0q-5 25-21 47-16 22-38 40-23 18-48 30-26 12-50 18l0 0q-5 9-11 17-5 9-12 17l0 0q-4 6-12 16-7 9-15 17l0 0q5 1 12 1 6 1 14 2l0 0q33 5 67 15 33 11 66 19l0 0q9 2 26 6 17 4 32 4l0 0q14 0 22-6l0 0q6-3 6-10l0 0q0-4-5-8l0 0q-2-2-2-3l0 0q0-4 5-1l0 0q5 4 7 8 2 5 2 10l0 0q0 6-2 11-2 5-5 7l0 0q-17 12-39 12zm-150-143l0 0q45-19 78-47 34-28 54-73l0 0q6-14 6-24l0 0q0-9-5-13l0 0q-3-4-9-4l0 0q-14 0-28 9l0 0q-12 9-22 23-11 15-20 31-9 16-16 30-7 14-12 23l0 0q-3 6-10 18-6 13-16 27z"],
  "M": [438, "M16 31l0 0q-8 0-14-6-6-5-6-15l0 0q0-6 3-13 2-7 7-15l0 0q9-14 24-32 14-18 31-36 16-17 31-32 14-14 23-22l0 0q4-12 8-25 4-13 8-27l0 0q-11 11-26 16-14 5-26 6l0 0-1 0q-4 0-4-3l0 0q0-3 5-3l0 0q12-2 24-9 13-8 23-20 11-13 16-27l0 0q1-2 6-3 4-1 10-1l0 0q4 0 7 1 4 1 3 3l0 0q-7 19-14 36-7 17-13 33l0 0q23-20 44-34 21-13 33-14l0 0q23-1 36 8 13 9 19 23 5 15 5 31l0 0q0 4 0 8 0 3-1 7l0 0q-2 18-8 42-6 24-13 44l0 0q0 2-2 7-2 5 0 5l0 0q0 0 4-5l0 0q10-17 19-32 9-16 20-33l0 0q16-25 35-50 19-25 38-45l0 0q8-8 16-12 8-4 16-4l0 0q8 0 13 5 5 6 5 17l0 0q0 3 0 6-1 3-2 7l0 0q-4 20-11 36-6 16-13 31-6 15-11 32-5 17-7 37l0 0q0 4-1 7 0 3 0 6l0 0q0 14 4 20 4 6 11 6l0 0q7 0 17-6 11-7 21-17 10-10 19-19 8-9 12-15l0 0q1-1 3-1l0 0q1 0 2 1 2 1 0 3l0 0q-5 8-14 19-10 10-20 20-10 10-18 16l0 0q-6 4-14 7-8 3-15 3l0 0q-9 0-16-4-7-5-10-16l0 0q-1-4-2-8 0-4 0-9l0 0q0-17 5-38 4-20 12-41 7-20 13-37 7-17 11-27l0 0q2-6 2-11l0 0q0-8-7-8l0 0q-6 0-14 7l0 0q-11 10-25 26-14 16-28 35-14 19-28 39-13 20-24 39-11 19-18 33l0 0q-3 6-6 6l0 0q-3 0-6-4-2-3-4-7-1-5 0-6l0 0q5-13 9-32 5-18 7-39 3-21 3-40l0 0q0-26-6-44-7-18-23-18l0 0q-10 0-26 9-16 9-35 24-18 15-38 33l0 0q-3 8-10 25-7 17-17 37-9 21-21 41-11 20-23 35l0 0q-11 14-22 20-10 7-20 7zm2-14l0 0q11 0 22-11 11-11 22-28 11-17 20-36 9-18 16-34 6-15 9-23l0 0q-11 11-23 24-13 13-25 26-11 14-21 25-10 12-15 20l0 0q-7 8-10 15-3 7-3 13l0 0q0 9 8 9z"],
  "N": [314, "M-35 52l0 0q-7 0-13-2l0 0q-16-6-20-22l0 0q-1-2-1-4l0 0q0-6 3-6l0 0q2 0 4 8l0 0q3 11 14 13l0 0q2 1 6 1 4 1 7 1l0 0q15 0 28-9 13-8 25-21 11-13 20-27 10-14 16-25l0 0q17-33 29-68 12-35 23-72l0 0q-11 10-25 15-14 6-27 7l0 0 0 0q-4 0-4-3l0 0q0-3 5-4l0 0q11-2 24-10 12-8 23-20 10-12 16-26l0 0q1-2 6-3 4-2 9-2l0 0q5 0 8 1 3 2 3 4l0 0q-2 5-3 14-1 9-2 15l0 0q-1 7-1 21l0 0q0 17 2 40 2 23 7 48 4 24 11 45 8 21 18 34 10 13 24 13l0 0q14 0 26-13 12-14 22-36 10-22 18-48 7-25 11-50 3-25 3-43l0 0q0-10-1-17l0 0q-1-11-4-19-3-8-7-16l0 0 0 0q0-2 4-5 3-2 4-3l0 0q6 0 11 6 5 6 10 14 4 8 9 16 4 8 9 13l0 0q3 3 5 3 2 1 6 1l0 0 2-1q4 0 5 1 1 0 1 3l0 0q0 4-3 6-3 2-6 2l0 0q-5 0-13-5-8-5-12-9l0 0q0 3 0 5 0 3 0 5l0 0q0 22-5 49-6 27-16 54-9 27-22 50-13 23-29 37-15 14-31 14l0 0q-19 0-33-12-13-11-22-31-9-19-14-43-6-24-8-48-2-25-2-46l0 0q-12 32-24 61-12 29-28 58l0 0q-8 13-18 29-10 15-23 29-13 15-28 24-15 9-32 9z"],
  "O": [282, "M126 29l0 0q-28 0-47-14-19-14-29-36-10-23-10-48l0 0q0-26 10-51 10-25 32-44 22-20 54-27l0 0q5-1 9-2 5 0 10 0l0 0q9 0 17 2 8 3 14 9l0 0q5 4 5 6 0 1-1 1l0 0q-1 0-3-1-2-1-4-2l0 0q-7-2-16-2l0 0q-2 0-4 0-3 0-5 0l0 0q-23 6-42 20-18 13-31 32-13 19-20 39-7 21-7 40l0 0q0 19 7 35 7 15 21 24 14 10 36 10l0 0q6 0 13-1 7-1 14-3l0 0q16-3 33-15 16-12 32-29 15-18 27-38 11-21 18-43 7-22 7-43l0 0q0-40-22-59-22-20-60-20l0 0q-24 0-49 9-25 9-42 22l0 0q-18 12-33 29-14 17-24 36-9 19-11 38l0 0q0 5-2 5l0 0q-1 0-3-4-2-4-2-8l0 0q0-22 10-43 9-20 25-37 16-18 37-30 20-13 42-20 22-7 44-7l0 0q32 0 57 12 25 12 39 35 14 22 14 55l0 0q0 31-11 59-12 28-32 49-19 22-42 37-24 14-47 19l0 0q-8 2-14 3-7 1-14 1z"],
  "P": [215, "M68 11l0 0q-1 0-5-1-4-1-7-2-4-1-4-3l0 0q-1-7 4-21 5-14 13-32 8-17 17-34l0 0q-2 0-3 0-2 0-4 0l0 0q-5-1-5-5l0 0q0-2 4-2l0 0q4 0 6 0 2 1 5 1l0 0q8-16 15-28 7-12 10-18l0 0q2-5 3-8 1-3 1-4l0 0q0-3-1-4l0 0q1-5 6-13 5-8 12-16 8-8 17-14 8-5 16-5l0 0q2 0 7 1 5 2 10 5 5 2 6 8l0 0q1 0 1 2l0 0q0 1-2 1l0 0q0 0-2 0-1-1-2-1l0 0q-9 0-19 8-10 8-21 22-11 14-21 30-11 17-21 34l0 0q20-1 43-5 22-5 44-12 22-7 41-17 19-11 32-24l0 0q14-15 14-30l0 0q0-12-9-22-9-10-28-15l0 0q-11-3-25-5-14-2-31-2l0 0q-25 0-52 5-27 4-51 13-24 9-40 23-16 13-19 32l0 0q-1 10 4 15 5 6 12 9 7 3 11 5l0 0q2 3 2 4l0 0q0 3-5 2l0 0q-5-1-14-5-8-5-14-12-6-8-6-19l0 0q0-1 0-3 0-1 1-3l0 0q0 0-1-3 0-2 0-3l0 0q3-13 12-24 10-11 23-19 12-9 23-14l0 0q19-9 45-15 27-5 56-5l0 0q17 0 35 2 17 3 33 8l0 0q23 7 36 23 12 16 11 33l0 0q-1 17-11 30-10 13-26 23-16 10-35 17-19 7-38 11l0 0q-19 4-39 6-21 2-37 2l0 0q-10 18-17 33-8 15-11 24l0 0q-3 9-3 13l0 0q0 5 4 5l0 0q6 0 12-7l0 0q4-6 8-10 4-5 7-4l0 0q0 0 0 1l0 0q0 2-3 6-2 3-3 3l0 0q-3 4-7 11-5 7-10 12-5 6-10 6z"],
  "Q": [268, "M330 86l0 0q-3 0-6 0-3 0-6 0l0 0q-24 0-46-7-21-8-40-19-20-12-37-24-18-13-34-24l0 0q-8 2-16 3-8 1-17 1l0 0q-32 0-56-12-25-11-40-33-14-22-14-53l0 0q0-30 12-57 12-27 31-48 19-21 43-35 23-14 46-19l0 0q7-2 14-3 6 0 12 0l0 0q25 0 42 11 16 11 24 29 8 18 8 41l0 0q0 19-6 40-6 21-18 39l0 0q-20 32-47 48-26 15-52 20l0 0q2 0 5 2 4 1 6 2l0 0q5 3 10 6 6 4 11 7l0 0q28-9 51-30 24-21 40-49 17-28 24-58l0 0q6-21 6-40l0 0q0-23-9-40-9-16-30-18l0 0q-7 0-7-3l0 0q0-1 3-3 3-1 6 0l0 0q29 4 40 26 12 22 10 51l0 0q-1 25-11 52-10 26-27 50-16 24-38 42-22 18-47 27l0 0q20 13 43 26 22 13 46 22 24 9 50 9l0 0q3 0 6 0 3 0 6-1l0 0q10 0 22-4 11-4 19-12 8-8 8-18l0 0q0-7-4-15l0 0q-1-2-1-3l0 0q0-3 3-3l0 0q4 0 6 5l0 0q4 8 6 16 1 8 0 16l0 0q0 14-13 26-14 12-37 14zm-200-80l0 0q5 0 10-1 5-1 10-1l0 0q-16-12-31-17l0 0q-5 1-13 4-8 2-14 2l0 0q-5-1-7-4-3-3-3-6l0 0q0-3 3-7 3-3 8-3l0 0q3 0 12 1 9 2 18 2l0 0q25-8 45-24 20-17 35-39 15-23 24-46 8-24 8-45l0 0q0-25-13-41-13-17-41-17l0 0q-5 0-12 1-6 1-13 2l0 0q-16 4-33 16-17 11-32 28-15 17-27 37-12 20-19 41-7 21-7 41l0 0q0 37 22 57 22 20 58 20l0 0q4 0 6 0 3 0 6-1z"],
  "R": [215, "M287 73l0 0q-4 0-8-1-4 0-9-1l0 0q-27-5-49-18-22-13-39-30-18-17-32-35-14-19-26-37-11-17-21-30l0 0q-1-2-2-1-1 0-1 0l0 0q-9 17-16 32-8 14-11 23l0 0q-3 9-3 13l0 0q0 5 4 5l0 0q6 0 12-7l0 0q4-6 8-10 4-5 7-4l0 0q0 0 0 1l0 0q0 2-3 6-2 3-3 3l0 0q-3 4-7 11-5 7-10 12-5 6-10 6l0 0q-1 0-5-1-4-1-7-2-4-1-4-3l0 0q-1-7 4-21 4-14 12-31 8-17 17-33l0 0q-7-1-9-2l0 0q-4-3-4-8l0 0q0-4 3-7 3-3 9-3l0 0q2 0 5 0 3 1 5 3l0 0q6-12 12-22 5-10 8-15l0 0q2-5 3-8 1-3 1-4l0 0q0-3-1-4l0 0q1-5 6-13 5-8 12-16 8-8 17-14 8-5 16-5l0 0q2 0 7 1 5 2 10 5 5 2 6 8l0 0q0 1 0 2l0 0q0 1-1 1l0 0q0 0-2 0-1-1-2-1l0 0q-11 0-25 13-14 14-28 35-14 20-27 43l0 0q2 0 5 1 3 0 6 0l0 0q2 0 3 0 2 0 3 0l0 0q26-3 52-10 27-7 50-19 23-11 39-27l0 0q14-15 14-30l0 0q0-12-9-22-9-10-28-15l0 0q-11-3-25-5-14-2-31-2l0 0q-25 0-52 5-27 4-51 13-24 9-40 23-16 13-19 32l0 0q-1 10 4 15 5 6 12 9 7 3 11 5l0 0q2 3 2 4l0 0q0 3-5 2l0 0q-5-1-14-5-8-5-14-12-6-8-6-19l0 0q0-1 0-3 0-1 1-3l0 0q0 0-1-3 0-2 0-3l0 0q3-13 12-24 10-11 23-19 12-9 23-14l0 0q19-9 45-15 27-5 56-5l0 0q17 0 35 2 17 3 33 8l0 0q23 7 36 23 12 16 11 33l0 0q-1 17-11 30-10 13-26 23-16 10-35 17-19 7-38 11l0 0q-16 3-33 5-17 2-32 3l0 0q17 21 34 43 17 21 36 40 20 19 43 32 23 13 52 19l0 0q6 1 13 1l0 0q10 0 20-3 10-3 17-10 7-7 7-18l0 0q0-2 0-4 0-2-1-4l0 0q0-1 0-1 0-1 0-1l0 0q0-4 3-4l0 0q4 0 5 6l0 0q1 6 1 12l0 0q0 6-1 11-1 5-3 9l0 0q-3 12-18 19-14 8-33 8z"],
  "S": [236, "M65 14l0 0q-28 0-44-10-16-9-16-26l0 0q0-18 11-33 10-15 27-26 16-11 34-17 19-6 34-6l0 0q8 0 8 2l0 0q0 4-8 4l0 0q-15 0-32 7-18 7-31 20l0 0q-11 9-17 19-5 10-5 18l0 0q0 13 12 21 11 8 34 8l0 0q14 0 28-2 14-2 25-5 12-3 18-4l0 0q15-5 30-12 15-7 27-15 12-9 17-18l0 0q3-5 5-9 1-4 1-8l0 0q0-12-10-19-10-8-25-15-16-6-34-12-17-6-33-12-15-6-25-15-10-8-10-19l0 0q0-14 9-24 10-11 26-19 15-8 33-14 17-5 33-8 16-3 27-3l0 0q44 0 44 22l0 0q0 9-8 21l0 0q-3 6-9 11-6 6-9 6l0 0q-2 0-2-3l0 0q0-1 4-5 4-4 9-10 4-5 4-11l0 0q0-8-9-13-10-4-25-4l0 0q-7 0-21 2-13 2-29 7-16 5-31 13l0 0q-28 15-28 26l0 0q0 8 16 15l0 0q12 5 27 11 15 6 31 12 15 6 29 14 13 8 21 18 8 10 8 22l0 0q0 17-18 35l0 0q-14 13-33 25-19 12-40 20-21 8-42 13-20 5-38 5z"],
  "T": [134, "M36-118l0 0q-6-1-14-6-7-5-13-13-5-8-5-17l0 0q0-5 1-9l0 0q0-1 0-3 1-2 1-4l0 0q4-20 20-33 16-13 40-20 23-7 48-9l0 0q5 0 10 0 4 0 9 0l0 0q28 0 56 3 27 4 50 7 23 4 36 4l0 0q11-12 16-13l0 0q1 0 4 0l0 0q4 0 8 2 3 2 3 6l0 0q0 4-3 7l0 0q-3 3-9 7-6 4-11 10l0 0q-8 8-15 18-6 10-6 19l0 0q0 7 3 12l0 0q1 0 1 1l0 0q0 3-3 3l0 0q-3 0-6-3l0 0q-3-4-3-17l0 0q0-8 1-17 2-9 6-17l0 0q1-3 4-7 3-3 5-5l0 0q-29-1-58-4-30-2-59-2l0 0q-13 0-30 1-17 2-35 6-17 4-32 12-16 7-26 18-11 11-14 26l0 0q-1 1-1 3 0 1 0 2l0 0q0 8 4 13 5 5 11 8 6 4 9 7l0 0q3 1 3 3l0 0q0 1-2 2-2 0-4-1zm40 129l0 0q-2 0-5-1-4-1-7-2-3-1-4-3l0 0q-1-7 4-22 5-14 13-31 9-17 18-34 9-18 16-31 8-14 11-21l0 0q4-7 4-12l0 0q0-2-1-3 0-1 0-1l0 0q1-5 6-13 5-8 13-16 7-8 16-14 8-5 16-5l0 0q3 0 9 2 6 2 11 6 4 4 4 10l0 0q-3-2-5-2l0 0q-9 0-20 9-11 9-22 23-12 15-23 33-11 17-20 35-10 18-17 33-7 15-11 24l0 0q-2 4-3 7-1 4-1 6l0 0q0 5 4 5l0 0q3 0 6-2 4-2 6-5l0 0q5-6 8-10 4-5 7-4l0 0q0 0 0 1l0 0q0 3-2 6-3 3-3 3l0 0q-3 4-8 11-4 7-10 12-5 6-10 6z"],
  "U": [210, "M181 75l0 0q-15 0-22-11-7-11-9-28l0 0q-1-6-2-12 0-7 0-14l0 0q0-14 1-30 2-16 5-34l0 0q-16 15-33 29-18 15-37 24-19 9-38 9l0 0q-10 0-18-6-8-6-10-20l0 0q0-3-1-5 0-3 0-6l0 0q0-17 6-37 6-19 15-38 9-20 19-38 9-19 15-35l0 0q1-1 1-2 0-1 0-2l0 0q0-1-1-1l0 0q-2 0-9 5l0 0q-13 11-28 19-14 8-27 9l0 0 0 0q-4 0-4-3l0 0q0-3 6-4l0 0q6-1 16-6 10-6 21-14 11-8 20-16 10-9 17-16 7-7 9-11l0 0q1-2 6-4 5-1 10-1l0 0q4 0 7 1 4 1 3 4l0 0q-3 4-11 17-8 13-18 31-10 19-20 39-10 21-18 41-8 21-11 37l0 0q-1 5-1 10-1 4-1 9l0 0q0 16 6 22 5 7 14 7l0 0q10 0 23-6 12-6 25-15 13-9 26-20 12-11 22-21l0 0q4-26 10-51 6-25 12-45 7-21 13-34l0 0q10-21 23-33 13-12 32-11l0 0q13 1 19 8 5 7 5 17l0 0q0 7-3 15l0 0q-5 18-16 35-11 18-24 35-14 18-28 34-13 16-24 30l0 0q-2 10-4 24-2 14-3 27-1 13-1 23l0 0q0 39 14 55l0 0q4 6 11 6l0 0q5 0 8-4l0 0q2-3 5-6l0 0q2-3 4-3l0 0q3 0 2 6l0 0q-1 1-2 3-2 3-4 5l0 0q-2 3-10 5-7 2-13 2zm-1-169l0 0q14-13 29-33 15-19 28-41 12-22 17-41l0 0q1-3 1-6 1-3 1-5l0 0q0-12-8-12l0 0q-6 0-14 9l0 0q-22 25-34 58-12 33-20 71z"],
  "V": [245, "M84 23l0 0q-21 0-29-8-9-8-9-21l0 0q0-13 6-28l0 0q8-24 19-49 11-26 21-50l0 0q9-21 18-43 9-22 12-38l0 0q-18 0-36 3-18 3-34 8-15 6-25 15-9 8-9 21l0 0q0 8 5 13 4 5 10 8 5 2 9 4l0 0q3 2 3 4l0 0q0 0-2 0l0 0q-3 0-11-4-8-4-15-12-7-7-7-17l0 0q0-1-1-3-1-1-1-2l0 0q-1-16 8-26 8-10 23-17 15-7 33-10 18-3 36-3l0 0q4 0 8 0 3 0 7 1l0 0q-1-3-2-5l0 0q-1-2-1-2l0 0q0-4 4-4l0 0q4 0 7 6l0 0q2 3 2 6l0 0q23 2 38 10l0 0q3 1 7 5 4 4 4 6l0 0q0 2-3 2l0 0q-1 0-4 0-2-1-5-2l0 0q-15-4-36-5l0 0q-1 17-7 41-6 23-15 45l0 0q-13 28-24 59-12 30-14 55l0 0q0 2 0 4 0 1 0 3l0 0q0 11 4 15 4 5 12 5l0 0q11 0 26-8 16-9 31-20l0 0q27-21 46-44 20-24 38-52l0 0q16-26 31-52 15-26 35-49l0 0q5-7 13-14 8-6 19-11 10-5 20-5l0 0q3 0 7 1 3 1 6 3l0 0q3 1 2 3-1 1-2 1l0 0q-1 0-2 0-2 0-2 0l0 0q-9 0-21 11-13 12-28 31-15 20-33 44-18 24-37 49l0 0q-21 26-42 51-22 24-45 42l0 0q-17 14-34 21-17 8-34 8z"],
  "W": [390, "M37 32l0 0q-17 0-24-7-8-6-8-16l0 0q0-8 4-18 4-10 11-21l0 0q14-24 31-50 18-26 35-52l0 0q10-14 20-28 10-15 19-29 9-13 14-25l0 0q-4 0-8 0-4 0-8 0l0 0q-17 0-36 3-18 2-34 8-16 5-25 14-10 9-10 22l0 0q0 8 5 13 4 5 10 8 6 2 9 4l0 0q3 2 3 4l0 0q0 0-2 0l0 0q-3 0-11-4-8-4-15-12-7-7-7-17l0 0q0-1-1-3-1-1-1-2l0 0q-1-16 8-26 8-10 23-17 14-7 32-10 18-3 36-3l0 0q20 0 38 4l0 0q1-2 1-3 0-1 0-3l0 0q0-2-1-3l0 0q0-1 0-2l0 0q0-3 3-3l0 0q2 0 5 1 2 1 3 5l0 0q0 1 0 3l0 0q0 3-1 7l0 0q5 1 9 3 4 1 7 3l0 0q3 1 7 5 4 4 4 6l0 0q0 2-3 2l0 0q-1 0-4 0-2-1-5-2l0 0q-4-1-9-2-4-1-9-2l0 0q-6 17-19 41-13 23-28 45l0 0q-13 20-26 41-14 21-25 41-11 20-17 38l0 0q-2 5-3 9 0 4 0 8l0 0q0 12 12 12l0 0q11 0 28-8 18-8 36-21l0 0q34-23 63-52 30-29 53-62l0 0q0-5 0-10 0-6 0-12l0 0q0-9 0-19 1-10 2-18l0 0q1-3 4-9 4-5 8-9 5-5 8-5l0 0q4 0 6 5 2 5 2 17l0 0q0 11-2 27-2 15-9 30l0 0q-1 23 4 45 5 22 15 39 9 17 21 27 12 10 26 9l0 0q15 0 27-11 12-10 21-28 9-18 14-39 5-21 5-42l0 0q0-22-5-41-6-19-17-31l0 0q-13-14-33-14l0 0q-2 0-4 0-1 0-3 1l0 0q-10 1-18 7l0 0q-2 1-3 1l0 0q-5 0-5-4l0 0q0-2 2-3l0 0q22-15 43-15l0 0q16 0 29 8l0 0q16 11 23 31 8 20 8 45l0 0q0 25-7 52-8 26-20 49-13 22-31 36-17 14-38 14l0 0q-15 0-30-9-14-9-24-24-11-16-16-36-5-21-4-44l0 0q-13 16-30 34-18 19-38 36-19 17-37 29l0 0q-20 15-41 24-20 10-42 10z"],
  "X": [272, "M-30 58l0 0q-21 0-39-12l0 0q-15-11-15-31l0 0q0-4 2-8 1-3 4-3l0 0q1 0 2 2 0 3 0 10l0 0q0 11 11 18l0 0q6 4 13 6 7 2 15 2l0 0q17 0 38-9 20-8 41-21 21-14 41-30 20-16 37-32 17-16 29-29l0 0q-6-22-9-45-4-23-4-46l0 0q0-10 1-19 1-10 1-20l0 0q1-2 1-4 1-3 1-5l0 0q-4 0-9 0-4 0-9 0l0 0q-18 0-36 2-19 3-34 8-16 6-26 15-9 9-9 22l0 0q0 8 5 13 6 4 12 7 7 3 10 5l0 0q2 1 2 2l0 0q0 1-2 2-2 1-4 0l0 0q-5-1-12-6-8-4-14-11-6-7-6-16l0 0q0-1 0-2-1-2-1-3l0 0q-1-15 8-26 8-10 23-17 14-7 32-10 18-3 36-3l0 0q23 0 41 4l0 0q3-5 8-6l0 0 1 0q3 0 4 3 2 3 2 7l0 0q2 0 4 1 2 1 4 2l0 0q3 2 7 6 4 4 4 7l0 0q0 1-3 1l0 0q-2 0-10-2l0 0q-2-1-4-1-2-1-4-1l0 0q-1 7-2 15 0 8 0 16l0 0q0 42 10 82l0 0q21-24 39-48 19-24 35-47 16-23 30-40l0 0q1-2 4-2l0 0q5 0 5 4l0 0q0 2-1 4l0 0q-22 34-50 71-28 38-57 72l0 0q2 8 7 20 5 13 12 26 8 13 16 22 9 9 18 9l0 0q8 0 17-6 10-6 20-15 9-8 17-17 8-9 12-15l0 0q2-1 3-1l0 0q5 0 3 4l0 0q-3 5-11 14-7 10-18 21-10 10-19 17l0 0q-19 14-34 14l0 0q-11 0-21-7-10-8-18-19-8-12-14-24-6-12-9-21l0 0q-12 14-29 30-16 16-35 33-20 17-40 30-20 14-41 22-20 9-39 9z"],
  "Y": [210, "M35 148l0 0q-15 0-23-8-9-8-9-22l0 0q0-10 6-24 6-13 19-28l0 0q27-31 61-51 33-20 72-33l0 0q2-6 7-22 4-16 10-36 5-21 11-43l0 0q-15 24-33 47-18 22-37 41-19 18-38 28-19 11-35 11l0 0q-10 0-18-6-8-6-10-20l0 0q0-3-1-5 0-3 0-6l0 0q0-17 6-37 6-19 15-38 9-20 19-38 9-19 15-35l0 0q1-1 1-2 0-1 0-2l0 0q0-1-1-1l0 0q-2 0-9 5l0 0q-13 11-28 19-14 8-27 9l0 0 0 0q-4 0-4-3l0 0q0-3 6-4l0 0q6-1 16-6 10-6 21-14 11-8 20-16 10-9 17-16 7-7 9-11l0 0q1-2 6-4 5-1 10-1l0 0q4 0 7 1 4 1 3 4l0 0q-3 4-11 17-8 13-18 32-10 18-20 39-10 20-18 40-8 21-11 37l0 0q-1 5-1 10-1 4-1 9l0 0q0 16 6 22 5 7 14 7l0 0q13 0 29-11 16-11 33-30 17-18 33-41 16-23 31-48 14-24 24-46l0 0q3-7 6-13 2-5 5-10l0 0q1-3 2-6 2-2 3-3l0 0q5-8 14-11 9-3 17-3l0 0q8 0 13 1 6 1 8 2l0 0q4 0 4 3l0 0q0 2-1 3-2 2-5 2l0 0q-15-2-25 10-10 11-19 34l0 0q-3 8-8 24-5 15-11 34-6 19-12 38-6 19-10 33-5 15-7 21l0 0q20-6 31-6l0 0q4 0 6 1l0 0q1 2 1 3l0 0q0 2-1 3 0 1-2 0l0 0q-2-1-5-1l0 0q-5 0-13 2-8 2-14 5-7 2-8 6l0 0q-23 58-49 93-27 35-51 50-25 15-43 15zm11-10l0 0q15 0 29-12 15-11 28-29 13-18 24-39 11-20 19-38 8-19 12-30l0 0q-32 11-60 29-28 18-50 45l0 0q-13 15-18 28-5 13-5 22l0 0q0 11 6 17 5 7 15 7z"],
  "Z": [209, "M242 80l0 0q-3 0-6 0-3 0-6 0l0 0q-23 0-44-7-21-7-41-18-19-11-38-23-19-12-36-22-17-11-33-16l0 0q-8 3-15 5-7 1-10 1l0 0q-9-4-9-12l0 0q0-8 9-12l0 0q2-1 9 1 7 2 16 3l0 0q17-7 40-28 23-22 48-48l0 0q-12 0-21 1-9 0-13 0l0 0q-3 0-7-3-3-4-3-8l0 0q0-4 4-7 4-3 9-4 5-1 8-1l0 0q5 0 7 3 2 4 5 5l0 0q2 0 4 0 2 0 4 0l0 0q4 0 8 0 4 0 8 0l0 0q18-20 36-39 18-19 34-34 16-15 28-21l0 0q-20-6-48-11-27-5-54-5l0 0q-11 0-21 1-10 1-19 3l0 0q-13 4-23 13-10 9-10 17l0 0q0 4 1 6l0 0q2 3 2 5l0 0q0 3-2 3l0 0q-1 0-5-4l0 0q-6-7-6-16l0 0q0-8 6-16 5-8 13-14 9-6 17-9l0 0q12-4 25-6 13-1 26-1l0 0q29 0 58 5 30 6 54 12l0 0q3-3 9-7 6-4 14-8 7-3 12-3l0 0q9 0 9 9l0 0q0 9-6 16-7 7-16 11-9 3-17 3l0 0q-3 0-5 0l0 0q-13 8-28 22-15 14-30 31-16 17-32 35l0 0q14-1 29-2 14-2 28-1l0 0q3 1 6 1 2 1 2 3l0 0q0 1-1 2-2 1-7 3l0 0q-5 1-16 2-11 2-25 3-14 2-28 3l0 0q-20 22-42 43-22 20-48 35l0 0-1 0q-3 3-3 6l0 0q0 4 5 7l0 0q26 14 51 29 26 16 52 27 27 11 55 11l0 0q3 0 7-1 3 0 6 0l0 0q8-1 17-5 8-4 14-10 6-6 6-16l0 0q0-8-6-19l0 0q-2-2-2-3l0 0q0-3 3-3l0 0q3 0 5 4l0 0q5 9 8 17 2 8 3 15l0 0q0 1 0 3 1 1 1 2l0 0q0 13-10 23-9 11-28 13z"],
  " ": [88, ""],
  ".": [72, "M51 0l0 0q-4 0-9-1-4-1-4-5l0 0q0-2 4-7 4-4 10-8 5-3 7-3l0 0q3 0 3 2 0 3 0 6l0 0q0 2-2 6-2 4-5 7-2 3-4 3z"],
  ",": [71, "M18 48l0 0q-1 0-2 0l0 0q-2 0-2-1 0-1 0-2l0 0q0 0 2-4 3-3 6-7l0 0q6-7 11-14 5-8 7-16l0 0q2-4 2-7l0 0q0-4-2-6-2-2-2-5l0 0q0-2 1-4l0 0q1-3 5-3 4 0 6 0l0 0q5 0 8 4 2 5 2 9l0 0q0 4-5 12-5 8-12 17-8 9-15 17-6 7-10 10z"],
  "!": [65, "M64-57l0 0q-5 0-5-5l0 0q0 0 0-1 0-1 1-2l0 0q6-19 15-40 8-21 17-42 8-21 16-39l0 0q7-18 13-31 5-13 8-16l0 0q1-1 3-1l0 0q4 0 10 5 6 5 6 9l0 0q0 4-3 11-2 7-7 16l0 0q-2 3-4 5-3 1-5 5l0 0q-15 29-30 59-15 30-26 61l0 0q0 2-3 4-4 2-6 2zm-13 57l0 0q-4 0-9-1-4-1-4-5l0 0q0-2 4-7 4-4 10-8 5-3 7-3l0 0q3 0 3 2 0 3 0 6l0 0q0 2-2 6-2 4-5 7-2 3-4 3z"],
  "?": [189, "M74-57l0 0q-4 0-4-5l0 0q2-12 14-24 12-12 26-24l0 0q14-13 25-24 10-11 16-25 6-13 6-34l0 0q0-14-8-24-7-9-20-9l0 0q-14 0-27 8-13 8-23 18l0 0q-4 4-10 12-5 7-10 13-5 6-7 6l0 0q-3 0-3-7l0 0q0-14 5-27 6-12 22-14l0 0q3-1 7-2 4-2 7-4l0 0q9-4 21-7 11-3 23-3l0 0q16 0 30 7 13 8 17 26l0 0q1 4 1 7 1 3 1 6l0 0q0 19-11 35-10 16-26 28-15 13-28 22l0 0q-14 10-25 20-12 10-14 21l0 0q-1 4-5 4zm-23 57l0 0q-4 0-9-1-4-1-4-5l0 0q0-2 4-7 4-4 10-8 5-3 7-3l0 0q3 0 3 2 0 3 0 6l0 0q0 2-2 6-2 4-5 7-2 3-4 3z"],
  "'": [58, "M34-121l0 0q-1 0-2-2-1-1-1-4l0 0q1-5 1-11 0-7 0-14l0 0 0-14q1-3 0-7 0-3 0-6l0 0q0-4 2-7 3-3 11-3l0 0q5 0 6 3 2 2 2 6l0 0q0 4-2 9-1 5-2 8l0 0q-2 7-5 16-3 9-6 21l0 0q-1 5-4 5z"],
  "&": [279, "M102 13l0 0q-3 0-6 0-3 0-6 0l0 0q-25 0-41-8-17-8-25-21-8-13-8-28l0 0q0-18 12-35 12-17 35-26l0 0q14-5 26-6 13-1 24-2 11 0 18-1l0 0q-10-8-20-20-10-12-17-27-6-14-6-28l0 0q0-7 1-13 2-6 6-11l0 0q4-6 14-10 9-4 20-7 12-2 21-2l0 0q13 0 25 6 12 6 20 15l0 0q3-4 7-7 4-3 8-4l0 0q1 0 3 0l0 0q3 0 5 1 2 2 2 4l0 0q0 2-2 4l0 0q-2 3-6 5-4 3-8 8l0 0q-6 5-10 11-5 7-5 14l0 0q0 4 3 7l0 0q0 1 0 2l0 0q0 2-2 2l0 0q-2 0-4-2l0 0q-2-3-2-12l0 0q0-6 1-12 1-6 4-12l0 0q0 0 0-1 1 0 1-1l0 0q-6-7-18-13-11-6-23-6l0 0q-5 0-9 1l0 0q-14 3-19 13-5 10-5 23l0 0q0 12 3 24 4 13 9 24 5 11 10 18l0 0q5 6 5 9l0 0q0 3-7 4l0 0q-18 2-36 9-17 6-28 11l0 0q-18 9-27 23-9 13-9 26l0 0q0 17 15 30 15 13 43 13l0 0q3 0 6 0 2 0 5-1l0 0q25-2 47-11 22-9 39-27 17-17 25-44l0 0q2-6 3-12 1-6 1-11l0 0q0-6-1-10-1-5-2-7l0 0q-11 7-24 14-13 6-23 13l0 0q-6 3-15 12-9 9-17 19-7 10-7 18l0 0q0 6 5 10l0 0q3 2 3 4l0 0q0 2-2 2l0 0q-1 0-3-1l0 0q-5-2-8-9-2-6-2-15l0 0q0-13 4-22l0 0q5-9 13-15 8-6 20-13l0 0q14-8 31-16 16-8 30-16 15-7 24-14 9-8 9-15l0 0q0-2 0-3 0-1-1-2l0 0q0-1 0-1 0 0 0 0l0 0q0-2 1-2l0 0q2 0 4 3l0 0q1 3 1 8l0 0q0 11-10 20-11 10-27 19l0 0q4 5 9 15 6 10 6 20l0 0q0 2 0 3 0 2-1 3l0 0q-4 23-18 40-14 17-34 28-20 11-42 16-22 6-41 8z"],
  "-": [150, "M64-68l0 0q-7 0-7-4l0 0q0-3 5-7 4-3 8-3l0 0q5 0 16-1 10 0 23 0 12 0 20 0l0 0q10 0 16 2 7 1 7 3l0 0q0 3-5 4-5 1-10 2-5 0-7 1l0 0q-10 0-23 1-13 1-25 1-12 1-18 1z"],
}
// #endregion glyphs
