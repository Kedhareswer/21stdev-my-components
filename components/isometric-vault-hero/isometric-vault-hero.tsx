"use client"

import * as React from "react"

/**
 * Isometric Vault Hero: a dark landing hero for a data-security product.
 *
 * Top nav, a two-line headline, two calls to action, and on the right a line-
 * drawn isometric machine: raw records ride a conveyor into a bolted vault,
 * get scanned in the glass chamber on its lid, and leave through the front
 * slot either sealed (an accent chip on top) or pushed off onto a quarantine
 * lane.
 *
 * It is a working toy, not a picture. The control plate in front of the vault
 * has two sliders: FLOW sets belt speed (the gauge follows), GUARD sets how
 * much gets quarantined. Hover the vault and its lid lifts; click it for a
 * scan pulse. "See how it works" walks the three stages, dimming everything
 * but the one it is explaining. The counters are real: they tick as records
 * cross the vault.
 *
 * Dark only, by design — it paints its own background and ignores the page
 * theme. Everything is SVG built from numbers: no images, no fonts to load,
 * React is the only import.
 */

export interface VaultLink {
  label: string
  href?: string
  /** Second line in a nav dropdown. */
  description?: string
}

export interface VaultNavLink extends VaultLink {
  /** Turns the link into a dropdown. */
  items?: VaultLink[]
}

export interface VaultStep {
  title: string
  body: string
}

export interface IsometricVaultHeroProps {
  /** Wordmark in the middle of the nav. */
  brand?: string
  /** Left side of the nav. Links with `items` open a dropdown. */
  navLinks?: VaultNavLink[]
  /** Plain links on the right of the nav. */
  utilityLinks?: VaultLink[]
  /** The chip at the far right of the nav. */
  navCta?: VaultLink
  /** Small line above the headline. Empty hides it. */
  eyebrow?: string
  /** "\n" breaks the line. A trailing "." is painted in the accent. */
  headline?: string
  subtitle?: string
  primaryCta?: VaultLink
  /** Label of the button that starts the walkthrough. */
  secondaryCta?: string
  /** Exactly three: ingest, validate, secure. */
  steps?: VaultStep[]
  /** Chips, gauge, scan beam, active states. */
  accent?: string
  /** Line work and text. */
  ink?: string
  /** Page background. */
  background?: string
  /** Top face colour of the machinery; the sides are shaded from it. */
  surface?: string
  /** Initial belt speed, 0.25 – 2.5. */
  speed?: number
  /** Initial GUARD, 0 – 1: share of suspect records quarantined. */
  strictness?: number
  /** Where the SECURED counter starts. */
  securedStart?: number
  fontFamily?: string
  /** Component height. A definite length, never a percentage. */
  height?: string
  className?: string
  onPrimaryClick?: () => void
}

type P3 = [number, number, number]
interface Box {
  x0: number
  x1: number
  y0: number
  y1: number
  z0: number
  z1: number
}
type Verdict = "secure" | "quarantine"

// #region scene
export const COS = 0.8660254037844386
export const SIN = 0.5
/** Belt distance between two records. */
export const SPACING = 170
/** Half a record's footprint, and its height. */
export const HALF = 28
export const CUBE_H = 50
/** Half the vault's footprint. */
export const VAULT = 96
/** Height of the belt surface. */
export const BELT_Z = 12
/** Records fade out beyond this distance from the vault. */
export const REACH = 760
/** Where quarantined records end up, across the belt. */
export const LANE_Y = 118

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

export function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** World (x, y, z) to screen. +x runs down-right, +y down-left, +z up. */
export function iso(x: number, y: number, z: number): [number, number] {
  return [(x - y) * COS, (x + y) * SIN - z]
}

export function poly(list: P3[]) {
  return list
    .map((p) => {
      const s = iso(p[0], p[1], p[2])
      return s[0].toFixed(1) + "," + s[1].toFixed(1)
    })
    .join(" ")
}

/** The three faces a viewer up at +x +y +z sees. */
export function faces(b: Box) {
  return {
    top: poly([[b.x0, b.y0, b.z1], [b.x1, b.y0, b.z1], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]]),
    right: poly([[b.x1, b.y0, b.z0], [b.x1, b.y1, b.z0], [b.x1, b.y1, b.z1], [b.x1, b.y0, b.z1]]),
    left: poly([[b.x0, b.y1, b.z0], [b.x1, b.y1, b.z0], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]]),
  }
}

function matrix(a: number, b: number, c: number, d: number, x: number, y: number, z: number) {
  const s = iso(x, y, z)
  return "matrix(" + [a, b, c, d, s[0], s[1]].map((n) => +n.toFixed(4)).join(" ") + ")"
}

/** Lays local (u, v) flat on the floor at height z, origin at world (x, y). */
export function floorAt(x: number, y: number, z: number) {
  return matrix(COS, SIN, -COS, SIN, x, y, z)
}

/** Local (y, -z) on the plane x = const: the right-hand faces. */
export function wallX(x: number) {
  return matrix(-COS, SIN, 0, 1, x, 0, 0)
}

/** Local (x, -z) on the plane y = const: the left-hand faces. */
export function wallY(y: number) {
  return matrix(COS, SIN, 0, 1, 0, y, 0)
}

export function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** Record k is at x = pos - k * SPACING: it crosses the vault's centre at pos = k * SPACING. */
export function recordX(pos: number, k: number) {
  return pos - k * SPACING
}

/** Every record on screen, upstream first (back to front along the belt). */
export function visibleRecords(pos: number) {
  const out: number[] = []
  const lo = Math.ceil((pos - REACH) / SPACING)
  for (let k = Math.floor((pos + REACH) / SPACING); k >= lo; k--) out.push(k)
  return out
}

/** The records whose centre crossed the vault between two belt positions. */
export function crossings(prev: number, next: number) {
  const out: number[] = []
  for (let k = Math.floor(prev / SPACING) + 1; k <= Math.floor(next / SPACING); k++) out.push(k)
  return out
}

export function verdict(k: number, strictness: number): Verdict {
  return hash(k) < clamp01(strictness) * 0.3 ? "quarantine" : "secure"
}

/** Raw records mostly arrive dirty. Quarantined ones always do. */
export function isNoisy(k: number) {
  return hash(k * 1.7 + 3.3) < 0.72
}

/** How far a quarantined record has been pushed across to its lane, 0 – 1. */
export function divert(x: number) {
  return smooth(170, 300, x)
}

export function speedFromSlider(v: number) {
  return 0.25 + clamp01(v) * 2.25
}

export function sliderFromSpeed(s: number) {
  return clamp01((s - 0.25) / 2.25)
}

/** Records per second at a belt speed, in thousands, for the readout. */
export function flowRate(speed: number) {
  return (speed * 70) / SPACING * 2.4
}
// #endregion

const BELT_W = 40
const PLATE = 128
const PLATE_H = BELT_Z
const BODY_TOP = 140
const FRAME = 72
const WELL = 54
const WELL_FLOOR = 96
const BASE_SPEED = 70
const TOUR_MS = 3600

const PANEL_X = -150
const PANEL_Y = 196
const PANEL_W = 184
const PANEL_D = 96
const PANEL_H = 10
const TRACK_U0 = 92
const TRACK_LEN = 76

const R2C = Math.SQRT2 * COS
const R2S = Math.SQRT2 * SIN

const DEFAULT_STEPS: VaultStep[] = [
  { title: "Ingest", body: "Records stream in from every source and are treated as untrusted until proven otherwise." },
  { title: "Validate", body: "Each one is scanned in the chamber: cleaned, deduplicated, checked against your rules." },
  { title: "Secure", body: "Clean data leaves sealed and signed. Anything suspect is pushed off to quarantine." },
]

const DEFAULT_NAV: VaultNavLink[] = [
  {
    label: "Industries",
    items: [
      { label: "Finance", description: "Ledger-grade validation", href: "#" },
      { label: "Healthcare", description: "PHI-aware cleaning", href: "#" },
      { label: "Retail", description: "Catalog and order hygiene", href: "#" },
      { label: "Public sector", description: "Audit trails by default", href: "#" },
    ],
  },
  { label: "Pricing", href: "#" },
  {
    label: "Resources",
    items: [
      { label: "Documentation", description: "Guides and API reference", href: "#" },
      { label: "Security whitepaper", description: "How the vault works", href: "#" },
      { label: "Changelog", description: "What shipped this week", href: "#" },
      { label: "Status", description: "All systems normal", href: "#" },
    ],
  },
]

const CSS = `
.ivh{position:relative;overflow:hidden;isolation:isolate;container:ivh / size;color-scheme:dark;background:var(--ivh-bg);color:var(--ivh-ink);font-family:var(--ivh-font);-webkit-font-smoothing:antialiased;
  --ivh-muted:color-mix(in oklab,var(--ivh-ink) 62%,var(--ivh-bg));
  --ivh-faint:color-mix(in oklab,var(--ivh-ink) 14%,transparent);
  --ivh-line:color-mix(in oklab,var(--ivh-ink) 80%,transparent);
  --ivh-top:var(--ivh-surface);
  --ivh-left:color-mix(in oklab,var(--ivh-surface) 74%,#000);
  --ivh-right:color-mix(in oklab,var(--ivh-surface) 54%,#000);
  --ivh-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.ivh *,.ivh *::before,.ivh *::after{box-sizing:border-box}
.ivh :where(a){color:inherit;text-decoration:none}
.ivh :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.ivh :focus-visible{outline:2px solid var(--ivh-accent);outline-offset:3px;border-radius:6px}
.ivh-bgfx{position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(60% 55% at 66% 52%,color-mix(in oklab,var(--ivh-accent) 9%,transparent),transparent 70%),radial-gradient(120% 80% at 50% -10%,color-mix(in oklab,var(--ivh-ink) 7%,transparent),transparent 60%)}
.ivh-dots{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.5;
  background-image:radial-gradient(circle at 1px 1px,var(--ivh-faint) 1px,transparent 1.4px);background-size:22px 22px;
  -webkit-mask-image:radial-gradient(70% 70% at 66% 55%,#000,transparent 75%);mask-image:radial-gradient(70% 70% at 66% 55%,#000,transparent 75%)}

.ivh-nav{position:absolute;left:0;right:0;top:0;z-index:5;height:64px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 clamp(16px,2.4cqw,32px);
  background:color-mix(in oklab,var(--ivh-bg) 72%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--ivh-faint)}
.ivh-nl,.ivh-nr{display:flex;align-items:center;gap:4px}
.ivh-nr{justify-content:flex-end}
.ivh-link{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 10px;border-radius:9px;font-size:14px;color:color-mix(in oklab,var(--ivh-ink) 86%,transparent);transition:background .2s,color .2s}
.ivh-link:hover,.ivh-link[aria-expanded="true"]{background:var(--ivh-faint);color:var(--ivh-ink)}
.ivh-chev{width:10px;height:10px;transition:transform .25s}
.ivh-link[aria-expanded="true"] .ivh-chev{transform:rotate(180deg)}
.ivh-brand{display:inline-flex;align-items:center;gap:9px;font-size:22px;font-weight:700;letter-spacing:-.045em}
.ivh-brand svg{width:22px;height:22px;transition:transform .5s cubic-bezier(.3,1.6,.5,1)}
.ivh-brand:hover svg{transform:rotate(-12deg) scale(1.08)}
.ivh-chip{display:inline-flex;align-items:center;height:36px;padding:0 14px;border-radius:10px;font-size:14px;font-weight:500;background:color-mix(in oklab,var(--ivh-ink) 11%,transparent);border:1px solid var(--ivh-faint);transition:background .2s,border-color .2s}
.ivh-chip:hover{background:color-mix(in oklab,var(--ivh-ink) 17%,transparent);border-color:color-mix(in oklab,var(--ivh-ink) 26%,transparent)}
.ivh-dd{position:relative}
.ivh-menu{position:absolute;top:calc(100% + 10px);left:0;min-width:250px;padding:6px;border-radius:14px;background:color-mix(in oklab,var(--ivh-bg) 88%,var(--ivh-ink));border:1px solid var(--ivh-faint);box-shadow:0 24px 60px -12px #000;
  opacity:0;transform:translateY(-6px) scale(.98);transform-origin:top left;pointer-events:none;visibility:hidden;transition:opacity .18s,transform .18s,visibility 0s .18s}
.ivh-menu[data-open="true"]{opacity:1;transform:none;pointer-events:auto;visibility:visible;transition:opacity .18s,transform .18s}
.ivh-mi{display:flex;gap:12px;align-items:flex-start;padding:10px;border-radius:10px;transition:background .15s}
.ivh-mi:hover,.ivh-mi:focus-visible{background:var(--ivh-faint)}
.ivh-mi i{flex:none;width:8px;height:8px;margin-top:6px;border-radius:2px;border:1.5px solid var(--ivh-accent);transform:rotate(45deg)}
.ivh-mi b{display:block;font-size:14px;font-weight:500}
.ivh-mi span{display:block;font-size:12.5px;color:var(--ivh-muted);margin-top:2px}

.ivh-fade{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,var(--ivh-bg) 0%,color-mix(in oklab,var(--ivh-bg) 88%,transparent) 26%,transparent 48%)}
.ivh-copy{position:absolute;z-index:2;left:clamp(20px,4.4cqw,72px);top:50%;transform:translateY(-46%);width:min(540px,44cqw)}
.ivh-eyebrow{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 11px 0 9px;margin-bottom:22px;border-radius:99px;border:1px solid var(--ivh-faint);background:color-mix(in oklab,var(--ivh-ink) 5%,transparent);font:500 11.5px/1 var(--ivh-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ivh-muted)}
.ivh-eyebrow i{width:7px;height:7px;border-radius:50%;background:var(--ivh-accent);box-shadow:0 0 0 0 var(--ivh-accent);animation:ivh-ping 2.2s infinite}
.ivh-h1{margin:0;font-weight:500;font-size:clamp(38px,5.3cqw,80px);line-height:1;letter-spacing:-.045em;text-wrap:balance}
.ivh-h1>span{display:block;overflow:hidden;padding-bottom:.06em}
.ivh-h1>span>em{display:block;font-style:normal;animation:ivh-rise .9s cubic-bezier(.2,.8,.2,1) both}
.ivh-h1>span:nth-child(2)>em{animation-delay:.08s}
.ivh-h1>span:nth-child(3)>em{animation-delay:.16s}
.ivh-dot{color:var(--ivh-accent)}
.ivh-sub{margin:20px 0 0;max-width:34ch;font-size:clamp(15px,1.2cqw,17px);line-height:1.55;color:var(--ivh-muted);animation:ivh-fadein .8s .25s both}
.ivh-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px;animation:ivh-fadein .8s .35s both}
.ivh-btn{position:relative;display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 18px;border-radius:11px;font-size:15px;font-weight:500;transition:transform .2s,background .2s,box-shadow .3s}
.ivh-btn:active{transform:translateY(1px) scale(.99)}
.ivh-btn svg{width:14px;height:14px;transition:transform .3s cubic-bezier(.3,1.6,.5,1)}
.ivh-p{background:var(--ivh-ink);color:var(--ivh-bg);box-shadow:0 0 0 0 color-mix(in oklab,var(--ivh-accent) 50%,transparent)}
.ivh-p:hover{box-shadow:0 10px 30px -8px color-mix(in oklab,var(--ivh-accent) 60%,transparent)}
.ivh-p:hover svg{transform:translateX(3px)}
.ivh-s{background:color-mix(in oklab,var(--ivh-ink) 10%,transparent);border:1px solid var(--ivh-faint)}
.ivh-s:hover{background:color-mix(in oklab,var(--ivh-ink) 16%,transparent)}
.ivh-s[aria-pressed="true"]{border-color:color-mix(in oklab,var(--ivh-accent) 60%,transparent);background:color-mix(in oklab,var(--ivh-accent) 14%,transparent)}
.ivh-s[aria-pressed="true"] svg{color:var(--ivh-accent)}

.ivh-tour{position:absolute;top:calc(100% + 22px);left:0;width:min(380px,100%);padding:14px 16px 16px;border-radius:14px;border:1px solid var(--ivh-faint);background:color-mix(in oklab,var(--ivh-bg) 82%,var(--ivh-ink));animation:ivh-card .35s cubic-bezier(.2,.8,.2,1) both}
.ivh-tour-h{display:flex;align-items:baseline;gap:10px;font:500 11px/1 var(--ivh-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ivh-accent)}
.ivh-tour-h b{font:600 15px/1.2 var(--ivh-font);letter-spacing:-.01em;text-transform:none;color:var(--ivh-ink)}
.ivh-tour p{margin:8px 0 12px;font-size:13.5px;line-height:1.5;color:var(--ivh-muted);min-height:3em}
.ivh-bars{display:flex;gap:6px}
.ivh-bar{flex:1;height:4px;border-radius:4px;background:var(--ivh-faint);overflow:hidden;padding:0}
.ivh-bar i{display:block;height:100%;width:0;background:var(--ivh-accent)}
.ivh-bar[data-s="done"] i{width:100%}
.ivh-bar[data-s="on"] i{animation:ivh-fill var(--ivh-tour) linear both}
.ivh-bar[data-s="on"][data-hold="true"] i{animation:none;width:100%}

.ivh-stage{position:absolute;z-index:0;right:-1%;top:64px;bottom:0;width:70%}
.ivh-par{position:absolute;inset:0;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.ivh-svg{position:absolute;inset:0;width:100%;height:100%;max-width:none;overflow:visible;animation:ivh-fadein 1s .1s both}
.ivh-e{stroke:var(--ivh-line);stroke-width:1.15;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}
.ivh-e2{stroke:color-mix(in oklab,var(--ivh-ink) 34%,transparent);stroke-width:1;fill:none;vector-effect:non-scaling-stroke}
.ivh-da{stroke-dasharray:3 4}
.ivh-ft{fill:var(--ivh-top)}
.ivh-fl{fill:var(--ivh-left)}
.ivh-fr{fill:var(--ivh-right)}
.ivh-ac{fill:var(--ivh-accent)}
.ivh-grp{transition:filter .5s}
.ivh-touring .ivh-grp{filter:brightness(.34) saturate(.4)}
.ivh-touring .ivh-grp[data-on="true"]{filter:none}
.ivh-drop{animation:ivh-drop 1.1s .2s cubic-bezier(.2,1.25,.4,1) both}
.ivh-vault{cursor:pointer;outline:none}
.ivh-vault:focus-visible .ivh-vbody{stroke:var(--ivh-accent)}
.ivh-knob{cursor:grab;outline:none}
.ivh-knob:active{cursor:grabbing}
.ivh-knob:focus-visible .ivh-kring{stroke:var(--ivh-ink);stroke-width:2}
.ivh-mk{cursor:pointer;outline:none}
.ivh-mk text{font:600 10px var(--ivh-mono);letter-spacing:.14em}
.ivh-mk:focus-visible circle{stroke:var(--ivh-accent);stroke-width:2}
.ivh-mk .ivh-pulse{transform-box:fill-box;transform-origin:center;animation:ivh-ring 1.6s infinite}
.ivh-gt{font:600 8.5px var(--ivh-mono);letter-spacing:.14em}

.ivh-hud{position:absolute;z-index:2;right:clamp(16px,2.4cqw,32px);bottom:clamp(16px,2.6cqh,28px);display:grid;grid-template-columns:auto auto;gap:5px 18px;padding:12px 14px;border-radius:12px;border:1px solid var(--ivh-faint);background:color-mix(in oklab,var(--ivh-bg) 80%,transparent);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font:500 11px/1.2 var(--ivh-mono);letter-spacing:.08em;text-transform:uppercase;animation:ivh-fadein .8s .6s both}
.ivh-hud dt{color:var(--ivh-muted);display:flex;align-items:center;gap:7px}
.ivh-hud dt i{width:6px;height:6px;border-radius:1.5px;background:var(--ivh-accent)}
.ivh-hud dt i.ivh-q{background:none;border:1px dashed var(--ivh-muted)}
.ivh-hud dt i.ivh-f{background:none;border:1px solid var(--ivh-ink)}
.ivh-hud dd{margin:0;text-align:right;font-variant-numeric:tabular-nums;color:var(--ivh-ink)}

@keyframes ivh-rise{from{transform:translateY(105%)}to{transform:none}}
@keyframes ivh-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes ivh-card{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes ivh-drop{from{opacity:0;transform:translateY(-70px)}to{opacity:1;transform:none}}
@keyframes ivh-fill{from{width:0}to{width:100%}}
@keyframes ivh-ping{0%{box-shadow:0 0 0 0 color-mix(in oklab,var(--ivh-accent) 70%,transparent)}70%,100%{box-shadow:0 0 0 7px transparent}}
@keyframes ivh-ring{from{opacity:.8;transform:scale(1)}to{opacity:0;transform:scale(2.1)}}

@container ivh (max-width: 900px){
  .ivh-nl .ivh-link:not(.ivh-keep){display:none}
}
@container ivh (max-width: 820px){
  .ivh-copy{top:92px;transform:none;width:auto;right:clamp(20px,4.4cqw,72px)}
  .ivh-sub{max-width:44ch}
  .ivh-stage{top:auto;right:0;left:0;width:100%;height:56%}
  .ivh-fade{background:linear-gradient(180deg,var(--ivh-bg) 0%,var(--ivh-bg) 36%,transparent 58%)}
  .ivh-tour{display:none}
  .ivh-hud{grid-template-columns:auto auto auto auto;gap:4px 10px;padding:8px 10px;font-size:9.5px}
}
@container ivh (max-width: 620px){
  .ivh-nav{grid-template-columns:auto 1fr auto}
  .ivh-nl,.ivh-nr .ivh-link{display:none}
  .ivh-brand{justify-self:start}
  .ivh-hud{left:16px;right:16px;grid-template-columns:auto auto}
}
@container ivh (max-height: 620px) and (min-width: 821px){
  .ivh-tour{display:none}
  .ivh-eyebrow{margin-bottom:14px}
}
@media (prefers-reduced-motion: reduce){
  .ivh *,.ivh *::before,.ivh *::after{animation:none!important;transition-duration:.01ms!important}
  .ivh-bar[data-s="on"] i{width:100%}
}
`

function useReducedMotion() {
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

const fmt = (n: number) => Math.round(n).toLocaleString("en-US")

interface Record3 {
  k: number
  x: number
  y: number
  z: number
  cut: number
  kind: "raw" | Verdict
  noisy: boolean
  alpha: number
}

function RecordCube({ r, id }: { r: Record3; id: (s: string) => string }) {
  const x0 = r.x - HALF
  const y0 = r.y - HALF
  const z1 = r.z + CUBE_H
  const box = { x0: Math.max(x0, r.cut), x1: r.x + HALF, y0, y1: r.y + HALF, z0: r.z, z1 }
  if (box.x1 - box.x0 < 0.5) return null
  const f = faces(box)
  const whole = box.x0 === x0
  const deco = whole ? 1 : smooth(0.8, 1, (box.x1 - box.x0) / (HALF * 2))
  const q = r.kind === "quarantine"
  const pad = 6
  return (
    <g opacity={r.alpha}>
      {whole && (
        <polygon
          className="ivh-e2 ivh-da"
          points={poly([[x0 - pad, y0 - pad, r.z], [r.x + HALF + pad, y0 - pad, r.z], [r.x + HALF + pad, r.y + HALF + pad, r.z], [x0 - pad, r.y + HALF + pad, r.z]])}
        />
      )}
      <polygon className="ivh-e ivh-fr" points={f.right} />
      <polygon className="ivh-e ivh-fl" points={f.left} />
      <polygon className={"ivh-e ivh-ft" + (q ? " ivh-da" : "")} points={f.top} />
      {deco > 0 && (
        <g transform={floorAt(x0, y0, z1)} opacity={deco}>
          {r.kind === "raw" && r.noisy &&
            [0, 1, 2, 3, 4].map((j) => {
              const a = hash(r.k * 13 + j)
              const b = hash(r.k * 29 + j * 7)
              const u = 10 + a * 34
              const v = 10 + b * 34
              return j % 2 ? (
                <circle key={j} cx={u} cy={v} r={1.6} fill="var(--ivh-muted)" />
              ) : (
                <line key={j} className="ivh-e2" x1={u} y1={v} x2={u + 6 + a * 6} y2={v + (b > 0.5 ? 0 : 5)} />
              )
            })}
          {r.kind === "secure" && (
            <>
              <rect x={6} y={6} width={44} height={44} rx={3} className="ivh-ac" opacity={0.1} />
              <rect x={12} y={12} width={32} height={32} rx={2.5} fill="none" stroke="var(--ivh-accent)" strokeWidth={1.2} />
              <rect x={18} y={18} width={20} height={20} rx={2} className="ivh-ac" />
              <path d="M22.5 28.5 l4 4 l7.5 -8" fill="none" stroke="var(--ivh-bg)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {q && (
            <>
              <rect x={19} y={27} width={18} height={14} rx={2} fill="none" className="ivh-e2" style={{ stroke: "var(--ivh-ink)" }} />
              <path d="M22.5 27 v-4.5 a5.5 5.5 0 0 1 11 0 v4.5" fill="none" className="ivh-e2" style={{ stroke: "var(--ivh-ink)" }} />
              <circle cx={28} cy={34} r={1.8} fill="var(--ivh-ink)" />
            </>
          )}
        </g>
      )}
      {q && whole && (
        <polygon points={f.top} fill={"url(#" + id("hq") + ")"} opacity={0.6} />
      )}
    </g>
  )
}

function Bolt({ x, y, z, r = 6, h = 6 }: { x: number; y: number; z: number; r?: number; h?: number }) {
  const [sx, sy] = iso(x, y, z)
  const rx = r * R2C
  const ry = r * R2S
  return (
    <g>
      <path className="ivh-e ivh-fl" d={"M" + (sx - rx) + " " + sy + " v" + -h + " h" + rx * 2 + " v" + h + " a" + rx + " " + ry + " 0 0 1 " + -rx * 2 + " 0z"} />
      <ellipse className="ivh-e ivh-ft" cx={sx} cy={sy - h} rx={rx} ry={ry} />
      <line className="ivh-e2" x1={sx - rx * 0.5} y1={sy - h} x2={sx + rx * 0.5} y2={sy - h} />
    </g>
  )
}

interface SceneProps {
  steps: VaultStep[]
  tour: number | null
  onStep: (n: number) => void
  speed: number
  strictness: number
  securedStart: number
  reduced: boolean
}

function Scene({ steps, tour, onStep, speed: speed0, strictness: strict0, securedStart, reduced }: SceneProps) {
  const uid = React.useId().replace(/:/g, "")
  const id = React.useCallback((s: string) => uid + "-" + s, [uid])
  const [, tick] = React.useReducer((n: number) => n + 1, 0)
  const [flow, setFlow] = React.useState(() => sliderFromSpeed(speed0))
  const [guard, setGuard] = React.useState(() => clamp01(strict0))
  const [narrow, setNarrow] = React.useState(false)
  const stage = React.useRef<HTMLDivElement>(null)
  const par = React.useRef<HTMLDivElement>(null)
  const panel = React.useRef<SVGGElement>(null)

  const s = React.useRef({
    pos: 24 * SPACING + 60,
    t: 0,
    lift: 0,
    liftTo: 0,
    burst: -10,
    secured: securedStart,
    quar: Math.round(securedStart * 0.0023),
    locked: new Map<number, Verdict>(),
  }).current
  const live = React.useRef({ flow, guard })
  live.current = { flow, guard }

  // Lock a verdict the moment a record crosses the vault, so dragging GUARD
  // never teleports records already out on the belt between lanes.
  if (s.locked.size === 0) {
    for (const k of visibleRecords(s.pos)) if (recordX(s.pos, k) >= 0) s.locked.set(k, verdict(k, guard))
  }

  React.useEffect(() => {
    if (reduced) return
    let raf = 0
    let last = 0
    let visible = true
    const frame = (now: number) => {
      raf = 0
      if (!visible) return
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const burstBoost = s.t - s.burst < 0.8 ? 1.8 : 1
      const prev = s.pos
      s.t += dt
      s.pos += dt * BASE_SPEED * speedFromSlider(live.current.flow) * burstBoost
      s.lift += (s.liftTo - s.lift) * Math.min(1, dt * 7)
      for (const k of crossings(prev, s.pos)) {
        const v = verdict(k, live.current.guard)
        s.locked.set(k, v)
        if (v === "quarantine") s.quar++
        else s.secured++
      }
      for (const k of s.locked.keys()) if (recordX(s.pos, k) > REACH + 40) s.locked.delete(k)
      tick()
      raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    })
    if (stage.current) io.observe(stage.current)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [reduced, s])

  React.useEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 640))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Pointer parallax: the whole machine leans a few pixels toward the cursor.
  React.useEffect(() => {
    const root = stage.current?.parentElement
    if (!root || reduced) return
    const move = (e: PointerEvent) => {
      const b = root.getBoundingClientRect()
      const dx = (e.clientX - b.left) / b.width - 0.5
      const dy = (e.clientY - b.top) / b.height - 0.5
      if (par.current) par.current.style.transform = "translate3d(" + (dx * -14).toFixed(1) + "px," + (dy * -10).toFixed(1) + "px,0)"
    }
    const leave = () => {
      if (par.current) par.current.style.transform = ""
    }
    root.addEventListener("pointermove", move)
    root.addEventListener("pointerleave", leave)
    return () => {
      root.removeEventListener("pointermove", move)
      root.removeEventListener("pointerleave", leave)
    }
  }, [reduced])

  const hoverVault = (on: boolean) => {
    s.liftTo = on ? 14 : 0
    if (reduced) {
      s.lift = s.liftTo
      tick()
    }
  }
  // Under reduced motion time stands still, so the pulse is a brief still
  // flash rather than rings that would otherwise never fade.
  const flash = React.useRef(0)
  React.useEffect(() => () => clearTimeout(flash.current), [])
  const pulse = () => {
    s.burst = s.t
    if (!reduced) return
    tick()
    clearTimeout(flash.current)
    flash.current = window.setTimeout(() => {
      s.burst = -10
      tick()
    }, 600)
  }

  /* ---------- sliders on the control plate ---------- */

  const dragging = React.useRef<null | "flow" | "guard">(null)
  const setFrom = (which: "flow" | "guard", clientX: number, clientY: number) => {
    const g = panel.current
    const m = g?.getScreenCTM()
    if (!g || !m) return
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse())
    const v = clamp01((p.x - TRACK_U0) / TRACK_LEN)
    if (which === "flow") setFlow(v)
    else setGuard(v)
  }
  const knobProps = (which: "flow" | "guard", value: number, label: string, text: string) => ({
    role: "slider",
    tabIndex: 0,
    "aria-label": label,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(value * 100),
    "aria-valuetext": text,
    className: "ivh-knob",
    onPointerDown: (e: React.PointerEvent<SVGGElement>) => {
      e.preventDefault()
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
      dragging.current = which
      setFrom(which, e.clientX, e.clientY)
    },
    onPointerMove: (e: React.PointerEvent<SVGGElement>) => {
      if (dragging.current === which) setFrom(which, e.clientX, e.clientY)
    },
    onPointerUp: () => {
      dragging.current = null
    },
    onPointerCancel: () => {
      dragging.current = null
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      const set = which === "flow" ? setFlow : setGuard
      const step = e.shiftKey ? 0.2 : 0.05
      if (e.key === "ArrowRight" || e.key === "ArrowUp") set((v) => clamp01(v + step))
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") set((v) => clamp01(v - step))
      else if (e.key === "Home") set(0)
      else if (e.key === "End") set(1)
      else return
      e.preventDefault()
    },
  })

  /* ---------- the frame ---------- */

  const { pos, t, lift } = s
  const speed = speedFromSlider(flow)
  const burstAge = s.t - s.burst

  const back: Record3[] = []
  const front: Record3[] = []
  for (const k of visibleRecords(pos)) {
    const x = recordX(pos, k)
    const alpha = 1 - smooth(REACH - 200, REACH, Math.abs(x))
    if (x < 0) {
      back.push({ k, x, y: 0, z: BELT_Z, cut: -Infinity, kind: "raw", noisy: isNoisy(k) || verdict(k, guard) === "quarantine", alpha })
    } else {
      const kind = s.locked.get(k) ?? verdict(k, guard)
      const d = kind === "quarantine" ? divert(x) : 0
      front.push({ k, x, y: d * LANE_Y, z: BELT_Z * (1 - smooth(0.45, 0.8, d)), cut: VAULT, kind, noisy: false, alpha })
    }
  }
  front.sort((a, b) => a.x + a.y - (b.x + b.y))

  // The chamber shows whichever record is nearest the vault's centre.
  const k0 = Math.round(pos / SPACING)
  const p = clamp01((recordX(pos, k0) + SPACING / 2) / SPACING)
  const chamberAlpha = smooth(0, 0.12, p) * (1 - smooth(0.88, 1, p))
  const chamberKind: Record3["kind"] = p > 0.55 ? s.locked.get(k0) ?? verdict(k0, guard) : "raw"
  const zt = BODY_TOP + 12 + lift
  const beamZ = WELL_FLOOR + 6 + (1 - p) * 44 + lift * 0.8
  const bob = reduced ? 0 : Math.sin(t * 2.1) * 2
  const glow = 0.28 + 0.22 * Math.sin(p * Math.PI) + (burstAge < 1.2 ? (1 - burstAge / 1.2) * 0.6 : 0)
  const lit = Math.floor(p * 6.99)

  const gaugeV = clamp01(flow + (reduced ? 0 : Math.sin(t * 9) * 0.012 + Math.sin(t * 2.3) * 0.01))
  const ga = Math.PI + gaugeV * Math.PI
  const gc = { u: 44, v: 56, r: 30 }

  const slats: number[] = []
  for (let i = 0; i < 64; i++) {
    const x = ((((i * 26 + pos) % 1664) + 1664) % 1664) - 832
    if (Math.abs(x) > PLATE) slats.push(x)
  }

  const anchors: P3[] = [
    [-300, 0, BELT_Z + CUBE_H + 12],
    [0, 0, zt + 44],
    [420, 0, BELT_Z + CUBE_H + 12],
  ]
  const markerSide = [1, 1, 1]

  const touring = tour !== null
  const on = (n: number) => (touring ? tour === n : true)
  const viewBox = narrow ? "-380 -300 760 590" : "-470 -300 940 600"

  const panelBox = { x0: PANEL_X, x1: PANEL_X + PANEL_W, y0: PANEL_Y, y1: PANEL_Y + PANEL_D, z0: 0, z1: PANEL_H }
  const pf = faces(panelBox)
  const plate = faces({ x0: -PLATE, x1: PLATE, y0: -PLATE, y1: PLATE, z0: 0, z1: PLATE_H })
  const body = faces({ x0: -VAULT, x1: VAULT, y0: -VAULT, y1: VAULT, z0: BELT_Z, z1: BODY_TOP })
  const frame = faces({ x0: -FRAME, x1: FRAME, y0: -FRAME, y1: FRAME, z0: BODY_TOP, z1: zt })
  const well = poly([[-WELL, -WELL, zt], [WELL, -WELL, zt], [WELL, WELL, zt], [-WELL, WELL, zt]])
  const belt = faces({ x0: -832, x1: 832, y0: -BELT_W, y1: BELT_W, z0: 0, z1: BELT_Z })
  const chamber = faces({ x0: -22, x1: 22, y0: -22, y1: 22, z0: WELL_FLOOR + 8 + bob + lift * 0.8, z1: WELL_FLOOR + 40 + bob + lift * 0.8 })
  const [gx, gy] = iso(0, 0, zt)

  return (
    <>
      <div ref={stage} className="ivh-stage">
        <div ref={par} className="ivh-par">
          <svg className={"ivh-svg" + (touring ? " ivh-touring" : "")} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label="An isometric vault on a conveyor: raw records go in, sealed records come out, suspect ones are pushed to quarantine.">
            <defs>
              <radialGradient id={id("glow")}>
                <stop offset="0" stopColor="var(--ivh-accent)" stopOpacity="0.9" />
                <stop offset="1" stopColor="var(--ivh-accent)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("floor")}>
                <stop offset="0" stopColor="var(--ivh-accent)" stopOpacity="0.16" />
                <stop offset="1" stopColor="var(--ivh-accent)" stopOpacity="0" />
              </radialGradient>
              <pattern id={id("hatch")} width="7" height="40" patternUnits="userSpaceOnUse">
                <line x1="1" y1="0" x2="1" y2="40" stroke="var(--ivh-ink)" strokeOpacity="0.28" strokeWidth="1" />
              </pattern>
              <pattern id={id("hq")} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="var(--ivh-ink)" strokeOpacity="0.22" strokeWidth="1.2" />
              </pattern>
              <clipPath id={id("well")}>
                <polygon points={well} />
              </clipPath>
            </defs>

            {/* floor glow and guides */}
            <ellipse cx={0} cy={30} rx={430} ry={250} fill={"url(#" + id("floor") + ")"} />

            <g className="ivh-grp" data-on={on(0) || on(2)}>
              <line className="ivh-e2 ivh-da" x1={iso(-900, -64, 0)[0]} y1={iso(-900, -64, 0)[1]} x2={iso(900, -64, 0)[0]} y2={iso(900, -64, 0)[1]} />
              <line className="ivh-e2 ivh-da" x1={iso(-900, 64, 0)[0]} y1={iso(-900, 64, 0)[1]} x2={iso(-150, 64, 0)[0]} y2={iso(-150, 64, 0)[1]} />
              <polygon className="ivh-e2 ivh-da" points={poly([[-150, -150, 0], [150, -150, 0], [150, 150, 0], [-150, 150, 0]])} />
              {/* belt */}
              <polygon className="ivh-e ivh-ft" points={belt.top} />
              <polygon className="ivh-e ivh-fl" points={belt.left} />
              {slats.map((x) => (
                <line key={x.toFixed(2)} className="ivh-e2" x1={iso(x, -BELT_W, BELT_Z)[0]} y1={iso(x, -BELT_W, BELT_Z)[1]} x2={iso(x, BELT_W, BELT_Z)[0]} y2={iso(x, BELT_W, BELT_Z)[1]} />
              ))}
              {slats.map((x) => (
                <line key={"s" + x.toFixed(2)} className="ivh-e2" x1={iso(x, BELT_W, BELT_Z)[0]} y1={iso(x, BELT_W, BELT_Z)[1]} x2={iso(x, BELT_W, 0)[0]} y2={iso(x, BELT_W, 0)[1]} />
              ))}
            </g>

            {/* quarantine lane */}
            <g className="ivh-grp" data-on={on(2)}>
              <polygon className="ivh-e2 ivh-da" points={poly([[180, LANE_Y - 40, 0], [900, LANE_Y - 40, 0], [900, LANE_Y + 40, 0], [180, LANE_Y + 40, 0]])} fill={"url(#" + id("hq") + ")"} />
              <g transform={floorAt(196, LANE_Y + 30, 0)}>
                <text className="ivh-gt" fill="var(--ivh-muted)" style={{ fontSize: 9 }}>QUARANTINE</text>
              </g>
            </g>

            {/* base plate */}
            <g className="ivh-grp ivh-drop" data-on={on(1)}>
              <polygon className="ivh-e ivh-fr" points={plate.right} />
              <polygon className="ivh-e ivh-fl" points={plate.left} />
              <g transform={wallX(PLATE)}>
                <rect x={-PLATE} y={-PLATE_H} width={PLATE * 2} height={PLATE_H} fill={"url(#" + id("hatch") + ")"} />
              </g>
              <g transform={wallY(PLATE)}>
                <rect x={-PLATE} y={-PLATE_H} width={PLATE * 2} height={PLATE_H} fill={"url(#" + id("hatch") + ")"} />
              </g>
              <polygon className="ivh-e ivh-ft" points={plate.top} />
              <polygon className="ivh-e2" points={poly([[-PLATE, -BELT_W, PLATE_H], [PLATE, -BELT_W, PLATE_H], [PLATE, BELT_W, PLATE_H], [-PLATE, BELT_W, PLATE_H]])} />
              {[-1, 1].flatMap((a) => [-1, 1].map((b) => <Bolt key={a + "" + b} x={a * 114} y={b * 114} z={PLATE_H} r={4.5} h={4} />))}
            </g>

            {/* scan pulse rings */}
            {[0, 1, 2].map((j) => {
              const age = burstAge - j * 0.16
              if (age < 0 || age > 1.3) return null
              const r = 120 + age * 190
              return <ellipse key={j} cx={0} cy={-PLATE_H} rx={r * R2C} ry={r * R2S} fill="none" stroke="var(--ivh-accent)" strokeWidth={1.4} opacity={(1 - age / 1.3) * 0.8} style={{ vectorEffect: "non-scaling-stroke" }} />
            })}

            {/* upstream records */}
            <g className="ivh-grp" data-on={on(0)}>
              {back.map((r) => (
                <RecordCube key={r.k} r={r} id={id} />
              ))}
            </g>

            {/* the vault */}
            <g
              className="ivh-grp ivh-vault"
              data-on={on(1)}
              role="button"
              tabIndex={0}
              aria-label="Run a scan pulse"
              onPointerEnter={() => hoverVault(true)}
              onPointerLeave={() => hoverVault(false)}
              onFocus={() => hoverVault(true)}
              onBlur={() => hoverVault(false)}
              onClick={pulse}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  pulse()
                }
              }}
            >
              <g className="ivh-drop">
                <polygon className="ivh-e ivh-fr ivh-vbody" points={body.right} />
                <polygon className="ivh-e ivh-fl ivh-vbody" points={body.left} />
                <polygon className="ivh-e ivh-ft ivh-vbody" points={body.top} />
                {/* right face: exit slot */}
                <g transform={wallX(VAULT)}>
                  <rect x={-38} y={-(BELT_Z + CUBE_H + 10)} width={76} height={CUBE_H + 10} fill="#000" fillOpacity={0.82} className="ivh-e" />
                  <line x1={-34} y1={-(BELT_Z + CUBE_H + 6)} x2={34} y2={-(BELT_Z + CUBE_H + 6)} stroke="var(--ivh-accent)" strokeOpacity={0.35 + 0.4 * Math.sin(p * Math.PI)} strokeWidth={1.5} style={{ vectorEffect: "non-scaling-stroke" }} />
                  {[-78, -64, -50].map((u) => (
                    <line key={u} className="ivh-e2" x1={u} y1={-118} x2={u + 10} y2={-118} />
                  ))}
                </g>
                {/* left face: status LEDs and plate */}
                <g transform={wallY(VAULT)}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <rect key={i} x={-74 + i * 13} y={-118} width={8} height={5} rx={1} fill={i < lit ? "var(--ivh-accent)" : "none"} className={i < lit ? "" : "ivh-e2"} />
                  ))}
                  <text x={16} y={-113} className="ivh-gt" fill="var(--ivh-muted)" style={{ fontSize: 8 }}>VAULT-01</text>
                  <rect x={-74} y={-96} width={148} height={62} rx={3} className="ivh-e2" />
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <line key={i} className="ivh-e2" x1={-64 + i * 18} y1={-86} x2={-64 + i * 18} y2={-44} />
                  ))}
                </g>
                <Bolt x={-84} y={-84} z={BODY_TOP} />

                {/* lid frame and glass chamber */}
                <polygon className="ivh-e ivh-fr" points={frame.right} />
                <polygon className="ivh-e ivh-fl" points={frame.left} />
                <polygon className="ivh-e ivh-ft" points={frame.top} />
                <polygon points={well} fill="#000" fillOpacity={0.55} />
                <g clipPath={"url(#" + id("well") + ")"}>
                  <polygon className="ivh-e2 ivh-fr" points={poly([[-WELL, -WELL, zt], [-WELL, WELL, zt], [-WELL, WELL, WELL_FLOOR], [-WELL, -WELL, WELL_FLOOR]])} />
                  <polygon className="ivh-e2 ivh-fl" points={poly([[-WELL, -WELL, zt], [WELL, -WELL, zt], [WELL, -WELL, WELL_FLOOR], [-WELL, -WELL, WELL_FLOOR]])} />
                  <g opacity={chamberAlpha}>
                    <RecordCube
                      r={{ k: k0, x: 0, y: 0, z: WELL_FLOOR + 8 + bob + lift * 0.8, cut: -Infinity, kind: chamberKind, noisy: isNoisy(k0) || chamberKind === "quarantine", alpha: 1 }}
                      id={id}
                    />
                  </g>
                  <polygon
                    points={poly([[-WELL, -WELL, beamZ], [WELL, -WELL, beamZ], [WELL, WELL, beamZ], [-WELL, WELL, beamZ]])}
                    fill="var(--ivh-accent)"
                    fillOpacity={0.1 + guard * 0.08}
                    stroke="var(--ivh-accent)"
                    strokeWidth={1.3}
                    style={{ vectorEffect: "non-scaling-stroke" }}
                  />
                </g>
                <polygon points={well} fill="var(--ivh-ink)" fillOpacity={0.04} className="ivh-e" />
                <ellipse cx={gx} cy={gy} rx={70} ry={30} fill={"url(#" + id("glow") + ")"} opacity={glow} style={{ mixBlendMode: "screen" }} pointerEvents="none" />
                <Bolt x={84} y={-84} z={BODY_TOP} />
                <Bolt x={-84} y={84} z={BODY_TOP} />
                <Bolt x={84} y={84} z={BODY_TOP} />
                {[-1, 1].flatMap((a) => [-1, 1].map((b) => <Bolt key={"f" + a + b} x={a * 62} y={b * 62} z={zt} r={3.5} h={3} />))}
              </g>
            </g>

            {/* downstream records */}
            <g className="ivh-grp" data-on={on(2)}>
              {front.map((r) => (
                <RecordCube key={r.k} r={r} id={id} />
              ))}
            </g>

            {/* control plate */}
            <g className="ivh-grp ivh-drop" data-on={!touring}>
              <polygon className="ivh-e2 ivh-da" points={poly([[PANEL_X - 8, PANEL_Y - 8, 0], [PANEL_X + PANEL_W + 8, PANEL_Y - 8, 0], [PANEL_X + PANEL_W + 8, PANEL_Y + PANEL_D + 8, 0], [PANEL_X - 8, PANEL_Y + PANEL_D + 8, 0]])} />
              <polygon className="ivh-e ivh-fr" points={pf.right} />
              <polygon className="ivh-e ivh-fl" points={pf.left} />
              <polygon className="ivh-e ivh-ft" points={pf.top} />
              <g ref={panel} transform={floorAt(PANEL_X, PANEL_Y, PANEL_H)}>
                {[[7, 7], [PANEL_W - 7, 7], [7, PANEL_D - 7], [PANEL_W - 7, PANEL_D - 7]].map(([u, v]) => (
                  <circle key={u + "-" + v} cx={u} cy={v} r={2.6} className="ivh-e2" />
                ))}
                {/* gauge */}
                <path className="ivh-e2" d={"M" + (gc.u - gc.r) + " " + gc.v + " A" + gc.r + " " + gc.r + " 0 0 1 " + (gc.u + gc.r) + " " + gc.v} />
                <path
                  d={"M" + (gc.u - gc.r) + " " + gc.v + " A" + gc.r + " " + gc.r + " 0 0 1 " + (gc.u + gc.r * Math.cos(ga)).toFixed(2) + " " + (gc.v + gc.r * Math.sin(ga)).toFixed(2)}
                  fill="none"
                  stroke="var(--ivh-accent)"
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                {Array.from({ length: 9 }, (_, i) => {
                  const a = Math.PI + (i / 8) * Math.PI
                  return <line key={i} className="ivh-e2" x1={gc.u + Math.cos(a) * 21} y1={gc.v + Math.sin(a) * 21} x2={gc.u + Math.cos(a) * 17} y2={gc.v + Math.sin(a) * 17} />
                })}
                <line x1={gc.u} y1={gc.v} x2={gc.u + Math.cos(ga) * 24} y2={gc.v + Math.sin(ga) * 24} stroke="var(--ivh-ink)" strokeWidth={1.6} strokeLinecap="round" style={{ vectorEffect: "non-scaling-stroke" }} />
                <circle cx={gc.u} cy={gc.v} r={3} fill="var(--ivh-ink)" />
                <text x={gc.u} y={gc.v + 14} textAnchor="middle" className="ivh-gt" fill="var(--ivh-muted)">{"x" + speed.toFixed(1)}</text>
                {/* sliders */}
                {(
                  [
                    ["flow", flow, 34, "FLOW", "Belt speed", "x" + speed.toFixed(1)],
                    ["guard", guard, 70, "GUARD", "Quarantine strictness", Math.round(guard * 100) + "%"],
                  ] as const
                ).map(([which, value, v, name, label, text]) => {
                  const u = TRACK_U0 + value * TRACK_LEN
                  return (
                    <g key={which} {...knobProps(which, value, label, text)}>
                      <rect x={TRACK_U0 - 8} y={v - 18} width={TRACK_LEN + 16} height={28} fill="transparent" />
                      <text x={TRACK_U0} y={v - 9} className="ivh-gt" fill="var(--ivh-muted)">{name}</text>
                      <text x={TRACK_U0 + TRACK_LEN} y={v - 9} textAnchor="end" className="ivh-gt" fill="var(--ivh-ink)">{text}</text>
                      <rect x={TRACK_U0} y={v - 2.5} width={TRACK_LEN} height={5} rx={2.5} className="ivh-e2" />
                      <rect x={TRACK_U0} y={v - 2.5} width={Math.max(0.01, u - TRACK_U0)} height={5} rx={2} className="ivh-ac" opacity={0.55} />
                      <rect className="ivh-kring ivh-e" x={u - 7} y={v - 7} width={14} height={14} rx={4.5} fill="var(--ivh-accent)" />
                      <line x1={u} y1={v - 3} x2={u} y2={v + 3} stroke="var(--ivh-bg)" strokeWidth={1.4} />
                    </g>
                  )
                })}
              </g>
            </g>

            {/* walkthrough markers */}
            {anchors.map((a, i) => {
              const [ax, ay] = iso(a[0], a[1], a[2])
              const my = ay - 62
              const active = tour === i
              const side = markerSide[i]
              return (
                <g
                  key={i}
                  className="ivh-mk"
                  role="button"
                  tabIndex={0}
                  aria-label={"Explain step " + (i + 1) + ": " + steps[i].title}
                  aria-pressed={active}
                  opacity={touring ? (active ? 1 : 0.45) : 0.7}
                  onClick={() => onStep(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onStep(i)
                    }
                  }}
                  style={{ transition: "opacity .4s" }}
                >
                  <line className="ivh-e2 ivh-da" x1={ax} y1={ay} x2={ax} y2={my + 11} style={active ? { stroke: "var(--ivh-accent)" } : undefined} />
                  <circle cx={ax} cy={ay} r={2.5} fill={active ? "var(--ivh-accent)" : "var(--ivh-ink)"} />
                  {active && <circle className="ivh-pulse" cx={ax} cy={my} r={11} fill="none" stroke="var(--ivh-accent)" strokeWidth={1.2} />}
                  <circle cx={ax} cy={my} r={11} fill={active ? "var(--ivh-accent)" : "var(--ivh-bg)"} stroke={active ? "var(--ivh-accent)" : "var(--ivh-line)"} strokeWidth={1.2} style={{ vectorEffect: "non-scaling-stroke" }} />
                  <text x={ax} y={my + 3.5} textAnchor="middle" fill={active ? "var(--ivh-bg)" : "var(--ivh-ink)"}>{"0" + (i + 1)}</text>
                  <text x={ax + side * 18} y={my + 3.5} textAnchor={side > 0 ? "start" : "end"} fill={active ? "var(--ivh-accent)" : "var(--ivh-ink)"}>
                    {steps[i].title.toUpperCase()}
                  </text>
                  <rect x={ax - 14} y={my - 14} width={28} height={28} fill="transparent" />
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      <dl className="ivh-hud" aria-label="Pipeline readout">
        <dt><i />Secured</dt>
        <dd>{fmt(s.secured)}</dd>
        <dt><i className="ivh-q" />Quarantined</dt>
        <dd>{fmt(s.quar)}</dd>
        <dt><i className="ivh-f" />Flow</dt>
        <dd>{flowRate(speed).toFixed(1) + "k/s"}</dd>
        <dt><i className="ivh-f" />Guard</dt>
        <dd>{Math.round(guard * 100) + "%"}</dd>
      </dl>
    </>
  )
}

function Chevron() {
  return (
    <svg className="ivh-chev" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Mark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 2.5 20.5 7.3 12 12 3.5 7.3z" fill="var(--ivh-accent)" />
      <path d="M12 12v9.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export default function IsometricVaultHero({
  brand = "sealwise",
  navLinks = DEFAULT_NAV,
  utilityLinks = [
    { label: "Explore", href: "#" },
    { label: "Sign in", href: "#" },
  ],
  navCta = { label: "Get Started", href: "#" },
  eyebrow = "Pipeline guard · live",
  headline = "AI That Keeps\nData Secured.",
  subtitle = "Real-time cleaning, validation, and monitoring in one hub.",
  primaryCta = { label: "Start now", href: "#" },
  secondaryCta = "See How It Works",
  steps = DEFAULT_STEPS,
  accent = "#ff6a2b",
  ink = "#efe4d2",
  background = "#0f0d0b",
  surface = "#231d17",
  speed = 1,
  strictness = 0.4,
  securedStart = 128400,
  fontFamily = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, Roboto, sans-serif',
  height = "100svh",
  className = "",
  onPrimaryClick,
}: IsometricVaultHeroProps) {
  const reduced = useReducedMotion()
  const [open, setOpen] = React.useState<string | null>(null)
  const [tour, setTour] = React.useState<number | null>(null)
  const nav = React.useRef<HTMLElement>(null)
  const three = steps.length >= 3 ? steps.slice(0, 3) : DEFAULT_STEPS

  React.useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      if (nav.current && !nav.current.contains(e.target as Node)) setOpen(null)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null)
    }
    document.addEventListener("pointerdown", down)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("pointerdown", down)
      document.removeEventListener("keydown", key)
    }
  }, [open])

  // The walkthrough advances on its own unless motion is reduced; picking a
  // step restarts its timer.
  React.useEffect(() => {
    if (tour === null || reduced) return
    const tm = setTimeout(() => setTour((n) => (n === null ? null : (n + 1) % 3)), TOUR_MS)
    return () => clearTimeout(tm)
  }, [tour, reduced])

  const lines = headline.split("\n")
  const last = lines.length - 1

  const style = {
    height,
    "--ivh-bg": background,
    "--ivh-ink": ink,
    "--ivh-accent": accent,
    "--ivh-surface": surface,
    "--ivh-font": fontFamily,
    "--ivh-tour": TOUR_MS + "ms",
  } as React.CSSProperties

  return (
    <section className={"ivh " + className} style={style} aria-label={brand + " hero"}>
      <style>{CSS}</style>
      <div className="ivh-bgfx" />
      <div className="ivh-dots" />

      <Scene steps={three} tour={tour} onStep={setTour} speed={speed} strictness={strictness} securedStart={securedStart} reduced={reduced} />
      <div className="ivh-fade" />

      <nav ref={nav} className="ivh-nav" aria-label="Primary">
        <div className="ivh-nl">
          {navLinks.map((l) =>
            l.items?.length ? (
              <div key={l.label} className="ivh-dd">
                <button type="button" className="ivh-link" aria-expanded={open === l.label} onClick={() => setOpen((o) => (o === l.label ? null : l.label))}>
                  {l.label}
                  <Chevron />
                </button>
                <div className="ivh-menu" data-open={open === l.label}>
                  {l.items.map((it) => (
                    <a key={it.label} className="ivh-mi" href={it.href ?? "#"} tabIndex={open === l.label ? 0 : -1} onClick={() => setOpen(null)}>
                      <i />
                      <div>
                        <b>{it.label}</b>
                        {it.description && <span>{it.description}</span>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <a key={l.label} className="ivh-link" href={l.href ?? "#"}>
                {l.label}
              </a>
            ),
          )}
        </div>
        <a className="ivh-brand" href="#" aria-label={brand + " home"}>
          <Mark />
          <span>{brand}</span>
        </a>
        <div className="ivh-nr">
          {utilityLinks.map((l) => (
            <a key={l.label} className="ivh-link" href={l.href ?? "#"}>
              {l.label}
            </a>
          ))}
          <a className="ivh-chip" href={navCta.href ?? "#"}>
            {navCta.label}
          </a>
        </div>
      </nav>

      <div className="ivh-copy">
        {eyebrow && (
          <div className="ivh-eyebrow">
            <i />
            {eyebrow}
          </div>
        )}
        <h1 className="ivh-h1">
          {lines.map((line, i) => {
            const dot = i === last && /[.!]$/.test(line)
            return (
              <span key={i}>
                <em>
                  {dot ? line.slice(0, -1) : line}
                  {dot && <span className="ivh-dot">{line.slice(-1)}</span>}
                </em>
              </span>
            )
          })}
        </h1>
        {subtitle && <p className="ivh-sub">{subtitle}</p>}
        <div className="ivh-ctas">
          <a className="ivh-btn ivh-p" href={primaryCta.href ?? "#"} onClick={onPrimaryClick}>
            {primaryCta.label}
            <svg viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 7h9M7.5 3.5 11 7l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <button type="button" className="ivh-btn ivh-s" aria-pressed={tour !== null} onClick={() => setTour((n) => (n === null ? 0 : null))}>
            <svg viewBox="0 0 14 14" aria-hidden="true">
              {tour === null ? (
                <path d="M4 2.8v8.4L11 7z" fill="currentColor" />
              ) : (
                <path d="M3.5 3.5h7v7h-7z" fill="currentColor" />
              )}
            </svg>
            {tour === null ? secondaryCta : "Stop walkthrough"}
          </button>
        </div>
        {tour !== null && (
          <div className="ivh-tour" key={tour} role="status" aria-live="polite">
            <div className="ivh-tour-h">
              {"Step 0" + (tour + 1)}
              <b>{three[tour].title}</b>
            </div>
            <p>{three[tour].body}</p>
            <div className="ivh-bars">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  type="button"
                  className="ivh-bar"
                  aria-label={"Go to step " + (i + 1)}
                  data-s={i < tour ? "done" : i === tour ? "on" : "todo"}
                  data-hold={reduced}
                  onClick={() => setTour(i)}
                >
                  <i />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
