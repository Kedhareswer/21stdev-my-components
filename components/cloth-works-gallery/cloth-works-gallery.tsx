"use client"

import * as React from "react"
import * as THREE from "three"

/**
 * ClothWorksGallery — a portfolio "works" section. A row of project posters
 * hangs across the page as cloth: drag or scroll the row and every poster
 * bends and flaps like a flag, run the cursor over one and it ripples, let
 * go and it settles flat again. The big title follows whichever poster is in
 * the middle. A pill at the bottom swaps to an Index view: a grid of the same
 * work, with the title following the tile under the cursor.
 *
 * "height" must be a definite length (default 100svh). autoPlay (off by
 * default) nudges the row along on its own for an unattended preview; the
 * first drag, wheel or key hands control back.
 */

export type ClothWork = {
  /** Poster or project shot, roughly 9:10 portrait. */
  src: string
  title: string
  description?: string
  /** Shown small and uppercase under the description. */
  tags?: string[]
}

export interface ClothWorksGalleryProps {
  /** Section height. Must be a definite length. */
  height?: string
  works?: ClothWork[]
  /** Pills in the top-left corner. */
  links?: { label: string; href: string; active?: boolean }[]
  /** The dark pill in the top-right corner, or null for none. */
  cta?: { label: string; href: string } | null
  /** Starts in the Index grid instead of the cloth row. */
  defaultView?: "gallery" | "index"
  autoPlay?: boolean
  /** Google Fonts stylesheet, or null to bring your own Outfit and Inter. */
  fontHref?: string | null
  className?: string
}

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Outfit:wght@800&display=swap"
const IMG = "https://kedhar-components.pages.dev/cloth-works-gallery/"

const ABOUT = "Kedhareswer builds identities and packaging with loud colour, playful characters and sharp type."

const DEFAULT_WORKS: ClothWork[] = [
  { src: IMG + "project-01.webp", title: "Project 01", description: ABOUT, tags: ["Brand identity", "Lettering"] },
  { src: IMG + "project-02.webp", title: "Project 02", description: ABOUT, tags: ["Packaging", "Brand identity"] },
  { src: IMG + "project-03.webp", title: "Project 03", description: ABOUT, tags: ["Packaging", "Illustration"] },
  { src: IMG + "project-04.webp", title: "Project 04", description: ABOUT, tags: ["Poster", "Illustration"] },
  { src: IMG + "project-05.webp", title: "Project 05", description: ABOUT, tags: ["Packaging", "Character design"] },
  { src: IMG + "project-06.webp", title: "Project 06", description: ABOUT, tags: ["Merchandise", "Brand identity"] },
  { src: IMG + "project-07.webp", title: "Project 07", description: ABOUT, tags: ["Packaging", "Art direction"] },
  { src: IMG + "project-08.webp", title: "Project 08", description: ABOUT, tags: ["Poster", "Lettering"] },
]

const DEFAULT_LINKS = [
  { label: "Home", href: "#" },
  { label: "Works", href: "#", active: true },
  { label: "Contact", href: "mailto:kedhareswer.12110626@gmail.com" },
  { label: "Blog", href: "#" },
]

// #region layout
/** Poster width over height. */
export const CARD_ASPECT = 0.9
/** Each poster's resting tilt (degrees, clockwise) and drop (fraction of its height). */
export const REST_TILT = [-3, 4, -2.5, 5.5, -4, 3, -5, 2.5]
export const REST_DROP = [0.05, -0.05, 0.09, -0.07, 0.03, 0.08, -0.06, 0.02]

/** Card width and spacing for a section of width w whose card row is bandH tall. */
export function cardMetrics(w: number, bandH: number) {
  const wide = w < 640 ? w * 0.52 : w * 0.18
  const fit = bandH * 0.74 * CARD_ASPECT
  const cw = Math.max(110, Math.min(wide, fit, 360))
  return { cw, ch: cw / CARD_ASPECT, pitch: cw * 1.1 }
}

/** Left edge of card i once the row has scrolled by "scroll", wrapping so the row never ends. */
export function cardLeft(i: number, scroll: number, pitch: number, count: number, gutter: number) {
  // a card wraps two pitches left of the gutter, where it (tilt and folds included) is off screen
  const span = pitch * count
  const raw = i * pitch - scroll + pitch * 2
  return gutter + (((raw % span) + span) % span) - pitch * 2
}

/** Which card's centre is nearest x = centre. */
export function activeCard(scroll: number, pitch: number, count: number, gutter: number, cw: number, centre: number) {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < count; i++) {
    const d = Math.abs(cardLeft(i, scroll, pitch, count, gutter) + cw / 2 - centre)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

/** How many copies of the list keep the wrapping row wider than the screen plus the hidden cards at both ends. */
export function copiesFor(count: number, pitch: number, w: number) {
  if (count < 1) return 1
  return Math.max(1, Math.ceil((w + pitch * 4) / (pitch * count)))
}

/** One step of a critically damped spring pulling pos towards target. */
export function springStep(pos: number, vel: number, target: number, omega: number, dt: number) {
  const a = omega * omega * (target - pos) - 2 * omega * vel
  const v = vel + a * dt
  return { pos: pos + v * dt, vel: v }
}

/** How free a point of the cloth is: 0 at the poster's middle, 1 at its corners. */
export function edgeWeight(u: number, v: number) {
  const x = Math.abs(u - 0.5) * 2
  const y = Math.abs(v - 0.5) * 2
  return Math.min(1, 0.78 * Math.pow(x, 1.4) + 0.32 * y * y)
}
// #endregion

// --- cloth ------------------------------------------------------------------

const SEG_X = 16
const SEG_Y = 18

/**
 * A poster as a stretched membrane: every vertex is pulled back to its flat
 * rest position (hard in the middle, soft at the edges), coupled to its
 * neighbours so a push travels across as a wave, and damped so it settles in
 * about a second. Motion of the row drags the free edges behind and makes
 * them flutter; the cursor pushes the surface where it passes.
 */
class Cloth {
  n = (SEG_X + 1) * (SEG_Y + 1)
  off = new Float32Array(this.n * 3)
  vel = new Float32Array(this.n * 3)
  k = new Float32Array(this.n)
  e = new Float32Array(this.n)
  u = new Float32Array(this.n)
  v = new Float32Array(this.n)
  lap = new Float32Array(this.n * 3)
  awake = 1

  constructor() {
    for (let j = 0; j <= SEG_Y; j++) {
      for (let i = 0; i <= SEG_X; i++) {
        const p = j * (SEG_X + 1) + i
        const u = i / SEG_X
        const v = j / SEG_Y
        const e = edgeWeight(u, v)
        this.u[p] = u
        this.v[p] = v
        this.e[p] = e
        this.k[p] = 150 * (1 - 0.88 * e)
      }
    }
  }

  step(dt: number, s: { w: number; h: number; vx: number; ax: number; t: number; seed: number; hx: number; hy: number; hf: number; hvx: number; hvy: number }) {
    const { off, vel, lap, k, e, u, v } = this
    const W = SEG_X + 1
    const C = 560
    const D = 4.4
    const scale = s.w / 260
    const speed = Math.min(Math.abs(s.vx), 4200)
    const dir = s.vx < 0 ? -1 : 1
    for (let j = 0; j <= SEG_Y; j++) {
      for (let i = 0; i <= SEG_X; i++) {
        const p = j * W + i
        for (let c = 0; c < 3; c++) {
          const o = off[p * 3 + c]
          let sum = 0
          let deg = 0
          if (i > 0) { sum += off[(p - 1) * 3 + c]; deg++ }
          if (i < SEG_X) { sum += off[(p + 1) * 3 + c]; deg++ }
          if (j > 0) { sum += off[(p - W) * 3 + c]; deg++ }
          if (j < SEG_Y) { sum += off[(p + W) * 3 + c]; deg++ }
          lap[p * 3 + c] = sum - deg * o
        }
      }
    }
    let energy = 0
    const hr2 = (s.w * 0.32) * (s.w * 0.32)
    for (let p = 0; p < this.n; p++) {
      const ep = e[p]
      const x3 = p * 3
      let axx = -k[p] * off[x3] + C * lap[x3] - D * vel[x3]
      let ayy = -k[p] * off[x3 + 1] + C * lap[x3 + 1] - D * vel[x3 + 1]
      let azz = -k[p] * off[x3 + 2] + C * lap[x3 + 2] - D * vel[x3 + 2]
      // the row's motion: free edges trail behind and the cloth yaws into it
      axx += (-1.3 * s.vx - 0.12 * s.ax) * ep
      ayy += 0.35 * speed * ep * Math.sin(u[p] * 5.2 + s.t * 7 + s.seed)
      azz += 6.5 * speed * ep * Math.sin(5.4 * u[p] * dir + 2.2 * v[p] - s.t * 9.5 + s.seed) * scale
      azz += 1.1 * s.vx * (u[p] - 0.5) * 2
      // the cursor pushes the surface where it passes
      if (s.hf > 0) {
        const dx = (u[p] - 0.5) * s.w - s.hx
        const dy = (0.5 - v[p]) * s.h - s.hy
        const d2 = (dx * dx + dy * dy) / hr2
        if (d2 < 6) {
          // brushed along with the cursor, and rippled outwards from it
          const g = Math.exp(-d2) * (0.35 + ep)
          axx += s.hvx * 7.5 * g
          ayy += s.hvy * 7.5 * g
          azz += s.hf * g * Math.sin(Math.sqrt(d2) * 5 - s.t * 13)
        }
      }
      vel[x3] += axx * dt
      vel[x3 + 1] += ayy * dt
      vel[x3 + 2] += azz * dt
      energy += vel[x3] * vel[x3] + vel[x3 + 1] * vel[x3 + 1] + vel[x3 + 2] * vel[x3 + 2]
    }
    const lim = s.w * 0.42
    for (let q = 0; q < this.n * 3; q++) {
      let o = off[q] + vel[q] * dt
      if (o > lim) { o = lim; vel[q] *= 0.5 }
      else if (o < -lim) { o = -lim; vel[q] *= 0.5 }
      off[q] = o
      energy += o * o * 0.5
    }
    this.awake = energy / this.n
  }

  settle() {
    this.off.fill(0)
    this.vel.fill(0)
    this.awake = 0
  }
}

/**
 * Unlit, so a flat poster shows its picture's exact colours, then darkened
 * or lifted by how far each fold turns away from a light up and to the
 * right. Flat cloth gets a factor of exactly 1.
 */
function foldShade(shader: { vertexShader: string; fragmentShader: string }) {
  shader.vertexShader = "varying vec3 vFoldN;\n" + shader.vertexShader.replace(
    "#include <begin_vertex>",
    "#include <begin_vertex>\nvFoldN = normalize(normalMatrix * normal);",
  )
  shader.fragmentShader = "varying vec3 vFoldN;\n" + shader.fragmentShader.replace(
    "#include <map_fragment>",
    [
      "#include <map_fragment>",
      "vec3 fn = normalize(vFoldN) * (gl_FrontFacing ? 1.0 : -1.0);",
      "vec3 fl = normalize(vec3(0.35, 0.55, 1.0));",
      "float fs = clamp(0.3 + 0.7 * dot(fn, fl) / fl.z, 0.38, 1.12);",
      "diffuseColor.rgb *= gl_FrontFacing ? fs : fs * 0.78;",
    ].join("\n"),
  )
}

// --- engine -----------------------------------------------------------------

type Card = {
  mesh: THREE.Mesh
  geo: THREE.PlaneGeometry
  mat: THREE.MeshBasicMaterial
  cloth: Cloth
  tex: THREE.Texture | null
  work: number
  tilt: number
  drop: number
  opacity: number
  appear: number
  x: number
  y: number
  w: number
  h: number
}

type EngineState = {
  view: "gallery" | "index"
  reduced: boolean
}

type Engine = {
  resize(w: number, h: number, band: DOMRect | null, root: DOMRect): void
  setView(v: "gallery" | "index"): void
  setReduced(r: boolean): void
  pointer(x: number, y: number, inside: boolean): void
  drag(dx: number): void
  release(vx: number): void
  nudge(px: number): void
  goTo(work: number): void
  step(cards: number): void
  dispose(): void
}

function createEngine(
  canvas: HTMLCanvasElement,
  works: ClothWork[],
  onActive: (i: number) => void,
  state: EngineState,
): Engine | null {
  let gl: THREE.WebGLRenderer
  try {
    gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" })
  } catch {
    return null
  }
  gl.setClearColor(0x000000, 0)
  gl.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 10, 10000)

  const loader = new THREE.TextureLoader()
  loader.setCrossOrigin("anonymous")
  const textures = works.map((w) => {
    const t = loader.load(w.src)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  })

  let cards: Card[] = []
  let W = 1
  let H = 1
  let gutter = 24
  let cw = 200
  let ch = 222
  let pitch = 220
  let bandMid = 0
  let scroll = 0
  let scrollV = 0
  let target = 0
  let dragging = false
  let vxSmooth = 0
  let axSmooth = 0
  let hover = { x: 0, y: 0, inside: false, speed: 0, vx: 0, vy: 0, lastX: 0, lastY: 0, lastT: 0 }
  let active = -1
  let viewMix = state.view === "gallery" ? 1 : 0
  let enterAt = 0
  let t = 0
  let last = performance.now()

  function build(count: number) {
    for (const c of cards) {
      scene.remove(c.mesh)
      c.geo.dispose()
      c.mat.dispose()
    }
    cards = []
    for (let i = 0; i < count; i++) {
      const work = i % works.length
      const geo = new THREE.PlaneGeometry(1, 1, SEG_X, SEG_Y)
      const mat = new THREE.MeshBasicMaterial({ map: textures[work], side: THREE.DoubleSide, transparent: true })
      mat.onBeforeCompile = foldShade
      const mesh = new THREE.Mesh(geo, mat)
      scene.add(mesh)
      cards.push({
        mesh, geo, mat, cloth: new Cloth(), tex: textures[work], work,
        tilt: REST_TILT[i % REST_TILT.length], drop: REST_DROP[i % REST_DROP.length],
        opacity: viewMix, appear: viewMix, x: 0, y: 0, w: 1, h: 1,
      })
    }
  }

  function layout() {
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i]
      c.w = cw
      c.h = ch
      c.x = cardLeft(i, scroll, pitch, cards.length, gutter) + cw / 2
      c.y = bandMid + c.drop * ch
    }
  }

  function writeGeometry(c: Card) {
    const pos = c.geo.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const o = c.cloth.off
    for (let p = 0; p < c.cloth.n; p++) {
      arr[p * 3] = (c.cloth.u[p] - 0.5) * c.w + o[p * 3]
      arr[p * 3 + 1] = (0.5 - c.cloth.v[p]) * c.h + o[p * 3 + 1]
      arr[p * 3 + 2] = o[p * 3 + 2]
    }
    pos.needsUpdate = true
    c.geo.computeVertexNormals()
  }

  // Screen boxes of the cards as drawn (folds included), for layout checks.
  ;(canvas as unknown as { cwgRects?: () => number[][] }).cwgRects = () => {
    const d = camera.position.z
    const out: number[][] = []
    for (const c of cards) {
      if (!c.mesh.visible) continue
      const th = c.mesh.rotation.z
      const arr = c.geo.attributes.position.array as Float32Array
      let l = Infinity, r = -Infinity, tp = Infinity, b = -Infinity
      for (let p = 0; p < arr.length; p += 3) {
        const X = arr[p] * Math.cos(th) - arr[p + 1] * Math.sin(th) + c.mesh.position.x
        const Y = arr[p] * Math.sin(th) + arr[p + 1] * Math.cos(th) + c.mesh.position.y
        const k = d / (d - arr[p + 2])
        const sx = W / 2 + X * k
        const sy = H / 2 - Y * k
        l = Math.min(l, sx); r = Math.max(r, sx); tp = Math.min(tp, sy); b = Math.max(b, sy)
      }
      let fold = 0
      for (let p = 2; p < c.cloth.off.length; p += 3) fold = Math.max(fold, Math.abs(c.cloth.off[p]))
      out.push([l, tp, r, b, c.opacity, fold])
    }
    return out
  }

  const engine: Engine = {
    resize(w, h, band, root) {
      W = Math.max(1, w)
      H = Math.max(1, h)
      gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      gl.setSize(W, H, false)
      camera.aspect = W / H
      camera.position.set(0, 0, H / 2 / Math.tan((22.5 * Math.PI) / 180))
      camera.far = camera.position.z * 4
      camera.updateProjectionMatrix()
      const bandTop = band ? band.top - root.top : H * 0.3
      const bandH = band ? band.height : H * 0.5
      bandMid = bandTop + bandH / 2
      gutter = parseFloat(getComputedStyle(canvas.parentElement as Element).getPropertyValue("--cwg-gutter")) || 24
      const m = cardMetrics(W, bandH)
      cw = m.cw
      ch = m.ch
      pitch = m.pitch
      const need = works.length * copiesFor(works.length, pitch, W)
      if (need !== cards.length) build(need)
      layout()
      for (const c of cards) writeGeometry(c)
    },
    setView(v) {
      if (v === state.view) return
      state.view = v
      // the outgoing layer clears first: tiles take ~0.2 s to leave before cards come back
      enterAt = v === "gallery" ? t + (state.reduced ? 0 : 0.24) : Infinity
    },
    setReduced(r) {
      state.reduced = r
      if (r) for (const c of cards) c.cloth.settle()
    },
    pointer(x, y, inside) {
      const now = performance.now()
      const dt = Math.max(8, now - hover.lastT) / 1000
      if (hover.inside && inside) {
        const sp = Math.hypot(x - hover.lastX, y - hover.lastY) / dt
        hover.speed = Math.max(hover.speed, Math.min(sp, 2600))
        const k = sp > 2600 ? 2600 / sp : 1
        hover.vx = ((x - hover.lastX) / dt) * k
        hover.vy = ((y - hover.lastY) / dt) * k
      }
      hover.x = x
      hover.y = y
      hover.inside = inside
      hover.lastX = x
      hover.lastY = y
      hover.lastT = now
    },
    drag(dx) {
      dragging = true
      target -= dx
    },
    release(vx) {
      dragging = false
      target -= vx * 0.32
    },
    nudge(px) {
      target += px
    },
    goTo(work) {
      let best = Infinity
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].work !== work) continue
        const d = cardLeft(i, scroll, pitch, cards.length, gutter) + cw / 2 - W / 2
        if (Math.abs(d) < Math.abs(best)) best = d
      }
      if (!isFinite(best)) return
      target = scroll + best
      scroll = target
      scrollV = 0
      for (const c of cards) c.cloth.settle()
    },
    step() {
      const now = performance.now()
      const frame = Math.min(0.05, (now - last) / 1000)
      last = now
      t += frame
      const reduced = state.reduced
      // the row follows its target on a spring: snappy under a finger, soft otherwise
      const omega = reduced ? 40 : dragging ? 26 : 6.5
      const sub = Math.max(1, Math.ceil(frame / (1 / 120)))
      const dt = frame / sub
      const prevV = scrollV
      for (let s = 0; s < sub; s++) {
        const r = springStep(scroll, scrollV, target, omega, dt)
        scroll = r.pos
        scrollV = r.vel
      }
      const vx = -scrollV
      vxSmooth += (vx - vxSmooth) * Math.min(1, frame * 14)
      const ax = frame > 0 ? -(scrollV - prevV) / frame : 0
      axSmooth += (ax - axSmooth) * Math.min(1, frame * 10)
      hover.speed *= Math.exp(-frame * 7)
      hover.vx *= Math.exp(-frame * 7)
      hover.vy *= Math.exp(-frame * 7)
      layout()

      // leaving is quick (gone in ~0.15 s, before the tiles start), arriving is slower
      const want = state.view === "gallery" && t >= enterAt ? 1 : 0
      if (want === 0) viewMix = Math.max(0, viewMix - frame / (reduced ? 0.01 : 0.15))
      else viewMix = Math.min(1, viewMix + frame / (reduced ? 0.01 : 0.6))

      const a = activeCard(scroll, pitch, cards.length, gutter, cw, W / 2)
      const aw = cards.length ? cards[a].work : 0
      if (aw !== active) {
        active = aw
        onActive(aw)
      }

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i]
        const visible = c.x + cw > -cw && c.x - cw < W + cw
        // cards leave together and come back one after another, falling into place
        const order = Math.max(0, Math.min(1, (c.x - gutter) / Math.max(1, W)))
        const goal = want
        const lag = goal === 1 ? Math.max(0, Math.min(1, viewMix * 1.6 - order * 0.6)) : Math.min(c.appear, viewMix)
        c.appear = reduced ? goal : lag
        const ease = 1 - Math.pow(1 - c.appear, 3)
        c.opacity = ease
        if (!reduced && visible && c.appear > 0.01) {
          let hf = 0
          let hx = 0
          let hy = 0
          let hvx = 0
          let hvy = 0
          if (hover.inside && hover.speed > 20 && state.view === "gallery") {
            const dx = hover.x - c.x
            const dy = hover.y - c.y
            const th = (c.tilt * Math.PI) / 180
            const wx = dx
            const wy = -dy
            hx = wx * Math.cos(th) - wy * Math.sin(th)
            hy = wx * Math.sin(th) + wy * Math.cos(th)
            if (Math.abs(hx) < c.w * 0.75 && Math.abs(hy) < c.h * 0.75) {
              hf = hover.speed * 26
              hvx = hover.vx * Math.cos(th) + hover.vy * Math.sin(th)
              hvy = hover.vx * Math.sin(th) - hover.vy * Math.cos(th)
            }
          }
          const moving = Math.abs(vxSmooth) > 4 || Math.abs(axSmooth) > 40 || hf > 0
          if (moving || c.cloth.awake > 0.02) {
            for (let s = 0; s < sub; s++) {
              c.cloth.step(dt, { w: c.w, h: c.h, vx: vxSmooth, ax: axSmooth, t, seed: i * 1.7, hx, hy, hf, hvx, hvy })
            }
          } else if (c.cloth.awake > 0) {
            c.cloth.settle()
          }
        }
        writeGeometry(c)
        c.mesh.position.set(c.x - W / 2, H / 2 - c.y + (1 - ease) * c.h * 0.12, 0)
        c.mesh.rotation.z = (-c.tilt * Math.PI) / 180
        c.mat.opacity = c.opacity
        c.mesh.visible = visible && c.opacity > 0.003
      }
      gl.render(scene, camera)
    },
    dispose() {
      for (const c of cards) {
        c.geo.dispose()
        c.mat.dispose()
      }
      for (const tx of textures) tx.dispose()
      gl.dispose()
    },
  }
  return engine
}

// --- component ----------------------------------------------------------------

const CSS = [
  ".cwg-root{position:relative;width:100%;overflow:hidden;background:var(--color-background);color:var(--color-foreground);font-family:Inter,ui-sans-serif,system-ui,sans-serif;--cwg-gutter:clamp(16px,3.3cqw,48px);container-type:inline-size;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;isolation:isolate}",
  ".cwg-root img{max-width:none}",
  ".cwg-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;pointer-events:none}",
  ".cwg-head{grid-row:1;position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px var(--cwg-gutter) 0}",
  ".cwg-links{display:flex;flex-wrap:wrap;gap:6px}",
  ".cwg-pill{display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 14px;border-radius:999px;font-size:12px;font-weight:500;line-height:1;text-decoration:none;color:var(--color-foreground);background:color-mix(in oklab,var(--color-foreground) 7%,transparent);border:1px solid color-mix(in oklab,var(--color-foreground) 8%,transparent);transition:background .2s}",
  ".cwg-pill:hover{background:color-mix(in oklab,var(--color-foreground) 13%,transparent)}",
  ".cwg-pill[data-active='true']{background:color-mix(in oklab,var(--color-foreground) 16%,transparent)}",
  ".cwg-dark{background:var(--color-foreground);color:var(--color-background);border-color:var(--color-foreground)}",
  ".cwg-dark:hover{background:color-mix(in oklab,var(--color-foreground) 82%,var(--color-background))}",
  ".cwg-title{grid-row:2;grid-column:1;align-self:start;position:relative;z-index:2;margin:0;padding:clamp(20px,4.5cqw,56px) var(--cwg-gutter) 0;font-family:Outfit,Inter,ui-sans-serif,system-ui,sans-serif;font-weight:800;text-transform:uppercase;font-size:clamp(34px,4.6cqw,84px);line-height:.95;letter-spacing:-.01em;max-width:min(11ch,100%);box-sizing:content-box;transition:opacity .25s}",
  ".cwg-band{grid-row:3;grid-column:1;position:relative;z-index:1;min-height:0;touch-action:pan-y;cursor:grab;outline:none}",
  ".cwg-band[data-drag='true']{cursor:grabbing}",
  ".cwg-band:focus-visible{box-shadow:inset 0 0 0 2px var(--color-foreground)}",
  ".cwg-index{grid-row:2/4;grid-column:1;container-type:size;position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,66fr) minmax(0,34fr);gap:clamp(16px,3cqw,48px);padding:clamp(12px,2cqw,28px) var(--cwg-gutter) 0;min-height:0;align-items:end}",
  ".cwg-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(6px,.8cqw,12px);align-self:start;width:min(100%,calc(180cqh - 48px))}",
  ".cwg-tile{all:unset;box-sizing:border-box;cursor:pointer;display:block;position:relative;aspect-ratio:9/10;overflow:hidden;background:color-mix(in oklab,var(--color-foreground) 6%,transparent);opacity:0;transform:translateY(14px);transition:opacity .18s ease,transform .2s ease}",
  ".cwg-tile img{display:block;width:100%;height:100%;object-fit:cover;max-width:none;transition:filter .3s}",
  ".cwg-tile:focus-visible{outline:2px solid var(--color-foreground);outline-offset:2px}",
  ".cwg-info{align-self:end;padding-bottom:4px;opacity:0;transition:opacity .35s ease}",
  ".cwg-info-title{margin:0 0 14px;font-family:Outfit,Inter,ui-sans-serif,system-ui,sans-serif;font-weight:800;text-transform:uppercase;font-size:clamp(30px,3.6cqw,64px);line-height:.95;letter-spacing:-.01em}",
  ".cwg-desc{margin:0;font-size:12px;line-height:1.5;color:var(--color-muted-foreground);max-width:34ch}",
  ".cwg-tags{margin:10px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-muted-foreground)}",
  ".cwg-foot{grid-row:4;position:relative;z-index:2;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:16px;padding:12px var(--cwg-gutter) 18px}",
  ".cwg-about{grid-column:3;justify-self:end;width:min(100%,300px);transition:opacity .3s}",
  ".cwg-toggle{grid-column:2;grid-row:1;height:32px;padding:0 18px;font:inherit;font-size:12px;font-weight:500;cursor:pointer}",
  ".cwg-root[data-view='index'] .cwg-tile{opacity:1;transform:none;transition:opacity .35s ease,transform .45s cubic-bezier(.2,.8,.2,1)}",
  ".cwg-root[data-view='index'] .cwg-info{opacity:1;transition-delay:.16s}",
  ".cwg-root[data-view='index'] .cwg-about,.cwg-root[data-view='index'] .cwg-title{opacity:0}",
  ".cwg-root[data-view='index'] .cwg-band{visibility:hidden}",
  ".cwg-root[data-view='gallery'] .cwg-index{visibility:hidden;transition:visibility 0s .22s}",
  ".cwg-root[data-view='gallery'] .cwg-tile{transition-delay:0s !important}",
  ".cwg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@container (max-width:639px){.cwg-index{grid-template-columns:1fr;grid-template-rows:auto auto;align-items:start;align-content:center;row-gap:16px}.cwg-grid{align-self:start;width:min(100%,calc(180cqh - 430px))}.cwg-info-title{font-size:clamp(26px,8cqw,40px);margin-bottom:8px}.cwg-foot{grid-template-columns:1fr;justify-items:center}.cwg-about{grid-column:1;grid-row:1;justify-self:stretch;width:auto}.cwg-toggle{grid-column:1;grid-row:2}.cwg-links .cwg-pill:nth-child(n+3){display:none}}",
  "@media (prefers-reduced-motion:reduce){.cwg-tile,.cwg-info,.cwg-about,.cwg-title{transition:none !important}}",
].join("")

export default function ClothWorksGallery({
  height = "100svh",
  works = DEFAULT_WORKS,
  links = DEFAULT_LINKS,
  cta = { label: "Resume", href: "mailto:kedhareswer.12110626@gmail.com" },
  defaultView = "gallery",
  autoPlay = false,
  fontHref = FONT_HREF,
  className,
}: ClothWorksGalleryProps) {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const bandRef = React.useRef<HTMLDivElement | null>(null)
  const engineRef = React.useRef<Engine | null>(null)
  const [view, setView] = React.useState<"gallery" | "index">(defaultView)
  const [active, setActive] = React.useState(0)
  const [picked, setPicked] = React.useState<number | null>(null)
  const [dragOn, setDragOn] = React.useState(false)
  const [webgl, setWebgl] = React.useState(true)
  const userRef = React.useRef(false)
  const hoverRef = React.useRef(false)
  const viewRef = React.useRef(view)
  viewRef.current = view

  const list = works.length ? works : DEFAULT_WORKS
  const shown = view === "index" && picked !== null ? picked : active
  const work = list[shown % list.length]

  React.useEffect(() => {
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!canvas || !root) return
    const reducedQ = window.matchMedia("(prefers-reduced-motion: reduce)")
    const state: EngineState = { view: viewRef.current, reduced: reducedQ.matches }
    const engine = createEngine(canvas, list, setActive, state)
    if (!engine) {
      setWebgl(false)
      return
    }
    engineRef.current = engine
    const measure = () => {
      const r = root.getBoundingClientRect()
      const b = bandRef.current ? bandRef.current.getBoundingClientRect() : null
      engine.resize(r.width, r.height, b, r)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    const onReduce = () => engine.setReduced(reducedQ.matches)
    reducedQ.addEventListener("change", onReduce)
    let raf = 0
    let visible = true
    const io = new IntersectionObserver((e) => {
      visible = e[0] ? e[0].isIntersecting : true
    })
    io.observe(root)
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (visible) engine.step(0)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      reducedQ.removeEventListener("change", onReduce)
      engine.dispose()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list])

  React.useEffect(() => {
    engineRef.current?.setView(view)
  }, [view])

  // autoPlay: nudge the row along a card or two at a time until someone touches it
  React.useEffect(() => {
    if (!autoPlay) return
    let n = 0
    const id = window.setInterval(() => {
      const e = engineRef.current
      const band = bandRef.current
      if (!e || !band || userRef.current || hoverRef.current || viewRef.current !== "gallery") return
      const step = band.getBoundingClientRect().width < 640 ? 0.52 : 0.18
      n++
      e.nudge(band.getBoundingClientRect().width * step * 1.1 * (n % 3 === 0 ? 2 : 1))
    }, 2600)
    return () => window.clearInterval(id)
  }, [autoPlay])

  const touched = () => {
    userRef.current = true
  }

  // dragging the row
  const drag = React.useRef({ on: false, id: -1, x: 0, t: 0, vx: 0 })
  const local = (e: { clientX: number; clientY: number }) => {
    const r = rootRef.current ? rootRef.current.getBoundingClientRect() : { left: 0, top: 0 }
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    touched()
    drag.current = { on: true, id: e.pointerId, x: e.clientX, t: performance.now(), vx: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragOn(true)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") hoverRef.current = true
    const p = local(e)
    engineRef.current?.pointer(p.x, p.y, true)
    const d = drag.current
    if (!d.on || d.id !== e.pointerId) return
    const now = performance.now()
    const dx = e.clientX - d.x
    const dt = Math.max(1, now - d.t) / 1000
    d.vx = d.vx * 0.6 + (dx / dt) * 0.4
    d.x = e.clientX
    d.t = now
    engineRef.current?.drag(dx)
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d.on || d.id !== e.pointerId) return
    d.on = false
    const stale = performance.now() - d.t > 90
    engineRef.current?.release(stale ? 0 : Math.max(-3000, Math.min(3000, d.vx)))
    setDragOn(false)
  }
  const onPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    hoverRef.current = false
    const p = local(e)
    engineRef.current?.pointer(p.x, p.y, false)
  }
  React.useEffect(() => {
    const band = bandRef.current
    if (!band) return
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (!dx || viewRef.current !== "gallery") return
      e.preventDefault()
      touched()
      engineRef.current?.nudge(dx * (e.deltaMode === 1 ? 32 : 1) * 1.2)
    }
    band.addEventListener("wheel", onWheel, { passive: false })
    return () => band.removeEventListener("wheel", onWheel)
  }, [])
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    touched()
    const w = bandRef.current ? bandRef.current.getBoundingClientRect().width : 1000
    const pitch = cardMetrics(w, bandRef.current ? bandRef.current.getBoundingClientRect().height : 500).pitch
    engineRef.current?.nudge(e.key === "ArrowRight" ? pitch : -pitch)
  }

  const toggle = () => {
    touched()
    setPicked(null)
    setView((v) => (v === "gallery" ? "index" : "gallery"))
  }
  const openFromIndex = (i: number) => {
    touched()
    setPicked(null)
    engineRef.current?.goTo(i)
    setView("gallery")
  }

  return (
    <section
      ref={rootRef}
      className={"cwg-root" + (className ? " " + className : "")}
      style={{ height, width: "100%" }}
      data-view={view}
      aria-label="Selected work"
    >
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="cwg-canvas" aria-hidden="true" />

      <header className="cwg-head">
        <nav className="cwg-links" aria-label="Site">
          {links.map((l) => (
            <a key={l.label} className="cwg-pill" href={l.href} data-active={l.active ? "true" : "false"}>
              {l.label}
            </a>
          ))}
        </nav>
        {cta ? (
          <a className="cwg-pill cwg-dark" href={cta.href}>
            {cta.label}
          </a>
        ) : null}
      </header>

      <h2 className="cwg-title" aria-live="polite">
        {work.title}
      </h2>

        <div
          ref={bandRef}
          className="cwg-band"
          data-drag={dragOn ? "true" : "false"}
          role="region"
          aria-roledescription="carousel"
          aria-label="Projects. Drag, scroll or use the arrow keys."
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={onPointerLeave}
          onKeyDown={onKey}
        >
          <ul className="cwg-sr">
            {list.map((w, i) => (
              <li key={i}>{w.title}</li>
            ))}
          </ul>
          {!webgl ? (
            <div style={{ display: "flex", gap: 16, height: "100%", alignItems: "center", padding: "0 var(--cwg-gutter)", overflow: "hidden" }}>
              {list.map((w, i) => (
                <img key={i} src={w.src} alt="" width={540} height={600} style={{ height: "70%", width: "auto", maxWidth: "none", transform: "rotate(" + REST_TILT[i % REST_TILT.length] + "deg)" }} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="cwg-index" aria-hidden={view !== "index"}>
          <div className="cwg-grid">
            {list.map((w, i) => (
              <button
                key={i}
                type="button"
                className="cwg-tile"
                data-on={picked === i ? "true" : "false"}
                tabIndex={view === "index" ? 0 : -1}
                style={{ transitionDelay: view === "index" ? 180 + i * 45 + "ms" : "0ms" }}
                onPointerEnter={() => setPicked(i)}
                onFocus={() => setPicked(i)}
                onClick={() => openFromIndex(i)}
                aria-label={"Open " + w.title}
              >
                <img src={w.src} alt="" width={540} height={600} loading="lazy" style={{ maxWidth: "none" }} />
              </button>
            ))}
          </div>
          <div className="cwg-info">
            <p className="cwg-info-title">{work.title}</p>
            {work.description ? <p className="cwg-desc">{work.description}</p> : null}
            {work.tags && work.tags.length ? (
              <ul className="cwg-tags">
                {work.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

      <footer className="cwg-foot">
        <div className="cwg-about">
          {work.description ? <p className="cwg-desc">{work.description}</p> : null}
          {work.tags && work.tags.length ? (
            <ul className="cwg-tags">
              {work.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <button type="button" className="cwg-pill cwg-dark cwg-toggle" onClick={toggle} aria-pressed={view === "index"}>
          {view === "gallery" ? "Index" : "Gallery"}
        </button>
      </footer>
    </section>
  )
}
