"use client"

// Cairn Agents Landing — a complete landing page for an AI support-agent
// company, in one file. The art direction is the window: every section opens
// onto a landscape at a different hour (blue dawn ridges, cairn rocks at noon,
// a sea of cloud at dusk, the night sky by the call to action), and the product
// floats inside those windows as calm, dark-and-white conversation cards. A
// cairn is a stack of stones that tells the next walker where the path goes;
// the mark, the copy and the pacing all lean on that.
//
// Scroll drives it (GSAP + ScrollTrigger): the hero window opens from a framed
// photo to full bleed while the conversation inside it plays out and the agent's
// typing pill morphs into its answer. The Agent Canvas pins and walks through
// four working panels — tabs, a real file drop zone that indexes, policy
// switches, a seeded call simulation, a go-live sequence. A scripted support
// call plays with karaoke transcript, a live waveform, recalled memory and a
// sentiment line (optionally spoken aloud with the browser's own voices).
// Counters run, quotes rotate, the night window opens on the call to action.
//
// Everything but the photos is drawn here: the mark, the icons, the customer
// wordmarks, the fallback ridgelines a missing photo falls back to. Photos are
// props (Unsplash by default). Requires `gsap`.
import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

export type CnlLink = { label: string; href?: string }

export type CnlScenario = {
  /** The chip under the window, e.g. "Outage". */
  label: string
  /** The dark bubble: what just happened to the business. */
  alert: string
  /** The white bubble: the agent's answer. */
  reply: string
  replyLink?: CnlLink | null
  /** The voice pill: a caller's line, heard live. */
  voice: string
}

export type CnlLogoStyle = "script" | "badge" | "heavy" | "round" | "mono" | "serif"

export type CnlLogo = { name: string; style?: CnlLogoStyle; color?: string; src?: string }

export type CnlPanel = "create" | "policies" | "simulate" | "deploy"

export type CnlStep = { title: string; text: string; panel: CnlPanel }

export type CnlPolicy = { id: string; title: string; text: string; on?: boolean }

export type CnlChannel = { id: string; label: string; detail: string; icon?: "phone" | "chat" | "whats" | "mail" | "globe"; on?: boolean }

export type CnlSample = { name: string; size: number }

export type CnlCanvas = {
  kicker?: string
  heading?: string
  title: string
  text: string
  steps: CnlStep[]
  policies: CnlPolicy[]
  personas: string[]
  intents: string[]
  channels: CnlChannel[]
  samples: CnlSample[]
}

export type CnlLine = {
  who: "caller" | "agent"
  text: string
  /** Shown in the Memory card once this line is reached. */
  memory?: string
  /** -1 (furious) to 1 (relieved), drawn as the sentiment line. */
  mood: number
}

export type CnlCall = {
  caller: string
  topic: string
  lines: CnlLine[]
  /** Already known before the call starts. */
  memory?: string[]
  outcome?: string
}

export type CnlStat = {
  value: number
  /** Counts from here, e.g. an industry hold time down to zero. */
  from?: number
  decimals?: number
  prefix?: string
  suffix?: string
  /** Format as m:ss. */
  clock?: boolean
  label: string
  note?: string
}

export type CnlQuote = { quote: string; name: string; role: string; company: string; avatar?: string }

export type CnlImages = { hero?: string; canvas?: string; call?: string; cta?: string }

export type CnlPaletteName = "fog" | "ember"

export type CnlPalette = {
  /** Page colour, light. */
  bg: string
  /** Page colour, dark. */
  night: string
  /** The ember dot: alerts, kickers, the active step number. */
  accent: string
  /** The agent's colour: its dot, links, focus rings. */
  agent: string
  /** Fallback art behind every photo: sky top, sky bottom, four ridges near to far. */
  ridges: string[]
}

export type CnlPaletteInput = { bg?: string; night?: string; accent?: string; agent?: string; ridges?: string[] }

export type CnlTalkRequest = { name: string; email: string; company: string; volume: string; message: string }

export interface CairnAgentsLandingProps {
  brand?: string
  /** Replaces the cairn mark. */
  logo?: React.ReactNode
  nav?: CnlLink[]
  login?: CnlLink | null
  /** The nav's pill. Without an href it opens the talk-to-us dialog. */
  action?: CnlLink
  /** The pill above the headline. */
  announcement?: CnlLink | null
  /** "\n" breaks the line. Pass it in braces so the newline is real. */
  title?: string
  subtitle?: string
  /** The hero button. Without an href it opens the dialog. */
  primaryAction?: CnlLink
  scenarios?: CnlScenario[]
  /** Starting value of the live call counter in the hero; null hides it. */
  liveCalls?: number | null
  logosLabel?: string
  logos?: CnlLogo[] | null
  canvas?: CnlCanvas | null
  call?: { kicker?: string; title: string; text?: string; data: CnlCall } | null
  stats?: { kicker?: string; title?: string; items: CnlStat[] } | null
  quotes?: { kicker?: string; items: CnlQuote[] } | null
  cta?: { kicker?: string; title: string; text?: string; action?: string; assurances?: string[] } | null
  footer?: { tagline?: string; columns?: { title: string; links: CnlLink[] }[]; note?: string } | null
  images?: CnlImages
  palette?: CnlPaletteName | CnlPaletteInput
  /** "auto" follows a `.dark` class on an ancestor. */
  scheme?: "auto" | "light" | "dark"
  /** Sets the hero window's scale. A definite length; defaults to 100svh. */
  height?: string
  /** Call volumes offered in the dialog. */
  volumes?: string[]
  onTalk?: (data: CnlTalkRequest) => unknown
  onSubscribe?: (email: string) => unknown
  className?: string
  style?: React.CSSProperties
}

type CnlFile = { id: number; name: string; size: number; progress: number }

type CnlSimCall = { id: number; persona: string; intent: string; outcome: "resolved" | "handoff" | "flagged"; ms: number }

type CnlSimResult = { calls: CnlSimCall[]; resolved: number; handoff: number; flagged: number }

type CnlMark = { start: number; end: number }

// #region content
const U = (id: string, w: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&q=72&w=" + w

const DEFAULT_IMAGES = {
  hero: U("1500534314209-a25ddb2bd429", 2400),
  canvas: U("1469474968028-56623f02e42e", 2000),
  call: U("1506905925346-21bda4d32df4", 2200),
  cta: U("1519681393784-d120267933ba", 2400),
}

const PALETTES = {
  fog: {
    bg: "#f7f7f5",
    night: "#0c0d0d",
    accent: "#e4572e",
    agent: "#2a6ee0",
    ridges: ["#c9d3dc", "#e7d9cc", "#a9b8b4", "#86998f", "#5f776c", "#3c5148"],
  },
  ember: {
    bg: "#f8f5f0",
    night: "#100d0b",
    accent: "#d9480f",
    agent: "#0f7c6e",
    ridges: ["#f2c8a0", "#f6e2c8", "#d59b86", "#b9767a", "#8a5868", "#4f3646"],
  },
}

const DEFAULT_NAV = [
  { label: "Demo", href: "#demo" },
  { label: "Product", href: "#product" },
  { label: "Customers", href: "#customers" },
  { label: "Company", href: "#company" },
]

const DEFAULT_SCENARIOS = [
  {
    label: "Outage",
    alert: "Our system just went down. Customers are flooding support.",
    reply: "I'm already handling the calls. Zero wait time. Your team can focus on the fix.",
    replyLink: { label: "Learn more", href: "#product" },
    voice: "Wait. You've got every single call covered?",
  },
  {
    label: "Peak season",
    alert: "Holiday traffic is 40× normal and the queue is still climbing.",
    reply: "Every caller is answered in under a second, in their own language. Refunds under $200 are already approved.",
    replyLink: { label: "See the policies", href: "#product" },
    voice: "So nobody is on hold. At all?",
  },
  {
    label: "After hours",
    alert: "It's 3 a.m. in Manila and the whole team is asleep.",
    reply: "I remember every customer's history, so they pick up exactly where they left off. Summaries are in your inbox by 8.",
    replyLink: { label: "Hear a call", href: "#demo" },
    voice: "Even the angry ones remember you?",
  },
]

const DEFAULT_LOGOS = [
  { name: "Riovera", style: "script", color: "#b8321f" },
  { name: "Kettle", style: "badge", color: "#ef5b25" },
  { name: "ledger·one", style: "heavy", color: "#151515" },
  { name: "zippa", style: "round", color: "#6b2bd9" },
  { name: "Northbeam", style: "mono", color: "#0f5f8a" },
  { name: "Fernhill & Co.", style: "serif", color: "#2f5d3a" },
]

const DEFAULT_CANVAS = {
  kicker: "The enterprise way",
  heading: "Built for the most\ncomplex enterprises",
  title: "Agent Canvas",
  text: "Agent Canvas is a low-code environment that lets you build, test, and deploy custom voice agents fast.",
  steps: [
    { title: "Create the agent", panel: "create", text: "Choose an agent type and upload documents so your agent understands your brand, policies, and workflows." },
    { title: "Define policies", panel: "policies", text: "Write the rules in plain English: what it may approve, when it must verify identity, and when a person takes over." },
    { title: "Simulate thousands of calls", panel: "simulate", text: "Stress-test against frustrated, hurried and hard-to-hear callers before a single customer hears it." },
    { title: "Deploy everywhere", panel: "deploy", text: "Go live on phone, chat, WhatsApp and email with one switch, and watch every conversation as it happens." },
  ],
  policies: [
    { id: "refund", title: "Approve refunds up to $200", text: "Above that, draft it for a supervisor.", on: true },
    { id: "verify", title: "Verify identity before account changes", text: "Date of birth and the card's last four.", on: true },
    { id: "legal", title: "Hand off on legal or safety language", text: "Transfer to Tier 2 with a one-line summary.", on: true },
    { id: "dates", title: "Never promise delivery dates", text: "Quote the carrier's window instead.", on: false },
  ],
  personas: ["Frustrated", "In a hurry", "Second language", "Interrupts", "Elderly"],
  intents: ["Card declined", "Refund status", "Change address", "Cancel plan", "Billing dispute", "Reset password", "Order missing", "Upgrade plan"],
  channels: [
    { id: "phone", label: "Phone", detail: "+1 (415) 555-0142", icon: "phone", on: true },
    { id: "chat", label: "Web chat", detail: "help.acme.com", icon: "chat", on: true },
    { id: "whatsapp", label: "WhatsApp", detail: "Business API", icon: "whats", on: false },
    { id: "email", label: "Email", detail: "support@acme.com", icon: "mail", on: false },
  ],
  samples: [
    { name: "refund-policy-2026.pdf", size: 248000 },
    { name: "brand-voice.md", size: 18400 },
    { name: "escalation-matrix.xlsx", size: 96200 },
  ],
}

const DEFAULT_CALL = {
  kicker: "Listen in",
  title: "Memory and empathy,\non every call.",
  text: "A real conversation shape, start to finish. The agent recalls what the customer already said, reads the mood, and fixes the problem without a transfer.",
  data: {
    caller: "Maya Ortiz",
    topic: "Card services · inbound",
    memory: ["Customer since 2019", "Prefers a callback over email"],
    outcome: "Resolved in 1:52 · no hold · card unpaused",
    lines: [
      { who: "caller", mood: -0.75, text: "Hi, my card just got declined at the pharmacy, and this is the third time I've called today." },
      { who: "agent", mood: -0.55, memory: "Two earlier calls today", text: "I'm sorry, Maya. I can see both calls, so you won't have to repeat anything. A fraud check paused your card over a charge from Lisbon." },
      { who: "caller", mood: -0.6, text: "Lisbon? I haven't been there since March." },
      { who: "agent", mood: -0.1, memory: "Travel notice · Lisbon, Mar 2–9", text: "That matches your travel notice, so this one isn't you. I've blocked that merchant and unpaused your card." },
      { who: "caller", mood: 0.25, text: "Wait, so I can pay right now?" },
      { who: "agent", mood: 0.6, memory: "Ships to · Oakland, CA", text: "Right now. A replacement ships tonight to your Oakland address, and I've waived the express fee." },
      { who: "caller", mood: 0.88, text: "Okay. Wow. Thank you, honestly." },
    ],
  },
}

const DEFAULT_STATS = {
  kicker: "Zero wait time",
  title: "The queue, retired.",
  items: [
    { value: 0, from: 702, clock: true, label: "Average hold time", note: "Industry average 11:42" },
    { value: 94, suffix: "%", label: "Resolved without a hand-off" },
    { value: 41, label: "Languages and accents, natively" },
    { value: 2.1, decimals: 1, suffix: "M", label: "Calls answered every day" },
  ],
}

const DEFAULT_QUOTES = {
  kicker: "From the support floor",
  items: [
    {
      quote: "We had an outage on launch day and not one customer waited. My team fixed the bug instead of apologising for it.",
      name: "Priya Raman",
      role: "VP Customer Experience",
      company: "Riovera Lending",
      avatar: U("1494790108377-be9c29b29330", 200),
    },
    {
      quote: "It remembers the last three conversations better than our CRM does. Customers notice, and they say so on the survey.",
      name: "Daniel Okafor",
      role: "Head of Support Ops",
      company: "Kettle",
      avatar: U("1500648767791-00dcc994a43e", 200),
    },
    {
      quote: "We simulated twelve thousand angry calls before go-live. The first real one was easier than any of them.",
      name: "Lena Marsh",
      role: "Director, Contact Centre",
      company: "Northbeam",
      avatar: U("1534528741775-53994a69daeb", 200),
    },
  ],
}

const DEFAULT_CTA = {
  kicker: "Talk to us",
  title: "Every call answered.\nStarting tonight.",
  text: "Most teams are live in fourteen days, on their own numbers, with their own voice.",
  action: "Talk to us",
  assurances: ["SOC 2 Type II", "HIPAA ready", "Live in 14 days"],
}

const DEFAULT_FOOTER = {
  tagline: "AI agents for enterprise support. Every call answered, every customer remembered.",
  columns: [
    { title: "Product", links: [{ label: "Agent Canvas", href: "#product" }, { label: "Voice", href: "#demo" }, { label: "Simulations", href: "#product" }, { label: "Integrations" }] },
    { title: "Company", links: [{ label: "About" }, { label: "Customers", href: "#customers" }, { label: "Careers" }, { label: "Press" }] },
    { title: "Resources", links: [{ label: "Docs" }, { label: "Security" }, { label: "Status" }, { label: "Changelog" }] },
  ],
  note: "Made for people who pick up the phone.",
}

const DEFAULT_VOLUMES = ["Under 10k", "10k–100k", "100k–1M", "1M+"]
// #endregion content

// #region logic
function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(s.trim())
}

function formatClock(sec: number) {
  const s = Math.max(0, Math.round(sec))
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0")
}

function formatBytes(n: number) {
  if (n < 1024) return Math.round(n) + " B"
  if (n < 1024 * 1024) return Math.round(n / 1024) + " KB"
  return (n / 1048576).toFixed(1) + " MB"
}

function formatStat(v: number, decimals: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function chunksFor(bytes: number) {
  return Math.max(1, Math.ceil(bytes / 1800))
}

function fileKind(name: string) {
  const ext = (name.split(".").pop() || "").toLowerCase()
  if (/^(png|jpe?g|gif|webp|svg|heic|avif)$/.test(ext)) return "image"
  if (/^(mp3|wav|m4a|ogg|flac|aac)$/.test(ext)) return "music"
  if (/^(zip|tar|gz|rar|7z)$/.test(ext)) return "folder"
  return "doc"
}

function splitTitle(t: string) {
  return t.split("\n").map((s) => s.trim()).filter(Boolean)
}

function splitWords(t: string) {
  return t.split(/\s+/).filter(Boolean)
}

function initials(name: string) {
  const p = splitWords(name)
  if (!p.length) return "?"
  return ((p[0][0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase()
}

function nextIndex(i: number, key: string, n: number) {
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return i
}

/** Which of n steps a pinned scroll progress (0–1) is on. */
function stepAt(p: number, n: number) {
  return clamp(Math.floor(clamp(p, 0, 1) * n), 0, n - 1)
}

/** How far through step i that progress is (0–1). */
function stepLocal(p: number, n: number, i: number) {
  return clamp(p * n - i, 0, 1)
}

function sensitivityLabel(v: number) {
  if (v < 34) return "Calm: hands off rarely"
  if (v < 67) return "Balanced"
  return "Careful: hands off early"
}

function mulberry32(seed: number) {
  let a = seed | 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A deterministic batch of simulated calls. More policies flag fewer calls; more sensitivity hands off more. */
function simulateCalls(count: number, o: { seed: number; personas: string[]; intents: string[]; policies: number; sensitivity: number }) {
  const rnd = mulberry32(o.seed)
  const pool = o.personas.length ? o.personas : ["Typical"]
  const intents = o.intents.length ? o.intents : ["General question"]
  const hard = (p: string) => (/frustrat|angry/i.test(p) ? 0.035 : /interrupt/i.test(p) ? 0.02 : /second|elder|hurry/i.test(p) ? 0.012 : 0)
  const handoffBase = 0.02 + (clamp(o.sensitivity, 0, 100) / 100) * 0.08
  const flagBase = Math.max(0.004, 0.05 - clamp(o.policies, 0, 8) * 0.011)
  const calls: CnlSimCall[] = []
  let resolved = 0
  let handoff = 0
  let flagged = 0
  for (let i = 0; i < count; i++) {
    const persona = pool[Math.floor(rnd() * pool.length)]
    const intent = intents[Math.floor(rnd() * intents.length)]
    const r = rnd()
    const h = hard(persona)
    let outcome: CnlSimCall["outcome"] = "resolved"
    if (r < flagBase + h * 0.3) outcome = "flagged"
    else if (r < flagBase + h * 0.3 + handoffBase + h) outcome = "handoff"
    if (outcome === "resolved") resolved++
    else if (outcome === "handoff") handoff++
    else flagged++
    calls.push({ id: i + 1, persona, intent, outcome, ms: Math.round(280 + rnd() * 520) })
  }
  return { calls, resolved, handoff, flagged }
}

function tally(calls: CnlSimCall[], upto: number) {
  let resolved = 0
  let handoff = 0
  let flagged = 0
  const n = clamp(Math.floor(upto), 0, calls.length)
  for (let i = 0; i < n; i++) {
    const o = calls[i].outcome
    if (o === "resolved") resolved++
    else if (o === "handoff") handoff++
    else flagged++
  }
  return { done: n, resolved, handoff, flagged }
}

/** When each transcript line is spoken, from its length. */
function callTimeline(lines: { text: string }[], wps = 2.7, gap = 0.6) {
  let t = 0.4
  const marks: CnlMark[] = lines.map((l) => {
    const d = Math.max(1.4, splitWords(l.text).length / wps)
    const m = { start: t, end: t + d }
    t += d + gap
    return m
  })
  return { marks, total: t }
}

function lineAt(marks: CnlMark[], t: number) {
  let idx = -1
  for (let i = 0; i < marks.length; i++) if (marks[i].start <= t) idx = i
  return idx
}

function litWords(text: string, local: number) {
  const n = splitWords(text).length
  return clamp(Math.ceil(n * clamp(local, 0, 1)), 0, n)
}

function moodAt(lines: { mood: number }[], marks: CnlMark[], t: number) {
  if (!lines.length) return 0
  if (t <= marks[0].start) return lines[0].mood
  for (let i = 0; i < marks.length - 1; i++) {
    if (t < marks[i + 1].start) {
      const k = clamp((t - marks[i].start) / (marks[i + 1].start - marks[i].start), 0, 1)
      const e = k * k * (3 - 2 * k)
      return lines[i].mood + (lines[i + 1].mood - lines[i].mood) * e
    }
  }
  return lines[lines.length - 1].mood
}

/** The sentiment line up to time t, sampled across the whole call. */
function sentimentPath(lines: { mood: number }[], marks: CnlMark[], total: number, t: number, w: number, h: number, samples = 60) {
  let d = ""
  let x = 0
  let y = h / 2
  const upto = clamp(t, 0, total)
  for (let k = 0; k <= samples; k++) {
    const tt = Math.min((k / samples) * total, upto)
    const v = moodAt(lines, marks, tt)
    x = (tt / total) * w
    y = h / 2 - v * (h / 2 - 5)
    d += (k ? " L" : "M") + x.toFixed(1) + " " + y.toFixed(1)
    if (tt >= upto) break
  }
  return { d, x, y }
}

function moodLabel(v: number) {
  if (v < -0.4) return "Frustrated"
  if (v < 0.05) return "Uneasy"
  if (v < 0.5) return "Calmer"
  return "Relieved"
}

/** A closed mountain ridge for the fallback art. */
function ridgePath(seed: number, base: number, amp: number, w = 1600, h = 900) {
  const rnd = mulberry32(seed)
  const ph = rnd() * 6.283
  const n = 40
  let d = "M0 " + h
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * w
    const y = base - amp * (0.55 * Math.sin(i * 0.33 + ph) + 0.3 * Math.sin(i * 0.91 + ph * 2) + 0.15 * (rnd() * 2 - 1))
    d += " L" + x.toFixed(1) + " " + y.toFixed(1)
  }
  return d + " L" + w + " " + h + " Z"
}

function resolvePalette(p?: CnlPaletteName | CnlPaletteInput) {
  const base: CnlPalette = PALETTES.fog
  if (!p) return base
  if (typeof p === "string") return (p === "ember" ? PALETTES.ember : base) as CnlPalette
  return {
    bg: p.bg || base.bg,
    night: p.night || base.night,
    accent: p.accent || base.accent,
    agent: p.agent || base.agent,
    ridges: p.ridges && p.ridges.length >= 6 ? p.ridges.slice(0, 6) : base.ridges,
  }
}
// #endregion logic

const CNL_CSS = `
.cnl-root{--cnl-bg:var(--cnl-day,#f7f7f5);--cnl-ink:#111211;--cnl-mute:#5c5f5b;--cnl-faint:#878a86;--cnl-line:rgba(17,18,17,.1);--cnl-soft:#ebebe8;--cnl-card:#fff;--cnl-card-ink:#151615;--cnl-card-mute:#686b67;--cnl-card-line:rgba(0,0,0,.08);--cnl-card-soft:#f1f1ef;--cnl-dark:#0b0b0c;--cnl-serif:"Instrument Serif","Newsreader","Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;--cnl-sans:"Inter","Inter Variable",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--cnl-mono:"JetBrains Mono","SF Mono",ui-monospace,Menlo,Consolas,monospace;--cnl-in:24px;--cnl-r:14px;--cnl-sp:1;--cnl-ease:cubic-bezier(.22,1,.36,1);position:relative;background:var(--cnl-bg);color:var(--cnl-ink);font-family:var(--cnl-sans);font-size:15px;line-height:1.5;overflow-x:clip;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;isolation:isolate}
.cnl-root[data-scheme=dark],:where(.dark) .cnl-root[data-scheme=auto]{--cnl-bg:var(--cnl-night-bg,#0c0d0d);--cnl-ink:#efeeea;--cnl-mute:#a5a7a2;--cnl-faint:#7d807b;--cnl-line:rgba(255,255,255,.1);--cnl-soft:#1d1f1e;--cnl-card:#151716;--cnl-card-ink:#f0efeb;--cnl-card-mute:#a3a5a0;--cnl-card-line:rgba(255,255,255,.08);--cnl-card-soft:#202221;color-scheme:dark}
.cnl-root :where(*,*::before,*::after){box-sizing:border-box}
.cnl-root :where(h1,h2,h3,p,ol,ul,figure,blockquote){margin:0;padding:0}
.cnl-root :where(ol,ul){list-style:none}
.cnl-root :where(a){color:inherit;text-decoration:none}
.cnl-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit}
.cnl-root :where(input,select,textarea){font:inherit;color:inherit}
.cnl-root :where(a,button,input,textarea,label,[tabindex]):focus-visible{outline:2px solid var(--cnl-agent);outline-offset:3px;border-radius:8px}
.cnl-root [data-sec]{scroll-margin-top:72px}
.cnl-svg{display:block;max-width:none;flex:none}
.cnl-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.cnl-kicker{display:inline-flex;align-items:center;gap:10px;font:500 10.5px/1 var(--cnl-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--cnl-ink)}
.cnl-kicker::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--cnl-accent);box-shadow:0 0 0 4px color-mix(in oklab,var(--cnl-accent) 18%,transparent)}
.cnl-serif{font-family:var(--cnl-serif);font-weight:400;letter-spacing:-.022em}

.cnl-nav{position:sticky;top:0;z-index:40;height:68px;display:flex;align-items:center;gap:20px;padding:0 28px;transition:background-color .35s,box-shadow .35s,transform .5s var(--cnl-ease)}
.cnl-nav.is-scrolled{background:color-mix(in oklab,var(--cnl-bg) 84%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);box-shadow:0 1px 0 var(--cnl-line)}
.cnl-nav.is-hidden{transform:translateY(-102%)}
.cnl-brand{display:inline-flex;align-items:center;gap:9px;font-size:19px;font-weight:600;letter-spacing:-.03em;min-width:140px}
.cnl-brand .cnl-svg{transition:transform .6s var(--cnl-ease)}
.cnl-brand:hover .cnl-svg{transform:rotate(-8deg) translateY(-1px)}
.cnl-links{position:relative;display:flex;align-items:center;gap:2px;margin-left:44px;margin-right:auto}
.cnl-links::before{content:"";position:absolute;top:0;left:0;height:34px;width:var(--cnl-lw,0px);transform:translateX(var(--cnl-lx,0px));border-radius:999px;background:var(--cnl-soft);opacity:var(--cnl-lo,0);transition:transform .4s var(--cnl-ease),width .4s var(--cnl-ease),opacity .25s}
.cnl-link{position:relative;height:34px;display:inline-flex;align-items:center;padding:0 14px;font-size:13.5px;color:var(--cnl-mute);border-radius:999px;transition:color .2s}
.cnl-link:hover{color:var(--cnl-ink)}
.cnl-nav-end{display:flex;align-items:center;gap:22px}
.cnl-signin{font-size:13.5px;color:var(--cnl-mute);transition:color .2s}
.cnl-signin:hover{color:var(--cnl-ink)}
.cnl-burger{display:none;width:38px;height:38px;border-radius:999px;align-items:center;justify-content:center;background:var(--cnl-soft)}
.cnl-sheet{position:fixed;inset:0;z-index:60;background:var(--cnl-bg);display:flex;flex-direction:column;padding:16px 20px 28px;animation:cnl-fade .35s var(--cnl-ease)}
.cnl-sheet-top{display:flex;align-items:center;justify-content:space-between;height:44px}
.cnl-sheet-links{display:flex;flex-direction:column;gap:4px;margin-top:40px}
.cnl-sheet-links a,.cnl-sheet-links button{font-family:var(--cnl-serif);font-size:44px;line-height:1.15;letter-spacing:-.02em;animation:cnl-rise .6s var(--cnl-ease) both}
.cnl-sheet-end{margin-top:auto;display:flex;gap:12px;align-items:center}

.cnl-pill{--cnl-mx:0px;--cnl-my:0px;position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:34px;padding:0 16px;border-radius:999px;background:var(--cnl-ink);color:var(--cnl-bg);font-size:13.5px;font-weight:500;white-space:nowrap;overflow:hidden;transition:background-color .25s,box-shadow .3s;box-shadow:0 1px 0 rgba(255,255,255,.12) inset,0 6px 18px -8px rgba(0,0,0,.45)}
.cnl-pill.is-lg{height:44px;padding:0 22px;font-size:14.5px}
.cnl-pill.is-light{background:#fff;color:#111}
.cnl-pill:disabled{opacity:.45;cursor:not-allowed}
.cnl-roll{position:relative;display:inline-block;overflow:hidden;height:1.3em;line-height:1.3em}
.cnl-roll>span{display:block;transition:transform .5s var(--cnl-ease)}
.cnl-roll::after{content:attr(data-t);position:absolute;left:0;top:100%;transition:transform .5s var(--cnl-ease)}
.cnl-pill:hover .cnl-roll>span,.cnl-pill:hover .cnl-roll::after{transform:translateY(-100%)}

.cnl-hero{padding:40px 0 0}
.cnl-hero-copy{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 20px}
.cnl-badge{display:inline-flex;align-items:center;gap:10px;height:28px;padding:0 9px 0 12px;border-radius:999px;background:var(--cnl-soft);font:500 10.5px/1 var(--cnl-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--cnl-ink);margin-bottom:22px;transition:background-color .25s}
.cnl-badge:hover{background:color-mix(in oklab,var(--cnl-soft) 70%,var(--cnl-ink) 8%)}
.cnl-badge .cnl-svg{transition:transform .35s var(--cnl-ease);opacity:.6}
.cnl-badge:hover .cnl-svg{transform:translateX(3px)}
.cnl-badge-dot{position:relative;width:7px;height:7px;border-radius:50%;background:var(--cnl-ink)}
.cnl-badge-dot::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid var(--cnl-ink);opacity:0;animation:cnl-ping 2.6s var(--cnl-ease) infinite}
.cnl-title{font-family:var(--cnl-serif);font-weight:400;font-size:clamp(46px,7.4vw,78px);line-height:1.02;letter-spacing:-.03em;color:var(--cnl-ink)}
.cnl-line{display:block;overflow:hidden;padding:0 .06em .1em;margin-bottom:-.1em}
.cnl-line-in{display:inline-block;transform-origin:0 100%}
.cnl-sub{margin-top:26px;max-width:40ch;font-size:15.5px;line-height:1.8;color:var(--cnl-mute)}
.cnl-hero-cta{margin-top:22px}
.cnl-hero-stage{margin-top:72px;position:relative}
.cnl-vista.cnl-hero-vista{border-radius:0;clip-path:inset(0 var(--cnl-in) round var(--cnl-r))}

.cnl-vista{position:relative;overflow:hidden;border-radius:14px;background:#33403f;isolation:isolate;contain:paint}
.cnl-vista-media{position:absolute;left:0;right:0;top:-8%;bottom:-8%;will-change:transform}
.cnl-vista-drift{position:absolute;inset:0;will-change:transform}
.cnl-ridges,.cnl-img{position:absolute;inset:0;width:100%;height:100%;display:block;max-width:none}
.cnl-img{object-fit:cover;opacity:0;transition:opacity 1.1s ease}
.cnl-img[data-ok=true]{opacity:1}
.cnl-vista-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(8,12,18,.04) 30%,rgba(8,12,18,.3))}
:where(.dark) .cnl-root[data-scheme=auto] .cnl-vista-shade,.cnl-root[data-scheme=dark] .cnl-vista-shade{background:linear-gradient(180deg,rgba(6,8,12,.2),rgba(6,8,12,.5))}

.cnl-chat{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:72px 20px 84px}
.cnl-b{display:flex;gap:12px;border-radius:12px;font-size:13.5px;line-height:1.6;box-shadow:0 24px 50px -24px rgba(0,0,0,.55),0 2px 6px -2px rgba(0,0,0,.18)}
.cnl-b-dot{width:7px;height:7px;border-radius:50%;flex:none;margin-top:.62em}
.cnl-b-alert{background:var(--cnl-dark);color:#f2f2ef;padding:14px 22px 14px 16px;max-width:290px;margin-left:110px}
.cnl-b-alert .cnl-b-dot{background:var(--cnl-accent)}
.cnl-b-agent{position:relative;background:#fff;color:#151515;overflow:hidden;max-width:290px;margin-right:60px}
.cnl-b-agent .cnl-b-dot{background:var(--cnl-agent)}
.cnl-b-in{display:flex;gap:12px;padding:16px 22px 16px 16px}
.cnl-b-text [data-w]{display:inline-block}
.cnl-b-link{display:inline-flex;align-items:center;gap:4px;margin-top:10px;color:var(--cnl-agent);font-weight:500}
.cnl-b-link:hover{text-decoration:underline;text-underline-offset:3px}
.cnl-typing{position:absolute;left:0;top:0;width:64px;height:40px;display:flex;align-items:center;justify-content:center;gap:4px;opacity:0;visibility:hidden}
.cnl-typing i{width:5px;height:5px;border-radius:50%;background:#9a9c98;animation:cnl-bob 1s ease-in-out infinite}
.cnl-typing i:nth-child(2){animation-delay:.15s}
.cnl-typing i:nth-child(3){animation-delay:.3s}
.cnl-voice{display:flex;align-items:center;gap:12px;height:38px;padding:0 15px 0 13px;border-radius:10px;background:var(--cnl-dark);color:#f2f2ef;font-size:13.5px;white-space:nowrap;overflow:hidden;box-shadow:0 24px 50px -24px rgba(0,0,0,.55)}
.cnl-voice [data-w]{display:inline-block}
.cnl-eq{display:flex;align-items:center;gap:2px;height:14px;flex:none}
.cnl-eq i{width:2px;height:100%;border-radius:2px;background:currentColor;transform-origin:50% 50%;animation:cnl-eq .9s ease-in-out infinite}
.cnl-eq i:nth-child(2){animation-delay:-.3s}
.cnl-eq i:nth-child(3){animation-delay:-.6s}
.cnl-eq i:nth-child(4){animation-delay:-.15s}
.cnl-powered{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,.62);margin-top:-4px}
.cnl-powered b{font-weight:600;color:rgba(255,255,255,.82);letter-spacing:-.02em;font-size:13px}
.cnl-scenes{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);display:flex;gap:6px;padding:4px;border-radius:999px;background:rgba(12,14,18,.28);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.cnl-scene{position:relative;height:28px;padding:0 13px;white-space:nowrap;border-radius:999px;font-size:12px;color:rgba(255,255,255,.78);overflow:hidden;transition:background-color .3s,color .3s}
.cnl-scene:hover{color:#fff}
.cnl-scene[aria-pressed=true]{background:rgba(255,255,255,.16);color:#fff}
.cnl-scene i{position:absolute;left:12px;right:12px;bottom:4px;height:1.5px;border-radius:2px;background:#fff;transform-origin:0 50%;transform:scaleX(0)}
.cnl-scene[aria-pressed=true] i{transform:scaleX(var(--cnl-cp,0))}
.cnl-live{position:absolute;top:18px;right:18px;display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 12px;border-radius:999px;background:rgba(12,14,18,.28);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#fff;font:500 11px/1 var(--cnl-mono);letter-spacing:.04em}
.cnl-live::before{content:"";width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 3px rgba(74,222,128,.25);animation:cnl-pulse 2s ease-in-out infinite}
.cnl-live b{font-weight:600;font-variant-numeric:tabular-nums}

.cnl-logos{padding:84px 0 24px;text-align:center}
.cnl-logos-label{font-size:13px;color:var(--cnl-faint);margin-bottom:30px;padding:0 20px}
.cnl-marquee{position:relative;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)}
.cnl-track{display:flex;align-items:center;width:max-content;animation:cnl-marquee 42s linear infinite}
.cnl-marquee:hover .cnl-track{animation-play-state:paused}
.cnl-logo{display:flex;align-items:center;justify-content:center;height:56px;padding:0 44px;filter:grayscale(1);opacity:.62;transition:filter .45s,opacity .45s,transform .45s var(--cnl-ease)}
.cnl-logo:hover{filter:none;opacity:1;transform:translateY(-2px)}
:where(.dark) .cnl-root[data-scheme=auto] .cnl-logo,.cnl-root[data-scheme=dark] .cnl-logo{filter:grayscale(1) invert(1) brightness(1.4)}
:where(.dark) .cnl-root[data-scheme=auto] .cnl-logo:hover,.cnl-root[data-scheme=dark] .cnl-logo:hover{filter:grayscale(1) invert(1) brightness(1.8)}
.cnl-logo-img{display:block;max-width:none;height:28px;width:auto}
.cnl-wm{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.cnl-wm-script{position:relative;font-family:var(--cnl-serif);font-style:italic;font-weight:700;font-size:27px;letter-spacing:-.04em;padding-bottom:4px}
.cnl-wm-script .cnl-svg{position:absolute;left:-4px;bottom:-2px}
.cnl-wm-badge{font:500 12.5px/1 var(--cnl-sans);letter-spacing:.28em}
.cnl-wm-badge i{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff}
.cnl-wm-heavy{font:800 22px/1 var(--cnl-sans);letter-spacing:-.045em;color:#151515}
.cnl-wm-round{font:800 25px/1 ui-rounded,"SF Pro Rounded","Nunito",var(--cnl-sans);letter-spacing:-.03em}
.cnl-wm-mono{font:600 14px/1 var(--cnl-mono);letter-spacing:.16em}
.cnl-wm-serif{font-family:var(--cnl-serif);font-size:24px;letter-spacing:-.01em;font-variant:small-caps}

.cnl-way{padding:130px 24px 70px;text-align:center}
.cnl-h2{font-family:var(--cnl-serif);font-weight:400;font-size:clamp(38px,5.2vw,56px);line-height:1.08;letter-spacing:-.028em;margin-top:22px}
.cnl-h2 span{display:block}
.cnl-h2 [data-word]{display:inline}

.cnl-canvas{position:relative}
.cnl-canvas-pin{display:grid;grid-template-columns:minmax(0,4.6fr) minmax(0,7.4fr);gap:56px;align-items:center;padding:28px 48px;max-width:1440px;margin:0 auto}
.cnl-canvas-name{display:flex;align-items:center;gap:16px}
.cnl-canvas-name h3{font-size:30px;font-weight:400;letter-spacing:-.03em}
.cnl-orb{position:relative;width:36px;height:36px;border-radius:10px;background:var(--cnl-card);box-shadow:0 0 0 1px var(--cnl-line),0 6px 16px -8px rgba(0,0,0,.3);flex:none}
.cnl-orb::before{content:"";position:absolute;inset:7px;border-radius:50%;background:radial-gradient(circle at 32% 30%,#fff 0 8%,transparent 30%),conic-gradient(from 210deg,#ff9a76,#f6c1ff,#8ab4ff,#9ff0d5,#ffd38a,#ff9a76);filter:saturate(1.1);animation:cnl-spin 9s linear infinite}
.cnl-orb.is-sm{width:22px;height:22px;border-radius:50%;box-shadow:none;background:transparent}
.cnl-orb.is-sm::before{inset:0}
.cnl-canvas-text{margin-top:24px;max-width:38ch;font-size:14.5px;line-height:1.85;color:var(--cnl-mute)}
.cnl-steps{margin-top:44px}
.cnl-steps li{position:relative;border-top:1px solid var(--cnl-line)}
.cnl-steps li:last-child{border-bottom:1px solid var(--cnl-line)}
.cnl-step-bar{position:absolute;left:0;right:0;top:-1px;height:1px;overflow:hidden}
.cnl-step-bar i{display:block;height:100%;background:var(--cnl-ink);transform-origin:0 50%;transform:scaleX(0);transition:transform .2s linear}
.cnl-steps li.is-on .cnl-step-bar i{transform:scaleX(var(--cnl-sp,1))}
.cnl-step-btn{display:flex;align-items:baseline;gap:12px;width:100%;padding:18px 0;font-size:15px;color:var(--cnl-mute);transition:color .3s}
.cnl-step-btn:hover,.cnl-steps li.is-on .cnl-step-btn{color:var(--cnl-ink)}
.cnl-step-num{font:400 13px/1 var(--cnl-mono);color:var(--cnl-faint);transition:color .3s}
.cnl-steps li.is-on .cnl-step-num{color:var(--cnl-accent)}
.cnl-step-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .55s var(--cnl-ease)}
.cnl-step-body>div{overflow:hidden}
.cnl-step-body p{padding:0 0 20px 0;font-size:13.5px;line-height:1.85;color:var(--cnl-mute);max-width:42ch;opacity:0;transform:translateY(-6px);transition:opacity .4s,transform .5s var(--cnl-ease)}
.cnl-steps li.is-on .cnl-step-body{grid-template-rows:1fr}
.cnl-steps li.is-on .cnl-step-body p{opacity:1;transform:none;transition-delay:.12s}
.cnl-canvas-vista{height:620px}

.cnl-app{position:absolute;left:50%;top:50%;width:min(390px,calc(100% - 28px));transform:translate(-50%,-50%);background:var(--cnl-card);color:var(--cnl-card-ink);border-radius:14px;box-shadow:0 40px 90px -30px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.05)}
.cnl-app-head{position:relative;display:flex;align-items:center;justify-content:center;height:50px;padding:0 14px;border-bottom:1px solid var(--cnl-card-line)}
.cnl-app-head .cnl-orb{position:absolute;left:14px;top:14px}
.cnl-app-title{font-size:13.5px;font-weight:600;letter-spacing:-.01em;animation:cnl-roll-in .55s var(--cnl-ease) both}
.cnl-app-step{position:absolute;right:14px;font:500 10.5px/1 var(--cnl-mono);color:var(--cnl-card-mute);letter-spacing:.04em}
.cnl-app-body{padding:14px 14px 16px;overflow:hidden}
.cnl-seg{position:relative;display:grid;grid-template-columns:repeat(3,1fr);padding:3px;border-radius:9px;background:var(--cnl-card-soft)}
.cnl-seg::before{content:"";position:absolute;top:3px;bottom:3px;left:3px;width:calc((100% - 6px) / 3);border-radius:7px;background:var(--cnl-card);box-shadow:0 1px 3px rgba(0,0,0,.12),0 0 0 1px rgba(0,0,0,.03);transform:translateX(calc(var(--cnl-i,0) * 100%));transition:transform .5s var(--cnl-ease)}
.cnl-seg button{position:relative;z-index:1;height:30px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:var(--cnl-card-mute);border-radius:7px;transition:color .25s}
.cnl-seg button[aria-selected=true]{color:var(--cnl-card-ink);font-weight:600}
.cnl-seg button[aria-selected=true] .cnl-svg{color:var(--cnl-accent)}
.cnl-lbl{margin-top:16px}
.cnl-lbl b{display:block;font-size:12.5px;font-weight:600}
.cnl-lbl span{display:block;font-size:11.5px;color:var(--cnl-card-mute);margin-top:3px}
.cnl-drop{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;height:116px;margin-top:10px;border:1px dashed color-mix(in oklab,var(--cnl-card-ink) 22%,transparent);border-radius:10px;font-size:11.5px;color:var(--cnl-card-mute);cursor:pointer;transition:border-color .25s,background-color .25s}
.cnl-drop:hover,.cnl-drop.is-over{border-color:var(--cnl-agent);background:color-mix(in oklab,var(--cnl-agent) 6%,transparent)}
.cnl-drop:focus-within{outline:2px solid var(--cnl-agent);outline-offset:2px}
.cnl-drop u{text-decoration-color:color-mix(in oklab,currentColor 40%,transparent);text-underline-offset:3px}
.cnl-drop-icons{display:flex;align-items:center;gap:8px}
.cnl-drop-icons span{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;background:var(--cnl-card);box-shadow:0 0 0 1px var(--cnl-card-line),0 2px 4px -2px rgba(0,0,0,.15);color:var(--cnl-card-ink);transition:transform .45s var(--cnl-ease)}
.cnl-drop-icons em{width:14px;height:2px;border-radius:2px;background:var(--cnl-accent);margin:0 -2px}
.cnl-drop:hover .cnl-drop-icons span,.cnl-drop.is-over .cnl-drop-icons span{transform:translateY(-4px)}
.cnl-drop-icons span:nth-of-type(2){transition-delay:.04s}
.cnl-drop-icons span:nth-of-type(3){transition-delay:.08s}
.cnl-drop-icons span:nth-of-type(4){transition-delay:.12s}
.cnl-files{margin-top:10px;display:flex;flex-direction:column;gap:6px}
.cnl-file{display:grid;grid-template-columns:26px 1fr auto;align-items:center;gap:10px;padding:7px 8px;border-radius:9px;background:var(--cnl-card-soft);animation:cnl-rise .45s var(--cnl-ease) both}
.cnl-file>span:first-child{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;background:var(--cnl-card);color:var(--cnl-card-ink)}
.cnl-file-name{min-width:0}
.cnl-file-name b{display:block;font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cnl-file-name span{display:block;font-size:10.5px;color:var(--cnl-card-mute);font-variant-numeric:tabular-nums}
.cnl-file-bar{display:block;height:2px;margin-top:5px;border-radius:2px;background:var(--cnl-card-line);overflow:hidden}
.cnl-file-bar i{display:block;height:100%;background:var(--cnl-agent);transform-origin:0 50%}
.cnl-x{width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--cnl-card-mute);transition:background-color .2s,color .2s}
.cnl-x:hover{background:var(--cnl-card);color:var(--cnl-card-ink)}
.cnl-sample{margin-top:10px;font-size:11.5px;color:var(--cnl-agent);font-weight:500}
.cnl-sample:hover{text-decoration:underline;text-underline-offset:3px}
.cnl-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 2px;border-bottom:1px solid var(--cnl-card-line)}
.cnl-row:last-of-type{border-bottom:0}
.cnl-row b{display:block;font-size:12.5px;font-weight:500}
.cnl-row span{display:block;font-size:11px;color:var(--cnl-card-mute);margin-top:2px}
.cnl-row-ico{display:flex;align-items:center;gap:10px;min-width:0}
.cnl-row-ico>i{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--cnl-card-soft);flex:none}
.cnl-switch{position:relative;width:32px;height:19px;border-radius:999px;background:color-mix(in oklab,var(--cnl-card-ink) 18%,transparent);flex:none;transition:background-color .3s}
.cnl-switch::after{content:"";position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .4s var(--cnl-ease)}
.cnl-switch[aria-checked=true]{background:var(--cnl-agent)}
.cnl-switch[aria-checked=true]::after{transform:translateX(13px)}
.cnl-range{margin-top:12px;padding:12px;border-radius:10px;background:var(--cnl-card-soft)}
.cnl-range-top{display:flex;justify-content:space-between;align-items:baseline;font-size:12px}
.cnl-range-top b{font-weight:600}
.cnl-range-top span{color:var(--cnl-card-mute);font-size:11px}
.cnl-range input{width:100%;margin:10px 0 0;accent-color:var(--cnl-agent);height:18px}
.cnl-rule{margin-top:12px;font-size:11.5px;line-height:1.6;color:var(--cnl-card-mute)}
.cnl-rule em{font-style:normal;color:var(--cnl-card-ink);background:color-mix(in oklab,var(--cnl-accent) 14%,transparent);border-radius:4px;padding:1px 4px}
.cnl-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.cnl-chip{height:26px;padding:0 10px;border-radius:999px;font-size:11.5px;box-shadow:inset 0 0 0 1px var(--cnl-card-line);color:var(--cnl-card-mute);transition:background-color .25s,color .25s,box-shadow .25s}
.cnl-chip[aria-pressed=true]{background:var(--cnl-card-ink);color:var(--cnl-card);box-shadow:none}
.cnl-run{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:38px;margin-top:14px;border-radius:9px;background:var(--cnl-card-ink);color:var(--cnl-card);font-size:12.5px;font-weight:600;transition:transform .2s,opacity .2s}
.cnl-run:active{transform:scale(.985)}
.cnl-run:disabled{opacity:.5;cursor:default}
.cnl-sim-top{display:flex;align-items:baseline;justify-content:space-between;margin-top:14px;font-size:11.5px;color:var(--cnl-card-mute)}
.cnl-sim-top b{font:500 20px/1 var(--cnl-mono);color:var(--cnl-card-ink);font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.cnl-sim-bar{height:3px;border-radius:3px;background:var(--cnl-card-line);margin-top:8px;overflow:hidden}
.cnl-sim-bar i{display:block;height:100%;background:var(--cnl-agent);transform-origin:0 50%}
.cnl-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
.cnl-tile{padding:9px 10px;border-radius:9px;background:var(--cnl-card-soft)}
.cnl-tile b{display:block;font:500 15px/1.1 var(--cnl-mono);font-variant-numeric:tabular-nums}
.cnl-tile span{display:block;font-size:10.5px;color:var(--cnl-card-mute);margin-top:3px}
.cnl-feed{margin-top:10px;display:flex;flex-direction:column;gap:4px;min-height:108px}
.cnl-feed li{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:8px;font-size:11px;padding:5px 8px;border-radius:7px;background:var(--cnl-card-soft);animation:cnl-rise .35s var(--cnl-ease) both}
.cnl-feed li span{color:var(--cnl-card-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cnl-feed li code{font:10.5px var(--cnl-mono);color:var(--cnl-card-mute)}
.cnl-tag{font-size:10px;font-weight:600;padding:2px 7px;border-radius:999px;text-transform:capitalize}
.cnl-tag[data-o=resolved]{background:color-mix(in oklab,#16a34a 14%,transparent);color:#15803d}
.cnl-tag[data-o=handoff]{background:color-mix(in oklab,var(--cnl-agent) 14%,transparent);color:var(--cnl-agent)}
.cnl-tag[data-o=flagged]{background:color-mix(in oklab,var(--cnl-accent) 16%,transparent);color:var(--cnl-accent)}
.cnl-checks{margin-top:12px;display:flex;flex-direction:column;gap:7px}
.cnl-checks li{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--cnl-card-mute);transition:color .3s}
.cnl-checks li i{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px var(--cnl-card-line);transition:background-color .3s,box-shadow .3s;color:#fff}
.cnl-checks li.is-done{color:var(--cnl-card-ink)}
.cnl-checks li.is-done i{background:var(--cnl-agent);box-shadow:none}
.cnl-checks li.is-busy i{box-shadow:inset 0 0 0 2px color-mix(in oklab,var(--cnl-agent) 25%,transparent);border-top-color:var(--cnl-agent);animation:cnl-spin .8s linear infinite;background:conic-gradient(var(--cnl-agent) 0 25%,transparent 0)}
.cnl-golive{margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:color-mix(in oklab,#16a34a 10%,transparent);font-size:12px}
.cnl-golive b{display:flex;align-items:center;gap:8px;color:#15803d;font-weight:600}
.cnl-golive b::before{content:"";width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.2);animation:cnl-pulse 1.8s ease-in-out infinite}
.cnl-golive button{font-size:11.5px;color:var(--cnl-card-mute);text-decoration:underline;text-underline-offset:3px}

.cnl-call{padding:150px 24px 40px}
.cnl-sec-head{text-align:center;display:flex;flex-direction:column;align-items:center}
.cnl-sec-text{margin-top:20px;max-width:46ch;font-size:15px;line-height:1.8;color:var(--cnl-mute)}
.cnl-call-vista{max-width:1180px;margin:56px auto 0;height:640px}
.cnl-call-in{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:18px;padding:40px}
.cnl-player{width:440px;background:rgba(11,11,12,.92);color:#f1f1ee;border-radius:16px;padding:16px;box-shadow:0 40px 90px -30px rgba(0,0,0,.7);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.cnl-player-head{display:flex;align-items:center;gap:11px}
.cnl-avatar{position:relative;width:34px;height:34px;border-radius:50%;overflow:hidden;flex:none;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;background:#2a2c2b;color:#fff}
.cnl-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;max-width:none}
.cnl-player-who{min-width:0;flex:1}
.cnl-player-who b{display:block;font-size:13.5px;font-weight:600}
.cnl-player-who span{display:block;font-size:11.5px;color:rgba(255,255,255,.55)}
.cnl-clock{display:inline-flex;align-items:center;gap:7px;font:500 11px/1 var(--cnl-mono);color:rgba(255,255,255,.7);font-variant-numeric:tabular-nums}
.cnl-clock::before{content:"";width:6px;height:6px;border-radius:50%;background:#555}
.cnl-clock.is-live::before{background:var(--cnl-accent);animation:cnl-pulse 1.4s ease-in-out infinite}
.cnl-icon-btn{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.75);transition:background-color .2s,color .2s}
.cnl-icon-btn:hover{background:rgba(255,255,255,.08);color:#fff}
.cnl-icon-btn[aria-pressed=true]{color:#fff;background:rgba(255,255,255,.12)}
.cnl-wave{display:flex;align-items:center;justify-content:space-between;height:46px;margin:16px 2px 6px}
.cnl-wave i{width:3px;height:100%;border-radius:3px;background:rgba(255,255,255,.85);transform:scaleY(.08);transform-origin:50% 50%;transition:background-color .3s}
.cnl-wave[data-who=caller] i{background:color-mix(in oklab,var(--cnl-accent) 75%,#fff)}
.cnl-wave[data-who=agent] i{background:color-mix(in oklab,var(--cnl-agent) 55%,#fff)}
.cnl-tx{position:relative;height:196px;overflow:hidden;margin-top:8px;-webkit-mask-image:linear-gradient(180deg,transparent,#000 12%,#000 78%,transparent);mask-image:linear-gradient(180deg,transparent,#000 12%,#000 78%,transparent)}
.cnl-tx-track{padding:18px 2px 80px}
.cnl-tx-line{padding:7px 0;transition:opacity .5s}
.cnl-tx-line small{display:block;font:500 9.5px/1 var(--cnl-mono);letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:6px}
.cnl-tx-line[data-who=agent] small{color:color-mix(in oklab,var(--cnl-agent) 60%,#fff)}
.cnl-tx-line[data-who=caller] small{color:color-mix(in oklab,var(--cnl-accent) 65%,#fff)}
.cnl-tx-line p{font-size:13.5px;line-height:1.6}
.cnl-tx-line p span{color:rgba(255,255,255,.32);transition:color .25s}
.cnl-tx-line p span.is-lit{color:#fff}
.cnl-tx-line.is-past p span{color:rgba(255,255,255,.55)}
.cnl-tx-line.is-next{opacity:.35}
.cnl-controls{display:flex;align-items:center;gap:10px;margin-top:10px}
.cnl-play{width:36px;height:36px;border-radius:50%;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;flex:none;transition:transform .2s var(--cnl-ease)}
.cnl-play:hover{transform:scale(1.06)}
.cnl-scrub{flex:1;accent-color:#fff;height:18px;margin:0}
.cnl-time{font:500 11px/1 var(--cnl-mono);color:rgba(255,255,255,.6);font-variant-numeric:tabular-nums;min-width:74px;text-align:right}
.cnl-outcome{display:flex;align-items:center;gap:8px;margin-top:12px;padding:9px 12px;border-radius:10px;background:rgba(74,222,128,.12);color:#86efac;font-size:12px;animation:cnl-rise .5s var(--cnl-ease) both}
.cnl-mem{width:270px;background:var(--cnl-card);color:var(--cnl-card-ink);border-radius:16px;padding:16px;box-shadow:0 40px 90px -30px rgba(0,0,0,.6);align-self:center}
.cnl-mem h4{margin:0;font:500 10px/1 var(--cnl-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--cnl-card-mute)}
.cnl-mem-list{display:flex;flex-direction:column;gap:6px;margin:12px 0 18px;min-height:150px}
.cnl-mem-list li{display:flex;align-items:center;gap:8px;font-size:12px;padding:7px 9px;border-radius:8px;background:var(--cnl-card-soft);animation:cnl-pop .55s var(--cnl-ease) both}
.cnl-mem-list li .cnl-svg{color:var(--cnl-agent)}
.cnl-mem-list li.is-new{box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--cnl-agent) 40%,transparent)}
.cnl-mood{display:flex;align-items:baseline;justify-content:space-between;margin-top:6px}
.cnl-mood b{font-family:var(--cnl-serif);font-weight:400;font-size:22px;letter-spacing:-.02em}
.cnl-mood span{font:500 10.5px/1 var(--cnl-mono);color:var(--cnl-card-mute)}
.cnl-spark{display:block;max-width:none;margin-top:10px;overflow:visible}

.cnl-stats{padding:120px 24px 40px;max-width:1240px;margin:0 auto}
.cnl-stats-head{display:flex;align-items:end;justify-content:space-between;gap:24px;flex-wrap:wrap}
.cnl-stats-head h2{margin-top:18px}
.cnl-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);margin-top:52px;border-top:1px solid var(--cnl-line)}
.cnl-stat{padding:28px 24px 8px 0}
.cnl-stat+.cnl-stat{padding-left:24px;border-left:1px solid var(--cnl-line)}
.cnl-stat small{display:block;height:16px;font:500 10.5px/1 var(--cnl-mono);color:var(--cnl-faint);letter-spacing:.04em;text-decoration:line-through;text-decoration-color:var(--cnl-accent)}
.cnl-stat b{display:block;margin-top:10px;font-family:var(--cnl-serif);font-weight:400;font-size:clamp(46px,5.2vw,66px);line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.cnl-stat span{display:block;margin-top:12px;font-size:13.5px;color:var(--cnl-mute);max-width:22ch}

.cnl-quotes{padding:130px 24px 120px;max-width:1240px;margin:0 auto;display:grid;grid-template-columns:minmax(0,7fr) minmax(0,4fr);gap:72px;align-items:center}
.cnl-quote{position:relative;margin-top:26px;min-height:4.9em;font-family:var(--cnl-serif);font-size:clamp(28px,3.3vw,40px);line-height:1.22;letter-spacing:-.02em}
.cnl-quote>span{display:inline-block;animation:cnl-word .8s var(--cnl-ease) both}
.cnl-quote::before{content:"\\201C";position:absolute;left:-.5em;top:0;color:var(--cnl-accent)}
.cnl-cite{margin-top:24px;font-size:13.5px;color:var(--cnl-mute);animation:cnl-fade .6s .3s both}
.cnl-cite b{color:var(--cnl-ink);font-weight:600}
.cnl-people{display:flex;flex-direction:column;border-top:1px solid var(--cnl-line)}
.cnl-person{position:relative;display:flex;align-items:center;gap:14px;padding:16px 4px;border-bottom:1px solid var(--cnl-line);opacity:.5;transition:opacity .35s}
.cnl-person:hover,.cnl-person[aria-current=true]{opacity:1}
.cnl-person .cnl-avatar{width:42px;height:42px;background:var(--cnl-soft);color:var(--cnl-ink)}
.cnl-person b{display:block;font-size:14px;font-weight:600}
.cnl-person span{display:block;font-size:12.5px;color:var(--cnl-mute)}
.cnl-person i{position:absolute;left:0;right:0;bottom:-1px;height:1px;background:var(--cnl-ink);transform-origin:0 50%;transform:scaleX(0)}
.cnl-person[aria-current=true] i{animation:cnl-bar 7s linear both}
.cnl-people:hover .cnl-person i{animation-play-state:paused}

.cnl-cta{padding:40px 24px 0}
.cnl-cta-vista{height:clamp(540px,86svh,780px)}
.cnl-cta-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 22px;color:#fff}
.cnl-cta-in .cnl-kicker{color:#fff}
.cnl-cta-in .cnl-h2{font-size:clamp(42px,6.4vw,76px);text-shadow:0 2px 30px rgba(0,0,0,.25)}
.cnl-cta-in .cnl-sec-text{color:rgba(255,255,255,.78)}
.cnl-form{margin-top:30px;display:flex;align-items:center;gap:6px;width:min(440px,100%);height:52px;padding:5px 5px 5px 18px;border-radius:999px;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);transition:box-shadow .25s}
.cnl-form:focus-within{box-shadow:inset 0 0 0 1px rgba(255,255,255,.6)}
.cnl-form.is-error{animation:cnl-shake .4s}
.cnl-form input{flex:1;min-width:0;height:100%;border:0;background:transparent;outline:none;color:#fff;font-size:14.5px}
.cnl-form input::placeholder{color:rgba(255,255,255,.6)}
.cnl-form .cnl-pill{height:42px}
.cnl-form-msg{margin-top:12px;min-height:20px;font-size:12.5px;color:rgba(255,255,255,.8)}
.cnl-sent{margin-top:30px;display:inline-flex;align-items:center;gap:10px;height:52px;padding:0 22px;border-radius:999px;background:#fff;color:#111;font-size:14px;animation:cnl-pop .6s var(--cnl-ease) both}
.cnl-assure{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 22px;margin-top:22px;font:500 10.5px/1 var(--cnl-mono);letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.cnl-assure li{display:flex;align-items:center;gap:7px}

.cnl-foot{padding:90px 28px 0;overflow:hidden}
.cnl-foot-top{display:grid;grid-template-columns:minmax(0,1.3fr) repeat(3,minmax(0,1fr));gap:40px;max-width:1240px;margin:0 auto}
.cnl-foot-brand p{margin-top:16px;max-width:30ch;font-size:13.5px;line-height:1.75;color:var(--cnl-mute)}
.cnl-status{display:inline-flex;align-items:center;gap:8px;margin-top:20px;font-size:12px;color:var(--cnl-mute)}
.cnl-status::before{content:"";width:7px;height:7px;border-radius:50%;background:#22c55e}
.cnl-foot h4{margin:0 0 14px;font:500 10.5px/1 var(--cnl-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--cnl-faint)}
.cnl-foot-col li+li{margin-top:9px}
.cnl-foot-col a,.cnl-foot-col button{font-size:13.5px;color:var(--cnl-mute);transition:color .2s}
.cnl-foot-col a:hover,.cnl-foot-col button:hover{color:var(--cnl-ink)}
.cnl-foot-word{margin-top:70px;height:clamp(110px,19vw,290px);overflow:hidden;text-align:center;-webkit-mask-image:linear-gradient(180deg,#000 55%,transparent);mask-image:linear-gradient(180deg,#000 55%,transparent)}
.cnl-foot-word span{display:inline-flex;align-items:center;gap:.08em;font-family:var(--cnl-serif);font-size:clamp(150px,27vw,420px);line-height:.92;letter-spacing:-.05em;color:var(--cnl-ink)}
.cnl-foot-bottom{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;max-width:1240px;margin:0 auto;padding:22px 0 28px;border-top:1px solid var(--cnl-line);font-size:12.5px;color:var(--cnl-faint)}
.cnl-foot-bottom nav{display:flex;gap:18px}

.cnl-dialog{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,10,12,.45);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:cnl-fade .3s both}
.cnl-dialog-box{position:relative;width:min(460px,100%);max-height:calc(100vh - 40px);overflow:auto;background:var(--cnl-card);color:var(--cnl-card-ink);border-radius:18px;padding:26px;box-shadow:0 50px 120px -30px rgba(0,0,0,.6);animation:cnl-pop .5s var(--cnl-ease) both}
.cnl-dialog-box h2{font-family:var(--cnl-serif);font-weight:400;font-size:34px;letter-spacing:-.025em;line-height:1.1}
.cnl-dialog-box>p{margin-top:8px;font-size:13.5px;color:var(--cnl-card-mute);line-height:1.6}
.cnl-dialog-close{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:var(--cnl-card-mute)}
.cnl-dialog-close:hover{background:var(--cnl-card-soft);color:var(--cnl-card-ink)}
.cnl-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}
.cnl-field{display:flex;flex-direction:column;gap:6px;min-width:0;font-size:12px;font-weight:500}
.cnl-field.is-wide{grid-column:1/-1}
.cnl-field input,.cnl-field textarea{width:100%;height:40px;padding:0 12px;border-radius:9px;border:0;background:var(--cnl-card-soft);box-shadow:inset 0 0 0 1px var(--cnl-card-line);font-size:13.5px;font-weight:400;outline:none;transition:box-shadow .2s}
.cnl-field textarea{height:76px;padding:10px 12px;resize:none}
.cnl-field input:focus,.cnl-field textarea:focus{box-shadow:inset 0 0 0 1.5px var(--cnl-agent)}
.cnl-field.is-bad input{box-shadow:inset 0 0 0 1.5px var(--cnl-accent)}
.cnl-field em{font-style:normal;font-weight:400;font-size:11px;color:var(--cnl-accent)}
.cnl-vol{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:3px;border-radius:9px;background:var(--cnl-card-soft)}
.cnl-vol button{height:30px;border-radius:7px;font-size:11.5px;font-weight:500;color:var(--cnl-card-mute);transition:background-color .25s,color .25s}
.cnl-vol button[aria-checked=true]{background:var(--cnl-card);color:var(--cnl-card-ink);box-shadow:0 1px 3px rgba(0,0,0,.12)}
.cnl-dialog-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px}
.cnl-dialog-foot small{font-size:11.5px;color:var(--cnl-card-mute)}
.cnl-done{display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px 4px 8px}
.cnl-done i{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--cnl-agent);color:#fff;animation:cnl-pop .6s var(--cnl-ease) both}
.cnl-done h2{margin-top:18px}
.cnl-done p{margin-top:8px;font-size:13.5px;color:var(--cnl-card-mute);max-width:32ch;line-height:1.6}

@keyframes cnl-ping{0%{transform:scale(.6);opacity:.7}80%,100%{transform:scale(1.8);opacity:0}}
@keyframes cnl-bob{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-3px);opacity:1}}
@keyframes cnl-eq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
@keyframes cnl-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes cnl-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes cnl-spin{to{transform:rotate(360deg)}}
@keyframes cnl-roll-in{from{transform:translateY(60%);opacity:0;filter:blur(4px)}to{transform:none;opacity:1;filter:none}}
@keyframes cnl-rise{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
@keyframes cnl-pop{from{transform:translateY(10px) scale(.96);opacity:0}to{transform:none;opacity:1}}
@keyframes cnl-fade{from{opacity:0}to{opacity:1}}
@keyframes cnl-word{from{transform:translateY(.35em);opacity:0;filter:blur(6px)}to{transform:none;opacity:1;filter:none}}
@keyframes cnl-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes cnl-shake{0%,100%{transform:none}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}

@media (max-width:1023px){
.cnl-canvas-pin{grid-template-columns:1fr;gap:40px;padding:20px 24px}
.cnl-canvas-vista{height:600px}
.cnl-quotes{grid-template-columns:1fr;gap:40px}
.cnl-stat-grid{grid-template-columns:repeat(2,1fr)}
.cnl-stat:nth-child(3){padding-left:0;border-left:0}
.cnl-stat:nth-child(n+3){border-top:1px solid var(--cnl-line)}
.cnl-call-vista{height:auto}
.cnl-call-in{position:relative;flex-direction:column;padding:48px 20px}
.cnl-player{width:min(440px,100%)}
.cnl-mem{width:min(440px,100%)}
.cnl-foot-top{grid-template-columns:repeat(3,1fr)}
.cnl-foot-brand{grid-column:1/-1}
}
@media (max-width:860px){
.cnl-links,.cnl-signin{display:none}
.cnl-burger{display:inline-flex}
.cnl-nav{padding:0 16px;gap:12px}
.cnl-nav-end{margin-left:auto;gap:10px}
.cnl-brand{min-width:0}
}
@media (max-width:640px){
.cnl-root{--cnl-in:12px}
.cnl-hero{padding-top:28px}
.cnl-hero-stage{margin-top:52px}
.cnl-chat{padding:64px 16px 80px;gap:16px}
.cnl-b-alert,.cnl-b-agent{margin:0;max-width:min(300px,100%)}
.cnl-b-alert{align-self:flex-end}
.cnl-b-agent{align-self:flex-start}
.cnl-voice{font-size:12.5px}
.cnl-live{top:12px;right:12px}
.cnl-scene{padding:0 10px;font-size:11.5px}
.cnl-mem-list{min-height:0}
.cnl-logo{padding:0 28px}
.cnl-way{padding:96px 20px 48px}
.cnl-canvas-pin{padding:12px 16px}
.cnl-canvas-vista{height:590px}
.cnl-call{padding:110px 16px 24px}
.cnl-call-in{padding:28px 12px}
.cnl-player{padding:14px}
.cnl-stats{padding:96px 20px 24px}
.cnl-stat-grid{grid-template-columns:1fr}
.cnl-stat,.cnl-stat+.cnl-stat{padding:24px 0 8px;border-left:0}
.cnl-stat+.cnl-stat{border-top:1px solid var(--cnl-line)}
.cnl-quotes{padding:96px 20px 90px}
.cnl-quote{padding-left:.5em}
.cnl-quote::before{left:0}
.cnl-cta{padding:24px 12px 0}
.cnl-form{height:auto;flex-direction:column;align-items:stretch;padding:6px;border-radius:22px}
.cnl-form input{height:44px;padding:0 12px}
.cnl-form .cnl-pill{height:44px}
.cnl-foot{padding:70px 20px 0}
.cnl-foot-top{grid-template-columns:1fr 1fr}
.cnl-fields{grid-template-columns:1fr}
.cnl-vol{grid-template-columns:repeat(2,1fr)}
}
@media (prefers-reduced-motion:reduce){
.cnl-track,.cnl-orb::before,.cnl-badge-dot::after,.cnl-eq i,.cnl-typing i,.cnl-live::before,.cnl-golive b::before,.cnl-clock.is-live::before{animation:none}
.cnl-quote>span,.cnl-cite,.cnl-file,.cnl-feed li,.cnl-mem-list li,.cnl-app-title,.cnl-sheet,.cnl-sheet-links a,.cnl-sheet-links button,.cnl-outcome,.cnl-sent,.cnl-dialog,.cnl-dialog-box,.cnl-done i{animation-duration:.01ms}
.cnl-person[aria-current=true] i{animation:none;transform:scaleX(1)}
.cnl-roll>span,.cnl-roll::after,.cnl-img,.cnl-step-body,.cnl-step-body p,.cnl-logo,.cnl-drop-icons span,.cnl-seg::before,.cnl-switch::after{transition:none}
.cnl-track{flex-wrap:wrap;justify-content:center;width:auto}
.cnl-logo[aria-hidden=true]{display:none}
}
`

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function useReduced() {
  const [r, setR] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    const f = () => setR(m.matches)
    f()
    m.addEventListener("change", f)
    return () => m.removeEventListener("change", f)
  }, [])
  return r
}

function useVisible(ref: React.RefObject<HTMLElement | null>, threshold = 0.2) {
  const [v, setV] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setV(true)
      return
    }
    const io = new IntersectionObserver(([e]) => setV(e.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold])
  return v
}

const ICONS = {
  chev: <path d="m9 6 6 6-6 6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  multi: (
    <>
      <rect x="3" y="8" width="12" height="12" rx="2" />
      <path d="M9 4h9a2 2 0 0 1 2 2v9" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  doc: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-9 9" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  play: <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  restart: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="m17 9 5 6M22 9l-5 6" />
    </>
  ),
  check: <path d="m5 12 5 5 9-10" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 9h16M4 15h16" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  whats: <path d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19z" />,
  shield: <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />,
  spark: <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" />,
  memory: (
    <>
      <path d="M12 3a6 6 0 0 0-6 6c0 2.4 1.3 3.8 2.5 5 .8.8 1.5 1.7 1.5 3h4c0-1.3.7-2.2 1.5-3 1.2-1.2 2.5-2.6 2.5-5a6 6 0 0 0-6-6z" />
      <path d="M10 21h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6z" />,
}

type CnlIconName = keyof typeof ICONS

function Icon({ name, size = 16, stroke = 1.7 }: { name: CnlIconName; size?: number; stroke?: number }) {
  return (
    <svg className="cnl-svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

/** The cairn: four stacked stones. */
function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg className="cnl-svg" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
      <ellipse cx="16" cy="25.6" rx="11.6" ry="4.4" />
      <ellipse cx="15" cy="16.7" rx="8" ry="3.5" />
      <ellipse cx="16.7" cy="9.5" rx="5.1" ry="2.6" />
      <ellipse cx="15.7" cy="4.3" rx="2.7" ry="1.6" />
    </svg>
  )
}

function Ridges({ tones }: { tones: string[] }) {
  const id = "cnl" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const t = tones.length >= 6 ? tones : PALETTES.fog.ridges
  return (
    <svg className="cnl-ridges" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id + "s"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t[0]} />
          <stop offset="0.7" stopColor={t[1]} />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={"url(#" + id + "s)"} />
      <path d={ridgePath(3, 470, 70)} fill={t[2]} opacity="0.75" />
      <path d={ridgePath(11, 560, 80)} fill={t[3]} opacity="0.85" />
      <path d={ridgePath(23, 660, 70)} fill={t[4]} />
      <path d={ridgePath(41, 780, 60)} fill={t[5]} />
    </svg>
  )
}

function Vista({
  src,
  tones,
  className,
  style,
  children,
  eager,
}: {
  src?: string
  tones: string[]
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  eager?: boolean
}) {
  const [state, setState] = React.useState("load")
  const img = React.useRef(null as HTMLImageElement | null)
  React.useEffect(() => {
    const el = img.current
    setState(el && el.complete && el.naturalWidth ? "ok" : "load")
  }, [src])
  return (
    <div className={"cnl-vista" + (className ? " " + className : "")} style={style}>
      <div className="cnl-vista-media" data-vista-media="">
        <div className="cnl-vista-drift" data-vista-drift="">
          <Ridges tones={tones} />
          {src && state !== "fail" ? (
            <img
              ref={img}
              className="cnl-img"
              src={src}
              alt=""
              decoding="async"
              loading={eager ? "eager" : "lazy"}
              data-ok={state === "ok" ? "true" : "false"}
              onLoad={() => setState("ok")}
              onError={() => setState("fail")}
            />
          ) : null}
        </div>
      </div>
      <div className="cnl-vista-shade" aria-hidden="true" />
      {children}
    </div>
  )
}

function Pill({
  label,
  href,
  onClick,
  size,
  tone,
  type,
  disabled,
  reduced,
}: {
  label: string
  href?: string
  onClick?: (e: React.MouseEvent) => void
  size?: "lg"
  tone?: "light"
  type?: "submit" | "button"
  disabled?: boolean
  reduced?: boolean
}) {
  const ref = React.useRef(null as HTMLElement | null)
  const cls = "cnl-pill" + (size ? " is-lg" : "") + (tone ? " is-light" : "")
  const move = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || reduced || e.pointerType !== "mouse") return
    const r = el.getBoundingClientRect()
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4, ease: "power3.out" })
  }
  const leave = () => {
    if (ref.current) gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.45)" })
  }
  const inner = (
    <span className="cnl-roll" data-t={label}>
      <span>{label}</span>
    </span>
  )
  if (href)
    return (
      <a ref={(n) => { ref.current = n }} className={cls} href={href} onClick={onClick} onPointerMove={move} onPointerLeave={leave} data-magnetic="">
        {inner}
      </a>
    )
  return (
    <button ref={(n) => { ref.current = n }} className={cls} type={type || "button"} onClick={onClick} disabled={disabled} onPointerMove={move} onPointerLeave={leave} data-magnetic="">
      {inner}
    </button>
  )
}

function Avatar({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = React.useState(false)
  return (
    <span className="cnl-avatar">
      {initials(name)}
      {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} /> : null}
    </span>
  )
}

function Words({ text }: { text: string }) {
  const ws = splitWords(text)
  return (
    <>
      {ws.map((w, k) => (
        <React.Fragment key={k}>
          <span data-w="">{w}</span>
          {k < ws.length - 1 ? " " : ""}
        </React.Fragment>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ nav */

function Nav({
  brand,
  logo,
  nav,
  login,
  action,
  onAction,
  onNav,
  reduced,
}: {
  brand: string
  logo?: React.ReactNode
  nav: CnlLink[]
  login: CnlLink | null
  action: CnlLink
  onAction: () => void
  onNav: (href: string | undefined, e?: React.MouseEvent) => void
  reduced: boolean
}) {
  const [scrolled, setScrolled] = React.useState(false)
  const [hidden, setHidden] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const links = React.useRef(null as HTMLDivElement | null)

  React.useEffect(() => {
    let last = window.scrollY
    const on = () => {
      const y = window.scrollY
      setScrolled(y > 8)
      if (y > 640 && y - last > 6) setHidden(true)
      else if (last - y > 6 || y < 640) setHidden(false)
      last = y
    }
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [open])

  const hover = (e: React.PointerEvent | React.FocusEvent) => {
    const box = links.current
    const el = e.currentTarget as HTMLElement
    if (!box) return
    box.style.setProperty("--cnl-lx", el.offsetLeft + "px")
    box.style.setProperty("--cnl-lw", el.offsetWidth + "px")
    box.style.setProperty("--cnl-lo", "1")
  }
  const out = () => links.current && links.current.style.setProperty("--cnl-lo", "0")
  const act = (e: React.MouseEvent) => {
    if (!action.href) {
      e.preventDefault()
      onAction()
    } else onNav(action.href, e)
  }

  return (
    <header className={"cnl-nav" + (scrolled ? " is-scrolled" : "") + (hidden && !open ? " is-hidden" : "")}>
      <a className="cnl-brand" href="#top" onClick={(e) => onNav("#top", e)} aria-label={brand + ", home"}>
        {logo || <Mark />}
        <span>{brand}</span>
      </a>
      <nav className="cnl-links" ref={links} aria-label="Main" onPointerLeave={out}>
        {nav.map((l) => (
          <a key={l.label} className="cnl-link" href={l.href || "#"} onPointerEnter={hover} onFocus={hover} onBlur={out} onClick={(e) => onNav(l.href, e)}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="cnl-nav-end">
        {login ? (
          <a className="cnl-signin" href={login.href || "#"}>
            {login.label}
          </a>
        ) : null}
        <Pill label={action.label} href={action.href} onClick={act} reduced={reduced} />
        <button className="cnl-burger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Icon name="menu" size={18} />
        </button>
      </div>
      {open ? (
        <div className="cnl-sheet" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="cnl-sheet-top">
            <span className="cnl-brand">
              {logo || <Mark />}
              <span>{brand}</span>
            </span>
            <button className="cnl-burger" aria-label="Close menu" onClick={() => setOpen(false)} autoFocus>
              <Icon name="x" size={18} />
            </button>
          </div>
          <div className="cnl-sheet-links">
            {nav.map((l, k) => (
              <a
                key={l.label}
                href={l.href || "#"}
                style={{ animationDelay: 60 + k * 50 + "ms" }}
                onClick={(e) => {
                  setOpen(false)
                  onNav(l.href, e)
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="cnl-sheet-end">
            <Pill
              label={action.label}
              size="lg"
              onClick={(e) => {
                setOpen(false)
                act(e)
              }}
            />
            {login ? (
              <a className="cnl-signin" style={{ display: "inline" }} href={login.href || "#"}>
                {login.label}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  )
}

/* ------------------------------------------------------------------ hero */

function HeroChat({ scenarios, brand, reduced, liveCalls, onNav }: { scenarios: CnlScenario[]; brand: string; reduced: boolean; liveCalls: number | null; onNav: (href: string | undefined, e?: React.MouseEvent) => void }) {
  const [i, setI] = React.useState(0)
  const [hover, setHover] = React.useState(false)
  const [live, setLive] = React.useState(liveCalls || 0)
  const wrap = React.useRef(null as HTMLDivElement | null)
  const alert = React.useRef(null as HTMLDivElement | null)
  const agent = React.useRef(null as HTMLDivElement | null)
  const typing = React.useRef(null as HTMLDivElement | null)
  const body = React.useRef(null as HTMLDivElement | null)
  const voice = React.useRef(null as HTMLDivElement | null)
  const tl = React.useRef(null as gsap.core.Timeline | null)
  const visible = useVisible(wrap, 0.15)
  const n = scenarios.length
  const s = scenarios[i % n]

  useIso(() => {
    const a = agent.current
    const c = alert.current
    const v = voice.current
    const t = typing.current
    const b = body.current
    const w = wrap.current
    if (!a || !c || !v || !t || !b || !w) return
    const ctx = gsap.context(() => {
      if (reduced) {
        w.style.setProperty("--cnl-cp", "1")
        return
      }
      const aw = a.offsetWidth
      const ah = a.offsetHeight
      const vw = v.offsetWidth
      const vh = v.offsetHeight
      const x = gsap.timeline({
        onUpdate: () => w.style.setProperty("--cnl-cp", String(x.progress())),
        onComplete: () => setI((k) => (k + 1) % n),
      })
      x.set([c, a, v, b], { autoAlpha: 0 })
      x.set(t, { autoAlpha: 1 })
      x.fromTo(c, { y: 26, scale: 0.92, filter: "blur(10px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.85, ease: "expo.out" }, 0.25)
      x.fromTo(a, { width: 64, height: 40, y: 18, scale: 0.86 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }, 1.2)
      x.to(t, { autoAlpha: 0, duration: 0.2 }, 2.6)
      x.to(a, { width: aw, height: ah, duration: 0.85, ease: "expo.inOut" }, 2.55)
      x.set(b, { autoAlpha: 1 }, 2.95)
      x.fromTo(b.querySelectorAll("[data-w],[data-link]"), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.024, ease: "power2.out" }, 2.95)
      x.fromTo(v, { width: vh, y: 16, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, 4.35)
      x.to(v, { width: vw, duration: 0.8, ease: "expo.inOut" }, 4.7)
      x.fromTo(v.querySelectorAll("[data-w]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, stagger: 0.07 }, 5.05)
      x.add(() => {
        gsap.set([a, v], { clearProps: "width,height" })
      }, 5.6)
      x.to({}, { duration: 3.6 })
      x.to([c, a, v], { autoAlpha: 0, y: -18, filter: "blur(8px)", duration: 0.5, stagger: 0.07, ease: "power2.in" })
      tl.current = x
    }, w)
    return () => {
      ctx.revert()
      tl.current = null
    }
  }, [i, reduced, n, s.alert, s.reply, s.voice])

  React.useEffect(() => {
    const x = tl.current
    if (!x) return
    if (hover || !visible) x.pause()
    else x.resume()
  }, [hover, visible, i, reduced])

  React.useEffect(() => {
    if (liveCalls == null || reduced || !visible) return
    const id = window.setInterval(() => setLive((v) => Math.max(0, v + Math.round(Math.random() * 15 - 4))), 1400)
    return () => window.clearInterval(id)
  }, [liveCalls, reduced, visible])

  return (
    <div className="cnl-chat" ref={wrap} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)} data-chat="">
      {liveCalls != null ? (
        <p className="cnl-live" aria-label={live.toLocaleString("en-US") + " calls live now"}>
          <b>{live.toLocaleString("en-US")}</b> calls live
        </p>
      ) : null}
      <div className="cnl-b cnl-b-alert" ref={alert} data-depth="1.4">
        <span className="cnl-b-dot" aria-hidden="true" />
        <p>{s.alert}</p>
      </div>
      <div className="cnl-b cnl-b-agent" ref={agent} data-depth="0.8">
        <div className="cnl-typing" ref={typing} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="cnl-b-in" ref={body}>
          <span className="cnl-b-dot" aria-hidden="true" />
          <div>
            <p className="cnl-b-text">
              <Words text={s.reply} />
            </p>
            {s.replyLink ? (
              <a className="cnl-b-link" data-link="" href={s.replyLink.href || "#"} onClick={(e) => onNav(s.replyLink ? s.replyLink.href : undefined, e)}>
                {s.replyLink.label}
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="cnl-voice" ref={voice} data-depth="0.4">
        <span className="cnl-eq" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>
          <Words text={s.voice} />
        </span>
      </div>
      <p className="cnl-powered">
        Powered by <Mark size={14} />
        <b>{brand}</b>
      </p>
      {n > 1 ? (
        <div className="cnl-scenes" role="group" aria-label="Scenarios">
          {scenarios.map((sc, k) => (
            <button key={sc.label + k} className="cnl-scene" aria-pressed={k === i} onClick={() => setI(k)}>
              {sc.label}
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Hero({
  announcement,
  title,
  subtitle,
  primary,
  onPrimary,
  image,
  tones,
  height,
  scenarios,
  brand,
  reduced,
  liveCalls,
  onNav,
}: {
  announcement: CnlLink | null
  title: string
  subtitle: string
  primary: CnlLink
  onPrimary: () => void
  image?: string
  tones: string[]
  height: string
  scenarios: CnlScenario[]
  brand: string
  reduced: boolean
  liveCalls: number | null
  onNav: (href: string | undefined, e?: React.MouseEvent) => void
}) {
  const lines = splitTitle(title)
  return (
    <section className="cnl-hero" data-sec="top">
      <div className="cnl-hero-copy">
        {announcement ? (
          <a className="cnl-badge" data-intro="" href={announcement.href || "#"} onClick={(e) => onNav(announcement.href, e)}>
            <span className="cnl-badge-dot" aria-hidden="true" />
            <span>{announcement.label}</span>
            <Icon name="chev" size={12} stroke={2} />
          </a>
        ) : null}
        <h1 className="cnl-title" aria-label={lines.join(" ")}>
          {lines.map((l, k) => (
            <span key={k} className="cnl-line" aria-hidden="true">
              <span className="cnl-line-in" data-line="">
                {l}
              </span>
            </span>
          ))}
        </h1>
        <p className="cnl-sub" data-intro="">
          {subtitle}
        </p>
        <div className="cnl-hero-cta" data-intro="">
          <Pill
            label={primary.label}
            href={primary.href}
            reduced={reduced}
            onClick={(e) => {
              if (!primary.href) {
                e.preventDefault()
                onPrimary()
              } else onNav(primary.href, e)
            }}
          />
        </div>
      </div>
      <div className="cnl-hero-stage" data-hero-stage="">
        <Vista className="cnl-hero-vista" src={image} tones={tones} eager style={{ height: "clamp(460px, calc(" + height + " * 0.66), 860px)" }}>
          <HeroChat scenarios={scenarios} brand={brand} reduced={reduced} liveCalls={liveCalls} onNav={onNav} />
        </Vista>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ logos */

function Wordmark({ logo }: { logo: CnlLogo }) {
  const c = logo.color || "currentColor"
  if (logo.src) return <img className="cnl-logo-img" src={logo.src} alt={logo.name} loading="lazy" />
  switch (logo.style) {
    case "script":
      return (
        <span className="cnl-wm cnl-wm-script" style={{ color: c }}>
          {logo.name}
          <svg className="cnl-svg" width="74" height="10" viewBox="0 0 74 10" aria-hidden="true">
            <path d="M2 7c18-5 44-7 70-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </span>
      )
    case "badge":
      return (
        <span className="cnl-wm cnl-wm-badge" style={{ color: c }}>
          <i style={{ background: c }}>
            <svg className="cnl-svg" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 11 11 3M7 11l4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </i>
          {logo.name.toUpperCase()}
        </span>
      )
    case "heavy":
      return (
        <span className="cnl-wm cnl-wm-heavy" style={{ color: logo.color }}>
          {logo.name}
        </span>
      )
    case "round":
      return (
        <span className="cnl-wm cnl-wm-round" style={{ color: c }}>
          {logo.name}
        </span>
      )
    case "mono":
      return (
        <span className="cnl-wm cnl-wm-mono" style={{ color: c }}>
          <svg className="cnl-svg" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 1 19 10 10 19 1 10z" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="2" />
          </svg>
          {logo.name.toUpperCase()}
        </span>
      )
    default:
      return (
        <span className="cnl-wm cnl-wm-serif" style={{ color: c }}>
          {logo.name}
        </span>
      )
  }
}

function Logos({ logos, label }: { logos: CnlLogo[]; label: string }) {
  return (
    <section className="cnl-logos" data-sec="customers" aria-label="Customers">
      {label ? (
        <p className="cnl-logos-label" data-reveal="">
          {label}
        </p>
      ) : null}
      <div className="cnl-marquee" data-reveal="">
        <ul className="cnl-track">
          {logos.concat(logos).map((l, k) => (
            <li key={k} className="cnl-logo" aria-hidden={k >= logos.length ? true : undefined} title={l.name}>
              <Wordmark logo={l} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ agent canvas */

function Canvas({ data, image, tones, reduced }: { data: CnlCanvas; image?: string; tones: string[]; reduced: boolean }) {
  const steps = data.steps
  const n = steps.length
  const uid = "cnl" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const [active, setActive] = React.useState(0)
  const [pinned, setPinned] = React.useState(false)
  const sec = React.useRef(null as HTMLElement | null)
  const pin = React.useRef(null as HTMLDivElement | null)
  const bodyRef = React.useRef(null as HTMLDivElement | null)
  const trig = React.useRef(null as ScrollTrigger | null)
  const prevH = React.useRef(0)

  // the app's own state, shared by every panel
  const [mode, setMode] = React.useState(1)
  const [files, setFiles] = React.useState([] as CnlFile[])
  const [over, setOver] = React.useState(false)
  const [policies, setPolicies] = React.useState(() => data.policies.map((p) => ({ ...p, on: p.on !== false })))
  const [sensitivity, setSensitivity] = React.useState(45)
  const [personas, setPersonas] = React.useState(() => data.personas.slice(0, 2))
  const [sim, setSim] = React.useState({ state: "idle", done: 0, runs: 0, result: null as CnlSimResult | null })
  const [channels, setChannels] = React.useState(() => data.channels.map((c) => ({ ...c, on: c.on !== false })))
  const [live, setLive] = React.useState(0)
  const fileId = React.useRef(1)

  useIso(() => {
    const s = sec.current
    const p = pin.current
    if (!s || !p) return
    const mm = gsap.matchMedia()
    mm.add("(min-width: 1024px)", () => {
      setPinned(true)
      const st = ScrollTrigger.create({
        trigger: s,
        start: "top top",
        end: () => "+=" + Math.round(window.innerHeight * n * 0.75),
        pin: p,
        anticipatePin: 1,
        onUpdate: (self) => {
          const k = stepAt(self.progress, n)
          setActive((a) => (a === k ? a : k))
          s.style.setProperty("--cnl-sp", String(stepLocal(self.progress, n, k)))
        },
      })
      trig.current = st
      return () => {
        trig.current = null
        setPinned(false)
        s.style.removeProperty("--cnl-sp")
      }
    })
    return () => mm.revert()
  }, [n])

  // the card morphs between panels: height tweens, content re-enters
  useIso(() => {
    const b = bodyRef.current
    if (!b) return
    const h = b.offsetHeight
    const from = prevH.current
    prevH.current = h
    if (reduced || !from) return
    const ctx = gsap.context(() => {
      if (Math.abs(from - h) > 1) gsap.fromTo(b, { height: from }, { height: h, duration: 0.7, ease: "expo.inOut", clearProps: "height" })
      gsap.fromTo(b.querySelectorAll("[data-st]"), { autoAlpha: 0, y: 14, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.045, delay: 0.1, ease: "power3.out", clearProps: "filter,transform,opacity,visibility" })
    }, b)
    return () => ctx.revert()
  }, [active])

  // indexing progress for uploaded files
  React.useEffect(() => {
    if (!files.some((f) => f.progress < 1)) return
    if (reduced) {
      setFiles((fs) => fs.map((f) => ({ ...f, progress: 1 })))
      return
    }
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      setFiles((fs) => fs.map((f) => (f.progress >= 1 ? f : { ...f, progress: Math.min(1, f.progress + dt / (0.8 + Math.min(2.4, f.size / 300000))) })))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [files.some((f) => f.progress < 1), reduced])

  // the simulation streams its calls in
  React.useEffect(() => {
    if (sim.state !== "running" || !sim.result) return
    const total = sim.result.calls.length
    if (reduced) {
      setSim((s) => ({ ...s, state: "done", done: total }))
      return
    }
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let fin = false
      setSim((s) => {
        const done = Math.min(total, s.done + dt * total * 0.45)
        fin = done >= total
        return { ...s, done, state: fin ? "done" : "running" }
      })
      if (!fin) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [sim.state, sim.runs, reduced])

  // go-live sequence
  React.useEffect(() => {
    if (live < 1 || live > 4) return
    const id = window.setTimeout(() => setLive((l) => l + 1), reduced ? 0 : 700)
    return () => window.clearTimeout(id)
  }, [live, reduced])

  const choose = (k: number) => {
    const t = trig.current
    if (t) {
      const y = t.start + (t.end - t.start) * ((k + 0.12) / n)
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" })
      return
    }
    setActive(k)
  }

  const addFiles = (list: { name: string; size: number }[]) => {
    if (!list.length) return
    setFiles((fs) => fs.concat(list.map((f) => ({ id: fileId.current++, name: f.name, size: f.size, progress: 0 }))).slice(-3))
  }

  const run = () => {
    const result = simulateCalls(500, {
      seed: 7 + sim.runs * 101,
      personas,
      intents: data.intents,
      policies: policies.filter((p) => p.on).length,
      sensitivity,
    })
    setSim((s) => ({ state: "running", done: 0, runs: s.runs + 1, result }))
  }

  const tabs = [
    { label: "Chat", icon: "chat" as CnlIconName },
    { label: "Voice", icon: "mic" as CnlIconName },
    { label: "Multi-modal", icon: "multi" as CnlIconName },
  ]
  const step = steps[active] || steps[0]
  const panel = step ? step.panel : "create"
  const heads = { create: "Create new agent", policies: "Policies", simulate: "Simulation lab", deploy: "Go live" }
  const t = sim.result ? tally(sim.result.calls, sim.done) : { done: 0, resolved: 0, handoff: 0, flagged: 0 }
  const feed = sim.result ? sim.result.calls.slice(Math.max(0, t.done - 4), t.done).reverse() : []
  const anyOn = channels.some((c) => c.on)
  const checks = ["Provisioning numbers", "Syncing " + Math.max(1, files.length) + " knowledge source" + (files.length === 1 ? "" : "s"), "Warming up voices", "Routing live traffic"]
  const lines = splitTitle(data.heading || "")

  let content: React.ReactNode = null
  if (panel === "create")
    content = (
      <>
        <div className="cnl-seg" role="tablist" aria-label="Agent type" style={{ "--cnl-i": mode } as React.CSSProperties} data-st="">
          {tabs.map((tb, k) => (
            <button
              key={tb.label}
              role="tab"
              aria-selected={k === mode}
              tabIndex={k === mode ? 0 : -1}
              onClick={() => setMode(k)}
              onKeyDown={(e) => {
                const j = nextIndex(mode, e.key, tabs.length)
                if (j !== mode) {
                  e.preventDefault()
                  setMode(j)
                  const sib = (e.currentTarget.parentElement as HTMLElement).children[j] as HTMLElement
                  sib.focus()
                }
              }}
            >
              <Icon name={tb.icon} size={13} />
              {tb.label}
            </button>
          ))}
        </div>
        <div className="cnl-lbl" data-st="">
          <b>Add training documents</b>
          <span>Attach files to give your agent business context</span>
        </div>
        <label
          className={"cnl-drop" + (over ? " is-over" : "")}
          data-st=""
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            addFiles(Array.from(e.dataTransfer.files))
          }}
        >
          <input
            type="file"
            multiple
            className="cnl-sr"
            onChange={(e) => {
              addFiles(Array.from(e.target.files || []))
              e.target.value = ""
            }}
          />
          <span className="cnl-drop-icons" aria-hidden="true">
            <span>
              <Icon name="folder" size={13} />
            </span>
            <em />
            <span>
              <Icon name="doc" size={13} />
            </span>
            <span>
              <Icon name="image" size={13} />
            </span>
            <span>
              <Icon name="music" size={13} />
            </span>
          </span>
          <span>
            Drag files here or <u>click to browse</u>
          </span>
        </label>
        {files.length ? (
          <ul className="cnl-files" aria-live="polite">
            {files.map((f) => (
              <li key={f.id} className="cnl-file">
                <span aria-hidden="true">
                  <Icon name={fileKind(f.name) as CnlIconName} size={13} />
                </span>
                <span className="cnl-file-name">
                  <b>{f.name}</b>
                  <span>{f.progress < 1 ? "Indexing… " + Math.round(f.progress * 100) + "%" : chunksFor(f.size) + " chunks · " + formatBytes(f.size)}</span>
                  {f.progress < 1 ? (
                    <span className="cnl-file-bar">
                      <i style={{ transform: "scaleX(" + f.progress + ")" }} />
                    </span>
                  ) : null}
                </span>
                <button className="cnl-x" aria-label={"Remove " + f.name} onClick={() => setFiles((fs) => fs.filter((x) => x.id !== f.id))}>
                  <Icon name="x" size={13} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <button className="cnl-sample" data-st="" onClick={() => addFiles(data.samples)}>
            Use sample files
          </button>
        )}
      </>
    )
  else if (panel === "policies")
    content = (
      <>
        {policies.map((p) => (
          <div key={p.id} className="cnl-row" data-st="">
            <div>
              <b>{p.title}</b>
              <span>{p.text}</span>
            </div>
            <button className="cnl-switch" role="switch" aria-checked={p.on} aria-label={p.title} onClick={() => setPolicies((ps) => ps.map((x) => (x.id === p.id ? { ...x, on: !x.on } : x)))} />
          </div>
        ))}
        <div className="cnl-range" data-st="">
          <div className="cnl-range-top">
            <b>Hand-off sensitivity</b>
            <span>{sensitivityLabel(sensitivity)}</span>
          </div>
          <input type="range" min={0} max={100} value={sensitivity} aria-label="Hand-off sensitivity" onChange={(e) => setSensitivity(Number(e.target.value))} />
        </div>
        <p className="cnl-rule" data-st="">
          {policies.filter((p) => p.on).length} of {policies.length} rules active. <em>When a caller mentions a chargeback</em>, transfer to Tier 2 with a one-line summary.
        </p>
      </>
    )
  else if (panel === "simulate")
    content = (
      <>
        <div className="cnl-lbl" data-st="" style={{ marginTop: 0 }}>
          <b>Caller personas</b>
          <span>Mix the callers your agent will face</span>
        </div>
        <div className="cnl-chips" data-st="">
          {data.personas.map((p) => (
            <button key={p} className="cnl-chip" aria-pressed={personas.includes(p)} onClick={() => setPersonas((ps) => (ps.includes(p) ? ps.filter((x) => x !== p) : ps.concat(p)))}>
              {p}
            </button>
          ))}
        </div>
        <button className="cnl-run" data-st="" onClick={run} disabled={sim.state === "running"}>
          <Icon name="bolt" size={14} />
          {sim.state === "running" ? "Simulating…" : sim.state === "done" ? "Run again" : "Run 500 calls"}
        </button>
        <div data-st="">
          <div className="cnl-sim-top">
            <span>Calls simulated</span>
            <b>
              {t.done}
              <span style={{ fontSize: 12, color: "var(--cnl-card-mute)" }}> / 500</span>
            </b>
          </div>
          <div className="cnl-sim-bar">
            <i style={{ transform: "scaleX(" + t.done / 500 + ")" }} />
          </div>
          <div className="cnl-tiles">
            <div className="cnl-tile">
              <b>{t.done ? ((t.resolved / t.done) * 100).toFixed(1) + "%" : "–"}</b>
              <span>Resolved</span>
            </div>
            <div className="cnl-tile">
              <b>{t.handoff}</b>
              <span>Handed off</span>
            </div>
            <div className="cnl-tile">
              <b>{t.flagged}</b>
              <span>Flagged</span>
            </div>
          </div>
        </div>
        <ul className="cnl-feed" data-st="" aria-live="off">
          {feed.map((c) => (
            <li key={c.id}>
              <code>#{String(c.id).padStart(3, "0")}</code>
              <span>
                {c.persona} · {c.intent}
              </span>
              <em className="cnl-tag" data-o={c.outcome}>
                {c.outcome === "handoff" ? "hand-off" : c.outcome}
              </em>
              <code>{(c.ms / 1000).toFixed(1)}s</code>
            </li>
          ))}
        </ul>
      </>
    )
  else
    content = (
      <>
        {channels.map((c) => (
          <div key={c.id} className="cnl-row" data-st="">
            <div className="cnl-row-ico">
              <i aria-hidden="true">
                <Icon name={(c.icon || "globe") as CnlIconName} size={14} />
              </i>
              <div>
                <b>{c.label}</b>
                <span>{c.detail}</span>
              </div>
            </div>
            <button className="cnl-switch" role="switch" aria-checked={c.on} aria-label={c.label} disabled={live > 0 && live < 5} onClick={() => setChannels((cs) => cs.map((x) => (x.id === c.id ? { ...x, on: !x.on } : x)))} />
          </div>
        ))}
        {live === 0 ? (
          <button className="cnl-run" data-st="" disabled={!anyOn} onClick={() => setLive(1)}>
            <Icon name="bolt" size={14} />
            {anyOn ? "Go live on " + channels.filter((c) => c.on).length + " channel" + (channels.filter((c) => c.on).length === 1 ? "" : "s") : "Pick a channel"}
          </button>
        ) : (
          <ul className="cnl-checks" aria-live="polite" data-st="">
            {checks.map((c, k) => (
              <li key={c} className={live > k + 1 ? "is-done" : live === k + 1 ? "is-busy" : ""}>
                <i aria-hidden="true">{live > k + 1 ? <Icon name="check" size={11} stroke={2.6} /> : null}</i>
                {c}
              </li>
            ))}
          </ul>
        )}
        {live >= 5 ? (
          <div className="cnl-golive" role="status">
            <b>Live · answering in 0.4s</b>
            <button onClick={() => setLive(0)}>Pause</button>
          </div>
        ) : null}
      </>
    )

  return (
    <>
      {data.heading ? (
        <section className="cnl-way">
          {data.kicker ? (
            <p className="cnl-kicker" data-reveal="">
              {data.kicker}
            </p>
          ) : null}
          <h2 className="cnl-h2" data-scrub="">
            {lines.map((l, k) => (
              <span key={k}>
                {splitWords(l).map((w, j) => (
                  <React.Fragment key={j}>
                    <span data-word="">{w}</span>{" "}
                  </React.Fragment>
                ))}
              </span>
            ))}
          </h2>
        </section>
      ) : null}
      <section ref={sec} className={"cnl-canvas" + (pinned ? " is-pinned" : "")} data-sec="product">
        <div ref={pin} className="cnl-canvas-pin">
          <div className="cnl-canvas-copy">
            <div className="cnl-canvas-name" data-reveal="">
              <span className="cnl-orb" aria-hidden="true" />
              <h3>{data.title}</h3>
            </div>
            <p className="cnl-canvas-text" data-reveal="">
              {data.text}
            </p>
            <ol className="cnl-steps" data-reveal="">
              {steps.map((st, k) => (
                <li key={st.title} className={k === active ? "is-on" : ""}>
                  <span className="cnl-step-bar" aria-hidden="true">
                    <i />
                  </span>
                  <button className="cnl-step-btn" aria-expanded={k === active} aria-controls={uid + "-app"} onClick={() => choose(k)}>
                    <span className="cnl-step-num">{String(k + 1).padStart(2, "0")}</span>
                    {st.title}
                  </button>
                  <div className="cnl-step-body">
                    <div>
                      <p>{st.text}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Vista className="cnl-canvas-vista" src={image} tones={tones}>
            <div className="cnl-app" id={uid + "-app"} role="region" aria-label={data.title + ": " + heads[panel]}>
              <div className="cnl-app-head">
                <span className="cnl-orb is-sm" aria-hidden="true" />
                <span className="cnl-app-title" key={panel}>
                  {heads[panel]}
                </span>
                <span className="cnl-app-step">
                  {active + 1}/{n}
                </span>
              </div>
              <div className="cnl-app-body" ref={bodyRef}>
                {content}
              </div>
            </div>
          </Vista>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ the call */

function Call({ kicker, title, text, data, image, tones, reduced, brand }: { kicker?: string; title: string; text?: string; data: CnlCall; image?: string; tones: string[]; reduced: boolean; brand: string }) {
  const { marks, total } = React.useMemo(() => callTimeline(data.lines), [data])
  const [t, setT] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [sound, setSound] = React.useState(false)
  const box = React.useRef(null as HTMLDivElement | null)
  const wave = React.useRef(null as HTMLDivElement | null)
  const track = React.useRef(null as HTMLDivElement | null)
  const tRef = React.useRef(0)
  const speaking = React.useRef(false)
  const soundRef = React.useRef(false)
  const started = React.useRef(false)
  const visible = useVisible(box, 0.35)
  const idx = lineAt(marks, t)
  const BARS = 54

  soundRef.current = sound

  const draw = React.useCallback(
    (tt: number) => {
      const w = wave.current
      if (!w) return
      const i = lineAt(marks, tt)
      const talking = i >= 0 && tt < marks[i].end
      w.dataset.who = talking ? data.lines[i].who : ""
      const bars = w.children
      for (let k = 0; k < bars.length; k++) {
        const env = Math.sin((k / (bars.length - 1)) * Math.PI) * 0.7 + 0.3
        const a = talking ? Math.abs(Math.sin(k * 0.73 + tt * 9.1) * Math.sin(k * 0.21 + tt * 4.7)) * env * 0.92 + 0.08 : 0.06 + 0.03 * Math.sin(k + tt * 2)
        ;(bars[k] as HTMLElement).style.transform = "scaleY(" + a.toFixed(3) + ")"
      }
    },
    [marks, data],
  )

  React.useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let shown = tRef.current
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let nt = tRef.current + dt
      const i = lineAt(marks, tRef.current)
      if (soundRef.current && speaking.current && i >= 0 && nt > marks[i].end) nt = marks[i].end
      if (nt >= total) {
        nt = total
        tRef.current = nt
        setT(nt)
        draw(nt)
        setPlaying(false)
        return
      }
      tRef.current = nt
      if (!reduced) draw(nt)
      if (Math.floor(nt * 12) !== Math.floor(shown * 12)) {
        shown = nt
        setT(nt)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, marks, total, draw, reduced])

  // starts by itself the first time it comes into view
  React.useEffect(() => {
    if (visible && !started.current && !reduced) {
      started.current = true
      setPlaying(true)
    }
    if (!visible && playing) setPlaying(false)
  }, [visible, reduced])

  // optional: speak each line with the browser's voices
  React.useEffect(() => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined
    if (!synth) return
    if (!sound || !playing || idx < 0) {
      synth.cancel()
      speaking.current = false
      return
    }
    const line = data.lines[idx]
    if (!line) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(line.text)
    const voices = synth.getVoices().filter((v) => /^en/i.test(v.lang))
    if (voices.length) u.voice = voices[line.who === "agent" ? 0 : Math.min(voices.length - 1, 1)]
    u.rate = 1.04
    u.pitch = line.who === "agent" ? 1 : 1.15
    u.onend = () => {
      speaking.current = false
    }
    speaking.current = true
    synth.speak(u)
  }, [idx, sound, playing, data])

  React.useEffect(() => () => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel()
  }, [])

  // keep the active line near the top of the transcript
  useIso(() => {
    const tr = track.current
    if (!tr) return
    const el = tr.children[Math.max(0, idx)] as HTMLElement | undefined
    const y = el ? Math.max(0, el.offsetTop - 26) : 0
    if (reduced) gsap.set(tr, { y: -y })
    else gsap.to(tr, { y: -y, duration: 0.7, ease: "expo.out" })
  }, [idx, reduced])

  React.useEffect(() => draw(tRef.current), [draw])

  const seek = (v: number) => {
    tRef.current = v
    setT(v)
    draw(v)
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel()
    speaking.current = false
  }
  const toggle = () => {
    if (!playing && tRef.current >= total - 0.01) seek(0)
    started.current = true
    setPlaying((p) => !p)
  }
  const mem = (data.memory || []).concat(data.lines.slice(0, idx + 1).filter((l) => l.memory).map((l) => l.memory as string))
  const known = (data.memory || []).length
  const mood = moodAt(data.lines, marks, t)
  const spark = sentimentPath(data.lines, marks, total, t, 238, 64)
  const ended = t >= total - 0.01
  const titleLines = splitTitle(title)
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window

  return (
    <section className="cnl-call" data-sec="demo">
      <div className="cnl-sec-head">
        {kicker ? (
          <p className="cnl-kicker" data-reveal="">
            {kicker}
          </p>
        ) : null}
        <h2 className="cnl-h2" data-reveal="">
          {titleLines.map((l, k) => (
            <span key={k}>{l}</span>
          ))}
        </h2>
        {text ? (
          <p className="cnl-sec-text" data-reveal="">
            {text}
          </p>
        ) : null}
      </div>
      <Vista className="cnl-call-vista" src={image} tones={tones}>
        <div className="cnl-call-in" ref={box}>
          <div className="cnl-player" role="group" aria-label={"Call with " + data.caller}>
            <div className="cnl-player-head">
              <Avatar name={data.caller} />
              <div className="cnl-player-who">
                <b>{data.caller}</b>
                <span>
                  {data.topic} · with {brand}
                </span>
              </div>
              <span className={"cnl-clock" + (playing ? " is-live" : "")}>{formatClock(t)}</span>
              {canSpeak ? (
                <button className="cnl-icon-btn" aria-pressed={sound} aria-label={sound ? "Mute voices" : "Play voices aloud"} onClick={() => setSound((s) => !s)}>
                  <Icon name={sound ? "sound" : "mute"} size={16} />
                </button>
              ) : null}
            </div>
            <div className="cnl-wave" ref={wave} aria-hidden="true">
              {Array.from({ length: BARS }, (_, k) => (
                <i key={k} />
              ))}
            </div>
            <div className="cnl-tx" aria-live="polite">
              <div className="cnl-tx-track" ref={track}>
                {data.lines.map((l, k) => {
                  const local = k === idx ? (t - marks[k].start) / (marks[k].end - marks[k].start) : k < idx ? 1 : 0
                  const lit = litWords(l.text, local)
                  return (
                    <div key={k} className={"cnl-tx-line" + (k < idx ? " is-past" : k > idx ? " is-next" : "")} data-who={l.who}>
                      <small>{l.who === "agent" ? brand : data.caller.split(" ")[0]}</small>
                      <p>
                        {splitWords(l.text).map((w, j) => (
                          <React.Fragment key={j}>
                            <span className={j < lit ? "is-lit" : ""}>{w}</span>{" "}
                          </React.Fragment>
                        ))}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="cnl-controls">
              <button className="cnl-play" aria-label={playing ? "Pause call" : ended ? "Replay call" : "Play call"} onClick={toggle}>
                <Icon name={playing ? "pause" : ended ? "restart" : "play"} size={15} stroke={ended && !playing ? 2.2 : 1.7} />
              </button>
              <input className="cnl-scrub" type="range" min={0} max={Math.round(total * 10)} value={Math.round(t * 10)} aria-label="Seek" onChange={(e) => seek(Number(e.target.value) / 10)} />
              <span className="cnl-time">
                {formatClock(t)} / {formatClock(total)}
              </span>
            </div>
            {ended && data.outcome ? (
              <p className="cnl-outcome" role="status">
                <Icon name="check" size={14} stroke={2.2} />
                {data.outcome}
              </p>
            ) : null}
          </div>
          <aside className="cnl-mem" aria-label="What the agent knows">
            <h4>Memory</h4>
            <ul className="cnl-mem-list">
              {mem.map((m, k) => (
                <li key={m} className={k >= known ? "is-new" : ""}>
                  <Icon name={k >= known ? "memory" : "user"} size={13} />
                  {m}
                </li>
              ))}
            </ul>
            <h4>Sentiment</h4>
            <div className="cnl-mood">
              <b>{moodLabel(mood)}</b>
              <span>{(mood > 0 ? "+" : "") + mood.toFixed(2)}</span>
            </div>
            <svg className="cnl-spark" width="238" height="64" viewBox="0 0 238 64" aria-hidden="true">
              <line x1="0" y1="32" x2="238" y2="32" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="2 4" />
              <path d={spark.d} fill="none" stroke="var(--cnl-agent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={spark.x} cy={spark.y} r="4" fill="var(--cnl-card)" stroke="var(--cnl-agent)" strokeWidth="2" />
            </svg>
          </aside>
        </div>
      </Vista>
    </section>
  )
}

/* ------------------------------------------------------------------ stats */

function Stats({ kicker, title, items, reduced }: { kicker?: string; title?: string; items: CnlStat[]; reduced: boolean }) {
  const box = React.useRef(null as HTMLDivElement | null)
  const fmt = (s: CnlStat, v: number) => (s.clock ? formatClock(v) : (s.prefix || "") + formatStat(v, s.decimals || 0) + (s.suffix || ""))
  useIso(() => {
    const b = box.current
    if (!b || reduced) return
    const nums = Array.from(b.querySelectorAll("[data-num]")) as HTMLElement[]
    const ctx = gsap.context(() => {
      nums.forEach((el, k) => {
        const s = items[k]
        if (!s) return
        const o = { v: s.from != null ? s.from : 0 }
        el.textContent = fmt(s, o.v)
        gsap.to(o, {
          v: s.value,
          duration: s.clock ? 2.6 : 2.2,
          ease: s.clock ? "power2.inOut" : "power3.out",
          delay: k * 0.12,
          onUpdate: () => {
            el.textContent = fmt(s, o.v)
          },
          scrollTrigger: { trigger: b, start: "top 80%", once: true },
        })
      })
    }, b)
    return () => ctx.revert()
  }, [JSON.stringify(items), reduced])
  return (
    <section className="cnl-stats" aria-label={kicker || "Numbers"}>
      <div className="cnl-stats-head">
        <div>
          {kicker ? (
            <p className="cnl-kicker" data-reveal="">
              {kicker}
            </p>
          ) : null}
          {title ? (
            <h2 className="cnl-h2" data-reveal="">
              {title}
            </h2>
          ) : null}
        </div>
      </div>
      <div className="cnl-stat-grid" ref={box}>
        {items.map((s, k) => (
          <div key={k} className="cnl-stat" data-reveal="">
            <small>{s.note || ""}</small>
            <b data-num="">{fmt(s, s.value)}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ quotes */

function Quotes({ kicker, items }: { kicker?: string; items: CnlQuote[] }) {
  const [i, setI] = React.useState(0)
  const q = items[i] || items[0]
  if (!q) return null
  return (
    <section className="cnl-quotes" aria-label="Testimonials">
      <figure>
        {kicker ? (
          <p className="cnl-kicker" data-reveal="">
            {kicker}
          </p>
        ) : null}
        <blockquote className="cnl-quote" key={i} data-reveal="">
          {splitWords(q.quote).map((w, k) => (
            <React.Fragment key={k}>
              <span style={{ animationDelay: k * 22 + "ms" }}>{w}</span>{" "}
            </React.Fragment>
          ))}
        </blockquote>
        <figcaption className="cnl-cite" key={"c" + i}>
          <b>{q.name}</b> · {q.role}, {q.company}
        </figcaption>
      </figure>
      <div className="cnl-people" data-reveal="">
        {items.map((p, k) => (
          <button key={p.name} className="cnl-person" aria-current={k === i} onClick={() => setI(k)}>
            <Avatar name={p.name} src={p.avatar} />
            <span>
              <b>{p.name}</b>
              <span>{p.company}</span>
            </span>
            <i aria-hidden="true" onAnimationEnd={() => setI((x) => (x + 1) % items.length)} />
          </button>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ cta */

function Cta({ data, image, tones, onSubscribe, onTalk, reduced }: { data: NonNullable<CairnAgentsLandingProps["cta"]>; image?: string; tones: string[]; onSubscribe?: (email: string) => unknown; onTalk: () => void; reduced: boolean }) {
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState("idle")
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) {
      setState("error")
      return
    }
    setState("busy")
    try {
      if (onSubscribe) await onSubscribe(email.trim())
      setState("sent")
    } catch {
      setState("failed")
    }
  }
  const lines = splitTitle(data.title)
  return (
    <section className="cnl-cta" data-sec="talk">
      <Vista className="cnl-cta-vista" src={image} tones={tones}>
        <div className="cnl-cta-in">
          {data.kicker ? (
            <p className="cnl-kicker" data-reveal="">
              {data.kicker}
            </p>
          ) : null}
          <h2 className="cnl-h2" data-reveal="">
            {lines.map((l, k) => (
              <span key={k}>{l}</span>
            ))}
          </h2>
          {data.text ? (
            <p className="cnl-sec-text" data-reveal="">
              {data.text}
            </p>
          ) : null}
          {state === "sent" ? (
            <div className="cnl-sent" role="status">
              <Icon name="check" size={16} stroke={2.2} />
              We'll call {email.trim()} within one business day.
            </div>
          ) : (
            <>
              <form className={"cnl-form" + (state === "error" ? " is-error" : "")} onSubmit={submit} noValidate data-reveal="">
                <label className="cnl-sr" htmlFor="cnl-cta-email">
                  Work email
                </label>
                <input
                  id="cnl-cta-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  aria-invalid={state === "error"}
                  aria-describedby="cnl-cta-msg"
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state === "error" || state === "failed") setState("idle")
                  }}
                />
                <Pill label={state === "busy" ? "Sending…" : data.action || "Talk to us"} type="submit" tone="light" disabled={state === "busy"} reduced={reduced} />
              </form>
              <p className="cnl-form-msg" id="cnl-cta-msg" aria-live="polite">
                {state === "error" ? "That doesn't look like a work email." : state === "failed" ? "Something went wrong. Try again in a moment." : (
                  <>
                    Rather pick a time?{" "}
                    <button style={{ textDecoration: "underline", textUnderlineOffset: 3 }} onClick={onTalk} type="button">
                      Book a call
                    </button>
                  </>
                )}
              </p>
            </>
          )}
          {data.assurances && data.assurances.length ? (
            <ul className="cnl-assure">
              {data.assurances.map((a) => (
                <li key={a}>
                  <Icon name="shield" size={12} />
                  {a}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Vista>
    </section>
  )
}

/* ------------------------------------------------------------------ footer */

function Footer({ brand, logo, data, onNav }: { brand: string; logo?: React.ReactNode; data: NonNullable<CairnAgentsLandingProps["footer"]>; onNav: (href: string | undefined, e?: React.MouseEvent) => void }) {
  return (
    <footer className="cnl-foot" data-sec="company">
      <div className="cnl-foot-top">
        <div className="cnl-foot-brand">
          <span className="cnl-brand">
            {logo || <Mark />}
            <span>{brand}</span>
          </span>
          {data.tagline ? <p>{data.tagline}</p> : null}
          <span className="cnl-status">All systems normal</span>
        </div>
        {(data.columns || []).map((c) => (
          <div key={c.title} className="cnl-foot-col">
            <h4>{c.title}</h4>
            <ul>
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href || "#"} onClick={(e) => onNav(l.href, e)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="cnl-foot-word" aria-hidden="true">
        <span data-foot-word="">{brand}</span>
      </div>
      <div className="cnl-foot-bottom">
        <span>
          © {new Date().getFullYear()} {brand} Inc.
          {data.note ? " · " + data.note : ""}
        </span>
        <nav aria-label="Legal">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Security</a>
        </nav>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ dialog */

function TalkDialog({ brand, volumes, onClose, onTalk }: { brand: string; volumes: string[]; onClose: () => void; onTalk?: (d: CnlTalkRequest) => unknown }) {
  const [f, setF] = React.useState({ name: "", email: "", company: "", volume: volumes[1] || volumes[0] || "", message: "" })
  const [tried, setTried] = React.useState(false)
  const [state, setState] = React.useState("idle")
  const box = React.useRef(null as HTMLDivElement | null)
  const opener = React.useRef(null as HTMLElement | null)

  React.useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null
    const first = box.current && (box.current.querySelector("input") as HTMLInputElement | null)
    if (first) first.focus()
    return () => {
      if (opener.current && opener.current.focus) opener.current.focus()
    }
  }, [])

  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation()
      onClose()
    }
    if (e.key === "Tab" && box.current) {
      const els = Array.from(box.current.querySelectorAll("button,input,textarea,a[href]")).filter((x) => !(x as HTMLButtonElement).disabled) as HTMLElement[]
      if (!els.length) return
      const a = els[0]
      const z = els[els.length - 1]
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault()
        z.focus()
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault()
        a.focus()
      }
    }
  }
  const bad = { name: !f.name.trim(), email: !isEmail(f.email), company: !f.company.trim() }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (bad.name || bad.email || bad.company) return
    setState("busy")
    try {
      if (onTalk) await onTalk({ ...f, email: f.email.trim() })
      setState("sent")
    } catch {
      setState("failed")
    }
  }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }))

  return (
    <div className="cnl-dialog" onMouseDown={(e) => e.target === e.currentTarget && onClose()} onKeyDown={key}>
      <div className="cnl-dialog-box" ref={box} role="dialog" aria-modal="true" aria-labelledby="cnl-dlg-t">
        <button className="cnl-dialog-close" aria-label="Close" onClick={onClose}>
          <Icon name="x" size={16} />
        </button>
        {state === "sent" ? (
          <div className="cnl-done" role="status">
            <i>
              <Icon name="check" size={22} stroke={2.4} />
            </i>
            <h2 id="cnl-dlg-t">Talk soon, {f.name.trim().split(" ")[0]}.</h2>
            <p>
              A {brand} engineer will reach {f.email.trim()} within one business day with a sandbox built on your own call recordings.
            </p>
            <div style={{ marginTop: 20 }}>
              <Pill label="Done" onClick={onClose} />
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id="cnl-dlg-t">Talk to us</h2>
            <p style={{ marginTop: 8, fontSize: 13.5, color: "var(--cnl-card-mute)", lineHeight: 1.6 }}>Tell us a little about your support line. We'll come back with a working agent, trained on your docs.</p>
            <div className="cnl-fields">
              <label className={"cnl-field" + (tried && bad.name ? " is-bad" : "")}>
                Name
                <input value={f.name} onChange={set("name")} autoComplete="name" aria-invalid={tried && bad.name} />
              </label>
              <label className={"cnl-field" + (tried && bad.company ? " is-bad" : "")}>
                Company
                <input value={f.company} onChange={set("company")} autoComplete="organization" aria-invalid={tried && bad.company} />
              </label>
              <label className={"cnl-field is-wide" + (tried && bad.email ? " is-bad" : "")}>
                Work email
                <input type="email" value={f.email} onChange={set("email")} autoComplete="email" aria-invalid={tried && bad.email} />
                {tried && bad.email ? <em>Enter an address like you@company.com</em> : null}
              </label>
              <div className="cnl-field is-wide">
                <span id="cnl-vol-l">Calls per month</span>
                <div className="cnl-vol" role="radiogroup" aria-labelledby="cnl-vol-l">
                  {volumes.map((v) => (
                    <button key={v} type="button" role="radio" aria-checked={f.volume === v} onClick={() => setF((x) => ({ ...x, volume: v }))}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <label className="cnl-field is-wide">
                Anything we should know?
                <textarea value={f.message} onChange={set("message")} placeholder="Peak hours, languages, the systems you use…" />
              </label>
            </div>
            <div className="cnl-dialog-foot">
              <small>{state === "failed" ? "That didn't send. Try again." : "No sales script. An engineer replies."}</small>
              <Pill label={state === "busy" ? "Sending…" : "Send"} type="submit" disabled={state === "busy"} />
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ page */

export default function CairnAgentsLanding({
  brand = "Cairn",
  logo,
  nav = DEFAULT_NAV,
  login = { label: "Sign in", href: "#" },
  action = { label: "Talk to us" },
  announcement = { label: "We've rebranded: Hollowline is now Cairn", href: "#company" },
  title = "AI Agents for\nEnterprise Support",
  subtitle = "Handle millions of calls with the memory, empathy, and zero wait time your customers expect.",
  primaryAction = { label: "Talk to us" },
  scenarios = DEFAULT_SCENARIOS,
  liveCalls = 1284,
  logosLabel = "Trusted by support teams answering forty million calls a year",
  logos = DEFAULT_LOGOS as CnlLogo[],
  canvas = DEFAULT_CANVAS as CnlCanvas,
  call = DEFAULT_CALL as CairnAgentsLandingProps["call"],
  stats = DEFAULT_STATS,
  quotes = DEFAULT_QUOTES,
  cta = DEFAULT_CTA,
  footer = DEFAULT_FOOTER,
  images,
  palette = "fog",
  scheme = "auto",
  height = "100svh",
  volumes = DEFAULT_VOLUMES,
  onTalk,
  onSubscribe,
  className,
  style,
}: CairnAgentsLandingProps) {
  const pal = resolvePalette(palette)
  const img = { ...DEFAULT_IMAGES, ...(images || {}) }
  const reduced = useReduced()
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const [talk, setTalk] = React.useState(false)

  const go = React.useCallback(
    (href: string | undefined, e?: React.MouseEvent) => {
      if (!href || href.charAt(0) !== "#") return
      const root = rootRef.current
      const el = root && (root.querySelector('[data-sec="' + href.slice(1) + '"]') as HTMLElement | null)
      if (!el) return
      if (e) e.preventDefault()
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
    },
    [reduced],
  )

  useIso(() => {
    const r = rootRef.current
    if (!r) return
    const absTop = (el: HTMLElement) => {
      let y = 0
      let n: HTMLElement | null = el
      while (n) {
        y += n.offsetTop
        n = n.offsetParent as HTMLElement | null
      }
      return y
    }
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(r)
        // the intro: masked headline lines rise, the window lifts into place
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } })
        intro
          .from(q(".cnl-nav"), { y: -24, autoAlpha: 0, duration: 1, clearProps: "transform,opacity,visibility" })
          .from(q("[data-line]"), { yPercent: 115, rotate: 2.5, duration: 1.3, stagger: 0.1 }, 0.1)
          .from(q(".cnl-hero-copy [data-intro]"), { y: 18, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, 0.3)
          .from(q("[data-hero-stage]"), { y: 110, autoAlpha: 0, scale: 0.94, duration: 1.6 }, 0.35)

        // the hero window opens to full bleed as you scroll to it
        const hv = r.querySelector(".cnl-hero-vista") as HTMLElement | null
        if (hv) {
          const st = { start: 0, end: () => Math.max(220, absTop(hv) - window.innerHeight * 0.08), scrub: 0.6 }
          gsap.to(hv, { "--cnl-in": "0px", "--cnl-r": "0px", ease: "none", scrollTrigger: st })
          gsap.fromTo(hv.querySelector("[data-vista-media]"), { scale: 1.16 }, { scale: 1, ease: "none", scrollTrigger: st })
          gsap.to(hv.querySelector("[data-chat]"), { y: -50, ease: "none", scrollTrigger: { trigger: hv, start: "top 40%", end: "bottom top", scrub: true } })
          // a little depth under the pointer
          const drift = hv.querySelector("[data-vista-drift]")
          const xTo = gsap.quickTo(drift, "x", { duration: 1.2, ease: "power3.out" })
          const yTo = gsap.quickTo(drift, "y", { duration: 1.2, ease: "power3.out" })
          const bubbles = Array.from(hv.querySelectorAll("[data-depth]")) as HTMLElement[]
          const move = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            const b = hv.getBoundingClientRect()
            const nx = (e.clientX - b.left) / b.width - 0.5
            const ny = (e.clientY - b.top) / b.height - 0.5
            xTo(nx * -26)
            yTo(ny * -16)
            bubbles.forEach((el) => {
              const d = Number(el.dataset.depth || 1)
              gsap.to(el, { xPercent: nx * d * 3, yPercent: ny * d * 4, duration: 1, ease: "power3.out", overwrite: "auto" })
            })
          }
          hv.addEventListener("pointermove", move)
          return () => hv.removeEventListener("pointermove", move)
        }
      })
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // every other window opens out of a smaller frame and drifts as it passes
        ;(Array.from(r.querySelectorAll(".cnl-vista")) as HTMLElement[])
          .filter((v) => !v.classList.contains("cnl-hero-vista"))
          .forEach((v) => {
            const pc = v.closest(".cnl-canvas-pin") as HTMLElement | null
            const big = v.classList.contains("cnl-cta-vista")
            gsap.fromTo(
              v,
              { clipPath: big ? "inset(12% 9% 12% 9% round 40px)" : "inset(7% 5% 7% 5% round 28px)" },
              { clipPath: "inset(0% 0% 0% 0% round 14px)", ease: "none", scrollTrigger: { trigger: v, start: "top 96%", end: big ? "top 25%" : "top 45%", scrub: 0.5, pinnedContainer: pc || undefined } },
            )
            gsap.fromTo(v.querySelector("[data-vista-media]"), { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: v, start: "top bottom", end: "bottom top", scrub: true, pinnedContainer: pc || undefined } })
          })

        // section headings brighten word by word as they scroll in
        ;(Array.from(r.querySelectorAll("[data-scrub]")) as HTMLElement[]).forEach((h) => {
          gsap.fromTo(h.querySelectorAll("[data-word]"), { opacity: 0.13 }, { opacity: 1, stagger: 0.12, ease: "none", scrollTrigger: { trigger: h, start: "top 85%", end: "top 40%", scrub: true } })
        })

        // everything else rises in once
        const items = Array.from(r.querySelectorAll("[data-reveal]")) as HTMLElement[]
        gsap.set(items, { autoAlpha: 0, y: 28 })
        ScrollTrigger.batch(items, {
          start: "top 90%",
          once: true,
          onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true }),
        })

        const fw = r.querySelector("[data-foot-word]")
        if (fw) gsap.fromTo(fw, { yPercent: 70 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: fw.parentElement, start: "top bottom", end: "bottom bottom", scrub: true } })
      })
    }, r)
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener("load", onLoad)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("load", onLoad)
      ctx.revert()
    }
  }, [])

  const vars = {
    "--cnl-day": pal.bg,
    "--cnl-night-bg": pal.night,
    "--cnl-accent": pal.accent,
    "--cnl-agent": pal.agent,
    ...(style || {}),
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={"cnl-root" + (className ? " " + className : "")} data-scheme={scheme} style={vars}>
      <style>{CNL_CSS}</style>
      <Nav brand={brand} logo={logo} nav={nav} login={login} action={action} onAction={() => setTalk(true)} onNav={go} reduced={reduced} />
      <main>
        <Hero
          announcement={announcement}
          title={title}
          subtitle={subtitle}
          primary={primaryAction}
          onPrimary={() => setTalk(true)}
          image={img.hero}
          tones={pal.ridges}
          height={height}
          scenarios={scenarios.length ? scenarios : DEFAULT_SCENARIOS}
          brand={brand}
          reduced={reduced}
          liveCalls={liveCalls}
          onNav={go}
        />
        {logos && logos.length ? <Logos logos={logos} label={logosLabel} /> : null}
        {canvas && canvas.steps.length ? <Canvas data={canvas} image={img.canvas} tones={pal.ridges} reduced={reduced} /> : null}
        {call ? <Call kicker={call.kicker} title={call.title} text={call.text} data={call.data} image={img.call} tones={pal.ridges} reduced={reduced} brand={brand} /> : null}
        {stats && stats.items.length ? <Stats kicker={stats.kicker} title={stats.title} items={stats.items} reduced={reduced} /> : null}
        {quotes && quotes.items.length ? <Quotes kicker={quotes.kicker} items={quotes.items} /> : null}
        {cta ? <Cta data={cta} image={img.cta} tones={pal.ridges} onSubscribe={onSubscribe} onTalk={() => setTalk(true)} reduced={reduced} /> : null}
      </main>
      {footer ? <Footer brand={brand} logo={logo} data={footer} onNav={go} /> : null}
      {talk ? <TalkDialog brand={brand} volumes={volumes} onClose={() => setTalk(false)} onTalk={onTalk} /> : null}
    </div>
  )
}
