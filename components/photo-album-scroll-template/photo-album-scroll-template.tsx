"use client"

import * as React from "react"

/**
 * Photo Album Scroll Template — a landing page for a calm, ad-free photo
 * album app, laid out as one long sheet of paper that slides sideways.
 *
 * Scrolling down moves the page to the left. The sheet carries, in order:
 *
 * - Hero: "Collect and share your memories", a create button and two
 *   photo prints with a handwritten "Read more" and arrow.
 * - Intro: a handwritten kicker over a paragraph about the album.
 * - A cluster of three prints labelled by hand (travels, wedding, baby).
 * - A manifesto (no ads, member supported) with a handwritten aside.
 * - A closing call to action over a pale sky that fades in from the paper.
 *
 * The header (logo and sign-up) stays put. Prints drift a little against the
 * paper as they cross the screen, so the sheet reads as layered photos.
 *
 * Motion: a CSS sticky stage and one scroll listener, no libraries. Sizes are
 * measured on mount, on resize and after fonts and photos load; the scroll
 * handler only reads window.scrollY and those cached numbers, and only writes
 * transforms and CSS variables. Under `prefers-reduced-motion` there is no
 * scroll-jacking: the sheet is a normal horizontal scroller.
 *
 * Every photo is a prop (URL or data URI); all copy is a prop. Fonts are
 * Google Fonts (OFL) via `fontHref`: Newsreader and Gochi Hand.
 */

const FONTS =
  "https://fonts.googleapis.com/css2?family=Gochi+Hand&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap"

export type PaPhoto = { src?: string; alt: string }
export type PaLink = { label: string; href: string }

export type PhotoAlbumScrollTemplateProps = {
  brand?: string
  signUp?: PaLink
  hero?: { lead: string; rest: string; cta: PaLink; note: string; noteHref: string }
  intro?: { kicker: string; lead: string; rest: string }
  manifesto?: { muted: string; bold: string; note: string }
  closing?: { title: string; cta: PaLink }
  /** The two prints in the hero: a landscape, then a portrait. */
  heroPhotos?: [PaPhoto, PaPhoto]
  /** The labelled cluster: three portraits, each with its handwritten label. */
  cluster?: [PaPhoto & { label: string }, PaPhoto & { label: string }, PaPhoto & { label: string }]
  /** Wide sky photo behind the closing call to action. */
  sky?: string
  /** Height of the sticky stage. Keep it a definite length. */
  height?: string
  /** Google Fonts stylesheet; `null` loads nothing and falls back to Georgia. */
  fontHref?: string | null
  className?: string
}

// #region frame
/** Sheet offset for a scroll position; `top` and `range` are cached on resize. */
export function sheetX(scrollY: number, top: number, range: number) {
  if (range <= 0) return 0
  const p = Math.min(1, Math.max(0, (scrollY - top) / range))
  return -p * range
}

/** Sideways drift of a print: zero at screen centre, `depth` px per px away from it. */
export function drift(centre: number, x: number, viewW: number, depth: number) {
  return (centre + x - viewW / 2) * depth
}
// #endregion frame

const CSS = `
.pa-root{position:relative;--paper:color-mix(in oklab,var(--color-background) 94%,#b8925a);--ink:var(--color-foreground);--soft:var(--color-muted-foreground);
  --u:calc(min(var(--h),64vw) / 100);color:var(--ink);background:var(--paper);font-family:"Newsreader",Georgia,"Times New Roman",serif}
.pa-root *,.pa-root *::before,.pa-root *::after{box-sizing:border-box}
.pa-root img{max-width:none;display:block}
.pa-sticky{position:sticky;top:0;height:var(--h);overflow:hidden;display:flex;align-items:center;background:var(--paper);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .4 0 0 0 0 .33 0 0 0 0 .25 0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
.pa-head{position:absolute;z-index:5;left:0;right:0;top:0;display:flex;align-items:center;justify-content:space-between;
  padding:max(18px,calc(var(--u)*6)) max(18px,calc(var(--u)*7)) 0}
.pa-logo{display:flex;align-items:center;gap:.55em;font-size:max(15px,calc(var(--u)*3.2));letter-spacing:-.01em;color:var(--ink);text-decoration:none}
.pa-logo svg{width:1.55em;height:auto;color:#c38a2e}
.pa-btn{display:inline-block;font:inherit;font-size:max(12px,calc(var(--u)*2.2));line-height:1;color:var(--ink);text-decoration:none;
  padding:.75em 1.05em;border-radius:999px;background:color-mix(in oklab,var(--paper) 80%,var(--color-background));
  box-shadow:0 0 0 1px color-mix(in oklab,var(--ink) 7%,transparent),0 2px 8px -2px color-mix(in oklab,var(--ink) 18%,transparent);
  transition:transform .3s cubic-bezier(.2,.7,.2,1),box-shadow .3s}
.pa-btn:hover{transform:translateY(-1px);box-shadow:0 0 0 1px color-mix(in oklab,var(--ink) 10%,transparent),0 6px 16px -6px color-mix(in oklab,var(--ink) 30%,transparent)}
.pa-btn:focus-visible,.pa-logo:focus-visible,.pa-note a:focus-visible{outline:2px solid var(--color-primary);outline-offset:3px}
.pa-scroll{position:relative;width:100%;height:100%;display:flex;align-items:center;overflow:hidden}
.pa-track{position:relative;flex:none;width:calc(var(--u)*357);height:calc(var(--u)*100);will-change:transform}
.pa-at{position:absolute}
.pa-copy{font-size:calc(var(--u)*3.6);line-height:1.56;letter-spacing:-.018em;color:var(--soft);margin:0;font-weight:400;text-wrap:pretty}
.pa-copy b{font-weight:500;color:var(--ink)}
.pa-copy .pa-ink{color:var(--ink)}
.pa-big{font-size:calc(var(--u)*4.1)}
.pa-note{font-family:"Gochi Hand","Segoe Print","Comic Sans MS",cursive;font-size:calc(var(--u)*2.55);line-height:1.2;color:color-mix(in oklab,var(--ink) 78%,transparent);white-space:pre-line}
.pa-note a{color:inherit;text-decoration:none}
.pa-arrow{position:absolute;overflow:visible;color:color-mix(in oklab,var(--ink) 60%,transparent)}
.pa-arrow path{fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.pa-card{position:absolute;transform:translate3d(var(--px,0px),0,0)}
.pa-print{width:100%;height:100%;padding:calc(var(--u)*1.1);border-radius:calc(var(--u)*2.6);background:#fbfaf6;rotate:var(--r);
  box-shadow:0 1px 2px rgba(40,30,20,.14),0 calc(var(--u)*2) calc(var(--u)*5) calc(var(--u)*-1.5) rgba(40,30,20,.32);
  transition:rotate .6s cubic-bezier(.2,.7,.2,1),transform .6s cubic-bezier(.2,.7,.2,1),box-shadow .6s}
.pa-card:hover .pa-print{rotate:0deg;transform:translateY(calc(var(--u)*-1.2)) scale(1.03);
  box-shadow:0 1px 2px rgba(40,30,20,.14),0 calc(var(--u)*4) calc(var(--u)*8) calc(var(--u)*-2) rgba(40,30,20,.38)}
.pa-print img,.pa-print i{width:100%;height:100%;object-fit:cover;border-radius:calc(var(--u)*1.7);background:color-mix(in oklab,var(--paper) 70%,#7f9a97)}
.pa-print i{display:block}
.pa-sky{position:absolute;left:calc(var(--u)*246);right:calc(var(--u)*-40);top:calc((var(--u)*100 - var(--h)) / 2);height:var(--h);pointer-events:none;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 58%);mask-image:linear-gradient(90deg,transparent,#000 58%)}
.pa-sky img{width:100%;height:100%;object-fit:cover;opacity:.72}
.dark .pa-sky img{opacity:.6;filter:brightness(.62) saturate(.8)}
@media (max-width:640px){.pa-root{--u:calc(var(--h) * .62 / 100)}}
@media (prefers-reduced-motion: reduce){
  .pa-root{height:auto}
  .pa-scroll{overflow-x:auto;overflow-y:hidden;scrollbar-width:thin}
  .pa-print{transition:none}
  .pa-card:hover .pa-print{transform:none}
}
`

const DEFAULTS = {
  brand: "Keepsake",
  signUp: { label: "Sign up", href: "#signup" },
  hero: {
    lead: "Collect and share your memories",
    rest: "in a calm and beautiful place.",
    cta: { label: "Create album", href: "#create" },
    note: "Read more",
    noteHref: "#about",
  },
  intro: {
    kicker: "A new kind of\ndigital album",
    lead: "Create joyful photo albums",
    rest: "of your personal moments that you want to share with your closest friends and family.",
  },
  manifesto: {
    muted: "In a time where companies have turned memory sharing into a dopamine addiction.",
    bold: "We don't have any ads and we never will, so we don't profit from making you addicted.",
    note: "100% member\nsupported",
  },
  closing: { title: "Create your own beautiful photo album", cta: { label: "Create album", href: "#create" } },
}

const u = (n: number) => "calc(var(--u) * " + n + ")"
const at = (x: number, y: number, w?: number, h?: number): React.CSSProperties => ({
  left: u(x),
  top: u(y),
  ...(w != null ? { width: u(w) } : {}),
  ...(h != null ? { height: u(h) } : {}),
})

function Print({ photo, x, y, w, h, r, depth }: { photo?: PaPhoto; x: number; y: number; w: number; h: number; r: number; depth: number }) {
  return (
    <div className="pa-card" data-depth={depth} style={at(x, y, w, h)}>
      <div className="pa-print" style={{ ["--r" as string]: r + "deg" }}>
        {photo?.src ? <img src={photo.src} alt={photo.alt} width={Math.round(w * 9)} height={Math.round(h * 9)} draggable={false} /> : <i role="img" aria-label={photo?.alt ?? ""} />}
      </div>
    </div>
  )
}

/** Hand-drawn arrow: one stroke plus a two-line head, drawn in a 100 × 100 box. */
function Arrow({ d, head, x, y, w, h }: { d: string; head: string; x: number; y: number; w: number; h: number }) {
  return (
    <svg className="pa-arrow" viewBox="0 0 100 100" preserveAspectRatio="none" style={at(x, y, w, h)} aria-hidden="true">
      <path d={d} />
      <path d={head} />
    </svg>
  )
}

function Mark() {
  return (
    <svg viewBox="0 0 32 20" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <rect x="2" y="5" width="11" height="12" rx="1.6" transform="rotate(-14 7.5 11)" />
        <rect x="10.5" y="4" width="11" height="12" rx="1.6" transform="rotate(8 16 10)" />
        <rect x="19" y="3.5" width="11" height="12" rx="1.6" transform="rotate(-6 24.5 9.5)" />
      </g>
    </svg>
  )
}

export default function PhotoAlbumScrollTemplate({
  brand = DEFAULTS.brand,
  signUp = DEFAULTS.signUp,
  hero = DEFAULTS.hero,
  intro = DEFAULTS.intro,
  manifesto = DEFAULTS.manifesto,
  closing = DEFAULTS.closing,
  heroPhotos,
  cluster,
  sky,
  height = "100svh",
  fontHref = FONTS,
  className,
}: PhotoAlbumScrollTemplateProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const track = trackRef.current
    if (!root || !stage || !track) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".pa-card"))
    // Cached on measure(); the scroll path reads only these.
    let top = 0
    let range = 0
    let viewW = 0
    let centres: number[] = []
    let depths: number[] = []
    let raf = 0
    let on = false

    const frame = () => {
      raf = 0
      const x = sheetX(window.scrollY, top, range)
      track.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)"
      for (let i = 0; i < cards.length; i++)
        cards[i].style.setProperty("--px", drift(centres[i], x, viewW, depths[i]).toFixed(1) + "px")
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const measure = () => {
      on = !reduce.matches
      if (!on) {
        root.style.height = ""
        track.style.transform = ""
        for (const c of cards) c.style.removeProperty("--px")
        return
      }
      // All reads first, then the writes.
      viewW = stage.clientWidth
      const stageH = stage.offsetHeight
      range = Math.max(0, track.offsetWidth - viewW)
      top = root.getBoundingClientRect().top + window.scrollY
      centres = cards.map((c) => c.offsetLeft + c.offsetWidth / 2)
      depths = cards.map((c) => Number(c.dataset.depth) || 0)
      root.style.height = stageH + range + "px"
      frame()
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    ro.observe(track)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", onScroll, { passive: true })
    reduce.addEventListener("change", measure)
    document.fonts?.ready.then(measure)
    const imgs = Array.from(track.querySelectorAll("img"))
    for (const img of imgs) if (!img.complete) img.addEventListener("load", measure, { once: true })
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", onScroll)
      reduce.removeEventListener("change", measure)
      for (const img of imgs) img.removeEventListener("load", measure)
      root.style.height = ""
    }
  }, [])

  const [p1, p2] = heroPhotos ?? [undefined, undefined]
  const [c1, c2, c3] = cluster ?? [undefined, undefined, undefined]

  return (
    <div ref={rootRef} className={"pa-root" + (className ? " " + className : "")} style={{ ["--h" as string]: height }}>
      <style>{CSS}</style>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <div ref={stageRef} className="pa-sticky">
        <header className="pa-head">
          <a className="pa-logo" href="#top">
            <Mark />
            {brand}
          </a>
          <a className="pa-btn" href={signUp.href}>
            {signUp.label}
          </a>
        </header>

        <div className="pa-scroll">
        <div ref={trackRef} className="pa-track">
          {sky && (
            <div className="pa-sky">
              <img src={sky} alt="" width={1800} height={1100} />
            </div>
          )}

          {/* Hero */}
          <div className="pa-at" style={at(14, 28.5, 28)}>
            <h1 className="pa-copy">
              <span className="pa-ink">{hero.lead}</span> {hero.rest}
            </h1>
            <a className="pa-btn" href={hero.cta.href} style={{ marginTop: u(6.5) }}>
              {hero.cta.label}
            </a>
          </div>
          <Print photo={p1} x={58} y={21.5} w={41.5} h={29} r={-2.5} depth={0.05} />
          <Print photo={p2} x={51} y={45.5} w={28.5} h={41} r={3} depth={0.09} />
          <p className="pa-note pa-at" style={at(32, 81.5)}>
            <a href={hero.noteHref}>{hero.note}</a>
          </p>
          <Arrow x={35} y={86.5} w={10} h={6} d="M6 6 C0 50 22 84 90 70" head="M70 50 L90 70 L68 90" />

          {/* Intro */}
          <p className="pa-note pa-at" style={{ ...at(112, 23), rotate: "-6deg" }}>{intro.kicker}</p>
          <p className="pa-copy pa-at" style={at(115, 34, 33)}>
            <b>{intro.lead}</b> {intro.rest}
          </p>

          {/* Labelled cluster */}
          <p className="pa-note pa-at" style={at(164, 17.5)}>{c1?.label}</p>
          <Print photo={c1} x={158} y={23} w={27} h={40} r={-1} depth={0.04} />
          <Print photo={c2} x={178} y={38.5} w={27.5} h={41.5} r={3} depth={0.1} />
          <Print photo={c3} x={202} y={26} w={30} h={42} r={-4} depth={0.06} />
          <Arrow x={206.5} y={16} w={6} h={8} d="M96 18 C56 2 14 14 18 92" head="M4 74 L18 94 L32 76" />
          <p className="pa-note pa-at" style={at(214, 17.5)}>{c3?.label}</p>
          <Arrow x={182} y={77} w={7} h={9} d="M96 86 C44 98 10 70 18 6" head="M4 24 L18 4 L32 22" />
          <p className="pa-note pa-at" style={at(190.5, 82.5)}>{c2?.label}</p>

          {/* Manifesto */}
          <p className="pa-copy pa-at" style={at(243, 29, 37)}>
            {manifesto.muted} <span className="pa-ink">{manifesto.bold}</span>
          </p>
          <Arrow x={276.5} y={65} w={5} h={9} d="M70 96 C86 60 70 24 14 8" head="M28 -6 L12 8 L30 22" />
          <p className="pa-note pa-at" style={{ ...at(272, 76), rotate: "14deg" }}>{manifesto.note}</p>

          {/* Closing */}
          <div className="pa-at" style={at(313, 36.5, 31)}>
            <h2 className="pa-copy pa-big">
              <span className="pa-ink">{closing.title}</span>
            </h2>
            <a className="pa-btn" href={closing.cta.href} style={{ marginTop: u(5.5) }}>
              {closing.cta.label}
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
