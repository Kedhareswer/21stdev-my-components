"use client"

import { useEffect, useId, useRef, useState } from "react"

export type Activity = {
  id: string
  title: string
  body: string
  time: string
  /** A face or a picture. Falls back to a tinted initial. */
  image?: string
  /** Tint for the fallback tile, any CSS colour. */
  tint?: string
  unread?: boolean
}

export type ActivityDeckDropdownProps = {
  activities: Activity[]
  title?: string
  subtitle?: string
  defaultOpen?: boolean
  onOpenActivity?: (a: Activity) => void
  className?: string
}

// #region logic
export const CARD = 76
export const GAP = 10
export const PEEK = 11
export const SHOWN = 3

/** Where card i sits: fanned into a list when open, tucked under the first when closed. */
export function slot(i: number, open: boolean): { y: number; scale: number; opacity: number } {
  if (open) return { y: i * (CARD + GAP), scale: 1, opacity: 1 }
  const k = Math.min(i, SHOWN - 1)
  return { y: k * PEEK, scale: 1 - k * 0.055, opacity: i < SHOWN ? 1 - k * 0.22 : 0 }
}

export function deckHeight(n: number, open: boolean): number {
  if (n <= 0) return 0
  return open ? n * CARD + (n - 1) * GAP : CARD + (Math.min(n, SHOWN) - 1) * PEEK
}

export function unreadCount(list: { unread?: boolean }[]): number {
  return list.filter((a) => a.unread).length
}
// #endregion

const SPRING =
  "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1)"
const SOFT =
  "linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001 85.9%, 1)"

const CSS =
  ".adk-root{--adk-ink:#0d1322;--adk-card:#151d31;--adk-card2:#1b2540;--adk-text:#eef2fb;--adk-dim:rgba(222,230,248,.55);--adk-mint:#5ef0c6;--adk-line:rgba(190,210,255,.09);--adk-spring:" + SPRING + ";--adk-soft:" + SOFT + ";" +
  "width:min(384px,calc(100vw - 32px));font-family:'Inter Tight','Geist',ui-sans-serif,system-ui,sans-serif;color:var(--adk-text);-webkit-font-smoothing:antialiased;animation:adk-in .7s var(--adk-soft) both}" +
  ".adk-head{display:flex;align-items:center;gap:12px;width:100%;padding:12px 12px 12px 12px;margin-bottom:12px;border:0;border-radius:20px;font:inherit;text-align:left;color:inherit;cursor:pointer;outline:none;" +
  "background:radial-gradient(120% 140% at 0% 0%,#22305a 0%,var(--adk-ink) 60%);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px var(--adk-line),0 18px 40px -18px rgba(6,10,24,.7);transition:transform .45s var(--adk-spring),box-shadow .2s}" +
  ".adk-head:hover{transform:translateY(-1px)}.adk-head:active{transform:scale(.985)}" +
  ".adk-head:focus-visible{box-shadow:inset 0 0 0 1px var(--adk-line),0 0 0 2px var(--adk-ink),0 0 0 4px var(--adk-mint)}" +
  ".adk-bell{position:relative;flex:none;width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(160deg,#27355f,#182240);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 6px 14px -6px rgba(0,0,0,.6)}" +
  ".adk-bell svg{transform-origin:50% 10%}" +
  ".adk-root[data-ring=true] .adk-bell svg{animation:adk-ring 1.1s cubic-bezier(.36,.07,.19,.97) .6s both}" +
  ".adk-bell b{position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;display:grid;place-items:center;font-size:10.5px;font-weight:750;color:#062a20;background:var(--adk-mint);box-shadow:0 0 0 3px var(--adk-ink),0 0 14px rgba(94,240,198,.6);font-variant-numeric:tabular-nums;transition:transform .4s var(--adk-spring),opacity .3s}" +
  ".adk-bell b[data-zero=true]{transform:scale(0);opacity:0}" +
  ".adk-txt{flex:1;min-width:0;line-height:1.2}" +
  ".adk-txt strong{display:block;font-size:15px;font-weight:650;letter-spacing:-.02em}" +
  ".adk-txt small{display:block;margin-top:3px;font-size:12.5px;color:var(--adk-dim)}" +
  ".adk-chev{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:999px;background:rgba(255,255,255,.06);transition:transform .55s var(--adk-spring)}" +
  ".adk-root[data-open=true] .adk-chev{transform:rotate(180deg)}" +
  ".adk-deck{position:relative;list-style:none;margin:0;padding:0;transition:height .6s var(--adk-soft)}" +
  ".adk-wrap[data-closed=true]{cursor:pointer}" +
  ".adk-card{position:absolute;left:0;right:0;top:0;height:76px;transform-origin:50% 100%;transform:translateY(var(--adk-y)) scale(var(--adk-s));opacity:var(--adk-o);" +
  "transition:transform .7s var(--adk-spring),opacity .35s ease;transition-delay:calc(var(--adk-i) * .035s)}" +
  ".adk-root[data-open=false] .adk-card{transition-delay:calc((6 - var(--adk-i)) * .02s)}" +
  ".adk-btn{display:flex;align-items:center;gap:12px;width:100%;height:100%;padding:0 14px 0 12px;border:0;border-radius:18px;font:inherit;text-align:left;color:inherit;cursor:pointer;outline:none;" +
  "background:linear-gradient(180deg,var(--adk-card2),var(--adk-card));box-shadow:inset 0 1px 0 rgba(255,255,255,.07),inset 0 0 0 1px var(--adk-line),0 1px 2px rgba(0,0,0,.3),0 14px 30px -16px rgba(4,8,20,.8);transition:background .2s,box-shadow .2s,transform .4s var(--adk-spring)}" +
  ".adk-root[data-open=true] .adk-btn:hover{transform:translateX(3px);background:linear-gradient(180deg,#212d4d,#18213a)}" +
  ".adk-btn:focus-visible{box-shadow:inset 0 0 0 1px var(--adk-line),0 0 0 2px var(--adk-ink),0 0 0 4px var(--adk-mint)}" +
  ".adk-pic{position:relative;flex:none;width:46px;height:46px;border-radius:14px;overflow:hidden;display:grid;place-items:center;font-weight:700;font-size:17px;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12),0 6px 14px -6px rgba(0,0,0,.6)}" +
  ".adk-pic>img{width:100%;height:100%;max-width:none;object-fit:cover;display:block}" +
  ".adk-body{flex:1;min-width:0;line-height:1.25}" +
  ".adk-body b{display:block;font-size:14px;font-weight:620;letter-spacing:-.012em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".adk-body span{display:block;margin-top:3px;font-size:12.5px;color:var(--adk-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".adk-meta{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-size:11.5px;color:var(--adk-dim);font-variant-numeric:tabular-nums}" +
  ".adk-dot{width:8px;height:8px;border-radius:999px;background:var(--adk-mint);box-shadow:0 0 0 3px rgba(94,240,198,.16),0 0 10px rgba(94,240,198,.7);transition:transform .4s var(--adk-spring),opacity .3s}" +
  ".adk-dot[data-read=true]{transform:scale(0);opacity:0}" +
  ".adk-foot{display:flex;justify-content:flex-end;height:0;opacity:0;overflow:hidden;transition:height .5s var(--adk-soft),opacity .3s,margin .5s var(--adk-soft)}" +
  ".adk-root[data-open=true] .adk-foot{height:34px;margin-top:12px;opacity:1;transition-delay:.15s}" +
  ".adk-all{height:34px;padding:0 14px;border:0;border-radius:999px;font:inherit;font-size:12.5px;font-weight:620;color:var(--adk-mint);background:var(--adk-ink);box-shadow:inset 0 0 0 1px rgba(94,240,198,.28),0 8px 18px -10px rgba(6,10,24,.7);cursor:pointer;outline:none;transition:background .2s,transform .35s var(--adk-spring)}" +
  ".adk-all:hover{background:#16213d}.adk-all:active{transform:scale(.95)}" +
  ".adk-all:focus-visible{box-shadow:0 0 0 2px var(--adk-ink),0 0 0 4px var(--adk-mint)}" +
  ".adk-all:disabled{opacity:.45;cursor:default}" +
  "@keyframes adk-in{from{opacity:0;transform:translateY(-12px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}" +
  "@keyframes adk-ring{0%,100%{transform:rotate(0)}15%{transform:rotate(14deg)}30%{transform:rotate(-12deg)}45%{transform:rotate(9deg)}60%{transform:rotate(-6deg)}75%{transform:rotate(3deg)}}" +
  "@media (prefers-reduced-motion:reduce){.adk-root,.adk-root *{transition-duration:.01ms!important;transition-delay:0s!important;animation:none!important}}"

export function ActivityDeckDropdown({
  activities,
  title,
  subtitle = "What happened while you were away",
  defaultOpen = false,
  onOpenActivity,
  className,
}: ActivityDeckDropdownProps) {
  const id = useId()
  const [open, setOpen] = useState(defaultOpen)
  const [read, setRead] = useState({} as Record<string, boolean>)
  const deck = useRef(null as HTMLUListElement | null)
  const head = useRef(null as HTMLButtonElement | null)

  useEffect(() => {
    deck.current?.toggleAttribute("inert", !open)
  }, [open])

  const list = activities.map((a) => ({ ...a, unread: a.unread && !read[a.id] }))
  const unread = unreadCount(list)

  return (
    <div
      className={"adk-root" + (className ? " " + className : "")}
      data-open={open}
      data-ring={unread > 0}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false)
          head.current?.focus()
        }
      }}
    >
      <style>{CSS}</style>
      <button ref={head} type="button" className="adk-head" aria-expanded={open} aria-controls={id + "-deck"} onClick={() => setOpen((o) => !o)}>
        <span className="adk-bell">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 2h-15zM10 20.5a2.2 2.2 0 004 0" />
          </svg>
          <b data-zero={unread === 0} aria-hidden="true">
            {unread}
          </b>
        </span>
        <span className="adk-txt">
          <strong>{title ?? (unread ? unread + " new " + (unread === 1 ? "activity" : "activities") : "You're all caught up")}</strong>
          <small>{subtitle}</small>
        </span>
        <span className="adk-chev" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5l3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {/* closed, the tucked deck is a big target for the same toggle; the header button stays the accessible control */}
      <div className="adk-wrap" data-closed={!open} onClick={open ? undefined : () => setOpen(true)}>
      <ul
        ref={deck}
        id={id + "-deck"}
        className="adk-deck"
        aria-label="Activity"
        style={{ height: deckHeight(list.length, open) }}
      >
        {list.map((a, i) => {
          const s = slot(i, open)
          return (
            <li
              key={a.id}
              className="adk-card"
              style={{ zIndex: list.length - i, ["--adk-i" as string]: i, ["--adk-y" as string]: s.y + "px", ["--adk-s" as string]: s.scale, ["--adk-o" as string]: s.opacity }}
            >
              <button
                type="button"
                className="adk-btn"
                onClick={() => {
                  setRead((r) => ({ ...r, [a.id]: true }))
                  onOpenActivity?.(a)
                }}
              >
                <span className="adk-pic" style={{ background: a.tint ?? "linear-gradient(160deg,#3b4f8f,#24305a)" }}>
                  {a.image ? <img src={a.image} alt="" width={46} height={46} /> : a.title.slice(0, 1)}
                </span>
                <span className="adk-body">
                  <b>{a.title}</b>
                  <span>{a.body}</span>
                </span>
                <span className="adk-meta">
                  {a.time}
                  <span className="adk-dot" data-read={!a.unread} aria-label={a.unread ? "Unread" : undefined} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      </div>
      <div className="adk-foot">
        <button type="button" className="adk-all" tabIndex={open ? 0 : -1} disabled={!unread} onClick={() => setRead(Object.fromEntries(activities.map((a) => [a.id, true])))}>
          Mark all as read
        </button>
      </div>
    </div>
  )
}

export default ActivityDeckDropdown
