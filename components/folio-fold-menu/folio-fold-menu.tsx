"use client"

import * as React from "react"
import gsap from "gsap"

// Full-screen menu that folds the page away. Opening drops the page a third of
// the way down and tips it back into a rounded sheet; the links rise into the
// space it leaves, one after another. Closing pulls the links out first, then
// lifts the page back up, quicker than it came down.

export type FoldLink = {
  label: string
  href?: string
}

export type FolioFoldMenuProps = {
  links: FoldLink[]
  /** Wordmark in the top bar (string or node). */
  brand?: React.ReactNode
  /** The page itself. It folds away when the menu opens. */
  children?: React.ReactNode
  /** The open button's fill. */
  accent?: string
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  defaultOpen?: boolean
  className?: string
  onNavigate?: (link: FoldLink, index: number) => void
  onOpenChange?: (open: boolean) => void
}

// #region pose
/** Where the page sits when folded. Reduced motion drops the tilt and the scale. */
export function foldPose(reduced: boolean) {
  return reduced
    ? { yPercent: 34, scale: 1, rotationX: 0, borderRadius: 20 }
    : { yPercent: 34, scale: 0.94, rotationX: 10, borderRadius: 20 }
}

/** Link stagger in seconds: quicker per link as the list grows, capped overall. */
export function linkStagger(n: number): number {
  if (n <= 1) return 0
  return Math.min(0.05, 0.25 / (n - 1))
}

/** Open and close timings in seconds, measured off the reference fold. */
export function foldTiming(reduced: boolean) {
  return reduced
    ? { open: 0.25, close: 0.2, linksAt: 0.05, linkIn: 0.2, linkOut: 0.1, closeAt: 0 }
    : { open: 0.6, close: 0.3, linksAt: 0.18, linkIn: 0.32, linkOut: 0.14, closeAt: 0.08 }
}
// #endregion

const FONT =
  "@font-face{font-family:ffm-serif;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}"

const CSS =
  FONT +
  ".ffm-root{position:relative;width:100%;overflow:hidden;isolation:isolate;background:#0d0c0a;color:#f3eee5;container-type:inline-size;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif}" +
  ".ffm-serif{font-family:ffm-serif,'Iowan Old Style','Times New Roman',serif;font-weight:400}" +
  ".ffm-bar{position:absolute;z-index:5;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:20px clamp(18px,3cqw,40px);pointer-events:none}" +
  ".ffm-bar>*{pointer-events:auto}" +
  ".ffm-brand{font-size:15px;letter-spacing:.01em;font-weight:600;color:#f6f1e8}" +
  ".ffm-btn{display:inline-flex;align-items:center;gap:10px;height:40px;padding:0 4px 0 14px;border:0;border-radius:999px;background:transparent;color:#f6f1e8;font:500 13px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.01em;cursor:pointer;transition:transform .2s cubic-bezier(.2,.8,.2,1)}" +
  ".ffm-btn:active{transform:scale(.96)}" +
  ".ffm-btn:focus-visible{outline:2px solid var(--ffm-accent);outline-offset:3px}" +
  ".ffm-btnlabel{position:relative;display:block;height:14px;overflow:hidden}" +
  ".ffm-btnlabel>span{display:block;height:14px;line-height:14px;transition:transform .4s cubic-bezier(.2,.8,.2,1)}" +
  ".ffm-root[data-open] .ffm-btnlabel>span{transform:translateY(-100%)}" +
  ".ffm-burger{position:relative;width:32px;height:32px;border-radius:999px;background:#f6f1e8;transition:background .3s}" +
  ".ffm-root[data-open] .ffm-burger{background:var(--ffm-accent)}" +
  ".ffm-burger>i{position:absolute;left:10px;right:10px;height:1.6px;border-radius:2px;background:#15130f;transition:transform .4s cubic-bezier(.2,.8,.2,1),top .4s cubic-bezier(.2,.8,.2,1)}" +
  ".ffm-burger>i:first-child{top:12.5px}.ffm-burger>i:last-child{top:18px}" +
  ".ffm-root[data-open] .ffm-burger>i:first-child{top:15.2px;transform:rotate(45deg)}" +
  ".ffm-root[data-open] .ffm-burger>i:last-child{top:15.2px;transform:rotate(-45deg)}" +
  ".ffm-menu{position:absolute;z-index:1;left:0;right:0;top:0;height:34%;display:flex;align-items:center;justify-content:center;padding:56px clamp(18px,3cqw,40px) 0}" +
  ".ffm-links{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;column-gap:clamp(20px,3cqw,44px);row-gap:4px}" +
  ".ffm-li{will-change:transform,opacity}" +
  ".ffm-link{display:block;padding:4px 2px;color:#f3eee5;text-decoration:none;outline:none;font-size:clamp(28px,3.2cqw,46px);line-height:1.1;letter-spacing:-.01em;transition:opacity .2s ease}" +
  ".ffm-links:hover .ffm-link{opacity:.42}" +
  ".ffm-links:hover .ffm-link:hover,.ffm-link:focus-visible{opacity:1}" +
  ".ffm-link:focus-visible{outline:1px solid rgba(243,238,229,.45);outline-offset:4px;border-radius:6px}" +
  ".ffm-page{position:absolute;z-index:2;inset:0;overflow:hidden;transform-origin:50% 0;background:#1a1814;will-change:transform}" +
  ".ffm-root[data-open] .ffm-page{cursor:pointer}" +
  ".ffm-edge{position:absolute;inset:0;z-index:3;pointer-events:none;border-radius:inherit;opacity:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.28)}" +
  "@container (max-width:640px){.ffm-links{flex-direction:column;align-items:center}.ffm-menu{height:46%}.ffm-link{font-size:30px}}" +
  "@media (prefers-reduced-motion:reduce){.ffm-btnlabel>span,.ffm-burger,.ffm-burger>i,.ffm-link{transition-duration:.01ms}}"

export default function FolioFoldMenu({
  links,
  brand = "Studio",
  children,
  accent = "#e8b77a",
  height = "100svh",
  defaultOpen = false,
  className,
  onNavigate,
  onOpenChange,
}: FolioFoldMenuProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const root = React.useRef(null as HTMLDivElement | null)
  const menu = React.useRef(null as HTMLElement | null)
  const btn = React.useRef(null as HTMLButtonElement | null)
  const ctx = React.useRef(null as gsap.Context | null)
  const first = React.useRef(true)
  // Move focus into the menu only when it was opened from the keyboard.
  const byKey = React.useRef(false)
  const id = React.useId()

  const set = React.useCallback(
    (next: boolean) => {
      setOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange]
  )

  // Rest pose on mount; open/close tweens are added to this context so they revert with it.
  React.useEffect(() => {
    const el = root.current
    if (!el) return
    const c = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (defaultOpen) {
        gsap.set(".ffm-page", { ...foldPose(reduced), transformPerspective: 1400 })
        gsap.set(".ffm-edge", { opacity: 1 })
      } else {
        gsap.set(".ffm-li", { opacity: 0, y: reduced ? 0 : 14 })
      }
    }, el)
    ctx.current = c
    return () => {
      c.revert()
      ctx.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links.length])

  React.useEffect(() => {
    menu.current?.toggleAttribute("inert", !open)
    if (first.current) {
      first.current = false
      return
    }
    const c = ctx.current
    if (!c) return
    c.add(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const T = foldTiming(reduced)
      const stagger = linkStagger(links.length)
      gsap.killTweensOf(".ffm-page, .ffm-edge, .ffm-li")
      if (open) {
        // Ease-out from the first frame: the page is already moving when the click lands.
        gsap.to(".ffm-page", { ...foldPose(reduced), transformPerspective: 1400, duration: T.open, ease: "power3.out" })
        gsap.to(".ffm-edge", { opacity: 1, duration: T.open, ease: "power1.out" })
        gsap.to(".ffm-li", { opacity: 1, y: 0, duration: T.linkIn, ease: "power2.out", stagger, delay: T.linksAt })
      } else {
        gsap.to(".ffm-li", { opacity: 0, y: reduced ? 0 : -8, duration: T.linkOut, ease: "power1.in", stagger: { each: stagger * 0.6, from: "end" } })
        gsap.to(".ffm-page", { yPercent: 0, scale: 1, rotationX: 0, borderRadius: 0, duration: T.close, ease: "power2.in", delay: T.closeAt })
        gsap.to(".ffm-edge", { opacity: 0, duration: T.close, delay: T.closeAt })
        gsap.set(".ffm-li", { y: reduced ? 0 : 14, delay: T.closeAt + T.close })
      }
    })
    if (open && byKey.current) {
      const a = menu.current?.querySelector("a")
      window.setTimeout(() => (a as HTMLElement | null)?.focus({ preventScroll: true }), 300)
    }
  }, [open, links.length])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        set(false)
        btn.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, set])

  return (
    <div
      ref={root}
      className={"ffm-root" + (className ? " " + className : "")}
      style={{ height, ["--ffm-accent" as string]: accent }}
      data-open={open ? "" : undefined}
    >
      <style>{CSS}</style>

      <nav ref={menu} id={id} className="ffm-menu" aria-label="Main" aria-hidden={!open}>
        <ul className="ffm-links">
          {links.map((link, i) => (
            <li key={link.label + i} className="ffm-li">
              <a
                className="ffm-link ffm-serif"
                href={link.href ?? "#"}
                onClick={(e) => {
                  if (!link.href) e.preventDefault()
                  onNavigate?.(link, i)
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="ffm-page" onClick={open ? () => set(false) : undefined} aria-hidden={open || undefined}>
        {children}
        <div className="ffm-edge" />
      </div>

      <header className="ffm-bar">
        <div className="ffm-brand">{brand}</div>
        <button
          ref={btn}
          type="button"
          className="ffm-btn"
          aria-expanded={open}
          aria-controls={id}
          onClick={(e) => {
            byKey.current = e.detail === 0
            set(!open)
          }}
        >
          <span className="ffm-btnlabel">
            <span>Menu</span>
            <span aria-hidden="true">Close</span>
          </span>
          <span className="ffm-burger" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </header>
    </div>
  )
}
