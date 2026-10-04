"use client"

import * as React from "react"

/**
 * Billboard Signup Footer — a loud, single-colour closing section: the brand
 * set as a giant condensed wordmark that grows out of the footer's body, an
 * email pill, a row of socials, four link columns and a slogan ticker.
 *
 * The wordmark is not a font. It is drawn from a built-in stroke alphabet
 * (A–Z, 0–9, a few marks) as inline SVG, so it looks the same on every
 * installer's machine and nothing is fetched. Each letter is a piano key: the
 * pointer presses the keys under it, a click strikes one, and a successful
 * signup runs a glissando across the whole word.
 *
 * Interaction: keys dip as the pointer passes and bounce when struck; the
 * letters rise out of the body the first time the footer is seen; the email
 * pill validates, loads, celebrates or shakes; the ticker slows under the
 * pointer and can be dragged and flung; the chat bubble opens a small card.
 *
 * No dependencies: React is the only import. Icons and letters are inline SVG.
 */

// #region billboard
// Pure: the alphabet, layout, spring and ticker maths. Lifted out and run by the test.

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)

/** "#ff4419" / "#f41" → "255, 68, 25". Anything unparseable falls back. */
export const hexToRgb = (hex: string, fallback: string = "255, 68, 25"): string => {
  const m = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec((hex || "").trim())
  if (!m) return fallback
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  const n = parseInt(h, 16)
  return ((n >> 16) & 255) + ", " + ((n >> 8) & 255) + ", " + (n & 255)
}

/** Cap height of every glyph, in glyph units. */
export const CAP = 100
/** Stroke weight of every glyph. Paths are centre-lines; each glyph is clipped to its own box. */
export const STROKE = 20
/** Accent strip under the letters, so the word and the body never show a seam. */
export const FOOT = 3

/**
 * The stroke alphabet: `[advance width, centre-line path]` on a 100-unit cap.
 * Stems sit 10 units in from the edge; ends that should be square run past the
 * box and are trimmed by the glyph's clip. Rounds share one 16-unit radius.
 */
export const GLYPHS: Record<string, readonly [number, string]> = {
  A: [52, "M10 110V26A16 16 0 0 1 42 26V110M10 58H42"],
  B: [52, "M10 110V10H26A16 16 0 0 1 42 26V34A16 16 0 0 1 26 50H10M10 50H26A16 16 0 0 1 42 66V74A16 16 0 0 1 26 90H0"],
  C: [52, "M42 40V26A16 16 0 0 0 10 26V74A16 16 0 0 0 42 74V60"],
  D: [52, "M10 110V10H26A16 16 0 0 1 42 26V74A16 16 0 0 1 26 90H0"],
  E: [44, "M44 10H10V90H44M10 50H40"],
  F: [44, "M44 10H10V110M10 52H40"],
  G: [52, "M42 38V26A16 16 0 0 0 10 26V74A16 16 0 0 0 42 74V50H28"],
  H: [52, "M10-10V110M42-10V110M10 50H42"],
  I: [20, "M10-10V110"],
  J: [46, "M36-10V74A13 13 0 0 1 10 74V60"],
  K: [52, "M10-10V110M10 62L48-10M22 46L50 110"],
  L: [42, "M10-10V90H42"],
  M: [64, "M10 110V-10M54 110V-10M10 4L32 56L54 4"],
  N: [54, "M10 110V-10M44 110V-10M10 0L44 100"],
  O: [52, "M10 26V74A16 16 0 0 0 42 74V26A16 16 0 0 0 10 26Z"],
  P: [50, "M10 110V10H24A16 16 0 0 1 40 26V42A16 16 0 0 1 24 58H10"],
  Q: [52, "M10 26V74A16 16 0 0 0 42 74V26A16 16 0 0 0 10 26ZM28 76L50 106"],
  R: [52, "M10 110V10H26A16 16 0 0 1 42 26V38A16 16 0 0 1 26 54H10M20 54H26A16 16 0 0 1 42 70V110"],
  S: [52, "M42 36V26A16 16 0 0 0 10 26V34A16 16 0 0 0 26 50A16 16 0 0 1 42 66V74A16 16 0 0 1 10 74V64"],
  T: [50, "M-5 10H55M25 0V110"],
  U: [52, "M10-10V74A16 16 0 0 0 42 74V-10"],
  V: [54, "M6-10L27 104M48-10L27 104"],
  W: [76, "M4-10L19 104M19 104L38 2L57 104M72-10L57 104"],
  X: [54, "M5-10L49 110M49-10L5 110"],
  Y: [54, "M5-10L27 56M49-10L27 56M27 48V110"],
  Z: [50, "M0 10H40L10 90H50"],
  "0": [52, "M10 26V74A16 16 0 0 0 42 74V26A16 16 0 0 0 10 26Z"],
  "1": [36, "M0 22L24 6M26-10V110"],
  "2": [52, "M10 34V26A16 16 0 0 1 42 26V42L10 84V90H52"],
  "3": [52, "M10 32V26A16 16 0 0 1 42 26V34A16 16 0 0 1 26 50H18M26 50A16 16 0 0 1 42 66V74A16 16 0 0 1 10 74V68"],
  "4": [54, "M28-10L10 66V70H54M40 36V110"],
  "5": [52, "M46 10H10V48H26A16 16 0 0 1 42 64V74A16 16 0 0 1 10 74V68"],
  "6": [52, "M40 10H26A16 16 0 0 0 10 26V74A16 16 0 0 0 42 74V62A16 16 0 0 0 26 46H10"],
  "7": [48, "M0 10H38L18 110"],
  "8": [52, "M10 26V34A16 16 0 0 0 42 34V26A16 16 0 0 0 10 26ZM10 66V74A16 16 0 0 0 42 74V66A16 16 0 0 0 10 66Z"],
  "9": [52, "M12 90H26A16 16 0 0 0 42 74V26A16 16 0 0 0 10 26V38A16 16 0 0 0 26 54H42"],
  " ": [24, ""],
  "-": [34, "M0 54H34"],
  ".": [20, "M0 90H20"],
  "!": [20, "M10-10V62M0 90H20"],
  "'": [20, "M10-10V30"],
}

export type PlacedGlyph = { ch: string; x: number; w: number; d: string }

/**
 * Lay a word out in glyph units. Lower case is drawn as capitals; characters
 * the alphabet doesn't have are dropped. `tracking` goes between glyphs only.
 */
export const layoutWord = (text: string, tracking: number): { letters: PlacedGlyph[]; width: number } => {
  const letters: PlacedGlyph[] = []
  const gap = Number.isFinite(tracking) ? clamp(tracking, -10, 40) : 0
  let x = 0
  for (const raw of Array.from((text || "").toUpperCase())) {
    const g = GLYPHS[raw]
    if (!g) continue
    if (letters.length) x += gap
    letters.push({ ch: raw, x, w: g[0], d: g[1] })
    x += g[0]
  }
  return { letters, width: x }
}

/**
 * The wordmark's viewBox. `crop` units come off the top, the accent foot goes
 * under the baseline, and a short word is padded sideways so it is never
 * taller than `1 / minAspect` of the footer's width.
 */
export const frameFor = (
  width: number,
  crop: number,
  minAspect: number,
): { x: number; y: number; w: number; h: number } => {
  const y = clamp(Number.isFinite(crop) ? crop : 0, 0, 40)
  const h = CAP + FOOT - y
  const content = width > 0 ? width : 0
  const w = Math.max(content, h * (minAspect > 0 ? minAspect : 0), 1)
  return { x: -(w - content) / 2, y, w, h }
}

/** How far a key at `dist` from the pointer is pressed, 0 → 1. Smoothstep falloff. */
export const pressAt = (dist: number, radius: number): number => {
  if (!(radius > 0) || !Number.isFinite(dist)) return 0
  const u = 1 - Math.abs(dist) / radius
  return u <= 0 ? 0 : u * u * (3 - 2 * u)
}

/**
 * One damped-spring step, `[position, velocity]`. Sub-stepped at 1/240s so it
 * is stable and frame-rate independent; a stalled tab never explodes it.
 */
export const springStep = (
  x: number,
  v: number,
  target: number,
  dt: number,
  stiffness: number = 260,
  damping: number = 18,
): [number, number] => {
  let t = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1)
  while (t > 1e-9) {
    const h = Math.min(t, 1 / 240)
    v += (stiffness * (target - x) - damping * v) * h
    x += v * h
    t -= h
  }
  return [x, v]
}

/** Frame-rate independent ease: `k` is the fraction closed per 1/60s. */
export const approach = (from: number, to: number, k: number, dt: number): number =>
  to + (from - to) * Math.pow(1 - clamp(k, 0, 1), clamp(dt, 0, 0.1) * 60)

/** Ticker offset folded into one period, always in `[0, period)`. */
export const wrapOffset = (offset: number, period: number): number =>
  period > 0 && Number.isFinite(offset) ? ((offset % period) + period) % period : 0

/** How many copies of one ticker set cover `view` px with a set to spare. */
export const copiesFor = (view: number, period: number): number =>
  period > 0 && view > 0 ? clamp(Math.ceil(view / period) + 1, 2, 40) : 2

export const isEmail = (s: string): boolean => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test((s || "").trim())

// #endregion

export type SocialIcon = "facebook" | "linkedin" | "x" | "instagram" | "youtube" | "github"

export type FooterSocial = {
  label: string
  href?: string
  /** One of the built-ins, or your own 24×24 node. */
  icon: SocialIcon | React.ReactNode
}

export type FooterLink = { label: string; href?: string }
export type FooterColumn = { title: string; links: FooterLink[] }

export type FooterTicker = {
  /** The accent word that leads every slogan. */
  lead: string
  items: string[]
  /** Pixels per second. `0` holds it still (it can still be dragged). */
  speed?: number
}

export type FooterChat = {
  title?: string
  message?: string
  status?: string
  actionLabel?: string
  href?: string
}

/**
 * Called with a valid email. Resolve (or return) nothing / `true` for success,
 * a string to use as the success message, `false` for a generic failure, or
 * throw an `Error` whose message is shown. Omitted: a short fake delay.
 */
export type SubscribeHandler = (email: string) => void | boolean | string | Promise<void | boolean | string>

export type BillboardSignupFooterProps = {
  brand?: string
  /** What the giant wordmark spells. Defaults to `brand`. A–Z, 0–9, space, - . ! ' */
  wordmark?: string
  onSubscribe?: SubscribeHandler
  placeholder?: string
  buttonLabel?: string
  tagline?: string
  successMessage?: string
  invalidMessage?: string
  errorMessage?: string
  socials?: FooterSocial[]
  columns?: FooterColumn[]
  /** The slogan ticker. `false` removes it. */
  ticker?: FooterTicker | false
  /** The chat bubble and its card. `false` removes it. */
  chat?: FooterChat | false
  onLinkClick?: (label: string, href?: string) => void
  /** Glyph units cut off the top of the wordmark (of 100). The reference crops a little. */
  crop?: number
  /** Space between letters, in glyph units. */
  tracking?: number
  /** How deep a key goes under the pointer, as a fraction of cap height. `0` turns pressing off. */
  press?: number
  /** Hex. The body, the letters, the ticker's lead word. */
  accent?: string
  /** Hex. Behind the wordmark and the ticker. */
  paper?: string
  /** Hex. Text on the accent. */
  ink?: string
  /** Hex. Ticker text. */
  tickerInk?: string
  fontSans?: string
  className?: string
}

const DEFAULT_SOCIALS: FooterSocial[] = [
  { label: "Facebook", href: "#", icon: "facebook" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
  { label: "X", href: "#", icon: "x" },
  { label: "Instagram", href: "#", icon: "instagram" },
]

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "#" },
      { label: "Blog", href: "#" },
      { label: "(555) 013-2048", href: "tel:+15550132048" },
    ],
  },
  { title: "Product", links: [{ label: "Job description generator", href: "#" }] },
  {
    title: "Company",
    links: [
      { label: "Careers", href: "#" },
      { label: "Partners", href: "#" },
    ],
  },
  { title: "Legal", links: [{ label: "Privacy", href: "#" }] },
]

const SANS =
  '"Satoshi", "General Sans", "DM Sans", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

/** Below this aspect (width / height) a short word gets side padding instead of towering. */
const MIN_ASPECT = 2.4
/** Where a key waits before its reveal: fully below the baseline. */
const HIDE = CAP + 10
/** Pointer reach, in glyph units either side. */
const REACH = 64

const ICONS: Record<SocialIcon, React.ReactNode> = {
  facebook: (
    <path
      d="M13.4 21v-7.6h2.55l.4-3h-2.95V8.6c0-.86.25-1.46 1.48-1.46h1.57V4.47c-.27-.04-1.2-.12-2.3-.12-2.26 0-3.8 1.38-3.8 3.92v2.13H7.8v3h2.55V21h3.05Z"
      fill="currentColor"
    />
  ),
  linkedin: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M8 10.5V16M12 16v-5.5M12 13c0-1.6 1-2.6 2.4-2.6s2.1.9 2.1 2.4V16" />
      <circle cx="8" cy="7.7" r=".6" fill="currentColor" />
    </g>
  ),
  x: (
    <path
      d="M17.6 3.5h2.9l-6.3 7.2 7.4 9.8h-5.8l-4.5-5.9-5.2 5.9H3.2l6.7-7.7L2.8 3.5h5.9l4.1 5.4 4.8-5.4Zm-1 15.3h1.6L7.9 5.1H6.2l10.4 13.7Z"
      fill="currentColor"
    />
  ),
  instagram: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.9" />
      <circle cx="17.1" cy="6.9" r=".7" fill="currentColor" stroke="none" />
    </g>
  ),
  youtube: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <rect x="2.75" y="5.5" width="18.5" height="13" rx="4" />
      <path d="M10.2 9.3v5.4l4.6-2.7-4.6-2.7Z" fill="currentColor" />
    </g>
  ),
  github: (
    <path
      d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
}

const isIconName = (v: unknown): v is SocialIcon => typeof v === "string" && v in ICONS

// Confetti for a successful signup: angle (deg), distance (px), shape.
const BURST = Array.from({ length: 14 }, (_, i) => ({
  a: i * (360 / 14) + (i % 2 ? 9 : -6),
  r: 46 + ((i * 37) % 5) * 9,
  round: i % 3 === 0,
}))

// One scoped stylesheet. Every rule sits under .bsf; element resets go through
// :where(.bsf) so they never out-rank the component's own classes or yours.
const CSS =
  ".bsf{position:relative;isolation:isolate;container-type:inline-size;background:var(--bsf-acc);color:var(--bsf-ink);font-family:var(--bsf-sans);-webkit-font-smoothing:antialiased}" +
  ":where(.bsf) a{color:inherit;text-decoration:none}" +
  ":where(.bsf) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}" +
  ":where(.bsf) input{font:inherit;color:inherit;margin:0}" +
  ":where(.bsf) ul{list-style:none;margin:0;padding:0}" +
  ":where(.bsf) p{margin:0}" +
  ".bsf svg{max-width:none;display:block}" +
  ".bsf .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
  // The wordmark: one inline SVG, sized by its own viewBox, no measuring.
  ".bsf-word{display:block;width:100%;height:auto;overflow:hidden;cursor:pointer;touch-action:pan-y;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}" +
  ".bsf-word path{fill:none;stroke:var(--bsf-acc);stroke-linejoin:miter;stroke-miterlimit:10;stroke-linecap:butt}" +
  // The body.
  ".bsf-body{position:relative;z-index:1;padding:clamp(22px,4.2cqw,40px) clamp(16px,3.4cqw,40px) 0}" +
  ".bsf-form{position:relative;box-sizing:border-box;max-width:1120px;margin:0 auto;display:flex;align-items:center;height:clamp(52px,8.2cqw,68px);border-radius:999px;background:rgba(var(--bsf-ink-rgb),.2);box-shadow:inset 0 0 0 1px rgba(var(--bsf-ink-rgb),.1);transition:background .3s,box-shadow .3s}" +
  ".bsf-form:hover{background:rgba(var(--bsf-ink-rgb),.24)}" +
  ".bsf-form:focus-within{background:rgba(var(--bsf-ink-rgb),.27);box-shadow:inset 0 0 0 1.5px rgba(var(--bsf-ink-rgb),.75),0 0 0 5px rgba(var(--bsf-ink-rgb),.12)}" +
  ".bsf-form[data-status='error']{box-shadow:inset 0 0 0 1.5px var(--bsf-ink),0 0 0 5px rgba(var(--bsf-ink-rgb),.12)}" +
  ".bsf-form[data-status='success']{background:rgba(var(--bsf-ink-rgb),.3)}" +
  ".bsf-form.is-shake{animation:bsf-shake .5s cubic-bezier(.36,.07,.19,.97)}" +
  "@keyframes bsf-shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(3px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}" +
  ".bsf-input,.bsf-done{flex:1;min-width:0;align-self:stretch;box-sizing:border-box;padding:0 12px 0 clamp(18px,3.6cqw,30px);font-size:clamp(16px,3.1cqw,27px);letter-spacing:-.01em}" +
  ".bsf-input{background:transparent;border:0;outline:none;border-radius:999px;color:var(--bsf-ink);caret-color:var(--bsf-ink)}" +
  ".bsf-input::placeholder{color:rgba(var(--bsf-ink-rgb),.6);opacity:1;transition:color .25s}" +
  ".bsf-input:focus::placeholder{color:rgba(var(--bsf-ink-rgb),.4)}" +
  ".bsf-done{display:flex;align-items:center;gap:.45em;white-space:nowrap;overflow:hidden;animation:bsf-rise .5s cubic-bezier(.2,.8,.2,1)}" +
  ".bsf-done span{overflow:hidden;text-overflow:ellipsis}" +
  ".bsf-done svg{flex:none;width:.95em;height:.95em}" +
  "@keyframes bsf-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
  ".bsf-btn{position:relative;flex:none;box-sizing:border-box;height:calc(100% - 10px);min-width:4.6em;margin-right:5px;padding:0 clamp(16px,2.4cqw,24px);border-radius:999px;background:var(--bsf-ink);color:var(--bsf-acc);font-size:clamp(16px,3.1cqw,27px);font-weight:500;letter-spacing:-.015em;display:inline-flex;align-items:center;justify-content:center;gap:.35em;box-shadow:0 1px 0 rgba(0,0,0,.08);transition:transform .4s cubic-bezier(.2,.9,.25,1.35),box-shadow .3s}" +
  ".bsf-btn:hover{transform:translateY(-1px) scale(1.035);box-shadow:0 12px 26px -12px rgba(0,0,0,.45)}" +
  ".bsf-btn:active{transform:scale(.96);transition-duration:.12s}" +
  ".bsf-btn:focus-visible{outline:2px solid var(--bsf-ink);outline-offset:3px}" +
  ".bsf-btn[aria-disabled='true']{cursor:default;transform:none;box-shadow:none}" +
  ".bsf-btn svg{width:.8em;height:.8em}" +
  ".bsf-dots{display:inline-flex;gap:.2em;padding:0 .5em}" +
  ".bsf-dots i{width:.24em;height:.24em;border-radius:50%;background:currentColor;animation:bsf-dot 1s infinite ease-in-out}" +
  ".bsf-dots i:nth-child(2){animation-delay:.14s}.bsf-dots i:nth-child(3){animation-delay:.28s}" +
  "@keyframes bsf-dot{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-.28em);opacity:1}}" +
  ".bsf-burst{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none}" +
  ".bsf-burst i{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:2px;background:var(--bsf-ink);opacity:0;animation:bsf-pop .95s cubic-bezier(.12,.7,.3,1) forwards}" +
  ".bsf-burst i:nth-child(3n){background:var(--bsf-paper)}" +
  ".bsf-burst i[data-round]{border-radius:50%;width:6px;height:6px}" +
  "@keyframes bsf-pop{0%{opacity:1;transform:rotate(var(--a)) translateX(0) scale(1)}100%{opacity:0;transform:rotate(var(--a)) translateX(var(--r)) rotate(220deg) scale(.3)}}" +
  ".bsf-note{margin-top:14px;min-height:1.4em;text-align:center;font-size:13.5px;line-height:1.4;font-weight:500;letter-spacing:.005em}" +
  ".bsf-note button{text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(var(--bsf-ink-rgb),.55);margin-left:.4em;transition:text-decoration-color .2s}" +
  ".bsf-note button:hover,.bsf-note button:focus-visible{text-decoration-color:var(--bsf-ink);outline:none}" +
  ".bsf-note[data-tone='error']{animation:bsf-rise .35s cubic-bezier(.2,.8,.2,1)}" +
  // Socials.
  ".bsf-socials{display:flex;justify-content:center;gap:6px;margin-top:clamp(34px,7cqw,60px)}" +
  ".bsf-soc{position:relative;width:34px;height:34px;display:grid;place-items:center;border-radius:50%;color:var(--bsf-ink);transition:background .25s,color .25s,transform .4s cubic-bezier(.2,.9,.25,1.5)}" +
  ".bsf-soc svg{width:16px;height:16px}" +
  ".bsf-soc:hover,.bsf-soc:focus-visible{background:var(--bsf-ink);color:var(--bsf-acc);transform:translateY(-3px) rotate(-8deg);outline:none}" +
  ".bsf-tip{position:absolute;left:50%;top:calc(100% + 8px);translate:-50% -4px;white-space:nowrap;font-size:11px;line-height:1;font-weight:600;padding:5px 7px;border-radius:999px;background:var(--bsf-ink);color:var(--bsf-acc);opacity:0;pointer-events:none;transition:opacity .2s,translate .25s;rotate:8deg}" +
  ".bsf-soc:hover .bsf-tip,.bsf-soc:focus-visible .bsf-tip{opacity:1;translate:-50% 0}" +
  // Columns.
  ".bsf-cols{box-sizing:border-box;display:grid;grid-template-columns:repeat(var(--bsf-n),minmax(0,1fr));column-gap:clamp(16px,2.6cqw,28px);row-gap:34px;margin-top:clamp(40px,8cqw,68px);padding-bottom:clamp(30px,4.6cqw,44px)}" +
  ".bsf-col{min-width:0}" +
  ".bsf-h{position:relative;display:block;padding-bottom:6px;font-size:11px;line-height:1.2;font-weight:500;letter-spacing:.03em;text-transform:uppercase;color:rgba(var(--bsf-ink-rgb),.72)}" +
  ".bsf-h::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:rgba(var(--bsf-ink-rgb),.5);transform-origin:0 50%;transform:scaleX(var(--bsf-line,1));transition:transform 1.1s cubic-bezier(.2,.7,.1,1) var(--bsf-d,0ms)}" +
  ".bsf[data-in='false'] .bsf-h::after{--bsf-line:0}" +
  ".bsf-links{margin-top:14px;display:flex;flex-direction:column;align-items:flex-start;gap:5px}" +
  ".bsf-link{display:inline-block;padding:2px 0;font-size:13.5px;line-height:1.35;font-weight:500;background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:background-size .35s cubic-bezier(.2,.8,.2,1),translate .35s cubic-bezier(.2,.8,.2,1)}" +
  ".bsf-link:hover,.bsf-link:focus-visible{background-size:100% 1px;translate:4px 0;outline:none}" +
  ".bsf-fade{transition:opacity .8s ease var(--bsf-d,0ms),translate .8s cubic-bezier(.2,.7,.1,1) var(--bsf-d,0ms)}" +
  ".bsf[data-in='false'] .bsf-fade{opacity:0;translate:0 12px}" +
  // The ticker, and the chat bubble that sits on it.
  ".bsf-tail{position:relative}" +
  ".bsf-tk{position:relative;overflow:hidden;background:var(--bsf-paper);color:var(--bsf-tink);padding:clamp(9px,1.5cqw,13px) 0;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none}" +
  ".bsf-tk[data-drag='true']{cursor:grabbing}" +
  ".bsf-tk-track{display:flex;width:max-content;will-change:transform}" +
  ".bsf-tk-set{display:flex;flex:none}" +
  ".bsf-tk-item{flex:none;padding-right:clamp(18px,2.6cqw,30px);font-size:clamp(18px,2.9cqw,26px);line-height:1.2;font-weight:800;letter-spacing:-.035em;white-space:nowrap}" +
  ".bsf-tk-item b{font-weight:800;color:var(--bsf-acc);display:inline-block;transition:transform .4s cubic-bezier(.2,.9,.25,1.5)}" +
  ".bsf-tk:hover .bsf-tk-item b{transform:rotate(-4deg) translateY(-1px)}" +
  ".bsf-chat{position:absolute;right:clamp(8px,1.6cqw,16px);top:50%;z-index:5;translate:0 -50%}" +
  ".bsf-chat-btn{position:relative;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--bsf-acc);color:var(--bsf-ink);box-shadow:0 0 0 3px var(--bsf-paper),0 10px 22px -8px rgba(var(--bsf-acc-rgb),.9);transition:transform .45s cubic-bezier(.2,.9,.25,1.5)}" +
  ".bsf-chat-btn:hover{transform:scale(1.08) rotate(-8deg)}" +
  ".bsf-chat-btn:focus-visible{outline:2px solid var(--bsf-acc);outline-offset:5px}" +
  ".bsf-chat-btn svg{position:absolute;width:21px;height:21px;transition:transform .4s cubic-bezier(.2,.9,.25,1.3),opacity .2s}" +
  ".bsf-chat-btn .bsf-x{opacity:0;transform:rotate(-90deg) scale(.6)}" +
  ".bsf-chat-btn[aria-expanded='true'] .bsf-bub{opacity:0;transform:rotate(90deg) scale(.6)}" +
  ".bsf-chat-btn[aria-expanded='true'] .bsf-x{opacity:1;transform:none}" +
  ".bsf-chat-btn::after{content:'';position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 0 rgba(var(--bsf-acc-rgb),.55);animation:bsf-ping 3.2s cubic-bezier(.2,.7,.2,1) infinite}" +
  ".bsf-chat-btn[aria-expanded='true']::after{animation:none}" +
  "@keyframes bsf-ping{0%,60%{box-shadow:0 0 0 0 rgba(var(--bsf-acc-rgb),.55)}100%{box-shadow:0 0 0 16px rgba(var(--bsf-acc-rgb),0)}}" +
  ".bsf-pop{position:absolute;right:0;bottom:calc(100% + 14px);box-sizing:border-box;width:min(300px,calc(100cqw - 24px));padding:16px;border-radius:20px;background:#fff;color:#161616;box-shadow:0 28px 60px -20px rgba(0,0,0,.5),0 0 0 1px rgba(0,0,0,.06);transform-origin:calc(100% - 22px) 100%;animation:bsf-open .4s cubic-bezier(.2,.9,.25,1.25)}" +
  "@keyframes bsf-open{from{opacity:0;transform:translateY(8px) scale(.85)}to{opacity:1;transform:none}}" +
  ".bsf-pop-head{display:flex;align-items:center;gap:10px;padding-right:24px}" +
  ".bsf-ava{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--bsf-acc);color:var(--bsf-ink);font-weight:800;font-size:17px;letter-spacing:-.04em}" +
  ".bsf-pop-t{font-size:15px;line-height:1.2;font-weight:700;letter-spacing:-.01em}" +
  ".bsf-pop-s{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:12px;color:#6b6b6b}" +
  ".bsf-pop-s i{width:7px;height:7px;border-radius:50%;background:#1fbf6a;box-shadow:0 0 0 3px rgba(31,191,106,.18)}" +
  ".bsf-pop-m{margin-top:12px;padding:10px 12px;border-radius:4px 14px 14px 14px;background:#f3f2ef;font-size:13.5px;line-height:1.45}" +
  ".bsf-pop-a{margin-top:12px;display:flex;align-items:center;justify-content:center;gap:8px;height:40px;border-radius:999px;background:var(--bsf-acc);color:var(--bsf-ink);font-size:14px;font-weight:600;transition:filter .2s,transform .3s cubic-bezier(.2,.9,.25,1.4)}" +
  ".bsf-pop-a:hover,.bsf-pop-a:focus-visible{filter:brightness(1.08);transform:translateY(-1px);outline:none}" +
  ".bsf-pop-a svg{width:14px;height:14px;transition:translate .3s}" +
  ".bsf-pop-a:hover svg{translate:3px 0}" +
  ".bsf-pop-x{position:absolute;right:10px;top:10px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#777;transition:background .2s,color .2s}" +
  ".bsf-pop-x:hover,.bsf-pop-x:focus-visible{background:#f0efec;color:#161616;outline:none}" +
  ".bsf-pop-x svg{width:14px;height:14px}" +
  "@container (max-width: 640px){.bsf-cols{grid-template-columns:repeat(2,minmax(0,1fr))}}" +
  "@container (max-width: 420px){.bsf-btn{padding:0 14px;min-width:0}.bsf-input,.bsf-done{padding-left:18px}}" +
  "@media (prefers-reduced-motion: reduce){.bsf .bsf-fade,.bsf .bsf-h::after,.bsf .bsf-btn,.bsf .bsf-soc,.bsf .bsf-link,.bsf .bsf-done,.bsf .bsf-note,.bsf .bsf-pop,.bsf .bsf-chat-btn,.bsf .bsf-tk-item b,.bsf .bsf-form{transition:none!important;animation:none!important}.bsf .bsf-chat-btn::after,.bsf .bsf-burst{display:none}.bsf .bsf-dots i{animation-duration:2.4s}.bsf[data-in='false'] .bsf-fade{opacity:1;translate:none}.bsf[data-in='false'] .bsf-h::after{--bsf-line:1}}"

const Check = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Cross = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

type Status = "idle" | "loading" | "success" | "error"

export default function BillboardSignupFooter({
  brand = "Voltra",
  wordmark,
  onSubscribe,
  placeholder = "Your email address",
  buttonLabel = "Subscribe",
  tagline = "Updates, resources, and tips delivered every once in a while.",
  successMessage = "You're on the list. Watch your inbox.",
  invalidMessage = "That email looks a little off. Mind checking it?",
  errorMessage = "Something went sideways. Give it another go?",
  socials = DEFAULT_SOCIALS,
  columns = DEFAULT_COLUMNS,
  ticker,
  chat,
  onLinkClick,
  crop = 6,
  tracking = 3,
  press = 0.3,
  accent = "#ff4419",
  paper = "#f6f5f2",
  ink = "#ffffff",
  tickerInk = "#141414",
  fontSans = SANS,
  className = "",
}: BillboardSignupFooterProps) {
  const word = (wordmark ?? brand).trim() || brand
  const layout = React.useMemo(() => layoutWord(word, tracking), [word, tracking])
  const vb = frameFor(layout.width, crop, MIN_ASPECT)
  const lead = brand.split(/\s+/)[0] || brand
  const tick: FooterTicker | false =
    ticker === false
      ? false
      : (ticker ?? { lead, items: ["your next hire", "a new standard", "it, don't sweat it", "on your terms"] })
  const card: FooterChat | false =
    chat === false
      ? false
      : {
          title: brand + " team",
          status: "Usually replies in a few hours",
          message: "Hey! Questions about hiring, pricing or anything else? Drop us a line.",
          actionLabel: "Start a conversation",
          href: "#",
          ...chat,
        }

  const uid = React.useId()
  const rootRef = React.useRef<HTMLElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const keyRefs = React.useRef<(SVGGElement | null)[]>([])
  const formRef = React.useRef<HTMLFormElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [seen, setSeen] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => setReduced(mq.matches)
    onMq()
    mq.addEventListener("change", onMq)
    return () => mq.removeEventListener("change", onMq)
  }, [])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting)
        if (e.isIntersecting) setSeen(true)
      },
      { threshold: 0.15 },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  // ---- the keys -------------------------------------------------------------
  // Spring state lives in a ref and reaches the page as SVG transforms, so the
  // keys never re-render React.
  const keys = React.useRef({
    y: [] as number[],
    v: [] as number[],
    strikeAt: [] as number[],
    openAt: [] as number[],
    px: NaN,
    revealed: false,
  })
  const wake = React.useRef<() => void>(() => {})

  React.useEffect(() => {
    const k = keys.current
    const n = layout.letters.length
    const still = reduced || press <= 0
    const start = k.revealed || reduced ? 0 : HIDE
    k.y = Array(n).fill(start)
    k.v = Array(n).fill(0)
    k.strikeAt = Array(n).fill(0)
    k.openAt = Array(n).fill(0)
    const paint = (i: number) => keyRefs.current[i]?.setAttribute("transform", "translate(0 " + k.y[i].toFixed(2) + ")")
    for (let i = 0; i < n; i++) paint(i)
    if (reduced) {
      k.revealed = true
      wake.current = () => {}
      return
    }
    const centres = layout.letters.map((l) => l.x + l.w / 2)
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      let busy = false
      for (let i = 0; i < n; i++) {
        if (!layout.letters[i].d) continue
        if (k.strikeAt[i] && now >= k.strikeAt[i]) {
          k.strikeAt[i] = 0
          k.v[i] += 520
        }
        if (k.strikeAt[i]) busy = true
        const shut = !k.revealed || now < k.openAt[i]
        if (shut && k.revealed) busy = true
        const target = shut ? HIDE : still ? 0 : press * CAP * pressAt(k.px - centres[i], REACH)
        const [y, v] = shut && !k.revealed ? [HIDE, 0] : springStep(k.y[i], k.v[i], target, dt, shut ? 900 : 260, shut ? 60 : 18)
        k.y[i] = y
        k.v[i] = v
        if (Math.abs(y - target) > 0.04 || Math.abs(v) > 0.04) busy = true
        paint(i)
      }
      if (busy) raf = requestAnimationFrame(tick)
      else raf = last = 0
    }
    wake.current = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    wake.current()
    return () => {
      cancelAnimationFrame(raf)
      wake.current = () => {}
    }
  }, [layout, reduced, press])

  // The first time the footer is on screen, the keys rise out of the body one
  // after another.
  React.useEffect(() => {
    const k = keys.current
    if (!seen || k.revealed) return
    const now = performance.now()
    k.revealed = true
    k.openAt = k.openAt.map((_, i) => now + 140 + i * 75)
    wake.current()
  }, [seen])

  const toUnits = (clientX: number) => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r || !r.width) return NaN
    return vb.x + ((clientX - r.left) / r.width) * vb.w
  }

  const onKeysMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "touch" && e.type === "pointermove" && !e.buttons) return
    keys.current.px = toUnits(e.clientX)
    wake.current()
  }
  const onKeysLeave = () => {
    keys.current.px = NaN
    wake.current()
  }
  const strike = (e: React.MouseEvent<SVGSVGElement>) => {
    const x = toUnits(e.clientX)
    let best = -1
    let gap = Infinity
    layout.letters.forEach((l, i) => {
      const dd = Math.abs(l.x + l.w / 2 - x)
      if (l.d && dd < gap) {
        gap = dd
        best = i
      }
    })
    if (best < 0) return
    keys.current.strikeAt[best] = performance.now()
    wake.current()
  }
  const glissando = () => {
    const now = performance.now()
    const k = keys.current
    layout.letters.forEach((_, i) => (k.strikeAt[i] = now + 60 + i * 65))
    wake.current()
  }

  // ---- the signup -----------------------------------------------------------
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<Status>("idle")
  const [note, setNote] = React.useState("")
  const [burst, setBurst] = React.useState(0)
  const alive = React.useRef(true)
  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const shake = () => {
    const f = formRef.current
    if (!f || reduced) return
    f.classList.remove("is-shake")
    void f.offsetWidth
    f.classList.add("is-shake")
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === "loading" || status === "success") return
    const value = email.trim()
    if (!isEmail(value)) {
      setStatus("error")
      setNote(invalidMessage)
      shake()
      inputRef.current?.focus()
      return
    }
    setStatus("loading")
    setNote("")
    try {
      const result = onSubscribe
        ? await onSubscribe(value)
        : await new Promise<boolean>((done) => setTimeout(() => done(true), 900))
      if (result === false) throw new Error(errorMessage)
      if (!alive.current) return
      setStatus("success")
      setNote(typeof result === "string" && result ? result : successMessage)
      setBurst((b) => b + 1)
      glissando()
    } catch (err) {
      if (!alive.current) return
      setStatus("error")
      setNote(err instanceof Error && err.message ? err.message : errorMessage)
      shake()
    }
  }

  const reset = () => {
    setStatus("idle")
    setNote("")
    setEmail("")
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  // ---- the ticker -----------------------------------------------------------
  const tkRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const setRef = React.useRef<HTMLDivElement>(null)
  const [period, setPeriod] = React.useState(0)
  const [copies, setCopies] = React.useState(2)
  const tk = React.useRef({ off: 0, vel: 0, hover: false, drag: false, lastX: 0, lastT: 0, moved: 0 })
  const speed = tick ? Math.max(0, tick.speed ?? 60) : 0
  const tickKey = tick ? tick.lead + "|" + tick.items.join("|") : ""

  React.useLayoutEffect(() => {
    const box = tkRef.current
    const set = setRef.current
    if (!box || !set) return
    const measure = () => {
      const p = set.offsetWidth
      setPeriod(p)
      setCopies(copiesFor(box.clientWidth, p))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    ro.observe(set)
    let on = true
    document.fonts?.ready.then(() => on && measure())
    return () => {
      on = false
      ro.disconnect()
    }
  }, [tickKey])

  const paintTicker = React.useCallback(() => {
    const t = trackRef.current
    if (t) t.style.transform = "translate3d(" + (-wrapOffset(tk.current.off, period)).toFixed(2) + "px,0,0)"
  }, [period])

  React.useEffect(() => {
    paintTicker()
    if (!tick || reduced || !visible || !period) return
    const s = tk.current
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!s.drag) {
        s.vel = approach(s.vel, s.hover ? speed * 0.2 : speed, 0.05, dt)
        s.off += s.vel * dt
        paintTicker()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tickKey, reduced, visible, period, speed, paintTicker])

  const tkDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const s = tk.current
    s.drag = true
    s.lastX = e.clientX
    s.lastT = performance.now()
    s.moved = 0
    s.vel = 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
    e.currentTarget.dataset.drag = "true"
  }
  const tkMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = tk.current
    if (!s.drag) return
    const now = performance.now()
    const dx = e.clientX - s.lastX
    const dt = Math.max(0.001, (now - s.lastT) / 1000)
    s.off -= dx
    s.moved += Math.abs(dx)
    s.vel = s.vel * 0.6 + clamp(-dx / dt, -3000, 3000) * 0.4
    s.lastX = e.clientX
    s.lastT = now
    paintTicker()
  }
  const tkUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = tk.current
    if (!s.drag) return
    s.drag = false
    // A held pointer that stopped moving shouldn't fling.
    if (performance.now() - s.lastT > 90) s.vel = 0
    e.currentTarget.dataset.drag = "false"
  }

  // ---- the chat card --------------------------------------------------------
  const [open, setOpen] = React.useState(false)
  const chatRef = React.useRef<HTMLDivElement>(null)
  const chatBtn = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setOpen(false)
      chatBtn.current?.focus()
    }
    const onDown = (e: PointerEvent) => {
      if (!chatRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open])

  const follow = (e: React.MouseEvent<HTMLAnchorElement>, label: string, href?: string) => {
    // "#" and missing hrefs never touch the host page's URL hash.
    if (!href || href === "#") e.preventDefault()
    onLinkClick?.(label, href)
  }
  const external = (href?: string) => (href && /^https?:/.test(href) ? { target: "_blank", rel: "noreferrer" } : {})

  const vars = {
    "--bsf-acc": accent,
    "--bsf-acc-rgb": hexToRgb(accent),
    "--bsf-paper": paper,
    "--bsf-ink": ink,
    "--bsf-ink-rgb": hexToRgb(ink, "255, 255, 255"),
    "--bsf-tink": tickerInk,
    "--bsf-sans": fontSans,
    "--bsf-n": String(Math.max(1, columns.length)),
  } as React.CSSProperties

  let d = 0
  const delay = () => ({ "--bsf-d": (d += 60) + "ms" }) as React.CSSProperties
  const busy = status === "loading" || status === "success"
  const noteId = uid + "-note"

  return (
    <footer ref={rootRef} className={"bsf " + className} style={vars} data-in={seen || reduced ? "true" : "false"}>
      <style>{CSS}</style>
      <p className="sr-only">{word}</p>

      <svg
        ref={svgRef}
        className="bsf-word"
        viewBox={vb.x + " " + vb.y + " " + vb.w + " " + vb.h}
        style={{ aspectRatio: vb.w + " / " + vb.h }}
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        onPointerMove={onKeysMove}
        onPointerDown={onKeysMove}
        onPointerLeave={onKeysLeave}
        onPointerUp={(e) => e.pointerType === "touch" && onKeysLeave()}
        onPointerCancel={onKeysLeave}
        onClick={strike}
      >
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={paper} />
        {layout.letters.map((l, i) =>
          l.d ? (
            <g
              key={i + l.ch}
              ref={(el) => {
                keyRefs.current[i] = el
              }}
              transform={"translate(0 " + HIDE + ")"}
            >
              <svg x={l.x} y={0} width={l.w} height={CAP} viewBox={"0 0 " + l.w + " " + CAP} overflow="hidden">
                <path d={l.d} strokeWidth={STROKE} />
              </svg>
            </g>
          ) : null,
        )}
        {/* Starts half a unit above the baseline: two anti-aliased edges on one
            line would leave a paper-coloured seam under the letters. */}
        <rect x={vb.x} y={CAP - 0.5} width={vb.w} height={FOOT + 1.5} fill={accent} />
      </svg>

      <div className="bsf-body">
        <form
          ref={formRef}
          className="bsf-form"
          data-status={status}
          onSubmit={submit}
          noValidate
          onAnimationEnd={(e) => e.target === e.currentTarget && e.currentTarget.classList.remove("is-shake")}
        >
          <label className="sr-only" htmlFor={uid + "-email"}>
            Email address
          </label>
          {status === "success" ? (
            <p className="bsf-done">
              <Check />
              <span>{email.trim()}</span>
            </p>
          ) : (
            <input
              ref={inputRef}
              id={uid + "-email"}
              className="bsf-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              placeholder={placeholder}
              value={email}
              readOnly={status === "loading"}
              aria-invalid={status === "error" || undefined}
              aria-describedby={noteId}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === "error") {
                  setStatus("idle")
                  setNote("")
                }
              }}
            />
          )}
          <button type="submit" className="bsf-btn" aria-disabled={busy || undefined}>
            {status === "loading" ? (
              <span className="bsf-dots" aria-label="Subscribing">
                <i />
                <i />
                <i />
              </span>
            ) : status === "success" ? (
              <>
                <Check />
                <span>Done</span>
              </>
            ) : (
              buttonLabel
            )}
            {burst > 0 && (
              <span key={burst} className="bsf-burst" aria-hidden="true">
                {BURST.map((b, i) => (
                  <i
                    key={i}
                    data-round={b.round || undefined}
                    style={{ "--a": b.a + "deg", "--r": b.r + "px", animationDelay: (i % 4) * 25 + "ms" } as React.CSSProperties}
                  />
                ))}
              </span>
            )}
          </button>
        </form>

        <p id={noteId} className="bsf-note" role="status" aria-live="polite" data-tone={status}>
          {status === "idle" || status === "loading" ? tagline : note}
          {status === "success" && (
            <button type="button" onClick={reset}>
              Use another email
            </button>
          )}
        </p>

        {socials.length > 0 && (
          <ul className="bsf-socials">
            {socials.map((s, i) => (
              <li key={s.label + i} className="bsf-fade" style={delay()}>
                <a
                  className="bsf-soc"
                  href={s.href || "#"}
                  aria-label={s.label}
                  onClick={(e) => follow(e, s.label, s.href)}
                  {...external(s.href)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {isIconName(s.icon) ? ICONS[s.icon] : s.icon}
                  </svg>
                  <span className="bsf-tip" aria-hidden="true">
                    {s.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        {columns.length > 0 && (
          <div className="bsf-cols">
            {columns.map((col, ci) => (
              <nav key={col.title + ci} className="bsf-col" aria-label={col.title}>
                <p className="bsf-h" style={delay()}>
                  {col.title}
                </p>
                <ul className="bsf-links">
                  {col.links.map((l, li) => (
                    <li key={l.label + li} className="bsf-fade" style={delay()}>
                      <a
                        className="bsf-link"
                        href={l.href || "#"}
                        onClick={(e) => follow(e, l.label, l.href)}
                        {...external(l.href)}
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        )}
      </div>

      {(tick || card) && (
        <div className="bsf-tail">
          {tick && (
            <div
              ref={tkRef}
              className="bsf-tk"
              data-drag="false"
              onPointerEnter={() => (tk.current.hover = true)}
              onPointerLeave={() => (tk.current.hover = false)}
              onPointerDown={tkDown}
              onPointerMove={tkMove}
              onPointerUp={tkUp}
              onPointerCancel={tkUp}
            >
              <p className="sr-only">{tick.items.map((t) => tick.lead + " " + t).join(". ")}</p>
              <div ref={trackRef} className="bsf-tk-track" aria-hidden="true">
                {Array.from({ length: copies }, (_, c) => (
                  <div key={c} ref={c === 0 ? setRef : undefined} className="bsf-tk-set">
                    {tick.items.map((t, i) => (
                      <span key={i} className="bsf-tk-item">
                        <b>{tick.lead}</b> {t}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {card && (
            <div ref={chatRef} className="bsf-chat">
              {open && (
                <div id={uid + "-chat"} className="bsf-pop" role="dialog" aria-label={card.title}>
                  <div className="bsf-pop-head">
                    <span className="bsf-ava" aria-hidden="true">
                      {Array.from(brand)[0]?.toUpperCase()}
                    </span>
                    <div>
                      <p className="bsf-pop-t">{card.title}</p>
                      {card.status && (
                        <p className="bsf-pop-s">
                          <i aria-hidden="true" />
                          {card.status}
                        </p>
                      )}
                    </div>
                  </div>
                  {card.message && <p className="bsf-pop-m">{card.message}</p>}
                  {card.actionLabel && (
                    <a
                      className="bsf-pop-a"
                      href={card.href || "#"}
                      onClick={(e) => follow(e, card.actionLabel!, card.href)}
                      {...external(card.href)}
                    >
                      {card.actionLabel}
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  )}
                  <button type="button" className="bsf-pop-x" aria-label="Close" onClick={() => setOpen(false)}>
                    <Cross />
                  </button>
                </div>
              )}
              <button
                ref={chatBtn}
                type="button"
                className="bsf-chat-btn"
                aria-label={open ? "Close chat" : "Chat with us"}
                aria-expanded={open}
                aria-controls={open ? uid + "-chat" : undefined}
                onClick={() => setOpen((o) => !o)}
              >
                <svg className="bsf-bub" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6.5 4h11A3.5 3.5 0 0 1 21 7.5v6a3.5 3.5 0 0 1-3.5 3.5H12l-4.6 3.6c-.4.3-.9 0-.9-.4V17A3.5 3.5 0 0 1 3 13.5v-6A3.5 3.5 0 0 1 6.5 4Z"
                    fill="currentColor"
                  />
                </svg>
                <Cross className="bsf-x" />
              </button>
            </div>
          )}
        </div>
      )}
    </footer>
  )
}
