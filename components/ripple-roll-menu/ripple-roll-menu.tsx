"use client"

import * as React from "react"

// A full-screen menu of tall condensed words. Point at a word and its letters
// roll over to an accent copy in a ripple that starts from the letter under the
// pointer and spreads both ways. A small photo opens inside the line as it
// rolls, the other lines step back, and leaving rolls it home the same way.

export type RollItem = {
  label: string
  href?: string
  /** Opens inside the line on hover. */
  image?: string
  /** Small text on the right, e.g. a count. */
  meta?: string
}

export type RippleRollMenuProps = {
  items: RollItem[]
  /** Small top-left line, e.g. a wordmark. */
  brand?: React.ReactNode
  /** Small row along the bottom. */
  footer?: React.ReactNode
  accent?: string
  /** Page colour behind the words. */
  background?: string
  /** Word colour. */
  ink?: string
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  className?: string
  onNavigate?: (item: RollItem, index: number) => void
}

// #region ripple
/** Per-letter delay in ms for a ripple that starts at `origin`. */
export function rippleDelay(i: number, origin: number, step = 24): number {
  return Math.abs(i - origin) * step
}

/** Letter index under the pointer from the event target's data-i, or the middle. */
export function originFrom(raw: string | undefined, length: number): number {
  const n = raw === undefined ? NaN : Number(raw)
  return Number.isInteger(n) && n >= 0 && n < length ? n : Math.floor(length / 2)
}

/** Two-digit label. */
export function pad2(i: number): string {
  return (i < 9 ? "0" : "") + (i + 1)
}
// #endregion

const FONT =
  "@font-face{font-family:rrm-display;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}"

const EASE = "cubic-bezier(.76,0,.24,1)"
const OUT = "cubic-bezier(.22,1,.36,1)"

const CSS =
  FONT +
  ".rrm-root{position:relative;width:100%;overflow:hidden;isolation:isolate;display:flex;flex-direction:column;background:var(--rrm-bg);color:var(--rrm-ink);font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;container-type:inline-size}" +
  ".rrm-root::before{content:'';position:absolute;inset:0;z-index:-1;background:radial-gradient(80% 60% at 85% 0%,color-mix(in oklab,var(--rrm-accent) 22%,transparent),transparent 65%),radial-gradient(60% 50% at 0% 100%,rgba(0,0,0,.35),transparent 70%)}" +
  ".rrm-root::after{content:'';position:absolute;inset:0;z-index:-1;opacity:.25;mix-blend-mode:overlay;pointer-events:none;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")}" +
  ".rrm-top,.rrm-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 24px;padding:22px clamp(18px,4cqw,48px);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:color-mix(in oklab,var(--rrm-ink) 60%,transparent)}" +
  ".rrm-foot a{color:inherit;text-decoration:none;transition:color .3s}.rrm-foot a:hover{color:var(--rrm-ink)}" +
  ".rrm-list{flex:1;display:flex;flex-direction:column;justify-content:center;margin:0;padding:0 clamp(18px,4cqw,48px);list-style:none}" +
  ".rrm-li{border-top:1px solid color-mix(in oklab,var(--rrm-ink) 14%,transparent);transition:opacity .5s " + OUT + "}" +
  ".rrm-li:last-child{border-bottom:1px solid color-mix(in oklab,var(--rrm-ink) 14%,transparent)}" +
  ".rrm-list[data-any] .rrm-li:not([data-hot]){opacity:.32}" +
  ".rrm-a{display:flex;align-items:center;gap:clamp(10px,2cqw,26px);padding:.06em 0;color:inherit;text-decoration:none;outline:none;font-size:clamp(46px,9cqw,128px)}" +
  ".rrm-a:focus-visible{box-shadow:inset 3px 0 0 var(--rrm-accent)}" +
  ".rrm-num{align-self:flex-start;margin-top:.9em;font:500 12px/1 ui-monospace,'SFMono-Regular',Menlo,monospace;letter-spacing:.04em;color:color-mix(in oklab,var(--rrm-ink) 55%,transparent);transition:color .4s}" +
  ".rrm-li[data-hot] .rrm-num{color:var(--rrm-accent)}" +
  ".rrm-word{display:flex;font-family:rrm-display,'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-weight:400;line-height:.92;letter-spacing:-.005em;text-transform:uppercase;white-space:nowrap}" +
  ".rrm-ch{display:block;height:.92em;overflow:hidden}" +
  ".rrm-ch>span{display:block;transition:transform .62s " + EASE + "}" +
  ".rrm-ch>span>span{display:block;height:.92em}" +
  ".rrm-ch>span>span+span{color:var(--rrm-accent)}" +
  ".rrm-li[data-hot] .rrm-ch>span{transform:translateY(-.92em)}" +
  ".rrm-pw{display:grid;grid-template-columns:0fr;overflow:hidden;border-radius:999px;transition:grid-template-columns .7s " + EASE + "}" +
  ".rrm-li[data-hot] .rrm-pw{grid-template-columns:1fr}" +
  ".rrm-pic{position:relative;display:block;overflow:hidden;width:1.6em;height:.66em;border-radius:999px;transform:scale(.6) rotate(-6deg);opacity:0;transition:transform .7s " + EASE + ",opacity .4s ease}" +
  ".rrm-li[data-hot] .rrm-pic{transform:none;opacity:1}" +
  ".rrm-pic>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;transform:scale(1.25);transition:transform 1.2s " + OUT + "}" +
  ".rrm-li[data-hot] .rrm-pic>img{transform:none}" +
  ".rrm-grow{flex:1}" +
  ".rrm-meta{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:color-mix(in oklab,var(--rrm-ink) 55%,transparent);transition:color .4s,transform .6s " + EASE + "}" +
  ".rrm-arrow{display:grid;place-items:center;width:clamp(34px,4cqw,52px);height:clamp(34px,4cqw,52px);border-radius:999px;box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--rrm-ink) 25%,transparent);transform:rotate(-45deg) scale(.8);opacity:0;transition:transform .6s " + EASE + ",opacity .4s,background .4s}" +
  ".rrm-arrow svg{width:40%;height:40%}" +
  ".rrm-li[data-hot] .rrm-arrow{transform:none;opacity:1;background:var(--rrm-accent);color:var(--rrm-bg);box-shadow:none}" +
  ".rrm-li[data-hot] .rrm-meta{color:var(--rrm-ink);transform:translateX(-6px)}" +
  ".rrm-rise{animation:rrm-rise 1s " + OUT + " both;animation-delay:calc(var(--r) * 70ms + 120ms)}" +
  "@keyframes rrm-rise{from{transform:translateY(105%)}to{transform:none}}" +
  ".rrm-mask{display:block;overflow:hidden}" +
  "@container (max-width:640px){.rrm-pw,.rrm-meta{display:none}.rrm-a{font-size:clamp(44px,15cqw,96px)}}" +
  "@media (prefers-reduced-motion:reduce){.rrm-rise{animation:none}.rrm-ch>span,.rrm-pw,.rrm-pic,.rrm-pic>img,.rrm-arrow,.rrm-meta,.rrm-li{transition-duration:.01ms!important;transition-delay:0s!important}}"

function Line({ item, index, hot, onHot, onNavigate }: { item: RollItem; index: number; hot: boolean; onHot: (i: number) => void; onNavigate?: RippleRollMenuProps["onNavigate"] }) {
  const chars = Array.from(item.label)
  const [origin, setOrigin] = React.useState(Math.floor(chars.length / 2))
  return (
    <li className="rrm-li" data-hot={hot ? "" : undefined}>
      <span className="rrm-mask">
        <a
          className="rrm-a rrm-rise"
          style={{ ["--r" as string]: index }}
          href={item.href ?? "#"}
          aria-label={item.label}
          onPointerOver={(e) => {
            // The ripple starts from the letter that was entered first.
            if (!hot) setOrigin(originFrom((e.target as HTMLElement).closest("[data-i]")?.getAttribute("data-i") ?? undefined, chars.length))
            onHot(index)
          }}
          onFocus={() => {
            setOrigin(0)
            onHot(index)
          }}
          onClick={(e) => {
            if (!item.href) e.preventDefault()
            onNavigate?.(item, index)
          }}
        >
          <span className="rrm-num" aria-hidden="true">
            {pad2(index)}
          </span>
          <span className="rrm-word" aria-hidden="true">
            {chars.map((ch, i) => (
              <span key={i} className="rrm-ch" data-i={i}>
                <span style={{ transitionDelay: rippleDelay(i, origin) + "ms" }}>
                  <span>{ch === " " ? " " : ch}</span>
                  <span>{ch === " " ? " " : ch}</span>
                </span>
              </span>
            ))}
          </span>
          {item.image ? (
            <span className="rrm-pw" aria-hidden="true">
              <span style={{ minWidth: 0 }}>
                <span className="rrm-pic">
                  <img src={item.image} alt="" draggable={false} />
                </span>
              </span>
            </span>
          ) : null}
          <span className="rrm-grow" />
          {item.meta ? <span className="rrm-meta">{item.meta}</span> : null}
          <span className="rrm-arrow" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </span>
    </li>
  )
}

export default function RippleRollMenu({
  items,
  brand,
  footer,
  accent = "#ff7a3d",
  background = "#1c0f0d",
  ink = "#f3e7da",
  height = "100svh",
  className,
  onNavigate,
}: RippleRollMenuProps) {
  const [hot, setHot] = React.useState(-1)
  return (
    <nav
      className={"rrm-root" + (className ? " " + className : "")}
      style={{ height, ["--rrm-accent" as string]: accent, ["--rrm-bg" as string]: background, ["--rrm-ink" as string]: ink }}
      aria-label="Main"
    >
      <style>{CSS}</style>
      {brand ? <div className="rrm-top">{brand}</div> : null}
      <ul className="rrm-list" data-any={hot > -1 ? "" : undefined} onPointerLeave={() => setHot(-1)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHot(-1)}>
        {items.map((it, i) => (
          <Line key={it.label + i} item={it} index={i} hot={hot === i} onHot={setHot} onNavigate={onNavigate} />
        ))}
      </ul>
      {footer ? <div className="rrm-foot">{footer}</div> : null}
    </nav>
  )
}
