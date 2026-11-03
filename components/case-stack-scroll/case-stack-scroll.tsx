"use client"

/**
 * Case Stack Scroll: an agency's case studies as a stack of site cards.
 * They are filed up and back like folders in a drawer: the nearest
 * card faces you, the ones behind it show only their top strip. Wheel, drag,
 * swipe or the arrow keys roll the stack; hovering a card lifts it out to face you.
 *
 * Every card is painted in z-order under one shared perspective (the stage is
 * not preserve-3d), so neighbouring planes never cut through each other.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import gsap from "gsap"

export type CaseFaceKind =
  | "terminal"
  | "barn"
  | "gallery"
  | "gripper"
  | "poster"
  | "clinic"
  | "mesh"
  | "foundry"
  | "audio"
  | "serif"
  | "candy"
  | "sponsor"

export type CaseCard = {
  title: string
  category: string
  /** A screenshot of the site (16:10 reads best). Without it the built-in face is drawn. */
  image?: string
  /** Which built-in mini-site face to draw when there is no image. */
  face?: CaseFaceKind
  href?: string
}

export type CaseStackScrollProps = {
  /** Front card first; the rest file in behind it. */
  cards?: CaseCard[]
  /** Two short lines bottom-left. */
  tagline?: [string, string]
  ctaLabel?: string
  ctaHref?: string
  /** Label after the card count, top-right of the stack. */
  countLabel?: string
  cursorLabel?: string
  onSelect?: (card: CaseCard, index: number) => void
  /** Must be a definite length: percentages collapse on a page with no height chain. */
  height?: string
  fontHref?: string | null
  className?: string
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Instrument+Serif:ital@0;1&display=swap"

const U = (id: string, w: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&q=70&w=" + w
const PX = (id: number, w: number) => "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id + ".jpeg?auto=compress&cs=tinysrgb&w=" + w

const CARDS: CaseCard[] = [
  { title: "Permitly", category: "Startups", face: "terminal" },
  { title: "Fieldhouse", category: "Agritech", face: "barn" },
  { title: "Olive Press", category: "Media", face: "gallery" },
  { title: "Grasp", category: "Robotics", face: "gripper" },
  { title: "Ledger Civic", category: "Gov tech", face: "poster" },
  { title: "Vela Clinic", category: "Healthcare", face: "clinic" },
  { title: "Meshline", category: "AI platforms", face: "mesh" },
  { title: "Qubit Foundry", category: "Hardware", face: "foundry" },
  { title: "Halo Audio", category: "Startups", face: "audio" },
  { title: "Lathe & Co", category: "Manufacturing", face: "serif" },
  { title: "Gummio", category: "E-commerce", face: "candy" },
  { title: "Patronage", category: "Fintech", face: "sponsor" },
]

/** Design size of a card face; the face is drawn at this size and scaled to the card. */
const FACE_W = 1280
const FACE_H = 800

// #region stack-layout
/**
 * Where card k sits when the stack is rolled to `roll` and card `hover` is lifted
 * by `lift` (0..1). `s` is the card's slot behind the front one; y and z are in
 * card heights and rot in degrees, so the same numbers work at any size.
 */
export function cardPose(k: number, roll: number, hover: number, lift: number) {
  const s = k - roll
  let y: number
  let z: number
  let rot: number
  if (s >= 0) {
    // filed up and back along an incline: even strips, shrinking with depth
    y = -s * 0.15 - s * s * 0.003
    z = -s * 0.15
    rot = Math.min(s, 1) * 13
  } else {
    // past the front a card drops out of the bottom, face on
    y = -s * 0.75
    z = -s * 0.04
    rot = 0
  }
  if (hover >= 0 && lift > 0) {
    // the lifted card turns to face you; the cards in front slide down out of its way
    if (k === hover) {
      rot *= 1 - lift
      y -= lift * 0.1
      z += lift * 0.08
    } else if (k < hover) y += lift * 0.62
    else y -= lift * 0.05
  }
  const opacity = s < -1.6 ? 0 : s < -1 ? (s + 1.6) / 0.6 : s > 13 ? 0 : s > 11.5 ? (13 - s) / 1.5 : 1
  return { y, z, rot, opacity, slot: s }
}

/** The stack's travel: the last few cards stay filed at the back. */
export const maxRoll = (n: number) => Math.max(0, n - 4)
// #endregion

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

function Nav({ logo, links, cta, dark }: { logo: ReactNode; links: string[]; cta?: string; dark?: boolean }) {
  return (
    <div className={"cs-nav" + (dark ? " cs-nav-dark" : "")}>
      <span className="cs-nav-logo">{logo}</span>
      <span className="cs-nav-links">
        {links.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </span>
      {cta && <span className="cs-nav-cta">{cta}</span>}
    </div>
  )
}

function Face({ kind }: { kind: CaseFaceKind }) {
  switch (kind) {
    case "terminal":
      return (
        <div className="cs-face cs-f-terminal">
          <Nav logo="permitly" links={["Solutions", "Pricing", "Docs", "Contact", "FAQ"]} cta="Get access" dark />
          <div className="cs-f-terminal-in">
            <div className="cs-f-terminal-eye">
              <svg viewBox="0 0 13 9" width="230" height="160" aria-hidden="true">
                <path fill="#ff2b39" d="M4 0h5v1H4zM2 1h2v1H2zm7 0h2v1H9zM1 2h1v1H1zm10 0h1v1h-1zM0 3h1v3H0zm12 0h1v3h-1zM5 3h3v3H5zM1 6h1v1H1zm10 0h1v1h-1zM2 7h2v1H2zm7 0h2v1H9zM4 8h5v1H4z" />
              </svg>
            </div>
            <div className="cs-f-terminal-copy">
              <b>AI-POWERED<br />PERMIT REVIEW</b>
              <p>Automatically check every drawing set against local building code before it reaches the city desk.</p>
              <ul>
                <li><i>01</i>Detects missing structural elements</li>
                <li><i>02</i>Highlights inconsistencies in schedules</li>
                <li><i>03</i>Drafts the reviewer's comment sheet</li>
              </ul>
            </div>
          </div>
        </div>
      )
    case "barn":
      return (
        <div className="cs-face cs-f-barn">
          <Nav logo="FH" links={["Farms", "Machines", "Journal"]} cta="Book a visit" dark />
          <div className="cs-f-barn-cols">
            <span>Harvest<br />Spring 26</span>
            <span>Machines<br />Autonomous</span>
            <span>Language<br />EN / FR</span>
          </div>
          <b className="cs-f-barn-tag">Fieldhouse<br />Robotics</b>
          <p className="cs-f-barn-sub">Autonomous tractors for small, stubborn fields.</p>
        </div>
      )
    case "gallery":
      return (
        <div className="cs-face cs-f-gallery">
          <Nav logo="olive press" links={["Watch", "Listen", "Shop", "About"]} dark />
          <div className="cs-f-gallery-row">
            <div className="cs-f-gallery-tile" style={{ backgroundImage: "url(" + PX(11116100, 640) + ")" }}>
              <span className="cs-play" />
            </div>
            <div className="cs-f-gallery-disc" style={{ backgroundImage: "url(" + U("1717913521927-e42591d63ca0", 400) + ")" }} />
            <div className="cs-f-gallery-tile cs-f-gallery-round" style={{ backgroundImage: "url(" + PX(4841519, 640) + ")" }} />
          </div>
          <b className="cs-f-gallery-h">Stories pressed fresh, every week.</b>
        </div>
      )
    case "gripper":
      return (
        <div className="cs-face cs-f-gripper">
          <Nav logo="grasp" links={["Product", "Research", "Careers"]} cta="Request a demo" />
          <span className="cs-f-gripper-count">1 / 4</span>
          <b className="cs-f-gripper-h">AI powered<br />robotic gripper</b>
          <div className="cs-f-gripper-img" style={{ backgroundImage: "url(" + U("1684858061160-4b3a2ca48fac", 1100) + ")" }} />
          <span className="cs-f-gripper-mark">G</span>
        </div>
      )
    case "poster":
      return (
        <div className="cs-face cs-f-poster">
          <Nav logo="ledger civic" links={["How it works", "Blog", "Docs"]} cta="Book a call" />
          <div className="cs-f-poster-band">
            <b>
              <span className="cs-dot" />
              Sell your<br />software to<br />the government
            </b>
          </div>
          <p className="cs-f-poster-sub">One contract vehicle. Every agency. Zero procurement theatre.</p>
        </div>
      )
    case "clinic":
      return (
        <div className="cs-face cs-f-clinic">
          <Nav logo={<span className="cs-ring" />} links={["Clinic", "Doctors", "Team", "Contact"]} cta="Book an appointment" />
          <b className="cs-f-clinic-h">Vela Clinic</b>
          <div className="cs-f-clinic-row">
            <p>Same-week care for the whole family, with doctors who actually call back.</p>
            <div className="cs-f-clinic-img" style={{ backgroundImage: "url(" + PX(29612114, 900) + ")" }} />
          </div>
        </div>
      )
    case "mesh":
      return (
        <div className="cs-face cs-f-mesh">
          <Nav logo={<span>MESHLINE<i>.</i>IO</span>} links={["Services", "Examples", "Benefits", "How it works"]} cta="Book a consultation" dark />
          <b className="cs-f-mesh-h">
            We use AI<br />to build <em>interoperable</em>
            <br />systems<span className="cs-caret" />
          </b>
          <div className="cs-f-mesh-grid" />
        </div>
      )
    case "foundry":
      return (
        <div className="cs-face cs-f-foundry">
          <div className="cs-f-foundry-top">
            <span className="cs-f-foundry-logo">
              <i />
              <i />
              QF
            </span>
            <span className="cs-f-foundry-name">Qubit<br />Foundry</span>
            <b>Scaling chips down<br />to their physical<br />limits, 15x faster</b>
          </div>
          <div className="cs-f-foundry-img" style={{ backgroundImage: "url(" + U("1650943574955-ac02c65cfc71", 1200) + ")" }} />
        </div>
      )
    case "audio":
      return (
        <div className="cs-face cs-f-audio" style={{ backgroundImage: "url(" + U("1770031079091-c6356e82ea9b", 1300) + ")" }}>
          <Nav logo={<span className="cs-f-audio-logo">● halo</span>} links={["Speakers", "Studio", "Stories", "Support"]} cta="Pre-order" dark />
          <b className="cs-f-audio-h">Modular sound,<br />bold design.</b>
          <p className="cs-f-audio-sub">A speaker you build like a shelf: one core, any number of rings.</p>
          <span className="cs-f-audio-btn">Explore Halo</span>
          <div className="cs-f-audio-card">
            <i style={{ backgroundImage: "url(" + U("1618172193763-c511deb635ca", 200) + ")" }} />
            <span>Halo Ring 2<br />now shipping</span>
          </div>
        </div>
      )
    case "serif":
      return (
        <div className="cs-face cs-f-serif">
          <Nav logo="Lathe & Co" links={["Capabilities", "Materials", "Quote"]} cta="Upload a part" />
          <b className="cs-f-serif-h">
            Precision <em>machined</em> parts
            <br />
            shipped as fast as Friday
          </b>
          <div className="cs-f-serif-img" style={{ backgroundImage: "url(" + U("1621619856624-42fd193a0661", 1200) + ")" }} />
        </div>
      )
    case "candy":
      return (
        <div className="cs-face cs-f-candy">
          <Nav logo="GUMMIO" links={["Shop", "Flavours", "Bundles", "Story"]} cta="Cart (2)" />
          <i className="cs-c1" />
          <i className="cs-c2" />
          <i className="cs-c3" />
          <i className="cs-c4" />
          <b className="cs-f-candy-h">GUMMIO</b>
        </div>
      )
    case "sponsor":
      return (
        <div className="cs-face cs-f-sponsor">
          <Nav logo={<span className="cs-f-sponsor-logo">▦ patronage</span>} links={["Home", "Creators", "Pricing", "Blog"]} cta="Get started" />
          <div className="cs-f-sponsor-row">
            <b>Get a sponsor<br />in a week, not a year</b>
            <div className="cs-f-sponsor-img" style={{ backgroundImage: "url(" + U("1792702174422-a6958ea16786", 900) + ")" }} />
          </div>
        </div>
      )
  }
}

export default function CaseStackScroll({
  cards = CARDS,
  tagline = ["Filed by type.", "United by quality."],
  ctaLabel = "View all cases",
  ctaHref = "#",
  countLabel = "projects",
  cursorLabel = "View project",
  onSelect,
  height = "100svh",
  fontHref = FONT_HREF,
  className = "",
}: CaseStackScrollProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const cursorRef = useRef<HTMLDivElement>(null)
  const state = useRef({ roll: 0, target: 0, hover: -1, lifts: [] as number[], ch: 300, cw: 480, front: 0 })
  const [front, setFront] = useState(0)
  const [hover, setHover] = useState(-1)
  const n = cards.length

  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const st = state.current
    st.lifts = cards.map((_, i) => st.lifts[i] ?? 0)
    st.target = Math.min(st.target, maxRoll(n))

    const size = () => {
      const w = root.clientWidth
      const h = root.clientHeight
      const narrow = w < 720
      // the card's width follows the stage, but never so tall the stack can't breathe
      st.cw = Math.min(narrow ? w * 0.84 : w * 0.46, (h * 0.62 * FACE_W) / FACE_H)
      st.ch = (st.cw * FACE_H) / FACE_W
      root.style.setProperty("--cs-cw", st.cw + "px")
      root.style.setProperty("--cs-ch", st.ch + "px")
      root.style.setProperty("--cs-k", String(st.cw / FACE_W))
    }

    const place = () => {
      for (let k = 0; k < n; k++) {
        const el = cardRefs.current[k]
        if (!el) continue
        const p = cardPose(k, st.roll, st.hover, st.hover >= 0 ? st.lifts[st.hover] : 0)
        el.style.transform =
          "translate3d(-50%," + (p.y * st.ch).toFixed(2) + "px," + (p.z * st.ch).toFixed(2) + "px) rotateX(" + (-p.rot).toFixed(2) + "deg)"
        el.style.opacity = p.opacity.toFixed(3)
        el.style.zIndex = String(n - k)
        el.style.visibility = p.opacity <= 0 ? "hidden" : "visible"
        // cards deep in the drawer sit a touch in shadow
        el.style.setProperty("--cs-shade", Math.min(0.22, Math.max(0, (p.slot - 3) * 0.025)).toFixed(3))
      }
    }

    const tick = () => {
      const ease = reduced() ? 1 : 0.085
      st.roll += (st.target - st.roll) * ease
      if (Math.abs(st.target - st.roll) < 0.0005) st.roll = st.target
      for (let k = 0; k < n; k++) {
        const goal = k === st.hover ? 1 : 0
        st.lifts[k] += (goal - st.lifts[k]) * (reduced() ? 1 : 0.12)
      }
      const f = Math.min(n - 1, Math.max(0, Math.round(st.roll)))
      if (f !== st.front) {
        st.front = f
        setFront(f)
      }
      place()
    }

    size()
    place()
    const ro = new ResizeObserver(() => {
      size()
      place()
    })
    ro.observe(root)
    gsap.ticker.add(tick)
    return () => {
      ro.disconnect()
      gsap.ticker.remove(tick)
    }
  }, [n])

  // wheel, drag and swipe roll the stack; at either end the wheel is handed back to the page
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const st = state.current
    const max = maxRoll(n)
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      if ((d < 0 && st.target <= 0) || (d > 0 && st.target >= max)) return
      e.preventDefault()
      const px = e.deltaMode === 1 ? d * 32 : d
      st.target = Math.min(max, Math.max(0, st.target + px / 420))
      // once the wheel rests, settle on a whole card
      clearTimeout(snap)
      snap = window.setTimeout(() => (st.target = Math.round(st.target)), 160)
    }
    let snap = 0
    let drag: { id: number; y: number; t: number; moved: boolean } | null = null
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return
      drag = { id: e.pointerId, y: e.clientY, t: st.target, moved: false }
    }
    const onMove = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return
      const d = drag.y - e.clientY
      if (!drag.moved && Math.abs(d) > 6) {
        drag.moved = true
        root.setPointerCapture(e.pointerId)
      }
      if (drag.moved) st.target = Math.min(max, Math.max(0, drag.t + d / (st.ch * 0.42)))
    }
    const onUp = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return
      if (drag.moved) {
        st.target = Math.round(st.target)
        // a drag is not a click on the card under the finger
        root.addEventListener("click", (c) => c.stopPropagation(), { capture: true, once: true })
      }
      drag = null
    }
    root.addEventListener("wheel", onWheel, { passive: false })
    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerup", onUp)
    root.addEventListener("pointercancel", onUp)
    return () => {
      root.removeEventListener("wheel", onWheel)
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointercancel", onUp)
      clearTimeout(snap)
    }
  }, [n])

  // the "View project" disc trails the pointer while a card is lifted
  useEffect(() => {
    const root = rootRef.current
    const cur = cursorRef.current
    if (!root || !cur) return
    const x = gsap.quickTo(cur, "x", { duration: reduced() ? 0 : 0.35, ease: "power3.out" })
    const y = gsap.quickTo(cur, "y", { duration: reduced() ? 0 : 0.35, ease: "power3.out" })
    const onMove = (e: PointerEvent) => {
      // checked per event, not once: a touch screen can grow a mouse later
      if (e.pointerType !== "mouse") return
      const r = root.getBoundingClientRect()
      x(e.clientX - r.left)
      y(e.clientY - r.top)
    }
    root.addEventListener("pointermove", onMove)
    return () => root.removeEventListener("pointermove", onMove)
  }, [])

  const setLift = (k: number) => {
    state.current.hover = k
    setHover(k)
  }

  const go = (d: number) => {
    const st = state.current
    st.target = Math.min(maxRoll(n), Math.max(0, Math.round(st.target) + d))
  }

  const shown = hover >= 0 ? hover : front
  const card = cards[shown]

  return (
    <div
      ref={rootRef}
      className={"cs-root" + (hover >= 0 ? " cs-lifting" : "") + (className ? " " + className : "")}
      style={{ "--cs-h": height } as CSSProperties}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "PageDown") (e.preventDefault(), go(1))
        else if (e.key === "ArrowUp" || e.key === "PageUp") (e.preventDefault(), go(-1))
      }}
    >
      <style>{CSS}</style>
      {fontHref && <link rel="stylesheet" href={fontHref} />}

      <div className="cs-stage">
        {cards.map((c, k) => (
          <button
            key={k}
            ref={(el) => {
              cardRefs.current[k] = el
            }}
            type="button"
            className={"cs-card" + (k === hover ? " cs-on" : "")}
            aria-label={c.title + ", " + c.category}
            tabIndex={k === front ? 0 : -1}
            onPointerEnter={(e) => e.pointerType === "mouse" && setLift(k)}
            onPointerLeave={(e) => e.pointerType === "mouse" && state.current.hover === k && setLift(-1)}
            onFocus={() => setLift(k)}
            onBlur={() => setLift(-1)}
            onClick={() => {
              // touch: the first tap lifts, the second opens
              if (hover !== k) return setLift(k)
              onSelect?.(c, k)
              if (c.href) window.location.href = c.href
            }}
          >
            <span className="cs-card-in">
              {c.image ? <img src={c.image} alt="" draggable={false} /> : <Face kind={c.face ?? "sponsor"} />}
            </span>
          </button>
        ))}
      </div>

      <div className="cs-label cs-left" aria-live="polite">
        <span className="cs-mono">{hover >= 0 ? card?.category : shown + 1 + "\\" + n}</span>
        <span className="cs-big">{hover >= 0 ? card?.title : card?.category}</span>
      </div>
      <div className="cs-label cs-right">
        <span className="cs-big">
          {n} {countLabel}
        </span>
      </div>
      <div className="cs-mono cs-tag">
        {tagline[0]}
        <br />
        {tagline[1]}
      </div>
      <a className="cs-mono cs-cta" href={ctaHref}>
        <span aria-hidden="true">↳</span> {ctaLabel}
      </a>

      <div ref={cursorRef} className="cs-cursor" aria-hidden="true">
        <span>
          {cursorLabel}
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path d="M2 1l9 5-4 1-2 4z" fill="currentColor" />
          </svg>
        </span>
      </div>
    </div>
  )
}

const CSS = `
.cs-root{position:relative;height:var(--cs-h);min-height:420px;width:100%;overflow:hidden;background:var(--color-background,#fff);color:var(--color-foreground,#0b0b0b);font-family:"Inter Tight",ui-sans-serif,system-ui,sans-serif;container:cs/inline-size;user-select:none;-webkit-user-select:none}
.cs-root img{max-width:none}
.cs-stage{position:absolute;inset:0;perspective:1100px;perspective-origin:50% 0%;touch-action:pan-x}
.cs-card{position:absolute;left:50%;top:88%;width:var(--cs-cw);height:var(--cs-ch);margin-top:calc(var(--cs-ch) / -2);padding:0;border:0;background:#111;cursor:pointer;transform-origin:50% 50%;backface-visibility:hidden;will-change:transform;outline:none;box-shadow:0 -1px 0 rgb(0 0 0 / .08),0 18px 40px -22px rgb(0 0 0 / .45)}
.cs-card::after{content:"";position:absolute;inset:0;background:#000;opacity:var(--cs-shade,0);pointer-events:none;transition:opacity .2s}
.cs-card:focus-visible{outline:2px solid var(--color-primary,#2b4bff);outline-offset:4px}
.cs-card-in{position:absolute;inset:0;overflow:hidden;display:block}
.cs-card-in img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.cs-root.cs-lifting .cs-card.cs-on{cursor:none}
.cs-label{position:absolute;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:.35rem;pointer-events:none;z-index:20}
.cs-left{left:clamp(16px,2.4cqw,36px)}
.cs-right{right:clamp(16px,2.4cqw,36px);text-align:right}
.cs-big{font-size:clamp(15px,1.35cqw,22px);font-weight:500;letter-spacing:-.01em;line-height:1.1}
.cs-mono{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:clamp(9px,.68cqw,11px);letter-spacing:.04em;text-transform:uppercase;line-height:1.45}
.cs-tag{position:absolute;left:clamp(16px,2.4cqw,36px);bottom:clamp(16px,2.6cqw,34px);z-index:20;pointer-events:none}
.cs-cta{position:absolute;right:clamp(16px,2.4cqw,36px);bottom:clamp(14px,2.4cqw,30px);z-index:20;color:inherit;text-decoration:none;padding:.5em .85em;background:color-mix(in srgb,var(--color-foreground,#000) 7%,transparent);border-radius:3px;transition:background-color .2s}
.cs-cta:hover{background:color-mix(in srgb,var(--color-foreground,#000) 14%,transparent)}
.cs-cursor{position:absolute;left:0;top:0;z-index:30;pointer-events:none;width:0;height:0}
.cs-cursor span{position:absolute;left:-36px;top:-36px;width:72px;height:72px;border-radius:50%;background:#2a2df4;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;text-align:center;line-height:1.2;padding:0 14px;transform:scale(0);transition:transform .35s cubic-bezier(.2,.8,.2,1);box-shadow:0 10px 30px -10px rgb(42 45 244 / .7)}
.cs-root.cs-lifting .cs-cursor span{transform:scale(1)}
@media (hover: none){.cs-cursor{display:none}}

.cs-face{position:absolute;left:0;top:0;width:1280px;height:800px;transform:scale(var(--cs-k,.4));transform-origin:0 0;overflow:hidden;text-align:left;font-family:"Inter Tight",ui-sans-serif,system-ui,sans-serif;color:#0d0d0d;background:#fff}
.cs-face b{font-weight:500}
.cs-nav{position:absolute;left:0;right:0;top:0;height:64px;display:flex;align-items:center;gap:40px;padding:0 40px;font-size:17px;border-bottom:1px solid rgb(0 0 0 / .08);background:inherit;z-index:2}
.cs-nav-dark{color:#f2f2f2;border-color:rgb(255 255 255 / .1)}
.cs-nav-logo{font-weight:700;font-size:22px;letter-spacing:-.02em;display:flex;align-items:center}
.cs-nav-links{display:flex;gap:30px;margin:0 auto;opacity:.75}
.cs-nav-cta{padding:10px 18px;border-radius:6px;background:#2448ff;color:#fff;font-size:15px}
.cs-nav-dark .cs-nav-cta{background:#fff;color:#000}

.cs-f-terminal{background:#e8151f;padding:18px}
.cs-f-terminal .cs-nav{position:relative;background:#0d0d0d;font-family:"JetBrains Mono",monospace;font-size:13px;text-transform:uppercase;letter-spacing:.06em}
.cs-f-terminal-in{position:absolute;left:18px;right:18px;top:82px;bottom:18px;display:grid;grid-template-columns:1fr 1fr;background:#e8151f}
.cs-f-terminal-eye{display:flex;align-items:center;justify-content:center;background:#e8151f}
.cs-f-terminal-eye svg{shape-rendering:crispEdges}
.cs-f-terminal-eye path{fill:#0d0d0d}
.cs-f-terminal-copy{background:#0d0d0d;color:#f3f3f3;padding:56px 48px;font-family:"JetBrains Mono",monospace}
.cs-f-terminal-copy b{display:block;font-size:64px;line-height:.98;font-weight:700;letter-spacing:.02em}
.cs-f-terminal-copy p{font-size:17px;line-height:1.5;opacity:.75;margin:28px 0 30px;max-width:460px}
.cs-f-terminal-copy ul{list-style:none;margin:0;padding:0;font-size:14px;text-transform:uppercase;letter-spacing:.04em}
.cs-f-terminal-copy li{border-top:1px solid rgb(255 255 255 / .15);padding:12px 0;display:flex;gap:24px}
.cs-f-terminal-copy i{font-style:normal;opacity:.5}

.cs-f-barn{background:radial-gradient(120% 90% at 30% 20%,#9a6a2c,#5a3812 60%,#3a230b);color:#f5e9d6}
.cs-f-barn::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(97deg,rgb(0 0 0 / .1) 0 2px,transparent 2px 7px),repeating-linear-gradient(8deg,rgb(255 220 160 / .06) 0 1px,transparent 1px 5px)}
.cs-f-barn .cs-nav{background:transparent}
.cs-f-barn-cols{position:absolute;left:40px;right:40px;top:110px;display:flex;gap:120px;font-size:16px;line-height:1.4;opacity:.85}
.cs-f-barn-tag{position:absolute;left:40px;top:250px;background:#ff2d2d;color:#fff;font-size:112px;line-height:.95;padding:14px 26px 22px;font-weight:600;letter-spacing:-.03em}
.cs-f-barn-sub{position:absolute;left:44px;bottom:60px;font-size:22px;margin:0}

.cs-f-gallery{background:#0d0d0d;color:#eee}
.cs-f-gallery-row{position:absolute;left:40px;right:40px;top:100px;height:430px;display:grid;grid-template-columns:1.1fr .8fr 1fr;gap:28px;align-items:center}
.cs-f-gallery-tile{height:100%;border-radius:22px;background-size:cover;background-position:center;position:relative}
.cs-f-gallery-round{border-radius:50%;height:88%}
.cs-f-gallery-disc{width:220px;height:220px;justify-self:center;border-radius:50%;background-size:cover;background-position:center;box-shadow:0 0 0 18px #1c1c1c}
.cs-play{position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px;border-radius:50%;background:#fff}
.cs-play::after{content:"";position:absolute;left:34px;top:26px;border-left:24px solid #0d0d0d;border-top:16px solid transparent;border-bottom:16px solid transparent}
.cs-f-gallery-h{position:absolute;left:40px;bottom:64px;font-size:64px;letter-spacing:-.03em;line-height:1}

.cs-f-gripper{background:#a9cfdc}
.cs-f-gripper .cs-nav{background:#a9cfdc}
.cs-f-gripper-count{position:absolute;left:40px;top:110px;font-family:"JetBrains Mono",monospace;font-size:18px}
.cs-f-gripper-h{position:absolute;left:40px;top:170px;font-size:84px;line-height:.98;color:#fff;letter-spacing:-.03em;z-index:1}
.cs-f-gripper-img{position:absolute;right:-40px;bottom:-60px;width:860px;height:640px;background-size:cover;background-position:center;mix-blend-mode:multiply;-webkit-mask-image:radial-gradient(closest-side,#000 70%,transparent);mask-image:radial-gradient(closest-side,#000 70%,transparent)}
.cs-f-gripper-mark{position:absolute;right:40px;top:96px;width:64px;height:64px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:34px;color:#a9cfdc}

.cs-f-poster{background:#fff}
.cs-f-poster .cs-nav-cta{background:#0d0d0d}
.cs-f-poster-band{position:absolute;left:0;right:0;top:64px;height:520px;background:#ff5a12;padding:52px 40px}
.cs-f-poster-band b{display:block;font-size:112px;line-height:.92;font-weight:700;letter-spacing:-.04em;color:#0d0d0d}
.cs-dot{display:inline-block;width:56px;height:56px;border-radius:50%;background:#0d0d0d;margin-right:24px;vertical-align:.05em}
.cs-f-poster-sub{position:absolute;left:40px;bottom:72px;margin:0;font-size:28px;max-width:720px;letter-spacing:-.01em}

.cs-f-clinic{background:#f6f7fb}
.cs-f-clinic .cs-nav{background:#f6f7fb}
.cs-ring{width:30px;height:30px;border-radius:50%;border:5px solid #0d0d0d;border-right-color:transparent}
.cs-f-clinic-h{position:absolute;left:30px;top:96px;font-size:250px;line-height:.9;letter-spacing:-.06em;font-weight:600}
.cs-f-clinic-row{position:absolute;left:40px;right:40px;bottom:40px;height:300px;display:grid;grid-template-columns:1fr 1.3fr;gap:40px;align-items:end}
.cs-f-clinic-row p{font-size:26px;line-height:1.3;margin:0;max-width:420px}
.cs-f-clinic-img{height:100%;border-radius:18px;background-size:cover;background-position:center}

.cs-f-mesh{background:#0a1210;color:#e9f2ee}
.cs-f-mesh .cs-nav i{color:#2df59a;font-style:normal}
.cs-f-mesh .cs-nav-cta{background:#2df59a;color:#062b19}
.cs-f-mesh-h{position:absolute;left:40px;top:190px;font-family:"JetBrains Mono",monospace;font-weight:500;font-size:84px;line-height:1.02;letter-spacing:-.04em;z-index:1}
.cs-f-mesh-h em{font-style:normal;color:#2df59a}
.cs-caret{display:inline-block;width:.45em;height:.8em;background:#2df59a;margin-left:.15em;vertical-align:-.05em}
.cs-f-mesh-grid{position:absolute;inset:64px 0 0;background:linear-gradient(rgb(45 245 154 / .07) 1px,transparent 1px) 0 0/48px 48px,linear-gradient(90deg,rgb(45 245 154 / .07) 1px,transparent 1px) 0 0/48px 48px}

.cs-f-foundry{background:#fff}
.cs-f-foundry-top{position:absolute;left:0;right:0;top:0;height:300px;display:grid;grid-template-columns:auto 1fr 1.25fr;gap:36px;align-items:center;padding:0 48px;border-bottom:1px solid #e6e6e6}
.cs-f-foundry-logo{position:relative;font-size:110px;font-weight:300;letter-spacing:-.06em;display:flex;align-items:center}
.cs-f-foundry-logo i{position:absolute;left:-14px;right:-14px;height:4px;background:#0d0d0d;top:44%}
.cs-f-foundry-logo i+i{top:62%}
.cs-f-foundry-name{font-size:20px;line-height:1.15}
.cs-f-foundry-top b{font-size:56px;line-height:1.02;letter-spacing:-.03em}
.cs-f-foundry-img{position:absolute;left:0;right:0;top:300px;bottom:0;background-size:cover;background-position:center 40%}

.cs-f-audio{background:#120708 center/cover no-repeat;color:#fff}
.cs-f-audio::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgb(20 4 6 / .82),rgb(20 4 6 / .1) 60%)}
.cs-f-audio .cs-nav{background:transparent}
.cs-f-audio .cs-nav-cta{background:#e01b2c;color:#fff}
.cs-f-audio-logo{color:#ff2b39}
.cs-f-audio-h{position:absolute;left:40px;top:120px;font-size:96px;line-height:.98;letter-spacing:-.04em;font-weight:600}
.cs-f-audio-sub{position:absolute;left:44px;top:340px;font-size:22px;max-width:420px;line-height:1.35;opacity:.8;margin:0}
.cs-f-audio-btn{position:absolute;left:44px;top:450px;background:#e01b2c;padding:16px 26px;font-size:18px;border-radius:4px}
.cs-f-audio-card{position:absolute;right:40px;bottom:40px;display:flex;gap:18px;align-items:center;background:#fff;color:#0d0d0d;padding:14px 26px 14px 14px;font-size:18px;line-height:1.25}
.cs-f-audio-card i{width:84px;height:84px;background-size:cover;background-position:center}

.cs-f-serif{background:#fff}
.cs-f-serif-h{position:absolute;left:0;right:0;top:110px;text-align:center;font-size:76px;line-height:1.02;letter-spacing:-.035em}
.cs-f-serif-h em{font-family:"Instrument Serif",ui-serif,Georgia,serif;font-size:1.1em;letter-spacing:-.01em;color:#2448ff}
.cs-f-serif-img{position:absolute;left:180px;right:180px;top:330px;bottom:0;background-size:cover;background-position:center;border-radius:16px 16px 0 0}

.cs-f-candy{background:#b9a2ff}
.cs-f-candy .cs-nav{background:#b9a2ff;border-color:rgb(0 0 0 / .15)}
.cs-f-candy .cs-nav-cta{background:#0d0d0d}
.cs-f-candy-h{position:absolute;left:0;right:0;bottom:-40px;text-align:center;font-size:330px;line-height:1;font-weight:800;letter-spacing:-.06em;color:#3b0f3a}
.cs-f-candy i{position:absolute;width:150px;height:150px;border-radius:38px;box-shadow:inset -14px -18px 0 rgb(0 0 0 / .14),inset 10px 12px 0 rgb(255 255 255 / .35)}
.cs-c1{left:110px;top:150px;background:#2bc4ff;transform:rotate(-18deg)}
.cs-c2{left:420px;top:110px;background:#ff5c8a;transform:rotate(12deg)}
.cs-c3{right:400px;top:170px;background:#ffd23a;transform:rotate(-8deg)}
.cs-c4{right:110px;top:120px;background:#5cf06a;transform:rotate(22deg)}

.cs-f-sponsor{background:#f4f4f2}
.cs-f-sponsor .cs-nav{background:#fff}
.cs-f-sponsor .cs-nav-cta{background:#ff6a1f}
.cs-f-sponsor-row{position:absolute;left:40px;right:40px;top:120px;bottom:40px;display:grid;grid-template-columns:1fr 1.1fr;gap:40px}
.cs-f-sponsor-row b{font-size:66px;line-height:1.02;letter-spacing:-.035em;padding-top:30px}
.cs-f-sponsor-img{border-radius:20px;background-size:cover;background-position:center}
.cs-f-sponsor-logo{font-size:20px}

@container cs (max-width: 720px){
  .cs-stage{top:64px;bottom:72px;overflow:hidden}
  .cs-card{top:82%}
  .cs-label{top:clamp(16px,4cqw,28px);transform:none}
  .cs-big{font-size:15px}
}
@media (prefers-reduced-motion: reduce){
  .cs-cursor span,.cs-card::after,.cs-cta{transition:none}
}
`
