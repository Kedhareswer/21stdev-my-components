"use client"

import { useEffect, useRef } from "react"
import type { CSSProperties } from "react"

// #region keys
export type Key = { x: number; y: number; col: number; row: number; icon: number }

/** Pointy-top hexagon keys tiling a w×h field, bleeding past every edge. `size` is the
 * flat-to-flat width of one key, `gap` the groove between keys. */
export function layoutKeys(w: number, h: number, size: number, gap: number, icons: number) {
  const hexH = (size * 2) / Math.sqrt(3)
  const dx = size + gap
  const dy = hexH * 0.75 + gap * 0.866
  const cols = Math.ceil(w / dx) + 3
  const rows = Math.ceil(h / dy) + 3
  const ox = w / 2 - ((cols - 1) * dx) / 2
  const oy = h / 2 - ((rows - 1) * dy) / 2
  const keys: Key[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = ox + col * dx + (row % 2 ? dx / 2 : 0)
      const y = oy + row * dy
      keys.push({ x, y, col, row, icon: (col * 5 + row * 7) % icons })
    }
  }
  return keys
}

/** Corners of a pointy-top hexagon with flat-to-flat width `size`. */
export function hexCorners(x: number, y: number, size: number) {
  const r = size / Math.sqrt(3)
  const pts: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2
    pts.push([x + r * Math.cos(a), y + r * Math.sin(a)])
  }
  return pts
}

/** How much a key at distance d from the pointer is lit (1 under it, 0 beyond `reach`). */
export function warmth(d: number, reach: number) {
  const k = 1 - d / reach
  if (k <= 0) return 0
  return k * k * (3 - 2 * k)
}

/** Heat after dt seconds: it rises at once toward the pointer's warmth, and cools slowly. */
export function stepHeat(heat: number, target: number, dt: number, cool: number) {
  if (target >= heat) return heat + (target - heat) * Math.min(1, dt * 14)
  return target + (heat - target) * Math.exp(-dt / cool)
}

/** The unattended pointer: a slow figure-eight across the middle of the field. */
export function ghostPath(t: number, w: number, h: number) {
  return { x: w / 2 + Math.sin(t * 0.55) * w * 0.32, y: h / 2 + Math.sin(t * 1.1 + 0.6) * h * 0.24 }
}
// #endregion

// Line icons on a 24-unit grid, drawn as strokes.
const ICONS = [
  "M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.4 6.4 20.5l2.1-6.7L3 9.8h6.8z",
  "M12 2c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10 5.2-.6 9.4-4.8 10-10z",
  "M7 12c0-2.2 1.8-4 4-1.8L13 12c2.2 2.2 4 4 6 2.2a3 3 0 000-4.4C17 8 15.2 9.8 13 12l-2 1.8C8.8 16 7 15.8 5 14.2a3 3 0 010-4.4C7 8 8.8 9.8 11 12",
  "M6 6c-2 3-2 9 0 12M18 6c2 3 2 9 0 12M8.5 11l1.5-1.6 1.5 1.6M12.5 11l1.5-1.6 1.5 1.6",
  "M12 12m-2.5 0a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M5.6 18.4l2.9-2.9M15.5 8.5l2.9-2.9",
  "M7 18h10a4 4 0 00.6-8 6 6 0 00-11.4 1.6A3.2 3.2 0 007 18z",
  "M13 2L5 13.5h6L10 22l8-11.5h-6z",
  "M12 20.5S3.5 15.4 3.5 9.3A4.3 4.3 0 0112 7.2a4.3 4.3 0 018.5 2.1c0 6.1-8.5 11.2-8.5 11.2z",
  "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z",
  "M2.5 9c2.4-2 4.8-2 7.2 0s4.8 2 7.2 0 3.6-1.6 4.6-1M2.5 15c2.4-2 4.8-2 7.2 0s4.8 2 7.2 0 3.6-1.6 4.6-1",
  "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0",
  "M12 12c0-1.4 1.4-2 2.4-1.2 1.6 1.2.6 4-1.8 4.2-3 .2-4.8-3-3.6-5.8C10.6 6 15 5.2 17.8 7.6c3.4 3 2.4 9.4-2.6 11.4-5.4 2.2-11.4-1.6-11.4-7.6",
  "M12 2.5l7.5 9.5-7.5 9.5L4.5 12z",
  "M12 21.5a9.5 9.5 0 100-19 9.5 9.5 0 000 19zM8 14.5c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4M9 9.5v.1M15 9.5v.1",
  "M5 21V10a7 7 0 0114 0v11l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2zM9.5 10.5v.1M14.5 10.5v.1",
  "M3 12c3-4.5 7-6 11-4.5L21 4l-1.5 8 1.5 8-7-3.5C10 18 6 16.5 3 12zM15.5 11.5v.1",
]

export type GlowHexKeysProps = {
  /** Flat-to-flat width of one key in px. */
  keySize?: number
  /** Groove between keys in px. */
  gap?: number
  /** How far the warmth reaches, in keys. */
  reach?: number
  /** Seconds the lit keys take to cool. */
  cool?: number
  /** A ghost pointer wanders the field until someone moves over it. */
  autoPlay?: boolean
  /** Lay the keyboard back in perspective, like a real board seen from the desk. */
  tilt?: boolean
  height?: string
  className?: string
  style?: CSSProperties
}

const CSS =
  ".ghk-root{position:relative;display:block;width:100%;overflow:hidden;background:#0b0b0d;touch-action:pan-y;cursor:default;isolation:isolate}" +
  ".ghk-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;transform-origin:50% 52%}" +
  // tilted, the canvas is laid out larger than the stage rather than scaled up, so the keys stay sharp
  ".ghk-root[data-tilt=true] .ghk-canvas{left:-45%;top:-40%;width:190%;height:180%;transform:perspective(1500px) rotateX(32deg) rotateZ(-12deg)}" +
  ".ghk-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 50%,transparent 55%,rgba(0,0,0,.55) 100%)}" +
  ".ghk-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.ghk-root{cursor:default}}"

const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k))
const rgb = (c: number[], a = 1) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"

export default function GlowHexKeys({
  keySize = 88,
  gap = 9,
  reach = 2.8,
  cool = 1.8,
  autoPlay = false,
  tilt = true,
  height = "100svh",
  className,
  style,
}: GlowHexKeysProps) {
  const rootRef = useRef(null as HTMLDivElement | null)
  const canvasRef = useRef(null as HTMLCanvasElement | null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const icons = ICONS.map((d) => new Path2D(d))
    let W = 0, H = 0, dpr = 1
    const glow = document.createElement("canvas")
    let keys: Key[] = []
    let heat: number[] = []
    // a wider, softer field: the pink light that spills onto the walls of nearby dark keys
    let spill: number[] = []
    let press: number[] = []
    const ptr = { x: -9999, y: -9999, on: false, down: false, touched: false }
    let raf = 0
    let last = performance.now()
    let visible = true
    const born = last

    const corners = (x: number, y: number, s: number, round: number) => {
      const p = hexCorners(x, y, s)
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = p[i], b = p[(i + 1) % 6], c = p[(i + 5) % 6]
        const sx = a[0] + (c[0] - a[0]) * round, sy = a[1] + (c[1] - a[1]) * round
        if (i === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
        ctx.quadraticCurveTo(a[0], a[1], a[0] + (b[0] - a[0]) * round, a[1] + (b[1] - a[1]) * round)
      }
      ctx.closePath()
    }

    const resize = (w: number, h: number) => {
      W = w
      H = h
      // the tilted canvas is about 3.4x the stage's area: cap its density to keep frames light
      dpr = Math.min(tilt ? 1.5 : 2, window.devicePixelRatio || 1)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      // the pink backlight of one key, blurred once
      const gs = Math.ceil(keySize * 2.9)
      glow.width = Math.round(gs * dpr)
      glow.height = Math.round(gs * dpr)
      const gx = glow.getContext("2d")
      if (gx) {
        gx.setTransform(dpr, 0, 0, dpr, 0, 0)
        gx.filter = "blur(" + Math.round(keySize * 0.26) + "px)"
        const p = hexCorners(gs / 2, gs / 2, keySize * 1.18)
        gx.beginPath()
        p.forEach(([x, y], i) => (i ? gx.lineTo(x, y) : gx.moveTo(x, y)))
        gx.closePath()
        gx.fillStyle = "rgb(255,36,138)"
        gx.fill()
        gx.filter = "none"
      }
      keys = layoutKeys(w, h, keySize, gap, ICONS.length)
      heat = keys.map(() => 0)
      spill = keys.map(() => 0)
      press = keys.map(() => 0)
      kick()
    }

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const depth = keySize * 0.2
      const round = 0.27
      // pass 1: backlight bleeding into the grooves around warm keys (one pre-blurred sprite)
      ctx.globalCompositeOperation = "lighter"
      const half = glow.width / dpr / 2
      for (let i = 0; i < keys.length; i++) {
        const g = Math.max(heat[i], spill[i] * 0.7)
        if (g < 0.02) continue
        const k = keys[i]
        ctx.globalAlpha = Math.min(1, g * 1.6)
        ctx.drawImage(glow, k.x - half, k.y + depth * 0.7 - half, half * 2, half * 2)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
      // pass 2: the keycaps, back to front so each wall tucks under the key in front
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        const h = heat[i]
        const sp = Math.max(h, spill[i])
        const sink = press[i] * depth * 0.7
        // side wall: dark plastic, flushed hot pink where the backlight hits it
        corners(k.x, k.y + depth, keySize, round)
        const wall = ctx.createLinearGradient(0, k.y, 0, k.y + depth + keySize * 0.55)
        wall.addColorStop(0, rgb(mix([24, 24, 28], [255, 120, 110], Math.min(1, sp * 1.4))))
        wall.addColorStop(1, rgb(mix([12, 12, 14], [255, 40, 130], Math.min(1, sp * 1.5))))
        ctx.fillStyle = wall
        ctx.fill()
        // face: matte charcoal, lighter toward the top-left light
        corners(k.x, k.y + sink, keySize, round)
        const g = ctx.createLinearGradient(k.x - keySize * 0.4, k.y - keySize * 0.5, k.x + keySize * 0.45, k.y + keySize * 0.55)
        g.addColorStop(0, "#35353b")
        g.addColorStop(0.55, "#222226")
        g.addColorStop(1, "#18181b")
        ctx.fillStyle = g
        ctx.fill()
        if (h > 0.01) {
          const lit = ctx.createLinearGradient(k.x - keySize * 0.45, k.y - keySize * 0.55, k.x + keySize * 0.5, k.y + keySize * 0.6)
          // hot keys burn white; cooling keys glow peach, then ember orange
          const a = Math.min(1, h * 2.4)
          const w = Math.min(1, h * 1.25)
          lit.addColorStop(0, rgb(mix([255, 150, 80], [255, 253, 249], w), a))
          lit.addColorStop(0.45, rgb(mix([250, 120, 70], [255, 236, 214], w), a))
          lit.addColorStop(0.78, rgb(mix([235, 90, 60], [255, 176, 104], w), a))
          lit.addColorStop(1, rgb(mix([220, 60, 70], [255, 108, 72], w), a))
          ctx.fillStyle = lit
          ctx.fill()
        }
        // bevel: a soft highlight along the top-left edge, a shadow along the bottom-right
        const bevel = ctx.createLinearGradient(k.x - keySize * 0.5, k.y - keySize * 0.5, k.x + keySize * 0.5, k.y + keySize * 0.5)
        bevel.addColorStop(0, "rgba(255,255,255," + (0.22 + 0.3 * h) + ")")
        bevel.addColorStop(0.5, "rgba(255,255,255,0)")
        bevel.addColorStop(1, h > 0.05 ? "rgba(255,70,120," + 0.55 * h + ")" : "rgba(0,0,0,0.45)")
        ctx.lineWidth = Math.max(1.5, keySize * 0.03)
        ctx.strokeStyle = bevel
        ctx.stroke()
        // icon
        const s = (keySize * 0.36) / 24
        ctx.save()
        ctx.translate(k.x - 12 * s, k.y + sink - 12 * s)
        ctx.scale(s, s)
        ctx.lineWidth = 1.6
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = rgb(mix([238, 238, 240], [176, 158, 150], Math.min(1, h * 2)))
        ctx.stroke(icons[k.icon])
        ctx.restore()
      }
    }

    const paint = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const ghost = autoPlay && !ptr.touched && !reduce.matches
      let px = ptr.x, py = ptr.y, on = ptr.on
      if (ghost) {
        // the tilted canvas overhangs the stage; keep the ghost inside the part you can see
        const k = tilt ? 0.52 : 1
        const g = ghostPath((now - born) / 1000, W * k, H * k)
        px = W / 2 + g.x - (W * k) / 2
        py = H / 2 + g.y - (H * k) / 2
        on = true
      }
      const R = reach * (keySize + gap)
      let busy = ghost
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        const d = Math.hypot(k.x - px, k.y - py)
        const target = on ? warmth(d, R) : 0
        const prev = heat[i]
        heat[i] = reduce.matches ? target : stepHeat(prev, target, dt, cool)
        if (heat[i] < 0.004) heat[i] = 0
        const spillT = on ? warmth(d, R * 1.55) : 0
        const prevS = spill[i]
        spill[i] = reduce.matches ? spillT : stepHeat(prevS, spillT, dt, cool)
        if (spill[i] < 0.004) spill[i] = 0
        if (Math.abs(spill[i] - prevS) > 0.0005) busy = true
        const under = ptr.down && on && Math.hypot(k.x - px, k.y - py) < keySize * 0.5 ? 1 : 0
        press[i] += (under - press[i]) * (reduce.matches ? 1 : Math.min(1, dt * 22))
        if (Math.abs(heat[i] - prev) > 0.0005 || Math.abs(press[i] - under) > 0.002) busy = true
      }
      draw()
      raf = visible && busy ? requestAnimationFrame(paint) : 0
    }
    function kick() {
      if (!raf && visible) {
        last = performance.now()
        raf = requestAnimationFrame(paint)
      }
    }
    const at = (e: PointerEvent) => {
      ptr.x = e.offsetX
      ptr.y = e.offsetY
      ptr.on = true
      ptr.touched = true
      kick()
    }
    const leave = () => {
      ptr.on = false
      ptr.down = false
      kick()
    }
    const down = (e: PointerEvent) => {
      at(e)
      ptr.down = true
    }
    const up = () => {
      ptr.down = false
      kick()
    }
    canvas.addEventListener("pointermove", at)
    canvas.addEventListener("pointerdown", down)
    canvas.addEventListener("pointerup", up)
    canvas.addEventListener("pointerleave", leave)
    canvas.addEventListener("pointercancel", leave)
    const ro = new ResizeObserver(([e]) => resize(e.contentRect.width, e.contentRect.height))
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) kick()
    })
    io.observe(root)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener("pointermove", at)
      canvas.removeEventListener("pointerdown", down)
      canvas.removeEventListener("pointerup", up)
      canvas.removeEventListener("pointerleave", leave)
      canvas.removeEventListener("pointercancel", leave)
    }
  }, [keySize, gap, reach, cool, autoPlay, tilt])

  return (
    <div ref={rootRef} className={"ghk-root" + (className ? " " + className : "")} data-tilt={tilt} style={{ minHeight: height, height, ...style }}>
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="ghk-canvas" aria-hidden="true" />
      <div className="ghk-vignette" />
      <span className="ghk-sr">A field of hexagonal icon keys that light up warm orange and pink under the pointer.</span>
    </div>
  )
}
