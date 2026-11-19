"use client"

import * as React from "react"
import gsap from "gsap"

/* Synapse Folio — a blueprint-blue, one-page portfolio for Kedhareswer that assembles itself.
   On load a small crew of agent cursors builds the hero in front of you: one types the statement
   word by word, the others pick each object up, introduce it with a label, carry it into its slot
   and paste it there. The finished page is the server render, so with reduced motion (or no JS)
   you simply get the page. Afterwards everything stays live: drag the objects on the board, the
   globe and the eye follow your pointer, the grid lights the cell you are over, the pattern
   toggle swaps the board's paper, sections reveal as you scroll, and the nav replays the build. */

const BASE = "https://kedhar-components.pages.dev/synapse-folio-template/"

export type SynapseSlot = "star" | "links" | "eye" | "coral"
export type SynapseToken = string | { slot: SynapseSlot } | { box: string }
export type SynapseProject = { title: string; kind: string; year: string; blurb: string; image: string }
export type SynapseClient = { name: string; work: string; year: string }
export type SynapseAgent = { name: string; color: string }

export type SynapseFolioTemplateProps = {
  /** Height of the hero. A definite length, never a percentage. */
  height?: string
  brand?: string
  lead?: SynapseToken[]
  body?: SynapseToken[]
  note?: string
  noteTag?: string
  essentially?: string
  projects?: SynapseProject[]
  clients?: SynapseClient[]
  closing?: string
  email?: string
  city?: string
  timeZone?: string
  agents?: SynapseAgent[]
  /** Play the self-assembly intro on load. The nav button replays it either way. */
  playIntro?: boolean
  assetBase?: string
  className?: string
  style?: React.CSSProperties
}

const DEFAULT_LEAD: SynapseToken[] = ["I design", { slot: "star" }, "systems that shape how", { box: "people and models" }, "connect.", { slot: "links" }]
const DEFAULT_BODY: SynapseToken[] = ["From agent interfaces to retrieval pipelines, my work", { slot: "eye" }, "lives at the intersection of", { slot: "coral" }, "language and product."]

const DEFAULT_PROJECTS: SynapseProject[] = [
  { title: "Project 01", kind: "Product design · Agents", year: "2026", blurb: "Placeholder for a case study. Swap in the brief, the build and what changed for the people using it.", image: "p1.webp" },
  { title: "Project 02", kind: "Systems · Retrieval", year: "2025", blurb: "Placeholder for a case study. Swap in the brief, the build and what changed for the people using it.", image: "p2.webp" },
  { title: "Project 03", kind: "Research · Interfaces", year: "2024", blurb: "Placeholder for a case study. Swap in the brief, the build and what changed for the people using it.", image: "p3.webp" },
]

const DEFAULT_CLIENTS: SynapseClient[] = [
  { name: "Client 1", work: "Agent tooling and design system", year: "2026" },
  { name: "Client 2", work: "Search and retrieval platform", year: "2025" },
  { name: "Client 3", work: "Model evaluation dashboards", year: "2024" },
]

const DEFAULT_AGENTS: SynapseAgent[] = [
  { name: "Scout", color: "#1F2FB0" },
  { name: "Weaver", color: "#5468FF" },
  { name: "Pilot", color: "#0B1240" },
  { name: "Relay", color: "#3346D8" },
]

const SLOT_LABEL: Record<SynapseSlot, string> = { star: "spark.svg", links: "links.svg", eye: "eye.svg", coral: "coral.webp" }

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

// #region choreography
/* Pure rules for the crew and the board, lifted out and run by tests/synapse-folio-template.test.mjs. */

/** Seconds a cursor needs to cross d pixels: quick hops, long trips that slow down (roughly Fitts). */
export function travel(d: number): number {
  return 0.24 + 0.14 * Math.log2(1 + Math.max(0, d) / 60)
}

/** Which agent takes the next job: whoever can be standing on it soonest; ties go to the earlier one. */
export function chooseHand(hands: { x: number; y: number; t: number }[], p: { x: number; y: number }, ready: number): number {
  let best = 0
  let bestT = Infinity
  for (let i = 0; i < hands.length; i++) {
    const h = hands[i]
    const arrive = Math.max(h.t + travel(Math.hypot(p.x - h.x, p.y - h.y)), ready)
    if (arrive < bestT - 1e-6) {
      best = i
      bestT = arrive
    }
  }
  return best
}

/** How long one word takes to "type": short words are quick, long ones a touch longer. */
export function wordTime(word: string): number {
  return 0.045 + 0.013 * Math.min(14, word.length)
}

/** The nearest point just outside a w×h stage, where a finished cursor leaves. */
export function exitPoint(p: { x: number; y: number }, w: number, h: number): { x: number; y: number } {
  const d = [p.x, w - p.x, p.y, h - p.y]
  const m = d.indexOf(Math.min(...d))
  if (m === 0) return { x: -70, y: p.y }
  if (m === 1) return { x: w + 70, y: p.y }
  if (m === 2) return { x: p.x, y: -70 }
  return { x: p.x, y: h + 70 }
}

/** Fewer cursors on narrow screens. */
export function crewSize(width: number, full: number): number {
  if (width < 720) return Math.min(full, 3)
  return full
}

/** Small deterministic wander so idle cursors never sit dead still. */
export function wander(seed: number): { x: number; y: number } {
  const s = Math.sin(seed * 12.9898) * 43758.5453
  const t = Math.sin(seed * 78.233) * 12345.6789
  return { x: (s - Math.floor(s) - 0.5) * 48, y: (t - Math.floor(t) - 0.5) * 34 }
}

/** The grid cell under a point, or null outside the grid. */
export function snapCell(x: number, y: number, size: number, cols: number, rows: number): { x: number; y: number } | null {
  if (size <= 0 || x < 0 || y < 0) return null
  const c = Math.floor(x / size)
  const r = Math.floor(y / size)
  if (c >= cols || r >= rows) return null
  return { x: c * size, y: r * size }
}

/** Meridian half-widths of a wireframe globe turned to phase a (radians). */
export function meridians(a: number, r: number, n: number): number[] {
  const out: number[] = []
  for (let k = 0; k < n; k++) out.push(Math.abs(Math.cos(a + (k * Math.PI) / n)) * r)
  return out
}
// #endregion

// ---- the director: ported from the overprint crew, trimmed to paste / write / marquee ----

type Pt = { x: number; y: number }
type Box = { x: number; y: number; w: number; h: number }
type Tool = "arrow" | "text" | "cross" | "grab"
type Hand = { el: HTMLElement; g: HTMLElement; key: HTMLElement; frm: HTMLElement; badge: HTMLElement; x: number; y: number; t: number; tool: Tool; i: number; idle: number }
type Job = { ready?: number; who?: number }

/** Layout box relative to the stage, read from offsets so transforms already set never skew it. */
function boxOf(el: HTMLElement, stage: HTMLElement): Box {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== stage) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

function director(tl: gsap.core.Timeline, stage: HTMLElement, handEls: HTMLElement[], frames: HTMLElement[], viewH: number) {
  const B = (el: HTMLElement) => boxOf(el, stage)
  const W = stage.offsetWidth
  const starts: Pt[] = [{ x: -60, y: viewH * 0.32 }, { x: W + 60, y: viewH * 0.72 }, { x: W * 0.3, y: viewH + 60 }, { x: W * 0.7, y: -60 }]
  const hands: Hand[] = handEls.map((el, i) => {
    const p = starts[i % starts.length]
    gsap.set(el, { x: p.x, y: p.y, opacity: 1 })
    return {
      el,
      g: el.querySelector(".sy-hg") as HTMLElement,
      key: el.querySelector(".sy-key") as HTMLElement,
      frm: frames[i],
      badge: frames[i].querySelector("b") as HTMLElement,
      x: p.x,
      y: p.y,
      t: 0,
      tool: "arrow" as Tool,
      i,
      idle: 0,
    }
  })

  const tool = (h: Hand, t: Tool, at: number) => {
    if (h.tool === t) return
    tl.set(h.el, { attr: { "data-tool": t } }, Math.max(0, at))
    h.tool = t
  }

  const click = (h: Hand, at: number) => {
    tl.to(h.g, { scale: 0.8, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.out" }, at)
  }

  /** A shortcut chip by the cursor: the crew pastes with the keyboard. */
  const key = (h: Hand, label: string, at: number) => {
    tl.call(() => { h.key.textContent = label }, [], at)
    tl.fromTo(h.key, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.14, ease: "power2.out", immediateRender: false }, at)
    tl.to(h.key, { opacity: 0, duration: 0.2 }, at + 0.55)
  }

  /** Walk on a gentle curve: x and y ease differently, so no two trips look ruled. */
  const walk = (h: Hand, p: Pt, at: number, dur?: number) => {
    const gap = at - h.t
    if (gap > 0.9) {
      const w = wander(h.i * 31 + ++h.idle)
      tl.to(h.el, { x: h.x + w.x, y: h.y + w.y, duration: Math.min(gap - 0.15, 1.1), ease: "sine.inOut" }, h.t + 0.05)
      h.x += w.x
      h.y += w.y
    }
    const d = dur ?? travel(Math.hypot(p.x - h.x, p.y - h.y))
    tl.to(h.el, { x: p.x, duration: d, ease: "power2.inOut" }, at)
    tl.to(h.el, { y: p.y, duration: d, ease: "power1.inOut" }, at)
    h.x = p.x
    h.y = p.y
    h.t = at + d
    return h.t
  }

  /** Carry the cursor in lock-step with whatever it is moving. */
  const glide = (h: Hand, p: Pt, at: number, d: number, ease: string) => {
    tl.to(h.el, { x: p.x, y: p.y, duration: d, ease }, at)
    h.x = p.x
    h.y = p.y
    h.t = at + d
  }

  /** Pick an agent and get them to p by `ready` (or as soon as they are free). */
  const begin = (p: Pt, o: Job = {}) => {
    const ready = o.ready ?? 0
    const h = hands[o.who !== undefined ? o.who % hands.length : chooseHand(hands, p, ready)]
    const tr = travel(Math.hypot(p.x - h.x, p.y - h.y))
    const leave = Math.max(h.t, ready - tr)
    const at = walk(h, p, leave, tr)
    return { h, at }
  }

  /** I-beam along a paragraph: each word lands as the caret passes it. */
  const write = (units: HTMLElement[], o: Job = {}) => {
    if (!units.length) return o.ready ?? 0
    gsap.set(units, { opacity: 0 })
    const b0 = B(units[0])
    const { h, at } = begin({ x: b0.x, y: b0.y + b0.h * 0.55 }, o)
    tool(h, "text", at - 0.12)
    click(h, at)
    let t = at + 0.08
    for (const u of units) {
      const b = B(u)
      const d = wordTime(u.textContent || "xxxx")
      tl.to(h.el, { x: b.x + b.w, y: b.y + b.h * 0.55, duration: d, ease: "none" }, t)
      tl.fromTo(u, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.16, ease: "power2.out", immediateRender: false }, t)
      h.x = b.x + b.w
      h.y = b.y + b.h * 0.55
      t += d
    }
    h.t = t + 0.05
    return h.t
  }

  /** Pick an object up, introduce it with its label, carry it home and paste it. */
  const paste = (el: HTMLElement, from: Pt, o: Job & { ghost?: HTMLElement | null } = {}) => {
    const b = B(el)
    const sel = (el.querySelector(".sy-sel") as HTMLElement) || el
    const off = { x: from.x * b.w, y: from.y * b.h }
    const hold = { x: b.x + b.w * 0.5, y: b.y + b.h * 0.42 }
    gsap.set(el, { x: off.x, y: off.y, opacity: 0, scale: 0.94 })
    const { h, at } = begin({ x: hold.x + off.x, y: hold.y + off.y }, o)
    tool(h, "grab", at - 0.1)
    tl.to(el, { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" }, at - 0.12)
    click(h, at)
    tl.set(sel, { attr: { "data-on": "1" } }, at)
    const d = Math.min(0.85, travel(Math.hypot(off.x, off.y)) * 1.05 + 0.08)
    const go = at + 0.32
    tl.to(el, { x: 0, y: 0, duration: d, ease: "power3.inOut" }, go)
    glide(h, hold, go, d, "power3.inOut")
    click(h, go + d)
    key(h, "⌘V", go + d)
    if (o.ghost) tl.to(o.ghost, { opacity: 0, duration: 0.15 }, go + d)
    tl.set(sel, { attr: { "data-on": "0" } }, go + d + 0.4)
    h.t = go + d + 0.14
    return h.t
  }

  /** Grow a selection frame and its W × H badge. The numbers come from the tween, never the DOM. */
  const sizeFrame = (h: Hand, w1: number, h1: number, at: number, d: number) => {
    const f = h.frm
    const st = { w: 0, h: 0 }
    const paint = () => {
      f.style.width = st.w + "px"
      f.style.height = st.h + "px"
      h.badge.textContent = Math.round(st.w) + " × " + Math.round(st.h)
    }
    tl.to(st, { w: w1, h: h1, duration: d, ease: "power2.inOut", onUpdate: paint, onStart: paint }, at)
  }

  /** Crosshair marquee: the frame grows with the drag and the block is revealed under it. */
  const marquee = (el: HTMLElement, o: Job = {}) => {
    const b = B(el)
    gsap.set(el, { clipPath: "inset(0% 100% 100% 0%)" })
    const { h, at } = begin({ x: b.x, y: b.y }, o)
    tool(h, "cross", at - 0.12)
    click(h, at)
    const d = 0.38 + 0.1 * Math.log2(1 + (b.w + b.h) / 120)
    tl.set(h.frm, { x: b.x, y: b.y, opacity: 1 }, at + 0.02)
    sizeFrame(h, b.w, b.h, at + 0.06, d)
    tl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: d, ease: "power2.inOut" }, at + 0.06)
    glide(h, { x: b.x + b.w, y: b.y + b.h }, at + 0.06, d, "power2.inOut")
    tl.to(h.frm, { opacity: 0, duration: 0.18 }, at + 0.06 + d + 0.1)
    h.t += 0.1
    return h.t
  }

  /** Pen: drag a rule out from its left end; it grows behind the nib. */
  const pen = (el: HTMLElement, o: Job = {}) => {
    const b = B(el)
    gsap.set(el, { scaleX: 0, transformOrigin: "0% 50%" })
    const { h, at } = begin({ x: b.x, y: b.y + b.h / 2 }, o)
    tool(h, "cross", at - 0.12)
    click(h, at)
    const d = 0.32 + 0.1 * Math.log2(1 + b.w / 40)
    tl.to(el, { scaleX: 1, duration: d, ease: "power1.inOut" }, at + 0.06)
    glide(h, { x: b.x + b.w, y: b.y + b.h / 2 }, at + 0.06, d, "power1.inOut")
    click(h, h.t)
    h.t += 0.08
    return h.t
  }

  /** Grow a disc out from its centre with the crosshair. */
  const disc = (el: HTMLElement, o: Job = {}) => {
    const b = B(el)
    const c = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
    gsap.set(el, { clipPath: "circle(0% at 50% 50%)" })
    const { h, at } = begin(c, o)
    tool(h, "cross", at - 0.12)
    click(h, at)
    tl.to(el, { clipPath: "circle(71% at 50% 50%)", duration: 0.75, ease: "power2.inOut" }, at + 0.06)
    glide(h, { x: c.x + b.w * 0.36, y: c.y + b.h * 0.36 }, at + 0.06, 0.75, "power2.inOut")
    h.t += 0.08
    return h.t
  }

  /** Everyone heads for the nearest edge once the page is built. */
  const leave = (after: number) => {
    let end = after
    for (const h of hands) {
      tool(h, "arrow", Math.max(h.t, after - 0.2))
      const p = exitPoint({ x: h.x, y: h.y }, W, viewH)
      const at = Math.max(h.t, after) + 0.05 + h.i * 0.08
      const d = travel(Math.hypot(p.x - h.x, p.y - h.y))
      tl.to(h.el, { x: p.x, y: p.y, duration: d, ease: "power2.in" }, at)
      end = Math.max(end, at + d)
    }
    return end
  }

  return { B, hands, write, paste, marquee, pen, disc, leave }
}

/** Lay the whole build out on one paused timeline. Elements below the first screen are left alone. */
function buildIntro(hero: HTMLElement, viewH: number) {
  const tl = gsap.timeline({ paused: true })
  const all = Array.from(hero.querySelectorAll(".sy-hand")) as HTMLElement[]
  const frames = Array.from(hero.querySelectorAll(".sy-frm")) as HTMLElement[]
  const n = crewSize(hero.offsetWidth, all.length)
  const D = director(tl, hero, all.slice(0, n), frames, viewH)
  const q = (s: string) => hero.querySelector(s) as HTMLElement | null
  const seen = (el: HTMLElement | null): el is HTMLElement => !!el && D.B(el).y + 24 < viewH
  const units = (s: string) => (Array.from(hero.querySelectorAll(s + " .sy-w, " + s + " .sy-ghost")) as HTMLElement[]).filter(seen)
  const ico = (k: SynapseSlot) => q('.sy-slot[data-slot="' + k + '"] .sy-obj')
  const ghost = (k: SynapseSlot) => q('.sy-slot[data-slot="' + k + '"] .sy-ghost')

  // The slots' dashed ghosts only exist during the build: they are typed in with the words.
  gsap.set(Array.from(hero.querySelectorAll(".sy-ghost")), { opacity: 1 })

  const run = (el: HTMLElement | null, f: (el: HTMLElement) => number) => (seen(el) ? f(el) : 0)
  // The writer types both paragraphs first, so the rest of the crew is scheduled around them.
  const end1 = D.write(units(".sy-p1"), { who: 0, ready: 0.2 })
  const end2 = D.write(units(".sy-p2"), { who: 0, ready: end1 + 0.12 })
  run(q(".sy-gridpanel"), (el) => D.marquee(el, { ready: 0.25 }))
  run(q(".sy-note"), (el) => D.paste(el, { x: 0.15, y: -1.25 }, { ready: 0.45 }))
  const handDone = run(q(".sy-handobj"), (el) => D.paste(el, { x: -0.55, y: 0.35 }, { ready: 0.7 }))
  run(q(".sy-photo"), (el) => D.paste(el, { x: 0.25, y: 0.75 }, { ready: 1.0 }))
  run(q(".sy-wire"), (el) => D.pen(el, { ready: handDone + 0.05 }))
  run(q(".sy-globe"), (el) => D.disc(el, { ready: 1.5 }))
  for (const k of ["star", "links"] as SynapseSlot[]) run(ico(k), (el) => D.paste(el, { x: k === "star" ? -0.6 : 0.9, y: -1.35 }, { ready: end1 - (k === "star" ? 0.3 : 0), ghost: ghost(k) }))
  const armDone = run(q(".sy-armobj"), (el) => D.paste(el, { x: 0.55, y: -0.9 }, { ready: 2.4 }))
  // The arrow between the pair is drawn once the arm is in place, never before.
  const arrow = q(".sy-arrow")
  if (armDone && arrow) {
    gsap.set(arrow, { opacity: 0, x: -8 })
    tl.to(arrow, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }, armDone)
  }
  run(q(".sy-bustobj"), (el) => D.paste(el, { x: 0.7, y: 0.5 }, { ready: 2.8 }))
  for (const k of ["eye", "coral"] as SynapseSlot[]) run(ico(k), (el) => D.paste(el, { x: k === "eye" ? 0.6 : -1.2, y: 1.7 }, { ready: end2 - (k === "eye" ? 0.5 : 0.1), ghost: ghost(k) }))
  run(q(".sy-chipsobj"), (el) => D.paste(el, { x: -0.4, y: 1.1 }, { ready: end2 }))
  const essDone = run(q(".sy-ess"), (el) => D.marquee(el, { ready: end2 - 0.2 }))
  // Anything below the first screen just stays where the page put it.
  for (const s of [".sy-p1", ".sy-p2"]) {
    for (const el of Array.from(hero.querySelectorAll(s + " .sy-ghost")) as HTMLElement[]) if (!seen(el)) gsap.set(el, { opacity: 0 })
  }
  const after = Math.max(tl.duration(), end2, essDone) + 0.15
  D.leave(after)
  return tl
}

// ---- markup --------------------------------------------------------------------------

type CSSVars = React.CSSProperties & Record<string, string | number>

function Mask({ src, ratio, className }: { src: string; ratio: string; className?: string }) {
  const url = "url(" + src + ")"
  return <span className={"sy-mask" + (className ? " " + className : "")} style={{ WebkitMaskImage: url, maskImage: url, aspectRatio: ratio }} aria-hidden="true" />
}

function Icon({ k, base }: { k: SynapseSlot; base: string }) {
  if (k === "star")
    return (
      <svg viewBox="0 0 52 44" aria-hidden="true">
        <path d="M22 4c1.6 10.4 4.6 13.4 15 15-10.4 1.6-13.4 4.6-15 15-1.6-10.4-4.6-13.4-15-15 10.4-1.6 13.4-4.6 15-15z" fill="currentColor" />
        <path d="M40 22c.9 5.6 2.4 7.1 8 8-5.6.9-7.1 2.4-8 8-.9-5.6-2.4-7.1-8-8 5.6-.9 7.1-2.4 8-8z" fill="currentColor" />
      </svg>
    )
  if (k === "links")
    return (
      <svg viewBox="0 0 64 40" aria-hidden="true">
        {[["4", "-16", "21"], ["26", "14", "43"]].map(([x, r, c]) => (
          <g key={x} transform={"rotate(" + r + " " + c + " 20)"}>
            <rect x={x} y="9" width="34" height="22" rx="11" fill="none" stroke="currentColor" strokeWidth="5" />
            <rect x={x} y="9" width="34" height="22" rx="11" fill="none" stroke="var(--bg)" strokeWidth="1.6" />
          </g>
        ))}
      </svg>
    )
  if (k === "eye")
    return (
      <svg viewBox="0 0 84 40" aria-hidden="true">
        <path d="M3 20C16 5 68 5 81 20 68 35 16 35 3 20z" fill="none" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="42" cy="20" rx="26" ry="11" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <g className="sy-pupil">
          <ellipse cx="42" cy="20" rx="14" ry="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="42" cy="20" r="5.5" fill="currentColor" />
        </g>
      </svg>
    )
  return <Mask src={base + "coral.webp"} ratio="522 / 418" />
}

/** A paragraph split into word units the crew can type, with object slots between them. */
function Words({ tokens, base }: { tokens: SynapseToken[]; base: string }) {
  const out: React.ReactNode[] = []
  tokens.forEach((t, i) => {
    if (typeof t === "string") {
      t.split(/\s+/).filter(Boolean).forEach((w, j) => {
        out.push(<span key={i + "-" + j} className="sy-w">{w}</span>, " ")
      })
    } else if ("box" in t) {
      out.push(<span key={i} className="sy-w sy-box">{t.box}</span>, " ")
    } else {
      out.push(
        <span key={i} className="sy-slot" data-slot={t.slot}>
          <i className="sy-ghost" aria-hidden="true" />
          <span className="sy-obj" data-label={SLOT_LABEL[t.slot]}>
            <span className="sy-sel">
              <span className="sy-ico"><Icon k={t.slot} base={base} /></span>
              <b className="sy-tag" aria-hidden="true">{SLOT_LABEL[t.slot]}</b>
            </span>
          </span>
        </span>,
        " ",
      )
    }
  })
  return <>{out}</>
}

const GLYPHS = (
  <>
    <svg className="sy-gl sy-gl-arrow" width="22" height="22" viewBox="0 0 22 22"><path d="M1.6 1.6v15.6l4.3-4.1 3.1 6.6 2.9-1.3-3-6.5h6.1z" fill="var(--c)" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /></svg>
    <svg className="sy-gl sy-gl-text" width="14" height="24" viewBox="0 0 14 24"><path d="M2.5 2h3.5M8 2h3.5M7 2.5v19M2.5 22h3.5M8 22h3.5" fill="none" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" /><path d="M2.5 2h3.5M8 2h3.5M7 2.5v19M2.5 22h3.5M8 22h3.5" fill="none" stroke="var(--c)" strokeWidth="1.8" strokeLinecap="round" /></svg>
    <svg className="sy-gl sy-gl-cross" width="24" height="24" viewBox="0 0 24 24"><path d="M12 1v22M1 12h22" stroke="#fff" strokeWidth="4" /><path d="M12 1v22M1 12h22" stroke="var(--c)" strokeWidth="1.6" /></svg>
    <svg className="sy-gl sy-gl-grab" width="24" height="24" viewBox="0 0 24 24"><path d="M12 1.5l3.2 3.6h-2.1v5.8h5.8V8.8l3.6 3.2-3.6 3.2v-2.1h-5.8v5.8h2.1L12 22.5l-3.2-3.6h2.1v-5.8H5.1v2.1L1.5 12l3.6-3.2v2.1h5.8V5.1H8.8z" fill="var(--c)" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" /></svg>
  </>
)

function Hands({ agents }: { agents: SynapseAgent[] }) {
  return (
    <div className="sy-hands" aria-hidden="true">
      {agents.map((a, i) => (
        <div key={"f" + i} className="sy-frm" style={{ "--c": a.color } as CSSVars}><b /></div>
      ))}
      {agents.map((a, i) => (
        <div key={"h" + i} className="sy-hand" data-tool="arrow" style={{ "--c": a.color } as CSSVars}>
          <div className="sy-hg">{GLYPHS}</div>
          <span className="sy-name">{a.name}</span>
          <span className="sy-key" />
        </div>
      ))}
    </div>
  )
}

/** A board object: the intro moves .sy-obj, the visitor drags .sy-sel, the pointer sways .sy-par. */
function Obj({ className, label, depth = 0, drag = true, children }: { className: string; label: string; depth?: number; drag?: boolean; children: React.ReactNode }) {
  return (
    <div className={"sy-obj " + className}>
      <div className="sy-sel" data-drag={drag ? "" : undefined} title={drag ? "Drag me (double-click to put back)" : undefined}>
        <div className="sy-par" style={{ "--d": depth } as CSSVars}>{children}</div>
        <b className="sy-tag" aria-hidden="true">{label}</b>
      </div>
    </div>
  )
}

function Globe() {
  return (
    <svg viewBox="0 0 100 100" className="sy-globe-svg" aria-hidden="true">
      <circle cx="50" cy="50" r="46" />
      {[-30, -15, 0, 15, 30].map((y) => (
        <ellipse key={y} cx="50" cy={50 + y} rx={Math.sqrt(46 * 46 - y * y)} ry={Math.max(1.5, 7 - Math.abs(y) / 6)} />
      ))}
      {[0, 1, 2, 3].map((k) => (
        <ellipse key={"m" + k} className="sy-mer" cx="50" cy="50" rx={meridians(0.35, 46, 4)[k]} ry="46" />
      ))}
    </svg>
  )
}

function clock(timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone }).format(new Date())
  } catch {
    return ""
  }
}

// ---- the page --------------------------------------------------------------------------

export default function SynapseFolioTemplate({
  height = "100svh",
  brand = "KEDHAR",
  lead = DEFAULT_LEAD,
  body = DEFAULT_BODY,
  note = "Building interfaces between people and models",
  noteTag = "agentic",
  essentially = "My job is to help teams ship AI they can trust: agents that explain themselves, search that finds the right page, and interfaces that keep people in charge.",
  projects = DEFAULT_PROJECTS,
  clients = DEFAULT_CLIENTS,
  closing = "Have a model that needs a kinder interface?",
  email = "kedhareswer.12110626@gmail.com",
  city = "HYD",
  timeZone = "Asia/Kolkata",
  agents = DEFAULT_AGENTS,
  playIntro = true,
  assetBase = BASE,
  className,
  style,
}: SynapseFolioTemplateProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const heroRef = React.useRef(null as HTMLElement | null)
  const tlRef = React.useRef(null as gsap.core.Timeline | null)
  const [run, setRun] = React.useState(playIntro ? 1 : 0)
  const [phase, setPhase] = React.useState("done")
  const [dots, setDots] = React.useState(false)
  const [time, setTime] = React.useState("")

  // The build. Time-based, played once per run; ctx.revert() on finish hands the page back as rendered.
  useIso(() => {
    const hero = heroRef.current
    if (!hero || !run) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let dead = false
    let ctx: gsap.Context | null = null
    hero.classList.add("sy-pending")
    for (const el of Array.from(hero.querySelectorAll("[data-drag]")) as HTMLElement[]) {
      el.style.translate = ""
      delete el.dataset.off
    }
    const finish = () => {
      if (dead) return
      ctx?.revert()
      tlRef.current = null
      hero.removeAttribute("data-phase")
      setPhase("done")
    }
    const start = () => {
      if (dead) return
      ctx = gsap.context(() => {
        const tl = buildIntro(hero, Math.min(hero.offsetHeight, window.innerHeight))
        tl.eventCallback("onComplete", finish)
        tlRef.current = tl
      }, hero)
      hero.classList.remove("sy-pending")
      hero.setAttribute("data-phase", "intro")
      setPhase("intro")
      tlRef.current?.play()
    }
    const fonts = document.fonts
    const ready = fonts ? Promise.all([fonts.load("300 40px SySerif"), fonts.load("400 12px SyMono")]).catch(() => null) : Promise.resolve(null)
    const timer = window.setTimeout(start, 1200)
    ready.then(() => {
      window.clearTimeout(timer)
      start()
    })
    // A resize mid-build would leave measured positions stale: just finish.
    const onResize = () => tlRef.current?.progress(1)
    window.addEventListener("resize", onResize)
    return () => {
      dead = true
      window.clearTimeout(timer)
      window.removeEventListener("resize", onResize)
      tlRef.current?.kill()
      tlRef.current = null
      ctx?.revert()
      hero.classList.remove("sy-pending")
      hero.removeAttribute("data-phase")
    }
  }, [run])

  // Pointer: parallax, the lit grid cell, the eye's pupil, dragging; plus the globe's slow turn.
  React.useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const fine = window.matchMedia("(pointer: fine)").matches
    const grid = hero.querySelector(".sy-grid") as HTMLElement | null
    const cell = hero.querySelector(".sy-cell") as HTMLElement | null
    const pupils = Array.from(hero.querySelectorAll(".sy-pupil")) as SVGGElement[]
    const mers = Array.from(hero.querySelectorAll(".sy-mer")) as SVGEllipseElement[]
    let raf = 0
    let px = -1e4
    let py = -1e4
    let mx = 0
    const paint = () => {
      raf = 0
      const r = hero.getBoundingClientRect()
      mx = Math.max(-1, Math.min(1, ((px - r.left) / r.width) * 2 - 1))
      const my = Math.max(-1, Math.min(1, ((py - r.top) / Math.min(r.height, window.innerHeight)) * 2 - 1))
      if (!reduce) {
        hero.style.setProperty("--mx", mx.toFixed(3))
        hero.style.setProperty("--my", my.toFixed(3))
      }
      if (grid && cell) {
        const g = grid.getBoundingClientRect()
        const size = g.width / 12
        const c = snapCell(px - g.left, py - g.top, size, 12, Math.round(g.height / size))
        if (c) {
          cell.style.width = cell.style.height = size + "px"
          cell.style.transform = "translate(" + c.x + "px," + c.y + "px)"
          cell.style.opacity = "1"
        } else cell.style.opacity = "0"
      }
      for (const p of pupils) {
        const svg = p.ownerSVGElement
        if (!svg) continue
        const b = svg.getBoundingClientRect()
        const dx = px - (b.left + b.width / 2)
        const dy = py - (b.top + b.height / 2)
        const d = Math.hypot(dx, dy) || 1
        const k = reduce ? 0 : Math.min(1, d / 240)
        p.setAttribute("transform", "translate(" + ((dx / d) * 9 * k).toFixed(2) + " " + ((dy / d) * 4 * k).toFixed(2) + ")")
      }
    }
    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const onLeave = () => {
      if (cell) cell.style.opacity = "0"
    }

    // Drag the placed objects around the board; double-click puts one back.
    let drag: { el: HTMLElement; sx: number; sy: number; ox: number; oy: number } | null = null
    const onDown = (e: PointerEvent) => {
      if (!fine || e.button !== 0 || hero.getAttribute("data-phase") === "intro") return
      const el = (e.target as Element).closest("[data-drag]") as HTMLElement | null
      if (!el) return
      e.preventDefault()
      const [ox, oy] = (el.dataset.off || "0,0").split(",").map(Number)
      drag = { el, sx: e.clientX, sy: e.clientY, ox, oy }
      el.setPointerCapture(e.pointerId)
      el.setAttribute("data-dragging", "")
    }
    const onDrag = (e: PointerEvent) => {
      if (!drag) return
      const x = Math.round(drag.ox + e.clientX - drag.sx)
      const y = Math.round(drag.oy + e.clientY - drag.sy)
      drag.el.style.translate = x + "px " + y + "px"
      drag.el.dataset.off = x + "," + y
    }
    const onUp = () => {
      if (!drag) return
      drag.el.removeAttribute("data-dragging")
      drag = null
    }
    const onDbl = (e: MouseEvent) => {
      const el = (e.target as Element).closest("[data-drag]") as HTMLElement | null
      if (!el) return
      el.style.translate = ""
      delete el.dataset.off
    }

    // The globe turns slowly, faster towards whichever side the pointer is on, only while on screen.
    let spin = 0
    let a = 0.35
    let last = 0
    let onScreen = true
    const io = new IntersectionObserver((es) => {
      onScreen = es[0].isIntersecting
      if (onScreen && !spin && !reduce) spin = requestAnimationFrame(turn)
    })
    const turn = (t: number) => {
      spin = 0
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0
      last = t
      a += dt * (0.45 + mx * 0.9)
      const rx = meridians(a, 46, mers.length)
      mers.forEach((m, i) => m.setAttribute("rx", rx[i].toFixed(2)))
      if (onScreen) spin = requestAnimationFrame(turn)
      else last = 0
    }
    io.observe(hero)

    hero.addEventListener("pointermove", onMove)
    hero.addEventListener("pointerleave", onLeave)
    hero.addEventListener("pointerdown", onDown)
    hero.addEventListener("pointermove", onDrag)
    hero.addEventListener("pointerup", onUp)
    hero.addEventListener("pointercancel", onUp)
    hero.addEventListener("dblclick", onDbl)
    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(spin)
      io.disconnect()
      hero.removeEventListener("pointermove", onMove)
      hero.removeEventListener("pointerleave", onLeave)
      hero.removeEventListener("pointerdown", onDown)
      hero.removeEventListener("pointermove", onDrag)
      hero.removeEventListener("pointerup", onUp)
      hero.removeEventListener("pointercancel", onUp)
      hero.removeEventListener("dblclick", onDbl)
    }
  }, [])

  // Sections reveal as they scroll in; the hero clock ticks.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.classList.add("sy-js")
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (!e.isIntersecting) continue
          e.target.setAttribute("data-in", "")
          io.unobserve(e.target)
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    )
    for (const el of Array.from(root.querySelectorAll("[data-rv]"))) io.observe(el)
    const tick = () => setTime(clock(timeZone))
    tick()
    const id = window.setInterval(tick, 20000)
    return () => {
      io.disconnect()
      window.clearInterval(id)
    }
  }, [timeZone])

  const replay = () => {
    if (phase === "intro" && tlRef.current) {
      tlRef.current.progress(1)
      return
    }
    setRun((r) => r + 1)
  }

  const img = (f: string) => assetBase + f

  return (
    <div ref={rootRef} className={"sy-root" + (className ? " " + className : "")} style={style}>
      <style>{CSS}</style>
      <section ref={heroRef} className="sy-hero" style={{ minHeight: height }} aria-label="Introduction">
        <i className="sy-guide" aria-hidden="true" />
        <header className="sy-nav">
          <a className="sy-brand" href="#top" onClick={(e) => e.preventDefault()}>{brand}</a>
          <button type="button" className="sy-replay" onClick={replay} aria-label={phase === "intro" ? "Skip the intro" : "Replay the intro"}>
            <span>{phase === "intro" ? "Skip" : "Replay"}</span><span className="sy-rp-w"> intro</span>
          </button>
          <p className="sy-time">
            <span>Local time</span>
            <span>{city} {time || "--:-- --"}</span>
          </p>
        </header>

        <div className="sy-main sy-cols">
          <div className="sy-copy">
            <div className="sy-stmt">
            <h1 className="sy-h sy-p1"><Words tokens={lead} base={assetBase} /></h1>
            <div className="sy-p2row">
              <p className="sy-h sy-p2"><Words tokens={body} base={assetBase} /></p>
              <div className="sy-pair" aria-hidden="true">
                <Obj className="sy-armobj" label="prosthesis.webp" depth={6}>
                  <span className="sy-armbox"><Mask src={img("arm.webp")} ratio="645 / 214" className="sy-arm" /></span>
                </Obj>
                <svg className="sy-arrow" viewBox="0 0 24 12" aria-hidden="true"><path d="M1 6h20M16 1.5 21 6l-5 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
                <Obj className="sy-bustobj" label="bust.webp" depth={10}>
                  <Mask src={img("bust.webp")} ratio="434 / 451" className="sy-bust" />
                </Obj>
              </div>
            </div>
            </div>
            <div className="sy-foot">
              <Obj className="sy-chipsobj" label="pattern.toggle" drag={false}>
                <button type="button" className="sy-toggle" aria-pressed={dots} onClick={() => setDots((d) => !d)} aria-label="Swap the board between grid and dot paper">
                  <span className="sy-tg-a"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M5 7.5h14M5 16.5h14" /></svg></span>
                  <span className="sy-tg-b" aria-hidden="true" />
                </button>
              </Obj>
              <div className="sy-obj sy-ess">
                <p className="sy-ess-h">
                  Essentially
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a2.6 2.6 0 0 1 0 5.2 2.6 2.6 0 0 1 0-5.2zM8 9.3a2.6 2.6 0 0 1 0 5.2 2.6 2.6 0 0 1 0-5.2zM1.5 8a2.6 2.6 0 0 1 5.2 0 2.6 2.6 0 0 1-5.2 0zM9.3 8a2.6 2.6 0 0 1 5.2 0 2.6 2.6 0 0 1-5.2 0z" fill="currentColor" /></svg>
                </p>
                <p className="sy-ess-p">{essentially}</p>
                <i className="sy-ess-x" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="sy-boardwrap">
            <div className="sy-board" data-paper={dots ? "dots" : "grid"} aria-hidden="true">
              <div className="sy-obj sy-gridpanel"><div className="sy-grid"><i className="sy-cell" /></div></div>
              <Obj className="sy-note" label="note.md" depth={4}>
                <div className="sy-notecard">
                  <span className="sy-bars"><i /><i /><i /><i /><b /></span>
                  <span className="sy-note-t">{note}</span>
                  <span className="sy-note-t">&mdash; a living <em>{noteTag}</em> practice.</span>
                </div>
              </Obj>
              <Obj className="sy-handobj" label="hand.webp" depth={12}>
                <Mask src={img("hand.webp")} ratio="562 / 231" className="sy-handimg" />
                <svg className="sy-gizmo" viewBox="0 0 562 231" aria-hidden="true">
                  <path d="M58 14C10 58 8 150 52 214" />
                  <path d="M47 8l13 4-6 12M44 220l10-6-2-13" />
                  <path d="M140 118h26M153 105v26M326 34h22M337 23v22" />
                </svg>
              </Obj>
              <div className="sy-obj sy-wire"><i /></div>
              <Obj className="sy-photo" label="lab.webp" depth={7}>
                <div className="sy-win">
                  <span className="sy-winbar"><i /></span>
                  <img src={img("lab.webp")} alt="" width={740} height={484} loading="eager" draggable={false} />
                </div>
              </Obj>
              <div className="sy-obj sy-globe"><div className="sy-par" style={{ "--d": 5 } as CSSVars}><Globe /></div></div>
            </div>
          </div>
        </div>
        <Hands agents={agents} />
      </section>

      <section className="sy-sec sy-cols" aria-labelledby="sy-work-h">
        <header className="sy-label" data-rv="">
          <span>&sect;01</span>
          <h2 id="sy-work-h">Selected work</h2>
          <p>Three slots for the projects you want people to open first.</p>
        </header>
        <div className="sy-cards">
          {projects.map((p, i) => (
            <a key={p.title} className="sy-card" href={"mailto:" + email + "?subject=" + encodeURIComponent(p.title)} data-rv="" style={{ "--i": i } as CSSVars}>
              <span className="sy-cimg">
                <img src={img(p.image)} alt={p.title} width={740} height={484} loading="lazy" draggable={false} />
                <b className="sy-tag" aria-hidden="true">{"project-0" + (i + 1) + ".webp"}</b>
              </span>
              <span className="sy-cmeta"><span>{"0" + (i + 1)}</span><span>{p.year}</span></span>
              <span className="sy-ctitle">{p.title}</span>
              <span className="sy-ckind">{p.kind}</span>
              <span className="sy-cblurb">{p.blurb}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="sy-sec sy-cols" aria-labelledby="sy-cl-h">
        <header className="sy-label" data-rv="">
          <span>&sect;02</span>
          <h2 id="sy-cl-h">Clients</h2>
          <p>Teams I have built with.</p>
        </header>
        <ul className="sy-rows">
          {clients.map((c, i) => (
            <li key={c.name} className="sy-row" data-rv="" style={{ "--i": i } as CSSVars}>
              <span className="sy-rname">{c.name}</span>
              <span className="sy-rwork">{c.work}</span>
              <span className="sy-ryear">{c.year}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sy-sec sy-cols sy-contact" aria-labelledby="sy-ct-h">
        <header className="sy-label" data-rv="">
          <span>&sect;03</span>
          <h2>Contact</h2>
          <p>Usually replies within a day.</p>
        </header>
        <div className="sy-ct">
          <p id="sy-ct-h" className="sy-closing" data-rv="">{closing}</p>
          <a className="sy-mail" href={"mailto:" + email} data-rv="">{email}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg></a>
        </div>
      </section>

      <footer className="sy-footer">
        <span>&copy; {new Date().getFullYear()} Kedhareswer Naidu</span>
        <span>{brand} &middot; {city}</span>
        <button type="button" onClick={() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Back to top &uarr;</button>
      </footer>
    </div>
  )
}

const FONTS =
  "@font-face{font-family:SyMono;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}" +
  "@font-face{font-family:SyMono;font-style:normal;font-weight:500;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}" +
  "@font-face{font-family:SySerif;font-style:normal;font-weight:300;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}"

const SERIF = "SySerif,'Source Serif 4',Georgia,serif"
const MONO = "SyMono,'JetBrains Mono',ui-monospace,monospace"
const EASE = "cubic-bezier(.2,.7,.2,1)"

const CSS =
  FONTS +
  ".sy-root{--bg:#FBFBFE;--ink:#1F2FB0;--deep:#0B1240;--soft:#E9ECFB;--line:rgba(31,47,176,.14);--line2:rgba(31,47,176,.42);--paper:#fff;--g:clamp(16px,2.2vw,32px);--gap:clamp(20px,4vw,72px);--fs:clamp(30px,min(4.15vw,6.6vh),78px);--mx:0;--my:0;" +
  "position:relative;width:100%;background:var(--bg);color:var(--ink);font-family:" + MONO + ";-webkit-font-smoothing:antialiased;overflow-x:clip}" +
  ":where(.dark) .sy-root{--bg:#080C26;--ink:#A9B6FF;--deep:#E6EAFF;--soft:#121948;--line:rgba(169,182,255,.13);--line2:rgba(169,182,255,.4);--paper:#0C1236}" +
  ".sy-root *,.sy-root *::before,.sy-root *::after{box-sizing:border-box}" +
  ".sy-root :where(a,button){color:inherit;font:inherit;text-decoration:none;background:none;border:0;padding:0;margin:0;cursor:pointer}" +
  ".sy-root :where(h1,h2,p,ul,li){margin:0;padding:0;list-style:none;font:inherit}" +
  ".sy-root img{max-width:none;display:block}" +
  ".sy-root :where(a,button):focus-visible{outline:2px solid var(--ink);outline-offset:3px}" +
  // hero frame
  ".sy-hero{position:relative;display:flex;flex-direction:column;overflow:clip}" +
  ".sy-cols{display:grid;grid-template-columns:minmax(0,30fr) minmax(0,70fr);column-gap:var(--gap)}" +
  ".sy-guide{position:absolute;top:0;bottom:0;left:calc(var(--g) + (100% - 2 * var(--g) - var(--gap)) * .3 + var(--gap) / 2);width:1px;background:var(--line);pointer-events:none}" +
  ".sy-nav{position:relative;z-index:5;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:var(--g) var(--g) 0;font-size:11px;letter-spacing:.06em;text-transform:uppercase}" +
  ".sy-brand{font-weight:500;font-size:13px;letter-spacing:.08em;justify-self:start}" +
  ".sy-replay{justify-self:center;border:1px solid var(--ink);padding:3px 9px;border-radius:2px;background:var(--paper);transition:background .25s,color .25s}" +
  ".sy-time{justify-self:end;display:flex;flex-direction:column;align-items:flex-end;line-height:1.35}" +
  ".sy-time span:first-child{opacity:.6}" +
  ".sy-main{flex:1;padding:clamp(14px,3vh,36px) var(--g) 0;align-items:stretch}" +
  ".sy-boardwrap{grid-column:1;grid-row:1;container-type:inline-size;position:relative}" +
  ".sy-copy{grid-column:2;grid-row:1;display:flex;flex-direction:column;gap:clamp(20px,3vh,36px);padding-top:clamp(28px,9vh,120px);min-width:0}" +
  ".sy-stmt{display:flex;flex-direction:column;gap:clamp(14px,2.6vh,30px);margin-bottom:auto}" +
  // statement
  ".sy-h{position:relative;font-family:" + SERIF + ";font-weight:300;font-size:var(--fs);line-height:1.02;letter-spacing:-.028em;color:var(--ink)}" +
  ".sy-w{display:inline}" +
  ".sy-box{border:1.5px solid var(--line2);border-radius:.12em;padding:0 .1em;-webkit-box-decoration-break:clone;box-decoration-break:clone}" +
  ".sy-slot{position:relative;display:inline-block;vertical-align:-.1em;height:.9em;margin:0 .04em}" +
  ".sy-slot[data-slot=star]{width:1.08em}.sy-slot[data-slot=links]{width:1.3em}.sy-slot[data-slot=eye]{width:1.72em}.sy-slot[data-slot=coral]{width:1.16em}" +
  ".sy-ghost{position:absolute;inset:0;border:1.5px dashed var(--line2);border-radius:.1em;opacity:0}" +
  ".sy-slot .sy-obj,.sy-slot .sy-sel,.sy-ico{position:absolute;inset:0;display:block}" +
  ".sy-ico{color:var(--ink)}.sy-ico svg{width:100%;height:100%;display:block;overflow:visible}" +
  ".sy-ico .sy-mask{position:absolute;inset:-.06em 0;width:auto;height:auto}" +
  ".sy-pupil{transition:transform .25s " + EASE + "}" +
  ".sy-p2row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.42fr);column-gap:clamp(16px,2vw,40px);align-items:center}" +
  ".sy-pair{position:relative;display:grid;grid-template-columns:minmax(0,1.5fr) 18px minmax(0,1fr);align-items:center;gap:8px;color:var(--ink)}" +
  ".sy-arrow{width:18px;height:9px}" +
  ".sy-armbox{position:relative;display:block;aspect-ratio:1.9;background:var(--ink);border-radius:2px}" +
  ".sy-armbox .sy-arm{position:absolute;left:-26%;top:20%;width:118%;background:var(--bg)}" +
  ".sy-bust{width:100%}" +
  // objects
  ".sy-obj{position:relative}" +
  ".sy-sel{position:relative;display:block;outline:1px solid transparent;outline-offset:5px;transition:outline-color .2s}" +
  ".sy-sel[data-on='1']{outline-color:var(--ink)}" +
  ".sy-sel[data-dragging]{cursor:grabbing;z-index:3}" +
  ".sy-par{transform:translate3d(calc(var(--mx) * var(--d,0) * 1px),calc(var(--my) * var(--d,0) * 1px),0);transition:transform .6s " + EASE + "}" +
  ".sy-tag{position:absolute;left:-6px;bottom:calc(100% + 9px);z-index:4;font:500 10px/1 " + MONO + ";letter-spacing:.04em;text-transform:none;background:var(--ink);color:var(--bg);padding:4px 6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s}" +
  ".sy-sel[data-on='1']>.sy-tag{opacity:1}" +
  ".sy-mask{display:block;width:100%;background:var(--ink);-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center}" +
  // board (sizes in container units so the arrangement scales as one)
  ".sy-board{position:relative;height:153cqw}" +
  ".sy-board .sy-obj{position:absolute}" +
  ".sy-gridpanel{left:0;top:9cqw;width:100cqw;height:91.67cqw}" +
  ".sy-grid{position:absolute;inset:0;border:1px solid var(--line2);background-image:linear-gradient(var(--line2) 1px,transparent 1px),linear-gradient(90deg,var(--line2) 1px,transparent 1px);background-size:8.333cqw 8.333cqw;background-position:-1px -1px;transition:background-size .5s " + EASE + "}" +
  ".sy-board[data-paper=dots] .sy-grid{background-image:radial-gradient(circle,var(--line2) 1.2px,transparent 1.6px);background-size:4.1667cqw 4.1667cqw;background-position:0 0}" +
  ".sy-cell{position:absolute;left:0;top:0;background:var(--soft);opacity:0;transition:opacity .2s,transform .12s linear;pointer-events:none}" +
  ".sy-note{left:20cqw;top:0;width:56cqw;z-index:5}" +
  ".sy-notecard{display:flex;flex-direction:column;gap:2.4cqw;padding:2.6cqw 3cqw 3.2cqw;background:var(--paper);border:1px solid var(--line2);border-radius:2px;font-size:clamp(9px,2.75cqw,12px);line-height:1.35;letter-spacing:.03em;text-transform:uppercase}" +
  ".sy-notecard em{font-style:normal;border:1px solid var(--ink);border-radius:2px;padding:0 3px}" +
  ".sy-bars{display:flex;gap:1.6cqw;align-items:center}" +
  ".sy-bars i{flex:1;height:3.2cqw;border:1px solid var(--ink);background:linear-gradient(90deg,var(--ink) 55%,transparent 0)}" +
  ".sy-bars i:nth-child(2){background:linear-gradient(90deg,var(--ink) 30%,transparent 0)}.sy-bars i:nth-child(3){background:linear-gradient(90deg,var(--ink) 80%,transparent 0)}.sy-bars i:nth-child(4){background:linear-gradient(90deg,var(--ink) 45%,transparent 0)}" +
  ".sy-bars b{width:3.6cqw;height:3.6cqw;border-radius:50%;background:var(--ink);margin-left:1.6cqw}" +
  ".sy-handobj{left:0;top:40cqw;width:87cqw;z-index:3}" +
  ".sy-handimg{width:100%}" +
  ".sy-gizmo{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:var(--ink);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;overflow:visible}" +
  ".sy-wire{left:87cqw;top:45.6cqw;width:calc(12cqw + var(--gap) / 2);height:1px;z-index:2;background:var(--ink)}" +
  ".sy-wire i{position:absolute;right:-.5cqw;top:-1.6cqw;width:3.2cqw;height:3.2cqw;border:1px solid var(--ink);background:var(--paper)}" +
  ".sy-wire i::after{content:'';position:absolute;inset:25%;background:var(--ink)}" +
  ".sy-photo{left:44cqw;top:70cqw;width:56cqw;z-index:4}" +
  ".sy-win{border:1px solid var(--ink);background:var(--paper);padding:1.2cqw;box-shadow:2cqw 2cqw 0 var(--soft)}" +
  ".sy-winbar{position:relative;display:block;height:3cqw;border-bottom:1px solid var(--line2);margin-bottom:1.2cqw}" +
  ".sy-winbar i{position:absolute;right:0;top:.3cqw;width:2.2cqw;height:2.2cqw;border:1px solid var(--ink)}" +
  ".sy-win img{width:100%;height:auto;aspect-ratio:740/484;object-fit:cover}" +
  ".sy-globe{left:8cqw;top:118cqw;width:34cqw;aspect-ratio:1}" +
  ".sy-globe-svg{width:100%;height:100%;display:block;fill:none;stroke:var(--ink);stroke-width:.8;overflow:visible}" +
  // foot row of the hero
  ".sy-foot{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding-bottom:var(--g)}" +
  ".sy-toggle{display:flex;align-items:stretch;height:30px;border:1px solid var(--ink);border-radius:3px;overflow:hidden;background:var(--paper)}" +
  ".sy-toggle>span{display:grid;place-items:center;width:46px;transition:background .3s,color .3s}" +
  ".sy-tg-a{background:var(--ink);color:var(--bg)}" +
  ".sy-tg-a svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.3}" +
  ".sy-tg-b{background-image:repeating-conic-gradient(var(--ink) 0 25%,transparent 0 50%);background-size:6px 6px;margin:5px;border-radius:2px}" +
  ".sy-toggle[aria-pressed=true] .sy-tg-a{background:transparent;color:var(--ink)}" +
  ".sy-toggle[aria-pressed=true] .sy-tg-b{outline:5px solid var(--ink)}" +
  ".sy-ess{position:relative;width:clamp(260px,25vw,390px);border:1px solid var(--line2);background:var(--paper);padding:12px 14px 14px}" +
  ".sy-ess-h{display:flex;align-items:center;gap:6px;font-weight:500;font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px}" +
  ".sy-ess-h svg{width:13px;height:13px}" +
  ".sy-ess-p{font-size:11px;line-height:1.5;letter-spacing:.02em;text-transform:uppercase;opacity:.9}" +
  ".sy-ess-x{position:absolute;right:5px;top:5px;width:7px;height:7px;border:1px solid var(--ink)}" +
  // agent cursors
  ".sy-hands{position:absolute;inset:0;z-index:30;pointer-events:none;overflow:hidden}" +
  ".sy-hand{position:absolute;left:0;top:0;transform:translate(-200px,-200px);opacity:0}" +
  ".sy-hg{position:relative;transform-origin:2px 2px}" +
  ".sy-gl{position:absolute;left:0;top:0;display:none;overflow:visible}" +
  ".sy-hand[data-tool=arrow] .sy-gl-arrow{display:block}" +
  ".sy-hand[data-tool=text] .sy-gl-text{display:block;left:-7px;top:-12px}" +
  ".sy-hand[data-tool=cross] .sy-gl-cross{display:block;left:-12px;top:-12px}" +
  ".sy-hand[data-tool=grab] .sy-gl-grab{display:block;left:-12px;top:-12px}" +
  ".sy-name{position:absolute;left:15px;top:19px;background:var(--c);color:#fff;font:500 11px/1 " + MONO + ";padding:4px 7px;border-radius:2px;white-space:nowrap;box-shadow:0 0 0 1px rgba(255,255,255,.7)}" +
  ".sy-key{position:absolute;left:16px;top:-24px;background:var(--paper);color:var(--ink);border:1px solid var(--ink);font:500 11px/1 " + MONO + ";padding:3px 5px;border-radius:2px;opacity:0;white-space:nowrap}" +
  ".sy-frm{position:absolute;left:0;top:0;border:1px solid var(--c);opacity:0;pointer-events:none}" +
  ".sy-frm b{position:absolute;left:-1px;top:calc(100% + 5px);background:var(--c);color:#fff;font:500 10px/1 " + MONO + ";padding:3px 5px;white-space:nowrap}" +
  ".sy-pending .sy-copy,.sy-pending .sy-board{visibility:hidden}" +
  // sections
  ".sy-sec{position:relative;padding:clamp(64px,11vh,128px) var(--g);border-top:1px solid var(--line)}" +
  ".sy-label{display:flex;flex-direction:column;gap:10px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;align-self:start}" +
  ".sy-label h2{font-family:" + SERIF + ";font-weight:300;font-size:clamp(26px,2.4vw,38px);letter-spacing:-.02em;text-transform:none;line-height:1.05}" +
  ".sy-label p{max-width:30ch;opacity:.7;line-height:1.5}" +
  ".sy-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(16px,1.8vw,28px)}" +
  ".sy-card{display:flex;flex-direction:column;gap:10px;min-width:0}" +
  ".sy-cimg{position:relative;display:block;border:1px solid var(--ink);padding:6px;background:var(--paper);outline:1px solid transparent;outline-offset:5px;transition:outline-color .2s}" +
  ".sy-cimg img{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;clip-path:inset(0 0 0 0);transition:clip-path .9s " + EASE + " calc(var(--i,0) * .12s),filter .4s}" +
  ".sy-cmeta{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.06em;margin-top:4px}" +
  ".sy-ctitle{font-family:" + SERIF + ";font-weight:300;font-size:clamp(24px,2.1vw,34px);letter-spacing:-.02em;line-height:1.05}" +
  ".sy-ckind{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.75}" +
  ".sy-cblurb{font-family:" + SERIF + ";font-weight:300;font-size:16px;line-height:1.4;opacity:.85}" +
  ".sy-rows{border-top:1px solid var(--line2)}" +
  ".sy-row{position:relative;display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.4fr) auto;align-items:baseline;gap:16px;padding:20px 0;border-bottom:1px solid var(--line2)}" +
  ".sy-row::before{content:'';position:absolute;inset:0;background:var(--soft);transform:scaleX(0);transform-origin:0 50%;transition:transform .5s " + EASE + ";z-index:0}" +
  ".sy-row>span{position:relative;z-index:1}" +
  ".sy-rname{font-family:" + SERIF + ";font-weight:300;font-size:clamp(26px,2.6vw,42px);letter-spacing:-.02em;line-height:1.05}" +
  ".sy-rwork,.sy-ryear{font-size:11px;letter-spacing:.06em;text-transform:uppercase}" +
  ".sy-ct{display:flex;flex-direction:column;gap:clamp(20px,4vh,40px)}" +
  ".sy-closing{font-family:" + SERIF + ";font-weight:300;font-size:clamp(34px,5.2vw,92px);line-height:1;letter-spacing:-.03em;max-width:16ch}" +
  ".sy-mail{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;font-family:" + SERIF + ";font-weight:300;font-size:clamp(18px,2vw,30px);letter-spacing:-.01em;border-bottom:1px solid var(--ink);padding-bottom:4px;overflow-wrap:anywhere}" +
  ".sy-mail svg{width:.8em;height:.8em;flex:none;transition:transform .3s " + EASE + "}" +
  ".sy-footer{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:20px var(--g) var(--g);border-top:1px solid var(--line);font-size:11px;letter-spacing:.06em;text-transform:uppercase}" +
  ".sy-footer>button{margin-left:auto}" +
  // scroll reveals (only once JS is running, so no-JS still shows everything)
  ".sy-js [data-rv]{opacity:0;transform:translateY(22px);transition:opacity .8s " + EASE + " calc(var(--i,0) * .12s),transform .8s " + EASE + " calc(var(--i,0) * .12s)}" +
  ".sy-js [data-rv][data-in]{opacity:1;transform:translateY(0)}" +
  ".sy-js .sy-card[data-rv] .sy-cimg img{clip-path:inset(0 0 100% 0)}" +
  ".sy-js .sy-card[data-rv][data-in] .sy-cimg img{clip-path:inset(0 0 0 0)}" +
  ".sy-js .sy-row[data-rv]{transform:none}" +
  ".sy-js .sy-row[data-rv]::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:1px;background:var(--ink);transform:scaleX(0);transform-origin:0 50%;transition:transform 1s " + EASE + " calc(var(--i,0) * .15s + .2s)}" +
  ".sy-js .sy-row[data-rv][data-in]::after{transform:scaleX(1)}" +
  "@media (hover:hover) and (pointer:fine){" +
  ".sy-sel[data-drag]{cursor:grab}" +
  ".sy-sel:hover{outline-color:var(--ink)}" +
  ".sy-sel:hover>.sy-tag{opacity:1}" +
  ".sy-replay:hover{background:var(--ink);color:var(--bg)}" +
  ".sy-card:hover .sy-cimg{outline-color:var(--ink)}" +
  ".sy-card:hover .sy-cimg .sy-tag{opacity:1}" +
  ".sy-card:hover .sy-cimg img{filter:contrast(1.12) brightness(1.08)}" +
  ".sy-row:hover::before{transform:scaleX(1)}" +
  ".sy-mail:hover svg{transform:translate(3px,-3px)}" +
  "}" +
    "@media (max-width:820px){" +
  ".sy-root{--fs:clamp(28px,7.6vw,44px)}" +
  ".sy-cols{grid-template-columns:minmax(0,1fr);row-gap:28px}" +
  ".sy-guide{display:none}" +
  ".sy-boardwrap,.sy-copy{grid-column:1}" +
  ".sy-copy{grid-row:1;padding-top:12px}" +
  ".sy-boardwrap{grid-row:2;margin-bottom:var(--g)}" +
  ".sy-p2row{grid-template-columns:minmax(0,1fr);row-gap:22px}" +
  ".sy-pair{max-width:420px}" +
  ".sy-foot{margin-top:8px;padding-bottom:0;flex-direction:column;align-items:flex-start}" +
  ".sy-ess{width:100%;max-width:440px}" +
  ".sy-wire{width:10cqw}" +
  ".sy-time span:first-child{display:none}" +
  ".sy-nav{column-gap:10px}" +
  ".sy-cards{grid-template-columns:minmax(0,1fr)}" +
  ".sy-row{grid-template-columns:minmax(0,1fr) auto}.sy-rwork{grid-column:1 / -1;grid-row:2}" +
  "}" +
  "@media (max-width:400px){.sy-rp-w{display:none}}" +
  "@media (prefers-reduced-motion:reduce){" +
  ".sy-par,.sy-pupil{transition:none;transform:none}" +
  ".sy-js [data-rv],.sy-js [data-rv][data-in]{opacity:1;transform:none;transition:none}" +
  ".sy-js .sy-card[data-rv] .sy-cimg img{clip-path:none;transition:none}" +
  ".sy-js .sy-row[data-rv]::after{transform:scaleX(1);transition:none}" +
  ".sy-grid,.sy-cell,.sy-row::before{transition:none}" +
  "}"
