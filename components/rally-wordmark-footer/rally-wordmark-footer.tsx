"use client"

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react"

/**
 * RallyWordmarkFooter
 *
 * A full-screen footer whose bottom half is a giant monoline wordmark with a red ball
 * resting in the hook of its first "l". Tap the ball to knock it up; keep it in the air
 * as long as you can. Every letter is a sprung rigid body: when the ball lands on a
 * stroke the letter swings, springs back and throws the ball on. Miss and the ball drops
 * out of the bottom, the score resets, and a new ball falls back into the hook.
 *
 * Left alone, a ghost player keeps a short rally going so the footer never sits still.
 *
 * Install-safe: one file, no dependencies beyond React, no percentage height in flow, the
 * root takes a definite min-height from the `height` prop, colours come from the five
 * semantic tokens plus the ball colour prop.
 */

export interface RallyLink {
  label: string
  href: string
}

export interface RallyWordmarkFooterProps {
  /** The wordmark. Letters available: a e f h i l n o t u. Others are skipped. */
  word?: string
  /** Two-line intro beside the signup field: first line in ink, second muted. */
  headline?: string
  subline?: string
  /** Contact column. The first line becomes a mailto link. */
  email?: string
  contactLines?: string[]
  /** Main links, then the quieter legal links under them. */
  links?: RallyLink[]
  legalLinks?: RallyLink[]
  /** Social links, then the copyright lines under them. */
  socials?: RallyLink[]
  copyright?: string[]
  /** Hint shown beside the score. */
  hint?: string
  ballColor?: string
  /** Keep a short rally going when nobody is playing. Off under reduced motion. */
  autoPlay?: boolean
  /** Called with the address when the signup form is sent. */
  onSubscribe?: (email: string) => void
  /** Minimum height of the footer. A definite length. */
  height?: string
  className?: string
  style?: CSSProperties
}

// #region rally
export interface Pt {
  x: number
  y: number
}

/** One letter: polylines in word units (baseline y = 0, up is negative), a pivot and an optional cradle. */
export interface GlyphDef {
  strokes: Pt[][]
  pivot: Pt
  cradle?: Pt
  width: number
}

export interface Body {
  ch: string
  strokes: Pt[][]
  pivot: Pt
  cradle?: Pt
  minX: number
  maxX: number
  minY: number
  maxY: number
  th: number
  w: number
  dx: number
  dy: number
  vx: number
  vy: number
}

export interface World {
  bodies: Body[]
  bx: number
  by: number
  bvx: number
  bvy: number
  alive: boolean
  fade: number
  t: number
  respawnAt: number
  restTime: number
  touching: boolean
  score: number
  best: number
  cradle: Pt
  walls: { l: number; r: number; t: number; b: number }
  wobble: boolean
  ghost: { active: boolean; taps: number; plan: number; idle: number; cycle: number; aim: number }
}

/** Word units: the stems are 345 tall and 32 thick, the ball is 18 in radius. */
export const STROKE = 32
export const BALL_R = 18
export const GRAVITY = 1430
export const TAP_SPEED = 855
const WALL_E = 0.7
const LETTER_E = 0.68
const FRICTION = 0.18
const MASS = 12
const INERTIA = 6 * 90 * 90
const ANG_K = INERTIA * Math.pow(2 * Math.PI * 1.2, 2)
const ANG_C = 2 * 0.12 * INERTIA * (2 * Math.PI * 1.2)
const LIN_K = MASS * Math.pow(2 * Math.PI * 4, 2)
const LIN_C = 2 * 0.3 * MASS * (2 * Math.PI * 4)
const MAX_TH = 0.55

/** Points along a circle, screen angles in degrees (0 = right, 90 = down), from a0 to a1 either way. */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number): Pt[] {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 3))
  const out: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180
    out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r })
  }
  return out
}

const P = (x: number, y: number): Pt => ({ x, y })

/** The alphabet. `alt` swaps the slant of the e's crossbar so repeated letters differ. */
export function glyph(ch: string, alt: boolean): GlyphDef | null {
  switch (ch) {
    case "e":
      return alt
        ? { strokes: [[P(14, -75), ...arc(106, -97, 106, -10.5, -330)]], pivot: P(106, -97), width: 212 }
        : { strokes: [[P(19, -123), ...arc(106, -97, 106, 17, -300)]], pivot: P(106, -97), width: 212 }
    case "l":
      return {
        strokes: [[P(17, -347), ...arc(117, -53, 44, 180, 21)]],
        pivot: P(158, -37),
        cradle: P(117, -53),
        width: 161,
      }
    case "h":
      return {
        strokes: [
          [P(40, -347), P(12, 0)],
          [...arc(101.8, -118, 80, 184.6, 360), P(184, 0)],
        ],
        pivot: P(100, 0),
        width: 184,
      }
    case "o":
      return { strokes: [arc(106, -100, 106, -90, 270)], pivot: P(106, -100), width: 212 }
    case "f":
      return {
        strokes: [
          [P(55, 0), ...arc(170, -240, 85, 180, 315)],
          [P(0, -208), P(185, -187)],
        ],
        pivot: P(55, 0),
        width: 230,
      }
    case "t":
      return {
        strokes: [
          [P(122, -345), ...arc(140, -57, 70, 180, 12)],
          [P(15, -243), P(205, -205)],
        ],
        pivot: P(140, 13),
        width: 208,
      }
    case "i":
      return {
        strokes: [
          [P(12, -208), P(0, 0)],
          [P(22, -300), P(22.5, -300)],
        ],
        pivot: P(6, 0),
        width: 23,
      }
    case "n":
      return {
        strokes: [
          [P(10, -208), P(0, 0)],
          [...arc(83.8, -118, 78, 182.75, 360), P(164, 0)],
        ],
        pivot: P(85, 0),
        width: 164,
      }
    case "u":
      return {
        strokes: [
          [P(0, -208), P(4, -95), ...arc(88, -95, 84, 180, 0)],
          [P(172, -208), P(175, 0)],
        ],
        pivot: P(88, 0),
        width: 175,
      }
    case "a":
      return {
        strokes: [arc(100, -100, 100, -90, 270), [P(205, -205), P(203, 0)]],
        pivot: P(100, 0),
        width: 205,
      }
    default:
      return null
  }
}

/** Lays the word out left to right from x = 0. An "l" tucks its hook against the next letter. */
export function layoutWord(word: string): { bodies: Body[]; minX: number; maxX: number; minY: number; maxY: number } {
  const bodies: Body[] = []
  let x = 0
  let prev = ""
  let es = 0
  for (const raw of word.toLowerCase()) {
    const g = glyph(raw, raw === "e" ? es++ % 2 === 1 : false)
    if (!g) continue
    if (bodies.length) x += prev === "l" ? 12 : 34
    const strokes = g.strokes.map((s) => s.map((p) => P(p.x + x, p.y)))
    const all = strokes.flat()
    bodies.push({
      ch: raw,
      strokes,
      pivot: P(g.pivot.x + x, g.pivot.y),
      cradle: g.cradle ? P(g.cradle.x + x, g.cradle.y) : undefined,
      minX: Math.min(...all.map((p) => p.x)),
      maxX: Math.max(...all.map((p) => p.x)),
      minY: Math.min(...all.map((p) => p.y)),
      maxY: Math.max(...all.map((p) => p.y)),
      th: 0,
      w: 0,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
    })
    x += g.width
    prev = raw
  }
  const minX = bodies.length ? Math.min(...bodies.map((b) => b.minX)) - STROKE / 2 : 0
  const maxX = bodies.length ? Math.max(...bodies.map((b) => b.maxX)) + STROKE / 2 : 1
  const minY = bodies.length ? Math.min(...bodies.map((b) => b.minY)) - STROKE / 2 : -1
  const maxY = bodies.length ? Math.max(...bodies.map((b) => b.maxY)) + STROKE / 2 : 0
  return { bodies, minX, maxX, minY, maxY }
}

/** Where the ball sits when it is at home: the bottom of the first hook, or on top of the first letter. */
export function restSpot(bodies: Body[]): Pt {
  const home = bodies.find((b) => b.cradle)
  if (home && home.cradle) return P(home.cradle.x, home.cradle.y + 44 - STROKE / 2 - BALL_R)
  const first = bodies[0]
  return first ? P((first.minX + first.maxX) / 2, first.minY - STROKE / 2 - BALL_R) : P(0, -BALL_R)
}

export function makeWorld(word: string, best = 0): World {
  const { bodies, minX, maxX, minY } = layoutWord(word)
  const home = restSpot(bodies)
  return {
    bodies,
    bx: home.x,
    by: home.y,
    bvx: 0,
    bvy: 0,
    alive: true,
    fade: 1,
    t: 0,
    respawnAt: 0,
    restTime: 0,
    touching: false,
    score: 0,
    best,
    cradle: home,
    walls: { l: minX - 40, r: maxX + 40, t: minY - 600, b: 60 },
    wobble: true,
    ghost: { active: false, taps: 0, plan: 6, idle: 0, cycle: 0, aim: 0 },
  }
}

/** Nearest point to (px, py) on segment a-b. */
export function closest(px: number, py: number, ax: number, ay: number, bx: number, by: number): Pt {
  const ex = bx - ax
  const ey = by - ay
  const l2 = ex * ex + ey * ey
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * ex + (py - ay) * ey) / l2)) : 0
  return P(ax + ex * t, ay + ey * t)
}

/** Body-local point to world, and back. */
export function toWorld(b: Body, p: Pt): Pt {
  const c = Math.cos(b.th)
  const s = Math.sin(b.th)
  const x = p.x - b.pivot.x
  const y = p.y - b.pivot.y
  return P(b.pivot.x + b.dx + x * c - y * s, b.pivot.y + b.dy + x * s + y * c)
}

export function toLocal(b: Body, p: Pt): Pt {
  const c = Math.cos(b.th)
  const s = Math.sin(b.th)
  const x = p.x - b.pivot.x - b.dx
  const y = p.y - b.pivot.y - b.dy
  return P(b.pivot.x + x * c + y * s, b.pivot.y - x * s + y * c)
}

/** Knock the ball up. (px, py) is where it was hit; off-centre hits send it sideways. */
export function tap(w: World, px: number, py: number): boolean {
  if (!w.alive) return false
  const up = Math.min(1400, TAP_SPEED + 0.35 * Math.max(0, w.bvy))
  const side = Math.max(-1.6, Math.min(1.6, (w.bx - px) / BALL_R))
  w.bvy = -up
  w.bvx = w.bvx * 0.6 + side * 260
  w.by = Math.min(w.by, py + BALL_R) - 1
  w.restTime = 0
  w.score += 1
  return true
}

export function hitsBall(w: World, px: number, py: number, slop: number): boolean {
  return w.alive && Math.hypot(px - w.bx, py - w.by) <= BALL_R + slop
}

function collide(w: World, b: Body): boolean {
  const reach = BALL_R + STROKE / 2
  const lp = toLocal(b, P(w.bx, w.by))
  if (lp.x < b.minX - reach || lp.x > b.maxX + reach || lp.y < b.minY - reach || lp.y > b.maxY + reach) return false
  let best = Infinity
  let bc = lp
  for (const s of b.strokes) {
    for (let i = 0; i < s.length - 1; i++) {
      const c = closest(lp.x, lp.y, s[i].x, s[i].y, s[i + 1].x, s[i + 1].y)
      const d = (lp.x - c.x) * (lp.x - c.x) + (lp.y - c.y) * (lp.y - c.y)
      if (d < best) {
        best = d
        bc = c
      }
    }
  }
  const d = Math.sqrt(best)
  if (d >= reach) return false
  const cs = Math.cos(b.th)
  const sn = Math.sin(b.th)
  const nlx = d > 1e-6 ? (lp.x - bc.x) / d : 0
  const nly = d > 1e-6 ? (lp.y - bc.y) / d : -1
  const nx = nlx * cs - nly * sn
  const ny = nlx * sn + nly * cs
  const pen = reach - d
  w.bx += nx * pen
  w.by += ny * pen
  // contact point on the stroke surface, lever arm from the pivot
  const cw = toWorld(b, bc)
  const rx = cw.x + nx * (STROKE / 2) - (b.pivot.x + b.dx)
  const ry = cw.y + ny * (STROKE / 2) - (b.pivot.y + b.dy)
  const free = w.wobble ? 1 : 0
  const gvx = (b.vx - b.w * ry) * free
  const gvy = (b.vy + b.w * rx) * free
  const relx = w.bvx - gvx
  const rely = w.bvy - gvy
  const vn = relx * nx + rely * ny
  if (vn < 0) {
    const rn = rx * ny - ry * nx
    const inv = 1 + free * (1 / MASS + (rn * rn) / INERTIA)
    const e = vn < -90 ? LETTER_E : 0
    const j = (-(1 + e) * vn) / inv
    w.bvx += j * nx
    w.bvy += j * ny
    if (free) {
      b.vx -= (j * nx) / MASS
      b.vy -= (j * ny) / MASS
      b.w -= (rn * j) / INERTIA
    }
    // friction along the stroke
    const tx = -ny
    const ty = nx
    const vt = relx * tx + rely * ty
    const rt = rx * ty - ry * tx
    const invT = 1 + free * (1 / MASS + (rt * rt) / INERTIA)
    const jt = Math.max(-FRICTION * j, Math.min(FRICTION * j, -vt / invT))
    w.bvx += jt * tx
    w.bvy += jt * ty
    if (free) {
      b.vx -= (jt * tx) / MASS
      b.vy -= (jt * ty) / MASS
      b.w -= (rt * jt) / INERTIA
    }
  }
  return true
}

/** Advance the world by dt seconds (call with small steps, about 1/240 s). */
export function step(w: World, dt: number): void {
  w.t += dt
  for (const b of w.bodies) {
    if (!w.wobble) {
      b.th = b.w = b.dx = b.dy = b.vx = b.vy = 0
      continue
    }
    b.w += ((-ANG_K * b.th - ANG_C * b.w) / INERTIA) * dt
    b.th = Math.max(-MAX_TH, Math.min(MAX_TH, b.th + b.w * dt))
    b.vx += ((-LIN_K * b.dx - LIN_C * b.vx) / MASS) * dt
    b.vy += ((-LIN_K * b.dy - LIN_C * b.vy) / MASS) * dt
    b.dx += b.vx * dt
    b.dy += b.vy * dt
  }
  if (!w.alive) {
    if (w.t >= w.respawnAt) {
      w.alive = true
      w.fade = 0
      w.restTime = 0
      if (w.wobble) {
        w.bx = w.cradle.x + 50
        w.by = w.cradle.y - 360
        w.bvx = -40
      } else {
        w.bx = w.cradle.x
        w.by = w.cradle.y
        w.bvx = 0
      }
      w.bvy = 0
    }
    return
  }
  w.fade = Math.min(1, w.fade + dt / 0.12)
  w.bvy += GRAVITY * dt
  w.bx += w.bvx * dt
  w.by += w.bvy * dt
  const { l, r, t, b } = w.walls
  if (w.bx < l + BALL_R) {
    w.bx = l + BALL_R
    w.bvx = Math.abs(w.bvx) * WALL_E
  } else if (w.bx > r - BALL_R) {
    w.bx = r - BALL_R
    w.bvx = -Math.abs(w.bvx) * WALL_E
  }
  if (w.by < t + BALL_R) {
    w.by = t + BALL_R
    w.bvy = Math.abs(w.bvy) * WALL_E
  }
  if (w.by - BALL_R > b) {
    w.alive = false
    w.respawnAt = w.t + 0.9
    w.score = 0
    w.ghost.active = false
    return
  }
  let touching = false
  for (const body of w.bodies) if (collide(w, body)) touching = true
  w.touching = touching
  const speed = Math.hypot(w.bvx, w.bvy)
  if (touching && speed < 40) {
    w.restTime += dt
    if (w.restTime > 0.35) w.score = 0
  } else if (speed > 80) {
    w.restTime = 0
  }
}

/** The ghost player: after `wait` idle seconds at rest it rallies a few taps across the word. Returns true when it tapped. */
export function ghost(w: World, dt: number, wait: number): boolean {
  const g = w.ghost
  g.idle += dt
  if (!g.active) {
    if (g.idle > wait && w.alive && w.restTime > 0.3) {
      g.active = true
      g.taps = 0
      g.plan = 5 + (g.cycle % 3)
      g.cycle++
    } else return false
  }
  if (!w.alive) {
    g.active = false
    return false
  }
  const first = g.taps === 0
  const falling = w.bvy > 0 && w.by > -300
  if (!first && !falling) return false
  const bodies = w.bodies
  const target = bodies.length ? bodies[(g.aim++ * 3 + 1) % bodies.length] : null
  const tx = target ? (target.minX + target.maxX) / 2 : w.bx
  tap(w, w.bx, w.by + BALL_R)
  w.bvx = Math.max(-480, Math.min(480, (tx - w.bx) / 1.3))
  g.taps++
  if (g.taps >= g.plan) {
    g.active = false
    g.idle = 0
  }
  return true
}
// #endregion

const DEFAULT_LINKS: RallyLink[] = [
  { label: "Work", href: "#" },
  { label: "Components", href: "#" },
  { label: "Templates", href: "#" },
  { label: "Notes", href: "#" },
  { label: "About", href: "#" },
]

const DEFAULT_LEGAL: RallyLink[] = [
  { label: "Client 1", href: "#" },
  { label: "Client 2", href: "#" },
  { label: "Client 3", href: "#" },
]

const DEFAULT_SOCIALS: RallyLink[] = [
  { label: "GitHub", href: "#" },
  { label: "X", href: "#" },
  { label: "LinkedIn", href: "#" },
]

const CSS =
  ".rwf-root{position:relative;width:100%;isolation:isolate;overflow:hidden;container-type:inline-size;display:flex;flex-direction:column;justify-content:space-between;background:var(--color-background);color:var(--color-foreground);font-family:inherit;-webkit-tap-highlight-color:transparent}" +
  ".rwf-canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0}" +
  ".rwf-top{position:relative;z-index:1;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:clamp(12px,1.25cqw,24px);row-gap:20px}" +
  ".rwf-intro{display:flex;flex-direction:column;gap:clamp(10px,1cqw,18px);min-width:0}" +
  ".rwf-h{margin:0;font-size:clamp(19px,1.62cqw,30px);line-height:1.22;font-weight:400;letter-spacing:-0.01em}" +
  ".rwf-h span{display:block}" +
  ".rwf-sub{color:var(--color-muted-foreground)}" +
  ".rwf-form{display:flex;align-items:center;width:min(100%,max(260px,23cqw));height:clamp(36px,2.4cqw,44px);border-radius:999px;background:color-mix(in srgb,var(--color-foreground) 7%,transparent);padding:0 4px 0 14px;box-sizing:border-box}" +
  ".rwf-input{flex:1;min-width:0;border:0;background:transparent;color:inherit;font:inherit;font-size:clamp(12px,0.78cqw,14px);outline:none;padding:0}" +
  ".rwf-input::placeholder{color:var(--color-muted-foreground)}" +
  ".rwf-send{flex:none;width:clamp(28px,1.8cqw,34px);height:clamp(28px,1.8cqw,34px);border-radius:999px;border:0;background:var(--color-foreground);color:var(--color-background);display:grid;place-items:center;cursor:pointer;padding:0}" +
  ".rwf-send:focus-visible,.rwf-a:focus-visible,.rwf-input:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}" +
  ".rwf-col{display:flex;flex-direction:column;gap:3px;min-width:0;font-size:clamp(12px,0.78cqw,14px);line-height:1.35}" +
  ".rwf-col+.rwf-col{padding-left:2px}" +
  ".rwf-gap{height:clamp(10px,0.9cqw,16px)}" +
  ".rwf-a{color:inherit;text-decoration:none;width:max-content;max-width:100%;overflow-wrap:anywhere;border-radius:2px}" +
  ".rwf-a:hover{text-decoration:underline;text-underline-offset:2px}" +
  ".rwf-m{color:var(--color-muted-foreground)}" +
  ".rwf-bar{position:relative;z-index:1;display:flex;justify-content:flex-end;align-items:baseline;gap:12px;padding:0 clamp(12px,1.25cqw,24px) clamp(8px,0.8cqw,14px);font-size:clamp(11px,0.7cqw,13px);color:var(--color-muted-foreground);pointer-events:none;font-variant-numeric:tabular-nums}" +
  ".rwf-bar b{font-weight:500;color:var(--color-foreground)}" +
  ".rwf-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}" +
  ".rwf-sr:focus-visible{position:absolute;z-index:2;left:clamp(12px,1.25cqw,24px);bottom:clamp(8px,0.8cqw,14px);width:auto;height:auto;margin:0;clip:auto;overflow:visible;padding:6px 12px;border-radius:999px;background:var(--color-foreground);color:var(--color-background);font:inherit;font-size:13px;outline:2px solid var(--color-primary);outline-offset:2px}" +
  "@container (max-width:760px){.rwf-top{grid-template-columns:1fr 1fr;column-gap:16px}.rwf-intro{grid-column:1/-1}.rwf-contact{grid-column:1/-1}}" +
  "@container (max-width:460px){.rwf-bar{flex-wrap:wrap;justify-content:flex-start;row-gap:2px}}"

const STORE = "rally-wordmark-footer:best"

function readBest(): number {
  try {
    const v = Number(window.localStorage.getItem(STORE))
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0
  } catch {
    return 0
  }
}

function writeBest(v: number) {
  try {
    window.localStorage.setItem(STORE, String(v))
  } catch {
    /* storage blocked: best lasts for the visit */
  }
}

export default function RallyWordmarkFooter({
  word = "hello",
  headline = "Building interfaces that move.",
  subline = "Notes on components and motion, once a month.",
  email = "kedhareswer.12110626@gmail.com",
  contactLines = ["Remote, from India", "Open to new projects"],
  links = DEFAULT_LINKS,
  legalLinks = DEFAULT_LEGAL,
  socials = DEFAULT_SOCIALS,
  copyright = ["© 2026 Kedhareswer", "All rights reserved"],
  hint = "Keep the ball up · tap it",
  ballColor = "#e2321b",
  autoPlay = true,
  onSubscribe,
  height = "100svh",
  className,
  style,
}: RallyWordmarkFooterProps) {
  const rootRef = useRef(null as HTMLElement | null)
  const canvasRef = useRef(null as HTMLCanvasElement | null)
  const topRef = useRef(null as HTMLDivElement | null)
  const barRef = useRef(null as HTMLDivElement | null)
  const worldRef = useRef(null as World | null)
  const viewRef = useRef({ s: 1, ox: 0, oy: 0 })
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const stored = readBest()
    setBest(stored)
    const world = makeWorld(word, stored)
    worldRef.current = world
    const extent = layoutWord(word)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    world.wobble = !reduce.matches

    let W = 0
    let H = 0
    let dpr = 1
    const layout = () => {
      const r = root.getBoundingClientRect()
      W = r.width
      H = r.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(W * dpr))
      canvas.height = Math.max(1, Math.round(H * dpr))
      const topBottom = topRef.current ? topRef.current.getBoundingClientRect().bottom - r.top : 0
      const barH = barRef.current ? barRef.current.getBoundingClientRect().height : 0
      const inkW = extent.maxX - extent.minX
      const inkH = extent.maxY - extent.minY
      const bottom = Math.max(barH + 14, W * 0.022)
      const room = H - topBottom - bottom - Math.max(24, W * 0.03)
      const s = Math.max(0.05, Math.min((W * 0.903) / inkW, room / inkH))
      const ox = (W - inkW * s) / 2 - extent.minX * s
      const oy = H - bottom - extent.maxY * s
      viewRef.current = { s, ox, oy }
      world.walls = { l: -ox / s, r: (W - ox) / s, t: -oy / s, b: (H - oy) / s }
    }
    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(root)

    let ink = "#111"
    const readInk = () => {
      ink = getComputedStyle(root).color || ink
    }
    readInk()

    const draw = () => {
      const { s, ox, oy } = viewRef.current
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy)
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.lineWidth = STROKE
      ctx.strokeStyle = ink
      for (const b of world.bodies) {
        ctx.save()
        ctx.translate(b.pivot.x + b.dx, b.pivot.y + b.dy)
        ctx.rotate(b.th)
        ctx.translate(-b.pivot.x, -b.pivot.y)
        ctx.beginPath()
        for (const st of b.strokes) {
          ctx.moveTo(st[0].x, st[0].y)
          for (let i = 1; i < st.length; i++) ctx.lineTo(st[i].x, st[i].y)
        }
        ctx.stroke()
        ctx.restore()
      }
      if (world.alive) {
        ctx.globalAlpha = world.fade
        ctx.fillStyle = ballColor
        ctx.beginPath()
        ctx.arc(world.bx, world.by, BALL_R, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    let visible = true
    const io = new IntersectionObserver((e) => {
      visible = e.some((x) => x.isIntersecting)
    })
    io.observe(root)

    let shown = -1
    let shownBest = stored
    let last = performance.now()
    let acc = 0
    let frames = 0
    let raf = 0
    const H_STEP = 1 / 240
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible || document.hidden) return
      world.wobble = !reduce.matches
      acc += dt
      while (acc >= H_STEP) {
        if (autoPlay && !reduce.matches) ghost(world, H_STEP, 2.4)
        step(world, H_STEP)
        acc -= H_STEP
      }
      if (++frames % 30 === 0) readInk()
      draw()
      if (world.score !== shown) {
        shown = world.score
        setScore(shown)
      }
      if (world.best !== shownBest) {
        shownBest = world.best
        setBest(shownBest)
        writeBest(shownBest)
      }
    }
    raf = requestAnimationFrame(loop)

    const toWorldPt = (e: PointerEvent): Pt => {
      const r = root.getBoundingClientRect()
      const { s, ox, oy } = viewRef.current
      return { x: (e.clientX - r.left - ox) / s, y: (e.clientY - r.top - oy) / s }
    }
    const slop = () => Math.max(BALL_R * 1.2, 22 / viewRef.current.s)
    const userTap = (p: Pt) => {
      world.ghost.active = false
      world.ghost.idle = 0
      if (tap(world, p.x, p.y) && world.score > world.best) world.best = world.score
    }
    const onDown = (e: PointerEvent) => {
      world.ghost.idle = 0
      const t = e.target as HTMLElement | null
      if (t && t.closest("a,button,input,label,form")) return
      const p = toWorldPt(e)
      if (hitsBall(world, p.x, p.y, slop())) {
        e.preventDefault()
        userTap(p)
      }
    }
    const onMove = (e: PointerEvent) => {
      const p = toWorldPt(e)
      const over = hitsBall(world, p.x, p.y, slop())
      if (over) {
        world.ghost.idle = 0
        world.ghost.active = false
      }
      root.style.cursor = over ? "pointer" : ""
    }
    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointermove", onMove)
    const onKeyTap = () => userTap({ x: world.bx, y: world.by + BALL_R })
    root.addEventListener("rally-tap", onKeyTap)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("rally-tap", onKeyTap)
    }
  }, [word, ballColor, autoPlay])

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = e.currentTarget.elements.namedItem("email") as HTMLInputElement | null
    const value = input ? input.value.trim() : ""
    if (!value) return
    if (onSubscribe) onSubscribe(value)
    if (input) input.value = ""
    setSent(true)
  }

  return (
    <footer
      ref={rootRef}
      className={"rwf-root" + (className ? " " + className : "")}
      style={{ minHeight: height, ...style }}
    >
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="rwf-canvas" role="img" aria-label={word} />
      <div ref={topRef} className="rwf-top">
        <div className="rwf-intro">
          <p className="rwf-h">
            <span>{headline}</span>
            <span className="rwf-sub">{subline}</span>
          </p>
          <form className="rwf-form" onSubmit={submit}>
            <input
              className="rwf-input"
              type="email"
              name="email"
              required
              aria-label="Email address"
              placeholder={sent ? "Thanks, you're on the list" : "Your email address"}
            />
            <button className="rwf-send" type="submit" aria-label="Subscribe">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
        <div className="rwf-col rwf-contact">
          <a className="rwf-a" href={"mailto:" + email}>
            {email}
          </a>
          {contactLines.map((l) => (
            <span key={l} className="rwf-m">
              {l}
            </span>
          ))}
        </div>
        <nav className="rwf-col" aria-label="Footer">
          {links.map((l) => (
            <a key={l.label} className="rwf-a" href={l.href}>
              {l.label}
            </a>
          ))}
          {legalLinks.length > 0 && <span className="rwf-gap" aria-hidden="true" />}
          {legalLinks.map((l) => (
            <a key={l.label} className="rwf-a rwf-m" href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="rwf-col">
          {socials.map((l) => (
            <a key={l.label} className="rwf-a" href={l.href}>
              {l.label}
            </a>
          ))}
          {copyright.length > 0 && <span className="rwf-gap" aria-hidden="true" />}
          {copyright.map((l) => (
            <span key={l} className="rwf-m">
              {l}
            </span>
          ))}
        </div>
      </div>
      <div ref={barRef} className="rwf-bar">
        <span>{hint}</span>
        <span>
          Score <b>{score}</b>
        </span>
        <span>
          Best <b>{best}</b>
        </span>
      </div>
      <button
        type="button"
        className="rwf-sr"
        onClick={() => rootRef.current && rootRef.current.dispatchEvent(new Event("rally-tap"))}
      >
        Tap the ball
      </button>
    </footer>
  )
}
