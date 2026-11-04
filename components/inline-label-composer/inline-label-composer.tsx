"use client"

import { useEffect, useId, useRef, useState } from "react"

export type Label = { id: string; name: string; color: string }

export type InlineLabelComposerProps = {
  labels: Label[]
  defaultValue?: string[]
  /** Colours offered for new labels. */
  palette?: string[]
  title?: string
  onChange?: (selected: string[], labels: Label[]) => void
  className?: string
}

// #region logic
export const PALETTE = ["#e5484d", "#f76b15", "#ffb224", "#30a46c", "#12a594", "#0090ff", "#6e56cf", "#d6409f", "#8d8d8d"]

export function filterLabels(list: { name: string }[], q: string) {
  const s = q.trim().toLowerCase()
  return s ? list.filter((l) => l.name.toLowerCase().includes(s)) : list
}

export function canCreate(q: string, list: { name: string }[]): boolean {
  const s = q.trim().toLowerCase()
  return !!s && !list.some((l) => l.name.toLowerCase() === s)
}

export function cycle(i: number, d: number, n: number): number {
  return n ? (((i + d) % n) + n) % n : 0
}

export function slug(name: string, taken: string[]): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "label"
  let id = base
  for (let k = 2; taken.includes(id); k++) id = base + "-" + k
  return id
}
// #endregion

const SPRING =
  "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1)"
const SOFT =
  "linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001 85.9%, 1)"

const CSS =
  ".ilc-root{--ilc-spring:" + SPRING + ";--ilc-soft:" + SOFT + ";--ilc-surface:color-mix(in oklab,var(--color-background) 94%,var(--color-foreground));" +
  "position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-height:32px;font-family:'Inter Tight','Geist',ui-sans-serif,system-ui,sans-serif;color:var(--color-foreground);-webkit-font-smoothing:antialiased}" +
  ".ilc-chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 4px 0 10px;border-radius:8px;font-size:13px;font-weight:560;letter-spacing:-.005em;white-space:nowrap;" +
  "color:color-mix(in oklab,var(--ilc-c) 62%,var(--color-foreground));background:color-mix(in oklab,var(--ilc-c) 16%,transparent);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--ilc-c) 22%,transparent);animation:ilc-pop .5s var(--ilc-spring) both}" +
  ".ilc-chip.is-new{animation:ilc-born .7s var(--ilc-spring) both}" +
  ".ilc-chip i{width:7px;height:7px;border-radius:999px;background:var(--ilc-c);box-shadow:0 0 0 2.5px color-mix(in oklab,var(--ilc-c) 25%,transparent)}" +
  ".ilc-x{width:20px;height:20px;display:grid;place-items:center;border:0;border-radius:5px;background:none;color:inherit;opacity:.5;cursor:pointer;outline:none;transition:opacity .15s,background .15s}" +
  ".ilc-x:hover,.ilc-x:focus-visible{opacity:1;background:color-mix(in oklab,var(--ilc-c) 20%,transparent)}" +
  ".ilc-add{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px 0 7px;border:0;border-radius:8px;background:none;font:inherit;font-size:13px;font-weight:550;color:var(--color-muted-foreground);cursor:pointer;outline:none;transition:background .15s,color .15s}" +
  ".ilc-add:hover,.ilc-add[aria-expanded=true]{background:color-mix(in oklab,var(--color-foreground) 7%,transparent);color:var(--color-foreground)}" +
  ".ilc-add:focus-visible{box-shadow:0 0 0 2px var(--color-primary)}" +
  ".ilc-add svg{transition:transform .45s var(--ilc-spring)}.ilc-add[aria-expanded=true] svg{transform:rotate(45deg)}" +
  ".ilc-pop{position:absolute;z-index:40;top:calc(100% + 8px);left:0;width:min(300px,100%);min-width:220px;border-radius:14px;background:var(--color-background);" +
  "box-shadow:0 0 0 1px var(--color-border),0 2px 4px rgba(0,0,0,.05),0 18px 40px -14px rgba(0,0,0,.28);transform-origin:16px -8px;animation:ilc-open .42s var(--ilc-spring) both;overflow:hidden}" +
  ".ilc-field{display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding:8px 10px;border-bottom:1px solid var(--color-border);background:var(--ilc-surface)}" +
  ".ilc-field .ilc-chip{height:24px;font-size:12px;padding:0 3px 0 8px}" +
  ".ilc-input{flex:1;min-width:90px;height:26px;border:0;background:none;outline:none;font:inherit;font-size:13.5px;color:var(--color-foreground)}" +
  ".ilc-input::placeholder{color:var(--color-muted-foreground)}" +
  ".ilc-cap{padding:8px 12px 4px;font-size:11px;font-weight:650;letter-spacing:.04em;color:var(--color-muted-foreground)}" +
  ".ilc-list{list-style:none;margin:0;padding:2px 6px 6px;max-height:232px;overflow:auto}" +
  ".ilc-opt{display:flex;align-items:center;gap:10px;height:34px;padding:0 8px;border-radius:8px;font-size:13.5px;cursor:pointer;animation:ilc-row .35s var(--ilc-soft) both;animation-delay:calc(var(--ilc-i) * .025s)}" +
  ".ilc-opt[data-active=true]{background:color-mix(in oklab,var(--color-foreground) 7%,transparent)}" +
  ".ilc-opt .ilc-chip{animation:none;height:24px;padding:0 9px;font-size:12.5px}" +
  ".ilc-tick{margin-left:auto;color:var(--color-foreground);opacity:0;transform:scale(.5);transition:opacity .2s,transform .4s var(--ilc-spring)}" +
  ".ilc-opt[aria-selected=true] .ilc-tick{opacity:1;transform:none}" +
  ".ilc-new{color:var(--color-muted-foreground)}" +
  ".ilc-new b{font-weight:600}" +
  ".ilc-new .ilc-chip{animation:ilc-pop .4s var(--ilc-spring) both}" +
  ".ilc-sw{display:flex;align-items:center;gap:6px;padding:8px 12px 10px;border-top:1px solid var(--color-border)}" +
  ".ilc-sw span{flex:1;white-space:nowrap;font-size:11.5px;color:var(--color-muted-foreground)}" +
  ".ilc-dot{width:16px;height:16px;padding:0;border:0;border-radius:999px;background:var(--ilc-c);cursor:pointer;outline:none;box-shadow:0 0 0 0 var(--color-background);transition:transform .35s var(--ilc-spring),box-shadow .2s}" +
  ".ilc-dot:hover{transform:scale(1.15)}" +
  ".ilc-dot[aria-checked=true]{transform:scale(1.1);box-shadow:0 0 0 2px var(--color-background),0 0 0 3.5px var(--ilc-c)}" +
  ".ilc-dot:focus-visible{box-shadow:0 0 0 2px var(--color-background),0 0 0 3.5px var(--color-primary)}" +
  ".ilc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@keyframes ilc-pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}" +
  "@keyframes ilc-born{0%{opacity:0;transform:translateY(10px) scale(.4) rotate(-6deg)}60%{opacity:1}100%{opacity:1;transform:none}}" +
  "@keyframes ilc-open{from{opacity:0;transform:scale(.92) translateY(-6px)}to{opacity:1;transform:none}}" +
  "@keyframes ilc-row{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}" +
  "@media (prefers-reduced-motion:reduce){.ilc-root *{transition-duration:.01ms!important;animation:none!important}}"

const X = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export function InlineLabelComposer({ labels, defaultValue = [], palette = PALETTE, title = "Labels", onChange, className }: InlineLabelComposerProps) {
  const id = useId()
  const [all, setAll] = useState(labels)
  const [sel, setSel] = useState(defaultValue)
  const [fresh, setFresh] = useState("")
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [active, setActive] = useState(0)
  const [hue, setHue] = useState(0)
  const root = useRef(null as HTMLDivElement | null)
  const input = useRef(null as HTMLInputElement | null)
  const add = useRef(null as HTMLButtonElement | null)

  const matches = filterLabels(all, q) as Label[]
  const creating = canCreate(q, all)
  const rows = matches.length + (creating ? 1 : 0)
  const color = palette[hue] ?? PALETTE[0]

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [open])

  const commit = (next: string[], list = all) => {
    setSel(next)
    onChange?.(next, list)
  }

  const toggle = (l: Label) => commit(sel.includes(l.id) ? sel.filter((x) => x !== l.id) : [...sel, l.id])

  const create = () => {
    const l = { id: slug(q, all.map((x) => x.id)), name: q.trim(), color }
    const list = [...all, l]
    setAll(list)
    setFresh(l.id)
    commit([...sel, l.id], list)
    setQ("")
    setActive(0)
    setHue((h) => cycle(h, 1, palette.length))
  }

  const pick = (i: number) => (i < matches.length ? toggle(matches[i]) : creating && create())

  const close = () => {
    setOpen(false)
    setQ("")
    add.current?.focus()
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => cycle(a, e.key === "ArrowDown" ? 1 : -1, rows))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (rows) pick(Math.min(active, rows - 1))
    } else if (e.key === "Escape") {
      e.preventDefault()
      close()
    } else if (e.key === "Backspace" && !q && sel.length) {
      commit(sel.slice(0, -1))
    } else if (creating && active === rows - 1 && (e.key === "ArrowLeft" || e.key === "ArrowRight") && (e.target as HTMLInputElement).selectionStart === q.length) {
      // on the Create row, Left/Right at the end of the text cycle the new label's colour
      e.preventDefault()
      setHue((h) => cycle(h, e.key === "ArrowRight" ? 1 : -1, palette.length))
    } else if (e.key === "Tab") setOpen(false)
  }

  const chosen = sel.map((s) => all.find((l) => l.id === s)).filter(Boolean) as Label[]

  return (
    <div ref={root} className={"ilc-root" + (className ? " " + className : "")} role="group" aria-label={title}>
      <style>{CSS}</style>
      {chosen.map((l) => (
        <span key={l.id} className={"ilc-chip" + (l.id === fresh ? " is-new" : "")} style={{ ["--ilc-c" as string]: l.color }}>
          <i />
          {l.name}
          <button type="button" className="ilc-x" aria-label={"Remove " + l.name} onClick={() => commit(sel.filter((x) => x !== l.id))}>
            <X />
          </button>
        </span>
      ))}
      <button ref={add} type="button" className="ilc-add" aria-haspopup="listbox" aria-expanded={open} onClick={() => (open ? close() : setOpen(true))}>
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {chosen.length ? "Add" : "Add label"}
      </button>
      {open && (
        <div className="ilc-pop">
          <div className="ilc-field">
            {chosen.map((l) => (
              <span key={l.id} className="ilc-chip" style={{ ["--ilc-c" as string]: l.color }}>
                {l.name}
                <button type="button" className="ilc-x" tabIndex={-1} aria-label={"Remove " + l.name} onPointerDown={(e) => e.preventDefault()} onClick={() => commit(sel.filter((x) => x !== l.id))}>
                  <X />
                </button>
              </span>
            ))}
            <input
              ref={input}
              className="ilc-input"
              role="combobox"
              aria-expanded="true"
              aria-controls={id + "-list"}
              aria-autocomplete="list"
              aria-activedescendant={rows ? id + "-o" + Math.min(active, rows - 1) : undefined}
              aria-label="Search or create a label"
              placeholder={chosen.length ? "" : "Search or create…"}
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKey}
            />
          </div>
          <div className="ilc-cap">{creating && !matches.length ? "New label" : "Select an option or create one"}</div>
          <ul className="ilc-list" id={id + "-list"} role="listbox" aria-multiselectable="true" aria-label={title}>
            {matches.map((l, i) => (
              <li
                key={l.id}
                id={id + "-o" + i}
                role="option"
                aria-selected={sel.includes(l.id)}
                data-active={i === Math.min(active, rows - 1)}
                className="ilc-opt"
                style={{ ["--ilc-i" as string]: i }}
                onPointerMove={() => i !== active && setActive(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => toggle(l)}
              >
                <span className="ilc-chip" style={{ ["--ilc-c" as string]: l.color }}>
                  {l.name}
                </span>
                <svg className="ilc-tick" width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 6.3l2.3 2.2L9.6 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </li>
            ))}
            {creating && (
              <li
                id={id + "-o" + matches.length}
                role="option"
                aria-selected={false}
                data-active={Math.min(active, rows - 1) === matches.length}
                className="ilc-opt ilc-new"
                style={{ ["--ilc-i" as string]: matches.length }}
                onPointerMove={() => active !== matches.length && setActive(matches.length)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={create}
              >
                Create
                <span className="ilc-chip" key={q.trim() + hue} style={{ ["--ilc-c" as string]: color }}>
                  <b>{q.trim()}</b>
                </span>
              </li>
            )}
          </ul>
          {creating && (
            <div className="ilc-sw" role="radiogroup" aria-label="Colour for the new label">
              <span title="Left and Right arrows cycle the colour">Colour</span>
              {palette.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={i === hue}
                  aria-label={"Colour " + (i + 1)}
                  tabIndex={-1}
                  className="ilc-dot"
                  style={{ ["--ilc-c" as string]: c }}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setHue(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <span className="ilc-sr" aria-live="polite">
        {chosen.map((l) => l.name).join(", ") || "No labels"}
      </span>
    </div>
  )
}

export default InlineLabelComposer
