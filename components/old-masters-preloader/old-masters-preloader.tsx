"use client"

import * as React from "react"

// Old Masters Preloader
//
// A preloader cut like an editorial poster for a portfolio. The load is a
// Greek meander ring that engraves itself round a numeral while the stage
// stays black; at 100 the ring flashes, dissolves outward, and a classical
// photograph develops out of the dark. A giant wordmark rises letter by letter
// *behind* the figure: the image's own luminance is turned into an SVG mask, so
// the type sits between the background and the lit marble without a cutout.
// The landing that follows is a live hero: parallax under the pointer, a
// spotlight on the figure, a tagline, a call to action, nav, annotation tags.
//
// React is the only import. Faces arrive through an injected Google Fonts
// <link> (fontHref={null} loads nothing). Every image is a prop.

export interface OldMastersLink {
  label: string
  href?: string
}

export interface OldMastersAside {
  title: string
  text: string
}

export interface OldMastersAnnotation {
  /** Left edge, percent of the stage width. */
  x: number
  /** Top edge, percent of the stage height. */
  y: number
  label: string
}

export interface OldMastersPalette {
  /** Stage background. */
  stage: string
  /** Interface text. */
  text: string
  /** Secondary text. */
  muted: string
  /** The ring, the script initial, the stars, the tags. */
  accent: string
  /** The wordmark. */
  word: string
  /** Hairlines and outlines. */
  rule: string
  /** The flash and the spotlight. */
  glow: string
}

export type OldMastersTone = "noir" | "carmine" | "vellum"
export type OldMastersFace = "didone" | "condensed" | "grotesk"

export interface OldMastersPreloaderProps {
  /** Real progress, 0–100. Leave it out to run a simulated load. */
  progress?: number
  /** Length of the simulated load. */
  durationMs?: number
  /** The ring is shown at least this long, however fast the load. */
  minLoadMs?: number
  /** A click, Enter, Space or the Skip control rushes the load to 100. */
  skippable?: boolean
  /** Open straight on the landing, for repeat visits. */
  skipIntro?: boolean
  /** The photograph. A lit figure on a dark ground works best. */
  image?: string
  imageAlt?: string
  /** Where the image is anchored when it is cropped to cover: [x, y] in 0–1. */
  focal?: [number, number]
  /** "light": lit figure on a dark ground (marble, chiaroscuro). "dark": the reverse. */
  subject?: "light" | "dark"
  /** Set the wordmark behind the figure. false stacks it in front. */
  behind?: boolean
  /** Stages narrower than this (px) set the wordmark in front: a phone crop is mostly figure. */
  behindBelow?: number
  /** Luminance, 0–1, where the figure starts to cover the wordmark. */
  threshold?: number
  /** Width of the soft edge round that threshold, 0–1. */
  softness?: number
  /** Brightness multiplier for the photograph once it has developed. 1 leaves it alone. */
  exposure?: number
  /** Grade the photograph as a two-ink print in the stage colour. Defaults on for carmine. */
  duotone?: boolean
  /** The large word. Fitted to the width of the stage. */
  wordmark?: string
  face?: OldMastersFace
  /** Set the first letter in a script face, overlapping the rest. */
  scriptInitial?: boolean
  tagline?: string
  /** Small line on the top rule. */
  eyebrow?: string
  /** The mark in the middle of the nav. */
  brand?: string
  /** Split left and right of the brand. Hidden on narrow screens. */
  nav?: OldMastersLink[]
  /** Two outlined labels under the nav, left and right. */
  labels?: string[]
  /** Two short columns beside the figure, left and right. Wide screens only. */
  asides?: OldMastersAside[]
  /** Bracketed measurement tags drawn over the photograph after the unveil. */
  annotations?: OldMastersAnnotation[]
  /** Plate number, bottom right. */
  plate?: string
  /** Shown under the ring while it loads. */
  loadingLabel?: string
  cta?: OldMastersLink
  /** Fired when the call to action is pressed. */
  onEnter?: () => void
  /** Fired once the landing is up. */
  onLoaded?: () => void
  /** With children: fired once the stage has lifted off them. */
  onComplete?: () => void
  /** The page behind the preloader. The stage lifts off it after holdMs, or on the call to action. */
  children?: React.ReactNode
  /** With children: how long the landing holds before lifting. 0 waits for the call to action. */
  holdMs?: number
  tone?: OldMastersTone
  /** Partial overrides of the tone's palette. */
  palette?: OldMastersPaletteOverride
  /** Stylesheet for the faces. null loads nothing. */
  fontHref?: string | null
  /** Root height. A definite length, never a percentage. */
  height?: string
  className?: string
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@400;500&family=Pinyon+Script&display=swap"

const FONT_PROBES = ['400 1em "Bodoni Moda"', '400 1em "Bebas Neue"', '400 1em "Pinyon Script"', '400 1em "Jost"', '500 1em "Jost"']

const FACES = {
  didone: { family: '"Bodoni Moda", "Didot", "Bodoni 72", "Playfair Display", "Times New Roman", serif', weight: 400, tracking: -0.015 },
  condensed: { family: '"Bebas Neue", "Oswald", "Impact", "Arial Narrow", sans-serif', weight: 400, tracking: 0.02 },
  grotesk: { family: '"Jost", "Futura", "Helvetica Neue", Arial, sans-serif', weight: 500, tracking: -0.035 },
}

const SCRIPT_FAMILY = '"Pinyon Script", "Snell Roundhand", "Apple Chancery", "Brush Script MT", cursive'
const UI_FAMILY = '"Jost", "Futura", "Helvetica Neue", Arial, sans-serif'
const SERIF_FAMILY = '"Bodoni Moda", "Didot", "Bodoni 72", "Playfair Display", "Times New Roman", serif'

const TONES = {
  noir: { stage: "#0b0a09", text: "#efe6d6", muted: "#9a917f", accent: "#d9b25c", word: "#f1e9d8", rule: "#4a4336", glow: "#ffd98a" },
  carmine: { stage: "#7d1310", text: "#f6ead6", muted: "#dba79d", accent: "#f6ead6", word: "#f8eedc", rule: "#b2463c", glow: "#ffd5a3" },
  vellum: { stage: "#e8ddc6", text: "#221c16", muted: "#7a6d58", accent: "#8e2b1d", word: "#1f1913", rule: "#c7b58f", glow: "#fff3d6" },
}

// Jack Hunter on Unsplash: the head of Michelangelo's David, lit against the dark.
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1601887389937-0b02c26b602c?q=80&w=2000&auto=format&fit=crop"

const DEFAULT_NAV = [{ label: "Work" }, { label: "Studio" }, { label: "Journal" }, { label: "Contact" }]
const DEFAULT_LABELS = ["Ars longa", "Vita brevis"]
const DEFAULT_ASIDES = [
  {
    title: "Practice",
    text: "Identity, interface and motion for people who still believe a screen can be composed like a page. Every frame is set by hand.",
  },
  {
    title: "Method",
    text: "Begin with the material. Marble, ink, light: the work borrows its discipline from things that were made to last.",
  },
]
const DEFAULT_ANNOTATIONS = [
  { x: 37, y: 47, label: "0.7324" },
  { x: 60, y: 39, label: "1.1429" },
  { x: 52, y: 64, label: "1.0000" },
]

const UNVEIL_MS = 2700
const EXIT_MS = 1200

// #region timeline
// Pure helpers, lifted out and executed by tests/old-masters-preloader.test.mjs.

const OM_CURVE = [
  [0, 0],
  [0.1, 0.14],
  [0.26, 0.2],
  [0.4, 0.52],
  [0.5, 0.56],
  [0.72, 0.84],
  [0.82, 0.88],
  [1, 1],
]

/** A simulated load that surges and stalls, 0–1 in, 0–1 out, never backwards. */
export function omSimulated(t: number) {
  if (!(t > 0)) return 0
  if (t >= 1) return 1
  for (let i = 1; i < OM_CURVE.length; i++) {
    const [t0, p0] = OM_CURVE[i - 1]
    const [t1, p1] = OM_CURVE[i]
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0)
      const s = u * u * (3 - 2 * u)
      return p0 + (p1 - p0) * s
    }
  }
  return 1
}

/** Progress as the ratio read-out: 0.4700. */
export function omRatio(p: number) {
  const v = Math.min(1, Math.max(0, p))
  return v.toFixed(4)
}

const round2 = (v: number) => Math.round(v * 100) / 100 + 0

/**
 * A Greek meander (key) engraved round a circle, as one continuous path. Each
 * unit is a hook drawn in band coordinates (u along the ring, v across it) and
 * bent onto the circle: tangential strokes become arcs, radial strokes lines.
 */
export function omMeander(cx: number, cy: number, r: number, depth: number, units: number) {
  const n = Math.max(4, Math.floor(units))
  const unit = (Math.PI * 2) / n
  const hook = [
    [0, 0],
    [0, 3],
    [4, 3],
    [4, 2],
    [2, 2],
    [2, 0],
    [6, 0],
  ]
  const at = (u: number, v: number) => {
    const a = -Math.PI / 2 + (u / 6) * unit
    const rr = r + (v / 3 - 0.5) * depth
    return [round2(cx + Math.cos(a) * rr), round2(cy + Math.sin(a) * rr), round2(rr)]
  }
  let d = ""
  let prevV = 0
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < hook.length; k++) {
      if (i > 0 && k === 0) continue
      const [hu, hv] = hook[k]
      const [x, y, rr] = at(i * 6 + hu, hv)
      if (i === 0 && k === 0) d = "M" + x + " " + y
      else if (hv === prevV) d += " A" + rr + " " + rr + " 0 0 1 " + x + " " + y
      else d += " L" + x + " " + y
      prevV = hv
    }
  }
  return d
}

/** The rect an image takes when it covers w × h, anchored at focal [fx, fy]. */
export function omCover(iw: number, ih: number, w: number, h: number, fx: number, fy: number) {
  if (!(iw > 0) || !(ih > 0) || !(w > 0) || !(h > 0)) return { x: 0, y: 0, w: Math.max(0, w), h: Math.max(0, h) }
  const s = Math.max(w / iw, h / ih)
  const cw = iw * s
  const ch = ih * s
  const cx = Math.min(1, Math.max(0, fx))
  const cy = Math.min(1, Math.max(0, fy))
  return { x: round2((w - cw) * cx), y: round2((h - ch) * cy), w: round2(cw), h: round2(ch) }
}

/** Font size that sets a word measured at w100 (px at 100px) into avail, capped. */
export function omFit(w100: number, avail: number, maxFs: number, minFs: number) {
  if (!(w100 > 0) || !(avail > 0)) return minFs
  const fs = (avail / w100) * 100
  return Math.max(minFs, Math.min(maxFs, fs))
}

/** A linear transfer that turns luminance into mask coverage round a threshold. */
export function omTransfer(threshold: number, softness: number, subject: "light" | "dark") {
  const soft = Math.max(0.02, Math.min(1, softness))
  const th = Math.min(1, Math.max(0, threshold))
  if (subject === "light") return { slope: round2(-1 / soft), intercept: round2((th + soft / 2) / soft) }
  return { slope: round2(1 / soft), intercept: round2(-(th - soft / 2) / soft) }
}

/** A small seeded generator so the grain and the barcode are the same on every mount. */
export function omRng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

export function omHash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h || 1
}

/** Bars of a plate barcode across width: [{ x, w }]. */
export function omBars(seed: number, count: number, width: number) {
  const rnd = omRng(seed)
  const bars: { x: number; w: number }[] = []
  const pitch = width / Math.max(1, count)
  for (let i = 0; i < count; i++) {
    const w = Math.max(1, Math.round(pitch * (0.25 + rnd() * 0.55)))
    bars.push({ x: round2(i * pitch), w })
  }
  return bars
}

/**
 * Where the baseline sits in a line-height: 1 box, as a fraction of the font
 * size from the bottom, given the face's ascent and descent in em. The content
 * area is centred in the line box, so half the leading lands on each side.
 */
export function omBaseline(ascent: number, descent: number) {
  if (!(ascent > 0) || !(descent >= 0)) return 0.2
  return round2((1 + descent - ascent) / 2 * 100) / 100
}

/** The wordmark split into its script initial and the rest. */
export function omSplit(word: string, script: boolean) {
  const chars = Array.from(word)
  if (!script || chars.length === 0) return { initial: "", rest: chars }
  return { initial: chars[0], rest: chars.slice(1) }
}
// #endregion

const OM_CSS = `
.om-root { position: relative; width: 100%; overflow: hidden; background: var(--om-stage); color: var(--om-text); font-family: var(--om-ui); -webkit-font-smoothing: antialiased; --om-px: 0px; --om-py: 0px; --om-sx: 50%; --om-sy: 42%; --om-gap: 90px; }
.om-root svg, .om-root canvas, .om-root img { max-width: none; }
.om-root a { color: inherit; text-decoration: none; }
.om-root button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; }
.om-root :focus-visible { outline: 1px solid var(--om-accent); outline-offset: 4px; }
.om-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.om-page { position: absolute; inset: 0; overflow: auto; }
.om-stage { position: absolute; inset: 0; overflow: hidden; background: var(--om-stage); clip-path: inset(0 0 0 0); }
.om-root[data-phase="exit"] .om-stage { clip-path: inset(0 0 100% 0); transition: clip-path 1.15s cubic-bezier(0.76, 0, 0.24, 1); }
.om-root[data-phase="exit"] .om-par { transform: translate3d(0, -9%, 0) scale(1.06); transition: transform 1.15s cubic-bezier(0.76, 0, 0.24, 1); }
.om-root[data-phase="exit"] .om-chrome { opacity: 0; transition: opacity 0.5s ease; }

/* ---- the photograph and the word behind the figure ---------------------- */
.om-par { position: absolute; inset: 0; isolation: isolate; transform: translate3d(var(--om-px), var(--om-py), 0) scale(1.045); transform-origin: 50% 50%; will-change: transform; }
.om-root[data-phase="load"] .om-par { visibility: hidden; }
.om-paint { position: absolute; display: block; object-fit: fill; opacity: 0; filter: brightness(0.2) blur(14px); transform: scale(1.1); transform-origin: var(--om-fx) var(--om-fy); }
.om-root[data-phase="unveil"] .om-paint, .om-root[data-phase="landing"] .om-paint, .om-root[data-phase="exit"] .om-paint { opacity: 1; filter: brightness(var(--om-exposure)) blur(0); transform: scale(1); transition: opacity 1.4s cubic-bezier(0.2, 0.7, 0.2, 1) 0.3s, filter 2.1s cubic-bezier(0.2, 0.7, 0.2, 1) 0.3s, transform 3s cubic-bezier(0.16, 1, 0.3, 1) 0.3s; }
.om-root[data-duotone="true"] .om-paint { filter: brightness(var(--om-exposure)) blur(0) grayscale(1) contrast(1.12); }
.om-root[data-duotone="true"][data-phase="load"] .om-paint { filter: brightness(0.2) blur(14px) grayscale(1); }
.om-duo { position: absolute; inset: 0; pointer-events: none; opacity: 0; }
.om-root[data-duotone="true"] .om-duo { opacity: 1; }
.om-duo-a { background: var(--om-stage); mix-blend-mode: lighten; }
.om-duo-b { background: var(--om-glow); mix-blend-mode: multiply; }
.om-root[data-tone="vellum"] .om-paint, .om-root[data-tone="vellum"] .om-duo { -webkit-mask-image: radial-gradient(ellipse 64% 74% at 50% 58%, #000 36%, transparent 100%); mask-image: radial-gradient(ellipse 64% 74% at 50% 58%, #000 36%, transparent 100%); }
.om-root[data-tone="vellum"] .om-paint { filter: brightness(var(--om-exposure)) blur(0) sepia(0.45) contrast(1.02); }
.om-root[data-tone="vellum"] .om-tagline { text-shadow: 0 0 28px var(--om-stage), 0 0 10px var(--om-stage); }
.om-root[data-tone="vellum"][data-phase="load"] .om-paint { filter: brightness(0.2) blur(14px) sepia(0.45); }
.om-grade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to bottom, var(--om-stage-a) 0%, transparent 22%, transparent 55%, var(--om-stage-b) 100%); }
.om-root[data-tone="vellum"] .om-grade { background: none; }
.om-spot { position: absolute; inset: -20%; pointer-events: none; mix-blend-mode: screen; opacity: 0; background: radial-gradient(circle 34vmax at var(--om-sx) var(--om-sy), var(--om-glow-a) 0%, transparent 62%); transition: opacity 1.2s ease 1.2s; }
.om-root[data-tone="vellum"] .om-spot { mix-blend-mode: soft-light; }
.om-root[data-phase="landing"] .om-spot, .om-root[data-phase="exit"] .om-spot { opacity: 1; }
.om-wordlayer { position: absolute; inset: 0; pointer-events: none; }
.om-wordlayer[data-front="true"] .om-word { text-shadow: 0 2px 40px var(--om-stage-c); }
.om-wordclip { position: absolute; left: 0; right: 0; bottom: 2.3%; height: calc(var(--om-fs) * (var(--om-cap) + 0.12) + 1.2vh); overflow: hidden; }
.om-word { position: absolute; left: 0; right: 0; bottom: calc(var(--om-fs) * var(--om-base) * -1 + 1.2vh); margin: 0; text-align: center; white-space: nowrap; font-family: var(--om-face); font-weight: var(--om-weight); font-size: var(--om-fs); line-height: 1; letter-spacing: calc(var(--om-tracking) * 1em); color: var(--om-word); text-transform: uppercase; transform: translate3d(calc(var(--om-px) * 0.9), calc(var(--om-py) * 0.6), 0); }
.om-l { display: inline-block; transform: translate3d(0, 112%, 0); transition: transform 1.25s cubic-bezier(0.16, 1, 0.3, 1) calc(0.95s + var(--i) * 48ms); }
.om-root[data-phase="landing"] .om-l, .om-root[data-phase="exit"] .om-l, .om-root[data-phase="unveil"] .om-l { transform: translate3d(0, 0, 0); }
.om-sp { display: inline-block; width: 0.26em; }
.om-init { display: inline-block; font-family: var(--om-script); font-weight: 400; font-size: 1.32em; line-height: 1; letter-spacing: 0; text-transform: none; color: var(--om-accent); margin-right: -0.14em; position: relative; z-index: 1; vertical-align: baseline; transform: translate3d(0, 112%, 0) rotate(4deg); transition: transform 1.5s cubic-bezier(0.16, 1, 0.3, 1) 1.35s; }
.om-root[data-phase="landing"] .om-init, .om-root[data-phase="exit"] .om-init, .om-root[data-phase="unveil"] .om-init { transform: translate3d(0, 0, 0) rotate(0deg); }
.om-grain { position: absolute; inset: -32px; pointer-events: none; background-repeat: repeat; background-size: 160px 160px; opacity: var(--om-grain); mix-blend-mode: overlay; animation: om-grain 0.5s steps(1) infinite; }
@keyframes om-grain { 0% { transform: translate(0, 0); } 25% { transform: translate(-16px, 9px); } 50% { transform: translate(11px, -14px); } 75% { transform: translate(-7px, -19px); } }

/* ---- interface ---------------------------------------------------------- */
.om-chrome { position: absolute; inset: 0; pointer-events: none; }
.om-chrome > * { pointer-events: auto; }
.om-ui { font-family: var(--om-ui); font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 500; }
.om-top { position: absolute; left: 0; right: 0; top: 0; height: 64px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 0 clamp(18px, 3.2vw, 48px); }
.om-rule { position: absolute; left: clamp(18px, 3.2vw, 48px); right: clamp(18px, 3.2vw, 48px); top: 64px; height: 1px; background: var(--om-rule); transform: scaleX(0); transform-origin: 50% 50%; transition: transform 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.2s; }
.om-root[data-up="true"] .om-rule { transform: scaleX(1); }
.om-rule[data-gap="true"] { -webkit-mask-image: linear-gradient(to right, #000 calc(50% - var(--om-gap)), transparent calc(50% - var(--om-gap)), transparent calc(50% + var(--om-gap)), #000 calc(50% + var(--om-gap))); mask-image: linear-gradient(to right, #000 calc(50% - var(--om-gap)), transparent calc(50% - var(--om-gap)), transparent calc(50% + var(--om-gap)), #000 calc(50% + var(--om-gap))); }
.om-eyebrow { position: absolute; left: 50%; top: 64px; transform: translate(-50%, -50%); color: var(--om-muted); font-size: 10.5px; letter-spacing: 0.3em; white-space: nowrap; opacity: 0; transition: opacity 0.9s ease 0.9s; }
.om-root[data-up="true"] .om-eyebrow { opacity: 1; }
.om-navl, .om-navr { display: flex; gap: clamp(18px, 2.4vw, 36px); margin: 0; padding: 0; list-style: none; }
.om-navr { justify-content: flex-end; }
.om-navl li, .om-navr li { opacity: 0; transform: translateY(6px); transition: opacity 0.7s ease calc(0.5s + var(--i) * 70ms), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) calc(0.5s + var(--i) * 70ms); }
.om-root[data-up="true"] .om-navl li, .om-root[data-up="true"] .om-navr li { opacity: 1; transform: none; }
.om-navl a, .om-navl button, .om-navr a, .om-navr button { position: relative; display: inline-block; padding: 6px 0; color: var(--om-text); opacity: 0.78; transition: opacity 0.3s ease; }
.om-navl a:hover, .om-navl button:hover, .om-navr a:hover, .om-navr button:hover { opacity: 1; }
.om-navl a::after, .om-navl button::after, .om-navr a::after, .om-navr button::after { content: ""; position: absolute; left: 0; right: 0; bottom: 2px; height: 1px; background: currentColor; transform: scaleX(0); transform-origin: 0 50%; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.om-navl a:hover::after, .om-navl button:hover::after, .om-navr a:hover::after, .om-navr button:hover::after { transform: scaleX(1); }
.om-brand { font-family: var(--om-serif); font-size: 22px; font-style: italic; letter-spacing: 0.02em; text-transform: none; font-weight: 400; color: var(--om-text); opacity: 0; transition: opacity 0.9s ease 0.4s; }
.om-root[data-up="true"] .om-brand { opacity: 1; }
.om-pill { position: absolute; top: 96px; padding: 7px 15px 6px; border: 1px solid var(--om-rule); border-radius: 999px; color: var(--om-text); font-size: 10.5px; letter-spacing: 0.24em; white-space: nowrap; opacity: 0; transform: translateY(4px); transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.om-pill-l { left: clamp(18px, 7vw, 120px); }
.om-pill-r { right: clamp(18px, 7vw, 120px); }
.om-root[data-pills="1"] .om-pill-l, .om-root[data-pills="2"] .om-pill { opacity: 1; transform: none; }
.om-star { position: absolute; width: 18px; height: 18px; color: var(--om-accent); opacity: 0; transform: scale(0.4) rotate(-30deg); transition: opacity 0.9s ease calc(0.6s + var(--i) * 140ms), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) calc(0.6s + var(--i) * 140ms); }
.om-root[data-up="true"] .om-star { opacity: 1; transform: none; }
.om-star svg { display: block; width: 100%; height: 100%; animation: om-twinkle 3.6s ease-in-out infinite; animation-delay: calc(var(--i) * -0.9s); transform-origin: 50% 50%; }
.om-star-s { width: 10px; height: 10px; }
.om-root[data-phase="landing"] .om-star-c, .om-root[data-phase="exit"] .om-star-c { opacity: 0; transition: opacity 0.8s ease 0.8s; }
@keyframes om-twinkle { 0%, 100% { transform: scale(0.72) rotate(0deg); opacity: 0.55; } 50% { transform: scale(1) rotate(12deg); opacity: 1; } }
.om-aside { position: absolute; top: 42%; width: 200px; font-size: 11.5px; line-height: 1.65; letter-spacing: 0.01em; color: var(--om-muted); opacity: 0; transform: translateY(10px); transition: opacity 1s ease, transform 1s cubic-bezier(0.16, 1, 0.3, 1); }
.om-aside-l { left: clamp(18px, 7vw, 120px); }
.om-aside-r { right: clamp(18px, 7vw, 120px); text-align: right; }
.om-aside b { display: block; margin-bottom: 8px; font-weight: 500; font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--om-accent); }
.om-aside p { margin: 0; }
.om-root[data-phase="landing"] .om-aside, .om-root[data-phase="exit"] .om-aside { opacity: 1; transform: none; }
.om-root[data-phase="landing"] .om-aside-l { transition-delay: 1.9s; }
.om-root[data-phase="landing"] .om-aside-r { transition-delay: 2.05s; }

/* ---- the ring ----------------------------------------------------------- */
.om-loader { position: absolute; left: 50%; top: 50%; width: var(--om-ring); height: var(--om-ring); transform: translate(-50%, -50%); display: grid; place-items: center; }
.om-ring { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.om-ring-hair { fill: none; stroke: var(--om-rule); stroke-width: 1; vector-effect: non-scaling-stroke; opacity: 0; transition: opacity 1.2s ease 0.3s; }
.om-ring-key { fill: none; stroke: var(--om-accent); stroke-width: 1.6; vector-effect: non-scaling-stroke; stroke-linejoin: miter; stroke-linecap: butt; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; transition: opacity 0.6s ease 0.4s; }
.om-ring-key-ghost { stroke: var(--om-rule); stroke-dasharray: none; opacity: 0; transition: opacity 1.2s ease 0.4s; }
.om-root[data-up="true"] .om-ring-hair, .om-root[data-up="true"] .om-ring-key { opacity: 1; }
.om-root[data-up="true"] .om-ring-key-ghost { opacity: 0.55; }
.om-num { position: relative; margin: 0; font-family: var(--om-serif); font-weight: 400; font-size: calc(var(--om-ring) * 0.25); line-height: 1; letter-spacing: -0.02em; color: var(--om-text); font-variant-numeric: tabular-nums lining-nums; opacity: 0; transform: translateY(8px); transition: opacity 0.9s ease 0.5s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.5s; }
.om-root[data-up="true"] .om-num { opacity: 1; transform: none; }
.om-ratio { position: absolute; left: 50%; top: var(--om-ratio-y); transform: translateX(-50%); display: flex; align-items: center; gap: 12px; color: var(--om-muted); font-size: 10.5px; letter-spacing: 0.26em; white-space: nowrap; font-variant-numeric: tabular-nums; opacity: 0; transition: opacity 0.9s ease 0.8s; }
.om-ratio i { display: block; width: 22px; height: 1px; background: var(--om-rule); }
.om-root[data-up="true"] .om-ratio { opacity: 1; }
.om-root[data-phase="unveil"] .om-loader, .om-root[data-phase="landing"] .om-loader, .om-root[data-phase="exit"] .om-loader { transform: translate(-50%, -50%) scale(2.4); opacity: 0; transition: transform 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.28s, opacity 0.9s ease 0.3s; pointer-events: none; }
.om-root[data-phase="unveil"] .om-ring-key, .om-root[data-phase="landing"] .om-ring-key, .om-root[data-phase="exit"] .om-ring-key { stroke: var(--om-glow); filter: drop-shadow(0 0 6px var(--om-glow)); transition: stroke 0.25s ease, filter 0.25s ease; }
.om-root[data-phase="unveil"] .om-num, .om-root[data-phase="landing"] .om-num, .om-root[data-phase="exit"] .om-num, .om-root[data-phase="unveil"] .om-ratio, .om-root[data-phase="landing"] .om-ratio, .om-root[data-phase="exit"] .om-ratio { opacity: 0; filter: blur(6px); transition: opacity 0.45s ease 0.2s, filter 0.45s ease 0.2s; }
.om-flash { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 50% 50%, var(--om-glow-b) 0%, transparent 46%); opacity: 0; }
.om-root[data-phase="unveil"] .om-flash { animation: om-flash 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes om-flash { 0% { opacity: 0; } 12% { opacity: 1; } 100% { opacity: 0; } }

/* ---- the copy ----------------------------------------------------------- */
.om-copy { position: absolute; left: 50%; top: 23%; transform: translateX(-50%); width: min(88vw, 760px); text-align: center; }
.om-tagline { margin: 0; font-family: var(--om-serif); font-style: italic; font-weight: 400; font-size: clamp(22px, 2.9vw, 42px); line-height: 1.15; letter-spacing: 0.005em; color: var(--om-text); text-shadow: 0 1px 24px var(--om-stage-c); }
.om-tagline span { display: inline-block; opacity: 0; transform: translateY(14px); transition: opacity 0.8s ease calc(1.5s + var(--i) * 55ms), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) calc(1.5s + var(--i) * 55ms); }
.om-root[data-phase="landing"] .om-tagline span, .om-root[data-phase="exit"] .om-tagline span, .om-root[data-phase="unveil"] .om-tagline span { opacity: 1; transform: none; }
.om-root .om-cta { display: inline-block; margin-top: 26px; padding: 13px 30px 12px; border: 1px solid var(--om-text); color: var(--om-text); background: var(--om-stage-d); font-family: var(--om-ui); font-size: 11.5px; letter-spacing: 0.26em; text-transform: uppercase; font-weight: 500; opacity: 0; transform: translateY(10px) scale(0.98); transition: opacity 0.8s ease 2s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 2s, background-color 0.35s ease, color 0.35s ease; }
.om-root[data-phase="landing"] .om-cta, .om-root[data-phase="exit"] .om-cta, .om-root[data-phase="unveil"] .om-cta { opacity: 1; transform: none; }
.om-root .om-cta:hover { background: var(--om-text); color: var(--om-stage); }
.om-ann { position: absolute; width: 58px; height: 30px; color: var(--om-text); opacity: 0; transform: scale(0.7); transform-origin: 0 0; transition: opacity 0.6s ease calc(2.1s + var(--i) * 160ms), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) calc(2.1s + var(--i) * 160ms); }
.om-root[data-phase="landing"] .om-ann, .om-root[data-phase="exit"] .om-ann { opacity: 1; transform: none; }
.om-ann svg { display: block; width: 58px; height: 30px; overflow: visible; }
.om-ann span { position: absolute; left: 62px; top: 11px; font-size: 10px; letter-spacing: 0.16em; font-variant-numeric: tabular-nums; white-space: nowrap; text-shadow: 0 1px 10px var(--om-stage-c); }
.om-root[data-tone="vellum"] .om-ann { color: var(--om-accent); }
.om-foot { position: absolute; left: clamp(18px, 3.2vw, 48px); right: clamp(18px, 3.2vw, 48px); bottom: clamp(16px, 2.6vw, 30px); display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; transition: bottom 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.9s; }
.om-root[data-phase="unveil"] .om-foot, .om-root[data-phase="landing"] .om-foot, .om-root[data-phase="exit"] .om-foot { bottom: calc(var(--om-fs) * (var(--om-cap) + 0.03) + 1.2vh + 18px); }
.om-bars { display: block; width: 92px; height: 22px; color: var(--om-text); opacity: 0; transition: opacity 1s ease 1s; }
.om-root[data-up="true"] .om-bars { opacity: 0.75; }
.om-plate { color: var(--om-muted); font-size: 10.5px; letter-spacing: 0.26em; opacity: 0; text-shadow: 0 1px 12px var(--om-stage-c); transition: opacity 1s ease 1.1s; }
.om-root[data-up="true"] .om-plate { opacity: 1; }
.om-skip { position: absolute; left: 50%; bottom: clamp(16px, 2.6vw, 30px); transform: translateX(-50%); color: var(--om-muted); font-size: 10.5px; letter-spacing: 0.3em; padding: 6px 10px; opacity: 0; transition: opacity 0.8s ease 1.6s, color 0.3s ease; }
.om-root[data-up="true"][data-phase="load"] .om-skip { opacity: 1; }
.om-skip:hover { color: var(--om-text); }
.om-root[data-phase="load"] .om-copy, .om-root[data-phase="load"] .om-ann, .om-root[data-phase="load"] .om-aside { visibility: hidden; }
.om-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* ---- responsive ---------------------------------------------------------- */
@media (max-width: 1023px) { .om-aside { display: none; } }
@media (max-width: 639px) {
  .om-navl, .om-navr { display: none; }
  .om-top { grid-template-columns: 1fr; justify-items: center; }
  .om-pill { top: 86px; }
  .om-pill-l { left: 18px; }
  .om-pill-r { right: 18px; }
  .om-copy { top: 20%; width: 88vw; }
  .om-star { top: 15.5% !important; }
  .om-star-s { top: 72% !important; }
  .om-tagline { font-size: clamp(19px, 6vw, 26px); }
  .om-root .om-cta { margin-top: 18px; padding: 11px 22px 10px; }
  .om-ratio { top: var(--om-ratio-y); }
  .om-ann { display: none; }
  .om-foot { bottom: 14px; }
}

/* ---- instant and reduced ------------------------------------------------ */
.om-root[data-instant="true"] *, .om-root[data-instant="true"] *::before, .om-root[data-instant="true"] *::after { transition-duration: 0s !important; transition-delay: 0s !important; animation-duration: 0s !important; }
@media (prefers-reduced-motion: reduce) {
  .om-root { --om-px: 0px !important; --om-py: 0px !important; }
  .om-star svg, .om-grain { animation: none; }
  .om-paint { transform: none; transition-duration: 0.9s, 0.9s, 0s !important; }
  .om-l, .om-init { transform: none; opacity: 0; transition: opacity 0.8s ease calc(0.6s + var(--i, 0) * 25ms); }
  .om-root[data-phase="landing"] .om-l, .om-root[data-phase="exit"] .om-l, .om-root[data-phase="unveil"] .om-l, .om-root[data-phase="landing"] .om-init, .om-root[data-phase="exit"] .om-init, .om-root[data-phase="unveil"] .om-init { opacity: 1; transform: none; }
  .om-root[data-phase="unveil"] .om-loader, .om-root[data-phase="landing"] .om-loader { transform: translate(-50%, -50%); transition: opacity 0.6s ease; }
  .om-root[data-phase="exit"] .om-stage { transition-duration: 0.6s; }
  .om-root[data-phase="exit"] .om-par { transform: none; }
  .om-ring-key { transition: none; }
}
`

const STAR_PATH = "M12 0C12.6 6.8 17.2 11.4 24 12C17.2 12.6 12.6 17.2 12 24C11.4 17.2 6.8 12.6 0 12C6.8 11.4 11.4 6.8 12 0Z"
const STARS = [
  { x: "4.4%", y: "15%", small: false, under: false },
  { x: "95%", y: "15%", small: false, under: false },
  { x: "7.5%", y: "72%", small: true, under: false },
  { x: "92.5%", y: "70%", small: true, under: false },
  { x: "50%", y: "88%", small: true, under: true },
]

function hexAlpha(hex: string, alpha: number) {
  const m = hex.replace("#", "")
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  if ([r, g, b].some((v) => Number.isNaN(v))) return hex
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")"
}

function paintGrain(seed: number) {
  if (typeof document === "undefined") return ""
  const c = document.createElement("canvas")
  c.width = 160
  c.height = 160
  const ctx = c.getContext("2d")
  if (!ctx) return ""
  const img = ctx.createImageData(160, 160)
  const rnd = omRng(seed)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 96 + Math.floor(rnd() * 96)
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL("image/png")
}

let omUid = 0

export default function OldMastersPreloader({
  progress,
  durationMs = 4600,
  minLoadMs = 2400,
  skippable = true,
  skipIntro = false,
  image = DEFAULT_IMAGE,
  imageAlt = "The head of Michelangelo's David, lit against the dark",
  focal = [0.5, 0.36],
  subject = "light",
  behind = true,
  behindBelow = 640,
  threshold = 0.4,
  softness = 0.22,
  exposure = 1,
  duotone,
  wordmark = "Kallisto",
  face = "didone",
  scriptInitial = false,
  tagline = "Every surface, chiselled. Every motion, composed.",
  eyebrow = "Portfolio · MMXXVI",
  brand = "K.",
  nav = DEFAULT_NAV,
  labels = DEFAULT_LABELS,
  asides = DEFAULT_ASIDES,
  annotations = DEFAULT_ANNOTATIONS,
  plate = "Pl. I",
  loadingLabel = "Loading",
  cta = { label: "Enter" },
  onEnter,
  onLoaded,
  onComplete,
  children,
  holdMs = 2600,
  tone = "noir",
  palette,
  fontHref = FONT_HREF,
  height = "100svh",
  className = "",
}: OldMastersPreloaderProps) {
  const pal = { ...TONES[tone], ...(palette || {}) }
  const faceDef = FACES[face]
  const isDuotone = duotone === undefined ? tone === "carmine" : duotone

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const numRef = React.useRef(null as HTMLSpanElement | null)
  const ratioRef = React.useRef(null as HTMLSpanElement | null)
  const keyRef = React.useRef(null as SVGPathElement | null)
  const liveRef = React.useRef(null as HTMLDivElement | null)
  const eyebrowRef = React.useRef(null as HTMLDivElement | null)

  const [uid] = React.useState(() => "om" + (omUid++).toString(36) + Math.random().toString(36).slice(2, 7))
  const [phase, setPhase] = React.useState(skipIntro ? "landing" : "load")
  const [up, setUp] = React.useState(false)
  const [instant, setInstant] = React.useState(skipIntro)
  const [pct, setPct] = React.useState(skipIntro ? 100 : 0)
  const [size, setSize] = React.useState({ w: 0, h: 0 })
  const [natural, setNatural] = React.useState({ w: 0, h: 0 })
  const [fontsReady, setFontsReady] = React.useState(0)
  const [grain, setGrain] = React.useState("")
  const [fs, setFs] = React.useState(120)
  const [metrics, setMetrics] = React.useState({ base: 0.16, cap: 0.7 })

  const phaseRef = React.useRef(phase)
  phaseRef.current = phase
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const rushRef = React.useRef(false)
  const shownRef = React.useRef(skipIntro ? 1 : 0)
  const pctRef = React.useRef(skipIntro ? 100 : 0)
  const pointerRef = React.useRef({ tx: 0, ty: 0, x: 0, y: 0, sx: 50, sy: 42, active: false })
  const onLoadedRef = React.useRef(onLoaded)
  onLoadedRef.current = onLoaded
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const onEnterRef = React.useRef(onEnter)
  onEnterRef.current = onEnter

  const chars = React.useMemo(() => omSplit(wordmark, scriptInitial), [wordmark, scriptInitial])
  const hasChildren = children !== undefined && children !== null

  // Fonts: one injected <link>, then wait for the faces (or a short timeout).
  React.useEffect(() => {
    if (!fontHref) {
      setFontsReady(1)
      return
    }
    if (!document.querySelector('link[data-om-fonts="' + fontHref + '"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = fontHref
      link.setAttribute("data-om-fonts", fontHref)
      document.head.appendChild(link)
    }
    let live = true
    const go = () => {
      if (live) setFontsReady((n) => n + 1)
    }
    const timer = setTimeout(go, 2500)
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts && fonts.load) {
      Promise.all(FONT_PROBES.map((f) => fonts.load(f).catch(() => null))).then(go, go)
      fonts.addEventListener("loadingdone", go)
    } else go()
    return () => {
      live = false
      clearTimeout(timer)
      if (fonts && fonts.removeEventListener) fonts.removeEventListener("loadingdone", go)
    }
  }, [fontHref])

  // The stage's size, for the cover rect, the mask and the fit.
  React.useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      setSize((s) => (Math.abs(s.w - r.width) < 0.5 && Math.abs(s.h - r.height) < 0.5 ? s : { w: r.width, h: r.height }))
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The photograph's natural size, for the cover rect.
  React.useEffect(() => {
    setNatural({ w: 0, h: 0 })
    if (!image || typeof Image === "undefined") return
    let live = true
    const img = new Image()
    img.onload = () => {
      if (live) setNatural({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.src = image
    return () => {
      live = false
    }
  }, [image])

  // Grain is painted once, on mount.
  React.useEffect(() => {
    setGrain(paintGrain(omHash(wordmark) ^ 0x9e3779b9))
  }, [wordmark])

  // Fit the wordmark to the stage width.
  React.useEffect(() => {
    if (!size.w || !size.h || typeof document === "undefined") return
    const c = document.createElement("canvas")
    const ctx = c.getContext("2d")
    if (!ctx) return
    const rest = chars.rest.join("").toUpperCase()
    ctx.font = faceDef.weight + " 100px " + faceDef.family
    const h = ctx.measureText("H")
    const cap = h.actualBoundingBoxAscent > 0 ? h.actualBoundingBoxAscent / 100 : 0.7
    const base = omBaseline(h.fontBoundingBoxAscent / 100, h.fontBoundingBoxDescent / 100)
    setMetrics({ base, cap: Math.round(cap * 100) / 100 })
    let w100 = ctx.measureText(rest).width + Math.max(0, chars.rest.length - 1) * faceDef.tracking * 100
    if (chars.initial) {
      ctx.font = "400 132px " + SCRIPT_FAMILY
      w100 += ctx.measureText(chars.initial).width - 14
    }
    const pad = Math.max(10, size.w * 0.025)
    const maxFs = (size.h * 0.34) / cap
    setFs(Math.round(omFit(w100, size.w - pad * 2, maxFs, 36)))
  }, [size, chars, faceDef, fontsReady])

  // The rule leaves a gap round the eyebrow.
  React.useEffect(() => {
    const el = eyebrowRef.current
    const root = rootRef.current
    if (!el || !root) return
    const read = () => root.style.setProperty("--om-gap", Math.round(el.offsetWidth / 2 + 14) + "px")
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [eyebrow, fontsReady])

  // Curtain up: the rule draws, the nav and the ring come in.
  React.useEffect(() => {
    const t = setTimeout(() => setUp(true), 60)
    return () => clearTimeout(t)
  }, [])

  // skipIntro: first paint without transitions.
  React.useEffect(() => {
    if (!instant) return
    const t = setTimeout(() => setInstant(false), 80)
    return () => clearTimeout(t)
  }, [instant])

  // The load, the parallax and the read-outs, on one frame loop.
  React.useEffect(() => {
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let last = performance.now()
    const start = last
    let done = phaseRef.current !== "load"
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const root = rootRef.current
      // the load
      if (!done) {
        const elapsed = now - start
        const external = progressRef.current
        let target = external === undefined ? omSimulated(elapsed / Math.max(400, durationMs)) : Math.min(1, Math.max(0, external / 100))
        if (rushRef.current) target = 1
        const k = 1 - Math.exp(-dt / (rushRef.current ? 90 : 170))
        let shown = shownRef.current + (target - shownRef.current) * k
        if (target >= 1 && shown > 0.995) shown = 1
        shownRef.current = Math.max(shownRef.current, shown)
        const s = shownRef.current
        if (keyRef.current) keyRef.current.style.strokeDashoffset = String(1 - s)
        const p = Math.round(s * 100)
        if (p !== pctRef.current) {
          pctRef.current = p
          if (numRef.current) numRef.current.textContent = String(p)
          if (ratioRef.current) ratioRef.current.textContent = omRatio(s)
          if (p % 10 === 0 || p === 100) setPct(p)
        }
        if (s >= 1 && (elapsed >= minLoadMs || rushRef.current)) {
          done = true
          setPct(100)
          setPhase("unveil")
        }
      }
      // the parallax
      const pt = pointerRef.current
      if (root && !reduced) {
        const ease = 1 - Math.exp(-dt / 220)
        pt.x += (pt.tx - pt.x) * ease
        pt.y += (pt.ty - pt.y) * ease
        const sx = 50 + pt.tx * 24
        const sy = 42 + pt.ty * 22
        pt.sx += (sx - pt.sx) * ease
        pt.sy += (sy - pt.sy) * ease
        root.style.setProperty("--om-px", (pt.x * 14).toFixed(2) + "px")
        root.style.setProperty("--om-py", (pt.y * 10).toFixed(2) + "px")
        root.style.setProperty("--om-sx", pt.sx.toFixed(2) + "%")
        root.style.setProperty("--om-sy", pt.sy.toFixed(2) + "%")
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs, minLoadMs])

  // Unveil → landing → (with children) exit → done.
  React.useEffect(() => {
    if (phase === "unveil") {
      const t = setTimeout(() => setPhase("landing"), UNVEIL_MS)
      return () => clearTimeout(t)
    }
    if (phase === "landing") {
      if (liveRef.current) liveRef.current.textContent = wordmark + ". " + (tagline || "")
      onLoadedRef.current?.()
      if (hasChildren && holdMs > 0) {
        const t = setTimeout(() => setPhase("exit"), holdMs)
        return () => clearTimeout(t)
      }
      return
    }
    if (phase === "exit") {
      const t = setTimeout(() => {
        setPhase("done")
        onCompleteRef.current?.()
      }, EXIT_MS)
      return () => clearTimeout(t)
    }
  }, [phase, hasChildren, holdMs, wordmark, tagline])

  const rush = React.useCallback(() => {
    if (!skippable || phaseRef.current !== "load") return
    rushRef.current = true
  }, [skippable])

  const onKey = (e: React.KeyboardEvent) => {
    if (phase !== "load") return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      rush()
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const pt = pointerRef.current
    pt.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2))
    pt.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2))
  }

  const onPointerLeave = () => {
    pointerRef.current.tx = 0
    pointerRef.current.ty = 0
  }

  const enter = (e: React.MouseEvent) => {
    onEnterRef.current?.()
    if (hasChildren) {
      e.preventDefault()
      if (phaseRef.current === "landing") setPhase("exit")
    }
  }

  const keyPath = React.useMemo(() => omMeander(200, 200, 162, 24, 28), [])
  const bars = React.useMemo(() => omBars(omHash(wordmark), 34, 92), [wordmark])

  if (phase === "done") return <>{children}</>

  const cover = omCover(natural.w, natural.h, size.w, size.h, focal[0], focal[1])
  const transfer = omTransfer(threshold, softness, subject)
  const ringPx = Math.round(Math.max(200, Math.min(560, Math.min(size.w || 900, size.h || 700) * 0.54)))
  const pills = phase === "load" ? (pct >= 50 ? 2 : pct >= 20 ? 1 : 0) : 2
  const leftNav = nav.slice(0, Math.ceil(nav.length / 2))
  const rightNav = nav.slice(Math.ceil(nav.length / 2))
  const taglineWords = (tagline || "").split(/\s+/).filter(Boolean)
  const maskReady = behind && natural.w > 0 && size.w >= behindBelow
  const maskStyle = maskReady ? { WebkitMask: "url(#" + uid + "-mask)", mask: "url(#" + uid + "-mask)" } : undefined

  const vars = {
    "--om-stage": pal.stage,
    "--om-text": pal.text,
    "--om-muted": pal.muted,
    "--om-accent": pal.accent,
    "--om-word": pal.word,
    "--om-rule": pal.rule,
    "--om-glow": pal.glow,
    "--om-glow-a": hexAlpha(pal.glow, tone === "vellum" ? 0.5 : 0.24),
    "--om-glow-b": hexAlpha(pal.glow, 0.5),
    "--om-stage-a": hexAlpha(pal.stage, 0.55),
    "--om-stage-b": hexAlpha(pal.stage, tone === "vellum" ? 0 : 0.78),
    "--om-stage-c": hexAlpha(pal.stage, 0.6),
    "--om-stage-d": hexAlpha(pal.stage, 0.25),
    "--om-face": faceDef.family,
    "--om-weight": String(faceDef.weight),
    "--om-tracking": String(faceDef.tracking),
    "--om-base": String(metrics.base + (chars.initial ? 0.1 : 0)),
    "--om-cap": String(metrics.cap),
    "--om-ratio-y": ringPx >= 300 ? "calc(50% + " + ringPx + "px * 0.17)" : "calc(50% + " + ringPx / 2 + "px + 18px)",
    "--om-script": SCRIPT_FAMILY,
    "--om-ui": UI_FAMILY,
    "--om-serif": SERIF_FAMILY,
    "--om-fs": fs + "px",
    "--om-exposure": String(Math.max(0.2, exposure)),
    "--om-ring": ringPx + "px",
    "--om-fx": Math.round(focal[0] * 100) + "%",
    "--om-fy": Math.round(focal[1] * 100) + "%",
    "--om-grain": tone === "vellum" ? 0.16 : tone === "carmine" ? 0.12 : 0.09,
    height,
  } as React.CSSProperties

  return (
    <div
      ref={rootRef}
      className={"om-root " + className}
      style={vars}
      data-phase={phase}
      data-tone={tone}
      data-face={face}
      data-up={up ? "true" : "false"}
      data-pills={pills}
      data-duotone={isDuotone ? "true" : "false"}
      data-instant={instant ? "true" : "false"}
      onClick={rush}
      onKeyDown={onKey}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      tabIndex={phase === "load" && skippable ? 0 : -1}
      aria-busy={phase === "load"}
    >
      <style dangerouslySetInnerHTML={{ __html: OM_CSS }} />
      <svg className="om-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id={uid + "-lum"} colorInterpolationFilters="sRGB" x="0" y="0" width="1" height="1">
            <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope={transfer.slope} intercept={transfer.intercept} />
              <feFuncG type="linear" slope={transfer.slope} intercept={transfer.intercept} />
              <feFuncB type="linear" slope={transfer.slope} intercept={transfer.intercept} />
            </feComponentTransfer>
          </filter>
          {maskReady && (
            <mask id={uid + "-mask"} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width={size.w} height={size.h} style={{ maskType: "luminance" }}>
              <rect x="0" y="0" width={size.w} height={size.h} fill="#fff" />
              <image href={image} x={cover.x} y={cover.y} width={cover.w} height={cover.h} preserveAspectRatio="none" filter={"url(#" + uid + "-lum)"} />
            </mask>
          )}
        </defs>
      </svg>

      {hasChildren && <div className="om-page">{children}</div>}

      <div ref={stageRef} className="om-stage">
        <div className="om-par">
          {image && (
            <img
              className="om-paint"
              src={image}
              alt={imageAlt}
              draggable={false}
              decoding="async"
              style={{ left: cover.x, top: cover.y, width: cover.w || "100%", height: cover.h || "100%", maxWidth: "none" }}
            />
          )}
          <div className="om-duo om-duo-a" />
          <div className="om-duo om-duo-b" />
          <div className="om-grade" />
          <div className="om-spot" />
          <div className="om-wordlayer" style={maskStyle} data-front={maskReady ? "false" : "true"}>
            <div className="om-wordclip">
              <h1 className="om-word" aria-label={wordmark}>
                {chars.initial && (
                  <span className="om-init" aria-hidden="true">
                    {chars.initial}
                  </span>
                )}
                {chars.rest.map((ch, k) =>
                  ch === " " ? (
                    <span key={k} className="om-sp" aria-hidden="true" />
                  ) : (
                    <span key={k} className="om-l" style={{ "--i": k } as React.CSSProperties} aria-hidden="true">
                      {ch}
                    </span>
                  ),
                )}
              </h1>
            </div>
          </div>
        </div>
        {grain && <div className="om-grain" style={{ backgroundImage: "url(" + grain + ")" }} aria-hidden="true" />}
        <div className="om-flash" aria-hidden="true" />

        <div className="om-chrome">
          <header className="om-top om-ui">
            <nav aria-label="Primary, left">
              <ul className="om-navl">
                {leftNav.map((l, k) => (
                  <li key={k} style={{ "--i": k } as React.CSSProperties}>
                    {l.href ? <a href={l.href}>{l.label}</a> : <button type="button">{l.label}</button>}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="om-brand">{brand}</div>
            <nav aria-label="Primary, right">
              <ul className="om-navr">
                {rightNav.map((l, k) => (
                  <li key={k} style={{ "--i": k + leftNav.length } as React.CSSProperties}>
                    {l.href ? <a href={l.href}>{l.label}</a> : <button type="button">{l.label}</button>}
                  </li>
                ))}
              </ul>
            </nav>
          </header>
          <div className="om-rule" data-gap={eyebrow ? "true" : "false"} aria-hidden="true" />
          {eyebrow && (
            <div ref={eyebrowRef} className="om-eyebrow om-ui">
              {eyebrow}
            </div>
          )}

          {labels[0] && <div className="om-pill om-pill-l om-ui">{labels[0]}</div>}
          {labels[1] && <div className="om-pill om-pill-r om-ui">{labels[1]}</div>}

          {STARS.map((s, k) => (
            <div key={k} className={"om-star" + (s.small ? " om-star-s" : "") + (s.under ? " om-star-c" : "")} style={{ left: s.x, top: s.y, "--i": k } as React.CSSProperties} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d={STAR_PATH} fill="currentColor" />
              </svg>
            </div>
          ))}

          {asides[0] && (
            <aside className="om-aside om-aside-l">
              <b>{asides[0].title}</b>
              <p>{asides[0].text}</p>
            </aside>
          )}
          {asides[1] && (
            <aside className="om-aside om-aside-r">
              <b>{asides[1].title}</b>
              <p>{asides[1].text}</p>
            </aside>
          )}

          <div className="om-loader" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={loadingLabel}>
            <svg className="om-ring" viewBox="0 0 400 400" aria-hidden="true">
              <circle className="om-ring-hair" cx="200" cy="200" r="188" />
              <circle className="om-ring-hair" cx="200" cy="200" r="136" />
              <path className="om-ring-key om-ring-key-ghost" d={keyPath} />
              <path ref={keyRef} className="om-ring-key" d={keyPath} pathLength={1} style={{ strokeDashoffset: skipIntro ? 0 : 1 }} />
            </svg>
            <p className="om-num" aria-hidden="true">
              <span ref={numRef}>{skipIntro ? 100 : 0}</span>
            </p>
          </div>
          <div className="om-ratio om-ui" aria-hidden="true">
            <span ref={ratioRef}>{skipIntro ? "1.0000" : "0.0000"}</span>
            <i />
            <span>{loadingLabel}</span>
          </div>

          <div className="om-copy">
            {taglineWords.length > 0 && (
              <p className="om-tagline">
                {taglineWords.map((w, k) => (
                  <React.Fragment key={k}>
                    <span style={{ "--i": k } as React.CSSProperties}>{w}</span>
                    {k < taglineWords.length - 1 ? " " : null}
                  </React.Fragment>
                ))}
              </p>
            )}
            {cta &&
              (cta.href ? (
                <a className="om-cta" href={cta.href} onClick={enter}>
                  {cta.label}
                </a>
              ) : (
                <button type="button" className="om-cta" onClick={enter}>
                  {cta.label}
                </button>
              ))}
          </div>

          {annotations.map((a, k) => (
            <div key={k} className="om-ann" style={{ left: a.x + "%", top: a.y + "%", "--i": k } as React.CSSProperties} aria-hidden="true">
              <svg viewBox="0 0 58 30" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M0.5 8V0.5H8M50 0.5H57.5V8M57.5 22V29.5H50M8 29.5H0.5V22" />
              </svg>
              <span className="om-ui">{a.label}</span>
            </div>
          ))}

          <div className="om-foot">
            <svg className="om-bars" viewBox="0 0 92 22" aria-hidden="true">
              {bars.map((b, k) => (
                <rect key={k} x={b.x} y="0" width={b.w} height="22" fill="currentColor" />
              ))}
            </svg>
            <div className="om-plate om-ui">
              {plate}
              {plate ? " · " : ""}
              <span>{phase === "load" ? "" : "1.0000"}</span>
            </div>
          </div>
          {skippable && phase === "load" && (
            <button type="button" className="om-skip om-ui" onClick={rush}>
              Skip
            </button>
          )}
          <div ref={liveRef} className="om-live" aria-live="polite" />
        </div>
      </div>
    </div>
  )
}

export type OldMastersPaletteOverride = Partial<OldMastersPalette>
