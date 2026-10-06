"use client"

// A curtain of punched-tape strips that plays music. Idle, the strips hang
// grey and ragged with a play button over them. Press play and they turn
// white, a stage lights up behind them — a moving spotlight and big captions
// you only ever see through the gaps and the punched holes — and every strip
// stretches with its own slice of the spectrum, jolting on each kick. Move
// over the curtain and the strips swing aside around the pointer.
//
// The music is an original groove synthesized live with Web Audio (no file,
// no network), or any audio file you pass as `audioSrc`.
//
// No dependencies, no assets. React is the only import.

import React from "react"

export type PerforatedStripeCurtainProps = {
  /** Must be a definite length — the canvas fills this box. */
  height?: string
  /** Number of strips. */
  strips?: number
  /** Strip colour while playing. */
  stripColor?: string
  /** Strip colour while idle. */
  idleColor?: string
  /** Page colour behind the curtain. */
  background?: string
  /** Spotlight colour on the stage behind the strips. */
  lightColor?: string
  /** Words shown on the stage behind the strips, one per bar while playing. */
  captions?: string[]
  /** Small label, bottom-left. Empty hides it. */
  title?: string
  /** Small line, bottom-right. Empty hides it. */
  credit?: string
  /** An audio file to react to instead of the built-in groove (same-origin or CORS-enabled). */
  audioSrc?: string
  /** Tempo of the built-in groove. */
  bpm?: number
  /** 0–1. */
  volume?: number
  /** Strips swing aside around the pointer. */
  interactive?: boolean
  onPlayChange?: (playing: boolean) => void
  maxDpr?: number
  className?: string
}

/* ------------------------------------------------------------------ logic */

// #region logic
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// resting length of each strip, 0–1 of the height: long and ragged, never even
function restLengths(n: number, seed = 7): number[] {
  const r = mulberry32(seed)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const wave = 0.5 + 0.5 * Math.sin(i * 0.9 + 1.3)
    out.push(clamp(0.8 + 0.07 * wave + (r() < 0.3 ? 0.06 : 0) * r(), 0.72, 0.95))
  }
  return out
}

// strip i of n → the [lo, hi) spectrum bins it listens to, spread on a log scale
// so the bass doesn't own the whole curtain
function bandOf(i: number, n: number, bins: number): [number, number] {
  const lo = Math.floor(Math.pow(bins, i / n)) - 1
  const hi = Math.max(lo + 1, Math.floor(Math.pow(bins, (i + 1) / n)) - 1)
  return [clamp(lo, 0, bins - 1), clamp(hi, 1, bins)]
}

// how far a strip swings away from the pointer, in radians (signed)
function swingFor(stripX: number, pointerX: number, pointerY: number, height: number, reach: number): number {
  if (!(pointerY >= 0) || pointerY > height * 1.05) return 0
  const dx = stripX - pointerX
  const d = Math.abs(dx)
  if (d >= reach) return 0
  const fall = 1 - d / reach
  // strips are hinged at the top: a pointer low on the curtain moves them most
  const depth = clamp(pointerY / height, 0.15, 1)
  return Math.sign(dx || 1) * 0.22 * fall * fall * depth
}

// 16-step patterns for the built-in groove (an original riff)
const KICK = [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0]
const SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1]
const HAT = [0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0]
// semitones from A1, -1 = rest; two bars
const BASS = [0, -1, 0, 3, -1, 5, 7, -1, 5, -1, 3, 0, -1, 10, 7, 5, 0, -1, 0, 3, -1, 5, 7, -1, 8, 7, 5, -1, 3, -1, 2, 3]
function noteHz(semi: number): number {
  return 55 * Math.pow(2, semi / 12)
}
// #endregion logic

/* -------------------------------------------------------------- component */

export default function PerforatedStripeCurtain({
  height = "100svh",
  strips = 22,
  stripColor = "#f4f3ef",
  idleColor = "#8d8d8b",
  background = "#0b0b0c",
  lightColor = "#d21f1f",
  captions = ["SEVEN", "STRIPES", "LOUDER", "AGAIN"],
  title = "WHITE STRIPES · LIVE",
  credit = "Press play — the curtain listens.",
  audioSrc,
  bpm = 124,
  volume = 0.7,
  interactive = true,
  onPlayChange,
  maxDpr = 2,
  className = "",
}: PerforatedStripeCurtainProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const [playing, setPlaying] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener?.("change", on)
    return () => mq.removeEventListener?.("change", on)
  }, [])

  const n = clamp(Math.round(strips), 4, 64)
  const st = React.useRef({
    n,
    len: [] as number[],
    vel: [] as number[],
    ang: [] as number[],
    angVel: [] as number[],
    rest: [] as number[],
    px: -1,
    py: -1,
    on: 0,
    beat: 0,
    bar: 0,
    level: 0,
    visible: true,
    playing: false,
    reduced: false,
    colors: { stripColor, idleColor, background, lightColor },
    captions,
    analyser: null as AnalyserNode | null,
    freq: null as Uint8Array | null,
  })
  const s0 = st.current
  s0.colors = { stripColor, idleColor, background, lightColor }
  s0.captions = captions.length ? captions : [""]
  s0.playing = playing
  s0.reduced = reduced
  if (s0.n !== n || s0.rest.length !== n) {
    s0.n = n
    s0.rest = restLengths(n)
    s0.len = s0.rest.slice()
    s0.vel = new Array(n).fill(0)
    s0.ang = new Array(n).fill(0)
    s0.angVel = new Array(n).fill(0)
  }

  const interactiveRef = React.useRef(interactive)
  interactiveRef.current = interactive

  /* ------------------------------------------------------------- audio */
  const audio = React.useRef({
    ctx: null as AudioContext | null,
    master: null as GainNode | null,
    el: null as HTMLAudioElement | null,
    timer: 0,
    step: 0,
    nextAt: 0,
  })

  const stopAudio = React.useCallback(() => {
    const a = audio.current
    window.clearInterval(a.timer)
    a.timer = 0
    a.el?.pause()
    a.ctx?.suspend().catch(() => {})
  }, [])

  const startAudio = React.useCallback(async () => {
    const a = audio.current
    const s = st.current
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext | undefined
    if (!AC) return
    if (!a.ctx) {
      a.ctx = new AC()
      a.master = a.ctx.createGain()
      const analyser = a.ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.72
      a.master.connect(analyser)
      analyser.connect(a.ctx.destination)
      s.analyser = analyser
      s.freq = new Uint8Array(analyser.frequencyBinCount)
    }
    const ctx = a.ctx
    const master = a.master as GainNode
    master.gain.value = clamp(volume, 0, 1)
    await ctx.resume().catch(() => {})

    if (audioSrc) {
      if (!a.el) {
        const el = new Audio()
        el.crossOrigin = "anonymous"
        el.loop = true
        el.src = audioSrc
        ctx.createMediaElementSource(el).connect(master)
        a.el = el
      }
      await a.el.play().catch(() => {})
      return
    }

    /* the built-in groove: a lookahead scheduler, 16th notes */
    const sixteenth = 60 / clamp(bpm, 60, 200) / 4
    a.nextAt = ctx.currentTime + 0.06
    const noise = (() => {
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
      const d = b.getChannelData(0)
      const r = mulberry32(3)
      for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1
      return b
    })()
    const kick = (t: number) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.setValueAtTime(150, t)
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12)
      g.gain.setValueAtTime(0.95, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
      o.connect(g).connect(master)
      o.start(t)
      o.stop(t + 0.34)
    }
    const hit = (t: number, dur: number, gain: number, type: "highpass" | "bandpass", f: number) => {
      const src = ctx.createBufferSource()
      src.buffer = noise
      const filt = ctx.createBiquadFilter()
      filt.type = type
      filt.frequency.value = f
      const g = ctx.createGain()
      g.gain.setValueAtTime(gain, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + dur)
      src.connect(filt).connect(g).connect(master)
      src.start(t)
      src.stop(t + dur + 0.02)
    }
    const bass = (t: number, semi: number, dur: number) => {
      const o = ctx.createOscillator()
      const o2 = ctx.createOscillator()
      const filt = ctx.createBiquadFilter()
      const g = ctx.createGain()
      o.type = "sawtooth"
      o2.type = "square"
      o.frequency.value = noteHz(semi)
      o2.frequency.value = noteHz(semi) / 2
      filt.type = "lowpass"
      filt.frequency.setValueAtTime(900, t)
      filt.frequency.exponentialRampToValueAtTime(180, t + dur)
      filt.Q.value = 6
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.32, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.001, t + dur)
      o.connect(filt)
      o2.connect(filt)
      filt.connect(g).connect(master)
      o.start(t)
      o2.start(t)
      o.stop(t + dur + 0.02)
      o2.stop(t + dur + 0.02)
    }
    const tick = () => {
      while (a.nextAt < ctx.currentTime + 0.12) {
        const i = a.step % 16
        const t = a.nextAt
        if (KICK[i]) {
          kick(t)
          window.setTimeout(() => (st.current.beat = 1), Math.max(0, (t - ctx.currentTime) * 1000))
        }
        if (SNARE[i]) hit(t, 0.18, 0.5, "bandpass", 1800)
        if (HAT[i]) hit(t, 0.05, 0.22, "highpass", 7000)
        const b = BASS[a.step % BASS.length]
        if (b >= 0) bass(t, b, sixteenth * 1.7)
        if (i === 0) window.setTimeout(() => (st.current.bar += 1), Math.max(0, (t - ctx.currentTime) * 1000))
        a.step += 1
        a.nextAt += sixteenth
      }
    }
    tick()
    a.timer = window.setInterval(tick, 25)
  }, [audioSrc, bpm, volume])

  const toggle = () => {
    const next = !playing
    if (next) startAudio()
    else stopAudio()
    setPlaying(next)
    onPlayChange?.(next)
  }

  React.useEffect(() => {
    if (audio.current.master) audio.current.master.gain.value = clamp(volume, 0, 1)
  }, [volume])

  React.useEffect(() => {
    const a = audio.current
    return () => {
      window.clearInterval(a.timer)
      a.el?.pause()
      a.ctx?.close().catch(() => {})
    }
  }, [])

  /* ------------------------------------------------------------- render */
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const s = st.current
    let W = 0
    let H = 0
    let dpr = 1
    const resize = () => {
      dpr = clamp(window.devicePixelRatio || 1, 1, Math.max(1, maxDpr))
      W = Math.max(1, Math.round(canvas.clientWidth * dpr))
      H = Math.max(1, Math.round(canvas.clientHeight * dpr))
      canvas.width = W
      canvas.height = H
    }
    resize()
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null
    ro?.observe(canvas)
    const io =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver((es) => {
            s.visible = es.some((e) => e.isIntersecting)
          })
        : null
    io?.observe(canvas)

    let raf = 0
    let last = 0
    let t = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
      last = now
      if (!s.visible) return
      t += dt
      const N = s.n
      const { stripColor: sc, idleColor: ic, background: bg, lightColor: lc } = s.colors

      // 0 → 1 as playback fades in, back to 0 when it stops
      s.on += ((s.playing ? 1 : 0) - s.on) * Math.min(1, dt * 3)
      s.beat = Math.max(0, s.beat - dt * 4.5)

      // spectrum → per-strip energy
      let level = 0
      if (s.analyser && s.freq && s.on > 0.01) {
        s.analyser.getByteFrequencyData(s.freq as never)
        for (let i = 0; i < s.freq.length; i++) level += s.freq[i]
        level /= s.freq.length * 255
      }
      s.level += (level - s.level) * Math.min(1, dt * 8)

      // background + the stage behind the strips
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      if (s.on > 0.01) {
        const sx = W * (0.5 + 0.32 * Math.sin(t * 0.7))
        const sy = H * (0.45 + 0.1 * Math.cos(t * 0.9))
        const rad = Math.max(W, H) * (0.55 + 0.25 * s.level + 0.1 * s.beat)
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad)
        g.addColorStop(0, lc)
        g.addColorStop(0.45, lc + "66")
        g.addColorStop(1, bg)
        ctx.globalAlpha = s.on * (0.75 + 0.25 * s.beat)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
        // the caption for this bar, huge, seen only through the gaps
        const word = s.captions[s.bar % s.captions.length] ?? ""
        if (word) {
          ctx.globalAlpha = s.on * 0.9
          ctx.fillStyle = "#ffffff"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          const fs = Math.min(W / Math.max(3, word.length) * 1.45, H * 0.42)
          ctx.font = "900 " + Math.round(fs * (1 + 0.04 * s.beat)) + "px Impact, 'Arial Black', ui-sans-serif, system-ui, sans-serif"
          ctx.fillText(word, W / 2, H * 0.5)
        }
        ctx.globalAlpha = 1
      }

      // layout
      const gap = Math.max(3 * dpr, W * 0.009)
      const sw = (W - gap * (N + 1)) / N
      const holeR = sw * 0.2
      const pitch = sw * 1.12
      const reach = W * 0.16
      const px = s.px * dpr
      const py = s.py * dpr
      ctx.fillStyle = mixHex(ic, sc, s.on)

      for (let i = 0; i < N; i++) {
        const x = gap + i * (sw + gap)
        const cx = x + sw / 2

        // target length: rest, plus this strip's band, plus a jolt on the kick
        let e = 0
        if (s.freq && s.on > 0.01) {
          const [lo, hi] = bandOf(i, N, s.freq.length)
          let sum = 0
          for (let k = lo; k < hi; k++) sum += s.freq[k]
          e = sum / ((hi - lo) * 255)
        }
        const target = s.reduced
          ? s.rest[i]
          : s.rest[i] + s.on * (e * 0.22 - 0.1 + 0.05 * s.beat) + (1 - s.on) * 0.012 * Math.sin(t * 1.3 + i)
        // spring
        const k = 90
        const c = 11
        s.vel[i] += (k * (target - s.len[i]) - c * s.vel[i]) * dt
        s.len[i] = clamp(s.len[i] + s.vel[i] * dt, 0.3, 1.08)

        // swing away from the pointer, hinged at the top
        const swing = interactiveRef.current && !s.reduced ? swingFor(cx, px, py, H, reach) : 0
        s.angVel[i] += (60 * (swing - s.ang[i]) - 7 * s.angVel[i]) * dt
        s.ang[i] += s.angVel[i] * dt

        const L = s.len[i] * H
        ctx.save()
        ctx.translate(cx, 0)
        ctx.rotate(s.ang[i])
        // the strip with its holes punched out (even-odd: holes show what's behind)
        ctx.beginPath()
        ctx.rect(-sw / 2, -2, sw, L + 2)
        for (let y = pitch * 0.75; y < L - holeR * 1.4; y += pitch) {
          ctx.moveTo(holeR, y)
          ctx.arc(0, y, holeR, 0, Math.PI * 2)
        }
        ctx.fill("evenodd")
        ctx.restore()
      }
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      io?.disconnect()
    }
  }, [maxDpr])

  const onMove = (e: PointerDivEv) => {
    const r = e.currentTarget.getBoundingClientRect()
    st.current.px = e.clientX - r.left
    st.current.py = e.clientY - r.top
  }
  const onLeave = () => {
    st.current.px = -1
    st.current.py = -1
  }

  return (
    <div
      ref={rootRef}
      className={"psc-root relative w-full overflow-hidden " + className}
      style={{ height, background, color: stripColor }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <style>{PSC_CSS}</style>
      <canvas ref={canvasRef} className="psc-canvas" aria-hidden="true" />
      <button
        type="button"
        className={"psc-play" + (playing ? " psc-playing" : "")}
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Pause the music" : "Play the music"}
      >
        <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="3.5" />
          {playing ? (
            <path d="M25 21v22M39 21v22" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          ) : (
            <path d="M26 20.5v23l19-11.5z" fill="currentColor" />
          )}
        </svg>
      </button>
      {(title || credit) && (
        <div className="psc-foot" aria-hidden={!title && !credit}>
          <span>{title}</span>
          <span>{credit}</span>
        </div>
      )}
    </div>
  )
}

function mixHex(a: string, b: string, t: number): string {
  const p = (h: string) => {
    let x = h.replace("#", "")
    if (x.length === 3) x = x.split("").map((c) => c + c).join("")
    const v = /^[0-9a-f]{6}$/i.test(x) ? parseInt(x, 16) : 0
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
  }
  const A = p(a)
  const B = p(b)
  const k = clamp(t, 0, 1)
  return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",") + ")"
}

const PSC_CSS = `
.psc-root{isolation:isolate;touch-action:pan-y;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.psc-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;max-width:none}
.psc-play{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);display:grid;place-items:center;width:clamp(72px,11vmin,120px);height:clamp(72px,11vmin,120px);padding:0;border:0;border-radius:999px;background:transparent;color:#1d1d1d;cursor:pointer;transition:opacity .35s ease,transform .35s cubic-bezier(.2,.8,.2,1),color .35s ease;z-index:2}
.psc-play svg{width:100%;height:100%;display:block;max-width:none;filter:drop-shadow(0 6px 18px rgba(0,0,0,.35))}
.psc-play:hover{transform:translate(-50%,-50%) scale(1.06)}
.psc-play:focus-visible{outline:2px solid currentColor;outline-offset:6px}
.psc-playing{opacity:0;color:#111}
.psc-root:hover .psc-playing,.psc-playing:focus-visible{opacity:.85}
.psc-foot{position:absolute;left:clamp(12px,2.4vw,28px);right:clamp(12px,2.4vw,28px);bottom:clamp(10px,2vh,22px);display:flex;justify-content:space-between;gap:16px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:inherit;opacity:.75;pointer-events:none;z-index:2;mix-blend-mode:difference}
@media (prefers-reduced-motion:reduce){.psc-play{transition:none}}
`

// event alias lives after the JSX so the 21st CLI tokenizer stays linear
type PointerDivEv = React.PointerEvent<HTMLDivElement>
