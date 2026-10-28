"use client"

import * as React from "react"
import { gsap } from "gsap"

/*
 * Pixel Wordmark Footer: the brand as a huge pixel wordmark, drawn in code
 * one SVG square per pixel. As the footer scrolls into view the pixels
 * gather from a scattered cloud into the word, tied to how much of the
 * footer is showing, so scrolling back scatters them again. Below it a
 * small mark (the brand's first letter in the same pixel face), a note and
 * a row of links. No font file is loaded.
 */

export type FooterLink = {
  label: string
  href?: string
  onClick?: () => void
}

export interface PixelWordmarkFooterProps {
  /** The big pixel word, and the letter in the small mark. */
  brand?: string
  note?: string
  links?: FooterLink[]
  /** Colour of the wordmark pixels. */
  color?: string
  /** Any CSS background. */
  background?: string
  /** Gather the pixels as the footer scrolls in. Off: the word is simply there. */
  gather?: boolean
  className?: string
}

const DEFAULT_LINKS: FooterLink[] = [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }, { label: "Back to top", href: "#" }]

// #region pixel-font
const GLYPHS: { [ch: string]: string } = {
  A: ".###./#...#/#...#/#####/#...#/#...#/#...#",
  B: "####./#...#/#...#/####./#...#/#...#/####.",
  C: ".###./#...#/#..../#..../#..../#...#/.###.",
  D: "####./#...#/#...#/#...#/#...#/#...#/####.",
  E: "#####/#..../#..../####./#..../#..../#####",
  F: "#####/#..../#..../####./#..../#..../#....",
  G: ".###./#...#/#..../#.###/#...#/#...#/.####",
  H: "#...#/#...#/#...#/#####/#...#/#...#/#...#",
  I: "###/.#./.#./.#./.#./.#./###",
  J: "..###/...#./...#./...#./...#./#..#./.##..",
  K: "#...#/#..#./#.#../##.../#.#../#..#./#...#",
  L: "#..../#..../#..../#..../#..../#..../#####",
  M: "#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#",
  N: "#...#/##..#/#.#.#/#..##/#...#/#...#/#...#",
  O: ".###./#...#/#...#/#...#/#...#/#...#/.###.",
  P: "####./#...#/#...#/####./#..../#..../#....",
  Q: ".###./#...#/#...#/#...#/#.#.#/#..#./.##.#",
  R: "####./#...#/#...#/####./#.#../#..#./#...#",
  S: ".####/#..../#..../.###./....#/....#/####.",
  T: "#####/..#../..#../..#../..#../..#../..#..",
  U: "#...#/#...#/#...#/#...#/#...#/#...#/.###.",
  V: "#...#/#...#/#...#/#...#/#...#/.#.#./..#..",
  W: "#...#/#...#/#...#/#.#.#/#.#.#/#.#.#/.#.#.",
  X: "#...#/#...#/.#.#./..#../.#.#./#...#/#...#",
  Y: "#...#/#...#/.#.#./..#../..#../..#../..#..",
  Z: "#####/....#/...#./..#../.#.../#..../#####",
  a: "...../...../.###./....#/.####/#...#/.####",
  b: "#..../#..../####./#...#/#...#/#...#/####.",
  c: "..../..../.###/#.../#.../#.../.###",
  d: "....#/....#/.####/#...#/#...#/#...#/.####",
  e: "...../...../.###./#...#/#####/#..../.###.",
  f: ".##/#../###/#../#../#../#..",
  g: "...../...../.####/#...#/#...#/.####/....#/.###.",
  h: "#..../#..../####./#...#/#...#/#...#/#...#",
  i: "#/./#/#/#/#/#",
  j: "..#/.../..#/..#/..#/..#/..#/##.",
  k: "#.../#.../#..#/#.#./##../#.#./#..#",
  l: "#./#./#./#./#./#./.#",
  m: "...../...../##.#./#.#.#/#.#.#/#...#/#...#",
  n: "...../...../####./#...#/#...#/#...#/#...#",
  o: "...../...../.###./#...#/#...#/#...#/.###.",
  p: "...../...../####./#...#/#...#/####./#..../#....",
  q: "...../...../.####/#...#/#...#/.####/....#/....#",
  r: "..../..../#.##/##../#.../#.../#...",
  s: "...../...../.####/#..../.###./....#/####.",
  t: ".#../.#../####/.#../.#../.#../..##",
  u: "...../...../#...#/#...#/#...#/#...#/.####",
  v: "...../...../#...#/#...#/#...#/.#.#./..#..",
  w: "...../...../#...#/#...#/#.#.#/#.#.#/.#.#.",
  x: "...../...../#...#/.#.#./..#../.#.#./#...#",
  y: "...../...../#...#/#...#/#...#/.####/....#/.###.",
  z: "...../...../#####/...#./..#../.#.../#####",
  "0": ".###./#...#/#..##/#.#.#/##..#/#...#/.###.",
  "1": "..#../.##../..#../..#../..#../..#../.###.",
  "2": ".###./#...#/....#/...#./..#../.#.../#####",
  "3": "####./....#/....#/.###./....#/....#/####.",
  "4": "...#./..##./.#.#./#..#./#####/...#./...#.",
  "5": "#####/#..../####./....#/....#/#...#/.###.",
  "6": ".###./#..../#..../####./#...#/#...#/.###.",
  "7": "#####/....#/...#./..#../.#.../.#.../.#...",
  "8": ".###./#...#/#...#/.###./#...#/#...#/.###.",
  "9": ".###./#...#/#...#/.####/....#/....#/.###.",
  ".": "././././././#",
  ",": "././././././#/#",
  "'": "#/#/././././.",
  "!": "#/#/#/#/#/./#",
  "?": ".###./#...#/....#/...#./..#../...../..#..",
  "-": ".../.../.../###/.../.../...",
  "&": ".##../#..#./#.#../.#.../#.#.#/#..#./.##.#",
  "+": "...../..#../..#../#####/..#../..#../.....",
}

/** One cell per lit pixel, one blank column between glyphs, 3 columns for a space. Unknown characters fall back to their capital, then to a space. */
export function layoutPixels(text: string) {
  const glyphs: number[][][] = []
  let x = 0
  for (const ch of text) {
    const g = GLYPHS[ch] || GLYPHS[ch.toUpperCase()]
    if (!g) {
      x += 3
      continue
    }
    const rows = g.split("/")
    const w = Math.max(...rows.map((r) => r.length))
    const cells: number[][] = []
    rows.forEach((r, y) => {
      for (let i = 0; i < r.length; i++) if (r[i] === "#") cells.push([x + i, y])
    })
    glyphs.push(cells)
    x += w + 1
  }
  return { width: Math.max(1, x - 1), height: 8, glyphs }
}
// #endregion pixel-font

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  useIsoLayoutEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

function PixelWord({ text, className }: { text: string; className: string }) {
  const lay = React.useMemo(() => layoutPixels(text), [text])
  const vw = lay.width + 1
  const vh = lay.height + 1
  return (
    <svg className={className} viewBox={"-0.5 -0.5 " + vw + " " + vh} aria-hidden="true" focusable="false" style={{ aspectRatio: vw + " / " + vh }}>
      {lay.glyphs.map((cells, gi) => (
        <g key={gi}>
          {cells.map(([x, y], i) => (
            <rect key={i} className="pwf-px" x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.16} />
          ))}
        </g>
      ))}
    </svg>
  )
}

export default function PixelWordmarkFooter({
  brand = "Frameloom",
  note = "Made from a sentence.",
  links = DEFAULT_LINKS,
  color = "rgba(255,255,255,.92)",
  background = "radial-gradient(70% 60% at 50% 0%, rgba(120,70,140,.28), transparent 70%), linear-gradient(180deg, #0b0a0e, #050506)",
  gather = true,
  className,
}: PixelWordmarkFooterProps) {
  const reduced = useReducedMotion()
  const rootRef = React.useRef(null as HTMLElement | null)
  const initial = (brand.trim()[0] || "A").toUpperCase()

  // the pixels gather as more of the footer shows, and scatter again as it leaves
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reduced || !gather) return
    const px = root.querySelectorAll(".pwf-word .pwf-px")
    let tl = null as gsap.core.Timeline | null
    const ctx = gsap.context(() => {
      tl = gsap.timeline({ paused: true })
      tl.fromTo(
        px,
        { x: () => gsap.utils.random(-30, 30), y: () => gsap.utils.random(-6, 30), opacity: 0, scale: 0.2, transformOrigin: "50% 50%" },
        { x: 0, y: 0, opacity: 1, scale: 1, ease: "none", stagger: { amount: 0.6, from: "random" } },
      )
    }, root)
    const steps = Array.from({ length: 41 }, (_, i) => i / 40)
    let shown = 0
    const io = new IntersectionObserver(
      ([e]) => {
        shown = e.intersectionRatio
        if (tl) gsap.to(tl, { progress: Math.min(1, shown * 1.25), duration: 0.6, ease: "power2.out", overwrite: "auto" })
      },
      { threshold: steps },
    )
    io.observe(root)
    return () => {
      io.disconnect()
      ctx.revert()
    }
  }, [reduced, brand, gather])

  return (
    <footer
      ref={rootRef}
      className={"pwf-root" + (className ? " " + className : "")}
      style={{ ["--pwf-bg" as string]: background, ["--pwf-color" as string]: color } as React.CSSProperties}
    >
      <style>{PWF_CSS}</style>
      <div className="pwf-inner">
        <div className="pwf-mark-row">
          <PixelWord text={brand} className="pwf-word" />
        </div>
        <div className="pwf-row">
          <span className="pwf-brand">
            <span className="pwf-tile" aria-hidden="true">
              <PixelWord text={initial} className="pwf-tile-glyph" />
            </span>
            <span className="pwf-sr">{brand}. </span>
            {note}
          </span>
          {links.length > 0 && (
            <nav className="pwf-links" aria-label="Footer">
              {links.map((l) =>
                l.href ? (
                  <a key={l.label} href={l.href} onClick={l.onClick}>
                    {l.label}
                  </a>
                ) : (
                  <button key={l.label} type="button" onClick={l.onClick}>
                    {l.label}
                  </button>
                ),
              )}
            </nav>
          )}
        </div>
      </div>
    </footer>
  )
}

const PWF_CSS = `
.pwf-root{position:relative;padding:clamp(64px,12svh,130px) clamp(16px,4vw,40px) 36px;background:var(--pwf-bg);color:#a3a3ab;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5}
.pwf-root :where(svg){display:block;max-width:none}
.pwf-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}
.pwf-root :where(a,button):focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:6px}
.pwf-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.pwf-inner{width:min(1140px,100%);margin:0 auto}
.pwf-mark-row{display:flex;justify-content:center;color:var(--pwf-color);margin-bottom:clamp(40px,7svh,70px)}
.pwf-word{width:min(100%,980px);height:auto;overflow:visible;fill:currentColor}
.pwf-row{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-top:22px;border-top:1px solid rgba(255,255,255,.08);font-size:13.5px}
.pwf-brand{display:inline-flex;align-items:center;gap:10px}
.pwf-tile{display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:#f4f4f5}
.pwf-tile-glyph{width:9px;height:auto;fill:#0b0b0d}
.pwf-links{display:flex;gap:20px;flex-wrap:wrap}
.pwf-links a,.pwf-links button{color:#a3a3ab;text-decoration:none;transition:color .2s}
.pwf-links a:hover,.pwf-links button:hover{color:#fff}
@media (prefers-reduced-motion:reduce){
.pwf-root *{transition-duration:.01ms}
}
`
