"use client"

import { useEffect, useId, useRef, useState } from "react"

export type Network = {
  id: string
  name: string
  /** Brand colour for the mark and the glow. */
  color: string
  /** A logo URL, or leave empty for a monogram mark. */
  logo?: string
  /** Right-hand figure, e.g. a balance. */
  value?: string
  /** Small line under the name, e.g. gas. */
  detail?: string
}

export type ChainNetworkSelectorProps = {
  networks: Network[]
  defaultValue?: string[]
  onChange?: (ids: string[]) => void
  label?: string
  defaultOpen?: boolean
  className?: string
}

// #region logic
export const ALL = "__all"
export const OPT = 52

export function toggleId(sel: string[], id: string, all: string[]): string[] {
  if (id === ALL) return sel.length === all.length ? [] : [...all]
  const next = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
  return all.filter((x) => next.includes(x))
}

export function summary(sel: string[], all: { id: string; name: string }[]): string {
  if (!sel.length) return "Select networks"
  if (sel.length === all.length) return "All networks"
  if (sel.length === 1) return all.find((n) => n.id === sel[0])?.name ?? "1 network"
  return sel.length + " networks"
}

export function listHeight(n: number): number {
  // "All networks" row + a 9 px rule + one row per network + 12 px padding
  return OPT + 9 + n * OPT + 12
}

export function move(i: number, key: string, n: number): number {
  if (n <= 0) return -1
  if (key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowUp") return (i - 1 + n) % n
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
  ".cns-root{--cns-ink:#15141c;--cns-dim:#7b7889;--cns-paper:#ffffff;--cns-violet:#6a4cff;--cns-spring:" + SPRING + ";--cns-soft:" + SOFT + ";" +
  "position:relative;display:inline-block;font-family:'Inter Tight','Geist',ui-sans-serif,system-ui,sans-serif;color:var(--cns-ink);-webkit-font-smoothing:antialiased;animation:cns-in .6s var(--cns-soft) both}" +
  ".cns-trigger{display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 14px 0 8px;border:0;border-radius:999px;font:inherit;font-size:14.5px;font-weight:620;letter-spacing:-.015em;color:var(--cns-ink);cursor:pointer;outline:none;" +
  "background:linear-gradient(180deg,#fff,#f4f3f8);box-shadow:inset 0 0 0 1px rgba(21,20,28,.09),inset 0 -2px 0 rgba(21,20,28,.04),0 1px 2px rgba(21,20,28,.08),0 10px 24px -12px rgba(60,40,140,.35);transition:transform .45s var(--cns-spring),box-shadow .25s}" +
  ".cns-trigger:hover{box-shadow:inset 0 0 0 1px rgba(21,20,28,.14),0 1px 2px rgba(21,20,28,.08),0 14px 30px -12px rgba(60,40,140,.45)}" +
  ".cns-trigger:active{transform:scale(.97)}" +
  ".cns-trigger:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--cns-violet)}" +
  ".cns-cluster{display:flex;align-items:center;padding-left:8px;min-width:32px;height:32px}" +
  ".cns-cluster>.cns-mark{margin-left:-9px;box-shadow:0 0 0 2.5px #fff;animation:cns-pop .5s var(--cns-spring) both}" +
  ".cns-cluster>.cns-plus{margin-left:-9px;height:32px;min-width:32px;padding:0 6px;border-radius:999px;display:grid;place-items:center;font-size:11.5px;font-weight:700;color:#fff;background:var(--cns-ink);box-shadow:0 0 0 2.5px #fff;animation:cns-pop .5s var(--cns-spring) both}" +
  ".cns-empty{width:32px;height:32px;margin-left:-8px;border-radius:999px;box-shadow:inset 0 0 0 1.5px rgba(21,20,28,.18);background:repeating-linear-gradient(45deg,transparent 0 4px,rgba(21,20,28,.06) 4px 5px)}" +
  ".cns-sum{min-width:96px;text-align:left}" +
  ".cns-chev{color:var(--cns-dim);transition:transform .5s var(--cns-spring)}" +
  ".cns-root[data-open=true] .cns-chev{transform:rotate(180deg)}" +
  ".cns-mark{flex:none;position:relative;width:32px;height:32px;border-radius:999px;display:grid;place-items:center;overflow:hidden;color:#fff;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;font-weight:700;line-height:1;text-shadow:0 1px 1px rgba(0,0,0,.2);" +
  "background:radial-gradient(120% 120% at 30% 20%,rgba(255,255,255,.35),transparent 50%),var(--cns-c);box-shadow:inset 0 -2px 4px rgba(0,0,0,.15)}" +
  ".cns-mark>img{width:100%;height:100%;max-width:none;object-fit:cover;display:block}" +
  ".cns-pop{position:absolute;z-index:50;top:calc(100% + 10px);left:0;width:min(320px,calc(100vw - 32px));border-radius:22px;overflow:hidden;background:var(--cns-paper);" +
  "box-shadow:inset 0 0 0 1px rgba(21,20,28,.07),0 2px 4px rgba(21,20,28,.05),0 24px 48px -18px rgba(40,24,120,.35),0 60px 90px -50px rgba(40,24,120,.35);" +
  "transform-origin:24px -10px;animation:cns-open .5s var(--cns-spring) both}" +
  ".cns-glow{position:absolute;inset:-40px -10% auto;height:130px;pointer-events:none;filter:blur(34px);opacity:.85;transition:background .6s}" +
  ".cns-list{position:relative;margin:0;padding:6px;list-style:none;outline:none;max-height:min(70vh,520px);overflow:auto;scrollbar-width:thin}" +
  ".cns-rule{height:1px;margin:4px 10px;background:rgba(21,20,28,.07)}" +
  ".cns-opt{display:flex;align-items:center;gap:12px;height:52px;padding:0 12px 0 10px;border-radius:14px;cursor:pointer;opacity:0;animation:cns-row .45s var(--cns-soft) both;animation-delay:calc(.05s + var(--cns-i) * .035s);transition:background .15s}" +
  ".cns-opt:hover,.cns-opt[data-active=true]{background:rgba(106,76,255,.06)}" +
  ".cns-list:focus-visible .cns-opt[data-active=true]{box-shadow:inset 0 0 0 1.5px rgba(106,76,255,.5)}" +
  ".cns-box{flex:none;position:relative;width:22px;height:22px;border-radius:999px;box-shadow:inset 0 0 0 1.5px rgba(21,20,28,.2);transition:box-shadow .2s,background .3s}" +
  ".cns-box::before{content:'';position:absolute;inset:0;border-radius:inherit;background:var(--cns-c,var(--cns-violet));transform:scale(0);transition:transform .45s var(--cns-spring)}" +
  ".cns-box svg{position:absolute;inset:0;margin:auto;color:#fff}" +
  ".cns-box path{stroke-dasharray:14;stroke-dashoffset:14;transition:stroke-dashoffset .3s cubic-bezier(.6,0,.2,1)}" +
  ".cns-opt[aria-selected=true] .cns-box{box-shadow:none}" +
  ".cns-opt[aria-selected=true] .cns-box::before{transform:scale(1)}" +
  ".cns-opt[aria-selected=true] .cns-box path{stroke-dashoffset:0;transition-delay:.12s}" +
  ".cns-opt .cns-mark{transition:transform .45s var(--cns-spring),filter .3s}" +
  ".cns-opt[aria-selected=false] .cns-mark{filter:saturate(.25) opacity(.7)}" +
  ".cns-opt:hover .cns-mark{transform:scale(1.08) rotate(-6deg)}" +
  ".cns-txt{flex:1;min-width:0;line-height:1.2}" +
  ".cns-txt b{display:block;font-size:14px;font-weight:620;letter-spacing:-.012em;transition:color .2s}" +
  ".cns-opt[aria-selected=false] .cns-txt b{color:#5f5c6d}" +
  ".cns-txt small{display:block;margin-top:2px;font-size:11.5px;color:var(--cns-dim);font-variant-numeric:tabular-nums}" +
  ".cns-val{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-.01em;color:var(--cns-ink);transition:opacity .25s}" +
  ".cns-opt[aria-selected=false] .cns-val{opacity:.4}" +
  ".cns-allmarks{display:grid;grid-template-columns:repeat(2,13px);gap:2px;width:32px;height:32px;place-content:center}" +
  ".cns-allmarks i{width:13px;height:13px;border-radius:999px;background:var(--cns-c)}" +
  ".cns-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@keyframes cns-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}" +
  "@keyframes cns-open{from{opacity:0;transform:scale(.9) translateY(-8px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}" +
  "@keyframes cns-row{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}" +
  "@keyframes cns-pop{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:none}}" +
  "@media (prefers-reduced-motion:reduce){.cns-root,.cns-root *,.cns-root *::before{transition-duration:.01ms!important;transition-delay:0s!important;animation:none!important}}"

const Check = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.6 6.2l2.2 2.1 4.6-4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Mark = ({ n }: { n: Network }) => (
  <span className="cns-mark" style={{ ["--cns-c" as string]: n.color }}>
    {n.logo ? <img src={n.logo} alt="" width={32} height={32} /> : n.name.slice(0, 1)}
  </span>
)

export function ChainNetworkSelector({ networks, defaultValue, onChange, label = "Networks", defaultOpen = false, className }: ChainNetworkSelectorProps) {
  const id = useId()
  const all = networks.map((n) => n.id)
  const [sel, setSel] = useState(defaultValue ?? all)
  const [open, setOpen] = useState(defaultOpen)
  const [active, setActive] = useState(0)
  const root = useRef(null as HTMLDivElement | null)
  const list = useRef(null as HTMLUListElement | null)
  const trigger = useRef(null as HTMLButtonElement | null)

  const rows = [ALL, ...all]
  const picked = networks.filter((n) => sel.includes(n.id))
  const glow = picked.length
    ? picked.map((n, i) => "radial-gradient(40% 60% at " + Math.round(((i + 0.5) / picked.length) * 100) + "% 50%," + n.color + ",transparent 70%)").join(",")
    : "none"

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [open])

  const flip = (rid: string) => {
    const next = toggleId(sel, rid, all)
    setSel(next)
    onChange?.(next)
  }

  // focus moves into the list only when a person opens it, never on mount
  const show = () => {
    setOpen(true)
    requestAnimationFrame(() => list.current?.focus())
  }

  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      close()
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      flip(rows[active])
    } else if (e.key === "Tab") setOpen(false)
    else {
      const to = move(active, e.key, rows.length)
      if (to !== active) {
        e.preventDefault()
        setActive(to)
      }
    }
  }

  const shown = picked.slice(0, 4)

  return (
    <div ref={root} className={"cns-root" + (className ? " " + className : "")} data-open={open}>
      <style>{CSS}</style>
      <button
        ref={trigger}
        type="button"
        className="cns-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id + "-list" : undefined}
        aria-label={label + ": " + summary(sel, networks)}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault()
            show()
          }
        }}
      >
        <span className="cns-cluster" aria-hidden="true">
          {shown.length ? shown.map((n) => <Mark key={n.id} n={n} />) : <span className="cns-empty" />}
          {picked.length > shown.length && <span className="cns-plus">+{picked.length - shown.length}</span>}
        </span>
        <span className="cns-sum">{summary(sel, networks)}</span>
        <svg className="cns-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 10l4-4 4 4M8 14l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="cns-pop">
          <div className="cns-glow" style={{ background: glow }} aria-hidden="true" />
          <ul
            ref={list}
            id={id + "-list"}
            className="cns-list"
            role="listbox"
            aria-multiselectable="true"
            aria-label={label}
            tabIndex={0}
            aria-activedescendant={id + "-o" + active}
            onKeyDown={onKey}
            style={{ height: listHeight(networks.length) }}
          >
            {rows.map((rid, i) => {
              const n = networks.find((x) => x.id === rid)
              const on = rid === ALL ? sel.length === all.length : sel.includes(rid)
              return (
                <li key={rid} role="presentation">
                  <div
                    id={id + "-o" + i}
                    role="option"
                    aria-selected={on}
                    className="cns-opt"
                    data-active={i === active}
                    style={{ ["--cns-i" as string]: i, ["--cns-c" as string]: n?.color }}
                    onPointerMove={() => i !== active && setActive(i)}
                    onClick={() => {
                      setActive(i)
                      flip(rid)
                    }}
                  >
                    <span className="cns-box">
                      <Check />
                    </span>
                    {n ? (
                      <Mark n={n} />
                    ) : (
                      <span className="cns-allmarks" aria-hidden="true">
                        {networks.slice(0, 4).map((x) => (
                          <i key={x.id} style={{ ["--cns-c" as string]: x.color }} />
                        ))}
                      </span>
                    )}
                    <span className="cns-txt">
                      <b>{n ? n.name : "All networks"}</b>
                      <small>{n ? n.detail : sel.length + " of " + all.length + " selected"}</small>
                    </span>
                    {n?.value && <span className="cns-val">{n.value}</span>}
                  </div>
                  {i === 0 && <div className="cns-rule" />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <span className="cns-sr" aria-live="polite">
        {summary(sel, networks)}
      </span>
    </div>
  )
}

export default ChainNetworkSelector
