"use client"

import * as React from "react"

// #region bubble-kit
/* ---------------------------------------------------------------------------
   Everything between the bubble-kit markers is shared, byte for byte, by
   bubble-graffiti-preloader and bubble-graffiti-landing, so the preloader's
   last frame and the landing's first frame are the same drawing. Each file is
   still installed on its own; tests/bubble-graffiti.test.mjs fails if the two
   copies drift. Edit both or neither.
   ------------------------------------------------------------------------- */

export type BubblePalette = {
  /** Page colour under the grid. */
  paper?: string
  /** Outlines, the slab, pixels and type. */
  ink?: string
  /** The balloon letters. */
  balloon?: string
  /** Highlights on the balloons, the ribbon and the edge blobs. */
  shine?: string
  /** Grid lines. Keep it faint. */
  grid?: string
}

const PALETTE: Required<BubblePalette> = {
  paper: "#f6f3e9",
  ink: "#131313",
  balloon: "#6a9fe2",
  shine: "#fdfcf7",
  grid: "rgba(19,19,19,0.075)",
}

function paletteVars(p?: BubblePalette): React.CSSProperties {
  const c = { ...PALETTE, ...p }
  return {
    ["--bgk-paper" as string]: c.paper,
    ["--bgk-ink" as string]: c.ink,
    ["--bgk-balloon" as string]: c.balloon,
    ["--bgk-shine" as string]: c.shine,
    ["--bgk-grid" as string]: c.grid,
  }
}

const cssVars = (o: Record<string, string | number>) => o as React.CSSProperties

// #region glyphs
/* The balloon alphabet. Every glyph is a few centre-line strokes in a box 100
   units tall; the renderer inflates each stroke into an outlined tube with
   knotted ends and a shine, so letters read as twisted balloons rather than
   type. No font file, so nothing can fall back to a serif. */

type Glyph = { w: number; d: string[] }

const TUBE = 28
const RIM = 5

const GLYPHS: Record<string, Glyph> = {
  A: { w: 92, d: ["M16 86 Q26 46 46 14", "M46 14 Q66 46 76 86", "M28 62 L64 62"] },
  B: { w: 80, d: ["M18 14 L18 86", "M18 14 Q64 12 62 32 Q60 50 22 50", "M22 50 Q70 48 66 70 Q62 88 18 86"] },
  C: { w: 82, d: ["M68 22 Q52 10 36 16 Q14 26 14 50 Q14 76 36 84 Q54 90 68 78"] },
  D: { w: 84, d: ["M18 14 L18 86", "M18 14 Q70 12 70 50 Q70 88 18 86"] },
  E: { w: 74, d: ["M18 14 L18 86", "M18 14 L60 14", "M18 50 L54 50", "M18 86 L60 86"] },
  F: { w: 72, d: ["M18 14 L18 86", "M18 14 L58 14", "M18 50 L52 50"] },
  G: { w: 88, d: ["M72 22 Q54 10 38 14 Q14 22 14 50 Q14 80 40 86 Q70 88 72 58", "M72 58 L50 56"] },
  H: { w: 84, d: ["M18 14 L18 86", "M66 14 L66 86", "M18 50 L66 50"] },
  I: { w: 36, d: ["M18 14 L18 86"] },
  J: { w: 70, d: ["M54 14 L54 62 Q54 88 34 86 Q16 84 14 66"] },
  K: { w: 80, d: ["M18 14 L18 86", "M62 14 Q36 44 20 52", "M24 50 Q48 64 64 86"] },
  L: { w: 68, d: ["M18 14 L18 86", "M18 86 L54 86"] },
  M: { w: 108, d: ["M16 86 L20 14", "M20 14 Q38 50 54 58", "M54 58 Q70 50 88 14", "M88 14 L92 86"] },
  N: { w: 88, d: ["M18 86 L18 14", "M18 14 Q44 50 70 86", "M70 86 L70 14"] },
  O: { w: 90, d: ["M45 14 Q14 14 14 50 Q14 86 45 86 Q76 86 76 50 Q76 14 45 14"] },
  P: { w: 78, d: ["M18 14 L18 86", "M18 14 Q62 10 60 30 Q58 48 22 46"] },
  Q: { w: 94, d: ["M45 14 Q14 14 14 50 Q14 86 45 86 Q76 86 76 50 Q76 14 45 14", "M54 64 L80 88"] },
  R: { w: 80, d: ["M18 14 L18 86", "M18 14 Q62 10 60 30 Q58 48 22 46", "M30 48 Q54 62 64 86"] },
  S: { w: 76, d: ["M60 22 Q46 10 32 14 Q14 20 18 36 Q22 48 40 52 Q62 58 60 72 Q56 90 34 86 Q20 84 14 76"] },
  T: { w: 80, d: ["M14 14 L66 14", "M40 14 L40 86"] },
  U: { w: 84, d: ["M18 14 L18 58 Q18 86 42 86 Q66 86 66 58 L66 14"] },
  V: { w: 88, d: ["M14 14 Q30 60 44 86", "M44 86 Q58 60 74 14"] },
  W: { w: 116, d: ["M14 14 L28 86", "M28 86 Q40 54 58 40", "M58 40 Q72 54 86 86", "M86 86 L102 14"] },
  X: { w: 84, d: ["M16 14 Q40 50 68 86", "M68 14 Q40 50 16 86"] },
  Y: { w: 84, d: ["M16 14 Q30 44 42 52", "M68 14 Q52 44 42 52", "M42 52 L42 86"] },
  Z: { w: 78, d: ["M16 14 L62 14", "M62 14 Q40 50 16 86", "M16 86 L62 86"] },
  "0": { w: 80, d: ["M40 14 Q14 14 14 50 Q14 86 40 86 Q66 86 66 50 Q66 14 40 14"] },
  "1": { w: 52, d: ["M16 26 Q28 20 34 14", "M34 14 L34 86"] },
  "2": { w: 76, d: ["M16 28 Q24 12 40 14 Q62 16 60 36 Q58 54 16 86", "M16 86 L62 86"] },
  "3": { w: 74, d: ["M16 22 Q30 10 44 14 Q62 20 56 36 Q50 48 34 50", "M34 50 Q62 52 60 70 Q56 88 36 86 Q20 86 14 76"] },
  "4": { w: 80, d: ["M50 14 Q30 44 14 64", "M14 64 L66 64", "M52 36 L52 86"] },
  "5": { w: 74, d: ["M60 14 L22 14", "M22 14 L18 46", "M18 46 Q34 38 48 42 Q62 48 60 66 Q58 88 34 86 Q20 86 14 78"] },
  "6": { w: 76, d: ["M58 16 Q20 18 16 54 Q14 86 38 86 Q60 86 60 64 Q60 44 38 44 Q24 44 16 56"] },
  "7": { w: 72, d: ["M14 14 L58 14", "M58 14 Q36 50 30 86"] },
  "8": { w: 76, d: ["M38 50 Q16 44 18 30 Q20 14 38 14 Q56 14 58 30 Q60 44 38 50 Q14 56 16 70 Q18 86 38 86 Q58 86 60 70 Q62 56 38 50"] },
  "9": { w: 76, d: ["M18 84 Q56 82 60 46 Q62 14 38 14 Q16 14 16 36 Q16 56 38 56 Q52 56 60 44"] },
  "!": { w: 40, d: ["M20 14 L20 58", "M20 84 L20 86"] },
  "?": { w: 70, d: ["M16 26 Q24 12 38 14 Q58 16 56 34 Q54 48 36 54 L36 60", "M36 84 L36 86"] },
  ".": { w: 36, d: ["M18 84 L18 86"] },
  "-": { w: 56, d: ["M14 50 L42 50"] },
  " ": { w: 36, d: [] },
}

function glyphFor(ch: string): Glyph {
  return GLYPHS[ch.toUpperCase()] ?? GLYPHS[" "]
}

/** First and last point of a stroke — where its knots go. */
function ends(d: string): number[] {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? ["0", "0"]).map(Number)
  return [n[0], n[1], n[n.length - 2], n[n.length - 1]]
}

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

type Placed = { ch: string; g: Glyph; x: number; y: number; rot: number; s: number }

/** Sets a word the way a writer throws it up: overlapping, bounced, tilted. */
function layoutWord(text: string, seed: number, jitter: number, track: number) {
  const rnd = mulberry(seed)
  const letters: Placed[] = []
  let x = 0
  for (const ch of Array.from(text)) {
    const g = glyphFor(ch)
    const s = 1 + (rnd() - 0.5) * 0.14 * jitter
    const rot = (rnd() - 0.5) * 14 * jitter
    const y = (rnd() - 0.5) * 16 * jitter
    letters.push({ ch, g, x, y, rot, s })
    x += g.w * s + track
  }
  return { letters, width: Math.max(0, x - track) }
}

/** Where a placed letter's box sits, as an SVG transform. */
function placeOf(l: Placed): string {
  return (
    "translate(" + (l.x + (l.g.w * l.s) / 2).toFixed(2) + " " + (50 + l.y).toFixed(2) + ") rotate(" +
    l.rot.toFixed(2) + ") scale(" + l.s.toFixed(3) + ") translate(" + -l.g.w / 2 + " -50)"
  )
}

/** The loading curve: eased, with three breaths in it so it feels like work. */
function loadCurve(x: number): number {
  const e = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
  return Math.min(1, Math.max(0, e - (Math.sin(e * Math.PI * 6) * 0.6) / (Math.PI * 6)))
}
// #endregion glyphs

type Variant = "balloon" | "hollow" | "ink"

/** One inflated glyph. `puff` makes each stroke blow up in turn on mount. */
function GlyphArt({ g, v, puff }: { g: Glyph; v: Variant; puff?: boolean }) {
  const r = TUBE / 2 + 1.5
  return (
    <g className={"bgk-v-" + v}>
      {g.d.map((d, j) => {
        const [x0, y0, x1, y1] = ends(d)
        return (
          <g key={j} className={puff ? "bgk-seg" : undefined} style={puff ? cssVars({ "--j": j }) : undefined}>
            <path className="bgk-o" d={d} strokeWidth={TUBE + RIM * 2} />
            <circle className="bgk-oc" cx={x0} cy={y0} r={r + RIM} />
            <circle className="bgk-oc" cx={x1} cy={y1} r={r + RIM} />
            <path className="bgk-f" d={d} strokeWidth={TUBE} />
            <circle className="bgk-fc" cx={x0} cy={y0} r={r} />
            <circle className="bgk-fc" cx={x1} cy={y1} r={r} />
            {v !== "hollow" && (
              <>
                <path className="bgk-h" d={d} pathLength={100} transform="translate(-5.5 -6)" />
                <circle className="bgk-hc" cx={x0 - 6} cy={y0 - 6} r={2.8} />
              </>
            )}
          </g>
        )
      })}
    </g>
  )
}

function sparklePath(r: number): string {
  const q = r * 0.2
  return (
    "M0 " + -r + " Q" + q + " " + -q + " " + r + " 0 Q" + q + " " + q + " 0 " + r +
    " Q" + -q + " " + q + " " + -r + " 0 Q" + -q + " " + -q + " 0 " + -r + "Z"
  )
}

function starPath(points: number, outer: number, inner: number, seed: number): string {
  const rnd = mulberry(seed)
  let d = ""
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points - Math.PI / 2
    const rr = (i % 2 ? inner : outer) * (0.86 + rnd() * 0.28)
    d += (i ? " L" : "M") + (Math.cos(a) * rr).toFixed(1) + " " + (Math.sin(a) * rr).toFixed(1)
  }
  return d + "Z"
}

/** A cluster of hard black pixels. Rows are strings; any non-space, non-dot is a block. */
function PixelBlock({ rows, x, y, cell, k0 = 0.14 }: { rows: string[]; x: number; y: number; cell: number; k0?: number }) {
  const cells: React.ReactNode[] = []
  rows.forEach((row, ry) => {
    Array.from(row).forEach((c, rx) => {
      if (c === "." || c === " ") return
      const i = cells.length
      cells.push(
        <rect
          key={rx + "-" + ry}
          x={x + rx * cell}
          y={y + ry * cell}
          width={cell + 0.6}
          height={cell + 0.6}
          style={cssVars({ "--k": (k0 + (((i * 37) % 13) / 13) * 0.22).toFixed(3) })}
        />,
      )
    })
  })
  return <g className="bgk-px">{cells}</g>
}

/* --------------------------------------------------------------- the art */

type Burst = { id: number; x: number; y: number }

const PX_A = [".XX...", "XXXX..", "XXXXX.", "XX..XX", "X....X"]
const PX_B = ["...X", "..XX", ".XXX", "XXXX", "..XX"]
const PX_C = ["XXX.", "..XX"]
const PX_D = ["X.", "XX"]
const CLOUD: number[][] = [[-26, 6, 24], [0, -14, 26], [28, -4, 22], [22, 20, 20], [-6, 22, 22]]

function restart(el: Element | null, cls: string, delayMs = 0) {
  if (!el) return
  el.classList.remove("bgk-squish", "bgk-hop", "bgk-kick")
  ;(el as SVGElement).style.animationDelay = delayMs + "ms"
  void el.getBoundingClientRect()
  el.classList.add(cls)
}

/**
 * The hero drawing: black slab, ribbon, cloud, pixels, the balloon word and a
 * starburst. Letters can be poked (squish), dragged (they spring home), and
 * the star sets the whole word hopping. `waveKey` changing does the same.
 */
function HeroArt({ word, waveKey = 0 }: { word: string; waveKey?: number }) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const boops = React.useRef<(SVGGElement | null)[]>([])
  const starRef = React.useRef<SVGGElement>(null)
  const timers = React.useRef<number[]>([])
  const drag = React.useRef<{ i: number; sx: number; sy: number; k: number; moved: boolean; id: number } | null>(null)
  const [bursts, setBursts] = React.useState<Burst[]>([])

  const lay = React.useMemo(() => layoutWord(word, hashStr(word), 1, -7), [word])
  const s = Math.min(800 / Math.max(lay.width, 1), 2.6)
  const ox = 500 - (lay.width * s) / 2
  const oy = 292 - 50 * s
  const n = lay.letters.length
  const star = React.useMemo(() => starPath(10, 56, 26, 11), [])

  React.useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  const burst = (x: number, y: number) => {
    const id = Math.random()
    setBursts((b) => [...b.slice(-5), { id, x, y }])
    timers.current.push(window.setTimeout(() => setBursts((b) => b.filter((q) => q.id !== id)), 900))
  }

  const poke = (i: number) => {
    const l = lay.letters[i]
    restart(boops.current[i], "bgk-squish")
    burst(ox + (l.x + (l.g.w * l.s) / 2) * s, oy + (l.y + 6) * s)
  }

  const wave = React.useCallback(() => {
    boops.current.forEach((el, i) => restart(el, "bgk-hop", i * 70))
  }, [])

  React.useEffect(() => {
    if (waveKey) wave()
  }, [waveKey, wave])

  const kick = () => {
    restart(starRef.current, "bgk-kick")
    wave()
    burst(842, 402)
  }

  const onDown = (i: number) => (e: React.PointerEvent<SVGGElement>) => {
    if (e.button !== 0) return
    const m = svgRef.current?.getScreenCTM()
    const el = e.currentTarget
    el.style.transition = ""
    el.classList.add("bgk-grabbed")
    el.setPointerCapture(e.pointerId)
    drag.current = { i, sx: e.clientX, sy: e.clientY, k: m ? m.a || 1 : 1, moved: false, id: e.pointerId }
  }
  const onMove = (e: React.PointerEvent<SVGGElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = (e.clientX - d.sx) / d.k
    const dy = (e.clientY - d.sy) / d.k
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 5) d.moved = true
    if (d.moved) e.currentTarget.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)"
  }
  const onUp = (e: React.PointerEvent<SVGGElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    const el = e.currentTarget
    el.classList.remove("bgk-grabbed")
    if (!d.moved) {
      poke(d.i)
      return
    }
    el.style.transition = "transform .95s cubic-bezier(.2,2.1,.4,1)"
    el.style.transform = ""
  }
  const onKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      fn()
    }
  }

  return (
    <svg ref={svgRef} className="bgk-art" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" role="img" aria-label={word}>
      <PixelBlock rows={PX_A} x={36} y={62} cell={22} />
      <PixelBlock rows={PX_B} x={874} y={300} cell={22} k0={0.3} />
      <PixelBlock rows={PX_C} x={430} y={432} cell={20} k0={0.24} />
      <PixelBlock rows={PX_D} x={956} y={200} cell={18} k0={0.36} />

      <rect className="bgk-slab" x={118} y={176} width={764} height={232} rx={2} />

      <g className="bgk-rib">
        <path className="bgk-rib-o" pathLength={100} d="M-20 372 C110 300 220 430 340 356 S570 270 710 336 S905 286 1030 226" />
        <path className="bgk-rib-f" pathLength={100} d="M-20 372 C110 300 220 430 340 356 S570 270 710 336 S905 286 1030 226" />
      </g>

      <g className="bgk-cloud" transform="translate(158 150)">
        {CLOUD.map((c, i) => <circle key={"o" + i} className="bgk-cl-o" cx={c[0]} cy={c[1]} r={c[2] + 4} />)}
        {CLOUD.map((c, i) => <circle key={"f" + i} className="bgk-cl-f" cx={c[0]} cy={c[1]} r={c[2]} />)}
      </g>

      <g transform={"translate(" + ox.toFixed(2) + " " + oy.toFixed(2) + ") scale(" + s.toFixed(4) + ")"}>
        {lay.letters.map((l, i) =>
          l.g.d.length === 0 ? null : (
            <g
              key={i}
              className="bgk-l"
              tabIndex={0}
              role="button"
              aria-label={"Poke the " + l.ch}
              onPointerDown={onDown(i)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onKeyDown={onKey(() => poke(i))}
              onTransitionEnd={(e) => {
                if (e.target === e.currentTarget) e.currentTarget.style.transition = ""
              }}
            >
              <g transform={placeOf(l)}>
                <g className="bgk-bob" style={cssVars({ "--i": i })}>
                  <g className="bgk-in" style={cssVars({ "--k": (0.3 + (i / Math.max(n, 1)) * 0.3).toFixed(3) })}>
                    <g
                      className="bgk-boop"
                      ref={(el) => {
                        boops.current[i] = el
                      }}
                      onAnimationEnd={(e) => {
                        if (e.target === e.currentTarget) e.currentTarget.classList.remove("bgk-squish", "bgk-hop")
                      }}
                    >
                      <rect className="bgk-ring" x={-4} y={-4} width={l.g.w + 8} height={108} rx={20} />
                      <GlyphArt g={l.g} v="balloon" puff />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          ),
        )}
      </g>

      <g transform="translate(842 402)">
        <g className="bgk-star-in">
          <g
            className="bgk-star"
            ref={starRef}
            tabIndex={0}
            role="button"
            aria-label="Make the letters hop"
            onClick={kick}
            onKeyDown={onKey(kick)}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) e.currentTarget.classList.remove("bgk-kick")
            }}
          >
            <g className="bgk-star-spin">
              <path d={star} className="bgk-star-o" />
              <circle r={7} className="bgk-star-dot" />
            </g>
          </g>
        </g>
      </g>

      <g transform="translate(92 262)"><path className="bgk-tw" d={sparklePath(17)} /></g>
      <g transform="translate(918 142)"><path className="bgk-tw" style={cssVars({ "--i": 1 })} d={sparklePath(14)} /></g>
      <g transform="translate(360 470)"><path className="bgk-tw" style={cssVars({ "--i": 2 })} d={sparklePath(10)} /></g>

      {bursts.map((b) => (
        <g key={b.id} transform={"translate(" + b.x.toFixed(1) + " " + b.y.toFixed(1) + ")"} className="bgk-burst">
          {[0, 1, 2, 3, 4, 5].map((j) => (
            <path key={j} d={sparklePath(j % 2 ? 7 : 10)} style={cssVars({ "--a": j * 60 + 15 + "deg" })} />
          ))}
        </g>
      ))}
    </svg>
  )
}

/* ----------------------------------------------------- edges and wordmark */

const SQ_SHAPE = [
  "M-12 -12 L96 -12 C150 70 40 150 70 240 C100 330 190 360 160 460 C130 560 30 560 50 660 C70 760 170 790 130 880 C110 930 70 960 80 1000 L-12 1012 Z",
  "M-12 -12 L112 -12 C168 84 58 164 92 252 C122 342 204 380 172 472 C140 570 42 570 62 670 C82 772 182 800 142 890 C120 942 82 972 92 1000 L-12 1012 Z",
]
const SQ_LINE = [
  "M50 0 C104 70 -6 150 24 240 C54 330 144 360 114 460 C84 560 -16 560 4 660 C24 760 124 790 84 880 C64 930 24 960 34 1000",
  "M62 0 C118 84 8 164 42 252 C72 342 154 380 122 472 C90 570 -8 570 12 670 C32 772 132 800 92 890 C70 942 32 972 42 1000",
]
const SQ_LOOP = [
  "M150 90 C230 120 250 210 200 250 C150 290 180 350 240 372",
  "M160 100 C236 136 244 222 196 262 C146 300 190 356 246 384",
]

function useReducedMotion() {
  const [r, setR] = React.useState(false)
  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    const f = () => setR(m.matches)
    f()
    m.addEventListener("change", f)
    return () => m.removeEventListener("change", f)
  }, [])
  return r
}

function Morph({ v, still }: { v: string[]; still: boolean }) {
  if (still) return null
  return (
    <animate
      attributeName="d"
      dur="12s"
      repeatCount="indefinite"
      calcMode="spline"
      keyTimes="0;0.5;1"
      keySplines=".45 0 .55 1;.45 0 .55 1"
      values={v[0] + ";" + v[1] + ";" + v[0]}
    />
  )
}

/** The inflatable blobs hugging the left and right edges. */
function Squiggles() {
  const still = useReducedMotion()
  const side = (cls: string) => (
    <svg className={"bgk-sq " + cls} viewBox="0 0 260 1000" preserveAspectRatio="xMinYMid slice" aria-hidden="true">
      <path className="bgk-sq-shape" pathLength={100} d={SQ_SHAPE[0]}><Morph v={SQ_SHAPE} still={still} /></path>
      <path className="bgk-sq-line" pathLength={100} d={SQ_LINE[0]}><Morph v={SQ_LINE} still={still} /></path>
      <path className="bgk-sq-line" pathLength={100} d={SQ_LOOP[0]}><Morph v={SQ_LOOP} still={still} /></path>
    </svg>
  )
  return (
    <>
      {side("bgk-sq-l")}
      {side("bgk-sq-r")}
    </>
  )
}

/** Brand lettered in black balloons, crowned, with a line of mono underneath. */
function Wordmark({ text, tagline, onPoke }: { text: string; tagline?: string; onPoke?: () => void }) {
  const lay = React.useMemo(() => layoutWord(text, hashStr(text) + 3, 1.5, -8), [text])
  const W = Math.max(lay.width, 40)
  const crownAt = lay.letters[Math.min(1, lay.letters.length - 1)]
  const art = (
    <svg className="bgk-mark-svg" viewBox={"-44 -52 " + (W + 88) + " 184"} style={{ aspectRatio: W + 88 + " / 184" }} aria-hidden="true">
      {lay.letters.map((l, i) =>
        l.g.d.length === 0 ? null : (
          <g key={i} transform={placeOf(l)}>
            <g className="bgk-mk" style={cssVars({ "--i": i })}>
              <GlyphArt g={l.g} v="ink" />
            </g>
          </g>
        ),
      )}
      {crownAt && (
        <g transform={"translate(" + (crownAt.x + (crownAt.g.w * crownAt.s) / 2).toFixed(1) + " " + (crownAt.y - 6).toFixed(1) + ") rotate(" + (crownAt.rot + 8).toFixed(1) + ")"}>
          <path className="bgk-crown" d="M-20 0 L-24 -28 L-10 -13 L0 -34 L10 -13 L24 -28 L20 0 Z" />
        </g>
      )}
      <g transform="translate(-20 4)"><path className="bgk-tw bgk-tw-o" d={sparklePath(18)} /></g>
      <g transform={"translate(" + (W + 18) + " 98)"}><path className="bgk-tw bgk-tw-o" style={cssVars({ "--i": 1 })} d={sparklePath(15)} /></g>
    </svg>
  )
  const body = (
    <>
      {art}
      {tagline ? <span className="bgk-tag">{tagline}</span> : null}
    </>
  )
  return onPoke ? (
    <button type="button" className="bgk-mark" onClick={onPoke} aria-label={text + (tagline ? " — " + tagline : "")}>
      {body}
    </button>
  ) : (
    <div className="bgk-mark" role="img" aria-label={text + (tagline ? " — " + tagline : "")}>
      {body}
    </div>
  )
}

/* ------------------------------------------------------------ the intro */

type Fly = { ch: string; v: Variant; vars: React.CSSProperties; out: boolean; w: number }

/** Dozens of loose letters swirling in from off-frame and sucked into the word, then blown back out. */
function Storm({ word }: { word: string }) {
  const items = React.useMemo<Fly[]>(() => {
    const r = mulberry(hashStr(word) ^ 0x9e3779b9)
    const pool = (word + word + "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?").replace(/[^A-Za-z0-9!?]/g, "")
    const variants: Variant[] = ["balloon", "balloon", "hollow", "ink"]
    const total = 58
    return Array.from({ length: total }, (_, i) => {
      const out = i >= 42
      const a = r() * Math.PI * 2
      const R = 68 + r() * 22
      const swirl = (r() < 0.5 ? -1 : 1) * (1.1 + r() * 0.9)
      const mR = 18 + r() * 20
      const ch = pool[Math.floor(r() * pool.length)] ?? "O"
      return {
        ch,
        out,
        v: variants[Math.floor(r() * variants.length)],
        w: glyphFor(ch).w,
        vars: cssVars({
          "--x0": (Math.cos(a) * R).toFixed(1),
          "--y0": (Math.sin(a) * R * 0.85).toFixed(1),
          "--xm": (Math.cos(a + swirl) * mR).toFixed(1),
          "--ym": (Math.sin(a + swirl) * mR * 0.8).toFixed(1),
          "--x1": ((r() - 0.5) * 10).toFixed(1),
          "--y1": ((r() - 0.5) * 8).toFixed(1),
          "--r0": Math.round((r() - 0.5) * 760),
          "--rm": Math.round((r() - 0.5) * 200),
          "--r1": Math.round((r() - 0.5) * 90),
          "--s": (0.6 + r() * 1.3).toFixed(2),
          "--sz": (5 + r() * 9).toFixed(1),
          "--k": out ? (0.6 + r() * 0.12).toFixed(3) : ((i / 42) * 0.4 + r() * 0.03).toFixed(3),
          "--du": out ? (0.22 + r() * 0.1).toFixed(3) : (0.26 + r() * 0.12).toFixed(3),
        }),
      }
    })
  }, [word])
  return (
    <div className="bgk-storm" aria-hidden="true">
      {items.map((f, i) => (
        <div key={i} className={"bgk-fly" + (f.out ? " bgk-out" : "")} style={f.vars}>
          <svg viewBox={"-12 -12 " + (f.w + 24) + " 124"} style={{ aspectRatio: f.w + 24 + " / 124" }}>
            <GlyphArt g={glyphFor(f.ch)} v={f.v} />
          </svg>
        </div>
      ))}
    </div>
  )
}

/** Three bands of hollow balloon type sliding past each other behind everything. */
function Rows({ word }: { word: string }) {
  const lay = React.useMemo(() => layoutWord((word + " ").repeat(5), hashStr(word) + 17, 0.8, -10), [word])
  const W = lay.width + 40
  const strip = (
    <svg viewBox={"-20 -14 " + W + " 128"} style={{ aspectRatio: W + " / 128" }}>
      {lay.letters.map((l, i) =>
        l.g.d.length === 0 ? null : (
          <g key={i} transform={placeOf(l)}>
            <GlyphArt g={l.g} v="hollow" />
          </g>
        ),
      )}
    </svg>
  )
  return (
    <div className="bgk-rows" aria-hidden="true">
      {[0, 1, 2].map((r) => (
        <div key={r} className={"bgk-row" + (r % 2 ? " bgk-rev" : "")}>
          {strip}
          {strip}
        </div>
      ))}
    </div>
  )
}

export type BubbleIntroProps = {
  /** The balloon word the storm of letters collapses into. */
  word?: string
  /** Lettered in black at the top, with a crown. */
  brand?: string
  /** Mono line under the brand. */
  tagline?: string
  /** How long a load takes when `progress` is not given, in ms. Also paces the choreography. */
  duration?: number
  /** Real progress, 0–100. When given, the counter follows it and the intro ends when it reaches 100. */
  progress?: number
  /** Replays forever; children are never shown and onComplete never fires. */
  loop?: boolean
  /** Status lines in the bottom letterbox bar, stepped through as progress climbs. */
  messages?: string[]
  /** Top-right slate text. */
  slate?: string
  /** Show a "Skip" button in the letterbox bar. */
  skippable?: boolean
  palette?: BubblePalette
  /** Must be a definite length — never "100%". Ignored when `fill` is set. */
  height?: string
  minHeight?: string
  /** Cover the nearest positioned ancestor instead of taking a height of its own. */
  fill?: boolean
  /** Revealed under the pixel wipe once loading finishes. */
  children?: React.ReactNode
  /** The moment the wipe has covered the screen and the scene swaps out. */
  onReveal?: () => void
  /** After the wipe has cleared. */
  onComplete?: () => void
  className?: string
}

const MESSAGES = [
  "sketching balloons",
  "tying the knots",
  "inflating letters",
  "stacking pixels",
  "buffing highlights",
  "ready, set, pop!",
]
const WIPE_COLS = 12
const WIPE_ROWS = 7
const WIPE_MS = 780

function BubbleIntro({
  word = "hello",
  brand = "kedhar",
  tagline = "made with no asset",
  duration = 4200,
  progress,
  loop = false,
  messages = MESSAGES,
  slate = "SCENE 01",
  skippable = true,
  palette,
  height = "100svh",
  minHeight = "560px",
  fill = false,
  children,
  onReveal,
  onComplete,
  className = "",
}: BubbleIntroProps) {
  const D = Math.max(1200, duration)
  const [run, setRun] = React.useState(0)
  const [wipe, setWipe] = React.useState<"idle" | "in" | "out">("idle")
  const [revealed, setRevealed] = React.useState(false)

  const numRef = React.useRef<HTMLSpanElement>(null)
  const barRef = React.useRef<HTMLDivElement>(null)
  const msgRef = React.useRef<HTMLSpanElement>(null)
  const tcRef = React.useRef<HTMLSpanElement>(null)
  const pbRef = React.useRef<HTMLDivElement>(null)
  const skipRef = React.useRef(false)
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const cb = React.useRef({ onReveal, onComplete, loop, messages })
  cb.current = { onReveal, onComplete, loop, messages }
  const timers = React.useRef<number[]>([])

  React.useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  React.useEffect(() => {
    if (revealed) return
    let raf = 0
    let shown = 0
    let lastCells = -1
    let lastMsg = -1
    const t0 = performance.now()
    skipRef.current = false
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

    const finish = () => {
      setWipe("in")
      later(() => {
        if (cb.current.loop) setRun((r) => r + 1)
        else {
          setRevealed(true)
          cb.current.onReveal?.()
        }
        setWipe("out")
        later(() => {
          setWipe("idle")
          if (!cb.current.loop) cb.current.onComplete?.()
        }, WIPE_MS)
      }, WIPE_MS)
    }

    const tick = (now: number) => {
      const t = now - t0
      const controlled = progressRef.current != null && !cb.current.loop
      const target = skipRef.current
        ? 1
        : controlled
          ? Math.min(1, Math.max(0, (progressRef.current as number) / 100))
          : loadCurve(Math.min(1, t / D))
      shown = controlled || skipRef.current ? shown + (target - shown) * 0.16 : target
      if (Math.abs(target - shown) < 0.004) shown = target
      const pct = Math.round(shown * 100)
      if (numRef.current) numRef.current.textContent = String(pct).padStart(3, "0")
      pbRef.current?.setAttribute("aria-valuenow", String(pct))
      const cells = Math.round(shown * 12)
      if (cells !== lastCells && barRef.current) {
        lastCells = cells
        Array.from(barRef.current.children).forEach((c, i) => c.classList.toggle("bgk-on", i < cells))
      }
      const list = cb.current.messages
      const mi = Math.min(list.length - 1, Math.floor(shown * list.length))
      if (mi !== lastMsg && msgRef.current && list.length) {
        lastMsg = mi
        msgRef.current.textContent = list[mi]
      }
      if (tcRef.current) {
        const f = Math.floor(t / (1000 / 24))
        const two = (x: number) => String(x).padStart(2, "0")
        tcRef.current.textContent = "00:" + two(Math.floor(f / 1440) % 60) + ":" + two(Math.floor(f / 24) % 60) + ":" + two(f % 24)
      }
      const ready = shown >= 1 && (skipRef.current || t >= D * (controlled ? 0.72 : 1))
      if (ready) {
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, D, revealed])

  const cells = React.useMemo(() => {
    const r = mulberry(7)
    return Array.from({ length: WIPE_COLS * WIPE_ROWS }, (_, i) => {
      const c = i % WIPE_COLS
      const w = ((c + Math.floor(i / WIPE_COLS)) / (WIPE_COLS + WIPE_ROWS)) * 400 + r() * 90
      return { w: Math.round(w) + "ms", blue: r() < 0.14 }
    })
  }, [])

  const rootStyle: React.CSSProperties = {
    ...paletteVars(palette),
    ...(fill ? {} : { height, minHeight }),
  }

  return (
    <div
      className={"bgk-root bgk-intro" + (fill ? " bgk-fill" : "") + (revealed ? " bgk-done" : "") + (className ? " " + className : "")}
      style={rootStyle}
    >
      <style>{KIT_CSS}</style>

      {revealed && children ? <div className="bgk-content">{children}</div> : null}

      {!revealed && (
        <div key={run} className="bgk-scene" style={cssVars({ "--bgk-d": D + "ms" })}>
          <div className="bgk-grid" />
          <Rows word={word} />
          <Squiggles />
          <div className="bgk-artbox">
            <HeroArt word={word} />
          </div>
          <Storm word={word} />
          <div className="bgk-mark-wrap">
            <Wordmark text={brand} tagline={tagline} />
          </div>

          <div className="bgk-count" ref={pbRef} role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
            <span className="bgk-count-label">loading</span>
            <span className="bgk-num-row">
              <span className="bgk-num" ref={numRef}>000</span>
              <span className="bgk-pct">%</span>
            </span>
            <div className="bgk-meter" ref={barRef} aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => <i key={i} />)}
            </div>
          </div>

          <div className="bgk-shut bgk-shut-t" aria-hidden="true" />
          <div className="bgk-shut bgk-shut-b" aria-hidden="true" />
          <div className="bgk-hud bgk-hud-t">
            <span><b className="bgk-rec" /> REC <span ref={tcRef}>00:00:00:00</span></span>
            <span>{slate} / TAKE {String(run + 1).padStart(2, "0")}</span>
          </div>
          <div className="bgk-hud bgk-hud-b">
            <span ref={msgRef} aria-live="polite">{messages[0] ?? ""}</span>
            {skippable ? (
              <button type="button" className="bgk-skip" onClick={() => (skipRef.current = true)}>
                skip &rsaquo;
              </button>
            ) : null}
          </div>
        </div>
      )}

      {wipe !== "idle" && (
        <div className={"bgk-wipe bgk-wipe-" + wipe} aria-hidden="true">
          {cells.map((c, i) => <i key={i} className={c.blue ? "bgk-wb" : undefined} style={cssVars({ "--w": c.w })} />)}
        </div>
      )}
    </div>
  )
}

const KIT_CSS = `
.bgk-root{position:relative;width:100%;overflow:hidden;container-type:size;background:var(--bgk-paper);color:var(--bgk-ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-tap-highlight-color:transparent;isolation:isolate}
.bgk-root svg{max-width:none;overflow:visible}
.bgk-fill{position:absolute;inset:0;z-index:30;height:auto}
.bgk-fill.bgk-done{background:transparent;pointer-events:none}
.bgk-content{position:absolute;inset:0;overflow:auto}
.bgk-scene{position:absolute;inset:0}
.bgk-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--bgk-grid) 1px,transparent 1px),linear-gradient(90deg,var(--bgk-grid) 1px,transparent 1px);background-size:44px 44px;background-position:center center}

.bgk-o,.bgk-f,.bgk-h{fill:none;stroke-linecap:round;stroke-linejoin:round}
.bgk-o{stroke:var(--bgk-ink)}
.bgk-oc{fill:var(--bgk-ink)}
.bgk-f{stroke:var(--bgk-balloon)}
.bgk-fc{fill:var(--bgk-balloon)}
.bgk-h{stroke:var(--bgk-shine);stroke-width:4.5;stroke-dasharray:24 6 3 200;stroke-dashoffset:-9}
.bgk-hc{fill:var(--bgk-shine)}
.bgk-v-hollow .bgk-f{stroke:var(--bgk-shine)}
.bgk-v-hollow .bgk-fc{fill:var(--bgk-shine)}
.bgk-v-ink .bgk-o{stroke:var(--bgk-paper)}
.bgk-v-ink .bgk-oc{fill:var(--bgk-paper)}
.bgk-v-ink .bgk-f{stroke:var(--bgk-ink)}
.bgk-v-ink .bgk-fc{fill:var(--bgk-ink)}
.bgk-v-ink .bgk-h{display:none}
.bgk-v-ink .bgk-hc{fill:var(--bgk-paper)}

.bgk-seg .bgk-o,.bgk-seg .bgk-f{animation:bgk-puff calc(var(--bgk-d) * .12) cubic-bezier(.3,1.7,.5,1) backwards;animation-delay:calc(var(--bgk-d) * var(--k,0) + var(--j,0) * 70ms)}
.bgk-seg circle{transform-box:fill-box;transform-origin:center;animation:bgk-pop calc(var(--bgk-d) * .12) cubic-bezier(.3,1.7,.5,1) backwards;animation-delay:calc(var(--bgk-d) * var(--k,0) + var(--j,0) * 70ms)}
.bgk-seg .bgk-h{animation:bgk-fade .35s ease backwards;animation-delay:calc(var(--bgk-d) * var(--k,0) + var(--j,0) * 70ms + var(--bgk-d) * .1)}
@keyframes bgk-puff{from{stroke-width:0}}
@keyframes bgk-pop{from{transform:scale(0)}}
@keyframes bgk-fade{from{opacity:0}}

.bgk-art{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.bgk-artbox{position:absolute;left:6cqw;right:6cqw;top:21cqh;bottom:15cqh;z-index:2;animation:bgk-dolly var(--bgk-d) cubic-bezier(.25,.6,.25,1) backwards}
@keyframes bgk-dolly{from{transform:scale(1.22) rotate(-2deg)}58%{transform:scale(.97)}66%{transform:scale(1.035) rotate(.4deg)}to{transform:none}}
.bgk-l,.bgk-star,.bgk-px rect,.bgk-cloud{pointer-events:auto}
.bgk-l{cursor:grab;touch-action:none;outline:none}
.bgk-l.bgk-grabbed{cursor:grabbing}
.bgk-ring{fill:none;stroke:var(--bgk-ink);stroke-width:3;stroke-dasharray:8 7;opacity:0}
.bgk-l:focus-visible .bgk-ring{opacity:1}
.bgk-bob{transform-box:fill-box;transform-origin:50% 100%;animation:bgk-bob 2.6s ease-in-out infinite alternate;animation-delay:calc(var(--i,0) * -.43s)}
@keyframes bgk-bob{from{transform:translateY(-2px) rotate(-1.4deg)}to{transform:translateY(3px) rotate(1.4deg) scale(1.012,.99)}}
.bgk-in{transform-box:fill-box;transform-origin:50% 62%;animation:bgk-inflate calc(var(--bgk-d) * .2) cubic-bezier(.3,1.5,.5,1) backwards;animation-delay:calc(var(--bgk-d) * var(--k,0))}
@keyframes bgk-inflate{from{transform:scale(.25) rotate(-12deg)}}
.bgk-boop{transform-box:fill-box;transform-origin:50% 90%;transition:transform .3s cubic-bezier(.3,1.6,.5,1)}
.bgk-grabbed .bgk-boop{transform:scale(1.08) rotate(-5deg)}
.bgk-l:hover .bgk-boop{animation:bgk-jelly .9s ease-in-out}
.bgk-boop.bgk-squish,.bgk-l:hover .bgk-boop.bgk-squish{animation:bgk-squish .7s cubic-bezier(.3,1.4,.5,1) both}
.bgk-boop.bgk-hop,.bgk-l:hover .bgk-boop.bgk-hop{animation:bgk-hop .8s cubic-bezier(.3,1.4,.5,1) both}
@keyframes bgk-squish{0%{transform:none}18%{transform:scale(1.24,.72)}40%{transform:scale(.86,1.2) translateY(-14px)}64%{transform:scale(1.06,.95)}100%{transform:none}}
@keyframes bgk-hop{0%{transform:none}30%{transform:translateY(-28px) rotate(-6deg) scale(1.05)}60%{transform:translateY(4px) scale(1.08,.9)}100%{transform:none}}
@keyframes bgk-jelly{0%,100%{transform:none}25%{transform:scale(1.08,.92)}50%{transform:scale(.95,1.06)}75%{transform:scale(1.03,.98)}}

.bgk-slab{fill:var(--bgk-ink);transform-box:fill-box;transform-origin:0 50%;animation:bgk-wipe calc(var(--bgk-d) * .16) cubic-bezier(.8,0,.2,1) backwards;animation-delay:calc(var(--bgk-d) * .12)}
@keyframes bgk-wipe{from{transform:scaleX(0)}}
.bgk-rib path{fill:none;stroke-linecap:round;stroke-dasharray:100;animation:bgk-draw calc(var(--bgk-d) * .3) cubic-bezier(.6,0,.2,1) backwards;animation-delay:calc(var(--bgk-d) * .2)}
.bgk-rib-o{stroke:var(--bgk-ink);stroke-width:30}
.bgk-rib-f{stroke:var(--bgk-shine);stroke-width:21}
@keyframes bgk-draw{from{stroke-dashoffset:100}}
.bgk-px rect{fill:var(--bgk-ink);transform-box:fill-box;transform-origin:50% 100%;transition:transform .4s cubic-bezier(.3,1.8,.5,1);animation:bgk-pop calc(var(--bgk-d) * .06) steps(3,end) backwards;animation-delay:calc(var(--bgk-d) * var(--k,0))}
.bgk-px rect:hover{transform:translateY(-45%);transition-duration:.12s}
.bgk-cloud{transform-box:fill-box;transform-origin:center;animation:bgk-pop calc(var(--bgk-d) * .12) cubic-bezier(.3,1.7,.5,1) backwards;animation-delay:calc(var(--bgk-d) * .28);transition:transform .5s cubic-bezier(.3,1.8,.5,1)}
.bgk-cloud:hover{transform:scale(1.12) rotate(-6deg)}
.bgk-cl-o{fill:var(--bgk-ink)}
.bgk-cl-f{fill:var(--bgk-shine)}
.bgk-star-in{transform-box:fill-box;transform-origin:center;animation:bgk-starin calc(var(--bgk-d) * .16) cubic-bezier(.3,1.6,.5,1) backwards;animation-delay:calc(var(--bgk-d) * .64)}
@keyframes bgk-starin{from{transform:scale(0) rotate(-120deg)}}
.bgk-star{cursor:pointer;outline:none;transform-box:fill-box;transform-origin:center;transition:transform .3s cubic-bezier(.3,1.8,.5,1)}
.bgk-star:hover,.bgk-star:focus-visible{transform:scale(1.12)}
.bgk-star.bgk-kick{animation:bgk-kick .8s cubic-bezier(.3,1.3,.5,1)}
@keyframes bgk-kick{0%{transform:none}35%{transform:scale(1.35) rotate(90deg)}100%{transform:rotate(360deg)}}
.bgk-star-spin{transform-box:fill-box;transform-origin:center;animation:bgk-spin 14s linear infinite}
.bgk-star:hover .bgk-star-spin{animation-duration:3s}
@keyframes bgk-spin{to{transform:rotate(360deg)}}
.bgk-star-o{fill:var(--bgk-shine);stroke:var(--bgk-ink);stroke-width:4.5;stroke-linejoin:round}
.bgk-star-dot{fill:var(--bgk-ink)}
.bgk-tw{fill:var(--bgk-ink);transform-box:fill-box;transform-origin:center;animation:bgk-tw 1.7s ease-in-out infinite alternate;animation-delay:calc(var(--i,0) * -.6s)}
.bgk-tw-o{fill:var(--bgk-shine);stroke:var(--bgk-ink);stroke-width:3.5;stroke-linejoin:round}
@keyframes bgk-tw{from{transform:scale(.72) rotate(-12deg)}to{transform:scale(1.08) rotate(10deg)}}
.bgk-burst path{fill:var(--bgk-ink);transform-box:view-box;transform-origin:0 0;transform:rotate(var(--a));animation:bgk-burst .85s cubic-bezier(.2,.8,.3,1) forwards;pointer-events:none}
@keyframes bgk-burst{from{transform:rotate(var(--a)) translateY(-8px) scale(.4)}60%{opacity:1}to{transform:rotate(var(--a)) translateY(-78px) scale(.9) rotate(90deg);opacity:0}}

.bgk-sq{position:absolute;top:0;height:100%;width:auto;aspect-ratio:260 / 1000;pointer-events:none;z-index:1}
.bgk-sq-l{left:0}
.bgk-sq-r{right:0;transform:rotate(180deg)}
.bgk-sq path{stroke:var(--bgk-ink);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:100;animation:bgk-draw calc(var(--bgk-d) * .45) cubic-bezier(.5,0,.2,1) backwards;animation-delay:calc(var(--bgk-d) * .05)}
.bgk-sq-shape{fill:var(--bgk-shine);animation:bgk-draw calc(var(--bgk-d) * .45) cubic-bezier(.5,0,.2,1) backwards,bgk-fill calc(var(--bgk-d) * .5) ease backwards}
.bgk-sq-line{fill:none}
@keyframes bgk-fill{from{fill-opacity:0}}

.bgk-mark-wrap{position:absolute;top:8cqh;left:50%;transform:translateX(-50%);z-index:4}
.bgk-mark{display:flex;flex-direction:column;align-items:center;background:none;border:0;padding:0;margin:0;color:inherit;font:inherit;cursor:default}
button.bgk-mark{cursor:pointer}
.bgk-mark:focus-visible{outline:2px dashed var(--bgk-ink);outline-offset:6px;border-radius:12px}
.bgk-mark-svg{display:block;height:clamp(38px,10.5cqh,108px);width:auto}
.bgk-tag{font:500 clamp(8px,1.4cqh,12px)/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.34em;margin-top:.55em;white-space:nowrap}
.bgk-mk{transform-box:fill-box;transform-origin:50% 100%;animation:bgk-drop calc(var(--bgk-d) * .12) cubic-bezier(.3,1.6,.5,1) backwards;animation-delay:calc(var(--bgk-d) * .18 + var(--i,0) * 70ms)}
button.bgk-mark:hover .bgk-mk{animation:bgk-hop .7s cubic-bezier(.3,1.4,.5,1);animation-delay:calc(var(--i,0) * 55ms)}
.bgk-crown{fill:var(--bgk-ink);stroke:var(--bgk-paper);stroke-width:4;stroke-linejoin:round}
@keyframes bgk-drop{from{transform:translateY(-60px) scale(.6);opacity:0}}

.bgk-storm{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:3}
.bgk-fly{position:absolute;left:50%;top:50%;height:calc(var(--sz) * 1cqh);opacity:0;animation:bgk-fly calc(var(--bgk-d) * var(--du)) cubic-bezier(.45,.05,.35,1) both;animation-delay:calc(var(--bgk-d) * var(--k))}
.bgk-fly svg{display:block;height:100%;width:auto}
.bgk-fly.bgk-out{animation-name:bgk-flyout;animation-timing-function:cubic-bezier(.1,.7,.3,1)}
@keyframes bgk-fly{0%{opacity:0;transform:translate(-50%,-50%) translate(calc(var(--x0) * 1cqw),calc(var(--y0) * 1cqh)) rotate(calc(var(--r0) * 1deg)) scale(var(--s))}10%{opacity:1}60%{transform:translate(-50%,-50%) translate(calc(var(--xm) * 1cqw),calc(var(--ym) * 1cqh)) rotate(calc(var(--rm) * 1deg)) scale(var(--s))}88%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) translate(calc(var(--x1) * 1cqw),calc(var(--y1) * 1cqh)) rotate(calc(var(--r1) * 1deg)) scale(.1)}}
@keyframes bgk-flyout{0%{opacity:0;transform:translate(-50%,-50%) translate(calc(var(--x1) * 1cqw),calc(var(--y1) * 1cqh)) scale(.2)}12%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) translate(calc(var(--x0) * 1cqw),calc(var(--y0) * 1cqh)) rotate(calc(var(--r0) * 1deg)) scale(var(--s))}}

.bgk-rows{position:absolute;inset:6cqh 0;display:flex;flex-direction:column;justify-content:space-around;pointer-events:none;opacity:0;animation:bgk-rows var(--bgk-d) ease both}
@keyframes bgk-rows{0%{opacity:0}10%{opacity:.2}42%{opacity:.2}60%{opacity:0}100%{opacity:0}}
.bgk-row{display:flex;width:max-content;animation:bgk-marq calc(var(--bgk-d) * 1.6) linear infinite}
.bgk-row.bgk-rev{animation-direction:reverse}
.bgk-row svg{display:block;flex:none;height:14cqh;width:auto}
@keyframes bgk-marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.bgk-shut{position:absolute;left:0;right:0;height:50.5%;background:var(--bgk-ink);z-index:6;pointer-events:none;animation:bgk-shut calc(var(--bgk-d) * .16) cubic-bezier(.8,0,.2,1) both;animation-delay:calc(var(--bgk-d) * .03)}
.bgk-shut-t{top:0;transform-origin:50% 0}
.bgk-shut-b{bottom:0;transform-origin:50% 100%}
@keyframes bgk-shut{from{transform:scaleY(1)}to{transform:scaleY(.09)}}
.bgk-hud{position:absolute;left:0;right:0;height:4.5%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 3cqw;color:var(--bgk-paper);font:600 clamp(8px,1.35cqh,12px)/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.2em;text-transform:uppercase;z-index:7;white-space:nowrap;animation:bgk-fade .5s ease backwards;animation-delay:calc(var(--bgk-d) * .16)}
.bgk-hud-t{top:0}
.bgk-hud-b{bottom:0}
.bgk-rec{display:inline-block;width:.8em;height:.8em;border-radius:50%;background:#ff3b30;margin-right:.3em;vertical-align:-.05em;animation:bgk-blink 1s steps(2,jump-none) infinite}
@keyframes bgk-blink{50%{opacity:.15}}
.bgk-skip{background:none;border:1px solid currentColor;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;padding:.4em .9em;border-radius:999px;cursor:pointer;transition:background .2s,color .2s}
.bgk-skip:hover,.bgk-skip:focus-visible{background:var(--bgk-paper);color:var(--bgk-ink);outline:none}

.bgk-count{position:absolute;right:13cqw;bottom:8cqh;z-index:5;display:flex;flex-direction:column;align-items:flex-end;animation:bgk-fade .5s ease backwards;animation-delay:calc(var(--bgk-d) * .14)}
.bgk-count-label{font:600 clamp(8px,1.3cqh,12px)/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.34em;text-transform:uppercase;margin-bottom:.6em}
.bgk-num-row{display:flex;align-items:flex-start}
.bgk-num{font-weight:900;font-size:clamp(44px,15cqh,168px);line-height:.8;letter-spacing:-.06em;font-variant-numeric:tabular-nums}
.bgk-pct{font-weight:800;font-size:clamp(14px,3.6cqh,40px);line-height:1;margin-left:.15em}
.bgk-meter{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;width:clamp(120px,20cqw,260px);height:14px;margin-top:12px;padding:3px;border:2px solid var(--bgk-ink)}
.bgk-meter i{background:var(--bgk-ink);transform:scaleY(0);transform-origin:50% 100%;transition:transform .18s steps(2,end)}
.bgk-meter i.bgk-on{transform:none}

.bgk-wipe{position:absolute;inset:0;display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:repeat(7,1fr);z-index:40;pointer-events:none}
.bgk-wipe i{background:var(--bgk-ink);transform:scale(0)}
.bgk-wipe i.bgk-wb{background:var(--bgk-balloon)}
.bgk-wipe-in i{animation:bgk-cellin .34s cubic-bezier(.7,0,.3,1) forwards;animation-delay:var(--w)}
.bgk-wipe-out i{transform:scale(1.03);animation:bgk-cellout .34s cubic-bezier(.7,0,.3,1) forwards;animation-delay:var(--w)}
@keyframes bgk-cellin{to{transform:scale(1.03)}}
@keyframes bgk-cellout{to{transform:scale(0)}}

@container (max-width: 700px){
  .bgk-artbox{left:1cqw;right:1cqw;top:30cqh;bottom:34cqh}
  .bgk-sq-l{transform:translateX(-48%)}
  .bgk-sq-r{transform:rotate(180deg) translateX(-48%)}
  .bgk-count{right:6cqw;bottom:8cqh}
  .bgk-mark-wrap{top:8.5cqh}
}

@media (prefers-reduced-motion: reduce){
  .bgk-root *,.bgk-root *::before,.bgk-root *::after{animation-duration:1ms !important;animation-delay:0ms !important;animation-iteration-count:1 !important;transition-duration:1ms !important}
  .bgk-storm,.bgk-rows{display:none}
}
`
// #endregion bubble-kit

/* ------------------------------------------------------------ component */

export type BubbleGraffitiPreloaderProps = BubbleIntroProps

/**
 * A cinematic preloader drawn entirely in code: the shutters open on a grid,
 * dozens of balloon letters swirl in from off-frame and get sucked into one
 * word that inflates tube by tube over a black slab, while a film slate, a
 * timecode and a pixel meter count it in. At 100 a pixel wipe covers the frame
 * and lifts off whatever you passed as children.
 *
 * Everything on screen can be played with while it loads — poke a letter,
 * drag it (it springs home), or hit the star to make the word hop.
 */
export default function BubbleGraffitiPreloader(props: BubbleGraffitiPreloaderProps) {
  return <BubbleIntro {...props} />
}
