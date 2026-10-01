"use client"

// Hanging Chapter Select — a dreamy, game-style chapter picker. Poster cards hang
// on pink strings over a cream lattice wall, sway in an idle breeze, and swing
// like pendulums when you drag, flick, wheel or brush past them. Pick the card in
// front and it lifts off its string into a reading letter with an airmail border.
// A bottom tab bar swaps the whole line of cards (they drop in on their strings),
// a bag keeps the cards you saved, and a credits strip closes the page.
//
// Every picture is drawn in this file: eight poster styles (brush calligraphy,
// a spring bouquet, a summer window, an autumn silhouette, frosted winter tiles,
// a girl in the distance, lined notes, a film strip), palm fronds, a vine, light
// leaks and airmail stripes. Nothing loads at runtime. Pass `image` on any card
// to use your own picture instead.
import * as React from "react"

export type PosterArt = "brush" | "bouquet" | "window" | "silhouette" | "frost" | "figure" | "notes" | "film"

export type PosterColors = {
  /** Poster background. */
  bg?: string
  /** Title and line work. */
  ink?: string
  /** Ribbons, flowers, silhouettes. */
  accent?: string
}

export type HangingCard = {
  /** Big title on the poster (2–4 characters reads best, any language works). */
  title: string
  /** Small line on the poster and the letter, e.g. an English title. */
  subtitle?: string
  /** The ribbon tag under the card, e.g. "Chapter I". */
  tag?: string
  /** Small line under the tag, e.g. "Chapter I". */
  tagSub?: string
  /** Generated poster style. Ignored when `image` is set. */
  art?: PosterArt
  colors?: PosterColors
  /** Your own picture (any URL), cropped to the poster. */
  image?: string
  /** Shown in the letter when the card is opened. */
  description?: string
  /** Small chips in the letter, e.g. ["12 pages", "18 min"]. */
  meta?: string[]
  /** 0–1. Draws a reading-progress bar in the letter and on the card. */
  progress?: number
  /** Locked cards shake and show `lockHint` instead of opening. */
  locked?: boolean
  lockHint?: string
  /** The letter's main button becomes a link. */
  href?: string
}

export type TabIcon = "bloom" | "quill" | "swirl" | "badge" | "camera" | "star"

export type HangingTab = {
  label: string
  /** Small line under the label, and the big ghost word behind the cards. */
  sub?: string
  icon?: TabIcon
  cards: HangingCard[]
}

export type CreditItem = { label: string; sub?: string; value: string; href?: string }

export type HangingPalette = {
  /** The wall. */
  paper?: string
  /** Text and line icons. */
  ink?: string
  /** Strings, ribbons, the active tab. */
  pink?: string
  /** Airmail stripes, the script line. */
  blue?: string
  /** Palm fronds and the vine. */
  leaf?: string
}

export type HangingChapterSelectProps = {
  /** The huge outlined word across the top of the wall. */
  title?: string
  /** The handwritten line in the corner. */
  script?: string
  tabs?: HangingTab[]
  initialTab?: number
  /** Card in front on first paint. Defaults to the middle of the line. */
  initialIndex?: number
  /** Credits strip. `false` hides it. */
  credits?: CreditItem[] | false
  brand?: string
  brandSub?: string
  site?: string
  /** A real QR code image for the credits strip. Without it a decorative code is drawn; `false` hides it. */
  qrImage?: string | false
  palette?: HangingPalette
  /** Palm fronds and the vine in the corners. */
  leaves?: boolean
  /** Idle breeze. Cards still swing when moved. */
  breeze?: boolean
  /** Cards drop in on their strings on first paint and on every tab change. */
  animateIn?: boolean
  /** The back arrow, top left. Without it the arrow returns to the first card. */
  onBack?: () => void
  /** The letter's main button. */
  onOpen?: (card: HangingCard, tab: number, index: number) => void
  /** Called whenever the saved cards change, with "tab:index" keys. */
  onKeepChange?: (keys: string[]) => void
  /** Always a definite length. */
  height?: string
  className?: string
}

// #region logic
type Pt = [number, number]

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Seeded PRNG, so every drawing is identical on server and client. */
const rng = (seed: number) => {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const easeOutBack = (x: number) => {
  const t = clamp(x, 0, 1)
  const c = 1.9
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

const fmt = (n: number) => String(Math.round(n * 100) / 100)

/** A stable number from a string, for seeding a card's drawing. */
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Depth of a card `d` places from the front: smaller, lower and behind as it goes. */
const layout = (d: number) => {
  const a = Math.abs(d)
  return {
    scale: 1 - Math.min(a, 3) * 0.07,
    lift: Math.max(0, 1 - a) * 1.6,
    opacity: a > 3.4 ? Math.max(0, 1 - (a - 3.4) * 1.4) : 1,
    z: 100 - Math.round(Math.min(a, 9) * 10),
  }
}

/** Where a released drag comes to rest: project the flick, then round to a card. */
const settle = (pos: number, vel: number, n: number) => clamp(Math.round(pos + vel * 0.16), 0, Math.max(0, n - 1))

/** Past either end the line resists, like pulling on a string. */
const rubber = (p: number, n: number) => {
  const max = Math.max(0, n - 1)
  if (p < 0) return p * 0.32
  if (p > max) return max + (p - max) * 0.32
  return p
}

/** One step of a damped pendulum (degrees). `push` is the pivot's acceleration, already scaled. */
const swing = (th: number, om: number, rest: number, push: number, k: number, dt: number): Pt => {
  const acc = -k * (th - rest) - 2.1 * om - push
  const o = om + acc * dt
  return [clamp(th + o * dt, -20, 20), o]
}

/** One step of the line's spring toward its target card. */
const spring = (x: number, v: number, target: number, dt: number): Pt => {
  const acc = (target - x) * 95 - v * 17.5
  const nv = v + acc * dt
  return [x + nv * dt, nv]
}

/** Drop-in on a string: −75cqh above, overshoot a little, settle at 0. `s` is seconds since this card's turn. */
const dropY = (s: number) => (s <= 0 ? -75 : s >= 0.85 ? 0 : -(1 - easeOutBack(s / 0.85)) * 75)

/** The gentle idle breeze, a rest angle per card. */
const breezeAt = (t: number, i: number) => Math.sin(t * 0.8 + i * 1.7) * 0.8 + Math.sin(t * 0.31 + i) * 0.5

/** The transform a hanging card is written with (also the SSR first paint). */
const hangTransform = (off: number, y: number, th: number) =>
  "translate3d(calc(" + off.toFixed(4) + " * var(--hc-gap) - 50%)," + y.toFixed(2) + "cqh,0) rotate(" + th.toFixed(3) + "deg)"

/** A palm frond: a bent midrib and pairs of pointed leaflets that shorten toward the tip. */
const frond = (seed: number, len: number, angle: number, bend: number, pairs: number) => {
  const r = rng(seed)
  const a = (angle * Math.PI) / 180
  const dir: Pt = [Math.cos(a), Math.sin(a)]
  const nrm: Pt = [-dir[1], dir[0]]
  const end: Pt = [dir[0] * len, dir[1] * len]
  const ctl: Pt = [dir[0] * len * 0.5 + nrm[0] * bend, dir[1] * len * 0.5 + nrm[1] * bend]
  const at = (t: number): Pt => [2 * (1 - t) * t * ctl[0] + t * t * end[0], 2 * (1 - t) * t * ctl[1] + t * t * end[1]]
  const tan = (t: number) => Math.atan2(2 * (1 - t) * ctl[1] + 2 * t * (end[1] - ctl[1]), 2 * (1 - t) * ctl[0] + 2 * t * (end[0] - ctl[0]))
  const rib = "M0 0 Q" + fmt(ctl[0]) + " " + fmt(ctl[1]) + " " + fmt(end[0]) + " " + fmt(end[1])
  const leaves: string[] = []
  for (let k = 0; k < pairs; k++) {
    const t = 0.12 + (k / pairs) * 0.86
    const p = at(t)
    const g = tan(t)
    const l = len * (0.42 - t * 0.3) * (0.85 + r() * 0.3)
    for (const side of [-1, 1]) {
      const b = g + side * (0.95 - t * 0.35) + (r() - 0.5) * 0.12
      const tip: Pt = [p[0] + Math.cos(b) * l, p[1] + Math.sin(b) * l]
      const w = l * 0.16
      const m: Pt = [(p[0] + tip[0]) / 2, (p[1] + tip[1]) / 2]
      const q: Pt = [-Math.sin(b) * w, Math.cos(b) * w]
      leaves.push(
        "M" + fmt(p[0]) + " " + fmt(p[1]) +
          " Q" + fmt(m[0] + q[0]) + " " + fmt(m[1] + q[1]) + " " + fmt(tip[0]) + " " + fmt(tip[1]) +
          " Q" + fmt(m[0] - q[0]) + " " + fmt(m[1] - q[1]) + " " + fmt(p[0]) + " " + fmt(p[1]) + "Z",
      )
    }
  }
  return { rib, leaves }
}

/** A decorative square code: three finder eyes and seeded modules. Not scannable. */
const codeBits = (seed: number, n: number) => {
  const r = rng(seed)
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      const dx = x - fx
      const dy = y - fy
      if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
        if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return 0
        const e = Math.min(dx, dy, 6 - dx, 6 - dy)
        return e === 1 ? 0 : 1
      }
    }
    return -1
  }
  const out: boolean[] = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const f = finder(x, y)
    out.push(f === -1 ? r() < 0.48 : f === 1)
  }
  return out
}

const sid = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "")
// #endregion logic

/* ------------------------------------------------------------------ */
/* defaults                                                            */
/* ------------------------------------------------------------------ */

const PALETTE: Required<HangingPalette> = {
  paper: "#f4eee6",
  ink: "#3b3a4a",
  pink: "#ee8fb0",
  blue: "#4f72b8",
  leaf: "#7db35f",
}

const DEFAULT_TABS: HangingTab[] = [
  {
    label: "Stories",
    sub: "Chapters",
    icon: "bloom",
    cards: [
      { title: "Dream", subtitle: "A Dream Before Dawn", tag: "Prologue", tagSub: "Dawn", art: "brush", colors: { bg: "#eef1f6", ink: "#3c5e9c", accent: "#f2a2bb" }, progress: 1, meta: ["8 pages", "6 min"], description: "Ink runs across a blank page before the story knows what it wants to be. A girl dreams of every season at once and wakes up holding a pressed petal." },
      { title: "Dew", subtitle: "Whispers of Spring Dew", tag: "Chapter I", tagSub: "Spring", art: "bouquet", colors: { bg: "#86bdeb", ink: "#3f6fb5", accent: "#f39ab8" }, progress: 1, meta: ["14 pages", "12 min"], description: "The first warm morning. Daisies on the windowsill, a letter that was never sent, and dew that keeps every secret it overhears." },
      { title: "Cicada", subtitle: "The Sound of Warm Summer", tag: "Chapter II", tagSub: "Summer", art: "window", colors: { bg: "#f6ecd8", ink: "#2f2b27", accent: "#efb24e" }, progress: 0.6, meta: ["18 pages", "16 min"], description: "Cicadas, a paper fan, and a window full of the bluest sky. She counts the clouds in each pane and makes a wish on the ninth." },
      { title: "Ginkgo", subtitle: "An Autumn Dusk Fairy Tale", tag: "Chapter III", tagSub: "Autumn", art: "silhouette", colors: { bg: "#f2a43c", ink: "#1e1a17", accent: "#2ea39b" }, meta: ["21 pages", "19 min"], description: "Ginkgo leaves fall like small gold fans. Let the fairy tale be as beautiful as autumn, and let it end a little later than the sun." },
      { title: "Stars", subtitle: "Stars of Deep Winter", tag: "Chapter IV", tagSub: "Winter", art: "frost", colors: { bg: "#2c4fa3", ink: "#14204a", accent: "#e8ee6c" }, meta: ["16 pages", "14 min"], description: "Frost draws windows on the windows. Above the quiet town the stars come out in a grid, one for every promise kept this year." },
      { title: "Away", subtitle: "Somewhere Far Away", tag: "Chapter V", tagSub: "Beyond", art: "figure", colors: { bg: "#cfe3f6", ink: "#3e6db0", accent: "#f39cc4" }, locked: true, lockHint: "Finish Chapter IV to unlock the last chapter", meta: ["24 pages", "22 min"], description: "The road goes on past the edge of the map. This is a girl who keeps walking." },
    ],
  },
  {
    label: "Notes",
    sub: "Essays",
    icon: "quill",
    cards: [
      { title: "Rain", subtitle: "Letters on a Rainy Day", tag: "Essay 01", tagSub: "Rainy day", art: "notes", colors: { bg: "#fbf7ef", ink: "#3a4a6b", accent: "#ef8fae" }, progress: 0.3, meta: ["5 min"], description: "Short notes written between showers, folded small enough to fit inside a teacup." },
      { title: "Film", subtitle: "Old Film Rolls", tag: "Essay 02", tagSub: "Old rolls", art: "film", colors: { bg: "#2a2522", ink: "#f3eadb", accent: "#f2a43c" }, meta: ["7 min"], description: "Three frames from a camera found in a drawer: a sea, a mountain, and a moon nobody remembers photographing." },
      { title: "Cat", subtitle: "The Cat by the Window", tag: "Essay 03", tagSub: "Sunbeam", art: "window", colors: { bg: "#fdf0f2", ink: "#4b3640", accent: "#ef8fae" }, meta: ["4 min"], description: "A cat, a sunbeam and the slowest afternoon of the year." },
      { title: "Breeze", subtitle: "Evening Breeze", tag: "Essay 04", tagSub: "Evening", art: "notes", colors: { bg: "#eef5ee", ink: "#355a46", accent: "#7db35f" }, meta: ["6 min"], description: "What the wind says to the laundry line when it thinks nobody is listening." },
    ],
  },
  {
    label: "Kit",
    sub: "Library",
    icon: "swirl",
    cards: [
      { title: "Colour", subtitle: "Colour Handbook", tag: "Library", tagSub: "Palette", art: "brush", colors: { bg: "#fdf1f4", ink: "#d0577e", accent: "#86bdeb" }, meta: ["PDF", "24 swatches"], description: "Every colour used in this book, mixed by hand and named after weather." },
      { title: "Type", subtitle: "Type Specimens", tag: "Library", tagSub: "Specimens", art: "notes", colors: { bg: "#f7f3ea", ink: "#2f2b27", accent: "#4f72b8" }, meta: ["6 families"], description: "Serifs for chapters, a pencil hand for the margins, and a script for everything unsaid." },
      { title: "Assets", subtitle: "Asset Pack", tag: "Library", tagSub: "Assets", art: "film", colors: { bg: "#1f2a3c", ink: "#f3eadb", accent: "#ef8fae" }, meta: ["ZIP", "120 MB"], description: "Stamps, tape, leaves and ribbons, ready for your own pages." },
      { title: "Flowers", subtitle: "Flower Calendar", tag: "Library", tagSub: "Calendar", art: "bouquet", colors: { bg: "#f7c6d4", ink: "#8a3557", accent: "#ffffff" }, meta: ["12 months"], description: "Which flower to press in which week, from plum blossom to winter sweet." },
    ],
  },
  {
    label: "Goals",
    sub: "Challenges",
    icon: "badge",
    cards: [
      { title: "Sketch", subtitle: "Seven-Day Sketch", tag: "Challenge", tagSub: "3 / 7 days", art: "figure", colors: { bg: "#fde9c8", ink: "#b5562c", accent: "#4f72b8" }, progress: 0.43, meta: ["Daily"], description: "One small drawing a day for a week. Today: someone walking away." },
      { title: "Books", subtitle: "A Book a Week", tag: "Challenge", tagSub: "Week 2", art: "frost", colors: { bg: "#3a7d6e", ink: "#0f2a24", accent: "#fbe07a" }, progress: 0.25, meta: ["Weekly"], description: "Read one book a week and leave a single line about it on the wall." },
      { title: "Diary", subtitle: "Hundred-Day Diary", tag: "Challenge", tagSub: "Locked", art: "notes", colors: { bg: "#fbf7ef", ink: "#3a4a6b", accent: "#f2a43c" }, locked: true, lockHint: "Finish the seven-day sketch first", meta: ["100 days"], description: "A page a day, for a hundred days. The last page is already written." },
    ],
  },
  {
    label: "Rituals",
    sub: "Weekly",
    icon: "camera",
    cards: [
      { title: "Read", subtitle: "Morning Reading", tag: "Monday", tagSub: "Morning", art: "bouquet", colors: { bg: "#bfe0f7", ink: "#2f5f9e", accent: "#fbe07a" }, progress: 1, meta: ["10 min"], description: "Ten quiet minutes before anyone else is awake." },
      { title: "Copy", subtitle: "Copy a Poem", tag: "Wednesday", tagSub: "Ink", art: "brush", colors: { bg: "#f6f1e7", ink: "#2b2b2b", accent: "#ee8fb0" }, progress: 0.5, meta: ["15 min"], description: "Copy one poem by hand, slowly, in your best ink." },
      { title: "Photo", subtitle: "One Photograph", tag: "Friday", tagSub: "Camera", art: "film", colors: { bg: "#3b2f2a", ink: "#f3eadb", accent: "#86bdeb" }, meta: ["Anytime"], description: "Take exactly one photograph this week and keep it." },
      { title: "Walk", subtitle: "A Long Walk", tag: "Sunday", tagSub: "Outside", art: "silhouette", colors: { bg: "#9fd3c7", ink: "#1f3b36", accent: "#f39ab8" }, meta: ["1 hour"], description: "Walk somewhere you have never been, then write down the colour of the sky." },
    ],
  },
]

const DEFAULT_CREDITS: CreditItem[] = [
  { label: "Works", sub: "Made by", value: "Kedhareswer" },
  { label: "Guide", sub: "Mentor", value: "21st.dev" },
  { label: "Contact", sub: "Say hello", value: "hello@example.com", href: "mailto:hello@example.com" },
]

const SERIF = 'Georgia,"Times New Roman","Songti SC","STSong","Noto Serif CJK SC","Source Han Serif SC","Noto Serif SC",serif'
const SCRIPT = '"Snell Roundhand","Segoe Script","Brush Script MT","Lucida Handwriting",cursive'

const ART_ORDER: PosterArt[] = ["brush", "bouquet", "window", "silhouette", "frost", "figure", "notes", "film"]

/** Each poster style's own colours, used for whatever a card's `colors` leaves out. */
const ART_COLORS: Record<PosterArt, Required<PosterColors>> = {
  brush: { bg: "#eef1f6", ink: "#3c5e9c", accent: "#f2a2bb" },
  bouquet: { bg: "#86bdeb", ink: "#3f6fb5", accent: "#f39ab8" },
  window: { bg: "#f6ecd8", ink: "#2f2b27", accent: "#efb24e" },
  silhouette: { bg: "#f2a43c", ink: "#1e1a17", accent: "#2ea39b" },
  frost: { bg: "#2c4fa3", ink: "#14204a", accent: "#e8ee6c" },
  figure: { bg: "#cfe3f6", ink: "#3e6db0", accent: "#f39cc4" },
  notes: { bg: "#fbf7ef", ink: "#3a4a6b", accent: "#ef8fae" },
  film: { bg: "#2a2522", ink: "#f3eadb", accent: "#f2a43c" },
}

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

const keyOf = (t: number, i: number) => t + ":" + i

/* ------------------------------------------------------------------ */
/* posters                                                             */
/* ------------------------------------------------------------------ */

type ArtProps = { c: Required<PosterColors>; id: string; title: string; sub: string; note: string; mark: string; seed: number }

const chars = (s: string) => Array.from(s)

/** Han, kana and hangul read best stacked two to a row; anything else keeps its words. */
const isCJK = (s: string) => /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(s)

/** The poster's small print: the first few words of the description, wrapped. */
const smallPrint = (text: string, width: number, rows: number) => {
  const out: string[] = []
  let line = ""
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if ((line + " " + w).trim().length > width) {
      out.push(line)
      line = w
      if (out.length === rows) break
    } else line = (line + " " + w).trim()
  }
  if (out.length < rows && line) out.push(line)
  return out.slice(0, rows)
}

function VText({ text, x, y, size, fill, weight = 700, stroke }: { text: string; x: number; y: number; size: number; fill: string; weight?: number; stroke?: string }) {
  if (!isCJK(text)) {
    // Latin titles run down the poster like a book spine
    const fit = Math.min(size, 300 / Math.max(1, chars(text).length))
    return (
      <text x={x} y={y - size} transform={"rotate(90 " + x + " " + (y - size) + ")"} dominantBaseline="middle" fontFamily={SERIF} fontSize={fit} fontWeight={weight} fill={fill} stroke={stroke} strokeWidth={stroke ? 4 : undefined} style={{ paintOrder: "stroke" }} letterSpacing="1">
        {text}
      </text>
    )
  }
  return (
    <g fontFamily={SERIF} fontSize={size} fontWeight={weight} fill={fill} textAnchor="middle" stroke={stroke} strokeWidth={stroke ? 4 : undefined} style={{ paintOrder: "stroke" }}>
      {chars(text).map((ch, i) => (
        <text key={i} x={x} y={y + i * size * 1.06}>{ch}</text>
      ))}
    </g>
  )
}

function Shade({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id + "-shade"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".12" />
        </linearGradient>
      </defs>
      <rect width="200" height="276" fill={"url(#" + id + "-shade)"} />
    </>
  )
}

function ArtBrush({ c, id, title, sub, mark, seed }: ArtProps) {
  const r = rng(seed)
  const strokes = [
    "M18 70 C60 28 128 30 120 88 S52 150 96 178 S170 170 186 132",
    "M150 22 C168 70 120 118 150 170 S178 236 140 262",
    "M24 214 C64 190 118 238 182 206",
    "M40 34 C30 60 54 70 44 96",
  ]
  const t = isCJK(title) ? chars(title).slice(0, 4).join("") : title
  return (
    <>
      <rect width="200" height="276" fill={c.bg} />
      <g fill={c.ink} opacity=".1">
        {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={fmt(r() * 200)} cy={fmt(r() * 276)} r={fmt(0.4 + r() * 1.4)} />)}
      </g>
      {strokes.map((d, i) => (
        <g key={i} fill="none" stroke={c.ink} strokeLinecap="round">
          <path d={d} strokeWidth={[18, 11, 13, 9][i]} opacity=".13" />
          <path d={d} strokeWidth={[7, 4, 5, 3][i]} opacity=".85" />
          <path d={d} strokeWidth="1" strokeDasharray="2 5 9 3" transform="translate(3 -4)" opacity=".55" />
        </g>
      ))}
      <path d="M-5 124 C40 100 70 152 110 128 S170 96 210 120" fill="none" stroke={c.accent} strokeWidth="3.2" />
      <path d="M-5 131 C40 109 72 158 112 134 S170 104 210 128" fill="none" stroke={c.accent} strokeWidth="1" opacity=".7" />
      <VText text={t} x={52} y={98} size={chars(t).length > 2 ? 26 : 36} fill={c.ink} stroke={c.bg} weight={900} />
      {mark && <text x="176" y="258" fontFamily={SERIF} fontSize="30" fontWeight="900" fill={c.ink} textAnchor="middle">{mark}</text>}
      <text x="14" y="262" fontSize="6.4" letterSpacing="1.6" fill={c.ink} opacity=".75">{sub.toUpperCase()}</text>
      <Shade id={id} />
    </>
  )
}

function Daisy({ x, y, r, rot, petal, core }: { x: number; y: number; r: number; rot: number; petal: string; core: string }) {
  return (
    <g transform={"translate(" + fmt(x) + " " + fmt(y) + ") rotate(" + fmt(rot) + ")"}>
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx="0" cy={fmt(-r * 0.55)} rx={fmt(r * 0.2)} ry={fmt(r * 0.5)} fill={petal} stroke="#e9d7de" strokeWidth=".4" transform={"rotate(" + i * 30 + ")"} />
      ))}
      <circle r={fmt(r * 0.26)} fill={core} />
    </g>
  )
}

function Blossom({ x, y, r, rot, fill }: { x: number; y: number; r: number; rot: number; fill: string }) {
  return (
    <g transform={"translate(" + fmt(x) + " " + fmt(y) + ") rotate(" + fmt(rot) + ")"}>
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={i} cx="0" cy={fmt(-r * 0.5)} rx={fmt(r * 0.34)} ry={fmt(r * 0.52)} fill={fill} opacity=".92" transform={"rotate(" + i * 60 + ")"} />
      ))}
      <circle r={fmt(r * 0.2)} fill="#fff3b0" />
    </g>
  )
}

function ArtBouquet({ c, id, title, sub, seed }: ArtProps) {
  const r = rng(seed)
  const size = Math.min(28, 150 / Math.max(1, chars(title).length))
  return (
    <>
      <defs>
        <linearGradient id={id + "-sky"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.bg} />
          <stop offset=".75" stopColor="#f3f8fc" />
        </linearGradient>
      </defs>
      <rect width="200" height="276" fill={"url(#" + id + "-sky)"} />
      <g fill="#fff" opacity=".22">
        {[0, 1, 2, 3].map((i) => <polygon key={i} points={-30 + i * 34 + ",0 " + (i * 34 - 6) + ",0 " + (i * 62 + 120) + ",276 " + (i * 62 + 84) + ",276"} />)}
      </g>
      <text x="100" y="50" textAnchor="middle" fontFamily={SERIF} fontSize={size} fontWeight="800" fill={c.ink} letterSpacing="2" stroke="#fff" strokeWidth="3" style={{ paintOrder: "stroke" }}>{title}</text>
      <text x="100" y="64" textAnchor="middle" fontSize="6" letterSpacing="1.4" fill={c.ink} opacity=".8">{sub.toUpperCase()}</text>
      <path d="M20 76 C60 64 90 90 130 74 S180 66 192 80" fill="none" stroke={c.accent} strokeWidth="2.4" />
      <g stroke="#6f9f57" strokeWidth="1.4" fill="none">
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={"M" + fmt(100 + (i - 4) * 6) + " 276 Q" + fmt(100 + (i - 4) * 10) + " 236 " + fmt(40 + i * 15) + " " + fmt(196 + r() * 24)} />)}
      </g>
      {Array.from({ length: 10 }, (_, i) => {
        const x = fmt(30 + r() * 140)
        const y = fmt(220 + r() * 50)
        return <ellipse key={i} cx={x} cy={y} rx="4" ry="15" fill={i % 2 ? "#8cc06d" : "#6fa35a"} transform={"rotate(" + fmt(-50 + r() * 100) + " " + x + " " + y + ")"} />
      })}
      {Array.from({ length: 7 }, (_, i) => <Blossom key={i} x={24 + r() * 152} y={200 + r() * 56} r={9 + r() * 6} rot={r() * 60} fill={c.accent} />)}
      {Array.from({ length: 9 }, (_, i) => <Daisy key={i} x={20 + r() * 160} y={198 + r() * 66} r={11 + r() * 8} rot={r() * 30} petal="#fff" core="#f7c948" />)}
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse key={i} cx={fmt(r() * 200)} cy={fmt(80 + r() * 130)} rx="2.2" ry="1.2" fill={i % 3 ? "#fff" : c.accent} opacity=".9" transform={"rotate(" + fmt(r() * 180) + " " + fmt(100) + " 140)"} />
      ))}
      <Shade id={id} />
    </>
  )
}

function ArtWindow({ c, id, title, sub, seed }: ArtProps) {
  const r = rng(seed)
  return (
    <>
      <defs>
        <linearGradient id={id + "-sky"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fbdf0" />
          <stop offset="1" stopColor="#d9eefc" />
        </linearGradient>
        <linearGradient id={id + "-grass"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ad16f" />
          <stop offset="1" stopColor="#5ea94c" />
        </linearGradient>
        <clipPath id={id + "-pane"}><rect x="52" y="42" width="96" height="106" /></clipPath>
      </defs>
      <rect width="200" height="276" fill={c.bg} />
      <g stroke={c.ink} opacity=".05">
        {Array.from({ length: 22 }, (_, i) => <line key={i} x1="0" x2="200" y1={i * 13} y2={i * 13} />)}
      </g>
      <polygon points="58,154 142,154 186,262 30,262" fill={c.accent} opacity=".16" />
      <rect x="44" y="34" width="112" height="122" fill="#fffaf0" stroke="#d9c9a8" />
      <g clipPath={"url(#" + id + "-pane)"}>
        <rect x="52" y="42" width="96" height="106" fill={"url(#" + id + "-sky)"} />
        {Array.from({ length: 5 }, (_, i) => {
          const x = 52 + r() * 96
          const y = 52 + r() * 44
          return (
            <g key={i} fill="#fff" opacity=".95">
              <ellipse cx={fmt(x)} cy={fmt(y)} rx="14" ry="6" />
              <ellipse cx={fmt(x + 8)} cy={fmt(y - 4)} rx="9" ry="6" />
            </g>
          )
        })}
        <path d="M40 132 Q80 112 120 126 T170 120 V160 H40 Z" fill={"url(#" + id + "-grass)"} />
      </g>
      <g stroke="#fffaf0" strokeWidth="4">
        <line x1="84" y1="42" x2="84" y2="148" />
        <line x1="116" y1="42" x2="116" y2="148" />
        <line x1="52" y1="77" x2="148" y2="77" />
        <line x1="52" y1="112" x2="148" y2="112" />
      </g>
      <text x="100" y="206" textAnchor="middle" fontFamily={SCRIPT} fontSize={Math.min(22, 300 / Math.max(8, sub.length))} fill={c.accent} opacity=".6" transform="rotate(-6 100 206)">{sub}</text>
      <text x="100" y="232" textAnchor="middle" fontFamily={SERIF} fontSize={Math.min(30, 140 / Math.max(1, chars(title).length))} fontWeight="700" fill={c.ink} transform="skewX(-10) translate(40 0)">{title}</text>
      <Shade id={id} />
    </>
  )
}

const GINKGO = "M0 0 C-3 -6 -13 -12 -14 -20 C-6 -26 6 -26 14 -20 C13 -12 3 -6 0 0 Z"

function ArtSilhouette({ c, id, title, sub, note, seed }: ArtProps) {
  const r = rng(seed)
  const t = chars(title)
  const rows = isCJK(title) ? [t.slice(0, 2).join(""), t.slice(2, 4).join("")].filter(Boolean) : title.split(/\s+/).slice(0, 3)
  const size = Math.min(36, 190 / Math.max(2, ...rows.map((w) => chars(w).length)))
  return (
    <>
      <rect width="200" height="276" fill={c.bg} />
      <g stroke="#fff" opacity=".12">
        {Array.from({ length: 30 }, (_, i) => <line key={i} x1={i * 14 - 140} y1="276" x2={i * 14} y2="0" />)}
      </g>
      <path d="M150 140 C174 180 150 226 176 276 L200 276 L200 110 Z" fill={c.accent} opacity=".75" />
      <path
        d="M200 30 C176 22 146 30 132 52 C124 64 124 76 126 86 C120 94 114 102 110 110 C112 113 116 114 120 115 C118 120 120 124 117 128 C119 131 121 134 119 138 C121 144 124 150 130 152 C138 154 142 160 142 172 L140 210 C150 220 176 222 200 222 Z"
        fill={c.accent}
      />
      <g fill="#f8b9cb" stroke="#f8b9cb">
        <path d="M156 36 c-14 -12 -24 2 -10 8 z M156 36 c12 -14 24 -2 10 8 z" />
        <path d="M156 38 l-6 18 M156 38 l8 16" strokeWidth="2" fill="none" />
      </g>
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={GINKGO} fill={i % 3 ? "#fbe07a" : "#fff"} opacity={i % 3 ? 0.95 : 0.7} transform={"translate(" + fmt(10 + r() * 130) + " " + fmt(120 + r() * 140) + ") rotate(" + fmt(r() * 360) + ") scale(" + fmt(0.5 + r() * 0.6) + ")"} />
      ))}
      {rows.map((row, i) => (
        <text key={i} x="18" y={20 + size + i * size * 1.1} fontFamily={SERIF} fontSize={size} fontWeight="900" fill={c.ink}>{row}</text>
      ))}
      <g fontSize="5.4" fill={c.ink} opacity=".75">
        <text x="18" y="236">{sub}</text>
        {smallPrint(note, 34, 2).map((l, i) => <text key={i} x="18" y={244 + i * 8}>{l}</text>)}
      </g>
      <Shade id={id} />
    </>
  )
}

function ArtFrost({ c, id, title, sub, note, seed }: ArtProps) {
  const r = rng(seed)
  return (
    <>
      <defs>
        <pattern id={id + "-hatch"} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#fff" strokeWidth=".9" opacity=".6" />
        </pattern>
        <linearGradient id={id + "-deep"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".38" />
        </linearGradient>
      </defs>
      <rect width="200" height="276" fill={c.bg} />
      <rect width="200" height="276" fill={"url(#" + id + "-deep)"} />
      <g fill="#fff">
        {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={fmt(r() * 200)} cy={fmt(r() * 276)} r={fmt(0.3 + r() * 1.1)} opacity={fmt(0.4 + r() * 0.6)} />)}
      </g>
      <text x="100" y="60" textAnchor="middle" fontFamily={SCRIPT} fontSize="46" fill="#fff" opacity=".12">{sub.split(" ").pop()}</text>
      <text x="22" y="38" fontSize="5.6" letterSpacing="1.2" fill="#fff" opacity=".7">{sub.toUpperCase()}</text>
      {Array.from({ length: 8 }, (_, i) => {
        const x = 22 + (i % 4) * 40
        const y = 82 + Math.floor(i / 4) * 38
        return <rect key={i} x={x} y={y} width="32" height="28" rx="7" fill={"url(#" + id + "-hatch)"} stroke="#fff" strokeWidth="1.5" />
      })}
      <path d="M14 172 L186 172" stroke="#fff" strokeDasharray="1 4" opacity=".6" />
      <text x="100" y="214" textAnchor="middle" fontFamily={SERIF} fontSize={Math.min(30, 160 / Math.max(1, chars(title).length))} fontWeight="900" fill={c.accent} stroke={c.ink} strokeWidth="5" style={{ paintOrder: "stroke" }} transform="skewX(-6) translate(22 0)">{title}</text>
      <g fontSize="5" fill="#fff" opacity=".65">
        {smallPrint(note, 40, 2).map((l, i) => <text key={i} x="22" y={240 + i * 8}>{l}</text>)}
      </g>
      <Shade id={id} />
    </>
  )
}

const SPARK = "M0 -6 C1 -1 1 -1 6 0 C1 1 1 1 0 6 C-1 1 -1 1 -6 0 C-1 -1 -1 -1 0 -6 Z"

function ArtFigure({ c, id, title, sub, seed }: ArtProps) {
  const r = rng(seed)
  return (
    <>
      <rect width="200" height="276" fill={c.bg} />
      <circle cx="150" cy="70" r="46" fill="#fff" opacity=".45" />
      <g fill="#fff" opacity=".8">
        {Array.from({ length: 4 }, (_, i) => {
          const x = r() * 200
          const y = 150 + r() * 110
          return (
            <g key={i}>
              <ellipse cx={fmt(x)} cy={fmt(y)} rx="26" ry="8" />
              <ellipse cx={fmt(x + 12)} cy={fmt(y - 6)} rx="16" ry="8" />
            </g>
          )
        })}
      </g>
      <g transform="translate(132 54)" fill={c.accent}>
        <path d="M0 6 C-20 8 -24 44 -18 76 C-12 92 16 92 24 76 C30 44 20 8 0 6 Z" opacity=".85" />
        <circle cx="2" cy="24" r="14" />
        <path d="M-12 46 C-16 70 -28 112 -36 142 L40 142 C32 112 20 70 16 46 Z" />
        <path d="M-12 50 C-24 70 -30 86 -26 98 M16 50 C26 66 30 80 28 94" stroke={c.accent} strokeWidth="5" strokeLinecap="round" fill="none" />
        <rect x="-11" y="140" width="7" height="58" rx="3" />
        <rect x="7" y="140" width="7" height="58" rx="3" />
        <path d="M14 30 C40 26 54 42 70 36" stroke={c.ink} strokeWidth="2" fill="none" opacity=".6" />
      </g>
      <VText text={isCJK(title) ? chars(title).slice(0, 4).join("") : title} x={40} y={74} size={chars(title).length > 2 ? 28 : 38} fill={c.ink} weight={900} />
      <g fill="#fff">
        {[[60, 190], [96, 128], [180, 150], [26, 230]].map(([x, y], i) => <path key={i} d={SPARK} transform={"translate(" + x + " " + y + ") scale(" + (0.7 + i * 0.2) + ")"} />)}
      </g>
      <text x="16" y="262" fontSize="6" letterSpacing="1.4" fill={c.ink} opacity=".8">{sub.toUpperCase()}</text>
      <Shade id={id} />
    </>
  )
}

function ArtNotes({ c, id, title, sub, seed }: ArtProps) {
  const r = rng(seed)
  const lines: string[] = []
  for (let y = 88; y < 250; y += 14) {
    const len = 60 + r() * 100
    let d = "M38 " + (y - 3)
    for (let x = 38; x < 38 + len; x += 6) d += " q3 " + fmt(-2 - r() * 3) + " 6 0"
    lines.push(d)
  }
  return (
    <>
      <rect width="200" height="276" fill={c.bg} />
      <g stroke="#9fc0e6" opacity=".6">
        {Array.from({ length: 15 }, (_, i) => <line key={i} x1="0" x2="200" y1={74 + i * 14} y2={74 + i * 14} />)}
      </g>
      <line x1="30" y1="0" x2="30" y2="276" stroke={c.accent} opacity=".55" />
      <text x="38" y="46" fontFamily={SERIF} fontSize={Math.min(26, 130 / Math.max(1, chars(title).length))} fontWeight="800" fill={c.ink}>{title}</text>
      <text x="38" y="60" fontSize="5.8" letterSpacing="1.2" fill={c.ink} opacity=".7">{sub.toUpperCase()}</text>
      <g fill="none" stroke={c.ink} strokeWidth="1" opacity=".5" strokeLinecap="round">
        {lines.map((d, i) => <path key={i} d={d} />)}
      </g>
      <g transform="translate(150 200) rotate(-14)">
        <path d="M0 60 C2 30 -4 10 0 -10" stroke="#6f9f57" strokeWidth="1.6" fill="none" />
        <ellipse cx="-8" cy="30" rx="4" ry="10" fill="#8cc06d" transform="rotate(-40 -8 30)" />
        <Blossom x={0} y={-12} r={14} rot={10} fill={c.accent} />
        <rect x="-22" y="34" width="44" height="12" fill={c.accent} opacity=".35" transform="rotate(12)" />
      </g>
      <Shade id={id} />
    </>
  )
}

function ArtFilm({ c, id, title, sub }: ArtProps) {
  return (
    <>
      <defs>
        <linearGradient id={id + "-f1"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.accent} />
          <stop offset="1" stopColor="#fff2dc" />
        </linearGradient>
        <linearGradient id={id + "-f3"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2a52" />
          <stop offset="1" stopColor="#4f72b8" />
        </linearGradient>
      </defs>
      <rect width="200" height="276" fill={c.bg} />
      <rect x="30" y="0" width="140" height="276" fill="#141110" />
      <g fill={c.ink} opacity=".85">
        {Array.from({ length: 20 }, (_, i) => (
          <g key={i}>
            <rect x="35" y={4 + i * 14} width="7" height="8" rx="1.5" />
            <rect x="158" y={4 + i * 14} width="7" height="8" rx="1.5" />
          </g>
        ))}
      </g>
      <g>
        <rect x="50" y="14" width="100" height="66" fill={"url(#" + id + "-f1)"} />
        <circle cx="100" cy="56" r="12" fill="#fff6d8" />
        <rect x="50" y="62" width="100" height="18" fill="#4f8fc0" opacity=".85" />
        <rect x="50" y="90" width="100" height="66" fill="#d9e8ef" />
        <path d="M50 156 L80 112 L98 134 L118 104 L150 156 Z" fill={c.bg} opacity=".85" />
        <path d="M112 112 L118 104 L124 112 Z" fill="#fff" />
        <rect x="50" y="166" width="100" height="66" fill={"url(#" + id + "-f3)"} />
        <circle cx="122" cy="190" r="10" fill="#fff6d8" />
        <circle cx="127" cy="186" r="9" fill="#1d2a52" />
      </g>
      <rect x="20" y="238" width="160" height="28" fill={c.ink} transform="rotate(-3 100 252)" />
      <text x="100" y="254" textAnchor="middle" fontFamily={SERIF} fontSize={Math.min(16, 110 / Math.max(1, chars(title).length))} fontWeight="800" fill={c.bg} transform="rotate(-3 100 252)">{title}</text>
      <text x="100" y="262" textAnchor="middle" fontSize="4.6" letterSpacing="1.2" fill={c.bg} opacity=".8" transform="rotate(-3 100 252)">{sub.toUpperCase()}</text>
      <Shade id={id} />
    </>
  )
}

const ARTS: Record<PosterArt, (p: ArtProps) => React.ReactElement> = {
  brush: ArtBrush,
  bouquet: ArtBouquet,
  window: ArtWindow,
  silhouette: ArtSilhouette,
  frost: ArtFrost,
  figure: ArtFigure,
  notes: ArtNotes,
  film: ArtFilm,
}

function Poster({ card, id, index }: { card: HangingCard; id: string; index: number }) {
  const art = card.art ?? ART_ORDER[index % ART_ORDER.length]
  const c: Required<PosterColors> = { ...(ART_COLORS[art] ?? ART_COLORS.brush), ...card.colors }
  const Art = ARTS[art] ?? ArtBrush
  return (
    <svg className="hc-svg" viewBox="0 0 200 276" width="200" height="276" aria-hidden="true" focusable="false">
      {card.image ? (
        <image href={card.image} width="200" height="276" preserveAspectRatio="xMidYMid slice" />
      ) : (
        <Art c={c} id={id} title={card.title} sub={card.subtitle ?? ""} note={card.description ?? ""} mark={chars(card.tag ?? "").slice(0, 1).join("")} seed={hash(card.title + art)} />
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* chrome                                                              */
/* ------------------------------------------------------------------ */

const ICONS: Record<TabIcon, string> = {
  bloom: "M4 7c3-1.4 6-1.2 8 .8 2-2 5-2.2 8-.8v11.5c-3-1.2-6-1-8 1-2-2-5-2.2-8-1z M12 7.8v11.6",
  quill: "M6 3h8l4 4v14H6z M14 3v4h4 M9 15l5.5-5.5 2 2L11 17H9z",
  swirl: "M12 3a9 9 0 1 0 9 9c0-3.2-2.3-5.4-5.2-5.4S11.4 8.6 11.4 11s1.6 3 3 3",
  badge: "M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6l-4.9 2.6.9-5.5-4-3.9 5.5-.8z",
  camera: "M4 8h3.2l1.8-3h6l1.8 3H20v11H4z M12 16.6a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8z",
  star: "M12 4c1 4 4 7 8 8-4 1-7 4-8 8-1-4-4-7-8-8 4-1 7-4 8-8z",
}

function Icon({ d, size = 24 }: { d: string; size?: number }) {
  return (
    <svg className="hc-svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  )
}

function Leaves({ id }: { id: string }) {
  const left = [frond(11, 230, -62, -30, 13), frond(12, 200, -32, 26, 12), frond(13, 170, -88, 14, 10)]
  const right = [frond(21, 220, -118, 30, 13), frond(22, 180, -150, -20, 11)]
  return (
    <div className="hc-leaves" aria-hidden="true">
      <svg className="hc-svg hc-leaf-l" viewBox="-40 -260 340 280" width="340" height="280" focusable="false">
        <defs>
          <linearGradient id={id + "-leaf"} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--hc-leaf)" />
            <stop offset="1" stopColor="#d6edb0" />
          </linearGradient>
        </defs>
        {left.map((f, i) => (
          <g key={i} className={"hc-sway hc-sway-" + i} fill={"url(#" + id + "-leaf)"} stroke="var(--hc-leaf)" strokeWidth=".6">
            {f.leaves.map((d, k) => <path key={k} d={d} />)}
            <path d={f.rib} fill="none" strokeWidth="2.4" />
          </g>
        ))}
      </svg>
      <svg className="hc-svg hc-leaf-r" viewBox="-300 -260 340 280" width="340" height="280" focusable="false">
        <g className="hc-sway hc-sway-1" fill={"url(#" + id + "-leaf)"} stroke="var(--hc-leaf)" strokeWidth=".8">
          <path d="M0 0 C-40 -40 -120 -60 -170 -150 C-100 -130 -20 -90 0 0 Z" />
          <path d="M0 0 C-50 -50 -110 -90 -168 -148" fill="none" strokeWidth="1.6" />
          {[0.25, 0.42, 0.6, 0.76].map((t, k) => (
            <path key={k} d={"M" + fmt(-170 * t) + " " + fmt(-150 * t * t - 10 * t) + " l" + fmt(-18 + k * 3) + " " + fmt(8 - k * 2)} fill="none" strokeWidth=".9" />
          ))}
        </g>
        {right.map((f, i) => (
          <g key={i} className={"hc-sway hc-sway-" + (i + 2)} fill={"url(#" + id + "-leaf)"} stroke="var(--hc-leaf)" strokeWidth=".6">
            {f.leaves.map((d, k) => <path key={k} d={d} />)}
            <path d={f.rib} fill="none" strokeWidth="2.4" />
          </g>
        ))}
      </svg>
      <svg className="hc-svg hc-vine" viewBox="0 0 120 260" width="120" height="260" focusable="false">
        <g className="hc-sway hc-sway-3">
          <path d="M80 0 C70 60 100 100 74 150 S60 220 82 258" fill="none" stroke="var(--hc-leaf)" strokeWidth="1.8" />
          {Array.from({ length: 9 }, (_, i) => {
            const y = 20 + i * 26
            const x = 80 + Math.sin(i * 1.3) * 12
            const s = i % 2 ? 1 : -1
            return <path key={i} d="M0 0 C6 -10 18 -6 14 4 C12 10 4 12 0 0 Z" fill={"url(#" + id + "-leaf)"} transform={"translate(" + fmt(x) + " " + y + ") scale(" + s + " 1) rotate(" + (s * 10) + ")"} />
          })}
        </g>
      </svg>
    </div>
  )
}

function Code({ seed }: { seed: number }) {
  const n = 21
  const bits = codeBits(seed, n)
  let d = ""
  bits.forEach((b, k) => {
    if (b) d += "M" + (k % n) + " " + Math.floor(k / n) + "h1v1h-1z"
  })
  return (
    <svg className="hc-svg hc-code" viewBox="-1 -1 23 23" width="44" height="44" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      <rect x="-1" y="-1" width="23" height="23" fill="#fff" />
      <path d={d} fill="var(--hc-ink)" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* component                                                           */
/* ------------------------------------------------------------------ */

type Item = { card: HangingCard; t: number; i: number }
type Open = { t: number; i: number; key: string }

export default function HangingChapterSelect({
  title = "BOOKS AND FILMS",
  script = "This is a girl",
  tabs = DEFAULT_TABS,
  initialTab = 0,
  initialIndex,
  credits = DEFAULT_CREDITS,
  brand = "Kedhar",
  brandSub = "Reading Room",
  site = "21st.dev/@kedhareswer",
  qrImage,
  palette,
  leaves = true,
  breeze = true,
  animateIn = true,
  onBack,
  onOpen,
  onKeepChange,
  height = "100svh",
  className = "",
}: HangingChapterSelectProps) {
  const uid = sid(React.useId())
  const pal = { ...PALETTE, ...palette }
  const safeTabs = tabs.length ? tabs : DEFAULT_TABS
  const startTab = clamp(initialTab, 0, safeTabs.length - 1)
  const mid = (n: number) => Math.max(0, Math.floor((n - 1) / 2))
  const startIndex = clamp(initialIndex ?? mid(safeTabs[startTab].cards.length), 0, Math.max(0, safeTabs[startTab].cards.length - 1))

  const [tab, setTab] = React.useState(startTab)
  const [savedView, setSavedView] = React.useState(false)
  const [kept, setKept] = React.useState([] as string[])
  const [active, setActive] = React.useState(startIndex)
  const [open, setOpen] = React.useState(null as Open | null)
  const [closing, setClosing] = React.useState(false)
  const [toast, setToast] = React.useState({ text: "", n: 0 })

  const items: Item[] = savedView
    ? kept
        .map((k) => {
          const [t, i] = k.split(":").map(Number)
          return { card: safeTabs[t]?.cards[i], t, i }
        })
        .filter((x): x is Item => !!x.card)
    : safeTabs[tab].cards.map((card, i) => ({ card, t: tab, i }))
  const n = items.length

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const sceneRef = React.useRef(null as HTMLDivElement | null)
  const trackRef = React.useRef(null as HTMLDivElement | null)
  const probeRef = React.useRef(null as HTMLSpanElement | null)
  const hangRefs = React.useRef([] as (HTMLDivElement | null)[])
  const cardRefs = React.useRef([] as (HTMLButtonElement | null)[])
  const posterRef = React.useRef(null as HTMLDivElement | null)
  const primaryRef = React.useRef(null as HTMLElement | null)
  const fromRect = React.useRef(null as DOMRect | null)

  // everything the animation loop reads lives here, so it never re-renders per frame
  const S = React.useRef({
    pos: startIndex,
    vel: 0,
    prevVel: 0,
    target: startIndex,
    n,
    gap: 200,
    width: 800,
    th: [] as number[],
    om: [] as number[],
    drop: -1,
    dragging: false,
    reduced: false,
    breeze,
    active: startIndex,
    wheelTimer: 0 as ReturnType<typeof setTimeout> | 0,
  })
  S.current.n = n
  S.current.breeze = breeze

  const say = React.useCallback((text: string) => setToast((t) => ({ text, n: t.n + 1 })), [])
  React.useEffect(() => {
    if (!toast.text) return
    const id = setTimeout(() => setToast((t) => ({ ...t, text: "" })), 2600)
    return () => clearTimeout(id)
  }, [toast.n, toast.text])

  /* ---- measuring ---- */
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      S.current.gap = probeRef.current?.offsetWidth || 200
      S.current.width = root.clientWidth || 800
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => { S.current.reduced = mq.matches }
    onMq()
    mq.addEventListener("change", onMq)
    return () => {
      ro.disconnect()
      mq.removeEventListener("change", onMq)
    }
  }, [])

  /* ---- a new line of cards drops in ---- */
  const lineKey = (savedView ? "saved" : "tab" + tab) + ":" + n
  useIsoLayoutEffect(() => {
    const s = S.current
    const r = rng(hash(lineKey))
    s.th = Array.from({ length: n }, () => (r() - 0.5) * 18)
    s.om = Array.from({ length: n }, () => 0)
    s.drop = animateIn && !s.reduced ? performance.now() / 1000 : -1
    paint(performance.now() / 1000, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineKey])

  /* ---- the loop ---- */
  const paint = (t: number, dt: number) => {
    const s = S.current
    const accel = dt > 0 ? (s.vel - s.prevVel) / dt : 0
    s.prevVel = s.vel
    for (let i = 0; i < s.n; i++) {
      const el = hangRefs.current[i]
      if (!el) continue
      const off = i - s.pos
      const L = layout(off)
      let y = 0
      if (s.drop >= 0) y = dropY(t - s.drop - i * 0.07)
      let th = s.th[i] ?? 0
      let om = s.om[i] ?? 0
      if (s.reduced) {
        th = 0
        om = 0
        y = 0
      } else if (dt > 0) {
        const rest = s.breeze ? breezeAt(t, i) : 0
        const k = 24 + (hash("k" + i) % 100) / 10
        ;[th, om] = swing(th, om, rest, clamp(-accel * s.gap * 0.0042, -900, 900), k, dt)
      }
      s.th[i] = th
      s.om[i] = om
      el.style.transform = hangTransform(off, y, th)
      el.style.setProperty("--s", fmt(L.scale))
      el.style.setProperty("--lift", fmt(L.lift))
      el.style.opacity = fmt(L.opacity)
      el.style.zIndex = String(L.z)
    }
    if (s.drop >= 0 && t - s.drop > 0.9 + s.n * 0.07) s.drop = -1
  }

  React.useEffect(() => {
    let raf = 0
    let last = performance.now() / 1000
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    if (rootRef.current) io.observe(rootRef.current)
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const now = performance.now() / 1000
      const dt = Math.min(0.05, now - last)
      last = now
      if (!visible || document.hidden) return
      const s = S.current
      if (s.reduced) {
        if (!s.dragging) s.pos = s.target
        s.vel = 0
      } else if (!s.dragging) {
        ;[s.pos, s.vel] = spring(s.pos, s.vel, s.target, dt)
      }
      const a = clamp(Math.round(s.pos), 0, Math.max(0, s.n - 1))
      if (a !== s.active) {
        s.active = a
        setActive(a)
      }
      paint(now, dt)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const go = React.useCallback((i: number, focus = false) => {
    const s = S.current
    s.target = clamp(i, 0, Math.max(0, s.n - 1))
    if (focus) cardRefs.current[s.target]?.focus({ preventScroll: true })
  }, [])

  const poke = (i: number, amount: number) => {
    const s = S.current
    if (s.reduced) return
    s.om[i] = (s.om[i] ?? 0) + amount
  }

  /* ---- drag, flick, brush ---- */
  const drag = React.useRef({ id: -1, x: 0, y: 0, pos: 0, lastX: 0, lastT: 0, moved: false, captured: false })

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || open) return
    const s = S.current
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, pos: s.pos, lastX: e.clientX, lastT: performance.now(), moved: false, captured: false }
    s.vel = 0
    s.dragging = true
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const s = S.current
    const d = drag.current
    if (s.dragging && d.id === e.pointerId) {
      const dx = e.clientX - d.x
      if (!d.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - d.y)) {
        d.moved = true
        if (!d.captured) {
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          d.captured = true
        }
      }
      if (!d.moved) return
      const now = performance.now()
      const p = rubber(d.pos - dx / s.gap, s.n)
      const dtm = Math.max(1, now - d.lastT) / 1000
      const inst = -(e.clientX - d.lastX) / s.gap / dtm
      s.vel = s.vel * 0.6 + inst * 0.4
      s.pos = p
      d.lastX = e.clientX
      d.lastT = now
      return
    }
    if (e.pointerType !== "mouse" || s.reduced) return
    // brushing past the strings nudges the cards under the pointer
    const r = rootRef.current?.getBoundingClientRect()
    if (!r) return
    const px = e.clientX - r.left - r.width / 2
    for (let i = 0; i < s.n; i++) {
      const cx = (i - s.pos) * s.gap
      if (Math.abs(cx - px) < s.gap * 0.45) poke(i, clamp(e.movementX, -40, 40) * 0.5)
    }
  }

  const endDrag = (e: React.PointerEvent) => {
    const s = S.current
    const d = drag.current
    if (!s.dragging || d.id !== e.pointerId) return
    s.dragging = false
    if (d.moved) {
      s.target = settle(clamp(s.pos, 0, s.n - 1), s.vel, s.n)
      // the click that follows a drag is swallowed by pick(); clear the flag after it
      setTimeout(() => { d.moved = false }, 0)
    }
    d.id = -1
  }

  /* ---- wheel (non-passive so it can stop the page) ---- */
  React.useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const s = S.current
      if (s.n < 2) return
      const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      const d = (horiz ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 32 : 1)
      if (!horiz && ((s.target <= 0 && d < 0) || (s.target >= s.n - 1 && d > 0))) return
      e.preventDefault()
      s.target = clamp(s.target + d / 260, 0, s.n - 1)
      if (s.wheelTimer) clearTimeout(s.wheelTimer)
      s.wheelTimer = setTimeout(() => { s.target = clamp(Math.round(s.target), 0, s.n - 1) }, 140)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  /* ---- switching lines ---- */
  const showTab = (k: number) => {
    const next = clamp(k, 0, safeTabs.length - 1)
    if (next === tab && !savedView) return
    const s = S.current
    const m = mid(safeTabs[next].cards.length)
    s.pos = s.target = m
    s.vel = 0
    s.active = m
    setActive(m)
    setSavedView(false)
    setTab(next)
  }

  const toggleSaved = () => {
    const s = S.current
    const m = savedView ? mid(safeTabs[tab].cards.length) : mid(kept.length)
    s.pos = s.target = m
    s.vel = 0
    s.active = m
    setActive(m)
    setSavedView(!savedView)
  }

  const back = () => {
    if (open) return closeCard()
    if (savedView) return toggleSaved()
    if (onBack) return onBack()
    go(0, true)
  }

  /* ---- cards ---- */
  const pick = (k: number, e: React.MouseEvent) => {
    if (drag.current.moved) return
    const it = items[k]
    if (!it) return
    if (k !== active) {
      go(k)
      poke(k, (k > active ? -1 : 1) * 60)
      return
    }
    if (it.card.locked) {
      poke(k, 220)
      say("🔒 " + (it.card.lockHint ?? "This one is still locked"))
      return
    }
    const paper = (e.currentTarget as HTMLElement).querySelector(".hc-paper")
    fromRect.current = paper ? paper.getBoundingClientRect() : null
    setClosing(false)
    setOpen({ t: it.t, i: it.i, key: keyOf(it.t, it.i) })
  }

  const tilt = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return
    const el = e.currentTarget as HTMLElement
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty("--rx", fmt(-y * 10) + "deg")
    el.style.setProperty("--ry", fmt(x * 12) + "deg")
    el.style.setProperty("--mx", fmt((x + 0.5) * 100) + "%")
  }
  const untilt = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement
    el.style.setProperty("--rx", "0deg")
    el.style.setProperty("--ry", "0deg")
  }

  const onTrackKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(active + 1, true)
    else if (e.key === "ArrowLeft") go(active - 1, true)
    else if (e.key === "Home") go(0, true)
    else if (e.key === "End") go(n - 1, true)
    else return
    e.preventDefault()
  }

  /* ---- the letter ---- */
  const openItem = open ? { card: safeTabs[open.t]?.cards[open.i], t: open.t, i: open.i } : null
  const openIndex = open ? items.findIndex((x) => x.t === open.t && x.i === open.i) : -1

  const flip = (el: HTMLElement, from: DOMRect, reverse: boolean, done?: () => void) => {
    const to = el.getBoundingClientRect()
    if (!to.width) return done?.()
    const tr = "translate(" + fmt(from.left - to.left) + "px," + fmt(from.top - to.top) + "px) scale(" + fmt(from.width / to.width) + ")"
    el.style.transformOrigin = "0 0"
    el.style.transition = "none"
    el.style.transform = reverse ? "none" : tr
    el.getBoundingClientRect()
    requestAnimationFrame(() => {
      el.style.transition = "transform .55s cubic-bezier(.2,.8,.2,1)"
      el.style.transform = reverse ? tr : "none"
    })
    if (done) setTimeout(done, 520)
  }

  useIsoLayoutEffect(() => {
    if (!open || closing) return
    const el = posterRef.current
    if (el && fromRect.current && !S.current.reduced) flip(el, fromRect.current, false)
    primaryRef.current?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.key])

  React.useEffect(() => {
    const scene = sceneRef.current
    if (scene) scene.inert = !!open
  }, [open])

  const closeCard = () => {
    if (!open || closing) return
    const idx = openIndex
    const finish = () => {
      setOpen(null)
      setClosing(false)
      if (idx >= 0) setTimeout(() => cardRefs.current[idx]?.focus({ preventScroll: true }), 0)
    }
    setClosing(true)
    const el = posterRef.current
    const paper = idx >= 0 ? hangRefs.current[idx]?.querySelector(".hc-paper") : null
    if (el && paper && !S.current.reduced) {
      // the source card is hidden while open; measure where it hangs
      flip(el, paper.getBoundingClientRect(), true, finish)
    } else finish()
  }

  const toggleKeep = (k: string) => {
    const next = kept.includes(k) ? kept.filter((x) => x !== k) : [...kept, k]
    setKept(next)
    onKeepChange?.(next)
    say(next.includes(k) ? "♥ Kept in your bag" : "Taken out of your bag")
  }

  const begin = () => {
    if (!openItem?.card) return
    if (onOpen) onOpen(openItem.card, openItem.t, openItem.i)
    else say("“" + openItem.card.title + "” · happy reading")
  }

  const tabList = safeTabs
  const ghost = savedView ? "Kept" : tabList[tab].sub ?? tabList[tab].label
  const showCredits = credits !== false
  const pct = (p?: number) => Math.round(clamp(p ?? 0, 0, 1) * 100)

  return (
    <div
      ref={rootRef}
      className={"hc-root " + className}
      style={{
        height,
        ["--hc-paper" as string]: pal.paper,
        ["--hc-ink" as string]: pal.ink,
        ["--hc-pink" as string]: pal.pink,
        ["--hc-blue" as string]: pal.blue,
        ["--hc-leaf" as string]: pal.leaf,
        ["--hc-foot" as string]: showCredits ? "56px" : "0px",
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) closeCard()
      }}
    >
      <style>{HC_CSS}</style>
      <div ref={sceneRef} className="hc-scene">
        <span ref={probeRef} className="hc-probe" aria-hidden="true" />
        {/* the wall */}
        <div className="hc-bg" aria-hidden="true">
          <div className="hc-lattice" />
          <div className="hc-leak" />
          <div className="hc-glow" />
          <div className="hc-word">{title}</div>
          <div className="hc-ghost" key={ghost}>{ghost}</div>
          <div className="hc-envelope"><i /></div>
          <div className="hc-postmark">
            <span>{site.split("/")[0].toUpperCase()}</span>
          </div>
          <div className="hc-script">{script}</div>
        </div>

        {/* top left */}
        <div className="hc-top">
          <button type="button" className="hc-icbtn" onClick={back} aria-label={savedView ? "Back to " + tabList[tab].label : "Back"}>
            <Icon d="M15 4 7 12l8 8" size={30} />
          </button>
          <button type="button" className="hc-icbtn hc-bag" onClick={toggleSaved} aria-pressed={savedView} aria-label={"Kept cards, " + kept.length}>
            <Icon d="M7 9V7a5 5 0 0 1 10 0v2 M5 9h14l-1 11H6z M10 14h4" size={26} />
            {kept.length > 0 && <b className="hc-badge">{kept.length}</b>}
          </button>
        </div>

        {/* top right */}
        <div className="hc-count" aria-live="polite">
          <b>{String(Math.min(active + 1, n)).padStart(2, "0")}</b>
          <span>/ {String(n).padStart(2, "0")}</span>
          <small>{savedView ? "Kept" : tabList[tab].sub ?? tabList[tab].label}</small>
        </div>

        {/* the line */}
        <div
          ref={trackRef}
          className="hc-track"
          role="group"
          aria-roledescription="carousel"
          aria-label={savedView ? "Kept cards" : tabList[tab].label + " " + (tabList[tab].sub ?? "")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onTrackKey}
        >
          {n === 0 && (
            <div className="hc-empty">
              <b>Nothing kept yet</b>
              <span>Open a card and tap ♡ Keep to hang it here.</span>
            </div>
          )}
          {items.map((it, k) => {
            const L = layout(k - startIndex)
            const r = rng(hash(it.card.title + k))
            const drop = 21 + (r() * 7 - 3.5)
            const isOpen = !!open && open.t === it.t && open.i === it.i
            const tag = it.card.tag ?? ""
            const tagSub = it.card.tagSub ?? ""
            return (
              <div
                key={lineKey + "-" + k}
                ref={(el) => { hangRefs.current[k] = el }}
                className={"hc-hang" + (isOpen ? " hc-away" : "") + (k === active ? " hc-front" : "")}
                style={{
                  transform: hangTransform(k - startIndex, 0, 0),
                  zIndex: L.z,
                  ["--s" as string]: fmt(L.scale),
                  ["--lift" as string]: fmt(L.lift),
                  ["--drop" as string]: fmt(drop) + "cqh",
                }}
              >
                <span className="hc-string" />
                <div className="hc-body">
                  <span className="hc-clip" />
                  <button
                    ref={(el) => { cardRefs.current[k] = el }}
                    type="button"
                    className="hc-card"
                    tabIndex={k === active ? 0 : -1}
                    aria-label={(tag ? tag + " " : "") + it.card.title + (it.card.subtitle ? ", " + it.card.subtitle : "") + (it.card.locked ? ", locked" : "") + " (" + (k + 1) + " of " + n + ")"}
                    aria-current={k === active ? "true" : undefined}
                    onClick={(e) => pick(k, e)}
                    onFocus={() => { if (k !== S.current.active) go(k) }}
                    onPointerMove={tilt}
                    onPointerLeave={untilt}
                  >
                    <span className="hc-paper">
                      <Poster card={it.card} id={uid + "-" + it.t + "-" + it.i} index={it.i} />
                      <span className="hc-sheen" />
                      <span className="hc-foot-row">
                        <span>No.{String(it.i + 1).padStart(2, "0")}</span>
                        {it.card.progress !== undefined && !it.card.locked ? (
                          <span className="hc-mini"><i style={{ width: pct(it.card.progress) + "%" }} /></span>
                        ) : (
                          <span className="hc-air" />
                        )}
                        <span>{kept.includes(keyOf(it.t, it.i)) ? "♥" : "✿"}</span>
                      </span>
                      {it.card.locked && (
                        <span className="hc-lock">
                          <Icon d="M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5z M12 15v2.5" size={28} />
                          <small>Locked</small>
                        </span>
                      )}
                    </span>
                  </button>
                  {tag && (
                    <span className="hc-tag">
                      <b>{tag}</b>
                      {tagSub && <small>{tagSub}</small>}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {n > 1 && (
          <>
            <button type="button" className="hc-arrow hc-prev" onClick={() => go(active - 1)} disabled={active <= 0} aria-label="Previous card">
              <Icon d="M15 5l-7 7 7 7" />
            </button>
            <button type="button" className="hc-arrow hc-next" onClick={() => go(active + 1)} disabled={active >= n - 1} aria-label="Next card">
              <Icon d="M9 5l7 7-7 7" />
            </button>
          </>
        )}

        {leaves && <Leaves id={uid} />}

        {/* tabs */}
        <div
          className="hc-nav"
          role="tablist"
          aria-label="Sections"
          onKeyDown={(e) => {
            const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
            if (!dir) return
            e.preventDefault()
            const next = (tab + dir + tabList.length) % tabList.length
            showTab(next)
            const btns = (e.currentTarget as HTMLElement).querySelectorAll("button")
            ;(btns[next] as HTMLButtonElement | undefined)?.focus()
          }}
        >
          {tabList.map((tb, k) => {
            const on = k === tab && !savedView
            return (
              <button
                key={k}
                type="button"
                role="tab"
                className="hc-tab"
                aria-selected={on}
                tabIndex={k === tab ? 0 : -1}
                onClick={() => showTab(k)}
              >
                <span className="hc-tab-ic">
                  <Icon d={ICONS[tb.icon ?? (["bloom", "quill", "swirl", "badge", "camera"] as TabIcon[])[k % 5]] ?? ICONS.star} />
                </span>
                <span className="hc-tab-l">{tb.label}</span>
                {tb.sub && <small>{tb.sub}</small>}
              </button>
            )
          })}
        </div>

        {/* credits */}
        {showCredits && (
          <footer className="hc-credits">
            <div className="hc-brand">
              <svg className="hc-svg" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                <path d="M16 29C6 24 4 12 16 3c12 9 10 21 0 26z" fill="var(--hc-leaf)" />
                <path d="M16 28V9 M16 16l-5-4 M16 21l5-4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </svg>
              <span>
                <b>{brand}</b>
                <small>{brandSub}</small>
              </span>
            </div>
            <div className="hc-credit-list">
              {(credits as CreditItem[]).map((c, k) => (
                <div key={k} className="hc-credit">
                  <span>
                    <b>{c.label}</b>
                    {c.sub && <small>{c.sub}</small>}
                  </span>
                  {c.href ? <a href={c.href}>{c.value}</a> : <em>{c.value}</em>}
                </div>
              ))}
            </div>
            <span className="hc-site">{site}</span>
            {qrImage !== false &&
              (qrImage ? (
                <img className="hc-qr" src={qrImage} alt="QR code" width={44} height={44} style={{ maxWidth: "none" }} />
              ) : (
                <Code seed={hash(site)} />
              ))}
          </footer>
        )}
      </div>

      <div className="hc-toast" role="status" aria-live="polite">
        {toast.text && <span key={toast.n}>{toast.text}</span>}
      </div>

      {/* the letter */}
      {open && openItem?.card && (
        <div className={"hc-dlg" + (closing ? " hc-closing" : "")} role="dialog" aria-modal="true" aria-label={openItem.card.title}>
          <div className="hc-dlg-bg" onClick={closeCard} />
          <div className="hc-dlg-in">
            <div ref={posterRef} className="hc-dlg-poster">
              <span className="hc-paper">
                <Poster card={openItem.card} id={uid + "-big"} index={openItem.i} />
              </span>
            </div>
            <div className="hc-letter">
              <div className="hc-letter-in">
                <button type="button" className="hc-close" onClick={closeCard} aria-label="Close">
                  <Icon d="M6 6l12 12M18 6 6 18" size={20} />
                </button>
                <span className="hc-stamp" aria-hidden="true">
                  <Icon d={ICONS.star} size={22} />
                </span>
                <p className="hc-l-tag">
                  {openItem.card.tag ?? tabList[openItem.t]?.label}
                  {openItem.card.tagSub && <span> · {openItem.card.tagSub}</span>}
                </p>
                <h2 className="hc-l-title">{openItem.card.title}</h2>
                {openItem.card.subtitle && <p className="hc-l-sub">{openItem.card.subtitle}</p>}
                {openItem.card.description && <p className="hc-l-body">{openItem.card.description}</p>}
                {openItem.card.meta && openItem.card.meta.length > 0 && (
                  <ul className="hc-chips">
                    {openItem.card.meta.map((m, k) => <li key={k}>{m}</li>)}
                  </ul>
                )}
                {openItem.card.progress !== undefined && (
                  <div className="hc-prog">
                    <span><i style={{ width: pct(openItem.card.progress) + "%" }} /></span>
                    <small>{pct(openItem.card.progress) === 100 ? "Finished" : pct(openItem.card.progress) + "% read"}</small>
                  </div>
                )}
                <div className="hc-actions">
                  {openItem.card.href ? (
                    <a ref={(el) => { primaryRef.current = el }} className="hc-go" href={openItem.card.href} onClick={() => onOpen?.(openItem.card, openItem.t, openItem.i)}>
                      {pct(openItem.card.progress) > 0 && pct(openItem.card.progress) < 100 ? "Continue" : "Begin reading"} →
                    </a>
                  ) : (
                    <button ref={(el) => { primaryRef.current = el }} type="button" className="hc-go" onClick={begin}>
                      {pct(openItem.card.progress) > 0 && pct(openItem.card.progress) < 100 ? "Continue" : "Begin reading"} →
                    </button>
                  )}
                  <button type="button" className="hc-keep" aria-pressed={kept.includes(open.key)} onClick={() => toggleKeep(open.key)}>
                    {kept.includes(open.key) ? "♥ Kept" : "♡ Keep"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* styles                                                              */
/* ------------------------------------------------------------------ */

const HC_CSS = `
.hc-root{--hc-wall:color-mix(in oklab,var(--hc-paper) 90%,var(--color-background,#fff));position:relative;width:100%;overflow:hidden;container:hc / size;isolation:isolate;color:var(--hc-ink);background-color:var(--hc-wall);font-family:system-ui,-apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.hc-root button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}
.hc-svg{display:block;max-width:none}
.hc-probe{position:absolute;width:var(--hc-gap);height:0;visibility:hidden;pointer-events:none}
.hc-scene{--hc-w:clamp(104px,min(17.5cqw,calc((74cqh - var(--hc-foot) - 130px) * 0.66)),300px);--hc-gap:calc(var(--hc-w) * 1.2);position:absolute;inset:0}
.hc-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.hc-lattice{position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--hc-ink) 6%,transparent) 0 1px,transparent 1px 34px),repeating-linear-gradient(-45deg,color-mix(in srgb,var(--hc-ink) 6%,transparent) 0 1px,transparent 1px 34px),radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--hc-pink) 18%,transparent) 0 1.2px,transparent 1.6px);background-size:auto,auto,24px 24px;-webkit-mask-image:linear-gradient(180deg,transparent,#000 20%,#000 70%,transparent);mask-image:linear-gradient(180deg,transparent,#000 20%,#000 70%,transparent)}
.hc-leak{position:absolute;left:-8cqw;top:-20cqh;width:30cqw;height:140cqh;background:linear-gradient(100deg,transparent 0,#ffd1e8 30%,#fff3b0 40%,#c8f2d8 50%,#bfe3ff 60%,#e5c9ff 70%,transparent 100%);filter:blur(26px);opacity:.55;transform:rotate(16deg);animation:hc-leak 9s ease-in-out infinite alternate}
.hc-glow{position:absolute;right:-10cqw;top:-20cqh;width:60cqw;height:70cqh;background:radial-gradient(closest-side,rgba(255,255,255,.85),transparent);opacity:.7}
.hc-word{position:absolute;left:50%;top:-1.6cqh;transform:translateX(-50%);white-space:nowrap;font:700 clamp(40px,13cqh,180px)/1 "Songti SC","Noto Serif CJK SC",Georgia,"Times New Roman",serif;letter-spacing:.02em;color:color-mix(in srgb,var(--hc-ink) 6%,transparent);-webkit-text-stroke:1.4px color-mix(in srgb,var(--hc-ink) 26%,transparent)}
.hc-ghost{position:absolute;left:50%;top:42cqh;transform:translate(-50%,-50%);white-space:nowrap;font:700 clamp(60px,26cqh,320px)/1 Georgia,"Times New Roman",serif;text-transform:uppercase;letter-spacing:.06em;color:transparent;-webkit-text-stroke:1px color-mix(in srgb,var(--hc-ink) 14%,transparent);animation:hc-fade .9s ease both}
.hc-envelope{position:absolute;left:54%;top:-3cqh;width:clamp(70px,15cqh,170px);aspect-ratio:1.5;padding:5px;transform:rotate(-8deg);background:repeating-linear-gradient(135deg,var(--hc-pink) 0 7px,#fff 7px 14px,var(--hc-blue) 14px 21px,#fff 21px 28px);box-shadow:0 6px 18px rgba(60,50,70,.12);opacity:.9}
.hc-envelope i{display:block;width:100%;height:100%;background-color:#fffdf7;background-image:repeating-linear-gradient(180deg,transparent 0 9px,color-mix(in srgb,var(--hc-blue) 25%,transparent) 9px 10px)}
.hc-postmark{position:absolute;left:calc(54% + clamp(60px,13cqh,150px));top:3cqh;width:clamp(44px,9cqh,96px);aspect-ratio:1;border-radius:50%;border:1.5px dashed color-mix(in srgb,var(--hc-blue) 50%,transparent);display:grid;place-items:center;transform:rotate(14deg);color:color-mix(in srgb,var(--hc-blue) 70%,transparent);font:700 clamp(6px,1.2cqh,11px)/1 system-ui,sans-serif;letter-spacing:.12em}
.hc-script{position:absolute;right:8cqw;bottom:calc(var(--hc-foot) + 3cqh);font:400 clamp(26px,7cqh,80px)/1 "Snell Roundhand","Segoe Script","Brush Script MT","Lucida Handwriting",cursive;color:color-mix(in srgb,var(--hc-blue) 40%,transparent);transform:rotate(-8deg);white-space:nowrap}
.hc-top{position:absolute;left:clamp(10px,2.4cqw,36px);top:clamp(8px,2.4cqh,28px);display:flex;gap:6px;z-index:120}
.hc-icbtn{position:relative;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;color:var(--hc-ink);transition:background-color .2s,transform .2s}
.hc-icbtn:hover{background:color-mix(in srgb,#fff 60%,transparent);transform:translateY(-1px)}
.hc-bag[aria-pressed=true]{background:var(--hc-pink);color:#fff}
.hc-badge{position:absolute;right:3px;top:3px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:var(--hc-pink);color:#fff;font-size:10px;line-height:17px;text-align:center;box-shadow:0 0 0 2px var(--hc-wall);animation:hc-pop .4s cubic-bezier(.3,1.6,.5,1)}
.hc-bag[aria-pressed=true] .hc-badge{background:#fff;color:var(--hc-pink)}
.hc-count{position:absolute;right:clamp(12px,3cqw,40px);top:clamp(12px,3cqh,30px);z-index:120;display:flex;align-items:baseline;gap:5px;padding:6px 12px 7px;background:#fffdf8;border-radius:3px;box-shadow:0 4px 14px rgba(60,50,70,.1),inset 0 -3px 0 var(--hc-pink);font-variant-numeric:tabular-nums}
.hc-count b{font:700 20px/1 Georgia,serif}
.hc-count span{font-size:12px;opacity:.6}
.hc-count small{font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.7;margin-left:6px}
.hc-track{position:absolute;inset:0 0 calc(var(--hc-foot) + 90px) 0;touch-action:pan-y;cursor:grab;outline:none}
.hc-track:active{cursor:grabbing}
.hc-hang{position:absolute;left:50%;top:0;width:var(--hc-w);height:0;transform-origin:50% 0;will-change:transform;pointer-events:none}
.hc-string{position:absolute;left:50%;top:-40px;width:1.5px;height:calc(var(--drop) + 40px - var(--lift) * 1cqh);margin-left:-.75px;background:linear-gradient(var(--hc-pink),color-mix(in srgb,var(--hc-pink) 70%,#fff));opacity:.9}
.hc-body{position:absolute;left:0;top:var(--drop);width:100%;transform-origin:50% 0;transform:translateY(calc(var(--lift) * -1cqh)) scale(var(--s));transition:filter .3s}
.hc-hang:not(.hc-front) .hc-body{filter:saturate(.9) brightness(.98)}
.hc-clip{position:absolute;left:50%;top:-7px;width:12px;height:16px;margin-left:-6px;border-radius:3px;background:var(--hc-pink);box-shadow:0 1px 2px rgba(0,0,0,.15);z-index:2}
.hc-clip::after{content:"";position:absolute;left:3px;right:3px;top:4px;height:1.5px;background:rgba(255,255,255,.7)}
.hc-card{display:block;width:100%;pointer-events:auto;border-radius:4px;perspective:900px;--rx:0deg;--ry:0deg;--mx:50%}
.hc-card:focus-visible{outline:none}
.hc-card:focus-visible .hc-paper{box-shadow:0 0 0 3px var(--hc-wall),0 0 0 6px var(--hc-pink),0 18px 40px rgba(60,50,70,.25)}
.hc-paper{position:relative;display:block;padding:6% 6% 15%;background:#fffdf8;border-radius:3px;box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 12px 30px rgba(60,50,70,.18),0 2px 5px rgba(60,50,70,.12);transform:rotateX(var(--rx)) rotateY(var(--ry));transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .3s;overflow:hidden}
.hc-paper .hc-svg{width:100%;height:auto;border-radius:1px}
.hc-card:hover .hc-paper{box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 22px 44px rgba(60,50,70,.24),0 2px 5px rgba(60,50,70,.12)}
.hc-sheen{position:absolute;inset:0;background:linear-gradient(115deg,transparent calc(var(--mx) - 30%),rgba(255,255,255,.55) var(--mx),rgba(255,230,245,.25) calc(var(--mx) + 8%),transparent calc(var(--mx) + 30%));mix-blend-mode:soft-light;opacity:0;transition:opacity .3s;pointer-events:none}
.hc-card:hover .hc-sheen{opacity:1}
.hc-foot-row{position:absolute;left:6%;right:6%;bottom:3.4%;display:flex;align-items:center;justify-content:space-between;gap:6px;font:600 clamp(7px,.72cqw + 2px,11px)/1 Georgia,serif;color:color-mix(in srgb,var(--hc-ink) 60%,transparent);letter-spacing:.06em}
.hc-foot-row>span:last-child{color:var(--hc-pink)}
.hc-air{flex:1;height:4px;background:repeating-linear-gradient(135deg,var(--hc-pink) 0 4px,transparent 4px 8px,var(--hc-blue) 8px 12px,transparent 12px 16px);opacity:.6}
.hc-mini{flex:1;height:3px;border-radius:2px;background:color-mix(in srgb,var(--hc-ink) 12%,transparent);overflow:hidden}
.hc-mini i,.hc-prog i{display:block;height:100%;background:linear-gradient(90deg,var(--hc-pink),color-mix(in srgb,var(--hc-pink) 50%,#ffd27a))}
.hc-lock{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:6px;background:color-mix(in srgb,#fff 46%,transparent);backdrop-filter:blur(2.5px) saturate(.7);-webkit-backdrop-filter:blur(2.5px) saturate(.7);color:var(--hc-ink)}
.hc-lock small{font-size:10px;letter-spacing:.2em;text-transform:uppercase}
.hc-tag{position:absolute;left:50%;top:100%;transform:translate(-50%,-38%) rotate(-1.5deg);display:grid;justify-items:center;min-width:58%;padding:5px 14px 6px;background:#fffaf2;border:1px solid color-mix(in srgb,var(--hc-ink) 18%,transparent);border-radius:2px;box-shadow:0 4px 10px rgba(60,50,70,.12),inset 0 -3px 0 color-mix(in srgb,var(--hc-pink) 55%,transparent);white-space:nowrap;pointer-events:none}
.hc-tag b{font:700 clamp(11px,1.1cqw + 3px,17px)/1.15 "Songti SC","Noto Serif CJK SC",Georgia,serif;letter-spacing:.12em}
.hc-tag small{font-size:clamp(7px,.6cqw + 3px,10px);letter-spacing:.16em;text-transform:uppercase;opacity:.55;margin-top:2px}
.hc-front .hc-tag{background:#fff;border-color:var(--hc-pink)}
.hc-away .hc-body{visibility:hidden}
.hc-empty{position:absolute;left:50%;top:40cqh;transform:translate(-50%,-50%) rotate(-2deg);display:grid;gap:6px;padding:22px 26px;background:#fffdf8;box-shadow:0 12px 30px rgba(60,50,70,.15);text-align:center;border-top:4px solid var(--hc-pink);max-width:80cqw}
.hc-empty b{font:700 18px/1.2 Georgia,serif}
.hc-empty span{font-size:13px;opacity:.7}
.hc-arrow{position:absolute;top:calc(21cqh + var(--hc-w) * .7);z-index:110;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:color-mix(in srgb,#fff 70%,transparent);box-shadow:0 4px 14px rgba(60,50,70,.12);opacity:.75;transition:opacity .2s,transform .2s}
.hc-arrow:hover{opacity:1;transform:scale(1.06)}
.hc-arrow:disabled{opacity:0;pointer-events:none}
.hc-prev{left:clamp(8px,2cqw,28px)}
.hc-next{right:clamp(8px,2cqw,28px)}
.hc-leaves{position:absolute;inset:0;pointer-events:none;z-index:105}
.hc-leaf-l{position:absolute;left:-3cqw;bottom:calc(var(--hc-foot) - 2cqh);width:clamp(130px,24cqw,340px);height:auto}
.hc-leaf-r{position:absolute;right:-3cqw;bottom:calc(var(--hc-foot) - 2cqh);width:clamp(120px,22cqw,320px);height:auto}
.hc-vine{position:absolute;right:2cqw;top:-2cqh;width:clamp(60px,9cqw,120px);height:auto;opacity:.9}
.hc-sway{transform-box:view-box;transform-origin:0 0;animation:hc-sway 6s ease-in-out infinite alternate}
.hc-sway-1{animation-duration:7.2s;animation-delay:-2s}
.hc-sway-2{animation-duration:5.4s;animation-delay:-1s}
.hc-sway-3{animation-duration:8s;animation-delay:-3s}
.hc-vine .hc-sway{transform-origin:80px 0}
.hc-nav{position:absolute;left:50%;bottom:calc(var(--hc-foot) + 10px);transform:translateX(-50%);z-index:115;display:flex;gap:clamp(4px,2.6cqw,40px);padding:6px 10px}
.hc-tab{display:grid;justify-items:center;gap:2px;min-width:54px;padding:2px 4px;color:var(--hc-ink);opacity:.82;transition:opacity .2s,transform .25s}
.hc-tab:hover{opacity:1;transform:translateY(-2px)}
.hc-tab:focus-visible{outline:2px solid var(--hc-pink);outline-offset:3px;border-radius:10px}
.hc-tab-ic{position:relative;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;transition:color .3s}
.hc-tab-ic::before{content:"";position:absolute;inset:-4px;border-radius:50%;background:radial-gradient(circle at 40% 35%,color-mix(in srgb,var(--hc-pink) 45%,#fff) 0,var(--hc-pink) 58%,color-mix(in srgb,var(--hc-pink) 0%,transparent) 72%);transform:scale(0);transition:transform .45s cubic-bezier(.3,1.5,.5,1);z-index:-1}
.hc-tab-ic::after{content:"";position:absolute;inset:-9px;border-radius:50%;border:1.5px dotted color-mix(in srgb,var(--hc-pink) 70%,transparent);transform:scale(.6) rotate(0deg);opacity:0;transition:transform .5s,opacity .3s}
.hc-tab[aria-selected=true]{opacity:1}
.hc-tab[aria-selected=true] .hc-tab-ic{color:#fff}
.hc-tab[aria-selected=true] .hc-tab-ic::before{transform:scale(1)}
.hc-tab[aria-selected=true] .hc-tab-ic::after{opacity:1;transform:scale(1) rotate(45deg);animation:hc-spin 18s linear infinite}
.hc-tab-l{font:700 13px/1.1 "Songti SC","Noto Serif CJK SC",Georgia,serif;letter-spacing:.14em}
.hc-tab[aria-selected=true] .hc-tab-l{color:var(--hc-pink)}
.hc-tab small{font-size:9px;letter-spacing:.14em;text-transform:uppercase;opacity:.55}
.hc-credits{position:absolute;left:0;right:0;bottom:0;height:var(--hc-foot);z-index:118;display:flex;align-items:center;gap:clamp(10px,2.4cqw,36px);padding:0 clamp(12px,2.4cqw,32px);background:color-mix(in oklab,#fffdf9 92%,var(--color-background,#fff));border-top:1px solid color-mix(in srgb,var(--hc-ink) 10%,transparent);box-shadow:0 -6px 20px rgba(60,50,70,.06)}
.hc-credits::before{content:"";position:absolute;left:0;right:0;top:-5px;height:4px;background:repeating-linear-gradient(135deg,var(--hc-pink) 0 8px,transparent 8px 16px,var(--hc-blue) 16px 24px,transparent 24px 32px);opacity:.5}
.hc-brand{display:flex;align-items:center;gap:8px;flex:none}
.hc-brand span,.hc-credit span{display:grid;line-height:1.1}
.hc-brand b{font:700 15px/1.1 Georgia,"Songti SC",serif}
.hc-brand small,.hc-credit small{font-size:9px;letter-spacing:.1em;opacity:.55;text-transform:uppercase}
.hc-credit-list{flex:1;display:flex;align-items:center;gap:clamp(10px,3cqw,44px);min-width:0;padding:6px 14px;border-radius:6px;background:color-mix(in srgb,var(--hc-paper) 70%,transparent)}
.hc-credit{display:flex;align-items:center;gap:10px;min-width:0}
.hc-credit b{font-size:12px;letter-spacing:.14em;color:color-mix(in srgb,var(--hc-ink) 70%,transparent)}
.hc-credit em,.hc-credit a{font-style:normal;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--hc-ink);text-decoration:none}
.hc-credit a:hover{color:var(--hc-pink)}
.hc-site{font-size:11px;letter-spacing:.12em;opacity:.6;white-space:nowrap}
.hc-code,.hc-qr{flex:none;width:44px;height:44px;border-radius:3px;box-shadow:0 0 0 1px color-mix(in srgb,var(--hc-ink) 12%,transparent)}
.hc-toast{position:absolute;left:50%;top:clamp(64px,10cqh,96px);transform:translateX(-50%);z-index:200;pointer-events:none}
.hc-toast span{display:block;max-width:84cqw;padding:8px 16px;border-radius:999px;background:#fffdf8;color:var(--hc-ink);font-size:13px;box-shadow:0 8px 24px rgba(60,50,70,.18),inset 0 0 0 1px color-mix(in srgb,var(--hc-pink) 50%,transparent);animation:hc-toast 2.6s ease both;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hc-dlg{position:absolute;inset:0;z-index:160;display:grid;place-items:center;padding:3cqh 3cqw}
.hc-dlg-bg{position:absolute;inset:0;background:color-mix(in srgb,var(--hc-wall) 72%,transparent);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);animation:hc-fade .4s ease both}
.hc-dlg-in{position:relative;display:flex;align-items:center;justify-content:center;gap:clamp(18px,4cqw,64px);max-width:100%;max-height:100%}
.hc-dlg-poster{flex:none;width:min(34cqw,52cqh,380px);will-change:transform}
.hc-dlg-poster .hc-paper{transform:none;padding:5% 5% 5%;box-shadow:0 30px 70px rgba(60,50,70,.3)}
.hc-letter{position:relative;width:min(440px,46cqw);padding:7px;background:repeating-linear-gradient(135deg,var(--hc-pink) 0 12px,#fff 12px 24px,var(--hc-blue) 24px 36px,#fff 36px 48px);box-shadow:0 24px 60px rgba(60,50,70,.22);transform:rotate(1.2deg);animation:hc-letter .6s cubic-bezier(.2,.8,.2,1) .12s both;user-select:text;-webkit-user-select:text}
.hc-letter-in{position:relative;padding:clamp(18px,3.4cqh,34px) clamp(18px,2.6cqw,34px);background:#fffdf8;background-image:repeating-linear-gradient(180deg,transparent 0 27px,color-mix(in srgb,var(--hc-blue) 10%,transparent) 27px 28px);max-height:min(76cqh,640px);overflow:auto}
.hc-close{position:absolute;right:10px;top:10px;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;transition:background-color .2s}
.hc-close:hover{background:color-mix(in srgb,var(--hc-pink) 18%,transparent)}
.hc-stamp{position:absolute;right:52px;top:12px;display:grid;place-items:center;width:38px;height:44px;color:var(--hc-pink);background:#fff;border:2px dashed color-mix(in srgb,var(--hc-pink) 60%,transparent);transform:rotate(6deg)}
.hc-l-tag{margin:0 0 6px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--hc-pink);font-weight:700}
.hc-l-tag span{opacity:.75}
.hc-l-title{margin:0;font:800 clamp(26px,4.6cqh,44px)/1.1 "Songti SC","Noto Serif CJK SC",Georgia,serif;letter-spacing:.06em;color:var(--hc-ink)}
.hc-l-sub{margin:6px 0 0;font:italic 15px/1.3 Georgia,serif;opacity:.7}
.hc-l-body{margin:16px 0 0;font-size:14px;line-height:28px;opacity:.85}
.hc-chips{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 0;padding:0;list-style:none}
.hc-chips li{padding:3px 10px;border-radius:999px;font-size:11px;letter-spacing:.06em;background:color-mix(in srgb,var(--hc-blue) 10%,transparent);color:color-mix(in srgb,var(--hc-blue) 80%,var(--hc-ink))}
.hc-prog{display:flex;align-items:center;gap:10px;margin-top:14px}
.hc-prog span{flex:1;height:6px;border-radius:3px;background:color-mix(in srgb,var(--hc-ink) 10%,transparent);overflow:hidden}
.hc-prog small{font-size:11px;opacity:.65;white-space:nowrap}
.hc-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.hc-root .hc-go{display:inline-flex;align-items:center;padding:11px 20px;border-radius:999px;background:var(--hc-pink);color:#fff;font-weight:700;font-size:14px;letter-spacing:.04em;text-decoration:none;box-shadow:0 8px 20px color-mix(in srgb,var(--hc-pink) 40%,transparent);transition:transform .2s,box-shadow .2s}
.hc-root .hc-go:hover{transform:translateY(-2px);box-shadow:0 12px 26px color-mix(in srgb,var(--hc-pink) 50%,transparent)}
.hc-root .hc-keep{padding:11px 18px;border-radius:999px;font-size:14px;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--hc-pink) 70%,transparent);color:var(--hc-pink);transition:background-color .2s}
.hc-root .hc-keep[aria-pressed=true]{background:color-mix(in srgb,var(--hc-pink) 14%,transparent)}
.hc-go:focus-visible,.hc-keep:focus-visible,.hc-close:focus-visible,.hc-icbtn:focus-visible,.hc-arrow:focus-visible{outline:2px solid var(--hc-pink);outline-offset:3px}
.hc-closing .hc-dlg-bg{animation:hc-fade .45s ease reverse both}
.hc-closing .hc-letter{animation:hc-letter-out .35s ease both}
@keyframes hc-leak{0%{transform:rotate(16deg) translateX(0);opacity:.45}100%{transform:rotate(12deg) translateX(4cqw);opacity:.65}}
@keyframes hc-sway{0%{transform:rotate(-1.6deg)}100%{transform:rotate(1.8deg)}}
@keyframes hc-spin{to{transform:scale(1) rotate(405deg)}}
@keyframes hc-pop{0%{transform:scale(0)}100%{transform:scale(1)}}
@keyframes hc-fade{0%{opacity:0}100%{opacity:1}}
@keyframes hc-toast{0%{opacity:0;transform:translateY(-8px)}10%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
@keyframes hc-letter{0%{opacity:0;transform:translateX(30px) rotate(5deg)}100%{opacity:1;transform:rotate(1.2deg)}}
@keyframes hc-letter-out{0%{opacity:1}100%{opacity:0;transform:translateX(30px) rotate(5deg)}}
@container hc (max-width: 760px){
.hc-scene{--hc-w:clamp(112px,min(42cqw,calc((74cqh - var(--hc-foot) - 130px) * 0.66)),250px);--hc-gap:calc(var(--hc-w) * 1.1)}
.hc-tab{min-width:44px}
.hc-tab small{display:none}
.hc-tab-ic{width:40px;height:40px}
.hc-site,.hc-credit:nth-child(n+2){display:none}
.hc-postmark{display:none}
.hc-dlg-in{flex-direction:column;gap:14px;overflow:auto}
.hc-dlg-poster{width:min(46cqw,30cqh)}
.hc-letter{width:min(92cqw,440px);transform:none}
.hc-letter-in{max-height:none}
.hc-arrow{display:none}
}
@container hc (max-width: 460px){
.hc-credit-list,.hc-script{display:none}
.hc-count small{display:none}
}
@media (prefers-reduced-motion:reduce){
.hc-leak,.hc-sway,.hc-ghost,.hc-badge,.hc-toast span,.hc-dlg-bg,.hc-letter,.hc-closing .hc-letter,.hc-closing .hc-dlg-bg,.hc-tab[aria-selected=true] .hc-tab-ic::after{animation:none}
.hc-paper,.hc-tab,.hc-tab-ic::before,.hc-icbtn,.hc-arrow{transition:none}
}
`
