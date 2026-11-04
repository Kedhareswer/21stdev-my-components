"use client"

import { useEffect, useId, useRef, useState } from "react"

export type PresenceStatus = "online" | "away" | "busy" | "offline"
export type PresencePerson = {
  name: string
  photo: string
  role?: string
  status?: PresenceStatus
  /** Draws a turning ring, e.g. for whoever is talking in a call. */
  speaking?: boolean
}

export type PresenceAvatarStackProps = {
  people: PresencePerson[]
  /** How many faces show before the "+N" chip. */
  max?: number
  /** Avatar diameter in px. */
  size?: number
  /** Accessible name of the group, e.g. "Editing now". */
  label?: string
  /** Colour of the ring around each face; defaults to the page background. */
  ring?: string
  /** The edge the stack is pinned to: the fan-out grows away from it, and the "+N" list lines up with it. */
  align?: "start" | "center" | "end"
  /** Which side of the chip the "+N" list opens on. Where CSS anchor positioning is
   *  supported it flips to the other side when there is no room. */
  side?: "bottom" | "top"
  /** Show face i hovered (fanned, lifted, tooltip) until the pointer arrives. For demos and docs. */
  peek?: number
  className?: string
}

const STATUS: Record<PresenceStatus, { color: string; text: string }> = {
  online: { color: "#22c55e", text: "Online" },
  away: { color: "#f59e0b", text: "Away" },
  busy: { color: "#ef4444", text: "Busy" },
  offline: { color: "#a1a1aa", text: "Offline" },
}

// #region split
/** Faces to draw and how many fold into the "+N" chip. One face is never folded alone. */
export function splitPeople(n: number, max: number) {
  const m = Math.max(1, Math.floor(max))
  if (n <= m) return { shown: n, hidden: 0 }
  return { shown: m, hidden: n - m }
}
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
// #endregion

const SANS = 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'
const SPRING = "cubic-bezier(.34,1.56,.64,1)"
const EASE = "cubic-bezier(.22,1,.36,1)"

const CSS =
  ".pas2-root{position:relative;display:inline-flex;align-items:center;font-family:" + SANS + ";--pas2-ring:var(--color-background)}" +
  ".pas2-list{display:flex;align-items:center;margin:0;padding:0;list-style:none}" +
  ".pas2-item{position:relative;width:var(--sz);height:var(--sz);margin-left:calc(var(--sz) * -.3);z-index:calc(50 - var(--i));" +
  "transform:translateX(0);transition:transform .55s " + SPRING + ";animation:pas2-pop .6s " + SPRING + " both;animation-delay:calc(var(--i) * 60ms + 80ms)}" +
  ".pas2-item:first-child{margin-left:0}" +
  "@keyframes pas2-pop{from{opacity:0;scale:.4}to{opacity:1;scale:1}}" +
  "@media (hover:hover){.pas2-root:hover .pas2-item,.pas2-root:focus-within .pas2-item,.pas2-root:hover .pas2-more,.pas2-root:focus-within .pas2-more{transform:translateX(calc((var(--i) - var(--pin)) * var(--sz) * .26))}}" +
  ".pas2-root[data-peek=true] .pas2-item,.pas2-root[data-peek=true] .pas2-more{transform:translateX(calc((var(--i) - var(--pin)) * var(--sz) * .26))}" +
  ".pas2-face{position:relative;display:block;width:100%;height:100%;padding:0;border:0;border-radius:50%;background:none;cursor:default;outline:none;" +
  "transition:transform .45s " + SPRING + "}" +
  ".pas2-item:hover .pas2-face,.pas2-item[data-peek=true] .pas2-face,.pas2-face:focus-visible{transform:translateY(-14%) scale(1.14)}" +
  ".pas2-item:hover,.pas2-item[data-peek=true],.pas2-item:focus-within{z-index:60}" +
  ".pas2-face img{position:absolute;inset:0;width:100%;height:100%;max-width:none;border-radius:50%;object-fit:cover;display:block;box-shadow:0 0 0 calc(var(--sz) * .06) var(--pas2-ring),0 6px 14px -6px rgba(0,0,0,.45)}" +
  ".pas2-face:focus-visible img{box-shadow:0 0 0 calc(var(--sz) * .06) var(--pas2-ring),0 0 0 calc(var(--sz) * .06 + 2px) var(--color-foreground)}" +
  ".pas2-dot{position:absolute;right:2%;bottom:2%;width:calc(var(--sz) * .26);height:calc(var(--sz) * .26);border-radius:50%;background:var(--st);box-shadow:0 0 0 calc(var(--sz) * .05) var(--pas2-ring)}" +
  ".pas2-dot[data-s=online]::after{content:'';position:absolute;inset:0;border-radius:50%;background:var(--st);animation:pas2-ping 2.4s " + EASE + " infinite}" +
  "@keyframes pas2-ping{0%{opacity:.7;transform:scale(1)}70%,100%{opacity:0;transform:scale(2.4)}}" +
  ".pas2-talk{position:absolute;inset:calc(var(--sz) * -.12);border-radius:50%;padding:2px;pointer-events:none;" +
  "background:conic-gradient(from var(--a,0deg),#7c5cff,#ff5ca8,#ffb547,#7c5cff);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;" +
  "animation:pas2-turn 2.2s linear infinite}" +
  "@property --a{syntax:'<angle>';inherits:false;initial-value:0deg}" +
  "@keyframes pas2-turn{to{--a:360deg}}" +
  ".pas2-tip{position:absolute;left:50%;bottom:calc(100% + 12px);z-index:70;transform:translate(-50%,6px) scale(.94);opacity:0;pointer-events:none;white-space:nowrap;" +
  "padding:8px 11px;border-radius:12px;background:#111114;color:#fafafa;box-shadow:0 12px 24px -10px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.08) inset;transition:opacity .2s,transform .35s " + SPRING + "}" +
  ".pas2-tip::after{content:'';position:absolute;left:50%;top:100%;width:10px;height:10px;background:#111114;transform:translate(-50%,-55%) rotate(45deg);border-radius:2px}" +
  ".pas2-item:hover .pas2-tip,.pas2-item[data-peek=true] .pas2-tip,.pas2-face:focus-visible+.pas2-tip{opacity:1;transform:translate(-50%,0) scale(1)}" +
  ".pas2-tip b{display:block;font:600 12.5px/1.2 " + SANS + "}" +
  ".pas2-tip span{display:flex;align-items:center;gap:6px;margin-top:4px;font:500 11px/1 " + SANS + ";color:rgba(250,250,250,.65)}" +
  ".pas2-tip span i{width:6px;height:6px;border-radius:50%;background:var(--st)}" +
  ".pas2-more{position:relative;margin-left:calc(var(--sz) * -.3);z-index:1;transition:transform .55s " + SPRING + ";animation:pas2-pop .6s " + SPRING + " both;animation-delay:calc(var(--i) * 60ms + 80ms)}" +
  ".pas2-chip{display:grid;place-items:center;width:var(--sz);height:var(--sz);border-radius:50%;border:0;cursor:pointer;font:650 calc(var(--sz) * .32)/1 " + SANS + ";letter-spacing:-.02em;" +
  "color:var(--color-background);background:var(--color-foreground);box-shadow:0 0 0 calc(var(--sz) * .06) var(--pas2-ring);transition:transform .45s " + SPRING + "}" +
  ".pas2-chip:hover,.pas2-chip[aria-expanded=true]{transform:scale(1.08)}" +
  ".pas2-chip:focus-visible{outline:2px solid var(--color-foreground);outline-offset:4px}" +
  ".pas2-pop{position:absolute;left:50%;top:calc(100% + 12px);bottom:auto;translate:-50% 0;z-index:80;width:250px;max-height:280px;overflow:auto;padding:6px;margin:0;list-style:none;border-radius:16px;" +
  "background:var(--color-background);color:var(--color-foreground);box-shadow:0 0 0 1px var(--color-border),0 2px 6px -2px rgba(0,0,0,.12),0 28px 50px -20px rgba(0,0,0,.5);transform-origin:50% 0;animation:pas2-open .45s " + SPRING + " both}" +
  ".pas2-pop[data-align=start]{left:calc(var(--sz) * -.2);translate:0 0;transform-origin:20px 0}" +
  ".pas2-pop[data-align=end]{left:auto;right:calc(var(--sz) * -.2);translate:0 0;transform-origin:calc(100% - 20px) 0}" +
  ".pas2-pop[data-side=top]{top:auto;bottom:calc(100% + 12px)}" +
  ".pas2-more:has(.pas2-pop){z-index:90}" +
  ".pas2-pop[data-side=top]{transform-origin:50% 100%}" +
  "@supports (position-try-fallbacks:flip-block){.pas2-chip{anchor-name:var(--pas2-anchor)}" +
  ".pas2-pop{position-anchor:var(--pas2-anchor);top:anchor(bottom);bottom:auto;margin-top:12px;position-try-fallbacks:flip-block}" +
  ".pas2-pop[data-side=top]{top:auto;bottom:anchor(top);margin-top:0;margin-bottom:12px}}" +
  "@keyframes pas2-open{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}" +
  ".pas2-pop li{display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:10px;animation:pas2-row .45s " + EASE + " both;animation-delay:calc(var(--k) * 35ms + 60ms)}" +
  "@keyframes pas2-row{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}" +
  ".pas2-pop li:hover{background:color-mix(in oklab,var(--color-foreground) 6%,transparent)}" +
  ".pas2-mini{position:relative;flex:none;width:32px;height:32px}" +
  ".pas2-mini img{width:100%;height:100%;max-width:none;border-radius:50%;object-fit:cover;display:block}" +
  ".pas2-mini i{position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;background:var(--st);box-shadow:0 0 0 2px var(--color-background)}" +
  ".pas2-pop b{display:block;font:600 13px/1.2 " + SANS + "}" +
  ".pas2-pop small{display:block;font:400 11.5px/1.3 " + SANS + ";color:var(--color-muted-foreground)}" +
  "@media (prefers-reduced-motion:reduce){.pas2-item,.pas2-more,.pas2-pop,.pas2-pop li,.pas2-talk,.pas2-dot[data-s=online]::after{animation:none}.pas2-item,.pas2-more,.pas2-face,.pas2-tip,.pas2-chip{transition:none}}"

export default function PresenceAvatarStack({ people, max = 4, size = 44, label = "People here", ring, align = "center", side = "bottom", peek = -1, className = "" }: PresenceAvatarStackProps) {
  const [open, setOpen] = useState(false)
  const [peekAt, setPeekAt] = useState(peek)
  const root = useRef(null as HTMLDivElement | null)
  const id = useId()
  const { shown, hidden } = splitPeople(people.length, max)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div
      ref={root}
      className={"pas2-root " + className}
      data-peek={peekAt >= 0}
      onPointerEnter={() => setPeekAt(-1)}
      onFocus={() => setPeekAt(-1)}
      role="group"
      aria-label={label + ", " + people.length + " people"}
      style={{ ["--sz" as string]: size + "px", ["--pin" as string]: align === "end" ? shown : align === "center" ? shown / 2 : 0, ["--pas2-anchor" as string]: "--pas2" + id.replace(/[^a-zA-Z0-9_-]/g, ""), ...(ring ? { ["--pas2-ring" as string]: ring } : null) }}
    >
      <style>{CSS}</style>
      <ul className="pas2-list">
        {people.slice(0, shown).map((p, i) => {
          const st = STATUS[p.status ?? "online"]
          return (
            <li key={p.name + i} className="pas2-item" data-peek={i === peekAt} style={{ ["--i" as string]: i, ["--st" as string]: st.color }}>
              <button type="button" className="pas2-face" aria-label={p.name + (p.role ? ", " + p.role : "") + ", " + st.text}>
                {p.speaking && <span className="pas2-talk" aria-hidden="true" />}
                <img src={p.photo} alt="" draggable={false} />
                {p.status !== "offline" && <span className="pas2-dot" data-s={p.status ?? "online"} aria-hidden="true" />}
              </button>
              <span className="pas2-tip" aria-hidden="true">
                <b>{p.name}</b>
                <span>
                  <i />
                  {p.speaking ? "Speaking" : st.text}
                  {p.role ? " · " + p.role : ""}
                </span>
              </span>
            </li>
          )
        })}
        {hidden > 0 && (
          <li className="pas2-more" style={{ ["--i" as string]: shown }}>
            <button
              type="button"
              className="pas2-chip"
              aria-expanded={open}
              aria-controls={id + "pop"}
              aria-label={"Show " + hidden + " more"}
              onClick={() => {
                setPeekAt(-1)
                setOpen((o) => !o)
              }}
            >
              +{hidden}
            </button>
          {open && hidden > 0 && (
            <ul className="pas2-pop" data-align={align} data-side={side} id={id + "pop"} aria-label={hidden + " more people"}>
              {people.slice(shown).map((p, k) => {
                const st = STATUS[p.status ?? "online"]
                return (
                  <li key={p.name + k} style={{ ["--k" as string]: k, ["--st" as string]: st.color }}>
                    <span className="pas2-mini">
                      {p.photo ? <img src={p.photo} alt="" draggable={false} /> : initials(p.name)}
                      <i aria-hidden="true" />
                    </span>
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {st.text}
                        {p.role ? " · " + p.role : ""}
                      </small>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          </li>
        )}
      </ul>
    </div>
  )
}
