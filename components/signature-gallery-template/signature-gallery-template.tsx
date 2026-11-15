import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"

// #region scene
// Pure: scroll and time in, poses out. No React, no DOM — the test lifts this region and runs it.

export const clamp01 = (x: number) => (x > 0 ? (x > 1 ? 1 : x) : 0)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Smootherstep: zero velocity at both ends. */
export const smooth = (x: number) => {
  x = clamp01(x)
  return x * x * x * (x * (x * 6 - 15) + 10)
}
export const easeInOutCubic = (x: number) => {
  x = clamp01(x)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3)

/** Camera: 670px perspective; the whole field moves 6987px toward it across the pinned scroll. */
export const PERSPECTIVE = 670
export const TRAVEL = 6987
/** The field draws in toward the centre as you fly: positions shrink to 0.78 by the end. */
export const SPREAD_END = 0.78
/** Cards fade out just before they would pass through the lens. */
export const NEAR_FADE: [number, number] = [430, 620]
/** The portrait sits behind everything else. */
export const PORTRAIT_Z = -7107
/** Scroll window in which the portrait grows from its far size to its close-up, and the signature draws. */
export const GROW: [number, number] = [0.755, 0.99]
export const DRAW: [number, number] = [0.83, 0.97]

export type Card = { x: number; y: number; z: number; w: number; h: number; img: number; fade: number }

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** n cards: x, y in fractions of the stage (±0.86 wide, ±1.2 tall), depth spread from -6900 to +600, never on the axis. */
export function makeField(n: number, images: number, seed = 7): Card[] {
  const r = mulberry32(seed)
  const out: Card[] = []
  while (out.length < n) {
    // gathered toward the axis, as a hung wall is: half the cards sit within a third of the field's reach
    const x = (r() < 0.5 ? -1 : 1) * 0.86 * Math.pow(r(), 1.3)
    const y = (r() < 0.5 ? -1 : 1) * 1.2 * Math.pow(r(), 1.7)
    const z = -6500 + Math.pow(r(), 0.72) * 7100
    // the deepest cards arrive last, as the portrait comes forward: keep them out of its way
    if ((x / 0.86) ** 2 + (y / 1.2) ** 2 < (z < -4300 ? 0.34 : 0.02)) continue
    const w = Math.min(360, 110 + Math.pow(r(), 0.8) * 330)
    const ar = 0.75 + r() * 0.6
    out.push({ x, y, z, w, h: Math.min(340, Math.max(56, w * ar)), img: out.length % images, fade: r() })
  }
  return out
}

/** Intro, in seconds from mount: the portrait rises in close, then the collage zooms back into place around it. */
export const INTRO = { rise: [0, 0.65], recede: [1.35, 2.45], field: [1.35, 3.15], fadeAt: 1.4, fadeSpread: 1.3, fadeFor: 0.45, lift: 0.7, near: -260, nearW: 0.404, push: 6850 } as const
export const introDone = (t: number) => t >= INTRO.field[1] + 0.05 && t >= INTRO.fadeAt + INTRO.fadeSpread + INTRO.fadeFor

const span = (t: number, w: readonly [number, number]) => (t - w[0]) / (w[1] - w[0])

/** Where a card is at scroll p (0..1) and intro time t. x, y are fractions of the stage; z in px. */
export function cardPose(c: Card, p: number, t: number) {
  const s = 1 - (1 - SPREAD_END) * p
  const z = c.z + p * TRAVEL + INTRO.push * (1 - easeInOutCubic(span(t, INTRO.field)))
  const appear = clamp01((t - INTRO.fadeAt - c.fade * INTRO.fadeSpread) / INTRO.fadeFor)
  const near = 1 - clamp01((z - NEAR_FADE[0]) / (NEAR_FADE[1] - NEAR_FADE[0]))
  return { x: c.x * s, y: c.y * s, z, o: appear * near, hidden: z > NEAR_FADE[1] || appear <= 0 }
}

/** The portrait: rises in at the front, recedes to the back of the field, then grows into the close-up as you arrive. */
export function portraitPose(p: number, t: number) {
  const restZ = PORTRAIT_Z + p * TRAVEL
  const grow = smooth(span(p, GROW))
  const k = easeInOutCubic(span(t, INTRO.recede))
  const rise = easeOutCubic(span(t, INTRO.rise))
  return {
    z: lerp(INTRO.near, restZ, k),
    /** 0 = intro size, 1 = far size, then grow on top of that. */
    recede: k,
    grow,
    y: INTRO.lift * (1 - rise),
    o: rise,
  }
}

/** Fraction of the signature drawn at scroll p. */
export const sigDrawn = (p: number) => clamp01(span(p, DRAW))

/** Cursor tilt in degrees for a pointer at (mx, my) in -1..1 from the stage centre. */
export const tilt = (mx: number, my: number) => ({ rx: -my * 5, ry: mx * 6.9 })

/** Frame-rate independent easing toward a target. */
export const follow = (cur: number, target: number, dt: number, rate: number) => cur + (target - cur) * (1 - Math.exp(-dt * rate))

/** Words of a line reveal from both edges inward: the step of word i of n. */
export const edgeStep = (i: number, n: number) => Math.min(i, n - 1 - i)

/** Scroll progress through a pinned track: 0 → 1 while it is stuck; clamps outside, never NaN. */
export const progressFrom = (top: number, height: number, stage: number) => {
  const travel = height - stage
  if (!(travel > 0)) return 0
  return clamp01(-top / travel)
}

/** The same letters in a different order: what a word shows while it is still arriving. */
export function shuffled(text: string, rnd: () => number) {
  const a = text.split("")
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a.join("")
}

/** Timeline ruler: 42 ticks, 14px wide, swelling to 36px where the scroll is; 4.3px shorter per tick away. */
export const TICKS = 42
export const tickWidth = (i: number, peak: number) => Math.max(14, 36 - 4.3 * Math.abs(i - peak))
/** Every fifth tick and the one before it are ink, the rest grey. */
export const tickInk = (i: number) => i % 5 === 0 || i % 5 === 4
/** Which of n timeline entries is lit at scroll p. */
export const timelineStep = (p: number, n: number) => Math.round(clamp01(p) * (n - 1))

/** Project rail: cards sit `pitch` apart and repeat forever; which of n is nearest the middle at offset pos. */
export const RAIL_PITCH = 300
export const railCentre = (pos: number, n: number) => (((Math.round(pos / RAIL_PITCH) % n) + n) % n)
/** Keep an endless offset inside one lap so the three laid copies always cover the screen. */
export const wrap = (pos: number, span: number) => (span > 0 ? ((pos % span) + span) % span : 0)
// #endregion

type Discipline = { name: string; href?: string; images: number[]; projects: string[] }
type Project = { title: string; discipline: string; image: number; href?: string }
type Milestone = { year: string; text: string; image: number }
type View = "home" | "about" | "projects"

export type SignatureGalleryTemplateProps = {
  /** Height of every pinned stage (gallery hero, timeline, project rail). All their measures are taken against it. */
  height?: string
  /** Scroll travel of the gallery hero, in stage heights (the fly-through plays across it). */
  heroLength?: number
  name?: string
  /** Gallery photographs (any URLs). Defaults to eighteen photographs served from kedhar-components.pages.dev. */
  images?: string[]
  /** The photograph the gallery folds into (4 : 5). */
  portrait?: string
  /** The manifesto, one entry per line: each line wipes in on its own. */
  manifesto?: string[]
  disciplines?: Discipline[]
  /** About view: the three headline lines (the last is set in blue italic) and its two cut-out pictures. */
  aboutTitle?: [string, string, string]
  aboutCutouts?: [string, string]
  narrativeKicker?: string
  narrativeTitle?: string
  narrativeText?: string
  narrativePortrait?: string
  timelineLabel?: string
  timeline?: Milestone[]
  /** Projects view: the rail. `image` indexes into `images`. */
  projects?: Project[]
  ctaLabel?: string
  ctaLead?: string
  ctaLines?: string[]
  ctaButton?: string
  email?: string
  clients?: string[]
  /** Which view opens first. */
  initialView?: View
  className?: string
  style?: CSSProperties
}

const IMG_BASE = "https://kedhar-components.pages.dev/signature-gallery-template/"
const DEFAULT_IMAGES = Array.from({ length: 18 }, (_, i) => IMG_BASE + "p" + String(i + 1).padStart(2, "0") + ".webp")
const DEFAULT_PORTRAIT = IMG_BASE + "hero.webp"
const DEFAULT_CUTOUTS: [string, string] = [IMG_BASE + "walk.webp", IMG_BASE + "screen.webp"]
const DEFAULT_TALL = IMG_BASE + "tall.webp"

const DEFAULT_MANIFESTO = [
  "I believe that interface design",
  "should provoke thought and carry real",
  "clarity, leaving people with a",
  "quiet understanding of the product.",
  "Every component I build must outlast",
  "the screenshot, turning fleeting",
  "taps into calm, lasting habits.",
]

const DEFAULT_DISCIPLINES: Discipline[] = [
  { name: "Interface", images: [11, 0, 8], projects: ["Project 01", "Project 02", "Project 03"] },
  { name: "Motion", images: [13, 7, 3], projects: ["Project 04", "Project 05", "Project 06"] },
  { name: "Components", images: [2, 6, 15], projects: ["Project 07", "Project 08", "Project 09"] },
  { name: "Templates", images: [16, 9, 1], projects: ["Project 10", "Project 11", "Project 12"] },
  { name: "Systems", images: [5, 12, 10], projects: ["Project 13", "Project 14", "Project 15"] },
]

const RAIL_ORDER = [11, 13, 2, 16, 5, 0, 7, 6, 9, 12, 8, 3, 15, 1, 10]
const DEFAULT_PROJECTS: Project[] = RAIL_ORDER.map((image, i) => ({
  title: "Project " + String(i + 1).padStart(2, "0"),
  discipline: DEFAULT_DISCIPLINES[i % 5].name,
  image,
}))

const DEFAULT_TIMELINE: Milestone[] = [
  { year: "2019", text: "First interfaces and early experiments.", image: 0 },
  { year: "2021", text: "A growing practice and a turn to motion.", image: 13 },
  { year: "2023", text: "A component library and a wider reach.", image: 2 },
  { year: "2026", text: "The current phase: templates built to last.", image: 17 },
]

const SIG = "M20 236C24.7 238 37.3 249.7 48 248C58.7 246.3 72.3 239.3 84 226C95.7 212.7 107 189.7 118 168C129 146.3 141.7 117.3 150 96C158.3 74.7 166.3 51 168 40C169.7 29 163.7 26.7 160 30C156.3 33.3 151.3 43.3 146 60C140.7 76.7 134 105.7 128 130C122 154.3 114 189 110 206C106 223 103.7 230.7 104 232C104.3 233.3 107 224.3 112 214C117 203.7 124.3 184 134 170C143.7 156 158 141 170 130C182 119 197.3 109 206 104C214.7 99 222 96.7 222 100C222 103.3 214.7 116 206 124C197.3 132 179.3 142.7 170 148C160.7 153.3 149 152.3 150 156C151 159.7 168.3 161.7 176 170C183.7 178.3 189.7 196.7 196 206C202.3 215.3 207.3 223.3 214 226C220.7 228.7 228 227 236 222C244 217 254 203.3 262 196C270 188.7 278.3 182.3 284 178C289.7 173.7 295.7 172 296 170C296.3 168 291 163.7 286 166C281 168.3 270 177.3 266 184C262 190.7 260.3 201 262 206C263.7 211 269.7 214.3 276 214C282.3 213.7 291.7 209 300 204C308.3 199 317.7 189.7 326 184C334.3 178.3 343.3 172.3 350 170C356.7 167.7 365.7 170.7 366 170C366.3 169.3 357.7 164.3 352 166C346.3 167.7 336.3 173.7 332 180C327.7 186.3 324.7 198.7 326 204C327.3 209.3 333.7 213 340 212C346.3 211 356.3 206.7 364 198C371.7 189.3 378.7 177 386 160C393.3 143 402.7 113.3 408 96C413.3 78.7 418 61.7 418 56C418 50.3 412.3 49.7 408 62C403.7 74.3 397 106 392 130C387 154 380 192 378 206C376 220 376.7 217.3 380 214C383.3 210.7 391 201 398 186C405 171 414.3 144.7 422 124C429.7 103.3 441.7 73.7 444 62C446.3 50.3 440 45 436 54C432 63 424.3 91.7 420 116C415.7 140.3 411.3 183.7 410 200C408.7 216.3 408.7 216.3 412 214C415.3 211.7 423.3 193.3 430 186C436.7 178.7 446.3 171.7 452 170C457.7 168.3 462.7 170 464 176C465.3 182 459 199.7 460 206C461 212.3 464 215.7 470 214C476 212.3 487.7 202.7 496 196C504.3 189.3 514 178.3 520 174C526 169.7 533.3 171.3 532 170C530.7 168.7 518 162.7 512 166C506 169.3 498 182.3 496 190C494 197.7 496 209.3 500 212C504 214.7 513.3 211 520 206C526.7 201 536 187.7 540 182C544 176.3 543.7 169 544 172C544.3 175 540.3 193.3 542 200C543.7 206.7 547.7 213.7 554 212C560.3 210.3 573.3 197 580 190C586.7 183 592.3 170 594 170C595.7 170 589 188 590 190C591 192 595 185.3 600 182C605 178.7 612.3 172.3 620 170C627.7 167.7 637 167 646 168C655 169 669.3 174.7 674 176"

const F_SERIF = "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"
const F_ITALIC = "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"
const F_MONO = "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"

const SERIF = "SgSerif,'Instrument Serif','Iowan Old Style',Georgia,serif"
const ITALIC = "SgItalic,'Instrument Serif',Georgia,serif"
const MONO = "SgMono,'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace"
const SANS = "Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif"
const EASE = "cubic-bezier(.16,1,.3,1)"
const SPRING = "cubic-bezier(.34,1.56,.64,1)"

// Instrument Serif (regular, italic) and IBM Plex Mono: SIL OFL 1.1, subset to Latin and renamed SgSerif, SgItalic and SgMono as the licence asks of modified copies.
const CSS =
  "@font-face{font-family:SgSerif;src:url(data:font/woff2;base64," + F_SERIF + ") format('woff2');font-display:swap}" +
  "@font-face{font-family:SgItalic;src:url(data:font/woff2;base64," + F_ITALIC + ") format('woff2');font-display:swap}" +
  "@font-face{font-family:SgMono;src:url(data:font/woff2;base64," + F_MONO + ") format('woff2');font-display:swap}" +
  ".sg-root{position:relative;width:100%;background:#e8e8e8;color:#000;font-family:" + SERIF + ";-webkit-font-smoothing:antialiased;isolation:isolate;overflow-x:clip}" +
  ".sg-root *,.sg-root *::before,.sg-root *::after{box-sizing:border-box}" +
  ".sg-root img,.sg-root svg{max-width:none}" +
  ".sg-root a{color:inherit;text-decoration:none}" +
  ".sg-root button{appearance:none;background:none;border:0;padding:0;margin:0;color:inherit;font:inherit;cursor:pointer}" +
  ".sg-root a:focus-visible,.sg-root button:focus-visible{outline:2px solid #00f;outline-offset:4px}" +
  /* nav */
  ".sg-head{position:sticky;top:0;height:0;z-index:30}" +
  ".sg-bar{position:absolute;left:0;right:0;top:0;height:78px;display:flex;align-items:center;justify-content:space-between;padding:0 18px 0 12px;pointer-events:none}" +
  ".sg-logo{display:block;width:81px;height:39px;pointer-events:auto}" +
  ".sg-logo path{fill:none;stroke:currentColor;stroke-width:9;stroke-linecap:round;stroke-linejoin:round}" +
  ".sg-links{display:flex;align-items:center;gap:30px;pointer-events:auto;font-family:" + MONO + ";font-size:18px;line-height:23px;letter-spacing:-.02em}" +
  ".sg-links a{display:block;transition:opacity .2s}" +
  ".sg-links a:hover{opacity:.55}" +
  ".sg-links a.is-active{padding:7px 14px;background:#00f;color:#e6e6e6;opacity:1}" +
  ".sg-burger{display:none;pointer-events:auto;width:44px;height:44px;position:relative}" +
  ".sg-burger i{position:absolute;left:13px;right:13px;height:1.5px;background:currentColor;transition:transform .35s " + EASE + ",top .35s " + EASE + "}" +
  ".sg-burger i:nth-child(1){top:18px}.sg-burger i:nth-child(2){top:25px}" +
  ".sg-burger.is-open i:nth-child(1){top:21.5px;transform:rotate(45deg)}.sg-burger.is-open i:nth-child(2){top:21.5px;transform:rotate(-45deg)}" +
  /* gallery hero */
  ".sg-track{position:relative;width:100%}" +
  ".sg-stage{position:sticky;top:0;width:100%;overflow:hidden;perspective:670px;background:#e6e6e4}" +
  ".sg-world{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}" +
  ".sg-card{position:absolute;left:50%;top:50%;overflow:hidden;background:#d5d5d3;will-change:transform}" +
  ".sg-card img,.sg-portrait img{display:block;width:100%;height:100%;object-fit:cover;user-select:none;-webkit-user-drag:none}" +
  ".sg-portrait{position:absolute;left:50%;top:50%;overflow:hidden;background:#cfcfcd;will-change:transform,width,height}" +
  ".sg-sig{position:absolute;left:50%;top:50%;width:min(92vw,880px);height:auto;transform:translate(-60%,-60%);pointer-events:none;overflow:visible}" +
  ".sg-sig path{fill:none;stroke:#fff;stroke-width:13;stroke-linecap:round;stroke-linejoin:round}" +
  /* shared word reveal */
  ".sg-w{display:inline-block;white-space:pre;opacity:0;transform:translateY(40px);color:#969696;transition:opacity 1.4s " + EASE + ",transform 1.4s " + EASE + ",color 1.1s ease;transition-delay:calc(var(--d,0) * 1s)}" +
  ".sg-w.is-on{opacity:1;transform:none;color:inherit}" +
  /* manifesto */
  ".sg-about{padding:410px 40px 80px;display:flex;justify-content:center}" +
  ".sg-lines{display:flex;flex-direction:column;align-items:center;gap:20px;width:100%;max-width:1100px}" +
  ".sg-line{position:relative;display:flex;flex-wrap:wrap;justify-content:center;column-gap:.25em;width:100%;font-size:clamp(34px,5.21vw,75px);line-height:1.05;letter-spacing:-.01em}" +
  ".sg-hl{position:absolute;inset:-8px;background:#00f;transform:scaleX(0);pointer-events:none;z-index:1}" +
  ".sg-line.is-in>.sg-hl{animation:sg-wipe 1.6s both}" +
  ".sg-line .sg-w.is-on{animation:sg-ink 1.3s ease both;animation-delay:calc(var(--d,0) * 1s)}" +
  "@keyframes sg-wipe{0%{transform:scaleX(0);animation-timing-function:cubic-bezier(.3,0,.2,1)}14%{transform:scaleX(1);animation-timing-function:" + EASE + "}100%{transform:scaleX(0)}}" +
  /* disciplines */
  ".sg-cats{padding:150px 40px}" +
  ".sg-cats-head{display:flex;flex-direction:column;align-items:center;margin-bottom:80px}" +
  ".sg-kicker{font-size:28px;line-height:1.2;letter-spacing:-.04em}" +
  ".sg-title{display:flex;align-items:flex-end;gap:9px;margin:0;font-weight:400;font-size:clamp(44px,5.21vw,75px);line-height:1.05;letter-spacing:-.01em}" +
  ".sg-dot{width:6px;height:6px;background:#00f;margin-bottom:.49em}" +
  ".sg-rows{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:72px}" +
  ".sg-row{position:relative;display:flex;align-items:flex-end;justify-content:center;gap:34px;height:360px;padding-bottom:30px;cursor:pointer}" +
  ".sg-row.is-rev{flex-direction:row-reverse}" +
  ".sg-prev{position:relative;width:300px;height:300px;flex:none;overflow:hidden;overflow:clip}" +
  ".sg-photo{position:absolute;inset:0;background:#d8d8d8;transform:translateY(-101%)}" +
  ".sg-photo img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;transition:transform .5s " + SPRING + "}" +
  ".sg-c1,.sg-c2{position:absolute;inset:0;transform:translateY(-101%)}" +
  ".sg-c1{background:#00f}.sg-c2{background:#000;z-index:2}" +
  ".sg-row.is-in .sg-c1{animation:sg-drop 1s " + EASE + " both}" +
  ".sg-row.is-in .sg-c2{animation:sg-pass .8s cubic-bezier(.65,0,.35,1) .12s both}" +
  "@keyframes sg-pass{from{transform:translateY(-101%)}to{transform:translateY(101%)}}" +
  ".sg-row.is-in .sg-photo{animation:sg-drop 1s " + EASE + " .3s both}" +
  "@keyframes sg-drop{from{transform:translateY(-101%)}to{transform:none}}" +
  ".sg-flash{position:absolute;inset:0;background:#00f;transform:translateY(101%);pointer-events:none}" +
  ".sg-flash.is-go{animation:sg-flash .7s cubic-bezier(.65,0,.35,1)}" +
  "@keyframes sg-flash{0%{transform:translateY(101%)}45%{transform:none}100%{transform:translateY(-101%)}}" +
  ".sg-name{display:flex;align-items:flex-start;gap:10px;margin-bottom:25px}" +
  ".sg-name b{font-weight:400;font-size:clamp(44px,5.21vw,75px);line-height:1.05;letter-spacing:-.01em}" +
  ".sg-name i{font-style:normal;font-size:22px;line-height:1.05;letter-spacing:-.01em}" +
  ".sg-name .sg-w{transition:opacity 1.25s " + EASE + " .4s,transform 1.25s " + EASE + " .4s}" +
  ".sg-name .sg-w.is-on{animation:sg-ink 1.25s ease .4s both}" +
  "@keyframes sg-ink{0%{color:#969696}55%{color:#00f}100%{color:#000}}" +
  ".sg-rule{position:absolute;left:0;right:0;bottom:0;height:1px;background:#6f6fff;transform:scaleX(0);transition:transform .55s " + SPRING + "}" +
  ".sg-arrow{position:absolute;right:4px;top:47px;width:112px;height:16px;opacity:0;transform:translateX(-80px);transition:transform .45s " + EASE + ",opacity .3s}" +
  ".sg-arrow path{fill:none;stroke:currentColor;stroke-width:1.6}" +
  ".sg-row.is-hot .sg-photo img{transform:scale(1.3)}" +
  ".sg-row.is-hot .sg-rule{transform:scaleX(1)}" +
  ".sg-row.is-hot .sg-arrow{opacity:1;transform:none}" +
  ".sg-row.is-left .sg-arrow{opacity:0;transform:translateX(80px)}" +
  /* about view: headline */
  ".sg-ah{position:relative;overflow:hidden}" +
  ".sg-ah-l{position:absolute;margin:0;font-weight:400;font-size:min(10.42vw,150px);line-height:1.05;letter-spacing:-.01em;white-space:nowrap;display:flex;column-gap:.25em}" +
  ".sg-ah-l .sg-w{transform:translateY(20px);color:#969696;transition:opacity 1.1s " + EASE + ",transform 1.1s " + EASE + ";transition-delay:calc(var(--d,0) * 1s)}" +
  ".sg-ah-l .sg-w.is-on{transform:none;animation:sg-ink 1.1s ease both;animation-delay:calc(var(--d,0) * 1s)}" +
  ".sg-ah-l.is-3 .sg-w.is-on{animation-name:sg-ink3}" +
  "@keyframes sg-ink3{0%{color:#969696}100%{color:#00f}}" +
  ".sg-ah-l.is-1{left:39.4%;top:23.8%}.sg-ah-l.is-2{left:22%;top:41.2%}.sg-ah-l.is-3{left:51%;top:58.8%;font-family:" + ITALIC + ";color:#00f}" +
  ".sg-cut.is-a{left:34.6%;top:38%;width:12.4%}.sg-cut.is-b{left:53.3%;top:37.8%;width:19%}" +
  ".sg-cut{position:absolute;opacity:0}" +
  ".sg-cut img{display:block;width:100%;height:auto}" +
  ".sg-cut.is-a{transform:translateY(60px)}.sg-cut.is-b{transform:scale(1.3)}" +
  ".sg-ah.is-in .sg-cut{opacity:1;transition:opacity .35s ease .12s,transform .75s " + EASE + " .12s}" +
  ".sg-ah.is-in .sg-cut.is-a{transform:none}.sg-ah.is-in .sg-cut.is-b{transform:rotate(8deg)}" +
  /* about view: narrative */
  ".sg-nar{position:relative;display:flex;justify-content:space-between;gap:24px;padding:64px 25px 64px;min-height:900px}" +
  ".sg-nar-l{display:flex;flex-direction:column;justify-content:space-between;padding:81px 0 81px;flex:1;min-width:0}" +
  ".sg-nar-k{font-size:36px;line-height:1.15;letter-spacing:-.04em}" +
  ".sg-nar-t{margin:0;font-weight:400;font-size:min(10.42vw,150px);line-height:.95;letter-spacing:-.01em}" +
  ".sg-nar-b{display:flex;align-items:flex-end;gap:32px}" +
  ".sg-nar-box{flex:none;width:234px;height:242px;background:#00f;padding:31px 27px}" +
  ".sg-nar-box img{display:block;width:100%;height:100%;object-fit:cover}" +
  ".sg-nar-p{margin:0;max-width:484px;font-size:42px;line-height:1.2;letter-spacing:-.01em}" +
  ".sg-nar-r{flex:none;width:min(35.8vw,515px);aspect-ratio:515/772;background:#cfcfcd;overflow:hidden}" +
  ".sg-nar-r img{display:block;width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.05)}" +
  /* about view: timeline */
  ".sg-tl{position:relative;background:#e7e7e5;padding-top:239px}" +
  ".sg-tl-stage{position:sticky;top:0;display:flex;align-items:center;justify-content:center;gap:40px;padding:44px 48px;overflow:hidden}" +
  ".sg-tl-art{position:relative;width:54%;height:100%;min-height:320px}" +
  ".sg-sq{position:absolute;width:280px;aspect-ratio:1/1;background:#073bff;overflow:hidden;transform:translate(-50%,-50%) scale(.75) rotate(var(--r));transition:transform .45s cubic-bezier(.22,1,.36,1)}" +
  ".sg-sq img{display:block;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .25s ease}" +
  ".sg-sq.is-on{transform:translate(-50%,-50%);z-index:40}" +
  ".sg-sq.is-on img{opacity:1;transition-delay:.2s}" +
  ".sg-tl-col{width:46%;display:flex;flex-direction:column;gap:16px}" +
  ".sg-tl-label{font-size:32px;line-height:1;letter-spacing:-.03em}" +
  ".sg-tl-rule{height:1px;background:#073bff;opacity:.95}" +
  ".sg-tl-grid{display:grid;grid-template-columns:36px auto;gap:16px;min-height:320px}" +
  ".sg-tl-ticks{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;padding:4px 0}" +
  ".sg-tl-ticks i{display:block;height:1px;width:14px;background:#ccc;opacity:.85}" +
  ".sg-tl-ticks i.is-ink{background:#000;opacity:1}" +
  ".sg-tl-items{display:flex;flex-direction:column;gap:40px;padding:2px 0}" +
  ".sg-tl-item{display:flex;flex-direction:column;align-items:flex-start;gap:6px}" +
  ".sg-tl-year{font-size:45px;line-height:1;letter-spacing:-.01em;color:#ccc;transform-origin:0 50%;transition:transform .45s cubic-bezier(.22,1,.36,1),color .3s}" +
  ".sg-tl-text{font-size:25px;line-height:1.3;letter-spacing:-.01em;min-height:1.2em;opacity:0;transform:translateY(4px);transition:opacity .3s,transform .3s}" +
  ".sg-tl-item.is-on .sg-tl-year{color:#000;transform:translateX(2px) scale(1.16)}" +
  ".sg-tl-item.is-on .sg-tl-text{opacity:1;transform:none;transition-delay:.25s}" +
  /* projects view: rail */
  ".sg-rail{position:relative;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;min-height:620px;background:#e6e6e6;font-family:" + SANS + "}" +
  ".sg-rail-top{padding-top:93px}" +
  ".sg-filters{display:flex;flex-wrap:wrap;align-items:center;gap:20px;padding:0 8vw;margin-bottom:24px}" +
  ".sg-filters button{position:relative;padding:0 0 3px;font-size:14px;font-weight:500;line-height:1.2;text-transform:uppercase;opacity:.5;transition:opacity .3s}" +
  ".sg-filters button::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;opacity:.25;transform-origin:50% 50%;transition:opacity .3s}" +
  ".sg-filters button:hover{opacity:.8}" +
  ".sg-filters button[aria-pressed=true]{opacity:1}" +
  ".sg-filters button[aria-pressed=true]::after{opacity:1;animation:sg-under .35s " + EASE + "}" +
  "@keyframes sg-under{from{transform:scaleX(0)}to{transform:none}}" +
  ".sg-strip{touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none;padding-bottom:18px}" +
  ".sg-strip.is-drag{cursor:grabbing}" +
  ".sg-strip-in{display:flex;align-items:flex-start;gap:40px;padding:0 8vw;will-change:transform;transition:opacity .35s ease,transform .35s ease}" +
  ".sg-strip.is-swap .sg-strip-in{opacity:0}" +
  ".sg-pc{flex:none;width:260px;display:flex;flex-direction:column;align-items:flex-start;gap:12px;opacity:.92;transform-origin:50% 50%;transition:transform .35s " + EASE + ",opacity .3s}" +
  ".sg-pc span{font-size:12px;line-height:1;letter-spacing:.08em;text-transform:uppercase;opacity:.8}" +
  ".sg-pc img{display:block;width:260px;height:260px;object-fit:cover;pointer-events:none}" +
  ".sg-pc.is-mid{transform:scale(1.13);opacity:1}" +
  ".sg-strip.is-swap .sg-pc{transform:translateY(-18px) scale(.85)}" +
  ".sg-rail-b{display:flex;flex-direction:column;align-items:center;gap:22px;padding:22px max(24px,8vw) 34px;text-align:center}" +
  ".sg-rail-k{font-size:14px;line-height:1.1}" +
  ".sg-rail-t{transition:opacity .35s ease;margin:0;font-family:" + SERIF + ";font-weight:400;font-size:min(17.36vw,250px);line-height:.95;letter-spacing:-.03em;text-transform:uppercase;white-space:nowrap}" +
  ".sg-rail-a{font-size:14px;line-height:1;letter-spacing:-.01em;text-decoration:underline!important;text-underline-offset:3px}" +
  /* cta */
  ".sg-cta-wrap{padding-top:82px}" +
  ".sg-cta{position:relative;background:#00f;color:#fff;padding:44px 50px 30px 47px;height:552px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}" +
  ".sg-cta-top{display:flex;justify-content:space-between;align-items:center;gap:24px;height:60px;font-family:" + MONO + ";font-size:15px;line-height:24px;letter-spacing:-.02em;color:#e6e6e6}" +
  ".sg-ticks{display:flex;align-items:center;gap:8px;width:552px;max-width:48vw}" +
  ".sg-ticks span{flex:1;display:flex;align-items:center;justify-content:space-between;min-width:0}" +
  ".sg-ticks i{display:block;flex:none;width:2px;height:16px;background:#fff;opacity:.9;animation:sg-tick 2.75s ease-in-out infinite;animation-delay:calc(var(--i) * 83ms)}" +
  ".sg-ticks b{display:block;flex:none;width:6px;height:6px;background:#fff}" +
  "@keyframes sg-tick{0%{transform:rotate(0)}40%{transform:rotate(360deg)}100%{transform:rotate(360deg)}}" +
  ".sg-lead{font-family:" + ITALIC + ";font-size:36px;line-height:47px;letter-spacing:-.04em;margin:0 0 42px;color:#e6e6e6}" +
  ".sg-para{margin:0;font-size:clamp(28px,3.2vw,46px);line-height:1.05;letter-spacing:-.01em}" +
  ".sg-pl{display:block;white-space:nowrap}" +
  ".sg-para .sg-w{margin-right:.25em;transform:translateY(20px);color:#8a8a8a;transition:opacity 1.1s " + EASE + ",transform 1.1s " + EASE + ",color .9s ease;transition-delay:calc(var(--d,0) * 1s)}" +
  ".sg-para .sg-w.is-on{transform:none;color:#fff}" +
  ".sg-brush{position:absolute;left:937px;top:202px;width:715px;overflow:visible;pointer-events:none}" +
  ".sg-brush path{fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round}" +
  ".sg-brush .a{stroke-width:15}.sg-brush .b{stroke-width:6;opacity:.55;transform:translate(3px,-4px)}" +
  ".sg-root .sg-btn{position:absolute;z-index:2;right:112px;bottom:54px;display:inline-block;background:#e6e6e6;color:#3d3d3d;font-family:" + MONO + ";font-size:15px;line-height:24px;letter-spacing:-.02em;padding:6px 24px;transition:background .25s,color .25s}" +
  ".sg-root .sg-btn:hover,.sg-root .sg-btn:focus-visible{background:#000;color:#fff}" +
  /* footer */
  ".sg-foot{padding:80px 0 50px}" +
  ".sg-marq{overflow:hidden;white-space:nowrap;color:#00f;font-size:clamp(48px,5.21vw,75px);line-height:1.05;letter-spacing:-.01em}" +
  ".sg-marq-in{display:inline-flex;gap:10px;padding-right:10px;animation:sg-marq var(--dur) linear infinite}" +
  "@keyframes sg-marq{to{transform:translateX(-50%)}}" +
  ".sg-cols{margin:60px 50px 0;font-family:" + MONO + ";font-size:18px;line-height:28px;letter-spacing:-.02em;text-transform:uppercase}" +
  ".sg-cols-head{display:flex;justify-content:space-between;padding-bottom:10px;border-bottom:3px dotted #222;color:#3d3d3d}" +
  ".sg-cols-body{display:flex;justify-content:space-between;gap:24px;padding:49px 0 49px;border-bottom:3px dotted #222}" +
  ".sg-list{display:flex;flex-direction:column;gap:10px}" +
  ".sg-list a,.sg-list span{display:flex;align-items:center;gap:30px;min-height:28px}" +
  ".sg-list em{font-style:normal;color:#3d3d3d}" +
  ".sg-list u{text-decoration:none;transition:opacity .2s}" +
  ".sg-list a:hover u{opacity:.55}" +
  ".sg-list a.is-active u{background:#00f;color:#e6e6e6;padding:4px 14px;margin:-4px 0;opacity:1}" +
  ".sg-base{display:flex;justify-content:space-between;gap:16px;padding-top:10px;text-transform:none;color:#3d3d3d}" +
  ".sg-base a:hover{color:#00f}" +
  /* crosshair, about view, mouse only */
  ".sg-cross{display:none;position:fixed;inset:0;z-index:40;pointer-events:none;opacity:0;transition:opacity .25s}" +
  ".sg-cross.is-on{opacity:1}" +
  ".sg-cross i{position:fixed;left:0;top:0;background:#003bff;opacity:.35}" +
  ".sg-cross .v{width:1px;height:100vh}.sg-cross .h{width:100vw;height:1px}" +
  ".sg-cross .gv{width:1px;height:96px;margin-top:-48px;opacity:.75;background:linear-gradient(transparent,#003bff 50%,transparent)}" +
  ".sg-cross .gh{width:96px;height:1px;margin-left:-48px;opacity:.75;background:linear-gradient(to right,transparent,#003bff 50%,transparent)}" +
  "@media (hover:hover) and (pointer:fine){.sg-cross{display:block}}" +
  /* small screens */
  "@media (max-width:809px){" +
  ".sg-bar{height:64px;padding:0 10px 0 8px}.sg-logo{width:64px;height:31px}.sg-burger{display:block}" +
  ".sg-links{position:absolute;right:10px;top:58px;flex-direction:column;align-items:flex-end;gap:14px;padding:18px 16px;background:#e8e8e8;border:1px solid #000;font-size:16px;opacity:0;visibility:hidden;transform:translateY(-8px);transition:opacity .25s,transform .35s " + EASE + ",visibility 0s .35s}" +
  ".sg-links.is-open{opacity:1;visibility:visible;transform:none;transition-delay:0s}" +
  ".sg-about{padding:150px 20px 60px}.sg-lines{align-items:flex-start;gap:14px}.sg-line{justify-content:flex-start}" +
  ".sg-cats{padding:90px 20px}.sg-cats-head{margin-bottom:56px}.sg-kicker{font-size:20px}.sg-rows{gap:56px}" +
  ".sg-row,.sg-row.is-rev{flex-direction:column;align-items:flex-start;height:auto;gap:18px;padding-bottom:18px}.sg-name{margin-bottom:0}.sg-prev{width:100%;height:auto;aspect-ratio:1/1}.sg-arrow{display:none}.sg-name i{font-size:15px}" +
  ".sg-ah-l{font-size:19vw}.sg-ah-l.is-1{left:34%;top:27%}.sg-ah-l.is-2{left:7%;top:38%}.sg-ah-l.is-3{left:40%;top:49%}.sg-cut.is-a{left:31%;top:35%;width:24%}.sg-cut.is-b{left:58%;top:34.5%;width:34%}.sg-nar{flex-direction:column;padding:40px 20px;min-height:0}.sg-nar-l{padding:0;gap:44px}.sg-nar-k{font-size:22px}.sg-nar-t{font-size:21vw}" +
  ".sg-nar-b{flex-direction:column;align-items:flex-start;gap:22px}.sg-nar-p{font-size:28px}.sg-nar-r{width:100%}" +
  ".sg-tl{padding-top:80px}.sg-tl-stage{flex-direction:column;align-items:stretch;gap:18px;padding:70px 20px 24px}.sg-tl-art{width:100%;height:44%;min-height:0;flex:none}.sg-sq{width:36vw}.sg-tl-col{width:100%;gap:10px}" +
  ".sg-tl-label{font-size:22px}.sg-tl-grid{min-height:0}.sg-tl-items{gap:14px}.sg-tl-year{font-size:30px}.sg-tl-text{font-size:17px}" +
  ".sg-rail-top{padding-top:78px}.sg-filters{gap:14px;padding:0 20px}.sg-filters button{font-size:12px}.sg-strip-in{padding:0 20px;gap:24px}.sg-pc{width:190px}.sg-pc img{width:190px;height:190px}" +
  ".sg-cta-wrap{padding-top:50px}.sg-cta{padding:26px 20px 30px;height:auto;min-height:590px}.sg-ticks{width:46vw}.sg-cta-top{font-size:12px;line-height:1.4}.sg-cta-top>span:first-child{max-width:40vw}" +
  ".sg-lead{font-size:26px;margin:70px 0 22px}.sg-pl{white-space:normal;display:inline}.sg-brush{position:relative;left:auto;top:auto;display:block;width:120%;margin:26px 0 0 -4%}.sg-btn{right:20px;bottom:44px}" +
  ".sg-cols{margin:40px 20px 0;font-size:13px;line-height:22px}.sg-list a,.sg-list span{gap:14px;min-height:22px}.sg-cols-body{padding:30px 0}.sg-base{flex-direction:column;gap:2px}}" +
  "@media (prefers-reduced-motion:reduce){" +
  ".sg-w{opacity:1!important;transform:none!important;color:inherit!important;transition:none!important;animation:none!important}" +
  ".sg-hl,.sg-flash,.sg-c1,.sg-c2{display:none}.sg-photo{transform:none!important;animation:none!important}.sg-photo img{transition:none}.sg-row.is-hot .sg-photo img{transform:none}" +
  ".sg-ticks i,.sg-marq-in,.sg-filters button::after{animation:none!important}" +
  ".sg-rule,.sg-arrow,.sg-sq,.sg-sq img,.sg-tl-year,.sg-tl-text,.sg-pc,.sg-strip-in,.sg-links,.sg-burger i{transition:none!important}" +
  ".sg-cut{opacity:1!important;transition:none!important}.sg-cut.is-a{transform:none!important}.sg-cut.is-b{transform:rotate(8deg)!important}}"

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Turns true once, the first time the element is in view. */
function useSeen(rootMargin: string, threshold = 0) {
  const ref = useRef(null as HTMLElement | null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setSeen(true)
        io.disconnect()
      }
    }, { rootMargin, threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin, threshold])
  return [ref, seen] as const
}

/** One word: rises into place, its letters shuffled until it lands. */
function Word({ text, on, delay = 0 }: { text: string; on: boolean; delay?: number }) {
  const ref = useRef(null as HTMLSpanElement | null)
  useEffect(() => {
    const el = ref.current
    if (!el || !on || text.length < 2 || prefersReduced()) return
    const rnd = mulberry32(text.length * 131 + Math.round(delay * 1000) + text.charCodeAt(0))
    let n = 0
    let iv = 0
    const start = window.setTimeout(() => {
      el.textContent = shuffled(text, rnd)
      iv = window.setInterval(() => {
        n++
        el.textContent = n >= 5 ? text : shuffled(text, rnd)
        if (n >= 5) window.clearInterval(iv)
      }, 110)
    }, delay * 1000)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(iv)
      el.textContent = text
    }
  }, [on, text, delay])
  return <span ref={ref} className={"sg-w" + (on ? " is-on" : "")} style={{ ["--d" as string]: delay } as CSSProperties}>{text}</span>
}

function Arrow() {
  return (
    <svg className="sg-arrow" viewBox="0 0 112 16" aria-hidden="true">
      <path d="M0 8h110M103 1l7 7-7 7" />
    </svg>
  )
}

function Row({ d, i, pool, rev, onOpen }: { d: Discipline; i: number; pool: string[]; rev: boolean; onOpen: (e: { preventDefault: () => void }) => void }) {
  const [ref, seen] = useSeen("0px 0px -18% 0px")
  const [hot, setHot] = useState(false)
  const [left, setLeft] = useState(false)
  const [k, setK] = useState(0)
  const [flash, setFlash] = useState(0)
  useEffect(() => {
    if (!hot || d.images.length < 2 || prefersReduced()) return
    let swap = 0
    const turn = () => {
      setFlash((f) => f + 1)
      swap = window.setTimeout(() => setK((x) => (x + 1) % d.images.length), 300)
    }
    turn()
    const id = window.setInterval(turn, 1500)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(swap)
    }
  }, [hot, d.images.length])
  const src = pool[d.images[k] % pool.length]
  return (
    <a
      ref={ref as never}
      href={d.href || "#projects"}
      onClick={d.href ? undefined : onOpen}
      className={"sg-row" + (rev ? " is-rev" : "") + (seen ? " is-in" : "") + (hot ? " is-hot" : "") + (left ? " is-left" : "")}
      onPointerEnter={() => { setHot(true); setLeft(false) }}
      onPointerLeave={() => { setHot(false); setLeft(true); setK(0) }}
      onFocus={() => setHot(true)}
      onBlur={() => { setHot(false); setLeft(true) }}
      aria-label={d.name + ", " + d.projects.length + " projects"}
    >
      <span className="sg-prev">
        <span className="sg-c1" />
        <span className="sg-c2" />
        <span className="sg-photo">
          <img src={src} alt="" loading="lazy" decoding="async" draggable={false} />
        </span>
        <span key={flash} className={"sg-flash" + (flash ? " is-go" : "")} />
      </span>
      <span className="sg-name">
        <b><Word text={d.name} on={seen} delay={0.4} /></b>
        <i><Word text={String(i + 1)} on={seen} delay={0.4} /></i>
      </span>
      <span className="sg-rule" />
      <Arrow />
    </a>
  )
}

function Line({ text }: { text: string }) {
  const [ref, seen] = useSeen("0px 0px -22% 0px")
  const words = text.split(" ")
  return (
    <div ref={ref as never} className={"sg-line" + (seen ? " is-in" : "")}>
      {words.map((w, i) => <Word key={i} text={w} on={seen} delay={0.4 + edgeStep(i, words.length) * 0.12} />)}
      <span className="sg-hl" aria-hidden="true" />
    </div>
  )
}

/** The pinned 3D gallery. One frame loop: one layout read (the track's rect), then only writes. */
function Gallery({ height, heroLength, images, portrait, name, reduced }: { height: string; heroLength: number; images: string[]; portrait: string; name: string; reduced: boolean }) {
  const trackRef = useRef(null as HTMLElement | null)
  const stageRef = useRef(null as HTMLDivElement | null)
  const worldRef = useRef(null as HTMLDivElement | null)
  const portraitRef = useRef(null as HTMLDivElement | null)
  const sigRef = useRef(null as SVGPathElement | null)
  const cardRefs = useRef([] as (HTMLDivElement | null)[])
  const field = useMemo(() => makeField(120, images.length), [images.length])
  const n = images.length

  useEffect(() => {
    const track = trackRef.current, stage = stageRef.current, world = worldRef.current, por = portraitRef.current
    if (!track || !stage || !world || !por) return
    let W = 1440, H = 900
    const ro = new ResizeObserver((es) => {
      const r = es[0].contentRect
      if (!(r.width > 0)) return
      W = r.width
      H = r.height
      // card sizes only change with the stage, so they are set here, never in the frame
      const k = Math.min(1.15, Math.max(0.42, W / 1440))
      for (let i = 0; i < field.length; i++) {
        const el = cardRefs.current[i]
        if (!el) continue
        el.style.width = (field[i].w * k).toFixed(1) + "px"
        el.style.height = (field[i].h * k).toFixed(1) + "px"
      }
    })
    ro.observe(stage)
    let mx = 0, my = 0, rx = 0, ry = 0, p = 0, raf = 0, last = performance.now()
    const t0 = last
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      mx = (e.clientX / Math.max(1, W)) * 2 - 1
      my = (e.clientY / Math.max(1, H)) * 2 - 1
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    const frame = (now: number) => {
      const r = track.getBoundingClientRect()
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      const t = reduced ? 99 : (now - t0) / 1000
      const target = progressFrom(r.top, r.height, H)
      p = reduced ? 0 : follow(p, target, dt, 8)
      const visible = r.bottom > -50 && r.top < H + 50
      if (visible) {
        const tl = tilt(reduced ? 0 : mx, reduced ? 0 : my)
        rx = follow(rx, tl.rx, dt, 5)
        ry = follow(ry, tl.ry, dt, 5)
        world.style.transform = "rotateX(" + rx.toFixed(3) + "deg) rotateY(" + ry.toFixed(3) + "deg)"
        for (let i = 0; i < field.length; i++) {
          const el = cardRefs.current[i]
          if (!el) continue
          const q = cardPose(field[i], p, t)
          if (q.hidden) {
            if (el.style.visibility !== "hidden") el.style.visibility = "hidden"
            continue
          }
          el.style.visibility = "visible"
          el.style.opacity = q.o.toFixed(3)
          el.style.transform = "translate(-50%,-50%) translate3d(" + (q.x * W).toFixed(1) + "px," + (q.y * H).toFixed(1) + "px," + q.z.toFixed(1) + "px)"
        }
        const pp = portraitPose(reduced ? 1 : p, t)
        // sizes: the intro size, the far size, and a close-up that fills ~72% of the stage height at its final depth
        const scaleEnd = PERSPECTIVE / (PERSPECTIVE - (PORTRAIT_Z + TRAVEL))
        const hClose = Math.min(0.72 * H, 0.84 * W * 1.25) / scaleEnd
        const w = lerp(INTRO.nearW * W, lerp(0.1 * W, hClose / 1.25, pp.grow), pp.recede)
        por.style.width = w.toFixed(1) + "px"
        por.style.height = (w * 1.25).toFixed(1) + "px"
        por.style.opacity = pp.o.toFixed(3)
        por.style.transform = "translate(-50%,-50%) translate3d(0," + (pp.y * H).toFixed(1) + "px," + (reduced ? -120 : pp.z).toFixed(1) + "px)"
        const sp = sigRef.current
        if (sp) {
          const dr = sigDrawn(reduced ? 1 : p)
          sp.style.strokeDashoffset = (1 - dr).toFixed(4)
          sp.style.opacity = dr > 0 ? "1" : "0"
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("pointermove", onMove)
    }
  }, [field, reduced])

  return (
    <section ref={trackRef} className="sg-track" style={{ height: reduced ? height : "calc(" + height + " * " + heroLength + ")" }} aria-label={name + ", selected photographs"}>
      <div ref={stageRef} className="sg-stage" style={{ height }}>
        <div ref={worldRef} className="sg-world">
          {field.map((c, i) => (
            <div key={i} ref={(el) => { cardRefs.current[i] = el }} className="sg-card" style={{ visibility: "hidden" }}>
              <img src={images[c.img % n]} alt="" decoding="sync" draggable={false} />
            </div>
          ))}
          <div ref={portraitRef} className="sg-portrait" style={{ opacity: 0 }}>
            <img src={portrait} alt={"Portrait for " + name} decoding="async" draggable={false} />
          </div>
        </div>
        <svg className="sg-sig" viewBox="0 0 690 270" aria-hidden="true">
          <path ref={sigRef} d={SIG} pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }} />
        </svg>
      </div>
    </section>
  )
}

/** About: four squares and a ruler, stepped by the scroll through a pinned stage. */
function Timeline({ height, label, items, images, reduced }: { height: string; label: string; items: Milestone[]; images: string[]; reduced: boolean }) {
  const trackRef = useRef(null as HTMLElement | null)
  const stageRef = useRef(null as HTMLDivElement | null)
  const tickRefs = useRef([] as (HTMLElement | null)[])
  const [step, setStep] = useState(0)
  useEffect(() => {
    const track = trackRef.current, stage = stageRef.current
    if (!track || !stage) return
    let H = 900, raf = 0, p = 0, last = performance.now(), cur = -1
    const ro = new ResizeObserver((es) => { if (es[0].contentRect.height > 0) H = es[0].contentRect.height })
    ro.observe(stage)
    const frame = (now: number) => {
      const r = track.getBoundingClientRect()
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      if (r.bottom > -50 && r.top < H + 50) {
        const target = progressFrom(r.top, r.height, H)
        p = reduced ? target : follow(p, target, dt, 10)
        const peak = p * (TICKS - 1)
        for (let i = 0; i < TICKS; i++) {
          const el = tickRefs.current[i]
          if (el) el.style.width = tickWidth(i, peak).toFixed(1) + "px"
        }
        const s = timelineStep(target, items.length)
        if (s !== cur) { cur = s; setStep(s) }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [items.length, reduced])
  const spots = [[44, 24, -10], [30, 42, 7], [46, 66, -8], [36, 83, 9]]
  return (
    <section ref={trackRef} className="sg-tl" style={{ minHeight: "calc(" + height + " * 4 + 239px)" }} aria-label={label}>
      <div ref={stageRef} className="sg-tl-stage" style={{ height }}>
        <div className="sg-tl-art" aria-hidden="true">
          {items.map((m, i) => {
            const s = spots[i % spots.length]
            return (
              <div key={i} className={"sg-sq" + (i === step ? " is-on" : "")} style={{ left: s[0] + "%", top: s[1] + "%", zIndex: i === step ? 40 : 14 - i, ["--r" as string]: s[2] + "deg" } as CSSProperties}>
                <img src={images[m.image % images.length]} alt="" loading="lazy" decoding="async" draggable={false} />
              </div>
            )
          })}
        </div>
        <div className="sg-tl-col">
          <div className="sg-tl-label">{label}</div>
          <div className="sg-tl-rule" />
          <div className="sg-tl-grid">
            <div className="sg-tl-ticks" aria-hidden="true">
              {Array.from({ length: TICKS }, (_, i) => <i key={i} ref={(el) => { tickRefs.current[i] = el }} className={tickInk(i) ? "is-ink" : undefined} />)}
            </div>
            <ol className="sg-tl-items" style={{ listStyle: "none", margin: 0 }}>
              {items.map((m, i) => (
                <li key={m.year} className={"sg-tl-item" + (i === step ? " is-on" : "")} aria-current={i === step ? "step" : undefined}>
                  <div className="sg-tl-year">{m.year}</div>
                  <div className="sg-tl-text">{m.text}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Projects: an endless rail with momentum. Drag it, wheel over it or use the arrow keys; the middle card names the title. */
function Rail({ height, projects, filters, images, reduced }: { height: string; projects: Project[]; filters: string[]; images: string[]; reduced: boolean }) {
  const stripRef = useRef(null as HTMLDivElement | null)
  const innerRef = useRef(null as HTMLDivElement | null)
  const [filter, setFilter] = useState("All")
  const [shown, setShown] = useState("All")
  const [swap, setSwap] = useState(false)
  const [mid, setMid] = useState(0)
  const list = useMemo(() => (shown === "All" ? projects : projects.filter((p) => p.discipline === shown)), [projects, shown])
  const n = Math.max(1, list.length)
  const copies = Math.max(3, Math.ceil(16 / n) * 3)
  const state = useRef({ pos: 0, target: 0 })

  const pick = (f: string) => {
    if (f === filter) return
    setFilter(f)
    if (reduced) { setShown(f); state.current.pos = state.current.target = 0; return }
    setSwap(true)
    window.setTimeout(() => {
      setShown(f)
      state.current.pos = state.current.target = 0
      window.setTimeout(() => setSwap(false), 60)
    }, 350)
  }

  useEffect(() => {
    const strip = stripRef.current, inner = innerRef.current
    if (!strip || !inner) return
    const st = state.current
    let raf = 0, last = performance.now(), cur = -1, pitch = RAIL_PITCH, pad = 0, cardW = 260, stripW = 1440, drag = false, sx = 0, sp = 0, moved = 0
    const ro = new ResizeObserver(() => {
      const a = inner.children[0] as HTMLElement | undefined
      const b = inner.children[1] as HTMLElement | undefined
      if (a && b && b.offsetLeft > a.offsetLeft) { pitch = b.offsetLeft - a.offsetLeft; pad = a.offsetLeft; cardW = a.offsetWidth }
      stripW = strip.clientWidth
    })
    ro.observe(strip)
    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      st.pos = reduced || drag ? st.target : follow(st.pos, st.target, dt, 4.2)
      const lap = n * pitch
      const x = wrap(st.pos, lap) + lap * Math.floor(copies / 3)
      inner.style.transform = "translate3d(" + (-x).toFixed(2) + "px,0,0)"
      // the card nearest the middle of the strip
      const c = (((Math.round((x + stripW / 2 - pad - cardW / 2) / pitch) % n) + n) % n)
      if (c !== cur) { cur = c; setMid(c) }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const wheel = (e: WheelEvent) => {
      // a vertical wheel pulls the rail back ; a sideways swipe follows the fingers
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : -e.deltaY
      if (!d) return
      e.preventDefault()
      st.target += d * 0.887
    }
    const down = (e: PointerEvent) => {
      drag = true; sx = e.clientX; sp = st.target; moved = 0
      strip.classList.add("is-drag")
    }
    const move = (e: PointerEvent) => {
      if (!drag) return
      moved = e.clientX - sx
      st.target = sp - moved
      st.pos = st.target
    }
    const up = () => {
      if (!drag) return
      drag = false
      strip.classList.remove("is-drag")
      st.target += -moved * 0.35
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { st.target = (Math.round(st.target / pitch) + 1) * pitch; e.preventDefault() }
      if (e.key === "ArrowLeft") { st.target = (Math.round(st.target / pitch) - 1) * pitch; e.preventDefault() }
    }
    strip.addEventListener("wheel", wheel, { passive: false })
    strip.addEventListener("pointerdown", down)
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    strip.addEventListener("keydown", key)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      strip.removeEventListener("wheel", wheel)
      strip.removeEventListener("pointerdown", down)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      strip.removeEventListener("keydown", key)
    }
  }, [n, copies, reduced])

  const current = list[mid % n]
  const cards: number[] = []
  for (let c = 0; c < copies; c++) for (let i = 0; i < n; i++) cards.push(i)
  return (
    <section className="sg-rail" style={{ height }} aria-label="Projects">
      <div className="sg-rail-top">
        <div className="sg-filters" role="group" aria-label="Filter by discipline">
          {["All"].concat(filters).map((f) => <button key={f} type="button" aria-pressed={filter === f} onClick={() => pick(f)}>{f}</button>)}
        </div>
        <div ref={stripRef} className={"sg-strip" + (swap ? " is-swap" : "")} tabIndex={0} role="group" aria-roledescription="carousel" aria-label="Projects, drag or use the arrow keys">
          <div ref={innerRef} className="sg-strip-in">
            {cards.map((i, k) => (
              <div key={k} className={"sg-pc" + (i === mid % n ? " is-mid" : "")} aria-hidden={k >= n ? true : undefined}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <img src={images[list[i].image % images.length]} alt={k < n ? list[i].title : ""} decoding="async" draggable={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="sg-rail-b" aria-live="polite">
        <span className="sg-rail-k">Project</span>
        <h2 className="sg-rail-t" style={{ opacity: swap ? 0.45 : 1 }}>{current ? current.title : ""}</h2>
        <a className="sg-rail-a" href={(current && current.href) || "#contact"}>See more about this project</a>
      </div>
    </section>
  )
}

function AboutHead({ height, title, cutouts }: { height: string; title: [string, string, string]; cutouts: [string, string] }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setOn(true), 120)
    return () => window.clearTimeout(id)
  }, [])
  const line = (text: string, k: number) => (
    <p className={"sg-ah-l is-" + (k + 1)}>
      {text.split(" ").map((w, i) => <Word key={i} text={w} on={on} delay={0.22 + k * 0.22} />)}
    </p>
  )
  return (
    <header className={"sg-ah" + (on ? " is-in" : "")} style={{ height }}>
      <h1 style={{ margin: 0, fontWeight: 400 }} aria-label={title.join(" ")}>
        {line(title[0], 0)}
        {line(title[1], 1)}
        {line(title[2], 2)}
      </h1>
      <div className="sg-cut is-b" aria-hidden="true"><img src={cutouts[1]} alt="" draggable={false} /></div>
      <div className="sg-cut is-a" aria-hidden="true"><img src={cutouts[0]} alt="" draggable={false} /></div>
    </header>
  )
}

function Cta({ label, lead, lines, button, email, reduced }: { label: string; lead: string; lines: string[]; button: string; email: string; reduced: boolean }) {
  const [ref, seen] = useSeen("0px", 0.33)
  const on = seen || reduced
  let count = 0
  const total = lines.reduce((a, l) => a + l.split(" ").length, 0)
  return (
    <div className="sg-cta-wrap">
      <section ref={ref as never} data-sec="cta" className={"sg-cta" + (on ? " is-in" : "")} aria-label="Contact">
        <div className="sg-cta-top">
          <span>{label}</span>
          <span className="sg-ticks" aria-hidden="true">
            <b />
            <span>{Array.from({ length: 20 }, (_, i) => <i key={i} style={{ ["--i" as string]: i } as CSSProperties} />)}</span>
            <b />
          </span>
        </div>
        <div>
          <p className="sg-lead">{lead}</p>
          <p className="sg-para">
            {lines.map((line, li) => {
              const ws = line.split(" ")
              const base = count
              count += ws.length
              return (
                <span key={li} className="sg-pl">
                  {ws.map((w, wi) => <Word key={wi} text={w} on={on} delay={0.15 + edgeStep(base + wi, total) * 0.1} />)}
                </span>
              )
            })}
          </p>
        </div>
        <svg className="sg-brush" viewBox="0 0 690 270" aria-hidden="true">
          <path className="b" d={SIG} />
          <path className="a" d={SIG} />
        </svg>
        <a className="sg-btn" href={"mailto:" + email}>{button}</a>
      </section>
    </div>
  )
}

export default function SignatureGalleryTemplate({
  height = "100svh",
  heroLength = 8.3,
  name = "Kedhareswer",
  images = DEFAULT_IMAGES,
  portrait = DEFAULT_PORTRAIT,
  manifesto = DEFAULT_MANIFESTO,
  disciplines = DEFAULT_DISCIPLINES,
  aboutTitle = ["BUILT", "FOR THE", "screen"],
  aboutCutouts = DEFAULT_CUTOUTS,
  narrativeKicker = "Selected notes",
  narrativeTitle = "Practice",
  narrativeText = "His work lives somewhere between a component and a scene.",
  narrativePortrait = DEFAULT_TALL,
  timelineLabel = "Intro",
  timeline = DEFAULT_TIMELINE,
  projects = DEFAULT_PROJECTS,
  ctaLabel = "His work lives somewhere.",
  ctaLead = "Start where you are.",
  ctaLines = ["Bring the idea and we'll shape the", "product from flows and motion to the", "final pixel. This is where ideas get built"],
  ctaButton = "Write to me",
  email = "kedhareswer.12110626@gmail.com",
  clients = ["Client 1", "Client 2", "Client 3"],
  initialView = "home",
  className,
  style,
}: SignatureGalleryTemplateProps) {
  const rootRef = useRef(null as HTMLDivElement | null)
  const crossRef = useRef(null as HTMLDivElement | null)
  const [view, setView] = useState(initialView as View)
  const [reduced, setReduced] = useState(false)
  const [fine, setFine] = useState(false)
  const [menu, setMenu] = useState(false)
  const first = useRef(true)

  // reduced motion + fine pointer, read at runtime
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fp = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => { setReduced(rm.matches); setFine(fp.matches) }
    sync()
    rm.addEventListener("change", sync)
    fp.addEventListener("change", sync)
    return () => { rm.removeEventListener("change", sync); fp.removeEventListener("change", sync) }
  }, [])

  // a new view starts at its top
  useEffect(() => {
    if (first.current) { first.current = false; return }
    rootRef.current?.scrollIntoView({ behavior: "auto", block: "start" })
  }, [view])

  // crosshair: full-height and full-width hairlines through the pointer, on the about view, mouse only
  useEffect(() => {
    const root = rootRef.current, cross = crossRef.current
    if (!root || !cross || !fine || view !== "about") return
    const lines = cross.children as HTMLCollectionOf<HTMLElement>
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      cross.classList.add("is-on")
      const x = e.clientX.toFixed(1), y = e.clientY.toFixed(1)
      lines[0].style.transform = "translate3d(" + x + "px,0,0)"
      lines[1].style.transform = "translate3d(0," + y + "px,0)"
      lines[2].style.transform = "translate3d(" + x + "px," + y + "px,0)"
      lines[3].style.transform = "translate3d(" + x + "px," + y + "px,0)"
    }
    const leave = () => cross.classList.remove("is-on")
    root.addEventListener("pointermove", move)
    root.addEventListener("pointerleave", leave)
    return () => { leave(); root.removeEventListener("pointermove", move); root.removeEventListener("pointerleave", leave) }
  }, [fine, view])

  const open = (v: View) => (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setMenu(false)
    if (v === view) rootRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
    else setView(v)
  }
  const contact = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setMenu(false)
    rootRef.current?.querySelector("[data-sec='cta']")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" })
  }
  const links: [string, View | "contact"][] = [["home", "home"], ["about", "about"], ["projects", "projects"], ["contact", "contact"]]
  const marquee = Array.from({ length: 6 }, () => "/ " + name)

  return (
    <div ref={rootRef} className={"sg-root" + (className ? " " + className : "")} style={style}>
      <style>{CSS}</style>

      <header className="sg-head">
        <div className="sg-bar">
          <a href="#home" className="sg-logo" aria-label={name + ", home"} onClick={open("home")}>
            <svg viewBox="0 0 690 270" width="100%" height="100%" aria-hidden="true"><path d={SIG} /></svg>
          </a>
          <button type="button" className={"sg-burger" + (menu ? " is-open" : "")} aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><i /><i /></button>
          <nav className={"sg-links" + (menu ? " is-open" : "")} aria-label="Main">
            {links.map(([label, to]) => (
              <a key={label} href={"#" + label} className={to === view ? "is-active" : undefined} aria-current={to === view ? "page" : undefined} onClick={to === "contact" ? contact : open(to)}>
                {"[" + label + "]"}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {view === "home" && (
        <main key="home">
          <Gallery height={height} heroLength={heroLength} images={images} portrait={portrait} name={name} reduced={reduced} />
          <section className="sg-about" aria-label="Manifesto">
            <div className="sg-lines">
              {manifesto.map((l, i) => <Line key={i} text={l} />)}
            </div>
          </section>
          <section className="sg-cats" aria-label="Disciplines">
            <div className="sg-cats-head">
              <span className="sg-kicker">Selected work</span>
              <h2 className="sg-title">DISCIPLINES<span className="sg-dot" /></h2>
            </div>
            <div className="sg-rows">
              {disciplines.map((d, i) => <Row key={d.name} d={d} i={i} pool={images} rev={i % 2 === 1} onOpen={open("projects")} />)}
            </div>
          </section>
        </main>
      )}

      {view === "about" && (
        <main key="about">
          <AboutHead height={height} title={aboutTitle} cutouts={aboutCutouts} />
          <section className="sg-nar" aria-label={narrativeTitle}>
            <div className="sg-nar-l">
              <div>
                <div className="sg-nar-k">{narrativeKicker}</div>
                <h2 className="sg-nar-t">{narrativeTitle}</h2>
              </div>
              <div className="sg-nar-b">
                <div className="sg-nar-box"><img src={images[5 % images.length]} alt="" loading="lazy" decoding="async" /></div>
                <p className="sg-nar-p">{narrativeText}</p>
              </div>
            </div>
            <div className="sg-nar-r"><img src={narrativePortrait} alt="" loading="lazy" decoding="async" /></div>
          </section>
          <Timeline height={height} label={timelineLabel} items={timeline} images={images} reduced={reduced} />
        </main>
      )}

      {view === "projects" && (
        <main key="projects">
          <Rail height={height} projects={projects} filters={disciplines.map((d) => d.name)} images={images} reduced={reduced} />
        </main>
      )}

      <Cta key={"cta-" + view} label={ctaLabel} lead={ctaLead} lines={ctaLines} button={ctaButton} email={email} reduced={reduced} />

      <footer className="sg-foot">
        <div className="sg-marq" aria-label={name}>
          <div className="sg-marq-in" style={{ ["--dur" as string]: "52s" } as CSSProperties} aria-hidden="true">
            {marquee.concat(marquee).map((m, i) => <span key={i}>{m}</span>)}
          </div>
        </div>
        <div className="sg-cols">
          <div className="sg-cols-head"><span>Pages</span><span>Clients</span></div>
          <div className="sg-cols-body">
            <div className="sg-list">
              {links.map(([label, to]) => (
                <a key={label} href={"#" + label} className={to === view ? "is-active" : undefined} onClick={to === "contact" ? contact : open(to)}>
                  <em>1X</em><u>{label}</u>
                </a>
              ))}
            </div>
            <div className="sg-list">
              {clients.map((c) => <span key={c}><u>{c}</u></span>)}
            </div>
          </div>
          <div className="sg-base">
            <span>{"© " + new Date().getFullYear() + " " + name}</span>
            <a href={"mailto:" + email}>{email}</a>
          </div>
        </div>
      </footer>

      <div ref={crossRef} className="sg-cross" aria-hidden="true">
        <i className="v" /><i className="h" /><i className="gv" /><i className="gh" />
      </div>
    </div>
  )
}
