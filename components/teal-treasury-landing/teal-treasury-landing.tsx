"use client"

// Teal Treasury Landing — a complete treasury / cash-management landing page in
// one file, on cream paper with a deep-teal ink and an olive-gold accent.
//
// The hero holds a working product: a dashboard that tilts flat as you scroll,
// where you can move money between accounts (balances, the cash-breakdown bar
// and the floating "Internal transfer" card all follow), read the activity
// ledger and morph the balance chart between ranges. Below it: a statement that
// inks in word by word, stats that count up, a sticky feature stage that morphs
// between three live scenes (account setup, a phone with a credit-line request,
// unified reporting), an FDIC coverage calculator over 500 partner banks, a
// dark pricing block with a cost comparison, questions, a pointer-lit call to
// action whose button morphs into an email field, an operating-account card
// with a dial that turns with the page, resources and a footer.
//
// Motion is GSAP + ScrollTrigger, scoped to this root and reverted on unmount.
// Everything is drawn here: the dashboard, the phone, the dial, the resource
// covers and the marks are SVG and CSS; the type is the system stack; nothing
// loads at runtime.
import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export type TtlLink = { label: string; href?: string }

/** "#dashboard", "#benefits", "#features", "#coverage", "#pricing", "#faq", "#get-started" and "#resources" scroll within the page. */
export type TtlNav = {
  /** Shown in the fold-out "Products" panel. */
  products?: { label: string; text: string; href?: string }[]
  links?: TtlLink[]
  login?: TtlLink
  cta?: TtlLink
}

export type TtlAccount = { id: string; name: string; kind: string; balance: number }

export type TtlActivity = { id: string; date: string; text: string; account: string; amount: number; status: "Settled" | "Pending" | "Scheduled" }

export type TtlTransfer = { from: string; to: string; amount: number; memo: string }

export type TtlStat = { value: number; label: string; prefix?: string; suffix?: string; decimals?: number }

export type TtlFeature = { title: string; text: string }

export type TtlCoverageItem = { title: string; text: string }

export type TtlFaq = { q: string; a: string }

export type TtlResourceArt = "dashboard" | "report" | "line" | "multi"

export type TtlResource = { title: string; tag: string; art?: TtlResourceArt; href?: string }

export type TtlPaletteName = "teal" | "plum" | "graphite"

export type TtlPalette = {
  page: string
  paper: string
  ink: string
  muted: string
  rule: string
  /** The dark sections: pricing, the operating card, resource captions. */
  deep: string
  deepInk: string
  deepMuted: string
  /** The accent word in headlines, ticks and highlights. */
  gold: string
  /** The soft secondary button. */
  lilac: string
  lilacInk: string
  /** Primary buttons. */
  accent: string
  accentInk: string
  good: string
  /** One colour per account in the charts. */
  chart: [string, string, string]
  /** The three glows of the call-to-action card. */
  glow: [string, string, string]
}

export type TtlPaletteInput = {
  page?: string
  paper?: string
  ink?: string
  muted?: string
  rule?: string
  deep?: string
  deepInk?: string
  deepMuted?: string
  gold?: string
  lilac?: string
  lilacInk?: string
  accent?: string
  accentInk?: string
  good?: string
  chart?: [string, string, string]
  glow?: [string, string, string]
}

export interface TealTreasuryLandingProps {
  /** Wordmark in the nav, the dashboard and the footer. */
  brand?: string
  /** Replaces the drawn vault mark beside the wordmark. */
  logo?: React.ReactNode
  nav?: TtlNav | null
  /** Wrap words in *asterisks* to set them in the accent. "\n" breaks the line. */
  hero?: { title?: string; text?: string; primary?: TtlLink; secondary?: TtlLink } | null
  /** The accounts in the dashboard. Transfers move money between them; the total never changes. */
  accounts?: TtlAccount[]
  activity?: TtlActivity[]
  /** The fund named in the dashboard's breadcrumb. */
  fund?: string
  benefits?: { label?: string; text?: string; stats?: TtlStat[] } | null
  /** Up to three; each gets its own live scene, in order: setup, phone, reporting. */
  features?: { label?: string; items?: TtlFeature[] } | null
  coverage?: { title?: string; limit?: number; perBank?: number; items?: TtlCoverageItem[] } | null
  pricing?: {
    label?: string
    price?: string
    unit?: string
    intro?: string
    items?: string[]
    addon?: { title: string; text: string }
    note?: string
    /** Yearly cost of the plan, for the comparison. `null` hides the comparison. */
    annual?: number | null
  } | null
  faq?: { label?: string; title?: string; items?: TtlFaq[]; contact?: string } | null
  cta?: { title?: string; text?: string; button?: string; secondary?: TtlLink } | null
  operating?: { title?: string; text?: string; link?: TtlLink } | null
  /** Wrap words in *asterisks* to set them in the accent. */
  resources?: { title?: string; items?: TtlResource[] } | null
  footer?: { columns?: { title: string; links: TtlLink[] }[]; legal?: string } | null
  palette?: TtlPaletteName | TtlPaletteInput
  /** Called when a transfer is confirmed. Return (or resolve to) `false`, or throw, to show an error. */
  onTransfer?: (transfer: TtlTransfer) => unknown
  /** Called with the email from the call to action. Return (or resolve to) `false`, or throw, to show an error. */
  onGetStarted?: (email: string) => unknown
  /** Minimum height of the page. A definite length, so it survives any host layout. */
  height?: string
  className?: string
}

// #region content
const PALETTES = {
  teal: {
    page: "#f5f4ee",
    paper: "#ffffff",
    ink: "#10292d",
    muted: "#66726f",
    rule: "#e2e0d6",
    deep: "#0c2f35",
    deepInk: "#eef2ec",
    deepMuted: "#93aaa6",
    gold: "#8c7b33",
    lilac: "#cdc8f6",
    lilacInk: "#1e1a44",
    accent: "#0f3238",
    accentInk: "#ffffff",
    good: "#2f7d57",
    chart: ["#0f3238", "#a8963f", "#a9a2ee"] as [string, string, string],
    glow: ["#c9c3f5", "#f2c4b4", "#f7dccb"] as [string, string, string],
  },
  plum: {
    page: "#f7f2ef",
    paper: "#ffffff",
    ink: "#2a1630",
    muted: "#76666f",
    rule: "#eaded9",
    deep: "#2b1433",
    deepInk: "#f6eef2",
    deepMuted: "#b39cb0",
    gold: "#a8642e",
    lilac: "#f3d3c4",
    lilacInk: "#4a1d22",
    accent: "#3a1a44",
    accentInk: "#ffffff",
    good: "#3b7a4f",
    chart: ["#3a1a44", "#c07a3c", "#e3a6b9"] as [string, string, string],
    glow: ["#f4c9d6", "#f6d4b2", "#e4d1f6"] as [string, string, string],
  },
  graphite: {
    page: "#f2f3f4",
    paper: "#ffffff",
    ink: "#16191c",
    muted: "#646b72",
    rule: "#dfe2e5",
    deep: "#15181b",
    deepInk: "#eef0f2",
    deepMuted: "#8e979f",
    gold: "#9a7f45",
    lilac: "#c9def0",
    lilacInk: "#12324a",
    accent: "#16191c",
    accentInk: "#ffffff",
    good: "#2f7a5d",
    chart: ["#16191c", "#a88b4c", "#8fb6d6"] as [string, string, string],
    glow: ["#c4daf0", "#d6e8de", "#f0e1c6"] as [string, string, string],
  },
}

const DEFAULT_NAV: TtlNav = {
  products: [
    { label: "Treasury", text: "Operate every fund account from one live dashboard.", href: "#features" },
    { label: "Vault accounts", text: "Programmatic FDIC coverage across 500 banks.", href: "#coverage" },
    { label: "Credit lines", text: "Capital call lines without the paperwork.", href: "#faq" },
  ],
  links: [
    { label: "Pricing", href: "#pricing" },
    { label: "Resources", href: "#resources" },
  ],
  login: { label: "Sign in", href: "#" },
  cta: { label: "Get started", href: "#get-started" },
}

const DEFAULT_ACCOUNTS: TtlAccount[] = [
  { id: "operating", name: "Operating", kind: "FDIC-insured checking", balance: 18976800 },
  { id: "mmf", name: "Money market", kind: "Government MMF · 4.82% 7-day", balance: 41113950 },
  { id: "vault", name: "Vault", kind: "Swept across partner banks", balance: 3165250 },
]

const DEFAULT_ACTIVITY: TtlActivity[] = [
  { id: "a1", date: "Oct 22", text: "Capital call · LP batch 14", account: "Operating", amount: 6200000, status: "Settled" },
  { id: "a2", date: "Oct 21", text: "Wire to Bank Point LLC", account: "Operating", amount: -2150000, status: "Pending" },
  { id: "a3", date: "Oct 19", text: "MMF dividend reinvested", account: "Money market", amount: 162418.37, status: "Settled" },
  { id: "a4", date: "Oct 17", text: "Management fee · Q4", account: "Operating", amount: -487500, status: "Scheduled" },
  { id: "a5", date: "Oct 14", text: "Sweep to partner banks", account: "Vault", amount: 1250000, status: "Settled" },
]

const DEFAULT_STATS: TtlStat[] = [
  { value: 214, suffix: "K", label: "Portfolio investments tracked" },
  { value: 48, prefix: "$", suffix: "B", label: "Capital on the ledger" },
  { value: 720, suffix: "K", label: "Investors and LPs served" },
]

const DEFAULT_FEATURES: TtlFeature[] = [
  {
    title: "Instant account setup",
    text: "Open an operating account, a vault account and a money market fund in less than five minutes, or link the accounts you already have. Each fund gets its own entity, its own routing and its own coverage from day one.",
  },
  {
    title: "Operational control",
    text: "Execute every account move from one place. Approve wires, sweep idle cash into money market funds, request a capital call line of credit and see the impact on each fund before you commit.",
  },
  {
    title: "Unified reporting",
    text: "Consolidated, live reporting across all of your accounts and funds. Balances, yield and every transaction in one ledger, ready for your fund admin and your LP letters.",
  },
]

const DEFAULT_COVERAGE: TtlCoverageItem[] = [
  { title: "Sweep network", text: "Optimized FDIC coverage" },
  { title: "Vault accounts", text: "Programmatically protected" },
  { title: "Wire transfers", text: "Custom approval workflows" },
  { title: "SIPC-member broker", text: "Insured securities custody" },
]

const DEFAULT_PRICING_ITEMS = [
  "Programmatic FDIC and networked banking accounts",
  "Domestic and international wires and ACH transfers",
  "Unified reporting and operating control across all accounts",
]

const DEFAULT_FAQ: TtlFaq[] = [
  { q: "How do the money market funds work?", a: "Idle cash can be swept into government money market funds held in your fund's name at a custodian. You choose a target operating balance; anything above it is invested daily and redeemed automatically when the operating account needs it." },
  { q: "How long does it take to move money in and out of a fund or vault account?", a: "Transfers between your own accounts settle the same business day when submitted before 3pm ET. Money market redemptions are typically available the next business day." },
  { q: "How do wires work?", a: "Domestic and international wires are drafted in the dashboard, routed through the approval rules you set (amount thresholds, two-person sign-off) and released the moment the last approver signs." },
  { q: "How does the capital call line of credit work?", a: "Eligible funds can request a line secured by uncalled commitments. Draws land in the operating account and are repaid from the next capital call, all tracked in the same ledger." },
  { q: "Which partner banks do you offer vault accounts at?", a: "Vault balances are swept across a network of program banks in increments below the per-bank insurance limit. The full list is visible inside the dashboard and you can exclude any bank." },
  { q: "What FDIC coverage do I have access to?", a: "Up to $125M per fund through the sweep network: $250K at each of up to 500 program banks. Coverage applies once funds land at a program bank and is subject to standard FDIC rules." },
  { q: "Can I connect my existing bank accounts?", a: "Yes. Link existing accounts read-only for consolidated reporting, or with transfer permissions to move money in and out." },
  { q: "Is there a minimum balance requirement?", a: "No minimum balance. The annual fee covers every fund in the family." },
  { q: "Can I use Treasury for funds not domiciled in the US?", a: "Non-US entities can open accounts subject to additional review. Reach out and we'll walk through what your structure needs." },
]

const DEFAULT_RESOURCES: TtlResource[] = [
  { title: "Introducing Treasury: a product walkthrough", tag: "Product demo", art: "dashboard" },
  { title: "The state of U.S. early-stage venture: Q3", tag: "Data", art: "report" },
  { title: "The state of fund banking in 2026", tag: "Data", art: "line" },
  { title: "What happens to the typical seed-stage SPV?", tag: "Blog", art: "multi" },
]

const DEFAULT_FOOTER_COLUMNS: { title: string; links: TtlLink[] }[] = [
  { title: "Get started", links: [{ label: "Sign in" }, { label: "Sign up" }] },
  { title: "For startups", links: [{ label: "Overview" }, { label: "Equity" }, { label: "Banking" }, { label: "Payroll" }, { label: "Pricing", href: "#pricing" }] },
  { title: "For investors", links: [{ label: "Rolling funds" }, { label: "Syndicates" }, { label: "Venture funds" }, { label: "LP portal" }] },
  { title: "For fund managers", links: [{ label: "Fund admin" }, { label: "Treasury", href: "#features" }, { label: "Tax" }, { label: "Fund performance" }] },
  { title: "Resources", links: [{ label: "Blog", href: "#resources" }, { label: "Help center" }, { label: "About" }, { label: "Careers" }, { label: "Contact" }] },
]
// #endregion content

// #region logic
function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}

function easeOutCubic(t: number) {
  const c = clamp(t, 0, 1)
  return 1 - Math.pow(1 - c, 3)
}

function formatMoney(n: number, decimals = 2) {
  const neg = n < 0
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return (neg ? "-$" : "$") + s
}

/** $8.45M, $250K, $1.2B — two significant decimals at most, trailing zeros dropped. */
function formatCompact(n: number) {
  const a = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  const fmt = (v: number, unit: string) => {
    const d = v >= 100 ? 0 : v >= 10 ? 1 : 2
    return sign + "$" + parseFloat(v.toFixed(d)).toString() + unit
  }
  if (a >= 1e9) return fmt(a / 1e9, "B")
  if (a >= 1e6) return fmt(a / 1e6, "M")
  if (a >= 1e3) return fmt(a / 1e3, "K")
  return sign + "$" + Math.round(a).toString()
}

function formatStat(s: TtlStat, v: number) {
  const d = s.decimals ?? 0
  return (s.prefix ?? "") + v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) + (s.suffix ?? "")
}

/** Whole percentages that always sum to 100 (largest remainder). */
function percentages(values: number[]) {
  const total = values.reduce((a, b) => a + Math.max(0, b), 0)
  if (!total) return values.map(() => 0)
  const raw = values.map((v) => (Math.max(0, v) / total) * 100)
  const out = raw.map(Math.floor)
  let left = 100 - out.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1])
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) out[order[k][1]]++
  return out
}

/** Moves `amount` between two accounts. The total is untouched; cents are kept exact. */
function applyTransfer(accounts: TtlAccount[], t: { from: string; to: string; amount: number }) {
  const from = accounts.find((a) => a.id === t.from)
  const to = accounts.find((a) => a.id === t.to)
  if (!from || !to) return { ok: false as const, error: "Pick two accounts." }
  if (from.id === to.id) return { ok: false as const, error: "Pick two different accounts." }
  if (!(t.amount > 0)) return { ok: false as const, error: "Enter an amount." }
  const cents = Math.round(t.amount * 100)
  if (cents > Math.round(from.balance * 100)) return { ok: false as const, error: "That's more than " + from.name + " holds." }
  return {
    ok: true as const,
    accounts: accounts.map((a) =>
      a.id === from.id ? { ...a, balance: (Math.round(a.balance * 100) - cents) / 100 } : a.id === to.id ? { ...a, balance: (Math.round(a.balance * 100) + cents) / 100 } : a,
    ),
  }
}

/** How a deposit spreads over the sweep network. */
function coverageOf(deposit: number, perBank: number, limit: number) {
  const d = Math.max(0, deposit)
  const covered = Math.min(d, limit)
  return { covered, excess: d - covered, banks: Math.ceil(covered / perBank), maxBanks: Math.round(limit / perBank) }
}

/** Log-scale slider position (0..1) to a deposit, rounded to a clean step. */
function depositAt(t: number, min: number, max: number) {
  const v = min * Math.pow(max / min, clamp(t, 0, 1))
  const step = v >= 1e8 ? 1e6 : v >= 1e7 ? 5e5 : v >= 1e6 ? 5e4 : 1e4
  return clamp(Math.round(v / step) * step, min, max)
}

function positionOf(v: number, min: number, max: number) {
  return clamp(Math.log(clamp(v, min, max) / min) / Math.log(max / min), 0, 1)
}

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A deterministic walk of `n` points ending at 1, so it can be scaled to any balance. */
function series(seed: number, n: number, vol: number, drift: number) {
  const r = mulberry(seed)
  const out = [1]
  for (let i = 1; i < n; i++) out.push(out[i - 1] * (1 + drift + (r() - 0.5) * vol))
  const last = out[n - 1]
  return out.map((v) => v / last)
}

function sparkPath(values: number[], w: number, h: number, pad = 4) {
  if (values.length < 2) return { line: "", area: "" }
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, pad + (1 - (v - lo) / span) * (h - pad * 2)])
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("")
  return { line, area: line + "L" + w + " " + h + "L0 " + h + "Z" }
}

/**
 * The text split into words, each flagged when it sat inside *asterisks*. `glue` means no space follows
 * ("*Treasury*—centralized"); a dash that opens a glued word moves to the word before as its unmarked
 * `tail`, so a narrow line breaks after the dash rather than before it.
 */
function markedWords(text: string) {
  const out: { word: string; mark: boolean; br: boolean; glue: boolean; tail: string }[] = []
  let trail = false
  text.split("*").forEach((part, i) => {
    const lead = /^\S/.test(part)
    part.split("\n").forEach((line, j) => {
      if (j > 0 && out.length) out[out.length - 1].br = true
      line.split(/[ \t]+/).forEach((w, k) => {
        if (!w) return
        if (i > 0 && j === 0 && k === 0 && lead && trail && out.length) out[out.length - 1].glue = true
        out.push({ word: w, mark: i % 2 === 1, br: false, glue: false, tail: "" })
      })
    })
    if (part) trail = /\S$/.test(part)
  })
  for (let k = 0; k < out.length - 1; k++) {
    const m = out[k].glue && !out[k].tail ? out[k + 1].word.match(/^[\u2014\u2013]+/) : null
    if (!m) continue
    out[k].tail = m[0]
    out[k + 1].word = out[k + 1].word.slice(m[0].length)
    if (!out[k + 1].word) {
      out[k].glue = out[k + 1].glue
      out[k].br = out[k + 1].br
      out.splice(k + 1, 1)
    }
  }
  return out
}

/** What running each fund on its own bank stack costs a year: account fees, wire fees, a reporting tool. */
function fragmentedCost(entities: number) {
  const n = Math.max(1, Math.round(entities))
  return n * 2700 + 6000
}

function parseAmount(s: string) {
  const v = parseFloat(s.replace(/[^0-9.]/g, ""))
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0
}

/** Thousands separators as you type, keeping up to two decimals. */
function typedAmount(s: string) {
  const clean = s.replace(/[^0-9.]/g, "")
  const [int, ...rest] = clean.split(".")
  const head = (int.replace(/^0+(?=\d)/, "") || (rest.length ? "0" : "")).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return rest.length ? head + "." + rest.join("").slice(0, 2) : head
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

function resolvePalette(p?: TtlPaletteName | TtlPaletteInput): TtlPalette {
  if (!p) return PALETTES.teal
  if (typeof p === "string") return PALETTES[p] ?? PALETTES.teal
  return { ...PALETTES.teal, ...p }
}
// #endregion logic

/* ------------------------------------------------------------------ hooks */

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function useReduced() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

/** Eases every number in `target` toward its new value; lands at once under reduced motion. */
function useTween(target: number[], reduced: boolean, ms = 760) {
  const [v, setV] = React.useState(target)
  const cur = React.useRef(target)
  const key = target.join(",")
  React.useEffect(() => {
    const from = cur.current
    if (reduced || from.length !== target.length) {
      cur.current = target
      setV(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const k = easeOutCubic((now - t0) / ms)
      const next = target.map((t, i) => from[i] + (t - from[i]) * k)
      cur.current = next
      setV(next)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduced])
  return v
}

function useSeen(ref: { current: Element | null }, margin = "0px 0px -12% 0px") {
  const [seen, setSeen] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setSeen(true), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, seen, margin])
  return seen
}

/** Call a host handler: `false`, a rejection or a throw all read as failure. */
async function settle(fn: (() => unknown) | undefined, fallbackMs: number) {
  if (!fn) {
    await new Promise((r) => setTimeout(r, fallbackMs))
    return true
  }
  try {
    const res = await fn()
    return res !== false
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ marks */

function Icon({ d, size = 16, stroke = 1.6, className }: { d: string; size?: number; stroke?: number; className?: string }) {
  return (
    <svg className={"ttl-svg " + (className ?? "")} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const I = {
  check: "M5 12.5l4.2 4.2L19 7",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  down: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6L6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  network: "M12 3v4M12 17v4M3 12h4M17 12h4M12 9a3 3 0 100 6 3 3 0 000-6zM5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8",
  vault: "M4 5h16v14H4zM8 19v2M16 19v2M12 9a3 3 0 100 6 3 3 0 000-6zM12 9v1M12 14v1M9 12h1M14 12h1",
  wire: "M4 8h13l-3-3M20 16H7l3 3",
  shield: "M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z M9 12l2 2 4-4",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  swap: "M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  building: "M4 21h16M6 21V10l6-5 6 5v11M10 21v-5h4v5",
}

function VaultMark({ size = 22 }: { size?: number }) {
  return (
    <svg className="ttl-svg" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="var(--ttl-accent)" />
      <path d="M8.5 9.5h4l3.5 9 3.5-9h4L17.6 23h-3.2z" fill="var(--ttl-page)" />
      <circle cx="16" cy="9.6" r="1.6" fill="var(--ttl-gold)" />
    </svg>
  )
}

function Marked({ text, wordClass }: { text: string; wordClass?: string }) {
  const words = markedWords(text)
  return (
    <>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className={(wordClass ?? "") + (w.mark ? " ttl-gold" : "")}>{w.word}</span>
          {w.tail ? <span className={wordClass}>{w.tail}</span> : null}
          {w.br ? <br /> : w.glue || i === words.length - 1 ? null : " "}
        </React.Fragment>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ nav */

function Nav({ brand, logo, nav, go, scrolled }: { brand: string; logo?: React.ReactNode; nav: TtlNav; go: (href?: string) => (e: React.MouseEvent) => void; scrolled: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [sheet, setSheet] = React.useState(false)
  const boxRef = React.useRef(null as HTMLDivElement | null)
  React.useEffect(() => {
    if (!open && !sheet) return
    const away = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSheet(false)
      }
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        setSheet(false)
      }
    }
    document.addEventListener("pointerdown", away)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("pointerdown", away)
      document.removeEventListener("keydown", esc)
    }
  }, [open, sheet])
  const close = (href?: string) => (e: React.MouseEvent) => {
    setOpen(false)
    setSheet(false)
    go(href)(e)
  }
  const products = nav.products ?? []
  return (
    <header className="ttl-nav" data-scrolled={scrolled || undefined}>
      <div className="ttl-nav-in" ref={boxRef}>
        <a href="#" className="ttl-brand" onClick={close("#top")}>
          {logo ?? <VaultMark />}
          <span>{brand}</span>
        </a>
        <nav className="ttl-nav-links" aria-label="Primary">
          {products.length ? (
            <div className="ttl-prod" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
              <button type="button" className="ttl-nav-link" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
                Products <Icon d={I.down} size={13} className="ttl-caret" />
              </button>
              <div className="ttl-prod-panel" data-open={open || undefined}>
                {products.map((p, i) => (
                  <a key={p.label} href={p.href ?? "#"} className="ttl-prod-item" onClick={close(p.href)} tabIndex={open ? 0 : -1}>
                    <span className="ttl-prod-ic">
                      <Icon d={[I.grid, I.vault, I.swap][i % 3]} size={17} />
                    </span>
                    <span>
                      <b>{p.label}</b>
                      <small>{p.text}</small>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          {(nav.links ?? []).map((l) => (
            <a key={l.label} href={l.href ?? "#"} className="ttl-nav-link" onClick={close(l.href)}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ttl-nav-end">
          {nav.login ? (
            <a href={nav.login.href ?? "#"} className="ttl-nav-link ttl-hide-sm" onClick={close(nav.login.href)}>
              {nav.login.label}
            </a>
          ) : null}
          {nav.cta ? (
            <a href={nav.cta.href ?? "#"} className="ttl-btn ttl-btn-dark ttl-btn-sm" onClick={close(nav.cta.href)}>
              {nav.cta.label}
            </a>
          ) : null}
          <button type="button" className="ttl-burger" aria-label={sheet ? "Close menu" : "Open menu"} aria-expanded={sheet} onClick={() => setSheet((s) => !s)}>
            <Icon d={sheet ? I.close : I.menu} size={18} />
          </button>
        </div>
        <div className="ttl-sheet" data-open={sheet || undefined}>
          {[...products.map((p) => ({ label: p.label, href: p.href })), ...(nav.links ?? []), ...(nav.login ? [nav.login] : [])].map((l) => (
            <a key={l.label} href={l.href ?? "#"} onClick={close(l.href)} tabIndex={sheet ? 0 : -1}>
              {l.label}
              <Icon d={I.arrow} size={15} />
            </a>
          ))}
        </div>
      </div>
      <span className="ttl-progress" aria-hidden="true" />
    </header>
  )
}

/* ------------------------------------------------------------------ dashboard */

type View = "overview" | "move" | "activity"
type Step = "edit" | "review" | "sending" | "done" | "error"

const RANGES = [
  { label: "1M", seed: 11, vol: 0.022, drift: 0.0018, delta: "+2.4%" },
  { label: "3M", seed: 29, vol: 0.04, drift: 0.004, delta: "+7.9%" },
  { label: "1Y", seed: 53, vol: 0.06, drift: 0.011, delta: "+31.2%" },
]
const RANGE_SERIES = RANGES.map((r) => series(r.seed, 36, r.vol, r.drift))

function Dashboard(props: {
  brand: string
  fund: string
  accounts: TtlAccount[]
  activity: TtlActivity[]
  colors: string[]
  reduced: boolean
  onConfirm: (t: TtlTransfer) => Promise<boolean>
}) {
  const { accounts, activity, colors, reduced } = props
  const [view, setView] = React.useState("overview" as View)
  const [range, setRange] = React.useState(0)
  const [focus, setFocus] = React.useState("" as string)
  const [from, setFrom] = React.useState(accounts[1]?.id ?? accounts[0]?.id ?? "")
  const [to, setTo] = React.useState(accounts[0]?.id ?? "")
  const [amount, setAmount] = React.useState("")
  const [memo, setMemo] = React.useState("")
  const [step, setStep] = React.useState("edit" as Step)
  const [err, setErr] = React.useState("")
  const [filter, setFilter] = React.useState("all" as "all" | "in" | "out")
  const [tip, setTip] = React.useState(-1)

  const total = accounts.reduce((a, b) => a + b.balance, 0)
  const eased = useTween([total, ...accounts.map((a) => a.balance)], reduced, 900)
  const shares = percentages(accounts.map((a) => a.balance))
  const widths = useTween(accounts.map((a) => (total ? (a.balance / total) * 100 : 0)), reduced, 900)
  const spark = useTween(RANGE_SERIES[range], reduced, 700)
  const path = sparkPath(spark, 300, 84)
  const gid = React.useId().replace(/:/g, "")
  const amt = parseAmount(amount)
  const fromAcc = accounts.find((a) => a.id === from)
  const toAcc = accounts.find((a) => a.id === to)

  const startMove = (id?: string) => {
    if (id) {
      setFrom(id)
      if (id === to) setTo(accounts.find((a) => a.id !== id)?.id ?? "")
    }
    setStep("edit")
    setErr("")
    setView("move")
  }
  const review = (e: React.FormEvent) => {
    e.preventDefault()
    const res = applyTransfer(accounts, { from, to, amount: amt })
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setErr("")
    setStep("review")
  }
  const confirm = async () => {
    setStep("sending")
    const ok = await props.onConfirm({ from, to, amount: amt, memo: memo.trim() })
    setStep(ok ? "done" : "error")
  }
  const reset = () => {
    setAmount("")
    setMemo("")
    setStep("edit")
  }
  const swap = () => {
    setFrom(to)
    setTo(from)
  }
  const list = activity.filter((a) => (filter === "all" ? true : filter === "in" ? a.amount > 0 : a.amount < 0))
  const navItems: { id: View; label: string; d: string }[] = [
    { id: "overview", label: "Overview", d: I.grid },
    { id: "move", label: "Move money", d: I.swap },
    { id: "activity", label: "Activity", d: I.list },
  ]

  return (
    <div className="ttl-dash">
      <aside className="ttl-side">
        <div className="ttl-side-brand">
          <VaultMark size={18} />
          <span>{props.brand} Treasury</span>
        </div>
        <div className="ttl-side-label">Treasury</div>
        {navItems.map((n) => (
          <button key={n.id} type="button" className="ttl-side-item" data-on={view === n.id || undefined} onClick={() => (n.id === "move" ? startMove() : setView(n.id))}>
            <Icon d={n.d} size={14} />
            {n.label}
          </button>
        ))}
        <div className="ttl-side-label">Accounts</div>
        {accounts.map((a, i) => (
          <button
            key={a.id}
            type="button"
            className="ttl-side-acc"
            data-on={(view === "overview" && focus === a.id) || undefined}
            onClick={() => {
              setView("overview")
              setFocus((f) => (f === a.id ? "" : a.id))
            }}
          >
            <i style={{ background: colors[i % colors.length] }} />
            <span>{a.name}</span>
            <small>{formatCompact(eased[i + 1] ?? a.balance)}</small>
          </button>
        ))}
        <div className="ttl-side-foot">
          <Icon d={I.doc} size={14} /> Statements
        </div>
      </aside>

      <div className="ttl-main">
        <div className="ttl-crumbs">
          <span>Treasury</span>
          <span aria-hidden="true">/</span>
          <b>{props.fund}</b>
          <span className="ttl-live">
            <i /> Live
          </span>
        </div>
        <div className="ttl-tabs-sm" role="tablist" aria-label="Dashboard views">
          {navItems.map((n) => (
            <button key={n.id} type="button" role="tab" aria-selected={view === n.id} onClick={() => (n.id === "move" ? startMove() : setView(n.id))}>
              {n.label}
            </button>
          ))}
        </div>

        <div className="ttl-view" key={view}>
          {view === "overview" ? (
            <>
              <div className="ttl-ov-head">
                <div>
                  <h3 className="ttl-h3">Overview</h3>
                  <div className="ttl-k">Total balance</div>
                  <div className="ttl-total">{formatMoney(eased[0])}</div>
                  <div className="ttl-delta">
                    <span>{RANGES[range].delta}</span> past {RANGES[range].label === "1Y" ? "year" : RANGES[range].label === "3M" ? "quarter" : "month"}
                  </div>
                </div>
                <div className="ttl-spark">
                  <div className="ttl-seg" role="tablist" aria-label="Range">
                    {RANGES.map((r, i) => (
                      <button key={r.label} type="button" role="tab" aria-selected={range === i} onClick={() => setRange(i)}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <svg className="ttl-svg ttl-spark-svg" viewBox="0 0 300 84" width="300" height="84" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id={gid + "a"} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="var(--ttl-gold)" stopOpacity="0.28" />
                        <stop offset="1" stopColor="var(--ttl-gold)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={path.area} fill={"url(#" + gid + "a)"} />
                    <path d={path.line} fill="none" stroke="var(--ttl-gold)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>
              <div className="ttl-accs">
                {accounts.map((a, i) => (
                  <button key={a.id} type="button" className="ttl-acc" data-on={focus === a.id || undefined} data-dim={(focus && focus !== a.id) || undefined} onClick={() => startMove(a.id)} aria-label={"Move money from " + a.name}>
                    <span className="ttl-acc-top">
                      <i style={{ background: colors[i % colors.length] }} />
                      {a.name}
                      <Icon d={I.arrow} size={13} className="ttl-acc-go" />
                    </span>
                    <span className="ttl-acc-bal">{formatMoney(eased[i + 1] ?? a.balance)}</span>
                    <span className="ttl-acc-kind">{a.kind}</span>
                  </button>
                ))}
              </div>
              <div className="ttl-recent">
                <div className="ttl-recent-head">
                  <b>Recent activity</b>
                  <button type="button" className="ttl-link" onClick={() => setView("activity")}>
                    View all
                  </button>
                </div>
                {activity.slice(0, 3).map((a) => (
                  <div key={a.id} className="ttl-recent-row">
                    <span className="ttl-led-date">{a.date}</span>
                    <span className="ttl-recent-text">{a.text}</span>
                    <span className="ttl-led-amt" data-in={a.amount > 0 || undefined}>
                      {(a.amount > 0 ? "+" : "") + formatMoney(a.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="ttl-break">
                <div className="ttl-break-head">
                  <b>Cash breakdown</b>
                  <span>Balances held across accounts</span>
                </div>
                <div className="ttl-bar" onMouseLeave={() => setTip(-1)}>
                  {accounts.map((a, i) => (
                    <span
                      key={a.id}
                      tabIndex={0}
                      onMouseEnter={() => setTip(i)}
                      onFocus={() => setTip(i)}
                      onBlur={() => setTip(-1)}
                      data-dim={(focus && focus !== a.id) || undefined}
                      style={{ width: widths[i] + "%", background: colors[i % colors.length] }}
                      aria-label={a.name + " " + shares[i] + "%"}
                    />
                  ))}
                  {tip >= 0 && accounts[tip] ? (
                    <em className="ttl-tip" style={{ left: clamp(widths.slice(0, tip).reduce((x, y) => x + y, 0) + widths[tip] / 2, 12, 88) + "%" }}>
                      {accounts[tip].name} · {formatCompact(accounts[tip].balance)}
                    </em>
                  ) : null}
                </div>
                <div className="ttl-legend">
                  {accounts.map((a, i) => (
                    <span key={a.id}>
                      <i style={{ background: colors[i % colors.length] }} />
                      {shares[i]}% {a.name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : view === "move" ? (
            <div className="ttl-move">
              <h3 className="ttl-h3">Move money</h3>
              {step === "edit" || step === "error" ? (
                <form className="ttl-form" onSubmit={review} noValidate>
                  <div className="ttl-pick">
                    <div className="ttl-pick-col">
                      <div className="ttl-k">From</div>
                      {accounts.map((a) => (
                        <button key={a.id} type="button" className="ttl-pill" aria-pressed={from === a.id} onClick={() => (a.id === to ? swap() : setFrom(a.id))}>
                          {a.name}
                          <small>{formatCompact(a.balance)}</small>
                        </button>
                      ))}
                    </div>
                    <button type="button" className="ttl-swap" onClick={swap} aria-label="Swap accounts">
                      <Icon d={I.swap} size={15} />
                    </button>
                    <div className="ttl-pick-col">
                      <div className="ttl-k">To</div>
                      {accounts.map((a) => (
                        <button key={a.id} type="button" className="ttl-pill" aria-pressed={to === a.id} onClick={() => (a.id === from ? swap() : setTo(a.id))}>
                          {a.name}
                          <small>{formatCompact(a.balance)}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="ttl-field">
                    <span className="ttl-k">Amount</span>
                    <span className="ttl-amt">
                      <b>$</b>
                      <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(typedAmount(e.target.value))} aria-invalid={!!err || undefined} />
                    </span>
                  </label>
                  <div className="ttl-chips">
                    {[250000, 1000000, 5000000].map((v) => (
                      <button key={v} type="button" onClick={() => setAmount(typedAmount(String(v)))}>
                        {formatCompact(v)}
                      </button>
                    ))}
                    <button type="button" onClick={() => fromAcc && setAmount(typedAmount(fromAcc.balance.toFixed(2)))}>
                      Max
                    </button>
                  </div>
                  <input className="ttl-memo" placeholder="Memo (optional)" value={memo} maxLength={60} onChange={(e) => setMemo(e.target.value)} />
                  {err || step === "error" ? (
                    <p className="ttl-err" role="alert">
                      {err || "The transfer didn't go through. Try again."}
                    </p>
                  ) : null}
                  <button type="submit" className="ttl-btn ttl-btn-dark">
                    Review transfer <Icon d={I.arrow} size={15} />
                  </button>
                </form>
              ) : (
                <div className="ttl-review" aria-live="polite">
                  <div className="ttl-route">
                    <span>{fromAcc?.name}</span>
                    <svg className="ttl-svg ttl-route-line" width="80" height="12" viewBox="0 0 80 12" aria-hidden="true">
                      <path d="M2 6h74M70 1l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <span>{toAcc?.name}</span>
                  </div>
                  <div className="ttl-review-amt">{formatMoney(amt)}</div>
                  <dl className="ttl-dl">
                    <div>
                      <dt>Arrives</dt>
                      <dd>Today, before 5pm ET</dd>
                    </div>
                    <div>
                      <dt>{fromAcc?.name} after</dt>
                      <dd>{fromAcc ? formatMoney(fromAcc.balance - (step === "done" ? 0 : amt)) : ""}</dd>
                    </div>
                    {memo.trim() ? (
                      <div>
                        <dt>Memo</dt>
                        <dd>{memo.trim()}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {step === "done" ? (
                    <div className="ttl-done">
                      <span className="ttl-done-ic">
                        <Icon d={I.check} size={16} stroke={2.2} />
                      </span>
                      Transfer complete
                      <button type="button" className="ttl-link" onClick={reset}>
                        New transfer
                      </button>
                      <button type="button" className="ttl-link" onClick={() => setView("overview")}>
                        See balances
                      </button>
                    </div>
                  ) : (
                    <div className="ttl-row">
                      <button type="button" className="ttl-btn ttl-btn-ghost" onClick={() => setStep("edit")} disabled={step === "sending"}>
                        Edit
                      </button>
                      <button type="button" className="ttl-btn ttl-btn-dark" onClick={confirm} disabled={step === "sending"} data-busy={step === "sending" || undefined}>
                        {step === "sending" ? "Sending…" : "Confirm transfer"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="ttl-act">
              <div className="ttl-act-head">
                <h3 className="ttl-h3">Activity</h3>
                <div className="ttl-seg" role="tablist" aria-label="Filter">
                  {(["all", "in", "out"] as const).map((f) => (
                    <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>
                      {f === "all" ? "All" : f === "in" ? "Incoming" : "Outgoing"}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="ttl-ledger">
                {list.map((a) => (
                  <li key={a.id}>
                    <span className="ttl-led-date">{a.date}</span>
                    <span className="ttl-led-text">
                      {a.text}
                      <small>{a.account}</small>
                    </span>
                    <span className="ttl-led-status" data-s={a.status}>
                      {a.status}
                    </span>
                    <span className="ttl-led-amt" data-in={a.amount > 0 || undefined}>
                      {(a.amount > 0 ? "+" : "") + formatMoney(a.amount)}
                    </span>
                  </li>
                ))}
                {!list.length ? <li className="ttl-led-empty">Nothing here yet.</li> : null}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FlowCard({ title, amount, note, from, to, flash }: { title: string; amount: number; note?: string; from: string; to: string; flash?: number }) {
  return (
    <div className="ttl-flow" key={flash}>
      <div className="ttl-flow-top">
        <span>{title}</span>
        <b>{formatMoney(amount, 0)}</b>
        {note ? <em>{note}</em> : null}
      </div>
      <div className="ttl-flow-row">
        <span className="ttl-flow-chip">
          <i />
          {from}
        </span>
        <svg className="ttl-svg ttl-flow-arrow" width="44" height="10" viewBox="0 0 44 10" aria-hidden="true">
          <path d="M1 5h38" />
          <path d="M35 1l4 4-4 4" />
        </svg>
        <span className="ttl-flow-chip ttl-flow-chip-b">
          <i />
          {to}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ feature scenes */

const SETUP_ITEMS = ["Treasury vault account", "FDIC-insured operating account", "Money market fund account", "Link existing accounts"]

function SceneSetup({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [done, setDone] = React.useState(reduced ? SETUP_ITEMS.length : 0)
  const [run, setRun] = React.useState(0)
  const [off, setOff] = React.useState([] as number[])
  React.useEffect(() => {
    if (!active) return
    if (reduced) {
      setDone(SETUP_ITEMS.length)
      return
    }
    setDone(0)
    setOff([])
    const ts = SETUP_ITEMS.map((_, i) => setTimeout(() => setDone(i + 1), 520 + i * 560))
    return () => ts.forEach(clearTimeout)
  }, [active, run, reduced])
  const ready = SETUP_ITEMS.filter((_, i) => i < done && !off.includes(i)).length
  return (
    <div className="ttl-scene ttl-scene-setup">
      <div className="ttl-setup-card">
        <div className="ttl-setup-head">
          <span>
            <b>New fund</b>
            <small>Vaultline Fund III, L.P.</small>
          </span>
          <button type="button" className="ttl-btn ttl-btn-dark ttl-btn-sm" onClick={() => setRun((r) => r + 1)}>
            Add accounts <Icon d={I.plus} size={14} />
          </button>
        </div>
        <ul className="ttl-setup-list">
          {SETUP_ITEMS.map((t, i) => {
            const on = i < done && !off.includes(i)
            return (
              <li key={t}>
                <button type="button" data-on={on || undefined} data-last={i === SETUP_ITEMS.length - 1 || undefined} onClick={() => (i < done ? setOff((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i])) : setDone(i + 1))}>
                  <span className="ttl-setup-ic">{i === 0 ? <Icon d={I.vault} size={15} /> : i === 1 ? <Icon d={I.shield} size={15} /> : i === 2 ? <Icon d={I.network} size={15} /> : <Icon d={I.swap} size={15} />}</span>
                  {t}
                  <span className="ttl-tick">
                    <Icon d={I.check} size={13} stroke={2.4} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="ttl-setup-foot">
          <span>
            {ready} of {SETUP_ITEMS.length} ready
          </span>
          <span className="ttl-meter">
            <i style={{ width: (ready / SETUP_ITEMS.length) * 100 + "%" }} />
          </span>
          <span>{ready === SETUP_ITEMS.length ? "4m 12s" : "…"}</span>
        </div>
        <svg className="ttl-svg ttl-cursor" data-at={done >= SETUP_ITEMS.length - 1 ? "last" : undefined} data-click={done >= SETUP_ITEMS.length || undefined} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 3l14 7.5-6.2 1.6L10 18.5z" fill="var(--ttl-ink)" stroke="var(--ttl-paper)" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

function ScenePhone({ active, operating }: { active: boolean; operating: number }) {
  const [sheet, setSheet] = React.useState(false)
  const [amt, setAmt] = React.useState(5)
  const [state, setState] = React.useState("idle" as "idle" | "sending" | "sent")
  React.useEffect(() => {
    if (!active) setSheet(false)
  }, [active])
  const send = () => {
    setState("sending")
    setTimeout(() => setState("sent"), 900)
  }
  return (
    <div className="ttl-scene ttl-scene-phone">
      <span className="ttl-bokeh" aria-hidden="true" />
      <div className="ttl-chipfloat ttl-chipfloat-a" aria-hidden="true">
        <Icon d={I.check} size={12} stroke={2.4} /> Wire released · $2.15M
      </div>
      <div className="ttl-chipfloat ttl-chipfloat-b" aria-hidden="true">
        Capital call due · Nov 3
      </div>
      <div className="ttl-phone">
        <div className="ttl-phone-screen">
          <div className="ttl-phone-status">
            <span>9:41</span>
            <i />
          </div>
          <div className="ttl-phone-k">Operating funds</div>
          <div className="ttl-phone-bal">{formatCompact(operating)}</div>
          <svg className="ttl-svg ttl-phone-chart" viewBox="0 0 180 48" width="180" height="48" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 40 C20 36 28 30 44 31 S70 18 88 22 118 8 136 12 164 4 180 6" fill="none" stroke="var(--ttl-gold)" strokeWidth="1.8" />
          </svg>
          <div className="ttl-phone-card">
            <span>Credit available</span>
            <b>$25,000,000</b>
          </div>
          <button type="button" className="ttl-phone-btn" onClick={() => setSheet(true)}>
            {state === "sent" ? "Request sent ✓" : "Request a line of credit"}
          </button>
          <div className="ttl-phone-sheet" data-open={sheet || undefined}>
            <div className="ttl-phone-grip" />
            {state === "sent" ? (
              <div className="ttl-phone-sent">
                <span className="ttl-done-ic">
                  <Icon d={I.check} size={16} stroke={2.4} />
                </span>
                <b>${amt}M requested</b>
                <small>Decision within 2 business days</small>
                <button type="button" onClick={() => setSheet(false)}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <b>Capital call line</b>
                <div className="ttl-phone-amt">${amt},000,000</div>
                <input type="range" min={1} max={25} value={amt} onChange={(e) => setAmt(+e.target.value)} aria-label="Line amount, millions" className="ttl-range" style={{ "--ttl-fill": ((amt - 1) / 24) * 100 + "%" } as React.CSSProperties} tabIndex={sheet ? 0 : -1} />
                <button type="button" onClick={send} disabled={state === "sending"} tabIndex={sheet ? 0 : -1}>
                  {state === "sending" ? "Submitting…" : "Submit request"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const FUNDS = [
  { name: "Fund I", share: 0.46 },
  { name: "Fund II", share: 0.37 },
  { name: "SPVs", share: 0.17 },
]

function SceneReport({ active, accounts, colors, reduced }: { active: boolean; accounts: TtlAccount[]; colors: string[]; reduced: boolean }) {
  const [by, setBy] = React.useState("accounts" as "accounts" | "funds")
  const total = accounts.reduce((a, b) => a + b.balance, 0)
  const parts = by === "accounts" ? accounts.map((a) => ({ name: a.name, v: a.balance })) : FUNDS.map((f) => ({ name: f.name, v: total * f.share }))
  const target = parts.map((p) => (active && total ? (p.v / total) * 100 : 0))
  while (target.length < 3) target.push(0)
  const w = useTween(target.slice(0, 3), reduced, 1000)
  const t = useTween([active ? total : 0], reduced, 1400)
  const pct = percentages(parts.map((p) => p.v))
  return (
    <div className="ttl-scene ttl-scene-report">
      <div className="ttl-rep-card ttl-rep-back" aria-hidden="true" />
      <div className="ttl-rep-card">
        <div className="ttl-rep-head">
          <b>Overview</b>
          <div className="ttl-seg" role="tablist" aria-label="Group by">
            <button type="button" role="tab" aria-selected={by === "accounts"} onClick={() => setBy("accounts")}>
              Accounts
            </button>
            <button type="button" role="tab" aria-selected={by === "funds"} onClick={() => setBy("funds")}>
              Funds
            </button>
          </div>
        </div>
        <div className="ttl-k">Total balance</div>
        <div className="ttl-rep-total">{formatMoney(t[0])}</div>
        <div className="ttl-rep-row">
          {parts.slice(0, 3).map((p, i) => (
            <div key={p.name}>
              <span>
                <i style={{ background: colors[i % colors.length] }} />
                {p.name}
              </span>
              <b>{formatCompact(p.v)}</b>
            </div>
          ))}
        </div>
        <div className="ttl-break-head">
          <b>Cash breakdown</b>
          <span>{by === "accounts" ? "By account" : "By fund"}</span>
        </div>
        <div className="ttl-bar ttl-bar-lg">
          {parts.slice(0, 3).map((p, i) => (
            <span key={p.name} style={{ width: w[i] + "%", background: colors[i % colors.length] }} />
          ))}
        </div>
        <div className="ttl-legend">
          {parts.slice(0, 3).map((p, i) => (
            <span key={p.name}>
              <i style={{ background: colors[i % colors.length] }} />
              {pct[i]}% {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Scene({ i, active, reduced, accounts, colors }: { i: number; active: boolean; reduced: boolean; accounts: TtlAccount[]; colors: string[] }) {
  const k = i % 3
  if (k === 0) return <SceneSetup active={active} reduced={reduced} />
  if (k === 1) return <ScenePhone active={active} operating={accounts[0]?.balance ?? 0} />
  return <SceneReport active={active} accounts={accounts} colors={colors} reduced={reduced} />
}

/* ------------------------------------------------------------------ coverage */

const DOTS = 500

function Coverage({ title, limit, perBank, items, reduced }: { title: string; limit: number; perBank: number; items: TtlCoverageItem[]; reduced: boolean }) {
  const min = perBank
  const max = limit * 2
  const [deposit, setDeposit] = React.useState(clamp(40e6, min, max))
  const ref = React.useRef(null as HTMLDivElement | null)
  const seen = useSeen(ref)
  const c = coverageOf(seen ? deposit : 0, perBank, limit)
  const lit = Math.round((c.covered / limit) * DOTS)
  const shown = useTween([c.covered, c.banks, c.excess], reduced, 700)
  const pos = positionOf(deposit, min, max)
  return (
    <section className="ttl-sec ttl-cov" data-sec="coverage">
      <div className="ttl-wrap">
        <h2 className="ttl-h2 ttl-cov-title" data-ttl-rise>
          <Marked text={title} />
        </h2>
        <div className="ttl-cov-items">
          {items.map((it, i) => (
            <div key={it.title} className="ttl-cov-item" data-ttl-rise>
              <span className="ttl-cov-ic">
                <Icon d={[I.network, I.vault, I.wire, I.shield][i % 4]} size={20} stroke={1.4} />
              </span>
              <b>{it.title}</b>
              <small>{it.text}</small>
            </div>
          ))}
        </div>
        <div className="ttl-cov-calc" ref={ref} data-ttl-rise>
          <div className="ttl-cov-ctl">
            <div className="ttl-k">Deposits in one fund</div>
            <div className="ttl-cov-dep">{formatCompact(deposit)}</div>
            <input
              type="range"
              className="ttl-range ttl-range-lg"
              min={0}
              max={1000}
              value={Math.round(pos * 1000)}
              onChange={(e) => setDeposit(depositAt(+e.target.value / 1000, min, max))}
              aria-label="Deposits"
              aria-valuetext={formatCompact(deposit)}
              style={{ "--ttl-fill": pos * 100 + "%" } as React.CSSProperties}
            />
            <div className="ttl-cov-scale">
              <span>{formatCompact(min)}</span>
              <span>{formatCompact(max)}</span>
            </div>
            <dl className="ttl-cov-out">
              <div>
                <dt>FDIC-insured</dt>
                <dd>{formatCompact(shown[0])}</dd>
              </div>
              <div>
                <dt>Program banks</dt>
                <dd>{Math.round(shown[1])}</dd>
              </div>
              <div data-over={c.excess > 0 || undefined}>
                <dt>Above the limit</dt>
                <dd>{formatCompact(shown[2])}</dd>
              </div>
            </dl>
            <p className="ttl-fine">{c.excess > 0 ? "Anything above " + formatCompact(limit) + " can sit in government money market funds, held in the fund's name." : formatCompact(perBank) + " at each bank, never above the per-bank limit."}</p>
          </div>
          <div className="ttl-dots-wrap">
            <div className="ttl-dots" role="img" aria-label={lit + " of " + DOTS + " coverage units in use"}>
              {Array.from({ length: DOTS }, (_, i) => (
                <i key={i} data-on={i < lit || undefined} style={{ transitionDelay: reduced ? "0ms" : Math.min(i, 400) * 1.4 + "ms" }} />
              ))}
            </div>
            <p className="ttl-fine">
              Each dot is {DOTS === c.maxBanks ? "one program bank" : formatCompact(limit / DOTS) + " of coverage"}, insured up to {formatCompact(perBank)} a bank.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ pricing */

function Pricing({ p, reduced }: { p: NonNullable<TealTreasuryLandingProps["pricing"]>; reduced: boolean }) {
  const [addon, setAddon] = React.useState(false)
  const [n, setN] = React.useState(6)
  const annual = p.annual === undefined ? 5000 : p.annual
  const frag = fragmentedCost(n)
  const bars = useTween([frag, annual ?? 0], reduced, 600)
  const top = Math.max(frag, annual ?? 0)
  return (
    <section className="ttl-sec ttl-price" data-sec="pricing">
      <span className="ttl-price-glow" aria-hidden="true" />
      <div className="ttl-wrap ttl-split">
        <div className="ttl-label">{p.label ?? "Pricing"}</div>
        <div>
          <h2 className="ttl-price-big" data-ttl-rise>
            <span>{p.price ?? "$5k"}</span> {p.unit ?? "annual fee"}
          </h2>
          <p className="ttl-price-intro" data-ttl-rise>
            {p.intro ?? "One annual all-in fee that includes:"}
          </p>
          <ul className="ttl-price-list">
            {(p.items ?? DEFAULT_PRICING_ITEMS).map((t) => (
              <li key={t} data-ttl-rise>
                <svg className="ttl-svg ttl-price-check" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={I.check} />
                </svg>
                {t}
              </li>
            ))}
            {p.addon ? (
              <li data-ttl-rise className="ttl-price-addon">
                <button type="button" aria-expanded={addon} onClick={() => setAddon((a) => !a)}>
                  <span className="ttl-plus" data-open={addon || undefined}>
                    <Icon d={I.plus} size={16} />
                  </span>
                  {p.addon.title}
                </button>
                <div className="ttl-collapse" data-open={addon || undefined}>
                  <div>
                    <p>{p.addon.text}</p>
                  </div>
                </div>
              </li>
            ) : null}
          </ul>
          {annual !== null ? (
            <div className="ttl-compare" data-ttl-rise>
              <div className="ttl-compare-head">
                <span>Funds and entities</span>
                <div className="ttl-step">
                  <button type="button" onClick={() => setN((v) => Math.max(1, v - 1))} aria-label="Fewer">
                    −
                  </button>
                  <output aria-live="polite">{n}</output>
                  <button type="button" onClick={() => setN((v) => Math.min(40, v + 1))} aria-label="More">
                    +
                  </button>
                </div>
              </div>
              <div className="ttl-cbar">
                <span>A bank per entity</span>
                <i style={{ width: (bars[0] / top) * 100 + "%" }} />
                <b>{formatMoney(bars[0], 0)}/yr</b>
              </div>
              <div className="ttl-cbar ttl-cbar-us">
                <span>One treasury</span>
                <i style={{ width: (bars[1] / top) * 100 + "%" }} />
                <b>{formatMoney(bars[1], 0)}/yr</b>
              </div>
              <p className="ttl-fine">Illustrative: account fees, wire fees and a reporting tool for each entity, against one flat fee.</p>
            </div>
          ) : null}
          {p.note !== "" ? <p className="ttl-fine ttl-price-note">{p.note ?? "Pricing is per fund family. Premium features are quoted before you opt in."}</p> : null}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ faq */

function Faq({ f }: { f: NonNullable<TealTreasuryLandingProps["faq"]> }) {
  const [open, setOpen] = React.useState(-1)
  const items = f.items ?? DEFAULT_FAQ
  const contact = f.contact ?? "treasury@vaultline.example"
  return (
    <section className="ttl-sec ttl-faq" data-sec="faq">
      <div className="ttl-wrap ttl-split">
        <div className="ttl-label">{f.label ?? "FAQ"}</div>
        <div>
          <h2 className="ttl-h2 ttl-faq-title" data-ttl-rise>
            <Marked text={f.title ?? "Everything you\nneed to know"} />
          </h2>
          <ul className="ttl-faq-list">
            {items.map((it, i) => (
              <li key={it.q} data-ttl-rise>
                <button type="button" aria-expanded={open === i} onClick={() => setOpen((o) => (o === i ? -1 : i))}>
                  <span>{it.q}</span>
                  <span className="ttl-plus" data-open={open === i || undefined}>
                    <Icon d={I.plus} size={16} />
                  </span>
                </button>
                <div className="ttl-collapse" data-open={open === i || undefined}>
                  <div>
                    <p>{it.a}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {contact ? (
            <p className="ttl-fine ttl-faq-more">
              For any other questions, reach out to <a href={"mailto:" + contact}>{contact}</a>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ cta */

function Cta({ c, brand, onGetStarted, openSignal, reduced, go }: { c: NonNullable<TealTreasuryLandingProps["cta"]>; brand: string; onGetStarted?: (email: string) => unknown; openSignal: number; reduced: boolean; go: (href?: string) => (e: React.MouseEvent) => void }) {
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState("idle" as "idle" | "sending" | "done" | "error" | "invalid")
  const inputRef = React.useRef(null as HTMLInputElement | null)
  const cardRef = React.useRef(null as HTMLDivElement | null)
  React.useEffect(() => {
    if (!openSignal) return
    setOpen(true)
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), reduced ? 0 : 650)
    return () => clearTimeout(t)
  }, [openSignal, reduced])
  React.useEffect(() => {
    const card = cardRef.current
    if (!card || reduced) return
    const blobs = Array.from(card.querySelectorAll(".ttl-blob")) as HTMLElement[]
    const movers = blobs.map((b, i) => ({
      x: gsap.quickTo(b, "x", { duration: 1.4 + i * 0.5, ease: "power3.out" }),
      y: gsap.quickTo(b, "y", { duration: 1.4 + i * 0.5, ease: "power3.out" }),
    }))
    const move = (e: PointerEvent) => {
      const r = card.getBoundingClientRect()
      const dx = e.clientX - r.left - r.width / 2
      const dy = e.clientY - r.top - r.height / 2
      movers.forEach((m, i) => {
        const k = [0.35, -0.25, 0.18][i] ?? 0.2
        m.x(dx * k)
        m.y(dy * k)
      })
    }
    card.addEventListener("pointermove", move)
    return () => {
      card.removeEventListener("pointermove", move)
      blobs.forEach((b) => gsap.killTweensOf(b))
    }
  }, [reduced])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!open) {
      setOpen(true)
      setTimeout(() => inputRef.current?.focus(), reduced ? 0 : 420)
      return
    }
    if (!isEmail(email)) {
      setState("invalid")
      inputRef.current?.focus()
      return
    }
    setState("sending")
    const ok = await settle(onGetStarted ? () => onGetStarted(email.trim()) : undefined, 900)
    setState(ok ? "done" : "error")
  }
  return (
    <section className="ttl-sec ttl-cta-sec" data-sec="get-started">
      <div className="ttl-wrap">
        <div className="ttl-cta" ref={cardRef}>
          <span className="ttl-blob ttl-blob-a" aria-hidden="true" />
          <span className="ttl-blob ttl-blob-b" aria-hidden="true" />
          <span className="ttl-blob ttl-blob-c" aria-hidden="true" />
          <span className="ttl-grain" aria-hidden="true" />
          <div className="ttl-cta-in">
            <h2 className="ttl-h2">
              <Marked text={c.title ?? "Ready to experience\n" + brand + " Treasury?"} />
            </h2>
            <p>{c.text ?? "Get started in less than five minutes. Flexible, secure and streamlined banking for every fund you manage."}</p>
            {state === "done" ? (
              <div className="ttl-cta-done" role="status">
                <span className="ttl-done-ic">
                  <Icon d={I.check} size={16} stroke={2.4} />
                </span>
                Check {email.trim()} for your setup link.
              </div>
            ) : (
              <form className="ttl-cta-row" onSubmit={submit} noValidate>
                <div className="ttl-morph" data-open={open || undefined} data-bad={state === "invalid" || state === "error" || undefined}>
                  <input
                    ref={inputRef}
                    type="email"
                    placeholder="you@fund.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (state !== "sending") setState("idle")
                    }}
                    tabIndex={open ? 0 : -1}
                    aria-label="Work email"
                    aria-invalid={state === "invalid" || undefined}
                  />
                  <button type="submit" disabled={state === "sending"}>
                    <span className="ttl-morph-label">{c.button ?? "Get started"}</span>
                    <span className="ttl-morph-go">{state === "sending" ? <span className="ttl-spin" /> : <Icon d={I.arrow} size={16} />}</span>
                  </button>
                </div>
                {c.secondary !== undefined ? (
                  <a className="ttl-btn ttl-btn-glass" href={c.secondary.href ?? "#"} onClick={go(c.secondary.href)}>
                    {c.secondary.label}
                  </a>
                ) : (
                  <a className="ttl-btn ttl-btn-glass" href="#faq" onClick={go("#faq")}>
                    Contact sales
                  </a>
                )}
              </form>
            )}
            {state === "invalid" ? (
              <p className="ttl-err" role="alert">
                Enter a work email like name@fund.com.
              </p>
            ) : state === "error" ? (
              <p className="ttl-err" role="alert">
                That didn't go through. Try again in a moment.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function Dial() {
  const ticks = Array.from({ length: 72 }, (_, i) => i)
  return (
    <svg className="ttl-svg ttl-dial" viewBox="0 0 320 320" width="320" height="320" aria-hidden="true">
      <circle cx="160" cy="160" r="152" fill="none" stroke="var(--ttl-deep-muted)" strokeOpacity="0.35" />
      <g className="ttl-dial-ticks">
        {ticks.map((i) => {
          const a = (i / ticks.length) * Math.PI * 2
          const long = i % 6 === 0
          const r1 = long ? 128 : 136
          return <line key={i} x1={160 + Math.cos(a) * r1} y1={160 + Math.sin(a) * r1} x2={160 + Math.cos(a) * 146} y2={160 + Math.sin(a) * 146} stroke="var(--ttl-deep-ink)" strokeOpacity={long ? 0.7 : 0.3} strokeWidth={long ? 1.6 : 1} />
        })}
      </g>
      <g className="ttl-dial-ring">
        <circle cx="160" cy="160" r="112" fill="none" stroke="var(--ttl-deep-muted)" strokeOpacity="0.4" strokeDasharray="2 6" />
        <circle cx="160" cy="48" r="5" fill="var(--ttl-gold)" />
        <circle cx="272" cy="160" r="3" fill="var(--ttl-deep-ink)" />
      </g>
      <circle cx="160" cy="160" r="88" fill="none" stroke="var(--ttl-deep-muted)" strokeOpacity="0.3" />
      <circle cx="160" cy="160" r="66" fill="var(--ttl-lilac)" />
      <circle cx="160" cy="160" r="44" fill="var(--ttl-deep)" fillOpacity="0.12" />
      <g transform="translate(136 134)" fill="none" stroke="var(--ttl-lilac-ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M4 44h40M8 44V22l16-12 16 12v22M18 44V32h12v12" />
        <circle cx="24" cy="22" r="3" fill="var(--ttl-gold)" stroke="none" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ resources */

function ResourceArt({ art, i, uid }: { art: TtlResourceArt; i: number; uid: string }) {
  if (art === "dashboard")
    return (
      <div className="ttl-art ttl-art-dash" aria-hidden="true">
        <div className="ttl-art-win">
          <i />
          <i />
          <i />
          <span className="ttl-art-side" />
          <b>$63,256,000</b>
          <span className="ttl-art-bars">
            <em style={{ width: "30%" }} />
            <em style={{ width: "62%" }} />
            <em style={{ width: "8%" }} />
          </span>
          <span className="ttl-art-rows" />
        </div>
      </div>
    )
  if (art === "report")
    return (
      <div className="ttl-art ttl-art-report" aria-hidden="true">
        <div className="ttl-art-paper">
          <small>Report · Q3</small>
          <b>
            The state
            <br />
            of U.S. early-
            <br />
            stage venture
          </b>
          <svg className="ttl-svg" viewBox="0 0 120 60" width="120" height="60">
            {Array.from({ length: 12 }, (_, k) => (
              <rect key={k} x={k * 10} y={60 - (12 + ((k * 37) % 41))} width="6" height={12 + ((k * 37) % 41)} fill={k === 9 ? "var(--ttl-gold)" : "var(--ttl-ink)"} opacity={k === 9 ? 1 : 0.18} />
            ))}
          </svg>
        </div>
      </div>
    )
  const lines = art === "multi" ? 3 : 1
  return (
    <div className="ttl-art ttl-art-chart" aria-hidden="true">
      <svg className="ttl-svg" viewBox="0 0 240 140" width="240" height="140" preserveAspectRatio="none">
        <defs>
          <linearGradient id={uid + "r" + i} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--ttl-gold)" stopOpacity="0.25" />
            <stop offset="1" stopColor="var(--ttl-gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[28, 56, 84, 112].map((y) => (
          <line key={y} x1="0" x2="240" y1={y} y2={y} stroke="var(--ttl-rule)" />
        ))}
        {Array.from({ length: lines }, (_, k) => {
          const s = series(7 + i * 13 + k * 5, 24, 0.12, 0.03 - k * 0.012)
          const p = sparkPath(s, 240, 140, 18 + k * 8)
          return (
            <g key={k}>
              {k === 0 ? <path d={p.area} fill={"url(#" + uid + "r" + i + ")"} /> : null}
              <path d={p.line} fill="none" stroke={["var(--ttl-gold)", "var(--ttl-ink)", "var(--ttl-chart-c)"][k]} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ the page */

export default function TealTreasuryLanding({
  brand = "Vaultline",
  logo,
  nav = DEFAULT_NAV,
  hero = {},
  accounts: accountsProp = DEFAULT_ACCOUNTS,
  activity: activityProp = DEFAULT_ACTIVITY,
  fund = "Vaultline Fund II, L.P.",
  benefits = {},
  features = {},
  coverage = {},
  pricing = {},
  faq = {},
  cta = {},
  operating = {},
  resources = {},
  footer = {},
  palette,
  onTransfer,
  onGetStarted,
  height = "100svh",
  className,
}: TealTreasuryLandingProps) {
  const pal = resolvePalette(palette)
  const reduced = useReduced()
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const sentinelRef = React.useRef(null as HTMLSpanElement | null)
  const uid = React.useId().replace(/:/g, "")

  const [accounts, setAccounts] = React.useState(accountsProp)
  const [activity, setActivity] = React.useState(activityProp)
  // the floating card starts as a plausible sweep from the second account into the first
  const [last, setLast] = React.useState(() => ({
    amount: Math.max(50000, Math.round(((accountsProp[1] ?? accountsProp[0])?.balance ?? 0) * 0.2055 / 50000) * 50000),
    from: (accountsProp[1] ?? accountsProp[0])?.name ?? "",
    to: accountsProp[0]?.name ?? "",
    n: 0,
  }))
  const [scrolled, setScrolled] = React.useState(false)
  const [feat, setFeat] = React.useState(0)
  const [ctaSignal, setCtaSignal] = React.useState(0)
  const accountsRef = React.useRef(accounts)
  accountsRef.current = accounts
  const alive = React.useRef(true)
  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const colors = [...pal.chart]

  // scroll within the page; "Get started" also opens the email field
  const go = React.useCallback(
    (href?: string) => (e: React.MouseEvent) => {
      if (!href || !href.startsWith("#")) return
      const root = rootRef.current
      if (!root) return
      const id = href.slice(1)
      const el = id === "top" || id === "" ? root : (root.querySelector('[data-sec="' + id + '"]') as HTMLElement | null)
      if (!el) return
      e.preventDefault()
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
      if (id === "get-started") setCtaSignal((s) => s + 1)
    },
    [reduced],
  )

  const confirmTransfer = React.useCallback(
    async (t: TtlTransfer) => {
      const ok = await settle(onTransfer ? () => onTransfer(t) : undefined, 950)
      if (!ok || !alive.current) return false
      const res = applyTransfer(accountsRef.current, t)
      if (!res.ok) return false
      const f = accountsRef.current.find((a) => a.id === t.from)
      const to = accountsRef.current.find((a) => a.id === t.to)
      setAccounts(res.accounts)
      const d = new Date()
      const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      setActivity((list) => [
        { id: "t" + d.getTime(), date, text: (t.memo || "Internal transfer") + " → " + (to?.name ?? ""), account: f?.name ?? "", amount: -t.amount, status: "Settled" },
        { id: "r" + d.getTime(), date, text: (t.memo || "Internal transfer") + " ← " + (f?.name ?? ""), account: to?.name ?? "", amount: t.amount, status: "Settled" },
        ...list,
      ])
      setLast((l) => ({ amount: t.amount, from: f?.name ?? "", to: to?.name ?? "", n: l.n + 1 }))
      return true
    },
    [onTransfer],
  )

  // the nav takes a surface once the top of the page has scrolled away
  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // which feature block sits in the middle of the screen drives the stage
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const blocks = Array.from(root.querySelectorAll("[data-feat]")) as HTMLElement[]
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setFeat(+(e.target as HTMLElement).dataset.feat!)
      },
      { rootMargin: "-45% 0px -45% 0px" },
    )
    blocks.forEach((b) => io.observe(b))
    return () => io.disconnect()
  }, [features])

  // every scroll-linked motion on the page, scoped to this root
  useIso(() => {
    const root = rootRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)
    const q = gsap.utils.selector(root)
    const one = (s: string) => q(s)[0] as Element | undefined
    const mm = gsap.matchMedia()
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 900px)" }, (ctx) => {
      const { motion, wide } = ctx.conditions as { motion: boolean; wide: boolean }
      if (!motion) return

      gsap.fromTo(q(".ttl-progress"), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.3 } })

      // hero: the headline rises out of its line masks, the product follows
      const intro = gsap.timeline({ defaults: { ease: "power4.out" } })
      intro
        .from(q(".ttl-hero-word"), { yPercent: 118, rotate: 3, duration: 1.15, stagger: 0.055 })
        .from(q(".ttl-hero-fade"), { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, "-=0.8")
        .from(q(".ttl-device-wrap"), { y: 140, autoAlpha: 0, duration: 1.3 }, "-=0.75")
        .from(q(".ttl-float"), { x: 70, autoAlpha: 0, duration: 1.1, stagger: 0.14 }, "-=0.9")

      // the dashboard lies back and stands up as it comes into view
      const device = one(".ttl-device")
      if (device)
        gsap.fromTo(
          device,
          { rotateX: wide ? 24 : 12, scale: wide ? 0.9 : 0.96, y: wide ? -10 : 0 },
          { rotateX: 0, scale: 1, y: 0, ease: "none", scrollTrigger: { trigger: one(".ttl-device-wrap"), start: "top 96%", end: wide ? "top 18%" : "top 40%", scrub: 0.7 } },
        )
      if (wide) q(".ttl-float-in").forEach((el, i) =>
        gsap.to(el, { y: -70 - i * 60, rotate: i ? 2 : -2, ease: "none", scrollTrigger: { trigger: one(".ttl-hero"), start: "top top", end: "bottom top", scrub: true } }),
      )
      gsap.to(q(".ttl-hero-glow"), { yPercent: 30, scale: 1.25, ease: "none", scrollTrigger: { trigger: one(".ttl-hero"), start: "top top", end: "bottom top", scrub: true } })

      // the benefits statement inks in, word by word
      const words = q(".ttl-bword")
      if (words.length)
        gsap.fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: one(".ttl-benefits-text"), start: "top 82%", end: "bottom 48%", scrub: true } })
      gsap.fromTo(q(".ttl-stat-rule"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power3.inOut", stagger: 0.12, scrollTrigger: { trigger: one(".ttl-stats"), start: "top 85%", once: true } })

      // the feature stage unfolds from a rounded inset to its full frame
      q(".ttl-stage, .ttl-feat-inline").forEach((el) =>
        gsap.fromTo(
          el,
          { clipPath: "inset(10% 8% 10% 8% round 36px)", scale: 0.96 },
          { clipPath: "inset(0% 0% 0% 0% round 14px)", scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 92%", end: "top 40%", scrub: 0.6 } },
        ),
      )

      // anything marked to rise does so once, in batches
      const rise = q("[data-ttl-rise]")
      gsap.set(rise, { y: 34, autoAlpha: 0 })
      ScrollTrigger.batch(rise, {
        start: "top 90%",
        once: true,
        onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: 0.95, ease: "power3.out", stagger: 0.07, overwrite: true }),
      })
      gsap.fromTo(q(".ttl-price-check path"), { strokeDashoffset: 26 }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out", stagger: 0.15, scrollTrigger: { trigger: one(".ttl-price-list"), start: "top 80%", once: true } })

      // the call to action grows into its frame; the dial turns with the page
      const ctaCard = one(".ttl-cta")
      if (ctaCard)
        gsap.fromTo(ctaCard, { scale: 0.9, borderRadius: 44 }, { scale: 1, borderRadius: 10, ease: "none", scrollTrigger: { trigger: ctaCard, start: "top 98%", end: "top 45%", scrub: 0.6 } })
      const op = one(".ttl-op")
      if (op) {
        gsap.to(q(".ttl-dial-ticks"), { rotation: 140, svgOrigin: "160 160", ease: "none", scrollTrigger: { trigger: op, start: "top bottom", end: "bottom top", scrub: 0.5 } })
        gsap.to(q(".ttl-dial-ring"), { rotation: -220, svgOrigin: "160 160", ease: "none", scrollTrigger: { trigger: op, start: "top bottom", end: "bottom top", scrub: 0.8 } })
      }
      gsap.from(q(".ttl-res-card"), { y: 60, autoAlpha: 0, rotate: 1.5, duration: 1, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: one(".ttl-res-grid"), start: "top 85%", once: true } })

      // the footer wordmark rises letter by letter as the page runs out
      const big = one(".ttl-bigmark")
      if (big) gsap.from(q(".ttl-bigmark span"), { yPercent: 105, ease: "none", stagger: 0.04, scrollTrigger: { trigger: big, start: "top bottom", end: "bottom bottom", scrub: 0.6 } })
    })

    // late layout shifts (accordions, fonts, host content) move the triggers
    let t = 0
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      clearTimeout(t)
      t = window.setTimeout(() => ScrollTrigger.refresh(), 160)
    }) : null
    ro?.observe(root)
    return () => {
      ro?.disconnect()
      clearTimeout(t)
      mm.revert()
    }
  }, [])

  const h = hero ?? null
  const heroTitle = h?.title ?? "*Treasury*—centralized\ncapital management"
  const featItems = (features?.items ?? DEFAULT_FEATURES).slice(0, 3)
  const stats = benefits?.stats ?? DEFAULT_STATS
  const resItems = resources?.items ?? DEFAULT_RESOURCES

  const style = {
    "--ttl-h": height,
    "--ttl-page": pal.page,
    "--ttl-paper": pal.paper,
    "--ttl-ink": pal.ink,
    "--ttl-muted": pal.muted,
    "--ttl-rule": pal.rule,
    "--ttl-deep": pal.deep,
    "--ttl-deep-ink": pal.deepInk,
    "--ttl-deep-muted": pal.deepMuted,
    "--ttl-gold": pal.gold,
    "--ttl-lilac": pal.lilac,
    "--ttl-lilac-ink": pal.lilacInk,
    "--ttl-accent": pal.accent,
    "--ttl-accent-ink": pal.accentInk,
    "--ttl-good": pal.good,
    "--ttl-chart-c": pal.chart[2],
    "--ttl-glow-a": pal.glow[0],
    "--ttl-glow-b": pal.glow[1],
    "--ttl-glow-c": pal.glow[2],
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={"ttl-root" + (className ? " " + className : "")} style={style} data-sec="top">
      <style>{TTL_CSS}</style>
      <span ref={sentinelRef} className="ttl-sentinel" aria-hidden="true" />
      {nav ? <Nav brand={brand} logo={logo} nav={nav} go={go} scrolled={scrolled} /> : null}

      {/* hero */}
      <section className="ttl-hero" data-sec="dashboard">
        <span className="ttl-hero-glow" aria-hidden="true" />
        <span className="ttl-hero-grid" aria-hidden="true" />
        {h ? (
          <div className="ttl-wrap ttl-hero-head">
            <h1 className="ttl-h1">
              {markedWords(heroTitle).map((w, i, all) => (
                <React.Fragment key={i}>
                  <span className="ttl-mask">
                    <span className="ttl-hero-word">
                      <span className={w.mark ? "ttl-gold" : undefined}>{w.word}</span>
                      {w.tail}
                    </span>
                  </span>
                  {w.br ? <br /> : w.glue || i === all.length - 1 ? null : " "}
                </React.Fragment>
              ))}
            </h1>
            {h.text !== "" ? <p className="ttl-hero-text ttl-hero-fade">{h.text ?? "Open, operate and report on every fund account from one live dashboard: operating cash, money market funds and FDIC-swept vaults."}</p> : null}
            <div className="ttl-hero-ctas ttl-hero-fade">
              <a className="ttl-btn ttl-btn-lilac" href={(h.secondary ?? { href: "#faq" }).href ?? "#"} onClick={go((h.secondary ?? { href: "#faq" }).href)}>
                {(h.secondary ?? { label: "Contact sales" }).label}
              </a>
              <a className="ttl-btn ttl-btn-dark" href={(h.primary ?? { href: "#get-started" }).href ?? "#"} onClick={go((h.primary ?? { href: "#get-started" }).href)}>
                {(h.primary ?? { label: "Get started" }).label}
              </a>
            </div>
          </div>
        ) : null}
        <div className="ttl-device-wrap">
          <div className="ttl-device">
            <div className="ttl-device-bezel">
              <Dashboard brand={brand} fund={fund} accounts={accounts} activity={activity} colors={colors} reduced={reduced} onConfirm={confirmTransfer} />
            </div>
          </div>
          <div className="ttl-floats" aria-live="polite">
            <div className="ttl-float">
              <div className="ttl-float-in">
                <FlowCard title="Internal transfer" amount={last.amount} from={last.from} to={last.to} flash={last.n} />
              </div>
            </div>
            <div className="ttl-float ttl-float-2">
              <div className="ttl-float-in">
                <FlowCard title="Outgoing wire" amount={2150000} note="to portfolio company" from="Operating" to="Bank Point LLC" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* benefits */}
      {benefits ? (
        <section className="ttl-sec ttl-benefits" data-sec="benefits">
          <div className="ttl-wrap ttl-split">
            <div className="ttl-label">{benefits.label ?? "Benefits"}</div>
            <div>
              <p className="ttl-benefits-text">
                <Marked text={benefits.text ?? "Venture banking is complicated, but it doesn't need to be fragmented. With *" + brand + " Treasury,* set up, operate and report from one live, integrated dashboard across all your funds and accounts."} wordClass="ttl-bword" />
              </p>
              {stats.length ? (
                <div className="ttl-stats">
                  {stats.map((s) => (
                    <StatTile key={s.label} s={s} reduced={reduced} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* features */}
      {features && featItems.length ? (
        <section className="ttl-sec ttl-feats" data-sec="features">
          <div className="ttl-wrap">
            <div className="ttl-label ttl-feat-label">{features.label ?? "Features"}</div>
            <div className="ttl-feat-grid">
              <div className="ttl-stage-col">
                <div className="ttl-stage" data-scene={feat % 3}>
                  {featItems.map((_, i) => (
                    <div key={i} className="ttl-stage-layer" data-on={feat === i || undefined} aria-hidden={feat !== i}>
                      <Scene i={i} active={feat === i} reduced={reduced} accounts={accounts} colors={colors} />
                    </div>
                  ))}
                  <div className="ttl-stage-count" aria-hidden="true">
                    <b>{String(feat + 1).padStart(2, "0")}</b> / {String(featItems.length).padStart(2, "0")}
                  </div>
                </div>
              </div>
              <div className="ttl-feat-copy">
                {featItems.map((f, i) => (
                  <article key={f.title} className="ttl-feat" data-feat={i} data-on={feat === i || undefined}>
                    <div className="ttl-feat-inline">
                      <Scene i={i} active={feat === i} reduced={reduced} accounts={accounts} colors={colors} />
                    </div>
                    <span className="ttl-feat-n">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="ttl-h3 ttl-feat-title">{f.title}</h3>
                    <p>{f.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {coverage ? (
        <Coverage
          title={coverage.title ?? "Maximized protection, including up to *" + formatCompact(coverage.limit ?? 125e6) + "* of FDIC coverage"}
          limit={coverage.limit ?? 125e6}
          perBank={coverage.perBank ?? 250e3}
          items={coverage.items ?? DEFAULT_COVERAGE}
          reduced={reduced}
        />
      ) : null}

      {pricing ? <Pricing p={{ addon: { title: "Premium money market funds and lines of credit, offered at service cost", text: "Institutional share classes and capital call lines are priced at what they cost us to run, disclosed in full before you switch them on. No markup on yield." }, ...pricing }} reduced={reduced} /> : null}

      {faq ? <Faq f={faq} /> : null}

      {cta ? <Cta c={cta} brand={brand} onGetStarted={onGetStarted} openSignal={ctaSignal} reduced={reduced} go={go} /> : null}

      {operating ? (
        <section className="ttl-sec ttl-op-sec">
          <div className="ttl-wrap">
            <div className="ttl-op">
              <div className="ttl-op-copy">
                <h2 className="ttl-h2">
                  <Marked text={operating.title ?? "Looking for a venture\noperating account?"} />
                </h2>
                <p>{operating.text ?? "Networked operating accounts give venture funds a sweep across program banks, with up to $125M in FDIC coverage and no account minimums. Open one in less than five minutes."}</p>
                <a className="ttl-link-arrow" href={operating.link?.href ?? "#coverage"} onClick={go(operating.link?.href ?? "#coverage")}>
                  {operating.link?.label ?? "Learn more about networked banking"}
                  <Icon d={I.arrow} size={15} />
                </a>
              </div>
              <div className="ttl-op-art">
                <Dial />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {resources && resItems.length ? (
        <section className="ttl-sec ttl-res" data-sec="resources">
          <div className="ttl-wrap">
            <h2 className="ttl-h2 ttl-res-title" data-ttl-rise>
              <Marked text={resources.title ?? "*Helpful resources* to get you up and running\nwith the software built for private markets"} />
            </h2>
            <div className="ttl-res-grid">
              {resItems.map((r, i) => (
                <a key={r.title} className="ttl-res-card" href={r.href ?? "#"} onClick={r.href ? go(r.href) : (e) => e.preventDefault()}>
                  <div className="ttl-res-thumb">
                    <ResourceArt art={r.art ?? (["dashboard", "report", "line", "multi"] as TtlResourceArt[])[i % 4]} i={i} uid={uid} />
                  </div>
                  <div className="ttl-res-cap">
                    <b>{r.title}</b>
                    <span>
                      {r.tag}
                      <Icon d={I.arrow} size={14} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {footer ? (
        <footer className="ttl-foot">
          <div className="ttl-wrap">
            <div className="ttl-foot-grid">
              <a href="#" className="ttl-brand" onClick={go("#top")}>
                {logo ?? <VaultMark />}
                <span>{brand}</span>
              </a>
              {(footer.columns ?? DEFAULT_FOOTER_COLUMNS).map((c) => (
                <div key={c.title} className="ttl-foot-col">
                  <b>{c.title}</b>
                  {c.links.map((l) => (
                    <a key={l.label} href={l.href ?? "#"} onClick={go(l.href)}>
                      {l.label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
            <div className="ttl-foot-bar">
              <div className="ttl-foot-legal-links">
                <a href="#">Terms</a>
                <a href="#">Privacy</a>
                <a href="#">Disclosures</a>
                <span>© {brand}</span>
              </div>
              <div className="ttl-social">
                {[
                  { label: "X", d: "M4 4l16 16M20 4L4 20" },
                  { label: "LinkedIn", d: "M7 10v7M7 7v.01M11 17v-7M11 13a3 3 0 016 0v4" },
                  { label: "YouTube", d: "M10 9l5 3-5 3zM3 12c0-3 .5-5 3-5.5C8 6 16 6 18 6.5c2.5.5 3 2.5 3 5.5s-.5 5-3 5.5c-2 .5-10 .5-12 0C3.5 17 3 15 3 12z" },
                ].map((s) => (
                  <a key={s.label} href="#" aria-label={s.label} onClick={(e) => e.preventDefault()}>
                    <Icon d={s.d} size={15} />
                  </a>
                ))}
              </div>
            </div>
            <p className="ttl-legal">{footer.legal ?? brand + " is a made-up company and this page is a template. Nothing here is an offer of banking, investment or insurance products. Deposit insurance figures are illustrative; FDIC coverage applies only to deposits held at insured banks, up to the standard limit per depositor, per bank, per ownership category."}</p>
          </div>
          <div className="ttl-bigmark" aria-hidden="true">
            {brand.split("").map((ch, i) => (
              <span key={i}>{ch === " " ? " " : ch}</span>
            ))}
          </div>
        </footer>
      ) : null}
    </div>
  )
}

function StatTile({ s, reduced }: { s: TtlStat; reduced: boolean }) {
  const ref = React.useRef(null as HTMLDivElement | null)
  const seen = useSeen(ref)
  const [v] = useTween([seen ? s.value : 0], reduced, 1600)
  return (
    <div className="ttl-stat" ref={ref}>
      <span className="ttl-stat-rule" aria-hidden="true" />
      <b aria-label={formatStat(s, s.value)}>{formatStat(s, s.decimals ? v : Math.round(v))}</b>
      <span>{s.label}</span>
    </div>
  )
}

const TTL_CSS = `
.ttl-root{--ttl-sans:"Inter Tight","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;position:relative;min-height:var(--ttl-h);background:var(--ttl-page);color:var(--ttl-ink);font-family:var(--ttl-sans);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:clip;isolation:isolate}
.ttl-root *,.ttl-root *::before,.ttl-root *::after{box-sizing:border-box}
.ttl-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.ttl-root :where(input){font:inherit;color:inherit}
.ttl-root :where(a){color:inherit;text-decoration:none}
.ttl-root :where(h1,h2,h3,p,ul,dl,dd){margin:0;padding:0}
.ttl-root :where(ul){list-style:none}
.ttl-root :where(button,a,input,[tabindex]):focus-visible{outline:2px solid var(--ttl-gold);outline-offset:2px;border-radius:6px}
.ttl-svg{display:block;max-width:none;flex:none}
.ttl-sentinel{position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none}
.ttl-wrap{width:100%;max-width:1200px;margin:0 auto;padding:0 24px;position:relative}
.ttl-gold{color:var(--ttl-gold)}
.ttl-h1{font-size:clamp(42px,7.2vw,92px);line-height:1;letter-spacing:-.04em;font-weight:400;text-align:center}
.ttl-h2{font-size:clamp(30px,4.4vw,52px);line-height:1.04;letter-spacing:-.035em;font-weight:400}
.ttl-h3{font-size:18px;line-height:1.25;letter-spacing:-.01em;font-weight:500}
.ttl-k{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ttl-muted)}
.ttl-fine{font-size:12px;line-height:1.5;color:var(--ttl-muted)}
.ttl-mask{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em}
.ttl-hero-word{display:inline-block;will-change:transform}

.ttl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:44px;padding:0 22px;border-radius:999px;font-size:14px;font-weight:500;white-space:nowrap;transition:transform .25s cubic-bezier(.2,.8,.2,1),background-color .25s,box-shadow .25s,opacity .2s}
.ttl-btn:hover{transform:translateY(-1px)}
.ttl-btn:active{transform:translateY(0) scale(.98)}
.ttl-btn:disabled{opacity:.6;cursor:default;transform:none}
.ttl-btn-sm{height:36px;padding:0 16px;font-size:13px}
.ttl-btn-dark{background:var(--ttl-accent);color:var(--ttl-accent-ink)}
.ttl-btn-dark:hover{box-shadow:0 10px 24px -12px var(--ttl-accent)}
.ttl-btn-lilac{background:var(--ttl-lilac);color:var(--ttl-lilac-ink)}
.ttl-btn-ghost{border:1px solid var(--ttl-rule);background:var(--ttl-paper)}
.ttl-btn-glass{background:rgba(255,255,255,.42);color:var(--ttl-ink);border:1px solid rgba(255,255,255,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.ttl-btn[data-busy]{opacity:.8}
.ttl-link{font-size:13px;text-decoration:underline;text-underline-offset:3px;color:var(--ttl-muted)}
.ttl-link:hover{color:var(--ttl-ink)}

/* nav */
.ttl-nav{position:sticky;top:0;z-index:40;transition:background-color .35s,box-shadow .35s,backdrop-filter .35s}
.ttl-nav[data-scrolled]{background:color-mix(in srgb,var(--ttl-page) 82%,transparent);backdrop-filter:saturate(1.4) blur(14px);-webkit-backdrop-filter:saturate(1.4) blur(14px);box-shadow:0 1px 0 var(--ttl-rule)}
.ttl-nav-in{max-width:1200px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;gap:28px;position:relative}
.ttl-brand{display:inline-flex;align-items:center;gap:10px;font-weight:600;font-size:16px;letter-spacing:-.02em}
.ttl-nav-links{display:flex;align-items:center;gap:6px;flex:1}
.ttl-nav-link{display:inline-flex;align-items:center;gap:4px;padding:8px 10px;border-radius:8px;font-size:14px;color:var(--ttl-ink);opacity:.82;transition:opacity .2s,background-color .2s}
.ttl-nav-link:hover,.ttl-nav-link[aria-expanded="true"]{opacity:1;background:color-mix(in srgb,var(--ttl-ink) 5%,transparent)}
.ttl-caret{transition:transform .3s}
.ttl-nav-link[aria-expanded="true"] .ttl-caret{transform:rotate(180deg)}
.ttl-nav-end{display:flex;align-items:center;gap:8px;margin-left:auto}
.ttl-prod{position:relative}
.ttl-prod-panel{position:absolute;top:calc(100% + 8px);left:-12px;width:360px;padding:8px;border-radius:16px;background:var(--ttl-paper);border:1px solid var(--ttl-rule);box-shadow:0 30px 60px -30px rgba(16,41,45,.35);opacity:0;visibility:hidden;transform:translateY(-6px) scale(.98);transform-origin:20% 0;transition:opacity .25s,transform .35s cubic-bezier(.2,.8,.2,1),visibility .25s}
.ttl-prod-panel::before{content:"";position:absolute;left:0;right:0;top:-12px;height:12px}
.ttl-prod-panel[data-open]{opacity:1;visibility:visible;transform:none}
.ttl-prod-item{display:flex;gap:12px;padding:12px;border-radius:10px;transition:background-color .2s}
.ttl-prod-item:hover{background:var(--ttl-page)}
.ttl-prod-item b{display:block;font-weight:500;font-size:14px}
.ttl-prod-item small{display:block;font-size:12.5px;color:var(--ttl-muted);line-height:1.4}
.ttl-prod-ic{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:var(--ttl-page);color:var(--ttl-gold);flex:none}
.ttl-burger{display:none;width:40px;height:40px;place-items:center;border-radius:10px}
.ttl-sheet{display:none}
.ttl-progress{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--ttl-gold);transform:scaleX(0);transform-origin:0 50%;opacity:.9}

/* hero */
.ttl-hero{position:relative;padding:72px 0 0}
.ttl-hero-glow{position:absolute;left:50%;top:260px;width:min(1100px,120vw);height:640px;transform:translateX(-50%);background:radial-gradient(closest-side,color-mix(in srgb,var(--ttl-lilac) 70%,transparent),transparent 72%);opacity:.65;pointer-events:none;z-index:-1}
.ttl-hero-grid{position:absolute;inset:0 0 auto 0;height:560px;background-image:linear-gradient(var(--ttl-rule) 1px,transparent 1px),linear-gradient(90deg,var(--ttl-rule) 1px,transparent 1px);background-size:64px 64px;background-position:center -1px;-webkit-mask-image:radial-gradient(ellipse 60% 70% at 50% 0%,#000 30%,transparent 75%);mask-image:radial-gradient(ellipse 60% 70% at 50% 0%,#000 30%,transparent 75%);opacity:.55;pointer-events:none;z-index:-1}
.ttl-hero-head{display:flex;flex-direction:column;align-items:center;text-align:center}
.ttl-hero-text{max-width:560px;margin-top:22px;font-size:17px;color:var(--ttl-muted)}
.ttl-hero-ctas{display:flex;gap:10px;margin-top:28px;flex-wrap:wrap;justify-content:center}
.ttl-device-wrap{position:relative;max-width:1080px;margin:64px auto 0;padding:0 24px;perspective:1800px}
.ttl-device{transform-origin:50% 100%;will-change:transform}
.ttl-device-bezel{border-radius:22px;padding:10px;background:linear-gradient(160deg,#1b1f22,#0b0d0e);box-shadow:0 1px 0 rgba(255,255,255,.08) inset,0 50px 100px -40px rgba(16,41,45,.55),0 20px 40px -30px rgba(16,41,45,.4)}
.ttl-floats{position:absolute;inset:0;z-index:3;pointer-events:none}
.ttl-float{position:absolute;right:-28px;top:-36px}
.ttl-float-2{right:auto;top:auto;left:-72px;bottom:26px}
.ttl-float-2 .ttl-flow{width:300px}
.ttl-float-in{will-change:transform}
.ttl-flow{pointer-events:auto;width:332px;padding:12px;border-radius:12px;background:var(--ttl-deep);color:var(--ttl-deep-ink);box-shadow:0 24px 50px -24px rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.06);animation:ttl-flash .9s cubic-bezier(.2,.8,.2,1)}
.ttl-flow-top{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px;font-size:12px;color:var(--ttl-deep-muted);margin-bottom:10px}
.ttl-flow-top b{color:var(--ttl-deep-ink);font-weight:500;font-variant-numeric:tabular-nums}
.ttl-flow-top em{font-style:normal;color:var(--ttl-gold)}
.ttl-flow-row{display:flex;align-items:center;gap:8px}
.ttl-flow-chip{display:inline-flex;align-items:center;gap:6px;flex:0 1 auto;min-width:0;padding:7px 9px;border-radius:8px;background:rgba(255,255,255,.07);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ttl-flow-chip i{width:16px;height:16px;border-radius:5px;background:var(--ttl-gold);flex:none}
.ttl-flow-chip-b i{background:var(--ttl-lilac)}
.ttl-flow-arrow{color:var(--ttl-deep-muted)}
.ttl-flow-arrow path{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round}
.ttl-flow-arrow path:first-child{stroke-dasharray:3 4;animation:ttl-dash 1s linear infinite}
@keyframes ttl-dash{to{stroke-dashoffset:-14}}
@keyframes ttl-flash{from{box-shadow:0 0 0 2px var(--ttl-gold),0 24px 50px -24px rgba(0,0,0,.55)}}

/* dashboard */
.ttl-dash{display:grid;grid-template-columns:208px 1fr;height:600px;border-radius:13px;overflow:hidden;background:var(--ttl-paper);color:var(--ttl-ink);font-size:13px}
.ttl-side{background:color-mix(in srgb,var(--ttl-page) 70%,var(--ttl-paper));border-right:1px solid var(--ttl-rule);padding:16px 10px;display:flex;flex-direction:column;gap:2px;overflow:hidden}
.ttl-side-brand{display:flex;align-items:center;gap:8px;font-weight:600;font-size:12.5px;padding:2px 8px 14px}
.ttl-side-label{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--ttl-muted);padding:12px 8px 6px}
.ttl-side-item,.ttl-side-acc{display:flex;align-items:center;gap:9px;width:100%;padding:7px 8px;border-radius:7px;text-align:left;color:var(--ttl-muted);transition:background-color .2s,color .2s}
.ttl-side-item:hover,.ttl-side-acc:hover{background:color-mix(in srgb,var(--ttl-ink) 5%,transparent);color:var(--ttl-ink)}
.ttl-side-item[data-on],.ttl-side-acc[data-on]{background:var(--ttl-paper);color:var(--ttl-ink);box-shadow:0 1px 2px rgba(16,41,45,.08),0 0 0 1px var(--ttl-rule)}
.ttl-side-acc i{width:8px;height:8px;border-radius:3px;flex:none}
.ttl-side-acc span{flex:1}
.ttl-side-acc small{font-variant-numeric:tabular-nums;font-size:11.5px}
.ttl-side-foot{margin-top:auto;display:flex;align-items:center;gap:9px;padding:7px 8px;color:var(--ttl-muted);font-size:12.5px}
.ttl-main{position:relative;padding:18px 26px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.ttl-crumbs{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ttl-muted);padding-bottom:14px;border-bottom:1px solid var(--ttl-rule)}
.ttl-crumbs b{color:var(--ttl-ink);font-weight:500}
.ttl-live{margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--ttl-good) 10%,transparent);color:var(--ttl-good);font-size:11px}
.ttl-live i{width:6px;height:6px;border-radius:50%;background:currentColor;animation:ttl-pulse 1.8s ease-in-out infinite}
@keyframes ttl-pulse{50%{opacity:.25}}
.ttl-tabs-sm{display:none}
.ttl-view{padding-top:18px;flex:1;min-height:0;display:flex;flex-direction:column;animation:ttl-in .55s cubic-bezier(.2,.8,.2,1)}
@keyframes ttl-in{from{opacity:0;transform:translateY(10px);filter:blur(4px)}}
.ttl-ov-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}
.ttl-ov-head .ttl-k{margin-top:14px}
.ttl-total{font-size:clamp(26px,3.4vw,38px);letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1.15;margin-top:2px}
.ttl-delta{font-size:12px;color:var(--ttl-muted);margin-top:4px}
.ttl-delta span{color:var(--ttl-good);font-weight:500}
.ttl-spark{display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex:1;max-width:320px}
.ttl-spark-svg{width:100%;height:84px}
.ttl-seg{display:inline-flex;padding:3px;border-radius:9px;background:var(--ttl-page);border:1px solid var(--ttl-rule)}
.ttl-seg button{padding:4px 10px;border-radius:6px;font-size:11.5px;color:var(--ttl-muted);transition:background-color .25s,color .25s,box-shadow .25s}
.ttl-seg button[aria-selected="true"]{background:var(--ttl-paper);color:var(--ttl-ink);box-shadow:0 1px 2px rgba(16,41,45,.12)}
.ttl-accs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}
.ttl-acc{display:flex;flex-direction:column;gap:3px;text-align:left;padding:12px;border-radius:10px;border:1px solid var(--ttl-rule);background:var(--ttl-paper);transition:border-color .25s,transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s,opacity .3s}
.ttl-acc:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--ttl-ink) 25%,transparent);box-shadow:0 14px 26px -18px rgba(16,41,45,.4)}
.ttl-acc[data-on]{border-color:var(--ttl-gold);box-shadow:0 0 0 3px color-mix(in srgb,var(--ttl-gold) 18%,transparent)}
.ttl-acc[data-dim]{opacity:.5}
.ttl-acc-top{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--ttl-muted)}
.ttl-acc-top i{width:8px;height:8px;border-radius:3px}
.ttl-acc-go{margin-left:auto;opacity:0;transform:translateX(-4px);transition:opacity .25s,transform .25s}
.ttl-acc:hover .ttl-acc-go{opacity:1;transform:none}
.ttl-acc-bal{font-size:15px;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.ttl-acc-kind{font-size:11px;color:var(--ttl-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ttl-recent{margin-top:16px;display:flex;flex-direction:column}
.ttl-recent-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;font-size:12.5px}
.ttl-recent-head b{font-weight:500}
.ttl-recent-row{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;padding:7px 0;border-top:1px solid var(--ttl-rule);font-size:12px;animation:ttl-in .45s cubic-bezier(.2,.8,.2,1) both}
.ttl-recent-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ttl-break{margin-top:auto;padding-top:16px}
.ttl-break-head{display:flex;flex-direction:column;gap:2px;margin-bottom:10px}
.ttl-break-head b{font-weight:500;font-size:13px}
.ttl-break-head span{font-size:11.5px;color:var(--ttl-muted)}
.ttl-bar{position:relative;display:flex;gap:3px;height:12px}
.ttl-bar span{display:block;height:100%;border-radius:3px;min-width:3px;transition:opacity .3s,transform .3s;outline-offset:2px}
.ttl-bar span:hover,.ttl-bar span:focus-visible{transform:scaleY(1.35)}
.ttl-bar span[data-dim]{opacity:.3}
.ttl-bar-lg{height:16px}
.ttl-tip{position:absolute;bottom:calc(100% + 8px);transform:translateX(-50%);padding:5px 9px;border-radius:7px;background:var(--ttl-ink);color:var(--ttl-paper);font-size:11px;font-style:normal;white-space:nowrap;pointer-events:none;animation:ttl-in .25s}
.ttl-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;font-size:11.5px;color:var(--ttl-muted)}
.ttl-legend span{display:inline-flex;align-items:center;gap:6px}
.ttl-legend i{width:8px;height:8px;border-radius:3px}

.ttl-move .ttl-h3,.ttl-act .ttl-h3{margin-bottom:14px}
.ttl-form{display:flex;flex-direction:column;gap:12px;max-width:520px}
.ttl-pick{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center}
.ttl-pick-col{display:flex;flex-direction:column;gap:6px}
.ttl-pill{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:8px;border:1px solid var(--ttl-rule);font-size:12.5px;transition:border-color .2s,background-color .2s,box-shadow .2s}
.ttl-pill small{color:var(--ttl-muted);font-variant-numeric:tabular-nums}
.ttl-pill[aria-pressed="true"]{border-color:var(--ttl-ink);background:color-mix(in srgb,var(--ttl-gold) 8%,var(--ttl-paper));box-shadow:0 0 0 1px var(--ttl-ink) inset}
.ttl-swap{display:grid;place-items:center;width:32px;height:32px;margin-top:18px;border-radius:50%;border:1px solid var(--ttl-rule);transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.ttl-swap:hover{transform:rotate(180deg)}
.ttl-field{display:flex;flex-direction:column;gap:6px}
.ttl-amt{display:flex;align-items:center;gap:4px;border-bottom:1px solid var(--ttl-rule);padding:2px 0 6px;transition:border-color .2s}
.ttl-amt:focus-within{border-color:var(--ttl-ink)}
.ttl-amt b{font-weight:400;font-size:26px;color:var(--ttl-muted)}
.ttl-amt input{border:0;outline:0;background:none;font-size:26px;letter-spacing:-.02em;width:100%;font-variant-numeric:tabular-nums;padding:0}
.ttl-chips{display:flex;gap:6px;flex-wrap:wrap}
.ttl-chips button{padding:5px 10px;border-radius:999px;background:var(--ttl-page);font-size:12px;border:1px solid var(--ttl-rule);transition:background-color .2s}
.ttl-chips button:hover{background:var(--ttl-paper)}
.ttl-memo{border:1px solid var(--ttl-rule);border-radius:8px;padding:8px 10px;font-size:12.5px;background:var(--ttl-paper);outline:0}
.ttl-memo:focus{border-color:var(--ttl-ink)}
.ttl-form .ttl-btn{align-self:flex-start;height:40px}
.ttl-err{font-size:12.5px;color:#b3412e}
.ttl-review{display:flex;flex-direction:column;gap:14px;max-width:460px;animation:ttl-in .5s cubic-bezier(.2,.8,.2,1)}
.ttl-route{display:flex;align-items:center;gap:12px;font-size:13px}
.ttl-route span{padding:6px 10px;border-radius:8px;background:var(--ttl-page);border:1px solid var(--ttl-rule)}
.ttl-route-line{color:var(--ttl-gold)}
.ttl-route-line path{stroke-dasharray:4 4;animation:ttl-dash .8s linear infinite}
.ttl-review-amt{font-size:34px;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.ttl-dl{display:flex;flex-direction:column;border-top:1px solid var(--ttl-rule)}
.ttl-dl div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--ttl-rule);font-size:12.5px}
.ttl-dl dt{color:var(--ttl-muted)}
.ttl-dl dd{font-variant-numeric:tabular-nums}
.ttl-row{display:flex;gap:8px}
.ttl-row .ttl-btn{height:40px}
.ttl-done{display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-weight:500}
.ttl-done-ic{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--ttl-good);color:#fff;animation:ttl-pop .5s cubic-bezier(.3,1.6,.5,1)}
@keyframes ttl-pop{from{transform:scale(.3);opacity:0}}
.ttl-act{display:flex;flex-direction:column;min-height:0;flex:1}
.ttl-act-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.ttl-ledger{overflow:auto;flex:1;min-height:0;border-top:1px solid var(--ttl-rule);scrollbar-width:thin}
.ttl-ledger li{display:grid;grid-template-columns:64px 1fr auto 130px;align-items:center;gap:12px;padding:11px 2px;border-bottom:1px solid var(--ttl-rule);animation:ttl-in .45s cubic-bezier(.2,.8,.2,1) both}
.ttl-ledger li:nth-child(2){animation-delay:.04s}
.ttl-ledger li:nth-child(3){animation-delay:.08s}
.ttl-ledger li:nth-child(4){animation-delay:.12s}
.ttl-ledger li:nth-child(n+5){animation-delay:.16s}
.ttl-led-date{color:var(--ttl-muted);font-size:12px}
.ttl-led-text{display:flex;flex-direction:column;min-width:0}
.ttl-led-text small{color:var(--ttl-muted);font-size:11px}
.ttl-led-status{font-size:11px;padding:2px 8px;border-radius:999px;background:var(--ttl-page);color:var(--ttl-muted)}
.ttl-led-status[data-s="Settled"]{background:color-mix(in srgb,var(--ttl-good) 10%,transparent);color:var(--ttl-good)}
.ttl-led-status[data-s="Pending"]{background:color-mix(in srgb,var(--ttl-gold) 14%,transparent);color:var(--ttl-gold)}
.ttl-led-amt{text-align:right;font-variant-numeric:tabular-nums}
.ttl-led-amt[data-in]{color:var(--ttl-good)}
.ttl-led-empty{display:block!important;color:var(--ttl-muted);padding:20px 2px}

/* sections */
.ttl-sec{position:relative;padding:120px 0}
.ttl-split{display:grid;grid-template-columns:200px 1fr;gap:40px}
.ttl-label{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ttl-gold);height:max-content;padding-top:8px}
.ttl-label::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 0 0 currentColor;animation:ttl-ping 2.4s ease-out infinite}
@keyframes ttl-ping{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ttl-gold) 50%,transparent)}80%,100%{box-shadow:0 0 0 8px transparent}}
.ttl-benefits{border-bottom:1px solid var(--ttl-rule)}
.ttl-benefits-text{font-size:clamp(22px,2.7vw,32px);line-height:1.3;letter-spacing:-.02em;max-width:820px}
.ttl-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:80px;max-width:820px}
.ttl-stat{position:relative;display:flex;flex-direction:column;gap:6px;padding-top:18px}
.ttl-stat-rule{position:absolute;top:0;left:0;right:0;height:1px;background:var(--ttl-ink);opacity:.25;transform-origin:0 50%}
.ttl-stat b{font-size:clamp(40px,5vw,60px);font-weight:400;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
.ttl-stat span:last-child{font-size:12.5px;color:var(--ttl-muted)}

/* features */
.ttl-feats{background:color-mix(in srgb,var(--ttl-page) 60%,var(--ttl-rule));}
.ttl-feat-label{margin-bottom:24px}
.ttl-feat-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:80px}
.ttl-stage-col{position:relative}
.ttl-stage{position:sticky;top:calc(50vh - 260px);height:520px;border-radius:14px;overflow:hidden;background:var(--ttl-paper);box-shadow:0 1px 0 var(--ttl-rule),0 40px 80px -50px rgba(16,41,45,.35);transition:background-color .7s}
.ttl-stage[data-scene="1"]{background:var(--ttl-deep)}
.ttl-stage-layer{position:absolute;inset:0;opacity:0;visibility:hidden;transform:translateY(24px) scale(.97);filter:blur(6px);transition:opacity .6s,transform .8s cubic-bezier(.2,.8,.2,1),filter .6s,visibility .6s}
.ttl-stage-layer[data-on]{opacity:1;visibility:visible;transform:none;filter:none}
.ttl-stage-count{position:absolute;left:18px;bottom:14px;font-size:11.5px;letter-spacing:.06em;color:var(--ttl-muted);font-variant-numeric:tabular-nums;transition:color .6s}
.ttl-stage[data-scene="1"] .ttl-stage-count{color:var(--ttl-deep-muted)}
.ttl-stage-count b{color:var(--ttl-gold);font-weight:500}
.ttl-feat-copy{display:flex;flex-direction:column}
.ttl-feat{min-height:72vh;display:flex;flex-direction:column;justify-content:center;gap:12px;opacity:.35;transition:opacity .5s}
.ttl-feat[data-on]{opacity:1}
.ttl-feat-n{font-size:12px;color:var(--ttl-gold);letter-spacing:.08em}
.ttl-feat-title{font-size:clamp(22px,2.4vw,28px);letter-spacing:-.02em;font-weight:400}
.ttl-feat p{color:var(--ttl-muted);max-width:420px}
.ttl-feat-inline{display:none}
.ttl-scene{position:absolute;inset:0;display:grid;place-items:center;padding:28px}

.ttl-setup-card{position:relative;width:min(400px,100%);padding:16px;border-radius:14px;background:var(--ttl-paper);border:1px solid var(--ttl-rule);box-shadow:0 24px 50px -30px rgba(16,41,45,.35)}
.ttl-setup-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
.ttl-setup-head span{display:flex;flex-direction:column}
.ttl-setup-head b{font-weight:500;font-size:14px}
.ttl-setup-head small{font-size:11.5px;color:var(--ttl-muted)}
.ttl-setup-list{display:flex;flex-direction:column;gap:6px}
.ttl-setup-list button{display:flex;align-items:center;gap:10px;width:100%;padding:10px;border-radius:10px;border:1px solid var(--ttl-rule);font-size:13px;text-align:left;transition:border-color .35s,background-color .35s}
.ttl-setup-list button[data-on]{border-color:color-mix(in srgb,var(--ttl-good) 35%,transparent);background:color-mix(in srgb,var(--ttl-good) 5%,var(--ttl-paper))}
.ttl-setup-ic{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--ttl-page);color:var(--ttl-gold);flex:none}
.ttl-tick{margin-left:auto;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;border:1.5px solid var(--ttl-rule);color:transparent;transition:background-color .3s,border-color .3s,color .3s,transform .45s cubic-bezier(.3,1.6,.5,1)}
.ttl-setup-list button[data-on] .ttl-tick{background:var(--ttl-good);border-color:var(--ttl-good);color:#fff;transform:scale(1.08)}
.ttl-setup-list button[data-last]{border-style:dashed}
.ttl-setup-foot{display:flex;align-items:center;gap:10px;margin-top:12px;font-size:11.5px;color:var(--ttl-muted);font-variant-numeric:tabular-nums}
.ttl-meter{flex:1;height:4px;border-radius:2px;background:var(--ttl-page);overflow:hidden}
.ttl-meter i{display:block;height:100%;background:var(--ttl-good);border-radius:2px;transition:width .5s cubic-bezier(.2,.8,.2,1)}
.ttl-cursor{position:absolute;right:-30px;top:42%;transition:transform 1.1s cubic-bezier(.6,0,.2,1);pointer-events:none;filter:drop-shadow(0 4px 6px rgba(0,0,0,.2))}
.ttl-cursor[data-at]{transform:translate(-80px,82px)}
.ttl-cursor[data-click]{animation:ttl-click .35s .1s}
@keyframes ttl-click{50%{scale:.8}}

.ttl-scene-phone{overflow:hidden;color:var(--ttl-deep-ink)}
.ttl-bokeh{position:absolute;inset:-20%;background:radial-gradient(circle at 18% 30%,color-mix(in srgb,var(--ttl-gold) 55%,transparent) 0,transparent 18%),radial-gradient(circle at 82% 22%,color-mix(in srgb,var(--ttl-lilac) 40%,transparent) 0,transparent 14%),radial-gradient(circle at 70% 80%,color-mix(in srgb,var(--ttl-gold) 30%,transparent) 0,transparent 20%),radial-gradient(circle at 30% 85%,rgba(255,255,255,.12) 0,transparent 10%);filter:blur(18px);animation:ttl-drift 14s ease-in-out infinite alternate}
@keyframes ttl-drift{to{transform:translate(4%,-3%) scale(1.06)}}
.ttl-phone{position:relative;width:212px;height:420px;padding:9px;border-radius:38px;background:linear-gradient(150deg,#2b3134,#0c0e0f 60%);box-shadow:0 0 0 1px rgba(255,255,255,.08) inset,0 40px 70px -20px rgba(0,0,0,.65);transform:perspective(1100px) rotateY(-14deg) rotateX(6deg) rotateZ(4deg);transition:transform 1s cubic-bezier(.2,.8,.2,1)}
.ttl-stage-layer[data-on] .ttl-phone,.ttl-feat[data-on] .ttl-phone{transform:perspective(1100px) rotateY(-8deg) rotateX(4deg) rotateZ(2deg)}
.ttl-phone-screen{position:relative;height:100%;border-radius:30px;overflow:hidden;background:linear-gradient(180deg,color-mix(in srgb,var(--ttl-deep) 80%,#000),var(--ttl-deep));padding:16px 14px;display:flex;flex-direction:column;gap:8px}
.ttl-phone-status{display:flex;justify-content:space-between;align-items:center;font-size:10px;opacity:.8;margin-bottom:6px}
.ttl-phone-status i{width:46px;height:14px;border-radius:999px;background:#000;position:absolute;left:50%;top:10px;transform:translateX(-50%)}
.ttl-phone-k{font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ttl-deep-muted);margin-top:8px}
.ttl-phone-bal{font-size:28px;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.ttl-phone-chart{width:100%;height:48px}
.ttl-phone-card{display:flex;flex-direction:column;padding:10px;border-radius:12px;background:rgba(255,255,255,.07);font-size:10.5px;color:var(--ttl-deep-muted)}
.ttl-phone-card b{font-size:15px;color:var(--ttl-deep-ink);font-weight:500;font-variant-numeric:tabular-nums}
.ttl-phone-btn{margin-top:auto;padding:11px;border-radius:12px;background:var(--ttl-gold);color:#fff;font-size:12px;font-weight:500;transition:transform .2s,filter .2s}
.ttl-phone-btn:hover{filter:brightness(1.08)}
.ttl-phone-btn:active{transform:scale(.97)}
.ttl-phone-sheet{position:absolute;left:6px;right:6px;bottom:6px;padding:10px 14px 16px;border-radius:24px;background:var(--ttl-paper);color:var(--ttl-ink);display:flex;flex-direction:column;gap:10px;transform:translateY(110%);transition:transform .55s cubic-bezier(.2,.9,.2,1);box-shadow:0 -10px 30px rgba(0,0,0,.3)}
.ttl-phone-sheet[data-open]{transform:none}
.ttl-phone-grip{width:34px;height:4px;border-radius:2px;background:var(--ttl-rule);margin:0 auto 4px}
.ttl-phone-sheet b{font-size:12.5px;font-weight:500}
.ttl-phone-amt{font-size:22px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.ttl-phone-sheet button{padding:10px;border-radius:12px;background:var(--ttl-accent);color:var(--ttl-accent-ink);font-size:12px}
.ttl-phone-sent{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:4px 0}
.ttl-phone-sent small{font-size:11px;color:var(--ttl-muted)}
.ttl-phone-sent button{align-self:stretch;margin-top:6px}
.ttl-chipfloat{position:absolute;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-size:11.5px;color:var(--ttl-deep-ink);animation:ttl-bob 5s ease-in-out infinite;z-index:2}
.ttl-chipfloat svg{color:var(--ttl-gold)}
.ttl-chipfloat-a{left:6%;top:12%}
.ttl-chipfloat-b{right:6%;bottom:16%;animation-delay:-2.5s}
@keyframes ttl-bob{50%{transform:translateY(-8px)}}

.ttl-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;background:linear-gradient(90deg,var(--ttl-gold) var(--ttl-fill,50%),var(--ttl-rule) var(--ttl-fill,50%));outline-offset:6px;cursor:pointer}
.ttl-range::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--ttl-paper);border:2px solid var(--ttl-gold);box-shadow:0 2px 6px rgba(0,0,0,.2);transition:transform .2s}
.ttl-range::-webkit-slider-thumb:hover{transform:scale(1.15)}
.ttl-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--ttl-paper);border:2px solid var(--ttl-gold)}
.ttl-range-lg{height:6px;border-radius:3px}

.ttl-rep-card{position:relative;width:min(420px,100%);padding:18px;border-radius:14px;background:var(--ttl-paper);border:1px solid var(--ttl-rule);box-shadow:0 30px 60px -36px rgba(16,41,45,.4);z-index:1}
.ttl-rep-back{position:absolute;width:min(420px,80%);height:280px;transform:translate(46px,-34px) rotate(3deg);opacity:.6;z-index:0;box-shadow:none}
.ttl-stage-layer[data-on] .ttl-rep-back{animation:ttl-fan .9s .1s cubic-bezier(.2,.8,.2,1) both}
@keyframes ttl-fan{from{transform:translate(0,0) rotate(0)}}
.ttl-rep-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.ttl-rep-head b{font-weight:500}
.ttl-rep-total{font-size:28px;letter-spacing:-.03em;font-variant-numeric:tabular-nums;margin:2px 0 14px}
.ttl-rep-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
.ttl-rep-row div{display:flex;flex-direction:column;gap:2px;padding:8px;border-radius:8px;border:1px solid var(--ttl-rule);font-size:11px;color:var(--ttl-muted)}
.ttl-rep-row span{display:inline-flex;align-items:center;gap:5px}
.ttl-rep-row i{width:7px;height:7px;border-radius:2px}
.ttl-rep-row b{color:var(--ttl-ink);font-size:13px;font-weight:500;font-variant-numeric:tabular-nums}

/* coverage */
.ttl-cov{border-top:1px solid var(--ttl-rule)}
.ttl-cov-title{max-width:780px}
.ttl-cov-items{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:56px;border-top:1px solid var(--ttl-rule)}
.ttl-cov-item{display:flex;flex-direction:column;gap:2px;padding:22px 20px 22px 0;font-size:13px}
.ttl-cov-item + .ttl-cov-item{padding-left:20px;border-left:1px solid var(--ttl-rule)}
.ttl-cov-item b{font-weight:500;margin-top:14px}
.ttl-cov-item small{color:var(--ttl-muted);font-size:12.5px}
.ttl-cov-ic{display:grid;place-items:center;width:40px;height:40px;border-radius:10px;border:1px solid var(--ttl-rule);color:var(--ttl-gold);background:var(--ttl-paper)}
.ttl-cov-calc{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:48px;margin-top:48px;padding:32px;border-radius:16px;background:var(--ttl-paper);border:1px solid var(--ttl-rule)}
.ttl-cov-ctl{display:flex;flex-direction:column;gap:12px}
.ttl-cov-dep{font-size:clamp(36px,4.6vw,52px);letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
.ttl-cov-scale{display:flex;justify-content:space-between;font-size:11.5px;color:var(--ttl-muted)}
.ttl-cov-out{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.ttl-cov-out div{padding:12px;border-radius:10px;background:var(--ttl-page)}
.ttl-cov-out dt{font-size:11px;color:var(--ttl-muted)}
.ttl-cov-out dd{font-size:20px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.ttl-cov-out div[data-over] dd{color:var(--ttl-gold)}
.ttl-dots-wrap{display:flex;flex-direction:column;justify-content:center;gap:14px}
.ttl-dots{display:grid;grid-template-columns:repeat(50,1fr);gap:4px;align-content:center}
.ttl-dots i{display:block;aspect-ratio:1;border-radius:50%;background:var(--ttl-page);border:1px solid var(--ttl-rule);transition:background-color .35s,border-color .35s,transform .35s}
.ttl-dots i[data-on]{background:var(--ttl-accent);border-color:var(--ttl-accent);transform:scale(.86)}

/* pricing */
.ttl-price{background:var(--ttl-deep);color:var(--ttl-deep-ink);overflow:hidden}
.ttl-price .ttl-label{color:var(--ttl-gold)}
.ttl-price-glow{position:absolute;right:-20%;top:-30%;width:900px;height:900px;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--ttl-gold) 22%,transparent),transparent);pointer-events:none;animation:ttl-drift 16s ease-in-out infinite alternate}
.ttl-price-big{font-size:clamp(44px,6vw,76px);font-weight:400;letter-spacing:-.045em;line-height:1;color:var(--ttl-deep-muted)}
.ttl-price-big span{color:var(--ttl-deep-ink)}
.ttl-price-intro{margin-top:56px;font-size:13px;color:var(--ttl-deep-muted)}
.ttl-price-list{margin-top:16px;border-top:1px solid rgba(255,255,255,.12);max-width:820px}
.ttl-price-list > li{display:flex;align-items:center;gap:14px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.12);font-size:14.5px}
.ttl-price-check{color:var(--ttl-gold);fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.ttl-price-check path{stroke-dasharray:26}
.ttl-price-addon{flex-direction:column;align-items:stretch!important;gap:0!important}
.ttl-price-addon button{display:flex;align-items:center;gap:14px;text-align:left}
.ttl-price-addon p{padding:10px 0 2px 32px;color:var(--ttl-deep-muted);font-size:13.5px;max-width:620px}
.ttl-plus{display:grid;place-items:center;flex:none;transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.ttl-plus[data-open]{transform:rotate(135deg)}
.ttl-price .ttl-plus{color:var(--ttl-gold)}
.ttl-collapse{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s cubic-bezier(.2,.8,.2,1)}
.ttl-collapse[data-open]{grid-template-rows:1fr}
.ttl-collapse > div{overflow:hidden;min-height:0}
.ttl-compare{margin-top:40px;max-width:820px;padding:22px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}
.ttl-compare-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;font-size:13px;color:var(--ttl-deep-muted)}
.ttl-step{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.18);border-radius:999px}
.ttl-step button{width:32px;height:30px;font-size:16px;color:var(--ttl-deep-ink)}
.ttl-step output{min-width:28px;text-align:center;color:var(--ttl-deep-ink);font-variant-numeric:tabular-nums}
.ttl-cbar{display:grid;grid-template-columns:140px 1fr 110px;align-items:center;gap:14px;padding:6px 0;font-size:12.5px;color:var(--ttl-deep-muted)}
.ttl-cbar i{display:block;height:10px;border-radius:5px;background:rgba(255,255,255,.22)}
.ttl-cbar b{text-align:right;font-weight:400;color:var(--ttl-deep-ink);font-variant-numeric:tabular-nums}
.ttl-cbar-us i{background:var(--ttl-gold)}
.ttl-price .ttl-fine{color:var(--ttl-deep-muted);margin-top:10px}
.ttl-price-note{margin-top:28px!important}

/* faq */
.ttl-faq-title{margin-bottom:48px}
.ttl-faq-list{border-top:1px solid var(--ttl-rule);max-width:860px}
.ttl-faq-list li{border-bottom:1px solid var(--ttl-rule)}
.ttl-faq-list button{display:flex;justify-content:space-between;align-items:center;gap:20px;width:100%;padding:18px 0;text-align:left;font-size:15px;transition:color .2s}
.ttl-faq-list button:hover{color:var(--ttl-gold)}
.ttl-faq-list p{padding:0 48px 20px 0;color:var(--ttl-muted);max-width:700px}
.ttl-faq-more{margin-top:20px}
.ttl-faq-more a{text-decoration:underline;text-underline-offset:3px;color:var(--ttl-ink)}

/* cta */
.ttl-cta-sec{padding-top:40px;padding-bottom:40px}
.ttl-cta{position:relative;overflow:hidden;border-radius:10px;min-height:360px;display:flex;align-items:center;background:linear-gradient(120deg,var(--ttl-glow-a),var(--ttl-glow-b) 55%,var(--ttl-glow-c));transform-origin:50% 100%}
.ttl-blob{position:absolute;border-radius:50%;filter:blur(50px);pointer-events:none;will-change:transform}
.ttl-blob-a{width:520px;height:520px;left:-120px;top:-180px;background:var(--ttl-glow-a)}
.ttl-blob-b{width:460px;height:460px;right:-80px;bottom:-200px;background:var(--ttl-glow-b)}
.ttl-blob-c{width:300px;height:300px;right:28%;top:-90px;background:rgba(255,255,255,.55)}
.ttl-grain{position:absolute;inset:0;opacity:.35;mix-blend-mode:soft-light;background-image:repeating-radial-gradient(circle at 17% 32%,rgba(0,0,0,.18) 0 1px,transparent 1px 3px),repeating-radial-gradient(circle at 73% 61%,rgba(255,255,255,.3) 0 1px,transparent 1px 4px);pointer-events:none}
.ttl-cta-in{position:relative;padding:48px;max-width:640px;display:flex;flex-direction:column;gap:16px}
.ttl-cta-in > p{color:color-mix(in srgb,var(--ttl-ink) 75%,transparent);max-width:420px}
.ttl-cta-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.ttl-morph{position:relative;display:flex;align-items:center;height:48px;width:156px;border-radius:999px;background:var(--ttl-accent);color:var(--ttl-accent-ink);transition:width .6s cubic-bezier(.7,0,.2,1),background-color .45s,box-shadow .3s;overflow:hidden}
.ttl-morph[data-open]{width:min(380px,calc(100vw - 96px));background:var(--ttl-paper);box-shadow:0 0 0 1px var(--ttl-rule),0 16px 32px -20px rgba(16,41,45,.5)}
.ttl-morph[data-bad]{box-shadow:0 0 0 2px #b3412e;animation:ttl-shake .4s}
@keyframes ttl-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.ttl-morph input{position:absolute;left:0;top:0;bottom:0;width:calc(100% - 52px);padding:0 0 0 20px;border:0;outline:0;background:none;color:var(--ttl-ink);font-size:14px;opacity:0;pointer-events:none;transition:opacity .3s}
.ttl-morph[data-open] input{opacity:1;pointer-events:auto;transition-delay:.3s}
.ttl-morph button{position:absolute;right:0;top:0;bottom:0;left:0;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;font-weight:500;transition:left .6s cubic-bezier(.7,0,.2,1)}
.ttl-morph[data-open] button{left:calc(100% - 46px);right:4px;top:4px;bottom:4px;border-radius:50%;background:var(--ttl-accent);color:var(--ttl-accent-ink)}
.ttl-morph-label{transition:opacity .2s}
.ttl-morph[data-open] .ttl-morph-label{opacity:0;position:absolute;pointer-events:none}
.ttl-morph-go{display:grid;place-items:center}
.ttl-morph:not([data-open]) .ttl-morph-go{display:none}
.ttl-spin{width:16px;height:16px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:ttl-rot .7s linear infinite}
@keyframes ttl-rot{to{transform:rotate(360deg)}}
.ttl-cta-done{display:flex;align-items:center;gap:10px;font-weight:500;margin-top:12px}
.ttl-btn-glass{height:48px}

.ttl-op-sec{padding-top:40px;padding-bottom:120px}
.ttl-op{position:relative;display:grid;grid-template-columns:1fr 340px;align-items:center;gap:40px;min-height:340px;padding:48px;border-radius:10px;background:var(--ttl-deep);color:var(--ttl-deep-ink);overflow:hidden}
.ttl-op .ttl-h2{font-size:clamp(26px,3.2vw,36px)}
.ttl-op-copy{display:flex;flex-direction:column;gap:16px;max-width:500px}
.ttl-op-copy p{color:var(--ttl-deep-muted)}
.ttl-link-arrow{display:inline-flex;align-items:center;gap:8px;font-size:14px;text-decoration:underline;text-underline-offset:4px;text-decoration-color:color-mix(in srgb,var(--ttl-deep-ink) 35%,transparent)}
.ttl-link-arrow svg{transition:transform .3s}
.ttl-link-arrow:hover svg{transform:translateX(4px)}
.ttl-op-art{display:grid;place-items:center}
.ttl-dial{width:300px;height:300px}

/* resources */
.ttl-res{padding-top:40px}
.ttl-res-title{font-size:clamp(24px,2.8vw,34px);max-width:760px;margin-bottom:40px}
.ttl-res-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.ttl-res-card{display:flex;flex-direction:column;border-radius:10px;overflow:hidden;background:var(--ttl-deep);color:var(--ttl-deep-ink);transition:translate .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s}
.ttl-res-card:hover{translate:0 -6px;box-shadow:0 30px 50px -30px rgba(16,41,45,.6)}
.ttl-res-thumb{height:170px;overflow:hidden;background:var(--ttl-paper);position:relative}
.ttl-art{position:absolute;inset:0;transition:transform .8s cubic-bezier(.2,.8,.2,1)}
.ttl-res-card:hover .ttl-art{transform:scale(1.06)}
.ttl-art-dash{background:linear-gradient(160deg,var(--ttl-page),var(--ttl-paper));padding:18px 0 0 18px}
.ttl-art-win{position:relative;height:100%;border-radius:8px 0 0 0;background:var(--ttl-paper);border:1px solid var(--ttl-rule);box-shadow:0 10px 30px -20px rgba(0,0,0,.3);padding:10px 10px 10px 60px}
.ttl-art-win > i{position:absolute;top:8px;width:6px;height:6px;border-radius:50%;background:var(--ttl-rule)}
.ttl-art-win > i:nth-child(1){left:8px}
.ttl-art-win > i:nth-child(2){left:17px}
.ttl-art-win > i:nth-child(3){left:26px}
.ttl-art-side{position:absolute;left:0;top:20px;bottom:0;width:50px;border-right:1px solid var(--ttl-rule);background:repeating-linear-gradient(180deg,transparent 0 10px,var(--ttl-page) 10px 16px)}
.ttl-art-win b{display:block;font-size:15px;font-weight:400;letter-spacing:-.02em;margin:14px 0 10px;color:var(--ttl-ink)}
.ttl-art-bars{display:flex;gap:2px;height:7px}
.ttl-art-bars em:nth-child(1){background:var(--ttl-accent)}
.ttl-art-bars em:nth-child(2){background:var(--ttl-gold)}
.ttl-art-bars em:nth-child(3){background:var(--ttl-chart-c)}
.ttl-art-bars em{display:block;border-radius:2px}
.ttl-art-rows{display:block;height:60px;margin-top:12px;background:repeating-linear-gradient(180deg,var(--ttl-rule) 0 1px,transparent 1px 14px)}
.ttl-art-report{background:var(--ttl-page);display:grid;place-items:center}
.ttl-art-paper{width:150px;height:200px;margin-top:40px;padding:14px;background:var(--ttl-paper);box-shadow:0 10px 30px -14px rgba(0,0,0,.35);transform:rotate(-4deg);display:flex;flex-direction:column;gap:8px;color:var(--ttl-ink)}
.ttl-art-paper small{font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--ttl-gold)}
.ttl-art-paper b{font-size:13px;font-weight:500;line-height:1.1;letter-spacing:-.02em;text-transform:uppercase}
.ttl-art-paper svg{width:120px;height:60px;margin-top:auto}
.ttl-art-chart{background:var(--ttl-paper);padding:16px}
.ttl-art-chart svg{width:100%;height:100%}
.ttl-res-cap{display:flex;flex-direction:column;justify-content:space-between;gap:28px;padding:16px;flex:1}
.ttl-res-cap b{font-weight:400;font-size:14px;line-height:1.35}
.ttl-res-cap span{display:flex;justify-content:space-between;align-items:center;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ttl-deep-muted)}
.ttl-res-cap span svg{transition:transform .3s}
.ttl-res-card:hover .ttl-res-cap span svg{transform:translateX(4px);color:var(--ttl-gold)}

/* footer */
.ttl-foot{position:relative;padding:80px 0 0;border-top:1px solid var(--ttl-rule);overflow:hidden}
.ttl-foot-grid{display:grid;grid-template-columns:1.3fr repeat(5,1fr);gap:24px;align-items:start}
.ttl-foot-col{display:flex;flex-direction:column;gap:8px;font-size:13px}
.ttl-foot-col b{font-weight:500;margin-bottom:6px}
.ttl-foot-col a{color:var(--ttl-muted);transition:color .2s;width:max-content}
.ttl-foot-col a:hover{color:var(--ttl-ink)}
.ttl-foot-bar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:64px;padding:18px 0;border-top:1px solid var(--ttl-rule);border-bottom:1px solid var(--ttl-rule);font-size:12px;color:var(--ttl-muted)}
.ttl-foot-legal-links{display:flex;flex-wrap:wrap;gap:16px}
.ttl-foot-legal-links a:hover{color:var(--ttl-ink)}
.ttl-social{display:flex;gap:8px}
.ttl-social a{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;border:1px solid var(--ttl-rule);color:var(--ttl-ink);transition:background-color .2s,color .2s}
.ttl-social a:hover{background:var(--ttl-ink);color:var(--ttl-page)}
.ttl-legal{font-size:11px;line-height:1.6;color:var(--ttl-muted);margin-top:18px;max-width:980px}
.ttl-bigmark{display:flex;justify-content:center;margin-top:40px;font-size:clamp(80px,19vw,280px);line-height:.78;letter-spacing:-.06em;font-weight:500;color:transparent;-webkit-text-stroke:1px color-mix(in srgb,var(--ttl-ink) 22%,transparent);overflow:hidden;padding-top:.06em;user-select:none}
.ttl-bigmark span{display:inline-block;background:linear-gradient(180deg,color-mix(in srgb,var(--ttl-gold) 30%,transparent),transparent 85%);-webkit-background-clip:text;background-clip:text}

/* narrow */
@media (max-width:1080px){
.ttl-float{right:-8px}
.ttl-float-2{left:-8px}
.ttl-foot-grid{grid-template-columns:repeat(3,1fr)}
.ttl-foot-grid > .ttl-brand{grid-column:1 / -1}
}
@media (max-width:900px){
.ttl-nav-links{display:none}
.ttl-burger{display:grid}
.ttl-hide-sm{display:none}
.ttl-sheet{display:flex;flex-direction:column;position:absolute;left:12px;right:12px;top:calc(100% + 4px);padding:8px;border-radius:16px;background:var(--ttl-paper);border:1px solid var(--ttl-rule);box-shadow:0 30px 60px -30px rgba(16,41,45,.4);opacity:0;visibility:hidden;transform:translateY(-8px);transition:opacity .25s,transform .35s cubic-bezier(.2,.8,.2,1),visibility .25s}
.ttl-sheet[data-open]{opacity:1;visibility:visible;transform:none}
.ttl-sheet a{display:flex;justify-content:space-between;align-items:center;padding:14px 12px;border-radius:10px;font-size:15px}
.ttl-sheet a:hover{background:var(--ttl-page)}
.ttl-split{grid-template-columns:1fr;gap:20px}
.ttl-sec{padding:84px 0}
.ttl-floats{position:relative;inset:auto;display:flex;justify-content:center;flex-wrap:wrap;margin-top:18px;gap:10px}
.ttl-float,.ttl-float-2{position:relative;inset:auto}
.ttl-feat-grid{grid-template-columns:1fr;gap:0}
.ttl-stage-col{display:none}
.ttl-feat{min-height:0;opacity:1;padding:24px 0 48px}
.ttl-feat-inline{display:block;position:relative;height:420px;border-radius:14px;overflow:hidden;background:var(--ttl-paper);margin-bottom:12px}
.ttl-feat[data-feat="1"] .ttl-feat-inline{background:var(--ttl-deep)}
.ttl-cov-items{grid-template-columns:repeat(2,1fr)}
.ttl-cov-item:nth-child(3){padding-left:0;border-left:0}
.ttl-cov-calc{grid-template-columns:1fr;gap:28px;padding:22px}
.ttl-op{grid-template-columns:1fr;padding:32px}
.ttl-op-art{order:-1}
.ttl-res-grid{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:720px){
.ttl-dash{grid-template-columns:1fr;height:auto;min-height:540px}
.ttl-side{display:none}
.ttl-main{padding:14px}
.ttl-tabs-sm{display:flex;gap:4px;margin-top:12px;padding:3px;border-radius:9px;background:var(--ttl-page);border:1px solid var(--ttl-rule)}
.ttl-tabs-sm button{flex:1;padding:6px 4px;border-radius:6px;font-size:12px;color:var(--ttl-muted)}
.ttl-tabs-sm button[aria-selected="true"]{background:var(--ttl-paper);color:var(--ttl-ink);box-shadow:0 1px 2px rgba(16,41,45,.12)}
.ttl-ov-head{flex-direction:column;gap:12px}
.ttl-spark{max-width:none;width:100%;align-items:stretch}
.ttl-spark .ttl-seg{align-self:flex-start}
.ttl-accs{grid-template-columns:1fr}
.ttl-acc{flex-direction:row;flex-wrap:wrap;align-items:center;gap:4px 12px}
.ttl-acc-top{flex:1}
.ttl-acc-kind{width:100%}
.ttl-pick{grid-template-columns:1fr}
.ttl-swap{margin:0 auto;transform:rotate(90deg)}
.ttl-ledger li{grid-template-columns:52px 1fr auto;font-size:12px}
.ttl-led-status{display:none}
.ttl-stats{grid-template-columns:1fr;gap:28px;margin-top:56px}
.ttl-cov-items{grid-template-columns:1fr}
.ttl-cov-item + .ttl-cov-item{padding-left:0;border-left:0;border-top:1px solid var(--ttl-rule)}
.ttl-cov-out{grid-template-columns:1fr 1fr}
.ttl-dots{grid-template-columns:repeat(25,1fr);gap:3px}
.ttl-cta-in{padding:28px}
.ttl-op{padding:24px}
.ttl-dial{width:240px;height:240px}
.ttl-res-grid{grid-template-columns:1fr}
.ttl-cbar{grid-template-columns:96px 1fr 88px;gap:8px}
.ttl-foot-grid{grid-template-columns:1fr 1fr}
.ttl-foot-bar{flex-direction:column;align-items:flex-start}
.ttl-flow{width:min(300px,calc(100vw - 48px))}
.ttl-device-wrap{padding:0 12px;margin-top:44px}
.ttl-device-bezel{padding:6px;border-radius:16px}
}

@media (prefers-reduced-motion:reduce){
.ttl-root *,.ttl-root *::before,.ttl-root *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;transition-delay:0ms!important}
}
`
