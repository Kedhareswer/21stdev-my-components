"use client"

// The navbar from ink-orbit-saas-template, standalone: a sticky, blurred bar in
// a bracketed frame — a brand mark that spins on hover, links with a caret that
// slides under whichever section is on screen, a light/dark switch, a CTA, and
// a dropdown menu on narrow widths. The bar re-themes itself and reports the
// switch, so a page can follow it.
//
// No dependencies, no assets. React is the only import.

import React from "react"

export type InkNavLink = { label: string; href: string }

export type InkOrbitNavbarProps = {
  /** `auto` follows prefers-color-scheme until the switch is used. */
  theme?: "light" | "dark" | "auto"
  brand?: string
  /** Logo before the brand name. Defaults to a drawn mark. */
  logo?: React.ReactNode
  brandHref?: string
  /** `#id` links track the section in view and scroll smoothly; others are plain links. */
  links?: InkNavLink[]
  /** Force the active link (an href). Otherwise it follows the scroll. */
  active?: string
  cta?: string
  onCta?: () => void
  /** Show the light/dark switch. */
  themeSwitch?: boolean
  onThemeChange?: (theme: "light" | "dark") => void
  /** Stick to the top of the viewport while scrolling. */
  sticky?: boolean
  className?: string
  style?: React.CSSProperties
}

/* ------------------------------------------------------------------ logic */

// #region logic
// "#pricing" → "pricing"; anything else (a path, a URL, "#") is not a section
function sectionId(href: string): string | null {
  const m = /^#([A-Za-z][\w-]*)$/.exec(href.trim())
  return m ? m[1] : null
}
// #endregion logic

/* --------------------------------------------------------------- defaults */

const D_LINKS: InkNavLink[] = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
]

/* -------------------------------------------------------------- component */

export default function InkOrbitNavbar({
  theme = "auto",
  brand = "NeuraForge AI",
  logo,
  brandHref = "#",
  links = D_LINKS,
  active: activeProp,
  cta = "Get Started",
  onCta,
  themeSwitch = true,
  onThemeChange,
  sticky = true,
  className = "",
  style,
}: InkOrbitNavbarProps) {
  /* theme: follows the prop (or the OS) until the switch is used */
  const [dark, setDark] = React.useState(theme === "dark")
  const [touched, setTouched] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      if (!touched) setDark(theme === "dark")
      return
    }
    const scheme = window.matchMedia("(prefers-color-scheme: dark)")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      if (!touched) setDark(theme === "auto" ? scheme.matches : theme === "dark")
      setReduced(motion.matches)
    }
    sync()
    scheme.addEventListener?.("change", sync)
    motion.addEventListener?.("change", sync)
    return () => {
      scheme.removeEventListener?.("change", sync)
      motion.removeEventListener?.("change", sync)
    }
  }, [theme, touched])
  const toggleTheme = () => {
    const next = !dark
    setTouched(true)
    setDark(next)
    onThemeChange?.(next ? "dark" : "light")
  }

  /* active link: the #section nearest the upper middle of the viewport */
  const [seen, setSeen] = React.useState(links[0]?.href ?? "")
  const hrefKey = links.map((l) => l.href).join("|")
  React.useEffect(() => {
    if (typeof IntersectionObserver !== "function" || typeof document === "undefined") return
    const els = links
      .map((l) => (sectionId(l.href) ? document.getElementById(sectionId(l.href) as string) : null))
      .filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setSeen("#" + (e.target as HTMLElement).id)
      },
      { rootMargin: "-40% 0px -55% 0px" },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hrefKey])
  const active = activeProp ?? seen

  const [menu, setMenu] = React.useState(false)
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const go = (href: string) => (e: React.MouseEvent) => {
    setMenu(false)
    const id = sectionId(href)
    const el = id ? document.getElementById(id) : null
    if (!el) return
    e.preventDefault()
    // land below the bar when it sticks, not underneath it
    const bar = sticky ? rootRef.current?.getBoundingClientRect().height ?? 0 : 0
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - bar, behavior: reduced ? "auto" : "smooth" })
    setSeen(href)
  }

  /* the caret slides under the active link */
  const linksRef = React.useRef(null as HTMLDivElement | null)
  const [caret, setCaret] = React.useState({ x: 0, on: false })
  React.useLayoutEffect(() => {
    const box = linksRef.current
    if (!box) return
    const place = () => {
      const el = box.querySelector('[aria-current="true"]') as HTMLElement | null
      setCaret(el ? { x: el.offsetLeft + el.offsetWidth / 2 - 5, on: true } : { x: 0, on: false })
    }
    place()
    if (typeof ResizeObserver !== "function") return
    const ro = new ResizeObserver(place)
    ro.observe(box)
    return () => ro.disconnect()
  }, [active, hrefKey])

  const link = (l: InkNavLink, i: number) => (
    <a key={i} className="in-link" href={l.href} aria-current={active === l.href ? "true" : undefined} onClick={go(l.href)}>
      {l.label}
    </a>
  )

  return (
    <div ref={rootRef} className={"in-root" + (sticky ? " in-sticky" : "") + " " + className} data-theme={dark ? "dark" : "light"} style={style}>
      <style>{IN_CSS}</style>
      <div className="in-shell">
        <header className="in-frame">
          <span className="in-c in-c-tl" aria-hidden="true" />
          <span className="in-c in-c-tr" aria-hidden="true" />
          <span className="in-c in-c-bl" aria-hidden="true" />
          <span className="in-c in-c-br" aria-hidden="true" />
          <nav className="in-navbar" aria-label="Main">
            <a className="in-brand" href={brandHref} onClick={go(brandHref)}>
              {logo ?? <Mark />}
              {brand}
            </a>
            <div className="in-links" ref={linksRef}>
              {links.map(link)}
              <svg className="in-caret" viewBox="0 0 10 6" aria-hidden="true" style={{ transform: "translateX(" + caret.x + "px)", opacity: caret.on ? 1 : 0 }}>
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </div>
            <div className="in-nav-end">
              {themeSwitch && (
                <button type="button" className="in-icon-btn" onClick={toggleTheme} aria-label={"Switch to " + (dark ? "light" : "dark") + " theme"}>
                  <ThemeIcon dark={dark} />
                </button>
              )}
              {cta && (
                <button type="button" className="in-btn in-btn-ghost" onClick={onCta}>
                  {cta}
                </button>
              )}
              {links.length > 0 && (
                <button type="button" className="in-icon-btn in-menu-btn" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu((m) => !m)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d={menu ? "M3.5 3.5l9 9M12.5 3.5l-9 9" : "M2 5h12M2 11h12"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </nav>
          {menu && <div className="in-mobile">{links.map(link)}</div>}
        </header>
      </div>
    </div>
  )
}

function Mark() {
  // the brand glyph: a folded N
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 21V3h4.2l9.6 12.2V3H21v18h-4.2L7.2 8.8V21z" fill="currentColor" />
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

const IN_CSS = `
.in-root{--in-paper:#fbfbfb;--in-card:#f4f4f4;--in-raise:#ffffff;--in-ink:#151515;--in-soft:#3d3d3d;--in-muted:#7b7b7b;--in-line:#e2e2e2;--in-line-strong:#cfcfcf;--in-bracket:#c9c9c9;--in-inv:#161616;--in-inv-ink:#f5f5f5;--in-shadow:0 1px 2px rgba(0,0,0,.05),0 8px 24px -12px rgba(0,0,0,.12);--in-sans:"Manrope","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;position:relative;z-index:30;width:100%;box-sizing:border-box;color:var(--in-ink);font-family:var(--in-sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;padding:10px clamp(10px,2.4vw,28px)}
.in-root[data-theme="dark"]{--in-paper:#121212;--in-card:#181818;--in-raise:#1e1e1e;--in-ink:#eeeeee;--in-soft:#c9c9c9;--in-muted:#8d8d8d;--in-line:#262626;--in-line-strong:#363636;--in-bracket:#444444;--in-inv:#efefef;--in-inv-ink:#121212;--in-shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.7)}
.in-sticky{position:sticky;top:0}
.in-root :where(*){box-sizing:border-box}
.in-root :focus-visible{outline:2px solid var(--in-ink);outline-offset:2px}
.in-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit;letter-spacing:inherit}
.in-root :where(a){color:inherit;text-decoration:none}
.in-root :where(svg){display:block;max-width:none;flex:none}
.in-shell{width:100%;max-width:1180px;margin:0 auto;container-type:inline-size}
.in-frame{position:relative}
.in-c{position:absolute;width:12px;height:12px;border-color:var(--in-bracket);border-style:solid;border-width:0;pointer-events:none;transition:border-color .3s,transform .35s cubic-bezier(.2,.8,.2,1)}
.in-c-tl{top:-6px;left:-6px;border-top-width:1.5px;border-left-width:1.5px}
.in-c-tr{top:-6px;right:-6px;border-top-width:1.5px;border-right-width:1.5px}
.in-c-bl{bottom:-6px;left:-6px;border-bottom-width:1.5px;border-left-width:1.5px}
.in-c-br{bottom:-6px;right:-6px;border-bottom-width:1.5px;border-right-width:1.5px}
.in-navbar{display:flex;align-items:center;gap:16px;height:58px;padding:0 14px 0 18px;background:color-mix(in srgb,var(--in-paper) 86%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--in-line);box-shadow:var(--in-shadow);transition:background-color .45s,border-color .45s}
.in-brand{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:15px;letter-spacing:-.01em;white-space:nowrap}
.in-brand svg{transition:transform .6s cubic-bezier(.2,.8,.2,1)}
.in-brand:hover svg{transform:rotate(-180deg)}
.in-links{position:relative;display:none;align-items:center;gap:2px;margin:0 auto}
.in-link{position:relative;padding:8px 12px;font-size:13.5px;color:var(--in-soft);transition:color .2s}
.in-link:hover,.in-link[aria-current="true"]{color:var(--in-ink)}
.in-caret{position:absolute;bottom:2px;left:0;width:10px;height:6px;color:var(--in-ink);transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .3s}
.in-nav-end{display:flex;align-items:center;gap:8px;margin-left:auto}
.in-icon-btn{display:inline-grid;place-items:center;width:34px;height:34px;color:var(--in-muted);border:1px solid transparent;transition:color .2s,border-color .2s}
.in-icon-btn:hover{color:var(--in-ink);border-color:var(--in-line)}
.in-menu-btn{display:inline-grid}
.in-mobile{position:absolute;left:0;right:0;top:calc(100% + 8px);display:grid;gap:2px;padding:8px;background:var(--in-paper);border:1px solid var(--in-line);box-shadow:var(--in-shadow);transform-origin:top;animation:in-drop .28s cubic-bezier(.2,.8,.2,1) both}
.in-mobile .in-link{padding:11px 12px;font-size:15px}
.in-mobile .in-link[aria-current="true"]{background:var(--in-card)}
@container (min-width:820px){.in-links{display:flex}.in-menu-btn{display:none}.in-mobile{display:none}.in-nav-end{margin-left:0}}
.in-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;font-size:13.5px;font-weight:500;line-height:1;white-space:nowrap;border-radius:2px;transition:background-color .2s,color .2s,box-shadow .25s,transform .2s cubic-bezier(.2,.8,.2,1)}
.in-btn-dark{background:var(--in-inv);color:var(--in-inv-ink);box-shadow:0 0 0 3px var(--in-paper),0 0 0 4px var(--in-line-strong),0 6px 16px -8px rgba(0,0,0,.5)}
.in-btn-dark:hover{box-shadow:0 0 0 3px var(--in-paper),0 0 0 4px var(--in-ink),0 10px 22px -10px rgba(0,0,0,.6);transform:translateY(-1px)}
.in-btn-ghost{background:var(--in-raise);color:var(--in-ink);border:1px solid var(--in-line-strong)}
.in-btn-ghost:hover{border-color:var(--in-ink)}
.in-btn:active{transform:translateY(0) scale(.98)}
.in-btn .in-arr{transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.in-btn:hover .in-arr{transform:translateX(3px)}
.in-btn[disabled]{opacity:.6;cursor:default}
@keyframes in-drop{from{opacity:0;transform:scaleY(.92) translateY(-6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){
.in-mobile{animation:none}
.in-caret,.in-brand svg,.in-btn,.in-link,.in-c{transition:none}
}
`
