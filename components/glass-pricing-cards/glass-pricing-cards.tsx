"use client"

import * as React from "react"
import { gsap } from "gsap"

/*
 * Glass Pricing Cards: a pricing section of three frosted-glass plans. A
 * kicker, a title set in a pixel face drawn in code (it assembles from its
 * pixels when reached), a lede and a monthly / yearly switch whose prices
 * count to their new value. The plans rise into place one after another,
 * the featured one last and lit in the accent. Cards tilt toward a mouse
 * pointer with a spotlight that follows it. The section paints its own plum
 * backdrop with spectral silk; pass `background="transparent"` to sit it on
 * yours.
 */

export type PricingAccent = "ice" | "ember" | "lime"

export type GlassPlan = {
  name: string
  /** Price per period in whole currency units. Yearly shows this less `yearlyDiscount`. */
  price: number
  blurb: string
  features: string[]
  cta: string
  featured?: boolean
  badge?: string
}

export interface GlassPricingCardsProps {
  kicker?: string
  /** Drawn in the pixel face. */
  title?: string
  lede?: string
  plans?: GlassPlan[]
  currency?: string
  /** Fraction taken off when billed yearly. 0 hides the switch. */
  yearlyDiscount?: number
  /** Unit after the price. */
  period?: string
  accent?: PricingAccent
  /** Any CSS background. */
  background?: string
  onPlanSelect?: (plan: GlassPlan, yearly: boolean) => void
  className?: string
}

const DEFAULT_PLANS: GlassPlan[] = [
  { name: "Starter", price: 0, blurb: "For trying an idea on a quiet evening.", features: ["5 builds a month", "Web previews", "Community templates"], cta: "Start free" },
  { name: "Pro", price: 24, blurb: "For makers shipping something every week.", features: ["Unlimited builds", "Mobile and web export", "Custom domains", "Every model, first in line"], cta: "Go Pro", featured: true, badge: "Most popular" },
  { name: "Team", price: 64, blurb: "For product teams who review before they ship.", features: ["Everything in Pro", "Shared workspaces", "Roles and review", "Single sign-on"], cta: "Bring the team" },
]

const DEFAULT_BACKGROUND =
  "radial-gradient(120% 22% at 50% 48%, rgba(190,80,200,.30), transparent 70%), radial-gradient(120% 16% at 40% 56%, rgba(70,170,230,.22), transparent 70%), radial-gradient(120% 14% at 60% 62%, rgba(240,170,60,.16), transparent 70%), linear-gradient(180deg, #120a12, #2c1629 60%, #120a12)"

const ACCENTS = {
  ice: { a1: "#e8f6ff", a2: "#a9dcff", a3: "#5fb2f2", glow: "rgba(95,178,242,.42)", ink: "#06233a" },
  ember: { a1: "#fcc8a6", a2: "#f49d70", a3: "#e07a45", glow: "rgba(224,122,69,.42)", ink: "#3a1606" },
  lime: { a1: "#efffc4", a2: "#c4f26a", a3: "#8fcf2e", glow: "rgba(143,207,46,.38)", ink: "#1c2a05" },
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

// #region money
/** Whole units with thousands separators. */
export function money(n: number, currency: string) {
  return currency + Math.round(n).toLocaleString("en-US")
}

/** The yearly price, per period, after the discount. */
export function discounted(price: number, discount: number) {
  return Math.round(price * (1 - discount))
}
// #endregion money

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
    <svg className="gpc-ptitle" viewBox={"-0.5 -0.5 " + vw + " " + vh} aria-hidden="true" focusable="false" style={{ ["--w" as string]: vw, aspectRatio: vw + " / " + vh } as React.CSSProperties}>
      {lay.glyphs.map((cells, gi) => (
        <g key={gi}>
          {cells.map(([x, y], i) => (
            <rect key={i} className="gpc-px" x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.16} />
          ))}
        </g>
      ))}
    </svg>
  )
}

function Check() {
  return (
    <svg className="gpc-check" viewBox="0 0 7 7" aria-hidden="true" focusable="false">
      {[[6, 1], [5, 2], [0, 3], [4, 3], [1, 4], [3, 4], [2, 5]].map(([x, y], i) => (
        <rect key={i} x={x + 0.08} y={y + 0.08} width={0.84} height={0.84} rx={0.12} />
      ))}
    </svg>
  )
}

export default function GlassPricingCards({
  kicker = "Pricing",
  title = "Simple plans",
  lede = "Start free. Upgrade when the ideas start shipping.",
  plans = DEFAULT_PLANS,
  currency = "$",
  yearlyDiscount = 0.2,
  period = "month",
  accent = "ice",
  background = DEFAULT_BACKGROUND,
  onPlanSelect,
  className,
}: GlassPricingCardsProps) {
  const reduced = useReducedMotion()
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const tone = ACCENTS[accent] || ACCENTS.ice
  const rootRef = React.useRef(null as HTMLElement | null)
  const priceRefs = React.useRef([] as (HTMLSpanElement | null)[])
  const [yearly, setYearly] = React.useState(false)

  // the title assembles and the plans rise once the section is reached
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reduced) return
    const px = root.querySelectorAll(".gpc-px")
    const cards = root.querySelectorAll(".gpc-plan")
    const copy = root.querySelectorAll(".gpc-kicker, .gpc-lede, .gpc-cycle")
    const ctx = gsap.context((self) => {
      gsap.set(px, { opacity: 0 })
      gsap.set(cards, { opacity: 0 })
      gsap.set(copy, { opacity: 0 })
      const play = () => {
        gsap.fromTo(px, { x: () => gsap.utils.random(-14, 14), y: () => gsap.utils.random(-10, 10), opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { x: 0, y: 0, opacity: 1, scale: 1, duration: 1.1, ease: "expo.out", stagger: { amount: 0.5, from: "random" } })
        gsap.fromTo(copy, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" })
        gsap.fromTo(cards, { y: 90, scale: 0.9, opacity: 0 }, {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 1.1,
          delay: 0.2,
          ease: "expo.out",
          stagger: (i: number, el: Element) => ((el as HTMLElement).dataset.featured ? 0.28 : i * 0.08),
          clearProps: "transform",
        })
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
  }, [reduced, plans.length, title])

  // prices count to their new value when the billing cycle changes
  const firstCycle = React.useRef(true)
  React.useEffect(() => {
    if (firstCycle.current) {
      firstCycle.current = false
      return
    }
    const tweens = plans.map((p, i) => {
      const el = priceRefs.current[i]
      if (!el) return null
      const to = yearly ? discounted(p.price, yearlyDiscount) : p.price
      const from = yearly ? p.price : discounted(p.price, yearlyDiscount)
      if (reduced) {
        el.textContent = money(to, currency)
        return null
      }
      const o = { v: from }
      return gsap.to(o, {
        v: to,
        duration: 0.7,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = money(o.v, currency)
        },
      })
    })
    return () => tweens.forEach((t) => t?.kill())
  }, [yearly])

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

  const style = {
    "--gpc-bg": background,
    "--gpc-a1": tone.a1,
    "--gpc-a2": tone.a2,
    "--gpc-a3": tone.a3,
    "--gpc-glow": tone.glow,
    "--gpc-ink": tone.ink,
  } as React.CSSProperties

  return (
    <section ref={rootRef} className={"gpc-root" + (className ? " " + className : "")} style={style} aria-labelledby={uid + "-title"}>
      <style>{GPC_CSS}</style>
      <div className="gpc-inner">
        <div className="gpc-head">
          {kicker && (
            <span className="gpc-kicker">
              <i /> {kicker}
            </span>
          )}
          <h2 id={uid + "-title"} className="gpc-title">
            <span className="gpc-sr">{title}</span>
            <PixelTitle text={title} />
          </h2>
          {lede && <p className="gpc-lede">{lede}</p>}
          {yearlyDiscount > 0 && (
            <div className="gpc-cycle" role="group" aria-label="Billing cycle" data-yearly={yearly ? "true" : "false"}>
              <span className="gpc-cycle-pill" aria-hidden="true" />
              <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>
                Monthly
              </button>
              <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>
                Yearly <em>-{Math.round(yearlyDiscount * 100)}%</em>
              </button>
            </div>
          )}
        </div>
        <ul className="gpc-plans">
          {plans.map((p, i) => (
            <li key={p.name} className="gpc-plan" data-featured={p.featured ? "true" : undefined} onPointerMove={tilt} onPointerLeave={untilt}>
              <div className="gpc-plan-head">
                <h3>{p.name}</h3>
                {p.badge && <span className="gpc-badge">{p.badge}</span>}
              </div>
              <p className="gpc-blurb">{p.blurb}</p>
              <p className="gpc-price">
                <span
                  ref={(el) => {
                    priceRefs.current[i] = el
                  }}
                  className="gpc-price-num"
                >
                  {money(p.price, currency)}
                </span>
                <span className="gpc-per">
                  / {period}
                  <small>{p.price === 0 ? "free forever" : yearly ? "billed yearly" : "billed " + period + "ly"}</small>
                </span>
              </p>
              <button type="button" className={p.featured ? "gpc-solid" : "gpc-ghost"} onClick={() => onPlanSelect?.(p, yearly)}>
                {p.cta}
              </button>
              <ul className="gpc-list">
                {p.features.map((f) => (
                  <li key={f}>
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

type CardEvent = React.PointerEvent<HTMLElement>

const GPC_CSS = `
.gpc-root{position:relative;padding:clamp(72px,12svh,140px) clamp(16px,4vw,40px);background:var(--gpc-bg);color:#f5f5f6;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5;text-align:left}
.gpc-root :where(svg){display:block;max-width:none}
.gpc-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}
.gpc-root :where(h2,h3,p,ul,li){margin:0;padding:0}
.gpc-root :where(ul){list-style:none}
.gpc-root :where(button):focus-visible{outline:2px solid var(--gpc-a2);outline-offset:3px;border-radius:8px}
.gpc-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.gpc-inner{width:min(1140px,100%);margin:0 auto;container-type:inline-size}
.gpc-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:18px;margin-bottom:clamp(40px,7svh,72px)}
.gpc-kicker{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 12px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#d8d8dd;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.gpc-kicker i{width:6px;height:6px;border-radius:1.5px;background:var(--gpc-a2);box-shadow:0 0 10px var(--gpc-a2)}
.gpc-title{color:#fff;filter:drop-shadow(0 4px 20px rgba(0,0,0,.45))}
.gpc-ptitle{height:auto;overflow:visible;fill:currentColor;width:min(calc(clamp(3.4px,.5vw + 1.6px,6.6px) * var(--w)),100cqi)}
.gpc-lede{max-width:54ch;font-size:clamp(15px,1.25vw,17px);color:#c4c4cb;text-shadow:0 1px 12px rgba(0,0,0,.5)}
.gpc-cycle{position:relative;display:inline-grid;grid-template-columns:1fr 1fr;padding:4px;border-radius:13px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.gpc-cycle button{position:relative;z-index:1;height:34px;padding:0 16px;border-radius:9px;font-size:13.5px;font-weight:550;color:#a6a6ad;transition:color .3s}
.gpc-cycle button[aria-pressed="true"]{color:#fff}
.gpc-cycle em{font-style:normal;font-size:11.5px;color:var(--gpc-a2);margin-left:4px}
.gpc-cycle-pill{position:absolute;top:4px;left:4px;width:calc(50% - 4px);height:34px;border-radius:9px;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);transition:transform .5s cubic-bezier(.16,1,.3,1)}
.gpc-cycle[data-yearly="true"] .gpc-cycle-pill{transform:translateX(100%)}
.gpc-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}
.gpc-plan{--mx:50%;--my:50%;position:relative;padding:28px 26px;display:flex;flex-direction:column;gap:14px;border-radius:22px;background:radial-gradient(360px circle at var(--mx) var(--my),rgba(255,255,255,.09),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.03)),rgba(12,12,16,.46);backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),inset 0 1px 0 rgba(255,255,255,.12),0 20px 50px rgba(0,0,0,.28);transform-style:preserve-3d;will-change:transform}
.gpc-plan[data-featured]{background:radial-gradient(360px circle at var(--mx) var(--my),rgba(255,255,255,.12),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.045)),rgba(12,12,16,.4);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),inset 0 1px 0 rgba(255,255,255,.2),0 0 0 1px var(--gpc-glow),0 30px 80px rgba(0,0,0,.35),0 0 60px -20px var(--gpc-glow)}
.gpc-plan-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.gpc-plan h3{font-size:19px;font-weight:600;letter-spacing:-.015em}
.gpc-badge{font-size:11px;font-weight:650;letter-spacing:.04em;padding:4px 9px;border-radius:999px;color:var(--gpc-ink);background:linear-gradient(160deg,var(--gpc-a1),var(--gpc-a2))}
.gpc-blurb{font-size:14px;color:#b8b9c0;min-height:2.6em}
.gpc-price{display:flex;align-items:flex-end;gap:10px;margin:6px 0 4px}
.gpc-price-num{font-size:clamp(40px,4.4vw,52px);font-weight:650;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
.gpc-per{display:flex;flex-direction:column;font-size:13px;color:#b8b8bf;line-height:1.3;padding-bottom:4px}
.gpc-per small{font-size:11.5px;color:#8a8a92}
.gpc-ghost,.gpc-solid{display:grid;place-items:center;width:100%;height:44px;border-radius:11px;font-size:14px;font-weight:550;transition:background .2s,filter .2s,transform .2s}
.gpc-ghost{background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.gpc-ghost:hover{background:rgba(255,255,255,.13)}
.gpc-solid{color:var(--gpc-ink);background:linear-gradient(160deg,var(--gpc-a1),var(--gpc-a2) 55%,var(--gpc-a3));box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 6px 20px var(--gpc-glow)}
.gpc-solid:hover{filter:brightness(1.06)}
.gpc-ghost:active,.gpc-solid:active{transform:translateY(1px)}
.gpc-list{display:grid;gap:10px;margin-top:8px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08)}
.gpc-list li{display:flex;align-items:center;gap:10px;font-size:14px;color:#cfd0d6}
.gpc-check{width:12px;height:12px;fill:var(--gpc-a2);flex:none}
@media (max-width:980px){
.gpc-plans{grid-template-columns:minmax(0,1fr);max-width:520px;margin:0 auto}
}
@media (prefers-reduced-motion:reduce){
.gpc-root *{transition-duration:.01ms}
}
`
