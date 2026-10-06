"use client"

// The closing stretch of ink-orbit-saas-template as one footer: an inverted
// sign-up band on a faded grid with an email form, then the footer itself —
// brand, link columns, a live status dot and a light/dark switch that
// re-themes the whole block.
//
// No dependencies, no assets. React is the only import.

import React from "react"

export type InkCta = { title: string; description: string; placeholder: string; button: string; success: string }
export type InkFooterColumn = { title: string; links: { label: string; href: string }[] }

export type InkOrbitFooterProps = {
  /** `auto` follows prefers-color-scheme until the switch is used. */
  theme?: "light" | "dark" | "auto"
  brand?: string
  /** Logo before the brand name. Defaults to a drawn mark. */
  logo?: React.ReactNode
  /** `null` hides the sign-up band. */
  cta?: { [K in keyof InkCta]?: InkCta[K] } | null
  /** Called with the email. A rejected promise shows an error. */
  onSubscribe?: (email: string) => void | Promise<unknown>
  tagline?: string
  columns?: InkFooterColumn[]
  /** Text beside the live dot. Empty hides it. */
  status?: string
  /** Hide the light/dark switch. */
  themeSwitch?: boolean
  onThemeChange?: (theme: "light" | "dark") => void
  className?: string
  style?: React.CSSProperties
}

/* ------------------------------------------------------------------ logic */

// #region logic
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
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

// #endregion logic

/* --------------------------------------------------------------- defaults */

const D_CTA: InkCta = {
  title: "Ready to build *faster?*",
  description: "Join 12,000+ teams automating the busywork. Free for 14 days.",
  placeholder: "you@company.com",
  button: "Get Started",
  success: "You’re in — check your inbox for the next step.",
}
const D_COLUMNS: InkFooterColumn[] = [
  { title: "Product", links: [{ label: "Features", href: "#" }, { label: "Integrations", href: "#" }, { label: "Pricing", href: "#" }, { label: "Changelog", href: "#" }] },
  { title: "Company", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Blog", href: "#" }, { label: "Contact", href: "#" }] },
  { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "Security", href: "#" }] },
]

/* -------------------------------------------------------------- component */

export default function InkOrbitFooter({
  theme = "auto",
  brand = "NeuraForge AI",
  logo,
  cta,
  onSubscribe,
  tagline = "The automation layer for teams that would rather think than copy-paste.",
  columns = D_COLUMNS,
  status: statusText = "All systems normal",
  themeSwitch = true,
  onThemeChange,
  className = "",
  style,
}: InkOrbitFooterProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const C = cta === null ? null : { ...D_CTA, ...cta }

  /* theme: follows the prop (or the OS) until the switch is used */
  const [dark, setDark] = React.useState(theme === "dark")
  const [touched, setTouched] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      if (!touched) setDark(theme === "dark")
      return
    }
    const scheme = window.matchMedia("(prefers-color-scheme: dark)")
    const sync = () => {
      if (!touched) setDark(theme === "auto" ? scheme.matches : theme === "dark")
    }
    sync()
    scheme.addEventListener?.("change", sync)
    return () => scheme.removeEventListener?.("change", sync)
  }, [theme, touched])
  const toggleTheme = () => {
    const next = !dark
    setTouched(true)
    setDark(next)
    onThemeChange?.(next ? "dark" : "light")
  }

  /* sign-up */
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState("idle" as "idle" | "loading" | "error" | "done")
  const [msg, setMsg] = React.useState("")
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "loading" || !C) return
    if (!isEmail(email)) {
      setStatus("error")
      setMsg("That email doesn’t look right.")
      return
    }
    setStatus("loading")
    setMsg("")
    try {
      if (onSubscribe) await onSubscribe(email.trim())
      else await new Promise((r) => setTimeout(r, 900))
      setStatus("done")
      setMsg(C.success)
      setEmail("")
    } catch {
      setStatus("error")
      setMsg("Something went wrong — please try again.")
    }
  }

  const year = new Date().getFullYear()

  return (
    <div className={"if-root " + className} data-theme={dark ? "dark" : "light"} style={style}>
      <style>{IF_CSS}</style>
      <div className="if-shell">
        {C && (
          <section className="if-sec if-sec-pad if-cta" aria-labelledby={uid + "cta"}>
            <div className="if-cta-grid" aria-hidden="true" />
            <div style={{ position: "relative" }}>
              <div id={uid + "cta"}>
                <Title text={C.title} />
              </div>
              <p>{C.description}</p>
              <form className="if-form" onSubmit={submit} noValidate>
                <label className="if-sr" htmlFor={uid + "email"}>
                  Email
                </label>
                <input
                  id={uid + "email"}
                  className="if-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={C.placeholder}
                  value={email}
                  aria-invalid={status === "error" && !!msg && !isEmail(email) ? "true" : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (status !== "loading") {
                      setStatus("idle")
                      setMsg("")
                    }
                  }}
                />
                <button type="submit" className="if-btn" disabled={status === "loading"}>
                  {status === "loading" ? <i className="if-spin" /> : status === "done" ? <Check /> : null}
                  {C.button}
                  {status === "idle" || status === "error" ? <Arrow /> : null}
                </button>
                <span className="if-msg" role="status" data-tone={status === "error" ? "error" : undefined}>
                  {msg}
                </span>
              </form>
            </div>
          </section>
        )}

        <footer className="if-sec">
          <div className="if-foot" style={{ ["--if-cols" as string]: String(clamp(columns.length, 0, 5)) }}>
            <div>
              <span className="if-brand">
                {logo ?? <Mark />}
                {brand}
              </span>
              {tagline && <p className="if-foot-tag">{tagline}</p>}
            </div>
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h4>{col.title}</h4>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <div className="if-foot-bar">
              <span>
                © {year} {brand}. All rights reserved.
              </span>
              {statusText && (
                <span className="if-status">
                  <i className="if-live" />
                  {statusText}
                </span>
              )}
              {themeSwitch && (
                <button type="button" className="if-theme" onClick={toggleTheme} aria-label={"Switch to " + (dark ? "light" : "dark") + " theme"}>
                  <ThemeIcon dark={dark} />
                  {dark ? "Dark" : "Light"}
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- pieces */

function Title({ text }: { text: string }) {
  return (
    <h2 className="if-h2">
      {parseTitle(text).map((line, i) => (
        <span key={i}>
          {line.map((run, j) =>
            run.muted ? (
              <span key={j} className="if-muted" style={{ display: "inline" }}>
                {run.text}
              </span>
            ) : (
              <React.Fragment key={j}>{run.text}</React.Fragment>
            ),
          )}
        </span>
      ))}
    </h2>
  )
}

function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 21V3h4.2l9.6 12.2V3H21v18h-4.2L7.2 8.8V21z" fill="currentColor" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg className="if-arr" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 6.4 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" style={{ transition: "transform .5s cubic-bezier(.2,.8,.2,1)", transform: dark ? "rotate(180deg)" : "none" }}>
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor" />
    </svg>
  )
}

const IF_CSS = `
.if-root{--if-page:#efefef;--if-hatch:rgba(0,0,0,.06);--if-paper:#fbfbfb;--if-card:#f4f4f4;--if-raise:#ffffff;--if-ink:#151515;--if-soft:#3d3d3d;--if-muted:#7b7b7b;--if-faint:#a8a8a8;--if-line:#e2e2e2;--if-line-strong:#cfcfcf;--if-inv:#161616;--if-inv-ink:#f5f5f5;--if-inv-muted:#9a9a9a;--if-sans:"Manrope","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--if-serif:"Newsreader","Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,"Times New Roman",serif;--if-mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;position:relative;width:100%;box-sizing:border-box;background-color:var(--if-page);background-image:repeating-linear-gradient(135deg,var(--if-hatch) 0 1px,transparent 1px 10px);color:var(--if-ink);font-family:var(--if-sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;padding:28px clamp(10px,2.4vw,28px);transition:background-color .45s ease,color .45s ease}
.if-root[data-theme="dark"]{--if-page:#0b0b0b;--if-hatch:rgba(255,255,255,.05);--if-paper:#121212;--if-card:#181818;--if-raise:#1e1e1e;--if-ink:#eeeeee;--if-soft:#c9c9c9;--if-muted:#8d8d8d;--if-faint:#5d5d5d;--if-line:#262626;--if-line-strong:#363636;--if-inv:#efefef;--if-inv-ink:#121212;--if-inv-muted:#646464}
.if-root :where(*){box-sizing:border-box}
.if-root :focus-visible{outline:2px solid var(--if-ink);outline-offset:2px}
.if-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit;letter-spacing:inherit}
.if-root :where(a){color:inherit;text-decoration:none}
.if-root :where(svg){display:block;max-width:none;flex:none}
.if-root :where(h2,h4,p,ul,li,dl,dd){margin:0;padding:0;font-size:inherit;font-weight:inherit;list-style:none}
.if-root :where(input){font:inherit;color:inherit;margin:0}
.if-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.if-shell{width:100%;max-width:1180px;margin:0 auto;container-type:inline-size;display:flex;flex-direction:column;gap:clamp(18px,3cqw,32px)}
.if-sec{position:relative;background:var(--if-paper);border:1px solid var(--if-line);transition:background-color .45s,border-color .45s}
.if-sec-pad{padding:clamp(36px,6cqw,72px) clamp(16px,4cqw,48px)}
.if-h2{font-size:clamp(28px,4.4cqw,44px);line-height:1.08;letter-spacing:-.025em;font-weight:500}
.if-h2>span{display:block}
.if-muted{color:var(--if-faint)}
.if-cta{overflow:hidden;background:var(--if-inv);color:var(--if-inv-ink);border-color:var(--if-inv);text-align:center}
.if-cta-grid{position:absolute;inset:0;background-image:linear-gradient(color-mix(in srgb,var(--if-inv-ink) 7%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--if-inv-ink) 7%,transparent) 1px,transparent 1px);background-size:36px 36px;-webkit-mask-image:radial-gradient(60% 70% at 50% 50%,#000,transparent);mask-image:radial-gradient(60% 70% at 50% 50%,#000,transparent);pointer-events:none}
.if-cta .if-h2 .if-muted{color:var(--if-inv-muted);font-family:var(--if-serif);font-style:italic}
.if-cta p{color:var(--if-inv-muted);margin-top:12px}
.if-form{position:relative;display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:28px auto 0;max-width:460px}
.if-input{flex:1 1 220px;min-width:0;height:44px;padding:0 14px;background:color-mix(in srgb,var(--if-inv-ink) 7%,transparent);border:1px solid color-mix(in srgb,var(--if-inv-ink) 22%,transparent);border-radius:2px;color:var(--if-inv-ink);outline:none;transition:border-color .2s,background-color .2s}
.if-input::placeholder{color:var(--if-inv-muted)}
.if-input:focus{border-color:var(--if-inv-ink)}
.if-input[aria-invalid="true"]{border-color:#f87171}
.if-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:44px;padding:10px 16px;font-size:13.5px;font-weight:500;line-height:1;white-space:nowrap;border-radius:2px;background:var(--if-inv-ink);color:var(--if-inv);transition:transform .2s cubic-bezier(.2,.8,.2,1)}
.if-btn:hover{transform:translateY(-1px)}
.if-btn:active{transform:translateY(0) scale(.98)}
.if-btn[disabled]{opacity:.6;cursor:default}
.if-btn .if-arr{transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.if-btn:hover .if-arr{transform:translateX(3px)}
.if-msg{flex-basis:100%;font-size:12.5px;min-height:1.3em;color:var(--if-inv-muted)}
.if-msg[data-tone="error"]{color:#f87171}
.if-spin{width:14px;height:14px;border-radius:99px;border:2px solid currentColor;border-right-color:transparent;animation:if-spin .7s linear infinite}
.if-foot{display:grid;grid-template-columns:minmax(0,1fr);gap:28px;padding:clamp(28px,4cqw,44px) clamp(16px,4cqw,48px) 22px}
@container (min-width:760px){.if-foot{grid-template-columns:1.4fr repeat(var(--if-cols,3),minmax(0,1fr))}}
.if-brand{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:15px;letter-spacing:-.01em;white-space:nowrap}
.if-foot h4{font-size:12px;font-weight:600;margin-bottom:12px}
.if-foot ul{display:grid;gap:8px;font-size:13px;color:var(--if-muted)}
.if-foot ul a{transition:color .2s}
.if-foot ul a:hover{color:var(--if-ink)}
.if-foot-tag{font-size:13px;color:var(--if-muted);margin-top:12px;max-width:34ch;line-height:1.6}
.if-foot-bar{grid-column:1 / -1;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding-top:18px;border-top:1px solid var(--if-line);font-size:12px;color:var(--if-muted)}
.if-status{display:inline-flex;align-items:center;gap:7px}
.if-live{width:7px;height:7px;border-radius:99px;background:#22c55e;box-shadow:0 0 0 0 #22c55e;animation:if-ping 2.4s ease-out infinite}
.if-theme{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--if-line);transition:border-color .2s,color .2s}
.if-theme:hover{border-color:var(--if-ink);color:var(--if-ink)}
@keyframes if-spin{to{transform:rotate(360deg)}}
@keyframes if-ping{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}80%,100%{box-shadow:0 0 0 7px rgba(34,197,94,0)}}
@media (prefers-reduced-motion:reduce){
.if-btn,.if-btn .if-arr{transition:none}
.if-live{animation:none}
.if-spin{animation-duration:2s}
}
`
