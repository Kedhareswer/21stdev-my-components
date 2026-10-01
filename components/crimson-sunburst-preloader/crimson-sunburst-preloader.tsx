"use client"

// Crimson Sunburst Preloader — a concert-poster loading gate that resolves
// into the landing page it was guarding. While the load runs, an astrolabe
// draws itself around a compass-rose sun, red and slate rays shoot out of it
// one by one, the sun's inner ring lights segment by segment and the title
// slot counts up in quotes. At 100% the sun ignites: a flash, a shockwave,
// and the count is replaced letter by letter with the show's title, the
// credits, the links and a ticket button. Then it stays, as the hero.
//
// Pointer moves tilt the rays and parallax the dial and the clouds; a warm
// lantern follows the cursor; the sun is a button that spins and throws
// sparks. One file, React only: every shape is inline SVG, the print grain is
// an SVG turbulence filter, every rule in the scoped <style> is .csp-
// prefixed and no font is fetched.

import * as React from "react"

export interface CrimsonSunburstPalette {
  /** Stage background and the darkest ink. */
  ink: string
  /** The red rays and the sun disc. */
  red: string
  /** Hot red: flames, ray highlights, the shockwave. */
  ember: string
  /** Shadow red: the dial, unlit sun segments, ray tails. */
  deep: string
  /** The cold rays between the red ones. */
  slate: string
  /** Type, sun spikes, clouds. */
  cream: string
  /** Foil flecks, the frame filigree, hover accents. */
  gold: string
}

export interface CrimsonSunburstLink {
  label: string
  href?: string
}

export interface CrimsonSunburstPreloaderProps {
  /** Performer line above the title. */
  artist?: string
  /** Second line above the title. */
  eyebrow?: string
  /** The big word. Wrapped in curly quotes unless `quotes` is false. */
  title?: string
  /** Wrap the title (and the loading count) in “curly quotes”. Defaults to true. */
  quotes?: boolean
  /** Small date line in the bottom-left credits. */
  date?: string
  /** Venue lines under the credits. */
  venue?: string[]
  /** Top-left label inside the frame. */
  meta?: string
  /** Top-right links inside the frame. */
  links?: CrimsonSunburstLink[]
  /** Ticket button label. Pass an empty string to hide the button. */
  ctaLabel?: string
  /** Turns the ticket button into a link. */
  ctaHref?: string
  /** Fired when the ticket button is pressed. */
  onCta?: () => void
  /** Status lines shown under the count while loading, stepped through by progress. */
  statusLines?: string[]
  /** Number of rays around the sun. Defaults to 28. */
  rays?: number
  /**
   * Real loading progress, 0–100. Leave undefined to run the built-in
   * simulated load over `durationMs`. The load holds until this hits 100.
   */
  progress?: number
  /** Length of the simulated load. Defaults to 3800ms. */
  durationMs?: number
  /** Replay the whole sequence forever as a showcase. onComplete never fires. */
  loop?: boolean
  /** Show the small replay control on the landing. Defaults to true. */
  showReplay?: boolean
  /** Colour overrides, merged over the defaults. */
  palette?: Partial<CrimsonSunburstPalette>
  /** Display face for the title. The default stack never fetches anything. */
  fontFamily?: string
  /** Face for the overline, credits and labels. */
  textFamily?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Fired once the landing has been revealed. */
  onComplete?: () => void
  /** Extra root class names. */
  className?: string
}

const DEFAULT_PALETTE: CrimsonSunburstPalette = {
  ink: "#130a09",
  red: "#a8232a",
  ember: "#d5503a",
  deep: "#5a1215",
  slate: "#25322f",
  cream: "#ebd6b3",
  gold: "#d7a548",
}

const DISPLAY_STACK =
  '"Bodoni Moda", "Playfair Display", Didot, "Bodoni 72", "Noto Serif Display", Georgia, "Times New Roman", serif'
const TEXT_STACK = '"Roboto Slab", "Zilla Slab", Rockwell, "Rockwell Nova", "Courier Prime", Georgia, serif'

const DEFAULT_LINKS: CrimsonSunburstLink[] = [
  { label: "Setlist", href: "#setlist" },
  { label: "Venue", href: "#venue" },
  { label: "Tickets", href: "#tickets" },
]
const DEFAULT_STATUS = ["Tuning the light", "Raising the rays", "Lighting the sun", "Opening the doors"]
const DEFAULT_VENUE = ["Ashwood Forest", "Sport Plaza"]

// #region timeline
// Pure helpers, lifted out and executed by tests/crimson-sunburst-preloader.test.mjs.

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x)

// Surges with two short stalls, so a simulated load reads like a real one.
// [time, progress] knots, eased between.
const KNOTS = [
  [0, 0],
  [0.28, 0.36],
  [0.38, 0.39],
  [0.66, 0.77],
  [0.76, 0.8],
  [1, 1],
]

export function cspSimulated(t: number) {
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

// 0.64 -> "064": the count keeps a fixed width so the title slot doesn't jitter.
export function cspCount(p: number) {
  return String(Math.round(clamp01(p) * 100)).padStart(3, "0")
}

// How many of the sun's ring segments are lit at progress p.
export function cspLit(p: number, segments: number) {
  return Math.floor(clamp01(p) * segments + 1e-9)
}

// The status line for progress p, stepping evenly through the list.
export function cspStatus(p: number, lines: string[]) {
  if (!lines.length) return ""
  return lines[Math.min(lines.length - 1, Math.floor(clamp01(p) * lines.length))]
}

// Deterministic 0..1 hash, so server and client draw the same sky.
export function cspHash(i: number, n: number) {
  const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
  return x - Math.floor(x)
}

// The ray fan. Evenly spaced with jitter, alternating red and cold, each with
// its own half-angle and the progress at which it starts to shoot out.
export function cspRays(count: number) {
  const n = Math.max(6, Math.round(count))
  const step = 360 / n
  return Array.from({ length: n }, (_, i) => {
    const raw = i * step + (cspHash(i, 1) - 0.5) * step * 0.55
    const angle = Math.round((((raw % 360) + 360) % 360) * 10) / 10
    const half = Math.round((1.1 + cspHash(i, 2) * 3.1) * 10) / 10
    const tone = i % 2 === 0 ? 0 : cspHash(i, 3) > 0.3 ? 1 : 2
    const start = Math.round(cspHash(i, 4) * 0.62 * 1000) / 1000
    return { angle, half, tone, start }
  })
}

// Title size in cqw: as large as fits the width for this many characters.
export function cspFit(chars: number) {
  const size = 96 / (Math.max(1, chars) * 0.7)
  return Math.round(Math.min(17, size) * 10) / 10
}
// #endregion

// ---------------------------------------------------------------------------
// Geometry. The sun and dial share a 240-unit box centred on the origin; the
// rays live in a 2000-unit box centred on the same point.
// ---------------------------------------------------------------------------

const f1 = (n: number) => Math.round(n * 10) / 10
const polar = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return f1(r * Math.cos(a)) + " " + f1(r * Math.sin(a))
}
const ringAt = (cx: number, cy: number, r: number) =>
  "M" + cx + " " + (cy - r) + "A" + r + " " + r + " 0 1 1 " + cx + " " + (cy + r) + "A" + r + " " + r + " 0 1 1 " + cx + " " + (cy - r)
const ring = (r: number) => ringAt(0, 0, r)
const arc = (r: number, a0: number, a1: number) =>
  "M" + polar(r, a0) + "A" + r + " " + r + " 0 " + (a1 - a0 > 180 ? 1 : 0) + " 1 " + polar(r, a1)
const wedge = (r0: number, r1: number, a0: number, a1: number) =>
  "M" + polar(r0, a0) + "L" + polar(r1, a0) + "A" + r1 + " " + r1 + " 0 0 1 " + polar(r1, a1) +
  "L" + polar(r0, a1) + "A" + r0 + " " + r0 + " 0 0 0 " + polar(r0, a0) + "Z"

// A faceted spike: two triangles meeting on the spine, lit and shadow side.
const spike = (r0: number, r1: number, half: number, deg: number): [string, string] => [
  "M" + polar(r0, deg - half) + "L" + polar(r1, deg) + "L" + polar(r0 * 0.94, deg) + "Z",
  "M" + polar(r0 * 0.94, deg) + "L" + polar(r1, deg) + "L" + polar(r0, deg + half) + "Z",
]

// A four-point sparkle with concave sides, h tall and w wide.
const sparkle = (h: number, w: number) => {
  const s = f1(w * 0.16)
  return (
    "M0 " + f1(-h) + "Q" + s + " " + -s + " " + f1(w) + " 0Q" + s + " " + s + " 0 " + f1(h) +
    "Q" + -s + " " + s + " " + f1(-w) + " 0Q" + -s + " " + -s + " 0 " + f1(-h) + "Z"
  )
}

// One swirling flame tongue rising from r = 52, curling to the right.
const FLAME =
  "M-10 -50C-16 -66 4 -76 -2 -90C-6 -101 3 -110 13 -114C7 -105 9 -97 14 -89C23 -73 12 -62 10 -50Z"

const SEGMENTS = 16

const SPIKES_LONG = Array.from({ length: 8 }, (_, i) => spike(50, 118, 8.5, i * 45))
const SPIKES_SHORT = Array.from({ length: 8 }, (_, i) => spike(50, 88, 7, i * 45 + 22.5))
const STAR_LONG = Array.from({ length: 4 }, (_, i) => spike(9, 44, 22, i * 90))
const STAR_SHORT = Array.from({ length: 4 }, (_, i) => spike(8, 30, 20, i * 90 + 45))
const SEGMENT_PATHS = Array.from({ length: SEGMENTS }, (_, i) =>
  wedge(28, 45, i * (360 / SEGMENTS) + 1.6, (i + 1) * (360 / SEGMENTS) - 1.6),
)

// The astrolabe: [path, stroke class, draw delay].
const DIAL: [string, string, number][] = [
  [ring(64), "csp-ln csp-ln-ember", 0],
  [ring(124), "csp-ln csp-ln-red", 0.1],
  [ring(198), "csp-ln csp-ln-thick", 0.2],
  [ring(264), "csp-ln csp-ln-red", 0.3],
  [ring(344), "csp-ln csp-ln-faint", 0.42],
  [ringAt(70, -36, 214), "csp-ln csp-ln-faint", 0.36],
  [ringAt(-84, 30, 246), "csp-ln csp-ln-faint", 0.48],
  ["M-340 -112L340 150", "csp-ln csp-ln-red", 0.52],
  ["M-300 196L290 -214", "csp-ln csp-ln-faint", 0.58],
  [arc(232, 200, 318), "csp-ln csp-ln-arc", 0.62],
  [arc(232, 18, 74), "csp-ln csp-ln-arc", 0.68],
  [arc(300, 96, 150), "csp-ln csp-ln-arc", 0.74],
]
const TICKS = Array.from({ length: 72 }, (_, i) =>
  "M" + polar(198, i * 5) + "L" + polar(i % 6 === 0 ? 214 : 206, i * 5),
).join("")

// Gold foil flecks over the whole frame: irregular quads.
const FLECKS = Array.from({ length: 74 }, (_, i) => {
  const h = (n: number) => cspHash(i + 400, n)
  const x = h(1) * 1000
  const y = 80 + h(2) * 900
  const s = 1.6 + Math.pow(h(3), 2.2) * 9
  const pts = [0, 1, 2, 3]
    .map((k) => {
      const a = k * 1.5708 + h(4 + k) * 0.9
      const r = s * (0.45 + h(8 + k) * 0.7)
      return f1(x + Math.cos(a) * r) + "," + f1(y + Math.sin(a) * r)
    })
    .join(" ")
  return { pts, glint: h(12) > 0.62, delay: f1(h(13) * -6), cream: h(14) > 0.8 }
})

const LEFT_STARS: [number, number, number][] = [
  [70, 610, 30],
  [210, 760, 18],
  [120, 470, 12],
]

// ---------------------------------------------------------------------------
// Pieces. Each is memoised so the per-frame progress render stays cheap.
// ---------------------------------------------------------------------------

const Rays = React.memo(function Rays({ count, uid }: { count: number; uid: string }) {
  const rays = React.useMemo(() => cspRays(count), [count])
  const tones = ["csp-g-red-" + uid, "csp-g-slate-" + uid, "csp-g-deep-" + uid]
  return (
    <svg className="csp-rays" viewBox="-1000 -1000 2000 2000" aria-hidden="true">
      <defs>
        <linearGradient id={tones[0]} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-1000">
          <stop offset="0" style={{ stopColor: "var(--csp-ember)" }} />
          <stop offset="0.45" style={{ stopColor: "var(--csp-red)" }} />
          <stop offset="1" style={{ stopColor: "var(--csp-deep)" }} />
        </linearGradient>
        <linearGradient id={tones[1]} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-1000">
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--csp-slate) 70%, var(--csp-cream))" }} />
          <stop offset="0.4" style={{ stopColor: "var(--csp-slate)" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--csp-slate) 55%, var(--csp-ink))" }} />
        </linearGradient>
        <linearGradient id={tones[2]} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-1000">
          <stop offset="0" style={{ stopColor: "var(--csp-red)" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--csp-deep) 70%, var(--csp-ink))" }} />
        </linearGradient>
      </defs>
      <g className="csp-rays-tilt">
        <g className="csp-rays-turn">
          {rays.map((ray, i) => {
            const w = f1(1000 * Math.tan((ray.half * Math.PI) / 180))
            const sparkleAt = cspHash(i, 6) > 0.3
            const rr = f1(230 + cspHash(i, 7) * 520)
            const sh = f1(11 + cspHash(i, 8) * 20)
            return (
              <g key={i} transform={"rotate(" + ray.angle + ")"}>
                <g className="csp-ray" style={{ "--csp-t": ray.start } as React.CSSProperties}>
                  <polygon points={"-1.5,0 1.5,0 " + w + ",-1000 " + -w + ",-1000"} fill={"url(#" + tones[ray.tone] + ")"} />
                  {ray.tone === 0 ? (
                    <polygon className="csp-ray-edge" points={"0,0 " + -w + ",-1000 " + f1(-w * 0.62) + ",-1000"} />
                  ) : null}
                  {sparkleAt ? (
                    <path
                      className={"csp-spark " + (cspHash(i, 9) > 0.45 ? "csp-spark-cream" : "csp-spark-ember")}
                      d={sparkle(sh, sh * 0.4)}
                      transform={"translate(" + f1((cspHash(i, 10) - 0.5) * w * 0.5 * (rr / 1000)) + " " + -rr + ")"}
                      style={{ animationDelay: f1(cspHash(i, 11) * -4) + "s" }}
                    />
                  ) : null}
                </g>
              </g>
            )
          })}
        </g>
      </g>
    </svg>
  )
})

const Dial = React.memo(function Dial({ uid }: { uid: string }) {
  return (
    <svg className="csp-dial" viewBox="-120 -120 240 240" aria-hidden="true">
      <defs>
        <radialGradient id={"csp-disc-" + uid} cx="0" cy="0" r="210" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--csp-deep)", stopOpacity: 0.95 }} />
          <stop offset="0.72" style={{ stopColor: "var(--csp-deep)", stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: "var(--csp-ink)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <circle className="csp-disc" r="214" fill={"url(#csp-disc-" + uid + ")"} />
      {DIAL.map(([d, cls, delay], i) => (
        <path key={i} className={cls} d={d} pathLength={1} data-csp-draw={delay} />
      ))}
      <path className="csp-ln csp-ticks" d={TICKS} />
      <path className="csp-ln csp-dash" d={ring(150)} />
    </svg>
  )
})

const Sun = React.memo(function Sun({ lit, uid }: { lit: number; uid: string }) {
  return (
    <svg className="csp-sun-svg" viewBox="-120 -120 240 240" aria-hidden="true">
      <defs>
        <radialGradient id={"csp-halo-" + uid} cx="0" cy="0" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0.3" style={{ stopColor: "var(--csp-ember)", stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: "var(--csp-ember)", stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={"csp-flame-" + uid} gradientUnits="userSpaceOnUse" x1="0" y1="-50" x2="0" y2="-114">
          <stop offset="0" style={{ stopColor: "var(--csp-red)" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--csp-cream) 45%, var(--csp-ember))" }} />
        </linearGradient>
      </defs>
      <circle className="csp-halo" r="120" fill={"url(#csp-halo-" + uid + ")"} />
      <g className="csp-flames">
        {Array.from({ length: 10 }, (_, i) => (
          <g key={i} transform={"rotate(" + (i * 36 + 9) + ")"}>
            <path className="csp-flame" d={FLAME} fill={"url(#csp-flame-" + uid + ")"} style={{ animationDelay: -i * 0.31 + "s" }} />
          </g>
        ))}
      </g>
      <g className="csp-spikes">
        {SPIKES_SHORT.map(([a, b], i) => (
          <g key={"s" + i}>
            <path className="csp-facet-hot" d={a} />
            <path className="csp-facet-red" d={b} />
          </g>
        ))}
        {SPIKES_LONG.map(([a, b], i) => (
          <g key={"l" + i}>
            <path className="csp-facet-cream" d={a} />
            <path className="csp-facet-hot" d={b} />
          </g>
        ))}
      </g>
      <circle className="csp-sun-disc" r="54" />
      <path className="csp-sun-rim" d={ring(49)} />
      {SEGMENT_PATHS.map((d, i) => (
        <path key={i} className="csp-seg" data-lit={i < lit} d={d} />
      ))}
      <g className="csp-compass">
        {STAR_SHORT.map(([a, b], i) => (
          <g key={"c" + i}>
            <path className="csp-facet-hot" d={a} />
            <path className="csp-facet-red" d={b} />
          </g>
        ))}
        {STAR_LONG.map(([a, b], i) => (
          <g key={"d" + i}>
            <path className="csp-facet-cream" d={a} />
            <path className="csp-facet-shade" d={b} />
          </g>
        ))}
        <circle className="csp-sun-core" r="4" />
      </g>
    </svg>
  )
})

const Clouds = React.memo(function Clouds({ uid }: { uid: string }) {
  const g = (k: string) => "csp-" + k + "-" + uid
  return (
    <svg className="csp-clouds" viewBox="0 0 600 640" aria-hidden="true">
      <defs>
        <radialGradient id={g("m1")} cx="0.34" cy="0.3" r="0.78">
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--csp-cream) 55%, var(--csp-ember))" }} />
          <stop offset="0.42" style={{ stopColor: "var(--csp-ember)" }} />
          <stop offset="0.8" style={{ stopColor: "var(--csp-red)" }} />
          <stop offset="1" style={{ stopColor: "var(--csp-deep)" }} />
        </radialGradient>
        <radialGradient id={g("m2")} cx="0.3" cy="0.28" r="0.8">
          <stop offset="0" style={{ stopColor: "var(--csp-red)" }} />
          <stop offset="0.65" style={{ stopColor: "var(--csp-deep)" }} />
          <stop offset="1" style={{ stopColor: "var(--csp-ink)" }} />
        </radialGradient>
        <linearGradient id={g("cl")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--csp-cream)" }} />
          <stop offset="0.55" style={{ stopColor: "color-mix(in srgb, var(--csp-cream) 50%, var(--csp-ember))" }} />
          <stop offset="1" style={{ stopColor: "var(--csp-red)" }} />
        </linearGradient>
      </defs>

      <g className="csp-par-far">
        <g className="csp-float" style={{ animationDelay: "-1.2s" }}>
          <circle cx="438" cy="168" r="124" fill={"url(#" + g("m1") + ")"} />
          <circle className="csp-crater" cx="400" cy="140" r="16" />
          <circle className="csp-crater" cx="470" cy="214" r="24" />
          <circle className="csp-crater" cx="486" cy="120" r="9" />
        </g>
        <g className="csp-float" style={{ animationDelay: "-3.4s", animationDuration: "9s" }}>
          <circle cx="566" cy="338" r="96" fill={"url(#" + g("m2") + ")"} />
        </g>
      </g>

      <g className="csp-par-mid">
        <g className="csp-float" style={{ animationDelay: "-2.1s", animationDuration: "8s" }}>
          <circle cx="392" cy="442" r="66" className="csp-dark-moon" />
          <g fill={"url(#" + g("cl") + ")"}>
            <circle cx="300" cy="420" r="44" />
            <circle cx="350" cy="398" r="54" />
            <circle cx="404" cy="428" r="42" />
            <circle cx="258" cy="446" r="32" />
            <rect x="258" y="420" width="150" height="58" rx="29" />
          </g>
          <path className="csp-curl" d="M262 452C246 430 268 410 288 424C300 434 290 448 280 442" />
          <path className="csp-curl" d="M392 404C404 384 432 392 428 414" />
        </g>
        <g className="csp-ribbon">
          <path d="M296 322C362 280 452 296 472 350C488 396 440 426 404 406C378 392 390 360 418 366" />
          <path d="M324 478C396 446 482 472 474 524C466 560 420 566 404 540" />
        </g>
      </g>

      <g className="csp-par-near">
        <g className="csp-float" style={{ animationDelay: "-0.4s", animationDuration: "10s" }}>
          <g fill={"url(#" + g("cl") + ")"}>
            <circle cx="250" cy="572" r="88" />
            <circle cx="344" cy="530" r="80" />
            <circle cx="438" cy="566" r="96" />
            <circle cx="176" cy="612" r="66" />
            <circle cx="530" cy="598" r="84" />
            <circle cx="330" cy="618" r="104" />
          </g>
          <path className="csp-curl" d="M184 598C168 566 200 540 226 556C244 568 236 592 218 588C206 585 206 572 214 570" />
          <path className="csp-curl" d="M330 540C320 508 352 488 376 500C394 510 390 532 374 532" />
          <path className="csp-curl" d="M470 556C478 528 512 524 524 544" />
        </g>
        <g className="csp-dark-stars">
          <path d={sparkle(46, 22)} transform="translate(236 352) rotate(-12)" />
          <path d={sparkle(32, 15)} transform="translate(528 470) rotate(8)" />
          <path d={sparkle(22, 10)} transform="translate(196 478)" />
          <path d={sparkle(26, 12)} transform="translate(574 112) rotate(14)" />
        </g>
      </g>
    </svg>
  )
})

const Flecks = React.memo(function Flecks() {
  return (
    <svg className="csp-flecks" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {FLECKS.map((f, i) => (
        <polygon
          key={i}
          points={f.pts}
          className={(f.cream ? "csp-fleck csp-fleck-cream" : "csp-fleck") + (f.glint ? " csp-glint" : "")}
          style={f.glint ? { animationDelay: f.delay + "s" } : undefined}
        />
      ))}
      <g className="csp-dark-stars">
        {LEFT_STARS.map(([x, y, s], i) => (
          <path key={i} d={sparkle(s, s * 0.46)} transform={"translate(" + x + " " + y + ")"} />
        ))}
      </g>
    </svg>
  )
})

// Print grain, mottled ink spots and long scratches, plus the filter that
// roughens the title. All one static SVG, promoted to its own layer.
const Grain = React.memo(function Grain({ uid }: { uid: string }) {
  return (
    <svg className="csp-grain" aria-hidden="true">
      <defs>
        <filter id={"csp-fine-" + uid} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.03  0 0 0 0 0.02  0 0 0 -1.6 1.15" />
        </filter>
        <filter id={"csp-spots-" + uid} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={4} seed={7} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.02  0 0 0 0 0.02  10 0 0 0 -6.3" />
        </filter>
        <filter id={"csp-scratch-" + uid} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0015 0.32" numOctaves={2} seed={11} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.92  0 0 0 0 0.84  0 0 0 0 0.7  16 0 0 0 -11.6" />
        </filter>
        <filter id={"csp-rough-" + uid} x="-4%" y="-8%" width="108%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045 0.6" numOctaves={3} seed={3} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  12 0 0 0 -7.4" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="out" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter={"url(#csp-spots-" + uid + ")"} opacity="0.32" />
      <rect width="100%" height="100%" filter={"url(#csp-scratch-" + uid + ")"} opacity="0.16" />
      <rect width="100%" height="100%" filter={"url(#csp-fine-" + uid + ")"} opacity="0.5" />
    </svg>
  )
})

// The filigree band around the frame: one tile, repeated along each edge.
const Frame = React.memo(function Frame({ uid }: { uid: string }) {
  const h = "csp-fh-" + uid
  const v = "csp-fv-" + uid
  const tile = (
    <>
      <path d="M0 7C4 1 10 1 12 5C13.6 8.4 10.4 10.6 8.6 8.6C7.4 7.2 8.6 5.6 10 6.2" />
      <path d="M28 7C24 13 18 13 16 9C14.4 5.6 17.6 3.4 19.4 5.4C20.6 6.8 19.4 8.4 18 7.8" />
      <circle cx="14" cy="7" r="1.3" className="csp-fil-dot" />
    </>
  )
  return (
    <div className="csp-frame" aria-hidden="true">
      <svg className="csp-strip csp-strip-t">
        <defs>
          <pattern id={h} width="28" height="14" patternUnits="userSpaceOnUse">{tile}</pattern>
          <pattern id={v} width="14" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(90) translate(0 -14)">
            {tile}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={"url(#" + h + ")"} />
      </svg>
      <svg className="csp-strip csp-strip-b">
        <rect width="100%" height="100%" fill={"url(#" + h + ")"} />
      </svg>
      <svg className="csp-strip csp-strip-l">
        <rect width="100%" height="100%" fill={"url(#" + v + ")"} />
      </svg>
      <svg className="csp-strip csp-strip-r">
        <rect width="100%" height="100%" fill={"url(#" + v + ")"} />
      </svg>
      <div className="csp-rule">
        <span className="csp-notch csp-notch-tl" />
        <span className="csp-notch csp-notch-tr" />
        <span className="csp-notch csp-notch-bl" />
        <span className="csp-notch csp-notch-br" />
      </div>
      <svg className="csp-crest" viewBox="-40 -14 80 28">
        <path d="M-36 0L-14 0M14 0L36 0" />
        <path d="M0 -11L7 0L0 11L-7 0Z" className="csp-crest-fill" />
        <path d="M-14 0C-10 -8 -4 -8 -3 -3M14 0C10 -8 4 -8 3 -3M-14 0C-10 8 -4 8 -3 3M14 0C10 8 4 8 3 3" />
      </svg>
    </div>
  )
})

const CSP_CSS = `
.csp-root {
  --csp-mx: 0;
  --csp-my: 0;
  --csp-px: 50%;
  --csp-py: 40%;
  --csp-sy: 21%;
  --csp-sun: min(54cqw, 36cqh);
  --csp-in: clamp(6px, 1.5cqmin, 14px);
  --csp-band: clamp(10px, 1.6cqmin, 14px);
  --csp-rule: calc(var(--csp-in) + var(--csp-band) + clamp(6px, 1.4cqmin, 12px));
  position: relative;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
  container-type: size;
  background:
    radial-gradient(70cqmax 60cqmax at 50% var(--csp-sy), color-mix(in srgb, var(--csp-deep) 70%, var(--csp-ink)) 0%, var(--csp-ink) 62%),
    var(--csp-ink);
  color: var(--csp-cream);
  font-family: var(--csp-text);
  -webkit-tap-highlight-color: transparent;
}
.csp-root svg { max-width: none; overflow: visible; display: block; }
.csp-layer { position: absolute; inset: 0; pointer-events: none; }
/* ---- dial, rays, sun: all centred on the sun point --------------------- */
.csp-anchor {
  position: absolute;
  left: 50%;
  top: var(--csp-sy);
  width: 0;
  height: 0;
}
.csp-dial-box, .csp-sun-box {
  position: absolute;
  left: calc(var(--csp-sun) * -0.5);
  top: calc(var(--csp-sun) * -0.5);
  width: var(--csp-sun);
  height: var(--csp-sun);
}
.csp-dial-box { transform: translate(calc(var(--csp-mx) * -10px), calc(var(--csp-my) * -6px)); transition: transform 0.6s ease-out; }
.csp-dial, .csp-sun-svg { width: 100%; height: 100%; }
.csp-disc { opacity: calc(var(--csp-p, 0) * 1.3); }
.csp-ln { fill: none; stroke-linecap: round; stroke-dasharray: 1 1; stroke-dashoffset: 1; }
.csp-ln-ember { stroke: var(--csp-ember); stroke-width: 0.9; opacity: 0.8; }
.csp-ln-red { stroke: var(--csp-red); stroke-width: 0.8; opacity: 0.85; }
.csp-ln-thick { stroke: var(--csp-red); stroke-width: 2.6; opacity: 0.7; }
.csp-ln-faint { stroke: var(--csp-red); stroke-width: 0.5; opacity: 0.55; }
.csp-ln-arc { stroke: var(--csp-ember); stroke-width: 3.4; opacity: 0.55; }
.csp-ticks { stroke: var(--csp-red); stroke-width: 0.7; stroke-dasharray: none; stroke-dashoffset: 0; opacity: calc((var(--csp-p, 0) - 0.3) * 1.2); }
.csp-dash { stroke: var(--csp-ember); stroke-width: 0.6; stroke-dasharray: 2 3; stroke-dashoffset: 0; opacity: calc(var(--csp-p, 0) * 0.6); }
.csp-rays {
  position: absolute;
  left: -140cqmax;
  top: -140cqmax;
  width: 280cqmax;
  height: 280cqmax;
}
.csp-rays-tilt { transform: rotate(calc(var(--csp-mx) * 5deg)); transition: transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1); }
.csp-rays-turn { animation: csp-turn 320s linear infinite; }
.csp-ray { transform: scale(clamp(0, calc((var(--csp-p, 0) - var(--csp-t)) * 3.2), 1)); }
.csp-ray-edge { fill: var(--csp-ember); opacity: 0.32; }
.csp-spark { transform-box: fill-box; transform-origin: center; animation: csp-twinkle 4s ease-in-out infinite; }
.csp-spark-cream { fill: var(--csp-cream); opacity: 0.85; }
.csp-spark-ember { fill: var(--csp-ember); }
@keyframes csp-turn { to { transform: rotate(360deg); } }
@keyframes csp-twinkle {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  45% { transform: scale(0.55, 0.8); opacity: 0.45; }
}
/* ---- the sun ------------------------------------------------------------- */
.csp-sun-box { transform: translate(calc(var(--csp-mx) * 6px), calc(var(--csp-my) * 4px)); transition: transform 0.6s ease-out; }
.csp-sun {
  all: unset;
  position: absolute;
  inset: 0;
  border-radius: 50%;
  cursor: pointer;
  transform: rotate(var(--csp-spin, 0deg)) scale(calc(0.55 + var(--csp-p, 0) * 0.45));
  transition: transform 1.9s cubic-bezier(0.16, 0.9, 0.2, 1);
}
.csp-sun:focus-visible { outline: 1.5px dashed var(--csp-gold); outline-offset: 6px; }
.csp-sun:hover .csp-flame { animation-duration: 0.5s; }
.csp-sun:hover .csp-halo { opacity: 1; }
.csp-halo { opacity: calc(0.4 + var(--csp-p, 0) * 0.4); transition: opacity 0.4s; }
.csp-flames { animation: csp-turn 70s linear infinite; transform-origin: 0px 0px; }
.csp-flame { transform-origin: 0px -50px; animation: csp-flick 1.6s ease-in-out infinite; opacity: var(--csp-p, 0); }
@keyframes csp-flick {
  0%, 100% { transform: scale(1, 1) skewX(0deg); }
  35% { transform: scale(0.92, 1.1) skewX(-7deg); }
  70% { transform: scale(1.06, 0.92) skewX(5deg); }
}
.csp-spikes { animation: csp-turn 140s linear infinite reverse; transform-origin: 0px 0px; }
.csp-facet-cream { fill: var(--csp-cream); }
.csp-facet-hot { fill: color-mix(in srgb, var(--csp-cream) 45%, var(--csp-ember)); }
.csp-facet-red { fill: var(--csp-ember); }
.csp-facet-shade { fill: color-mix(in srgb, var(--csp-cream) 70%, var(--csp-red)); }
.csp-sun-disc { fill: var(--csp-red); stroke: var(--csp-deep); stroke-width: 2; }
.csp-sun-rim { fill: none; stroke: var(--csp-ember); stroke-width: 0.8; }
.csp-sun-core { fill: var(--csp-red); }
.csp-seg { fill: var(--csp-deep); transition: fill 0.25s ease, opacity 0.25s ease; opacity: 0.75; }
.csp-seg[data-lit="true"] { fill: var(--csp-cream); opacity: 1; }
.csp-compass { transition: transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1); transform-origin: 0px 0px; }
.csp-root[data-phase="load"] .csp-compass { transform: rotate(calc(var(--csp-p, 0) * 360deg)); transition: none; }
.csp-burst { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; }
.csp-burst-bit {
  position: absolute;
  left: -13px;
  top: -13px;
  width: 26px;
  height: 26px;
  opacity: 0;
  animation: csp-fly 1.1s cubic-bezier(0.1, 0.7, 0.2, 1) forwards;
}
.csp-burst-bit path { fill: var(--csp-gold); filter: drop-shadow(0 0 4px var(--csp-gold)); }
.csp-burst-bit:nth-child(even) { width: 16px; height: 16px; left: -8px; top: -8px; }
.csp-burst-bit:nth-child(even) path { fill: var(--csp-cream); }
@keyframes csp-fly {
  0% { opacity: 1; transform: rotate(var(--csp-a)) translateY(0px) scale(0.4); }
  70% { opacity: 1; }
  100% { opacity: 0; transform: rotate(var(--csp-a)) translateY(calc(var(--csp-sun) * -0.95)) scale(1.1); }
}
/* ---- ignition ------------------------------------------------------------ */
.csp-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(60cqmax 60cqmax at 50% var(--csp-sy), var(--csp-cream), color-mix(in srgb, var(--csp-ember) 60%, transparent) 30%, transparent 70%);
  opacity: 0;
  pointer-events: none;
  mix-blend-mode: screen;
}
.csp-root[data-phase="ignite"] .csp-flash { animation: csp-flash 1.3s ease-out both; }
@keyframes csp-flash { 0% { opacity: 0; } 14% { opacity: 0.95; } 100% { opacity: 0; } }
.csp-shock {
  position: absolute;
  left: 50%;
  top: var(--csp-sy);
  width: var(--csp-sun);
  height: var(--csp-sun);
  margin: calc(var(--csp-sun) * -0.5) 0 0 calc(var(--csp-sun) * -0.5);
  border-radius: 50%;
  border: 2px solid var(--csp-cream);
  opacity: 0;
  pointer-events: none;
}
.csp-root[data-phase="ignite"] .csp-shock { animation: csp-shock 1.4s cubic-bezier(0.1, 0.6, 0.2, 1) both; }
.csp-root[data-phase="ignite"] .csp-shock-2 { animation-delay: 0.18s; border-color: var(--csp-ember); }
@keyframes csp-shock {
  0% { opacity: 0.9; transform: scale(0.4); }
  100% { opacity: 0; transform: scale(5.5); }
}
/* ---- clouds and moons ---------------------------------------------------- */
.csp-clouds {
  position: absolute;
  right: -4cqw;
  bottom: -5cqh;
  width: min(72cqw, 60cqh);
  height: auto;
  aspect-ratio: 600 / 640;
  opacity: calc(var(--csp-p, 0) * 1.8 - 0.4);
  transform: translateY(calc((1 - var(--csp-p, 0)) * 12cqh));
}
.csp-par-far { transform: translate(calc(var(--csp-mx) * 6px), calc(var(--csp-my) * 4px)); transition: transform 0.7s ease-out; }
.csp-par-mid { transform: translate(calc(var(--csp-mx) * 12px), calc(var(--csp-my) * 7px)); transition: transform 0.7s ease-out; }
.csp-par-near { transform: translate(calc(var(--csp-mx) * 20px), calc(var(--csp-my) * 11px)); transition: transform 0.7s ease-out; }
.csp-float { animation: csp-float 7s ease-in-out infinite; }
@keyframes csp-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-9px); } }
.csp-crater { fill: var(--csp-deep); opacity: 0.28; }
.csp-dark-moon { fill: var(--csp-ink); stroke: var(--csp-red); stroke-width: 1.5; }
.csp-curl { fill: none; stroke: var(--csp-red); stroke-width: 2.4; stroke-linecap: round; opacity: 0.75; }
.csp-ribbon path { fill: none; stroke: var(--csp-cream); stroke-width: 20; stroke-linecap: round; }
.csp-ribbon { filter: drop-shadow(0 0 0.5px var(--csp-deep)) drop-shadow(3px 4px 0 color-mix(in srgb, var(--csp-ink) 60%, transparent)); }
.csp-dark-stars path { fill: var(--csp-ink); }
/* ---- flecks, grain, lantern --------------------------------------------- */
.csp-flecks { position: absolute; inset: 0; width: 100%; height: 100%; }
.csp-fleck { fill: var(--csp-gold); opacity: 0.85; }
.csp-fleck-cream { fill: var(--csp-cream); opacity: 0.6; }
.csp-glint { animation: csp-glint 6s ease-in-out infinite; }
@keyframes csp-glint { 0%, 100% { opacity: 0.85; } 50% { opacity: 0.2; } }
.csp-grain { position: absolute; inset: 0; width: 100%; height: 100%; transform: translateZ(0); }
.csp-shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 34% at 50% 66%, color-mix(in srgb, var(--csp-ink) 62%, transparent), transparent 72%),
    radial-gradient(120% 95% at 50% 40%, transparent 55%, color-mix(in srgb, var(--csp-ink) 58%, transparent)),
    linear-gradient(to bottom, transparent 70%, color-mix(in srgb, var(--csp-ink) 55%, transparent));
}
.csp-lantern {
  position: absolute;
  inset: 0;
  background: radial-gradient(28cqmax 28cqmax at var(--csp-px) var(--csp-py), color-mix(in srgb, var(--csp-gold) 22%, transparent), transparent 70%);
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.5s ease;
}
.csp-root[data-pointer="true"] .csp-lantern { opacity: 1; }
/* ---- the frame ----------------------------------------------------------- */
.csp-frame { position: absolute; inset: 0; pointer-events: none; z-index: 8; }
.csp-strip { position: absolute; fill: none; stroke: var(--csp-gold); stroke-width: 1.1; stroke-linecap: round; opacity: 0.55; }
.csp-fil-dot { fill: var(--csp-gold); stroke: none; }
.csp-strip-t, .csp-strip-b { left: var(--csp-in); right: var(--csp-in); height: var(--csp-band); width: calc(100% - var(--csp-in) * 2); }
.csp-strip-t { top: var(--csp-in); }
.csp-strip-b { bottom: var(--csp-in); transform: scaleY(-1); }
.csp-strip-l, .csp-strip-r { top: calc(var(--csp-in) + var(--csp-band)); bottom: calc(var(--csp-in) + var(--csp-band)); width: var(--csp-band); height: calc(100% - (var(--csp-in) + var(--csp-band)) * 2); }
.csp-strip-l { left: var(--csp-in); }
.csp-strip-r { right: var(--csp-in); transform: scaleX(-1); }
.csp-rule {
  position: absolute;
  inset: var(--csp-rule);
  border: 1px solid color-mix(in srgb, var(--csp-cream) 55%, transparent);
}
.csp-notch {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 1px solid color-mix(in srgb, var(--csp-cream) 55%, transparent);
  background: var(--csp-ink);
}
.csp-notch-tl { left: -7px; top: -7px; }
.csp-notch-tr { right: -7px; top: -7px; }
.csp-notch-bl { left: -7px; bottom: -7px; }
.csp-notch-br { right: -7px; bottom: -7px; }
.csp-crest {
  position: absolute;
  left: 50%;
  top: calc(var(--csp-rule) - 9px);
  width: 64px;
  height: 18px;
  margin-left: -32px;
  fill: none;
  stroke: var(--csp-cream);
  stroke-width: 1.2;
  opacity: 0.85;
  background: var(--csp-ink);
}
.csp-crest-fill { fill: var(--csp-red); stroke: var(--csp-cream); }
/* ---- type ---------------------------------------------------------------- */
.csp-copy {
  position: absolute;
  left: var(--csp-rule);
  right: var(--csp-rule);
  top: 53%;
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  pointer-events: none;
  transform: translate(calc(var(--csp-mx) * -4px), calc(var(--csp-my) * -3px));
  transition: transform 0.6s ease-out;
}
.csp-over {
  margin: 0;
  font-family: var(--csp-display);
  font-weight: 700;
  font-size: clamp(11px, 2.2cqmin, 21px);
  line-height: 1.25;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--csp-cream);
  text-shadow: 0 1px 0 var(--csp-ink);
}
.csp-title {
  margin: 0.06em 0 0;
  font-family: var(--csp-display);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: 0.01em;
  white-space: nowrap;
  color: var(--csp-cream);
  pointer-events: auto;
  font-variant-numeric: lining-nums tabular-nums;
}
.csp-title-ink { display: inline-block; text-shadow: 0.025em 0.035em 0 var(--csp-deep), 0 0 0.6em color-mix(in srgb, var(--csp-ink) 70%, transparent); }
.csp-ch { display: inline-block; transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), color 0.35s; }
.csp-root[data-phase="live"] .csp-ch:hover { transform: translateY(-0.08em) rotate(-2deg); color: var(--csp-gold); }
.csp-q { color: var(--csp-cream); }
.csp-root[data-phase="ignite"] .csp-ch-in,
.csp-root[data-phase="live"] .csp-ch-in {
  animation: csp-ch-in 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes csp-ch-in {
  0% { opacity: 0; transform: translateY(0.35em) scale(0.9); filter: blur(10px); }
  100% { opacity: 1; transform: none; filter: blur(0px); }
}
.csp-reveal { opacity: 0; transform: translateY(10px); transition: opacity 0.8s ease, transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1); }
.csp-root[data-phase="ignite"] .csp-reveal,
.csp-root[data-phase="live"] .csp-reveal { opacity: 1; transform: none; }
.csp-over.csp-reveal { transition-delay: 0.35s; }
.csp-slot { position: relative; margin-top: clamp(14px, 3.4cqh, 34px); min-height: 48px; width: 100%; display: grid; place-items: center; }
.csp-slot > * { grid-area: 1 / 1; }
.csp-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: clamp(9px, 1.5cqmin, 12px);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--csp-cream) 80%, transparent);
  transition: opacity 0.4s ease;
}
.csp-root[data-phase="ignite"] .csp-status,
.csp-root[data-phase="live"] .csp-status { opacity: 0; }
.csp-track { position: relative; width: min(220px, 50cqw); height: 1px; background: color-mix(in srgb, var(--csp-cream) 22%, transparent); }
.csp-fill {
  position: absolute;
  inset: 0;
  transform-origin: 0 50%;
  transform: scaleX(var(--csp-p, 0));
  background: linear-gradient(90deg, var(--csp-red), var(--csp-gold));
}
.csp-fill::after {
  content: "";
  position: absolute;
  right: -3px;
  top: -3px;
  width: 7px;
  height: 7px;
  transform: rotate(45deg);
  background: var(--csp-gold);
  box-shadow: 0 0 10px 2px color-mix(in srgb, var(--csp-gold) 70%, transparent);
}
.csp-actions { display: flex; align-items: center; gap: 14px; pointer-events: auto; transition-delay: 0.7s; }
.csp-root[data-phase="load"] .csp-actions { visibility: hidden; }
.csp-cta {
  all: unset;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 11px 26px;
  font-family: var(--csp-text);
  font-size: clamp(10px, 1.5cqmin, 13px);
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--csp-cream);
  background: color-mix(in srgb, var(--csp-ink) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--csp-cream) 70%, transparent);
  outline: 1px solid color-mix(in srgb, var(--csp-cream) 30%, transparent);
  outline-offset: 3px;
  cursor: pointer;
  overflow: hidden;
  transition: color 0.35s ease, border-color 0.35s ease, outline-offset 0.35s ease;
}
.csp-cta::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(100deg, var(--csp-red), var(--csp-ember));
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.45s cubic-bezier(0.7, 0, 0.2, 1);
}
.csp-cta { isolation: isolate; }
.csp-cta:hover, .csp-cta:focus-visible { border-color: var(--csp-gold); outline-offset: 6px; outline-color: var(--csp-gold); }
.csp-cta:hover::before, .csp-cta:focus-visible::before { transform: scaleX(1); }
.csp-cta-star { width: 9px; height: 9px; fill: var(--csp-gold); transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
.csp-cta:hover .csp-cta-star { transform: rotate(180deg) scale(1.3); fill: var(--csp-cream); }
.csp-replay {
  all: unset;
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--csp-cream) 40%, transparent);
  color: var(--csp-cream);
  cursor: pointer;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.3s;
}
.csp-replay svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
.csp-replay:hover, .csp-replay:focus-visible { transform: rotate(-200deg); border-color: var(--csp-gold); color: var(--csp-gold); }
/* ---- credits and nav ----------------------------------------------------- */
.csp-credits {
  position: absolute;
  left: calc(var(--csp-rule) + clamp(10px, 2.4cqmin, 22px));
  bottom: calc(var(--csp-rule) + clamp(10px, 2.4cqmin, 22px));
  z-index: 6;
  max-width: 40cqw;
  font-size: clamp(8px, 1.25cqmin, 11px);
  line-height: 1.45;
  color: color-mix(in srgb, var(--csp-cream) 82%, transparent);
  text-shadow: 0 1px 2px var(--csp-ink);
  transition-delay: 0.5s;
}
.csp-credits p { margin: 0; }
.csp-credits-date { font-size: 0.82em; letter-spacing: 0.12em; opacity: 0.8; margin-bottom: 0.6em !important; }
.csp-credits-main { font-size: 1.22em; line-height: 1.3; }
.csp-credits-venue { margin-top: 0.9em !important; font-size: 0.78em; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.75; }
.csp-nav {
  position: absolute;
  top: calc(var(--csp-rule) + clamp(10px, 2cqmin, 18px));
  left: calc(var(--csp-rule) + clamp(10px, 2.4cqmin, 22px));
  right: calc(var(--csp-rule) + clamp(10px, 2.4cqmin, 22px));
  z-index: 9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: clamp(8px, 1.2cqmin, 11px);
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--csp-cream) 80%, transparent);
  transition-delay: 0.9s;
}
.csp-nav-links { display: flex; gap: clamp(10px, 2.4cqmin, 24px); }
.csp-link { color: inherit; text-decoration: none; position: relative; padding: 4px 0; }
.csp-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--csp-gold);
  transform: scaleX(0);
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.csp-link:hover, .csp-link:focus-visible { color: var(--csp-gold); outline: none; }
.csp-link:hover::after, .csp-link:focus-visible::after { transform: scaleX(1); }
.csp-root[data-phase="load"] .csp-nav { visibility: hidden; }
/* ---- the gate: the whole stage is a rush button while it loads ----------- */
.csp-gate { position: absolute; inset: 0; z-index: 10; cursor: progress; }
.csp-gate:focus-visible { outline: 2px solid var(--csp-gold); outline-offset: -8px; }
.csp-veil {
  position: absolute;
  inset: 0;
  z-index: 11;
  background: var(--csp-ink);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease;
}
.csp-veil[data-on="true"] { opacity: 1; }
.csp-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/* ---- shape ----------------------------------------------------------------- */
@container (min-aspect-ratio: 6/5) {
  .csp-root { --csp-sy: 25%; --csp-sun: min(46cqw, 40cqh); }
  .csp-copy { top: 52%; }
  .csp-clouds { width: min(46cqw, 74cqh); right: -2cqw; }
  .csp-credits { max-width: 28cqw; }
}
@container (max-aspect-ratio: 3/5) {
  .csp-root { --csp-sy: 23%; --csp-sun: min(70cqw, 34cqh); }
  .csp-copy { top: 49%; }
  .csp-clouds { width: 92cqw; right: -14cqw; bottom: -3cqh; }
  .csp-credits { max-width: 46cqw; }
}
@container (max-width: 520px) {
  .csp-root .csp-crest { display: none; }
  .csp-nav { letter-spacing: 0.18em; }
}
@media (prefers-reduced-motion: reduce) {
  .csp-rays-turn, .csp-flames, .csp-spikes, .csp-flame, .csp-spark, .csp-float, .csp-glint { animation: none; }
  .csp-rays-tilt, .csp-dial-box, .csp-sun-box, .csp-copy, .csp-par-far, .csp-par-mid, .csp-par-near { transition: none; transform: none; }
  .csp-sun { transition-duration: 0.01s; }
  .csp-root[data-phase="ignite"] .csp-flash { animation-duration: 0.5s; }
  .csp-root[data-phase="ignite"] .csp-shock, .csp-burst { display: none; }
  .csp-root[data-phase="ignite"] .csp-ch-in,
  .csp-root[data-phase="live"] .csp-ch-in { animation: csp-fade 0.4s ease both; }
  .csp-reveal { transform: none; transition-duration: 0.3s; }
  .csp-replay:hover, .csp-replay:focus-visible { transform: none; }
}
@keyframes csp-fade { from { opacity: 0; } }
`

type Phase = "load" | "ignite" | "live"

const IGNITE_MS = 1400
const LOOP_HOLD_MS = 6500
const REWIND_MS = 650

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-10 -10 20 20" aria-hidden="true">
      <path d={sparkle(10, 4.4)} />
    </svg>
  )
}

export default function CrimsonSunburstPreloader({
  artist = "Aster Vale",
  eyebrow = "1st Solo Live",
  title = "SOLSTICE",
  quotes = true,
  date = "2026.10.07",
  venue = DEFAULT_VENUE,
  meta = "Vol. 01 — Live",
  links = DEFAULT_LINKS,
  ctaLabel = "Get tickets",
  ctaHref,
  onCta,
  statusLines = DEFAULT_STATUS,
  rays = 28,
  progress,
  durationMs = 3800,
  loop = false,
  showReplay = true,
  palette,
  fontFamily = DISPLAY_STACK,
  textFamily = TEXT_STACK,
  height = "100svh",
  onComplete,
  className = "",
}: CrimsonSunburstPreloaderProps) {
  const [phase, setPhase] = React.useState<Phase>("load")
  const [pct, setPct] = React.useState(0)
  const [cycle, setCycle] = React.useState(0)
  const [veil, setVeil] = React.useState(false)
  const [spin, setSpin] = React.useState(0)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const rushRef = React.useRef(false)
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete

  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const colors = { ...DEFAULT_PALETTE, ...palette }

  // ---- load: drive every draw from one progress value, frame by frame ------
  React.useEffect(() => {
    if (phase !== "load") return
    const root = rootRef.current
    if (!root) return
    const drawn = Array.from(root.querySelectorAll<SVGPathElement>("[data-csp-draw]"))
    let raf = 0
    let shown = 0
    let last = performance.now()
    const start = last
    rushRef.current = false

    const paint = (p: number) => {
      root.style.setProperty("--csp-p", p.toFixed(4))
      for (const el of drawn) {
        const delay = Number(el.getAttribute("data-csp-draw")) || 0
        el.style.strokeDashoffset = String(1 - clamp01(p * 1.7 - delay))
      }
      setPct(Math.round(p * 100))
    }

    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const external = progressRef.current
      let target =
        external !== undefined ? clamp01(external / 100) : cspSimulated((now - start) / Math.max(400, durationMs))
      if (rushRef.current) target = 1
      // ease toward the target so stepped real progress still glides
      const rate = rushRef.current ? 0.14 : external !== undefined ? 0.1 : 1
      shown += (target - shown) * Math.min(1, rate * (dt / 16.7))
      if (target - shown < 0.002) shown = target
      paint(shown)
      if (shown >= 1) {
        setPhase("ignite")
        return
      }
      raf = requestAnimationFrame(tick)
    }
    paint(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, cycle, durationMs])

  // ---- ignite -> live, then (in loop mode) back round ----------------------
  React.useEffect(() => {
    if (phase === "ignite") {
      const t = setTimeout(() => setPhase("live"), IGNITE_MS)
      return () => clearTimeout(t)
    }
    if (phase === "live") {
      if (!loop) {
        onCompleteRef.current?.()
        return
      }
      const t = setTimeout(() => setVeil(true), LOOP_HOLD_MS)
      return () => clearTimeout(t)
    }
  }, [phase, loop])

  // the veil goes up, the stage resets beneath it, the veil comes down
  React.useEffect(() => {
    if (!veil) return
    const t = setTimeout(() => {
      setPhase("load")
      setPct(0)
      setCycle((c) => c + 1)
      setVeil(false)
    }, REWIND_MS)
    return () => clearTimeout(t)
  }, [veil])

  const rush = () => {
    rushRef.current = true
  }

  // ---- pointer: parallax, ray tilt and the lantern -------------------------
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current
    if (!root || e.pointerType === "touch") return
    const r = root.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    root.style.setProperty("--csp-mx", (x * 2 - 1).toFixed(3))
    root.style.setProperty("--csp-my", (y * 2 - 1).toFixed(3))
    root.style.setProperty("--csp-px", (x * 100).toFixed(1) + "%")
    root.style.setProperty("--csp-py", (y * 100).toFixed(1) + "%")
    root.dataset.pointer = "true"
  }
  const onPointerLeave = () => {
    const root = rootRef.current
    if (!root) return
    root.style.setProperty("--csp-mx", "0")
    root.style.setProperty("--csp-my", "0")
    root.dataset.pointer = "false"
  }

  const loading = phase === "load"
  const p = pct / 100
  const lit = loading ? cspLit(p, SEGMENTS) : SEGMENTS
  const open = quotes ? "“" : ""
  const close = quotes ? "”" : ""
  const shownText = loading ? cspCount(p) : title
  const fit = cspFit(title.length + (quotes ? 2 : 0))
  const titleSize = "min(" + fit + "cqw, 14cqh)"

  const cta = ctaLabel ? (
    ctaHref ? (
      <a className="csp-cta" href={ctaHref} onClick={onCta}>
        <Star className="csp-cta-star" />
        {ctaLabel}
        <Star className="csp-cta-star" />
      </a>
    ) : (
      <button type="button" className="csp-cta" onClick={onCta}>
        <Star className="csp-cta-star" />
        {ctaLabel}
        <Star className="csp-cta-star" />
      </button>
    )
  ) : null

  return (
    <div
      ref={rootRef}
      className={"csp-root " + className}
      data-phase={phase}
      style={
        {
          height,
          "--csp-ink": colors.ink,
          "--csp-red": colors.red,
          "--csp-ember": colors.ember,
          "--csp-deep": colors.deep,
          "--csp-slate": colors.slate,
          "--csp-cream": colors.cream,
          "--csp-gold": colors.gold,
          "--csp-display": fontFamily,
          "--csp-text": textFamily,
        } as React.CSSProperties
      }
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <style>{CSP_CSS}</style>

      <div className="csp-layer" aria-hidden="true">
        <div className="csp-anchor">
          <div className="csp-dial-box">
            <Dial uid={uid} />
          </div>
        </div>
        <div className="csp-anchor">
          <Rays count={rays} uid={uid} />
        </div>
      </div>

      <div className="csp-layer">
        <div className="csp-anchor" style={{ pointerEvents: "auto" }}>
          <div className="csp-sun-box">
            <button
              type="button"
              className="csp-sun"
              aria-label="Spin the sun"
              style={{ "--csp-spin": spin * 360 + "deg" } as React.CSSProperties}
              onClick={() => setSpin((s) => s + 1)}
            >
              <Sun lit={lit} uid={uid} />
              {spin > 0 ? (
                <span className="csp-burst" key={spin} aria-hidden="true">
                  {Array.from({ length: 14 }, (_, i) => (
                    <span key={i} className="csp-burst-bit" style={{ "--csp-a": i * (360 / 14) + spin * 13 + "deg" } as React.CSSProperties}>
                      <Star />
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      <div className="csp-layer" aria-hidden="true">
        <Clouds uid={uid} />
        <Flecks />
        <div className="csp-shade" />
        <div className="csp-shock" />
        <div className="csp-shock csp-shock-2" />
      </div>

      <div className="csp-copy">
        <p className="csp-over csp-reveal">
          {artist}
          <br />
          {eyebrow}
        </p>
        <h1 className="csp-title" style={{ fontSize: titleSize, filter: "url(#csp-rough-" + uid + ")" }}>
          <span className="csp-title-ink" key={loading ? "count-" + cycle : "title-" + cycle} aria-hidden="true">
            <span className="csp-ch csp-q csp-ch-in" style={{ animationDelay: "0s" }}>
              {open}
            </span>
            {Array.from(shownText).map((ch, i) => (
              <span key={i} className={"csp-ch" + (loading ? "" : " csp-ch-in")} style={{ animationDelay: 0.12 + i * 0.07 + "s" }}>
                {ch === " " ? " " : ch}
              </span>
            ))}
            <span className="csp-ch csp-q csp-ch-in" style={{ animationDelay: 0.12 + shownText.length * 0.07 + "s" }}>
              {close}
            </span>
          </span>
          <span className="csp-sr">{title}</span>
        </h1>
        <div className="csp-slot">
          <div className="csp-status" aria-hidden="true">
            <span>{cspStatus(p, statusLines)}</span>
            <span className="csp-track">
              <span className="csp-fill" />
            </span>
          </div>
          <div className="csp-actions csp-reveal">
            {cta}
            {showReplay ? (
              <button type="button" className="csp-replay" aria-label="Replay the intro" onClick={() => setVeil(true)}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.2 6.2A5.2 5.2 0 1 1 3 9.6" />
                  <path d="M2.6 2.6L3.2 6.2L6.8 5.6" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="csp-credits csp-reveal">
        <p className="csp-credits-date">{date}</p>
        <p className="csp-credits-main">{artist}</p>
        <p className="csp-credits-main">{eyebrow}</p>
        <p className="csp-credits-main">{title.charAt(0) + title.slice(1).toLowerCase()}</p>
        {venue.map((line, i) => (
          <p key={i} className={i === 0 ? "csp-credits-venue" : "csp-credits-venue csp-credits-venue-n"} style={i ? { marginTop: 0 } : undefined}>
            {line}
          </p>
        ))}
      </div>

      <div className="csp-layer" aria-hidden="true">
        <Grain uid={uid} />
        <div className="csp-lantern" />
        <div className="csp-flash" />
      </div>

      <Frame uid={uid} />

      <nav className="csp-nav csp-reveal" aria-label={artist}>
        <span>{meta}</span>
        <span className="csp-nav-links">
          {links.map((l, i) => (
            <a key={i} className="csp-link" href={l.href ?? "#"}>
              {l.label}
            </a>
          ))}
        </span>
      </nav>

      {loading ? (
        <div
          className="csp-gate"
          role="progressbar"
          aria-label={artist + " — " + title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={pct + "%"}
          tabIndex={0}
          onClick={rush}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              rush()
            }
          }}
        />
      ) : null}
      <div className="csp-veil" data-on={veil} />
      <span className="csp-sr" aria-live="polite">
        {loading ? "" : artist + ", " + eyebrow + ": " + title}
      </span>
    </div>
  )
}
