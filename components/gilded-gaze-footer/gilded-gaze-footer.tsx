"use client"

import * as React from "react"

// Gilded Gaze Footer
//
// A closing poster. The house line sits alone at the top in heavy display
// type. Below it an illustrated elder rises out of the bottom edge, her eyes
// ignite, and molten gold pours out of them, across her temples, into two baroque wings of
// curling acanthus scrolls, paisleys, rosettes and hanging drops that grow out
// to the edges of the page. The link columns sit in the quiet corners under
// the wings.
//
// She and every ornament are drawn in this file as SVG, so nothing is fetched,
// the piece recolours with a palette, and it survives installation. A photo
// can stand in for her through the optional `portrait` prop. React is the
// only import.

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
  /** The image already has a transparent background: draw it as is, no mask. */
  cutout?: boolean
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
  /** Who the light pours from: an image (ideally a transparent cut-out) and where her eyes are. */
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
@property --gg-r { syntax: "<length>"; inherits: false; initial-value: 0px; }
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
.gg-body { transition: transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1); transform: translate(calc(var(--gg-px) * -6px), calc(var(--gg-py) * -4px + (1 - var(--gg-sp)) * 26px)); }
.gg-lit .gg-breath { animation: ggBreath 5.5s ease-in-out 3.2s infinite alternate; }
.gg-wing-wrap { position: absolute; inset: 0; transition: transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1), rotate 0.8s cubic-bezier(0.2, 0.7, 0.2, 1); transform: translate(calc(var(--gg-px) * -6px), calc(var(--gg-py) * -4px + (1 - var(--gg-sp)) * 26px)) scale(calc(0.84 + var(--gg-sp) * 0.16)); }
.gg-wing-wrap-r { rotate: calc(var(--gg-py) * 2.4deg + var(--gg-px) * -1deg); }
.gg-wing-wrap-l { rotate: calc(var(--gg-py) * -2.4deg + var(--gg-px) * -1deg); }
.gg-hit { pointer-events: auto; }
.gg-wing { overflow: visible; will-change: transform; }
.gg-lit .gg-wing-r { animation: ggBreatheR 7.5s ease-in-out 4.2s infinite alternate; }
.gg-lit .gg-wing-l { animation: ggBreatheL 7.5s ease-in-out 5.3s infinite alternate; }
.gg-glow { opacity: 0; filter: blur(9px); }
.gg-lit .gg-glow { animation: ggFade 1.2s ease-out 1s both; }
.gg-stream { opacity: 0; }
.gg-lit .gg-stream { animation: ggStream 0.9s cubic-bezier(0.3, 0.7, 0.2, 1) both; animation-delay: calc(1s + var(--o) * 0.08s); }
.gg-wing-clip { --gg-r: 0px; -webkit-mask-image: radial-gradient(circle at var(--gg-cx) var(--gg-cy), #000 var(--gg-r), transparent calc(var(--gg-r) + 90px)); mask-image: radial-gradient(circle at var(--gg-cx) var(--gg-cy), #000 var(--gg-r), transparent calc(var(--gg-r) + 90px)); }
.gg-lit .gg-wing-clip { animation: ggOpen 2.4s cubic-bezier(0.3, 0.55, 0.2, 1) 1.4s both; }
.gg-motif { opacity: 0; }
.gg-lit .gg-motif { animation: ggPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; animation-delay: calc(1.6s + var(--k) * 1.7s); }
.gg-filler { opacity: 0; }
.gg-lit .gg-filler { animation: ggFade 0.8s ease-out both; animation-delay: calc(1.9s + var(--k) * 1.6s); }
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
@keyframes ggOpen { from { --gg-r: 0px; } to { --gg-r: 1500px; } }
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
@keyframes ggBreath { to { transform: translateY(-3px); } }
@keyframes ggRipple { 0% { transform: none; } 40% { transform: scale(1.24); } 100% { transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .gg-root .gg-line-in, .gg-root .gg-quirk, .gg-root .gg-fade, .gg-root .gg-portrait-wrap, .gg-root .gg-glow, .gg-root .gg-stream, .gg-root .gg-motif, .gg-root .gg-filler, .gg-root .gg-clasp, .gg-root .gg-drop-in, .gg-root .gg-beads, .gg-root .gg-wash, .gg-root .gg-core, .gg-root .gg-halo, .gg-root .gg-flare { animation: none !important; opacity: 1; transform: none; }
  .gg-root .gg-wing, .gg-root .gg-wing-wrap, .gg-root .gg-body, .gg-root .gg-breath, .gg-root .gg-near, .gg-root .gg-surge-g, .gg-root .gg-rip, .gg-root .gg-drop { animation: none !important; transform: none; rotate: none; transition: none; }
  .gg-root .gg-wing-clip { animation: none !important; -webkit-mask-image: none; mask-image: none; }
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
export const GG_PORTRAIT_H = 830
export const GG_PORTRAIT_ASPECT = 0.8
export const GG_PORTRAIT_SHOW = 0.82
/** The far tip of the wing, in local units. */
export const GG_REACH = 1068
/** Highest anything reaches above the eye. */
export const GG_TOP = 268
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
  fillers: { d: string; k: number }[]
  drops: GgDrop[]
  beads: string[]
  sparks: GgPt[]
}

/**
 * The envelope the ornament grows inside: a sweeping band, narrow at the
 * temple and broadening outward, long enough to run off the edge of the page.
 */
export const GG_WING: GgPt[] = [
  [150, -34],
  [222, -80],
  [318, -128],
  [428, -168],
  [548, -198],
  [676, -220],
  [810, -234],
  [950, -242],
  [1036, -236],
  [1066, -150],
  [1068, -40],
  [1056, 72],
  [1030, 150],
  [910, 164],
  [780, 160],
  [652, 150],
  [534, 132],
  [424, 108],
  [326, 82],
  [238, 58],
  [172, 40],
  [144, 10],
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
  const base: GgPt[] = [
    [0, -0.18],
    [0.32, -0.35],
    [0.3, -0.85],
    [0, -1],
    [-0.3, -0.85],
    [-0.32, -0.35],
    [0, -0.18],
  ]
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

/** How big a wing gets: as tall as the room above the eye allows, a little smaller on narrow stages, and long enough to run off the page. */
export const ggWingScale = (W: number, _ex: number, ey: number) => ggClamp(Math.min((ey - 12) / GG_TOP, 0.4 + W / 3000), 0.5, 1)

/** The portrait box: centred and cropped by the bottom edge. On a phone she narrows so the wings have room either side. */
export const ggPortraitBox = (W: number): GgBox => {
  const w = Math.min(GG_PORTRAIT_H * GG_PORTRAIT_ASPECT, W * (W < 900 ? 0.8 : 0.94))
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
  // angle, winding, width, length: staggered so the volutes curl at different depths.
  const fan = [
    [-26, 1, 30, 520],
    [-14, -1, 27, 760],
    [-3, 1, 34, 430],
    [6, -1, 26, 640],
    [16, 1, 22, 820],
    [26, -1, 20, 380],
  ]
  fan.forEach(([ang, sg, w, l0], ci) => {
    let len = l0
    const bend = (ci % 2 ? 1 : -1) * (20 + rnd() * 12)
    const spine = (l: number) => ggCurrentSpine(GG_ROOT, ang, l, bend, sg, 24 + l * 0.04, 1.45)
    let pts = spine(len)
    while (!fits(pts) && len > 220) {
      len *= 0.95
      pts = spine(len)
    }
    currents.push(mk(pts, w, sg, 0.18, ci % 3))
    lanes.push({ pts, w })
    // Acanthus scrolls off alternate sides, smaller toward the tip.
    let side = ci % 2 ? 1 : -1
    for (let u = 0.08 + rnd() * 0.04; u < 0.74; u += 0.034 + rnd() * 0.03) {
      const i = Math.round(u * (pts.length - 1))
      const p = pts[i]
      const dir = tangent(pts, i) + side * (46 + rnd() * 26)
      const bw = w * (0.48 + 0.26 * rnd()) * (1 - u * 0.45)
      const back = rnd() < 0.62 ? side : -side
      const base = (48 + 96 * rnd()) * (1.05 - u * 0.3)
      for (const f of [1, 0.8, 0.62, 0.46]) {
        const b = ggScrollSpine(p[0], p[1], dir, base * f, Math.PI * (2.1 + rnd() * 0.7), back, 40)
        if (!fits(b)) continue
        scrolls.push(mk(b, bw, back, 0.32, Math.floor(rnd() * 3)))
        trails.push({ pts: b, w: bw })
        // A small curl off the bigger scrolls.
        if (base * f > 80) {
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
  for (let i = 0; i < 9000; i++) {
    const x = GG_ROOT[0] + rnd() * span
    const y = minY + rnd() * (maxY - minY)
    const t = reach(x, y)
    if (!ggInside(env, x, y)) continue
    const edge = ggClamp(0.5 + ggEdgeDist(env, x, y) / 56, 0.5, 1)
    cands.push({ x, y, r: (6 + 9 * Math.sin(Math.PI * ggClamp(0.1 + t * 0.8, 0, 1))) * edge * (0.82 + rnd() * 0.4) })
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
    const kind = c.r > 10.5 ? (roll < 0.58 ? 0 : 1) : roll < 0.32 ? 1 : roll < 0.66 ? 3 : 2
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

  // Gold filigree curls in the gaps between motifs.
  const fillers: { d: string; k: number }[] = []
  const curlTaken: { x: number; y: number; r: number }[] = []
  for (let i = 0; i < 5000 && fillers.length < 150; i++) {
    const x = GG_ROOT[0] + rnd() * span
    const y = minY + rnd() * (maxY - minY)
    const r = 3.5 + rnd() * 4
    if (!ggInside(env, x, y) || ggEdgeDist(env, x, y) < r + 6) continue
    let ok = true
    for (const m of motifs) if (Math.hypot(m.x - x, m.y - y) < m.r + r + 0.5) ok = false
    for (const m of curlTaken) if (ok && Math.hypot(m.x - x, m.y - y) < m.r + r + 0.5) ok = false
    if (!ok) continue
    curlTaken.push({ x, y, r })
    const a0 = rnd() * Math.PI * 2
    let d = ""
    for (let j = 0; j <= 22; j++) {
      const th = a0 + (j / 22) * Math.PI * 3.2
      const rr = r * (1 - (0.8 * j) / 22)
      d += (j ? "L" : "M") + ggF(x + rr * Math.cos(th)) + " " + ggF(y + rr * Math.sin(th))
    }
    fillers.push({ d, k: reach(x, y) })
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
    [-7, -26, 24, 1],
    [0, 2, 46, 0],
    [7, 26, 28, 2],
    [-2, -10, 16, 3],
  ].map(([a, end, w, o]) => {
    const r = GG_ROOT
    const pts = ggCubic([6, a * 0.4], [r[0] * 0.3, a * 3.4 - 6], [r[0] * 0.66, end * 1.2 + 8], [r[0] + 14, r[1] + end * 0.6], 30)
    return { d: ggTaper(pts, 3, w), o }
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

  return { env, ground, currents, scrolls, streams, glow, motifs, fillers, drops, beads, sparks }
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
  linkedin: (
    <path
      fill="currentColor"
      d="M4.5 9h3.6v11.5H4.5zM6.3 3.5a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2M10.2 9h3.4v1.6c.5-.9 1.7-1.9 3.6-1.9 3.8 0 4.5 2.5 4.5 5.7v6.1h-3.6v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.5h-3.6z"
    />
  ),
  youtube: (
    <g>
      <path
        fill="currentColor"
        d="M22.5 7.2a2.7 2.7 0 0 0-1.9-1.9C18.9 4.8 12 4.8 12 4.8s-6.9 0-8.6.5A2.7 2.7 0 0 0 1.5 7.2 28 28 0 0 0 1 12a28 28 0 0 0 .5 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 8.6.5 8.6.5s6.9 0 8.6-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 23 12a28 28 0 0 0-.5-4.8z"
      />
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
  {
    title: "Studio",
    links: [
      { label: "Work", href: "#" },
      { label: "Services", href: "#" },
      { label: "Process", href: "#" },
      { label: "Journal", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Promote",
    links: [
      { label: "Campaigns", href: "#" },
      { label: "Brand film", href: "#" },
      { label: "Launches", href: "#" },
      { label: "Case studies", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
]

const GG_DEFAULT_SOCIALS: GgSocial[] = [
  { icon: "instagram", href: "#" },
  { icon: "x", href: "#" },
  { icon: "linkedin", href: "#" },
  { icon: "youtube", href: "#" },
]

// The elder, 720 × 900 WebP with alpha.
const GG_ELDER =
  "data:image/webp;base64,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"

/** The elder: an animation-style render, cut out on transparency and embedded so nothing is fetched. */
const GG_DEFAULT_PORTRAIT: GgPortrait = {
  src: GG_ELDER,
  alt: "An elderly Rajasthani woman in a magenta dupatta, eyes closed and chin on her fist, light pouring from her eyes",
  eyes: [
    [0.403, 0.335],
    [0.602, 0.337],
  ],
  cutout: true,
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
  sceneHeight = "clamp(520px, 48vw, 740px)",
  displayFont = GG_DISPLAY,
  fontFamily = GG_BODY,
  fontHref,
  backToTop = true,
  parallax = true,
  className = "",
  style,
  id,
}: GgProps) {
  const base = GG_PRESETS[preset] || GG_PRESETS.gold
  const pal: GgPalette = { ...base, ...(palette || {}) }
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
  const natural = nat
  const eyeL = ggFit(pbox, natural, eyesF[0])
  const eyeR = ggFit(pbox, natural, eyesF[1])
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

  // A photo is preloaded: the scene stays dormant until it is here, and its
  // real size places the eyes. The illustration is ready at once.
  const src = portrait.src
  React.useEffect(() => {
    let live = true
    setNat(null)
    if (!src) {
      setLoaded(true)
      return
    }
    setLoaded(false)
    const im = new Image()
    im.onload = () => {
      if (!live) return
      setNat({ w: im.naturalWidth, h: im.naturalHeight })
      setLoaded(true)
    }
    im.onerror = () => {
      if (live) setLoaded(true)
    }
    im.src = src
    return () => {
      live = false
    }
  }, [src])

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
    !portrait.cutout && portrait.outline && portrait.outline.length > 2
      ? "M" +
        ggSmooth(
          portrait.outline.map((f) => ggFit(pbox, nat, f)),
          6,
        )
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
      <div
        className={"gg-wing-wrap " + (side > 0 ? "gg-wing-wrap-r" : "gg-wing-wrap-l")}
        style={{ transformOrigin: ggF(box.w / 2 + eye[0] * px) + "px " + ggF(eye[1] * px) + "px" }}
      >
        <div
          className="gg-layer gg-wing-clip"
          style={
            {
              "--gg-cx": ggF(box.w / 2 + (eye[0] + side * R[0] * scale) * px) + "px",
              "--gg-cy": ggF((eye[1] + R[1] * scale) * px) + "px",
            } as React.CSSProperties
          }
        >
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
              <g id={idp + "k0"}>
                <path d={GG_PAISLEY} stroke={pal.edge} strokeWidth="3.2" vectorEffect={ns} />
                <path d={GG_PAISLEY} stroke={metal} strokeWidth="1.8" vectorEffect={ns} />
                <path d={GG_PAISLEY} transform="translate(0.03 0.2) scale(0.56)" fill="currentColor" stroke={pal.pearl} strokeWidth="1" vectorEffect={ns} />
                <path
                  d={GG_PAISLEY}
                  transform="scale(0.8)"
                  fill="none"
                  stroke={pal.pearl}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="0 4.6"
                  vectorEffect={ns}
                  opacity="0.9"
                />
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
              <g>
                <path d={wing.ground} fill={pal.shadow} transform="translate(3 6)" />
                <path d={wing.ground} fill={"url(#" + idp + "gr)"} />
                {wing.motifs.map((mo, i) => (
                  <g
                    key={i}
                    transform={
                      "translate(" +
                      ggF(mo.x) +
                      " " +
                      ggF(mo.y) +
                      ") rotate(" +
                      ggF(mo.a) +
                      ") scale(" +
                      ggF(mo.r / (mo.kind === 0 ? 1.15 : mo.kind === 3 ? 0.9 : 1)) +
                      ")"
                    }
                  >
                    <g className="gg-motif" style={{ "--k": ggF(mo.k) } as React.CSSProperties}>
                      <use
                        className="gg-rip"
                        style={{ "--k": ggF(mo.k) } as React.CSSProperties}
                        href={"#" + idp + "k" + mo.kind}
                        fill={enamel(mo.fill)}
                        color={pal.enamel[mo.ink % pal.enamel.length]}
                      />
                    </g>
                  </g>
                ))}
                {wing.fillers.map((c, i) => (
                  <path
                    key={i}
                    className="gg-filler"
                    style={{ "--k": ggF(c.k) } as React.CSSProperties}
                    d={c.d}
                    fill="none"
                    stroke={pal.metal[3]}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                ))}
                {wing.scrolls.map((s, i) => drawScroll(s, i, false))}
                {wing.currents.map((s, i) => drawScroll(s, i, true))}
              </g>
              {wing.streams.map((st) => (
                <path
                  key={st.o}
                  className="gg-stream"
                  style={{ "--o": st.o } as React.CSSProperties}
                  d={st.d}
                  fill={"url(#" + idp + "h)"}
                  stroke={pal.metal[0]}
                  strokeOpacity="0.35"
                  strokeWidth="0.6"
                />
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
          {/* The drops sway forever, so they live in their own small layer and never repaint the wing. */}
          <svg
            className={"gg-layer gg-wing " + (side > 0 ? "gg-wing-r" : "gg-wing-l")}
            viewBox={vb}
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ transformOrigin: ggF(box.w / 2 + eye[0] * px) + "px " + ggF(eye[1] * px) + "px" }}
          >
            <g transform={"scale(" + (side * scale).toFixed(4) + " " + scale.toFixed(4) + ")"}>
              {wing.drops.map((d, i) => (
                <g key={i} transform={"translate(" + ggF(d.x) + " " + ggF(d.y) + ")"}>
                  <g className="gg-drop-in" style={{ "--k": ggF(d.k) } as React.CSSProperties}>
                    <g className="gg-drop" style={{ "--k": ggF(d.k) } as React.CSSProperties}>
                      <path d={"M0 0L0 " + ggF(d.len)} stroke={pal.metal[1]} strokeWidth="1.2" />
                      <circle cy={ggF(d.len)} r={ggF(d.r * 0.55)} fill={pal.pearl} stroke={pal.pearlEdge} strokeWidth="0.6" />
                      <path
                        d={GG_TEAR}
                        transform={"translate(0 " + ggF(d.len + d.r * 1.55) + ") scale(" + ggF(d.r) + ")"}
                        fill={metal}
                        stroke={pal.edge}
                        strokeWidth="0.8"
                        vectorEffect={ns}
                      />
                      <circle cy={ggF(d.len + d.r * 2.1)} r={ggF(d.r * 0.36)} fill={enamel(i)} />
                    </g>
                  </g>
                </g>
              ))}
            </g>
          </svg>
        </div>
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
              <stop offset="0" stopColor={pal.coreOuter} stopOpacity="0.85" />
              <stop offset="0.26" stopColor={pal.halo} stopOpacity="0.4" />
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
              <circle className="gg-halo" r="64" fill={"url(#" + idp + "h)"} />
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
            <circle
              className="gg-ring"
              r="10"
              fill="none"
              stroke={pal.halo}
              strokeWidth="1.6"
              vectorEffect="non-scaling-stroke"
              style={{ "--d": "0s" } as React.CSSProperties}
            />
            <circle
              className="gg-ring"
              r="10"
              fill="none"
              stroke={pal.core}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              style={{ "--d": "0.18s" } as React.CSSProperties}
            />
            {bursts.map((b, i) => (
              <path
                key={i}
                className="gg-burst"
                d={GG_SPARK_D}
                fill={pal.spark}
                style={{ "--bx": b[0], "--by": b[1], "--d": i * 0.03 + "s" } as React.CSSProperties}
              />
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
              <div className="gg-layer gg-body">
                <div className="gg-layer gg-breath">
                  <div className="gg-layer gg-portrait-wrap">
                    <svg className="gg-layer" viewBox={stageView} preserveAspectRatio="none" aria-hidden="true">
                      <defs>
                        <radialGradient id={uid + "pw"} cx="0.5" cy="0.5" r="0.5">
                          <stop offset="0" stopColor={pal.wash} stopOpacity="0.5" />
                          <stop offset="0.45" stopColor={pal.wash} stopOpacity="0.2" />
                          <stop offset="1" stopColor={pal.wash} stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id={uid + "pm"} cx="0.5" cy="0.44" r="0.5" gradientTransform="scale(1 1.55) translate(0 -0.18)">
                          <stop offset="0.5" stopColor="#fff" />
                          <stop offset="1" stopColor="#000" />
                        </radialGradient>
                        <linearGradient id={uid + "pe"} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0" stopColor="#000" />
                          <stop offset="0.07" stopColor="#fff" />
                          <stop offset="0.93" stopColor="#fff" />
                          <stop offset="1" stopColor="#000" />
                        </linearGradient>
                        <filter id={uid + "pf"} x="-10%" y="-10%" width="120%" height="120%">
                          <feGaussianBlur stdDeviation="1.8" />
                        </filter>
                        <mask id={uid + "pmask"} maskUnits="userSpaceOnUse" x={pbox.x} y={pbox.y} width={pbox.w} height={pbox.h}>
                          {portrait.cutout ? (
                            <rect x={pbox.x} y={pbox.y} width={pbox.w} height={pbox.h} fill={"url(#" + uid + "pe)"} />
                          ) : cut ? (
                            <path d={cut} fill="#fff" filter={"url(#" + uid + "pf)"} />
                          ) : (
                            <rect x={pbox.x} y={pbox.y} width={pbox.w} height={pbox.h} fill={"url(#" + uid + "pm)"} />
                          )}
                        </mask>
                      </defs>
                      <g mask={"url(#" + uid + "pmask)"}>
                        <image href={portrait.src} x={pbox.x} y={pbox.y} width={pbox.w} height={pbox.h} preserveAspectRatio="xMidYMid slice" />
                        <ellipse
                          className="gg-wash"
                          cx={eyeMid[0]}
                          cy={eyeMid[1] + 8}
                          rx={ggF((eyeR[0] - eyeL[0]) * 1.7)}
                          ry={ggF((eyeR[0] - eyeL[0]) * 0.75)}
                          fill={"url(#" + uid + "pw)"}
                          style={{ mixBlendMode: "screen" }}
                        />
                      </g>
                    </svg>
                  </div>
                </div>
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
              <div className="gg-layer gg-body">
                <div className="gg-layer gg-breath">
                  {renderEye(eyeL, -1, "el")}
                  {renderEye(eyeR, 1, "er")}
                  <button
                    type="button"
                    className="gg-hit"
                    aria-label="Light up her eyes"
                    onClick={ignite}
                    style={{
                      left: ggF(box.w / 2 + eyeMid[0] * px - hitW / 2) + "px",
                      top: ggF(eyeMid[1] * px - hitH / 2) + "px",
                      width: ggF(hitW) + "px",
                      height: ggF(hitH) + "px",
                    }}
                  />
                </div>
              </div>
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
