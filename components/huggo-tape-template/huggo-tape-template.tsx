"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * HuggoTapeTemplate: a loud, playful landing page for a tape brand where the
 * tape tells the story.
 *
 * Storyboard
 *  1. Load: thick rainbow arcs (orange, yellow, sky, blue) rise over the screen
 *     and the last, lime one becomes the hero.
 *  2. Hero: a 3D clear-tape roll drops onto the hill with a bounce, "We're
 *     [badge] here to" settles, and the giant headline pops in letter by
 *     letter with squash and stretch.
 *  3. Scroll: the roll rolls down the page and leaves a translucent printed
 *     strip behind it, which runs over the green collage and holds it down.
 *     Every collage piece slides in, settles, and gets its own bits of tape.
 *  4. A lime printed tape ribbon is unrolled along a wave by a second roll,
 *     with a marquee printed on it, into the orange section.
 *  5. Orange: masking tape is laid, the wall is painted, the tape is peeled,
 *     and crisp lines are left behind. Sticker flowers pop on.
 *  6. Pink: the shop. Four rolls drop in from a pile and get washi-taped on.
 *  7. Peach footer: the wordmark is duct-taped down.
 *
 * GSAP + ScrollTrigger inside one gsap.context; no pinning (sticky stages
 * instead). prefers-reduced-motion gets calm fades and a finished page.
 * Fonts: Bricolage Grotesque, Anton and Caveat (SIL OFL, Google Fonts). Every
 * object is drawn in CSS/SVG, so the page needs no image hosting.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

export type HuggoRollKind = "clear" | "print" | "masking" | "washi" | "duct"

export type HuggoProduct = {
  name: string
  line: string
  price: string
  kind: HuggoRollKind
}

export interface HuggoTapeTemplateProps {
  /** Height of the hero and of the sticky masking stage. Must be a definite length. */
  height?: string
  /** Wordmark printed on the badge, rolls and footer. */
  brand?: string
  /** The two headline lines that pop in. */
  headline?: [string, string]
  /** Brand story on the peach card. */
  story?: string
  /** Items on the sticky note. The third one is ticked. */
  todo?: string[]
  /** Phrases printed on the wavy ribbon, separated by the badge. */
  marquee?: string[]
  /** Headline of the masking section, one line per entry. */
  maskHeadline?: string[]
  products?: HuggoProduct[]
  /** Play the rainbow preloader on mount. */
  preloader?: boolean
  /** Google Fonts stylesheet; null loads nothing (bring your own fonts). */
  fontHref?: string | null
  className?: string
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Anton&family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=Caveat:wght@500..700&display=swap"

const DEFAULT_PRODUCTS: HuggoProduct[] = [
  { name: "Clear Grip", line: "48 mm packing tape that survives the moving truck.", price: "$6", kind: "clear" },
  { name: "Loud Print", line: "Lime printed tape that turns parcels into billboards.", price: "$8", kind: "print" },
  { name: "Clean Line", line: "Crepe masking that peels clean for 14 days.", price: "$7", kind: "masking" },
  { name: "Doodle Washi", line: "Tearable paper tape for journals, walls and gifts.", price: "$5", kind: "washi" },
]

const KIND_LABEL = { clear: "Clear", print: "Print", masking: "Masking", washi: "Washi", duct: "Duct" }

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
const REDUCE = "(prefers-reduced-motion: reduce)"
const FACETS = Array.from({ length: 32 }, (_, i) => i)
const REPEAT = 6
const v = (o: { [k: string]: string | number }) => o as React.CSSProperties

// #region badge
/** Die-cut sticker outline: n bumps around a circle of radius r, centred on 60,60. */
function scallop(r: number, bump: number, n: number) {
  const f = (a: number, rr: number) => (60 + rr * Math.cos(a)).toFixed(2) + " " + (60 + rr * Math.sin(a)).toFixed(2)
  let d = "M" + f(0, r)
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    d += " Q" + f((a0 + a1) / 2, r + bump * 2) + " " + f(a1, r)
  }
  return d + "Z"
}
// #endregion
const BADGE_OUT = scallop(51, 4.2, 14)
const BADGE_IN = scallop(46, 3.6, 14)

// ---- the masking stage, in its own 1600 x 1000 viewBox -----------------------------------------
const MK_L = 2600
const MK_W = 92
const MK_STRIPS = [
  { cx: 800, cy: 285, a: -10 },
  { cx: 800, cy: 545, a: 6 },
  { cx: 800, cy: 790, a: -4 },
]

/** The round die-cut sticker logo. */
export function HuggoBadge({ size, brand = "HUGGO", className }: { size?: number; brand?: string; className?: string }) {
  return (
    <svg className={"ht-badge" + (className ? " " + className : "")} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <path d={BADGE_OUT} fill="#fffdf4" />
      <path d={BADGE_IN} fill="#0d4f20" />
      <circle cx="60" cy="60" r="37" fill="none" stroke="#c9f227" strokeWidth="1.6" strokeDasharray="2.5 3.5" />
      <text x="60" y="64" textAnchor="middle" className="ht-badge-word" fill="#c9f227" fontSize={brand.length > 6 ? 19 : 25}>
        {brand}
      </text>
      <text x="60" y="80" textAnchor="middle" className="ht-badge-sub" fill="#fffdf4" fontSize="8.5" letterSpacing="2">
        TAPE CO.
      </text>
      <path d="M44 40 l3 -6 l3 6 l-3 6z M70 40 l3 -6 l3 6 l-3 6z" fill="#ffd51f" />
      <ellipse cx="42" cy="30" rx="16" ry="6" fill="#fff" opacity="0.18" transform="rotate(-28 42 30)" />
    </svg>
  )
}

/** The flat end of a roll: tape layers, cardboard core and a printed label. */
function RollFace({ kind, brand }: { kind: HuggoRollKind; brand: string }) {
  return (
    <div className={"ht-face ht-k-" + kind}>
      <div className="ht-face-core" />
      <div className="ht-face-label">
        <span className="ht-face-brand">{brand}</span>
        <span className="ht-face-kind">{KIND_LABEL[kind]}</span>
      </div>
      <div className="ht-face-gloss" />
    </div>
  )
}

/** A true 3D roll: 32 band facets around the x axis plus two end caps. */
function Roll3D({ kind, brand }: { kind: HuggoRollKind; brand: string }) {
  return (
    <div className={"ht-roll ht-k-" + kind} aria-hidden="true">
      <div className="ht-roll-shadow" />
      <div className="ht-roll-body">
        {FACETS.map((i) => (
          <i key={i} className="ht-roll-facet" style={v({ "--i": i })} />
        ))}
        <div className="ht-roll-cap ht-roll-cap-a">
          <RollFace kind={kind} brand={brand} />
        </div>
        <div className="ht-roll-cap ht-roll-cap-b">
          <RollFace kind={kind} brand={brand} />
        </div>
      </div>
    </div>
  )
}

/** A torn piece of tape. Outer element places it, inner one is what animates. */
function Tape({ kind, x, y, w, r }: { kind: HuggoRollKind; x: string; y: string; w: string; r: number }) {
  return (
    <i className={"ht-tp ht-tp-" + kind} style={v({ left: x, top: y, width: w, "--r": r + "deg" })} aria-hidden="true">
      <b className="ht-tp-in" />
    </i>
  )
}

function Daisy({ petals, color, center, className }: { petals: number; color: string; center: string; className: string }) {
  const angles = Array.from({ length: petals }, (_, i) => (i * 360) / petals)
  const rx = petals > 6 ? 11 : 15
  return (
    <svg className={"ht-daisy " + className} viewBox="-62 -62 124 124" aria-hidden="true">
      <g fill="#fffdf4" stroke="#fffdf4" strokeWidth="10" strokeLinejoin="round">
        {angles.map((a) => (
          <ellipse key={a} cx="0" cy="-25" rx={rx} ry="25" transform={"rotate(" + a + ")"} />
        ))}
      </g>
      <g fill={color}>
        {angles.map((a) => (
          <ellipse key={a} cx="0" cy="-25" rx={rx} ry="25" transform={"rotate(" + a + ")"} />
        ))}
      </g>
      <g fill="#000" opacity="0.08">
        {angles.map((a) => (
          <ellipse key={a} cx="3" cy="-22" rx={rx * 0.5} ry="18" transform={"rotate(" + a + ")"} />
        ))}
      </g>
      <circle r="15" fill={center} />
      <g fill="#7c3510" opacity="0.45">
        <circle cx="-5" cy="-4" r="2" />
        <circle cx="4" cy="-6" r="1.8" />
        <circle cx="6" cy="4" r="2" />
        <circle cx="-3" cy="6" r="1.6" />
        <circle cx="0" cy="0" r="1.6" />
      </g>
      <ellipse cx="-16" cy="-34" rx="6" ry="13" fill="#fff" opacity="0.4" transform="rotate(-32 -16 -34)" />
    </svg>
  )
}

function LemonPrint({ uid }: { uid: string }) {
  const lemon =
    "M-31 0 Q-28 -4 -24 -7 C-18 -21 18 -21 24 -7 Q28 -4 31 0 Q28 4 24 7 C18 21 -18 21 -24 7 Q-28 4 -31 0Z"
  const leaf = "M0 0 C8 -15 26 -19 40 -12 C30 -1 13 5 0 0Z"
  return (
    <svg className="ht-lemon-svg" viewBox="0 0 300 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={uid + "lm"} cx="0.36" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#fff38a" />
          <stop offset="0.5" stopColor="#ffd42e" />
          <stop offset="1" stopColor="#f0a514" />
        </radialGradient>
        <pattern id={uid + "lp"} width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-9)">
          <rect width="120" height="120" fill="#fffcf2" />
          <path d="M0 0 L9 0 L0 9Z M120 0 L111 0 L120 9Z M0 120 L9 120 L0 111Z M120 120 L111 120 L120 111Z" fill="#17a08c" />
          <path d="M60 2 l5 5 l-5 5 l-5 -5z M60 108 l5 5 l-5 5 l-5 -5z" fill="#ffc21a" />
          <g transform="translate(60 60) rotate(-28)">
            <path d={leaf} fill="#139a85" transform="translate(14 -10) rotate(-24)" />
            <path d={leaf} fill="#0d7f6d" transform="translate(14 -10) rotate(26) scale(.82)" />
            <path d="M14 -10 l20 -2" stroke="#0a5e51" strokeWidth="1.2" />
            <path d={lemon} fill={"url(#" + uid + "lm)"} stroke="#e08f0d" strokeWidth="1.4" />
            <ellipse cx="-9" cy="-8" rx="9" ry="4" fill="#fff" opacity="0.5" transform="rotate(-12 -9 -8)" />
            <g fill="#e39b12" opacity="0.5">
              <circle cx="8" cy="5" r="0.9" />
              <circle cx="14" cy="-2" r="0.9" />
              <circle cx="-2" cy="8" r="0.9" />
              <circle cx="18" cy="6" r="0.9" />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="300" height="380" fill={"url(#" + uid + "lp)"} />
    </svg>
  )
}

function GiftBow({ uid }: { uid: string }) {
  return (
    <svg className="ht-gift-bow" viewBox="0 0 220 160" aria-hidden="true">
      <defs>
        <linearGradient id={uid + "sat"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#f3eef5" />
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ddd3e2" />
        </linearGradient>
      </defs>
      <g filter="drop-shadow(0 6px 5px rgba(120,0,60,.28))">
        <path d="M110 80 C96 104 74 132 62 154 L84 150 L92 166 C102 140 108 112 114 86Z" fill={"url(#" + uid + "sat)"} />
        <path d="M110 80 C124 104 146 130 160 152 L138 150 L130 165 C120 140 112 112 106 86Z" fill={"url(#" + uid + "sat)"} />
        <path d="M108 78 C80 40 30 26 22 52 C14 80 64 96 108 84Z" fill={"url(#" + uid + "sat)"} />
        <path d="M112 78 C140 40 190 26 198 52 C206 80 156 96 112 84Z" fill={"url(#" + uid + "sat)"} />
        <path d="M106 80 C82 58 50 48 40 58 C60 58 84 70 104 84Z" fill="#cdbfd6" opacity="0.6" />
        <path d="M114 80 C138 58 170 48 180 58 C160 58 136 70 116 84Z" fill="#cdbfd6" opacity="0.6" />
        <ellipse cx="110" cy="81" rx="15" ry="13" fill={"url(#" + uid + "sat)"} />
        <ellipse cx="106" cy="77" rx="6" ry="3.5" fill="#fff" />
      </g>
    </svg>
  )
}

export default function HuggoTapeTemplate({
  height = "100svh",
  brand = "HUGGO",
  headline = ["HOLD IT", "TOGETHER"],
  story = "Wobbly shelves, birthday-wrap panic, the science fair at 7 a.m., the box that will not shut. We hold tight, so you don't have to.",
  todo = ["fix the poster", "wrap Mo's gift", "tape the moving boxes", "save the science fair", "call grandma"],
  marquee = ["LIFE GETS LOOSE", "WE KEEP IT TOGETHER"],
  maskHeadline = ["CLEAN", "LINES", "ONLY"],
  products = DEFAULT_PRODUCTS,
  preloader = true,
  fontHref = FONT_HREF,
  className,
}: HuggoTapeTemplateProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const ctxRef = React.useRef(null as gsap.Context | null)
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const [bag, setBag] = React.useState(0)
  const [added, setAdded] = React.useState(-1)
  const [joined, setJoined] = React.useState(false)

  const cycle = React.useMemo(() => {
    const out: string[] = []
    for (const p of marquee) {
      for (const ch of p) out.push(ch)
      out.push(" ", "@", " ")
    }
    return out
  }, [marquee])
  const items = React.useMemo(() => {
    const out: string[] = []
    for (let r = 0; r < REPEAT; r++) out.push(...cycle)
    return out
  }, [cycle])

  const go = (sec: string) => () => {
    const el = rootRef.current?.querySelector('[data-sec="' + sec + '"]')
    const smooth = !window.matchMedia(REDUCE).matches
    el?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" })
  }

  const add = (i: number) => () => {
    setBag((n) => n + 1)
    setAdded(i)
    const root = rootRef.current
    const pill = root?.querySelector(".ht-bag-n")
    if (pill && ctxRef.current && !window.matchMedia(REDUCE).matches)
      ctxRef.current.add(() => {
        gsap.fromTo(pill, { scale: 1.8, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.7, ease: "elastic.out(1,.35)" })
      })
  }

  // ---- motion ----------------------------------------------------------------------------------
  useIso(() => {
    const root = rootRef.current
    if (!root) return
    const q = (s: string) => root.querySelector(s) as HTMLElement | null
    const qa = (s: string) => Array.from(root.querySelectorAll(s)) as HTMLElement[]
    const cleanups: (() => void)[] = []
    let alive = true

    const ctx = gsap.context(() => {
      // ---- the clear roll and the strip it leaves -------------------------------------------
      const run = q(".ht-run")
      const hero = q(".ht-hero")
      const roll = q(".ht-run .ht-roll")
      const body = q(".ht-run .ht-roll-body")
      const strip = q(".ht-strip")
      const tape = { p: 0, dy: 0, y0: 0, y1: 0, D: 160 }
      const measureTape = () => {
        if (!run || !hero || !roll || !strip) return
        tape.D = roll.offsetWidth
        tape.y0 = hero.offsetHeight - tape.D * 0.46
        tape.y1 = run.offsetHeight - tape.D * 0.62
        strip.style.top = tape.y0 + "px"
      }
      const drawTape = (full?: boolean) => {
        if (!roll || !body || !strip) return
        const { p, dy, y0, y1, D } = tape
        const dist = (y1 - y0) * p
        const y = y0 + dist + dy
        const spin = (-(dist + dy * 0.6) / (D / 2)) * 57.2958
        const tilt = -52 + 30 * Math.min(1, p * 7) - 22 * Math.max(0, (p - 0.92) * 12.5) + Math.sin(dist / 240) * 4
        roll.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)"
        body.style.setProperty("--tilt", tilt.toFixed(2) + "deg")
        body.style.setProperty("--spin", spin.toFixed(2) + "deg")
        strip.style.height = Math.max(0, full ? y1 - y0 : dist + D * 0.04).toFixed(1) + "px"
      }

      // ---- the lime ribbon: a sine wave, a marquee printed along it, a roll that lays it ------
      const banner = q(".ht-banner")
      const bsvg = q(".ht-bn-svg")
      const glyphLayer = q(".ht-bn-glyphs")
      const bClip = q(".ht-bn-cliprect")
      const bRoll = q(".ht-bn-roll")
      const glyphs = qa(".ht-mq-i")
      const perCycle = glyphs.length / REPEAT
      const bn = { W: 0, H: 0, A: 0, k: 0, mid: 0, T: 0, X: [0], Y: [0], S: [0], w: [0], h: [0], cum: [0], cyc: 1, off: 0, reveal: 0, boost: 0 }
      const PH = 0.9
      const measureBanner = () => {
        if (!banner || !bsvg || !glyphLayer) return
        const W = banner.clientWidth
        const H = banner.clientHeight
        const T = H * 0.34
        const A = H * 0.12
        const mid = H * 0.5
        const k = (2 * Math.PI) / Math.max(620, W * 0.7)
        const X: number[] = []
        const Y: number[] = []
        const S: number[] = []
        let s = 0
        for (let x = -240; x <= W + 240; x += 4) {
          const y = mid + A * Math.sin(k * x + PH)
          if (X.length) s += Math.hypot(x - X[X.length - 1], y - Y[Y.length - 1])
          X.push(x)
          Y.push(y)
          S.push(s)
        }
        Object.assign(bn, { W, H, A, k, mid, T, X, Y, S })
        bsvg.setAttribute("viewBox", "0 0 " + W + " " + H)
        let d = ""
        for (let i = 0; i < X.length; i += 2) d += (i ? " L" : "M") + X[i].toFixed(1) + " " + Y[i].toFixed(1)
        for (const p of Array.from(bsvg.querySelectorAll(".ht-bn-line"))) {
          p.setAttribute("d", d)
          const f = Number(p.getAttribute("data-w"))
          p.setAttribute("stroke-width", (T * f).toFixed(1))
        }
        const sheen = bsvg.querySelector(".ht-bn-sheen")
        if (sheen) sheen.setAttribute("transform", "translate(0 " + (-T * 0.24).toFixed(1) + ")")
        const fill = bsvg.querySelector(".ht-bn-fill")
        if (fill) fill.setAttribute("d", d + " L" + (W + 240) + " " + (H + 4) + " L-240 " + (H + 4) + "Z")
        glyphLayer.style.setProperty("--fs", (T * 0.58).toFixed(1) + "px")
        if (bRoll) bRoll.style.setProperty("--d", (T * 1.9).toFixed(1) + "px")
        bn.w = glyphs.map((g) => g.offsetWidth)
        bn.h = glyphs.map((g) => g.offsetHeight)
        bn.cum = []
        let c = 0
        for (const w of bn.w) {
          bn.cum.push(c)
          c += w
        }
        bn.cyc = Math.max(1, perCycle ? bn.cum[perCycle] ?? c : c)
      }
      const drawBanner = () => {
        if (!bn.W || !glyphLayer) return
        const { X, Y, S, A, k, W, mid } = bn
        const xr = -240 + (W + 480) * bn.reveal
        if (bClip) bClip.setAttribute("width", Math.max(0, xr + 240).toFixed(1))
        glyphLayer.style.clipPath = "polygon(-10% -60%, " + xr.toFixed(1) + "px -60%, " + xr.toFixed(1) + "px 160%, -10% 160%)"
        const base = -(((bn.off % bn.cyc) + bn.cyc) % bn.cyc)
        const last = S[S.length - 1]
        let j = 0
        for (let i = 0; i < glyphs.length; i++) {
          const el = glyphs[i]
          const s = base + bn.cum[i] + bn.w[i] / 2 + 60
          if (s < 0 || s > last) {
            el.style.visibility = "hidden"
            continue
          }
          while (j < S.length - 2 && S[j + 1] < s) j++
          const t = (s - S[j]) / Math.max(0.001, S[j + 1] - S[j])
          const x = X[j] + (X[j + 1] - X[j]) * t
          const y = Y[j] + (Y[j + 1] - Y[j]) * t
          const ang = Math.atan(A * k * Math.cos(k * x + PH))
          el.style.visibility = x > W + 60 ? "hidden" : "visible"
          el.style.transform =
            "translate(" + (x - bn.w[i] / 2).toFixed(1) + "px," + (y - bn.h[i] / 2).toFixed(1) + "px) rotate(" + ang.toFixed(4) + "rad)"
        }
        if (bRoll) {
          const d = bn.T * 1.9
          const y = mid + A * Math.sin(k * xr + PH)
          bRoll.style.opacity = bn.reveal > 0.001 && bn.reveal < 0.999 ? "1" : "0"
          bRoll.style.transform =
            "translate(" + (xr - d / 2).toFixed(1) + "px," + (y - d / 2).toFixed(1) + "px) rotate(" + ((xr / (d / 2)) * 57.3).toFixed(1) + "deg)"
        }
      }

      // ---- the masking stage: lay, paint, peel ---------------------------------------------------
      const mask = q(".ht-mask")
      const mkBodies = qa(".ht-mk-body")
      const mkLeads = qa(".ht-mk-lead")
      const mkCurls = qa(".ht-mk-curl")
      const mkClip = q(".ht-mk-cliprect")
      const mkRoller = q(".ht-mk-roller")
      const mkFace = q(".ht-mask-roll .ht-face")
      const ms = { l0: 0, l1: 0, l2: 0, p0: 0, p1: 0, p2: 0, paint: 0, t: 0 }
      const drawMask = () => {
        const lays = [ms.l0, ms.l1, ms.l2]
        const peels = [ms.p0, ms.p1, ms.p2]
        for (let i = 0; i < 3; i++) {
          const xa = -MK_L / 2 + peels[i] * MK_L
          const xb = -MK_L / 2 + lays[i] * MK_L
          for (const r of Array.from(mkBodies[i]?.children || [])) {
            r.setAttribute("x", xa.toFixed(1))
            r.setAttribute("width", Math.max(0, xb - xa).toFixed(1))
          }
          const lead = mkLeads[i]
          if (lead) {
            const on = lays[i] > 0.001 && lays[i] < 0.999
            lead.setAttribute("opacity", on ? "1" : "0")
            lead.setAttribute("transform", "translate(" + xb.toFixed(1) + " -64) rotate(" + ((xb / 78) * 57.3).toFixed(1) + ")")
          }
          const curl = mkCurls[i]
          if (curl) {
            curl.setAttribute("opacity", peels[i] > 0.001 && peels[i] < 0.999 ? "1" : "0")
            curl.setAttribute("transform", "translate(" + xa.toFixed(1) + " 0)")
          }
        }
        const px = -200 + ms.paint * 2000
        if (mkClip) mkClip.setAttribute("width", Math.max(0, px + 200).toFixed(1))
        if (mkRoller) {
          mkRoller.setAttribute("opacity", ms.paint > 0.001 && ms.paint < 0.999 ? "1" : "0")
          mkRoller.setAttribute("transform", "translate(" + px.toFixed(1) + " 0)")
        }
        if (mkFace) mkFace.style.transform = "rotate(" + (ms.t * 620).toFixed(1) + "deg)"
      }
      const maskTimeline = (tl: gsap.core.Timeline) => {
        const e = "power1.inOut"
        tl.to(ms, { l0: 1, duration: 0.13, ease: e }, 0.02)
          .to(ms, { l1: 1, duration: 0.13, ease: e }, 0.12)
          .to(ms, { l2: 1, duration: 0.13, ease: e }, 0.22)
          .to(ms, { paint: 1, duration: 0.24, ease: "none" }, 0.37)
          .to(ms, { p0: 1, duration: 0.12, ease: e }, 0.64)
          .to(ms, { p1: 1, duration: 0.12, ease: e }, 0.73)
          .to(ms, { p2: 1, duration: 0.12, ease: e }, 0.82)
          .to(ms, { t: 1, duration: 1, ease: "none" }, 0)
          .fromTo(q(".ht-mask-stamp"), { scale: 2.2, opacity: 0, rotation: -24 }, { scale: 1, opacity: 1, rotation: -9, duration: 0.05, ease: "power4.in" }, 0.95)
        return tl
      }

      const refreshAll = () => {
        measureTape()
        measureBanner()
      }

      const mm = gsap.matchMedia()

      // ---- reduced motion: calm fades over a finished page --------------------------------------
      mm.add(REDUCE, () => {
        const still = () => {
          refreshAll()
          tape.p = 0
          tape.dy = 0
          drawTape(true)
          bn.reveal = 1
          drawBanner()
        }
        still()
        maskTimeline(gsap.timeline({ paused: true, onUpdate: drawMask })).progress(1)
        drawMask()
        gsap.from(qa(".ht-hero-copy, .ht-hero-note, .ht-cue"), { opacity: 0, duration: 0.9, ease: "power1.out" })
        for (const el of qa("[data-drop], .ht-prod, .ht-word, .ht-mask-copy, .ht-daisy"))
          gsap.from(el, { opacity: 0, duration: 0.8, ease: "power1.out", scrollTrigger: { trigger: el, start: "top 92%" } })
        const ro = new ResizeObserver(still)
        ro.observe(root)
        if (document.fonts) document.fonts.ready.then(() => alive && still())
        return () => ro.disconnect()
      })

      // ---- full choreography ---------------------------------------------------------------------
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        refreshAll()
        drawTape()
        drawBanner()

        // load: rainbow arcs rise, the roll drops in, the letters pop
        const pre = q(".ht-pre")
        const letters = qa(".ht-l")
        gsap.set(letters, { opacity: 0, transformOrigin: "50% 100%" })
        gsap.set(qa(".ht-kw"), { opacity: 0, y: 14 })
        gsap.set(q(".ht-kicker .ht-badge"), { scale: 0, rotation: -160 })
        gsap.set(qa(".ht-hero-note, .ht-cue"), { opacity: 0 })
        tape.dy = -(tape.y0 + tape.D * 1.2)
        drawTape()

        const intro = gsap.timeline({ paused: true })
        let t0 = 0
        if (pre && preloader) {
          gsap.set(pre, { autoAlpha: 1 })
          const bands = qa(".ht-pre-band")
          intro
            .to(q(".ht-pre-label"), { opacity: 0, y: -30, duration: 0.35, ease: "power2.in" }, 0.1)
            .fromTo(bands, { yPercent: 64 }, { yPercent: -36, duration: 1.15, ease: "power3.inOut", stagger: 0.13 }, 0)
            .set(pre, { autoAlpha: 0 }, 0.13 * (bands.length - 1) + 1.1)
          t0 = 0.13 * (bands.length - 1) + 0.75
          const n = { v: 0 }
          const num = q(".ht-pre-num")
          gsap.to(n, { v: 100, duration: 0.8, ease: "power2.out", onUpdate: () => num && (num.textContent = Math.round(n.v) + "%") })
        }
        intro.to(tape, { dy: 0, duration: 1.05, ease: "bounce.out", onUpdate: () => drawTape() }, t0)
        intro
          .to(qa(".ht-kw"), { opacity: 1, y: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.12 }, t0 + 0.2)
          .to(q(".ht-kicker .ht-badge"), { scale: 1, rotation: -8, duration: 0.8, ease: "back.out(2.2)" }, t0 + 0.25)
        const order = gsap.utils.shuffle(letters.slice())
        order.forEach((el, i) => {
          const t = t0 + 0.35 + i * 0.055
          intro
            .fromTo(el, { opacity: 0, scaleX: 1.55, scaleY: 0.12, y: 50 }, { opacity: 1, scaleX: 0.78, scaleY: 1.32, y: -46, duration: 0.2, ease: "power2.out" }, t)
            .to(el, { scaleX: 1.22, scaleY: 0.8, y: 0, duration: 0.14, ease: "power2.in" }, t + 0.2)
            .to(el, { scaleX: 1, scaleY: 1, duration: 0.7, ease: "elastic.out(1,.32)" }, t + 0.34)
        })
        intro.to(qa(".ht-hero-note, .ht-cue"), { opacity: 1, duration: 0.6, stagger: 0.1 }, t0 + 1.1)

        let ready = false
        const fonts = document.fonts ? document.fonts.ready : Promise.resolve()
        Promise.race([fonts, new Promise((r) => setTimeout(r, 1600))]).then(() => {
          if (!alive) return
          ready = true
          refreshAll()
          ScrollTrigger.refresh()
          intro.play()
        })

        // headline letters jiggle under the pointer once they've landed
        const h1 = q(".ht-h1")
        const onOver = (e: Event) => {
          const el = (e.target as HTMLElement).closest(".ht-l")
          if (!el || !ready || intro.isActive()) return
          ctx.add(() =>
            gsap.fromTo(el, { scaleX: 1.25, scaleY: 0.72 }, { scaleX: 1, scaleY: 1, duration: 0.8, ease: "elastic.out(1,.28)", overwrite: "auto" }),
          )
        }
        if (h1 && window.matchMedia("(pointer: fine)").matches) {
          h1.addEventListener("pointerover", onOver)
          cleanups.push(() => h1.removeEventListener("pointerover", onOver))
        }

        // scroll: the roll travels and lays the strip
        const onInit = () => refreshAll()
        const onDone = () => {
          drawTape()
          drawBanner()
        }
        ScrollTrigger.addEventListener("refreshInit", onInit)
        ScrollTrigger.addEventListener("refresh", onDone)
        cleanups.push(() => {
          ScrollTrigger.removeEventListener("refreshInit", onInit)
          ScrollTrigger.removeEventListener("refresh", onDone)
        })
        gsap.to(tape, {
          p: 1,
          ease: "none",
          onUpdate: () => drawTape(),
          scrollTrigger: {
            trigger: run,
            start: "top top",
            end: () => "+=" + Math.max(200, tape.y1 - window.innerHeight * 0.62),
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        })

        // collage pieces slide in, settle, then their tape slaps on
        qa("[data-drop]").forEach((el, i) => {
          const s = i % 2 ? 1 : -1
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" } })
          tl.from(el, { y: 170, x: s * 80, rotation: s * 16, scale: 1.07, opacity: 0, duration: 1.05, ease: "back.out(1.5)" })
          const bits = el.querySelectorAll(".ht-tp-in")
          if (bits.length) tl.from(bits, { scale: 1.8, opacity: 0, duration: 0.28, ease: "power4.in", stagger: 0.09 }, 0.6)
        })

        // ribbon: unrolled by the lime roll, marquee speeds up with scroll velocity
        gsap.to(bn, {
          reveal: 1,
          ease: "none",
          onUpdate: drawBanner,
          scrollTrigger: { trigger: banner, start: "top 92%", end: "top 30%", scrub: 0.6 },
        })
        const tick = (_t: number, dt: number) => {
          bn.off += (dt / 1000) * (70 + bn.boost)
          bn.boost *= 0.93
          drawBanner()
        }
        ScrollTrigger.create({
          trigger: banner,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
          onUpdate: (self) => {
            bn.boost = Math.min(700, Math.max(bn.boost, Math.abs(self.getVelocity()) * 0.35))
          },
        })
        cleanups.push(() => gsap.ticker.remove(tick))

        // masking: one scrubbed timeline over a sticky stage
        maskTimeline(
          gsap.timeline({
            onUpdate: drawMask,
            scrollTrigger: { trigger: mask, start: "top top", end: "bottom bottom", scrub: 0.6 },
          }),
        )
        gsap.from(qa(".ht-daisy"), {
          scale: 0,
          rotation: -120,
          duration: 0.9,
          ease: "back.out(2.4)",
          stagger: 0.08,
          scrollTrigger: { trigger: mask, start: "top 55%", toggleActions: "play none none reverse" },
        })
        gsap.from(qa(".ht-mask-h .ht-ml"), {
          yPercent: 110,
          rotation: 6,
          duration: 0.9,
          ease: "back.out(1.6)",
          stagger: 0.1,
          scrollTrigger: { trigger: mask, start: "top 55%", toggleActions: "play none none reverse" },
        })
        for (const el of qa(".ht-daisy")) {
          gsap.to(el, { yPercent: -60 * Number(el.getAttribute("data-depth") || 1), ease: "none", scrollTrigger: { trigger: mask, start: "top bottom", end: "bottom top", scrub: true } })
        }

        // joints between sections: a strip of tape is laid across each seam
        for (const j of qa(".ht-join")) {
          gsap.fromTo(
            j.querySelector(".ht-join-in"),
            { scaleX: 0 },
            { scaleX: 1, ease: "none", scrollTrigger: { trigger: j, start: "top 96%", end: "top 50%", scrub: 0.5 } },
          )
        }

        // shop: the rolls drop out of a pile, then washi gets slapped on
        const cards = qa(".ht-prod")
        const shopTl = gsap.timeline({ scrollTrigger: { trigger: q(".ht-shop-grid"), start: "top 82%", toggleActions: "play none none reverse" } })
        shopTl.from(cards, {
          y: 220,
          x: (i: number) => (1.5 - i) * 90,
          rotation: (i: number) => [-16, 11, -8, 14][i % 4],
          opacity: 0,
          duration: 1.05,
          ease: "back.out(1.4)",
          stagger: 0.1,
        })
        shopTl.from(qa(".ht-prod .ht-tp-in"), { scale: 1.8, opacity: 0, duration: 0.26, ease: "power4.in", stagger: 0.05 }, 0.7)

        // footer: letters bounce in, duct tape crosses them out
        const word = q(".ht-word")
        const footTl = gsap.timeline({ scrollTrigger: { trigger: word, start: "top 85%", toggleActions: "play none none reverse" } })
        footTl
          .from(qa(".ht-word-l"), { yPercent: 70, scaleY: 0.3, opacity: 0, duration: 0.8, ease: "back.out(2)", stagger: 0.07 })
          .from(qa(".ht-word .ht-tp-in"), { scale: 2, opacity: 0, duration: 0.25, ease: "power4.in", stagger: 0.06 }, 0.55)

        const ro = new ResizeObserver(() => ScrollTrigger.refresh())
        ro.observe(root)
        return () => ro.disconnect()
      })
    }, root)
    ctxRef.current = ctx
    return () => {
      alive = false
      ctx.revert()
      ctxRef.current = null
      for (const fn of cleanups) fn()
    }
  }, [preloader, items.length])

  return (
    <div ref={rootRef} className={"ht-root" + (className ? " " + className : "")} style={v({ "--h": height })}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{CSS}</style>

      {preloader && (
        <div className="ht-pre" aria-hidden="true">
          <div className="ht-pre-label">
            <span className="ht-pre-word">Unrolling</span>
            <span className="ht-pre-num">0%</span>
          </div>
          {["#ffd51f", "#56c6ff", "#2a5cff", "#1f9e3c", "#c9f227"].map((c) => (
            <i key={c} className="ht-pre-band" style={{ background: c }} />
          ))}
        </div>
      )}

      <header className="ht-nav">
        <div className="ht-nav-in">
          <button type="button" className="ht-nav-brand" onClick={go("top")} aria-label={brand + " Tape Co., back to top"}>
            <HuggoBadge brand={brand} />
          </button>
          <nav className="ht-nav-links" aria-label="Sections">
            <button type="button" onClick={go("stories")}>
              Stories
            </button>
            <button type="button" onClick={go("tricks")}>
              Tricks
            </button>
            <button type="button" onClick={go("shop")}>
              Shop
            </button>
          </nav>
          <button type="button" className="ht-bag" onClick={go("shop")}>
            Bag <span className="ht-bag-n">{bag}</span>
            <span className="ht-sr" aria-live="polite">
              {bag ? bag + (bag === 1 ? " roll" : " rolls") + " in your bag" : ""}
            </span>
          </button>
        </div>
      </header>

      <div className="ht-run">
        <section className="ht-hero" data-sec="top">
          <svg className="ht-hill" viewBox="0 0 1600 300" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 150 Q800 -10 1600 150 L1600 300 L0 300Z" fill="#26ad46" />
            <path d="M0 176 Q800 16 1600 176 L1600 300 L0 300Z" fill="#1f9e3c" />
          </svg>
          <div className="ht-hero-copy">
            <p className="ht-kicker">
              <span className="ht-kw">We&rsquo;re</span>
              <HuggoBadge brand={brand} />
              <span className="ht-kw">here to</span>
            </p>
            <h1 className="ht-h1" aria-label={headline.join(" ")}>
              {headline.map((line, li) => (
                <span key={li} className="ht-h1-line" aria-hidden="true">
                  {Array.from(line).map((ch, i) =>
                    ch === " " ? (
                      <span key={i} className="ht-sp" />
                    ) : (
                      <span key={i} className="ht-l">
                        {ch}
                      </span>
                    ),
                  )}
                </span>
              ))}
            </h1>
          </div>
          <p className="ht-hero-note">
            <b>New</b> Clear Grip 48&nbsp;mm
          </p>
          <p className="ht-cue">
            Scroll, it rolls <span aria-hidden="true">&darr;</span>
          </p>
        </section>

        <section className="ht-collage" data-sec="stories" aria-label="Our story">
          <div className="ht-board">
            <div className="ht-item ht-i-head" style={v({ "--r": "-3deg" })}>
              <div className="ht-in" data-drop>
                <p className="ht-label">02 &mdash; The junk drawer</p>
                <h2 className="ht-collage-h">
                  For the
                  <br />
                  messy bits
                </h2>
              </div>
            </div>

            <div className="ht-item ht-i-card" style={v({ "--r": "2.5deg" })}>
              <div className="ht-in" data-drop>
                <article className="ht-card ht-paper">
                  <p className="ht-card-k">Our story &middot; est. 2019</p>
                  <p className="ht-card-t">{story}</p>
                  <p className="ht-card-sign">&mdash; the {brand.toLowerCase()} crew</p>
                </article>
                <Tape kind="masking" x="88%" y="2%" w="30%" r={38} />
                <Tape kind="masking" x="86%" y="98%" w="26%" r={-30} />
              </div>
            </div>

            <div className="ht-item ht-i-note" style={v({ "--r": "-7deg" })}>
              <div className="ht-in" data-drop>
                <div className="ht-note">
                  <p className="ht-note-h">to-do list</p>
                  <ul>
                    {todo.map((t, i) => (
                      <li key={i} className={i === 2 ? "ht-done" : undefined}>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <Tape kind="clear" x="50%" y="1%" w="56%" r={-4} />
              </div>
            </div>

            <div className="ht-item ht-i-lemon" style={v({ "--r": "-11deg" })}>
              <div className="ht-in" data-drop>
                <div className="ht-lemon ht-paper">
                  <LemonPrint uid={uid} />
                </div>
                <Tape kind="masking" x="34%" y="2%" w="44%" r={-14} />
                <Tape kind="clear" x="90%" y="94%" w="34%" r={48} />
              </div>
            </div>

            <div className="ht-item ht-i-gift" style={v({ "--r": "7deg" })}>
              <div className="ht-in" data-drop>
                <div className="ht-gift">
                  <div className="ht-gift-rib ht-gift-rib-v" />
                  <div className="ht-gift-rib ht-gift-rib-h" />
                  <GiftBow uid={uid} />
                  <div className="ht-gift-tag">
                    for Mo
                    <br />
                    <small>don&rsquo;t peek</small>
                  </div>
                </div>
                <Tape kind="clear" x="8%" y="64%" w="30%" r={70} />
              </div>
            </div>

            <div className="ht-item ht-i-ticket" style={v({ "--r": "9deg" })}>
              <div className="ht-in" data-drop>
                <div className="ht-ticket ht-paper">
                  <span className="ht-ticket-k">Moving day</span>
                  <span className="ht-ticket-big">Sat 9:00</span>
                  <span className="ht-ticket-s">14 boxes &middot; 2 rolls &middot; 1 cat</span>
                </div>
                <Tape kind="print" x="50%" y="0%" w="64%" r={-3} />
              </div>
            </div>

            <div className="ht-item ht-i-seal" style={v({ "--r": "12deg" })}>
              <div className="ht-in" data-drop>
                <div className="ht-seal">
                  <span>Holds</span>
                  <b>9 kg</b>
                  <span>per strip*</span>
                </div>
              </div>
            </div>
          </div>
          <p className="ht-fine">*On a clean cardboard box, at room temperature, according to our very serious kitchen tests.</p>
        </section>

        <div className="ht-tape" aria-hidden="true">
          <div className="ht-strip">
            <div className="ht-strip-print">{(brand + " CLEAR GRIP ✦ ").repeat(30)}</div>
          </div>
          <Roll3D kind="clear" brand={brand} />
        </div>
      </div>

      <div className="ht-banner" aria-hidden="true">
        <svg className="ht-bn-svg" preserveAspectRatio="none">
          <defs>
            <clipPath id={uid + "bc"}>
              <rect className="ht-bn-cliprect" x="-240" y="-400" width="0" height="2000" />
            </clipPath>
          </defs>
          <path className="ht-bn-fill" fill="#ff7a1a" />
          <g clipPath={"url(#" + uid + "bc)"}>
            <path className="ht-bn-line" data-w="1.06" fill="none" stroke="rgba(10,60,20,.28)" transform="translate(0 7)" />
            <path className="ht-bn-line" data-w="1" fill="none" stroke="#c9f227" />
            <path className="ht-bn-line" data-w="0.9" fill="none" stroke="#d6fa4a" />
            <g className="ht-bn-sheen">
              <path className="ht-bn-line" data-w="0.2" fill="none" stroke="rgba(255,255,255,.35)" />
            </g>
          </g>
        </svg>
        <div className="ht-bn-glyphs">
          {items.map((ch, i) =>
            ch === "@" ? (
              <span key={i} className="ht-mq-i ht-mq-logo">
                <HuggoBadge brand={brand} />
              </span>
            ) : (
              <span key={i} className="ht-mq-i">
                {ch}
              </span>
            ),
          )}
        </div>
        <div className="ht-bn-roll">
          <RollFace kind="print" brand={brand} />
        </div>
      </div>
      <p className="ht-sr">{marquee.join(". ")}</p>

      <section className="ht-mask" data-sec="tricks" aria-label="Masking tape trick">
        <div className="ht-mask-stage">
          <svg className="ht-mask-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <mask id={uid + "mm"} maskUnits="userSpaceOnUse" x="-400" y="-400" width="2400" height="1800">
                <rect x="-400" y="-400" width="2400" height="1800" fill="#fff" />
                {MK_STRIPS.map((s, i) => (
                  <rect key={i} x={-MK_L / 2} y={-MK_W / 2} width={MK_L} height={MK_W} fill="#000" transform={"translate(" + s.cx + " " + s.cy + ") rotate(" + s.a + ")"} />
                ))}
              </mask>
              <clipPath id={uid + "mc"}>
                <rect className="ht-mk-cliprect" x="-200" y="-400" width="0" height="1800" />
              </clipPath>
              <pattern id={uid + "pt"} width="420" height="26" patternUnits="userSpaceOnUse">
                <rect width="420" height="26" fill="#ff5fa8" />
                <rect y="3" width="420" height="2" fill="#ff7cba" />
                <rect y="11" width="300" height="1.5" fill="#f2489a" />
                <rect x="120" y="18" width="300" height="3" fill="#ff74b5" />
              </pattern>
              <pattern id={uid + "mt"} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-62)">
                <rect width="10" height="10" fill="#ecdba9" />
                <rect width="10" height="1.2" fill="#d9c387" />
                <rect y="5" width="10" height="0.8" fill="#f6e9c3" />
              </pattern>
              <linearGradient id={uid + "me"} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#a8884a" stopOpacity="0.35" />
                <stop offset="0.07" stopColor="#fff" stopOpacity="0.25" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.93" stopColor="#000" stopOpacity="0.04" />
                <stop offset="1" stopColor="#7d5d22" stopOpacity="0.38" />
              </linearGradient>
              <linearGradient id={uid + "mcu"} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#bba061" />
                <stop offset="0.35" stopColor="#f7ebc4" />
                <stop offset="0.7" stopColor="#d9c183" />
                <stop offset="1" stopColor="#8f7339" />
              </linearGradient>
              <linearGradient id={uid + "rl"} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#d93684" />
                <stop offset="0.3" stopColor="#ff7fbe" />
                <stop offset="0.55" stopColor="#ff5fa8" />
                <stop offset="1" stopColor="#c42a73" />
              </linearGradient>
            </defs>
            <g mask={"url(#" + uid + "mm)"}>
              <g clipPath={"url(#" + uid + "mc)"}>
                <rect x="-400" y="-400" width="2400" height="1800" fill={"url(#" + uid + "pt)"} />
              </g>
            </g>
            <g className="ht-mk-roller" opacity="0">
              <rect x="-150" y="-400" width="150" height="1800" fill="#ff5fa8" opacity="0.5" />
              <rect x="-38" y="-400" width="76" height="1800" rx="38" fill={"url(#" + uid + "rl)"} />
              <rect x="-38" y="-400" width="76" height="1800" fill="none" stroke="#b81f68" strokeWidth="2" strokeDasharray="3 9" opacity="0.5" />
            </g>
            {MK_STRIPS.map((s, i) => (
              <g key={i} transform={"translate(" + s.cx + " " + s.cy + ") rotate(" + s.a + ")"}>
                <g className="ht-mk-body" filter="drop-shadow(0 3px 2px rgba(80,30,0,.28))">
                  <rect y={-MK_W / 2} height={MK_W} width="0" fill={"url(#" + uid + "mt)"} />
                  <rect y={-MK_W / 2} height={MK_W} width="0" fill={"url(#" + uid + "me)"} />
                </g>
                <g className="ht-mk-curl" opacity="0">
                  <rect x="4" y={-MK_W / 2 - 4} width="34" height={MK_W + 8} rx="10" fill="rgba(70,25,0,.25)" />
                  <rect x="-18" y={-MK_W / 2 - 8} width="34" height={MK_W + 16} rx="17" fill={"url(#" + uid + "mcu)"} />
                </g>
                <g className="ht-mk-lead" opacity="0">
                  <circle r="80" cy="6" fill="rgba(70,25,0,.25)" />
                  <circle r="78" fill="#e8d39c" />
                  <circle r="78" fill="none" stroke="#c9ad6a" strokeWidth="14" strokeDasharray="1 3" opacity="0.5" />
                  <circle r="50" fill="#b98647" />
                  <circle r="42" fill="#ff7a1a" />
                  <text y="5" textAnchor="middle" className="ht-mk-lead-t" fill="#fffdf4" fontSize="17">
                    {brand}
                  </text>
                  <ellipse cx="-34" cy="-46" rx="20" ry="8" fill="#fff" opacity="0.35" transform="rotate(-36 -34 -46)" />
                </g>
              </g>
            ))}
          </svg>

          <h2 className="ht-mask-h" aria-label={maskHeadline.join(" ")}>
            {maskHeadline.map((l, i) => (
              <span key={i} className="ht-ml-wrap" aria-hidden="true">
                <span className="ht-ml">{l}</span>
              </span>
            ))}
          </h2>

          <div className="ht-mask-roll" aria-hidden="true">
            <RollFace kind="masking" brand={brand} />
          </div>

          <div className="ht-mask-copy">
            <p className="ht-label">03 &mdash; Tape trick: mask, paint, peel</p>
            <p>
              {brand.charAt(0) + brand.slice(1).toLowerCase()} Clean Line grips the wall while you go wild, then peels off in one piece. No fuzz, no
              ghosts, no repainting the skirting board.
            </p>
            <button type="button" className="ht-btn" onClick={go("shop")}>
              Shop masking
            </button>
          </div>

          <div className="ht-mask-stamp" aria-hidden="true">
            Peeled
            <br />
            clean
          </div>

          <Daisy petals={8} color="#ffd51f" center="#ff7a1a" className="ht-d1" />
          <Daisy petals={6} color="#56c6ff" center="#ffd51f" className="ht-d2" />
          <Daisy petals={10} color="#ff6fb0" center="#fffdf4" className="ht-d3" />
          <Daisy petals={6} color="#c9f227" center="#ff6fb0" className="ht-d4" />
          <Daisy petals={8} color="#fffdf4" center="#ffd51f" className="ht-d5" />
        </div>
      </section>

      <section className="ht-shop ht-grainy" data-sec="shop" aria-label="Shop">
        <div className="ht-join ht-join-masking" aria-hidden="true">
          <i className="ht-join-in" />
        </div>
        <div className="ht-shop-head">
          <p className="ht-label">04 &mdash; The roll call</p>
          <h2 className="ht-shop-h">
            Pick your
            <br />
            grip
          </h2>
          <p className="ht-shop-sub">Four rolls, four tricks. Every one is recyclable, tears by hand, and sticks to what you meant it to.</p>
        </div>
        <div className="ht-shop-grid">
          {products.map((p, i) => (
            <article key={p.name} className="ht-prod">
              <Tape kind="washi" x="18%" y="0%" w="36%" r={-28} />
              <Tape kind="washi" x="84%" y="1%" w="30%" r={22} />
              <div className="ht-prod-roll">
                <Roll3D kind={p.kind} brand={brand} />
              </div>
              <h3 className="ht-prod-name">{p.name}</h3>
              <p className="ht-prod-line">{p.line}</p>
              <div className="ht-prod-foot">
                <span className="ht-prod-price">{p.price}</span>
                <button type="button" className="ht-btn ht-btn-sm" onClick={add(i)}>
                  {added === i ? "Added!" : "Add to bag"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="ht-foot ht-grainy">
        <div className="ht-join ht-join-duct" aria-hidden="true">
          <i className="ht-join-in" />
        </div>
        <div className="ht-foot-top">
          <div>
            <p className="ht-label">05 &mdash; Stick around</p>
            <p className="ht-foot-h">New rolls, odd tricks, zero spam.</p>
          </div>
          <form
            className="ht-form"
            onSubmit={(e) => {
              e.preventDefault()
              setJoined(true)
            }}
          >
            <label className="ht-sr" htmlFor={uid + "em"}>
              Email address
            </label>
            <input id={uid + "em"} type="email" required placeholder="you@example.com" className="ht-input" />
            <button type="submit" className="ht-btn">
              Stick me in
            </button>
            <p className="ht-form-msg" aria-live="polite">
              {joined ? "You're stuck with us now." : ""}
            </p>
          </form>
        </div>
        <div className="ht-word" aria-label={brand}>
          {Array.from(brand).map((ch, i) => (
            <span key={i} className="ht-word-l" aria-hidden="true">
              {ch}
              <Tape kind="duct" x="50%" y="46%" w="72%" r={i % 2 ? 34 : -36} />
            </span>
          ))}
        </div>
        <div className="ht-foot-bar">
          <span>&copy; 2026 {brand.charAt(0) + brand.slice(1).toLowerCase()} Tape Co.</span>
          <span>Made to hold things together.</span>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.ht-root{--ht-lime:#c9f227;--ht-lime2:#dcff5c;--ht-grass:#1f9e3c;--ht-ink:#0d4f20;--ht-brown:#7c3510;--ht-cocoa:#3b1d0a;--ht-peach:#ffc6a0;--ht-orange:#ff7a1a;--ht-pink:#ff6fb0;--ht-blush:#ff9ccb;--ht-yellow:#ffd51f;--ht-paper:#fffaf0;--ht-display:"Bricolage Grotesque","Arial Narrow",system-ui,sans-serif;--ht-cond:"Anton","Impact","Arial Narrow",sans-serif;--ht-hand:"Caveat","Segoe Print","Comic Sans MS",cursive;--ht-noise:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>");position:relative;isolation:isolate;width:100%;container:ht/inline-size;overflow-x:clip;background:var(--ht-lime);color:var(--ht-ink);font-family:var(--ht-display);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.ht-root :where(button){font:inherit;color:inherit;cursor:pointer}
.ht-root :where(p,h1,h2,h3,ul){margin:0}
.ht-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ht-badge{display:block;width:100%;height:auto;max-width:none;overflow:visible}
.ht-badge-word{font-family:var(--ht-display);font-weight:800;font-stretch:75%;letter-spacing:.5px}
.ht-badge-sub{font-family:var(--ht-display);font-weight:700}
.ht-label{font-family:var(--ht-display);font-weight:700;font-stretch:90%;font-size:clamp(11px,1cqw,14px);letter-spacing:.14em;text-transform:uppercase}
.ht-grainy{position:relative}
.ht-grainy::before,.ht-paper::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:var(--ht-noise);opacity:.14;mix-blend-mode:multiply;border-radius:inherit}
.ht-btn{display:inline-flex;align-items:center;gap:.4em;border:2.5px solid var(--ht-cocoa);background:var(--ht-yellow);color:var(--ht-cocoa);border-radius:999px;padding:.75em 1.4em;font-weight:800;font-stretch:85%;text-transform:uppercase;letter-spacing:.05em;font-size:14px;box-shadow:0 4px 0 var(--ht-cocoa);transition:transform .15s,box-shadow .15s}
.ht-btn:hover{transform:translateY(-2px);box-shadow:0 6px 0 var(--ht-cocoa)}
.ht-btn:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ht-cocoa)}
.ht-btn:focus-visible,.ht-nav-in button:focus-visible,.ht-input:focus-visible{outline:3px solid var(--ht-cocoa);outline-offset:3px}
.ht-btn-sm{font-size:12px;padding:.65em 1.1em}

.ht-pre{position:absolute;left:0;right:0;top:0;height:max(var(--h),600px);z-index:40;overflow:hidden;background:var(--ht-orange);pointer-events:none;visibility:hidden}
.ht-pre-band{position:absolute;left:-35%;width:170%;top:0;height:165%;border-radius:50% 50% 0 0/22% 22% 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.08)}
.ht-pre-label{position:absolute;left:0;right:0;top:44%;display:flex;flex-direction:column;align-items:center;color:var(--ht-cocoa);z-index:1}
.ht-pre-word{font-weight:800;font-stretch:75%;text-transform:uppercase;font-size:clamp(28px,4cqw,56px);line-height:1}
.ht-pre-num{font-weight:700;font-size:14px;letter-spacing:.2em;margin-top:8px}

.ht-nav{position:sticky;top:0;z-index:30;height:0}
.ht-nav-in{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px clamp(14px,3cqw,40px)}
.ht-nav-brand{display:block;width:clamp(48px,4.6cqw,66px);padding:0;border:0;background:none;filter:drop-shadow(0 4px 0 rgba(13,79,32,.3));transition:transform .3s}
.ht-nav-brand:hover{transform:rotate(-12deg) scale(1.06)}
.ht-nav-links{display:flex;gap:4px;background:var(--ht-paper);border:2.5px solid var(--ht-ink);border-radius:999px;padding:4px;box-shadow:0 4px 0 var(--ht-ink)}
.ht-nav-links button{border:0;background:transparent;color:var(--ht-ink);padding:8px 16px;border-radius:999px;font-weight:800;font-stretch:85%;text-transform:uppercase;letter-spacing:.05em;font-size:13px;transition:background .2s}
.ht-nav-links button:hover{background:var(--ht-lime)}
.ht-bag{display:inline-flex;align-items:center;gap:8px;border:2.5px solid var(--ht-ink);background:var(--ht-pink);color:var(--ht-ink);border-radius:999px;padding:8px 10px 8px 16px;font-weight:800;font-stretch:85%;text-transform:uppercase;letter-spacing:.05em;font-size:13px;box-shadow:0 4px 0 var(--ht-ink)}
.ht-bag-n{display:grid;place-items:center;min-width:24px;height:24px;border-radius:99px;background:var(--ht-ink);color:var(--ht-lime);font-size:12px}

.ht-run{position:relative}
.ht-hero{position:relative;height:var(--h);min-height:600px;overflow:hidden;background:radial-gradient(120% 85% at 50% 38%,var(--ht-lime2),var(--ht-lime) 52%,#b6e11a)}
.ht-hill{position:absolute;left:0;bottom:-1px;width:100%;height:23%;max-width:none}
.ht-hero-copy{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;padding-top:max(96px,calc(var(--h) * .12))}
.ht-kicker{display:flex;align-items:center;gap:.6em;font-weight:800;font-stretch:80%;font-size:clamp(14px,1.55cqw,24px);letter-spacing:.06em;text-transform:uppercase;margin-bottom:.1em}
.ht-kicker .ht-badge{width:clamp(64px,7cqw,112px);transform:rotate(-8deg);filter:drop-shadow(0 5px 0 rgba(13,79,32,.25))}
.ht-kw{display:inline-block}
.ht-h1{display:flex;flex-direction:column;align-items:center;font-weight:800;font-stretch:75%;font-variation-settings:"opsz" 96;text-transform:uppercase;font-size:clamp(70px,20.5cqw,300px);line-height:.8;letter-spacing:-.015em;color:var(--ht-ink);text-shadow:0 .035em 0 #08391a}
.ht-h1-line{display:flex;white-space:nowrap}
.ht-l{display:inline-block;transform-origin:50% 100%;will-change:transform}
.ht-sp{display:inline-block;width:.18em}
.ht-hero-note{position:absolute;z-index:3;left:clamp(14px,4cqw,64px);bottom:calc(var(--h) * .09);display:grid;place-items:center;width:clamp(84px,8.5cqw,124px);aspect-ratio:1;border-radius:50%;background:var(--ht-pink);color:var(--ht-ink);text-align:center;font-weight:800;font-stretch:80%;text-transform:uppercase;font-size:clamp(11px,1.05cqw,15px);line-height:1.05;padding:10px;rotate:-12deg;box-shadow:0 0 0 4px var(--ht-paper),0 8px 14px rgba(0,50,10,.3)}
.ht-hero-note b{display:block;font-size:1.9em;color:var(--ht-paper);text-shadow:0 2px 0 var(--ht-ink)}
.ht-cue{position:absolute;z-index:3;right:clamp(14px,4cqw,64px);bottom:calc(var(--h) * .07);color:var(--ht-paper);font-weight:800;font-stretch:85%;text-transform:uppercase;letter-spacing:.08em;font-size:13px}

.ht-collage{position:relative;background:radial-gradient(90% 60% at 50% 30%,#27b048,transparent 70%),radial-gradient(70% 50% at 20% 85%,#22a542,transparent 70%),var(--ht-grass);padding:clamp(30px,4cqw,70px) 0 clamp(150px,19cqw,280px)}
.ht-collage::before{content:"";position:absolute;inset:0;pointer-events:none;background:var(--ht-noise);opacity:.12;mix-blend-mode:multiply}
.ht-board{position:relative;width:min(1300px,94%);margin:0 auto;height:clamp(1080px,100cqw,1380px)}
.ht-item{position:absolute;z-index:2;transform:rotate(var(--r))}
.ht-in{position:relative}
.ht-i-head{left:2%;top:1%;width:40%;color:var(--ht-lime)}
.ht-i-head .ht-label{color:var(--ht-paper);margin-bottom:.8em}
.ht-collage-h{font-weight:800;font-stretch:75%;font-variation-settings:"opsz" 96;text-transform:uppercase;font-size:clamp(54px,8.4cqw,128px);line-height:.82;text-shadow:0 .04em 0 #0b5a22}
.ht-i-card{left:47%;top:5%;width:45%}
.ht-i-note{left:7%;top:28%;width:24%}
.ht-i-lemon{left:3%;top:55%;width:30%}
.ht-i-gift{left:57%;top:56%;width:31%}
.ht-i-ticket{left:31%;top:79%;width:19%}
.ht-i-seal{left:88%;top:1%;width:11%}
.ht-fine{position:relative;z-index:2;width:min(1300px,94%);margin:24px auto 0;color:rgba(255,250,240,.75);font-size:12px;font-weight:500;font-stretch:90%}

.ht-paper{position:relative}
.ht-card{background:linear-gradient(160deg,#ffd2b3,var(--ht-peach) 40%,#f6b48b);color:var(--ht-brown);padding:clamp(22px,3cqw,46px) clamp(22px,3cqw,48px) clamp(24px,3cqw,44px);box-shadow:0 1px 1px rgba(0,0,0,.1),0 22px 34px -12px rgba(0,40,10,.5),inset 0 0 40px rgba(170,80,20,.12)}
.ht-card-k{font-family:var(--ht-display);font-weight:700;font-stretch:90%;text-transform:uppercase;letter-spacing:.14em;font-size:12px;opacity:.75;margin-bottom:1em}
.ht-card-t{font-family:var(--ht-cond);text-transform:uppercase;font-size:clamp(26px,3.65cqw,56px);line-height:1.02;letter-spacing:.005em}
.ht-card-sign{font-family:var(--ht-hand);font-weight:700;font-size:clamp(22px,2.2cqw,32px);margin-top:.6em;rotate:-3deg}

.ht-note{position:relative;background:linear-gradient(175deg,#fff27a,#ffe345 30%,#fbd52a);padding:clamp(20px,2.4cqw,34px) clamp(18px,2cqw,30px) clamp(26px,3cqw,40px);color:#3a3110;font-family:var(--ht-hand);box-shadow:0 2px 2px rgba(0,0,0,.08),0 18px 26px -10px rgba(0,40,10,.55)}
.ht-note::after{content:"";position:absolute;right:0;bottom:0;width:28%;height:16%;background:linear-gradient(135deg,transparent 48%,rgba(0,0,0,.12) 50%,#f6cc1d 52%,#fff07a 100%);border-top-left-radius:60% 30%}
.ht-note-h{font-weight:700;font-size:clamp(28px,2.6cqw,40px);line-height:1;margin-bottom:.35em;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:5px}
.ht-note ul{list-style:none;padding:0;font-size:clamp(20px,1.7cqw,26px);line-height:1.25;font-weight:600}
.ht-note li{position:relative;padding-left:1.15em}
.ht-note li::before{content:"";position:absolute;left:0;top:.32em;width:.62em;height:.62em;border:2px solid #3a3110;border-radius:3px;rotate:-6deg}
.ht-note li.ht-done{text-decoration:line-through;text-decoration-thickness:2px;opacity:.65}
.ht-note li.ht-done::after{content:"";position:absolute;left:.12em;top:.12em;width:.32em;height:.62em;border:solid #d5266e;border-width:0 3px 3px 0;rotate:40deg}

.ht-lemon{aspect-ratio:300/380;background:#fffcf2;box-shadow:0 2px 2px rgba(0,0,0,.08),0 22px 30px -12px rgba(0,40,10,.55);overflow:hidden}
.ht-lemon-svg{display:block;width:100%;height:100%;max-width:none}

.ht-gift{position:relative;aspect-ratio:1/.86;border-radius:6px;background:repeating-linear-gradient(90deg,#ff3d8f 0 20px,#ff86c0 20px 34px,#ffe1ef 34px 38px,#ff86c0 38px 52px);box-shadow:inset 0 0 0 1px rgba(150,0,60,.2),inset -14px -18px 30px rgba(120,0,50,.25),inset 10px 12px 24px rgba(255,255,255,.25),0 30px 40px -14px rgba(0,40,10,.6),0 6px 0 #d42a72}
.ht-gift::before{content:"";position:absolute;right:0;top:0;bottom:0;width:38%;border-radius:0 6px 6px 0;background:radial-gradient(circle,#fff 0 2.2px,transparent 2.6px) 0 0/14px 14px,#ff5aa2;box-shadow:inset 0 0 0 1px rgba(150,0,60,.2),inset -12px -14px 26px rgba(120,0,50,.25)}
.ht-gift-rib{position:absolute;background:linear-gradient(90deg,#e7dfea,#fff 30%,#f4eef6 60%,#d8cde0);box-shadow:0 0 6px rgba(120,0,50,.25)}
.ht-gift-rib-v{left:57%;top:0;bottom:0;width:9%}
.ht-gift-rib-h{top:46%;left:0;right:0;height:10%;background:linear-gradient(180deg,#e7dfea,#fff 30%,#f4eef6 60%,#d8cde0)}
.ht-gift-bow{position:absolute;left:61.5%;top:51%;width:62%;height:auto;max-width:none;transform:translate(-50%,-50%)}
.ht-gift-tag{position:absolute;left:8%;top:9%;padding:8px 14px 10px;background:var(--ht-paper);color:var(--ht-brown);font-family:var(--ht-hand);font-weight:700;font-size:clamp(18px,1.6cqw,24px);line-height:.95;rotate:-9deg;border-radius:4px 14px 14px 4px;box-shadow:0 8px 12px -4px rgba(100,0,40,.4)}
.ht-gift-tag small{font-size:.65em;font-weight:500}

.ht-ticket{display:flex;flex-direction:column;gap:2px;padding:20px 18px 18px;background:linear-gradient(170deg,#e6bf86,#cf9f62);color:var(--ht-cocoa);border-radius:4px;box-shadow:0 18px 24px -10px rgba(0,40,10,.55);clip-path:polygon(0 0,100% 0,100% 40%,95% 50%,100% 60%,100% 100%,0 100%,0 60%,5% 50%,0 40%)}
.ht-ticket-k{font-weight:700;font-stretch:90%;text-transform:uppercase;letter-spacing:.16em;font-size:11px}
.ht-ticket-big{font-family:var(--ht-cond);font-size:clamp(30px,3cqw,46px);line-height:1;text-transform:uppercase}
.ht-ticket-s{font-family:var(--ht-hand);font-weight:700;font-size:19px}

.ht-seal{display:grid;place-items:center;align-content:center;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff9bc9,var(--ht-pink) 60%);color:var(--ht-paper);text-align:center;font-weight:800;font-stretch:80%;text-transform:uppercase;line-height:1;font-size:clamp(10px,.95cqw,14px);box-shadow:0 0 0 5px var(--ht-paper),0 14px 18px -6px rgba(0,40,10,.5)}
.ht-seal b{font-family:var(--ht-cond);font-size:2.6em;font-weight:400;color:var(--ht-ink)}

.ht-tp{position:absolute;z-index:3;height:clamp(24px,2.3cqw,36px);transform:translate(-50%,-50%) rotate(var(--r)) translateY(var(--lift,0px));transition:transform .3s;pointer-events:none}
.ht-in:hover .ht-tp{--lift:-2px}
.ht-tp-in{position:absolute;inset:0;display:block;clip-path:polygon(0 4%,3% 22%,0 40%,4% 58%,1% 78%,3% 100%,97% 96%,100% 78%,96% 60%,100% 42%,97% 22%,100% 0)}
.ht-tp-clear .ht-tp-in{background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.18) 18%,rgba(255,255,255,.08) 55%,rgba(255,255,255,.32)),rgba(240,250,220,.28);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)}
.ht-tp-masking .ht-tp-in{background:repeating-linear-gradient(118deg,rgba(150,115,50,.12) 0 1px,transparent 1px 4px),linear-gradient(180deg,#efe0b5,#e5d29d 50%,#dcc68c);opacity:.94}
.ht-tp-print .ht-tp-in{background:repeating-linear-gradient(90deg,transparent 0 14px,rgba(13,79,32,.55) 14px 17px,transparent 17px 24px),linear-gradient(180deg,#d9ff52,var(--ht-lime));opacity:.92}
.ht-tp-washi .ht-tp-in{background:radial-gradient(circle,rgba(255,255,255,.9) 0 2px,transparent 2.6px) 0 0/11px 11px,repeating-linear-gradient(90deg,#ffd51f 0 10px,#ffc22a 10px 20px);opacity:.9}
.ht-tp-duct .ht-tp-in{background:repeating-linear-gradient(45deg,rgba(255,255,255,.18) 0 1px,transparent 1px 4px),repeating-linear-gradient(-45deg,rgba(0,0,0,.08) 0 1px,transparent 1px 4px),linear-gradient(180deg,#d5dade,#c3c9ce 50%,#b4bbc1);box-shadow:0 3px 5px rgba(60,20,0,.3)}

.ht-tape{position:absolute;inset:0;z-index:4;pointer-events:none}
.ht-strip{position:absolute;left:50%;top:0;width:calc(clamp(124px,16.5cqw,250px) * .5);height:0;transform:translateX(-50%);overflow:hidden;clip-path:polygon(0 9px,8% 0,17% 8px,25% 1px,34% 10px,42% 2px,50% 8px,59% 0,67% 9px,76% 1px,84% 10px,92% 2px,100% 8px,100% 100%,0 100%);background:linear-gradient(90deg,rgba(255,255,255,.62),rgba(255,255,255,.16) 9%,rgba(255,255,255,.05) 45%,rgba(255,255,255,.14) 88%,rgba(255,255,255,.6)),rgba(236,248,214,.26);box-shadow:0 0 0 1px rgba(255,255,255,.18),0 8px 16px rgba(0,40,10,.14)}
.ht-strip::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 3px 5px,rgba(255,255,255,.55),transparent) 30% 0/46px 140px,radial-gradient(ellipse 2px 4px,rgba(255,255,255,.4),transparent) 70% 60px/38px 210px;opacity:.7}
.ht-strip-print{position:absolute;left:50%;top:14px;writing-mode:vertical-rl;transform:translateX(-50%) rotate(180deg);white-space:nowrap;font-weight:800;font-stretch:75%;text-transform:uppercase;font-size:calc(clamp(124px,16.5cqw,250px) * .17);letter-spacing:.06em;color:rgba(13,79,32,.32)}

.ht-roll{--d:clamp(124px,16.5cqw,250px);--w:calc(var(--d) * .5);position:absolute;left:50%;top:0;width:var(--d);height:var(--d);margin:calc(var(--d) / -2) 0 0 calc(var(--d) / -2);perspective:1100px;z-index:5;will-change:transform}
.ht-roll-shadow{position:absolute;left:8%;right:8%;bottom:-8%;height:26%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,40,10,.45),transparent);filter:blur(4px)}
.ht-roll-body{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateY(var(--tilt,-40deg)) rotateX(var(--spin,0deg))}
.ht-roll-facet{position:absolute;left:calc(50% - var(--w) / 2);top:calc(50% - var(--d) * .051);width:var(--w);height:calc(var(--d) * .102);--a:calc(var(--i) * 11.25deg + var(--spin,0deg));--s:calc(.05 + .4 * (1 - max(0,cos(var(--a)))));--g:calc(max(0,cos(var(--a) + 32deg) - .86) * 4.5);backface-visibility:hidden;transform:rotateX(calc(var(--i) * 11.25deg)) translateZ(calc(var(--d) / 2 - .5px));background:linear-gradient(rgba(255,255,255,var(--g,0)),rgba(255,255,255,var(--g,0))),linear-gradient(rgba(40,30,0,var(--s,.1)),rgba(40,30,0,var(--s,.1))),linear-gradient(90deg,var(--edge) 0 5%,var(--band) 14% 86%,var(--edge) 95%)}
.ht-roll-cap{position:absolute;inset:0;transform:rotateY(90deg) translateZ(calc(var(--w) / 2))}
.ht-roll-cap-b{transform:rotateY(-90deg) translateZ(calc(var(--w) / 2))}
.ht-roll-cap .ht-face{--d:100%;width:100%;height:100%}
.ht-k-clear{--band:#f3f0e1;--edge:#d7cfae}
.ht-k-print{--band:#c9f227;--edge:#9cc012}
.ht-k-masking{--band:#eadaa8;--edge:#c6ab6a}
.ht-k-washi{--band:#ffd02a;--edge:#e2a400}
.ht-k-duct{--band:#bcc3c9;--edge:#868e96}

.ht-face{--d:160px;position:relative;width:var(--d);height:var(--d);border-radius:50%;container-type:size;background:radial-gradient(circle,transparent 0 30%,var(--ring2) 30.5%,var(--ring1) 34%,var(--ring2) 62%,var(--ring1) 97%,var(--rim) 99%),repeating-radial-gradient(circle,var(--ring1) 0 1.2%,var(--ring2) 1.2% 2%);box-shadow:inset 0 0 0 2px rgba(255,255,255,.45),inset -8px -10px 18px rgba(0,0,0,.14)}
.ht-face-core{position:absolute;inset:27%;border-radius:50%;background:radial-gradient(circle,#b88446 0 70%,#a06f35 75%,#c9975a 84%,#946130 100%);box-shadow:inset 0 0 0 1px rgba(0,0,0,.2)}
.ht-face-label{position:absolute;inset:31%;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--lab);color:var(--labink);text-align:center;line-height:.9;box-shadow:inset 0 0 0 2px rgba(255,255,255,.55),inset 0 -3px 6px rgba(0,0,0,.18)}
.ht-face-brand{font-weight:800;font-stretch:75%;font-size:9.5cqw;letter-spacing:.02em}
.ht-face-kind{font-weight:700;font-stretch:85%;text-transform:uppercase;font-size:4.6cqw;letter-spacing:.12em;margin-top:2px;opacity:.85}
.ht-face-gloss{position:absolute;inset:0;border-radius:50%;background:radial-gradient(60% 34% at 32% 18%,rgba(255,255,255,.55),transparent 70%),radial-gradient(40% 20% at 70% 86%,rgba(255,255,255,.18),transparent);pointer-events:none}
.ht-face.ht-k-clear{--ring1:#f7f5ea;--ring2:#e9e3c9;--rim:#cfc39a;--lab:var(--ht-lime);--labink:var(--ht-ink)}
.ht-face.ht-k-print{--ring1:#d6fa4a;--ring2:#bfe623;--rim:#93b70f;--lab:var(--ht-ink);--labink:var(--ht-lime)}
.ht-face.ht-k-masking{--ring1:#efdfb1;--ring2:#e1cc92;--rim:#c2a868;--lab:var(--ht-orange);--labink:var(--ht-paper)}
.ht-face.ht-k-washi{--ring1:#ffd51f;--ring2:#ffbf1f;--rim:#e09d00;--lab:var(--ht-pink);--labink:var(--ht-paper)}
.ht-face.ht-k-duct{--ring1:#d4d9de;--ring2:#a9b1b8;--rim:#7d868e;--lab:var(--ht-cocoa);--labink:var(--ht-peach)}

.ht-banner{position:relative;z-index:6;height:clamp(170px,21cqw,320px);margin-top:calc(clamp(170px,21cqw,320px) * -.5);pointer-events:none}
.ht-bn-svg{position:absolute;inset:0;width:100%;height:100%;max-width:none;overflow:visible;filter:drop-shadow(0 10px 10px rgba(60,20,0,.25))}
.ht-bn-glyphs{position:absolute;inset:0}
.ht-mq-i{position:absolute;left:0;top:0;display:block;font-weight:800;font-stretch:75%;font-variation-settings:"opsz" 96;text-transform:uppercase;font-size:var(--fs,40px);line-height:1;white-space:pre;color:var(--ht-ink);will-change:transform}
.ht-mq-logo{width:1.05em;height:1em;padding:0 .02em}
.ht-mq-logo .ht-badge{width:1em;height:1em}
.ht-bn-roll{position:absolute;left:0;top:0;opacity:0;filter:drop-shadow(0 10px 8px rgba(40,20,0,.35))}
.ht-bn-roll .ht-face{--d:var(--d,120px)}

.ht-mask{position:relative;height:calc(max(var(--h),600px) * 2.7);background:var(--ht-orange)}
.ht-mask-stage{position:sticky;top:0;height:max(var(--h),600px);overflow:hidden}
.ht-mask-stage::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:var(--ht-noise);opacity:.12;mix-blend-mode:multiply}
.ht-mask-svg{position:absolute;inset:0;width:100%;height:100%;max-width:none}
.ht-mk-lead-t{font-family:var(--ht-display);font-weight:800;font-stretch:75%}
.ht-mask-h{position:absolute;z-index:3;left:clamp(16px,5cqw,80px);top:calc(max(var(--h),600px) * .13);display:flex;flex-direction:column;font-weight:800;font-stretch:75%;font-variation-settings:"opsz" 96;text-transform:uppercase;font-size:clamp(64px,13.5cqw,210px);line-height:.8;color:var(--ht-yellow);text-shadow:.03em .045em 0 var(--ht-cocoa)}
.ht-ml-wrap{display:block;overflow:hidden;padding:0 .06em .06em 0}
.ht-ml{display:block}
.ht-mask-roll{position:absolute;z-index:3;right:clamp(16px,7cqw,120px);top:calc(max(var(--h),600px) * .2);filter:drop-shadow(0 22px 22px rgba(80,20,0,.4))}
.ht-mask-roll .ht-face{--d:clamp(170px,26cqw,380px)}
.ht-mask-copy{position:absolute;z-index:3;left:clamp(16px,5cqw,80px);bottom:calc(max(var(--h),600px) * .08);width:min(420px,40cqw);padding:20px 22px 22px;background:var(--ht-paper);color:var(--ht-cocoa);border-radius:6px;font-size:15px;line-height:1.45;font-weight:500;font-stretch:95%;box-shadow:0 18px 30px -12px rgba(80,20,0,.55);rotate:-2deg}
.ht-mask-copy .ht-label{margin-bottom:.6em}
.ht-mask-copy .ht-btn{margin-top:14px}
.ht-mask-stamp{position:absolute;z-index:4;right:clamp(30px,12cqw,220px);bottom:calc(max(var(--h),600px) * .1);padding:.3em .6em .35em;border:5px solid var(--ht-ink);border-radius:12px;color:var(--ht-ink);background:rgba(201,242,39,.9);font-weight:800;font-stretch:75%;text-transform:uppercase;font-size:clamp(28px,3.4cqw,52px);line-height:.85;text-align:center;opacity:0}
.ht-daisy{position:absolute;z-index:2;width:clamp(56px,7cqw,110px);height:auto;max-width:none;filter:drop-shadow(0 8px 6px rgba(80,20,0,.35))}
.ht-d1{left:41%;top:7%}
.ht-d2{left:31%;top:62%;width:clamp(44px,5cqw,80px)}
.ht-d3{right:4%;top:6%}
.ht-d4{left:58%;bottom:6%;width:clamp(46px,5.5cqw,86px)}
.ht-d5{right:30%;top:64%;width:clamp(40px,4.5cqw,70px)}

.ht-join{position:absolute;left:-6%;width:112%;top:0;height:clamp(40px,4.4cqw,64px);transform:translateY(-50%) rotate(-1.6deg);z-index:7;pointer-events:none}
.ht-join-in{position:absolute;inset:0;display:block;transform-origin:0 50%}
.ht-join-masking .ht-join-in{background:repeating-linear-gradient(118deg,rgba(150,115,50,.14) 0 1px,transparent 1px 4px),linear-gradient(180deg,#f2e4bd,#e3cf98 50%,#d4bc80);box-shadow:0 6px 10px rgba(80,20,0,.3)}
.ht-join-duct{transform:translateY(-50%) rotate(1.4deg)}
.ht-join-duct .ht-join-in{background:repeating-linear-gradient(45deg,rgba(255,255,255,.18) 0 1px,transparent 1px 4px),repeating-linear-gradient(-45deg,rgba(0,0,0,.08) 0 1px,transparent 1px 4px),linear-gradient(180deg,#e7ebee,#b2b9c0 45%,#cdd2d7 70%,#8f979e);box-shadow:0 6px 10px rgba(60,20,0,.35)}

.ht-shop{background:var(--ht-blush);color:var(--ht-cocoa);padding:clamp(80px,9cqw,140px) clamp(16px,4cqw,64px) clamp(90px,10cqw,160px)}
.ht-shop-head{position:relative;display:grid;grid-template-columns:auto 1fr;align-items:end;gap:12px 48px;max-width:1300px;margin:0 auto clamp(40px,5cqw,80px)}
.ht-shop-head .ht-label{grid-column:1/-1}
.ht-shop-h{font-weight:800;font-stretch:75%;font-variation-settings:"opsz" 96;text-transform:uppercase;font-size:clamp(60px,10.5cqw,170px);line-height:.8;color:var(--ht-cocoa)}
.ht-shop-sub{max-width:360px;font-size:17px;line-height:1.4;font-weight:500;font-stretch:95%;padding-bottom:.6em}
.ht-shop-grid{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(18px,2.4cqw,36px);max-width:1300px;margin:0 auto}
.ht-prod{position:relative;display:flex;flex-direction:column;padding:clamp(22px,2.2cqw,32px) clamp(18px,1.8cqw,26px) 20px;background:var(--ht-paper);border-radius:8px;box-shadow:0 2px 2px rgba(0,0,0,.06),0 26px 34px -16px rgba(120,0,50,.45);transition:transform .35s cubic-bezier(.3,1.6,.5,1)}
.ht-prod:nth-child(odd){rotate:-1.5deg}
.ht-prod:nth-child(even){rotate:1.8deg;margin-top:30px}
.ht-prod:hover{transform:translateY(-8px) rotate(-1deg)}
.ht-prod .ht-tp{height:clamp(22px,2cqw,30px)}
.ht-prod-roll{position:relative;height:clamp(150px,15cqw,220px);margin:6px 0 14px}
.ht-prod-roll .ht-roll{--d:clamp(118px,12cqw,180px);top:50%}
.ht-prod-roll .ht-roll-body{--tilt:-58deg;--spin:-24deg;transition:transform 1.1s cubic-bezier(.25,1.2,.4,1)}
.ht-prod:hover .ht-roll-body{transform:rotateY(var(--tilt)) rotateX(calc(var(--spin) - 360deg))}
.ht-prod-name{font-weight:800;font-stretch:75%;text-transform:uppercase;font-size:clamp(30px,2.8cqw,42px);line-height:.9}
.ht-prod-line{margin:.5em 0 1.2em;font-size:15px;line-height:1.4;font-weight:500;font-stretch:95%;color:#6b3a1c;flex:1}
.ht-prod-foot{display:flex;align-items:center;justify-content:space-between;gap:10px}
.ht-prod-price{font-family:var(--ht-cond);font-size:30px;line-height:1}

.ht-foot{background:var(--ht-peach);color:var(--ht-cocoa);padding:clamp(80px,8cqw,130px) clamp(16px,4cqw,64px) 26px;overflow:hidden}
.ht-foot-top{position:relative;display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:24px;max-width:1300px;margin:0 auto}
.ht-foot-h{font-weight:800;font-stretch:75%;text-transform:uppercase;font-size:clamp(34px,4.4cqw,64px);line-height:.88;max-width:13ch;margin-top:.3em}
.ht-form{display:flex;flex-wrap:wrap;gap:10px;align-items:center;max-width:480px}
.ht-input{flex:1 1 220px;min-width:0;height:50px;padding:0 18px;border:2.5px solid var(--ht-cocoa);border-radius:999px;background:var(--ht-paper);color:var(--ht-cocoa);font:inherit;font-size:16px;font-weight:600}
.ht-form-msg{flex-basis:100%;min-height:1.3em;font-family:var(--ht-hand);font-size:22px;font-weight:700}
.ht-word{position:relative;display:flex;justify-content:center;margin:clamp(30px,4cqw,60px) auto 0;font-weight:800;font-stretch:75%;font-variation-settings:"opsz" 96;font-size:clamp(110px,29cqw,470px);line-height:.78;color:var(--ht-brown);letter-spacing:-.02em}
.ht-word-l{position:relative;display:inline-block}
.ht-word .ht-tp{height:.11em;z-index:2}
.ht-foot-bar{position:relative;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;max-width:1300px;margin:clamp(24px,3cqw,40px) auto 0;padding-top:18px;border-top:2px solid rgba(59,29,10,.25);font-size:13px;font-weight:600;font-stretch:90%}

@container ht (max-width:900px){
.ht-shop-grid{grid-template-columns:repeat(2,1fr)}
.ht-prod:nth-child(even){margin-top:0}
.ht-shop-head{grid-template-columns:1fr}
}
@container ht (max-width:720px){
.ht-nav-links{display:none}
.ht-hero-copy{padding-top:max(130px,calc(var(--h) * .25))}
.ht-h1{font-size:clamp(64px,30cqw,300px);line-height:.82}
.ht-kicker{font-size:15px}
.ht-hero-note{bottom:calc(var(--h) * .2);width:84px;font-size:11px}
.ht-cue{bottom:calc(var(--h) * .2)}
.ht-board{height:auto;display:flex;flex-direction:column;gap:46px;padding-bottom:20px}
.ht-item{position:relative;left:auto;top:auto}
.ht-i-head{width:94%;order:0}
.ht-i-card{width:94%;align-self:center;order:1}
.ht-i-note{width:72%;order:2}
.ht-i-lemon{width:66%;align-self:flex-end;order:3}
.ht-i-gift{width:84%;order:4}
.ht-i-ticket{width:58%;align-self:flex-end;order:5}
.ht-i-seal{width:34%;order:6;margin-left:8%}
.ht-collage-h{font-size:17cqw}
.ht-card-t{font-size:8.6cqw}
.ht-note ul{font-size:24px}
.ht-mask-h{font-size:19cqw;top:calc(max(var(--h),600px) * .11)}
.ht-mask-roll{right:auto;left:50%;top:auto;bottom:calc(max(var(--h),600px) * .3);translate:-50% 0}
.ht-mask-roll .ht-face{--d:44cqw}
.ht-mask-copy{width:auto;right:16px;bottom:18px;font-size:14px;padding:16px 16px 18px}
.ht-mask-copy p:not(.ht-label){display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ht-mask-stamp{right:18px;bottom:calc(max(var(--h),600px) * .5)}
.ht-d2,.ht-d5{display:none}
.ht-d1{left:auto;right:6%;top:30%}
.ht-shop-grid{grid-template-columns:1fr;gap:34px}
.ht-prod{width:88%;justify-self:center}
.ht-prod-roll{height:52cqw}
.ht-prod-roll .ht-roll{--d:40cqw}
.ht-word{font-size:36cqw}
}

@media (prefers-reduced-motion: reduce){
.ht-pre{display:none}
.ht-mask{height:auto}
.ht-mask-stage{position:relative}
.ht-l,.ht-mq-i,.ht-roll{will-change:auto}
.ht-btn,.ht-prod,.ht-roll-body,.ht-tp,.ht-nav-brand{transition:none}
.ht-prod:hover,.ht-prod:hover .ht-roll-body{transform:rotateY(var(--tilt)) rotateX(var(--spin))}
.ht-prod:hover{transform:none}
.ht-mask-stamp{opacity:1;rotate:-9deg}
}
`
