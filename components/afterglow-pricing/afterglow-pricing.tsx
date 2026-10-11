"use client"

import * as React from "react"

/*
 * Afterglow Pricing — a quiet subscription page with one loud card. Dashed
 * paper-white plan cards, a monthly/annual switch with a sliding thumb, and a
 * featured plan lit from inside by a painted afterglow: a dark card washed in
 * amber, coral and rose, with film grain, star specks and a warm bleed under
 * it. The glow drifts, follows the pointer, and moves to whichever plan is
 * subscribed to. A small app bar sits on top.
 *
 * The glow is painted on a canvas at runtime (CSS gradients until it lands),
 * so there are no assets and no requests. React is the only import.
 */

export type AfterglowBilling = "monthly" | "annual"

export type AfterglowPlan = {
  /** Small label above the price, e.g. "Advanced plan". */
  label: string
  /** Monthly price. Annual billing shows it per month, discounted. */
  price: number
  description?: string
  features?: string[]
  /** Pill in the card's corner, e.g. "Most popular". */
  badge?: string
  /** Lit by the afterglow until another plan is subscribed to. */
  featured?: boolean
  /** Button label. Default "Subscribe". */
  cta?: string
}

/** Five light colours over a dark base: highlight, body, left wash, right wash, hot core. */
export type GlowPalette = {
  base: string
  hi: string
  mid: string
  rose: string
  deep: string
  core: string
}

export type AfterglowPricingProps = {
  title?: string
  plans?: AfterglowPlan[]
  /** Prefix for every price. */
  currency?: string
  /** 0.15 = 15% off when billed annually. 0 hides the chip. */
  annualDiscount?: number
  defaultBilling?: AfterglowBilling
  onBillingChange?: (billing: AfterglowBilling) => void
  /** A named palette or your own colours. */
  glow?: "ember" | "aurora" | "lagoon" | "orchid" | GlowPalette
  /** The glow moves to the plan that was subscribed to. Default true. */
  glowFollowsSelection?: boolean
  onSubscribe?: (plan: AfterglowPlan, billing: AfterglowBilling) => void
  /** Button label on the subscribed plan. */
  currentLabel?: string

  /** App bar above the section. */
  showHeader?: boolean
  brand?: string
  tabs?: string[]
  defaultTab?: string
  onTabChange?: (tab: string) => void
  /** Right-hand button in the app bar; empty hides it. */
  action?: string
  onAction?: () => void

  className?: string
  style?: React.CSSProperties
}

/* ------------------------------------------------------------------ logic */

// #region logic
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n)
}

/** Price per month for a billing period, to the cent. */
function planPrice(monthly: number, billing: string, discount: number): number {
  const m = Math.max(0, monthly)
  if (billing !== "annual") return m
  return Math.round(m * (1 - clamp(discount, 0, 0.95)) * 100) / 100
}

/** What a year costs when billed annually. */
function yearlyTotal(monthly: number, discount: number): number {
  return Math.round(planPrice(monthly, "annual", discount) * 1200) / 100
}

/** [whole with thousands separators, ".cc" or ""] — cents only when there are some. */
function splitPrice(n: number): [string, string] {
  const c = Math.round(Math.max(0, n) * 100)
  const whole = Math.floor(c / 100)
  const cents = c % 100
  return [whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), cents ? "." + pad2(cents) : ""]
}

function discountLabel(d: number): string {
  const p = Math.round(clamp(d, 0, 0.95) * 100)
  return p ? "-" + p + "%" : ""
}

/** Which card is lit: the subscribed one (if the glow follows), else the first featured. */
function litIndex(featured: boolean[], selected: number, follows: boolean): number {
  if (follows && selected >= 0 && selected < featured.length) return selected
  return featured.indexOf(true)
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// #endregion logic

/* ------------------------------------------------------------- palettes */

const PALETTES: { [k: string]: GlowPalette } = {
  ember: { base: "#0b0a0b", hi: "#ffb24a", mid: "#ff7f3c", rose: "#ff5c7c", deep: "#f0464c", core: "#fff1d8" },
  aurora: { base: "#050a0b", hi: "#c4ff9e", mid: "#36dcae", rose: "#6c7cff", deep: "#9f5bff", core: "#effff6" },
  lagoon: { base: "#04070e", hi: "#a3e8ff", mid: "#3aa6ff", rose: "#5167ff", deep: "#1fd0c0", core: "#eefaff" },
  orchid: { base: "#0b0610", hi: "#ffb6e8", mid: "#df5cff", rose: "#ff5ea8", deep: "#7b4dff", core: "#fff0fa" },
}

function resolveGlow(g: AfterglowPricingProps["glow"]): GlowPalette {
  if (g && typeof g === "object") return g
  return PALETTES[g ?? "ember"] ?? PALETTES.ember
}

function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "")
  const v = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h.slice(0, 6), 16)
  return "rgba(" + ((v >> 16) & 255) + "," + ((v >> 8) & 255) + "," + (v & 255) + "," + a + ")"
}

/** The same composition in CSS: first paint, SSR, and the no-canvas fallback. */
function cssGlow(p: GlowPalette): string {
  return [
    "radial-gradient(80% 55% at 0% 0%, " + p.base + " 30%, transparent 75%)",
    "radial-gradient(40% 26% at 50% 104%, " + p.core + ", transparent 80%)",
    "radial-gradient(55% 40% at 62% 34%, " + rgba(p.hi, 0.85) + ", transparent 72%)",
    "radial-gradient(65% 50% at 55% 64%, " + rgba(p.mid, 0.9) + ", transparent 72%)",
    "radial-gradient(60% 45% at 4% 94%, " + rgba(p.rose, 0.9) + ", transparent 72%)",
    "radial-gradient(55% 45% at 102% 78%, " + rgba(p.deep, 0.85) + ", transparent 72%)",
    p.base,
  ].join(", ")
}

/* ------------------------------------------------------- painted assets */

// Light poured into a dark card: five soft lamps screened over the base, a
// diagonal sheen, the top-left corner pushed back into shadow so the price
// reads, then a scatter of star specks. Painted once per palette.
function paintGlow(p: GlowPalette, w = 480, h = 600): string {
  if (typeof document === "undefined") return ""
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const g = c.getContext("2d")
  if (!g) return ""
  const r = mulberry32(20260)

  g.fillStyle = p.base
  g.fillRect(0, 0, w, h)
  g.globalCompositeOperation = "screen"
  const lamp = (x: number, y: number, rad: number, col: string, a: number, sy = 1) => {
    g.save()
    g.translate(x * w, y * h)
    g.scale(1, sy)
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rad * w)
    gr.addColorStop(0, rgba(col, a))
    gr.addColorStop(0.45, rgba(col, a * 0.5))
    gr.addColorStop(1, rgba(col, 0))
    g.fillStyle = gr
    g.fillRect(-rad * w, -rad * w, rad * w * 2, rad * w * 2)
    g.restore()
  }
  lamp(0.66, 0.4, 0.42, p.hi, 0.9, 0.85)
  lamp(0.56, 0.66, 0.55, p.mid, 0.95)
  lamp(0.02, 0.97, 0.6, p.rose, 1)
  lamp(1.04, 0.84, 0.5, p.deep, 0.95)
  lamp(0.5, 1.06, 0.5, p.core, 1, 0.62)

  // diagonal sheen, lower left to upper right
  g.save()
  g.translate(w * 0.5, h * 0.66)
  g.rotate(-0.8)
  g.scale(1, 0.28)
  const sheen = g.createRadialGradient(0, 0, 0, 0, 0, w * 0.75)
  sheen.addColorStop(0, rgba(p.core, 0.42))
  sheen.addColorStop(1, rgba(p.core, 0))
  g.fillStyle = sheen
  g.fillRect(-w, -w, w * 2, w * 2)
  g.restore()

  g.globalCompositeOperation = "source-over"
  const shade = g.createRadialGradient(0, 0, 0, 0, 0, w * 1.05)
  shade.addColorStop(0, rgba(p.base, 1))
  shade.addColorStop(0.45, rgba(p.base, 0.82))
  shade.addColorStop(1, rgba(p.base, 0))
  g.fillStyle = shade
  g.fillRect(0, 0, w, h)
  const top = g.createLinearGradient(0, 0, 0, h * 0.38)
  top.addColorStop(0, rgba(p.base, 0.7))
  top.addColorStop(1, rgba(p.base, 0))
  g.fillStyle = top
  g.fillRect(0, 0, w, h * 0.38)

  g.globalCompositeOperation = "screen"
  for (let i = 0; i < 70; i++) {
    const x = r() * w
    const y = Math.pow(r(), 1.2) * h
    const s = 0.35 + Math.pow(r(), 3) * 1.3
    const a = 0.25 + r() * 0.7
    if (s > 1) {
      const halo = g.createRadialGradient(x, y, 0, x, y, s * 5)
      halo.addColorStop(0, "rgba(255,255,255," + (a * 0.5).toFixed(2) + ")")
      halo.addColorStop(1, "rgba(255,255,255,0)")
      g.fillStyle = halo
      g.fillRect(x - s * 5, y - s * 5, s * 10, s * 10)
    }
    g.fillStyle = "rgba(255,255,255," + a.toFixed(2) + ")"
    g.beginPath()
    g.arc(x, y, s, 0, Math.PI * 2)
    g.fill()
  }
  return c.toDataURL("image/jpeg", 0.92)
}

/** A tileable grey noise square, laid over the glow with `overlay`. */
function paintGrain(size = 160): string {
  if (typeof document === "undefined") return ""
  const c = document.createElement("canvas")
  c.width = size
  c.height = size
  const g = c.getContext("2d")
  if (!g) return ""
  const img = g.createImageData(size, size)
  const r = mulberry32(7)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = r() * 255
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
    img.data[i + 3] = 46
  }
  g.putImageData(img, 0, 0)
  return c.toDataURL("image/png")
}

const ART: { [key: string]: string } = {}
function artFor(p: GlowPalette): { glow: string; grain: string } {
  const key = [p.base, p.hi, p.mid, p.rose, p.deep, p.core].join("|")
  if (!(key in ART)) ART[key] = paintGlow(p)
  if (!("grain" in ART)) ART.grain = paintGrain()
  return { glow: ART[key], grain: ART.grain }
}

// Stars that twinkle on top of the painted ones.
const TWINKLES = (() => {
  const r = mulberry32(31)
  return Array.from({ length: 9 }, () => ({
    left: (8 + r() * 84).toFixed(1) + "%",
    top: (6 + r() * 70).toFixed(1) + "%",
    delay: (r() * 4).toFixed(2) + "s",
    dur: (2.8 + r() * 2.4).toFixed(2) + "s",
    scale: (0.6 + r() * 0.9).toFixed(2),
  }))
})()

/* --------------------------------------------------------------- defaults */

const D_PLANS: AfterglowPlan[] = [
  {
    label: "Basic plan",
    price: 10,
    description: "Select one or more styles that fit your taste",
    features: ["40 renders a month", "4 interior styles", "HD downloads", "Email support"],
  },
  {
    label: "Advanced plan",
    price: 20,
    description: "Select one or more styles that fit your taste",
    features: ["150 renders a month", "All 24 styles", "4K downloads", "Priority queue"],
    badge: "Most popular",
    featured: true,
  },
  {
    label: "Studio plan",
    price: 40,
    description: "Present several rooms to clients side by side",
    features: ["500 renders a month", "Custom style presets", "Client share links", "Commercial license"],
  },
  {
    label: "Agency plan",
    price: 60,
    description: "Seats, brand kits and volume for whole teams",
    features: ["Unlimited renders", "5 team seats", "Brand kits", "Dedicated support"],
  },
]

/* ------------------------------------------------------------------ icons */

function Wand() {
  return (
    <svg className="ag-wand" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 20.5 13 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m11.6 12.4 1.6 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
      <path
        className="ag-spark ag-spark-a"
        d="M17 2.5c.35 2.3 1.2 3.15 3.5 3.5-2.3.35-3.15 1.2-3.5 3.5-.35-2.3-1.2-3.15-3.5-3.5 2.3-.35 3.15-1.2 3.5-3.5Z"
        fill="currentColor"
      />
      <path
        className="ag-spark ag-spark-b"
        d="M8 2.6c.2 1.25.65 1.7 1.9 1.9-1.25.2-1.7.65-1.9 1.9-.2-1.25-.65-1.7-1.9-1.9 1.25-.2 1.7-.65 1.9-1.9Z"
        fill="currentColor"
      />
      <path
        className="ag-spark ag-spark-c"
        d="M19.6 13.2c.17 1.05.55 1.43 1.6 1.6-1.05.17-1.43.55-1.6 1.6-.17-1.05-.55-1.43-1.6-1.6 1.05-.17 1.43-.55 1.6-1.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------- css */

const AG_CSS = [
  ".ag-root{--ag-fg:var(--color-foreground,#151515);--ag-muted:var(--color-muted-foreground,#7b7b7b);--ag-bg:var(--color-background,#fff);",
  "--ag-dash:color-mix(in oklab,var(--ag-fg) 15%,transparent);--ag-line:color-mix(in oklab,var(--ag-fg) 11%,transparent);",
  "--ag-soft:color-mix(in oklab,var(--ag-fg) 4.5%,transparent);--ag-soft2:color-mix(in oklab,var(--ag-fg) 8.5%,transparent);",
  "--ag-ease:cubic-bezier(.2,.8,.2,1);--ag-spring:cubic-bezier(.34,1.42,.5,1);",
  "position:relative;width:100%;box-sizing:border-box;background:var(--ag-bg);color:var(--ag-fg);",
  "-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;line-height:1.4;overflow:hidden}",
  ".ag-root *,.ag-root *::before,.ag-root *::after{box-sizing:border-box}",
  ".ag-root :where(button){font:inherit;letter-spacing:inherit;-webkit-tap-highlight-color:transparent}",
  ".ag-root :where(button):focus-visible{outline:2px solid var(--ag-fg);outline-offset:2px}",
  ".ag-wrap{max-width:1120px;margin:0 auto;padding:28px 24px 88px}",

  /* app bar */
  ".ag-head{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px}",
  ".ag-pill{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 13px;border:1px solid var(--ag-line);border-radius:999px;",
  "background:var(--ag-bg);color:var(--ag-fg);font-size:12px;font-weight:600;letter-spacing:-.01em;white-space:nowrap}",
  ".ag-brand{justify-self:start}",
  ".ag-action{justify-self:end;cursor:pointer;transition:background .25s,border-color .25s}",
  ".ag-action:hover{background:var(--ag-soft);border-color:var(--ag-dash)}",
  ".ag-seg{position:relative;display:inline-flex;align-items:stretch;height:30px;padding:2px;border:1px solid var(--ag-line);border-radius:999px;background:var(--ag-bg)}",
  ".ag-thumb{position:absolute;top:2px;bottom:2px;left:0;border-radius:999px;pointer-events:none;opacity:0}",
  ".ag-thumb[data-ready=\"true\"]{opacity:1;transition:transform .5s var(--ag-spring),width .5s var(--ag-spring)}",
  ".ag-seg .ag-thumb{background:var(--ag-soft2)}",
  ".ag-tab{position:relative;z-index:1;display:inline-flex;align-items:center;gap:0;padding:0 11px;border:0;background:none;border-radius:999px;",
  "color:var(--ag-muted);font-size:12px;cursor:pointer;transition:color .3s,gap .4s var(--ag-spring)}",
  ".ag-tab::before{content:\"\";position:absolute;left:-1px;top:6px;bottom:6px;width:1px;background:var(--ag-line);transition:opacity .3s}",
  ".ag-tab:first-of-type::before,.ag-tab[data-active=\"true\"]::before,.ag-tab[data-active=\"true\"]+.ag-tab::before{opacity:0}",
  ".ag-tab:hover{color:var(--ag-fg)}",
  ".ag-tab[data-active=\"true\"]{color:var(--ag-fg);font-weight:600;gap:6px}",
  ".ag-dot{width:0;height:5px;border-radius:50%;background:currentColor;opacity:.45;transform:scale(0);transition:transform .45s var(--ag-spring),width .45s var(--ag-spring)}",
  ".ag-tab[data-active=\"true\"] .ag-dot{width:5px;transform:scale(1)}",

  /* title row + billing switch */
  ".ag-titlerow{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:68px}",
  ".ag-title{margin:0;font-size:clamp(24px,2.5vw,30px);font-weight:500;letter-spacing:-.03em;line-height:1.1}",
  ".ag-bill{position:relative;display:inline-flex;align-items:stretch;height:32px;padding:3px;border-radius:999px;background:var(--ag-soft2)}",
  ".ag-bill .ag-thumb{top:3px;bottom:3px;background:var(--ag-bg);box-shadow:0 1px 2px rgba(0,0,0,.1),0 0 0 1px var(--ag-line)}",
  ".ag-opt{position:relative;z-index:1;display:inline-flex;align-items:center;gap:6px;padding:0 11px;border:0;background:none;border-radius:999px;",
  "color:var(--ag-muted);font-size:12px;cursor:pointer;transition:color .3s}",
  ".ag-opt:hover,.ag-opt[aria-checked=\"true\"]{color:var(--ag-fg)}",
  ".ag-opt[aria-checked=\"true\"]{font-weight:600}",
  ".ag-off{font-weight:700;color:var(--ag-fg);display:inline-block;transition:transform .45s var(--ag-spring)}",
  ".ag-opt[aria-checked=\"true\"] .ag-off{transform:scale(1.08)}",

  /* plan grid */
  ".ag-grid{display:grid;grid-template-columns:repeat(var(--ag-cols,4),minmax(0,1fr));gap:9px;margin-top:22px;list-style:none;padding:0}",
  ".ag-slot{position:relative;display:flex;margin:0}",
  ".ag-bleed{position:absolute;left:10%;right:10%;top:34%;bottom:-15%;z-index:0;pointer-events:none;border-radius:40%;background-size:cover;",
  "background-position:center bottom;filter:blur(32px) saturate(1.15);opacity:0;transform:scale(.85) translateY(-6%);transition:opacity .8s var(--ag-ease),transform .8s var(--ag-ease)}",
  ".ag-slot[data-lit=\"true\"] .ag-bleed{opacity:.42;transform:none}",
  ".ag-card{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;min-height:266px;padding:15px;border-radius:7px;",
  "border:1px dashed var(--ag-dash);background:var(--ag-bg);color:var(--ag-fg);overflow:hidden;",
  "transition:border-color .5s,box-shadow .8s var(--ag-ease),color .5s,transform .35s var(--ag-ease)}",
  ".ag-slot:not([data-lit=\"true\"]) .ag-card:hover{border-color:color-mix(in oklab,var(--ag-fg) 32%,transparent)}",
  ".ag-slot[data-lit=\"true\"] .ag-card{border-color:transparent;color:#fff;",
  "box-shadow:0 26px 50px -22px rgba(20,10,10,.5),0 2px 6px rgba(0,0,0,.14)}",

  /* the afterglow */
  ".ag-glow{position:absolute;inset:-1px;z-index:0;overflow:hidden;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .8s var(--ag-ease)}",
  ".ag-slot[data-lit=\"true\"] .ag-glow{opacity:1}",
  ".ag-base{position:absolute;inset:-7%;background-size:cover;background-position:center;filter:saturate(1.25);",
  "translate:calc(var(--ag-px,0) * -9px) calc(var(--ag-py,0) * -9px);transition:translate .5s var(--ag-ease);",
  "animation:ag-breathe 18s ease-in-out infinite alternate paused}",
  ".ag-blob{position:absolute;border-radius:50%;mix-blend-mode:screen;filter:blur(22px);opacity:.38;animation:ag-drift-a 13s ease-in-out infinite alternate paused}",
  ".ag-blob-a{width:70%;height:45%;left:34%;top:18%;background:radial-gradient(closest-side,var(--ag-hi),transparent)}",
  ".ag-blob-b{width:95%;height:70%;left:-38%;top:52%;background:radial-gradient(closest-side,var(--ag-rose),transparent);animation-name:ag-drift-b;animation-duration:17s}",
  ".ag-slot[data-lit=\"true\"] .ag-base,.ag-slot[data-lit=\"true\"] .ag-blob,.ag-slot[data-lit=\"true\"] .ag-tw{animation-play-state:running}",
  ".ag-light{position:absolute;inset:0;mix-blend-mode:screen;opacity:0;transition:opacity .5s;",
  "background:radial-gradient(230px circle at var(--ag-mx,62%) var(--ag-my,38%),color-mix(in oklab,var(--ag-core) 42%,transparent),transparent 70%)}",
  ".ag-slot[data-lit=\"true\"] .ag-card:hover .ag-light{opacity:1}",
  ".ag-slot[data-lit=\"true\"] .ag-card:hover{transform:translateY(-2px);box-shadow:0 32px 56px -22px rgba(20,10,10,.55),0 2px 6px rgba(0,0,0,.14)}",
  ".ag-tw{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;box-shadow:0 0 6px 1px rgba(255,255,255,.75);opacity:0;",
  "animation:ag-twinkle 3.4s ease-in-out infinite paused}",
  ".ag-grain{position:absolute;inset:0;background-size:160px 160px;mix-blend-mode:overlay;opacity:.28}",

  /* card content */
  ".ag-body{position:relative;z-index:1;display:flex;flex-direction:column;flex:1}",
  ".ag-top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:21px}",
  ".ag-label{font-size:11px;color:var(--ag-muted);transition:color .5s}",
  ".ag-badge{font-size:10.5px;line-height:1;padding:5px 9px;border-radius:999px;white-space:nowrap;background:var(--ag-soft2);color:var(--ag-muted);",
  "transition:background .5s,color .5s,box-shadow .5s}",
  ".ag-slot[data-lit=\"true\"] .ag-label{color:rgba(255,255,255,.62)}",
  ".ag-slot[data-lit=\"true\"] .ag-badge{background:rgba(255,255,255,.17);color:rgba(255,255,255,.85);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);",
  "-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}",
  ".ag-price{display:flex;align-items:baseline;flex-wrap:wrap;column-gap:7px;margin-top:9px;font-size:27px;font-weight:500;letter-spacing:-.035em;line-height:1.15;",
  "font-variant-numeric:tabular-nums}",
  ".ag-num{display:inline-block;animation:ag-num-in .6s var(--ag-ease) both}",
  ".ag-cents{font-size:.6em;letter-spacing:-.01em}",
  ".ag-was,.ag-per{font-size:11.5px;font-weight:400;letter-spacing:0;color:var(--ag-muted);transition:color .5s}",
  ".ag-was{text-decoration:line-through;text-decoration-thickness:1px;animation:ag-num-in .6s var(--ag-ease) both}",
  ".ag-slot[data-lit=\"true\"] .ag-was,.ag-slot[data-lit=\"true\"] .ag-per{color:rgba(255,255,255,.6)}",
  ".ag-desc{margin:12px 0 0;max-width:200px;font-size:13px;line-height:1.42;color:color-mix(in oklab,var(--ag-fg) 86%,transparent);transition:color .5s}",
  ".ag-slot[data-lit=\"true\"] .ag-desc{color:#fff}",
  ".ag-feats{display:grid;gap:9px;margin:14px 0 0;padding:0;list-style:none;font-size:11.5px;color:var(--ag-muted);transition:color .5s}",
  ".ag-slot[data-lit=\"true\"] .ag-feats{color:rgba(255,255,255,.68)}",
  ".ag-feats li{transition:transform .4s var(--ag-ease)}",
  ".ag-card:hover .ag-feats li{transform:translateX(2px)}",
  ".ag-feats li:nth-child(2){transition-delay:.03s}.ag-feats li:nth-child(3){transition-delay:.06s}.ag-feats li:nth-child(4){transition-delay:.09s}",
  ".ag-yearly{margin-top:8px;font-size:11px;color:var(--ag-muted);animation:ag-num-in .6s var(--ag-ease) both}",
  ".ag-slot[data-lit=\"true\"] .ag-yearly{color:rgba(255,255,255,.6)}",
  ".ag-fill{flex:1;min-height:26px}",
  ".ag-cta{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:36px;padding:0 12px;border-radius:3px;",
  "border:1px solid var(--ag-line);background:var(--ag-bg);color:var(--ag-fg);font-size:13px;font-weight:500;cursor:pointer;",
  "transition:background .3s,color .3s,border-color .3s,transform .15s}",
  ".ag-cta:hover{background:color-mix(in oklab,var(--ag-fg) 4%,var(--ag-bg));border-color:var(--ag-dash)}",
  ".ag-cta:active{transform:scale(.985)}",
  ".ag-slot[data-lit=\"true\"] .ag-cta{background:#191919;border-color:rgba(255,255,255,.07);color:#fff}",
  ".ag-slot[data-lit=\"true\"] .ag-cta:hover{background:#050505}",
  ".ag-slot[data-lit=\"true\"] .ag-cta:focus-visible{outline-color:#fff}",
  ".ag-cta[data-pop=\"true\"]::after{content:\"\";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;animation:ag-ring .75s var(--ag-ease) both}",
  ".ag-cta[data-pop=\"true\"] .ag-spark{animation:ag-spark .7s var(--ag-spring) both}",

  /* the wand */
  ".ag-wand{flex:none;overflow:visible}",
  ".ag-spark{transform-box:fill-box;transform-origin:center;transition:transform .5s var(--ag-spring),opacity .3s}",
  ".ag-cta:hover .ag-spark-a,.ag-action:hover .ag-spark-a{transform:scale(1.3) rotate(45deg)}",
  ".ag-cta:hover .ag-spark-b,.ag-action:hover .ag-spark-b{transform:scale(1.45) rotate(-30deg);transition-delay:.05s}",
  ".ag-cta:hover .ag-spark-c,.ag-action:hover .ag-spark-c{transform:scale(1.6) rotate(30deg);transition-delay:.1s}",

  /* motion */
  "@keyframes ag-breathe{0%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.06) rotate(1.2deg)}100%{transform:scale(1.03) translate(-2%,2%)}}",
  "@keyframes ag-drift-a{0%{transform:translate(0,0) scale(1)}100%{transform:translate(-14%,10%) scale(1.15)}}",
  "@keyframes ag-drift-b{0%{transform:translate(0,0) scale(1)}100%{transform:translate(18%,-8%) scale(.92)}}",
  "@keyframes ag-twinkle{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:.95;transform:scale(var(--ag-s,1))}}",
  "@keyframes ag-num-in{0%{opacity:0;transform:translateY(.45em);filter:blur(5px)}100%{opacity:1;transform:none;filter:blur(0)}}",
  "@keyframes ag-ring{0%{box-shadow:0 0 0 0 color-mix(in oklab,currentColor 35%,transparent)}100%{box-shadow:0 0 0 9px transparent}}",
  "@keyframes ag-spark{0%{transform:scale(.2) rotate(-90deg);opacity:0}100%{transform:none;opacity:1}}",

  /* layout */
  "@media (max-width:1023px){.ag-grid{grid-template-columns:repeat(min(var(--ag-cols,4),2),minmax(0,1fr));gap:14px}}",
  "@media (max-width:639px){.ag-wrap{padding:20px 16px 64px}.ag-head{grid-template-columns:1fr auto}",
  ".ag-seg{grid-column:1 / -1;grid-row:2;justify-self:center}.ag-titlerow{margin-top:44px}",
  ".ag-grid{grid-template-columns:minmax(0,1fr)}.ag-card{min-height:0}.ag-fill{min-height:22px}}",

  "@media (prefers-reduced-motion:reduce){.ag-base,.ag-blob,.ag-tw,.ag-num,.ag-was,.ag-yearly,.ag-spark,.ag-cta::after{animation:none!important}",
  ".ag-slot[data-lit=\"true\"] .ag-card{transform:none}.ag-base{translate:none}.ag-tw{opacity:.6}",
  ".ag-thumb[data-ready=\"true\"],.ag-card,.ag-glow,.ag-bleed,.ag-feats li,.ag-tab,.ag-dot{transition-duration:.01ms!important}}",
].join("")

/* -------------------------------------------------------------- helpers */

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

/** Slides a thumb under whichever child of `box` carries data-active / aria-checked. */
function useThumb(box: { current: HTMLElement | null }, key: string) {
  const [t, setT] = React.useState({ x: 0, w: 0, ready: false })
  useIsoLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const on = el.querySelector("[data-active=\"true\"],[aria-checked=\"true\"]") as HTMLElement | null
      if (!on) return setT((p) => ({ ...p, w: 0 }))
      setT((p) => {
        const next = { x: on.offsetLeft, w: on.offsetWidth, ready: true }
        if (p.x === next.x && p.w === next.w && p.ready) return p
        return next
      })
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [key])
  return t
}

/* ------------------------------------------------------------- component */

export default function AfterglowPricing({
  title = "Subscription",
  plans = D_PLANS,
  currency = "$",
  annualDiscount = 0.15,
  defaultBilling = "monthly",
  onBillingChange,
  glow = "ember",
  glowFollowsSelection = true,
  onSubscribe,
  currentLabel = "Current plan",
  showHeader = true,
  brand = "Roomservice",
  tabs = ["Generate", "History", "Account"],
  defaultTab = "Account",
  onTabChange,
  action = "Reimagine interior",
  onAction,
  className,
  style,
}: AfterglowPricingProps) {
  const uid = React.useId().replace(/:/g, "")
  const [billing, setBilling] = React.useState(defaultBilling)
  const [tab, setTab] = React.useState(defaultTab)
  const [selected, setSelected] = React.useState(-1)
  const [pop, setPop] = React.useState(0)
  const palette = resolveGlow(glow)
  const [art, setArt] = React.useState({ glow: "", grain: "" })
  const segRef = React.useRef(null as HTMLDivElement | null)
  const billRef = React.useRef(null as HTMLDivElement | null)
  const segThumb = useThumb(segRef, tab + "|" + tabs.join("|"))
  const billThumb = useThumb(billRef, billing + "|" + annualDiscount)

  const paletteKey = [palette.base, palette.hi, palette.mid, palette.rose, palette.deep, palette.core].join("|")
  React.useEffect(() => {
    setArt(artFor(palette))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteKey])

  const lit = litIndex(
    plans.map((p) => !!p.featured),
    selected,
    glowFollowsSelection,
  )
  const off = discountLabel(annualDiscount)
  const cols = Math.max(1, Math.min(4, plans.length))

  const pickBilling = (b: AfterglowBilling) => {
    if (b === billing) return
    setBilling(b)
    onBillingChange?.(b)
  }
  const onBillKey = (e: React.KeyboardEvent) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault()
      const next = billing === "monthly" ? "annual" : "monthly"
      pickBilling(next)
      const btn = billRef.current?.querySelector("[data-b=\"" + next + "\"]") as HTMLElement | null
      btn?.focus()
    }
  }
  const pickTab = (t: string) => {
    setTab(t)
    onTabChange?.(t)
  }
  const subscribe = (i: number) => {
    setSelected(i)
    setPop((n) => n + 1)
    onSubscribe?.(plans[i], billing)
  }

  // Pointer light and a parallax drift on the lit card. Written straight to
  // CSS variables so moving the mouse never re-renders.
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return
    const el = e.currentTarget as HTMLElement
    const r = el.getBoundingClientRect()
    const px = clamp((e.clientX - r.left) / r.width, 0, 1)
    const py = clamp((e.clientY - r.top) / r.height, 0, 1)
    el.style.setProperty("--ag-mx", (px * 100).toFixed(1) + "%")
    el.style.setProperty("--ag-my", (py * 100).toFixed(1) + "%")
    el.style.setProperty("--ag-px", ((px - 0.5) * 2).toFixed(3))
    el.style.setProperty("--ag-py", ((py - 0.5) * 2).toFixed(3))
  }
  const onLeave = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement
    for (const k of ["--ag-mx", "--ag-my", "--ag-px", "--ag-py"]) el.style.removeProperty(k)
  }

  const glowVars = {
    "--ag-hi": palette.hi,
    "--ag-rose": palette.rose,
    "--ag-core": palette.core,
  } as React.CSSProperties
  const baseBg = art.glow ? "url(" + art.glow + ")" : cssGlow(palette)

  return (
    <section
      className={"ag-root" + (className ? " " + className : "")}
      style={{ ...glowVars, ...style }}
      aria-labelledby={uid + "-title"}
    >
      <style>{AG_CSS}</style>
      <div className="ag-wrap">
        {showHeader ? (
          <header className="ag-head">
            {brand ? <span className="ag-pill ag-brand">{brand}</span> : <span />}
            {tabs.length ? (
              <nav className="ag-seg" ref={segRef} aria-label="Sections">
                <span
                  className="ag-thumb"
                  data-ready={segThumb.ready}
                  style={{ width: segThumb.w, transform: "translateX(" + segThumb.x + "px)" }}
                  aria-hidden="true"
                />
                {tabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="ag-tab"
                    data-active={t === tab}
                    aria-current={t === tab ? "page" : undefined}
                    onClick={() => pickTab(t)}
                  >
                    <span className="ag-dot" aria-hidden="true" />
                    {t}
                  </button>
                ))}
              </nav>
            ) : (
              <span />
            )}
            {action ? (
              <button type="button" className="ag-pill ag-action" onClick={onAction}>
                <Wand />
                {action}
              </button>
            ) : (
              <span />
            )}
          </header>
        ) : null}

        <div className="ag-titlerow" style={showHeader ? undefined : { marginTop: 0 }}>
          <h2 className="ag-title" id={uid + "-title"}>
            {title}
          </h2>
          <div className="ag-bill" ref={billRef} role="radiogroup" aria-label="Billing period" onKeyDown={onBillKey}>
            <span
              className="ag-thumb"
              data-ready={billThumb.ready}
              style={{ width: billThumb.w, transform: "translateX(" + billThumb.x + "px)" }}
              aria-hidden="true"
            />
            {(["monthly", "annual"] as AfterglowBilling[]).map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                data-b={b}
                className="ag-opt"
                aria-checked={billing === b}
                tabIndex={billing === b ? 0 : -1}
                onClick={() => pickBilling(b)}
              >
                {b === "monthly" ? "Monthly" : "Annual"}
                {b === "annual" && off ? <span className="ag-off">{off}</span> : null}
              </button>
            ))}
          </div>
        </div>

        <ul className="ag-grid" style={{ "--ag-cols": cols } as React.CSSProperties}>
          {plans.map((plan, i) => {
            const isLit = i === lit
            const now = planPrice(plan.price, billing, annualDiscount)
            const [whole, cents] = splitPrice(now)
            const discounted = billing === "annual" && now < plan.price
            const current = i === selected
            return (
              <li key={plan.label + i} className="ag-slot" data-lit={isLit}>
                <div className="ag-bleed" style={{ backgroundImage: baseBg }} aria-hidden="true" />
                <article
                  className="ag-card"
                  aria-label={plan.label}
                  onPointerMove={isLit ? onMove : undefined}
                  onPointerLeave={onLeave}
                >
                  <div className="ag-glow" aria-hidden="true">
                    <div className="ag-base" style={{ backgroundImage: baseBg }} />
                    <div className="ag-blob ag-blob-a" />
                    <div className="ag-blob ag-blob-b" />
                    <div className="ag-light" />
                    {TWINKLES.map((s, k) => (
                      <span
                        key={k}
                        className="ag-tw"
                        style={
                          {
                            left: s.left,
                            top: s.top,
                            animationDelay: s.delay,
                            animationDuration: s.dur,
                            "--ag-s": s.scale,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                    {art.grain ? <div className="ag-grain" style={{ backgroundImage: "url(" + art.grain + ")" }} /> : null}
                  </div>

                  <div className="ag-body">
                    <div className="ag-top">
                      <span className="ag-label">{plan.label}</span>
                      {plan.badge ? <span className="ag-badge">{plan.badge}</span> : null}
                    </div>
                    <div className="ag-price">
                      <span className="ag-num" key={billing + now} style={{ animationDelay: i * 45 + "ms" }}>
                        {currency}
                        {whole}
                        {cents ? <span className="ag-cents">{cents}</span> : null}
                      </span>
                      {discounted ? (
                        <span className="ag-was" key={"w" + billing} style={{ animationDelay: i * 45 + 90 + "ms" }}>
                          {currency}
                          {splitPrice(plan.price).join("")}
                        </span>
                      ) : null}
                      <span className="ag-per">/mo</span>
                    </div>
                    {plan.description ? <p className="ag-desc">{plan.description}</p> : null}
                    {plan.features?.length ? (
                      <ul className="ag-feats">
                        {plan.features.map((f, k) => (
                          <li key={k}>{f}</li>
                        ))}
                      </ul>
                    ) : null}
                    {billing === "annual" && plan.price > 0 ? (
                      <div className="ag-yearly" key={"y" + now}>
                        {currency}
                        {splitPrice(yearlyTotal(plan.price, annualDiscount)).join("")} billed yearly
                      </div>
                    ) : null}
                    <div className="ag-fill" />
                    <button
                      type="button"
                      className="ag-cta"
                      key={current ? "c" + pop : "s"}
                      data-pop={current && pop > 0}
                      aria-pressed={current}
                      onClick={() => subscribe(i)}
                    >
                      {current ? <Check /> : <Wand />}
                      {current ? currentLabel : plan.cta ?? "Subscribe"}
                    </button>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
