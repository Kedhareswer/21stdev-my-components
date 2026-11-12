import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"

// #region story
// Pure: scroll → story beats, the toss rules and the torn-paper geometry.
// No React, no DOM — the test lifts this region and runs it.

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
/** Smootherstep: zero velocity at both ends, so beats hand over without a jolt. */
export const smooth = (x: number) => {
  x = clamp01(x)
  return x * x * x * (x * (x * 6 - 15) + 10)
}
export const inOut = (x: number) => {
  x = clamp01(x)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/** 0 → 1 while the stage is pinned inside its track; clamps outside it. */
export const progressFrom = (top: number, height: number, stage: number) => {
  const travel = height - stage
  if (!(travel > 0)) return 0
  return clamp01((0 - top) / travel)
}

/** Each beat's slice of the scroll. They overlap on purpose: the coin is still turning as the page folds. */
export const BEATS = {
  unwrap: [0.05, 0.27],
  spin: [0.25, 0.6],
  morph: [0.4, 0.76],
  settle: [0.76, 0.86],
} as const

export type Beat = { u: number; spin: number; m: number; t: number }

export function story(p: number): Beat {
  const span = (b: readonly [number, number]) => (p - b[0]) / (b[1] - b[0])
  return {
    u: smooth(span(BEATS.unwrap)),
    spin: 360 * inOut(span(BEATS.spin)),
    m: smooth(span(BEATS.morph)),
    t: smooth(span(BEATS.settle)),
  }
}

export const CHAPTERS = [
  { n: "I", label: "Wrapped", hold: 0 },
  { n: "II", label: "Unwrapped", hold: 0.3 },
  { n: "III", label: "Minted", hold: 0.6 },
  { n: "IV", label: "Hung", hold: 0.93 },
] as const

export const chapterAt = (p: number) => (p < 0.18 ? 0 : p < 0.45 ? 1 : p < 0.8 ? 2 : 3)

/** Frame-rate independent approach toward a target. */
export const approach = (cur: number, target: number, dt: number, tau: number) =>
  target + (cur - target) * Math.exp(-Math.max(0, dt) / tau)

export type Face = "heads" | "tails" | "edge"
/** The seventh toss always stands on its edge: the reward for staying curious. */
export const EDGE_TOSS = 7
export const tossLanding = (n: number, r: number): Face => (n === EDGE_TOSS ? "edge" : r < 0.5 ? "heads" : "tails")

/** Final rotateX for a toss: always forward, at least two full turns, ending on the asked-for face. */
export function tossTurns(prev: number, face: Face, r: number) {
  const base = Math.ceil(prev / 360) * 360
  const spins = 2 + Math.floor(clamp01(r) * 1.999)
  return base + spins * 360 + (face === "tails" ? 180 : face === "edge" ? 90 : 0)
}

export const faceOf = (deg: number): Face => {
  const d = ((deg % 360) + 360) % 360
  return d === 90 || d === 270 ? "edge" : d === 180 ? "tails" : "heads"
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A torn edge from (x0, yA) to (x1, yB): a wandering line with the odd fibre spike. */
export function tornEdge(seed: number, x0: number, x1: number, yA: number, yB: number, amp: number, n: number) {
  const r = mulberry32(seed)
  const pts: number[][] = []
  let drift = 0
  for (let i = 0; i <= n; i++) {
    const k = i / n
    drift = drift * 0.55 + (r() - 0.5) * amp
    const spike = r() < 0.14 ? (r() - 0.5) * amp * 2.4 : 0
    const jx = i === 0 || i === n ? 0 : (r() - 0.5) * ((x1 - x0) / n) * 0.7
    pts.push([x0 + (x1 - x0) * k + jx, yA + (yB - yA) * k + drift + spike])
  }
  return pts
}

export const polyline = (pts: number[][]) => pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L")
// #endregion

// #region paint
// Pure pixel painters. Every surface (bronze, marble, sky, cloth) is a height map
// lit per pixel, written into an RGBA buffer. They are generators: each yields every
// few rows so the scheduler can spread the work over frames and never block a scroll.

const TAU = Math.PI * 2
export const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export function hash2(x: number, y: number, seed: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
export function vnoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const a = hash2(ix, iy, seed)
  const b = hash2(ix + 1, iy, seed)
  const c = hash2(ix, iy + 1, seed)
  const d = hash2(ix + 1, iy + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
export function fbm(x: number, y: number, seed: number, oct: number) {
  let s = 0
  let amp = 0.5
  let f = 1
  let n = 0
  for (let i = 0; i < oct; i++) {
    s += amp * vnoise(x * f, y * f, seed + i * 17)
    n += amp
    amp *= 0.5
    f *= 2.03
  }
  return s / n
}

/** Separable box blur, edges clamped. */
export function blur(src: Float32Array, w: number, h: number, radius: number) {
  const r = Math.max(1, Math.round(radius))
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  const inv = 1 / (2 * r + 1)
  for (let y = 0; y < h; y++) {
    const o = y * w
    let acc = 0
    for (let k = -r; k <= r; k++) acc += src[o + Math.min(w - 1, Math.max(0, k))]
    for (let x = 0; x < w; x++) {
      tmp[o + x] = acc * inv
      acc += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0
    for (let k = -r; k <= r; k++) acc += tmp[Math.min(h - 1, Math.max(0, k)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc * inv
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]
    }
  }
  return out
}

/** Cavity: how far each pixel sits below its neighbourhood. Dirt settles there; light does not. */
export function cavity(H: Float32Array, w: number, h: number, radius: number, gain: number) {
  const b = blur(blur(H, w, h, radius), w, h, radius)
  const c = new Float32Array(w * h)
  for (let i = 0; i < c.length; i++) c[i] = clamp01((b[i] - H[i]) * gain)
  return c
}

export type Lit = { L: [number, number, number]; amb: number; diff: number; spec: number; shin: number; env: number; metal: number; ao: number }

export const BRONZE: Lit = { L: [-0.55, -0.62, 0.56], amb: 0.16, diff: 0.92, spec: 0.85, shin: 30, env: 0.4, metal: 0.82, ao: 0.7 }
export const MARBLE: Lit = { L: [-0.5, -0.45, 0.74], amb: 0.58, diff: 0.5, spec: 0.1, shin: 14, env: 0.1, metal: 0, ao: 0.4 }

/** Light a height map: per-pixel normals, Lambert + Blinn-Phong + a soft studio reflection. */
export function* shade(w: number, h: number, H: Float32Array, alb: Float32Array, cav: Float32Array | null, alpha: Float32Array | null, scale: number, lit: Lit, out: Uint8ClampedArray) {
  const ll = Math.hypot(lit.L[0], lit.L[1], lit.L[2])
  const lx = lit.L[0] / ll
  const ly = lit.L[1] / ll
  const lz = lit.L[2] / ll
  const hl = Math.hypot(lx, ly, lz + 1)
  const hx = lx / hl
  const hy = ly / hl
  const hz = (lz + 1) / hl
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const a = alpha ? alpha[i] : 1
      const o = i * 4
      if (a <= 0) {
        out[o + 3] = 0
        continue
      }
      const dx = (H[x < w - 1 ? i + 1 : i] - H[x > 0 ? i - 1 : i]) * scale * 0.5
      const dy = (H[y < h - 1 ? i + w : i] - H[y > 0 ? i - w : i]) * scale * 0.5
      const nl = Math.sqrt(dx * dx + dy * dy + 1)
      const nx = -dx / nl
      const ny = -dy / nl
      const nz = 1 / nl
      const diff = Math.max(0, nx * lx + ny * ly + nz * lz)
      const sh = Math.max(0, nx * hx + ny * hy + nz * hz)
      const sp = Math.pow(sh, lit.shin) * lit.spec + sh * sh * sh * lit.spec * 0.08
      const ry = 2 * nz * ny
      const env = lit.env * (0.18 + 0.82 * clamp01(0.5 - 0.95 * ry))
      const occ = 1 - (cav ? cav[i] : 0) * lit.ao
      for (let c = 0; c < 3; c++) {
        const base = alb[i * 3 + c]
        const tint = base * lit.metal + (1 - lit.metal)
        const v = (base * (lit.amb + lit.diff * diff) + base * env + tint * sp * (0.35 + 0.65 * occ)) * occ
        out[o + c] = v >= 1 ? 255 : v * 255
      }
      out[o + 3] = a * 255
    }
    if ((y & 15) === 15) yield
  }
}

const sdBox = (x: number, y: number, b: number) => {
  const qx = Math.abs(x) - b
  const qy = Math.abs(y) - b
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0)
}
const R45 = Math.SQRT1_2
/** The obverse mark: an eight-point star, two squares struck over each other. */
export const starSdf = (u: number, v: number, b: number) => Math.min(sdBox(u, v, b), sdBox((u + v) * R45, (v - u) * R45, b))

/**
 * A struck bronze coin face, N×N. `text` is an optional raster (0..1) of the lettering,
 * already placed — the painter only raises it. Writes RGBA into `out`.
 */
export function* paintCoin(N: number, back: boolean, seed: number, text: Float32Array | null, out: Uint8ClampedArray) {
  const H = new Float32Array(N * N)
  const A = new Float32Array(N * N)
  const half = N / 2
  const R = half * 0.985
  const beadStep = TAU / 72
  const r = mulberry32(seed)
  const leaves: number[][] = []
  if (back) {
    for (const side of [-1, 1]) {
      for (let k = 0; k < 9; k++) {
        const a = Math.PI / 2 + side * (0.42 + k * 0.255)
        const cx = Math.cos(a) * 0.6
        const cy = Math.sin(a) * 0.6
        leaves.push([cx, cy, a + side * 0.95])
      }
    }
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x
      const u = (x + 0.5 - half) / R
      const v = (y + 0.5 - half) / R
      const rr = Math.sqrt(u * u + v * v)
      A[i] = clamp01((1 - rr) * R + 0.5)
      if (rr > 1.01) {
        H[i] = 0.4
        continue
      }
      let h = 0.3
      // the rim: a raised band with a worn, rounded outer chamfer
      const t = (rr - 0.865) / 0.135
      if (t > 0) h = Math.max(h, 0.3 + 0.4 * sstep(0, 0.2, t) - 0.26 * Math.pow(sstep(0.62, 1, t), 1.4))
      h -= 0.07 * Math.exp(-Math.pow((rr - 0.848) / 0.009, 2))
      // beads
      const ang = Math.atan2(v, u)
      const k = Math.round(ang / beadStep)
      const bx = Math.cos(k * beadStep) * 0.795
      const by = Math.sin(k * beadStep) * 0.795
      const bd = Math.hypot(u - bx, v - by) / 0.017
      if (bd < 1) h += 0.17 * Math.sqrt(1 - bd * bd)
      if (!back) {
        // the star, chamfered: flat faces lit differently on each side, like a struck die
        const s = starSdf(u, v, 0.37)
        const plate = clamp01(-s / 0.07)
        h = Math.max(h, 0.3 + 0.42 * plate)
        const g = Math.abs(starSdf(u, v, 0.255))
        h -= 0.17 * plate * (1 - sstep(0.008, 0.02, g))
        const c = Math.hypot(u, v)
        h = Math.max(h, 0.3 + 0.56 * clamp01((0.16 - c) / 0.05))
        h -= 0.16 * (1 - sstep(0.03, 0.045, c))
      } else {
        for (const L of leaves) {
          const dx = u - L[0]
          const dy = v - L[1]
          const ca = Math.cos(L[2])
          const sa = Math.sin(L[2])
          const lx = (dx * ca + dy * sa) / 0.085
          const ly = (-dx * sa + dy * ca) / 0.032
          const d = Math.sqrt(lx * lx + ly * ly)
          if (d < 1) h = Math.max(h, 0.3 + 0.3 * Math.sqrt(1 - d * d) + 0.04 * (1 - Math.abs(ly)))
        }
        const sd = starSdf(u, v + 0.42, 0.045)
        h = Math.max(h, 0.3 + 0.3 * clamp01(-sd / 0.03))
      }
      if (text) h += 0.2 * text[i]
      // wear: high points rubbed flat, pitting, a fine cast grain
      const w = fbm(u * 2.4 + 3, v * 2.4, seed + 3, 3)
      h -= 0.08 * sstep(0.52, 0.72, h) * sstep(0.42, 0.72, w)
      h -= 0.022 * sstep(0.8, 0.95, vnoise(u * 46, v * 46, seed + 9))
      h += 0.006 * (vnoise(u * 170, v * 170, seed + 5) - 0.5)
      H[i] = h
    }
    if ((y & 15) === 15) yield
  }
  // scratches and a couple of knocks on the rim
  for (let s = 0; s < 70; s++) {
    const a = r() * TAU
    const d = Math.sqrt(r()) * 0.92
    let px = half + Math.cos(a) * d * R
    let py = half + Math.sin(a) * d * R
    const dir = r() * TAU
    const len = (0.03 + r() * r() * 0.5) * R
    const depth = 0.012 + r() * 0.03
    const bend = (r() - 0.5) * 0.004
    let th = dir
    for (let k = 0; k < len; k++) {
      th += bend
      px += Math.cos(th)
      py += Math.sin(th)
      const xi = px | 0
      const yi = py | 0
      if (xi < 1 || yi < 1 || xi >= N - 1 || yi >= N - 1) break
      H[yi * N + xi] -= depth
      H[yi * N + xi + 1] -= depth * 0.35
    }
  }
  for (let s = 0; s < 6; s++) {
    const a = r() * TAU
    const cx = half + Math.cos(a) * 0.94 * R
    const cy = half + Math.sin(a) * 0.94 * R
    const rad = (0.02 + r() * 0.03) * R
    for (let y = Math.max(0, (cy - rad) | 0); y < Math.min(N, cy + rad); y++)
      for (let x = Math.max(0, (cx - rad) | 0); x < Math.min(N, cx + rad); x++) {
        const d = Math.hypot(x - cx, y - cy) / rad
        if (d < 1) H[y * N + x] -= 0.1 * (1 - d * d)
      }
  }
  yield
  const cav = cavity(H, N, N, N * 0.009, 7)
  yield
  const alb = new Float32Array(N * N * 3)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x
      if (A[i] <= 0) continue
      const u = (x + 0.5 - half) / R
      const v = (y + 0.5 - half) / R
      const n1 = fbm(u * 2.6, v * 2.6, seed + 11, 3)
      const n2 = fbm(u * 8, v * 8, seed + 13, 2)
      let cr = 0.355 + 0.12 * n1
      let cg = 0.235 + 0.085 * n1
      let cb = 0.15 + 0.05 * n1
      const dk = 0.38 * sstep(0.42, 0.78, n2)
      cr += (0.25 - cr) * dk
      cg += (0.15 - cg) * dk
      cb += (0.09 - cb) * dk
      // patina: dark olive-brown settling in the recesses and in blotches
      const pt = clamp01(cav[i] * 1.7 + 0.32 * sstep(0.58, 0.85, n1))
      cr += (0.17 - cr) * pt * 0.85
      cg += (0.15 - cg) * pt * 0.85
      cb += (0.1 - cb) * pt * 0.85
      // polish on whatever stands proud
      const hi = sstep(0.56, 0.74, H[i]) * (1 - cav[i])
      cr += (0.74 - cr) * hi * 0.42
      cg += (0.53 - cg) * hi * 0.42
      cb += (0.37 - cb) * hi * 0.42
      const ox = sstep(0.74, 0.84, vnoise(u * 13, v * 13, seed + 21)) * 0.55
      cr += (0.13 - cr) * ox
      cg += (0.09 - cg) * ox
      cb += (0.06 - cb) * ox
      alb[i * 3] = cr
      alb[i * 3 + 1] = cg
      alb[i * 3 + 2] = cb
    }
    if ((y & 31) === 31) yield
  }
  yield* shade(N, N, H, alb, cav, A, N * 0.05, BRONZE, out)
}

/** Paper surface: crumple creases and fibre grain, as a multiplier over whatever was drawn. */
export function* paperGrain(N: number, seed: number, dark: boolean, px: Uint8ClampedArray) {
  const C = new Float32Array(N * N)
  const rr = mulberry32(seed + 40)
  const lines: number[][] = []
  for (let k = 0; k < 5; k++) {
    const a = rr() * Math.PI
    lines.push([rr(), rr(), Math.cos(a), Math.sin(a), (rr() < 0.5 ? -1 : 1) * (0.25 + rr() * 0.35)])
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N
      const v = y / N
      let c = fbm(u * 2.2 + 7, v * 2.2, seed, 3) * 0.5
      for (const L of lines) {
        const d = Math.abs((u - L[0]) * L[3] - (v - L[1]) * L[2])
        c += L[4] * Math.exp(-d * d * 9000) + L[4] * 0.35 * Math.exp(-d * d * 400)
      }
      C[y * N + x] = c
    }
    if ((y & 31) === 31) yield
  }
  const k = dark ? 1.6 : 2.4
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const i = y * N + x
      const o = i * 4
      if (px[o + 3] === 0) continue
      const s = 1 + (C[i - 1] - C[i + 1]) * k * 0.8 + (C[i - N] - C[i + N]) * k
      const fib = 1 + (vnoise(x * 0.9, y * 0.3, seed + 4) - 0.5) * (dark ? 0.1 : 0.06) + (hash2(x, y, seed) - 0.5) * 0.035
      const m = s * fib
      px[o] = Math.min(255, px[o] * m)
      px[o + 1] = Math.min(255, px[o + 1] * m)
      px[o + 2] = Math.min(255, px[o + 2] * m)
    }
    if ((y & 31) === 31) yield
  }
}

/** A summer sky: deep blue overhead, haze at the horizon, cumulus with lit tops. */
export function* paintSky(W: number, Hh: number, seed: number, out: Uint8ClampedArray) {
  for (let y = 0; y < Hh; y++) {
    const v = y / Hh
    for (let x = 0; x < W; x++) {
      const u = x / W
      const o = (y * W + x) * 4
      let r = 0.25 + 0.38 * sstep(0.05, 0.9, v)
      let g = 0.52 + 0.32 * sstep(0.05, 0.9, v)
      let b = 0.8 + 0.13 * sstep(0.05, 0.9, v)
      const sun = Math.exp(-Math.pow(Math.hypot((u - 0.78) * 1.4, v - 0.18) / 0.45, 2)) * 0.18
      r += sun
      g += sun * 0.9
      b += sun * 0.6
      // clouds: domain-warped noise, flattened, lit from above, shadowed underneath
      const wx = fbm(u * 1.1, v * 1.6, seed + 2, 3) * 0.55
      const d = fbm(u * 1.7 + wx, v * 3.6, seed, 5)
      const band = sstep(0.08, 0.35, v) * (1 - sstep(0.55, 0.85, v)) * 0.55 + 0.35
      const m = sstep(0.5, 0.71, d * (0.8 + band * 0.42))
      if (m > 0) {
        const d2 = fbm(u * 1.7 + wx, (v - 0.014) * 3.6, seed, 5)
        const lit = clamp01(0.66 + (d - d2) * 8)
        const cr = 0.74 + 0.27 * lit
        const cg = 0.78 + 0.23 * lit
        const cb = 0.84 + 0.17 * lit
        r += (cr - r) * m
        g += (cg - g) * m
        b += (cb - b) * m
      }
      // haze toward the horizon
      const hz = sstep(0.7, 1, v) * 0.55
      r += (0.86 - r) * hz
      g += (0.88 - g) * hz
      b += (0.86 - b) * hz
      out[o] = Math.min(255, r * 255)
      out[o + 1] = Math.min(255, g * 255)
      out[o + 2] = Math.min(255, b * 255)
      out[o + 3] = 255
    }
    if ((y & 15) === 15) yield
  }
}

function marbleAlb(x: number, y: number, seed: number, alb: Float32Array, i: number, stain: number) {
  const n = fbm(x / 70, y / 90, seed, 3)
  const vein = Math.abs(Math.sin((x * 0.006 + y * 0.002 + fbm(x / 120, y / 180, seed + 5, 4) * 4) * 1.6))
  const vv = (1 - sstep(0.0, 0.035, vein)) * 0.1
  const streak = sstep(0.6, 0.9, fbm(x / 14, y / 220, seed + 8, 3)) * stain * 0.35
  let r = 0.92 + 0.04 * n
  let g = 0.885 + 0.04 * n
  let b = 0.82 + 0.035 * n
  r -= vv * 0.5 + streak * 0.16
  g -= vv * 0.5 + streak * 0.2
  b -= vv * 0.46 + streak * 0.24
  alb[i * 3] = r
  alb[i * 3 + 1] = g
  alb[i * 3 + 2] = b
}

/** One fluted column shaft, seen straight on. Twenty flutes around, ten facing us. */
export function* paintShaft(W: number, Hh: number, seed: number, out: Uint8ClampedArray) {
  const lx = -0.62
  const ly = -0.2
  const lz = 0.76
  const alb = new Float32Array(W * Hh * 3)
  for (let y = 0; y < Hh; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      marbleAlb(x * 2.4, y * 1.2, seed, alb, i, 0.5)
      const s = ((x + 0.5) / W) * 2 - 1
      const th = Math.asin(Math.max(-0.999, Math.min(0.999, s)))
      const f = ((th * 20) / TAU + 0.5) % 1
      const fl = (f + 1) % 1
      const tilt = Math.sin(fl * TAU) * 0.42
      const a = th + tilt
      const nx = Math.sin(a)
      const nz = Math.cos(a)
      const diff = Math.max(0, nx * lx + ly * 0.1 + nz * lz)
      const ao = 1 - 0.14 * (0.5 + 0.5 * Math.cos(fl * TAU)) * (1 - Math.abs(s))
      const edge = 0.72 + 0.28 * Math.sqrt(Math.max(0, 1 - s * s))
      const dirt = 1 - 0.1 * sstep(0.7, 1, y / Hh)
      const o = i * 4
      for (let c = 0; c < 3; c++) {
        const v = alb[i * 3 + c] * (0.6 + 0.48 * diff) * ao * edge * dirt
        out[o + c] = Math.min(255, v * 255)
      }
      out[o + 3] = 255
    }
    if ((y & 15) === 15) yield
  }
}

/** An Ionic capital: abacus, cushion, two spiral volutes, egg-and-dart, astragal, neck. */
export function* paintCapital(W: number, Hh: number, seed: number, out: Uint8ClampedArray) {
  const H = new Float32Array(W * Hh)
  const A = new Float32Array(W * Hh)
  const rv = Hh * 0.42
  for (let y = 0; y < Hh; y++) {
    const Y = y / Hh
    for (let x = 0; x < W; x++) {
      const X = x / W
      const i = y * W + x
      let h = 0
      let a = 0
      if (Y < 0.13 && X > 0.02 && X < 0.98) {
        a = 1
        h = 0.46 + 0.16 * clamp01(Math.min(Y / 0.035, (0.13 - Y) / 0.03, (X - 0.02) / 0.012, (0.98 - X) / 0.012))
      }
      if (Y >= 0.12 && Y < 0.42 && X > 0.12 && X < 0.88) {
        a = 1
        h = 0.48 + 0.14 * Math.sin((Math.PI * (Y - 0.12)) / 0.3) - 0.06 * Math.exp(-Math.pow((Y - 0.22) / 0.018, 2)) - 0.06 * Math.exp(-Math.pow((Y - 0.32) / 0.018, 2))
      }
      for (const side of [-1, 1]) {
        const cx = W * (side < 0 ? 0.135 : 0.865)
        const cy = Hh * 0.46
        const dx = (x - cx) * side
        const dy = y - cy
        const rho = Math.hypot(dx, dy) / rv
        if (rho < 1) {
          a = 1
          const phi = Math.atan2(dy, dx) / TAU
          const t = rho * 3.1 + phi
          const fr = t - Math.floor(t)
          const groove = Math.exp(-Math.pow(Math.min(fr, 1 - fr) / 0.11, 2))
          h = Math.max(h, 0.66 - 0.24 * groove - 0.22 * sstep(0.84, 1, rho))
          if (rho < 0.13) h = Math.max(h, 0.74 - rho)
        }
      }
      if (Y >= 0.42 && Y < 0.64 && X > 0.25 && X < 0.75) {
        a = 1
        const cell = (X - 0.25) / (0.5 / 8)
        const k = Math.floor(cell)
        const ex = (cell - k - 0.5) / 0.36
        const ey = (Y - 0.53) / 0.095
        const d = ex * ex + ey * ey
        h = d < 1 ? 0.48 + 0.16 * Math.sqrt(1 - d) : 0.4
      }
      if (Y >= 0.64 && Y < 0.76 && X > 0.24 && X < 0.76) {
        a = 1
        h = 0.44 + 0.12 * Math.sin((Math.PI * (Y - 0.64)) / 0.12)
      }
      if (Y >= 0.76 && X > 0.255 && X < 0.745) {
        a = 1
        const s = (X - 0.5) / 0.245
        h = 0.4 + 0.12 * Math.sqrt(Math.max(0, 1 - s * s))
      }
      if (a) h -= 0.012 * sstep(0.8, 0.95, vnoise(x / 9, y / 9, seed + 3))
      H[i] = h
      A[i] = a
    }
    if ((y & 15) === 15) yield
  }
  const cav = cavity(H, W, Hh, 3, 5)
  const alb = new Float32Array(W * Hh * 3)
  for (let i = 0; i < W * Hh; i++) marbleAlb((i % W) * 1.6, ((i / W) | 0) * 1.6, seed, alb, i, 0.5)
  yield
  yield* shade(W, Hh, H, alb, cav, A, 18, MARBLE, out)
}

/** The broken architrave: cornice, cyma, three stepped fasciae, chipped along the top. */
export function* paintBeam(W: number, Hh: number, seed: number, out: Uint8ClampedArray) {
  const H = new Float32Array(W * Hh)
  for (let y = 0; y < Hh; y++) {
    const Y = y / Hh
    let p = 0.38
    if (Y < 0.1) p = 0.86
    else if (Y < 0.3) p = 0.58 + 0.28 * Math.cos(((Y - 0.1) / 0.2) * (Math.PI / 2))
    else if (Y < 0.35) p = 0.5
    else if (Y < 0.62) p = 0.58
    else if (Y < 0.82) p = 0.48
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      let h = p
      h -= 0.12 * sstep(0.74, 0.9, vnoise(x / 26, y / 12, seed + 7)) * (1 - sstep(0.08, 0.3, Y))
      h -= 0.008 * vnoise(x / 3, y / 3, seed + 2)
      H[i] = h
    }
    if ((y & 15) === 15) yield
  }
  const cav = cavity(H, W, Hh, 4, 6)
  const alb = new Float32Array(W * Hh * 3)
  for (let i = 0; i < W * Hh; i++) marbleAlb(i % W, ((i / W) | 0) * 2, seed + 30, alb, i, 0.45)
  yield
  yield* shade(W, Hh, H, alb, cav, null, 16, MARBLE, out)
}

/** A fallen block: bevelled, chipped, weathered. */
export function* paintStone(W: number, Hh: number, seed: number, out: Uint8ClampedArray) {
  const H = new Float32Array(W * Hh)
  const A = new Float32Array(W * Hh)
  for (let y = 0; y < Hh; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const e = Math.min(x, y, W - 1 - x, Hh - 1 - y) / (Hh * 0.12)
      const chip = vnoise(x / 22, y / 22, seed) * 0.9
      A[i] = e + 0.6 - chip > 0.25 ? 1 : 0
      H[i] = 0.4 + 0.25 * sstep(0, 1, clamp01(e)) - 0.04 * sstep(0.7, 0.95, vnoise(x / 16, y / 16, seed + 4))
    }
    if ((y & 15) === 15) yield
  }
  const cav = cavity(H, W, Hh, 3, 5)
  const alb = new Float32Array(W * Hh * 3)
  for (let i = 0; i < W * Hh; i++) marbleAlb((i % W) * 1.4, ((i / W) | 0) * 1.4, seed, alb, i, 0.6)
  yield* shade(W, Hh, H, alb, cav, A, 14, MARBLE, out)
}

/** Cloth: soft vertical folds hanging from the rod, as a light/dark overlay. */
export function* paintCloth(W: number, Hh: number, seed: number, out: Uint8ClampedArray) {
  const r = mulberry32(seed)
  const waves: number[][] = []
  for (let k = 0; k < 5; k++) waves.push([1.2 + r() * 4.5, r() * TAU, 0.35 + r() * 0.65])
  for (let y = 0; y < Hh; y++) {
    const v = y / Hh
    const grow = 0.25 + 0.75 * sstep(0, 0.7, v)
    for (let x = 0; x < W; x++) {
      const u = x / W
      let slope = 0
      for (const w of waves) slope += Math.cos(u * w[0] * TAU + w[1] + v * 0.6) * w[2] * w[0]
      slope *= grow * 0.009
      const lightness = clamp01(0.5 + slope * 1.4 + (vnoise(x * 0.8, y * 0.8, seed) - 0.5) * 0.05)
      const o = (y * W + x) * 4
      const dark = lightness < 0.5
      const amt = Math.abs(lightness - 0.5) * 2
      out[o] = dark ? 60 : 255
      out[o + 1] = dark ? 45 : 252
      out[o + 2] = dark ? 28 : 244
      out[o + 3] = Math.min(255, amt * (dark ? 85 : 70))
    }
    if ((y & 15) === 15) yield
  }
}
// #endregion

type Action = { label: string; href?: string; onClick?: () => void }

export type MintedCoinScrollProps = {
  /** Height of the pinned stage. */
  height?: string
  /** Scroll travel, in stage heights, that the story plays across. */
  scrollLength?: number
  brand?: string
  /** Three short lines; they sit behind the coin, then shrink onto the banner. */
  headline?: [string, string, string]
  tagline?: string
  /** Words typed on the torn wrapper. */
  tickers?: string[]
  joinAction?: Action
  primaryAction?: Action
  secondaryAction?: Action
  className?: string
  style?: CSSProperties
}

const SERIF = "McsDisplay,'Gilda Display','Iowan Old Style','Palatino Linotype',Georgia,serif"
const MONO = "McsMono,'Courier Prime','Courier New',ui-monospace,monospace"

const CSS =
  ".mcs-root{position:relative;width:100%;--u:0;--spin:0;--m:0;--t:0;--px:0;--py:0;--wind:0;color:#46423c}" +
  ".mcs-stage{position:sticky;top:0;width:100%;overflow:hidden;container-type:size;container-name:mcs;background:#f2eee4;-webkit-tap-highlight-color:transparent}" +
  ".mcs-scene{position:absolute;inset:0;--bw:min(30cqw,50cqh);--bh:calc(var(--bw) * 1.45);--bt:calc(var(--bw) * .32 + 4cqh);--bl:calc((100cqw - var(--bw)) / 2);--beamb:calc(var(--bt) - var(--bw) * .07);--beamh:calc(var(--bw) * .22);--cw:calc(var(--bw) * .42);--gap:calc(var(--bw) * .1);--nw:58cqw;--nh:15cqh;--hd:min(36cqw,50cqh);--hf:min(15.5cqw,25cqh);" +
  "--L:calc(var(--m) * var(--bl));--T:calc(var(--m) * var(--bt));--R:calc(100cqw - var(--m) * var(--bl));--B:calc(100cqh - var(--m) * (100cqh - var(--bt) - var(--bh)));--nk:max(0, 1 - var(--m) * 4);--NX:calc(var(--L) + var(--nk) * var(--nw));--NY:calc(var(--B) - var(--nk) * var(--nh))}" +
  "@container mcs (max-aspect-ratio: 1/1){.mcs-scene{--bw:min(70cqw,46cqh);--bt:calc(var(--bw) * .32 + 18cqh);--nw:60cqw;--nh:10cqh;--hd:min(52cqw,40cqh);--hf:22cqw}}" +
  "@container mcs (max-width: 560px){.mcs-scene .mcs-rail{display:none}.mcs-scene .mcs-join{min-width:0;width:44cqw}}" +

  /* the world behind the page */
  ".mcs-world{position:absolute;inset:0;transform-origin:50% 100%;transform:translateY(calc((1 - var(--m)) * 64cqh)) scale(calc(1.1 - var(--m) * .1));background:linear-gradient(#5a92c8,#c4dbe9 70%,#e9e2d2)}" +
  ".mcs-sky{position:absolute;left:0;top:-70cqh;width:100%;height:170cqh;display:block;max-width:none;object-fit:cover;object-position:50% 100%}" +
  ".mcs-grade{position:absolute;inset:-70cqh 0 0;background:linear-gradient(180deg,rgba(244,220,178,.42),rgba(226,186,128,.4) 78%,rgba(180,140,90,.45));opacity:calc(1 - var(--m) * 1.6);pointer-events:none}" +
  ".mcs-col{position:absolute;top:var(--beamb);bottom:-3cqh;width:var(--cw);display:flex;flex-direction:column;filter:drop-shadow(10px 0 18px rgba(60,48,32,.18))}" +
  ".mcs-col-l{left:calc(var(--bl) - var(--gap) - var(--cw))}" +
  ".mcs-col-r{left:calc(100cqw - var(--bl) + var(--gap))}" +
  ".mcs-cap{display:block;width:204%;max-width:none;height:auto;aspect-ratio:420/128;margin-left:-52%;flex:none;position:relative;z-index:1}" +
  ".mcs-shaft{display:block;flex:1;width:100%;max-width:none;min-height:0;margin-top:-2px;background:linear-gradient(90deg,#b9ad98,#efe8db 40%,#d8ccb7)}" +
  ".mcs-beam{position:absolute;display:block;max-width:none;left:calc(var(--bl) - var(--gap) - var(--cw) * 1.9);width:calc(100cqw - 2 * (var(--bl) - var(--gap) - var(--cw) * 1.9));top:calc(var(--beamb) - var(--beamh));height:var(--beamh);background:#e7decd;" +
  "clip-path:polygon(0 9%,3% 0,22% 5%,41% 0,63% 4%,84% 0,97% 6%,100% 20%,99% 62%,100% 100%,74% 96%,52% 100%,30% 95%,8% 100%,1% 84%,2% 40%);filter:drop-shadow(0 12px 10px rgba(60,46,30,.3))}" +
  ".mcs-stone{position:absolute;display:block;max-width:none;bottom:-1cqh;filter:drop-shadow(0 8px 10px rgba(60,46,30,.28))}" +

  /* the page that becomes a banner */
  ".mcs-poster{position:absolute;inset:0;transform-origin:50% var(--bt);rotate:calc(var(--wind) * 1deg)}" +
  ".mcs-bshadow{position:absolute;left:var(--bl);top:var(--bt);width:var(--bw);height:var(--bh);opacity:calc(var(--m) * var(--m) * var(--m) * var(--m));box-shadow:0 34px 60px -20px rgba(48,36,22,.5),0 10px 22px -8px rgba(48,36,22,.3)}" +
  ".mcs-sheet{position:absolute;inset:0;background:#f2eee4;clip-path:polygon(var(--L) var(--T),var(--R) var(--T),var(--R) var(--B),var(--NX) var(--B),var(--NX) var(--NY),var(--L) var(--NY))}" +
  ".mcs-grain{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:.5;pointer-events:none}" +
  ".mcs-cloth{position:absolute;display:block;max-width:none;left:var(--bl);top:var(--bt);width:var(--bw);height:var(--bh);opacity:calc(var(--m) * var(--m) * var(--m) * var(--m));pointer-events:none}" +
  ".mcs-rod{position:absolute;left:calc(var(--bl) - var(--bw) * .035);width:calc(var(--bw) * 1.07);top:calc(var(--bt) - var(--bw) * .014);height:calc(var(--bw) * .024);border-radius:99px;background:linear-gradient(180deg,#c4ab88,#7d6447 55%,#4f3e2a);box-shadow:0 3px 6px rgba(40,30,18,.35);opacity:calc(var(--m) * var(--m) * var(--m) * var(--m));transform:translateY(calc((1 - var(--m)) * -6cqh))}" +
  ".mcs-rope{position:absolute;top:var(--beamb);width:1.5px;height:calc(var(--bt) - var(--beamb));background:linear-gradient(#8f7b5f,#6e5c45);opacity:calc(var(--m) * var(--m))}" +
  ".mcs-tag{position:absolute;top:calc(var(--bt) + var(--bw) * .045);left:calc(var(--bl) + var(--bw) * .07);right:calc(var(--bl) + var(--bw) * .07);display:flex;justify-content:space-between;align-items:center;font-size:calc(var(--bw) * .03);letter-spacing:.04em;opacity:calc(var(--m) * var(--m) * var(--m));color:#5a554c}" +
  ".mcs-head{position:absolute;left:0;right:0;margin:0;text-align:center;font-weight:400;letter-spacing:-.012em;line-height:.98;pointer-events:none;" +
  "top:calc((1 - var(--m)) * 50cqh + var(--m) * (var(--bt) + var(--bw) * .14));transform:translateY(calc(-50% * (1 - var(--m))));font-size:calc((1 - var(--m)) * var(--hf) + var(--m) * var(--bw) * .1);color:color-mix(in oklab,#adc6cf calc((1 - var(--m)) * 100%),#4d4943)}" +
  ".mcs-line{display:block;animation:mcs-rise 1.2s cubic-bezier(.2,.8,.2,1) both}" +
  ".mcs-line:nth-child(2){animation-delay:.09s}.mcs-line:nth-child(3){animation-delay:.18s}" +
  "@keyframes mcs-rise{from{opacity:0;transform:translateY(.3em)}to{opacity:1;transform:none}}" +
  ".mcs-tagline{position:absolute;left:calc(var(--bl) + var(--bw) * .14);right:calc(var(--bl) + var(--bw) * .14);top:calc(var(--bt) + var(--bh) * .85);margin:0;text-align:center;font-size:calc(var(--bw) * .045);line-height:1.32;color:#8a857b;opacity:var(--t);transform:translateY(calc((1 - var(--t)) * 8px))}" +

  /* the coin */
  ".mcs-coin{position:absolute;left:50%;--D:calc((1 - var(--m)) * var(--hd) + var(--m) * var(--bw) * .46);top:calc((1 - var(--m)) * 55cqh + var(--m) * (var(--bt) + var(--bw) * .86));width:var(--D);height:var(--D);margin:calc(var(--D) / -2) 0 0 calc(var(--D) / -2);perspective:calc(var(--D) * 3.4);padding:0;border:0;background:none;color:inherit;border-radius:50%;outline-offset:6px}" +
  ".mcs-coin:focus-visible{outline:2px solid #8e907f}" +
  ".mcs-cshadow{position:absolute;left:6%;right:10%;top:80%;height:26%;border-radius:50%;background:radial-gradient(closest-side,rgba(52,34,18,.42),rgba(52,34,18,0));filter:blur(6px);transform:translate(4%,calc((1 - var(--m)) * 14%))}" +
  ".mcs-tilt,.mcs-toss{position:absolute;inset:0;transform-style:preserve-3d}" +
  ".mcs-tilt{transform:rotateX(calc(var(--py) * -9deg)) rotateY(calc(var(--px) * 12deg)) rotateZ(-13deg) rotateY(calc(36deg + var(--spin) * 1deg)) rotateX(-6deg)}" +
  ".mcs-face{position:absolute;inset:0;width:100%;height:100%;display:block;max-width:none;border-radius:50%;backface-visibility:hidden;transform:translateZ(calc(var(--D) * .028));background:radial-gradient(circle closest-side,#7d5234 0,#4a2a16 97.6%,rgba(74,42,22,0) 98.6%)}" +
  ".mcs-back{transform:rotateY(180deg) translateZ(calc(var(--D) * .028))}" +
  ".mcs-slice{position:absolute;inset:1.7%;border-radius:50%;transform:translateZ(calc(var(--D) * (var(--k) * .0035 - .028)));background:repeating-conic-gradient(from 3deg,#6a3d22 0 .7deg,#93603a .7deg 1.4deg,#5a321b 1.4deg 2deg)}" +
  ".mcs-sheen{position:absolute;inset:1.6%;border-radius:50%;pointer-events:none;backface-visibility:hidden;transform:translateZ(calc(var(--D) * .0285));" +
  "background:radial-gradient(circle at calc(30% + var(--px) * 18%) calc(24% + var(--py) * 18%),rgba(255,226,190,.22),rgba(255,226,190,0) 42%),linear-gradient(calc(118deg + var(--spin) * 1deg),rgba(255,236,210,0) 40%,rgba(255,236,210,.12) 50%,rgba(255,236,210,0) 60%)}" +
  ".mcs-paper{position:absolute;inset:0;width:100%;height:100%;display:block;max-width:none;backface-visibility:hidden;pointer-events:none;opacity:0;filter:drop-shadow(0 calc(var(--D) * .006) calc(var(--D) * .01) rgba(24,14,6,.5))}" +
  ".mcs-root[data-painted] .mcs-paper{opacity:calc(1 - var(--u) * var(--u) * var(--u))}" +
  ".mcs-paper-t{transform:translateZ(calc(var(--D) * .031)) translate(calc(var(--u) * -12%),calc(var(--u) * -88%)) rotate(calc(var(--u) * -19deg))}" +
  ".mcs-paper-b{transform:translateZ(calc(var(--D) * .031)) translate(calc(var(--u) * 14%),calc(var(--u) * 92%)) rotate(calc(var(--u) * 15deg))}" +
  ".mcs-root[data-unwrapped] .mcs-paper{visibility:hidden}" +

  /* hero chrome, chapter rail, final actions */
  ".mcs-hero{position:absolute;inset:0;pointer-events:none;opacity:calc(1 - var(--m) * 2.2)}" +
  ".mcs-hero>*{pointer-events:auto}" +
  ".mcs-root[data-morphing] .mcs-hero>*{pointer-events:none}" +
  ".mcs-mark{position:absolute;top:clamp(16px,4cqh,36px);left:clamp(16px,4cqw,48px);display:flex;align-items:center;gap:.55em;font-size:16px;letter-spacing:.01em}" +
  ".mcs-join{position:absolute;top:0;right:0;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;width:min(25cqw,340px);min-width:190px;height:clamp(52px,7.5cqh,76px);padding:0 18px 12px;border:0;background:#8e907f;color:#f2eee4;font-size:13px;letter-spacing:.08em;text-decoration:none;cursor:pointer;transition:transform .6s cubic-bezier(.3,1.6,.5,1),background-color .3s}" +
  ".mcs-join:hover{background:#80836f}" +
  ".mcs-join>span{display:inline-block;transition:transform .6s cubic-bezier(.3,1.6,.5,1)}" +
  ".mcs-cue{position:absolute;left:50%;bottom:clamp(14px,4cqh,34px);transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#8b877e}" +
  ".mcs-cue i{display:block;width:1px;height:34px;background:linear-gradient(#8b877e 50%,transparent 50%);background-size:1px 200%;animation:mcs-cue 1.6s cubic-bezier(.6,0,.3,1) infinite}" +
  "@keyframes mcs-cue{from{background-position:0 100%}to{background-position:0 -100%}}" +
  ".mcs-rail{position:absolute;right:clamp(10px,2.4cqw,30px);top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px;margin:0;padding:6px;list-style:none;border-radius:14px;background:rgba(242,238,228,calc(.15 + var(--m) * .55));backdrop-filter:blur(calc(var(--m) * 10px));-webkit-backdrop-filter:blur(calc(var(--m) * 10px))}" +
  ".mcs-ch{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:4px 6px;border:0;background:none;color:#8b877e;font-size:12px;letter-spacing:.1em;cursor:pointer}" +
  ".mcs-ch b{font-weight:400;min-width:2.2em;text-align:right}" +
  ".mcs-ch em{font-style:normal;max-width:0;overflow:hidden;white-space:nowrap;opacity:0;transition:max-width .5s cubic-bezier(.2,.8,.2,1),opacity .3s}" +
  ".mcs-ch[aria-current=step]{color:#3f3b35}" +
  ".mcs-ch[aria-current=step] em,.mcs-ch:hover em,.mcs-ch:focus-visible em{max-width:8em;opacity:1}" +
  ".mcs-final{position:absolute;inset:auto 0 0 0;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;padding:clamp(14px,3.5cqh,32px) clamp(14px,3cqw,36px);pointer-events:none;opacity:var(--t);transform:translateY(calc((1 - var(--t)) * 16px))}" +
  ".mcs-root[data-final] .mcs-final>*{pointer-events:auto}" +
  ".mcs-pill{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border:1px solid rgba(255,255,255,.55);border-radius:20px;background:rgba(246,242,234,.6);backdrop-filter:blur(16px) saturate(1.25);-webkit-backdrop-filter:blur(16px) saturate(1.25);color:#2f2c27;font-size:16px;text-decoration:none;cursor:pointer;box-shadow:0 10px 30px -12px rgba(40,30,18,.35);transition:transform .6s cubic-bezier(.3,1.6,.5,1),background-color .3s}" +
  ".mcs-pill:hover{background:rgba(250,247,240,.82)}" +
  ".mcs-pill>span{display:inline-block;transition:transform .6s cubic-bezier(.3,1.6,.5,1)}" +
  ".mcs-toast{position:absolute;left:50%;top:clamp(14px,3.6cqh,30px);transform:translate(-50%,-8px);padding:10px 18px;border-radius:99px;background:rgba(40,36,31,.86);color:#f2eee4;font-size:14px;letter-spacing:.01em;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .35s,transform .45s cubic-bezier(.2,.8,.2,1)}" +
  ".mcs-toast[data-on]{opacity:1;transform:translate(-50%,0)}" +
  ".mcs-toast[data-edge]{background:linear-gradient(100deg,#5e3a1e,#a8743f 45%,#5e3a1e);box-shadow:0 0 0 1px rgba(255,220,170,.4),0 10px 30px -8px rgba(120,70,30,.6)}" +
  ".mcs-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +

  /* the cursor: only where a real pointer can hover */
  ".mcs-cursor{display:none;position:fixed;left:0;top:0;z-index:60;pointer-events:none;opacity:0;transition:opacity .25s}" +
  ".mcs-cursor[data-on]{opacity:1}" +
  ".mcs-cursor-dot{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:#2f2c27;box-shadow:0 0 0 1.5px rgba(242,238,228,.8);transition:transform .3s cubic-bezier(.2,.8,.2,1)}" +
  ".mcs-cursor-label{position:absolute;left:14px;top:12px;padding:7px 12px;border-radius:99px;background:#2f2c27;color:#f2eee4;font-size:12px;letter-spacing:.04em;white-space:nowrap;opacity:0;transform:scale(.6) translateY(-4px);transform-origin:0 0;transition:opacity .2s,transform .35s cubic-bezier(.3,1.5,.5,1)}" +
  ".mcs-cursor[data-label] .mcs-cursor-label{opacity:1;transform:none}" +
  ".mcs-cursor[data-label] .mcs-cursor-dot{transform:scale(.5)}" +
  "@media (hover:hover) and (pointer:fine){.mcs-cursor{display:block}.mcs-stage,.mcs-stage button,.mcs-stage a{cursor:none}}" +
  "@media (prefers-reduced-motion:reduce){.mcs-line,.mcs-cue i{animation:none}.mcs-join,.mcs-pill,.mcs-join>span,.mcs-pill>span,.mcs-toast,.mcs-cursor-label,.mcs-cursor-dot{transition:none}}"

/* ---------------------------------------------------------------- fonts */
// Subsets of Gilda Display and Courier Prime (SIL Open Font License 1.1), renamed
// McsDisplay / McsMono as the licence asks of modified copies. Inlined so the
// component fetches nothing.
const FONTS =
  "@font-face{font-family:McsDisplay;font-display:block;src:url(data:font/woff2;base64,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) format('woff2')}" +
  "@font-face{font-family:McsMono;font-display:block;src:url(data:font/woff2;base64,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) format('woff2')}"

/* ------------------------------------------------------------- painting */

type Job = () => Generator<void, void, unknown>
const PAINTED = new Map<string, HTMLCanvasElement>()

function blit(key: string, w: number, h: number, targets: (HTMLCanvasElement | null)[], gen: (out: Uint8ClampedArray) => Generator<void, void, unknown>, after?: (c: CanvasRenderingContext2D) => Generator<void, void, unknown> | void): Job {
  return function* () {
    let src = PAINTED.get(key)
    if (!src) {
      src = document.createElement("canvas")
      src.width = w
      src.height = h
      const g = src.getContext("2d")
      if (!g) return
      const img = g.createImageData(w, h)
      yield* gen(img.data)
      g.putImageData(img, 0, 0)
      if (after) {
        const more = after(g)
        if (more) yield* more
      }
      PAINTED.set(key, src)
    }
    for (const t of targets) {
      if (!t) continue
      t.width = w
      t.height = h
      t.getContext("2d")?.drawImage(src, 0, 0)
    }
  }
}

function coinText(N: number, back: boolean) {
  const c = document.createElement("canvas")
  c.width = c.height = N
  const g = c.getContext("2d")
  if (!g) return null
  const R = (N / 2) * 0.985
  g.fillStyle = "#000"
  g.translate(N / 2, N / 2)
  g.textAlign = "center"
  g.textBaseline = "middle"
  if (!back) {
    const chars = Array.from("OBOL · DIGITAL MINT · N° 001 · HOLD · SEND · KEEP · ")
    g.font = R * 0.082 + "px " + SERIF
    const step = TAU / chars.length
    chars.forEach((ch, i) => {
      g.save()
      g.rotate(i * step)
      g.translate(0, -R * 0.665)
      g.fillText(ch, 0, 0)
      g.restore()
    })
  } else {
    g.font = R * 0.25 + "px " + SERIF
    g.fillText("OBOL", 0, R * 0.04)
    g.font = R * 0.085 + "px " + SERIF
    g.fillText("M M X X V I", 0, R * 0.25)
  }
  const d = g.getImageData(0, 0, N, N).data
  const out = new Float32Array(N * N)
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] / 255
  return blur(out, N, N, N * 0.0016)
}

/** Torn paper wrapped over the coin: body, typed words, a fibrous torn core, a fold over the rim. */
function paperJob(key: string, N: number, top: boolean, words: string[], target: HTMLCanvasElement | null): Job {
  return blit(key, N, N, [target], function* () {}, function* (g) {
    const s = N / 420
    const edge0 = top ? tornEdge(29, -236, 236, -44, -116, 10, 30) : tornEdge(53, -236, 236, 108, 50, 10, 30)
    // refine the tear: every segment gets small, sharp fibre-scale jitter
    const edge: number[][] = []
    for (let k = 0; k < edge0.length - 1; k++) {
      const a = edge0[k]
      const b = edge0[k + 1]
      for (let j = 0; j < 8; j++) {
        const t = j / 8
        const x = a[0] + (b[0] - a[0]) * t
        edge.push([x, a[1] + (b[1] - a[1]) * t + (vnoise(x * 0.35, top ? 1 : 9, 7) - 0.5) * 5 + (hash2(k, j, 3) - 0.5) * 1.6])
      }
    }
    edge.push(edge0[edge0.length - 1])
    const body = new Path2D()
    if (top) {
      body.moveTo(-260, -260)
      body.lineTo(260, -260)
      for (let k = edge.length - 1; k >= 0; k--) body.lineTo(edge[k][0], edge[k][1])
    } else {
      body.moveTo(edge[0][0], edge[0][1])
      for (const p of edge) body.lineTo(p[0], p[1])
      body.lineTo(260, 260)
      body.lineTo(-260, 260)
    }
    body.closePath()
    g.setTransform(s, 0, 0, s, N / 2, N / 2)
    g.clearRect(-210, -210, 420, 420)
    g.save()
    g.beginPath()
    g.arc(0, 0, 202.5, 0, TAU)
    g.clip()
    g.fillStyle = top ? "#e8e3d7" : "#28231f"
    g.fill(body)
    g.save()
    g.clip(body)
    // typed words: each character pressed a little differently
    const rnd = mulberry32(top ? 11 : 12)
    g.font = "17px " + MONO
    g.textBaseline = "alphabetic"
    g.rotate(-0.12)
    const rows = top ? [-196, -170, -144, -118, -92] : [86, 112, 138, 164, 190, 216]
    rows.forEach((y, ri) => {
      let x = -250 + ((ri * 41) % 70)
      let wi = ri * 3
      while (x < 250) {
        const w = words[wi++ % words.length]
        const faint = rnd() < 0.22
        for (const ch of Array.from(w)) {
          g.globalAlpha = (faint ? 0.38 : 0.82) + rnd() * 0.16
          g.fillStyle = top ? "#24201c" : "#ebe4d7"
          g.fillText(ch, x + (rnd() - 0.5) * 0.5, y + (rnd() - 0.5) * 0.6)
          x += 10.4
        }
        x += 28 + rnd() * 16
      }
    })
    g.globalAlpha = 1
    g.restore()
    // the torn core: paper is lighter inside than on its surface, and it frays
    const core = top ? "#fbf9f3" : "#8d847a"
    g.save()
    g.clip(body)
    g.lineJoin = "round"
    g.strokeStyle = core
    g.lineWidth = 5.5
    g.beginPath()
    edge.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])))
    g.stroke()
    g.restore()
    const out = top ? 1 : -1
    g.strokeStyle = core
    g.lineWidth = 0.45
    for (let k = 0; k < edge.length - 1; k++) {
      const a = edge[k]
      const b = edge[k + 1]
      for (let j = 0; j < 3; j++) {
        const t = rnd()
        const x = a[0] + (b[0] - a[0]) * t
        const y = a[1] + (b[1] - a[1]) * t
        const len = 0.8 + rnd() * rnd() * 4.5
        const th = Math.PI / 2 + (rnd() - 0.5) * 1.6
        g.globalAlpha = 0.45 + rnd() * 0.5
        g.beginPath()
        g.moveTo(x, y - out * 1.5)
        g.lineTo(x + Math.cos(th) * len * 0.6, y + out * Math.sin(th) * len)
        g.stroke()
      }
    }
    g.globalAlpha = 1
    // where the paper folds over the rim it catches light
    g.save()
    g.clip(body)
    g.strokeStyle = top ? "rgba(255,255,255,.75)" : "rgba(150,140,128,.55)"
    g.lineWidth = 2.4
    g.beginPath()
    g.arc(0, 0, 201, 0, TAU)
    g.stroke()
    g.restore()
    g.restore()
    g.setTransform(1, 0, 0, 1, 0, 0)
    const img = g.getImageData(0, 0, N, N)
    yield* paperGrain(N, top ? 5 : 6, !top, img.data)
    g.putImageData(img, 0, 0)
  })
}

function schedule(jobs: Job[], done: () => void) {
  let k = 0
  let cur: Generator<void, void, unknown> | null = null
  let dead = false
  let timer = 0
  const tick = () => {
    if (dead) return
    const t0 = performance.now()
    while (performance.now() - t0 < 8) {
      if (!cur) {
        if (k >= jobs.length) {
          done()
          return
        }
        cur = jobs[k++]()
      }
      if (cur.next().done) cur = null
    }
    timer = window.setTimeout(tick, 0)
  }
  timer = window.setTimeout(tick, 16)
  return () => {
    dead = true
    window.clearTimeout(timer)
  }
}

/* ------------------------------------------------------------------ bits */

function StarMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-12 -12 24 24" aria-hidden="true" style={{ display: "block", maxWidth: "none" }}>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="-7" y="-7" width="14" height="14" />
        <rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" />
      </g>
      <circle r="1.8" fill="currentColor" />
    </svg>
  )
}

function ActionEl({ a, className, cursor, children }: { a: Action; className: string; cursor: string; children: ReactNode }) {
  const props = { className, "data-magnet": "", "data-cursor": cursor }
  if (a.href) {
    return (
      <a href={a.href} onClick={a.onClick} {...props}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" onClick={a.onClick} {...props}>
      {children}
    </button>
  )
}

/* ------------------------------------------------------------- component */

const DEFAULT_TICKERS = ["OBOL", "DIGITAL MINT", "OBL", "LEDGER", "SETTLED", "24/7", "HOLD", "SEND", "KEEP"]

export default function MintedCoinScroll({
  height = "100svh",
  scrollLength = 4,
  brand = "Obol",
  headline = ["Value,", "Minted", "Anew."],
  tagline = "Hold, send and keep value in an economy that never closes.",
  tickers = DEFAULT_TICKERS,
  joinAction = { label: "Join the mint" },
  primaryAction = { label: "Open a wallet" },
  secondaryAction = { label: "Read the ledger" },
  className,
  style,
}: MintedCoinScrollProps) {
  const id = "mcs" + useId().replace(/[^a-zA-Z0-9]/g, "")
  const rootRef = useRef(null as HTMLDivElement | null)
  const stageRef = useRef(null as HTMLDivElement | null)
  const coinRef = useRef(null as HTMLButtonElement | null)
  const tossRef = useRef(null as HTMLSpanElement | null)
  const cursorRef = useRef(null as HTMLDivElement | null)
  const labelRef = useRef(null as HTMLSpanElement | null)
  const cv = useRef({} as Record<string, HTMLCanvasElement | null>)
  const [chapter, setChapter] = useState(0)
  const [reduced, setReduced] = useState(false)
  const [toast, setToast] = useState({ text: "", edge: false, on: false })
  const toastTimer = useRef(0)
  const s = useRef({
    target: 0,
    cur: 0,
    px: 0,
    py: 0,
    tx: 0,
    ty: 0,
    gust: 0,
    wind: 0,
    box: null as DOMRect | null,
    fine: false,
    still: false,
    chapter: 0,
    unwrapped: false,
    tosses: 0,
    rot: 0,
    tossing: false,
    magnet: null as HTMLElement | null,
    magnetBox: null as DOMRect | null,
    written: "",
  })
  const words = useMemo(() => (tickers.length ? tickers : DEFAULT_TICKERS), [tickers])
  const ref = (k: string) => (el: HTMLCanvasElement | null) => {
    cv.current[k] = el
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fp = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => {
      s.current.still = rm.matches
      s.current.fine = fp.matches
      setReduced(rm.matches)
    }
    sync()
    rm.addEventListener("change", sync)
    fp.addEventListener("change", sync)
    return () => {
      rm.removeEventListener("change", sync)
      fp.removeEventListener("change", sync)
    }
  }, [])

  // paint every surface once, a few rows per frame, coin first
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof document === "undefined") return
    let cancel = () => {}
    let alive = true
    const fonts = document.fonts
    const ready = fonts ? Promise.all([fonts.load("40px McsDisplay"), fonts.load("17px McsMono")]).catch(() => null) : Promise.resolve(null)
    const t = new Promise((r) => setTimeout(r, 1500))
    Promise.race([ready, t]).then(() => {
      if (!alive) return
      const c = cv.current
      const N = 720
      const jobs: Job[] = [
        blit("coin-f", N, N, [c.front], (o) => paintCoin(N, false, 7, coinText(N, false), o)),
        paperJob("paper-t|" + words.join(","), N, true, words, c.paperT),
        paperJob("paper-b|" + words.join(","), N, false, words.slice(3).concat(words.slice(0, 3)), c.paperB),
        () =>
          (function* () {
            root.dataset.painted = ""
          })(),
        blit("coin-b", N, N, [c.back], (o) => paintCoin(N, true, 19, coinText(N, true), o)),
        blit("sky", 640, 520, [c.sky], (o) => paintSky(640, 520, 4, o)),
        blit("shaft", 160, 640, [c.shaftL, c.shaftR], (o) => paintShaft(160, 640, 3, o)),
        blit("cap", 420, 128, [c.capL, c.capR], (o) => paintCapital(420, 128, 5, o)),
        blit("beam", 960, 170, [c.beam], (o) => paintBeam(960, 170, 8, o)),
        blit("stone-a", 260, 150, [c.stoneA], (o) => paintStone(260, 150, 2, o)),
        blit("stone-b", 200, 170, [c.stoneB], (o) => paintStone(200, 170, 6, o)),
        blit("cloth", 260, 380, [c.cloth], (o) => paintCloth(260, 380, 9, o)),
      ]
      cancel = schedule(jobs, () => {})
    })
    return () => {
      alive = false
      cancel()
    }
  }, [words])

  // scroll → progress: one layout read per scroll frame, nothing per paint
  const measure = useCallback(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    const r = root.getBoundingClientRect()
    s.current.target = progressFrom(r.top, r.height, stage.offsetHeight)
  }, [])

  const jump = useCallback((k: number) => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    const r = root.getBoundingClientRect()
    const travel = r.height - stage.offsetHeight
    if (travel <= 0) return
    window.scrollBy({ top: r.top + CHAPTERS[k].hold * travel, behavior: s.current.still ? "auto" : "smooth" })
  }, [])

  const say = useCallback((text: string, edge = false) => {
    window.clearTimeout(toastTimer.current)
    setToast({ text, edge, on: true })
    toastTimer.current = window.setTimeout(() => setToast((t) => ({ ...t, on: false })), edge ? 6400 : 2200)
  }, [])

  const setCoinCursor = useCallback(() => {
    const c = coinRef.current
    if (!c) return
    const st = s.current
    const label = !st.unwrapped ? "Unwrap ↓" : st.tosses ? "Toss again" : "Toss"
    c.dataset.cursor = label
    // if the cursor is reading the coin right now, say the new thing without waiting for a move
    const shown = labelRef.current
    if (shown && cursorRef.current?.hasAttribute("data-label") && /^(Toss|Unwrap)/.test(shown.textContent || "")) shown.textContent = label
  }, [])

  // the frame loop: eases toward the scroll, then writes a handful of variables
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let raf = 0
    let last = performance.now()
    let alive = true
    let running = false
    const frame = (now: number) => {
      const st = s.current
      const dt = Math.min(64, now - last)
      last = now
      st.cur = st.still ? 1 : Math.abs(st.cur - st.target) < 1e-4 ? st.target : approach(st.cur, st.target, dt, 95)
      const b = st.still ? { u: 1, spin: 0, m: 1, t: 1 } : story(st.cur)
      st.px = approach(st.px, st.fine && !st.still ? st.tx : 0, dt, 160)
      st.py = approach(st.py, st.fine && !st.still ? st.ty : 0, dt, 160)
      st.gust *= Math.exp(-dt / 520)
      const hung = b.m > 0.98 && !st.still ? 1 : 0
      st.wind = approach(st.wind, hung * (Math.sin(now / 1700) * 0.32 + st.gust), dt, 320)
      const key =
        b.u.toFixed(4) + b.spin.toFixed(2) + b.m.toFixed(4) + b.t.toFixed(4) + st.px.toFixed(3) + st.py.toFixed(3) + st.wind.toFixed(3)
      if (key !== st.written) {
        st.written = key
        const cs = root.style
        cs.setProperty("--u", b.u.toFixed(4))
        cs.setProperty("--spin", b.spin.toFixed(2))
        cs.setProperty("--m", b.m.toFixed(4))
        cs.setProperty("--t", b.t.toFixed(4))
        cs.setProperty("--px", st.px.toFixed(3))
        cs.setProperty("--py", st.py.toFixed(3))
        cs.setProperty("--wind", st.wind.toFixed(3))
      }
      const unwrapped = b.u > 0.97
      if (unwrapped !== st.unwrapped) {
        st.unwrapped = unwrapped
        if (unwrapped) root.dataset.unwrapped = ""
        else {
          delete root.dataset.unwrapped
          // wrapped again: the paper belongs on heads, so settle the coin back face-up
          st.rot = Math.ceil(st.rot / 360) * 360
          if (tossRef.current) tossRef.current.style.transform = "rotateX(" + st.rot + "deg)"
        }
        setCoinCursor()
      }
      if (b.m > 0.5) root.dataset.morphing = ""
      else delete root.dataset.morphing
      if (b.t > 0.5) root.dataset.final = ""
      else delete root.dataset.final
      const ch = st.still ? 3 : chapterAt(st.cur)
      if (ch !== st.chapter) {
        st.chapter = ch
        setChapter(ch)
      }
      if (alive && running) raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    measure()
    s.current.cur = s.current.target
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((e) => (e[0]?.isIntersecting ? start() : stop()))
        : null
    if (io) io.observe(root)
    else start()
    const onScroll = () => measure()
    addEventListener("scroll", onScroll, { passive: true, capture: true })
    addEventListener("resize", onScroll)
    return () => {
      alive = false
      stop()
      io?.disconnect()
      removeEventListener("scroll", onScroll, { capture: true })
      removeEventListener("resize", onScroll)
    }
  }, [measure, setCoinCursor])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const toss = useCallback(() => {
    const st = s.current
    if (!st.unwrapped) {
      jump(1)
      return
    }
    const el = tossRef.current
    if (!el || st.tossing) return
    st.tosses += 1
    const face = tossLanding(st.tosses, Math.random())
    const from = st.rot
    const to = tossTurns(from, face, Math.random())
    st.rot = to
    setCoinCursor()
    const land = () => {
      el.style.transform = "rotateX(" + to + "deg)"
      st.tossing = false
      if (face === "edge") say("It landed on its edge — about 1 in 6,000. Keep this one.", true)
      else say((face === "heads" ? "Heads" : "Tails") + " · toss " + st.tosses)
    }
    if (st.still || typeof el.animate !== "function") {
      land()
      return
    }
    st.tossing = true
    const mid = from + (to - from) * 0.55
    const anim = el.animate(
      [
        { transform: "translateY(0) rotateX(" + from + "deg)" },
        { transform: "translateY(-42%) rotateX(" + mid + "deg)", offset: 0.45 },
        { transform: "translateY(0) rotateX(" + to + "deg)" },
      ],
      { duration: face === "edge" ? 1500 : 1150, easing: "cubic-bezier(.22,.7,.25,1)", fill: "forwards" },
    )
    anim.onfinish = () => {
      land()
      anim.cancel()
    }
  }, [jump, say, setCoinCursor])

  // pointer: tilt, wind, the context cursor and the magnets — mouse only
  const onEnter = useCallback((e: ReactPointerEvent) => {
    const st = s.current
    if (e.pointerType !== "mouse" || !st.fine) return
    st.box = stageRef.current ? stageRef.current.getBoundingClientRect() : null
    cursorRef.current?.setAttribute("data-on", "")
  }, [])

  const releaseMagnet = useCallback(() => {
    const st = s.current
    const m = st.magnet
    if (!m) return
    m.style.transform = ""
    const inner = m.firstElementChild as HTMLElement | null
    if (inner) inner.style.transform = ""
    st.magnet = null
    st.magnetBox = null
  }, [])

  const onMove = useCallback(
    (e: ReactPointerEvent) => {
      const st = s.current
      if (e.pointerType !== "mouse" || !st.fine) return
      const cur = cursorRef.current
      if (cur) cur.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)"
      if (st.box) {
        st.tx = Math.max(-1, Math.min(1, ((e.clientX - st.box.left) / st.box.width - 0.5) * 2))
        st.ty = Math.max(-1, Math.min(1, ((e.clientY - st.box.top) / st.box.height - 0.5) * 2))
      }
      st.gust = Math.max(-2.4, Math.min(2.4, st.gust + e.movementX * 0.012))
      const t = e.target as Element
      const hit = t.closest ? (t.closest("[data-cursor]") as HTMLElement | null) : null
      const label = hit ? hit.getAttribute("data-cursor") || "" : ""
      if (cur && labelRef.current) {
        if (label) {
          if (labelRef.current.textContent !== label) labelRef.current.textContent = label
          cur.setAttribute("data-label", "")
        } else cur.removeAttribute("data-label")
      }
      const mag = t.closest ? (t.closest("[data-magnet]") as HTMLElement | null) : null
      if (mag !== st.magnet) {
        releaseMagnet()
        if (mag && !st.still) {
          st.magnet = mag
          st.magnetBox = mag.getBoundingClientRect()
        }
      }
      if (st.magnet && st.magnetBox) {
        const bx = st.magnetBox
        const dx = e.clientX - (bx.left + bx.width / 2)
        const dy = e.clientY - (bx.top + bx.height / 2)
        st.magnet.style.transform = "translate(" + (dx * 0.3).toFixed(1) + "px," + (dy * 0.38).toFixed(1) + "px)"
        const inner = st.magnet.firstElementChild as HTMLElement | null
        if (inner) inner.style.transform = "translate(" + (dx * 0.14).toFixed(1) + "px," + (dy * 0.16).toFixed(1) + "px)"
      }
    },
    [releaseMagnet],
  )

  const onLeave = useCallback(() => {
    const st = s.current
    st.tx = 0
    st.ty = 0
    st.box = null
    releaseMagnet()
    cursorRef.current?.removeAttribute("data-on")
  }, [releaseMagnet])

  const len = reduced ? 1 : Math.max(1.5, scrollLength + 1)

  return (
    <div
      ref={rootRef}
      className={"mcs-root" + (className ? " " + className : "")}
      style={{ height: "calc(" + len + " * " + height + ")", fontFamily: SERIF, ...style }}
    >
      <style>{FONTS + CSS}</style>
      <div ref={stageRef} className="mcs-stage" style={{ height }} onPointerEnter={onEnter} onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className="mcs-scene">
          <div className="mcs-world" aria-hidden="true">
            <canvas ref={ref("sky")} className="mcs-sky" />
            <canvas ref={ref("stoneA")} className="mcs-stone" style={{ left: "-2cqw", width: "calc(var(--bw) * .62)", height: "calc(var(--bw) * .36)" }} />
            <canvas ref={ref("stoneB")} className="mcs-stone" style={{ right: "-1cqw", width: "calc(var(--bw) * .46)", height: "calc(var(--bw) * .4)" }} />
            <div className="mcs-col mcs-col-l">
              <canvas ref={ref("capL")} className="mcs-cap" />
              <canvas ref={ref("shaftL")} className="mcs-shaft" />
            </div>
            <div className="mcs-col mcs-col-r">
              <canvas ref={ref("capR")} className="mcs-cap" />
              <canvas ref={ref("shaftR")} className="mcs-shaft" />
            </div>
            <canvas ref={ref("beam")} className="mcs-beam" />
            <div className="mcs-grade" />
          </div>

          <div className="mcs-poster">
            <div className="mcs-rope" style={{ left: "calc(var(--bl) + var(--bw) * .04)" }} aria-hidden="true" />
            <div className="mcs-rope" style={{ left: "calc(100cqw - var(--bl) - var(--bw) * .04)" }} aria-hidden="true" />
            <div className="mcs-bshadow" aria-hidden="true" />
            <div className="mcs-sheet">
              <svg className="mcs-grain" aria-hidden="true">
                <filter id={id + "pg"} x="0" y="0" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="21" />
                  <feColorMatrix values="0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .42  0 0 0 -1.8 1" />
                </filter>
                <rect width="100%" height="100%" filter={"url(#" + id + "pg)"} opacity=".2" />
              </svg>
            </div>
            <canvas ref={ref("cloth")} className="mcs-cloth" aria-hidden="true" />
            <div className="mcs-rod" aria-hidden="true" />
            <div className="mcs-tag" aria-hidden="true">
              <span style={{ display: "flex", alignItems: "center", gap: ".45em" }}>
                <StarMark size={11} />
                {brand}
              </span>
              <span style={{ fontFamily: MONO, fontSize: ".9em" }}>N° 001 — MMXXVI</span>
            </div>

            <h2 className="mcs-head">
              {headline.map((l, i) => (
                <span key={i} className="mcs-line">
                  {l}
                </span>
              ))}
            </h2>

            <button ref={coinRef} type="button" className="mcs-coin" onClick={toss} aria-label={"The " + brand + " coin. Toss it."} data-cursor="Unwrap ↓">
              <span className="mcs-cshadow" aria-hidden="true" />
              <span className="mcs-tilt">
                <span ref={tossRef} className="mcs-toss">
                  {Array.from({ length: 17 }, (_, k) => (
                    <span key={k} className="mcs-slice" style={{ "--k": k } as CSSProperties} />
                  ))}
                  <canvas ref={ref("back")} className="mcs-face mcs-back" aria-hidden="true" />
                  <canvas ref={ref("front")} className="mcs-face" aria-hidden="true" />
                  <span className="mcs-sheen" />
                  <canvas ref={ref("paperT")} className="mcs-paper mcs-paper-t" aria-hidden="true" />
                  <canvas ref={ref("paperB")} className="mcs-paper mcs-paper-b" aria-hidden="true" />
                </span>
              </span>
            </button>

            <p className="mcs-tagline">{tagline}</p>
          </div>

          <div className="mcs-hero">
            <div className="mcs-mark">
              <StarMark />
              <span>{brand}</span>
            </div>
            <ActionEl a={joinAction} className="mcs-join" cursor="Join">
              <span>{joinAction.label}</span>
              <span aria-hidden="true">→</span>
            </ActionEl>
            <div className="mcs-cue" aria-hidden="true">
              Scroll to unwrap
              <i />
            </div>
          </div>

          <ol className="mcs-rail" aria-label="Chapters">
            {CHAPTERS.map((c, k) => (
              <li key={c.n}>
                <button type="button" className="mcs-ch" aria-current={k === chapter ? "step" : undefined} onClick={() => jump(k)} data-cursor={"Go to " + c.label.toLowerCase()}>
                  <em>{c.label}</em>
                  <b>{c.n}</b>
                </button>
              </li>
            ))}
          </ol>

          <div className="mcs-final">
            <ActionEl a={primaryAction} className="mcs-pill" cursor="Open">
              <span aria-hidden="true">↗</span>
              <span>{primaryAction.label}</span>
            </ActionEl>
            <ActionEl a={secondaryAction} className="mcs-pill" cursor="Read">
              <span>{secondaryAction.label}</span>
            </ActionEl>
          </div>

          <div className="mcs-toast" data-on={toast.on ? "" : undefined} data-edge={toast.edge ? "" : undefined} aria-hidden="true">
            {toast.text}
          </div>
          <p className="mcs-sr" aria-live="polite">
            {toast.on ? toast.text : ""}
          </p>
        </div>
      </div>
      <div ref={cursorRef} className="mcs-cursor" aria-hidden="true">
        <span className="mcs-cursor-dot" />
        <span ref={labelRef} className="mcs-cursor-label" />
      </div>
    </div>
  )
}
