"use client"

import { useEffect, useRef } from "react"
import type { CSSProperties } from "react"
import * as THREE from "three"

// #region ribbon
export const RIB = { radius: 4.6, perTurn: 7, turns: 3, aspect: 4 / 3, gap: 0.006 }
export const SEG = { along: 20, across: 8 }

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Photos are cut to mixed widths, like prints of different crops pasted along one strip. */
export function widthOf(p: number) {
  const r = Math.sin(p * 12.9898 + 4.1) * 43758.5453
  return 0.72 + 0.56 * (r - Math.floor(r))
}

const spans: number[] = []
/** Start and end angle of panel p along the ribbon. */
export function spanOf(p: number) {
  const step = (Math.PI * 2) / RIB.perTurn
  while (spans.length <= p + 1) spans.push(spans.length ? spans[spans.length - 1] + widthOf(spans.length - 1) * step : 0)
  return { a0: spans[p], a1: spans[p + 1] }
}

/** Ribbon height, helix pitch and the number of panels it takes to wind the turns. */
export function ribbonSize() {
  const arc = RIB.radius * ((Math.PI * 2) / RIB.perTurn)
  const h = (arc / RIB.aspect) * 0.74
  let panels = 0
  while (spanOf(panels).a1 < RIB.turns * Math.PI * 2) panels++
  return { arc, h, pitch: h * 1.42, panels: panels + 1 }
}

/** Height of the ribbon's centre line at angle theta, for unfurl m. */
export function yAt(theta: number, m: number) {
  const { pitch } = ribbonSize()
  const total = RIB.turns * pitch
  return (theta / (Math.PI * 2)) * pitch * (0.08 + 0.92 * m) - (total / 2) * (0.08 + 0.92 * m)
}

/** A point of panel p at (s along, t across), for unfurl m (0 crumpled, 1 helix).
 * Returns position and outward normal (unit, in the horizontal plane at m = 1). */
export function ribbonPoint(p: number, s: number, t: number, m: number) {
  const { h } = ribbonSize()
  const { a0, a1 } = spanOf(p)
  const g = (a1 - a0) * RIB.gap * 4
  const theta = a0 + g + s * (a1 - a0 - 2 * g)
  const r = RIB.radius * (0.22 + 0.78 * m)
  const fold = 1 - m
  const wob = fold * 0.9 * Math.sin(s * 9 + p * 1.7 + t * 4)
  const lift = fold * 0.7 * Math.cos(s * 7 + t * 3 + p * 2.3)
  const y = yAt(theta, m) + (t - 0.5) * h * (0.5 + 0.5 * m) + lift
  const rr = r + wob
  return { x: rr * Math.sin(theta), y, z: rr * Math.cos(theta), nx: Math.sin(theta), nz: Math.cos(theta) }
}

/** How a panel's photo is cropped to its width: [uScale, vScale] about the centre. */
export function cropOf(p: number, imageAspect = 4 / 3) {
  const { h } = ribbonSize()
  const { a0, a1 } = spanOf(p)
  const k = (RIB.radius * (a1 - a0)) / h / imageAspect
  return k < 1 ? [k, 1] : [1, 1 / k]
}

/** Ripple height at a point d (panel units) from the touch, at time t, with strength a. */
export function ripple(d: number, t: number, a: number) {
  return a * 0.55 * Math.sin(d * 8 - t * 7) * Math.exp(-d * 1.8)
}

/** Unfurl progress at time t (s) after mount. */
export function unfurl(t: number) {
  const k = clamp01((t - 0.25) / 1.7)
  return 1 - Math.pow(1 - k, 3)
}

/** Which photo each panel shows; neighbours along the ribbon and on the turn above never match. */
export function photoFor(p: number, n: number) {
  return (p * 4) % n
}
// #endregion

export type SpiralImage = { src: string; alt?: string }

export type SpiralRibbonGalleryProps = {
  images?: SpiralImage[]
  /** Turns per minute at rest. */
  spin?: number
  /** Play a ripple across the front photo now and then when nobody is hovering. */
  autoPlay?: boolean
  height?: string
  className?: string
  style?: CSSProperties
}

const IMG = "https://kedhar-components.pages.dev/spiral-ribbon-gallery/"
const DEFAULT_IMAGES: SpiralImage[] = [
  "Portrait in brass headphones looking up", "Young man in profile on red", "Grey-haired woman in headphones",
  "Woman in side profile on orange", "Red-haired portrait with cropped curls", "Bald man in amber light",
  "Woman in round amber sunglasses", "Silver-haired man with stubble", "Girl in headphones laughing",
].map((alt, i) => ({ src: IMG + "portrait-0" + (i + 1) + ".webp", alt }))

const CSS =
  ".srg-root{position:relative;display:block;width:100%;overflow:hidden;background:#0b0a09;touch-action:pan-y}" +
  ".srg-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}" +
  ".srg-canvas:active{cursor:grabbing}" +
  ".srg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.srg-canvas{cursor:default}}"

export default function SpiralRibbonGallery({
  images = DEFAULT_IMAGES,
  spin = 2.2,
  autoPlay = true,
  height = "100svh",
  className,
  style,
}: SpiralRibbonGalleryProps) {
  const rootRef = useRef(null as HTMLDivElement | null)
  const canvasRef = useRef(null as HTMLCanvasElement | null)
  const list = images.length ? images : DEFAULT_IMAGES

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    let gl: THREE.WebGLRenderer
    try {
      gl = new THREE.WebGLRenderer({ canvas, antialias: true })
    } catch {
      return
    }
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.setClearColor(0x0b0a09, 1)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
    scene.add(new THREE.AmbientLight(0xffffff, 1.1))
    // a raking light from the side, so a rippling photo shows its folds
    const sun = new THREE.DirectionalLight(0xffffff, 2.5)
    sun.position.set(5, 2.5, 3)
    scene.add(sun)
    const tilt = new THREE.Group()
    // seen from a little above and to the side, axis leaning, like a slinky on its side
    tilt.rotation.z = -0.32
    tilt.rotation.x = 0.34
    // the tilt and perspective lift the spiral's silhouette; drop it back to the visual centre
    tilt.position.y = -0.3
    scene.add(tilt)
    const spinner = new THREE.Group()
    tilt.add(spinner)

    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin("anonymous")
    const textures = list.map((im) => {
      const t = loader.load(im.src)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
      return t
    })
    const { panels } = ribbonSize()
    const A = SEG.along + 1, C = SEG.across + 1
    const index: number[] = []
    for (let i = 0; i < SEG.along; i++)
      for (let j = 0; j < SEG.across; j++) {
        const a = i * C + j, b = (i + 1) * C + j
        index.push(a, b, a + 1, b, b + 1, a + 1)
      }
    const meshes = Array.from({ length: panels }, (_, p) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(A * C * 3), 3))
      const uv = new Float32Array(A * C * 2)
      for (let i = 0; i < A; i++) for (let j = 0; j < C; j++) {
        // crop the photo to this panel's width so faces never stretch
        const [ku, kv] = cropOf(p)
        uv[(i * C + j) * 2] = 0.5 + (i / SEG.along - 0.5) * ku
        uv[(i * C + j) * 2 + 1] = 0.5 + (j / SEG.across - 0.5) * kv
      }
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2))
      g.setIndex(index)
      const mat = new THREE.MeshLambertMaterial({ map: textures[photoFor(p, textures.length)], side: THREE.DoubleSide })
      const mesh = new THREE.Mesh(g, mat)
      mesh.userData.p = p
      spinner.add(mesh)
      return mesh
    })

    const shape = (m: number, now: number, touch: { p: number; u: number; v: number; a: number } | null) => {
      const { h } = ribbonSize()
      for (const mesh of meshes) {
        const p = mesh.userData.p as number
        const pos = mesh.geometry.getAttribute("position") as THREE.BufferAttribute
        const arr = pos.array as Float32Array
        for (let i = 0; i < A; i++)
          for (let j = 0; j < C; j++) {
            const s = i / SEG.along, t = j / SEG.across
            const q = ribbonPoint(p, s, t, m)
            let off = 0
            if (touch && touch.p === p && touch.a > 0.001) {
              const span = spanOf(p)
              const d = Math.hypot(((s - touch.u) * RIB.radius * (span.a1 - span.a0)) / h, t - touch.v)
              off = ripple(d, now, touch.a)
            }
            const k = (i * C + j) * 3
            // the wave pushes the photo out and drags it sideways, like cloth, so the picture visibly warps
            arr[k] = q.x + q.nx * off + q.nz * off * 0.55
            arr[k + 1] = q.y + off * 0.45
            arr[k + 2] = q.z + q.nz * off - q.nx * off * 0.55
          }
        pos.needsUpdate = true
        mesh.geometry.computeVertexNormals()
        mesh.geometry.computeBoundingSphere()
      }
    }

    let W = 1, H = 1
    const ro = new ResizeObserver(([e]) => {
      W = Math.max(1, e.contentRect.width)
      H = Math.max(1, e.contentRect.height)
      gl.setSize(W, H, false)
      camera.aspect = W / H
      // keep the whole spiral in frame on tall, narrow screens
      camera.fov = camera.aspect < 0.8 ? 46 : 36
      camera.updateProjectionMatrix()
    })
    ro.observe(canvas)

    let zoomT = 0
    const readScroll = () => {
      const r = root.getBoundingClientRect()
      zoomT = r.height > 0 ? clamp01(-r.top / r.height) : 0
    }
    window.addEventListener("scroll", readScroll, { passive: true })
    readScroll()

    const ndc = new THREE.Vector2(9, 9)
    const ray = new THREE.Raycaster()
    const st = { angle: 0.4, vel: 0, drag: false, lastX: 0, zoom: 0, touch: null as { p: number; u: number; v: number; a: number } | null, ghostAt: 0 }
    const down = (e: PointerEvent) => {
      st.drag = true
      st.lastX = e.clientX
      canvas.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      ndc.set((e.offsetX / W) * 2 - 1, -(e.offsetY / H) * 2 + 1)
      if (!st.drag) return
      const dx = e.clientX - st.lastX
      st.lastX = e.clientX
      st.angle += dx * 0.008
      st.vel = dx * 0.5
    }
    const up = () => (st.drag = false)
    const leave = () => ndc.set(9, 9)
    canvas.addEventListener("pointerdown", down)
    canvas.addEventListener("pointermove", move)
    canvas.addEventListener("pointerup", up)
    canvas.addEventListener("pointercancel", up)
    canvas.addEventListener("pointerleave", leave)

    const born = performance.now()
    let last = born
    let raf = 0
    let visible = true
    const frame = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = (now - born) / 1000
      const m = reduce.matches ? 1 : unfurl(t)
      if (!st.drag && !reduce.matches) {
        st.vel *= Math.exp(-dt * 2.2)
        // spins faster while it unfurls, then settles into a slow turn
        st.angle += dt * ((spin * Math.PI * 2) / 60) * (1 + (1 - m) * 6) + st.vel * dt * 0.05
      }
      spinner.rotation.y = st.angle
      st.zoom += (zoomT - st.zoom) * (reduce.matches ? 1 : Math.min(1, dt * 5))
      const ez = st.zoom * st.zoom * (3 - 2 * st.zoom)
      camera.position.set(0, -ez * 1.2, 23 - ez * 13)
      camera.lookAt(0, -ez * 1.2, 0)
      // hover: start or follow a ripple on the photo under the pointer
      let hit: { p: number; u: number; v: number } | null = null
      if (ndc.x < 2 && m > 0.95) {
        ray.setFromCamera(ndc, camera)
        const hits = ray.intersectObjects(meshes, false)
        if (hits.length && hits[0].uv) {
          // back from the cropped photo coordinates to the panel's own
          const hp = hits[0].object.userData.p as number
          const [ku, kv] = cropOf(hp)
          hit = { p: hp, u: 0.5 + (hits[0].uv.x - 0.5) / ku, v: 0.5 + (hits[0].uv.y - 0.5) / kv }
        }
      }
      if (!hit && autoPlay && !reduce.matches && m > 0.99 && t - st.ghostAt > 4.2) {
        // nobody is touching: ripple the photo nearest the camera now and then
        st.ghostAt = t
        // the photo facing the camera on the middle turn
        const tau = Math.PI * 2
        const theta = (((-st.angle % tau) + tau) % tau) + tau
        let p = 0
        while (p < panels - 1 && spanOf(p).a1 < theta) p++
        const sp = spanOf(p)
        st.touch = { p, u: clamp01((theta - sp.a0) / (sp.a1 - sp.a0)), v: 0.55, a: 1 }
      }
      if (hit) st.touch = { ...hit, a: Math.min(1, (st.touch && st.touch.p === hit.p ? st.touch.a : 0) + dt * 4) }
      else if (st.touch) st.touch.a *= Math.exp(-dt * 0.9)
      canvas.style.cursor = hit ? "pointer" : ""
      shape(m, t, reduce.matches ? null : st.touch)
      gl.render(scene, camera)
      raf = visible ? requestAnimationFrame(frame) : 0
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(canvas)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener("scroll", readScroll)
      canvas.removeEventListener("pointerdown", down)
      canvas.removeEventListener("pointermove", move)
      canvas.removeEventListener("pointerup", up)
      canvas.removeEventListener("pointercancel", up)
      canvas.removeEventListener("pointerleave", leave)
      meshes.forEach((mm) => {
        mm.geometry.dispose()
        ;(mm.material as THREE.Material).dispose()
      })
      textures.forEach((tx) => tx.dispose())
      gl.dispose()
    }
  }, [list, spin, autoPlay])

  return (
    <div ref={rootRef} className={"srg-root" + (className ? " " + className : "")} style={{ minHeight: height, height, ...style }}>
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="srg-canvas" aria-hidden="true" />
      <ul className="srg-sr">
        {list.map((im, i) => (
          <li key={i}>{im.alt ?? "Image " + (i + 1)}</li>
        ))}
      </ul>
    </div>
  )
}
