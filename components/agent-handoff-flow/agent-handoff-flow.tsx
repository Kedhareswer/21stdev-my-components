"use client"

import * as React from "react"

/* ------------------------------------------------------------------ types */

export type HandoffAgent = {
  id: string
  name: string
  /** Pixel grid: rows of `#` (on) and `.` (off), as an array or joined with `|`. See `ICONS`. */
  icon?: string | string[]
  /** Shown in the tooltip. */
  description?: string
  /** What the trace says while this agent has the task, e.g. "searching 4 sources". */
  working?: string
  /** Routing: the furthest agent whose keyword appears in the task answers it. The first agent needs none. */
  keywords?: string[]
  /** Built-in answer when neither a task's `answer` nor `resolve` supplies one. */
  reply?: (task: string) => string
}

export type HandoffTask = { task: string; answer?: string }

export type HandoffResult = { task: string; agent: HandoffAgent; answer: string; handoffs: number; ms: number }

export type HandoffColors = Partial<
  Record<"paper" | "grid" | "ink" | "box" | "boxText" | "node" | "nodeText" | "accent" | "accentText" | "card" | "muted", string>
>

export type AgentHandoffFlowProps = {
  /** 1 to 6 agents. The first is the orchestrator and always sees the task first. */
  agents?: HandoffAgent[]
  /** The tasks the flow plays, in order, looping. A task's `answer` is used when it routes normally. */
  tasks?: HandoffTask[]
  /** Produce the real answer. The flow waits at the Answer card until this settles. */
  resolve?: (task: string, agent: HandoffAgent, chain: HandoffAgent[]) => string | Promise<string>
  onAnswer?: (result: HandoffResult) => void
  title?: string
  subtitle?: string
  theme?: "paper" | "night"
  colors?: HandoffColors
  /** Start once the flow scrolls into view, then keep cycling through `tasks`. */
  autoPlay?: boolean
  /** `auto` picks a row on wide screens and a column on narrow ones. */
  layout?: "auto" | "row" | "column"
  /** Must be a definite length. A percentage collapses to 0px on an installed page. */
  height?: string | number
  className?: string
}

/* ------------------------------------------------------------------ flow */

// #region flow
export type Pt = [number, number]
export type Box = { x: number; y: number; w: number; h: number }
export type Orientation = "row" | "column"

export type FlowLayout = {
  orientation: Orientation
  w: number
  h: number
  frame: Box
  title: Box
  log: Box | null
  task: Box
  answer: Box
  output: Box
  agents: Box[]
  /** One per agent: the "answer or hand off" card, and the `...` stub for the last agent. */
  gates: Box[]
  /** The intake chip first, then one per handoff. */
  chips: Box[]
  paths: Record<string, Pt[]>
  /** Where the intake packet lands, on the first agent. */
  entry: Pt
  merge: Pt
}

export const MAX_AGENTS = 6
const CORNER = 22

const centred = (x: number, y: number, s: number): Box => ({ x: x - s / 2, y: y - s / 2, w: s, h: s })

export function layoutFlow(n: number, orientation: Orientation): FlowLayout {
  const count = Math.max(1, Math.min(MAX_AGENTS, Math.floor(n) || 1))
  return orientation === "column" ? layoutColumn(count) : layoutRow(count)
}

function layoutRow(n: number): FlowLayout {
  const S = 114
  const T = 50
  const x0 = 130
  // The title owns a band across the top, so the intake line never crosses it.
  const band = 70
  const cy = 405 + band
  const top = cy - S / 2
  const mergeY = 516 + band
  const agents: Box[] = []
  const gates: Box[] = []
  const chips: Box[] = []
  const paths: Record<string, Pt[]> = {}

  for (let i = 0; i < n; i++) agents.push({ x: x0 + i * 386, y: top, w: S, h: S })
  for (let i = 0; i < n - 1; i++) gates.push({ x: agents[i].x + 150, y: top, w: S, h: S })
  const last = agents[n - 1]
  gates.push({ x: last.x + S + 26, y: cy - T / 2, w: T, h: T })
  const tail = gates[n - 1]

  const w = Math.max(tail.x + T + 38 + 70, 1000)
  const h = 770 + band
  const frame = { x: 92, y: 266 + band, w: w - 70 - 92, h: 298 }
  const mergeX = Math.max(tail.x - 122, x0 + 450)
  const merge: Pt = [mergeX, mergeY]
  const task = { x: Math.round(w * 0.378), y: 86 + band, w: 120, h: 120 }
  const ax = x0 + S / 2
  const ty = task.y + task.h / 2

  paths.intake = [[task.x, ty], [ax, ty], [ax, frame.y]]
  chips.push(centred((ax + task.x) / 2, ty, 48))
  for (let i = 0; i < n; i++) {
    const a = agents[i]
    const g = gates[i]
    const gx = g.x + g.w / 2
    paths["a" + i] = [[a.x + S, cy], [g.x, cy]]
    paths["b" + i] = [[gx, g.y + g.h], [gx, mergeY], merge]
    if (i < n - 1) {
      const next = agents[i + 1]
      paths["h" + i] = [[g.x + g.w, cy], [next.x, cy]]
      chips.push(centred((g.x + g.w + next.x) / 2, cy, 48))
    }
  }

  const answer = { x: mergeX - 259, y: 604 + band, w: 120, h: 120 }
  paths.out = [merge, [mergeX, answer.y + 60], [answer.x + answer.w, answer.y + 60]]

  const room = answer.x - 40 - 92
  const output =
    room >= 300
      ? { x: Math.max(92, answer.x - 40 - 440), y: answer.y - 6, w: Math.min(440, room), h: 132 }
      : { x: mergeX + 40, y: answer.y - 6, w: w - 70 - (mergeX + 40), h: 132 }
  const lx = task.x + task.w + 56
  const log = w - 70 - lx >= 240 ? { x: lx, y: task.y, w: w - 70 - lx, h: 120 } : null

  return {
    orientation: "row",
    w,
    h,
    frame,
    title: { x: 92, y: 34, w: Math.min(680, w - 70 - 92), h: 116 },
    log,
    task,
    answer,
    output,
    agents,
    gates,
    chips,
    paths,
    entry: [ax, top],
    merge,
  }
}

function layoutColumn(n: number): FlowLayout {
  const w = 430
  const S = 84
  const T = 40
  const x0 = 56
  const cx = x0 + S / 2
  const rail = 360
  const top0 = 250
  const frameTop = 222
  const agents: Box[] = []
  const gates: Box[] = []
  const chips: Box[] = []
  const paths: Record<string, Pt[]> = {}

  for (let i = 0; i < n; i++) agents.push({ x: x0, y: top0 + i * 264, w: S, h: S })
  for (let i = 0; i < n - 1; i++) gates.push({ x: x0, y: agents[i].y + S + 20, w: S, h: S })
  const last = agents[n - 1]
  gates.push({ x: cx - T / 2, y: last.y + S + 18, w: T, h: T })
  const tail = gates[n - 1]
  const mergeY = tail.y + T / 2
  const merge: Pt = [rail, mergeY]

  const task = { x: 296, y: 84, w: 100, h: 100 }
  paths.intake = [[task.x, 134], [cx, 134], [cx, frameTop]]
  chips.push(centred((cx + task.x) / 2, 134, 44))
  for (let i = 0; i < n; i++) {
    const a = agents[i]
    const g = gates[i]
    const gy = g.y + g.h / 2
    paths["a" + i] = [[cx, a.y + S], [cx, g.y]]
    paths["b" + i] = [[g.x + g.w, gy], [rail, gy], merge]
    if (i < n - 1) {
      const next = agents[i + 1]
      paths["h" + i] = [[cx, g.y + g.h], [cx, next.y]]
      chips.push(centred(cx, (g.y + g.h + next.y) / 2, 44))
    }
  }

  const frame = { x: 28, y: frameTop, w: w - 28 - 22, h: tail.y + T + 30 - frameTop }
  const answer = { x: rail - 50, y: frame.y + frame.h + 40, w: 100, h: 100 }
  paths.out = [merge, [rail, answer.y]]

  return {
    orientation: "column",
    w,
    h: answer.y + answer.h + 30,
    frame,
    title: { x: 24, y: 20, w: w - 48, h: 56 },
    log: null,
    task,
    answer,
    output: { x: 28, y: answer.y - 8, w: answer.x - 28 - 24, h: 124 },
    agents,
    gates,
    chips,
    paths,
    entry: [cx, top0],
    merge,
  }
}

/** Row when it reads bigger, column when the column is clearly larger on screen. */
export function pickOrientation(width: number, height: number, n: number): Orientation {
  if (!width || !height) return "row"
  const r = layoutFlow(n, "row")
  const c = layoutFlow(n, "column")
  const sr = Math.min(width / r.w, height / r.h)
  const sc = Math.min(width / c.w, height / c.h)
  return sc > sr * 1.3 ? "column" : "row"
}

/** A polyline with its corners rounded, densely sampled so the packet rides the same curve that is drawn. */
export function smooth(pts: Pt[], r = CORNER): Pt[] {
  const p = pts.filter((q, i) => i === 0 || q[0] !== pts[i - 1][0] || q[1] !== pts[i - 1][1])
  if (p.length < 3) return p.map((q) => [q[0], q[1]] as Pt)
  const out: Pt[] = [[p[0][0], p[0][1]]]
  for (let i = 1; i < p.length - 1; i++) {
    const [px, py] = p[i - 1]
    const [x, y] = p[i]
    const [nx, ny] = p[i + 1]
    const l1 = Math.hypot(x - px, y - py)
    const l2 = Math.hypot(nx - x, ny - y)
    const rr = Math.min(r, l1 / 2, l2 / 2)
    const ax = x - ((x - px) / l1) * rr
    const ay = y - ((y - py) / l1) * rr
    const bx = x + ((nx - x) / l2) * rr
    const by = y + ((ny - y) / l2) * rr
    for (let k = 0; k <= 8; k++) {
      const t = k / 8
      const u = 1 - t
      out.push([u * u * ax + 2 * u * t * x + t * t * bx, u * u * ay + 2 * u * t * y + t * t * by])
    }
  }
  out.push([p[p.length - 1][0], p[p.length - 1][1]])
  return out
}

export function pathD(pts: Pt[]): string {
  const r = (v: number) => Math.round(v * 10) / 10
  return smooth(pts)
    .map((q, i) => (i ? "L" : "M") + r(q[0]) + " " + r(q[1]))
    .join(" ")
}

export function pathLength(pts: Pt[]): number {
  let len = 0
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return len
}

export function pointAt(pts: Pt[], t: number): Pt {
  if (pts.length === 1) return [pts[0][0], pts[0][1]]
  let goal = Math.max(0, Math.min(1, t)) * pathLength(pts)
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1]
    const [bx, by] = pts[i]
    const seg = Math.hypot(bx - ax, by - ay)
    if (goal <= seg || i === pts.length - 1) {
      const f = seg ? Math.min(1, goal / seg) : 1
      return [ax + (bx - ax) * f, ay + (by - ay) * f]
    }
    goal -= seg
  }
  const e = pts[pts.length - 1]
  return [e[0], e[1]]
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Index of the agent that answers: the furthest one whose keyword appears in the task, else the first. */
export function routeTask(task: string, agents: { keywords?: string[] }[]): number {
  const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9#+]+/g, " ").trim()
  const q = " " + words(task) + " "
  let best = 0
  agents.forEach((a, i) => {
    if (i === 0) return
    if ((a.keywords ?? []).some((k) => words(k) && q.includes(" " + words(k)))) best = i
  })
  return best
}

export type Say = { what: "receive" | "work" | "handoff" | "answer" | "deliver"; who: number }
export type Step =
  | { kind: "move"; path: string; pts: Pt[]; ms: number; packet: "task" | "answer" }
  | { kind: "hold"; node: string; ms: number; say: Say }

const PX_PER_MS = 0.5
const HOLD = { receive: 450, work: 1100, gate: 650, deliver: 450 }

/** The whole trip for one task: which lines light up, for how long, and what the trace says. */
export function buildTimeline(L: FlowLayout, answerer: number): Step[] {
  const n = L.agents.length
  const k = Math.max(0, Math.min(n - 1, Math.floor(answerer) || 0))
  const move = (path: string, packet: "task" | "answer", extra: Pt[] = []): Step => {
    const pts = smooth([...L.paths[path], ...extra])
    return { kind: "move", path, pts, packet, ms: Math.round(Math.max(380, Math.min(1500, pathLength(pts) / PX_PER_MS))) }
  }
  const steps: Step[] = [
    { kind: "hold", node: "task", ms: HOLD.receive, say: { what: "receive", who: 0 } },
    move("intake", "task", [L.entry]),
  ]
  for (let i = 0; i <= k; i++) {
    steps.push({ kind: "hold", node: "agent-" + i, ms: HOLD.work, say: { what: "work", who: i } })
    steps.push(move("a" + i, "task"))
    steps.push({ kind: "hold", node: "gate-" + i, ms: HOLD.gate, say: { what: i < k ? "handoff" : "answer", who: i } })
    if (i < k) steps.push(move("h" + i, "task"))
  }
  steps.push(move("b" + k, "answer"), move("out", "answer"))
  steps.push({ kind: "hold", node: "answer", ms: HOLD.deliver, say: { what: "deliver", who: k } })
  return steps
}

/* ---- pixel art ---- */

const brace = [
  "..###", ".##..", ".#...", ".#...", ".#...", "##...", "#....",
  "##...", ".#...", ".#...", ".#...", ".##..", "..###",
]

function globeRows(size: number): string[] {
  const c = (size - 1) / 2
  const r = c
  const rows: string[] = []
  for (let y = 0; y < size; y++) {
    let row = ""
    for (let x = 0; x < size; x++) {
      const dx = x - c
      const dy = y - c
      const d = Math.hypot(dx, dy)
      const inside = d <= r + 0.3
      const rim = inside && d > r - 0.85
      const lat = inside && (dy === 0 || Math.abs(dy) === Math.round(r * 0.5))
      const mer = inside && (dx === 0 || Math.abs(Math.hypot(dx / (r * 0.5), dy / r) - 1) < 0.14)
      row += rim || lat || mer ? "#" : "."
    }
    rows.push(row)
  }
  return rows
}

export const ICONS = {
  /** The default orchestrator: an original pixel critter. */
  router: ["#.........#", "##.......##", "###.....###", "###########", "##..###..##", "##..###..##", "###########", ".####.####.", "..#######.."],
  person: ["..#####..", "..#...#..", "..#...#..", "..#####..", ".........", "..#####..", ".##...##.", "##.....##", "#.......#"],
  bubble: ["##########", "#........#", "#.######.#", "#........#", "#.####...#", "#........#", "#..#######", "#.#.......", "##........"],
  globe: globeRows(17),
  braces: brace.map((l) => l + "...." + [...l].reverse().join("")),
  doc: ["######...", "#....##..", "#....#.#.", "#....####", "#.#####.#", "#.......#", "#.#####.#", "#.......#", "#.###...#", "#.......#", "#########"],
  checklist: ["...#.......", "#.#..######", ".#.........", "...........", "...#.......", "#.#..######", ".#.........", "...........", "...#.......", "#.#..######", ".#........."],
  dots: ["##.##.##", "##.##.##"],
  database: [".#########.", "#.........#", ".#########.", "#.........#", "#.........#", ".#########.", "#.........#", "#.........#", ".#########."],
  mail: ["#############", "##.........##", "#.#.......#.#", "#..#.....#..#", "#...#...#...#", "#....#.#....#", "#.....#.....#", "#...........#", "#############"],
  spark: [".....#.....", ".....#.....", "....###....", "....###....", "..#######..", "###########", "..#######..", "....###....", "....###....", ".....#.....", ".....#....."],
}

export function parseIcon(icon: string | string[] | undefined): string[] {
  if (!icon) return ICONS.spark
  const rows = Array.isArray(icon) ? icon : icon.split(/[|\n]/)
  const clean = rows.map((r) => r.trim()).filter(Boolean)
  return clean.length ? clean : ICONS.spark
}

/** One rectangle per horizontal run, so a 17×17 icon is a single short path. */
export function gridPath(rows: string[]): string {
  let d = ""
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (row[x] !== "#") {
        x++
        continue
      }
      let e = x
      while (row[e] === "#") e++
      d += "M" + x + " " + y + "h" + (e - x) + "v1h-" + (e - x) + "z"
      x = e
    }
  })
  return d
}
// #endregion

/* ------------------------------------------------------------------ defaults */

export const DEFAULT_AGENTS: HandoffAgent[] = [
  {
    id: "router",
    name: "Router",
    icon: ICONS.router,
    description: "Reads every task first. Answers small talk itself and hands the rest to a specialist.",
    working: "reading the task",
    reply: () => "That one didn't need a specialist, so I answered it myself. No handoff, no waiting.",
  },
  {
    id: "web",
    name: "Web search",
    icon: ICONS.globe,
    description: "Browses the live web and cites what it finds.",
    working: "searching 4 sources",
    keywords: ["latest", "news", "search", "find", "look up", "who", "when", "weather", "forecast", "price", "today", "release", "current"],
    reply: () => "Read four sources and cross-checked them. Here is the short version, with the links underneath.",
  },
  {
    id: "code",
    name: "Code",
    icon: ICONS.braces,
    description: "Writes Python, runs it in a sandbox and returns the output.",
    working: "running code in a sandbox",
    keywords: ["code", "plot", "chart", "graph", "compute", "calculate", "sort", "regex", "script", "csv", "sum", "average", "convert", "function"],
    reply: () => "Wrote 18 lines of Python, ran them in the sandbox and attached the output.",
  },
]

export const DEFAULT_TASKS: HandoffTask[] = [
  {
    task: "Chart this week's weather forecast for Paris",
    answer: "Pulled the 7-day forecast for Paris, then plotted the highs and lows. Warmest day is Thursday. Chart attached as paris-week.png.",
  },
  { task: "Say hi to the team", answer: "Hi team! Small talk stays with me, no handoff needed." },
  {
    task: "Find the latest React release notes",
    answer: "Found the official changelog and two write-ups. Three headline changes, one of them breaking. Links attached.",
  },
  { task: "Sum the totals column in sales.csv", answer: "Loaded sales.csv (1,204 rows) and summed the totals column: 48,310.75." },
]

const THEMES: Record<"paper" | "night", Required<HandoffColors>> = {
  paper: {
    paper: "#fcf7e6",
    grid: "#eee4bb",
    ink: "#0d0d0d",
    box: "#0d0d0d",
    boxText: "#ffffff",
    node: "#474747",
    nodeText: "#ffffff",
    accent: "#ff8a22",
    accentText: "#1c0f00",
    card: "#ffffff",
    muted: "#7a7258",
  },
  night: {
    paper: "#0e1117",
    grid: "#1a2130",
    ink: "#e9e4d4",
    box: "#f1ead6",
    boxText: "#0e1117",
    node: "#262d3b",
    nodeText: "#f1ead6",
    accent: "#7df0a0",
    accentText: "#06150b",
    card: "#151a24",
    muted: "#8b94a7",
  },
}

const GRID = 61

const CSS = `
.ahf-root{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Inter,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:var(--ahf-ink)}
.ahf-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}
.ahf-icon{display:block;max-width:none;flex:none}
.ahf-node{position:absolute;display:block;margin:0;padding:0;border:0;border-radius:10px;font:inherit;text-align:left;cursor:pointer;transition:transform .18s ease,box-shadow .25s ease,background-color .3s ease,color .3s ease}
.ahf-node:hover{transform:translateY(-3px)}
.ahf-node:focus-visible{outline:3px solid var(--ahf-accent);outline-offset:5px}
.ahf-node[data-state="work"]{box-shadow:0 0 0 4px var(--ahf-paper),0 0 0 7px var(--ahf-accent)}
.ahf-node[data-state="work"] .ahf-icon{animation:ahf-bob .6s steps(2) infinite}
.ahf-node[data-state="done"]{box-shadow:0 0 0 3px var(--ahf-paper),0 0 0 5px var(--ahf-accent)}
.ahf-line{fill:none;stroke:var(--ahf-ink);stroke-width:2;transition:stroke .3s ease,stroke-width .3s ease}
.ahf-dash{stroke-dasharray:5 6}
.ahf-line[data-lit="1"]{stroke:var(--ahf-accent);stroke-width:3}
.ahf-line[data-lit="2"]{stroke:var(--ahf-accent);stroke-width:3.5;animation:ahf-march .55s linear infinite}
.ahf-frame{fill:none;stroke:var(--ahf-muted);stroke-width:2;stroke-dasharray:6 7;opacity:.75}
.ahf-packet{position:absolute;left:0;top:0;width:30px;height:30px;border-radius:7px;display:grid;place-items:center;pointer-events:none;will-change:transform;border:2px solid var(--ahf-ink);box-shadow:3px 3px 0 var(--ahf-ink);z-index:5}
.ahf-typing{display:inline-flex;gap:4px}
.ahf-typing i{width:5px;height:5px;background:currentColor;animation:ahf-blink 1s steps(1) infinite}
.ahf-typing i:nth-child(2){animation-delay:.2s}
.ahf-typing i:nth-child(3){animation-delay:.4s}
.ahf-caret{display:inline-block;width:.5em;height:1.05em;margin-left:3px;vertical-align:-.16em;background:var(--ahf-accent);animation:ahf-blink 1s steps(1) infinite}
.ahf-pop{animation:ahf-pop .38s cubic-bezier(.2,1.6,.4,1) both}
.ahf-tip{position:absolute;z-index:8;pointer-events:none;padding:10px 12px;border-radius:10px;border:2px solid var(--ahf-ink);background:var(--ahf-card);color:var(--ahf-ink);box-shadow:4px 4px 0 var(--ahf-ink);font-size:13px;line-height:1.4}
@keyframes ahf-bob{50%{transform:translateY(-3px)}}
@keyframes ahf-march{to{stroke-dashoffset:-22}}
@keyframes ahf-blink{50%{opacity:.15}}
@keyframes ahf-pop{from{transform:scale(.6);opacity:0}}
@media (prefers-reduced-motion: reduce){.ahf-root *{animation:none !important;transition:none !important}}
`

/* ------------------------------------------------------------------ bits */

function PixelIcon({ rows, px, style }: { rows: string[]; px: number; style?: React.CSSProperties }) {
  const w = Math.max(...rows.map((r) => r.length))
  const h = rows.length
  return (
    <svg
      className="ahf-icon"
      width={w * px}
      height={h * px}
      viewBox={"0 0 " + w + " " + h}
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={style}
    >
      <path d={gridPath(rows)} fill="currentColor" />
    </svg>
  )
}

const fit = (rows: string[], size: number) => Math.max(1, Math.floor(size / Math.max(rows.length, ...rows.map((r) => r.length))))

function Typing() {
  return (
    <span className="ahf-typing" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}

type Tip = { box: Box; title: string; body: string; hint?: string }
type Run = { id: number; task: string; k: number; answer: Promise<string>; t0: number }
type Line = { id: number; text: string }
type Result = { text: string; by: number; handoffs: number; ms: number }

const short = (s: string, n = 42) => (s.length > n ? s.slice(0, n - 1) + "…" : s)

/* ------------------------------------------------------------------ component */

export default function AgentHandoffFlow({
  agents: agentsProp,
  tasks = DEFAULT_TASKS,
  resolve,
  onAnswer,
  title = "Agent handoffs",
  subtitle = "Each agent answers the task, or hands it to the next one with everything it learned.",
  theme = "paper",
  colors,
  autoPlay = true,
  layout = "auto",
  height = "100svh",
  className,
}: AgentHandoffFlowProps) {
  const agents = React.useMemo(() => {
    const list = agentsProp && agentsProp.length ? agentsProp : DEFAULT_AGENTS
    return list.slice(0, MAX_AGENTS)
  }, [agentsProp])
  const n = agents.length
  const c = { ...THEMES[theme], ...colors }
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")

  /* ---- sizing ---- */
  const wrapRef = React.useRef(null as HTMLDivElement | null)
  const rootRef = React.useRef(null as HTMLElement | null)
  const [size, setSize] = React.useState({ w: 0, h: 0 })
  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const orient: Orientation = layout === "auto" ? pickOrientation(size.w, size.h, n) : layout
  const L = React.useMemo(() => layoutFlow(n, orient), [n, orient])
  const scale = size.w && size.h ? Math.min(size.w / L.w, size.h / L.h, 1.35) : 0
  const ox = (size.w - L.w * scale) / 2
  const oy = (size.h - L.h * scale) / 2
  const col = orient === "column"

  /* ---- motion preference ---- */
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  /* ---- run state ---- */
  const [pinned, setPinned] = React.useState(null as number | null)
  const [run, setRun] = React.useState(null as Run | null)
  const [cur, setCur] = React.useState(-1)
  const [phase, setPhase] = React.useState("idle" as "idle" | "running" | "waiting" | "done")
  const [log, setLog] = React.useState([] as Line[])
  const [result, setResult] = React.useState(null as Result | null)
  const [typed, setTyped] = React.useState(0)
  const [tip, setTip] = React.useState(null as Tip | null)
  const [elapsed, setElapsed] = React.useState(0)

  const steps = React.useMemo(() => (run ? buildTimeline(L, run.k) : []), [L, run])
  const stepsRef = React.useRef(steps)
  stepsRef.current = steps
  const speedRef = React.useRef(1)
  speedRef.current = reduced ? 3 : 1
  const agentsRef = React.useRef(agents)
  agentsRef.current = agents
  const onAnswerRef = React.useRef(onAnswer)
  onAnswerRef.current = onAnswer
  const packetRef = React.useRef(null as HTMLDivElement | null)
  const runIds = React.useRef(0)
  const lineIds = React.useRef(0)
  const touched = React.useRef(false)
  const nextTask = React.useRef(0)

  const start = React.useCallback(
    (raw: string) => {
      const task = raw.trim()
      if (!task) return
      const list = agentsRef.current
      const routed = routeTask(task, list)
      const k = pinned != null && pinned < list.length ? pinned : routed
      const agent = list[k]
      const preset = tasks.find((p) => p.task === task)
      const answer = Promise.resolve()
        .then(() => {
          if (preset?.answer && k === routed) return preset.answer
          if (resolve) return resolve(task, agent, list.slice(0, k + 1))
          return agent.reply?.(task) ?? agent.name + " took “" + short(task, 60) + "” and answered it."
        })
        .then((s) => String(s))
        .catch(() => "Something went wrong while answering. The trace above shows where it stopped.")
      setResult(null)
      setTyped(0)
      setLog([])
      setElapsed(0)
      setPhase("running")
      setRun({ id: ++runIds.current, task, k, answer, t0: performance.now() })
    },
    [pinned, tasks, resolve],
  )

  /** The next task in the loop. */
  const playNext = React.useCallback(() => {
    if (!tasks.length) return
    start(tasks[nextTask.current++ % tasks.length].task)
  }, [start, tasks])

  const stop = React.useCallback(() => {
    setRun(null)
    setCur(-1)
    setPhase("idle")
    setResult(null)
    setLog([])
  }, [])

  /* ---- the engine: one rAF loop per run, the packet moved outside React ---- */
  React.useEffect(() => {
    if (!run) return
    let raf = 0
    let idx = 0
    let acc = 0
    let last = performance.now()
    let alive = true
    const say = (s: Say) => {
      const list = agentsRef.current
      const a = list[s.who]
      const secs = ((performance.now() - run.t0) / 1000).toFixed(1)
      const text =
        s.what === "receive"
          ? "task in: “" + short(run.task) + "”"
          : s.what === "work"
            ? a.name.toLowerCase() + " · " + (a.working ?? "working")
            : s.what === "handoff"
              ? a.name.toLowerCase() + " → hands off to " + (list[s.who + 1]?.name.toLowerCase() ?? "next")
              : s.what === "answer"
                ? a.name.toLowerCase() + " → answers"
                : "answer out in " + secs + "s"
      setLog((l) => [...l.slice(-7), { id: ++lineIds.current, text }])
      setElapsed(performance.now() - run.t0)
    }
    const enter = (i: number) => {
      idx = i
      setCur(i)
      const s = stepsRef.current[i]
      if (s && s.kind === "hold") say(s.say)
    }
    const place = (p: Pt | undefined) => {
      const el = packetRef.current
      if (el && p) el.style.transform = "translate(" + (p[0] - 15) + "px," + (p[1] - 15) + "px)"
    }
    const finish = () => {
      setPhase("waiting")
      run.answer.then((text) => {
        if (!alive) return
        const ms = performance.now() - run.t0
        setResult({ text, by: run.k, handoffs: run.k, ms })
        setPhase("done")
        const agent = agentsRef.current[run.k]
        onAnswerRef.current?.({ task: run.task, agent, answer: text, handoffs: run.k, ms })
      })
    }
    enter(0)
    const tick = (now: number) => {
      if (!alive) return
      const list = stepsRef.current
      acc += (now - last) * speedRef.current
      last = now
      while (idx < list.length && acc >= list[idx].ms) {
        acc -= list[idx].ms
        if (idx + 1 >= list.length) {
          idx = list.length
          break
        }
        enter(idx + 1)
      }
      if (idx >= list.length) {
        const end = list[list.length - 2]
        if (end && end.kind === "move") place(end.pts[end.pts.length - 1])
        finish()
        return
      }
      const s = list[idx]
      if (s.kind === "move") place(pointAt(s.pts, easeInOut(acc / s.ms)))
      else {
        let p: Pt | undefined
        for (let j = idx; j >= 0 && !p; j--) {
          const m = list[j]
          if (m.kind === "move") p = m.pts[m.pts.length - 1]
        }
        place(p ?? list.find((m) => m.kind === "move")?.pts[0])
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [run])

  /* ---- typewriter ---- */
  React.useEffect(() => {
    if (!result) return
    if (reduced) {
      setTyped(result.text.length)
      return
    }
    setTyped(0)
    const iv = setInterval(() => {
      setTyped((t) => {
        if (t >= result.text.length) {
          clearInterval(iv)
          return t
        }
        return t + 2
      })
    }, 18)
    return () => clearInterval(iv)
  }, [result, reduced])

  /* ---- autoplay: start once on screen, then the next task a beat after each answer ---- */
  React.useEffect(() => {
    if (!autoPlay || phase !== "done" || !result || typed < result.text.length) return
    const t = setTimeout(playNext, 3200)
    return () => clearTimeout(t)
  }, [autoPlay, phase, result, typed, playNext])

  React.useEffect(() => {
    if (!autoPlay || !tasks.length) return
    const el = rootRef.current
    let timer = null as ReturnType<typeof setTimeout> | null
    const go = () => {
      timer = setTimeout(() => {
        if (!touched.current) playNext()
      }, 700)
    }
    if (!el || typeof IntersectionObserver === "undefined") {
      go()
      return () => {
        if (timer) clearTimeout(timer)
      }
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          go()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      if (timer) clearTimeout(timer)
    }
    // Once per mount: the loop above takes it from there.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- what the current step lights up ---- */
  const view = React.useMemo(() => {
    const lit: Record<string, 1 | 2> = {}
    const verdicts: Record<number, "handoff" | "answer"> = {}
    const worked = new Set() as Set<number>
    let focus = ""
    let packet = "task" as "task" | "answer"
    const done = phase === "done" || phase === "waiting"
    steps.forEach((s, i) => {
      if (i > cur && !done) return
      if (s.kind === "move") {
        lit[s.path] = i === cur && !done ? 2 : 1
        packet = s.packet
      } else {
        if (s.say.what === "handoff" || s.say.what === "answer") verdicts[s.say.who] = s.say.what
        if (s.say.what === "work") worked.add(s.say.who)
        if (i === cur && !done) focus = s.node
      }
    })
    return { lit, verdicts, worked, focus, packet }
  }, [steps, cur, phase])

  const busy = phase === "running" || phase === "waiting"
  const fs = col ? 1.12 : 1
  const status =
    phase === "done" && result
      ? agents[result.by].name + " answered after " + result.handoffs + (result.handoffs === 1 ? " handoff" : " handoffs")
      : log.length
        ? log[log.length - 1].text
        : "Idle. Click the Task card to run the next task."

  const show = (t: Tip) => setTip(t)
  const hide = () => setTip(null)
  const hover = (t: Tip) => ({
    onMouseEnter: () => show(t),
    onMouseLeave: hide,
    onFocus: () => show(t),
    onBlur: hide,
  })

  const togglePin = (i: number) => {
    touched.current = true
    setPinned((p) => (p === i ? null : i))
  }

  const vars = {
    "--ahf-paper": c.paper,
    "--ahf-ink": c.ink,
    "--ahf-accent": c.accent,
    "--ahf-card": c.card,
    "--ahf-muted": c.muted,
  } as React.CSSProperties
  const unit = GRID * (scale || 1)
  const arrow = (color: string, id: string) => (
    <marker id={id} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M2 1.5 L10 6 L2 10.5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="square" />
    </marker>
  )
  const mInk = uid + "-ink"
  const mLit = uid + "-lit"

  const drawn: { id: string; dashed: boolean; arrow: boolean }[] = [{ id: "intake", dashed: false, arrow: true }]
  for (let i = 0; i < n; i++) {
    drawn.push({ id: "a" + i, dashed: true, arrow: true })
    if (i < n - 1) drawn.push({ id: "h" + i, dashed: true, arrow: true })
    drawn.push({ id: "b" + i, dashed: true, arrow: false })
  }
  drawn.push({ id: "out", dashed: false, arrow: true })

  const answerArrow = col ? "→" : "↓"
  const handoffArrow = col ? "↓" : "→"
  const S = L.agents[0].w

  return (
    <section
      ref={rootRef}
      className={"ahf-root relative flex w-full flex-col overflow-hidden" + (className ? " " + className : "")}
      style={{
        ...vars,
        height,
        backgroundColor: c.paper,
        backgroundImage:
          "linear-gradient(to right, " + c.grid + " 1px, transparent 1px), linear-gradient(to bottom, " + c.grid + " 1px, transparent 1px)",
        backgroundSize: unit + "px " + unit + "px",
        backgroundPosition: ox + "px " + oy + "px",
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && busy) stop()
      }}
      aria-label={title}
    >
      <style>{CSS}</style>

      {/* ---- the diagram, drawn at a fixed design size and scaled to fit ---- */}
      <div ref={wrapRef} className="relative min-h-0 w-full flex-1 overflow-hidden">
        <div
          className="absolute left-0 top-0"
          style={{
            width: L.w,
            height: L.h,
            transform: "translate(" + ox + "px," + oy + "px) scale(" + scale + ")",
            transformOrigin: "0 0",
            visibility: scale ? "visible" : "hidden",
          }}
        >
          <svg className="absolute left-0 top-0" width={L.w} height={L.h} style={{ overflow: "visible", maxWidth: "none" }} aria-hidden="true">
            <defs>
              {arrow(c.ink, mInk)}
              {arrow(c.accent, mLit)}
            </defs>
            <rect className="ahf-frame" x={L.frame.x} y={L.frame.y} width={L.frame.w} height={L.frame.h} rx="18" />
            {drawn.map((p) => {
              const lit = view.lit[p.id]
              return (
                <path
                  key={p.id}
                  className={"ahf-line" + (p.dashed ? " ahf-dash" : "")}
                  data-lit={lit ?? 0}
                  d={pathD(L.paths[p.id])}
                  markerEnd={p.arrow ? "url(#" + (lit ? mLit : mInk) + ")" : undefined}
                />
              )
            })}
          </svg>

          {/* title */}
          <div className="absolute" style={{ left: L.title.x, top: L.title.y, width: L.title.w }}>
            <div className="ahf-mono flex items-center gap-2" style={{ fontSize: 11 * fs, letterSpacing: "0.14em", color: c.muted }}>
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, background: busy ? c.accent : c.muted, display: "inline-block", transition: "background .3s" }}
              />
              {busy ? "ROUTING" : phase === "done" ? "ANSWERED" : "READY"} · {n} {n === 1 ? "AGENT" : "AGENTS"}
            </div>
            <h2 className="m-0 font-bold" style={{ fontSize: col ? 26 : 32, lineHeight: 1.1, letterSpacing: "-0.02em", marginTop: 6 }}>
              {title}
            </h2>
            {!col && (
              <>
                <p className="m-0" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.45, color: c.muted }}>
                  {subtitle}
                </p>
                <div className="ahf-mono flex flex-wrap items-center gap-x-4 gap-y-1" style={{ marginTop: 10, fontSize: 11, color: c.muted }}>
                  <span className="inline-flex items-center gap-2">
                    <svg width="22" height="4" aria-hidden="true">
                      <path d="M0 2H22" stroke={c.ink} strokeWidth="2" />
                    </svg>
                    request
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <svg width="22" height="4" aria-hidden="true">
                      <path d="M0 2H22" stroke={c.ink} strokeWidth="2" strokeDasharray="4 4" />
                    </svg>
                    handoff
                  </span>
                </div>
              </>
            )}
          </div>

          {/* trace */}
          {L.log && (
            <div
              className="ahf-mono absolute flex flex-col overflow-hidden"
              style={{
                left: L.log.x,
                top: L.log.y,
                width: L.log.w,
                height: L.log.h,
                borderRadius: 10,
                border: "2px solid " + c.ink,
                background: c.card,
                boxShadow: "4px 4px 0 " + c.ink,
                fontSize: 12,
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ padding: "5px 10px", borderBottom: "2px solid " + c.ink, letterSpacing: "0.12em", fontSize: 10.5 }}
              >
                <span>TRACE</span>
                <span style={{ color: c.muted }}>{(elapsed / 1000).toFixed(1)}s</span>
              </div>
              <ol className="m-0 flex min-h-0 flex-1 flex-col justify-end list-none" style={{ padding: "4px 10px 6px" }}>
                {log.length === 0 && <li style={{ color: c.muted }}>› waiting for a task</li>}
                {log.slice(-4).map((l, i, all) => (
                  <li
                    key={l.id}
                    className="truncate"
                    style={{ lineHeight: "19px", color: i === all.length - 1 && busy ? c.ink : c.muted, fontWeight: i === all.length - 1 ? 600 : 400 }}
                  >
                    <span style={{ color: c.accent }}>›</span> {l.text}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* chips on the lines */}
          {L.chips.map((b, i) => {
            const lit = i === 0 ? view.lit.intake : view.lit["h" + (i - 1)]
            return (
              <div
                key={"chip" + i}
                className="absolute grid place-items-center"
                style={{
                  left: b.x,
                  top: b.y,
                  width: b.w,
                  height: b.h,
                  borderRadius: 6,
                  background: lit ? c.accent : c.card,
                  color: lit ? c.accentText : c.ink,
                  border: "1.5px solid " + c.ink,
                  transition: "background-color .3s ease, color .3s ease",
                }}
                onMouseEnter={() =>
                  show({
                    box: b,
                    title: i === 0 ? "The task" : "Handoff packet",
                    body: i === 0 ? "The request, written down as a checklist." : "The task plus everything " + agents[i - 1].name + " learned.",
                  })
                }
                onMouseLeave={hide}
              >
                <PixelIcon rows={ICONS.checklist} px={fit(ICONS.checklist, b.w * 0.7)} />
              </div>
            )
          })}

          {/* task */}
          <button
            type="button"
            className="ahf-node"
            data-state={view.focus === "task" ? "work" : "idle"}
            style={{ left: L.task.x, top: L.task.y, width: L.task.w, height: L.task.h, background: c.box, color: c.boxText }}
            onClick={() => {
              touched.current = true
              playNext()
            }}
            aria-label={"Task: " + (run?.task ?? "none yet") + ". Press to run the next task."}
            {...hover({ box: L.task, title: "Task", body: run?.task ?? "Nothing running yet.", hint: "Click to run the next task" })}
          >
            <span className="absolute" style={{ left: 12, top: 10, fontSize: 15 * fs }}>
              Task
            </span>
            <span className="absolute" style={{ right: 12, bottom: 12 }}>
              <PixelIcon rows={ICONS.person} px={Math.max(3, Math.round(L.task.w / 30))} />
            </span>
          </button>

          {/* agents */}
          {L.agents.map((b, i) => {
            const a = agents[i]
            const rows = parseIcon(a.icon)
            const lead = i === 0
            const state = view.focus === "agent-" + i ? "work" : view.worked.has(i) && result?.by === i ? "done" : "idle"
            return (
              <React.Fragment key={a.id + i}>
                <button
                  type="button"
                  className="ahf-node grid place-items-center"
                  data-state={state}
                  aria-pressed={pinned === i}
                  aria-label={a.name + ". " + (a.description ?? "") + (pinned === i ? " Pinned to answer. Press to unpin." : " Press to make it answer.")}
                  style={{ left: b.x, top: b.y, width: b.w, height: b.h, background: lead ? c.accent : c.node, color: lead ? c.accentText : c.nodeText }}
                  onClick={() => togglePin(i)}
                  {...hover({
                    box: b,
                    title: a.name + (lead ? " · orchestrator" : ""),
                    body: a.description ?? "",
                    hint: pinned === i ? "Pinned: it answers next. Click to unpin" : "Click to make it answer",
                  })}
                >
                  <PixelIcon rows={rows} px={fit(rows, b.w * 0.62)} />
                  {state === "work" && (
                    <span className="absolute" style={{ right: 9, top: 9 }}>
                      <Typing />
                    </span>
                  )}
                  {pinned === i && (
                    <span
                      className="ahf-mono ahf-pop absolute"
                      style={{
                        right: -10,
                        top: -12,
                        padding: "3px 7px",
                        borderRadius: 6,
                        background: c.card,
                        color: c.ink,
                        border: "2px solid " + c.ink,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                      }}
                    >
                      ANSWERS
                    </span>
                  )}
                </button>
                <div
                  className="absolute"
                  style={
                    col
                      ? { left: b.x + b.w + 20, top: b.y + 4, width: 360 - 16 - (b.x + b.w + 20) }
                      : { left: b.x - 20, top: b.y + b.h + 10, width: b.w + 40, textAlign: "center" }
                  }
                >
                  <div className="font-semibold" style={{ fontSize: 14 * fs, lineHeight: 1.2 }}>
                    {a.name}
                  </div>
                  {col && (
                    <div style={{ marginTop: 4, fontSize: 12.5 * fs, lineHeight: 1.35, color: c.muted }}>{a.description}</div>
                  )}
                </div>
              </React.Fragment>
            )
          })}

          {/* gates: answer or hand off */}
          {L.gates.map((b, i) => {
            const verdict = view.verdicts[i]
            const live = view.focus === "gate-" + i
            const isTail = i === n - 1
            const tipFor: Tip = {
              box: b,
              title: isTail ? "End of the line" : "Answer or hand off",
              body: isTail
                ? "The last agent always answers. Add up to " + MAX_AGENTS + " agents to extend the chain."
                : agents[i].name + " decides: answer now, or pass the task to " + agents[i + 1].name + ".",
            }
            if (isTail) {
              return (
                <div
                  key={"gate" + i}
                  className="absolute grid place-items-center"
                  style={{
                    left: b.x,
                    top: b.y,
                    width: b.w,
                    height: b.h,
                    borderRadius: 6,
                    background: verdict ? c.accent : c.card,
                    color: verdict ? c.accentText : c.ink,
                    border: "1.5px solid " + c.ink,
                    boxShadow: live ? "0 0 0 4px " + c.paper + ", 0 0 0 7px " + c.accent : "none",
                    transition: "background-color .3s ease, box-shadow .25s ease",
                  }}
                  onMouseEnter={() => show(tipFor)}
                  onMouseLeave={hide}
                >
                  <PixelIcon rows={ICONS.dots} px={fit(ICONS.dots, b.w * 0.5)} />
                </div>
              )
            }
            return (
              <div
                key={"gate" + i}
                className="ahf-node"
                data-state={live ? "work" : "idle"}
                style={{
                  left: b.x,
                  top: b.y,
                  width: b.w,
                  height: b.h,
                  cursor: "default",
                  background: verdict === "answer" ? c.accent : c.node,
                  color: verdict === "answer" ? c.accentText : c.nodeText,
                }}
                onMouseEnter={() => show(tipFor)}
                onMouseLeave={hide}
              >
                <span className="absolute" style={{ left: 11, top: 9, right: 8, fontSize: col ? 12.5 : 14.5, lineHeight: 1.2, opacity: verdict ? 0.55 : 1 }}>
                  {col ? (
                    <>
                      Answer or
                      <br />
                      Handoff
                    </>
                  ) : (
                    <>
                      Answer
                      <br />
                      or Handoff
                      <br />
                      task
                    </>
                  )}
                </span>
                {verdict ? (
                  <span
                    key={verdict}
                    className="ahf-mono ahf-pop absolute font-bold"
                    style={{ left: 10, bottom: 10, fontSize: (col ? 10 : 11) * fs, letterSpacing: "0.06em" }}
                  >
                    {verdict === "answer" ? "ANSWER " + answerArrow : "HANDOFF " + handoffArrow}
                  </span>
                ) : (
                  <span className="absolute" style={{ right: 10, bottom: 10 }}>
                    <PixelIcon rows={ICONS.bubble} px={Math.max(2, Math.round(b.w / 38))} />
                  </span>
                )}
              </div>
            )
          })}

          {/* answer */}
          <div
            className="ahf-node"
            data-state={view.focus === "answer" || phase === "waiting" ? "work" : phase === "done" ? "done" : "idle"}
            style={{ left: L.answer.x, top: L.answer.y, width: L.answer.w, height: L.answer.h, background: c.box, color: c.boxText, cursor: "default" }}
            onMouseEnter={() => show({ box: L.answer, title: "Answer", body: result ? "From " + agents[result.by].name + "." : "Whoever answers, it lands here." })}
            onMouseLeave={hide}
          >
            <span className="absolute" style={{ left: 12, top: 10, fontSize: 15 * fs }}>
              Answer
            </span>
            {phase === "waiting" && (
              <span className="absolute" style={{ left: 13, bottom: 16 }}>
                <Typing />
              </span>
            )}
            <span className="absolute" style={{ right: 12, bottom: 12 }}>
              <PixelIcon rows={ICONS.doc} px={Math.max(3, Math.round(L.answer.w / 34))} />
            </span>
          </div>

          {/* the answer text */}
          <div
            className="absolute flex flex-col overflow-hidden"
            style={{
              left: L.output.x,
              top: L.output.y,
              width: L.output.w,
              height: L.output.h,
              borderRadius: 10,
              border: "2px " + (result ? "solid " : "dashed ") + (result ? c.ink : c.muted),
              background: result ? c.card : "transparent",
              boxShadow: result ? "4px 4px 0 " + c.ink : "none",
              padding: col ? "10px 12px" : "12px 14px",
              transition: "background-color .3s ease, box-shadow .3s ease",
            }}
            aria-live="polite"
          >
            <div className="ahf-mono truncate" style={{ fontSize: 10.5 * fs, letterSpacing: "0.1em", color: c.muted }}>
              {result
                ? "FROM " + agents[result.by].name.toUpperCase() + " · " + result.handoffs + (result.handoffs === 1 ? " HANDOFF" : " HANDOFFS") + " · " + (result.ms / 1000).toFixed(1) + "S"
                : busy
                  ? "WORKING ON IT"
                  : "OUTPUT"}
            </div>
            <p
              className="m-0 overflow-hidden"
              style={{ marginTop: 6, fontSize: col ? 13 : 15, lineHeight: 1.4, color: result ? c.ink : c.muted }}
            >
              {result ? (
                <>
                  {result.text.slice(0, typed)}
                  {typed < result.text.length && <span className="ahf-caret" aria-hidden="true" />}
                </>
              ) : busy ? (
                "“" + short(run?.task ?? "", 70) + "”"
              ) : (
                "Click the Task card to run a task. Click an agent to make it the one that answers."
              )}
            </p>
          </div>

          {/* the travelling task */}
          <div
            ref={packetRef}
            className="ahf-packet"
            style={{
              background: view.packet === "answer" ? c.card : c.accent,
              color: view.packet === "answer" ? c.ink : c.accentText,
              opacity: busy ? 1 : 0,
              transition: "opacity .25s ease, background-color .25s ease",
            }}
            aria-hidden="true"
          >
            <PixelIcon rows={view.packet === "answer" ? ICONS.doc : ICONS.checklist} px={2} />
          </div>

          {/* tooltip */}
          {tip && (
            <div
              className="ahf-tip ahf-pop"
              style={{
                left: Math.max(12, Math.min(L.w - 252, tip.box.x + tip.box.w / 2 - 120)),
                top: tip.box.y > 150 ? tip.box.y - 14 : tip.box.y + tip.box.h + 14,
                width: 240,
                transform: tip.box.y > 150 ? "translateY(-100%)" : undefined,
                transformOrigin: tip.box.y > 150 ? "50% 100%" : "50% 0",
                fontSize: 13 * fs,
              }}
              role="tooltip"
            >
              <div className="font-bold">{tip.title}</div>
              {tip.body && <div style={{ marginTop: 3, color: c.muted }}>{tip.body}</div>}
              {tip.hint && (
                <div className="ahf-mono" style={{ marginTop: 6, fontSize: 10.5, letterSpacing: "0.08em", color: c.ink }}>
                  › {tip.hint.toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="sr-only" role="status">
        {status}
      </p>
    </section>
  )
}
