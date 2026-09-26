"use client"

import * as React from "react"

/* ------------------------------------------------------------------ types */

export type Mood =
  | "idle"
  | "happy"
  | "wink"
  | "explain"
  | "think"
  | "shrug"
  | "stern"
  | "surprised"
  | "sleepy"
  | "wave"
  | "shy"
  | "dizzy"

/** The buttons in the dock, and anything you can trigger with `onReact`. */
export type Reaction = "wave" | "time" | "wink" | "happy" | "think" | "shy" | "stern" | "sleepy"

/** Everything she can say. `{name}` `{org}` `{user}` `{User}` `{time}` are filled in. */
export type LineKey = Reaction | "greet" | "poke" | "wake" | "dizzy" | "dance" | "antic"

export type MissMinutesClockProps = {
  /**
   * Height of the stage. Must be a definite length — the character is fitted
   * to this box, so a percentage collapses to 0px unless every ancestor up to
   * `<html>` has a real height. Never pass `"100%"`.
   */
  height?: string
  /** Floor for the height. */
  minHeight?: string
  /** `midnight` (orange on black), `peach` (orange on blush), `noir` (black and white). */
  theme?: "midnight" | "peach" | "noir"

  /* ---- persona ---- */
  name?: string
  /** Who she works for. Set small beside the emblem. */
  org?: string
  /** The letters in the emblem box, top left. Defaults to the org's initials. */
  emblem?: string
  /** Set big over the stage when there is room. Sentences break onto lines. */
  motto?: string
  /** What she calls you. */
  petName?: string
  /** Replace any of her lines. */
  lines?: Partial<Record<LineKey, string[]>>

  /* ---- behaviour ---- */
  /** The row of reaction buttons along the bottom. */
  controls?: boolean
  /** Wave and introduce herself on mount. */
  greet?: boolean
  /** Seconds without activity before she dozes off. Any movement wakes her. */
  sleepSeconds?: number
  /** The mirrored floor reflection under her. */
  reflection?: boolean
  /** Scanlines and a faint flicker — she is a projection, after all. */
  hologram?: boolean
  /** Called whenever her mood changes, with what caused it. */
  onReact?: (mood: Mood, cause: string) => void

  /* ---- colour overrides (the theme supplies the rest) ---- */
  face?: string
  ink?: string
  glove?: string
  shoe?: string
  glow?: string
  accent?: string
  background?: string
  className?: string
}

type Vars = Record<string, string>
type Lines = Record<string, string[]>

/* ------------------------------------------------------------ the script
   Pure helpers, lifted out and run by tests/miss-minutes-clock.test.mjs. */

// #region script

export const LINES: Lines = {
  greet: ["Hi! I'm {name}! Welcome to the {org}.", "Well hey there, {user}! I'm {name}."],
  wave: ["Hi there, {user}!", "Well hey, y'all!", "Yoo-hoo! Over here!"],
  time: ["It's {time} on the dot, {user}!", "Right now? {time}. And now it's a little later!", "{time}! I'd check my own face, but I'd go cross-eyed."],
  wink: ["Our little secret, {user}.", "I see everything, hon. Everything."],
  happy: ["Woo-hoo! Right on schedule!", "Now that's what I call good timing!"],
  think: ["Hmm... let me check the timeline.", "Now where did I put that minute?"],
  shy: ["Oh, stop it, you!", "Aw, {user}. You're makin' my hands spin."],
  stern: ["Now that's not very nice.", "Careful, {user}. I know exactly how much time you've got left."],
  sleepy: ["Just restin' my hands...", "Five more minutes..."],
  poke: [
    "Hee hee! That tickles!",
    "Boop! Right on the nose.",
    "Okay, you've had your fun.",
    "Hands off the merchandise, hon.",
    "I said that's ENOUGH, {user}.",
  ],
  wake: ["Oh! I wasn't sleepin'. I was restin' my hands.", "Huh? Right! Wide awake. On the clock!"],
  dizzy: ["Whoa-whoa-whoa! You're makin' me dizzy!", "Everything's spinnin', {user}!"],
  dance: ["Woo-hoo! Dance break!", "Tick-tock, round the clock!"],
  antic: ["Tick-tock, tick-tock...", "La-dee-da, keepin' time...", "Anybody need a minute?"],
}

export function pick(list: string[], seed: number) {
  if (!list || !list.length) return ""
  const n = list.length
  return list[((Math.floor(seed) % n) + n) % n]
}

export function fill(tpl: string, vars: Vars) {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m))
}

export function formatTime(d: Date) {
  const h = d.getHours()
  const m = d.getMinutes()
  return (h % 12 || 12) + ":" + (m < 10 ? "0" : "") + m + " " + (h < 12 ? "AM" : "PM")
}

/** The nth poke in a row: which line, which face, and whether she glitches. */
export function pokeStep(n: number) {
  const moods = ["happy", "surprised", "wink", "stern", "stern"]
  const i = Math.max(0, Math.min(n, moods.length) - 1)
  return { line: i, mood: moods[i], glitch: n >= 5 }
}

/** 0 far away, 1 on the nose — how close the pointer is to her face. */
export function nearness(px: number, py: number, cx: number, cy: number, r: number) {
  const d = Math.hypot(px - cx, py - cy)
  return Math.max(0, Math.min(1, 1 - (d - r * 0.4) / (r * 1.6)))
}

/** Scribbling fast over her: more than `limit` px of pointer travel in `span` ms. */
export function isShake(trail: number[], now: number, span: number, limit: number) {
  let sum = 0
  for (let i = 0; i + 1 < trail.length; i += 2) if (now - trail[i] <= span) sum += trail[i + 1]
  return sum > limit
}

/** How open the mouth is for the character being "said": 0 shut, 1 wide. */
export function cadence(ch: string) {
  if (/[aeiouy]/i.test(ch)) return /[ao]/i.test(ch) ? 1 : 0.75
  if (/[bmp]/i.test(ch)) return 0.05
  if (/[a-z0-9]/i.test(ch)) return 0.4
  return 0
}

/** Typewriter pacing, in ms: punctuation breathes. */
export function typeDelay(ch: string) {
  if (/[.!?]/.test(ch)) return 220
  if (/[,;:]/.test(ch)) return 120
  if (ch === " ") return 26
  return 30
}

/** The mouth: two quadratic lips between two corners. o = how far apart they open. */
export function mouthPath(w: number, c: number, o: number, tl: number) {
  const r = (n: number) => Math.round(n * 100) / 100
  const y = 232
  return (
    "M" + r(200 - w) + " " + r(y - tl) +
    " Q200 " + r(y + 2 * c - o) + " " + r(200 + w) + " " + r(y + tl) +
    " Q200 " + r(y + 2 * c + 2 * o) + " " + r(200 - w) + " " + r(y - tl) + "Z"
  )
}

// #endregion

/* ------------------------------------------------------------- the body
   Every coordinate lives in a 400 × 540 sheet (viewBox 0 40 400 540). The
   face is centred on (200, 190), r 108. Arms are rubber hoses: one quadratic
   curve from a shoulder hidden behind the dial to the wrist, with the glove
   turned to follow the curve's end tangent. Legs are the same trick, from
   hips that bob with the body to feet that stay on the floor (unless she
   jumps). The floor is y 410; the reflection is the figure mirrored about
   it and foreshortened. */

type Glove = "open" | "point" | "fist"
type ArmPose = "rest" | "cheer" | "hip" | "point" | "think" | "shrug" | "wave" | "cover" | "alarm" | "flail"
type Bob = "idle" | "hop" | "sway" | "still" | "shiver" | "breathe" | "wobble"
type Spec = {
  arms: [ArmPose, ArmPose]
  eyes: "open" | "happy" | "wink" | "closed" | "dizzy"
  lid: number
  wide: number
  /** [dy, tilt] — positive tilt drops the inner ends (cross). */
  brow: [number, number]
  /** [half-width, curve, open, corner tilt] */
  mouth: [number, number, number, number]
  blush: number
  bob: Bob
  tilt: number
  look?: [number, number]
}

/** Right-arm poses: wrist, curve control, glove twist (deg), glove. The left arm mirrors them. */
const ARMS: Record<ArmPose, { h: [number, number]; c: [number, number]; tw: number; g: Glove }> = {
  rest: { h: [326, 300], c: [322, 256], tw: 0, g: "open" },
  cheer: { h: [352, 104], c: [366, 206], tw: 8, g: "open" },
  hip: { h: [298, 288], c: [374, 268], tw: 10, g: "fist" },
  point: { h: [338, 112], c: [358, 212], tw: -8, g: "point" },
  think: { h: [240, 276], c: [332, 330], tw: -26, g: "point" },
  shrug: { h: [354, 184], c: [348, 262], tw: 50, g: "open" },
  wave: { h: [350, 112], c: [368, 208], tw: 0, g: "open" },
  cover: { h: [262, 240], c: [338, 306], tw: -20, g: "open" },
  alarm: { h: [338, 150], c: [366, 236], tw: 25, g: "open" },
  flail: { h: [362, 150], c: [330, 250], tw: 40, g: "open" },
}

const MOODS: Record<Mood, Spec> = {
  idle: { arms: ["rest", "hip"], eyes: "open", lid: 1, wide: 1, brow: [0, 0], mouth: [24, 7, 0, 0], blush: 0.35, bob: "idle", tilt: 0 },
  happy: { arms: ["cheer", "cheer"], eyes: "happy", lid: 1, wide: 1, brow: [-5, -6], mouth: [34, 9, 11, 0], blush: 0.75, bob: "hop", tilt: 0 },
  wink: { arms: ["rest", "hip"], eyes: "wink", lid: 1, wide: 1, brow: [-2, -3], mouth: [20, 5, 0, -4], blush: 0.6, bob: "sway", tilt: -5 },
  explain: { arms: ["hip", "point"], eyes: "open", lid: 1, wide: 1, brow: [-4, -4], mouth: [22, 6, 0, 0], blush: 0.4, bob: "sway", tilt: 3 },
  think: { arms: ["hip", "think"], eyes: "open", lid: 0.82, wide: 1, brow: [-3, 6], mouth: [11, -1, 0, 3], blush: 0.2, bob: "still", tilt: -6, look: [-0.55, -0.9] },
  shrug: { arms: ["shrug", "shrug"], eyes: "open", lid: 1, wide: 1, brow: [-7, -9], mouth: [18, 0, 0, 4], blush: 0.3, bob: "idle", tilt: 6 },
  stern: { arms: ["hip", "hip"], eyes: "open", lid: 0.55, wide: 1, brow: [5, 16], mouth: [20, -5, 0, 0], blush: 0, bob: "shiver", tilt: 0 },
  surprised: { arms: ["alarm", "alarm"], eyes: "open", lid: 1, wide: 1.14, brow: [-11, -4], mouth: [10, 0, 11, 0], blush: 0.3, bob: "idle", tilt: 0 },
  sleepy: { arms: ["rest", "rest"], eyes: "closed", lid: 1, wide: 1, brow: [2, -3], mouth: [9, 1, 2, 0], blush: 0.25, bob: "breathe", tilt: 7, look: [0, 0.6] },
  wave: { arms: ["hip", "wave"], eyes: "open", lid: 1, wide: 1, brow: [-4, -4], mouth: [28, 8, 6, 0], blush: 0.5, bob: "sway", tilt: 0 },
  shy: { arms: ["cover", "cover"], eyes: "happy", lid: 1, wide: 1, brow: [-3, -6], mouth: [14, 5, 0, 0], blush: 1, bob: "idle", tilt: -8, look: [0.3, 0.5] },
  dizzy: { arms: ["flail", "flail"], eyes: "dizzy", lid: 1, wide: 1, brow: [-6, -8], mouth: [16, 0, 4, 5], blush: 0.3, bob: "wobble", tilt: 0 },
}

const REACTIONS: { id: Reaction; label: string; mood: Mood }[] = [
  { id: "wave", label: "Hello", mood: "wave" },
  { id: "time", label: "Time?", mood: "explain" },
  { id: "wink", label: "Wink", mood: "wink" },
  { id: "happy", label: "Yay!", mood: "happy" },
  { id: "think", label: "Hmm", mood: "think" },
  { id: "shy", label: "Aww", mood: "shy" },
  { id: "stern", label: "Rude!", mood: "stern" },
  { id: "sleepy", label: "Nap", mood: "sleepy" },
]
const ANTICS: Mood[] = ["wink", "think", "wave", "shrug"]

const CX = 200
const CY = 190
const EYE_L = 170
const EYE_R = 230
const EYE_Y = 168
const MOUTH_Y = 232
const SHOULDER: [number, number] = [292, 222]
const FLOOR = 410
const REFLECT = 0.62
const HAPPY_EYE = "M-15 8 Q0 -16 15 8"
const CLOSED_EYE = "M-16 -2 Q0 14 16 -2"
const DIZZY_EYE = "M1 0 A2 2 0 0 0 -3 0 A5 5 0 0 0 7 0 A8 8 0 0 0 -9 0 A11 11 0 0 0 13 0 A14 14 0 0 0 -15 0"

const ease = (cur: number, target: number, dt: number, rate: number) =>
  target + (cur - target) * Math.exp(-rate * dt)
const r2 = (n: number) => Math.round(n * 100) / 100
const sat = (v: number) => v / Math.sqrt(1 + v * v)

/* ------------------------------------------------------------------ themes */

type Palette = {
  bg: string
  text: string
  muted: string
  line: string
  chip: string
  accent: string
  accentInk: string
  bubbleInk: string
  face: string
  ink: string
  limb: string
  leg: string
  glove: string
  shoe: string
  glow: string
  glowA: string
  blush: string
  lit: string
  mouth: string
}

const THEMES: Record<"midnight" | "peach" | "noir", Palette> = {
  midnight: {
    bg: "#070504", text: "#f8ead9", muted: "#b39479", line: "rgba(247,146,42,0.28)", chip: "rgba(255,244,230,0.05)",
    accent: "#f7922a", accentInk: "#2b0f04", bubbleInk: "#2b0f04",
    face: "#f7922a", ink: "#3a1507", limb: "#f7922a", leg: "#8a3a14", glove: "#fbf5ec",
    shoe: "#fbf5ec", glow: "#ff7a1a", glowA: "0.5", blush: "#ff5a3d", lit: "#fff1c2", mouth: "#5a1206",
  },
  peach: {
    bg: "#f1dacd", text: "#3a1507", muted: "#8b5a43", line: "rgba(58,21,7,0.18)", chip: "rgba(255,250,246,0.6)",
    accent: "#e8622a", accentInk: "#fff8f1", bubbleInk: "#2b0f04",
    face: "#f39a3c", ink: "#3a1507", limb: "#f39a3c", leg: "#3a1507", glove: "#f3eee6",
    shoe: "#f08f2c", glow: "#ff4a2a", glowA: "0.62", blush: "#ff6a4a", lit: "#fff6dc", mouth: "#5a1206",
  },
  noir: {
    bg: "#000000", text: "#f5f5f5", muted: "#9b9b9b", line: "rgba(255,255,255,0.2)", chip: "rgba(255,255,255,0.05)",
    accent: "#f2f2f0", accentInk: "#0a0a0a", bubbleInk: "#0a0a0a",
    face: "#f2f2f0", ink: "#0d0d0d", limb: "#f2f2f0", leg: "#f2f2f0", glove: "#f2f2f0",
    shoe: "#f2f2f0", glow: "#ffffff", glowA: "0.14", blush: "#cfcfcf", lit: "#8a8a8a", mouth: "#222222",
  },
}

const SANS_STACK = 'ui-rounded,"SF Pro Rounded","Nunito","Segoe UI",system-ui,-apple-system,Helvetica,Arial,sans-serif'
const DISPLAY_STACK = '"Futura","Century Gothic","Avenir Next","Trebuchet MS",system-ui,sans-serif'

/* --------------------------------------------------------------- component */

export default function MissMinutesClock({
  height = "100svh",
  minHeight = "480px",
  theme = "midnight",
  name = "Miss Minutes",
  org = "Time Variance Authority",
  emblem,
  motto = "For All Time. Always.",
  petName = "sugar",
  lines,
  controls = true,
  greet = true,
  sleepSeconds = 45,
  reflection = true,
  hologram,
  onReact,
  face,
  ink,
  glove,
  shoe,
  glow,
  accent,
  background,
  className,
}: MissMinutesClockProps) {
  const uid = React.useId().replace(/:/g, "")
  const id = (n: string) => uid + "-" + n
  const u = (n: string) => "url(#" + id(n) + ")"

  /* ---- state ---- */
  const [mood, setMoodState] = React.useState<Mood>("idle")
  const [fxKey, setFxKey] = React.useState(0)
  const [quip, setQuip] = React.useState<{ text: string; n: number; key: number } | null>(null)
  const [flags, setFlags] = React.useState({ boop: false, glitch: false })
  const [poked, setPoked] = React.useState(false)

  /* ---- refs the frame loop and timers read ---- */
  const rootRef = React.useRef<HTMLDivElement>(null)
  const nodes = React.useRef<Record<string, Element | null>>({})
  const binders = React.useRef<Record<string, (n: Element | null) => void>>({})
  const bind = (k: string) =>
    binders.current[k] ?? (binders.current[k] = (n: Element | null) => { nodes.current[k] = n })

  const moodRef = React.useRef<Mood>("idle")
  const talkRef = React.useRef(0)
  const hoverRef = React.useRef(false)
  const reducedRef = React.useRef(false)
  const pointer = React.useRef({ x: 0, y: 0, t: -1e9 })
  const asleepAt = React.useRef(0)
  const lastAct = React.useRef(Date.now())
  const antic = React.useRef(false)
  const seed = React.useRef(Math.floor(Math.random() * 1000))
  const pokes = React.useRef({ n: 0, at: 0 })
  const settleT = React.useRef(0)
  const timeouts = React.useRef(new Set<number>())
  const live = React.useRef({ lines, name, org, petName, sleepSeconds, onReact })
  live.current = { lines, name, org, petName, sleepSeconds, onReact }

  const later = React.useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timeouts.current.delete(t)
      fn()
    }, ms)
    timeouts.current.add(t)
    return t
  }, [])

  const line = React.useCallback((key: LineKey) => {
    const { lines: custom, name: n, org: o, petName: p } = live.current
    const list = custom?.[key]?.length ? custom[key]! : LINES[key]
    const vars = { name: n, org: o, user: p, User: p.charAt(0).toUpperCase() + p.slice(1), time: formatTime(new Date()) }
    return fill(pick(list, seed.current++), vars)
  }, [])

  const setMood = React.useCallback((m: Mood, cause: string) => {
    window.clearTimeout(settleT.current)
    moodRef.current = m
    setMoodState(m)
    setFxKey((k) => k + 1)
    live.current.onReact?.(m, cause)
  }, [])

  /** Drift back to rest after a beat — unless she is napping or mid-sentence. */
  const settle = React.useCallback((ms = 1800) => {
    window.clearTimeout(settleT.current)
    settleT.current = window.setTimeout(() => {
      if (asleepAt.current || talkRef.current > 0) return
      moodRef.current = "idle"
      setMoodState("idle")
    }, ms)
  }, [])

  const flash = React.useCallback(
    (flag: "boop" | "glitch", ms: number) => {
      setFlags((f) => ({ ...f, [flag]: false }))
      requestAnimationFrame(() => setFlags((f) => ({ ...f, [flag]: true })))
      later(() => setFlags((f) => ({ ...f, [flag]: false })), ms)
    },
    [later],
  )

  const say = React.useCallback((text: string) => {
    setQuip({ text, n: reducedRef.current ? text.length : 0, key: Date.now() + Math.random() })
  }, [])

  /** One entry point for everything that changes her: buttons, pokes, shakes, idling. */
  const react = React.useCallback(
    (m: Mood, key: LineKey | null, cause: string) => {
      lastAct.current = Date.now()
      antic.current = false
      // a nap you asked for lasts a few seconds before a stray mouse move can end it
      asleepAt.current = m === "sleepy" ? Date.now() + (cause === "sleepy" ? 5000 : 0) : 0
      setMood(m, cause)
      if (m === "stern") flash("glitch", 1100)
      if (key) say(line(key))
      else settle(1800)
    },
    [flash, line, say, setMood, settle],
  )
  const reactRef = React.useRef(react)
  reactRef.current = react

  const wake = React.useCallback(() => {
    lastAct.current = Date.now()
    antic.current = false
    // a grace period, so the click that sent her to sleep doesn't wake her
    if (!asleepAt.current || Date.now() - asleepAt.current < 1500) return
    react("surprised", "wake", "wake")
  }, [react])

  const poke = () => {
    if (asleepAt.current) {
      asleepAt.current = 1
      return wake()
    }
    const t = Date.now()
    const p = pokes.current
    p.n = t - p.at < 3500 ? p.n + 1 : 1
    p.at = t
    const step = pokeStep(p.n)
    setPoked(true)
    const list = live.current.lines?.poke?.length ? live.current.lines.poke : LINES.poke
    react(step.mood as Mood, null, "poke")
    say(fill(list[Math.min(step.line, list.length - 1)], { user: live.current.petName, name: live.current.name }))
    flash(step.glitch ? "glitch" : "boop", step.glitch ? 1100 : 450)
  }

  /* ---- speech bubble typewriter + lip-sync ---- */
  React.useEffect(() => {
    if (!quip) return
    if (quip.n >= quip.text.length) {
      talkRef.current = 0
      const key = quip.key
      const t = window.setTimeout(() => {
        setQuip((q) => (q && q.key === key ? null : q))
        if (!asleepAt.current) settle(200)
      }, 1900)
      return () => window.clearTimeout(t)
    }
    const ch = quip.text[quip.n]
    talkRef.current = Math.max(0.001, cadence(ch))
    const t = window.setTimeout(() => setQuip((q) => (q && q.key === quip.key ? { ...q, n: q.n + 1 } : q)), typeDelay(ch))
    return () => window.clearTimeout(t)
  }, [quip, settle])

  /* ---- mount: greeting, idle antics, naps, the lit hour ---- */
  React.useEffect(() => {
    if (greet) later(() => reactRef.current("wave", "greet", "greet"), 700)
    const iv = window.setInterval(() => {
      if (asleepAt.current || talkRef.current > 0) return
      const idle = (Date.now() - lastAct.current) / 1000
      const sleepAt = live.current.sleepSeconds
      if (idle > sleepAt) {
        reactRef.current("sleepy", null, "idle")
      } else if (idle > Math.min(14, sleepAt / 2) && !antic.current) {
        antic.current = true
        reactRef.current(ANTICS[seed.current++ % ANTICS.length], "antic", "idle")
      }
    }, 1000)
    const pending = timeouts.current
    return () => {
      window.clearInterval(iv)
      window.clearTimeout(settleT.current)
      pending.forEach((t) => window.clearTimeout(t))
      pending.clear()
    }
  }, [greet, later])

  /* ---- the frame loop: writes straight to the SVG, never to React state ---- */
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => {
      reducedRef.current = mq.matches
    }
    onMq()
    mq.addEventListener("change", onMq)

    // pointer trail, as flat [time, distance, time, distance, …] for the shake check
    const trail: number[] = []
    let dizzyUntil = 0
    const onMove = (e: PointerEvent) => {
      const now = performance.now()
      const p = pointer.current
      const root = rootRef.current?.getBoundingClientRect()
      const inside = root && e.clientX >= root.left && e.clientX <= root.right && e.clientY >= root.top && e.clientY <= root.bottom
      if (inside && now - p.t < 100) {
        trail.push(now, Math.hypot(e.clientX - p.x, e.clientY - p.y))
        while (trail.length && now - trail[0] > 800) trail.splice(0, 2)
        if (now > dizzyUntil && !reducedRef.current && isShake(trail, now, 800, 2600)) {
          dizzyUntil = now + 5000
          trail.length = 0
          reactRef.current("dizzy", "dizzy", "shake")
        }
      }
      pointer.current = { x: e.clientX, y: e.clientY, t: now }
    }
    const onBlur = () => {
      pointer.current.t = -1e9
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onMove, { passive: true })
    window.addEventListener("blur", onBlur)

    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    if (rootRef.current) io.observe(rootRef.current)

    const n = nodes.current
    const set = (k: string, a: string, v: string | number) => n[k]?.setAttribute(a, String(v))
    const rest = (side: "L" | "R") => {
      const p = ARMS.rest
      const m = side === "L"
      return { hx: m ? 400 - p.h[0] : p.h[0], hy: p.h[1], cx: m ? 400 - p.c[0] : p.c[0], cy: p.c[1], tw: 0, g: "" }
    }
    const S = {
      gx: 0, gy: 0, wx: 0, wy: 0, wanderAt: 0, near: 0,
      blinkAt: 1.2, blinkT: -9, dbl: false,
      bdy: 0, btl: 0, mw: 24, mc: 7, mo: 0, mt: 0, talk: 0,
      blush: 0.35, wide: 1, lid: 1, tilt: 0, eyes: "",
      L: rest("L"), R: rest("R"),
    }

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible) return
      const t = now / 1000
      const rm = reducedRef.current
      const k = rm ? 0 : 1
      const spec = MOODS[moodRef.current]

      /* gaze: where the mood says, else your pointer, else she looks around */
      let tx = 0
      let ty = 0
      let near = 0
      const faceEl = n.face as SVGGraphicsElement | null
      const recent = now - pointer.current.t < 3500
      if (faceEl && recent) {
        const f = faceEl.getBoundingClientRect()
        const fx = f.left + f.width / 2
        const fy = f.top + f.height / 2
        tx = sat((pointer.current.x - fx) / (f.width * 0.9))
        ty = sat((pointer.current.y - fy) / (f.height * 0.9))
        near = nearness(pointer.current.x, pointer.current.y, fx, fy, f.width / 2)
      }
      if (spec.look) {
        tx = spec.look[0]
        ty = spec.look[1]
      } else if (!recent && !rm) {
        if (t > S.wanderAt) {
          S.wx = Math.random() * 1.6 - 0.8
          S.wy = Math.random() * 1.0 - 0.5
          S.wanderAt = t + 1.2 + Math.random() * 2.6
        }
        tx = S.wx
        ty = S.wy
      }
      S.gx = ease(S.gx, tx, dt, rm ? 60 : 9)
      S.gy = ease(S.gy, ty, dt, rm ? 60 : 9)
      S.near = ease(S.near, spec.eyes === "open" ? near : 0, dt, 8)

      /* eyes */
      if (S.eyes !== spec.eyes) {
        S.eyes = spec.eyes
        const lOpen = spec.eyes === "open"
        const rOpen = spec.eyes === "open" || spec.eyes === "wink"
        const arc = spec.eyes === "happy" ? HAPPY_EYE : spec.eyes === "dizzy" ? DIZZY_EYE : CLOSED_EYE
        set("eyeLo", "display", lOpen ? "inline" : "none")
        set("eyeRo", "display", rOpen ? "inline" : "none")
        set("eyeLa", "display", lOpen ? "none" : "inline")
        set("eyeRa", "display", rOpen ? "none" : "inline")
        set("eyeLap", "d", arc)
        set("eyeRap", "d", arc)
      }
      if (!rm && t > S.blinkAt) {
        S.blinkT = t
        S.blinkAt = t + (S.dbl ? 0.24 : 2 + Math.random() * 4)
        S.dbl = !S.dbl && Math.random() < 0.22
      }
      const bp = (t - S.blinkT) / 0.15
      const blinkOpen = bp >= 0 && bp < 1 ? 1 - Math.sin(bp * Math.PI) * 0.96 : 1
      S.lid = ease(S.lid, spec.lid, dt, 10)
      S.wide = ease(S.wide, spec.wide + S.near * 0.1, dt, 12)
      const lidH = r2((1 - Math.min(1, S.lid + S.near * 0.2) * blinkOpen) * 60)
      for (const [s, ex] of [["L", EYE_L], ["R", EYE_R]] as const) {
        set("eye" + s + "o", "transform", "translate(" + ex + " " + EYE_Y + ") scale(" + r2(S.wide) + ") translate(" + -ex + " " + -EYE_Y + ")")
        set("pup" + s, "transform", "translate(" + r2(S.gx * 7.5) + " " + r2(S.gy * 9 + 3) + ")")
        set("lid" + s, "height", lidH)
        set("lidline" + s, "y1", 138 + lidH)
        set("lidline" + s, "y2", 138 + lidH)
        set("lidline" + s, "opacity", lidH > 1.5 ? 1 : 0)
      }

      /* brows lift when you come close */
      S.bdy = ease(S.bdy, spec.brow[0] - S.near * 5, dt, 10)
      S.btl = ease(S.btl, spec.brow[1], dt, 10)
      set("browL", "transform", "translate(" + EYE_L + " " + r2(128 + S.bdy) + ") rotate(" + r2(S.btl) + ")")
      set("browR", "transform", "translate(" + EYE_R + " " + r2(128 + S.bdy) + ") rotate(" + r2(-S.btl) + ")")

      /* mouth, with lip-sync riding on top of the mood's shape */
      S.talk = ease(S.talk, talkRef.current, dt, 26)
      S.mw = ease(S.mw, spec.mouth[0], dt, 11)
      S.mc = ease(S.mc, spec.mouth[1], dt, 11)
      S.mo = ease(S.mo, spec.mouth[2], dt, 11)
      S.mt = ease(S.mt, spec.mouth[3], dt, 11)
      const mo = Math.max(S.mo, S.talk * 12)
      const mw = S.mw - S.talk * 5
      const md = mouthPath(mw, S.mc, mo, S.mt)
      set("mouthFill", "d", md)
      set("mouthLine", "d", md)
      set("mouthClip", "d", md)
      set("teeth", "x", r2(CX - mw))
      set("teeth", "width", r2(mw * 2))
      set("teeth", "y", r2(MOUTH_Y + S.mc - mo / 2 - 3))
      set("teeth", "height", mo > 2.5 ? r2(mo * 0.5 + 2) : 0)
      set("tongue", "cy", r2(MOUTH_Y + S.mc + mo * 1.05))
      set("tongue", "rx", r2(mw * 0.5))
      set("tongue", "ry", r2(Math.max(0, mo * 0.55)))
      S.blush = ease(S.blush, Math.min(1, spec.blush + (hoverRef.current ? 0.3 : 0)), dt, 6)
      set("blush", "opacity", r2(S.blush))

      /* body: bob, hop, sway, tremble, wobble */
      let lift = 0
      let rot = 0
      let sq = 0
      let sx = 0
      let jump = 0
      if (spec.bob === "hop") {
        const ph = Math.abs(Math.sin(t * 5.2))
        lift = ph * 16
        jump = lift * 0.85
        sq = Math.pow(1 - ph, 4) * 0.06
        rot = Math.sin(t * 2.6) * 3
      } else if (spec.bob === "sway") {
        lift = Math.abs(Math.sin(t * 3.2)) * 3
        rot = Math.sin(t * 1.6) * 3
      } else if (spec.bob === "still") {
        lift = (Math.sin(t * 1.5) * 0.5 + 0.5) * 1.5
      } else if (spec.bob === "shiver") {
        sx = Math.sin(t * 41) * 0.9
        rot = Math.sin(t * 33) * 0.7
      } else if (spec.bob === "breathe") {
        lift = (Math.sin(t * 1.1) * 0.5 + 0.5) * 2
        sq = Math.sin(t * 1.1) * 0.012
      } else if (spec.bob === "wobble") {
        rot = Math.sin(t * 4.2) * 9
        sx = Math.sin(t * 4.2) * 6
        lift = Math.abs(Math.sin(t * 4.2)) * 3
      } else {
        lift = (Math.sin(t * 2.4) * 0.5 + 0.5) * 4
        rot = Math.sin(t * 1.2) * 1.5
        sq = (Math.sin(t * 2.4 + 1.6) * 0.5 + 0.5) * 0.012
      }
      S.tilt = ease(S.tilt, spec.tilt, dt, 6)
      lift *= k
      jump *= k
      sq *= k
      sx *= k
      rot = rot * k + S.tilt
      set(
        "body",
        "transform",
        "translate(" + r2(sx) + " " + r2(-lift) + ") rotate(" + r2(rot) + " 200 300) translate(200 300) scale(" +
          r2(1 + sq) + " " + r2(1 - sq) + ") translate(-200 -300)",
      )
      set("shoes", "transform", "translate(0 " + r2(-jump) + ")")

      /* legs: hips ride the body, feet stay put */
      for (const [s, m] of [["L", -1], ["R", 1]] as const) {
        const hx = CX + m * 12 + sx
        const hy = 286 - lift
        const fx = CX + m * 18
        const fy = 392 - jump
        const bow = 7 + sq * 140
        const d = "M" + r2(hx) + " " + r2(hy) + " Q" + r2((hx + fx) / 2 + m * bow) + " " + r2((hy + fy) / 2) + " " + r2(fx) + " " + r2(fy)
        set("leg" + s + "o", "d", d)
        set("leg" + s, "d", d)
      }

      /* arms: ease each wrist and elbow toward the pose, aim the glove down the hose */
      const talking = S.talk > 0.05
      for (const [s, mi] of [["L", 0], ["R", 1]] as const) {
        const pose = spec.arms[mi]
        const P = ARMS[pose]
        const mir = s === "L"
        const A = S[s]
        let hx = mir ? 400 - P.h[0] : P.h[0]
        let hy = P.h[1]
        let tw = P.tw
        if (pose === "wave") {
          hx += (mir ? -1 : 1) * Math.sin(t * 9) * 10 * k
          tw += Math.sin(t * 9) * 26 * k
        }
        if (pose === "point" && talking) hy += Math.sin(t * 7) * 6 * k
        if (pose === "think") tw += Math.sin(t * 6) * 7 * k
        if (pose === "cheer") hy += Math.sin(t * 5.2 + mi * 0.6) * 5 * k
        if (pose === "flail") {
          hx += Math.sin(t * 8 + mi * 2) * 14 * k
          hy += Math.cos(t * 8 + mi * 2) * 16 * k
        }
        const rate = rm ? 40 : 9
        A.hx = ease(A.hx, hx, dt, rate)
        A.hy = ease(A.hy, hy, dt, rate)
        A.cx = ease(A.cx, mir ? 400 - P.c[0] : P.c[0], dt, rate)
        A.cy = ease(A.cy, P.c[1], dt, rate)
        A.tw = ease(A.tw, mir ? -tw : tw, dt, rate)
        const sx0 = mir ? 400 - SHOULDER[0] : SHOULDER[0]
        const d = "M" + sx0 + " " + SHOULDER[1] + " Q" + r2(A.cx) + " " + r2(A.cy) + " " + r2(A.hx) + " " + r2(A.hy)
        set("arm" + s + "o", "d", d)
        set("arm" + s, "d", d)
        const ang = (Math.atan2(A.hy - A.cy, A.hx - A.cx) * 180) / Math.PI + 90 + A.tw
        set("glove" + s, "transform", "translate(" + r2(A.hx) + " " + r2(A.hy) + ") rotate(" + r2(ang) + ") scale(" + (mir ? -1.35 : 1.35) + " 1.35)")
        if (A.g !== P.g) {
          A.g = P.g
          set("glove" + s, "data-shape", P.g)
        }
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      mq.removeEventListener("change", onMq)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onMove)
      window.removeEventListener("blur", onBlur)
    }
  }, [])

  /* ---- derived ---- */
  const pal: Palette = {
    ...THEMES[theme],
    ...(face ? { face, limb: face } : null),
    ...(ink ? { ink } : null),
    ...(glove ? { glove } : null),
    ...(shoe ? { shoe } : null),
    ...(glow ? { glow } : null),
    ...(accent ? { accent } : null),
    ...(background ? { bg: background } : null),
  }
  const holo = hologram ?? theme !== "peach"
  const mark =
    emblem ??
    (org
      .split(/\s+/)
      .filter((w) => w && !/^(of|the|and|for|a|an)$/i.test(w))
      .map((w) => w[0].toUpperCase())
      .join("")
      .slice(0, 3) || "T")

  const style = {
    height,
    minHeight,
    "--rcc-bg": pal.bg,
    "--rcc-text": pal.text,
    "--rcc-muted": pal.muted,
    "--rcc-line": pal.line,
    "--rcc-chip": pal.chip,
    "--rcc-accent": pal.accent,
    "--rcc-accent-ink": pal.accentInk,
    "--rcc-bubble-ink": pal.bubbleInk,
    "--rcc-face": pal.face,
    "--rcc-ink": pal.ink,
    "--rcc-limb": pal.limb,
    "--rcc-leg": pal.leg,
    "--rcc-glove": pal.glove,
    "--rcc-shoe": pal.shoe,
    "--rcc-glow": pal.glow,
    "--rcc-glow-a": pal.glowA,
    "--rcc-blush": pal.blush,
    "--rcc-lit": pal.lit,
    "--rcc-mouth": pal.mouth,
    "--rcc-sans": SANS_STACK,
    "--rcc-display": DISPLAY_STACK,
  } as React.CSSProperties

  const inkStroke = { stroke: "var(--rcc-ink)" }
  const gloveStyle = { fill: "var(--rcc-glove)", stroke: "var(--rcc-ink)" }
  const finger = (x: number, y: number, a: number, len: number) => (
    <rect x={-3.6} y={-len} width={7.2} height={len + 2} rx={3.6} transform={"translate(" + x + " " + y + ") rotate(" + a + ")"} style={gloveStyle} strokeWidth={2.4} />
  )
  const gloveShapes = (
    <>
      <g data-g="open">
        {finger(-9, -18, -24, 14)}
        {finger(-3, -21, -8, 16)}
        {finger(3.5, -21, 8, 16)}
        {finger(9.5, -18, 24, 13)}
        {finger(-10, -9, -70, 11)}
        <ellipse cx={0} cy={-13} rx={12} ry={10} style={gloveStyle} strokeWidth={2.4} />
      </g>
      <g data-g="point">
        {finger(-4, -18, -4, 20)}
        <ellipse cx={0} cy={-12} rx={11.5} ry={10} style={gloveStyle} strokeWidth={2.4} />
        <path d="M1 -19 Q4 -22 7 -18 M-9 -8 Q-2 -4 6 -7" fill="none" strokeWidth={2} strokeLinecap="round" style={inkStroke} />
      </g>
      <g data-g="fist">
        <ellipse cx={0} cy={-12} rx={12} ry={10.5} style={gloveStyle} strokeWidth={2.4} />
        <path d="M-8 -19 Q-5 -23 -1 -19 M1 -19 Q5 -23 8 -18" fill="none" strokeWidth={2} strokeLinecap="round" style={inkStroke} />
      </g>
      <rect x={-10} y={-5} width={20} height={9} rx={3.5} style={gloveStyle} strokeWidth={2.4} />
      <line x1={-8} x2={8} y1={-0.5} y2={-0.5} strokeWidth={1.6} style={inkStroke} />
    </>
  )
  const lashes = (cx: number, side: -1 | 1) =>
    [-128, -104, -80].map((deg, i) => {
      const a = ((side === -1 ? deg : -180 - deg) * Math.PI) / 180
      const x1 = cx + Math.cos(a) * 20
      const y1 = EYE_Y + Math.sin(a) * 28
      return (
        <line key={i} x1={r2(x1)} y1={r2(y1)} x2={r2(x1 + Math.cos(a) * 8)} y2={r2(y1 + Math.sin(a) * 8)} strokeWidth={3} strokeLinecap="round" style={inkStroke} />
      )
    })
  const eye = (s: "L" | "R", cx: number) => (
    <>
      <g ref={bind("eye" + s + "o")}>
        <ellipse cx={cx} cy={EYE_Y} rx={20} ry={28} fill="#fff" />
        <g clipPath={u("clip" + s)}>
          <g ref={bind("pup" + s)}>
            <ellipse cx={cx} cy={EYE_Y + 2} rx={11} ry={15.5} style={{ fill: "var(--rcc-ink)" }} />
            <ellipse cx={cx - 4} cy={EYE_Y - 5} rx={3.6} ry={4.8} fill="#fff" />
            <ellipse cx={cx + 4} cy={EYE_Y + 9} rx={1.8} ry={2.2} fill="#fff" opacity={0.7} />
          </g>
          <rect ref={bind("lid" + s)} x={cx - 24} y={138} width={48} height={0} style={{ fill: "var(--rcc-face)" }} />
          <line ref={bind("lidline" + s)} x1={cx - 24} x2={cx + 24} y1={138} y2={138} strokeWidth={3.5} opacity={0} style={inkStroke} />
        </g>
        <ellipse cx={cx} cy={EYE_Y} rx={20} ry={28} fill="none" strokeWidth={3.5} style={inkStroke} />
        {lashes(cx, s === "L" ? -1 : 1)}
      </g>
      <g ref={bind("eye" + s + "a")} transform={"translate(" + cx + " " + (EYE_Y - 2) + ")"} display="none">
        <path ref={bind("eye" + s + "ap")} className="rcc-eyearc" d={CLOSED_EYE} fill="none" strokeWidth={4.5} strokeLinecap="round" style={inkStroke} />
      </g>
    </>
  )

  const fx = (() => {
    const pop = (x: number, y: number, i: number, el: React.ReactNode, cls = "rcc-pop") => (
      <g key={i} transform={"translate(" + x + " " + y + ")"}>
        <g className={cls} style={{ animationDelay: i * 0.12 + "s" }}>
          {el}
        </g>
      </g>
    )
    const spark = <path d="M0 -11 L2.6 -2.6 L11 0 L2.6 2.6 L0 11 L-2.6 2.6 L-11 0 L-2.6 -2.6 Z" style={{ fill: "var(--rcc-accent)" }} />
    const heart = <path d="M0 6 C-14 -4 -8 -16 0 -9 C8 -16 14 -4 0 6 Z" style={{ fill: "var(--rcc-blush)" }} />
    const glyph = (c: string, size = 34) => (
      <text textAnchor="middle" fontSize={size} fontWeight={900} style={{ fill: "var(--rcc-text)", fontFamily: "var(--rcc-display)" }}>
        {c}
      </text>
    )
    switch (mood) {
      case "happy":
        return [[86, 108], [318, 80], [336, 246], [66, 236], [200, 58]].map(([x, y], i) => pop(x, y, i, spark))
      case "shy":
        return [[120, 176], [286, 164], [252, 104]].map(([x, y], i) => pop(x, y, i, heart, "rcc-float"))
      case "sleepy":
        return [[270, 110], [290, 92], [312, 74]].map(([x, y], i) => pop(x, y, i, glyph("z", 22 + i * 6), "rcc-zz"))
      case "shrug":
        return [pop(306, 92, 0, glyph("?"))]
      case "think":
        return [pop(300, 96, 0, glyph("?", 28), "rcc-float")]
      case "surprised":
        return [pop(316, 88, 0, glyph("!")), pop(84, 96, 1, glyph("!"))]
      case "dizzy":
        return (
          <g transform={"translate(" + CX + " 76)"}>
            <g className="rcc-orbit">
              {[0, 1, 2, 3].map((i) => (
                <g key={i} transform={"rotate(" + i * 90 + ") translate(58 0) scale(0.7)"}>
                  {spark}
                </g>
              ))}
            </g>
          </g>
        )
      case "stern":
        return [
          pop(300, 100, 0, (
            <path d="M-10 -3 Q-3 -3 -3 -10 M3 -10 Q3 -3 10 -3 M10 3 Q3 3 3 10 M-3 10 Q-3 3 -10 3" fill="none" stroke="#ff2d20" strokeWidth={4} strokeLinecap="round" />
          )),
        ]
      default:
        return null
    }
  })()

  return (
    <div
      ref={rootRef}
      className={"rcc-root" + (className ? " " + className : "")}
      style={style}
      data-mood={mood}
      data-boop={flags.boop || undefined}
      data-glitch={flags.glitch || undefined}
      data-holo={holo || undefined}
      onPointerMove={wake}
    >
      <style>{CSS}</style>

      <div className="rcc-emblem" aria-hidden="true">
        <span className="rcc-mark">{mark}</span>
        <span className="rcc-org">{org}</span>
      </div>
      <p className="rcc-motto" aria-hidden="true">
        {motto.split(/(?<=[.!?])\s+/).map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </p>

      <svg className="rcc-svg" viewBox="0 40 400 540" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id={id("halo")} cx="50%" cy="50%" r="50%">
            <stop offset="0" className="rcc-glowstop" stopOpacity={0.9} />
            <stop offset="0.5" className="rcc-glowstop" stopOpacity={0.38} />
            <stop offset="1" className="rcc-glowstop" stopOpacity={0} />
          </radialGradient>
          <radialGradient id={id("floor")} cx="50%" cy="50%" r="50%">
            <stop offset="0" className="rcc-glowstop" stopOpacity={0.5} />
            <stop offset="1" className="rcc-glowstop" stopOpacity={0} />
          </radialGradient>
          <radialGradient id={id("face")} cx="36%" cy="30%" r="78%">
            <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--rcc-face) 55%, #fff)" }} />
            <stop offset="0.5" style={{ stopColor: "var(--rcc-face)" }} />
            <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--rcc-face) 86%, #000)" }} />
          </radialGradient>
          <linearGradient id={id("reflg")} x1="0" y1={FLOOR} x2="0" y2="580" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity={0.55} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={id("refl")} maskUnits="userSpaceOnUse" x="0" y={FLOOR} width="400" height="170">
            <rect x="0" y={FLOOR} width="400" height="170" fill={u("reflg")} />
          </mask>
          <clipPath id={id("clipL")}>
            <ellipse cx={EYE_L} cy={EYE_Y} rx={20} ry={28} />
          </clipPath>
          <clipPath id={id("clipR")}>
            <ellipse cx={EYE_R} cy={EYE_Y} rx={20} ry={28} />
          </clipPath>
          <clipPath id={id("mouth")}>
            <path ref={bind("mouthClip")} d={mouthPath(24, 7, 0, 0)} />
          </clipPath>
        </defs>

        <circle className="rcc-halo" cx={CX} cy={CY + 6} r={196} fill={u("halo")} />
        <ellipse cx={CX} cy={FLOOR + 1} rx={128} ry={9} fill={u("floor")} />

        {reflection ? (
          <g mask={u("refl")} aria-hidden="true">
            <use href={"#" + id("fig")} transform={"translate(0 " + r2(FLOOR * (1 + REFLECT)) + ") scale(1 " + -REFLECT + ")"} opacity={0.6} />
          </g>
        ) : null}

        <g
          className="rcc-hit"
          role="button"
          tabIndex={0}
          aria-label={"Poke " + name}
          onClick={poke}
          onDoubleClick={() => react("happy", "dance", "double-click")}
          onPointerEnter={() => {
            hoverRef.current = true
          }}
          onPointerLeave={() => {
            hoverRef.current = false
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              poke()
            }
          }}
        >
          <circle cx={CX} cy={CY + 40} r={170} fill="transparent" />
          <g id={id("fig")} className="rcc-fig">
            {/* legs, behind everything */}
            <path ref={bind("legLo")} fill="none" strokeWidth={9} strokeLinecap="round" style={inkStroke} />
            <path ref={bind("legL")} fill="none" strokeWidth={4.4} strokeLinecap="round" style={{ stroke: "var(--rcc-leg)" }} />
            <path ref={bind("legRo")} fill="none" strokeWidth={9} strokeLinecap="round" style={inkStroke} />
            <path ref={bind("legR")} fill="none" strokeWidth={4.4} strokeLinecap="round" style={{ stroke: "var(--rcc-leg)" }} />
            <g ref={bind("shoes")}>
              {([[CX - 18, 1], [CX + 18, -1]] as const).map(([x, m]) => (
                <g key={x} transform={"translate(" + x + " 398) scale(" + m + " 1)"}>
                  <path
                    d="M5 -9 C3 -14 -6 -15 -13 -11 C-25 -6 -32 1 -30 7 C-28 12 -17 12 0 12 L9 12 C15 12 16 5 13 0 Z"
                    style={{ fill: "var(--rcc-shoe)", stroke: "var(--rcc-ink)" }}
                    strokeWidth={3.4}
                    strokeLinejoin="round"
                  />
                  <path d="M-29 8 Q-12 12 12 9" fill="none" strokeWidth={2} style={inkStroke} />
                  <ellipse cx={-17} cy={-3} rx={5} ry={2.4} fill="#fff" opacity={0.5} />
                </g>
              ))}
            </g>

            <g ref={bind("body")}>
              {/* arms: an ink hose with a coloured core, starting behind the dial */}
              <path ref={bind("armLo")} fill="none" strokeWidth={15} strokeLinecap="round" style={inkStroke} />
              <path ref={bind("armL")} fill="none" strokeWidth={9} strokeLinecap="round" style={{ stroke: "var(--rcc-limb)" }} />
              <path ref={bind("armRo")} fill="none" strokeWidth={15} strokeLinecap="round" style={inkStroke} />
              <path ref={bind("armR")} fill="none" strokeWidth={9} strokeLinecap="round" style={{ stroke: "var(--rcc-limb)" }} />

              {/* the dial: a disc with a visible edge, like a real clock face */}
              <circle cx={CX + 8} cy={CY + 4} r={108} strokeWidth={5} style={{ fill: "color-mix(in srgb, var(--rcc-face) 68%, #000)", stroke: "var(--rcc-ink)" }} />
              <circle ref={bind("face")} cx={CX} cy={CY} r={108} fill={u("face")} strokeWidth={5} style={inkStroke} />
              <circle cx={CX} cy={CY} r={101} fill="none" strokeWidth={1.6} opacity={0.35} style={inkStroke} />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * Math.PI) / 6
                const major = i % 3 === 0
                const r1 = major ? 80 : 89
                return (
                  <line
                    key={i}
                    className="rcc-tick"
                    x1={r2(CX + Math.sin(a) * r1)}
                    y1={r2(CY - Math.cos(a) * r1)}
                    x2={r2(CX + Math.sin(a) * 99)}
                    y2={r2(CY - Math.cos(a) * 99)}
                    strokeWidth={major ? 7 : 3.2}
                    strokeLinecap="round"
                    style={{ animationDelay: (i * 0.1).toFixed(1) + "s" }}
                  />
                )
              })}

              <g ref={bind("blush")} opacity={0.35}>
                <ellipse cx={138} cy={214} rx={15} ry={8} style={{ fill: "var(--rcc-blush)" }} opacity={0.55} />
                <ellipse cx={262} cy={214} rx={15} ry={8} style={{ fill: "var(--rcc-blush)" }} opacity={0.55} />
              </g>

              {eye("L", EYE_L)}
              {eye("R", EYE_R)}
              <path ref={bind("browL")} d="M-12 3 Q0 -5 12 3" fill="none" strokeWidth={3.6} strokeLinecap="round" style={inkStroke} />
              <path ref={bind("browR")} d="M-12 3 Q0 -5 12 3" fill="none" strokeWidth={3.6} strokeLinecap="round" style={inkStroke} />

              {/* the nose is the pivot the hands would turn on */}
              <circle cx={CX} cy={198} r={5.5} style={{ fill: "var(--rcc-ink)" }} />

              <path ref={bind("mouthFill")} d={mouthPath(24, 7, 0, 0)} style={{ fill: "var(--rcc-mouth)" }} />
              <g clipPath={u("mouth")}>
                <rect ref={bind("teeth")} x={176} y={228} width={48} height={0} fill="#fff" />
                <ellipse ref={bind("tongue")} cx={CX} cy={240} rx={12} ry={0} fill="#e0523f" />
              </g>
              <path ref={bind("mouthLine")} d={mouthPath(24, 7, 0, 0)} fill="none" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" style={inkStroke} />

              <g ref={bind("gloveL")} className="rcc-glove" data-shape="open" strokeLinejoin="round">
                {gloveShapes}
              </g>
              <g ref={bind("gloveR")} className="rcc-glove" data-shape="open" strokeLinejoin="round">
                {gloveShapes}
              </g>
            </g>
          </g>
          <circle className="rcc-focus" cx={CX} cy={CY} r={124} fill="none" strokeWidth={3} strokeDasharray="6 8" style={{ stroke: "var(--rcc-accent)" }} />
        </g>

        <g className="rcc-fx" key={fxKey} aria-hidden="true">
          {fx}
        </g>
      </svg>

      {quip ? (
        <div className="rcc-quip" key={quip.key} aria-hidden="true">
          {/* the full line holds the bubble's size, so it doesn't grow as she types */}
          <span className="rcc-ghost">{quip.text}</span>
          <span>{quip.text.slice(0, quip.n)}</span>
        </div>
      ) : null}
      <div className="rcc-sr" role="status" aria-live="polite">
        {quip ? name + ": " + quip.text : ""}
      </div>

      {controls ? (
        <div className="rcc-dock" role="toolbar" aria-label={"Make " + name + " react"}>
          {REACTIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className="rcc-chip"
              aria-pressed={mood === r.mood}
              onClick={() => react(r.mood, r.id, r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : null}
      {!poked ? (
        <span className="rcc-hint" data-dock={controls || undefined} aria-hidden="true">
          poke her · double-click to dance · scribble to make her dizzy
        </span>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------- css
   Every selector is scoped under .rcc-. The root is a size container, so
   the layout follows the box it is given rather than the viewport. */

const CSS = `
.rcc-root{position:relative;display:block;width:100%;overflow:hidden;container:rcc / size;background:var(--rcc-bg);color:var(--rcc-text);font-family:var(--rcc-sans);-webkit-font-smoothing:antialiased;isolation:isolate;line-height:1.4}
.rcc-root *,.rcc-root *::before,.rcc-root *::after{box-sizing:border-box}
.rcc-root[data-holo]::after{content:"";position:absolute;inset:0;z-index:4;pointer-events:none;background:repeating-linear-gradient(180deg,rgba(255,255,255,0.035) 0 1px,transparent 1px 4px);mix-blend-mode:screen;animation:rcc-scan 6s linear infinite}
.rcc-svg{position:absolute;left:0;right:0;top:40px;bottom:64px;display:block;width:100%;height:calc(100% - 104px);max-width:none;overflow:visible}
.rcc-emblem{position:absolute;top:16px;left:18px;z-index:2;display:flex;align-items:center;gap:10px;pointer-events:none}
.rcc-mark{display:grid;place-items:center;min-width:44px;height:36px;padding:0 9px;border-radius:4px;background:var(--rcc-accent);color:var(--rcc-accent-ink);font-family:var(--rcc-display);font-weight:900;font-size:19px;letter-spacing:-0.02em}
.rcc-org{max-width:16ch;font-size:10.5px;font-weight:700;letter-spacing:0.14em;line-height:1.2;text-transform:uppercase;color:var(--rcc-muted)}
.rcc-motto{display:none;position:absolute;left:0;right:0;top:max(7%,64px);z-index:1;margin:0;padding:0 24px;text-align:center;font-family:var(--rcc-display);font-weight:800;font-size:clamp(22px,4.2cqh,46px);line-height:1.08;color:var(--rcc-text);pointer-events:none}
.rcc-motto span{display:block}
.rcc-quip{position:absolute;left:50%;top:14%;z-index:3;max-width:min(80%,320px);padding:10px 15px;border-radius:18px;background:var(--rcc-face);color:var(--rcc-bubble-ink);font-weight:700;font-size:15px;line-height:1.3;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.28);transform:translateX(-50%);display:grid;pointer-events:none;animation:rcc-quip 0.3s cubic-bezier(0.2,1.4,0.4,1) both}
.rcc-quip>span{grid-area:1 / 1}
.rcc-ghost{visibility:hidden}
.rcc-quip::after{content:"";position:absolute;left:50%;bottom:-7px;width:14px;height:14px;background:inherit;transform:translateX(-50%) rotate(45deg);border-radius:2px}
.rcc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.rcc-dock{position:absolute;left:0;right:0;bottom:14px;z-index:3;display:flex;justify-content:center;gap:6px;padding:0 14px;overflow-x:auto;scrollbar-width:none}
.rcc-chip{flex:none;padding:7px 13px;border:1.5px solid var(--rcc-line);border-radius:999px;background:var(--rcc-chip);color:var(--rcc-text);font:inherit;font-size:13px;font-weight:700;cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:background-color 0.2s,transform 0.15s,border-color 0.2s}
.rcc-chip:hover{border-color:var(--rcc-accent)}
.rcc-chip:active{transform:scale(0.94)}
.rcc-chip[aria-pressed=true]{border-color:transparent;background:var(--rcc-accent);color:var(--rcc-accent-ink)}
.rcc-chip:focus-visible{outline:2px solid var(--rcc-accent);outline-offset:2px}
.rcc-hint{position:absolute;left:50%;bottom:14px;z-index:2;transform:translateX(-50%);font-size:10.5px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;color:var(--rcc-muted);pointer-events:none;animation:rcc-hint 2.4s ease-in-out infinite}
.rcc-hint[data-dock]{bottom:60px}
.rcc-hit{cursor:pointer;outline:none}
.rcc-focus{opacity:0;transition:opacity 0.2s}
.rcc-hit:focus-visible .rcc-focus{opacity:1}
.rcc-fig{transform-box:view-box;transform-origin:200px 300px}
.rcc-glowstop{stop-color:var(--rcc-glow-now,var(--rcc-glow))}
.rcc-halo{opacity:var(--rcc-glow-a)}
.rcc-tick{stroke:var(--rcc-ink)}
.rcc-glove>[data-g]{display:none}
.rcc-glove[data-shape=open]>[data-g=open],.rcc-glove[data-shape=point]>[data-g=point],.rcc-glove[data-shape=fist]>[data-g=fist]{display:inline}
.rcc-fx g,.rcc-eyearc{transform-box:fill-box;transform-origin:center}
.rcc-pop{animation:rcc-pop 1s cubic-bezier(0.2,1.4,0.4,1) both}
.rcc-float{animation:rcc-float 2.2s ease-out both}
.rcc-zz{animation:rcc-float 3s ease-out infinite}
.rcc-orbit{animation:rcc-spin 1.4s linear infinite}
.rcc-root[data-mood=dizzy] .rcc-eyearc{animation:rcc-spin 0.7s linear infinite}
.rcc-root[data-holo] .rcc-fig{animation:rcc-flicker 8s steps(1) infinite}
.rcc-root[data-mood=think] .rcc-tick{animation:rcc-tick 1.2s linear infinite}
.rcc-root[data-mood=stern]{--rcc-glow-now:#ff2d20}
.rcc-root[data-mood=stern] .rcc-halo{opacity:0.7;animation:rcc-throb 0.9s ease-in-out infinite}
.rcc-root[data-boop] .rcc-fig{animation:rcc-boop 0.45s cubic-bezier(0.3,1.6,0.5,1)}
.rcc-root[data-glitch] .rcc-fig{animation:rcc-glitch 0.55s steps(2) 2}
@container rcc (min-height: 620px){
.rcc-motto{display:block}
.rcc-svg{top:max(22%,150px);height:calc(100% - max(22%,150px) - 64px)}
.rcc-quip{top:max(20%,138px)}
}
@container rcc (max-width: 520px){
.rcc-dock{justify-content:flex-start}
.rcc-hint{display:none}
}
@keyframes rcc-tick{0%{stroke:var(--rcc-lit)}30%,100%{stroke:var(--rcc-ink)}}
@keyframes rcc-glitch{0%{transform:translate(-6px,2px) skewX(7deg);filter:drop-shadow(5px 0 0 #ff2d20) drop-shadow(-5px 0 0 #2de1ff)}50%{transform:translate(5px,-3px) skewX(-5deg);filter:drop-shadow(-4px 0 0 #ff2d20)}100%{transform:none;filter:none}}
@keyframes rcc-boop{0%{transform:scale(1,1)}30%{transform:scale(1.07,0.9)}60%{transform:scale(0.96,1.05)}100%{transform:scale(1,1)}}
@keyframes rcc-flicker{0%,100%{opacity:1}46%{opacity:0.82}47%{opacity:1}82%{opacity:0.9}83%{opacity:1}}
@keyframes rcc-throb{50%{opacity:0.35}}
@keyframes rcc-spin{to{transform:rotate(360deg)}}
@keyframes rcc-pop{0%{opacity:0;transform:scale(0) rotate(-40deg)}40%{opacity:1;transform:scale(1.25) rotate(0deg)}100%{opacity:0;transform:scale(0.7) translateY(-16px)}}
@keyframes rcc-float{0%{opacity:0;transform:translate(0,0) scale(0.6)}20%{opacity:1}100%{opacity:0;transform:translate(12px,-50px) scale(1.1)}}
@keyframes rcc-quip{from{opacity:0;transform:translateX(-50%) translateY(10px) scale(0.85)}to{opacity:1;transform:translateX(-50%)}}
@keyframes rcc-hint{50%{opacity:0.45}}
@keyframes rcc-scan{to{background-position:0 40px}}
@media (prefers-reduced-motion: reduce){
.rcc-root *,.rcc-root *::before,.rcc-root *::after{animation:none !important;transition:none !important}
}
`
