"use client"

import * as React from "react"

// Gilded Gaze Footer
//
// A closing poster. The house line sits alone at the top in heavy display
// type. Below it a portrait rises out of the bottom edge, her eyes ignite, and
// molten gold pours out of them, across her temples, into two baroque wings of
// curling acanthus scrolls, paisleys, rosettes and hanging drops that grow out
// to the edges of the page. The link columns sit in the quiet corners under
// the wings.
//
// Every ornament is drawn in this file as SVG from a seed. The only thing
// fetched is the portrait itself (a prop), so the piece recolours with a
// palette and survives installation. React is the only import.

export type GgLink = { label: string; href?: string }
export type GgColumn = { title: string; links: GgLink[] }
export type GgSocialIcon = "instagram" | "x" | "linkedin" | "youtube" | "github" | "facebook" | "mail"
export type GgSocial = { icon: GgSocialIcon; href?: string; label?: string }
export type GgPt = [number, number]
export type GgPortrait = {
  src: string
  alt?: string
  /** Where her eyes are, as fractions of the image: [[x, y], [x, y]], left then right. */
  eyes?: [GgPt, GgPt]
  /** Optional cut-out: the subject's outline as fractions of the image. Without it, a soft oval vignette. */
  outline?: GgPt[]
}
export type GgPalette = {
  /** Seven stops of the metal, dark to light and back. */
  metal: string[]
  edge: string
  shadow: string
  /** The wing's ground under the ornament, from the temple outward. */
  ground: string[]
  /** The enamel inlays, used in turn. */
  enamel: string[]
  enamelInk: string[]
  pearl: string
  pearlEdge: string
  /** The eye's white-hot core, its rim, the halo and the lens flare. */
  core: string
  coreOuter: string
  halo: string
  flare: string
  /** Warm light thrown over her face. */
  wash: string
  spark: string
  /** Molten stream: hot end at the eye, cooling into the metal. */
  stream: string
  /** UI accent: column diamonds, link underlines, social fill. */
  accent: string
  accentInk: string
}
export type GgPreset = "gold" | "moon"
export type GgProps = {
  kicker?: string
  title?: string
  subtitle?: string
  /** One letter of the subtitle set small, like the "m" in the house line. "" for none. */
  quirk?: string
  description?: string
  brand?: string
  brandHref?: string
  copyright?: string
  columns?: GgColumn[]
  socials?: GgSocial[]
  portrait?: GgPortrait
  preset?: GgPreset
  palette?: GgPaletteInput
  /** Which arrangement of scrolls and motifs to grow. */
  seed?: number
  /** Scene height. A definite length. */
  sceneHeight?: string
  displayFont?: string
  fontFamily?: string
  /** Optional stylesheet to inject once (e.g. a Google Fonts URL for Anton). */
  fontHref?: string
  backToTop?: boolean
  parallax?: boolean
  className?: string
  style?: React.CSSProperties
  id?: string
}

const GG_CSS = `
.gg-root { position: relative; isolation: isolate; overflow: hidden; --gg-px: 0; --gg-py: 0; --gg-near: 0; --gg-sp: 1; --gg-gutter: clamp(20px, 4vw, 64px); -webkit-font-smoothing: antialiased; }
.gg-root *, .gg-root *::before, .gg-root *::after { box-sizing: border-box; }
.gg-statement { position: relative; z-index: 2; text-align: center; padding: clamp(64px, 9vw, 132px) var(--gg-gutter) 0; }
.gg-stage { position: relative; margin-top: clamp(4px, 1.5vw, 24px); }
.gg-scene { position: relative; overflow: hidden; }
.gg-links { display: grid; grid-template-columns: minmax(0, 1fr); gap: 28px; padding: 40px var(--gg-gutter) 36px; }
.gg-nav { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px clamp(20px, 4vw, 48px); }
@media (min-width: 768px) { .gg-links { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(20px, 4vw, 48px); } }
@media (min-width: 1280px) {
  .gg-links { position: absolute; left: 0; right: 0; bottom: 30px; z-index: 3; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 var(--gg-gutter); pointer-events: none; }
  .gg-nav { display: flex; gap: clamp(32px, 3.4vw, 56px); pointer-events: auto; }
  .gg-col { min-width: 104px; }
}

.gg-head { margin: 0; font-family: var(--gg-display); font-weight: 700; font-synthesis: none; text-transform: uppercase; line-height: 0.9; color: var(--color-foreground, #111); }
.gg-kicker { display: block; font-size: clamp(20px, 2.2vw, 30px); letter-spacing: 0.06em; margin-bottom: 0.24em; }
.gg-title { display: block; font-size: clamp(64px, 9.6vw, 142px); letter-spacing: -0.01em; }
.gg-sub { display: block; font-size: clamp(36px, 5.2vw, 76px); letter-spacing: 0.01em; margin-top: 0.12em; }
.gg-quirk { display: inline-block; font-size: 0.5em; line-height: 1; vertical-align: baseline; margin: 0 0.04em; opacity: 0; }
.gg-in .gg-quirk { animation: ggDrop 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) 1.15s both; }
.gg-line { display: block; overflow: hidden; padding: 0.04em 0.08em 0.08em; margin: -0.04em -0.08em -0.08em; }
.gg-line-in { display: block; transform: translateY(112%); }
.gg-in .gg-line-in { animation: ggLineUp 1.05s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: var(--d, 0s); }
.gg-desc { max-width: 46ch; margin: clamp(18px, 2.2vw, 28px) auto 0; font-size: 13.5px; line-height: 1.6; color: var(--color-muted-foreground, #666); }
.gg-fade { opacity: 0; }
.gg-in .gg-fade { animation: ggFadeUp 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: var(--d, 0s); }

.gg-col-title { margin: 0 0 14px; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; display: flex; align-items: center; gap: 9px; color: var(--color-foreground, #111); }
.gg-col-title::before { content: ""; width: 7px; height: 7px; flex: none; background: var(--gg-accent); transform: rotate(45deg); }
.gg-col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 9px; }
.gg-link { position: relative; display: inline-block; font-size: 14px; line-height: 1.35; color: var(--color-muted-foreground, #666); text-decoration: none; padding-bottom: 2px; transition: color 0.25s, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.gg-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--gg-accent); transform: scaleX(0); transform-origin: left; transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.gg-link:hover, .gg-link:focus-visible { color: var(--color-foreground, #111); transform: translateX(3px); }
.gg-link:hover::after, .gg-link:focus-visible::after { transform: scaleX(1); }
.gg-link:focus-visible { outline: 2px solid var(--gg-accent); outline-offset: 3px; border-radius: 2px; }

.gg-bar { position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 14px 24px; flex-wrap: wrap; padding: 18px var(--gg-gutter) 22px; border-top: 1px solid var(--color-border, #e5e5e5); font-size: 12.5px; color: var(--color-muted-foreground, #666); }
.gg-copy { margin: 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.gg-brand { font-family: var(--gg-display); font-weight: 700; font-synthesis: none; text-transform: uppercase; letter-spacing: 0.1em; font-size: 15px; color: var(--color-foreground, #111); text-decoration: none; }
.gg-brand::after { content: ""; display: inline-block; width: 5px; height: 5px; margin: 0 0 3px 12px; background: var(--gg-accent); transform: rotate(45deg); }
.gg-brand:focus-visible { outline: 2px solid var(--gg-accent); outline-offset: 3px; }
.gg-top-btn { background: none; border: 0; font: inherit; color: inherit; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; letter-spacing: 0.14em; text-transform: uppercase; font-size: 11px; padding: 6px 2px; border-radius: 3px; transition: color 0.25s; }
.gg-top-btn svg { width: 10px; height: 10px; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.gg-top-btn:hover { color: var(--color-foreground, #111); }
.gg-top-btn:hover svg { transform: translateY(-3px); }
.gg-top-btn:focus-visible { outline: 2px solid var(--gg-accent); outline-offset: 3px; }
.gg-socials { display: flex; gap: 10px; list-style: none; margin: 0; padding: 0; }
.gg-social { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--color-border, #e5e5e5); display: inline-flex; align-items: center; justify-content: center; color: var(--color-foreground, #111); --gg-icon-bg: var(--color-background, #fff); transition: background 0.3s, border-color 0.3s, color 0.3s, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.gg-social svg { width: 15px; height: 15px; }
.gg-social:hover, .gg-social:focus-visible { background: var(--gg-accent); border-color: var(--gg-accent); color: var(--gg-accent-ink); --gg-icon-bg: var(--gg-accent); transform: translateY(-2px); outline: none; }
.gg-social:focus-visible { box-shadow: 0 0 0 3px var(--color-background, #fff), 0 0 0 5px var(--gg-accent); }

.gg-layer { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; display: block; pointer-events: none; }
.gg-portrait-wrap { opacity: 0; }
.gg-lit .gg-portrait-wrap { animation: ggRise 1.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.gg-portrait { transition: transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1); transform: translate(calc(var(--gg-px) * -5px), calc(var(--gg-py) * -3px + (1 - var(--gg-sp)) * 26px)); }
.gg-wing-wrap { position: absolute; inset: 0; transition: transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1); }
.gg-wing-wrap-r { transform: translate(calc(var(--gg-px) * 10px + (var(--gg-sp) - 1) * 6vw), calc(var(--gg-py) * 6px)); }
.gg-wing-wrap-l { transform: translate(calc(var(--gg-px) * 10px + (1 - var(--gg-sp)) * 6vw), calc(var(--gg-py) * 6px)); }
.gg-wing { overflow: visible; will-change: transform; }
.gg-lit .gg-wing-r { animation: ggBreatheR 7.5s ease-in-out 4.2s infinite alternate; }
.gg-lit .gg-wing-l { animation: ggBreatheL 7.5s ease-in-out 5.3s infinite alternate; }
.gg-glow { opacity: 0; filter: blur(9px); }
.gg-lit .gg-glow { animation: ggFade 1.2s ease-out 1s both; }
.gg-stream { opacity: 0; }
.gg-lit .gg-stream { animation: ggStream 0.9s cubic-bezier(0.3, 0.7, 0.2, 1) both; animation-delay: calc(1s + var(--o) * 0.08s); }
.gg-grow { transform: scale(0); }
.gg-lit .gg-grow { animation: ggGrow 2.3s cubic-bezier(0.3, 0.55, 0.2, 1) 1.45s both; }
.gg-motif { opacity: 0; }
.gg-lit .gg-motif { animation: ggPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; animation-delay: calc(1.6s + var(--k) * 1.7s); }
.gg-clasp { opacity: 0; }
.gg-lit .gg-clasp { animation: ggPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s both; }
.gg-drop-in { opacity: 0; }
.gg-lit .gg-drop-in { animation: ggHang 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both; animation-delay: calc(2.6s + var(--k) * 1.1s); }
.gg-lit .gg-drop { animation: ggSway 3.4s ease-in-out infinite alternate; animation-delay: calc(var(--k) * -3.4s); }
.gg-beads { opacity: 0; }
.gg-lit .gg-beads { animation: ggFade 1.2s ease-out 3.4s both; }
.gg-flash { opacity: 0; }
.gg-eye { position: absolute; overflow: visible; max-width: none; pointer-events: none; }
.gg-eye-glow { mix-blend-mode: screen; }
.gg-near { transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1); transform: scale(calc(1 + var(--gg-near) * 0.45)); }
.gg-wash, .gg-core, .gg-halo, .gg-flare { opacity: 0; }
.gg-lit .gg-wash { animation: ggFade 1.8s ease-out 0.7s both; }
.gg-lit .gg-core { animation: ggCore 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s both, ggFlicker 2.7s ease-in-out 1.7s infinite; }
.gg-lit .gg-halo { animation: ggBloom 1.2s cubic-bezier(0.2, 0.7, 0.2, 1) 0.85s both, ggFlicker 3.1s ease-in-out 2.1s infinite; }
.gg-lit .gg-flare { animation: ggFlare 1s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: calc(1.05s + var(--d, 0s)); }
.gg-spark { opacity: 0; }
.gg-lit .gg-spark { animation: ggTwinkle 3.8s ease-in-out infinite; animation-delay: calc(3.6s + var(--d, 0s)); }
.gg-ring, .gg-burst { opacity: 0; }
.gg-surge .gg-ring { animation: ggRing 1.25s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: var(--d, 0s); }
.gg-surge .gg-burst { animation: ggBurst 1s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: var(--d, 0s); }
.gg-surge .gg-surge-g { animation: ggSurge 1.3s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.gg-surge .gg-flash { animation: ggFlash 1s ease-out 0.12s both; }
.gg-surge .gg-rip { animation: ggRipple 0.7s cubic-bezier(0.3, 0.7, 0.3, 1) both; animation-delay: calc(0.1s + var(--k) * 0.6s); }
.gg-hit { position: absolute; z-index: 2; border: 0; padding: 0; margin: 0; background: transparent; border-radius: 999px; cursor: pointer; }
.gg-hit:focus-visible { outline: 2px dashed var(--gg-accent); outline-offset: 6px; }
.gg-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@keyframes ggLineUp { from { transform: translateY(112%); } to { transform: none; } }
@keyframes ggDrop { from { opacity: 0; transform: translateY(-140%); } 55% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes ggFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes ggRise { from { opacity: 0; transform: translateY(44px); } to { opacity: 1; transform: none; } }
@keyframes ggFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ggCore { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
@keyframes ggFlicker { 0%, 100% { opacity: 1; } 37% { opacity: 0.84; } 61% { opacity: 0.96; } 80% { opacity: 0.8; } }
@keyframes ggBloom { from { opacity: 0; transform: scale(0.15); } to { opacity: 1; transform: scale(1); } }
@keyframes ggFlare { from { opacity: 0; transform: scaleX(0); } 45% { opacity: 1; } to { opacity: 1; transform: scaleX(1); } }
@keyframes ggStream { from { opacity: 0; transform: scaleX(0); } 30% { opacity: 1; } to { opacity: 1; transform: scaleX(1); } }
@keyframes ggGrow { from { transform: scale(0); } to { transform: scale(1); } }
@keyframes ggPop { from { opacity: 0; transform: scale(0); } 70% { opacity: 1; transform: scale(1.18); } to { opacity: 1; transform: scale(1); } }
@keyframes ggHang { from { opacity: 0; transform: translateY(-14px) scaleY(0.4); } to { opacity: 1; transform: none; } }
@keyframes ggSway { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
@keyframes ggTwinkle { 0%, 100% { opacity: 0; transform: scale(0.2) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes ggBreatheR { to { transform: rotate(0.8deg) scale(1.01); } }
@keyframes ggBreatheL { to { transform: rotate(-0.8deg) scale(1.01); } }
@keyframes ggRing { from { opacity: 0.9; transform: scale(0.2); } to { opacity: 0; transform: scale(18); } }
@keyframes ggBurst { from { opacity: 1; transform: translate(0, 0) scale(1); } to { opacity: 0; transform: translate(calc(var(--bx) * 1px), calc(var(--by) * 1px)) scale(0.2); } }
@keyframes ggSurge { 0% { transform: scale(1); } 30% { transform: scale(1.9); } 100% { transform: scale(1); } }
@keyframes ggFlash { 0% { opacity: 0; } 30% { opacity: 0.42; } 100% { opacity: 0; } }
@keyframes ggRipple { 0% { transform: none; } 40% { transform: scale(1.24); } 100% { transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .gg-root .gg-line-in, .gg-root .gg-quirk, .gg-root .gg-fade, .gg-root .gg-portrait-wrap, .gg-root .gg-glow, .gg-root .gg-stream, .gg-root .gg-grow, .gg-root .gg-motif, .gg-root .gg-clasp, .gg-root .gg-drop-in, .gg-root .gg-beads, .gg-root .gg-wash, .gg-root .gg-core, .gg-root .gg-halo, .gg-root .gg-flare { animation: none !important; opacity: 1; transform: none; }
  .gg-root .gg-wing, .gg-root .gg-wing-wrap, .gg-root .gg-portrait, .gg-root .gg-near, .gg-root .gg-surge-g, .gg-root .gg-rip, .gg-root .gg-drop { animation: none !important; transform: none; transition: none; }
  .gg-root .gg-spark, .gg-root .gg-ring, .gg-root .gg-burst { animation: none !important; opacity: 0; }
  .gg-root .gg-link, .gg-root .gg-social, .gg-root .gg-top-btn svg { transition: none; }
}
`

// #region wing
// Pure geometry. A wing is built in a local frame with the eye at (0, 0) and
// +x pointing away from the face; the left wing is the same drawing mirrored.
// Molten streams leave the eye and cross the temple to a jewelled clasp.
// From there five gold currents run out through the wing, each ending in a
// volute, and sprout acanthus scrolls on alternate sides. Paisleys, rosettes,
// leaves and buds are packed between them on an enamel ground that follows
// the ornament, so the silhouette is the ornament's own, and pearl drops hang
// from the lower edge.
export const GG_H = 720
/** The portrait's height in stage units, and how much of it stands above the bottom edge. */
export const GG_PORTRAIT_H = 900
export const GG_PORTRAIT_ASPECT = 0.8
export const GG_PORTRAIT_SHOW = 0.82
/** The far tip of the wing, in local units. */
export const GG_REACH = 742
/** Highest anything reaches above the eye. */
export const GG_TOP = 262
export const GG_ROOT: GgPt = [150, 16]
export type GgBox = { x: number; y: number; w: number; h: number }
export type GgSize = { w: number; h: number }
export type GgMotif = { x: number; y: number; a: number; r: number; kind: number; fill: number; ink: number; k: number }
export type GgScroll = { d: string; inlay: string; core: string; spine: string; eye: GgPt; er: number; fill: number; k: number }
export type GgDrop = { x: number; y: number; len: number; r: number; k: number }
export type GgStream = { d: string; o: number }
export type GgWingSpec = {
  env: GgPt[]
  ground: string
  currents: GgScroll[]
  scrolls: GgScroll[]
  streams: GgStream[]
  glow: string
  motifs: GgMotif[]
  drops: GgDrop[]
  beads: string[]
  sparks: GgPt[]
}

/** The envelope the ornament grows inside: up and out from the temple, round the tip, back under. */
export const GG_WING: GgPt[] = [
  [160, -36], [222, -86], [302, -138], [392, -184], [487, -218], [582, -236], [667, -238], [722, -214],
  [742, -156], [740, -80], [724, -2], [696, 70], [652, 130], [594, 170], [521, 190], [446, 178],
  [374, 150], [306, 118], [238, 88], [181, 60], [152, 34], [146, 4],
]

/** Unit motifs, drawn once per wing and stamped with <use>. */
export const GG_PAISLEY = "M0 1C-0.75 1 -1 0.4 -0.9 -0.1C-0.8 -0.65 -0.3 -1 0.35 -1.35C0.15 -1 0.95 -0.75 0.92 0C0.9 0.6 0.55 1 0 1Z"
export const GG_LEAF = "M0 -1C0.5 -0.55 0.52 0.45 0 1C-0.52 0.45 -0.5 -0.55 0 -1Z"
export const GG_TEAR = "M0 -1C0.45 -0.2 0.7 0.25 0.7 0.55C0.7 0.95 0.35 1.2 0 1.2C-0.35 1.2 -0.7 0.95 -0.7 0.55C-0.7 0.25 -0.45 -0.2 0 -1Z"

export const ggRng = (seed: number) => {
  let s = seed >>> 0 || 1
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const ggClamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const ggRad = (d: number) => (d * Math.PI) / 180
export const ggF = (n: number) => String(Math.round(n * 10) / 10)
const ggPts = (pts: GgPt[]) => pts.map((p) => ggF(p[0]) + " " + ggF(p[1])).join("L")

/** Eight petals, as one path. */
export const ggRosette = () => {
  const base: GgPt[] = [[0, -0.18], [0.32, -0.35], [0.3, -0.85], [0, -1], [-0.3, -0.85], [-0.32, -0.35], [0, -0.18]]
  let d = ""
  for (let i = 0; i < 8; i++) {
    const c = Math.cos(ggRad(i * 45))
    const s = Math.sin(ggRad(i * 45))
    const q = base.map((p) => ggF(p[0] * c - p[1] * s) + " " + ggF(p[0] * s + p[1] * c))
    d += "M" + q[0] + "C" + q[1] + " " + q[2] + " " + q[3] + "C" + q[4] + " " + q[5] + " " + q[6] + "Z"
  }
  return d
}

/**
 * A scroll's spine. It leaves (x, y) heading `dir` degrees and turns ever
 * faster (a clothoid) while its steps shorten, so it runs out almost straight
 * and winds into a tight volute. `curl` is the total turn in radians, `sign`
 * which way it winds (+1 turns toward the left-hand normal in y-down space).
 */
export const ggScrollSpine = (x: number, y: number, dir: number, len: number, curl: number, sign: number, n = 44, ease = 2.3, shrink = 0.74): GgPt[] => {
  const pts: GgPt[] = [[x, y]]
  let norm = 0
  for (let i = 0; i < n; i++) norm += 1 - shrink * (i / n)
  let px = x
  let py = y
  for (let i = 0; i < n; i++) {
    const ds = (len / norm) * (1 - shrink * (i / n))
    const th = ggRad(dir) + sign * curl * Math.pow((i + 0.5) / n, ease)
    px += Math.cos(th) * ds
    py += Math.sin(th) * ds
    pts.push([px, py])
  }
  return pts
}

/**
 * A current's spine: a gentle S from `from` out along `ang` degrees, then a
 * volute of `turns` turns that winds in from radius r0 without a kink.
 */
export const ggCurrentSpine = (from: GgPt, ang: number, len: number, bend: number, sign: number, r0: number, turns = 1.3): GgPt[] => {
  const pol = (r: number, d: number): GgPt => [r * Math.cos(ggRad(d)), r * Math.sin(ggRad(d))]
  const d1 = pol(len, ang)
  const end: GgPt = [from[0] + d1[0], from[1] + d1[1]]
  const b1 = pol(len * 0.36, ang - bend)
  const c1 = pol(len * 0.3, ang + bend)
  const c: GgPt = [end[0] - c1[0], end[1] - c1[1]]
  const pts = ggCubic(from, [from[0] + b1[0], from[1] + b1[1]], c, end, 46)
  const th = Math.atan2(end[1] - c[1], end[0] - c[0])
  const cx = end[0] - Math.sin(th) * r0 * sign
  const cy = end[1] + Math.cos(th) * r0 * sign
  const f0 = Math.atan2(end[1] - cy, end[0] - cx)
  const m = 30
  for (let j = 1; j <= m; j++) {
    const f = f0 + (sign * j * turns * Math.PI * 2) / m
    const r = r0 * (1 - (0.8 * j) / m)
    pts.push([cx + r * Math.cos(f), cy + r * Math.sin(f)])
  }
  return pts
}

/** A scroll's width at u along it: a quick swell off the stem, then a long taper into the volute. */
export const ggScrollWidth = (u: number, w: number) =>
  w * Math.pow(1 - ggClamp(u, 0, 1), 0.85) * (0.55 + 0.45 * Math.sin((Math.min(1, u / 0.22) * Math.PI) / 2)) + 0.7

/** Arc length of a polyline. */
export const ggLength = (pts: GgPt[]) => {
  let s = 0
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return s
}

/** A ribbon round a spine. `lobes` bumps the outer edge into acanthus lobes; `k` narrows it for inlays. */
export const ggRibbon = (pts: GgPt[], w: number, sign: number, k = 1, lobes = 0, u0 = 0, u1 = 1) => {
  const n = pts.length - 1
  const a: GgPt[] = []
  const b: GgPt[] = []
  for (let i = Math.round(u0 * n); i <= Math.round(u1 * n); i++) {
    const p = pts[i]
    const q = pts[Math.max(0, i - 1)]
    const r = pts[Math.min(n, i + 1)]
    let tx = r[0] - q[0]
    let ty = r[1] - q[1]
    const l = Math.hypot(tx, ty) || 1
    tx /= l
    ty /= l
    const u = i / n
    const span = Math.max(1e-6, u1 - u0)
    // Inlays are cartouches: pointed at both ends.
    const pinch = k < 1 ? Math.pow(Math.sin(Math.PI * ggClamp((u - u0) / span, 0, 1)), 0.45) : 1
    const half = (ggScrollWidth(u, w) * k * pinch) / 2
    const lobe = lobes > 0 && u < 0.72 ? lobes * half * Math.pow(Math.abs(Math.sin(u * Math.PI * 5.5)), 0.6) * (1 - u / 0.72) : 0
    const lx = -ty * sign
    const ly = tx * sign
    a.push([p[0] + lx * half, p[1] + ly * half])
    b.push([p[0] - lx * (half + lobe), p[1] - ly * (half + lobe)])
  }
  return "M" + ggPts(a) + "L" + ggPts(b.reverse()) + "Z"
}

/** A ribbon whose width runs linearly from w0 to w1, for the streams. */
export const ggTaper = (pts: GgPt[], w0: number, w1: number) => {
  const n = pts.length - 1
  const a: GgPt[] = []
  const b: GgPt[] = []
  for (let i = 0; i <= n; i++) {
    const p = pts[i]
    const q = pts[Math.max(0, i - 1)]
    const r = pts[Math.min(n, i + 1)]
    let tx = r[0] - q[0]
    let ty = r[1] - q[1]
    const l = Math.hypot(tx, ty) || 1
    tx /= l
    ty /= l
    const h = (w0 + ((w1 - w0) * i) / n) / 2
    a.push([p[0] - ty * h, p[1] + tx * h])
    b.push([p[0] + ty * h, p[1] - tx * h])
  }
  return "M" + ggPts(a) + "L" + ggPts(b.reverse()) + "Z"
}

/** Points along a cubic from a to d. */
export const ggCubic = (a: GgPt, b: GgPt, c: GgPt, d: GgPt, n = 24): GgPt[] => {
  const out: GgPt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    out.push([
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ])
  }
  return out
}

/** Closed Catmull-Rom through the points, `n` samples per span. */
export const ggSmooth = (pts: GgPt[], n = 8): GgPt[] => {
  const out: GgPt[] = []
  const L = pts.length
  for (let i = 0; i < L; i++) {
    const p0 = pts[(i - 1 + L) % L]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % L]
    const p3 = pts[(i + 2) % L]
    for (let j = 0; j < n; j++) {
      const t = j / n
      const t2 = t * t
      const t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  return out
}

export const ggInside = (poly: GgPt[], x: number, y: number) => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

/** Distance from a point to the closed outline. */
export const ggEdgeDist = (poly: GgPt[], x: number, y: number) => {
  let m = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j]
    const [bx, by] = poly[i]
    const dx = bx - ax
    const dy = by - ay
    const t = ggClamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1)
    m = Math.min(m, Math.hypot(x - ax - dx * t, y - ay - dy * t))
  }
  return m
}

/** How big a wing gets: reach toward the stage edge, never taller than the room above the eye, bleed off a phone. */
export const ggWingScale = (W: number, ex: number, ey: number) =>
  Math.min(ggClamp((W / 2 - Math.abs(ex) - 44) / GG_REACH, W < 900 ? 0.72 : 0.6, 1.2), Math.max(0.4, (ey - 12) / GG_TOP))

/** The portrait box: centred, cropped by the bottom edge. On a phone she fills the width and her veil bleeds off it. */
export const ggPortraitBox = (W: number): GgBox => {
  const w = Math.min(GG_PORTRAIT_H * GG_PORTRAIT_ASPECT, W * (W < 900 ? 1.16 : 0.94))
  const h = w / GG_PORTRAIT_ASPECT
  return { x: -w / 2, y: GG_H - h * GG_PORTRAIT_SHOW, w, h }
}

/** Where a fraction of the image lands on the stage, after the image is slice-fitted into the box. */
export const ggFit = (box: GgBox, nat: GgSize | null, f: GgPt): GgPt => {
  const iw = nat && nat.w > 0 ? nat.w : box.w
  const ih = nat && nat.h > 0 ? nat.h : box.h
  const s = Math.max(box.w / iw, box.h / ih)
  const dw = iw * s
  const dh = ih * s
  return [box.x + (box.w - dw) / 2 + f[0] * dw, box.y + (box.h - dh) / 2 + f[1] * dh]
}

const ggCircle = (x: number, y: number, r: number) =>
  "M" + ggF(x - r) + " " + ggF(y) + "a" + ggF(r) + " " + ggF(r) + " 0 1 0 " + ggF(r * 2) + " 0a" + ggF(r) + " " + ggF(r) + " 0 1 0 " + ggF(-r * 2) + " 0Z"

/** Every path and stamp of one wing, in its local frame. Deterministic for a seed. */
export const ggWing = (seed: number): GgWingSpec => {
  const rnd = ggRng(seed)
  const env = ggSmooth(GG_WING, 10)
  const fits = (pts: GgPt[]) => pts.every((p) => ggInside(env, p[0], p[1]) || ggEdgeDist(env, p[0], p[1]) < 14)
  const span = GG_REACH - GG_ROOT[0]
  const reach = (x: number, y: number) => ggClamp(Math.hypot(x - GG_ROOT[0], y - GG_ROOT[1]) / span, 0, 1)
  const mk = (pts: GgPt[], w: number, sign: number, lobes: number, fill: number): GgScroll => {
    const n = pts.length - 1
    return {
      d: ggRibbon(pts, w, sign, 1, lobes),
      inlay: ggRibbon(pts, w, sign, 0.42, 0, 0.06, 0.6),
      core: "M" + ggPts(pts.slice(Math.round(n * 0.08), Math.round(n * 0.58) + 1)),
      spine: "M" + ggPts(pts.slice(Math.round(n * 0.56), Math.round(n * 0.97) + 1)),
      eye: pts[n],
      er: Math.max(2.2, w * 0.17),
      fill,
      k: reach(pts[n][0], pts[n][1]),
    }
  }
  const tangent = (pts: GgPt[], i: number) => {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
  }

  // The currents: long, nearly straight, each ending in a big volute.
  const currents: GgScroll[] = []
  const scrolls: GgScroll[] = []
  const lanes: { pts: GgPt[]; w: number }[] = []
  const trails: { pts: GgPt[]; w: number }[] = []
  const fan = [
    [-35, 1, 30],
    [-18, -1, 27],
    [-2, 1, 33],
    [14, -1, 26],
    [30, 1, 22],
  ]
  fan.forEach(([ang, sg, w], ci) => {
    let len = 560 - Math.abs(ang) * 2
    const bend = (ci % 2 ? 1 : -1) * (14 + rnd() * 10)
    const spine = (l: number) => ggCurrentSpine(GG_ROOT, ang, l, bend, sg, 16 + l * 0.05)
    let pts = spine(len)
    while (!fits(pts) && len > 220) {
      len *= 0.95
      pts = spine(len)
    }
    currents.push(mk(pts, w, sg, 0.18, ci % 3))
    lanes.push({ pts, w })
    // Acanthus scrolls off alternate sides, smaller toward the tip.
    let side = ci % 2 ? 1 : -1
    for (let u = 0.1 + rnd() * 0.05; u < 0.68; u += 0.05 + rnd() * 0.04) {
      const i = Math.round(u * (pts.length - 1))
      const p = pts[i]
      const dir = tangent(pts, i) + side * (46 + rnd() * 26)
      const bw = w * (0.48 + 0.26 * rnd()) * (1 - u * 0.45)
      const back = rnd() < 0.62 ? side : -side
      const base = (62 + 112 * rnd()) * (1.1 - u * 0.38)
      for (const f of [1, 0.8, 0.62, 0.46]) {
        const b = ggScrollSpine(p[0], p[1], dir, base * f, Math.PI * (2.1 + rnd() * 0.7), back, 40)
        if (!fits(b)) continue
        scrolls.push(mk(b, bw, back, 0.32, Math.floor(rnd() * 3)))
        trails.push({ pts: b, w: bw })
        // A small curl off the bigger scrolls.
        if (base * f > 100) {
          const j = 14
          const c = ggScrollSpine(b[j][0], b[j][1], tangent(b, j) - back * 64, 34 + rnd() * 26, Math.PI * 2.4, -back, 30)
          if (fits(c)) scrolls.push(mk(c, bw * 0.55, -back, 0, Math.floor(rnd() * 3)))
        }
        break
      }
      side = -side
    }
  })

  // Motifs: big to small, kept off the currents and off each other.
  const cands: { x: number; y: number; r: number }[] = []
  let minY = Infinity
  let maxY = -Infinity
  for (const p of env) {
    minY = Math.min(minY, p[1])
    maxY = Math.max(maxY, p[1])
  }
  for (let i = 0; i < 4200; i++) {
    const x = GG_ROOT[0] + rnd() * span
    const y = minY + rnd() * (maxY - minY)
    const t = reach(x, y)
    if (!ggInside(env, x, y)) continue
    const edge = ggClamp(0.5 + ggEdgeDist(env, x, y) / 56, 0.5, 1)
    cands.push({ x, y, r: (7 + 13 * Math.sin(Math.PI * ggClamp(0.12 + t * 0.78, 0, 1))) * edge * (0.82 + rnd() * 0.4) })
  }
  cands.sort((a, b) => b.r - a.r)
  const motifs: GgMotif[] = []
  for (const c of cands) {
    if (!ggInside(env, c.x, c.y) || ggEdgeDist(env, c.x, c.y) < c.r * 0.55) continue
    let ok = true
    for (const m of motifs) {
      if (Math.hypot(m.x - c.x, m.y - c.y) < m.r + c.r + 1.5) {
        ok = false
        break
      }
    }
    if (!ok) continue
    for (const lane of lanes) {
      for (let i = 0; i < lane.pts.length && ok; i += 2) {
        if (Math.hypot(lane.pts[i][0] - c.x, lane.pts[i][1] - c.y) < lane.w * 0.42 + c.r * 0.6) ok = false
      }
      if (!ok) break
    }
    if (!ok) continue
    const roll = rnd()
    const kind = c.r > 14 ? (roll < 0.58 ? 0 : 1) : roll < 0.3 ? 1 : roll < 0.64 ? 3 : 2
    const fill = Math.floor(rnd() * 3)
    motifs.push({
      x: c.x,
      y: c.y,
      a: (Math.atan2(c.y - GG_ROOT[1], c.x - GG_ROOT[0]) * 180) / Math.PI + 90 + (rnd() - 0.5) * 60,
      r: c.r,
      kind,
      fill,
      ink: (fill + 1 + Math.floor(rnd() * 2)) % 3,
      k: reach(c.x, c.y),
    })
  }

  // The enamel ground: one cell under every motif and along every scroll,
  // so its edge is the ornament's own edge, never a cut-out.
  let ground = ""
  for (const m of motifs) ground += ggCircle(m.x, m.y, m.r * 1.16 + 2.5)
  for (const lane of lanes) for (let i = 0; i < lane.pts.length - 8; i += 3) ground += ggCircle(lane.pts[i][0], lane.pts[i][1], lane.w * 0.85)
  for (const t of trails) for (let i = 2; i < t.pts.length - 10; i += 4) ground += ggCircle(t.pts[i][0], t.pts[i][1], t.w * 0.75 + 3)

  // Pearl drops off the lower edge.
  const drops: GgDrop[] = []
  let run = 0
  for (let i = 1; i < env.length; i++) {
    const p = env[i]
    const q = env[i - 1]
    run += Math.hypot(p[0] - q[0], p[1] - q[1])
    const b = env[(i + 1) % env.length]
    let nx = b[1] - q[1]
    let ny = q[0] - b[0]
    const l = Math.hypot(nx, ny) || 1
    nx /= l
    ny /= l
    if (ggInside(env, p[0] + nx * 3, p[1] + ny * 3)) {
      nx = -nx
      ny = -ny
    }
    if (ny < 0.5 || p[0] < 250 || run < 46) continue
    run = 0
    drops.push({ x: p[0], y: p[1] - 6, len: 10 + rnd() * 22, r: 3.6 + rnd() * 2.6, k: reach(p[0], p[1]) })
  }

  // The streams: four braided strands from the eye to the clasp, hot at the eye.
  const streams: GgStream[] = [
    [-6, -16, 16, 1],
    [0, 4, 34, 0],
    [6, 18, 20, 2],
    [-2, -4, 12, 3],
  ].map(([a, end, w, o]) => {
    const r = GG_ROOT
    const pts = ggCubic([6, a * 0.4], [r[0] * 0.35, a * 2.2], [r[0] * 0.7, end * 0.9], [r[0] + 6, r[1] + end * 0.5], 26)
    return { d: ggTaper(pts, 2, w), o }
  })
  const glow = "M4 0C" + ggF(GG_ROOT[0] * 0.4) + " 0 " + ggF(GG_ROOT[0] * 0.8) + " " + ggF(GG_ROOT[1]) + " " + ggF(GG_ROOT[0] + 120) + " " + ggF(GG_ROOT[1] + 4)

  // Gold dust off the tip and the lower edge.
  const beads: string[] = []
  for (let k = 0; k < 3; k++) {
    let d = ""
    for (let i = 0; i < 14; i++) {
      const p = env[Math.floor(rnd() * env.length)]
      if (p[0] < 320) continue
      const x = p[0] + (rnd() - 0.3) * 70
      const y = p[1] + 14 + rnd() * 70
      if (ggInside(env, x, y)) continue
      d += "M" + ggF(x) + " " + ggF(y) + "l0.01 0"
    }
    beads.push(d)
  }

  const sparks: GgPt[] = motifs
    .filter((m) => m.k > 0.4 && m.r > 13)
    .slice(0, 6)
    .map((m) => [m.x + m.r * 0.5, m.y - m.r * 0.6] as GgPt)

  return { env, ground, currents, scrolls, streams, glow, motifs, drops, beads, sparks }
}
// #endregion

const GG_PRESETS: { [k: string]: GgPalette } = {
  gold: {
    metal: ["#5a3806", "#b8862a", "#f4dd98", "#d2a33a", "#fff2c6", "#bf8b22", "#6b460b"],
    edge: "#3f2604",
    shadow: "rgba(66, 30, 0, 0.32)",
    ground: ["#6e0d17", "#8c1a1a", "#4a0b1e"],
    enamel: ["#c0222d", "#0f8590", "#2350b5"],
    enamelInk: ["#5c0b13", "#063d42", "#0d2356"],
    pearl: "#fff6dc",
    pearlEdge: "#8a5f14",
    core: "#fffdf2",
    coreOuter: "#ffe68a",
    halo: "#ffc23a",
    flare: "#ffe6a3",
    wash: "#ffb43a",
    spark: "#fff3c4",
    stream: "#ffd054",
    accent: "#c99a2e",
    accentInk: "#1a1206",
  },
  moon: {
    metal: ["#363b49", "#99a3b5", "#eef2f8", "#b5bfcf", "#ffffff", "#8c96a9", "#41475a"],
    edge: "#232835",
    shadow: "rgba(8, 12, 28, 0.32)",
    ground: ["#101c44", "#1b2b63", "#150f36"],
    enamel: ["#2449a8", "#5a2f8a", "#118090"],
    enamelInk: ["#0b1d4d", "#241038", "#063840"],
    pearl: "#f5f8ff",
    pearlEdge: "#596378",
    core: "#f8fbff",
    coreOuter: "#d2e7ff",
    halo: "#8cc4ff",
    flare: "#def0ff",
    wash: "#6ea8ff",
    spark: "#eaf4ff",
    stream: "#bcdcff",
    accent: "#9ab0d3",
    accentInk: "#0b1020",
  },
}

const GG_ICONS: { [k: string]: React.ReactNode } = {
  instagram: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
    </g>
  ),
  x: <path fill="currentColor" d="M17.5 3h3l-7.1 8.1L21.8 21h-6.4l-4.6-6-5.3 6H2.5l7.6-8.7L2.2 3h6.6l4.2 5.5L17.5 3zm-1.1 16.2h1.7L7.4 4.7H5.6l10.8 14.5z" />,
  linkedin: <path fill="currentColor" d="M4.5 9h3.6v11.5H4.5zM6.3 3.5a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2M10.2 9h3.4v1.6c.5-.9 1.7-1.9 3.6-1.9 3.8 0 4.5 2.5 4.5 5.7v6.1h-3.6v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.5h-3.6z" />,
  youtube: (
    <g>
      <path fill="currentColor" d="M22.5 7.2a2.7 2.7 0 0 0-1.9-1.9C18.9 4.8 12 4.8 12 4.8s-6.9 0-8.6.5A2.7 2.7 0 0 0 1.5 7.2 28 28 0 0 0 1 12a28 28 0 0 0 .5 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 8.6.5 8.6.5s6.9 0 8.6-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 23 12a28 28 0 0 0-.5-4.8z" />
      <path fill="var(--gg-icon-bg, #fff)" d="M9.8 15.1V8.9l5.7 3.1z" />
    </g>
  ),
  github: (
    <path
      fill="currentColor"
      d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"
    />
  ),
  facebook: <path fill="currentColor" d="M14 8.2h3V4.4h-3c-2.9 0-5.1 2.3-5.1 5.1v2.3H6v3.8h2.9v8h4v-8h3l.9-3.8h-3.9V9.6c0-.8.4-1.4 1.1-1.4z" />,
  mail: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7.5 12 13l8.5-5.5" />
    </g>
  ),
}


const GG_SOCIAL_NAMES: { [k: string]: string } = {
  instagram: "Instagram",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  github: "GitHub",
  facebook: "Facebook",
  mail: "Email",
}

const GG_DEFAULT_COLUMNS: GgColumn[] = [
  { title: "Studio", links: [{ label: "Work", href: "#" }, { label: "Services", href: "#" }, { label: "Process", href: "#" }, { label: "Journal", href: "#" }] },
  { title: "Company", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }, { label: "Contact", href: "#" }] },
  { title: "Promote", links: [{ label: "Campaigns", href: "#" }, { label: "Brand film", href: "#" }, { label: "Launches", href: "#" }, { label: "Case studies", href: "#" }] },
  { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "Cookies", href: "#" }] },
]

const GG_DEFAULT_SOCIALS: GgSocial[] = [{ icon: "instagram", href: "#" }, { icon: "x", href: "#" }, { icon: "linkedin", href: "#" }, { icon: "youtube", href: "#" }]

/** Himanshu Kiradiya, Ajmer, Rajasthan, on Unsplash. The focal-point crop keeps her centred. */
const GG_DEFAULT_PORTRAIT: GgPortrait = {
  src: "https://images.unsplash.com/photo-1724301964759-374723c8ee7d?auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.35&fp-z=1.25&w=1100&h=1375&q=85",
  alt: "An elderly Rajasthani woman in a magenta veil, looking straight at you",
  eyes: [
    [0.425, 0.307],
    [0.583, 0.311],
  ],
  outline: [
    [0.5, 0.109], [0.57, 0.116], [0.63, 0.15], [0.67, 0.22], [0.69, 0.3], [0.71, 0.38], [0.74, 0.45], [0.787, 0.53],
    [0.833, 0.61], [0.88, 0.7], [0.91, 0.79], [0.935, 0.88], [0.96, 0.95], [0.98, 1.02], [0.0, 1.02], [-0.02, 0.9],
    [0.03, 0.86], [0.085, 0.78], [0.16, 0.69], [0.22, 0.6], [0.278, 0.5], [0.305, 0.4], [0.318, 0.31], [0.33, 0.237],
    [0.352, 0.178], [0.407, 0.126],
  ],
}

const GG_DISPLAY = '"Anton", Impact, "Haettenschweiler", "Arial Narrow Bold", "Franklin Gothic Demi Cond", "Helvetica Neue", Arial, sans-serif'
const GG_BODY = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const GG_SPARK_D = "M0 -7Q0 0 7 0Q0 0 0 7Q0 0 -7 0Q0 0 0 -7Z"
const GG_EYE_R = 230

export default function GildedGazeFooter({
  kicker = "The",
  title = "Art of",
  subtitle = "Promoting",
  quirk = "m",
  description = "The art of promoting is the skill of turning ideas into meaningful connections: blending creativity and strategy to capture attention, communicate value and inspire action.",
  brand = "Gilt & Gaze",
  brandHref = "#",
  copyright,
  columns = GG_DEFAULT_COLUMNS,
  socials = GG_DEFAULT_SOCIALS,
  portrait = GG_DEFAULT_PORTRAIT,
  preset = "gold",
  palette,
  seed = 7,
  sceneHeight = "clamp(500px, 46vw, 720px)",
  displayFont = GG_DISPLAY,
  fontFamily = GG_BODY,
  fontHref,
  backToTop = true,
  parallax = true,
  className = "",
  style,
  id,
}: GgProps) {
  const pal: GgPalette = { ...(GG_PRESETS[preset] || GG_PRESETS.gold), ...(palette || {}) }
  const uid = React.useId().replace(/:/g, "")
  const rootRef = React.useRef(null as HTMLElement | null)
  const sceneRef = React.useRef(null as HTMLDivElement | null)
  const [box, setBox] = React.useState({ w: 0, h: 0 })
  const [nat, setNat] = React.useState(null as GgSize | null)
  const [loaded, setLoaded] = React.useState(false)
  const [seen, setSeen] = React.useState(false)
  const [inView, setInView] = React.useState(false)
  const [surge, setSurge] = React.useState(0)
  const [still, setStill] = React.useState(false)
  const pointer = React.useRef({ x: 0, y: 0, has: false })
  const raf = React.useRef(0)
  const surgeTimer = React.useRef(0)

  // The stage: GG_H units tall, as wide as the box's aspect makes it.
  const W = box.h > 0 ? (box.w / box.h) * GG_H : 1600
  const px = box.h > 0 ? box.h / GG_H : 1
  const pbox = ggPortraitBox(W)
  const eyesF = portrait.eyes || GG_DEFAULT_PORTRAIT.eyes!
  const eyeL = ggFit(pbox, nat, eyesF[0])
  const eyeR = ggFit(pbox, nat, eyesF[1])
  const eyeMid: GgPt = [(eyeL[0] + eyeR[0]) / 2, (eyeL[1] + eyeR[1]) / 2]
  const scaleR = ggWingScale(W, eyeR[0], eyeR[1])
  const scaleL = ggWingScale(W, eyeL[0], eyeL[1])
  const wing = React.useMemo(() => ggWing(seed), [seed])
  const rosette = React.useMemo(() => ggRosette(), [])
  const lit = seen && loaded

  // A stylesheet the page asks for comes in once, shared across instances.
  React.useEffect(() => {
    if (!fontHref || typeof document === "undefined") return
    if (document.querySelector('link[href="' + fontHref + '"]')) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = fontHref
    document.head.appendChild(link)
  }, [fontHref])

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setStill(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  // Preload the portrait: the scene stays dormant until she is here, and her
  // real size places the eyes.
  React.useEffect(() => {
    let live = true
    setLoaded(false)
    setNat(null)
    const im = new Image()
    im.onload = () => {
      if (!live) return
      setNat({ w: im.naturalWidth, h: im.naturalHeight })
      setLoaded(true)
    }
    im.onerror = () => {
      if (live) setLoaded(true)
    }
    im.src = portrait.src
    return () => {
      live = false
    }
  }, [portrait.src])

  // Follow the scene's box, wake when it is on screen, and read the scroll
  // only while it is.
  React.useEffect(() => {
    const scene = sceneRef.current
    const root = rootRef.current
    if (!scene || !root) return
    const measure = () => {
      const r = scene.getBoundingClientRect()
      setBox((b) => (Math.abs(b.w - r.width) < 0.5 && Math.abs(b.h - r.height) < 0.5 ? b : { w: r.width, h: r.height }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(scene)
    let scrolling = false
    let tick = 0
    const onScroll = () => {
      if (tick) return
      tick = requestAnimationFrame(() => {
        tick = 0
        const r = scene.getBoundingClientRect()
        const vh = window.innerHeight || 1
        const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 2
        const sp = atEnd ? 1 : ggClamp((vh - r.top) / Math.max(1, r.height), 0, 1)
        root.style.setProperty("--gg-sp", sp.toFixed(3))
      })
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === scene) {
            if (e.isIntersecting) {
              setSeen(true)
              if (!scrolling) {
                scrolling = true
                window.addEventListener("scroll", onScroll, { passive: true })
                onScroll()
              }
            } else if (scrolling) {
              scrolling = false
              window.removeEventListener("scroll", onScroll)
            }
          } else if (e.target === root && e.isIntersecting) {
            setInView(true)
          }
        }
      },
      { threshold: [0, 0.12] },
    )
    io.observe(scene)
    io.observe(root)
    return () => {
      ro.disconnect()
      io.disconnect()
      if (scrolling) window.removeEventListener("scroll", onScroll)
      if (tick) cancelAnimationFrame(tick)
    }
  }, [])

  // Pointer: the wings lean toward it, the portrait leans away, and the eyes
  // burn brighter the closer it comes.
  const flush = React.useCallback(() => {
    raf.current = 0
    const root = rootRef.current
    const scene = sceneRef.current
    if (!root || !scene) return
    const p = pointer.current
    if (!p.has) {
      root.style.setProperty("--gg-px", "0")
      root.style.setProperty("--gg-py", "0")
      root.style.setProperty("--gg-near", "0")
      return
    }
    const r = root.getBoundingClientRect()
    const s = scene.getBoundingClientRect()
    const nx = ggClamp(((p.x - r.left) / Math.max(1, r.width)) * 2 - 1, -1, 1)
    const ny = ggClamp(((p.y - r.top) / Math.max(1, r.height)) * 2 - 1, -1, 1)
    const k = s.height / GG_H
    const mx = s.left + s.width / 2 + eyeMid[0] * k
    const my = s.top + eyeMid[1] * k
    const near = 1 - ggClamp(Math.hypot(p.x - mx, p.y - my) / (GG_EYE_R * 1.15 * k), 0, 1)
    root.style.setProperty("--gg-px", nx.toFixed(3))
    root.style.setProperty("--gg-py", ny.toFixed(3))
    root.style.setProperty("--gg-near", near.toFixed(3))
  }, [eyeMid[0], eyeMid[1]])

  const onMove = (e: React.PointerEvent) => {
    if (!parallax || still) return
    pointer.current = { x: e.clientX, y: e.clientY, has: true }
    if (!raf.current) raf.current = requestAnimationFrame(flush)
  }
  const onLeave = () => {
    pointer.current = { x: 0, y: 0, has: false }
    if (!raf.current) raf.current = requestAnimationFrame(flush)
  }
  React.useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      window.clearTimeout(surgeTimer.current)
    },
    [],
  )

  // A click on her eyes: rings, a surge of light, and a ripple that runs out
  // through the ornament.
  const ignite = () => {
    setSurge((n) => n + 1)
    window.clearTimeout(surgeTimer.current)
    surgeTimer.current = window.setTimeout(() => setSurge(0), 1500)
  }

  const toTop = () => {
    if (typeof window === "undefined") return
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" })
  }

  // The subtitle with its one small letter.
  const qi = quirk ? subtitle.toLowerCase().indexOf(quirk.toLowerCase()) : -1
  const subNode =
    qi < 0 ? (
      subtitle
    ) : (
      <>
        {subtitle.slice(0, qi)}
        <span className="gg-quirk">{subtitle[qi]}</span>
        {subtitle.slice(qi + 1)}
      </>
    )

  const half = Math.ceil(columns.length / 2)
  const year = new Date().getFullYear()
  const copy = copyright ?? "© " + year + " " + brand + ". All rights reserved."

  const stageView = ggF(-W / 2) + " 0 " + ggF(W) + " " + GG_H
  const cut =
    portrait.outline && portrait.outline.length > 2
      ? "M" +
        ggSmooth(portrait.outline.map((f) => ggFit(pbox, nat, f)), 6)
          .map((p) => ggF(p[0]) + " " + ggF(p[1]))
          .join("L") +
        "Z"
      : ""
  const eyeSize = GG_EYE_R * 2 * px
  const hitW = (Math.abs(eyeR[0] - eyeL[0]) + 100) * px
  const hitH = 76 * px

  const renderColumn = (c: GgColumn, i: number) => (
    <div className="gg-col gg-fade" key={c.title + i} style={{ "--d": 0.5 + i * 0.08 + "s" } as React.CSSProperties}>
      <h3 className="gg-col-title">{c.title}</h3>
      <ul>
        {c.links.map((l, j) => (
          <li key={l.label + j}>
            <a className="gg-link" href={l.href || "#"}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )

  const renderWing = (side: number, eye: GgPt, scale: number) => {
    const idp = uid + (side > 0 ? "r" : "l")
    const vb = ggF(-W / 2 - eye[0]) + " " + ggF(-eye[1]) + " " + ggF(W) + " " + GG_H
    const metal = "url(#" + idp + "m)"
    const enamel = (i: number) => "url(#" + idp + "e" + (i % pal.enamel.length) + ")"
    const ns = "non-scaling-stroke"
    const R = GG_ROOT
    const drawScroll = (s: GgScroll, i: number, big: boolean) => (
      <g key={i}>
        <path d={s.d} fill={pal.shadow} transform="translate(2.5 4)" />
        <path d={s.d} fill={metal} stroke={pal.edge} strokeWidth={big ? 1.3 : 1} strokeLinejoin="round" />
        <path d={s.inlay} fill={enamel(s.fill)} stroke={pal.pearl} strokeWidth="0.8" strokeOpacity="0.9" />
        {big ? <path d={s.core} fill="none" stroke={pal.pearl} strokeWidth="3.6" strokeLinecap="round" strokeDasharray="0 9" /> : null}
        <path d={s.spine} fill="none" stroke={pal.metal[4]} strokeWidth={big ? 1.8 : 1.2} strokeLinecap="round" opacity="0.8" />
        <circle cx={ggF(s.eye[0])} cy={ggF(s.eye[1])} r={ggF(s.er * 1.55)} fill={metal} stroke={pal.edge} strokeWidth="0.8" />
        <circle cx={ggF(s.eye[0])} cy={ggF(s.eye[1])} r={ggF(s.er)} fill={enamel(s.fill + 1)} />
      </g>
    )
    return (
      <div className={"gg-wing-wrap " + (side > 0 ? "gg-wing-wrap-r" : "gg-wing-wrap-l")}>
        <svg
          className={"gg-layer gg-wing " + (side > 0 ? "gg-wing-r" : "gg-wing-l")}
          viewBox={vb}
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ transformOrigin: ggF(box.w / 2 + eye[0] * px) + "px " + ggF(eye[1] * px) + "px" }}
        >
          <defs>
            <linearGradient id={idp + "m"} x1="0" y1="0" x2="1" y2="1">
              {pal.metal.map((c, i) => (
                <stop key={i} offset={i / (pal.metal.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
            <linearGradient id={idp + "gr"} gradientUnits="userSpaceOnUse" x1={R[0]} y1="-120" x2={GG_REACH} y2="120">
              {pal.ground.map((c, i) => (
                <stop key={i} offset={i / Math.max(1, pal.ground.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
            {pal.enamel.map((c, i) => (
              <radialGradient key={i} id={idp + "e" + i} cx="0.4" cy="0.36" r="0.72">
                <stop offset="0" stopColor={c} />
                <stop offset="0.68" stopColor={c} />
                <stop offset="1" stopColor={pal.enamelInk[i] || c} />
              </radialGradient>
            ))}
            <linearGradient id={idp + "h"} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={R[0] + 10} y2="0">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.16" stopColor={pal.core} />
              <stop offset="0.42" stopColor={pal.stream} />
              <stop offset="0.75" stopColor={pal.metal[2]} />
              <stop offset="1" stopColor={pal.metal[3]} />
            </linearGradient>
            <linearGradient id={idp + "s"} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={R[0] + 130} y2="0">
              <stop offset="0" stopColor={pal.coreOuter} stopOpacity="1" />
              <stop offset="0.6" stopColor={pal.stream} stopOpacity="0.6" />
              <stop offset="1" stopColor={pal.stream} stopOpacity="0" />
            </linearGradient>
            <radialGradient id={idp + "mg"} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0.86" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </radialGradient>
            <mask id={idp + "mk"} maskUnits="userSpaceOnUse" x="-80" y="-440" width="1040" height="900">
              <g transform={"translate(" + R[0] + " " + R[1] + ")"}>
                <circle className="gg-grow" r="780" fill={"url(#" + idp + "mg)"} />
              </g>
            </mask>
            <g id={idp + "k0"}>
              <path d={GG_PAISLEY} stroke={pal.edge} strokeWidth="3.2" vectorEffect={ns} />
              <path d={GG_PAISLEY} stroke={metal} strokeWidth="1.8" vectorEffect={ns} />
              <path d={GG_PAISLEY} transform="translate(0.03 0.2) scale(0.56)" fill="currentColor" stroke={pal.pearl} strokeWidth="1" vectorEffect={ns} />
              <path d={GG_PAISLEY} transform="scale(0.8)" fill="none" stroke={pal.pearl} strokeWidth="2" strokeLinecap="round" strokeDasharray="0 4.6" vectorEffect={ns} opacity="0.9" />
              <circle cx="0.02" cy="0.36" r="0.13" fill={pal.pearl} />
            </g>
            <g id={idp + "k1"}>
              <path d={rosette} stroke={pal.edge} strokeWidth="2.8" vectorEffect={ns} />
              <path d={rosette} stroke={metal} strokeWidth="1.4" vectorEffect={ns} />
              <circle r="0.38" fill="currentColor" stroke={metal} strokeWidth="2" vectorEffect={ns} />
              <circle r="0.14" fill={pal.pearl} />
            </g>
            <g id={idp + "k2"}>
              <circle r="0.95" fill={metal} stroke={pal.edge} strokeWidth="1" vectorEffect={ns} />
              <circle r="0.6" stroke={pal.edge} strokeWidth="0.8" vectorEffect={ns} />
              <circle cx="-0.2" cy="-0.22" r="0.17" fill="#fff" opacity="0.85" />
            </g>
            <g id={idp + "k3"}>
              <path d={GG_LEAF} stroke={pal.edge} strokeWidth="2.6" vectorEffect={ns} />
              <path d={GG_LEAF} stroke={metal} strokeWidth="1.3" vectorEffect={ns} />
              <path d="M0 -0.78L0 0.78" stroke={pal.pearl} strokeWidth="1" vectorEffect={ns} opacity="0.85" />
            </g>
          </defs>
          <g transform={"scale(" + (side * scale).toFixed(4) + " " + scale.toFixed(4) + ")"}>
            <path className="gg-glow" d={wing.glow} fill="none" stroke={"url(#" + idp + "s)"} strokeWidth="42" strokeLinecap="round" />
            <g mask={"url(#" + idp + "mk)"}>
              <path d={wing.ground} fill={pal.shadow} transform="translate(3 6)" />
              <path d={wing.ground} fill={"url(#" + idp + "gr)"} />
              {wing.motifs.map((mo, i) => (
                <g key={i} transform={"translate(" + ggF(mo.x) + " " + ggF(mo.y) + ") rotate(" + ggF(mo.a) + ") scale(" + ggF(mo.r / (mo.kind === 0 ? 1.15 : mo.kind === 3 ? 0.9 : 1)) + ")"}>
                  <g className="gg-motif" style={{ "--k": ggF(mo.k) } as React.CSSProperties}>
                    <use className="gg-rip" style={{ "--k": ggF(mo.k) } as React.CSSProperties} href={"#" + idp + "k" + mo.kind} fill={enamel(mo.fill)} color={pal.enamel[mo.ink % pal.enamel.length]} />
                  </g>
                </g>
              ))}
              {wing.scrolls.map((s, i) => drawScroll(s, i, false))}
              {wing.currents.map((s, i) => drawScroll(s, i, true))}
              {wing.drops.map((d, i) => (
                <g key={i} transform={"translate(" + ggF(d.x) + " " + ggF(d.y) + ")"}>
                  <g className="gg-drop-in" style={{ "--k": ggF(d.k) } as React.CSSProperties}>
                    <g className="gg-drop" style={{ "--k": ggF(d.k) } as React.CSSProperties}>
                      <path d={"M0 0L0 " + ggF(d.len)} stroke={pal.metal[1]} strokeWidth="1.2" />
                      <circle cy={ggF(d.len)} r={ggF(d.r * 0.55)} fill={pal.pearl} stroke={pal.pearlEdge} strokeWidth="0.6" />
                      <path d={GG_TEAR} transform={"translate(0 " + ggF(d.len + d.r * 1.55) + ") scale(" + ggF(d.r) + ")"} fill={metal} stroke={pal.edge} strokeWidth="0.8" vectorEffect={ns} />
                      <circle cy={ggF(d.len + d.r * 2.1)} r={ggF(d.r * 0.36)} fill={enamel(i)} />
                    </g>
                  </g>
                </g>
              ))}
            </g>
            {wing.streams.map((st) => (
              <path key={st.o} className="gg-stream" style={{ "--o": st.o } as React.CSSProperties} d={st.d} fill={"url(#" + idp + "h)"} stroke={pal.metal[0]} strokeOpacity="0.35" strokeWidth="0.6" />
            ))}
            <g transform={"translate(" + R[0] + " " + R[1] + ")"}>
              <g className="gg-clasp">
                <use href={"#" + idp + "k1"} transform="scale(19)" fill={enamel(0)} color={pal.enamel[1]} />
                <circle r="7.5" fill={metal} stroke={pal.edge} strokeWidth="0.9" />
                <circle r="4.8" fill={enamel(2)} />
                <circle cx="-1.6" cy="-1.9" r="1.4" fill="#fff" opacity="0.85" />
              </g>
            </g>
            {wing.beads.map((d, k) => (
              <path className="gg-beads" key={k} d={d} fill="none" stroke={pal.metal[1]} strokeWidth={2 + k * 1.2} strokeLinecap="round" />
            ))}
            <path className="gg-flash" d={wing.ground} fill={pal.flare} style={{ mixBlendMode: "screen" }} />
          </g>
        </svg>
      </div>
    )
  }

  const renderEye = (eye: GgPt, side: number, key: string) => {
    const left = ggF(box.w / 2 + eye[0] * px - eyeSize / 2) + "px"
    const top = ggF(eye[1] * px - eyeSize / 2) + "px"
    const vb = -GG_EYE_R + " " + -GG_EYE_R + " " + GG_EYE_R * 2 + " " + GG_EYE_R * 2
    const idp = uid + key
    const bursts: GgPt[] = []
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3
      bursts.push([Math.cos(a) * (70 + (i % 3) * 25), Math.sin(a) * (70 + (i % 3) * 25)])
    }
    return (
      <React.Fragment key={key}>
        <svg className="gg-eye gg-eye-glow" viewBox={vb} style={{ left, top, width: eyeSize, height: eyeSize }} aria-hidden="true">
          <defs>
            <radialGradient id={idp + "h"} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={pal.coreOuter} stopOpacity="0.95" />
              <stop offset="0.28" stopColor={pal.halo} stopOpacity="0.6" />
              <stop offset="1" stopColor={pal.halo} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={idp + "f"} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={pal.flare} stopOpacity="1" />
              <stop offset="0.5" stopColor={pal.flare} stopOpacity="0.35" />
              <stop offset="1" stopColor={pal.flare} stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className="gg-near">
            <g className="gg-surge-g">
              <circle className="gg-halo" r="78" fill={"url(#" + idp + "h)"} />
              <g className="gg-flare" style={{ "--d": "0s" } as React.CSSProperties}>
                <ellipse cx={side * 95} rx="190" ry="7" fill={"url(#" + idp + "f)"} />
              </g>
              <g className="gg-flare" style={{ "--d": "0.15s" } as React.CSSProperties}>
                <ellipse cx={-side * 30} rx="70" ry="4.5" fill={"url(#" + idp + "f)"} />
              </g>
              <g className="gg-flare" style={{ "--d": "0.3s" } as React.CSSProperties}>
                <ellipse rx="4" ry="56" fill={"url(#" + idp + "f)"} />
              </g>
            </g>
          </g>
        </svg>
        <svg className="gg-eye" viewBox={vb} style={{ left, top, width: eyeSize, height: eyeSize }} aria-hidden="true">
          <defs>
            <radialGradient id={idp + "c"} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.45" stopColor={pal.core} />
              <stop offset="1" stopColor={pal.coreOuter} stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <g className="gg-near">
            <circle className="gg-ring" r="10" fill="none" stroke={pal.halo} strokeWidth="1.6" vectorEffect="non-scaling-stroke" style={{ "--d": "0s" } as React.CSSProperties} />
            <circle className="gg-ring" r="10" fill="none" stroke={pal.core} strokeWidth="1" vectorEffect="non-scaling-stroke" style={{ "--d": "0.18s" } as React.CSSProperties} />
            {bursts.map((b, i) => (
              <path key={i} className="gg-burst" d={GG_SPARK_D} fill={pal.spark} style={{ "--bx": b[0], "--by": b[1], "--d": i * 0.03 + "s" } as React.CSSProperties} />
            ))}
            <g className="gg-core">
              <ellipse rx="20" ry="12" fill={"url(#" + idp + "c)"} />
              <ellipse rx="9" ry="5" fill="#fff" />
            </g>
          </g>
        </svg>
      </React.Fragment>
    )
  }

  // Sparkles over the outer motifs, in stage coordinates.
  const sparks: { x: number; y: number; d: string; k: number }[] = []
  wing.sparks.forEach((p, i) => {
    sparks.push({ x: eyeR[0] + p[0] * scaleR, y: eyeR[1] + p[1] * scaleR, d: ((i * 0.53) % 3.8) + "s", k: 0.7 + (i % 3) * 0.3 })
    sparks.push({ x: eyeL[0] - p[0] * scaleL, y: eyeL[1] + p[1] * scaleL, d: ((i * 0.53 + 1.9) % 3.8) + "s", k: 0.7 + ((i + 1) % 3) * 0.3 })
  })

  const rootStyle = {
    fontFamily,
    "--gg-display": displayFont,
    "--gg-accent": pal.accent,
    "--gg-accent-ink": pal.accentInk,
    ...style,
  } as React.CSSProperties

  return (
    <footer
      ref={rootRef}
      id={id}
      className={"gg-root bg-background text-foreground " + (inView ? "gg-in " : "") + (lit ? "gg-lit " : "") + (surge ? "gg-surge " : "") + className}
      style={rootStyle}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <style>{GG_CSS}</style>

      <div className="gg-statement">
        <h2 className="gg-head">
          <span className="gg-kicker gg-line">
            <span className="gg-line-in" style={{ "--d": "0.05s" } as React.CSSProperties}>
              {kicker}
            </span>
          </span>
          <span className="gg-title gg-line">
            <span className="gg-line-in" style={{ "--d": "0.18s" } as React.CSSProperties}>
              {title}
            </span>
          </span>
          <span className="gg-sub gg-line">
            <span className="gg-line-in" style={{ "--d": "0.34s" } as React.CSSProperties}>
              {subNode}
            </span>
          </span>
        </h2>
        {description ? (
          <p className="gg-desc gg-fade" style={{ "--d": "0.7s" } as React.CSSProperties}>
            {description}
          </p>
        ) : null}
      </div>

      <div className="gg-stage">
        <div className="gg-scene" ref={sceneRef} style={{ height: sceneHeight }}>
          {box.w > 0 ? (
            <>
              <div className="gg-layer gg-portrait-wrap">
                <svg className="gg-layer gg-portrait" viewBox={stageView} preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <radialGradient id={uid + "pm"} cx="0.5" cy="0.44" r="0.5" gradientTransform="scale(1 1.55) translate(0 -0.18)">
                      <stop offset="0.5" stopColor="#fff" />
                      <stop offset="1" stopColor="#000" />
                    </radialGradient>
                    <filter id={uid + "pf"} x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="1.8" />
                    </filter>
                    <mask id={uid + "pmask"} maskUnits="userSpaceOnUse" x={pbox.x} y={pbox.y} width={pbox.w} height={pbox.h}>
                      {cut ? <path d={cut} fill="#fff" filter={"url(#" + uid + "pf)"} /> : <rect x={pbox.x} y={pbox.y} width={pbox.w} height={pbox.h} fill={"url(#" + uid + "pm)"} />}
                    </mask>
                    <radialGradient id={uid + "pw"} cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0" stopColor={pal.wash} stopOpacity="0.55" />
                      <stop offset="0.45" stopColor={pal.wash} stopOpacity="0.22" />
                      <stop offset="1" stopColor={pal.wash} stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <g mask={"url(#" + uid + "pmask)"}>
                    <image href={portrait.src} x={pbox.x} y={pbox.y} width={pbox.w} height={pbox.h} preserveAspectRatio="xMidYMid slice" />
                    <ellipse className="gg-wash" cx={eyeMid[0]} cy={eyeMid[1] + 10} rx="260" ry="180" fill={"url(#" + uid + "pw)"} style={{ mixBlendMode: "screen" }} />
                  </g>
                </svg>
              </div>
              {renderWing(-1, eyeL, scaleL)}
              {renderWing(1, eyeR, scaleR)}
              <svg className="gg-layer" viewBox={stageView} preserveAspectRatio="none" aria-hidden="true">
                {sparks.map((s, i) => (
                  <svg key={i} x={ggF(s.x)} y={ggF(s.y)} overflow="visible">
                    <g transform={"scale(" + s.k + ")"}>
                      <path className="gg-spark" d={GG_SPARK_D} fill={pal.spark} style={{ "--d": s.d } as React.CSSProperties} />
                    </g>
                  </svg>
                ))}
              </svg>
              {renderEye(eyeL, -1, "el")}
              {renderEye(eyeR, 1, "er")}
              <button
                type="button"
                className="gg-hit"
                aria-label="Light up her eyes"
                onClick={ignite}
                style={{ left: ggF(box.w / 2 + eyeMid[0] * px - hitW / 2) + "px", top: ggF(eyeMid[1] * px - hitH / 2) + "px", width: ggF(hitW) + "px", height: ggF(hitH) + "px" }}
              />
            </>
          ) : null}
          {portrait.alt ? <span className="gg-sr">{portrait.alt}</span> : null}
        </div>

        <div className="gg-links">
          <nav className="gg-nav" aria-label="Footer">
            {columns.slice(0, half).map(renderColumn)}
          </nav>
          <nav className="gg-nav" aria-label="More footer links">
            {columns.slice(half).map((c, i) => renderColumn(c, i + half))}
          </nav>
        </div>
      </div>

      <div className="gg-bar gg-fade" style={{ "--d": "0.9s" } as React.CSSProperties}>
        <p className="gg-copy">
          <a className="gg-brand" href={brandHref}>
            {brand}
          </a>
          <span>{copy}</span>
        </p>
        {backToTop ? (
          <button type="button" className="gg-top-btn" onClick={toTop}>
            <svg viewBox="0 0 10 10" aria-hidden="true">
              <path d="M5 1 9 5 5 9 1 5Z" fill="var(--gg-accent)" />
            </svg>
            Back to top
          </button>
        ) : null}
        <ul className="gg-socials">
          {socials.map((s, i) => (
            <li key={s.icon + i}>
              <a className="gg-social" href={s.href || "#"} aria-label={s.label || GG_SOCIAL_NAMES[s.icon] || s.icon}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {GG_ICONS[s.icon]}
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}

export type GgPaletteInput = Partial<GgPalette>
