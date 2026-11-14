import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"

// #region strip
// Pure: the badge strip, exactly as the Bunkum template's footer. The test lifts this region.

/** Each badge leans a little: -8, -4, 0, 4, 8 degrees, repeating. */
export const tilt = (i: number) => (((i % 5) + 5) % 5 - 2) * 4
/** One trip of the strip takes this long; the second copy of the row makes the loop seamless. */
export const MARQUEE_S = 46
/** CSS background value for a picture: data URIs and plain paths go through as they are. */
export const urlOf = (src: string) => "url(\"" + src.replace(/["\\\n]/g, "") + "\")"
// #endregion

/* ------------------------------------------------------------- content */

export type BadgeStripFooterProps = {
  /** Pictures for the round badges, any image URLs. Defaults to the eighteen template drawings, served from kedhar-components.pages.dev. */
  badges?: string[]
  /** The legal line, centre of the bottom row. */
  copyright?: string
  /** Accessible name of the signature. */
  signatureLabel?: string
  /** Text of the back-to-top button. */
  backToTopLabel?: string
  /** Replaces the default (scroll the window to the top, smoothly unless reduced motion is on). */
  onBackToTop?: () => void
  /** Minimum height of the footer. A definite length; the strip and legal row sit at its bottom. */
  height?: string
  className?: string
  style?: CSSProperties
}

const KINDS = ["a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"]
const SIG =
  "M14 62c6-22 10-44 8-50-3 10-4 40 0 52 8-14 24-20 26-8 2 13-18 16-22 6M58 40c-2 10 0 22 8 20 7-2 8-14 8-20 0 8 2 18 8 18M92 58c0-8 0-16 2-18 4 10 10 18 14 16 2-6 0-14 0-18M124 20c-2 16-2 30 0 42M140 36c-8 4-14 10-14 12 8 0 14 6 18 14M156 40c-2 10 0 22 8 20 7-2 8-14 8-20 0 8 2 18 8 18M190 58c0-6 0-14 2-18 3 6 4 12 6 12 2-6 4-12 7-12 3 4 3 12 3 18M20 78c50-6 120-10 190-6"

/* ------------------------------------------------------------- styles */

const CSS =
  ".bkm-root{--blue:#2731e8;--deep:#0d137a;--butter:#ffe98a;--ink:#0c0c10;--paper:#f6f1e3;position:relative;overflow:clip;background:var(--ink);color:var(--paper);font-family:BkmSans,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;isolation:isolate}" +
  ".dark .bkm-root{--ink:#08080b}" +
  ".bkm-root *{box-sizing:border-box}" +
  ".bkm-root svg,.bkm-root img{max-width:none}" +
  ".bkm-mono{font-family:BkmMono,ui-monospace,monospace;font-size:11px;line-height:1.35;letter-spacing:.06em;text-transform:uppercase}" +
  ".bkm-speck{background-color:var(--blue);background-image:radial-gradient(circle at 30% 40%,rgba(255,255,255,.14) 0 1.2px,transparent 1.8px),radial-gradient(circle at 70% 60%,rgba(0,0,0,.22) 0 1.6px,transparent 2.3px),radial-gradient(circle at 50% 50%,rgba(255,255,255,.08) 0 2.4px,transparent 3px);background-size:37px 41px,53px 47px,113px 97px}" +
  /* the footer: the strip and the legal row sit at the bottom of whatever height it is given */
  ".bkm-foot{position:relative;z-index:4;padding:clamp(40px,7vh,72px) 18px 22px;color:var(--butter)}" +
  ".bkm-end{display:flex;flex-direction:column;justify-content:flex-end}" +
  ".bkm-strip{display:flex;gap:14px;margin:0 -18px;overflow:hidden;padding:8px 0}" +
  ".bkm-strip>div{display:flex;gap:14px;flex:none;animation:bkm-marq 46s linear infinite}" +
  ".bkm-strip i{flex:none;width:clamp(84px,9vw,128px);aspect-ratio:1;border-radius:50%;border:2px solid var(--ink);background-size:cover;background-position:center;transform:rotate(var(--t))}" +
  "@keyframes bkm-marq{to{transform:translateX(calc(-100% - 14px))}}" +
  ".bkm-legal{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-top:clamp(40px,7vh,72px)}" +
  ".bkm-sig{width:clamp(90px,10vw,130px);height:auto;color:var(--butter)}" +
  ".bkm-sig path{fill:none;stroke:currentColor;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}" +
  ".bkm-top{background:none;border:0;padding:0;color:inherit;cursor:pointer;font:inherit}" +
  /* context label (the system cursor stays) */
  ".bkm-cursor{display:none;position:fixed;left:0;top:0;z-index:90;pointer-events:none}" +
  ".bkm-clab{position:absolute;left:16px;top:16px;padding:6px 10px;border-radius:999px;background:var(--butter);color:var(--deep);white-space:nowrap;opacity:0;transform:scale(.5);transform-origin:0 0;transition:transform .3s cubic-bezier(.2,1.5,.4,1),opacity .15s}" +
  ".bkm-cursor[data-label] .bkm-clab{opacity:1;transform:none}" +
  "@media (hover:hover) and (pointer:fine){.bkm-cursor{display:block}}" +
  /* small screens */
  "@media (max-width:640px){.bkm-legal{flex-direction:column;align-items:flex-start}}" +
  "@media (prefers-reduced-motion:reduce){.bkm-root *{animation:none!important;transition-duration:.01ms!important;transition-delay:0s!important}}"

/* ------------------------------------------------------------- component */

const f = (n: number) => (Math.round(n * 10) / 10).toString()

export default function BadgeStripFooter({
  badges,
  copyright = "© 2026 Bunkum Studio · drawn by hand, mostly",
  signatureLabel = "Bunkum signature",
  backToTopLabel = "Back to top ↑",
  onBackToTop,
  height = "420px",
  className,
  style,
}: BadgeStripFooterProps) {
  const cursorRef = useRef(null as HTMLDivElement | null)
  const labelRef = useRef(null as HTMLSpanElement | null)
  const s = useRef({
    fine: false,
    still: false,
    px: -1,
    py: -1,
    over: false,
    label: "",
    raf: 0,
    cache: new WeakMap() as WeakMap<object, Record<string, string>>,
  })

  // a write cache: a style is only touched when its value changes
  const put = (el: HTMLElement | null | undefined, prop: string, val: string) => {
    if (!el) return
    const c = s.current.cache
    let m = c.get(el)
    if (!m) c.set(el, (m = {}))
    if (m[prop] === val) return
    m[prop] = val
    ;(el.style as unknown as Record<string, string>)[prop] = val
  }
  const flag = (el: HTMLElement | null | undefined, name: string, on: boolean) => {
    if (!el) return
    if (on !== el.hasAttribute(name)) on ? el.setAttribute(name, "") : el.removeAttribute(name)
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fp = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => {
      s.current.still = rm.matches
      s.current.fine = fp.matches
    }
    sync()
    rm.addEventListener("change", sync)
    fp.addEventListener("change", sync)
    return () => {
      rm.removeEventListener("change", sync)
      fp.removeEventListener("change", sync)
      const st = s.current
      if (st.raf) window.cancelAnimationFrame(st.raf)
      st.raf = 0
    }
  }, [])

  // ---- the frame: the context label follows the mouse (writes only)
  const frame = () => {
    const st = s.current
    st.raf = 0
    if (st.fine && st.over) put(cursorRef.current, "transform", "translate3d(" + f(st.px) + "px," + f(st.py) + "px,0)")
  }
  const schedule = () => {
    const st = s.current
    if (!st.raf && typeof window !== "undefined") st.raf = window.requestAnimationFrame(frame)
  }

  const onMove = (ev: ReactPointerEvent<HTMLElement>) => {
    const st = s.current
    if (ev.pointerType !== "mouse") return
    st.px = ev.clientX
    st.py = ev.clientY
    st.over = true
    const t = ev.target as Element
    const hit = t.closest ? (t.closest("[data-cursor]") as HTMLElement | null) : null
    const label = hit ? hit.getAttribute("data-cursor") || "" : ""
    if (label !== st.label) {
      st.label = label
      if (labelRef.current) labelRef.current.textContent = label
      flag(cursorRef.current, "data-label", !!label)
    }
    schedule()
  }
  const onLeave = (ev: ReactPointerEvent<HTMLElement>) => {
    const st = s.current
    if (ev.pointerType === "mouse") st.over = false
    flag(cursorRef.current, "data-label", false)
    st.label = ""
    schedule()
  }

  const toTop = () => {
    if (onBackToTop) return onBackToTop()
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: s.current.still ? "auto" : "smooth" })
  }

  // each picture is set once as a custom property, so the strip's second copy doesn't duplicate the data
  const pics = badges && badges.length ? badges : KINDS.map((k) => IMG[k])
  const vars = {} as Record<string, string>
  pics.forEach((src, i) => {
    vars["--bk-" + i] = urlOf(src)
  })
  const rootStyle = { ...vars, minHeight: height, ...style } as CSSProperties

  return (
    <footer
      className={"bkm-root bkm-foot bkm-speck bkm-end" + (className ? " " + className : "")}
      style={rootStyle}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <style>{FONTS + CSS}</style>
      <div className="bkm-strip" aria-hidden="true">
        {[0, 1].map((n) => (
          <div key={n}>
            {pics.map((_, i) => (
              <i key={i} style={{ backgroundImage: "var(--bk-" + i + ")", "--t": tilt(i) + "deg" } as CSSProperties} />
            ))}
          </div>
        ))}
      </div>
      <div className="bkm-legal">
        <svg className="bkm-sig" viewBox="0 0 220 90" aria-label={signatureLabel} role="img">
          <path d={SIG} />
        </svg>
        <span className="bkm-mono">{copyright}</span>
        <button type="button" className="bkm-top bkm-mono" data-cursor="Wheee" onClick={toTop}>
          {backToTopLabel}
        </button>
      </div>
      <div ref={cursorRef} className="bkm-cursor" aria-hidden="true">
        <span ref={labelRef} className="bkm-clab bkm-mono" />
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------- fonts + pictures */
// Inter Tight 400 (the back-to-top button: its `font:inherit` overrides the mono face, as in the
// template) and a capitals subset of JetBrains Mono. Both SIL OFL 1.1, renamed as the licence asks.

const FONTS =
  "@font-face{font-family:BkmSans;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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) format(\"woff2\")}" +
  "@font-face{font-family:BkmMono;font-weight:400 700;font-display:swap;src:url(data:font/woff2;base64,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) format(\"woff2\")}"

/** The drawings, served full-size from the author's site (embedding them would break 21st's 200 kB file limit). */
const IMG_BASE = "https://kedhar-components.pages.dev/bunkum/"
const IMG: Record<string, string> = {
  a0: IMG_BASE + "a0.webp",
  a1: IMG_BASE + "a1.webp",
  a2: IMG_BASE + "a2.webp",
  a3: IMG_BASE + "a3.webp",
  a4: IMG_BASE + "a4.webp",
  a5: IMG_BASE + "a5.webp",
  a6: IMG_BASE + "a6.webp",
  a7: IMG_BASE + "a7.webp",
  a8: IMG_BASE + "a8.webp",
  b0: IMG_BASE + "b0.webp",
  b1: IMG_BASE + "b1.webp",
  b2: IMG_BASE + "b2.webp",
  b3: IMG_BASE + "b3.webp",
  b4: IMG_BASE + "b4.webp",
  b5: IMG_BASE + "b5.webp",
  b6: IMG_BASE + "b6.webp",
  b7: IMG_BASE + "b7.webp",
  b8: IMG_BASE + "b8.webp",
}
