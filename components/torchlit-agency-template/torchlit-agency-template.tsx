"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Torchlit Agency Template
 *
 * A complete agency site that rests in the dark. The cursor is a pixel-art
 * flaming torch; wherever it goes it warms text and photos from a muted
 * grey-brown up to cream with a soft falloff, so the page is read by carrying
 * the light. Pages: home (hero, principles, studio photo, selected work),
 * work (every project), case study, agency, services and brand guide, with a
 * shared contact section and footer.
 *
 * How the light works: every lit element carries `data-lit`. One rAF loop
 * writes the torch position into that element's `--tx/--ty` (and a lagging
 * trail into `--px/--py`); CSS turns those into a radial gradient clipped to
 * the text, or a radial mask over the full-colour copy of a photo. The dim
 * colours alone pass WCAG contrast, so the dark is atmosphere, never a lock.
 *
 * Touch: no torch. The light follows the finger while it is down and
 * otherwise rests, wide, on the middle of the screen.
 *
 * GSAP + ScrollTrigger inside gsap.context; no pinning.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

export type TorchProject = {
  title: string
  client: string
  kind: string
  year: number
  /** Any image URL; Unsplash URLs get resized with their `w=` parameter. */
  img: string
  line: string
}
export type TorchPrinciple = { label: string; text: string }
export type TorchService = { name: string; line: string; text: string; items: string[]; img: string }
export type TorchPage = "home" | "work" | "agency" | "services" | "brand"

export interface TorchlitAgencyTemplateProps {
  /** Short brand name, used in headings ("Our Vesper Guiding Principles"). */
  brand?: string
  /** Full studio name for the footer, curtain and brand guide. */
  studio?: string
  /** Hero height. Must be a definite length. */
  height?: string
  /** Hero lines; wrap a word in *asterisks* to set it in italic. */
  headline?: string[]
  principles?: TorchPrinciple[]
  projects?: TorchProject[]
  services?: TorchService[]
  email?: string
  /** Page shown on mount. */
  initialPage?: TorchPage
  /** "light" = lights on (no torch), "dark" = read by torchlight, "auto" follows the host's .dark class. */
  theme?: "auto" | "light" | "dark"
  /** Google Fonts stylesheet; null loads nothing (bring your own fonts). */
  fontHref?: string | null
  className?: string
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..600&family=Instrument+Serif:ital@0;1&display=swap"

const IMG = (id: string, w = 1600) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&q=80"
const sized = (url: string, w: number) => url.replace(/([?&]w=)\d+/, "$1" + w)

const DEFAULT_PRINCIPLES: TorchPrinciple[] = [
  { label: "Own It", text: "We don't rent ideas. Once a brief lands on our desk, it's ours to carry until it shines." },
  { label: "Make Noise", text: "Quiet brands get walked past. We build the ones people turn around for." },
  { label: "Obsess the Details", text: "The kerning, the copy, the half-second ease. Nobody sees the details until they're wrong." },
  { label: "Lead the Pack", text: "We'd rather set the pace than chase it. Most trends start as a late night in this studio." },
  { label: "All In, Always", text: "One team, one table, no hand-offs. We work like our name is on the door, because it is." },
]

const DEFAULT_PROJECTS: TorchProject[] = [
  { title: "Petal & Pith", client: "Petal & Pith Soapworks", kind: "Packaging", year: 2026, img: IMG("1617825295690-28ae56c56135"), line: "Cut-out soap boxes you can smell before you open them." },
  { title: "Canned Heat", client: "Northside Brewing Collective", kind: "Packaging", year: 2025, img: IMG("1626320290598-03656e931a31"), line: "A label system for forty beers that never sits still." },
  { title: "Moss Parlour", client: "Moss Parlour Tea", kind: "Packaging", year: 2025, img: IMG("1765534379403-5a052c172cff"), line: "Green tins with a pink lining, for a tea that celebrates quietly." },
  { title: "Kraft Theory", client: "Halden Goods", kind: "Identity", year: 2024, img: IMG("1595246007497-15e0ed4b8d96"), line: "One square, one stamp, every box in the warehouse." },
  { title: "Amber Hour", client: "Maison Oriel", kind: "Fragrance", year: 2026, img: IMG("1622618991746-fe6004db3a47"), line: "A launch shot entirely in the hour before sunset." },
  { title: "Nocturne No. 9", client: "Ostra Parfums", kind: "Fragrance", year: 2025, img: IMG("1761329842950-f3551938e4da"), line: "A perfume sold by candlelight, quite literally." },
  { title: "Held Close", client: "Lune Atelier", kind: "Fragrance", year: 2023, img: IMG("1784183972601-17a1b00ea05e"), line: "A bottle shaped to sit in the palm, not on the shelf." },
  { title: "Saffron Sky", client: "Calla Studio", kind: "Fashion", year: 2026, img: IMG("1562151270-c7d22ceb586a"), line: "Forty metres of yellow silk and one windy morning." },
  { title: "Red Ledger", client: "Ledger & Lane", kind: "Fashion", year: 2025, img: IMG("1662532577856-e8ee8b138a8b"), line: "Tailoring that refuses to be beige." },
  { title: "Velvet Hour", client: "House of Marlo", kind: "Fashion", year: 2024, img: IMG("1580478491436-fd6a937acc9e"), line: "An autumn lookbook staged in an empty swimming pool." },
  { title: "Platform Four", client: "Rava Outerwear", kind: "Campaign", year: 2023, img: IMG("1538329972958-465d6d2144ed"), line: "Puffer jackets, red trains and a very cold commute." },
  { title: "Kiln & Quiet", client: "Kiln & Quiet", kind: "Ceramics", year: 2025, img: IMG("1631125915902-d8abe9225ff2"), line: "Unglazed, unhurried, and named for both." },
  { title: "Wheelhouse", client: "Wheelhouse Pottery School", kind: "Identity", year: 2024, img: IMG("1609881583302-61548332039c"), line: "A pottery school brand with clay still on its hands." },
  { title: "Cobalt Vessels", client: "Atelier Seo", kind: "Ceramics", year: 2023, img: IMG("1660721671073-e139688fa3cf"), line: "Product photography that lets the glaze do the talking." },
  { title: "Citrus Mondays", client: "Zest Juicery", kind: "Campaign", year: 2024, img: IMG("1494253109108-2e30c049369b"), line: "A juice bar that paints its oranges blue." },
  { title: "Bright Idea Fund", client: "Lumen Foundation", kind: "Identity", year: 2022, img: IMG("1493612276216-ee3925520721"), line: "A grant brand for people still holding the bulb." },
  { title: "Onefold", client: "Onefold Bank", kind: "Identity", year: 2025, img: IMG("1763705857736-2b4f16a33758"), line: "A bank you would happily keep on the fridge." },
  { title: "Riviera Revue", client: "Hotel Solmar", kind: "Print", year: 2022, img: IMG("1584448097764-374f81551427"), line: "Deco posters for a hotel that never left 1929." },
  { title: "High Pass", client: "Alpine Rail Co.", kind: "Print", year: 2021, img: IMG("1580130718810-358e5e8af61b"), line: "Travel posters for a railway that climbs." },
  { title: "Casa Brasa", client: "Casa Brasa", kind: "Spaces", year: 2026, img: IMG("1776763255189-3c8237aec808"), line: "A wood-fire restaurant with a room to match." },
  { title: "Lamplight", client: "Lamplight Home", kind: "Digital", year: 2025, img: IMG("1763970586854-62e14f07ae35"), line: "An online shop that sells lamps by switching them on." },
  { title: "Terracotta Tower", client: "Orla Developments", kind: "Spaces", year: 2024, img: IMG("1486718448742-163732cd1544"), line: "Wayfinding for a building that curves like a clay pot." },
  { title: "Paper Weather", client: "Folio Press", kind: "Print", year: 2023, img: IMG("1513185041617-8ab03f83d6c5"), line: "A publisher's identity folded out of the page itself." },
  { title: "Pink Pour", client: "Lucky Pour Coffee", kind: "Packaging", year: 2024, img: IMG("1648187958671-f8dc71c4104c"), line: "Takeaway cups worth a second look." },
  { title: "The Brass Desk", client: "Hotel Vesna", kind: "Spaces", year: 2022, img: IMG("1660557989695-14fac79c086d"), line: "A lobby that feels like the last hour of a good party." },
  { title: "Hand Signal", client: "Signal Festival", kind: "Campaign", year: 2021, img: IMG("1569081156361-c98e05e7f1e4"), line: "A music festival drawn in a single neon line." },
  { title: "Golden Groove", client: "Amber Records", kind: "Music", year: 2020, img: IMG("1616714109948-c74fe5029a4d"), line: "Sleeves and a sound for a label pressing gold vinyl." },
  { title: "Morning Lamination", client: "Forno Doce", kind: "Food", year: 2019, img: IMG("1623334044303-241021148842"), line: "A bakery brand that tastes like six in the morning." },
]

const DEFAULT_SERVICES: TorchService[] = [
  { name: "Brand Strategy", line: "Positioning, naming and the story underneath.", text: "We start in the dark on purpose: interviews, archives, the competitor's shelf. Then we find the one true thing your business can say louder than anyone.", items: ["Research & interviews", "Positioning", "Naming", "Brand architecture", "Messaging"], img: IMG("1493612276216-ee3925520721", 1200) },
  { name: "Identity Design", line: "Marks, type and systems that hold up in any light.", text: "Logos are the easy part. We design the whole system around them, so the brand looks like itself on a business card, a billboard and a 16-pixel favicon.", items: ["Logo & wordmark", "Type & colour systems", "Brand guidelines", "Motion identity"], img: IMG("1763705857736-2b4f16a33758", 1200) },
  { name: "Packaging", line: "Boxes, bottles and labels people keep.", text: "Structure, print and the moment of opening. We work with the factory floor from week one, so nothing beautiful dies at production.", items: ["Structural design", "Label systems", "Print production", "Retail launch"], img: IMG("1617825295690-28ae56c56135", 1200) },
  { name: "Campaigns", line: "Ideas loud enough to be heard over the scroll.", text: "Concepts with a spine, art-directed through to the last social cut-down. We shoot, film and write in-house, so the idea survives the edit.", items: ["Concept & copy", "Art direction", "Photo & film", "Social & out of home"], img: IMG("1562151270-c7d22ceb586a", 1200) },
  { name: "Digital", line: "Sites and products that feel like the brand.", text: "Websites and product interfaces designed and built by the same people who drew the logo. Fast, accessible, and never a template.", items: ["UX & product design", "Websites", "Interaction & motion", "Design systems"], img: IMG("1763970586854-62e14f07ae35", 1200) },
]

const TEAM = [
  ["Inês Calado", "Founder & Creative Director"],
  ["Tom Ashby", "Strategy Director"],
  ["Mariana Lobo", "Design Director"],
  ["Kwame Osei", "Head of Motion"],
  ["Hana Ito", "Lead Writer"],
  ["Rafael Duarte", "Executive Producer"],
]

const STUDIO_IMGS = [IMG("1742440711276-679934f5b988", 2000), IMG("1742440710226-450e3b85c100", 1400), IMG("1742440711413-da7afb0f4930", 1400), IMG("1742440710193-3547e0b9d4db", 1400)]

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
const REDUCE = "(prefers-reduced-motion: reduce)"

type View = { page: TorchPage } | { page: "case"; i: number }

const rich = (s: string) => s.split("*").map((part, i) => (i % 2 ? <em key={i}>{part}</em> : <React.Fragment key={i}>{part}</React.Fragment>))
const pad = (n: number) => String(n).padStart(2, "0")

// #region pixel-torch
type Run = [x: number, y: number, w: number, fill: string]

const PAL: Record<string, string> = {
  k: "#1a0d0a", G: "#c9c1c6", g: "#857d86", d: "#433d47", r: "#d1261a", R: "#7c1712",
  b: "#4a2a17", B: "#7d4b26", w: "#fff6dc", y: "#ffcf3f", o: "#ff6a1a", e: "#ff9a2e", c: "#f3e6d3",
  m: "#3e3127", n: "#8a7660", N: "#cdb898",
}

// Torch below the flame, rows 11-25 of a 16 x 26 grid. Tilted: handle runs down to the right.
const TORCH_TILT = [
  "....kkkkkkkk....",
  "....kGgGGgGk....",
  ".....kgrrgk.....",
  ".....kdrrdk.....",
  "......kddk......",
  "......kbBk......",
  "......kbBBk.....",
  ".......kRRk.....",
  ".......kbBBk....",
  "........kbBk....",
  "........kbBBk...",
  ".........kRRk...",
  ".........kbBBk..",
  "..........kbBk..",
  "..........kkk...",
]
const TORCH_UP = [
  "....kkkkkkkk....",
  "....kGgGGgGk....",
  ".....kgrrgk.....",
  ".....kdrrdk.....",
  "......kddk......",
  "......kbBk......",
  "......kbBk......",
  "......kRRk......",
  "......kbBk......",
  "......kbBk......",
  "......kbBk......",
  "......kRRk......",
  "......kbBk......",
  "......kbBk......",
  "......kkkk......",
]
// A 7 x 9 flame for list marks and the logo.
const FLAME_MINI = ["...o...", "..oo...", "..ooo.o", ".ooyoo.", ".oyyyo.", "ooywyoo", "oyywyyo", ".oyyyo.", "..ooo.."]
// Two more frames so list flames can flicker.
const FLAME_MINI_2 = ["....o..", "...oo..", "o.ooo..", ".ooyoo.", ".oyyyoo", "ooyywoo", "oyywyyo", ".oyyyo.", "..ooo.."]
const FLAME_MINI_3 = ["..o....", "..oo...", "..ooo..", ".oooyo.", "ooyyyo.", "ooywyyo", "oyywyyo", ".oyyyo.", "..ooo.."]

function rand(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function toRuns(cells: (string | null)[][], y0 = 0, mono?: string): Run[] {
  const out: Run[] = []
  cells.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]
      if (!c) { x++; continue }
      let w = 1
      while (row[x + w] === c) w++
      out.push([x, y + y0, w, mono ?? PAL[c]])
      x += w
    }
  })
  return out
}

const gridRuns = (rows: string[], y0 = 0, mono?: string) => toRuns(rows.map((r) => r.split("").map((c) => (c === "." ? null : c))), y0, mono)

// One flame frame: a swaying teardrop quantised to pixels, white-hot core to red edge, plus a spark or two.
function flameFrame(seed: number): Run[] {
  const rnd = rand(seed * 977 + 13)
  const cells: (string | null)[][] = Array.from({ length: 12 }, () => Array(16).fill(null))
  for (let y = 0; y < 12; y++) {
    const t = (11.5 - y) / 11.5
    const cx = 8 + Math.sin(t * 3.1 + seed * 1.9) * t * 1.5
    const half = 4.4 * Math.pow(1 - t, 0.7) * (t < 0.12 ? 0.82 + t * 1.5 : 1)
    for (let x = 0; x < 16; x++) {
      const d = Math.abs(x + 0.5 - cx) / Math.max(half, 0.001) + (rnd() - 0.5) * 0.34
      if (d > 1) continue
      cells[y][x] = d < 0.36 && t < 0.5 ? "w" : d < 0.62 && t < 0.74 ? "y" : d < 0.86 && t < 0.92 ? "o" : "r"
    }
  }
  for (let i = 0; i < 2; i++) {
    const x = 5 + Math.floor(rnd() * 6)
    const y = Math.floor(rnd() * 3)
    if (!cells[y][x]) cells[y][x] = "e"
  }
  return toRuns(cells)
}

const FLAMES = [1, 2, 3, 4].map(flameFrame)
const TILT_RUNS = gridRuns(TORCH_TILT, 11)
const UP_RUNS = gridRuns(TORCH_UP, 11)
const MINI_RUNS = gridRuns(FLAME_MINI)
const MINI_FRAMES = [FLAME_MINI, FLAME_MINI_2, FLAME_MINI_3].map((g) => gridRuns(g))
const MINI_MONO = gridRuns(FLAME_MINI, 0, PAL.c)
// A moth, wings up and wings down, 9 x 6.
const MOTH_UP = [".n.....n.", "nNn...nNn", "nNNn.nNNn", ".nNNmNNn.", "..nnmnn..", "....m...."]
const MOTH_DOWN = [".........", ".........", "nnnnmnnnn", "nNNNmNNNn", ".nNnmnNn.", "..n.m.n.."]
const MOTH_RUNS = [MOTH_UP, MOTH_DOWN].map((g) => gridRuns(g))
// #endregion

const rects = (runs: Run[]) => runs.map(([x, y, w, fill], i) => <rect key={i} x={x} y={y} width={w} height={1} fill={fill} />)

function PixelTorch({ upright = false, scale = 3, className }: { upright?: boolean; scale?: number; className?: string }) {
  return (
    <svg className={"tl-px " + (className ?? "")} viewBox="0 0 16 26" width={16 * scale} height={26 * scale} shapeRendering="crispEdges" aria-hidden="true">
      {FLAMES.map((f, i) => (
        <g key={i} className="tl-fl" style={{ animationDelay: -i * 0.12 + "s" }}>
          {rects(f)}
        </g>
      ))}
      <g>{rects(upright ? UP_RUNS : TILT_RUNS)}</g>
    </svg>
  )
}

/** The red list flame: three flickering frames over a small halo of its own light. */
const FlameMark = ({ mono = false }: { mono?: boolean }) =>
  mono ? (
    <svg className="tl-mark" viewBox="0 0 7 9" width={7} height={9} shapeRendering="crispEdges" aria-hidden="true">
      {rects(MINI_MONO)}
    </svg>
  ) : (
    <span className="tl-flame" aria-hidden="true">
      <svg className="tl-mark" viewBox="0 0 7 9" width={7} height={9} shapeRendering="crispEdges">
        {MINI_FRAMES.map((fr, i) => (
          <g key={i} className="tl-fm" style={{ animationDelay: -i * 0.14 + "s" }}>{rects(fr)}</g>
        ))}
      </svg>
    </span>
  )

// Gold laurel: leaves generated along an arc, mirrored.
function LaurelSvg() {
  const gid = "tl-gold" + React.useId().replace(/:/g, "")
  const gold = "url(#" + gid + ")"
  const leaves: React.ReactNode[] = []
  for (let i = 0; i < 10; i++) {
    const deg = 100 + i * 12.6
    const a = (deg * Math.PI) / 180
    const x = 100 + 58 * Math.cos(a)
    const y = 64 + 58 * Math.sin(a)
    const s = (1.3 - i * 0.05).toFixed(2)
    const tangent = deg + 90
    for (const off of [-34, 30]) {
      leaves.push(<path key={i + ":" + off} d="M0 0C4-5.5 12-6.2 19-1C13 4.2 5 4.4 0 0Z" transform={"translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + (tangent + off) + ") scale(" + s + ")"} />)
    }
  }
  const p = (deg: number) => { const a = (deg * Math.PI) / 180; return (100 + 58 * Math.cos(a)).toFixed(1) + " " + (64 + 58 * Math.sin(a)).toFixed(1) }
  const branch = (
    <g>
      <path d={"M" + p(95) + "A58 58 0 0 1 " + p(226)} fill="none" stroke={gold} strokeWidth="2.2" strokeLinecap="round" />
      <g fill={gold}>{leaves}</g>
    </g>
  )
  return (
    <svg viewBox="0 0 200 140" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="0.45" stopColor="#e2ab4c" />
          <stop offset="1" stopColor="#8d5a1d" />
        </linearGradient>
      </defs>
      {branch}
      <g transform="translate(200 0) scale(-1 1)">{branch}</g>
      <path d="M86 126c6-5 22-5 28 0M90 131l10-8 10 8" fill="none" stroke={gold} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function Lit({ className, label, children }: { className?: string; label?: string; children: React.ReactNode }) {
  return (
    <div className={"tl-i " + (className ?? "")} data-lit="" role={label ? "img" : undefined} aria-label={label}>
      <div className="tl-lo" aria-hidden="true">{children}</div>
      <div className="tl-hi" aria-hidden="true">{children}</div>
    </div>
  )
}

// Unlit until the torch comes near; once it catches it becomes a light source of its own.
const Emblem = () => (
  <div className="tl-emb-wrap" data-ignite="160" data-beacon="380" data-sconce="">
    <span className="tl-emb-halo" aria-hidden="true" />
    <Lit className="tl-emb" label="Gold laurel around a torch">
      <LaurelSvg />
      <span className="tl-emb-torch"><PixelTorch upright scale={2.4} /></span>
    </Lit>
    <span className="tl-src" aria-hidden="true" />
  </div>
)

// A wall torch on an iron bracket: unlit until the torch comes near, then one more light in the room.
const Sconce = ({ side }: { side: "left" | "right" }) => (
  <span className={"tl-sconce tl-sconce-" + side} data-ignite="140" data-beacon="230" data-sconce="" aria-hidden="true">
    <span className="tl-sconce-halo" />
    <PixelTorch upright scale={2} />
    <span className="tl-src" />
  </span>
)

/** A text block that the torch lights. */
function T({ as = "p", className, children, big }: { as?: "p" | "span" | "h1" | "h2" | "h3" | "div"; className?: string; children: React.ReactNode; big?: boolean }) {
  const Tag = as as "p"
  return (
    <Tag className={"tl-t" + (big ? " tl-tl" : "") + (className ? " " + className : "")} data-lit="">
      {children}
    </Tag>
  )
}

export default function TorchlitAgencyTemplate({
  brand = "Vesper",
  studio = "Vesper & Flint",
  height = "100svh",
  headline = ["Quiet brands", "don't get *found*", "in the dark."],
  principles = DEFAULT_PRINCIPLES,
  projects = DEFAULT_PROJECTS,
  services = DEFAULT_SERVICES,
  email = "hello@vesperandflint.studio",
  initialPage = "home",
  theme = "auto",
  fontHref = FONT_HREF,
  className,
}: TorchlitAgencyTemplateProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const pageRef = React.useRef<HTMLDivElement>(null)
  const torchRef = React.useRef<HTMLDivElement>(null)
  const glowRef = React.useRef<HTMLDivElement>(null)
  const curtainRef = React.useRef<HTMLDivElement>(null)
  const curtainLabel = React.useRef<HTMLSpanElement>(null)
  const ghostRef = React.useRef<HTMLImageElement>(null)
  const afterCommit = React.useRef<null | (() => void)>(null)
  const busy = React.useRef(false)
  const firstView = React.useRef(true)
  // Shared with the hero timeline: where the light rests before the pointer moves, and the load flare.
  // lx/ly mirror the light's screen position for the lights-off transition; hide keeps the torch out of the blackout.
  const light = React.useRef({ parkX: -1, parkY: -1, boost: 1, lx: -1, ly: -1, hide: false })

  const [view, setView] = React.useState<View>({ page: initialPage })
  const [day, setDay] = React.useState(theme === "light")
  // Set once JS runs; until then text keeps its plain dim colour and photos their full colour.
  const [env, setEnv] = React.useState({ on: false, fine: false })
  // Torches lit on this page; light them all and the room warms up.
  const [torches, setTorches] = React.useState({ lit: 0, total: 0 })
  const [toast, setToast] = React.useState(false)
  const sparksRef = React.useRef<HTMLDivElement>(null)
  const mothRef = React.useRef<HTMLDivElement>(null)
  const burstRef = React.useRef<(n: number) => void>(() => {})
  const recount = () => {
    const fr = frameRef.current
    if (!fr) return
    const all = [...fr.querySelectorAll<HTMLElement>("[data-sconce]")].filter((el) => el.getClientRects().length > 0)
    setTorches({ lit: all.filter((el) => el.classList.contains("tl-lit-up")).length, total: all.length })
  }
  const recountRef = React.useRef(recount)
  recountRef.current = recount
  const dayRef = React.useRef(day)
  dayRef.current = day
  const lightsRef = React.useRef<HTMLDivElement>(null)

  // "auto" follows the host theme: lights on in light mode, torchlight in dark mode.
  useIso(() => {
    if (theme !== "auto") { setDay(theme === "light"); return }
    const read = () => setDay(!(rootRef.current?.closest(".dark") || document.documentElement.classList.contains("dark")))
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [theme])

  // Lights off: the bulbs stutter and die, a beat of pitch black, then your torch strikes and its light
  // pushes the dark back out from the flame. Lights on: the tubes flicker up and the room floods cream.
  const switching = React.useRef(false)
  const setLights = (on: boolean) => {
    if (on === dayRef.current || switching.current) return
    const veil = lightsRef.current
    if (calm() || !veil) { setDay(on); return }
    switching.current = true
    const L = light.current
    const flicker = on ? [0, 0.09, 0.15, 0.3, 0.36] : [0, 0.07, 0.13, 0.27, 0.33, 0.5]
    const tl = gsap.timeline({ onComplete: () => { switching.current = false } })
    // Alternate states, ending on the target.
    flicker.forEach((t, i) => tl.call(() => setDay((flicker.length - 1 - i) % 2 === 0 ? on : !on), undefined, t))
    if (!on) {
      const end = flicker[flicker.length - 1]
      const far = Math.hypot(innerWidth, innerHeight) * 1.25
      tl.call(() => { L.hide = true; L.boost = 0 }, undefined, 0)
        .set(veil, { background: "#050404", "--vr": "0px", autoAlpha: 1 }, end)
        .call(() => {
          const x = L.lx >= 0 ? L.lx : innerWidth / 2
          const y = L.ly >= 0 ? L.ly : innerHeight * 0.45
          veil.style.setProperty("--vx", x + "px")
          veil.style.setProperty("--vy", y + "px")
          L.hide = false
          burstRef.current(26)
        }, undefined, end + 0.42)
        .fromTo(L, { boost: 0 }, { boost: 2.1, duration: 0.35, ease: "power2.out" }, end + 0.42)
        .to(L, { boost: 1.5, duration: 0.06, repeat: 3, yoyo: true, ease: "none" }, end + 0.78)
        .to(L, { boost: 1, duration: 0.9, ease: "power2.inOut" }, end + 1.05)
        .to(veil, { "--vr": far + "px", duration: 1.7, ease: "power2.inOut" }, end + 0.55)
        .set(veil, { autoAlpha: 0 })
    } else {
      tl.set(veil, { background: "#fff6e8", "--vr": "0px", autoAlpha: 0 }, 0)
        // Tubes buzzing on: hard white blinks, then the room floods and settles.
        .set(veil, { autoAlpha: 0.95 }, 0.05).set(veil, { autoAlpha: 0 }, 0.1)
        .set(veil, { autoAlpha: 0.95 }, 0.2).set(veil, { autoAlpha: 0 }, 0.24)
        .to(veil, { autoAlpha: 0.9, duration: 0.1, ease: "power2.out" }, flicker[flicker.length - 1])
        .to(veil, { autoAlpha: 0, duration: 0.9, ease: "power2.out" })
    }
  }
  const [menu, setMenu] = React.useState(false)
  const [openService, setOpenService] = React.useState(0)

  const calm = () => typeof window !== "undefined" && window.matchMedia(REDUCE).matches
  const toTop = () => {
    const root = rootRef.current
    if (root) window.scrollTo(0, Math.max(0, root.getBoundingClientRect().top + window.scrollY))
  }

  const pageName = (v: View) => (v.page === "case" ? projects[v.i].title : v.page === "home" ? studio : v.page === "brand" ? "Brand Guide" : v.page[0].toUpperCase() + v.page.slice(1))

  // ---- page transitions -----------------------------------------------------------
  const go = (next: View, fromImg?: HTMLImageElement | null) => {
    setMenu(false)
    if (busy.current) return
    if (calm()) {
      afterCommit.current = toTop
      setView(next)
      return
    }
    busy.current = true
    const curtain = curtainRef.current!
    const content = pageRef.current!
    const ghost = ghostRef.current!
    if (next.page === "case" && fromImg && fromImg.getBoundingClientRect().width > 0) {
      const r = fromImg.getBoundingClientRect()
      ghost.src = fromImg.currentSrc || fromImg.src
      gsap.set(ghost, { autoAlpha: 1, left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: 10 })
      gsap.to(content, {
        autoAlpha: 0, duration: 0.4, ease: "power2.out",
        onComplete: () => {
          afterCommit.current = () => {
            toTop()
            const target = content.querySelector<HTMLElement>("[data-case-hero]")
            gsap.set(content, { autoAlpha: 1 })
            if (!target) { gsap.set(ghost, { autoAlpha: 0 }); busy.current = false; return }
            const img = target.querySelector("img")
            const tr = target.getBoundingClientRect()
            gsap.set(target, { autoAlpha: 0 })
            gsap.to(ghost, {
              left: tr.left, top: tr.top, width: tr.width, height: tr.height, borderRadius: 18, duration: 1.05, ease: "expo.inOut",
              onComplete: () => {
                const done = () => {
                  gsap.set(target, { autoAlpha: 1 })
                  gsap.to(ghost, { autoAlpha: 0, duration: 0.3 })
                  busy.current = false
                  ScrollTrigger.refresh()
                }
                if (img) img.decode().then(done, done)
                else done()
              },
            })
          }
          setView(next)
        },
      })
      return
    }
    if (curtainLabel.current) curtainLabel.current.textContent = pageName(next)
    gsap.timeline()
      .set(curtain, { autoAlpha: 1, yPercent: 100 })
      .to(curtain, { yPercent: 0, duration: 0.65, ease: "power3.in" })
      .add(() => {
        afterCommit.current = () => {
          toTop()
          gsap.to(curtain, {
            yPercent: -100, duration: 0.8, ease: "power3.out", delay: 0.15,
            onComplete: () => { gsap.set(curtain, { autoAlpha: 0 }); busy.current = false },
          })
        }
        setView(next)
      })
  }

  const openCase = (i: number, e: React.MouseEvent<HTMLElement>) => go({ page: "case", i }, e.currentTarget.querySelector<HTMLImageElement>(".tl-hi img"))

  // ---- the light ------------------------------------------------------------------
  React.useEffect(() => {
    const frame = frameRef.current!
    const torch = torchRef.current!
    const glow = glowRef.current!
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    const calmMq = window.matchMedia(REDUCE)
    const L = light.current
    const S = { tx: 0, ty: 0, lx: innerWidth / 2, ly: innerHeight * 0.45, px: innerWidth / 2, py: innerHeight * 0.45, r: 0, tilt: 0, moved: false, inside: false, touching: false, touchMode: !fine, kbd: false, hold: false, sc: 1, still: 0, sx: 0, sy: 0 }
    const visible = new Set<HTMLElement>()
    const watched = new Set<Element>()
    let ignite: HTMLElement[] = []
    const heat = new Map<HTMLElement, number>()
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target as HTMLElement) : visible.delete(e.target as HTMLElement))),
      { rootMargin: "160px 0px" },
    )
    const scan = () => {
      frame.querySelectorAll("[data-lit]").forEach((el) => { if (!watched.has(el)) { watched.add(el); io.observe(el) } })
      for (const el of [...watched]) if (!el.isConnected) { io.unobserve(el); watched.delete(el); visible.delete(el as HTMLElement) }
      ignite = [...frame.querySelectorAll<HTMLElement>("[data-ignite]")]
    }
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(frame, { childList: true, subtree: true })
    setEnv({ on: true, fine })
    let wasDay: boolean | null = null

    // Embers: a small pool of pixels thrown off the flame when it moves fast, bursts on click.
    type Spark = { el: HTMLElement; x: number; y: number; vx: number; vy: number; life: number; max: number }
    const sparks: Spark[] = []
    const pool = sparksRef.current!
    for (let i = 0; i < 36; i++) {
      const el = document.createElement("i")
      pool.appendChild(el)
      sparks.push({ el, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1 })
    }
    let fxNow = 0
    let fyNow = 0
    const emit = (n: number, power = 1) => {
      if (calmMq.matches) return
      for (const p of sparks) {
        if (n <= 0) break
        if (p.life > 0) continue
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2
        const v = (0.06 + Math.random() * 0.16) * power
        p.x = fxNow + (Math.random() - 0.5) * 8
        p.y = fyNow - 6
        p.vx = Math.cos(a) * v
        p.vy = Math.sin(a) * v
        p.max = p.life = 500 + Math.random() * 700
        p.el.style.background = Math.random() < 0.3 ? "#fff1c2" : Math.random() < 0.6 ? "#ffb347" : "#ff5a1f"
        n--
      }
    }
    burstRef.current = (n) => emit(n, 1.7)
    const M = { on: false, flee: false, x: 0, y: 0, vx: 0, vy: 0 }
    const moth = mothRef.current!
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || dayRef.current) return
      S.hold = true
      emit(16, 1.8)
    }
    const onUp = () => { S.hold = false }
    frame.addEventListener("pointerdown", onDown)
    window.addEventListener("pointerup", onUp)

    // Fire spreads through the letters from where the torch touched, like oil.
    const catchFire = (el: HTMLElement, x: number, y: number, w: number, h: number) => {
      el.classList.add("tl-lit-up")
      if (el.hasAttribute("data-sconce")) { recountRef.current(); emit(10, 1.2) }
      el.style.setProperty("--ix", x.toFixed(0) + "px")
      el.style.setProperty("--iy", y.toFixed(0) + "px")
      const full = Math.hypot(w, h) * 1.15
      if (calmMq.matches) el.style.setProperty("--ig", full + "px")
      else gsap.fromTo(el, { "--ig": "0px" }, { "--ig": full + "px", duration: 1.5, ease: "power2.inOut" })
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      const r = frame.getBoundingClientRect()
      S.touchMode = false
      S.kbd = false
      S.tx = e.clientX
      S.ty = e.clientY
      S.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      if (!S.moved) { S.moved = true; S.lx = S.tx; S.ly = S.ty }
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      S.touchMode = true
      S.touching = !!t && frame.contains(e.target as Node)
      if (t) { S.tx = t.clientX; S.ty = t.clientY }
    }
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (!el.matches(":focus-visible")) return
      const r = el.getBoundingClientRect()
      S.kbd = true
      S.moved = true
      S.inside = true
      S.tx = r.left + Math.min(r.width / 2, 120)
      S.ty = r.top + r.height / 2
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("touchstart", onTouch, { passive: true })
    window.addEventListener("touchmove", onTouch, { passive: true })
    window.addEventListener("touchend", onTouch, { passive: true })
    window.addEventListener("touchcancel", onTouch, { passive: true })
    frame.addEventListener("focusin", onFocus)

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      raf = requestAnimationFrame(tick)
      const isDay = dayRef.current
      if (isDay !== wasDay) {
        wasDay = isDay
        if (isDay) { torch.style.opacity = "0"; glow.style.opacity = "0"; moth.style.opacity = "0"; M.on = false }
      }
      // Lights on: nothing to carry.
      if (isDay) return
      const vw = innerWidth
      const vh = innerHeight
      // Read every rect before writing any style, or each write forces a fresh layout.
      const fr = frame.getBoundingClientRect()
      const lit = [...visible].map((el) => [el, el.getBoundingClientRect()] as const)
      const fires = ignite.map((el) => [el, el.getBoundingClientRect(), (el.querySelector(".tl-src") ?? el).getBoundingClientRect()] as const)
      const base = Math.max(170, Math.min(280, vw * 0.16))
      let tx: number, ty: number, rT: number, follow: number, show: boolean
      if (S.touchMode && !S.kbd) {
        if (S.touching) { tx = S.tx; ty = S.ty; rT = 230; follow = 0.5; show = true }
        else { tx = vw / 2; ty = vh * 0.46; rT = Math.max(vw, vh) * 0.62; follow = 0.06; show = false }
      } else if (!S.moved) {
        tx = L.parkX >= 0 ? L.parkX : vw / 2; ty = L.parkY >= 0 ? L.parkY : vh * 0.45; rT = base; follow = 0.5; show = true
      } else {
        tx = S.tx; ty = S.ty; rT = S.inside ? base : 0; follow = 0.42; show = S.inside
      }
      // Press and hold: the flame flares.
      if (S.hold && show) rT *= 1.45
      const k = 1 - Math.pow(1 - follow, dt / 16.7)
      const vx = (tx - S.lx) * k
      S.lx += vx
      S.ly += (ty - S.ly) * k
      const kt = 1 - Math.pow(0.91, dt / 16.7)
      S.px += (S.lx - S.px) * kt
      S.py += (S.ly - S.py) * kt
      S.r += (rT - S.r) * (1 - Math.pow(0.88, dt / 16.7))
      S.tilt += (Math.max(-16, Math.min(16, vx * 0.9)) - S.tilt) * 0.12
      S.sc += ((S.hold && show ? 1.18 : 1) - S.sc) * 0.2
      const speed = Math.hypot(S.lx - S.sx, S.ly - S.sy) / Math.max(dt, 1) * 16.7
      S.sx = S.lx
      S.sy = S.ly
      const r = S.r * L.boost
      frame.style.setProperty("--r", r.toFixed(1) + "px")
      const fx = S.lx - fr.left
      const fy = S.ly - fr.top
      torch.style.transform = "translate3d(" + fx.toFixed(1) + "px," + fy.toFixed(1) + "px,0) rotate(" + S.tilt.toFixed(2) + "deg) scale(" + S.sc.toFixed(3) + ")"
      fxNow = fx
      fyNow = fy
      if (show && speed > 7 && Math.random() < Math.min(0.9, speed / 40)) emit(1 + Math.floor(speed / 25))
      for (const p of sparks) {
        if (p.life <= 0) continue
        p.life -= dt
        p.vy -= 0.00022 * dt
        p.vx *= 0.985
        p.x += p.vx * dt
        p.y += p.vy * dt
        const t = Math.max(0, p.life / p.max)
        p.el.style.opacity = p.life > 0 ? t.toFixed(2) : "0"
        p.el.style.transform = "translate3d(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px,0) scale(" + (0.5 + t * 0.6).toFixed(2) + ")"
      }
      // A moth finds a flame that holds still, and bolts when it swings.
      S.still = show && speed < 1.2 ? S.still + dt : 0
      if (!calmMq.matches) {
        if (!M.on && S.still > 1800) {
          const fromLeft = Math.random() < 0.5
          M.on = true
          M.flee = false
          M.x = fx + (fromLeft ? -1 : 1) * (vw * 0.55)
          M.y = fy - 140 + Math.random() * 280
          M.vx = 0
          M.vy = 0
        }
        if (M.on) {
          if (speed > 14 || !show) M.flee = true
          if (M.flee) {
            const dx = M.x - fx
            const dy = M.y - fy
            const d = Math.hypot(dx, dy) || 1
            M.vx += (dx / d) * 0.03 * dt
            M.vy += (dy / d) * 0.03 * dt - 0.01 * dt
            if (d > vw) M.on = false
          } else {
            const a = now / 380
            const ox = fx + Math.cos(a) * 46 + Math.sin(now / 130) * 10
            const oy = fy - 14 + Math.sin(a * 1.7) * 30 + Math.cos(now / 97) * 8
            M.vx += (ox - M.x) * 0.0009 * dt + (Math.random() - 0.5) * 0.25
            M.vy += (oy - M.y) * 0.0009 * dt + (Math.random() - 0.5) * 0.25
          }
          M.vx *= 0.9
          M.vy *= 0.9
          M.x += M.vx * dt * 0.06
          M.y += M.vy * dt * 0.06
        }
        moth.style.opacity = M.on ? "1" : "0"
        moth.style.transform = "translate3d(" + M.x.toFixed(1) + "px," + M.y.toFixed(1) + "px,0) scaleX(" + (M.vx < 0 ? -1 : 1) + ")"
      }
      L.lx = S.lx
      L.ly = S.ly
      if (L.hide) show = false
      torch.style.opacity = show ? "1" : "0"
      glow.style.transform = "translate3d(" + fx.toFixed(1) + "px," + fy.toFixed(1) + "px,0) scale(" + Math.max(0.05, r / 210).toFixed(3) + ")"
      glow.style.opacity = show ? "1" : S.touchMode ? "0.35" : "0"
      // Things that caught fire light their surroundings too, with a little flicker.
      const flick = calmMq.matches ? 1 : 0.9 + 0.1 * Math.sin(now / 83) * Math.sin(now / 31 + 1.3)
      const beacons = fires
        .filter(([el]) => el.classList.contains("tl-lit-up"))
        .map(([el, b, src]) => ({ x: src.left + src.width / 2, y: src.top + src.height / 2, r: (Number(el.dataset.beacon) || b.width * 0.62) * flick }))
      for (const [el, b] of lit) {
        el.style.setProperty("--tx", (S.lx - b.left).toFixed(1) + "px")
        el.style.setProperty("--ty", (S.ly - b.top).toFixed(1) + "px")
        el.style.setProperty("--px", (S.px - b.left).toFixed(1) + "px")
        el.style.setProperty("--py", (S.py - b.top).toFixed(1) + "px")
        const cx = b.left + b.width / 2
        const cy = b.top + b.height / 2
        let near: (typeof beacons)[number] | null = null
        let gap = Math.hypot(b.width, b.height) / 2
        for (const k of beacons) { const d = Math.hypot(k.x - cx, k.y - cy) - k.r; if (d < gap) { gap = d; near = k } }
        el.style.setProperty("--br", near ? near.r.toFixed(1) + "px" : "0px")
        if (near) {
          el.style.setProperty("--bx", (near.x - b.left).toFixed(1) + "px")
          el.style.setProperty("--by", (near.y - b.top).toFixed(1) + "px")
        }
      }
      // Bring the flame near a [data-ignite] element and it catches.
      for (const [el, b] of fires) {
        if (el.classList.contains("tl-lit-up")) continue
        const m = 40
        const on = r > 60 && S.lx > b.left - m && S.lx < b.right + m && S.ly > b.top - m && S.ly < b.bottom + m
        const h = Math.max(0, (heat.get(el) ?? 0) + (on ? dt : -dt * 0.5))
        heat.set(el, h)
        if (h > (Number(el.dataset.ignite) || 250)) catchFire(el, S.lx - b.left, S.ly - b.top, b.width, b.height)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      mo.disconnect()
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("touchstart", onTouch)
      window.removeEventListener("touchmove", onTouch)
      window.removeEventListener("touchend", onTouch)
      window.removeEventListener("touchcancel", onTouch)
      frame.removeEventListener("focusin", onFocus)
      frame.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      pool.replaceChildren()
    }
  }, [])

  // ---- per-page choreography ------------------------------------------------------
  useIso(() => {
    const run = afterCommit.current
    afterCommit.current = null
    run?.()
    recount()
    const scope = frameRef.current!
    const first = firstView.current
    firstView.current = false
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const L = light.current
        const hero = scope.querySelector<HTMLElement>("[data-hero]")
        if (hero) {
          const lines = hero.querySelectorAll(".tl-hero-line > *")
          const tl = gsap.timeline({ delay: first ? 0.15 : 0.55 })
          tl.from(lines, { yPercent: 70, opacity: 0, filter: "blur(10px)", duration: 1.3, ease: "power3.out", stagger: 0.13 }, 0)
          tl.from(hero.querySelectorAll("[data-hero-fade]"), { opacity: 0, y: 14, duration: 1, ease: "power2.out", stagger: 0.08 }, 0.5)
          // The flame catches: a sweep across the headline, a flare, a few flickers, then it settles.
          const h = hero.querySelector(".tl-hero-h")!.getBoundingClientRect()
          L.parkY = h.top + h.height * 0.55
          tl.fromTo(L, { parkX: h.left + h.width * 0.08 }, { parkX: h.left + h.width * 0.62, duration: 2.2, ease: "power2.inOut" }, 0)
          tl.fromTo(L, { boost: 0 }, { boost: 2.3, duration: 0.55, ease: "power2.out" }, 0.1)
          tl.to(L, { boost: 1.5, duration: 0.07, repeat: 5, yoyo: true, ease: "none" }, 0.7)
          tl.to(L, { boost: 1, duration: 1.2, ease: "power2.inOut" }, 1.2)
        }
        scope.querySelectorAll<HTMLElement>("[data-rise]").forEach((el) => {
          gsap.from(el, { y: 42, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } })
        })
        scope.querySelectorAll<HTMLElement>("[data-band]").forEach((el) => {
          const img = el.querySelector(".tl-band-img")
          gsap.fromTo(img, { clipPath: "inset(14% 9% 0% 9% round 22px)", yPercent: 10 }, { clipPath: "inset(0% 0% 0% 0% round 14px)", yPercent: 0, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 25%", scrub: 0.6 } })
          gsap.fromTo(el.querySelector("img"), { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } })
        })
        scope.querySelectorAll<HTMLElement>("[data-stagger]").forEach((list) => {
          gsap.from(list.children, { y: 50, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.06, scrollTrigger: { trigger: list, start: "top 88%", once: true } })
        })
      })
      ScrollTrigger.refresh()
    }, scope)
    return () => ctx.revert()
  }, [view])

  const warm = !day && torches.total > 0 && torches.lit === torches.total
  React.useEffect(() => {
    if (!warm) return
    setToast(true)
    const t = setTimeout(() => setToast(false), 3600)
    return () => clearTimeout(t)
  }, [warm])

  React.useEffect(() => {
    if (!menu) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !(e.target as HTMLElement).closest?.(".tl-svc-menu, .tl-svc-btn")) setMenu(false)
    }
    window.addEventListener("pointerdown", close)
    window.addEventListener("keydown", close)
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", close) }
  }, [menu])

  const current = view.page === "case" ? "work" : view.page

  // ---- shared pieces --------------------------------------------------------------
  const card = (p: TorchProject, i: number, w = 800) => (
    <li key={p.title + i} className="tl-card">
      <button type="button" className="tl-card-b" onClick={(e) => openCase(i, e)} aria-label={"Open case study: " + p.title}>
        <Lit className="tl-thumb">
          <img src={sized(p.img, w)} alt="" loading="lazy" decoding="async" />
        </Lit>
        <span className="tl-card-meta">
          <span className="tl-card-n">{pad(i + 1)}</span>
          <T as="span" className="tl-card-t">{p.title}</T>
          <T as="span" className="tl-card-y">{p.year}</T>
        </span>
        <span className="tl-card-k">{p.kind}</span>
      </button>
    </li>
  )

  const principlesBlock = (
    <section className="tl-prin" aria-labelledby="tl-prin-h">
      <Emblem />
      <h2 id="tl-prin-h" className="tl-h2 tl-center">
        <T as="span" big>Our {brand}</T>
        <T as="span" big>{rich("*Guiding* Principles")}</T>
      </h2>
      <ol className="tl-rows">
        {principles.map((p, i) => (
          <li key={p.label} className="tl-row" data-rise="">
            <span className="tl-rule" data-lit="" aria-hidden="true" />
            <h3 className="tl-row-l">
              <sup className="tl-row-n"><FlameMark /><span className="tl-sr">{i + 1}</span></sup>
              <T as="span">{p.label}</T>
            </h3>
            <T className="tl-row-p">{p.text}</T>
          </li>
        ))}
        <li className="tl-row tl-row-end" aria-hidden="true"><span className="tl-rule" data-lit="" /></li>
      </ol>
    </section>
  )

  const pageHead = (eyebrow: string, title: string, sub?: string) => (
    <header className="tl-ph">
      <Sconce side="left" />
      <Sconce side="right" />
      <T className="tl-eyebrow">{eyebrow}</T>
      <h1 className="tl-h1"><T as="span" big>{rich(title)}</T></h1>
      {sub && <T className="tl-lede">{sub}</T>}
    </header>
  )

  // ---- pages ---------------------------------------------------------------------
  let body: React.ReactNode
  if (view.page === "home") {
    body = (
      <>
        <section className="tl-hero" data-hero="" style={{ minHeight: "var(--h)" }}>
          <Sconce side="left" />
          <Sconce side="right" />
          <T className="tl-eyebrow" >{studio} — independent brand studio</T>
          <h1 className="tl-hero-h">
            {headline.map((l, i) => (
              <span key={i} className="tl-hero-line">
                <T as="span" big>{rich(l)}</T>
              </span>
            ))}
          </h1>
          <div data-hero-fade="">
            <T className="tl-hero-sub">We find the spark in a business and build a brand people can see from across the room. Packaging, identity, campaigns and the web, since 2014.</T>
          </div>
          <div className="tl-hero-foot" data-hero-fade="">
            <span>Lisbon · Bristol</span>
            {day ? (
              <button type="button" className="tl-hint tl-hint-day" onClick={() => setLights(false)}>Turn the lights off to read by torchlight</button>
            ) : (
              <span className="tl-hint"><span className="tl-hint-fine">Move to carry the light</span><span className="tl-hint-touch">Touch and drag to carry the light</span></span>
            )}
            <span>Est. 2014</span>
          </div>
        </section>
        {principlesBlock}
        <section className="tl-band" data-band="" aria-label="The studio">
          <div className="tl-band-img">
            <img src={STUDIO_IMGS[0]} alt="The studio team at work under warm shelf lights" loading="lazy" decoding="async" />
          </div>
          <div className="tl-band-cap">
            <T>The studio, Rua da Boavista — 7:42 pm</T>
            <T>Lights low, standards high.</T>
          </div>
        </section>
        <section className="tl-sec" aria-labelledby="tl-sel-h">
          <Sconce side="right" />
          <div className="tl-sec-head">
            <h2 id="tl-sel-h" className="tl-h2"><T as="span" big>{rich("Selected *Work*")}</T></h2>
            <button type="button" className="tl-link" onClick={() => go({ page: "work" })}>All {projects.length} projects <span aria-hidden="true">→</span></button>
          </div>
          <ul className="tl-grid tl-grid-3" data-stagger="">{projects.slice(0, 6).map((p, i) => card(p, i, 1000))}</ul>
        </section>
      </>
    )
  } else if (view.page === "work") {
    body = (
      <>
        {pageHead("Work (" + projects.length + ")", "Every *fire* we've started", "Brands, packaging, campaigns and rooms, from 2019 to now. Carry the torch across a project to see it in colour; open one for the full story.")}
        <ul className="tl-grid tl-grid-4" data-stagger="">{projects.map((p, i) => card(p, i))}</ul>
      </>
    )
  } else if (view.page === "case") {
    const i = view.i
    const p = projects[i]
    const next = (i + 1) % projects.length
    const np = projects[next]
    const stats = [["+" + (18 + ((i * 7) % 40)) + "%", "brand recall"], [String(2 + (i % 5)), "markets at launch"], [String(8 + ((i * 3) % 14)), "weeks, brief to shelf"]]
    body = (
      <article className="tl-case">
        <button type="button" className="tl-link tl-back" onClick={() => go({ page: "work" })}><span aria-hidden="true">←</span> All work</button>
        <header className="tl-ph">
          <Sconce side="left" />
          <Sconce side="right" />
          <T className="tl-eyebrow">Case {pad(i + 1)} — {p.kind} — {p.year}</T>
          <h1 className="tl-h1"><T as="span" big>{p.title}</T></h1>
          <T className="tl-lede">{p.line}</T>
        </header>
        <div className="tl-case-hero" data-case-hero="">
          <img src={sized(p.img, 2000)} alt={p.title + ", project photograph"} decoding="async" />
        </div>
        <dl className="tl-meta" data-rise="">
          {[["Client", p.client], ["Year", String(p.year)], ["Discipline", p.kind], ["Team", "Strategy, design, production"]].map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd><T as="span">{v}</T></dd></div>
          ))}
        </dl>
        <div className="tl-case-body">
          {[
            ["The brief", p.client + " came to us with a good product and no voice. Customers liked what they bought; nobody remembered who made it."],
            ["The spark", "We spent the first two weeks listening: to the founders, the shop floor and the people who walked straight past. The idea was hiding in plain sight, and we built everything around it."],
            ["The result", "A brand that finally looks like the thing it sells. " + p.line],
          ].map(([h, t]) => (
            <section key={h} className="tl-case-sec" data-rise="">
              <h2 className="tl-h3"><span className="tl-mk"><FlameMark /></span><T as="span">{h}</T></h2>
              <T className="tl-case-p">{t}</T>
            </section>
          ))}
        </div>
        <div className="tl-case-pair" data-stagger="">
          <Lit className="tl-crop tl-crop-a" label={p.title + " detail"}><img src={sized(p.img, 1400)} alt="" loading="lazy" decoding="async" /></Lit>
          <Lit className="tl-crop tl-crop-b" label={p.title + " detail"}><img src={sized(p.img, 1400)} alt="" loading="lazy" decoding="async" /></Lit>
        </div>
        <ul className="tl-stats" data-stagger="">
          {stats.map(([n, l]) => (
            <li key={l}><T as="span" big className="tl-stat-n">{n}</T><T as="span" className="tl-stat-l">{l}</T></li>
          ))}
        </ul>
        <button type="button" className="tl-next" onClick={(e) => openCase(next, e)} aria-label={"Next case study: " + np.title}>
          <span className="tl-next-k">Next case</span>
          <T as="span" big className="tl-next-t">{np.title}</T>
          <Lit className="tl-next-img"><img src={sized(np.img, 800)} alt="" loading="lazy" decoding="async" /></Lit>
        </button>
      </article>
    )
  } else if (view.page === "agency") {
    body = (
      <>
        {pageHead("Agency", "A small studio with a *very* big torch", studio + " is forty-one people in two cities who would rather make one brand unforgettable than ten brands fine. We are independent, a little stubborn, and we answer our own phones.")}
        <div className="tl-duo" data-stagger="">
          <Lit className="tl-duo-a" label="Designers reviewing work at the studio"><img src={STUDIO_IMGS[1]} alt="" loading="lazy" decoding="async" /></Lit>
          <Lit className="tl-duo-b" label="Two designers at their desks"><img src={STUDIO_IMGS[3]} alt="" loading="lazy" decoding="async" /></Lit>
        </div>
        <ul className="tl-stats tl-stats-4" data-stagger="">
          {[["2014", "founded in Lisbon"], ["41", "people, two studios"], [String(projects.length), "selected works"], ["9", "studio awards"]].map(([n, l]) => (
            <li key={l}><T as="span" big className="tl-stat-n">{n}</T><T as="span" className="tl-stat-l">{l}</T></li>
          ))}
        </ul>
        {principlesBlock}
        <section className="tl-sec" aria-labelledby="tl-team-h">
          <h2 id="tl-team-h" className="tl-h2"><T as="span" big>{rich("The people holding the *torch*")}</T></h2>
          <ul className="tl-list">
            {TEAM.map(([n, r]) => (
              <li key={n} data-rise="">
                <span className="tl-rule" data-lit="" aria-hidden="true" />
                <span className="tl-mk"><FlameMark /></span>
                <T as="span" className="tl-list-a">{n}</T>
                <T as="span" className="tl-list-b">{r}</T>
              </li>
            ))}
          </ul>
        </section>
      </>
    )
  } else if (view.page === "services") {
    body = (
      <>
        {pageHead("Services", "What we *light* up", "Five disciplines under one roof, usually in the same week. Open one to see what it includes.")}
        <ol className="tl-acc">
          {services.map((s, i) => {
            const open = openService === i
            return (
              <li key={s.name} className={"tl-acc-i" + (open ? " tl-open" : "")} data-rise="">
                <span className="tl-rule" data-lit="" aria-hidden="true" />
                <h2 className="tl-acc-h">
                  <button type="button" aria-expanded={open} aria-controls={"tl-acc-" + i} id={"tl-acc-b-" + i} onClick={() => setOpenService(open ? -1 : i)}>
                    <span className="tl-acc-n">{pad(i + 1)}</span>
                    <T as="span" big className="tl-acc-t">{s.name}</T>
                    <T as="span" className="tl-acc-l">{s.line}</T>
                    <span className="tl-acc-x" aria-hidden="true" />
                  </button>
                </h2>
                <div className="tl-acc-p" id={"tl-acc-" + i} role="region" aria-labelledby={"tl-acc-b-" + i} aria-hidden={!open}>
                  <div className="tl-acc-in">
                    <div>
                      <T className="tl-acc-text">{s.text}</T>
                      <ul className="tl-bul">
                        {s.items.map((it) => (
                          <li key={it}><span className="tl-mk"><FlameMark /></span><T as="span">{it}</T></li>
                        ))}
                      </ul>
                    </div>
                    <Lit className="tl-acc-img" label={s.name}><img src={s.img} alt="" loading="lazy" decoding="async" /></Lit>
                  </div>
                </div>
              </li>
            )
          })}
          <li aria-hidden="true"><span className="tl-rule" data-lit="" /></li>
        </ol>
      </>
    )
  } else {
    const swatches = [["Ember", "#E8321F", "Calls to action, the current page, list flames."], ["Soot", "#141212", "The room. Every page rests on it."], ["Ash", "#8E847A", "Unlit text. Still 5:1 on Soot."], ["Tallow", "#F3E6D3", "Text in the light."], ["Gilt", "#D9A441", "The laurel, and nothing else."]]
    body = (
      <>
        {pageHead("Brand Guide", "The *" + brand + "* brand guide", "How we look, sound and behave, on one page. Use it like a torch: hold it close to the thing you are making.")}
        <section className="tl-bg" data-rise="">
          <h2 className="tl-h3"><span className="tl-bg-n">01</span><T as="span">The mark</T></h2>
          <div className="tl-bg-mark">
            <span className="tl-logo tl-logo-xl" aria-hidden="true"><FlameMark mono /></span>
            <T as="span" big className="tl-bg-word">{studio}</T>
          </div>
          <T className="tl-bg-p">An ember-red square with a single pixel flame. Give it clear space equal to its own width, and never put it on anything lighter than Ash.</T>
        </section>
        <section className="tl-bg" data-rise="">
          <h2 className="tl-h3"><span className="tl-bg-n">02</span><T as="span">Colour</T></h2>
          <ul className="tl-sw" data-stagger="">
            {swatches.map(([n, hex, use]) => (
              <li key={n}>
                <span className="tl-sw-chip" style={{ background: hex }} aria-hidden="true" />
                <T as="span" className="tl-sw-n">{n}</T>
                <span className="tl-sw-hex">{hex}</span>
                <T as="span" className="tl-sw-u">{use}</T>
              </li>
            ))}
          </ul>
        </section>
        <section className="tl-bg" data-rise="">
          <h2 className="tl-h3"><span className="tl-bg-n">03</span><T as="span">Type</T></h2>
          <div className="tl-type">
            <div><T as="span" big className="tl-type-aa">Aa <em>Aa</em></T><T className="tl-bg-p">Instrument Serif, roman and italic. Headlines mix both: the italic word is the one we want you to hear.</T></div>
            <div><T as="span" className="tl-type-sans">Aa Bb 0123</T><T className="tl-bg-p">Instrument Sans for navigation, captions and the small print.</T></div>
          </div>
        </section>
        <section className="tl-bg" data-rise="">
          <h2 className="tl-h3"><span className="tl-bg-n">04</span><T as="span">Light</T></h2>
          <ul className="tl-bul tl-bul-lg">
            {["Everything rests dim, but nothing is hidden. Unlit text still passes contrast.", "There is one light source, and the reader carries it.", "Red marks what matters. It is never decoration."].map((t) => (
              <li key={t}><span className="tl-mk"><FlameMark /></span><T as="span">{t}</T></li>
            ))}
          </ul>
        </section>
        <section className="tl-bg" data-rise="">
          <h2 className="tl-h3"><span className="tl-bg-n">05</span><T as="span">Voice</T></h2>
          <div className="tl-voice">
            <div><span className="tl-voice-k">We say</span>{["Let's make it louder.", "Here's what we'd cut.", "It's ready when it's right."].map((t) => <T key={t} className="tl-voice-t">{t}</T>)}</div>
            <div><span className="tl-voice-k tl-voice-no">We never say</span>{["Synergy.", "Best-in-class solutions.", "Per my last email."].map((t) => <T key={t} className="tl-voice-t tl-strike">{t}</T>)}</div>
          </div>
        </section>
      </>
    )
  }

  const navItems: [TorchPage, string][] = [["work", "Work (" + projects.length + ")"], ["agency", "Agency"], ["services", "Services"], ["brand", "Brand Guide"]]

  return (
    <div ref={rootRef} className={"tl-root" + (className ? " " + className : "")} style={{ "--h": height } as React.CSSProperties}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{CSS}</style>
      <div ref={frameRef} className={"tl-frame" + (env.on ? " tl-on" : "") + (env.fine && !day ? " tl-fine" : "") + (day ? " tl-day" : "") + (warm ? " tl-warm" : "")}>
        <div className="tl-bar">
          <nav className="tl-nav" aria-label="Main">
            <button type="button" className="tl-logo" onClick={() => go({ page: "home" })} aria-label={studio + ", home"}>
              <FlameMark mono />
            </button>
            <ul>
              {navItems.map(([pg, label]) => (
                <li key={pg}>
                  {pg === "services" ? (
                    <>
                      <button type="button" className={"tl-nl tl-svc-btn" + (current === pg ? " tl-cur" : "")} aria-expanded={menu} aria-haspopup="true" onClick={() => setMenu((m) => !m)}>
                        {label} <span className="tl-chev" aria-hidden="true" />
                      </button>
                      {menu && (
                        <ul className="tl-svc-menu">
                          {services.map((s, i) => (
                            <li key={s.name}>
                              <button type="button" onClick={() => { setOpenService(i); go({ page: "services" }) }}>
                                <FlameMark /> {s.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <button type="button" className={"tl-nl" + (current === pg ? " tl-cur" : "")} aria-current={current === pg ? "page" : undefined} onClick={() => go({ page: pg })}>
                      {label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="tl-actions">
            {!day && torches.total > 0 && (
              <span className={"tl-count" + (warm ? " tl-count-done" : "")} aria-live="polite">
                <FlameMark /> {torches.lit}/{torches.total}<span className="tl-count-l"> torches lit</span>
              </span>
            )}
            <button type="button" className="tl-lamp" aria-pressed={!day} onClick={() => setLights(!day)}>
              <span className="tl-lamp-dot" aria-hidden="true" />
              {day ? "Lights off" : "Lights on"}
            </button>
            <a className="tl-cta" href={"mailto:" + email}>Let's Connect</a>
          </div>
        </div>

        <main ref={pageRef} className="tl-page">{body}</main>

        <section className="tl-contact" aria-labelledby="tl-contact-h">
          <T className="tl-eyebrow">Got a brief that needs a little fire?</T>
          <h2 id="tl-contact-h" className="tl-sr">Contact</h2>
          <a className="tl-ignite" href={"mailto:" + email} data-ignite="220">
            <T as="span" big className="tl-mega">{rich("Let's *Connect*")}</T>
            <span className="tl-mega tl-fire" aria-hidden="true">{rich("Let's *Connect*")}</span>
            <span className="tl-embers" aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: 6 + ((i * 37) % 88) + "%", animationDelay: (i * 0.23) % 2.4 + "s" }} />)}
            </span>
          </a>
          <p className="tl-ign-hint" aria-hidden="true"><span className="tl-ign-a">Bring the torch close. It's soaked in oil</span><span className="tl-ign-b">Lit. Now write to us</span></p>
          <div className="tl-contact-grid">
            {[["New business", email], ["Call", "+351 21 000 4120"], ["Lisbon", "Rua da Boavista 84, 1200-066"], ["Bristol", "12 Gas Ferry Road, BS1 6UN"]].map(([k, v]) => (
              <div key={k}><span className="tl-k">{k}</span><T as="span">{v}</T></div>
            ))}
          </div>
        </section>

        <footer className="tl-foot">
          <span className="tl-rule" data-lit="" aria-hidden="true" />
          <div className="tl-foot-top">
            <T as="p" big className="tl-foot-mark">{rich(studio.replace("&", "*&*"))}</T>
            <div className="tl-foot-cols">
              <div>
                <span className="tl-k">Pages</span>
                {navItems.map(([pg, label]) => <button key={pg} type="button" onClick={() => go({ page: pg })}>{label}</button>)}
              </div>
              <div>
                <span className="tl-k">Elsewhere</span>
                <span>Instagram</span><span>LinkedIn</span><span>Are.na</span>
              </div>
            </div>
          </div>
          <div className="tl-foot-bot">
            <span>© {new Date().getFullYear()} {studio}. Photography via Unsplash.</span>
            <button type="button" onClick={() => window.scrollTo({ top: Math.max(0, (rootRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY), behavior: calm() ? "auto" : "smooth" })}>Back to top ↑</button>
          </div>
        </footer>

        <div ref={glowRef} className="tl-glow" aria-hidden="true"><i /></div>
        <div ref={sparksRef} className="tl-sparks" aria-hidden="true" />
        <div ref={mothRef} className="tl-moth" aria-hidden="true">
          <svg viewBox="0 0 9 6" width={27} height={18} shapeRendering="crispEdges">
            {MOTH_RUNS.map((fr, i) => <g key={i} className="tl-mw" style={{ animationDelay: -i * 0.09 + "s" }}>{rects(fr)}</g>)}
          </svg>
        </div>
        <div ref={torchRef} className="tl-torch" aria-hidden="true"><PixelTorch /></div>
        {toast && <div className="tl-toast" role="status"><FlameMark /> Every torch here is lit. The room is warmer now.</div>}
        <div ref={curtainRef} className="tl-curtain" aria-hidden="true">
          <span className="tl-curtain-in"><PixelTorch upright scale={3} /><span ref={curtainLabel} /></span>
        </div>
        <img ref={ghostRef} className="tl-ghost" alt="" aria-hidden="true" />
        <div ref={lightsRef} className="tl-veil" aria-hidden="true" />
        {day && (
          <div className="tl-ask" role="note">
            <span className="tl-ask-t"><FlameMark /> This studio is best seen in the dark.</span>
            <button type="button" onClick={() => setLights(false)}>Turn the lights off</button>
          </div>
        )}
      </div>
    </div>
  )
}

const CSS = `
.tl-root{--tl-bg:#141212;--tl-dim:#877d74;--tl-dim-lg:#6c635b;--tl-cream:#f3e6d3;--tl-ui:#d9cdbf;--tl-ui-2:#cdbfb0;--tl-ui-hi:#fff4e0;--tl-line:rgba(243,230,211,.13);--tl-red:#e8321f;--tl-h:var(--h,100svh);background:var(--color-background,#ece8e4);padding:10px;width:100%;box-sizing:border-box}
.tl-root *,.tl-root *::before,.tl-root *::after{box-sizing:border-box}
.tl-frame{position:relative;background:var(--tl-bg);color:var(--tl-dim);border-radius:22px;overflow:clip;container:tl/inline-size;font-family:"Instrument Sans",ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;--r:0px}
.tl-frame em{font-style:italic}
.tl-frame button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit}
.tl-frame a{color:inherit;text-decoration:none}
.tl-frame :focus-visible{outline:2px solid var(--tl-red);outline-offset:4px;border-radius:4px}
.tl-fine,.tl-fine *{cursor:none!important}
.tl-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* ---- the light on text: dim base, a radial pool at the torch and a lagging trail ---- */
.tl-t,.tl-rule,.tl-i{--tx:-9999px;--ty:-9999px;--px:-9999px;--py:-9999px;--bx:-9999px;--by:-9999px;--br:0px}
.tl-t{color:var(--tl-dim)}
.tl-tl{--tl-dim:var(--tl-dim-lg)}
.tl-on .tl-t{background-image:radial-gradient(circle var(--r) at var(--tx) var(--ty),#fffaf0 0,rgba(252,243,228,.97) 30%,rgba(246,233,214,.62) 60%,rgba(243,230,211,0) 100%),radial-gradient(circle calc(var(--r) * .8) at var(--px) var(--py),rgba(243,230,211,.5) 0,rgba(243,230,211,0) 100%),radial-gradient(circle var(--br) at var(--bx) var(--by),rgba(255,234,200,.95) 0,rgba(250,224,190,.6) 42%,rgba(243,230,211,0) 100%),linear-gradient(var(--tl-dim),var(--tl-dim));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;padding:.06em .14em .12em;margin:-.06em -.14em -.12em}
.tl-on span.tl-t{display:inline-block}
.tl-frame .tl-stat-n,.tl-frame .tl-stat-l,.tl-frame .tl-sw-n,.tl-frame .tl-sw-u{display:block}
.tl-on .tl-t em{-webkit-text-fill-color:transparent}
@media (forced-colors:active){.tl-on .tl-t{background:none;color:CanvasText;-webkit-text-fill-color:CanvasText}}
.tl-rule{display:block;height:1px;background:var(--tl-line)}
.tl-on .tl-rule{background:radial-gradient(circle var(--r) at var(--tx) var(--ty),rgba(243,230,211,.6),rgba(243,230,211,0) 100%),radial-gradient(circle var(--br) at var(--bx) var(--by),rgba(255,214,160,.5),rgba(243,230,211,0) 100%),var(--tl-line)}

/* ---- the light on images: a dim copy under a full-colour copy masked to the pool ---- */
.tl-i{position:relative;overflow:hidden;background:#1c1918}
.tl-lo,.tl-hi{position:absolute;inset:0}
.tl-i img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block}
.tl-lo{filter:grayscale(1) sepia(.18) brightness(.3) contrast(1.1)}
.tl-on .tl-hi{-webkit-mask-image:radial-gradient(circle var(--r) at var(--tx) var(--ty),#000 0,rgba(0,0,0,.9) 28%,rgba(0,0,0,0) 100%),radial-gradient(circle calc(var(--r) * .85) at var(--px) var(--py),rgba(0,0,0,.5),rgba(0,0,0,0) 100%),radial-gradient(circle var(--br) at var(--bx) var(--by),#000 0,rgba(0,0,0,.7) 40%,rgba(0,0,0,0) 100%);mask-image:radial-gradient(circle var(--r) at var(--tx) var(--ty),#000 0,rgba(0,0,0,.9) 28%,rgba(0,0,0,0) 100%),radial-gradient(circle calc(var(--r) * .85) at var(--px) var(--py),rgba(0,0,0,.5),rgba(0,0,0,0) 100%),radial-gradient(circle var(--br) at var(--bx) var(--by),#000 0,rgba(0,0,0,.7) 40%,rgba(0,0,0,0) 100%)}

/* ---- torch, glow, pixel flames ---- */
.tl-torch{position:absolute;left:0;top:0;z-index:60;pointer-events:none;margin:-18px 0 0 -24px;transform-origin:24px 18px;transition:opacity .25s;will-change:transform;opacity:0}
.tl-torch svg{display:block;filter:drop-shadow(0 0 6px rgba(255,90,30,.55))}
.tl-glow{position:absolute;left:0;top:0;width:520px;height:520px;margin:-260px 0 0 -260px;z-index:55;pointer-events:none;mix-blend-mode:screen;transition:opacity .4s;opacity:0;will-change:transform}
.tl-glow i{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(255,96,40,.34) 0,rgba(232,50,31,.16) 30%,rgba(232,50,31,0) 62%);animation:tl-flick 2.6s infinite}
.tl-fl{animation:tl-fl .48s steps(1,end) infinite;opacity:0}
.tl-px{overflow:visible}
@keyframes tl-fl{0%{opacity:1}25%,100%{opacity:0}}
@keyframes tl-flick{0%,100%{opacity:1;transform:scale(1)}12%{opacity:.82;transform:scale(.97)}20%{opacity:1;transform:scale(1.03)}47%{opacity:.9}53%{opacity:1;transform:scale(1.01)}78%{opacity:.86;transform:scale(.98)}}
.tl-mark{display:inline-block;width:7px;height:9px;vertical-align:baseline}
.tl-flame{position:relative;display:inline-block;line-height:0}
.tl-flame::before{content:"";position:absolute;left:50%;top:55%;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:radial-gradient(circle,rgba(255,120,40,.55) 0,rgba(232,50,31,.22) 38%,rgba(232,50,31,0) 70%);animation:tl-flick 1.7s infinite;pointer-events:none}
.tl-flame .tl-mark{position:relative;filter:drop-shadow(0 0 2px rgba(255,120,40,.8))}
.tl-fm{animation:tl-fm .42s steps(1,end) infinite;opacity:0}
@keyframes tl-fm{0%{opacity:1}33.3%,100%{opacity:0}}
.tl-mk{display:inline-flex;align-items:center;justify-content:center;width:14px;flex:none}
.tl-mk .tl-mark{width:9px;height:12px}
.tl-row-n .tl-mark{width:8px;height:10px}

/* ---- nav ---- */
.tl-bar{position:sticky;top:10px;height:0;z-index:50}
.tl-nav{position:absolute;left:30px;top:24px;font-size:12.5px;line-height:1.45;color:var(--tl-ui)}
.tl-nav ul{list-style:none;margin:10px 0 0;padding:0}
.tl-nl{display:inline-flex;align-items:center;gap:6px;transition:color .2s}
.tl-nl:hover{color:var(--tl-ui-hi)}
.tl-cur{color:var(--tl-red)}
.tl-cur:hover{color:#ff5a45}
.tl-chev{width:6px;height:6px;border-right:1.5px solid var(--tl-red);border-bottom:1.5px solid var(--tl-red);transform:translateY(-2px) rotate(45deg);transition:transform .25s}
.tl-svc-btn[aria-expanded="true"] .tl-chev{transform:translateY(1px) rotate(225deg)}
.tl-svc-menu{position:absolute;left:0;margin-top:8px!important;min-width:210px;background:rgba(24,21,21,.96);border:1px solid var(--tl-line);border-radius:12px;padding:8px!important;box-shadow:0 20px 50px rgba(0,0,0,.5);backdrop-filter:blur(8px);animation:tl-drop .28s cubic-bezier(.2,.8,.2,1)}
.tl-svc-menu button{display:flex;gap:10px;align-items:center;width:100%;padding:8px 10px;border-radius:8px;font-size:13.5px;color:var(--tl-ui)}
.tl-svc-menu button:hover{background:rgba(243,230,211,.06);color:var(--tl-ui-hi)}
@keyframes tl-drop{from{opacity:0;transform:translateY(-6px)}}
.tl-frame .tl-logo{display:grid;place-items:center;width:34px;height:34px;background:var(--tl-red);border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.06),0 6px 24px rgba(232,50,31,.35)}
.tl-logo .tl-mark{width:14px;height:18px}
.tl-frame .tl-logo-xl{width:132px;height:132px;border-radius:10px}
.tl-frame .tl-logo-xl .tl-mark{width:49px;height:63px}
.tl-actions{position:absolute;right:26px;top:22px;display:flex;align-items:center;gap:14px}
.tl-lamp{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;color:var(--tl-ui);padding:8px 2px}
.tl-lamp:hover{color:var(--tl-ui-hi)}
.tl-lamp-dot{width:22px;height:12px;border-radius:12px;background:#3a302b;position:relative;transition:background .3s}
.tl-lamp-dot::after{content:"";position:absolute;left:2px;top:2px;width:8px;height:8px;border-radius:50%;background:#8e847a;transition:transform .3s,background .3s}
.tl-day .tl-lamp-dot{background:#e6c88e}
.tl-day .tl-lamp-dot::after{transform:translateX(10px);background:#fff;box-shadow:0 0 8px #ffd27a}
.tl-frame .tl-cta{background:var(--tl-red);color:#fff4ea;font-family:"Instrument Serif",ui-serif,Georgia,serif;font-size:18px;line-height:1;padding:11px 16px 12px;border-radius:4px;box-shadow:0 8px 30px rgba(232,50,31,.3);transition:background .2s,transform .2s}
.tl-frame .tl-cta:hover{background:#ff4430;transform:translateY(-1px)}

/* ---- type ---- */
.tl-serif,.tl-hero-h,.tl-h1,.tl-h2,.tl-h3,.tl-row-l,.tl-row-p,.tl-card-t,.tl-mega,.tl-foot-mark,.tl-stat-n,.tl-acc-t,.tl-case-p,.tl-lede,.tl-hero-sub,.tl-list-a,.tl-next-t,.tl-bg-word,.tl-type-aa,.tl-voice-t,.tl-sw-n,.tl-band-cap p,.tl-acc-text,.tl-bul-lg{font-family:"Instrument Serif",ui-serif,Georgia,serif;font-weight:400;letter-spacing:-.005em}
.tl-eyebrow{font-size:12.5px;letter-spacing:.02em;margin:0}
.tl-center{text-align:center}
.tl-h1{font-size:clamp(52px,8.4cqw,140px);line-height:.95;margin:.25em 0 .3em;letter-spacing:-.02em}
.tl-h2{font-size:clamp(42px,5.6cqw,92px);line-height:1;margin:0;letter-spacing:-.015em}
.tl-frame .tl-h2 > .tl-t{display:block}
.tl-h3{display:flex;align-items:center;gap:10px;font-size:clamp(24px,2.4cqw,34px);line-height:1.1;margin:0 0 18px}
.tl-lede{font-size:clamp(20px,2cqw,28px);line-height:1.3;max-width:34em;margin:0}

/* ---- page frame + sections ---- */
.tl-page{position:relative;z-index:1}
.tl-page,.tl-contact,.tl-foot{--gl:clamp(22px,7cqw,100px);--gr:clamp(22px,7cqw,100px)}
.tl-ph{padding:clamp(150px,18cqw,220px) var(--gr) 40px var(--gl)}
.tl-sec{padding:clamp(60px,9cqw,140px) var(--gr) clamp(60px,9cqw,140px) var(--gl)}
.tl-sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:44px}
.tl-link{font-size:13.5px;color:var(--tl-ui);border-bottom:1px solid rgba(243,230,211,.25);padding-bottom:3px;transition:color .2s,border-color .2s}
.tl-link:hover{color:var(--tl-ui-hi);border-color:var(--tl-red)}

/* ---- hero ---- */
.tl-hero{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:120px clamp(20px,5cqw,80px) 110px}
.tl-hero-h{font-size:clamp(58px,11.2cqw,196px);line-height:.9;letter-spacing:-.03em;margin:.22em 0 .32em}
.tl-hero-line{display:block}
.tl-hero-sub{font-size:clamp(19px,1.8cqw,25px);line-height:1.35;max-width:30em;margin:0 auto}
.tl-hero-foot{position:absolute;left:var(--gl);right:var(--gr);bottom:30px;display:flex;justify-content:space-between;font-size:12px;color:var(--tl-dim)}
.tl-hint{display:inline-flex;align-items:center;gap:8px;color:var(--tl-ui-2)}
.tl-hint::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--tl-red);box-shadow:0 0 10px var(--tl-red);animation:tl-pulse 1.8s infinite}
@keyframes tl-pulse{50%{opacity:.35}}
.tl-hint-touch{display:none}
@media (hover:none){.tl-hint-fine{display:none}.tl-hint-touch{display:inline}}

/* ---- principles ---- */
.tl-prin{padding:clamp(80px,10cqw,160px) clamp(24px,7cqw,120px) clamp(60px,8cqw,120px)}
.tl-emb-wrap{position:relative;width:150px;height:105px;margin:0 auto 26px}
.tl-emb{width:150px;height:105px;background:none;overflow:visible}
.tl-src{position:absolute;left:50%;top:16px;width:2px;height:2px}
.tl-emb-wrap:not(.tl-lit-up) .tl-emb-torch .tl-fl{visibility:hidden}
.tl-emb-halo{position:absolute;left:50%;top:16px;width:240px;height:240px;margin:-120px 0 0 -120px;border-radius:50%;background:radial-gradient(circle,rgba(255,150,60,.42) 0,rgba(232,50,31,.18) 30%,rgba(232,50,31,0) 62%);opacity:0;transform:scale(.3);transition:opacity .5s,transform .9s cubic-bezier(.2,.9,.2,1.2);pointer-events:none;mix-blend-mode:screen}
.tl-emb-wrap.tl-lit-up .tl-emb-halo{opacity:1;transform:scale(1);animation:tl-flick 2.2s .9s infinite}
.tl-emb-wrap.tl-lit-up .tl-emb-torch svg{animation:tl-catch .7s cubic-bezier(.2,.9,.3,1.4)}
@keyframes tl-catch{0%{transform:scale(.85);filter:brightness(2.4)}60%{transform:scale(1.08)}100%{transform:none;filter:none}}
.tl-emb .tl-lo{filter:saturate(.35) brightness(.5)}
.tl-emb .tl-hi{filter:drop-shadow(0 0 10px rgba(255,190,80,.45))}
.tl-emb-torch{position:absolute;left:50%;top:6px;transform:translateX(-50%)}
.tl-emb-torch svg{display:block}
.tl-rows{list-style:none;margin:clamp(60px,7cqw,110px) auto 0;padding:0;max-width:1080px}
.tl-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.85fr);column-gap:clamp(24px,5cqw,90px);padding:0 0 clamp(34px,4cqw,56px)}
.tl-row > .tl-rule{grid-column:1/-1;margin-bottom:clamp(34px,4cqw,56px)}
.tl-row-end{padding:0}
.tl-row-end .tl-rule{margin:0}
.tl-row-l{position:relative;font-size:clamp(24px,2.5cqw,36px);line-height:1.15;margin:0;display:flex;align-items:flex-start;gap:8px}
.tl-row-n{position:absolute;left:-18px;top:2px;line-height:1}
.tl-row-p{font-size:clamp(22px,2.45cqw,35px);line-height:1.2;margin:0;max-width:21em}

/* ---- photo band ---- */
.tl-band{padding:0 clamp(16px,3cqw,40px) clamp(60px,8cqw,120px)}
.tl-band-img{position:relative;height:clamp(320px,52cqw,820px);border-radius:14px;overflow:hidden;background:#2a1c14}
.tl-band-img img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;transform-origin:50% 60%}
.tl-band-cap{padding-left:max(0px,calc(var(--gl) - 40px));display:flex;justify-content:space-between;gap:20px;margin-top:16px}
.tl-band-cap p{margin:0;font-size:clamp(17px,1.6cqw,22px)}

/* ---- work cards ---- */
.tl-grid{list-style:none;margin:0;padding:0;display:grid;gap:clamp(28px,3.2cqw,48px) clamp(16px,2cqw,28px)}
.tl-grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.tl-grid-4{grid-template-columns:repeat(4,minmax(0,1fr));padding:20px var(--gr) clamp(60px,8cqw,120px) var(--gl)}
.tl-card-b{display:block;width:100%}
.tl-thumb{aspect-ratio:4/5;border-radius:8px}
.tl-thumb img{transition:transform 1.1s cubic-bezier(.2,.7,.2,1)}
.tl-card-b:hover .tl-thumb img{transform:scale(1.045)}
.tl-card-meta{display:flex;align-items:baseline;gap:10px;margin-top:14px}
.tl-card-n{font-size:11px;color:var(--tl-red);font-variant-numeric:tabular-nums}
.tl-card-t{font-size:clamp(20px,1.7cqw,25px);line-height:1.1;flex:1}
.tl-card-y{font-size:12.5px;font-variant-numeric:tabular-nums}
.tl-card-k{display:block;font-size:12px;margin:3px 0 0 26px;color:var(--tl-dim)}

/* ---- case ---- */
.tl-case{padding-bottom:40px}
.tl-back{position:absolute;right:clamp(24px,4cqw,64px);top:130px}
.tl-case-hero{margin:20px clamp(16px,3cqw,40px) 0;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:#221c19}
.tl-case-hero img{width:100%;height:100%;max-width:none;object-fit:cover;display:block}
.tl-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px;margin:56px var(--gr) 0 var(--gl);padding:0}
.tl-meta div{border-top:1px solid var(--tl-line);padding-top:14px}
.tl-meta dt{font-size:12px;color:var(--tl-red);margin-bottom:6px}
.tl-meta dd{margin:0;font-size:15px}
.tl-case-body{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(24px,4cqw,64px);padding:clamp(70px,9cqw,140px) var(--gr) clamp(70px,9cqw,140px) var(--gl)}
.tl-case-p{font-size:clamp(19px,1.7cqw,24px);line-height:1.32;margin:0}
.tl-case-pair{display:grid;grid-template-columns:1.25fr 1fr;gap:clamp(12px,1.6cqw,24px);padding:0 clamp(16px,3cqw,40px)}
.tl-crop{aspect-ratio:4/5;border-radius:14px}
.tl-crop-a img{transform:scale(1.6);transform-origin:25% 35%}
.tl-crop-b img{transform:scale(1.9);transform-origin:75% 70%}
.tl-stats{list-style:none;margin:0;padding:clamp(60px,8cqw,120px) var(--gr) clamp(60px,8cqw,120px) var(--gl);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.tl-stats-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.tl-stats li{border-top:1px solid var(--tl-line);padding-top:18px}
.tl-stat-n{display:block;font-size:clamp(54px,6.5cqw,108px);line-height:1;letter-spacing:-.03em}
.tl-stat-l{display:block;font-size:13px;margin-top:10px}
.tl-next{position:relative;display:grid;grid-template-columns:1fr auto;align-items:center;gap:24px;width:calc(100% - var(--gl) - var(--gr));margin:0 var(--gr) 0 var(--gl);padding:44px 0;border-top:1px solid var(--tl-line);border-bottom:1px solid var(--tl-line)}
.tl-next-k{grid-column:1/-1;font-size:12px;color:var(--tl-red)}
.tl-next-t{font-size:clamp(46px,7cqw,120px);line-height:1;letter-spacing:-.02em}
.tl-next-img{width:clamp(120px,16cqw,240px);aspect-ratio:4/3;border-radius:10px}

/* ---- agency ---- */
.tl-duo{display:grid;grid-template-columns:1.5fr 1fr;gap:clamp(12px,1.6cqw,24px);padding:30px clamp(16px,3cqw,40px) 0}
.tl-duo-a{aspect-ratio:3/2;border-radius:14px}
.tl-duo-b{aspect-ratio:4/5;border-radius:14px;margin-top:clamp(40px,8cqw,140px)}
.tl-list{list-style:none;margin:48px 0 0;padding:0}
.tl-list li{display:grid;grid-template-columns:24px 1fr 1fr;align-items:baseline;padding-bottom:20px}
.tl-list li > .tl-rule{grid-column:1/-1;margin-bottom:20px}
.tl-list-a{font-size:clamp(24px,2.6cqw,38px);line-height:1.1}
.tl-list-b{font-size:14px;text-align:right}

/* ---- services accordion ---- */
.tl-acc{list-style:none;margin:0;padding:20px var(--gr) clamp(60px,8cqw,120px) var(--gl)}
.tl-acc-h{margin:0}
.tl-acc-h button{display:grid;grid-template-columns:52px minmax(0,1.2fr) minmax(0,1fr) 28px;align-items:center;gap:20px;width:100%;padding:26px 0}
.tl-acc-n{font-size:12px;color:var(--tl-red);font-variant-numeric:tabular-nums}
.tl-acc-t{font-size:clamp(34px,4.6cqw,76px);line-height:1;letter-spacing:-.02em}
.tl-acc-l{font-size:14px}
.tl-acc-x{position:relative;width:20px;height:20px}
.tl-acc-x::before,.tl-acc-x::after{content:"";position:absolute;left:0;top:9px;width:20px;height:1.5px;background:var(--tl-ui);transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.tl-acc-x::after{transform:rotate(90deg)}
.tl-open .tl-acc-x::after{transform:rotate(0)}
.tl-open .tl-acc-x::before,.tl-open .tl-acc-x::after{background:var(--tl-red)}
.tl-acc-p{display:grid;grid-template-rows:0fr;transition:grid-template-rows .6s cubic-bezier(.2,.8,.2,1)}
.tl-open .tl-acc-p{grid-template-rows:1fr}
.tl-acc-p > .tl-acc-in{overflow:hidden;min-height:0;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:clamp(24px,4cqw,64px);padding-left:72px}
.tl-open .tl-acc-in{padding-bottom:40px}
.tl-acc-text{font-size:clamp(20px,1.9cqw,27px);line-height:1.3;margin:0 0 22px}
.tl-acc-img{aspect-ratio:4/3;border-radius:12px}
.tl-bul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.tl-bul li{display:flex;align-items:center;gap:10px;font-size:15px}
.tl-bul-lg li{font-size:clamp(20px,2cqw,28px);align-items:baseline}

/* ---- brand guide ---- */
.tl-bg{padding:clamp(50px,6cqw,90px) var(--gr) 0 var(--gl)}
.tl-bg-n{font-family:"Instrument Sans",ui-sans-serif,system-ui,sans-serif;font-size:12px;color:var(--tl-red);width:30px}
.tl-bg-mark{display:flex;align-items:center;gap:clamp(20px,4cqw,56px);flex-wrap:wrap;padding:30px 0}
.tl-bg-word{font-size:clamp(46px,6.6cqw,110px);line-height:1;letter-spacing:-.02em}
.tl-bg-p{font-size:15.5px;max-width:34em;margin:12px 0 0}
.tl-sw{list-style:none;margin:10px 0 0;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
.tl-sw-chip{display:block;aspect-ratio:1;border-radius:10px;border:1px solid var(--tl-line);margin-bottom:12px}
.tl-sw-n{display:block;font-size:24px;line-height:1}
.tl-sw-hex{display:block;font-size:12px;color:var(--tl-ui-2);margin:4px 0 6px;font-variant-numeric:tabular-nums}
.tl-sw-u{display:block;font-size:13px}
.tl-type{display:grid;grid-template-columns:1.3fr 1fr;gap:40px;align-items:end}
.tl-type-aa{font-size:clamp(90px,13cqw,220px);line-height:.9;letter-spacing:-.03em}
.tl-type-sans{display:inline-block;font-size:clamp(44px,5cqw,80px);font-weight:500;letter-spacing:-.03em;line-height:1}
.tl-voice{display:grid;grid-template-columns:1fr 1fr;gap:40px}
.tl-voice-k{display:block;font-size:12px;color:var(--tl-ui-2);margin-bottom:12px}
.tl-voice-no{color:var(--tl-red)}
.tl-voice-t{font-size:clamp(24px,2.6cqw,38px);line-height:1.15;margin:0 0 8px}
.tl-strike{text-decoration:line-through;text-decoration-color:rgba(232,50,31,.7);text-decoration-thickness:1.5px}

/* ---- contact ---- */
.tl-contact{position:relative;z-index:1;text-align:center;padding:clamp(100px,13cqw,200px) clamp(20px,5cqw,80px) clamp(60px,7cqw,100px)}
.tl-ignite{position:relative;display:inline-block;margin:26px 0 8px}
.tl-mega{font-size:clamp(76px,15cqw,250px);line-height:.92;letter-spacing:-.035em}
.tl-fire{position:absolute;left:0;top:0;pointer-events:none;opacity:0;color:transparent;-webkit-text-fill-color:transparent;-webkit-background-clip:text;background-clip:text;background-image:linear-gradient(0deg,#e8321f 8%,#ff7a1f 38%,#ffc95a 66%,#fff3d6 92%);background-size:100% 180%;padding:.06em .14em .12em;margin:-.06em -.14em -.12em;-webkit-mask-image:radial-gradient(circle var(--ig,0px) at var(--ix,50%) var(--iy,50%),#000 72%,rgba(0,0,0,0) 100%);mask-image:radial-gradient(circle var(--ig,0px) at var(--ix,50%) var(--iy,50%),#000 72%,rgba(0,0,0,0) 100%)}
.tl-on .tl-lit-up .tl-fire{opacity:1;animation:tl-burn 2.4s ease-in-out infinite alternate}
.tl-lit-up.tl-ignite{filter:drop-shadow(0 0 26px rgba(255,80,20,.4))}
@keyframes tl-burn{from{background-position:0 100%}to{background-position:0 40%}}
.tl-embers{position:absolute;inset:0;pointer-events:none}
.tl-embers i{position:absolute;bottom:20%;width:4px;height:4px;background:#ffb347;box-shadow:0 0 6px #ff6a1a;opacity:0}
.tl-lit-up .tl-embers i{animation:tl-ember 2.4s linear infinite}
@keyframes tl-ember{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(14px,-150px)}}
.tl-ign-hint{font-size:13px;color:var(--tl-ui-2);margin:0}
.tl-ign-b{display:none;color:var(--tl-red)}
.tl-contact:has(.tl-lit-up) .tl-ign-a{display:none}
.tl-contact:has(.tl-lit-up) .tl-ign-b{display:inline}
.tl-contact-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px;text-align:left;margin:clamp(60px,8cqw,110px) auto 0;max-width:1100px}
.tl-contact-grid > div{border-top:1px solid var(--tl-line);padding-top:14px;font-size:15px}
.tl-k{display:block;font-size:12px;color:var(--tl-red);margin-bottom:6px}

/* ---- footer ---- */
.tl-foot{position:relative;z-index:1;padding:0 var(--gr) 30px var(--gl)}
.tl-foot-top{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;padding:56px 0 64px}
.tl-foot-mark{font-size:clamp(54px,9cqw,150px);line-height:.92;letter-spacing:-.03em;margin:0}
.tl-foot-cols{display:flex;gap:56px;font-size:13.5px;color:var(--tl-ui)}
.tl-foot-cols div{display:flex;flex-direction:column;gap:4px}
.tl-foot-cols button:hover{color:var(--tl-ui-hi)}
.tl-foot-bot{display:flex;justify-content:space-between;gap:20px;font-size:12px;color:var(--tl-dim);border-top:1px solid var(--tl-line);padding-top:20px}
.tl-foot-bot button:hover{color:var(--tl-ui-hi)}

/* ---- transitions ---- */
.tl-curtain{position:fixed;inset:0;z-index:90;background:#0e0c0c;visibility:hidden;display:grid;place-items:center;pointer-events:none}
.tl-curtain::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,#ff6a1a 30%,#ffd36b 50%,#ff6a1a 70%,transparent);box-shadow:0 0 40px 10px rgba(255,90,30,.35)}
.tl-curtain-in{display:flex;flex-direction:column;align-items:center;gap:18px;font-family:"Instrument Serif",ui-serif,Georgia,serif;font-style:italic;font-size:clamp(40px,6vw,88px);color:var(--tl-cream);line-height:1}
.tl-ghost{position:fixed;z-index:85;visibility:hidden;object-fit:cover;max-width:none;pointer-events:none}

.tl-sparks{position:absolute;inset:0;z-index:59;pointer-events:none;overflow:hidden}
.tl-sparks i{position:absolute;left:-1px;top:-1px;width:3px;height:3px;opacity:0;box-shadow:0 0 6px rgba(255,120,30,.9);will-change:transform,opacity}
.tl-moth{position:absolute;left:0;top:0;margin:-9px 0 0 -13px;z-index:58;pointer-events:none;opacity:0;transition:opacity .5s;filter:drop-shadow(0 0 4px rgba(255,170,90,.5))}
.tl-moth svg{display:block}
.tl-mw{animation:tl-wing .18s steps(1,end) infinite;opacity:0}
@keyframes tl-wing{0%{opacity:1}50%,100%{opacity:0}}
.tl-hero,.tl-sec,.tl-ph{position:relative}
.tl-sconce{position:absolute;z-index:3;width:32px;height:52px;display:block}
.tl-sconce > svg{position:relative;display:block;filter:brightness(.55) saturate(.6);transition:filter .6s}
.tl-sconce::before{content:"";position:absolute;left:50%;top:26px;width:18px;height:26px;margin-left:-9px;background:#1d1817;border:1px solid rgba(243,230,211,.06);border-radius:3px;z-index:-1}
.tl-sconce::after{content:"";position:absolute;left:7px;right:7px;top:33px;height:4px;background:#2d2522;border-radius:2px}
.tl-sconce:not(.tl-lit-up) .tl-fl{visibility:hidden}
.tl-sconce.tl-lit-up > svg{filter:none;animation:tl-catch .7s cubic-bezier(.2,.9,.3,1.4)}
.tl-sconce .tl-src{top:10px}
.tl-sconce-halo{position:absolute;left:50%;top:10px;width:200px;height:200px;margin:-100px 0 0 -100px;border-radius:50%;background:radial-gradient(circle,rgba(255,150,60,.4) 0,rgba(232,50,31,.16) 32%,rgba(232,50,31,0) 62%);opacity:0;transform:scale(.3);transition:opacity .5s,transform .9s cubic-bezier(.2,.9,.2,1.2);pointer-events:none;mix-blend-mode:screen}
.tl-sconce.tl-lit-up .tl-sconce-halo{opacity:1;transform:scale(1);animation:tl-flick 2s .9s infinite}
.tl-sconce-left{left:max(14px,calc(var(--gl) - 84px))}
.tl-sconce-right{right:clamp(18px,4cqw,64px)}
.tl-hero > .tl-sconce{top:42%}
.tl-hero > .tl-sconce-left{left:clamp(18px,6cqw,110px)}
.tl-hero > .tl-sconce-right{right:clamp(18px,6cqw,110px)}
.tl-ph > .tl-sconce{top:calc(clamp(150px,18cqw,220px) + 40px)}
.tl-sec > .tl-sconce{top:clamp(40px,6cqw,90px)}
.tl-count{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:var(--tl-ui);font-variant-numeric:tabular-nums}
.tl-count-done{color:#ffc95a}
.tl-warm{--tl-dim:#a19483;--tl-dim-lg:#8a7d70}
.tl-frame.tl-warm::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:2;background:radial-gradient(120% 60% at 50% 0%,rgba(255,140,60,.07),rgba(255,140,60,0) 70%);animation:tl-ask .9s both}
.tl-toast{position:fixed;left:50%;bottom:22px;z-index:70;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:11px 18px;border-radius:40px;background:#241b17;border:1px solid rgba(255,190,110,.25);color:#ffe2b0;font-size:13px;box-shadow:0 0 40px rgba(255,110,40,.25);white-space:nowrap;animation:tl-ask .7s both cubic-bezier(.2,.8,.2,1)}
.tl-frame.tl-day .tl-sconce-halo,.tl-frame.tl-day .tl-sparks,.tl-frame.tl-day .tl-moth{display:none}
.tl-veil{position:fixed;inset:0;z-index:54;visibility:hidden;opacity:0;pointer-events:none;--vr:0px;--vx:50%;--vy:45%;-webkit-mask-image:radial-gradient(circle var(--vr) at var(--vx) var(--vy),rgba(0,0,0,0) 0,rgba(0,0,0,0) 45%,#000 100%);mask-image:radial-gradient(circle var(--vr) at var(--vx) var(--vy),rgba(0,0,0,0) 0,rgba(0,0,0,0) 45%,#000 100%)}
.tl-ask{position:fixed;left:50%;bottom:22px;z-index:70;transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:8px 8px 8px 16px;border-radius:40px;background:#1a1616;color:#efe4d6;font-size:13px;box-shadow:0 14px 40px rgba(20,12,8,.28);white-space:nowrap;animation:tl-ask .8s 1.2s both cubic-bezier(.2,.8,.2,1)}
.tl-ask-t{display:inline-flex;align-items:center;gap:8px}
.tl-ask button{background:var(--tl-red);color:#fff4ea;border-radius:30px;padding:8px 14px;font-size:13px}
.tl-ask button:hover{background:#ff4430}
@keyframes tl-ask{from{opacity:0;transform:translate(-50%,20px)}}
.tl-hint-day{color:var(--tl-red);border-bottom:1px solid currentColor;padding-bottom:2px}

/* ---- lights on: a cream room, no torch, everything readable at full strength ---- */
.tl-frame.tl-day{--tl-bg:#efe7dc;--tl-dim:#2a2320;--tl-dim-lg:#1f1916;--tl-ui:#3b322d;--tl-ui-2:#5e534b;--tl-ui-hi:#000;--tl-line:rgba(43,36,33,.16);background:var(--tl-bg);transition:background .3s}
.tl-frame.tl-day .tl-t,.tl-frame.tl-day .tl-t em{background:none;color:var(--tl-dim);-webkit-text-fill-color:currentColor}
.tl-frame.tl-day .tl-rule{background:var(--tl-line)}
.tl-frame.tl-day .tl-lo{display:none}
.tl-frame.tl-day .tl-hi{-webkit-mask-image:none;mask-image:none}
.tl-frame.tl-day .tl-i{background:#ddd2c4}
.tl-frame.tl-day .tl-emb .tl-hi{filter:none}
.tl-frame.tl-day .tl-torch,.tl-frame.tl-day .tl-glow,.tl-frame.tl-day .tl-fire,.tl-frame.tl-day .tl-embers,.tl-frame.tl-day .tl-ign-hint,.tl-frame.tl-day .tl-emb-halo{display:none}
.tl-frame.tl-day .tl-lit-up.tl-ignite{filter:none}
.tl-frame.tl-day .tl-svc-menu{background:rgba(250,245,238,.97);border-color:var(--tl-line);box-shadow:0 20px 50px rgba(60,40,30,.18)}
.tl-frame.tl-day .tl-svc-menu button:hover{background:rgba(43,36,33,.06)}
.tl-frame.tl-day .tl-band-img{background:#d9cbb8}
.tl-frame.tl-day .tl-bar::before{background:linear-gradient(#efe7dc 66%,rgba(239,231,220,0))}

/* ---- wide frames: text clears the fixed nav ---- */
@container tl (min-width: 1001px){
  .tl-page,.tl-contact,.tl-foot{--gl:clamp(160px,13cqw,210px)}
}

/* ---- narrow frames ---- */
@container tl (max-width: 1000px){
  .tl-grid-4{grid-template-columns:repeat(3,minmax(0,1fr))}
  .tl-contact-grid,.tl-stats-4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .tl-sw{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@container tl (max-width: 720px){
  .tl-bar::before{content:"";position:absolute;left:0;right:0;top:-10px;height:178px;background:linear-gradient(#141212 66%,rgba(20,18,18,0));pointer-events:none}
  .tl-nav{left:18px;top:16px;font-size:12px}
  .tl-actions{right:16px;top:16px;gap:10px}
  .tl-count-l,.tl-hero > .tl-sconce,.tl-ph > .tl-sconce-left{display:none}
  .tl-ph > .tl-sconce-right{top:150px}
  .tl-toast{white-space:normal;width:calc(100% - 32px);justify-content:center}
  .tl-frame .tl-cta{font-size:16px;padding:9px 12px 10px}
  .tl-lamp{font-size:11.5px}
  .tl-hero{padding-top:150px}
  .tl-hero-foot{font-size:11px}
  .tl-hero-foot > span:not(.tl-hint){display:none}
  .tl-hero-foot{justify-content:center}
  .tl-row{grid-template-columns:1fr;row-gap:10px}
  .tl-row-n{left:-14px}
  .tl-rows{padding-left:14px}
  .tl-grid-3,.tl-grid-4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .tl-card-k{margin-left:0}
  .tl-card-n{display:none}
  .tl-sec-head{flex-direction:column;align-items:flex-start}
  .tl-meta,.tl-case-body,.tl-stats{grid-template-columns:1fr 1fr}
  .tl-case-body{grid-template-columns:1fr}
  .tl-back{top:96px}
  .tl-duo,.tl-case-pair,.tl-type,.tl-voice{grid-template-columns:1fr}
  .tl-duo-b{margin-top:0;aspect-ratio:4/3}
  .tl-list li{grid-template-columns:24px 1fr}
  .tl-list-b{grid-column:2;text-align:left}
  .tl-acc-h button{grid-template-columns:34px 1fr 24px;gap:12px}
  .tl-acc-l{grid-column:2;grid-row:2}
  .tl-acc-x{grid-column:3;grid-row:1}
  .tl-acc-p > .tl-acc-in{grid-template-columns:1fr;padding-left:0}
  .tl-sw{grid-template-columns:repeat(2,minmax(0,1fr))}
  .tl-contact-grid{grid-template-columns:1fr}
  .tl-foot-top{flex-direction:column;align-items:flex-start}
  .tl-foot-bot{flex-direction:column}
  .tl-next{grid-template-columns:1fr}
  .tl-next-img{display:none}
}

/* ---- reduced motion: the light still follows, nothing flickers or travels ---- */
@media (prefers-reduced-motion: reduce){
  .tl-fl,.tl-fm,.tl-mw{animation:none}
  .tl-mw:first-child{opacity:1}
  .tl-sconce.tl-lit-up > svg,.tl-sconce.tl-lit-up .tl-sconce-halo,.tl-frame.tl-warm::after,.tl-toast{animation:none}
  .tl-fm:first-child{opacity:1}
  .tl-flame::before,.tl-emb-wrap.tl-lit-up .tl-emb-halo,.tl-emb-wrap.tl-lit-up .tl-emb-torch svg{animation:none}
  .tl-fl:first-child{opacity:1}
  .tl-glow i,.tl-hint::before,.tl-lit-up .tl-embers i{animation:none}
  .tl-on .tl-lit-up .tl-fire{animation:none}
  .tl-acc-p,.tl-thumb img,.tl-torch,.tl-glow{transition:none}
  .tl-svc-menu{animation:none}
}
`
