"use client"

import * as React from "react"

/**
 * Glyph Curtain Hero — a travel hero where an illustrated roof hangs a curtain
 * of script. Every column of the curtain is a string of glyphs in the place's
 * own writing, threaded on a rope that swings: move the pointer through it and
 * the strings part, bunch and sway back.
 *
 * Changing destination (the small framed cards at either side, or the arrow
 * keys) slides the roof off one edge with its strings trailing behind it, blurs
 * the headline away, then brings the next roof in from the other edge while
 * the new headline sharpens in word by word.
 *
 * Under prefers-reduced-motion the strings hang still and destinations change
 * in place.
 *
 * Self-contained: React is the only import. The roof illustrations come from
 * the catalog site and were generated with ChatGPT.
 */

export interface GlyphCurtainDestination {
  name: string
  /** A word in the local language, shown above the headline. */
  word: string
  /** Its reading and meaning, after the word. */
  gloss: string
  /** Everything after the name and its rule. */
  headline: string
  caption: string
  /** The text threaded on the strings. Spaces leave gaps. */
  glyphs: string
  /** Canvas font family for the strings. */
  glyphFont: string
  roof: {
    src: string
    /** Intrinsic pixel size of the image. */
    width: number
    height: number
    /** Roof width as a share of the stage width. */
    scale: number
    /** Where the strings hang from, as a share of the roof height. */
    eave: number
    /** Curtain width as a share of the roof width. */
    span: number
  }
}

export interface GlyphCurtainHeroProps {
  destinations?: GlyphCurtainDestination[]
  initialIndex?: number
  brand?: string
  links?: string[]
  cta?: string
  onCta?: () => void
  onChange?: (index: number) => void
  /** Minimum height of the section. Must be a definite length. */
  height?: string
  /** Google Fonts stylesheet, or null to bring your own. */
  fontHref?: string | null
  className?: string
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=IBM+Plex+Mono:wght@400;500&family=Noto+Serif+SC:wght@600&family=Noto+Serif+JP:wght@600&display=swap"

const IMG = "https://kedhar-components.pages.dev/glyph-curtain-hero/"
const CJK_SC = "'Noto Serif SC', 'Songti SC', 'SimSun', serif"
const CJK_JP = "'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif"
const MONO = "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace"

export const DEFAULT_DESTINATIONS: GlyphCurtainDestination[] = [
  {
    name: "Vietnam",
    word: "Quê nhà",
    gloss: "(kweh nyah) The place that raised you",
    headline: "lantern rivers, rice terraces, and roofs shaped like boats",
    caption: "Drift past lantern-lit shophouses, climb green terraces, and eat where the market wakes up.",
    glyphs: "dòng sông xanh chảy qua cánh đồng lúa chín, đèn lồng đỏ treo trên phố cổ, mưa chiều rơi trên mái ngói, con đò nhỏ chờ ở bến, tiếng chuông chùa vọng xa, chợ sớm thơm mùi cà phê và bánh mì nóng ",
    glyphFont: MONO,
    roof: { src: IMG + "vietnam.webp", width: 1280, height: 314, scale: 0.92, eave: 0.97, span: 0.8 },
  },
  {
    name: "China",
    word: "知音",
    gloss: "(Zhīyīn) A friend who hears your music",
    headline: "vermilion halls, tea-steam mornings, roofs that curl at the sky",
    caption: "Walk palace courtyards at dawn, sip from the hill farms, and read a thousand years of ink.",
    glyphs: "山高水长春风化雨静水流深千里之行始于足下知音难觅高山流水一叶知秋落花流水青山绿水日出而作日落而息云开月明海阔天空风和日丽鸟语花香细水长流一路平安",
    glyphFont: CJK_SC,
    roof: { src: IMG + "china.webp", width: 1280, height: 531, scale: 1, eave: 0.985, span: 0.74 },
  },
  {
    name: "Japan",
    word: "木漏れ日",
    gloss: "(Komorebi) Sunlight through leaves",
    headline: "cedar shrines, quiet lanterns, and a craft for every season",
    caption: "Cross mossy stones to the temple bell, and stay where the bath is hot and the hour is slow.",
    glyphs: "木漏れ日の中を歩くと静かな寺の鐘が遠くで鳴る苔むした石段を上り朱色の門をくぐる湯気の向こうに山が見え季節ごとに手仕事が生まれる一期一会の旅心に残る風景をゆっくりと",
    glyphFont: CJK_JP,
    roof: { src: IMG + "japan.webp", width: 1280, height: 363, scale: 0.78, eave: 0.98, span: 0.86 },
  },
  {
    name: "Kazakhstan",
    word: "Жайлау",
    gloss: "(Jailau) The summer pasture",
    headline: "open steppe, felt walls, and a sky that keeps going",
    caption: "Ride out past the last road, sleep under a crown of poles, and wake to horses at the door.",
    glyphs: "ұлы дала кең жайлау жел соғады киіз үйдің шаңырағынан көк аспан көрінеді жылқылар таңертең келеді жолың болсын қош келдіңіз ",
    glyphFont: MONO,
    roof: { src: IMG + "kazakhstan.webp", width: 1280, height: 534, scale: 0.68, eave: 0.97, span: 0.9 },
  },
  {
    name: "Russia",
    word: "Тоска",
    gloss: "(Toska) A longing with no name",
    headline: "carved timber, birch light, and winters that tell stories",
    caption: "Take the slow train north to painted wooden houses, river ice and a samovar always on.",
    glyphs: "берёзы у реки резной деревянный дом долгая снежная зима тёплый чай из самовара тихая река подо льдом поезд идёт на север дорога домой ",
    glyphFont: MONO,
    roof: { src: IMG + "russia.webp", width: 1280, height: 815, scale: 0.6, eave: 0.98, span: 0.74 },
  },
]

// #region physics
export interface Strand {
  /** Anchor at rest, before the roof's slide offset. */
  ax: number
  ay: number
  /** Drawn positions. */
  x: Float32Array
  y: Float32Array
  /** Sideways offset from the hanging line, and its velocity. */
  u: Float32Array
  v: Float32Array
  /** Previous step, relative to the roof offset then: drawn frames blend
   * between steps, so a 120 or 144 Hz screen gets every frame, not stairs. */
  ox: Float32Array
  oy: Float32Array
  seg: number
  phase: number
  chars: string[]
}

export interface Pointer {
  x: number
  y: number
  /** Radius of the round "hand" pressed into the curtain. */
  r: number
  on: boolean
}

export function makeStrands(cols: number, rows: number, left: number, width: number, top: number, seg: number, text: string): Strand[] {
  const glyphs = Array.from(text)
  const out: Strand[] = []
  for (let c = 0; c < cols; c++) {
    const ax = cols === 1 ? left + width / 2 : left + (width * c) / (cols - 1)
    const x = new Float32Array(rows)
    const y = new Float32Array(rows)
    for (let r = 0; r < rows; r++) {
      x[r] = ax
      y[r] = top + r * seg
    }
    const chars: string[] = []
    // row-major, so each row of the curtain reads as a line of text
    for (let r = 0; r < rows; r++) chars.push(glyphs[(r * cols + c) % glyphs.length] || "")
    out.push({ ax, ay: top, x, y, u: new Float32Array(rows), v: new Float32Array(rows), ox: x.slice(), oy: y.slice(), seg, phase: c * 1.37, chars })
  }
  return out
}

/** Re-derive drawn positions: each link keeps its length, so a bent string rises. */
export function layoutStrand(s: Strand, dx: number) {
  const n = s.x.length
  s.x[0] = s.ax + dx
  s.y[0] = s.ay
  for (let i = 1; i < n; i++) {
    s.x[i] = s.ax + dx + s.u[i]
    const h = s.x[i] - s.x[i - 1]
    const hh = Math.min(h * h, s.seg * s.seg * 0.98)
    s.y[i] = s.y[i - 1] + Math.sqrt(s.seg * s.seg - hh)
  }
}

/**
 * One fixed 1/60 s step of a damped hanging string: each glyph only moves
 * sideways, pulled straight by tension (stiffer near the pin, like a real
 * hanging chain) and gently home. The pointer is a round collider that pushes
 * glyphs out to its rim on the side they are on, so strings wrap around it and
 * pile up at its edge. Nothing can fold, stretch or be thrown.
 * dx is the roof's slide offset, carried down the string with a lag.
 */
export function stepStrands(strands: Strand[], dx: number, t: number, wind: number, p: Pointer, integrate = true) {
  const r = p.r
  const r2 = r * r
  for (const s of strands) {
    const n = s.x.length
    const u = s.u
    const v = s.v
    const move = s.ax + dx - s.x[0]
    if (move !== 0) for (let i = 1; i < n; i++) u[i] -= move * 0.08 * (i / n)
    if (integrate) {
      for (let i = 1; i < n; i++) {
        const below = i === n - 1 ? u[i] : u[i + 1]
        const tension = 0.16 + 0.3 * (1 - i / n)
        const breeze = wind * 0.0004 * Math.sin(t * 0.8 + s.phase + i * 0.08) * (i / n)
        const acc = tension * (u[i - 1] + below - 2 * u[i]) - 0.0024 * u[i] + breeze
        v[i] = (v[i] + acc) * 0.9
      }
      for (let i = 1; i < n; i++) u[i] += v[i]
      // bending stiffness: smooth out the kinks a push leaves behind
      for (let i = 1; i < n - 1; i++) u[i] += (u[i - 1] + u[i + 1] - 2 * u[i]) * 0.22
    }
    layoutStrand(s, dx)
    if (p.on && r > 0.5) {
      let hit = false
      for (let i = 1; i < n; i++) {
        const ey = s.y[i] - p.y
        if (ey * ey >= r2) continue
        const half = Math.sqrt(r2 - ey * ey)
        const ex = s.x[i] - p.x
        if (Math.abs(ex) >= half) continue
        // out to the rim on its own side; the push is absorbed, not thrown
        const nx = p.x + (ex >= 0 ? half : -half)
        u[i] += nx - s.x[i]
        v[i] *= 0.5
        hit = true
      }
      if (hit) layoutStrand(s, dx)
    }
  }
}

export const easeIn = (t: number) => t * t * t
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
// #endregion physics

const PAPER =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.95 .045' numOctaves='2' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .32 0 0 0 0 .27 0 0 0 0 .2 0 0 0 .5 -.18'/%3E%3C/filter%3E%3Cfilter id='b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.045 .95' numOctaves='2' seed='8' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .32 0 0 0 0 .27 0 0 0 0 .2 0 0 0 .45 -.17'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3Crect width='100%25' height='100%25' filter='url(%23b)'/%3E%3C/svg%3E\")"

const css =
  ".gch-root{--gch-paper:#e9e3d4;--gch-ink:#2b2620;--gch-soft:#6f675b;--gch-line:rgba(43,38,32,.22);--gch-g:clamp(16px,4.6vw,72px);--gch-stage:clamp(260px,min(40vw,66svh),640px);position:relative;width:100%;display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden;box-sizing:border-box;background-color:var(--gch-paper);background-image:" +
  PAPER +
  ";color:var(--gch-ink);font-family:'Newsreader',ui-serif,Georgia,serif;touch-action:pan-y;isolation:isolate}" +
  ":where(.dark) .gch-root{--gch-paper:#1d1b17;--gch-ink:#ece4d2;--gch-soft:#a59c8c;--gch-line:rgba(236,228,210,.22)}" +
  ".gch-root *,.gch-root *::before,.gch-root *::after{box-sizing:border-box}" +
  ".gch-root img{max-width:none}" +
  ".gch-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}" +
  ".gch-nav{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px var(--gch-g) 0}" +
  ".gch-navl{display:flex;align-items:baseline;gap:clamp(14px,3vw,40px);min-width:0}" +
  ".gch-brand{font-family:" + MONO + ";font-size:13px;font-weight:500;letter-spacing:.02em;white-space:nowrap}" +
  ".gch-links{display:flex;gap:18px;margin:0;padding:0;list-style:none;font-family:" + MONO + ";font-size:12px;color:var(--gch-soft)}" +
  ".gch-links li{white-space:nowrap}" +
  ".gch-cta{appearance:none;border:0;cursor:pointer;background:var(--gch-ink);color:var(--gch-paper);font:500 13px/1 'Newsreader',ui-serif,Georgia,serif;padding:9px 13px;border-radius:2px;white-space:nowrap}" +
  ".gch-cta:focus-visible,.gch-card:focus-visible{outline:2px solid var(--gch-ink);outline-offset:3px}" +
  ".gch-main{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) var(--gch-stage) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);grid-template-areas:'prev stage next' 'text stage caption';column-gap:clamp(20px,3vw,56px);padding:0 var(--gch-g) clamp(28px,6svh,64px)}" +
  ".gch-stage{grid-area:stage;position:relative;min-height:clamp(380px,72svh,820px)}" +
  ".gch-roof{position:absolute;left:50%;top:clamp(28px,7svh,72px);z-index:1;will-change:transform}" +
  ".gch-roof img{display:block;width:100%;height:auto;filter:drop-shadow(26px 38px 26px rgba(70,52,30,.26))}" +
  ":where(.dark) .gch-roof img{filter:drop-shadow(26px 38px 30px rgba(0,0,0,.55))}" +
  ".gch-card{grid-area:prev;justify-self:start;align-self:start;margin-top:calc(clamp(28px,7svh,72px) + var(--gch-stage) * .2);display:grid;justify-items:center;align-content:center;gap:3px;width:76px;height:72px;padding:6px;border:1px solid var(--gch-line);background:transparent;color:var(--gch-soft);cursor:pointer;font:400 12px/1 'Newsreader',ui-serif,Georgia,serif;transition:opacity .32s ease,color .2s ease,border-color .2s ease}" +
  ".gch-card:hover{color:var(--gch-ink);border-color:var(--gch-ink)}" +
  ".gch-card.gch-next{grid-area:next;justify-self:end}" +
  ".gch-card img{width:54px;height:30px;object-fit:contain;opacity:.85}" +
  ".gch-root[data-in=false] .gch-card{opacity:0}" +
  ".gch-text{grid-area:text;align-self:end;max-width:min(100%,520px)}" +
  ".gch-eyebrow{margin:0 0 clamp(16px,3svh,30px);font-family:" + MONO + ";font-size:12px;line-height:1.5;color:var(--gch-ink)}" +
  ".gch-h{margin:0;font-weight:500;font-size:clamp(30px,3.7vw,58px);line-height:1.02;letter-spacing:-.035em;font-variation-settings:'opsz' 72}" +
  ".gch-rule{display:inline-block;width:1.5em;height:.045em;min-height:1.5px;background:currentColor;vertical-align:.3em;margin:0 .1em}" +
  ".gch-cap{grid-area:caption;justify-self:end;align-self:end;max-width:200px;margin:0;font-family:" + MONO + ";font-size:11px;line-height:1.55;color:var(--gch-ink)}" +
  ".gch-w{display:inline-block;transition:opacity .7s cubic-bezier(.2,.7,.2,1),filter .7s cubic-bezier(.2,.7,.2,1)}" +
  ".gch-root[data-in=false] .gch-w{opacity:0;filter:blur(10px);transition-duration:.36s;transition-delay:0s!important}" +
  ".gch-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (max-width:820px){.gch-links{display:none}.gch-root{--gch-stage:min(100%,52svh)}" +
  ".gch-main{grid-template-columns:72px minmax(0,1fr) 72px;grid-template-rows:auto auto auto;grid-template-areas:'prev stage next' 'text text text' 'caption caption caption';row-gap:22px;column-gap:8px}" +
  ".gch-stage{min-height:clamp(340px,54svh,560px)}" +
  ".gch-card{width:72px;height:60px;padding:4px;font-size:11px;margin-top:calc(clamp(28px,7svh,72px) + 18px)}.gch-card img{width:44px;height:24px}" +
  ".gch-text{max-width:none}.gch-cap{justify-self:start;max-width:320px}}" +
  "@media (prefers-reduced-motion:reduce){.gch-w,.gch-card{transition:opacity .2s linear!important;transition-delay:0s!important}.gch-root[data-in=false] .gch-w{filter:none}}"

const EXIT_MS = 420
const SWAP_MS = 600
const TEXT_MS = 640
const ENTER_AT = 880
const ENTER_MS = 560

export default function GlyphCurtainHero({
  destinations = DEFAULT_DESTINATIONS,
  initialIndex = 1,
  brand = "Eaves & Ink",
  links = ["Home", "Destinations", "Journal"],
  cta = "Plan a trip",
  onCta,
  onChange,
  height = "100svh",
  fontHref = FONT_HREF,
  className,
}: GlyphCurtainHeroProps) {
  const count = destinations.length
  const wrap = (i: number) => ((i % count) + count) % count
  const [index, setIndex] = React.useState(() => wrap(initialIndex))
  const [textIn, setTextIn] = React.useState(true)
  const dest = destinations[index]
  const prev = destinations[wrap(index - 1)]
  const next = destinations[wrap(index + 1)]

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const roofRef = React.useRef(null as HTMLDivElement | null)
  const blurRef = React.useRef(null as SVGFEGaussianBlurElement | null)
  const sim = React.useRef({
    strands: [] as Strand[],
    dest: dest,
    font: "",
    fs: 12,
    offset: 0,
    anim: null as null | { from: number; to: number; start: number; dur: number; out: boolean },
    pointer: { x: 0, y: 0, r: 0, on: false } as Pointer,
    /** Where the real pointer is; the collider eases after it. */
    aim: { x: 0, y: 0, on: false, fresh: true },
    radius: 36,
    /** Roof offset at the last physics step. */
    lastDx: 0,
    busy: false,
    reduced: false,
    dirty: true,
    w: 0,
    h: 0,
    timers: [] as number[],
  })

  const filterId = "gch-mb-" + React.useId().replace(/[^a-zA-Z0-9]/g, "")

  // Lay the curtain out from the roof's resting box.
  const build = React.useCallback(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const roof = roofRef.current
    if (!root || !stage || !roof) return
    const s = sim.current
    const d = s.dest
    const rr = root.getBoundingClientRect()
    const sr = stage.getBoundingClientRect()
    const rw = sr.width * d.roof.scale
    const rh = (rw * d.roof.height) / d.roof.width
    roof.style.width = rw + "px"
    roof.style.marginLeft = -rw / 2 + "px"
    const top = roof.offsetTop
    const left = sr.left - rr.left + (sr.width - rw) / 2
    const fs = Math.max(9, Math.min(12, Math.round(sr.width / 52)))
    const span = rw * d.roof.span
    const cols = Math.max(6, Math.round(span / (fs * 1.12)))
    const ay = sr.top - rr.top + top + rh * d.roof.eave
    const bottom = sr.bottom - rr.top - 4
    const seg = fs * 1.08
    const rows = Math.max(8, Math.floor((bottom - ay) / seg))
    s.fs = fs
    s.font = (d.glyphFont.indexOf("Mono") >= 0 ? "500 " : "600 ") + fs + "px " + d.glyphFont
    s.lastDx = 0
    s.strands = makeStrands(cols, rows, left + (rw - span) / 2, span, ay + seg * 0.4, seg, d.glyphs)
    s.radius = Math.max(24, Math.min(40, sr.width * 0.062))
    s.dirty = true
  }, [])

  // Canvas size, physics loop and pointer.
  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const s = sim.current
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    s.reduced = mq.matches
    const onMq = () => {
      s.reduced = mq.matches
      build()
    }
    mq.addEventListener("change", onMq)
    const ctx = canvas.getContext("2d")
    let ink = "#2b2620"
    const readInk = () => {
      ink = getComputedStyle(root).getPropertyValue("--gch-ink").trim() || ink
      s.dirty = true
    }
    const resize = () => {
      const r = root.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      s.w = r.width
      s.h = r.height
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      readInk()
      build()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(root)
    const mo = new MutationObserver(readInk)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    resize()

    let visible = true
    const io = new IntersectionObserver((e) => {
      visible = e[0].isIntersecting
    })
    io.observe(root)

    let raf = 0
    let acc = 0
    let prevT = performance.now()
    let t = 0
    let frame = 0
    let alpha = 1
    let RX = new Float32Array(64)
    let RY = new Float32Array(64)
    const tick = () => {
      const now = performance.now()
      raf = requestAnimationFrame(tick)
      const dtMs = Math.min(64, now - prevT)
      prevT = now
      if (!visible || !ctx) return
      frame++
      if (frame % 90 === 0) readInk()
      // roof slide
      let vel = 0
      if (s.anim) {
        const a = s.anim
        const k = Math.min(1, (now - a.start) / a.dur)
        const e = a.out ? easeIn(k) : easeOut(k)
        const o = a.from + (a.to - a.from) * e
        vel = (o - s.offset) / Math.max(1, dtMs)
        s.offset = o
        if (k >= 1) s.anim = null
        s.dirty = true
      }
      if (roofRef.current) roofRef.current.style.transform = "translate3d(" + s.offset.toFixed(2) + "px,0,0)"
      if (blurRef.current) blurRef.current.setAttribute("stdDeviation", Math.min(14, Math.abs(vel) * 2.2).toFixed(2) + " 0")
      if (!s.reduced) {
        acc += dtMs / 1000
        let steps = 0
        const p = s.pointer
        const aim = s.aim
        while (acc >= 1 / 60 && steps < 8) {
          t += 1 / 60
          for (const st of s.strands) {
            for (let i = 0; i < st.x.length; i++) {
              st.ox[i] = st.x[i] - s.lastDx
              st.oy[i] = st.y[i]
            }
          }
          // The collider eases after the pointer and swells in or out, so the
          // curtain is pressed and released, never snapped. Small sub-steps
          // keep a fast pointer from jumping across a string.
          if (aim.fresh && aim.on) {
            p.x = aim.x
            p.y = aim.y
            aim.fresh = false
          }
          const gx = p.x + (aim.x - p.x) * 0.3
          const gy = p.y + (aim.y - p.y) * 0.3
          p.r += ((aim.on ? s.radius : 0) - p.r) * 0.16
          p.on = p.r > 0.5
          const sub = Math.min(6, Math.max(1, Math.ceil(Math.hypot(gx - p.x, gy - p.y) / (s.radius * 0.5))))
          const fx = p.x
          const fy = p.y
          for (let k = 1; k <= sub; k++) {
            p.x = fx + ((gx - fx) * k) / sub
            p.y = fy + ((gy - fy) * k) / sub
            stepStrands(s.strands, s.offset, t, 40, p, k === sub)
          }
          s.lastDx = s.offset
          acc -= 1 / 60
          steps++
        }
        if (steps === 8) acc = 0
        alpha = Math.min(1, acc * 60)
        s.dirty = true
      } else if (s.dirty) {
        for (const st of s.strands) {
          for (let i = 0; i < st.x.length; i++) {
            st.x[i] = st.ox[i] = st.ax
            st.y[i] = st.oy[i] = st.ay + i * st.seg
          }
        }
        s.lastDx = 0
        alpha = 1
      }
      if (!s.dirty) return
      s.dirty = false
      const dpr = canvas.width / Math.max(1, s.w)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = s.font
      ctx.fillStyle = ink
      ctx.globalAlpha = 0.86
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      for (const st of s.strands) {
        const n = st.x.length
        if (RX.length < n) {
          RX = new Float32Array(n)
          RY = new Float32Array(n)
        }
        // blend the last two steps, then pin to the roof where it is now
        for (let i = 0; i < n; i++) {
          RX[i] = st.ox[i] + (st.x[i] - s.lastDx - st.ox[i]) * alpha + s.offset
          RY[i] = st.oy[i] + (st.y[i] - st.oy[i]) * alpha
        }
        for (let i = 0; i < n; i++) {
          const ch = st.chars[i]
          if (!ch || ch === " ") continue
          const a = i === 0 ? 0 : i - 1
          const b = i === n - 1 ? n - 1 : i + 1
          const ang = -Math.atan2(RX[b] - RX[a], RY[b] - RY[a])
          const c = Math.cos(ang) * dpr
          const sn = Math.sin(ang) * dpr
          ctx.setTransform(c, sn, -sn, c, RX[i] * dpr, RY[i] * dpr)
          ctx.fillText(ch, 0, 0)
        }
      }
    }
    raf = requestAnimationFrame(tick)

    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      const aim = s.aim
      if (!aim.on) aim.fresh = s.pointer.r < 0.5
      aim.x = x
      aim.y = y
      aim.on = e.pointerType !== "touch" || e.buttons > 0
    }
    const leave = () => {
      s.aim.on = false
    }
    root.addEventListener("pointermove", move)
    root.addEventListener("pointerleave", leave)

    // Glyph fonts arrive after first paint; redraw when they do.
    const fonts = document.fonts
    const loaded = () => {
      s.dirty = true
    }
    fonts && fonts.addEventListener("loadingdone", loaded)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      io.disconnect()
      mq.removeEventListener("change", onMq)
      root.removeEventListener("pointermove", move)
      root.removeEventListener("pointerleave", leave)
      fonts && fonts.removeEventListener("loadingdone", loaded)
      for (const id of s.timers) clearTimeout(id)
    }
  }, [build])

  // Ask for each strings font with its own glyphs, so the right subsets load.
  React.useEffect(() => {
    if (!document.fonts) return
    for (const d of destinations) {
      document.fonts.load((d.glyphFont.indexOf("Mono") >= 0 ? "500" : "600") + " 12px " + d.glyphFont, d.glyphs).catch(() => {})
      const im = new Image()
      im.src = d.roof.src
    }
  }, [destinations])

  const go = React.useCallback(
    (dir: number) => {
      const s = sim.current
      if (s.busy) return
      const to = wrap(index + dir)
      const root = rootRef.current
      const roof = roofRef.current
      if (!root || !roof) return
      if (s.reduced) {
        setTextIn(false)
        s.timers.push(
          window.setTimeout(() => {
            s.dest = destinations[to]
            setIndex(to)
            onChange && onChange(to)
            requestAnimationFrame(() => {
              build()
              setTextIn(true)
            })
          }, 200),
        )
        return
      }
      s.busy = true
      const rr = root.getBoundingClientRect()
      const fr = roof.getBoundingClientRect()
      const restLeft = fr.left - rr.left - s.offset
      const w = fr.width
      const off = dir > 0 ? -(restLeft + w + 120) : rr.width - restLeft + 120
      const start = performance.now()
      s.anim = { from: 0, to: off, start, dur: EXIT_MS, out: true }
      setTextIn(false)
      s.timers.push(
        window.setTimeout(() => {
          s.dest = destinations[to]
          setIndex(to)
          onChange && onChange(to)
        }, SWAP_MS),
      )
      s.timers.push(
        window.setTimeout(() => {
          // Rebuild the curtain at rest, then park the roof off the far edge.
          build()
          const r2 = root.getBoundingClientRect()
          const f2 = roof.getBoundingClientRect()
          const rest2 = f2.left - r2.left - s.offset
          const enter = dir > 0 ? r2.width - rest2 + 120 : -(rest2 + f2.width + 120)
          s.offset = enter
          for (const st of s.strands) {
            for (let i = 0; i < st.x.length; i++) {
              st.u[i] = 0
              st.v[i] = 0
              st.x[i] = st.ax + enter
              st.ox[i] = st.ax
              st.oy[i] = st.y[i]
            }
          }
          s.lastDx = enter
          setTextIn(true)
        }, TEXT_MS),
      )
      s.timers.push(
        window.setTimeout(() => {
          s.anim = { from: s.offset, to: 0, start: performance.now(), dur: ENTER_MS, out: false }
        }, ENTER_AT),
      )
      s.timers.push(
        window.setTimeout(() => {
          s.busy = false
        }, ENTER_AT + ENTER_MS),
      )
    },
    [index, destinations, build, onChange],
  )

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1)
    else if (e.key === "ArrowLeft") go(-1)
  }

  const words = dest.headline.split(" ")
  const cap = dest.caption.split(" ")
  let n = 0
  const delay = () => ({ transitionDelay: 60 + n++ * 120 + "ms" })

  return (
    <section
      ref={rootRef}
      className={"gch-root" + (className ? " " + className : "")}
      style={{ minHeight: height }}
      data-in={textIn ? "true" : "false"}
      aria-roledescription="carousel"
      aria-label="Destinations"
      onKeyDown={onKey}
    >
      <style>{css}</style>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id={filterId} x="-20%" y="-10%" width="140%" height="120%">
          <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
        </filter>
      </svg>
      <canvas ref={canvasRef} className="gch-canvas" aria-hidden="true" />

      <nav className="gch-nav">
        <div className="gch-navl">
          <span className="gch-brand">{brand}</span>
          <ul className="gch-links">
            {links.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
        <button type="button" className="gch-cta" onClick={onCta}>
          {cta}
        </button>
      </nav>

      <div className="gch-main">
        <button type="button" className="gch-card" onClick={() => go(-1)} aria-label={"Previous: " + prev.name}>
          <img src={prev.roof.src} alt="" width={54} height={30} style={{ maxWidth: "none" }} />
          <span>{prev.name}</span>
        </button>

        <div ref={stageRef} className="gch-stage">
          <div ref={roofRef} className="gch-roof" style={{ filter: "url(#" + filterId + ")" }}>
            <img
              src={dest.roof.src}
              alt={dest.name + " roof"}
              width={dest.roof.width}
              height={dest.roof.height}
              style={{ maxWidth: "none" }}
              draggable={false}
            />
          </div>
        </div>

        <button type="button" className="gch-card gch-next" onClick={() => go(1)} aria-label={"Next: " + next.name}>
          <img src={next.roof.src} alt="" width={54} height={30} style={{ maxWidth: "none" }} />
          <span>{next.name}</span>
        </button>

        <div className="gch-text" aria-live="polite">
          <p className="gch-eyebrow">
            <span className="gch-w" style={delay()}>
              {dest.word}
            </span>{" "}
            {dest.gloss.split(" ").map((w, i) => (
              <React.Fragment key={dest.name + "g" + i}>
                <span className="gch-w" style={{ transitionDelay: 60 + i * 24 + "ms" }}>
                  {w}
                </span>{" "}
              </React.Fragment>
            ))}
          </p>
          <h2 className="gch-h">
            <span className="gch-w" style={delay()}>
              {dest.name}
            </span>{" "}
            <span className="gch-w" style={delay()}>
              <span className="gch-rule" />
            </span>{" "}
            {words.map((w, i) => (
              <React.Fragment key={dest.name + i}>
                <span className="gch-w" style={delay()}>
                  {w}
                </span>{" "}
              </React.Fragment>
            ))}
          </h2>
        </div>

        <p className="gch-cap">
          {cap.map((w, i) => (
            <React.Fragment key={dest.name + "c" + i}>
              <span className="gch-w" style={{ transitionDelay: 300 + i * 18 + "ms" }}>
                {w}
              </span>{" "}
            </React.Fragment>
          ))}
        </p>
      </div>
    </section>
  )
}
