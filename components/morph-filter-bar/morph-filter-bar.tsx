"use client"

import { useEffect, useId, useRef, useState } from "react"

export type FilterOption = { value: string; label: string; swatch?: string; avatar?: string }
export type FilterField = { key: string; label: string; icon?: string; options: FilterOption[] }
export type AppliedFilter = { key: string; value: string }

export type MorphFilterBarProps = {
  fields: FilterField[]
  defaultValue?: AppliedFilter[]
  onChange?: (filters: AppliedFilter[]) => void
  /** Called when the picker opens or closes, e.g. to dim the results behind it. */
  onOpenChange?: (open: boolean) => void
  title?: string
  className?: string
}

// #region logic
export const SEARCH = 46
export const OPT = 36
export const PAD = 10
export const MAX_ROWS = 6

export function matches(list: { label: string }[], q: string) {
  const s = q.trim().toLowerCase()
  return s ? list.filter((x) => x.label.toLowerCase().includes(s)) : list
}

/** Panel height from the row count, so the morph needs no measuring. */
export function panelHeight(rows: number): number {
  return SEARCH + PAD + Math.max(1, Math.min(rows, MAX_ROWS)) * OPT
}

export function step(i: number, key: string, n: number): number {
  if (n <= 0) return -1
  if (key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowUp") return (i - 1 + n) % n
  return i
}

export function addFilter(list: { key: string; value: string }[], f: { key: string; value: string }) {
  return [...list.filter((x) => x.key !== f.key), f]
}
// #endregion

const SPRING =
  "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1)"
const SOFT =
  "linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001 85.9%, 1)"

const CSS =
  ".mfb-root{--mfb-ink:#121212;--mfb-ink2:#1f1f1f;--mfb-lime:#d6ff5c;--mfb-text:#f4f4ef;--mfb-dim:rgba(244,244,239,.5);--mfb-chip:#fff;--mfb-cink:#18181a;--mfb-cdim:#76767c;--mfb-spring:" + SPRING + ";--mfb-soft:" + SOFT + ";" +
  "position:relative;z-index:2;font-family:'Inter Tight','Geist',ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;color:var(--color-foreground);animation:mfb-in .6s var(--mfb-soft) both}" +
  ".mfb-title{display:flex;align-items:baseline;gap:10px;margin:0 0 12px;font-size:13px;font-weight:650;letter-spacing:-.01em}" +
  ".mfb-title span{font-size:12px;font-weight:550;color:var(--color-muted-foreground);font-variant-numeric:tabular-nums}" +
  ".mfb-clear{margin-left:auto;border:0;background:none;padding:2px 4px;border-radius:6px;font:inherit;font-size:12px;font-weight:600;color:var(--color-muted-foreground);cursor:pointer;outline:none}" +
  ".mfb-clear:hover{color:var(--color-foreground)}.mfb-clear:focus-visible{box-shadow:0 0 0 2px var(--color-foreground)}" +
  ".mfb-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-height:38px}" +
  ".mfb-chip{display:inline-flex;align-items:center;height:34px;padding:0 4px 0 0;border-radius:11px;background:var(--mfb-chip);color:var(--mfb-cink);font-size:12.5px;font-weight:560;letter-spacing:-.005em;" +
  "box-shadow:inset 0 0 0 1px rgba(24,24,26,.09),inset 0 -1px 0 rgba(24,24,26,.06),0 1px 2px rgba(24,24,26,.06),0 6px 14px -8px rgba(24,24,26,.22);animation:mfb-pop .55s var(--mfb-spring) both;transform-origin:left center}" +
  ".mfb-chip.is-out{animation:mfb-out .26s cubic-bezier(.5,0,.75,0) both}" +
  ".mfb-seg{display:inline-flex;align-items:center;gap:6px;height:100%;padding:0 10px;white-space:nowrap}" +
  ".mfb-seg+.mfb-seg{box-shadow:inset 1px 0 0 rgba(24,24,26,.08)}" +
  ".mfb-seg.is-op{color:var(--mfb-cdim);font-weight:500;padding:0 8px}" +
  ".mfb-seg svg{color:var(--mfb-cdim)}" +
  ".mfb-sw{width:8px;height:8px;border-radius:999px;box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 0 3px rgba(0,0,0,.08)}" +
  ".mfb-av{width:18px;height:18px;max-width:none;border-radius:999px;object-fit:cover;display:block}" +
  ".mfb-x{width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:7px;background:none;color:var(--mfb-cdim);cursor:pointer;outline:none;transition:background .15s,color .15s,transform .3s var(--mfb-spring)}" +
  ".mfb-x:hover{background:rgba(24,24,26,.07);color:var(--mfb-cink)}.mfb-x:active{transform:scale(.85)}" +
  ".mfb-x:focus-visible{box-shadow:0 0 0 2px var(--mfb-cink)}" +
  ".mfb-add{position:relative;width:36px;height:34px;flex:none}" +
  ".mfb-morph{position:absolute;z-index:30;top:0;left:0;width:36px;height:34px;border-radius:11px;overflow:hidden;color:var(--mfb-text);" +
  "background:radial-gradient(120% 90% at 0% 0%,#2b2b2b,var(--mfb-ink) 60%);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 1px 2px rgba(0,0,0,.25),0 8px 18px -8px rgba(0,0,0,.45);" +
  "transition:width .55s var(--mfb-spring),height .55s var(--mfb-spring),top .5s var(--mfb-spring),border-radius .45s var(--mfb-soft),box-shadow .3s}" +
  ".mfb-add::before{content:'';position:absolute;inset:0;border-radius:11px;outline:1.5px dashed color-mix(in oklab,var(--color-foreground) 28%,transparent);outline-offset:-1.5px;opacity:0;transition:opacity .25s}" +
  ".mfb-root[data-open=true] .mfb-add::before{opacity:1}" +
  ".mfb-root[data-open=true] .mfb-morph{top:44px;width:min(272px,calc(100vw - 48px));border-radius:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 2px 4px rgba(0,0,0,.2),0 24px 50px -16px rgba(0,0,0,.55),0 50px 90px -40px rgba(30,40,0,.45)}" +
  ".mfb-plus{position:absolute;inset:0;width:36px;height:34px;display:grid;place-items:center;border:0;background:none;color:inherit;cursor:pointer;outline:none;border-radius:11px;transition:opacity .2s,transform .45s var(--mfb-spring)}" +
  ".mfb-plus:hover svg{transform:rotate(90deg)}.mfb-plus svg{transition:transform .45s var(--mfb-spring)}" +
  ".mfb-plus:focus-visible{box-shadow:inset 0 0 0 2px var(--mfb-lime)}" +
  ".mfb-root[data-open=true] .mfb-plus{opacity:0;transform:scale(.6);pointer-events:none}" +
  ".mfb-panel{position:absolute;top:0;left:0;width:min(272px,calc(100vw - 48px));opacity:0;transform:translateY(-4px);transition:opacity .2s,transform .35s var(--mfb-soft);pointer-events:none}" +
  ".mfb-root[data-open=true] .mfb-panel{opacity:1;transform:none;pointer-events:auto;transition-delay:.08s}" +
  ".mfb-search{display:flex;align-items:center;gap:8px;height:46px;padding:0 12px;border-bottom:1px solid rgba(255,255,255,.08)}" +
  ".mfb-crumb{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 8px 0 7px;border-radius:7px;font-size:11.5px;font-weight:650;color:#1b2400;background:var(--mfb-lime);white-space:nowrap;animation:mfb-pop .45s var(--mfb-spring) both}" +
  ".mfb-input{flex:1;min-width:0;height:30px;border:0;background:none;outline:none;color:var(--mfb-text);font:inherit;font-size:13.5px;letter-spacing:-.01em}" +
  ".mfb-input::placeholder{color:var(--mfb-dim)}" +
  ".mfb-list{list-style:none;margin:0;padding:5px;max-height:226px;overflow:auto;scrollbar-width:none}" +
  ".mfb-opt{display:flex;align-items:center;gap:10px;height:36px;padding:0 9px;border-radius:9px;font-size:13.5px;font-weight:520;letter-spacing:-.01em;cursor:pointer;color:rgba(244,244,239,.86);" +
  "opacity:0;animation:mfb-row .4s var(--mfb-soft) both;animation-delay:calc(.08s + var(--mfb-i) * .03s);transition:background .12s,color .12s}" +
  ".mfb-opt[aria-selected=true]{background:rgba(255,255,255,.08);color:#fff}" +
  ".mfb-opt[aria-selected=true] .mfb-oi{color:var(--mfb-lime)}" +
  ".mfb-oi{flex:none;width:22px;height:22px;display:grid;place-items:center;color:var(--mfb-dim);transition:color .12s}" +
  ".mfb-oi .mfb-sw{box-shadow:0 0 0 2px var(--mfb-ink),0 0 0 3px rgba(255,255,255,.15)}" +
  ".mfb-oi .mfb-av{width:22px;height:22px;box-shadow:0 0 0 1px rgba(255,255,255,.15)}" +
  ".mfb-ol{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".mfb-ok{font-size:11px;color:var(--mfb-dim)}" +
  ".mfb-none{padding:10px 9px;font-size:13px;color:var(--mfb-dim)}" +
  ".mfb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@keyframes mfb-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}" +
  "@keyframes mfb-pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}" +
  "@keyframes mfb-out{to{opacity:0;transform:scale(.7)}}" +
  "@keyframes mfb-row{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}" +
  "@media (prefers-reduced-motion:reduce){.mfb-root,.mfb-root *{transition-duration:.01ms!important;transition-delay:0s!important;animation-duration:.01ms!important;animation-delay:0s!important}}"

const Glyph = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

const Mark = ({ o }: { o?: FilterOption }) => (o?.avatar ? <img className="mfb-av" src={o.avatar} alt="" width={18} height={18} /> : o?.swatch ? <span className="mfb-sw" style={{ background: o.swatch }} /> : null)

export function MorphFilterBar({ fields, defaultValue = [], onChange, onOpenChange, title = "Filters", className }: MorphFilterBarProps) {
  const id = useId()
  const [applied, setApplied] = useState(defaultValue)
  const [leaving, setLeaving] = useState("")
  const [open, setOpen] = useState(false)
  const [field, setField] = useState(null as FilterField | null)
  const [q, setQ] = useState("")
  const [active, setActive] = useState(0)
  const input = useRef(null as HTMLInputElement | null)
  const plus = useRef(null as HTMLButtonElement | null)
  const root = useRef(null as HTMLDivElement | null)
  const timer = useRef(0)

  const rows: { label: string; field?: FilterField; option?: FilterOption }[] = field
    ? (matches(field.options, q) as FilterOption[]).map((o) => ({ label: o.label, option: o }))
    : (matches(fields, q) as FilterField[]).map((f) => ({ label: f.label, field: f }))

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open, field])

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close(false)
    }
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [open])

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    onOpenChange?.(open)
  }, [open])

  const commit = (next: AppliedFilter[]) => {
    setApplied(next)
    onChange?.(next)
  }

  const close = (refocus = true) => {
    setOpen(false)
    setField(null)
    setQ("")
    setActive(0)
    if (refocus) plus.current?.focus()
  }

  const pick = (r: (typeof rows)[number]) => {
    if (r.field) {
      setField(r.field)
      setQ("")
      setActive(0)
    } else if (field && r.option) {
      commit(addFilter(applied, { key: field.key, value: r.option.value }))
      close()
    }
  }

  const remove = (key: string) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setLeaving(key)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setLeaving("")
      commit(applied.filter((f) => f.key !== key))
      plus.current?.focus()
    }, reduce ? 0 : 240)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => step(a, e.key, rows.length))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (rows[active]) pick(rows[active])
    } else if (e.key === "Escape" || (e.key === "Backspace" && !q && field)) {
      e.preventDefault()
      if (field) {
        setField(null)
        setActive(0)
      } else close()
    } else if (e.key === "Tab") close(false)
  }

  const listId = id + "-list"
  const h = panelHeight(rows.length)

  return (
    <div ref={root} className={"mfb-root" + (className ? " " + className : "")} data-open={open}>
      <style>{CSS}</style>
      <div className="mfb-title">
        {title}
        <span>{applied.length}</span>
        {applied.length > 1 && (
          <button type="button" className="mfb-clear" onClick={() => commit([])}>
            Clear all
          </button>
        )}
      </div>
      <div className="mfb-row" role="group" aria-label={title}>
        <div className="mfb-add">
          <div className="mfb-morph" style={open ? { height: h } : undefined}>
            <button
              ref={plus}
              type="button"
              className="mfb-plus"
              aria-label="Add filter"
              aria-haspopup="listbox"
              aria-expanded={open}
              tabIndex={open ? -1 : 0}
              onClick={() => setOpen(true)}
            >
              <Glyph d="M12 5v14M5 12h14" size={16} />
            </button>
            <div className="mfb-panel" aria-hidden={!open}>
              <div className="mfb-search">
                {field && (
                  <span className="mfb-crumb">
                    {field.icon && <Glyph d={field.icon} size={12} />}
                    {field.label}
                  </span>
                )}
                <input
                  ref={input}
                  className="mfb-input"
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={rows[active] ? listId + "-" + active : undefined}
                  aria-label={field ? "Choose a " + field.label.toLowerCase() : "Filter by"}
                  placeholder={field ? "Search " + field.label.toLowerCase() + "…" : "Filter by…"}
                  tabIndex={open ? 0 : -1}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    setActive(0)
                  }}
                  onKeyDown={onKey}
                />
              </div>
              <ul className="mfb-list" id={listId} role="listbox" key={field?.key ?? "fields"}>
                {rows.map((r, i) => (
                  <li
                    key={r.label}
                    id={listId + "-" + i}
                    role="option"
                    aria-selected={i === active}
                    className="mfb-opt"
                    style={{ ["--mfb-i" as string]: i }}
                    onPointerMove={() => i !== active && setActive(i)}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => pick(r)}
                  >
                    <span className="mfb-oi">{r.field ? r.field.icon && <Glyph d={r.field.icon} size={15} /> : <Mark o={r.option} />}</span>
                    <span className="mfb-ol">{r.label}</span>
                    {r.field && <span className="mfb-ok">{r.field.options.length}</span>}
                  </li>
                ))}
                {!rows.length && <li className="mfb-none">No matches</li>}
              </ul>
            </div>
          </div>
        </div>
        {applied.map((f) => {
          const fl = fields.find((x) => x.key === f.key)
          const o = fl?.options.find((x) => x.value === f.value)
          if (!fl) return null
          return (
            <span key={f.key} className={"mfb-chip" + (leaving === f.key ? " is-out" : "")}>
              <span className="mfb-seg">
                {fl.icon && <Glyph d={fl.icon} />}
                {fl.label}
              </span>
              <span className="mfb-seg is-op">is</span>
              <span className="mfb-seg">
                <Mark o={o} />
                {o?.label ?? f.value}
              </span>
              <button type="button" className="mfb-x" aria-label={"Remove " + fl.label + " filter"} onClick={() => remove(f.key)}>
                <Glyph d="M7 7l10 10M17 7L7 17" size={12} />
              </button>
            </span>
          )
        })}
      </div>
      <span className="mfb-sr" aria-live="polite">
        {applied.length + (applied.length === 1 ? " filter" : " filters") + " applied"}
      </span>
    </div>
  )
}

export default MorphFilterBar
