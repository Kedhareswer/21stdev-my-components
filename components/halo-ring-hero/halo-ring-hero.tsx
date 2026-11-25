"use client"

import * as React from "react"
import * as THREE from "three"

/**
 * Halo Ring Hero
 *
 * A portfolio intro told as one camera move. A loading count rolls in while the
 * work, as a ring of portrait cards, assembles card by card. When the ring
 * closes, a sunset sky fades in behind it and the camera dives through the open
 * top until you stand inside the ring, looking across it. The page then frames
 * itself around the scene: a nav, a headline and stats that count up. The ring
 * keeps turning; drag it to spin it.
 *
 * The same card objects persist from the first frame to the last, and one clock
 * drives everything: camera, cards, sky, counter and page. The timeline is pure
 * functions in the `timeline` region below, so it can be tested as shipped.
 */

const SITE = "https://kedhar-components.pages.dev/halo-ring-hero/"

export type HaloRingStat = { value: number; decimals?: number; suffix?: string; label: string }
export type HaloRingWord = { text: string; underline?: boolean }

export type HaloRingHeroProps = {
  /** Definite height of the hero. Defaults to the small viewport height. */
  height?: string
  /** Short wordmark shown big while loading, then in the nav. */
  name?: string
  /** Written in after the short name once it reaches the nav. */
  nameSuffix?: string
  /** Portrait (9:16) images for the ring. 16 to 32 work best. */
  cards?: string[]
  /** Background shown once the ring closes. */
  sky?: string
  /** Nav links. */
  links?: { label: string; href: string }[]
  /** Two lines of headline; words marked `underline` get an animated underline. */
  headline?: HaloRingWord[][]
  /** Three figures that count up at the end of the intro. */
  stats?: HaloRingStat[]
  /** Label above the loading count. */
  loadingLabel?: string
  className?: string
}

const DEFAULT_CARDS = Array.from({ length: 24 }, (_, i) => SITE + "card-" + String(i + 1).padStart(2, "0") + ".webp")

const DEFAULT_HEADLINE: HaloRingWord[][] = [
  [{ text: "I build interfaces for " }, { text: "founders", underline: true }, { text: ", components for " }, { text: "developers", underline: true }],
  [{ text: "and free kits for " }, { text: "students", underline: true }, { text: ". Or just " }, { text: "say hello", underline: true }, { text: "." }],
]

const DEFAULT_STATS: HaloRingStat[] = [
  { value: 296, suffix: "+", label: "Components" },
  { value: 84.6, decimals: 1, suffix: "K", label: "Installs" },
  { value: 12.4, decimals: 1, suffix: "K", label: "Followers" },
]

const DEFAULT_LINKS = [
  { label: "Work", href: "#work" },
  { label: "Components", href: "#components" },
  { label: "Notes", href: "#notes" },
]

// #region timeline
// Seconds from the moment the pictures are ready. Read off the reference at 60 fps.
const T = {
  markIn: [0, 0.65],
  countRise: [0, 0.25],
  count: [0.05, 0.8],
  build: [0.1, 1.87],
  pop: 0.3,
  sky: [2.02, 2.45],
  countOut: [2.15, 2.5],
  dive: [2.0, 2.85],
  shrink: [2.2, 2.95],
  suffix: [3.1, 3.4],
  frame: [3.15, 3.55],
  links: [3.2, 3.45],
  line1: [3.2, 3.55],
  line2: [3.38, 3.73],
  stats: [3.55, 4.6],
  underline: [3.7, 4.2],
  idle: 3.0,
  end: 4.7,
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const span = (t: number, ab: number[]) => clamp01((t - ab[0]) / (ab[1] - ab[0]))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const easeOut3 = (x: number) => 1 - Math.pow(1 - x, 3)
const easeInOut3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const easeOutBack = (x: number) => {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

/**
 * When card k of n starts to pop in. Measured off the reference: the first
 * quarter of the ring (front, then up the right side) lands fast, the back row
 * fills at an even pace, and the last quarter closes the front-left quickly.
 */
const BUILD_KNOTS = [
  [0, 0.1],
  [0.4, 0.6],
  [0.8, 1.5],
  [1, 1.87 - 0.3],
]
function cardStart(k: number, n: number) {
  const f = n <= 1 ? 0 : k / (n - 1)
  for (let i = 1; i < BUILD_KNOTS.length; i++) {
    const [f0, t0] = BUILD_KNOTS[i - 1]
    const [f1, t1] = BUILD_KNOTS[i]
    if (f <= f1) return lerp(t0, t1, (f - f0) / (f1 - f0))
  }
  return BUILD_KNOTS[BUILD_KNOTS.length - 1][1]
}

/** 0..1 appearance of card k at time t. */
function cardShown(t: number, k: number, n: number) {
  return clamp01((t - cardStart(k, n)) / T.pop)
}

/** Loading count, continuous 0..100. */
function countAt(t: number) {
  return 100 * easeOut3(span(t, T.count))
}

/**
 * Odometer wheel position (0..10, 10 = the wrapped 0) for decimal place `place`
 * of a continuous count. A wheel only turns while every wheel to its right is
 * rolling over from 9 to 0, as on a mechanical counter.
 */
function odometer(c: number, place: number) {
  const unit = Math.pow(10, place)
  const whole = Math.floor(c / unit)
  const carry = Math.max(0, (c % unit) - (unit - 1))
  const v = (whole % 10) + carry
  return c >= 100 && place === 2 ? 1 : v
}

/** Ring yaw (radians) driven by the clock alone. */
// The ring turns one way only and its speed never drops to zero: it eases in
// as the first cards land, drifts slowly while the ring builds, then speeds up
// through the dive into the idle spin (one card slot every 0.9 s).
const YAW_BUILD = 0.16
const YAW_RAMP = [T.dive[0], T.idle + 0.45]
function yawSpeed(t: number, slot: number) {
  if (t <= T.build[0]) return 0
  const start = easeOut3(clamp01((t - T.build[0]) / 0.5))
  const k = easeInOut3(span(t, YAW_RAMP))
  return start * lerp(YAW_BUILD, slot / 0.9, k)
}
function ringYaw(t: number, slot: number) {
  // integrate the speed (Simpson's rule) up to the end of the ramp, then it is constant
  const end = Math.min(t, YAW_RAMP[1])
  let yaw = 0
  if (end > T.build[0]) {
    const steps = 48
    const a = T.build[0]
    const h = (end - a) / steps
    let acc = yawSpeed(a, slot) + yawSpeed(end, slot)
    for (let i = 1; i < steps; i++) acc += yawSpeed(a + i * h, slot) * (i % 2 ? 4 : 2)
    yaw = (acc * h) / 3
  }
  if (t > YAW_RAMP[1]) yaw += (slot / 0.9) * (t - YAW_RAMP[1])
  return yaw
}

type Cam = { px: number; py: number; pz: number; tx: number; ty: number; tz: number; vfov: number; roll: number }

/**
 * Camera at time t. `outside` and `inside` are the two framings (they depend on
 * the stage's aspect). The dive drops the height slower than it closes the
 * distance, so the camera clears the near wall and the front cards fall away
 * below the frame instead of passing through it.
 */
function cameraAt(t: number, outside: Cam, inside: Cam): Cam {
  // the pull-back runs on into the dive instead of settling first, so the
  // camera never stops between the build and the dive
  const pq = span(t, [T.build[0], T.dive[1]])
  const pull = lerp(0.86, 1, pq * (2 - pq))
  const s = easeInOut3(span(t, T.dive))
  const drop = Math.pow(s, 1.6)
  return {
    px: lerp(outside.px * pull, inside.px, s),
    py: lerp(outside.py * pull, inside.py, drop),
    pz: lerp(outside.pz * pull, inside.pz, s),
    tx: lerp(outside.tx, inside.tx, s),
    ty: lerp(outside.ty, inside.ty, s),
    tz: lerp(outside.tz, inside.tz, s),
    // the lens only widens once the camera is past the wall; widening it while
    // still outside would shrink the ring for a moment before it grows
    vfov: lerp(outside.vfov, inside.vfov, easeInOut3(clamp01((s - 0.5) / 0.5))),
    roll: lerp(outside.roll, inside.roll, s),
  }
}
// #endregion

// ---------------------------------------------------------------------------

const CSS =
  ".hrh-root{position:relative;width:100%;overflow:hidden;background:var(--color-background,#f6f4ef);color:var(--color-foreground,#111);container-type:size;isolation:isolate;--hrh-g:clamp(14px,2.2cqw,28px)}" +
  ".hrh-root *{box-sizing:border-box}" +
  ".hrh-scene{position:absolute;inset:0;z-index:0;overflow:hidden;touch-action:pan-y;cursor:default}" +
  ".hrh-scene[data-live]{cursor:grab}.hrh-scene[data-drag]{cursor:grabbing}" +
  ".hrh-sky{position:absolute;inset:-2%;background-size:cover;background-position:50% 42%;opacity:0}" +
  ".hrh-cover{position:absolute;inset:0;background:var(--color-background,#f6f4ef)}" +
  ".hrh-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}" +
  ".hrh-ui{position:absolute;inset:0;z-index:2;pointer-events:none}" +
  ".hrh-ui a,.hrh-ui button{pointer-events:auto}" +
  ".hrh-mark{position:absolute;left:var(--hrh-g);top:0;margin:0;font-family:ui-serif,'Iowan Old Style','Palatino Linotype',Georgia,serif;font-weight:400;letter-spacing:-.02em;line-height:1;white-space:nowrap;transform-origin:0 0}" +
  ".hrh-mark span{display:inline-block;overflow:hidden;vertical-align:top;padding:.04em 0 .12em}" +
  ".hrh-mark span i{display:inline-block;font-style:normal;will-change:transform}" +
  ".hrh-count{position:absolute;right:var(--hrh-g);bottom:var(--hrh-g);text-align:right;font-family:ui-monospace,'SF Mono','Cascadia Mono',Menlo,Consolas,monospace;line-height:1}" +
  ".hrh-count small{display:block;font-size:9px;letter-spacing:.18em;text-transform:uppercase;opacity:.5;margin-bottom:8px}" +
  ".hrh-digits{display:inline-flex;align-items:flex-end;font-size:clamp(40px,6.2cqw,92px);letter-spacing:-.04em}" +
  ".hrh-col{display:inline-block;height:1em;overflow:hidden;position:relative}" +
  ".hrh-col b{display:block;font-weight:400;will-change:transform}" +
  ".hrh-col b i{display:block;height:1em;font-style:normal}" +
  ".hrh-pct{font-size:11px;margin-left:4px;opacity:.6;align-self:flex-end;padding-bottom:.2em}" +
  ".hrh-nav{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;justify-content:flex-end;gap:clamp(10px,2cqw,22px);padding:0 var(--hrh-g);height:var(--hrh-nav);font-size:12px}" +
  ".hrh-nav a,.hrh-nav button{color:inherit;text-decoration:none;opacity:.62;background:none;border:0;font:inherit;padding:6px 0;cursor:pointer}" +
  ".hrh-nav [data-done]{transition:opacity .2s}" +
  ".hrh-nav a:hover,.hrh-nav button:hover{opacity:1}" +
  ".hrh-nav a:focus-visible,.hrh-nav button:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:2px;opacity:1}" +
  ".hrh-links{display:flex;gap:clamp(10px,2cqw,22px);margin-right:auto;margin-left:calc(var(--hrh-markw,120px) + 18px)}" +
  ".hrh-bar{position:absolute;left:0;right:0;bottom:0;height:var(--hrh-bar);display:flex;align-items:center;justify-content:space-between;gap:24px;padding:0 var(--hrh-g)}" +
  ".hrh-head{margin:0;font-family:ui-serif,'Iowan Old Style','Palatino Linotype',Georgia,serif;font-weight:400;font-size:clamp(15px,1.75cqw,24px);line-height:1.22;letter-spacing:-.01em;min-width:0}" +
  ".hrh-line{display:block;overflow:hidden;padding-bottom:.08em;white-space:nowrap}" +
  ".hrh-line>span{display:block;will-change:transform}" +
  ".hrh-u{background-image:linear-gradient(currentColor,currentColor);background-repeat:no-repeat;background-position:0 100%;background-size:0 1px;padding-bottom:1px}" +
  ".hrh-u sup{font-size:.55em;margin-left:.1em;opacity:0;font-family:ui-monospace,Menlo,Consolas,monospace}" +
  ".hrh-stats{display:flex;gap:clamp(16px,3cqw,44px);flex:none}" +
  ".hrh-stat{text-align:right}" +
  ".hrh-stat b{display:block;font-weight:400;font-family:ui-serif,'Iowan Old Style','Palatino Linotype',Georgia,serif;font-size:clamp(18px,2.1cqw,30px);letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}" +
  ".hrh-stat small{display:block;margin-top:6px;font-size:9px;letter-spacing:.16em;text-transform:uppercase;opacity:.55}" +
  "@container (max-width:720px){.hrh-line{white-space:normal}.hrh-bar{flex-direction:column;align-items:flex-start;justify-content:center;gap:12px}.hrh-stats{width:100%;justify-content:space-between}.hrh-stat{text-align:left}.hrh-links{display:none}}" +
  "@container (max-width:420px){.hrh-head{font-size:15px}}" +
  ".hrh-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}"

type Built = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  ring: THREE.Group
  cards: THREE.Mesh[]
  mats: THREE.MeshBasicMaterial[]
  dispose: () => void
}

/** A card bent onto the cylinder, centred on its own origin so it can pop and hinge in place. */
function cardGeometry(R: number, w: number, h: number, seg: number) {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let j = 0; j <= 1; j++) {
    for (let i = 0; i <= seg; i++) {
      const u = i / seg - 0.5
      const phi = (-u * w) / R
      pos.push(R * Math.sin(phi), (j - 0.5) * h, R * Math.cos(phi) - R)
      uv.push(u + 0.5, j)
    }
  }
  for (let i = 0; i < seg; i++) {
    const a = i
    const b = i + 1
    const c = i + seg + 1
    const d = i + seg + 2
    idx.push(a, c, b, b, c, d)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

/** Draw a picture into a rounded 9:16 canvas (object-fit: cover). */
function cardCanvas(img: HTMLImageElement | null) {
  const W = 432
  const H = 768
  const c = document.createElement("canvas")
  c.width = W
  c.height = H
  const x = c.getContext("2d")
  if (!x) return c
  const r = 30
  x.beginPath()
  x.moveTo(r, 0)
  x.arcTo(W, 0, W, H, r)
  x.arcTo(W, H, 0, H, r)
  x.arcTo(0, H, 0, 0, r)
  x.arcTo(0, 0, W, 0, r)
  x.closePath()
  x.clip()
  x.fillStyle = "#1d1b1a"
  x.fillRect(0, 0, W, H)
  if (img && img.naturalWidth) {
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight)
    const dw = img.naturalWidth * s
    const dh = img.naturalHeight * s
    x.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
  }
  return c
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const im = new Image()
    im.crossOrigin = "anonymous"
    im.decoding = "async"
    im.onload = () => resolve(im)
    im.onerror = () => resolve(null)
    im.src = src
  })
}

const R = 1
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function HaloRingHero({
  height = "100svh",
  name = "Kedhar",
  nameSuffix = " Naidu",
  cards = DEFAULT_CARDS,
  sky = SITE + "sky.webp",
  links = DEFAULT_LINKS,
  headline = DEFAULT_HEADLINE,
  stats = DEFAULT_STATS,
  loadingLabel = "Loading work",
  className,
}: HaloRingHeroProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const sceneRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const skyRef = React.useRef(null as HTMLDivElement | null)
  const coverRef = React.useRef(null as HTMLDivElement | null)
  const markRef = React.useRef(null as HTMLHeadingElement | null)
  const countRef = React.useRef(null as HTMLDivElement | null)
  const navRef = React.useRef(null as HTMLDivElement | null)
  const barRef = React.useRef(null as HTMLDivElement | null)
  const startRef = React.useRef(-1)
  const [replays, setReplays] = React.useState(0)

  const mark = name.split("")
  const suffix = nameSuffix.split("")
  const n = Math.max(3, cards.length)

  React.useEffect(() => {
    const root = rootRef.current
    const sceneEl = sceneRef.current
    const canvas = canvasRef.current
    if (!root || !sceneEl || !canvas) return
    const reduced = reducedMotion()

    let built: Built | null = null
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" })
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(30, 2, 0.02, 60)
      const ring = new THREE.Group()
      scene.add(ring)
      const w = ((2 * Math.PI * R) / n) * 0.9
      const h = (w * 16) / 9
      const geo = cardGeometry(R, w, h, 18)
      const meshes: THREE.Mesh[] = []
      const mats: THREE.MeshBasicMaterial[] = []
      for (let k = 0; k < n; k++) {
        const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0, color: 0xffffff })
        const m = new THREE.Mesh(geo, mat)
        // build order runs around the ring from the front card
        const theta = (k / n) * Math.PI * 2
        m.position.set(R * Math.sin(theta), 0, R * Math.cos(theta))
        m.rotation.y = theta
        m.visible = false
        ring.add(m)
        meshes.push(m)
        mats.push(mat)
      }
      built = {
        renderer,
        scene,
        camera,
        ring,
        cards: meshes,
        mats,
        dispose: () => {
          geo.dispose()
          mats.forEach((m) => {
            m.map?.dispose()
            m.dispose()
          })
          renderer.dispose()
        },
      }
    } catch {
      built = null
    }

    // ---- layout ----
    let W = 1
    let H = 1
    let navH = 56
    let barH = 120
    const measure = () => {
      const r = root.getBoundingClientRect()
      W = Math.max(1, r.width)
      H = Math.max(1, r.height)
      navH = Math.round(Math.min(64, Math.max(46, H * 0.07)))
      const narrow = W <= 720
      barH = Math.round(narrow ? Math.min(220, Math.max(160, H * 0.24)) : Math.min(170, Math.max(104, H * 0.178)))
      root.style.setProperty("--hrh-nav", navH + "px")
      root.style.setProperty("--hrh-bar", barH + "px")
      if (built) {
        built.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        built.renderer.setSize(W, H, false)
        built.camera.aspect = W / H
      }
    }
    measure()

    // framings depend on aspect
    const framings = () => {
      const aspect = W / H
      // outside: from above and in front, ring filling ~41% of the width on wide stages
      const frac = aspect > 1.2 ? 0.5 : aspect > 0.8 ? 0.66 : 0.8
      const vfovOut = 30
      const tv = Math.tan(((vfovOut / 2) * Math.PI) / 180)
      const halfW = (2 * R) / frac / 2
      let D = halfW / (aspect * tv)
      D = Math.max(D, (R * 1.35) / tv)
      const el = (37 * Math.PI) / 180
      const outside: Cam = { px: 0, py: D * Math.sin(el), pz: D * Math.cos(el), tx: aspect > 1.2 ? 0.1 : 0, ty: -0.04, tz: 0, vfov: vfovOut, roll: 0.13 }
      // inside: near the ring's centre with a very wide lens. Every card is about
      // equally far away, so the size falloff from the edges to the middle comes
      // from the lens itself, as in the reference (far card ~4% of the width,
      // edge cards ~70% of the panel height, bent and skewed).
      const insetH = Math.max(1, H - navH - barH)
      const insetAspect = W / insetH
      const hfov = 128
      const th = Math.tan(((hfov / 2) * Math.PI) / 180)
      // cap the vertical field: on squarer and tall stages the horizontal field
      // narrows instead, so the cards stay large rather than a thin strip
      const tvIn = Math.min(th / Math.max(0.3, insetAspect), 0.85)
      const vInFull = (2 * Math.atan(tvIn * (H / insetH)) * 180) / Math.PI
      const inside: Cam = { px: 0, py: 0, pz: 0.12 * R, tx: 0, ty: 0, tz: -R, vfov: Math.min(160, vInFull), roll: 0 }
      return { outside, inside }
    }
    let frame = framings()

    // ---- load pictures, then start the clock ----
    let alive = true
    let ready = false
    const skyImg = loadImage(sky)
    const cardImgs = cards.map(loadImage)
    const cap = new Promise<null>((r) => setTimeout(() => r(null), 5000))
    Promise.race([Promise.all([skyImg, ...cardImgs]), cap]).then(async () => {
      if (!alive) return
      const s = await Promise.race([skyImg, Promise.resolve(null)])
      if (s && skyRef.current) skyRef.current.style.backgroundImage = "url(" + JSON.stringify(s.src) + ")"
      if (built) {
        const maxAniso = built.renderer.capabilities.getMaxAnisotropy()
        for (let k = 0; k < n; k++) {
          const img = await Promise.race([cardImgs[k % cardImgs.length], Promise.resolve(null)])
          const tex = new THREE.CanvasTexture(cardCanvas(img))
          tex.colorSpace = THREE.SRGBColorSpace
          tex.anisotropy = Math.min(8, maxAniso)
          built.mats[k].map = tex
          built.mats[k].needsUpdate = true
        }
      }
      ready = true
      startRef.current = performance.now()
    })

    // ---- drag to spin ----
    let drag = 0
    let vel = 0
    let dragging = false
    let lastX = 0
    let lastT = 0
    const onDown = (e: PointerEvent) => {
      if (reduced || clock() < T.idle) return
      dragging = true
      lastX = e.clientX
      lastT = performance.now()
      vel = 0
      sceneEl.setPointerCapture(e.pointerId)
      sceneEl.setAttribute("data-drag", "")
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const now = performance.now()
      const dx = e.clientX - lastX
      const d = (dx / Math.max(320, W)) * 2.4
      drag += d
      vel = d / Math.max(8, now - lastT)
      lastX = e.clientX
      lastT = now
    }
    const onUp = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      sceneEl.removeAttribute("data-drag")
      if (sceneEl.hasPointerCapture(e.pointerId)) sceneEl.releasePointerCapture(e.pointerId)
    }
    sceneEl.addEventListener("pointerdown", onDown)
    sceneEl.addEventListener("pointermove", onMove)
    sceneEl.addEventListener("pointerup", onUp)
    sceneEl.addEventListener("pointercancel", onUp)

    // ---- the one clock ----
    const clock = () => {
      if (!ready) return 0
      if (reduced) return T.end + 2
      return (performance.now() - startRef.current) / 1000
    }

    const markEl = markRef.current
    const letters = markEl ? Array.from(markEl.querySelectorAll("[data-l]")) as HTMLElement[] : []
    const extras = markEl ? Array.from(markEl.querySelectorAll("[data-x]")) as HTMLElement[] : []
    const countEl = countRef.current
    const cols = countEl ? Array.from(countEl.querySelectorAll("[data-c]")) as HTMLElement[] : []
    const navEl = navRef.current
    const navItems = navEl ? Array.from(navEl.querySelectorAll("[data-n]")) as HTMLElement[] : []
    const barEl = barRef.current
    const lines = barEl ? Array.from(barEl.querySelectorAll("[data-line]")) as HTMLElement[] : []
    const unders = barEl ? Array.from(barEl.querySelectorAll("[data-u]")) as HTMLElement[] : []
    const statEls = barEl ? Array.from(barEl.querySelectorAll("[data-s]")) as HTMLElement[] : []
    const slot = (Math.PI * 2) / n

    let raf = 0
    let visible = true
    let lastFrame = performance.now()
    const draw = () => {
      raf = 0
      const now = performance.now()
      const dt = Math.min(0.05, (now - lastFrame) / 1000)
      lastFrame = now
      const t = clock()

      // wordmark: letters rise, then the mark shrinks into the nav and the suffix writes in
      if (markEl) {
        const big = Math.min(58, Math.max(30, W * 0.034))
        const small = W < 480 ? 14 : 15
        const k = easeInOut3(span(t, T.shrink))
        const fs = lerp(big, small, k)
        markEl.style.fontSize = fs.toFixed(2) + "px"
        const topBig = Math.round(H * 0.045)
        const topNav = (navH - small) / 2 - small * 0.06
        markEl.style.top = lerp(topBig, topNav, k).toFixed(2) + "px"
        letters.forEach((el, i) => {
          const p = easeOut3(clamp01((t - T.markIn[0] - i * 0.09) / 0.4))
          el.style.transform = "translateY(" + ((1 - p) * 110).toFixed(1) + "%)"
        })
        // the suffix writes in between the name and its full stop: each letter
        // opens its own width (so the stop slides along) and rises into it
        extras.forEach((el, i) => {
          const p = easeOut3(clamp01((t - T.suffix[0] - i * 0.035) / 0.28))
          el.style.transform = "translateY(" + ((1 - p) * 110).toFixed(1) + "%)"
          const box = el.parentElement
          if (box) box.style.maxWidth = p >= 1 ? "none" : (p * 1.1).toFixed(3) + "em"
        })
        root.style.setProperty("--hrh-markw", Math.round(markEl.offsetWidth) + "px")
      }

      // odometer: every column rolls continuously, the ones column fastest
      if (countEl) {
        const c = countAt(t)
        const rise = easeOut3(span(t, T.countRise))
        const out = span(t, T.countOut)
        countEl.style.opacity = (rise * (1 - out)).toFixed(3)
        countEl.style.transform = "translateY(" + ((1 - rise) * 40 + out * -12).toFixed(1) + "px)"
        countEl.style.visibility = out >= 1 || t <= 0 ? "hidden" : "visible"
        cols.forEach((el, i) => {
          el.style.transform = "translateY(" + (-odometer(c, 2 - i) * (100 / 11)).toFixed(3) + "%)"
        })
      }

      // sky and page cover
      const skyK = easeOut3(span(t, T.sky))
      if (skyRef.current) skyRef.current.style.opacity = skyK.toFixed(3)
      if (coverRef.current) coverRef.current.style.opacity = (1 - skyK).toFixed(3)

      // the page frames the scene
      const fk = easeOut3(span(t, T.frame))
      const side = Math.round(lerp(0, W <= 720 ? 8 : 12, fk))
      sceneEl.style.clipPath =
        "inset(" + lerp(0, navH, fk).toFixed(1) + "px " + side + "px " + lerp(0, barH, fk).toFixed(1) + "px " + side + "px round " + lerp(0, 14, fk).toFixed(1) + "px)"
      if (t >= T.idle && !reduced) sceneEl.setAttribute("data-live", "")
      else sceneEl.removeAttribute("data-live")

      // once a link has landed the timeline lets go of it, so its hover and
      // focus styles (and their transition) work again
      navItems.forEach((el, i) => {
        const p = easeOut3(clamp01((t - T.links[0] - i * 0.05) / 0.3))
        if (p >= 1) {
          el.style.opacity = ""
          el.style.transform = ""
          el.style.visibility = ""
          el.setAttribute("data-done", "")
          return
        }
        el.removeAttribute("data-done")
        el.style.opacity = (p * 0.62).toFixed(3)
        el.style.transform = "translateY(" + ((1 - p) * 8).toFixed(1) + "px)"
        el.style.visibility = p > 0 ? "visible" : "hidden"
      })
      lines.forEach((el, i) => {
        const p = easeOut3(span(t, i === 0 ? T.line1 : T.line2))
        el.style.transform = "translateY(" + ((1 - p) * 105).toFixed(1) + "%)"
      })
      unders.forEach((el, i) => {
        const p = easeInOut3(clamp01((t - T.underline[0] - i * 0.08) / 0.4))
        el.style.backgroundSize = (p * 100).toFixed(1) + "% 1px"
        const sup = el.firstElementChild as HTMLElement | null
        if (sup) sup.style.opacity = (p * 0.6).toFixed(3)
      })
      statEls.forEach((el, i) => {
        const st = stats[i]
        if (!st) return
        const p = easeOut3(span(t, T.stats))
        const shown = span(t, [T.stats[0] - 0.12, T.stats[0] + 0.1])
        const num = el.querySelector("b")
        if (num) num.textContent = (st.value * p).toFixed(st.decimals || 0) + (st.suffix || "")
        el.style.opacity = shown.toFixed(3)
        el.style.transform = "translateY(" + ((1 - shown) * 8).toFixed(1) + "px)"
      })

      // 3D
      if (built) {
        const { renderer, scene, camera, ring, cards: meshes, mats } = built
        if (!dragging) {
          drag += vel * dt * 1000
          vel *= Math.pow(0.0025, dt)
        }
        ring.rotation.y = ringYaw(reduced ? 0 : t, slot) + drag
        const cam = cameraAt(t, frame.outside, frame.inside)
        ring.rotation.z = cam.roll
        camera.fov = cam.vfov
        camera.position.set(cam.px, cam.py, cam.pz)
        camera.lookAt(cam.tx, cam.ty, cam.tz)
        // keep the band centred in the framed panel
        const centre = lerp(H / 2, (navH + (H - barH)) / 2, fk)
        camera.setViewOffset(W, H, 0, H / 2 - centre, W, H)
        camera.updateProjectionMatrix()
        for (let k = 0; k < meshes.length; k++) {
          const p = cardShown(t, k, meshes.length)
          const m = meshes[k]
          m.visible = p > 0
          if (!m.visible) continue
          const s = lerp(0.55, 1, easeOutBack(p))
          m.scale.set(s, s, s)
          m.rotation.x = 0
          m.rotation.z = (1 - easeOut3(p)) * -0.32
          mats[k].opacity = Math.min(1, p * 3)
          m.position.y = (1 - easeOut3(p)) * -0.08
        }
        renderer.render(scene, camera)
      }

      const moving = !reduced && (t < T.end + 1 || dragging || Math.abs(vel) > 1e-5 || t >= T.idle)
      if (visible && (moving || !ready)) raf = requestAnimationFrame(draw)
    }

    const kick = () => {
      if (!raf && visible) {
        lastFrame = performance.now()
        raf = requestAnimationFrame(draw)
      }
    }
    kick()

    const ro = new ResizeObserver(() => {
      measure()
      frame = framings()
      if (!raf) draw()
    })
    ro.observe(root)
    const io = new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting)
      if (visible) kick()
    })
    io.observe(root)

    return () => {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      sceneEl.removeEventListener("pointerdown", onDown)
      sceneEl.removeEventListener("pointermove", onMove)
      sceneEl.removeEventListener("pointerup", onUp)
      sceneEl.removeEventListener("pointercancel", onUp)
      built?.dispose()
    }
    // cards and sky are read once per mount; replay remounts the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replays, n])

  const digitStack = (key: string) => (
    <span className="hrh-col" key={key}>
      <b data-c="">
        {Array.from({ length: 11 }, (_, i) => (
          <i key={i}>{i % 10}</i>
        ))}
      </b>
    </span>
  )

  return (
    <div ref={rootRef} className={"hrh-root" + (className ? " " + className : "")} style={{ height }}>
      <style>{CSS}</style>
      <div ref={sceneRef} className="hrh-scene" aria-hidden="true">
        <div ref={skyRef} className="hrh-sky" />
        <div ref={coverRef} className="hrh-cover" />
        <canvas ref={canvasRef} className="hrh-canvas" />
      </div>

      <div className="hrh-ui">
        <h1 ref={markRef} className="hrh-mark" aria-label={name + nameSuffix}>
          {mark.map((ch, i) => (
            <span key={"m" + i} aria-hidden="true">
              <i data-l="">{ch === " " ? " " : ch}</i>
            </span>
          ))}
          {suffix.map((ch, i) => (
            <span key={"x" + i} aria-hidden="true" data-xw="" style={{ maxWidth: 0 }}>
              <i data-x="" style={{ transform: "translateY(110%)" }}>
                {ch === " " ? " " : ch}
              </i>
            </span>
          ))}
          <span aria-hidden="true">
            <i data-l="">.</i>
          </span>
        </h1>

        <div ref={countRef} className="hrh-count" aria-hidden="true" style={{ opacity: 0 }}>
          <small>{loadingLabel}</small>
          <span className="hrh-digits">
            {digitStack("h")}
            {digitStack("t")}
            {digitStack("o")}
            <span className="hrh-pct">%</span>
          </span>
        </div>

        <nav ref={navRef} className="hrh-nav" aria-label="Primary">
          <div className="hrh-links">
            {links.map((l) => (
              <a key={l.label} href={l.href} data-n="" style={{ visibility: "hidden" }}>
                {l.label}
              </a>
            ))}
          </div>
          <button type="button" data-n="" style={{ visibility: "hidden" }} onClick={() => setReplays((r) => r + 1)}>
            Replay ↺
          </button>
        </nav>

        <div ref={barRef} className="hrh-bar">
          <p className="hrh-head">
            {headline.map((line, li) => (
              <span className="hrh-line" key={li}>
                <span data-line="" style={{ transform: "translateY(105%)" }}>
                  {line.map((wd, wi) =>
                    wd.underline ? (
                      <span className="hrh-u" data-u="" key={wi}>
                        {wd.text}
                        <sup>↗</sup>
                      </span>
                    ) : (
                      <React.Fragment key={wi}>{wd.text}</React.Fragment>
                    ),
                  )}
                </span>
              </span>
            ))}
          </p>
          <div className="hrh-stats">
            {stats.map((s) => (
              <div className="hrh-stat" data-s="" key={s.label} style={{ opacity: 0 }}>
                <b>{"0" + (s.suffix || "")}</b>
                <small>{s.label}</small>
              </div>
            ))}
          </div>
        </div>
        <span className="hrh-sr">
          {stats.map((s) => s.value.toFixed(s.decimals || 0) + (s.suffix || "") + " " + s.label).join(", ")}
        </span>
      </div>
    </div>
  )
}

export default HaloRingHero
