"use client"

import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"

// #region flight
/** Fixed nav geometry (px). Fixed widths let the cards know where to fly from without
 * measuring anything: each item's centre is a constant offset from the nav's centre. */
export const NAV = { pad: 6, brand: 112, brandNarrow: 44, items: [84, 92, 88] }

/** Centre of nav item `i`, relative to the nav's centre. */
export function itemCentre(i: number, narrow: boolean) {
  const brand = narrow ? NAV.brandNarrow : NAV.brand
  const total = NAV.pad * 2 + brand + NAV.items.reduce((a, b) => a + b, 0)
  let x = -total / 2 + NAV.pad + brand
  for (let k = 0; k < i; k++) x += NAV.items[k]
  return x + NAV.items[i] / 2
}

/** When each card leaves the item and lands, in ms after the menu opens. */
export function flightTimes(i: number) {
  const start = 110 + i * 110
  return { start, land: start + 780 }
}

/** Unattended demo: which menu is open at time t (ms), or -1 for closed. */
export function ghostMenu(t: number) {
  const c = t % 9000
  if (c < 900) return -1
  if (c < 3600) return 2
  if (c < 5800) return 0
  if (c < 8000) return 1
  return -1
}
// #endregion

export type FlightCard = { title: string; sub: string; href?: string; art: "circles" | "frame" | "grid" | "arch" | "stripes" | "dots" | "lines" | "wave" | "ring" }
export type FlightMenu = { label: string; cards: FlightCard[] }

export type CardFlightHeaderProps = {
  brand?: { mark: string; name: string; href?: string }
  menus?: FlightMenu[]
  /** Cycle the menus on its own until someone interacts. */
  autoPlay?: boolean
  /** Open this menu on mount (index), e.g. for a screenshot. */
  defaultOpen?: number
  /** Minimum height of the drop-down panel (a CSS length). */
  panelHeight?: string
  className?: string
  style?: CSSProperties
}

const MENUS: FlightMenu[] = [
  {
    label: "Work",
    cards: [
      { title: "Client 1", sub: "Brand system", href: "#", art: "arch" },
      { title: "Client 2", sub: "Product site", href: "#", art: "stripes" },
      { title: "Client 3", sub: "Motion kit", href: "#", art: "dots" },
    ],
  },
  {
    label: "Journal",
    cards: [
      { title: "Notes", sub: "Short and often", href: "#", art: "lines" },
      { title: "Talks", sub: "2 this year", href: "#", art: "wave" },
      { title: "Reading", sub: "On the shelf", href: "#", art: "ring" },
    ],
  },
  {
    label: "Studio",
    cards: [
      { title: "About", sub: "Who I am", href: "#", art: "circles" },
      { title: "Workshops", sub: "6 coming up", href: "#", art: "frame" },
      { title: "Contact", sub: "Start a project", href: "mailto:kedhareswer.12110626@gmail.com", art: "grid" },
    ],
  },
]

const ART_BG: Record<FlightCard["art"], string> = {
  circles: "#c9c6f4",
  frame: "#ece0c8",
  grid: "#c7e6df",
  arch: "#f1cfc4",
  stripes: "#cfe0f6",
  dots: "#e4d6f1",
  lines: "#d9e6c8",
  wave: "#c8dcef",
  ring: "#f2dcc0",
}

const CSS =
  ".cfh-root{position:relative;width:100%;z-index:5;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;container-type:inline-size}" +
  ".cfh-bar{position:relative;z-index:2;display:flex;justify-content:center;padding:20px 16px 0}" +
  ".cfh-nav{display:flex;align-items:center;height:52px;padding:0 6px;border-radius:999px;background:#fff;color:#1b1d26;" +
  "box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 10px 30px -12px rgba(20,24,60,.35),0 0 0 1px rgba(20,24,60,.06)}" +
  ".cfh-brand{display:flex;align-items:center;gap:9px;width:112px;height:40px;padding-left:8px;box-sizing:border-box;color:inherit;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:-.01em}" +
  ".cfh-mark{display:grid;place-items:center;flex:none;width:26px;height:26px;border-radius:8px;background:#5b4cf0;color:#fff;font-size:13px;font-weight:700}" +
  ".cfh-item{position:relative;height:40px;padding:0;border:0;border-radius:999px;background:transparent;color:#5d6273;font:inherit;font-size:14.5px;cursor:pointer;" +
  "transition:background-color .25s,color .25s;outline:none}" +
  ".cfh-item:hover,.cfh-item:focus-visible{background:#e9ebf2;color:#1b1d26}" +
  ".cfh-item:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px #5b4cf0}" +
  ".cfh-item[aria-expanded=true]{background:#14151b;color:#fff}" +
  ".cfh-panel{position:absolute;left:0;right:0;top:46px;padding:70px 24px 56px;box-sizing:border-box;min-height:var(--panel-h);pointer-events:none;visibility:hidden;" +
  "transition:visibility 0s linear .55s}" +
  ".cfh-panel[data-open=true]{visibility:visible;transition:visibility 0s}" +
  ".cfh-wash{position:absolute;inset:-46px 0 0 0;z-index:1;background:linear-gradient(180deg,#dde3f1 0%,#e7ebf5 55%,#eef1f7 100%);" +
  "clip-path:inset(0 0 100% 0);transition:clip-path .55s cubic-bezier(.65,0,.35,1)}" +
  ".cfh-panel[data-open=true] .cfh-wash{clip-path:inset(0 0 0 0)}" +
  ".cfh-row{--ix:var(--ixw);--row:min(100cqw - 48px,1120px);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;pointer-events:auto;position:relative;z-index:3;width:var(--row);margin:0 auto}" +
  ".cfh-card{--slot:calc((var(--i) - 1) * (var(--row) - 48px) / 3 + (var(--i) - 1) * 24px);display:flex;flex-direction:column;gap:14px;color:#22252f;text-decoration:none;transform-origin:50% 0;outline:none;" +
  "animation:cfh-fly .78s cubic-bezier(.3,.7,.2,1) both;animation-delay:calc(110ms + var(--i) * 110ms)}" +
  // the cards of the menu you just left fly back into their own item, last card first
  ".cfh-leaving{position:absolute;left:0;right:0;top:70px;pointer-events:none}" +
  ".cfh-leaving .cfh-card{animation:cfh-back .34s cubic-bezier(.55,0,.75,.3) both;animation-delay:calc((2 - var(--i)) * 40ms)}" +
  // on a switch the new cards wait until the old ones are nearly home, so the two sets never cross
  ".cfh-row.cfh-after .cfh-card{animation-delay:calc(360ms + var(--i) * 110ms)}" +
  ".cfh-card:focus-visible .cfh-art{box-shadow:0 0 0 3px #5b4cf0}" +
  ".cfh-art{position:relative;aspect-ratio:4/3;border-radius:24px;overflow:hidden;box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 18px 40px -24px rgba(40,46,90,.45);transition:transform .45s cubic-bezier(.2,.9,.25,1.1),box-shadow .45s}" +
  ".cfh-card:hover .cfh-art{transform:translateY(-6px);box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 28px 50px -24px rgba(40,46,90,.55)}" +
  ".cfh-meta{display:flex;align-items:center;gap:12px;padding:0 4px}" +
  ".cfh-go{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:50%;border:1px solid rgba(34,37,47,.16);color:#22252f;font-size:13px;transition:background-color .25s,color .25s,border-color .25s}" +
  ".cfh-card:first-child .cfh-go,.cfh-card:hover .cfh-go{background:#5b4cf0;border-color:#5b4cf0;color:#fff}" +
  ".cfh-t{display:flex;flex-direction:column;gap:2px;min-width:0}" +
  ".cfh-title{font-size:16px;font-weight:600;letter-spacing:-.01em}" +
  ".cfh-sub{font-size:13.5px;color:#7c8295}" +
  ".cfh-s{position:absolute;background:rgba(255,255,255,.72)}" +
  // out of the pill as a small frosted ghost, tipped back, blurred by its own speed; it sharpens as it lands
  "@keyframes cfh-fly{0%{opacity:0;filter:blur(10px);transform:perspective(900px) translate(calc(var(--ix) - var(--slot)),-92px) rotateX(28deg) scale(.14) rotate(-9deg)}" +
  "12%{opacity:.45}" +
  "50%{opacity:.6;filter:blur(3px);transform:perspective(900px) translate(calc((var(--ix) - var(--slot)) * .32),-30px) rotateX(12deg) scale(.62) rotate(-3.5deg)}" +
  "100%{opacity:1;filter:blur(0);transform:perspective(900px) translate(0,0) rotateX(0) scale(1) rotate(0)}}" +
  "@keyframes cfh-back{0%{opacity:1;filter:blur(0);transform:perspective(900px) translate(0,0) rotateX(0) scale(1) rotate(0)}" +
  "100%{opacity:0;filter:blur(8px);transform:perspective(900px) translate(calc(var(--ix) - var(--slot)),-92px) rotateX(28deg) scale(.14) rotate(-9deg)}}" +
  "@container (max-width:560px){.cfh-brand{width:44px}.cfh-name{display:none}" +
  ".cfh-row{--ix:var(--ixn)}.cfh-leaving{top:56px}" +
  ".cfh-panel{padding:56px 16px 28px}.cfh-row{--row:calc(100cqw - 32px);grid-template-columns:1fr;gap:12px}" +
  ".cfh-card{--slot:0px;flex-direction:row;align-items:center;gap:14px}.cfh-art{width:96px;flex:none;border-radius:14px}.cfh-meta{flex:1;padding:0}}" +
  "@media (prefers-reduced-motion:reduce){.cfh-card{animation:cfh-fade .2s both}.cfh-leaving{display:none}.cfh-panel,.cfh-panel[data-open=true]{transition:none}.cfh-art{transition:none}}" +
  "@keyframes cfh-fade{from{opacity:0}to{opacity:1}}"

function Art({ kind }: { kind: FlightCard["art"] }) {
  const s = (st: CSSProperties, k: number) => <span key={k} className="cfh-s" style={st} />
  const shapes: CSSProperties[] =
    kind === "circles"
      ? [0, 1, 2].map((i) => ({ left: 14 + i * 20 + "%", top: "26%", width: "34%", aspectRatio: "1", borderRadius: "50%" }))
      : kind === "frame"
        ? [{ left: "18%", top: "26%", width: "64%", height: "48%", borderRadius: 14, background: "transparent", border: "12px solid rgba(255,255,255,.72)" }]
        : kind === "grid"
          ? [0, 1, 2, 3].map((i) => ({ left: 22 + (i % 2) * 30 + "%", top: 14 + Math.floor(i / 2) * 38 + "%", width: "26%", height: "32%", borderRadius: 10 }))
          : kind === "arch"
            ? [{ left: "30%", top: "18%", width: "40%", height: "82%", borderRadius: "999px 999px 0 0" }]
            : kind === "stripes"
              ? [0, 1, 2, 3].map((i) => ({ left: "14%", top: 18 + i * 18 + "%", width: 72 - i * 12 + "%", height: "10%", borderRadius: 99 }))
              : kind === "dots"
                ? Array.from({ length: 9 }, (_, i) => ({ left: 22 + (i % 3) * 22 + "%", top: 18 + Math.floor(i / 3) * 24 + "%", width: "12%", aspectRatio: "1", borderRadius: "50%" }))
                : kind === "lines"
                  ? [0, 1, 2].map((i) => ({ left: "16%", top: 24 + i * 20 + "%", width: i === 2 ? "40%" : "68%", height: "8%", borderRadius: 99 }))
                  : kind === "wave"
                    ? [0, 1, 2, 3, 4].map((i) => ({ left: 14 + i * 15 + "%", bottom: "18%", width: "10%", height: [30, 55, 70, 45, 25][i] + "%", borderRadius: 99 }))
                    : [{ left: "28%", top: "16%", width: "44%", aspectRatio: "1", borderRadius: "50%", background: "transparent", border: "14px solid rgba(255,255,255,.72)" }]
  return (
    <span className="cfh-art" style={{ background: ART_BG[kind] }} aria-hidden="true">
      {shapes.map(s)}
    </span>
  )
}

export default function CardFlightHeader({
  brand = { mark: "K", name: "Kedhar", href: "#" },
  menus = MENUS,
  autoPlay = false,
  defaultOpen = -1,
  panelHeight = "min(560px, 78svh)",
  className,
  style,
}: CardFlightHeaderProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [run, setRun] = useState(0)
  const [leaving, setLeaving] = useState(null as { m: number; run: number } | null)
  const [after, setAfter] = useState(false)
  const touched = useRef(false)
  const now = useRef({ open: defaultOpen, run: 0 })
  now.current = { open, run }
  const leaveTimer = useRef(0 as number)
  // switch menus: the old cards fly home while the new ones fly out
  const go = (next: number) => {
    const cur = now.current
    if (next === cur.open) return
    setAfter(cur.open >= 0)
    if (cur.open >= 0) {
      setLeaving({ m: cur.open, run: cur.run })
      window.clearTimeout(leaveTimer.current)
      leaveTimer.current = window.setTimeout(() => setLeaving(null), 560)
    }
    setOpen(next)
    setRun((r) => r + 1)
  }
  const closeTimer = useRef(0 as number)
  const list = menus.slice(0, 3)

  useEffect(() => {
    if (!autoPlay) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduce.matches) return
    const born = performance.now()
    let last = -2
    const id = window.setInterval(() => {
      if (touched.current) return window.clearInterval(id)
      const m = ghostMenu(performance.now() - born)
      if (m !== last) {
        last = m
        go(m)
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [autoPlay])

  const show = (i: number) => {
    touched.current = true
    window.clearTimeout(closeTimer.current)
    go(i)
  }
  const hideSoon = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => go(-1), 160)
  }
  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current)
      window.clearTimeout(leaveTimer.current)
    },
    [],
  )
  const launch = (m: number) => ({ ["--ixw" as string]: itemCentre(m, false) + "px", ["--ixn" as string]: itemCentre(m, true) + "px" }) as CSSProperties
  const cardsOf = (m: number, live: boolean) =>
    list[m].cards.slice(0, 3).map((c, i) => {
      const body = (
        <>
          <Art kind={c.art} />
          <span className="cfh-meta">
            <span className="cfh-go" aria-hidden="true">↗</span>
            <span className="cfh-t">
              <span className="cfh-title">{c.title}</span>
              <span className="cfh-sub">{c.sub}</span>
            </span>
          </span>
        </>
      )
      const st = { ["--i" as string]: i } as CSSProperties
      return live ? (
        <a key={c.title} className="cfh-card" href={c.href ?? "#"} style={st}>
          {body}
        </a>
      ) : (
        <div key={c.title} className="cfh-card" style={st}>
          {body}
        </div>
      )
    })

  const menu = open >= 0 ? list[open] : null
  return (
    <header
      className={"cfh-root" + (className ? " " + className : "")}
      style={{ ["--panel-h" as string]: panelHeight, ...style } as CSSProperties}
      onPointerLeave={() => {
        if (touched.current) hideSoon()
      }}
      onPointerEnter={() => window.clearTimeout(closeTimer.current)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          touched.current = true
          go(-1)
        }
      }}
    >
      <style>{CSS}</style>
      <div className="cfh-bar">
        <nav className="cfh-nav" aria-label="Main">
          <a className="cfh-brand" href={brand.href}>
            <span className="cfh-mark" aria-hidden="true">{brand.mark}</span>
            <span className="cfh-name">{brand.name}</span>
          </a>
          {list.map((m, i) => (
            <button
              key={m.label}
              type="button"
              className="cfh-item"
              style={{ width: [84, 92, 88][i] }}
              aria-expanded={open === i}
              aria-controls="cfh-panel"
              onPointerEnter={() => show(i)}
              onFocus={() => show(i)}
              onClick={() => {
                touched.current = true
                if (open === i) go(-1)
                else show(i)
              }}
            >
              {m.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="cfh-panel" id="cfh-panel" role="region" aria-label={menu ? menu.label : "Menu"} data-open={open >= 0}>
        <div className="cfh-wash" aria-hidden="true" />
        {leaving && leaving.m !== open && list[leaving.m] ? (
          <div className="cfh-row cfh-leaving" key={"l" + leaving.m + ":" + leaving.run} style={launch(leaving.m)} aria-hidden="true">
            {cardsOf(leaving.m, false)}
          </div>
        ) : null}
        {menu ? (
          <div className={"cfh-row" + (after ? " cfh-after" : "")} key={open + ":" + run} style={launch(open)}>
            {cardsOf(open, true)}
          </div>
        ) : null}
      </div>
    </header>
  )
}

