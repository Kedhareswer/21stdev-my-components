"use client"

// Stipple Orb Landing: a complete landing page for a platform where you back
// people instead of companies, in one file. A quiet grey page, navy buttons
// and one warm accent. The hero is a sphere of a few thousand stippled dots,
// lit from the upper right in the accent and fading to grey grain in shadow.
// Drag it to spin it, move over it to part the dots, click it to send a
// ripple across its surface.
//
// Below it: a live diagram of backers pooling into one person's earnings, a
// pair of working calculators (what a stake could return, what a person could
// raise), three looping how-it-works vignettes, a carousel of success stories,
// a dotted call to action that follows the pointer, a two-column FAQ, a
// request-access dialog and a footer with a stippled horizon.
//
// Everything is drawn here: the orb and the horizon are canvas, the diagrams
// are SVG, the type is the system stack. The photos are embedded, so nothing
// loads at runtime.
import * as React from "react"

export type SolLink = { label: string; href?: string }

export type SolBacker = { name: string; mark?: "pine" | "rings" | "monogram" | "wave" }

export type SolInvestor = { name: string; amount: number; avatar?: string }

export type SolStreamIcon = "rocket" | "megaphone" | "note" | "case" | "play" | "spark"

export type SolStream = { label: string; value: number; icon?: SolStreamIcon }

export type SolStory = {
  name: string
  role: string
  /** One line under the name, e.g. "2.4M monthly listeners". */
  reach: string
  photo?: string
  points: string[]
  raised: number
  /** Share of income offered, 0 to 1. */
  share: number
  years: number
  /** Monthly earnings since the raise, as a sparkline. */
  growth?: number[]
}

export type SolFaq = { q: string; a: string }

export type SolPath = {
  title: string
  text: string
  link: string
  bullets: string[]
  caption: string
}

/** What a stake buys into: the deal a person offers and how fast their income grows. */
export type SolModel = {
  /** This year's income, before the raise. */
  income: number
  /** Yearly income growth, e.g. 0.12. */
  growth: number
  /** Share of income offered, 0 to 1. */
  share: number
  /** The total raise the share is sold for. */
  raise: number
  /** Agreement length in years. */
  years: number
}

export type SolAccessRequest = {
  role: "invest" | "raise"
  name: string
  email: string
  /** The check size for investors, a link to their work for individuals. */
  detail: string
}

export type SolPaletteName = "ember" | "lagoon" | "orchid"

export type SolPaletteInput = {
  accent?: string
  button?: string
  onButton?: string
  mint?: string
  cream?: string
  sky?: string
}

export interface StippleOrbLandingProps {
  /** Brand name in the nav and footer. */
  brand?: string
  /** Replaces the drawn stipple mark beside the brand. */
  logo?: React.ReactNode
  /** `#thesis`, `#paths`, `#how`, `#stories`, `#faq` scroll in-page. */
  nav?: SolLink[]
  /** The nav button. Without an href it opens the request-access dialog. */
  navAction?: SolLink
  hero?: {
    /** `*asterisks*` mute words, `\n` breaks the line. */
    title?: string
    text?: string
    action?: SolLink
    /** The line beside the button, after the avatars. */
    social?: string
    backersLabel?: string
    backers?: SolBacker[]
  }
  thesis?: {
    title: string
    action?: SolLink
    investors?: SolInvestor[]
    /** How many more backers the card mentions. */
    more?: number
    streams?: SolStream[]
    /** The stake shown in the ring, 0 to 1. */
    stake?: number
  } | null
  paths?: {
    title: string
    investors: SolPath
    individuals: SolPath
    model?: { income?: number; growth?: number; share?: number; raise?: number; years?: number }
  } | null
  steps?: { title: string; items: { title: string; text: string }[] } | null
  stories?: { title: string; items: SolStory[] } | null
  cta?: { title: string; action?: SolLink } | null
  faq?: { title: string; groups: { title: string; items: SolFaq[] }[] } | null
  footer?: { tagline?: string; columns?: { title: string; links: SolLink[] }[]; note?: string; credit?: string } | null
  currency?: string
  palette?: SolPaletteName | SolPaletteInput
  theme?: "system" | "light" | "dark"
  themeToggle?: boolean
  /** Called with the dialog's fields. Return (or resolve to) `false`, or throw, to show an error. */
  onRequestAccess?: (data: SolAccessRequest) => unknown
  /** Minimum height of the hero. A definite length, so it survives any host layout. */
  height?: string
  className?: string
}

// #region content
const PALETTES = {
  ember: { accent: "#f0883e", button: "#1f2c4a", onButton: "#ffffff", mint: "#d4f0d0", cream: "#f6efc6", sky: "#d7ebf8" },
  lagoon: { accent: "#1aa59a", button: "#123b3a", onButton: "#ffffff", mint: "#d2efe9", cream: "#efeccd", sky: "#d3e6f3" },
  orchid: { accent: "#b45fd6", button: "#2b1f45", onButton: "#ffffff", mint: "#e3e9d2", cream: "#f5e7d3", sky: "#e4dcf6" },
}

const DEFAULT_NAV = [
  { label: "How it works", href: "#how" },
  { label: "Stories", href: "#stories" },
  { label: "FAQ", href: "#faq" },
]

const DEFAULT_HERO = {
  title: "*Back the people*\nWorth Betting On",
  text: "Fund ambitious individuals early, and own a share of everything they earn for the next fifteen years.",
  action: { label: "Request access" },
  social: "Joined by 1,200+ backers",
  backersLabel: "Backed by",
  backers: [
    { name: "NORTHPINE", mark: "pine" as const },
    { name: "Halden Ventures", mark: "rings" as const },
    { name: "Okafor & Vale", mark: "monogram" as const },
  ],
}

const DEFAULT_THESIS = {
  title: "Skip the cap table. Back *the person behind it,* and share in what they earn for fifteen years.",
  action: { label: "Request access" },
  more: 182,
  stake: 0.02,
  streams: [
    { label: "Startups", value: 72000, icon: "rocket" as const },
    { label: "Brand deals", value: 18900, icon: "megaphone" as const },
    { label: "Royalties", value: 34100, icon: "note" as const },
    { label: "Salary", value: 54700, icon: "case" as const },
    { label: "Content", value: 21400, icon: "play" as const },
  ],
}

const DEFAULT_PATHS = {
  title: "Back someone, or get backed",
  investors: {
    title: "For backers",
    text: "Put money behind a person, not a single company. Wherever their career goes over the term, you receive a share of it.",
    link: "Start backing",
    bullets: ["A share of every income stream", "Not tied to one company", "Up to fifteen years of upside"],
    caption: "Your share of everything they build",
  },
  individuals: {
    title: "For individuals",
    text: "Raise capital today for a small share of what you earn over a set term. No board, no equity, no one telling you what to build.",
    link: "Apply for funding",
    bullets: ["Keep full independence", "Spend it on what moves you", "Backers who want you to win"],
    caption: "Use of funds",
  },
}

const DEFAULT_MODEL: SolModel = { income: 180000, growth: 0.12, share: 0.075, raise: 135000, years: 15 }

const DEFAULT_STEPS = {
  title: "How it works",
  items: [
    { title: "Request access", text: "Tell us who you are and whether you want to back people or raise." },
    { title: "Get approved", text: "We review every application and verify every backer by hand." },
    { title: "Start backing", text: "Browse people raising now and make your first commitment." },
  ],
}

const DEFAULT_FAQ = {
  title: "Questions, answered",
  groups: [
    {
      title: "For backers",
      items: [
        { q: "How is the agreement structured?", a: "Each raise is an income share agreement held by a dedicated legal entity. Backers own units of that entity, and the entity receives the agreed share of the person's income for the term." },
        { q: "How and when am I paid?", a: "Earnings are reported and verified every quarter. Distributions follow within thirty days, straight to your linked bank account, with a statement for your records." },
        { q: "What if the person stops earning?", a: "Payments pause in any year their income falls below the floor set in the agreement. The term does not stretch to make up for it, so there is real risk, and you can lose what you put in." },
        { q: "Can I sell my stake early?", a: "After the first year you can list your units on the secondary board. Other approved backers can buy them at a price you set." },
      ],
    },
    {
      title: "For individuals",
      items: [
        { q: "How much of my income do I share?", a: "Most people offer between three and ten percent. You choose the share and the term, and we show you what that is likely to raise before you commit." },
        { q: "How much can I raise?", a: "Raises run from $25k to $2M. The amount depends on your track record, your earnings today and how fast they are growing." },
        { q: "Who can see my application?", a: "Only our review team until you are approved. After that, approved backers see the profile you publish, never your private documents." },
        { q: "Can I buy back the agreement?", a: "Yes. From year three you can buy out the remaining term at a cap fixed on day one, so you always know the ceiling." },
      ],
    },
  ],
}

const DEFAULT_FOOTER = {
  tagline: "We help you back the people who will build what comes next.",
  columns: [
    { title: "Navigation", links: [{ label: "How it works", href: "#how" }, { label: "Stories", href: "#stories" }, { label: "FAQ", href: "#faq" }] },
    { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "Risk notice", href: "#" }] },
  ],
  note: "Backing individuals is risky. You may lose the money you commit. Past results do not predict future returns.",
  credit: "All rights reserved.",
}
// #endregion content

// #region logic
type Rgb = [number, number, number]

/** Seeded PRNG, so every orb and chart draws the same on every load. */
function mulberry32(seed: number) {
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
 * n points spread evenly over a unit sphere (the Fibonacci lattice), each with
 * a radius jitter so the edge reads as grain, and a dither threshold that
 * decides how lit it must be before it shows. Packed as x, y, z, r, u.
 */
function fibSphere(n: number, seed: number) {
  const rnd = mulberry32(seed)
  const out = new Float32Array(n * 5)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2
    const r = Math.sqrt(1 - y * y)
    const th = golden * i + (rnd() - 0.5) * 0.35
    out[i * 5] = Math.cos(th) * r
    out[i * 5 + 1] = y
    out[i * 5 + 2] = Math.sin(th) * r
    const j = rnd()
    out[i * 5 + 3] = 1 + j * j * j * 0.16 - 0.015
    out[i * 5 + 4] = rnd()
  }
  return out
}

/** Rotate a point by yaw (around y) then pitch (around x). */
function rotate(x: number, y: number, z: number, cy: number, sy: number, cx: number, sx: number, out: number[]) {
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  out[0] = x1
  out[1] = y * cx - z1 * sx
  out[2] = y * sx + z1 * cx
  return out
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** The light falls from the upper right and a little in front. */
const LIGHT = (() => {
  const v = [0.5, -0.72, 0.48]
  const l = Math.hypot(v[0], v[1], v[2])
  return [v[0] / l, v[1] / l, v[2] / l]
})()

/** How lit a surface point is, and how likely its dot is to show there. */
function shade(x: number, y: number, z: number) {
  const lit = x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]
  return { lit, density: 0.1 + 0.9 * smooth(-0.7, 0.75, lit) }
}

function hexToRgb(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, "")
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  const n = parseInt(h.slice(0, 6), 16)
  if (!Number.isFinite(n) || h.length < 6) return [128, 128, 128]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Count colour steps from a to b, as css strings. */
function ramp(a: Rgb, b: Rgb, steps: number) {
  const out: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 1 : i / (steps - 1)
    out.push("rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," + Math.round(a[1] + (b[1] - a[1]) * t) + "," + Math.round(a[2] + (b[2] - a[2]) * t) + ")")
  }
  return out
}

/** Black or white, whichever reads on the colour. */
function onColor(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#141414" : "#ffffff"
}

function resolvePalette(p: SolPaletteName | SolPaletteInput | undefined) {
  if (!p) return PALETTES.ember
  if (typeof p === "string") return PALETTES[p] || PALETTES.ember
  const base = PALETTES.ember
  const button = p.button || base.button
  return {
    accent: p.accent || base.accent,
    button,
    onButton: p.onButton || (p.button ? onColor(button) : base.onButton),
    mint: p.mint || base.mint,
    cream: p.cream || base.cream,
    sky: p.sky || base.sky,
  }
}

/**
 * What a stake returns. The person's income grows each year; the agreed share
 * of it is paid into a pool, and a backer's slice of the pool is their stake
 * over the raise. All illustrative: the inputs are assumptions, not forecasts.
 */
function projectStake(amount: number, m: SolModel, years = m.years) {
  const slice = m.raise > 0 ? Math.min(1, amount / m.raise) : 0
  const yearly: number[] = []
  const cumulative: number[] = []
  let total = 0
  let income = m.income
  let breakeven = -1
  for (let y = 0; y < years; y++) {
    const paid = income * m.share * slice
    total += paid
    yearly.push(paid)
    cumulative.push(total)
    if (breakeven < 0 && total >= amount) breakeven = y + 1
    income *= 1 + m.growth
  }
  return {
    yearly,
    cumulative,
    total,
    multiple: amount > 0 ? total / amount : 0,
    /** The year the stake is paid back, or -1 if it never is within the term. */
    breakeven,
    /** Lifetime earnings the person needs for backers to get their money back. */
    revenueToBreakeven: m.share > 0 ? m.raise / m.share : 0,
  }
}

/**
 * What a person could raise: the share of their projected income over the term,
 * discounted at the return backers ask for.
 */
function capitalFor(income: number, share: number, years: number, growth = 0.12, discount = 0.2) {
  let sum = 0
  let inc = income
  for (let y = 0; y < years; y++) {
    sum += (inc * share) / Math.pow(1 + discount, y + 1)
    inc *= 1 + growth
  }
  return sum
}

function money(n: number, cur = "$") {
  const neg = n < 0
  const s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return (neg ? "-" : "") + cur + s
}

/** $950, $72k, $1.8M */
function compact(n: number, cur = "$") {
  const a = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (a >= 1e6) return sign + cur + (Math.round(a / 1e5) / 10).toString() + "M"
  if (a >= 1e4) return sign + cur + Math.round(a / 1e3) + "k"
  if (a >= 1e3) return sign + cur + (Math.round(a / 100) / 10).toString() + "k"
  return sign + cur + Math.round(a)
}

/** Angular spans for values around a ring, starting at the top, with a gap between them (radians). */
function ringArcs(values: number[], gap: number, start = -Math.PI / 2, sweep = Math.PI * 2) {
  const sum = values.reduce((a, b) => a + Math.max(0, b), 0) || 1
  const room = Math.max(0, sweep - gap * values.length)
  let a = start + gap / 2
  return values.map((v) => {
    const w = (Math.max(0, v) / sum) * room
    const arc = { a0: a, a1: a + w, mid: a + w / 2 }
    a += w + gap
    return arc
  })
}

/** A ring segment as an SVG path. */
function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const f = (n: number) => Math.round(n * 100) / 100
  const large = a1 - a0 > Math.PI ? 1 : 0
  const p = (r: number, a: number) => f(cx + r * Math.cos(a)) + " " + f(cy + r * Math.sin(a))
  return "M" + p(r1, a0) + " A" + r1 + " " + r1 + " 0 " + large + " 1 " + p(r1, a1) + " L" + p(r0, a1) + " A" + r0 + " " + r0 + " 0 " + large + " 0 " + p(r0, a0) + " Z"
}

/** A smooth line through points (Catmull-Rom as cubic Béziers). */
function smoothPath(pts: number[][]) {
  if (!pts.length) return ""
  const f = (n: number) => Math.round(n * 10) / 10
  let d = "M" + f(pts[0][0]) + " " + f(pts[0][1])
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    d += " C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1])
  }
  return d
}

/** `*muted*` runs become flagged parts. */
function twoTone(text: string) {
  const parts: { text: string; muted: boolean }[] = []
  text.split(/(\*[^*]+\*)/).forEach((s) => {
    if (!s) return
    if (s.length > 2 && s[0] === "*" && s[s.length - 1] === "*") parts.push({ text: s.slice(1, -1), muted: true })
    else parts.push({ text: s, muted: false })
  })
  return parts
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

function nextIndex(i: number, key: string, n: number) {
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return -1
}

/** Points for the horizon: a half-disc of dots rising from the bottom edge, densest at its centre. */
function horizonPoints(n: number, seed: number) {
  const rnd = mulberry32(seed)
  const out = new Float32Array(n * 5)
  for (let i = 0; i < n; i++) {
    // Box-Muller for a soft radial falloff
    const g = Math.sqrt(-2 * Math.log(1 - rnd() * 0.999)) * 0.42
    const a = Math.PI + rnd() * Math.PI
    out[i * 5] = Math.cos(a) * g
    out[i * 5 + 1] = Math.sin(a) * g
    out[i * 5 + 2] = rnd()
    out[i * 5 + 3] = 0.4 + rnd() * 0.6
    out[i * 5 + 4] = rnd()
  }
  return out
}
// #endregion logic

const LOGO_DOTS = (() => {
  const out: { x: number; y: number; hot: boolean }[] = []
  for (let gy = 0; gy < 6; gy++)
    for (let gx = 0; gx < 6; gx++) {
      const x = 2.6 + gx * 3.1
      const y = 2.6 + gy * 3.1
      const d = Math.hypot(x - 10.35, y - 10.35)
      if (d < 9) out.push({ x, y, hot: x - y > 1.5 })
    }
  return out
})()

const FONT = '"Inter", "Inter Tight", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace'

const SOL_CSS = `
.sol-root{--sol-paper:#efefed;--sol-panel:#e8e8e5;--sol-card:#f8f8f6;--sol-ink:#141414;--sol-soft:#4a4a47;--sol-muted:#9a9a95;--sol-line:rgba(20,20,20,.09);--sol-line2:rgba(20,20,20,.16);--sol-shadow:0 1px 2px rgba(20,20,20,.06),0 8px 24px -12px rgba(20,20,20,.18);--sol-nav:64px;--sol-dotc:rgba(20,20,20,.16);--sol-btn:var(--sol-button);--sol-on-btn:var(--sol-on-button);
position:relative;min-height:var(--sol-h);background:var(--sol-paper);color:var(--sol-ink);overflow-x:clip;-webkit-font-smoothing:antialiased;line-height:1.5;font-size:15px;color-scheme:light}
.sol-root[data-theme="dark"]{--sol-paper:#111111;--sol-panel:#171717;--sol-card:#1d1d1c;--sol-ink:#f1f1ee;--sol-soft:#c2c2bd;--sol-muted:#7d7d78;--sol-line:rgba(255,255,255,.08);--sol-line2:rgba(255,255,255,.15);--sol-shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.7);--sol-dotc:rgba(255,255,255,.14);--sol-btn:#ecebe6;--sol-on-btn:#151515;color-scheme:dark}
.sol-root[data-theme="dark"] .sol-tint-mint{background:color-mix(in srgb,var(--sol-mint) 16%,var(--sol-card))}
.sol-root :where(*,*::before,*::after){box-sizing:border-box}
.sol-root :where(h1,h2,h3,h4,p,ul,ol,li,figure,dl,dd){margin:0;padding:0}
.sol-root :where(ul,ol){list-style:none}
.sol-root :where(button,input,select,textarea){font:inherit;color:inherit;letter-spacing:inherit}
.sol-root :where(button){background:none;border:0;padding:0;cursor:pointer}
.sol-root :where(a){color:inherit;text-decoration:none}
.sol-root :where(svg,img,canvas){display:block;max-width:none}
.sol-root :where(:focus-visible){outline:2px solid var(--sol-accent);outline-offset:3px;border-radius:6px}
.sol-wrap{width:100%;max-width:1200px;margin:0 auto;padding:0 28px}
.sol-sec{position:relative;border-top:1px solid var(--sol-line);scroll-margin-top:var(--sol-nav)}
.sol-mono{font-family:var(--sol-mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--sol-muted)}
.sol-h2{font-size:clamp(26px,3.1vw,38px);line-height:1.12;letter-spacing:-.025em;font-weight:500}
.sol-muted{color:var(--sol-muted)}
.sol-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.sol-skip{position:absolute;left:12px;top:-60px;z-index:80;background:var(--sol-btn);color:var(--sol-on-btn);padding:10px 14px;border-radius:10px;font-size:13px}
.sol-skip:focus{top:12px}

/* buttons */
.sol-btn{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px 0 18px;border-radius:10px;background:var(--sol-btn);color:var(--sol-on-btn);font-size:13.5px;font-weight:500;letter-spacing:-.005em;box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 1px 2px rgba(0,0,0,.2),0 6px 16px -8px var(--sol-btn);transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s;white-space:nowrap}
.sol-btn svg{transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.sol-btn:hover{transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 2px 4px rgba(0,0,0,.2),0 12px 24px -10px var(--sol-btn)}
.sol-btn:hover svg{transform:translateX(3px)}
.sol-btn:active{transform:translateY(0) scale(.98)}
.sol-btn-ghost{background:var(--sol-card);color:var(--sol-ink);box-shadow:var(--sol-shadow)}
.sol-root[data-theme="dark"] .sol-btn{box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 1px 2px rgba(0,0,0,.5)}
.sol-link{display:inline-flex;align-items:center;gap:6px;font-size:13.5px;font-weight:500;border-bottom:1px solid transparent;transition:border-color .2s,gap .2s}
.sol-link:hover{border-color:currentColor;gap:9px}

/* nav */
.sol-nav{position:sticky;top:0;z-index:40;height:var(--sol-nav);transition:background .3s,box-shadow .3s,backdrop-filter .3s}
.sol-nav[data-stuck]{background:color-mix(in srgb,var(--sol-paper) 78%,transparent);backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);box-shadow:0 1px 0 var(--sol-line)}
.sol-nav .sol-wrap{height:var(--sol-nav);display:flex;align-items:center;justify-content:space-between;gap:20px}
.sol-brand{display:inline-flex;align-items:center;gap:9px;font-weight:650;font-size:13px;letter-spacing:.14em;text-transform:uppercase}
.sol-links{display:flex;gap:28px;font-size:13px;color:var(--sol-soft)}
.sol-links a{position:relative;padding:6px 0;transition:color .2s}
.sol-links a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.sol-links a:hover{color:var(--sol-ink)}
.sol-links a:hover::after{transform:scaleX(1)}
.sol-navr{display:flex;align-items:center;gap:8px}
.sol-icon-btn{width:36px;height:36px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;color:var(--sol-soft);transition:background .2s,color .2s}
.sol-icon-btn:hover{background:var(--sol-line);color:var(--sol-ink)}
.sol-pill{height:36px;padding:0 14px 0 16px;border-radius:10px;font-size:13px;background:var(--sol-card);color:var(--sol-ink);box-shadow:var(--sol-shadow)}
.sol-burger{display:none}
.sol-sheet{position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;background:var(--sol-paper);padding:16px 22px 28px;animation:sol-fade .25s ease}
.sol-sheet-top{display:flex;justify-content:space-between;align-items:center;height:40px}
.sol-sheet ul{margin-top:36px;display:flex;flex-direction:column}
.sol-sheet li a{display:flex;justify-content:space-between;align-items:center;padding:18px 0;border-bottom:1px solid var(--sol-line);font-size:24px;letter-spacing:-.02em}
.sol-sheet .sol-btn{margin-top:auto;justify-content:center;height:48px}

/* hero */
.sol-hero{position:relative;min-height:clamp(620px,calc(var(--sol-h) - var(--sol-nav)),980px);display:flex;flex-direction:column}
.sol-hero-grid{flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);align-items:center;gap:24px;padding-top:24px}
.sol-h1{font-size:clamp(40px,5.4vw,68px);line-height:1.02;letter-spacing:-.04em;font-weight:450}
.sol-h1 span{display:block}
.sol-hero-text{margin-top:22px;max-width:380px;color:var(--sol-soft);font-size:15px}
.sol-hero-cta{margin-top:30px;display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.sol-faces{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--sol-soft)}
.sol-faces span{display:flex}
.sol-faces img{width:26px;height:26px;border-radius:50%;object-fit:cover;border:2px solid var(--sol-paper);margin-left:-8px}
.sol-faces img:first-child{margin-left:0}
.sol-orb{position:relative;width:min(100%,600px);aspect-ratio:1/1;justify-self:center;cursor:grab;touch-action:pan-y;outline:none;border-radius:50%}
.sol-orb:active{cursor:grabbing}
.sol-orb:focus-visible{outline:2px dashed var(--sol-accent);outline-offset:-6px}
.sol-orb canvas{position:absolute;left:0;top:0}
.sol-orb-hint{position:absolute;left:50%;bottom:4%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;white-space:nowrap;padding:6px 10px;border-radius:999px;background:color-mix(in srgb,var(--sol-card) 80%,transparent);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:var(--sol-shadow);transition:opacity .5s,transform .5s;pointer-events:none}
.sol-orb[data-touched] .sol-orb-hint{opacity:0;transform:translate(-50%,6px)}
.sol-orb-hint i{width:6px;height:6px;border-radius:50%;background:var(--sol-accent);animation:sol-ping 1.8s ease-out infinite}
.sol-backers{padding-top:28px;padding-bottom:34px}
.sol-backers ul{margin-top:12px;display:flex;align-items:center;gap:34px;flex-wrap:wrap;color:var(--sol-muted)}
.sol-backers li{display:flex;align-items:center;gap:8px;font-size:13px;letter-spacing:.02em;transition:color .25s}
.sol-backers li:hover{color:var(--sol-ink)}

/* thesis */
.sol-thesis{padding:clamp(72px,10vw,128px) 0}
.sol-thesis-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.3fr);gap:48px;align-items:center}
.sol-thesis h2{font-size:clamp(22px,2.3vw,28px);line-height:1.2;letter-spacing:-.02em;font-weight:500;max-width:440px}
.sol-thesis .sol-btn{margin-top:28px}
.sol-flow{display:grid;grid-template-columns:minmax(150px,190px) minmax(30px,1fr) 46px minmax(24px,.7fr) minmax(250px,300px);align-items:center}
.sol-pool{position:relative;background:var(--sol-card);border-radius:12px;box-shadow:var(--sol-shadow);padding:6px}
.sol-pool li{height:46px;display:flex;align-items:center;gap:9px;padding:0 8px;border-radius:8px;transition:background .25s}
.sol-pool li[data-hot]{background:color-mix(in srgb,var(--sol-accent) 9%,transparent)}
.sol-pool img{width:26px;height:26px;border-radius:7px;object-fit:cover;filter:grayscale(.35)}
.sol-pool b{display:block;font-size:12px;font-weight:550;line-height:1.2}
.sol-pool small{display:block;font-size:11px;color:var(--sol-muted);font-variant-numeric:tabular-nums}
.sol-pool-more{position:absolute;left:8px;top:calc(100% + 8px);font-size:11px;color:var(--sol-muted)}
.sol-wire{width:100%;height:150px;overflow:visible}
.sol-wire path{fill:none;stroke:var(--sol-line2);stroke-width:1.2;stroke-dasharray:3 4;vector-effect:non-scaling-stroke}
.sol-wire .sol-run{stroke:var(--sol-accent);stroke-dasharray:6 60;animation:sol-run 2.6s linear infinite}
.sol-wire1{height:4px}
.sol-node{width:46px;height:46px;border-radius:12px;background:var(--sol-card);box-shadow:var(--sol-shadow);display:flex;align-items:center;justify-content:center;position:relative}
.sol-node::after{content:"";position:absolute;inset:-6px;border-radius:16px;border:1px solid var(--sol-accent);opacity:0;animation:sol-node 2.6s ease-out infinite}
.sol-ring{position:relative;width:100%;aspect-ratio:1/1}
.sol-ring>svg{position:absolute;left:0;top:0;width:100%;overflow:visible}
.sol-ring-c{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;width:46%}
.sol-ring-c strong{display:block;font-size:clamp(18px,2vw,24px);letter-spacing:-.03em;font-weight:550;font-variant-numeric:tabular-nums;margin-top:2px}
.sol-tag{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:6px;padding:4px 8px 4px 6px;border-radius:8px;background:var(--sol-card);box-shadow:var(--sol-shadow);font-size:11px;white-space:nowrap;transition:transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s;z-index:1}
.sol-tag span{color:var(--sol-muted);font-variant-numeric:tabular-nums}
.sol-tag svg{color:var(--sol-muted)}
.sol-tag[data-on]{transform:translate(-50%,-50%) scale(1.06);box-shadow:0 0 0 1px var(--sol-accent),var(--sol-shadow)}
.sol-tag[data-on] svg{color:var(--sol-accent)}
.sol-tag[data-flash] span{animation:sol-flash 1.2s ease}
.sol-seg{transition:fill .3s,opacity .3s;cursor:pointer}

/* paths */
.sol-paths{padding:clamp(72px,10vw,120px) 0}
.sol-paths-grid{margin-top:44px;display:grid;grid-template-columns:1fr 1fr;gap:28px}
.sol-path h3{font-size:19px;font-weight:550;letter-spacing:-.015em}
.sol-path>p{margin-top:10px;color:var(--sol-soft);max-width:440px;min-height:4.5em}
.sol-path .sol-link{margin-top:16px}
.sol-panel{position:relative;margin-top:22px;border-radius:14px;background:var(--sol-panel);overflow:hidden;aspect-ratio:16/10;box-shadow:inset 0 0 0 1px var(--sol-line)}
.sol-panel svg.sol-art{position:absolute;left:0;top:0;width:100%}
.sol-panel-ul{position:absolute;left:18px;top:16px;display:flex;flex-direction:column;gap:5px;font-size:11.5px;color:var(--sol-soft);z-index:1}
.sol-panel-ul li{display:flex;align-items:center;gap:7px}
.sol-panel-ul li::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--sol-muted)}
.sol-panel-cap{position:absolute;left:18px;bottom:14px;font-size:11.5px;color:var(--sol-soft);z-index:1}
.sol-panel-badge{position:absolute;right:16px;top:14px;text-align:right;z-index:1}
.sol-panel-badge strong{display:flex;align-items:center;justify-content:flex-end;gap:7px;font-size:17px;letter-spacing:-.02em;font-weight:600;font-variant-numeric:tabular-nums}
.sol-panel-badge strong::before{content:"";width:9px;height:9px;border-radius:3px;background:var(--sol-accent)}
.sol-use{position:absolute;transform:translateY(calc(-100% - 4px));display:flex;align-items:center;gap:6px;white-space:nowrap;transition:color .25s;z-index:1}
.sol-use i{width:8px;height:8px;border-radius:2px;box-shadow:inset 0 0 0 1px var(--sol-line2)}
.sol-tip{position:absolute;transform:translate(-50%,calc(-100% - 10px));padding:5px 8px;border-radius:7px;background:var(--sol-ink);color:var(--sol-paper);font-size:11px;white-space:nowrap;pointer-events:none;font-variant-numeric:tabular-nums;z-index:2}
.sol-ctrl{margin-top:14px;display:grid;grid-template-columns:auto 1fr;gap:12px 18px;align-items:center;padding:14px 16px;border-radius:12px;background:var(--sol-card);box-shadow:var(--sol-shadow)}
.sol-ctrl label,.sol-ctrl .sol-lab{font-size:12px;color:var(--sol-muted)}
.sol-seg-btns{display:flex;gap:4px;padding:3px;border-radius:9px;background:var(--sol-panel);width:max-content;max-width:100%}
.sol-seg-btns button{height:28px;padding:0 11px;border-radius:7px;font-size:12px;color:var(--sol-soft);font-variant-numeric:tabular-nums;transition:background .2s,color .2s,box-shadow .2s}
.sol-seg-btns button[aria-checked="true"]{background:var(--sol-card);color:var(--sol-ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
.sol-range{display:flex;align-items:center;gap:12px}
.sol-range output{font-size:12px;font-variant-numeric:tabular-nums;min-width:58px;text-align:right}
.sol-range input{flex:1;appearance:none;-webkit-appearance:none;height:4px;border-radius:4px;background:linear-gradient(90deg,var(--sol-accent) var(--p),var(--sol-line2) var(--p));outline-offset:6px;cursor:pointer;min-width:0}
.sol-range input::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--sol-card);box-shadow:0 0 0 1px var(--sol-line2),0 2px 6px rgba(0,0,0,.2);transition:transform .15s}
.sol-range input::-moz-range-thumb{width:16px;height:16px;border:0;border-radius:50%;background:var(--sol-card);box-shadow:0 0 0 1px var(--sol-line2),0 2px 6px rgba(0,0,0,.2)}
.sol-range input:active::-webkit-slider-thumb{transform:scale(1.15)}
.sol-out{grid-column:1/-1;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;padding-top:12px;border-top:1px dashed var(--sol-line2)}
.sol-out strong{font-size:24px;letter-spacing:-.03em;font-weight:550;font-variant-numeric:tabular-nums;line-height:1}
.sol-out small{display:block;font-size:11.5px;color:var(--sol-muted);margin-top:5px}
.sol-out .sol-x{font-size:12px;padding:4px 8px;border-radius:7px;background:color-mix(in srgb,var(--sol-accent) 14%,transparent);color:var(--sol-ink);font-variant-numeric:tabular-nums;white-space:nowrap}

/* steps */
.sol-steps{padding:clamp(72px,10vw,120px) 0}
.sol-steps-grid{margin-top:40px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.sol-step h3{font-size:16px;font-weight:550;letter-spacing:-.01em;margin-bottom:12px}
.sol-step p{margin-top:14px;font-size:13.5px;color:var(--sol-soft);max-width:300px}
.sol-vig{position:relative;display:block;width:100%;aspect-ratio:5/4;border-radius:14px;background:var(--sol-panel);overflow:hidden;box-shadow:inset 0 0 0 1px var(--sol-line);text-align:left;transition:box-shadow .3s}
.sol-vig:hover{box-shadow:inset 0 0 0 1px var(--sol-line2)}
.sol-vig::before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle,var(--sol-dotc) 1px,transparent 1.3px);background-size:16px 16px;opacity:.55;-webkit-mask-image:radial-gradient(ellipse at center,#000 30%,transparent 75%);mask-image:radial-gradient(ellipse at center,#000 30%,transparent 75%)}
.sol-vig-replay{position:absolute;right:10px;bottom:10px;display:flex;align-items:center;gap:5px;font-size:10.5px;color:var(--sol-muted);opacity:0;transition:opacity .25s}
.sol-vig:hover .sol-vig-replay,.sol-vig:focus-visible .sol-vig-replay{opacity:1}
.sol-vig *{animation-duration:7s;animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.4,0,.2,1);animation-play-state:paused}
.sol-vig[data-in] *{animation-play-state:running}
.sol-guide{position:absolute;left:50%;top:0;bottom:0;border-left:1px dashed var(--sol-line2)}
.sol-guide-h{position:absolute;left:0;right:0;top:50%;border-top:1px dashed var(--sol-line2)}
.sol-card{position:absolute;background:var(--sol-card);border-radius:10px;box-shadow:var(--sol-shadow)}
.sol-cursor{position:absolute;width:18px;height:18px;z-index:5;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}
.sol-q{left:50%;top:50%;width:62%;transform:translate(-50%,-62%);padding:12px 12px 12px}
.sol-q .sol-mono{font-size:9px}
.sol-field{margin-top:7px;height:28px;border-radius:7px;box-shadow:inset 0 0 0 1px var(--sol-line2);display:flex;align-items:center;padding:0 8px;font-family:var(--sol-mono);font-size:10px;color:var(--sol-soft);overflow:hidden}
.sol-type{display:inline-block;overflow:hidden;white-space:nowrap;width:0;animation-name:sol-type;animation-timing-function:steps(22,end)}
.sol-caret{display:inline-block;width:1px;height:12px;background:var(--sol-accent);margin-left:1px;animation-name:sol-blink;animation-duration:1s;animation-timing-function:steps(1)}
.sol-join{position:absolute;left:50%;top:calc(50% + 34px);transform:translateX(-50%);height:30px;padding:0 14px;border-radius:8px;background:var(--sol-card);box-shadow:var(--sol-shadow);display:flex;align-items:center;gap:6px;font-size:11px;font-weight:550;white-space:nowrap;animation-name:sol-press}
.sol-join i{width:14px;height:14px;border-radius:50%;background:var(--sol-accent);color:#fff;display:flex;align-items:center;justify-content:center;transform:scale(0);animation-name:sol-pop}
.sol-c1{animation-name:sol-cur1}
.sol-c2{animation-name:sol-cur2}
.sol-c3{animation-name:sol-cur3}
.sol-meta{position:absolute;left:14px;top:12px;font-size:9px}
.sol-meta-r{position:absolute;right:14px;top:12px;display:flex;align-items:center;gap:6px;font-size:9px}
.sol-meta-r i{width:7px;height:7px;border-radius:2px;background:var(--sol-accent)}
.sol-stack{position:absolute;left:24%;top:30%;width:38%;height:34%}
.sol-stack .sol-card{inset:0;display:flex;align-items:flex-end;padding:8px;gap:7px}
.sol-stack .sol-card:nth-child(1){transform:translate(-18px,-18px);background:#2a2a2a;opacity:.92}
.sol-stack .sol-card:nth-child(2){transform:translate(-12px,-12px);background:#353535;opacity:.95}
.sol-stack .sol-card:nth-child(3){transform:translate(-6px,-6px);background:#424242}
.sol-root[data-theme="dark"] .sol-stack .sol-card:nth-child(-n+3){background:#3b3b3a}
.sol-app{animation-name:sol-slide;width:120%!important;padding:8px 10px!important;align-items:center!important}
.sol-app img{width:24px;height:24px;border-radius:6px;object-fit:cover}
.sol-app b{display:block;font-size:10.5px;font-weight:550;line-height:1.15}
.sol-app small{display:block;font-size:8.5px;color:var(--sol-muted);text-transform:uppercase;letter-spacing:.06em}
.sol-stamp{position:absolute;right:12%;top:58%;padding:4px 9px;border-radius:7px;border:1.5px solid var(--sol-accent);color:var(--sol-accent);font-size:10px;font-weight:650;letter-spacing:.1em;text-transform:uppercase;transform:rotate(-8deg) scale(0);animation-name:sol-stamp;background:var(--sol-card)}
.sol-prof{left:16%;top:34%;width:64%;padding:10px;display:flex;gap:9px;align-items:center}
.sol-prof img{width:30px;height:30px;border-radius:8px;object-fit:cover}
.sol-prof b{display:block;font-size:11px;font-weight:550;line-height:1.2}
.sol-prof small{display:block;font-size:9px;color:var(--sol-muted);line-height:1.3}
.sol-bar{position:absolute;left:16%;width:64%;top:67%;height:5px;border-radius:5px;background:var(--sol-line2);overflow:hidden}
.sol-bar i{display:block;height:5px;width:42%;background:var(--sol-accent);border-radius:5px;animation-name:sol-bar}
.sol-back{position:absolute;right:20%;top:24%;height:24px;padding:0 10px;border-radius:7px;background:var(--sol-btn);color:var(--sol-on-btn);font-size:10px;font-weight:550;display:flex;align-items:center;animation-name:sol-press2}
.sol-toast{position:absolute;left:50%;bottom:12%;transform:translate(-50%,20px);opacity:0;padding:6px 10px;border-radius:8px;background:var(--sol-ink);color:var(--sol-paper);font-size:10.5px;white-space:nowrap;animation-name:sol-toast;font-variant-numeric:tabular-nums}

/* stories */
.sol-stories{padding:clamp(72px,10vw,120px) 0}
.sol-stories-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}
.sol-arrows{display:flex;gap:8px}
.sol-arrows button{width:38px;height:38px;border-radius:10px;background:var(--sol-card);box-shadow:var(--sol-shadow);display:flex;align-items:center;justify-content:center;transition:transform .2s,opacity .2s}
.sol-arrows button:hover:not(:disabled){transform:translateY(-1px)}
.sol-arrows button:disabled{opacity:.4;cursor:default}
.sol-track{margin-top:36px;display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 22px)/2);gap:22px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:4px 4px 12px;margin-left:-4px;margin-right:-4px;overscroll-behavior-x:contain}
.sol-track::-webkit-scrollbar{display:none}
.sol-story{scroll-snap-align:start;background:var(--sol-panel);border-radius:14px;padding:8px;box-shadow:inset 0 0 0 1px var(--sol-line);display:flex;flex-direction:column}
.sol-story-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:8px 8px 2px}
.sol-story-h h3{font-size:17px;font-weight:550;letter-spacing:-.015em}
.sol-story-reach{padding:0 8px 10px;font-size:12px;color:var(--sol-soft)}
.sol-photo{position:relative;border-radius:10px;overflow:hidden;background:var(--sol-line)}
.sol-photo img{width:100%;height:auto;aspect-ratio:16/11;object-fit:cover;object-position:50% 30%;transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}
.sol-story:hover .sol-photo img{transform:scale(1.04)}
.sol-spark{position:absolute;left:10px;right:10px;bottom:10px;padding:10px 12px 8px;border-radius:10px;background:color-mix(in srgb,var(--sol-card) 86%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transform:translateY(8px);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .35s}
.sol-story:hover .sol-spark,.sol-story:focus-within .sol-spark{transform:none;opacity:1}
.sol-spark div{display:flex;justify-content:space-between;font-size:11px}
.sol-spark b{font-weight:600;color:var(--sol-ink);font-variant-numeric:tabular-nums}
.sol-spark svg{width:100%;margin-top:6px}
.sol-points{padding:14px 8px 6px;display:flex;flex-direction:column;gap:7px}
.sol-points li{display:flex;gap:9px;font-size:12.5px;color:var(--sol-soft);line-height:1.4}
.sol-points li svg{flex:none;margin-top:3px;color:var(--sol-muted)}
.sol-raise{margin:auto 8px 6px;padding-top:12px;border-top:1px dashed var(--sol-line2);display:flex;align-items:center;gap:12px;font-size:12px}
.sol-raise b{font-variant-numeric:tabular-nums;font-weight:600}
.sol-meter{flex:1;height:4px;border-radius:4px;background:var(--sol-line2);overflow:hidden}
.sol-meter i{display:block;height:4px;border-radius:4px;background:var(--sol-accent);transform-origin:left;transform:scaleX(var(--k));transition:transform 1.4s cubic-bezier(.2,.8,.2,1)}
.sol-dots{margin-top:14px;display:flex;justify-content:center;gap:6px}
.sol-dots button{width:6px;height:6px;border-radius:6px;background:var(--sol-line2);transition:width .3s,background .3s}
.sol-dots button[aria-current="true"]{width:20px;background:var(--sol-ink)}

/* cta */
.sol-cta{position:relative;padding:clamp(90px,12vw,150px) 0;text-align:center;overflow:hidden}
.sol-cta::before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle,var(--sol-dotc) 1.1px,transparent 1.5px);background-size:15px 15px;-webkit-mask-image:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),#000 0%,rgba(0,0,0,.35) 45%,transparent 75%);mask-image:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),#000 0%,rgba(0,0,0,.35) 45%,transparent 75%);transition:-webkit-mask-position .2s}
.sol-cta::after{content:"";position:absolute;left:var(--mx,50%);top:var(--my,50%);width:360px;height:360px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--sol-accent) 18%,transparent),transparent 65%);pointer-events:none;opacity:var(--glow,0);transition:opacity .4s}
.sol-cta h2{position:relative;z-index:1;max-width:620px;margin:0 auto;font-size:clamp(28px,3.4vw,42px);line-height:1.1;letter-spacing:-.03em;font-weight:500}
.sol-cta .sol-btn{position:relative;z-index:1;margin-top:30px}

/* faq */
.sol-faq{padding:clamp(72px,10vw,120px) 0}
.sol-faq-grid{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:28px 44px}
.sol-faq h3{font-size:14px;font-weight:550;margin-bottom:12px}
.sol-qa{border-radius:10px;background:var(--sol-card);box-shadow:var(--sol-shadow);margin-bottom:8px;overflow:hidden;transition:box-shadow .25s}
.sol-qa[data-open]{box-shadow:0 0 0 1px var(--sol-line2),var(--sol-shadow)}
.sol-qa button{width:100%;min-height:44px;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:10px 14px;text-align:left;font-size:13.5px}
.sol-qa button svg{flex:none;transition:transform .35s cubic-bezier(.2,.8,.2,1);color:var(--sol-muted)}
.sol-qa[data-open] button svg{transform:rotate(180deg);color:var(--sol-ink)}
.sol-ans{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s cubic-bezier(.2,.8,.2,1)}
.sol-qa[data-open] .sol-ans{grid-template-rows:1fr}
.sol-ans>div{overflow:hidden}
.sol-ans p{padding:0 14px 14px;font-size:13px;color:var(--sol-soft);max-width:520px}

/* footer */
.sol-foot{position:relative;padding-top:clamp(80px,10vw,120px);overflow:hidden}
.sol-foot-tag{position:relative;z-index:1;text-align:center;font-size:clamp(18px,2vw,22px);letter-spacing:-.02em;max-width:420px;margin:0 auto;line-height:1.3}
.sol-horizon{position:relative;height:340px;margin-top:-70px}
.sol-horizon canvas{position:absolute;left:0;top:0}
.sol-foot-row{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding-bottom:28px;margin-top:-120px;flex-wrap:wrap}
.sol-foot-cols{display:flex;gap:44px}
.sol-foot-cols h4{font-size:12px;font-weight:550;margin-bottom:8px}
.sol-foot-cols li a{display:block;font-size:12px;color:var(--sol-soft);padding:2px 0;transition:color .2s}
.sol-foot-cols li a:hover{color:var(--sol-ink)}
.sol-foot-r{text-align:right;font-size:11.5px;color:var(--sol-muted);max-width:300px}
.sol-foot-r p+p{margin-top:6px}

/* dialog */
.sol-modal{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,10,10,.42);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:sol-fade .25s ease}
.sol-dialog{position:relative;width:100%;max-width:440px;max-height:calc(100svh - 32px);overflow:auto;border-radius:16px;background:var(--sol-paper);color:var(--sol-ink);box-shadow:0 30px 80px -20px rgba(0,0,0,.45);padding:26px;animation:sol-pop-in .35s cubic-bezier(.2,.8,.2,1)}
.sol-dialog h2{font-size:22px;letter-spacing:-.025em;font-weight:550}
.sol-dialog>p{margin-top:6px;font-size:13px;color:var(--sol-soft)}
.sol-dialog form{margin-top:20px;display:flex;flex-direction:column;gap:14px}
.sol-x-btn{position:absolute;right:14px;top:14px}
.sol-roles{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sol-roles button{padding:12px;border-radius:10px;background:var(--sol-card);box-shadow:inset 0 0 0 1px var(--sol-line2);text-align:left;transition:box-shadow .2s}
.sol-roles button b{display:block;font-size:13px;font-weight:550}
.sol-roles button small{display:block;font-size:11.5px;color:var(--sol-muted);margin-top:2px}
.sol-roles button[aria-checked="true"]{box-shadow:inset 0 0 0 1.5px var(--sol-accent)}
.sol-fld label{display:block;font-size:12px;color:var(--sol-soft);margin-bottom:6px}
.sol-fld input,.sol-fld select{width:100%;height:42px;border-radius:10px;border:0;background:var(--sol-card);box-shadow:inset 0 0 0 1px var(--sol-line2);padding:0 12px;font-size:14px;outline:none;transition:box-shadow .2s}
.sol-fld input:focus,.sol-fld select:focus{box-shadow:inset 0 0 0 1.5px var(--sol-accent)}
.sol-fld[data-bad] input{box-shadow:inset 0 0 0 1.5px #d4473a}
.sol-err{display:block;margin-top:5px;font-size:11.5px;color:#d4473a}
.sol-dialog .sol-btn{justify-content:center;height:44px;margin-top:4px}
.sol-done{text-align:center;padding:16px 0 4px}
.sol-done i{width:52px;height:52px;margin:0 auto 16px;border-radius:50%;background:var(--sol-accent);color:#fff;display:flex;align-items:center;justify-content:center;animation:sol-pop-in .5s cubic-bezier(.2,1.4,.4,1)}
.sol-spin{width:14px;height:14px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:sol-spin .7s linear infinite}

/* reveal */
.sol-root[data-ready] .sol-rv[data-armed]:not([data-in]){opacity:0;transform:translateY(18px)}
.sol-rv{transition:opacity .9s cubic-bezier(.2,.8,.2,1),transform .9s cubic-bezier(.2,.8,.2,1)}
.sol-rv[data-d="1"]{transition-delay:.08s}
.sol-rv[data-d="2"]{transition-delay:.16s}
.sol-rv[data-d="3"]{transition-delay:.24s}

@keyframes sol-fade{from{opacity:0}to{opacity:1}}
@keyframes sol-pop-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes sol-spin{to{transform:rotate(360deg)}}
@keyframes sol-ping{0%{box-shadow:0 0 0 0 var(--sol-accent)}70%,100%{box-shadow:0 0 0 7px transparent}}
@keyframes sol-run{from{stroke-dashoffset:66}to{stroke-dashoffset:0}}
@keyframes sol-node{0%{opacity:.7;transform:scale(.9)}80%,100%{opacity:0;transform:scale(1.25)}}
@keyframes sol-flash{0%{color:var(--sol-accent)}100%{color:var(--sol-muted)}}
@keyframes sol-type{0%,6%{width:0}40%,96%{width:22ch}100%{width:0}}
@keyframes sol-blink{50%{opacity:0}}
@keyframes sol-cur1{0%,40%{left:88%;top:94%;opacity:0}48%{opacity:1}58%{left:var(--cx);top:var(--cy);transform:none}62%{transform:scale(.85)}66%{transform:none;opacity:1}88%{opacity:1}92%,100%{left:var(--cx);top:var(--cy);opacity:0}}
@keyframes sol-press{0%,60%{transform:translateX(-50%) scale(1)}62%{transform:translateX(-50%) scale(.94)}66%,100%{transform:translateX(-50%) scale(1)}}
@keyframes sol-pop{0%,62%{transform:scale(0)}70%,92%{transform:scale(1)}100%{transform:scale(0)}}
@keyframes sol-slide{0%,12%{transform:translate(0,0)}26%,100%{transform:translate(26px,-4px)}}
@keyframes sol-cur2{0%,22%{left:92%;top:96%;opacity:0}30%{opacity:1}48%{left:var(--cx);top:var(--cy);transform:none}54%{transform:scale(.85)}58%{transform:none;opacity:1}86%{opacity:1}90%,100%{left:var(--cx);top:var(--cy);opacity:0}}
@keyframes sol-stamp{0%,54%{transform:rotate(-8deg) scale(0);opacity:0}60%{transform:rotate(-8deg) scale(1.25);opacity:1}66%,94%{transform:rotate(-8deg) scale(1);opacity:1}100%{transform:rotate(-8deg) scale(1);opacity:0}}
@keyframes sol-cur3{0%,18%{left:6%;top:94%;opacity:0}26%{opacity:1}45%{left:var(--cx);top:var(--cy);transform:none}50%{transform:scale(.85)}54%{transform:none;opacity:1}88%{opacity:1}92%,100%{left:var(--cx);top:var(--cy);opacity:0}}
@keyframes sol-press2{0%,49%{transform:scale(1)}51%{transform:scale(.92)}54%,100%{transform:scale(1)}}
@keyframes sol-bar{0%,52%{width:42%}66%,94%{width:58%}100%{width:42%}}
@keyframes sol-toast{0%,54%{opacity:0;transform:translate(-50%,14px)}62%,90%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,0)}}

@media (max-width:960px){
.sol-hero-grid{grid-template-columns:1fr;padding-top:12px}
.sol-orb{width:min(100%,460px);order:-1;margin-bottom:-24px}
.sol-thesis-grid{grid-template-columns:1fr}
.sol-paths-grid{grid-template-columns:1fr;gap:56px}
.sol-steps-grid{grid-template-columns:1fr;max-width:480px}
.sol-faq-grid{grid-template-columns:1fr}
}
@media (max-width:720px){
.sol-wrap{padding:0 18px}
.sol-links,.sol-pill{display:none}
.sol-burger{display:inline-flex}
.sol-flow{grid-template-columns:1fr;justify-items:center;gap:0}
.sol-flow>.sol-wire{display:none}
.sol-flow>.sol-wire-v{display:block}
.sol-pool{width:min(100%,280px)}
.sol-pool-more{position:static;margin:8px 0 0 8px}
.sol-ring{width:min(calc(100% - 130px),260px);margin:30px 0}
.sol-use{display:none!important}
.sol-legend{display:flex!important}
.sol-track{grid-auto-columns:86%}
.sol-ctrl{grid-template-columns:1fr}
.sol-panel-ul{font-size:10.5px}
.sol-foot-row{margin-top:-80px}
.sol-foot-r{text-align:left}
}
.sol-legend{display:none;flex-wrap:wrap;gap:6px 14px;margin-top:10px;padding:0 4px}
.sol-legend li{display:flex;align-items:center;gap:6px}
.sol-legend i{width:8px;height:8px;border-radius:2px;box-shadow:inset 0 0 0 1px var(--sol-line2)}
.sol-wire-v{display:none;width:2px;height:34px;border-left:1px dashed var(--sol-line2)}
@media (prefers-reduced-motion:reduce){
.sol-root *,.sol-root *::before,.sol-root *::after{animation-duration:.001s!important;animation-iteration-count:1!important;transition-duration:.001s!important}
.sol-vig *{animation:none!important}
.sol-type{width:22ch}
.sol-join i,.sol-stamp{transform:rotate(-8deg) scale(1)}
.sol-join i{transform:scale(1)}
.sol-toast{opacity:1;transform:translate(-50%,0)}
.sol-cursor{display:none}
.sol-app{transform:translate(26px,-4px)}
}
`

/* ---------- hooks ---------- */

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
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
  return [dark, setDark] as const
}

/** Reveal-on-scroll, armed only after mount, so nothing is hidden without JS or under reduced motion. */
function useReveal(root: { current: HTMLElement | null }, reduced: boolean) {
  React.useEffect(() => {
    const el = root.current
    if (!el || reduced || typeof IntersectionObserver === "undefined") return
    const items = Array.from(el.querySelectorAll(".sol-rv"))
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es)
          if (e.isIntersecting) {
            e.target.setAttribute("data-in", "")
            io.unobserve(e.target)
          }
      },
      { rootMargin: "0px 0px -8% 0px" }
    )
    const vh = window.innerHeight
    for (const it of items) {
      // what is already on screen is never hidden
      if (it.getBoundingClientRect().top < vh) continue
      it.setAttribute("data-armed", "")
      io.observe(it)
    }
    return () => io.disconnect()
  }, [root, reduced])
}

/** Whether the element is on screen now. */
function useOnScreen(ref: { current: Element | null }, margin = "0px") {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setOn(true)
      return
    }
    const io = new IntersectionObserver((es) => setOn(es[es.length - 1].isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return on
}

/** Eases a number toward its target. */
function useTween(target: number, reduced: boolean, ms = 650) {
  const [v, setV] = React.useState(target)
  const cur = React.useRef(target)
  React.useEffect(() => {
    if (reduced) {
      cur.current = target
      setV(target)
      return
    }
    const a = cur.current
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      const x = a + (target - a) * (1 - Math.pow(1 - k, 3))
      cur.current = x
      setV(x)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, reduced, ms])
  return v
}

/** Keeps Tab inside a dialog, closes on Escape and gives focus back on close. */
function useDialog(open: boolean, ref: { current: HTMLElement | null }, close: () => void) {
  React.useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current
    const focusables = () =>
      el ? (Array.from(el.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')) as HTMLElement[]).filter((n) => !n.hasAttribute("disabled")) : []
    const first = focusables()[0]
    if (first) first.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== "Tab") return
      const f = focusables()
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
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      html.style.overflow = overflow
      if (prev && prev.focus) prev.focus()
    }
  }, [open, ref, close])
}

/* ---------- canvas plumbing ---------- */

/** Draws dots in colour and alpha buckets, so a frame costs a few dozen fillStyle changes instead of thousands. */
function makeBuckets(colors: number, alphas: number) {
  const b: number[][] = []
  for (let i = 0; i < colors * alphas; i++) b.push([])
  return {
    colors,
    alphas,
    add(c: number, a: number, x: number, y: number, s: number) {
      b[c * alphas + a].push(x, y, s)
    },
    flush(ctx: CanvasRenderingContext2D, palette: string[]) {
      for (let c = 0; c < colors; c++)
        for (let a = 0; a < alphas; a++) {
          const list = b[c * alphas + a]
          if (!list.length) continue
          ctx.fillStyle = palette[c]
          ctx.globalAlpha = (a + 1) / alphas
          for (let i = 0; i < list.length; i += 3) {
            const s = list[i + 2]
            ctx.fillRect(list[i] - s / 2, list[i + 1] - s / 2, s, s)
          }
          list.length = 0
        }
      ctx.globalAlpha = 1
    },
  }
}

function sizeCanvas(wrap: HTMLElement, canvas: HTMLCanvasElement) {
  const r = wrap.getBoundingClientRect()
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = Math.max(1, Math.round(r.width))
  const h = Math.max(1, Math.round(r.height))
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  canvas.style.width = w + "px"
  canvas.style.height = h + "px"
  return { w, h, dpr }
}

/* ---------- the orb ---------- */

function Orb({ accent, dark, reduced, label }: { accent: string; dark: boolean; reduced: boolean; label: string }) {
  const wrapRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const [touched, setTouched] = React.useState(false)
  const on = useOnScreen(wrapRef, "120px")
  const api = React.useRef({ nudge: (_d: number) => {}, ripple: () => {} })

  React.useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const grey: Rgb = dark ? [118, 118, 112] : [126, 126, 120]
    const warm = hexToRgb(accent)
    const hot: Rgb = [Math.min(255, warm[0] + 30), Math.min(255, warm[1] + 50), Math.min(255, warm[2] + 50)]
    const colors = ramp(grey, warm, 14).concat(ramp(warm, hot, 3).slice(1))
    const buckets = makeBuckets(colors.length, 5)
    let W = 0
    let H = 0
    let dpr = 1
    let pts = fibSphere(10, 7)
    let n = 0
    const resize = () => {
      const s = sizeCanvas(wrap, canvas)
      W = s.w
      H = s.h
      dpr = s.dpr
      const want = Math.round(Math.min(15000, Math.max(5000, (W * H) / 24)))
      if (want !== n) {
        n = want
        pts = fibSphere(n, 11)
      }
    }
    resize()

    const st = {
      yaw: 0.9,
      pitch: -0.32,
      vel: 0.12,
      auto: reduced ? 0 : 0.12,
      drag: false,
      moved: 0,
      lx: 0,
      ly: 0,
      lt: 0,
      px: -1e4,
      py: -1e4,
      hover: 0,
      hoverTo: 0,
      ripples: [] as { x: number; y: number; t: number }[],
    }
    const tmp = [0, 0, 0]
    let last = performance.now()
    let raf = 0
    let running = false

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!st.drag) {
        st.vel += (st.auto - st.vel) * Math.min(1, dt * 1.6)
        st.yaw += st.vel * dt
      }
      st.hover += (st.hoverTo - st.hover) * Math.min(1, dt * 6)
      st.ripples = st.ripples.filter((r) => now - r.t < 1600)

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const R = Math.min(W, H) * 0.43
      const cx = W / 2
      const cy = H / 2
      const cyw = Math.cos(st.yaw)
      const syw = Math.sin(st.yaw)
      const cp = Math.cos(st.pitch)
      const sp = Math.sin(st.pitch)
      const rad = Math.max(70, R * 0.38)
      const rad2 = rad * rad
      const base = Math.max(1.05, R / 210)
      // a faint haze under the lit cap, so the dense side reads as a glow, not just dots
      const gx = cx + LIGHT[0] * R * 0.55
      const gy = cy + LIGHT[1] * R * 0.55
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, R * 1.05)
      glow.addColorStop(0, "rgba(" + warm[0] + "," + warm[1] + "," + warm[2] + "," + (dark ? 0.16 : 0.13) + ")")
      glow.addColorStop(1, "rgba(" + warm[0] + "," + warm[1] + "," + warm[2] + ",0)")
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2)
      ctx.fill()

      for (let i = 0; i < n; i++) {
        const o = i * 5
        rotate(pts[o], pts[o + 1], pts[o + 2], cyw, syw, cp, sp, tmp)
        const x = tmp[0]
        const y = tmp[1]
        const z = tmp[2]
        const k = pts[o + 3]
        let sx = cx + x * R * k
        let sy = cy + y * R * k
        const sh = shade(x, y, z)
        let lit = sh.lit
        let alpha = (sh.density - pts[o + 4]) * 5
        if (alpha <= 0.02) continue
        if (alpha > 1) alpha = 1
        // the far side shows through, faintly
        if (z < 0) alpha *= 0.08 + 0.22 * (1 + z)

        // ripples run across the surface from where it was clicked
        for (let r = 0; r < st.ripples.length; r++) {
          const rp = st.ripples[r]
          const age = (now - rp.t) / 1000
          const front = age * R * 1.25
          const d = Math.hypot(sx - rp.x, sy - rp.y)
          const band = Math.exp(-Math.pow((d - front) / (R * 0.09), 2)) * (1 - age / 1.6)
          if (band > 0.01 && z > -0.2) {
            sx += x * band * R * 0.07
            sy += y * band * R * 0.07
            lit += band * 0.9
            alpha = Math.min(1, alpha + band * 0.6)
          }
        }

        // the pointer parts the dots
        if (st.hover > 0.01 && z > -0.1) {
          const dx = sx - st.px
          const dy = sy - st.py
          const d2 = dx * dx + dy * dy
          if (d2 < rad2 && d2 > 0.01) {
            const d = Math.sqrt(d2)
            const f = (1 - d / rad) * (1 - d / rad) * st.hover * R * 0.09
            sx += (dx / d) * f
            sy += (dy / d) * f
            lit += (1 - d / rad) * st.hover * 0.35
          }
        }

        const t = smooth(-0.25, 0.7, lit)
        const ci = Math.min(colors.length - 1, Math.round(t * 13 + Math.max(0, lit - 1.05) * 6))
        const ai = Math.min(4, Math.floor(alpha * 4.999))
        const size = base * (0.7 + 0.7 * (z * 0.5 + 0.5)) * (0.8 + pts[o + 4] * 0.4)
        buckets.add(ci, ai, sx, sy, size)
      }
      buckets.flush(ctx, colors)
    }

    const loop = (now: number) => {
      draw(now)
      if (running) raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    // under reduced motion nothing runs on its own: one frame, and one per interaction
    const kick = () => {
      if (!reduced) return
      draw(performance.now())
    }

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const onDown = (e: PointerEvent) => {
      const [x, y] = local(e)
      st.drag = true
      st.moved = 0
      st.lx = x
      st.ly = y
      st.lt = performance.now()
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {}
    }
    const onMove = (e: PointerEvent) => {
      const [x, y] = local(e)
      st.px = x
      st.py = y
      st.hoverTo = e.pointerType === "mouse" || st.drag ? 1 : 0
      if (st.drag) {
        const now = performance.now()
        const dx = x - st.lx
        const dy = y - st.ly
        st.moved += Math.abs(dx) + Math.abs(dy)
        st.yaw += dx * 0.008
        st.pitch = Math.max(-1.1, Math.min(1.1, st.pitch + dy * 0.005))
        const dts = Math.max(0.008, (now - st.lt) / 1000)
        st.vel = st.vel * 0.6 + ((dx * 0.008) / dts) * 0.4
        st.lx = x
        st.ly = y
        st.lt = now
        if (st.moved > 6) setTouched(true)
      }
      kick()
    }
    const onUp = (e: PointerEvent) => {
      if (!st.drag) return
      st.drag = false
      if (st.moved < 6) {
        const [x, y] = local(e)
        st.ripples.push({ x, y, t: performance.now() })
        setTouched(true)
      }
      if (e.pointerType !== "mouse") st.hoverTo = 0
      st.vel = Math.max(-4, Math.min(4, st.vel))
      kick()
    }
    const onLeave = () => {
      st.hoverTo = 0
      kick()
    }
    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("pointercancel", onUp)
    canvas.addEventListener("pointerleave", onLeave)

    api.current = {
      nudge: (d: number) => {
        st.vel += d
        if (reduced) st.yaw += d * 0.6
        setTouched(true)
        kick()
      },
      ripple: () => {
        st.ripples.push({ x: W * 0.62, y: H * 0.36, t: performance.now() })
        setTouched(true)
        kick()
      },
    }

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      resize()
      if (!running) draw(performance.now())
    }) : null
    if (ro) ro.observe(wrap)
    const onVis = () => {
      if (document.hidden) stop()
      else if (on && !reduced) start()
    }
    document.addEventListener("visibilitychange", onVis)

    draw(performance.now())
    if (on && !reduced) start()

    return () => {
      stop()
      if (ro) ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      canvas.removeEventListener("pointerleave", onLeave)
    }
  }, [accent, dark, reduced, on])

  return (
    <div
      ref={wrapRef}
      className="sol-orb"
      role="img"
      tabIndex={0}
      aria-label={label + ". Drag to spin, click to send a ripple. With the keyboard, arrow keys spin it and Enter sends a ripple."}
      data-touched={touched ? "" : undefined}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault()
          api.current.nudge(e.key === "ArrowLeft" ? -1.2 : 1.2)
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          api.current.ripple()
        }
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="sol-orb-hint sol-mono" aria-hidden="true">
        <i />
        Drag to spin
      </span>
    </div>
  )
}

/* ---------- the horizon ---------- */

function Horizon({ accent, dark, reduced }: { accent: string; dark: boolean; reduced: boolean }) {
  const wrapRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const on = useOnScreen(wrapRef, "80px")

  React.useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const grey: Rgb = dark ? [110, 110, 104] : [140, 140, 134]
    const warm = hexToRgb(accent)
    const colors = ramp(grey, warm, 12)
    const buckets = makeBuckets(colors.length, 4)
    const pts = horizonPoints(6000, 5)
    let W = 0
    let H = 0
    let dpr = 1
    const resize = () => {
      const s = sizeCanvas(wrap, canvas)
      W = s.w
      H = s.h
      dpr = s.dpr
    }
    resize()
    let px = -1e4
    let py = -1e4
    let raf = 0
    let running = false

    const draw = (now: number) => {
      const t = now / 1000
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const sx0 = Math.min(W * 0.6, 700)
      const glow = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, Math.min(W * 0.4, 420))
      glow.addColorStop(0, "rgba(" + warm[0] + "," + warm[1] + "," + warm[2] + "," + (dark ? 0.22 : 0.16) + ")")
      glow.addColorStop(1, "rgba(" + warm[0] + "," + warm[1] + "," + warm[2] + ",0)")
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, W, H)
      const sy0 = H * 1.9
      const rr = 110
      for (let i = 0; i < pts.length / 5; i++) {
        const o = i * 5
        // each dot drifts up and fades, then starts again lower down
        const life = reduced ? 0.5 : (pts[o + 2] + t * 0.05 * pts[o + 3]) % 1
        const gx = pts[o]
        const gy = pts[o + 1] - (reduced ? 0 : life * 0.04)
        const rad = Math.hypot(gx, gy)
        let x = W / 2 + gx * sx0
        let y = H + gy * sy0 * 0.5
        if (y < -4) continue
        const dx = x - px
        const dy = y - py
        const d2 = dx * dx + dy * dy
        if (d2 < rr * rr && d2 > 0.01) {
          const d = Math.sqrt(d2)
          const f = (1 - d / rr) * (1 - d / rr) * 22
          x += (dx / d) * f
          y += (dy / d) * f
        }
        const tw = reduced ? 0.8 : Math.sin(life * Math.PI)
        const a = tw * (1 - smooth(0.2, 0.95, rad)) * (0.55 + 0.45 * (1 - smooth(0, 0.35, rad)))
        if (a < 0.04) continue
        const ci = Math.min(colors.length - 1, Math.round((1 - smooth(0.03, 0.5, rad)) * (colors.length - 1)))
        buckets.add(ci, Math.min(3, Math.floor(a * 3.999)), x, y, 0.9 + pts[o + 4] * 0.8)
      }
      buckets.flush(ctx, colors)
    }
    const loop = (now: number) => {
      draw(now)
      if (running) raf = requestAnimationFrame(loop)
    }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      px = e.clientX - r.left
      py = e.clientY - r.top
      if (reduced) draw(performance.now())
    }
    const onLeave = () => {
      px = py = -1e4
      if (reduced) draw(performance.now())
    }
    const host = wrap.parentElement || wrap
    host.addEventListener("pointermove", onMove)
    host.addEventListener("pointerleave", onLeave)
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      resize()
      if (!running) draw(performance.now())
    }) : null
    if (ro) ro.observe(wrap)
    draw(performance.now())
    if (on && !reduced) {
      running = true
      raf = requestAnimationFrame(loop)
    }
    return () => {
      running = false
      cancelAnimationFrame(raf)
      if (ro) ro.disconnect()
      host.removeEventListener("pointermove", onMove)
      host.removeEventListener("pointerleave", onLeave)
    }
  }, [accent, dark, reduced, on])

  return (
    <div ref={wrapRef} className="sol-horizon" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}

/* ---------- small drawings ---------- */

function Arrow({ dir = "right", size = 14 }: { dir?: "right" | "left" | "down"; size?: number }) {
  const r = dir === "left" ? 180 : dir === "down" ? 90 : 0
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ transform: "rotate(" + r + "deg)" }}>
      <path d="M3 8h9.5M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20.7 20.7" aria-hidden="true">
      {LOGO_DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.hot ? 1.25 : 1.05} fill={d.hot ? "var(--sol-accent)" : "currentColor"} opacity={d.hot ? 1 : 0.55 + (d.x / 20) * 0.3} />
      ))}
    </svg>
  )
}

function StreamIcon({ icon }: { icon?: SolStreamIcon }) {
  const p = { stroke: "currentColor", strokeWidth: 1.4, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      {icon === "rocket" ? (
        <g {...p}>
          <path d="M9.5 2.5c2.5 0 4 1.5 4 4L8 12l-4-4 5.5-5.5Z" />
          <path d="M4 8 2 8.5 4 6M8 12l-.5 2 2-2" />
          <circle cx="10" cy="6" r="1" />
        </g>
      ) : icon === "megaphone" ? (
        <g {...p}>
          <path d="M2.5 6.5v3h2l5 3v-9l-5 3h-2Z" />
          <path d="M12 6c.8.6.8 3.4 0 4" />
        </g>
      ) : icon === "note" ? (
        <g {...p}>
          <path d="M6 12V3.5l7-1.5v8.5" />
          <circle cx="4.5" cy="12" r="1.6" />
          <circle cx="11.5" cy="10.5" r="1.6" />
        </g>
      ) : icon === "case" ? (
        <g {...p}>
          <rect x="2" y="5" width="12" height="8.5" rx="1.5" />
          <path d="M6 5V3.5h4V5M2 9h12" />
        </g>
      ) : icon === "play" ? (
        <g {...p}>
          <rect x="2" y="3" width="12" height="10" rx="2" />
          <path d="m7 6 3 2-3 2Z" />
        </g>
      ) : (
        <g {...p}>
          <path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l1.8 1.8M10.2 10.2 12 12M12 4l-1.8 1.8M5.8 10.2 4 12" />
        </g>
      )}
    </svg>
  )
}

function BackerMark({ mark }: { mark?: SolBacker["mark"] }) {
  const p = { stroke: "currentColor", strokeWidth: 1.4, fill: "none" }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      {mark === "pine" ? (
        <path d="M9 2 4 9h3l-3.5 5h11L11 9h3L9 2ZM9 14v2.5" {...p} strokeLinejoin="round" />
      ) : mark === "rings" ? (
        <g {...p}>
          <circle cx="7" cy="9" r="4.5" />
          <circle cx="11" cy="9" r="4.5" />
        </g>
      ) : mark === "monogram" ? (
        <g {...p}>
          <rect x="1.5" y="2.5" width="15" height="13" rx="2" />
          <path d="M4.5 12V6l2.3 3.5L9 6v6M11.5 6.5l1.5 5.5 1.5-5.5" strokeLinejoin="round" />
        </g>
      ) : (
        <path d="M1.5 10c2-3 3.5-3 5 0s3 3 5 0 3.5-3 5 0" {...p} strokeLinecap="round" />
      )}
    </svg>
  )
}

function Cursor({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <svg className={"sol-cursor " + className} style={style} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3 2v13l3.4-3.2 2.3 5 2.2-1-2.3-4.9H13L3 2Z" fill="#fff" stroke="#111" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function Head({ parts, as = "h2", className }: { parts: string; as?: "h1" | "h2"; className?: string }) {
  const Tag = as
  return (
    <Tag className={className}>
      {twoTone(parts).map((p, i) => (p.muted ? <span key={i} className="sol-muted">{p.text}</span> : <React.Fragment key={i}>{p.text}</React.Fragment>))}
    </Tag>
  )
}

/* ---------- sections ---------- */

function Thesis({
  data,
  currency,
  reduced,
  onAction,
}: {
  data: NonNullable<StippleOrbLandingProps["thesis"]>
  currency: string
  reduced: boolean
  onAction: (l?: SolLink) => void
}) {
  const ref = React.useRef(null as HTMLDivElement | null)
  const on = useOnScreen(ref)
  const investors = data.investors && data.investors.length ? data.investors.slice(0, 3) : DEFAULT_INVESTORS
  const [streams, setStreams] = React.useState(() => (data.streams && data.streams.length ? data.streams : DEFAULT_THESIS.streams).slice(0, 6))
  const [hot, setHot] = React.useState(-1)
  const [flash, setFlash] = React.useState(-1)
  const [row, setRow] = React.useState(0)
  const stake = data.stake ?? DEFAULT_THESIS.stake
  const total = streams.reduce((a, s) => a + s.value, 0)
  const shown = hot >= 0 ? streams[hot].value * stake : total * stake
  const tween = useTween(shown, reduced)

  // earnings keep arriving while it is on screen
  React.useEffect(() => {
    if (!on || reduced) return
    const id = window.setInterval(() => {
      setStreams((s) => {
        const i = Math.floor(Math.random() * s.length)
        setFlash(i)
        return s.map((x, k) => (k === i ? { ...x, value: x.value + 200 + Math.round(Math.random() * 1400) } : x))
      })
      setRow((r) => (r + 1) % 3)
    }, 2600)
    return () => window.clearInterval(id)
  }, [on, reduced])

  const arcs = ringArcs(streams.map((s) => s.value), 0.06, -Math.PI * 0.42, Math.PI * 1.25)
  const shades = ["#c9c9c4", "#b9b9b3", "#d6d6d1", "#adada7", "#c2c2bc", "#d0d0ca"]
  return (
    <section className="sol-sec sol-thesis" data-sec="thesis" aria-labelledby="sol-thesis-h">
      <div className="sol-wrap sol-thesis-grid">
        <div className="sol-rv">
          <Head parts={data.title} />
          <span id="sol-thesis-h" className="sol-sr">{twoTone(data.title).map((p) => p.text).join("")}</span>
          <button type="button" className="sol-btn" onClick={() => onAction(data.action)}>
            {(data.action && data.action.label) || "Request access"}
            <Arrow />
          </button>
        </div>
        <div className="sol-flow sol-rv" data-d="1" ref={ref}>
          <div className="sol-pool">
            <ul aria-label="Backers">
              {investors.map((v, i) => (
                <li key={v.name} data-hot={row === i && !reduced ? "" : undefined}>
                  {v.avatar ? <img src={v.avatar} alt="" width={26} height={26} /> : null}
                  <div>
                    <b>{v.name}</b>
                    <small>{money(v.amount, currency)}</small>
                  </div>
                </li>
              ))}
            </ul>
            <span className="sol-pool-more">+{data.more ?? DEFAULT_THESIS.more} backers</span>
          </div>
          <svg className="sol-wire" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
            {[25, 75, 125].map((y, i) => (
              <React.Fragment key={y}>
                <path d={"M0 " + (y - 0.5 + 6) + " C 55 " + (y + 6) + ", 45 75, 100 75"} />
                <path className="sol-run" d={"M0 " + (y - 0.5 + 6) + " C 55 " + (y + 6) + ", 45 75, 100 75"} style={{ animationDelay: i * -0.8 + "s" }} />
              </React.Fragment>
            ))}
          </svg>
          <span className="sol-wire-v" aria-hidden="true" />
          <div className="sol-node" aria-hidden="true">
            <Mark size={22} />
          </div>
          <svg className="sol-wire sol-wire1" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 2 L100 2" />
            <path className="sol-run" d="M0 2 L100 2" />
          </svg>
          <span className="sol-wire-v" aria-hidden="true" />
          <div className="sol-ring">
            <svg viewBox="0 0 300 300" aria-hidden="true">
              <defs>
                <filter id="sol-ring-sh" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.12" />
                </filter>
              </defs>
              <circle cx="150" cy="150" r="104" fill="none" stroke="var(--sol-card)" strokeWidth="30" filter="url(#sol-ring-sh)" />
              {arcs.map((a, i) => (
                <path
                  key={i}
                  className="sol-seg"
                  d={arcPath(150, 150, 89, 119, a.a0, a.a1)}
                  fill={hot === i ? "var(--sol-accent)" : shades[i % shades.length]}
                  opacity={hot >= 0 && hot !== i ? 0.45 : 1}
                  onPointerEnter={() => setHot(i)}
                  onPointerLeave={() => setHot(-1)}
                />
              ))}
              <circle cx="150" cy="150" r="78" fill="none" stroke="var(--sol-line2)" strokeDasharray="2 4" />
            </svg>
            <div className="sol-ring-c" aria-live="polite">
              <span className="sol-mono">{hot >= 0 ? streams[hot].label : "Your " + Math.round(stake * 1000) / 10 + "% stake"}</span>
              <strong>{money(tween, currency)}</strong>
              <span className="sol-mono">this year</span>
            </div>
            {arcs.map((a, i) => {
              const r = 0.5 + 0.47 * 1
              const x = 50 + Math.cos(a.mid) * r * 50 * 0.98
              const y = 50 + Math.sin(a.mid) * r * 50 * 0.98
              return (
                <button
                  key={i}
                  type="button"
                  className="sol-tag"
                  style={{ left: x + "%", top: y + "%" }}
                  data-on={hot === i ? "" : undefined}
                  data-flash={flash === i ? "" : undefined}
                  onPointerEnter={() => setHot(i)}
                  onPointerLeave={() => setHot(-1)}
                  onFocus={() => setHot(i)}
                  onBlur={() => setHot(-1)}
                  onAnimationEnd={() => setFlash(-1)}
                  aria-label={streams[i].label + ": " + money(streams[i].value, currency) + " earned this year"}
                >
                  <StreamIcon icon={streams[i].icon} />
                  {streams[i].label}
                  <span key={streams[i].value}>{compact(streams[i].value, currency)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function SegButtons({ label, options, value, onChange }: { label: string; options: { label: string; value: number }[]; value: number; onChange: (v: number) => void }) {
  const refs = React.useRef([] as (HTMLButtonElement | null)[])
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className="sol-seg-btns" role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={i === idx}
          tabIndex={i === idx ? 0 : -1}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            const j = nextIndex(i, e.key, options.length)
            if (j < 0) return
            e.preventDefault()
            onChange(options[j].value)
            const b = refs.current[j]
            if (b) b.focus()
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Range({ id, label, min, max, step, value, onChange, format }: { id: string; label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; format: (v: number) => string }) {
  const p = ((value - min) / (max - min)) * 100
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="sol-range">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          style={{ ["--p" as string]: p + "%" } as React.CSSProperties}
          aria-valuetext={format(value)}
        />
        <output htmlFor={id}>{format(value)}</output>
      </div>
    </>
  )
}

function BackerPanel({ path, model, currency, reduced, uid }: { path: SolPath; model: SolModel; currency: string; reduced: boolean; uid: string }) {
  const [amount, setAmount] = React.useState(25000)
  const [years, setYears] = React.useState(model.years)
  const [scrub, setScrub] = React.useState(-1)
  const proj = projectStake(amount, model, years)
  const total = useTween(proj.total, reduced)
  const multiple = useTween(proj.multiple, reduced)
  // the chart: years across, cumulative distributions up
  const X0 = 252
  const X1 = 500
  const Y0 = 262
  const Y1 = 64
  const cap = Math.max(proj.total, amount) * 1.08
  const pts = [[X0, Y0]].concat(proj.cumulative.map((v, i) => [X0 + ((i + 1) / years) * (X1 - X0), Y0 - (v / cap) * (Y0 - Y1)]))
  const line = smoothPath(pts)
  const area = line + " L" + X1 + " " + Y0 + " L" + X0 + " " + Y0 + " Z"
  const beY = Y0 - (amount / cap) * (Y0 - Y1)
  const wedge = (years / 15) * Math.PI * 1.15
  const s = scrub >= 0 ? scrub : -1
  const svgRef = React.useRef(null as SVGSVGElement | null)
  const onScrub = (e: React.PointerEvent) => {
    const svg = svgRef.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 520
    if (x < X0 - 10) return setScrub(-1)
    setScrub(Math.max(0, Math.min(years - 1, Math.round(((x - X0) / (X1 - X0)) * years) - 1)))
  }
  return (
    <div className="sol-path sol-rv">
      <h3>{path.title}</h3>
      <p>{path.text}</p>
      <a className="sol-link" href="#paths" data-access="invest">
        {path.link} <Arrow />
      </a>
      <div className="sol-panel sol-tint-mint" onPointerMove={onScrub} onPointerLeave={() => setScrub(-1)}>
        <ul className="sol-panel-ul">
          {path.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <svg ref={svgRef} className="sol-art" viewBox="0 0 520 325" aria-hidden="true">
          <defs>
            <linearGradient id={uid + "-area"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--sol-mint)" stopOpacity="0.95" />
              <stop offset="1" stopColor="var(--sol-mint)" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id={uid + "-wedge"} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--sol-mint)" />
              <stop offset="1" stopColor="var(--sol-mint)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path d={"M0 " + Y0 + " H" + X1} stroke="var(--sol-line2)" strokeDasharray="3 4" />
          <path d={area} fill={"url(#" + uid + "-area)"} />
          <path d={line} fill="none" stroke="var(--sol-accent)" strokeOpacity="0.0" />
          <path d={line} fill="none" stroke="color-mix(in srgb,var(--sol-mint) 50%,#3f8f4f)" strokeWidth="1.6" />
          <path d={"M" + X0 + " " + beY + " H" + X1} stroke="var(--sol-soft)" strokeDasharray="2 4" opacity="0.6" />
          <text x={X1 - 2} y={beY - 6} textAnchor="end" fontSize="10" fill="var(--sol-soft)">
            {"Your " + compact(amount, currency) + " back"}
          </text>
          {proj.breakeven > 0 ? (
            <circle cx={X0 + (proj.breakeven / years) * (X1 - X0)} cy={Y0 - (proj.cumulative[proj.breakeven - 1] / cap) * (Y0 - Y1)} r="3.5" fill="var(--sol-card)" stroke="var(--sol-soft)" />
          ) : null}
          {s >= 0 ? (
            <g>
              <path d={"M" + pts[s + 1][0] + " " + Y0 + " V" + pts[s + 1][1]} stroke="var(--sol-ink)" strokeOpacity="0.3" />
              <circle cx={pts[s + 1][0]} cy={pts[s + 1][1]} r="4.5" fill="var(--sol-ink)" />
            </g>
          ) : null}
          <circle cx="142" cy="184" r="70" fill="none" stroke="var(--sol-card)" strokeWidth="24" />
          <path d={arcPath(142, 184, 58, 100, -Math.PI * 0.98, -Math.PI * 0.98 + wedge)} fill={"url(#" + uid + "-wedge)"} style={{ transition: reduced ? "none" : "d .5s" }} />
          <circle cx="142" cy="184" r="58" fill="none" stroke="var(--sol-line2)" strokeDasharray="2 4" />
          <text x="142" y="181" textAnchor="middle" fontSize="9" letterSpacing="1" fill="var(--sol-muted)" style={{ fontFamily: MONO }}>
            UP TO
          </text>
          <text x="142" y="196" textAnchor="middle" fontSize="11" letterSpacing="1" fill="var(--sol-ink)" style={{ fontFamily: MONO }}>
            {years + " YEARS"}
          </text>
        </svg>
        {s >= 0 ? (
          <span className="sol-tip" style={{ left: (pts[s + 1][0] / 520) * 100 + "%", top: (pts[s + 1][1] / 325) * 100 + "%" }}>
            Year {s + 1}: {money(proj.cumulative[s], currency)}
          </span>
        ) : null}
        <span className="sol-panel-cap">{path.caption}</span>
      </div>
      <div className="sol-ctrl">
        <span className="sol-lab" id={uid + "-amt"}>
          You put in
        </span>
        <SegButtons
          label="You put in"
          value={amount}
          onChange={setAmount}
          options={[5000, 25000, 100000].map((v) => ({ value: v, label: compact(v, currency) }))}
        />
        <Range id={uid + "-years"} label="Term" min={5} max={15} step={1} value={years} onChange={setYears} format={(v) => v + " years"} />
        <div className="sol-out" aria-live="polite">
          <div>
            <strong>{money(total, currency)}</strong>
            <small>
              {proj.breakeven > 0 ? "Paid back in year " + proj.breakeven + ". " : "Not paid back within the term. "}
              Illustrative, not a forecast.
            </small>
          </div>
          <span className="sol-x">{multiple.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  )
}

function RaisePanel({ path, model, currency, reduced, avatar }: { path: SolPath; model: SolModel; currency: string; reduced: boolean; avatar?: string }) {
  const [income, setIncome] = React.useState(250000)
  const [share, setShare] = React.useState(6)
  const [hot, setHot] = React.useState(-1)
  const years = model.years
  const raise = capitalFor(income, share / 100, years, model.growth)
  const tween = useTween(raise, reduced)
  const uses = [
    { label: "Sales & marketing", value: 42, fill: "var(--sol-cream)" },
    { label: "Team", value: 22, fill: "var(--sol-mint)" },
    { label: "Working capital", value: 36, fill: "var(--sol-sky)" },
  ]
  const arcs = ringArcs(uses.map((u) => u.value), 0.12, Math.PI * 0.72, Math.PI * 1.56)
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <div className="sol-path sol-rv" data-d="1">
      <h3>{path.title}</h3>
      <p>{path.text}</p>
      <a className="sol-link" href="#paths" data-access="raise">
        {path.link} <Arrow />
      </a>
      <div className="sol-panel">
        <ul className="sol-panel-ul">
          {path.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <div className="sol-panel-badge">
          <strong>{compact(tween, currency)}</strong>
          <span className="sol-mono">Capital raised</span>
        </div>
        <svg className="sol-art" viewBox="0 0 520 325" aria-hidden="true">
          <defs>
            <clipPath id={uid + "-face"}>
              <circle cx="260" cy="176" r="40" />
            </clipPath>
          </defs>
          <circle cx="260" cy="176" r="86" fill="none" stroke="var(--sol-card)" strokeWidth="26" />
          {arcs.map((a, i) => (
            <path
              key={i}
              className="sol-seg"
              d={arcPath(260, 176, hot === i ? 66 : 72, hot === i ? 116 : 108, a.a0, a.a1)}
              fill={uses[i].fill}
              stroke="var(--sol-line2)"
              strokeDasharray="3 3"
              opacity={hot >= 0 && hot !== i ? 0.5 : 1}
              onPointerEnter={() => setHot(i)}
              onPointerLeave={() => setHot(-1)}
              style={{ transition: reduced ? "none" : "d .35s, opacity .3s" }}
            />
          ))}
          <circle cx="260" cy="176" r="56" fill="var(--sol-card)" />
          {avatar ? <image href={avatar} x="220" y="136" width="80" height="80" clipPath={"url(#" + uid + "-face)"} preserveAspectRatio="xMidYMid slice" /> : null}
          <circle cx="260" cy="176" r="40" fill="none" stroke="var(--sol-line2)" />
          {arcs.map((a, i) => {
            // a dashed leader from the arc out to its label at the panel's edge
            const x0 = 260 + Math.cos(a.mid) * 112
            const y0 = 176 + Math.sin(a.mid) * 112
            const right = Math.cos(a.mid) > 0
            const lx = right ? 500 : 20
            const ly = Math.max(122, Math.min(300, y0 + Math.sin(a.mid) * 30))
            return <path key={i} d={"M" + x0 + " " + y0 + " Q " + (right ? x0 + 40 : x0 - 40) + " " + ly + ", " + lx + " " + ly} fill="none" stroke={hot === i ? "var(--sol-soft)" : "var(--sol-line2)"} strokeDasharray="3 4" />
          })}
        </svg>
        {arcs.map((a, i) => {
          const y0 = 176 + Math.sin(a.mid) * 112
          const right = Math.cos(a.mid) > 0
          const ly = Math.max(122, Math.min(300, y0 + Math.sin(a.mid) * 30))
          return (
            <span
              key={uses[i].label}
              className="sol-mono sol-use"
              style={{ left: right ? "auto" : "3.8%", right: right ? "3.8%" : "auto", top: (ly / 325) * 100 + "%", color: hot === i ? "var(--sol-ink)" : undefined }}
              onPointerEnter={() => setHot(i)}
              onPointerLeave={() => setHot(-1)}
            >
              <i style={{ background: uses[i].fill }} />
              {uses[i].label} {uses[i].value}%
            </span>
          )
        })}
      </div>
      <ul className="sol-legend sol-mono" aria-label={path.caption}>
        {uses.map((u) => (
          <li key={u.label}>
            <i style={{ background: u.fill }} />
            {u.label} {u.value}%
          </li>
        ))}
      </ul>
      <div className="sol-ctrl">
        <span className="sol-lab">You earn a year</span>
        <SegButtons label="You earn a year" value={income} onChange={setIncome} options={[80000, 250000, 1000000].map((v) => ({ value: v, label: compact(v, currency) }))} />
        <Range id={uid + "-share"} label="You share" min={2} max={15} step={0.5} value={share} onChange={setShare} format={(v) => v + "% for " + years + "y"} />
        <div className="sol-out" aria-live="polite">
          <div>
            <strong>{money(tween, currency)}</strong>
            <small>Indicative raise, priced at a 20% backer return.</small>
          </div>
          <span className="sol-x">{compact(raise / years, currency)}/yr</span>
        </div>
      </div>
    </div>
  )
}

function Steps({ data, avatars }: { data: NonNullable<StippleOrbLandingProps["steps"]>; avatars: string[] }) {
  const refs = [React.useRef(null as HTMLButtonElement | null), React.useRef(null as HTMLButtonElement | null), React.useRef(null as HTMLButtonElement | null)]
  const ins = [useOnScreen(refs[0]), useOnScreen(refs[1]), useOnScreen(refs[2])]
  const [plays, setPlays] = React.useState([0, 0, 0])
  const replay = (i: number) => setPlays((p) => p.map((v, k) => (k === i ? v + 1 : v)))
  const items = data.items.slice(0, 3)
  const vig = (i: number) => {
    if (i === 0)
      return (
        <>
          <span className="sol-guide" />
          <div className="sol-card sol-q">
            <span className="sol-mono">Question 1 of 3</span>
            <div className="sol-field">
              <span className="sol-type">What are you building?</span>
              <span className="sol-caret" />
            </div>
          </div>
          <span className="sol-join">
            Join Kindling
            <i>
              <Check size={9} />
            </i>
          </span>
          <Cursor className="sol-c1" style={{ ["--cx" as string]: "56%", ["--cy" as string]: "67%" } as React.CSSProperties} />
        </>
      )
    if (i === 1)
      return (
        <>
          <span className="sol-guide-h" />
          <span className="sol-mono sol-meta">Applications</span>
          <span className="sol-mono sol-meta-r">
            <i />
            Ready to review
          </span>
          <div className="sol-stack">
            <div className="sol-card" />
            <div className="sol-card" />
            <div className="sol-card" />
            <div className="sol-card sol-app">
              {avatars[3] ? <img src={avatars[3]} alt="" width={24} height={24} /> : null}
              <div>
                <small>Applicant</small>
                <b>Mateo Rhys</b>
              </div>
            </div>
          </div>
          <span className="sol-stamp">Approved</span>
          <Cursor className="sol-c2" style={{ ["--cx" as string]: "50%", ["--cy" as string]: "50%" } as React.CSSProperties} />
        </>
      )
    return (
      <>
        <span className="sol-guide" />
        <span className="sol-mono sol-meta">Backer view</span>
        <span className="sol-mono sol-meta-r">
          <i />
          Raising $500k
        </span>
        <div className="sol-card sol-prof">
          {avatars[2] ? <img src={avatars[2]} alt="" width={30} height={30} /> : null}
          <div>
            <b>Iris Kalani</b>
            <small>Ceramics studio, 4 years trading</small>
          </div>
        </div>
        <span className="sol-back">Back Iris</span>
        <span className="sol-bar">
          <i />
        </span>
        <span className="sol-toast">+$5,000 committed</span>
        <Cursor className="sol-c3" style={{ ["--cx" as string]: "72%", ["--cy" as string]: "29%" } as React.CSSProperties} />
      </>
    )
  }
  return (
    <section className="sol-sec sol-steps" data-sec="how" aria-labelledby="sol-how-h">
      <div className="sol-wrap">
        <h2 id="sol-how-h" className="sol-h2 sol-rv">
          {data.title}
        </h2>
        <ol className="sol-steps-grid">
          {items.map((it, i) => (
            <li key={it.title} className="sol-step sol-rv" data-d={String(i + 1)}>
              <h3>
                <span className="sol-sr">Step {i + 1}: </span>
                {it.title}
              </h3>
              <button
                ref={refs[i]}
                type="button"
                className="sol-vig"
                data-in={ins[i] ? "" : undefined}
                onClick={() => replay(i)}
                aria-label={"Replay the " + it.title.toLowerCase() + " animation"}
              >
                <span key={plays[i]} style={{ position: "absolute", inset: 0, display: "block" }}>
                  {vig(i)}
                </span>
                <span className="sol-vig-replay" aria-hidden="true">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8a5 5 0 1 0 1.5-3.5M3 2.5v3h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Replay
                </span>
              </button>
              <p>{it.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Spark({ data, uid }: { data: number[]; uid: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data.map((v, i) => [(i / (data.length - 1)) * 200, 34 - ((v - min) / (max - min || 1)) * 30])
  const line = smoothPath(pts)
  return (
    <svg viewBox="0 0 200 36" height="36" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sol-accent)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--sol-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={line + " L200 36 L0 36 Z"} fill={"url(#" + uid + ")"} />
      <path d={line} fill="none" stroke="var(--sol-accent)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Stories({ data, currency }: { data: NonNullable<StippleOrbLandingProps["stories"]>; currency: string }) {
  const trackRef = React.useRef(null as HTMLDivElement | null)
  const [active, setActive] = React.useState(0)
  const [pages, setPages] = React.useState(1)
  const seen = useOnScreen(trackRef)
  const [filled, setFilled] = React.useState(false)
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  React.useEffect(() => {
    if (seen) setFilled(true)
  }, [seen])
  const measure = React.useCallback(() => {
    const t = trackRef.current
    if (!t) return
    const first = t.children[0] as HTMLElement | undefined
    if (!first) return
    const step = first.offsetWidth + 22
    const per = Math.max(1, Math.round((t.clientWidth + 22) / step))
    setPages(Math.max(1, data.items.length - per + 1))
    setActive(Math.round(t.scrollLeft / step))
  }, [data.items.length])
  React.useEffect(() => {
    measure()
    const t = trackRef.current
    if (!t || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(t)
    return () => ro.disconnect()
  }, [measure])
  const go = (i: number) => {
    const t = trackRef.current
    if (!t) return
    const first = t.children[0] as HTMLElement | undefined
    if (!first) return
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
    t.scrollTo({ left: Math.max(0, Math.min(pages - 1, i)) * (first.offsetWidth + 22), behavior: reduced ? "auto" : "smooth" })
  }
  return (
    <section className="sol-sec sol-stories" data-sec="stories" aria-labelledby="sol-stories-h">
      <div className="sol-wrap">
        <div className="sol-stories-head sol-rv">
          <h2 id="sol-stories-h" className="sol-h2">
            {data.title}
          </h2>
          {pages > 1 ? (
            <div className="sol-arrows">
              <button type="button" aria-label="Previous story" disabled={active <= 0} onClick={() => go(active - 1)}>
                <Arrow dir="left" />
              </button>
              <button type="button" aria-label="Next story" disabled={active >= pages - 1} onClick={() => go(active + 1)}>
                <Arrow />
              </button>
            </div>
          ) : null}
        </div>
        <div
          ref={trackRef}
          className="sol-track sol-rv"
          data-d="1"
          onScroll={measure}
          tabIndex={0}
          role="region"
          aria-label={data.title + ", scroll sideways for more"}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault()
              go(active + (e.key === "ArrowRight" ? 1 : -1))
            }
          }}
        >
          {data.items.map((s, i) => {
            const growth = s.growth && s.growth.length > 1 ? s.growth : null
            const lift = growth ? Math.round((growth[growth.length - 1] / growth[0] - 1) * 100) : 0
            return (
              <article key={s.name} className="sol-story" aria-label={s.name}>
                <div className="sol-story-h">
                  <h3>{s.name}</h3>
                  <span className="sol-mono">{s.role}</span>
                </div>
                <p className="sol-story-reach">{s.reach}</p>
                <div className="sol-photo">
                  {s.photo ? <img src={s.photo} alt={"Portrait of " + s.name} width={420} height={500} loading="lazy" decoding="async" /> : null}
                  {growth ? (
                    <div className="sol-spark">
                      <div>
                        <span className="sol-mono">Earnings since the raise</span>
                        <b>{(lift >= 0 ? "+" : "") + lift + "%"}</b>
                      </div>
                      <Spark data={growth} uid={uid + "-s" + i} />
                    </div>
                  ) : null}
                </div>
                <ul className="sol-points">
                  {s.points.map((p) => (
                    <li key={p}>
                      <Check />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="sol-raise">
                  <b>{compact(s.raised, currency)}</b>
                  <span className="sol-meter" aria-hidden="true">
                    <i style={{ ["--k" as string]: filled ? 1 : 0 } as React.CSSProperties} />
                  </span>
                  <span className="sol-muted">
                    {Math.round(s.share * 1000) / 10}% for {s.years}y
                  </span>
                </div>
              </article>
            )
          })}
        </div>
        {pages > 1 ? (
          <div className="sol-dots">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} type="button" aria-label={"Go to story " + (i + 1)} aria-current={i === active ? "true" : undefined} onClick={() => go(i)} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Faq({ data }: { data: NonNullable<StippleOrbLandingProps["faq"]> }) {
  const [open, setOpen] = React.useState(() => data.groups.map(() => -1))
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <section className="sol-sec sol-faq" data-sec="faq" aria-labelledby="sol-faq-h">
      <div className="sol-wrap">
        <h2 id="sol-faq-h" className="sol-h2 sol-rv">
          {data.title}
        </h2>
        <div className="sol-faq-grid">
          {data.groups.map((g, gi) => (
            <div key={g.title} className="sol-rv" data-d={String(gi + 1)}>
              <h3>{g.title}</h3>
              {g.items.map((it, i) => {
                const on = open[gi] === i
                const id = uid + "-" + gi + "-" + i
                return (
                  <div key={it.q} className="sol-qa" data-open={on ? "" : undefined}>
                    <button type="button" aria-expanded={on} aria-controls={id} onClick={() => setOpen((o) => o.map((v, k) => (k === gi ? (v === i ? -1 : i) : v)))}>
                      {it.q}
                      <Arrow dir="down" />
                    </button>
                    <div className="sol-ans" id={id} role="region" aria-hidden={!on}>
                      <div>
                        <p>{it.a}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AccessDialog({
  open,
  role,
  setRole,
  close,
  brand,
  onRequestAccess,
}: {
  open: boolean
  role: "invest" | "raise"
  setRole: (r: "invest" | "raise") => void
  close: () => void
  brand: string
  onRequestAccess?: (d: SolAccessRequest) => unknown
}) {
  const ref = React.useRef(null as HTMLDivElement | null)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [detail, setDetail] = React.useState("")
  const [tried, setTried] = React.useState(false)
  const [state, setState] = React.useState("idle" as "idle" | "sending" | "done" | "error")
  const roleRefs = React.useRef([] as (HTMLButtonElement | null)[])
  useDialog(open, ref, close)
  React.useEffect(() => {
    if (!open) return
    setTried(false)
    setState((s) => (s === "done" ? "idle" : s))
  }, [open])
  if (!open) return null
  const bad = { name: !name.trim(), email: !isEmail(email), detail: !detail.trim() }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (bad.name || bad.email || bad.detail) return
    setState("sending")
    let ok = true
    try {
      const data = { role, name: name.trim(), email: email.trim(), detail: detail.trim() }
      const res = onRequestAccess ? await onRequestAccess(data) : await new Promise((r) => setTimeout(() => r(true), 900))
      if (res === false) ok = false
    } catch {
      ok = false
    }
    setState(ok ? "done" : "error")
  }
  const roles = [
    { v: "invest" as const, t: "I want to back people", s: "Browse and commit" },
    { v: "raise" as const, t: "I want to raise", s: "Apply for funding" },
  ]
  return (
    <div className="sol-modal" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={ref} className="sol-dialog" role="dialog" aria-modal="true" aria-labelledby="sol-dlg-h">
        <button type="button" className="sol-icon-btn sol-x-btn" aria-label="Close" onClick={close}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="m3.5 3.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        {state === "done" ? (
          <div className="sol-done" role="status">
            <i>
              <Check size={22} />
            </i>
            <h2 id="sol-dlg-h">You are on the list</h2>
            <p className="sol-muted" style={{ marginTop: 6, fontSize: 13 }}>
              We review every request by hand. Expect a note at {email.trim()} within a few days.
            </p>
            <button type="button" className="sol-btn" style={{ marginTop: 22 }} onClick={close}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 id="sol-dlg-h">Request access</h2>
            <p>{brand} is invite only while we grow. Tell us a little about you.</p>
            <form onSubmit={submit} noValidate>
              <div className="sol-roles" role="radiogroup" aria-label="I am here to">
                {roles.map((r, i) => (
                  <button
                    key={r.v}
                    ref={(el) => {
                      roleRefs.current[i] = el
                    }}
                    type="button"
                    role="radio"
                    aria-checked={role === r.v}
                    tabIndex={role === r.v ? 0 : -1}
                    onClick={() => setRole(r.v)}
                    onKeyDown={(e) => {
                      const j = nextIndex(i, e.key, 2)
                      if (j < 0) return
                      e.preventDefault()
                      setRole(roles[j].v)
                      const b = roleRefs.current[j]
                      if (b) b.focus()
                    }}
                  >
                    <b>{r.t}</b>
                    <small>{r.s}</small>
                  </button>
                ))}
              </div>
              <div className="sol-fld" data-bad={tried && bad.name ? "" : undefined}>
                <label htmlFor="sol-f-name">Full name</label>
                <input id="sol-f-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={tried && bad.name} aria-describedby={tried && bad.name ? "sol-e-name" : undefined} />
                {tried && bad.name ? <span className="sol-err" id="sol-e-name">Tell us your name.</span> : null}
              </div>
              <div className="sol-fld" data-bad={tried && bad.email ? "" : undefined}>
                <label htmlFor="sol-f-email">Email</label>
                <input id="sol-f-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" aria-invalid={tried && bad.email} aria-describedby={tried && bad.email ? "sol-e-email" : undefined} />
                {tried && bad.email ? <span className="sol-err" id="sol-e-email">That email does not look right.</span> : null}
              </div>
              <div className="sol-fld" data-bad={tried && bad.detail ? "" : undefined}>
                <label htmlFor="sol-f-detail">{role === "invest" ? "Typical check size" : "Link to your work"}</label>
                {role === "invest" ? (
                  <select id="sol-f-detail" value={detail} onChange={(e) => setDetail(e.target.value)} aria-invalid={tried && bad.detail} aria-describedby={tried && bad.detail ? "sol-e-detail" : undefined}>
                    <option value="">Choose one</option>
                    <option>Under $5k</option>
                    <option>$5k to $25k</option>
                    <option>$25k to $100k</option>
                    <option>Over $100k</option>
                  </select>
                ) : (
                  <input id="sol-f-detail" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Portfolio, channel or company" inputMode="url" aria-invalid={tried && bad.detail} aria-describedby={tried && bad.detail ? "sol-e-detail" : undefined} />
                )}
                {tried && bad.detail ? <span className="sol-err" id="sol-e-detail">{role === "invest" ? "Pick a range." : "Add a link so we can look."}</span> : null}
              </div>
              {state === "error" ? (
                <span className="sol-err" role="alert">
                  Something went wrong sending that. Please try again.
                </span>
              ) : null}
              <button type="submit" className="sol-btn" disabled={state === "sending"}>
                {state === "sending" ? (
                  <>
                    <span className="sol-spin" aria-hidden="true" /> Sending
                  </>
                ) : (
                  <>
                    Request access <Arrow />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------- the page ---------- */

export default function StippleOrbLanding({
  brand = "Kindling",
  logo,
  nav = DEFAULT_NAV,
  navAction = { label: "Request access" },
  hero,
  thesis,
  paths,
  steps,
  stories,
  cta,
  faq,
  footer,
  currency = "$",
  palette = "ember",
  theme = "system",
  themeToggle = true,
  onRequestAccess,
  height = "100svh",
  className,
}: StippleOrbLandingProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const navRef = React.useRef(null as HTMLElement | null)
  const reduced = useReducedMotion()
  const [dark, setDark] = useTheme(theme)
  const [ready, setReady] = React.useState(false)
  const [stuck, setStuck] = React.useState(false)
  const [menu, setMenu] = React.useState(false)
  const [dialog, setDialog] = React.useState(false)
  const [role, setRole] = React.useState("invest" as "invest" | "raise")
  const menuRef = React.useRef(null as HTMLDivElement | null)
  const pal = resolvePalette(palette)
  const h = { ...DEFAULT_HERO, ...(hero || {}) }
  const th = thesis === null ? null : { ...DEFAULT_THESIS, investors: DEFAULT_INVESTORS, ...(thesis || {}) }
  const pa = paths === null ? null : { ...DEFAULT_PATHS, ...(paths || {}) }
  const model = { ...DEFAULT_MODEL, ...((paths && paths.model) || {}) }
  const st = steps === null ? null : steps || DEFAULT_STEPS
  const so = stories === null ? null : stories || DEFAULT_STORIES
  const ct = cta === null ? null : cta || { title: "Join *the next generation of* backers *funding* individual success *stories.*", action: { label: "Request access" } }
  const fq = faq === null ? null : faq || DEFAULT_FAQ
  const ft = footer === null ? null : { ...DEFAULT_FOOTER, ...(footer || {}) }
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const ctaRef = React.useRef(null as HTMLElement | null)

  useIsoLayoutEffect(() => setReady(true), [])
  useReveal(rootRef, reduced)

  React.useEffect(() => {
    const onScroll = () => {
      const r = rootRef.current
      if (!r) return
      setStuck(r.getBoundingClientRect().top < -8)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true, capture: true })
    return () => window.removeEventListener("scroll", onScroll, { capture: true })
  }, [])

  const closeMenu = React.useCallback(() => setMenu(false), [])
  const closeDialog = React.useCallback(() => setDialog(false), [])
  useDialog(menu, menuRef, closeMenu)

  const openAccess = React.useCallback((r?: "invest" | "raise") => {
    if (r) setRole(r)
    setMenu(false)
    setDialog(true)
  }, [])

  const jump = (href: string) => {
    const root = rootRef.current
    if (!root || href[0] !== "#" || href.length < 2) return false
    const target = root.querySelector('[data-sec="' + href.slice(1) + '"]')
    if (!target) return false
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
    return true
  }

  const act = (l?: SolLink) => {
    if (l && l.href) {
      if (jump(l.href)) return
      window.location.href = l.href
      return
    }
    openAccess()
  }

  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a")
    if (!a || !rootRef.current || !rootRef.current.contains(a)) return
    const access = a.getAttribute("data-access")
    if (access === "invest" || access === "raise") {
      e.preventDefault()
      openAccess(access)
      return
    }
    const href = a.getAttribute("href") || ""
    if (href[0] === "#" && jump(href)) {
      e.preventDefault()
      setMenu(false)
    }
  }

  const style = {
    "--sol-h": height,
    "--sol-accent": pal.accent,
    "--sol-button": pal.button,
    "--sol-on-button": pal.onButton,
    "--sol-mint": pal.mint,
    "--sol-cream": pal.cream,
    "--sol-sky": pal.sky,
    "--sol-mono": MONO,
    fontFamily: FONT,
  } as React.CSSProperties

  const faces = [IMG_A1, IMG_A2, IMG_A3, IMG_A4]
  const titleLines = (h.title || "").split("\n")
  const brandEl = (
    <span className="sol-brand">
      {logo || <Mark />}
      {brand}
    </span>
  )

  return (
    <div
      ref={rootRef}
      className={"sol-root" + (className ? " " + className : "")}
      style={style}
      data-theme={dark ? "dark" : "light"}
      data-ready={ready && !reduced ? "" : undefined}
      onClick={onClick}
    >
      <style>{SOL_CSS}</style>
      <a className="sol-skip" href={"#" + uid + "-main"} onClick={(e) => {
        e.preventDefault()
        const m = document.getElementById(uid + "-main")
        if (m) m.focus()
      }}>
        Skip to content
      </a>

      <header ref={navRef} className="sol-nav" data-stuck={stuck ? "" : undefined}>
        <div className="sol-wrap">
          <a href="#top" aria-label={brand + ", back to top"} onClick={(e) => {
            e.preventDefault()
            const r = rootRef.current
            if (r) r.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
          }}>
            {brandEl}
          </a>
          <nav aria-label="Main">
            <ul className="sol-links">
              {nav.map((l) => (
                <li key={l.label}>
                  <a href={l.href || "#"}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="sol-navr">
            {themeToggle ? (
              <button type="button" className="sol-icon-btn" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setDark(!dark)}>
                {dark ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ) : null}
            <button type="button" className="sol-btn sol-pill" onClick={() => act(navAction)}>
              {navAction.label}
              <Arrow size={12} />
            </button>
            <button type="button" className="sol-icon-btn sol-burger" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M3 6h12M3 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menu ? (
        <div ref={menuRef} className="sol-sheet" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="sol-sheet-top">
            {brandEl}
            <button type="button" className="sol-icon-btn" aria-label="Close menu" onClick={closeMenu}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="m3.5 3.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <ul>
            {nav.map((l) => (
              <li key={l.label}>
                <a href={l.href || "#"}>
                  {l.label}
                  <Arrow />
                </a>
              </li>
            ))}
          </ul>
          <button type="button" className="sol-btn" onClick={() => act(navAction)}>
            {navAction.label}
            <Arrow />
          </button>
        </div>
      ) : null}

      <main id={uid + "-main"} tabIndex={-1} style={{ outline: "none" }}>
        <section className="sol-hero" data-sec="top" aria-labelledby="sol-h1">
          <div className="sol-wrap sol-hero-grid">
            <div>
              <h1 id="sol-h1" className="sol-h1">
                {titleLines.map((line, i) => (
                  <span key={i}>
                    {twoTone(line).map((p, k) => (p.muted ? <span key={k} className="sol-muted" style={{ display: "inline" }}>{p.text}</span> : <React.Fragment key={k}>{p.text}</React.Fragment>))}
                  </span>
                ))}
              </h1>
              <p className="sol-hero-text">{h.text}</p>
              <div className="sol-hero-cta">
                <button type="button" className="sol-btn" onClick={() => act(h.action)}>
                  {(h.action && h.action.label) || "Request access"}
                  <Arrow />
                </button>
                {h.social ? (
                  <span className="sol-faces">
                    <span aria-hidden="true">
                      {faces.map((f, i) => (
                        <img key={i} src={f} alt="" width={26} height={26} />
                      ))}
                    </span>
                    {h.social}
                  </span>
                ) : null}
              </div>
            </div>
            <Orb accent={pal.accent} dark={dark} reduced={reduced} label="A sphere of stippled dots, lit in the accent colour" />
          </div>
          {h.backers && h.backers.length ? (
            <div className="sol-wrap sol-backers">
              <span className="sol-mono">{h.backersLabel}</span>
              <ul>
                {h.backers.map((b) => (
                  <li key={b.name}>
                    <BackerMark mark={b.mark} />
                    {b.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {th ? <Thesis data={th} currency={currency} reduced={reduced} onAction={act} /> : null}

        {pa ? (
          <section className="sol-sec sol-paths" data-sec="paths" aria-labelledby="sol-paths-h">
            <div className="sol-wrap">
              <h2 id="sol-paths-h" className="sol-h2 sol-rv">
                {pa.title}
              </h2>
              <div className="sol-paths-grid">
                <BackerPanel path={pa.investors} model={model} currency={currency} reduced={reduced} uid={uid + "b"} />
                <RaisePanel path={pa.individuals} model={model} currency={currency} reduced={reduced} avatar={IMG_A5} />
              </div>
            </div>
          </section>
        ) : null}

        {st ? <Steps data={st} avatars={faces} /> : null}

        {so ? <Stories data={so} currency={currency} /> : null}

        {ct ? (
          <section
            ref={ctaRef}
            className="sol-sec sol-cta"
            data-sec="cta"
            aria-labelledby="sol-cta-h"
            onPointerMove={(e) => {
              const el = ctaRef.current
              if (!el) return
              const r = el.getBoundingClientRect()
              el.style.setProperty("--mx", e.clientX - r.left + "px")
              el.style.setProperty("--my", e.clientY - r.top + "px")
              el.style.setProperty("--glow", "1")
            }}
            onPointerLeave={() => {
              const el = ctaRef.current
              if (!el) return
              el.style.removeProperty("--mx")
              el.style.removeProperty("--my")
              el.style.setProperty("--glow", "0")
            }}
          >
            <div className="sol-wrap sol-rv">
              <Head parts={ct.title} />
              <span id="sol-cta-h" className="sol-sr">{twoTone(ct.title).map((p) => p.text).join("")}</span>
              <button type="button" className="sol-btn" onClick={() => act(ct.action)}>
                {(ct.action && ct.action.label) || "Request access"}
                <Arrow />
              </button>
            </div>
          </section>
        ) : null}

        {fq ? <Faq data={fq} /> : null}
      </main>

      {ft ? (
        <footer className="sol-sec sol-foot">
          {ft.tagline ? <p className="sol-foot-tag sol-rv">{ft.tagline}</p> : null}
          <Horizon accent={pal.accent} dark={dark} reduced={reduced} />
          <div className="sol-wrap sol-foot-row">
            <div className="sol-foot-cols">
              {(ft.columns || []).map((c) => (
                <div key={c.title}>
                  <h4>{c.title}</h4>
                  <ul>
                    {c.links.map((l) => (
                      <li key={l.label}>
                        <a href={l.href || "#"}>{l.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="sol-foot-r">
              {ft.note ? <p>{ft.note}</p> : null}
              <p>
                {brand} &copy; {new Date().getFullYear()}. {ft.credit}
              </p>
            </div>
          </div>
        </footer>
      ) : null}

      <AccessDialog open={dialog} role={role} setRole={setRole} close={closeDialog} brand={brand} onRequestAccess={onRequestAccess} />
    </div>
  )
}

// #region photos
// Portraits from Unsplash (Unsplash License), cropped and re-encoded as small WebP.
const IMG_ARLO =
  "data:image/webp;base64,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"
const IMG_NOOR =
  "data:image/webp;base64,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"
const IMG_THEO =
  "data:image/webp;base64,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"
const IMG_A1 =
  "data:image/webp;base64,UklGRp4DAABXRUJQVlA4IJIDAACwFACdASpQAFAAPrVQok4nJCKpJTgLaSAWiUAYe/zxJ61C0RGyQudK+oDdIwBfht3SRL9mN5NZ4bStt0RXwA3oYATbhCBaiJHptYS2aQPdlPWWFu2w/Oe3c47DWXR7yuJ7GVxCrBDzTpy/fN6gQGohCYnC09cfCpOnWKFlbn0GsxCblV4s2JOeqmMuiHqSeG416m1oMYe5BbqYGS3o8cBCFVixRIW1agyuAJna9QAA/vM3pKZBPzYhY/pVAbjmVkdvT5ng94FAI0DROvW+Cpl/NZqamiKLuLJxVAImkFu+0/UfMlGE/3GYDJBO5efHBuERCfIXPMnOPbBGs8bXb7i5byaN3ICqiaaiScjPe/FNw6VFGyJGVSejZ523NluDjEbmeSSuFNbFfs2RQZlTWwmvHtYx9TXCA9MfDe6ffXrOXeyvkpkHHI3aapTBxpNBofO4euavFhIKvCN+tvWeTBtlzY7IlB594iS3g4WUc4CJV8NnT277VOjwDrJo00/9Hv0Th8jvhYnutzaGz9CKXI9x+OgN2whkdid8uq9XMx5FaV7olPxA4Tw4XVRbGEC//mNVJa0KS7qcimJWnWnKDfN2ZyDDUjQroiqN/HLT/h+R4u5IHUyCNeFLbGm/9MIz4o9n0CPn1qV7vmnVB9Gj/chv3FshoiKh4O+LtigKrD0rHT19NyW6lTIHn6qHjX/mu/Gd0e3s0cArABIO+pYqaZPifP9wIh+9dgo9W+6vkH3bS24xFhuDHaFK+xyj3oVSXldjNSAtRTqzXOClwMHbHzMJYL4+LyT4juKbmhX2000DNm7MWVqUVNBxroglmKl5lOx5TWhDiyXfrDgq8WWePS7zZEpweZYWUvWxYOoFenjFOBzS+QUgre+FuDbJNV/zLSi/jrbSA2se9oMrfiBcYJScHMMfDYUavdwFdpu0LciAA1Dzn2+PhBiojMelOuAAnG8Lbera8uK1Z9f2HpvDHyjF+DBLBCnnfY+TkB6Q/FUjtnGwfwG8c18kGPBLd+ayzX07R3H1n7Yz/mC33meOz08/i4Xsh+vCey9404LoJPiGO2OLzJkBULiY5XZt4A2ROzF48iSDVRjWPn9PtQYzn/j7Ny3OyFN17eL3xqIzRjDkDvAyGo/T0QTgYoRYcKOZedcGqtCA5EhSqXy4Ub4QVhaWv8R6DmdoixDoQSzqtcx24rlWnAiLjWN4cL3LAl8lGugAAA=="
const IMG_A2 =
  "data:image/webp;base64,UklGRjwDAABXRUJQVlA4IDADAACwFACdASpQAFAAPrVQn0onJSKhrNTcyOAWiWNkeVfcpNJOySWwSJNLr/+vV9ibpNmc/zgWqf0p/HtpPUsfS2inSEt6T+G3X4ej51DHumkrpSj7GNCO+1qEranAYapsS5kM8lA4PLvpkvB2RJy8I+0BRPoOtNHIco8i0vZjSY6XwpDXT3hJSbdghIp9FFl/7TuUj5NzjY7+19pq5etghWc7hb2Jx9bsi3j8jdaIb4gA/uw7vvBqGTEkyzEzieKlyfpXxX+NNTAm1/Y1CryMOP25Vz9++/qrOSJoKPogvxjGbyqBqSsq0c3vpq7jWoPZxOB7iwzvR0i0rRQx+MnLdz01JD8TdSe9f/4jwhx7wFSlEz+33u4gmYhHrQFg2nHK6tSnZqYw5jspYkAI2zbU8RpN93R53vZWgrgjCSf+ymzqfyIpKXSM0yZl7adAfdmWcu0BTOYODeAXyj7aOuRTH411FeeiLrppm+2ypdvnjUvEHlVdZyxQYdMpBBYmyERkkndJ0re8SHIMh+/RDDcOGo2Z/T4yxSEPQYEqeKsI1SFg7bbOcN+8cWK3qB+aJgDXwPRcGQeR8kbZOMoyof3ohoVHY1WYiLbeVD2zyVUduV4O+pNyeja+rqXlLs3/wHb6ouKc+8/KZs9PXfh0+qTQt2dohUN97LFnrsvxiHwTaNnHuAQ+x0Tfa4InLOGh6Ow1RnstNLlKE84fG2WthxeVHKddP06y1FFftNgjApHRstJGaF7c8u5ZoS7q34Wl09kt8OlDpvrejkpnm0wjqslZB6JpKLiuz6kY4E/RJXyD0eODwb6nHF7m6M/bPlk5AOC/b5kUtSjwLWdObWTABC+gNlG2zajLGdON7R/0JZdEEeuW8y6ygzCLbLv/o6DqdcreVBl1rBIbsG5lNVRjSz9WjTf16b9/cQBgKU8u+b6xT0JFPWEmxkLF6mhWRbpCFbElp+LsnharrgsxcJuhvhH/MFIfKJRlEQspAZkb3HJgy2gxVYbleVlpPZpSYt4uduUz7oz7MSdZGjMy/2HteR4EWGzS1boRq7ohtFzLIQxnrUP9FmIV5SQZt2rdyvySp8EgAAA="
const IMG_A3 =
  "data:image/webp;base64,UklGRkgCAABXRUJQVlA4IDwCAAAQDQCdASpQAFAAPrVOoEqnJCMhrNmbMOAWiWIAwFxYzKAZ1CkPuVeWfxK6bDPDOnt8UVJyTdSC02ESVM6f8zyP6oL1YpyVUVZ+SiQwnSsUi7oaT57q1pBvA8xju1TMhdLgYWT7dX3CPg0H9UyLLizmAAD+1yvTsXZc7LZI0yl0B7494X5wwkQsr7GLgB/iPBYKlogjg0lsBx0xNOtQNmIdsDe3T/3SjdwSOYw+otXJq2Ybh70HwGKJmim+9huWM3jpjrSpkODeqMqY0EhZq7zXTlsnB05kzd/tj7mEaPbZV8emYw3TzpyNWgFj7JQBofT0nq7RScivJEi1OaX4Ejb/YMXlYKp1rAD0O97iijYWlaOBiDGR8gbYVbDgua6YvtXAFOd7HIYs17vgwQLpcSl5v3XdGCNLR4/EwQsS3hQOGeRmTgF1EGDk6s0SruUzG+xJucfbhgc01fCIkFf9eCb/ZJ4u1iLUAJ1vlhL/opcIZ/Q0pKmyXdyyH3POj6s7R9UmxBYzAIQV4vS2Dm80mR1nLiStUQfVJZg+IhoORe8ibvXkKXc0PRL27RtaRPlvclIeuK4zLnXhLldG5NcUR92Lvu+YS6Mn02g59Ykk7xYLmg2wTk3No1et+RO+xhlrUbgEw87ZBvrX/54OF+j1IBMXdOvJt4NucYsaJVfTHmNt1jNwfG0rc5bH9JlyrJ1fmIItm22viALnJLN70QOqRwHnio6ztOTdJfyBUg8dBl/Ed8hxsyHI5F2hMAAAAA=="
const IMG_A4 =
  "data:image/webp;base64,UklGRqIEAABXRUJQVlA4IJYEAABQGACdASpQAFAAPrVQoU0nJCMiJ7VbyOAWiWMAwRB2CohPfcn+T8HfLOG+OHvpl/ajRpxP0OU6JWP89sWb2xGhPH/7Y/7mUGWrpVDBDCiZGJ8MmkQwDZtgLd7M/SmjnahDNzoxMlXlE3b3z3LT79T0CBgfkTxPupTdVectB8sv9wbp+RfaexuUi7q5/55iwhDWLNeH6HHu5yy2kzz+t2nQkkV79aWQc49m632dwrtZistEU9ow+3eZKEIRQ87Z4nUaVjqbsTbZzyNYAAD+azKExoU5+dK15Z7nw944z1jSJCbiiVptS350hCSiuZ3YMkE+mqv7TXkjkyhoPgg0T+uz6OCmpWW0YHmIjmNgjYezUwVVJ2FseOPoexN+Eja0E+yhFNDcTZ+iAArwO4C6FCaaW7sA2GY2E6xAgEP8wt9d3e/jhnPLnTkxka9/w7dfFeWPuiNbEm0MsEi8085+jxvXn3TGxntjA2tZYFEPzI5OlbJRAUt4Xi8byrAjLJ8DC4o1LhhIdWymMKSbcfBW4eeCzOctgYaFx/tlYV9QRkS+DOtMh8jAti8ajqWwLg3psb0VJGsBRaBN7mmC7VtT25bGHLvuzwy2ShMTiWVhb2F2NU3qiXZrnCgcD3v/8eaADkf0xKO1ytnlobVHZOzhG2Y8C/s8m6kU7EjzrKnvqRGBSTL2iImy6Ki+oQbrG4225M2dXsStxuwMwbuqsVRfkIUD3AzDqkW0Lwkj2ScAVX7qGc/dhWdD0CWRK1OR7WWSRfb+4tAam6n2seQ+nzFYOn1UscJt3CWIolIG+T4D3msSDKbJodu5qf/fOm9Z3RqRO0PODuKF1zmDTpZ87p5TLioMuROz6HYGpH8haZnk/vSOVu6+z30ZlcLqDSHUCEcXY5Ed12QnBwmthbOWyJJNo1CBURiF3dY25R635vMetS3Ekd2XY6T0LKap7NijdwPiSiRHJZhfmxpOD2OmFoHE85RWZzb5RPhd0C3QN/ne3GaefdREPrmRerfuNbMloBhSTDOpndi87SJDM7fRe72kpA8NpG4VZjCMRZAEwtqqS9qzoAgoD2/S/7/nyEe6zdRAFRW0qUTuZ3U8rQlc+4P1GXS/nk5h78iZs5jVJedeVU5WNzPJ7ZEP1XTZ7dKMCEkYb1+6cJwyp8dV1hGGyfaf3esqPPU7i7rNMlK9LilbXTkAIDZw3ubqccAWX+fo8MfYw43n0NEu4nUJMU73qA006xwKhWnbQRI7gc8zuhI6Yc0+L8sK/s28jkIclLuBISE24sdLgDSWjy3QCLgFsWx6navWV23mfpcKqxBo49DeE3Bmsik/buzQgotf1BIpQaojCnQ5Ys0WptuSJQZxF8/aZHsYI3NRjZXaPLMGXb20oxyXWpyddJBdFYTRRdmbM4/CEc29nhNy40PS9woJ4oFsAtw+RwJETVK7IzILcmFlrX7qA9cP7J8d1Vg8rkJsBMgqEm5X/srDrax/0auVcq8LY7AuTRFYMQeX8hpYpVQC2+9WHmwPbtHiQ8ue4sjjCzm8mf1BFhJGRUwYBdJm4EMwAIrqxMnIAAAA"
const IMG_A5 =
  "data:image/webp;base64,UklGRkYDAABXRUJQVlA4IDoDAAAQFACdASpQAFAAPrVQoUwnJKMoKlQLSQAWiWMAxFhZjZnnJaHUxFysu0Ou0WMJ6ZJ8woCA8SxxUQBo7GqAMAy41m6oFa1nAsDZ90ade8GzThkbwtFD7hFRzUEP4+3kCfFcezYQ0s3QHjjST9ugvtoKtyhUtEFtfoozh2vMY4wa0cIwsJI9hNITmoa35EHdf1WqlADJkSWcxQb6kM/FfM+qQkW7iQIdjrdcAM3gB11y/20KTwUddUPy2w2BqyGhNaYX45LDMr7+wKCfiPy5WN2GyMbCASBVPF0gX66XL+Lcy9XuAKw1y3vleG8fAe4Lky327b7N75M1ZlljzUZukyrQbvVbqSmP06qPOdcugmsE/0d7uPwHHZvE60YQiWg0cYCjErhRkpXRgHjJfzJP3/FuktXxMja0LTbj6w4tnc5RMHj+UzEAmMDKsA6aFM79pvWWRngDAHagJjGfI1+6ON9s7KLbGgYIfLvddWOKWjQ9LCLxxWDbUbYwM29CfvOZZroI8LexoZfUUgZCxaZhKxD1cbUczW9r5o6NzNPGhPytYWa5m2pTOWAYoGXGH+vQ4WRowLiZqko0qTMgKmdc3+QEIN3j4DA/5EP7LR3baZNe+1av/+pVaxUeezNa1HDqV3XMmj2s4ohC9ezv14M5B3mfSrUWrV3y1QlVR3PeeVTQ+q41OnJaOVd51zDg8ZBS3tZm4qM2/x0xZIpcig+L93Bbv2BPZR8sv6eLFW+N8hjUgXyCs2hsbIdsDGQJvY5F6/LKDRWuUi/D6sIN+KKNyij+S1Fp7Cf8nIwMUfHtkYcRD2UfikQmtvzh4MtQYXbxfaa0o5mlImRB2wUsRxEt1wtHZY8jG2xtoLK8oLC+TAp3ES/h2elk4kk8/34O6PV21GvRrY5Pb8Pt6X7V2DTOWMVDqR482xgpjVw1beIZRDmje/CzyJEvOB4AqlxzMLTuwE/Geij69Io59mTTd+YC2xs9zskK0txv1ET+Uw04xRo8Qt2cuh0hpAMDJK4nK9jPL7FbwRIXXiOMxj6LK9NQIpTrbDpy5XP3lCtYLD174/SNzGKcjQvk/QxIeqmJVEcPP4gZwZwmB8bX0AAA"
// #endregion photos

// #region people
const DEFAULT_INVESTORS: SolInvestor[] = [
  { name: "Lena Brooks", amount: 25000, avatar: IMG_A1 },
  { name: "Marcus Hale", amount: 10000, avatar: IMG_A2 },
  { name: "Ines Dumont", amount: 15000, avatar: IMG_A3 },
]

const DEFAULT_STORIES = {
  title: "Success stories",
  items: [
    {
      name: "Arlo Brandt",
      role: "Musician",
      reach: "2.4M monthly listeners",
      photo: IMG_ARLO,
      points: ["Played clubs for six years before his first record", "Kept every master by raising here, not signing", "Earnings up threefold since the raise", "Backers paid out every quarter since month nine"],
      raised: 140000,
      share: 0.06,
      years: 12,
      growth: [21, 23, 22, 27, 31, 30, 36, 41, 46, 52, 58, 66],
    },
    {
      name: "Noor Haddad",
      role: "Designer & founder",
      reach: "380k followers across platforms",
      photo: IMG_NOOR,
      points: ["Left a studio job to start a furniture label", "Funded her first production run of 400 pieces", "Sold out in eleven days, now stocked in 30 stores", "Raised again a year later, from the same backers"],
      raised: 210000,
      share: 0.08,
      years: 15,
      growth: [12, 14, 13, 18, 22, 21, 27, 33, 32, 38, 44, 49],
    },
    {
      name: "Theo Marsh",
      role: "Engineer",
      reach: "Two apps, 61k paying users",
      photo: IMG_THEO,
      points: ["Former platform engineer, now building on his own", "Owned 100% of both apps before raising", "Revenue up 2.6x in the eighteen months since", "Needs $1.2M lifetime revenue for backers to break even"],
      raised: 95000,
      share: 0.075,
      years: 10,
      growth: [30, 31, 35, 34, 40, 46, 45, 52, 58, 63, 71, 78],
    },
  ] as SolStory[],
}
// #endregion people
