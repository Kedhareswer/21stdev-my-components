"use client"

import * as React from "react"

/**
 * Serum Dive Scroll Hero — a pinned, scroll-driven product story for a serum.
 *
 * It opens on fogged pink glass: the wordmark is finger-drawn in the
 * condensation, with drips, and the bottle is a blur behind it. Scrolling
 * clears the fog and "DEHYDRATED" sharpens behind the bottle. Water then
 * rises up the frame, turning the dry pink wall into a teal pool with moving
 * caustics, and the "DE" dissolves to leave "HYDRATED". The camera pushes in
 * on the bottle while the word re-centres. Then the word floats up and blurs
 * away, the camera closes in on the cap, and the dropper lifts out of the
 * bottle. The last line brings an "Add to bag" pill. When the scene scrolls
 * away, that pill docks into the nav beside the wordmark.
 *
 * Every scroll input is eased. Each line of copy leaves before the next one
 * arrives. Every picture is laid out at its on-screen size, never enlarged
 * with transforms. Under prefers-reduced-motion the hero does not pin: it
 * shows one still frame with the call to action.
 *
 * Self-contained: React is the only import. The pictures come from the
 * catalog site and were generated with ChatGPT.
 */

export interface SerumDiveBeat {
  /** Use "\n" for a line break. */
  title: string
  sub: string
}

export interface SerumDiveScrollHeroProps {
  /** Wordmark in the nav and in the fog. */
  brand?: string
  price?: string
  bagCount?: number
  /** First screen, on the fogged glass. The accent word is drawn in teal. */
  intro?: { title: string; accent: string; sub: string; cta: string }
  /** Five lines, one per scene. The last one carries the add-to-bag pill. */
  beats?: SerumDiveBeat[]
  ctaLabel?: string
  /** The big word, as [prefix that dissolves, word that stays]. */
  word?: [string, string]
  /** The bottle stands between these letters of the word (index into the word). */
  junction?: number
  onAddToBag?: () => void
  /** Height of the pinned stage. Must be a definite length. */
  height?: string
  /** How many stage heights of scrolling the story takes. */
  screens?: number
  /** Where the six pictures live. */
  imageBase?: string
  /** Google Fonts stylesheet, or null to bring your own. */
  fontHref?: string | null
  className?: string
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,600&family=Instrument+Sans:wght@400;500;600&display=swap"

const IMG_BASE = "https://kedhar-components.pages.dev/serum-dive-scroll-hero/"

const DEFAULT_INTRO = {
  title: "Skin tight by",
  accent: "noon?",
  sub: "It is thirsty, not tired. We put the water back.",
  cta: "Shop the serum",
}

const DEFAULT_BEATS: SerumDiveBeat[] = [
  { title: "Tight. Dull. Flaky.", sub: "What a day without water does to skin." },
  { title: "Still soft at midnight.", sub: "Hyaluronic acid holds water where skin needs it." },
  { title: "Three drops,\nmorning and night.", sub: "One bottle lasts two months." },
  { title: "2% hyaluronic acid.\nZero fragrance.", sub: "Gentle enough for sensitive skin." },
  { title: "Try it for 30 days.", sub: "Not for you? Send it back." },
]

// #region motion
/** Scroll-progress windows of the story, 0 to 1 over the pin. */
export const T = {
  introOut: [0.05, 0.09],
  fog: [0.06, 0.13],
  wordIn: [0.08, 0.15],
  water: [0.18, 0.34],
  prefixOut: [0.24, 0.35],
  cam1: [0.38, 0.54],
  wordOut: [0.57, 0.71],
  cam2: [0.57, 0.71],
  cam3: [0.74, 0.86],
  /** [enter start, enter end, exit start, exit end]; exit 2 means "never". */
  beats: [
    [0.12, 0.17, 0.26, 0.3],
    [0.31, 0.36, 0.44, 0.48],
    [0.49, 0.54, 0.58, 0.62],
    [0.63, 0.68, 0.73, 0.76],
    [0.79, 0.85, 2, 2],
  ],
}

export function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}
export function span(p: number, w: number[]) {
  return clamp01((p - w[0]) / (w[1] - w[0]))
}
export function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
export function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}
export function mix(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** 0 hidden, 1 shown; entering lines rise in, leaving lines rise out. */
export function beatState(p: number, w: number[]) {
  const enter = easeOut(span(p, [w[0], w[1]]))
  const exit = easeInOut(span(p, [w[2], w[3]]))
  return { o: enter * (1 - exit), y: (1 - enter) * 14 - exit * 14, blur: (1 - enter) * 6 + exit * 6 }
}

/**
 * Bottle-and-dropper geometry, in the generated sheet's pixels. The dropper is
 * drawn with its pipette shortened so it can clear the neck.
 */
export const SHEET = {
  /** From the bulb top to the bottle's foot when assembled. */
  total: 1143,
  bottle: { w: 370, h: 915 },
  dropper: { w: 248, h: 824, collar: 408 },
  /** Bottle top (thread rim) and shoulder, measured from the assembled top. */
  neckTop: 233,
  /** Sheet px the dropper rises at the end. */
  lift: 560,
}

/** The wall shadow's stretch relative to the bottle. */
export const SHADOW = { w: 1.4, h: 0.74 }

/** Camera key: z zoom, x bottle centre (fraction of width), by bottle foot (fraction of height). */
export interface CamKey {
  z: number
  x: number
  by: number
}

export function camAt(p: number, keys: CamKey[], word1X: number, word3X: number): CamKey {
  const k0 = { z: keys[0].z, x: word1X, by: keys[0].by }
  const k1 = { z: keys[1].z, x: word3X, by: keys[1].by }
  const a = easeInOut(span(p, T.cam1))
  const b = easeInOut(span(p, T.cam2))
  const c = easeInOut(span(p, T.cam3))
  let z = mix(k0.z, k1.z, a)
  let x = mix(k0.x, k1.x, a)
  let by = mix(k0.by, k1.by, a)
  z = mix(z, keys[2].z, b)
  x = mix(x, keys[2].x, b)
  by = mix(by, keys[2].by, b)
  z = mix(z, keys[3].z, c)
  x = mix(x, keys[3].x, c)
  by = mix(by, keys[3].by, c)
  return { z, x, by }
}

/** The pill sits in its line until the scene scrolls away, then sticks in the nav row. */
export function pillY(slotY: number, scrolledAway: number, navY: number) {
  return Math.max(navY, slotY - scrolledAway)
}
// #endregion motion

type Layout = {
  wide: boolean
  /** Bottle height at zoom 1, as a fraction of the wall picture's height. */
  bottle: number
  cams: CamKey[]
  /** Word width as a fraction of the stage width, before and after the prefix goes. */
  word1W: number
  word3W: number
  /** Nudge of the re-centred word, fraction of width, to keep the bottle clear of the copy. */
  word3Shift: number
  /** Cap-height centre of the word, fraction of height. */
  word1Y: number
  word3Y: number
}

const WIDE: Layout = {
  wide: true,
  bottle: 0.55,
  cams: [
    { z: 1, x: 0.525, by: 0 },
    { z: 1.25, x: 0.4, by: 0.07 },
    { z: 1.6, x: 0.56, by: 1.25 },
    { z: 1.6, x: 0.6, by: 1.375 },
  ],
  word1W: 0.86,
  word3W: 0.88,
  word3Shift: 0.03,
  word1Y: 0.43,
  word3Y: 0.39,
}

const TALL: Layout = {
  wide: false,
  bottle: 0.4,
  cams: [
    { z: 1, x: 0.5, by: 0 },
    { z: 1.15, x: 0.5, by: 0.04 },
    { z: 1.45, x: 0.5, by: 1.18 },
    { z: 1.45, x: 0.5, by: 1.3 },
  ],
  word1W: 0.9,
  word3W: 0.9,
  word3Shift: 0,
  word1Y: 0.5,
  word3Y: 0.48,
}

/** The wall pictures are 1672 x 821; the bottle stands at 85.5% of their height. */
const WALL_W = 1672
const WALL_H = 821
const FOOT = 0.855

function prefersReduced() {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function fogArt(w: number, h: number, wide: boolean, brand: string, ledge: number, ink: boolean) {
  // mask (ink false): an alpha mask, fog everywhere above the ledge, with the
  // wordmark and its drips wiped clear as if drawn with a finger in the
  // condensation. ink (true): the wet rims of those strokes, drawn on top.
  // Wide: left of the bottle, as in the reel. Tall: across the bottle's foot.
  const fs = wide ? Math.min((w * 0.34) / (0.74 * Math.max(4, brand.length)), h * 0.2) : Math.min((w * 0.8) / (0.74 * Math.max(4, brand.length)), h * 0.12)
  const x = wide ? w * 0.09 : w * 0.5
  const y = wide ? h * 0.485 + fs * 0.36 : h * 0.6 + fs * 0.36
  const anchor = wide ? "start" : "middle"
  const tracking = fs * 0.05
  const col = ink ? "rgb(118,72,70)" : "black"
  let drips = ""
  const seeds = [0.07, 0.29, 0.47, 0.68, 0.86]
  const textW = fs * 0.72 * brand.length
  const left = wide ? x : x - textW / 2
  for (let i = 0; i < seeds.length; i++) {
    const dx = left + textW * seeds[i]
    const len = fs * (0.35 + ((i * 37) % 5) * 0.16)
    drips +=
      "<path d='M" + dx.toFixed(1) + " " + (y - fs * 0.04).toFixed(1) + " q 1.5 " + (len * 0.5).toFixed(1) + " 0 " + len.toFixed(1) +
      "' stroke='" + col + "' stroke-opacity='" + (ink ? ".2" : ".75") + "' stroke-width='" + (fs * 0.022).toFixed(1) + "' stroke-linecap='round' fill='none'/>" +
      "<circle cx='" + dx.toFixed(1) + "' cy='" + (y + len - fs * 0.04).toFixed(1) + "' r='" + (fs * 0.024).toFixed(1) + "' fill='" + col + "' fill-opacity='" + (ink ? ".22" : ".8") + "'/>"
  }
  const glyphs =
    "<g filter='url(#f)'><text x='" + x.toFixed(1) + "' y='" + y.toFixed(1) + "' text-anchor='" + anchor + "' font-family='Helvetica, Arial, sans-serif' font-weight='400' font-size='" +
    fs.toFixed(1) + "' letter-spacing='" + tracking.toFixed(1) + "' fill='" + (ink ? "none" : "black") + "' fill-opacity='.72' stroke='" + col + "' stroke-opacity='" + (ink ? ".2" : ".5") +
    "' stroke-width='" + (fs * (ink ? 0.03 : 0.02)).toFixed(1) + "' stroke-linejoin='round'>" + brand.replace(/[<&>]/g, "") + "</text>" + drips + "</g>"
  const filter =
    "<filter id='f' x='-5%' y='-5%' width='110%' height='110%'><feTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='2' seed='4'/>" +
    "<feDisplacementMap in='SourceGraphic' scale='" + (fs * 0.05).toFixed(1) + "'/><feGaussianBlur stdDeviation='" + (fs * 0.012).toFixed(1) + "'/></filter>"
  const head = "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h + "'>"
  const svg = ink
    ? head + "<defs>" + filter + "</defs>" + glyphs + "</svg>"
    : head + "<defs>" + filter +
      "<linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='" + Math.max(0, (ledge - h * 0.04) / ledge).toFixed(3) + "' stop-color='white'/><stop offset='1' stop-color='white' stop-opacity='0'/></linearGradient>" +
      "<mask id='m' maskUnits='userSpaceOnUse' x='0' y='0' width='" + w + "' height='" + h + "'><rect width='" + w + "' height='" + h + "' fill='white'/>" + glyphs + "</mask></defs>" +
      "<rect width='" + w + "' height='" + ledge.toFixed(1) + "' fill='url(#g)' mask='url(#m)'/></svg>"
  return "url(\"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg) + "\")"
}

const css =
  ".sdh-root{position:relative;width:100%;isolation:isolate;font-family:'Instrument Sans',ui-sans-serif,system-ui,sans-serif;color:#262626}" +
  ".sdh-root img{max-width:none;user-select:none;-webkit-user-drag:none}" +
  ".sdh-nav{position:sticky;top:0;z-index:20;height:var(--sdh-nav);margin-bottom:calc(var(--sdh-nav) * -1);display:flex;align-items:center;justify-content:space-between;padding:0 var(--sdh-g);pointer-events:none}" +
  ".sdh-nav a,.sdh-nav button{pointer-events:auto}" +
  ".sdh-logo{font-size:14px;font-weight:500;letter-spacing:.34em;color:#2a2a2a;text-decoration:none;line-height:1}" +
  ".sdh-links{display:flex;align-items:center;gap:30px;font-size:13.5px;line-height:1}" +
  ".sdh-links a{color:#2a2a2a;text-decoration:none}" +
  ".sdh-bag{display:inline-flex;align-items:center;gap:8px}" +
  ".sdh-badge{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#161616;color:#fff;font-size:11px;font-weight:600}" +
  ".sdh-stage{position:sticky;top:0;width:100%;overflow:hidden;background:#d9b6b2;contain:paint}" +
  ".sdh-layer{position:absolute;inset:0;overflow:hidden}" +
  ".sdh-wall{position:absolute;left:0;top:0;display:block}" +
  ".sdh-wet{will-change:clip-path}" +
  ".sdh-shimmer{position:absolute;left:0;top:0;display:block;mix-blend-mode:screen;opacity:.32}" +
  ".sdh-shim{position:absolute;inset:0;animation:sdh-drift 14s ease-in-out infinite alternate}" +
  "@keyframes sdh-drift{0%{transform:translate3d(-1.2%,-.6%,0)}100%{transform:translate3d(1.2%,.8%,0)}}" +
  ".sdh-line{position:absolute;left:0;right:0;height:2px;background:rgba(255,255,255,.85);box-shadow:0 0 14px 4px rgba(255,255,255,.45),0 10px 34px 10px rgba(120,190,185,.35)}" +
  ".sdh-obj{position:absolute;left:0;top:0;display:block}" +
  ".sdh-shadow{position:absolute;left:0;top:0;display:block;opacity:.3;filter:blur(7px)}" +
  ".sdh-word{position:absolute;left:0;top:0;white-space:nowrap;font-family:Archivo,'Archivo Expanded',ui-sans-serif,sans-serif;font-stretch:125%;font-weight:600;line-height:1;letter-spacing:.035em;color:#f7e4df;text-shadow:0 2px 24px rgba(120,80,80,.12)}" +
  ".sdh-word span{display:inline-block}" +
  ".sdh-fog{position:absolute;inset:0;background:rgba(238,212,208,.46);-webkit-mask-size:100% 100%;mask-size:100% 100%}" +
  ".sdh-ink{position:absolute;inset:0;background-size:100% 100%;background-repeat:no-repeat;pointer-events:none}" +
  ".sdh-copy{position:absolute;inset:0;display:grid;pointer-events:none}" +
  ".sdh-block{grid-area:1/1;text-align:center;justify-self:center;max-width:min(30em,88vw)}" +
  ".sdh-block h1,.sdh-block h2{margin:0;font-weight:500;letter-spacing:-.022em;line-height:1.1;white-space:pre-line;color:#232323}" +
  ".sdh-block p{margin:.7em 0 0;font-size:15px;line-height:1.4;color:#3c3c3c;letter-spacing:.005em}" +
  ".sdh-accent{color:#16766b}" +
  ".sdh-btn{pointer-events:auto;display:inline-flex;align-items:center;justify-content:space-between;gap:28px;height:50px;padding:0 26px;border:0;border-radius:999px;background:#12786d;color:#fff;font:600 14.5px/1 'Instrument Sans',ui-sans-serif,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(18,90,82,.25);transition:background-color .2s}" +
  ".sdh-btn:hover{background:#0f6a60}" +
  ".sdh-btn:focus-visible,.sdh-nav a:focus-visible{outline:2px solid #12786d;outline-offset:3px}" +
  ".sdh-slot{visibility:hidden}" +
  ".sdh-pill{position:absolute;left:0;top:0;z-index:21}" +
  ".sdh-root:not([data-ready=true]) .sdh-word,.sdh-root:not([data-ready=true]) .sdh-copy,.sdh-root:not([data-ready=true]) .sdh-pill{opacity:0}" +
  "@media (max-width:520px){.sdh-btn{height:44px;padding:0 16px;gap:14px;font-size:13.5px}.sdh-logo{letter-spacing:.26em}.sdh-links{gap:20px}}" +
  "@media (prefers-reduced-motion:reduce){.sdh-shim{animation:none}.sdh-btn{transition:none}}"

export default function SerumDiveScrollHero({
  brand = "KEDHAR",
  price = "$64",
  bagCount = 2,
  intro = DEFAULT_INTRO,
  beats = DEFAULT_BEATS,
  ctaLabel = "Add to bag",
  word = ["DE", "HYDRATED"],
  junction = 3,
  onAddToBag,
  height = "100svh",
  screens = 6,
  imageBase = IMG_BASE,
  fontHref = FONT_HREF,
  className,
}: SerumDiveScrollHeroProps) {
  const rootRef = React.useRef(null as HTMLElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const dryRef = React.useRef(null as HTMLImageElement | null)
  const wetLayerRef = React.useRef(null as HTMLDivElement | null)
  const wetRef = React.useRef(null as HTMLImageElement | null)
  const shimRef = React.useRef(null as HTMLImageElement | null)
  const lineRef = React.useRef(null as HTMLDivElement | null)
  const fogRef = React.useRef(null as HTMLDivElement | null)
  const inkRef = React.useRef(null as HTMLDivElement | null)
  const wordRef = React.useRef(null as HTMLDivElement | null)
  const bottleRef = React.useRef(null as HTMLImageElement | null)
  const dropTopRef = React.useRef(null as HTMLImageElement | null)
  const dropPipeRef = React.useRef(null as HTMLImageElement | null)
  const bShadowRef = React.useRef(null as HTMLImageElement | null)
  const dShadowRef = React.useRef(null as HTMLImageElement | null)
  const introRef = React.useRef(null as HTMLDivElement | null)
  const beatRefs = React.useRef([] as (HTMLDivElement | null)[])
  const slotRef = React.useRef(null as HTMLSpanElement | null)
  const pillRef = React.useRef(null as HTMLButtonElement | null)
  const linkRef = React.useRef(null as HTMLLinkElement | null)
  const [ready, setReady] = React.useState(false)
  const [fontsRev, setFontsRev] = React.useState(0)
  const [reduced, setReduced] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const [size, setSize] = React.useState({ w: 0, h: 0 })

  const letters = React.useMemo(() => (word[0] + word[1]).split(""), [word])
  const pre = word[0].length

  React.useEffect(() => {
    setReduced(prefersReduced())
  }, [])

  // Wait for the actual faces so the word is measured once, in its final font.
  React.useEffect(() => {
    let alive = true
    const done = () => alive && setReady(true)
    const link = linkRef.current
    const fonts = typeof document !== "undefined" ? document.fonts : undefined
    const load = () => {
      if (!fonts) return done()
      Promise.all([fonts.load("600 expanded 100px Archivo"), fonts.load("500 40px 'Instrument Sans'")]).then(done, done)
    }
    if (link && !link.sheet) {
      link.addEventListener("load", load, { once: true })
      link.addEventListener("error", done, { once: true })
    } else load()
    const t = window.setTimeout(done, 2500)
    const bump = () => alive && setFontsRev((v) => v + 1)
    if (fonts) fonts.addEventListener("loadingdone", bump)
    return () => {
      alive = false
      window.clearTimeout(t)
      if (fonts) fonts.removeEventListener("loadingdone", bump)
    }
  }, [])

  // Stage size.
  React.useEffect(() => {
    const st = stageRef.current
    if (!st) return
    const ro = new ResizeObserver(() => {
      const r = st.getBoundingClientRect()
      setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    })
    ro.observe(st)
    return () => ro.disconnect()
  }, [])

  const L = size.w >= size.h * 1.05 ? WIDE : TALL
  const fog = React.useMemo(() => {
    if (size.w === 0) return { mask: "none", ink: "none" }
    const wallH0 = WALL_H * Math.max(size.w / WALL_W, size.h / WALL_H)
    const ledge = Math.min(size.h, (size.h - wallH0) / 2 + 0.875 * wallH0)
    return { mask: fogArt(size.w, size.h, L.wide, brand, ledge, false), ink: fogArt(size.w, size.h, L.wide, brand, ledge, true) }
  }, [size.w, size.h, L.wide, brand])

  // The scene, driven by an eased scroll progress.
  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const wordEl = wordRef.current
    if (!root || !stage || !wordEl || !ready || size.w === 0) return
    const W = size.w
    const H = size.h
    const still = reduced

    // Word metrics at 100px, in em.
    wordEl.style.fontSize = "100px"
    wordEl.style.left = "0px"
    wordEl.style.top = "0px"
    const spans = Array.prototype.slice.call(wordEl.children) as HTMLSpanElement[]
    const r0 = wordEl.getBoundingClientRect()
    const lx = spans.map((s) => (s.getBoundingClientRect().left - r0.left) / 100)
    const rx = spans.map((s) => (s.getBoundingClientRect().right - r0.left) / 100)
    const fullEm = rx[rx.length - 1] - lx[0]
    const restEm = rx[rx.length - 1] - lx[pre]
    const jIdx = Math.min(letters.length - 1, pre + junction)
    const jEm = lx[jIdx] - 0.06
    // Cap-height centre below the line box top, in em (line-height 1).
    const ctx = document.createElement("canvas").getContext("2d")
    let capMid = 0.5
    if (ctx) {
      ctx.font = "600 100px Archivo"
      const m = ctx.measureText("H")
      const fa = m.fontBoundingBoxAscent || 90
      const fd = m.fontBoundingBoxDescent || 22
      const base = (100 - (fa + fd)) / 2 + fa
      capMid = (base - m.actualBoundingBoxAscent / 2) / 100
    }

    // Wall: cover-fit at zoom 1.
    const s0 = Math.max(W / WALL_W, H / WALL_H)
    const wallH0 = WALL_H * s0
    const foot0 = (H - wallH0) / 2 + FOOT * wallH0
    const bottleH0 = L.bottle * wallH0

    // Word sizes and where the bottle stands in them.
    const fs1 = Math.min((L.word1W * W) / fullEm, H * 0.3)
    const left1 = (W - fullEm * fs1) / 2 - lx[0] * fs1
    const word1X = (left1 + jEm * fs1) / W
    const keys = L.cams.map((k, i) => ({ z: k.z, x: k.x, by: i < 2 ? foot0 / H + k.by : k.by }))
    // After the push-in the bottle stands at the word's junction. On narrower
    // screens that would reach the copy column, so the word slides (and if it
    // must, shrinks) until the bottle keeps 28 px clear of the copy.
    const jIn = jEm - lx[pre]
    let fs3 = Math.min((L.word3W * W) / restEm, H * 0.32)
    let wl3 = (W - restEm * fs3) / 2 + L.word3Shift * W
    if (L.wide) {
      let copyRight = 0
      const b3 = beatRefs.current[2]
      if (b3) {
        const rg = document.createRange()
        rg.selectNodeContents(b3)
        const rs = rg.getClientRects()
        for (let i = 0; i < rs.length; i++) if (rs[i].width > 1) copyRight = Math.max(copyRight, rs[i].right - stage.getBoundingClientRect().left)
      }
      const bw1 = SHEET.bottle.w * ((bottleH0 * keys[1].z) / SHEET.total)
      const need = copyRight + 28 + bw1 / 2
      if (wl3 + jIn * fs3 < need) {
        fs3 = Math.min(fs3, (0.97 * W - need) / (restEm - jIn))
        wl3 = need - jIn * fs3
      }
    }
    const word3X = (wl3 + jIn * fs3) / W

    // Pill slot (inside the last line) relative to the stage.
    let slotX = 0
    let slotY = 0
    let slotW = 0
    let blockTop = 0
    const measureSlot = () => {
      const sl = slotRef.current
      const lastBlock = beatRefs.current[beats.length - 1]
      if (!sl || !lastBlock) return
      const prev = lastBlock.style.transform
      lastBlock.style.transform = "none"
      const sr = sl.getBoundingClientRect()
      const st = stage.getBoundingClientRect()
      slotX = sr.left - st.left
      slotY = sr.top - st.top
      slotW = sr.width
      blockTop = lastBlock.getBoundingClientRect().top - st.top
      lastBlock.style.transform = prev
      // Where the pill docks: under its line, unless that would crowd the logo or
      // the links (narrow screens); then centred in the gap between them.
      const lg = root.querySelector(".sdh-logo")
      const ln = root.querySelector(".sdh-links")
      const pl = pillRef.current
      slotCx = slotX + slotW / 2
      dockCx = slotCx
      if (lg && ln && pl) {
        const rl = root.getBoundingClientRect().left
        const logoR = lg.getBoundingClientRect().right - rl
        const linksL = ln.getBoundingClientRect().left - rl
        const half = pl.offsetWidth / 2
        if (slotCx - half < logoR + 16 || slotCx + half > linksL - 16) dockCx = (logoR + linksL) / 2
      }
    }
    let slotCx = 0
    let dockCx = 0
    measureSlot()
    const navH = parseFloat(getComputedStyle(root).getPropertyValue("--sdh-nav")) || 72

    const px = (v: number) => v.toFixed(2) + "px"
    const place = (el: HTMLElement | null, x: number, y: number, w: number, h: number) => {
      if (!el) return
      el.style.transform = "translate3d(" + px(x) + "," + px(y) + ",0)"
      el.style.width = px(w)
      el.style.height = px(h)
    }

    let lastActive = -1
    const render = (p: number, away: number) => {
      // Camera.
      const cam = camAt(p, keys, word1X, word3X)
      const z = cam.z
      const cx = cam.x * W
      const foot = cam.by * H
      const wallW = WALL_W * s0 * z
      const wallH = WALL_H * s0 * z
      let wl = cx - 0.5 * wallW
      let wt = foot - FOOT * wallH
      // keep the wall covering the stage
      wl = Math.min(0, Math.max(W - wallW, wl))
      wt = Math.min(0, Math.max(H - wallH, wt))
      place(dryRef.current, wl, wt, wallW, wallH)
      place(wetRef.current, wl, wt, wallW, wallH)
      place(shimRef.current, wl, wt, wallW, wallH)
      const dof = mix(0, 2.2, clamp01((z - 1) / 0.6))
      const wallFilter = dof > 0.05 ? "blur(" + dof.toFixed(2) + "px)" : "none"
      if (wetRef.current) wetRef.current.style.filter = wallFilter
      if (dryRef.current) dryRef.current.style.filter = wallFilter

      // Water rising.
      const wt01 = still ? 1 : easeInOut(span(p, T.water))
      const lineY = mix(H + 4, -0.06 * H, wt01)
      if (wetLayerRef.current) wetLayerRef.current.style.clipPath = "inset(" + px(Math.max(0, lineY)) + " 0 0 0)"
      if (lineRef.current) {
        lineRef.current.style.transform = "translate3d(0," + px(lineY) + ",0)"
        lineRef.current.style.opacity = String(wt01 > 0 && lineY > -2 ? Math.min(1, (H - lineY) / 40) : 0)
      }

      // Bottle and dropper.
      const u = (bottleH0 * z) / SHEET.total
      const lift = SHEET.lift * easeInOut(span(p, T.cam3))
      const bw = SHEET.bottle.w * u
      const bh = SHEET.bottle.h * u
      const by0 = foot - bh
      place(bottleRef.current, cx - bw / 2, by0, bw, bh)
      const dw = SHEET.dropper.w * u
      const dh = SHEET.dropper.h * u
      const dy = foot - SHEET.total * u - lift * u
      place(dropTopRef.current, cx - dw / 2, dy, dw, dh)
      place(dropPipeRef.current, cx - dw / 2, dy, dw, dh)
      // Shadows: the light sits low and to the left, so the wall gets a wider,
      // shorter silhouette off to the right, sharing the bottle's foot line.
      const sx = cx + bw * 1.7
      const sy = foot - bh * 0.05
      const shadow = (el: HTMLElement | null, l: number, t: number, w: number, h: number) =>
        place(el, sx + (l - cx) * SHADOW.w, sy - (foot - t) * SHADOW.h, w * SHADOW.w, h * SHADOW.h)
      shadow(bShadowRef.current, cx - bw / 2, by0, bw, bh)
      shadow(dShadowRef.current, cx - dw / 2, dy, dw, dh)

      // The word.
      const wIn = still ? 1 : easeOut(span(p, T.wordIn))
      const pOut = still ? 1 : easeInOut(span(p, T.prefixOut))
      const a = easeInOut(span(p, T.cam1))
      const fs = mix(fs1, fs3, a)
      const junctionX = cx
      const wLeft = junctionX - jEm * fs
      const wordY = mix(L.word1Y, L.word3Y, a) * H - capMid * fs
      wordEl.style.fontSize = px(fs)
      wordEl.style.transform = "translate3d(" + px(wLeft) + "," + px(wordY) + ",0)"
      const outT = still ? 0 : span(p, T.wordOut)
      for (let i = 0; i < spans.length; i++) {
        const s = spans[i]
        let o = wIn
        let blur = (1 - wIn) * 22
        let ty = 0
        if (i < pre) {
          o *= 1 - pOut
          blur += pOut * 26
          ty = -pOut * fs * 0.12
        } else {
          // right-hand letters leave first
          const k = letters.length - 1 - i
          const t = clamp01((outT - k * 0.045) / 0.62)
          const e = easeInOut(t)
          ty = -e * H * (0.2 + 0.03 * Math.sin(i * 1.7))
          blur += e * 20
          o *= 1 - clamp01((t - 0.35) / 0.65)
        }
        s.style.opacity = o.toFixed(3)
        s.style.filter = blur > 0.05 ? "blur(" + blur.toFixed(2) + "px)" : "none"
        s.style.transform = ty !== 0 ? "translate3d(0," + px(ty) + ",0)" : "none"
        s.style.visibility = o < 0.002 ? "hidden" : "visible"
      }

      // Fog.
      const f = still ? 1 : easeInOut(span(p, T.fog))
      if (fogRef.current) {
        const fo = 1 - f
        fogRef.current.style.opacity = fo.toFixed(3)
        const b = mix(16, 4, f)
        const bf = "blur(" + b.toFixed(1) + "px) saturate(.9)"
        fogRef.current.style.backdropFilter = bf
        ;(fogRef.current.style as unknown as Record<string, string>).webkitBackdropFilter = bf
        fogRef.current.style.visibility = fo < 0.002 ? "hidden" : "visible"
      }
      if (inkRef.current) {
        inkRef.current.style.opacity = (1 - f).toFixed(3)
        inkRef.current.style.visibility = f > 0.998 ? "hidden" : "visible"
      }

      // Copy.
      let shown = 0
      const io = still ? 0 : 1 - easeInOut(span(p, T.introOut))
      if (introRef.current) {
        introRef.current.style.opacity = io.toFixed(3)
        introRef.current.style.transform = "translate3d(0," + px(-(1 - io) * 14) + ",0)"
        introRef.current.style.filter = io < 0.999 ? "blur(" + ((1 - io) * 6).toFixed(2) + "px)" : "none"
        introRef.current.style.visibility = io < 0.002 ? "hidden" : "visible"
      }
      let lastO = 0
      let lastY = 0
      for (let i = 0; i < beatRefs.current.length; i++) {
        const el = beatRefs.current[i]
        if (!el) continue
        const s = still ? (i === beats.length - 1 ? { o: 1, y: 0, blur: 0 } : { o: 0, y: 0, blur: 0 }) : beatState(p, T.beats[i] || [2, 2, 2, 2])
        // The last line fades out before it can slide under the nav as the scene leaves.
        const room = blockTop + s.y - navH - 6
        const o = i === beats.length - 1 ? s.o * (1 - clamp01((away - Math.max(0, room - 70)) / 70)) : s.o
        el.style.opacity = o.toFixed(3)
        el.style.transform = "translate3d(0," + px(s.y) + ",0)"
        el.style.filter = s.blur > 0.05 && o > 0.002 ? "blur(" + s.blur.toFixed(2) + "px)" : "none"
        el.style.visibility = o < 0.002 ? "hidden" : "visible"
        if (s.o > 0.5) shown = i + 1
        if (i === beats.length - 1) {
          lastO = s.o
          lastY = s.y
        }
      }
      if (io > 0.5) shown = 0
      if (shown !== lastActive) {
        lastActive = shown
        setActive(shown)
      }

      // Pill: rides in the last line, then docks in the nav row as the scene leaves.
      const pill = pillRef.current
      if (pill) {
        const navY = (navH - pill.offsetHeight) / 2
        const y = pillY(slotY + lastY, away, navY)
        // over its last 90 px of travel it eases sideways into its dock
        const k = easeInOut(clamp01(1 - (slotY + lastY - away - navY) / 90))
        pill.style.transform = "translate3d(" + px(mix(slotCx, dockCx, k) - pill.offsetWidth / 2) + "," + px(y) + ",0)"
        pill.style.opacity = lastO.toFixed(3)
        pill.style.visibility = lastO < 0.002 ? "hidden" : "visible"
        pill.tabIndex = lastO > 0.5 ? 0 : -1
      }
    }

    const target = () => {
      const r = root.getBoundingClientRect()
      const run = r.height - H
      return run > 0 ? clamp01(-r.top / run) : 0
    }
    const awayNow = () => Math.max(0, -stage.getBoundingClientRect().top)

    if (still) {
      render(0.36, awayNow())
      const onScroll = () => render(0.36, awayNow())
      window.addEventListener("scroll", onScroll, { passive: true })
      return () => window.removeEventListener("scroll", onScroll)
    }

    let cur = target()
    let raf = 0
    let last = performance.now()
    let visible = true
    const tick = (now: number) => {
      raf = 0
      const dt = Math.min(64, now - last)
      last = now
      const goal = target()
      const ease = 1 - Math.pow(1 - 0.12, dt / 16.67)
      cur += (goal - cur) * ease
      if (Math.abs(goal - cur) < 0.00005) cur = goal
      render(cur, awayNow())
      if (visible && !document.hidden && cur !== goal) raf = requestAnimationFrame(tick)
    }
    const kick = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    render(cur, awayNow())
    const io = new IntersectionObserver((es) => {
      visible = es[0] ? es[0].isIntersecting : true
      if (visible) kick()
    })
    io.observe(root)
    const onScroll = () => kick()
    window.addEventListener("scroll", onScroll, { passive: true })
    document.addEventListener("visibilitychange", kick)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener("scroll", onScroll)
      document.removeEventListener("visibilitychange", kick)
    }
  }, [ready, fontsRev, reduced, size.w, size.h, L, beats.length, letters, pre, junction])

  const rootStyle = {
    height: reduced ? height : "calc(" + height + " * " + (screens + 1) + ")",
    width: "100%",
    ["--sdh-g" as string]: "clamp(20px, 4.4vw, 72px)",
    ["--sdh-nav" as string]: "72px",
  } as React.CSSProperties

  const titleSize = L.wide ? "clamp(26px, min(2.95vw, 4.6svh), 50px)" : "clamp(24px, 7vw, 34px)"
  const blockPos = (i: number): React.CSSProperties => {
    if (!L.wide) return { alignSelf: "start", marginTop: "calc(var(--sdh-nav) + 4svh)" }
    // Centred on the left third, with the title's top at the reel's heights.
    // The reduced-motion still keeps "HYDRATED" on screen, so its line takes the low slot.
    const tops = [0.585, 0.585, 0.635, 0.455, reduced ? 0.585 : 0.43]
    return { alignSelf: "start", justifySelf: "start", marginTop: Math.round((tops[i] || 0.5) * size.h), width: "38%", marginLeft: "3.7%" }
  }

  const add = () => {
    if (onAddToBag) onAddToBag()
  }

  return (
    <section
      ref={rootRef}
      className={"sdh-root" + (className ? " " + className : "")}
      style={rootStyle}
      data-ready={ready && size.w > 0}
      aria-label={intro.title + " " + intro.accent}
    >
      {fontHref && <link ref={linkRef} rel="stylesheet" href={fontHref} />}
      <style>{css}</style>

      <header className="sdh-nav">
        <a className="sdh-logo" href="#top" aria-label={brand + ", home"}>
          {brand}
        </a>
        <nav className="sdh-links" aria-label="Shop">
          <a href="#shop">Shop</a>
          <a href="#bag" className="sdh-bag">
            Bag <span className="sdh-badge" aria-label={bagCount + " items"}>{bagCount}</span>
          </a>
        </nav>
        <button ref={pillRef} type="button" className="sdh-btn sdh-pill" onClick={add} tabIndex={-1} aria-hidden={active !== beats.length}>
          <span>{ctaLabel}</span>
          <span>{price}</span>
        </button>
      </header>

      <div ref={stageRef} className="sdh-stage" style={{ height, width: "100%" }}>
        <div className="sdh-layer" aria-hidden="true">
          <img ref={dryRef} className="sdh-wall" src={imageBase + "wall-dry.webp"} alt="" width={WALL_W} height={WALL_H} draggable={false} style={{ maxWidth: "none" }} />
        </div>
        <div ref={wetLayerRef} className="sdh-layer sdh-wet" aria-hidden="true" style={{ clipPath: "inset(100% 0 0 0)" }}>
          <img ref={wetRef} className="sdh-wall" src={imageBase + "wall-wet.webp"} alt="" width={WALL_W} height={WALL_H} draggable={false} style={{ maxWidth: "none" }} />
          <div className="sdh-shim">
            <img ref={shimRef} className="sdh-shimmer" src={imageBase + "wall-wet.webp"} alt="" width={WALL_W} height={WALL_H} draggable={false} style={{ maxWidth: "none" }} />
          </div>
        </div>
        <div className="sdh-layer" aria-hidden="true">
          <img ref={bShadowRef} className="sdh-shadow" src={imageBase + "bottle-shadow.webp"} alt="" width={185} height={458} draggable={false} style={{ maxWidth: "none" }} />
          <img ref={dShadowRef} className="sdh-shadow" src={imageBase + "dropper-shadow.webp"} alt="" width={124} height={412} draggable={false} style={{ maxWidth: "none" }} />
          <div ref={wordRef} className="sdh-word" aria-hidden="true">
            {letters.map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
          </div>
          <img ref={dropPipeRef} className="sdh-obj" src={imageBase + "dropper.webp"} alt="" width={SHEET.dropper.w} height={SHEET.dropper.h} draggable={false} style={{ maxWidth: "none", clipPath: "inset(" + ((SHEET.dropper.collar / SHEET.dropper.h) * 100).toFixed(2) + "% 0 0 0)" }} />
          <img ref={bottleRef} className="sdh-obj" src={imageBase + "bottle.webp"} alt="" width={SHEET.bottle.w} height={SHEET.bottle.h} draggable={false} style={{ maxWidth: "none" }} />
          <img ref={dropTopRef} className="sdh-obj" src={imageBase + "dropper.webp"} alt="" width={SHEET.dropper.w} height={SHEET.dropper.h} draggable={false} style={{ maxWidth: "none", clipPath: "inset(0 0 " + (100 - (SHEET.dropper.collar / SHEET.dropper.h) * 100).toFixed(2) + "% 0)" }} />
        </div>
        <div ref={lineRef} className="sdh-line" aria-hidden="true" style={{ top: 0, opacity: 0 }} />
        <div ref={fogRef} className="sdh-fog" aria-hidden="true" style={{ WebkitMaskImage: fog.mask, maskImage: fog.mask }} />
        <div ref={inkRef} className="sdh-ink" aria-hidden="true" style={{ backgroundImage: fog.ink }} />

        <div className="sdh-copy">
          <div
            ref={introRef}
            className="sdh-block"
            style={L.wide ? { alignSelf: "center", justifySelf: "end", width: "38%", marginRight: "3.7%", marginTop: "-1%" } : { alignSelf: "start", marginTop: "calc(var(--sdh-nav) + 4svh)" }}
          >
            <h1 style={{ fontSize: titleSize }}>
              {intro.title} <span className="sdh-accent">{intro.accent}</span>
            </h1>
            <p>{intro.sub}</p>
            <button type="button" className="sdh-btn" style={{ marginTop: 22, pointerEvents: active === 0 ? "auto" : "none" }} tabIndex={active === 0 ? 0 : -1} onClick={add}>
              <span>{intro.cta}</span>
              <span>{price}</span>
            </button>
          </div>
          {beats.map((b, i) => (
            <div
              key={i}
              ref={(el) => {
                beatRefs.current[i] = el
              }}
              className="sdh-block"
              style={blockPos(i)}
              aria-hidden={active !== i + 1}
            >
              <h2 style={{ fontSize: titleSize }}>{b.title}</h2>
              <p>{b.sub}</p>
              {i === beats.length - 1 && (
                <span ref={slotRef} className="sdh-btn sdh-slot" aria-hidden="true" style={{ marginTop: 22 }}>
                  <span>{ctaLabel}</span>
                  <span>{price}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
