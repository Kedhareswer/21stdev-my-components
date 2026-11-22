"use client"

import * as React from "react"

export interface GuidelineFanPreloaderLabels {
  /** Scene 1: above the top guide, and under the bottom guide. */
  top: string[]
  bottom: string[]
  /** Scene 2 (photo cube): beside the cell, the one-liner, and under the cell. */
  cube: string[]
  cubeNote: string[]
  cubeSide: string[]
  /** Scene 3 (photo ring). */
  ring: string[]
  ringNote: string[]
  ringSide: string[]
  /** Scene 4 (double-sided print). */
  print: string[]
  printNote: string[]
}

export interface GuidelineFanPreloaderProps {
  /** Scene 1 wordmark. One word per line; pass "\n" to choose the breaks yourself. */
  text?: string
  /** Scene 3 title, set in two lines beside the white cell. */
  title?: string
  /** Scene 4 headline: three short words that pop in one after the other. */
  headline?: string
  /** How many of the four scenes to play: 1 (3.3 s) to 4 (18.6 s). */
  scenes?: number
  /** Run the reel over and over. Set false to play once, pan away and reveal the children. */
  loop?: boolean
  /** Seconds for one pass of the sequence, its closing pan included. Unset, it runs at the reference's own pace. */
  duration?: number
  /** With loop off: fires once, when the overlay has left the screen. */
  onComplete?: () => void
  /** With loop off: the page underneath, in place from the start and revealed by the exit. */
  children?: React.ReactNode
  /** Seven square pictures. Index 3 leads the fan and fronts the print; the same seven build the cube and the ring. */
  images?: string[]
  /** Small print. Any key left out keeps its default. */
  labels?: Partial<GuidelineFanPreloaderLabels>
  /** Word printed before the counter ("LOADING 064"). Pass "" to drop the counter. */
  counterLabel?: string
  /** Badge beside the pin, and the smaller word after it. */
  place?: string
  region?: string
  /** Colours. Unset, they follow the built-in light and dark palettes. */
  paper?: string
  ink?: string
  accent?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Stylesheet for Anton and Montserrat. Pass null if the host already has them. */
  fontHref?: string | null
  className?: string
}

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@300;400&display=swap"
const IMG_BASE = "https://kedhar-components.pages.dev/guideline-fan-preloader/"
const IMAGES = ["sheep", "temple", "arches", "tower", "bicycle", "croissants", "cloth"].map(function (n) {
  return IMG_BASE + n + ".webp"
})
const LABELS: GuidelineFanPreloaderLabels = {
  top: ["Vol. 2026", "Reel / Stills", "Plate 01"],
  bottom: ["Opening reel", "Seven plates"],
  cube: ["Box set", "Six faces", "Plate 02"],
  cubeNote: ["Turned in 3D"],
  cubeSide: ["Print room", "Stills / Volume", "Take 02"],
  ring: ["Five frames", "Plate 03", "Ring series"],
  ringNote: ["Slow turn", "Take 03"],
  ringSide: ["Turned in 3D", "Orbit / Loop"],
  print: ["Both sides", "Plate 04", "One print"],
  printNote: ["Front / Back", "Mounted"],
}

// #region timeline
// Every number here was read off the reference, frame by frame, on its
// 720 x 540 canvas at 30 fps. Times are reference seconds; lengths are
// reference pixels (one "u").
//
//   scene 1   0 - 3.27     guides, wordmark, photo fan, sweep
//   scene 2   3.27 - 8.0   photo flurry, red cell, a turning object
//   scene 3   8.0 - 12.63  inverted: white cell, an object pops in, zoom
//   scene 4   12.63 - 18.4 three words, then an object slides in and spins
//
// The reference turns a chair, a croissant and a bicycle in those three
// cells. Here the same slots, sizes and turns are played by solids built
// from the photos: a cube, a ring of five frames and a double-sided print.
//
// GFP_ENDS[n - 1] is where the closing pan starts when n scenes are played.
export const GFP_ENDS = [3.167, 7.9, 12.55, 18.4]
export const GFP_EXIT = 0.15
export const GFP_TOTAL = 18.55
// The pose the reduced-motion path holds: guides open, fan spread.
export const GFP_REST = 2.2
const GFP_MAX = 234 // largest card edge reached (the lead card's overshoot)

export function gfpLength(scenes: number) {
  return GFP_ENDS[Math.min(4, Math.max(1, Math.round(scenes))) - 1] + GFP_EXIT
}

function gfpClamp(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}
function gfpOut(v: number) {
  const u = 1 - gfpClamp(v)
  return 1 - u * u * u
}
function gfpInOut(v: number) {
  const u = gfpClamp(v)
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2
}
function gfpMix(a: number, b: number, p: number) {
  return a + (b - a) * p
}
// Rows are [time, value, value, ...]; linear between rows, clamped outside.
function gfpTrack(rows: number[][], t: number) {
  let r = 0
  while (r < rows.length - 2 && t >= rows[r + 1][0]) r++
  const a = rows[r]
  const b = rows[r + 1]
  const p = gfpClamp((t - a[0]) / (b[0] - a[0]))
  const out = []
  for (let i = 1; i < a.length; i++) out.push(gfpMix(a[i], b[i], p))
  return out
}

// Scene 1. Fan: x offset and edge of each card, left to right.
const GFP_FAN = [
  [-235, 120],
  [-157, 150],
  [-83, 180],
  [0, 210],
  [87, 180],
  [171, 150],
  [250, 120],
]
// Staircase: how far each card rises (negative) or drops, then [start, length, eased-in?].
const GFP_STEP = [36, -43, -111, -53, 25, 70, 111]
const GFP_WAVE = [
  [2.54, 0.1, 1],
  [2.5, 0.14, 1],
  [2.495, 0.16, 0],
  [2.435, 0.12, 0],
  [2.493, 0.12, 0],
  [2.475, 0.12, 0],
  [2.45, 0.12, 0],
]
// Sweep: the stack swings over the top and leaves to the right. One row per
// measured frame: time, then x, y, edge for each of the seven cards.
const GFP_SWEEP = [
  [2.833, -235, 36, 120, -157, -43, 150, -83, -111, 180, 0, -53, 210, 87, 25, 180, 171, 70, 150, 250, 111, 120],
  [2.9, -235, 36, 120, -157, -43, 150, -83, -110, 180, 7, -58, 210, 101, 6, 181, 203, 83, 154, 274, 143, 120],
  [2.967, -209, -21, 126, -134, -89, 153, -45, -139, 187, 67, -50, 207, 155, 27, 181, 245, 115, 157, 303, 192, 125],
  [3.0, -172, -82, 129, -91, -126, 155, 4, -120, 192, 106, -18, 204, 185, 57, 179, 272, 134, 157, 325, 211, 118],
  [3.033, -112, -150, 131, -21, -120, 154, 50, -72, 193, 146, 23, 195, 217, 88, 172, 303, 150, 150, 360, 210, 115],
  [3.067, -13, -170, 128, 46, -69, 148, 98, -8, 188, 190, 69, 182, 254, 120, 163, 330, 170, 140, 390, 215, 105],
  [3.1, 82, -112, 118, 111, -5, 134, 150, 59, 172, 239, 113, 162, 300, 140, 145, 365, 180, 125, 420, 215, 95],
  [3.133, 161, -29, 101, 178, 58, 114, 211, 121, 148, 296, 147, 138, 350, 165, 120, 405, 185, 105, 455, 215, 80],
  [3.167, 234, 58, 81, 250, 112, 91, 285, 161, 118, 360, 157, 110, 405, 175, 95, 450, 190, 82, 495, 215, 65],
  [3.2, 339, 130, 58, 355, 150, 64, 380, 165, 90, 430, 165, 80, 465, 180, 70, 505, 195, 60, 540, 215, 48],
  [3.233, 440, 160, 30, 450, 170, 34, 465, 175, 50, 500, 175, 45, 530, 185, 40, 560, 200, 35, 590, 215, 28],
]

// Scenes 2 to 4. Guide tracks: time, left guide, right guide, top guide, bottom guide.
const GFP_G2 = [
  [3.267, 237, 482, 179, 361],
  [4.6, 237, 482, 179, 361],
  [4.667, 235, 484, 177, 363],
  [4.767, 227, 492, 171, 369],
  [4.867, 223, 496, 168, 372],
  [4.967, 221, 498, 167, 373],
  [5.167, 220, 499, 166, 375],
  [5.5, 219, 500, 165, 375],
  [6.5, 217, 502, 164, 376],
  [7.9, 214, 505, 162, 379],
  [8, 214, 505, 162, 379],
]
const GFP_G3 = [
  [8, 244, 475, 193, 366],
  [8.7, 244, 475, 193, 366],
  [8.767, 238, 480, 185, 370],
  [8.9, 215, 497, 161, 389],
  [9.033, 208, 503, 153, 395],
  [9.167, 204, 505, 149, 398],
  [9.433, 202, 506, 146, 398],
  [10, 201, 507, 143, 397],
  [11.033, 200, 509, 140, 396],
  [11.167, 213, 496, 156, 383],
  [11.3, 222, 487, 167, 373],
  [11.433, 225, 484, 171, 369],
  [11.7, 225, 483, 172, 369],
  [11.833, 196, 537, 146, 391],
  [11.967, 177, 572, 129, 406],
  [12.1, 169, 586, 123, 412],
  [12.233, 166, 592, 119, 414],
  [12.5, 165, 593, 119, 415],
  [12.633, 168, 589, 121, 413],
]
const GFP_G4 = [
  [12.633, 44, 676, 34, 507],
  [12.7, 133, 585, 101, 439],
  [12.767, 154, 564, 117, 423],
  [12.833, 164, 555, 125, 415],
  [12.9, 171, 548, 130, 411],
  [13.033, 175, 543, 133, 407],
  [13.167, 179, 540, 135, 405],
  [13.233, 186, 533, 140, 400],
  [13.3, 197, 522, 148, 392],
  [13.367, 216, 503, 162, 377],
  [13.433, 221, 497, 167, 373],
  [13.567, 234, 485, 177, 363],
  [13.7, 237, 482, 179, 361],
  [14.233, 237, 482, 179, 361],
  [14.367, 237, 531, 167, 361],
  [14.5, 237, 608, 150, 361],
  [14.633, 237, 623, 147, 361],
  [14.9, 237, 623, 147, 361],
  [15.033, 190, 623, 131, 388],
  [15.167, 118, 623, 108, 430],
  [15.3, 105, 621, 104, 437],
  [15.433, 113, 609, 107, 435],
  [15.567, 127, 587, 112, 432],
  [15.7, 143, 561, 118, 427],
  [15.833, 161, 534, 125, 423],
  [15.967, 176, 510, 131, 419],
  [16.1, 187, 493, 135, 416],
  [16.233, 192, 486, 136, 415],
  [16.367, 176, 502, 124, 428],
  [16.5, 157, 530, 109, 446],
  [16.633, 142, 559, 97, 459],
  [16.767, 130, 590, 88, 471],
  [16.9, 121, 618, 80, 481],
  [17.033, 113, 641, 74, 488],
  [17.167, 109, 655, 71, 492],
  [17.3, 113, 651, 74, 488],
  [17.433, 133, 627, 92, 465],
  [17.567, 143, 614, 105, 446],
  [17.7, 150, 605, 115, 428],
  [17.833, 155, 597, 124, 411],
  [17.967, 159, 592, 132, 397],
  [18.1, 161, 588, 137, 387],
  [18.233, 162, 586, 139, 384],
  [19, 162, 586, 139, 384],
]
// Flurry: one photo's flight from the bottom-left corner to the centre of
// the cell. Seconds since its start, then x, y from the centre, and edge.
const GFP_FLY = [
  [0, -390, 290, 60],
  [0.067, -300, 250, 110],
  [0.133, -246, 228, 130],
  [0.167, -195, 210, 180],
  [0.2, -110, 204, 170],
  [0.233, -88, 177, 174],
  [0.267, -63, 141, 150],
  [0.3, -36, 105, 120],
  [0.333, -18, 72, 90],
  [0.367, -3, 42, 45],
  [0.4, 4, 15, 20],
  [0.433, 0, 0, 0],
]
// Which card flies when (seconds after 3.433), and how it stacks.
const GFP_FLOCK = [
  [6, 0, 60],
  [5, 0.2, 50],
  [4, 0.3, 40],
  [3, 0.42, 30],
  [2, 0.55, 70],
  [0, 0.68, 80],
]
// Scene 4 object: time, x, y of its centre on the canvas.
const GFP_RIDE = [
  [13.7, 436, 259],
  [14.9, 436, 259],
  [15, 428, 259],
  [15.1, 406, 259],
  [15.2, 368, 259],
  [15.3, 352, 259],
  [15.6, 342, 262],
  [16.6, 338, 264],
  [17, 353, 266],
  [17.2, 385, 264],
  [17.4, 372, 252],
  [17.6, 373, 258],
  [18, 374, 262],
  [19, 374, 262],
]
// Scene 4 object: time, yaw, pitch, roll in degrees, scale. Yaw 0 is face-on
// (the reference's bicycle seen from the side). It swings to -128 and holds
// while the view zooms, comes edge-on at 17.0 s, whips through face-on in a
// tenth of a second, passes edge-on again at 17.44 s and settles at 180,
// showing its other side. Yaw was read from the width of the bicycle frame's
// silhouette (207 px side-on), tracked on every third reference frame.
const GFP_SPIN = [
  [15.4, 0, 0, 0, 1],
  [15.5, -61, 9, 4, 1],
  [15.6, -88, 11, 8, 1],
  [15.7, -108, 11, 10, 1],
  [15.8, -116, 11, 11, 1],
  [15.9, -121, 11, 11, 1],
  [16, -125, 11, 11, 1],
  [16.3, -128, 11, 11, 1],
  [16.4, -126, 12, 11, 1.12],
  [16.6, -121.5, 13, 11, 1.3],
  [16.8, -113, 14, 10, 1.44],
  [16.9, -106, 15, 8, 1.52],
  [17, -92, 17, 5, 1.6],
  [17.1, -75, 20, 2, 1.66],
  [17.2, -58, 23, -2, 1.58],
  [17.25, 0, 24, -4, 1.46],
  [17.3, 66, 22, -4, 1.45],
  [17.4, 74, 16, -3, 1.3],
  [17.44, 90, 13, -3, 1.24],
  [17.5, 131, 9, -2, 1.16],
  [17.6, 148, 5, -1, 1.12],
  [17.7, 162, 2, 0, 1.12],
  [17.8, 168, 1, 0, 1.12],
  [18, 180, 0, 0, 1.12],
  [19, 180, 0, 0, 1.12],
]

export function gfpPose(t: number, scenes?: number) {
  const n = Math.min(4, Math.max(1, Math.round(scenes === undefined ? 4 : scenes)))
  const end = GFP_ENDS[n - 1]
  // Cuts fall on reference frames 99, 241 and 380 (30 fps).
  const scene = t < 3.2666 || n === 1 ? 1 : t < 7.9999 || n === 2 ? 2 : t < 12.633 || n === 3 ? 3 : 4

  let v0 = 0
  let v1 = 0
  let h0 = 0
  let h1 = 0
  let ox = 0
  let oy = 0
  let zoom = 1
  let label = 0
  let late = false
  const cards = []
  for (let i = 0; i < 7; i++) cards.push({ x: 0, y: 0, k: 0, o: 0, z: 0, px: 0, py: 0 })
  const block = { k: 0, o: 0 }
  const obj = { kind: 0, o: 0, yaw: 0, pitch: 0, roll: 0, spin: 0, s: 0, cx: 50, cy: 50, dx: 0, dy: 0 }
  const words = [0, 0, 0]

  if (scene === 1) {
    // Guides. The right guide slides in and settles, then the frame opens.
    const open = gfpOut((t - 0.533) / 0.3)
    const slide = 61.3 - 28.5 * Math.exp(-Math.max(0, t) / 0.085)
    v1 = gfpMix(slide, 76.5, open)
    v0 = 11.5 - (1 - open) * 16
    h0 = gfpMix(33.5, 13, open)
    h1 = gfpMix(67.2, 85.7, open)
    label = gfpMix(15.3, 12.2, open)
    for (let i = 0; i < 7; i++) {
      const ring = Math.abs(i - 3)
      const c = cards[i]
      let s = GFP_FAN[i][1]
      if (i === 3) {
        // Lead card: pops in at half size, overshoots, settles.
        c.o = t >= 1.3 ? 1 : 0
        let k = gfpClamp((t - 1.3) / 0.033) * 0.5
        if (t > 1.333) k = gfpMix(0.5, 1.114, gfpOut((t - 1.333) / 0.2))
        if (t > 1.63) k = gfpMix(1.114, 1, gfpInOut((t - 1.63) / 0.12))
        s = 210 * k
        c.y = -2
      } else {
        // Side cards wait behind the lead card, then fan out ring by ring.
        c.o = t >= 1.68 ? 1 : 0
        c.x = GFP_FAN[i][0] * gfpOut((t - (1.7 + 0.04 * (ring - 1))) / 0.27)
      }
      if (t >= 2.833) {
        const row = gfpTrack(GFP_SWEEP, t)
        c.x = row[i * 3]
        c.y = row[i * 3 + 1]
        s = row[i * 3 + 2]
      } else if (t > 2.4) {
        const w = GFP_WAVE[i]
        const p = (t - w[0]) / w[1]
        c.y = gfpMix(c.y, GFP_STEP[i], w[2] ? gfpInOut(p) : gfpOut(p))
      }
      // Stacking order flips twice on the way, as it does in the reference.
      c.z = 70 - ring * 10
      if (i === 6 && t >= 2.5) c.z = 55
      if (i === 0 && t >= 2.55 && t < 2.95) c.z = 55
      if (t >= 2.88) {
        if (i === 5) c.z = 62
        if (i === 6) c.z = 64
      }
      c.k = s / GFP_MAX
    }
    // Wide screens are wider than the reference canvas. This is the share of
    // that extra half-width added to every card's x, so the stack still
    // clears the right edge on the same frame.
    const push = Math.min(1.5, Math.max(0, cards[3].x / 360))
    for (let i = 0; i < 7; i++) cards[i].px = push
    // Hand-off to scene 2: a whip pan to the left, then a cut.
    if (n > 1 && t > 3.167) ox = -720 * Math.pow(gfpClamp((t - 3.167) / 0.15), 2.3)
  } else {
    const g = gfpTrack(scene === 2 ? GFP_G2 : scene === 3 ? GFP_G3 : GFP_G4, t)
    v0 = g[0] / 7.2
    v1 = g[1] / 7.2
    h0 = g[2] / 5.4
    h1 = g[3] / 5.4
    const cx = (v0 + v1) / 2
    const cy = (h0 + h1) / 2
    if (scene === 2) {
      zoom = (g[1] - g[0]) / 245
      // Arrives on the tail of the whip pan; leaves on a pan downwards.
      ox = 73 * Math.exp(-(t - 3.267) / 0.037)
      if (n > 2 && t > 7.9) oy = 163 * Math.pow((t - 7.9) / 0.15, 2)
      for (let f = 0; f < GFP_FLOCK.length; f++) {
        const local = t - 3.433 - GFP_FLOCK[f][1]
        if (local < 0 || local >= 0.433) continue
        const row = gfpTrack(GFP_FLY, local)
        const c = cards[GFP_FLOCK[f][0]]
        c.x = row[0]
        c.y = row[1]
        c.k = row[2] / GFP_MAX
        c.o = 1
        c.z = GFP_FLOCK[f][2]
        c.px = Math.max(-1.2, Math.min(0, row[0] / 360))
        c.py = Math.max(0, Math.min(1.2, row[1] / 270))
      }
      // The last photo shrinks to a dot; the dot grows into the red cell.
      block.k = Math.pow(gfpClamp((t - 4.55) / 0.19), 1.4)
      block.o = t >= 4.55 ? 1 : 0
      obj.kind = 1
      obj.o = gfpClamp((t - 4.79) / 0.07)
      obj.yaw = -75 + 17 * (t - 4.8)
      obj.pitch = 20
      obj.s = 150 * zoom
      obj.cx = cx
      obj.cy = cy
      obj.dy = 6 * zoom
    } else if (scene === 3) {
      zoom = (g[1] - g[0]) / 231
      // Drops in from above and settles.
      oy = -177 * Math.exp(-(t - 8) / 0.07)
      block.k = 1
      block.o = 1
      // The ring pops in oversized, holds, then settles into the cell.
      let k = gfpMix(0.5, 1.32, gfpOut((t - 9.13) / 0.07))
      if (t > 9.2) k = gfpMix(1.32, 1.25, gfpClamp((t - 9.2) / 0.2))
      if (t > 9.4) k = gfpMix(1.25, 1, gfpInOut((t - 9.4) / 0.22))
      obj.kind = 2
      obj.o = t >= 9.13 ? 1 : 0
      const late3 = gfpInOut((t - 10.9) / 1.4)
      obj.roll = gfpMix(gfpMix(-16, -8, gfpOut((t - 9.13) / 0.5)), -5, late3)
      obj.yaw = -30 + 38 * (t - 9.13)
      obj.pitch = 18
      obj.s = 72 * zoom * k * gfpMix(1, 0.92, late3)
      obj.dx = gfpMix(4, -8, late3)
      obj.cx = cx
      obj.cy = cy
      obj.dy = 3 * zoom
    } else {
      late = t >= 13.3999
      zoom = t < 14.233 ? (g[1] - g[0]) / 245 : 1
      for (let i = 0; i < 3; i++) words[i] = late ? 1 : gfpClamp((t - 12.633 - 0.055 * i) / 0.05)
      // A bright block strobes in the cell after the cut: on for one reference
      // frame, off for the next. The reference flashes four times; this stops at
      // three, the most WCAG 2.3.1 allows inside one second.
      const flash = Math.floor((t - 13.4333) * 30 + 0.001)
      block.k = 1
      block.o = flash >= 0 && flash <= 4 && flash % 2 === 0 ? 1 : 0
      const spin = gfpTrack(GFP_SPIN, t)
      const ride = gfpTrack(GFP_RIDE, t)
      if (t >= 16.3) zoom = 1 + (spin[3] - 1) * 0.7
      obj.kind = 3
      obj.o = t >= 13.7 ? 1 : 0
      obj.yaw = spin[0]
      obj.pitch = spin[1]
      obj.roll = spin[2]
      obj.s = 170 * spin[3]
      // Slides in from the right and settles (time constant 0.1 s).
      obj.cx = (ride[0] + 117 * Math.exp(-(t - 13.9) / 0.1)) / 7.2
      obj.cy = ride[1] / 5.4
    }
  }

  return {
    scene: scene,
    late: late,
    v0: v0,
    v1: v1,
    h0: h0,
    h1: h1,
    ox: ox,
    oy: oy,
    zoom: zoom,
    label: label,
    pin: gfpClamp((t - 0.9) / 0.07),
    place: gfpClamp((t - 0.95) / 0.08),
    cards: cards,
    push: cards[3].px,
    block: block,
    obj: obj,
    words: words,
    // Closing whip pan: it hands back to scene 1 when the reel loops, and
    // reveals the page when it does not. It goes left, except after the last
    // scene, where the reference pans right.
    pan: Math.pow(gfpClamp((t - end) / GFP_EXIT), 2.3),
    dir: n === 4 ? 1 : -1,
    percent: Math.floor(gfpClamp(t / end) * 100),
  }
}
// #endregion

// #region turn
// The solids are CSS 3D boxes; this is the one rotation they all share, so
// the turn and the light on each face come from the same matrix.
// Row-major 3 x 3: pitch about x, roll about z, yaw about y, then a spin
// about the model's own x axis. Degrees in.
export function gfpTurn(pitch: number, roll: number, yaw: number, spin: number) {
  const r = Math.PI / 180
  const mul = function (a: number[], b: number[]) {
    const o = []
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j])
    return o
  }
  const rx = function (d: number) {
    const c = Math.cos(d * r)
    const s = Math.sin(d * r)
    return [1, 0, 0, 0, c, -s, 0, s, c]
  }
  const cy = Math.cos(yaw * r)
  const sy = Math.sin(yaw * r)
  const cz = Math.cos(roll * r)
  const sz = Math.sin(roll * r)
  return mul(mul(mul(rx(pitch), [cz, -sz, 0, sz, cz, 0, 0, 0, 1]), [cy, 0, sy, 0, 1, 0, -sy, 0, cy]), rx(spin))
}
// #endregion

const U = "var(--gfp-u)"
function u(n: number) {
  return "calc(" + n + " * " + U + ")"
}
function q(n: number) {
  return "calc(" + n + " * var(--q))"
}
const FROM_RIGHT_0 = "calc(100cqw - var(--x0) + "
const FROM_RIGHT_1 = "calc(100cqw - var(--x1) + "
const FROM_BOTTOM_0 = "calc(100cqh - var(--y0) + "
const FROM_BOTTOM_1 = "calc(100cqh - var(--y1) + "
// Left edge for a label in the right-hand column: its guide plus a margin,
// pulled back just enough to stay on screen in a narrow column.
function right(n: number) {
  return "min(calc(var(--x1) + " + q(n) + "),calc(100cqw - 4px - var(--w,0px)))"
}
const SANS = "Montserrat,'Helvetica Neue',Arial,sans-serif"
const SLAB = "Anton,Impact,'Haettenschweiler','Arial Narrow Bold',sans-serif"

const CSS =
  ".gfp-root{position:relative;width:100%;overflow:hidden;container-type:size;--gfp-paper:#d8d8d8;--gfp-ink:#40262a;--gfp-accent:#bb3530;--gfp-dot:#0a0a0a}" +
  ".dark .gfp-root{--gfp-paper:#181516;--gfp-ink:#eadfd9;--gfp-accent:#d2473f;--gfp-dot:#f4eeea}" +
  ".gfp-page{position:absolute;inset:0;overflow:auto;z-index:1}" +
  ".gfp-ov{position:absolute;inset:0;z-index:2;overflow:hidden;background:var(--gfp-paper);color:var(--gfp-ink);" +
  "--gfp-u:min(calc(100cqh / 540),calc(100cqw / 720));--gfp-w:max(0px,calc(50cqw - 360 * var(--gfp-u)));--gfp-t:max(0px,calc(50cqh - 270 * var(--gfp-u)));" +
  "--gfp-deep:color-mix(in srgb,var(--gfp-accent) 62%,#4a0000);--gfp-flood:color-mix(in srgb,var(--gfp-accent) 78%,#8a0a00);" +
  "--gfp-line:color-mix(in srgb,var(--gfp-accent) 62%,var(--gfp-paper));will-change:transform}" +
  ".gfp-ov.gfp-s3{background:var(--gfp-flood);color:#f6ddd4;--gfp-line:rgba(255,236,228,.5);--gfp-dot:rgba(255,236,228,.9)}" +
  ".gfp-ov.gfp-s4{--gfp-dot:var(--gfp-accent)}" +
  ".gfp-stage{position:absolute;inset:0;opacity:0;--v0:0;--v1:0;--h0:0;--h1:0;--z:1;--lx:0;--bk:0;--bo:0;" +
  "--x0:round(nearest,calc(var(--v0) * 1cqw),1px);--x1:round(nearest,calc(var(--v1) * 1cqw),1px);" +
  "--y0:round(nearest,calc(var(--h0) * 1cqh),1px);--y1:round(nearest,calc(var(--h1) * 1cqh),1px);" +
  "--q:calc(var(--z) * var(--gfp-u));--lw:max(1px,round(nearest,var(--q),1px));--dot:max(4px,round(nearest," + q(5) + ",2px))}" +
  ".gfp-on .gfp-stage{opacity:1}" +
  ".gfp-s3 .gfp-stage{--q:var(--gfp-u);--lw:max(1px,round(nearest," + u(1) + ",1px));--dot:max(2px,round(nearest," + u(3) + ",2px))}" +
  ".gfp-s4 .gfp-stage{--dot:max(6px,round(nearest," + q(11) + ",2px))}" +
  ".gfp-v,.gfp-h,.gfp-dot,.gfp-cell,.gfp-ph,.gfp-block,.gfp-label,.gfp-wm,.gfp-badge,.gfp-title,.gfp-big,.gfp-small{position:absolute}" +
  ".gfp-v{top:-100cqh;height:300cqh;width:var(--lw);margin-left:calc(round(down,var(--lw) / 2,1px) * -1);" +
  "background:repeating-linear-gradient(to bottom,var(--gfp-line) 0,var(--gfp-line) " + q(4) + ",transparent " + q(4) + ",transparent " + q(8) + ")}" +
  ".gfp-h{left:-100cqw;width:300cqw;height:var(--lw);margin-top:calc(round(down,var(--lw) / 2,1px) * -1);" +
  "background:repeating-linear-gradient(to right,var(--gfp-line) 0,var(--gfp-line) " + q(4) + ",transparent " + q(4) + ",transparent " + q(8) + ")}" +
  ".gfp-s3 .gfp-v,.gfp-s3 .gfp-h{background:var(--gfp-line)}" +
  ".gfp-v0{left:var(--x0)}.gfp-v1{left:var(--x1)}.gfp-h0{top:var(--y0)}.gfp-h1{top:var(--y1)}" +
  ".gfp-dot{width:var(--dot);height:var(--dot);margin:calc(var(--dot) / -2) 0 0 calc(var(--dot) / -2);border-radius:50%;background:var(--gfp-dot)}" +
  ".gfp-d00{left:var(--x0);top:var(--y0)}.gfp-d01{left:var(--x0);top:var(--y1)}.gfp-d10{left:var(--x1);top:var(--y0)}.gfp-d11{left:var(--x1);top:var(--y1)}" +
  ".gfp-cell{display:none;overflow:hidden}" +
  ".gfp-tl{left:0;top:0;width:var(--x0);height:var(--y0)}.gfp-br{left:var(--x1);top:var(--y1);right:0;bottom:0}" +
  ".gfp-tr{left:var(--x1);top:0;right:0;height:var(--y0)}.gfp-bl{left:0;top:var(--y1);width:var(--x0);bottom:0}" +
  ".gfp-s2 .gfp-tl,.gfp-s2 .gfp-br,.gfp-s4 .gfp-tl,.gfp-s4 .gfp-br,.gfp-s3 .gfp-tr,.gfp-s3 .gfp-bl{display:block}" +
  ".gfp-ph{inset:0;overflow:hidden;isolation:isolate}" +
  ".gfp-ph img,.gfp-card img{display:block;width:100%;height:100%;max-width:none;object-fit:cover}" +
  ".gfp-mono img{filter:grayscale(1) contrast(1.08)}" +
  ".gfp-cream::after,.gfp-duo::after{content:'';position:absolute;inset:0;mix-blend-mode:multiply}" +
  ".gfp-cream::after{background:#f6f3da}" +
  ".gfp-duo{background:#5c070a}.gfp-duo img{filter:grayscale(1) contrast(1.75) brightness(.82);mix-blend-mode:screen}.gfp-duo::after{background:#f0aaa4}" +
  ".gfp-red img{filter:brightness(.74) contrast(1.3) saturate(1.1)}" +
  ".gfp-late .gfp-a,.gfp-b{display:none}.gfp-late .gfp-b{display:block}" +
  ".gfp-block{display:none;left:calc(var(--x0) + (var(--x1) - var(--x0)) * (1 - var(--bk)) / 2);top:calc(var(--y0) + (var(--y1) - var(--y0)) * (1 - var(--bk)) / 2);" +
  "width:calc((var(--x1) - var(--x0)) * var(--bk));height:calc((var(--y1) - var(--y0)) * var(--bk));background:var(--gfp-deep);opacity:var(--bo)}" +
  ".gfp-s2 .gfp-block,.gfp-s3 .gfp-block,.gfp-s4 .gfp-block{display:block}" +
  ".gfp-s3 .gfp-block{background:#fff}.gfp-s4 .gfp-block{background:var(--gfp-accent)}" +
  ".gfp-solid{position:absolute;display:none;width:0;height:0;left:calc(var(--ox) * 1cqw + var(--odx) * var(--gfp-u));top:calc(var(--oy) * 1cqh + var(--ody) * var(--gfp-u));" +
  "--ox:50;--oy:50;--odx:0;--ody:0;--os:100;--oo:1;--e:calc(var(--os) * var(--gfp-u));perspective:calc(var(--e) * 5.5);opacity:var(--oo);pointer-events:none}" +
  ".gfp-as1,.gfp-as2,.gfp-as3{display:block}" +
  ".gfp-form,.gfp-shape{position:absolute;left:0;top:0;transform-style:preserve-3d}" +
  ".gfp-shape{display:none}.gfp-as1 .gfp-cube,.gfp-as2 .gfp-ring,.gfp-as3 .gfp-plate{display:block}" +
  ".gfp-face,.gfp-edge{position:absolute;left:0;top:0;width:var(--e);height:var(--e);margin:calc(var(--e) / -2) 0 0 calc(var(--e) / -2);box-sizing:border-box;overflow:hidden;" +
  "backface-visibility:hidden;background:var(--gfp-deep)}" +
  ".gfp-face img{display:block;width:100%;height:100%;max-width:none;object-fit:cover}" +
  ".gfp-x0{transform:translateZ(calc(var(--e) / 2))}.gfp-x1{transform:rotateY(90deg) translateZ(calc(var(--e) / 2))}" +
  ".gfp-x2{transform:rotateY(180deg) translateZ(calc(var(--e) / 2))}.gfp-x3{transform:rotateY(-90deg) translateZ(calc(var(--e) / 2))}" +
  ".gfp-x4{transform:rotateX(90deg) translateZ(calc(var(--e) / 2))}.gfp-x5{transform:rotateX(-90deg) translateZ(calc(var(--e) / 2))}" +
  ".gfp-ring .gfp-face{height:calc(var(--e) * 1.6);margin-top:calc(var(--e) * -.8);backface-visibility:visible}" +
  ".gfp-r0{transform:translateZ(calc(var(--e) * .9))}.gfp-r1{transform:rotateY(72deg) translateZ(calc(var(--e) * .9))}" +
  ".gfp-r2{transform:rotateY(144deg) translateZ(calc(var(--e) * .9))}.gfp-r3{transform:rotateY(216deg) translateZ(calc(var(--e) * .9))}" +
  ".gfp-r4{transform:rotateY(288deg) translateZ(calc(var(--e) * .9))}" +
  ".gfp-plate .gfp-face{width:calc(var(--e) * 1.5);margin-left:calc(var(--e) * -.75);border:calc(var(--e) * .035) solid #efe9dc}" +
  ".gfp-plate .gfp-face img{object-position:50% 28%}" +
  ".gfp-p0{transform:translateZ(calc(var(--e) * .02))}.gfp-p1{transform:rotateY(180deg) translateZ(calc(var(--e) * .02))}" +
  ".gfp-edge{background:#d9d2c3;backface-visibility:visible}" +
  ".gfp-e0,.gfp-e1{width:calc(var(--e) * .04);margin-left:calc(var(--e) * -.02)}" +
  ".gfp-e2,.gfp-e3{width:calc(var(--e) * 1.5);margin-left:calc(var(--e) * -.75);height:calc(var(--e) * .04);margin-top:calc(var(--e) * -.02)}" +
  ".gfp-e0{transform:rotateY(90deg) translateZ(calc(var(--e) * .75))}.gfp-e1{transform:rotateY(-90deg) translateZ(calc(var(--e) * .75))}" +
  ".gfp-e2{transform:rotateX(90deg) translateZ(calc(var(--e) / 2))}.gfp-e3{transform:rotateX(-90deg) translateZ(calc(var(--e) / 2))}" +
  ".gfp-g{display:none}.gfp-s1 .gfp-g1,.gfp-s2 .gfp-g2,.gfp-s3 .gfp-g3,.gfp-s4.gfp-late .gfp-g4{display:block}" +
  ".gfp-label{margin:0;white-space:nowrap;text-transform:uppercase;font-family:" + SANS + ";font-weight:400;font-size:max(8px," + q(13) + ");" +
  "line-height:1.1;letter-spacing:.01em;font-variant-numeric:tabular-nums}" +
  ".gfp-label span,.gfp-wm span,.gfp-title span,.gfp-big span,.gfp-small span{display:block}" +
  ".gfp-label .gfp-n{display:inline}" +
  ".gfp-g2 .gfp-label{line-height:1.15}" +
  ".gfp-g3 .gfp-label{font-size:max(8px," + q(12.5) + ");line-height:1.12}" +
  ".gfp-g4 .gfp-label{font-size:max(7px," + q(10) + ");line-height:1.45}" +
  ".gfp-r{text-align:right}" +
  ".gfp-top{left:calc(var(--lx) * 1cqw);bottom:" + FROM_BOTTOM_0 + u(9) + ")}" +
  ".gfp-bot{right:" + FROM_RIGHT_1 + u(10) + ");top:calc(var(--y1) + " + u(8) + ")}" +
  ".gfp-badge{left:calc(var(--x0) + " + u(5) + ");top:calc(var(--y1) + " + u(16) + ");display:flex;align-items:baseline;white-space:nowrap;text-transform:uppercase;" +
  "font-family:" + SANS + ";font-weight:300;line-height:1}" +
  ".gfp-pin{flex:none;align-self:center;width:max(11px," + u(20) + ");height:max(14px," + u(26) + ");margin-right:" + u(5) + ";fill:var(--gfp-accent)}" +
  ".gfp-place{font-size:max(17px," + u(31) + ");letter-spacing:-.085em;margin-right:.16em}" +
  ".gfp-region{font-size:max(8px," + u(15) + ");letter-spacing:-.09em}" +
  ".gfp-wm,.gfp-title,.gfp-big,.gfp-small{margin:0;white-space:nowrap;text-transform:uppercase;font-family:" + SLAB + ";font-weight:400;letter-spacing:-.035em;color:var(--gfp-accent)}" +
  ".gfp-wm{left:calc(var(--x1) + " + u(3) + ");top:calc(var(--y0) - var(--gfp-fit) * " + u(64) + ");font-size:calc(var(--gfp-fit) * " + u(55) + ");line-height:calc(var(--gfp-fit) * " + u(48.5) + ")}" +
  ".gfp-c1{left:" + right(10) + ";bottom:" + FROM_BOTTOM_0 + q(8) + ")}" +
  ".gfp-c2{left:" + right(11) + ";top:calc(var(--y0) + " + q(35) + ")}" +
  ".gfp-c3{right:" + FROM_RIGHT_0 + q(12) + ");top:calc(var(--y1) - " + q(70) + ")}" +
  ".gfp-c4{right:" + FROM_RIGHT_0 + q(14) + ");top:calc(var(--y1) + " + q(11) + ")}" +
  ".gfp-title{right:" + FROM_RIGHT_0 + q(5) + ");bottom:" + FROM_BOTTOM_1 + q(45) + ");text-align:right;color:#fff;transform:scaleX(.86);transform-origin:100% 50%;" +
  "font-size:calc(var(--gfp-fit3) * " + q(30) + ");line-height:calc(var(--gfp-fit3) * " + q(29) + ")}" +
  ".gfp-k1{right:" + FROM_RIGHT_0 + q(9) + ");bottom:" + FROM_BOTTOM_0 + q(5) + ")}" +
  ".gfp-k2{left:" + right(6) + ";top:calc(var(--y1) - " + q(124) + ")}" +
  ".gfp-k3{right:" + FROM_RIGHT_1 + q(8) + ");top:calc(var(--y1) + " + q(65) + ")}" +
  ".gfp-big{display:none;left:calc(var(--x0) + " + q(8) + ");top:calc(var(--y0) + " + q(3) + ");font-size:calc(var(--gfp-fit4) * " + q(64) + ");line-height:calc(var(--gfp-fit4) * " + q(57) + ")}" +
  ".gfp-s4 .gfp-big{display:block}.gfp-s4.gfp-late .gfp-big{display:none}" +
  ".gfp-small{right:" + FROM_RIGHT_0 + q(9) + ");bottom:" + FROM_BOTTOM_1 + q(6) + ");text-align:right;font-size:max(12px," + q(22) + ");line-height:1.09}" +
  ".gfp-b1{left:" + right(6) + ";bottom:" + FROM_BOTTOM_0 + q(6) + ")}" +
  ".gfp-b2{left:calc(var(--x0) + " + q(10) + ");top:calc(var(--y1) + " + q(28) + ")}" +
  ".gfp-card{position:absolute;left:50%;top:50%;width:" + u(GFP_MAX) + ";height:" + u(GFP_MAX) + ";margin:" + u(GFP_MAX / -2) + " 0 0 " + u(GFP_MAX / -2) + ";" +
  "overflow:hidden;opacity:0;background:color-mix(in srgb,var(--gfp-ink) 14%,var(--gfp-paper))}" +
  ".gfp-out{transition:opacity .4s linear;opacity:0}" +
  "@media (prefers-reduced-motion:reduce){.gfp-ov{will-change:auto}}"

function GfpLink(props: { href: string; onReady: () => void }) {
  return <link rel="stylesheet" href={props.href} onLoad={props.onReady} onError={props.onReady} />
}

function gfpLines(text: string) {
  const raw = text.indexOf("\n") > -1 ? text.split("\n") : text.split(/\s+/)
  return raw
    .map(function (l) {
      return l.trim()
    })
    .filter(Boolean)
}
// Anton averages 0.42 em a glyph at this tracking; a column holds "room"
// glyphs at full size, so longer words step the size down.
function gfpFit(lines: string[], room: number) {
  const longest = lines.reduce(function (m, l) {
    return Math.max(m, l.length)
  }, 1)
  return Math.min(1, room / longest)
}

export function GuidelineFanPreloader({
  text = "Slow North Studio",
  title = "Full Circle",
  headline = "Made to move",
  scenes = 4,
  loop = true,
  duration,
  onComplete,
  children,
  images = IMAGES,
  labels,
  counterLabel = "Loading",
  place = "OSL",
  region = "NOR",
  paper,
  ink,
  accent,
  height = "100svh",
  fontHref = FONT_HREF,
  className,
}: GuidelineFanPreloaderProps) {
  const [done, setDone] = React.useState(false)
  const ovRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const pageRef = React.useRef(null as HTMLDivElement | null)
  const solidRef = React.useRef(null as HTMLDivElement | null)
  const formRef = React.useRef(null as HTMLDivElement | null)
  const pinRef = React.useRef(null as SVGSVGElement | null)
  const placeRef = React.useRef(null as HTMLSpanElement | null)
  const cardEls = React.useRef([] as (HTMLDivElement | null)[])
  const wordEls = React.useRef([] as (HTMLSpanElement | null)[])
  const fontReady = React.useRef(null as (() => void) | null)
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete

  const copy = React.useMemo(
    function () {
      return Object.assign({}, LABELS, labels || {}) as GuidelineFanPreloaderLabels
    },
    [labels],
  )
  const mark = React.useMemo(
    function () {
      return gfpLines(text)
    },
    [text],
  )
  const titleLines = React.useMemo(
    function () {
      return gfpLines(title)
    },
    [title],
  )
  const bigLines = React.useMemo(
    function () {
      return gfpLines(headline).slice(0, 3)
    },
    [headline],
  )
  const pics = React.useMemo(
    function () {
      const out = []
      for (let i = 0; i < 7; i++) out.push(images[i % Math.max(1, images.length)] || IMAGES[i])
      return out
    },
    [images],
  )

  // The page is there from the first frame, but nobody should tab into it
  // while the overlay covers it.
  React.useEffect(
    function () {
      const page = pageRef.current
      if (page) page.toggleAttribute("inert", !done)
    },
    [done],
  )

  React.useEffect(
    function () {
      const ov = ovRef.current
      const stage = stageRef.current
      const solid = solidRef.current
      const form = formRef.current
      if (!ov || !stage || !solid || !form) return
      let alive = true
      let raf = 0
      let timer = 0
      let hold = 0
      let cls = ""
      let on = false
      const count = Math.min(4, Math.max(1, Math.round(scenes)))
      const total = gfpLength(count)
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const speed = total / Math.max(0.3, duration === undefined ? total : duration)
      const counters = ov.querySelectorAll(".gfp-n")

      // The three solids: each face carries its outward normal, so it can be
      // lit from the same matrix that turns it.
      let kind = -1
      const faces = [[], [], [], []] as { el: HTMLElement; n: number[]; base: number }[][]
      solid.querySelectorAll(".gfp-shape").forEach(function (shape, k) {
        shape.querySelectorAll(".gfp-face").forEach(function (el) {
          const n = (el.getAttribute("data-n") || "0,0,1").split(",").map(Number)
          faces[k + 1].push({ el: el as HTMLElement, n: n, base: k === 1 ? 0.56 : 0.66 })
        })
      })
      const turn = function (o: ReturnType<typeof gfpPose>["obj"]) {
        const show = o.kind > 0 && o.o > 0 ? o.kind : 0
        if (show !== kind) {
          kind = show
          solid.className = "gfp-solid" + (show ? " gfp-as" + show : "")
        }
        if (!show) return
        const css = solid.style
        css.setProperty("--ox", o.cx.toFixed(3))
        css.setProperty("--oy", o.cy.toFixed(3))
        css.setProperty("--odx", o.dx.toFixed(2))
        css.setProperty("--ody", o.dy.toFixed(2))
        css.setProperty("--os", o.s.toFixed(2))
        css.setProperty("--oo", o.o.toFixed(3))
        // gfpTurn works with y up; CSS has y down, so flip it on the way in and out.
        const m = gfpTurn(o.pitch, o.roll, o.yaw, o.spin)
        form.style.transform =
          "matrix3d(" +
          [m[0], -m[3], m[6], 0, -m[1], m[4], -m[7], 0, m[2], -m[5], m[8], 0, 0, 0, 0, 1]
            .map(function (v) {
              return v.toFixed(5)
            })
            .join(",") +
          ")"
        for (let i = 0; i < faces[show].length; i++) {
          const face = faces[show][i]
          const n = face.n
          const lit =
            (m[0] * n[0] + m[1] * n[1] + m[2] * n[2]) * -0.35 +
            (m[3] * n[0] + m[4] * n[1] + m[5] * n[2]) * 0.62 +
            (m[6] * n[0] + m[7] * n[1] + m[8] * n[2]) * 0.7
          face.el.style.filter = "brightness(" + (face.base + (1 - face.base) * Math.max(0, lit)).toFixed(3) + ")"
        }
      }

      const apply = function (t: number) {
        const p = gfpPose(t, count)
        const next = "gfp-ov gfp-s" + p.scene + (p.late ? " gfp-late" : "") + (on ? " gfp-on" : "")
        if (next !== cls) {
          cls = next
          ov.className = next
        }
        const s = stage.style
        s.setProperty("--v0", p.v0.toFixed(3))
        s.setProperty("--v1", p.v1.toFixed(3))
        s.setProperty("--h0", p.h0.toFixed(3))
        s.setProperty("--h1", p.h1.toFixed(3))
        s.setProperty("--z", p.zoom.toFixed(4))
        s.setProperty("--lx", p.label.toFixed(3))
        s.setProperty("--bk", p.block.k.toFixed(4))
        s.setProperty("--bo", p.block.o.toFixed(3))
        // Looping, the closing pan carries the stage off and scene 1 cuts in behind it;
        // played once, it carries the whole overlay off the page.
        const away = p.dir * 100 * p.pan
        const x = p.ox / 7.2 + (loop ? away : 0)
        s.transform = x || p.oy ? "translate3d(" + x.toFixed(3) + "cqw," + (p.oy / 5.4).toFixed(3) + "cqh,0)" : ""
        if (pinRef.current) pinRef.current.style.opacity = String(p.pin)
        if (placeRef.current) placeRef.current.style.opacity = String(p.place)
        for (let i = 0; i < 3; i++) {
          const w = wordEls.current[i]
          if (w) w.style.opacity = String(p.words[i])
        }
        for (let i = 0; i < 7; i++) {
          const el = cardEls.current[i]
          const c = p.cards[i]
          if (!el) continue
          el.style.opacity = String(c.o)
          el.style.zIndex = String(c.z)
          el.style.transform =
            "translate3d(calc(" + c.x.toFixed(2) + " * var(--gfp-u) + " + c.px.toFixed(3) + " * var(--gfp-w)),calc(" +
            c.y.toFixed(2) + " * var(--gfp-u) + " + c.py.toFixed(3) + " * var(--gfp-t)),0) scale(" + c.k.toFixed(4) + ")"
        }
        const pct = ("00" + p.percent).slice(-3)
        counters.forEach(function (el) {
          if (el.textContent !== pct) el.textContent = pct
        })
        ov.style.transform = !loop && p.pan > 0 ? "translate3d(" + away.toFixed(3) + "%,0,0)" : ""
        turn(p.obj)
      }
      const finish = function () {
        if (!alive) return
        setDone(true)
        if (onCompleteRef.current) onCompleteRef.current()
      }
      const begin = function () {
        if (!alive) return
        on = true
        if (reduce) {
          // No choreography: hold the open frame. Played once, it then fades.
          apply(GFP_REST)
          if (loop) return
          hold = window.setTimeout(function () {
            ov.classList.add("gfp-out")
            hold = window.setTimeout(finish, 420)
          }, Math.min(1600, (duration === undefined ? total : duration) * 1000))
          return
        }
        let t0 = performance.now()
        const tick = function (now: number) {
          let t = ((now - t0) / 1000) * speed
          if (t >= total) {
            if (!loop) {
              apply(total)
              finish()
              return
            }
            // Start the next pass where this one ran over, so the loop keeps time.
            const laps = Math.floor(t / total)
            t0 += (laps * total * 1000) / speed
            t -= laps * total
          }
          apply(t)
          raf = requestAnimationFrame(tick)
        }
        apply(0)
        raf = requestAnimationFrame(tick)
      }

      // Start on real type and real pictures, or after 2.5 s without them.
      apply(reduce ? GFP_REST : 0)
      const waits = [] as Promise<unknown>[]
      const fonts = document.fonts
      const typefaces = function (): Promise<unknown> {
        if (!fonts || !fonts.load) return Promise.resolve()
        return Promise.all([fonts.load("400 40px Anton"), fonts.load("400 12px Montserrat"), fonts.load("300 24px Montserrat")])
      }
      if (fontHref) {
        waits.push(
          new Promise(function (res) {
            fontReady.current = function () {
              res(null)
            }
            const link = ov.parentElement ? ov.parentElement.querySelector("link") : null
            if (link && (link as HTMLLinkElement).sheet) res(null)
          }).then(typefaces),
        )
      } else waits.push(typefaces())
      ov.querySelectorAll(".gfp-card img").forEach(function (img) {
        // decode(), not the load event: a loaded but undecoded picture would
        // pop in as an empty card.
        const pic = img as HTMLImageElement
        if (pic.decode) waits.push(pic.decode().catch(function () {}))
      })
      Promise.race([
        Promise.all(waits).catch(function () {}),
        new Promise(function (res) {
          timer = window.setTimeout(res, 2500)
        }),
      ]).then(begin)

      return function () {
        alive = false
        cancelAnimationFrame(raf)
        window.clearTimeout(timer)
        window.clearTimeout(hold)
      }
    },
    [duration, fontHref, scenes, loop],
  )

  const style = {
    height: height,
    "--gfp-fit": gfpFit(mark, 6.4),
    "--gfp-fit3": gfpFit(titleLines, 10),
    "--gfp-fit4": gfpFit(bigLines, 5.6),
  } as Record<string, string | number>
  if (paper) style["--gfp-paper"] = paper
  if (ink) style["--gfp-ink"] = ink
  if (accent) style["--gfp-accent"] = accent

  const spans = function (list: string[]) {
    return list.map(function (l, i) {
      return <span key={i}>{l}</span>
    })
  }
  const counter = counterLabel ? (
    <span>
      {counterLabel} <span className="gfp-n">000</span>
    </span>
  ) : null
  // Montserrat capitals average 0.7 em at this tracking.
  const wide = function (list: string[], counted?: boolean) {
    let longest = counted && counterLabel ? counterLabel.length + 4 : 0
    for (let i = 0; i < list.length; i++) longest = Math.max(longest, list[i].length)
    return { "--w": (longest * 0.7).toFixed(2) + "em" } as React.CSSProperties
  }
  // One face of a solid: its outward normal rides along for the lighting.
  const face = function (name: string, normal: string, i: number) {
    return (
      <div className={"gfp-face " + name} data-n={normal}>
        {i < 0 ? null : <img src={pics[i]} alt="" width={480} height={480} decoding="async" draggable={false} style={{ maxWidth: "none" }} />}
      </div>
    )
  }
  const photo = function (i: number, grade: string) {
    return (
      <div className={"gfp-ph " + grade}>
        <img src={pics[i]} alt="" width={480} height={480} decoding="async" draggable={false} style={{ maxWidth: "none" }} />
      </div>
    )
  }

  return (
    <div className={"gfp-root" + (className ? " " + className : "")} style={style as React.CSSProperties}>
      {fontHref ? (
        <GfpLink
          href={fontHref}
          onReady={function () {
            if (fontReady.current) fontReady.current()
          }}
        />
      ) : null}
      <style>{CSS}</style>
      <div className="gfp-page" ref={pageRef}>
        {children}
      </div>
      {done ? null : (
        <div className="gfp-ov gfp-s1" ref={ovRef} role="status" aria-label="Loading">
          <div className="gfp-stage" ref={stageRef} aria-hidden="true">
            <div className="gfp-cell gfp-tl">
              {photo(3, "gfp-a gfp-mono gfp-cream")}
              {photo(4, "gfp-b gfp-red")}
            </div>
            <div className="gfp-cell gfp-br">
              {photo(1, "gfp-a gfp-red")}
              {photo(0, "gfp-b gfp-duo")}
            </div>
            <div className="gfp-cell gfp-tr">{photo(5, "gfp-mono")}</div>
            <div className="gfp-cell gfp-bl">{photo(4, "gfp-mono")}</div>
            <div className="gfp-block" />
            <div className="gfp-v gfp-v0" />
            <div className="gfp-v gfp-v1" />
            <div className="gfp-h gfp-h0" />
            <div className="gfp-h gfp-h1" />
            <div className="gfp-solid" ref={solidRef}>
              <div className="gfp-form" ref={formRef}>
                <div className="gfp-shape gfp-cube">
                  {face("gfp-x0", "0,0,1", 0)}
                  {face("gfp-x1", "1,0,0", 2)}
                  {face("gfp-x2", "0,0,-1", 5)}
                  {face("gfp-x3", "-1,0,0", 4)}
                  {face("gfp-x4", "0,1,0", 6)}
                  {face("gfp-x5", "0,-1,0", -1)}
                </div>
                <div className="gfp-shape gfp-ring">
                  {face("gfp-r0", "0,0,1", 0)}
                  {face("gfp-r1", "0.951,0,0.309", 1)}
                  {face("gfp-r2", "0.588,0,-0.809", 2)}
                  {face("gfp-r3", "-0.588,0,-0.809", 3)}
                  {face("gfp-r4", "-0.951,0,0.309", 6)}
                </div>
                <div className="gfp-shape gfp-plate">
                  {face("gfp-p0", "0,0,1", 2)}
                  {face("gfp-p1", "0,0,-1", 3)}
                  <i className="gfp-edge gfp-e0" />
                  <i className="gfp-edge gfp-e1" />
                  <i className="gfp-edge gfp-e2" />
                  <i className="gfp-edge gfp-e3" />
                </div>
              </div>
            </div>
            <i className="gfp-dot gfp-d00" />
            <i className="gfp-dot gfp-d01" />
            <i className="gfp-dot gfp-d10" />
            <i className="gfp-dot gfp-d11" />

            <div className="gfp-g gfp-g1">
              <p className="gfp-label gfp-r gfp-top">{spans(copy.top)}</p>
              <p className="gfp-label gfp-r gfp-bot">
                {spans(copy.bottom)}
                {counter}
              </p>
              <div className="gfp-badge">
                <svg className="gfp-pin" viewBox="0 0 20 26" ref={pinRef}>
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.5 0 0 4.4 0 9.8 0 17 10 26 10 26s10-9 10-16.2C20 4.4 15.5 0 10 0zm0 13.7a3.9 3.9 0 110-7.8 3.9 3.9 0 010 7.8z"
                  />
                </svg>
                <span ref={placeRef}>
                  <span className="gfp-place">{place}</span>
                  <span className="gfp-region">{region}</span>
                </span>
              </div>
              <p className="gfp-wm">{spans(mark)}</p>
            </div>

            <div className="gfp-g gfp-g2">
              <p className="gfp-label gfp-c1" style={wide(copy.cube)}>
                {spans(copy.cube)}
              </p>
              <p className="gfp-label gfp-c2" style={wide(copy.cubeNote)}>
                {spans(copy.cubeNote)}
              </p>
              {counter ? <p className="gfp-label gfp-r gfp-c3">{counter}</p> : null}
              <p className="gfp-label gfp-r gfp-c4">{spans(copy.cubeSide)}</p>
            </div>

            <div className="gfp-g gfp-g3">
              <p className="gfp-label gfp-r gfp-k1">{spans(copy.ring)}</p>
              <p className="gfp-title">{spans(titleLines)}</p>
              <p className="gfp-label gfp-k2" style={wide(copy.ringNote, true)}>
                {spans(copy.ringNote)}
                {counter}
              </p>
              <p className="gfp-label gfp-r gfp-k3">{spans(copy.ringSide)}</p>
            </div>

            <p className="gfp-big">
              {bigLines.map(function (l, i) {
                return (
                  <span
                    key={i}
                    ref={function (el) {
                      wordEls.current[i] = el
                    }}
                  >
                    {l}
                  </span>
                )
              })}
            </p>
            <div className="gfp-g gfp-g4">
              <p className="gfp-small">{spans(bigLines)}</p>
              <p className="gfp-label gfp-b1" style={wide(copy.print)}>
                {spans(copy.print)}
              </p>
              <p className="gfp-label gfp-b2">
                {spans(copy.printNote)}
                {counter}
              </p>
            </div>

            {pics.map(function (src, i) {
              return (
                <div
                  className="gfp-card"
                  key={i}
                  ref={function (el) {
                    cardEls.current[i] = el
                  }}
                >
                  <img src={src} alt="" width={480} height={480} decoding="sync" draggable={false} style={{ maxWidth: "none" }} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default GuidelineFanPreloader
