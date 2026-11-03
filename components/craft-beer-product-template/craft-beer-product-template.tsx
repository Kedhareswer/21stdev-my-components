"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Craft Beer Product Template — the page for one beer from one brewery.
 *
 * The bottle is the spine of the page. It rides the scroll on a sticky layer
 * while everything else moves past it:
 *
 * - Hero: a huge stamped headline with the bottle tilted across it. Scrolling
 *   stands the bottle up.
 * - Details: script kicker, the beer's name in stamped black, an intro and
 *   a double-ruled box of numbers (ABV, IBU, OG).
 * - Mouthfeel: one giant red word slides behind the bottle; a video card on
 *   the left, tasting notes on the right.
 * - Flavours: ink splats (turmeric, tulsi, jaggery) carry the three flavour notes, and
 *   a full glass tips in from the bottom left.
 * - Availability: the pack line-up. The bottle shrinks and drops into its
 *   empty slot in the row, then scrolls away with it.
 * - Recipe pairing and a footer.
 *
 * GSAP + ScrollTrigger inside one gsap.context, reverted on unmount. No
 * pinning: the bottle sits on a CSS sticky layer and GSAP only scrubs its
 * transform. Phones and `prefers-reduced-motion` get the same page with the
 * bottle placed in the hero and in its slot instead of travelling.
 *
 * Look: monsoon night. A rain-slate ground with slanted rain drifting over
 * it, the bottle backlit by an amber glow, turmeric, tulsi-green and jaggery
 * inks, Yatra One display type over Mukta text and Kalam handwriting.
 *
 * Every picture is a prop (photo URL or data URI); text, numbers and the
 * line-up are data. Fonts are Google Fonts (OFL) via `fontHref`.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

const REDUCE = "(prefers-reduced-motion: reduce)"
const FONTS =
  "https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Mukta:wght@400;500;600;700;800&family=Yatra+One&display=swap"

export type CbStat = {
  label: string
  sub: string
  value: string
  /** Smaller trailing part of the number, e.g. "%" or ".4". */
  unit?: string
  note: string
  href?: string
}

export type CbFlavour = {
  title: string
  body: string
  icon: "citrus" | "leaf" | "steam"
  /** Ink colour: turmeric, tulsi green or jaggery brown. */
  tone: "haldi" | "tulsi" | "gud"
}

export type CbPack = {
  label: string
  detail?: string
  src?: string
  alt?: string
  /** Height relative to the tallest pack (1). */
  scale?: number
  /** The empty slot the travelling bottle lands in. Exactly one pack should set it. */
  slot?: boolean
}

export interface CraftBeerProductTemplateProps {
  brand?: string
  brandSub?: string
  buyLabel?: string
  buyHref?: string
  headline?: [string, string]
  sealText?: string
  kicker?: string
  title?: [string, string]
  intro?: string
  ctaLabel?: string
  ctaHref?: string
  stats?: CbStat[]
  feelWord?: string
  videoPoster?: string
  videoHref?: string
  videoCaption?: [string, string]
  tasting?: string
  styleTitle?: string
  style?: string[]
  flavours?: CbFlavour[]
  availabilityKicker?: string
  availability?: string
  packs?: CbPack[]
  recipeKicker?: string
  recipeTitle?: string[]
  recipeBody?: string
  recipeCta?: string
  recipeHref?: string
  recipeImage?: string
  recipeImageAlt?: string
  /** Upright front-on bottle cut-out (transparent). It travels down the page. */
  bottle?: string
  bottleAlt?: string
  /** A full glass, cut out; tips in beside the flavour notes. */
  glass?: string
  footerLines?: string[]
  legal?: string
  /** Hero tilt of the bottle in degrees. */
  tilt?: number
  /** Viewport height the sticky stage is sized against. */
  height?: string
  fontHref?: string | null
  className?: string
}

const DEFAULT_STATS: CbStat[] = [
  { label: "ABV", sub: "Alcohol by Volume", value: "6.4", unit: "%", note: "Strong enough to notice, easy enough to order a second." },
  { label: "IBU", sub: "Int'l Bitterness Units", value: "52", unit: "", note: "Bitter like a good filter kaapi: up front, then gone clean." },
  { label: "OG", sub: "Original Gravity", value: "1.0", unit: "62", note: "A full malt body that carries the hops without going sweet." },
]

const DEFAULT_FLAVOURS: CbFlavour[] = [
  { title: "Nagpur orange – Citra hops", body: "Citra hops and a twist of Nagpur orange peel give a citrus lift that is both bright and deep.", icon: "citrus", tone: "haldi" },
  { title: "Tulsi – pine", body: "Resinous late hops bring a green, tulsi-like pine. It grounds the citrus and caramel and keeps you coming back for another sip.", icon: "leaf", tone: "tulsi" },
  { title: "Jaggery – malt", body: "Crystal malt adds a slow-cooked jaggery note. Where the base malt is clean and biscuity, the crystal brings caramelised sugar and the deep amber colour.", icon: "steam", tone: "gud" },
]

const DEFAULT_PACKS: CbPack[] = [
  { label: "On tap", scale: 0.92 },
  { label: "650 ml bottles", detail: "Singles", scale: 1 },
  { label: "330 ml bottles", detail: "6- or 12-pack", scale: 0.8, slot: true },
  { label: "330 ml cans", detail: "4-pack", scale: 0.6 },
  { label: "500 ml cans", detail: "Singles", scale: 0.78 },
]

const CSS = `
.tb-root{--night:#111a20;--night-2:#0b1115;--cream:#efe5cf;--mist:#93a5ad;--haldi:#f2a91d;--tulsi:#2f6a45;--gud:#6e3f1c;--rule:rgba(239,229,207,.82);
  position:relative;isolation:isolate;width:100%;color:var(--cream);
  background:radial-gradient(120% 60% at 50% 0%,#1a2731 0%,var(--night) 55%),var(--night);
  font-family:Mukta,system-ui,sans-serif;overflow:clip;-webkit-font-smoothing:antialiased}
.tb-root img{max-width:none;display:block}
.tb-root a{color:inherit;text-decoration:none}
.tb-root button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.tb-root :focus-visible{outline:2px solid var(--haldi);outline-offset:3px}
/* the monsoon: fine slanted rain over the whole page, drifting slowly */
.tb-rain{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.55;
  background-image:repeating-linear-gradient(103deg,transparent 0 31px,rgba(190,214,226,.07) 31px 32px,transparent 32px 57px,rgba(190,214,226,.045) 57px 58px);
  background-size:180px 900px;animation:tb-rain 9s linear infinite}
@keyframes tb-rain{to{background-position:-200px 900px}}
.tb-script{font-family:Kalam,"Comic Sans MS",cursive;font-weight:400;color:var(--haldi)}
.tb-wide{font-family:"Yatra One",Georgia,serif;font-weight:400}
.tb-stamp{font-family:"Yatra One",Georgia,serif;font-weight:400;line-height:.9;text-transform:uppercase;letter-spacing:.005em}

/* chrome: a zero-height sticky bar whose children hang into the viewport */
.tb-bar{position:sticky;top:0;height:0;z-index:30}
.tb-rail{position:absolute;left:0;top:0;width:64px;height:var(--h);pointer-events:none}
.tb-rail::before,.tb-rail::after{content:"";position:absolute;top:14px;bottom:14px;background:var(--rule)}
.tb-rail::before{left:58px;width:2px}
.tb-rail::after{left:63px;width:1px;opacity:.5}
.tb-icon{position:absolute;left:18px;width:24px;height:24px;display:grid;place-items:center;pointer-events:auto}
.tb-icon svg{width:18px;height:18px}
.tb-root .tb-logo{position:absolute;left:100px;top:12px;pointer-events:auto;display:flex;flex-direction:column;align-items:center;color:var(--haldi)}
.tb-logo b{font-family:"Yatra One",Georgia,serif;font-weight:400;font-size:30px;line-height:1;letter-spacing:.03em}
.tb-logo small{font-family:Mukta,sans-serif;font-weight:700;font-size:8px;letter-spacing:.42em;margin-top:1px;color:var(--cream)}
.tb-buy{position:absolute;right:22px;top:14px;pointer-events:auto;background:var(--haldi);color:var(--night-2) !important;
  font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;padding:9px 22px 7px;border-radius:999px;transition:background .2s,color .2s}
.tb-buy:hover{background:var(--cream)}

.tb-stage{position:relative}
.tb-track{position:absolute;left:0;right:0;top:0;height:400vh;z-index:5;pointer-events:none}
.tb-sticky{position:sticky;top:0;height:var(--h);overflow:visible}
.tb-bottle{position:absolute;left:calc(32px + 50%);top:50%;height:min(calc(var(--h) * .78),760px,50vw);aspect-ratio:var(--ar,.267);translate:-50% -50%;will-change:transform}
/* backlight: an amber lamp glow behind the glass, like a bottle held up to a window in the rain */
.tb-bottle::before{content:"";position:absolute;left:50%;top:52%;width:330%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;
  background:radial-gradient(closest-side,rgba(242,169,29,.36),rgba(242,169,29,.12) 45%,transparent 72%)}
.tb-bottle-spin{position:relative;width:100%;height:100%;will-change:transform}
.tb-bottle img{filter:drop-shadow(18px 26px 24px rgba(0,0,0,.55))}
.tb-bottle img,.tb-static img{width:100%;height:100%;object-fit:contain}
.tb-root .tb-static{display:none}

.tb-sec{position:relative;z-index:1;padding-left:64px}
.tb-in{position:relative;margin:0 auto;padding:0 44px;max-width:1240px}

/* hero */
.tb-hero{height:calc(var(--h) * .79);min-height:520px}
.tb-head{position:absolute;inset:0 0 0 64px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:4vh;margin:0}
.tb-head span{display:block;font-size:min(12.4vw,calc(var(--h) * .25),214px);white-space:nowrap;color:var(--cream)}
.tb-head span+span{color:var(--haldi);margin-top:.04em}
.tb-seal{position:absolute;left:calc(64px + (100% - 64px) * .2);top:calc(var(--h) * .12);width:min(8.5vw,108px);aspect-ratio:1;color:var(--cream);z-index:2}
.tb-hero .tb-static{position:absolute;left:calc(32px + 50%);top:47%;height:min(calc(var(--h) * .62),46vw);translate:-50% -50%;rotate:var(--tilt);z-index:3;filter:drop-shadow(0 0 46px rgba(242,169,29,.32)) drop-shadow(16px 22px 20px rgba(0,0,0,.55))}

/* details */
.tb-details{padding-top:0;padding-bottom:calc(var(--h) * .2)}
.tb-details .tb-in{display:grid;grid-template-columns:1fr minmax(180px,22%) minmax(280px,27%);gap:4vw;align-items:start}
.tb-kick{font-size:24px;line-height:1;margin:0 0 18px}
.tb-name{font-size:min(6.4vw,80px);line-height:.95;margin:0}
.tb-intro{font-size:16px;line-height:1.55;max-width:340px;margin:22px 0 0;color:rgba(239,229,207,.86)}
.tb-btn{display:inline-block;margin-top:26px;background:var(--cream);color:var(--night-2) !important;font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;padding:10px 26px 8px;border-radius:999px;transition:background .2s}
.tb-btn:hover{background:var(--haldi)}
.tb-box{grid-column:3;border:1px solid var(--rule);border-radius:22px;padding:38px 38px 34px;display:grid;gap:28px;background:rgba(11,17,21,.55)}
.tb-stat h3{font-weight:800;font-size:12px;letter-spacing:.22em;margin:0;color:var(--haldi)}
.tb-stat p.s{font-size:11.5px;margin:0 0 6px;color:var(--mist)}
.tb-stat .r{border-top:1px solid var(--rule);padding-top:10px;display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:start}
.tb-num{font-size:40px;line-height:.95}
.tb-num small{font-size:.6em}
.tb-stat .n{font-size:12.5px;line-height:1.4;color:rgba(239,229,207,.8)}
.tb-stat .n a{font-weight:700;text-decoration:underline;text-transform:uppercase;font-size:10.5px;letter-spacing:.06em;margin-left:4px;color:var(--cream)}

/* mouthfeel */
.tb-feel{padding-bottom:calc(var(--h) * .22)}
.tb-word{display:block;text-align:center;color:var(--haldi);font-size:min(16vw,270px);white-space:nowrap;line-height:.9;will-change:transform}
.tb-feel .tb-in{display:grid;grid-template-columns:30% 1fr 31%;gap:3vw;margin-top:calc(var(--h) * .055);align-items:start}
.tb-video{position:relative;display:block;aspect-ratio:16/9;overflow:hidden;background:#0b1115;border-radius:16px}
.tb-video img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.tb-video:hover img{transform:scale(1.04)}
.tb-play{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:var(--haldi);display:grid;place-items:center;transition:transform .25s}
.tb-play path{fill:var(--night-2)}
.tb-video:hover .tb-play{transform:scale(1.12)}
.tb-cap{font-size:19px;line-height:1.15;margin:10px 0 0}
.tb-taste{grid-column:3;font-size:18px;line-height:1.38;font-weight:500;margin:0}
.tb-style-h{grid-column:3;font-size:26px;margin:22px 0 -8px;color:var(--haldi)}
.tb-style{grid-column:3;font-size:14px;line-height:1.55;margin:0;color:rgba(239,229,207,.78)}

/* flavours */
.tb-flav{height:calc(var(--h) * 1.35);min-height:820px}
.tb-splat{position:absolute;aspect-ratio:1;display:grid;place-items:center;text-align:center;color:var(--cream)}
.tb-splat[data-tone="haldi"]{color:var(--night-2)}
.tb-splat svg.blob{position:absolute;left:-36%;top:-36%;width:172%;aspect-ratio:1;overflow:visible}
.tb-splat .tx{position:relative;width:80%}
.tb-splat .ic{width:22px;height:22px;margin:0 auto 6px}
.tb-splat h4{font-family:"Yatra One",Georgia,serif;font-weight:400;font-size:17px;line-height:1.05;margin:0;padding-bottom:6px;border-bottom:1px solid currentColor;display:inline-block}
.tb-splat p{font-size:12.5px;line-height:1.38;margin:8px 0 0}
.tb-s0{left:calc(64px + (100% - 64px) * .1);top:3%;width:min(17vw,215px)}
.tb-s1{left:calc(64px + (100% - 64px) * .26);top:30%;width:min(17vw,215px)}
.tb-s2{right:calc((100% - 64px) * .07);top:21%;width:min(21vw,270px)}
.tb-glass{position:absolute;left:calc(64px + (100% - 64px) * .04);top:50%;width:min(23vw,330px);rotate:-14deg;filter:drop-shadow(26px 30px 26px rgba(0,0,0,.55));z-index:1}

/* line-up */
.tb-line{padding-top:4vh;padding-bottom:calc(var(--h) * .16);text-align:center}
.tb-avk{font-size:24px;line-height:1;margin:0}
.tb-avh{font-size:min(6.6vw,80px);margin:6px 0 0}
.tb-packs{display:flex;justify-content:center;align-items:flex-end;gap:min(6vw,86px);margin:calc(var(--h) * .02) 0 0;height:min(calc(var(--h) * .44),32vw)}
.tb-pack{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.tb-pack .im{height:calc(100% - 50px);display:flex;align-items:flex-end;justify-content:center}
.tb-pack img{height:var(--s);width:auto;filter:drop-shadow(10px 16px 14px rgba(0,0,0,.55))}
.tb-pack .slot{height:var(--s);aspect-ratio:var(--ar,.267)}
.tb-pack .slot .tb-static{width:100%;height:100%}
.tb-pack .lb{height:50px;padding-top:12px;font-size:13px;line-height:1.25;color:rgba(239,229,207,.8)}
.tb-pack .lb b{display:block;font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.1em;color:var(--haldi)}

/* recipe */
.tb-recipe{padding-bottom:calc(var(--h) * .18)}
.tb-recipe .tb-in{display:grid;grid-template-columns:62% 1fr;gap:5vw;align-items:center}
.tb-photo{aspect-ratio:3/2;overflow:hidden;background:#0b1115;border-radius:22px}
.tb-photo img{width:100%;height:110%;object-fit:cover;will-change:transform}
.tb-rk{font-size:23px;margin:0}
.tb-rt{font-size:min(4vw,52px);line-height:1;margin:12px 0 0;text-transform:uppercase}
.tb-rb{font-size:14.5px;line-height:1.55;margin:18px 0 0;max-width:300px;color:rgba(239,229,207,.8)}

/* footer */
.tb-foot{position:relative;z-index:1;background:var(--night-2);padding:56px 0 34px 64px;border-top:1px solid rgba(239,229,207,.12)}
.tb-foot .tb-in{display:flex;flex-wrap:wrap;gap:28px 64px;align-items:flex-end;justify-content:space-between}
.tb-foot .w{font-family:"Yatra One",Georgia,serif;font-size:min(10vw,130px);line-height:.95;color:var(--haldi)}
.tb-foot ul{list-style:none;margin:0;padding:0;font-size:15px;line-height:1.7;color:rgba(239,229,207,.8)}
.tb-foot .lg{flex-basis:100%;border-top:1px solid rgba(239,229,207,.14);padding-top:16px;margin:0;font-size:12px;color:var(--mist);letter-spacing:.04em}

@media (max-width:900px){
  .tb-rail::before,.tb-rail::after{display:none}
  .tb-rail{height:58px;width:100%;background:rgba(11,17,21,.92);pointer-events:auto;border-bottom:1px solid var(--rule)}
  .tb-icon:nth-child(2){display:none}
  .tb-icon{top:17px !important}
  .tb-root .tb-logo{left:52px;top:9px}
  .tb-logo b{font-size:25px}
  .tb-buy{right:14px;top:13px;padding:7px 14px 5px;font-size:12px}
  .tb-sec,.tb-foot{padding-left:0}
  .tb-in{padding:0 20px}
  .tb-hero{height:auto;min-height:0;padding:100px 0 30px}
  .tb-head{position:relative;inset:auto;padding:0}
  .tb-head span{font-size:min(11.6vw,96px)}
  .tb-seal{left:auto;right:6%;top:auto;bottom:28%;width:78px}
  .tb-hero .tb-static{position:relative;left:auto;top:auto;translate:none;margin:6px auto 0;height:min(100vw,460px)}
  .tb-details .tb-in,.tb-feel .tb-in,.tb-recipe .tb-in{grid-template-columns:1fr;gap:30px}
  .tb-box,.tb-taste,.tb-style-h,.tb-style{grid-column:auto}
  .tb-details{padding-top:48px;padding-bottom:70px}
  .tb-name{font-size:min(13vw,72px)}
  .tb-box{padding:28px 22px}
  .tb-word{font-size:17vw}
  .tb-feel{padding-bottom:70px}
  .tb-flav{height:auto;min-height:0;display:grid;gap:110px;padding:90px 0 70px;justify-items:center}
  .tb-splat{position:relative;left:auto !important;right:auto !important;top:auto !important;width:min(58vw,330px)}
  .tb-glass{position:relative;left:auto;top:auto;width:min(50vw,330px);margin-top:-10px}
  .tb-packs{gap:2.5vw;height:min(58vw,440px);padding:0 6px}
  .tb-pack .lb{font-size:10px;height:56px}
  .tb-pack .lb b{font-size:8.5px;letter-spacing:.04em}
  .tb-pack .im{height:calc(100% - 56px)}
  .tb-rt{font-size:34px}
  .tb-foot{padding:44px 0 28px}
}
@media (max-width:900px),(prefers-reduced-motion: reduce){
  .tb-track{display:none}
  .tb-root .tb-static{display:block}
}
@media (prefers-reduced-motion: reduce){
  .tb-rain{animation:none}
  .tb-video img,.tb-play,.tb-buy,.tb-btn{transition:none}
}
`

// #region splat
/** Seeded PRNG so every splat keeps its shape between renders. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * An ink splat in a 200 × 200 box: a lumpy disc with thin pointed drips and
 * loose droplets. Returns one path (the blob) and the droplets as circles.
 */
export function splatShape(seed: number, drips = 8) {
  const r = rng(seed)
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28]
  // Most tongues run down (gravity), a few splash sideways.
  const spikes = Array.from({ length: drips }, (_, i) => {
    const down = i < drips * 0.6
    const a = down ? Math.PI / 2 + (r() - 0.5) * 2.2 : r() * Math.PI * 2
    return { a, len: (down ? 16 : 8) + r() * (down ? 34 : 16), w: 0.03 + r() * 0.045 }
  })
  const N = 260
  const pts: [number, number][] = []
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2
    let rad = 58 * (1 + 0.09 * Math.sin(2 * a + ph[0]) + 0.06 * Math.sin(3 * a + ph[1]) + 0.035 * Math.sin(7 * a + ph[2]) + 0.02 * Math.sin(13 * a + ph[3]))
    for (const s of spikes) {
      let d = Math.abs(a - s.a)
      d = Math.min(d, Math.PI * 2 - d)
      rad += s.len * Math.exp(-((d / s.w) ** 2))
    }
    pts.push([100 + Math.cos(a) * rad, 100 + Math.sin(a) * rad])
  }
  const d = "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z"
  const drops = spikes
    .filter((_, i) => i % 2 === 0)
    .map((s) => {
      const dist = 58 + s.len + 5 + r() * 10
      return { cx: 100 + Math.cos(s.a) * dist, cy: 100 + Math.sin(s.a) * dist, r: 1.4 + r() * 3 }
    })
  return { d, drops }
}
// #endregion splat

function Icon({ kind }: { kind: CbFlavour["icon"] }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  if (kind === "citrus")
    return (
      <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" {...p} />
        <circle cx="12" cy="12" r="6.5" {...p} strokeWidth={1} />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line key={a} x1="12" y1="12" x2={12 + 6.5 * Math.cos((a * Math.PI) / 180)} y2={12 + 6.5 * Math.sin((a * Math.PI) / 180)} {...p} strokeWidth={1} />
        ))}
      </svg>
    )
  if (kind === "leaf")
    return (
      <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21V9M12 13c-4-1-6-4-6-8 4 0 6 3 6 8zM12 11c4-1 6-4 6-8-4 0-6 3-6 8zM12 17c-3-.5-5-2.5-5.5-5.5 3 .3 5 2.3 5.5 5.5zM12 15c3-.5 5-2.5 5.5-5.5-3 .3-5 2.3-5.5 5.5z" {...p} />
      </svg>
    )
  return (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 21c-2-3 2-5 0-8s1-5 0-8M12 21c-2-3 2-5 0-8s1-5 0-8M17 21c-2-3 2-5 0-8s1-5 0-8" {...p} />
    </svg>
  )
}

function Splat({ f, i, seed }: { f: CbFlavour; i: number; seed: number }) {
  const { d, drops } = React.useMemo(() => splatShape(seed), [seed])
  const fill = "var(--" + f.tone + ")"
  return (
    <div className={"tb-splat tb-s" + i} data-splat="" data-tone={f.tone}>
      <svg className="blob" viewBox="0 0 200 200" aria-hidden="true">
        <path d={d} fill={fill} />
        {drops.map((c, k) => (
          <circle key={k} cx={c.cx} cy={c.cy} r={c.r} fill={fill} />
        ))}
      </svg>
      <div className="tx">
        <Icon kind={f.icon} />
        <h4>{f.title}</h4>
        <p>{f.body}</p>
      </div>
    </div>
  )
}

function Seal({ text }: { text: string }) {
  const id = React.useId().replace(/:/g, "")
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id={id} d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1 -90 0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="var(--night)" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="60" cy="60" r="53" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="60" cy="60" r="35" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text fontFamily="Mukta, sans-serif" fontWeight={800} fontSize="10.2" letterSpacing="2" fill="currentColor">
        <textPath href={"#" + id} startOffset="0">
          {text}
        </textPath>
      </text>
      {/* storm cloud with a bolt */}
      <path d="M41 63c-5 0-8-3-8-7s3-7 7-7c1-6 6-10 12-10 5 0 9 3 11 7 1-1 3-1 4-1 5 0 9 4 9 9 0 5-4 9-9 9z" fill="var(--mist)" stroke="currentColor" strokeWidth="1.6" />
      <path d="M58 60l-7 13h7l-4 12 12-16h-7l4-9z" fill="var(--haldi)" />
    </svg>
  )
}

export default function CraftBeerProductTemplate({
  brand = "Toofan",
  brandSub = "Brewing Co.",
  buyLabel = "Buy beer",
  buyHref = "#buy",
  headline = ["Monsoon", "Season IPA"],
  sealText = "TOOFAN BREWING CO. · PUNE · EST. 2014 · ",
  kicker = "Monsoon season",
  title = ["India", "Pale Ale"],
  intro = "Toofan IPA was our first monsoon brew, poured in 2014 in a Pune garage that leaked every time it rained. Malt and hops pull against each other until it all balances out on your tongue, so the second one is as good as the first. Big on aroma with a hoppy, jaggery-sweet finish. Brewed with nine hops and four malts, for whatever weather you're having.",
  ctaLabel = "Buy now",
  ctaHref = "#buy",
  stats = DEFAULT_STATS,
  feelWord = "Chatkara",
  videoPoster,
  videoHref = "#video",
  videoCaption = ["Hear it from our brewmaster", "Ananya Rao"],
  tasting = "A well-rounded, seriously drinkable IPA built on Citra and Cascade hops and rounded out with a little Nagpur orange peel. Clean citrus up front, jaggery caramel in the middle and a sharp, dry hop finish. Light amber body, a long-lasting head and a nose like the first rain on hot tarmac. Pairs with chilli chicken, bad weather and old film songs on low volume.",
  styleTitle = "Style",
  style = [
    "An India Pale Ale brewed in India feels like a homecoming, and we take the name personally. We've been called easy (to drink). We've been called loud. Don't let the names others call us limit your perception: we brew Toofan IPA all year as a friendly, balanced beer that's great for IPA beginners and lifelong hopheads.",
    "Chatkara is the smack of the lips after something good. That's the whole brief.",
  ],
  flavours = DEFAULT_FLAVOURS,
  availabilityKicker = "Availability:",
  availability = "Year round",
  packs = DEFAULT_PACKS,
  recipeKicker = "Recipes",
  recipeTitle = ["Cold pint.", "Hot", "chilli."],
  recipeBody = "Our taproom's chilli chicken with buttered pav and masala peanuts, and why a hoppy IPA puts out the fire it starts. Recipe, pairing notes and the playlist.",
  recipeCta = "Read more",
  recipeHref = "#recipes",
  recipeImage,
  recipeImageAlt = "Chilli chicken, buttered pav and masala peanuts beside a glass of IPA",
  bottle,
  bottleAlt = "A bottle of Toofan India Pale Ale",
  glass,
  footerLines = ["Taproom: Lane 7, Koregaon Park, Pune", "Brewed monsoon to monsoon since 2014", "hello@toofan.example"],
  legal = "Please drink responsibly. For adults of legal drinking age only.",
  tilt = 24,
  height = "100svh",
  fontHref = FONTS,
  className,
}: CraftBeerProductTemplateProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const ar = 0.267

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const q = gsap.utils.selector(root)
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      // Desktop with motion: the bottle travels on the sticky layer.
      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        const stage = q(".tb-stage")[0] as HTMLElement
        const track = q(".tb-track")[0] as HTMLElement
        const bot = q(".tb-bottle")[0] as HTMLElement
        const spin = q(".tb-bottle-spin")[0] as HTMLElement
        const slot = q("[data-slot]")[0] as HTMLElement | undefined
        if (!stage || !track || !bot || !spin) return
        // Every layout read below runs at init/resize/refresh only (refreshInit,
        // start/end functions, onRefreshInit), never per frame; the scrubbed
        // tweens only write transforms from the cached numbers.
        const vh = () => (q(".tb-sticky")[0] as HTMLElement).offsetHeight
        // Layout offsets inside the stage. offsetTop/Left ignore transforms, so the
        // line-up's entrance tween can't skew the landing.
        const inStage = (el: HTMLElement) => {
          let x = 0
          let y = 0
          for (let n: HTMLElement | null = el; n && n !== stage; n = n.offsetParent as HTMLElement | null) {
            x += n.offsetLeft
            y += n.offsetTop
          }
          return { x, y }
        }
        const docTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY
        const LAND = 0.84 // where the slot's foot sits in the viewport when the bottle lands
        // The track ends so that the sticky layer lets go exactly when the slot reaches LAND.
        const fit = () => {
          if (!slot) return
          const foot = inStage(slot).y + slot.offsetHeight
          track.style.height = foot + vh() * (1 - LAND) + "px"
        }
        fit()
        ScrollTrigger.addEventListener("refreshInit", fit)

        gsap.set(spin, { rotation: tilt })
        gsap.to(spin, {
          rotation: 0,
          ease: "none",
          scrollTrigger: { trigger: stage, start: "top top", end: () => "+=" + vh() * 0.75, scrub: 0.6, invalidateOnRefresh: true },
        })

        if (slot) {
          // Geometry of the landing, measured at refresh time in viewport space.
          const land = () => {
            const H = vh()
            const bh = bot.offsetHeight
            const s = slot.offsetHeight / bh
            // The bottle's box is centred on its offsetLeft (CSS translate -50%).
            return { s, x: inStage(slot).x + slot.offsetWidth / 2 - bot.offsetLeft, y: LAND * H - H / 2 - (s * bh) / 2 }
          }
          let g = land()
          const release = () => docTop(stage) + track.offsetHeight - vh()
          gsap.fromTo(
            bot,
            { x: 0, y: 0, scale: 1 },
            {
              x: () => g.x,
              y: () => g.y,
              scale: () => g.s,
              ease: "power1.inOut",
              immediateRender: false,
              scrollTrigger: {
                start: () => release() - vh() * 0.8,
                end: () => release(),
                scrub: 0.5,
                invalidateOnRefresh: true,
                onRefreshInit: () => {
                  gsap.set(bot, { x: 0, y: 0, scale: 1 })
                  g = land()
                },
              },
            },
          )
        }
        return () => ScrollTrigger.removeEventListener("refreshInit", fit)
      })

      // Phones with motion: the hero bottle stands up as the hero scrolls away.
      mm.add("(max-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        const hb = q(".tb-hero .tb-static")[0]
        if (hb) gsap.fromTo(hb, { rotate: tilt }, { rotate: 0, ease: "none", scrollTrigger: { trigger: hb, start: "top 30%", end: "bottom top", scrub: 0.6 } })
      })

      // Everything else, any width, motion allowed.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const seal = q(".tb-seal")[0]
        if (seal) gsap.to(seal, { rotation: 200, ease: "none", scrollTrigger: { trigger: ".tb-hero", start: "top top", end: "bottom top", scrub: true } })

        const rise = (targets: Element[], trigger: Element, stagger = 0.08) =>
          gsap.from(targets, { y: 46, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger, scrollTrigger: { trigger, start: "top 82%", once: true } })
        const det = q(".tb-details")[0]
        if (det) rise(q(".tb-details [data-rise]"), det)
        const feel = q(".tb-feel .tb-in")[0]
        if (feel) rise(q(".tb-feel [data-rise]"), feel)

        const word = q(".tb-word")[0]
        if (word) gsap.fromTo(word, { xPercent: 7 }, { xPercent: -5, ease: "none", scrollTrigger: { trigger: word, start: "top bottom", end: "bottom top", scrub: true } })

        q("[data-splat]").forEach((s, i) => {
          gsap.fromTo(
            s,
            { scale: 0.55, rotation: i % 2 ? 14 : -12, autoAlpha: 0 },
            { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.75, ease: "back.out(1.9)", scrollTrigger: { trigger: s, start: "top 84%", toggleActions: "play none none reverse" } },
          )
        })
        const gl = q(".tb-glass")[0]
        if (gl)
          gsap.fromTo(
            gl,
            { yPercent: 40, xPercent: -30, rotate: -30 },
            { yPercent: -6, xPercent: 0, rotate: -14, ease: "none", scrollTrigger: { trigger: gl, start: "top bottom", end: "center 45%", scrub: 0.6 } },
          )

        const packs = q(".tb-pack")
        if (packs.length) gsap.from(packs, { y: 60, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.07, scrollTrigger: { trigger: ".tb-packs", start: "top 88%", once: true } })

        const ph = q(".tb-photo")[0]
        if (ph) {
          gsap.fromTo(ph, { clipPath: "inset(14% 10% 14% 10%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ph, start: "top 92%", end: "top 35%", scrub: 0.5 } })
          const im = ph.querySelector("img")
          if (im) gsap.fromTo(im, { yPercent: -9 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ph, start: "top bottom", end: "bottom top", scrub: true } })
        }
        const rc = q(".tb-recipe [data-rise]")
        if (rc.length) rise(rc, q(".tb-recipe")[0])
      })
    }, root)

    // Late font and image loads move everything; measure again once they settle.
    let raf = 0
    const refresh = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    }
    document.fonts?.ready.then(refresh)
    root.querySelectorAll("img").forEach((im) => {
      if (!im.complete) im.addEventListener("load", refresh, { once: true })
    })
    return () => {
      cancelAnimationFrame(raf)
      mm.revert()
      ctx.revert()
    }
  }, [tilt])

  const tallest = Math.max(...packs.map((p) => p.scale ?? 1))

  return (
    <div ref={rootRef} className={"tb-root" + (className ? " " + className : "")} style={{ "--h": height, "--ar": ar, "--tilt": tilt + "deg" } as React.CSSProperties}>
      <style>{CSS}</style>
      <div className="tb-rain" aria-hidden="true" />
      {fontHref && <link rel="stylesheet" href={fontHref} />}

      <header className="tb-bar">
        <div className="tb-rail">
          <button className="tb-icon" style={{ top: 22 }} aria-label="Menu">
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </button>
          <button className="tb-icon" style={{ top: 64 }} aria-label="Search">
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="7.6" cy="7.6" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path d="M11.5 11.5l4.5 4.5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </button>
        </div>
        <a className="tb-logo" href="#top" aria-label={brand + " " + brandSub}>
          <b>{brand.toUpperCase()}</b>
          <small>{brandSub.toUpperCase()}</small>
        </a>
        <a className="tb-buy" href={buyHref}>
          {buyLabel}
        </a>
      </header>

      <div className="tb-stage">
        {bottle && (
          <div className="tb-track" aria-hidden="true">
            <div className="tb-sticky">
              <div className="tb-bottle">
                <div className="tb-bottle-spin">
                  <img src={bottle} alt="" draggable={false} />
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="tb-sec tb-hero" id="top">
          <h1 className="tb-head tb-stamp" aria-label={headline.join(" ")}>
            <span aria-hidden="true">
              {headline[0]}
            </span>
            <span aria-hidden="true">
              {headline[1]}
            </span>
          </h1>
          <div className="tb-seal">
            <Seal text={sealText} />
          </div>
          {bottle && <img className="tb-static" src={bottle} alt={bottleAlt} style={{ aspectRatio: ar }} />}
        </section>

        <section className="tb-sec tb-details">
          <div className="tb-in">
            <div>
              <p className="tb-kick tb-script" data-rise="">
                {kicker}
              </p>
              <h2 className="tb-name tb-stamp" data-rise="">
                {title[0]}
                <br />
                {title[1]}
              </h2>
              <p className="tb-intro" data-rise="">
                {intro}
              </p>
              <a className="tb-btn" href={ctaHref} data-rise="">
                {ctaLabel}
              </a>
            </div>
            <div className="tb-box" data-rise="">
              {stats.map((s) => (
                <div className="tb-stat" key={s.label}>
                  <h3>{s.label}</h3>
                  <p className="s">{s.sub}</p>
                  <div className="r">
                    <span className="tb-num tb-stamp">
                      {s.value}
                      {s.unit && <small>{s.unit}</small>}
                    </span>
                    <span className="n">
                      {s.note}
                      <a href={s.href ?? "#" + s.label.toLowerCase()}>Read more</a>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="tb-sec tb-feel">
          <span className="tb-word tb-stamp">
            {feelWord}
          </span>
          <div className="tb-in">
            <div data-rise="">
              <a className="tb-video" href={videoHref} aria-label={"Play: " + videoCaption.join(" ")}>
                {videoPoster && <img src={videoPoster} alt="" loading="lazy" />}
                <span className="tb-play" aria-hidden="true">
                  <svg width="14" height="16" viewBox="0 0 14 16">
                    <path d="M1 1l12 7-12 7z" />
                  </svg>
                </span>
              </a>
              <p className="tb-cap tb-script">
                {videoCaption[0]}
                <br />
                {videoCaption[1]}
              </p>
            </div>
            <p className="tb-taste" data-rise="">
              {tasting}
            </p>
            <h3 className="tb-style-h tb-stamp" data-rise="">
              {styleTitle}
            </h3>
            {style.map((p, i) => (
              <p className="tb-style" key={i} data-rise="">
                {p}
              </p>
            ))}
          </div>
        </section>

        <section className="tb-sec tb-flav" aria-label="Flavour notes">
          {flavours.slice(0, 3).map((f, i) => (
            <Splat key={f.title} f={f} i={i} seed={11 + i * 37} />
          ))}
          {glass && <img className="tb-glass" src={glass} alt="A full glass of the IPA" loading="lazy" />}
        </section>

        <section className="tb-sec tb-line">
          <div className="tb-in">
            <p className="tb-avk tb-script">{availabilityKicker}</p>
            <h2 className="tb-avh tb-stamp">
              {availability}
            </h2>
            <ul className="tb-packs" style={{ listStyle: "none", padding: 0 }}>
              {packs.map((p) => {
                const s = ((p.scale ?? 1) / tallest) * 100 + "%"
                return (
                  <li className="tb-pack" key={p.label}>
                    <div className="im">
                      {p.slot ? (
                        <div className="slot" data-slot="" style={{ "--s": s, height: s } as React.CSSProperties}>
                          {bottle && <img className="tb-static" src={bottle} alt={bottleAlt} />}
                        </div>
                      ) : p.src ? (
                        <img src={p.src} alt={p.alt ?? p.label} loading="lazy" style={{ "--s": s } as React.CSSProperties} />
                      ) : null}
                    </div>
                    <div className="lb">
                      {p.label}
                      {p.detail && <b>{p.detail}</b>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      </div>

      <section className="tb-sec tb-recipe" id="recipes">
        <div className="tb-in">
          <div className="tb-photo">{recipeImage && <img src={recipeImage} alt={recipeImageAlt} loading="lazy" />}</div>
          <div>
            <p className="tb-rk tb-script" data-rise="">
              {recipeKicker}
            </p>
            <h2 className="tb-rt tb-wide" data-rise="">
              {recipeTitle.map((l, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {l}
                </React.Fragment>
              ))}
            </h2>
            <p className="tb-rb" data-rise="">
              {recipeBody}
            </p>
            <a className="tb-btn" href={recipeHref} data-rise="">
              {recipeCta}
            </a>
          </div>
        </div>
      </section>

      <footer className="tb-foot">
        <div className="tb-in">
          <div className="w">{brand.toUpperCase()}</div>
          <ul>
            {footerLines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="lg">{legal}</p>
        </div>
      </footer>
    </div>
  )
}
