"use client"

import * as React from "react"

/**
 * Pushpin Tear Footer — an electric-blue poster sheet pinned over plain paper.
 * When the footer scrolls in, the poster's interface assembles, a glossy
 * pushpin drops and stabs the sheet, and the bottom of the poster rips away
 * from the pin outwards: a jagged ridge with a white fibre rim, curled flaps
 * that cast shadows, and the brand printed on the paper underneath.
 *
 * Everything is a real footer control: socials, copy link, back to top, a
 * calm-motion switch, a newsletter switch that morphs the contact picker into
 * an email field, a contact picker that drives the handle in the corner, a
 * progress stat, utility links, app links and a colourway swatch pair that
 * swaps the sheet and the paper. Click the pin and it pulls out, the tear
 * re-rips along a new edge, and it stabs back in.
 *
 * No dependencies and nothing fetched: the tear, flaps, grain and pin are
 * SVG and canvas built from numbers.
 */

// #region tear
export type Flap = { at: number; span: number; len: number; skew: number; dir: number; jag: number[] }
export type Tear = { ys: number[]; rim: number[]; lag: number[]; flaps: Flap[] }

export const RIDGE_N = 84
/** Off-screen start: the ridge begins below the bottom edge, so the sheet is whole. */
export const START = 1.06
export const FLAPS = 6

const clamp01 = (v: number) => (Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0)

/** mulberry32 — small, seedable, the same tear for the same seed everywhere. */
export function rng(seed: number) {
  let a = (Number.isFinite(seed) ? Math.floor(seed) : 0) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ridge x positions, shared by every seed so one tear can morph into another. */
export const XS: number[] = (() => {
  const r = rng(911)
  const out: number[] = []
  for (let i = 0; i < RIDGE_N; i++) {
    const u = i / (RIDGE_N - 1)
    const j = i > 0 && i < RIDGE_N - 1 ? (r() - 0.5) * (0.8 / RIDGE_N) : 0
    out.push(-0.02 + u * 1.04 + j)
  }
  return out
})()

/** The lowest the ridge may climb at x, so it never crosses the poster's content. */
export function ridgeFloor(x: number) {
  const d = Math.abs(x - 0.5)
  if (d < 0.13) return 0.39
  if (d < 0.25) return 0.43
  return 0.5
}

export function makeTear(seed: number, n = RIDGE_N): Tear {
  const r = rng(seed)
  const ph = [r() * 6.283, r() * 6.283, r() * 6.283]
  const ys: number[] = []
  const rim: number[] = []
  const lag: number[] = []
  for (let i = 0; i < n; i++) {
    const x = XS[Math.min(i, XS.length - 1)]
    const d = Math.min(1, Math.abs(x - 0.5) * 2)
    // a mountain: lowest under the pin, falling away to both edges
    const base = 0.43 + 0.3 * Math.pow(d, 1.35)
    const wander = (0.022 * Math.sin(x * 7 + ph[0]) + 0.016 * Math.sin(x * 13 + ph[1]) + 0.01 * Math.sin(x * 29 + ph[2])) * (0.45 + 0.55 * d)
    const spike = r() < 0.16 ? 2.3 : 1
    const jag = (r() - 0.5) * 0.022 * spike
    ys.push(Math.min(0.8, Math.max(ridgeFloor(x), base + wander + jag)))
    rim.push(1.2 + r() * 3.6)
    // rips from the pin outwards
    lag.push(Math.min(0.48, d * 0.4 + 0.04 + 0.03 * Math.sin(x * 23 + ph[1]) + r() * 0.012))
  }
  // Six flaps: the outer two big curls, two mid, two small ones curling back over the sheet.
  const slots = [0.05, 0.19, 0.33, 0.67, 0.81, 0.95]
  const up = r() < 0.5 ? [2, 4] : [1, 3]
  const flaps: Flap[] = slots.map((slot, k) => {
    const x = slot + (r() - 0.5) * 0.05
    const span = 3 + Math.floor(r() * 5)
    const at = Math.max(0, Math.min(n - 1 - span, Math.round(x * (n - 1))))
    const dir = up.includes(k) ? -1 : 1
    const outer = k === 0 || k === slots.length - 1
    const len = dir < 0 ? 0.022 + r() * 0.022 : outer ? 0.085 + r() * 0.04 : 0.045 + r() * 0.05
    return { at, span, len, skew: (r() - 0.5) * 1.1, dir, jag: [r() - 0.5, r() - 0.5, r() - 0.5, r() - 0.5] }
  })
  return { ys, rim, lag, flaps }
}

/** Ease out with a small overshoot: the paper rips a hair too far and settles. */
export function easeTear(t: number) {
  const x = clamp01(t)
  if (x === 0 || x === 1) return x
  const c1 = 0.9
  return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

const easeInOut = (t: number) => {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/** The ridge during the opening rip, `t` in 0..1. */
export function introYs(tear: Tear, t: number) {
  return tear.ys.map((y, i) => START + (y - START) * easeTear((t - tear.lag[i]) / 0.5))
}

/** The ridge while one tear re-rips into the next, `t` in 0..1. */
export function morphYs(from: number[], to: Tear, t: number) {
  return to.ys.map((y, i) => {
    const a = from[i] ?? y
    return a + (y - a) * easeInOut((t - to.lag[i] * 0.6) / 0.6)
  })
}

/** How far a flap has unfolded during the opening rip. */
export function flapOpen(tear: Tear, f: Flap, t: number) {
  return easeTear((t - tear.lag[f.at] - 0.18) / 0.32)
}

/** A flap: the ridge segment it hangs from, then two jagged free edges meeting at its tip. */
export function flapPoly(ys: number[], f: Flap, W: number, H: number, open: number) {
  const b = Math.min(ys.length - 1, f.at + f.span)
  const top: number[][] = []
  for (let k = f.at; k <= b; k++) top.push([XS[k] * W, ys[k] * H])
  const A = top[0]
  const B = top[top.length - 1]
  const mx = (A[0] + B[0]) / 2
  const my = (A[1] + B[1]) / 2
  const L = f.len * H * Math.max(0, open)
  const tip = [mx + f.skew * L, my + f.dir * L]
  const side = (P: number[], Q: number[], j0: number, j1: number) => {
    const dx = Q[0] - P[0]
    const dy = Q[1] - P[1]
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    return [
      [P[0] + dx / 3 + nx * j0 * 0.22 * L, P[1] + dy / 3 + ny * j0 * 0.22 * L],
      [P[0] + (dx * 2) / 3 + nx * j1 * 0.22 * L, P[1] + (dy * 2) / 3 + ny * j1 * 0.22 * L],
    ]
  }
  return [...top, ...side(B, tip, f.jag[0], f.jag[1]), tip, ...side(tip, A, f.jag[2], f.jag[3])]
}

const n1 = (v: number) => Math.round(v * 10) / 10

export function polyD(pts: number[][]) {
  return pts.length ? "M" + pts.map((p) => n1(p[0]) + " " + n1(p[1])).join("L") + "Z" : ""
}

/** The sheet: everything above the ridge, lifted by `off` pixels per point (the fibre rim). */
export function sheetD(ys: number[], W: number, H: number, off?: number[]) {
  let d = "M-20 -20L" + (W + 20) + " -20"
  for (let i = ys.length - 1; i >= 0; i--) d += "L" + n1(XS[i] * W) + " " + n1(ys[i] * H - (off ? off[i] : 0))
  return d + "Z"
}

/** Mix two #rrggbb colours. */
export function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => {
    const s = h.replace("#", "")
    const f = s.length === 3 ? s.split("").map((c) => c + c).join("") : s.padEnd(6, "0").slice(0, 6)
    return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0)
  }
  const x = p(a)
  const y = p(b)
  const k = clamp01(t)
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join("")
}

/** "50,5%" → { pre: "", n: 50.5, dec: ",", decimals: 1, group: "", post: "%" }. */
export function parseStat(v: string) {
  const m = /^(\D*?)(\d(?:[\d.,\s]*\d)?)(\D*)$/.exec(String(v).trim())
  if (!m) return null
  const [, pre, num, post] = m
  const last = Math.max(num.lastIndexOf("."), num.lastIndexOf(","))
  const tail = last > -1 ? num.length - last - 1 : 0
  let dec = ""
  let frac = ""
  let int = num
  if (last > -1 && tail >= 1 && tail <= 2) {
    dec = num[last]
    frac = num.slice(last + 1)
    int = num.slice(0, last)
  }
  const group = /[.,\s]/.exec(int)?.[0] ?? ""
  const n = parseFloat(int.replace(/\D/g, "") + (frac ? "." + frac : ""))
  return { pre, post, n, dec, decimals: frac.length, group }
}

/** The stat part-way through counting up, in its own format. */
export function formatStat(v: string, p: number) {
  const s = parseStat(v)
  if (!s || clamp01(p) >= 1) return v
  const [i, f] = (s.n * clamp01(p)).toFixed(s.decimals).split(".")
  const int = s.group ? i.replace(/\B(?=(\d{3})+(?!\d))/g, s.group) : i
  return s.pre + int + (f ? s.dec + f : "") + s.post
}
// #endregion

export type IconName =
  | "chat" | "plane" | "at" | "f" | "x" | "ig" | "link" | "shield" | "apple" | "android" | "globe" | "mail" | "dribbble"

export type TearLink = { label: string; href?: string }
export type IconLink = { icon: IconName; label: string; href?: string }
export type Contact = { name: string; role?: string; handle: string; href?: string }

export type PushpinTearFooterProps = {
  /** The wordmark printed on the paper. */
  brand?: string
  /** The small gradient word above it. */
  eyebrow?: string
  /** Replaces the loop mark at the top. */
  logo?: React.ReactNode
  logoHref?: string
  socials?: IconLink[]
  /** Labels over the calm-motion and newsletter switches. */
  switchLabels?: [string, string]
  /** The two small marks flanking the switches. */
  edition?: [string, string]
  contacts?: Contact[]
  progress?: { label: string; value: string; href?: string }
  utility?: { label: string; links: IconLink[]; word: TearLink }
  sideLinks?: [IconLink, IconLink]
  chat?: TearLink
  apps?: IconLink[]
  legal?: TearLink[]
  sheet?: string
  paper?: string
  sheetInk?: string
  paperInk?: string
  /** Starts with the colours swapped: a paper sheet over a blue ground. */
  defaultInverted?: boolean
  seed?: number
  height?: number | string
  fontSans?: string
  onSubscribe?: (email: string) => void
  onRepin?: (seed: number) => void
  onContactChange?: (index: number) => void
  onColorwayChange?: (inverted: boolean) => void
  className?: string
}

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const

function Icon({ name }: { name: IconName | "chevL" | "chevR" | "copy" | "expand" | "spark" | "squiggle" | "arrow" | "check" }) {
  const svg = (children: React.ReactNode, filled?: boolean) => (
    <svg viewBox="0 0 24 24" className="tpf-ico" aria-hidden="true" {...(filled ? { fill: "currentColor" } : P)}>
      {children}
    </svg>
  )
  switch (name) {
    case "chevL": return svg(<path d="M14.5 5.5 8 12l6.5 6.5" />)
    case "chevR": return svg(<path d="M9.5 5.5 16 12l-6.5 6.5" />)
    case "arrow": return svg(<path d="M5 12h13M13 6.5 18.5 12 13 17.5" />)
    case "check": return svg(<path d="m5.5 12.5 4 4 9-9.5" />)
    case "copy": return svg(<><path d="M13.5 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h10a2.5 2.5 0 0 0 2.5-2.5v-6.5" /><circle cx="18.5" cy="5.5" r="2.3" /></>)
    case "expand": return svg(<path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15M4.5 4.5l5 5M19.5 4.5l-5 5M19.5 19.5l-5-5M4.5 19.5l5-5" />)
    case "spark": return svg(<><path d="M10 10.5 19 14l-4 1.5L13.5 19.5z" /><path d="M8 3.5v2.5M3.5 8H6M4.6 4.6l1.8 1.8M11.4 4.6 9.6 6.4" /></>)
    case "squiggle": return svg(<path d="M3.5 15c1.8-3.2 3.6-3.2 5.4 0s3.6 3.2 5.4 0 3.6-3.2 5.4 0" />)
    case "chat":
      return svg(<path fillRule="evenodd" d="M12 3C7 3 3.2 6.6 3.2 11.2c0 2.5 1.1 4.6 2.9 6.1v3.4l3.2-1.8c.8.2 1.8.4 2.7.4 5 0 8.8-3.6 8.8-8.1S17 3 12 3zm-4 9.4a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z" />, true)
    case "plane":
      return svg(<path fillRule="evenodd" d="M12 2.8a9.2 9.2 0 1 0 0 18.4 9.2 9.2 0 0 0 0-18.4zm4.6 5.6-1.6 7.7c-.1.6-.5.7-1 .4l-2.6-1.9-1.3 1.2c-.1.1-.3.3-.6.3l.2-2.7 4.9-4.4c.2-.2 0-.3-.3-.1L8.2 12.6l-2.6-.8c-.6-.2-.6-.6.1-.8l10.1-3.9c.5-.2.9.1.8 1.3z" />, true)
    case "at": return svg(<><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="3" /><path d="M15 12v1.2a1.8 1.8 0 0 0 3.6 0V12A6.6 6.6 0 1 0 15.8 17" /></>)
    case "f": return svg(<path fillRule="evenodd" d="M7.5 3.5h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-2.6v-6.4h2.2l.4-2.6h-2.6v-1.6c0-.8.3-1.3 1.4-1.3h1.3V6.3a15 15 0 0 0-2-.2c-2 0-3.3 1.2-3.3 3.4v2h-2.2v2.6h2.2v6.4H7.5a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z" />, true)
    case "x": return svg(<path d="M5 4.5h3.6l10.4 15H15.4zM18.6 4.5 13.4 10.4M5.4 19.5l5.4-6.2" />)
    case "ig": return svg(<><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17.1" cy="6.9" r=".6" fill="currentColor" /></>)
    case "dribbble": return svg(<><circle cx="12" cy="12" r="8.5" /><path d="M5.2 7c4.5 2 9.8 2 13 .7M3.6 13c5-1.6 10.4-.4 14 4.6M9 3.9c3 3.6 5.2 9.3 5.7 15.6" /></>)
    case "globe": return svg(<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5z" /></>)
    case "mail": return svg(<><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 6 7.5-6" /></>)
    case "link": return svg(<path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />)
    case "shield":
      return svg(<path fillRule="evenodd" d="M6.5 2.5h11a4 4 0 0 1 4 4v11a4 4 0 0 1-4 4h-11a4 4 0 0 1-4-4v-11a4 4 0 0 1 4-4zM12 6.2 7.6 7.8v3.6c0 2.9 1.9 5.2 4.4 6.2 2.5-1 4.4-3.3 4.4-6.2V7.8zm-2 5.8 1.4 1.4 2.8-2.9" />, true)
    case "apple":
      return svg(<path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.3 2.9 2.3 1.2-.1 1.6-.8 3-.8s1.8.8 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.7zM14.1 5.9c.6-.8 1.1-1.8 1-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.7-1.3z" />, true)
    case "android":
      return svg(<path fillRule="evenodd" d="M6.4 9.2a5.6 5.6 0 0 1 11.2 0zm2.9-4.6L8.2 2.8m6.5 1.8 1.1-1.8M9.6 6.6a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6zm4.8 0a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6zM6.4 10.2h11.2v7.1c0 .8-.6 1.4-1.4 1.4h-.8v2.4a1.1 1.1 0 0 1-2.2 0v-2.4h-2.4v2.4a1.1 1.1 0 0 1-2.2 0v-2.4h-.8c-.8 0-1.4-.6-1.4-1.4zm-2.9.2a1.1 1.1 0 0 1 2.2 0v4.9a1.1 1.1 0 0 1-2.2 0zm14.8 0a1.1 1.1 0 0 1 2.2 0v4.9a1.1 1.1 0 0 1-2.2 0z" />, true)
  }
}

/** Twelve-bump verified seal with a check cut through it. */
function Seal() {
  let d = ""
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 ? 8.6 : 10
    d += (i ? "L" : "M") + (12 + Math.cos(a) * r).toFixed(2) + " " + (12 + Math.sin(a) * r).toFixed(2)
  }
  return (
    <svg viewBox="0 0 24 24" className="tpf-seal" aria-hidden="true">
      <path d={d + "Z"} fill="currentColor" strokeLinejoin="round" stroke="currentColor" strokeWidth="2.2" />
      <path d="m8.3 12.2 2.5 2.5 5-5.2" fill="none" stroke="var(--tpf-sheet)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LoopMark() {
  return (
    <svg viewBox="0 0 40 24" className="tpf-mark" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
      <path d="M20 12c-3.2-4.6-5.6-7-8.6-7C8 5 5.5 8.2 5.5 12.3S8 19 11 19c3.4 0 5.6-3.4 9-7.6S25.6 5 29 5c3 0 5.5 2.9 5.5 7S32 19 28.6 19c-3 0-5.4-2.4-8.6-7z" />
    </svg>
  )
}

/** The pushpin: glossy domed cap, waisted neck, flange, steel needle. Shaded from `base`. */
function Pin({ base, id }: { base: string; id: string }) {
  const hi = mixHex(base, "#ffffff", 0.62)
  const mid = base
  const lo = mixHex(base, "#000000", 0.42)
  const deep = mixHex(base, "#000000", 0.66)
  const t = { transition: "stop-color .7s ease" }
  const side = (gid: string) => (
    <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" style={{ ...t, stopColor: lo }} />
      <stop offset=".24" style={{ ...t, stopColor: mid }} />
      <stop offset=".4" style={{ ...t, stopColor: hi }} />
      <stop offset=".58" style={{ ...t, stopColor: mid }} />
      <stop offset="1" style={{ ...t, stopColor: deep }} />
    </linearGradient>
  )
  return (
    <svg viewBox="0 0 100 200" className="tpf-pin-svg" aria-hidden="true">
      <defs>
        {side(id + "s")}
        <radialGradient id={id + "t"} cx=".38" cy=".3" r=".8">
          <stop offset="0" style={{ ...t, stopColor: hi }} />
          <stop offset=".55" style={{ ...t, stopColor: mid }} />
          <stop offset="1" style={{ ...t, stopColor: lo }} />
        </radialGradient>
        <linearGradient id={id + "n"} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5b616b" />
          <stop offset=".4" stopColor="#f4f5f7" />
          <stop offset=".7" stopColor="#a3a9b2" />
          <stop offset="1" stopColor="#4a4f57" />
        </linearGradient>
        <filter id={id + "b"} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>
      <path d="M48.3 112h3.4l-.7 76-1 4-1-4z" fill={"url(#" + id + "n)"} />
      <ellipse cx="50" cy="191.5" rx="3.2" ry="1.1" fill="#0b1a33" opacity=".35" />
      <path d="M28 103v6.5a22 7 0 0 0 44 0V103z" fill={"url(#" + id + "s)"} />
      <ellipse cx="50" cy="103" rx="22" ry="7" fill={"url(#" + id + "t)"} />
      <path d="M41.5 38c1.6 16 4.6 26 3 36-1.8 10-13 19-14.6 29h40.2c-1.6-10-12.8-19-14.6-29-1.6-10 1.4-20 3-36z" fill={"url(#" + id + "s)"} />
      <path d="M16 22v14a34 13 0 0 0 68 0V22z" fill={"url(#" + id + "s)"} />
      <ellipse cx="50" cy="22" rx="34" ry="13" fill={"url(#" + id + "t)"} />
      <ellipse cx="50" cy="22" rx="33" ry="12.3" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth=".8" />
      <ellipse cx="37" cy="17.5" rx="12" ry="4" fill="#fff" opacity=".7" filter={"url(#" + id + "b)"} />
      <path d="M22 38c4 4.5 9.5 6.4 15 7" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" strokeLinecap="round" filter={"url(#" + id + "b)"} />
      <path d="M45 50c.8 8 1.6 14 .8 22" stroke="#fff" strokeOpacity=".45" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia === "undefined") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => setReduced(mq.matches)
    onMq()
    mq.addEventListener("change", onMq)
    return () => mq.removeEventListener("change", onMq)
  }, [])
  return reduced
}

const CSS =
  ".tpf{position:relative;overflow:hidden;container-type:size;min-height:620px;background:var(--tpf-sheet);color:var(--tpf-on-sheet);font-family:var(--tpf-sans);isolation:isolate;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;transition:background-color .7s ease;--ease:cubic-bezier(.22,1,.36,1);--fs:max(11px,1.85cqmin)}" +
  ".tpf *,.tpf *::before,.tpf *::after{box-sizing:border-box}" +
  ":where(.tpf) a{color:inherit;text-decoration:none}" +
  ":where(.tpf) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}" +
  ":where(.tpf) input{font:inherit;color:inherit;background:none;border:0;margin:0;outline:none}" +
  ":where(.tpf) :focus-visible{outline:1.5px solid currentColor;outline-offset:4px;border-radius:4px}" +
  ".tpf .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
  ".tpf-stage{position:absolute;left:0;top:0;max-width:none;display:block;pointer-events:none;z-index:0}" +
  ".tpf.is-hit .tpf-sheet-g{animation:tpf-hit .32s cubic-bezier(.3,.7,.4,1)}" +
  ".tpf-sheet{fill:var(--tpf-sheet);transition:fill .7s ease}" +
  ".tpf-paper{fill:var(--tpf-paper);transition:fill .7s ease .06s}" +
  ".tpf-rim{fill:var(--tpf-rim)}" +
  ".tpf-ico{width:1.35em;height:1.35em;display:block;max-width:none;flex:none}" +
  ".tpf-mark{width:3.4em;height:2em;display:block;max-width:none}" +
  ".tpf-seal{width:100%;height:100%;display:block;max-width:none}" +
  ".tpf-s,.tpf-p-ink{color:var(--tpf-on-sheet);transition:color .6s ease}" +
  ".tpf-p-ink{color:var(--tpf-on-paper)}" +
  ".tpf-z{position:absolute;z-index:2}" +
  // assembly: the poster interface, then the paper
  ".tpf-h{transition:opacity .7s var(--ease),translate .8s var(--ease),filter .7s var(--ease);transition-delay:calc(var(--i,0)*45ms)}" +
  ".tpf:not(.s1) .tpf-h{opacity:0;translate:0 10px;filter:blur(6px)}" +
  ".tpf-p{transition:opacity .8s var(--ease),translate .9s var(--ease),filter .8s var(--ease);transition-delay:calc(480ms + var(--i,0)*70ms)}" +
  ".tpf:not(.s3) .tpf-p{opacity:0;translate:0 18px;filter:blur(8px);transition-delay:0s}" +
  // top bar
  ".tpf-top{left:0;right:0;top:10.8%;transform:translateY(-50%);display:flex;align-items:center;justify-content:space-between;padding:0 11%;font-size:max(15px,2.6cqmin)}" +
  ".tpf-row{display:flex;align-items:center;gap:.55em}" +
  ".tpf-ib{display:grid;place-items:center;width:1.9em;height:1.9em;margin:-.3em;border-radius:50%;transition:transform .35s var(--ease),background-color .25s}" +
  ".tpf-ib:hover{transform:translateY(-2px);background:color-mix(in srgb,currentColor 14%,transparent)}" +
  ".tpf-ib:active{transform:scale(.9)}" +
  ".tpf-up .tpf-ico{transform:rotate(90deg)}" +
  ".tpf-logo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:grid;place-items:center;font-size:max(15px,2.6cqmin)}" +
  ".tpf-logo .tpf-mark path{stroke-dasharray:120;stroke-dashoffset:0;transition:stroke-dashoffset 1.4s var(--ease)}" +
  ".tpf:not(.s1) .tpf-logo .tpf-mark path{stroke-dashoffset:120}" +
  ".tpf-logo:hover .tpf-mark{animation:tpf-loop 1.1s var(--ease)}" +
  ".tpf-toast{position:absolute;top:calc(100% + .6em);right:0;font-size:max(11px,1.6cqmin);letter-spacing:.04em;white-space:nowrap;padding:.35em .8em;border-radius:99px;background:var(--tpf-on-sheet);color:var(--tpf-sheet);opacity:0;transform:translateY(-4px);transition:opacity .25s,transform .35s var(--ease);pointer-events:none}" +
  ".tpf-toast.on{opacity:1;transform:none}" +
  // switches
  ".tpf-sw{left:50%;top:15.6%;transform:translateX(-50%);display:grid;grid-template-columns:auto auto auto;align-items:center;column-gap:max(14px,3.2cqmin);row-gap:max(10px,2.1cqmin);font-size:var(--fs);text-align:center}" +
  ".tpf-sw-bar{width:1.5px;height:1.4em;background:currentColor;opacity:.9;justify-self:center}" +
  ".tpf-tg{position:relative;width:max(44px,7.4cqmin);height:max(26px,4.3cqmin);border-radius:99px;background:var(--tpf-on-sheet);transition:background-color .6s,transform .3s var(--ease)}" +
  ".tpf-tg:active{transform:scale(.95)}" +
  ".tpf-tg::after{content:'';position:absolute;top:50%;left:12%;width:30%;aspect-ratio:1;border-radius:50%;background:var(--tpf-sheet);transform:translate(0,-50%);transition:left .55s cubic-bezier(.5,1.7,.4,1),width .25s var(--ease),background-color .6s}" +
  ".tpf-tg:hover::after{width:34%}" +
  ".tpf-tg[aria-checked=true]::after{left:58%}" +
  ".tpf-tg[aria-checked=true]:hover::after{left:54%}" +
  ".tpf-ed{top:24%;transform:translate(-50%,-50%);font-size:var(--fs);letter-spacing:.02em;white-space:nowrap;opacity:.95}" +
  // contact picker / newsletter
  ".tpf-pick{left:50%;top:30.6%;transform:translate(-50%,-50%);width:max(240px,38cqmin);height:max(36px,5.6cqmin);font-size:max(14px,2.25cqmin)}" +
  ".tpf-pick>*{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity .45s var(--ease),transform .55s var(--ease),filter .45s var(--ease)}" +
  ".tpf-pick>[data-off=true]{opacity:0;transform:translateY(-8px) scale(.98);filter:blur(5px);pointer-events:none}" +
  ".tpf-names{justify-content:space-between}" +
  ".tpf-name{position:relative;flex:1;height:100%;overflow:hidden;display:grid;place-items:center;letter-spacing:.01em;text-transform:uppercase;white-space:nowrap}" +
  ".tpf-name span{grid-area:1/1;animation:tpf-in .55s var(--ease) both}" +
  ".tpf-name[data-dir='-1'] span{animation-name:tpf-in-l}" +
  ".tpf-name small{position:absolute;bottom:-1.2em;font-size:.6em;opacity:0;transition:opacity .3s}" +
  ".tpf-chev{display:grid;place-items:center;width:2em;height:2em;border-radius:50%;transition:transform .35s var(--ease),background-color .25s}" +
  ".tpf-chev:hover{background:color-mix(in srgb,currentColor 14%,transparent)}" +
  ".tpf-chev.l:hover{transform:translateX(-3px)}.tpf-chev.r:hover{transform:translateX(3px)}" +
  ".tpf-form{gap:.4em;border-bottom:1.5px solid currentColor}" +
  ".tpf-form input{flex:1;min-width:0;height:100%;padding:0 .2em;letter-spacing:.01em}" +
  ".tpf-form input::placeholder{color:currentColor;opacity:.6}" +
  ".tpf-form button{display:grid;place-items:center;width:2em;height:2em;border-radius:50%;transition:transform .35s var(--ease),background-color .25s}" +
  ".tpf-form button:hover{transform:translateX(3px);background:color-mix(in srgb,currentColor 14%,transparent)}" +
  ".tpf-form[data-sent=true] input{opacity:.0}" +
  ".tpf-sent{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:.4em;pointer-events:none;opacity:0;transition:opacity .4s}" +
  ".tpf-form[data-sent=true] .tpf-sent{opacity:1}" +
  ".tpf-badge{left:50%;top:35.4%;transform:translate(-50%,-50%);width:max(15px,2.3cqmin);height:max(15px,2.3cqmin);transition:opacity .4s,transform .5s var(--ease)}" +
  ".tpf-badge[data-off=true]{opacity:0;transform:translate(-50%,-50%) scale(.4)}" +
  ".tpf-badge:hover{transform:translate(-50%,-50%) rotate(30deg)}" +
  // left block: progress
  ".tpf-prog{left:14%;top:30.5%;display:grid;justify-items:start;gap:max(6px,1.1cqmin);font-size:var(--fs)}" +
  ".tpf-prog .tpf-ico{width:1.7em;height:1.7em}" +
  ".tpf-bar{position:relative;width:max(30px,4.8cqmin);height:max(5px,.85cqmin);margin:.5em 0 .7em;background:color-mix(in srgb,currentColor 32%,transparent);overflow:hidden}" +
  ".tpf-bar i{position:absolute;inset:0;background:currentColor;transform-origin:0 50%}" +
  ".tpf-lbl{display:flex;align-items:center;gap:1.6em}" +
  ".tpf-lbl .tpf-ico{width:1.1em;height:1.1em}" +
  ".tpf-big{font-size:max(26px,4.6cqmin);letter-spacing:-.025em;line-height:1;text-decoration:underline;text-decoration-thickness:max(1.5px,.04em);text-underline-offset:.12em;font-variant-numeric:tabular-nums;transition:text-underline-offset .35s var(--ease)}" +
  ".tpf a.tpf-big:hover{text-underline-offset:.2em}" +
  // right block: utilities
  ".tpf-util{right:14%;top:32%;display:grid;justify-items:end;gap:max(10px,1.9cqmin);font-size:var(--fs)}" +
  ".tpf-util .tpf-row{gap:max(10px,1.9cqmin)}" +
  ".tpf-util .tpf-ico{width:1.55em;height:1.55em}" +
  ".tpf-tile{display:grid;place-items:center;transition:transform .35s var(--ease)}" +
  ".tpf-tile:hover{transform:translateY(-2px) rotate(-6deg)}" +
  // pin
  ".tpf-pin{position:absolute;z-index:3;left:50%;top:64%;width:max(46px,9cqmin);height:max(92px,18cqmin);transform:translate(-50%,-100%);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}" +
  ".tpf-pin:focus-visible{outline-offset:6px}" +
  ".tpf-tilt{position:absolute;inset:0;transform-origin:50% 100%;transform:rotate(calc(5deg + var(--tilt,0deg)));transition:transform .7s var(--ease)}" +
  ".tpf-drop,.tpf-body{position:absolute;inset:0;transform-origin:50% 100%}" +
  ".tpf-body{transition:transform .32s var(--ease)}" +
  ".tpf-pin-svg{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;overflow:visible}" +
  ".tpf-shadow{position:absolute;right:50%;bottom:-.5%;width:150%;height:24%;transform-origin:100% 50%;transform:rotate(16deg);transition:transform .45s var(--ease),opacity .45s}" +
  ".tpf-shadow::before,.tpf-shadow::after{content:'';position:absolute;top:50%;border-radius:50%;transform:translateY(-50%)}" +
  ".tpf-shadow::before{right:0;width:100%;height:24%;background:linear-gradient(90deg,transparent,rgba(9,22,48,.26) 60%,rgba(9,22,48,.42));filter:blur(2px)}" +
  ".tpf-shadow::after{left:-6%;width:60%;height:100%;background:radial-gradient(closest-side,rgba(9,22,48,.22),transparent);filter:blur(3px)}" +
  ".tpf:not(.s2) .tpf-pin{opacity:0;pointer-events:none}" +
  ".tpf.s2 .tpf-drop{animation:tpf-drop .62s cubic-bezier(.5,0,.75,0) both}" +
  ".tpf.s2 .tpf-shadow{animation:tpf-shade .62s cubic-bezier(.5,0,.75,0) both}" +
  ".tpf-pin:hover .tpf-body{transform:translateY(-3%)}" +
  ".tpf-pin:hover .tpf-shadow{transform:rotate(16deg) translateX(-5%) scaleX(1.06)}" +
  ".tpf-pin[data-pin=lift] .tpf-body{transform:translateY(-22%) rotate(-10deg);transition-duration:.3s}" +
  ".tpf-pin[data-pin=lift] .tpf-shadow{transform:rotate(16deg) translateX(-26%) scale(1.25);opacity:.55}" +
  ".tpf-pin[data-pin=stab] .tpf-body{animation:tpf-stab .42s cubic-bezier(.55,0,.8,.2) both}" +
  // paper side
  ".tpf-brand{left:50%;top:67%;transform:translateX(-50%);display:grid;justify-items:stretch;gap:0}" +
  ".tpf-brand-top{display:flex;align-items:center;justify-content:space-between;gap:1em;padding:0 .2em 0 .5em;font-size:max(14px,2.3cqmin)}" +
  ".tpf-eye{font-size:max(15px,2.6cqmin);letter-spacing:-.02em;background:linear-gradient(90deg,var(--tpf-on-paper),color-mix(in srgb,var(--tpf-on-paper) 35%,var(--tpf-paper)));-webkit-background-clip:text;background-clip:text;color:transparent}" +
  ".tpf-bub{display:inline-flex;align-items:center;gap:.5em;height:1.7em;padding:0 .55em;border-radius:99px;background:color-mix(in srgb,var(--tpf-on-paper) 11%,var(--tpf-paper));color:var(--tpf-on-paper);font-size:max(11px,1.6cqmin);overflow:hidden;transition:background-color .3s,padding .45s var(--ease)}" +
  ".tpf-dots{display:flex;gap:.22em}" +
  ".tpf-dots i{width:.38em;height:.38em;border-radius:50%;background:color-mix(in srgb,var(--tpf-on-paper) 45%,var(--tpf-paper));animation:tpf-dot 1.2s ease-in-out infinite}" +
  ".tpf-dots i:nth-child(2){animation-delay:.15s}.tpf-dots i:nth-child(3){animation-delay:.3s}" +
  ".tpf-bub b{font-weight:500;max-width:0;opacity:0;white-space:nowrap;transition:max-width .5s var(--ease),opacity .3s}" +
  ".tpf-bub:hover,.tpf-bub:focus-visible{padding:0 .8em}" +
  ".tpf-bub:hover b,.tpf-bub:focus-visible b{max-width:8em;opacity:1}" +
  ".tpf-word{display:block;overflow:hidden;padding:0 .04em .14em;font-size:max(64px,min(12.4cqmin,20cqw));font-weight:500;letter-spacing:-.055em;line-height:.98;white-space:nowrap}" +
  ".tpf-word span{display:block;position:relative;transition:transform 1s var(--ease) .5s}" +
  ".tpf-word span::after{content:'';position:absolute;left:.02em;right:.04em;bottom:-.02em;height:max(2px,.045em);background:currentColor;transform-origin:0 50%;transition:transform .9s var(--ease) 1.05s,height .3s var(--ease)}" +
  ".tpf:not(.s3) .tpf-word span{transform:translateY(125%);transition-delay:0s}" +
  ".tpf:not(.s3) .tpf-word span::after{transform:scaleX(0);transition-delay:0s}" +
  ".tpf-word:hover span::after{height:max(4px,.075em)}" +
  ".tpf-side{top:76%;display:grid;justify-items:center;gap:max(10px,1.9cqmin);font-size:max(13px,2.1cqmin);transform:translateX(-50%)}" +
  ".tpf-side .tpf-ico{width:1.35em;height:1.35em;transition:transform .35s var(--ease)}" +
  ".tpf-side:hover .tpf-ico{transform:translateY(-2px) rotate(-8deg)}" +
  ".tpf-side span{background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:background-size .4s var(--ease)}" +
  ".tpf-side:hover span{background-size:100% 1px}" +
  ".tpf-swatch{left:50%;top:89.4%;transform:translate(-50%,-50%);display:flex;gap:max(10px,1.7cqmin)}" +
  ".tpf-dot{width:max(28px,4.3cqmin);height:max(28px,4.3cqmin);border-radius:50%;border:1.5px solid color-mix(in srgb,var(--tpf-on-paper) 34%,transparent);transition:transform .45s var(--ease),box-shadow .45s var(--ease),background-color .7s}" +
  ".tpf-dot:hover{transform:scale(1.08)}" +
  ".tpf-dot[aria-checked=true]{box-shadow:0 0 0 3px var(--tpf-paper),0 0 0 4.5px var(--tpf-on-paper)}" +
  ".tpf-foot{left:0;right:0;bottom:4.4%;display:flex;align-items:center;justify-content:space-between;padding:0 15%;font-size:max(12px,1.85cqmin)}" +
  ".tpf-foot .tpf-ico{width:1.5em;height:1.5em}" +
  ".tpf-foot .tpf-row{gap:.9em}" +
  ".tpf-legal{position:absolute;left:50%;transform:translateX(-50%);display:flex;gap:1.4em;font-size:max(10px,1.4cqmin);letter-spacing:.08em;text-transform:uppercase;opacity:.62;white-space:nowrap}" +
  ".tpf-legal a:hover,.tpf-handle:hover{text-decoration:underline;text-underline-offset:.2em}" +
  ".tpf-handle{display:grid}.tpf-handle span{grid-area:1/1;animation:tpf-fade .5s var(--ease) both}" +
  ".tpf-foot a .tpf-ico{transition:transform .35s var(--ease)}.tpf-foot a:hover .tpf-ico{transform:translateY(-2px)}" +
  // narrow: a phone column
  "@container (max-width: 620px){" +
  ".tpf-top{padding:0 7%}.tpf-ed{display:none}" +
  ".tpf-prog{left:7%;top:36%}.tpf-prog>.tpf-ico{display:none}.tpf-util{right:7%;top:36.5%}.tpf-pick{top:27.5%;width:min(78cqw,300px)}.tpf-badge{top:31.8%}" +
  ".tpf-side{top:85.4%}.tpf-side.l{left:16%!important}.tpf-side.r{left:84%!important}" +
  ".tpf-swatch{top:87.5%}" +
  ".tpf-foot{padding:0 7%}.tpf-legal{bottom:2.6em}" +
  "}" +
  "@container (max-width: 400px){.tpf-side span{display:none}.tpf-side{top:87.5%;transform:translate(-50%,-50%)}}" +
  "@keyframes tpf-hit{0%{transform:translateY(0)}30%{transform:translateY(2px)}60%{transform:translateY(-.5px)}100%{transform:translateY(0)}}" +
  "@keyframes tpf-drop{0%{transform:translateY(-62cqh) rotate(-28deg) scale(1.5);opacity:0}25%{opacity:1}80%{transform:translateY(0) rotate(3deg) scale(1)}90%{transform:scale(1.04,.95)}100%{transform:none;opacity:1}}" +
  "@keyframes tpf-shade{0%{transform:rotate(16deg) translateX(-60%) scale(2.4);opacity:0}80%{transform:rotate(16deg);opacity:1}100%{transform:rotate(16deg);opacity:1}}" +
  "@keyframes tpf-stab{0%{transform:translateY(-22%) rotate(-10deg)}70%{transform:translateY(1.5%) rotate(1deg)}100%{transform:none}}" +
  "@keyframes tpf-in{from{opacity:0;transform:translateX(16px);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}" +
  "@keyframes tpf-in-l{from{opacity:0;transform:translateX(-16px);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}" +
  "@keyframes tpf-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}" +
  "@keyframes tpf-dot{0%,60%,100%{transform:translateY(0);opacity:.55}30%{transform:translateY(-2.5px);opacity:1}}" +
  "@keyframes tpf-loop{0%{transform:none}40%{transform:scaleX(-1)}100%{transform:none}}" +
  ".tpf.is-still *,.tpf.is-still *::before,.tpf.is-still *::after{animation:none!important;transition-duration:.01s!important;transition-delay:0s!important}" +
  "@media (prefers-reduced-motion: reduce){.tpf *,.tpf *::before,.tpf *::after{animation:none!important;transition-duration:.01s!important;transition-delay:0s!important}}"

const DEFAULT_SOCIALS: IconLink[] = [
  { icon: "chat", label: "Message us", href: "#" },
  { icon: "plane", label: "Telegram", href: "#" },
]

const DEFAULT_CONTACTS: Contact[] = [
  { name: "O'Brien", role: "New business", handle: "@obrien.adv", href: "mailto:obrien@example.com" },
  { name: "Okafor", role: "Press", handle: "@okafor.adv", href: "mailto:press@example.com" },
  { name: "Lindqvist", role: "Careers", handle: "@lindqvist.adv", href: "mailto:jobs@example.com" },
  { name: "Moreau", role: "Studio", handle: "@moreau.adv", href: "mailto:studio@example.com" },
]

const DEFAULT_APPS: IconLink[] = [
  { icon: "apple", label: "App Store", href: "#" },
  { icon: "android", label: "Google Play", href: "#" },
]

const DEFAULT_LEGAL: TearLink[] = [{ label: "© 2026 adv." }, { label: "Privacy", href: "#" }, { label: "Terms", href: "#" }]

const isHex = (c: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)

function A({ href, className, label, children, style }: { href?: string; className?: string; label?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const onClick = (e: React.MouseEvent) => {
    if (!href || href === "#") e.preventDefault()
  }
  return (
    <a href={href || "#"} className={className} aria-label={label} title={label} onClick={onClick} style={style}>
      {children}
    </a>
  )
}

export default function PushpinTearFooter({
  brand = "adv.",
  eyebrow = "studio",
  logo,
  logoHref = "#",
  socials = DEFAULT_SOCIALS,
  switchLabels = ["àcc", "súb"],
  edition = ["V. 2505", "ED. 5251"],
  contacts = DEFAULT_CONTACTS,
  progress = { label: "version", value: "50,5%", href: "#" },
  utility = {
    label: "ect.",
    links: [
      { icon: "link", label: "Press kit", href: "#" },
      { icon: "shield", label: "Privacy", href: "#" },
    ],
    word: { label: "mod.", href: "#" },
  },
  sideLinks = [
    { icon: "at", label: "web", href: "#" },
    { icon: "f", label: "25,05", href: "#" },
  ],
  chat = { label: "say hi", href: "mailto:hello@example.com" },
  apps = DEFAULT_APPS,
  legal = DEFAULT_LEGAL,
  sheet = "#1a7ff0",
  paper = "#f3f3f1",
  sheetInk = "#ffffff",
  paperInk,
  defaultInverted = false,
  seed = 7,
  height = "100svh",
  fontSans = '"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif',
  onSubscribe,
  onRepin,
  onContactChange,
  onColorwayChange,
  className = "",
}: PushpinTearFooterProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const rootRef = React.useRef<HTMLElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const sheetRef = React.useRef<SVGPathElement>(null)
  const rimRef = React.useRef<SVGPathElement>(null)
  const flapRefs = React.useRef<(SVGPathElement | null)[]>([])
  const gradRefs = React.useRef<(SVGLinearGradientElement | null)[]>([])
  const pinRef = React.useRef<HTMLButtonElement>(null)
  const timers = React.useRef<number[]>([])

  const reduced = useReducedMotion()
  const [calm, setCalm] = React.useState(false)
  const still = reduced || calm
  const [stage, setStage] = React.useState(0)
  const [hit, setHit] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const [pin, setPin] = React.useState<"idle" | "lift" | "stab">("idle")
  const [inverted, setInverted] = React.useState(defaultInverted)
  const [sub, setSub] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [who, setWho] = React.useState({ i: 0, dir: 1 })
  const [count, setCount] = React.useState(0)
  const [toast, setToast] = React.useState("")
  const [canFull, setCanFull] = React.useState(false)
  const [grain, setGrain] = React.useState("")

  const s = React.useRef({
    W: 0,
    H: 0,
    tear: makeTear(seed),
    prev: null as Tear | null,
    from: [] as number[],
    ys: [] as number[],
    mode: "wait" as "wait" | "intro" | "morph" | "rest",
    t0: 0,
    dur: 1,
    raf: 0,
    px: -1e4,
    py: -1e4,
    lift: new Array(FLAPS).fill(0) as number[],
    still: false,
    busy: false,
    seed,
  }).current
  s.still = still

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  // ---- drawing --------------------------------------------------------------
  const frame = React.useCallback((now: number) => {
    s.raf = 0
    const { W, H, tear } = s
    if (!W || !H) return
    let busy = false
    let ys: number[]
    const open = new Array(FLAPS).fill(1)
    const openOld = new Array(FLAPS).fill(0)
    if (s.mode === "wait") {
      ys = tear.ys.map(() => START)
      open.fill(0)
    } else if (s.mode === "intro") {
      const p = (now - s.t0) / s.dur
      ys = introYs(tear, Math.min(1, p))
      tear.flaps.forEach((f, k) => (open[k] = flapOpen(tear, f, Math.min(1, p))))
      if (p >= 1) s.mode = "rest"
      else busy = true
    } else if (s.mode === "morph") {
      const p = (now - s.t0) / s.dur
      ys = morphYs(s.from, tear, Math.min(1, p))
      open.fill(easeTear((p - 0.5) / 0.5))
      openOld.fill(1 - easeInOut(p / 0.35))
      if (p >= 1) s.mode = "rest"
      else busy = true
    } else ys = tear.ys
    s.ys = ys

    // flaps lift towards a nearby pointer
    tear.flaps.forEach((f, k) => {
      const b = Math.min(ys.length - 1, f.at + f.span)
      const mx = ((XS[f.at] + XS[b]) / 2) * W
      const my = ((ys[f.at] + ys[b]) / 2) * H
      const target = s.still ? 0 : clamp01(1 - Math.hypot(s.px - mx, s.py - my) / (0.2 * Math.max(W, 520)))
      s.lift[k] += (target - s.lift[k]) * 0.14
      if (Math.abs(target - s.lift[k]) > 0.003) busy = true
      open[k] *= 1 + 0.32 * s.lift[k]
    })

    sheetRef.current?.setAttribute("d", sheetD(ys, W, H, tear.rim))
    rimRef.current?.setAttribute("d", sheetD(ys, W, H))
    const draw = (k: number, f: Flap | undefined, o: number) => {
      const el = flapRefs.current[k]
      const g = gradRefs.current[k]
      if (!el || !g) return
      if (!f || o < 0.01) return el.setAttribute("d", "")
      const pts = flapPoly(ys, f, W, H, o)
      el.setAttribute("d", polyD(pts))
      const b = Math.min(ys.length - 1, f.at + f.span)
      const mx = ((XS[f.at] + XS[b]) / 2) * W
      const my = ((ys[f.at] + ys[b]) / 2) * H
      const tip = pts[f.span + 3]
      g.setAttribute("x1", String(mx))
      g.setAttribute("y1", String(my))
      g.setAttribute("x2", String(tip[0]))
      g.setAttribute("y2", String(tip[1]))
    }
    for (let k = 0; k < FLAPS; k++) {
      draw(k, tear.flaps[k], open[k])
      draw(FLAPS + k, s.prev?.flaps[k], openOld[k])
    }
    if (busy) s.raf = requestAnimationFrame(frame)
  }, [s])

  const kick = React.useCallback(() => {
    if (!s.raf && typeof requestAnimationFrame !== "undefined") s.raf = requestAnimationFrame(frame)
  }, [s, frame])

  // size
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      s.W = el.clientWidth
      s.H = el.clientHeight
      const svg = svgRef.current
      if (svg) {
        svg.setAttribute("width", String(s.W))
        svg.setAttribute("height", String(s.H))
        svg.setAttribute("viewBox", "0 0 " + s.W + " " + s.H)
      }
      kick()
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [s, kick])

  // visibility
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") return setVisible(true)
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.22 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // grain tile, once
  React.useEffect(() => {
    const c = document.createElement("canvas")
    c.width = c.height = 160
    const g = c.getContext("2d")
    if (!g) return
    const img = g.createImageData(160, 160)
    const r = rng(42)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = r() < 0.5 ? 0 : 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = Math.floor(r() * 46)
    }
    g.putImageData(img, 0, 0)
    setGrain(c.toDataURL())
  }, [])

  // fullscreen support
  React.useEffect(() => {
    setCanFull(typeof document !== "undefined" && !!document.fullscreenEnabled)
  }, [])

  // the opening: interface, pin, rip
  React.useEffect(() => {
    if (!visible || stage > 0) return
    if (still) {
      setStage(3)
      s.mode = "rest"
      kick()
      return
    }
    setStage(1)
    later(() => setStage(2), 640)
    later(() => {
      setHit(true)
      setStage(3)
      s.mode = "intro"
      s.t0 = performance.now()
      s.dur = 1550
      kick()
    }, 1140)
    later(() => setHit(false), 1480)
  }, [visible, stage, still, s, kick])

  // calm switched on mid-way: finish now
  React.useEffect(() => {
    if (!still || stage === 0) return
    setStage(3)
    if (s.mode !== "rest") {
      s.mode = "rest"
      kick()
    }
  }, [still, stage, s, kick])

  React.useEffect(() => () => {
    timers.current.forEach((id) => clearTimeout(id))
  }, [])

  // a new seed from outside re-tears in place
  React.useEffect(() => {
    if (seed === s.seed) return
    s.seed = seed
    s.prev = s.tear
    s.from = s.ys.length ? s.ys : s.tear.ys
    s.tear = makeTear(seed)
    if (s.mode !== "wait") {
      s.mode = still ? "rest" : "morph"
      s.t0 = performance.now()
      s.dur = 1100
    }
    kick()
  }, [seed, still, s, kick])

  // the stat counts up once the paper shows
  React.useEffect(() => {
    if (stage < 3) return
    if (still) return setCount(1)
    let raf = 0
    const t0 = performance.now() + 450
    const tick = (now: number) => {
      const p = clamp01((now - t0) / 1300)
      setCount(1 - Math.pow(1 - p, 3))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stage, still])

  // ---- actions ----------------------------------------------------------------
  const onPointerMove = (e: React.PointerEvent) => {
    const el = rootRef.current
    if (!el || s.still) return
    const r = el.getBoundingClientRect()
    s.px = e.clientX - r.left
    s.py = e.clientY - r.top
    const tilt = Math.max(-9, Math.min(9, ((s.px / r.width) - 0.5) * 18))
    pinRef.current?.style.setProperty("--tilt", tilt.toFixed(2) + "deg")
    kick()
  }
  const onPointerLeave = () => {
    s.px = s.py = -1e4
    pinRef.current?.style.setProperty("--tilt", "0deg")
    kick()
  }

  const repin = () => {
    if (s.busy || stage < 3) return
    const next = s.seed + 1
    const swap = () => {
      s.seed = next
      s.prev = s.tear
      s.from = s.ys.length ? s.ys : s.tear.ys
      s.tear = makeTear(next)
    }
    if (still) {
      swap()
      s.prev = null
      s.mode = "rest"
      kick()
      onRepin?.(next)
      return
    }
    s.busy = true
    setPin("lift")
    later(() => {
      swap()
      s.mode = "morph"
      s.t0 = performance.now()
      s.dur = 1150
      kick()
    }, 300)
    later(() => setPin("stab"), 1280)
    later(() => {
      setPin("idle")
      s.busy = false
      onRepin?.(next)
    }, 1720)
  }

  const flash = (msg: string) => {
    setToast(msg)
    later(() => setToast(""), 1600)
  }
  const copyLink = () => {
    const url = typeof location !== "undefined" ? location.href : ""
    const done = () => flash("link copied")
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, () => flash("copy blocked"))
    else flash("copy blocked")
  }
  const toTop = () => window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" })
  const fullscreen = () => {
    const el = rootRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else el.requestFullscreen?.().catch(() => {})
  }
  const step = (dir: number) => {
    const n = contacts.length
    if (!n) return
    const i = (who.i + dir + n) % n
    setWho({ i, dir })
    onContactChange?.(i)
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return flash("check that email")
    setSent(true)
    onSubscribe?.(v)
  }
  const colorway = (inv: boolean) => {
    if (inv === inverted) return
    setInverted(inv)
    onColorwayChange?.(inv)
  }

  // ---- colours ----------------------------------------------------------------
  const pInk = paperInk ?? sheet
  const c = inverted
    ? { sheet: paper, paper: sheet, onSheet: pInk, onPaper: sheetInk }
    : { sheet, paper, onSheet: sheetInk, onPaper: pInk }
  const pinBase = isHex(c.sheet) ? c.sheet : "#1a7ff0"
  // flaps are the back of the top sheet: always paper, whichever way round
  const flapBase = mixHex(isHex(paper) ? paper : "#f3f3f1", "#ffffff", 0.35)
  const vars = {
    height: typeof height === "number" ? height + "px" : height,
    "--tpf-sheet": c.sheet,
    "--tpf-paper": c.paper,
    "--tpf-on-sheet": c.onSheet,
    "--tpf-on-paper": c.onPaper,
    "--tpf-rim": mixHex(flapBase, "#ffffff", 0.6),
    "--tpf-sans": fontSans,
  } as React.CSSProperties

  const contact = contacts[who.i % Math.max(1, contacts.length)]
  const stat = progress ? parseStat(progress.value) : null
  const barFill = stat && /%/.test(stat.post) ? clamp01(stat.n / 100) : 1
  const H = (i: number) => ({ "--i": i }) as React.CSSProperties

  const cls = ["tpf", stage >= 1 && "s1", stage >= 2 && "s2", stage >= 3 && "s3", hit && "is-hit", still && "is-still", className]
    .filter(Boolean)
    .join(" ")

  return (
    <footer ref={rootRef} className={cls} style={vars} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <style>{CSS}</style>

      <svg ref={svgRef} className="tpf-stage" aria-hidden="true">
        <defs>
          <radialGradient id={uid + "v"} cx=".5" cy=".78" r=".75">
            <stop offset=".45" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#0d1c38" stopOpacity=".07" />
          </radialGradient>
          <linearGradient id={uid + "l"} x1="0" y1="0" x2=".35" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".13" />
            <stop offset=".55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#001033" stopOpacity=".12" />
          </linearGradient>
          {grain && (
            <pattern id={uid + "g"} width="160" height="160" patternUnits="userSpaceOnUse">
              <image href={grain} width="160" height="160" />
            </pattern>
          )}
          <filter id={uid + "d"} x="-5%" y="-5%" width="110%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0a1a3a" floodOpacity=".3" />
          </filter>
          <filter id={uid + "f"} x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="-2" dy="4" stdDeviation="4" floodColor="#0a1a3a" floodOpacity=".26" />
          </filter>
          {Array.from({ length: FLAPS * 2 }, (_, k) => (
            <linearGradient key={k} id={uid + "fg" + k} ref={(el) => { gradRefs.current[k] = el }} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={mixHex(flapBase, "#1c2a44", 0.34)} />
              <stop offset=".5" stopColor={mixHex(flapBase, "#1c2a44", 0.08)} />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          ))}
          <path id={uid + "s"} ref={sheetRef} />
        </defs>
        <rect className="tpf-paper" width="100%" height="100%" />
        <rect width="100%" height="100%" fill={"url(#" + uid + "v)"} style={{ mixBlendMode: "multiply" }} />
        {grain && <rect width="100%" height="100%" fill={"url(#" + uid + "g)"} opacity=".32" />}
        <g className="tpf-sheet-g" filter={"url(#" + uid + "d)"}>
          <path ref={rimRef} className="tpf-rim" />
          <use href={"#" + uid + "s"} className="tpf-sheet" />
        </g>
        <use href={"#" + uid + "s"} fill={"url(#" + uid + "l)"} />
        {grain && <use href={"#" + uid + "s"} fill={"url(#" + uid + "g)"} opacity=".5" />}
        <g filter={"url(#" + uid + "f)"}>
          {Array.from({ length: FLAPS * 2 }, (_, k) => (
            <path key={k} ref={(el) => { flapRefs.current[k] = el }} fill={"url(#" + uid + "fg" + k + ")"} />
          ))}
        </g>
      </svg>

      {/* ---- the poster interface ---- */}
      <div className="tpf-z tpf-top tpf-s">
        <div className="tpf-row tpf-h" style={H(0)}>
          <button type="button" className="tpf-ib tpf-up" onClick={toTop} aria-label="Back to top" title="Back to top">
            <Icon name="chevL" />
          </button>
          <span style={{ width: ".6em" }} />
          {socials.map((l, i) => (
            <A key={i} href={l.href} className="tpf-ib" label={l.label}>
              <Icon name={l.icon} />
            </A>
          ))}
        </div>
        <A href={logoHref} className="tpf-logo tpf-h" label={brand + " home"} style={H(1)}>
          {logo ?? <LoopMark />}
        </A>
        <div className="tpf-row tpf-h" style={{ ...H(2), position: "relative", gap: ".9em" }}>
          <button type="button" className="tpf-ib" onClick={copyLink} aria-label="Copy link" title="Copy link">
            <Icon name="copy" />
          </button>
          {canFull && (
            <button type="button" className="tpf-ib" onClick={fullscreen} aria-label="Full screen" title="Full screen">
              <Icon name="expand" />
            </button>
          )}
          <span className={"tpf-toast" + (toast ? " on" : "")} role="status" aria-live="polite">
            {toast}
          </span>
        </div>
      </div>

      <div className="tpf-z tpf-sw tpf-s tpf-h" style={H(3)}>
        <span>{switchLabels[0]}</span>
        <span className="tpf-sw-bar" aria-hidden="true" />
        <span>{switchLabels[1]}</span>
        <button type="button" role="switch" className="tpf-tg" aria-checked={calm} aria-label="Calm motion" title="Calm motion" onClick={() => setCalm((v) => !v)} />
        <span />
        <button type="button" role="switch" className="tpf-tg" aria-checked={sub} aria-label="Newsletter" title="Newsletter" onClick={() => setSub((v) => !v)} />
      </div>

      {edition[0] && <span className="tpf-z tpf-ed tpf-s tpf-h" style={{ ...H(4), left: "26%" }}>{edition[0]}</span>}
      {edition[1] && <span className="tpf-z tpf-ed tpf-s tpf-h" style={{ ...H(4), left: "74%" }}>{edition[1]}</span>}

      <div className="tpf-z tpf-pick tpf-s tpf-h" style={H(5)}>
        <div className="tpf-names" data-off={sub} aria-hidden={sub}>
          <button type="button" className="tpf-chev l" onClick={() => step(-1)} aria-label="Previous contact" tabIndex={sub ? -1 : 0}>
            <Icon name="chevL" />
          </button>
          <span className="tpf-name" data-dir={who.dir} aria-live="polite">
            <span key={who.i} title={contact?.role}>{contact?.name}</span>
          </span>
          <button type="button" className="tpf-chev r" onClick={() => step(1)} aria-label="Next contact" tabIndex={sub ? -1 : 0}>
            <Icon name="chevR" />
          </button>
        </div>
        <form className="tpf-form" data-off={!sub} data-sent={sent} aria-hidden={!sub} onSubmit={submit}>
          <label className="sr-only" htmlFor={uid + "e"}>Email for the newsletter</label>
          <input
            id={uid + "e"}
            type="email"
            placeholder="your@email"
            autoComplete="email"
            value={email}
            tabIndex={sub && !sent ? 0 : -1}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" aria-label="Subscribe" tabIndex={sub && !sent ? 0 : -1}>
            <Icon name="arrow" />
          </button>
          <span className="tpf-sent" aria-live="polite">
            {sent ? <><Icon name="check" /> you're in.</> : null}
          </span>
        </form>
      </div>
      <span className="tpf-z tpf-badge tpf-s" data-off={sub} title={contact?.role ? contact.role + " · verified" : "verified"}>
        <span className="tpf-h" style={{ ...H(6), display: "block", width: "100%", height: "100%" }}>
          <Seal />
        </span>
      </span>

      {progress && (
        <div className="tpf-z tpf-prog tpf-s tpf-h" style={H(6)}>
          <Icon name="spark" />
          <span className="tpf-bar" aria-hidden="true">
            <i style={{ transform: "scaleX(" + (barFill * count).toFixed(4) + ")" }} />
          </span>
          <span className="tpf-lbl">
            {progress.label}
            <Icon name="squiggle" />
          </span>
          <A href={progress.href} className="tpf-big" label={progress.label + " " + progress.value}>
            <span aria-hidden="true">{formatStat(progress.value, count)}</span>
          </A>
        </div>
      )}

      {utility && (
        <div className="tpf-z tpf-util tpf-s tpf-h" style={H(7)}>
          <span>{utility.label}</span>
          <span className="tpf-row">
            {utility.links.map((l, i) => (
              <A key={i} href={l.href} className="tpf-tile" label={l.label}>
                <Icon name={l.icon} />
              </A>
            ))}
          </span>
          <A href={utility.word.href} className="tpf-big">{utility.word.label}</A>
        </div>
      )}

      {/* ---- the pin ---- */}
      <button
        ref={pinRef}
        type="button"
        className="tpf-pin"
        data-pin={pin}
        onClick={repin}
        aria-label="Re-pin: tear a new edge"
        title="Pull the pin"
      >
        <span className="tpf-shadow" aria-hidden="true" />
        <span className="tpf-tilt">
          <span className="tpf-drop">
            <span className="tpf-body">
              <Pin base={pinBase} id={uid + "p"} />
            </span>
          </span>
        </span>
      </button>

      {/* ---- printed on the paper ---- */}
      <div className="tpf-z tpf-brand tpf-p-ink">
        <div className="tpf-brand-top tpf-p" style={H(0)}>
          <span className="tpf-eye">{eyebrow}</span>
          {chat && (
            <A href={chat.href} className="tpf-bub" label={chat.label}>
              <span className="tpf-dots" aria-hidden="true"><i /><i /><i /></span>
              <b>{chat.label}</b>
            </A>
          )}
        </div>
        <A href={logoHref} className="tpf-word" label={brand}>
          <span>{brand}</span>
        </A>
      </div>

      {sideLinks.map((l, i) => (
        <A key={i} href={l.href} className={"tpf-z tpf-side tpf-p-ink tpf-p " + (i ? "r" : "l")} label={l.label} style={{ ...H(1 + i), left: i ? "71.5%" : "29.5%" }}>
          <span>{l.label}</span>
          <Icon name={l.icon} />
        </A>
      ))}

      <div className="tpf-z tpf-swatch tpf-p" role="radiogroup" aria-label="Colourway" style={H(3)}>
        <button type="button" role="radio" aria-checked={!inverted} className="tpf-dot" style={{ background: sheet }} onClick={() => colorway(false)} aria-label="Coloured sheet" title="Coloured sheet" />
        <button type="button" role="radio" aria-checked={inverted} className="tpf-dot" style={{ background: paper }} onClick={() => colorway(true)} aria-label="Paper sheet" title="Paper sheet" />
      </div>

      <div className="tpf-z tpf-foot tpf-p-ink">
        <div className="tpf-row tpf-p" style={H(4)}>
          {apps.map((l, i) => (
            <A key={i} href={l.href} label={l.label}>
              <Icon name={l.icon} />
            </A>
          ))}
        </div>
        {legal.length > 0 && (
          <nav className="tpf-legal tpf-p" aria-label="Legal" style={H(5)}>
            {legal.map((l, i) => (l.href ? <A key={i} href={l.href}>{l.label}</A> : <span key={i}>{l.label}</span>))}
          </nav>
        )}
        {contact && (
          <A href={contact.href} className="tpf-handle tpf-p" label={(contact.role ? contact.role + ": " : "") + contact.handle} style={H(6)}>
            <span key={who.i}>{contact.handle}</span>
          </A>
        )}
      </div>
    </footer>
  )
}
