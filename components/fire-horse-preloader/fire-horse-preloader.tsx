"use client"

// Fire Horse Preloader — a Lunar New Year 2026 (Bính Ngọ, the Fire Horse)
// loading gate. The progress paints a flame-maned horse in red ink on black
// while the year counts itself up beside it; at 100% a red seal floods out of
// the horse, the wordmark parts around it, and the card turns over to a
// four-season verse before lifting off whatever it was guarding.
//
// One file, React only. The horse is hand-drawn inline SVG, every rule in the
// scoped <style> is .fhp- prefixed, and no fonts are fetched: pass your own
// display face through `fontFamily` if the host already loads one.

import * as React from "react"

export interface FireHorsePalette {
  /** Stage background behind the ink phase. */
  ink: string
  /** Seal red: the horse in the ink phase, the card in the seal phase. */
  red: string
  /** Deeper red for the card's cloud linework and ghost type. */
  deep: string
  /** The horse once the seal floods in. */
  cream: string
  /** Flame tufts, verse brackets and the horse's linework on the seal. */
  gold: string
}

export interface FireHorsePreloaderProps {
  /** Content revealed once the gate lifts. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Run forever as a showcase: children are never revealed, onComplete never fires. */
  loop?: boolean
  /**
   * Real loading progress, 0–100. Leave undefined to run the built-in
   * simulated load over `durationMs`. The ink phase holds until this hits 100.
   */
  progress?: number
  /** Length of the simulated load. Defaults to 3600ms. */
  durationMs?: number
  /** Wordmark. Split at its first space so the halves can part around the horse. */
  word?: string
  /** Year, split in half either side of the horse and counted up by the load. */
  year?: string
  /** Line under the seal. "of" and "the" are set in lower-case italic. */
  tagline?: string
  /** Small heading on the back of the card. */
  verseTitle?: string
  /** Verse lines on the back of the card. Wrap a word in [brackets] to gild it. */
  verse?: string[]
  /** The two stem–branch glyphs flanking the verse. */
  glyphs?: [string, string]
  /** Turn the card over to the verse before lifting. Defaults to true. */
  showVerse?: boolean
  /** Colour overrides, merged over the defaults. */
  palette?: Partial<FireHorsePalette>
  /** Display face for the wordmark. The default stack never fetches anything. */
  fontFamily?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Fired once, after the gate has lifted. */
  onComplete?: () => void
  /** Extra root class names. */
  className?: string
}

const DEFAULT_PALETTE: FireHorsePalette = {
  ink: "#0b0a0a",
  red: "#d9161c",
  deep: "#a80d13",
  cream: "#f8f1e4",
  gold: "#d2a24c",
}

const DISPLAY_STACK =
  '"Bodoni Moda", "Playfair Display", Didot, "Bodoni 72", "Noto Serif Display", Georgia, "Times New Roman", serif'
const TEXT_STACK = '"Cormorant Garamond", "EB Garamond", Garamond, "Iowan Old Style", Georgia, "Times New Roman", serif'

const DEFAULT_VERSE = ["Mã hoá khai [Xuân]", "[Hạ] sang chuyển vận", "[Thu] về tấn lộc", "[Đông] đủ hạnh phúc"]

// #region timeline
// Pure helpers, lifted out and executed by tests/fire-horse-preloader.test.mjs.

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x)

// Three eased surges separated by two short stalls, so the simulated load
// reads like a real one instead of a linear tween. [time, progress] knots.
const KNOTS = [
  [0, 0],
  [0.32, 0.42],
  [0.42, 0.45],
  [0.7, 0.8],
  [0.78, 0.82],
  [1, 1],
]

export function fhpSimulated(t: number) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  for (let i = 0; i < KNOTS.length - 1; i++) {
    const a = KNOTS[i]
    const b = KNOTS[i + 1]
    if (t <= b[0]) {
      const local = (t - a[0]) / (b[0] - a[0])
      const eased = 1 - Math.pow(1 - local, 3)
      return a[1] + (b[1] - a[1]) * eased
    }
  }
  return 1
}

// Counts a numeric string up from zero, keeping its width: "26" at p = 0.5 is "13".
// Anything non-numeric is shown as-is once loaded, and as blanks before.
export function fhpCount(target: string, p: number) {
  if (!/^\d+$/.test(target)) return clamp01(p) >= 1 ? target : target.replace(/\S/g, " ")
  const value = Math.round(Number(target) * clamp01(p))
  return String(value).padStart(target.length, "0")
}

// The wordmark parts around the horse, so it needs two halves. Split at the
// first space; a single word splits at its middle letter.
export function fhpSplit(word: string) {
  const w = word.trim()
  const space = w.indexOf(" ")
  if (space > 0) return [w.slice(0, space), w.slice(space + 1).trim()]
  const mid = Math.ceil(w.length / 2)
  return [w.slice(0, mid), w.slice(mid)]
}

// "Mã hoá khai [Xuân]" -> runs, with bracketed words flagged for gilding.
export function fhpVerse(line: string) {
  return line
    .split(/(\[[^\]]*\])/)
    .filter((part) => part !== "")
    .map((part) => {
      const mark = part.charAt(0) === "[" && part.charAt(part.length - 1) === "]"
      return { text: mark ? part.slice(1, -1) : part, mark }
    })
}
// #endregion

// ---------------------------------------------------------------------------
// The horse. Drawn in a 360 x 520 box (x 80..440, y -50..470), rearing to the
// left, neck arched, mane and tail burning upward.
// ---------------------------------------------------------------------------

const r1 = (n: number) => Math.round(n * 10) / 10

// One S-curved flame tongue with a curled tip, base centred on the origin,
// pointing up. The group around it places and rotates it.
function tongue(L: number, w: number) {
  return (
    "M" + r1(-w) + " 0" +
    "C" + r1(-w) + " " + r1(-0.35 * L) + " " + r1(0.55 * w) + " " + r1(-0.42 * L) + " " + r1(0.15 * w) + " " + r1(-0.66 * L) +
    "C" + r1(-0.15 * w) + " " + r1(-0.82 * L) + " " + r1(0.25 * w) + " " + r1(-0.97 * L) + " " + r1(0.75 * w) + " " + r1(-L) +
    "C" + r1(0.2 * w) + " " + r1(-0.86 * L) + " " + r1(0.3 * w) + " " + r1(-0.74 * L) + " " + r1(0.55 * w) + " " + r1(-0.58 * L) +
    "C" + r1(0.95 * w) + " " + r1(-0.36 * L) + " " + r1(w) + " " + r1(-0.2 * L) + " " + r1(w) + " 0Z"
  )
}

function strand(L: number, w: number) {
  return "M0 -4C0 " + r1(-0.22 * L) + " " + r1(0.3 * w) + " " + r1(-0.32 * L) + " " + r1(0.12 * w) + " " + r1(-0.5 * L)
}

type Flame = [x: number, y: number, L: number, w: number, angle: number]

const MANE: Flame[] = [
  [178, 62, 74, 15, 8],
  [192, 64, 112, 21, 20],
  [208, 74, 140, 25, 31],
  [225, 94, 136, 24, 40],
  [239, 118, 116, 22, 48],
  [252, 142, 92, 18, 55],
  [266, 166, 62, 14, 62],
]
const TAIL: Flame[] = [
  [326, 244, 104, 20, 40],
  [337, 264, 140, 25, 63],
  [343, 290, 112, 20, 85],
  [340, 314, 70, 14, 104],
]
const TUFTS: Flame[] = [
  [342, 434, 42, 8, 112],
  [330, 382, 36, 7, 104],
  [304, 446, 36, 7, 112],
  [188, 330, 34, 7, -140],
  [154, 314, 32, 7, -140],
]

const BODY =
  "M112 146C112 136 120 124 130 112C140 100 147 90 152 80C156 72 159 62 162 52L167 36C171 44 176 52 179 60" +
  "C186 57 192 56 198 58C222 66 242 100 250 150C270 175 295 198 318 228C342 250 350 285 338 310" +
  "C334 330 340 350 350 382C346 392 342 420 338 446C340 456 344 462 342 468L312 468C314 460 316 454 318 450" +
  "C322 430 326 410 328 390C320 368 300 350 288 338C265 330 238 318 215 300" +
  "C208 312 198 322 188 330C194 340 200 352 204 364L190 374C184 360 176 346 170 334" +
  "C168 318 176 300 184 284C170 270 154 250 156 226C160 200 172 170 172 134C168 142 162 148 154 152" +
  "C140 160 128 162 120 160C114 158 111 152 112 146Z"
const FAR_EAR = "M175 62C177 54 179 46 184 40C188 48 190 56 188 64Z"
const FAR_FORELEG = "M205 262L160 284L150 322"
const FAR_HINDLEG = "M300 322L318 390L300 456"

// Ornament linework, drawn in the line colour over the body.
const DETAILS: [d: string, w: number][] = [
  ["M150 100C154 96 160 96 163 100", 2.4],
  ["M118 146C121 143 125 143 127 146", 2.4],
  ["M114 154C120 155 126 154 132 151", 2.4],
  ["M142 150C156 146 166 136 168 122", 2.4],
  ["M150 108C146 116 140 124 134 132", 1.6],
  ["M164 196C178 200 192 196 206 186", 3],
  ["M162 206C178 212 196 208 212 196", 1.6],
  ["M214 196C236 204 258 196 274 182", 3],
  ["M214 196C206 230 210 262 222 296", 3],
  ["M274 182C292 214 300 246 298 280", 3],
  ["M222 296C240 306 270 302 298 280", 3],
  ["M230 250C224 238 236 228 246 236C252 224 270 226 270 240C282 236 290 250 280 258C272 266 258 262 256 254C250 262 236 262 230 250Z", 2.2],
  ["M244 246C244 240 252 240 252 246C258 242 264 248 260 252", 1.6],
  ["M226 218C236 212 248 214 254 220", 1.6],
  ["M232 280C246 288 266 286 282 276", 1.6],
  ["M318 262C332 266 334 290 318 296C306 300 300 286 310 282", 2.2],
  ["M314 458L340 458", 2.4],
  ["M193 362L203 356", 2.4],
]

// A brush that zigzags up the horse's box; drawing it on paints the horse in.
const BRUSH = (() => {
  let d = "M70 500"
  for (let i = 0, y = 500; y > -80; i++, y -= 58) d += (i % 2 ? "L70 " : "L470 ") + (y - 30)
  return d
})()

function FlameSet({ flames, cls, strands }: { flames: Flame[]; cls: string; strands?: boolean }) {
  return (
    <>
      {flames.map(([x, y, L, w, a], i) => (
        <g key={i} transform={"translate(" + x + " " + y + ") rotate(" + a + ")"}>
          <g className="fhp-flick" style={{ animationDuration: 1.1 + ((i * 37) % 9) / 10 + "s", animationDelay: -i * 0.23 + "s" }}>
            <path className={cls} d={tongue(L, w)} />
            {strands ? <path className="fhp-line" d={strand(L, w)} strokeWidth={1.8} /> : null}
          </g>
        </g>
      ))}
    </>
  )
}

function Horse({ maskId, brushRef }: { maskId: string; brushRef: React.Ref<SVGPathElement> }) {
  return (
    <g className="fhp-horse">
      <mask id={maskId} maskUnits="userSpaceOnUse" x="40" y="-90" width="460" height="600">
        <path
          ref={brushRef}
          d={BRUSH}
          pathLength={1}
          fill="none"
          stroke="#fff"
          strokeWidth={96}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 1"
          strokeDashoffset={1}
        />
      </mask>
      <g mask={"url(#" + maskId + ")"}>
        <path className="fhp-limb" d={FAR_FORELEG} strokeWidth={18} />
        <path className="fhp-limb" d={FAR_HINDLEG} strokeWidth={18} />
        <path className="fhp-body" d={FAR_EAR} />
        <FlameSet flames={TAIL} cls="fhp-tail" strands />
        <FlameSet flames={MANE} cls="fhp-body" strands />
        <path className="fhp-body" d={BODY} />
        <circle className="fhp-eye" cx="157" cy="104" r="3.2" />
        {DETAILS.map(([d, w], i) => (
          <path key={i} className="fhp-line" d={d} strokeWidth={w} />
        ))}
        <FlameSet flames={TUFTS} cls="fhp-tuft" />
      </g>
    </g>
  )
}

// Ruyi cloud curls for the seal's background, one tile repeated.
function Clouds({ id }: { id: string }) {
  return (
    <svg className="fhp-clouds" aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 760">
      <defs>
        <pattern id={id} width="420" height="280" patternUnits="userSpaceOnUse" patternTransform="rotate(-4)">
          <path d="M-20 150C40 96 110 96 150 136S236 184 270 150 330 98 370 120 430 170 450 150" />
          <path d="M150 136C138 112 156 92 178 98C196 104 198 128 182 134C170 138 162 126 172 118" />
          <path d="M370 120C362 98 380 82 398 90C414 98 412 120 396 124C386 126 380 116 388 110" />
          <path d="M-10 268C50 230 100 236 130 256S200 290 236 262" />
          <path d="M236 262C230 240 250 226 268 234C282 242 278 262 262 264C252 264 248 254 256 250" />
          <path d="M60 40C90 10 140 14 160 40S220 70 250 40C270 22 300 22 312 40" />
          <path d="M312 40C318 58 340 62 348 48C354 36 342 26 334 34" />
        </pattern>
      </defs>
      <rect width="1000" height="760" fill={"url(#" + id + ")"} />
    </svg>
  )
}

// Deterministic ember field: [left %, size px, duration s, delay s, drift px].
const EMBERS: [number, number, number, number, number][] = Array.from({ length: 22 }, (_, i) => {
  const h = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
  return [8 + h(1) * 84, 2 + h(2) * 3.5, 4.5 + h(3) * 5, -h(4) * 9, (h(5) - 0.5) * 120]
})

function Tagline({ text }: { text: string }) {
  return (
    <>
      {text.split(/\s+/).filter(Boolean).map((word, i) => {
        const soft = /^(of|the|a|an)$/i.test(word)
        return (
          <tspan key={i} className={soft ? "fhp-soft" : undefined} dx={i ? (soft ? 7 : 9) : 0}>
            {soft ? word.toLowerCase() : word.toUpperCase()}
          </tspan>
        )
      })}
    </>
  )
}

const FHP_CSS = `
.fhp-root {
  --fhp-mx: 0;
  --fhp-my: 0;
  position: relative;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
  container-type: size;
  background: var(--fhp-ink);
  color: var(--fhp-cream);
  font-family: var(--fhp-text);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}
.fhp-root svg { max-width: none; overflow: visible; }
.fhp-root:focus-visible { outline: 2px solid var(--fhp-gold); outline-offset: -6px; }

.fhp-dest {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  opacity: 0;
  transition: opacity 0.6s ease;
}
.fhp-dest[data-active="true"] { opacity: 1; }

.fhp-gate {
  position: absolute;
  inset: 0;
  z-index: 2;
  perspective: 1800px;
  cursor: pointer;
  transition: transform 0.95s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.95s ease;
}
.fhp-root[data-phase="lift"] .fhp-gate { transform: translate3d(0, -104%, 0); }

.fhp-card {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}
.fhp-root[data-phase="verse"] .fhp-card,
.fhp-root[data-phase="lift"] .fhp-card {
  animation: fhp-turn 1.25s cubic-bezier(0.65, 0, 0.35, 1) both;
}
@keyframes fhp-turn {
  0% { transform: rotateY(0deg) scale(1); }
  50% { transform: rotateY(90deg) scale(0.8); }
  100% { transform: rotateY(180deg) scale(1); }
}

.fhp-face {
  position: absolute;
  inset: -2px;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.fhp-front { background: var(--fhp-ink); }
.fhp-back {
  transform: rotateY(180deg);
  background: var(--fhp-red);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* ---- the seal: a red disc that floods out of the horse ------------------ */
.fhp-seal {
  position: absolute;
  inset: 0;
  background: var(--fhp-red);
  clip-path: circle(0% at 50% 52%);
  transition: clip-path 1.05s cubic-bezier(0.7, 0, 0.2, 1);
}
.fhp-root[data-phase="seal"] .fhp-seal,
.fhp-root[data-phase="verse"] .fhp-seal,
.fhp-root[data-phase="lift"] .fhp-seal { clip-path: circle(150% at 50% 52%); }

.fhp-clouds {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: var(--fhp-deep);
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0.85;
}

.fhp-glow {
  position: absolute;
  left: 50%;
  top: 60%;
  width: 90cqmin;
  height: 90cqmin;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--fhp-red) 34%, transparent), transparent);
  opacity: calc(var(--fhp-p, 0) * 0.9);
  animation: fhp-breathe 3.2s ease-in-out infinite;
  pointer-events: none;
}
.fhp-root[data-phase="seal"] .fhp-glow,
.fhp-root[data-phase="verse"] .fhp-glow { opacity: 0; transition: opacity 0.6s; }
@keyframes fhp-breathe {
  0%, 100% { transform: translate(-50%, -50%) scale(0.94); }
  50% { transform: translate(-50%, -50%) scale(1.04); }
}

/* ---- embers -------------------------------------------------------------- */
.fhp-embers { position: absolute; inset: 0; pointer-events: none; }
.fhp-ember {
  position: absolute;
  bottom: -12px;
  border-radius: 50%;
  background: var(--fhp-red);
  box-shadow: 0 0 8px 1px var(--fhp-red);
  opacity: 0;
  animation: fhp-rise linear infinite;
}
.fhp-root[data-phase="seal"] .fhp-ember,
.fhp-root[data-phase="verse"] .fhp-ember { background: var(--fhp-gold); box-shadow: 0 0 8px 1px var(--fhp-gold); }
@keyframes fhp-rise {
  0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0; }
  12% { opacity: 0.95; }
  70% { opacity: 0.55; }
  100% { transform: translate3d(var(--fhp-drift), -105cqh, 0) scale(0.3); opacity: 0; }
}

/* ---- the scene ----------------------------------------------------------- */
.fhp-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.fhp-scene text { font-variant-numeric: tabular-nums lining-nums; }
.fhp-word {
  font-family: var(--fhp-display);
  font-style: italic;
  font-weight: 600;
  font-size: 212px;
  letter-spacing: -6px;
  fill: var(--fhp-red);
  stroke: var(--fhp-red);
  stroke-width: 1.4px;
  stroke-linejoin: round;
  paint-order: stroke;
  transition: fill 0.8s ease, stroke 0.8s ease;
}
.fhp-year {
  font-family: var(--fhp-display);
  font-weight: 600;
  font-size: 66px;
  fill: var(--fhp-red);
  transition: fill 0.8s ease;
}
.fhp-tagline {
  font-family: var(--fhp-display);
  font-weight: 600;
  font-size: 26px;
  letter-spacing: 1px;
  fill: var(--fhp-ink);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.7s ease 0.55s, transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.55s;
}
.fhp-soft { font-style: italic; font-weight: 400; font-size: 30px; letter-spacing: 0; }

.fhp-move {
  transition: transform 1.1s cubic-bezier(0.7, 0, 0.15, 1);
}
.fhp-par-back { transform: translate(calc(var(--fhp-mx) * -10px), calc(var(--fhp-my) * -6px)); transition: transform 0.5s ease-out; }
.fhp-par-front { transform: translate(calc(var(--fhp-mx) * 16px), calc(var(--fhp-my) * 10px)); transition: transform 0.5s ease-out; }

.fhp-pos-horse { transform: translate(270px, 262px) scale(0.82); }
.fhp-pos-wl { transform: translate(0px, 0px) scale(1); }
.fhp-pos-wr { transform: translate(0px, 0px) scale(1); }
.fhp-pos-yl { transform: translate(0px, 0px) scale(1); }
.fhp-pos-yr { transform: translate(0px, 0px) scale(1); }

.fhp-root[data-phase="seal"] .fhp-pos-horse,
.fhp-root[data-phase="verse"] .fhp-pos-horse,
.fhp-root[data-phase="lift"] .fhp-pos-horse { transform: translate(178px, 128px) scale(1.15); }
.fhp-root[data-phase="seal"] .fhp-pos-wl,
.fhp-root[data-phase="verse"] .fhp-pos-wl,
.fhp-root[data-phase="lift"] .fhp-pos-wl { transform: translate(-150px, 222px) scale(0.84); }
.fhp-root[data-phase="seal"] .fhp-pos-wr,
.fhp-root[data-phase="verse"] .fhp-pos-wr,
.fhp-root[data-phase="lift"] .fhp-pos-wr { transform: translate(150px, 222px) scale(0.84); }
.fhp-root[data-phase="seal"] .fhp-pos-yl,
.fhp-root[data-phase="verse"] .fhp-pos-yl,
.fhp-root[data-phase="lift"] .fhp-pos-yl { transform: translate(250px, -425px) scale(0.46); }
.fhp-root[data-phase="seal"] .fhp-pos-yr,
.fhp-root[data-phase="verse"] .fhp-pos-yr,
.fhp-root[data-phase="lift"] .fhp-pos-yr { transform: translate(-250px, -425px) scale(0.46); }

.fhp-root[data-phase="seal"] .fhp-word,
.fhp-root[data-phase="verse"] .fhp-word,
.fhp-root[data-phase="lift"] .fhp-word { fill: var(--fhp-ink); stroke: var(--fhp-ink); }
.fhp-root[data-phase="seal"] .fhp-year,
.fhp-root[data-phase="verse"] .fhp-year,
.fhp-root[data-phase="lift"] .fhp-year { fill: var(--fhp-ink); }
.fhp-root[data-phase="seal"] .fhp-tagline,
.fhp-root[data-phase="verse"] .fhp-tagline,
.fhp-root[data-phase="lift"] .fhp-tagline { opacity: 1; transform: translateY(0px); }

/* ---- the horse's paint, swapped when the seal lands ---------------------- */
.fhp-body { fill: var(--fhp-red); transition: fill 0.8s ease 0.15s; }
.fhp-limb { fill: none; stroke: var(--fhp-red); stroke-linecap: round; stroke-linejoin: round; transition: stroke 0.8s ease 0.15s; }
.fhp-tail { fill: var(--fhp-red); transition: fill 0.8s ease 0.25s; }
.fhp-tuft { fill: var(--fhp-red); transition: fill 0.8s ease 0.3s; }
.fhp-line { fill: none; stroke: var(--fhp-ink); stroke-linecap: round; stroke-linejoin: round; transition: stroke 0.8s ease 0.15s; }
.fhp-eye { fill: var(--fhp-ink); transition: fill 0.8s ease 0.15s; }
.fhp-root[data-phase="seal"] .fhp-body,
.fhp-root[data-phase="verse"] .fhp-body,
.fhp-root[data-phase="lift"] .fhp-body { fill: var(--fhp-cream); }
.fhp-root[data-phase="seal"] .fhp-limb,
.fhp-root[data-phase="verse"] .fhp-limb,
.fhp-root[data-phase="lift"] .fhp-limb { stroke: var(--fhp-cream); }
.fhp-root[data-phase="seal"] .fhp-tail,
.fhp-root[data-phase="verse"] .fhp-tail,
.fhp-root[data-phase="lift"] .fhp-tail,
.fhp-root[data-phase="seal"] .fhp-tuft,
.fhp-root[data-phase="verse"] .fhp-tuft,
.fhp-root[data-phase="lift"] .fhp-tuft { fill: var(--fhp-gold); }
.fhp-root[data-phase="seal"] .fhp-line,
.fhp-root[data-phase="verse"] .fhp-line,
.fhp-root[data-phase="lift"] .fhp-line { stroke: var(--fhp-gold); }
.fhp-root[data-phase="seal"] .fhp-eye,
.fhp-root[data-phase="verse"] .fhp-eye,
.fhp-root[data-phase="lift"] .fhp-eye { fill: var(--fhp-deep); }

.fhp-flick {
  transform-origin: 0px 0px;
  animation: fhp-flick 1.4s ease-in-out infinite;
}
@keyframes fhp-flick {
  0%, 100% { transform: scale(1, 1) skewX(0deg); }
  30% { transform: scale(0.93, 1.07) skewX(-5deg); }
  65% { transform: scale(1.05, 0.95) skewX(4deg); }
}
.fhp-horse:hover .fhp-flick { animation-duration: 0.38s !important; }
.fhp-bob { transform-origin: 260px 240px; animation: fhp-bob 4.2s ease-in-out infinite; }
@keyframes fhp-bob {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-7px) rotate(-0.6deg); }
}
.fhp-horse { cursor: pointer; }

/* ---- HUD ------------------------------------------------------------------ */
.fhp-hud {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: 1fr minmax(80px, 34cqw) 1fr;
  align-items: center;
  gap: 16px;
  padding: 0 clamp(16px, 4cqw, 44px) clamp(14px, 3.4cqh, 32px);
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--fhp-red);
  transition: color 0.8s ease, opacity 0.5s ease;
  pointer-events: none;
}
.fhp-hud-l { justify-self: start; white-space: nowrap; }
.fhp-hud-r { justify-self: end; white-space: nowrap; font-variant-numeric: tabular-nums; }
.fhp-track { position: relative; height: 1px; background: color-mix(in srgb, currentColor 28%, transparent); }
.fhp-fill { position: absolute; inset: 0; transform-origin: 0 50%; transform: scaleX(var(--fhp-p, 0)); background: currentColor; }
.fhp-fill::after {
  content: "";
  position: absolute;
  right: -3px;
  top: -2.5px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 10px 2px currentColor;
}
.fhp-root[data-phase="seal"] .fhp-hud,
.fhp-root[data-phase="verse"] .fhp-hud { color: var(--fhp-ink); }
.fhp-root[data-phase="seal"] .fhp-track,
.fhp-root[data-phase="verse"] .fhp-track { opacity: 0; transition: opacity 0.4s; }
.fhp-hint { animation: fhp-pulse 1.8s ease-in-out infinite; }
@keyframes fhp-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }

/* ---- the back of the card --------------------------------------------------- */
.fhp-ghost {
  position: absolute;
  left: 50%;
  bottom: -0.3em;
  transform: translateX(-50%);
  white-space: nowrap;
  font-family: var(--fhp-display);
  font-style: italic;
  font-weight: 600;
  font-size: min(36cqw, 52cqh);
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--fhp-deep);
  opacity: 0.75;
  pointer-events: none;
}
.fhp-glyph {
  position: absolute;
  top: 46%;
  font-size: min(11cqw, 15cqh);
  line-height: 1;
  color: var(--fhp-deep);
  opacity: 0.8;
}
.fhp-glyph-l { left: 13%; }
.fhp-glyph-r { right: 13%; }
.fhp-verse { position: relative; margin-top: -10cqh; }
.fhp-verse-title {
  margin: 0 0 clamp(14px, 3cqh, 28px);
  font-family: var(--fhp-display);
  font-size: clamp(16px, 3.4cqmin, 30px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fhp-deep);
}
.fhp-verse-line {
  margin: 0;
  font-size: clamp(17px, 3.6cqmin, 32px);
  line-height: 1.32;
  color: color-mix(in srgb, var(--fhp-cream) 82%, var(--fhp-gold));
  opacity: 0;
  filter: blur(6px);
  transform: translateY(10px);
}
.fhp-root[data-phase="verse"] .fhp-verse-line,
.fhp-root[data-phase="lift"] .fhp-verse-line {
  animation: fhp-ink-in 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.fhp-root[data-phase="verse"] .fhp-verse-title,
.fhp-root[data-phase="verse"] .fhp-glyph { animation: fhp-fade 1.2s ease both 0.6s; }
@keyframes fhp-ink-in { to { opacity: 1; filter: blur(0px); transform: translateY(0px); } }
@keyframes fhp-fade { from { opacity: 0; } }
.fhp-mark { color: var(--fhp-cream); }
.fhp-mark::before, .fhp-mark::after { color: var(--fhp-gold); }
.fhp-mark::before { content: "["; margin-right: 0.04em; }
.fhp-mark::after { content: "]"; margin-left: 0.04em; }
.fhp-back-hud { color: var(--fhp-deep); }

/* ---- loop rewind ------------------------------------------------------------ */
.fhp-veil {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: var(--fhp-ink);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.55s ease;
}
.fhp-veil[data-on="true"] { opacity: 1; }

.fhp-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@container (max-aspect-ratio: 4/5) {
  .fhp-hud { grid-template-columns: 1fr 1fr; }
  .fhp-hud > :nth-child(2) { grid-column: 1 / -1; grid-row: 1; }
  .fhp-glyph { top: 24%; font-size: 13cqw; }
  .fhp-glyph-l { left: 28%; }
  .fhp-glyph-r { right: 28%; }
}

@media (prefers-reduced-motion: reduce) {
  .fhp-flick, .fhp-bob, .fhp-glow, .fhp-hint { animation: none; }
  .fhp-embers { display: none; }
  .fhp-move, .fhp-seal, .fhp-par-back, .fhp-par-front { transition-duration: 0.01s; }
  .fhp-root[data-phase="verse"] .fhp-card,
  .fhp-root[data-phase="lift"] .fhp-card { animation: none; }
  .fhp-back { transform: none; opacity: 0; transition: opacity 0.4s ease; }
  .fhp-root[data-phase="verse"] .fhp-back,
  .fhp-root[data-phase="lift"] .fhp-back { opacity: 1; }
  .fhp-root[data-phase="verse"] .fhp-verse-line,
  .fhp-root[data-phase="lift"] .fhp-verse-line { animation: none; opacity: 1; filter: none; transform: none; }
  .fhp-root[data-phase="lift"] .fhp-gate { transform: none; opacity: 0; }
}
`

type Phase = "ink" | "seal" | "verse" | "lift" | "done"

const HOLD_SEAL_MS = 2100
const HOLD_VERSE_MS = 3000
const LIFT_MS = 1000
const REWIND_MS = 650

export default function FireHorsePreloader({
  children,
  loop = false,
  progress,
  durationMs = 3600,
  word = "Mã hóa",
  year = "2026",
  tagline = "Year of the Fire Horse",
  verseTitle = "Bính Ngọ",
  verse = DEFAULT_VERSE,
  glyphs = ["丙", "午"],
  showVerse = true,
  palette,
  fontFamily = DISPLAY_STACK,
  height = "100svh",
  onComplete,
  className = "",
}: FireHorsePreloaderProps) {
  const [phase, setPhase] = React.useState<Phase>("ink")
  const [pct, setPct] = React.useState(0)
  const [cycle, setCycle] = React.useState(0)
  const [veil, setVeil] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const brushRef = React.useRef<SVGPathElement>(null)
  const wordRefs = React.useRef<(SVGTextElement | null)[]>([])
  const rushRef = React.useRef(false)
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete

  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const colors = { ...DEFAULT_PALETTE, ...palette }
  const [wordL, wordR] = fhpSplit(word)
  const half = Math.ceil(year.length / 2)
  const yearL = year.slice(0, half)
  const yearR = year.slice(half)
  const controlled = progress !== undefined

  // ---- ink phase: drive the paint from progress, frame by frame ------------
  React.useEffect(() => {
    if (phase !== "ink") return
    const root = rootRef.current
    let raf = 0
    let shown = 0
    let last = performance.now()
    const start = last
    rushRef.current = false

    const paint = (p: number) => {
      root?.style.setProperty("--fhp-p", p.toFixed(4))
      const brush = brushRef.current
      if (brush) brush.style.strokeDashoffset = String(1 - clamp01((p - 0.04) / 0.86))
      const w = clamp01(p * 1.9)
      for (const el of wordRefs.current) {
        if (!el) continue
        el.style.strokeDasharray = "760px"
        el.style.strokeDashoffset = 760 * (1 - w) + "px"
        el.style.fillOpacity = String(clamp01((p - 0.28) * 3.2))
      }
      setPct(Math.round(p * 100))
    }

    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const external = progressRef.current
      let target =
        external !== undefined ? clamp01(external / 100) : fhpSimulated((now - start) / Math.max(400, durationMs))
      if (rushRef.current) target = 1
      // ease toward the target so stepped real progress still glides
      const rate = rushRef.current ? 0.16 : external !== undefined ? 0.1 : 1
      shown += (target - shown) * Math.min(1, rate * (dt / 16.7))
      if (target - shown < 0.002) shown = target
      paint(shown)
      if (shown >= 1) {
        setPhase("seal")
        return
      }
      raf = requestAnimationFrame(tick)
    }
    paint(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, cycle, durationMs])

  // ---- holds between phases --------------------------------------------------
  const advance = React.useCallback(() => {
    setPhase((p) => {
      if (p === "ink") {
        rushRef.current = true
        return p
      }
      if (p === "seal") return showVerse ? "verse" : loop ? "seal" : "lift"
      if (p === "verse") return loop ? p : "lift"
      return p
    })
  }, [showVerse, loop])

  const rewind = React.useCallback(() => {
    setVeil(true)
    const t = setTimeout(() => {
      setPhase("ink")
      setCycle((c) => c + 1)
      setVeil(false)
    }, REWIND_MS)
    return () => clearTimeout(t)
  }, [])

  React.useEffect(() => {
    if (phase === "seal") {
      const t = setTimeout(() => {
        if (showVerse) setPhase("verse")
        else if (loop) setVeil(true)
        else setPhase("lift")
      }, HOLD_SEAL_MS)
      return () => clearTimeout(t)
    }
    if (phase === "verse") {
      const t = setTimeout(() => {
        if (loop) setVeil(true)
        else setPhase("lift")
      }, HOLD_VERSE_MS)
      return () => clearTimeout(t)
    }
    if (phase === "lift") {
      const t = setTimeout(() => {
        setPhase("done")
        onCompleteRef.current?.()
      }, LIFT_MS)
      return () => clearTimeout(t)
    }
  }, [phase, loop, showVerse])

  // the veil goes up, the stage resets beneath it, the veil comes down
  React.useEffect(() => {
    if (!veil || phase === "ink") return
    return rewind()
  }, [veil, phase, rewind])

  // in loop mode a click on the last face rewinds straight away
  const onActivate = () => {
    if (loop && (phase === "verse" || (phase === "seal" && !showVerse))) setVeil(true)
    else advance()
  }

  // ---- pointer parallax -------------------------------------------------------
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current
    if (!root || e.pointerType === "touch") return
    const r = root.getBoundingClientRect()
    root.style.setProperty("--fhp-mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
    root.style.setProperty("--fhp-my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
  }
  const onPointerLeave = () => {
    rootRef.current?.style.setProperty("--fhp-mx", "0")
    rootRef.current?.style.setProperty("--fhp-my", "0")
  }

  const loading = phase === "ink"
  const p = pct / 100
  const hint = loop ? "Tap to turn" : "Tap to enter"

  return (
    <div
      ref={rootRef}
      className={"fhp-root " + className}
      data-phase={phase}
      style={
        {
          height,
          "--fhp-ink": colors.ink,
          "--fhp-red": colors.red,
          "--fhp-deep": colors.deep,
          "--fhp-cream": colors.cream,
          "--fhp-gold": colors.gold,
          "--fhp-display": fontFamily,
          "--fhp-text": TEXT_STACK,
        } as React.CSSProperties
      }
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <style>{FHP_CSS}</style>

      {!loop && children ? (
        <div className="fhp-dest" data-active={phase === "done"} aria-hidden={phase !== "done"}>
          {children}
        </div>
      ) : null}

      {phase !== "done" ? (
        <div
          className="fhp-gate"
          role="progressbar"
          aria-label={word + " — " + tagline}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={loading ? pct + "%" : "Loaded. Press Enter to continue."}
          tabIndex={0}
          onClick={onActivate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onActivate()
            }
          }}
        >
          <div className="fhp-card" key={cycle}>
            {/* ---- front: ink, then seal ---- */}
            <div className="fhp-face fhp-front">
              <div className="fhp-seal">
                <Clouds id={"fhp-c-" + uid} />
              </div>
              <div className="fhp-glow" />
              <div className="fhp-embers" aria-hidden="true">
                {EMBERS.map(([left, size, dur, delay, drift], i) => (
                  <span
                    key={i}
                    className="fhp-ember"
                    style={
                      {
                        left: left + "%",
                        width: size,
                        height: size,
                        animationDuration: dur + "s",
                        animationDelay: delay + "s",
                        "--fhp-drift": drift + "px",
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>

              <svg className="fhp-scene" viewBox="30 0 940 760" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <g className="fhp-par-back">
                  <g transform="translate(486 240)">
                    <g className="fhp-move fhp-pos-wl">
                      <text ref={(el) => { wordRefs.current[0] = el }} className="fhp-word" textAnchor="end">
                        {wordL}
                      </text>
                    </g>
                  </g>
                  <g transform="translate(530 240)">
                    <g className="fhp-move fhp-pos-wr">
                      <text ref={(el) => { wordRefs.current[1] = el }} className="fhp-word" textAnchor="start">
                        {wordR}
                      </text>
                    </g>
                  </g>
                  <g transform="translate(250 470)">
                    <g className="fhp-move fhp-pos-yl">
                      <text className="fhp-year" textAnchor="end">
                        {loading ? fhpCount(yearL, p) : yearL}
                      </text>
                    </g>
                  </g>
                  <g transform="translate(750 470)">
                    <g className="fhp-move fhp-pos-yr">
                      <text className="fhp-year" textAnchor="start">
                        {loading ? fhpCount(yearR, p) : yearR}
                      </text>
                    </g>
                  </g>
                  <text className="fhp-tagline" x="500" y="716" textAnchor="middle">
                    <Tagline text={tagline} />
                  </text>
                </g>
                <g className="fhp-par-front">
                  <g className="fhp-move fhp-pos-horse">
                    <g className="fhp-bob">
                      <Horse maskId={"fhp-m-" + uid} brushRef={brushRef} />
                    </g>
                  </g>
                </g>
              </svg>

              <div className="fhp-hud" aria-hidden="true">
                <span className="fhp-hud-l">
                  {verseTitle} · {glyphs.join("")}
                </span>
                <span className="fhp-track">
                  <span className="fhp-fill" />
                </span>
                <span className={"fhp-hud-r" + (loading ? "" : " fhp-hint")}>
                  {loading ? String(pct).padStart(3, "0") + " %" : hint}
                </span>
              </div>
            </div>

            {/* ---- back: the verse ---- */}
            {showVerse ? (
              <div className="fhp-face fhp-back">
                <Clouds id={"fhp-cb-" + uid} />
                <div className="fhp-ghost" aria-hidden="true">
                  {word}
                </div>
                <span className="fhp-glyph fhp-glyph-l" aria-hidden="true">
                  {glyphs[0]}
                </span>
                <span className="fhp-glyph fhp-glyph-r" aria-hidden="true">
                  {glyphs[1]}
                </span>
                <div className="fhp-verse">
                  <p className="fhp-verse-title">{verseTitle}</p>
                  {verse.map((line, i) => (
                    <p key={i} className="fhp-verse-line" style={{ animationDelay: 0.75 + i * 0.22 + "s" }}>
                      {fhpVerse(line).map((run, j) =>
                        run.mark ? (
                          <span key={j} className="fhp-mark">
                            {run.text}
                          </span>
                        ) : (
                          <React.Fragment key={j}>{run.text}</React.Fragment>
                        ),
                      )}
                    </p>
                  ))}
                </div>
                <div className="fhp-hud fhp-back-hud" aria-hidden="true">
                  <span className="fhp-hud-l">{year}</span>
                  <span />
                  <span className="fhp-hud-r fhp-hint">{hint}</span>
                </div>
              </div>
            ) : null}
          </div>
          <div className="fhp-veil" data-on={veil} />
          <span className="fhp-sr" aria-live="polite">
            {loading ? "" : tagline}
          </span>
        </div>
      ) : null}
    </div>
  )
}
