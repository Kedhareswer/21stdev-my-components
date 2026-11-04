"use client"

import { useEffect, useId, useRef, useState } from "react"

export type AccessRequest = {
  id: string
  name: string
  avatar: string
  /** What they asked for, e.g. "Editor access". */
  role: string
  /** When, e.g. "2m". */
  time: string
}

export type ApprovalMorphTrayProps = {
  requests: AccessRequest[]
  /** The thing being requested, shown under the count while closed. */
  resource?: string
  title?: string
  defaultOpen?: boolean
  /** How many faces the closed pill stacks before "+N". */
  maxAvatars?: number
  onApprove?: (r: AccessRequest) => void
  onDecline?: (r: AccessRequest) => void
  className?: string
}

// #region logic
export function stackOf(count: number, max: number): { shown: number; extra: number } {
  const shown = Math.max(0, Math.min(count, max))
  return { shown, extra: Math.max(0, count - shown) }
}

export function pendingLabel(n: number): string {
  if (n <= 0) return "All caught up"
  return n === 1 ? "1 request" : n + " requests"
}

export function nextIndex(i: number, delta: number, n: number): number {
  if (n <= 0) return -1
  return (i + delta + n) % n
}
// #endregion

const SPRING =
  "linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001 85.9%, 1)"

const CSS =
  ".amt-root{--amt-ink:#141216;--amt-ink2:#1d1a20;--amt-line:rgba(255,244,225,.08);--amt-text:#f6efe3;--amt-dim:rgba(246,239,227,.56);--amt-amber:#f3b14a;--amt-amber2:#ffcf7a;--amt-sage:#8fd3a6;" +
  "--amt-spring:" + SPRING + ";font-family:'Inter Tight','Geist',ui-sans-serif,system-ui,sans-serif;color:var(--amt-text);display:inline-block;-webkit-font-smoothing:antialiased}" +
  ".amt-shell{position:relative;width:min(328px,calc(100vw - 32px));border-radius:34px;background:radial-gradient(120% 80% at 18% 0%,#2a2530 0%,var(--amt-ink) 58%),var(--amt-ink);" +
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.09),inset 0 0 0 1px rgba(255,255,255,.04),0 1px 2px rgba(10,8,12,.4),0 12px 24px -8px rgba(10,8,12,.45),0 40px 80px -24px rgba(30,18,8,.55);" +
  "transition:width .62s var(--amt-spring),border-radius .5s var(--amt-spring);overflow:hidden;animation:amt-rise .8s cubic-bezier(.2,.8,.2,1) both}" +
  ".amt-shell::before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 40% at 90% 0%,rgba(243,177,74,.14),transparent 70%);opacity:.7;transition:opacity .5s}" +
  ".amt-root[data-open=true] .amt-shell{width:min(408px,calc(100vw - 32px));border-radius:26px}" +
  ".amt-root[data-open=true] .amt-shell::before{opacity:1}" +
  ".amt-head{position:relative;display:block;width:100%;height:68px;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:inherit;outline:none}" +
  ".amt-head:focus-visible{box-shadow:inset 0 0 0 2px var(--amt-amber)}" +
  ".amt-face,.amt-title{position:absolute;inset:0;display:flex;align-items:center;gap:12px;padding:0 18px 0 14px;transition:opacity .38s ease,transform .55s var(--amt-spring),filter .38s ease}" +
  ".amt-title{padding:0 18px 0 22px;opacity:0;transform:translateY(10px);filter:blur(4px)}" +
  ".amt-root[data-open=true] .amt-face{opacity:0;transform:translateY(-10px) scale(.96);filter:blur(4px)}" +
  ".amt-root[data-open=true] .amt-title{opacity:1;transform:none;filter:none}" +
  ".amt-stack{display:flex;align-items:center;padding-left:6px}" +
  ".amt-stack>span{position:relative;width:38px;height:38px;margin-left:-12px;border-radius:999px;overflow:hidden;box-shadow:0 0 0 2.5px var(--amt-ink),0 4px 10px rgba(0,0,0,.4);transition:transform .45s var(--amt-spring)}" +
  ".amt-stack>span>img{width:100%;height:100%;max-width:none;object-fit:cover;display:block}" +
  ".amt-head:hover .amt-stack>span{transform:translateX(calc(var(--amt-i) * 3px))}" +
  ".amt-more{display:grid;place-items:center;background:linear-gradient(160deg,var(--amt-amber2),var(--amt-amber));color:#2a1a05;font-size:12px;font-weight:700;letter-spacing:-.01em}" +
  ".amt-copy{min-width:0;flex:1;line-height:1.2}" +
  ".amt-copy b{display:block;font-size:14.5px;font-weight:620;letter-spacing:-.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".amt-copy small{display:block;margin-top:3px;font-size:12px;color:var(--amt-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".amt-chev{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:999px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px var(--amt-line);transition:transform .55s var(--amt-spring),background .2s}" +
  ".amt-head:hover .amt-chev{background:rgba(255,255,255,.1)}" +
  ".amt-root[data-open=true] .amt-chev{transform:rotate(180deg)}" +
  ".amt-h{font-size:17px;font-weight:650;letter-spacing:-.025em;flex:1}" +
  ".amt-count{font-variant-numeric:tabular-nums;font-size:12px;font-weight:650;padding:3px 9px;border-radius:999px;color:#2a1a05;background:linear-gradient(160deg,var(--amt-amber2),var(--amt-amber));box-shadow:0 0 0 4px rgba(243,177,74,.14)}" +
  ".amt-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .6s var(--amt-spring)}" +
  ".amt-root[data-open=true] .amt-panel{grid-template-rows:1fr}" +
  ".amt-panel>div{min-height:0;overflow:hidden}" +
  ".amt-list{list-style:none;margin:0;padding:4px 10px 12px;border-top:1px solid var(--amt-line);margin-inline:12px}" +
  ".amt-row{display:grid;grid-template-rows:1fr;transition:grid-template-rows .5s cubic-bezier(.6,0,.2,1) .55s,opacity .3s ease .6s}" +
  ".amt-row>div{min-height:0;overflow:hidden}" +
  ".amt-row.is-gone{grid-template-rows:0fr;opacity:0}" +
  ".amt-item{display:flex;align-items:center;gap:12px;padding:10px 0;opacity:0;transform:translateY(8px);transition:opacity .35s ease,transform .5s var(--amt-spring)}" +
  ".amt-root[data-open=true] .amt-item{opacity:1;transform:none;transition-delay:calc(.08s + var(--amt-i) * .055s)}" +
  ".amt-row.is-declined .amt-item{transform:translateX(-28px);opacity:0;transition:transform .4s cubic-bezier(.5,0,.75,0),opacity .3s ease}" +
  ".amt-av{position:relative;flex:none;width:42px;height:42px;border-radius:999px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.1),0 6px 14px -4px rgba(0,0,0,.6)}" +
  ".amt-av>img{width:100%;height:100%;max-width:none;object-fit:cover;display:block;transition:filter .4s}" +
  ".amt-av>i{position:absolute;inset:0;display:grid;place-items:center;background:rgba(32,90,55,.7);opacity:0;transition:opacity .25s}" +
  ".amt-row.is-approved .amt-av>i{opacity:1}" +
  ".amt-row.is-approved .amt-av>img{filter:saturate(.3)}" +
  ".amt-av path{stroke-dasharray:22;stroke-dashoffset:22;transition:stroke-dashoffset .45s cubic-bezier(.6,0,.2,1) .05s}" +
  ".amt-row.is-approved .amt-av path{stroke-dashoffset:0}" +
  ".amt-who{flex:1;min-width:0;line-height:1.25}" +
  ".amt-who b{display:block;font-size:14px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".amt-who small{display:block;font-size:12px;color:var(--amt-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".amt-who em{font-style:normal;color:var(--amt-amber2)}" +
  ".amt-acts{display:flex;gap:6px;flex:none}" +
  ".amt-btn{height:32px;padding:0 13px;border-radius:999px;border:0;font:inherit;font-size:12.5px;font-weight:620;letter-spacing:-.005em;cursor:pointer;outline:none;transition:transform .35s var(--amt-spring),background .2s,box-shadow .2s,color .2s}" +
  ".amt-btn:active{transform:scale(.93)}" +
  ".amt-btn:focus-visible{box-shadow:0 0 0 2px var(--amt-ink),0 0 0 4px var(--amt-amber)}" +
  ".amt-yes{min-width:84px;color:#2a1a05;background:linear-gradient(170deg,var(--amt-amber2),var(--amt-amber));box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 4px 12px -4px rgba(243,177,74,.7)}" +
  ".amt-yes:hover{transform:translateY(-1px)}" +
  ".amt-no{width:32px;padding:0;display:grid;place-items:center;color:var(--amt-dim);background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px var(--amt-line)}" +
  ".amt-no:hover{background:rgba(255,94,94,.14);color:#ffb4a8}" +
  ".amt-row.is-approved .amt-acts,.amt-row.is-declined .amt-acts{pointer-events:none}" +
  ".amt-row.is-approved .amt-yes{background:var(--amt-sage);color:#0f2a19;box-shadow:none}" +
  ".amt-row.is-approved .amt-no{opacity:0}" +
  ".amt-empty{display:flex;align-items:center;gap:12px;padding:16px 4px 8px;color:var(--amt-dim);font-size:13px;animation:amt-fade .5s ease both}" +
  ".amt-empty i{width:36px;height:36px;border-radius:999px;display:grid;place-items:center;background:rgba(143,211,166,.12);color:var(--amt-sage)}" +
  ".amt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@keyframes amt-rise{from{opacity:0;transform:translateY(14px) scale(.96);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}" +
  "@keyframes amt-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}" +
  "@media (prefers-reduced-motion:reduce){.amt-root *,.amt-root *::before{transition-duration:.01ms!important;transition-delay:0s!important;animation:none!important}}"

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M4 9.5l3.2 3L14 5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function ApprovalMorphTray({
  requests,
  resource = "Brand kit · Figma",
  title = "Access requests",
  defaultOpen = false,
  maxAvatars = 4,
  onApprove,
  onDecline,
  className,
}: ApprovalMorphTrayProps) {
  const id = useId()
  const [open, setOpen] = useState(defaultOpen)
  const [items, setItems] = useState(requests)
  const [fate, setFate] = useState({} as Record<string, "approved" | "declined">)
  const [said, setSaid] = useState("")
  const head = useRef(null as HTMLButtonElement | null)
  const list = useRef(null as HTMLUListElement | null)
  const timers = useRef([] as number[])
  const panel = useRef(null as HTMLDivElement | null)

  useEffect(() => {
    setItems(requests)
  }, [requests])
  // inert keeps the collapsed rows out of the tab order (set by hand: React 18 and 19 disagree on the prop)
  useEffect(() => {
    panel.current?.toggleAttribute("inert", !open)
  }, [open])
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  const live = items.filter((r) => !fate[r.id])
  const { shown, extra } = stackOf(live.length, maxAvatars)

  const settle = (r: AccessRequest, how: "approved" | "declined") => {
    setFate((f) => ({ ...f, [r.id]: how }))
    setSaid(r.name + (how === "approved" ? " approved" : " declined"))
    ;(how === "approved" ? onApprove : onDecline)?.(r)
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    timers.current.push(
      window.setTimeout(() => {
        setItems((all) => all.filter((x) => x.id !== r.id))
        // keep focus inside the list once the row it sat on is gone
        const next = list.current?.querySelector(".amt-row:not(.is-gone) .amt-yes") as HTMLButtonElement | null
        if (list.current?.contains(document.activeElement) || document.activeElement === document.body) (next ?? head.current)?.focus()
      }, reduce ? 10 : 1150),
    )
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      setOpen(false)
      head.current?.focus()
      return
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    const btns = [...(list.current?.querySelectorAll(".amt-row:not(.is-approved):not(.is-declined) .amt-yes") ?? [])] as HTMLButtonElement[]
    if (!btns.length) return
    e.preventDefault()
    const down = e.key === "ArrowDown"
    const at = btns.indexOf(document.activeElement as HTMLButtonElement)
    btns[at < 0 ? (down ? 0 : btns.length - 1) : nextIndex(at, down ? 1 : -1, btns.length)].focus()
  }

  return (
    <div className={"amt-root" + (className ? " " + className : "")} data-open={open} onKeyDown={onKey}>
      <style>{CSS}</style>
      <div className="amt-shell">
        <button ref={head} type="button" className="amt-head" aria-expanded={open} aria-controls={id + "-panel"} onClick={() => setOpen((o) => !o)}>
          <span className="amt-face" aria-hidden={open}>
            <span className="amt-stack">
              {live.slice(0, shown).map((r, i) => (
                <span key={r.id} style={{ zIndex: 10 - i, ["--amt-i" as string]: i }}>
                  <img src={r.avatar} alt="" width={38} height={38} />
                </span>
              ))}
              {extra > 0 && (
                <span className="amt-more" style={{ ["--amt-i" as string]: shown }}>
                  +{extra}
                </span>
              )}
            </span>
            <span className="amt-copy">
              <b>{pendingLabel(live.length)}</b>
              <small>{resource}</small>
            </span>
            <span className="amt-chev">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 4.5L6 7.5l3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
          <span className="amt-title" aria-hidden={!open}>
            <span className="amt-h">{title}</span>
            <span className="amt-count">{live.length}</span>
            <span className="amt-chev">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 4.5L6 7.5l3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </button>
        <div className="amt-panel" id={id + "-panel"} role="region" aria-label={title} ref={panel}>
          <div>
            <ul className="amt-list" ref={list}>
              {items.map((r, i) => (
                <li key={r.id} className={"amt-row" + (fate[r.id] ? " is-" + fate[r.id] + " is-gone" : "")}>
                  <div>
                    <div className="amt-item" style={{ ["--amt-i" as string]: i }}>
                      <span className="amt-av">
                        <img src={r.avatar} alt="" width={42} height={42} />
                        <i>
                          <Check />
                        </i>
                      </span>
                      <span className="amt-who">
                        <b>{r.name}</b>
                        <small>
                          <em>{r.role}</em> · {r.time}
                        </small>
                      </span>
                      <span className="amt-acts">
                        <button type="button" className="amt-btn amt-yes" onClick={() => settle(r, "approved")} aria-label={"Approve " + r.name}>
                          {fate[r.id] === "approved" ? "Approved" : "Approve"}
                        </button>
                        <button type="button" className="amt-btn amt-no" onClick={() => settle(r, "declined")} aria-label={"Decline " + r.name}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                          </svg>
                        </button>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {live.length === 0 && (
              <div className="amt-empty" style={{ padding: "0 22px 18px" }}>
                <i>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M4 9.5l3.2 3L14 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </i>
                Everyone has been answered.
              </div>
            )}
          </div>
        </div>
      </div>
      <span className="amt-sr" aria-live="polite">
        {said}
      </span>
    </div>
  )
}

export default ApprovalMorphTray
