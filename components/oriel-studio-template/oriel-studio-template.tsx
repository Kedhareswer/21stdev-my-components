"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"

/**
 * Oriel Studio Template
 *
 * A design-studio site told as a film: nine full-screen scenes, one on screen
 * at a time. Inside a scene the content glides on a soft lerped scroll; at the
 * scene's edge (after a small buffer, so one stray wheel tick never skips a
 * scene) the next scene slides in and its content rises and untilts.
 *
 * Every cut has a job:
 *   - scene slide        wheel, trackpad, PageDown / arrows / space
 *   - marquee flash      only between About and What we make (750 ms)
 *   - disc + logo stroke every menu, nav, Home / End / number-key jump
 *   - in-scene wipes     a black disc swallows the lilac People scene, a 1 px
 *                        line grows tall then wide into white after Work, the
 *                        rope's squircle floods the screen.
 *
 * How the scroll works: each scene is a real `overflow:auto` scroller (so
 * focus, find-in-page and screen readers scroll it natively). Wheel input is
 * taken over and eased into that scroller's scrollTop; every scrubbed effect is
 * a GSAP timeline on a ScrollTrigger whose `scroller` is the scene. Pinned
 * stages are plain `position:sticky`. When a scrubbed value crosses a threshold
 * a short timed tween fires (the tag pop, the slot-machine roll, the spell-in).
 *
 * Mobile (narrow or touch-only) and prefers-reduced-motion get a stacked page
 * on the window's native scroll: horizontal scenes stack, the form becomes a
 * bottom sheet, the rope renders at 1x. Reduced motion also drops every wipe
 * and scrub: timelines rest on their key frame and content simply fades in.
 *
 * Media: Pexels photos and videos (Pexels licence, free to use and modify).
 * Fonts: Inter Tight + Bricolage Grotesque (SIL OFL) from Google Fonts.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

export type OrielProject = {
  name: string
  kind: string
  year: string
  /** Any image URL. */
  img: string
}

export interface OrielStudioTemplateProps {
  /** Studio name: logo, menu, copy. */
  brand?: string
  /** The hero line, set in the quirky display face. */
  headline?: string
  projects?: OrielProject[]
  email?: string
  /** Height of the film frame. Must be a definite length. */
  height?: string
  /** "auto" follows the host's .dark class. */
  theme?: "auto" | "light" | "dark"
  /**
   * Frames for the rope scene, scrubbed by scroll (e.g. 48 photographic renders of a knot coming undone).
   * Without them the frames are baked once from the built-in 3D rope.
   */
  ropeFrames?: string[]
  /** Google Fonts stylesheet; null loads nothing (bring your own fonts). */
  fontHref?: string | null
  className?: string
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=Inter+Tight:wght@300..800&display=swap"

const PX = (id: number, w = 1400, h = 0) =>
  "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id + ".jpeg?auto=compress&cs=tinysrgb&w=" + w + (h ? "&h=" + h + "&fit=crop" : "")
const VID = (id: number, size: string) => "https://videos.pexels.com/video-files/" + id + "/" + id + "-" + size + "_30fps.mp4"

/** Frames in the baked rope sequence (the reference ships 47). */
const ROPE_FRAMES = 48
const REEL = VID(19457509, "hd_1920_1080")
const MAKE = VID(19457370, "hd_1920_1080")

const DEFAULT_PROJECTS: OrielProject[] = [
  { name: "Mallow", kind: "Skincare identity", year: "2026", img: PX(4841519, 1000) },
  { name: "Arcadia", kind: "Architecture website", year: "2026", img: PX(21849253, 1000) },
  { name: "Halcyon", kind: "Meditation app", year: "2025", img: PX(29612114, 1000) },
  { name: "Pebble", kind: "Savings brand", year: "2025", img: PX(15863490, 1000) },
  { name: "Casa Rosa", kind: "Hotel website", year: "2025", img: PX(11116100, 1000) },
  { name: "Fold", kind: "Packaging system", year: "2024", img: PX(36339062, 1000) },
  { name: "Prism", kind: "Design system", year: "2024", img: PX(29579757, 1000) },
]

const CARDS = [
  {
    tint: "var(--or-warm)",
    title: "We make good ideas feel obvious",
    text: "Strategy, identity and product live in one small room here, so the idea that starts a project is the one that ships.",
    clip: VID(15863510, "sd_960_540"),
  },
  {
    tint: "var(--or-mint)",
    title: "Small studio, long memory",
    text: "Eleven designers, two engineers, one long table. Most of the teams we work with have stayed for more than three years.",
    clip: VID(15863511, "sd_960_540"),
  },
  {
    tint: "var(--or-lilac-soft)",
    title: "Calm is a craft",
    text: "We take things away until nothing is left to argue with, then tune the half-second that makes it feel alive.",
    clip: VID(19493166, "sd_960_540"),
  },
]

const AVATARS = [33866498, 15946547, 29852852, 11824896, 38197025, 14669406, 19456417, 36439572, 31530222]
const TAGS = ["Brand systems", "Product interfaces", "Apps that travel", "Motion & 3D"]
const CURSORS = [
  { name: "Mira", c: "#f08a7e", x: -38, y: -20 },
  { name: "Jonas", c: "#7c8cff", x: 36, y: -17 },
  { name: "Ade", c: "#3fbf8f", x: 38, y: 8 },
  { name: "Lin", c: "#c58cf2", x: -40, y: 12 },
  { name: "Tomás", c: "#f2b84b", x: -14, y: 22 },
  { name: "Priya", c: "#4fb7e8", x: 18, y: 23 },
]
const PROOF = ["In fintech", "In health", "In hospitality", "In climate", "In retail", "In education"]
const CLIENTS = ["Mallow", "Arcadia", "Halcyon", "Pebble", "Casa Rosa", "Fold", "Prism", "Fernhill", "Lumen", "Tidepool"]
const SERVICES = ["Brand identity", "Product design", "Website", "Motion & 3D", "Design system", "Something else"]
const BUDGETS = ["< $20k", "$20–50k", "$50–100k", "$100k +"]

const SCENES = [
  { id: "home", label: "Home", tone: "light" },
  { id: "about", label: "About", tone: "light" },
  { id: "make", label: "What we make", tone: "light" },
  { id: "people", label: "People", tone: "light" },
  { id: "quote", label: "Belief", tone: "dark" },
  { id: "work", label: "Work", tone: "dark" },
  { id: "proof", label: "Proof", tone: "light" },
  { id: "rope", label: "Process", tone: "dark" },
  { id: "contact", label: "Contact", tone: "light" },
] as const

// #region deck-logic
// Everything the scene engine decides, as pure functions (lifted by the test).
export const EDGE_BUFFER = 260
export const GESTURE_GAP = 170
export const SLIDE_MS = 700

export function normalizeWheel(deltaY: number, mode: number, page: number) {
  return mode === 1 ? deltaY * 32 : mode === 2 ? deltaY * page : deltaY
}

/** One frame of the soft scroll: moves 6% of the way per 60 Hz frame, frame-rate independent. */
export function glide(cur: number, target: number, ease: number, dtMs: number) {
  const k = 1 - Math.pow(1 - ease, Math.min(dtMs, 64) / (1000 / 60))
  const next = cur + (target - cur) * k
  return Math.abs(target - next) < 0.3 ? target : next
}

/**
 * A wheel delta inside the active scene. Scroll inside until the glide has
 * reached the edge; then hold the overflow in `push` and only turn the scene
 * once it passes the buffer.
 */
export function wheelStep(
  s: { target: number; push: number },
  delta: number,
  cur: number,
  max: number,
  buffer: number,
  gain: number,
  lead = Infinity,
): { target: number; push: number; turn: number } {
  if (delta > 0) {
    if (cur < max - 1.5) return { target: Math.min(max, s.target + delta * gain, cur + lead), push: 0, turn: 0 }
    const push = Math.max(0, s.push) + delta
    return push >= buffer ? { target: max, push: 0, turn: 1 } : { target: max, push, turn: 0 }
  }
  if (delta < 0) {
    if (cur > 1.5) return { target: Math.max(0, s.target + delta * gain, cur - lead), push: 0, turn: 0 }
    const push = Math.min(0, s.push) + delta
    return push <= -buffer ? { target: 0, push: 0, turn: -1 } : { target: 0, push, turn: 0 }
  }
  return { target: s.target, push: s.push, turn: 0 }
}

export function stepIndex(i: number, dir: number, n: number) {
  const j = i + dir
  return j < 0 || j >= n ? -1 : j
}

/** +1 when a scrubbed value rises through `at`, -1 when it falls back through it. */
export function crossed(prev: number, cur: number, at: number) {
  return prev < at && cur >= at ? 1 : prev >= at && cur < at ? -1 : 0
}

export function band(p: number, a: number, b: number) {
  return Math.min(1, Math.max(0, (p - a) / (b - a)))
}

/** Which slot-machine label a progress shows: the last stop passed, -1 before the first. */
export function slotIndex(p: number, stops: number[]) {
  let i = -1
  for (let k = 0; k < stops.length; k++) if (p >= stops[k]) i = k
  return i
}

/** Letters lit by a reading progress; the last 5% holds the whole quote lit. */
export function litCount(p: number, total: number) {
  return Math.max(0, Math.min(total, Math.ceil((p / 0.95) * total)))
}

export function wrap(i: number, n: number) {
  return ((i % n) + n) % n
}

/** Signed distance of card i from the active card on a looping ring. */
export function ringOffset(i: number, active: number, n: number) {
  let d = wrap(i - active, n)
  if (d > n / 2) d -= n
  return d
}

/** What a key does to the deck. */
export function keyIntent(key: string, shift: boolean, n: number): { kind: string; to: number } | null {
  if (key === "ArrowDown" || key === "PageDown" || (key === " " && !shift)) return { kind: "step", to: 1 }
  if (key === "ArrowUp" || key === "PageUp" || (key === " " && shift)) return { kind: "step", to: -1 }
  if (key === "Home") return { kind: "jump", to: 0 }
  if (key === "End") return { kind: "jump", to: n - 1 }
  if (/^[1-9]$/.test(key) && +key <= n) return { kind: "jump", to: +key - 1 }
  return null
}

/** The marquee flash plays on one cut only. */
export function interstitial(fromId: string, toId: string) {
  return fromId === "about" && toId === "make"
}

/** The jump disc is the opposite of the scene it leaves. */
export function discColor(leavingTone: string) {
  return leavingTone === "dark" ? "light" : "dark"
}
// #endregion

const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ")

/** Letters wrapped for the typed-in reveal; the plain text stays readable. */
function Spell({ text, hidden }: { text: string; hidden?: boolean }) {
  const words = text.split(" ")
  let n = 0
  return (
    <>
      {!hidden && <span className="or-sr">{text}</span>}
      <span className="or-spell" aria-hidden="true" data-spell="">
        {words.map((w, wi) => (
          <React.Fragment key={wi}>
            <span className="or-w">
              {[...w].map((c, ci) => (
                <span className="or-l" key={ci} style={{ "--i": n++ } as React.CSSProperties}>
                  {c}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </>
  )
}

/** Rolling-text hover: the label flips out tilted and a copy rolls in. */
function Roll({ children }: { children: string }) {
  return (
    <span className="or-roll">
      <span className="or-roll-s">{children}</span>
      <span className="or-roll-t" aria-hidden="true">
        <span>{children}</span>
        <span>{children}</span>
      </span>
    </span>
  )
}

function Clip({ src, className }: { src: string; className?: string }) {
  // no autoPlay: nine clips would all download at boot; the engine plays only what is on screen
  return <video className={cx("or-vid", className)} src={src} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
}

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 28" className={className} aria-hidden="true">
      <path d="M3 26.5V12a9 9 0 0 1 18 0v14.5Z" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M12 4v22.5M3 15.5h18" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  )
}

function Eye() {
  return (
    <svg viewBox="0 0 140 140" className="or-eye" aria-hidden="true">
      <defs>
        <path id="or-ring" d="M70 70m-55 0a55 55 0 1 1 110 0a55 55 0 1 1 -110 0" />
        <clipPath id="or-almond">
          <path d="M40 70Q70 44 100 70Q70 96 40 70Z" />
        </clipPath>
      </defs>
      <g className="or-eye-ring">
        <text>
          <textPath href="#or-ring" startOffset="0">
            ORIEL STUDIO · SCROLL DOWN · SEE WHAT WE MAKE ·
          </textPath>
        </text>
      </g>
      <g className="or-lash">
        <path d="M55 52l-3-6M70 49v-7M85 52l3-6M47 58l-5-4M93 58l5-4" />
      </g>
      <path d="M40 70Q70 44 100 70Q70 96 40 70Z" fill="#fff" />
      <g clipPath="url(#or-almond)">
        <g className="or-iris">
          <circle cx="70" cy="70" r="13" fill="#dad2f4" />
          <circle cx="70" cy="70" r="7" fill="#17171a" />
          <circle cx="73" cy="67" r="2" fill="#fff" />
        </g>
        <rect className="or-lid or-lid-t" x="38" y="42" width="64" height="29" />
        <rect className="or-lid or-lid-b" x="38" y="69" width="64" height="29" />
      </g>
      <path d="M40 70Q70 44 100 70Q70 96 40 70Z" fill="none" stroke="#17171a" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  )
}

function Stars() {
  return (
    <span className="or-stars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20">
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8Z" />
        </svg>
      ))}
    </span>
  )
}

function Carousel({ projects }: { projects: OrielProject[] }) {
  const [at, setAt] = React.useState(0)
  const n = projects.length
  const drag = React.useRef<number | null>(null)
  const go = (d: number) => setAt((a) => wrap(a + d, n))
  const p = projects[at]
  return (
    <div
      className="or-car"
      role="region"
      aria-roledescription="carousel"
      aria-label="Selected work"
      onPointerDown={(e) => (drag.current = e.clientX)}
      onPointerUp={(e) => {
        if (drag.current == null) return
        const dx = e.clientX - drag.current
        drag.current = null
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") (go(1), e.preventDefault())
        if (e.key === "ArrowLeft") (go(-1), e.preventDefault())
      }}
    >
      <div className="or-car-ring">
        {projects.map((pr, i) => {
          const d = ringOffset(i, at, n)
          return (
            <figure
              key={pr.name}
              className={cx("or-car-card", d === 0 && "is-on")}
              style={{ "--d": d, opacity: Math.abs(d) > 1 ? 0 : 1 } as React.CSSProperties}
              aria-hidden={d !== 0}
              onClick={() => d && go(d)}
            >
              <img src={pr.img} alt={pr.name + ", " + pr.kind} draggable={false} />
              <figcaption className="or-car-meta">
                <span>{pr.kind}</span>
                <span>{pr.year}</span>
              </figcaption>
            </figure>
          )
        })}
      </div>
      <h3 className="or-car-title" key={p.name} aria-live="polite">
        <Spell text={p.name} />
      </h3>
      <div className="or-car-foot">
        <div className="or-car-bars" aria-hidden="true">
          {projects.map((pr, i) => (
            <span key={pr.name} className={cx(i === at && "is-on")} />
          ))}
        </div>
        <span className="or-car-count">
          {String(at + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </span>
        <button type="button" className="or-car-btn" data-mag="" data-cursor="nav" aria-label="Previous project" onClick={() => go(-1)}>
          ←
        </button>
        <button type="button" className="or-car-btn" data-mag="" data-cursor="nav" aria-label="Next project" onClick={() => go(1)}>
          →
        </button>
      </div>
    </div>
  )
}

function ContactForm({ email, onClose }: { email: string; onClose?: () => void }) {
  const [picked, setPicked] = React.useState<string[]>(["Product design"])
  const [budget, setBudget] = React.useState(BUDGETS[1])
  const [sent, setSent] = React.useState(false)
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
  return (
    <form
      className={cx("or-form", sent && "is-sent")}
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      {onClose && (
        <button type="button" className="or-sheet-x" aria-label="Close the form" onClick={onClose}>
          ×
        </button>
      )}
      <div className="or-form-row" data-rise="">
        <label className="or-field">
          <span>Name &amp; company</span>
          <input name="name" autoComplete="name" placeholder="Ines from Mallow" required />
        </label>
        <label className="or-field">
          <span>Your email</span>
          <input name="email" type="email" autoComplete="email" placeholder={"you@" + email.split("@")[1]} required />
        </label>
      </div>
      <fieldset className="or-chips" data-rise="">
        <legend>I'm interested in…</legend>
        {SERVICES.map((s) => (
          <label key={s} className={cx("or-chip", "or-rl", picked.includes(s) && "is-on")} data-cursor="nav">
            <input type="checkbox" checked={picked.includes(s)} onChange={() => toggle(s)} />
            <Roll>{s}</Roll>
          </label>
        ))}
      </fieldset>
      <fieldset className="or-chips" data-rise="">
        <legend>Project budget (USD)</legend>
        {BUDGETS.map((b) => (
          <label key={b} className={cx("or-chip", "or-rl", budget === b && "is-on")} data-cursor="nav">
            <input type="radio" name="budget" checked={budget === b} onChange={() => setBudget(b)} />
            <Roll>{b}</Roll>
          </label>
        ))}
      </fieldset>
      <label className="or-field or-field-wide" data-rise="">
        <span>Tell us about it</span>
        <textarea name="brief" rows={2} placeholder="What are you making, and what should it feel like?" />
      </label>
      <div className="or-submit-row" data-rise="">
        <span className="or-pulse" data-mag="" data-cursor="button">
          <i />
          <i />
          <i />
          <i />
          <button type="submit" className="or-submit">
            <span>Send</span> <span>the</span> <span>brief</span>
          </button>
        </span>
        <p className="or-sent" role="status">
          {sent ? "Thank you. We answer every brief within two working days." : ""}
        </p>
      </div>
    </form>
  )
}

export default function OrielStudioTemplate({
  brand = "Oriel",
  headline = "A small design studio making calm, considered products and brands that people come back to",
  projects = DEFAULT_PROJECTS,
  email = "hello@oriel.studio",
  height = "100svh",
  theme = "auto",
  fontHref = FONT_HREF,
  ropeFrames,
  className,
}: OrielStudioTemplateProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const engine = React.useRef<{ jump: (i: number) => void } | null>(null)
  const [mode, setMode] = React.useState<"deck" | "stack">("deck")
  const [reduced, setReduced] = React.useState(false)
  const [dark, setDark] = React.useState(theme === "dark")
  const [menu, setMenu] = React.useState(false)
  const [hover, setHover] = React.useState(0)
  const [sheet, setSheet] = React.useState(false)

  // Mode: deck needs a fine pointer and room; everything else gets the stacked page.
  React.useLayoutEffect(() => {
    const el = rootRef.current!
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)")
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    const pick = () => {
      setReduced(rm.matches)
      setMode(fine.matches && !rm.matches && el.parentElement!.clientWidth >= 760 ? "deck" : "stack")
      setDark(theme === "dark" || (theme === "auto" && !!el.closest(".dark")))
    }
    pick()
    const ro = new ResizeObserver(pick)
    ro.observe(el.parentElement!)
    fine.addEventListener("change", pick)
    rm.addEventListener("change", pick)
    return () => {
      ro.disconnect()
      fine.removeEventListener("change", pick)
      rm.removeEventListener("change", pick)
    }
  }, [theme])

  // The film: scene engine, scrubbed timelines, living details.
  React.useLayoutEffect(() => {
    const root = rootRef.current!
    const deck = mode === "deck"
    const q = <T extends Element = HTMLElement>(s: string, from: ParentNode = root) => from.querySelector(s) as T
    const qa = <T extends Element = HTMLElement>(s: string, from: ParentNode = root) => [...from.querySelectorAll(s)] as T[]
    const scenes = qa(".or-scene")
    const probe = q(".or-probe")
    const R = () => probe.getBoundingClientRect().width
    const header = q(".or-header")
    const N = scenes.length
    const cleanups: (() => void)[] = []
    const on = <K extends keyof WindowEventMap>(t: Window | HTMLElement, ev: K, fn: (e: WindowEventMap[K]) => void, opt?: AddEventListenerOptions) => {
      t.addEventListener(ev, fn as EventListener, opt)
      cleanups.push(() => t.removeEventListener(ev, fn as EventListener, opt))
    }

    const S = {
      active: 0,
      cur: 0,
      target: 0,
      push: 0,
      written: 0,
      busyUntil: 0,
      lastWheel: 0,
      stale: false,
      changedAt: 0,
      tone: [] as (string | undefined)[],
      bake: () => {},
    }
    const toneOf = (i: number) => (dark ? "dark" : S.tone[i] ?? SCENES[i].tone)
    const rail = qa(".or-rail button")
    const applyTone = (force?: string) => {
      header.setAttribute("data-tone", force ?? toneOf(S.active))
      rail.forEach((b, k) => b.classList.toggle("is-on", k === S.active))
    }
    const setTone = (i: number, t: string | undefined) => {
      if (S.tone[i] === t) return
      S.tone[i] = t
      if (i === S.active) applyTone()
    }
    root.classList.add("or-live")

    const ctx = gsap.context(() => {
      const scrollerOf = (el: HTMLElement) => (deck ? el : window)
      const scrub = (i: number, track: HTMLElement, tl: gsap.core.Timeline, rest: number, onUpdate?: (p: number) => void) => {
        if (reduced) {
          tl.progress(rest)
          onUpdate?.(rest)
          return
        }
        ScrollTrigger.create({
          trigger: track,
          scroller: scrollerOf(scenes[i]),
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          animation: tl,
          invalidateOnRefresh: true,
          onUpdate: onUpdate && ((st) => onUpdate(st.progress)),
          onRefresh: onUpdate && ((st) => onUpdate(st.progress)),
        })
      }
      const W = () => root.clientWidth
      const H = () => (deck ? root.clientHeight : window.innerHeight)

      // ---- 0 Home: showreel grows from its slot to full bleed -----------------------
      {
        const track = q(".or-reel-track")
        const mask = q(".or-reel-mask")
        if (deck && !reduced) {
          gsap.fromTo(
            mask,
            { clipPath: () => "inset(0px " + 9.375 * R() + "px " + Math.max(0, H() - 40 * R()) + "px " + 9.375 * R() + "px round " + 1.6 * R() + "px)" },
            {
              clipPath: "inset(0px 0px 0px 0px round 0px)",
              ease: "none",
              scrollTrigger: { trigger: track, scroller: scenes[0], start: "top bottom", end: "top top", scrub: true, invalidateOnRefresh: true },
            },
          )
        }
        if (!reduced) {
          gsap.fromTo(q(".or-reel-in"), { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 3, ease: "power2.inOut", delay: 0.2 })
          gsap.from(q(".or-eye"), { scale: 0.3, opacity: 0, duration: 2, ease: "power3.out", delay: 0.4 })
          gsap.from(header, { yPercent: -100, duration: 0.5, ease: "power2.out" })
        }
      }

      // ---- 1 About: cards scroll sideways, pill windows slide inside them --------------
      {
        const i = 1
        const track = q(".or-about-track")
        const row = q(".or-about-row")
        const stage = q(".or-stage", track)
        if (deck && !reduced) {
          const travel = () => Math.max(0, row.scrollWidth - stage.clientWidth)
          const size = () => (track.style.height = travel() + stage.clientHeight + "px")
          size()
          const ro = new ResizeObserver(() => (size(), ScrollTrigger.refresh()))
          ro.observe(row)
          cleanups.push(() => ro.disconnect())
          const slide = gsap.to(row, {
            x: () => -travel(),
            ease: "none",
            scrollTrigger: { trigger: track, scroller: scenes[i], start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true },
          })
          qa(".or-card", row).forEach((card) => {
            const pill = q(".or-card-pill", card)
            gsap.fromTo(
              pill,
              { x: () => card.clientWidth - pill.offsetWidth - 2 * pill.offsetLeft },
              {
                x: 0,
                ease: "none",
                scrollTrigger: { trigger: card, containerAnimation: slide, start: "left 85%", end: "left 10%", scrub: true, invalidateOnRefresh: true },
              },
            )
          })
        }
      }

      // ---- 2 What we make: full-screen clip shrinks into a product UI -----------------
      {
        const i = 2
        const st = q(".or-make")
        const track = q(".or-make-track")
        const media = q(".or-make-media", st)
        const mock = q(".or-mock", st)
        const slotVid = q<HTMLVideoElement>(".or-slot video", st)
        const bigVid = q<HTMLVideoElement>("video", media)
        const mockTop = () => (H() - 38 * R()) / 2 + 0.5 * R()
        const inset = (t: number, r: number, b: number, l: number, rad: number) =>
          "inset(" + t + "px " + r + "px " + b + "px " + l + "px round " + rad + "px)"
        // measured, not computed: the stacked layout zooms the mock
        const slotInset = () => {
          const s = q(".or-slot", st).getBoundingClientRect()
          const g = st.getBoundingClientRect()
          return inset(s.top - g.top, g.right - s.right, g.bottom - s.bottom, s.left - g.left, (deck ? 1 : 0.34) * R())
        }
        const cz = deck ? 1 : 0.45
        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } })
        tl.fromTo(q(".or-make-word", st), { x: 0, scale: 1 }, { x: () => -0.22 * W(), scale: 0.42, opacity: 0, duration: 0.14 }, 0)
          .fromTo(media, { clipPath: () => inset(0.3 * H(), 0, 0.3 * H(), W(), 2 * R()) }, { clipPath: () => inset(0.24 * H(), 0.05 * W(), 0.24 * H(), 0.66 * W(), 2.4 * R()), duration: 0.07 }, 0.01)
          .to(media, { clipPath: () => inset(0, 0, 0, 0, 0), duration: 0.09 }, 0.08)
          .to(media, { clipPath: slotInset, duration: 0.11, ease: "power1.inOut" }, 0.21)
          .set(mock, { autoAlpha: 1 }, 0.2)
          .set(media, { autoAlpha: 0 }, 0.45)
          .fromTo(q(".or-skel", mock), { opacity: 1 }, { opacity: 0, duration: 0.06 }, 0.38)
          .fromTo(q(".or-mock-in", mock), { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.38)
          .fromTo(q(".or-make-light", st), { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.46)
          .fromTo(mock, { width: () => 66 * R(), borderRadius: () => 2.25 * R() }, { width: () => 22 * R(), borderRadius: () => 3.4 * R(), duration: 0.16, ease: "power1.inOut" }, 0.64)
          .fromTo(q(".or-notch", mock), { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.76)
        qa(".or-cur", st).forEach((c, k) => {
          const from = CURSORS[k]
          tl.fromTo(c, { x: () => from.x * 1.9 * cz * R(), y: () => from.y * 2.4 * cz * R(), opacity: 0 }, { x: () => from.x * cz * R(), y: () => from.y * cz * R(), opacity: 1, duration: 0.09, ease: "power2.out" }, 0.5 + k * 0.012)
            .to(c, { x: () => (from.x * 0.55 + (k % 2 ? 4 : -4)) * cz * R(), y: () => (from.y * 0.9 + (k % 3) * 2) * cz * R(), duration: 0.2 }, 0.62)
            .to(c, { x: () => from.x * 2.2 * cz * R(), opacity: 0, duration: 0.07 }, 0.9)
        })
        const tag = q(".or-tag", st)
        const labels = qa(".or-tag-l", tag)
        const stops = [0.3, 0.47, 0.64, 0.82]
        let shown = -2
        const pop = (p: number) => {
          // scrubbed progress → timed pops: the pill springs in, the label rolls like a slot machine
          const idx = slotIndex(p, stops)
          if (idx === shown) return
          const up = idx > shown
          gsap.to(tag, idx < 0 ? { opacity: 0, scale: 0.5, duration: 0.3 } : { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" })
          labels.forEach((l, k) => {
            if (k === idx) gsap.fromTo(l, { yPercent: up ? 100 : -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "power3.out" })
            else if (k === shown) gsap.to(l, { yPercent: up ? -100 : 100, opacity: 0, duration: 0.45, ease: "power3.in" })
            else gsap.set(l, { opacity: 0 })
          })
          shown = idx
          if (bigVid && slotVid && p > 0.3 && Math.abs(slotVid.currentTime - bigVid.currentTime) > 0.3) slotVid.currentTime = bigVid.currentTime
        }
        scrub(i, track, tl, 0.6, pop)
      }

      // ---- 3 People: a sentence splits open, lets the team in, becomes a word ----------
      {
        const i = 3
        const st = q(".or-people")
        const gap = q(".or-gap", st)
        const ava = qa(".or-ava > *", st)
        const word = q(".or-gap-word", st)
        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } })
        // start states live at time 0: a refresh invalidates the later fromTo's, which then don't render at progress 0
        const pill = q(".or-ava", st)
        tl.set(ava, { scale: 0 }, 0)
          .set(word, { opacity: 0 }, 0)
          .set(pill, { opacity: 0, scaleX: 0.2 }, 0)
          .set(qa(".or-fly", st), { y: () => H() }, 0)
          .fromTo(gap, { width: 0 }, { width: () => pill.scrollWidth, duration: 0.14, ease: "power2.inOut" }, 0.06)
          .to(pill, { opacity: 1, scaleX: 1, transformOrigin: "0% 50%", duration: 0.14, ease: "power2.inOut" }, 0.06)
          .fromTo(ava, { scale: 0 }, { scale: 1, duration: 0.06, stagger: 0.008, ease: "back.out(2)" }, 0.1)
          .to(ava, { y: () => -5 * R(), scale: 0.5, opacity: 0, duration: 0.07, stagger: 0.006 }, 0.32)
          .to(pill, { opacity: 0, duration: 0.05 }, 0.37)
          .to(gap, { width: () => word.offsetWidth, duration: 0.1, ease: "power2.inOut" }, 0.36)
          .fromTo(word, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.08 }, 0.38)
        qa(".or-fly", st).forEach((f, k) => {
          tl.fromTo(
            f,
            { y: () => H() * (0.7 + k * 0.1), rotate: [-20, 14, -8][k] },
            { y: () => -H() * (0.9 + k * 0.15), rotate: [60, -50, 40][k], duration: 0.45 },
            0.18 + k * 0.06,
          )
        })
        const disc = q(".or-swallow", st)
        tl.fromTo(disc, { x: () => 0.7 * W(), scale: 0.18, rotate: 0 }, { x: 0, scale: 1, rotate: -120, duration: 0.16, ease: "power2.in" }, 0.82)
        let last = 0
        scrub(i, q(".or-people-track"), tl, 0.5, (p) => {
          if (crossed(last, p, 0.93)) setTone(i, p >= 0.93 ? "dark" : undefined)
          last = p
        })
      }

      // ---- 4 Quote: grey words light up letter by letter --------------------------------
      {
        const i = 4
        const letters = qa(".or-q .or-l")
        const bar = q(".or-qbar i")
        let n = -1
        const light = (p: number) => {
          const k = litCount(p, letters.length)
          if (k === n) return
          letters.forEach((l, j) => l.classList.toggle("is-lit", j < k))
          n = k
          bar.style.transform = "scaleY(" + p + ")"
        }
        scrub(i, q(".or-quote-track"), gsap.timeline({ paused: true }).to({}, { duration: 1 }), 1, light)
        if (!reduced) gsap.from(qa(".or-ring-c"), { opacity: 0, scale: 0.9, duration: 0.6, stagger: 0.2, delay: 0.3, paused: deck, id: "rings" })
      }

      // ---- 5 Work: thread draws, then a 1px line grows tall, then wide, into white -----
      {
        const i = 5
        const st = q(".or-work")
        const path = q<SVGPathElement>(".or-thread path", st)
        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } })
        tl.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3 }, 0.24)
          .to(q(".or-car", st), { scale: 0.9, opacity: 0, duration: 0.2 }, 0.3)
          .fromTo(q(".or-hand", st), { scale: 1 }, { scale: 0, duration: 0.24 }, 0.3)
          .to(path, { opacity: 0, duration: 0.06 }, 0.58)
          .fromTo(q(".or-slit", st), { scaleY: 0, scaleX: () => 1 / W() }, { scaleY: 1, duration: 0.16, ease: "power2.in" }, 0.6)
          .to(q(".or-slit", st), { scaleX: 1, duration: 0.18, ease: "power3.in" }, 0.78)
        let last = 0
        if (deck) scrub(i, q(".or-work-track"), tl, 0, (p) => {
          if (crossed(last, p, 0.9)) setTone(i, p >= 0.9 ? "light" : undefined)
          last = p
        })
      }

      // ---- 6 Proof: a 3D text cube turns from claim to evidence ----------------------
      {
        const i = 6
        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } })
        tl.fromTo(q(".or-cube"), { rotateY: 0 }, { rotateY: -90, duration: 0.6, ease: "power1.inOut" }, 0.2)
        scrub(i, q(".or-proof-track"), tl, 1)
      }

      // ---- 7 Rope: a scrubbed knot comes undone, the squircle floods the screen -------
      {
        const i = 7
        const st = q(".or-rope")
        const box = q(".or-squircle", st)
        const rope = mountRope(q<HTMLCanvasElement>(".or-rope-c", st), deck ? Math.min(2, window.devicePixelRatio) : 1)
        cleanups.push(rope.dispose)
        const idea = q(".or-idea", st)
        const ideaL = qa(".or-l", idea)
        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } })
        tl.fromTo(box, { width: () => 34 * R(), height: () => 22 * R(), borderRadius: () => 9 * R() }, { width: () => W(), height: () => H(), borderRadius: 0, duration: 0.28, ease: "power2.inOut" }, 0.58)
          .fromTo(q(".or-rope-fill", st), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.62)
          .fromTo(q(".or-rope-line", st), { opacity: 1, y: 0 }, { opacity: 0, y: () => -6 * R(), duration: 0.12 }, 0.5)
          .fromTo(q(".or-marq", st), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.8)
        // The rope is an image sequence, like the reference: a fixed run of frames picked by scroll.
        // Given frames (ropeFrames) play as-is; otherwise ROPE_FRAMES are baked once from the 3D rope.
        const seq = q<HTMLCanvasElement>(".or-rope-seq", st)
        const sg = seq.getContext("2d")!
        let frames: (HTMLImageElement | Blob)[] | null = null
        const decoded = new Map<number, ImageBitmap>()
        let band01 = [0, 1]
        let fi = -1
        let rv = 0
        const drawSeq = (force?: boolean) => {
          if (!frames) return
          const k = Math.round(rv * (frames.length - 1))
          if (k === fi && !force) return
          fi = k
          const w = seq.clientWidth
          const h = seq.clientHeight
          const f = frames[k]
          if (f instanceof Blob) {
            const bm = decoded.get(k)
            if (!bm) {
              createImageBitmap(f).then((b) => {
                if (!alive) return b.close()
                decoded.set(k, b)
                // keep a handful of decoded neighbours, close the rest
                for (const key of decoded.keys()) if (decoded.size > 8 && Math.abs(key - fi) > 4) (decoded.get(key)!.close(), decoded.delete(key))
                if (fi === k) drawSeq(true)
              })
              return
            }
            sg.clearRect(0, 0, w, h)
            sg.drawImage(bm, 0, band01[0] * h, w, (band01[1] - band01[0]) * h)
            return
          }
          sg.clearRect(0, 0, w, h)
          if (ropeFrames) {
            // cover-fit a full photographic frame
            const s = Math.max(w / f.naturalWidth, h / f.naturalHeight)
            sg.drawImage(f, (w - f.naturalWidth * s) / 2, (h - f.naturalHeight * s) / 2, f.naturalWidth * s, f.naturalHeight * s)
          }
        }
        const sizeSeq = () => {
          const dpr = deck ? Math.min(2, window.devicePixelRatio) : 1
          seq.width = seq.clientWidth * dpr
          seq.height = seq.clientHeight * dpr
          sg.setTransform(dpr, 0, 0, dpr, 0, 0)
          sg.imageSmoothingQuality = "high"
          drawSeq(true)
        }
        let alive = true
        cleanups.push(() => {
          alive = false
          decoded.forEach((b) => b.close())
        })
        const load = async () => {
          if (ropeFrames?.length) {
            const imgs = await Promise.all(
              ropeFrames.map((u) => {
                const im = new Image()
                im.decoding = "async"
                im.src = u
                return im.decode().then(() => im)
              }),
            )
            if (!alive) return
            frames = imgs
          } else {
            const baked = await rope.bake(deck ? ROPE_FRAMES : 28)
            if (!alive) return
            frames = baked.frames
            band01 = baked.band
          }
          st.classList.add("or-seq-on")
          sizeSeq()
        }
        // baked lazily: in the deck once the visitor reaches Work, on the stacked page shortly after load;
        // until then (or if baking fails) the live 3D rope answers the scroll
        let baking = false
        S.bake = () => {
          if (baking) return
          baking = true
          load().catch(() => {})
        }
        const bakeT = deck ? 0 : window.setTimeout(S.bake, 1500)
        cleanups.push(() => clearTimeout(bakeT))
        let last = 0
        scrub(i, q(".or-rope-track"), tl, 1, (p) => {
          rv = band(p, 0.04, 0.62)
          if (frames) drawSeq()
          else rope.set(rv)
          if (crossed(last, p, 0.7)) setTone(i, p >= 0.7 ? "light" : undefined)
          const c = crossed(last, p, 0.74)
          if (c > 0 || (reduced && p >= 0.74)) gsap.fromTo(ideaL, { yPercent: 80, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.02, ease: "power3.out", overwrite: true })
          if (c < 0) gsap.to(ideaL, { opacity: 0, duration: 0.2, overwrite: true })
          last = p
        })
        const ro = new ResizeObserver(() => {
          rope.resize()
          if (frames) sizeSeq()
        })
        ro.observe(st)
        cleanups.push(() => ro.disconnect())
      }

      // ---- the deck: wheel, keys, focus, the cuts ---------------------------------------
      // Video: the active scene plays, the next one preloads, everything else is paused and unloaded-until-needed.
      const vids = scenes.map((s) => qa<HTMLVideoElement>("video", s))
      const seenV = new Set<HTMLVideoElement>()
      const syncMedia = () => {
        if (S.active >= 5) S.bake()
        vids.forEach((vs, i) =>
          vs.forEach((v) => {
            if (!deck) return
            if (i === S.active) v.play().catch(() => {})
            else {
              v.pause()
              if (i === S.active + 1 && v.preload === "none") v.preload = "auto"
            }
          }),
        )
      }
      if (!deck) {
        const io = new IntersectionObserver(
          (es) =>
            es.forEach((e) => {
              const v = e.target as HTMLVideoElement
              if (e.isIntersecting) (seenV.add(v), v.play().catch(() => {}))
              else if (seenV.has(v)) v.pause()
            }),
          { rootMargin: "200px 0px" },
        )
        vids.flat().forEach((v) => io.observe(v))
        cleanups.push(() => io.disconnect())
      }
      const proofActive = () => (deck ? S.active === 6 : true)

      const arrive = (i: number, delay: number) => {
        const scene = scenes[i]
        const fh = root.clientHeight
        // measured against the scene, which may still be off-frame mid-slide
        const top = scene.getBoundingClientRect().top
        const vis = (el: Element) => {
          const r = el.getBoundingClientRect()
          return r.bottom > top && r.top < top + fh
        }
        const rise = qa("[data-rise]", scene).filter(vis)
        const spell = qa("[data-spell] .or-l", scene).filter((l) => !l.closest(".or-idea, .or-q, .or-car-title") && vis(l))
        if (reduced) {
          gsap.fromTo(scene, { opacity: 0 }, { opacity: 1, duration: 0.35 })
          return
        }
        gsap.fromTo(rise, { y: 50, rotate: 3, opacity: 0, transformOrigin: "0% 100%" }, { y: 0, rotate: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power3.out", delay, overwrite: "auto", clearProps: "transform" })
        gsap.fromTo(spell, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.014, ease: "power3.out", delay: delay + 0.05, overwrite: "auto" })
        if (i === 4) gsap.getById("rings")?.restart(true)
      }

      const place = (to: number, fromBelow: boolean) => {
        // off-frame scenes stay in the tree (screen readers, Tab), only translated out of view
        scenes.forEach((s, k) => gsap.set(s, { yPercent: k < to ? -100 : k > to ? 100 : 0 }))
        const sc = scenes[to]
        const max = sc.scrollHeight - sc.clientHeight
        S.cur = S.target = S.written = fromBelow ? max : 0
        sc.scrollTop = S.cur
        S.push = 0
        S.active = to
        root.setAttribute("data-scene", SCENES[to].id)
        applyTone()
        syncMedia()
        ScrollTrigger.update()
      }

      const slide = (to: number) => {
        const from = S.active
        const dir = to > from ? 1 : -1
        const now = performance.now()
        S.busyUntil = now + (reduced ? 400 : SLIDE_MS + 120)
        S.changedAt = now
        S.stale = true
        const a = scenes[from]
        const b = scenes[to]
        const max = b.scrollHeight - b.clientHeight
        S.cur = S.target = S.written = dir > 0 ? 0 : max
        b.scrollTop = S.cur
        S.push = 0
        S.active = to
        root.setAttribute("data-scene", SCENES[to].id)
        if (reduced) {
          place(to, dir < 0)
          arrive(to, 0)
          return
        }
        gsap.set(b, { yPercent: 100 * dir })
        gsap.to(b, { yPercent: 0, duration: SLIDE_MS / 1000, ease: "power2.inOut" })
        gsap.to(a, { yPercent: -100 * dir, duration: SLIDE_MS / 1000, ease: "power2.inOut", onComplete: syncMedia })
        if (interstitial(SCENES[from].id, SCENES[to].id)) flash()
        else applyTone()
        syncMedia()
        ScrollTrigger.update()
        // content starts rising while the scene is still travelling, so no frame of the cut is empty
        arrive(to, 0.22)
      }

      // The 750 ms marquee: rotated rows racing at five speeds, header flicked white.
      const flash = () => {
        const ov = q(".or-flash")
        applyTone("dark")
        gsap.set(ov, { autoAlpha: 1 })
        qa(".or-flash-row", ov).forEach((r, k) =>
          gsap.fromTo(r, { xPercent: k % 2 ? -50 : 0 }, { xPercent: k % 2 ? 0 : -50, duration: [1.5, 0.75, 1.25, 0.9, 0.75, 1.1, 0.8][k], ease: "none", repeat: 1 }),
        )
        gsap.delayedCall(0.75, () => {
          gsap.set(ov, { autoAlpha: 0 })
          applyTone()
        })
      }

      // Menu / nav jumps: a disc sweeps in, the logo draws itself, the scene swaps, the disc fades.
      const jump = (to: number) => {
        if (to === S.active || to < 0 || to >= N) return
        if (!deck) {
          scenes[to].scrollIntoView({ behavior: reduced ? "auto" : "smooth" })
          return
        }
        if (reduced) {
          place(to, false)
          arrive(to, 0)
          return
        }
        const now = performance.now()
        S.busyUntil = now + 1500
        S.changedAt = now + 1000
        S.stale = true
        const ov = q(".or-jump")
        const paths = qa<SVGGeometryElement>(".or-jump-logo path, .or-jump-logo text", ov)
        ov.setAttribute("data-c", discColor(toneOf(S.active)))
        gsap
          .timeline()
          .set(ov, { autoAlpha: 1 })
          .fromTo(q(".or-jump-disc", ov), { x: () => -2 * Math.max(W(), H()), opacity: 1 }, { x: 0, duration: 0.45, ease: "power3.out" })
          .fromTo(paths, { strokeDashoffset: 420 }, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, 0.4)
          .call(() => place(to, false), [], 0.6)
          .to(ov, { autoAlpha: 0, duration: 0.4 }, 1.0)
          .call(() => arrive(to, 0), [], 1.0)
      }
      engine.current = { jump }

      if (deck) {
        place(0, false)
        arrive(0, 0.15)
        // The soft scroll: one rAF eases the active scene's scrollTop toward its target.
        let raf = 0
        let then = performance.now()
        const loop = (t: number) => {
          const dt = t - then
          then = t
          const sc = scenes[S.active]
          if (Math.abs(S.target - S.cur) > 0.01) {
            S.cur = glide(S.cur, S.target, 0.05, dt)
            sc.scrollTop = S.cur
            S.written = sc.scrollTop
          }
          raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        cleanups.push(() => cancelAnimationFrame(raf))

        // Anything else that scrolls a scene (focus, find, a screen reader) is adopted, not fought.
        scenes.forEach((sc, i) =>
          on(sc, "scroll", () => {
            if (i !== S.active) return
            if (Math.abs(sc.scrollTop - S.written) > 2) S.cur = S.target = S.written = sc.scrollTop
          }),
        )
        // Focus is never trapped off-screen: tabbing into another scene brings it in.
        on(root, "focusin", (e) => {
          const s = (e.target as HTMLElement).closest(".or-scene")
          const i = scenes.indexOf(s as HTMLElement)
          if (i >= 0 && i !== S.active && performance.now() > S.busyUntil) place(i, false)
          root.scrollTop = 0
          root.scrollLeft = 0
        })
        on(root, "scroll", () => {
          root.scrollTop = 0
          root.scrollLeft = 0
        })

        const turn = (dir: number) => {
          const to = stepIndex(S.active, dir, N)
          if (to < 0) return false
          slide(to)
          return true
        }

        on(
          root,
          "wheel",
          (e) => {
            if (e.ctrlKey || root.classList.contains("or-menu-open")) return
            const now = performance.now()
            const gap = now - S.lastWheel
            S.lastWheel = now
            const delta = normalizeWheel(e.deltaY, e.deltaMode, root.clientHeight)
            if (!delta) return
            // inertia from the gesture that turned the scene must not turn the next one
            if (gap > GESTURE_GAP || now - S.changedAt > 1400) S.stale = false
            if (now < S.busyUntil || S.stale) return e.preventDefault()
            const sc = scenes[S.active]
            const max = sc.scrollHeight - sc.clientHeight
            const r = wheelStep(S, delta, S.cur, max, EDGE_BUFFER, 2.6, root.clientHeight * 0.9)
            S.target = r.target
            S.push = r.push
            if (r.turn && !turn(r.turn)) return // first top / last bottom: let the host page scroll
            e.preventDefault()
          },
          { passive: false },
        )

        on(window, "keydown", (e) => {
          const t = e.target as HTMLElement
          if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
          if (t.closest("input, textarea, select, [contenteditable]")) return
          if (root.classList.contains("or-menu-open")) {
            if (e.key === "Escape") setMenu(false)
            return
          }
          const k = keyIntent(e.key, e.shiftKey, N)
          if (!k) return
          if (e.key === " " && t.closest("button, a, label")) return
          e.preventDefault()
          if (performance.now() < S.busyUntil) return
          if (k.kind === "jump") return jump(k.to)
          const sc = scenes[S.active]
          const max = sc.scrollHeight - sc.clientHeight
          const step = /Page| /.test(e.key) ? root.clientHeight * 0.85 : 140
          const atEdge = k.to > 0 ? S.cur >= max - 1.5 : S.cur <= 1.5
          if (atEdge) turn(k.to)
          else S.target = Math.min(max, Math.max(0, S.target + k.to * step))
        })
      } else {
        // Stacked: native scroll; header tone and arrivals follow the window.
        scenes.forEach((s, i) => {
          ScrollTrigger.create({
            trigger: s,
            start: "top 10%",
            end: "bottom 10%",
            onToggle: (st) => {
              if (!st.isActive) return
              S.active = i
              applyTone()
            },
          })
          qa("[data-rise], [data-spell]", s).filter((el) => !el.closest(".or-idea, .or-car-title")).forEach((el) =>
            reduced
              ? gsap.from(el, { opacity: 0, duration: 0.5, scrollTrigger: { trigger: el, start: "top 92%", once: true } })
              : gsap.from(el.matches("[data-spell]") ? qa(".or-l", el) : el, {
                  y: el.matches("[data-spell]") ? 0 : 40,
                  yPercent: el.matches("[data-spell]") ? 70 : 0,
                  rotate: el.matches("[data-spell]") ? 0 : 3,
                  opacity: 0,
                  duration: 0.5,
                  stagger: 0.014,
                  ease: "power3.out",
                  scrollTrigger: { trigger: el, start: "top 92%", once: true },
                }),
          )
        })
        applyTone()
        syncMedia()
      }

      // ---- living details ---------------------------------------------------------------
      const dot = q(".or-dot")
      const iris = q(".or-iris")
      const eye = q(".or-eye")
      const blob = q(".or-blob")
      const mags = qa("[data-mag]")
      const ptr = { x: -100, y: -100, bx: 0, by: 0, dx: -100, dy: -100, idle: 0, inside: false }
      const magScene = mags.map((m) => scenes.indexOf(m.closest(".or-scene") as HTMLElement))
      let sleepT = 0
      on(window, "pointermove", (e) => {
        if (e.pointerType !== "mouse") return
        ptr.x = e.clientX
        ptr.y = e.clientY
        ptr.idle = performance.now()
        ptr.inside = true
        const t = (e.target as HTMLElement).closest?.("[data-cursor], a, button, label") as HTMLElement | null
        dot.setAttribute("data-k", t ? t.getAttribute("data-cursor") || "nav" : "")
        eye.classList.remove("is-asleep")
        clearTimeout(sleepT)
        sleepT = window.setTimeout(() => eye.classList.add("is-asleep"), 2000)
      })
      cleanups.push(() => clearTimeout(sleepT))
      let raf2 = 0
      const live = () => {
        const fine = deck
        // idle pointer and settled magnets: nothing to read or write this frame
        const still = performance.now() - ptr.idle > 1500 && Math.abs(ptr.x - ptr.dx) < 0.5 && Math.abs(ptr.y - ptr.dy) < 0.5 && (!proofActive() || (ptr.bx === ptr.x && ptr.by === ptr.y))
        if (fine && !still) {
          // reads first, then writes: one layout per frame; only the header, the chips and the active scene's magnets
          const act = mags.filter((_, k) => magScene[k] < 0 || magScene[k] === S.active)
          const rects = act.map((m) => m.getBoundingClientRect())
          const er = S.active === 0 ? eye.getBoundingClientRect() : ({ width: 0 } as DOMRect)
          const rr = root.getBoundingClientRect()
          ptr.dx += (ptr.x - ptr.dx) * 0.18
          ptr.dy += (ptr.y - ptr.dy) * 0.18
          // the size container is the dot's containing block, so place it in frame coordinates
          dot.style.transform = "translate3d(" + (ptr.dx - rr.left) + "px," + (ptr.dy - rr.top) + "px,0)"
          act.forEach((m, k) => {
            const r = rects[k]
            const cxm = r.left + r.width / 2
            const cym = r.top + r.height / 2
            const reach = Math.max(r.width, r.height) * 0.9 + 30
            const ox = ptr.x - cxm
            const oy = ptr.y - cym
            const inside = Math.abs(ox) < reach && Math.abs(oy) < reach
            const cur = (m as HTMLElement & { _m?: number[] })._m ?? [0, 0]
            const tx = inside ? ox * 0.28 : 0
            const ty = inside ? oy * 0.28 : 0
            cur[0] += (tx - cur[0]) * 0.12
            cur[1] += (ty - cur[1]) * 0.12
            ;(m as HTMLElement & { _m?: number[] })._m = cur
            m.style.translate = cur[0].toFixed(2) + "px " + cur[1].toFixed(2) + "px"
          })
          if (er.width) {
            const ex = ptr.x - (er.left + er.width / 2)
            const ey = ptr.y - (er.top + er.height / 2)
            const d = Math.hypot(ex, ey) || 1
            const k = Math.min(1, d / 300) * 8
            iris.setAttribute("transform", "translate(" + ((ex / d) * k).toFixed(2) + " " + ((ey / d) * k * 0.6).toFixed(2) + ")")
          }
          if (proofActive()) {
            ptr.bx += (ptr.x - ptr.bx) * 0.04
            ptr.by += (ptr.y - ptr.by) * 0.04
            if (Math.abs(ptr.x - ptr.bx) < 0.3 && Math.abs(ptr.y - ptr.by) < 0.3) (ptr.bx = ptr.x), (ptr.by = ptr.y)
            blob.style.transform = "translate3d(" + (ptr.bx - rr.left) + "px," + (ptr.by - rr.top) + "px,0)"
          }
        }
        raf2 = requestAnimationFrame(live)
      }
      if (deck) raf2 = requestAnimationFrame(live)
      cleanups.push(() => cancelAnimationFrame(raf2))

      // Bubbles rising behind the cube, drawn only while that scene is on screen.
      {
        const cv = q<HTMLCanvasElement>(".or-bubbles")
        const g = cv.getContext("2d")!
        const cols = ["#7c8cff", "#f2c86b", "#c39ad6", "#7fd3b4"]
        const count = deck ? 30 : 10
        let parts: { x: number; y: number; r: number; v: number; c: string }[] = []
        const size = () => {
          const dpr = Math.min(2, window.devicePixelRatio)
          cv.width = cv.clientWidth * dpr
          cv.height = cv.clientHeight * dpr
          g.setTransform(dpr, 0, 0, dpr, 0, 0)
          const w = cv.clientWidth
          const h = cv.clientHeight
          parts = Array.from({ length: count }, (_, k) => ({ x: Math.random() * w, y: h * (0.2 + Math.random()), r: 2.5 + Math.random() * 3.5, v: 0.4 + Math.random() * 1.2, c: cols[k % cols.length] }))
        }
        let raf3 = 0
        let seen = !deck
        const io = new IntersectionObserver((es) => (seen = es[0].isIntersecting))
        if (!deck) io.observe(cv)
        const draw = () => {
          raf3 = requestAnimationFrame(draw)
          if (reduced || (deck ? S.active !== 6 : !seen)) return
          const w = cv.clientWidth
          const h = cv.clientHeight
          g.clearRect(0, 0, w, h)
          for (const p of parts) {
            p.y -= p.v
            if (p.y + p.r < 0) p.y = h + 40
            g.beginPath()
            g.arc(p.x, p.y, p.r, 0, Math.PI * 2)
            g.fillStyle = p.c
            g.fill()
          }
        }
        size()
        raf3 = requestAnimationFrame(draw)
        const ro = new ResizeObserver(size)
        ro.observe(cv)
        cleanups.push(() => (cancelAnimationFrame(raf3), ro.disconnect(), io.disconnect()))
      }

      ScrollTrigger.refresh()
    }, root)

    return () => {
      engine.current = null
      cleanups.forEach((f) => f())
      ctx.revert()
      root.classList.remove("or-live")
    }
  }, [mode, reduced, dark])

  React.useEffect(() => {
    rootRef.current?.classList.toggle("or-menu-open", menu)
  }, [menu])

  const nav = (i: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (menu) {
      engine.current?.jump(i)
      window.setTimeout(() => setMenu(false), mode === "deck" ? 500 : 0)
    } else engine.current?.jump(i)
  }
  const MENU = [
    { label: "About us", to: 1, panel: <span style={{ background: "#282643" }} /> },
    { label: "What we make", to: 2, panel: <img src={PX(29008324, 900)} alt="" /> },
    { label: "Our work", to: 5, panel: <img src={projects[0].img.replace(/w=\d+/, "w=900")} alt="" /> },
    { label: "Contact", to: 8, panel: <span style={{ background: "#c9ece4" }} /> },
  ]
  const quote = "Anyone can draw a square. Very few can make it feel like a place you want to stay."

  return (
    <div
      ref={rootRef}
      className={cx("or-root", mode === "stack" && "or-stack", reduced && "or-reduced", dark && "or-dark", className)}
      style={{ "--h": height } as React.CSSProperties}
      data-scene="home"
    >
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{CSS}</style>
      <div className="or-probe" aria-hidden="true" />

      <header className="or-header" data-tone="light">
        <nav className="or-rail" aria-label="Scene index">
          {SCENES.map((s, k) => (
            <button key={s.id} type="button" className={cx(k === 0 && "is-on")} aria-label={"Go to " + s.label} data-cursor="menu" onClick={() => engine.current?.jump(k)}>
              <i />
              <span>{String(k + 1).padStart(2, "0") + " " + s.label}</span>
            </button>
          ))}
        </nav>
        <a href="#home" className="or-logo or-rl" data-cursor="nav" onClick={nav(0)} aria-label={brand + " home"}>
          <Mark className="or-logo-m" />
          <span>{brand.toLowerCase()}</span>
        </a>
        <nav className="or-nav" aria-label="Scenes">
          {[
            ["Home", 0],
            ["About", 1],
            ["Work", 5],
            ["Contact", 8],
          ].map(([l, i]) => (
            <a key={l} href={"#" + SCENES[i as number].id} className="or-rl" data-cursor="nav" onClick={nav(i as number)}>
              <Roll>{l as string}</Roll>
            </a>
          ))}
        </nav>
        <div className="or-head-r">
          <a href="#contact" className="or-talk or-rl" data-mag="" data-cursor="nav" onClick={nav(8)}>
            <i />
            <Roll>Let's talk</Roll>
          </a>
          <button type="button" className={cx("or-burger", menu && "is-open")} data-mag="" data-cursor="menu" aria-expanded={menu} aria-controls="or-menu" onClick={() => setMenu((m) => !m)}>
            <span className="or-burger-t">
              <span>menu</span>
              <span>close</span>
            </span>
            <span className="or-burger-l" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </header>

      {/* 0 ── Home */}
      <section className="or-scene or-s-home" id="home" aria-label="Home">
        <div className="or-home">
          <h1 className="or-hero">
            <Spell text={headline} />
          </h1>
          <div className="or-home-meta" data-rise="">
            <span className="or-rate">
              <Mark className="or-rate-m" />
              <span>
                <Stars />
                <small>4.9 from 38 client reviews</small>
              </span>
            </span>
            <p className="or-services">Brand systems / Product design / Websites / Motion / 3D / Design systems</p>
            <a className="or-deck-pill or-rl" href="#work" data-mag="" data-cursor="nav" onClick={nav(5)}>
              <Roll>Studio deck</Roll>
            </a>
          </div>
          <div className="or-eye-wrap">
            <Eye />
          </div>
        </div>
        <div className="or-reel-track">
          <div className="or-reel">
            <div className="or-reel-mask">
              <div className="or-reel-in">
                <Clip src={REEL} />
              </div>
              <span className="or-reel-cap">Showreel 2026 — 01:12</span>
              <button
                type="button"
                className="or-play"
                data-mag=""
                data-cursor="button"
                aria-label="Pause or play the showreel"
                onClick={(e) => {
                  const v = (e.currentTarget.parentElement as HTMLElement).querySelector("video")!
                  if (v.paused) v.play()
                  else v.pause()
                  e.currentTarget.classList.toggle("is-paused", v.paused)
                }}
              >
                <i />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 1 ── About */}
      <section className="or-scene or-s-about" id="about" aria-label="About">
        <div className="or-track or-about-track">
          <div className="or-stage">
            <div className="or-about-row">
              <h2 className="or-about-h">
                <Spell text={"What is " + brand + "?"} />
              </h2>
              {CARDS.map((c, i) => (
                <article key={c.title} className="or-card" style={{ background: c.tint }} data-rise="">
                  <svg className="or-card-rings" viewBox="0 0 600 600" aria-hidden="true">
                    <circle cx="160" cy="180" r="290" />
                    <circle cx="430" cy="110" r="290" />
                  </svg>
                  <div className="or-card-pill">
                    <Clip src={c.clip} />
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                  <span className="or-num" aria-hidden="true">
                    0{i + 1}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2 ── What we make */}
      <section className="or-scene or-s-make" id="make" aria-label="What we make">
        <div className="or-track or-make-track">
          <div className="or-stage or-make">
            <div className="or-make-light" aria-hidden="true">
              <span className="or-grid" />
            </div>
            <h2 className="or-make-word">
              <Spell text="We make" />
            </h2>
            <div className="or-mock" aria-hidden="true">
              <div className="or-mock-in">
                <div className="or-m-top">
                  <Mark className="or-m-logo" />
                  <span className="or-m-tab is-on">Projects</span>
                  <span className="or-m-tab">Planning</span>
                  <span className="or-m-tab">Calendar</span>
                  <span className="or-m-search">Search tasks</span>
                  <span className="or-m-faces">
                    {AVATARS.slice(0, 4).map((a) => (
                      <img key={a} src={PX(a, 80, 80)} alt="" />
                    ))}
                  </span>
                  <span className="or-m-new">+ New task</span>
                </div>
                <div className="or-m-side">
                  {[0, 1, 2, 3, 4].map((k) => (
                    <i key={k} className={cx(k === 1 && "is-on")} />
                  ))}
                </div>
                <div className="or-m-stats">
                  {[
                    ["In review", "12", "#7c8cff"],
                    ["Shipped this month", "48", "#3fbf8f"],
                    ["Team focus", "86%", "#f2b84b"],
                  ].map(([a, b, c]) => (
                    <div key={a} className="or-m-stat">
                      <small>{a}</small>
                      <b>{b}</b>
                      <span style={{ background: c }} />
                    </div>
                  ))}
                </div>
                <div className="or-m-title">
                  <small>Tidepool / Spring launch</small>
                  <b>Today</b>
                </div>
                {[
                  ["Backlog", "#9a9aa3", ["Onboarding copy", "Empty states", "Icon audit"]],
                  ["In progress", "#7c8cff", []],
                  ["Done", "#3fbf8f", ["Color tokens", "Pricing page"]],
                ].map(([t, c, items], k) => (
                  <div key={t as string} className={"or-m-col or-m-col" + k}>
                    <div className="or-m-colh">
                      <i style={{ background: c as string }} />
                      {t as string}
                    </div>
                    {k === 1 ? (
                      <div className="or-m-card or-m-card-big">
                        <b>Launch film</b>
                        <small>Motion · 3D · due Friday</small>
                        <div className="or-slot">
                          <Clip src={MAKE} />
                        </div>
                      </div>
                    ) : (
                      (items as string[]).map((it, j) => (
                        <div key={it} className="or-m-card">
                          <b>{it}</b>
                          <small>{["Brand", "Product", "Web"][j % 3]} · {j + 2} comments</small>
                          <span className="or-m-bar">
                            <span style={{ width: 30 + j * 25 + "%", background: c as string }} />
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
              <div className="or-skel">
                <i style={{ left: "5.5%", top: "4%", width: "30%", height: "6%" }} />
                <i style={{ left: "70%", top: "4%", width: "24%", height: "6%" }} />
                {[0, 1, 2].map((k) => (
                  <i key={"s" + k} style={{ left: 8.3 + k * 30.3 + "%", top: "15%", width: "28%", height: "15%" }} />
                ))}
                <i style={{ left: "8.3%", top: "35%", width: "22%", height: "6%" }} />
                {[8.3, 34.1, 67.4].map((l, k) => (
                  <i key={"c" + k} style={{ left: l + "%", top: "47%", width: k === 1 ? "31.8%" : "24%", height: "48%" }} />
                ))}
              </div>
              <span className="or-notch" />
            </div>
            <div className="or-make-media" aria-hidden="true">
              <Clip src={MAKE} />
            </div>
            {CURSORS.map((c) => (
              <span key={c.name} className="or-cur" style={{ "--c": c.c } as React.CSSProperties} aria-hidden="true">
                <svg viewBox="0 0 16 18">
                  <path d="M1 1l13 6.5-5.6 1.6L5.8 16Z" />
                </svg>
                <b>{c.name}</b>
              </span>
            ))}
            <div className="or-tag" aria-live="polite">
              {TAGS.map((t) => (
                <span key={t} className="or-tag-l">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3 ── People */}
      <section className="or-scene or-s-people" id="people" aria-label="People">
        <div className="or-track or-people-track">
          <div className="or-stage or-people">
            {[PX(29008324, 700), PX(12932574, 700), PX(4464884, 700)].map((src, k) => (
              <img key={src} className={"or-fly or-fly" + k} src={src} alt="" aria-hidden="true" />
            ))}
            <h2 className="or-people-h">
              <span className="or-sr">Every designer here was chosen from several hundred others.</span>
              <span className="or-pl" aria-hidden="true">
                <Spell text="Every designer here" hidden />
              </span>
              <span className="or-pl or-hi" aria-hidden="true">
                <Spell text="was chosen from" hidden />
              </span>
              <span className="or-pl" aria-hidden="true">
                <Spell text="several" hidden />
                <span className="or-gap">
                  <span className="or-ava">
                    {AVATARS.map((a) => (
                      <img key={a} src={PX(a, 120, 120)} alt="" />
                    ))}
                    <b>+40</b>
                  </span>
                  <span className="or-gap-word">hundred</span>
                </span>
                <Spell text="others" hidden />
              </span>
            </h2>
            <span className="or-swallow" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* 4 ── Quote */}
      <section className="or-scene or-s-quote" id="quote" aria-label="What we believe">
        <div className="or-track or-quote-track">
          <div className="or-stage or-quote">
            <span className="or-ring-c or-ring-c0" aria-hidden="true" />
            <span className="or-ring-c or-ring-c1" aria-hidden="true" />
            <span className="or-ring-c or-ring-c2" aria-hidden="true" />
            <span className="or-qmark" aria-hidden="true" data-rise="">
              “
            </span>
            <blockquote className="or-q">
              <Spell text={quote} />
            </blockquote>
            <span className="or-qbar" aria-hidden="true">
              <i />
            </span>
            <p className="or-qcap" data-rise="">
              Ines Varga, founder. Every brief starts with this sentence pinned above the table.
            </p>
          </div>
        </div>
      </section>

      {/* 5 ── Work */}
      <section className="or-scene or-s-work" id="work" aria-label="Selected work">
        <div className="or-track or-work-track">
          <div className="or-stage or-work">
            <p className="or-work-k" data-rise="">
              Selected work, 2024 – 2026
            </p>
            <div data-rise="" className="or-car-wrap">
              <Carousel projects={projects} />
            </div>
            <div className="or-hand" aria-hidden="true">
              <Clip src={VID(15863511, "sd_960_540")} />
            </div>
            <svg className="or-thread" viewBox="0 0 1728 507" preserveAspectRatio="none" aria-hidden="true">
              <path pathLength={1} d="M-20 420C220 380 300 120 520 150s210 300 430 260 160-330 380-300 260 240 420 180" />
            </svg>
            <span className="or-slit" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* 6 ── Proof */}
      <section className="or-scene or-s-proof" id="proof" aria-label="Who we work with">
        <div className="or-track or-proof-track">
          <div className="or-stage or-proof">
            <canvas className="or-bubbles" aria-hidden="true" />
            <span className="or-blob" aria-hidden="true" />
            <div className="or-cube-wrap">
              <div className="or-cube">
                <div className="or-face or-face-a">
                  <span className="or-sr">We're trusted by 140 teams</span>
                  {Array.from({ length: 13 }, (_, k) => (
                    <span key={k} aria-hidden="true" className={cx(k === 0 && "is-hi")}>
                      We're trusted by <em>140 teams</em>
                    </span>
                  ))}
                </div>
                <ul className="or-face or-face-b">
                  {PROOF.map((p) => (
                    <li key={p}>
                      <a href="#work" className="or-rl" data-cursor="nav" onClick={nav(5)}>
                        <Roll>{p}</Roll>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 ── Rope */}
      <section className="or-scene or-s-rope" id="process" aria-label="How we work">
        <div className="or-track or-rope-track">
          <div className="or-stage or-rope">
            <span className="or-rope-fill" aria-hidden="true" />
            <p className="or-rope-line" data-rise="">
              Our studio is a calm room where knotty problems come undone.
            </p>
            <div className="or-squircle">
              <canvas className="or-rope-c" aria-hidden="true" />
              <canvas className="or-rope-seq" aria-hidden="true" />
              <h2 className="or-idea">
                <Spell text="Have a knotty idea?" />
              </h2>
              <div className="or-marq" aria-label="Clients">
                <div>
                  {[...CLIENTS, ...CLIENTS].map((c, k) => (
                    <span key={k} aria-hidden={k >= CLIENTS.length}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8 ── Contact + footer */}
      <section className="or-scene or-s-contact" id="contact" aria-label="Contact">
        <div className="or-contact">
          <div className="or-contact-l">
            <h2 className="or-contact-h" data-rise="">
              Have a <img src={PX(29852852, 120, 120)} alt="" className="or-contact-face" /> knotty idea?
              <br />
              Tell us about it.
            </h2>
            <div className="or-trust" data-rise="">
              <small>Clients trust us</small>
              <span className="or-rate">
                <Mark className="or-rate-m" />
                <span>
                  <Stars />
                  <small>4.9 from 38 client reviews</small>
                </span>
              </span>
            </div>
            <div className="or-follow" data-rise="">
              <small>Follow us</small>
              <span>
                {["Instagram", "Dribbble", "LinkedIn", "Read.cv"].map((s) => (
                  <a key={s} href="#contact" className="or-social" data-cursor="nav" aria-label={s}>
                    {s.slice(0, 2)}
                  </a>
                ))}
              </span>
            </div>
            <button type="button" className="or-sheet-open" data-rise="" onClick={() => setSheet(true)}>
              Start a brief
            </button>
          </div>
          <div className={cx("or-sheet", sheet && "is-open")}>
            <ContactForm email={email} onClose={mode === "stack" ? () => setSheet(false) : undefined} />
          </div>
        </div>
        <footer className="or-foot">
          <div className="or-foot-big" aria-hidden="true">
            <Mark className="or-foot-m" />
            {brand.toLowerCase()}
          </div>
          <div className="or-foot-row">
            <address>
              {brand} Studio
              <br />
              Rua das Flores 14, Porto
            </address>
            <a className="or-under" href={"mailto:" + email} data-cursor="nav">
              {email}
            </a>
            <a className="or-deck-pill or-rl" href="#work" data-cursor="nav" onClick={nav(5)}>
              <Roll>Studio deck</Roll>
            </a>
            <small>© 2026 {brand} Studio · Privacy</small>
          </div>
        </footer>
      </section>

      {/* overlays */}
      <div className="or-flash" aria-hidden="true">
        <div className="or-flash-in">
          {Array.from({ length: 7 }, (_, k) => (
            <div key={k} className="or-flash-row">
              {"WE MAKE ".repeat(10)}
            </div>
          ))}
        </div>
      </div>
      <div className="or-jump" aria-hidden="true">
        <span className="or-jump-disc" />
        <svg className="or-jump-logo" viewBox="0 0 300 90">
          <path d="M14 82V42a28 28 0 0 1 56 0v40Z" pathLength={420} />
          <path d="M42 18v64M14 50h56" pathLength={420} />
          <text x="86" y="78" pathLength={420}>
            {brand.toLowerCase()}
          </text>
        </svg>
      </div>

      <div id="or-menu" className={cx("or-menu", menu && "is-open")} role="dialog" aria-modal="false" aria-label="Menu" aria-hidden={!menu}>
        <div className="or-menu-social">
          <small>Social</small>
          {["Instagram", "Dribbble", "Behance", "LinkedIn", "Read.cv"].map((s) => (
            <a key={s} href="#contact" className="or-rl" data-cursor="nav" tabIndex={menu ? 0 : -1}>
              <Roll>{s}</Roll>
            </a>
          ))}
          <small className="or-menu-mail">Get in touch</small>
          <a href={"mailto:" + email} className="or-under" tabIndex={menu ? 0 : -1}>
            {email}
          </a>
        </div>
        <div className="or-menu-prev" aria-hidden="true">
          {MENU.map((m, k) => (
            <span key={m.label} className={cx("or-menu-p", hover === k && "is-on")}>
              {m.panel}
            </span>
          ))}
        </div>
        <nav className="or-menu-links" aria-label="Menu">
          <small>Menu</small>
          {MENU.map((m, k) => (
            <a
              key={m.label}
              href={"#" + SCENES[m.to].id}
              className="or-rl"
              data-cursor="nav"
              tabIndex={menu ? 0 : -1}
              onMouseEnter={() => setHover(k)}
              onFocus={() => setHover(k)}
              onClick={nav(m.to)}
            >
              <Roll>{m.label}</Roll>
            </a>
          ))}
        </nav>
      </div>

      <div className="or-float">
        <a href={"mailto:" + email} className="or-metal or-metal-o" data-cursor="nav" aria-label={"Email " + email}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18v12H3z M3 7l9 6 9-6" />
          </svg>
        </a>
        <a href="#contact" className="or-metal or-metal-o" data-cursor="nav" aria-label="Chat with the studio" onClick={nav(8)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5h16v11H9l-5 4z" />
          </svg>
        </a>
        <a href="#contact" className="or-metal or-metal-p" data-cursor="nav" onClick={nav(8)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5" />
          </svg>
          Book a call
        </a>
      </div>
      <span className="or-dot" aria-hidden="true" />
    </div>
  )
}

// ---- the rope: a lit 3D tube whose knot comes undone with scroll ------------------------
function mountRope(canvas: HTMLCanvasElement, dpr: number) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(dpr)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = env
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
  camera.position.set(0, 0.4, 15)
  camera.lookAt(0, 0, 0)
  const key = new THREE.DirectionalLight(0xfff2e6, 2.2)
  key.position.set(-4, 6, 8)
  // a soft contact shadow on the squircle's back wall is what sells the rope as an object
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  key.castShadow = true
  key.shadow.mapSize.set(dpr > 1 ? 2048 : 1024, dpr > 1 ? 2048 : 1024)
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 5, bottom: -5, near: 1, far: 30 })
  key.shadow.radius = 6
  key.shadow.bias = -0.0005
  scene.add(key)
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.ShadowMaterial({ color: 0x2a1f5c, opacity: 0.22 }))
  wall.position.z = -1.4
  wall.receiveShadow = true
  scene.add(wall)
  const rim = new THREE.DirectionalLight(0xc8c2ff, 1.6)
  rim.position.set(6, -2, -4)
  scene.add(rim)

  // Twisted-strand normal map, drawn once: diagonal grooves that repeat along the rope.
  const tc = document.createElement("canvas")
  tc.width = 128
  tc.height = 64
  const g = tc.getContext("2d")!
  const img = g.createImageData(128, 64)
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 128; x++) {
      const ph = ((x + y * 2) / 32) * Math.PI * 2
      const fine = Math.sin(((x * 3 - y) / 9) * Math.PI) * 0.18
      const nx = Math.cos(ph) * 0.55 + fine
      const ny = Math.cos(ph) * 0.35
      const o = (y * 128 + x) * 4
      img.data[o] = 128 + nx * 127
      img.data[o + 1] = 128 + ny * 127
      img.data[o + 2] = 235
      img.data[o + 3] = 255
    }
  g.putImageData(img, 0, 0)
  const normal = new THREE.CanvasTexture(tc)
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping
  normal.repeat.set(70, 1)
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x4c55e0,
    roughness: 0.58,
    sheen: 1,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(0xb9bcff),
    normalMap: normal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    envMapIntensity: 0.9,
  })
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat)
  mesh.castShadow = true
  scene.add(mesh)

  // An overhand knot: an opened trefoil, with tails running out to both sides.
  const knot: THREE.Vector3[] = []
  const M = 56
  for (let k = 0; k <= M; k++) {
    const t = Math.PI + 0.42 + (k / M) * (2 * Math.PI - 0.84)
    knot.push(new THREE.Vector3(Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t) + 1.2, -Math.sin(3 * t) * 1.1).multiplyScalar(0.42))
  }
  let L = 9
  const base = (span: number) => {
    const a = knot[0].clone()
    const b = knot[knot.length - 1].clone()
    const left = [new THREE.Vector3(-span, -0.35, 0.5), new THREE.Vector3(-span * 0.55, -0.25, 0.45), new THREE.Vector3(-1.6, b.y - 0.1, 0.4)]
    const right = [new THREE.Vector3(1.6, a.y - 0.1, -0.4), new THREE.Vector3(span * 0.55, -0.25, -0.45), new THREE.Vector3(span, -0.35, -0.5)]
    // the right tail leaves from the knot's first point, the left tail enters at its last
    const pts = [...left, ...[...knot].reverse(), ...right]
    const lens = [0]
    for (let k = 1; k < pts.length; k++) lens.push(lens[k - 1] + pts[k].distanceTo(pts[k - 1]))
    const total = lens[lens.length - 1]
    const straight = pts.map((_, k) => new THREE.Vector3(-span + (2 * span * lens[k]) / total, -0.3, 0))
    return { pts, straight, s: lens.map((l) => l / total) }
  }
  let shape = base(L)
  let p = -1
  const build = (v: number) => {
    const pts = shape.pts.map((a, k) => {
      const s = shape.s[k]
      const mid = 1 - Math.abs(2 * s - 1)
      const local = Math.min(1, Math.max(0, (v - mid * 0.35) / 0.65))
      const e = local * local * (3 - 2 * local)
      const o = a.clone().lerp(shape.straight[k], e)
      o.z += Math.sin(Math.PI * e) * 0.9 * mid
      return o
    })
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "centripetal"), dpr > 1 ? 420 : 240, 0.17, dpr > 1 ? 22 : 14, false)
    mesh.geometry.dispose()
    mesh.geometry = geo
  }
  const render = () => renderer.render(scene, camera)
  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const halfW = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect
    const span = halfW * 1.15
    if (Math.abs(span - L) > 0.05) {
      L = span
      shape = base(L)
      want = Math.max(0, p)
      p = -1
      flush()
    } else render()
  }
  // scroll can report several values a frame; rebuild the tube at most once per frame
  let want = 0
  let raf = 0
  const flush = () => {
    raf = 0
    if (Math.abs(want - p) < 0.002) return
    p = want
    mesh.rotation.y = -0.25 + p * 0.25
    build(p)
    render()
  }
  const set = (v: number) => {
    want = v
    if (!raf) raf = requestAnimationFrame(flush)
  }
  // Bake the whole un-knotting into a frame sequence: render each state once, keep only
  // the horizontal band the rope lives in, then the GL canvas can sit idle while scroll scrubs bitmaps.
  // shortcut: frames are baked for the frame's aspect at bake time and only rescaled after a resize.
  const bake = async (n: number) => {
    const cw = canvas.width
    const ch = canvas.height
    const band = [0.16, 0.84]
    const sy = Math.round(ch * band[0])
    const sh = Math.round(ch * (band[1] - band[0]))
    const k = Math.min(1, 1280 / cw)
    const frames: Blob[] = []
    const tmp = document.createElement("canvas")
    tmp.width = Math.round(cw * k)
    tmp.height = Math.round(sh * k)
    const tg = tmp.getContext("2d")!
    for (let f = 0; f < n; f++) {
      const v = f / (n - 1)
      mesh.rotation.y = -0.25 + v * 0.25
      build(v)
      render()
      // createImageBitmap snapshots the drawing buffer synchronously, before it can be cleared
      const bm = await createImageBitmap(canvas, 0, sy, cw, sh, { resizeWidth: tmp.width, resizeHeight: tmp.height, resizeQuality: "high" })
      tg.clearRect(0, 0, tmp.width, tmp.height)
      tg.drawImage(bm, 0, 0)
      bm.close()
      // ~60 KB of WebP per frame instead of ~3 MB of raw bitmap; decoded on demand while scrubbing
      frames.push(await new Promise<Blob>((r, j) => tmp.toBlob((b) => (b ? r(b) : j(new Error("toBlob"))), "image/webp", 0.88)))
      if (f % 2) await new Promise((r) => requestAnimationFrame(r))
    }
    p = -1
    return { frames, band }
  }
  resize()
  want = 0
  flush()
  return {
    set,
    bake,
    resize,
    dispose: () => {
      cancelAnimationFrame(raf)
      wall.geometry.dispose()
      ;(wall.material as THREE.Material).dispose()
      mesh.geometry.dispose()
      mat.dispose()
      normal.dispose()
      env.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}

// R is the zoom unit: N R → calc(N * var(--r)). The deck sets --r so a 90 x 56.25 R
// composition fills any frame (the layout zooms, never reflows); the stack sets it
// from the width.
const rr = (s: string) => s.replace(/(-?\d*\.?\d+)R\b/g, "calc($1*var(--r))")

const CSS = rr(`
.or-root{--or-paper:#ffffff;--or-warm:#f6f3f1;--or-mint:#e9f6f1;--or-lilac:#dcd3f2;--or-lilac-soft:#f1ecf6;--or-blush:#f7c3b4;--or-ink:#0b0b0c;--or-mute:#8b8a90;--or-line:#e6e4e2;--or-night:#050505;--or-hi:#ffffff;--or-blush-soft:#fbf0ec;
  --r:min(calc(100cqw / 90),calc(100cqh / 56.25));
  position:relative;width:100%;height:var(--h);overflow:hidden;container-type:size;isolation:isolate;
  background:var(--or-paper);color:var(--or-ink);font-family:"Inter Tight",ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em;-webkit-font-smoothing:antialiased;cursor:auto}
.or-root.or-dark{--or-paper:#101012;--or-warm:#17161a;--or-mint:#10211d;--or-lilac:#2a2442;--or-lilac-soft:#1c1926;--or-ink:#f2f0ec;--or-mute:#8f8d96;--or-line:#2a2a2f;--or-hi:#b9a9ff;--or-blush-soft:#1c1617}
.or-root.or-stack{height:auto;overflow:visible;overflow-x:clip;container-type:normal;--r:min(calc(100vw / 24.375),17px)}
.or-root *,.or-root *::before,.or-root *::after{box-sizing:border-box}
.or-root img,.or-root video,.or-root canvas{max-width:none;display:block}
.or-root a{color:inherit;text-decoration:none}
.or-root button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.or-root :focus-visible{outline:2px solid #7c8cff;outline-offset:3px;border-radius:6px}
.or-probe{position:absolute;width:1R;height:0;visibility:hidden}
.or-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.or-spell .or-w{display:inline-block;white-space:nowrap}
.or-spell .or-l{display:inline-block}
.or-vid{width:100%;height:100%;object-fit:cover}

/* rolling text */
.or-roll{position:relative;display:inline-flex;overflow:hidden;vertical-align:top;padding-bottom:.08em}
.or-roll-s{opacity:0}
.or-roll-t{position:absolute;inset:0}
.or-roll-t>span{position:absolute;left:0;top:0;white-space:nowrap;transform-origin:0 100%;transition:transform .5s cubic-bezier(.3,.7,.2,1)}
.or-roll-t>span:last-child{transform:translateY(105%) rotate(8deg)}
.or-rl:hover .or-roll-t>span:first-child,.or-rl:focus-visible .or-roll-t>span:first-child{transform:translateY(-110%) rotate(-8deg)}
.or-rl:hover .or-roll-t>span:last-child,.or-rl:focus-visible .or-roll-t>span:last-child{transform:none}

/* header */
.or-header{position:absolute;z-index:40;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:2.6R 3.1R .8R;--hc:var(--or-ink);color:var(--hc);transition:color .3s;pointer-events:none}
.or-header[data-tone=dark]{--hc:#ffffff}
.or-header>*{pointer-events:auto}
.or-logo{display:flex;align-items:center;gap:.55R;font-weight:700;font-size:2R;letter-spacing:-.06em}
.or-logo-m{width:1.55R;height:1.8R}
.or-nav{display:flex;gap:4.2R;font-size:1.15R;position:absolute;left:50%;transform:translateX(-50%)}
.or-head-r{display:flex;align-items:center;gap:1.6R}
.or-talk{display:inline-flex;align-items:center;gap:.5R;border:.12R solid var(--hc);border-radius:2R;padding:.55R 1.05R;font-size:.95R;font-weight:500;transition:border-color .3s}
.or-talk i{width:.42R;height:.42R;border-radius:50%;background:#7fd858;box-shadow:0 0 0 .2R rgb(127 216 88 / .2)}
.or-burger{display:inline-flex;align-items:center;gap:.7R;font-size:1.05R;font-weight:500}
.or-burger-t{display:inline-flex;flex-direction:column;height:1.3R;overflow:hidden;line-height:1.3R}
.or-burger-t>span{transition:transform .3s ease}
.or-burger.is-open .or-burger-t>span{transform:translateY(-100%)}
.or-burger-l{position:relative;width:1.95R;height:.9R}
.or-burger-l i{position:absolute;left:0;right:0;height:.13R;background:currentColor;top:.15R;transition:transform .3s ease,width .3s}
.or-burger-l i+i{top:.6R}
.or-burger.is-open .or-burger-l i{transform:translateY(.22R) rotate(45deg)}
.or-burger.is-open .or-burger-l i+i{transform:translateY(-.23R) rotate(-45deg)}
.or-menu-open .or-header{--hc:#0b0b0c;color:#0b0b0c}

/* scenes */
.or-scene{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain;background:var(--or-paper)}
.or-scene::-webkit-scrollbar{display:none}
.or-stack .or-scene{position:relative;inset:auto;overflow:visible;overflow-x:clip}
.or-track{position:relative}
.or-stage{position:sticky;top:0;height:var(--h);overflow:hidden}

/* 0 home */
.or-home{position:relative;min-height:calc(var(--h) - 13R);padding:15R 9.375R 0}
.or-hero{font-family:"Bricolage Grotesque","Inter Tight",sans-serif;font-weight:500;font-size:3.45R;line-height:1.14;letter-spacing:-.035em;max-width:58R;margin:0;font-variation-settings:"opsz" 60}
.or-home-meta{display:flex;align-items:flex-start;gap:4R;margin-top:2.4R}
.or-rate{display:inline-flex;align-items:center;gap:.7R}
.or-rate-m{width:2.2R;height:2.5R;color:var(--or-ink)}
.or-rate>span{display:flex;flex-direction:column;gap:.15R}
.or-rate small{font-size:.85R;color:var(--or-ink)}
.or-stars{display:inline-flex;gap:.1R}
.or-stars svg{width:.95R;height:.95R;fill:#f2c84b}
.or-services{margin:0;max-width:24R;font-size:1R;line-height:1.3;color:var(--or-mute);text-transform:uppercase;letter-spacing:-.01em}
.or-deck-pill{margin-left:auto;align-self:center;display:inline-flex;background:var(--or-line);border-radius:3R;padding:.55R 1.1R;font-size:1.05R;letter-spacing:-.03em;transition:opacity .3s}
.or-deck-pill:hover{opacity:.8}
.or-eye-wrap{position:absolute;right:9.375R;top:13R;width:10.5R;height:10.5R}
.or-eye{width:100%;height:100%;overflow:visible}
.or-eye-ring{transform-origin:70px 70px;animation:or-spin 12s linear infinite}
.or-eye-ring text{font:700 10.6px "Inter Tight",sans-serif;letter-spacing:.14em;fill:#9d8ce0}
.or-lash path{stroke:#17171a;stroke-width:2.2;stroke-linecap:round;fill:none;transition:opacity .3s}
.or-lid{fill:#ffeeee;transition:transform .5s ease}
.or-lid-t{transform-origin:70px 42px;transform:scaleY(0)}
.or-lid-b{transform-origin:70px 98px;transform:scaleY(0)}
.or-eye.is-asleep .or-lid{transform:scaleY(1)}
.or-eye.is-asleep .or-lash{opacity:.25}
@keyframes or-spin{to{transform:rotate(360deg)}}
.or-reel-track{position:relative;height:calc(var(--h) * 1.5)}
.or-reel{position:sticky;top:0;height:var(--h)}
.or-reel-mask{position:absolute;inset:0;clip-path:inset(0px 9.375R 16R 9.375R round 1.6R)}
.or-reel-in{position:absolute;inset:0;background:#c7d3e6}
.or-reel-cap{position:absolute;left:11R;bottom:20R;color:#fff;font-size:1R;opacity:.9}
.or-play{position:absolute;left:50%;top:calc(var(--h) / 2 - 8R);width:5.4R;height:5.4R;margin-left:-2.7R;border-radius:50%;background:#fff;display:grid;place-items:center}
.or-play i{width:0;height:0;border-left:.75R solid #000;border-top:.45R solid transparent;border-bottom:.45R solid transparent;margin-left:.2R}
.or-play.is-paused i{border-left-color:#000}
.or-play:not(.is-paused) i{width:.75R;height:.95R;border:0;border-left:.25R solid #000;border-right:.25R solid #000;margin:0}

/* 1 about */
.or-about-row{position:absolute;left:0;top:8.6R;bottom:1.4R;display:flex;gap:1.5R;padding-left:9.375R;padding-right:4R;will-change:transform}
.or-about-h{flex:none;width:30R;align-self:center;font-size:5.1R;font-weight:500;line-height:1.05;letter-spacing:-.05em;margin:0 0 6R}
.or-card{flex:none;position:relative;width:67.4R;height:100%;border-radius:3R;padding:4R 5R;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden}
.or-card-rings{position:absolute;inset:-6R auto auto -4R;width:52R;height:52R;fill:none;stroke:#d0cfd4;stroke-width:1;opacity:.75;pointer-events:none}
.or-dark .or-card-rings{stroke:#3a3a42}
.or-card-pill{position:absolute;top:2R;left:2R;width:32R;height:15R;border-radius:13.5R;overflow:hidden;background:#e9e3f2}
.or-card-pill video{transform:scale(1.1)}
.or-card h3{position:relative;font-size:5R;line-height:1.08;font-weight:500;letter-spacing:-.05em;margin:0 0 1.6R;max-width:46R}
.or-card p{position:relative;font-size:1.25R;line-height:1.3;color:var(--or-mute);max-width:32R;margin:0}
.or-num{position:absolute;right:4.4R;bottom:2.8R;font-size:5.6R;font-weight:500;color:transparent;-webkit-text-stroke:1px #c9c7cc;letter-spacing:-.04em}

/* 2 make */
.or-s-make,.or-make{background:var(--or-warm)}
.or-make-track{height:calc(var(--h) * 5)}
.or-make-light{position:absolute;inset:0;background:var(--or-paper);opacity:0}
.or-grid{position:absolute;inset:0;background-image:linear-gradient(var(--or-line) 1px,transparent 1px),linear-gradient(90deg,var(--or-line) 1px,transparent 1px);background-size:5.6R 5.6R;background-position:center}
.or-grid::after{content:"";position:absolute;left:0;right:0;top:50%;border-top:1px dashed #b9b6bd}
.or-make-word{position:absolute;left:9.375R;top:50%;margin:-4.5R 0 0;font-size:7.5R;font-weight:700;letter-spacing:-.05em;text-transform:uppercase;transform-origin:0 50%;white-space:nowrap}
.or-make-media{position:absolute;inset:0;clip-path:inset(0px 0px 0px 100%);z-index:3}
.or-mock{position:absolute;left:50%;top:calc((var(--h) - 38R) / 2 + .5R);width:66R;height:38R;transform:translateX(-50%);border-radius:2.25R;background:#141416;overflow:hidden;opacity:0;visibility:hidden;color:#f4f3f6;z-index:2;box-shadow:0 2R 5R rgb(20 20 30 / .18)}
.or-mock-in{position:absolute;left:50%;top:0;width:66R;height:38R;margin-left:-33R}
.or-mock-in small{color:#8d8c96;font-size:.72R}
.or-m-top{position:absolute;left:1.5R;right:1.5R;top:1.2R;height:2.6R;display:flex;align-items:center;gap:1.4R;font-size:.82R}
.or-m-logo{width:1.2R;height:1.4R;color:#fff}
.or-m-tab{color:#8d8c96}
.or-m-tab.is-on{color:#fff;background:#26262b;padding:.35R .8R;border-radius:1R}
.or-m-search{margin-left:auto;background:#1f1f23;color:#76757e;border-radius:1R;padding:.4R 4R .4R 1R}
.or-m-faces{display:flex}
.or-m-faces img{width:1.8R;height:1.8R;border-radius:50%;border:.15R solid #141416;margin-left:-.5R;object-fit:cover}
.or-m-new{background:#5a6cff;border-radius:1R;padding:.45R .9R;font-weight:600}
.or-m-side{position:absolute;left:1.5R;top:5.5R;display:flex;flex-direction:column;gap:1R}
.or-m-side i{width:2.4R;height:2.4R;border-radius:.8R;background:#1f1f23}
.or-m-side i.is-on{background:#5a6cff}
.or-m-stats{position:absolute;left:5.5R;right:1.5R;top:5.5R;height:6R;display:grid;grid-template-columns:repeat(3,1fr);gap:1R}
.or-m-stat{position:relative;background:#1c1c20;border-radius:1.2R;padding:1R 1.2R;display:flex;flex-direction:column;justify-content:space-between}
.or-m-stat b{font-size:2R;letter-spacing:-.04em}
.or-m-stat span{position:absolute;right:1.2R;bottom:1.1R;width:5R;height:.4R;border-radius:1R}
.or-m-title{position:absolute;left:5.5R;top:12.6R;display:flex;flex-direction:column}
.or-m-title b{font-size:2.6R;letter-spacing:-.05em;line-height:1.1}
.or-m-col{position:absolute;top:17.5R;bottom:1.2R;background:#1a1a1e;border-radius:1.4R;padding:1R;display:flex;flex-direction:column;gap:.8R}
.or-m-col0{left:5.5R;width:16R}
.or-m-col1{left:22.5R;width:21R}
.or-m-col2{left:44.5R;width:16R}
.or-m-colh{display:flex;align-items:center;gap:.5R;font-size:.85R;font-weight:600}
.or-m-colh i{width:.5R;height:.5R;border-radius:50%}
.or-m-card{background:#232328;border-radius:1R;padding:.9R 1R;display:flex;flex-direction:column;gap:.35R;font-size:.9R}
.or-m-card-big{flex:1;position:relative}
.or-m-bar{height:.3R;background:#2f2f35;border-radius:1R;overflow:hidden;margin-top:.3R}
.or-m-bar span{display:block;height:100%}
.or-slot{position:absolute;left:1R;right:1R;bottom:1R;height:10.5R;border-radius:1R;overflow:hidden}
.or-skel{position:absolute;inset:0;background:#141416}
.or-skel i{position:absolute;border-radius:1R;background:linear-gradient(90deg,#1f1f23,#2a2a2f,#1f1f23);background-size:200% 100%;animation:or-shim 1.4s linear infinite}
@keyframes or-shim{to{background-position:-200% 0}}
.or-notch{position:absolute;left:50%;top:.7R;width:6R;height:1.3R;margin-left:-3R;border-radius:1R;background:#000;opacity:0}
.or-cur{position:absolute;left:50%;top:calc(var(--h) / 2);z-index:4;display:flex;align-items:flex-start;gap:.1R;opacity:0;pointer-events:none}
.or-cur svg{width:1.3R;height:1.45R;fill:var(--c);stroke:#fff;stroke-width:1.2}
.or-cur b{margin-top:1.1R;background:var(--c);color:#fff;font-size:.72R;font-weight:600;padding:.15R .5R;border-radius:.5R}
.or-tag{position:absolute;left:50%;top:calc((var(--h) - 38R) / 2 + 39.7R);width:23.6R;height:4.4R;margin-left:-11.8R;border-radius:2.2R;background:#fff;color:#0b0b0c;box-shadow:0 1R 3R rgb(0 0 0 / .08);overflow:hidden;opacity:0;transform:scale(.5);z-index:5}
.or-tag-l{position:absolute;inset:0;display:grid;place-items:center;font-size:1.1R;font-weight:500;text-transform:uppercase;letter-spacing:-.01em;opacity:0}

/* 3 people */
.or-s-people,.or-people{background:var(--or-lilac)}
.or-people-track{height:calc(var(--h) * 4.5)}
.or-people-h{position:absolute;inset:0;margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:6R;line-height:8.2R;font-weight:700;letter-spacing:-.045em;text-transform:uppercase;text-align:center;z-index:2}
.or-pl{display:flex;align-items:center;white-space:nowrap}
.or-hi{color:var(--or-hi)}
.or-gap{position:relative;display:inline-flex;align-items:center;justify-content:center;height:6.4R;margin:0 .3em;width:0;overflow:visible}
.or-ava{position:absolute;left:0;top:50%;transform:translateY(-50%);display:flex;align-items:center;padding:.4R;border-radius:4R;background:rgb(255 255 255 / .9);opacity:0}
.or-ava>*{width:4.6R;height:4.6R;border-radius:50%;object-fit:cover;margin-left:-.8R;border:.2R solid #fff;flex:none;transform:scale(0)}
.or-ava>*:first-child{margin-left:0}
.or-ava b{display:grid;place-items:center;background:#17171a;color:#fff;font-size:1.3R;letter-spacing:0}
.or-gap-word{position:absolute;left:50%;top:50%;translate:-50% -50%;white-space:nowrap;opacity:0}
.or-fly{position:absolute;transform:translateY(calc(var(--h) * 1.2));width:24R;height:17R;object-fit:cover;border-radius:1.9R;box-shadow:0 2R 4R rgb(40 20 80 / .15);z-index:1}
.or-fly0{left:10R;top:10R}
.or-fly1{right:9R;top:4R;width:20R;height:24R}
.or-fly2{left:44R;top:22R;width:18R;height:14R}
.or-swallow{position:absolute;left:calc(100% - 4R);top:50%;width:calc(var(--h) * 4.6);height:calc(var(--h) * 4.6);margin:calc(var(--h) * -2.3) 0 0 calc(var(--h) * -2.3);border-radius:50%;background:var(--or-night);transform:scale(0);z-index:3}

/* 4 quote */
.or-s-quote,.or-quote,.or-s-work,.or-work,.or-s-rope,.or-rope{background:var(--or-night);color:#fff}
.or-quote-track{height:calc(var(--h) * 2.6)}
.or-qmark{position:absolute;left:8R;top:7R;font-family:"Bricolage Grotesque",serif;font-size:16R;line-height:1;color:#5f5f62}
.or-q{position:absolute;left:12R;top:15.5R;width:44R;margin:0;font-size:4.5R;line-height:1.14;letter-spacing:-.04em;color:#57575b}
.or-q .or-l{transition:color .25s}
.or-q .or-l.is-lit{color:#fff}
.or-ring-c{position:absolute;right:-6R;width:28.75R;height:28.75R;border-radius:50%;background:#121212}
.or-ring-c0{top:-14R}
.or-ring-c1{top:14R}
.or-ring-c2{top:42R}
.or-qbar{position:absolute;right:12R;top:20R;width:.25R;height:15.6R;background:#3c3c40;border-radius:1R;overflow:hidden}
.or-qbar i{position:absolute;inset:0;background:#fff;transform-origin:top;transform:scaleY(0)}
.or-qcap{position:absolute;right:5.5R;bottom:6R;width:20R;margin:0;font-size:.95R;line-height:1.35;color:#8b8a90;text-align:right}

/* 5 work */
.or-work-track{height:calc(var(--h) * 3)}
.or-work-k{position:absolute;left:9.375R;top:9R;margin:0;font-size:1R;color:#8b8a90}
.or-car-wrap{position:absolute;inset:0}
.or-car{position:absolute;inset:0;touch-action:pan-y;user-select:none}
.or-car-ring{position:absolute;left:50%;top:calc(var(--h) / 2 - 1R);width:0;height:0}
.or-car-card{position:absolute;left:-18.8R;top:-12.7R;width:37.6R;height:25.4R;margin:0;border-radius:1.4R;overflow:hidden;cursor:grab;transform:translateX(calc(var(--d) * 42R)) scale(calc(1 - min(1, max(var(--d), -1 * var(--d))) * .12));transition:transform .8s cubic-bezier(.6,0,.2,1),opacity .5s}
.or-car-card img{width:100%;height:100%;object-fit:cover;pointer-events:none;transform:scale(1.08);filter:brightness(.5) saturate(.7);transition:filter .8s ease,transform 1.2s cubic-bezier(.2,.7,.2,1)}
.or-car-card.is-on img{filter:none;transform:none}
.or-car-card::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgb(27 26 26 / 0) 40%,#1b1a1a)}
.or-car-meta{position:absolute;left:1.4R;right:1.4R;top:1.2R;display:flex;justify-content:space-between;z-index:1}
.or-car-meta span{border:1px solid rgb(255 255 255 / .55);border-radius:2R;padding:.3R .8R;font-size:.8R;backdrop-filter:blur(6px)}
.or-car-title{position:absolute;left:calc(50% - 21.8R);top:calc(var(--h) / 2 + 6.8R);margin:0;font-family:"Bricolage Grotesque",sans-serif;font-size:4.4R;line-height:1;font-weight:600;letter-spacing:-.04em;text-transform:uppercase;pointer-events:none;z-index:2}
.or-car-title .or-l{animation:or-up .5s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i) * 30ms)}
.or-car-foot{position:absolute;left:9.375R;bottom:3.4R;display:flex;align-items:center;gap:1.4R}
.or-car-bars{display:flex;gap:.4R}
.or-car-bars span{width:1.25R;height:.19R;background:#4a4a4f;border-radius:1R;transition:width .5s ease,background .5s}
.or-car-bars span.is-on{width:4.2R;background:#fff}
.or-car-count{font-family:"Bricolage Grotesque",sans-serif;font-weight:600;font-size:1.1R}
.or-car-btn{width:3.4R;height:3.4R;border-radius:50%;border:1px solid #4a4a4f;font-size:1.2R;transition:border-color .3s}
.or-car-btn:hover{border-color:#fff}
.or-hand{position:absolute;right:6R;bottom:5R;width:9R;height:9R;border-radius:50%;overflow:hidden;border:.12R solid #fff}
.or-thread{position:absolute;left:0;top:18%;width:100%;height:56%;overflow:visible}
.or-thread path{fill:none;stroke:#fff;stroke-width:2.2;stroke-dasharray:1;stroke-dashoffset:1}
.or-slit{position:absolute;inset:0;background:var(--or-paper);transform:scaleX(0) scaleY(0)}
@keyframes or-up{from{transform:translateY(70%);opacity:0}}

/* 6 proof */
.or-proof-track{height:calc(var(--h) * 3)}
.or-bubbles{position:absolute;inset:0;width:100%;height:100%}
.or-blob{position:absolute;left:-12R;top:-12R;width:24R;height:24R;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#dad2f4 0 30%,#c9d2f2 45%,rgb(220 210 244 / 0) 70%);opacity:.75;filter:blur(1.5R)}
.or-dark .or-blob{opacity:.25}
.or-cube-wrap{position:absolute;inset:0;perspective:50R;display:grid;place-items:center}
.or-cube{position:relative;width:34R;height:34R;transform-style:preserve-3d;margin-top:2R;translate:0 0 -17R}
.or-face{position:absolute;inset:0;margin:0;padding:0;list-style:none;display:flex;flex-direction:column;justify-content:center;backface-visibility:hidden;text-transform:uppercase;font-weight:800;letter-spacing:-.03em;background:var(--or-paper)}
.or-face-a{transform:translateZ(17R);font-size:2.05R;line-height:1.08;gap:.06R;white-space:nowrap}
.or-face-a em{font-style:normal;color:#9c90d8}
.or-face-a .is-hi{color:#9c90d8}
.or-face-b{transform:rotateY(90deg) translateZ(17R);font-size:3.3R;line-height:1.08}
.or-face-b a:hover{color:#a996f2}

/* 7 rope */
.or-rope-track{height:calc(var(--h) * 4)}
.or-rope-fill{position:absolute;inset:0;background:#c9c0d6;opacity:0}
.or-dark .or-rope-fill{background:#2c2638}
.or-rope-line{position:absolute;left:50%;top:8.5R;width:42R;margin:0 0 0 -21R;text-align:center;font-size:2.5R;line-height:1.2;letter-spacing:-.04em;z-index:2}
.or-squircle{position:absolute;left:50%;top:calc(50% + 2R);width:34R;height:22R;translate:-50% -50%;border-radius:9R;overflow:hidden;background:radial-gradient(120% 90% at 50% 40%,#eee8f6,#dcd2ee 55%,#cbbfe3)}
.or-dark .or-squircle{background:radial-gradient(120% 90% at 50% 40%,#3a3350,#2a2440)}
.or-rope-c,.or-rope-seq{position:absolute;left:50%;top:50%;width:100cqw;height:var(--h);translate:-50% -50%}
.or-rope-seq{display:none}
.or-seq-on .or-rope-seq{display:block}
.or-seq-on .or-rope-c{visibility:hidden}
.or-idea{position:absolute;left:0;right:0;top:50%;margin:-8R 0 0;text-align:center;font-size:7.5R;line-height:1;font-weight:500;letter-spacing:-.05em;color:#fff;text-transform:uppercase;text-shadow:0 .5R 3R rgb(60 40 120 / .25)}
.or-idea .or-l{opacity:0}
.or-marq{position:absolute;left:0;right:0;bottom:3R;overflow:hidden;opacity:0;color:#5d5670;mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent)}
.or-marq>div{display:flex;gap:4R;width:max-content;animation:or-marq 40s linear infinite}
.or-marq span{font-size:1.3R;font-weight:700;letter-spacing:-.03em;white-space:nowrap}
.or-marq span:nth-child(3n){font-family:"Bricolage Grotesque",serif;font-weight:500;font-style:italic}
@keyframes or-marq{to{transform:translateX(-50%)}}

/* 8 contact */
.or-s-contact{background:var(--or-blush-soft)}
.or-contact{display:grid;grid-template-columns:33R 1fr;gap:3R;padding:15R 9.375R 6R}
.or-contact-h{margin:0;font-size:2.6R;line-height:1.2;font-weight:500;letter-spacing:-.04em}
.or-contact-h .or-contact-face{display:inline-block;width:3.2R;height:3.2R;border-radius:50%;object-fit:cover;vertical-align:middle;background:#f2c84b}
.or-trust,.or-follow{margin-top:3R;display:flex;flex-direction:column;gap:.9R}
.or-trust>small,.or-follow>small{font-size:1R;color:var(--or-mute)}
.or-follow>span{display:flex;gap:.6R}
.or-social{width:3R;height:3R;border-radius:50%;border:1px solid var(--or-line);display:grid;place-items:center;font-size:.8R;font-weight:600;transition:border-color .4s}
.or-social:hover{border-color:#bcbcbc}
.or-sheet-open{display:none}
.or-sheet-x{display:none}
.or-form{display:flex;flex-direction:column;gap:2.2R}
.or-form-row{display:grid;grid-template-columns:1fr 1fr;gap:3R}
.or-field{display:flex;flex-direction:column;gap:.7R;font-size:.95R;font-weight:500}
.or-field input,.or-field textarea{font:inherit;font-weight:400;font-size:1.05R;color:inherit;background:none;border:0;border-bottom:1px solid var(--or-line);padding:.6R 0;outline:none;resize:none;transition:border-color .4s}
.or-field input:focus,.or-field textarea:focus{border-color:var(--or-ink)}
.or-field input::placeholder,.or-field textarea::placeholder{color:#a3a2a8}
.or-chips{border:0;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.9R}
.or-chips legend{font-size:.95R;font-weight:500;margin-bottom:1R;padding:0}
.or-chip{position:relative;display:inline-flex;border:1.5px solid var(--or-line);border-radius:3.75R;padding:.9R 1.7R;font-size:.95R;cursor:pointer;transition:border-color .3s,background .3s}
.or-chip:hover{border-color:#bcbcbc}
.or-chip.is-on{border-color:var(--or-ink);background:var(--or-ink);color:var(--or-paper)}
.or-chip input{position:absolute;opacity:0;pointer-events:none}
.or-chip:has(input:focus-visible){outline:2px solid #7c8cff;outline-offset:3px}
.or-submit-row{display:flex;align-items:center;gap:2R;margin-top:.6R}
.or-pulse{position:relative;display:inline-flex}
.or-pulse i{position:absolute;inset:0;border-radius:6R;border:1px solid #bcbcbc;opacity:0}
.or-pulse:hover i{animation:or-wave 1.5s ease infinite}
.or-pulse i:nth-child(2){animation-delay:.375s}
.or-pulse i:nth-child(3){animation-delay:.75s}
.or-pulse i:nth-child(4){animation-delay:1.125s}
.or-pulse::after{content:"";position:absolute;inset:0;border-radius:6R;border:1px solid #bcbcbc;animation:or-wave 3s ease infinite;pointer-events:none}
@keyframes or-wave{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.15,1.4)}}
.or-submit{position:relative;background:var(--or-ink)!important;color:var(--or-paper)!important;border-radius:6R!important;padding:1.6R 3.4R!important;font-size:1.15R!important;font-weight:500}
.or-submit span{display:inline-block;transition:transform .3s}
.or-submit span:nth-child(2){transform:rotate(8.6deg)}
.or-submit span:nth-child(3){transform:rotate(-8.4deg)}
.or-submit:hover span{transform:none}
.or-sent{margin:0;font-size:1R;color:var(--or-mute);max-width:22R}
.or-foot{padding:4R 9.375R 3R;border-top:1px solid var(--or-line);margin:0 0 0}
.or-foot-big{display:flex;align-items:center;gap:1.5R;font-size:17R;line-height:.9;font-weight:700;letter-spacing:-.08em}
.or-foot-m{width:10R;height:12R}
.or-foot-row{display:flex;align-items:flex-end;gap:4R;margin-top:3R;font-size:1R;color:var(--or-mute)}
.or-foot-row address{font-style:normal;line-height:1.4}
.or-foot-row small{margin-left:auto;font-size:.9R}
.or-foot-row .or-deck-pill{margin-left:0;color:var(--or-ink)}
.or-under{position:relative;color:var(--or-ink);padding-bottom:.3R;background:linear-gradient(currentColor,currentColor) 50% 100%/0 1px no-repeat,linear-gradient(rgb(128 128 128 / .3),rgb(128 128 128 / .3)) 0 100%/100% 1px no-repeat;transition:background-size .5s ease}
.or-under:hover{background-size:100% 1px,100% 1px}

/* overlays */
.or-flash{position:absolute;inset:0;z-index:30;background:#000;overflow:hidden;visibility:hidden;opacity:0;pointer-events:none}
.or-flash-in{position:absolute;left:-30%;top:-28%;width:160%;rotate:-15deg}
.or-flash-row{width:max-content;font-size:11R;line-height:12.4R;font-weight:800;letter-spacing:-.04em;color:var(--or-blush);white-space:nowrap}
.or-jump{position:absolute;inset:0;z-index:60;visibility:hidden;opacity:0;pointer-events:none;display:grid;place-items:center;--dc:#0b0b0c;--lc:#ffffff}
.or-jump[data-c=light]{--dc:#ffffff;--lc:#0b0b0c}
.or-jump-disc{position:absolute;left:50%;top:50%;width:max(150cqw,150cqh);height:max(150cqw,150cqh);margin:calc(max(150cqw,150cqh) / -2) 0 0 calc(max(150cqw,150cqh) / -2);border-radius:50%;background:var(--dc)}
.or-jump-logo{position:relative;width:24R;height:7.2R;overflow:visible}
.or-jump-logo path,.or-jump-logo text{fill:none;stroke:var(--lc);stroke-width:3;stroke-dasharray:420;stroke-dashoffset:420}
.or-jump-logo text{font:700 76px "Inter Tight",sans-serif;letter-spacing:-.06em;stroke-width:1.6}

/* menu */
.or-menu{position:absolute;inset:0;z-index:35;display:grid;grid-template-columns:1fr 18R 1fr;align-items:center;gap:6R;padding:9R 3.1R 3R;background:linear-gradient(203.7deg,#fff 48.1%,#eeebeb 86%);color:#0b0b0c;opacity:0;visibility:hidden;transform:translate(10%,-150%) rotate(12deg) scale(1.5);transition:transform .75s ease,visibility .75s ease,opacity .3s .5s}
.or-menu.is-open{opacity:1;visibility:visible;transform:none;transition:transform .75s ease,visibility .75s ease,opacity .3s}
.or-menu>*{opacity:0;transform:translateY(-6R);transition:transform .75s ease .3s,opacity .75s .3s}
.or-menu.is-open>*{opacity:1;transform:none}
.or-menu small{display:block;font-size:.85R;color:#9e9e9e;margin-bottom:1.2R}
.or-menu-social{display:flex;flex-direction:column;gap:.6R;font-size:1R;align-self:stretch;justify-content:center}
.or-menu-mail{margin-top:5R}
.or-menu-prev{position:relative;height:27R;border-radius:.4R;overflow:hidden}
.or-menu-p{position:absolute;top:0;bottom:0;left:0;max-width:0;width:100%;overflow:hidden;transition:max-width .3s ease}
.or-menu-p.is-on{left:auto;right:0;max-width:100%;transition:max-width .5s ease}
.or-menu-p>*{position:absolute;right:0;top:0;width:18R;height:27R;object-fit:cover;display:block}
.or-menu-links{display:flex;flex-direction:column;gap:.4R;font-size:3.5R;letter-spacing:-.045em}

/* floating contact chips with a brushed-metal edge */
.or-float{position:absolute;right:1.4R;bottom:1.4R;z-index:45;display:flex;flex-direction:column;align-items:flex-end;gap:1R}
.or-metal{display:inline-flex;align-items:center;justify-content:center;gap:.5R;color:#26272b;background:linear-gradient(32deg,#b8c2ce,#fff 50%) padding-box,linear-gradient(80deg,#737989,#fbffff,#fbffff,#707988) border-box;border:1.5px solid transparent;box-shadow:0 .25R .75R .5R rgb(0 0 0 / .08);transition:transform .2s ease}
.or-metal:hover{transform:scale(1.08)}
.or-metal svg{width:1.3R;height:1.3R;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linejoin:round}
.or-metal-o{width:3.1R;height:3.1R;border-radius:50%}
.or-dark .or-metal{color:#ecebf0;background:linear-gradient(32deg,#24262b,#4a4d56 50%) padding-box,linear-gradient(80deg,#4c5160,#c7ccd6,#c7ccd6,#4b505e) border-box;box-shadow:0 .25R .75R .5R rgb(0 0 0 / .35)}
.or-rail{position:absolute;left:3.1R;top:calc(var(--h) / 2 - 7R);display:flex;flex-direction:column;gap:.2R}
.or-rail button{display:flex;align-items:center;gap:.7R;height:1.35R;color:inherit}
.or-rail i{display:block;width:.9R;height:1.5px;background:currentColor;opacity:.35;transition:width .5s cubic-bezier(.3,.7,.2,1),opacity .3s}
.or-rail span{font-size:.75R;letter-spacing:0;opacity:0;translate:-.4R 0;transition:opacity .3s,translate .3s;white-space:nowrap}
.or-rail button.is-on i{width:2.2R;opacity:1}
.or-rail button:hover span,.or-rail button:focus-visible span{opacity:.8;translate:0 0}
.or-stack .or-rail{display:none}
.or-metal-p{border-radius:2R;padding:.5R 1R;font-size:.88R}
.or-metal-p svg{width:1R;height:1R}

/* cursor */
.or-dot{position:fixed;left:-.31R;top:-.31R;width:.62R;height:.62R;z-index:100;pointer-events:none;mix-blend-mode:difference;display:none}
.or-dot::before{content:"";position:absolute;left:50%;top:50%;width:100%;height:100%;border-radius:50%;background:#fff;translate:-50% -50%;transition:width .3s ease,height .3s ease}
.or-live:not(.or-stack) .or-dot{display:block}
.or-dot[data-k=nav]::before{width:6R;height:6R}
.or-dot[data-k=menu]::before{width:5R;height:5R}
.or-dot[data-k=button]::before{width:12R;height:12R}

/* ---- stacked: phones, touch, reduced motion ---- */
.or-stack .or-header{position:fixed;padding:1.2R 1.25R;background:rgb(255 255 255 / .78);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);transition:color .3s,background-color .3s}
.or-stack .or-header[data-tone=dark]{background:rgb(8 8 9 / .62)}
.or-stack .or-nav,.or-stack .or-talk{display:none}
.or-stack .or-logo{font-size:1.6R}
.or-stack .or-home{min-height:0;padding:7R 1.25R 2R}
.or-stack .or-hero{font-size:1.9R;line-height:1.2}
.or-stack .or-home-meta{flex-wrap:wrap;gap:1.4R}
.or-stack .or-deck-pill{margin-left:0}
.or-stack .or-eye-wrap{display:none}
.or-stack .or-reel-track{height:auto;padding:0 1.25R}
.or-stack .or-reel{position:relative;height:auto;aspect-ratio:4/5}
.or-stack .or-reel-mask{clip-path:inset(0 round 1.2R)}
.or-stack .or-reel-cap{left:1.2R;bottom:1.2R}
.or-stack .or-play{top:50%;margin-top:-2.7R}
.or-stack .or-about-track{height:auto!important}
.or-stack .or-s-about .or-stage{position:relative;height:auto;overflow:visible}
.or-stack .or-about-row{position:relative;top:0;flex-direction:column;padding:4R 1.25R 2R;gap:1.2R;transform:none!important}
.or-stack .or-about-h{width:auto;font-size:2.6R;margin:0 0 1R;align-self:flex-start}
.or-stack .or-card{width:auto;height:auto;min-height:30R;border-radius:1.2R;padding:13R 1.4R 1.6R}
.or-stack .or-card-pill{left:1R;right:1R;width:auto;height:10.5R;top:1R}
.or-stack .or-card h3{font-size:1.75R}
.or-stack .or-card p{font-size:.95R}
.or-stack .or-num{font-size:2.4R;right:1.4R;bottom:1.4R}
.or-stack .or-make-track{height:calc(var(--h) * 3.4)}
.or-stack .or-make-word{left:1.25R;font-size:3.6R;margin-top:-2R}
.or-stack .or-mock,.or-stack .or-tag,.or-stack .or-cur{zoom:.34}
.or-stack .or-cur{zoom:.6}
.or-stack .or-tag{zoom:.7;top:calc(var(--h) / 2 / .7 + 10.5R)}
.or-stack .or-cube{translate:0 0 -8.5R}
.or-stack .or-mock{top:calc(var(--h) / 2 / .34 - 19R)}
.or-stack .or-people-track{height:calc(var(--h) * 3)}
.or-stack .or-people-h{font-size:1.6R;line-height:2.6R}
.or-stack .or-gap{height:2.6R}
.or-stack .or-ava{padding:.15R}
.or-stack .or-ava>*{width:1.9R;height:1.9R;margin-left:-.45R;border-width:.1R}
.or-stack .or-ava b{font-size:.6R}
.or-stack .or-fly{width:11R;height:8R}
.or-stack .or-fly1{right:1R;width:9R;height:11R}
.or-stack .or-fly2{left:8R}
.or-stack .or-quote-track{height:calc(var(--h) * 2)}
.or-stack .or-qmark{left:1R;top:5R;font-size:8R}
.or-stack .or-q{left:1.25R;right:1.25R;width:auto;top:11R;font-size:2.1R}
.or-stack .or-ring-c{width:14R;height:14R;right:-8R}
.or-stack .or-qbar{right:1.25R;top:auto;bottom:12R;height:7R}
.or-stack .or-qcap{left:1.25R;right:3R;width:auto;bottom:4R;text-align:left}
.or-stack .or-work-track{height:auto}
.or-stack .or-work{position:relative;height:auto;min-height:44R}
.or-stack .or-work-k{left:1.25R;top:5R}
.or-stack .or-car-ring{top:20R}
.or-stack .or-car-card{left:-10.5R;top:-7.5R;width:21R;height:15R;transform:translateX(calc(var(--d) * 22.5R)) scale(calc(1 - min(1, max(var(--d), -1 * var(--d))) * .12))}
.or-stack .or-car-title{left:1.25R;top:27R;font-size:2.4R}
.or-stack .or-car-foot{left:1.25R;bottom:3R;gap:1R}
.or-stack .or-thread,.or-stack .or-slit,.or-stack .or-hand{display:none}
.or-stack .or-proof-track{height:calc(var(--h) * 2.2)}
.or-stack .or-cube{width:17R;height:17R}
.or-stack .or-face-a{transform:translateZ(8.5R);font-size:1R}
.or-stack .or-face-b{transform:rotateY(90deg) translateZ(8.5R);font-size:1.65R}
.or-stack .or-blob{display:none}
.or-stack .or-rope-track{height:calc(var(--h) * 2.6)}
.or-stack .or-rope-line{width:auto;left:1.25R;right:1.25R;margin:0;top:6.5R;font-size:1.5R}
.or-stack .or-idea{font-size:2.9R;margin-top:-3R}
.or-stack .or-contact{grid-template-columns:1fr;padding:7R 1.25R 3R}
.or-stack .or-contact-h{font-size:1.75R}
.or-stack .or-contact-h .or-contact-face{width:2.3R;height:2.3R}
.or-stack .or-sheet-open{display:inline-flex;margin-top:2.4R;align-self:flex-start;background:var(--or-ink);color:var(--or-paper);border-radius:3R;padding:1R 2R;font-size:1R;font-weight:500}
.or-stack .or-sheet{position:fixed;left:0;right:0;bottom:0;z-index:70;max-height:88svh;overflow:auto;background:var(--or-paper);border-radius:1.6R 1.6R 0 0;padding:3R 1.25R 2R;box-shadow:0 -1R 4R rgb(0 0 0 / .15);transform:translateY(105%);transition:transform .5s ease}
.or-stack .or-sheet.is-open{transform:none}
.or-stack .or-sheet-x{display:grid;place-items:center;position:absolute;right:1R;top:.8R;width:2.6R;height:2.6R;border-radius:50%;background:var(--or-line);font-size:1.4R}
.or-stack .or-form-row{grid-template-columns:1fr;gap:1.4R}
.or-stack .or-chip{padding:.7R 1.1R}
.or-stack .or-submit{padding:1.2R 2.4R!important}
.or-stack .or-foot{padding:3R 1.25R 6R}
.or-stack .or-foot-big{font-size:6R}
.or-stack .or-foot-m{width:3.5R;height:4R}
.or-stack .or-foot-row{flex-wrap:wrap;gap:1.4R}
.or-stack .or-menu{position:fixed;grid-template-columns:1fr;padding:7R 1.25R 2R;gap:2R;align-content:start}
.or-stack .or-menu-prev{display:none}
.or-stack .or-menu-links{order:-1;font-size:2.4R}
.or-stack .or-float{position:fixed;right:1R;bottom:1R}
.or-stack .or-flash,.or-stack .or-jump{position:fixed}
.or-reduced .or-eye-ring,.or-reduced .or-marq>div,.or-reduced .or-skel i{animation:none}
.or-reduced .or-pulse::after,.or-reduced .or-pulse i{animation:none!important}
.or-reduced .or-roll-t>span,.or-reduced .or-menu,.or-reduced .or-menu>*{transition-duration:.01s!important}
.or-reduced .or-idea .or-l{opacity:1}
@media (prefers-reduced-motion:reduce){.or-root *{scroll-behavior:auto}}
`)
