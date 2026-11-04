"use client"

import * as React from "react"

// A site header with one shared mega-menu panel. Hover across the top items and
// the panel stays open: it eases to the new menu's height while the content
// slides in from the side you came from, and a small notch glides along the
// top edge to sit under the item you're on.

export type MegaLink = { title: string; desc?: string; icon?: React.ReactNode; href?: string; tag?: string }
export type MegaColumn = { title: string; links: MegaLink[] }
export type MegaFeature = { image: string; kicker?: string; title: string; href?: string; alt?: string }
export type MegaItem = { label: string; href?: string; columns?: MegaColumn[]; feature?: MegaFeature }

export type CompassMegaHeaderProps = {
  items: MegaItem[]
  brand?: React.ReactNode
  /** Right-hand actions, e.g. Log in and a call to action. */
  actions?: React.ReactNode
  accent?: string
  /** Widest the bar and panel get. */
  maxWidth?: number
  className?: string
}

// #region compass
/** Which side a menu's content waits on, relative to the open one. */
export function sideOf(i: number, active: number): "on" | "before" | "after" {
  if (i === active) return "on"
  return i < active ? "before" : "after"
}

/** Horizontal centre of an item from cached offsets, for the notch. */
export function centreOf(box: { left: number; width: number } | undefined): number {
  return box ? box.left + box.width / 2 : 0
}

/** Delay before the panel reacts: instant once open, a short intent pause from closed. */
export function openDelay(isOpen: boolean): number {
  return isOpen ? 0 : 70
}
// #endregion

const FONT =
  "@font-face{font-family:cmh-sans;font-style:normal;font-weight:400 700;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}"

const EASE = "cubic-bezier(.22,1,.36,1)"

const CSS =
  FONT +
  ".cmh-root{position:relative;z-index:20;width:100%;font-family:cmh-sans,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--color-foreground);container-type:inline-size}" +
  ".cmh-wrap{position:relative;max-width:var(--cmh-max);margin:0 auto;padding:12px clamp(12px,2.4cqw,24px) 0}" +
  ".cmh-bar{position:relative;display:flex;align-items:center;gap:clamp(10px,2cqw,28px);height:60px;padding:0 10px 0 18px;border-radius:18px;background:color-mix(in oklab,var(--color-background) 82%,transparent);backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%);box-shadow:0 0 0 1px color-mix(in oklab,var(--color-foreground) 9%,transparent),0 1px 0 color-mix(in oklab,var(--color-background) 70%,white) inset,0 12px 32px -18px rgba(0,0,0,.28);animation:cmh-drop .9s " + EASE + " both}" +
  "@keyframes cmh-drop{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}" +
  ".cmh-brand{display:flex;align-items:center;gap:9px;font-weight:700;font-size:16px;letter-spacing:-.02em;white-space:nowrap}" +
  ".cmh-nav{position:relative;display:flex;align-items:center;gap:2px;margin:0;padding:0;list-style:none}" +
  ".cmh-trig{position:relative;display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 13px;border:0;border-radius:10px;background:transparent;color:color-mix(in oklab,var(--color-foreground) 72%,transparent);font-family:inherit;font-size:14px;font-weight:500;line-height:1;letter-spacing:-.01em;text-decoration:none;cursor:pointer;transition:color .25s,background .25s}" +
  ".cmh-trig:hover,.cmh-trig[aria-expanded=true]{color:var(--color-foreground);background:color-mix(in oklab,var(--color-foreground) 6%,transparent)}" +
  ".cmh-trig:focus-visible{outline:2px solid var(--cmh-accent);outline-offset:1px}" +
  ".cmh-trig svg{width:10px;height:10px;opacity:.6;transition:transform .45s " + EASE + "}" +
  ".cmh-trig[aria-expanded=true] svg{transform:rotate(180deg)}" +
  ".cmh-grow{flex:1}" +
  ".cmh-acts{display:flex;align-items:center;gap:8px}" +
  ".cmh-panel{position:absolute;left:clamp(12px,2.4cqw,24px);right:clamp(12px,2.4cqw,24px);top:calc(100% + 10px);border-radius:20px;background:var(--color-background);box-shadow:0 0 0 1px color-mix(in oklab,var(--color-foreground) 9%,transparent),0 30px 60px -24px rgba(0,0,0,.35),0 12px 24px -16px rgba(0,0,0,.2);opacity:0;transform:translateY(-8px) scale(.985);transform-origin:50% 0;pointer-events:none;transition:opacity .3s ease,transform .5s " + EASE + ",visibility 0s linear .5s;visibility:hidden}" +
  ".cmh-root[data-open] .cmh-panel{opacity:1;transform:none;pointer-events:auto;visibility:visible;transition:opacity .25s ease,transform .5s " + EASE + ",visibility 0s}" +
  ".cmh-panel::before{content:'';position:absolute;left:0;right:0;top:-12px;height:12px}" +
  ".cmh-notch{position:absolute;top:-6px;left:0;width:12px;height:12px;margin-left:-6px;border-radius:3px 0 0 0;background:var(--color-background);box-shadow:-1px -1px 0 color-mix(in oklab,var(--color-foreground) 9%,transparent);transform:translateX(var(--cmh-x)) rotate(45deg);transition:transform .5s " + EASE + "}" +
  ".cmh-clip{position:relative;overflow:hidden;border-radius:inherit;transition:height .5s " + EASE + "}" +
  ".cmh-menu{position:absolute;left:0;right:0;top:0;transition:opacity .28s ease,transform .5s " + EASE + "}" +
  ".cmh-menu[data-side=on]{opacity:1;transform:none;transition-delay:.05s,0s}" +
  ".cmh-menu[data-side=before]{opacity:0;transform:translateX(-56px);pointer-events:none}" +
  ".cmh-menu[data-side=after]{opacity:0;transform:translateX(56px);pointer-events:none}" +
  ".cmh-grid{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr)) minmax(0,.9fr);gap:8px;padding:14px}" +
  ".cmh-grid[data-nofeat]{grid-template-columns:repeat(var(--cols),minmax(0,1fr))}" +
  ".cmh-col{padding:8px 4px}" +
  ".cmh-col>h3{margin:0 0 6px 12px;font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--color-muted-foreground)}" +
  ".cmh-link{display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border-radius:12px;color:inherit;text-decoration:none;transition:background .25s}" +
  ".cmh-link:hover,.cmh-link:focus-visible{background:color-mix(in oklab,var(--color-foreground) 5%,transparent);outline:none}" +
  ".cmh-link:focus-visible{box-shadow:inset 0 0 0 2px var(--cmh-accent)}" +
  ".cmh-ico{flex:none;display:grid;place-items:center;width:36px;height:36px;border-radius:10px;color:var(--cmh-accent);background:color-mix(in oklab,var(--cmh-accent) 11%,var(--color-background));box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--cmh-accent) 18%,transparent);transition:transform .45s " + EASE + ",background .3s,color .3s}" +
  ".cmh-ico svg{width:18px;height:18px}" +
  ".cmh-link:hover .cmh-ico{transform:translateY(-2px) rotate(-4deg);background:var(--cmh-accent);color:#fff}" +
  ".cmh-lt{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;letter-spacing:-.01em}" +
  ".cmh-tag{padding:2px 7px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--cmh-accent);background:color-mix(in oklab,var(--cmh-accent) 12%,transparent)}" +
  ".cmh-ld{display:block;margin-top:3px;font-size:13px;line-height:1.4;color:var(--color-muted-foreground)}" +
  ".cmh-feat{position:relative;display:block;min-height:230px;border-radius:14px;overflow:hidden;color:#fff;text-decoration:none;isolation:isolate}" +
  ".cmh-feat>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;z-index:-2;transition:transform 1.2s " + EASE + "}" +
  ".cmh-feat::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.72))}" +
  ".cmh-feat:hover>img{transform:scale(1.06)}" +
  ".cmh-feat:focus-visible{outline:2px solid var(--cmh-accent);outline-offset:2px}" +
  ".cmh-fk{position:absolute;left:16px;top:14px;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.03em;background:rgba(10,10,12,.42);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}" +
  ".cmh-ft{position:absolute;left:16px;right:16px;bottom:14px;font-size:16px;font-weight:600;line-height:1.25;letter-spacing:-.015em}" +
  ".cmh-ft i{display:inline-block;margin-left:6px;font-style:normal;transition:transform .45s " + EASE + "}" +
  ".cmh-feat:hover .cmh-ft i{transform:translateX(4px)}" +
  "@container (max-width:760px){.cmh-bar{flex-wrap:wrap;height:auto;padding:10px 10px 6px 14px;row-gap:6px}.cmh-nav{order:3;flex-basis:100%;overflow-x:auto;scrollbar-width:none;margin:0 -6px}.cmh-grow{display:none}.cmh-acts{margin-left:auto}.cmh-grid,.cmh-grid[data-nofeat]{grid-template-columns:1fr}.cmh-feat{min-height:150px}.cmh-notch{display:none}.cmh-hide-sm{display:none}.cmh-clip{max-height:min(68svh,560px);overflow-y:auto;overscroll-behavior:contain}}" +
  "@media (prefers-reduced-motion:reduce){.cmh-bar{animation:none}.cmh-panel,.cmh-notch,.cmh-clip,.cmh-menu,.cmh-trig svg,.cmh-ico,.cmh-feat>img{transition-duration:.01ms!important;transition-delay:0s!important}.cmh-menu[data-side]{transform:none}}"

const Caret = () => (
  <svg viewBox="0 0 10 10" aria-hidden="true">
    <path d="M2 3.5 5 6.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function CompassMegaHeader({ items, brand = "Brand", actions, accent = "#e4572e", maxWidth = 1180, className }: CompassMegaHeaderProps) {
  const [active, setActive] = React.useState(-1)
  const [shown, setShown] = React.useState(0)
  const [heights, setHeights] = React.useState({} as Record<number, number>)
  const [boxes, setBoxes] = React.useState([] as { left: number; width: number }[])
  const trigs = React.useRef([] as (HTMLElement | null)[])
  const menus = React.useRef([] as (HTMLDivElement | null)[])
  const panel = React.useRef(null as HTMLDivElement | null)
  const timer = React.useRef(0)
  const id = React.useId()
  const open = active > -1

  // Item positions and menu heights are measured on mount and whenever something
  // resizes, never in the pointer handlers. Those only read the cached numbers.
  React.useEffect(() => {
    const measure = () => {
      const p = panel.current
      if (!p) return
      const stop = p.offsetParent
      // Sum offsets up to the panel's own offset parent, then make it panel-relative.
      const leftIn = (el: HTMLElement) => {
        let x = 0
        let n: Element | null = el
        while (n && n !== stop && n instanceof HTMLElement) {
          x += n.offsetLeft
          n = n.offsetParent
        }
        return x
      }
      setBoxes(trigs.current.map((t) => (t ? { left: leftIn(t) - p.offsetLeft, width: t.offsetWidth } : { left: 0, width: 0 })))
    }
    const ro = new ResizeObserver((entries) => {
      const next: Record<number, number> = {}
      let moved = false
      for (const e of entries) {
        const i = menus.current.indexOf(e.target as HTMLDivElement)
        if (i > -1) next[i] = e.borderBoxSize?.[0]?.blockSize ?? e.contentRect.height
        else moved = true
      }
      if (Object.keys(next).length) setHeights((h) => ({ ...h, ...next }))
      if (moved) measure()
    })
    for (const m of menus.current) if (m) ro.observe(m)
    for (const t of trigs.current) if (t) ro.observe(t)
    if (panel.current) ro.observe(panel.current)
    measure()
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [items.length])

  const show = (i: number) => {
    window.clearTimeout(timer.current)
    if (!items[i]?.columns) {
      hide()
      return
    }
    timer.current = window.setTimeout(() => {
      setActive(i)
      setShown(i)
    }, openDelay(open))
  }
  const hide = (delay = 0) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setActive(-1), delay)
  }

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  React.useEffect(() => {
    menus.current.forEach((m, i) => m?.toggleAttribute("inert", i !== active))
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        trigs.current[active]?.focus()
        hide()
      }
    }
    const onDown = (e: PointerEvent) => {
      const root = panel.current?.parentElement
      if (root && !root.contains(e.target as Node)) hide()
    }
    window.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open, active])

  const onTrigKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive(i)
      setShown(i)
      window.setTimeout(() => (menus.current[i]?.querySelector("a") as HTMLElement | null)?.focus(), 60)
    }
  }

  return (
    <div
      className={"cmh-root" + (className ? " " + className : "")}
      style={{ ["--cmh-accent" as string]: accent, ["--cmh-max" as string]: maxWidth + "px" }}
      data-open={open ? "" : undefined}
    >
      <style>{CSS}</style>
      <div className="cmh-wrap" onPointerLeave={(e) => e.pointerType === "mouse" && hide(160)}>
        <header className="cmh-bar">
          <div className="cmh-brand">{brand}</div>
          <ul className="cmh-nav">
            {items.map((it, i) => (
              <li key={it.label} onPointerEnter={(e) => e.pointerType === "mouse" && show(i)}>
                {it.columns ? (
                  <button
                    ref={(el) => {
                      trigs.current[i] = el
                    }}
                    type="button"
                    className="cmh-trig"
                    aria-expanded={active === i}
                    aria-controls={id + "-m-" + i}
                    onClick={() => {
                      if (active === i) hide()
                      else {
                        window.clearTimeout(timer.current)
                        setActive(i)
                        setShown(i)
                      }
                    }}
                    onKeyDown={(e) => onTrigKey(e, i)}
                  >
                    {it.label}
                    <Caret />
                  </button>
                ) : (
                  <a
                    ref={(el) => {
                      trigs.current[i] = el
                    }}
                    className="cmh-trig"
                    href={it.href ?? "#"}
                  >
                    {it.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div className="cmh-grow" />
          {actions ? <div className="cmh-acts">{actions}</div> : null}
        </header>

        <div ref={panel} className="cmh-panel" style={{ ["--cmh-x" as string]: centreOf(boxes[shown]) + "px" }}>
          <span className="cmh-notch" aria-hidden="true" />
          <div className="cmh-clip" style={{ height: heights[shown] ?? 0 }}>
            {items.map((it, i) =>
              it.columns ? (
                <div
                  key={it.label}
                  id={id + "-m-" + i}
                  ref={(el) => {
                    menus.current[i] = el
                  }}
                  className="cmh-menu"
                  data-side={sideOf(i, shown)}
                  aria-hidden={i !== active}
                >
                  <div className="cmh-grid" data-nofeat={it.feature ? undefined : ""} style={{ ["--cols" as string]: it.columns.length }}>
                    {it.columns.map((col) => (
                      <div key={col.title} className="cmh-col">
                        <h3>{col.title}</h3>
                        {col.links.map((l) => (
                          <a key={l.title} className="cmh-link" href={l.href ?? "#"}>
                            {l.icon ? <span className="cmh-ico">{l.icon}</span> : null}
                            <span>
                              <span className="cmh-lt">
                                {l.title}
                                {l.tag ? <span className="cmh-tag">{l.tag}</span> : null}
                              </span>
                              {l.desc ? <span className="cmh-ld">{l.desc}</span> : null}
                            </span>
                          </a>
                        ))}
                      </div>
                    ))}
                    {it.feature ? (
                      <a className="cmh-feat" href={it.feature.href ?? "#"}>
                        <img src={it.feature.image} alt={it.feature.alt ?? ""} draggable={false} />
                        {it.feature.kicker ? <span className="cmh-fk">{it.feature.kicker}</span> : null}
                        <span className="cmh-ft">
                          {it.feature.title}
                          <i aria-hidden="true">→</i>
                        </span>
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
