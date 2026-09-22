"use client"

import * as React from "react"

export interface AsciiRunnerProps {
  /** Caption under the canvas. Pass an empty string to drop it. */
  caption?: string
  /** Fired when a run ends, with the score reached */
  onGameOver?: (score: number) => void
  /** Extra root class names */
  className?: string
}

// ---- world ----
const W = 800
const H = 200
const LH = 16 // line height in px
const BASE = 156 // baseline of the ground row the bunny stands on
const PAD = 24  // HUD inset from the canvas edge
const GRAV = 0.6
const JUMP = -11.5
const SHORT_HOP = -4.5
const FONT = '15px ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", monospace'
// Fallbacks for a host with no design tokens. The real values are read off
// --color-foreground / --color-muted-foreground at runtime, and the canvas
// paints no background at all -- otherwise the game punches a white slab into
// a dark page, which is exactly how it looked before.
const PALETTE = { ink: "#1F1F1F", dim: "#B8B8B8" }
type Palette = typeof PALETTE

function readPalette(probe: HTMLElement | null): Palette {
  if (!probe) return PALETTE
  // Assigning the fallback first means an unparseable token -- a bare channel
  // triplet, say -- leaves a known-good colour in place instead of silently
  // keeping whatever was set last.
  const read = (name: string, fallback: string) => {
    probe.style.color = fallback
    probe.style.color = "var(" + name + ", " + fallback + ")"
    return getComputedStyle(probe).color || fallback
  }
  return {
    ink: read("--color-foreground", PALETTE.ink),
    dim: read("--color-muted-foreground", PALETTE.dim),
  }
}

const CSS =
  ".ascii-runner-frame{border:1px solid var(--color-border,#E4E4E4);border-radius:12px;overflow:hidden;" +
  "transition:border-color 200ms ease}" +
  "@media(hover:hover){.ascii-runner-frame:hover{border-color:var(--color-muted-foreground,#8A8A8A)}}" +
  ".ascii-runner-canvas{display:block;width:100%;max-width:none;touch-action:none;cursor:pointer;outline:none}" +
  ".ascii-runner-canvas:focus-visible{outline:2px solid var(--color-primary,#1F1F1F);outline-offset:-2px}" +
  ".ascii-runner-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;" +
  "border-top:1px solid var(--color-border,#E4E4E4);padding:9px 14px;" +
  "font-family:ui-monospace,'SF Mono',Menlo,Consolas,'Courier New',monospace;" +
  "font-size:12px;line-height:1;letter-spacing:.02em;" +
  "color:var(--color-muted-foreground,#8A8A8A)}" +
  ".ascii-runner-bar b{font-weight:400;color:var(--color-foreground,#1F1F1F)}"

// ---- sprites (bottom line sits on the baseline) ----
const BUNNY = {
  runA: ["(\\_/)", "(o.o)", "/   \\"],
  runB: ["(\\_/)", "(o.o)", " | | "],
  blink: ["(\\_/)", "(-.-)", "/   \\"],
  jump: ["(\\_/)", "(o.o)", " \\ / "],
  duck: ["___(\\_/)", "(__(o.o)"],
  dead: ["(\\_/)", "(x.x)", "/   \\"],
}

// Solid blocks of @ so they read clearly against the bunny
const OBSTACLES = [
  { lines: [" @@ ", "@@@@"] },
  { lines: [" @ ", "@@@", "@@@", " @ "] },
  { lines: ["  @@  ", " @@@@ ", "@@@@@@"] },
  { lines: ["@  @  @", "@@@@@@@", " @@ @@ "] },
]
const BIRD = [["\\@@/"], ["-@@-"]]

type Box = { x: number; y: number; w: number; h: number }

// #region logic
/** Axis-aligned overlap. Touching edges do not count as a hit. */
export function hit(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/**
 * The collision box for a block of monospace lines whose last line sits on
 * `base`. Inset by `pad` on every side, because the glyphs never fill their
 * cells and a tight box makes near-misses read as unfair hits.
 */
export function boxOf(lines: string[], x: number, base: number, cw: number, pad = 2): Box {
  const cols = Math.max(...lines.map((l) => l.length))
  return {
    x: x + cw * 0.5 + pad,
    y: base - lines.length * LH + 6 + pad,
    w: cols * cw - cw - pad * 2,
    h: lines.length * LH - 4 - pad * 2,
  }
}

/** Distance travelled, as a score. */
export function scoreOf(dist: number): number {
  return Math.floor(dist / 10)
}

/** Deterministic value noise in [0, 1), for the scrolling ground pebbles. */
export function hash(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}
// #endregion

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

type Obstacle = { x: number; base: number; bird?: boolean; lines?: string[] }
type Status = "ready" | "running" | "over"
type Game = {
  status: Status
  p: { x: number; y: number; vy: number; onGround: boolean; duck: boolean }
  obs: Obstacle[]
  clouds: { x: number; y: number }[]
  speed: number
  dist: number
  spawn: number
  t: number
  flash: number
}

function newGame(): Game {
  return {
    status: "ready",
    p: { x: 70, y: BASE, vy: 0, onGround: true, duck: false },
    obs: [],
    clouds: Array.from({ length: 4 }, (_, i) => ({ x: 20 + i * 180 + rand(0, 70), y: rand(26, 64) })),
    speed: 6,
    dist: 0,
    spawn: 500,
    t: 0,
    flash: 0,
  }
}

function drawLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, base: number) {
  lines.forEach((l, i) => ctx.fillText(l, x, base - (lines.length - 1 - i) * LH))
}

function bunnySprite(g: Game, idle: boolean): string[] {
  const p = g.p
  if (g.status === "over") return BUNNY.dead
  if (p.duck && p.onGround) return BUNNY.duck
  if (!p.onGround) return BUNNY.jump
  if (g.status !== "running") return idle && Math.floor(g.t) % 160 < 8 ? BUNNY.blink : BUNNY.runA
  return Math.floor(g.t / 6) % 2 ? BUNNY.runA : BUNNY.runB
}

export default function AsciiRunner({
  caption = "space jump · shift duck",
  onGameOver,
  className = "",
}: AsciiRunnerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const probeRef = React.useRef<HTMLSpanElement | null>(null)
  const gameRef = React.useRef<Game>(newGame())
  const duckRef = React.useRef(false)
  const bestRef = React.useRef(0)
  const overAtRef = React.useRef(0)
  const touchRef = React.useRef<number | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const [status, setStatus] = React.useState<Status>("ready")
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const [coarse, setCoarse] = React.useState(false)
  const [palette, setPalette] = React.useState<Palette>(PALETTE)

  const onGameOverRef = React.useRef(onGameOver)
  onGameOverRef.current = onGameOver

  React.useEffect(() => {
    const bind = (q: string, set: (v: boolean) => void) => {
      const mq = window.matchMedia(q)
      set(mq.matches)
      const h = (e: MediaQueryListEvent) => set(e.matches)
      mq.addEventListener("change", h)
      return () => mq.removeEventListener("change", h)
    }
    const offMotion = bind("(prefers-reduced-motion: reduce)", setReducedMotion)
    const offTouch = bind("(pointer: coarse)", setCoarse)
    return () => {
      offMotion()
      offTouch()
    }
  }, [])

  // A theme flip is a class or attribute swap on <html>, not a media query, so
  // watching prefers-color-scheme alone misses every Tailwind/shadcn toggle.
  // The re-read bumps state, which re-runs the draw effect and repaints once --
  // needed because the loop is idle on the ready and game-over screens.
  React.useEffect(() => {
    const sync = () =>
      setPalette((prev) => {
        const next = readPalette(probeRef.current)
        return next.ink === prev.ink && next.dim === prev.dim ? prev : next
      })
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    })
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    mq.addEventListener("change", sync)
    return () => {
      mo.disconnect()
      mq.removeEventListener("change", sync)
    }
  }, [])

  const pressJump = React.useCallback(() => {
    let g = gameRef.current
    if (g.status === "over") {
      if (performance.now() - overAtRef.current < 400) return
      g = newGame()
      gameRef.current = g
    }
    if (g.status !== "running") {
      g.status = "running"
      setStatus("running")
    }
    const p = g.p
    if (p.onGround) {
      p.vy = JUMP
      p.onGround = false
    }
  }, [])

  const releaseJump = React.useCallback(() => {
    const p = gameRef.current.p
    if (!p.onGround && p.vy < SHORT_HOP) p.vy = SHORT_HOP
  }, [])

  // Keys are bound to the canvas, not to window.
  //
  // Bound to window, this swallows Space and the arrow keys for the entire
  // host page the moment the component mounts -- the visitor cannot scroll
  // past it. Scoped to a focusable canvas, preventDefault only applies while
  // the game actually has focus, which is also what makes it obvious that
  // keyboard input is going somewhere.
  const isJump = (code: string) => code === "Space" || code === "ArrowUp"
  const isDuck = (key: string, code: string) => key === "Shift" || code === "ArrowDown"

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (isJump(e.code)) {
      e.preventDefault()
      if (!e.repeat) pressJump()
    } else if (isDuck(e.key, e.code)) {
      e.preventDefault()
      duckRef.current = true
    }
  }
  const onKeyUp = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (isJump(e.code)) releaseJump()
    if (isDuck(e.key, e.code)) duckRef.current = false
  }
  const onBlur = () => {
    duckRef.current = false
  }

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pal = palette
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.font = FONT
    const cw = ctx.measureText("M").width

    let last = performance.now()
    let stopped = false

    const step = (now: number) => {
      const dt = Math.min((now - last) / 16.667, 3)
      last = now
      const g = gameRef.current
      const p = g.p
      g.t += dt
      g.flash = Math.max(0, g.flash - dt)

      if (g.status === "running") {
        g.speed = Math.min(6 + g.dist * 0.0011, 13)
        const move = g.speed * dt
        const before = scoreOf(g.dist)
        g.dist += move
        if (Math.floor(scoreOf(g.dist) / 100) > Math.floor(before / 100)) g.flash = 50

        p.duck = duckRef.current
        if (!p.onGround && p.duck) p.vy += GRAV * 1.6 * dt
        p.vy += GRAV * dt
        p.y += p.vy * dt
        if (p.y >= BASE) {
          p.y = BASE
          p.vy = 0
          p.onGround = true
        }

        g.spawn -= move
        if (g.spawn <= 0) {
          if (scoreOf(g.dist) > 150 && Math.random() < 0.3) {
            g.obs.push({ bird: true, x: W + 10, base: pick([BASE, BASE - 38, BASE - 76]) })
          } else {
            g.obs.push({ lines: pick(OBSTACLES).lines, x: W + 10, base: BASE })
          }
          g.spawn = rand(300, 580) + g.speed * 10
        }
        for (const o of g.obs) o.x -= (o.bird ? g.speed * 1.1 : g.speed) * dt
        g.obs = g.obs.filter((o) => o.x > -80)
        for (const c of g.clouds) {
          c.x -= g.speed * 0.15 * dt
          if (c.x < -80) {
            c.x = W + rand(0, 100)
            c.y = rand(26, 64)
          }
        }

        const pb = boxOf(bunnySprite(g, !reducedMotion), p.x, p.y, cw, 3)
        for (const o of g.obs) {
          const lines = o.bird ? BIRD[0] : o.lines!
          if (hit(pb, boxOf(lines, o.x, o.base, cw))) {
            g.status = "over"
            bestRef.current = Math.max(bestRef.current, scoreOf(g.dist))
            overAtRef.current = performance.now()
            setStatus("over")
            onGameOverRef.current?.(scoreOf(g.dist))
            break
          }
        }
      }

      // ---- draw ----
      // Cleared, not filled: the frame's own surface shows through, so the
      // game sits on the host's background in either theme.
      ctx.clearRect(0, 0, W, H)
      ctx.font = FONT
      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"

      ctx.fillStyle = pal.dim
      for (const c of g.clouds) ctx.fillText(".-~~-.", c.x, c.y)

      // ground: a row of underscores plus scrolling pebbles
      ctx.fillStyle = pal.ink
      const cols = Math.ceil(W / cw) + 2
      ctx.fillText("_".repeat(cols), 0, BASE + 2)
      ctx.fillStyle = pal.dim
      const shift = Math.floor(g.dist / cw)
      const off = g.dist % cw
      for (let i = 0; i < cols; i++) {
        const h1 = hash(i + shift)
        if (h1 > 0.82) ctx.fillText(h1 > 0.93 ? "," : ".", i * cw - off, BASE + 15)
        const h2 = hash((i + shift) * 3.1)
        if (h2 > 0.9) ctx.fillText("`", i * cw - off, BASE + 27)
      }

      ctx.fillStyle = pal.ink
      ctx.font = `bold ${FONT}`
      for (const o of g.obs) {
        const lines = o.bird ? BIRD[Math.floor(g.t / 10) % 2] : o.lines!
        drawLines(ctx, lines, o.x, o.base)
      }
      ctx.font = FONT
      drawLines(ctx, bunnySprite(g, !reducedMotion), p.x, p.y)

      // score: laid out from the right edge off the measured score width, so a
      // six-digit run pushes HI left instead of running into it.
      ctx.textAlign = "right"
      const sc = String(scoreOf(g.dist)).padStart(5, "0")
      const showScore = !(g.flash > 0 && Math.floor(g.flash / 8) % 2)
      ctx.fillStyle = pal.dim
      ctx.fillText(`HI ${String(bestRef.current).padStart(5, "0")}`, W - PAD - ctx.measureText(sc).width - cw * 2, 30)
      ctx.fillStyle = pal.ink
      if (showScore) ctx.fillText(sc, W - PAD, 30)

      // Overlay copy sits in the band just above the bunny's head rather than
      // mid-sky, so the eye reads prompt and character as one thing.
      ctx.textAlign = "center"
      if (g.status === "ready") {
        ctx.fillText(coarse ? "tap to run" : "press space to run", W / 2, 100)
      } else if (g.status === "over") {
        ctx.fillText("G A M E   O V E R", W / 2, 76)
        ctx.fillStyle = pal.dim
        ctx.fillText(coarse ? "tap to retry" : "space to retry", W / 2, 102)
      }

      // A run needs every frame. The ready screen only needs them for the
      // blink, and the game-over screen is completely static -- looping
      // through those burns a core to redraw identical pixels.
      const needsNextFrame =
        gameRef.current.status === "running" ||
        (gameRef.current.status === "ready" && !reducedMotion)
      if (!stopped && needsNextFrame) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      stopped = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [reducedMotion, status, palette, coarse])

  const focusCanvas = () => canvasRef.current?.focus()

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    focusCanvas()
    touchRef.current = e.clientY
    pressJump()
  }
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (touchRef.current !== null && e.clientY - touchRef.current > 24) duckRef.current = true
  }
  const onPointerUp = () => {
    touchRef.current = null
    duckRef.current = false
    releaseJump()
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <style>{CSS}</style>
      <span ref={probeRef} aria-hidden="true" style={{ display: "none" }} />
      <div className="ascii-runner-frame" style={{ width: "100%", maxWidth: W }}>
        <canvas
          className="ascii-runner-canvas"
          ref={canvasRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={onBlur}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="application"
          aria-label={
            "ASCII runner game" +
            (status === "over" ? ", game over" : "") +
            ". Click or press space to jump, shift to duck."
          }
          style={{ maxWidth: "none", aspectRatio: `${W} / ${H}` }}
        />
        {caption ? (
          <div className="ascii-runner-bar">
            <span>{coarse ? "tap jump · swipe down duck" : caption}</span>
            <span>
              best <b>{String(bestRef.current).padStart(5, "0")}</b>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
