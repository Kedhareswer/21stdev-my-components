"use client"

import { useEffect, useRef } from "react"
import type { CSSProperties } from "react"
import * as THREE from "three"

// #region tunnel
export const TUBE = { radius: 6, length: 70, around: 14, rings: 28, fill: 0.93 }

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smooth = (a: number, b: number, v: number) => {
  const k = clamp01((v - a) / (b - a))
  return k * k * (3 - 2 * k)
}

/** Camera for dive progress p (0 = at the mouth looking down the tube, 1 = turned to face the wall). */
export function cameraAt(p: number) {
  const dive = smooth(0, 0.62, p)
  const turn = smooth(0.55, 1, p)
  const z = -2 - dive * (TUBE.length - 16) - turn * 4
  return { z, y: -turn * TUBE.radius * 0.18, pitch: turn * (Math.PI / 2) }
}

/** Centre and orientation of tile (ring, i): on the inner wall, facing the axis, image-up along +z.
 * Rings alternate by half a tile, like brickwork. */
export function tileAt(ring: number, i: number) {
  const step = (Math.PI * 2) / TUBE.around
  const theta = i * step + (ring % 2 ? step / 2 : 0)
  const pitch = TUBE.length / TUBE.rings
  return {
    x: TUBE.radius * Math.cos(theta),
    y: TUBE.radius * Math.sin(theta),
    z: -(ring + 0.5) * pitch,
    theta,
    w: TUBE.radius * step * TUBE.fill,
    h: pitch * TUBE.fill,
  }
}

/** Which photo a tile shows: neighbours around and along the tube never repeat. */
export function photoFor(ring: number, i: number, n: number) {
  return (i * 3 + ring * 5 + (ring % 2) * 7) % n
}

/** The unattended loop: dive in, hold on the wall, float back out (period in s). */
export function autoDive(t: number, period = 11) {
  const c = (t % period) / period
  if (c < 0.12) return 0
  if (c < 0.5) return smooth(0.12, 0.5, c)
  if (c < 0.66) return 1
  return 1 - smooth(0.66, 1, c)
}
// #endregion

export type TunnelImage = { src: string; alt?: string }

export type CylinderTunnelGalleryProps = {
  images?: TunnelImage[]
  /** "scroll": the dive follows page scroll through a pinned track. "auto": it loops on its own. */
  mode?: "scroll" | "auto"
  /** Scroll length of the track in scroll mode (a CSS length). */
  track?: string
  /** Height of the pinned view. */
  height?: string
  /** Twist speed in turns per minute. */
  spin?: number
  className?: string
  style?: CSSProperties
}

const IMG = "https://kedhar-components.pages.dev/cylinder-tunnel-gallery/"
const DEFAULT_IMAGES: TunnelImage[] = Array.from({ length: 16 }, (_, i) => ({
  src: IMG + "tile-" + String(i + 1).padStart(2, "0") + ".webp",
  alt: [
    "Red lacquer swirl", "Chrome clasp in blue light", "Blue glass sphere", "Gold twisted bracelet",
    "Portrait under magenta light", "Cobalt fabric fold", "Pleated paper fan", "Lime perfume bottle",
    "Glossy red lips", "Hot pink foam", "Portrait in sunglasses", "Yellow tulips on blue",
    "Orange silk ribbon", "Green apple on pink", "Silver sneaker on lilac", "Cobalt marble swirl",
  ][i],
}))

const CSS =
  ".ctg-root{position:relative;display:block;width:100%}" +
  ".ctg-pin{position:sticky;top:0;width:100%;overflow:hidden;background:#f3f3f1}" +
  ".ctg-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}" +
  ".ctg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.ctg-canvas{cursor:default}}"

/** A white rounded-rectangle mask, so tiles get soft corners without extra geometry. */
function roundedMask() {
  const c = document.createElement("canvas")
  c.width = c.height = 128
  const g = c.getContext("2d")
  if (g) {
    g.fillStyle = "#000"
    g.fillRect(0, 0, 128, 128)
    g.fillStyle = "#fff"
    g.beginPath()
    g.roundRect(3, 3, 122, 122, 9)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  return t
}

export default function CylinderTunnelGallery({
  images = DEFAULT_IMAGES,
  mode = "scroll",
  track = "320svh",
  height = "100svh",
  spin = 1.4,
  className,
  style,
}: CylinderTunnelGalleryProps) {
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
      gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    } catch {
      return
    }
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.setClearColor(0xf3f3f1, 1)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200)
    camera.rotation.order = "YXZ"
    const tube = new THREE.Group()
    scene.add(tube)

    // the white grout: a cylinder behind the tiles, seen from inside (far enough back that the
    // flat tiles, which are chords of the circle, never dip behind it at their edges)
    const wallGeo = new THREE.CylinderGeometry(TUBE.radius + 0.45, TUBE.radius + 0.45, TUBE.length + 2, 64, 1, true)
    wallGeo.rotateX(Math.PI / 2)
    wallGeo.translate(0, 0, -TUBE.length / 2)
    const wallMat = new THREE.MeshBasicMaterial({ color: 0xf6f6f4, side: THREE.BackSide })
    tube.add(new THREE.Mesh(wallGeo, wallMat))
    // the far end: a black disc
    const endGeo = new THREE.CircleGeometry(TUBE.radius + 0.5, 64)
    const endMat = new THREE.MeshBasicMaterial({ color: 0x0b0b0d })
    const end = new THREE.Mesh(endGeo, endMat)
    end.position.z = -TUBE.length + 0.02
    tube.add(end)

    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin("anonymous")
    const mask = roundedMask()
    const textures = list.map((im) => {
      const t = loader.load(im.src)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
      return t
    })
    const sample = tileAt(0, 0)
    const tileGeo = new THREE.PlaneGeometry(sample.w, sample.h)
    const n = textures.length
    const groups: { mesh: THREE.InstancedMesh; slots: { ring: number; i: number }[] }[] = []
    const byPhoto: { ring: number; i: number }[][] = textures.map(() => [])
    for (let ring = 0; ring < TUBE.rings; ring++) for (let i = 0; i < TUBE.around; i++) byPhoto[photoFor(ring, i, n)].push({ ring, i })
    const mats: THREE.MeshBasicMaterial[] = []
    const m4 = new THREE.Matrix4()
    const basis = (t: ReturnType<typeof tileAt>, lift: number, scale: number) => {
      const s = Math.sin(t.theta), c = Math.cos(t.theta)
      // x along the wall, y along the tube, z toward the axis
      m4.makeBasis(new THREE.Vector3(s * scale, -c * scale, 0), new THREE.Vector3(0, 0, scale), new THREE.Vector3(-c, -s, 0))
      m4.setPosition(t.x * (1 - lift), t.y * (1 - lift), t.z)
      return m4
    }
    textures.forEach((tex, k) => {
      const mat = new THREE.MeshBasicMaterial({ map: tex, alphaMap: mask, alphaTest: 0.5 })
      mats.push(mat)
      const slots = byPhoto[k]
      const mesh = new THREE.InstancedMesh(tileGeo, mat, Math.max(1, slots.length))
      mesh.count = slots.length
      slots.forEach((sl, j) => mesh.setMatrixAt(j, basis(tileAt(sl.ring, sl.i), 0, 1)))
      mesh.instanceMatrix.needsUpdate = true
      tube.add(mesh)
      groups.push({ mesh, slots })
    })

    // hover: the tile under the pointer lifts off the wall a little
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2(9, 9)
    let hovered: { g: number; j: number } | null = null
    let hoverAmt = 0
    const setTile = (g: number, j: number, amt: number) => {
      const sl = groups[g].slots[j]
      groups[g].mesh.setMatrixAt(j, basis(tileAt(sl.ring, sl.i), 0.06 * amt, 1 + 0.08 * amt))
      groups[g].mesh.instanceMatrix.needsUpdate = true
    }

    let W = 1, H = 1
    const resize = (w: number, h: number) => {
      W = Math.max(1, w)
      H = Math.max(1, h)
      gl.setSize(W, H, false)
      camera.aspect = W / H
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(([e]) => resize(e.contentRect.width, e.contentRect.height))
    ro.observe(canvas)

    let scrollP = 0
    const readScroll = () => {
      if (mode !== "scroll") return
      const r = root.getBoundingClientRect()
      const run = r.height - window.innerHeight
      scrollP = run > 0 ? clamp01(-r.top / run) : 0
    }
    window.addEventListener("scroll", readScroll, { passive: true })
    readScroll()

    const onMove = (e: PointerEvent) => {
      ndc.set((e.offsetX / W) * 2 - 1, -(e.offsetY / H) * 2 + 1)
    }
    const onLeave = () => ndc.set(9, 9)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerleave", onLeave)

    let p = 0
    let twist = 0
    let last = performance.now()
    const born = last
    let raf = 0
    let visible = true
    const frame = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const target = reduce.matches ? (mode === "auto" ? 0 : scrollP) : mode === "auto" ? autoDive((now - born) / 1000) : scrollP
      // ease the scroll input so the dive glides instead of stepping
      p += (target - p) * (reduce.matches ? 1 : Math.min(1, dt * 6))
      if (!reduce.matches) twist += dt * spin * ((Math.PI * 2) / 60)
      tube.rotation.z = twist
      const cam = cameraAt(p)
      camera.position.set(0, cam.y, cam.z)
      camera.rotation.set(cam.pitch, 0, 0)
      // hover pick
      let hit: { g: number; j: number } | null = null
      if (ndc.x < 2) {
        ray.setFromCamera(ndc, camera)
        let best = Infinity
        groups.forEach((gr, g) => {
          const hits = ray.intersectObject(gr.mesh, false)
          if (hits.length && hits[0].distance < best && hits[0].instanceId != null) {
            best = hits[0].distance
            hit = { g, j: hits[0].instanceId }
          }
        })
      }
      const h = hit as { g: number; j: number } | null
      if (!h || !hovered || h.g !== hovered.g || h.j !== hovered.j) {
        if (hovered) setTile(hovered.g, hovered.j, 0)
        hovered = h
        hoverAmt = 0
      }
      if (hovered) {
        hoverAmt += (1 - hoverAmt) * Math.min(1, dt * 10)
        setTile(hovered.g, hovered.j, reduce.matches ? 1 : hoverAmt)
      }
      canvas.style.cursor = hovered ? "pointer" : ""
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
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerleave", onLeave)
      groups.forEach((g) => g.mesh.dispose())
      mats.forEach((m) => m.dispose())
      textures.forEach((t) => t.dispose())
      mask.dispose()
      tileGeo.dispose()
      wallGeo.dispose()
      wallMat.dispose()
      endGeo.dispose()
      endMat.dispose()
      gl.dispose()
    }
  }, [list, mode, spin])

  return (
    <div
      ref={rootRef}
      className={"ctg-root" + (className ? " " + className : "")}
      style={{ height: mode === "scroll" ? track : height, ...style }}
    >
      <style>{CSS}</style>
      <div className="ctg-pin" style={{ height, minHeight: height }}>
        <canvas ref={canvasRef} className="ctg-canvas" aria-hidden="true" />
      </div>
      <ul className="ctg-sr">
        {list.map((im, i) => (
          <li key={i}>{im.alt ?? "Image " + (i + 1)}</li>
        ))}
      </ul>
    </div>
  )
}
