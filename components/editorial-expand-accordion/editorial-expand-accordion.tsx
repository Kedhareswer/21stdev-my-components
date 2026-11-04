"use client"

import { useId, useRef, useState } from "react"

export type EditorialItem = {
  title: string
  description: string
  image: string
  imageAlt?: string
  /** Short deliverables shown as tags. */
  tags?: string[]
  /** e.g. "6–10 weeks". */
  duration?: string
  href?: string
  cta?: string
}

export type EditorialExpandAccordionProps = {
  items: EditorialItem[]
  eyebrow?: string
  heading?: React.ReactNode
  intro?: string
  defaultOpen?: number
  className?: string
}

// #region logic
export function pad2(n: number): string {
  return n < 9 ? "0" + (n + 1) : String(n + 1)
}

export function nextOpen(current: number, i: number): number {
  return current === i ? -1 : i
}

export function rove(i: number, key: string, n: number): number {
  if (n <= 0) return -1
  if (key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return i
}
// #endregion

const EASE = "cubic-bezier(.77,0,.18,1)"
const SOFT =
  "linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001 85.9%, 1)"

const CSS =
  ".eea-root{--eea-accent:#e5462b;--eea-ease:" + EASE + ";--eea-soft:" + SOFT + ";--eea-serif:'Instrument Serif','Fraunces','Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;" +
  "container-type:inline-size;width:100%;max-width:980px;margin:0 auto;font-family:'Inter Tight','Geist',ui-sans-serif,system-ui,sans-serif;color:var(--color-foreground);-webkit-font-smoothing:antialiased}" +
  ".eea-top{display:grid;gap:14px;margin-bottom:40px}" +
  ".eea-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--color-muted-foreground);animation:eea-up .8s var(--eea-soft) both}" +
  ".eea-eyebrow::before{content:'';width:22px;height:1.5px;background:var(--eea-accent)}" +
  ".eea-h{margin:0;font-family:var(--eea-serif);font-weight:400;font-size:clamp(38px,7cqi,68px);line-height:.98;letter-spacing:-.02em;animation:eea-up .9s var(--eea-soft) .06s both}" +
  ".eea-h em{font-style:italic;color:var(--eea-accent)}" +
  ".eea-intro{margin:0;max-width:440px;font-size:15px;line-height:1.55;color:var(--color-muted-foreground);animation:eea-up .9s var(--eea-soft) .12s both}" +
  ".eea-list{margin:0;padding:0;list-style:none;border-top:1px solid var(--color-border)}" +
  ".eea-item{position:relative;border-bottom:1px solid var(--color-border);animation:eea-up .9s var(--eea-soft) both;animation-delay:calc(.18s + var(--eea-i) * .07s)}" +
  ".eea-item::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:1.5px;background:var(--eea-accent);transform:scaleX(0);transform-origin:left;transition:transform .7s var(--eea-ease)}" +
  ".eea-item:hover::after,.eea-item[data-open=true]::after{transform:scaleX(1)}" +
  ".eea-head{display:grid;grid-template-columns:56px 1fr auto;align-items:center;gap:8px;width:100%;padding:26px 0;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;outline:none}" +
  ".eea-head:focus-visible .eea-t{text-decoration:underline;text-decoration-color:var(--eea-accent);text-underline-offset:6px}" +
  ".eea-n{font-size:12.5px;font-weight:600;letter-spacing:.04em;color:var(--color-muted-foreground);font-variant-numeric:tabular-nums;transition:color .3s}" +
  ".eea-t{font-family:var(--eea-serif);font-size:clamp(26px,4.6cqi,44px);line-height:1;letter-spacing:-.015em;transition:transform .7s var(--eea-ease),color .4s}" +
  ".eea-head:hover .eea-t{transform:translateX(10px)}" +
  ".eea-head:hover .eea-n,.eea-item[data-open=true] .eea-n{color:var(--eea-accent)}" +
  ".eea-item[data-open=true] .eea-t{font-style:italic;transform:translateX(10px)}" +
  ".eea-pm{position:relative;width:44px;height:44px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--color-border);transition:transform .7s var(--eea-ease),background .35s,box-shadow .35s}" +
  ".eea-pm::before,.eea-pm::after{content:'';position:absolute;left:50%;top:50%;width:14px;height:1.5px;margin:-.75px 0 0 -7px;background:currentColor;transition:transform .6s var(--eea-ease),background .3s}" +
  ".eea-pm::after{transform:rotate(90deg)}" +
  ".eea-head:hover .eea-pm{box-shadow:inset 0 0 0 1px var(--color-foreground)}" +
  ".eea-item[data-open=true] .eea-pm{transform:rotate(135deg);background:var(--eea-accent);box-shadow:none;color:#fff}" +
  ".eea-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .8s var(--eea-ease)}" +
  ".eea-item[data-open=true] .eea-panel{grid-template-rows:1fr}" +
  ".eea-panel>div{min-height:0;overflow:hidden}" +
  ".eea-body{display:grid;gap:22px;padding:0 0 32px 64px}" +
  "@container (max-width:560px){.eea-body{padding-left:0}.eea-head{grid-template-columns:40px 1fr auto}}" +
  "@container (min-width:700px){.eea-body{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:36px;align-items:end}}" +
  ".eea-pic{position:relative;aspect-ratio:4/3;border-radius:14px;overflow:hidden;background:var(--color-border);clip-path:inset(18% 30% 18% 30% round 14px);transition:clip-path .9s var(--eea-ease)}" +
  ".eea-pic>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;transform:scale(1.18);transition:transform 1.3s var(--eea-ease)}" +
  ".eea-item[data-open=true] .eea-pic{clip-path:inset(0 0 0 0 round 14px);transition-delay:.12s}" +
  ".eea-item[data-open=true] .eea-pic>img{transform:scale(1);transition-delay:.12s}" +
  ".eea-pic::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.35));pointer-events:none}" +
  ".eea-dur{position:absolute;left:14px;bottom:12px;z-index:1;font-size:12px;font-weight:600;color:#fff;letter-spacing:.01em}" +
  ".eea-copy{display:grid;gap:18px;align-content:end}" +
  ".eea-copy>*{opacity:0;transform:translateY(14px);transition:opacity .5s,transform .8s var(--eea-ease)}" +
  ".eea-item[data-open=true] .eea-copy>*{opacity:1;transform:none}" +
  ".eea-item[data-open=true] .eea-copy>:nth-child(1){transition-delay:.28s}" +
  ".eea-item[data-open=true] .eea-copy>:nth-child(2){transition-delay:.36s}" +
  ".eea-item[data-open=true] .eea-copy>:nth-child(3){transition-delay:.44s}" +
  ".eea-d{margin:0;font-size:16px;line-height:1.6;color:var(--color-foreground);max-width:46ch}" +
  ".eea-tags{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}" +
  ".eea-tags li{padding:6px 11px;border-radius:999px;font-size:12.5px;font-weight:550;box-shadow:inset 0 0 0 1px var(--color-border);color:var(--color-muted-foreground)}" +
  ".eea-cta{display:inline-flex;align-items:center;gap:10px;justify-self:start;font-size:14px;font-weight:620;color:var(--color-foreground);text-decoration:none;padding-bottom:4px;background:linear-gradient(var(--eea-accent),var(--eea-accent)) 0 100%/0 1.5px no-repeat;transition:background-size .5s var(--eea-ease)}" +
  ".eea-cta:hover,.eea-cta:focus-visible{background-size:100% 1.5px;outline:none}" +
  ".eea-cta svg{transition:transform .5s var(--eea-ease)}.eea-cta:hover svg{transform:translateX(4px)}" +
  "@keyframes eea-up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}" +
  "@media (prefers-reduced-motion:reduce){.eea-root *,.eea-root *::before,.eea-root *::after{transition-duration:.01ms!important;transition-delay:0s!important;animation:none!important}}"

export function EditorialExpandAccordion({
  items,
  eyebrow = "Services",
  heading = (
    <>
      Four ways we <em>help</em>
    </>
  ),
  intro,
  defaultOpen = 0,
  className,
}: EditorialExpandAccordionProps) {
  const id = useId()
  const [open, setOpen] = useState(defaultOpen)
  const heads = useRef([] as (HTMLButtonElement | null)[])

  return (
    <section className={"eea-root" + (className ? " " + className : "")}>
      <style>{CSS}</style>
      <div className="eea-top">
        {eyebrow && <span className="eea-eyebrow">{eyebrow}</span>}
        <h2 className="eea-h">{heading}</h2>
        {intro && <p className="eea-intro">{intro}</p>}
      </div>
      <ul className="eea-list">
        {items.map((it, i) => {
          const isOpen = open === i
          return (
            <li key={it.title} className="eea-item" data-open={isOpen} style={{ ["--eea-i" as string]: i }}>
              <h3 style={{ margin: 0, font: "inherit" }}>
                <button
                  ref={(el) => {
                    heads.current[i] = el
                  }}
                  type="button"
                  className="eea-head"
                  id={id + "-h" + i}
                  aria-expanded={isOpen}
                  aria-controls={id + "-p" + i}
                  onClick={() => setOpen((o) => nextOpen(o, i))}
                  onKeyDown={(e) => {
                    const to = rove(i, e.key, items.length)
                    if (to !== i && to >= 0) {
                      e.preventDefault()
                      heads.current[to]?.focus()
                    }
                  }}
                >
                  <span className="eea-n">{pad2(i)}</span>
                  <span className="eea-t">{it.title}</span>
                  <span className="eea-pm" aria-hidden="true" />
                </button>
              </h3>
              <div className="eea-panel" id={id + "-p" + i} role="region" aria-labelledby={id + "-h" + i} ref={(el) => {
                  el?.toggleAttribute("inert", !isOpen)
                }}>
                <div>
                  <div className="eea-body">
                    <div className="eea-pic">
                      <img src={it.image} alt={it.imageAlt ?? ""} width={480} height={360} loading="lazy" />
                      {it.duration && <span className="eea-dur">{it.duration}</span>}
                    </div>
                    <div className="eea-copy">
                      <p className="eea-d">{it.description}</p>
                      {it.tags?.length ? (
                        <ul className="eea-tags">
                          {it.tags.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      ) : (
                        <span />
                      )}
                      {it.href ? (
                        <a className="eea-cta" href={it.href}>
                          {it.cta ?? "See the work"}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </a>
                      ) : (
                        <span />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default EditorialExpandAccordion
