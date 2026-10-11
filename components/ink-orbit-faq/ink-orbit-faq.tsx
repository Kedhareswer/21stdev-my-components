"use client"

// The about + FAQ section from ink-orbit-saas-template, standalone: a hatched
// page, an about panel whose stats count up when they scroll into view, and an
// FAQ accordion that opens on a grid-row transition beside it.
//
// No dependencies, no assets. React is the only import.

import React from "react"

export type InkStat = { value: string; label: string }
export type InkAbout = { tag: string; title: string; body: string; stats: InkStat[] }
export type InkFaq = { question: string; answer: string }

export type InkOrbitFaqProps = {
  /** `auto` follows prefers-color-scheme. */
  theme?: "light" | "dark" | "auto"
  /** `null` hides the about panel; the FAQ then takes the full width. */
  about?: { [K in keyof InkAbout]?: InkAbout[K] } | null
  faq?: InkFaq[]
  /** Small mono label above the questions. Empty hides it. */
  faqLabel?: string
  /** Index open on load; -1 = all closed. */
  defaultOpen?: number
  className?: string
  style?: React.CSSProperties
}

/* ------------------------------------------------------------------ logic */

// #region logic
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

function easeOutCubic(t: number): number {
  const c = clamp(t, 0, 1)
  return 1 - Math.pow(1 - c, 3)
}

function parseTitle(s: string): { text: string; muted: boolean }[][] {
  return s.split(/\n|\\n/).map((line) => {
    const out: { text: string; muted: boolean }[] = []
    line.split("*").forEach((text, i) => {
      if (text) out.push({ text, muted: i % 2 === 1 })
    })
    return out
  })
}

// "38M+" → { prefix: "", value: 38, decimals: 0, suffix: "M+" }
function splitStat(s: string): { prefix: string; value: number; decimals: number; suffix: string } | null {
  const m = s.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/)
  if (!m) return null
  const num = m[2].replace(/,/g, "")
  const dot = num.indexOf(".")
  return { prefix: m[1], value: parseFloat(num), decimals: dot < 0 ? 0 : num.length - dot - 1, suffix: m[3] }
}

function formatStat(s: string, t: number): string {
  const p = splitStat(s)
  if (!p) return s
  const v = p.value * easeOutCubic(t)
  const grouped = p.value >= 1000 && p.decimals === 0
  const body = grouped ? Math.round(v).toLocaleString("en-US") : v.toFixed(p.decimals)
  return p.prefix + body + p.suffix
}
// #endregion logic

/* --------------------------------------------------------------- defaults */

const D_ABOUT: InkAbout = {
  tag: "About",
  title: "Built by people who\n*hate busywork.*",
  body:
    "NeuraForge started as an internal tool at a twelve-person analytics studio. We were spending more time moving data between tabs than thinking about it. Today the same engine quietly runs the repetitive parts of work for thousands of teams — so people can get back to the parts that need a person.",
  stats: [
    { value: "12,400+", label: "Teams onboarded" },
    { value: "38M", label: "Tasks automated" },
    { value: "99.98%", label: "Uptime, last 12 months" },
    { value: "4.9/5", label: "Average review" },
  ],
}
const D_FAQ: InkFaq[] = [
  { question: "How long does setup take?", answer: "Most teams connect their first tools and ship a working workflow in under fifteen minutes. Templates cover the common cases out of the box." },
  { question: "Is my data used to train models?", answer: "No. Your data stays in your workspace, is encrypted at rest and in transit, and is never used to train shared models." },
  { question: "Can I switch plans later?", answer: "Anytime. Upgrades apply immediately and downgrades at the end of your billing period — unused time is credited automatically." },
  { question: "Do you offer discounts for startups and non-profits?", answer: "Yes — eligible teams get 50% off Pro for the first year. Reach out from the Enterprise card and mention your organisation." },
]

/* -------------------------------------------------------------- component */

export default function InkOrbitFaq({
  theme = "auto",
  about,
  faq = D_FAQ,
  faqLabel = "Questions, answered",
  defaultOpen = 0,
  className = "",
  style,
}: InkOrbitFaqProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const A = about === null ? null : { ...D_ABOUT, ...about }

  const [dark, setDark] = React.useState(theme === "dark")
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setDark(theme === "dark")
      return
    }
    const scheme = window.matchMedia("(prefers-color-scheme: dark)")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      setDark(theme === "auto" ? scheme.matches : theme === "dark")
      setReduced(motion.matches)
    }
    sync()
    scheme.addEventListener?.("change", sync)
    motion.addEventListener?.("change", sync)
    return () => {
      scheme.removeEventListener?.("change", sync)
      motion.removeEventListener?.("change", sync)
    }
  }, [theme])

  /* reveal + stat count-up once on screen */
  const revealRef = React.useRef(null as HTMLDivElement | null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = revealRef.current
    if (!el || inView) return
    if (typeof IntersectionObserver !== "function") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView])

  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <div className={"iq-root " + className} data-theme={dark ? "dark" : "light"} style={style}>
      <style>{IQ_CSS}</style>
      <div className="iq-shell">
        <section className="iq-sec" aria-labelledby={A ? uid + "about" : undefined} aria-label={A ? undefined : faqLabel || "FAQ"}>
          <div className={"iq-reveal" + (A && faq.length ? " iq-about" : "")} ref={revealRef} data-in={inView}>
            {A && (
              <div>
                <div className="iq-head" id={uid + "about"}>
                  {A.tag && <span className="iq-tag">{A.tag}</span>}
                  <h2 className="iq-h2">
                    {parseTitle(A.title).map((line, i) => (
                      <span key={i}>
                        {line.map((run, j) =>
                          run.muted ? (
                            <span key={j} className="iq-muted" style={{ display: "inline" }}>
                              {run.text}
                            </span>
                          ) : (
                            <React.Fragment key={j}>{run.text}</React.Fragment>
                          ),
                        )}
                      </span>
                    ))}
                  </h2>
                </div>
                <p className="iq-about-body">{A.body}</p>
                {A.stats.length > 0 && (
                  <dl className="iq-stats">
                    {A.stats.map((s) => (
                      <div key={s.label} className="iq-stat">
                        <dd className="iq-stat-v">
                          <StatValue value={s.value} run={inView} reduced={reduced} />
                        </dd>
                        <dt className="iq-stat-l">{s.label}</dt>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}
            {faq.length > 0 && (
              <div>
                {faqLabel && <p className="iq-faq-label">{faqLabel}</p>}
                <div className="iq-faq">
                  {faq.map((q, i) => (
                    <div key={i} className="iq-faq-item">
                      <button type="button" className="iq-faq-q" aria-expanded={open === i} aria-controls={uid + "faq" + i} onClick={() => setOpen(open === i ? -1 : i)}>
                        {q.question}
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                      <div className="iq-faq-a" id={uid + "faq" + i} data-open={open === i} role="region">
                        <div>
                          <p>{q.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatValue({ value, run, reduced }: { value: string; run: boolean; reduced: boolean }) {
  const [t, setT] = React.useState(0)
  React.useEffect(() => {
    if (!run) return
    if (reduced) {
      setT(1)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 1600)
      setT(k)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, reduced])
  return <>{formatStat(value, t)}</>
}

const IQ_CSS = `
.iq-root{--iq-page:#efefef;--iq-hatch:rgba(0,0,0,.06);--iq-paper:#fbfbfb;--iq-card:#f4f4f4;--iq-ink:#151515;--iq-soft:#3d3d3d;--iq-muted:#7b7b7b;--iq-faint:#a8a8a8;--iq-line:#e2e2e2;--iq-sans:"Manrope","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--iq-mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;position:relative;width:100%;box-sizing:border-box;background-color:var(--iq-page);background-image:repeating-linear-gradient(135deg,var(--iq-hatch) 0 1px,transparent 1px 10px);color:var(--iq-ink);font-family:var(--iq-sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;padding:28px clamp(10px,2.4vw,28px);transition:background-color .45s ease,color .45s ease}
.iq-root[data-theme="dark"]{--iq-page:#0b0b0b;--iq-hatch:rgba(255,255,255,.05);--iq-paper:#121212;--iq-card:#181818;--iq-ink:#eeeeee;--iq-soft:#c9c9c9;--iq-muted:#8d8d8d;--iq-faint:#5d5d5d;--iq-line:#262626}
.iq-root :where(*){box-sizing:border-box}
.iq-root :focus-visible{outline:2px solid var(--iq-ink);outline-offset:2px}
.iq-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit;letter-spacing:inherit}
.iq-root :where(svg){display:block;max-width:none;flex:none}
.iq-root :where(h2,p,dl,dd,dt){margin:0;padding:0;font-size:inherit;font-weight:inherit}
.iq-shell{width:100%;max-width:1180px;margin:0 auto;container-type:inline-size}
.iq-sec{position:relative;background:var(--iq-paper);border:1px solid var(--iq-line);padding:clamp(36px,6cqw,72px) clamp(16px,4cqw,48px);transition:background-color .45s,border-color .45s}
.iq-reveal{opacity:0;transform:translateY(18px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
.iq-reveal[data-in="true"]{opacity:1;transform:none}
.iq-head{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:14px;margin-bottom:18px}
.iq-tag{display:inline-block;padding:4px 10px;font-size:11.5px;letter-spacing:.02em;color:var(--iq-soft);background:var(--iq-card);border:1px solid var(--iq-line)}
.iq-h2{font-size:clamp(28px,4.4cqw,44px);line-height:1.08;letter-spacing:-.025em;font-weight:500}
.iq-h2>span{display:block}
.iq-muted{color:var(--iq-faint)}
.iq-about{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(28px,5cqw,64px)}
@container (min-width:860px){.iq-about{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr)}}
.iq-about-body{color:var(--iq-soft);font-size:15px;line-height:1.7;max-width:56ch}
.iq-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--iq-line);border:1px solid var(--iq-line);margin-top:30px}
.iq-stat{background:var(--iq-paper);padding:18px 16px;transition:background-color .3s}
.iq-stat:hover{background:var(--iq-card)}
.iq-stat-v{font-size:clamp(26px,3.2cqw,34px);font-weight:500;letter-spacing:-.035em;line-height:1.1;font-variant-numeric:tabular-nums}
.iq-stat-l{font-size:12px;color:var(--iq-muted);margin-top:4px}
.iq-faq{border-top:1px solid var(--iq-line)}
.iq-faq-item{border-bottom:1px solid var(--iq-line)}
.iq-faq-q{display:flex;width:100%;align-items:center;justify-content:space-between;gap:16px;padding:18px 2px;font-size:15px;font-weight:500;letter-spacing:-.01em}
.iq-faq-q svg{transition:transform .4s cubic-bezier(.2,.8,.2,1);color:var(--iq-muted)}
.iq-faq-q[aria-expanded="true"] svg{transform:rotate(45deg);color:var(--iq-ink)}
.iq-faq-a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s cubic-bezier(.2,.8,.2,1)}
.iq-faq-a[data-open="true"]{grid-template-rows:1fr}
.iq-faq-a>div{overflow:hidden}
.iq-faq-a p{padding:0 30px 18px 2px;font-size:13.5px;line-height:1.65;color:var(--iq-muted)}
.iq-faq-label{font-family:var(--iq-mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--iq-faint);margin-bottom:6px}
@media (prefers-reduced-motion:reduce){
.iq-reveal{opacity:1;transform:none;transition:none}
.iq-faq-a,.iq-faq-q svg{transition:none}
}
`
