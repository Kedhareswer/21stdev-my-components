"use client"

import * as React from "react"

/**
 * Featured Cities Carousel — a "Featured" heading and serif subtitle on the
 * left, round prev / next buttons on the right, and a row of tall peach cards
 * that runs off the right edge. Each card has a city name, a short witty serif
 * blurb and a hand-drawn landmark anchored to its bottom.
 *
 * The row is a native horizontal scroller (so touch swipe, trackpads and
 * scroll snapping just work) with mouse drag, arrow keys and the buttons on
 * top; the buttons and keys move exactly one card. Cards lift on hover and
 * their drawing rises into place; on first view the cards come in one after
 * another. Reduced motion keeps everything static.
 *
 * Self-contained: React is the only import. Pictures come from the catalog
 * site. The drawings were generated with ChatGPT.
 */

export interface FeaturedCity {
  name: string
  blurb: string
  /** File name under imageBase, without .webp. */
  image: string
  href?: string
}

export interface FeaturedCitiesCarouselProps {
  title?: string
  subtitle?: string
  cities?: FeaturedCity[]
  /** Focus ring and the arrow buttons' hover. */
  accent?: string
  /** Card fill in light mode. */
  cardColor?: string
  /** Must be a definite length: percentages collapse on a page with no height chain. */
  height?: string
  /** Where the drawings live. */
  imageBase?: string
  /** Google Fonts stylesheet, or null to bring your own. */
  fontHref?: string | null
  className?: string
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600&family=Newsreader:opsz,wght@6..72,400&display=swap"

const IMG_BASE = "https://kedhar-components.pages.dev/featured-cities-carousel/"

const DEFAULT_CITIES: FeaturedCity[] = [
  {
    name: "Amsterdam",
    image: "amsterdam",
    blurb: "Dodge a thousand bicycles, lose an afternoon to one canal bend, and swear you'll learn to say gezellig properly.",
  },
  {
    name: "New Orleans",
    image: "new-orleans",
    blurb: "Iron balconies, brass on every corner and a breakfast that is mostly powdered sugar. Pace yourself. Nobody does.",
  },
  {
    name: "Prague",
    image: "prague",
    blurb: "Gothic towers, cheap pilsner and cobbles built to humble your shoes. Cross the bridge before the sun and the crowds do.",
  },
  {
    name: "Lisbon",
    image: "lisbon",
    blurb: "Seven hills, one rattling yellow tram and a custard tart at every stop. Your calves will file a complaint.",
  },
  {
    name: "Kyoto",
    image: "kyoto",
    blurb: "Temple bells at dawn, vending machines at midnight. Bring socks without holes: you'll take your shoes off a lot.",
  },
  {
    name: "Mexico City",
    image: "mexico-city",
    blurb: "Tacos at 2 am, murals at noon, bunting overhead at all hours. Seven days is a warm-up, not a trip.",
  },
  {
    name: "Istanbul",
    image: "istanbul",
    blurb: "Two continents, one ferry ride and more tea than you knew a person could hold. Haggle with a smile.",
  },
  {
    name: "Marrakech",
    image: "marrakech",
    blurb: "Every alley ends in a carved door or a rug you didn't plan to buy. Get lost on purpose; it's tradition.",
  },
  {
    name: "Havana",
    image: "havana",
    blurb: "Pastel arcades, chrome-finned convertibles and a soundtrack spilling out of every window. Leave your phone in your pocket.",
  },
]

// #region track
/** Card geometry as a function of the row's visible width. */
export function cardSize(viewW: number) {
  const w = viewW < 520 ? Math.round(Math.min(300, viewW * 0.74)) : viewW < 1100 ? 268 : 300
  const gap = viewW < 520 ? 14 : 20
  return { w, gap, pitch: w + gap }
}

/** Index of the card nearest the left edge for a given scroll offset. */
export function cardIndexAt(scrollLeft: number, pitch: number, count: number) {
  return Math.max(0, Math.min(count - 1, Math.round(scrollLeft / pitch)))
}

/** Scroll offset for a card, clamped to the scrollable range. */
export function scrollFor(index: number, pitch: number, maxScroll: number) {
  return Math.max(0, Math.min(maxScroll, index * pitch))
}

/** Next card index for a step of +1 / -1 from the current offset. */
export function stepTo(scrollLeft: number, dir: number, pitch: number, count: number, maxScroll: number) {
  if (dir > 0 && scrollLeft >= maxScroll - 2) return cardIndexAt(scrollLeft, pitch, count)
  const here = scrollLeft / pitch
  const next = dir > 0 ? Math.floor(here + 0.02) + 1 : Math.ceil(here - 0.02) - 1
  return Math.max(0, Math.min(count - 1, next))
}
// #endregion track

const css = [
  ".fcc-root{--fcc-paper:#ffffff;--fcc-ink:#2b3033;--fcc-soft:#4a4f52;--fcc-card:#fbe8de;--fcc-line:rgba(43,48,51,.14);--fcc-gutter:max(20px,6%,calc((100% - 1180px) / 2));position:relative;width:100%;overflow:hidden;display:flex;flex-direction:column;justify-content:center;background:var(--fcc-paper);color:var(--fcc-ink);font-family:'Newsreader',Georgia,'Times New Roman',serif}",
  ".dark .fcc-root{--fcc-paper:#16120e;--fcc-ink:#efe8de;--fcc-soft:#cfc6ba;--fcc-card:#2a1a10;--fcc-line:rgba(239,232,222,.18)}",
  ".fcc-root *{box-sizing:border-box}",
  ".fcc-root img{max-width:none;display:block;user-select:none;-webkit-user-drag:none}",
  ".fcc-head{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 var(--fcc-gutter);margin-bottom:clamp(20px,2.4vw,28px)}",
  ".fcc-title{margin:0;font-family:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;font-weight:600;font-size:clamp(22px,2vw,27px);line-height:1.15;letter-spacing:-.02em}",
  ".fcc-sub{margin:6px 0 0;font-size:clamp(16px,1.5vw,19px);line-height:1.45;color:var(--fcc-soft)}",
  ".fcc-arrows{display:flex;gap:10px;flex:none}",
  ".fcc-arrow{width:42px;height:42px;border-radius:999px;display:grid;place-items:center;background:var(--fcc-paper);color:var(--fcc-ink);border:1px solid var(--fcc-line);box-shadow:0 4px 12px -6px rgba(0,0,0,.25);cursor:pointer;padding:0;transition:border-color .2s,color .2s,opacity .2s,transform .2s}",
  ".fcc-arrow:hover:not(:disabled){border-color:var(--fcc-accent);color:var(--fcc-accent)}",
  ".fcc-arrow:active:not(:disabled){transform:scale(.94)}",
  ".fcc-arrow:disabled{opacity:.38;cursor:default;box-shadow:none}",
  ".fcc-arrow svg{width:14px;height:14px}",
  ".fcc-arrow:focus-visible,.fcc-track:focus-visible,.fcc-card:focus-visible{outline:2px solid var(--fcc-accent);outline-offset:3px}",
  ".fcc-track{display:flex;gap:var(--fcc-gap);overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-padding-left:var(--fcc-gutter);padding:14px var(--fcc-gutter) 36px;margin-bottom:-18px;scrollbar-width:none;cursor:grab;touch-action:pan-x pan-y;overscroll-behavior-x:contain}",
  ".fcc-track::-webkit-scrollbar{display:none}",
  ".fcc-track[data-drag=true]{cursor:grabbing;scroll-snap-type:none;user-select:none}",
  ".fcc-track[data-drag=true] .fcc-card{pointer-events:none}",
  ".fcc-slot{flex:none;scroll-snap-align:start;width:var(--fcc-w)}",
  ".fcc-in{animation:fcc-enter .8s cubic-bezier(.2,.75,.15,1) both;animation-play-state:paused}",
  ".fcc-root[data-seen=true] .fcc-in{animation-play-state:running}",
  "@keyframes fcc-enter{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}",
  ".fcc-card{position:relative;display:flex;flex-direction:column;height:var(--fcc-h);padding:26px 24px 0;border-radius:4px;background:var(--fcc-card);color:inherit;text-decoration:none;overflow:hidden;transition:transform .45s cubic-bezier(.2,.75,.15,1),box-shadow .45s cubic-bezier(.2,.75,.15,1)}",
  ".fcc-card:hover{transform:translateY(-8px);box-shadow:0 22px 34px -22px rgba(120,60,30,.45)}",
  ".fcc-name{margin:0;font-family:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;font-weight:600;font-size:clamp(25px,2.1vw,29px);line-height:1.1;letter-spacing:-.01em}",
  ".fcc-blurb{margin:14px 0 0;font-size:15.5px;line-height:1.55;color:var(--fcc-soft)}",
  ".fcc-pic{position:relative;margin-top:auto;margin-left:-24px;margin-right:-24px;height:var(--fcc-pic);display:flex;align-items:flex-end;justify-content:center}",
  ".fcc-pic::before{content:'';position:absolute;left:8%;right:8%;bottom:6px;height:42%;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--fcc-accent) 18%,transparent),transparent);opacity:0;transition:opacity .5s}",
  ".fcc-card:hover .fcc-pic::before{opacity:1}",
  ".fcc-draw{position:relative;transition:transform .6s cubic-bezier(.2,.75,.15,1)}",
  ".fcc-card:hover .fcc-draw{transform:translateY(-6px)}",
  ".fcc-draw img{transition:clip-path .7s cubic-bezier(.45,.05,.25,1);clip-path:inset(0 0 0 0)}",
  ".dark .fcc-draw img{filter:invert(1) hue-rotate(180deg)}",
  ".fcc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@media (prefers-reduced-motion:reduce){.fcc-in{animation:none!important}.fcc-card,.fcc-draw,.fcc-pic::before,.fcc-arrow{transition:none!important}.fcc-card:hover{transform:none}.fcc-draw{transform:none}}",
].join("\n")

const prefersReduced = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export default function FeaturedCitiesCarousel({
  title = "Featured Cities",
  subtitle = "Places on Kedhareswer's radar right now. Going soon is a very good idea.",
  cities = DEFAULT_CITIES,
  accent = "#ee7454",
  cardColor = "#fbe8de",
  height = "680px",
  imageBase = IMG_BASE,
  fontHref = FONT_HREF,
  className,
}: FeaturedCitiesCarouselProps) {
  const rootRef = React.useRef(null as HTMLElement | null)
  const trackRef = React.useRef(null as HTMLDivElement | null)
  const [size, setSize] = React.useState(() => cardSize(1200))
  const [cardH, setCardH] = React.useState(500)
  const [edge, setEdge] = React.useState({ start: true, end: false })
  const [seen, setSeen] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const id = React.useId().replace(/:/g, "")

  // Card width and height follow the row's width and the section's height.
  React.useEffect(() => {
    const root = rootRef.current
    const track = trackRef.current
    if (!root || !track) return
    const measure = () => {
      const r = root.getBoundingClientRect()
      setSize(cardSize(r.width))
      const head = root.querySelector(".fcc-head") as HTMLElement | null
      const free = r.height - (head ? head.offsetHeight : 0) - 32 - 96
      setCardH(Math.round(Math.max(400, Math.min(470, free))))
      const max = track.scrollWidth - track.clientWidth
      setEdge({ start: track.scrollLeft <= 2, end: track.scrollLeft >= max - 2 })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  // Cards come in once, the first time the row is on screen.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (prefersReduced()) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  const sync = React.useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    setEdge({ start: track.scrollLeft <= 2, end: track.scrollLeft >= max - 2 })
    setActive(cardIndexAt(track.scrollLeft, size.pitch, cities.length))
  }, [size.pitch, cities.length])

  const go = React.useCallback(
    (dir: number) => {
      const track = trackRef.current
      if (!track) return
      const max = track.scrollWidth - track.clientWidth
      const to = stepTo(track.scrollLeft, dir, size.pitch, cities.length, max)
      track.scrollTo({ left: scrollFor(to, size.pitch, max), behavior: prefersReduced() ? "auto" : "smooth" })
    },
    [size.pitch, cities.length],
  )

  // Mouse drag with a little momentum; touch and pens use native scrolling.
  React.useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let down = false
    let moved = false
    let startX = 0
    let startLeft = 0
    let lastX = 0
    let lastT = 0
    let v = 0
    let raf = 0
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return
      cancelAnimationFrame(raf)
      down = true
      moved = false
      startX = lastX = e.clientX
      startLeft = track.scrollLeft
      lastT = performance.now()
      v = 0
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - startX
      if (!moved && Math.abs(dx) > 4) {
        moved = true
        track.dataset.drag = "true"
        track.setPointerCapture(e.pointerId)
      }
      if (!moved) return
      const now = performance.now()
      v = (e.clientX - lastX) / Math.max(now - lastT, 1)
      lastX = e.clientX
      lastT = now
      track.scrollLeft = startLeft - dx
    }
    const settle = () => {
      const max = track.scrollWidth - track.clientWidth
      const here = track.scrollLeft / size.pitch
      const glide = prefersReduced() ? 0 : -v * 180
      const to = Math.round(here + glide / size.pitch)
      track.dataset.drag = "false"
      track.scrollTo({ left: scrollFor(to, size.pitch, max), behavior: prefersReduced() ? "auto" : "smooth" })
    }
    const onUp = (e: PointerEvent) => {
      if (!down) return
      down = false
      if (moved) {
        if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId)
        settle()
      }
    }
    // a drag must not also follow the card's link
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault()
        e.stopPropagation()
        moved = false
      }
    }
    track.addEventListener("pointerdown", onDown)
    track.addEventListener("pointermove", onMove)
    track.addEventListener("pointerup", onUp)
    track.addEventListener("pointercancel", onUp)
    track.addEventListener("click", onClick, true)
    return () => {
      cancelAnimationFrame(raf)
      track.removeEventListener("pointerdown", onDown)
      track.removeEventListener("pointermove", onMove)
      track.removeEventListener("pointerup", onUp)
      track.removeEventListener("pointercancel", onUp)
      track.removeEventListener("click", onClick, true)
    }
  }, [size.pitch])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault()
      go(e.key === "ArrowRight" ? 1 : -1)
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      const track = trackRef.current
      if (!track) return
      const max = track.scrollWidth - track.clientWidth
      track.scrollTo({ left: e.key === "Home" ? 0 : max, behavior: prefersReduced() ? "auto" : "smooth" })
    }
  }

  const picH = Math.round(Math.min(size.w * 0.74, cardH - 236))
  const rootStyle = {
    height,
    width: "100%",
    ["--fcc-accent" as string]: accent,
    ["--fcc-w" as string]: size.w + "px",
    ["--fcc-gap" as string]: size.gap + "px",
    ["--fcc-h" as string]: cardH + "px",
    ["--fcc-pic" as string]: picH + "px",
    ...(cardColor !== "#fbe8de" ? { ["--fcc-card" as string]: cardColor } : null),
  } as React.CSSProperties

  return (
    <section
      ref={rootRef}
      className={"fcc-root" + (className ? " " + className : "")}
      style={rootStyle}
      data-seen={seen}
      aria-roledescription="carousel"
      aria-labelledby={id + "-title"}
    >
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{css}</style>

      <div className="fcc-head">
        <div>
          <h2 id={id + "-title"} className="fcc-title">
            {title}
          </h2>
          <p className="fcc-sub">{subtitle}</p>
        </div>
        <div className="fcc-arrows">
          <button type="button" className="fcc-arrow" aria-label="Previous city" aria-controls={id + "-track"} disabled={edge.start} onClick={() => go(-1)}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8.6 2.6 4.2 7l4.4 4.4" />
            </svg>
          </button>
          <button type="button" className="fcc-arrow" aria-label="Next city" aria-controls={id + "-track"} disabled={edge.end} onClick={() => go(1)}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5.4 2.6 9.8 7l-4.4 4.4" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        id={id + "-track"}
        className="fcc-track"
        tabIndex={0}
        role="group"
        aria-label={title + ": use the arrow keys to move one card"}
        onKeyDown={onKey}
        onScroll={sync}
      >
        {cities.map((c, i) => (
          <div key={c.name} className="fcc-slot" role="group" aria-roledescription="slide" aria-label={i + 1 + " of " + cities.length}>
            <div className="fcc-in" style={{ animationDelay: (Math.min(i, 5) * 0.09).toFixed(2) + "s" }}>
              <a className="fcc-card" href={c.href ?? "#" + c.image} draggable={false}>
                <h3 className="fcc-name">{c.name}</h3>
                <p className="fcc-blurb">{c.blurb}</p>
                <div className="fcc-pic" aria-hidden="true">
                  <div className="fcc-draw">
                    <img
                      src={imageBase + c.image + ".webp"}
                      alt=""
                      width={size.w}
                      height={Math.round(picH)}
                      draggable={false}
                      style={{ width: size.w, height: picH, maxWidth: "none", objectFit: "contain", objectPosition: "50% 100%" }}
                    />
                  </div>
                </div>
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="fcc-sr" aria-live="polite">
        {cities[active] ? cities[active].name : ""}
      </p>
    </section>
  )
}
