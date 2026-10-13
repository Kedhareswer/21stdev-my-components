"use client"

// Plucked String Footer — a site footer with a single pen trace running along
// the foot of a huge wordmark. The trace is a string: sweep the pointer across
// it (or tap it, or focus it and press Enter) and it rings, the wave travels to
// both ends and dies away. The far end lifts off the page like a pen leaving
// the paper. Above it: a heading, a line of text, an email link and link
// columns; below it, the legal row.
//
// One file, React only. SVG for the trace. Nothing loads at runtime.
import * as React from "react"

/* ------------------------------------------------------------------ types */

export type PluckedStringFooterLink = { label: string; href: string }
export type PluckedStringFooterColumn = { title: string; links: PluckedStringFooterLink[] }
export type PluckedStringFooterProps = {
  /** Brand name, used for the wordmark unless `wordmark` is set. */
  brand?: string
  /** The big word the string runs through. Defaults to `brand`. */
  wordmark?: string
  heading?: string
  text?: string
  /** Shown as a mailto link. Empty string hides it. */
  email?: string
  columns?: PluckedStringFooterColumn[]
  /** Left side of the bottom row. */
  legal?: string
  /** Right side of the bottom row. Empty array hides it. */
  socials?: PluckedStringFooterLink[]
  /** Small label sitting on the top rule. Empty string hides it. */
  label?: string
  /** "auto" follows a `.dark` class on <html>. */
  theme?: "auto" | "light" | "dark"
  /** Trace, focus ring and hover colour. Any CSS colour. */
  accent?: string
  className?: string
}

/* ------------------------------------------------------------------ defaults */

const DEF_COLUMNS: PluckedStringFooterColumn[] = [
  {
    title: "Studio",
    links: [
      { label: "Work", href: "#" },
      { label: "Services", href: "#" },
      { label: "About", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Journal", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Press kit", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
]
const DEF_SOCIALS: PluckedStringFooterLink[] = [
  { label: "GitHub", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Instagram", href: "#" },
]

/* ------------------------------------------------------------------ the string (pure, tested) */

// #region string
/** Points along the string. Enough for a smooth line at 1440px, cheap at 375. */
export const PSF_N = 140
/** The trace sits this far above the bottom of the wordmark box. */
export const PSF_FOOT = 20
/** How far the string may swing either side of its rest line, in px. */
export const PSF_LIMIT = 18

/** Seeded PRNG (mulberry32), so every visit draws the same line. */
export function psfRandom(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The resting line: a faint hand-drawn wobble, then the pen lifts `lift` px at the end. */
export function psfBase(n: number, seed: number, lift: number) {
  const base = new Float32Array(n)
  const r = psfRandom(seed)
  const liftAt = Math.floor(n * 0.9)
  let a = 0
  for (let i = 0; i < n; i++) {
    a = a * 0.55 + (r() - 0.5)
    base[i] = a * 3.4
    if (i > liftAt) base[i] -= Math.pow((i - liftAt) / (n - 1 - liftAt), 2) * lift
  }
  return base
}

/**
 * Advance the damped wave equation one frame (two half steps). Both ends are
 * pinned. Returns the energy left, so the caller can stop when it is still.
 */
export function psfStep(y: Float32Array, v: Float32Array) {
  const n = y.length
  const c2 = 0.9
  const dt = 0.5
  let energy = 0
  for (let s = 0; s < 2; s++) {
    for (let i = 1; i < n - 1; i++) {
      const acc = c2 * (y[i - 1] - 2 * y[i] + y[i + 1]) - 0.004 * y[i] - 0.035 * v[i]
      v[i] += acc * dt
    }
    for (let i = 1; i < n - 1; i++) {
      y[i] += v[i] * dt
      if (y[i] > PSF_LIMIT || y[i] < -PSF_LIMIT) {
        y[i] = y[i] > 0 ? PSF_LIMIT : -PSF_LIMIT
        v[i] *= -0.3
      }
      energy += v[i] * v[i] + y[i] * y[i] * 0.01
    }
  }
  return energy
}

/** Kick the string at point `i`, spread over a few neighbours. Ends never move. */
export function psfPluck(v: Float32Array, i: number, force: number) {
  const n = v.length
  if (!Number.isFinite(i) || !Number.isFinite(force)) return
  const c = Math.round(i)
  for (let k = -3; k <= 3; k++) {
    const j = c + k
    if (j > 0 && j < n - 1) v[j] += force * (1 - Math.abs(k) / 4)
  }
}

/** Pointer speed across the string to a kick. Crossing it always plucks a little. */
export function psfForce(dy: number, crossed: boolean) {
  const d = Number.isFinite(dy) ? dy : 0
  let f = Math.max(-30, Math.min(30, d * 1.6))
  if (crossed && Math.abs(f) < 8) f = d < 0 ? -8 : 8
  return f
}

/** The trace as an SVG path over a box `w` wide, resting at `mid`. */
export function psfPath(base: Float32Array, y: Float32Array, w: number, mid: number) {
  const n = base.length
  let d = ""
  for (let i = 0; i < n; i++) {
    d += (i ? "L" : "M") + ((i / (n - 1)) * w).toFixed(1) + " " + (mid + base[i] + y[i]).toFixed(1)
  }
  return d
}

/**
 * Font size that makes the wordmark fill `boxW`, given its width at 100px.
 * Capped so a short word doesn't stand taller than `cap` px.
 */
export function psfFit(widthAt100: number, boxW: number, cap: number) {
  if (!(widthAt100 > 0) || !(boxW > 0)) return 0
  return Math.min(cap, (boxW / widthAt100) * 100)
}

/**
 * How far the word's ink hangs below its line box at font size `size`, from
 * canvas metrics taken at 100px: the font's ascent and descent, the glyphs'
 * real descent, and the line-height as a multiple of the font size. A "y" or
 * "g" in a tight-set wordmark hangs well below it.
 */
export function psfOverhang(fontAscent: number, fontDescent: number, inkDescent: number, lineHeight: number, size: number) {
  const all = [fontAscent, fontDescent, inkDescent, lineHeight, size]
  if (!all.every(Number.isFinite) || size <= 0) return 0
  const line = lineHeight * 100
  const baseline = (line - (fontAscent + fontDescent)) / 2 + fontAscent
  return Math.max(0, ((baseline + inkDescent - line) / 100) * size)
}

/** How far the pen lifts at the end, for a wordmark box `h` px tall. */
export function psfLift(h: number) {
  return Number.isFinite(h) ? Math.min(40, Math.max(12, h * 0.2)) : 12
}
// #endregion string

/* ------------------------------------------------------------------ styles */

const CSS =
  ".psf{--paper:#f4f5f3;--ink:#131517;--soft:#363b40;--muted:#5d646b;--line:rgba(19,21,23,.14);--acc:#c0281a;" +
  "--sans:\"Helvetica Neue\",Helvetica,Arial,\"Liberation Sans\",sans-serif;--mono:ui-monospace,\"SF Mono\",\"JetBrains Mono\",Menlo,Consolas,\"Liberation Mono\",monospace;--ease:cubic-bezier(.23,1,.32,1);" +
  "position:relative;container-type:inline-size;width:100%;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;isolation:isolate;overflow-x:clip;padding-top:12px}" +
  ".psf[data-theme=dark]{--paper:#121211;--ink:#ebeae4;--soft:#cdccc5;--muted:#a09f98;--line:rgba(235,234,228,.15);--acc:#ff6d58}" +
  ".psf[data-accent]{--acc:var(--psf-accent)}" +
  ".psf,.psf *,.psf *::before,.psf *::after{box-sizing:border-box}" +
  ".psf :where(h2,h3,p,ul,li){margin:0;padding:0}" +
  ".psf :where(ul){list-style:none}" +
  ".psf :where(svg){display:block;max-width:none}" +
  ".psf :where(a){color:inherit;text-decoration:none}" +
  ".psf ::selection{background:var(--acc);color:var(--paper)}" +
  ".psf :where(a,[role=button]):focus-visible{outline:2px solid var(--acc);outline-offset:3px;border-radius:2px}" +
  ".psf-in{--gut:70px;position:relative;padding:96px 24px 32px var(--gut);border-top:1.5px solid var(--ink);" +
  "background-image:linear-gradient(90deg,transparent calc(var(--gut) - 14px),var(--line) calc(var(--gut) - 14px),var(--line) calc(var(--gut) - 13px),transparent calc(var(--gut) - 13px))}" +
  ".psf-mono{font-family:var(--mono);font-size:12px;line-height:1.4;letter-spacing:.01em}" +
  ".psf-tag{position:absolute;left:var(--gut);top:-10px;background:var(--paper);padding-right:12px;color:var(--muted)}" +
  ".psf-grid{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:64px}" +
  ".psf-grid h2{font-size:clamp(36px,4.6cqw,72px);line-height:.98;letter-spacing:-.045em;font-weight:700;max-width:14ch;text-wrap:balance}" +
  ".psf-grid p{margin-top:20px;color:var(--soft);max-width:44ch}" +
  ".psf-mail{display:inline-flex;align-items:center;gap:10px;margin-top:24px;font-size:18px;border-bottom:1.5px solid var(--acc);padding-bottom:2px;transition:color .2s}" +
  ".psf-mail svg{width:16px;height:10px;transition:transform .26s var(--ease)}" +
  ".psf-mail:hover{color:var(--acc)}" +
  ".psf-mail:hover svg{transform:translateX(4px)}" +
  ".psf-cols{display:grid;grid-template-columns:repeat(var(--psf-cols,3),minmax(0,1fr));gap:24px;align-content:start}" +
  ".psf-cols h3{font-family:var(--mono);font-size:12px;font-weight:600;color:var(--muted);margin-bottom:12px}" +
  ".psf-cols a{display:block;width:max-content;max-width:100%;padding:5px 0;font-size:15px;transition:color .2s}" +
  ".psf-cols a:hover{color:var(--acc)}" +
  ".psf-word{position:relative;margin-top:96px;padding-bottom:40px;user-select:none;-webkit-user-select:none;touch-action:pan-y;cursor:crosshair}" +
  ".psf-word>span{display:block;width:max-content;font-size:clamp(56px,17cqw,300px);line-height:.78;letter-spacing:-.065em;font-weight:700;margin-left:-.05em;white-space:nowrap}" +
  ".psf-word svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none}" +
  ".psf-legal{display:flex;justify-content:space-between;align-items:baseline;gap:12px 24px;flex-wrap:wrap;margin-top:28px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted)}" +
  ".psf-legal ul{display:flex;flex-wrap:wrap;gap:4px 20px}" +
  ".psf-legal a{transition:color .2s}" +
  ".psf-legal a:hover{color:var(--acc)}" +
  "@container (max-width: 960px){" +
  ".psf-in{--gut:40px}" +
  ".psf-grid{grid-template-columns:1fr;gap:48px}" +
  "}" +
  "@container (max-width: 600px){" +
  ".psf-in{--gut:20px;font-size:16px;background-image:none;padding:72px 20px 24px var(--gut)}" +
  ".psf-grid h2{font-size:clamp(34px,10cqw,48px)}" +
  ".psf-cols{grid-template-columns:repeat(2,minmax(0,1fr))}" +
  ".psf-cols a{padding:9px 0}" +
  ".psf-word{margin-top:64px;padding-bottom:32px}" +
  ".psf-legal{flex-direction:column}" +
  "}" +
  "@media (prefers-reduced-motion: reduce){" +
  ".psf *,.psf *::before,.psf *::after{transition:none !important}" +
  ".psf-word{cursor:auto}" +
  "}"

/* ------------------------------------------------------------------ helpers */

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => setReduced(mq.matches)
    onMq()
    mq.addEventListener?.("change", onMq)
    return () => mq.removeEventListener?.("change", onMq)
  }, [])
  return reduced
}

/** "auto" follows the host's `.dark` class on <html>. */
function useDark(theme: "auto" | "light" | "dark") {
  const [dark, setDark] = React.useState(theme === "dark")
  React.useEffect(() => {
    if (theme !== "auto") {
      setDark(theme === "dark")
      return
    }
    const root = document.documentElement
    const read = () => setDark(root.classList.contains("dark"))
    read()
    const mo = new MutationObserver(read)
    mo.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [theme])
  return dark
}

/** "#" links must not rewrite the host page's hash. */
function onLink(e: React.MouseEvent, href: string) {
  if (!href || href === "#") e.preventDefault()
}

/* ------------------------------------------------------------------ the strummable wordmark */

function Wordmark(props: { word: string; reduced: boolean }) {
  const { word, reduced } = props
  const boxRef = React.useRef(null as HTMLDivElement | null)
  const wordRef = React.useRef(null as HTMLSpanElement | null)
  const pathRef = React.useRef(null as SVGPathElement | null)
  const tipRef = React.useRef(null as SVGCircleElement | null)
  const pluckRef = React.useRef(null as ((at: number, force: number) => void) | null)

  React.useEffect(() => {
    const box = boxRef.current
    const span = wordRef.current
    const path = pathRef.current
    const tip = tipRef.current
    if (!box || !span || !path || !tip) return
    const N = PSF_N
    const y = new Float32Array(N)
    const v = new Float32Array(N)
    let base = psfBase(N, 9, 40)
    let raf = 0
    let running = false
    let visible = false
    let greeted = false
    let lastX = -1
    let lastY = 0

    const draw = () => {
      const w = box.clientWidth
      const mid = box.clientHeight - PSF_FOOT
      path.setAttribute("d", psfPath(base, y, w, mid))
      tip.setAttribute("cx", w.toFixed(1))
      tip.setAttribute("cy", (mid + base[N - 1] + y[N - 1]).toFixed(1))
    }
    const fit = () => {
      // measure at 100px, then scale to the box; cap short words at ~30% of the width
      span.style.fontSize = "100px"
      const size = psfFit(span.scrollWidth, box.clientWidth, Math.max(56, box.clientWidth * 0.3))
      span.style.fontSize = size > 0 ? size.toFixed(2) + "px" : ""
      // descenders hang below the tight line box: make room so they never hit the legal row
      const cs = getComputedStyle(span)
      const px = parseFloat(cs.fontSize)
      const ctx = document.createElement("canvas").getContext("2d")
      let hang = 0
      if (ctx) {
        ctx.font = "700 100px " + cs.fontFamily
        const m = ctx.measureText(word)
        hang = psfOverhang(m.fontBoundingBoxAscent, m.fontBoundingBoxDescent, m.actualBoundingBoxDescent, parseFloat(cs.lineHeight) / px, px)
      }
      box.style.marginBottom = Math.max(0, hang - parseFloat(getComputedStyle(box).paddingBottom) + 6).toFixed(1) + "px"
      base = psfBase(N, 9, psfLift(box.clientHeight))
      draw()
    }
    const step = () => {
      if (!visible) {
        running = false
        return
      }
      const energy = psfStep(y, v)
      if (energy < 0.02) {
        y.fill(0)
        v.fill(0)
        draw()
        running = false
        return
      }
      draw()
      raf = requestAnimationFrame(step)
    }
    const wake = () => {
      if (running || reduced || !visible) return
      running = true
      raf = requestAnimationFrame(step)
    }
    const pluck = (at: number, force: number) => {
      if (reduced) return
      psfPluck(v, at * (N - 1), force)
      wake()
    }
    pluckRef.current = pluck

    const move = (e: PointerEvent) => {
      const rect = box.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const line = rect.height - PSF_FOOT
      if (lastX >= 0 && rect.width > 0) {
        const dy = py - lastY
        const crossed = (lastY - line) * (py - line) <= 0 && dy !== 0
        if (crossed || Math.abs(py - line) < 90) {
          const f = psfForce(dy, crossed)
          if (f !== 0) pluck(px / rect.width, f)
        }
      }
      lastX = px
      lastY = py
    }
    const leave = () => {
      lastX = -1
    }
    const down = (e: PointerEvent) => {
      const rect = box.getBoundingClientRect()
      if (rect.width > 0) pluck((e.clientX - rect.left) / rect.width, -22)
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting
      if (!visible) return
      // one gentle pluck the first time it's seen, so people learn it moves
      if (!greeted) {
        greeted = true
        pluck(0.3, -14)
      }
      wake()
    })
    io.observe(box)
    box.addEventListener("pointermove", move)
    box.addEventListener("pointerleave", leave)
    box.addEventListener("pointerdown", down)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      box.removeEventListener("pointermove", move)
      box.removeEventListener("pointerleave", leave)
      box.removeEventListener("pointerdown", down)
      pluckRef.current = null
    }
  }, [reduced, word])

  // keyboard: Enter or Space plucks somewhere new each time
  const keyCount = React.useRef(0)
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return
    e.preventDefault()
    const k = keyCount.current++
    pluckRef.current?.(0.2 + ((k * 0.37) % 0.6), k % 2 ? 22 : -22)
  }

  const interactive = !reduced
  return (
    <div
      className="psf-word"
      ref={boxRef}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? "Pluck the string" : undefined}
      aria-hidden={interactive ? undefined : true}
      onKeyDown={interactive ? onKey : undefined}
    >
      <span ref={wordRef} aria-hidden="true">
        {word}
      </span>
      <svg aria-hidden="true">
        <path ref={pathRef} fill="none" stroke="var(--acc)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle ref={tipRef} r="4" fill="var(--acc)" />
      </svg>
    </div>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M0 5h14M10 1l4 4-4 4" />
    </svg>
  )
}

/* ------------------------------------------------------------------ the footer */

export default function PluckedStringFooter({
  brand = "Fieldnote",
  wordmark,
  heading = "Have something worth building?",
  text = "We take on a handful of projects each quarter. Tell us what you're making and we'll reply within two working days.",
  email = "hello@fieldnote.studio",
  columns = DEF_COLUMNS,
  legal = "© 2026 Fieldnote Studio Ltd. · Made with care in Lisbon",
  socials = DEF_SOCIALS,
  label = "Get in touch",
  theme = "auto",
  accent,
  className,
}: PluckedStringFooterProps) {
  const reduced = useReducedMotion()
  const dark = useDark(theme)
  const style = (accent ? { "--psf-accent": accent } : {}) as React.CSSProperties
  const colStyle = { "--psf-cols": Math.max(1, Math.min(4, columns.length)) } as React.CSSProperties

  return (
    <footer
      className={"psf" + (className ? " " + className : "")}
      data-theme={dark ? "dark" : "light"}
      data-accent={accent ? "" : undefined}
      style={style}
    >
      <style>{CSS}</style>
      <div className="psf-in">
        {label ? (
          <span className="psf-tag psf-mono" aria-hidden="true">
            {label}
          </span>
        ) : null}
        <div className="psf-grid">
          <div>
            <h2>{heading}</h2>
            {text ? <p>{text}</p> : null}
            {email ? (
              <a className="psf-mail" href={"mailto:" + email}>
                {email}
                <Arrow />
              </a>
            ) : null}
          </div>
          {columns.length ? (
            <nav className="psf-cols" aria-label="Footer" style={colStyle}>
              {columns.map((c) => (
                <div key={c.title}>
                  <h3>{c.title}</h3>
                  <ul>
                    {c.links.map((l) => (
                      <li key={l.label}>
                        <a href={l.href} onClick={(e) => onLink(e, l.href)}>
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          ) : null}
        </div>
        <Wordmark word={wordmark || brand} reduced={reduced} />
        <div className="psf-legal psf-mono">
          <span>{legal}</span>
          {socials.length ? (
            <ul aria-label="Social">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} onClick={(e) => onLink(e, s.href)}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
