"use client"

import { useEffect, useId, useRef, useState } from "react"

export type CrewMember = {
  id: string
  name: string
  photo: string
  role?: string
  /** Ring colour when picked. */
  color?: string
}

export type CrewAvatarPickerProps = {
  people: CrewMember[]
  /** More people the "Add" tile can pull into the row. */
  directory?: CrewMember[]
  defaultValue?: string[]
  title?: string
  action?: string
  onChange?: (ids: string[]) => void
  onAction?: (ids: string[]) => void
  className?: string
}

// #region logic
export function flipId(sel: string[], id: string): string[] {
  return sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
}

export function countLabel(n: number, total: number): string {
  return n + " of " + total
}

export function actionLabel(action: string, n: number): string {
  if (!n) return "Pick someone"
  return action + " with " + n
}

export function search(list: { name: string; role?: string }[], q: string) {
  const s = q.trim().toLowerCase()
  return s ? list.filter((p) => (p.name + " " + (p.role ?? "")).toLowerCase().includes(s)) : list
}

export function wrapStep(i: number, key: string, n: number): number {
  if (n <= 0) return -1
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return i
}
// #endregion

const SPRING =
  "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1)"
const SOFT =
  "linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001 85.9%, 1)"

const CSS =
  ".cap-root{--cap-card:#fbf7f0;--cap-ink:#221c16;--cap-dim:#8a8076;--cap-line:rgba(34,28,22,.09);--cap-accent:#ff7a1a;--cap-spring:" + SPRING + ";--cap-soft:" + SOFT + ";" +
  "position:relative;width:min(468px,calc(100vw - 32px));padding:20px 20px 18px;border-radius:26px;color:var(--cap-ink);font-family:'Inter Tight','Geist',ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;" +
  "background:radial-gradient(120% 80% at 100% 0%,rgba(255,122,26,.08),transparent 60%),var(--cap-card);box-shadow:inset 0 1px 0 #fff,0 0 0 1px rgba(34,28,22,.06),0 2px 4px rgba(34,28,22,.04),0 24px 48px -20px rgba(80,44,10,.3);animation:cap-in .7s var(--cap-soft) both}" +
  ".cap-top{display:flex;align-items:center;gap:12px;margin-bottom:18px}" +
  ".cap-title{flex:1;min-width:0}" +
  ".cap-title b{display:block;font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--cap-dim)}" +
  ".cap-title span{display:block;margin-top:3px;font-size:19px;font-weight:650;letter-spacing:-.025em;font-variant-numeric:tabular-nums}" +
  ".cap-stack{display:flex;align-items:center;height:34px;padding-left:10px}" +
  ".cap-stack>img{width:34px;height:34px;max-width:none;margin-left:-10px;border-radius:999px;object-fit:cover;box-shadow:0 0 0 2.5px var(--cap-card),0 4px 10px -4px rgba(34,28,22,.4);animation:cap-pop .55s var(--cap-spring) both}" +
  ".cap-stack>i{margin-left:-10px;height:34px;min-width:34px;padding:0 7px;border-radius:999px;display:grid;place-items:center;font-style:normal;font-size:12px;font-weight:700;color:#fff;background:var(--cap-ink);box-shadow:0 0 0 2.5px var(--cap-card);animation:cap-pop .55s var(--cap-spring) both}" +
  ".cap-row{display:flex;gap:10px;margin:0 -20px;padding:6px 20px 12px;overflow-x:auto;scroll-snap-type:x proximity;scroll-padding-inline:20px;scrollbar-width:none}" +
  ".cap-row::-webkit-scrollbar{display:none}" +
  ".cap-p{flex:none;display:grid;justify-items:center;gap:8px;width:60px;padding:0;border:0;background:none;font:inherit;color:inherit;cursor:pointer;outline:none;scroll-snap-align:start;animation:cap-up .6s var(--cap-soft) both;animation-delay:calc(.1s + var(--cap-i) * .05s)}" +
  ".cap-face{position:relative;display:block;width:60px;height:60px;border-radius:999px;transition:transform .5s var(--cap-spring)}" +
  ".cap-face>img{width:60px;height:60px;max-width:none;border-radius:999px;object-fit:cover;display:block;filter:grayscale(1) contrast(.95) brightness(1.04);opacity:.72;transition:filter .45s,opacity .45s}" +
  ".cap-face::before{content:'';position:absolute;inset:-4px;border-radius:999px;box-shadow:0 0 0 2px var(--cap-c,var(--cap-accent));opacity:0;transform:scale(.86);transition:opacity .25s,transform .5s var(--cap-spring)}" +
  ".cap-badge{position:absolute;right:-3px;bottom:-3px;width:22px;height:22px;border-radius:999px;display:grid;place-items:center;color:var(--cap-ink);background:#fff;box-shadow:0 0 0 2px var(--cap-card),0 2px 6px rgba(34,28,22,.2);transition:background .3s,color .3s,transform .5s var(--cap-spring)}" +
  ".cap-badge svg{transition:transform .5s var(--cap-spring)}" +
  ".cap-p:hover .cap-face{transform:translateY(-3px)}" +
  ".cap-p:hover .cap-face>img{opacity:.92}" +
  ".cap-p:active .cap-face{transform:scale(.93)}" +
  ".cap-p:focus-visible .cap-face::before{opacity:1;transform:none;box-shadow:0 0 0 2px var(--cap-ink)}" +
  ".cap-p[aria-pressed=true] .cap-face{transform:translateY(-2px)}" +
  ".cap-p[aria-pressed=true] .cap-face>img{filter:none;opacity:1}" +
  ".cap-p[aria-pressed=true] .cap-face::before{opacity:1;transform:none}" +
  ".cap-p[aria-pressed=true] .cap-badge{background:var(--cap-c,var(--cap-accent));color:#fff;transform:scale(1.08)}" +
  ".cap-p[aria-pressed=true] .cap-badge svg{transform:rotate(360deg)}" +
  ".cap-name{max-width:64px;font-size:12.5px;font-weight:560;letter-spacing:-.01em;color:var(--cap-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .3s}" +
  ".cap-p[aria-pressed=true] .cap-name{color:var(--cap-ink);font-weight:650}" +
  ".cap-add .cap-face{display:grid;place-items:center;color:var(--cap-dim);background:none;outline:1.5px dashed rgba(34,28,22,.28);outline-offset:-1.5px;box-shadow:none}" +
  ".cap-add:hover .cap-face{color:var(--cap-ink);outline-color:var(--cap-ink)}" +
  ".cap-add[aria-expanded=true] .cap-face{color:#fff;background:var(--cap-ink);outline-color:var(--cap-ink)}" +
  ".cap-add[aria-expanded=true] .cap-face svg{transform:rotate(45deg)}.cap-add .cap-face svg{transition:transform .45s var(--cap-spring)}" +
  ".cap-foot{display:flex;align-items:center;gap:12px;margin-top:8px;padding-top:16px;border-top:1px solid var(--cap-line)}" +
  ".cap-hint{flex:1;min-width:0;font-size:12.5px;color:var(--cap-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".cap-go{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 18px 0 16px;border:0;border-radius:999px;font:inherit;font-size:14px;font-weight:650;letter-spacing:-.01em;color:#fff;cursor:pointer;outline:none;" +
  "background:linear-gradient(180deg,#ff9142,var(--cap-accent));box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 8px 20px -8px rgba(255,122,26,.8);transition:transform .45s var(--cap-spring),opacity .3s,box-shadow .2s}" +
  ".cap-go:hover{transform:translateY(-1px)}.cap-go:active{transform:scale(.95)}" +
  ".cap-go:focus-visible{box-shadow:0 0 0 2px var(--cap-card),0 0 0 4px var(--cap-ink)}" +
  ".cap-go:disabled{opacity:.4;cursor:default;transform:none;box-shadow:none}" +
  ".cap-go b{font-variant-numeric:tabular-nums}" +
  ".cap-dir{position:absolute;z-index:40;left:20px;right:20px;top:calc(100% - 8px);padding:8px;border-radius:18px;background:#fff;box-shadow:0 0 0 1px rgba(34,28,22,.08),0 20px 44px -16px rgba(80,44,10,.4);transform-origin:top right;animation:cap-open .45s var(--cap-spring) both}" +
  ".cap-q{width:100%;height:38px;padding:0 12px;border:0;border-radius:11px;background:rgba(34,28,22,.05);font:inherit;font-size:13.5px;color:var(--cap-ink);outline:none}" +
  ".cap-q:focus-visible{box-shadow:inset 0 0 0 1.5px var(--cap-accent)}" +
  ".cap-dl{list-style:none;margin:6px 0 0;padding:0}" +
  ".cap-do{display:flex;align-items:center;gap:10px;height:48px;padding:0 8px;border-radius:12px;cursor:pointer;animation:cap-up .4s var(--cap-soft) both;animation-delay:calc(var(--cap-i) * .04s)}" +
  ".cap-do[aria-selected=true]{background:rgba(255,122,26,.09)}" +
  ".cap-do img{width:34px;height:34px;max-width:none;border-radius:999px;object-fit:cover}" +
  ".cap-do b{display:block;font-size:13.5px;font-weight:620}" +
  ".cap-do small{display:block;font-size:12px;color:var(--cap-dim)}" +
  ".cap-none{padding:12px 8px;font-size:13px;color:var(--cap-dim)}" +
  ".cap-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@keyframes cap-in{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}" +
  "@keyframes cap-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
  "@keyframes cap-pop{from{opacity:0;transform:scale(.3) translateX(-8px)}to{opacity:1;transform:none}}" +
  "@keyframes cap-open{from{opacity:0;transform:translateY(-6px) scale(.96)}to{opacity:1;transform:none}}" +
  "@media (prefers-reduced-motion:reduce){.cap-root,.cap-root *,.cap-root *::before{transition-duration:.01ms!important;transition-delay:0s!important;animation:none!important}}"

const Plus = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)
const Tick = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 6.3l2.3 2.2L9.6 3.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function CrewAvatarPicker({
  people,
  directory = [],
  defaultValue = [],
  title = "Participants",
  action = "Start huddle",
  onChange,
  onAction,
  className,
}: CrewAvatarPickerProps) {
  const id = useId()
  const [roster, setRoster] = useState(people)
  const [sel, setSel] = useState(defaultValue)
  const [adding, setAdding] = useState(false)
  const [q, setQ] = useState("")
  const [active, setActive] = useState(0)
  const btns = useRef([] as (HTMLButtonElement | null)[])
  const addBtn = useRef(null as HTMLButtonElement | null)
  const input = useRef(null as HTMLInputElement | null)
  const root = useRef(null as HTMLDivElement | null)

  const pool = search(directory.filter((d) => !roster.some((r) => r.id === d.id)), q) as CrewMember[]
  const picked = roster.filter((p) => sel.includes(p.id))

  useEffect(() => {
    if (adding) input.current?.focus()
  }, [adding])

  useEffect(() => {
    if (!adding) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setAdding(false)
    }
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [adding])

  const set = (next: string[]) => {
    setSel(next)
    onChange?.(next)
  }

  const recruit = (m: CrewMember) => {
    setRoster((r) => [...r, m])
    set([...sel, m.id])
    setAdding(false)
    setQ("")
    setActive(0)
    addBtn.current?.focus()
  }

  const tiles = roster.length + (directory.length ? 1 : 0)

  return (
    <div ref={root} className={"cap-root" + (className ? " " + className : "")}>
      <style>{CSS}</style>
      <div className="cap-top">
        <div className="cap-title">
          <b>{title}</b>
          <span>{countLabel(sel.length, roster.length)}</span>
        </div>
        <div className="cap-stack" aria-hidden="true">
          {picked.slice(0, 3).map((p) => (
            <img key={p.id} src={p.photo} alt="" width={34} height={34} />
          ))}
          {picked.length > 3 && <i>+{picked.length - 3}</i>}
        </div>
      </div>
      <div
        className="cap-row"
        role="group"
        aria-label={title}
        onKeyDown={(e) => {
          const at = btns.current.findIndex((b) => b === document.activeElement)
          if (at < 0) return
          const to = wrapStep(at, e.key, tiles)
          if (to !== at) {
            e.preventDefault()
            btns.current[to]?.focus()
          }
        }}
      >
        {roster.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              btns.current[i] = el
            }}
            type="button"
            className="cap-p"
            aria-pressed={sel.includes(p.id)}
            aria-label={p.name + (p.role ? ", " + p.role : "")}
            style={{ ["--cap-i" as string]: i, ["--cap-c" as string]: p.color }}
            onClick={() => set(flipId(sel, p.id))}
          >
            <span className="cap-face">
              <img src={p.photo} alt="" width={60} height={60} />
              <span className="cap-badge">{sel.includes(p.id) ? <Tick /> : <Plus size={10} />}</span>
            </span>
            <span className="cap-name">{p.name.split(" ")[0]}</span>
          </button>
        ))}
        {directory.length > 0 && (
          <button
            ref={(el) => {
              btns.current[roster.length] = el
              addBtn.current = el
            }}
            type="button"
            className="cap-p cap-add"
            aria-haspopup="listbox"
            aria-expanded={adding}
            style={{ ["--cap-i" as string]: roster.length }}
            onClick={() => setAdding((a) => !a)}
          >
            <span className="cap-face">
              <Plus size={16} />
            </span>
            <span className="cap-name">Add</span>
          </button>
        )}
      </div>
      <div className="cap-foot">
        <span className="cap-hint">{picked.length ? picked.map((p) => p.name.split(" ")[0]).join(", ") : "Tap a face to add them"}</span>
        <button type="button" className="cap-go" disabled={!picked.length} onClick={() => onAction?.(sel)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 10l5-3v10l-5-3zM3.5 6.5h11.5v11H3.5z" />
          </svg>
          {actionLabel(action, picked.length)}
        </button>
      </div>
      {adding && (
        <div className="cap-dir">
          <input
            ref={input}
            className="cap-q"
            role="combobox"
            aria-expanded="true"
            aria-controls={id + "-dir"}
            aria-activedescendant={pool[active] ? id + "-d" + active : undefined}
            aria-label="Find someone to add"
            placeholder="Find someone…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault()
                setAdding(false)
                addBtn.current?.focus()
              } else if (e.key === "Enter" && pool[active]) {
                e.preventDefault()
                recruit(pool[active])
              } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault()
                setActive((a) => wrapStep(a, e.key, pool.length))
              } else if (e.key === "Tab") setAdding(false)
            }}
          />
          <ul className="cap-dl" id={id + "-dir"} role="listbox" aria-label="People">
            {pool.map((m, i) => (
              <li
                key={m.id}
                id={id + "-d" + i}
                role="option"
                aria-selected={i === active}
                className="cap-do"
                style={{ ["--cap-i" as string]: i }}
                onPointerMove={() => i !== active && setActive(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => recruit(m)}
              >
                <img src={m.photo} alt="" width={34} height={34} />
                <span>
                  <b>{m.name}</b>
                  {m.role && <small>{m.role}</small>}
                </span>
              </li>
            ))}
            {!pool.length && <li className="cap-none">{q ? "Nobody by that name" : "Everyone is already here"}</li>}
          </ul>
        </div>
      )}
      <span className="cap-sr" aria-live="polite">
        {sel.length + " selected"}
      </span>
    </div>
  )
}

export default CrewAvatarPicker
