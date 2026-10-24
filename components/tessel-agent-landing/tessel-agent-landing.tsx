"use client"

// Tessel Agent Landing: a complete landing page for an AI agent platform, in
// one file. The art direction is a living pixel mosaic: a quantized blue field
// drawn on canvas that sharpens out of big blocks when the page opens, breaks
// back into blocks as you scroll past, and resolves into finer pixels under
// the pointer like a loupe. It runs through every section: the hero panel,
// the solution stage, the featured price, the call to action, the portrait in
// the case study and a footer wordmark built from pixels you can scatter.
//
// The hero holds a working prompt. Type a task (or pick one) and an agent
// plans it, calls its tools step by step and streams a result. Wire `onRun`
// to put a real model behind it.
//
// Below: a logo marquee, a black problem section with isometric icons that
// come apart on hover, a scroll-driven solution stage that morphs between four
// live product cards, counted stats, a case study, pricing with a usage
// estimator, a sign-up call to action and a footer.
//
// Motion is GSAP with ScrollTrigger. Everything else is drawn here: canvas,
// SVG and the system type stack. The four photos are embedded.
import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

export type TslLink = { label: string; href?: string }

export type TslMenuItem = { label: string; description?: string; href?: string }

export type TslNavItem = { label: string; href?: string; items?: TslMenuItem[] }

export type TslLogoMark = "bolt" | "spark" | "chevron" | "orbit" | "bars" | "knot" | "leaf"

export type TslLogo = { name: string; mark?: TslLogoMark; style?: "bold" | "italic" | "light" | "caps" }

export type TslHero = {
  badge?: { mark: string; label: string } | null
  title?: string
  text?: string
  primary?: TslLink
  secondary?: TslLink
  prompt?: { label?: string; placeholder?: string; suggestions?: string[]; models?: string[] }
}

export type TslProblemIcon = "layers" | "steps" | "eye"

export type TslProblem = {
  kicker?: string
  title?: string
  items?: { title: string; text: string; icon?: TslProblemIcon }[]
}

export type TslFeatureVisual = "builder" | "tools" | "trace" | "deploy"

export type TslFeature = { kicker: string; title: string; text: string; points?: string[]; visual: TslFeatureVisual }

export type TslSolution = { kicker?: string; title?: string; features?: TslFeature[] }

export type TslStat = { value: number; prefix?: string; suffix?: string; decimals?: number; label: string }

export type TslCase = {
  kicker?: string
  company: string
  quote: string
  name: string
  role: string
  photo?: string
  metrics?: { value: string; label: string }[]
}

export type TslTestimonial = { quote: string; name: string; role: string; avatar?: string }

export type TslPlan = {
  name: string
  price: number | null
  unit?: string
  blurb: string
  features: string[]
  cta: TslLink
  featured?: boolean
}

export type TslPricing = {
  kicker?: string
  title?: string
  plans?: TslPlan[]
  annualDiscount?: number
  estimator?: { included: number; per1k: number; max?: number } | null
}

export type TslCta = { title?: string; text?: string; action?: string; placeholder?: string; done?: string }

export type TslFooter = { tagline?: string; columns?: { title: string; links: TslLink[] }[]; note?: string }

export type TslPaletteName = "cobalt" | "ember" | "moss"

export type TslPaletteInput = { stops?: string[]; accent?: string }

export type TslRunContext = { model: string; signal: AbortSignal }

export interface TesselAgentLandingProps {
  /** Nav and footer name. */
  brand?: string
  /** Replaces the drawn pixel mark beside the brand. */
  logo?: React.ReactNode
  announcement?: TslLink | null
  nav?: TslNavItem[]
  signIn?: TslLink | null
  getStarted?: TslLink
  hero?: TslHero
  logos?: TslLogo[] | null
  problem?: TslProblem | null
  solution?: TslSolution | null
  stats?: TslStat[] | null
  caseStudy?: TslCase | null
  testimonials?: TslTestimonial[] | null
  pricing?: TslPricing | null
  cta?: TslCta | null
  footer?: TslFooter | null
  /** Price prefix. */
  currency?: string
  palette?: TslPaletteName | TslPaletteInput
  theme?: "system" | "light" | "dark"
  themeToggle?: boolean
  /** Put a real agent behind the hero prompt. Return or resolve the answer text; throw to show an error. */
  onRun?: (prompt: string, ctx: TslRunContext) => unknown
  /** Called with the email from the call to action. Return or resolve false, or throw, to show an error. */
  onSignUp?: (email: string) => unknown
  /** Basis for the hero panel's height. A definite length, so it survives any host layout. */
  height?: string
  className?: string
}

// #region photos
// Portraits from Unsplash (Unsplash License), cropped and re-encoded as WebP.
const PHOTO_CASE = "data:image/webp;base64,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"
const PHOTO_T1 = "data:image/webp;base64,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"
const PHOTO_T2 = "data:image/webp;base64,UklGRvQEAABXRUJQVlA4IOgEAACwHQCdASqgAKAAPrlapk8nJKMjJNIpgOAXCWdu4DBplt+6rS7cMBl4nhDxGPPfzN5xerbKwh9sfD/aOBkr8fLVlWZ2iGOO6J//uGErlEt6B+NyTG1Aj2g8SL8EaDSL6dLHvk0nVTcoVMUvET9JgAAS8VUM8z2rSPfNx1WtMvhk706KjtfCJTT5APOgDCdKyBX0x+JsD9WO75fqdoe6L99NeF5aguR0Qu3PzbHC1kLXtVq6cPIbxwxF7OF5YorhWGWaoDIZ0hJc+Pqj/PScqNT4FuL/uGN0KwmS9b9KmuetUT55ef1jIeewWbBgikNT8X6q0ajoJQAA/uGS0BYiZZtyLmtoqtqTiUtX4+pA6c8EWr5spRfEvION6OiIiy0JFxySud2f/l8WHBM9YUtD4clkRxldkkyZ1h6ifgJBfIOaTBAvtJ7o9UNPsWaUqgfaVklJxan1b594Zhv6WbX4I3SI8UUu/Vm0dAvbxDrwWtGqjIFXRmlDlSFrO4/FE78NDCsuCw1mAyB1svfSM4kkKP0RC3DO1xAdU+Og3nEFFGWqi629wUVP1r4dUOl9ms1PCQsNQ75bn9+nz1hh3elnhFp0wpm4os+0/pPyPckF3CBXpgm0fc1wvSk2mcGFMEyzm7ue5KEPexRjuvRa5b2jHGYHD7UlLfIhnWguAmuSre/RrNRchUqbKK//5gfcJXbsw+4/JLa0zBFb009iQTI2sPmnBdd1qJkVYOojPRRjgP+qHec264Wjip7DakbXOyS/ZtL1jHKZoe42BAXHQxXxb2H69AUfZ8IDUuITntVPUCNfSE+I3bbC4nH/NsRAS3zEkwUa/brETPTK7DF2WIATJ79rOww/3cdEgIcWvDxw5piyO7yaee3O6QsKtkAgXJ1q1sTOIxuXgjBXBfva7lOaxg92qhUb/RmUUmNx6M2RobUhwpuFIwo3IE6DuVIvNu1DDUZkhhZKsOzYQJ23c0CYMa46zWE3lRoiMWxyo3cUljIKWQCMGiI4vUKoDqpWzlgL9nzaY7htEg5CzE74S6KLVFtqq5AyNGo1nZ9CchyArA41sfUhUZS257nRG1nZ0nRFQcu1Joe0BKbNi65MKYxvcy3d+lBMzb+9HPbvnb8ht5fh/Dv26fRSmP4VKNejsXe9Kg21L0z5eKyq29osAXxjUFH5eBKoO9UPvod5WKdjcsqIKlKyBqw0mrHo5R66aKaHY4GWn4uZa95xAxJpbkqR7oKEauzP0RhDkZV5qkUqT9qmxI0T2TOiQ+55sfP2s5xoDSy1aV8d+rPScS96i5bGbpc4uJ+b+PxDOkpM12l5orG4nxjYHBLjZMZZpp5Jt0GDCf/1iQrFiUvAId6B0Rx5BXOpD/o+sM9If3sKYVCLue342pqZwY4wwSLbWhG/3avqQ+hevNiwZuA/lJOK5ncALMY4IRQOAA4OHWKJ14qKcB/qoAWNBFHZ5ZqEgsZl1uJ375AJscawKVERQ7Sc+HQt7srL4O2l00O/Mzw4JIpJrXzT+nMrGVmrBG27xcNv8UNF73rTWFP0LLTbWZKBdX2EqdFak/tNstBEzDby+Xl5iv+ZsUctSxqZXeKMxIi/UYZZYAiPN1Sw/ficq+jAxCjb3FVhnVlKHHe5ARMRJ8XXK2OLBATBNkhfKEwtKp9y3Bwr/Xrhnrl23egAAA=="
const PHOTO_T3 = "data:image/webp;base64,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"
// #endregion photos

// #region content
const PALETTES = {
  cobalt: { stops: ["#1b36f2", "#4f6bff", "#a3b2ff", "#eceeff"], accent: "#2f4dff" },
  ember: { stops: ["#c2410c", "#f9733a", "#ffc4a1", "#fff2e8"], accent: "#ea580c" },
  moss: { stops: ["#0c6247", "#2b9d74", "#a3dcc3", "#ecf8f2"], accent: "#13805b" },
}

const DEFAULT_NAV = [
  {
    label: "Product",
    items: [
      { label: "Agent builder", description: "Describe the job, get a versioned agent.", href: "#product" },
      { label: "Connectors", description: "120+ tools with scoped credentials.", href: "#product" },
      { label: "Observability", description: "Live traces, cost and replay.", href: "#product" },
      { label: "Deployment", description: "Staged rollouts and auto-rollback.", href: "#product" },
    ],
  },
  { label: "Case Study", href: "#customers" },
  { label: "Pricing", href: "#pricing" },
  {
    label: "Company",
    items: [
      { label: "About", description: "Why we are building the agent layer.", href: "#" },
      { label: "Careers", description: "Nine open roles, remote-first.", href: "#" },
      { label: "Press", description: "News, brand assets and contacts.", href: "#" },
    ],
  },
]

const DEFAULT_HERO = {
  badge: { mark: "N", label: "Backed by Northgate Ventures" },
  title: "Build and Manage AI Agents\nfor Real-World Tasks",
  text: "Create intelligent agents that understand context, automate workflows, and execute tasks reliably across your operations.",
  primary: { label: "Start for free", href: "#signup" },
  secondary: { label: "Talk to sales", href: "#pricing" },
  prompt: {
    label: "Automate tasks",
    placeholder: "How can I help you today?",
    suggestions: [
      "Triage the support inbox and draft replies",
      "Reconcile last month's invoices against bank payouts",
      "Write the weekly ops report from the warehouse",
      "Find 20 leads that look like our best customers",
    ],
    models: ["Agent 5.6", "Agent 5.6 Swift", "Agent 6 Deep"],
  },
}

const DEFAULT_LOGOS = [
  { name: "Ferrous", mark: "bolt", style: "bold" },
  { name: "lumina", mark: "spark", style: "bold" },
  { name: "Kitebird", mark: "chevron", style: "light" },
  { name: "Halcyon", mark: "orbit", style: "caps" },
  { name: "paperjet", mark: "bars", style: "italic" },
  { name: "Strata", mark: "knot", style: "bold" },
  { name: "Quillary", mark: "leaf", style: "light" },
]

const DEFAULT_PROBLEM = {
  kicker: "The problem",
  title: "Most Organizations Operate with Broken Data Pipelines, *Siloed Teams, and Outdated Workflows.*",
  items: [
    {
      icon: "layers",
      title: "No Unified Agent Layer",
      text: "Every team wires its own scripts and prompts, so nothing is reusable, versioned or reviewed before it touches customers.",
    },
    {
      icon: "steps",
      title: "Time-Consuming Tasks",
      text: "Skilled people copy data between tabs, chase approvals and re-key the same tickets, every single day.",
    },
    {
      icon: "eye",
      title: "Zero Process Visibility",
      text: "Without real-time insight into agent activity, debugging failures and optimizing workflows becomes a slow, costly guessing game.",
    },
  ],
}

const DEFAULT_SOLUTION = {
  kicker: "The solution",
  title: "Streamline Development, Reduce Errors, and Increase Deployment Speed by 10x with Enterprise-Grade AI Agent Infrastructure",
  features: [
    {
      kicker: "Agent builder",
      visual: "builder",
      title: "Describe the job. Get a working agent.",
      text: "Write instructions in plain language, pick a model and attach tools. Tessel turns it into a versioned agent you can test before anyone depends on it.",
      points: ["Versioned prompts, tools and evals", "Test runs against real data", "Approvals for risky actions"],
    },
    {
      kicker: "Connectors",
      visual: "tools",
      title: "Plug into the systems you already run.",
      text: "More than 120 connectors with scoped credentials. Every call is permissioned per agent and per environment, and every secret stays in your vault.",
      points: ["OAuth, API keys or your own vault", "Read and write scopes per tool", "Bring any REST or GraphQL API"],
    },
    {
      kicker: "Observability",
      visual: "trace",
      title: "See every step, token and tool call.",
      text: "Live traces show what each agent read, decided and did, with latency and cost per span. Replay any run against a new prompt before you ship it.",
      points: ["Span-level latency and cost", "One-click replay", "Alerts on drift and failures"],
    },
    {
      kicker: "Deployment",
      visual: "deploy",
      title: "Promote to production without the 2 a.m. page.",
      text: "Roll out to a slice of traffic, watch success rates live, and let Tessel roll back automatically when a guardrail trips.",
      points: ["Staged rollouts by traffic", "Guardrails and auto-rollback", "SOC 2 Type II, SSO and audit logs"],
    },
  ],
}

const DEFAULT_STATS = [
  { value: 10, suffix: "x", label: "Faster from prototype to production" },
  { value: 73, suffix: "%", label: "Fewer hand-off errors in operations" },
  { value: 2.4, suffix: "M", decimals: 1, label: "Tasks run by Tessel agents each week" },
  { value: 99.95, suffix: "%", decimals: 2, label: "Uptime across every region" },
]

const DEFAULT_CASE = {
  kicker: "Case study",
  company: "Lumen Freight",
  quote:
    "We moved 40% of our dispatch back office onto Tessel agents in six weeks. The traces are what won over our ops leads: they can see exactly why an agent rebooked a load.",
  name: "Daniel Okafor",
  role: "VP Operations, Lumen Freight",
  photo: PHOTO_CASE,
  metrics: [
    { value: "41%", label: "Back-office hours returned" },
    { value: "6 wks", label: "From pilot to production" },
    { value: "3.2x", label: "Faster quote turnaround" },
  ],
}

const DEFAULT_TESTIMONIALS = [
  {
    quote: "Our agents draft, we approve. First response went from four hours to eleven minutes, and CSAT went up.",
    name: "Mara Lindqvist",
    role: "Head of Support, Kitebird",
    avatar: PHOTO_T1,
  },
  {
    quote: "Month-end used to eat three days. Now an agent does the matching and I only review the exceptions.",
    name: "Arthur Benning",
    role: "Controller, Halcyon Health",
    avatar: PHOTO_T2,
  },
  {
    quote: "The trace view is the best debugger I have used for LLM systems. Replays alone paid for the seat.",
    name: "Rafael Domingo",
    role: "Staff Engineer, Paperjet",
    avatar: PHOTO_T3,
  },
]

const DEFAULT_PRICING = {
  kicker: "Pricing",
  title: "Start free. Pay as your agents earn their keep.",
  annualDiscount: 0.2,
  estimator: { included: 5000, per1k: 6, max: 100000 },
  plans: [
    {
      name: "Starter",
      price: 0,
      blurb: "For prototypes and side projects.",
      features: ["3 agents", "1,000 runs a month", "Community connectors", "7-day trace history"],
      cta: { label: "Start for free", href: "#signup" },
    },
    {
      name: "Team",
      price: 49,
      unit: "per seat / month",
      blurb: "For teams putting agents into production.",
      features: ["Unlimited agents", "5,000 runs included", "120+ connectors", "30-day traces and replay", "Approvals and roles"],
      cta: { label: "Start 14-day trial", href: "#signup" },
      featured: true,
    },
    {
      name: "Enterprise",
      price: null,
      blurb: "For regulated, high-volume operations.",
      features: ["SSO, SCIM and audit logs", "VPC or on-prem runners", "Custom guardrails", "99.95% uptime SLA", "A named solutions engineer"],
      cta: { label: "Talk to sales", href: "#" },
    },
  ],
}

const DEFAULT_CTA = {
  title: "Put your first agent to work this week.",
  text: "Free for your first 1,000 runs. No credit card, no sales call.",
  action: "Start for free",
  placeholder: "Work email",
  done: "Check your inbox. Your workspace is ready.",
}

const DEFAULT_FOOTER = {
  tagline: "The operating layer for AI agents that do real work.",
  columns: [
    { title: "Product", links: [{ label: "Agent builder", href: "#product" }, { label: "Connectors", href: "#product" }, { label: "Observability", href: "#product" }, { label: "Pricing", href: "#pricing" }] },
    { title: "Company", links: [{ label: "About" }, { label: "Customers", href: "#customers" }, { label: "Careers" }, { label: "Press" }] },
    { title: "Resources", links: [{ label: "Docs" }, { label: "Changelog" }, { label: "Status" }, { label: "Security" }] },
    { title: "Legal", links: [{ label: "Privacy" }, { label: "Terms" }, { label: "DPA" }] },
  ],
  note: "© 2026 Tessel Labs, Inc. All rights reserved.",
}

const PLAYBOOKS = [
  {
    kind: "support",
    match: /support|ticket|inbox|help ?desk|refund|repl(y|ies)|triage|complain|csat/i,
    title: "Support triage",
    steps: [
      ["inbox.read", "Read {a} open conversations"],
      ["kb.search", "Matched {b} to help-center answers"],
      ["reply.draft", "Drafted {b} replies for review"],
      ["queue.route", "Routed {c} urgent threads to Tier 2"],
    ],
    answer:
      "Triaged {a} conversations. {b} have drafted replies waiting for your approval, {c} urgent threads went to Tier 2, and the rest are tagged for product. Nothing was sent without review.",
  },
  {
    kind: "finance",
    match: /invoice|reconcil|payout|ledger|financ|expense|books|month-end|billing/i,
    title: "Reconciliation",
    steps: [
      ["erp.fetch", "Pulled {a} invoices from the ledger"],
      ["bank.match", "Matched {b} against bank payouts"],
      ["rules.check", "Flagged {c} exceptions over tolerance"],
      ["sheet.write", "Wrote the reconciliation workbook"],
    ],
    answer:
      "Reconciled {a} invoices. {b} matched cleanly, {c} need a human look for an amount or date mismatch, and the workbook with every match is ready to export.",
  },
  {
    kind: "report",
    match: /report|weekly|summar|metric|dashboard|kpi|digest/i,
    title: "Weekly report",
    steps: [
      ["warehouse.query", "Ran 6 queries over {a}k rows"],
      ["trend.detect", "Found {c} notable changes week over week"],
      ["chart.render", "Rendered 4 charts"],
      ["doc.write", "Drafted the report for leadership"],
    ],
    answer:
      "Your weekly report is drafted: 4 charts, {c} callouts on what moved and why, and a summary for leadership. The queries ran over {a}k rows and every figure links back to its source.",
  },
  {
    kind: "sales",
    match: /lead|prospect|sales|crm|outreach|pipeline|account/i,
    title: "Lead research",
    steps: [
      ["crm.search", "Profiled your {c} best-fit accounts"],
      ["enrich.company", "Enriched {a} lookalike companies"],
      ["score.fit", "Scored them and kept the top {d}"],
      ["email.draft", "Drafted first-touch emails"],
    ],
    answer:
      "Found {d} accounts that look like your best customers, enriched with headcount, stack and buying signals. Each has a first-touch draft that says why it fits. They are staged in your CRM, not sent.",
  },
]

const FALLBACK_PLAYBOOK = {
  kind: "general",
  match: /.^/,
  title: "General task",
  steps: [
    ["context.read", "Read the request and workspace context"],
    ["plan.make", "Planned {e} steps"],
    ["tools.call", "Called {e} tools with scoped access"],
    ["result.verify", "Checked the output against your rules"],
  ],
  answer:
    "Done. I broke this into {e} steps, used only the tools this agent is allowed to call, and checked the result against your workspace rules. Open the trace to see every decision.",
}
// #endregion content

// #region logic
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Integer hash to [0, 1). */
function hash2(x: number, y: number, s: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** Smooth value noise in [0, 1]. */
function noise2(x: number, y: number, s: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi, s)
  const b = hash2(xi + 1, yi, s)
  const c = hash2(xi, yi + 1, s)
  const d = hash2(xi + 1, yi + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/** Three octaves of value noise, normalised to [0, 1]. */
function fbm(x: number, y: number, s: number) {
  return (noise2(x, y, s) * 0.5 + noise2(x * 2, y * 2, s + 17) * 0.25 + noise2(x * 4, y * 4, s + 34) * 0.125) / 0.875
}

export type TslScene = "columns" | "silk" | "bloom"

/** Brightness of the mosaic at a point: 0 is the deepest stop, 1 the lightest. */
function fieldAt(scene: TslScene, x: number, y: number, t: number, w: number, h: number, shift: number) {
  if (scene === "silk") {
    const n = fbm(x / 240 + t * 0.035 + shift, y / 240 - shift * 0.4, 7)
    const s = Math.sin((x * 0.62 + y) / 85 + n * 5.5 + t * 0.32 + shift * 2)
    return clamp01(0.48 + 0.44 * s + (n - 0.5) * 0.6)
  }
  if (scene === "bloom") {
    const cx = x / w - 0.5
    const cy = y / h - 1.04
    const r = Math.sqrt(cx * cx * 1.5 + cy * cy)
    const n = fbm(x / 190 + t * 0.045, y / 190 - t * 0.035 + shift, 3)
    return clamp01(1.18 - r * 1.2 + (n - 0.5) * 0.6)
  }
  // columns: tall streaks, with a lit pool in the middle where the card sits
  const n = fbm(x / 160 + t * 0.045 + shift, y / 820 - t * 0.028, 11)
  const band = noise2(x / 58 + shift * 3, 0.5, 5)
  const cx = x / w - 0.5
  const cy = y / h - 0.5
  const glow = Math.exp(-(cx * cx * 3.4 + cy * cy * 4.2))
  const v = n * 0.78 + band * 0.24 + glow * 0.46 - 0.26
  return clamp01((v - 0.42) * 1.55 + 0.45)
}

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!m) return [128, 128, 128]
  let h = m[1]
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mixHex(a: string, b: string, t: number) {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t))
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("")
}

/** n colours along the stops, as rgb() strings. */
function buildRamp(stops: string[], n: number) {
  const rgb = stops.map(hexToRgb)
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const f = (n === 1 ? 0 : i / (n - 1)) * (rgb.length - 1)
    const k = Math.min(rgb.length - 2, Math.floor(f))
    const u = f - k
    const a = rgb[k]
    const b = rgb[k + 1]
    out.push("rgb(" + Math.round(a[0] + (b[0] - a[0]) * u) + "," + Math.round(a[1] + (b[1] - a[1]) * u) + "," + Math.round(a[2] + (b[2] - a[2]) * u) + ")")
  }
  return out
}

/** The same mosaic, lowered for a night page so the lightest pixels do not glare. */
function darkStops(stops: string[]) {
  return [mixHex(stops[0], "#000000", 0.55), stops[0], stops[1], mixHex(stops[2], stops[1], 0.3)]
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Readable text on a colour. */
function onColor(hex: string) {
  return luminance(hex) > 0.4 ? "#0b0b0c" : "#ffffff"
}

function resolvePalette(p: TslPaletteName | TslPaletteInput | undefined) {
  if (!p) return PALETTES.cobalt
  if (typeof p === "string") return PALETTES[p] || PALETTES.cobalt
  const base = PALETTES.cobalt
  const stops = p.stops && p.stops.length === 4 ? p.stops : base.stops
  return { stops, accent: p.accent || stops[0] }
}

/** "*muted*" runs in copy become muted spans. */
function twoTone(s: string) {
  const out: { text: string; muted: boolean }[] = []
  const parts = String(s).split("*")
  parts.forEach((text, i) => {
    if (text) out.push({ text, muted: i % 2 === 1 })
  })
  return out
}

/** Words of two-tone copy, each carrying its tone. */
function toneWords(s: string) {
  const out: { word: string; muted: boolean }[] = []
  for (const run of twoTone(s)) for (const word of run.text.split(/\s+/)) if (word) out.push({ word, muted: run.muted })
  return out
}

function strHash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export type TslRunStep = { tool: string; label: string; ms: number }

export type TslRunPlan = { kind: string; title: string; steps: TslRunStep[]; answer: string }

/** A believable plan for a request: which tools, in what order, and what comes back. */
function planFor(prompt: string) {
  const text = String(prompt).trim()
  const book = PLAYBOOKS.find((b) => b.match.test(text)) || FALLBACK_PLAYBOOK
  const h = strHash(text.toLowerCase())
  const asked = /\b(\d{1,3})\b/.exec(text)
  const a = 120 + (h % 240)
  const vars: { [k: string]: number } = {
    a,
    b: Math.round(a * (0.48 + ((h >>> 8) % 20) / 100)),
    c: 4 + ((h >>> 4) % 17),
    d: asked ? Math.max(1, Math.min(200, +asked[1])) : 20,
    e: 3 + ((h >>> 12) % 4),
  }
  const fill = (s: string) => s.replace(/\{([a-e])\}/g, (_, k) => String(vars[k]))
  const steps = book.steps.map((s, i) => ({ tool: s[0], label: fill(s[1]), ms: 650 + ((h >>> (i * 3)) % 520) }))
  return { kind: book.kind, title: book.title, steps, answer: fill(book.answer) }
}

/** The featured plan's monthly bill for a team. */
function teamEstimate(seats: number, runs: number, annual: boolean, price: number, est: { included: number; per1k: number }, discount = 0.2) {
  const perSeat = annual ? Math.round(price * (1 - discount) * 100) / 100 : price
  const extra = Math.max(0, runs - est.included)
  const overage = Math.ceil(extra / 1000) * est.per1k
  return { perSeat, overage, total: Math.round((perSeat * Math.max(1, seats) + overage) * 100) / 100 }
}

function money(n: number, cur = "$") {
  const neg = n < 0
  const v = Math.abs(n)
  const s = v % 1 === 0 ? Math.round(v).toLocaleString("en-US") : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (neg ? "-" : "") + cur + s
}

function compactCount(n: number) {
  if (n >= 1e6) return (Math.round(n / 1e5) / 10).toString().replace(/\.0$/, "") + "M"
  if (n >= 1e3) return (Math.round(n / 100) / 10).toString().replace(/\.0$/, "") + "k"
  return String(Math.round(n))
}

function formatStat(v: number, decimals = 0) {
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s).trim())
}

function nextIndex(i: number, key: string, n: number) {
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return -1
}

/** A chip-sized version of a suggestion, cut at a word. */
function shortLabel(s: string, max = 32) {
  const t = String(s).trim()
  if (t.length <= max) return t
  const words = t.slice(0, max + 1).split(/\s+/)
  if (words.length > 1) words.pop()
  while (words.length > 2 && /^(and|or|the|a|an|of|to|from|for|with|against|in|on|by)$/i.test(words[words.length - 1])) words.pop()
  return words.join(" ").replace(/[,.;:]+$/, "")
}

/** Pixel sizes a portrait steps through as it resolves. */
function pixelSteps(from: number) {
  const out: number[] = []
  let p = Math.max(1, Math.round(from))
  while (p > 1) {
    out.push(p)
    p = Math.max(1, Math.floor(p * 0.66))
  }
  out.push(1)
  return out
}

const ISO_C = Math.cos(Math.PI / 6)

/** Isometric projection: x runs to the lower right, y to the lower left, z up. */
function isoPt(x: number, y: number, z: number) {
  return [(x - y) * ISO_C, (x + y) * 0.5 - z]
}

/** The three visible faces of a box, as SVG polygon points. */
function isoBox(x: number, y: number, z: number, w: number, d: number, h: number) {
  const p = (a: number, b: number, c: number) => isoPt(a, b, c).map((n) => Math.round(n * 100) / 100).join(",")
  return {
    top: [p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)].join(" "),
    left: [p(x, y + d, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x, y + d, z)].join(" "),
    right: [p(x + w, y, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x + w, y, z)].join(" "),
  }
}
// #endregion logic

const TSL_CSS = `
.tsl-root{--tsl-paper:#ffffff;--tsl-panel:#f6f6f8;--tsl-card:#ffffff;--tsl-ink:#0a0a0b;--tsl-soft:#3b3c42;--tsl-muted:#6a6c74;--tsl-faint:#9a9ca4;--tsl-line:#ececf0;--tsl-line2:#dcdde3;--tsl-btn:#0a0a0b;--tsl-on-btn:#ffffff;--tsl-night:#000000;--tsl-night-line:rgba(255,255,255,.1);--tsl-shadow:0 1px 2px rgba(10,12,30,.06),0 18px 40px -18px rgba(18,28,90,.35);--tsl-serif:"Tiempos Headline","Charter","Bitstream Charter","Iowan Old Style","Source Serif 4",Georgia,Cambria,"Times New Roman",serif;--tsl-sans:"Inter","Geist",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--tsl-mono:"JetBrains Mono","Geist Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--tsl-ease:cubic-bezier(.22,1,.36,1);--tsl-nav:60px;--tsl-gut:48px;position:relative;isolation:isolate;overflow-x:clip;background:var(--tsl-paper);color:var(--tsl-ink);font-family:var(--tsl-sans);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;color-scheme:light}
.tsl-root[data-theme="dark"]{--tsl-paper:#0b0c0f;--tsl-panel:#111318;--tsl-card:#14161c;--tsl-ink:#f2f3f6;--tsl-soft:#c5c7cf;--tsl-muted:#8e919b;--tsl-faint:#62656e;--tsl-line:rgba(255,255,255,.08);--tsl-line2:rgba(255,255,255,.14);--tsl-btn:#f2f3f6;--tsl-on-btn:#0a0a0b;--tsl-night:#030304;--tsl-shadow:0 1px 2px rgba(0,0,0,.5),0 22px 50px -20px rgba(0,0,0,.9);color-scheme:dark}
.tsl-root :where(*,*::before,*::after){box-sizing:border-box}
.tsl-root :where(h1,h2,h3,h4,p,ul,ol,li,figure,blockquote,dl,dd){margin:0;padding:0}
.tsl-root :where(ul,ol){list-style:none}
.tsl-root :where(a){color:inherit;text-decoration:none}
.tsl-root :where(button,input,textarea,select){font:inherit;color:inherit;letter-spacing:inherit}
.tsl-root :where(button){background:none;border:0;padding:0;cursor:pointer}
.tsl-root :where(svg,img,canvas){display:block;max-width:none}
.tsl-root :where(a,button,input,textarea,[tabindex]):focus-visible{outline:2px solid var(--tsl-accent);outline-offset:2px}
.tsl-skip{position:absolute;left:12px;top:-60px;z-index:100;background:var(--tsl-btn);color:var(--tsl-on-btn);padding:10px 14px;font-size:13px;transition:top .2s}
.tsl-skip:focus{top:12px}
.tsl-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.tsl-frame{position:relative;max-width:1240px;margin:0 auto;border-left:1px solid var(--tsl-line);border-right:1px solid var(--tsl-line)}
.tsl-sec{position:relative;padding:112px var(--tsl-gut)}
.tsl-sec+.tsl-sec{border-top:1px solid var(--tsl-line)}
.tsl-cross{position:absolute;top:-6px;width:11px;height:11px;pointer-events:none;z-index:2}
.tsl-cross::before,.tsl-cross::after{content:"";position:absolute;background:var(--tsl-line2)}
.tsl-cross::before{left:5px;top:0;width:1px;height:11px}
.tsl-cross::after{top:5px;left:0;height:1px;width:11px}
.tsl-cross[data-side="l"]{left:-6px}
.tsl-cross[data-side="r"]{right:-6px}

.tsl-kicker{display:inline-flex;align-items:center;gap:8px;font-family:var(--tsl-mono);font-size:10.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--tsl-ink)}
.tsl-kicker svg{flex:none}
.tsl-night .tsl-kicker{color:#fff}
.tsl-h1{font-family:var(--tsl-serif);font-weight:400;font-size:clamp(36px,4.7vw,58px);line-height:1.07;letter-spacing:-.022em}
.tsl-h2{font-family:var(--tsl-serif);font-weight:400;font-size:clamp(28px,3.3vw,42px);line-height:1.14;letter-spacing:-.018em}
.tsl-h3{font-family:var(--tsl-serif);font-weight:400;font-size:clamp(20px,1.7vw,23px);line-height:1.25;letter-spacing:-.01em}
.tsl-line{display:block;overflow:hidden;padding-bottom:.08em;margin-bottom:-.08em}
.tsl-line>span{display:inline-block}
.tsl-muted{color:var(--tsl-muted)}
.tsl-lead{font-size:15px;color:var(--tsl-soft);max-width:440px}

.tsl-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;height:40px;padding:0 18px;border-radius:2px;font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;isolation:isolate;overflow:hidden;transition:color .25s var(--tsl-ease),border-color .25s,background .25s}
.tsl-btn::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--tsl-accent);clip-path:inset(0 100% 0 0);transition:clip-path .45s steps(6,end)}
.tsl-btn:hover::before{clip-path:inset(0 0 0 0)}
.tsl-btn svg{transition:transform .35s var(--tsl-ease)}
.tsl-btn:hover svg{transform:translateX(3px)}
.tsl-btn-solid{background:var(--tsl-btn);color:var(--tsl-on-btn)}
.tsl-btn-solid:hover{color:var(--tsl-on-accent)}
.tsl-btn-line{border:1px solid var(--tsl-line2);background:var(--tsl-card);color:var(--tsl-ink)}
.tsl-btn-line::before{background:var(--tsl-panel)}
.tsl-btn-line:hover{border-color:var(--tsl-ink)}
.tsl-btn-block{width:100%}
.tsl-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;border-bottom:1px solid transparent;transition:border-color .2s,gap .2s}
.tsl-link:hover{border-color:currentColor;gap:9px}

.tsl-announce{position:relative;z-index:31;background:#000;color:rgba(255,255,255,.72);font-size:12px;text-align:center}
.tsl-announce a{display:inline-flex;align-items:center;gap:8px;padding:8px 40px;transition:color .2s}
.tsl-announce a:hover{color:#fff}
.tsl-announce b{color:#fff;font-weight:500}
.tsl-announce-x{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:26px;height:26px;display:grid;place-items:center;color:rgba(255,255,255,.55);border-radius:2px}
.tsl-announce-x:hover{color:#fff;background:rgba(255,255,255,.08)}

.tsl-nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--tsl-paper) 96%,transparent);backdrop-filter:saturate(1.4) blur(10px);-webkit-backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid transparent;transition:border-color .3s,background .3s}
.tsl-nav[data-scrolled]{border-bottom-color:var(--tsl-line)}
.tsl-nav-in{max-width:1240px;margin:0 auto;height:var(--tsl-nav);display:flex;align-items:center;gap:28px;padding:0 24px;border-left:1px solid var(--tsl-line);border-right:1px solid var(--tsl-line)}
.tsl-brand{display:inline-flex;align-items:center;gap:10px;font-family:var(--tsl-serif);font-size:20px;letter-spacing:-.02em}
.tsl-mark rect{transition:opacity .3s,transform .4s var(--tsl-ease);transform-box:fill-box;transform-origin:center}
.tsl-brand:hover .tsl-mark rect:nth-child(odd){transform:scale(.55);opacity:.5}
.tsl-brand:hover .tsl-mark rect:nth-child(5){transform:rotate(45deg) scale(.9)}
.tsl-menu{display:flex;align-items:center;gap:4px}
.tsl-menu>li{position:relative}
.tsl-menu-a{display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 10px;font-size:13px;color:var(--tsl-soft);border-radius:2px;transition:color .2s,background .2s}
.tsl-menu-a:hover,.tsl-menu-a[aria-expanded="true"]{color:var(--tsl-ink);background:var(--tsl-panel)}
.tsl-menu-a svg{transition:transform .3s var(--tsl-ease)}
.tsl-menu-a[aria-expanded="true"] svg{transform:rotate(180deg)}
.tsl-drop{position:absolute;left:-8px;top:calc(100% + 10px);width:300px;padding:8px;background:var(--tsl-card);border:1px solid var(--tsl-line2);box-shadow:var(--tsl-shadow);border-radius:4px;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .2s,transform .3s var(--tsl-ease)}
.tsl-drop[data-open]{opacity:1;transform:none;pointer-events:auto}
.tsl-drop a{display:grid;grid-template-columns:28px 1fr;gap:2px 10px;padding:10px;border-radius:3px;transition:background .2s}
.tsl-drop a:hover,.tsl-drop a:focus-visible{background:var(--tsl-panel)}
.tsl-drop i{grid-row:span 2;width:28px;height:28px;display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:5px;border:1px solid var(--tsl-line2);border-radius:2px}
.tsl-drop i span{background:var(--tsl-accent);opacity:.25}
.tsl-drop i span[data-on]{opacity:1}
.tsl-drop b{font-weight:550;font-size:13px}
.tsl-drop small{font-size:12px;color:var(--tsl-muted);line-height:1.4}
.tsl-nav-right{margin-left:auto;display:flex;align-items:center;gap:10px}
.tsl-signin{font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:0 10px;height:34px;display:inline-flex;align-items:center;border-radius:2px}
.tsl-signin:hover{background:var(--tsl-panel)}
.tsl-icon-btn{width:34px;height:34px;display:inline-grid;place-items:center;border-radius:2px;color:var(--tsl-soft);transition:background .2s,color .2s}
.tsl-icon-btn:hover{background:var(--tsl-panel);color:var(--tsl-ink)}
.tsl-burger{display:none}
.tsl-progress{position:absolute;left:0;right:0;bottom:-1px;height:2px;display:flex;gap:2px;pointer-events:none}
.tsl-progress i{flex:1;background:var(--tsl-accent);transform:scaleY(0);transform-origin:bottom;transition:transform .25s var(--tsl-ease)}
.tsl-progress i[data-on]{transform:scaleY(1)}
.tsl-sheet{position:fixed;inset:0;z-index:60;background:var(--tsl-paper);padding:16px 20px 28px;display:flex;flex-direction:column;overflow:auto;animation:tsl-fade .25s var(--tsl-ease)}
.tsl-sheet-top{display:flex;align-items:center;justify-content:space-between;height:44px;margin-bottom:18px}
.tsl-sheet-list>li{border-bottom:1px solid var(--tsl-line)}
.tsl-sheet-list a{display:flex;justify-content:space-between;align-items:center;padding:16px 2px;font-family:var(--tsl-serif);font-size:24px}
.tsl-sheet-sub{padding:0 0 14px;display:grid;gap:4px}
.tsl-sheet-sub a{font-family:var(--tsl-sans);font-size:14px;padding:6px 2px;color:var(--tsl-soft)}
.tsl-sheet-cta{margin-top:auto;display:grid;gap:10px;padding-top:24px}

.tsl-hero{padding:72px var(--tsl-gut) 0}
.tsl-badge{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--tsl-soft)}
.tsl-badge i{width:18px;height:18px;display:grid;place-items:center;background:#f26522;color:#fff;font-style:normal;font-size:11px;font-weight:600;border-radius:2px}
.tsl-hero .tsl-h1{margin-top:22px;max-width:760px}
.tsl-hero-text{margin-top:20px}
.tsl-hero-actions{margin-top:30px;display:flex;flex-wrap:wrap;gap:10px}
.tsl-hero-panel{position:relative;margin-top:56px;min-height:clamp(420px,calc(var(--tsl-h) * .62),640px);display:grid;place-items:center;padding:56px 20px 64px;overflow:hidden;isolation:isolate;background:var(--tsl-c1)}
.tsl-mosaic{position:absolute;inset:0;z-index:-1;overflow:hidden}
.tsl-mosaic canvas{position:absolute;left:0;top:0}
.tsl-mosaic[data-interactive]{cursor:crosshair}
.tsl-hero-ruler{position:absolute;left:0;right:0;bottom:0;height:22px;display:flex;justify-content:space-between;align-items:flex-end;padding:0 14px 6px;font-family:var(--tsl-mono);font-size:9.5px;color:rgba(255,255,255,.8);letter-spacing:.08em;pointer-events:none}
.tsl-prompt-wrap{width:min(760px,100%);display:grid;gap:14px;justify-items:center}
.tsl-prompt{width:min(560px,100%);background:var(--tsl-card);border-radius:8px;padding:6px;box-shadow:0 0 0 6px rgba(255,255,255,.28),0 30px 60px -24px rgba(12,20,80,.55);text-align:left}
.tsl-prompt-label{display:flex;align-items:center;justify-content:space-between;padding:6px 10px 8px;font-size:11.5px;color:var(--tsl-muted)}
.tsl-prompt-label span{display:inline-flex;align-items:center;gap:7px}
.tsl-prompt-label i{width:6px;height:6px;border-radius:1px;background:var(--tsl-accent)}
.tsl-prompt[data-phase="running"] .tsl-prompt-label i{animation:tsl-blink 1s steps(2,end) infinite}
.tsl-prompt-box{border:1px solid var(--tsl-line2);border-radius:6px;background:var(--tsl-card);transition:border-color .2s,box-shadow .2s}
.tsl-prompt-box:focus-within{border-color:var(--tsl-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--tsl-accent) 16%,transparent)}
.tsl-prompt-area{position:relative}
.tsl-prompt textarea:focus-visible{outline:0}
.tsl-prompt textarea{display:block;width:100%;min-height:76px;max-height:160px;resize:none;border:0;outline:0;background:transparent;padding:14px 14px 4px;font-size:14px;line-height:1.5}
.tsl-ph{position:absolute;left:14px;top:14px;right:14px;font-size:14px;color:var(--tsl-faint);pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tsl-ph::after{content:"";display:inline-block;width:1px;height:15px;margin-left:1px;vertical-align:-2px;background:currentColor;animation:tsl-blink 1s steps(2,end) infinite}
.tsl-prompt-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 10px}
.tsl-model{position:relative}
.tsl-model-btn{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 8px;font-size:11px;color:var(--tsl-soft);background:var(--tsl-panel);border:1px solid var(--tsl-line);border-radius:3px}
.tsl-model-btn:hover{border-color:var(--tsl-line2)}
.tsl-model-list{position:absolute;left:0;bottom:calc(100% + 6px);min-width:200px;padding:4px;background:var(--tsl-card);border:1px solid var(--tsl-line2);border-radius:4px;box-shadow:var(--tsl-shadow);z-index:5;animation:tsl-pop .2s var(--tsl-ease)}
.tsl-model-list li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 10px;font-size:12px;border-radius:3px;cursor:pointer}
.tsl-model-list li small{color:var(--tsl-muted);font-size:11px}
.tsl-model-list li[data-active]{background:var(--tsl-panel)}
.tsl-model-list li[aria-selected="true"] b::after{content:"";display:inline-block;width:5px;height:5px;margin-left:7px;vertical-align:2px;background:var(--tsl-accent)}
.tsl-model-list b{font-weight:550}
.tsl-send{width:28px;height:28px;display:grid;place-items:center;background:var(--tsl-btn);color:var(--tsl-on-btn);border-radius:3px;transition:transform .2s var(--tsl-ease),opacity .2s}
.tsl-send:hover:not(:disabled){transform:translateY(-1px)}
.tsl-send:disabled{opacity:.35;cursor:not-allowed}
.tsl-run{display:grid;grid-template-rows:0fr;transition:grid-template-rows .55s var(--tsl-ease)}
.tsl-run[data-open]{grid-template-rows:1fr}
.tsl-run>div{min-height:0;overflow:hidden}
.tsl-run-in{padding:8px 6px 4px}
.tsl-run-head{display:flex;align-items:center;justify-content:space-between;padding:8px 6px 10px;font-size:11.5px;color:var(--tsl-muted)}
.tsl-run-head b{font-weight:550;color:var(--tsl-ink)}
.tsl-run-head span{font-family:var(--tsl-mono);font-size:10.5px}
.tsl-steps{display:grid;gap:2px}
.tsl-step{display:grid;grid-template-columns:18px auto 1fr auto;align-items:center;gap:10px;padding:7px 6px;font-size:12.5px;border-radius:3px;opacity:.35;transition:opacity .3s,background .3s}
.tsl-step[data-state="active"],.tsl-step[data-state="done"]{opacity:1}
.tsl-step[data-state="active"]{background:var(--tsl-panel)}
.tsl-step code{font-family:var(--tsl-mono);font-size:10.5px;padding:2px 6px;border-radius:2px;background:color-mix(in srgb,var(--tsl-accent) 10%,transparent);color:var(--tsl-accent)}
.tsl-root[data-theme="dark"] .tsl-step code{color:color-mix(in srgb,var(--tsl-accent) 45%,#fff)}
.tsl-step em{font-style:normal;color:var(--tsl-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tsl-step time{font-family:var(--tsl-mono);font-size:10.5px;color:var(--tsl-faint)}
.tsl-spin{width:14px;height:14px;display:grid;grid-template-columns:1fr 1fr;gap:2px}
.tsl-spin span{background:var(--tsl-accent);animation:tsl-spin 1s steps(1,end) infinite}
.tsl-spin span:nth-child(2){animation-delay:.25s}
.tsl-spin span:nth-child(4){animation-delay:.5s}
.tsl-spin span:nth-child(3){animation-delay:.75s}
.tsl-dot{width:6px;height:6px;margin:4px;border-radius:1px;background:var(--tsl-line2)}
.tsl-check{color:var(--tsl-accent)}
.tsl-answer{margin:10px 6px 4px;padding:12px 14px;border-left:2px solid var(--tsl-accent);background:var(--tsl-panel);font-size:13px;line-height:1.6;color:var(--tsl-soft);min-height:48px}
.tsl-answer[data-error]{border-color:#e5484d;color:#e5484d}
.tsl-caret{display:inline-block;width:7px;height:13px;margin-left:2px;vertical-align:-2px;background:var(--tsl-accent);animation:tsl-blink 1s steps(2,end) infinite}
.tsl-run-foot{display:flex;justify-content:flex-end;gap:6px;padding:8px 6px 6px}
.tsl-mini{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;font-size:11.5px;border:1px solid var(--tsl-line2);border-radius:3px;background:var(--tsl-card);transition:border-color .2s}
.tsl-mini:hover{border-color:var(--tsl-ink)}
.tsl-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.tsl-chip{height:28px;padding:0 12px;font-size:12px;color:#0a0a0b;background:rgba(255,255,255,.86);border:1px solid rgba(255,255,255,.95);border-radius:2px;transition:background .2s,transform .25s var(--tsl-ease)}
.tsl-chip:hover{background:#fff;transform:translateY(-1px)}
.tsl-chip:disabled{opacity:.5;cursor:default;transform:none}

.tsl-logos{padding:40px 0;overflow:hidden;position:relative}
.tsl-logos::before,.tsl-logos::after{content:"";position:absolute;top:0;bottom:0;width:120px;z-index:1;pointer-events:none}
.tsl-logos::before{left:0;background:linear-gradient(90deg,var(--tsl-paper),transparent)}
.tsl-logos::after{right:0;background:linear-gradient(270deg,var(--tsl-paper),transparent)}
.tsl-logos-track{display:flex;width:max-content;animation:tsl-marquee 38s linear infinite}
.tsl-logos:hover .tsl-logos-track{animation-play-state:paused}
.tsl-logo{display:inline-flex;align-items:center;gap:8px;padding:0 44px;font-size:19px;color:var(--tsl-ink);opacity:.82;transition:opacity .25s}
.tsl-logo:hover{opacity:1}
.tsl-logo[data-style="bold"]{font-weight:700;letter-spacing:-.03em}
.tsl-logo[data-style="italic"]{font-style:italic;font-weight:650;letter-spacing:-.02em}
.tsl-logo[data-style="light"]{font-weight:500;letter-spacing:-.01em}
.tsl-logo[data-style="caps"]{font-weight:600;font-size:15px;letter-spacing:.18em;text-transform:uppercase}

.tsl-night{background:var(--tsl-night);color:#fff;padding-top:120px;padding-bottom:120px}
.tsl-sec.tsl-night+.tsl-sec{border-top-color:transparent}
.tsl-night .tsl-cross::before,.tsl-night .tsl-cross::after{background:rgba(255,255,255,.22)}
.tsl-center{text-align:center;display:grid;justify-items:center}
.tsl-center .tsl-h2{margin-top:22px;max-width:820px}
.tsl-w{display:inline}
.tsl-night .tsl-w[data-muted]{color:rgba(255,255,255,.42)}
.tsl-w[data-muted]{color:var(--tsl-muted)}
.tsl-pcards{margin-top:64px;display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--tsl-night-line)}
.tsl-pcard{position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:300px;padding:28px;text-align:left;color:#fff;overflow:hidden;cursor:pointer;transition:background .4s var(--tsl-ease)}
.tsl-pcard+.tsl-pcard{border-left:1px solid var(--tsl-night-line)}
.tsl-pcard:hover,.tsl-pcard[data-open]{background:#07080c}
.tsl-pcard-icon{width:120px;height:120px;margin:-8px 0 0 -10px}
.tsl-pcard-icon g{transition:transform .7s var(--tsl-ease)}
.tsl-pcard h3{font-family:var(--tsl-serif);font-weight:400;font-size:19px;letter-spacing:-.01em}
.tsl-pcard h3 button{text-align:left;font:inherit;color:inherit}
.tsl-pcard h3 button::after{content:"";position:absolute;inset:0;z-index:1}
.tsl-pcard h3 button:focus-visible{outline:0}
.tsl-pcard:has(:focus-visible){outline:2px solid var(--tsl-accent);outline-offset:-2px}
.tsl-pcard-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .55s var(--tsl-ease)}
.tsl-pcard-body>div{overflow:hidden;min-height:0}
.tsl-pcard-body p{padding-top:10px;font-size:13px;line-height:1.6;color:rgba(255,255,255,.62);max-width:300px}
.tsl-pcard:hover .tsl-pcard-body,.tsl-pcard[data-open] .tsl-pcard-body,.tsl-pcard:focus-within .tsl-pcard-body{grid-template-rows:1fr}
.tsl-pcard-px{position:absolute;right:16px;top:16px;display:grid;grid-template-columns:repeat(3,6px);gap:3px}
.tsl-pcard-px span{width:6px;height:6px;background:var(--tsl-accent);opacity:0;transform:scale(.3);transition:opacity .3s,transform .4s var(--tsl-ease)}
.tsl-pcard:hover .tsl-pcard-px span,.tsl-pcard[data-open] .tsl-pcard-px span{opacity:1;transform:none}
.tsl-pcard-num{position:absolute;right:20px;bottom:22px;font-family:var(--tsl-mono);font-size:10.5px;color:rgba(255,255,255,.35)}
.tsl-pcard:hover .lift1,.tsl-pcard[data-open] .lift1{transform:translateY(-8px)}
.tsl-pcard:hover .lift2,.tsl-pcard[data-open] .lift2{transform:translateY(-16px)}
.tsl-pcard:hover .lift3,.tsl-pcard[data-open] .lift3{transform:translateY(-24px)}
.tsl-pcard:hover .liftlid,.tsl-pcard[data-open] .liftlid{transform:translateY(-30px);opacity:.38}
.tsl-pcard .liftlid{transition:transform .7s var(--tsl-ease),opacity .5s}
.tsl-pcard:hover .rise,.tsl-pcard[data-open] .rise{transform:translateY(-10px)}
.tsl-pcard .rise:nth-of-type(2){transition-delay:.06s}
.tsl-pcard .rise:nth-of-type(3){transition-delay:.12s}
.tsl-pcard .rise:nth-of-type(4){transition-delay:.18s}
.tsl-pcard .rise:nth-of-type(5){transition-delay:.24s}

.tsl-feat{margin-top:88px;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:64px;align-items:start}
.tsl-feat-steps{position:relative}
.tsl-feat-rail{position:absolute;left:0;top:0;bottom:0;width:1px;background:var(--tsl-line)}
.tsl-feat-rail i{position:absolute;left:-1px;top:0;width:3px;background:var(--tsl-accent);transition:transform .6s var(--tsl-ease),height .6s var(--tsl-ease)}
.tsl-step-item{min-height:clamp(380px,62vh,560px);display:flex;flex-direction:column;justify-content:center;padding-left:32px;opacity:.32;transition:opacity .5s var(--tsl-ease)}
.tsl-step-item[data-active]{opacity:1}
.tsl-step-item .tsl-h3{margin-top:16px;font-size:clamp(22px,2vw,28px)}
.tsl-step-item p{margin-top:14px;color:var(--tsl-soft);max-width:420px}
.tsl-points{margin-top:20px;display:grid;gap:9px}
.tsl-points li{display:flex;align-items:center;gap:10px;font-size:13.5px}
.tsl-points li::before{content:"";width:6px;height:6px;flex:none;background:var(--tsl-accent)}
.tsl-stage{position:sticky;top:calc(var(--tsl-nav) + 40px);height:clamp(460px,72vh,620px);display:grid;place-items:center;overflow:hidden;isolation:isolate;padding:28px;background:var(--tsl-c1)}
.tsl-stage-tag{position:absolute;left:14px;top:12px;font-family:var(--tsl-mono);font-size:10px;letter-spacing:.1em;color:rgba(255,255,255,.85);text-transform:uppercase}
.tsl-stage-card{width:min(420px,100%);background:var(--tsl-card);border-radius:8px;box-shadow:0 0 0 6px rgba(255,255,255,.25),0 30px 60px -24px rgba(12,20,80,.55);overflow:hidden}
.tsl-stage-card>div{padding:16px}
.tsl-feat-tabs{display:none}
.tsl-feat-mobile{display:none}
.tsl-card-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--tsl-line)}
.tsl-card-head b{font-family:var(--tsl-mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:500}
.tsl-pill{display:inline-flex;align-items:center;gap:6px;height:20px;padding:0 8px;font-size:10.5px;border-radius:10px;background:var(--tsl-panel);color:var(--tsl-soft)}
.tsl-pill i{width:6px;height:6px;border-radius:50%;background:#30a46c}
.tsl-field{margin-bottom:12px}
.tsl-field label,.tsl-field>span{display:block;font-size:11px;color:var(--tsl-muted);margin-bottom:6px}
.tsl-field-box{border:1px solid var(--tsl-line2);border-radius:5px;padding:10px 12px;font-size:12.5px;line-height:1.55;min-height:62px;background:var(--tsl-panel)}
.tsl-toggles{display:grid;gap:2px}
.tsl-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 2px;font-size:12.5px;width:100%;text-align:left}
.tsl-toggle small{color:var(--tsl-muted);font-size:11px;margin-left:6px}
.tsl-switch{position:relative;width:28px;height:16px;flex:none;border-radius:9px;background:var(--tsl-line2);transition:background .25s}
.tsl-switch::after{content:"";position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .3s var(--tsl-ease)}
.tsl-toggle[aria-checked="true"] .tsl-switch{background:var(--tsl-accent)}
.tsl-toggle[aria-checked="true"] .tsl-switch::after{transform:translateX(12px)}
.tsl-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid var(--tsl-line);font-size:11.5px;color:var(--tsl-muted)}
.tsl-graph{width:100%;height:auto}
.tsl-graph .edge{fill:none;stroke:var(--tsl-line2);stroke-width:1.2}
.tsl-graph .edge[data-on]{stroke:var(--tsl-accent);stroke-dasharray:4 4;animation:tsl-dash 1.2s linear infinite}
.tsl-graph .node{cursor:pointer}
.tsl-graph .node rect{fill:var(--tsl-card);stroke:var(--tsl-line2);transition:stroke .2s,fill .2s}
.tsl-graph .node[data-on] rect{stroke:var(--tsl-accent)}
.tsl-graph .node:hover rect,.tsl-graph .node:focus-visible rect{fill:var(--tsl-panel)}
.tsl-graph .node text{font-family:var(--tsl-mono);font-size:9.5px;fill:var(--tsl-soft)}
.tsl-graph .node[data-on] text{fill:var(--tsl-ink)}
.tsl-graph .core rect{fill:var(--tsl-btn)}
.tsl-graph .core text{fill:var(--tsl-on-btn);font-family:var(--tsl-sans);font-size:11px;font-weight:600}
.tsl-graph .node:focus{outline:none}
.tsl-wf{display:grid;gap:6px}
.tsl-wf-row{display:grid;grid-template-columns:98px 1fr;align-items:center;gap:10px;font-family:var(--tsl-mono);font-size:10.5px;color:var(--tsl-soft);padding:3px 4px;border-radius:3px;cursor:default;transition:background .2s}
.tsl-wf-row:hover,.tsl-wf-row:focus-visible{background:var(--tsl-panel)}
.tsl-wf-track{position:relative;height:12px}
.tsl-wf-bar{position:absolute;top:0;height:12px;border-radius:2px;background:var(--tsl-accent);transform-origin:left;transform:scaleX(0);transition:transform .7s var(--tsl-ease)}
.tsl-wf[data-play] .tsl-wf-bar{transform:scaleX(1)}
.tsl-wf-bar[data-kind="llm"]{background:color-mix(in srgb,var(--tsl-accent) 55%,#fff)}
.tsl-wf-bar[data-kind="tool"]{background:var(--tsl-ink)}
.tsl-wf-axis{display:flex;justify-content:space-between;font-family:var(--tsl-mono);font-size:9.5px;color:var(--tsl-faint);padding:4px 4px 0 112px}
.tsl-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tsl-metric{border:1px solid var(--tsl-line);border-radius:5px;padding:10px 12px}
.tsl-metric small{display:block;font-size:10.5px;color:var(--tsl-muted)}
.tsl-metric b{display:block;margin-top:4px;font-family:var(--tsl-serif);font-weight:400;font-size:24px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.tsl-seg{display:inline-flex;padding:2px;border-radius:4px;background:var(--tsl-panel);border:1px solid var(--tsl-line)}
.tsl-seg button{height:24px;padding:0 10px;font-size:11.5px;border-radius:3px;color:var(--tsl-muted);transition:background .2s,color .2s}
.tsl-seg button[aria-pressed="true"],.tsl-seg button[aria-checked="true"]{background:var(--tsl-card);color:var(--tsl-ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.tsl-range{width:100%;accent-color:var(--tsl-accent)}
.tsl-range-row{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--tsl-muted);margin:12px 0 4px}
.tsl-range-row b{color:var(--tsl-ink);font-weight:550;font-variant-numeric:tabular-nums}

.tsl-stats{display:grid;grid-template-columns:repeat(4,1fr);padding:0}
.tsl-stat{padding:48px 32px;display:flex;flex-direction:column;gap:14px}
.tsl-stat+.tsl-stat{border-left:1px solid var(--tsl-line)}
.tsl-stat b{font-family:var(--tsl-serif);font-weight:400;font-size:clamp(38px,4vw,54px);line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.tsl-stat p{font-size:13px;color:var(--tsl-muted);max-width:220px}
.tsl-stat-px{display:flex;gap:3px}
.tsl-stat-px span{width:8px;height:8px;background:var(--tsl-line2);transition:background .3s}
.tsl-stat-px span[data-on]{background:var(--tsl-accent)}

.tsl-case{margin-top:48px;display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);border:1px solid var(--tsl-line)}
.tsl-portrait{position:relative;aspect-ratio:5/6;overflow:hidden;background:var(--tsl-c1)}
.tsl-portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%;max-width:none}
.tsl-portrait canvas{position:absolute;left:0;top:0}
.tsl-portrait::after{content:"";position:absolute;inset:auto 0 0 0;height:40%;background:linear-gradient(0deg,color-mix(in srgb,var(--tsl-c0) 55%,transparent),transparent);pointer-events:none}
.tsl-portrait-tag{position:absolute;left:14px;bottom:14px;z-index:1;font-family:var(--tsl-mono);font-size:10px;letter-spacing:.1em;color:#fff;text-transform:uppercase}
.tsl-case-body{padding:44px;display:flex;flex-direction:column;justify-content:space-between;gap:36px}
.tsl-case-co{font-family:var(--tsl-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--tsl-muted)}
.tsl-case blockquote{font-family:var(--tsl-serif);font-size:clamp(21px,2.1vw,28px);line-height:1.35;letter-spacing:-.012em}
.tsl-case-who b{display:block;font-weight:550;font-size:14px}
.tsl-case-who span{font-size:13px;color:var(--tsl-muted)}
.tsl-case-metrics{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--tsl-line);padding-top:24px;gap:16px}
.tsl-case-metrics b{display:block;font-family:var(--tsl-serif);font-weight:400;font-size:30px;letter-spacing:-.02em}
.tsl-case-metrics span{font-size:12px;color:var(--tsl-muted)}
.tsl-quotes{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--tsl-line);border-top:0}
.tsl-quote{padding:28px;display:flex;flex-direction:column;justify-content:space-between;gap:24px;transition:background .3s}
.tsl-quote:hover{background:var(--tsl-panel)}
.tsl-quote+.tsl-quote{border-left:1px solid var(--tsl-line)}
.tsl-quote p{font-size:14.5px;line-height:1.6;color:var(--tsl-soft)}
.tsl-quote footer{display:flex;align-items:center;gap:12px}
.tsl-quote img,.tsl-quote .tsl-av{width:36px;height:36px;border-radius:2px;object-fit:cover;flex:none;filter:grayscale(1) contrast(1.05);transition:filter .4s}
.tsl-quote:hover img{filter:none}
.tsl-av{display:grid;place-items:center;background:var(--tsl-accent);color:var(--tsl-on-accent);font-size:12px;font-weight:600}
.tsl-quote b{display:block;font-size:13px;font-weight:550}
.tsl-quote span{font-size:12px;color:var(--tsl-muted)}

.tsl-price-top{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap}
.tsl-price-top .tsl-h2{margin-top:18px;max-width:560px}
.tsl-plans{margin-top:48px;display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--tsl-line)}
.tsl-plan{position:relative;display:flex;flex-direction:column;padding:28px;gap:20px}
.tsl-plan+.tsl-plan{border-left:1px solid var(--tsl-line)}
.tsl-plan[data-featured]{background:var(--tsl-panel)}
.tsl-plan-band{position:relative;height:84px;margin:-28px -28px 0;overflow:hidden;isolation:isolate;background:var(--tsl-c1);display:flex;align-items:flex-end;padding:10px 14px}
.tsl-plan-band span{font-family:var(--tsl-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:rgba(0,0,0,.35);padding:3px 7px;border-radius:2px}
.tsl-plan h3{font-family:var(--tsl-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:500}
.tsl-plan-price{display:flex;align-items:baseline;gap:8px;min-height:52px}
.tsl-plan-price b{font-family:var(--tsl-serif);font-weight:400;font-size:46px;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.tsl-plan-price span{font-size:12px;color:var(--tsl-muted)}
.tsl-plan p{font-size:13.5px;color:var(--tsl-soft)}
.tsl-plan ul{display:grid;gap:10px;font-size:13.5px}
.tsl-plan li{display:flex;gap:10px;align-items:flex-start}
.tsl-plan li svg{flex:none;margin-top:3px;color:var(--tsl-accent)}
.tsl-plan .tsl-btn{margin-top:auto}
.tsl-est{border:1px dashed var(--tsl-line2);border-radius:4px;padding:12px 14px;background:var(--tsl-card)}
.tsl-est-row{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--tsl-muted)}
.tsl-est-total{margin-top:10px;display:flex;align-items:baseline;justify-content:space-between;font-size:12px;color:var(--tsl-muted)}
.tsl-est-total b{font-family:var(--tsl-serif);font-weight:400;font-size:22px;color:var(--tsl-ink);font-variant-numeric:tabular-nums}
.tsl-stepper{display:inline-flex;align-items:center;border:1px solid var(--tsl-line2);border-radius:3px}
.tsl-stepper button{width:24px;height:24px;display:grid;place-items:center}
.tsl-stepper button:hover{background:var(--tsl-panel)}
.tsl-stepper output{min-width:28px;text-align:center;font-size:12px;color:var(--tsl-ink);font-variant-numeric:tabular-nums}

.tsl-cta{padding:0}
.tsl-cta-panel{position:relative;min-height:clamp(420px,calc(var(--tsl-h) * .6),560px);display:grid;place-items:center;padding:64px 20px;overflow:hidden;isolation:isolate;background:var(--tsl-c1)}
.tsl-cta-card{width:min(560px,100%);background:var(--tsl-card);border-radius:8px;padding:36px;text-align:center;box-shadow:0 0 0 6px rgba(255,255,255,.28),0 30px 60px -24px rgba(12,20,80,.55)}
.tsl-cta-card .tsl-h2{font-size:clamp(26px,2.8vw,36px)}
.tsl-cta-card p{margin-top:12px;color:var(--tsl-soft);font-size:14px}
.tsl-form{margin-top:24px;display:flex;gap:8px}
.tsl-form input{flex:1;min-width:0;height:40px;padding:0 12px;border:1px solid var(--tsl-line2);border-radius:2px;background:var(--tsl-card);font-size:14px;outline:0;transition:border-color .2s,box-shadow .2s}
.tsl-form input:focus{border-color:var(--tsl-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--tsl-accent) 16%,transparent)}
.tsl-form input[aria-invalid="true"]{border-color:#e5484d}
.tsl-form-msg{margin-top:10px;margin-bottom:-8px;font-size:12.5px;min-height:19px;color:var(--tsl-muted)}
.tsl-form-msg[data-tone="error"]{color:#e5484d}
.tsl-form-msg[data-tone="ok"]{color:var(--tsl-accent)}

.tsl-foot{padding:72px var(--tsl-gut) 0}
.tsl-foot-top{display:grid;grid-template-columns:1.3fr repeat(4,1fr);gap:32px}
.tsl-foot-top p{margin-top:14px;font-size:13.5px;color:var(--tsl-muted);max-width:260px}
.tsl-foot h4{font-family:var(--tsl-mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:500;color:var(--tsl-muted);margin-bottom:14px}
.tsl-foot li+li{margin-top:9px}
.tsl-foot li a{font-size:13.5px;color:var(--tsl-soft);transition:color .2s}
.tsl-foot li a:hover{color:var(--tsl-ink)}
.tsl-wordmark{position:relative;margin-top:64px;height:clamp(96px,17vw,240px);touch-action:pan-y}
.tsl-wordmark canvas{position:absolute;left:0;top:0}
.tsl-foot-bottom{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:20px 0 28px;border-top:1px solid var(--tsl-line);font-size:12px;color:var(--tsl-muted)}
.tsl-status{display:inline-flex;align-items:center;gap:8px}
.tsl-status i{width:7px;height:7px;border-radius:50%;background:#30a46c;box-shadow:0 0 0 3px color-mix(in srgb,#30a46c 22%,transparent)}

@keyframes tsl-blink{50%{opacity:0}}
@keyframes tsl-spin{0%{opacity:1}50%{opacity:.2}}
@keyframes tsl-marquee{to{transform:translateX(-50%)}}
@keyframes tsl-dash{to{stroke-dashoffset:-16}}
@keyframes tsl-fade{from{opacity:0}}
@keyframes tsl-pop{from{opacity:0;transform:translateY(4px)}}

@media (max-width:1023px){
.tsl-root{--tsl-gut:28px}
.tsl-menu{display:none}
.tsl-burger{display:inline-grid}
.tsl-signin{display:none}
.tsl-feat{grid-template-columns:1fr;gap:28px;margin-top:56px}
.tsl-feat-steps{display:none}
.tsl-feat-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.tsl-feat-tabs button{flex:none;height:32px;padding:0 12px;font-family:var(--tsl-mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--tsl-line2);border-radius:2px;color:var(--tsl-muted)}
.tsl-feat-tabs button[aria-selected="true"]{background:var(--tsl-btn);color:var(--tsl-on-btn);border-color:var(--tsl-btn)}
.tsl-feat-mobile{display:block}
.tsl-feat-mobile .tsl-h3{font-size:24px}
.tsl-feat-mobile p{margin-top:10px;color:var(--tsl-soft)}
.tsl-stage{position:relative;top:auto;height:auto;min-height:440px}
.tsl-stats{grid-template-columns:repeat(2,1fr)}
.tsl-stat:nth-child(3){border-left:0}
.tsl-stat:nth-child(n+3){border-top:1px solid var(--tsl-line)}
.tsl-case{grid-template-columns:1fr}
.tsl-portrait{aspect-ratio:16/10}
.tsl-quotes{grid-template-columns:1fr}
.tsl-quote+.tsl-quote{border-left:0;border-top:1px solid var(--tsl-line)}
.tsl-plans{grid-template-columns:1fr}
.tsl-plan+.tsl-plan{border-left:0;border-top:1px solid var(--tsl-line)}
.tsl-foot-top{grid-template-columns:repeat(2,1fr)}
.tsl-foot-top>div:first-child{grid-column:1/-1}
.tsl-pcards{grid-template-columns:1fr}
.tsl-pcard{min-height:220px}
.tsl-pcard+.tsl-pcard{border-left:0;border-top:1px solid var(--tsl-night-line)}
}
@media (max-width:640px){
.tsl-root{--tsl-gut:20px}
.tsl-sec{padding-top:80px;padding-bottom:80px}
.tsl-night{padding-top:88px;padding-bottom:88px}
.tsl-nav-in{padding:0 16px;gap:12px}
.tsl-nav-right .tsl-btn{display:none}
.tsl-hero{padding-top:48px}
.tsl-hero-actions .tsl-btn{flex:1}
.tsl-hero-panel{margin-top:40px;padding:40px 12px 52px;margin-left:calc(var(--tsl-gut) * -1);margin-right:calc(var(--tsl-gut) * -1)}
.tsl-chips .tsl-chip:nth-child(n+3){display:none}
.tsl-step{grid-template-columns:18px 1fr auto}
.tsl-step code{display:none}
.tsl-logo{padding:0 26px;font-size:17px}
.tsl-stats{grid-template-columns:1fr}
.tsl-stat{padding:32px 4px}
.tsl-stat+.tsl-stat{border-left:0;border-top:1px solid var(--tsl-line)}
.tsl-case-body{padding:28px 22px}
.tsl-case-metrics{grid-template-columns:1fr 1fr 1fr;gap:10px}
.tsl-case-metrics b{font-size:24px}
.tsl-stage{padding:16px 12px;margin-left:calc(var(--tsl-gut) * -1);margin-right:calc(var(--tsl-gut) * -1)}
.tsl-cta-card{padding:28px 20px}
.tsl-form{flex-direction:column}
.tsl-form input{flex:none}
.tsl-hero .tsl-line,.tsl-hero .tsl-line>span{display:inline;overflow:visible;padding:0;margin:0}
.tsl-foot-top{grid-template-columns:1fr 1fr}
.tsl-wf-row{grid-template-columns:80px 1fr}
.tsl-wf-axis{padding-left:94px}
}
@media (prefers-reduced-motion:reduce){
.tsl-root *,.tsl-root *::before,.tsl-root *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
.tsl-logos-track{animation:none}
}
`

// ---------- hooks ----------

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

/** Closes a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void, ref: { current: HTMLElement | null }) {
  React.useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("pointerdown", down)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("pointerdown", down)
      document.removeEventListener("keydown", key)
    }
  }, [open, close, ref])
}

/** Calls back once when the element first comes into view. */
function useInView(ref: { current: Element | null }, margin = "0px 0px -15% 0px") {
  const [seen, setSeen] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (typeof IntersectionObserver !== "function") {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: margin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin, seen])
  return seen
}

// ---------- small pieces ----------

const ICONS: { [k: string]: string } = {
  arrow: "M3 8h10M9 4l4 4-4 4",
  up: "M8 13V3M4 7l4-4 4 4",
  down: "M4 6l4 4 4-4",
  check: "M3 8.5l3 3 7-7",
  x: "M4 4l8 8M12 4l-8 8",
  menu: "M2 5h12M2 11h12",
  sun: "M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.8 3.8l1 1M11.2 11.2l1 1M3.8 12.2l1-1M11.2 4.8l1-1M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
  moon: "M13 9.5A5.5 5.5 0 016.5 3a5.5 5.5 0 106.5 6.5z",
  copy: "M5.5 5.5V3h7.5v7.5h-2.5M3 5.5h7.5V13H3z",
  plus: "M8 3v10M3 8h10",
  minus: "M3 8h10",
  replay: "M3 8a5 5 0 105-5H5M5 1v2.5H7.5",
}

function Icon({ name, size = 14, stroke = 1.5 }: { name: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] || ""} />
    </svg>
  )
}

function Mark({ size = 22 }: { size?: number }) {
  const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  return (
    <svg className="tsl-mark" width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      {cells.map((i) => (
        <rect key={i} x={(i % 3) * 8} y={Math.floor(i / 3) * 8} width="6" height="6" fill={i === 4 ? "var(--tsl-accent)" : "currentColor"} />
      ))}
    </svg>
  )
}

function KickerGlyph() {
  return (
    <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden="true">
      <rect x="4" y="0" width="14" height="3" fill="var(--tsl-accent)" />
      <rect x="0" y="5" width="14" height="3" fill="var(--tsl-accent)" opacity=".55" />
    </svg>
  )
}

const GLYPHS = "{}~:Mb0xj1+&kZ/<>#%"

/** A label that decodes out of mono glyphs the first time it scrolls into view. */
function Kicker({ text, reduced }: { text: string; reduced: boolean }) {
  const ref = React.useRef(null as HTMLSpanElement | null)
  const seen = useInView(ref)
  const [out, setOut] = React.useState(text)
  React.useEffect(() => {
    if (!seen || reduced) {
      setOut(text)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const dur = 650
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      let s = ""
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        s += ch === " " || p > i / text.length + 0.15 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      }
      setOut(s)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setOut(text)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, reduced, text])
  return (
    <span className="tsl-kicker" ref={ref}>
      <KickerGlyph />
      <span className="tsl-sr">{text}</span>
      <span aria-hidden="true">{out}</span>
    </span>
  )
}

function LogoMark({ mark }: { mark?: TslLogoMark }) {
  const d: { [k: string]: React.ReactNode } = {
    bolt: <path d="M11 1L3 11h5l-1 6 8-10h-5z" fill="currentColor" />,
    spark: <path d="M9 0l1.8 7.2L18 9l-7.2 1.8L9 18l-1.8-7.2L0 9l7.2-1.8z" fill="currentColor" />,
    chevron: <path d="M2 4l5 5-5 5M9 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.4" />,
    orbit: (
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="9" r="7" />
        <circle cx="15" cy="4" r="2.2" fill="currentColor" stroke="none" />
      </g>
    ),
    bars: (
      <g fill="currentColor">
        <rect x="1" y="7" width="3" height="10" />
        <rect x="6" y="3" width="3" height="14" />
        <rect x="11" y="9" width="3" height="8" />
        <rect x="16" y="5" width="2" height="12" />
      </g>
    ),
    knot: <path d="M4 9a5 5 0 0110 0 5 5 0 01-10 0zM9 4v10" fill="none" stroke="currentColor" strokeWidth="2.2" />,
    leaf: <path d="M2 16C2 7 8 2 16 2c0 8-5 14-14 14zM2 16l8-8" fill="none" stroke="currentColor" strokeWidth="2" />,
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      {d[mark || "spark"]}
    </svg>
  )
}

// ---------- the mosaic ----------

export type TslMosaicState = { cell: number; shift: number }

/**
 * A canvas of quantized colour. The field is sampled once per cell and drawn
 * in colour buckets, so a frame is a few dozen fills. Near the pointer, cells
 * split into finer pixels and brighten, like a loupe. It runs only on screen
 * and never in a background tab; under reduced motion it draws still frames.
 */
function Mosaic({
  scene,
  ramp,
  state,
  reduced,
  interactive = false,
  label,
}: {
  scene: TslScene
  ramp: string[]
  state: TslMosaicState
  reduced: boolean
  interactive?: boolean
  label?: string
}) {
  const wrapRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  React.useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let w = 0
    let h = 0
    let raf = 0
    let running = false
    let visible = false
    const ptr = { x: -9999, y: -9999, on: false, k: 0 }
    const t0 = performance.now()
    const n = ramp.length
    const buckets: number[][] = []
    for (let i = 0; i < n; i++) buckets.push([])

    const draw = (now: number) => {
      if (!w || !h) return
      const t = reduced ? 4 : (now - t0) / 1000
      const cell = Math.max(6, state.cell)
      const shift = state.shift
      ptr.k += ((ptr.on ? 1 : 0) - ptr.k) * (reduced ? 1 : 0.12)
      const R = 150 * ptr.k
      for (let i = 0; i < n; i++) buckets[i].length = 0
      const cols = Math.ceil(w / cell)
      const rows = Math.ceil(h / cell)
      const ox = (w - cols * cell) / 2
      const oy = (h - rows * cell) / 2
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const x0 = ox + cx * cell
          const y0 = oy + cy * cell
          const mx = x0 + cell / 2
          const my = y0 + cell / 2
          const dx = mx - ptr.x
          const dy = my - ptr.y
          const d = R > 1 ? Math.sqrt(dx * dx + dy * dy) : 1e9
          if (d < R) {
            // the loupe: finer pixels, a little more light
            const k = d < R * 0.45 ? 4 : 2
            const sub = cell / k
            const boost = 0.16 * (1 - d / R) * (1 - d / R)
            for (let sy = 0; sy < k; sy++) {
              for (let sx = 0; sx < k; sx++) {
                const px = x0 + sx * sub
                const py = y0 + sy * sub
                const v = fieldAt(scene, px + sub / 2, py + sub / 2, t, w, h, shift) + boost
                const b = Math.min(n - 1, Math.max(0, Math.round(v * (n - 1))))
                buckets[b].push(px, py, sub)
              }
            }
            continue
          }
          const grain = (hash2(cx, cy, 3) - 0.5) * 0.07
          const v = fieldAt(scene, mx, my, t, w, h, shift) + grain
          const b = Math.min(n - 1, Math.max(0, Math.round(v * (n - 1))))
          buckets[b].push(x0, y0, cell)
        }
      }
      for (let i = 0; i < n; i++) {
        const list = buckets[i]
        if (!list.length) continue
        ctx.fillStyle = ramp[i]
        ctx.beginPath()
        for (let j = 0; j < list.length; j += 3) ctx.rect(list[j], list[j + 1], list[j + 2] + 0.6, list[j + 2] + 0.6)
        ctx.fill()
      }
    }

    const loop = (now: number) => {
      draw(now)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    const sync = () => {
      if (visible && !reduced && !document.hidden) start()
      else stop()
      if (reduced) draw(performance.now())
    }
    const resize = () => {
      const r = wrap.getBoundingClientRect()
      w = Math.max(1, Math.round(r.width))
      h = Math.max(1, Math.round(r.height))
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = w + "px"
      canvas.style.height = h + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(performance.now())
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const io = new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting)
      sync()
    })
    io.observe(wrap)
    const vis = () => (document.hidden ? stop() : sync())
    document.addEventListener("visibilitychange", vis)

    // the panel's content sits above the canvas, so listen on the panel itself
    const host = interactive ? (wrap.parentElement as HTMLElement | null) : null
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      ptr.x = e.clientX - r.left
      ptr.y = e.clientY - r.top
      ptr.on = e.pointerType === "mouse" || e.pointerType === "pen"
      if (reduced) draw(performance.now())
    }
    const leave = () => {
      ptr.on = false
      if (reduced) draw(performance.now())
    }
    if (host) {
      host.addEventListener("pointermove", move)
      host.addEventListener("pointerleave", leave)
    }
    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", vis)
      if (host) {
        host.removeEventListener("pointermove", move)
        host.removeEventListener("pointerleave", leave)
      }
    }
  }, [scene, ramp, state, reduced, interactive])
  return (
    <div className="tsl-mosaic" ref={wrapRef} data-interactive={interactive ? "" : undefined} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <canvas ref={canvasRef} />
    </div>
  )
}

// ---------- nav ----------

function NavDrop({ item, onNavigate }: { item: TslNavItem; onNavigate: () => void }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null as HTMLLIElement | null)
  const close = React.useCallback(() => setOpen(false), [])
  useDismiss(open, close, ref)
  const timer = React.useRef(0)
  const items = item.items || []
  return (
    <li
      ref={ref}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return
        clearTimeout(timer.current)
        setOpen(true)
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return
        timer.current = window.setTimeout(() => setOpen(false), 140)
      }}
    >
      <button type="button" className="tsl-menu-a" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        {item.label}
        <Icon name="down" size={12} />
      </button>
      <div className="tsl-drop" data-open={open ? "" : undefined}>
        <ul>
          {items.map((it, i) => (
            <li key={it.label}>
              <a
                href={it.href || "#"}
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  setOpen(false)
                  onNavigate()
                }}
              >
                <i aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
                    <span key={k} data-on={(k + i * 2) % 3 === 0 ? "" : undefined} />
                  ))}
                </i>
                <b>{it.label}</b>
                {it.description ? <small>{it.description}</small> : null}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

function Nav({
  brand,
  logo,
  nav,
  signIn,
  getStarted,
  dark,
  onTheme,
  themeToggle,
}: {
  brand: string
  logo?: React.ReactNode
  nav: TslNavItem[]
  signIn: TslLink | null
  getStarted: TslLink
  dark: boolean
  onTheme: () => void
  themeToggle: boolean
}) {
  const [scrolled, setScrolled] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [sheet, setSheet] = React.useState(false)
  const sheetRef = React.useRef(null as HTMLDivElement | null)
  React.useEffect(() => {
    const on = () => {
      setScrolled(window.scrollY > 8)
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])
  React.useEffect(() => {
    if (!sheet) return
    const el = sheetRef.current
    const prev = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusables = () => Array.from(el ? el.querySelectorAll("a,button") : []) as HTMLElement[]
    const f = focusables()
    if (f[0]) f[0].focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet(false)
      if (e.key !== "Tab") return
      const list = focusables()
      if (!list.length) return
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("keydown", key)
      document.body.style.overflow = overflow
      if (prev) prev.focus()
    }
  }, [sheet])
  const segs = 24
  return (
    <header className="tsl-nav" data-scrolled={scrolled ? "" : undefined}>
      <div className="tsl-nav-in">
        <a href="#top" className="tsl-brand" aria-label={brand + " home"}>
          {logo || <Mark />}
          <span>{brand}</span>
        </a>
        <nav aria-label="Main">
          <ul className="tsl-menu">
            {nav.map((item) =>
              item.items && item.items.length ? (
                <NavDrop key={item.label} item={item} onNavigate={() => {}} />
              ) : (
                <li key={item.label}>
                  <a className="tsl-menu-a" href={item.href || "#"}>
                    {item.label}
                  </a>
                </li>
              )
            )}
          </ul>
        </nav>
        <div className="tsl-nav-right">
          {themeToggle ? (
            <button type="button" className="tsl-icon-btn" onClick={onTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
              <Icon name={dark ? "sun" : "moon"} size={15} />
            </button>
          ) : null}
          {signIn ? (
            <a className="tsl-signin" href={signIn.href || "#"}>
              {signIn.label}
            </a>
          ) : null}
          <a className="tsl-btn tsl-btn-solid" href={getStarted.href || "#signup"}>
            {getStarted.label}
          </a>
          <button type="button" className="tsl-icon-btn tsl-burger" aria-label="Open menu" aria-expanded={sheet} onClick={() => setSheet(true)}>
            <Icon name="menu" size={16} />
          </button>
        </div>
      </div>
      <div className="tsl-progress" aria-hidden="true">
        {Array.from({ length: segs }, (_, i) => (
          <i key={i} data-on={progress > 0.002 && i / segs < progress ? "" : undefined} />
        ))}
      </div>
      {sheet ? (
        <div className="tsl-sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-label="Menu">
          <div className="tsl-sheet-top">
            <span className="tsl-brand">
              {logo || <Mark />}
              <span>{brand}</span>
            </span>
            <button type="button" className="tsl-icon-btn" aria-label="Close menu" onClick={() => setSheet(false)}>
              <Icon name="x" size={16} />
            </button>
          </div>
          <ul className="tsl-sheet-list">
            {nav.map((item) => (
              <li key={item.label}>
                <a href={item.href || (item.items && item.items[0] ? item.items[0].href || "#" : "#")} onClick={() => setSheet(false)}>
                  {item.label}
                  <Icon name="arrow" size={16} />
                </a>
                {item.items ? (
                  <div className="tsl-sheet-sub">
                    {item.items.map((it) => (
                      <a key={it.label} href={it.href || "#"} onClick={() => setSheet(false)}>
                        {it.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="tsl-sheet-cta">
            {signIn ? (
              <a className="tsl-btn tsl-btn-line" href={signIn.href || "#"} onClick={() => setSheet(false)}>
                {signIn.label}
              </a>
            ) : null}
            <a className="tsl-btn tsl-btn-solid" href={getStarted.href || "#signup"} onClick={() => setSheet(false)}>
              {getStarted.label}
              <Icon name="arrow" />
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}

// ---------- hero prompt ----------

type RunState = { plan: TslRunPlan; prompt: string; model: string }

function PromptCard({
  label,
  placeholder,
  suggestions,
  models,
  reduced,
  onRun,
}: {
  label: string
  placeholder: string
  suggestions: string[]
  models: string[]
  reduced: boolean
  onRun?: (prompt: string, ctx: TslRunContext) => unknown
}) {
  const uid = React.useId().replace(/:/g, "")
  const [text, setText] = React.useState("")
  const [focused, setFocused] = React.useState(false)
  const [model, setModel] = React.useState(0)
  const [menu, setMenu] = React.useState(false)
  const [hover, setHover] = React.useState(0)
  const [phase, setPhase] = React.useState("idle" as "idle" | "running" | "done" | "error")
  const [run, setRun] = React.useState(null as RunState | null)
  const [done, setDone] = React.useState(0)
  const [answer, setAnswer] = React.useState("")
  const [shown, setShown] = React.useState(0)
  const [elapsed, setElapsed] = React.useState(0)
  const [ph, setPh] = React.useState(placeholder)
  const [copied, setCopied] = React.useState(false)
  const token = React.useRef(0)
  const abort = React.useRef(null as AbortController | null)
  const menuRef = React.useRef(null as HTMLDivElement | null)
  const areaRef = React.useRef(null as HTMLTextAreaElement | null)
  const closeMenu = React.useCallback(() => setMenu(false), [])
  useDismiss(menu, closeMenu, menuRef)

  // the placeholder types out example tasks while the box is idle
  React.useEffect(() => {
    if (reduced || focused || text || phase !== "idle" || !suggestions.length) {
      setPh(placeholder)
      return
    }
    let alive = true
    let timer = 0
    const seq = [placeholder, ...suggestions]
    let i = 0
    let n = placeholder.length
    let dir = -1
    let wait = 2200
    const step = () => {
      if (!alive) return
      const s = seq[i]
      if (wait > 0) {
        const w = wait
        wait = 0
        timer = window.setTimeout(step, w)
        return
      }
      n += dir
      setPh(s.slice(0, Math.max(0, n)))
      if (dir < 0 && n <= 0) {
        i = (i + 1) % seq.length
        dir = 1
        n = 0
        timer = window.setTimeout(step, 260)
        return
      }
      if (dir > 0 && n >= seq[i].length) {
        dir = -1
        wait = 2000
      }
      timer = window.setTimeout(step, dir > 0 ? 34 : 16)
    }
    timer = window.setTimeout(step, 4200)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [reduced, focused, text, phase, placeholder, suggestions.join("\n")])

  const reset = () => {
    token.current++
    if (abort.current) abort.current.abort()
    setPhase("idle")
    setRun(null)
    setDone(0)
    setAnswer("")
    setShown(0)
    setElapsed(0)
    setCopied(false)
  }
  React.useEffect(() => () => {
    token.current++
    if (abort.current) abort.current.abort()
  }, [])

  const start = (value?: string) => {
    const prompt = (value ?? text).trim()
    if (!prompt || phase === "running") return
    if (value !== undefined) setText(value)
    const my = ++token.current
    const plan = planFor(prompt)
    const m = models[model] || models[0] || "Agent"
    const ctrl = new AbortController()
    abort.current = ctrl
    setRun({ plan, prompt, model: m })
    setPhase("running")
    setDone(0)
    setAnswer("")
    setShown(0)
    setCopied(false)
    const t0 = performance.now()
    const external = onRun ? Promise.resolve().then(() => onRun(prompt, { model: m, signal: ctrl.signal })) : null
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, reduced ? 0 : ms))
    ;(async () => {
      for (let i = 0; i < plan.steps.length; i++) {
        await sleep(plan.steps[i].ms)
        if (token.current !== my) return
        setDone(i + 1)
        setElapsed(performance.now() - t0)
      }
      let final = plan.answer
      if (external) {
        try {
          final = String(await external)
        } catch (err) {
          if (token.current !== my) return
          setAnswer(err instanceof Error && err.message ? err.message : "The agent could not finish this run.")
          setShown(9999)
          setPhase("error")
          return
        }
      }
      if (token.current !== my) return
      setElapsed(performance.now() - t0)
      setAnswer(final)
      if (reduced) {
        setShown(final.length)
        setPhase("done")
        return
      }
      let k = 0
      const tick = () => {
        if (token.current !== my) return
        k = Math.min(final.length, k + 3)
        setShown(k)
        if (k < final.length) window.setTimeout(tick, 22)
        else setPhase("done")
      }
      tick()
    })()
  }

  const stop = () => {
    token.current++
    if (abort.current) abort.current.abort()
    setPhase(run ? "done" : "idle")
    if (run && !answer) {
      setAnswer("Stopped. Nothing after the last finished step was run.")
      setShown(9999)
    }
  }

  const copy = () => {
    if (!answer) return
    try {
      navigator.clipboard.writeText(answer).then(() => setCopied(true), () => {})
    } catch {}
  }

  const busy = phase === "running"
  const open = !!run
  const pickModel = (i: number) => {
    setModel(i)
    setMenu(false)
  }
  return (
    <div className="tsl-prompt-wrap">
      <div className="tsl-prompt tsl-prompt-card" data-phase={phase}>
        <div className="tsl-prompt-label">
          <span>
            <i aria-hidden="true" />
            {label}
          </span>
          {open ? (
            <span style={{ fontFamily: "var(--tsl-mono)", fontSize: 10.5 }} aria-live="polite">
              {busy ? "Working " + (done + 1) + "/" + (run ? run.plan.steps.length : 0) : phase === "error" ? "Failed" : "Done in " + (elapsed / 1000).toFixed(1) + "s"}
            </span>
          ) : null}
        </div>
        <form
          className="tsl-prompt-box"
          onSubmit={(e) => {
            e.preventDefault()
            if (busy) stop()
            else start()
          }}
        >
          <div className="tsl-prompt-area">
            <label htmlFor={uid + "-ta"} className="tsl-sr">
              {label}
            </label>
            <textarea
              id={uid + "-ta"}
              ref={areaRef}
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (!busy) start()
                }
              }}
              readOnly={busy}
            />
            {!text ? (
              <span className="tsl-ph" aria-hidden="true">
                {ph}
              </span>
            ) : null}
          </div>
          <div className="tsl-prompt-bar">
            <div className="tsl-model" ref={menuRef}>
              <button
                type="button"
                className="tsl-model-btn"
                aria-haspopup="listbox"
                aria-expanded={menu}
                aria-label={"Model: " + (models[model] || "")}
                onClick={() => {
                  setHover(model)
                  setMenu((o) => !o)
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault()
                    if (!menu) {
                      setHover(model)
                      setMenu(true)
                      return
                    }
                    const n = nextIndex(hover, e.key, models.length)
                    if (n > -1) setHover(n)
                  } else if (menu && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    pickModel(hover)
                  }
                }}
              >
                {models[model]}
                <Icon name="down" size={10} />
              </button>
              {menu ? (
                <ul className="tsl-model-list" role="listbox" aria-label="Model">
                  {models.map((m, i) => (
                    <li
                      key={m}
                      role="option"
                      aria-selected={i === model}
                      data-active={i === hover ? "" : undefined}
                      onPointerEnter={() => setHover(i)}
                      onClick={() => pickModel(i)}
                    >
                      <b>{m}</b>
                      <small>{["Balanced", "Fastest", "Deep reasoning", "Custom"][Math.min(3, i)]}</small>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button type="submit" className="tsl-send" disabled={!busy && !text.trim()} aria-label={busy ? "Stop the run" : "Run task"}>
              {busy ? (
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <rect width="10" height="10" fill="currentColor" />
                </svg>
              ) : (
                <Icon name="up" size={14} stroke={1.8} />
              )}
            </button>
          </div>
        </form>
        <div className="tsl-run" data-open={open ? "" : undefined}>
          <div>
            {run ? (
              <div className="tsl-run-in">
                <div className="tsl-run-head">
                  <b>{run.plan.title}</b>
                  <span>{run.model}</span>
                </div>
                <ol className="tsl-steps">
                  {run.plan.steps.map((s, i) => {
                    const state = i < done ? "done" : i === done && busy ? "active" : "todo"
                    return (
                      <li key={s.tool} className="tsl-step" data-state={state}>
                        {state === "done" ? (
                          <span className="tsl-check">
                            <Icon name="check" size={14} stroke={2} />
                          </span>
                        ) : state === "active" ? (
                          <span className="tsl-spin" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                            <span />
                          </span>
                        ) : (
                          <span className="tsl-dot" aria-hidden="true" />
                        )}
                        <code>{s.tool}</code>
                        <em>{s.label}</em>
                        <time>{state === "done" ? (s.ms / 1000).toFixed(1) + "s" : ""}</time>
                      </li>
                    )
                  })}
                </ol>
                {answer || done === run.plan.steps.length ? (
                  <div className="tsl-answer" data-error={phase === "error" ? "" : undefined} aria-live="polite">
                    {answer.slice(0, shown)}
                    {busy ? <span className="tsl-caret" aria-hidden="true" /> : null}
                  </div>
                ) : null}
                <div className="tsl-run-foot">
                  {phase === "done" && answer ? (
                    <button type="button" className="tsl-mini" onClick={copy}>
                      <Icon name={copied ? "check" : "copy"} size={12} />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  ) : null}
                  {!busy ? (
                    <button
                      type="button"
                      className="tsl-mini"
                      onClick={() => {
                        reset()
                        setText("")
                        if (areaRef.current) areaRef.current.focus()
                      }}
                    >
                      <Icon name="plus" size={12} />
                      New task
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {suggestions.length ? (
        <div className="tsl-chips" aria-label="Example tasks">
          {suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              className="tsl-chip"
              disabled={busy}
              onClick={() => {
                reset()
                start(s)
              }}
            >
              {shortLabel(s)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// ---------- problem ----------

function IsoIcon({ icon, uid }: { icon: TslProblemIcon; uid: string }) {
  const top = "url(#" + uid + "-top)"
  const left = "url(#" + uid + "-left)"
  const right = "#070b24"
  const edge = "rgba(255,255,255,.14)"
  const Box = ({ b, cls, glow }: { b: { top: string; left: string; right: string }; cls?: string; glow?: boolean }) => (
    <g className={cls}>
      <polygon points={b.left} fill={glow ? "var(--tsl-c1)" : left} stroke={edge} strokeWidth=".6" />
      <polygon points={b.right} fill={glow ? "var(--tsl-c0)" : right} stroke={edge} strokeWidth=".6" />
      <polygon points={b.top} fill={glow ? "var(--tsl-c2)" : top} stroke={edge} strokeWidth=".6" />
    </g>
  )
  let body: React.ReactNode = null
  if (icon === "layers") {
    body = (
      <>
        <Box b={isoBox(-26, -26, 0, 52, 52, 8)} />
        <Box b={isoBox(-26, -26, 18, 52, 52, 8)} cls="lift1" />
        <Box b={isoBox(-26, -26, 36, 52, 52, 8)} cls="lift2" />
        <Box b={isoBox(-10, -10, 54, 20, 20, 10)} cls="lift3" glow />
      </>
    )
  } else if (icon === "steps") {
    const hs = [10, 20, 30, 42]
    body = (
      <>
        <Box b={isoBox(-38, -20, 0, 76, 40, 4)} />
        {hs.map((h, i) => (
          <Box key={i} b={isoBox(-36 + i * 18, -18, 4, 18, 36, h)} cls="rise" glow={i === 3} />
        ))}
      </>
    )
  } else {
    body = (
      <>
        <Box b={isoBox(-30, -30, 0, 60, 60, 5)} />
        <Box b={isoBox(-12, -12, 5, 24, 24, 24)} glow />
        <Box b={isoBox(-22, -22, 5, 44, 44, 40)} cls="liftlid" />
      </>
    )
  }
  return (
    <svg className="tsl-pcard-icon" viewBox="-62 -92 124 124" aria-hidden="true">
      <defs>
        <linearGradient id={uid + "-top"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--tsl-c2)" />
          <stop offset="1" stopColor="var(--tsl-c1)" />
        </linearGradient>
        <linearGradient id={uid + "-left"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--tsl-c0)" />
          <stop offset="1" stopColor="#0b1440" />
        </linearGradient>
      </defs>
      {body}
    </svg>
  )
}

function Problem({ data, reduced }: { data: { kicker: string; title: string; items: { title: string; text: string; icon?: string }[] }; reduced: boolean }) {
  const uid = React.useId().replace(/:/g, "")
  const [open, setOpen] = React.useState(-1)
  const words = toneWords(data.title)
  const icons = ["layers", "steps", "eye"]
  return (
    <section className="tsl-sec tsl-night" data-sec="problem" aria-labelledby={uid + "-h"}>
      <span className="tsl-cross" data-side="l" />
      <span className="tsl-cross" data-side="r" />
      <div className="tsl-center">
        <Kicker text={data.kicker} reduced={reduced} />
        <h2 className="tsl-h2 tsl-scrub" id={uid + "-h"}>
          {words.map((w, i) => (
            <React.Fragment key={i}>
              <span className="tsl-w" data-muted={w.muted ? "" : undefined}>
                {w.word}
              </span>{" "}
            </React.Fragment>
          ))}
        </h2>
      </div>
      <div className="tsl-pcards">
        {data.items.map((it, i) => (
          <article key={it.title} className="tsl-pcard" data-open={open === i ? "" : undefined}>
            <span className="tsl-pcard-px" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
                <span key={k} style={{ transitionDelay: k * 30 + "ms" }} />
              ))}
            </span>
            <IsoIcon icon={(it.icon || icons[i % 3]) as TslProblemIcon} uid={uid + "-" + i} />
            <div>
              <h3>
                <button type="button" aria-expanded={open === i} aria-controls={uid + "-p" + i} onClick={() => setOpen((o) => (o === i ? -1 : i))}>
                  {it.title}
                </button>
              </h3>
              <div className="tsl-pcard-body" id={uid + "-p" + i}>
                <div>
                  <p>{it.text}</p>
                </div>
              </div>
            </div>
            <span className="tsl-pcard-num" aria-hidden="true">
              0{i + 1}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}

// ---------- solution ----------

function BuilderCard({ active, reduced }: { active: boolean; reduced: boolean }) {
  const full = "Resolve billing questions with the help center. Refunds over $500 need a human approval. Always cite the article you used."
  const [typed, setTyped] = React.useState(full.length)
  const [tools, setTools] = React.useState([true, true, true, false])
  const [test, setTest] = React.useState("idle" as "idle" | "running" | "passed")
  React.useEffect(() => {
    if (!active || reduced) {
      setTyped(full.length)
      return
    }
    setTyped(0)
    let k = 0
    const id = window.setInterval(() => {
      k += 2
      setTyped(Math.min(full.length, k))
      if (k >= full.length) clearInterval(id)
    }, 24)
    return () => clearInterval(id)
  }, [active, reduced])
  React.useEffect(() => {
    if (test !== "running") return
    const id = window.setTimeout(() => setTest("passed"), reduced ? 0 : 1300)
    return () => clearTimeout(id)
  }, [test, reduced])
  const names = [
    ["Help center", "read"],
    ["Billing API", "read"],
    ["Refunds", "approval"],
    ["Slack", "notify"],
  ]
  const on = tools.filter(Boolean).length
  return (
    <div>
      <div className="tsl-card-head">
        <b>Support agent</b>
        <span className="tsl-pill">
          <i />
          Draft v3
        </span>
      </div>
      <div className="tsl-field">
        <span>Instructions</span>
        <div className="tsl-field-box">
          {full.slice(0, typed)}
          {typed < full.length ? <span className="tsl-caret" aria-hidden="true" /> : null}
        </div>
      </div>
      <div className="tsl-field">
        <span>Tools ({on} attached)</span>
        <div className="tsl-toggles">
          {names.map(([n, scope], i) => (
            <button
              key={n}
              type="button"
              role="switch"
              aria-checked={tools[i]}
              className="tsl-toggle"
              onClick={() => setTools((t) => t.map((v, j) => (j === i ? !v : v)))}
            >
              <span>
                {n}
                <small>{scope}</small>
              </span>
              <span className="tsl-switch" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <div className="tsl-card-foot">
        <span aria-live="polite">{test === "passed" ? "Passed " + (14 + on) + "/" + (14 + on) + " evals" : test === "running" ? "Running evals..." : "Agent 5.6 · temperature 0.2"}</span>
        <button type="button" className="tsl-mini" onClick={() => setTest("running")} disabled={test === "running"}>
          <Icon name={test === "passed" ? "check" : "replay"} size={12} />
          Test run
        </button>
      </div>
    </div>
  )
}

const TOOL_NODES = ["CRM", "Help desk", "Ledger", "Warehouse", "Slack", "Email"]

function ToolsCard() {
  const [on, setOn] = React.useState([true, true, false, true, true, false])
  const cx = 160
  const cy = 104
  const pts = TOOL_NODES.map((_, i) => {
    const a = -Math.PI / 2 + (i / TOOL_NODES.length) * Math.PI * 2
    return [cx + Math.cos(a) * 118, cy + Math.sin(a) * 78]
  })
  const count = on.filter(Boolean).length
  return (
    <div>
      <div className="tsl-card-head">
        <b>Connections</b>
        <span className="tsl-pill">
          <i />
          {count} of {TOOL_NODES.length} live
        </span>
      </div>
      <svg className="tsl-graph" viewBox="0 0 320 208" role="group" aria-label="Tool connections. Select a tool to connect or disconnect it.">
        {pts.map(([x, y], i) => (
          <path key={"e" + i} className="edge" data-on={on[i] ? "" : undefined} d={"M" + cx + " " + cy + " Q " + (cx + x) / 2 + " " + cy + " " + x + " " + y} />
        ))}
        <g className="node core">
          <rect x={cx - 34} y={cy - 15} width="68" height="30" rx="4" />
          <text x={cx} y={cy + 4} textAnchor="middle">
            Agent
          </text>
        </g>
        {pts.map(([x, y], i) => (
          <g
            key={"n" + i}
            className="node"
            data-on={on[i] ? "" : undefined}
            tabIndex={0}
            role="switch"
            aria-checked={on[i]}
            aria-label={TOOL_NODES[i]}
            onClick={() => setOn((o) => o.map((v, j) => (j === i ? !v : v)))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setOn((o) => o.map((v, j) => (j === i ? !v : v)))
              }
            }}
          >
            <rect x={x - 36} y={y - 12} width="72" height="24" rx="3" />
            <text x={x} y={y + 3.5} textAnchor="middle">
              {TOOL_NODES[i]}
            </text>
          </g>
        ))}
      </svg>
      <div className="tsl-card-foot">
        <span>Scoped per agent and environment</span>
        <span>Click a tool</span>
      </div>
    </div>
  )
}

const SPANS = [
  { name: "plan", from: 0, to: 0.12, kind: "llm", ms: 410, tok: 812 },
  { name: "kb.search", from: 0.1, to: 0.36, kind: "tool", ms: 880, tok: 0 },
  { name: "billing.lookup", from: 0.34, to: 0.55, kind: "tool", ms: 720, tok: 0 },
  { name: "llm.reason", from: 0.53, to: 0.86, kind: "llm", ms: 1130, tok: 2240 },
  { name: "reply.draft", from: 0.84, to: 1, kind: "out", ms: 540, tok: 610 },
]

function TraceCard({ active }: { active: boolean }) {
  const [play, setPlay] = React.useState(false)
  const [focus, setFocus] = React.useState(-1)
  React.useEffect(() => {
    if (!active) {
      setPlay(false)
      return
    }
    const id = window.setTimeout(() => setPlay(true), 60)
    return () => clearTimeout(id)
  }, [active])
  const s = focus > -1 ? SPANS[focus] : null
  return (
    <div>
      <div className="tsl-card-head">
        <b>run_8f2c</b>
        <span className="tsl-pill">
          <i />
          3.4s · $0.012
        </span>
      </div>
      <div className="tsl-wf" data-play={play ? "" : undefined}>
        {SPANS.map((sp, i) => (
          <div
            key={sp.name}
            className="tsl-wf-row"
            tabIndex={0}
            onPointerEnter={() => setFocus(i)}
            onPointerLeave={() => setFocus(-1)}
            onFocus={() => setFocus(i)}
            onBlur={() => setFocus(-1)}
          >
            <span>{sp.name}</span>
            <span className="tsl-wf-track">
              <span
                className="tsl-wf-bar"
                data-kind={sp.kind}
                style={{ left: sp.from * 100 + "%", width: (sp.to - sp.from) * 100 + "%", transitionDelay: i * 0.12 + "s" }}
              />
            </span>
          </div>
        ))}
      </div>
      <div className="tsl-wf-axis" aria-hidden="true">
        <span>0s</span>
        <span>1.7s</span>
        <span>3.4s</span>
      </div>
      <div className="tsl-card-foot">
        <span aria-live="polite">{s ? s.name + " · " + s.ms + " ms" + (s.tok ? " · " + s.tok.toLocaleString("en-US") + " tokens" : "") : "Hover a span for details"}</span>
        <button
          type="button"
          className="tsl-mini"
          onClick={() => {
            setPlay(false)
            window.setTimeout(() => setPlay(true), 80)
          }}
        >
          <Icon name="replay" size={12} />
          Replay
        </button>
      </div>
    </div>
  )
}

function DeployCard({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [env, setEnv] = React.useState(1)
  const [traffic, setTraffic] = React.useState(25)
  const [runs, setRuns] = React.useState(18412)
  const [guard, setGuard] = React.useState(true)
  React.useEffect(() => {
    if (!active || reduced) return
    const id = window.setInterval(() => setRuns((r) => r + 1 + Math.floor(Math.random() * 4)), 900)
    return () => clearInterval(id)
  }, [active, reduced])
  const rate = env === 1 ? 98.7 : 99.2
  const arc = 2 * Math.PI * 15
  return (
    <div>
      <div className="tsl-card-head">
        <b>Deploy</b>
        <div className="tsl-seg" role="radiogroup" aria-label="Environment">
          {["Staging", "Production"].map((e, i) => (
            <button key={e} type="button" role="radio" aria-checked={env === i} onClick={() => setEnv(i)}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="tsl-metrics">
        <div className="tsl-metric" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <small>Success rate</small>
            <b>{rate}%</b>
          </div>
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="15" fill="none" stroke="var(--tsl-line2)" strokeWidth="4" />
            <circle cx="20" cy="20" r="15" fill="none" stroke="var(--tsl-accent)" strokeWidth="4" strokeDasharray={arc * (rate / 100) + " " + arc} transform="rotate(-90 20 20)" />
          </svg>
        </div>
        <div className="tsl-metric">
          <small>Runs today</small>
          <b>{runs.toLocaleString("en-US")}</b>
        </div>
        <div className="tsl-metric">
          <small>p95 latency</small>
          <b>{env === 1 ? "1.8s" : "2.1s"}</b>
        </div>
        <div className="tsl-metric">
          <small>Cost / run</small>
          <b>$0.011</b>
        </div>
      </div>
      <div className="tsl-range-row">
        <label htmlFor="tsl-traffic">Rollout traffic</label>
        <b>{traffic}%</b>
      </div>
      <input id="tsl-traffic" className="tsl-range" type="range" min={0} max={100} step={5} value={traffic} onChange={(e) => setTraffic(+e.target.value)} />
      <button type="button" role="switch" aria-checked={guard} className="tsl-toggle" onClick={() => setGuard((g) => !g)}>
        <span>
          Auto-rollback
          <small>below 95% success</small>
        </span>
        <span className="tsl-switch" aria-hidden="true" />
      </button>
    </div>
  )
}

function StageCard({ visual, active, reduced }: { visual: TslFeatureVisual; active: boolean; reduced: boolean }) {
  if (visual === "builder") return <BuilderCard active={active} reduced={reduced} />
  if (visual === "tools") return <ToolsCard />
  if (visual === "trace") return <TraceCard active={active} />
  return <DeployCard active={active} reduced={reduced} />
}

function Solution({
  data,
  ramp,
  reduced,
}: {
  data: { kicker: string; title: string; features: TslFeature[] }
  ramp: string[]
  reduced: boolean
}) {
  const uid = React.useId().replace(/:/g, "")
  const [active, setActive] = React.useState(0)
  const stageState = React.useRef({ cell: 15, shift: 0 })
  const rootRef = React.useRef(null as HTMLElement | null)
  const cardRef = React.useRef(null as HTMLDivElement | null)
  const innerRef = React.useRef(null as HTMLDivElement | null)
  const lastH = React.useRef(0)
  const words = toneWords(data.title)
  const feats = data.features
  const f = feats[active] || feats[0]

  // each step owns the stage while it crosses the middle of the screen
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add("(min-width: 1024px)", () => {
        const items = gsap.utils.toArray(".tsl-step-item") as HTMLElement[]
        items.forEach((el, i) => {
          ScrollTrigger.create({
            trigger: el,
            start: "top 55%",
            end: "bottom 55%",
            onToggle: (self) => {
              if (self.isActive) setActive(i)
            },
          })
        })
      })
    }, root)
    return () => ctx.revert()
  }, [feats.length])

  // the card morphs to the new content's height, the mosaic drifts to a new pattern
  useIsoLayoutEffect(() => {
    const card = cardRef.current
    const inner = innerRef.current
    if (!card || !inner) return
    const to = inner.offsetHeight
    if (reduced || !lastH.current) {
      lastH.current = to
      stageState.current.shift = active * 1.6
      return
    }
    const from = lastH.current
    lastH.current = to
    const ctx = gsap.context(() => {
      gsap.fromTo(card, { height: from }, { height: to, duration: 0.7, ease: "expo.out", clearProps: "height" })
      gsap.fromTo(inner, { opacity: 0, y: 14, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out", clearProps: "filter" })
      gsap.to(stageState.current, { shift: active * 1.6, duration: 1.4, ease: "power2.inOut" })
      gsap.fromTo(stageState.current, { cell: 34 }, { cell: 15, duration: 0.9, ease: "steps(6)" })
    })
    return () => ctx.revert()
  }, [active, reduced])

  return (
    <section className="tsl-sec" data-sec="product" ref={rootRef} aria-labelledby={uid + "-h"}>
      <span className="tsl-cross" data-side="l" />
      <span className="tsl-cross" data-side="r" />
      <div className="tsl-center">
        <Kicker text={data.kicker} reduced={reduced} />
        <h2 className="tsl-h2 tsl-scrub" id={uid + "-h"}>
          {words.map((w, i) => (
            <React.Fragment key={i}>
              <span className="tsl-w" data-muted={w.muted ? "" : undefined}>
                {w.word}
              </span>{" "}
            </React.Fragment>
          ))}
        </h2>
      </div>
      <div className="tsl-feat">
        <div className="tsl-feat-steps">
          <span className="tsl-feat-rail" aria-hidden="true">
            <i style={{ height: 100 / feats.length + "%", transform: "translateY(" + active * 100 + "%)" }} />
          </span>
          {feats.map((ft, i) => (
            <article key={ft.kicker} className="tsl-step-item" data-active={i === active ? "" : undefined}>
              <span className="tsl-kicker">
                <KickerGlyph />
                {ft.kicker}
              </span>
              <h3 className="tsl-h3">{ft.title}</h3>
              <p>{ft.text}</p>
              {ft.points ? (
                <ul className="tsl-points">
                  {ft.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
        <div className="tsl-feat-tabs" role="tablist" aria-label="Product areas">
          {feats.map((ft, i) => (
            <button
              key={ft.kicker}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                const n = nextIndex(i, e.key, feats.length)
                if (n > -1) {
                  e.preventDefault()
                  setActive(n)
                  const sib = (e.currentTarget.parentElement as HTMLElement).children[n] as HTMLElement
                  if (sib) sib.focus()
                }
              }}
            >
              {ft.kicker}
            </button>
          ))}
        </div>
        <div className="tsl-feat-mobile">
          <h3 className="tsl-h3">{f.title}</h3>
          <p>{f.text}</p>
        </div>
        <div className="tsl-stage">
          <Mosaic scene="silk" ramp={ramp} state={stageState.current} reduced={reduced} interactive />
          <span className="tsl-stage-tag" aria-hidden="true">
            0{active + 1} / {f.kicker}
          </span>
          <div className="tsl-stage-card" ref={cardRef}>
            <div ref={innerRef} key={active}>
              <StageCard visual={f.visual} active reduced={reduced} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------- stats ----------

function Stats({ stats, reduced }: { stats: TslStat[]; reduced: boolean }) {
  const ref = React.useRef(null as HTMLElement | null)
  const seen = useInView(ref)
  const nums = React.useRef([] as (HTMLElement | null)[])
  const [lit, setLit] = React.useState(false)
  React.useEffect(() => {
    if (!seen) return
    setLit(true)
    if (reduced) return
    const tweens = stats.map((s, i) => {
      const el = nums.current[i]
      const o = { v: 0 }
      return gsap.to(o, {
        v: s.value,
        duration: 1.8,
        delay: i * 0.12,
        ease: "expo.out",
        onUpdate: () => {
          if (el) el.textContent = (s.prefix || "") + formatStat(o.v, s.decimals || 0) + (s.suffix || "")
        },
      })
    })
    return () => tweens.forEach((t) => t.kill())
  }, [seen, reduced, stats])
  return (
    <section className="tsl-sec tsl-stats" data-sec="stats" ref={ref} aria-label="By the numbers">
      <span className="tsl-cross" data-side="l" />
      <span className="tsl-cross" data-side="r" />
      {stats.map((s, i) => (
        <div className="tsl-stat" key={s.label}>
          <b
            ref={(el) => {
              nums.current[i] = el
            }}
          >
            {(s.prefix || "") + formatStat(s.value, s.decimals || 0) + (s.suffix || "")}
          </b>
          <span className="tsl-stat-px" aria-hidden="true">
            {Array.from({ length: 12 }, (_, k) => (
              <span key={k} data-on={lit && k < 4 + ((i * 3 + 5) % 8) ? "" : undefined} style={{ transitionDelay: k * 50 + i * 80 + "ms" }} />
            ))}
          </span>
          <p>{s.label}</p>
        </div>
      ))}
    </section>
  )
}

// ---------- case study ----------

/** A photo that resolves out of big pixels when it scrolls in, and again on hover. */
function PixelPortrait({ src, alt, reduced, tag }: { src: string; alt: string; reduced: boolean; tag?: string }) {
  const wrapRef = React.useRef(null as HTMLDivElement | null)
  const imgRef = React.useRef(null as HTMLImageElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const seen = useInView(wrapRef)
  const [pixel, setPixel] = React.useState(reduced ? 1 : 48)
  const runRef = React.useRef(0)

  const resolve = React.useCallback(
    (from: number) => {
      if (reduced) {
        setPixel(1)
        return
      }
      const my = ++runRef.current
      const seq = pixelSteps(from)
      let i = 0
      const tick = () => {
        if (runRef.current !== my) return
        setPixel(seq[i])
        i++
        if (i < seq.length) window.setTimeout(tick, 85)
      }
      tick()
    },
    [reduced]
  )
  React.useEffect(() => {
    if (seen) resolve(48)
  }, [seen, resolve])
  React.useEffect(() => {
    if (reduced) setPixel(1)
  }, [reduced])

  React.useEffect(() => {
    const wrap = wrapRef.current
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!wrap || !img || !canvas || pixel <= 1) return
    const draw = () => {
      const w = Math.round(wrap.clientWidth)
      const h = Math.round(wrap.clientHeight)
      if (!w || !h || !img.naturalWidth) return
      canvas.width = w
      canvas.height = h
      canvas.style.width = w + "px"
      canvas.style.height = h + "px"
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const sw = Math.max(1, Math.ceil(w / pixel))
      const sh = Math.max(1, Math.ceil(h / pixel))
      const off = document.createElement("canvas")
      off.width = sw
      off.height = sh
      const o = off.getContext("2d")
      if (!o) return
      // cover-fit the photo into the small grid
      const ir = img.naturalWidth / img.naturalHeight
      const r = w / h
      let cw = img.naturalWidth
      let ch = img.naturalHeight
      if (ir > r) cw = ch * r
      else ch = cw / r
      const cx = (img.naturalWidth - cw) / 2
      const cy = (img.naturalHeight - ch) * 0.3
      o.drawImage(img, cx, cy, cw, ch, 0, 0, sw, sh)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(off, 0, 0, sw, sh, 0, 0, sw * pixel, sh * pixel)
    }
    if (img.complete) draw()
    else img.addEventListener("load", draw, { once: true })
    return () => img.removeEventListener("load", draw)
  }, [pixel])

  return (
    <div className="tsl-portrait" ref={wrapRef} onPointerEnter={(e) => e.pointerType === "mouse" && pixel <= 1 && resolve(18)}>
      <img ref={imgRef} src={src} alt={alt} width={320} height={384} />
      <canvas ref={canvasRef} aria-hidden="true" style={{ display: pixel > 1 ? "block" : "none" }} />
      {tag ? <span className="tsl-portrait-tag">{tag}</span> : null}
    </div>
  )
}

function Customers({ data, quotes, reduced }: { data: TslCase | null; quotes: TslTestimonial[] | null; reduced: boolean }) {
  const uid = React.useId().replace(/:/g, "")
  return (
    <section className="tsl-sec" data-sec="customers" aria-labelledby={uid + "-h"}>
      <span className="tsl-cross" data-side="l" />
      <span className="tsl-cross" data-side="r" />
      <Kicker text={(data && data.kicker) || "Customers"} reduced={reduced} />
      <h2 className="tsl-h2" id={uid + "-h"} style={{ marginTop: 18, maxWidth: 640 }}>
        Teams that put agents on the critical path.
      </h2>
      {data ? (
        <div className="tsl-case" data-reveal>
          <PixelPortrait src={data.photo || PHOTO_CASE} alt={data.name} reduced={reduced} tag={data.company} />
          <div className="tsl-case-body">
            <div>
              <div className="tsl-case-co">{data.company}</div>
              <blockquote style={{ marginTop: 18 }}>
                <p>{data.quote}</p>
              </blockquote>
              <div className="tsl-case-who" style={{ marginTop: 22 }}>
                <b>{data.name}</b>
                <span>{data.role}</span>
              </div>
            </div>
            {data.metrics && data.metrics.length ? (
              <dl className="tsl-case-metrics">
                {data.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="tsl-sr">{m.label}</dt>
                    <dd>
                      <b>{m.value}</b>
                      <span>{m.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      ) : null}
      {quotes && quotes.length ? (
        <div className="tsl-quotes" style={data ? undefined : { borderTop: "1px solid var(--tsl-line)", marginTop: 48 }}>
          {quotes.map((q) => (
            <figure className="tsl-quote" key={q.name} data-reveal>
              <blockquote>
                <p>{q.quote}</p>
              </blockquote>
              <footer>
                {q.avatar ? (
                  <img src={q.avatar} alt="" width={36} height={36} />
                ) : (
                  <span className="tsl-av" aria-hidden="true">
                    {q.name
                      .split(/\s+/)
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                )}
                <figcaption>
                  <b>{q.name}</b>
                  <span>{q.role}</span>
                </figcaption>
              </footer>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  )
}

// ---------- pricing ----------

function RollingPrice({ value, cur, reduced }: { value: number; cur: string; reduced: boolean }) {
  const ref = React.useRef(null as HTMLElement | null)
  const last = React.useRef(value)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = last.current
    last.current = value
    if (reduced || from === value) {
      el.textContent = money(value, cur)
      return
    }
    const o = { v: from }
    const tw = gsap.to(o, {
      v: value,
      duration: 0.6,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = money(Math.round(o.v * 100) / 100, cur)
      },
    })
    return () => {
      tw.kill()
    }
  }, [value, cur, reduced])
  return <b ref={ref}>{money(value, cur)}</b>
}

function Pricing({ data, cur, ramp, reduced }: { data: TslPricing; cur: string; ramp: string[]; reduced: boolean }) {
  const uid = React.useId().replace(/:/g, "")
  const [annual, setAnnual] = React.useState(true)
  const [seats, setSeats] = React.useState(5)
  const est = data.estimator || null
  const [runs, setRuns] = React.useState(est ? est.included * 2 : 0)
  const band = React.useRef({ cell: 12, shift: 0.7 })
  const discount = data.annualDiscount ?? 0.2
  const plans = data.plans || []
  return (
    <section className="tsl-sec" data-sec="pricing" aria-labelledby={uid + "-h"}>
      <span className="tsl-cross" data-side="l" />
      <span className="tsl-cross" data-side="r" />
      <div className="tsl-price-top">
        <div>
          <Kicker text={data.kicker || "Pricing"} reduced={reduced} />
          <h2 className="tsl-h2" id={uid + "-h"}>
            {data.title}
          </h2>
        </div>
        <div className="tsl-seg" role="radiogroup" aria-label="Billing period">
          {[
            ["Monthly", false],
            ["Annually · save " + Math.round(discount * 100) + "%", true],
          ].map(([l, v]) => (
            <button key={String(l)} type="button" role="radio" aria-checked={annual === v} onClick={() => setAnnual(v as boolean)}>
              {l as string}
            </button>
          ))}
        </div>
      </div>
      <div className="tsl-plans">
        {plans.map((p) => {
          const price = p.price == null ? null : annual && p.price > 0 ? Math.round(p.price * (1 - discount) * 100) / 100 : p.price
          const e = p.featured && est && p.price ? teamEstimate(seats, runs, annual, p.price, est, discount) : null
          return (
            <div className="tsl-plan" key={p.name} data-featured={p.featured ? "" : undefined} data-reveal>
              {p.featured ? (
                <div className="tsl-plan-band">
                  <Mosaic scene="columns" ramp={ramp} state={band.current} reduced={reduced} interactive />
                  <span>Most popular</span>
                </div>
              ) : null}
              <h3>{p.name}</h3>
              <div className="tsl-plan-price">
                {price == null ? <b>Custom</b> : <RollingPrice value={price} cur={cur} reduced={reduced} />}
                {price != null ? <span>{p.unit || (price ? "/ month" : "forever")}</span> : null}
              </div>
              <p>{p.blurb}</p>
              {e && est ? (
                <div className="tsl-est">
                  <div className="tsl-est-row">
                    <span>Seats</span>
                    <span className="tsl-stepper">
                      <button type="button" aria-label="Fewer seats" onClick={() => setSeats((s) => Math.max(1, s - 1))}>
                        <Icon name="minus" size={11} />
                      </button>
                      <output aria-live="polite">{seats}</output>
                      <button type="button" aria-label="More seats" onClick={() => setSeats((s) => Math.min(500, s + 1))}>
                        <Icon name="plus" size={11} />
                      </button>
                    </span>
                  </div>
                  <div className="tsl-range-row">
                    <label htmlFor={uid + "-runs"}>Runs a month</label>
                    <b>{compactCount(runs)}</b>
                  </div>
                  <input
                    id={uid + "-runs"}
                    className="tsl-range"
                    type="range"
                    min={1000}
                    max={est.max || 100000}
                    step={1000}
                    value={runs}
                    onChange={(ev) => setRuns(+ev.target.value)}
                  />
                  <div className="tsl-est-total">
                    <span>
                      Estimated{e.overage ? " incl. " + money(e.overage, cur) + " usage" : ""}
                    </span>
                    <RollingPrice value={e.total} cur={cur} reduced={reduced} />
                  </div>
                </div>
              ) : null}
              <ul>
                {p.features.map((ft) => (
                  <li key={ft}>
                    <Icon name="check" size={13} stroke={2} />
                    {ft}
                  </li>
                ))}
              </ul>
              <a className={"tsl-btn tsl-btn-block " + (p.featured ? "tsl-btn-solid" : "tsl-btn-line")} href={p.cta.href || "#"}>
                {p.cta.label}
                <Icon name="arrow" />
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ---------- call to action ----------

function Cta({
  data,
  ramp,
  reduced,
  onSignUp,
}: {
  data: { title: string; text: string; action: string; placeholder: string; done: string }
  ramp: string[]
  reduced: boolean
  onSignUp?: (email: string) => unknown
}) {
  const uid = React.useId().replace(/:/g, "")
  const state = React.useRef({ cell: 18, shift: 0 })
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState("idle" as "idle" | "sending" | "done" | "error")
  const [msg, setMsg] = React.useState("")
  const submit = async () => {
    if (!isEmail(email)) {
      setStatus("error")
      setMsg("Enter a work email like you@company.com.")
      return
    }
    setStatus("sending")
    setMsg("Creating your workspace...")
    let ok = true
    try {
      if (onSignUp) {
        const res = await onSignUp(email.trim())
        if (res === false) ok = false
      } else await new Promise((r) => setTimeout(r, 900))
    } catch {
      ok = false
    }
    if (ok) {
      setStatus("done")
      setMsg(data.done)
    } else {
      setStatus("error")
      setMsg("That did not go through. Try again in a moment.")
    }
  }
  return (
    <section className="tsl-sec tsl-cta" data-sec="signup" aria-labelledby={uid + "-h"}>
      <span className="tsl-cross" data-side="l" />
      <span className="tsl-cross" data-side="r" />
      <div className="tsl-cta-panel">
        <Mosaic scene="bloom" ramp={ramp} state={state.current} reduced={reduced} interactive />
        <div className="tsl-cta-card">
          <h2 className="tsl-h2" id={uid + "-h"}>
            {data.title}
          </h2>
          <p>{data.text}</p>
          <form
            className="tsl-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              if (status !== "sending" && status !== "done") submit()
            }}
          >
            <label htmlFor={uid + "-email"} className="tsl-sr">
              {data.placeholder}
            </label>
            <input
              id={uid + "-email"}
              type="email"
              autoComplete="email"
              placeholder={data.placeholder}
              value={email}
              aria-invalid={status === "error" ? true : undefined}
              aria-describedby={uid + "-msg"}
              disabled={status === "done"}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === "error") {
                  setStatus("idle")
                  setMsg("")
                }
              }}
            />
            <button type="submit" className="tsl-btn tsl-btn-solid" disabled={status === "sending" || status === "done"}>
              {status === "done" ? "You're in" : status === "sending" ? "Sending" : data.action}
              <Icon name={status === "done" ? "check" : "arrow"} />
            </button>
          </form>
          <div className="tsl-form-msg" id={uid + "-msg"} role="status" data-tone={status === "error" ? "error" : status === "done" ? "ok" : undefined}>
            {msg}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------- footer ----------

/** The brand set in pixels. They fly in when the footer arrives and scatter from the pointer. */
function PixelWordmark({ text, ramp, reduced }: { text: string; ramp: string[]; reduced: boolean }) {
  const wrapRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  React.useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    type P = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; c: number }
    let ps: P[] = []
    let w = 0
    let h = 0
    let cell = 6
    let raf = 0
    let running = false
    let visible = false
    let arrived = reduced
    const ptr = { x: -9999, y: -9999, on: false }
    const n = ramp.length

    const build = () => {
      const r = wrap.getBoundingClientRect()
      w = Math.max(1, Math.round(r.width))
      h = Math.max(1, Math.round(r.height))
      canvas.style.width = w + "px"
      cell = Math.max(4, Math.round(w / 190))
      const family = "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, serif"
      const probe = document.createElement("canvas").getContext("2d")
      if (!probe) return
      probe.font = "400 100px " + family
      const m = probe.measureText(text)
      const left = m.actualBoundingBoxLeft || 0
      const span = (m.actualBoundingBoxRight || m.width) + left
      const size = (100 * w) / Math.max(1, span)
      const asc = (m.actualBoundingBoxAscent || 72) * (size / 100)
      const desc = (m.actualBoundingBoxDescent || 0) * (size / 100)
      const fit = Math.ceil(asc + desc + cell)
      if (Math.abs(fit - h) > 2) {
        // the type sets the box: the ResizeObserver rebuilds at the new height
        wrap.style.height = fit + "px"
        h = fit
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.height = h + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const off = document.createElement("canvas")
      off.width = w
      off.height = h
      const o = off.getContext("2d", { willReadFrequently: true })
      if (!o) return
      o.font = "400 " + size + "px " + family
      o.textBaseline = "alphabetic"
      o.fillStyle = "#000"
      o.fillText(text, (left * size) / 100, Math.round(asc + cell / 2))
      const data = o.getImageData(0, 0, w, h).data
      const next: P[] = []
      for (let y = Math.floor(cell / 2); y < h; y += cell) {
        for (let x = Math.floor(cell / 2); x < w; x += cell) {
          if (data[(y * w + x) * 4 + 3] < 120) continue
          const tx = x - cell / 2
          const ty = y - cell / 2
          const v = clamp01(fbm(x / 140, y / 90, 4) * 0.9 + (1 - y / h) * 0.25 - 0.1)
          const old = arrived
          next.push({
            x: old ? tx : tx + (Math.random() - 0.5) * w * 0.4,
            y: old ? ty : ty + h * (0.6 + Math.random() * 0.9),
            vx: 0,
            vy: 0,
            tx,
            ty,
            c: Math.min(n - 1, Math.round(v * (n - 1))),
          })
        }
      }
      ps = next
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (let b = 0; b < n; b++) {
        ctx.fillStyle = ramp[b]
        ctx.beginPath()
        for (const p of ps) if (p.c === b) ctx.rect(p.x, p.y, cell - 1, cell - 1)
        ctx.fill()
      }
    }

    const step = () => {
      let energy = 0
      const R = 90
      for (const p of ps) {
        let ax = (p.tx - p.x) * 0.07
        let ay = (p.ty - p.y) * 0.07
        if (ptr.on) {
          const dx = p.x - ptr.x
          const dy = p.y - ptr.y
          const d2 = dx * dx + dy * dy
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1
            const f = (1 - d / R) * 6
            ax += (dx / d) * f
            ay += (dy / d) * f
          }
        }
        p.vx = (p.vx + ax) * 0.8
        p.vy = (p.vy + ay) * 0.8
        p.x += p.vx
        p.y += p.vy
        energy += Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y)
      }
      return energy / Math.max(1, ps.length)
    }

    const loop = () => {
      const e = step()
      draw()
      if (e < 0.02 && !ptr.on) {
        // settled: snap and sleep until something moves it again
        for (const p of ps) {
          p.x = p.tx
          p.y = p.ty
        }
        draw()
        running = false
        return
      }
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running || reduced || !visible || document.hidden) return
      running = true
      raf = requestAnimationFrame(loop)
    }

    const rebuild = () => {
      build()
      draw()
      start()
    }
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
    rebuild()
    if (fonts) fonts.ready.then(() => rebuild(), () => {})
    const ro = new ResizeObserver(() => {
      arrived = true
      rebuild()
    })
    ro.observe(wrap)
    const io = new IntersectionObserver(
      (es) => {
        visible = es.some((e) => e.isIntersecting)
        if (visible) {
          arrived = true
          start()
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    )
    io.observe(wrap)
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      const r = wrap.getBoundingClientRect()
      ptr.x = e.clientX - r.left
      ptr.y = e.clientY - r.top
      ptr.on = true
      start()
    }
    const leave = () => {
      ptr.on = false
      start()
    }
    wrap.addEventListener("pointermove", move)
    wrap.addEventListener("pointerleave", leave)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      wrap.removeEventListener("pointermove", move)
      wrap.removeEventListener("pointerleave", leave)
    }
  }, [text, ramp, reduced])
  return (
    <div className="tsl-wordmark" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}

function Footer({ brand, logo, data, ramp, reduced }: { brand: string; logo?: React.ReactNode; data: { tagline: string; columns: { title: string; links: TslLink[] }[]; note: string }; ramp: string[]; reduced: boolean }) {
  return (
    <footer className="tsl-sec tsl-foot" data-sec="footer">
      <span className="tsl-cross" data-side="l" />
      <span className="tsl-cross" data-side="r" />
      <div className="tsl-foot-top">
        <div>
          <span className="tsl-brand">
            {logo || <Mark />}
            <span>{brand}</span>
          </span>
          <p>{data.tagline}</p>
        </div>
        {data.columns.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h4>{c.title}</h4>
            <ul>
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href || "#"}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <PixelWordmark text={brand} ramp={ramp} reduced={reduced} />
      <div className="tsl-foot-bottom">
        <span>{data.note}</span>
        <span className="tsl-status">
          <i aria-hidden="true" />
          All systems operational
        </span>
      </div>
    </footer>
  )
}

// ---------- the page ----------

export default function TesselAgentLanding({
  brand = "Tessel",
  logo,
  announcement = { label: "raises $8M seed to build the agent layer", href: "#" },
  nav = DEFAULT_NAV,
  signIn = { label: "Sign in", href: "#" },
  getStarted = { label: "Get started", href: "#signup" },
  hero,
  logos = DEFAULT_LOGOS as TslLogo[],
  problem,
  solution,
  stats = DEFAULT_STATS,
  caseStudy = DEFAULT_CASE,
  testimonials = DEFAULT_TESTIMONIALS,
  pricing,
  cta,
  footer,
  currency = "$",
  palette = "cobalt",
  theme = "system",
  themeToggle = true,
  onRun,
  onSignUp,
  height = "100svh",
  className,
}: TesselAgentLandingProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const heroState = React.useRef({ cell: 18, shift: 0 })
  const reduced = useReducedMotion()
  const [dark, setDark] = useTheme(theme)
  const [bar, setBar] = React.useState(true)
  const uid = React.useId().replace(/:/g, "")

  const palKey = typeof palette === "string" ? palette : JSON.stringify(palette)
  const pal = React.useMemo(() => resolvePalette(palette), [palKey])
  const stops = dark ? darkStops(pal.stops) : pal.stops
  const stopsKey = stops.join()
  const ramp = React.useMemo(() => buildRamp(stops, 28), [stopsKey])

  const h = { ...DEFAULT_HERO, ...(hero || {}) }
  const prompt = { ...DEFAULT_HERO.prompt, ...(h.prompt || {}) }
  const prob = problem === null ? null : { ...DEFAULT_PROBLEM, ...(problem || {}) }
  const sol = solution === null ? null : { ...DEFAULT_SOLUTION, ...(solution || {}) }
  const price = pricing === null ? null : { ...DEFAULT_PRICING, ...(pricing || {}) }
  const call = cta === null ? null : { ...DEFAULT_CTA, ...(cta || {}) }
  const foot = footer === null ? null : { ...DEFAULT_FOOTER, ...(footer || {}) }
  const titleLines = String(h.title || "").split("\n")

  // in-page links scroll to their section
  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a")
    if (!a) return
    const href = a.getAttribute("href") || ""
    if (href === "#") {
      e.preventDefault()
      return
    }
    if (!href.startsWith("#")) return
    const root = rootRef.current
    const el = root && root.querySelector('[data-sec="' + href.slice(1) + '"]')
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
  }

  // page choreography: the hero assembles, sections reveal and scrub as you scroll
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reduced) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
      tl.from(".tsl-badge", { y: 12, opacity: 0, duration: 0.8 }, 0.05)
        .from(".tsl-hero .tsl-line > span", { yPercent: 115, duration: 1.15, stagger: 0.09 }, 0.1)
        .from(".tsl-hero-text", { y: 14, opacity: 0, duration: 0.9 }, 0.45)
        .from(".tsl-hero-actions > *", { y: 12, opacity: 0, duration: 0.8, stagger: 0.07 }, 0.55)
        .fromTo(".tsl-hero-panel", { clipPath: "inset(10% 7% 10% 7%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut", clearProps: "clipPath" }, 0.25)
        .fromTo(heroState.current, { cell: 92 }, { cell: 18, duration: 1.7, ease: "steps(9)" }, 0.25)
        .from(".tsl-prompt-card", { y: 34, opacity: 0, scale: 0.96, duration: 1.1 }, 1.0)
        .from(".tsl-chips > *", { y: 10, opacity: 0, duration: 0.7, stagger: 0.06 }, 1.25)

      // leaving the hero, the mosaic breaks back into blocks and the card lifts away
      gsap.fromTo(
        heroState.current,
        { cell: 18 },
        { cell: 46, ease: "none", immediateRender: false, scrollTrigger: { trigger: ".tsl-hero-panel", start: "center 45%", end: "bottom top", scrub: true } }
      )
      gsap.to(".tsl-prompt-wrap", { yPercent: -14, ease: "none", scrollTrigger: { trigger: ".tsl-hero-panel", start: "top top", end: "bottom top", scrub: true } })

      // headlines fill in word by word as they cross the screen
      gsap.utils.toArray(".tsl-scrub").forEach((el) => {
        const words = (el as HTMLElement).querySelectorAll(".tsl-w")
        gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el as HTMLElement, start: "top 82%", end: "bottom 50%", scrub: true } })
      })

      gsap.from(".tsl-pcard", { y: 48, opacity: 0, duration: 1.1, stagger: 0.12, scrollTrigger: { trigger: ".tsl-pcards", start: "top 82%" } })
      gsap.fromTo(".tsl-stage", { clipPath: "inset(8% 6% 8% 6%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut", clearProps: "clipPath", scrollTrigger: { trigger: ".tsl-feat", start: "top 75%" } })
      gsap.fromTo(".tsl-cta-panel", { clipPath: "inset(12% 8% 12% 8%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".tsl-cta-panel", start: "top 95%", end: "top 35%", scrub: true } })
      gsap.from(".tsl-cta-card", { y: 40, opacity: 0, duration: 1, scrollTrigger: { trigger: ".tsl-cta-panel", start: "top 60%" } })

      const reveals = gsap.utils.toArray("[data-reveal]") as HTMLElement[]
      gsap.set(reveals, { y: 28, opacity: 0 })
      ScrollTrigger.batch(reveals, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true }),
      })
    }, root)

    // sections change height (the run panel opens, fonts land): keep triggers honest
    let t = 0
    const ro = new ResizeObserver(() => {
      clearTimeout(t)
      t = window.setTimeout(() => ScrollTrigger.refresh(), 160)
    })
    ro.observe(root)
    return () => {
      clearTimeout(t)
      ro.disconnect()
      ctx.revert()
    }
  }, [reduced])

  const accent = pal.accent
  const rootStyle = {
    "--tsl-h": height,
    "--tsl-accent": dark ? mixHex(accent, "#ffffff", 0.18) : accent,
    "--tsl-on-accent": onColor(dark ? mixHex(accent, "#ffffff", 0.18) : accent),
    "--tsl-c0": stops[0],
    "--tsl-c1": stops[1],
    "--tsl-c2": stops[2],
    "--tsl-c3": stops[3],
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={"tsl-root" + (className ? " " + className : "")} style={rootStyle} data-theme={dark ? "dark" : "light"} onClick={onClick}>
      <style>{TSL_CSS}</style>
      <a href={"#" + uid + "-main"} className="tsl-skip" onClick={(e) => e.stopPropagation()}>
        Skip to content
      </a>
      {announcement && bar ? (
        <div className="tsl-announce">
          <a href={announcement.href || "#"}>
            <span>
              <b>{brand}</b> {announcement.label}
            </span>
            <Icon name="arrow" size={12} />
          </a>
          <button type="button" className="tsl-announce-x" aria-label="Dismiss announcement" onClick={() => setBar(false)}>
            <Icon name="x" size={11} />
          </button>
        </div>
      ) : null}
      <Nav brand={brand} logo={logo} nav={nav} signIn={signIn} getStarted={getStarted} dark={dark} onTheme={() => setDark(!dark)} themeToggle={themeToggle} />
      <div className="tsl-frame">
        <main id={uid + "-main"}>
          <section className="tsl-sec tsl-hero" data-sec="top" aria-labelledby={uid + "-h1"}>
            {h.badge ? (
              <span className="tsl-badge">
                <i aria-hidden="true">{h.badge.mark}</i>
                {h.badge.label}
              </span>
            ) : null}
            <h1 className="tsl-h1" id={uid + "-h1"}>
              {titleLines.map((line, i) => (
                <React.Fragment key={i}>
                  <span className="tsl-line">
                    <span>{line}</span>
                  </span>{" "}
                </React.Fragment>
              ))}
            </h1>
            {h.text ? <p className="tsl-lead tsl-hero-text">{h.text}</p> : null}
            <div className="tsl-hero-actions">
              {h.secondary ? (
                <a className="tsl-btn tsl-btn-line" href={h.secondary.href || "#"}>
                  {h.secondary.label}
                </a>
              ) : null}
              {h.primary ? (
                <a className="tsl-btn tsl-btn-solid" href={h.primary.href || "#signup"}>
                  <Icon name="arrow" />
                  {h.primary.label}
                </a>
              ) : null}
            </div>
            <div className="tsl-hero-panel">
              <Mosaic scene="columns" ramp={ramp} state={heroState.current} reduced={reduced} interactive label="A shifting mosaic of blue pixels that sharpens under the pointer" />
              <PromptCard
                label={prompt.label || "Automate tasks"}
                placeholder={prompt.placeholder || "How can I help you today?"}
                suggestions={prompt.suggestions || []}
                models={prompt.models && prompt.models.length ? prompt.models : ["Agent"]}
                reduced={reduced}
                onRun={onRun}
              />
              <div className="tsl-hero-ruler" aria-hidden="true">
                <span>{brand.toUpperCase()} / RUNTIME</span>
                <span>LAT 0.8s · TOOLS 120+</span>
              </div>
            </div>
          </section>

          {logos && logos.length ? (
            <section className="tsl-logos" aria-label="Trusted by">
              <div className="tsl-logos-track">
                {[0, 1].map((k) => (
                  <div key={k} style={{ display: "flex" }} aria-hidden={k === 1 ? true : undefined}>
                    {logos.map((l) => (
                      <span className="tsl-logo" key={l.name + k} data-style={l.style || "bold"}>
                        <LogoMark mark={l.mark} />
                        {l.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {prob ? <Problem data={prob as { kicker: string; title: string; items: { title: string; text: string; icon?: string }[] }} reduced={reduced} /> : null}
          {sol ? <Solution data={sol as { kicker: string; title: string; features: TslFeature[] }} ramp={ramp} reduced={reduced} /> : null}
          {stats && stats.length ? <Stats stats={stats} reduced={reduced} /> : null}
          {caseStudy || (testimonials && testimonials.length) ? <Customers data={caseStudy} quotes={testimonials} reduced={reduced} /> : null}
          {price ? <Pricing data={price as TslPricing} cur={currency} ramp={ramp} reduced={reduced} /> : null}
          {call ? <Cta data={call} ramp={ramp} reduced={reduced} onSignUp={onSignUp} /> : null}
        </main>
        {foot ? <Footer brand={brand} logo={logo} data={foot} ramp={ramp} reduced={reduced} /> : null}
      </div>
    </div>
  )
}
