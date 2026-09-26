"use client"

import * as React from "react"

/**
 * Gothic Stamp Deck — a sheet of perforated crimson-and-gold stamps.
 *
 * The sheet lays itself out as a grid. Pick a stamp and the sheet clears: that
 * stamp comes forward to the middle of the component (not the page — it never
 * goes full screen), its neighbours step back to the sides, and the rest leave.
 * From there it is a horizontal deck: arrows, swipe, the wheel or a trackpad
 * move it along, and clicking the stamp turns it over to read the back.
 *
 * Every stamp is a holo card: it leans toward the pointer and a foil band runs
 * across the gold as it moves. The illustrations are drawn in code (SVG built
 * from a handful of path generators), so the component needs no assets. Pass
 * `image` on a card to print your own picture instead.
 *
 * Self-contained: React is the only import. No CSS file, no fonts to download,
 * no animation library.
 */

/** The built-in illustrations. */
export type Scene =
  | "murder"
  | "oath"
  | "wyrm"
  | "banquet"
  | "hour"
  | "heart"
  | "covenant"
  | "portrait"
  | "gambit"

export type StampCard = {
  /** Printed on the back and read out in the deck. Keep it short. */
  title: string
  /** Built-in illustration. Defaults to the scene at the card's position. */
  scene?: Scene
  /** Your own art for the face — any URL or data URI. Replaces `scene`. */
  image?: string
  /** The lines on the back. `\n` breaks a line. */
  verse?: string
  /** Small caption under the verse, e.g. where the verse is from. */
  note?: string
  /** Overrides the roman numeral the card is given by its position. */
  numeral?: string
}

/** Five colours. Everything else in the deck is mixed from these. */
export type StampPalette = {
  /** Near-black. Shadows and silhouettes. */
  ink: string
  /** The dark red of the field. */
  deep: string
  /** Stamp paper — the perforated margin and the midtones. */
  paper: string
  /** The bright red. Glows, wine, ribbons. */
  bright: string
  /** The foil. Highlights and darks are mixed from it. */
  gold: string
}

export type GothicStampDeckProps = {
  cards?: StampCard[]
  /** Large title over the sheet. */
  title?: string
  /** Script word laid over the title. Empty string hides it. */
  script?: string
  /** The small line under the title. */
  epigraph?: string
  palette?: Partial<StampPalette>
  /** A definite length. Never a percentage — see the README. */
  height?: string
  /** Largest lean toward the pointer, in degrees. */
  tilt?: number
  /** Foil strength, 0..1. 0 is a flat print. */
  foil?: number
  /** Open on this card instead of the sheet. */
  defaultIndex?: number | null
  /** Called with the focused index, or `null` when the sheet comes back. */
  onSelect?: (index: number | null) => void
  className?: string
}

// #region deck
/** Card height over width. The stamps are a 5:7 portrait. */
export const ASPECT = 1.4

/** Clamp to 0..1. Written as a positive test so NaN falls out as 0. */
export const clamp01 = (v: number): number => (v > 0 ? (v < 1 ? v : 1) : 0)

export const wrapIndex = (i: number, n: number): number => (n > 0 ? (((i % n) + n) % n) + 0 : 0)

/**
 * Where card `i` sits relative to the focused one, going the short way round.
 * The deck wraps, so the card before the first is the last: it has to come in
 * from the left, not fly across the whole deck from the far right.
 */
export const circularOffset = (i: number, active: number, n: number): number => {
  if (n <= 0) return 0
  let d = wrapIndex(i - active, n)
  if (d > n / 2) d -= n
  return d + 0
}

export const toRoman = (n: number): string => {
  let v = Math.floor(n)
  if (!(v > 0) || v >= 4000) return String(n)
  const nums = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
  const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
  let out = ""
  for (let k = 0; k < nums.length; k++) {
    while (v >= nums[k]) {
      out += syms[k]
      v -= nums[k]
    }
  }
  return out
}

/**
 * Pointer position on the card (0..1 each way) to a lean. Pointer right turns
 * the right edge away, pointer up tips the top back. Outside the card is
 * clamped, so a drag that leaves the element cannot overturn it.
 */
export const tiltFromPointer = (px: number, py: number, max: number) => {
  const x = clamp01(px)
  const y = clamp01(py)
  return { rx: (0.5 - y) * 2 * max + 0, ry: (x - 0.5) * 2 * max + 0 }
}

/**
 * The perforation: hole centres along all four edges. The spacing is stretched
 * to divide each edge exactly, so there is always a hole on every corner and
 * the pattern is symmetric whatever the size.
 */
export const stampHoles = (w: number, h: number, step: number) => {
  const out = []
  const nx = Math.max(2, Math.round(w / step))
  const ny = Math.max(2, Math.round(h / step))
  for (let i = 0; i <= nx; i++) {
    out.push([(i * w) / nx, 0])
    out.push([(i * w) / nx, h])
  }
  for (let j = 1; j < ny; j++) {
    out.push([0, (j * h) / ny])
    out.push([w, (j * h) / ny])
  }
  return out
}

/** The stamp silhouette as a CSS mask: a rectangle with the holes cut out. */
export const stampMask = (w: number, h: number, step: number, r: number) => {
  const holes = stampHoles(w, h, step)
    .map((p) => "<circle cx='" + p[0].toFixed(2) + "' cy='" + p[1].toFixed(2) + "' r='" + r + "'/>")
    .join("")
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " " + h + "' preserveAspectRatio='none'>" +
    "<mask id='m'><rect width='" + w + "' height='" + h + "' fill='white'/>" + holes + "</mask>" +
    "<rect width='" + w + "' height='" + h + "' mask='url(#m)'/></svg>"
  return "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")"
}

/** Mix two hex colours. `t` = 0 is `a`. */
export const mixHex = (a: string, b: string, t: number): string => {
  const parse = (hex: string) => {
    let s = hex.replace("#", "").trim()
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
    const v = parseInt(s.slice(0, 6), 16)
    return Number.isFinite(v) ? [(v >> 16) & 255, (v >> 8) & 255, v & 255] : [0, 0, 0]
  }
  const x = parse(a)
  const y = parse(b)
  const k = clamp01(t)
  return "#" + x.map((c, i) => Math.round(c + (y[i] - c) * k).toString(16).padStart(2, "0")).join("")
}

/**
 * The sheet. Tries every column count and keeps the one that gives the
 * biggest stamps inside the box, so it fills a wide banner and a phone alike.
 * An unfinished last row is centred. Returns card centres.
 */
export const gridLayout = (n: number, w: number, h: number, top: number, gap: number) => {
  let best = { cols: 1, rows: Math.max(1, n), cardW: 0 }
  for (let cols = 1; cols <= Math.max(1, n); cols++) {
    const rows = Math.ceil(n / cols)
    const byW = (w - gap * (cols + 1)) / cols
    const byH = (h - top - gap * (rows + 1)) / rows / ASPECT
    const cardW = Math.min(byW, byH)
    if (cardW > best.cardW) best = { cols, rows, cardW }
  }
  const cardW = Math.max(best.cardW, 1)
  const cardH = cardW * ASPECT
  const cells = []
  const totalH = best.rows * cardH + (best.rows - 1) * gap
  const y0 = top + (h - top - totalH) / 2
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / best.cols)
    const col = i % best.cols
    const inRow = Math.min(best.cols, n - row * best.cols)
    const rowW = inRow * cardW + (inRow - 1) * gap
    const x0 = (w - rowW) / 2
    cells.push({ x: x0 + col * (cardW + gap) + cardW / 2, y: y0 + row * (cardH + gap) + cardH / 2 })
  }
  return { cols: best.cols, rows: best.rows, cardW, cells }
}

/** Width of the focused card: as big as the box allows, with room for the bar. */
export const focusSize = (w: number, h: number, bar: number): number =>
  Math.max(60, Math.min(w * 0.68, (h - bar - 56) / ASPECT, 460))

/**
 * Where a card goes in the deck, by its offset from the focused one. The
 * focused card is centred; one step either side is pushed back, turned in and
 * dimmed; anything further is gone.
 */
export const focusSlot = (d: number, w: number, h: number, cardW: number, bar: number) => {
  const ad = Math.abs(d)
  const s = d < 0 ? -1 : 1
  const y = (h - bar) / 2 + 12
  if (ad === 0) return { x: w / 2, y, scale: 1, opacity: 1, rot: 0 }
  if (ad === 1) return { x: w / 2 + s * cardW * 0.86, y, scale: 0.6, opacity: 0.5, rot: -s * 18 }
  return { x: w / 2 + s * cardW * (0.86 + 0.45 * (ad - 1)), y, scale: 0.46, opacity: 0, rot: -s * 26 }
}
// #endregion

// ---------------------------------------------------------------------------
// Defaults

const DEFAULT_PALETTE: StampPalette = {
  ink: "#0b0104",
  deep: "#3d0309",
  paper: "#930b14",
  bright: "#e3141d",
  gold: "#e8cf8e",
}

const SCENES_IN_ORDER: Scene[] = [
  "murder",
  "oath",
  "wyrm",
  "banquet",
  "hour",
  "heart",
  "covenant",
  "portrait",
  "gambit",
]

// The verses are Shakespeare's sonnets, which is where the reference's
// "From fairest creatures…" comes from. Public domain.
export const DEFAULT_STAMPS: StampCard[] = [
  {
    title: "The Murder",
    scene: "murder",
    verse: "Like to the lark at break of day arising\nFrom sullen earth, sings hymns at heaven's gate.",
    note: "Sonnet XXIX",
  },
  {
    title: "The Oath",
    scene: "oath",
    verse: "Love is not love\nWhich alters when it alteration finds.",
    note: "Sonnet CXVI",
  },
  {
    title: "The Wyrm",
    scene: "wyrm",
    verse: "Devouring Time, blunt thou the lion's paws,\nAnd make the earth devour her own sweet brood.",
    note: "Sonnet XIX",
  },
  {
    title: "The Banquet",
    scene: "banquet",
    verse: "Sometime all full with feasting on your sight,\nAnd by and by clean starved for a look.",
    note: "Sonnet LXXV",
  },
  {
    title: "The Hour",
    scene: "hour",
    verse: "When I do count the clock that tells the time,\nAnd see the brave day sunk in hideous night.",
    note: "Sonnet XII",
  },
  {
    title: "The Heart",
    scene: "heart",
    verse: "Presume not on thy heart when mine is slain;\nThou gav'st me thine, not to give back again.",
    note: "Sonnet XXII",
  },
  {
    title: "The Covenant",
    scene: "covenant",
    verse: "So long as men can breathe or eyes can see,\nSo long lives this, and this gives life to thee.",
    note: "Sonnet XVIII",
  },
  {
    title: "The Portrait",
    scene: "portrait",
    verse: "Mine eye hath played the painter and hath stelled\nThy beauty's form in table of my heart.",
    note: "Sonnet XXIV",
  },
  {
    title: "The Gambit",
    scene: "gambit",
    verse: "My love is as a fever, longing still\nFor that which longer nurseth the disease.",
    note: "Sonnet CXLVII",
  },
]

const SERIF =
  '"Cormorant Garamond", "Cormorant", "Playfair Display", "Bodoni Moda", Didot, "Times New Roman", Georgia, serif'
const SCRIPT =
  '"Pinyon Script", "Great Vibes", "Snell Roundhand", "Apple Chancery", "Brush Script MT", cursive'

// Stamp geometry, in the SVG's own units. The mask is built once: it is a
// string, and every card shares it.
const W = 300
const H = 420
const M = 18
const STAMP_MASK = stampMask(W, H, 20, 6.5)

// A tile of sparse bright specks for the glitter layer. Rendered once by the
// browser as an image, so it costs nothing per frame.
const SPARKLE =
  "url(\"data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='s'>" +
      "<feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' seed='4'/>" +
      "<feColorMatrix values='0 0 0 0 1  0 0 0 0 0.93  0 0 0 0 0.75  14 0 0 0 -9.6'/></filter>" +
      "<rect width='180' height='180' filter='url(#s)'/></svg>",
  ) +
  "\")"

const GRAIN =
  "url(\"data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='g'>" +
      "<feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/>" +
      "<feColorMatrix values='0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.85  0 0 0 0.09 0'/></filter>" +
      "<rect width='220' height='220' filter='url(#g)'/></svg>",
  ) +
  "\")"

// ---------------------------------------------------------------------------
// Drawing kit. Every illustration is built from these few generators.

type Pt = [number, number]

type Ink = StampPalette & {
  mid: string
  goldLight: string
  goldDark: string
  cream: string
}

type Ctx = Ink & {
  /** fill: url(#…) references into this card's defs */
  g: string
  leaf: string
  sky: string
  glow: string
  cloth: string
  vig: string
  id: (s: string) => string
}

const inkFrom = (p: StampPalette): Ink => ({
  ...p,
  mid: mixHex(p.deep, p.paper, 0.45),
  goldLight: mixHex(p.gold, "#ffffff", 0.55),
  goldDark: mixHex(p.gold, "#4a2c0a", 0.55),
  cream: mixHex(p.gold, "#fff8ea", 0.6),
})

const n1 = (v: number) => Math.round(v * 10) / 10

const bez = (a: Pt, b: Pt, c: Pt, d: Pt, n: number): Pt[] => {
  const out: Pt[] = []
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

/** A chain of cubics: p0, c, c, p1, c, c, p2 … sampled to points. */
const spline = (pts: Pt[], n = 14): Pt[] => {
  const out: Pt[] = []
  for (let i = 0; i + 3 < pts.length; i += 3) {
    const seg = bez(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], n)
    out.push(...(i ? seg.slice(1) : seg))
  }
  return out
}

/**
 * A filled stroke that tapers from `w0` to `w1`, swelling by `bulge` in the
 * middle. Tails, necks, feathers, fingers, branches and ribbons are all this.
 */
const ribbon = (pts: Pt[], w0: number, w1: number, bulge = 0): string => {
  const L: Pt[] = []
  const R: Pt[] = []
  const last = pts.length - 1
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(last, i + 1)]
    let tx = b[0] - a[0]
    let ty = b[1] - a[1]
    const len = Math.hypot(tx, ty) || 1
    tx /= len
    ty /= len
    const t = last ? i / last : 0
    const w = (w0 + (w1 - w0) * t + bulge * Math.sin(Math.PI * t)) / 2
    L.push([p[0] - ty * w, p[1] + tx * w])
    R.push([p[0] + ty * w, p[1] - tx * w])
  })
  return poly(L.concat(R.reverse()))
}

const poly = (pts: Pt[]) => "M" + pts.map((p) => n1(p[0]) + " " + n1(p[1])).join("L") + "Z"

/** Seeded, so every render of a card draws the same tree. */
const rng = (seed: number) => {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** A bare tree, grown recursively. Returns one path per limb. */
const tree = (x: number, y: number, ang: number, len: number, w: number, depth: number, rand: () => number, out: string[] = []) => {
  const a2 = ang + (rand() - 0.5) * 0.5
  const ex = x + Math.cos(a2) * len
  const ey = y + Math.sin(a2) * len
  const mx = x + Math.cos(ang) * len * 0.5
  const my = y + Math.sin(ang) * len * 0.5
  out.push(ribbon(spline([[x, y], [mx, my], [mx, my], [ex, ey]], 6), w, w * 0.6))
  if (depth > 0) {
    const k = depth > 3 ? 2 : 2 + (rand() > 0.45 ? 1 : 0)
    for (let i = 0; i < k; i++) {
      tree(ex, ey, a2 + (i - (k - 1) / 2) * 0.7 + (rand() - 0.5) * 0.4, len * (0.6 + rand() * 0.18), w * 0.6, depth - 1, rand, out)
    }
  }
  return out
}

const spire = (x: number, top: number, w: number, base: number): string[] => {
  const shoulder = top + (base - top) * 0.3
  const main = poly([[x - w / 2, base], [x - w / 2, shoulder], [x, top], [x + w / 2, shoulder], [x + w / 2, base]])
  const pin = (px: number) => {
    const t = top + (base - top) * 0.34
    const pw = w * 0.34
    return poly([[px - pw / 2, base], [px - pw / 2, t + (base - t) * 0.25], [px, t], [px + pw / 2, t + (base - t) * 0.25], [px + pw / 2, base]])
  }
  return [main, pin(x - w * 0.66), pin(x + w * 0.66), poly([[x - 0.8, top], [x - 0.8, top - 10], [x + 0.8, top - 10], [x + 0.8, top]])]
}

const roundArch = (x: number, y: number, w: number, h: number) =>
  "M" + x + " " + (y + h) + "V" + (y + w / 2) + "A" + w / 2 + " " + w / 2 + " 0 0 1 " + (x + w) + " " + (y + w / 2) + "V" + (y + h) + "Z"

const pointedArch = (x: number, y: number, w: number, h: number) =>
  "M" + x + " " + (y + h) + "V" + (y + w * 0.7) +
  "C" + x + " " + (y + w * 0.25) + " " + (x + w * 0.3) + " " + (y + w * 0.05) + " " + (x + w / 2) + " " + y +
  "C" + (x + w * 0.7) + " " + (y + w * 0.05) + " " + (x + w) + " " + (y + w * 0.25) + " " + (x + w) + " " + (y + w * 0.7) +
  "V" + (y + h) + "Z"

/** The lit part of a moon. k = 1 full, 0 half, near -1 a thin crescent. */
const moon = (cx: number, cy: number, r: number, k: number) =>
  "M" + cx + " " + (cy - r) + "A" + r + " " + r + " 0 0 1 " + cx + " " + (cy + r) +
  "A" + n1(Math.abs(k) * r) + " " + r + " 0 0 " + (k > 0 ? 1 : 0) + " " + cx + " " + (cy - r) + "Z"

const BIRD =
  "M-22 5C-15 3-9 3-4 1C-7-7-13-15-24-21C-9-19 1-12 4-3C7-10 14-19 27-24C19-13 13-5 10 1C14 0 18-1 22-1L19 3C13 6 5 9-5 8C-12 8-18 7-22 5Z"
const CROW =
  "M-14 10C-10 2-2-4 8-5C11-9 16-10 20-8L25-8L20-5C20 1 16 6 9 8L-2 11L-16 18L-12 12Z"

const Paths = ({ d, ...rest }: { d: string[] } & Omit<React.SVGProps<SVGPathElement>, "d">) => (
  <>
    {d.map((p, i) => (
      <path key={i} d={p} {...rest} />
    ))}
  </>
)

const Birds = ({ list, fill, filter }: { list: number[][]; fill: string; filter?: string }) => (
  <g fill={fill} filter={filter}>
    {list.map(([x, y, s, r, f], i) => (
      <path key={i} d={BIRD} transform={"translate(" + x + " " + y + ") rotate(" + r + ") scale(" + (f ? -s : s) + " " + s + ")"} />
    ))}
  </g>
)

/** Ribbon helper with the spline built in. */
const rib = (pts: Pt[], w0: number, w1: number, bulge = 0, n = 14) => ribbon(spline(pts, n), w0, w1, bulge)

const dragonPaths = (c: Ctx) => {
  const body = rib(
    [[-22, -78], [0, -72], [20, -52], [14, -24], [8, 4], [-22, 14], [-14, 44], [-8, 74], [32, 92], [48, 68], [60, 48], [34, 34], [28, 56]],
    15, 1.5, 10,
  )
  const wingA: Pt[] = [[12, -42], [72, -112], [66, -84], [88, -74], [74, -52], [84, -40], [60, -26], [64, -14]]
  const wingB: Pt[] = [[2, -46], [-26, -120], [-30, -98], [-56, -104], [-50, -82], [-70, -76], [-46, -64], [-40, -52]]
  return (
    <>
      <path d={poly(wingB)} fill={c.g} opacity={0.82} />
      <path d={rib([[2, -46], [-10, -80], [-20, -104], [-26, -120]], 5, 1.5)} fill={c.g} />
      <path d={body} fill={c.g} />
      <path d={poly(wingA)} fill={c.g} />
      <path d={rib([[12, -42], [34, -72], [56, -98], [72, -112]], 5, 1.5)} fill={c.g} />
      <g stroke={c.ink} strokeOpacity={0.45} strokeWidth={1} fill="none">
        <path d="M12 -42L66 -84M12 -42L74 -52M12 -42L60 -26" />
        <path d="M2 -46L-30 -98M2 -46L-50 -82M2 -46L-46 -64" />
      </g>
      {/* head, horns, legs */}
      <path d="M-18 -86L-44 -84L-52 -77L-42 -72L-24 -69C-14 -71-12 -83-18 -86Z" fill={c.g} />
      <path d={rib([[-18, -84], [-14, -94], [-8, -100], [-2, -106]], 3.4, 0.4)} fill={c.g} />
      <path d={rib([[-24, -84], [-24, -94], [-20, -100], [-16, -104]], 2.6, 0.4)} fill={c.g} />
      <circle cx={-30} cy={-80} r={1.6} fill={c.ink} />
      <path d={rib([[10, -8], [2, 0], [-6, 4], [-14, 6]], 5, 2.4)} fill={c.g} />
      <path d={rib([[-12, 34], [-18, 40], [-24, 44], [-30, 44]], 6, 2.4)} fill={c.g} />
      <g fill={c.g}>
        {[[4, -60], [10, -34], [6, -6], [-14, 20], [-12, 50], [4, 80], [34, 84]].map(([x, y], i) => (
          <path key={i} d={"M" + x + " " + y + "l6 -2l-3 7z"} />
        ))}
      </g>
    </>
  )
}

const phoenixPaths = (c: Ctx) => {
  const out: string[] = []
  // Two wings raised in a heraldic spread: long primaries, then a shorter row
  // of coverts over their roots so the wing reads as layered, not as a fan.
  for (const side of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + side * (0.25 + k * 0.2)
      const len = 62 - k * 5
      const sx = side * 5
      const ex = sx + Math.cos(a) * len
      const ey = -14 + Math.sin(a) * len
      out.push(rib([[sx, -14], [sx + Math.cos(a) * len * 0.4, -14 + Math.sin(a) * len * 0.4], [ex - side * 6, ey + 4], [ex, ey]], 8, 0.6, 3, 8))
    }
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + side * (0.4 + k * 0.24)
      const len = 26 - k * 2
      out.push(rib([[side * 4, -12], [side * 4 + Math.cos(a) * len * 0.5, -12 + Math.sin(a) * len * 0.5], [side * 4 + Math.cos(a) * len, -12 + Math.sin(a) * len], [side * 4 + Math.cos(a) * len, -12 + Math.sin(a) * len]], 10, 1, 2, 6))
    }
  }
  // The tail falls in five long plumes that curl at the ends.
  for (let k = 0; k < 5; k++) {
    const t = k - 2
    out.push(rib([[0, 18], [t * 10, 36], [t * 30, 48], [t * 30 + (t < 0 ? -8 : 8), 70 - Math.abs(t) * 4], [t * 30 + (t < 0 ? -16 : 16), 84], [t * 22 + (t < 0 ? -18 : 18), 90], [t * 24 + (t < 0 ? -12 : 12), 80]], 6, 0.6, 2))
  }
  out.push(rib([[4, -38], [2, -20], [-2, 0], [0, 22]], 6, 7, 10, 10))
  out.push(rib([[4, -42], [-2, -50], [-8, -54], [-14, -60]], 2.4, 0.3))
  out.push(rib([[3, -42], [-1, -52], [-4, -58], [-6, -66]], 2.4, 0.3))
  return (
    <>
      <Paths d={out} fill={c.g} />
      <circle cx={5} cy={-40} r={6} fill={c.g} />
      <path d="M10 -42L20 -38L10 -36Z" fill={c.g} />
      <circle cx={7} cy={-41} r={1.2} fill={c.ink} />
      <path d="M0 -8C4 0 4 8 0 16" fill="none" stroke={c.ink} strokeOpacity={0.35} strokeWidth={1} />
    </>
  )
}

const handPaths = (c: Ctx, fill = c.g) => {
  const knuckles = [-10.5, -3.5, 3.5, 10]
  const spread = [-4, -1.2, 1.4, 4]
  const lens = [26, 33, 31, 24]
  const fingers = knuckles.map((x, i) => {
    const s = spread[i]
    const L = lens[i]
    return rib([[x, 40], [x + s * 0.3, 40 + L * 0.35], [x + s, 40 + L * 0.7], [x + s * 1.15, 40 + L]], 6.6, 4.8)
  })
  return (
    <>
      <path d="M-15 -16H15V0H-15Z" fill={c.bright} opacity={0.9} />
      <path d="M-15 -2Q-11 3-7 -2Q-3 3 1 -2Q5 3 9 -2Q13 3 15 -2" fill="none" stroke={c.cream} strokeWidth={1.4} />
      <path d="M-13 0C-15 14-16 30-14 43L14 43C15 30 14 14 13 0Z" fill={fill} />
      <Paths d={fingers} fill={fill} />
      {knuckles.map((x, i) => (
        <circle key={i} cx={x + spread[i] * 1.15} cy={40 + lens[i]} r={2.4} fill={fill} />
      ))}
      <path d={rib([[-12, 16], [-20, 24], [-24, 34], [-23, 46]], 8, 5)} fill={fill} />
      <circle cx={-23} cy={46} r={2.5} fill={fill} />
      <path d="M-6 30C-2 34 4 34 8 29" fill="none" stroke={c.ink} strokeOpacity={0.35} strokeWidth={0.9} />
    </>
  )
}

const heartPaths = (c: Ctx) => (
  <>
    <path d={rib([[-2, -22], [-4, -46], [16, -52], [20, -34]], 11, 8)} fill={c.g} />
    <path d={rib([[8, -22], [10, -36], [24, -40], [31, -31]], 8, 6)} fill={c.g} />
    <path d={rib([[-16, -20], [-19, -32], [-22, -40], [-26, -48]], 7, 6)} fill={c.g} />
    <path d="M-4 -26C-24 -34-40 -12-34 8C-28 28-8 38 4 48C14 34 34 22 34 0C34 -18 18 -30 4 -24Z" fill={c.g} />
    <g fill="none" stroke={c.ink} strokeOpacity={0.4} strokeWidth={1.1}>
      <path d="M-6 -18C-2 0-8 18 2 40" />
      <path d="M-6 -4C6 0 14 10 20 20" />
      <path d="M-20 -6C-22 6-16 16-10 24" />
    </g>
    <g fill={c.ink} opacity={0.6}>
      <ellipse cx={20} cy={-34} rx={3.5} ry={2} />
      <ellipse cx={31} cy={-31} rx={2.6} ry={1.6} />
      <ellipse cx={-26} cy={-48} rx={2.6} ry={1.5} />
    </g>
  </>
)

const lily = (x: number, y: number, s: number, rot: number) => {
  const out: string[] = []
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 + rot
    const ex = x + Math.cos(a) * 16 * s
    const ey = y + Math.sin(a) * 16 * s
    const mx = x + Math.cos(a + 0.2) * 9 * s
    const my = y + Math.sin(a + 0.2) * 9 * s
    out.push(rib([[x, y], [mx, my], [mx, my], [ex, ey]], 1.4 * s, 0.2, 8 * s, 8))
  }
  return out
}

const leaf = (x: number, y: number, len: number, rot: number) =>
  "M0 0Q" + len * 0.45 + " " + -len * 0.32 + " " + len + " 0Q" + len * 0.45 + " " + len * 0.32 + " 0 0Z|" + x + "|" + y + "|" + rot

const Leaves = ({ list, fill }: { list: string[]; fill: string }) => (
  <>
    {list.map((s, i) => {
      const [d, x, y, r] = s.split("|")
      return <path key={i} d={d} fill={fill} transform={"translate(" + x + " " + y + ") rotate(" + r + ")"} />
    })}
  </>
)

const Curtains = ({ c, tie = 180, inner = 112 }: { c: Ctx; tie?: number; inner?: number }) => {
  const left =
    "M18 18H" + inner + "C" + (inner - 30) + " 60 " + (inner - 44) + " " + (tie - 60) + " 64 " + tie +
    "C58 " + (tie + 30) + " 74 " + (tie + 90) + " 50 402H18Z"
  const folds = "M40 18C40 80 44 140 50 " + tie + "M62 18C60 80 58 140 58 " + tie + "M84 18C78 70 70 130 62 " + tie
  const one = (
    <>
      <path d={left} fill={c.cloth} />
      <path d={folds} stroke={c.ink} strokeOpacity={0.45} strokeWidth={2} fill="none" />
      <path d={"M36 " + (tie + 2) + "Q64 " + (tie + 10) + " 72 " + (tie - 4)} stroke={c.g} strokeWidth={3} fill="none" />
    </>
  )
  return (
    <>
      {one}
      <g transform={"translate(" + W + " 0) scale(-1 1)"}>{one}</g>
      <path d="M18 18H282V36C250 64 210 64 184 44C168 58 132 58 116 44C90 64 50 64 18 36Z" fill={c.cloth} />
      <path d="M18 36C50 64 90 64 116 44C132 58 168 58 184 44C210 64 250 64 282 36" stroke={c.g} strokeWidth={1.6} fill="none" />
    </>
  )
}

const balustrade = (y: number, h: number, x0: number, x1: number, step: number) => {
  const out: string[] = []
  for (let x = x0; x <= x1 + 0.1; x += step) {
    out.push(
      "M" + (x - 4) + " " + (y + h) +
      "C" + (x - 9) + " " + (y + h * 0.8) + " " + (x - 8) + " " + (y + h * 0.5) + " " + (x - 2.5) + " " + (y + h * 0.3) +
      "L" + (x - 4.5) + " " + (y + h * 0.12) + "L" + (x - 4.5) + " " + y + "H" + (x + 4.5) +
      "L" + (x + 4.5) + " " + (y + h * 0.12) + "L" + (x + 2.5) + " " + (y + h * 0.3) +
      "C" + (x + 8) + " " + (y + h * 0.5) + " " + (x + 9) + " " + (y + h * 0.8) + " " + (x + 4) + " " + (y + h) + "Z",
    )
  }
  return out
}

const king = "M-20 0H20V-5C14 -8 12 -12 10 -14H-10C-12 -12 -14 -8 -20 -5ZM-10 -14C-8 -30 -6 -40 -8 -46H8C6 -40 8 -30 10 -14ZM-11 -50H11V-46H-11ZM-9 -50C-12 -58 -8 -64 0 -64C8 -64 12 -58 9 -50ZM-1.8 -76H1.8V-64H-1.8ZM-6 -72H6V-68.4H-6Z"
const pawn = "M-13 0H13V-4C9 -6 7 -9 6 -12H-6C-7 -9 -9 -6 -13 -4ZM-6 -12C-5 -20 -4 -24 -5 -27H5C4 -24 5 -20 6 -12ZM-8 -29H8V-26H-8ZM0 -41A7 7 0 1 1 0 -27A7 7 0 1 1 0 -41Z"

// ---------------------------------------------------------------------------
// The nine illustrations. All on a 300×420 card, art inside an 18-unit margin.

const SCENE: Record<Scene, (c: Ctx) => React.ReactNode> = {
  murder: (c) => {
    const rand = rng(11)
    const right = tree(270, 404, -1.78, 86, 13, 5, rand)
    const left = tree(8, 96, -0.45, 52, 9, 4, rand)
    const far = [[46, 128, 22], [74, 88, 28], [102, 146, 18], [128, 112, 24], [154, 172, 16], [178, 206, 14]].flatMap(([x, t, w]) => spire(x, t, w, 362))
    const near = [[32, 196, 20], [60, 164, 26], [90, 214, 16], [118, 238, 18]].flatMap(([x, t, w]) => spire(x, t, w, 372))
    return (
      <>
        <rect x={0} y={0} width={W} height={H} fill={c.sky} />
        <circle cx={196} cy={150} r={150} fill={c.glow} opacity={0.75} />
        <Paths d={far} fill={c.mid} opacity={0.85} />
        <Paths d={near} fill={c.deep} />
        <path d="M18 352C70 334 120 366 170 348C220 330 250 356 282 344V402H18Z" fill={c.ink} />
        <Paths d={right} fill={c.ink} />
        <Paths d={left} fill={c.ink} />
        <path d={CROW} fill={c.ink} transform="translate(226 350) scale(1.35)" />
        <path d="M232 364L230 372M238 363L238 371" stroke={c.ink} strokeWidth={1.4} />
        <Birds
          fill={c.g}
          filter={c.leaf}
          list={[[70, 316, 1.05, -18], [118, 276, 0.82, -24], [154, 246, 0.7, -10], [182, 210, 0.62, -30], [214, 184, 0.54, -14], [240, 150, 0.48, -26], [196, 132, 0.42, -18], [252, 108, 0.38, -24], [150, 300, 0.58, -34]]}
        />
      </>
    )
  },

  oath: (c) => {
    const castle = [[150, 108, 30], [112, 152, 22], [188, 152, 22], [130, 196, 16], [170, 196, 16], [86, 222, 14], [214, 222, 14]].flatMap(([x, t, w]) => spire(x, t, w, 350))
    return (
      <>
        <rect x={0} y={0} width={W} height={H} fill={c.sky} />
        <rect x={0} y={0} width={W} height={H} fill={c.ink} opacity={0.35} />
        <circle cx={150} cy={220} r={120} fill={c.glow} opacity={0.55} />
        <Paths d={castle} fill={c.ink} />
        <circle cx={150} cy={78} r={42} fill={c.glow} />
        <circle cx={150} cy={78} r={15} fill={c.ink} />
        <circle cx={150} cy={78} r={15} fill="none" stroke={c.g} strokeWidth={2.6} filter={c.leaf} />
        <Curtains c={c} tie={196} />
        <g fill={c.g} filter={c.leaf}>
          <circle cx={150} cy={104} r={7} />
          <path d="M146 110H154V146H146Z" />
          <path d="M110 150C120 142 136 145 150 142C164 145 180 142 190 150C182 157 166 154 150 156C134 154 118 157 110 150Z" />
          <circle cx={108} cy={148} r={4} />
          <circle cx={192} cy={148} r={4} />
          <path d="M141 156H159L157 300L150 334L143 300Z" />
          <path d={balustrade(348, 44, 30, 270, 20).join("")} />
          <path d="M18 338H282V347H18Z" />
          <path d="M18 391H282V398H18Z" />
        </g>
        <g stroke={c.ink} strokeOpacity={0.5} fill="none">
          <path d="M150 162V300" strokeWidth={1.4} />
          <path d="M146 118H154M146 126H154M146 134H154" strokeWidth={1} />
        </g>
        <circle cx={150} cy={104} r={2.6} fill={c.ink} />
        <circle cx={150} cy={149} r={3.6} fill={c.bright} />
      </>
    )
  },

  wyrm: (c) => {
    const arches = Array.from({ length: 6 }, (_, i) => roundArch(22 + i * 44, 322, 32, 90))
    return (
      <>
        <rect x={0} y={0} width={W} height={H} fill={c.sky} />
        <circle cx={196} cy={206} r={130} fill={c.glow} opacity={0.6} />
        <path d={roundArch(128, 60, 150, 280)} fill="none" stroke={c.mid} strokeWidth={10} opacity={0.7} />
        <rect x={18} y={306} width={264} height={96} fill={c.deep} />
        <Paths d={arches} fill={c.ink} />
        <path d="M18 306H282" stroke={c.mid} strokeWidth={4} />
        <g fill={c.g} filter={c.leaf}>
          {[[150, 36, 1], [116, 44, 0.5], [86, 60, 0], [62, 82, -0.5], [44, 110, -0.8]].map(([x, y, k], i) => (
            <path key={i} d={moon(x, y, 9, k)} />
          ))}
        </g>
        <g fill={c.g} filter={c.leaf}>
          <path d="M32 174H88V184H32Z" />
          <circle cx={36} cy={186} r={7} />
          <circle cx={84} cy={186} r={7} />
          <path d="M38 186H82V192H38Z" />
          <path d="M42 192H78V330H42Z" />
          <path d="M36 330H84V340H36ZM30 340H90V350H30Z" />
        </g>
        <g stroke={c.goldDark} strokeWidth={1.4}>
          {[48, 54, 60, 66, 72].map((x) => (
            <path key={x} d={"M" + x + " 196V326"} />
          ))}
        </g>
        <circle cx={36} cy={186} r={2.4} fill={c.goldDark} />
        <circle cx={84} cy={186} r={2.4} fill={c.goldDark} />
        <path d={rib([[18, 372], [60, 344], [96, 392], [150, 358]], 18, 6)} fill={c.bright} />
        <path d={rib([[18, 380], [60, 352], [96, 400], [150, 364]], 3, 1)} fill={c.deep} opacity={0.6} />
        <g filter={c.leaf}>
          <g transform="translate(196 214) scale(1.06)">{dragonPaths(c)}</g>
          <path d={rib([[112, 330], [114, 306], [104, 288], [110, 262]], 3, 1.6)} fill={c.g} />
          <Leaves fill={c.g} list={[leaf(110, 306, 16, -150), leaf(112, 290, 14, -20), leaf(108, 316, 12, 10)]} />
          <circle cx={110} cy={258} r={8} fill={c.g} />
        </g>
        <path d="M110 258m-2 0a2 2 0 1 1 4 0a4 4 0 1 1-8 0a6 6 0 1 1 12 0" fill="none" stroke={c.ink} strokeOpacity={0.45} strokeWidth={0.9} />
      </>
    )
  },

  banquet: (c) => {
    const arms = [-56, -32, 32, 56]
    return (
      <>
        <rect x={0} y={0} width={W} height={H} fill={c.sky} />
        <rect x={0} y={0} width={W} height={H} fill={c.ink} opacity={0.3} />
        <path d={pointedArch(84, 70, 132, 270)} fill={c.bright} opacity={0.55} />
        <circle cx={150} cy={170} r={80} fill={c.glow} />
        <g stroke={c.ink} strokeWidth={3} fill="none">
          <path d={pointedArch(84, 70, 132, 270)} strokeWidth={6} />
          <path d="M117 124V340M150 104V340M183 124V340" />
          {[170, 205, 240, 275, 310].map((y) => (
            <path key={y} d={"M84 " + y + "H216"} />
          ))}
          <circle cx={150} cy={130} r={18} />
        </g>
        <Curtains c={c} tie={210} inner={104} />
        <path d="M18 330H282V402H18Z" fill={c.ink} />
        <g stroke={c.deep} strokeWidth={1}>
          <path d="M18 350H282M18 374H282M150 330L110 402M150 330L190 402M150 330L60 402M150 330L240 402" />
        </g>
        <g filter={c.leaf}>
          <path d="M150 18V70" stroke={c.g} strokeWidth={1.6} />
          <g stroke={c.g} strokeWidth={2.6} fill="none">
            {arms.map((dx) => (
              <path key={dx} d={"M150 96C" + (150 + dx * 0.3) + " 112 " + (150 + dx * 0.9) + " 110 " + (150 + dx) + " 96"} />
            ))}
            <path d="M150 104C140 124 160 124 150 104" />
          </g>
          <g fill={c.g}>
            <ellipse cx={150} cy={86} rx={7} ry={16} />
            <circle cx={150} cy={66} r={4} />
            {arms.map((dx) => (
              <path key={dx} d={"M" + (144 + dx) + " 92H" + (156 + dx) + "L" + (153 + dx) + " 98H" + (147 + dx) + "Z"} />
            ))}
          </g>
          <g fill={c.g}>
            <ellipse cx={150} cy={278} rx={58} ry={8} />
            <path d={rib([[150, 284], [150, 310], [150, 340], [150, 370]], 7, 5, 3)} />
            <circle cx={150} cy={310} r={5} />
            <path d="M150 366C138 372 124 378 116 390L124 390C132 382 142 378 150 376C158 378 168 382 176 390L184 390C176 378 162 372 150 366Z" />
          </g>
        </g>
        <g fill={c.cream}>
          {arms.map((dx) => (
            <rect key={dx} x={148 + dx} y={78} width={4} height={14} />
          ))}
        </g>
        <g fill={c.bright}>
          {arms.map((dx) => (
            <path key={dx} d={"M" + (150 + dx) + " 66C" + (153 + dx) + " 71 " + (153 + dx) + " 76 " + (150 + dx) + " 77C" + (147 + dx) + " 76 " + (147 + dx) + " 71 " + (150 + dx) + " 66Z"} />
          ))}
        </g>
        <g fill={c.cream} opacity={0.9}>
          {[-44, -20, 0, 20, 44].map((dx, i) => (
            <circle key={dx} cx={150 + dx} cy={116 + (i % 2) * 8} r={2} />
          ))}
        </g>
        <path d="M137 232C137 256 163 256 163 232Z" fill={c.cream} opacity={0.18} />
        <path d="M138.6 242C140 254 160 254 161.4 242Z" fill={c.bright} />
        <path d="M137 232C137 256 163 256 163 232M150 252V272M141 273H159" fill="none" stroke={c.cream} strokeWidth={1.3} />
        <g fill={c.bright}>
          <circle cx={178} cy={272} r={3.6} />
          <circle cx={186} cy={273} r={3.6} />
        </g>
        <path d="M178 268C180 262 183 260 186 258M186 269C186 264 186 262 186 258" stroke={c.cream} strokeWidth={0.8} fill="none" />
      </>
    )
  },

  hour: (c) => {
    const rand = rng(5)
    const back: string[] = []
    const front: string[] = []
    for (let x = 14; x < 290; ) {
      const w = 12 + rand() * 18
      const h = 70 + rand() * 90
      back.push(poly([[x, 402], [x, 402 - h], [x + w / 2, 402 - h - 14 * rand()], [x + w, 402 - h], [x + w, 402]]))
      x += w + 1
    }
    for (let x = 14; x < 290; ) {
      const w = 16 + rand() * 20
      const h = 30 + rand() * 60
      front.push(poly([[x, 402], [x, 402 - h], [x + w, 402 - h], [x + w, 402]]))
      x += w
    }
    const nums = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"]
    return (
      <>
        <rect x={0} y={0} width={W} height={H} fill={c.sky} />
        <circle cx={150} cy={140} r={170} fill={c.glow} />
        <circle cx={150} cy={168} r={116} fill="none" stroke={c.cream} strokeOpacity={0.25} strokeWidth={1} />
        {nums.map((s, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2
          return (
            <text key={s} x={n1(150 + Math.cos(a) * 104)} y={n1(174 + Math.sin(a) * 104)} textAnchor="middle" fontFamily={SERIF} fontSize={17} fill={c.cream} opacity={0.85}>
              {s}
            </text>
          )
        })}
        <Paths d={back} fill={c.deep} />
        <g fill={c.bright} opacity={0.7}>
          {Array.from({ length: 26 }, (_, i) => (
            <rect key={i} x={n1(24 + rand() * 250)} y={n1(300 + rand() * 90)} width={2.4} height={3.4} />
          ))}
        </g>
        <Paths d={front} fill={c.ink} />
        <circle cx={150} cy={168} r={36} fill={c.g} filter={c.leaf} />
        <path d={CROW} fill={c.ink} transform="translate(148 170) scale(1.35)" />
        <Birds
          fill={c.ink}
          list={[[48, 80, 0.5, -10], [240, 60, 0.7, 12, 1], [262, 104, 0.45, 20, 1], [70, 130, 0.36, -4], [220, 118, 0.3, 8, 1], [96, 52, 0.3, -12], [200, 44, 0.38, 6, 1], [42, 210, 0.4, 0], [252, 214, 0.5, 14, 1], [180, 250, 0.3, 4, 1]]}
        />
        <g fill={c.g} filter={c.leaf}>
          {[[146, 226, 30], [168, 252, -20], [138, 272, 50], [176, 292, -40], [152, 312, 12]].map(([x, y, r], i) => (
            <path key={i} transform={"translate(" + x + " " + y + ") rotate(" + r + ")"} d={rib([[0, -9], [2, -4], [2, 3], [0, 9]], 0.5, 0.3, 6, 8)} />
          ))}
        </g>
      </>
    )
  },

  heart: (c) => {
    const flowers = [...lily(126, 108, 1, 0.3), ...lily(170, 94, 1.1, 0), ...lily(146, 70, 0.9, 0.5)]
    return (
      <>
        <rect x={0} y={0} width={W} height={H} fill={c.sky} />
        <rect x={0} y={0} width={W} height={H} fill={c.ink} opacity={0.35} />
        <path d={roundArch(74, 44, 152, 320)} fill={c.paper} />
        <path d={roundArch(90, 60, 120, 300)} fill={c.ink} />
        <circle cx={150} cy={170} r={90} fill={c.glow} opacity={0.6} />
        {[26, 236].map((x) => (
          <g key={x}>
            <rect x={x} y={70} width={38} height={300} fill={c.deep} />
            <rect x={x - 4} y={64} width={46} height={10} fill={c.mid} />
            {[8, 16, 24, 32].map((d) => (
              <path key={d} d={"M" + (x + d) + " 80V364"} stroke={c.paper} strokeOpacity={0.6} strokeWidth={1.2} />
            ))}
          </g>
        ))}
        <path d="M130 246H170V372H130Z" fill={c.mid} />
        <g stroke={c.deep} strokeWidth={2}>
          <path d="M140 258V368M150 258V368M160 258V368" />
        </g>
        <path d="M18 362H282V402H18Z" fill={c.ink} />
        <g stroke={c.ink} strokeWidth={3}>
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={"M" + (26 + i * 19) + " 340V362"} />
          ))}
          <path d="M18 340H282" strokeWidth={4} />
        </g>
        <g filter={c.leaf}>
          <g fill={c.g}>
            <path d="M122 238H178V248H122ZM126 366H174V374H126Z" />
            <path d={rib([[148, 196], [140, 170], [130, 140], [126, 110]], 3, 1.6)} />
            <path d={rib([[154, 196], [160, 160], [168, 128], [170, 96]], 3, 1.6)} />
            <path d={rib([[150, 196], [148, 150], [146, 110], [146, 72]], 3, 1.6)} />
            <Leaves fill={c.g} list={[leaf(138, 162, 20, 200), leaf(162, 150, 18, -30), leaf(148, 130, 16, 210), leaf(166, 120, 14, -50)]} />
            <Paths d={flowers} />
            <g transform="translate(150 212) scale(0.92)">{heartPaths(c)}</g>
          </g>
        </g>
        <g fill={c.bright}>
          <circle cx={126} cy={108} r={2.2} />
          <circle cx={170} cy={94} r={2.2} />
          <circle cx={146} cy={70} r={2} />
        </g>
      </>
    )
  },

  covenant: (c) => {
    const spires = [[150, 236, 34], [104, 280, 22], [196, 280, 22], [62, 300, 16], [238, 300, 16], [128, 300, 12], [172, 300, 12]].flatMap(([x, t, w]) => spire(x, t, w, 402))
    const teeth: string[] = []
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2
      const b = a + (Math.PI * 2) / 80
      teeth.push(poly([[150 + Math.cos(a) * 44, 206 + Math.sin(a) * 44], [150 + Math.cos(b) * 60, 206 + Math.sin(b) * 60], [150 + Math.cos(a + (Math.PI * 2) / 40) * 44, 206 + Math.sin(a + (Math.PI * 2) / 40) * 44]]))
    }
    return (
      <>
        <rect x={0} y={0} width={W} height={H} fill={c.sky} />
        <rect x={0} y={0} width={W} height={H} fill={c.ink} opacity={0.25} />
        <Paths d={[roundArch(40, 30, 220, 380)]} fill="none" stroke={c.mid} strokeWidth={8} />
        <circle cx={150} cy={206} r={96} fill={c.glow} />
        <Paths d={spires} fill={c.deep} />
        <circle cx={150} cy={330} r={16} fill={c.ink} />
        <circle cx={150} cy={330} r={16} fill="none" stroke={c.mid} strokeWidth={2} />
        <Paths d={teeth} fill={c.bright} />
        <circle cx={150} cy={206} r={46} fill={c.ink} />
        <circle cx={150} cy={206} r={40} fill="none" stroke={c.bright} strokeWidth={3} />
        <path d="M132 202L140 190H160L168 202L150 228Z" fill={c.bright} />
        <g stroke={c.g} strokeWidth={1.3} fill="none" filter={c.leaf}>
          <path d="M132 202L140 190H160L168 202L150 228ZM132 202H168M140 190L145 202L150 228L155 202L160 190M145 202L150 190L155 202" />
        </g>
        <g filter={c.leaf}>
          <g transform="translate(150 96) scale(0.82)">{phoenixPaths(c)}</g>
          <g transform="translate(222 322) scale(-0.5 0.5)">{dragonPaths(c)}</g>
          <g transform="translate(78 322) scale(0.5)">{dragonPaths(c)}</g>
        </g>
      </>
    )
  },

  portrait: (c) => (
    <>
      <rect x={0} y={0} width={W} height={H} fill={c.sky} />
      <path d="M18 18H282V402Z" fill={c.bright} opacity={0.35} />
      <path d="M150 70L290 210L150 350L10 210Z" fill={c.ink} opacity={0.7} />
      <g fill={c.g} filter={c.leaf}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={moon(36, 56 + i * 26, 6, 1 - i * 0.36)} />
        ))}
      </g>
      <g transform="rotate(-11 150 215)">
        <rect x={82} y={126} width={136} height={178} fill={c.paper} />
        <circle cx={150} cy={215} r={60} fill={c.glow} />
        <circle cx={150} cy={224} r={32} fill={c.deep} />
        <circle cx={150} cy={224} r={32} fill={c.glow} opacity={0.9} />
        <path d="M150 224m-32 0a32 32 0 0 0 64 0" fill={c.ink} opacity={0.35} />
        <circle cx={138} cy={212} r={7} fill={c.cream} opacity={0.18} />
        <g fill={c.bright}>
          {[[140, 230], [150, 236], [160, 230], [145, 244], [156, 244], [150, 224]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx={3.2} ry={4} />
          ))}
        </g>
        <g filter={c.leaf}>
          <path d="M70 114H230V316H70ZM84 128V302H216V128Z" fillRule="evenodd" fill={c.g} />
          <g fill={c.g}>
            {[[70, 114], [230, 114], [70, 316], [230, 316]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={9} />
            ))}
            {[150, 70, 230].map((x, i) => (
              <circle key={i} cx={x} cy={i ? 215 : 114} r={6} />
            ))}
            <circle cx={150} cy={316} r={6} />
            <path d="M139 194L142 182L146 191L150 179L154 191L158 182L161 194Z" />
            <path d={rib([[104, 280], [130, 290], [196, 276], [186, 240], [178, 216], [110, 236], [114, 204], [118, 180], [170, 170], [194, 186]], 1.5, 4.5, 2)} />
            <path d="M192 182L204 184L194 192Z" />
          </g>
          <path d="M77 121H223V309H77Z" fill="none" stroke={c.goldDark} strokeWidth={1} />
        </g>
      </g>
      <g filter={c.leaf}>
        <g transform="translate(262 34) rotate(40) scale(1.05)">{handPaths(c)}</g>
        <g transform="translate(40 402) rotate(214) scale(1.05)">{handPaths(c)}</g>
      </g>
      <path d="M58 344C90 330 110 300 96 280C88 262 140 250 176 180" fill="none" stroke={c.bright} strokeWidth={1.2} />
    </>
  ),

  gambit: (c) => {
    const vp: Pt = [150, 180]
    const tiles: string[] = []
    const rows = [290, 300, 314, 332, 356, 386, 424]
    const xs = [-150, -90, -30, 30, 90, 150, 210, 270, 330, 390, 450]
    const at = (xb: number, y: number) => vp[0] + (xb - vp[0]) * ((y - vp[1]) / (402 - vp[1]))
    for (let r = 0; r < rows.length - 1; r++) {
      for (let k = 0; k < xs.length - 1; k++) {
        if ((r + k) % 2) continue
        const y0 = rows[r]
        const y1 = rows[r + 1]
        tiles.push(poly([[at(xs[k], y0), y0], [at(xs[k + 1], y0), y0], [at(xs[k + 1], y1), y1], [at(xs[k], y1), y1]]))
      }
    }
    return (
      <>
        <rect x={0} y={0} width={W} height={H} fill={c.deep} />
        <g fill={c.ink}>
          {Array.from({ length: 17 * 12 }, (_, i) => {
            const x = i % 17
            const y = Math.floor(i / 17)
            return (x + y) % 2 ? null : <rect key={i} x={18 + x * 16} y={18 + y * 16} width={16} height={16} />
          })}
        </g>
        <rect x={0} y={0} width={W} height={H} fill={c.sky} opacity={0.55} />
        <path d={roundArch(22, 120, 60, 180)} fill={c.ink} />
        <path d={roundArch(218, 120, 60, 180)} fill={c.ink} />
        <path d={roundArch(92, 60, 116, 240)} fill={c.paper} />
        <path d={roundArch(104, 72, 92, 228)} fill={c.deep} />
        <circle cx={150} cy={200} r={70} fill={c.glow} />
        <path d="M18 290H282V402H18Z" fill={c.ink} />
        <Paths d={tiles} fill={c.bright} />
        <path d="M18 290H282V402H18Z" fill={c.vig} />
        <g fill={c.ink}>
          <path d={pawn} transform="translate(72 352) scale(1.1)" />
          <path d={pawn} transform="translate(232 332)" />
          <path d={king} transform="translate(250 392) scale(0.8)" />
          <path d={pawn} transform="translate(96 312) scale(0.7)" />
        </g>
        <path d={rib([[150, 300], [120, 292], [90, 262], [110, 240], [130, 222], [96, 196], [70, 204]], 12, 3, 4)} fill={c.bright} />
        <path d={rib([[150, 300], [120, 292], [90, 262], [110, 240], [130, 222], [96, 196], [70, 204]], 2, 0.6)} fill={c.ink} opacity={0.5} />
        <g filter={c.leaf}>
          <path d={king} fill={c.g} transform="translate(150 304) scale(1.15)" />
          <g transform="translate(154 14) scale(1.12)">{handPaths(c)}</g>
        </g>
      </>
    )
  },
}

// ---------------------------------------------------------------------------
// Faces

type FaceProps = { card: StampCard; index: number; ink: Ink; uid: string }

/** The printed side. Memoised: pointer moves never re-render it. */
const StampFront = React.memo(function StampFront({ card, index, ink, uid }: FaceProps) {
  const id = (s: string) => uid + "f" + s
  const u = (s: string) => "url(#" + id(s) + ")"
  const c: Ctx = { ...ink, g: u("gold"), leaf: u("leaf"), sky: u("sky"), glow: u("glow"), cloth: u("cloth"), vig: u("vig"), id }
  const scene = card.scene ?? SCENES_IN_ORDER[index % SCENES_IN_ORDER.length]
  return (
    <svg viewBox={"0 0 " + W + " " + H} width="100%" height="100%" style={{ display: "block" }} aria-hidden="true">
      <defs>
        <linearGradient id={id("gold")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ink.goldLight} />
          <stop offset="0.3" stopColor={ink.gold} />
          <stop offset="0.52" stopColor={ink.goldDark} />
          <stop offset="0.72" stopColor={ink.goldLight} />
          <stop offset="1" stopColor={ink.gold} />
        </linearGradient>
        <linearGradient id={id("sky")} x1="0" y1={M} x2="0" y2={H - M} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={ink.bright} />
          <stop offset="0.3" stopColor={ink.paper} />
          <stop offset="0.72" stopColor={ink.deep} />
          <stop offset="1" stopColor={ink.ink} />
        </linearGradient>
        <radialGradient id={id("glow")}>
          <stop offset="0" stopColor={ink.bright} stopOpacity="0.85" />
          <stop offset="1" stopColor={ink.bright} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("cloth")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={ink.deep} />
          <stop offset="0.35" stopColor={ink.paper} />
          <stop offset="0.55" stopColor={ink.bright} />
          <stop offset="0.8" stopColor={ink.paper} />
          <stop offset="1" stopColor={ink.deep} />
        </linearGradient>
        <radialGradient id={id("vig")} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor={ink.ink} stopOpacity="0" />
          <stop offset="1" stopColor={ink.ink} stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id={id("paper")} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={mixHex(ink.paper, ink.bright, 0.25)} />
          <stop offset="1" stopColor={mixHex(ink.paper, ink.deep, 0.45)} />
        </linearGradient>
        <pattern id={id("damask")} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M5 1L9 5L5 9L1 5Z" fill={ink.deep} opacity="0.45" />
        </pattern>
        {/* Gold leaf: the flat gradient gets a mottle of darker flecks. */}
        <filter id={id("leaf")} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3" result="n" />
          <feColorMatrix in="n" type="matrix" values={"0 0 0 0 0.32  0 0 0 0 0.2  0 0 0 0 0.06  1.9 0 0 0 -0.95"} result="spots" />
          <feComposite in="spots" in2="SourceGraphic" operator="atop" />
        </filter>
        <clipPath id={id("art")}>
          <rect x={M} y={M} width={W - 2 * M} height={H - 2 * M} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill={u("paper")} />
      <path d={"M0 0H" + W + "V" + H + "H0ZM" + M + " " + M + "V" + (H - M) + "H" + (W - M) + "V" + M + "Z"} fill={u("damask")} fillRule="evenodd" />
      <rect x={10} y={10} width={W - 20} height={H - 20} fill="none" stroke={ink.gold} strokeOpacity={0.35} strokeWidth={0.8} />
      <g clipPath={u("art")}>
        {card.image ? (
          <>
            <rect x={M} y={M} width={W - 2 * M} height={H - 2 * M} fill={ink.deep} />
            <image href={card.image} x={M} y={M} width={W - 2 * M} height={H - 2 * M} preserveAspectRatio="xMidYMid slice" />
            <rect x={M} y={M} width={W - 2 * M} height={H - 2 * M} fill={ink.paper} opacity={0.18} style={{ mixBlendMode: "multiply" }} />
          </>
        ) : (
          SCENE[scene](c)
        )}
        <rect x={M} y={M} width={W - 2 * M} height={H - 2 * M} fill={c.vig} />
      </g>
      <rect x={M} y={M} width={W - 2 * M} height={H - 2 * M} fill="none" stroke={ink.ink} strokeOpacity={0.7} strokeWidth={1.6} />
    </svg>
  )
})

type BackProps = FaceProps & { total: number; collection: string; k: number }

/** The reverse: the title, the verse, and a postmark across the corner. */
const StampBack = React.memo(function StampBack({ card, index, total, ink, uid, collection, k }: BackProps) {
  const id = (s: string) => uid + "b" + s
  const numeral = card.numeral ?? toRoman(index + 1)
  const ring = (collection + " • " + numeral + " of " + toRoman(total) + " • ").toUpperCase()
  return (
    <div className="absolute inset-0" style={{ background: ink.deep }}>
      <svg viewBox={"0 0 " + W + " " + H} width="100%" height="100%" className="absolute inset-0" style={{ display: "block" }} aria-hidden="true">
        <defs>
          <radialGradient id={id("bg")} cx="0.5" cy="0.4" r="0.8">
            <stop offset="0" stopColor={mixHex(ink.deep, ink.paper, 0.45)} />
            <stop offset="1" stopColor={mixHex(ink.deep, ink.ink, 0.5)} />
          </radialGradient>
          <pattern id={id("lat")} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M12 2L22 12L12 22L2 12Z" fill="none" stroke={ink.gold} strokeOpacity="0.08" />
            <circle cx="12" cy="12" r="1.4" fill={ink.gold} fillOpacity="0.14" />
          </pattern>
          <path id={id("ring")} d="M204 344a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
        </defs>
        <rect width={W} height={H} fill={u(id("bg"))} />
        <rect width={W} height={H} fill={u(id("lat"))} />
        <g fill="none" stroke={ink.gold}>
          <rect x={22} y={22} width={W - 44} height={H - 44} strokeWidth={1.6} strokeOpacity={0.85} />
          <rect x={28} y={28} width={W - 56} height={H - 56} strokeWidth={0.6} strokeOpacity={0.6} />
          {[[22, 22, 1, 1], [W - 22, 22, -1, 1], [22, H - 22, 1, -1], [W - 22, H - 22, -1, -1]].map(([x, y, sx, sy], i) => (
            <path key={i} strokeWidth={1.2} d={"M" + x + " " + (y + sy * 30) + "C" + (x + sx * 16) + " " + (y + sy * 26) + " " + (x + sx * 8) + " " + (y + sy * 8) + " " + (x + sx * 30) + " " + y} />
          ))}
        </g>
        <g transform="rotate(-14 248 344)" opacity={0.75}>
          <g fill="none" stroke={ink.gold}>
            <circle cx={248} cy={344} r={52} strokeWidth={1.6} />
            <circle cx={248} cy={344} r={34} strokeWidth={1} />
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} strokeWidth={1.2} strokeOpacity={0.8} d={"M" + (40 + i * 6) + " " + (318 + i * 13) + "q18 -8 36 0t36 0t36 0t36 0t36 0"} />
            ))}
          </g>
          <text fontFamily={SERIF} fontSize={9.5} letterSpacing={2.2} fill={ink.gold}>
            <textPath href={"#" + id("ring")}>{ring}</textPath>
          </text>
          <text x={248} y={352} textAnchor="middle" fontFamily={SERIF} fontSize={24} fill={ink.gold}>
            {numeral}
          </text>
        </g>
      </svg>
      <div
        className="absolute flex flex-col items-center text-center"
        style={{ left: 40 * k, right: 40 * k, top: 46 * k, color: ink.cream, fontFamily: SERIF }}
      >
        <span style={{ fontSize: 11 * k, letterSpacing: "0.42em", textTransform: "uppercase", color: ink.gold, opacity: 0.85 }}>
          No. {numeral}
        </span>
        <span
          style={{
            marginTop: 14 * k,
            fontSize: 30 * k,
            lineHeight: 1.05,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: ink.goldLight,
            textShadow: "0 1px 0 rgba(0,0,0,.5)",
          }}
        >
          {card.title}
        </span>
        <svg width={120 * k} height={14 * k} viewBox="0 0 120 14" style={{ marginTop: 12 * k }} aria-hidden="true">
          <path d="M0 7H48M72 7H120" stroke={ink.gold} strokeOpacity={0.7} />
          <path d="M60 1L66 7L60 13L54 7Z" fill={ink.bright} stroke={ink.gold} strokeWidth={0.8} />
        </svg>
        {card.verse && (
          <p style={{ marginTop: 16 * k, fontSize: 15.5 * k, lineHeight: 1.45, fontStyle: "italic", whiteSpace: "pre-line", opacity: 0.92 }}>
            {card.verse}
          </p>
        )}
        {card.note && (
          <span style={{ marginTop: 12 * k, fontSize: 10.5 * k, letterSpacing: "0.3em", textTransform: "uppercase", color: ink.gold, opacity: 0.75 }}>
            {card.note}
          </span>
        )}
      </div>
    </div>
  )
})

const u = (id: string) => "url(#" + id + ")"

// ---------------------------------------------------------------------------

const STYLE =
  ".gsd-float{animation:gsd-float 7s ease-in-out infinite}" +
  "@keyframes gsd-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}" +
  ".gsd-btn{transition:background-color .2s,color .2s,transform .2s}" +
  ".gsd-btn:hover{transform:translateY(-1px)}" +
  ".gsd-card:focus-visible{outline:none}" +
  ".gsd-card:focus-visible .gsd-ring{opacity:1}" +
  "@media (prefers-reduced-motion: reduce){.gsd-float{animation:none}.gsd-btn:hover{transform:none}}"

const useReducedMotion = () => {
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

const Chevron = ({ dir }: { dir: 1 | -1 }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ transform: dir < 0 ? "scaleX(-1)" : undefined }}>
    <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function GothicStampDeck({
  cards = DEFAULT_STAMPS,
  title = "Love Song",
  script = "commission",
  epigraph = "From fairest creatures we desire increase,\nthat thereby beauty's rose might never die.",
  palette,
  height = "100svh",
  tilt = 14,
  foil = 1,
  defaultIndex = null,
  onSelect,
  className = "",
}: GothicStampDeckProps) {
  const uid = "gsd" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const palKey = JSON.stringify(palette ?? {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ink = React.useMemo(() => inkFrom({ ...DEFAULT_PALETTE, ...palette }), [palKey])
  const n = cards.length

  const stageRef = React.useRef<HTMLDivElement>(null)
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const tiltRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const drag = React.useRef({ x: 0, y: 0, on: false, moved: false })

  const [size, setSize] = React.useState({ w: 0, h: 0 })
  const [ready, setReady] = React.useState(false)
  const [active, setActive] = React.useState<number | null>(
    defaultIndex != null && n > 0 ? wrapIndex(defaultIndex, n) : null,
  )
  const [flipped, setFlipped] = React.useState<Record<number, boolean>>({})
  const [hover, setHover] = React.useState<number | null>(null)
  const reduced = useReducedMotion()

  // Measure the stage itself, never the window: it can sit anywhere on a page.
  React.useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (!size.w || ready) return
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [size.w, ready])

  // Keep the latest state reachable from the native wheel listener.
  const activeRef = React.useRef(active)
  activeRef.current = active

  const select = React.useCallback(
    (i: number | null) => {
      setActive(i)
      onSelect?.(i)
    },
    [onSelect],
  )
  const go = React.useCallback(
    (dir: number) => {
      const a = activeRef.current
      if (a === null || n === 0) return
      select(wrapIndex(a + dir, n))
    },
    [n, select],
  )
  const goRef = React.useRef(go)
  goRef.current = go

  const flip = React.useCallback((i: number) => setFlipped((f) => ({ ...f, [i]: !f[i] })), [])

  // Focus follows the deck, so the keyboard always acts on what is in front.
  const last = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (active !== null) cardRefs.current[active]?.focus({ preventScroll: true })
    else if (last.current !== null) cardRefs.current[last.current]?.focus({ preventScroll: true })
    last.current = active
    // Anything no longer in front settles back flat.
    tiltRefs.current.forEach((el, i) => {
      if (el && i !== active) settle(el)
    })
  }, [active])

  // Wheel and trackpad move the deck sideways. Native listener: React's is
  // passive and cannot stop the page scrolling underneath.
  React.useEffect(() => {
    const el = stageRef.current
    if (!el) return
    let acc = 0
    let lock = 0
    const onWheel = (e: WheelEvent) => {
      if (activeRef.current === null) return
      e.preventDefault()
      const now = performance.now()
      if (now < lock) {
        acc = 0
        return
      }
      acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(acc) > 40) {
        goRef.current(acc > 0 ? 1 : -1)
        acc = 0
        lock = now + 420
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const lean = (i: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (active !== null && i !== active) return
    if (drag.current.moved) return
    const el = tiltRefs.current[i]
    if (!el) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const t = tiltFromPointer(px, py, tilt)
    el.style.setProperty("--rx", t.rx.toFixed(2) + "deg")
    el.style.setProperty("--ry", t.ry.toFixed(2) + "deg")
    el.style.setProperty("--mx", (clamp01(px) * 100).toFixed(1) + "%")
    el.style.setProperty("--my", (clamp01(py) * 100).toFixed(1) + "%")
    el.style.setProperty("--shine", "1")
  }
  const settle = (el: HTMLDivElement) => {
    el.style.setProperty("--rx", "0deg")
    el.style.setProperty("--ry", "0deg")
    el.style.setProperty("--mx", "50%")
    el.style.setProperty("--my", "50%")
    el.style.setProperty("--shine", "0")
  }

  const activate = (i: number) => {
    if (drag.current.moved) return
    if (active === null) select(i)
    else if (i === active) flip(i)
    else select(i)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (active === null) return
    if (e.key === "ArrowRight") go(1)
    else if (e.key === "ArrowLeft") go(-1)
    else if (e.key === "Escape") select(null)
    else if (e.key === "f" || e.key === "F") flip(active)
    else return
    e.preventDefault()
  }

  // Swipe. A drag that travels is a swipe and never also a click.
  const onPointerDown = (e: React.PointerEvent) => {
    if (active === null) return
    drag.current = { x: e.clientX, y: e.clientY, on: true, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.on) return
    if (Math.abs(e.clientX - d.x) > 10 && Math.abs(e.clientX - d.x) > Math.abs(e.clientY - d.y)) d.moved = true
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.on) return
    d.on = false
    const dx = e.clientX - d.x
    if (d.moved && Math.abs(dx) > 44) go(dx < 0 ? 1 : -1)
    setTimeout(() => (drag.current.moved = false), 0)
  }

  // ---- layout ------------------------------------------------------------
  const { w, h } = size
  const headerH = w < 640 ? 124 : Math.min(200, Math.max(168, h * 0.22))
  const footH = 34
  const bar = Math.min(120, Math.max(96, h * 0.16))
  const gap = Math.min(28, Math.max(12, w * 0.022))
  const grid = gridLayout(n, w, h - footH, headerH, gap)
  const fw = focusSize(w, h, bar)
  const fh = fw * ASPECT
  const k = fw / W
  const focused = active !== null
  const ease = "cubic-bezier(.22,.9,.24,1)"
  const dur = reduced ? 1 : 850

  const current = active !== null ? cards[active] : null
  const currentNumeral = active !== null ? current?.numeral ?? toRoman(active + 1) : ""

  return (
    <div
      ref={stageRef}
      className={"relative w-full select-none overflow-hidden " + className}
      style={{
        height,
        background:
          "radial-gradient(120% 80% at 50% 42%, " + mixHex(ink.deep, ink.paper, 0.3) + " 0%, " + ink.deep + " 38%, " + ink.ink + " 88%)",
        color: ink.cream,
        fontFamily: SERIF,
        touchAction: focused ? "pan-y" : undefined,
      }}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current.on = false)}
    >
      <style>{STYLE}</style>

      {/* The room: a faint arch, grain, and the lace band top and bottom. */}
      <svg className="pointer-events-none absolute inset-0" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
        <path d="M250 1000V460A250 250 0 0 1 750 460V1000" fill="none" stroke={ink.gold} strokeOpacity={0.06} strokeWidth={3} />
        <path d="M300 1000V470A200 200 0 0 1 700 470V1000" fill="none" stroke={ink.gold} strokeOpacity={0.045} strokeWidth={1.5} />
      </svg>
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.7 }} />
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: 22,
          background:
            "radial-gradient(circle at 50% 10px, " + ink.paper + " 9px, transparent 9.5px) 0 0 / 26px 22px repeat-x, linear-gradient(" + ink.paper + "," + ink.paper + ") 0 0 / 100% 10px no-repeat",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: 22,
          background:
            "radial-gradient(circle at 50% 12px, " + ink.paper + " 9px, transparent 9.5px) 0 0 / 26px 22px repeat-x, linear-gradient(" + ink.paper + "," + ink.paper + ") 0 100% / 100% 10px no-repeat",
        }}
      />

      {/* Header — the sheet's title. Leaves when a stamp is picked. */}
      <header
        className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 motion-reduce:transition-none"
        style={{
          height: headerH,
          padding: "34px clamp(18px, 4vw, 48px) 0",
          opacity: focused ? 0 : 1,
          transform: focused ? "translateY(-24px)" : "none",
          transition: "opacity 500ms ease, transform 700ms " + ease,
        }}
      >
        <div className="min-w-0">
          <div className="relative inline-block">
          <h2
            className="m-0 font-normal uppercase leading-none"
            style={{
              fontSize: "clamp(30px, 6.2vw, 72px)",
              letterSpacing: "0.06em",
              backgroundImage: "linear-gradient(180deg, " + ink.goldLight + " 20%, " + ink.gold + " 60%, " + ink.goldDark + ")",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {title}
          </h2>
          {script && (
            <span
              className="absolute whitespace-nowrap"
              style={{
                left: "40%",
                top: "52%",
                fontFamily: SCRIPT,
                fontSize: "clamp(26px, 4.6vw, 56px)",
                color: ink.bright,
                transform: "rotate(-5deg)",
                textShadow: "0 2px 12px " + ink.ink,
              }}
            >
              {script}
            </span>
          )}
          </div>
          {epigraph && (
            <p
              className="m-0 hidden sm:block"
              style={{ marginTop: "clamp(22px, 2.6vw, 34px)", fontSize: 13, lineHeight: 1.4, fontStyle: "italic", whiteSpace: "pre-line", opacity: 0.55, maxWidth: 360 }}
            >
              {epigraph}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right" style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", opacity: 0.6, paddingTop: 8 }}>
          <div>{toRoman(n)} stamps</div>
          <div style={{ marginTop: 6, fontStyle: "italic", letterSpacing: "0.1em", textTransform: "none", fontSize: 13 }}>
            choose one
          </div>
        </div>
      </header>

      {/* The stamps. One set of elements for both layouts, so picking one is a
          single transition from the sheet into the deck and back. */}
      {w > 0 &&
        cards.map((card, i) => {
          let x: number
          let y: number
          let scale: number
          let opacity: number
          let rot = 0
          let z: number
          let d = 0
          if (!focused) {
            const cell = grid.cells[i]
            x = cell.x
            y = cell.y
            scale = grid.cardW / fw
            opacity = 1
            z = hover === i ? 20 : 10
          } else {
            d = circularOffset(i, active, n)
            const s = focusSlot(d, w, h, fw, bar)
            x = s.x
            y = s.y
            scale = s.scale
            opacity = s.opacity
            rot = s.rot
            z = 40 - Math.abs(d) * 10
          }
          if (!ready) {
            opacity = 0
            y += 40
          }
          const isActive = focused && d === 0
          const reachable = !focused || Math.abs(d) <= 1
          const delay = !focused && !reduced ? i * 35 : 0
          const isFlipped = !!flipped[i]
          return (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              role="button"
              tabIndex={!focused || isActive ? 0 : -1}
              aria-hidden={reachable ? undefined : true}
              aria-pressed={isActive ? isFlipped : undefined}
              aria-label={
                focused && isActive
                  ? card.title + ", stamp " + (i + 1) + " of " + n + ". " + (isFlipped ? "Showing the back. " : "") + "Press Enter to turn it over."
                  : card.title + ", stamp " + (i + 1) + " of " + n
              }
              className="gsd-card absolute left-0 top-0 cursor-pointer outline-none"
              style={{
                width: fw,
                height: fh,
                zIndex: z,
                opacity,
                pointerEvents: reachable ? "auto" : "none",
                transform:
                  "translate3d(" + (x - fw / 2).toFixed(1) + "px," + (y - fh / 2).toFixed(1) + "px,0) perspective(1400px) rotateY(" + rot + "deg) scale(" + scale.toFixed(4) + ")",
                transition: ready
                  ? "transform " + dur + "ms " + ease + " " + delay + "ms, opacity " + (reduced ? 1 : 520) + "ms ease " + delay + "ms"
                  : "none",
              }}
              onClick={() => activate(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  e.stopPropagation()
                  activate(i)
                }
              }}
              onPointerEnter={() => !focused && setHover(i)}
              onPointerMove={(e) => lean(i, e)}
              onPointerLeave={() => {
                if (!focused) setHover(null)
                const el = tiltRefs.current[i]
                if (el) settle(el)
              }}
            >
              <div
                className={"absolute inset-0" + (isActive && !reduced ? " gsd-float" : "")}
                style={{ perspective: 1400, filter: "drop-shadow(0 " + 22 * k + "px " + 26 * k + "px rgba(0,0,0,.6))" }}
              >
                <div
                  ref={(el) => {
                    tiltRefs.current[i] = el
                  }}
                  className="absolute inset-0"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
                    transition: reduced ? "none" : "transform 260ms ease-out",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      transition: "transform " + (reduced ? 1 : 900) + "ms cubic-bezier(.3,1.25,.4,1)",
                    }}
                  >
                    {/* Front */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        WebkitMaskImage: STAMP_MASK,
                        maskImage: STAMP_MASK,
                        WebkitMaskSize: "100% 100%",
                        maskSize: "100% 100%",
                      }}
                    >
                      <StampFront card={card} index={i} ink={ink} uid={uid + "c" + i} />
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          backgroundImage:
                            "linear-gradient(115deg, transparent 22%, rgba(255,222,150,.55) 38%, rgba(255,90,100,.3) 46%, rgba(255,244,210,.65) 52%, rgba(160,30,50,.2) 60%, transparent 76%)",
                          backgroundSize: "300% 300%",
                          backgroundPosition: "var(--mx, 50%) var(--my, 50%)",
                          mixBlendMode: "color-dodge",
                          opacity: "calc((var(--shine, 0) * 0.85 + " + (isActive ? 0.22 : 0) + ") * " + foil + ")",
                          transition: "opacity 300ms",
                        }}
                      />
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          backgroundImage: SPARKLE,
                          backgroundSize: 150 * k + "px",
                          backgroundPosition: "calc(var(--mx, 50%) * -0.6) calc(var(--my, 50%) * -0.6)",
                          mixBlendMode: "color-dodge",
                          opacity: "calc(var(--shine, 0) * 0.3 * " + foil + ")",
                          transition: "opacity 300ms",
                        }}
                      />
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          backgroundImage: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,244,225,.4), transparent 52%)",
                          mixBlendMode: "overlay",
                          opacity: "var(--shine, 0)",
                          transition: "opacity 300ms",
                        }}
                      />
                    </div>
                    {/* Back */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        WebkitMaskImage: STAMP_MASK,
                        maskImage: STAMP_MASK,
                        WebkitMaskSize: "100% 100%",
                        maskSize: "100% 100%",
                      }}
                    >
                      <StampBack card={card} index={i} total={n} ink={ink} uid={uid + "c" + i} collection={title} k={k} />
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          backgroundImage: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,236,200,.28), transparent 55%)",
                          mixBlendMode: "overlay",
                          opacity: "var(--shine, 0)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {!focused && (
              <span
                className="gsd-ring pointer-events-none absolute opacity-0"
                style={{ inset: -8 * k, border: "1px solid " + ink.gold, borderRadius: 4, transition: "opacity 200ms" }}
              />
              )}
            </div>
          )
        })}

      {/* Deck chrome: back to the sheet, turn over, and the rail below. */}
      <div
        className="absolute right-0 top-0 flex gap-2 motion-reduce:transition-none"
        style={{
          zIndex: 60,
          padding: "30px clamp(14px, 3vw, 36px) 0",
          opacity: focused ? 1 : 0,
          pointerEvents: focused ? "auto" : "none",
          transition: "opacity 400ms ease " + (focused ? 300 : 0) + "ms",
        }}
      >
        <button
          type="button"
          tabIndex={focused ? 0 : -1}
          className="gsd-btn cursor-pointer rounded-full px-4 py-2"
          style={{ border: "1px solid " + ink.gold + "88", color: ink.cream, background: ink.ink + "99", fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: SERIF }}
          onClick={() => active !== null && flip(active)}
        >
          Turn over
        </button>
        <button
          type="button"
          tabIndex={focused ? 0 : -1}
          aria-label="Back to all stamps"
          className="gsd-btn cursor-pointer rounded-full px-4 py-2"
          style={{ border: "1px solid " + ink.gold + "88", color: ink.cream, background: ink.ink + "99", fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: SERIF }}
          onClick={() => select(null)}
        >
          All stamps
        </button>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 sm:gap-8 motion-reduce:transition-none"
        style={{
          zIndex: 60,
          height: bar,
          paddingBottom: 18,
          opacity: focused ? 1 : 0,
          transform: focused ? "none" : "translateY(20px)",
          pointerEvents: focused ? "auto" : "none",
          transition: "opacity 400ms ease " + (focused ? 250 : 0) + "ms, transform 600ms " + ease,
        }}
      >
        <button
          type="button"
          tabIndex={focused ? 0 : -1}
          aria-label="Previous stamp"
          className="gsd-btn grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full"
          style={{ border: "1px solid " + ink.gold + "88", color: ink.goldLight, background: ink.ink + "99" }}
          onClick={() => go(-1)}
        >
          <Chevron dir={-1} />
        </button>
        <div className="min-w-0 text-center" aria-live="polite">
          <div style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: ink.gold, opacity: 0.8 }}>
            {currentNumeral} <span style={{ opacity: 0.5 }}>/ {toRoman(n)}</span>
          </div>
          <div className="truncate" style={{ fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.08em", textTransform: "uppercase", color: ink.goldLight, marginTop: 2 }}>
            {current?.title}
          </div>
          <div className="mt-2 flex justify-center gap-1.5">
            {cards.map((c, i) => (
              <button
                key={i}
                type="button"
                tabIndex={focused ? 0 : -1}
                aria-label={"Go to " + c.title}
                aria-current={i === active ? "true" : undefined}
                onClick={() => select(i)}
                className="cursor-pointer p-1"
              >
                <span
                  className="block"
                  style={{
                    width: 7,
                    height: 7,
                    transform: "rotate(45deg)",
                    background: i === active ? ink.bright : "transparent",
                    border: "1px solid " + ink.gold,
                    opacity: i === active ? 1 : 0.5,
                    transition: "background-color 300ms, opacity 300ms",
                  }}
                />
              </button>
            ))}
          </div>
          <div className="hidden sm:block" style={{ marginTop: 4, fontSize: 12, fontStyle: "italic", opacity: 0.5 }}>
            tap the stamp to turn it · ← → or scroll to browse
          </div>
        </div>
        <button
          type="button"
          tabIndex={focused ? 0 : -1}
          aria-label="Next stamp"
          className="gsd-btn grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full"
          style={{ border: "1px solid " + ink.gold + "88", color: ink.goldLight, background: ink.ink + "99" }}
          onClick={() => go(1)}
        >
          <Chevron dir={1} />
        </button>
      </div>

      {/* Signature in the corner of the sheet, as on the reference. */}
      {script && (
        <div
          className="pointer-events-none absolute motion-reduce:transition-none"
          style={{
            right: "clamp(16px, 4vw, 44px)",
            bottom: 26,
            fontFamily: SCRIPT,
            fontSize: "clamp(22px, 3vw, 36px)",
            color: ink.bright,
            opacity: focused ? 0 : 0.85,
            transform: "rotate(-4deg)",
            transition: "opacity 400ms",
          }}
        >
          {script}
        </div>
      )}
    </div>
  )
}
