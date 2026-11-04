"use client"

import { useEffect, useId, useRef, useState } from "react"
import gsap from "gsap"

export type ArchiveItem = {
  title: string
  date: string
  image: string
  alt?: string
  /** One line under the photo when the row is opened. */
  caption?: string
  /** Small chip on the opened photo, e.g. "35 mm". */
  tag?: string
}

export type PhotoArchiveStackProps = {
  items: ArchiveItem[]
  eyebrow?: string
  heading?: string
  description?: string
  /** Height of the opened photo in px. */
  previewHeight?: number
  /** Stage height. A definite length, so it never collapses on a host page. */
  height?: string
  className?: string
}

// #region layout
export const ROW = 84
export const GAP = 10
const PEEK = 13
const FAN = 22
const DEPTH = 3

export type Slot = { y: number; scale: number; opacity: number; face: number; z: number }

/** Where every card sits: a tight pile when closed, a list when open, with room
 *  under the active row for its photo. Pure numbers, no layout reads. */
export function layoutStack(n: number, open: boolean, active: number, preview: number, fan: boolean) {
  const slots: Slot[] = []
  for (let i = 0; i < n; i++) {
    if (!open) {
      const d = Math.min(i, DEPTH)
      slots.push({
        y: d * (fan ? FAN : PEEK),
        scale: 1 - d * 0.045,
        opacity: i <= DEPTH ? 1 - d * 0.2 : 0,
        face: i === 0 ? 1 : 0,
        z: n - i,
      })
    } else {
      const below = active >= 0 && i > active ? preview : 0
      slots.push({ y: i * (ROW + GAP) + below, scale: 1, opacity: 1, face: 1, z: n - i })
    }
  }
  const total = n === 0
    ? 0
    : open
      ? n * (ROW + GAP) - GAP + (active >= 0 ? preview : 0)
      : ROW + Math.min(n - 1, DEPTH) * FAN
  return { slots, total }
}

export const pad2 = (n: number) => (n < 10 ? "0" : "") + n
// #endregion

const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif'
const MONO = 'ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace'
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 .95 0 0 0 0 .9 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

const CSS =
  ".pas-stage{display:flex;align-items:center;justify-content:center;padding:48px 16px;background:var(--color-background);box-sizing:border-box}" +
  ".pas-card{position:relative;width:100%;max-width:600px;border-radius:30px;padding:30px 26px 26px;color:#f3e9de;" +
  "background:radial-gradient(120% 70% at 50% -10%,rgba(255,92,54,.20),rgba(255,92,54,0) 60%),linear-gradient(180deg,#1d1715,#110d0c);" +
  "box-shadow:0 1px 0 rgba(255,236,220,.08) inset,0 0 0 1px rgba(255,236,220,.06),0 40px 80px -30px rgba(20,8,4,.65),0 12px 30px -12px rgba(20,8,4,.5);overflow:hidden;isolation:isolate}" +
  ".pas-card::after{content:'';position:absolute;inset:0;background-image:" + GRAIN + ";opacity:.07;mix-blend-mode:overlay;pointer-events:none;z-index:3}" +
  ".pas-top{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px}" +
  ".pas-eyebrow{font:500 10.5px/1 " + MONO + ";letter-spacing:.18em;text-transform:uppercase;color:#ff8a66;display:flex;align-items:center;gap:8px}" +
  ".pas-eyebrow i{width:6px;height:6px;border-radius:50%;background:#ff5c36;box-shadow:0 0 10px #ff5c36}" +
  ".pas-h{font:400 clamp(28px,6vw,38px)/1.02 " + SERIF + ";letter-spacing:-.01em;margin:12px 0 8px;color:#fbf3ea}" +
  ".pas-h em{font-style:italic;color:#ffb59c}" +
  ".pas-desc{font:400 14px/1.5 ui-sans-serif,system-ui,sans-serif;color:rgba(243,233,222,.58);margin:0;max-width:34ch}" +
  ".pas-close{flex:none;font:500 11px/1 " + MONO + ";letter-spacing:.12em;text-transform:uppercase;color:#f3e9de;background:rgba(255,236,220,.06);border:1px solid rgba(255,236,220,.12);border-radius:999px;padding:9px 13px;cursor:pointer;transition:opacity .3s,transform .3s,background .2s}" +
  ".pas-close:hover{background:rgba(255,236,220,.12)}" +
  ".pas-close:focus-visible,.pas-head:focus-visible,.pas-pile:focus-visible{outline:2px solid #ff8a66;outline-offset:3px}" +
  ".pas-close[data-hidden=true]{opacity:0;transform:translateY(4px);pointer-events:none}" +
  ".pas-list{position:relative;perspective:1200px}" +
  ".pas-pile{position:absolute;inset:0;z-index:50;border:0;padding:0;background:transparent;cursor:pointer;border-radius:22px}" +
  ".pas-row{position:absolute;left:0;right:0;top:0;transform-origin:50% 0;border-radius:22px;will-change:transform,clip-path;" +
  "background:linear-gradient(180deg,#2a221f,#1e1816);box-shadow:0 1px 0 rgba(255,236,220,.1) inset,0 0 0 1px rgba(255,236,220,.07),0 18px 30px -18px rgba(0,0,0,.8)}" +
  ".pas-head{display:flex;align-items:center;gap:16px;width:100%;height:" + ROW + "px;padding:0 18px 0 12px;box-sizing:border-box;background:transparent;border:0;border-radius:22px;color:inherit;text-align:left;cursor:pointer}" +
  ".pas-thumb{position:relative;flex:none;width:60px;height:60px;border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,236,220,.14),0 8px 16px -8px rgba(0,0,0,.9)}" +
  ".pas-thumb img,.pas-photo img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block}" +
  ".pas-meta{flex:1;min-width:0}" +
  ".pas-date{display:block;font:500 10.5px/1 " + MONO + ";letter-spacing:.14em;text-transform:uppercase;color:rgba(243,233,222,.45);margin-bottom:8px}" +
  ".pas-title{display:block;font:400 21px/1.1 " + SERIF + ";color:#fbf3ea;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".pas-idx{font:500 11px/1 " + MONO + ";color:rgba(243,233,222,.35);letter-spacing:.06em}" +
  ".pas-chev{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(255,236,220,.06);transition:transform .5s cubic-bezier(.34,1.56,.64,1),background .25s}" +
  ".pas-head:hover .pas-chev{background:rgba(255,138,102,.18)}" +
  ".pas-row[data-active=true] .pas-chev{transform:rotate(180deg);background:#ff5c36}" +
  ".pas-photo{position:absolute;left:10px;right:10px;top:" + (ROW + 2) + "px;bottom:12px;border-radius:16px;overflow:hidden;background:#0d0a09}" +
  ".pas-photo img{transform:scale(1.12);transition:transform 1.1s cubic-bezier(.16,1,.3,1)}" +
  ".pas-row[data-active=true] .pas-photo img{transform:scale(1)}" +
  ".pas-photo::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,10,9,0) 45%,rgba(13,10,9,.85))}" +
  ".pas-cap{position:absolute;left:16px;right:16px;bottom:14px;z-index:1;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;font:400 13.5px/1.4 ui-sans-serif,system-ui,sans-serif;color:rgba(251,243,234,.86)}" +
  ".pas-tag{flex:none;font:500 10px/1 " + MONO + ";letter-spacing:.14em;text-transform:uppercase;padding:7px 9px;border-radius:999px;background:rgba(255,236,220,.14);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}" +
  ".pas-hint{margin-top:22px;text-align:center;font:500 10.5px/1 " + MONO + ";letter-spacing:.2em;text-transform:uppercase;color:rgba(243,233,222,.4);transition:opacity .4s}" +
  ".pas-hint[data-hidden=true]{opacity:0}" +
  ".pas-date{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  "@media (max-width:480px){.pas-idx{display:none}.pas-card{padding:26px 16px 18px;border-radius:26px}.pas-head{gap:12px;padding-left:10px}.pas-thumb{width:54px;height:54px}.pas-title{font-size:19px}}" +
  "@media (prefers-reduced-motion:reduce){.pas-chev,.pas-photo img,.pas-close,.pas-hint{transition:none}}"

export default function PhotoArchiveStack({
  items,
  eyebrow = "Archive",
  heading = "Selected studies",
  description = "Open the pile to browse the roll. Pick a frame to see it large.",
  previewHeight = 250,
  height = "100svh",
  className = "",
}: PhotoArchiveStackProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [fan, setFan] = useState(false)
  const rows = useRef([] as (HTMLDivElement | null)[])
  const faces = useRef([] as (HTMLSpanElement | null)[])
  const list = useRef(null as HTMLDivElement | null)
  const entered = useRef(false)
  const reduced = useRef(false)
  const id = useId()
  const n = items.length
  const preview = previewHeight + 14

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => (reduced.current = mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  // Every state change animates each card straight to its computed slot.
  useEffect(() => {
    const { slots, total } = layoutStack(n, open, active, preview, fan && !open)
    const el = list.current
    const growing = el && total > (Number(el.dataset.total) || 0)
    if (el && (growing || !entered.current)) el.style.height = total + "px"
    const quick = reduced.current
    const tweens: gsap.core.Tween[] = []
    slots.forEach((s, i) => {
      const row = rows.current[i]
      const face = faces.current[i]
      if (!row) return
      row.style.zIndex = String(s.z)
      const clip = "inset(0px 0px " + (open && i === active ? 0 : preview) + "px 0px round 22px)"
      if (!entered.current) {
        gsap.set(row, { y: s.y, scale: s.scale, opacity: s.opacity, clipPath: clip })
        if (face) gsap.set(face, { opacity: s.face })
        if (!quick)
          tweens.push(gsap.from(row, { y: s.y - 70, opacity: 0, rotateX: -28, duration: 1.1, ease: "expo.out", delay: 0.15 + (DEPTH - Math.min(i, DEPTH)) * 0.08 }))
        return
      }
      // closing runs bottom-up, opening top-down, so the pile reads as one gesture
      const order = open ? i : n - 1 - i
      tweens.push(
        gsap.to(row, {
          y: s.y,
          rotateX: 0,
          scale: s.scale,
          opacity: s.opacity,
          clipPath: clip,
          duration: quick ? 0.01 : 0.85,
          ease: open ? "back.out(1.15)" : "expo.out",
          delay: quick ? 0 : Math.min(order, 8) * 0.035,
          overwrite: "auto",
        })
      )
      if (face) tweens.push(gsap.to(face, { opacity: s.face, duration: quick ? 0.01 : 0.35, delay: open ? 0.05 : 0, overwrite: "auto" }))
    })
    entered.current = true
    if (el) {
      el.dataset.total = String(total)
      if (!growing) {
        const t = window.setTimeout(() => (el.style.height = total + "px"), quick ? 0 : 700)
        return () => {
          window.clearTimeout(t)
          tweens.forEach((tw) => tw.kill())
        }
      }
    }
    return () => tweens.forEach((tw) => tw.kill())
  }, [n, open, active, fan, preview])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") collapse()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function collapse() {
    setActive(-1)
    setOpen(false)
    setFan(false)
  }

  return (
    <div className={"pas-stage " + className} style={{ minHeight: height }}>
      <style>{CSS}</style>
      <section className="pas-card" aria-labelledby={id + "h"}>
        <div className="pas-top">
          <div>
            <div className="pas-eyebrow">
              <i aria-hidden="true" />
              {eyebrow} · {pad2(n)} frames
            </div>
            <h2 className="pas-h" id={id + "h"}>
              {heading}
            </h2>
            <p className="pas-desc">{description}</p>
          </div>
          <button type="button" className="pas-close" data-hidden={!open} onClick={collapse} tabIndex={open ? 0 : -1}>
            Collapse
          </button>
        </div>

        <div className="pas-list" ref={list}>
          {!open && (
            <button
              type="button"
              className="pas-pile"
              aria-expanded={false}
              aria-label={"Open the archive of " + n + " frames"}
              onClick={() => setOpen(true)}
              onPointerEnter={() => setFan(true)}
              onPointerLeave={() => setFan(false)}
              onFocus={() => setFan(true)}
              onBlur={() => setFan(false)}
            />
          )}
          {items.map((it, i) => (
            <div
              key={it.title + i}
              className="pas-row"
              ref={(el) => {
                rows.current[i] = el
              }}
              data-active={open && i === active}
              style={{ height: ROW + preview }}
              aria-hidden={!open && i > 0}
            >
              <button
                type="button"
                className="pas-head"
                tabIndex={open ? 0 : -1}
                aria-expanded={open && i === active}
                aria-controls={id + "p" + i}
                onClick={() => setActive((a) => (a === i ? -1 : i))}
              >
                <span
                  className="pas-face"
                  ref={(el) => {
                    faces.current[i] = el
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}
                >
                  <span className="pas-thumb">
                    <img src={it.image} alt="" draggable={false} />
                  </span>
                  <span className="pas-meta">
                    <span className="pas-date">{it.date}</span>
                    <span className="pas-title">{it.title}</span>
                  </span>
                  <span className="pas-idx">
                    {pad2(i + 1)}/{pad2(n)}
                  </span>
                  <span className="pas-chev" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </button>
              <figure className="pas-photo" id={id + "p" + i} style={{ margin: 0 }} aria-hidden={!(open && i === active)}>
                <img src={it.image} alt={it.alt ?? it.title} draggable={false} />
                <figcaption className="pas-cap">
                  <span>{it.caption ?? it.title}</span>
                  {it.tag && <span className="pas-tag">{it.tag}</span>}
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
        <div className="pas-hint" data-hidden={open} aria-hidden="true">
          Tap the pile to unfold
        </div>
      </section>
    </div>
  )
}
