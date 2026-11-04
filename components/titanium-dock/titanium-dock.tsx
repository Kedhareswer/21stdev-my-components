"use client"

import React, { useEffect, useRef, useState } from "react"

export interface DockItem {
  id: string
  label: string
  /** An icon node; 24×24 stroked SVGs read best. Omit to use a built-in icon by id. */
  icon?: React.ReactNode
}

export interface TitaniumDockProps {
  items?: DockItem[]
  /** Controlled active id. */
  value?: string
  defaultValue?: string
  onChange?: (id: string) => void
  /** "silver" brushed aluminium or "graphite" dark titanium. */
  finish?: "silver" | "graphite"
  /** How much the hovered icon grows, 0 turns magnification off. */
  magnify?: number
  className?: string
  "aria-label"?: string
}

const SIZE = 62
const GAP = 12
const PAD = 10

const CSS =
  ".tdk-root{--tdk-s:" + SIZE + "px;--tdk-g:" + GAP + "px;--tdk-a:#f6f7f9;--tdk-b:#d4d7dc;--tdk-c:#b9bdc4;--tdk-ink:#2b2e33;--tdk-dim:#7b8089;--tdk-line:rgba(255,255,255,.55);--tdk-shadow:rgba(30,35,45,.28);position:relative;display:inline-flex;max-width:100%;font-family:'Geist','Inter','SF Pro Text','Segoe UI Variable Text',ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}" +
  ".tdk-root[data-finish=graphite]{--tdk-a:#5b5f66;--tdk-b:#33363b;--tdk-c:#1d1f23;--tdk-ink:#f2f3f5;--tdk-dim:#9ca1aa;--tdk-line:rgba(255,255,255,.14);--tdk-shadow:rgba(0,0,0,.6)}" +
  ".tdk-bar{position:relative;display:flex;gap:var(--tdk-g);padding:" + PAD + "px;border-radius:" + (SIZE / 2 + PAD) + "px;isolation:isolate;" +
  // brushed metal: fine horizontal grain over a vertical light falloff, a pointer-following sheen, a machined rim
  "background:radial-gradient(160px 70px at var(--tdk-hx,50%) 0%,rgba(255,255,255,.55),transparent 70%),repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 1px,rgba(0,0,0,.035) 1px 2px,transparent 2px 3px),linear-gradient(180deg,var(--tdk-a),var(--tdk-b) 55%,var(--tdk-c));" +
  "box-shadow:inset 0 1px 0 var(--tdk-line),inset 0 -1px 0 rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.08),0 2px 3px var(--tdk-shadow),0 18px 36px -16px var(--tdk-shadow),0 40px 60px -40px var(--tdk-shadow)}" +
  ".tdk-root[data-finish=graphite] .tdk-bar{background:radial-gradient(160px 70px at var(--tdk-hx,50%) 0%,rgba(255,255,255,.16),transparent 70%),repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,rgba(0,0,0,.08) 1px 2px,transparent 2px 3px),linear-gradient(180deg,var(--tdk-a),var(--tdk-b) 50%,var(--tdk-c))}" +
  // the bezel: a raised, polished cup with an anodised heat-tint rim that springs between items
  ".tdk-bezel{position:absolute;left:" + PAD + "px;top:" + PAD + "px;width:var(--tdk-s);height:var(--tdk-s);border-radius:20px;z-index:0;pointer-events:none;" +
  "transform:translateX(calc(var(--tdk-i)*(var(--tdk-s) + var(--tdk-g)))) scaleX(var(--tdk-sx,1));transition:transform .62s cubic-bezier(.3,1.35,.4,1)}" +
  ".tdk-bezel::before{content:'';position:absolute;inset:-2px;border-radius:22px;padding:2px;background:conic-gradient(from var(--tdk-rot,200deg),#f0c27a,#d47ccf,#6c7cff,#58d5e6,#f0c27a);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);filter:saturate(1.15);transition:--tdk-rot .9s cubic-bezier(.3,1,.4,1)}" +
  ".tdk-bezel::after{content:'';position:absolute;inset:0;border-radius:20px;background:radial-gradient(120% 90% at 30% 0%,#ffffff,#eceef1 40%,#cdd1d7 100%);box-shadow:inset 0 1px 0 #fff,inset 0 -2px 4px rgba(0,0,0,.12),0 2px 4px rgba(20,25,35,.25),0 10px 18px -8px rgba(20,25,35,.45)}" +
  ".tdk-root[data-finish=graphite] .tdk-bezel::after{background:radial-gradient(120% 90% at 30% 0%,#7a7f88,#4b4f56 45%,#2c2f34 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -2px 5px rgba(0,0,0,.4),0 2px 4px rgba(0,0,0,.5),0 10px 18px -8px rgba(0,0,0,.7)}" +
  "@property --tdk-rot{syntax:'<angle>';inherits:true;initial-value:200deg}" +
  ".tdk-item{position:relative;z-index:1;display:grid;place-items:center;width:var(--tdk-s);height:var(--tdk-s);flex:none;border:0;border-radius:19px;background:none;color:var(--tdk-dim);cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;transition:color .3s}" +
  ".tdk-item:hover,.tdk-item[aria-current=true]{color:var(--tdk-ink)}" +
  ".tdk-item:focus-visible{box-shadow:0 0 0 2px var(--tdk-ink)}" +
  ".tdk-ico{display:block;width:26px;height:26px;transform:translateY(calc(var(--tdk-m,0)*-7px)) scale(calc(1 + var(--tdk-m,0)*var(--tdk-mag)));transition:transform .28s cubic-bezier(.3,1.4,.5,1)}" +
  ".tdk-ico svg{display:block;width:100%;height:100%}" +
  ".tdk-item[aria-current=true] .tdk-ico{filter:drop-shadow(0 1px 0 rgba(255,255,255,.6))}" +
  ".tdk-item:active .tdk-ico{transform:scale(.88);transition-duration:.1s}" +
  ".tdk-root[data-finish=graphite] .tdk-item[aria-current=true] .tdk-ico{filter:drop-shadow(0 1px 0 rgba(0,0,0,.6))}" +
  // tooltip
  ".tdk-tip{position:absolute;left:50%;bottom:calc(100% + 14px);padding:5px 10px;border-radius:8px;font-size:12px;font-weight:560;white-space:nowrap;color:#f6f7f9;background:linear-gradient(180deg,#3a3d43,#202226);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 6px 14px -6px rgba(0,0,0,.5);opacity:0;transform:translate(-50%,6px) scale(.92);transition:opacity .18s,transform .3s cubic-bezier(.3,1.5,.5,1);pointer-events:none}" +
  ".tdk-item:hover .tdk-tip,.tdk-item:focus-visible .tdk-tip{opacity:1;transform:translate(-50%,0)}" +
  // the small machined dot under the active item
  ".tdk-dot{position:absolute;left:50%;bottom:-5px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:var(--tdk-ink);opacity:0;transform:scale(0);transition:opacity .3s,transform .4s cubic-bezier(.3,1.6,.5,1)}" +
  ".tdk-item[aria-current=true] .tdk-dot{opacity:.55;transform:none}" +
  ".tdk-root:not([data-in]) .tdk-bar{opacity:0;transform:translateY(14px) scale(.96)}.tdk-root[data-in] .tdk-bar{transition:opacity .5s,transform .8s cubic-bezier(.3,1.4,.5,1)}" +
  ".tdk-root:not([data-in]) .tdk-item{opacity:0;transform:translateY(10px)}.tdk-root[data-in] .tdk-item{transition:color .3s,opacity .4s calc(var(--n)*55ms + .12s),transform .6s calc(var(--n)*55ms + .12s) cubic-bezier(.3,1.5,.5,1)}" +
  "@media (max-width:420px){.tdk-root{--tdk-s:48px;--tdk-g:5px}}" +
  "@media (prefers-reduced-motion:reduce){.tdk-bezel,.tdk-ico,.tdk-tip,.tdk-bar,.tdk-item,.tdk-bezel::before{transition-duration:.01ms!important;transition-delay:0s!important}.tdk-ico{transform:none!important}}"

// #region dock
/** Centre x of item i, relative to the bar's left edge. */
export function centreOf(i: number, size = SIZE, gap = GAP, pad = PAD) {
  return pad + i * (size + gap) + size / 2
}

/** Magnification 0..1 for an item whose centre is `d` px from the pointer: a smooth cosine falloff over `reach`. */
export function falloff(d: number, reach = 130) {
  const x = Math.abs(d) / reach
  return x >= 1 ? 0 : +(0.5 + 0.5 * Math.cos(Math.PI * x)).toFixed(3)
}

/** The next index for an arrow / Home / End key, wrapping. -1 when the key isn't a dock key. */
export function keyStep(key: string, i: number, n: number) {
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return -1
}
// #endregion

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const
const ICONS: Record<string, React.ReactNode> = {
  orders: (
    <svg viewBox="0 0 24 24" {...S}><path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.5Z" /><path d="M9 8h6M9 11.5h6M9 15h3.5" /></svg>
  ),
  help: (
    <svg viewBox="0 0 24 24" {...S}><path d="M4.5 6.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H11l-4.5 4v-4h0a2 2 0 0 1-2-2Z" /><path d="M10.2 8.3a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4M12 13.6v.1" /></svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" {...S}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="10.2" r="2.6" /><path d="M7.6 17.2c.9-1.8 2.5-2.7 4.4-2.7s3.5.9 4.4 2.7" /></svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" {...S}><path d="M20 4 3.8 10.6l6.4 2.6 2.6 6.4Z" /><path d="m10.2 13.2 4.4-4.4" /><path d="M18.5 15.5v4M16.5 17.5h4" /></svg>
  ),
  done: (
    <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="8.5" /><path d="m8.4 12.3 2.5 2.5 4.8-5" /></svg>
  ),
}

const ITEMS: DockItem[] = [
  { id: "orders", label: "Orders" },
  { id: "help", label: "Help" },
  { id: "profile", label: "Profile" },
  { id: "send", label: "Share" },
  { id: "done", label: "Done" },
]

export default function TitaniumDock({
  items = ITEMS,
  value,
  defaultValue,
  onChange,
  finish = "silver",
  magnify = 0.3,
  className,
  "aria-label": ariaLabel = "Dock",
}: TitaniumDockProps) {
  const [own, setOwn] = useState(defaultValue ?? items[0]?.id)
  const active = value ?? own
  const idx = Math.max(0, items.findIndex((it) => it.id === active))
  const [entered, setEntered] = useState(false)
  const bar = useRef(null as HTMLDivElement | null)
  const barLeft = useRef(0)
  const scale = useRef(1)
  const reduced = useRef(false)
  const last = useRef(idx)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    reduced.current = mq.matches
    const on = () => (reduced.current = mq.matches)
    mq.addEventListener("change", on)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    return () => {
      cancelAnimationFrame(id)
      mq.removeEventListener("change", on)
    }
  }, [])

  // the bezel stretches toward where it's going, then springs back to round
  useEffect(() => {
    const el = bar.current
    if (!el || last.current === idx) return
    const dist = Math.abs(idx - last.current)
    last.current = idx
    if (reduced.current) return
    el.style.setProperty("--tdk-sx", String(1 + Math.min(0.35, dist * 0.12)))
    el.style.setProperty("--tdk-rot", 200 + idx * 72 + "deg")
    const t = window.setTimeout(() => el.style.setProperty("--tdk-sx", "1"), 140)
    return () => clearTimeout(t)
  }, [idx])

  const select = (i: number) => {
    const it = items[i]
    if (!it) return
    if (value === undefined) setOwn(it.id)
    onChange?.(it.id)
  }

  // Measured once as the pointer arrives; moves read only the cached edge.
  const measure = () => {
    if (!bar.current) return
    const r = bar.current.getBoundingClientRect()
    barLeft.current = r.left
    // the phone layout shrinks items; map the pointer back into design units
    scale.current = r.width / (PAD * 2 + items.length * SIZE + (items.length - 1) * GAP) || 1
  }
  const onMove = (e: React.PointerEvent) => {
    const el = bar.current
    if (!el || e.pointerType !== "mouse") return
    const x = e.clientX - barLeft.current
    el.style.setProperty("--tdk-hx", x + "px")
    if (reduced.current || !magnify) return
    const kids = el.children
    for (let i = 0; i < items.length; i++) {
      const k = kids[i + 1] as HTMLElement | undefined
      k?.style.setProperty("--tdk-m", String(falloff(x / scale.current - centreOf(i))))
    }
  }
  const onLeave = () => {
    const el = bar.current
    if (!el) return
    el.style.removeProperty("--tdk-hx")
    for (let i = 0; i < items.length; i++) (el.children[i + 1] as HTMLElement | undefined)?.style.setProperty("--tdk-m", "0")
  }

  return (
    <div
      className={"tdk-root" + (className ? " " + className : "")}
      data-finish={finish}
      data-in={entered ? "" : undefined}
      style={{ ["--tdk-mag" as string]: magnify } as React.CSSProperties}
    >
      <style>{CSS}</style>
      <div
        ref={bar}
        className="tdk-bar"
        role="toolbar"
        aria-label={ariaLabel}
        style={{ ["--tdk-i" as string]: idx } as React.CSSProperties}
        onPointerEnter={measure}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <span className="tdk-bezel" aria-hidden="true" />
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            className="tdk-item"
            aria-label={it.label}
            aria-current={i === idx}
            tabIndex={i === idx ? 0 : -1}
            style={{ ["--n" as string]: i } as React.CSSProperties}
            onClick={() => select(i)}
            onKeyDown={(e) => {
              const n = keyStep(e.key, i, items.length)
              if (n < 0) return
              e.preventDefault()
              select(n)
              ;(e.currentTarget.parentElement?.children[n + 1] as HTMLElement | undefined)?.focus()
            }}
          >
            <span className="tdk-ico" aria-hidden="true">{it.icon ?? ICONS[it.id] ?? ICONS.done}</span>
            <span className="tdk-tip" aria-hidden="true">{it.label}</span>
            <span className="tdk-dot" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
