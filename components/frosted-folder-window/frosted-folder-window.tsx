"use client"

// Frosted Folder Window — a travel memory kept in a pane of frosted glass. A
// window with folder tabs (Places, Journal, Archive) floats over a sunlit
// garden; the frame is heavily frosted, the pane inside only lightly, so the
// garden still reads through the words. Flip between places by arrow, dot,
// swipe or keyboard, and the light over the whole scene follows each entry's
// hour: noon, morning haze, golden hour, dusk. Write a line into the journal,
// open a folder from the archive, drag the window by its glass edge, and the
// traffic lights really close, roll up and zoom it.
//
// Nothing loads at runtime. The garden — neem canopy, a pavilion in the haze,
// a lawn and a hedge of a few thousand leaves — is painted on a canvas from a
// seed, so the demo makes no network requests. Pass `image` to use a photo.
import * as React from "react"

export type EscapeLight = "morning" | "noon" | "golden" | "dusk"
export type EscapeTab = "places" | "journal" | "archive"

export type EscapePlace = {
  /** Two words break onto two lines; use "\n" to choose the break yourself. */
  title: string
  location: string
  /** Any string; dates `Date.parse` understands sort properly in the archive. */
  date: string
  /** Small caps under the title. "\n" breaks the line. */
  tagline?: string
  /** Shown in the footer and summed for the folder size. */
  sizeMB?: number
  /** The hour this memory is lit at. Re-lights the whole scene. */
  light?: EscapeLight
  /** Journal paragraphs for this place. */
  journal?: string[]
}

export interface FrostedFolderWindowProps {
  places?: EscapePlace[]
  /** Rename the three folder tabs. */
  tabLabels?: Partial<Record<EscapeTab, string>>
  defaultTab?: EscapeTab
  defaultIndex?: number
  /** A photo URL to sit behind the glass instead of the painted garden. */
  image?: string
  /** Seed for the painted garden: every number paints a different one. */
  seed?: number
  /** Glass tint, `#rrggbb`. */
  tint?: string
  /** Text and hairline colour, `#rrggbb`. */
  ink?: string
  /** Let the window be dragged by its glass edge. */
  draggable?: boolean
  /** Placeholder for the journal's input. */
  notePlaceholder?: string
  onPlaceChange?: (index: number, place: EscapePlace) => void
  onNote?: (index: number, note: string) => void
  /** Must be a definite length, so it survives any host layout. */
  height?: string
  className?: string
}

// #region logic
export const DEFAULT_TINT = "#e4e0b0"
export const DEFAULT_INK = "#f4edcc"

export function rng(seed: number) {
  let a = (Math.floor(seed) || 1) >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function wrap(i: number, n: number): number {
  if (n <= 0) return 0
  return ((i % n) + n) % n
}

export function hexToRgb(hex: string | undefined): number[] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return null
  const v = parseInt(m[1], 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

/** "r,g,b" for use inside rgba(var(--x), a); a malformed colour falls back. */
export function rgbList(hex: string | undefined, fallback: string): string {
  const c = hexToRgb(hex) || hexToRgb(fallback) || [255, 255, 255]
  return c.join(",")
}

export function formatSize(mb: number): string {
  if (!isFinite(mb) || mb <= 0) return "0 KB"
  if (mb < 1) return Math.max(1, Math.round(mb * 1024)) + " KB"
  if (mb >= 1024) return (mb / 1024).toFixed(1) + " GB"
  return mb.toFixed(1) + " MB"
}

export function totalSize(places: { sizeMB?: number }[]): number {
  let sum = 0
  for (const p of places) if (typeof p.sizeMB === "number" && isFinite(p.sizeMB) && p.sizeMB > 0) sum += p.sizeMB
  return Math.round(sum * 10) / 10
}

export function titleLines(title: string): string[] {
  const t = (title || "").trim()
  if (!t) return []
  if (t.includes("\n")) return t.split("\n").map((s) => s.trim()).filter(Boolean)
  const words = t.split(/\s+/)
  return words.length === 2 ? words : [t]
}

export function taglineLines(tagline: string | undefined): string[] {
  return (tagline || "").split("\n").map((s) => s.trim()).filter(Boolean)
}

/** The longest line, so the title can shrink to fit instead of overflowing. */
export function fitLength(lines: string[]): number {
  let n = 4
  for (const l of lines) n = Math.max(n, l.length)
  return n
}

export function countWords(lines: string[]): number {
  let n = 0
  for (const l of lines) n += l.split(/\s+/).filter(Boolean).length
  return n
}

export function pad2(n: number): string {
  return (n < 10 ? "0" : "") + n
}

export function cityOf(location: string): string {
  return (location || "").split(",")[0].trim()
}

/** Indices of `places`, by date. Unreadable dates keep their order, at the end. */
export function sortByDate(places: { date: string }[], newestFirst: boolean): number[] {
  const keyed = places.map((p, i) => ({ i, t: Date.parse(p.date) }))
  const ok = keyed.filter((k) => !isNaN(k.t))
  const bad = keyed.filter((k) => isNaN(k.t))
  ok.sort((a, b) => (newestFirst ? b.t - a.t : a.t - b.t) || a.i - b.i)
  return ok.concat(bad).map((k) => k.i)
}

/** -1 back, 1 forward, 0 not a swipe (too short, or mostly vertical). */
export function swipeDirection(dx: number, dy: number, threshold: number): number {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.2) return 0
  return dx < 0 ? 1 : -1
}

/** Keep a dragged window at least partly on screen. */
export function clampOffset(x: number, y: number, maxX: number, maxY: number): number[] {
  const cx = Math.max(-maxX, Math.min(maxX, x))
  const cy = Math.max(-maxY, Math.min(maxY, y))
  return [cx === 0 ? 0 : cx, cy === 0 ? 0 : cy]
}

/** A tiny painted landscape for an archive folder, lit at the place's hour. */
export function thumbBackground(light: EscapeLight | undefined): string {
  const sky =
    light === "golden" ? ["#f0a85a", "#f6d49a"] :
    light === "dusk" ? ["#3a3a7a", "#c98a7a"] :
    light === "morning" ? ["#9dbfe3", "#e3ecee"] :
    ["#3f78cf", "#b4cbe0"]
  const leaf = light === "dusk" ? "#141f12" : light === "golden" ? "#33401a" : "#203417"
  const lawn = light === "dusk" ? "#3d5126" : light === "golden" ? "#8f9a3c" : "#6f9c3b"
  return (
    "radial-gradient(70% 55% at 72% 0%," + leaf + " 0 58%,transparent 60%)," +
    "radial-gradient(40% 35% at 8% 4%," + leaf + " 0 50%,transparent 53%)," +
    "linear-gradient(180deg," + sky[0] + " 0%," + sky[1] + " 46%," + leaf + " 47%," + leaf + " 55%," + lawn + " 56%," + lawn + " 72%,#14230f 73%)"
  )
}
// #endregion logic

// #region content
const DEFAULT_PLACES: EscapePlace[] = [
  {
    title: "Quiet Escapes",
    location: "Delhi, India",
    date: "May 12, 2024",
    tagline: "Moments offline.\nMemories online forever.",
    sizeMB: 4.2,
    light: "noon",
    journal: [
      "Lodhi Garden at noon. The light came down through the neem like it had somewhere better to be.",
      "No signal under the big tree. We counted parakeets instead and lost track at nineteen.",
      "Kept the phone in the bag. Kept this instead.",
    ],
  },
  {
    title: "Slow Mornings",
    location: "Udaipur, India",
    date: "Jan 3, 2024",
    tagline: "Fog on the lake.\nNowhere to be by nine.",
    sizeMB: 3.9,
    light: "morning",
    journal: [
      "Fog sat on the lake until nine. Chai in paper cups, the boats not awake yet.",
      "A man painted the ghat steps blue while we watched. Neither of us said a word.",
    ],
  },
  {
    title: "Golden Hours",
    location: "Jaipur, India",
    date: "Oct 21, 2023",
    tagline: "The walls turn to honey.\nWe stayed for the lamps.",
    sizeMB: 4.3,
    light: "golden",
    journal: [
      "The walls go pink, then honey, then rust, all in twenty minutes. We stayed for every one of them.",
      "A kite caught on the parapet. Someone else's afternoon, tangled up in ours.",
    ],
  },
]

const DEFAULT_LABELS: Record<EscapeTab, string> = { places: "Places", journal: "Journal", archive: "Archive" }
const TABS: EscapeTab[] = ["places", "journal", "archive"]
// #endregion content

// #region scene
function paintScene(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const rand = rng(seed)
  const R = (a: number, b: number) => a + (b - a) * rand()
  const TAU = Math.PI * 2
  const m = Math.min(w, h)
  const hsl = (hh: number, s: number, l: number, a?: number) =>
    "hsla(" + hh.toFixed(1) + "," + s.toFixed(1) + "%," + l.toFixed(1) + "%," + (a === undefined ? 1 : a) + ")"
  const blob = (x: number, y: number, rx: number, ry: number, rot: number, fill: string) => {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, rot, 0, TAU)
    ctx.fillStyle = fill
    ctx.fill()
  }
  const H = h * 0.5 // where the lawn meets the far trees

  // sky
  let g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, "#2a5ec0")
  g.addColorStop(0.45, "#5a8dd6")
  g.addColorStop(0.82, "#a8c3df")
  g.addColorStop(1, "#d8e1dc")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, H + 4)

  // a block of flats on the left edge, a flag on its roof
  const bw = Math.max(w * 0.13, m * 0.12)
  const bt = H - h * 0.165
  ctx.fillStyle = "#c9c0ad"
  ctx.fillRect(bw * 0.6, H - h * 0.125, bw * 0.85, h * 0.125)
  ctx.fillStyle = "#ddd6c7"
  ctx.fillRect(0, bt, bw, H - bt)
  for (let y = bt + h * 0.012; y < H - 4; y += h * 0.028) {
    ctx.fillStyle = "rgba(64,58,48,.38)"
    ctx.fillRect(0, y, bw, h * 0.01)
    ctx.fillStyle = "rgba(255,255,255,.45)"
    ctx.fillRect(0, y + h * 0.013, bw, Math.max(1, h * 0.0016))
  }
  for (let x = bw * 0.1; x < bw; x += bw * 0.24) {
    ctx.fillStyle = "rgba(90,80,64,.28)"
    ctx.fillRect(x, bt, bw * 0.035, H - bt)
  }
  ctx.fillStyle = "#ece6d9"
  ctx.fillRect(0, bt - h * 0.006, bw * 1.03, h * 0.008)
  const fx = bw * 0.55
  const ft = bt - h * 0.07
  ctx.strokeStyle = "#6a6458"
  ctx.lineWidth = Math.max(1, m * 0.0022)
  ctx.beginPath()
  ctx.moveTo(fx, bt)
  ctx.lineTo(fx, ft)
  ctx.stroke()
  ctx.fillStyle = "#4b5c72"
  ctx.beginPath()
  ctx.moveTo(fx, ft)
  ctx.quadraticCurveTo(fx + m * 0.012, ft + m * 0.002, fx + m * 0.022, ft + m * 0.008)
  ctx.lineTo(fx, ft + m * 0.016)
  ctx.fill()

  // a pavilion in the haze
  const cx = w * 0.42
  const cw = Math.min(w * 0.24, m * 0.32)
  const ch = cw * 0.4
  const ct = H - ch
  ctx.globalAlpha = 0.72
  ctx.fillStyle = "#c4b597"
  ctx.fillRect(cx - cw / 2, ct, cw, ch)
  ctx.fillStyle = "#d3c6a8"
  ctx.fillRect(cx - cw * 0.56, ct - cw * 0.035, cw * 1.12, cw * 0.04)
  for (let i = 0; i < 5; i++) {
    const ax = cx - cw / 2 + cw * (0.06 + i * 0.19)
    const aw = cw * 0.12
    const ay = ct + ch * 0.28
    ctx.fillStyle = "#5c5345"
    ctx.beginPath()
    ctx.moveTo(ax, H)
    ctx.lineTo(ax, ay + aw / 2)
    ctx.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0)
    ctx.lineTo(ax + aw, H)
    ctx.fill()
  }
  ctx.fillStyle = "#c9ba9c"
  ctx.fillRect(cx - cw * 0.17, ct - cw * 0.12, cw * 0.34, cw * 0.09)
  ctx.beginPath()
  ctx.ellipse(cx, ct - cw * 0.12, cw * 0.2, cw * 0.22, 0, Math.PI, TAU)
  ctx.fill()
  for (const sx of [-0.44, 0.44]) {
    ctx.beginPath()
    ctx.ellipse(cx + cw * sx, ct - cw * 0.035, cw * 0.07, cw * 0.08, 0, Math.PI, TAU)
    ctx.fill()
  }
  ctx.strokeStyle = "#a89a7c"
  ctx.lineWidth = Math.max(1, m * 0.002)
  ctx.beginPath()
  ctx.moveTo(cx, ct - cw * 0.34)
  ctx.lineTo(cx, ct - cw * 0.4)
  ctx.stroke()
  ctx.globalAlpha = 1

  // the far trees, hazy
  for (let i = 0; i < 170; i++) {
    const x = R(-0.05, 1.05) * w
    const r = m * R(0.018, 0.05)
    const y = H - R(0, h * 0.075) + r * 0.3
    if (x < bw * 0.7 && y < H - h * 0.04) continue
    if (Math.abs(x - cx) < cw * 0.42 && y - r < ct + ch * 0.2) continue
    blob(x, y, r * R(1, 1.5), r, 0, hsl(R(95, 118), R(16, 28), R(17, 26)))
    if (rand() < 0.6) blob(x - r * 0.3, y - r * 0.35, r * 0.6, r * 0.45, 0, hsl(R(85, 100), R(20, 32), R(28, 36), 0.7))
  }
  g = ctx.createLinearGradient(0, H - h * 0.14, 0, H)
  g.addColorStop(0, "rgba(205,218,222,0)")
  g.addColorStop(1, "rgba(205,218,222,.26)")
  ctx.fillStyle = g
  ctx.fillRect(0, H - h * 0.14, w, h * 0.14)

  // the lawn
  g = ctx.createLinearGradient(0, H, 0, h * 0.78)
  g.addColorStop(0, "#8ab04f")
  g.addColorStop(0.35, "#6f9b39")
  g.addColorStop(1, "#4a7525")
  ctx.fillStyle = g
  ctx.fillRect(0, H, w, h * 0.3)
  for (let x = -m * 0.02; x < w; x += m * R(0.03, 0.06)) {
    if (x > w * 0.3 && x < w * 0.62) continue
    blob(x, H + h * 0.004, m * R(0.025, 0.045), h * R(0.012, 0.022), 0, hsl(R(100, 115), R(28, 38), R(18, 24)))
  }
  ctx.globalAlpha = 0.35
  blob(w * 0.55, H + h * 0.07, w * 0.55, h * 0.05, -0.04, "#bcd468")
  blob(w * 0.2, H + h * 0.15, w * 0.4, h * 0.04, 0.05, "#a9c95c")
  ctx.globalAlpha = 1
  for (let i = 0; i < 46; i++) {
    const r = m * R(0.02, 0.07)
    blob(R(0.15, 1.05) * w, H + h * R(0.03, 0.2), r, r * R(0.16, 0.3), R(-0.06, 0.06), "rgba(22,44,10,.14)")
  }
  const grass = Math.round((w * h) / 520)
  ctx.lineWidth = Math.max(1, m * 0.0016)
  for (let i = 0; i < grass; i++) {
    const x = R(0, w)
    const y = H + R(0, h * 0.26)
    const len = m * R(0.004, 0.011) * (1 + (y - H) / (h * 0.2))
    ctx.strokeStyle = hsl(R(78, 104), R(35, 55), R(22, 52), 0.32)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + R(-1, 1) * len * 0.3, y - len)
    ctx.stroke()
  }

  // the tree: trunk and branches, then the canopy over them
  const branch = (x: number, y: number, ang: number, len: number, wid: number, depth: number) => {
    const a = Math.max(-Math.PI + 0.2, Math.min(-0.2, ang))
    const x2 = x + Math.cos(a) * len
    const y2 = y + Math.sin(a) * len
    const bend = R(-0.18, 0.18) * len
    ctx.strokeStyle = depth > 3 ? "#2a2417" : "#33301f"
    ctx.lineWidth = Math.max(0.8, wid)
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo((x + x2) / 2 - Math.sin(a) * bend, (y + y2) / 2 + Math.cos(a) * bend, x2, y2)
    ctx.stroke()
    if (depth <= 0) return
    const kids = depth > 4 ? 2 : rand() < 0.5 ? 2 : 3
    for (let k = 0; k < kids; k++) {
      const spread = depth > 4 ? (k === 0 ? -0.75 : 0.75) : R(-0.7, 0.7)
      branch(x2, y2, a + spread, len * R(0.62, 0.8), wid * 0.64, depth - 1)
    }
  }
  branch(w * 0.86, h * 0.56, -Math.PI / 2 - 0.42 + R(-0.05, 0.05), h * 0.2, m * 0.036, 6)

  // a far, hazier layer of leaves first, for depth
  for (let i = 0; i < 60; i++) {
    const x = R(0.2, 1.08) * w
    const y = R(-0.02, 0.3) * h
    const r = m * R(0.04, 0.08)
    for (let j = 0; j < 40; j++) {
      const a = R(0, TAU)
      const d = r * Math.sqrt(rand())
      const s = m * R(0.005, 0.009)
      blob(x + Math.cos(a) * d * 1.2, y + Math.sin(a) * d, s, s * 0.55, R(0, TAU), hsl(R(95, 115), R(14, 24), R(24, 34), 0.75))
    }
  }

  const edge = (x: number) => h * (0.33 + 0.07 * Math.sin((x / w) * 6.3 + seed) + 0.035 * Math.sin((x / w) * 17 + seed * 2))
  const clusters = Math.max(150, Math.min(460, Math.round((240 * w * h) / 1e6)))
  for (let i = 0; i < clusters; i++) {
    const x = R(-0.08, 1.08) * w
    const y = edge(x) * rand() - h * 0.02
    // the upper left stays open, so there is sky between the leaves
    if (x < w * 0.24 && y > h * 0.05 && rand() < 0.72) continue
    const cr = m * R(0.035, 0.075)
    blob(x, y, cr * 0.7, cr * 0.56, 0, hsl(R(100, 116), 28, R(9, 13), 0.9))
    const leaves = Math.round(((cr * cr) / (m * m)) * 15000)
    for (let j = 0; j < leaves; j++) {
      const a = R(0, TAU)
      const d = cr * Math.sqrt(rand())
      const lx = x + Math.cos(a) * d
      const ly = y + Math.sin(a) * d * 0.8
      const lit = Math.max(0, -Math.cos(a) * 0.6 - Math.sin(a) * 0.8) * (d / cr)
      const s = m * R(0.0045, 0.0095)
      blob(lx, ly, s, s * 0.55, R(0, TAU), hsl(R(84, 112), R(26, 46), 12 + 17 * lit + R(-4, 5)))
      if (lit > 0.5 && rand() < 0.35) blob(lx - s * 0.2, ly - s * 0.2, s * 0.6, s * 0.3, R(0, TAU), hsl(R(64, 80), R(40, 55), R(42, 58)))
    }
  }

  // the hedge in front, leaf by leaf
  const top = (x: number) => h * (0.725 + 0.016 * Math.sin((x / w) * 9 + seed) + 0.009 * Math.sin((x / w) * 23 + seed))
  ctx.fillStyle = "#0d190a"
  ctx.beginPath()
  ctx.moveTo(0, h)
  for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, top(x) + m * 0.012)
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fill()
  for (let y = h * 0.7; y < h + m * 0.03; ) {
    const t = Math.min(1, Math.max(0, (y - h * 0.7) / (h * 0.3)))
    const s = m * (0.009 + 0.02 * t)
    for (let x = -s; x < w + s; x += s * R(0.72, 1.02)) {
      const yy = y + R(-0.4, 0.4) * s
      const tp = top(x)
      if (yy < tp) continue
      const rot = R(-1.3, 1.3) + (rand() < 0.5 ? 0 : Math.PI)
      const shade = rand()
      const l = 9 + 20 * shade * shade + (yy - tp < s * 2 ? 9 : 0)
      blob(x, yy, s * 0.62, s * 0.34, rot, hsl(R(92, 125), R(30, 52), l))
      if (shade > 0.62) blob(x - s * 0.06, yy - s * 0.09, s * 0.42, s * 0.15, rot, hsl(R(78, 98), R(35, 50), l + 13, 0.7))
    }
    y += s * 0.55
  }

  // sun from the upper left, and a soft vignette
  g = ctx.createRadialGradient(w * 0.1, -h * 0.05, 0, w * 0.1, -h * 0.05, Math.max(w, h) * 0.7)
  g.addColorStop(0, "rgba(255,248,220,.32)")
  g.addColorStop(1, "rgba(255,248,220,0)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  g = ctx.createRadialGradient(w / 2, h / 2, m * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.62)
  g.addColorStop(0, "rgba(0,0,0,0)")
  g.addColorStop(1, "rgba(4,10,2,.38)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}
// #endregion scene

// #region icons
const Icon = {
  folder: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.2h8.8A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />
      <path d="M3 10h18" />
    </svg>
  ),
  journal: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h8.5L19 7.5V21H6z" />
      <path d="M14 3v5h5M9 12h7M9 15.5h7M9 9h3" />
    </svg>
  ),
  archive: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M3 9.5h18M10 13h4" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" />
      <path d="M13.5 13.5h2.5v2.5h-2.5zM18 18h2v2h-2zM13.5 18.5h1M18.5 13.5h1.5" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth={2.6} strokeLinecap="round" />
    </svg>
  ),
  pen: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13 7l4 4" />
    </svg>
  ),
  sort: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 4v16M4.5 16.5 8 20l3.5-3.5M16 20V4M12.5 7.5 16 4l3.5 3.5" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5-5.6.6-9.9 4.9-10.5 10.5C11.4 16.9 7.1 12.6 1.5 12 7.1 11.4 11.4 7.1 12 1.5z" />
    </svg>
  ),
}
// #endregion icons

// The window is sized in --u (1% of its own width), resolved against the stage's
// container. It can't be a container itself: container-type on an ancestor of
// the glass makes it a backdrop root in Chrome, and the frost blurs nothing.
// Nothing inside the window may use mix-blend-mode either, for the same reason.
const FFW_CSS = `
.ffw-root{position:relative;width:100%;overflow:hidden;isolation:isolate;color:rgb(var(--ffw-ink));background:linear-gradient(180deg,#3d6fc4 0%,#9fbad6 40%,#5f8c33 51%,#355a1f 70%,#0f1c0b 100%);font-family:ui-monospace,"SFMono-Regular","JetBrains Mono","Roboto Mono",Menlo,Consolas,monospace;-webkit-font-smoothing:antialiased;--mx:.5;--my:.5;--ffw-serif:"Fraunces","Recoleta","GT Super Display","Iowan Old Style","Palatino Linotype",Georgia,"Times New Roman",serif}
.ffw-root :where(button,input){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;text-transform:inherit;letter-spacing:inherit}
.ffw-root :where(button){cursor:pointer;-webkit-tap-highlight-color:transparent}
.ffw-root :where(svg){display:block;max-width:none;flex:none}
.ffw-root :where(h2,h3,p,ol,ul,form){margin:0;padding:0}
.ffw-root :where(button:focus-visible,input:focus-visible,[tabindex]:focus-visible){outline:2px solid rgba(var(--ffw-ink),.9);outline-offset:3px}
.ffw-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.ffw-scene{position:absolute;inset:-3%;transform:translate3d(calc((var(--mx) - .5) * -22px),calc((var(--my) - .5) * -14px),0);transition:transform 1.1s cubic-bezier(.2,.7,.2,1)}
.ffw-canvas,.ffw-photo{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;object-fit:cover;opacity:0;transition:opacity .9s ease}
.ffw-scene[data-ready='true'] .ffw-canvas,.ffw-scene[data-ready='true'] .ffw-photo{opacity:1}

.ffw-light{position:absolute;inset:0;pointer-events:none}
.ffw-light>i{position:absolute;inset:0;opacity:0;transition:opacity 1.6s ease}
.ffw-l-haze{background:linear-gradient(180deg,rgba(214,230,255,.5),rgba(236,242,246,.22) 34%,rgba(244,246,242,.5) 50%,rgba(240,244,240,.16) 66%,rgba(255,255,255,0) 85%);mix-blend-mode:screen}
.ffw-l-warm{background:linear-gradient(180deg,rgba(255,160,60,.55),rgba(255,120,40,.4) 55%,rgba(110,50,10,.45));mix-blend-mode:soft-light}
.ffw-l-sun{background:radial-gradient(70% 55% at 88% 6%,rgba(255,196,110,.55),rgba(255,160,80,0) 70%);mix-blend-mode:screen}
.ffw-l-dusk{background:linear-gradient(180deg,rgba(54,48,120,.7),rgba(30,28,60,.62) 55%,rgba(10,14,20,.7));mix-blend-mode:multiply}
.ffw-l-lamps{background:radial-gradient(18% 14% at 12% 46%,rgba(255,190,110,.5),transparent 70%),radial-gradient(14% 10% at 40% 47%,rgba(255,200,120,.45),transparent 70%),radial-gradient(16% 12% at 86% 50%,rgba(255,180,100,.4),transparent 70%);mix-blend-mode:screen}
.ffw-root[data-light='morning'] .ffw-l-haze,.ffw-root[data-light='golden'] .ffw-l-warm,.ffw-root[data-light='golden'] .ffw-l-sun,.ffw-root[data-light='dusk'] .ffw-l-dusk,.ffw-root[data-light='dusk'] .ffw-l-lamps{opacity:1}

.ffw-stage{position:absolute;inset:0;display:grid;place-items:center;padding:16px;container-type:size}
.ffw-win{position:relative;--w:min(100cqw,600px,calc(100cqh / .98));--u:calc(var(--w) / 100);--ffw-ts:calc(var(--u) * 15.5);width:var(--w);transition:width .6s cubic-bezier(.2,.8,.2,1),transform .55s cubic-bezier(.5,0,.2,1),visibility 0s;animation:ffw-in 1.1s cubic-bezier(.2,.8,.2,1) backwards}
.ffw-win[data-zoom='true']{--w:min(100cqw,860px,calc(100cqh / .74));--ffw-ts:calc(var(--u) * 11.5)}
.ffw-win[data-drag='true']{transition:width .6s cubic-bezier(.2,.8,.2,1)}
.ffw-win[data-state='closed']{transform:translate3d(0,42cqh,0) scale(.08);visibility:hidden;pointer-events:none;transition:transform .55s cubic-bezier(.5,0,.75,0),visibility 0s .55s}
.ffw-tilt{transform:perspective(1400px) rotateX(calc((var(--my) - .5) * -3.5deg)) rotateY(calc((var(--mx) - .5) * 4.5deg));transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.ffw-win[data-drag='true'] .ffw-tilt{transform:none}

.ffw-glass{background:linear-gradient(180deg,rgba(var(--ffw-tint),.58),rgba(var(--ffw-tint),.44));-webkit-backdrop-filter:blur(16px) saturate(1.3) brightness(1.1);backdrop-filter:blur(16px) saturate(1.3) brightness(1.1);box-shadow:inset 0 1px 0 rgba(255,253,236,.62),inset 0 0 0 1px rgba(255,252,226,.34),inset 0 -1px 0 rgba(60,70,20,.18)}
.ffw-bar{position:relative;display:flex;align-items:flex-end;gap:max(4px,calc(var(--u) * .9));--bh:max(38px,calc(var(--u) * 8.6));height:var(--bh)}
.ffw-notch{flex:0 0 17%;height:calc(var(--bh) * .84);border-radius:14px 14px 0 0;display:flex;align-items:center;gap:max(5px,calc(var(--u) * 1.2));padding-left:max(10px,calc(var(--u) * 2.6));cursor:grab;touch-action:none}
.ffw-win[data-drag='true'] .ffw-notch,.ffw-win[data-drag='true'] .ffw-frame{cursor:grabbing}
.ffw-dot-btn{position:relative;width:max(11px,calc(var(--u) * 2.1));height:max(11px,calc(var(--u) * 2.1));border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.25),0 1px 2px rgba(0,0,0,.18)}
.ffw-dot-btn::after{content:"";position:absolute;inset:-6px}
.ffw-dot-btn svg{width:70%;height:70%;opacity:0;transition:opacity .15s;color:rgba(40,20,10,.7)}
.ffw-notch:hover .ffw-dot-btn svg,.ffw-dot-btn:focus-visible svg{opacity:1}
.ffw-red{background:#ff5f57}.ffw-yellow{background:#febc2e}.ffw-green{background:#28c840}
.ffw-tabs{flex:1;display:flex;align-items:flex-end;gap:inherit;height:var(--bh)}
.ffw-tab{flex:1;min-width:0;height:calc(var(--bh) * .84);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center;gap:max(5px,calc(var(--u) * 1.2));font-size:max(10.5px,calc(var(--u) * 2.25));letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;opacity:.82;transition:height .35s cubic-bezier(.2,.8,.2,1),opacity .25s,background .25s}
.ffw-tab svg{width:1.35em;height:1.35em}
.ffw-tab span{overflow:hidden;text-overflow:ellipsis}
.ffw-tab[aria-selected='true']{height:var(--bh);opacity:1;background:linear-gradient(180deg,rgba(var(--ffw-tint),.7),rgba(var(--ffw-tint),.58))}

.ffw-body{position:relative;aspect-ratio:1.14;transform-origin:50% 0;transition:transform .5s cubic-bezier(.5,0,.2,1),visibility 0s}
.ffw-win[data-zoom='true'] .ffw-body{aspect-ratio:1.62}
.ffw-win[data-state='min'] .ffw-body{transform:scaleY(0);visibility:hidden;transition:transform .45s cubic-bezier(.6,0,.4,1),visibility 0s .45s}
.ffw-shadow{position:absolute;inset:0;border-radius:4px 4px 22px 22px;box-shadow:0 34px 70px -24px rgba(6,14,3,.6),0 10px 24px -10px rgba(6,14,3,.4)}
.ffw-frame{position:absolute;inset:0;border-radius:4px 4px 22px 22px;padding:max(10px,calc(var(--u) * 2.5));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);cursor:grab;touch-action:none}
.ffw-pane{position:absolute;inset:max(10px,calc(var(--u) * 2.5));border-radius:14px;border:1px solid rgba(var(--ffw-ink),.6);background:linear-gradient(180deg,rgba(44,66,18,.26),rgba(28,50,10,.4));-webkit-backdrop-filter:blur(5px) saturate(1.15) brightness(.88);backdrop-filter:blur(5px) saturate(1.15) brightness(.88);box-shadow:inset 0 0 0 1px rgba(20,30,6,.12),inset 0 18px 40px -20px rgba(255,250,220,.22);display:flex;flex-direction:column;overflow:hidden;padding:max(14px,calc(var(--u) * 3.2)) max(14px,calc(var(--u) * 3.4)) 0;text-shadow:0 1px 14px rgba(12,24,4,.4);outline:none;touch-action:pan-y}
.ffw-glare{position:absolute;inset:0;border-radius:4px 4px 22px 22px;pointer-events:none;background:radial-gradient(circle at var(--gx,30%) var(--gy,20%),rgba(255,253,235,.13),rgba(255,253,235,0) 42%)}

.ffw-meta{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;font-size:max(10px,calc(var(--u) * 2.05));line-height:1.6;letter-spacing:.06em;text-transform:uppercase}
.ffw-meta>div{display:flex;flex-direction:column;min-width:0}
.ffw-meta>div:last-child{text-align:right;align-items:flex-end}
.ffw-meta b{font-weight:400;opacity:.92}
.ffw-rule{flex:none;height:0;margin-top:max(9px,calc(var(--u) * 2.2));border-top:1px dotted rgba(var(--ffw-ink),.62)}
.ffw-center{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:max(6px,calc(var(--u) * 1.4)) 0}
.ffw-title{font-family:var(--ffw-serif);font-weight:700;font-size:min(var(--ffw-ts),calc(var(--u) * 78 / var(--ffw-len) / .6));line-height:.93;letter-spacing:-.022em;font-optical-sizing:auto;text-shadow:0 2px 24px rgba(10,22,4,.35)}
.ffw-line{display:block;white-space:nowrap}
.ffw-ch{display:inline-block;animation:ffw-ch .95s cubic-bezier(.2,.8,.2,1) backwards;animation-delay:calc(var(--i) * 34ms)}
.ffw-div{display:flex;align-items:center;gap:max(6px,calc(var(--u) * 1.4));width:80%;margin:max(10px,calc(var(--u) * 2.4)) auto max(8px,calc(var(--u) * 1.8))}
.ffw-div::before,.ffw-div::after{content:"";flex:1;height:1px;background:rgba(var(--ffw-ink),.62)}
.ffw-dots{display:flex;align-items:center}
.ffw-pip{width:max(18px,calc(var(--u) * 3.4));height:max(18px,calc(var(--u) * 3.4));display:grid;place-items:center;border-radius:50%}
.ffw-pip i{width:4px;height:4px;transform:rotate(45deg);background:rgba(var(--ffw-ink),.6);transition:transform .3s,background .3s}
.ffw-pip:hover i{transform:rotate(45deg) scale(1.5);background:rgb(var(--ffw-ink))}
.ffw-pip svg{width:75%;height:75%;animation:ffw-spark .6s cubic-bezier(.2,.8,.2,1) backwards;filter:drop-shadow(0 0 6px rgba(var(--ffw-ink),.5))}
.ffw-tag{font-size:max(10.5px,calc(var(--u) * 2.3));line-height:1.65;letter-spacing:.14em;text-transform:uppercase}
.ffw-fade{animation:ffw-fade .7s cubic-bezier(.2,.8,.2,1) backwards;animation-delay:calc(var(--i,0) * 70ms)}
.ffw-nav{position:absolute;top:50%;width:max(32px,calc(var(--u) * 6));height:max(32px,calc(var(--u) * 6));margin-top:calc(max(32px,calc(var(--u) * 6)) / -2);border-radius:50%;display:grid;place-items:center;opacity:0;background:rgba(var(--ffw-ink),.1);box-shadow:inset 0 0 0 1px rgba(var(--ffw-ink),.35);transition:opacity .25s,background .25s,transform .25s}
.ffw-prev{left:max(6px,calc(var(--u) * 1.4))}.ffw-prev svg{transform:scaleX(-1)}
.ffw-next{right:max(6px,calc(var(--u) * 1.4))}
.ffw-nav:focus-visible{opacity:1}

.ffw-list{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;justify-content:safe center;gap:2px;padding:max(8px,calc(var(--u) * 1.6)) 0;scrollbar-width:thin;list-style:none}
.ffw-row{width:100%;display:grid;grid-template-columns:2.2em minmax(0,1fr) auto auto;gap:max(8px,calc(var(--u) * 1.8));align-items:baseline;padding:max(8px,calc(var(--u) * 1.5)) max(8px,calc(var(--u) * 1.4));border-radius:9px;text-align:left;font-size:max(10px,calc(var(--u) * 2));letter-spacing:.06em;text-transform:uppercase;transition:background .2s;animation:ffw-fade .55s cubic-bezier(.2,.8,.2,1) backwards;animation-delay:calc(var(--i) * 60ms)}
.ffw-row[aria-current='true'],.ffw-card[aria-current='true'] .ffw-thumb{box-shadow:inset 0 0 0 1px rgba(var(--ffw-ink),.5)}
.ffw-row[aria-current='true']{background:rgba(var(--ffw-ink),.12)}
.ffw-rt{font-family:var(--ffw-serif);font-weight:700;font-size:2.1em;line-height:1;text-transform:none;letter-spacing:-.015em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ffw-rn,.ffw-rs{opacity:.8}

.ffw-journal{flex:1;min-height:0;overflow:auto;padding:max(10px,calc(var(--u) * 2.2)) 2px max(8px,calc(var(--u) * 1.6));scrollbar-width:thin;scrollbar-color:rgba(var(--ffw-ink),.4) transparent;overscroll-behavior:contain}
.ffw-jt{font-family:var(--ffw-serif);font-weight:700;font-size:max(26px,calc(var(--u) * 7.4));line-height:.98;letter-spacing:-.02em}
.ffw-jt em{font-style:italic;font-weight:400}
.ffw-jp{font-family:var(--ffw-serif);font-style:italic;font-size:max(14px,calc(var(--u) * 2.75));line-height:1.52;margin-top:.75em;max-width:38em}
.ffw-mine{display:flex;gap:.7em;align-items:baseline}
.ffw-mine small{flex:none;font-family:ui-monospace,Menlo,Consolas,monospace;font-style:normal;font-size:max(9px,calc(var(--u) * 1.7));letter-spacing:.1em;padding:.15em .5em;border-radius:4px;background:rgba(var(--ffw-ink),.16)}
.ffw-write{flex:none;display:flex;gap:max(6px,calc(var(--u) * 1.2));padding:max(8px,calc(var(--u) * 1.8)) 0;border-top:1px dotted rgba(var(--ffw-ink),.55)}
.ffw-input{flex:1;min-width:0;border-radius:9px;padding:.6em .85em;background:rgba(var(--ffw-ink),.1);box-shadow:inset 0 0 0 1px rgba(var(--ffw-ink),.35);font-family:var(--ffw-serif);font-style:italic;font-size:max(14px,calc(var(--u) * 2.6));transition:background .2s,box-shadow .2s}
.ffw-input::placeholder{color:rgba(var(--ffw-ink),.62)}
.ffw-input:focus{outline:none;background:rgba(var(--ffw-ink),.16);box-shadow:inset 0 0 0 1px rgba(var(--ffw-ink),.75)}
.ffw-pin{flex:none;padding:0 max(10px,calc(var(--u) * 2));border-radius:9px;font-size:max(10px,calc(var(--u) * 2));letter-spacing:.1em;text-transform:uppercase;background:rgba(var(--ffw-ink),.88);color:#24320f;text-shadow:none;transition:opacity .2s,transform .2s}
.ffw-pin:disabled{opacity:.4;cursor:default}

.ffw-grid{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(max(84px,calc(var(--u) * 24)),1fr));gap:max(8px,calc(var(--u) * 2.2));align-content:safe center;padding:max(12px,calc(var(--u) * 2.6)) 2px;scrollbar-width:thin;list-style:none}
.ffw-card{width:100%;display:flex;flex-direction:column;gap:max(5px,calc(var(--u) * 1));padding:max(5px,calc(var(--u) * 1));border-radius:12px;text-align:left;transition:background .25s;animation:ffw-fade .6s cubic-bezier(.2,.8,.2,1) backwards;animation-delay:calc(var(--i) * 70ms)}
.ffw-thumb{position:relative;display:block;aspect-ratio:1.4;margin-top:9%;border-radius:3px 9px 9px 9px;box-shadow:0 8px 18px -10px rgba(0,0,0,.6);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.ffw-thumb::before{content:"";position:absolute;left:0;bottom:100%;width:42%;height:14%;border-radius:6px 6px 0 0;background:rgba(var(--ffw-tint),.7)}
.ffw-thumb::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(180deg,rgba(var(--ffw-tint),.32),rgba(var(--ffw-tint),.08) 40%,rgba(0,0,0,.12));box-shadow:inset 0 1px 0 rgba(255,253,236,.5),inset 0 0 0 1px rgba(255,252,226,.25)}
.ffw-ct{font-family:var(--ffw-serif);font-weight:700;font-size:max(14px,calc(var(--u) * 3.3));line-height:1.05;letter-spacing:-.01em}
.ffw-cm{font-size:max(9.5px,calc(var(--u) * 1.75));letter-spacing:.07em;text-transform:uppercase;opacity:.85;display:flex;flex-wrap:wrap;justify-content:space-between;gap:0 6px}
.ffw-cm span{white-space:nowrap}

.ffw-foot{position:relative;flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 calc(max(14px,calc(var(--u) * 3.4)) * -1);padding:max(9px,calc(var(--u) * 2.1)) max(14px,calc(var(--u) * 3.4));border-top:1px solid rgba(var(--ffw-ink),.55);font-size:max(10px,calc(var(--u) * 2.05));letter-spacing:.07em;text-transform:uppercase}
.ffw-foot>*{display:flex;align-items:center;gap:max(6px,calc(var(--u) * 1.4));white-space:nowrap}
.ffw-foot>:nth-child(2){position:absolute;left:50%;transform:translateX(-50%)}
.ffw-foot svg{width:1.45em;height:1.45em}
.ffw-fbtn{border-radius:6px;padding:4px 6px;margin:-4px -6px;transition:background .2s}

.ffw-dock{position:absolute;left:50%;bottom:max(22px,5svh);transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:10px 16px 10px 12px;border-radius:14px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;text-shadow:0 1px 10px rgba(12,24,4,.4);animation:ffw-dock .6s .35s cubic-bezier(.2,.8,.2,1) backwards}
.ffw-dock b{font-family:var(--ffw-serif);font-size:16px;letter-spacing:-.01em;text-transform:none}
.ffw-dock em{font-style:normal;opacity:.75}

@media (hover:hover) and (pointer:fine){
.ffw-pane:hover .ffw-nav{opacity:.85}
.ffw-nav:hover{opacity:1;background:rgba(var(--ffw-ink),.2)}
.ffw-tab:hover{opacity:1}
.ffw-row:hover{background:rgba(var(--ffw-ink),.1)}
.ffw-card:hover{background:rgba(var(--ffw-ink),.1)}
.ffw-card:hover .ffw-thumb{transform:translateY(-3px) rotate(-1deg)}
.ffw-fbtn:hover{background:rgba(var(--ffw-ink),.14)}
.ffw-pin:not(:disabled):hover{transform:translateY(-1px)}
.ffw-dock:hover{transform:translateX(-50%) translateY(-2px)}
}
@container (max-width:520px) and (orientation:portrait){.ffw-win{--w:min(100cqw,600px,calc(100cqh / 1.2))}.ffw-body{aspect-ratio:.94}.ffw-win[data-zoom='true'] .ffw-body{aspect-ratio:.94}}
@container (max-width:460px){.ffw-rl{display:none}.ffw-row{grid-template-columns:2.2em minmax(0,1fr) auto}}
@container (max-width:390px){.ffw-tab svg{display:none}}

@keyframes ffw-in{from{transform:translate3d(0,28px,0) scale(.965)}to{transform:none}}
@keyframes ffw-ch{from{opacity:0;filter:blur(10px);transform:translateY(.22em)}to{opacity:1;filter:none;transform:none}}
@keyframes ffw-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes ffw-spark{from{transform:scale(.2) rotate(-90deg);opacity:0}to{transform:none;opacity:1}}
@keyframes ffw-dock{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%)}}

@media (prefers-reduced-motion:reduce){
.ffw-scene,.ffw-tilt{transform:none;transition:none}
.ffw-win,.ffw-ch,.ffw-fade,.ffw-row,.ffw-card,.ffw-dock,.ffw-pip svg{animation:none}
.ffw-win,.ffw-body,.ffw-tab,.ffw-light>i,.ffw-thumb{transition:none}
.ffw-card:hover .ffw-thumb{transform:none}
}
`

type Drag = { id: number; x: number; y: number; ox: number; oy: number; maxX: number; maxY: number }

export default function FrostedFolderWindow({
  places = DEFAULT_PLACES,
  tabLabels,
  defaultTab = "places",
  defaultIndex = 0,
  image,
  seed = 7,
  tint = DEFAULT_TINT,
  ink = DEFAULT_INK,
  draggable = true,
  notePlaceholder = "Add a line to this entry…",
  onPlaceChange,
  onNote,
  height = "100svh",
  className = "",
}: FrostedFolderWindowProps) {
  const uid = React.useId().replace(/:/g, "")
  const count = places.length
  const labels = { ...DEFAULT_LABELS, ...tabLabels }

  const [tab, setTab] = React.useState<EscapeTab>(defaultTab)
  const [index, setIndex] = React.useState(() => wrap(defaultIndex, count))
  const [view, setView] = React.useState<"cover" | "list">("cover")
  const [newest, setNewest] = React.useState(true)
  const [state, setState] = React.useState<"open" | "min" | "closed">("open")
  const [zoom, setZoom] = React.useState(false)
  const [offset, setOffset] = React.useState([0, 0])
  const [dragging, setDragging] = React.useState(false)
  const [notes, setNotes] = React.useState<Record<number, string[]>>({})
  const [draft, setDraft] = React.useState("")
  const [ready, setReady] = React.useState(false)

  const rootRef = React.useRef<HTMLElement>(null)
  const winRef = React.useRef<HTMLDivElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const drag = React.useRef<Drag | null>(null)
  const swipe = React.useRef<{ x: number; y: number } | null>(null)
  const frame = React.useRef(0)
  const first = React.useRef(true)

  const i = wrap(index, count)
  const place: EscapePlace | undefined = places[i]

  // ---- the garden ------------------------------------------------------------
  React.useEffect(() => {
    if (image) return
    const canvas = canvasRef.current
    if (!canvas) return
    let timer = 0
    let lastW = 0
    let lastH = 0
    const paint = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h || (w === lastW && h === lastH)) return
      lastW = w
      lastH = h
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paintScene(ctx, w, h, seed)
      setReady(true)
    }
    paint()
    if (typeof ResizeObserver !== "function") return
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(paint, 140)
    })
    ro.observe(canvas)
    return () => {
      ro.disconnect()
      window.clearTimeout(timer)
    }
  }, [image, seed])

  // ---- the pointer: parallax, tilt and the glare on the glass -----------------
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
    let px = 0
    let py = 0
    const apply = () => {
      frame.current = 0
      const r = root.getBoundingClientRect()
      if (!still) {
        root.style.setProperty("--mx", ((px - r.left) / r.width).toFixed(3))
        root.style.setProperty("--my", ((py - r.top) / r.height).toFixed(3))
      }
      const win = winRef.current
      if (win) {
        const b = win.getBoundingClientRect()
        win.style.setProperty("--gx", (((px - b.left) / b.width) * 100).toFixed(1) + "%")
        win.style.setProperty("--gy", (((py - b.top) / b.height) * 100).toFixed(1) + "%")
      }
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      px = e.clientX
      py = e.clientY
      if (!frame.current) frame.current = requestAnimationFrame(apply)
    }
    const leave = () => {
      root.style.setProperty("--mx", ".5")
      root.style.setProperty("--my", ".5")
    }
    root.addEventListener("pointermove", move)
    root.addEventListener("pointerleave", leave)
    return () => {
      root.removeEventListener("pointermove", move)
      root.removeEventListener("pointerleave", leave)
      cancelAnimationFrame(frame.current)
    }
  }, [])

  // a rolled-up or closed window is out of the tab order, not just out of sight
  React.useEffect(() => {
    bodyRef.current?.toggleAttribute("inert", state !== "open")
    winRef.current?.toggleAttribute("inert", state === "closed")
  }, [state])

  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (place) onPlaceChange?.(i, place)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  const go = (step: number) => setIndex((n) => wrap(n + step, count))
  const openPlace = (n: number) => {
    setIndex(n)
    setView("cover")
    setTab("places")
  }

  // ---- dragging the window by its glass edge ----------------------------------
  const startDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!draggable || e.button !== 0 || (e.target as HTMLElement).closest("button")) return
    const root = rootRef.current
    const win = winRef.current
    if (!root || !win) return
    const r = root.getBoundingClientRect()
    const b = win.getBoundingClientRect()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      ox: offset[0],
      oy: offset[1],
      maxX: Math.max(0, (r.width - b.width) / 2 + b.width * 0.35),
      maxY: Math.max(0, (r.height - b.height) / 2 + b.height * 0.3),
    }
    setDragging(true)
  }
  const moveDrag = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    setOffset(clampOffset(d.ox + e.clientX - d.x, d.oy + e.clientY - d.y, d.maxX, d.maxY))
  }
  const endDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return
    drag.current = null
    setDragging(false)
  }
  const dragProps = {
    onPointerDown: startDrag,
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onDoubleClick: (e: React.MouseEvent) => {
      if (!(e.target as HTMLElement).closest("button")) setOffset([0, 0])
    },
  }

  // ---- tabs, keys and swipes ------------------------------------------------------
  const onTabKey = (e: React.KeyboardEvent, n: number) => {
    let next = -1
    if (e.key === "ArrowRight") next = wrap(n + 1, TABS.length)
    else if (e.key === "ArrowLeft") next = wrap(n - 1, TABS.length)
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = TABS.length - 1
    if (next < 0) return
    e.preventDefault()
    setTab(TABS[next])
    tabRefs.current[next]?.focus()
  }
  const onPaneKey = (e: React.KeyboardEvent) => {
    if (tab !== "places" || view !== "cover" || e.target !== e.currentTarget) return
    if (e.key === "ArrowRight") go(1)
    else if (e.key === "ArrowLeft") go(-1)
    else return
    e.preventDefault()
  }
  const onPaneDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button,input,a")) return
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onPaneUp = (e: React.PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s || tab !== "places" || view !== "cover") return
    const dir = swipeDirection(e.clientX - s.x, e.clientY - s.y, 40)
    if (dir) go(dir)
  }

  const addNote = (e: React.FormEvent) => {
    e.preventDefault()
    const note = draft.trim().slice(0, 280)
    if (!note) return
    setNotes((all) => ({ ...all, [i]: [...(all[i] || []), note] }))
    setDraft("")
    onNote?.(i, note)
  }

  // ---- what each tab shows ------------------------------------------------------
  const lines = place ? titleLines(place.title) : []
  const tagline = place ? taglineLines(place.tagline) : []
  const journal = place ? [...(place.journal || []), ...(notes[i] || [])] : []
  const own = place?.journal?.length || 0
  const order = React.useMemo(() => sortByDate(places, newest), [places, newest])
  const total = formatSize(totalSize(places))
  let n = 0

  const meta = (left: string, leftValue: string, right: string, rightValue: string) => (
    <div className="ffw-meta ffw-fade" key={tab + i}>
      <div>
        <span>{left}:</span>
        <b>{leftValue}</b>
      </div>
      <div>
        <span>{right}:</span>
        <b>{rightValue}</b>
      </div>
    </div>
  )

  let content: React.ReactNode = null
  let footer: React.ReactNode = null

  if (!place) {
    content = (
      <div className="ffw-center">
        <p className="ffw-tag">This folder is empty.</p>
      </div>
    )
  } else if (tab === "places") {
    content =
      view === "cover" ? (
        <>
          {meta("Location", place.location, "Date", place.date)}
          <div className="ffw-rule" />
          <div className="ffw-center">
            <h2 key={"t" + i} className="ffw-title" style={{ "--ffw-len": fitLength(lines) } as React.CSSProperties}>
              {lines.map((line, li) => (
                <span className="ffw-line" key={li}>
                  {[...line].map((c, ci) => (
                    <span className="ffw-ch" key={ci} style={{ "--i": n++ } as React.CSSProperties} aria-hidden="true">
                      {c === " " ? " " : c}
                    </span>
                  ))}
                </span>
              ))}
              <span className="ffw-sr">{place.title}</span>
            </h2>
            <div className="ffw-div">
              <div className="ffw-dots">
                {places.map((p, pi) => (
                  <button
                    key={pi}
                    type="button"
                    className="ffw-pip"
                    aria-label={"Show " + p.title}
                    aria-current={pi === i ? "true" : undefined}
                    onClick={() => setIndex(pi)}
                  >
                    {pi === i ? Icon.sparkle : <i />}
                  </button>
                ))}
              </div>
            </div>
            <p className="ffw-tag ffw-fade" key={"g" + i} style={{ "--i": 4 } as React.CSSProperties}>
              {tagline.map((l, li) => (
                <React.Fragment key={li}>
                  {li > 0 && <br />}
                  {l}
                </React.Fragment>
              ))}
            </p>
          </div>
          {count > 1 && (
            <>
              <button type="button" className="ffw-nav ffw-prev" aria-label="Previous place" onClick={() => go(-1)}>
                {Icon.chevron}
              </button>
              <button type="button" className="ffw-nav ffw-next" aria-label="Next place" onClick={() => go(1)}>
                {Icon.chevron}
              </button>
            </>
          )}
        </>
      ) : (
        <>
          {meta("Folder", labels.places, "Sorted", "As filed")}
          <div className="ffw-rule" />
          <ol className="ffw-list">
            {places.map((p, pi) => (
              <li key={pi}>
                <button
                  type="button"
                  className="ffw-row"
                  style={{ "--i": pi } as React.CSSProperties}
                  aria-current={pi === i ? "true" : undefined}
                  onClick={() => openPlace(pi)}
                >
                  <span className="ffw-rn">{pad2(pi + 1)}</span>
                  <span className="ffw-rt">{p.title}</span>
                  <span className="ffw-rl">{cityOf(p.location)}</span>
                  <span className="ffw-rs">{formatSize(p.sizeMB || 0)}</span>
                </button>
              </li>
            ))}
          </ol>
        </>
      )
    footer = (
      <>
        <button type="button" className="ffw-fbtn" onClick={() => setTab("archive")} aria-label={count + " items, open the archive"}>
          {Icon.folder}
          {count} {count === 1 ? "item" : "items"}
        </button>
        <span>{total}</span>
        <button
          type="button"
          className="ffw-fbtn"
          aria-pressed={view === "list"}
          aria-label={view === "list" ? "View as cover" : "View as list"}
          onClick={() => setView((v) => (v === "cover" ? "list" : "cover"))}
        >
          View {view === "list" ? Icon.list : Icon.grid}
        </button>
      </>
    )
  } else if (tab === "journal") {
    content = (
      <>
        {meta("Entry", pad2(i + 1) + " / " + pad2(count), "Date", place.date)}
        <div className="ffw-rule" />
        <div className="ffw-journal" key={"j" + i} tabIndex={0} aria-label={"Journal for " + place.title}>
          <h2 className="ffw-jt ffw-fade">
            Notes from <em>{cityOf(place.location) || place.title}</em>
          </h2>
          {journal.map((p, pi) =>
            pi < own ? (
              <p className="ffw-jp ffw-fade" key={pi} style={{ "--i": pi + 1 } as React.CSSProperties}>
                {p}
              </p>
            ) : (
              <p className="ffw-jp ffw-mine ffw-fade" key={pi}>
                <small>You</small>
                <span>{p}</span>
              </p>
            ),
          )}
        </div>
        <form className="ffw-write" onSubmit={addNote}>
          <label className="ffw-sr" htmlFor={uid + "-note"}>
            Add a line to the journal for {place.title}
          </label>
          <input
            ref={inputRef}
            id={uid + "-note"}
            className="ffw-input"
            value={draft}
            maxLength={280}
            autoComplete="off"
            placeholder={notePlaceholder}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="ffw-pin" disabled={!draft.trim()}>
            Pin
          </button>
        </form>
      </>
    )
    footer = (
      <>
        <span>
          {Icon.journal}
          {journal.length} {journal.length === 1 ? "entry" : "entries"}
        </span>
        <span>{countWords(journal)} words</span>
        <button type="button" className="ffw-fbtn" onClick={() => inputRef.current?.focus()}>
          Write {Icon.pen}
        </button>
      </>
    )
  } else {
    content = (
      <>
        {meta("Folders", pad2(count), "Order", newest ? "Newest first" : "Oldest first")}
        <div className="ffw-rule" />
        <ul className="ffw-grid" key={"a" + String(newest)}>
          {order.map((pi, k) => {
            const p = places[pi]
            return (
              <li key={pi}>
                <button
                  type="button"
                  className="ffw-card"
                  style={{ "--i": k } as React.CSSProperties}
                  aria-current={pi === i ? "true" : undefined}
                  onClick={() => openPlace(pi)}
                >
                  <span className="ffw-thumb" style={{ background: thumbBackground(p.light) }} />
                  <span className="ffw-ct">{p.title}</span>
                  <span className="ffw-cm">
                    <span>{p.date}</span>
                    <span>{formatSize(p.sizeMB || 0)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </>
    )
    footer = (
      <>
        <span>
          {Icon.archive}
          {count} {count === 1 ? "folder" : "folders"}
        </span>
        <span>{total}</span>
        <button type="button" className="ffw-fbtn" aria-pressed={!newest} onClick={() => setNewest((v) => !v)}>
          Sort {Icon.sort}
        </button>
      </>
    )
  }

  const announce = place ? "Place " + (i + 1) + " of " + count + ": " + place.title + ", " + place.location : ""
  const light = place?.light || "noon"

  return (
    <section
      ref={rootRef}
      className={("ffw-root " + className).trim()}
      data-light={light}
      aria-label={place ? place.title : "Memory folder"}
      style={
        {
          height,
          "--ffw-tint": rgbList(tint, DEFAULT_TINT),
          "--ffw-ink": rgbList(ink, DEFAULT_INK),
        } as React.CSSProperties
      }
    >
      <style>{FFW_CSS}</style>

      <div className="ffw-scene" data-ready={ready || !!image} aria-hidden="true">
        {image ? (
          <img className="ffw-photo" src={image} alt="" width={1600} height={1000} style={{ maxWidth: "none" }} draggable={false} />
        ) : (
          <canvas ref={canvasRef} className="ffw-canvas" />
        )}
      </div>
      <div className="ffw-light" aria-hidden="true">
        <i className="ffw-l-haze" />
        <i className="ffw-l-warm" />
        <i className="ffw-l-sun" />
        <i className="ffw-l-dusk" />
        <i className="ffw-l-lamps" />
      </div>

      <div className="ffw-stage">
        <div
          ref={winRef}
          className="ffw-win"
          data-state={state}
          data-zoom={zoom}
          data-drag={dragging}
          style={{ translate: offset[0] + "px " + offset[1] + "px" }}
        >
          <div className="ffw-tilt">
            <div className="ffw-bar">
              <div className="ffw-notch ffw-glass" {...dragProps}>
                <button type="button" className="ffw-dot-btn ffw-red" aria-label="Close window" onClick={() => setState("closed")}>
                  <svg viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ffw-dot-btn ffw-yellow"
                  aria-label={state === "min" ? "Unroll window" : "Roll up window"}
                  aria-expanded={state === "open"}
                  onClick={() => setState((s) => (s === "min" ? "open" : "min"))}
                >
                  <svg viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M2 5h6" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ffw-dot-btn ffw-green"
                  aria-label={zoom ? "Restore size" : "Zoom window"}
                  aria-pressed={zoom}
                  onClick={() => {
                    setZoom((z) => !z)
                    setOffset([0, 0])
                    setState("open")
                  }}
                >
                  <svg viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M3 7V3.2h3.8zM7 3v3.8H3.2z" fill="currentColor" />
                  </svg>
                </button>
              </div>
              <div className="ffw-tabs" role="tablist" aria-label="Folder">
                {TABS.map((t, ti) => {
                  const on = tab === t
                  return (
                    <button
                      key={t}
                      ref={(el) => {
                        tabRefs.current[ti] = el
                      }}
                      type="button"
                      role="tab"
                      id={uid + "-tab-" + t}
                      aria-selected={on}
                      aria-controls={uid + "-panel"}
                      tabIndex={on ? 0 : -1}
                      className="ffw-tab ffw-glass"
                      onClick={() => {
                        setTab(t)
                        if (state === "min") setState("open")
                      }}
                      onKeyDown={(e) => onTabKey(e, ti)}
                    >
                      {t === "places" ? Icon.folder : t === "journal" ? Icon.journal : Icon.archive}
                      <span>{labels[t]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="ffw-body" ref={bodyRef}>
              <div className="ffw-shadow" aria-hidden="true" />
              <div className="ffw-frame ffw-glass" aria-hidden="true" {...dragProps} />
              <div
                className="ffw-pane"
                id={uid + "-panel"}
                role="tabpanel"
                aria-labelledby={uid + "-tab-" + tab}
                tabIndex={0}
                onKeyDown={onPaneKey}
                onPointerDown={onPaneDown}
                onPointerUp={onPaneUp}
                onPointerCancel={() => (swipe.current = null)}
              >
                {content}
                <footer className="ffw-foot">{footer}</footer>
              </div>
              <div className="ffw-glare" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {state === "closed" && (
        <button type="button" className="ffw-dock ffw-glass" onClick={() => setState("open")}>
          {Icon.folder}
          <b>{place ? place.title : labels.places}</b>
          <em>Reopen</em>
        </button>
      )}
      <p className="ffw-sr" aria-live="polite">
        {announce}
      </p>
    </section>
  )
}
