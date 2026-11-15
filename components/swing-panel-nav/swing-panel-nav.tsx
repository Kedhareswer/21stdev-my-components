"use client"

import * as React from "react"

/**
 * Swing Panel Nav — a pill navbar whose dropdowns are a single oversized sheet
 * that swings down from a pivot far off the right edge, overshoots a degree and
 * settles at a slight tilt. Switching menus throws the sheet back up and swings
 * the next one in. Hovered links slide right and fade.
 */

export type SwingLink = { label: string; href?: string }
/** "tilt" is the angle (deg) the sheet rests at; the reference uses -4 and -4.4. */
export type SwingMenu = { label: string; links?: SwingLink[]; href?: string; tilt?: number }

export type SwingPanelNavProps = {
  /** Wordmark next to the mark, top left. */
  brand?: string
  brandHref?: string
  /** Items in the pill. Ones with "links" open the panel; ones with only "href" are plain links. */
  menus?: SwingMenu[]
  /** The solid button at the right end. */
  cta?: { label: string; href: string }
  /** Colour of the panel's links, the chevrons and the button. */
  accent?: string
  /** Definite height for the stage. Do not pass a percentage unless every ancestor has a height. */
  height?: string
  className?: string
  /** Optional content for the stage behind the panel. */
  children?: React.ReactNode
}

const EMAIL = "kedhareswer.12110626@gmail.com"

const DEFAULT_MENUS: SwingMenu[] = [
  {
    label: "Work",
    tilt: -4,
    links: [
      { label: "Project 01", href: "#project-01" },
      { label: "Project 02", href: "#project-02" },
      { label: "Project 03", href: "#project-03" },
      { label: "Project 04", href: "#project-04" },
    ],
  },
  {
    label: "About",
    tilt: -4.4,
    links: [
      { label: "Who I am", href: "#about" },
      { label: "How I work", href: "#process" },
      { label: "Clients", href: "#clients" },
    ],
  },
  { label: "Journal", href: "#journal" },
]

type Sim = { mode: string; d: number; vel: number; rest: number; from: number; t: number; gd: number; gv: number }

const DEFAULT_CTA = { label: "Email me", href: "mailto:" + EMAIL }

// #region swing
/**
 * Measured from the reference at 30 fps by fitting the sheet outline in every
 * frame. The sheet turns about a point well outside the stage (140% across,
 * 59% down), not about its own corner. Angles here are degrees away from rest.
 *
 * Open: a spring (k 185.6, c 21.04, mass 1) from 47.6deg to rest, overshooting
 * by about 1.1deg 0.34 s in; 0.18deg RMS against 40 measured frames.
 * Close: travel = 0.0284 * ms^1.5, gone in about 140 ms.
 * Swap: the sheet is kicked up the close curve and joins the opening spring
 * (started at the click) where the two meet, about 27deg up, 98 ms in.
 */
export const SWING = { travel: 47.6, rest: -4, stiffness: 185.6, damping: 21.04, closeRate: 0.0284, closePower: 1.5 }

/** Advance the spring toward rest (0) by dt seconds in fixed 1 ms substeps. Returns [d, velocity]. */
export function stepSpring(d: number, vel: number, dt: number) {
  let a = d
  let v = vel
  let left = dt
  while (left > 0) {
    const h = Math.min(left, 0.001)
    const acc = -SWING.stiffness * a - SWING.damping * v
    v += acc * h
    a += v * h
    left -= h
  }
  return [a, v]
}

/** Angle away from rest while leaving, ms after the leave began at "from". Capped at the full travel. */
export function closeTravel(from: number, ms: number) {
  return Math.min(SWING.travel, from + SWING.closeRate * Math.pow(Math.max(0, ms), SWING.closePower))
}

/** True once the spring has come to rest. */
export function settled(d: number, vel: number) {
  return Math.abs(d) < 0.01 && Math.abs(vel) < 0.02
}

/**
 * Sheet height (% of the stage) and line pitch (em) by link count, from the
 * reference: 4 links = 529px sheet / 59.5px pitch, 3 links = 503px / 64.5px,
 * on a 700px stage with 75.4px type.
 */
export function sheetMetrics(count: number) {
  const n = Math.min(7, Math.max(1, count))
  return {
    height: ((425 + 26 * n) / 700) * 100,
    top: n >= 4 ? -5.03 : -5.37,
    pitch: n >= 4 ? 0.789 : 0.855,
    bottom: n >= 4 ? 4.41 : 4.26,
    left: n >= 4 ? 6.1 : 6.4,
  }
}
// #endregion

const FONT_DISPLAY = "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"
const FONT_SANS = "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"

const FONT_SANS_BOLD = "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"

const CSS =
  "@font-face{font-family:SpnDisplay;font-weight:800;font-style:normal;font-display:swap;src:url(data:font/woff2;base64," +
  FONT_DISPLAY +
  ") format('woff2')}" +
  "@font-face{font-family:SpnSans;font-weight:600;font-style:normal;font-display:swap;src:url(data:font/woff2;base64," +
  FONT_SANS +
  ") format('woff2')}" +
  "@font-face{font-family:SpnSans;font-weight:800;font-style:normal;font-display:swap;src:url(data:font/woff2;base64," +
  FONT_SANS_BOLD +
  ") format('woff2')}" +
  ".spn-root{position:relative;width:100%;overflow:hidden;isolation:isolate;container-type:inline-size;" +
  "background:var(--color-foreground,#0b0b09);color:var(--color-background,#fff);--spn-ink:var(--spn-accent)}" +
  ".dark .spn-root,.spn-root.spn-dark{--spn-ink:color-mix(in oklab,var(--spn-accent) 72%,#fff)}" +
  ".spn-sans{font-family:SpnSans,ui-rounded,'SF Pro Rounded',system-ui,sans-serif;font-weight:600}" +
  ".spn-bar{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 43px 0;pointer-events:none}" +
  ".spn-bar>*{pointer-events:auto}" +
  ".spn-brand{display:inline-flex;align-items:center;gap:10px;font-size:25px;font-weight:800;line-height:1;letter-spacing:-0.01em;color:var(--color-background,#fff);text-decoration:none;white-space:nowrap}" +
  ".spn-mark{width:40px;height:40px;flex:none}" +
  ".spn-right{display:flex;align-items:center;gap:6px;min-width:0}" +
  ".spn-pill{display:flex;align-items:center;height:58px;padding:0 10.5px;border-radius:999px;" +
  "background:color-mix(in srgb,var(--color-background,#fff) 90%,color-mix(in srgb,var(--color-foreground,#000) 60%,var(--spn-accent)))}" +
  ".spn-item{display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 15.5px;border:0;margin:0;background:none;border-radius:999px;" +
  "font-size:19px;line-height:1;color:var(--color-foreground,#0b0b09);text-decoration:none;cursor:pointer;white-space:nowrap;transition:color .08s linear}" +
  ".spn-item[aria-expanded='true']{color:color-mix(in oklab,var(--color-foreground,#0b0b09) 80%,transparent)}" +
  ".spn-item:focus-visible,.spn-cta:focus-visible,.spn-brand:focus-visible{outline:2px solid var(--spn-ink);outline-offset:2px}" +
  ".spn-chev{width:9px;height:9px;flex:none;color:var(--spn-ink);transition:transform .25s cubic-bezier(.22,1,.36,1)}" +
  ".spn-item[aria-expanded='true'] .spn-chev{transform:rotate(180deg)}" +
  ".spn-cta{display:inline-flex;align-items:center;height:58px;padding:0 32px;border-radius:999px;background:var(--spn-accent);color:#fff;" +
  "font-size:19px;line-height:1;text-decoration:none;white-space:nowrap;transition:filter .2s ease}" +
  ".spn-arm{position:absolute;inset:0;z-index:2;pointer-events:none;transform-origin:140.2% 59%;transform:rotate(44deg);visibility:hidden;will-change:transform;backface-visibility:hidden}" +
  ".spn-panel{position:absolute;pointer-events:auto;left:27.2%;right:-35.7%;top:var(--spn-top,-5.03%);height:var(--spn-h,75.6%);background:var(--color-background,#fff)}" +
  ".spn-links{position:absolute;left:var(--spn-left,6.1cqw);bottom:var(--spn-bottom,4.41cqw);margin:0;padding:0;list-style:none}" +
  ".spn-link{display:block;width:max-content;font-family:SpnDisplay,'Archivo Narrow','Arial Narrow',Impact,sans-serif;font-weight:800;" +
  "font-size:clamp(34px,5.89cqw,112px);line-height:var(--spn-pitch,.789em);text-transform:uppercase;letter-spacing:0;color:var(--spn-ink);text-decoration:none;" +
  "transition:transform .4s cubic-bezier(.22,1,.36,1),opacity .4s cubic-bezier(.22,1,.36,1)}" +
  ".spn-link:focus-visible{outline:none;opacity:.66;transform:translateX(.36em)}" +
  ".spn-stage{position:absolute;inset:0;z-index:1}" +
  "@media (hover:hover) and (pointer:fine){.spn-link:hover{opacity:.66;transform:translateX(.36em)}.spn-cta:hover{filter:brightness(1.12)}}" +
  "@container (max-width:720px){.spn-bar{padding:14px 16px 0}.spn-brand{font-size:19px;gap:8px;transition:opacity .2s ease}.spn-root[data-open] .spn-brand{opacity:0;pointer-events:none}.spn-mark{width:28px;height:28px}" +
  ".spn-pill{height:46px;padding:0 4px}.spn-item{height:38px;padding:0 10px;font-size:15px;gap:5px}" +
  ".spn-cta{height:46px;padding:0 18px;font-size:15px}" +
  ".spn-panel{left:6%;right:-40%;top:-4%;height:70%}.spn-links{left:7cqw;bottom:9cqw}.spn-link{font-size:clamp(30px,11cqw,64px)}}" +
  "@container (max-width:520px){.spn-cta{display:none}.spn-brand-text{display:none}}" +
  "@media (prefers-reduced-motion:reduce){.spn-arm{transition:opacity .16s linear}.spn-link,.spn-chev,.spn-item,.spn-cta{transition:none}" +
  ".spn-link:hover,.spn-link:focus-visible{transform:none}}"

function Chevron() {
  return (
    <svg className="spn-chev" viewBox="0 0 10 10" aria-hidden="true" fill="none">
      <path d="M1.2 3 5 6.8 8.8 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** A disc with a hinge notch — the sheet's pivot, as a mark. */
function Mark() {
  return (
    <svg className="spn-mark" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12" fill="currentColor" />
      <path d="M14 14 26 9.6A12 12 0 0 0 20.3 3.9Z" fill="var(--color-foreground,#0b0b09)" />
      <circle cx="14" cy="14" r="2.4" fill="var(--color-foreground,#0b0b09)" />
    </svg>
  )
}

export default function SwingPanelNav({
  brand = "Kedhareswer",
  brandHref = "#",
  menus = DEFAULT_MENUS,
  cta = DEFAULT_CTA,
  accent = "#3355ff",
  height = "100svh",
  className,
  children,
}: SwingPanelNavProps) {
  const uid = React.useId().replace(/:/g, "")
  const panelId = "spn-panel-" + uid
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const pillRef = React.useRef(null as HTMLDivElement | null)
  const sheetRefs = React.useRef([] as (HTMLDivElement | null)[])
  const triggerRefs = React.useRef([] as (HTMLButtonElement | null)[])
  const sims = React.useRef([] as Sim[])
  const loop = React.useRef({ raf: 0, last: 0 })
  const leaveTimer = React.useRef(0)
  const [active, setActive] = React.useState(-1)
  const activeRef = React.useRef(active)
  activeRef.current = active
  const menusRef = React.useRef(menus)
  menusRef.current = menus

  const reduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const finePointer = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches

  const tiltOf = (i: number) => {
    const t = menusRef.current[i]?.tilt
    return typeof t === "number" ? t : SWING.rest
  }
  // One sheet per menu; "d" is its angle away from rest. On a swap the new
  // sheet takes over at the old one's angle the moment it is clicked ("kick"),
  // is thrown up along the close curve, and joins the opening spring where
  // the two trajectories meet.
  const simOf = (i: number) => {
    if (!sims.current[i]) sims.current[i] = { mode: "idle", d: SWING.travel, vel: 0, rest: tiltOf(i), from: 0, t: 0, gd: SWING.travel, gv: 0 }
    return sims.current[i]
  }

  const paint = React.useCallback((i: number) => {
    const el = sheetRefs.current[i]
    if (!el) return
    const s = simOf(i)
    const visible = s.mode !== "idle"
    el.style.transform = "rotate(" + (s.rest + s.d).toFixed(3) + "deg)"
    el.style.visibility = visible ? "visible" : "hidden"
    if (visible && s.mode !== "close") el.removeAttribute("inert")
    else el.setAttribute("inert", "")
  }, [])

  const tick = React.useCallback(
    (now: number) => {
      const L = loop.current
      const dt = Math.min(0.25, Math.max(0, (now - L.last) / 1000))
      L.last = now
      let busy = false
      for (let i = 0; i < sims.current.length; i++) {
        const s = sims.current[i]
        if (!s) continue
        if (s.mode === "open") {
          const r = stepSpring(s.d, s.vel, dt)
          s.d = r[0]
          s.vel = r[1]
          if (settled(s.d, s.vel)) {
            s.d = 0
            s.vel = 0
            s.mode = "rest"
          }
        } else if (s.mode === "kick") {
          s.t += dt * 1000
          const g = stepSpring(s.gd, s.gv, dt)
          s.gd = g[0]
          s.gv = g[1]
          s.d = closeTravel(s.from, s.t)
          if (s.d >= s.gd) {
            s.d = s.gd
            s.vel = s.gv
            s.mode = "open"
          }
        } else if (s.mode === "close") {
          s.t += dt * 1000
          s.d = closeTravel(s.from, s.t)
          if (s.d >= SWING.travel) s.mode = "idle"
        } else continue
        paint(i)
        if (s.mode !== "rest" && s.mode !== "idle") busy = true
      }
      L.raf = busy ? requestAnimationFrame(tick) : 0
    },
    [paint],
  )

  const run = React.useCallback(() => {
    const L = loop.current
    if (L.raf) return
    L.last = performance.now()
    L.raf = requestAnimationFrame(tick)
  }, [tick])

  const closeSheet = React.useCallback(
    (i: number) => {
      const s = sims.current[i]
      if (!s || s.mode === "idle" || s.mode === "close") return
      if (reduced()) {
        s.mode = "idle"
        s.d = SWING.travel
        s.vel = 0
      } else {
        s.mode = "close"
        s.from = s.d
        s.vel = 0
        s.t = 0
      }
      paint(i)
    },
    [paint],
  )

  const openMenu = React.useCallback(
    (i: number, focusFirst: boolean) => {
      setActive(i)
      // A sheet that is still showing hands its angle to the new one and hides at once.
      let handed = NaN
      for (let j = 0; j < sims.current.length; j++) {
        const o = sims.current[j]
        if (j === i || !o || o.mode === "idle") continue
        if (!reduced()) handed = o.d
        o.mode = "idle"
        o.d = SWING.travel
        o.vel = 0
        paint(j)
      }
      const s = simOf(i)
      s.rest = tiltOf(i)
      if (reduced()) {
        s.mode = "rest"
        s.d = 0
        s.vel = 0
        paint(i)
        const el = sheetRefs.current[i]
        if (el) {
          el.style.opacity = "0"
          requestAnimationFrame(() => {
            el.style.opacity = "1"
          })
        }
      } else {
        if (s.mode === "idle" && handed === handed) {
          s.mode = "kick"
          s.d = handed
          s.from = handed
          s.t = 0
          s.gd = SWING.travel
          s.gv = 0
        } else {
          if (s.mode === "idle") s.d = SWING.travel
          s.mode = "open"
        }
        s.vel = 0
        paint(i)
        run()
      }
      // Keyboard opens move focus into the sheet.
      if (focusFirst) {
        const first = sheetRefs.current[i]?.querySelector("a") as HTMLAnchorElement | null
        first?.focus({ preventScroll: true })
      }
    },
    [paint, run],
  )

  const closeMenu = React.useCallback(() => {
    setActive(-1)
    for (let j = 0; j < sims.current.length; j++) closeSheet(j)
    if (!reduced()) run()
  }, [closeSheet, run])

  // Escape and outside presses close; cancel the loop on unmount.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || activeRef.current < 0) return
      const back = triggerRefs.current[activeRef.current]
      closeMenu()
      back?.focus({ preventScroll: true })
    }
    const onDown = (e: PointerEvent) => {
      if (activeRef.current < 0) return
      const t = e.target as Element
      if (pillRef.current?.contains(t) || (t.closest && t.closest(".spn-panel"))) return
      closeMenu()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    const L = loop.current
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
      cancelAnimationFrame(L.raf)
      L.raf = 0
      window.clearTimeout(leaveTimer.current)
    }
  }, [closeMenu])

  React.useEffect(() => {
    menus.forEach((m, i) => {
      if (m.links && m.links.length) paint(i)
    })
  }, [menus, paint])

  // On a mouse, leaving the pill and the sheet closes it, as the reference does.
  const onRegionLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !finePointer()) return
    window.clearTimeout(leaveTimer.current)
    leaveTimer.current = window.setTimeout(() => {
      if (activeRef.current >= 0) closeMenu()
    }, 40)
  }
  const onRegionEnter = () => window.clearTimeout(leaveTimer.current)

  return (
    <div
      ref={rootRef}
      className={"spn-root" + (className ? " " + className : "")}
      data-open={active >= 0 ? "" : undefined}
      style={{ height, width: "100%", ["--spn-accent" as string]: accent } as React.CSSProperties}
    >
      <style>{CSS}</style>

      {children ? <div className="spn-stage">{children}</div> : null}

      {menus.map((m, i) => {
        if (!m.links || !m.links.length) return null
        const metrics = sheetMetrics(m.links.length)
        return (
          <div
            key={m.label}
            ref={(el) => {
              sheetRefs.current[i] = el
            }}
            className="spn-arm"
          >
            <div
              id={panelId + "-" + i}
              className="spn-panel"
            style={
              {
                ["--spn-h" as string]: metrics.height + "%",
                ["--spn-top" as string]: metrics.top + "%",
                ["--spn-pitch" as string]: metrics.pitch + "em",
                ["--spn-bottom" as string]: metrics.bottom + "cqw",
                ["--spn-left" as string]: metrics.left + "cqw",
              } as React.CSSProperties
            }
            role="region"
            aria-label={m.label}
            onPointerEnter={onRegionEnter}
            onPointerLeave={onRegionLeave}
          >
            <ul className="spn-links">
              {m.links.map((l) => (
                <li key={l.label}>
                  <a className="spn-link" href={l.href ?? "#"} onClick={() => closeMenu()}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            </div>
          </div>
        )
      })}

      <nav className="spn-bar spn-sans" aria-label="Main">
        <a className="spn-brand" href={brandHref}>
          <Mark />
          <span className="spn-brand-text">{brand}</span>
        </a>
        <div className="spn-right">
          <div ref={pillRef} className="spn-pill" onPointerEnter={onRegionEnter} onPointerLeave={onRegionLeave}>
            {menus.map((m, i) =>
              m.links && m.links.length ? (
                <button
                  key={m.label}
                  ref={(el) => {
                    triggerRefs.current[i] = el
                  }}
                  type="button"
                  className="spn-item spn-sans"
                  aria-expanded={active === i}
                  aria-controls={panelId + "-" + i}
                  onClick={(e) => (active === i ? closeMenu() : openMenu(i, e.detail === 0))}
                >
                  {m.label}
                  <Chevron />
                </button>
              ) : (
                <a key={m.label} className="spn-item" href={m.href ?? "#"}>
                  {m.label}
                </a>
              ),
            )}
          </div>
          {cta ? (
            <a className="spn-cta" href={cta.href}>
              {cta.label}
            </a>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
