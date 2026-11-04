"use client"

import * as React from "react"
import * as THREE from "three"

// A 3D work showcase. Project screens are the hero: they orbit a pool of stage
// light on a tilted ring, and the far side sinks into fog. Drag to spin the ring, hover a
// screen to lift it, click (or use the arrows) to bring it to the front, where
// its details slide in beside the scene.

export type OrbitScreen = {
  title: string
  /** Photo or screenshot URL. Landscape (16:10) reads best. Remote URLs need CORS. */
  image: string
  /** e.g. "Brand site · 2026". */
  meta?: string
  summary?: string
  href?: string
}

export type OrbitScreensShowcaseProps = {
  screens: OrbitScreen[]
  /** Big heading, top left. */
  heading?: React.ReactNode
  /** Small line over the heading. */
  eyebrow?: React.ReactNode
  /** Link label in the detail panel. */
  ctaLabel?: string
  background?: string
  ink?: string
  accent?: string
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  className?: string
  onChange?: (index: number) => void
}

// #region orbit
const TAU = Math.PI * 2

export function wrap(i: number, n: number): number {
  return n > 0 ? ((i % n) + n) % n : 0
}

/** Ring angle of screen i for a ring turned by `turn` screens; turn = i puts screen i at the front (+z). */
export function screenAngle(i: number, turn: number, n: number): number {
  return Math.PI / 2 + ((i - turn) / n) * TAU
}

/** The nearest whole turn that brings screen i to the front, starting from `turn`, the short way round. */
export function turnTo(i: number, turn: number, n: number): number {
  const base = Math.round(turn)
  const d = wrap(i - base + Math.floor(n / 2), n) - Math.floor(n / 2)
  return base + d
}

/** Pointer position in normalised device coordinates for a canvas at (left, top) sized w × h. */
export function toNdc(x: number, y: number, left: number, top: number, w: number, h: number): [number, number] {
  return [((x - left) / w) * 2 - 1, -((y - top) / h) * 2 + 1]
}

/** Camera distance and ring radius for a stage aspect ratio: phones step back. */
export function framing(aspect: number): { dist: number; radius: number; x: number; y: number } {
  if (aspect < 0.8) return { dist: 14.5, radius: 2.5, x: 0, y: 1.1 }
  return { dist: 11, radius: 3.05, x: aspect > 1.3 ? 0.8 : 0.3, y: 0.05 }
}
// #endregion

const CSS =
  ".oss-root{position:relative;overflow:hidden;isolation:isolate;color:var(--oss-ink);font-family:ui-sans-serif,system-ui,sans-serif;outline:none;user-select:none;-webkit-user-select:none}" +
  ".oss-root:focus-visible{box-shadow:inset 0 0 0 2px var(--oss-accent)}" +
  ".oss-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:pan-y}" +
  ".oss-canvas.oss-hot{cursor:pointer}" +
  ".oss-canvas:active{cursor:grabbing}" +
  ".oss-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(40% 45% at 62% 52%,color-mix(in srgb,var(--oss-accent) 16%,transparent),transparent 70%)}" +
  ".oss-head{position:absolute;left:clamp(20px,4vw,56px);top:clamp(22px,5vh,56px);max-width:min(520px,80%);pointer-events:none}" +
  ".oss-eyebrow{display:flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.26em;text-transform:uppercase;opacity:.65}" +
  ".oss-eyebrow::before{content:'';width:22px;height:1px;background:var(--oss-accent)}" +
  ".oss-h{margin:16px 0 0;font-weight:600;font-size:clamp(38px,5.4vw,80px);line-height:.95;letter-spacing:-.045em}" +
  ".oss-h em{font-style:normal;background:linear-gradient(100deg,var(--oss-ink),var(--oss-accent));-webkit-background-clip:text;background-clip:text;color:transparent}" +
  ".oss-card{position:absolute;left:clamp(20px,4vw,56px);bottom:clamp(22px,5vh,56px);width:min(380px,calc(100% - 40px));padding:22px 22px 20px;border-radius:20px;" +
  "background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(18px) saturate(1.3);-webkit-backdrop-filter:blur(18px) saturate(1.3);" +
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 30px 60px -30px rgba(0,0,0,.8)}" +
  ".oss-card>*{animation:oss-up .7s cubic-bezier(.16,1,.3,1) both}" +
  ".oss-card>*:nth-child(2){animation-delay:.05s}.oss-card>*:nth-child(3){animation-delay:.1s}.oss-card>*:nth-child(4){animation-delay:.15s}" +
  ".oss-row{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:.65;font-variant-numeric:tabular-nums}" +
  ".oss-row em{font-style:normal;color:var(--oss-accent);opacity:1}" +
  ".oss-t{display:block;margin-top:12px;font-size:28px;font-weight:600;letter-spacing:-.03em;line-height:1.05}" +
  ".oss-s{margin:10px 0 0;font-size:14px;line-height:1.55;opacity:.7}" +
  ".oss-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px}" +
  ".oss-cta{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border-radius:999px;background:var(--oss-ink);color:var(--oss-bg);font-size:12px;font-weight:600;letter-spacing:.06em;text-decoration:none;transition:transform .35s cubic-bezier(.3,1.6,.5,1),background .3s ease}" +
  ".oss-cta:hover{transform:translateY(-2px);background:var(--oss-accent)}" +
  ".oss-cta svg,.oss-btn svg{width:15px;height:15px}" +
  ".oss-btns{display:flex;gap:8px}" +
  ".oss-btn{width:40px;height:40px;border-radius:999px;display:grid;place-items:center;cursor:pointer;color:var(--oss-ink);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);transition:transform .35s cubic-bezier(.3,1.6,.5,1),background .3s ease}" +
  ".oss-btn:hover{transform:scale(1.08);background:rgba(255,255,255,.14)}" +
  ".oss-btn:focus-visible,.oss-cta:focus-visible{outline:2px solid var(--oss-accent);outline-offset:3px}" +
  ".oss-hint{position:absolute;right:clamp(20px,4vw,56px);bottom:clamp(22px,5vh,56px);font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.45;pointer-events:none}" +
  ".oss-tip{position:absolute;left:0;top:0;padding:7px 11px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;color:var(--oss-bg);background:var(--oss-ink);pointer-events:none;opacity:0;transform:translate(-50%,-160%);transition:opacity .2s ease}" +
  ".oss-tip.oss-show{opacity:1}" +
  ".oss-fallback{position:absolute;right:8%;top:50%;width:min(46%,560px);aspect-ratio:16/10;transform:translateY(-50%);object-fit:cover;border-radius:14px;max-width:none}" +
  "@keyframes oss-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}" +
  "@media (max-width:640px){.oss-hint{display:none}.oss-card{padding:18px}.oss-t{font-size:22px}.oss-s{display:none}}" +
  "@media (prefers-reduced-motion:reduce){.oss-card>*{animation:none}.oss-cta,.oss-btn{transition:none}}"

const Arrow = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

/** Draws a photo into a rounded 16:10 canvas so the plane gets soft corners and a thin rim. */
function screenTexture(img: HTMLImageElement): THREE.CanvasTexture {
  const w = 640, h = 400, r = 26
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const g = c.getContext("2d") as CanvasRenderingContext2D
  g.beginPath()
  g.roundRect(4, 4, w - 8, h - 8, r)
  g.save()
  g.clip()
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const iw = img.naturalWidth * s, ih = img.naturalHeight * s
  g.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih)
  const sheen = g.createLinearGradient(0, 0, w, h)
  sheen.addColorStop(0, "rgba(255,255,255,.16)")
  sheen.addColorStop(0.4, "rgba(255,255,255,0)")
  g.fillStyle = sheen
  g.fillRect(0, 0, w, h)
  g.restore()
  g.lineWidth = 3
  g.strokeStyle = "rgba(255,255,255,.35)"
  g.stroke()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export default function OrbitScreensShowcase({
  screens,
  heading = (
    <>
      Work that
      <br />
      <em>moves people</em>
    </>
  ),
  eyebrow = "Selected projects",
  ctaLabel = "Open case",
  background = "#07080c",
  ink = "#eef0f6",
  accent = "#8fa8ff",
  height = "100svh",
  className,
  onChange,
}: OrbitScreensShowcaseProps) {
  const n = screens.length
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const tipRef = React.useRef(null as HTMLDivElement | null)
  const [index, setIndex] = React.useState(0)
  const [noGL, setNoGL] = React.useState(false)
  const api = React.useRef({ go: (_i: number) => {} })
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas || n === 0) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" })
    } catch {
      setNoGL(true)
      return
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const bg = new THREE.Color(background)
    const fog = new THREE.Fog(bg, 9, 15)
    scene.fog = fog
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60)

    const center = new THREE.Group()
    scene.add(center)

    // the ring
    const ring = new THREE.Group()
    ring.rotation.set(0.32, 0, -0.1)
    center.add(ring)
    const orbitGeo = new THREE.RingGeometry(1, 1.004, 160)
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
    const orbitLine = new THREE.Mesh(orbitGeo, orbitMat)
    orbitLine.rotation.x = -Math.PI / 2
    ring.add(orbitLine)

    // a pool of stage light the screens circle, tinted by the accent
    const glow = document.createElement("canvas")
    glow.width = glow.height = 256
    const gg = glow.getContext("2d") as CanvasRenderingContext2D
    const rg = gg.createRadialGradient(128, 128, 0, 128, 128, 128)
    rg.addColorStop(0, "rgba(255,255,255,.95)")
    rg.addColorStop(0.35, "rgba(255,255,255,.3)")
    rg.addColorStop(1, "rgba(255,255,255,0)")
    gg.fillStyle = rg
    gg.fillRect(0, 0, 256, 256)
    const poolTex = new THREE.CanvasTexture(glow)
    const poolGeo = new THREE.PlaneGeometry(1, 1)
    const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(accent), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
    const pool = new THREE.Mesh(poolGeo, poolMat)
    pool.rotation.x = -Math.PI / 2
    pool.position.y = -0.55
    ring.add(pool)

    const plane = new THREE.PlaneGeometry(1.84, 1.15)
    const blank = new THREE.MeshBasicMaterial({ color: 0x1a1c24 })
    const items = screens.map((s, i) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, opacity: 1 })
      const mesh = new THREE.Mesh(plane, blank)
      mesh.userData.i = i
      ring.add(mesh)
      const img = new Image()
      if (!s.image.startsWith("data:")) img.crossOrigin = "anonymous"
      img.onload = () => {
        if (disposed) return
        mat.map = screenTexture(img)
        mat.needsUpdate = true
        mesh.material = mat
        kick()
      }
      img.src = s.image
      return { mesh, mat, hover: 0, intro: 0 }
    })

    // dust
    const dustGeo = new THREE.BufferGeometry()
    const pts = new Float32Array(420 * 3)
    for (let i = 0; i < 420; i++) {
      const r = 4 + Math.random() * 7, a = Math.random() * TAU, y = (Math.random() - 0.5) * 7
      pts.set([Math.cos(a) * r, y, Math.sin(a) * r - 2], i * 3)
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pts, 3))
    const dustMat = new THREE.PointsMaterial({ color: 0xaab4ff, size: 0.025, transparent: true, opacity: 0.55 })
    const dust = new THREE.Points(dustGeo, dustMat)
    scene.add(dust)

    let disposed = false
    let W = 1, H = 1, radius = 3.3
    let turn = 0, target = 0, vel = 0, drift = 0
    let px = 0, py = 0, tx = 0, ty = 0
    let hot = -1, cur = -1
    let rect = { left: 0, top: 0 }
    let dragging = false, downX = 0, downTarget = 0, moved = 0, lastX = 0, lastT = 0
    let raf = 0, last = 0, visible = true, t0 = -1
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2(9, 9)
    const tmp = new THREE.Vector3()

    const resize = (w: number, h: number) => {
      W = Math.max(1, w)
      H = Math.max(1, h)
      renderer.setSize(W, H, false)
      camera.aspect = W / H
      const f = framing(camera.aspect)
      radius = f.radius
      camera.position.set(0, 0.9, f.dist)
      camera.lookAt(0, 0, 0)
      center.position.set(f.x, f.y, 0)
      fog.near = f.dist - 1.5
      fog.far = f.dist + 5
      orbitLine.scale.setScalar(radius)
      pool.scale.setScalar(radius * 2.4)
      camera.updateProjectionMatrix()
      kick()
    }

    // Canvas position for hit-testing: read when the pointer enters or presses, never per frame.
    const measure = () => {
      const r = canvas.getBoundingClientRect()
      rect = { left: r.left, top: r.top }
    }

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      if (t0 < 0) t0 = now
      const time = (now - t0) / 1000
      const still = mq.matches
      if (!dragging) {
        const a = (target - turn) * 40 - vel * 12
        vel += a * dt
        turn += vel * dt
      }
      if (still) {
        turn = target
        vel = 0
      } else drift += dt * 0.05
      px += (tx - px) * (1 - Math.exp(-dt * 4))
      py += (ty - py) * (1 - Math.exp(-dt * 4))
      const ki = still ? 1 : Math.min(1, time / 1.4)
      poolMat.opacity = (1 - Math.pow(1 - ki, 3)) * (still ? 0.9 : 0.8 + 0.2 * Math.sin(time * 0.9))
      center.rotation.x = py * 0.12
      center.rotation.y = px * 0.18
      dust.rotation.y = still ? 0 : time * 0.012

      // hover hit-test against the latest pointer
      ray.setFromCamera(ndc, camera)
      const hits = ray.intersectObjects(items.map((it) => it.mesh), false)
      const h = !dragging && hits.length ? (hits[0].object.userData.i as number) : -1
      if (h !== hot) {
        hot = h
        canvas.classList.toggle("oss-hot", h >= 0)
        const tip = tipRef.current
        if (tip) {
          tip.classList.toggle("oss-show", h >= 0)
          if (h >= 0) tip.textContent = screens[h].title
        }
      }

      const turnNow = turn + (still ? 0 : Math.sin(drift) * 0.06)
      for (let i = 0; i < n; i++) {
        const it = items[i]
        it.intro = still ? 1 : Math.min(1, Math.max(0, (time - 0.25 - i * 0.08) / 0.9))
        const e = 1 - Math.pow(1 - it.intro, 4)
        const a = screenAngle(i, turnNow, n) + (1 - e) * 2
        const r = radius * (0.2 + 0.8 * e)
        it.mesh.position.set(Math.cos(a) * r, Math.sin(time * 0.8 + i) * 0.06 * (still ? 0 : 1), Math.sin(a) * r)
        it.hover += ((i === hot ? 1 : 0) - it.hover) * (1 - Math.exp(-dt * 10))
        const front = (Math.sin(a) + 1) / 2
        it.mesh.scale.setScalar(e * (0.78 + front * 0.32 + it.hover * 0.14))
        it.mesh.getWorldPosition(tmp)
        it.mesh.lookAt(camera.position.x * 0.6 + tmp.x * 0.4, camera.position.y * 0.6, camera.position.z)
        it.mat.opacity = 0.35 + front * 0.65
      }

      const idx = wrap(Math.round(target), n)
      if (idx !== cur) {
        cur = idx
        setIndex(idx)
        onChangeRef.current?.(idx)
      }
      renderer.render(scene, camera)
      const busy = !still || dragging || Math.abs(target - turn) > 0.0005 || Math.abs(vel) > 0.001 || Math.abs(tx - px) > 0.001 || Math.abs(ty - py) > 0.001
      if (busy && visible) raf = requestAnimationFrame(frame)
      else last = 0
    }
    function kick() {
      if (!raf && visible && !disposed) raf = requestAnimationFrame(frame)
    }

    api.current.go = (i: number) => {
      target = turnTo(wrap(i, n), target, n)
      kick()
    }

    const onEnter = () => measure()
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      measure()
      dragging = true
      downX = lastX = e.clientX
      lastT = e.timeStamp
      downTarget = turn
      moved = 0
      vel = 0
      canvas.setPointerCapture(e.pointerId)
      kick()
    }
    const onMove = (e: PointerEvent) => {
      const [x, y] = toNdc(e.clientX, e.clientY, rect.left, rect.top, W, H)
      ndc.set(x, y)
      tx = x
      ty = y
      const tip = tipRef.current
      if (tip) tip.style.transform = "translate(" + (e.clientX - rect.left) + "px," + (e.clientY - rect.top) + "px) translate(-50%,-160%)"
      if (dragging) {
        const dx = e.clientX - downX
        moved = Math.max(moved, Math.abs(dx))
        turn = downTarget - (dx / W) * n * 0.9
        const dts = Math.max(1, e.timeStamp - lastT) / 1000
        vel = vel * 0.5 + ((-(e.clientX - lastX) / W) * n * 0.9 / dts) * 0.5
        lastX = e.clientX
        lastT = e.timeStamp
      }
      kick()
    }
    const onUp = () => {
      if (!dragging) return
      dragging = false
      target = Math.round(turn + Math.max(-2, Math.min(2, vel * 0.15)))
      if (moved < 6 && hot >= 0) target = turnTo(hot, turn, n)
      kick()
    }
    const onLeave = () => {
      ndc.set(9, 9)
      tx = ty = 0
      kick()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") api.current.go(Math.round(target) + 1)
      else if (e.key === "ArrowLeft") api.current.go(Math.round(target) - 1)
      else return
      e.preventDefault()
    }
    const onMq = () => kick()

    canvas.addEventListener("pointerenter", onEnter)
    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("pointercancel", onUp)
    canvas.addEventListener("pointerleave", onLeave)
    root.addEventListener("keydown", onKey)
    mq.addEventListener("change", onMq)
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      resize(r.width, r.height)
    })
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      kick()
    })
    io.observe(root)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener("pointerenter", onEnter)
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      canvas.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("keydown", onKey)
      mq.removeEventListener("change", onMq)
      for (const it of items) {
        it.mat.map?.dispose()
        it.mat.dispose()
      }
      blank.dispose()
      plane.dispose()
      poolTex.dispose()
      poolGeo.dispose()
      poolMat.dispose()
      orbitGeo.dispose()
      orbitMat.dispose()
      dustGeo.dispose()
      dustMat.dispose()
      renderer.dispose()
    }
  }, [n, screens, background, accent])

  if (n === 0) return null
  const s = screens[index]
  const pad = (v: number) => (v < 10 ? "0" + v : String(v))
  const vars = { height, background, "--oss-bg": background, "--oss-ink": ink, "--oss-accent": accent } as React.CSSProperties

  return (
    <div ref={rootRef} className={"oss-root" + (className ? " " + className : "")} style={vars} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Project showcase">
      <style>{CSS}</style>
      <div className="oss-glow" aria-hidden="true" />
      <canvas ref={canvasRef} className="oss-canvas" aria-hidden="true" />
      {noGL ? <img className="oss-fallback" src={s.image} alt="" /> : null}
      <div ref={tipRef} className="oss-tip" aria-hidden="true" />
      <header className="oss-head">
        <span className="oss-eyebrow">{eyebrow}</span>
        <h2 className="oss-h">{heading}</h2>
      </header>
      <div className="oss-card" key={index} aria-live="polite">
        <span className="oss-row">
          <span>{s.meta}</span>
          <span>
            <em>{pad(index + 1)}</em> / {pad(n)}
          </span>
        </span>
        <b className="oss-t">{s.title}</b>
        {s.summary ? <p className="oss-s">{s.summary}</p> : null}
        <div className="oss-foot">
          {s.href ? (
            <a className="oss-cta" href={s.href}>
              {ctaLabel}
              <Arrow d="M7 17L17 7M9 7h8v8" />
            </a>
          ) : (
            <span />
          )}
          <span className="oss-btns">
            <button type="button" className="oss-btn" aria-label="Previous project" onClick={() => api.current.go(index - 1)}>
              <Arrow d="M15 5l-7 7 7 7" />
            </button>
            <button type="button" className="oss-btn" aria-label="Next project" onClick={() => api.current.go(index + 1)}>
              <Arrow d="M9 5l7 7-7 7" />
            </button>
          </span>
        </div>
      </div>
      <span className="oss-hint" aria-hidden="true">Drag to orbit · click a screen</span>
    </div>
  )
}
