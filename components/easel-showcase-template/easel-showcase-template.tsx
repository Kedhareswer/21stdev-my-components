"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

// Easel Showcase Template — a one-page portfolio for Kedhareswer, laid out like a gallery that sells art:
// a fanned deck of work that collapses and re-deals itself down a staircase as you scroll, a pinned
// "whether you're…" paragraph that inks in word by word while its deck riffles, a folder that files the
// cards away, drifting avatar bands, a bento of projects, a banner that shrinks into a portrait wall,
// pricing cards and a lime marquee whose doodles drop and pile up with real collisions.
// Every picture is a generated original served from the component site (see README).
//
// Motion (read frame by frame off the reference recording, 1440 × 862 viewport, see README):
//   words: blur(8px) + 0.25em rise → sharp, 0.7s cubic-bezier(.22,1,.36,1), 70ms per word
//   hero intro: top card rises from below the fold rotating −32° → −6° in 0.9s, the deck appears
//   under it at 1.0s, fans out 1.35s → 2.35s (ease-in-out), tags pop at 2.3s
//   stage 1 (340vh pin): fan → stack 6–28%, stack sinks 10–34%, slides to the first stair 34–46%,
//   deals down the staircase 44–72% (20ms stagger per card in progress)
//   stage 2 (380vh pin): paragraph inks 0–32% while the deck riffles; stair 34–58%; filed into the
//   folder 60–84%; doodles pop at 70%
//   stage 3 (300vh pin): banner 94vw → 390 × 460 card 0–50%; portrait wall rises 35–60%

// #region motion
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** 0 → 1 as p runs from a to b */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
/** pinned-stage progress: 0 when the stage top meets the viewport top, 1 when the pin is released */
export const stageProgress = (top: number, stageH: number, pinH: number) => clamp(-top / Math.max(1, stageH - pinH))

export type Pose = { x: number; y: number; s: number; r: number; ry: number; o: number }
export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  s: lerp(a.s, b.s, t),
  r: lerp(a.r, b.r, t),
  ry: lerp(a.ry, b.ry, t),
  o: lerp(a.o, b.o, t),
})
/** layout unit: 1 at 1440px, smaller on tablets, phone-sized below 768 */
export const unit = (w: number) => (w >= 1024 ? w / 1440 : w >= 768 ? w / 1180 : Math.max(0.5, w / 640))
/** the stage unit: never larger than the height allows (a 1580 × 847 window must not outgrow its pin) */
export const unitWH = (w: number, h: number) => Math.min(unit(w), Math.max(0.5, h / 862))

export const DECK = 8 // stage-1 cards, 260 × 282 base
/** hero fan: cards spread left → right, the last one in front */
export function fanPose(i: number, n: number, w: number, h: number): Pose {
  const u = unitWH(w, h)
  const d = i - (n - 1) / 2
  const step = w < 768 ? Math.min(40, (w - 150) / (n - 1)) : 120 * u
  return { x: w / 2 + d * step, y: h * (w < 768 ? 0.6 : 0.65) + d * d * 1.2 * u, s: 0.92 * u, r: d * 2.4, ry: -18, o: 1 }
}
/** collapsed deck around a centre */
export function stackPose(i: number, n: number, cx: number, cy: number, w: number, h: number): Pose {
  const u = unitWH(w, h)
  const d = i - (n - 1) / 2
  return { x: cx + d * 2.5 * u, y: cy - d * 1.8 * u, s: 0.84 * u, r: d * 1.6 - 5, ry: -10, o: 1 }
}
/** the showcase staircase: down and to the right, running off the edge */
export function stairPose(i: number, w: number, h: number): Pose {
  const u = unitWH(w, h)
  if (w < 768) return { x: w * 0.27 + i * w * 0.13, y: h * 0.66 + i * h * 0.035, s: 0.62 * u, r: 0, ry: -8, o: 1 }
  return { x: w * 0.473 + i * 155 * u, y: h * 0.62 + i * 40 * u, s: u, r: 0, ry: -12, o: 1 }
}

export const DECK2 = 7 // stage-2 cards: perfume, info, then five photos; 230 × 230 base (info 230 × 280)
/** stage 2 staircase from the top-left corner */
export function stair2Pose(j: number, w: number, h: number): Pose {
  const u = unitWH(w, h)
  if (w < 768) return { x: w * 0.2 + j * w * 0.1, y: h * 0.3 + j * h * 0.075, s: 0.55 * u, r: 0, ry: -6, o: 1 }
  return { x: 190 * u + j * 172 * u, y: h * 0.22 + j * h * 0.1, s: u, r: 0, ry: -8, o: 1 }
}
/** folder geometry: left, top, cell size, gap (px) */
export function folderBox(w: number, h: number) {
  const u = unitWH(w, h)
  if (w < 768) {
    const fw = w * 0.88
    const gap = 8
    const cell = (fw - 2 * gap) / 3
    return { x: w * 0.06, y: h * 0.42, w: fw, cell, gap, head: 92 }
  }
  const fw = 606 * u
  return { x: w - 102 * u - fw, y: h / 2 - 290 * u, w: fw, cell: 192 * u, gap: 12 * u, head: 140 * u }
}
/** where card j lands in the folder (the info card has no slot) */
export const FOLDER_SLOT = [3, -1, 0, 1, 2, 4, 5]
export function folderPose(j: number, w: number, h: number): Pose {
  const f = folderBox(w, h)
  const slot = Math.max(0, FOLDER_SLOT[j])
  const c = slot % 3
  const r = Math.floor(slot / 3)
  return {
    x: f.x + f.cell / 2 + c * (f.cell + f.gap),
    y: f.y + f.head + f.cell / 2 + r * (f.cell + f.gap),
    s: f.cell / 230,
    r: 0,
    ry: 0,
    o: FOLDER_SLOT[j] < 0 ? 0 : 1,
  }
}

/** how inked word i of n is while the paragraph progress runs 0 → 1 (0.18 floor, two-word ramp) */
export const inkAt = (q: number, i: number, n: number) => 0.18 + 0.82 * clamp((q * (n + 2) - i) / 2)

/** stage 3: the banner rectangle at progress p */
export function bannerRect(p: number, w: number, h: number) {
  const u = unitWH(w, h)
  const t = easeInOut(seg(p, 0, 0.5))
  const cw = Math.min(390 * u, w * 0.62)
  const ch = cw * (460 / 390)
  const a = { x: w * 0.03, y: h * 0.76, w: w * 0.94, h: h * 0.9 }
  const b = { x: w / 2 - cw / 2, y: h * 0.53 - ch / 2, w: cw, h: ch }
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), rad: lerp(18, 16, t) }
}
/** stage 3: the portrait wall, 5 columns × 3 rows around the banner */
export function wallPose(k: number, w: number, h: number) {
  const u = unitWH(w, h)
  const cols = w < 768 ? 3 : 5
  const c = k % cols
  const r = Math.floor(k / cols)
  const pitch = w < 768 ? w * 0.33 : 246 * u
  return { x: w / 2 + (c - (cols - 1) / 2) * pitch, y: h * [0.21, 0.53, 0.86][r] }
}

// The lime band's doodles: circles under gravity, bouncing off the box and each other.
export type Ball = { x: number; y: number; vx: number; vy: number; a: number; r: number }
export function stepBalls(bs: Ball[], W: number, H: number, dt: number, g = 2600) {
  for (const b of bs) {
    b.vy += g * dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    if (b.y + b.r > H) {
      b.y = H - b.r
      b.vy = -b.vy * 0.28
      b.vx *= 0.92
      if (Math.abs(b.vy) < 30) b.vy = 0
    }
    if (b.x - b.r < 0) {
      b.x = b.r
      b.vx = Math.abs(b.vx) * 0.4
    }
    if (b.x + b.r > W) {
      b.x = W - b.r
      b.vx = -Math.abs(b.vx) * 0.4
    }
    b.a += (b.vx * dt * 180) / (Math.PI * b.r)
  }
  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      const p = bs[i]
      const q = bs[j]
      const dx = q.x - p.x
      const dy = q.y - p.y
      const d = Math.hypot(dx, dy) || 0.001
      const min = p.r + q.r
      if (d >= min) continue
      const nx = dx / d
      const ny = dy / d
      const push = (min - d) / 2
      p.x -= nx * push
      p.y -= ny * push
      q.x += nx * push
      q.y += ny * push
      const rel = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny
      if (rel < 0) {
        const imp = (-(1 + 0.25) * rel) / 2
        p.vx -= imp * nx
        p.vy -= imp * ny
        q.vx += imp * nx
        q.vy += imp * ny
      }
    }
  }
}
export const settled = (bs: Ball[]) => bs.every((b) => Math.abs(b.vx) < 6 && Math.abs(b.vy) < 6)
// #endregion

const IMG_BASE = "https://kedhar-components.pages.dev/easel-showcase-template/"

// stage 1 deck, back → front (the last card is the one that rises first)
const DECK_IMG = ["a5", "b6", "a3", "a4", "a2", "b4", "a6", "a1"]
// stage 2 deck: perfume, info card, five photos (b5 on top)
const DECK2_IMG = ["b6", "", "b1", "b2", "b3", "b4", "b5"]
const AV_TOP = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11", "v12", "v13", "v14", "v15", "v16"]
const AV_BOT = ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9", "w10", "w11", "w12", "w13", "w14", "w15", "w16"]
const WALL = ["w3", "v5", "w9", "v12", "w14", "v2", "w6", "", "v9", "w11", "v14", "w1", "v7", "w16", "v11"]
const ARCHIVE = [
  { k: "c3", t: "Dot Matrix" },
  { k: "c4", t: "Chroma Wave" },
  { k: "c5", t: "Ribbon Study" },
  { k: "c6", t: "Parrot Club" },
  { k: "a4", t: "Soft Nap" },
  { k: "b5", t: "Cloud Form" },
  { k: "a6", t: "Straw Hat" },
  { k: "b2", t: "Green Lawn" },
]
const SLIDES = ["gate", "muse", "meet"]
const CLIENTS = ["Client 1", "Client 2", "Client 3", "Client 4", "Client 5", "Client 6"]
const NAV = ["Get Started", "Start a project", "Pricing", "Contact", "Process", "Archive"]

// line-art doodles: one path set per icon, drawn on a 24-unit grid
const DOODLES = [
  "M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z",
  "M12 3l7 9-7 9-7-9z M5 12h14",
  "M12 8a4 4 0 1 0 .01 0 M8 15a4 4 0 1 0 .01 0 M16 15a4 4 0 1 0 .01 0",
  "M4 12l16-7-6 16-3-7z",
  "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  "M6 18c0-8 5-12 12-12 0 7-4 12-12 12z M6 18l7-7",
  "M13 3L5 13h6l-1 8 8-10h-6z",
  "M12 3l6 4v10l-6 4-6-4V7z M12 3v18 M6 7l12 10 M18 7L6 17",
  "M12 4a8 8 0 1 0 .01 0 M12 4v16 M4 12h16 M6.5 6.5l11 11",
  "M5 19l4-12 4 8 3-5 3 9z",
  "M12 5v14 M5 12h14 M7 7l10 10 M17 7L7 17",
  "M8 4h8l3 6-7 10L5 10z M5 10h14 M10 4l2 6 2-6",
  "M4 16c4-8 12-8 16 0 M8 16a4 4 0 0 0 8 0",
  "M6 6h12v12H6z M9 9h6v6H9z",
]

const ICON = {
  logo: "M5 19c1-6 4-10 9-12M14 7c-1 3-1 6 1 8M14 7c3-1 5 0 6 2M14 7c-2-2-5-2-7 0M14 7c0-2 1-3 3-4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c1-4 4-6 7-6s6 2 7 6",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  eye: "M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  left: "M14 6l-6 6 6 6",
  right: "M10 6l6 6-6 6",
  up: "M6 14l6-6 6 6",
  down: "M6 10l6 6 6-6",
  play: "M8 5v14l11-7z",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  pen: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  dots: "M5 12h.01M12 12h.01M19 12h.01",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  spark: "M12 3v6M12 15v6M3 12h6M15 12h6",
}

function Svg({ d, size = 16, stroke = 1.6, fill = "none" }: { d: string; size?: number; stroke?: number; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

type Part = string | [string, string]
/** words that blur in one after another when an ancestor gets .ea-in; "\n" breaks the line */
function Words({ parts, at = 0 }: { parts: Part[]; at?: number }) {
  let i = at
  const out: ReactNode[] = []
  parts.forEach((p, pi) => {
    const txt = typeof p === "string" ? p : p[0]
    const cls = typeof p === "string" ? "" : p[1]
    if (txt === "\n") {
      out.push(<br key={"br" + pi} />)
      return
    }
    txt
      .split(" ")
      .filter(Boolean)
      .forEach((w, wi) => {
        out.push(
          <span key={pi + "-" + wi} className={"ea-w" + (cls ? " " + cls : "")} style={{ ["--i" as string]: i++ } as CSSProperties}>
            {w}
          </span>,
          " ",
        )
      })
  })
  return <>{out}</>
}

export interface EaselShowcaseTemplateProps {
  /** height of the hero and of every pinned stage; a definite length (never a percentage) */
  height?: string
  /** contact address for every call to action */
  email?: string
  /** where the pictures live; defaults to the component site */
  assetBase?: string
  className?: string
  style?: CSSProperties
}

export default function EaselShowcaseTemplate({
  height = "100svh",
  email = "kedhareswer.12110626@gmail.com",
  assetBase,
  className,
  style,
}: EaselShowcaseTemplateProps) {
  const pic = (k: string) => (assetBase ? assetBase.replace(/\/?$/, "/") : IMG_BASE) + k + ".webp"
  const mail = "mailto:" + email

  const rootRef = useRef(null as HTMLDivElement | null)
  const navRef = useRef(null as HTMLElement | null)
  const s1 = useRef(null as HTMLDivElement | null)
  const pin1 = useRef(null as HTMLDivElement | null)
  const heroText = useRef(null as HTMLDivElement | null)
  const showText = useRef(null as HTMLDivElement | null)
  const deck = useRef([] as (HTMLDivElement | null)[])
  const s2 = useRef(null as HTMLDivElement | null)
  const pin2 = useRef(null as HTMLDivElement | null)
  const whether = useRef(null as HTMLDivElement | null)
  const vision = useRef(null as HTMLDivElement | null)
  const folder = useRef(null as HTMLDivElement | null)
  const deck2 = useRef([] as (HTMLDivElement | null)[])
  const s3 = useRef(null as HTMLDivElement | null)
  const pin3 = useRef(null as HTMLDivElement | null)
  const banner = useRef(null as HTMLDivElement | null)
  const appRow = useRef(null as HTMLDivElement | null)
  const wall = useRef([] as (HTMLDivElement | null)[])
  const bands = useRef(null as HTMLElement | null)
  const bandA = useRef(null as HTMLDivElement | null)
  const bandB = useRef(null as HTMLDivElement | null)
  const limeRef = useRef(null as HTMLDivElement | null)
  const limeTrack = useRef(null as HTMLDivElement | null)
  const pile = useRef(null as HTMLDivElement | null)
  const balls = useRef([] as (HTMLSpanElement | null)[])

  const [slide, setSlide] = useState(0)
  const [arc, setArc] = useState(0)
  const [liked, setLiked] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    let reduced = mq.matches
    const onMq = () => {
      reduced = mq.matches
      root.classList.toggle("ea-reduce", reduced)
      kick()
    }
    root.classList.toggle("ea-reduce", reduced)
    root.classList.add("ea-ready")
    const t0 = performance.now()
    let raf = 0
    let lastT = t0

    // physics state for the lime pile
    const sim = { on: false, bs: [] as Ball[], W: 0, H: 0, started: false }
    const startPile = () => {
      const box = pile.current
      if (!box || sim.started) return
      sim.started = true
      sim.W = box.clientWidth
      sim.H = box.clientHeight
      const n = balls.current.length
      const r = sim.W < 500 ? 24 : 36
      sim.bs = balls.current.map((_, i) => ({
        x: r + sim.W * 0.04 + ((i * 0.618 * sim.W * 0.3) % (sim.W * 0.3)),
        y: -60 - i * 70 - (i % 3) * 30,
        vx: (i % 2 ? 1 : -1) * (40 + (i * 37) % 90),
        vy: 0,
        a: (i * 47) % 360,
        r,
      }))
      if (reduced || n === 0) {
        for (let k = 0; k < 900; k++) stepBalls(sim.bs, sim.W, sim.H, 1 / 120)
      } else sim.on = true
    }
    const drawPile = () => {
      sim.bs.forEach((b, i) => {
        const el = balls.current[i]
        if (el) el.style.transform = "translate3d(" + (b.x - b.r).toFixed(1) + "px," + (b.y - b.r).toFixed(1) + "px,0) rotate(" + b.a.toFixed(1) + "deg)"
      })
    }

    const setPose = (el: HTMLElement | null, p: Pose, bw: number, bh: number) => {
      if (!el) return
      el.style.transform =
        "translate3d(" + (p.x - bw / 2).toFixed(1) + "px," + (p.y - bh / 2).toFixed(1) + "px,0) perspective(1400px) rotateY(" + p.ry.toFixed(2) + "deg) rotate(" + p.r.toFixed(2) + "deg) scale(" + p.s.toFixed(4) + ")"
      el.style.opacity = p.o.toFixed(3)
    }
    const flag = (el: HTMLElement | null, cls: string, on: boolean) => el && el.classList.toggle(cls, on)

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, (now - lastT) / 1000)
      lastT = now
      const t = reduced ? 99 : (now - t0) / 1000
      const w = root.clientWidth
      let again = false
      flag(navRef.current, "ea-solid", root.getBoundingClientRect().top < -40)

      // ---- stage 1: hero fan → stack → showcase staircase
      const st1 = s1.current
      const pn1 = pin1.current
      if (st1 && pn1) {
        const h = pn1.clientHeight
        const r = st1.getBoundingClientRect()
        const p = stageProgress(r.top, st1.offsetHeight, h)
        const fanIn = easeInOut(seg(t, 1.35, 2.35))
        const k1 = easeInOut(seg(p, 0.06, 0.28))
        const fanAmt = fanIn * (1 - k1)
        const cy = lerp(h * (w < 768 ? 0.6 : 0.65), h * 0.8, easeInOut(seg(p, 0.1, 0.34)))
        const m2 = easeInOut(seg(p, 0.34, 0.46))
        const s0 = stairPose(0, w, h)
        const cx = lerp(w / 2, s0.x, m2)
        const cyy = lerp(cy, s0.y, m2)
        const rise = easeOut(seg(t, 0.35, 1.25))
        for (let i = 0; i < DECK; i++) {
          let pose = mixPose(stackPose(i, DECK, cx, cyy, w, h), fanPose(i, DECK, w, h), fanAmt)
          const ti = easeInOut(seg(p, 0.44 + i * 0.02, 0.62 + i * 0.02))
          if (ti > 0) pose = mixPose(pose, stairPose(i, w, h), ti)
          if (i === DECK - 1 && t < 1.6) {
            pose = { ...pose, y: lerp(h + 260, pose.y, rise), r: lerp(-32, pose.r, easeInOut(seg(t, 0.6, 1.6))), ry: lerp(0, pose.ry, rise) }
          } else if (i < DECK - 1) pose.o = seg(t, 0.95, 1.15)
          setPose(deck.current[i], pose, 260, 282)
        }
        const ht = heroText.current
        if (ht) {
          const foot = ht.querySelector(".ea-hero-foot") as HTMLElement | null
          if (foot) {
            const f = fanPose(0, DECK, w, h)
            foot.style.top = (fanPose(3, DECK, w, h).y + 141 * f.s + 26 - ht.offsetTop).toFixed(1) + "px"
            // the copy under the fan leaves before the deck collapses onto it
            foot.style.opacity = (1 - seg(p, 0.03, 0.12)).toFixed(3)
          }
          const a = easeInOut(seg(p, 0.04, 0.3))
          ht.style.transform = "translate3d(0," + (-a * h * 0.42).toFixed(1) + "px,0)"
          ht.style.opacity = (1 - seg(p, 0.2, 0.34)).toFixed(3)
          ht.style.visibility = p > 0.36 ? "hidden" : "visible"
        }
        flag(pn1, "ea-tags1", t > 2.3 && p < 0.2)
        flag(pn1, "ea-tags2", p > 0.68)
        flag(showText.current, "ea-in", p > 0.4)
        if (t < 2.6) again = true
      }

      // ---- stage 2: inked paragraph + riffling deck → staircase → folder
      const st2 = s2.current
      const pn2 = pin2.current
      if (st2 && pn2) {
        const h = pn2.clientHeight
        const r = st2.getBoundingClientRect()
        const p = stageProgress(r.top, st2.offsetHeight, h)
        const q = seg(p, 0, 0.32)
        const u = unitWH(w, h)
        const cx = w < 768 ? w * 0.5 : w * 0.52
        const cy = w < 768 ? h * 0.3 : h * 0.33
        for (let j = 0; j < DECK2; j++) {
          const d = j - (DECK2 - 1) / 2
          const lift = Math.max(0, Math.sin(clamp(q * 6 - (DECK2 - 1 - j) * 0.7, 0, 1) * Math.PI))
          let pose: Pose = {
            x: cx + d * 7 * u + lift * 40 * u * (j % 2 ? 1 : -1),
            y: cy - d * 3 * u - lift * 70 * u,
            s: (w < 768 ? 0.62 : 1.05) * u,
            r: d * 5 + Math.sin(q * 7 + j) * 5 + lift * 12,
            ry: -6,
            o: j === 1 ? 0 : 1,
          }
          const tj = easeInOut(seg(p, 0.34 + j * 0.015, 0.52 + j * 0.015))
          if (tj > 0) pose = mixPose(pose, stair2Pose(j, w, h), tj)
          if (j === 1) pose.o = seg(p, 0.36, 0.46) * (1 - seg(p, 0.58, 0.66))
          const order = Math.max(0, FOLDER_SLOT[j])
          const fj = easeInOut(seg(p, 0.6 + order * 0.015, 0.78 + order * 0.015))
          if (fj > 0 && j !== 1) pose = mixPose(pose, folderPose(j, w, h), fj)
          setPose(deck2.current[j], pose, 230, j === 1 ? 280 : 230)
        }
        const words = pn2.querySelectorAll(".ea-sw")
        words.forEach((el, i) => {
          ;(el as HTMLElement).style.opacity = inkAt(reduced ? 1 : q, i, words.length).toFixed(3)
        })
        const wt = whether.current
        if (wt) {
          const a = seg(p, 0.3, 0.4)
          wt.style.opacity = (1 - a).toFixed(3)
          wt.style.transform = "translate3d(0," + (-a * 60).toFixed(1) + "px,0)"
          wt.style.visibility = p > 0.42 ? "hidden" : "visible"
        }
        const fd = folder.current
        if (fd) {
          const f = folderBox(w, h)
          const a = easeOut(seg(p, 0.6, 0.74))
          fd.style.left = f.x.toFixed(1) + "px"
          fd.style.top = f.y.toFixed(1) + "px"
          fd.style.width = f.w.toFixed(1) + "px"
          fd.style.height = (f.head + 2 * f.cell + f.gap + (w < 768 ? 10 : 28 * u)).toFixed(1) + "px"
          fd.style.opacity = a.toFixed(3)
          fd.style.transform = "translate3d(0," + ((1 - a) * 40).toFixed(1) + "px,0)"
        }
        flag(vision.current, "ea-in", p > 0.66)
        flag(pn2, "ea-doodled", p > 0.7)
      }

      // ---- stage 3: banner shrinks into the centre of a portrait wall
      const st3 = s3.current
      const pn3 = pin3.current
      if (st3 && pn3) {
        const h = pn3.clientHeight
        const r = st3.getBoundingClientRect()
        const p = stageProgress(r.top, st3.offsetHeight, h)
        const b = bannerRect(p, w, h)
        const bn = banner.current
        if (bn) {
          bn.style.left = b.x.toFixed(1) + "px"
          bn.style.top = b.y.toFixed(1) + "px"
          bn.style.width = b.w.toFixed(1) + "px"
          bn.style.height = b.h.toFixed(1) + "px"
          bn.style.borderRadius = b.rad.toFixed(1) + "px"
        }
        flag(pn3, "ea-card-on", p > 0.52)
        const ar = appRow.current
        if (ar) {
          ar.style.transform = "translate3d(-50%," + (-seg(p, 0, 0.4) * h * 0.4).toFixed(1) + "px,0)"
          ar.style.opacity = (1 - seg(p, 0.12, 0.32)).toFixed(3)
        }
        const u = unitWH(w, h)
        const tw = w < 768 ? w * 0.27 : 195 * u
        const th = tw * (210 / 195)
        wall.current.forEach((el, k) => {
          if (!el) return
          const wp = wallPose(k, w, h)
          const a = easeOut(seg(p, 0.35 + (k % 5) * 0.03, 0.55 + (k % 5) * 0.03))
          const dx = (wp.x - w / 2) * (1 - a) * 0.5
          const dy = (wp.y - h * 0.53) * (1 - a) * 0.5
          el.style.width = tw.toFixed(1) + "px"
          el.style.height = th.toFixed(1) + "px"
          el.style.transform = "translate3d(" + (wp.x - tw / 2 + dx).toFixed(1) + "px," + (wp.y - th / 2 + dy).toFixed(1) + "px,0) scale(" + (0.7 + 0.3 * a).toFixed(3) + ")"
          el.style.opacity = a.toFixed(3)
        })
      }

      // ---- avatar bands drift apart with scroll
      const bd = bands.current
      if (bd) {
        const r = bd.getBoundingClientRect()
        const vh = window.innerHeight
        const pr = clamp((vh - r.top) / (vh + r.height))
        const u = unit(w)
        if (bandA.current) bandA.current.style.transform = "translate3d(" + (40 * u - pr * 420 * u).toFixed(1) + "px,0,0)"
        if (bandB.current) bandB.current.style.transform = "translate3d(" + (-380 * u + pr * 420 * u).toFixed(1) + "px,0,0)"
      }

      // ---- lime marquee follows scroll and creeps on its own; doodles fall once it is on screen
      const lm = limeRef.current
      if (lm) {
        const r = lm.getBoundingClientRect()
        const vh = window.innerHeight
        const tr = limeTrack.current
        if (tr) {
          const half = tr.scrollWidth / 2 || 1
          const x = ((window.scrollY * 0.6 + (reduced ? 0 : t * 40)) % half + half) % half
          tr.style.transform = "translate3d(" + (-x).toFixed(1) + "px,0,0)"
          if (!reduced && r.bottom > 0 && r.top < vh) again = true
        }
        if (r.top < vh * 0.7 && r.bottom > 0) startPile()
      }
      if (sim.on) {
        const sub = 4
        for (let k = 0; k < sub; k++) stepBalls(sim.bs, sim.W, sim.H, dt / sub)
        if (settled(sim.bs) && sim.bs.every((b) => b.y > 0)) sim.on = false
        else again = true
      }
      if (sim.started) drawPile()

      if (again) raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    kick()

    // a cursor shove through the pile wakes it up again
    const onPile = (e: PointerEvent) => {
      const box = pile.current
      if (!box || !sim.started || reduced) return
      const rb = box.getBoundingClientRect()
      const mx = e.clientX - rb.left
      const my = e.clientY - rb.top
      let hit = false
      for (const b of sim.bs) {
        const dx = b.x - mx
        const dy = b.y - my
        const d = Math.hypot(dx, dy)
        if (d < b.r * 2.2) {
          b.vx += (dx / (d || 1)) * 520
          b.vy -= 520 + Math.random() * 300
          hit = true
        }
      }
      if (hit) {
        sim.on = true
        kick()
      }
    }
    const pileEl = pile.current
    pileEl?.addEventListener("pointermove", onPile)

    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) (e.target as HTMLElement).classList.add("ea-in")
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    )
    root.querySelectorAll("[data-rv]").forEach((el) => io.observe(el))

    const onResize = () => {
      if (pile.current && sim.started) {
        sim.W = pile.current.clientWidth
        sim.H = pile.current.clientHeight
        sim.on = true
      }
      kick()
    }
    window.addEventListener("scroll", kick, { passive: true })
    window.addEventListener("resize", onResize)
    mq.addEventListener("change", onMq)
    const heroIn = window.setTimeout(() => heroText.current?.classList.add("ea-in"), reduced ? 0 : 150)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(heroIn)
      io.disconnect()
      pileEl?.removeEventListener("pointermove", onPile)
      window.removeEventListener("scroll", kick)
      window.removeEventListener("resize", onResize)
      mq.removeEventListener("change", onMq)
    }
  }, [])

  const stage = (n: number) => ({ height: "calc(" + height + " * " + n + ")" })

  return (
    <div ref={rootRef} className={"ea-root" + (dark ? " ea-dark" : "") + (className ? " " + className : "")} style={style}>
      <style>{CSS}</style>

      <header ref={navRef} className="ea-nav">
        <a className="ea-brand" href="#top" aria-label="Kedhareswer, home">
          <span className="ea-logo">
            <Svg d={ICON.logo} size={22} stroke={2.2} />
          </span>
          Kedhareswer
        </a>
        <nav className="ea-links" aria-label="Main">
          {NAV.map((l, i) => (
            <a key={l} className="ea-link" href={i === 3 ? mail : "#" + l.toLowerCase().replace(/ /g, "-")}>
              {i === 1 && <i className="ea-dot" aria-hidden="true" />}
              {l}
            </a>
          ))}
        </nav>
        <div className="ea-tools">
          <a className="ea-round" href={mail} aria-label="Write to Kedhareswer">
            <Svg d={ICON.user} size={15} />
          </a>
          <button type="button" className="ea-round" aria-label={dark ? "Light theme" : "Dark theme"} aria-pressed={dark} onClick={() => setDark((d) => !d)}>
            <Svg d={ICON.sun} size={15} />
          </button>
        </div>
      </header>

      {/* ---------- stage 1: hero → showcase ---------- */}
      <section ref={s1} id="top" className="ea-stage" style={stage(3.4)} aria-label="Introduction">
        <div ref={pin1} className="ea-pin" style={{ height }}>
          <div ref={heroText} className="ea-hero">
            <h1 className="ea-h1">
              <Words parts={["A place to display", "\n", "my masterpieces."]} />
            </h1>
            <div className="ea-hero-foot">
              <p className="ea-fade" style={{ ["--d" as string]: "1.9s" } as CSSProperties}>
                Kedhareswer designs and builds interfaces, and pins every piece of it to this wall.
              </p>
              <div className="ea-btns ea-fade" style={{ ["--d" as string]: "2.05s" } as CSSProperties}>
                <a className="ea-btn" href={mail}>
                  Work with me
                </a>
                <a className="ea-ghost" href="#work">
                  Read more
                </a>
              </div>
            </div>
          </div>
          <span className="ea-tag ea-t1 ea-blue">@client1</span>
          <span className="ea-tag ea-t2 ea-mint">@client2</span>

          <div ref={showText} id="work" className="ea-show">
            <p className="ea-eyebrow">
              <Words parts={["SELECTED WORK"]} />
            </p>
            <h2 className="ea-h2 ea-big">
              <Words parts={["Design, build,", "\n", ["& ship products", "ea-red"], "\n", "from one desk."]} at={2} />
            </h2>
            <p className="ea-body ea-wrapp">
              <Words parts={["One person across product design and front-end, so an idea goes from frame to production without a hand-off."]} at={9} />
            </p>
            <div className="ea-btns ea-late">
              <a className="ea-btn" href={mail}>
                Start a project
              </a>
              <a className="ea-ghost" href="#story">
                Read more
              </a>
            </div>
          </div>
          <span className="ea-tag ea-t3 ea-redtag">@client3</span>
          <span className="ea-tag ea-t4 ea-ink">@client1</span>
          <div className="ea-updown" aria-hidden="true">
            <Svg d={ICON.up} size={12} />
            <Svg d={ICON.down} size={12} />
          </div>

          <div className="ea-deck" aria-hidden="true">
            {DECK_IMG.map((k, i) => (
              <div key={k} ref={(el) => { deck.current[i] = el }} className="ea-card ea-c1">
                <img src={pic(k)} alt="" width={260} height={282} draggable={false} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- gateway banner ---------- */}
      <section className="ea-sec ea-gate" aria-label="Featured case">
        <div className="ea-wrap">
          <div data-rv className="ea-gate-head">
            <p className="ea-eyebrow">
              <Words parts={["CASE STUDY BY KEDHARESWER"]} />
            </p>
            <h2 className="ea-h2">
              <Words parts={["Gateway to", "\n", "the work itself."]} at={4} />
            </h2>
            <span className="ea-tag ea-ink ea-pop ea-t5">@kedhar</span>
          </div>
          <div className="ea-banner" data-rv>
            {SLIDES.map((k, i) => (
              <img key={k} src={pic(k)} alt={i === slide ? "Project 01 — campaign portrait" : ""} className={i === slide ? "on" : ""} width={1400} height={560} draggable={false} />
            ))}
            <span className="ea-switch" aria-hidden="true">
              <i />
              <i />
            </span>
            <span className="ea-more" aria-hidden="true">
              <Svg d={ICON.dots} size={18} stroke={3} />
            </span>
            <a className="ea-watch" href={mail}>
              <Svg d={ICON.play} size={9} fill="currentColor" stroke={0} />
              Watch
            </a>
            <div className="ea-arrows">
              <button type="button" aria-label="Previous picture" onClick={() => setSlide((s) => (s + SLIDES.length - 1) % SLIDES.length)}>
                <Svg d={ICON.left} size={12} stroke={2} />
              </button>
              <button type="button" aria-label="Next picture" onClick={() => setSlide((s) => (s + 1) % SLIDES.length)}>
                <Svg d={ICON.right} size={12} stroke={2} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- trusted by ---------- */}
      <section className="ea-sec ea-trust" aria-label="Clients">
        <div className="ea-wrap" data-rv>
          <div className="ea-trust-head">
            <div>
              <h2 className="ea-h3">
                <Words parts={["Trusted by the", ["best.", "ea-grey"]]} />
              </h2>
              <p className="ea-small ea-late">Founders and teams Kedhareswer has shipped with, from first prototype to public launch.</p>
            </div>
            <div className="ea-mini-arrows" aria-hidden="true">
              <Svg d={ICON.left} size={11} stroke={2} />
              <Svg d={ICON.right} size={11} stroke={2} />
            </div>
          </div>
        </div>
        <div className="ea-logos" aria-label="Client 1 to Client 6">
          <div className="ea-logos-track">
            {[0, 1].map((rep) =>
              CLIENTS.map((c, i) => (
                <span key={rep + c} className="ea-logo-item" aria-hidden={rep === 1}>
                  <Svg d={[ICON.globe, ICON.spark, ICON.grid, ICON.eye, ICON.heart, ICON.pen][i]} size={18} />
                  {c}
                </span>
              )),
            )}
          </div>
        </div>
      </section>

      {/* ---------- stage 2: whether → staircase → folder ---------- */}
      <section ref={s2} className="ea-stage" style={stage(3.8)} aria-label="How I work">
        <div ref={pin2} className="ea-pin" style={{ height }}>
          <div ref={whether} className="ea-whether">
            <p className="ea-ink-text">
              {"Whether you're a founder looking to ship your idea".split(" ").map((w, i) => (
                <span key={"a" + i} className="ea-sw">
                  {w}{" "}
                </span>
              ))}
              <br />
              {"/ or a team seeking".split(" ").map((w, i) => (
                <span key={"b" + i} className="ea-sw">
                  {w}{" "}
                </span>
              ))}
              <span className="ea-sw ea-mintw">sharp </span>
              <span className="ea-sw">interfaces </span>
              <span className="ea-chip ea-sw">
                <img src={pic("a3")} alt="" width={44} height={44} />
              </span>{" "}
              <span className="ea-sw">Kedhareswer </span>
              <br />
              {"connects you to a world of craft".split(" ").map((w, i) => (
                <span key={"c" + i} className="ea-sw">
                  {w}{" "}
                </span>
              ))}
              <span className="ea-chip ea-sw">
                <img src={pic("b3")} alt="" width={44} height={44} />
              </span>{" "}
              <span className="ea-sw">and </span>
              <span className="ea-sw">code.</span>
            </p>
            <div className="ea-iconrow" aria-hidden="true">
              <Svg d={ICON.eye} size={14} />
              <Svg d={ICON.grid} size={14} />
              <Svg d={ICON.spark} size={14} />
            </div>
            <span className="ea-tag ea-ink ea-t6">@client3</span>
            <span className="ea-tag ea-blue ea-t7">@client1</span>
          </div>

          <div ref={folder} className="ea-folder" aria-hidden="true">
            <div className="ea-folder-tab">
              <span>Business</span>
              <b>
                <i className="ea-dot" /> Create
              </b>
            </div>
            <div className="ea-folder-bar">
              <span>Personal</span>
            </div>
          </div>

          <div ref={vision} className="ea-vision">
            <span className="ea-eye">
              <Svg d={ICON.eye} size={16} />
            </span>
            <h2 className="ea-h2 ea-mid">
              <Words parts={["My vision", "\n", "for any product technology."]} />
            </h2>
            <p className="ea-small ea-wrapv">
              <Words parts={["Every interface tells a story. Kedhareswer sketches it, prototypes it and ships it, so the story survives the build."]} at={6} />
            </p>
            <a className="ea-textlink ea-late" href="#story">
              Read more
            </a>
          </div>
          <div className="ea-doodles" aria-hidden="true">
            {DOODLES.slice(0, 9).map((d, i) => (
              <span key={i} className="ea-doodle" style={{ ["--i" as string]: i } as CSSProperties}>
                <Svg d={d} size={40} stroke={1.3} />
              </span>
            ))}
          </div>

          <div className="ea-deck" aria-hidden="true">
            {DECK2_IMG.map((k, j) =>
              j === 1 ? (
                <div key="info" ref={(el) => { deck2.current[j] = el }} className="ea-card ea-info">
                  <span className="ea-info-dot" />
                  <b>
                    Where Design
                    <br />
                    Meets Code
                  </b>
                  <small>Project 02</small>
                  <p>Every project gets a designer and an engineer, and both of them are Kedhareswer.</p>
                </div>
              ) : (
                <div key={k + j} ref={(el) => { deck2.current[j] = el }} className="ea-card ea-c2">
                  <img src={pic(k)} alt="" width={230} height={230} draggable={false} />
                </div>
              ),
            )}
          </div>
          <span className="ea-tag ea-orange ea-t8">@client2</span>
        </div>
      </section>

      {/* ---------- avatar bands ---------- */}
      <section ref={bands} className="ea-bands" aria-label="People">
        <div ref={bandA} className="ea-band ea-band-a" aria-hidden="true">
          {AV_TOP.map((k, i) => (
            <span key={k} className="ea-av" style={{ ["--y" as string]: ((i * 37) % 5) * 12 - 24 + "px" } as CSSProperties}>
              <img src={pic(k)} alt="" width={88} height={88} />
            </span>
          ))}
        </div>
        <div className="ea-bands-mid" data-rv>
          <span className="ea-spark" aria-hidden="true">
            <Svg d={ICON.logo} size={14} stroke={2} />
          </span>
          <h2 className="ea-h2 ea-center">
            <Words parts={["You will find yourself", "\n", "among my people"]} />
          </h2>
          <p className="ea-small ea-center">
            <Words parts={["Clients, collaborators and friends who have built something with Kedhareswer."]} at={7} />
          </p>
        </div>
        <div ref={bandB} className="ea-band ea-band-b" aria-hidden="true">
          {AV_BOT.map((k, i) => (
            <span key={k} className="ea-av" style={{ ["--y" as string]: ((i * 53) % 5) * 12 - 24 + "px" } as CSSProperties}>
              <img src={pic(k)} alt="" width={88} height={88} />
            </span>
          ))}
        </div>
      </section>

      {/* ---------- story bento ---------- */}
      <section id="story" className="ea-sec ea-story" aria-label="Projects">
        <div className="ea-wrap">
          <div data-rv className="ea-center-head">
            <p className="ea-eyebrow">
              <Words parts={["MY STORY", ["TELLING", "ea-bluew"]]} />
            </p>
            <h2 className="ea-h2 ea-center">
              <Words parts={["Every project", "\n", "tells a story"]} at={3} />
            </h2>
          </div>
          <div className="ea-bento">
            <div className="ea-col">
              <article className="ea-bcard ea-b1" data-rv>
                <span className="ea-label">
                  <Svg d={ICON.play} size={8} fill="currentColor" stroke={0} /> Play Video
                </span>
                <div className="ea-pile" aria-hidden="true">
                  <img src={pic("b3")} alt="" width={150} height={150} />
                  <img src={pic("b1")} alt="" width={150} height={150} />
                  <img src={pic("a6")} alt="" width={150} height={150} />
                  <span className="ea-tag ea-blue ea-t9">@client1</span>
                </div>
                <h3 className="ea-h4">Project 01 — Connect, Create, Ship</h3>
                <p className="ea-small">A storefront that lets makers sell a piece of their story, designed and built end to end.</p>
                <a className="ea-chipbtn" href={mail}>
                  How it works?
                </a>
              </article>
              <article className="ea-bcard ea-img" data-rv>
                <div className="ea-photo">
                  <img src={pic("c2")} alt="Project 03 — pop-art campaign" width={550} height={300} />
                </div>
                <h3 className="ea-h4">Project 03 — Spin Your Idea into Gold</h3>
                <p className="ea-small">A launch campaign where the brand, the site and the motion came from one desk.</p>
                <a className="ea-chipbtn" href={mail}>
                  See the case
                </a>
              </article>
            </div>
            <div className="ea-col ea-col-r">
              <article className="ea-bcard ea-img" data-rv>
                <div className="ea-photo ea-blueph">
                  <img src={pic("c1")} alt="Project 02 — eye illustration" width={550} height={300} />
                </div>
                <h3 className="ea-h4">Project 02 — Where Design Breathes Code</h3>
                <p className="ea-small">A design system that ships as React components, so the mock-up and the product never drift.</p>
                <a className="ea-chipbtn" href={mail}>
                  Read more
                </a>
              </article>
              <article className="ea-bcard ea-phone-wrap" data-rv>
                <span className="ea-pen" aria-hidden="true">
                  <Svg d={ICON.pen} size={13} />
                </span>
                <div className="ea-phone">
                  <small>Project 04</small>
                  <em>Expression feels</em>
                  <b>Personal Identity</b>
                  <em>Crafted by Kedhareswer</em>
                  <small>an identity kit for a solo founder</small>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- archive carousel ---------- */}
      <section id="archive" className="ea-sec ea-market" aria-label="Archive">
        <div className="ea-wrap">
          <div className="ea-market-grid">
            <div data-rv className="ea-market-head">
              <p className="ea-eyebrow">
                <Words parts={["GET MORE", ["CLOSER", "ea-purplew"]]} />
              </p>
              <h2 className="ea-h2">
                <Words parts={["Archive", "\n", "for Creativity"]} at={2} />
              </h2>
              <p className="ea-small ea-wrapm">
                <Words parts={["Posters, studies and side projects Kedhareswer makes between client work."]} at={5} />
              </p>
              <div className="ea-mini-arrows ea-arc-arrows">
                <button type="button" aria-label="Previous project" onClick={() => setArc((a) => Math.max(0, a - 1))} disabled={arc === 0}>
                  <Svg d={ICON.left} size={11} stroke={2} />
                </button>
                <button type="button" aria-label="Next project" onClick={() => setArc((a) => Math.min(ARCHIVE.length - 4, a + 1))} disabled={arc >= ARCHIVE.length - 4}>
                  <Svg d={ICON.right} size={11} stroke={2} />
                </button>
              </div>
            </div>
            <div className="ea-market-right" data-rv>
              <a className="ea-viewall" href="#archive">
                View All
              </a>
              <div className="ea-rail">
                <div className="ea-rail-track" style={{ ["--ci" as string]: arc } as CSSProperties}>
                  {ARCHIVE.map((a, i) => (
                    <figure key={a.k} className="ea-arc" style={{ ["--i" as string]: i } as CSSProperties}>
                      <div>
                        <img src={pic(a.k)} alt={a.t} width={220} height={220} />
                      </div>
                      <figcaption>{a.t}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
              <div className="ea-progress" aria-hidden="true">
                <i style={{ ["--ci" as string]: arc } as CSSProperties} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- stage 3: banner → portrait wall ---------- */}
      <section ref={s3} className="ea-stage" style={stage(3)} aria-label="Featured portrait">
        <div ref={pin3} className="ea-pin" style={{ height }}>
          <div ref={appRow} className="ea-lead">
            <p className="ea-eyebrow">
              FEATURED <span className="ea-orangew">PROJECT</span>
            </p>
            <h2 className="ea-h2 ea-center">
              Project 07,
              <br />
              up close.
            </h2>
            <p className="ea-small ea-center">A portrait campaign Kedhareswer art-directed, then built the site around.</p>
          </div>
          {WALL.map((k, i) =>
            k ? (
              <div key={k} ref={(el) => { wall.current[i] = el }} className="ea-wall" aria-hidden="true">
                <img src={pic(k)} alt="" width={195} height={210} />
              </div>
            ) : null,
          )}
          <div ref={banner} className="ea-orange">
            <img src={pic("muse")} alt="Project 07 — portrait in orange" width={780} height={920} />
            <div className="ea-orange-ui">
              <span className="ea-tag ea-redtag ea-t10">@kedhar</span>
              <button type="button" className={"ea-like" + (liked ? " on" : "")} aria-pressed={liked} onClick={() => setLiked((l) => !l)}>
                <Svg d={ICON.heart} size={10} fill={liked ? "currentColor" : "none"} stroke={2} />
                Like
              </button>
              <div className="ea-by">
                <img src={pic("v4")} alt="" width={28} height={28} />
                <span>
                  <b>Project 07</b>
                  <small>by Kedhareswer</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- membership ---------- */}
      <section id="pricing" className="ea-sec ea-price" aria-label="Pricing">
        <div className="ea-wrap ea-price-grid">
          <div data-rv>
            <span className="ea-eye">
              <Svg d={ICON.mail} size={15} />
            </span>
            <h2 className="ea-h3">
              <Words parts={["Engagements"]} />
            </h2>
            <p className="ea-small ea-wrapp">
              <Words parts={["Hire Kedhareswer by the month, the quarter or the year. Every plan is design and front-end in one."]} at={1} />
            </p>
          </div>
          <div className="ea-plans" data-rv>
            <div className="ea-plan ea-p1">
              <small>Monthly</small>
              <b>
                <sup>$</sup>9<small>.9k</small>
              </b>
              <em>One product, one month</em>
            </div>
            <div className="ea-plan ea-p2">
              <small>Quarterly</small>
              <span className="ea-pop-pill">Popular</span>
              <b>
                <sup>$</sup>12<small>.9k</small>
              </b>
              <em>Regular monthly payment</em>
            </div>
            <div className="ea-plan ea-p3">
              <small>Annually</small>
              <b>
                <sup>$</sup>19<small>.9k</small>
              </b>
              <em>A standing design partner</em>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- lime marquee + falling doodles ---------- */}
      <section ref={limeRef} className="ea-sec ea-lime-sec" aria-label="Open for projects">
        <div className="ea-lime">
          <span className="ea-water" aria-hidden="true">
            KDR
          </span>
          <div className="ea-marquee">
            <div ref={limeTrack} className="ea-mtrack">
              {[0, 1].map((rep) => (
                <span key={rep} className="ea-mrun" aria-hidden={rep === 1}>
                  Founders can ride
                  <span className="ea-mthumbs">
                    <i style={{ background: "#e8203a" }} />
                    <img src={pic("a2")} alt="" width={44} height={44} />
                    <img src={pic("b4")} alt="" width={44} height={44} />
                    <small>2026 POSTER</small>
                  </span>
                  Inspired by people
                  <span className="ea-mthumbs">
                    <img src={pic("a3")} alt="" width={44} height={44} />
                  </span>
                  New work every month
                  <span className="ea-mthumbs">
                    <img src={pic("b6")} alt="" width={44} height={44} />
                  </span>
                  Kedhareswer · Open for projects
                  <span className="ea-mthumbs">
                    <img src={pic("a1")} alt="" width={44} height={44} />
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div ref={pile} className="ea-pilebox" aria-hidden="true">
            {DOODLES.map((d, i) => (
              <span key={i} ref={(el) => { balls.current[i] = el }} className="ea-ball">
                <Svg d={d} size={34} stroke={1.4} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- meet + archive ---------- */}
      <section className="ea-sec ea-duo" aria-label="Get in touch">
        <div className="ea-wrap ea-duo-grid">
          <article className="ea-meet" data-rv>
            <img src={pic("meet")} alt="Portrait on magenta" width={590} height={650} />
            <div>
              <Svg d={ICON.pen} size={14} />
              <h3 className="ea-h3">
                Meet
                <br />
                <span>me in person</span>
              </h3>
              <p className="ea-small">Coffee, a call or a workshop: Kedhareswer is always happy to talk shop.</p>
              <a className="ea-btn ea-btn-w" href={mail}>
                Let&apos;s Meet
              </a>
            </div>
          </article>
          <article className="ea-arch" data-rv>
            <img src={pic("archive")} alt="Sculptural flower" width={575} height={650} />
            <div>
              <Svg d={ICON.spark} size={14} />
              <h3 className="ea-h3">
                Archive
                <br />
                of new work
              </h3>
              <p className="ea-small">Every case study, poster and experiment, filed in one place and kept up to date.</p>
              <a className="ea-btn" href="#archive">
                Archives
              </a>
            </div>
          </article>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="ea-foot">
        <div className="ea-wrap ea-foot-grid">
          <div>
            <h2 className="ea-h4">
              My work, your product. <span className="ea-foot-dots" aria-hidden="true">•••</span>
            </h2>
            <p className="ea-small">Kedhareswer designs and builds interfaces for founders and teams. Write any time:</p>
            <a className="ea-mail" href={mail}>
              {email}
            </a>
            <div className="ea-socials">
              {[ICON.mail, ICON.globe, ICON.grid, ICON.spark].map((d, i) => (
                <a key={i} href={mail} aria-label={["Email", "Studio", "Work", "Notes"][i]}>
                  <Svg d={d} size={12} />
                </a>
              ))}
            </div>
          </div>
          <ul>
            <li>Get Started</li>
            <li>
              <i className="ea-dot" /> Start a project <span className="ea-new">New</span>
            </li>
            <li>Pricing</li>
            <li>
              <a href={mail}>Contact</a>
            </li>
            <li>Process</li>
            <li>Archive</li>
          </ul>
          <ul>
            <li>My Story</li>
            <li>
              <i className="ea-dot" /> Case studies
            </li>
            <li>
              Lab <span className="ea-soon">Soon</span>
            </li>
          </ul>
          <ul>
            <li>Privacy &amp; Policy</li>
            <li>
              <a href={mail}>Contact Us</a>
            </li>
            <li>
              Api <span className="ea-soon">Soon</span>
            </li>
          </ul>
          <p className="ea-copy">© 2026 Kedhareswer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

const EASE = "cubic-bezier(.22,1,.36,1)"

const CSS =
  "@font-face{font-family:EaSans;font-style:normal;font-weight:400 600;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}" +
  ".ea-root{--bg:#f6f6f5;--ink:#141414;--mute:#6d6d6d;--soft:#bdbdbd;--card:#ffffff;--line:#e3e3e1;--foot:#efefee;--red:#8e1b2c;--blue:#2f5bff;--mint:#a6e8c1;--purple:#c43ef0;--lime:#e6fa6a;--orange:#f2541b;" +
  "position:relative;width:100%;overflow:clip;background:var(--bg);color:var(--ink);font-family:EaSans,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;font-weight:400;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;letter-spacing:-.01em;line-height:1.4;transition:background-color .4s ease,color .4s ease}" +
  ".dark .ea-root,.ea-root.ea-dark{--bg:#0f0f10;--ink:#f1f1ef;--mute:#9d9d9b;--soft:#4a4a4c;--card:#19191b;--line:#2b2b2d;--foot:#151517;--red:#ec6a7d}" +
  ".ea-root *,.ea-root *::before,.ea-root *::after{box-sizing:border-box}" +
  ".ea-root img{max-width:none}" +
  ".ea-root :where(img){display:block;user-select:none;-webkit-user-drag:none}" +
  ".ea-root :where(a){color:inherit;text-decoration:none}" +
  ".ea-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}" +
  ".ea-root :where(h1,h2,h3,h4,p,ul,figure){margin:0;padding:0}" +
  ".ea-root :where(ul){list-style:none}" +
  ".ea-wrap{width:100%;max-width:1440px;margin:0 auto;padding:0 clamp(20px,7.1vw,102px)}" +
  // nav
  ".ea-nav{position:sticky;top:0;z-index:40;height:110px;margin-bottom:-110px;display:flex;align-items:center;gap:24px;padding:30px clamp(20px,5.6vw,80px) 0;pointer-events:none}" +
  ".ea-nav>*{pointer-events:auto}" +
  ".ea-nav::before{content:'';position:absolute;left:0;right:0;top:0;bottom:12px;z-index:-1;background:rgba(246,246,245,.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--line);opacity:0;transition:opacity .35s ease}" +
  ".dark .ea-nav::before,.ea-dark .ea-nav::before{background:rgba(15,15,16,.8)}" +
  ".ea-nav.ea-solid::before{opacity:1}" +
  ".ea-brand{display:inline-flex;align-items:center;gap:10px;font-size:19px;font-weight:500;letter-spacing:-.02em;margin-right:auto}" +
  ".ea-logo{display:grid;place-items:center;color:#5fcfb8}" +
  ".ea-links{display:flex;align-items:center;gap:clamp(18px,2.4vw,34px);font-size:13px;font-weight:500}" +
  ".ea-link{position:relative;display:inline-flex;align-items:center;gap:6px;padding:4px 0}" +
  ".ea-link::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .45s " + EASE + "}" +
  ".ea-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--ink);box-shadow:inset 0 0 0 2px var(--ink),inset 0 0 0 3px var(--bg)}" +
  ".ea-tools{display:flex;gap:8px;margin-left:clamp(12px,3vw,48px)}" +
  ".ea-round{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--card);box-shadow:0 1px 0 var(--line);transition:transform .3s " + EASE + "}" +
  // shared type
  ".ea-h1{font-size:clamp(38px,5.6vw,80px);line-height:1.05;letter-spacing:-.045em;font-weight:500;text-align:center}" +
  ".ea-h2{font-size:clamp(34px,4.6vw,66px);line-height:1.06;letter-spacing:-.04em;font-weight:500}" +
  ".ea-h2.ea-big{font-size:clamp(36px,4.85vw,70px)}" +
  ".ea-h2.ea-mid{font-size:clamp(28px,3vw,44px)}" +
  ".ea-h3{font-size:clamp(26px,2.65vw,38px);line-height:1.1;letter-spacing:-.035em;font-weight:500}" +
  ".ea-h4{font-size:17px;line-height:1.25;letter-spacing:-.02em;font-weight:600}" +
  ".ea-center{text-align:center}" +
  ".ea-eyebrow{font-size:10px;letter-spacing:.32em;font-weight:600;text-transform:uppercase;margin-bottom:16px}" +
  ".ea-body{font-size:13px;line-height:1.7}" +
  ".ea-small{font-size:12.5px;line-height:1.6;color:var(--mute)}" +
  ".ea-red{color:var(--red)}" +
  ".ea-grey{color:var(--mute)}" +
  ".ea-bluew{color:var(--blue)}" +
  ".ea-purplew{color:var(--purple)}" +
  ".ea-orangew{color:var(--orange)}" +
  // word reveal
  ".ea-w{display:inline-block;opacity:0;filter:blur(8px);transform:translate3d(0,.25em,0);transition:opacity .7s " + EASE + ",filter .7s " + EASE + ",transform .7s " + EASE + ";transition-delay:calc(var(--i) * 70ms)}" +
  ".ea-in .ea-w{opacity:1;filter:blur(0);transform:none}" +
  ".ea-late{opacity:0;transform:translate3d(0,14px,0);transition:opacity .7s " + EASE + " .55s,transform .7s " + EASE + " .55s}" +
  ".ea-in .ea-late,.ea-in.ea-late{opacity:1;transform:none}" +
  ".ea-fade{opacity:0;transform:translate3d(0,14px,0);transition:opacity .8s " + EASE + " var(--d),transform .8s " + EASE + " var(--d)}" +
  ".ea-in .ea-fade{opacity:1;transform:none}" +
  // buttons, tags
  ".ea-btns{display:flex;align-items:center;gap:22px}" +
  ".ea-btn{display:inline-flex;align-items:center;height:40px;padding:0 22px;border-radius:999px;background:var(--ink);color:var(--bg);font-size:12px;font-weight:500;white-space:nowrap;transition:transform .35s " + EASE + ",box-shadow .35s " + EASE + "}" +
  ".ea-btn-w{background:#fff;color:#141414}" +
  ".ea-ghost,.ea-textlink{font-size:12px;font-weight:500;position:relative}" +
  ".ea-ghost::after,.ea-textlink::after{content:'';position:absolute;left:0;right:0;bottom:-3px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .45s " + EASE + "}" +
  ".ea-tag{position:absolute;z-index:30;display:inline-flex;align-items:center;height:30px;padding:0 13px;border-radius:999px;font-size:13px;font-weight:500;letter-spacing:-.01em;white-space:nowrap;opacity:0;transform:translate3d(0,8px,0) scale(.6) rotate(var(--r,0deg));transition:opacity .45s " + EASE + ",transform .6s cubic-bezier(.34,1.56,.64,1);pointer-events:none}" +
  ".ea-tag::after{content:'';position:absolute;left:50%;bottom:-5px;width:10px;height:10px;margin-left:-5px;background:inherit;transform:rotate(45deg);border-radius:2px;z-index:-1}" +
  ".ea-blue{background:#2f5bff;color:#fff}" +
  ".ea-mint{background:#a6e8c1;color:#0f5b38}" +
  ".ea-redtag{background:#b3192e;color:#fff}" +
  ".ea-ink{background:#141414;color:#fff}" +
  ".ea-orange{background:#f6a13a;color:#3b1600}" +
  ".ea-pop.ea-tag{position:absolute}" +
  ".ea-in .ea-pop,.ea-tags1 .ea-t1,.ea-tags1 .ea-t2,.ea-tags2 .ea-t3,.ea-tags2 .ea-t4{opacity:1;transform:translate3d(0,0,0) scale(1) rotate(var(--r,0deg))}" +
  // pinned stages
  ".ea-stage{position:relative}" +
  ".ea-pin{position:sticky;top:0;overflow-x:clip;overflow-y:visible;min-height:520px}" +
  ".ea-deck{position:absolute;inset:0;pointer-events:none}" +
  ".ea-card{position:absolute;left:0;top:0;border-radius:16px;overflow:hidden;background:var(--card);box-shadow:0 30px 50px -28px rgba(0,0,0,.45),0 2px 6px rgba(0,0,0,.08);will-change:transform;backface-visibility:hidden;opacity:0}" +
  ".ea-ready .ea-card{opacity:1}" +
  ".ea-card img{width:100%;height:100%;object-fit:cover}" +
  ".ea-c1{width:260px;height:282px}" +
  ".ea-c2{width:230px;height:230px;border-radius:14px}" +
  ".ea-hero{position:absolute;left:0;right:0;top:clamp(120px,20.5vh,180px);display:flex;flex-direction:column;align-items:center;z-index:2;will-change:transform}" +
  ".ea-hero-foot{position:absolute;top:calc(80vh - clamp(120px,20.5vh,180px));left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center;padding:0 20px}" +
  ".ea-hero-foot p{font-size:13px;color:var(--ink)!important;max-width:420px;color:var(--mute)}" +
  ".ea-t1{left:calc(50% - clamp(160px,25vw,360px));top:calc(clamp(120px,20.5vh,180px) + clamp(118px,16.5vh,152px));--r:-6deg}" +
  ".ea-t2{left:calc(50% + clamp(120px,24vw,350px));top:calc(clamp(120px,20.5vh,180px) + clamp(120px,17vh,160px));--r:8deg}" +
  ".ea-show{position:absolute;left:clamp(20px,7.1vw,102px);top:clamp(96px,13vh,112px);max-width:min(620px,92vw);z-index:2}" +
  ".ea-show .ea-btns{margin-top:clamp(22px,8vh,80px)}" +
  ".ea-wrapp{max-width:280px;margin-top:22px}" +
  ".ea-t3{left:calc(47% - 100px);top:calc(53% - 40px);--r:-4deg}" +
  ".ea-t4{left:calc(78%);top:58%;--r:5deg}" +
  ".ea-updown{position:absolute;right:clamp(20px,6.2vw,90px);top:48%;display:flex;flex-direction:column;gap:6px;color:var(--mute);z-index:2}" +
  // gateway
  ".ea-sec{position:relative}" +
  ".ea-gate{position:relative;padding:clamp(110px,15vh,150px) 0 0}" +
  ".ea-gate-head{position:relative;margin-bottom:28px}" +
  ".ea-t5{right:9%;bottom:6px;--r:9deg}" +
  ".ea-banner{position:relative;height:clamp(300px,36vw,520px);border-radius:16px;overflow:hidden;background:#ee6a4b;opacity:0;transform:translate3d(0,40px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".ea-banner.ea-in{opacity:1;transform:none}" +
  ".ea-banner img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:70% 30%;opacity:0;transform:scale(1.04);transition:opacity .8s ease,transform 1.4s " + EASE + "}" +
  ".ea-banner img.on{opacity:1;transform:none}" +
  ".ea-switch{position:absolute;left:24px;top:24px;display:flex;flex-direction:column;gap:6px}" +
  ".ea-switch i{width:34px;height:34px;border-radius:10px;background:#fff}" +
  ".ea-switch i+i{background:#141414}" +
  ".ea-more{position:absolute;right:22px;top:16px;color:#fff;opacity:.8}" +
  ".ea-watch{position:absolute;left:24px;bottom:22px;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 16px;border-radius:999px;background:#fff;color:#141414;font-size:12.5px;font-weight:500}" +
  ".ea-arrows{position:absolute;right:22px;bottom:20px;display:flex;gap:6px}" +
  ".ea-arrows button{width:36px;height:36px;border-radius:50%;background:#fff;color:#141414;display:grid;place-items:center;transition:transform .3s " + EASE + "}" +
  // trusted
  ".ea-trust{padding:clamp(80px,13vh,130px) 0 clamp(40px,7vh,70px)}" +
  ".ea-trust-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}" +
  ".ea-trust-head .ea-small{margin-top:10px}" +
  ".ea-mini-arrows{display:flex;gap:12px;color:var(--mute)}" +
  ".ea-mini-arrows button:disabled{opacity:.3;cursor:default}" +
  ".ea-logos{margin-top:clamp(36px,6vh,60px);overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}" +
  ".ea-logos-track{display:flex;width:max-content;animation:ea-marq 28s linear infinite}" +
  ".ea-logo-item{display:inline-flex;align-items:center;gap:8px;padding:0 clamp(28px,3.4vw,50px);font-size:clamp(17px,1.6vw,23px);font-weight:600;letter-spacing:-.02em;color:var(--mute);opacity:.7;white-space:nowrap}" +
  "@keyframes ea-marq{to{transform:translate3d(-50%,0,0)}}" +
  // whether
  ".ea-whether{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 20px;z-index:1}" +
  ".ea-ink-text{font-size:clamp(26px,3.9vw,56px);line-height:1.2;letter-spacing:-.04em;font-weight:500;text-align:center;max-width:1240px;margin-top:16vh}" +
  ".ea-sw{opacity:.18;transition:opacity .15s linear}" +
  ".ea-mintw{color:#2fbf75}" +
  ".ea-chip{display:inline-block;vertical-align:-.12em;width:.85em;height:.85em;border-radius:.2em;overflow:hidden}" +
  ".ea-chip img{width:100%;height:100%;object-fit:cover}" +
  ".ea-iconrow{display:flex;gap:10px;margin-top:5vh;color:var(--ink)}" +
  ".ea-iconrow svg{width:22px;height:22px;padding:4px;border-radius:6px;background:var(--card)}" +
  ".ea-t6{left:14%;top:37%;--r:-5deg;opacity:1;transform:rotate(var(--r))}" +
  ".ea-t7{left:82%;top:38%;--r:7deg;opacity:1;transform:rotate(var(--r))}" +
  ".ea-t8{left:62%;top:44%;--r:-6deg}" +
  ".ea-doodled .ea-t8{opacity:0}" +
  ".ea-pin:not(.ea-doodled) .ea-t8{opacity:0}" +
  ".ea-info{width:230px;height:280px;padding:22px 20px;display:flex;flex-direction:column;gap:6px;background:var(--card);color:var(--ink)}" +
  ".ea-info b{font-size:15px;line-height:1.15;font-weight:600;letter-spacing:-.02em}" +
  ".ea-info small{font-size:10px;color:var(--mute)}" +
  ".ea-info p{margin-top:auto;font-size:11.5px;line-height:1.5;color:var(--mute)}" +
  ".ea-info-dot{position:absolute;right:18px;top:18px;width:22px;height:22px;border-radius:50%;background:var(--ink);box-shadow:inset 0 0 0 6px var(--ink),inset 0 0 0 8px var(--card)}" +
  ".ea-folder{position:absolute;opacity:0;border-radius:16px;z-index:0;background:var(--card);box-shadow:0 30px 60px -40px rgba(0,0,0,.35)}" +
  ".ea-folder-tab{position:absolute;left:0;top:0;right:0;height:56px;display:flex;justify-content:space-between;align-items:center;padding:0 16px 0 22px;font-size:clamp(14px,1.35vw,19px);font-weight:500;color:var(--ink)}" +
  ".ea-folder-tab b{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;background:var(--card);font-size:10px;font-weight:500}" +
  ".ea-folder-bar{position:absolute;left:0;right:0;top:58px;height:64px;background:#141414;color:#fff;border-radius:14px 14px 0 0;clip-path:polygon(0 0,62% 0,68% 42%,100% 42%,100% 100%,0 100%);padding:16px 22px;font-size:clamp(14px,1.35vw,19px);font-weight:500}" +
  ".ea-vision{position:absolute;left:clamp(20px,7.1vw,102px);top:clamp(140px,19vh,170px);max-width:min(560px,88vw);z-index:2}" +
  ".ea-eye{display:inline-grid;place-items:center;margin-bottom:12px}" +
  ".ea-wrapv{margin-top:12px;max-width:340px}" +
  ".ea-textlink{display:inline-block;margin-top:22px}" +
  ".ea-doodles{position:absolute;left:clamp(30px,6vw,90px);top:62%;width:min(420px,60vw);height:30%;z-index:1}" +
  ".ea-doodle{position:absolute;color:var(--ink);opacity:0;transform:scale(.3) rotate(-30deg);transition:opacity .5s " + EASE + ",transform .7s cubic-bezier(.34,1.56,.64,1);transition-delay:calc(var(--i) * 60ms)}" +
  ".ea-doodled .ea-doodle{opacity:1;transform:none}" +
  ".ea-doodle:nth-child(1){left:20%;top:0}.ea-doodle:nth-child(2){left:0;top:38%}.ea-doodle:nth-child(3){left:17%;top:36%}.ea-doodle:nth-child(4){left:36%;top:42%}.ea-doodle:nth-child(5){left:61%;top:40%}" +
  ".ea-doodle:nth-child(6){left:4%;top:76%}.ea-doodle:nth-child(7){left:22%;top:78%}.ea-doodle:nth-child(8){left:44%;top:80%}.ea-doodle:nth-child(9){left:66%;top:6%}" +
  // bands
  ".ea-bands{position:relative;padding:clamp(60px,10vh,110px) 0;overflow:hidden}" +
  ".ea-band{display:flex;gap:clamp(14px,2.2vw,32px);width:max-content;will-change:transform}" +
  ".ea-av{width:clamp(56px,6.1vw,88px);height:clamp(56px,6.1vw,88px);border-radius:14px;overflow:hidden;flex:none;transform:translate3d(0,var(--y),0);box-shadow:0 10px 24px -14px rgba(0,0,0,.4)}" +
  ".ea-av img{width:100%;height:100%;object-fit:cover}" +
  ".ea-bands-mid{display:flex;flex-direction:column;align-items:center;gap:14px;padding:clamp(60px,9vh,100px) 20px}" +
  ".ea-bands-mid .ea-small{max-width:300px}" +
  ".ea-spark{color:var(--ink)}" +
  // story
  ".ea-story{padding:clamp(60px,9vh,100px) 0}" +
  ".ea-center-head{display:flex;flex-direction:column;align-items:center;margin-bottom:clamp(40px,8vh,90px)}" +
  ".ea-bento{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:1116px;margin:0 auto}" +
  ".ea-col{display:flex;flex-direction:column;gap:16px}" +
  ".ea-col-r{padding-top:clamp(0px,6vw,85px)}" +
  ".ea-bcard{position:relative;border-radius:16px;background:var(--card);padding:22px;display:flex;flex-direction:column;gap:8px;opacity:0;transform:translate3d(0,50px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".ea-bcard.ea-in{opacity:1;transform:none}" +
  ".ea-bcard .ea-chipbtn{align-self:flex-start;margin-top:6px;height:24px;padding:0 10px;border-radius:999px;border:1px solid var(--line);display:inline-flex;align-items:center;font-size:10.5px}" +
  ".ea-label{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:500}" +
  ".ea-b1 .ea-pile{position:relative;height:clamp(220px,22vw,300px);margin:6px 0 10px}" +
  ".ea-pile img{position:absolute;left:50%;top:50%;width:clamp(130px,13vw,190px);height:clamp(130px,13vw,190px);object-fit:cover;border-radius:12px;box-shadow:0 20px 34px -20px rgba(0,0,0,.5);transition:transform .7s " + EASE + "}" +
  ".ea-pile img:nth-child(1){transform:translate(-62%,-46%) rotate(-12deg)}" +
  ".ea-pile img:nth-child(2){transform:translate(-50%,-52%) rotate(-3deg)}" +
  ".ea-pile img:nth-child(3){transform:translate(-36%,-56%) rotate(8deg)}" +
  ".ea-t9{left:62%;top:8%;--r:6deg}" +
  ".ea-b1.ea-in .ea-t9{opacity:1;transform:rotate(var(--r));transition-delay:.5s}" +
  ".ea-photo{position:relative;height:clamp(180px,21vw,300px);margin:-22px -22px 10px;border-radius:16px;overflow:hidden}" +
  ".ea-photo img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s " + EASE + "}" +
  ".ea-blueph{background:#1f2bd8}" +
  ".ea-phone-wrap{min-height:clamp(320px,33vw,470px);align-items:center;justify-content:center;background:transparent}" +
  ".ea-pen{position:absolute;right:16px;top:16px;width:28px;height:28px;border-radius:50%;background:var(--ink);color:var(--bg);display:grid;place-items:center}" +
  ".ea-phone{width:clamp(190px,19vw,270px);aspect-ratio:3/4;border-radius:22px;background:#141414;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:20px;box-shadow:0 30px 60px -30px rgba(0,0,0,.6)}" +
  ".ea-phone b{font-size:clamp(15px,1.4vw,19px);font-weight:600;letter-spacing:-.02em}" +
  ".ea-phone em{font-style:normal;font-size:12px;color:rgba(255,255,255,.35)}" +
  ".ea-phone small{font-size:9px;color:rgba(255,255,255,.4);letter-spacing:.1em;text-transform:uppercase}" +
  // archive carousel
  ".ea-market{padding:clamp(60px,10vh,110px) 0}" +
  ".ea-market-grid{display:grid;grid-template-columns:minmax(0,.27fr) minmax(0,.73fr);gap:24px;align-items:start}" +
  ".ea-market-head{grid-column:1/-1}" +
  ".ea-wrapm{max-width:250px;margin-top:16px}" +
  ".ea-arc-arrows{margin-top:clamp(40px,17vh,150px)}" +
  ".ea-market-right{grid-column:2;margin-top:-50px;position:relative;opacity:0;transition:opacity .8s " + EASE + "}" +
  ".ea-market-right.ea-in{opacity:1}" +
  ".ea-market-head{display:grid;grid-template-columns:minmax(0,1fr);}" +
  ".ea-viewall{position:absolute;right:0;top:-78px;height:24px;padding:0 16px;border-radius:999px;background:var(--purple);color:#fff;font-size:10.5px;font-weight:500;display:inline-flex;align-items:center}" +
  ".ea-rail{overflow:hidden}" +
  ".ea-rail-track{display:flex;gap:16px;transform:translate3d(calc(var(--ci) * (-1 * (var(--cw) + 16px))),0,0);transition:transform .8s " + EASE + ";--cw:clamp(140px,15.3vw,220px)}" +
  ".ea-arc{flex:none;width:var(--cw)}" +
  ".ea-arc div{width:var(--cw);height:var(--cw);border-radius:12px;overflow:hidden;opacity:0;filter:blur(10px);transform:scale(.94);transition:opacity .8s " + EASE + ",filter .8s " + EASE + ",transform .8s " + EASE + ";transition-delay:calc(var(--i) * 90ms)}" +
  ".ea-in .ea-arc div{opacity:1;filter:blur(0);transform:none}" +
  ".ea-arc img{width:100%;height:100%;object-fit:cover;transition:transform .8s " + EASE + "}" +
  ".ea-arc figcaption{margin-top:10px;font-size:12px;font-weight:600;letter-spacing:-.01em}" +
  ".ea-progress{position:relative;height:2px;margin-top:22px;width:calc(var(--cw,clamp(140px,15.3vw,220px)))}" +
  ".ea-progress i{position:absolute;left:0;top:0;height:2px;width:clamp(140px,15.3vw,220px);background:var(--ink);transform:translate3d(calc(var(--ci) * 25%),0,0);transition:transform .8s " + EASE + "}" +
  // stage 3
  ".ea-lead{position:absolute;left:50%;top:22%;width:min(640px,90vw);display:flex;flex-direction:column;align-items:center;gap:14px;z-index:3}" +
  ".ea-lead .ea-eyebrow{margin-bottom:0}" +
  ".ea-lead .ea-small{max-width:340px}" +
  ".ea-wall{position:absolute;left:0;top:0;border-radius:12px;overflow:hidden;opacity:0;will-change:transform}" +
  ".ea-wall img{width:100%;height:100%;object-fit:cover}" +
  ".ea-orange{position:absolute;overflow:hidden;background:#f26a1b;z-index:2;box-shadow:0 40px 70px -40px rgba(120,40,0,.6)}" +
  ".ea-orange>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%}" +
  ".ea-orange-ui{position:absolute;inset:0;opacity:0;transition:opacity .5s " + EASE + "}" +
  ".ea-card-on .ea-orange-ui{opacity:1}" +
  ".ea-t10{left:14px;top:40px;--r:-10deg;height:24px;font-size:11px;padding:0 10px}" +
  ".ea-card-on .ea-t10{opacity:1;transform:rotate(var(--r))}" +
  ".ea-like{position:absolute;right:12px;top:12px;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 10px;border-radius:999px;background:#fff;color:#141414;font-size:10px;font-weight:500}" +
  ".ea-like.on{color:#e8203a}" +
  ".ea-by{position:absolute;left:12px;bottom:12px;display:flex;align-items:center;gap:8px;color:#fff}" +
  ".ea-by img{width:28px;height:28px;border-radius:8px;object-fit:cover}" +
  ".ea-by b{display:block;font-size:12px;font-weight:600}" +
  ".ea-by small{display:block;font-size:10px;opacity:.75}" +
  // pricing
  ".ea-price{padding:clamp(70px,12vh,130px) 0 clamp(40px,7vh,70px)}" +
  ".ea-price-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}" +
  ".ea-plans{position:relative;height:clamp(220px,18vw,260px);opacity:0;transition:opacity .6s " + EASE + "}" +
  ".ea-plans.ea-in{opacity:1}" +
  ".ea-plan{position:absolute;top:10%;width:clamp(150px,13.5vw,195px);height:clamp(150px,13.5vw,195px);border-radius:14px;background:var(--card);padding:16px;display:flex;flex-direction:column;box-shadow:0 30px 40px -30px rgba(0,0,0,.35);transform:translate3d(0,60px,0) rotate(0deg);transition:transform 1s cubic-bezier(.34,1.3,.64,1)}" +
  ".ea-plan small{font-size:11px;font-weight:500}" +
  ".ea-plan b{font-size:clamp(40px,4.2vw,60px);line-height:1;font-weight:600;letter-spacing:-.04em;margin-top:8px}" +
  ".ea-plan sup{font-size:.34em;vertical-align:.95em;margin:0 1px;letter-spacing:0}" +
  ".ea-plan b small{font-size:.3em;font-weight:500;letter-spacing:0;margin-left:2px}" +
  ".ea-plan em{margin-top:auto;font-style:normal;font-size:9.5px;color:var(--mute)}" +
  ".ea-p1{left:6%;z-index:1}" +
  ".ea-p2{left:34%;top:0;z-index:2;background:var(--orange);color:#fff;height:clamp(165px,14.5vw,210px)}" +
  ".ea-p2 em{color:rgba(255,255,255,.85)}" +
  ".ea-p3{left:62%;top:14%;z-index:1}" +
  ".ea-in .ea-p1{transform:rotate(-3deg)}.ea-in .ea-p2{transform:rotate(-1deg);transition-delay:.1s}.ea-in .ea-p3{transform:rotate(5deg);transition-delay:.2s}" +
  ".ea-pop-pill{position:absolute;right:12px;top:12px;height:20px;padding:0 9px;border-radius:999px;background:#fff;color:#141414;font-size:9.5px;font-weight:600;display:inline-flex;align-items:center;transform:rotate(8deg)}" +
  // lime
  ".ea-lime-sec{padding:0 clamp(16px,8.75vw,126px) clamp(16px,2vh,24px)}" +
  ".ea-lime{position:relative;height:clamp(420px,58vh,500px);border-radius:16px;background:var(--lime);color:#141414;overflow:hidden}" +
  ".ea-water{position:absolute;left:-2%;top:6%;font-size:clamp(200px,30vw,440px);line-height:.8;font-weight:600;letter-spacing:-.06em;color:rgba(255,255,255,.18);pointer-events:none}" +
  ".ea-marquee{position:relative;padding-top:clamp(14px,2.4vh,22px);overflow:hidden}" +
  ".ea-mtrack{display:flex;width:max-content;will-change:transform}" +
  ".ea-mrun{display:inline-flex;align-items:flex-start;font-size:clamp(34px,4.45vw,64px);line-height:1.15;letter-spacing:-.04em;font-weight:500;white-space:nowrap}" +
  ".ea-mthumbs{position:relative;display:inline-flex;align-items:center;gap:6px;margin:.18em .3em 0;height:.82em}" +
  ".ea-mthumbs img,.ea-mthumbs i{width:.82em;height:.82em;border-radius:.14em;object-fit:cover;display:block}" +
  ".ea-mthumbs i{width:.42em;height:.42em;border-radius:50%}" +
  ".ea-mthumbs small{position:absolute;left:46%;top:100%;margin-top:4px;font-size:8px;line-height:1.2;letter-spacing:.06em;font-weight:600;white-space:normal;width:40px;text-align:center}" +
  ".ea-pilebox{position:absolute;left:0;right:0;bottom:0;top:34%;cursor:crosshair}" +
  ".ea-ball{position:absolute;left:0;top:0;width:72px;height:72px;border-radius:50%;background:#fff;color:#141414;display:grid;place-items:center;transform:translate3d(-100px,-200px,0);will-change:transform;box-shadow:0 6px 12px -8px rgba(0,0,0,.4)}" +
  // duo
  ".ea-duo{padding:clamp(16px,2vh,24px) 0 clamp(100px,16vh,160px)}" +
  ".ea-duo-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(12px,1.9vw,27px);padding:0 clamp(16px,8.75vw,126px)}" +
  ".ea-meet,.ea-arch{position:relative;height:clamp(460px,45vw,650px);border-radius:16px;overflow:hidden;opacity:0;transform:translate3d(0,50px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".ea-meet.ea-in,.ea-arch.ea-in{opacity:1;transform:none}" +
  ".ea-meet{background:#d0105e;color:#fff}" +
  ".ea-arch{background:#fff;color:#141414}" +
  ".ea-meet>img,.ea-arch>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.4s " + EASE + "}" +
  ".ea-arch>img{inset:-4% -6% auto auto;width:88%;height:78%;object-position:50% 40%}" +
  ".ea-meet::after{content:'';position:absolute;inset:45% 0 0;background:linear-gradient(180deg,rgba(208,16,94,0),rgba(208,16,94,.85) 70%);pointer-events:none}" +
  ".ea-meet>div,.ea-arch>div{position:absolute;z-index:1;left:26px;right:26px;bottom:26px;display:flex;flex-direction:column;gap:10px;align-items:flex-start}" +
  ".ea-meet h3 span{color:#ffd1e4}" +
  ".ea-meet .ea-small{color:rgba(255,255,255,.75);max-width:300px}" +
  ".ea-arch .ea-small{color:#5b5b5b;max-width:330px}" +
  ".ea-arch .ea-btn{background:#141414;color:#fff}" +
  // footer
  ".ea-foot{background:var(--foot);padding:clamp(50px,7vh,70px) 0 clamp(30px,5vh,46px)}" +
  ".ea-foot-grid{display:grid;grid-template-columns:1.4fr .8fr .8fr .6fr;gap:32px;position:relative}" +
  ".ea-foot-grid .ea-small{max-width:280px;margin-top:12px}" +
  ".ea-foot .ea-h4{font-size:clamp(17px,1.45vw,21px)}" +
  ".ea-foot-dots{font-size:9px;letter-spacing:.1em;vertical-align:4px;margin-left:12px;padding:3px 7px;border-radius:999px;background:var(--card)}" +
  ".ea-mail{display:inline-block;margin-top:6px;font-size:12.5px;font-weight:500;border-bottom:1px solid var(--line)}" +
  ".ea-socials{display:flex;gap:8px;margin-top:22px}" +
  ".ea-socials a{width:26px;height:26px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;color:var(--mute);transition:color .3s ease,border-color .3s ease}" +
  ".ea-foot ul{display:flex;flex-direction:column;gap:11px;font-size:12.5px}" +
  ".ea-foot li{display:flex;align-items:center;gap:6px}" +
  ".ea-new,.ea-soon{height:16px;padding:0 7px;border-radius:999px;font-size:9px;display:inline-flex;align-items:center}" +
  ".ea-new{background:#ef3f6b;color:#fff}" +
  ".ea-soon{background:#ffe0e8;color:#c22c55}" +
  ".ea-copy{position:absolute;right:clamp(20px,7.1vw,102px);bottom:0;font-size:10.5px;color:var(--mute)}" +
  // hover — only where a mouse can hover
  "@media (hover:hover) and (pointer:fine){" +
  ".ea-link:hover::after,.ea-ghost:hover::after,.ea-textlink:hover::after{transform:scaleX(1);transform-origin:0 50%}" +
  ".ea-round:hover,.ea-arrows button:hover{transform:scale(1.1)}" +
  ".ea-btn:hover{transform:translate3d(0,-2px,0);box-shadow:0 12px 24px -12px rgba(0,0,0,.45)}" +
  ".ea-arc:hover img,.ea-photo:hover img,.ea-meet:hover>img,.ea-arch:hover>img{transform:scale(1.05)}" +
  ".ea-b1:hover .ea-pile img:nth-child(1){transform:translate(-80%,-44%) rotate(-18deg)}" +
  ".ea-b1:hover .ea-pile img:nth-child(3){transform:translate(-18%,-58%) rotate(14deg)}" +
  ".ea-plan:hover{transform:translate3d(0,-10px,0) rotate(0deg)!important;transition-duration:.45s;transition-delay:0s!important}" +
  ".ea-socials a:hover{color:var(--ink);border-color:var(--ink)}" +
  ".ea-av:hover{transform:translate3d(0,calc(var(--y) - 6px),0) scale(1.08);transition:transform .35s " + EASE + "}" +
  "}" +
  // tablet / phone
  "@media (max-width:1023px){.ea-links{display:none}.ea-market-grid{grid-template-columns:1fr}.ea-market-right{grid-column:1;margin-top:0}.ea-viewall{position:static;margin-bottom:16px}.ea-price-grid{grid-template-columns:1fr}.ea-foot-grid{grid-template-columns:1fr 1fr}.ea-copy{position:static;grid-column:1/-1}}" +
  "@media (max-width:767px){" +
  ".ea-nav{height:76px;margin-bottom:-76px;padding-top:16px}" +
  ".ea-show{top:84px}.ea-show .ea-btns{margin-top:18px}.ea-wrapp{margin-top:14px}" +
  ".ea-t3{left:12%;top:56%}.ea-t4{left:66%;top:62%}.ea-updown{display:none}" +
  ".ea-t1{left:8%}.ea-t2{left:auto;right:8%}" +
  ".ea-t6{left:6%;top:16%}.ea-t7{left:auto;right:6%;top:18%}" +
  ".ea-vision{top:96px}.ea-doodles{display:none}" +
  ".ea-folder-tab{font-size:12px}.ea-folder-bar{top:40px;height:46px;font-size:12px}" +
  ".ea-bento{grid-template-columns:1fr}.ea-col-r{padding-top:0}" +
  ".ea-duo-grid{grid-template-columns:1fr}" +
  ".ea-plan{width:42%;height:auto;aspect-ratio:1}.ea-p1{left:0}.ea-p2{left:29%;height:auto}.ea-p3{left:58%}" +
  ".ea-ball{width:48px;height:48px}.ea-ball svg{width:24px;height:24px}" +
  ".ea-trust-head{flex-direction:column;align-items:flex-start}" +
  "}" +
  // reduced motion: no time-based motion; scroll-linked stages follow the scrollbar only
  "@media (prefers-reduced-motion:reduce){" +
  ".ea-w,.ea-late,.ea-fade,.ea-tag,.ea-doodle,.ea-bcard,.ea-banner,.ea-banner img,.ea-arc div,.ea-plan,.ea-meet,.ea-arch,.ea-market-right,.ea-plans,.ea-rail-track,.ea-progress i{transition:none!important}" +
  ".ea-w{opacity:1;filter:none;transform:none}" +
  ".ea-late,.ea-fade,.ea-bcard,.ea-banner,.ea-meet,.ea-arch,.ea-market-right,.ea-plans,.ea-arc div{opacity:1;filter:none;transform:none}" +
  ".ea-logos-track{animation:none}" +
  "}" +
  ".ea-reduce .ea-w{transition:none;opacity:1;filter:none;transform:none}"
