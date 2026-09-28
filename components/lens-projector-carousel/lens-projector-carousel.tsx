"use client"

import * as React from "react"

/**
 * Lens Projector Carousel — a camcorder on the left throws each card across
 * the page as a cone of light. Change slides and the next card develops out of
 * the lens, growing to fill the beam while the last one is flung at the
 * audience. Go back and the old card is sucked into the lens instead.
 *
 * Everything is drawn here: the camera is inline SVG, the paper is CSS noise,
 * the beam is one clip-path. React is the only import, no image files, no
 * network. The scene is a fixed sepia print, so it reads the same in a dark
 * theme and takes its colours from the `ink` and `paper` props, not tokens.
 */

export type ProjectorItem = {
  /** Image URL. Data URLs and same-origin files are safest. */
  src: string
  /** Script heading in the corner for this slide. Falls back to the `heading` prop. */
  heading?: string
  /** Big condensed headline under the beam. */
  title?: string
  /** Small paragraph under the headline. */
  note?: string
  /** Pencil annotation floating above the beam. */
  label?: string
  alt?: string
}

export type LensProjectorCarouselProps = {
  items: ProjectorItem[]
  /** Default script heading in the corner. Empty string hides it. A slide's own `heading` wins. */
  heading?: string
  /** Text on the camera's badge plate. */
  cameraLabel?: string
  /** Total height. **Must be a definite length.** */
  height?: string
  /** Milliseconds between slides. 0 (default) is off. */
  autoplay?: number
  /** Wrap past the ends. */
  loop?: boolean
  /** Colour of the heading, headline and beam guides. */
  ink?: string
  /** Colour of the paper. */
  paper?: string
  /** Controlled index. Omit for uncontrolled. */
  index?: number
  defaultIndex?: number
  onIndexChange?: (index: number) => void
  className?: string
}

// #region deck
/** Horizontal travel, in px, before a drag counts as a swipe. */
export const SWIPE_PX = 48

export function wrapIndex(i: number, n: number, loop: boolean): number {
  if (n <= 0) return 0
  return loop ? ((i % n) + n) % n : Math.min(Math.max(i, 0), n - 1)
}

/** Which way a jump reads: +1 forward, -1 back, taking the short way round. */
export function stepDirection(from: number, to: number, n: number): number {
  if (n <= 1) return 1
  const fwd = (((to - from) % n) + n) % n
  return fwd <= n / 2 ? 1 : -1
}

/** A drag of dx pixels: +1 next, -1 previous, 0 too short to count. */
export function swipeStep(dx: number): number {
  return Math.abs(dx) < SWIPE_PX ? 0 : dx < 0 ? 1 : -1
}
// #endregion

const NOISE = (freq: string, octaves: number, matrix: string) =>
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='" +
  freq +
  "' numOctaves='" +
  octaves +
  "' stitchTiles='stitch'/%3E%3CfeColorMatrix values='" +
  matrix +
  "'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

const GRAIN = NOISE(".85", 3, "0 0 0 0 .25 0 0 0 0 .17 0 0 0 0 .08 0 0 0 .5 0")
const MOTTLE = NOISE(".012", 4, "0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .1 0 0 0 .34 0")

const CSS = [
  ".lp-root{position:relative;width:100%;overflow:hidden;isolation:isolate;outline:none;",
  "background:var(--lp-paper);color:var(--lp-ink);font-family:'Avenir Next','Century Gothic','Trebuchet MS',Verdana,sans-serif}",
  ".lp-root:focus-visible{box-shadow:inset 0 0 0 2px var(--lp-ink)}",
  ".lp-stage{position:absolute;inset:0;container-type:size}",
  ".lp-scene{position:absolute;inset:0;--lp-cam:min(40cqh,30cqw);--lp-r:1.8;--lp-crop:.12;--lp-w:calc(var(--lp-cam)*(1.37 - var(--lp-crop)));--lp-top:10cqh;--lp-a:calc(100% * .15 / var(--lp-r))}",
  ".lp-paper{position:absolute;inset:0;z-index:0;background-image:radial-gradient(ellipse at 28% 26%,rgba(255,250,232,.55),transparent 62%),",
  "radial-gradient(ellipse at 90% 8%,rgba(120,84,30,.18),transparent 45%)," + MOTTLE + "," + GRAIN + ";background-size:auto,auto,320px 320px,320px 320px}",
  ".lp-burn{position:absolute;inset:0;z-index:6;pointer-events:none;background:",
  "radial-gradient(ellipse 34% 15% at 6% 106%,rgba(14,9,6,.92),transparent 72%),",
  "radial-gradient(ellipse 46% 26% at 90% 108%,rgba(14,9,6,.96),transparent 74%),",
  "radial-gradient(ellipse 12% 18% at 102% 66%,rgba(14,9,6,.8),transparent 74%),",
  "radial-gradient(ellipse 30% 9% at 60% 103%,rgba(14,9,6,.6),transparent 72%),",
  "radial-gradient(ellipse 22% 8% at 2% -4%,rgba(14,9,6,.7),transparent 72%),",
  "radial-gradient(ellipse at center,transparent 62%,rgba(60,38,12,.28))}",

  ".lp-heading{animation:lp-rise .6s ease-out both;position:absolute;z-index:3;left:3cqw;top:4cqh;margin:0;font:italic 500 clamp(34px,8.4cqh,84px)/1 'Snell Roundhand','Apple Chancery','Lucida Calligraphy','URW Chancery L','Palatino Linotype',Georgia,serif;",
  "letter-spacing:.01em;color:var(--lp-ink);text-shadow:0 1px 0 rgba(255,246,220,.45)}",

  ".lp-rig{position:absolute;z-index:2;left:0;right:0;top:var(--lp-top);height:calc(var(--lp-cam)*var(--lp-r));display:flex;align-items:center}",
  ".lp-camwrap{position:relative;flex:none;isolation:isolate;width:calc(var(--lp-cam)*1.4);height:var(--lp-cam);margin-left:calc(var(--lp-cam)*var(--lp-crop)*-1)}",
  ".lp-camwrap::after{content:'';position:absolute;z-index:-1;left:6%;right:-8%;bottom:-9%;height:14%;background:radial-gradient(closest-side,rgba(38,22,6,.5),transparent)}",
  ".lp-cam{display:block;width:100%;height:100%;overflow:visible}",
  ".lp-cam-kick{animation:lp-kick .7s cubic-bezier(.2,.9,.3,1)}",
  ".lp-rec{animation:lp-blink 1.6s steps(1) infinite}",
  ".lp-glow{transform-box:fill-box;transform-origin:center;animation:lp-breathe 2.6s ease-in-out infinite}",

  ".lp-beamwrap{position:relative;flex:1;min-width:0;height:100%;margin-left:calc(var(--lp-cam)*-.03)}",
  ".lp-halo{position:absolute;left:-4%;top:22%;width:60%;height:56%;background:radial-gradient(closest-side,rgba(255,226,160,.55),transparent);filter:blur(14px);pointer-events:none}",
  ".lp-beam{position:absolute;inset:0;overflow:hidden;clip-path:polygon(0 calc(50% - var(--lp-a)),100% 0,100% 100%,0 calc(50% + var(--lp-a)));cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none;background:#2a1a12}",
  ".lp-beam:active{cursor:grabbing}",
  ".lp-guides{position:absolute;inset:0;pointer-events:none;background:rgba(70,48,16,.6);clip-path:polygon(0 calc(50% - var(--lp-a) - 2px),100% -2px,100% calc(100% + 2px),0 calc(50% + var(--lp-a) + 2px))}",
  ".lp-count{position:absolute;z-index:3;right:4cqw;top:5cqh;margin:0;font-size:clamp(11px,1.9cqh,15px);letter-spacing:.22em;text-transform:uppercase;color:var(--lp-ink);animation:lp-rise .6s ease-out both}",
  ".lp-count i{font-style:normal;opacity:.45}",
  ".lp-card{position:absolute;inset:0;transform-origin:0 50%}",
  ".lp-card img{position:absolute;inset:0;display:block;width:100%;height:100%;max-width:none;object-fit:cover;pointer-events:none;-webkit-user-drag:none}",
  ".lp-fwd .lp-card-in{z-index:2;animation:lp-emerge .95s cubic-bezier(.16,.84,.3,1) both}",
  ".lp-fwd .lp-card-out{z-index:1;animation:lp-fling .8s cubic-bezier(.5,0,.75,.2) both}",
  ".lp-bwd .lp-card-in{z-index:1;animation:lp-return .95s cubic-bezier(.16,.84,.3,1) both}",
  ".lp-bwd .lp-card-out{z-index:2;animation:lp-suck .8s cubic-bezier(.5,0,.75,.2) both}",
  ".lp-tex{position:absolute;inset:0;z-index:3;pointer-events:none;mix-blend-mode:multiply;opacity:.55;background-image:" + GRAIN + "," + MOTTLE + ";background-size:320px 320px}",
  ".lp-light{position:absolute;inset:0;z-index:4;pointer-events:none;mix-blend-mode:screen;background:linear-gradient(90deg,rgba(255,232,178,.7),rgba(255,232,178,.12) 38%,rgba(255,232,178,0) 62%),repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 3px);animation:lp-flicker 3.3s steps(1) infinite}",
  ".lp-flash{position:absolute;inset:0;z-index:5;pointer-events:none;background:radial-gradient(ellipse at 0 50%,rgba(255,244,214,.95),rgba(255,244,214,0) 70%);animation:lp-flash .9s ease-out both}",
  ".lp-mote{position:absolute;z-index:4;left:0;top:calc(50% + var(--lp-y));width:var(--lp-s);height:var(--lp-s);border-radius:50%;background:rgba(255,244,214,.85);pointer-events:none;opacity:0;animation:lp-mote var(--lp-t) linear var(--lp-d) infinite}",

  ".lp-label{position:absolute;z-index:3;left:calc(var(--lp-w) + 3cqw);top:calc(var(--lp-top) + var(--lp-cam)*.1);max-width:min(22ch,26cqw);margin:0;padding-bottom:5px;border-bottom:1px solid rgba(60,42,16,.55);font-size:clamp(10px,1.75cqh,15px);line-height:1.35;color:#3b2a10;animation:lp-rise .6s .12s ease-out both}",
  ".lp-info{position:absolute;z-index:3;left:calc(var(--lp-w) + 1.5cqw);top:calc(var(--lp-top) + var(--lp-cam)*var(--lp-r)*.9);width:min(40cqw,42ch)}",
  "@container (max-width:700px){.lp-scene{--lp-cam:min(28cqh,50cqw);--lp-r:2.05;--lp-crop:.5;--lp-top:12cqh}",
  ".lp-label{left:36cqw;top:calc(var(--lp-top) + 1.5cqh);max-width:58cqw}",
  ".lp-info{left:7cqw;top:calc(var(--lp-top) + var(--lp-cam)*var(--lp-r) + 1cqh);width:86cqw}.lp-nums{bottom:1cqh}}",
  ".lp-info-in{animation:lp-rise .7s .1s cubic-bezier(.2,.8,.3,1) both}",
  ".lp-title{margin:0;padding-bottom:.18em;border-bottom:1px solid rgba(90,64,22,.6);overflow-wrap:anywhere;font:800 clamp(24px,5.4cqh,52px)/.95 Impact,'Haettenschweiler','Arial Narrow Bold','Arial Narrow','Helvetica Neue',Arial,sans-serif;",
  "letter-spacing:.045em;text-transform:uppercase;background:linear-gradient(180deg,color-mix(in srgb,var(--lp-ink) 78%,#fff),var(--lp-ink) 55%,color-mix(in srgb,var(--lp-ink) 70%,#000));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}",
  ".lp-note{margin:.7em 0 0;font-size:clamp(11px,1.9cqh,16px);line-height:1.4;color:#33260e}",
  ".lp-bar{margin-top:1em;height:2px;width:100%;background:rgba(60,42,16,.18);overflow:hidden}",
  ".lp-bar i{display:block;height:100%;background:var(--lp-ink);transform-origin:0 50%;animation:lp-bar linear both}",

  ".lp-nums{position:absolute;z-index:7;right:max(4cqw,4.5rem);bottom:3.6cqh;display:flex;align-items:center;gap:.15rem;padding:1.1rem 1.6rem;background:radial-gradient(closest-side,rgba(12,8,5,.9),rgba(12,8,5,.7) 62%,rgba(12,8,5,0))}",
  ".lp-nums button{position:relative;appearance:none;border:0;background:none;margin:0;padding:.35rem .22rem;cursor:pointer;font:inherit;font-size:clamp(13px,2.3cqh,19px);letter-spacing:.14em;font-weight:300;color:rgba(243,234,214,.42);transition:color .25s,transform .25s}",
  ".lp-nums button:hover{color:rgba(243,234,214,.85)}",
  ".lp-nums button.lp-on{color:#fff;font-weight:700;transform:translateY(-2px)}",
  ".lp-nums button:disabled{opacity:.25;cursor:default}",
  ".lp-nums button:focus-visible{outline:2px solid #f3ead6;outline-offset:2px}",
  ".lp-arrow{font-size:1.15em!important;letter-spacing:0!important}",
  ".lp-peek{position:absolute;bottom:calc(100% + 12px);left:50%;width:8.6rem;aspect-ratio:3/2;padding:4px;background:#efe6d0;box-shadow:0 8px 18px rgba(0,0,0,.5);transform:translateX(-50%) rotate(-5deg) scale(.82);transform-origin:50% 100%;opacity:0;pointer-events:none;transition:opacity .2s,transform .28s cubic-bezier(.2,.9,.3,1.2)}",
  ".lp-peek img{display:block;width:100%;height:100%;max-width:none;object-fit:cover}",
  ".lp-nums button:hover .lp-peek,.lp-nums button:focus-visible .lp-peek{opacity:1;transform:translateX(-50%) rotate(-3deg) scale(1)}",

  "@keyframes lp-emerge{0%{transform:translateX(-6%) scale(.2);opacity:0;filter:blur(9px) brightness(1.7)}25%{opacity:1}100%{transform:none;opacity:1;filter:none}}",
  "@keyframes lp-fling{0%{transform:none;opacity:1;filter:none}100%{transform:translateX(16%) scale(1.14);opacity:0;filter:blur(6px)}}",
  "@keyframes lp-return{0%{transform:translateX(16%) scale(1.14);opacity:0;filter:blur(6px)}100%{transform:none;opacity:1;filter:none}}",
  "@keyframes lp-suck{0%{transform:none;opacity:1;filter:none}70%{opacity:1}100%{transform:translateX(-6%) scale(.2);opacity:0;filter:blur(9px) brightness(1.7)}}",
  "@keyframes lp-kick{0%{transform:translateX(0) rotate(0)}18%{transform:translateX(-1.4%) rotate(-.6deg)}100%{transform:translateX(0) rotate(0)}}",
  "@keyframes lp-flash{0%{opacity:1}100%{opacity:0}}",
  "@keyframes lp-flicker{0%{opacity:.85}12%{opacity:1}20%{opacity:.78}47%{opacity:.95}53%{opacity:.82}81%{opacity:1}100%{opacity:.9}}",
  "@keyframes lp-blink{0%{opacity:1}55%{opacity:.15}}",
  "@keyframes lp-breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.14);opacity:1}}",
  "@keyframes lp-mote{0%{opacity:0;transform:translate(0,0)}12%{opacity:.9}100%{opacity:0;transform:translate(64cqw,var(--lp-dy))}}",
  "@keyframes lp-rise{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:none}}",
  "@keyframes lp-bar{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}",

  "@media (prefers-reduced-motion:reduce){",
  ".lp-cam-kick,.lp-rec,.lp-glow,.lp-light,.lp-mote,.lp-flash{animation:none}",
  ".lp-mote{display:none}.lp-flash{display:none}",
  ".lp-fwd .lp-card-in,.lp-bwd .lp-card-in{animation:lp-fade .3s ease-out both}",
  ".lp-fwd .lp-card-out,.lp-bwd .lp-card-out{animation:lp-fade-out .3s ease-out both}",
  ".lp-label,.lp-info-in,.lp-count,.lp-heading{animation:none}",
  ".lp-peek{transition:none}}",
  "@keyframes lp-fade{0%{opacity:0}100%{opacity:1}}",
  "@keyframes lp-fade-out{0%{opacity:1}100%{opacity:0}}",
].join("")

// A few dust motes drifting down the beam. Fixed values so the markup is
// identical on the server and the client.
const MOTES = [
  { y: "-9%", dy: "-6cqh", s: "3px", t: "5.2s", d: "0s" },
  { y: "4%", dy: "3cqh", s: "2px", t: "6.4s", d: "-1.2s" },
  { y: "-2%", dy: "-2cqh", s: "4px", t: "7.1s", d: "-3.4s" },
  { y: "9%", dy: "7cqh", s: "2px", t: "5.8s", d: "-2.1s" },
  { y: "-5%", dy: "-8cqh", s: "3px", t: "6.9s", d: "-4.6s" },
  { y: "2%", dy: "5cqh", s: "3px", t: "8s", d: "-5.3s" },
  { y: "6%", dy: "9cqh", s: "2px", t: "6.1s", d: "-0.6s" },
  { y: "-7%", dy: "-4cqh", s: "2px", t: "7.6s", d: "-6.2s" },
]

// The coiled cord under the camera: rings strung along a curve, each turned
// to face along it.
const COIL = Array.from({ length: 27 }, (_, i) => {
  const t = i / 26
  const u = 1 - t
  const x = u * u * 150 + 2 * u * t * 150 + t * t * -30
  const y = u * u * 292 + 2 * u * t * 396 + t * t * 372
  const dx = 2 * u * 0 + 2 * t * (-30 - 150)
  const dy = 2 * u * (396 - 292) + 2 * t * (372 - 396)
  return { x: +x.toFixed(1), y: +y.toFixed(1), a: +((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(1) }
})

function Camera({ uid, label, kick }: { uid: string; label: string; kick: number }) {
  const g = (n: string) => "url(#" + uid + n + ")"
  return (
    <svg className={"lp-cam" + (kick > 0 ? " lp-cam-kick" : "")} key={kick} viewBox="0 0 560 400" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={uid + "body"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3630" />
          <stop offset=".12" stopColor="#242019" />
          <stop offset=".6" stopColor="#141210" />
          <stop offset="1" stopColor="#080706" />
        </linearGradient>
        <linearGradient id={uid + "barrel"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#090807" />
          <stop offset=".2" stopColor="#6d665c" />
          <stop offset=".32" stopColor="#2c2823" />
          <stop offset=".62" stopColor="#141210" />
          <stop offset=".9" stopColor="#3a352f" />
          <stop offset="1" stopColor="#060504" />
        </linearGradient>
        <linearGradient id={uid + "ring"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050403" />
          <stop offset=".25" stopColor="#4a443c" />
          <stop offset=".5" stopColor="#0f0d0b" />
          <stop offset="1" stopColor="#030302" />
        </linearGradient>
        <linearGradient id={uid + "hood"} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0e0c0b" />
          <stop offset=".65" stopColor="#2b2721" />
          <stop offset="1" stopColor="#5e574d" />
        </linearGradient>
        <radialGradient id={uid + "lens"} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fffbea" />
          <stop offset=".5" stopColor="#ffdc9c" />
          <stop offset="1" stopColor="#ffdc9c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={uid + "mic"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#453d34" />
          <stop offset=".3" stopColor="#1c1813" />
          <stop offset="1" stopColor="#070605" />
        </linearGradient>
        <pattern id={uid + "fur"} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".7" fill="#000" fillOpacity=".55" />
          <circle cx="3" cy="3" r=".6" fill="#7a7064" fillOpacity=".4" />
        </pattern>
        <pattern id={uid + "grip"} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#0c0b09" />
          <rect width="3" height="6" fill="#26221d" />
        </pattern>
      </defs>

      {COIL.map((r, i) => (
        <g key={i} transform={"translate(" + r.x + " " + r.y + ") rotate(" + r.a + ")"}>
          <ellipse rx="5.5" ry="17" fill="none" stroke="#0c0a09" strokeWidth="3.4" />
          <ellipse rx="5.5" ry="17" fill="none" stroke="#6a6154" strokeWidth=".9" strokeOpacity=".7" transform="translate(-1 -.6)" />
        </g>
      ))}
      <path d="M150 292 V326" stroke="#0c0a09" strokeWidth="6" fill="none" />
      <rect x="140" y="286" width="20" height="14" rx="3" fill="#1a1713" stroke="#5a5247" />

      {/* shotgun mic in a shock mount, cable trailing back */}
      <path d="M-20 76 H24" stroke="#0d0b0a" strokeWidth="6" />
      <rect x="20" y="66" width="70" height="14" rx="3" fill="#0d0b0a" stroke="#4a443c" />
      <rect x="86" y="46" width="170" height="64" rx="32" fill={g("mic")} />
      <rect x="86" y="46" width="170" height="64" rx="32" fill={g("fur")} />
      <path d="M108 58 H236" stroke="#a09585" strokeOpacity=".4" strokeWidth="2.4" strokeLinecap="round" />
      {[126, 214].map((x) => (
        <g key={x}>
          <rect x={x - 5} y="40" width="10" height="76" rx="4" fill="#15120f" stroke="#5a5247" />
          <path d={"M" + (x - 5) + " 50 H" + (x + 5) + " M" + (x - 5) + " 106 H" + (x + 5)} stroke="#7a7064" strokeOpacity=".6" />
        </g>
      ))}
      <rect x="252" y="64" width="12" height="30" rx="3" fill="#0d0b0a" stroke="#4a443c" />
      <rect x="150" y="108" width="40" height="22" rx="4" fill="#1a1713" stroke="#4a443c" />
      <circle cx="170" cy="119" r="5" fill="#0a0908" stroke="#7a7064" />

      {/* body, top handle, rubber grip */}
      <path d="M40 128 C44 96 60 94 80 94 H150 C166 94 172 108 174 128 Z" fill="#1a1713" stroke="#4a443c" />
      <path d="M62 128 V112 H150 V128" fill="none" stroke="#050403" strokeWidth="5" />
      <rect x="-14" y="122" width="266" height="178" rx="16" fill={g("body")} stroke="#4a433a" strokeWidth="1.5" />
      <path d="M-4 128 H236" stroke="#8f8577" strokeOpacity=".45" strokeWidth="1.4" />
      <rect x="196" y="140" width="46" height="150" rx="8" fill={g("grip")} stroke="#000" />
      <rect x="6" y="144" width="98" height="52" rx="6" fill="#0e0c0a" stroke="#6a6154" strokeWidth="1.2" />
      <rect x="10" y="148" width="90" height="44" rx="4" fill="none" stroke="#2b2721" />
      <text x="18" y="184" fill="#f0e8d4" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontStyle="italic" fontSize="32" textLength={label.length > 3 ? 74 : undefined} lengthAdjust="spacingAndGlyphs">
        {label}
      </text>
      <path d="M8 204 H104" stroke="#3b352e" strokeWidth="1.4" />
      <text x="10" y="216" fill="#7a7064" fontFamily="Arial,sans-serif" fontSize="7" letterSpacing="1.6">
        HIGH DEFINITION
      </text>
      {[22, 72, 120].map((cx, i) => (
        <g key={cx}>
          <circle cx={cx} cy="256" r={i === 2 ? 11 : 17} fill="#0e0c0a" stroke="#6a6154" strokeWidth="1.5" />
          <circle cx={cx} cy="256" r={i === 2 ? 6 : 10} fill="#2a2621" stroke="#8f8577" />
          <path d={"M" + cx + " " + (i === 2 ? 251 : 247) + " V256"} stroke="#e0d5bd" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
      {[[112, 232, 34], [112, 244, 34]].map(([x, y, w]) => (
        <rect key={y} x={x} y={y} width={w} height="7" rx="2" fill="#0a0908" stroke="#4a443c" />
      ))}
      <circle className="lp-rec" cx="182" cy="146" r="5" fill="#ff3b2a" />
      <circle cx="182" cy="146" r="8" fill="none" stroke="#3b352e" />
      {[[20, 122], [232, 122], [20, 292], [232, 292]].map(([x, y]) => (
        <circle key={x + "-" + y} cx={x} cy={y} r="2.4" fill="#5e574d" />
      ))}

      {/* lens: mount ring, focus ring with scale, zoom ring, front ring, hood */}
      <rect x="248" y="140" width="10" height="120" rx="3" fill="#0a0908" stroke="#5a5247" />
      <rect x="256" y="150" width="96" height="100" rx="7" fill={g("barrel")} stroke="#4a443c" />
      <g stroke="#000" strokeWidth="2.2">
        {Array.from({ length: 17 }, (_, i) => (
          <path key={i} d={"M" + (262 + i * 5.4) + " 152 V248"} />
        ))}
      </g>
      <g stroke="#d8cdb6" strokeOpacity=".75" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={"M" + (272 + i * 9) + " 152 v" + (i % 2 ? 5 : 8)} />
        ))}
      </g>
      <rect x="352" y="158" width="14" height="84" rx="3" fill={g("ring")} stroke="#5a5247" />
      <rect x="366" y="146" width="56" height="108" rx="6" fill={g("barrel")} stroke="#4a443c" />
      <g stroke="#000" strokeWidth="3.4">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={"M" + (372 + i * 6.6) + " 148 V252"} />
        ))}
      </g>
      <rect x="374" y="150" width="3" height="100" fill="#9a8f80" fillOpacity=".5" />
      <path d="M382 170 h6 M382 230 h6" stroke="#ff8a3a" strokeWidth="3" strokeLinecap="round" />
      <rect x="420" y="160" width="10" height="80" rx="3" fill={g("ring")} stroke="#5a5247" />
      <path d="M428 154 L548 118 V282 L428 246 Z" fill={g("hood")} stroke="#5a5247" strokeWidth="1.5" />
      {[0.2, 0.4, 0.6, 0.8].map((t) => (
        <path key={t} d={"M" + (428 + t * 120) + " " + (154 - t * 36) + " V" + (246 + t * 36)} stroke="#000" strokeOpacity=".55" strokeWidth="1.6" />
      ))}
      <path d="M434 162 L544 129" stroke="#b0a696" strokeOpacity=".45" strokeWidth="2" />
      <path d="M540 132 V268" stroke="#070605" strokeWidth="8" />
      <path d="M544 136 V264" stroke="#6d665c" strokeWidth="1.5" />
      <ellipse className="lp-glow" cx="546" cy="200" rx="16" ry="64" fill={g("lens")} />
    </svg>
  )
}

export default function LensProjectorCarousel({
  items,
  heading = "Conflict",
  cameraLabel = "HD",
  height = "100svh",
  autoplay = 0,
  loop = true,
  ink = "#7b5a1c",
  paper = "#d8ccb1",
  index,
  defaultIndex = 0,
  onIndexChange,
  className = "",
}: LensProjectorCarouselProps) {
  const uid = "lp" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const n = items.length
  const [inner, setInner] = React.useState(defaultIndex)
  const cur = wrapIndex(index ?? inner, n, true)

  // What the beam is showing and what it just threw away. Derived during
  // render so the incoming card mounts on the same frame the index changes.
  const [trail, setTrail] = React.useState({ cur, prev: -1, tick: 0, dir: 1 })
  if (trail.cur !== cur) setTrail({ cur, prev: trail.cur, tick: trail.tick + 1, dir: stepDirection(trail.cur, cur, n) })

  const [stopped, setStopped] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [hidden, setHidden] = React.useState(false)
  const [inView, setInView] = React.useState(true)
  const [reduced, setReduced] = React.useState(false)
  const rootRef = React.useRef<HTMLElement>(null)
  const dragX = React.useRef<number | null>(null)

  const go = (i: number) => {
    const t = wrapIndex(i, n, loop)
    if (t === cur) return
    if (index === undefined) setInner(t)
    onIndexChange?.(t)
  }
  const goRef = React.useRef(go)
  goRef.current = go
  const user = (i: number) => {
    setStopped(true)
    go(i)
  }

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    const vis = () => setHidden(document.hidden)
    document.addEventListener("visibilitychange", vis)
    let io: IntersectionObserver | undefined
    if (rootRef.current && "IntersectionObserver" in window) {
      io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 })
      io.observe(rootRef.current)
    }
    return () => {
      mq.removeEventListener("change", sync)
      document.removeEventListener("visibilitychange", vis)
      io?.disconnect()
    }
  }, [])

  const playing = autoplay > 0 && n > 1 && !reduced && !stopped
  const paused = focused || hidden || !inView
  React.useEffect(() => {
    if (!playing || paused) return
    const id = window.setTimeout(() => goRef.current(cur + 1), autoplay)
    return () => window.clearTimeout(id)
  }, [playing, paused, cur, autoplay])

  const item = items[cur]
  const prevItem = trail.prev >= 0 && trail.prev < n ? items[trail.prev] : undefined
  const shownHeading = item?.heading ?? heading
  const animated = trail.tick > 0
  const atStart = !loop && cur === 0
  const atEnd = !loop && cur === n - 1

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).tagName === "BUTTON") {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    }
    if (e.key === "ArrowRight") (e.preventDefault(), user(cur + 1))
    else if (e.key === "ArrowLeft") (e.preventDefault(), user(cur - 1))
    else if (e.key === "Home") (e.preventDefault(), user(0))
    else if (e.key === "End") (e.preventDefault(), user(n - 1))
  }

  if (n === 0) return null

  return (
    <section
      ref={rootRef}
      className={"lp-root " + className}
      style={{ height, "--lp-ink": ink, "--lp-paper": paper } as React.CSSProperties}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label={heading || "Projector carousel"}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <style>{CSS}</style>
      <div className="lp-paper" aria-hidden="true" />
      <div className="lp-stage">
      <div className="lp-scene">
      {shownHeading ? (
        <h2 className="lp-heading" key={"h" + trail.tick}>
          {shownHeading}
        </h2>
      ) : null}
      <p className="lp-count" aria-hidden="true" key={"c" + trail.tick}>
        No. {String(cur + 1).padStart(2, "0")} <i>/</i> {String(n).padStart(2, "0")}
      </p>

      <div className="lp-rig">
        <div className="lp-camwrap">
          <Camera uid={uid} label={cameraLabel} kick={trail.tick} />
        </div>

        <div className="lp-beamwrap">
          <div className="lp-halo" aria-hidden="true" />
          <div className="lp-guides" aria-hidden="true" />
          <div
            className={"lp-beam " + (trail.dir > 0 ? "lp-fwd" : "lp-bwd")}
            onPointerDown={(e) => {
              if (e.button === 0) dragX.current = e.clientX
            }}
            onPointerUp={(e) => {
              if (dragX.current === null) return
              const dx = e.clientX - dragX.current
              dragX.current = null
              const step = swipeStep(dx)
              if (step !== 0) user(cur + step)
              else if (Math.abs(dx) < 6) user(cur + 1)
            }}
            onPointerCancel={() => (dragX.current = null)}
            onPointerLeave={() => (dragX.current = null)}
          >
            {animated && prevItem ? (
              <div className="lp-card lp-card-out" key={"o" + trail.tick}>
                <img src={prevItem.src} alt="" />
              </div>
            ) : null}
            <div className={"lp-card" + (animated ? " lp-card-in" : "")} key={"i" + trail.tick}>
              <img src={item.src} alt={item.alt ?? item.title ?? ""} />
            </div>
            <div className="lp-tex" />
            <div className="lp-light" />
            {animated ? <div className="lp-flash" key={"f" + trail.tick} /> : null}
            {MOTES.map((m, i) => (
              <span
                key={i}
                className="lp-mote"
                style={{ "--lp-y": m.y, "--lp-dy": m.dy, "--lp-s": m.s, "--lp-t": m.t, "--lp-d": m.d } as React.CSSProperties}
              />
            ))}
          </div>

        </div>
      </div>
      {item.label ? (
        <p className="lp-label" key={"l" + trail.tick}>
          {item.label}
        </p>
      ) : null}
      <div className="lp-info" aria-live="polite">
        <div className="lp-info-in" key={"t" + trail.tick}>
          {item.title ? <h3 className="lp-title">{item.title}</h3> : null}
          {item.note ? <p className="lp-note">{item.note}</p> : null}
        </div>
        {playing ? (
          <div className="lp-bar" aria-hidden="true">
            <i key={"b" + trail.tick} style={{ animationDuration: autoplay + "ms", animationPlayState: paused ? "paused" : "running" }} />
          </div>
        ) : null}
      </div>
      </div>

      <nav className="lp-nums" aria-label="Slides">
        <button type="button" className="lp-arrow" aria-label="Previous slide" disabled={atStart} onClick={() => user(cur - 1)}>
          ‹
        </button>
        {items.map((it, i) => (
          <button
            key={i}
            type="button"
            className={i === cur ? "lp-on" : undefined}
            aria-label={"Show " + (it.title || "slide " + (i + 1))}
            aria-current={i === cur ? "true" : undefined}
            onClick={() => user(i)}
          >
            {i + 1}
            <span className="lp-peek" aria-hidden="true">
              <img src={it.src} alt="" />
            </span>
          </button>
        ))}
        <button type="button" className="lp-arrow" aria-label="Next slide" disabled={atEnd} onClick={() => user(cur + 1)}>
          ›
        </button>
      </nav>
      <div className="lp-burn" aria-hidden="true" />
      </div>
    </section>
  )
}
