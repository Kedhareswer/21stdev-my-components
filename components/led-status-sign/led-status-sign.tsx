"use client"

import * as React from "react"

/**
 * LED Status Sign — a desk "ON CALL" light: a brushed-metal bar with a black
 * glass face, a dot-matrix of red LEDs behind it, white pixels for the words,
 * a little knurled dial on top and a push bar for power.
 *
 * Nothing is downloaded. The housing is CSS + one inline SVG, the matrix is
 * painted dot by dot on a 2D canvas from a built-in bold pixel font and pixel
 * icons, with a blurred twin canvas for the bloom.
 *
 * Interaction: turn the dial (click, wheel) or press the pips on the glass to
 * change status; press the bar on top for power; double-click the glass (or
 * focus it and press Enter) to type your own words. Arrow keys / Space also
 * step through statuses. The device leans toward the pointer and the LEDs
 * under it brighten like a hand held over the panel.
 *
 * Pauses while the tab is hidden or the sign is off screen. Honours
 * prefers-reduced-motion: no lean, no blink or pulse, transitions cut, and
 * long messages page instead of scrolling.
 */

export type LedIconName =
  | "mic"
  | "phone"
  | "video"
  | "coffee"
  | "focus"
  | "dnd"
  | "check"
  | "moon"
  | "heart"
  | "rec"
  | "music"

export type LedEffect = "auto" | "static" | "scroll" | "blink" | "pulse"
export type LedTransition = "roll" | "wipe" | "dissolve" | "cut"
export type LedPaletteName = "crimson" | "amber" | "lime" | "ice" | "violet" | "mono"
/** A named palette, or your own pair: `lit` for the words, `dim` for the idle LEDs. Hex. */
export type LedPalette = LedPaletteName | { lit: string; dim: string }
export type LedFinish = "silver" | "graphite" | "white"

export type LedStatus = {
  /** What the sign says. A–Z, 0–9 and common punctuation; anything else shows as "?". */
  text: string
  /** A built-in icon, your own bitmap ("#" = lit, any other char = off, one string per row), or null. */
  icon?: LedIconName | string[] | null
  /** "auto" holds still when it fits and scrolls when it does not. */
  effect?: LedEffect
  /** Overrides the sign's palette while this status is up. */
  palette?: LedPalette
}

export type LedStatusSignProps = {
  /** The statuses the dial steps through. */
  statuses?: LedStatus[]
  /** Controlled status index. */
  index?: number
  /** Uncontrolled starting index. */
  defaultIndex?: number
  /** Called whenever the dial, pips, keys or auto-cycle move to another status. */
  onIndexChange?: (index: number) => void
  /** LED colours. Per-status `palette` wins. */
  palette?: LedPalette
  /** Housing finish. */
  finish?: LedFinish
  /** Matrix columns. */
  cols?: number
  /** Matrix rows. 13 fits the 9-dot font and 11-dot icons with a margin. */
  rows?: number
  /** How one status replaces the next. */
  transition?: LedTransition
  /** Marquee speed, dots per second. */
  scrollSpeed?: number
  /** Seconds between automatic status changes. 0 = never. Pauses on hover and while editing. */
  autoCycle?: number
  /** Controlled power. */
  powered?: boolean
  /** Uncontrolled starting power. */
  defaultPowered?: boolean
  /** Called when the push bar toggles power. */
  onPowerChange?: (on: boolean) => void
  /** Double-click / Enter lets the viewer write on the sign. */
  editable?: boolean
  /** Called with the status index and its new text after an edit is committed. */
  onTextChange?: (index: number, text: string) => void
  /** Lean the device toward the pointer. */
  tilt?: boolean
  /** "studio" is the grey sweep (dark under `.dark`), "none" is transparent, anything else is used as a CSS background. */
  backdrop?: "studio" | "none" | (string & {})
  /** Upper bound for the device width, CSS px. */
  maxWidth?: number
  /** Accessible name for the sign. */
  label?: string
  /**
   * Explicit height. The stage centres the device in this box, so it must be
   * a definite length — "100%" only works if every ancestor also has one,
   * which an installed page usually does not.
   */
  height?: string
  className?: string
  /** Rendered above the stage (captions, a nav). */
  children?: React.ReactNode
}

// #region matrix
export type Bitmap = {
  w: number
  h: number
  /** 1 where a dot is lit. Row-major, w × h. */
  bits: Uint8Array
  /** What lit each dot: 1 = text, 2 = icon. Effects treat them apart. */
  tag: Uint8Array
}

/**
 * A bold 7-row pixel font with two-dot vertical strokes. Rows are "/"
 * separated; "#" is lit. Widths vary (I and 1 are narrow, M and W wide).
 */
const FONT: Record<string, string> = {
  A: ".####./##..##/##..##/######/##..##/##..##/##..##",
  B: "#####./##..##/##..##/#####./##..##/##..##/#####.",
  C: ".####./##..##/##..../##..../##..../##..##/.####.",
  D: "####../##.##./##..##/##..##/##..##/##.##./####..",
  E: "######/##..../##..../#####./##..../##..../######",
  F: "######/##..../##..../#####./##..../##..../##....",
  G: ".####./##..##/##..../##.###/##..##/##..##/.#####",
  H: "##..##/##..##/##..##/######/##..##/##..##/##..##",
  I: "####/.##./.##./.##./.##./.##./####",
  J: "..####/....##/....##/....##/##..##/##..##/.####.",
  K: "##..##/##.##./####../###.../####../##.##./##..##",
  L: "##..../##..../##..../##..../##..../##..../######",
  M: "##...##/###.###/#######/##.#.##/##...##/##...##/##...##",
  N: "##..##/###.##/######/##.###/##..##/##..##/##..##",
  O: ".####./##..##/##..##/##..##/##..##/##..##/.####.",
  P: "#####./##..##/##..##/#####./##..../##..../##....",
  Q: ".####./##..##/##..##/##..##/##.###/##.##./.##.##",
  R: "#####./##..##/##..##/#####./####../##.##./##..##",
  S: ".####./##..##/##..../.####./....##/##..##/.####.",
  T: "######/..##../..##../..##../..##../..##../..##..",
  U: "##..##/##..##/##..##/##..##/##..##/##..##/.####.",
  V: "##..##/##..##/##..##/##..##/##..##/.####./..##..",
  W: "##...##/##...##/##...##/##.#.##/#######/###.###/##...##",
  X: "##..##/##..##/.####./..##../.####./##..##/##..##",
  Y: "##..##/##..##/##..##/.####./..##../..##../..##..",
  Z: "######/....##/...##./..##../.##.../##..../######",
  "0": ".####./##..##/##.###/######/###.##/##..##/.####.",
  "1": ".##./###./.##./.##./.##./.##./####",
  "2": ".####./##..##/....##/...##./..##../.##.../######",
  "3": ".####./##..##/....##/..###./....##/##..##/.####.",
  "4": "...##./..###./.####./##.##./######/...##./...##.",
  "5": "######/##..../#####./....##/....##/##..##/.####.",
  "6": "..###./.##.../##..../#####./##..##/##..##/.####.",
  "7": "######/....##/...##./..##../.##.../.##.../.##...",
  "8": ".####./##..##/##..##/.####./##..##/##..##/.####.",
  "9": ".####./##..##/##..##/.#####/....##/...##./.###..",
  " ": "../../../../../../..",
  "!": "##/##/##/##/##/../##",
  "?": ".####./##..##/....##/...##./..##../....../..##..",
  ".": "../../../../../../##",
  ",": "../../../../../##/.#",
  ":": "../##/##/../##/##/..",
  ";": "../##/##/../##/##/.#",
  "-": "..../..../..../####/..../..../....",
  "+": "....../..##../..##../######/..##../..##../......",
  "=": "....../....../######/....../######/....../......",
  _: "....../....../....../....../....../....../######",
  "'": "##/##/.#/../../../..",
  '"': "##.##/##.##/.#..#/...../...../...../.....",
  "/": "....##/....##/...##./..##../.##.../##..../##....",
  "(": ".##/##./##./##./##./##./.##",
  ")": "##./.##/.##/.##/.##/.##/##.",
  "<": "...##/..##./.##../##.../.##../..##./...##",
  ">": "##.../.##../..##./...##/..##./.##../##...",
  "%": "##..##/##.##./...##./..##../.##.../.##.##/##..##",
  "#": ".##.##/######/.##.##/.##.##/.##.##/######/.##.##",
  "&": ".###../##.##./.###../.###.#/##.###/##.##./.###.#",
  "@": ".####./##..##/##.###/##.###/##.##./##..../.####.",
}

const FONT_ROWS = 7
/** Drawn twice, so the top and bottom strokes come out two dots thick like the sides. */
const DOUBLED_ROWS = [0, 6]
const GLYPH_H = FONT_ROWS + DOUBLED_ROWS.length

/** Pixel icons, up to 11 rows. Same encoding as the font. */
const ICONS: Record<LedIconName, string> = {
  mic: "...###.../..#####../..##.##../..#####../#.##.##.#/#.#####.#/#..###..#/.##...##./...###.../....#..../..#####..",
  phone: ".##......./####....../####....../.##......./.##......./..##....../..###...../...####.##/....######/......###.",
  video: ".#######..../#########..#/#########.##/############/#########.##/#########..#/.#######....",
  coffee: "..#..#..#.../.#..#..#..../..#..#..#.../............/#########.../############/#########..#/#########..#/############/.#######..../..#####.....",
  focus: "....####/...####./..####../.####.../########/...####./..####../.####.../.###..../.##...../.#......",
  dnd: "...#####.../.#########./.#########./###########/##.......##/##.......##/###########/.#########./.#########./...#####...",
  check: ".........##/........###/.......###./##....###../###..###.../.######..../..####...../...##......",
  moon: "...####../.####..../.###...../###....../###....../###....../####...../.####...#/..#######/...####..",
  heart: ".###...###./#####.#####/###########/###########/.#########./..#######../...#####.../....###..../.....#.....",
  rec: "...###.../.#######./.#######./#########/#########/#########/.#######./.#######./...###...",
  music: "...########/...########/...##....##/...##....##/...##....##/...##....##/.####..####/#####.#####/#####.#####/.###...###.",
}

const ICON_GAP = 3

function glyphRows(ch: string): string[] {
  const src = FONT[ch.toUpperCase()] ?? FONT["?"]
  const out: string[] = []
  src.split("/").forEach((row, i) => {
    out.push(row)
    if (DOUBLED_ROWS.includes(i)) out.push(row)
  })
  return out
}

function resolveIcon(icon: LedIconName | string[] | null | undefined): string[] | null {
  if (!icon) return null
  if (Array.isArray(icon)) return icon.length ? icon : null
  const src = ICONS[icon]
  return src ? src.split("/") : null
}

/** Icon, gap, then the text, as one bitmap the height of the matrix. Both vertically centred. */
function composeMessage(text: string, icon: string[] | null, rows: number, spacing = 1): Bitmap {
  const glyphs = [...text].map(glyphRows)
  const iconW = icon ? Math.max(0, ...icon.map((r) => r.length)) : 0
  let w = iconW + (iconW && glyphs.length ? ICON_GAP : 0)
  glyphs.forEach((g, i) => {
    w += g[0].length + (i ? spacing : 0)
  })
  const bits = new Uint8Array(w * rows)
  const tag = new Uint8Array(w * rows)
  const put = (x: number, y: number, t: number) => {
    if (x < 0 || x >= w || y < 0 || y >= rows) return
    bits[y * w + x] = 1
    tag[y * w + x] = t
  }
  if (icon) {
    const oy = Math.floor((rows - icon.length) / 2)
    icon.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === "#") put(x, oy + y, 2)
    })
  }
  let x = iconW + (iconW && glyphs.length ? ICON_GAP : 0)
  const oy = Math.floor((rows - GLYPH_H) / 2)
  glyphs.forEach((g, i) => {
    if (i) x += spacing
    g.forEach((row, y) => {
      for (let cx = 0; cx < row.length; cx++) if (row[cx] === "#") put(x + cx, oy + y, 1)
    })
    x += g[0].length
  })
  return { w, h: rows, bits, tag }
}

/**
 * Where to draw a message `w` dots wide at time `t` (s): one x when it holds
 * still, two when it loops as a marquee. Scrolling steps whole dots, like a
 * real panel. Reduced motion pages instead of scrolling.
 */
function placements(
  w: number,
  cols: number,
  effect: LedEffect | "edit",
  t: number,
  speed: number,
  reduced: boolean,
): number[] {
  const fits = w <= cols - 2
  if (effect === "edit") return [fits ? Math.floor((cols - w) / 2) : cols - 2 - w]
  if (fits && effect !== "scroll") return [Math.floor((cols - w) / 2)]
  const gap = Math.max(8, Math.round(cols / 3))
  const period = w + gap
  if (reduced) {
    const page = Math.max(8, cols - 8)
    const pages = Math.ceil(period / page)
    const x = 1 - (Math.floor(t / 2.6) % pages) * page
    return [x, x + period]
  }
  const travel = Math.floor(Math.max(0, t) * speed) % period
  const x = cols - travel
  return [x, x - period]
}

/** Stamp a bitmap into a cols × rows frame at column x0, keeping the brighter value. */
function blit(
  out: Float32Array,
  cols: number,
  rows: number,
  bm: Bitmap,
  x0: number,
  textLevel = 1,
  iconLevel = 1,
) {
  const h = Math.min(rows, bm.h)
  for (let y = 0; y < h; y++) {
    for (let cx = 0; cx < bm.w; cx++) {
      const x = x0 + cx
      if (x < 0 || x >= cols) continue
      const k = y * bm.w + cx
      if (!bm.bits[k]) continue
      const v = bm.tag[k] === 2 ? iconLevel : textLevel
      const i = y * cols + x
      if (v > out[i]) out[i] = v
    }
  }
}

function hash01(n: number) {
  let h = Math.imul(n ^ 0x5bd1e995, 0x27d4eb2d)
  h ^= h >>> 15
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  return (h >>> 0) / 4294967296
}

const smooth = (v: number) => v * v * (3 - 2 * v)

/**
 * Frame `out` partway (p, 0..1) from frame a to frame b.
 * roll: every column spins up like a split-flap drum, left to right.
 * wipe: a lit bar sweeps across and leaves the new message behind it.
 * dissolve: dots flip over in a fixed random order.
 */
function mixFrames(
  a: Float32Array,
  b: Float32Array,
  out: Float32Array,
  cols: number,
  rows: number,
  p: number,
  kind: LedTransition,
) {
  const q = Math.min(1, Math.max(0, p))
  if (kind === "cut" || q >= 1) {
    out.set(b)
    return
  }
  if (q <= 0) {
    out.set(a)
    return
  }
  if (kind === "dissolve") {
    for (let i = 0; i < out.length; i++) out[i] = hash01(i) < q ? b[i] : a[i]
    return
  }
  if (kind === "wipe") {
    const edge = q * (cols + 4) - 2
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        out[i] = x < edge ? b[i] : a[i]
        const d = Math.abs(x - edge)
        if (d < 1.5) out[i] = Math.max(out[i], 0.9 * (1 - d / 1.5))
      }
    }
    return
  }
  // roll
  const travel = rows + 1
  for (let x = 0; x < cols; x++) {
    const local = Math.min(1, Math.max(0, (q - (x / cols) * 0.35) / 0.65))
    const shift = Math.round(smooth(local) * travel)
    for (let y = 0; y < rows; y++) {
      const src = y + shift
      out[y * cols + x] = src < rows ? a[src * cols + x] : src === rows ? 0 : b[(src - rows - 1) * cols + x]
    }
  }
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "")
  if (h.length === 3) h = h.replace(/./g, "$&$&")
  const n = /^[0-9a-f]{6}$/i.test(h) ? parseInt(h, 16) : 0
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const PALETTES: Record<LedPaletteName, { lit: string; dim: string }> = {
  crimson: { lit: "#fff3f0", dim: "#e0222c" },
  amber: { lit: "#fff6df", dim: "#ef8410" },
  lime: { lit: "#f3ffe8", dim: "#3fbf2e" },
  ice: { lit: "#eef8ff", dim: "#2479ee" },
  violet: { lit: "#fbf1ff", dim: "#9534ea" },
  mono: { lit: "#ffffff", dim: "#5d5d64" },
}

function resolvePalette(p: LedPalette | undefined) {
  const src = !p ? PALETTES.crimson : typeof p === "string" ? PALETTES[p] ?? PALETTES.crimson : p
  return { lit: hexToRgb(src.lit), dim: hexToRgb(src.dim) }
}
// #endregion

const DEFAULT_STATUSES: LedStatus[] = [
  { text: "ON CALL", icon: "mic" },
  { text: "IN A MEETING", icon: "video" },
  { text: "FOCUS", icon: "focus", palette: "amber" },
  { text: "BRB", icon: "coffee", effect: "blink" },
  { text: "DO NOT DISTURB", icon: "dnd" },
  { text: "ON AIR", icon: "rec", effect: "pulse" },
  { text: "FREE", icon: "check", palette: "lime" },
]

const FINISHES: Record<LedFinish, [string, string, string, string]> = {
  silver: ["#fdfdfd", "#d9d9dd", "#aeaeb4", "#87878d"],
  graphite: ["#9a9aa1", "#55555c", "#2f2f34", "#1c1c20"],
  white: ["#ffffff", "#f1f0ed", "#d8d6d0", "#b5b2aa"],
}

type Want = {
  key: string
  bm: Bitmap
  effect: LedEffect | "edit"
  editing: boolean
  lit: [number, number, number]
  dim: [number, number, number]
  power: boolean
  transition: LedTransition
  speed: number
  reduced: boolean
  pointer: { x: number; y: number } | null
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

const clampInt = (v: number, lo: number, hi: number) => Math.round(Math.min(hi, Math.max(lo, v || lo)))
const to255 = (c: [number, number, number]) => c.map((v) => Math.round(v * 255)).join(" ")

export default function LedStatusSign({
  statuses = DEFAULT_STATUSES,
  index,
  defaultIndex = 0,
  onIndexChange,
  palette = "crimson",
  finish = "silver",
  cols: colsProp = 64,
  rows: rowsProp = 13,
  transition = "roll",
  scrollSpeed = 16,
  autoCycle = 0,
  powered,
  defaultPowered = true,
  onPowerChange,
  editable = true,
  onTextChange,
  tilt = true,
  backdrop = "studio",
  maxWidth = 820,
  label = "LED status sign",
  height = "100svh",
  className = "",
  children,
}: LedStatusSignProps) {
  const cols = clampInt(colsProp, 16, 160)
  const rows = clampInt(rowsProp, 7, 24)
  const list = statuses.length ? statuses : [{ text: "" }]
  const n = list.length
  const reduced = useReducedMotion()

  const [innerIndex, setInnerIndex] = React.useState(defaultIndex)
  const idx = (((index ?? innerIndex) % n) + n) % n
  const [innerPower, setInnerPower] = React.useState(defaultPowered)
  const on = powered ?? innerPower
  const [edits, setEdits] = React.useState<Record<number, string>>({})
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const [turns, setTurns] = React.useState(0)
  const [hover, setHover] = React.useState(false)

  const rootRef = React.useRef<HTMLElement>(null)
  const deviceRef = React.useRef<HTMLDivElement>(null)
  const glassRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const glowRef = React.useRef<HTMLCanvasElement>(null)
  const knobRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const status = list[idx]
  const text = edits[idx] ?? status.text
  const icon = React.useMemo(() => resolveIcon(status.icon), [status.icon])
  const iconKey = Array.isArray(status.icon) ? status.icon.join("/") : status.icon ?? ""
  const shown = editing ? draft : text
  const bm = React.useMemo(() => composeMessage(shown, icon, rows), [shown, icon, rows])
  const effect: LedEffect | "edit" = editing ? "edit" : status.effect ?? "auto"
  const pal = resolvePalette(status.palette ?? palette)
  const metal = FINISHES[finish] ?? FINISHES.silver

  // Everything the frame loop reads, refreshed every render. The loop never
  // restarts for a prop change; it notices the new key and transitions.
  const want = React.useRef<Want>(null as unknown as Want)
  const pointer = want.current?.pointer ?? null
  want.current = {
    key: (editing ? "edit:" + draft : idx + "|" + text + "|" + iconKey + "|" + effect) + "|" + rows,
    bm,
    effect,
    editing,
    lit: pal.lit,
    dim: pal.dim,
    power: on,
    transition: reduced ? "cut" : transition,
    speed: Math.max(1, scrollSpeed),
    reduced,
    pointer,
  }

  const idxRef = React.useRef(idx)
  idxRef.current = idx
  const onIndexChangeRef = React.useRef(onIndexChange)
  onIndexChangeRef.current = onIndexChange

  const go = React.useCallback(
    (delta: number) => {
      const next = (((idxRef.current + delta) % n) + n) % n
      setInnerIndex(next)
      setTurns((t) => t + delta)
      onIndexChangeRef.current?.(next)
    },
    [n],
  )

  const togglePower = () => {
    setInnerPower(!on)
    setEditing(false)
    onPowerChange?.(!on)
  }

  const startEdit = () => {
    if (!editable || !on) return
    setDraft(text)
    setEditing(true)
  }

  const finishEdit = (commit: boolean) => {
    if (!editing) return
    setEditing(false)
    if (!commit) return
    const next = draft.replace(/\s+/g, " ").trim()
    setEdits((prev) => {
      const copy = { ...prev }
      if (!next || next === status.text) delete copy[idx]
      else copy[idx] = next
      return copy
    })
    if (next && next !== text) onTextChange?.(idx, next)
  }

  React.useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  // Auto-cycle, held while hovered, editing or off.
  React.useEffect(() => {
    if (!autoCycle || autoCycle <= 0 || editing || hover || !on || n < 2) return
    const id = window.setInterval(() => go(1), autoCycle * 1000)
    return () => window.clearInterval(id)
  }, [autoCycle, editing, hover, on, n, go])

  // The dial takes the wheel without scrolling the page.
  React.useEffect(() => {
    const knob = knobRef.current
    if (!knob) return
    let acc = 0
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      acc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      if (Math.abs(acc) < 40) return
      go(acc > 0 ? 1 : -1)
      acc = 0
    }
    knob.addEventListener("wheel", onWheel, { passive: false })
    return () => knob.removeEventListener("wheel", onWheel)
  }, [go])

  // The frame loop: compose, transition, smooth, paint.
  React.useEffect(() => {
    const canvas = canvasRef.current
    const glow = glowRef.current
    const panel = panelRef.current
    const root = rootRef.current
    if (!canvas || !glow || !panel || !root) return
    const ctx = canvas.getContext("2d")
    const gctx = glow.getContext("2d")
    if (!ctx || !gctx) return

    const size = cols * rows
    const frameA = new Float32Array(size)
    const frameB = new Float32Array(size)
    const target = new Float32Array(size)
    const levels = new Float32Array(size)
    // Per-dot character: a little brightness scatter, and a panel that is
    // brighter in the middle than at its edges.
    const jitter = new Float32Array(size)
    const vignette = new Float32Array(size)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        jitter[i] = 0.84 + hash01(i * 7 + 3) * 0.3
        const dx = (x + 0.5) / cols - 0.5
        const dy = (y + 0.5) / rows - 0.5
        vignette[i] = Math.max(0.35, 1 - 1.1 * dx * dx - 1.3 * dy * dy)
      }
    }

    type Scene = { key: string; bm: Bitmap; effect: LedEffect | "edit"; t0: number }
    let cur: Scene | null = null
    let prev: Scene | null = null
    let transStart = 0
    let transKind: LedTransition = "cut"
    let wasOn = want.current.power
    let wasEditing = false
    let powerLv = wasOn ? 1 : 0
    const lit = [...want.current.lit] as [number, number, number]
    const dim = [...want.current.dim] as [number, number, number]
    let raf = 0
    let last = performance.now()
    let dirty = true
    let visible = true
    let lastPointer: Want["pointer"] = null

    const resize = () => {
      const r = panel.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(2, Math.round(r.width * dpr))
      const h = Math.max(2, Math.round(r.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        glow.width = Math.max(2, Math.round(w / 2))
        glow.height = Math.max(2, Math.round(h / 2))
      }
      glow.style.filter = "blur(" + ((r.width / cols) * 0.75).toFixed(2) + "px)"
      dirty = true
    }

    const scene = (s: Scene | null, now: number, out: Float32Array, reduced: boolean, speed: number) => {
      out.fill(0)
      if (!s) return
      const t = now - s.t0
      const textLevel = s.effect === "blink" && !reduced ? ((t % 1.1) < 0.7 ? 1 : 0.04) : 1
      const iconLevel = s.effect === "pulse" && !reduced ? 0.25 + 0.75 * (0.5 + 0.5 * Math.cos(t * Math.PI * 1.4)) : 1
      const xs = placements(s.bm.w, cols, s.effect, t, speed, reduced)
      for (const x of xs) blit(out, cols, rows, s.bm, x, textLevel, iconLevel)
      if (s.effect === "edit" && (reduced || t % 1.05 < 0.6)) {
        const cx = xs[0] + s.bm.w + (s.bm.w ? 1 : 0)
        const top = Math.max(0, Math.floor((rows - GLYPH_H) / 2))
        for (let y = top; y < Math.min(rows, top + GLYPH_H); y++) {
          if (cx >= 0 && cx < cols) out[y * cols + cx] = 1
        }
      }
    }

    const paint = (pointer: Want["pointer"]) => {
      const W = canvas.width
      const H = canvas.height
      const pw = W / cols
      const ph = H / rows
      const dot = Math.min(pw, ph) * 0.8
      const bead = Math.min(pw, ph) * 0.36
      const rad = dot * 0.22
      const rounded = typeof ctx.roundRect === "function"
      const gw = glow.width / cols
      const gh = glow.height / rows
      const P = powerLv
      ctx.fillStyle = "rgb(" + [dim[0] * 22 * P + 3, dim[1] * 22 * P + 2, dim[2] * 22 * P + 2].map(Math.round).join(",") + ")"
      ctx.fillRect(0, 0, W, H)
      gctx.clearRect(0, 0, glow.width, glow.height)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          const L = levels[i] * P
          let halo = 1
          if (pointer) {
            const dx = x + 0.5 - pointer.x
            const dy = (y + 0.5 - pointer.y) * 1.1
            halo += 0.85 * Math.exp(-(dx * dx + dy * dy) / 20)
          }
          const b = 0.74 * vignette[i] * jitter[i] * halo * P
          const r = dim[0] * b * (1 - L) + lit[0] * L
          const g = dim[1] * b * (1 - L) + lit[1] * L
          const bl = dim[2] * b * (1 - L) + lit[2] * L
          const px = x * pw + (pw - dot) / 2
          const py = y * ph + (ph - dot) / 2
          ctx.fillStyle = "rgb(" + Math.round(r * 255) + "," + Math.round(g * 255) + "," + Math.round(bl * 255) + ")"
          if (rounded) {
            ctx.beginPath()
            ctx.roundRect(px, py, dot, dot, rad)
            ctx.fill()
          } else ctx.fillRect(px, py, dot, dot)
          // The bright bead in the middle of every LED.
          if (L < 0.5 && b > 0.02) {
            const k = Math.min(1, b * 1.55)
            ctx.fillStyle = "rgb(" + Math.round(Math.min(1, dim[0] * k + 0.06 * k) * 255) + "," + Math.round(dim[1] * k * 255) + "," + Math.round(dim[2] * k * 255) + ")"
            ctx.fillRect(x * pw + (pw - bead) / 2, y * ph + (ph - bead) / 2, bead, bead)
          }
          if (L > 0.03) {
            gctx.fillStyle = "rgba(" + Math.round(lit[0] * 255) + "," + Math.round(lit[1] * 255) + "," + Math.round(lit[2] * 255) + "," + Math.min(1, L * 0.6).toFixed(3) + ")"
            gctx.fillRect(x * gw, y * gh, gw, gh)
          } else if (b > 0.02) {
            gctx.fillStyle = "rgba(" + Math.round(dim[0] * 255) + "," + Math.round(dim[1] * 255) + "," + Math.round(dim[2] * 255) + "," + (b * 0.38).toFixed(3) + ")"
            gctx.fillRect(x * gw, y * gh, gw, gh)
          }
        }
      }
    }

    const tick = () => {
      raf = 0
      const nowMs = performance.now()
      const dt = Math.min(0.1, (nowMs - last) / 1000)
      last = nowMs
      const now = nowMs / 1000
      const w = want.current

      if (!cur || w.key !== cur.key) {
        prev = cur
        transKind = w.editing || wasEditing || !prev ? "cut" : w.transition
        cur = { key: w.key, bm: w.bm, effect: w.effect, t0: now }
        transStart = now
      }
      wasEditing = w.editing
      if (w.power && !wasOn) {
        // Boot: the message sparkles in from a blank panel.
        prev = null
        transKind = w.reduced ? "cut" : "dissolve"
        transStart = now
        if (cur) cur.t0 = now
      }
      wasOn = w.power

      scene(cur, now, frameB, w.reduced, w.speed)
      const dur = transKind === "dissolve" ? 0.75 : transKind === "wipe" ? 0.7 : 0.62
      const p = (now - transStart) / dur
      if (p < 1 && transKind !== "cut") {
        if (prev) scene(prev, now, frameA, w.reduced, w.speed)
        else frameA.fill(0)
        mixFrames(frameA, frameB, target, cols, rows, p, transKind)
      } else {
        target.set(frameB)
        prev = null
      }

      let moved = 0
      const rise = w.reduced ? 1 : 1 - Math.exp(-dt / 0.035)
      const fall = w.reduced ? 1 : 1 - Math.exp(-dt / 0.11)
      for (let i = 0; i < size; i++) {
        const d = target[i] - levels[i]
        if (d === 0) continue
        const step = d * (d > 0 ? rise : fall)
        levels[i] = Math.abs(d) < 0.002 ? target[i] : levels[i] + step
        moved = Math.max(moved, Math.abs(step))
      }

      const pk = w.reduced ? 1 : 1 - Math.exp(-dt / 0.09)
      const pTarget = w.power ? 1 : 0
      if (powerLv !== pTarget) {
        powerLv = Math.abs(pTarget - powerLv) < 0.003 ? pTarget : powerLv + (pTarget - powerLv) * pk
        moved = 1
      }

      const ck = w.reduced ? 1 : 1 - Math.exp(-dt / 0.2)
      let tint = 0
      for (let c = 0; c < 3; c++) {
        const dl = w.lit[c] - lit[c]
        const dd = w.dim[c] - dim[c]
        lit[c] = Math.abs(dl) < 0.002 ? w.lit[c] : lit[c] + dl * ck
        dim[c] = Math.abs(dd) < 0.002 ? w.dim[c] : dim[c] + dd * ck
        tint = Math.max(tint, Math.abs(dl), Math.abs(dd))
      }
      if (tint > 0 || dirty) {
        root.style.setProperty("--lss-lit", to255(lit))
        root.style.setProperty("--lss-dim", to255(dim))
        root.style.setProperty("--lss-power", powerLv.toFixed(3))
      }
      if (moved) root.style.setProperty("--lss-power", powerLv.toFixed(3))

      const pointerMoved = w.pointer !== lastPointer
      lastPointer = w.pointer
      if (dirty || moved > 0.0005 || tint > 0 || pointerMoved) {
        paint(w.pointer)
        dirty = false
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    const onVisibility = () => (document.hidden ? (cancelAnimationFrame(raf), (raf = 0)) : wake())
    const ro = new ResizeObserver(() => {
      resize()
      wake()
    })
    ro.observe(panel)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) wake()
    })
    io.observe(root)
    document.addEventListener("visibilitychange", onVisibility)
    resize()
    wake()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [cols, rows])

  // Lean toward the pointer; the glare on the glass follows it.
  const onStageMove = (e: React.PointerEvent) => {
    const dev = deviceRef.current
    const glass = glassRef.current
    if (!dev || !glass) return
    const r = dev.getBoundingClientRect()
    const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.75)))
    const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.6)))
    dev.style.transform = tilt && !reduced ? "rotateX(" + (-ny * 7).toFixed(2) + "deg) rotateY(" + (nx * 9).toFixed(2) + "deg)" : ""
    glass.style.setProperty("--lss-gx", (50 + nx * 45).toFixed(1) + "%")
    glass.style.setProperty("--lss-gy", (ny * 60).toFixed(1) + "%")
  }
  const onStageLeave = () => {
    setHover(false)
    if (deviceRef.current) deviceRef.current.style.transform = ""
    glassRef.current?.style.removeProperty("--lss-gx")
    glassRef.current?.style.removeProperty("--lss-gy")
  }

  const onPanelMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    want.current.pointer = {
      x: ((e.clientX - r.left) / r.width) * cols,
      y: ((e.clientY - r.top) / r.height) * rows,
    }
  }

  const onPanelKey = (e: React.KeyboardEvent) => {
    if (editing) return
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
      e.preventDefault()
      go(1)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      go(-1)
    } else if (e.key === "Enter" && editable) {
      e.preventDefault()
      startEdit()
    }
  }

  const stageStyle: React.CSSProperties & Record<string, string | number> = {
    height,
    "--lss-hi": metal[0],
    "--lss-mid": metal[1],
    "--lss-lo": metal[2],
    "--lss-edge": metal[3],
    "--lss-lit": to255(pal.lit),
    "--lss-dim": to255(pal.dim),
    "--lss-power": on ? 1 : 0,
  }
  if (backdrop !== "studio" && backdrop !== "none") stageStyle.background = backdrop

  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const spoken = on ? (editing ? "Editing: " + draft : text) : "Sign off"

  return (
    <section
      ref={rootRef}
      className={"lss-stage relative w-full overflow-hidden " + className}
      data-backdrop={backdrop === "studio" || backdrop === "none" ? backdrop : "custom"}
      data-finish={finish}
      data-on={on ? "" : undefined}
      style={stageStyle}
      aria-label={label}
      aria-roledescription="status sign"
      onPointerEnter={() => setHover(true)}
      onPointerMove={onStageMove}
      onPointerLeave={onStageLeave}
    >
      <style>{LSS_CSS}</style>
      <span className="lss-sr" aria-live="polite">
        {spoken}
      </span>

      <div className="lss-wrap" style={{ width: "min(92%, " + maxWidth + "px)" }}>
        <div ref={deviceRef} className="lss-device">
          <button
            type="button"
            className="lss-flap"
            aria-label="Power"
            aria-pressed={on}
            title={on ? "Press to switch off" : "Press to switch on"}
            onClick={togglePower}
          />
          <button
            ref={knobRef}
            type="button"
            className="lss-knob"
            aria-label={"Next status (now: " + text + ")"}
            title="Turn: click, scroll or shift-click"
            style={{ "--lss-turn": turns } as React.CSSProperties}
            onClick={(e) => go(e.shiftKey ? -1 : 1)}
          />

          <div className="lss-body">
            <div ref={glassRef} className="lss-glass">
              <button type="button" className="lss-pip lss-pip-l" aria-label="Previous status" onClick={() => go(-1)}>
                <i />
                <i />
              </button>
              <button type="button" className="lss-pip lss-pip-r" aria-label="Next status" onClick={() => go(1)}>
                <i />
                <i />
              </button>

              <div
                ref={panelRef}
                className="lss-panel"
                style={{ aspectRatio: cols + " / " + rows }}
                role="spinbutton"
                tabIndex={0}
                aria-label="Status"
                aria-valuemin={0}
                aria-valuemax={n - 1}
                aria-valuenow={idx}
                aria-valuetext={spoken}
                aria-keyshortcuts={editable ? "ArrowLeft ArrowRight Enter" : "ArrowLeft ArrowRight"}
                title={editable ? "Double-click to write your own" : undefined}
                data-editing={editing ? "" : undefined}
                onKeyDown={onPanelKey}
                onDoubleClick={startEdit}
                onPointerMove={onPanelMove}
                onPointerLeave={() => (want.current.pointer = null)}
              >
                <canvas ref={canvasRef} className="lss-dots" aria-hidden="true" />
                <canvas ref={glowRef} className="lss-bloom" aria-hidden="true" />
                <span className="lss-shade" aria-hidden="true" />
              </div>
              {editing && (
                <input
                  ref={inputRef}
                  className="lss-input"
                  aria-label="Sign text"
                  value={draft}
                  maxLength={48}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      finishEdit(true)
                      panelRef.current?.focus()
                    } else if (e.key === "Escape") {
                      e.preventDefault()
                      finishEdit(false)
                      panelRef.current?.focus()
                    }
                  }}
                  onBlur={() => finishEdit(true)}
                />
              )}
              <span className="lss-glare" aria-hidden="true" />
            </div>
          </div>

          <svg className="lss-base" viewBox="0 0 1000 66" aria-hidden="true">
            <defs>
              <linearGradient id={uid + "band"} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "var(--lss-mid)" }} />
                <stop offset="0.55" style={{ stopColor: "var(--lss-lo)" }} />
                <stop offset="1" style={{ stopColor: "var(--lss-edge)" }} />
              </linearGradient>
              <linearGradient id={uid + "foot"} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "var(--lss-hi)" }} />
                <stop offset="0.45" style={{ stopColor: "var(--lss-mid)" }} />
                <stop offset="1" style={{ stopColor: "var(--lss-lo)" }} />
              </linearGradient>
              <radialGradient id={uid + "led"}>
                <stop offset="0" style={{ stopColor: "rgb(var(--lss-dim))" }} />
                <stop offset="1" style={{ stopColor: "rgb(var(--lss-dim))", stopOpacity: 0 }} />
              </radialGradient>
            </defs>
            <rect x="12" y="0" width="976" height="22" rx="10" fill={"url(#" + uid + "band)"} />
            <rect x="30" y="1" width="940" height="1.6" fill="#fff" opacity="0.55" />
            <rect x="34" y="20" width="932" height="6" fill="#050506" opacity="0.6" />
            <path d="M300 24 H700 V34 C700 44 692 50 680 50 H320 C308 50 300 44 300 34 Z" fill="#141416" />
            <path d="M330 26 H670 V30 C670 33 668 35 664 35 H336 C332 35 330 33 330 30 Z" fill="#000" opacity="0.6" />
            <path d="M42 24 H312 V54 C312 60 307 64 300 64 H54 C47 64 42 59 42 52 Z" fill={"url(#" + uid + "foot)"} />
            <path d="M688 24 H958 V52 C958 59 953 64 946 64 H700 C693 64 688 60 688 54 Z" fill={"url(#" + uid + "foot)"} />
            <rect x="46" y="25.5" width="262" height="1.4" fill="#fff" opacity="0.7" />
            <rect x="692" y="25.5" width="262" height="1.4" fill="#fff" opacity="0.7" />
            <rect x="74" y="42" width="206" height="3" rx="1.5" fill="#000" opacity="0.28" />
            <rect x="720" y="42" width="206" height="3" rx="1.5" fill="#000" opacity="0.28" />
            <circle className="lss-led-glow" cx="500" cy="30" r="14" fill={"url(#" + uid + "led)"} />
            <circle className="lss-led" cx="500" cy="30" r="3.2" />
          </svg>
        </div>
        <div className="lss-floor" aria-hidden="true" />
      </div>

      {children}
    </section>
  )
}

const LSS_CSS = `
.lss-stage { display: flex; align-items: center; justify-content: center; isolation: isolate; color-scheme: light; }
.lss-stage[data-backdrop="studio"] { background: radial-gradient(60% 45% at 50% 46%, rgb(255 255 255 / 0.55), transparent 70%), linear-gradient(180deg, #fbfbfb 0%, #ececee 32%, #c6c6ca 72%, #98989d 100%); }
:where(.dark) .lss-stage[data-backdrop="studio"] { color-scheme: dark; background: radial-gradient(55% 40% at 50% 48%, rgb(var(--lss-dim) / calc(0.16 * var(--lss-power))), transparent 72%), linear-gradient(180deg, #1c1c20 0%, #101013 55%, #060607 100%); }
.lss-stage[data-backdrop="none"] { background: transparent; }
.lss-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.lss-wrap { position: relative; container-type: inline-size; perspective: 1600px; }
.lss-device { position: relative; padding-top: 3.1cqw; transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1); transform-style: preserve-3d; will-change: transform; }
.lss-stage:hover .lss-device { transition-duration: 0.18s; }

.lss-flap { position: absolute; z-index: 0; left: 25cqw; width: 50cqw; top: 0.5cqw; height: 3.6cqw; padding: 0; border: 0; cursor: pointer; border-radius: 1.3cqw 1.3cqw 0.2cqw 0.2cqw;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.35) 0, rgb(255 255 255 / 0.06) 18%, transparent 30%),
    linear-gradient(180deg, transparent 25%, rgb(var(--lss-dim) / calc(0.7 * var(--lss-power))) 100%),
    linear-gradient(180deg, #6c6c72 0%, #3b3b40 40%, #242428 100%);
  box-shadow: inset 0 0 0 0.12cqw rgb(0 0 0 / 0.55), inset 0 0.2cqw 0 rgb(255 255 255 / 0.3);
  transform: translateY(0); transition: transform 0.18s cubic-bezier(0.3, 1.6, 0.5, 1), filter 0.3s; }
.lss-flap:hover { filter: brightness(1.12); }
.lss-flap:active { transform: translateY(1.1cqw); }
.lss-flap[aria-pressed="true"] { transform: translateY(0.55cqw); }
.lss-flap[aria-pressed="true"]:active { transform: translateY(1.2cqw); }

.lss-knob { position: absolute; z-index: 0; left: 80cqw; width: 8.6cqw; top: 0.9cqw; height: 3.2cqw; padding: 0; border: 0; cursor: ew-resize; border-radius: 1cqw 1cqw 0.3cqw 0.3cqw;
  background:
    linear-gradient(90deg, rgb(0 0 0 / 0.55) 0%, transparent 22%, rgb(255 255 255 / 0.35) 48%, transparent 70%, rgb(0 0 0 / 0.6) 100%),
    repeating-linear-gradient(90deg, var(--lss-edge) 0 0.3cqw, var(--lss-hi) 0.3cqw 0.55cqw, var(--lss-mid) 0.55cqw 0.8cqw);
  background-position: 0 0, calc(var(--lss-turn, 0) * 1.6cqw) 0;
  box-shadow: inset 0 0.2cqw 0 rgb(255 255 255 / 0.5), inset 0 0 0 0.1cqw rgb(0 0 0 / 0.35);
  transition: background-position 0.45s cubic-bezier(0.2, 1.4, 0.4, 1), filter 0.2s; }
.lss-knob::before { content: ""; position: absolute; inset: -2.2cqw -1.4cqw -0.6cqw; }
.lss-knob:hover { filter: brightness(1.08); }
.lss-knob:active { filter: brightness(0.92); }

.lss-body { position: relative; z-index: 1; border-radius: 4.4cqw; padding: 0.8cqw 0.8cqw 1.25cqw;
  background: linear-gradient(180deg, var(--lss-hi) 0%, var(--lss-mid) 38%, var(--lss-lo) 82%, var(--lss-edge) 100%);
  box-shadow: inset 0 0.15cqw 0 rgb(255 255 255 / 0.9), inset 0 -0.2cqw 0.3cqw rgb(0 0 0 / 0.25), 0 0.25cqw 0.5cqw rgb(0 0 0 / 0.18), 0 3.2cqw 5cqw -2cqw rgb(0 0 0 / 0.45); }
.lss-glass { position: relative; overflow: hidden; border-radius: 3.7cqw; padding: 2.5cqw 5cqw;
  background: radial-gradient(130% 160% at 50% -10%, #232327 0%, #0b0b0d 52%, #030304 100%);
  box-shadow: inset 0 0 0 0.14cqw #000, inset 0 0.6cqw 1.4cqw rgb(0 0 0 / 0.9), inset 0 -0.2cqw 0.4cqw rgb(255 255 255 / 0.05); }
.lss-panel { position: relative; overflow: hidden; border-radius: 0.7cqw; outline: none; cursor: default; touch-action: manipulation; }
.lss-panel:focus-visible { box-shadow: 0 0 0 0.25cqw #030304, 0 0 0 0.5cqw rgb(var(--lss-lit) / 0.9); }
.lss-panel[data-editing] { cursor: text; }
.lss-panel canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; max-width: none; }
.lss-bloom { mix-blend-mode: screen; opacity: 0.85; pointer-events: none; }
.lss-shade { position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background: radial-gradient(120% 140% at 50% 50%, transparent 55%, rgb(0 0 0 / 0.55) 100%);
  box-shadow: inset 0 0 1.4cqw rgb(0 0 0 / 0.8); }
.lss-glare { position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background:
    linear-gradient(173deg, rgb(255 255 255 / 0.14) 0%, rgb(255 255 255 / 0.04) 26%, transparent 44%),
    radial-gradient(38cqw 16cqw at var(--lss-gx, 32%) var(--lss-gy, -10%), rgb(255 255 255 / 0.1), transparent 70%); }

.lss-pip { position: absolute; z-index: 2; top: 50%; translate: 0 -50%; display: flex; flex-direction: column; gap: 0.55cqw; padding: 1.6cqw 1.3cqw; border: 0; background: transparent; cursor: pointer; }
.lss-pip-l { left: 0.6cqw; }
.lss-pip-r { right: 0.6cqw; }
.lss-pip i { display: block; width: 0.7cqw; height: 0.7cqw; border-radius: 0.12cqw; background: rgb(var(--lss-lit)); opacity: calc(0.12 + 0.88 * var(--lss-power)); box-shadow: 0 0 calc(0.9cqw * var(--lss-power)) rgb(var(--lss-lit) / 0.7); transition: transform 0.15s, opacity 0.3s; }
.lss-pip-l i:last-child { translate: 0.55cqw 0; }
.lss-pip-r i:last-child { translate: -0.55cqw 0; }
.lss-pip:hover i { transform: scale(1.35); }
.lss-pip:focus-visible { outline: 0.2cqw solid rgb(var(--lss-lit) / 0.8); outline-offset: -0.6cqw; border-radius: 0.8cqw; }
.lss-flap:focus-visible, .lss-knob:focus-visible { outline: 0.25cqw solid rgb(var(--lss-dim)); outline-offset: 0.3cqw; }

.lss-input { position: absolute; left: 50%; bottom: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none; border: 0; padding: 0; font-size: 16px; }
.lss-base { position: relative; z-index: 0; display: block; width: 100%; height: auto; max-width: none; margin-top: -1.1cqw; }
.lss-led { fill: rgb(var(--lss-dim)); opacity: calc(0.15 + 0.85 * var(--lss-power)); }
.lss-led-glow { opacity: calc(0.9 * var(--lss-power)); }
.lss-stage[data-on] .lss-led { animation: lss-breathe 3.2s ease-in-out infinite; }
.lss-floor { position: absolute; z-index: -1; left: 8%; right: 8%; bottom: -3.2cqw; height: 6cqw; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, rgb(0 0 0 / 0.42), rgb(0 0 0 / 0.12) 60%, transparent); filter: blur(1.1cqw); }
:where(.dark) .lss-floor { background: radial-gradient(closest-side, rgb(var(--lss-dim) / calc(0.22 * var(--lss-power))), rgb(0 0 0 / 0.5) 55%, transparent); }
@keyframes lss-breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) {
  .lss-device, .lss-flap, .lss-knob { transition: none; }
  .lss-stage[data-on] .lss-led { animation: none; }
}
`
