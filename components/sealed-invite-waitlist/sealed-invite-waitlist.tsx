"use client"

import * as React from "react"

/**
 * Sealed Invite Waitlist — a waitlist form that posts an envelope.
 *
 * An envelope rests half-way into a dark glass mail slot over a grid that
 * sinks into a gravity well. It leans in while you type and sits up straight
 * once the address is real. Send it and it drops into the slot; when the
 * request comes back it rises out again, the flap opens, and an invitation
 * card slides up with the tagline set underneath.
 *
 * Two stocks of the same envelope: `steel` is brushed metal with an engraved
 * seal, `onyx` is black paper with a rim light catching one corner.
 *
 * Nothing is loaded. The envelope is CSS and inline SVG, the paper grain is an
 * SVG noise filter, the grid is a canvas, and the mark is drawn in the file —
 * so it looks the same everywhere and needs no font, image or network.
 */

export type SealedInviteVariant = "steel" | "onyx"

export type SealedInviteWaitlistProps = {
  variant?: SealedInviteVariant
  placeholder?: string
  buttonLabel?: string
  /** Shown on the button while `onSubmit` is pending. */
  pendingLabel?: string
  /** Printed on the card. */
  invitedTitle?: string
  /** Set under the envelope once it opens. */
  tagline?: string
  /** The link that puts the form back. Empty string hides it. */
  resetLabel?: string
  /** Shown when the address doesn't parse. */
  invalidMessage?: string
  /** The mark on the seal and the card. Defaults to a drawn monogram. */
  mark?: React.ReactNode
  /** The haze behind the slot and the rim light. Any CSS colour. */
  glow?: string
  /** The warped grid behind everything. */
  grid?: boolean
  /** Resting angle of the envelope in the slot, in degrees. */
  lean?: number
  /** Largest pointer tilt in degrees. 0 holds it flat. */
  tilt?: number
  /** Digits in the printed place number. */
  digits?: number
  /** Height of the scene. A definite length, never a percentage. */
  height?: string
  /** Start already opened, e.g. to show the invitation. */
  initialState?: "idle" | "invited"
  initialEmail?: string
  /**
   * Called with the trimmed address. Return (or resolve) a number to print it
   * as the place in line; throw to show the error's message and stay open.
   */
  onSubmit?: (email: string) => void | number | Promise<void | number>
  onReset?: () => void
  className?: string
}

type Phase = "idle" | "sending" | "rising" | "opening" | "open"

// #region invite
export const clamp01 = (v: number) => (v > 0 ? (v < 1 ? v : 1) : 0)

/** Loose on purpose: one @, something either side, a dot and a 2+ letter tail. */
export const isEmail = (s: string) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(String(s).trim())

/** "kedhar@mail.com" -> "ke•••@mail.com". The card is on screen; the inbox isn't. */
export const maskEmail = (s: string) => {
  const t = String(s).trim()
  const at = t.lastIndexOf("@")
  if (at < 1) return t
  const keep = at <= 2 ? 1 : 2
  return t.slice(0, keep) + "•••" + t.slice(at)
}

/** 427 -> "Nº 0427". Nothing for a place that isn't one. */
export const serial = (n: number, digits: number) => {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return ""
  const s = String(Math.floor(n))
  const d = Math.max(1, Math.min(12, Math.floor(digits) || 1))
  return "Nº " + (s.length >= d ? s : "0".repeat(d - s.length) + s)
}

/** "#c9a46a" at 0.3 -> "rgba(201,164,106,0.3)"; anything else goes through color-mix. */
export const withAlpha = (color: string, a: number) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color).trim())
  const k = Math.round(clamp01(a) * 1000) / 1000
  if (!m) return "color-mix(in srgb, " + color + " " + Math.round(k * 100) + "%, transparent)"
  const h = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1]
  const n = parseInt(h, 16)
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + k + ")"
}

/**
 * Height of the well at distance `r` from its centre: flat far out, falling
 * to `-depth` at the throat. A Lorentzian, so it never pinches to a point.
 */
export const wellDepth = (r: number, depth: number, throat: number) =>
  throat > 0 ? (-depth * throat * throat) / (r * r + throat * throat) : 0

/**
 * Perspective projection of a point on the grid. The plane is (x, z) with y up;
 * the camera sits `dist` away looking down at `pitch` radians. Returns screen
 * offsets from the centre and the depth, or null behind the near plane.
 */
export const project = (x: number, y: number, z: number, pitch: number, dist: number, focal: number) => {
  const c = Math.cos(pitch)
  const s = Math.sin(pitch)
  const up = y * c + z * s
  const depth = -y * s + z * c + dist
  if (!(depth > 0.25)) return null
  return [(focal * x) / depth, (-focal * up) / depth, depth]
}

/** Milliseconds of each step after the request returns: rise, open. */
export const timeline = (reduced: boolean) => (reduced ? [0, 0] : [720, 560])
// #endregion

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => setReduced(mq.matches)
    onMq()
    mq.addEventListener("change", onMq)
    return () => mq.removeEventListener("change", onMq)
  }, [])
  return reduced
}

/** A rounded zero with a pin through it. Takes currentColor. */
function Monogram({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden style={{ display: "block", maxWidth: "none" }}>
      <rect x="6.6" y="2.6" width="10.8" height="18.8" rx="5.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="11" y="8.6" width="2" height="6.8" rx="1" fill="currentColor" />
    </svg>
  )
}

const CSS =
  ".siw{--ew:min(84cqw,400px,calc(58cqh - 56px));--bar-y:64%;isolation:isolate}" +
  ".siw-grid,.siw-noise{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block}" +
  ".siw-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 58%,transparent 35%,rgba(0,0,0,.82) 100%)}" +
  ".siw-glow{position:absolute;left:50%;top:var(--bar-y);width:min(150cqw,72rem);height:min(70cqh,30rem);transform:translate(-50%,-64%);pointer-events:none;background:radial-gradient(closest-side,var(--glow-a) 0%,var(--glow-b) 45%,transparent 100%);opacity:.85;transition:opacity 1.2s ease,transform 1.2s cubic-bezier(.16,1,.3,1)}" +
  ".siw[data-phase=open] .siw-glow{opacity:1;transform:translate(-50%,-70%) scale(1.12)}" +
  ".siw-stage{position:absolute;left:50%;top:var(--bar-y);width:min(calc(100% - 2rem),30rem);height:3.5rem;transform:translate(-50%,-50%);z-index:3}" +
  ".siw-slot{position:absolute;left:0;right:0;bottom:50%;height:0;clip-path:inset(-4000px -4000px 0 -4000px);z-index:0}" +
  ".siw-env{position:absolute;left:50%;bottom:0;width:var(--ew);aspect-ratio:100/64;transform:translate(-50%,36%) rotate(var(--lean));transition:transform .8s cubic-bezier(.2,.8,.2,1);filter:drop-shadow(0 26px 26px rgba(0,0,0,.6))}" +
  ".siw[data-focus] .siw-env{transform:translate(-50%,27%) rotate(calc(var(--lean) * .6))}" +
  ".siw[data-valid] .siw-env{transform:translate(-50%,19%) rotate(calc(var(--lean) * .35))}" +
  ".siw[data-phase=sending] .siw-env{transform:translate(-50%,118%) rotate(0deg);transition:transform .7s cubic-bezier(.55,0,.75,.3)}" +
  ".siw[data-phase=rising] .siw-env,.siw[data-phase=opening] .siw-env,.siw[data-phase=open] .siw-env{transform:translate(-50%,-2.5rem) rotate(0deg);transition:transform .75s cubic-bezier(.16,1,.3,1)}" +
  ".siw-tilt{position:absolute;inset:0;transform:perspective(1100px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .3s ease-out}" +
  ".siw-float{position:absolute;inset:0;animation:siw-float 6s ease-in-out infinite}" +
  ".siw[data-phase=sending] .siw-float{animation-play-state:paused}" +
  "@keyframes siw-float{0%,100%{translate:0 0}50%{translate:0 -5px}}" +
  ".siw-box{position:absolute;inset:0;perspective:1400px}" +
  ".siw-layer{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;overflow:visible}" +
  ".siw-back{border-radius:1.4%/2.2%;z-index:1}" +
  ".siw-flap{position:absolute;left:0;top:0;width:100%;height:68.75%;transform-origin:50% 0;transform-style:preserve-3d;transform:rotateX(0deg);transition:transform .6s cubic-bezier(.45,0,.2,1);z-index:4}" +
  ".siw[data-phase=opening] .siw-flap,.siw[data-phase=open] .siw-flap{transform:rotateX(-180deg)}" +
  ".siw[data-phase=open] .siw-flap{z-index:1}" +
  ".siw-face{backface-visibility:hidden;-webkit-backface-visibility:hidden}" +
  ".siw-face-in{transform:rotateX(180deg)}" +
  ".siw-card{position:absolute;left:5%;width:90%;top:6%;height:86%;z-index:2;container-type:inline-size;border-radius:1.2%/1.6%;overflow:hidden;transform:translateY(0);transition:transform .9s cubic-bezier(.16,1,.3,1);box-shadow:0 -6px 18px rgba(0,0,0,.35)}" +
  ".siw[data-phase=open] .siw-card{transform:translateY(-34%)}" +
  ".siw-pocket{z-index:3}" +
  ".siw-seal{position:absolute;right:6.5%;top:9%;width:19%;aspect-ratio:1;border-radius:50%;z-index:5;display:grid;place-items:center;transition:transform .35s cubic-bezier(.3,1.6,.5,1),box-shadow .5s ease}" +
  ".siw[data-phase=sending] .siw-seal{transform:scale(.9)}" +
  ".siw[data-phase=open] .siw-seal{transform:translate(14%,128%) rotate(-14deg) scale(.8);transition:transform .9s cubic-bezier(.16,1,.3,1) .15s}" +
  ".siw-sheen{position:absolute;inset:0;z-index:6;pointer-events:none;border-radius:1.4%/2.2%;background:radial-gradient(60% 75% at var(--lx,30%) var(--ly,20%),rgba(255,255,255,.55),rgba(255,255,255,0) 70%);mix-blend-mode:soft-light;transition:opacity .4s}" +
  ".siw-rim{position:absolute;right:-9%;top:-16%;width:46%;aspect-ratio:1;z-index:7;pointer-events:none;border-radius:50%;background:radial-gradient(closest-side,rgba(255,252,244,.95),var(--glow-a) 35%,transparent 72%);mix-blend-mode:screen;opacity:.25;transition:opacity 1s ease .2s,transform 1.4s cubic-bezier(.16,1,.3,1)}" +
  ".siw[data-variant=onyx] .siw-rim{opacity:.55}" +
  ".siw[data-phase=open] .siw-rim{opacity:.6;transform:translate(-2%,-30%) scale(1.15)}" +
  ".siw[data-variant=onyx][data-phase=open] .siw-rim{opacity:1}" +
  ".siw-edge{position:absolute;right:0;top:0;width:1px;height:58%;z-index:7;pointer-events:none;background:linear-gradient(var(--glow-c),transparent)}" +
  ".siw-bar{position:absolute;inset:0;z-index:2;display:flex;align-items:center;border-radius:6px;background:linear-gradient(180deg,rgba(34,34,36,.86),rgba(14,14,16,.94));border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -1px 0 rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.55),0 24px 48px -12px rgba(0,0,0,.85);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);transition:opacity .45s ease,transform .55s cubic-bezier(.16,1,.3,1),border-color .3s,visibility 0s linear 0s}" +
  ".siw-bar:focus-within{border-color:var(--glow-c)}" +
  ".siw[data-phase=rising] .siw-bar,.siw[data-phase=opening] .siw-bar,.siw[data-phase=open] .siw-bar{opacity:0;transform:translateY(18px) scale(.97);visibility:hidden;transition:opacity .45s ease,transform .55s cubic-bezier(.16,1,.3,1),visibility 0s linear .55s}" +
  ".siw-input{flex:1 1 auto;min-width:0;height:100%;background:transparent;border:0;outline:0;padding:0 0 0 1.4rem;color:#dcdcdc;font-size:15px;letter-spacing:.02em;caret-color:var(--glow)}" +
  ".siw-input::placeholder{color:#8b8b8b;opacity:1}" +
  ".siw-input:-webkit-autofill{-webkit-text-fill-color:#dcdcdc;-webkit-box-shadow:0 0 0 40px #18181a inset;transition:background-color 9999s}" +
  ".siw-btn{flex:none;height:100%;padding:0 1.4rem;background:transparent;border:0;color:#9a917f;font-size:15px;letter-spacing:.02em;cursor:pointer;white-space:nowrap;border-radius:0 6px 6px 0;transition:color .3s,text-shadow .3s}" +
  ".siw[data-valid] .siw-btn,.siw-btn:hover{color:#e9dfc9;text-shadow:0 0 18px var(--glow-a)}" +
  ".siw-btn:focus-visible{outline:1px solid var(--glow-c);outline-offset:-6px}" +
  ".siw-btn:disabled{cursor:progress}" +
  ".siw-dots::after{content:'';display:inline-block;width:1.4em;text-align:left;animation:siw-dots 1.2s steps(4) infinite}" +
  "@keyframes siw-dots{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}}" +
  ".siw-error{position:absolute;left:0;right:0;top:calc(100% + .8rem);margin:0;text-align:center;font-size:12px;letter-spacing:.04em;color:#e3a99c;min-height:1em}" +
  ".siw-after{position:absolute;left:50%;top:calc(var(--bar-y) - .9rem);width:min(calc(100% - 2rem),40rem);transform:translate(-50%,12px);opacity:0;visibility:hidden;text-align:center;z-index:4;transition:opacity .5s ease,transform .7s cubic-bezier(.16,1,.3,1),visibility 0s linear .7s}" +
  ".siw[data-phase=open] .siw-after{opacity:1;transform:translate(-50%,0);visibility:visible;transition:opacity .8s ease .45s,transform 1s cubic-bezier(.16,1,.3,1) .45s,visibility 0s}" +
  ".siw-tagline{margin:0;font-weight:600;letter-spacing:-.025em;line-height:1.05;font-size:clamp(1.35rem,4.6cqw,2.5rem);background:linear-gradient(180deg,#ffffff 0%,#e4e4e4 38%,#8f8f8f 62%,#d6d6d6 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(0,0,0,.65)) drop-shadow(0 10px 24px rgba(0,0,0,.6))}" +
  ".siw-meta{margin:.85rem 0 0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#7d7a74}" +
  ".siw-reset{margin-top:1.1rem;background:transparent;border:0;padding:.25rem .5rem;color:#a39a88;font-size:12px;letter-spacing:.06em;cursor:pointer;text-decoration:underline;text-decoration-color:rgba(163,154,136,.35);text-underline-offset:4px;transition:color .25s}" +
  ".siw-reset:hover{color:#efe5cf}" +
  ".siw-reset:focus-visible{outline:1px solid var(--glow-c);outline-offset:3px;border-radius:3px}" +
  ".siw-title{margin:0;font-weight:500;letter-spacing:-.03em;font-size:6.6cqw;line-height:1.1;color:#2b2b2b;text-shadow:0 1px 0 rgba(255,255,255,.85),0 -1px 0 rgba(0,0,0,.18)}" +
  ".siw-card-meta{margin:3.2cqw 0 0;font-size:2.3cqw;letter-spacing:.2em;text-transform:uppercase;color:#8c8a84}" +
  "@media (prefers-reduced-motion: reduce){.siw *{transition-duration:0s !important;transition-delay:0s !important;animation:none !important}}"

/** The flap reaches just past where the side flaps meet, so nothing shows through when it is shut. */
const FLAP = "M0 0 L46.5 40.5 Q50 43.5 53.5 40.5 L100 0 Z"
/** The same shape, upside down: it is drawn on the back face, which turns over with the flap. */
const FLAP_IN = "M0 44 L46.5 3.5 Q50 0.5 53.5 3.5 L100 44 Z"

type Look = {
  back: string
  pocket: [string, string][]
  flapOut: [string, string]
  flapIn: [string, string]
  crease: string
  shade: string
  seal: React.CSSProperties
  sealInk: string
  grain: number
}

const LOOKS: Record<SealedInviteVariant, Look> = {
  steel: {
    back: "linear-gradient(160deg,#5d5d61,#3b3b3f)",
    // left, right, bottom
    pocket: [
      ["#e1e1e3", "#a9a9ad"],
      ["#9c9ca0", "#cfcfd2"],
      ["#c6c6c9", "#8e8e92"],
    ],
    flapOut: ["#ececee", "#a2a2a6"],
    flapIn: ["#828286", "#5a5a5e"],
    crease: "rgba(255,255,255,.7)",
    shade: "rgba(0,0,0,.28)",
    seal: {
      background: "radial-gradient(circle at 34% 28%,#4a4a4d,#141415 62%,#050505)",
      boxShadow:
        "0 0 0 1.5px rgba(255,255,255,.55),0 0 0 3px rgba(0,0,0,.65),inset 0 0 0 2px rgba(0,0,0,.8),inset 0 0 0 3.5px rgba(255,255,255,.18),0 8px 16px rgba(0,0,0,.45)",
    },
    sealInk: "#f1f1f1",
    grain: 0.08,
  },
  onyx: {
    back: "linear-gradient(160deg,#0b0b0b,#050505)",
    pocket: [
      ["#1d1d1d", "#121212"],
      ["#101010", "#1b1b1b"],
      ["#202020", "#0f0f0f"],
    ],
    flapOut: ["#222222", "#141414"],
    flapIn: ["#1f1f1f", "#0c0c0c"],
    crease: "rgba(255,255,255,.07)",
    shade: "rgba(0,0,0,.55)",
    seal: {
      background: "radial-gradient(circle at 34% 28%,#2c2c2c,#0d0d0d 60%,#030303)",
      boxShadow:
        "0 0 0 1px rgba(255,255,255,.14),inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 3px rgba(0,0,0,.6),0 6px 14px rgba(0,0,0,.6)",
    },
    sealInk: "#bdbdbd",
    grain: 0.22,
  },
}

export default function SealedInviteWaitlist({
  variant = "steel",
  placeholder = "Enter your email",
  buttonLabel = "Join waitlist",
  pendingLabel = "Sealing",
  invitedTitle = "You have been invited.",
  tagline = "To a network of freedom",
  resetLabel = "Use another email",
  invalidMessage = "That address won't reach anyone.",
  mark,
  glow = "#c9a46a",
  grid = true,
  lean = -7,
  tilt = 8,
  digits = 4,
  height = "100svh",
  initialState = "idle",
  initialEmail = "",
  onSubmit,
  onReset,
  className = "",
}: SealedInviteWaitlistProps) {
  const look = LOOKS[variant] || LOOKS.steel
  const reduced = useReducedMotion()
  const rawId = React.useId()
  const uid = "siw" + rawId.replace(/[^a-zA-Z0-9_-]/g, "")

  const [phase, setPhase] = React.useState<Phase>(initialState === "invited" ? "open" : "idle")
  const [email, setEmail] = React.useState(initialEmail)
  const [sentTo, setSentTo] = React.useState(initialState === "invited" ? initialEmail : "")
  const [place, setPlace] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [focused, setFocused] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const barRef = React.useRef<HTMLFormElement>(null)
  const boxRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const pointer = React.useRef({ tx: 0, ty: 0, x: 0, y: 0 })
  const pulse = React.useRef(0)
  const timers = React.useRef<number[]>([])
  const alive = React.useRef(true)

  const valid = isEmail(email)
  const busy = phase !== "idle"

  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      timers.current.forEach((t) => clearTimeout(t))
      timers.current = []
    }
  }, [])

  React.useEffect(() => {
    if (phase === "open") pulse.current = 1
  }, [phase])

  // ---- the well ---------------------------------------------------------------
  React.useEffect(() => {
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!grid || !canvas || !root) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const BUCKETS = 7
    const SPACING = 0.62
    const LINES = 36
    const SAMPLES = 96
    const HALF = (LINES * SPACING) / 2
    const PITCH = 1.12
    const DIST = 7.4
    const THROAT = 1.55
    const DEPTH = 5.4

    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let running = false
    let last = 0
    let clock = 0

    const draw = (dt: number) => {
      const p = pointer.current
      const k = reduced ? 1 : 1 - Math.pow(0.001, dt)
      p.x += (p.tx - p.x) * k
      p.y += (p.ty - p.y) * k
      pulse.current = Math.max(0, pulse.current - dt * 0.45)
      clock += reduced ? 0 : dt

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      if (w < 2 || h < 2) return

      const e = pulse.current
      const depth = DEPTH * (1 + 0.5 * e * e * (3 - 2 * e)) + Math.sin(clock * 0.5) * 0.12
      const pitch = PITCH + p.y * 0.05
      const yaw = p.x * 0.16 + clock * 0.018
      const cy = Math.cos(yaw)
      const sy = Math.sin(yaw)
      const focal = Math.max(w, h * 1.25) * 0.5
      const ox = w / 2
      const oy = h * 0.5
      const flow = (clock * 0.22) % SPACING

      const paths: Path2D[] = []
      for (let b = 0; b < BUCKETS; b++) paths.push(new Path2D())

      for (let dir = 0; dir < 2; dir++) {
        for (let i = 0; i <= LINES; i++) {
          const fixed = -HALF + i * SPACING + (dir === 0 ? flow : 0)
          let prev: number[] | null = null
          let prevB = -1
          for (let s = 0; s <= SAMPLES; s++) {
            const u = -HALF + (s / SAMPLES) * HALF * 2
            const gx = dir === 0 ? u : fixed
            const gz = dir === 0 ? fixed : u
            const x = gx * cy - gz * sy
            const z = gx * sy + gz * cy
            const r = Math.sqrt(x * x + z * z)
            const y = wellDepth(r, depth, THROAT)
            const pt = project(x, y, z, pitch, DIST, focal)
            if (!pt) {
              prev = null
              continue
            }
            const fade =
              clamp01((HALF * 0.98 - r) / (HALF * 0.45)) * clamp01(1.05 + y / (depth * 0.8)) * clamp01(1.9 - pt[2] / (DIST * 1.25))
            const bucket = Math.min(BUCKETS - 1, Math.floor(fade * BUCKETS))
            const sx = ox + pt[0]
            const syy = oy + pt[1]
            if (prev && bucket > 0 && prevB > 0) {
              const path = paths[Math.min(bucket, prevB)]
              path.moveTo(prev[0], prev[1])
              path.lineTo(sx, syy)
            }
            prev = [sx, syy]
            prevB = bucket
          }
        }
      }

      ctx.lineWidth = 1
      for (let b = 1; b < BUCKETS; b++) {
        ctx.strokeStyle = "rgba(196,196,206," + ((b / (BUCKETS - 1)) * 0.3).toFixed(3) + ")"
        ctx.stroke(paths[b])
      }
    }

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
      last = now
      draw(dt)
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (running || reduced) return
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      draw(0.016)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const io = new IntersectionObserver(([entry]) => (entry && entry.isIntersecting ? start() : stop()))
    io.observe(root)
    resize()

    return () => {
      stop()
      observer.disconnect()
      io.disconnect()
    }
  }, [grid, reduced])

  // ---- pointer -----------------------------------------------------------------
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current
    if (!root || e.pointerType === "touch") return
    const rect = root.getBoundingClientRect()
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1))
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1))
    pointer.current.tx = nx
    pointer.current.ty = ny
    if (reduced) return
    root.style.setProperty("--rx", (-ny * tilt).toFixed(2) + "deg")
    root.style.setProperty("--ry", (nx * tilt).toFixed(2) + "deg")
    root.style.setProperty("--lx", (50 + nx * 45).toFixed(1) + "%")
    root.style.setProperty("--ly", (35 + ny * 45).toFixed(1) + "%")
  }
  const onPointerLeave = () => {
    const root = rootRef.current
    pointer.current.tx = 0
    pointer.current.ty = 0
    if (!root) return
    for (const v of ["--rx", "--ry", "--lx", "--ly"]) root.style.removeProperty(v)
  }

  // ---- the form -------------------------------------------------------------------
  const nudge = () => {
    const box = boxRef.current
    if (!box || reduced || typeof box.animate !== "function") return
    const s = Math.random() > 0.5 ? 1 : -1
    box.animate(
      [
        { transform: "translateY(0) rotate(0deg)" },
        { transform: "translateY(-3.5%) rotate(" + s * 0.9 + "deg)" },
        { transform: "translateY(0) rotate(0deg)" },
      ],
      { duration: 280, easing: "cubic-bezier(.3,1.5,.5,1)" },
    )
  }

  const shake = () => {
    const bar = barRef.current
    if (!bar || reduced || typeof bar.animate !== "function") return
    bar.animate(
      [0, -9, 8, -6, 4, -2, 0].map((x) => ({ transform: "translateX(" + x + "px)" })),
      { duration: 420, easing: "ease-out" },
    )
  }

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    const value = email.trim()
    if (!isEmail(value)) {
      setError(invalidMessage)
      shake()
      inputRef.current?.focus()
      return
    }
    setError(null)
    setPhase("sending")
    const began = performance.now()
    try {
      const result = await (onSubmit ? onSubmit(value) : undefined)
      // Let the envelope finish dropping into the slot before it comes back.
      const left = (reduced ? 0 : 760) - (performance.now() - began)
      if (left > 0) await sleep(left)
      if (!alive.current) return
      const [rise, open] = timeline(reduced)
      setSentTo(value)
      setPlace(typeof result === "number" && Number.isFinite(result) ? result : null)
      setPhase("rising")
      later(() => setPhase("opening"), rise)
      later(() => setPhase("open"), rise + open)
    } catch (err) {
      if (!alive.current) return
      setPhase("idle")
      setError(err instanceof Error && err.message ? err.message : "Couldn't send that. Try again.")
      shake()
    }
  }

  const reset = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
    setPhase("idle")
    setEmail("")
    setSentTo("")
    setPlace(null)
    setError(null)
    onReset?.()
    later(() => inputRef.current?.focus(), reduced ? 0 : 500)
  }

  const number = place === null ? "" : serial(place, digits)
  const masked = sentTo ? maskEmail(sentTo) : ""
  const markNode = mark ?? <Monogram size="100%" />

  const g = (name: string) => uid + "-" + name
  const fill = (name: string) => "url(#" + g(name) + ")"
  const [pl, pr, pb] = look.pocket

  return (
    <div
      ref={rootRef}
      className={"siw relative w-full overflow-hidden font-sans " + className}
      data-phase={phase}
      data-variant={variant}
      data-focus={focused && phase === "idle" ? "" : undefined}
      data-valid={valid && phase === "idle" ? "" : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={
        {
          height,
          containerType: "size",
          background: "radial-gradient(120% 80% at 50% 60%,#1b1a19 0%,#0e0e0f 55%,#070707 100%)",
          color: "#e9e9e9",
          "--lean": lean + "deg",
          "--glow": glow,
          "--glow-a": withAlpha(glow, 0.42),
          "--glow-b": withAlpha(glow, 0.12),
          "--glow-c": withAlpha(glow, 0.6),
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>

      {grid ? <canvas ref={canvasRef} className="siw-grid" aria-hidden /> : null}
      <div className="siw-vignette" aria-hidden />
      <div className="siw-glow" aria-hidden />

      <div className="siw-stage">
        <div className="siw-slot" aria-hidden>
          <div className="siw-env">
            <div className="siw-tilt">
              <div className="siw-float">
                <div ref={boxRef} className="siw-box">
                  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
                    <defs>
                      {[
                        ["pl", pl, "0", "0", "1", "1"],
                        ["pr", pr, "1", "0", "0", "1"],
                        ["pb", pb, "0", "1", "0", "0"],
                        ["fo", look.flapOut, "0", "0", "0", "1"],
                        ["fi", look.flapIn, "0", "1", "0", "0"],
                      ].map(([id, c, x1, y1, x2, y2]) => (
                        <linearGradient key={id as string} id={g(id as string)} x1={x1 as string} y1={y1 as string} x2={x2 as string} y2={y2 as string}>
                          <stop offset="0" stopColor={(c as string[])[0]} />
                          <stop offset="1" stopColor={(c as string[])[1]} />
                        </linearGradient>
                      ))}
                      <linearGradient id={g("rim")} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0.55" stopColor={glow} stopOpacity="0" />
                        <stop offset="1" stopColor="#fff3dc" stopOpacity={variant === "onyx" ? 0.75 : 0.5} />
                      </linearGradient>
                      <filter id={g("grain")} x="0" y="0" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" seed="3" />
                        <feColorMatrix type="saturate" values="0" />
                      </filter>
                    </defs>
                  </svg>

                  {/* the inside of the back, seen once the card lifts */}
                  <div className="siw-layer siw-back" style={{ background: look.back }} />

                  {/* the flap: outside face closed, inside face once it swings up */}
                  <div className="siw-flap">
                    <svg className="siw-layer siw-face" viewBox="0 0 100 44" preserveAspectRatio="none">
                      <path d={FLAP} fill={fill("fo")} />
                      <path d="M0 0 L46.5 40.5 Q50 43.5 53.5 40.5 L100 0" fill="none" stroke={look.shade} strokeWidth="1.4" vectorEffect="non-scaling-stroke" opacity="0.5" transform="translate(0 0.5)" />
                      <path d="M0 0.2 L46.5 40.5 Q50 43.5 53.5 40.5" stroke={look.crease} strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <svg className="siw-layer siw-face siw-face-in" viewBox="0 0 100 44" preserveAspectRatio="none">
                      <path d={FLAP_IN} fill={fill("fi")} />
                      <path d="M53.5 3.5 L100 44" stroke={fill("rim")} strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
                      <path d="M0 44 L46.5 3.5 Q50 0.5 53.5 3.5" stroke={look.crease} strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>

                  {/* the invitation */}
                  <div className="siw-card" style={{ background: "linear-gradient(175deg,#f7f6f2,#e9e7e1)" }}>
                    <svg className="siw-layer" style={{ position: "absolute", mixBlendMode: "multiply", opacity: 0.5 }} aria-hidden>
                      <rect width="100%" height="100%" filter={"url(#" + g("grain") + ")"} opacity="0.35" />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        paddingTop: "8.5cqw",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ width: "5.2cqw", height: "5.2cqw", color: "#6a6a6a", filter: "drop-shadow(0 1px 0 rgba(255,255,255,.9))" }}>
                        {markNode}
                      </div>
                      <p className="siw-title" style={{ marginTop: "9cqw" }}>
                        {invitedTitle}
                      </p>
                      <p className="siw-card-meta font-mono">{number || masked || "Admit one"}</p>
                    </div>
                  </div>

                  {/* the pocket: two side flaps and the bottom one over them */}
                  <svg className="siw-layer siw-pocket" viewBox="0 0 100 64" preserveAspectRatio="none" style={{ position: "absolute" }}>
                    <path d="M0 0 L46 40 L0 64 Z" fill={fill("pl")} />
                    <path d="M100 0 L54 40 L100 64 Z" fill={fill("pr")} />
                    <path d="M0 64 L44 40.4 Q50 36.4 56 40.4 L100 64 Z" fill={fill("pb")} />
                    <path d="M0 0 L46 40" stroke={look.shade} strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
                    <path d="M100 0 L54 40" stroke={look.crease} strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
                    <path d="M0 64 L44 40.4 Q50 36.4 56 40.4 L100 64" stroke={look.crease} strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
                    <path d="M0 64.4 L44 40.8 Q50 36.8 56 40.8 L100 64.4" stroke={look.shade} strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" transform="translate(0 0.7)" />
                    <path d="M100 0 L100 64 M54 40 L100 64" stroke={fill("rim")} strokeWidth="1.4" fill="none" vectorEffect="non-scaling-stroke" />
                    <rect width="100" height="64" filter={"url(#" + g("grain") + ")"} opacity={look.grain} style={{ mixBlendMode: "overlay" }} />
                  </svg>

                  {/* the seal */}
                  <div
                    className="siw-seal"
                    style={{
                      ...look.seal,
                      ...(valid || phase !== "idle"
                        ? { boxShadow: look.seal.boxShadow + ",0 0 22px " + withAlpha(glow, 0.55) }
                        : null),
                    }}
                  >
                    <div style={{ width: "58%", height: "58%", color: look.sealInk }}>{markNode}</div>
                  </div>

                  <div className="siw-sheen" style={{ opacity: variant === "onyx" ? 0.3 : 1 }} />
                  <div className="siw-edge" />
                  <div className="siw-rim" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <form ref={barRef} className="siw-bar font-mono" onSubmit={submit} noValidate>
          <label htmlFor={uid + "-email"} className="sr-only">
            Email address
          </label>
          <input
            ref={inputRef}
            id={uid + "-email"}
            className="siw-input font-mono"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder={placeholder}
            value={email}
            disabled={busy}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? uid + "-error" : undefined}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(null)
              nudge()
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <button type="submit" className="siw-btn font-mono" disabled={busy}>
            {phase === "sending" ? <span className="siw-dots">{pendingLabel}</span> : buttonLabel}
          </button>
        </form>
        <p id={uid + "-error"} className="siw-error font-mono" role="alert">
          {error}
        </p>
      </div>

      <div className="siw-after">
        <p className="siw-tagline">{tagline}</p>
        {number || masked ? (
          <p className="siw-meta font-mono">
            {[number ? number + " in line" : "", masked].filter(Boolean).join("  ·  ")}
          </p>
        ) : null}
        {resetLabel ? (
          <button type="button" className="siw-reset font-mono" onClick={reset} tabIndex={phase === "open" ? 0 : -1}>
            {resetLabel}
          </button>
        ) : null}
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {phase === "open" ? invitedTitle + " " + tagline + (number ? ". " + number + " in line." : ".") : ""}
      </div>
    </div>
  )
}
