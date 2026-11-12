"use client"

import * as React from "react"
import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"

export type EyeletCurtainTearProps = {
  /** Base colour of the cloth */
  fabricColor?: string
  /** Colour of the satin-stitch rims around every eyelet */
  threadColor?: string
  /** Sun position over the window, as fractions of the stage (0..1) */
  sunX?: number
  sunY?: number
  /** Multiplier on how far a thread stretches before it snaps. 1 tears under a firm yank. */
  tearResistance?: number
  /** Breeze strength. 0 hangs still. */
  wind?: number
  /** Photo for the window behind the curtain. It's defocused like a lens would, and its highlights bloom through the eyelets. Defaults to a painted garden window. */
  backdropSrc?: string
  /** Hint pill. Empty string hides it. */
  caption?: string
  /** Fired once the cloth is off the rod */
  onTornDown?: () => void
  /** Root height — a definite length, never a percentage */
  height?: string
  className?: string
}

const CSS =
  ".ect-root{position:relative;overflow:hidden;width:100%;isolation:isolate;background:#1b1712;color:var(--color-foreground)}" +
  ".ect-stage{position:absolute;inset:0;z-index:1}" +
  ".ect-canvas{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;touch-action:none}" +
  ".ect-fallback{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block}" +
  ".ect-vignette{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(ellipse at 60% 35%,rgba(0,0,0,0) 50%,rgba(12,9,6,.38) 100%)}" +
  ".ect-rod{position:absolute;left:0;right:0;top:0;height:14px;z-index:3;pointer-events:none;background:linear-gradient(180deg,#14110d 0,#4a4135 45%,#8d7d64 55%,#2a241c 100%);box-shadow:0 4px 12px rgba(0,0,0,.45)}" +
  ".ect-ui{position:absolute;left:16px;right:16px;bottom:16px;z-index:4;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;pointer-events:none}" +
  ".ect-pill{font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;padding:8px 12px;border-radius:9999px;border:1px solid var(--color-border);background:var(--color-background);color:var(--color-muted-foreground);opacity:.88;max-width:60%}" +
  ".ect-btn{pointer-events:auto;cursor:pointer;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.02em;padding:11px 16px;border-radius:9999px;border:1px solid var(--color-border);background:var(--color-foreground);color:var(--color-background);transition:transform .2s ease,opacity .2s ease}" +
  ".ect-btn:hover{transform:translateY(-1px)}" +
  ".ect-btn:focus-visible{outline:2px solid var(--color-primary);outline-offset:3px}" +
  ".ect-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
  "@media (hover:hover) and (pointer:fine){.ect-canvas{cursor:grab}.ect-dragging .ect-canvas{cursor:grabbing}}" +
  "@media (prefers-reduced-motion:reduce){.ect-btn{transition:none}.ect-btn:hover{transform:none}}"

// #region cloth
// Verlet cloth in stage pixels: origin at the stage centre, y up, z toward the viewer.
// Particles sit on a cols x rows grid; the top row is pinned to the rod. Structural
// threads snap past `tear` x rest length, and a snapped thread takes the cells on both
// sides with it, so tears read as ragged holes rather than hairline cuts.

export type Cloth = {
  cols: number
  rows: number
  pos: Float32Array
  prev: Float32Array
  uv: Float32Array
  pinned: Uint8Array
  frozen: Uint8Array
  held: Uint8Array
  ca: Uint32Array
  cb: Uint32Array
  rest: Float32Array
  tough: Float32Array
  calive: Uint8Array
  cq1: Int32Array
  cq2: Int32Array
  qalive: Uint8Array
  qedge: Int32Array
  grab: number[]
  grabOff: number[]
  target: number[]
  hand: number[]
  floorY: number
  dirty: boolean
  broken: number
}

export function makeCloth(W: number, H: number, top = 14, cell = 17): Cloth {
  const cols = Math.max(24, Math.min(84, Math.round(W / cell)))
  const len = (H - top) * 0.985
  const rows = Math.max(22, Math.min(60, Math.round(len / cell)))
  const n = cols * rows
  const pos = new Float32Array(n * 3)
  const uv = new Float32Array(n * 2)
  const pinned = new Uint8Array(n)
  const dx = (W * 1.04) / (cols - 1)
  const dy = len / (rows - 1)
  const pleatAmp = 26
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i
      pos[k * 3] = -W * 0.52 + i * dx
      pos[k * 3 + 1] = H / 2 - top - j * dy
      // irregular pleats: two beating frequencies, deepest at the rod, relaxing toward the hem
      const u = i * dx
      const pl = Math.sin(u * 0.052 + 0.6) * 0.65 + Math.sin(u * 0.019 + 2.1) * 0.55 + Math.sin(u * 0.11 + 4.3) * 0.3 + Math.sin(u * 0.031 + 5.2) * 0.35
      pos[k * 3 + 2] = pl * pleatAmp * (1 - (j / rows) * 0.5)
      uv[k * 2] = i / (cols - 1)
      uv[k * 2 + 1] = 1 - j / (rows - 1)
      if (j === 0) pinned[k] = 1
    }
  }
  const nh = (cols - 1) * rows
  const nv = cols * (rows - 1)
  const nc = nh + nv
  const qc = cols - 1
  const nq = (cols - 1) * (rows - 1)
  const ca = new Uint32Array(nc)
  const cb = new Uint32Array(nc)
  const rest = new Float32Array(nc)
  const cq1 = new Int32Array(nc).fill(-1)
  const cq2 = new Int32Array(nc).fill(-1)
  const qedge = new Int32Array(nq * 4)
  const hId = (i: number, j: number) => j * (cols - 1) + i
  const vId = (i: number, j: number) => nh + j * cols + i
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols - 1; i++) {
      const c = hId(i, j)
      ca[c] = j * cols + i
      cb[c] = j * cols + i + 1
      if (j > 0) cq1[c] = (j - 1) * qc + i
      if (j < rows - 1) cq2[c] = j * qc + i
    }
  for (let j = 0; j < rows - 1; j++)
    for (let i = 0; i < cols; i++) {
      const c = vId(i, j)
      ca[c] = j * cols + i
      cb[c] = (j + 1) * cols + i
      if (i > 0) cq1[c] = j * qc + i - 1
      if (i < cols - 1) cq2[c] = j * qc + i
    }
  for (let j = 0; j < rows - 1; j++)
    for (let i = 0; i < cols - 1; i++) {
      const q = j * qc + i
      qedge[q * 4] = hId(i, j)
      qedge[q * 4 + 1] = hId(i, j + 1)
      qedge[q * 4 + 2] = vId(i, j)
      qedge[q * 4 + 3] = vId(i + 1, j)
    }
  // every gram of cloth hangs off the top rows, so those threads are hemmed tougher:
  // a yank tears the field, it doesn't unzip the curtain along the rod
  const tough = new Float32Array(nc)
  for (let c = 0; c < nc; c++) tough[c] = Math.floor(ca[c] / cols) < 3 ? 2 : 1
  for (let c = 0; c < nc; c++) {
    const a = ca[c] * 3
    const b = cb[c] * 3
    rest[c] = Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2])
  }
  return {
    cols, rows, pos, prev: pos.slice(), uv, pinned, frozen: new Uint8Array(n), held: new Uint8Array(n),
    ca, cb, rest, tough, calive: new Uint8Array(nc).fill(1), cq1, cq2,
    qalive: new Uint8Array(nq).fill(1), qedge,
    grab: [], grabOff: [], target: [0, 0, 0], hand: [0, 0, 0], floorY: -H * 1.6, dirty: true, broken: 0,
  }
}

function killQuad(c: Cloth, q: number) {
  if (q < 0 || !c.qalive[q]) return
  c.qalive[q] = 0
  c.dirty = true
  for (let e = 0; e < 4; e++) {
    const k = c.qedge[q * 4 + e]
    const other = c.cq1[k] === q ? c.cq2[k] : c.cq1[k]
    if (other < 0 || !c.qalive[other]) c.calive[k] = 0
  }
}

export function breakThread(c: Cloth, k: number) {
  if (!c.calive[k]) return
  c.calive[k] = 0
  c.broken++
  // a rip, not a punch: only one side of the thread goes, so tears open as slits
  // and the cloth either side hangs as flaps. Which side is a fixed per-thread coin.
  const a = c.cq1[k], b = c.cq2[k]
  killQuad(c, a < 0 ? b : b < 0 ? a : (Math.imul(k, 2654435761) >>> 0) & 1 ? a : b)
}

/** Snap the thread under rod loop i — what "Pull it down" does, one loop at a time. */
export function releaseLoop(c: Cloth, i: number) {
  breakThread(c, (c.cols - 1) * c.rows + i)
}

export type StepEnv = { dt: number; t: number; gravity: number; wind: number; tear: number; iters: number }

export function stepCloth(c: Cloth, env: StepEnv) {
  const { pos, prev, pinned, frozen } = c
  const n = c.cols * c.rows
  const dt2 = env.dt * env.dt
  const damp = 0.985
  for (let k = 0; k < n; k++) {
    if (pinned[k] || frozen[k]) continue
    const p = k * 3
    const x = pos[p], y = pos[p + 1], z = pos[p + 2]
    let ax = 0, az = 0
    if (env.wind) {
      const g = Math.sin(env.t * 1.3 + x * 0.008 + y * 0.004) * 0.6 + Math.sin(env.t * 0.7 - x * 0.013 + 1.7) * 0.4
      az = env.wind * (g * 0.8 + 0.35) * 520
      ax = env.wind * g * 90
    }
    pos[p] = x + (x - prev[p]) * damp + ax * dt2
    pos[p + 1] = y + (y - prev[p + 1]) * damp - env.gravity * dt2
    pos[p + 2] = z + (z - prev[p + 2]) * damp + az * dt2
    prev[p] = x
    prev[p + 1] = y
    prev[p + 2] = z
    if (pos[p + 1] < c.floorY) frozen[k] = 1
  }
  // the hand chases the pointer at a capped speed, so a dropped frame or a flick
  // drags the cloth hard instead of teleporting a patch of it across the stage
  if (c.grab.length) {
    const max = 1300 * env.dt
    for (let i = 0; i < 3; i++) {
      const d = c.target[i] - c.hand[i]
      c.hand[i] += Math.max(-max, Math.min(max, d))
    }
  }
  const lim = env.tear
  for (let it = 0; it < env.iters; it++) {
    pinGrab(c)
    for (let k = 0; k < c.ca.length; k++) {
      if (!c.calive[k]) continue
      const a = c.ca[k], b = c.cb[k]
      const ia = a * 3, ib = b * 3
      const dx = pos[ib] - pos[ia], dy = pos[ib + 1] - pos[ia + 1], dz = pos[ib + 2] - pos[ia + 2]
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6
      const r = c.rest[k]
      // the patch in your hand doesn't come away: the cloth gives somewhere else, so
      // a pull opens a rip above and drags a flap down with it
      if (d > r * lim * c.tough[k] * (c.held[a] || c.held[b] ? 3 : 1)) {
        breakThread(c, k)
        continue
      }
      const wa = pinned[a] || frozen[a] ? 0 : 1
      const wb = pinned[b] || frozen[b] ? 0 : 1
      const w = wa + wb
      if (!w) continue
      const s = (d - r) / d / w
      pos[ia] += dx * s * wa; pos[ia + 1] += dy * s * wa; pos[ia + 2] += dz * s * wa
      pos[ib] -= dx * s * wb; pos[ib + 1] -= dy * s * wb; pos[ib + 2] -= dz * s * wb
    }
  }
  pinGrab(c)
  // a surviving cell along a snapped thread must not stretch like rubber: once that
  // gap opens past the tear limit too, the cell goes as well
  for (let k = 0; k < c.ca.length; k++) {
    if (c.calive[k]) continue
    const q1 = c.cq1[k], q2 = c.cq2[k]
    if (!((q1 >= 0 && c.qalive[q1]) || (q2 >= 0 && c.qalive[q2]))) continue
    const ia = c.ca[k] * 3, ib = c.cb[k] * 3
    const d = Math.hypot(pos[ib] - pos[ia], pos[ib + 1] - pos[ia + 1], pos[ib + 2] - pos[ia + 2])
    if (d > c.rest[k] * lim * 1.15 * c.tough[k]) {
      killQuad(c, q1)
      killQuad(c, q2)
    }
  }
  // the window glass sits just behind the rod: cloth can't billow through it
  for (let k = 0; k < n; k++) {
    const p = k * 3 + 2
    if (pos[p] < -36) { pos[p] = -36; prev[p] = -36 }
  }
}

function pinGrab(c: Cloth) {
  const g = c.grab
  for (let m = 0; m < g.length; m++) {
    const p = g[m] * 3
    c.pos[p] = c.hand[0] + c.grabOff[m * 2]
    c.pos[p + 1] = c.hand[1] + c.grabOff[m * 2 + 1]
    c.pos[p + 2] = c.hand[2]
  }
}

/** Grab every free particle within r of (x, y). Returns how many were taken. */
export function grabAt(c: Cloth, x: number, y: number, r: number) {
  c.grab = []
  c.grabOff = []
  c.held.fill(0)
  const n = c.cols * c.rows
  for (let k = 0; k < n; k++) {
    if (c.pinned[k] || c.frozen[k]) continue
    const dx = c.pos[k * 3] - x, dy = c.pos[k * 3 + 1] - y
    if (dx * dx + dy * dy < r * r && hasCell(c, k)) {
      c.grab.push(k)
      c.held[k] = 1
      c.grabOff.push(dx * 0.5, dy * 0.5)
    }
  }
  c.target = [x, y, 34]
  c.hand = [x, y, 34]
  return c.grab.length
}

export function moveGrab(c: Cloth, x: number, y: number) {
  c.target = [x, y, 34]
}

export function letGo(c: Cloth) {
  c.held.fill(0)
  c.grab = []
  c.grabOff = []
}

function hasCell(c: Cloth, k: number) {
  const i = k % c.cols, j = (k / c.cols) | 0, qc = c.cols - 1
  for (const [qi, qj] of [[i - 1, j - 1], [i, j - 1], [i - 1, j], [i, j]])
    if (qi >= 0 && qj >= 0 && qi < qc && qj < c.rows - 1 && c.qalive[qj * qc + qi]) return true
  return false
}

/** Two triangles per surviving cell. Returns the index count. */
export function buildIndex(c: Cloth, out: Uint32Array) {
  let m = 0
  const qc = c.cols - 1
  for (let q = 0; q < c.qalive.length; q++) {
    if (!c.qalive[q]) continue
    const i = q % qc, j = (q / qc) | 0
    const a = j * c.cols + i, b = a + 1, d = a + c.cols, e = d + 1
    out[m++] = a; out[m++] = d; out[m++] = b
    out[m++] = b; out[m++] = d; out[m++] = e
  }
  return m
}

/** Share of free particles still hanging from the rod through intact threads. */
export function attachedFraction(c: Cloth) {
  const n = c.cols * c.rows
  const adj: number[][] = Array.from({ length: n }, () => [])
  for (let k = 0; k < c.ca.length; k++) {
    if (!c.calive[k]) continue
    adj[c.ca[k]].push(c.cb[k])
    adj[c.cb[k]].push(c.ca[k])
  }
  const seen = new Uint8Array(n)
  const stack: number[] = []
  for (let k = 0; k < n; k++) if (c.pinned[k]) { seen[k] = 1; stack.push(k) }
  while (stack.length) {
    const k = stack.pop() as number
    for (const o of adj[k]) if (!seen[o]) { seen[o] = 1; stack.push(o) }
  }
  let free = 0, held = 0
  for (let k = 0; k < n; k++) {
    if (c.pinned[k]) continue
    free++
    if (seen[k]) held++
  }
  return free ? held / free : 0
}

/** Smooth-ish normals straight off the grid — cheaper than a per-triangle pass. */
export function gridNormals(c: Cloth, out: Float32Array) {
  const { cols, rows, pos } = c
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const l = (j * cols + Math.max(0, i - 1)) * 3
      const r = (j * cols + Math.min(cols - 1, i + 1)) * 3
      const u = (Math.max(0, j - 1) * cols + i) * 3
      const d = (Math.min(rows - 1, j + 1) * cols + i) * 3
      const ax = pos[r] - pos[l], ay = pos[r + 1] - pos[l + 1], az = pos[r + 2] - pos[l + 2]
      const bx = pos[u] - pos[d], by = pos[u + 1] - pos[d + 1], bz = pos[u + 2] - pos[d + 2]
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx
      const s = Math.hypot(nx, ny, nz) || 1
      const o = (j * cols + i) * 3
      out[o] = nx / s; out[o + 1] = ny / s; out[o + 2] = nz / s
    }
  }
}
// #endregion

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// The cloth texture, in two canvases. `cloth` is the woven ground with every eyelet cut
// out (alpha 0), so the real window shows through; `halo` is the same perforation mask
// blurred, which the shader uses for the glow that bleeds round each backlit hole.
// Motifs carry small seeded jitter in place, size and turn — hand cutwork, not a print.
function paintFabric(w: number, h: number, fabric: string, thread: string) {
  const mk = () => {
    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    return c
  }
  const cloth = mk()
  const halo = mk()
  const g = cloth.getContext("2d")
  const hg = halo.getContext("2d")
  if (!g || !hg) return { cloth, halo }
  const r = rng(11)
  const k = Math.max(1, w / 1400)

  // ground: base, slow mottling (uneven density), then loose threads both ways
  g.fillStyle = fabric
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 70; i++) {
    const x = r() * w, y = r() * h, rad = (60 + r() * 220) * k
    const grd = g.createRadialGradient(x, y, 0, x, y, rad)
    const light = r() < 0.5
    grd.addColorStop(0, light ? "rgba(255,240,215,0.07)" : "rgba(20,12,4,0.08)")
    grd.addColorStop(1, "rgba(0,0,0,0)")
    g.fillStyle = grd
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  for (let x = 0; x < w; x += 1.1 + r() * 1.6) {
    g.globalAlpha = 0.015 + r() * 0.04
    g.fillStyle = r() < 0.55 ? "#fff3dc" : "#120b04"
    g.fillRect(x, 0, 0.5 + r() * 1.1, h)
  }
  for (let y = 0; y < h; y += 1.2 + r() * 1.8) {
    g.globalAlpha = 0.012 + r() * 0.03
    g.fillStyle = r() < 0.5 ? "#fff3dc" : "#120b04"
    g.fillRect(0, y, w, 0.5 + r() * 1)
  }
  g.globalAlpha = 0.09
  g.fillStyle = "#fff6e4"
  for (let i = 0; i < (w * h) / 1500; i++) g.fillRect(r() * w, r() * h, (3 + r() * 14) * k, 0.8)
  g.globalAlpha = 1

  const s = Math.max(80, Math.min(190, w / 5.6))
  const R = s * 0.135
  const holes = new Path2D()
  const sprig = new Path2D()
  const circ = (p: Path2D, x: number, y: number, rad: number) => {
    p.moveTo(x + rad, y)
    p.arc(x, y, rad, 0, Math.PI * 2)
  }
  const ell = (p: Path2D, x: number, y: number, rx: number, ry: number, rot: number) => {
    p.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot))
    p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
  }
  const jit = (v: number) => (r() - 0.5) * 2 * v
  const flower = (x0: number, y0: number, R0: number) => {
    const x = x0 + jit(R0 * 0.12), y = y0 + jit(R0 * 0.12), Rr = R0 * (0.86 + r() * 0.26)
    const n = 8 + Math.floor(r() * 3)
    const rot = jit(0.3)
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2
      const j = 0.85 + r() * 0.25
      ell(holes, x + Math.cos(a) * Rr * 0.6, y + Math.sin(a) * Rr * 0.6, Rr * 0.4 * j, Rr * 0.1 * j, a)
    }
    circ(holes, x, y, Rr * 0.12)
  }
  const ring = (x0: number, y0: number, R0: number) => {
    const x = x0 + jit(R0 * 0.1), y = y0 + jit(R0 * 0.1)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      circ(holes, x + Math.cos(a) * R0 * 0.85, y + Math.sin(a) * R0 * 0.85, R0 * (0.07 + r() * 0.03))
    }
    circ(holes, x, y, R0 * 0.12)
  }
  const diamond = (x: number, y: number, R0: number) => {
    const q = R0 * 0.36
    for (const [ox, oy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) circ(holes, x + ox * q + jit(1), y + oy * q + jit(1), R0 * 0.1)
  }
  const quad = (x: number, y: number, R0: number) => {
    const q = R0 * 0.26
    for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) holes.rect(x + ox * q * 0.75 - q / 2 + jit(0.6), y + oy * q * 0.75 - q / 2 + jit(0.6), q, q)
  }
  const fan = (x: number, y: number, R0: number) => {
    for (let i = -2; i <= 2; i++) {
      const a = -Math.PI / 2 + i * 0.38 + jit(0.05)
      ell(holes, x + Math.cos(a) * R0 * 0.55, y + Math.sin(a) * R0 * 0.55, R0 * 0.4, R0 * 0.09, a)
    }
  }
  const leaves = (x: number, y: number, R0: number, dir: number) => {
    // embroidered sprig beside a flower: thread only, no cut
    sprig.moveTo(x, y)
    sprig.quadraticCurveTo(x + dir * R0 * 1.2, y - R0 * 0.4, x + dir * R0 * 2.4, y - R0 * 0.1)
    for (let i = 1; i <= 3; i++) {
      const px = x + dir * R0 * 0.7 * i, py = y - R0 * 0.25
      sprig.moveTo(px, py)
      sprig.lineTo(px + dir * R0 * 0.25, py - R0 * 0.45)
      sprig.moveTo(px, py)
      sprig.lineTo(px + dir * R0 * 0.25, py + R0 * 0.3)
    }
  }
  const stitches = (x0: number, y0: number, x1: number, y1: number) => {
    const L = Math.hypot(x1 - x0, y1 - y0)
    const ux = (x1 - x0) / L, uy = (y1 - y0) / L
    for (let d = 0; d < L; ) {
      const len = (1.5 + r() * 2.5) * k
      const cx = x0 + ux * d + jit(0.4), cy = y0 + uy * d + jit(0.4)
      const wide = (0.9 + r() * 0.8) * k
      if (ux) holes.rect(cx, cy - wide / 2, len, wide)
      else holes.rect(cx - wide / 2, cy, wide, len)
      d += len + (1.6 + r() * 2.6) * k
    }
  }

  // field — ring row, flower row, sparse diamonds, quads; plenty of plain cloth between
  const bandTop = h * 0.72
  const kinds = ["ring", "flower", "diamond", "quad"]
  let ri = 0
  for (let y = s * 0.45; y < bandTop - s * 0.3; y += s * 0.52, ri++) {
    const kind = kinds[ri % kinds.length]
    const off = ri % 2 ? s * 0.5 : 0
    for (let x = s * 0.5 + off; x < w + s * 0.5; x += s) {
      if (kind === "flower") {
        flower(x, y, R * 1.3)
        if (r() < 0.6) leaves(x + R * 1.3, y + R * 0.2, R * 0.55, 1)
        if (r() < 0.4) leaves(x - R * 1.3, y + R * 0.2, R * 0.55, -1)
      } else if (kind === "ring") ring(x, y, R * 0.85)
      else if (kind === "diamond") diamond(x, y, R)
      else quad(x, y, R)
    }
  }
  // drawn-thread columns between motif columns: the thin bright verticals in the cloth
  for (let x = s; x < w; x += s) {
    const cx = x + jit(s * 0.04)
    stitches(cx, 0, cx, bandTop - s * 0.1)
    g.globalAlpha = 0.18
    g.fillStyle = thread
    g.fillRect(cx + 2 * k, 0, 0.8 * k, bandTop)
    g.globalAlpha = 1
  }
  // border band
  const b0 = bandTop
  stitches(0, b0, w, b0)
  stitches(0, b0 + 4 * k, w, b0 + 4 * k)
  for (let x = s * 0.3; x < w + s; x += s * 0.62) flower(x, b0 + s * 0.36, R * 1.15)
  stitches(0, b0 + s * 0.7, w, b0 + s * 0.7)
  for (let x = s * 0.3; x < w + s; x += s * 0.62) fan(x, b0 + s * 1.02, R * 1.1)
  for (let x = s * 0.1; x < w; x += s * 0.16) circ(holes, x + jit(1), b0 + s * 1.18, Math.max(1.2, R * 0.08))
  stitches(0, h - 9 * k, w, h - 9 * k)

  // satin-stitch rims and sprigs: thin, partly transparent thread
  g.strokeStyle = thread
  g.lineCap = "round"
  g.globalAlpha = 0.5
  g.lineWidth = 1.3 * k
  g.stroke(holes)
  g.globalAlpha = 0.32
  g.lineWidth = 1 * k
  g.stroke(sprig)
  g.globalAlpha = 1

  // cut, with a hair of softness on the edge
  g.globalCompositeOperation = "destination-out"
  g.filter = "blur(" + (0.5 * k).toFixed(2) + "px)"
  g.fill(holes)
  g.filter = "none"
  g.globalCompositeOperation = "source-over"

  hg.fillStyle = "#000"
  hg.fillRect(0, 0, w, h)
  hg.filter = "blur(" + (R * 0.55).toFixed(1) + "px)"
  hg.fillStyle = "#fff"
  hg.fill(holes)
  hg.filter = "none"
  return { cloth, halo }
}

const VERT =
  "attribute vec3 normal2;varying vec2 vUv;varying vec3 vN;" +
  "void main(){vUv=uv;vN=normalize(normalMatrix*normal2);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"

// Backlit cotton: mostly transmitted light, warmest near the sun and thinnest where
// the cloth faces you; creases (grazing) are longer paths, so they go dark. A blurred
// perforation mask adds the glow that bleeds round each eyelet. Almost no specular.
const FRAG =
  "uniform sampler2D map;uniform sampler2D halo;uniform vec2 sunPx;uniform float scale;uniform float folds;varying vec2 vUv;varying vec3 vN;" +
  "float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}" +
  "float h1(float n){return fract(sin(n*91.345)*47453.21);}" +
  // pressed-in creases: narrow dark lines that wander down the cloth, uneven in depth,
  // with a thin lit lip beside each, plus broad soft bands between them
  "vec3 creases(vec2 uv){float x1=uv.x*folds+0.1*sin(uv.y*2.2+uv.x*11.0)+0.035*sin(uv.y*7.0+uv.x*23.0);" +
  "float f1=fract(x1)-0.5;float a1=0.35+0.65*h1(floor(x1));" +
  "float x2=uv.x*folds*1.73+1.7+0.14*sin(uv.y*1.7-uv.x*17.0);float f2=fract(x2)-0.5;float a2=h1(floor(x2)+40.0);a2=a2*a2;" +
  "float dark=exp(-f1*f1/0.0016)*a1+exp(-f2*f2/0.0009)*a2*0.7;" +
  "float lip=exp(-(f1-0.07)*(f1-0.07)/0.0012)*a1*0.6;" +
  "float band=0.5+0.5*sin(x1*6.2832+h1(floor(x1))*3.0);" +
  "return vec3(clamp(dark,0.0,1.0),lip,band);}" +
  "void main(){vec4 t=texture2D(map,vUv);float a=smoothstep(0.2,0.8,t.a);if(a<0.02)discard;" +
  "vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;float face=clamp(abs(n.z),0.0,1.0);" +
  "float d=distance(gl_FragCoord.xy,sunPx)/scale;" +
  "float sun=exp(-d*d*4.5);float sky=0.16+0.34*exp(-d*d*1.1);" +
  "float beam=exp(-pow((gl_FragCoord.x-sunPx.x)/(scale*0.07),2.0))*(0.4+0.6*exp(-d*d*0.6));" +
  "vec3 warm=vec3(1.0,0.9,0.76);" +
  "float thick=mix(2.5,1.0,pow(face,0.7));" +
  "vec3 trans=t.rgb*warm*(sky*0.6+sun*1.3+beam*0.45)*exp(-(thick-1.0)*1.7)*1.25;" +
  "vec3 cr=creases(vUv);trans*=(1.0-0.62*cr.x)*(0.8+0.4*cr.z)*(1.0+0.35*cr.y);" +
  "vec3 col=t.rgb*(0.1+0.16*face)*(1.0-0.4*cr.x)+trans;" +
  "float hl=texture2D(halo,vUv).r;" +
  "col+=warm*hl*(0.08+sun*1.1+beam*0.35+sky*0.1)*face;" +
  "float lum=dot(col,vec3(0.299,0.587,0.114));col=mix(col,vec3(lum),0.06);" +
  "col+=warm*(sun*0.1+0.015);" +
  // veiling glare: the lens washes the bright side out, like the footage
  "col=mix(col,vec3(0.88,0.85,0.8),0.06+sun*0.16+beam*0.06);" +
  "col+=(hash(gl_FragCoord.xy)-0.5)*0.03;" +
  "gl_FragColor=vec4(col,a);}"

// The window behind the curtain, painted once per size: hazy sky with the sun in it,
// a garden in layered tree masses, a lawn, then the frame and glazing bars. The garden
// is blurred hard (far, out of focus) and the frame lightly (near), like a lens focused
// on the cloth. Highlights are pushed past 1 in the shader so they bloom.
function paintWindow(w: number, h: number, sunX: number, sunY: number) {
  const mk = () => {
    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    return c
  }
  const far = mk()
  const g = far.getContext("2d")
  const out = mk()
  const o = out.getContext("2d")
  if (!g || !o) return out
  const r = rng(23)
  const hz = h * 0.6
  const sx = sunX * w, sy = sunY * h
  let gr = g.createLinearGradient(0, 0, 0, hz)
  gr.addColorStop(0, "#7d95ab")
  gr.addColorStop(0.55, "#b4c3cc")
  gr.addColorStop(1, "#dcdad0")
  g.fillStyle = gr
  g.fillRect(0, 0, w, hz + 4)
  for (let i = 0; i < 16; i++) {
    const x = r() * w, y = r() * hz * 0.7, rx = w * (0.08 + r() * 0.16), ry = rx * (0.18 + r() * 0.15)
    g.save()
    g.translate(x, y)
    g.scale(1, ry / rx)
    const cg = g.createRadialGradient(0, 0, 0, 0, 0, rx)
    cg.addColorStop(0, "rgba(255,255,255,0.32)")
    cg.addColorStop(1, "rgba(255,255,255,0)")
    g.fillStyle = cg
    g.fillRect(-rx, -rx, rx * 2, rx * 2)
    g.restore()
  }
  // distant ridge
  g.fillStyle = "#9eab9f"
  g.beginPath()
  g.moveTo(0, hz)
  for (let x = 0; x <= w; x += w / 40) g.lineTo(x, hz - h * (0.03 + 0.025 * Math.sin(x * 0.006 + 1) + r() * 0.012))
  g.lineTo(w, h)
  g.lineTo(0, h)
  g.fill()
  // tree masses, back to front, lit from the sun side
  const layers = [["#7d8f78", "#a3b09a"], ["#5f7354", "#8fa07a"], ["#4a5c3e", "#7a8d5c"]]
  layers.forEach(([dark, lit], li) => {
    const n = 26 + li * 10
    for (let i = 0; i < n; i++) {
      const x = r() * w * 1.1 - w * 0.05
      const rad = h * (0.035 + r() * 0.07) * (1 + li * 0.25)
      const y = hz + h * (0.01 + li * 0.035) - r() * h * 0.06
      const side = x < sx ? 1 : -1
      const tg = g.createRadialGradient(x + side * rad * 0.35, y - rad * 0.35, rad * 0.1, x, y, rad)
      tg.addColorStop(0, lit)
      tg.addColorStop(1, dark)
      g.fillStyle = tg
      g.beginPath()
      g.arc(x, y, rad, 0, Math.PI * 2)
      g.fill()
    }
  })
  gr = g.createLinearGradient(0, hz + h * 0.07, 0, h)
  gr.addColorStop(0, "#b4b98f")
  gr.addColorStop(1, "#7f8a5c")
  g.fillStyle = gr
  g.fillRect(0, hz + h * 0.07, w, h)
  // the sun and the glare it throws over everything
  g.globalCompositeOperation = "screen"
  const sg = g.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 0.7)
  sg.addColorStop(0, "rgba(255,255,250,1)")
  sg.addColorStop(0.04, "rgba(255,248,230,0.95)")
  sg.addColorStop(0.14, "rgba(255,232,196,0.38)")
  sg.addColorStop(0.45, "rgba(255,220,180,0.07)")
  sg.addColorStop(1, "rgba(255,220,180,0)")
  g.fillStyle = sg
  g.fillRect(0, 0, w, h)
  // overexposed morning haze: the garden reads pale through the cloth, as on camera
  const hg2 = g.createLinearGradient(0, 0, 0, h)
  hg2.addColorStop(0, "rgba(250,246,238,0.04)")
  hg2.addColorStop(1, "rgba(250,246,238,0.32)")
  g.fillStyle = hg2
  g.fillRect(0, 0, w, h)
  g.globalCompositeOperation = "source-over"

  o.filter = "blur(" + Math.max(3, w / 160).toFixed(1) + "px)"
  o.drawImage(far, 0, 0)
  o.filter = "none"

  // frame and glazing bars, nearer and only a little soft
  const near = mk()
  const n = near.getContext("2d")
  if (n) {
    const bar = Math.max(10, w * 0.018)
    n.fillStyle = "#2c2721"
    const xs = [w * 0.33, w * 0.67]
    for (const x of xs) n.fillRect(x - bar / 2, 0, bar, h)
    n.fillRect(0, h * 0.46 - bar / 2, w, bar)
    n.lineWidth = Math.max(18, w * 0.03)
    n.strokeRect(0, 0, w, h)
    n.fillStyle = "rgba(255,236,205,0.35)"
    for (const x of xs) if (x < sx) n.fillRect(x + bar / 2 - 2, 0, 2, h)
    n.fillRect(0, h * 0.46 + bar / 2 - 2, w, 2)
    // a reflection streak across the glass
    n.save()
    n.globalAlpha = 0.07
    n.fillStyle = "#ffffff"
    n.translate(w * 0.15, 0)
    n.rotate(0.35)
    n.fillRect(0, -h, w * 0.06, h * 3)
    n.restore()
    o.filter = "blur(" + Math.max(1.5, w / 500).toFixed(1) + "px)"
    o.drawImage(near, 0, 0)
    o.filter = "none"
  }
  return out
}

function drawCover(img: HTMLImageElement, w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const g = c.getContext("2d")
  if (!g) return c
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s
  g.filter = "blur(" + Math.max(2, w / 260).toFixed(1) + "px)"
  g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
  return c
}

const BG_FRAG =
  "uniform sampler2D map;varying vec2 vUv;" +
  "void main(){vec3 c=texture2D(map,vUv).rgb;float l=dot(c,vec3(0.299,0.587,0.114));" +
  "c*=1.0+smoothstep(0.9,1.0,l)*1.3;gl_FragColor=vec4(c,1.0);}"
const BG_VERT = "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"

type Engine = { dispose: () => void; reset: () => void; pullDown: () => void }
type EngineOpts = {
  fabric: string
  thread: string
  sunX: number
  sunY: number
  backdrop?: string
  tear: number
  wind: number
  onTorn: (any: boolean) => void
  onDown: () => void
}

function createEngine(host: HTMLDivElement, o: EngineOpts): Engine {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
  let renderer: THREE.WebGLRenderer | null = null
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true })
  } catch {
    renderer = null
  }
  let W = 0, H = 0
  let fallback: HTMLCanvasElement | null = null

  if (!renderer) {
    // no WebGL: the flat cloth as a still, so the piece still reads as a curtain
    const ro = new ResizeObserver((es) => {
      const r = es[0].contentRect
      if (r.width < 2 || r.height < 2) return
      fallback?.remove()
      const w = Math.round(r.width), h = Math.round(r.height)
      fallback = paintWindow(w, h, o.sunX, o.sunY)
      fallback.getContext("2d")?.drawImage(paintFabric(w, h, o.fabric, o.thread).cloth, 0, 0)
      fallback.className = "ect-fallback"
      host.appendChild(fallback)
    })
    ro.observe(host)
    return { dispose: () => { ro.disconnect(); fallback?.remove() }, reset: () => {}, pullDown: () => {} }
  }

  const gl = renderer
  gl.setClearColor(0x1b1712, 1)
  gl.outputColorSpace = THREE.LinearSRGBColorSpace
  const pr = Math.min(window.devicePixelRatio || 1, 2)
  gl.setPixelRatio(pr)
  const canvas = gl.domElement
  canvas.className = "ect-canvas"
  canvas.setAttribute("aria-hidden", "true")
  host.appendChild(canvas)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 20000)
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: null }, halo: { value: null }, sunPx: { value: new THREE.Vector2() }, scale: { value: 1 }, folds: { value: 8 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: THREE.DoubleSide,
    alphaToCoverage: true,
  })
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat)
  mesh.frustumCulled = false
  scene.add(mesh)
  const bgMat = new THREE.ShaderMaterial({ uniforms: { map: { value: null } }, vertexShader: BG_VERT, fragmentShader: BG_FRAG, depthWrite: false })
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bgMat)
  bg.position.z = -90
  bg.renderOrder = -1
  scene.add(bg)
  let bgTex: THREE.CanvasTexture | null = null
  let photo: HTMLImageElement | null = null
  if (o.backdrop) {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.decoding = "async"
    img.onload = () => {
      photo = img
      if (W && H) paintBackdrop(W, H)
    }
    img.src = o.backdrop
  }
  function paintBackdrop(w: number, h: number) {
    bgTex?.dispose()
    const bw = Math.min(1600, w), bh = Math.round((h / w) * bw)
    bgTex = new THREE.CanvasTexture(photo ? drawCover(photo, bw, bh) : paintWindow(bw, bh, o.sunX, o.sunY))
    bgMat.uniforms.map.value = bgTex
  }

  // bloom: the sun through the eyelets and the tears flares like the footage does
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
  const composer = new EffectComposer(gl, rt)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.45, 0.98)
  composer.addPass(bloom)
  const output = new OutputPass()
  composer.addPass(output)

  let cloth: Cloth | null = null
  let tex: THREE.CanvasTexture | null = null
  let haloTex: THREE.CanvasTexture | null = null
  let idx = new Uint32Array(0)
  let normals = new Float32Array(0)
  let anyTorn = false
  let down = false
  let releases: number[] = []
  let releaseAt = 0

  function build(w: number, h: number) {
    W = w
    H = h
    gl.setSize(w, h, false)
    camera.aspect = w / h
    const camZ = h / 2 / Math.tan((15 * Math.PI) / 180)
    camera.position.set(0, 0, camZ)
    camera.updateProjectionMatrix()
    composer.setPixelRatio(pr)
    composer.setSize(w, h)
    const grow = ((camZ + 90) / camZ) * 1.04
    bg.scale.set(w * grow, h * grow, 1)
    paintBackdrop(w, h)
    mat.uniforms.folds.value = Math.max(4, w / 95)
    const c = makeCloth(w, h)
    cloth = c
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(c.pos, 3))
    geo.setAttribute("uv", new THREE.BufferAttribute(c.uv, 2))
    normals = new Float32Array(c.pos.length)
    geo.setAttribute("normal2", new THREE.BufferAttribute(normals, 3))
    idx = new Uint32Array((c.cols - 1) * (c.rows - 1) * 6)
    geo.setIndex(new THREE.BufferAttribute(idx, 1))
    mesh.geometry.dispose()
    mesh.geometry = geo
    tex?.dispose()
    haloTex?.dispose()
    const tw = Math.min(2048, Math.round(w * pr))
    const th = Math.min(2048, Math.round(h * pr))
    const painted = paintFabric(tw, th, o.fabric, o.thread)
    tex = new THREE.CanvasTexture(painted.cloth)
    tex.anisotropy = gl.capabilities.getMaxAnisotropy()
    haloTex = new THREE.CanvasTexture(painted.halo)
    mat.uniforms.map.value = tex
    mat.uniforms.halo.value = haloTex
    mat.uniforms.sunPx.value.set(o.sunX * w * pr, (1 - o.sunY) * h * pr)
    mat.uniforms.scale.value = h * pr
    releases = []
    anyTorn = false
    down = false
    o.onTorn(false)
  }

  const toWorld = (ox: number, oy: number) => [ox - W / 2, H / 2 - oy]
  let dragging = false
  let hover: number[] | null = null

  const onDown = (e: PointerEvent) => {
    if (!cloth || e.button !== 0) return
    const [x, y] = toWorld(e.offsetX, e.offsetY)
    const r = Math.max(26, (W / (cloth.cols - 1)) * 1.6)
    if (grabAt(cloth, x, y, r) > 0) {
      dragging = true
      canvas.setPointerCapture(e.pointerId)
      host.classList.add("ect-dragging")
    }
  }
  const onMove = (e: PointerEvent) => {
    if (!cloth) return
    const [x, y] = toWorld(e.offsetX, e.offsetY)
    if (dragging) {
      moveGrab(cloth, x, y)
      return
    }
    if (!fine || reduced) return
    // a hand brushing past: nudge the cloth along the pointer's travel
    if (hover) {
      let vx = x - hover[0], vy = y - hover[1]
      const v = Math.hypot(vx, vy)
      if (v > 40) { vx *= 40 / v; vy *= 40 / v }
      const R = Math.max(70, W * 0.09)
      const n = cloth.cols * cloth.rows
      for (let k = 0; k < n; k++) {
        if (cloth.pinned[k] || cloth.frozen[k]) continue
        const p = k * 3
        const dx = cloth.pos[p] - x, dy = cloth.pos[p + 1] - y
        const d2 = dx * dx + dy * dy
        if (d2 > R * R) continue
        const f = (1 - Math.sqrt(d2) / R) ** 2
        cloth.prev[p] -= vx * f * 0.22
        cloth.prev[p + 1] -= vy * f * 0.22
        cloth.prev[p + 2] -= Math.min(v, 40) * f * 0.3
      }
    }
    hover = [x, y]
  }
  const onUp = () => {
    if (!cloth) return
    letGo(cloth)
    dragging = false
    host.classList.remove("ect-dragging")
  }
  const onLeave = () => { hover = null }
  canvas.addEventListener("pointerdown", onDown)
  canvas.addEventListener("pointermove", onMove)
  canvas.addEventListener("pointerup", onUp)
  canvas.addEventListener("pointercancel", onUp)
  canvas.addEventListener("pointerleave", onLeave)

  let lastW = 0, lastH = 0
  let pending = 0
  const ro = new ResizeObserver((es) => {
    const r = es[0].contentRect
    const w = Math.round(r.width), h = Math.round(r.height)
    if (w < 2 || h < 2 || (Math.abs(w - lastW) < 3 && Math.abs(h - lastH) < 3)) return
    lastW = w
    lastH = h
    window.clearTimeout(pending)
    if (!cloth) build(w, h)
    else pending = window.setTimeout(() => build(w, h), 160)
  })
  ro.observe(host)

  let visible = true
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting })
  io.observe(host)

  const STEP = 1 / 90
  let acc = 0, t = 0, last = performance.now(), frames = 0, raf = 0
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!cloth || !visible) return
    acc += dt
    let n = 0
    while (acc >= STEP && n < 4) {
      t += STEP
      if (releases.length && t >= releaseAt) {
        releaseLoop(cloth, releases.shift() as number)
        releaseAt = t + 0.028 + Math.random() * 0.03
      }
      stepCloth(cloth, { dt: STEP, t, gravity: 980, wind: reduced ? 0 : o.wind, tear: 2.3 * o.tear, iters: 6 })
      acc -= STEP
      n++
    }
    if (n === 4) acc = 0
    if (cloth.dirty) {
      const count = buildIndex(cloth, idx)
      const ia = mesh.geometry.getIndex()
      if (ia) ia.needsUpdate = true
      mesh.geometry.setDrawRange(0, count)
      cloth.dirty = false
    }
    if (!anyTorn && cloth.broken > 0) {
      anyTorn = true
      o.onTorn(true)
    }
    if (anyTorn && !down && ++frames % 20 === 0 && attachedFraction(cloth) < 0.08) {
      down = true
      o.onDown()
    }
    gridNormals(cloth, normals)
    const pa = mesh.geometry.getAttribute("position")
    const na = mesh.geometry.getAttribute("normal2")
    pa.needsUpdate = true
    na.needsUpdate = true
    composer.render()
  }
  raf = requestAnimationFrame(frame)

  return {
    dispose() {
      cancelAnimationFrame(raf)
      window.clearTimeout(pending)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      canvas.removeEventListener("pointerleave", onLeave)
      mesh.geometry.dispose()
      mat.dispose()
      tex?.dispose()
      haloTex?.dispose()
      bgTex?.dispose()
      bg.geometry.dispose()
      bgMat.dispose()
      bloom.dispose()
      output.dispose()
      composer.dispose()
      gl.dispose()
      canvas.remove()
    },
    reset() {
      if (W && H) build(W, H)
    },
    pullDown() {
      if (!cloth) return
      const order = Array.from({ length: cloth.cols }, (_, i) => i)
      if (reduced) {
        for (const i of order) releaseLoop(cloth, i)
        return
      }
      // rip it off the rod from one side, loop by loop
      releases = Math.random() < 0.5 ? order : order.reverse()
      releaseAt = t
    },
  }
}

export function EyeletCurtainTear({
  fabricColor = "#665441",
  threadColor = "#efe4cc",
  sunX = 0.72,
  sunY = 0.2,
  tearResistance = 1,
  wind = 0.6,
  backdropSrc,
  caption = "Drag the curtain. Yank it and it tears.",
  onTornDown,
  height = "100svh",
  className = "",
}: EyeletCurtainTearProps) {
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const engineRef = React.useRef(null as Engine | null)
  const cbRef = React.useRef(onTornDown)
  cbRef.current = onTornDown
  const [torn, setTorn] = React.useState(false)
  const [down, setDown] = React.useState(false)

  React.useEffect(() => {
    const host = stageRef.current
    if (!host) return
    const engine = createEngine(host, {
      fabric: fabricColor,
      thread: threadColor,
      sunX,
      sunY,
      backdrop: backdropSrc,
      tear: tearResistance,
      wind,
      onTorn: (v) => {
        setTorn(v)
        if (!v) setDown(false)
      },
      onDown: () => {
        setDown(true)
        cbRef.current?.()
      },
    })
    engineRef.current = engine
    return () => {
      engine.dispose()
      engineRef.current = null
    }
  }, [fabricColor, threadColor, sunX, sunY, backdropSrc, tearResistance, wind])

  return (
    <div className={"ect-root " + className} style={{ height }}>
      <style>{CSS}</style>
      <div ref={stageRef} className="ect-stage" />
      <div className="ect-vignette" />
      <div className="ect-rod" />
      <p className="ect-sr">
        A cutwork curtain hangs over a sunlit window. Drag it to pull and tear it, or use the button to take it down.
      </p>
      <div className="ect-ui">
        {caption ? <span className="ect-pill">{down ? "Window's open." : caption}</span> : <span />}
        <button
          type="button"
          className="ect-btn"
          onClick={() => (torn ? engineRef.current?.reset() : engineRef.current?.pullDown())}
        >
          {torn ? "Hang it again" : "Pull it down"}
        </button>
      </div>
    </div>
  )
}

export default EyeletCurtainTear
