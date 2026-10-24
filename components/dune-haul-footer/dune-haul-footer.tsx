"use client"

// Dune Haul Footer — a soft, sun-baked site footer. A floating white card holds
// the brand, link columns and socials; behind it a valley of rounded apricot
// dunes, speckled with tiny wildflowers, rolls down to a winding road, and a
// little articulated truck hauls along it toward you.
//
// Storyboard. When the footer scrolls into view the dunes rise out of the
// ground back to front, the horizon shrubs pop up, and the road paves itself
// from the far crest down to your feet. The card floats up and its type
// settles in a stagger. Then the truck crests the horizon, grows as it winds
// closer, says hello with a "HONK!" and rolls out of frame, and comes round
// again. The dunes sit at different depths, so scrolling the footer into view
// and moving the pointer across it shift them in parallax. Click the truck (it
// is a real button) and it honks for real, flashes its lights and puts its
// foot down.
//
// One file, React only. Every shape is drawn here as SVG — nothing fetched,
// no images — so the scene recolours with a palette and survives installation.
// The faces come from the host page or the fallback stack.

import * as React from "react"

export interface DuneHaulTruckColors {
  trailer: string
  trailerTop: string
  trailerSide: string
  cab: string
  cabTop: string
  cabSide: string
  glass: string
  wheel: string
  lights: string
}

export interface DuneHaulPalette {
  /** Sky, top to horizon. */
  sky: [string, string]
  /** The soft glow low on the horizon (sun, or moon at night). */
  glow: string
  /** Each dune layer's light, mid and shadow tone, far to near. */
  far: [string, string, string]
  mid: [string, string, string]
  ground: [string, string, string]
  front: [string, string, string]
  near: [string, string, string]
  /** The horizon shrubs: light and shadow. */
  shrub: [string, string]
  /** Wildflower speckles scattered over the dunes. */
  specks: string[]
  road: string
  roadEdge: string
  roadShade: string
  truck: DuneHaulTruckColors
  /** The card. */
  card: string
  ink: string
  muted: string
  line: string
  /** Logo, focus rings and hover fills. */
  accent: string
  accentInk: string
  /** Night: stars come out and the truck runs with headlights on. */
  night: boolean
}

export type DuneHaulTheme = "apricot" | "rose" | "sage" | "dusk"

export type DuneHaulPreset = "auto" | DuneHaulTheme

export interface DuneHaulLink {
  label: string
  href?: string
}

export interface DuneHaulColumn {
  title: string
  links: DuneHaulLink[]
}

export type DuneHaulSocialIcon = "facebook" | "x" | "instagram" | "linkedin" | "github" | "youtube"

export interface DuneHaulSocial {
  icon: DuneHaulSocialIcon
  href?: string
  /** Accessible name. Defaults to the network's name. */
  label?: string
}

export interface DuneHaulFooterProps {
  /** Brand name beside the mark. */
  name?: string
  /** Where the brand links to. */
  brandHref?: string
  /** Replace the built-in truck mark. */
  logo?: React.ReactNode
  /** Link columns, top right of the card. */
  columns?: DuneHaulColumn[]
  /** Round social buttons, bottom right of the card. */
  socials?: DuneHaulSocial[]
  /** Bottom-left line. Defaults to "© <year> <name>. All rights reserved." */
  copyright?: string
  /** Colours. "auto" is apricot, or dusk under a .dark ancestor. */
  preset?: DuneHaulPreset
  /** Colour overrides, merged over the preset. */
  palette?: DuneHaulPaletteOverrides
  /** Which scatter of wildflowers to grow. Any integer. */
  seed?: number
  /** Seconds the truck takes from the horizon to your feet. Defaults to 11. */
  tripSeconds?: number
  /** The word in the truck's speech bubble. Defaults to "HONK!". */
  honk?: string
  /** Honk once, unprompted, on the first trip. Defaults to true. */
  greet?: boolean
  /** Play a horn through Web Audio when the truck is clicked. Defaults to true. */
  sound?: boolean
  /** Scroll and pointer parallax on the dunes. Defaults to true. */
  parallax?: boolean
  /** Widest the card gets. Defaults to "1040px". */
  maxWidth?: string
  /** Face for all the type. */
  fontFamily?: string
  /** Root height. A definite length, never a percentage. The footer grows past it when the card needs more room. */
  height?: string
  /** The least height of landscape kept clear under the card. Defaults to "300px". */
  sceneMinHeight?: string
  /** Extra root class names. */
  className?: string
}

const PRESETS: DuneHaulPresetMap = {
  apricot: {
    sky: ["#f6f3f0", "#fbe7d6"],
    glow: "#ffd9b8",
    far: ["#fbe3d0", "#f5c8a6", "#eeb086"],
    mid: ["#fad2b2", "#f3b282", "#e8925b"],
    ground: ["#f9c59a", "#f29c5d", "#e5732f"],
    front: ["#f8b078", "#ef8442", "#dc5f1e"],
    near: ["#f69a5a", "#e96a27", "#cf4b12"],
    shrub: ["#f6a065", "#df5f26"],
    specks: ["#ffffff", "#fff1e8", "#ffd5c4", "#ffbfa0"],
    road: "#fadcc4",
    roadEdge: "#ea8d52",
    roadShade: "#d8662b",
    truck: {
      trailer: "#fbe1cb",
      trailerTop: "#fff2e6",
      trailerSide: "#f0bb93",
      cab: "#f6c29b",
      cabTop: "#fcdcc2",
      cabSide: "#e79c6c",
      glass: "#7d3a1d",
      wheel: "#45210f",
      lights: "#fff7e3",
    },
    card: "#ffffff",
    ink: "#1d1712",
    muted: "#6f655e",
    line: "#eee8e3",
    accent: "#ee6a2a",
    accentInk: "#ffffff",
    night: false,
  },
  rose: {
    sky: ["#f8f3f4", "#fbe4e6"],
    glow: "#ffd3dc",
    far: ["#f9e0e4", "#f1c4cc", "#e7aab6"],
    mid: ["#f6d0d6", "#eeafbb", "#e08e9f"],
    ground: ["#f5c3cb", "#ec9cac", "#dc7189"],
    front: ["#f3b0bd", "#e78399", "#d35d7b"],
    near: ["#f09cae", "#e06b88", "#c64a6d"],
    shrub: ["#ef9fb2", "#d4587a"],
    specks: ["#ffffff", "#fff2f5", "#ffd6e0", "#ffe9c9"],
    road: "#fbe3e6",
    roadEdge: "#e2869c",
    roadShade: "#c95f7a",
    truck: {
      trailer: "#fde8eb",
      trailerTop: "#fff5f7",
      trailerSide: "#f1c0ca",
      cab: "#f6c6cf",
      cabTop: "#fcdde3",
      cabSide: "#e59fb0",
      glass: "#6e2a3d",
      wheel: "#3d1a24",
      lights: "#fff7ee",
    },
    card: "#ffffff",
    ink: "#21161a",
    muted: "#74636a",
    line: "#f0e6e9",
    accent: "#e0567c",
    accentInk: "#ffffff",
    night: false,
  },
  sage: {
    sky: ["#f3f5f0", "#e9efdc"],
    glow: "#f3f0c8",
    far: ["#e6eed8", "#d1dfbc", "#bacd9f"],
    mid: ["#d9e6c4", "#bed39c", "#a0bc79"],
    ground: ["#cfe0b3", "#aac785", "#88aa5e"],
    front: ["#c0d79f", "#97b96c", "#739a47"],
    near: ["#adcb88", "#82a955", "#5f8a35"],
    shrub: ["#a9c37a", "#5f8838"],
    specks: ["#ffffff", "#fffbe6", "#fff0a8", "#f6d6e4"],
    road: "#f2ecd9",
    roadEdge: "#b7a77c",
    roadShade: "#8f8458",
    truck: {
      trailer: "#f6f1e3",
      trailerTop: "#fffcf2",
      trailerSide: "#ddd3b6",
      cab: "#e9c48f",
      cabTop: "#f4dbb4",
      cabSide: "#cf9f63",
      glass: "#3f4b2c",
      wheel: "#2c2a1b",
      lights: "#fffbe8",
    },
    card: "#ffffff",
    ink: "#171c12",
    muted: "#646b5b",
    line: "#e7ebe0",
    accent: "#5d8a35",
    accentInk: "#ffffff",
    night: false,
  },
  dusk: {
    sky: ["#100d1f", "#3a2140"],
    glow: "#ff9a6a",
    far: ["#4a2a46", "#3b2140", "#2c1934"],
    mid: ["#5d3047", "#4a253e", "#361b33"],
    ground: ["#6f3a40", "#55283a", "#3c1c30"],
    front: ["#7c4038", "#5e2b33", "#421e2d"],
    near: ["#8a4731", "#69302a", "#481f24"],
    shrub: ["#7f3d34", "#3e1b26"],
    specks: ["#ffdcae", "#ffc58a", "#f7b4d4", "#ffffff"],
    road: "#a87a6c",
    roadEdge: "#e08e5c",
    roadShade: "#2f1824",
    truck: {
      trailer: "#c99d8a",
      trailerTop: "#e0bba8",
      trailerSide: "#8e6458",
      cab: "#d5875c",
      cabTop: "#e7a47c",
      cabSide: "#9c5737",
      glass: "#1d1020",
      wheel: "#140b11",
      lights: "#fff1c8",
    },
    card: "#18131a",
    ink: "#f6ece6",
    muted: "#a99891",
    line: "#2d2429",
    accent: "#ff8a4c",
    accentInk: "#1a0f0a",
    night: true,
  },
}

const DEFAULT_COLUMNS: DuneHaulColumn[] = [
  { title: "Explore", links: [{ label: "Our Story" }, { label: "How It Works" }, { label: "User Stories" }] },
  { title: "App", links: [{ label: "Download for iOS" }, { label: "Download for Android" }] },
  { title: "Legal Pages", links: [{ label: "Privacy Policy" }, { label: "Terms & Conditions" }] },
]

const DEFAULT_SOCIALS: DuneHaulSocial[] = [
  { icon: "facebook", href: "https://facebook.com" },
  { icon: "x", href: "https://x.com" },
  { icon: "instagram", href: "https://instagram.com" },
  { icon: "linkedin", href: "https://linkedin.com" },
]

const SOCIAL_NAMES: DuneHaulSocialNameMap = {
  facebook: "Facebook",
  x: "X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  github: "GitHub",
  youtube: "YouTube",
}

const SANS_STACK = '"Inter", "Inter Variable", "Geist", "Helvetica Neue", Arial, system-ui, sans-serif'

// #region scene
// Pure geometry, lifted out and executed by tests/dune-haul-footer.test.mjs.

/** The scene's viewBox. Every layer shares it, anchored bottom-centre and cropped to cover. */
export const DHF_W = 1440
export const DHF_H = 900
/** The road's vanishing line: road width and truck size grow with distance below it. */
export const DHF_HORIZON = 572

/** Seeded PRNG (mulberry32) → [0, 1). */
export function dhfRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A rounded dune: crest at (cx, top), falling to `base` with its own width on each side. */
export interface DhfDome {
  cx: number
  wl: number
  wr: number
  top: number
  base: number
}

/** Height of a dune's surface at x. Below `base` far from the crest, never above `top`. */
export function dhfDomeY(d: DhfDome, x: number) {
  const u = (x - d.cx) / (x < d.cx ? d.wl : d.wr)
  return d.base - (d.base - d.top) * Math.exp(-u * u * 1.15)
}

/** Closed SVG path for a dune, filled down past the bottom of the scene. */
export function dhfDomePath(d: DhfDome) {
  const x0 = d.cx - d.wl * 2.6
  const x1 = d.cx + d.wr * 2.6
  const steps = 48
  let s = "M" + x0.toFixed(1) + " " + (DHF_H + 80)
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps
    s += "L" + x.toFixed(1) + " " + dhfDomeY(d, x).toFixed(1)
  }
  return s + "L" + x1.toFixed(1) + " " + (DHF_H + 80) + "Z"
}

/** Just the crest line of a dune, for its rim light. */
export function dhfCrestPath(d: DhfDome) {
  const x0 = d.cx - d.wl * 1.7
  const x1 = d.cx + d.wr * 1.7
  let s = ""
  for (let i = 0; i <= 32; i++) {
    const x = x0 + ((x1 - x0) * i) / 32
    s += (i ? "L" : "M") + x.toFixed(1) + " " + (dhfDomeY(d, x) + 1).toFixed(1)
  }
  return s
}

/**
 * Flat ground seen from a low camera. A ground point (X, Z) — X across, Z away
 * from you — lands on screen at x = centre + X·F/Z, y = horizon + F/Z, so a
 * ground unit at Z = 1 is F px and things shrink toward the vanishing line.
 */
export const DHF_F = 328
export function dhfProject(X: number, Z: number) {
  const g = DHF_F / Math.max(0.05, Z)
  return [DHF_W / 2 + X * g, DHF_HORIZON + g]
}

/** One sample along the road's centreline. */
export interface DhfSample {
  /** Ground position and the unit normal to the driver's right. */
  X: number
  Z: number
  nX: number
  nZ: number
  /** Ground distance from the far end. */
  s: number
  /** Screen position, and the unit screen direction of travel (toward you). */
  x: number
  y: number
  dx: number
  dy: number
}

/**
 * Samples a Catmull–Rom curve through ground points [X, Z], far to near, into
 * the road. Building it on the ground and projecting keeps the width true to
 * perspective and the edges from folding over on the tight far bend.
 */
export function dhfRoad(pts: number[][], perSeg: number) {
  const out = [] as DhfSample[]
  const P = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))]
  for (let g = 0; g < pts.length - 1; g++) {
    const [p0, p1, p2, p3] = [P(g - 1), P(g), P(g + 1), P(g + 2)]
    for (let i = g === 0 ? 0 : 1; i <= perSeg; i++) {
      const t = i / perSeg
      const t2 = t * t
      const t3 = t2 * t
      const cr = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      const X = cr(p0[0], p1[0], p2[0], p3[0])
      const Z = cr(p0[1], p1[1], p2[1], p3[1])
      const [x, y] = dhfProject(X, Z)
      out.push({ X, Z, nX: 0, nZ: 0, s: 0, x, y, dx: 0, dy: 1 })
    }
  }
  for (let i = 0; i < out.length; i++) {
    const p = out[Math.max(0, i - 1)]
    const n = out[Math.min(out.length - 1, i + 1)]
    const gl = Math.hypot(n.X - p.X, n.Z - p.Z) || 1
    const tX = (n.X - p.X) / gl
    const tZ = (n.Z - p.Z) / gl
    // facing (tX, tZ), the right hand points along (tZ, -tX)
    out[i].nX = tZ
    out[i].nZ = -tX
    const sl = Math.hypot(n.x - p.x, n.y - p.y) || 1
    out[i].dx = (n.x - p.x) / sl
    out[i].dy = (n.y - p.y) / sl
    if (i > 0) out[i].s = out[i - 1].s + Math.hypot(out[i].X - out[i - 1].X, out[i].Z - out[i - 1].Z)
  }
  return out
}

/** The road sample at ground distance s, interpolated, clamped to its ends. */
export function dhfAt(road: DhfSample[], s: number) {
  const last = road[road.length - 1]
  if (s <= 0) return road[0]
  if (s >= last.s) return last
  let lo = 0
  let hi = road.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (road[mid].s <= s) lo = mid
    else hi = mid
  }
  const a = road[lo]
  const b = road[hi]
  const t = (s - a.s) / (b.s - a.s || 1)
  const L = (u: number, v: number) => u + (v - u) * t
  const dx = L(a.dx, b.dx)
  const dy = L(a.dy, b.dy)
  const dl = Math.hypot(dx, dy) || 1
  const nX = L(a.nX, b.nX)
  const nZ = L(a.nZ, b.nZ)
  const nl = Math.hypot(nX, nZ) || 1
  return { X: L(a.X, b.X), Z: L(a.Z, b.Z), nX: nX / nl, nZ: nZ / nl, s, x: L(a.x, b.x), y: L(a.y, b.y), dx: dx / dl, dy: dy / dl }
}

/**
 * A band running along the road between two signed ground offsets from the
 * centreline, in ground units (± half the road width are its edges). Paved
 * only as far as ground distance `upto`, which is how the road lays itself down.
 */
export function dhfBand(road: DhfSample[], a: number, b: number, upto: number) {
  if (upto <= 0) return ""
  const left = [] as string[]
  const right = [] as string[]
  const push = (p: DhfSample) => {
    const l = dhfProject(p.X + p.nX * a, p.Z + p.nZ * a)
    const r = dhfProject(p.X + p.nX * b, p.Z + p.nZ * b)
    left.push(l[0].toFixed(1) + " " + l[1].toFixed(1))
    right.push(r[0].toFixed(1) + " " + r[1].toFixed(1))
  }
  for (const p of road) {
    if (p.s > upto) {
      push(dhfAt(road, upto))
      break
    }
    push(p)
  }
  if (left.length < 2) return ""
  return "M" + left.join("L") + "L" + right.reverse().join("L") + "Z"
}

/**
 * How fast the truck covers ground at depth Z, relative to at your feet. A
 * truck at constant speed would crawl for ages near the horizon; easing it
 * keeps the far stretch brief while the near one still rushes past.
 */
export function dhfPace(Z: number) {
  return Math.pow(Math.max(0.2, Z), 1.15)
}

/** Seconds a trip takes at pace factor 1, so the loop can be scaled to a duration. */
export function dhfTripCost(road: DhfSample[]) {
  let t = 0
  for (let i = 1; i < road.length; i++) t += (road[i].s - road[i - 1].s) / dhfPace((road[i].Z + road[i - 1].Z) / 2)
  return t
}

/** Ground distance at which a fraction `f` of the trip's time has passed. */
export function dhfAtTime(road: DhfSample[], f: number) {
  const goal = dhfTripCost(road) * Math.min(1, Math.max(0, f))
  let t = 0
  for (let i = 1; i < road.length; i++) {
    const step = (road[i].s - road[i - 1].s) / dhfPace((road[i].Z + road[i - 1].Z) / 2)
    if (t + step >= goal) return road[i - 1].s + ((goal - t) / (step || 1)) * (road[i].s - road[i - 1].s)
    t += step
  }
  return road[road.length - 1].s
}

/** Convex hull (monotone chain) of [x, y] points, counter-clockwise. */
export function dhfHull(points: number[][]) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (p.length < 3) return p
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower = [] as number[][]
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop()
    lower.push(q)
  }
  const upper = [] as number[][]
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop()
    upper.push(q)
  }
  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

/** [x, y][] → closed SVG path. */
export function dhfPoly(points: number[][]) {
  return points.length ? "M" + points.map((q) => q[0].toFixed(2) + " " + q[1].toFixed(2)).join("L") + "Z" : ""
}

/**
 * A box seen from in front and above, in the truck's local units (ground at
 * y = 0, facing the viewer). `face` is its front rectangle [x0, y0, x1, y1];
 * `back` is the screen offset from the front face to the rear one. Returns the
 * silhouette, the top face and whichever flank faces the camera.
 */
export function dhfBox(face: number[], back: number[], shrink: number) {
  const [x0, y0, x1, y1] = face
  const cx = (x0 + x1) / 2
  const r = (x: number, y: number) => [cx + (x - cx) * shrink + back[0], y1 + (y - y1) * shrink + back[1]]
  const f = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
  const k = [r(x0, y0), r(x1, y0), r(x1, y1), r(x0, y1)]
  const top = [f[0], f[1], k[1], k[0]]
  const side = back[0] < 0 ? [f[0], k[0], k[3], f[3]] : [f[1], k[1], k[2], f[2]]
  return { hull: dhfHull(f.concat(k)), top, side, front: f, rear: k }
}

/**
 * The truck, heading along unit screen direction (dx, dy). The cab always shows
 * its face; the trailer trails behind it up the road, so it swings to whichever
 * side the road bends and foreshortens as the truck comes straight at you.
 */
export function dhfTruck(dx: number, dy: number) {
  const len = 64 * (0.42 + 0.58 * Math.min(1, Math.abs(dx) * 1.25))
  const back = [-dx * len, -dy * len - 6]
  const cabBack = [back[0] * 0.3, back[1] * 0.3]
  const trailerFront = [back[0] * 0.34, back[1] * 0.34]
  const cab = dhfBox([-20, -40, 20, -7], cabBack, 0.96)
  const trailer = dhfBox(
    [-23 + trailerFront[0], -62 + trailerFront[1], 23 + trailerFront[0], -13 + trailerFront[1]],
    [back[0] * 0.66, back[1] * 0.66],
    0.9,
  )
  // wheels tuck under the bottom edge of whichever flank faces you, drawn as
  // ellipses lying in that flank: one axis along the truck, one upright
  const along = (q: number[][], t: number) => [q[3][0] + (q[2][0] - q[3][0]) * t, q[3][1] + (q[2][1] - q[3][1]) * t + 4.5]
  const bl = Math.hypot(back[0], back[1]) || 1
  const axis = [(back[0] / bl) * Math.max(0.28, bl / 64), (back[1] / bl) * Math.max(0.28, bl / 64)]
  const wheels = [along(trailer.side, 0.5), along(trailer.side, 0.84)]
  const cabWheels = [along(cab.side, 0.6)]
  return { cab, trailer, back, wheels, cabWheels, axis }
}

/** A wheel of radius r centred at c, its rim along `axis` (scaled) and upright: an SVG path. */
export function dhfWheel(c: number[], axis: number[], r: number) {
  let d = ""
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const x = c[0] + axis[0] * r * Math.cos(a)
    const y = c[1] + axis[1] * r * Math.cos(a) + r * Math.sin(a)
    d += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2)
  }
  return d + "Z"
}

/** viewBox → CSS px under preserveAspectRatio="xMidYMax slice". */
export function dhfFit(w: number, h: number) {
  const s = Math.max(w / DHF_W, h / DHF_H)
  return { s, ox: (w - DHF_W * s) / 2, oy: h - DHF_H * s }
}

/** Cubic ease-out on [0, 1], clamped. */
export function dhfEaseOut(t: number) {
  const c = Math.min(1, Math.max(0, t))
  return 1 - Math.pow(1 - c, 3)
}
// #endregion

// The road on the ground, [X, Z], from the far crest to past your feet.
const ROAD_PTS = [
  [12.6, 27],
  [8, 12],
  [4.6, 6],
  [3.25, 3.65],
  [1.25, 2.3],
  [-0.2, 1.5],
  [-0.5, 0.9],
  [-0.4, 0.55],
]
/** Road width, in ground units. */
const ROAD_W = 0.86
/** Truck size per unit of projected scale (F / Z). */
const TRUCK_K = 0.0078
/** Which side of the road the truck keeps to: its right-hand lane, in ground units. */
const LANE = 0.2

type DhfLayerKey = "far" | "mid" | "ground" | "front" | "near"

interface DhfLayerDef {
  key: DhfLayerKey
  /** How far the layer moves in parallax, 0 (horizon) to 1 (at your feet). */
  depth: number
  domes: DhfDome[]
  /** Wildflowers per dune. */
  specks: number
  /** Speckle radius at the bottom of the scene. */
  speckR: number
}

const LAYERS: DhfLayerDef[] = [
  {
    key: "far",
    depth: 0.12,
    specks: 26,
    speckR: 2.6,
    domes: [
      { cx: -60, wl: 260, wr: 300, top: 392, base: 640 },
      { cx: 1500, wl: 300, wr: 260, top: 398, base: 640 },
      { cx: 610, wl: 250, wr: 230, top: 512, base: 640 },
      { cx: 1040, wl: 230, wr: 300, top: 520, base: 640 },
    ],
  },
  {
    key: "mid",
    depth: 0.26,
    specks: 60,
    speckR: 3,
    domes: [
      { cx: 300, wl: 420, wr: 330, top: 452, base: 720 },
      { cx: 1210, wl: 330, wr: 420, top: 476, base: 720 },
    ],
  },
  {
    key: "ground",
    depth: 0.44,
    specks: 340,
    speckR: 3.4,
    domes: [{ cx: 860, wl: 560, wr: 640, top: 582, base: 800 }],
  },
  {
    key: "front",
    depth: 0.7,
    specks: 120,
    speckR: 4,
    domes: [
      { cx: 40, wl: 300, wr: 360, top: 618, base: 960 },
      { cx: 1440, wl: 330, wr: 320, top: 600, base: 960 },
    ],
  },
  {
    key: "near",
    depth: 1,
    specks: 90,
    speckR: 4.6,
    domes: [
      { cx: 150, wl: 260, wr: 250, top: 790, base: 1040 },
      { cx: 1380, wl: 280, wr: 260, top: 770, base: 1040 },
    ],
  },
]

/** Shrubs on the far crests, half hidden by the dunes in front. */
const SHRUBS = [
  { x: 560, y: 524, r: 26 },
  { x: 930, y: 550, r: 20 },
]

/** A shrub's silhouette: lumps of [dx, dy, r] in units of its radius. */
const SHRUB_LOBES = [
  [0, 0.05, 0.86],
  [-0.52, 0.22, 0.58],
  [0.54, 0.2, 0.6],
  [-0.24, -0.4, 0.56],
  [0.28, -0.36, 0.54],
]

/** One speck: [x, y, r, colourIndex, opacity]. */
function growSpecks(seed: number) {
  const rnd = dhfRng(seed)
  return LAYERS.map((L) =>
    L.domes.map((d) => {
      const out = [] as number[][]
      const x0 = d.cx - d.wl * 2
      const x1 = d.cx + d.wr * 2
      const yMax = Math.min(DHF_H + 10, d.base + 120)
      let guard = 0
      while (out.length < L.specks && guard++ < L.specks * 30) {
        const x = x0 + rnd() * (x1 - x0)
        // bias toward the near (lower) part of each dune
        const y = d.top + Math.sqrt(rnd()) * (yMax - d.top)
        if (y < dhfDomeY(d, x) + 3) continue
        const near = Math.min(1, Math.max(0.15, (y - 380) / (DHF_H - 380)))
        const r = L.speckR * near * (0.45 + rnd() * 0.75)
        out.push([x, y, Math.max(0.5, r), Math.floor(rnd() * 4), 0.35 + rnd() * 0.6])
      }
      return out
    }),
  )
}

/** Stars for the night sky: [x%, y%, size px, delay s]. */
function growStars(seed: number) {
  const rnd = dhfRng(seed * 7 + 3)
  return Array.from({ length: 70 }, () => [rnd() * 100, rnd() * 52, 0.8 + rnd() * 1.6, rnd() * 6])
}

let audioCtx = null as AudioContext | null

/** A two-tone air horn — "HONK-honk" — synthesised, nothing fetched. */
function playHorn() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    if (!audioCtx) audioCtx = new AC()
    const ctx = audioCtx
    if (ctx.state === "suspended") ctx.resume()
    const t0 = ctx.currentTime + 0.01
    const lp = ctx.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = 1500
    lp.Q.value = 0.8
    const master = ctx.createGain()
    master.gain.value = 0.16
    lp.connect(master)
    master.connect(ctx.destination)
    const blast = (start: number, dur: number, level: number) => {
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, start)
      g.gain.linearRampToValueAtTime(level, start + 0.018)
      g.gain.setValueAtTime(level * 0.9, start + dur - 0.05)
      g.gain.linearRampToValueAtTime(0, start + dur)
      g.connect(lp)
      for (const f of [311, 392, 466]) {
        const o = ctx.createOscillator()
        o.type = "sawtooth"
        o.frequency.setValueAtTime(f * 1.012, start)
        o.frequency.linearRampToValueAtTime(f, start + 0.06)
        o.frequency.linearRampToValueAtTime(f * 0.985, start + dur)
        o.connect(g)
        o.start(start)
        o.stop(start + dur + 0.02)
      }
    }
    blast(t0, 0.34, 0.7)
    blast(t0 + 0.44, 0.2, 0.5)
  } catch {
    // no audio is fine
  }
}

export default function DuneHaulFooter({
  name = "Dunehaul",
  brandHref = "#",
  logo,
  columns = DEFAULT_COLUMNS,
  socials = DEFAULT_SOCIALS,
  copyright,
  preset = "auto",
  palette,
  seed = 11,
  tripSeconds = 11,
  honk = "HONK!",
  greet = true,
  sound = true,
  parallax = true,
  maxWidth = "1040px",
  fontFamily = SANS_STACK,
  height = "780px",
  sceneMinHeight = "300px",
  className = "",
}: DuneHaulFooterProps) {
  const rootRef = React.useRef(null as HTMLElement | null)
  const sceneRef = React.useRef(null as HTMLDivElement | null)
  const layerRefs = React.useRef([] as (HTMLDivElement | null)[])
  const roadRefs = React.useRef([] as (SVGPathElement | null)[])
  const truckRef = React.useRef(null as SVGGElement | null)
  const partRefs = React.useRef({} as DhfPartMap)
  const puffRefs = React.useRef([] as (SVGCircleElement | null)[])
  const hitRef = React.useRef(null as HTMLButtonElement | null)
  const bubbleRef = React.useRef(null as HTMLDivElement | null)
  const honkAt = React.useRef(-Infinity)
  const boostAt = React.useRef(-Infinity)
  const revealAt = React.useRef(null as number | null)
  const [inView, setInView] = React.useState(false)
  const [dark, setDark] = React.useState(false)
  const uid = "dhf" + React.useId().replace(/[^A-Za-z0-9_-]/g, "")

  const base = preset === "auto" ? (dark ? PRESETS.dusk : PRESETS.apricot) : PRESETS[preset] || PRESETS.apricot
  const c = { ...base, ...(palette || {}), truck: { ...base.truck, ...((palette && palette.truck) || {}) } }
  const specks = React.useMemo(() => growSpecks(seed), [seed])
  const stars = React.useMemo(() => growStars(seed), [seed])
  const road = React.useMemo(() => dhfRoad(ROAD_PTS, 36), [])

  const opts = React.useRef({ tripSeconds, greet, sound, parallax, night: c.night })
  opts.current = { tripSeconds, greet, sound, parallax, night: c.night }

  // "auto" follows a .dark class on the page, the way 21st and shadcn theme.
  React.useEffect(() => {
    if (preset !== "auto") return
    const read = () => {
      const root = rootRef.current
      setDark(document.documentElement.classList.contains("dark") || !!(root && root.closest(".dark")))
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [preset])

  // The reveal starts once, the first time a sixth of the footer is on screen.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        if (revealAt.current === null) revealAt.current = reduced ? -Infinity : performance.now()
        setInView(true)
        io.disconnect()
      },
      { threshold: 0.16 },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  const honkNow = React.useCallback((withSound: boolean) => {
    const now = performance.now()
    if (now - honkAt.current < 450) return
    honkAt.current = now
    boostAt.current = now
    if (withSound && opts.current.sound) playHorn()
    const b = bubbleRef.current
    if (b && b.animate) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      b.getAnimations().forEach((a) => a.cancel())
      b.animate(
        reduced
          ? [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }]
          : [
              { opacity: 0, transform: "translate(-50%, 6px) scale(.4) rotate(-12deg)" },
              { opacity: 1, transform: "translate(-50%, -4px) scale(1.12) rotate(4deg)", offset: 0.14 },
              { opacity: 1, transform: "translate(-50%, 0) scale(1) rotate(-2deg)", offset: 0.26 },
              { opacity: 1, transform: "translate(-50%, -2px) scale(1) rotate(0deg)", offset: 0.8 },
              { opacity: 0, transform: "translate(-50%, -14px) scale(.9) rotate(0deg)" },
            ],
        { duration: 1300, easing: "cubic-bezier(.2,.8,.2,1)" },
      )
    }
  }, [])

  // The scene loop: paving the road, driving the truck, dust, parallax.
  React.useEffect(() => {
    const root = rootRef.current
    const scene = sceneRef.current
    const truck = truckRef.current
    if (!root || !scene || !truck) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const total = road[road.length - 1].s
    const cost = dhfTripCost(road)
    const parts = partRefs.current

    let w = scene.clientWidth
    let h = scene.clientHeight
    let fit = dhfFit(w, h)
    let raf = 0
    let visible = false
    let last = performance.now()
    // truck progress along the road in viewBox units; parked mid-valley under reduced motion
    let s = reduced ? dhfAtTime(road, 0.62) : -1
    let waitUntil = 0
    let greeted = false
    let paved = -1
    let px = 0
    let py = 0
    let tx = 0
    let ty = 0
    let scrollE = 1
    const offs = LAYERS.map(() => [0, 0])
    const puffs = Array.from({ length: puffRefs.current.length }, () => ({ x: 0, y: 0, r: 0, born: -1e9, life: 900 }))
    let puffNext = 0
    let puffI = 0

    const pave = (upto: number) => {
      if (Math.abs(upto - paved) < 0.5) return
      paved = upto
      const hw = ROAD_W / 2
      const bands = [
        [-hw * 1.1, hw * 1.1],
        [-hw, hw],
        [-hw * 0.9, -hw * 0.86],
        [hw * 0.86, hw * 0.9],
        [-hw, -hw * 0.95],
      ]
      bands.forEach((b, i) => {
        const el = roadRefs.current[i]
        if (el) el.setAttribute("d", dhfBand(road, b[0], b[1], upto))
      })
    }

    const set = (k: keyof DhfPartMap, d: string) => {
      const el = parts[k]
      if (el) el.setAttribute("d", d)
    }

    const frame = () => {
      raf = 0
      // performance.now, not the rAF stamp: they share a clock in browsers but not in every harness
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const o = opts.current
      const t0 = revealAt.current
      const since = t0 === null ? -1 : now - t0

      // 1. pave: from 0.8s to 2.2s the road lays itself down from the crest
      if (t0 === null) pave(0)
      else if (since === Infinity || t0 === -Infinity) pave(total + 1)
      else pave(since > 2400 ? total + 1 : dhfAtTime(road, dhfEaseOut((since - 800) / 1600)))

      // 2. drive
      const go = t0 !== null && (t0 === -Infinity || since > 1900)
      if (go && !reduced) {
        if (s < 0) {
          if (now >= waitUntil) s = 0
        } else {
          const p = dhfAt(road, s)
          const boost = 1 + 0.9 * Math.exp(-(now - boostAt.current) / 900)
          // constant speed over the ground reads as speeding up on screen as it nears
          s += (cost / o.tripSeconds) * dhfPace(p.Z) * boost * dt
          if (s > total) {
            s = -1
            waitUntil = now + 1800
          }
        }
      }
      let truckVisible = false
      if (s >= 0) {
        const p = dhfAt(road, s)
        const [lx, ly] = dhfProject(p.X + p.nX * LANE, p.Z + p.nZ * LANE)
        const sc = (DHF_F / p.Z) * TRUCK_K
        const since2 = now - honkAt.current
        const bounce = reduced ? 0 : Math.sin(Math.min(1, since2 / 380) * Math.PI) * 3.5
        const idle = reduced ? 0 : Math.sin(now / 55) * 0.25
        const fade = Math.min(1, s / 2.5)
        truck.setAttribute("transform", "translate(" + lx.toFixed(2) + " " + ly.toFixed(2) + ") scale(" + sc.toFixed(4) + ")")
        truck.style.opacity = String(fade)
        const geo = dhfTruck(p.dx, p.dy)
        const lift = -bounce + idle
        const lifted = (q: number[][]) => q.map((v) => [v[0], v[1] + lift])
        set("tHull", dhfPoly(lifted(geo.trailer.hull)))
        set("tTop", dhfPoly(lifted(geo.trailer.top)))
        set("tFront", dhfPoly(lifted(geo.trailer.front)))
        set("tSide", dhfPoly(lifted(geo.trailer.side)))
        set("cHull", dhfPoly(lifted(geo.cab.hull)))
        set("cTop", dhfPoly(lifted(geo.cab.top)))
        set("cSide", dhfPoly(lifted(geo.cab.side)))
        const rr = geo.trailer.rear
        set(
          "shadow",
          dhfPoly(dhfHull([[-24, 2], [24, 2], [rr[2][0] + 2, rr[2][1] + 15], [rr[3][0] - 2, rr[3][1] + 15]])),
        )
        const ring = (list: number[][], r: number) => list.map((q) => dhfWheel([q[0], q[1] + lift], geo.axis, r)).join("")
        set("wheels", ring(geo.wheels, 6.5))
        set("hubs", ring(geo.wheels, 2.6))
        set("cWheels", ring(geo.cabWheels, 6.5))
        set("cHubs", ring(geo.cabWheels, 2.6))
        const face = parts.face
        if (face) face.setAttribute("transform", "translate(0 " + lift.toFixed(2) + ")")
        const flash = Math.exp(-since2 / 260)
        if (parts.beams) parts.beams.style.opacity = String(o.night ? 0.85 : flash * 0.9)
        if (parts.flare) parts.flare.style.opacity = String(Math.max(o.night ? 0.8 : 0, flash))

        // dust from the rear wheels while rolling
        if (!reduced && go && now > puffNext && sc > 0.25) {
          puffNext = now + 140
          const pf = puffs[puffI++ % puffs.length]
          const side = puffI % 2 ? rr[3] : rr[2]
          pf.x = lx + side[0] * sc
          pf.y = ly + (side[1] + 10) * sc
          pf.r = 3.2 * sc
          pf.born = now
        }

        // the greeting, once, a third of the way down the first trip
        if (o.greet && !greeted && !reduced && p.Z < 3.4) {
          greeted = true
          honkNow(false)
        }

        // keep the button and the bubble over the truck, in CSS px
        const L = offs[2]
        const cx = fit.ox + lx * fit.s + L[0]
        const cy = fit.oy + ly * fit.s + L[1]
        const size = Math.max(40, 64 * sc * fit.s)
        const hit = hitRef.current
        if (hit) {
          hit.style.transform = "translate(" + (cx - size / 2).toFixed(1) + "px," + (cy - size * 0.95).toFixed(1) + "px)"
          hit.style.width = size.toFixed(1) + "px"
          hit.style.height = size.toFixed(1) + "px"
          hit.style.visibility = fade > 0.5 && cy < h + 10 ? "visible" : "hidden"
        }
        const bub = bubbleRef.current
        if (bub) {
          bub.style.left = cx.toFixed(1) + "px"
          bub.style.top = (cy - 74 * sc * fit.s - 10).toFixed(1) + "px"
        }
        truckVisible = true
      }
      if (!truckVisible) {
        truck.style.opacity = "0"
        if (hitRef.current) hitRef.current.style.visibility = "hidden"
      }

      // 3. dust
      puffs.forEach((pf, i) => {
        const el = puffRefs.current[i]
        if (!el) return
        const a = (now - pf.born) / pf.life
        if (a < 0 || a > 1) {
          el.style.opacity = "0"
          return
        }
        el.setAttribute("cx", (pf.x + a * pf.r * 1.5).toFixed(1))
        el.setAttribute("cy", (pf.y - a * pf.r * 2).toFixed(1))
        el.setAttribute("r", (pf.r * (0.6 + a * 1.8)).toFixed(2))
        el.style.opacity = ((1 - a) * 0.4).toFixed(3)
      })

      // 4. parallax: scrolling into view lifts the near dunes faster than the far ones
      if (o.parallax && !reduced) {
        const r = root.getBoundingClientRect()
        const vh = window.innerHeight || 1
        scrollE = Math.min(1, Math.max(0, (vh - r.top) / Math.max(1, r.height)))
        tx += (px - tx) * Math.min(1, dt * 4)
        ty += (py - ty) * Math.min(1, dt * 4)
      } else {
        scrollE = 1
        tx = 0
        ty = 0
      }
      LAYERS.forEach((Ly, i) => {
        const el = layerRefs.current[i]
        if (!el) return
        const ox = -tx * Ly.depth * 22
        const oy = (1 - scrollE) * Ly.depth * 140 - ty * Ly.depth * 8
        offs[i][0] = ox
        offs[i][1] = oy
        el.style.transform = "translate3d(" + ox.toFixed(2) + "px," + oy.toFixed(2) + "px,0)"
      })

      if (visible) raf = requestAnimationFrame(frame)
    }

    const kick = () => {
      if (!raf && visible) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const onMove = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect()
      px = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1
      py = ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1
    }
    const onLeave = () => {
      px = 0
      py = 0
    }
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    const ro = new ResizeObserver(() => {
      w = scene.clientWidth
      h = scene.clientHeight
      fit = dhfFit(w, h)
      kick()
    })
    ro.observe(scene)
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting)
      if (visible) kick()
    })
    io.observe(root)
    // one frame even before it's seen, so the scene is laid out for a capture
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
    }
  }, [road, honkNow])

  const year = new Date().getFullYear()
  const line = copyright ?? "© " + year + " " + name + ". All rights reserved."
  const g = (k: string) => uid + "-" + k
  const layerColors = [c.far, c.mid, c.ground, c.front, c.near]

  return (
    <footer
      ref={rootRef}
      className={"dhf-root" + (inView ? " dhf-in" : "") + (c.night ? " dhf-night" : "") + (className ? " " + className : "")}
      style={
        {
          minHeight: height,
          "--dhf-card": c.card,
          "--dhf-ink": c.ink,
          "--dhf-muted": c.muted,
          "--dhf-line": c.line,
          "--dhf-accent": c.accent,
          "--dhf-accent-ink": c.accentInk,
          "--dhf-max": maxWidth,
          "--dhf-scene-min": sceneMinHeight,
          "--dhf-sans": fontFamily,
          background: "linear-gradient(180deg, " + c.sky[0] + " 0%, " + c.sky[0] + " 22%, " + c.sky[1] + " 62%)",
        } as React.CSSProperties
      }
    >
      <style>{DHF_CSS}</style>

      <div ref={sceneRef} className="dhf-scene" aria-hidden="true">
        <div
          className="dhf-glow"
          style={{ background: "radial-gradient(closest-side, " + c.glow + ", transparent)" }}
        />
        {c.night ? (
          <div className="dhf-stars">
            {stars.map((st, i) => (
              <i
                key={i}
                style={
                  {
                    left: st[0] + "%",
                    top: st[1] + "%",
                    width: st[2] + "px",
                    height: st[2] + "px",
                    animationDelay: -st[3] + "s",
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ) : null}

        {LAYERS.map((L, li) => {
          const col = layerColors[li]
          return (
            <div
              key={L.key}
              className={"dhf-layer dhf-layer-" + L.key}
              style={{ "--dhf-i": li } as React.CSSProperties}
            >
              <div
                ref={(el) => {
                  layerRefs.current[li] = el
                }}
                className="dhf-drift"
              >
                <svg viewBox={"0 0 " + DHF_W + " " + DHF_H} preserveAspectRatio="xMidYMax slice">
                  <defs>
                    <radialGradient id={g("d" + li)} cx="0.4" cy="0.08" r="0.8" fx="0.36" fy="0.04">
                      <stop offset="0" stopColor={col[0]} />
                      <stop offset="0.42" stopColor={col[1]} />
                      <stop offset="1" stopColor={col[2]} />
                    </radialGradient>
                    {li === 1 ? (
                      <linearGradient id={g("haze")} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={c.sky[1]} stopOpacity="0" />
                        <stop offset="0.55" stopColor={c.sky[1]} stopOpacity={c.night ? 0.35 : 0.6} />
                        <stop offset="1" stopColor={c.sky[1]} stopOpacity="0" />
                      </linearGradient>
                    ) : null}
                  </defs>
                  {li === 1 ? <rect x="-300" y="430" width={DHF_W + 600} height="230" fill={"url(#" + g("haze") + ")"} /> : null}
                  {li === 0
                    ? SHRUBS.map((b, bi) => (
                        <g key={bi} className="dhf-shrub" style={{ "--dhf-sd": bi } as React.CSSProperties}>
                          <defs>
                            <radialGradient
                              id={g("s" + bi)}
                              gradientUnits="userSpaceOnUse"
                              cx={b.x - b.r * 0.35}
                              cy={b.y - b.r * 0.55}
                              r={b.r * 1.5}
                            >
                              <stop offset="0" stopColor={c.shrub[0]} />
                              <stop offset="1" stopColor={c.shrub[1]} />
                            </radialGradient>
                          </defs>
                          {SHRUB_LOBES.map((l, i) => (
                            <circle key={i} cx={b.x + l[0] * b.r} cy={b.y + l[1] * b.r} r={l[2] * b.r} fill={"url(#" + g("s" + bi) + ")"} />
                          ))}
                          {SHRUB_LOBES.map((l, i) => (
                            <circle
                              key={"f" + i}
                              cx={b.x + (l[0] * 0.8 + 0.12) * b.r}
                              cy={b.y + (l[1] * 0.7 - 0.1) * b.r}
                              r={b.r * 0.06}
                              fill={c.specks[i % c.specks.length]}
                              opacity="0.7"
                            />
                          ))}
                        </g>
                      ))
                    : null}
                  {L.domes.map((d, di) => (
                    <g key={di}>
                      <path d={dhfDomePath(d)} fill={"url(#" + g("d" + li) + ")"} />
                      <path d={dhfCrestPath(d)} fill="none" stroke={col[0]} strokeWidth={1.5 + li * 0.5} strokeLinecap="round" opacity={c.night ? 0.35 : 0.7} />
                      {specks[li][di].map((p, pi) => (
                        <circle
                          key={pi}
                          cx={p[0].toFixed(1)}
                          cy={p[1].toFixed(1)}
                          r={p[2].toFixed(2)}
                          fill={c.specks[p[3] % c.specks.length]}
                          opacity={(p[4] * (c.night ? 0.55 : 1)).toFixed(2)}
                        />
                      ))}
                    </g>
                  ))}
                  {li === 2 ? (
                    <g>
                      <defs>
                        <linearGradient id={g("fade")} gradientUnits="userSpaceOnUse" x1="0" y1="586" x2="0" y2="640">
                          <stop offset="0" stopColor="#fff" stopOpacity="0" />
                          <stop offset="1" stopColor="#fff" stopOpacity="1" />
                        </linearGradient>
                        <mask id={g("mask")} maskUnits="userSpaceOnUse" x="-300" y="0" width={DHF_W + 600} height={DHF_H + 200}>
                          <rect x="-300" y="560" width={DHF_W + 600} height={DHF_H} fill={"url(#" + g("fade") + ")"} />
                        </mask>
                        <linearGradient id={g("road")} gradientUnits="userSpaceOnUse" x1="0" y1="586" x2="0" y2="900">
                          <stop offset="0" stopColor={c.road} stopOpacity="0.85" />
                          <stop offset="1" stopColor={c.road} />
                        </linearGradient>
                        <linearGradient id={g("beam")} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor={c.truck.lights} stopOpacity="0.85" />
                          <stop offset="1" stopColor={c.truck.lights} stopOpacity="0" />
                        </linearGradient>
                        <filter id={g("soft")} x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="3" />
                        </filter>
                      </defs>
                      <g mask={"url(#" + g("mask") + ")"}>
                        <path ref={(el) => { roadRefs.current[0] = el }} fill={c.roadShade} opacity={c.night ? 0.6 : 0.32} />
                        <path ref={(el) => { roadRefs.current[1] = el }} fill={"url(#" + g("road") + ")"} />
                        <path ref={(el) => { roadRefs.current[2] = el }} fill={c.roadEdge} opacity="0.75" />
                        <path ref={(el) => { roadRefs.current[3] = el }} fill={c.roadEdge} opacity="0.75" />
                        <path ref={(el) => { roadRefs.current[4] = el }} fill="#fff" opacity={c.night ? 0.08 : 0.35} />
                      </g>
                      {Array.from({ length: 10 }, (_, i) => (
                        <circle
                          key={i}
                          ref={(el) => {
                            puffRefs.current[i] = el
                          }}
                          fill={c.road}
                          filter={"url(#" + g("soft") + ")"}
                          style={{ opacity: 0 }}
                        />
                      ))}
                      <g ref={truckRef} style={{ opacity: 0 }}>
                        <path ref={(el) => { partRefs.current.shadow = el }} fill={c.roadShade} opacity="0.32" filter={"url(#" + g("soft") + ")"} />
                        <path ref={(el) => { partRefs.current.beams = el }} d="M-16 -16 L-60 70 L60 70 L16 -16 Z" fill={"url(#" + g("beam") + ")"} style={{ opacity: 0, mixBlendMode: "screen" }} />
                        <path ref={(el) => { partRefs.current.wheels = el }} fill={c.truck.wheel} />
                        <path ref={(el) => { partRefs.current.hubs = el }} fill={c.truck.cabSide} />
                        <path ref={(el) => { partRefs.current.tHull = el }} fill={c.truck.trailerSide} />
                        <path ref={(el) => { partRefs.current.tSide = el }} fill={c.truck.trailerSide} />
                        <path ref={(el) => { partRefs.current.tFront = el }} fill={c.truck.trailer} />
                        <path ref={(el) => { partRefs.current.tTop = el }} fill={c.truck.trailerTop} />
                        <path ref={(el) => { partRefs.current.cWheels = el }} fill={c.truck.wheel} />
                        <path ref={(el) => { partRefs.current.cHubs = el }} fill={c.truck.cabSide} />
                        <path ref={(el) => { partRefs.current.cHull = el }} fill={c.truck.cabSide} />
                        <path ref={(el) => { partRefs.current.cSide = el }} fill={c.truck.cabSide} />
                        <path ref={(el) => { partRefs.current.cTop = el }} fill={c.truck.cabTop} />
                        <g ref={(el) => { partRefs.current.face = el }}>
                          <TruckFace colors={c.truck} />
                          <path
                            ref={(el) => { partRefs.current.flare = el }}
                            d="M-19 -15 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M9 -15 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0"
                            fill={c.truck.lights}
                            filter={"url(#" + g("soft") + ")"}
                            style={{ opacity: 0 }}
                          />
                        </g>
                      </g>
                    </g>
                  ) : null}
                </svg>
              </div>
            </div>
          )
        })}
        <svg className="dhf-grain" aria-hidden="true">
          <filter id={g("grain")}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
          </filter>
          <rect width="100%" height="100%" filter={"url(#" + g("grain") + ")"} />
        </svg>
      </div>

      <div className="dhf-wrap">
        <div className="dhf-card">
          <div className="dhf-top">
            <a className="dhf-brand dhf-r" style={{ "--d": 0 } as React.CSSProperties} href={brandHref}>
              {logo ?? <TruckMark />}
              <span>{name}</span>
            </a>
            <div className="dhf-cols">
              {columns.map((col, ci) => (
                <nav className="dhf-col" key={col.title} aria-label={col.title}>
                  <h3 className="dhf-r" style={{ "--d": 1 + ci } as React.CSSProperties}>
                    {col.title}
                  </h3>
                  <ul>
                    {col.links.map((l, li) => (
                      <li key={l.label} className="dhf-r" style={{ "--d": 1.6 + ci + li * 0.45 } as React.CSSProperties}>
                        <a className="dhf-link" href={l.href || "#"}>
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>
          <div className="dhf-rule" />
          <div className="dhf-bar">
            <p className="dhf-r" style={{ "--d": 4.5 } as React.CSSProperties}>
              {line}
            </p>
            {socials.length ? (
              <ul className="dhf-social">
                {socials.map((s, i) => (
                  <li key={s.icon + i} className="dhf-r" style={{ "--d": 4.6 + i * 0.4 } as React.CSSProperties}>
                    <a href={s.href || "#"} aria-label={s.label || SOCIAL_NAMES[s.icon]}>
                      <SocialIcon icon={s.icon} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
      <div className="dhf-spacer" />

      <button
        ref={hitRef}
        type="button"
        className="dhf-hit"
        aria-label="Honk the truck's horn"
        onClick={() => honkNow(true)}
      />
      <div ref={bubbleRef} className="dhf-bubble" aria-hidden="true">
        {honk}
      </div>
    </footer>
  )
}

/** The cab's face in local units: windscreen, grille, lamps, bumper, front wheels. */
function TruckFace({ colors }: { colors: DuneHaulTruckColors }) {
  return (
    <g>
      <rect x="-19" y="-8" width="9" height="10" rx="3" fill={colors.wheel} />
      <rect x="10" y="-8" width="9" height="10" rx="3" fill={colors.wheel} />
      <rect x="-20" y="-40" width="40" height="33" rx="5" fill={colors.cab} />
      <path d="M-16 -36 H16 Q17.5 -36 17.2 -34.4 L15.6 -26 Q15.3 -24.6 13.8 -24.6 H-13.8 Q-15.3 -24.6 -15.6 -26 L-17.2 -34.4 Q-17.5 -36 -16 -36 Z" fill={colors.glass} />
      <path d="M-12 -35 L-6 -35 L-11 -25.6 L-14 -25.6 Z" fill="#fff" opacity="0.22" />
      <rect x="-8" y="-21" width="16" height="9" rx="1.6" fill={colors.cabSide} />
      <path d="M-6 -19 H6 M-6 -16.5 H6 M-6 -14 H6" stroke={colors.cab} strokeWidth="1" />
      <rect x="-17" y="-19" width="7" height="5" rx="2" fill={colors.lights} />
      <rect x="10" y="-19" width="7" height="5" rx="2" fill={colors.lights} />
      <rect x="-21" y="-10" width="42" height="4.5" rx="2" fill={colors.cabSide} />
    </g>
  )
}

/** The brand mark: a little truck face in a sun-coloured roundel. */
function TruckMark() {
  return (
    <svg className="dhf-mark" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="var(--dhf-accent)" />
      <g fill="none" stroke="var(--dhf-accent-ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <rect x="8.5" y="8" width="15" height="14" rx="3" />
        <path d="M11.5 12.5h9" />
        <path d="M11 23.5v1.5M21 23.5v1.5" />
      </g>
      <g className="dhf-mark-lamps" fill="var(--dhf-accent-ink)">
        <circle cx="12.3" cy="18" r="1.4" />
        <circle cx="19.7" cy="18" r="1.4" />
      </g>
    </svg>
  )
}

function SocialIcon({ icon }: { icon: DuneHaulSocialIcon }) {
  const p = {
    viewBox: "0 0 24 24",
    width: 18,
    height: 18,
    "aria-hidden": true,
    fill: "currentColor",
  } as React.SVGProps<SVGSVGElement>
  if (icon === "facebook")
    return (
      <svg {...p}>
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
      </svg>
    )
  if (icon === "x")
    return (
      <svg {...p}>
        <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
      </svg>
    )
  if (icon === "instagram")
    return (
      <svg {...p} fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    )
  if (icon === "linkedin")
    return (
      <svg {...p}>
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      </svg>
    )
  if (icon === "github")
    return (
      <svg {...p}>
        <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3z" />
      </svg>
    )
  return (
    <svg {...p}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1 31.6 31.6 0 0 0 .5-5.8 31.6 31.6 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
    </svg>
  )
}

type DuneHaulPresetMap = { [K in DuneHaulTheme]: DuneHaulPalette }
type DuneHaulSocialNameMap = { [K in DuneHaulSocialIcon]: string }
type DuneHaulPaletteOverrides = Partial<Omit<DuneHaulPalette, "truck">> & { truck?: Partial<DuneHaulTruckColors> }
type DhfPartMap = {
  shadow?: SVGPathElement | null
  beams?: SVGPathElement | null
  wheels?: SVGPathElement | null
  hubs?: SVGPathElement | null
  cWheels?: SVGPathElement | null
  cHubs?: SVGPathElement | null
  tHull?: SVGPathElement | null
  tSide?: SVGPathElement | null
  tTop?: SVGPathElement | null
  tFront?: SVGPathElement | null
  cHull?: SVGPathElement | null
  cSide?: SVGPathElement | null
  cTop?: SVGPathElement | null
  face?: SVGGElement | null
  flare?: SVGPathElement | null
}

const DHF_CSS = `
.dhf-root {
  position: relative; display: grid; grid-template-rows: auto minmax(var(--dhf-scene-min), 1fr);
  width: 100%; overflow: hidden; isolation: isolate; color: var(--dhf-ink);
  font-family: var(--dhf-sans); -webkit-font-smoothing: antialiased;
}
.dhf-scene { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.dhf-glow {
  position: absolute; left: 50%; top: 30%; width: 120%; height: 46%; transform: translateX(-50%);
  opacity: 0; transition: opacity 2.4s ease;
}
.dhf-in .dhf-glow { opacity: .9; }
.dhf-stars { position: absolute; inset: 0; }
.dhf-stars i {
  position: absolute; border-radius: 50%; background: #fff; opacity: .7;
  animation: dhf-twinkle 4.8s ease-in-out infinite;
}
.dhf-layer {
  position: absolute; inset: 0; opacity: 0; transform: translate3d(0, calc(90px + var(--dhf-i) * 40px), 0);
  transition: opacity .9s ease calc(var(--dhf-i) * 110ms), transform 1.6s cubic-bezier(.16,1,.3,1) calc(var(--dhf-i) * 110ms);
}
.dhf-in .dhf-layer { opacity: 1; transform: none; }
.dhf-layer-near { filter: drop-shadow(0 -8px 22px rgba(120, 40, 0, .16)); }
.dhf-layer-front { filter: drop-shadow(0 -6px 18px rgba(120, 40, 0, .12)); }
.dhf-night .dhf-layer-near, .dhf-night .dhf-layer-front { filter: drop-shadow(0 -8px 22px rgba(0, 0, 0, .35)); }
.dhf-drift { position: absolute; inset: 0; will-change: transform; }
.dhf-drift svg, .dhf-grain {
  position: absolute; inset: 0; display: block; width: 100%; height: 100%; max-width: none; overflow: visible;
}
.dhf-grain { opacity: .07; mix-blend-mode: multiply; overflow: hidden; }
.dhf-night .dhf-grain { opacity: .12; mix-blend-mode: screen; }
.dhf-shrub {
  transform-box: fill-box; transform-origin: 50% 100%; transform: scale(0);
  transition: transform .9s cubic-bezier(.34,1.56,.64,1) calc(700ms + var(--dhf-sd) * 160ms);
}
.dhf-in .dhf-shrub { transform: none; }

.dhf-wrap {
  position: relative; z-index: 2; padding: clamp(28px, 6vw, 76px) 16px 0;
}
.dhf-card {
  position: relative; width: 100%; max-width: var(--dhf-max); margin: 0 auto;
  background: var(--dhf-card); border-radius: 22px; padding: clamp(22px, 3vw, 30px) clamp(20px, 3vw, 30px) clamp(18px, 2.4vw, 22px);
  box-shadow: 0 1px 0 rgba(255,255,255,.6) inset, 0 0 0 1px rgba(60, 30, 10, .05), 0 30px 60px -32px rgba(120, 50, 10, .38), 0 12px 24px -18px rgba(120, 50, 10, .2);
  opacity: 0; transform: translateY(28px) scale(.985);
  transition: opacity .9s ease .2s, transform 1.2s cubic-bezier(.16,1,.3,1) .2s;
}
.dhf-night .dhf-card { box-shadow: 0 0 0 1px rgba(255,255,255,.06), 0 30px 70px -30px rgba(0,0,0,.7); }
.dhf-in .dhf-card { opacity: 1; transform: none; }
.dhf-r {
  opacity: 0; transform: translateY(10px); filter: blur(4px);
  transition: opacity .7s ease, transform .9s cubic-bezier(.16,1,.3,1), filter .7s ease;
  transition-delay: calc(450ms + var(--d) * 70ms);
}
.dhf-in .dhf-r { opacity: 1; transform: none; filter: none; }

.dhf-top { display: flex; justify-content: space-between; gap: 32px 48px; flex-wrap: wrap; }
.dhf-brand {
  display: inline-flex; align-items: center; gap: 9px; align-self: flex-start;
  color: var(--dhf-ink); text-decoration: none; font-weight: 800; font-size: 21px; letter-spacing: -.02em;
  border-radius: 8px; outline: none;
}
.dhf-mark { width: 28px; height: 28px; flex: none; transition: transform .5s cubic-bezier(.34,1.56,.64,1); }
.dhf-brand:hover .dhf-mark { transform: rotate(-10deg) scale(1.06); }
.dhf-brand:hover .dhf-mark-lamps { animation: dhf-blink .5s steps(1) 2; }
.dhf-cols { display: grid; grid-template-columns: repeat(3, auto); gap: 24px clamp(28px, 5vw, 64px); }
.dhf-col h3 { margin: 0 0 8px; font-size: 13.5px; font-weight: 650; letter-spacing: -.005em; color: var(--dhf-ink); }
.dhf-col ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.dhf-link {
  position: relative; display: inline-block; padding: 2px 0; font-size: 13.5px; line-height: 1.45;
  color: var(--dhf-muted); text-decoration: none; border-radius: 4px; outline: none;
  transition: color .25s ease, transform .35s cubic-bezier(.16,1,.3,1);
}
.dhf-link::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 1px; height: 1.5px; border-radius: 2px;
  background: var(--dhf-accent); transform: scaleX(0); transform-origin: 100% 50%;
  transition: transform .4s cubic-bezier(.16,1,.3,1);
}
.dhf-link:hover { color: var(--dhf-ink); transform: translateX(2px); }
.dhf-link:hover::after { transform: scaleX(1); transform-origin: 0 50%; }
.dhf-rule {
  height: 1px; margin: clamp(24px, 3.4vw, 34px) 0 clamp(16px, 2vw, 18px); background: var(--dhf-line);
  transform: scaleX(0); transform-origin: 0 50%; transition: transform 1.2s cubic-bezier(.16,1,.3,1) .7s;
}
.dhf-in .dhf-rule { transform: none; }
.dhf-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.dhf-bar p { margin: 0; font-size: 12.5px; color: var(--dhf-muted); }
.dhf-social { display: flex; gap: 10px; margin: 0; padding: 0; list-style: none; }
.dhf-social a {
  display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%;
  color: var(--dhf-ink); border: 1px solid var(--dhf-line); background: var(--dhf-card); outline: none;
  box-shadow: 0 1px 2px rgba(60, 30, 10, .06);
  transition: background .3s ease, color .3s ease, border-color .3s ease, transform .45s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;
}
.dhf-social a:hover {
  background: var(--dhf-accent); color: var(--dhf-accent-ink); border-color: var(--dhf-accent);
  transform: translateY(-3px); box-shadow: 0 10px 18px -8px var(--dhf-accent);
}
.dhf-social a:active { transform: translateY(0) scale(.94); }
.dhf-link:focus-visible, .dhf-brand:focus-visible, .dhf-social a:focus-visible, .dhf-hit:focus-visible {
  outline: 2px solid var(--dhf-accent); outline-offset: 3px;
}
.dhf-spacer { position: relative; z-index: 1; pointer-events: none; }

.dhf-hit {
  position: absolute; left: 0; top: 0; z-index: 3; padding: 0; margin: 0; border: 0; border-radius: 14px;
  background: transparent; cursor: pointer; visibility: hidden; -webkit-tap-highlight-color: transparent;
}
.dhf-bubble {
  position: absolute; left: 0; top: 0; z-index: 4; pointer-events: none; opacity: 0;
  transform: translate(-50%, 0); padding: 6px 11px 7px; border-radius: 999px;
  background: var(--dhf-card); color: var(--dhf-accent); font-weight: 900; font-size: 13px; letter-spacing: .04em;
  box-shadow: 0 0 0 1px rgba(60, 30, 10, .06), 0 10px 22px -10px rgba(120, 50, 10, .45); white-space: nowrap;
}
.dhf-bubble::after {
  content: ""; position: absolute; left: 50%; bottom: -5px; width: 10px; height: 10px; margin-left: -5px;
  background: var(--dhf-card); transform: rotate(45deg); border-radius: 0 0 3px 0;
}

@keyframes dhf-twinkle { 0%, 100% { opacity: .15; } 50% { opacity: .85; } }
@keyframes dhf-blink { 0% { opacity: 0; } 50% { opacity: 1; } }

@media (max-width: 760px) {
  .dhf-top { flex-direction: column; }
  .dhf-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
  .dhf-bar { flex-direction: column-reverse; align-items: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  .dhf-layer, .dhf-card, .dhf-r, .dhf-rule, .dhf-shrub, .dhf-glow, .dhf-link, .dhf-link::after, .dhf-social a, .dhf-mark {
    transition: none !important;
  }
  .dhf-stars i, .dhf-brand:hover .dhf-mark-lamps { animation: none; }
}
`
