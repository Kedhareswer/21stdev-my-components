"use client"

import * as React from "react"
import { gsap } from "gsap"

/*
 * Glass Feature Grid: a features section of frosted-glass cards. A small
 * kicker, a title set in a pixel face drawn in code (it assembles from its
 * pixels when reached), a lede, then the cards, which drop into the grid one
 * after another like tiles falling into place. Each card tilts toward a
 * mouse pointer and carries a spotlight that follows it. The section paints
 * its own slate-and-spectrum backdrop; pass `background="transparent"` to
 * sit it on yours.
 */

export type FeatureIcon = "spark" | "eye" | "code" | "chat" | "phone" | "rocket" | "window" | "bars" | "game" | "bolt" | "shield" | "globe"

export type GlassFeature = {
  icon: FeatureIcon
  title: string
  body: string
}

export interface GlassFeatureGridProps {
  kicker?: string
  /** Drawn in the pixel face. */
  title?: string
  lede?: string
  features?: GlassFeature[]
  /** 2 or 3 columns on wide screens. */
  columns?: 2 | 3
  /** Number each card 01, 02... */
  numbered?: boolean
  /** Colour of the kicker dot and the icon on hover. */
  accent?: string
  /** Any CSS background. */
  background?: string
  className?: string
}

const DEFAULT_FEATURES: GlassFeature[] = [
  { icon: "spark", title: "Plain words in", body: "Describe screens, data and flows the way you would to a teammate. No spec template, no setup." },
  { icon: "eye", title: "Live preview", body: "Watch the app assemble while it builds, then click through every screen before anyone else sees it." },
  { icon: "code", title: "Code you own", body: "Readable React and React Native you can export, keep in your repo and go on editing anywhere." },
  { icon: "chat", title: "Edit by chatting", body: "Ask for a darker theme or one more tab. Changes land in the app you have, not in a fresh project." },
  { icon: "phone", title: "Phone and web", body: "One description, both targets. Layouts adapt to the screen they land on, down to the tap targets." },
  { icon: "rocket", title: "Ship in a click", body: "Publish to a link you can share when it feels right, and roll back just as fast when it does not." },
]

const DEFAULT_BACKGROUND =
  "linear-gradient(118deg, transparent 18%, rgba(120,90,220,.22) 26%, transparent 34%, transparent 52%, rgba(60,170,240,.2) 60%, transparent 68%, rgba(120,220,120,.16) 78%, transparent 86%), linear-gradient(180deg, #0c1018, #1f2838 55%, #0c1018)"

const ICONS: { [k: string]: string } = {
  spark: "...#.../...#.../..###../#######/..###../...#.../...#...",
  eye: "......./..###../.#...#./#..#..#/.#...#./..###../.......",
  code: ".##.##./.#...#./#.....#/#.....#/#.....#/.#...#./.##.##.",
  chat: "#######/#.....#/#.#.#.#/#.....#/#######/.##..../.#.....",
  phone: ".#####./.#...#./.#...#./.#...#./.#####./.##.##./.#####.",
  rocket: "...#.../..###../..#.#../..###../.#####./#.###.#/..#.#..",
  window: "#######/#.#.#.#/#######/#.....#/#.....#/#.....#/#######",
  bars: "......#/....#.#/....#.#/..#.#.#/..#.#.#/#.#.#.#/#######",
  game: "...#.../...#.../..###../.#####./#######/#.#.#.#/#######",
  bolt: "....##./...##../..##.../.######/...##../..##.../.##....",
  shield: "#######/#.....#/#.....#/#.....#/.#...#./..#.#../...#...",
  globe: "..###../.#.#.#./#..#..#/#######/#..#..#/.#.#.#./..###..",
}

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

function PixelTitle({ text }: { text: string }) {
  const lay = React.useMemo(() => layoutPixels(text), [text])
  const vw = lay.width + 1
  const vh = lay.height + 1
  return (
    <svg className="gfg-ptitle" viewBox={"-0.5 -0.5 " + vw + " " + vh} aria-hidden="true" focusable="false" style={{ ["--w" as string]: vw, aspectRatio: vw + " / " + vh } as React.CSSProperties}>
      {lay.glyphs.map((cells, gi) => (
        <g key={gi}>
          {cells.map(([x, y], i) => (
            <rect key={i} className="gfg-px" x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.16} />
          ))}
        </g>
      ))}
    </svg>
  )
}

function PixelIcon({ name }: { name: string }) {
  const rows = (ICONS[name] || ICONS.spark).split("/")
  const cells: number[][] = []
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) if (r[x] === "#") cells.push([x, y])
  })
  return (
    <svg className="gfg-icon" viewBox="0 0 7 7" aria-hidden="true" focusable="false">
      {cells.map(([x, y], i) => (
        <rect key={i} x={x + 0.08} y={y + 0.08} width={0.84} height={0.84} rx={0.12} />
      ))}
    </svg>
  )
}

export default function GlassFeatureGrid({
  kicker = "Features",
  title = "Built to ship",
  lede = "Everything between a sentence and a working app, without the parts that usually slow it down.",
  features = DEFAULT_FEATURES,
  columns = 3,
  numbered = true,
  accent = "#a9dcff",
  background = DEFAULT_BACKGROUND,
  className,
}: GlassFeatureGridProps) {
  const reduced = useReducedMotion()
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const rootRef = React.useRef(null as HTMLElement | null)

  // the title assembles and the cards drop in once the section is reached
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reduced) return
    const px = root.querySelectorAll(".gfg-px")
    const cards = root.querySelectorAll(".gfg-card")
    const copy = root.querySelectorAll(".gfg-kicker, .gfg-lede")
    const ctx = gsap.context((self) => {
      gsap.set(px, { opacity: 0 })
      gsap.set(cards, { opacity: 0 })
      gsap.set(copy, { opacity: 0 })
      const play = () => {
        gsap.fromTo(px, { x: () => gsap.utils.random(-14, 14), y: () => gsap.utils.random(-10, 10), opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { x: 0, y: 0, opacity: 1, scale: 1, duration: 1.1, ease: "expo.out", stagger: { amount: 0.5, from: "random" } })
        gsap.fromTo(copy, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" })
        gsap.fromTo(
          cards,
          { y: -70, rotateX: 24, transformPerspective: 900, transformOrigin: "50% 0%", opacity: 0 },
          { y: 0, rotateX: 0, opacity: 1, duration: 1, delay: 0.2, ease: "back.out(1.4)", stagger: { each: 0.09, grid: "auto", from: "start" }, clearProps: "transform" },
        )
      }
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          io.disconnect()
          self.add(play)
        },
        { threshold: 0.15 },
      )
      io.observe(root)
      self.add(() => () => io.disconnect())
    }, root)
    return () => ctx.revert()
  }, [reduced, features.length, title])

  // the spotlight follows the pointer and the card leans toward it
  const tilt = (e: CardEvent) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty("--mx", x * 100 + "%")
    el.style.setProperty("--my", y * 100 + "%")
    if (reduced || e.pointerType !== "mouse") return
    gsap.to(el, { rotateY: (x - 0.5) * 7, rotateX: -(y - 0.5) * 7, transformPerspective: 900, duration: 0.5, ease: "power3.out", overwrite: "auto" })
  }
  const untilt = (e: CardEvent) => {
    gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 0.7, ease: "elastic.out(1,0.6)", overwrite: "auto" })
  }

  return (
    <section
      ref={rootRef}
      className={"gfg-root" + (className ? " " + className : "")}
      style={{ ["--gfg-bg" as string]: background, ["--gfg-accent" as string]: accent, ["--gfg-cols" as string]: columns } as React.CSSProperties}
      aria-labelledby={uid + "-title"}
    >
      <style>{GFG_CSS}</style>
      <div className="gfg-inner">
        <div className="gfg-head">
          {kicker && (
            <span className="gfg-kicker">
              <i /> {kicker}
            </span>
          )}
          <h2 id={uid + "-title"} className="gfg-title">
            <span className="gfg-sr">{title}</span>
            <PixelTitle text={title} />
          </h2>
          {lede && <p className="gfg-lede">{lede}</p>}
        </div>
        <ul className="gfg-grid">
          {features.map((f, i) => (
            <li key={f.title} className="gfg-card" onPointerMove={tilt} onPointerLeave={untilt}>
              {numbered && (
                <span className="gfg-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <span className="gfg-icon-box">
                <PixelIcon name={f.icon} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

type CardEvent = React.PointerEvent<HTMLElement>

const GFG_CSS = `
.gfg-root{position:relative;width:100%;box-sizing:border-box;padding:clamp(72px,12svh,140px) clamp(16px,4vw,40px);background:var(--gfg-bg);color:#f5f5f6;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5;text-align:left}
.gfg-root :where(svg){display:block;max-width:none}
.gfg-root :where(h2,h3,p,ul,li){margin:0;padding:0}
.gfg-root :where(ul){list-style:none}
.gfg-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.gfg-inner{width:min(1140px,100%);margin:0 auto;container-type:inline-size}
.gfg-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:18px;margin-bottom:clamp(40px,7svh,72px)}
.gfg-kicker{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 12px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#d8d8dd;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.gfg-kicker i{width:6px;height:6px;border-radius:1.5px;background:var(--gfg-accent);box-shadow:0 0 10px var(--gfg-accent)}
.gfg-title{color:#fff;filter:drop-shadow(0 4px 20px rgba(0,0,0,.45))}
.gfg-ptitle{height:auto;overflow:visible;fill:currentColor;width:min(calc(clamp(3.4px,.5vw + 1.6px,6.6px) * var(--w)),100cqi)}
.gfg-lede{max-width:54ch;font-size:clamp(15px,1.25vw,17px);color:#c4c4cb;text-shadow:0 1px 12px rgba(0,0,0,.5)}
.gfg-grid{display:grid;grid-template-columns:repeat(var(--gfg-cols),minmax(0,1fr));gap:16px}
.gfg-card{--mx:50%;--my:50%;position:relative;padding:26px 24px 28px;display:flex;flex-direction:column;gap:10px;min-height:220px;border-radius:22px;background:radial-gradient(360px circle at var(--mx) var(--my),rgba(255,255,255,.09),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.03)),rgba(12,12,16,.46);backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),inset 0 1px 0 rgba(255,255,255,.12),0 20px 50px rgba(0,0,0,.28);transform-style:preserve-3d;will-change:transform}
.gfg-card h3{font-size:18px;font-weight:600;letter-spacing:-.015em;margin-top:10px}
.gfg-card p{font-size:14.5px;line-height:1.6;color:#c9cad1}
.gfg-num{position:absolute;top:22px;right:22px;font-size:12px;font-variant-numeric:tabular-nums;color:rgba(255,255,255,.32);letter-spacing:.06em}
.gfg-icon-box{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(160deg,rgba(255,255,255,.16),rgba(255,255,255,.04));box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),inset 0 1px 0 rgba(255,255,255,.2)}
.gfg-icon{width:20px;height:20px;fill:#fff;transition:fill .3s,transform .5s cubic-bezier(.16,1,.3,1)}
.gfg-card:hover .gfg-icon{fill:var(--gfg-accent);transform:scale(1.12)}
@media (max-width:980px){
.gfg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:640px){
.gfg-grid{grid-template-columns:minmax(0,1fr)}
.gfg-card{min-height:0}
}
@media (prefers-reduced-motion:reduce){
.gfg-root *{transition-duration:.01ms}
}
`
