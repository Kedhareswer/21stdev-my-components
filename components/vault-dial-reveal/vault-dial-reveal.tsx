"use client"

import * as React from "react"

/**
 * Vault Dial Reveal — a matte strongbox on a plinth, with a spoked handwheel
 * you actually turn. Dial in the combination and the wheel spins free, the
 * door swings out on its hinge and whatever is inside lights the room.
 *
 * It is built as a real 3D scene out of CSS transforms, not a picture: the
 * door is a slab with thickness that rotates about its hinge under one shared
 * perspective, the interior has walls, and the coin is a disc with a milled
 * edge you can tilt and flip. Nothing is loaded — every surface is a gradient
 * or inline SVG, the sounds are synthesised, and it renders the same offline.
 *
 * Drag the wheel (or focus it and use the arrow keys) to a number, let go (or
 * press Enter) to set it. Set every number of the code and it opens.
 */

export type VaultTone = "graphite" | "midnight" | "bone"
export type CoinMetal = "gold" | "silver" | "rose"

export type VaultDialRevealProps = {
  /** The combination, as numbers on the dial. Up to six. */
  code?: number[]
  /** Numbers around the dial. */
  ticks?: number
  /** Show the combination as faint hints, so a visitor can open it. */
  hint?: boolean
  /** Start already open. */
  defaultOpen?: boolean
  /** How far the door swings, in degrees. */
  swing?: number
  /** Colour of the safe and the room. */
  tone?: VaultTone
  /** What the coin is struck in. Also sets the glow and the accent. */
  metal?: CoinMetal
  /** The mark on the coin. */
  symbol?: string
  /** Replace the coin with your own contents. Rendered inside the safe. */
  children?: React.ReactNode
  /** Small line engraved under the wheel. */
  engraving?: string
  /** The fine print under the scene. `null` hides it. */
  caption?: React.ReactNode
  /** Clicks, clunk and chime. Only ever on a user gesture. */
  sound?: boolean
  /** Scene height. A definite length — never a percentage. */
  height?: string
  onUnlock?: () => void
  onLock?: () => void
  /** Called with every complete attempt and whether it opened the safe. */
  onAttempt?: (entered: number[], ok: boolean) => void
  className?: string
}

// #region dial
export const mod = (n: number, m: number): number => ((n % m) + m) % m

/** Shortest signed turn, in degrees, for a raw difference of two angles. */
export const unwrapDelta = (d: number): number => {
  if (!Number.isFinite(d)) return 0
  const x = mod(d + 180, 360) - 180
  return x === -180 ? 180 : x
}

/** Pointer angle around a centre: 0 at twelve o'clock, clockwise positive. */
export const pointerAngle = (x: number, y: number, cx: number, cy: number): number =>
  (Math.atan2(x - cx, cy - y) * 180) / Math.PI

/**
 * The number under the index when the wheel has turned `angle` degrees
 * clockwise. Numbers are printed clockwise, so turning right counts down —
 * the way a real dial reads.
 */
export const valueAt = (angle: number, ticks: number): number => {
  const step = 360 / ticks
  const v = mod(Math.round(-angle / step), ticks)
  return v === 0 ? 0 : v
}

/** The wheel angle nearest `from` that puts `value` under the index. */
export const angleFor = (value: number, ticks: number, from: number): number =>
  from + unwrapDelta(-value * (360 / ticks) - from)

export const normalizeCode = (code: number[], ticks: number): number[] =>
  code
    .filter((v) => Number.isFinite(v))
    .slice(0, 6)
    .map((v) => mod(Math.round(v), ticks))

export const matches = (entered: number[], code: number[]): boolean =>
  code.length > 0 && entered.length === code.length && entered.every((v, i) => v === code[i])

/** Labelled numbers on the ring: every one on a small dial, every 5 or 10 on a big one. */
export const labelEvery = (ticks: number): number => (ticks > 60 ? 10 : ticks > 24 ? 5 : 1)
// #endregion

/* ---------------------------------------------------------------- palette */

type Tone = {
  hi: string
  mid: string
  lo: string
  edge: string
  ink: string
  wallNear: string
  wallFar: string
  back: string
  bg: [string, string, string]
  plinthTop: [string, string]
  plinthFront: [string, string]
  text: string
  muted: string
}

const TONES: Record<VaultTone, Tone> = {
  graphite: {
    hi: "#555b68",
    mid: "#2b2f38",
    lo: "#15171d",
    edge: "#1d2027",
    ink: "#8a91a0",
    wallNear: "#2a2d35",
    wallFar: "#121318",
    back: "#0d0e12",
    bg: ["#2b3449", "#131824", "#05060a"],
    plinthTop: ["#0f1116", "#2a2e38"],
    plinthFront: ["#1b1e25", "#08090c"],
    text: "#c9ceda",
    muted: "#7d8494",
  },
  midnight: {
    hi: "#4a5a7c",
    mid: "#243049",
    lo: "#10172a",
    edge: "#18213a",
    ink: "#8ea0c6",
    wallNear: "#222c45",
    wallFar: "#0e1424",
    back: "#0a0f1c",
    bg: ["#26406e", "#0f1a33", "#03060e"],
    plinthTop: ["#0b1222", "#25314d"],
    plinthFront: ["#16203a", "#050912"],
    text: "#cbd6f0",
    muted: "#7a88a8",
  },
  bone: {
    hi: "#faf7f1",
    mid: "#d9d3c8",
    lo: "#a39b8d",
    edge: "#bdb5a7",
    ink: "#6f685c",
    wallNear: "#cfc8bb",
    wallFar: "#8f877a",
    back: "#7a7367",
    bg: ["#f6f2ea", "#ddd6c9", "#b3ab9c"],
    plinthTop: ["#b7af9f", "#e8e2d7"],
    plinthFront: ["#d8d1c4", "#a9a091"],
    text: "#3b372f",
    muted: "#7b7468",
  },
}

type Metal = {
  face: [string, string, string, string]
  edgeLight: [number, number, number]
  edgeDark: [number, number, number]
  ink: string
  glow: string
  accent: string
}

const METALS: Record<CoinMetal, Metal> = {
  gold: {
    face: ["#fff5d1", "#f5cd68", "#d4962a", "#7d4a0c"],
    edgeLight: [246, 206, 110],
    edgeDark: [96, 56, 10],
    ink: "#c88a22",
    glow: "255, 178, 72",
    accent: "#f5c35b",
  },
  silver: {
    face: ["#ffffff", "#e3e8ee", "#a9b1bd", "#545b66"],
    edgeLight: [236, 240, 245],
    edgeDark: [66, 72, 82],
    ink: "#9aa3b1",
    glow: "196, 218, 255",
    accent: "#cfe0ff",
  },
  rose: {
    face: ["#fff1ea", "#f5bba3", "#cb7c5f", "#6c3322"],
    edgeLight: [244, 182, 156],
    edgeDark: [90, 40, 26],
    ink: "#c27052",
    glow: "255, 152, 118",
    accent: "#f7ab8e",
  },
}

/* --------------------------------------------------------------- geometry */

// One design space, scaled to fit. Every 3D element shares one perspective so
// the door, the walls and the coin agree on where the camera is.
const STAGE_W = 800
const STAGE_H = 860
const EYE_Y = 360
const PERSPECTIVE = 1600

const BODY = { x: 190, y: 110, w: 420, h: 470, r: 36 }
const BEZEL = 30
const OPEN = { x: BODY.x + BEZEL, y: BODY.y + BEZEL, w: BODY.w - BEZEL * 2, h: BODY.h - BEZEL * 2 }
const DEPTH = 170

const DOOR = { x: BODY.x + 6, y: BODY.y + 6, w: BODY.w - 12, h: BODY.h - 12, r: 26, t: 30 }
const WHEEL = { cx: DOOR.w / 2, cy: DOOR.h / 2 - 6, r: 158 }

const PLINTH = { x: 140, w: 520, front: 60, back: -260, top: BODY.y + BODY.h, h: 280 }

const COIN = { d: 250, t: 24, segments: 48, x: 455, y: 418, z: -82, yaw: -28 }

const SPOKES = [0, 60, 120, 180, 240, 300]

/* ------------------------------------------------------------------ sound */

type Sound = {
  tick: () => void
  set: () => void
  clunk: () => void
  deny: () => void
  chime: () => void
  dispose: () => void
}

function createSound(): Sound {
  let ctx: AudioContext | null = null
  let lastTick = 0
  const get = (): AudioContext | null => {
    if (typeof window === "undefined") return null
    if (!ctx) {
      const C =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!C) return null
      ctx = new C()
    }
    if (ctx.state === "suspended") void ctx.resume()
    return ctx
  }
  const noise = (c: AudioContext, seconds: number): AudioBuffer => {
    const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * seconds)), c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    return buf
  }
  const burst = (freq: number, q: number, gain: number, dur: number, type: BiquadFilterType) => {
    const c = get()
    if (!c) return
    const t = c.currentTime
    const src = c.createBufferSource()
    src.buffer = noise(c, dur)
    const f = c.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    const g = c.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(c.destination)
    src.start(t)
    src.stop(t + dur + 0.02)
  }
  const tone = (freq: number, to: number, gain: number, dur: number, type: OscillatorType, delay = 0) => {
    const c = get()
    if (!c) return
    const t = c.currentTime + delay
    const o = c.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    o.frequency.exponentialRampToValueAtTime(to, t + dur)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(c.destination)
    o.start(t)
    o.stop(t + dur + 0.02)
  }
  return {
    tick() {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now()
      if (now - lastTick < 28) return
      lastTick = now
      burst(3400, 3, 0.16, 0.028, "bandpass")
    },
    set() {
      burst(1500, 1.5, 0.3, 0.05, "bandpass")
      tone(220, 140, 0.12, 0.08, "triangle")
    },
    clunk() {
      tone(95, 45, 0.5, 0.35, "sine")
      burst(500, 0.7, 0.35, 0.18, "lowpass")
      burst(2400, 2, 0.12, 0.05, "bandpass")
    },
    deny() {
      tone(150, 130, 0.12, 0.12, "square")
      tone(120, 100, 0.12, 0.16, "square", 0.15)
    },
    chime() {
      tone(1318, 1310, 0.07, 1.6, "sine", 0.05)
      tone(1975, 1970, 0.045, 1.3, "sine", 0.12)
      tone(2637, 2630, 0.03, 1.0, "sine", 0.2)
    },
    dispose() {
      if (ctx) void ctx.close()
      ctx = null
    },
  }
}

/* ------------------------------------------------------------------ hooks */

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

/* ------------------------------------------------------------------ style */

// Scoped by the vdr- prefix. Plain string on purpose: no template literal in CSS.
const CSS =
  "@keyframes vdr-shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-9px)}30%{transform:translateX(8px)}45%{transform:translateX(-6px)}60%{transform:translateX(5px)}75%{transform:translateX(-2px)}}" +
  "@keyframes vdr-pulse{0%,100%{opacity:.55}50%{opacity:1}}" +
  "@keyframes vdr-breathe{0%,100%{opacity:.82}50%{opacity:1}}" +
  ".vdr-shake{animation:vdr-shake .55s cubic-bezier(.36,.07,.19,.97) both}" +
  ".vdr-pulse{animation:vdr-pulse 1.4s ease-in-out infinite}" +
  ".vdr-breathe{animation:vdr-breathe 3.2s ease-in-out infinite}" +
  ".vdr-dial:focus{outline:none}" +
  ".vdr-dial:focus-visible .vdr-ring{opacity:1}" +
  "@media (prefers-reduced-motion: reduce){.vdr-shake,.vdr-pulse,.vdr-breathe{animation:none}}"

const abs: React.CSSProperties = { position: "absolute", left: 0, top: 0 }
const p3d: React.CSSProperties = { transformStyle: "preserve-3d" }

/* ------------------------------------------------------------------- coin */

function CoinFace({ metal, symbol, back }: { metal: Metal; symbol: string; back?: boolean }) {
  const [f0, f1, f2, f3] = metal.face
  const d = COIN.d
  return (
    <div
      style={{
        ...abs,
        width: d,
        height: d,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 34% 28%, " + f0 + " 0%, " + f1 + " 24%, " + f2 + " 60%, " + f3 + " 100%)",
        transform: back ? "rotateY(180deg) translateZ(" + COIN.t / 2 + "px)" : "translateZ(" + COIN.t / 2 + "px)",
        backfaceVisibility: "hidden",
        boxShadow: "inset 0 0 0 2px rgba(255,255,255,.35), inset 0 -6px 14px rgba(0,0,0,.35)",
      }}
    >
      {/* milled band round the rim */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "repeating-conic-gradient(from 0deg, rgba(255,255,255,.32) 0deg 1.2deg, rgba(60,30,0,.28) 1.2deg 2.4deg)",
          WebkitMaskImage: "radial-gradient(circle, transparent 0 85%, #000 86% 95%, transparent 96%)",
          maskImage: "radial-gradient(circle, transparent 0 85%, #000 86% 95%, transparent 96%)",
          mixBlendMode: "overlay",
        }}
      />
      {/* raised field */}
      <div
        style={{
          position: "absolute",
          inset: "13%",
          borderRadius: "50%",
          boxShadow:
            "0 0 0 2px rgba(255,255,255,.28), 0 0 0 5px rgba(0,0,0,.12), inset 0 8px 16px rgba(0,0,0,.18), inset 0 -2px 3px rgba(255,255,255,.4)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          fontWeight: 800,
          fontSize: back ? d * 0.11 : d * 0.5,
          letterSpacing: back ? "0.3em" : 0,
          lineHeight: 1,
          color: metal.ink,
          textShadow: "0 -1.5px 0 rgba(255,255,255,.65), 0 2px 1px rgba(70,35,0,.45), 0 5px 10px rgba(70,35,0,.25)",
          transform: "rotate(-8deg)",
          userSelect: "none",
        }}
      >
        {back ? "VAULT" : symbol}
      </div>
      {/* travelling sheen, driven by the coin's yaw */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "linear-gradient(115deg, transparent 32%, rgba(255,255,255,.55) 47%, rgba(255,255,255,.1) 55%, transparent 64%)",
          backgroundSize: "260% 100%",
          backgroundPosition: "calc(var(--vdr-sheen, 50) * 1%) 0",
          mixBlendMode: "soft-light",
        }}
      />
    </div>
  )
}

function Coin({ metal, symbol }: { metal: Metal; symbol: string }) {
  const d = COIN.d
  const n = COIN.segments
  const segW = (Math.PI * d) / n + 1
  const [lr, lg, lb] = metal.edgeLight
  const [dr, dg, db] = metal.edgeDark
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const phi = (i * 360) / n
        // Lit from the upper left, dark round the bottom right.
        const k = 0.5 + 0.5 * Math.cos(((phi - 315) * Math.PI) / 180)
        const c =
          "rgb(" +
          Math.round(dr + (lr - dr) * k) +
          "," +
          Math.round(dg + (lg - dg) * k) +
          "," +
          Math.round(db + (lb - db) * k) +
          ")"
        return (
          <div
            key={i}
            style={{
              ...abs,
              left: d / 2 - segW / 2,
              top: d / 2 - COIN.t / 2,
              width: segW,
              height: COIN.t,
              background:
                "repeating-linear-gradient(90deg, rgba(255,255,255,.28) 0 1.5px, rgba(0,0,0,.28) 1.5px 3.4px), " + c,
              transform: "rotateZ(" + phi + "deg) translateY(" + -d / 2 + "px) rotateX(90deg)",
            }}
          />
        )
      })}
      <CoinFace metal={metal} symbol={symbol} />
      <CoinFace metal={metal} symbol={symbol} back />
    </>
  )
}

/* ------------------------------------------------------------- component */

type Phase = "locked" | "denied" | "opening" | "open" | "closing"

export default function VaultDialReveal({
  code: codeProp = [12, 30, 7],
  ticks: ticksProp = 40,
  hint = true,
  defaultOpen = false,
  swing = 72,
  tone: toneName = "graphite",
  metal: metalName = "gold",
  symbol = "₿",
  children,
  engraving = "DEPOSIT Nº 0417 · EST. 2026",
  caption = "Contents are unregulated, highly sentimental and subject to significant nostalgia. Not available in all jurisdictions.",
  sound = true,
  height = "100svh",
  onUnlock,
  onLock,
  onAttempt,
  className,
}: VaultDialRevealProps) {
  const ticks = Math.max(8, Math.min(120, Math.round(Number.isFinite(ticksProp) ? ticksProp : 40)))
  const code = React.useMemo(() => {
    const c = normalizeCode(codeProp, ticks)
    return c.length ? c : [0]
  }, [codeProp, ticks])
  const step = 360 / ticks
  const tone = TONES[toneName] ?? TONES.graphite
  const metal = METALS[metalName] ?? METALS.gold
  const reduced = useReducedMotion()
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const id = (s: string) => "vdr" + uid + s

  const [phase, setPhase] = React.useState<Phase>(defaultOpen ? "open" : "locked")
  const [entered, setEntered] = React.useState<number[]>(defaultOpen ? code : [])
  const [dial, setDial] = React.useState(0)
  const [scale, setScale] = React.useState(0.6)
  const [doorOpen, setDoorOpen] = React.useState(defaultOpen)

  const areaRef = React.useRef<HTMLDivElement>(null)
  const wheelRef = React.useRef<HTMLDivElement>(null)
  const hitRef = React.useRef<HTMLDivElement>(null)
  const coinRef = React.useRef<HTMLDivElement>(null)
  const angleRef = React.useRef(0)
  const phaseRef = React.useRef<Phase>(phase)
  const enteredRef = React.useRef<number[]>(entered)
  const timers = React.useRef<number[]>([])
  const soundRef = React.useRef<Sound | null>(null)
  const drag = React.useRef<{ id: number; last: number; moved: number; cx: number; cy: number } | null>(null)
  const pointer = React.useRef({ x: 0, y: 0 })
  const spin = React.useRef({ target: 0 })

  phaseRef.current = phase
  enteredRef.current = entered

  const play = React.useCallback(
    (k: Exclude<keyof Sound, "dispose">) => {
      if (!sound) return
      if (!soundRef.current) soundRef.current = createSound()
      soundRef.current[k]()
    },
    [sound],
  )

  const later = React.useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  React.useEffect(
    () => () => {
      timers.current.forEach((t) => clearTimeout(t))
      soundRef.current?.dispose()
    },
    [],
  )

  // Fit the design space into whatever box the host gives us.
  React.useEffect(() => {
    const el = areaRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const fit = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w > 0 && h > 0) setScale(Math.min((w * 0.96) / STAGE_W, (h * 0.98) / STAGE_H))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /* ---- wheel ---- */

  const setWheel = React.useCallback((angle: number, transition: string) => {
    angleRef.current = angle
    const el = wheelRef.current
    if (!el) return
    el.style.transition = transition
    el.style.transform = "rotate(" + angle + "deg)"
  }, [])

  const syncValue = React.useCallback(
    (silent?: boolean) => {
      const v = valueAt(angleRef.current, ticks)
      setDial((prev) => {
        if (prev !== v && !silent) play("tick")
        return v
      })
    },
    [ticks, play],
  )

  const unlock = React.useCallback(() => {
    setPhase("opening")
    play("clunk")
    setWheel(angleRef.current + 360, "transform " + (reduced ? 0.2 : 1.1) + "s cubic-bezier(.45,0,.2,1)")
    later(() => {
      setDoorOpen(true)
      play("chime")
    }, reduced ? 150 : 900)
    later(() => {
      setPhase("open")
      onUnlock?.()
    }, reduced ? 500 : 2300)
  }, [later, onUnlock, play, reduced, setWheel])

  const deny = React.useCallback(
    (attempt: number[]) => {
      setPhase("denied")
      play("deny")
      later(() => {
        setEntered([])
        setPhase("locked")
      }, 1100)
      onAttempt?.(attempt, false)
    },
    [later, onAttempt, play],
  )

  const commit = React.useCallback(
    (v: number) => {
      if (phaseRef.current !== "locked") return
      const next = [...enteredRef.current, v]
      enteredRef.current = next
      setEntered(next)
      play("set")
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(6)
      if (next.length < code.length) return
      if (matches(next, code)) {
        onAttempt?.(next, true)
        unlock()
      } else deny(next)
    },
    [code, deny, onAttempt, play, unlock],
  )

  const lock = React.useCallback(() => {
    if (phaseRef.current !== "open") return
    setPhase("closing")
    setDoorOpen(false)
    play("clunk")
    later(() => {
      // Scramble the wheel back round, as a real one is spun off its number.
      const target = mod(Math.floor(Math.random() * ticks), ticks)
      setWheel(angleFor(target, ticks, angleRef.current) - 360, "transform " + (reduced ? 0.2 : 0.9) + "s cubic-bezier(.3,.7,.2,1)")
      setDial(target)
      setEntered([])
      setPhase("locked")
      onLock?.()
    }, reduced ? 350 : 1250)
  }, [later, onLock, play, reduced, setWheel, ticks])

  const onDialDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== "locked") return
    const r = (hitRef.current ?? e.currentTarget).getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId, last: pointerAngle(e.clientX, e.clientY, cx, cy), moved: 0, cx, cy }
    setWheel(angleRef.current, "none")
  }

  const onDialMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const a = pointerAngle(e.clientX, e.clientY, d.cx, d.cy)
    const delta = unwrapDelta(a - d.last)
    d.last = a
    d.moved += Math.abs(delta)
    setWheel(angleRef.current + delta, "none")
    syncValue()
  }

  const onDialUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    const v = valueAt(angleRef.current, ticks)
    setWheel(angleFor(v, ticks, angleRef.current), "transform .22s cubic-bezier(.3,.7,.3,1.3)")
    syncValue(true)
    // A tap is not a turn: only a real movement sets a number.
    if (e.type === "pointerup" && d.moved >= step * 0.5) commit(v)
  }

  const onDialKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (phaseRef.current === "open" && e.key === "Escape") {
      e.preventDefault()
      lock()
      return
    }
    if (phaseRef.current !== "locked") return
    const cur = valueAt(angleRef.current, ticks)
    let next: number | null = null
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = cur + 1
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = cur - 1
    else if (e.key === "PageUp") next = cur + 5
    else if (e.key === "PageDown") next = cur - 5
    else if (e.key === "Home") next = 0
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      commit(cur)
      return
    } else if (e.key === "Backspace") {
      e.preventDefault()
      setEntered((p) => p.slice(0, -1))
      return
    } else if (e.key === "Escape") {
      e.preventDefault()
      setEntered([])
      return
    }
    if (next === null) return
    e.preventDefault()
    setWheel(angleFor(mod(next, ticks), ticks, angleRef.current), "transform .16s cubic-bezier(.3,.7,.3,1.2)")
    syncValue()
  }

  /* ---- coin: tilt with the pointer, flip on tap, idle sway ---- */

  const live = phase === "opening" || phase === "open" || phase === "closing" || doorOpen
  React.useEffect(() => {
    if (!live) return
    let raf = 0
    const cur = { ry: COIN.yaw, rx: 4, spin: spin.current.target }
    const t0 = performance.now()
    const frame = (now: number) => {
      const t = (now - t0) / 1000
      const sway = reduced ? 0 : Math.sin(t * 0.7) * 6
      const bob = reduced ? 0 : Math.sin(t * 1.3) * 4
      const ry = COIN.yaw + sway + pointer.current.x * 26
      const rx = 4 - pointer.current.y * 16
      cur.ry += (ry - cur.ry) * 0.08
      cur.rx += (rx - cur.rx) * 0.08
      cur.spin += (spin.current.target - cur.spin) * (reduced ? 1 : 0.07)
      const el = coinRef.current
      if (el) {
        const yaw = cur.ry + cur.spin
        el.style.transform =
          "translateZ(" + COIN.z + "px) translateY(" + bob + "px) rotateX(" + cur.rx + "deg) rotateY(" + yaw + "deg)"
        el.style.setProperty("--vdr-sheen", String(50 + Math.sin((yaw * Math.PI) / 180) * 70))
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [live, reduced])

  const onScenePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" && drag.current) return
    const r = e.currentTarget.getBoundingClientRect()
    pointer.current.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
    pointer.current.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
  }

  const flip = () => {
    if (phaseRef.current !== "open") return
    spin.current.target += 360
    play("set")
  }

  /* ---- render ---- */

  const swingDeg = Math.max(10, Math.min(110, swing))
  const lit = doorOpen ? 1 : 0
  // Behind a shut door nothing inside is visible anyway, and not drawing it
  // means a mis-sorted plane can never bleed through the door.
  const inside: React.CSSProperties = { visibility: doorOpen || phase === "closing" ? "visible" : "hidden" }
  const glow = "rgba(" + metal.glow + ","
  const active = phase === "locked" ? entered.length : -1
  const fmt = (v: number) => String(v).padStart(String(ticks - 1).length, "0")
  const every = labelEvery(ticks)

  const status =
    phase === "denied"
      ? "Wrong combination. The wheel resets."
      : phase === "opening"
        ? "Unlocking…"
        : phase === "closing"
          ? "Locking…"
          : phase === "open"
            ? children
              ? "Open."
              : "Open. Move across the coin, tap it to flip."
            : entered.length === 0
              ? hint
                ? "Turn the wheel to " + code.map(fmt).join(" · ") + " — let go on each."
                : "Turn the wheel to a number, then let go to set it."
              : entered.map(fmt).join(" · ") + " set — " + (code.length - entered.length) + " to go."

  const lampColor =
    phase === "denied" ? "#ff5a4f" : phase === "open" || phase === "opening" ? metal.accent : entered.length ? metal.accent : tone.lo

  const doorTransition =
    phase === "closing"
      ? "transform " + (reduced ? 0.3 : 1.15) + "s cubic-bezier(.55,0,.35,1)"
      : "transform " + (reduced ? 0.35 : 1.6) + "s cubic-bezier(.22,.85,.25,1.04)"

  return (
    <div
      className={"relative flex w-full flex-col overflow-hidden select-none " + (className ?? "")}
      style={{
        height,
        background:
          "radial-gradient(120% 90% at 50% 32%, " + tone.bg[0] + " 0%, " + tone.bg[1] + " 48%, " + tone.bg[2] + " 100%)",
        color: tone.text,
      }}
      onPointerMove={onScenePointer}
      onPointerLeave={() => {
        pointer.current.x = 0
        pointer.current.y = 0
      }}
    >
      <style>{CSS}</style>

      {/* the room's light, warmed by whatever is inside */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-[1600ms] motion-reduce:transition-none"
        style={{
          opacity: lit,
          background: "radial-gradient(50% 42% at 55% 42%, " + glow + "0.16) 0%, transparent 70%)",
        }}
      />

      <div ref={areaRef} className="relative min-h-0 flex-1">
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: STAGE_W,
            height: STAGE_H,
            marginLeft: -STAGE_W / 2,
            marginTop: -STAGE_H / 2,
            transform: "scale(" + scale + ")",
            perspective: PERSPECTIVE,
            perspectiveOrigin: STAGE_W / 2 + "px " + EYE_Y + "px",
          }}
        >
          <div style={{ ...abs, ...p3d, width: STAGE_W, height: STAGE_H }}>
            {/* ---------------- plinth ---------------- */}
            <div
              aria-hidden
              style={{
                ...abs,
                left: PLINTH.x,
                top: PLINTH.top - (PLINTH.front - PLINTH.back) / 2,
                width: PLINTH.w,
                height: PLINTH.front - PLINTH.back,
                transform: "translateZ(" + (PLINTH.front + PLINTH.back) / 2 + "px) rotateX(90deg)",
                background: "linear-gradient(to bottom, " + tone.plinthTop[0] + ", " + tone.plinthTop[1] + ")",
                boxShadow: "inset 0 -2px 0 rgba(255,255,255,.14)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: BODY.x - PLINTH.x - 30,
                  width: BODY.w + 60,
                  top: -PLINTH.back - DEPTH - 20,
                  height: DEPTH + 60,
                  background: "radial-gradient(60% 55% at 50% 70%, rgba(0,0,0,.75), transparent 75%)",
                }}
              />
              <div
                className="transition-opacity duration-[1600ms] motion-reduce:transition-none"
                style={{
                  position: "absolute",
                  left: COIN.x - PLINTH.x - 200,
                  width: 400,
                  top: -PLINTH.back - 30,
                  height: PLINTH.front + 30,
                  opacity: lit,
                  background: "radial-gradient(50% 60% at 50% 0%, " + glow + "0.32), transparent 80%)",
                }}
              />
            </div>
            <div
              style={{
                ...abs,
                left: PLINTH.x,
                top: PLINTH.top,
                width: PLINTH.w,
                height: PLINTH.h,
                transform: "translateZ(" + PLINTH.front + "px)",
                background: "linear-gradient(to bottom, " + tone.plinthFront[0] + " 0%, " + tone.plinthFront[1] + " 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.1)",
                // The plinth runs on out of the light rather than stopping at an edge.
                WebkitMaskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)",
              }}
            >
              <Readout
                code={code}
                entered={entered}
                active={active}
                dial={dial}
                hint={hint}
                tone={tone}
                accent={phase === "denied" ? "#ff6b5f" : metal.accent}
                fmt={fmt}
                denied={phase === "denied"}
              />
            </div>

            {/* ---------------- interior ---------------- */}
            <div style={{ ...abs, ...p3d, ...inside, width: STAGE_W, height: STAGE_H }}>
              <Interior tone={tone} glow={glow} lit={lit} />
            </div>

            {/* ---------------- contents ---------------- */}
            {children ? (
              <div
                className="transition-opacity duration-700 motion-reduce:transition-none"
                style={{
                  ...abs,
                  left: OPEN.x + 20,
                  top: OPEN.y + 20,
                  width: OPEN.w - 40,
                  height: OPEN.h - 40,
                  transform: "translateZ(" + -DEPTH / 2 + "px)",
                  ...inside,
                  display: "grid",
                  placeItems: "center",
                  opacity: doorOpen ? 1 : 0.15,
                }}
              >
                {children}
              </div>
            ) : (
              <div
                ref={coinRef}
                role="button"
                tabIndex={phase === "open" ? 0 : -1}
                aria-label="Flip the coin"
                onClick={flip}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    flip()
                  }
                }}
                style={{
                  ...abs,
                  ...p3d,
                  left: COIN.x - COIN.d / 2,
                  top: COIN.y - COIN.d / 2,
                  width: COIN.d,
                  height: COIN.d,
                  ...inside,
                  cursor: phase === "open" ? "pointer" : "default",
                  transform: "translateZ(" + COIN.z + "px) rotateX(4deg) rotateY(" + COIN.yaw + "deg)",
                  outline: "none",
                }}
              >
                <Coin metal={metal} symbol={symbol} />
              </div>
            )}

            {/* ---------------- body bezel ---------------- */}
            <Bezel tone={tone} id={id} glow={glow} lit={lit} />

            {/* ---------------- door ---------------- */}
            <div
              style={{
                ...abs,
                ...p3d,
                left: DOOR.x,
                top: DOOR.y,
                width: DOOR.w,
                height: DOOR.h,
                transformOrigin: "0 50% 0",
                transition: doorTransition,
                transform:
                  "translateZ(" + (DOOR.t / 2 + 0.5 + (doorOpen ? 4 : 0)) + "px) rotateY(" + (doorOpen ? -swingDeg : 0) + "deg)",
              }}
            >
              <div className={phase === "denied" ? "vdr-shake" : undefined} style={{ ...abs, ...p3d, width: DOOR.w, height: DOOR.h }}>
                {/* edges */}
                {[0, 1].map((side) => (
                  <div
                    key={side}
                    aria-hidden
                    style={{
                      ...abs,
                      left: (side ? DOOR.w : 0) - DOOR.t / 2,
                      top: DOOR.r * 0.6,
                      width: DOOR.t,
                      height: DOOR.h - DOOR.r * 1.2,
                      transform: "rotateY(" + (side ? 90 : -90) + "deg)",
                      // Only ever seen from outside. Without this the inner face
                      // can be drawn over the door front when Chrome sorts planes.
                      backfaceVisibility: "hidden",
                      background:
                        "linear-gradient(to right, " + tone.lo + ", " + tone.edge + " 40%, " + tone.mid + " 70%, " + tone.lo + ")",
                    }}
                  >
                    {side ? (
                      <div
                        className="transition-opacity duration-[1600ms] motion-reduce:transition-none"
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: lit * 0.9,
                          background: "linear-gradient(to bottom, transparent 10%, " + glow + "0.4) 55%, transparent 95%)",
                        }}
                      />
                    ) : null}
                  </div>
                ))}
                {/* back of the door: bolts and a plate */}
                <div
                  aria-hidden
                  style={{
                    ...abs,
                    width: DOOR.w,
                    height: DOOR.h,
                    borderRadius: DOOR.r,
                    transform: "translateZ(" + -DOOR.t / 2 + "px) rotateY(180deg)",
                    backfaceVisibility: "hidden",
                    background: "linear-gradient(200deg, " + tone.mid + ", " + tone.lo + ")",
                    boxShadow: "inset 0 0 0 14px " + tone.lo + ", inset 0 0 0 16px rgba(255,255,255,.06)",
                  }}
                />
                {/* front */}
                <div
                  onClick={() => {
                    if (phaseRef.current === "open") lock()
                  }}
                  style={{
                    ...abs,
                    width: DOOR.w,
                    height: DOOR.h,
                    transform: "translateZ(" + DOOR.t / 2 + "px)",
                    backfaceVisibility: "hidden",
                    cursor: phase === "open" ? "pointer" : "default",
                  }}
                  title={phase === "open" ? "Close the door" : undefined}
                >
                  <DoorFace tone={tone} id={id} engraving={engraving} lamp={lampColor} phase={phase} />

                  {/* the wheel: shadow on a still parent so it does not turn with the spokes */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: WHEEL.cx - 170,
                      top: WHEEL.cy - 170,
                      width: 340,
                      height: 340,
                      filter:
                        tone === TONES.bone
                          ? "drop-shadow(6px 12px 8px rgba(60,50,30,.35))"
                          : "drop-shadow(8px 14px 10px rgba(0,0,0,.6))",
                    }}
                  >
                    <div ref={wheelRef} style={{ position: "absolute", inset: 0, transform: "rotate(0deg)" }}>
                      <Wheel tone={tone} id={id} ticks={ticks} every={every} fmt={fmt} />
                    </div>
                  </div>

                  {/* index */}
                  <svg
                    aria-hidden
                    width="24"
                    height="20"
                    viewBox="0 0 24 20"
                    style={{ position: "absolute", left: WHEEL.cx - 12, top: WHEEL.cy - WHEEL.r - 12, maxWidth: "none" }}
                  >
                    <path d="M3 2h18L12 17z" fill={metal.accent} stroke="rgba(0,0,0,.45)" strokeWidth="1" />
                  </svg>

                  {/* the control */}
                  <div
                    ref={hitRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="Combination dial"
                    aria-valuemin={0}
                    aria-valuemax={ticks - 1}
                    aria-valuenow={dial}
                    aria-valuetext={"Number " + dial}
                    aria-disabled={phase !== "locked"}
                    aria-keyshortcuts="Enter ArrowLeft ArrowRight Backspace Escape"
                    className="vdr-dial"
                    onPointerDown={onDialDown}
                    onPointerMove={onDialMove}
                    onPointerUp={onDialUp}
                    onPointerCancel={onDialUp}
                    onKeyDown={onDialKey}
                    style={{
                      position: "absolute",
                      left: WHEEL.cx - WHEEL.r,
                      top: WHEEL.cy - WHEEL.r,
                      width: WHEEL.r * 2,
                      height: WHEEL.r * 2,
                      borderRadius: "50%",
                      touchAction: "none",
                      cursor: phase === "locked" ? "grab" : phase === "open" ? "pointer" : "default",
                    }}
                  >
                    <div
                      className="vdr-ring"
                      style={{
                        position: "absolute",
                        inset: -8,
                        borderRadius: "50%",
                        border: "2px solid " + metal.accent,
                        opacity: 0,
                        transition: "opacity .2s",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- words ---------------- */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-4 pb-6 pt-1 text-center sm:pb-8">
        <div className="flex min-h-9 flex-wrap items-center justify-center gap-3">
          <p
            aria-live="polite"
            className="m-0 font-mono text-[11px] uppercase tracking-[0.22em] sm:text-xs"
            style={{ color: phase === "denied" ? "#ff7a6e" : tone.text }}
          >
            {status}
          </p>
          {phase === "open" ? (
            <button
              type="button"
              onClick={lock}
              className="rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors"
              style={{ borderColor: metal.accent, color: metal.accent, background: "transparent" }}
            >
              Lock it
            </button>
          ) : null}
        </div>
        {caption !== null && caption !== undefined ? (
          <p className="m-0 max-w-2xl text-[13px] leading-relaxed sm:text-[15px]" style={{ color: tone.muted }}>
            {caption}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- pieces */

function DoorFace({
  tone,
  id,
  engraving,
  lamp,
  phase,
}: {
  tone: Tone
  id: (s: string) => string
  engraving: string
  lamp: string
  phase: Phase
}) {
  const { cx, cy } = WHEEL
  const lampOn = phase !== "locked" || lamp !== tone.lo
  return (
    <>
      <svg
        aria-hidden
        width={DOOR.w}
        height={DOOR.h}
        viewBox={"0 0 " + DOOR.w + " " + DOOR.h}
        style={{ position: "absolute", inset: 0, display: "block", maxWidth: "none" }}
      >
        <defs>
          <linearGradient id={id("face")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={tone.hi} />
            <stop offset=".42" stopColor={tone.mid} />
            <stop offset="1" stopColor={tone.lo} />
          </linearGradient>
          <radialGradient id={id("rim")} cx=".32" cy=".26" r=".9">
            <stop offset="0" stopColor={tone.hi} />
            <stop offset=".55" stopColor={tone.mid} />
            <stop offset="1" stopColor={tone.lo} />
          </radialGradient>
          <radialGradient id={id("well")} cx=".6" cy=".7" r=".85">
            <stop offset="0" stopColor={tone.mid} />
            <stop offset="1" stopColor={tone.lo} />
          </radialGradient>
          <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .09 0" />
          </filter>
        </defs>
        <rect width={DOOR.w} height={DOOR.h} rx={DOOR.r} fill={"url(#" + id("face") + ")"} />
        <rect width={DOOR.w} height={DOOR.h} rx={DOOR.r} filter={"url(#" + id("grain") + ")"} />
        <rect
          x=".75"
          y=".75"
          width={DOOR.w - 1.5}
          height={DOOR.h - 1.5}
          rx={DOOR.r - 0.75}
          fill="none"
          stroke="rgba(255,255,255,.16)"
          strokeWidth="1.5"
        />
        <rect x="14" y="14" width={DOOR.w - 28} height={DOOR.h - 28} rx={DOOR.r - 10} fill="none" stroke="rgba(0,0,0,.28)" strokeWidth="1.5" />
        <rect x="15.5" y="15.5" width={DOOR.w - 28} height={DOOR.h - 28} rx={DOOR.r - 10} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1" />

        {/* plate */}
        <circle cx={cx} cy={cy + 3} r={WHEEL.r + 4} fill="rgba(0,0,0,.35)" />
        <circle cx={cx} cy={cy} r={WHEEL.r + 2} fill={"url(#" + id("rim") + ")"} />
        <circle cx={cx} cy={cy} r={WHEEL.r - 8} fill={"url(#" + id("well") + ")"} />
        <circle cx={cx} cy={cy} r={WHEEL.r - 8} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="2" />
        <circle cx={cx} cy={cy + 1} r={WHEEL.r - 9} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="1" />

        {/* engraving */}
        <text
          x={cx}
          y={DOOR.h - 26}
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="10"
          letterSpacing="3.2"
          fill="rgba(0,0,0,.45)"
        >
          {engraving}
        </text>
        <text
          x={cx}
          y={DOOR.h - 25}
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="10"
          letterSpacing="3.2"
          fill="rgba(255,255,255,.1)"
        >
          {engraving}
        </text>

        {/* lamp */}
        <circle cx={DOOR.w - 34} cy="34" r="7.5" fill="rgba(0,0,0,.5)" />
        <circle cx={DOOR.w - 34} cy="34" r="5" fill={lamp} opacity={lampOn ? 1 : 0.6} />
        <circle cx={DOOR.w - 35.5} cy="32.5" r="1.6" fill="rgba(255,255,255,.55)" />
      </svg>
      {lampOn ? (
        <div
          aria-hidden
          className={phase === "locked" ? "vdr-pulse" : undefined}
          style={{
            position: "absolute",
            left: DOOR.w - 34 - 16,
            top: 34 - 16,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "radial-gradient(circle, " + lamp + " 0%, transparent 65%)",
            opacity: 0.8,
            pointerEvents: "none",
          }}
        />
      ) : null}
      {/* hinges, on the bezel side */}
      {[0.2, 0.8].map((k) => (
        <div
          key={k}
          aria-hidden
          style={{
            position: "absolute",
            left: -4,
            top: DOOR.h * k - 28,
            width: 12,
            height: 56,
            borderRadius: 6,
            background: "linear-gradient(to right, " + tone.lo + ", " + tone.hi + " 45%, " + tone.lo + ")",
            boxShadow: "0 2px 4px rgba(0,0,0,.45)",
          }}
        />
      ))}
    </>
  )
}

function Wheel({
  tone,
  id,
  ticks,
  every,
  fmt,
}: {
  tone: Tone
  id: (s: string) => string
  ticks: number
  every: number
  fmt: (v: number) => string
}) {
  const step = 360 / ticks
  return (
    <svg width="340" height="340" viewBox="-170 -170 340 340" style={{ display: "block", maxWidth: "none" }}>
      <defs>
        {/* objectBoundingBox, so the cylinder shading rides with each spoke */}
        <linearGradient id={id("rod")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={tone.lo} />
          <stop offset=".38" stopColor={tone.hi} />
          <stop offset=".6" stopColor={tone.mid} />
          <stop offset="1" stopColor={tone.lo} />
        </linearGradient>
        <radialGradient id={id("hub")} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor={tone.hi} />
          <stop offset=".6" stopColor={tone.mid} />
          <stop offset="1" stopColor={tone.lo} />
        </radialGradient>
      </defs>

      {/* number ring */}
      {Array.from({ length: ticks }, (_, i) => {
        const major = i % every === 0
        return (
          <g key={i} transform={"rotate(" + i * step + ")"}>
            <line
              x1="0"
              y1={-(WHEEL.r - 10)}
              x2="0"
              y2={-(WHEEL.r - (major ? 22 : 16))}
              stroke={tone.ink}
              strokeOpacity={major ? 0.85 : 0.45}
              strokeWidth={major ? 1.6 : 1}
            />
            {major ? (
              <text
                y={-(WHEEL.r - 36)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize="11"
                fontWeight="600"
                fill={tone.ink}
                fillOpacity=".9"
              >
                {fmt(i)}
              </text>
            ) : null}
          </g>
        )
      })}

      {/* spokes */}
      {SPOKES.map((a) => (
        <g key={a} transform={"rotate(" + a + ")"}>
          <rect x="-6.5" y="-94" width="13" height="64" rx="6.5" fill={"url(#" + id("rod") + ")"} />
          <rect x="-11.5" y="-124" width="23" height="44" rx="11" fill={"url(#" + id("rod") + ")"} />
          <ellipse cx="0" cy="-121" rx="9" ry="3.6" fill={tone.hi} fillOpacity=".55" />
          <rect x="-11.5" y="-124" width="23" height="44" rx="11" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
        </g>
      ))}

      {/* hub */}
      <circle r="46" fill="rgba(0,0,0,.35)" cy="3" />
      <circle r="44" fill={"url(#" + id("hub") + ")"} />
      <circle r="44" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="1" />
      <ellipse rx="27" ry="31" fill={"url(#" + id("hub") + ")"} stroke="rgba(0,0,0,.4)" strokeWidth="1.2" />
      <ellipse rx="10" ry="13" cx="-6" cy="-9" fill="rgba(255,255,255,.08)" />
    </svg>
  )
}

function Bezel({ tone, id, glow, lit }: { tone: Tone; id: (s: string) => string; glow: string; lit: number }) {
  const o = { x: BEZEL, y: BEZEL, w: OPEN.w, h: OPEN.h, r: 14 }
  const roundRect = (x: number, y: number, w: number, h: number, r: number) =>
    "M" + (x + r) + " " + y + "H" + (x + w - r) + "A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (y + r) +
    "V" + (y + h - r) + "A" + r + " " + r + " 0 0 1 " + (x + w - r) + " " + (y + h) +
    "H" + (x + r) + "A" + r + " " + r + " 0 0 1 " + x + " " + (y + h - r) +
    "V" + (y + r) + "A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y + "Z"
  return (
    <svg
      aria-hidden
      width={BODY.w}
      height={BODY.h}
      viewBox={"0 0 " + BODY.w + " " + BODY.h}
      style={{ ...abs, left: BODY.x, top: BODY.y, maxWidth: "none", overflow: "visible", pointerEvents: "none" }}
    >
      <defs>
        <linearGradient id={id("bezel")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone.hi} />
          <stop offset=".5" stopColor={tone.mid} />
          <stop offset="1" stopColor={tone.lo} />
        </linearGradient>
        <radialGradient id={id("spill")} cx=".63" cy=".55" r=".6">
          <stop offset="0" stopColor={"rgb(" + glow.slice(5, -1) + ")"} stopOpacity=".5" />
          <stop offset="1" stopColor={"rgb(" + glow.slice(5, -1) + ")"} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        fillRule="evenodd"
        d={roundRect(0, 0, BODY.w, BODY.h, BODY.r) + roundRect(o.x, o.y, o.w, o.h, o.r)}
        fill={"url(#" + id("bezel") + ")"}
      />
      <path
        fillRule="evenodd"
        d={roundRect(0, 0, BODY.w, BODY.h, BODY.r) + roundRect(o.x, o.y, o.w, o.h, o.r)}
        fill={"url(#" + id("spill") + ")"}
        style={{ opacity: lit, transition: "opacity 1.6s" }}
      />
      <path d={roundRect(0.75, 0.75, BODY.w - 1.5, BODY.h - 1.5, BODY.r)} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1.5" />
      <path d={roundRect(o.x, o.y, o.w, o.h, o.r)} fill="none" stroke="rgba(0,0,0,.6)" strokeWidth="3" />
      <path d={roundRect(o.x - 1.5, o.y - 1.5, o.w + 3, o.h + 3, o.r + 1)} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
    </svg>
  )
}

function Interior({ tone, glow, lit }: { tone: Tone; glow: string; lit: number }) {
  const { x, y, w, h } = OPEN
  const fade = "opacity 1.8s ease .2s"
  const wall = (style: React.CSSProperties, bg: string, light: string) => (
    <div aria-hidden style={{ ...abs, ...style, background: bg }}>
      <div style={{ position: "absolute", inset: 0, background: light, opacity: lit, transition: fade }} />
    </div>
  )
  return (
    <>
      {/* back */}
      {wall(
        { left: x, top: y, width: w, height: h, transform: "translateZ(" + -DEPTH + "px)" },
        tone.back,
        "radial-gradient(55% 50% at 62% 62%, " + glow + "0.55) 0%, " + glow + "0.12) 55%, transparent 80%)",
      )}
      {/* left */}
      {wall(
        { left: x - DEPTH / 2, top: y, width: DEPTH, height: h, transform: "translateZ(" + -DEPTH / 2 + "px) rotateY(90deg)" },
        "linear-gradient(to right, " + tone.wallNear + ", " + tone.wallFar + ")",
        "radial-gradient(80% 50% at 80% 65%, " + glow + "0.35), transparent 75%)",
      )}
      {/* right */}
      {wall(
        { left: x + w - DEPTH / 2, top: y, width: DEPTH, height: h, transform: "translateZ(" + -DEPTH / 2 + "px) rotateY(-90deg)" },
        "linear-gradient(to left, " + tone.wallNear + ", " + tone.wallFar + ")",
        "radial-gradient(90% 50% at 40% 60%, " + glow + "0.5), transparent 75%)",
      )}
      {/* ceiling */}
      {wall(
        { left: x, top: y - DEPTH / 2, width: w, height: DEPTH, transform: "translateZ(" + -DEPTH / 2 + "px) rotateX(90deg)" },
        "linear-gradient(to top, " + tone.wallNear + ", " + tone.wallFar + ")",
        "radial-gradient(60% 90% at 62% 30%, " + glow + "0.3), transparent 80%)",
      )}
      {/* floor */}
      {wall(
        { left: x, top: y + h - DEPTH / 2, width: w, height: DEPTH, transform: "translateZ(" + -DEPTH / 2 + "px) rotateX(-90deg)" },
        "linear-gradient(to bottom, " + tone.wallNear + ", " + tone.wallFar + ")",
        "radial-gradient(45% 70% at 64% 50%, " + glow + "0.65), transparent 80%)",
      )}
    </>
  )
}

function Readout({
  code,
  entered,
  active,
  dial,
  hint,
  tone,
  accent,
  fmt,
  denied,
}: {
  code: number[]
  entered: number[]
  active: number
  dial: number
  hint: boolean
  tone: Tone
  accent: string
  fmt: (v: number) => string
  denied: boolean
}) {
  return (
    <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 78, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          letterSpacing: "0.45em",
          color: tone.ink,
          opacity: 0.7,
        }}
      >
        COMBINATION
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        {code.map((c, i) => {
          const done = i < entered.length
          const now = i === active
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 64,
                  height: 50,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(0,0,0,.35)",
                  boxShadow: "inset 0 2px 6px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.08)",
                  border: "1px solid " + (now ? accent : "rgba(255,255,255,.06)"),
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 26,
                  fontWeight: 600,
                  color: done || now ? accent : tone.ink,
                  opacity: done ? 1 : now ? 0.75 : 0.25,
                  textShadow: done ? "0 0 12px " + accent : "none",
                  transition: "color .2s, opacity .2s",
                }}
              >
                {done ? fmt(entered[i]) : now ? fmt(dial) : "––"}
              </div>
              {hint ? (
                <div
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    color: denied ? accent : tone.ink,
                    opacity: 0.5,
                  }}
                >
                  {fmt(c)}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
