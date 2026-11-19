"use client"

import { useEffect, useRef, useState } from "react"

/*
 * Deck Rack Add To Cart
 * A wall of skateboard decks hung over a brush-painted wordmark. Hover swings a deck off the wall on its
 * arm; click glides the camera in and a frosted card fades up with the deck's specs. The add-to-cart pill
 * is itself a little deck: press it and it kickflips (you see the trucks mid-air) and lands as "In your cart",
 * while the cart count in the corner rolls over.
 *
 * The camera never enlarges anything: the wall is laid out at its focused size and the wall view is that
 * world scaled down (1/K), so the glide is a compositor transform that only ever minifies the deck art.
 * Positions come from container units and custom properties, so no layout reads are needed.
 */

const IMG_BASE = "https://kedhar-components.pages.dev/deck-rack-add-to-cart/"

export type DeckSpec = [label: string, value: string]

export type Deck = {
  id: string
  name: string
  tagline: string
  price: number
  image: string
  specs: DeckSpec[]
  /** Horizontal position on the wall, in wall units (the wordmark spans roughly -30 … 30). */
  x: number
}

export const DEFAULT_DECKS: Deck[] = [
  {
    id: "onyx",
    name: "Onyx",
    tagline: "Black lacquer, gold-leaf pinstripe.",
    price: 68,
    image: IMG_BASE + "deck-onyx.webp",
    specs: [["Width", "8.0\""], ["Length", "31.6\""], ["Wheelbase", "14.25\""], ["Build", "7-ply Canadian maple"]],
    x: -34,
  },
  {
    id: "chalk",
    name: "Chalk",
    tagline: "Bone-white face, charcoal nose and tail.",
    price: 64,
    image: IMG_BASE + "deck-chalk.webp",
    specs: [["Width", "8.25\""], ["Length", "32.0\""], ["Wheelbase", "14.38\""], ["Build", "7-ply Canadian maple"]],
    x: -13.5,
  },
  {
    id: "garnet",
    name: "Garnet",
    tagline: "Deep wine-red gloss, gilt centre line.",
    price: 72,
    image: IMG_BASE + "deck-garnet.webp",
    specs: [["Width", "8.38\""], ["Length", "31.9\""], ["Wheelbase", "14.25\""], ["Build", "7-ply Canadian maple"]],
    x: 1.5,
  },
  {
    id: "fern",
    name: "Fern",
    tagline: "Racing green, cream stripe, No. 07.",
    price: 70,
    image: IMG_BASE + "deck-fern.webp",
    specs: [["Width", "8.5\""], ["Length", "32.2\""], ["Wheelbase", "14.5\""], ["Build", "7-ply Canadian maple"]],
    x: 15.5,
  },
  {
    id: "teak",
    name: "Teak",
    tagline: "Walnut veneer with brass inlay stripes.",
    price: 84,
    image: IMG_BASE + "deck-teak.webp",
    specs: [["Width", "8.25\""], ["Length", "32.0\""], ["Wheelbase", "14.38\""], ["Build", "Walnut veneer over maple"]],
    x: 35,
  },
]

export type DeckRackAddToCartProps = {
  decks?: Deck[]
  /** Brush-painted wordmark behind the decks (transparent image, about 2.4 : 1). */
  wordmarkSrc?: string
  shopName?: string
  currency?: string
  /** Ids already in the cart when the rack mounts. */
  defaultCart?: string[]
  onCartChange?: (ids: string[]) => void
  height?: string
  className?: string
}

// Wall geometry, in wall units. A unit is 1cqw on landscape stages and 1.2cqw on portrait ones.
const DECK_H = 22
const DECK_RATIO = 0.264
const MARK_W = 62
const MARK_RATIO = 672 / 1600

// The world (.dr-scene) is laid out once at the focused size (--dr-k = K) and the camera only ever scales it
// DOWN (scale 1/K on the wall, 1 when focused), so decks are rasterised at their largest size, never enlarged,
// and the glide is a compositor transform transition.
const P = "cubic-bezier(.76,0,.24,1)"
const CSS =
  "@property --dr-p{syntax:'<number>';inherits:true;initial-value:0}" +
  ".dr-root{position:relative;overflow:hidden;container:dr/size;isolation:isolate;" +
  "--dr-wall:color-mix(in oklab,var(--color-background) 84%,#d9a79e);--dr-ink:var(--color-foreground);" +
  "--dr-soft:var(--color-muted-foreground);--dr-g:clamp(16px,3cqw,40px);background:var(--dr-wall);color:var(--dr-ink);" +
  "font-family:Inter,'Helvetica Neue',Arial,system-ui,sans-serif;-webkit-font-smoothing:antialiased;user-select:none}" +
  ".dr-root img{max-width:none;display:block;pointer-events:none;-webkit-user-drag:none}" +
  ".dr-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
  ".dr-root :where(button):focus-visible{outline:2px solid var(--dr-ink);outline-offset:3px}" +
  ".dr-scene{position:absolute;inset:0;--u:min(1cqw,1.55cqh);--dr-k:1.95;--dr-s:calc(1/var(--dr-k));--dr-sx:0;--dr-sy:0;" +
  "transform-origin:50% 50%;will-change:transform;transform:translate(calc(var(--dr-sx)*1cqw - var(--dr-cx)*var(--u)*var(--dr-k)),calc(var(--dr-sy)*1cqh)) scale(var(--dr-s));" +
  "transition:transform 1.15s " + P + "}" +
  ".dr-scene[data-on]{--dr-s:1;--dr-sx:-19;--dr-sy:0}" +
  "@container dr (max-aspect-ratio:4/5){.dr-scene{--u:1.2cqw;--dr-k:2.9}.dr-scene[data-on]{--dr-sx:0;--dr-sy:-20}}" +
  ".dr-at{position:absolute;left:calc(50% + var(--x)*var(--u)*var(--dr-k));" +
  "top:calc(50% + var(--y)*var(--u)*var(--dr-k));" +
  "width:calc(var(--w)*var(--u)*var(--dr-k));height:calc(var(--h)*var(--u)*var(--dr-k));transform:translate(-50%,-50%)}" +
  ".dr-arch{transform:translate(-50%,0);border-radius:50% 50% 0 0/34% 34% 0 0;" +
  "background:linear-gradient(180deg,rgba(60,20,20,.09),transparent 9%),linear-gradient(90deg,rgba(60,20,20,.1),rgba(255,255,255,.16) 30%,rgba(255,255,255,.1) 70%,rgba(60,20,20,.07));" +
  "box-shadow:inset 0 0 0 calc(.7*var(--u)*var(--dr-k)) color-mix(in oklab,var(--dr-wall) 92%,#fff)}" +
  ".dr-mark{transition:filter .25s ease;will-change:filter}" +
  ".dr-mark img{width:100%;height:100%}" +
  ".dr-scene[data-on] .dr-mark{filter:blur(2.5px);transition:filter .5s ease 1.05s}" +
  ".dr-board{--dr-p:0;z-index:2;transition:--dr-p .65s cubic-bezier(.3,1.35,.45,1)}" +
  ".dr-board.dr-at{left:calc(50% + (var(--x) + 1.3*var(--dr-p))*var(--u)*var(--dr-k));" +
  "top:calc(50% + (var(--y) - .25*var(--dr-p))*var(--u)*var(--dr-k));" +
  "width:calc(var(--w)*(1 + .1*var(--dr-p))*var(--u)*var(--dr-k));height:calc(var(--h)*(1 + .1*var(--dr-p))*var(--u)*var(--dr-k))}" +
  "@media (hover:hover){.dr-board:hover{--dr-p:.85}}" +
  ".dr-board:focus-visible{--dr-p:.85}" +
  ".dr-board[data-sel]{--dr-p:1;z-index:3}" +
  ".dr-sway{position:absolute;inset:0;z-index:2;transform-origin:50% 46%;transition:filter .25s ease,opacity .4s ease}" +
  "@media (hover:hover){.dr-board:hover .dr-sway{animation:dr-sway 1.1s cubic-bezier(.3,.6,.3,1)}}" +
  ".dr-sway img{position:relative;width:100%;height:100%}" +
  ".dr-shade{position:absolute;left:-14%;right:-14%;top:-3%;bottom:-3%;background:radial-gradient(closest-side,rgba(50,12,14,calc(.3 + .1*var(--dr-p))) 55%,rgba(50,12,14,.12) 80%,transparent);transform:translate(calc((.15 + .9*var(--dr-p))*var(--u)*var(--dr-k)),calc((.3 + 1.2*var(--dr-p))*var(--u)*var(--dr-k)))}" +
  ".dr-scene[data-on] .dr-board:not([data-sel]) .dr-sway{filter:blur(3px);opacity:.9;transition:filter .5s ease 1.05s,opacity .4s ease}" +
  ".dr-clip{position:absolute;z-index:3;top:44%;width:calc(.55*var(--u)*var(--dr-k));height:calc(1.5*var(--u)*var(--dr-k));border-radius:calc(.15*var(--u)*var(--dr-k));background:linear-gradient(90deg,#141414,#3a3636)}" +
  ".dr-clip-l{left:calc(-.35*var(--u)*var(--dr-k))}.dr-clip-r{right:calc(-.35*var(--u)*var(--dr-k))}" +
  ".dr-rod,.dr-knob{position:absolute;z-index:1;opacity:min(1,calc(var(--dr-p)*1.6))}" +
  ".dr-rod{right:50%;top:calc(52% - .22*var(--u)*var(--dr-k));height:calc(.44*var(--u)*var(--dr-k));" +
  "width:calc((var(--w)*(1 + .1*var(--dr-p))/2 + 1.6 + 1.3*var(--dr-p))*var(--u)*var(--dr-k));border-radius:9px;background:linear-gradient(180deg,#3d3a3a,#121111);box-shadow:0 calc(.3*var(--u)*var(--dr-k)) calc(.5*var(--u)*var(--dr-k)) rgba(40,10,10,.3)}" +
  ".dr-knob{left:calc(50% - (var(--w)*(1 + .1*var(--dr-p))/2 + 1.6 + 1.3*var(--dr-p))*var(--u)*var(--dr-k));top:52%;" +
  "width:calc(1.15*var(--u)*var(--dr-k));aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 30%,#5a5555,#0e0d0d 70%);box-shadow:calc(.15*var(--u)*var(--dr-k)) calc(.3*var(--u)*var(--dr-k)) calc(.5*var(--u)*var(--dr-k)) rgba(40,10,10,.35)}" +
  "@keyframes dr-sway{0%{transform:rotate(0)}22%{transform:rotate(-2.6deg)}46%{transform:rotate(1.7deg)}68%{transform:rotate(-.8deg)}86%{transform:rotate(.3deg)}100%{transform:rotate(0)}}" +
  ".dr-top{position:absolute;z-index:6;left:var(--dr-g);right:var(--dr-g);top:var(--dr-g);display:flex;align-items:center;justify-content:space-between;pointer-events:none}" +
  ".dr-brand{font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase}" +
  ".dr-cartpill{pointer-events:auto;display:inline-flex;align-items:center;gap:10px;height:34px;padding:0 6px 0 14px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;" +
  "background:color-mix(in oklab,var(--color-background) 72%,transparent);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--dr-ink) 14%,transparent)}" +
  ".dr-cartpill[data-bump]{animation:dr-bump .6s cubic-bezier(.3,1.6,.5,1)}" +
  ".dr-count{position:relative;display:grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:var(--dr-ink);color:var(--color-background);overflow:hidden;letter-spacing:0;font-variant-numeric:tabular-nums}" +
  ".dr-count span{display:block;animation:dr-roll .5s cubic-bezier(.2,.9,.3,1.2) both}" +
  "@keyframes dr-roll{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}" +
  "@keyframes dr-bump{0%{transform:translateY(0)}35%{transform:translateY(-4px)}70%{transform:translateY(1px)}100%{transform:translateY(0)}}" +
  ".dr-hint{position:absolute;z-index:6;left:50%;bottom:var(--dr-g);transform:translate(-50%,0);font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--dr-soft);white-space:nowrap;transition:opacity .4s ease,transform .4s ease}" +
  ".dr-root[data-on] .dr-hint{opacity:0;transform:translate(-50%,8px)}" +
  ".dr-card{position:absolute;z-index:7;left:46cqw;top:50%;width:min(30rem,38cqw);box-sizing:border-box;padding:clamp(20px,2.4cqw,34px);border-radius:6px;" +
  "background:color-mix(in oklab,var(--color-background) 60%,transparent);backdrop-filter:blur(22px) saturate(1.15);-webkit-backdrop-filter:blur(22px) saturate(1.15);" +
  "box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--color-background) 60%,transparent),0 30px 60px -30px rgba(60,15,15,.35);" +
  "opacity:0;filter:blur(8px);transform:translate(0,calc(-50% + 18px));pointer-events:none;will-change:opacity,filter,transform;" +
  "transition:opacity .28s ease,filter .28s ease,transform .28s ease}" +
  ".dr-card[data-open]{opacity:1;filter:blur(0);transform:translate(0,-50%);pointer-events:auto;" +
  "transition:opacity .55s ease .8s,filter .6s ease .8s,transform .75s cubic-bezier(.2,.8,.2,1) .8s}" +
  "@container dr (max-aspect-ratio:4/5){.dr-card{left:var(--dr-g);right:var(--dr-g);top:auto;bottom:var(--dr-g);width:auto;transform:translate(0,18px)}.dr-card[data-open]{transform:translate(0,0)}}" +
  ".dr-eyebrow{font-size:10px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--dr-soft)}" +
  ".dr-name{margin:.35em 0 0;font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:clamp(2rem,4cqw,3.3rem);line-height:.95;letter-spacing:.01em;text-transform:uppercase}" +
  ".dr-tag{margin:.9em 0 0;font-size:14px;font-weight:500;line-height:1.4}" +
  ".dr-specs{margin:1.1em 0 0;display:grid;grid-template-columns:auto 1fr;column-gap:2em;row-gap:.55em;font-size:13px}" +
  ".dr-specs dt{font-size:9.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--dr-soft);align-self:center}" +
  ".dr-specs dd{margin:0;font-weight:500}" +
  ".dr-buy{margin-top:1.5em;display:flex;align-items:center;justify-content:space-between;gap:16px}" +
  ".dr-price{font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:clamp(1.6rem,2.4cqw,2.1rem);line-height:1;font-variant-numeric:tabular-nums}" +
  ".dr-back{margin-top:1.4em;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--dr-soft);transition:color .2s ease}" +
  ".dr-back:hover{color:var(--dr-ink)}" +
  ".dr-card[data-open] .dr-st{animation:dr-up .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(.85s + var(--i)*55ms)}" +
  "@keyframes dr-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}" +
  ".dr-flip{position:relative;flex:none;width:11.5rem;height:2.9rem;perspective:520px;border-radius:999px}" +
  ".dr-air{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}" +
  ".dr-deck{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(0deg);will-change:transform}" +
  ".dr-face{position:absolute;inset:0;border-radius:999px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}" +
  ".dr-face-top{display:grid;place-items:center;background:linear-gradient(180deg,color-mix(in oklab,var(--dr-ink) 86%,#fff),var(--dr-ink));color:var(--color-background);" +
  "font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 -2px 0 rgba(0,0,0,.25)}" +
  ".dr-face-bot{transform:rotateX(180deg) translateZ(1px);background:#1b1a1a}" +
  ".dr-face-bot img{position:absolute;left:50%;top:50%;width:2.9rem;height:11.5rem;transform:translate(-50%,-50%) rotate(90deg)}" +
  ".dr-truck{position:absolute;top:14%;bottom:14%;width:13%;border-radius:4px;background:linear-gradient(90deg,#b9b9bd,#f1f1f3 50%,#9d9da2);box-shadow:0 1px 2px rgba(0,0,0,.45)}" +
  ".dr-truck::before,.dr-truck::after{content:'';position:absolute;left:-12%;right:-12%;height:28%;border-radius:40%;background:#f4efe6;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}" +
  ".dr-truck::before{top:-26%}.dr-truck::after{bottom:-26%}" +
  ".dr-shadow{position:absolute;left:10%;right:10%;bottom:-9px;height:8px;border-radius:50%;background:rgba(40,12,12,.28);filter:blur(4px)}" +
  ".dr-flip[data-go='on'] .dr-air,.dr-flip[data-go='off'] .dr-air{animation:dr-pop .8s cubic-bezier(.3,.7,.4,1) both}" +
  ".dr-flip[data-go='on'] .dr-deck{animation:dr-kick .8s cubic-bezier(.45,.05,.3,1) both}" +
  ".dr-flip[data-go='off'] .dr-deck{animation:dr-heel .8s cubic-bezier(.45,.05,.3,1) both}" +
  ".dr-flip[data-go] .dr-shadow{animation:dr-shadow .8s cubic-bezier(.3,.7,.4,1) both}" +
  "@keyframes dr-pop{0%{transform:translateY(0)}14%{transform:translateY(3px)}50%{transform:translateY(-34px)}84%{transform:translateY(0)}92%{transform:translateY(2px)}100%{transform:translateY(0)}}" +
  "@keyframes dr-kick{0%,14%{transform:rotateX(0deg) rotateZ(0deg)}50%{transform:rotateX(190deg) rotateZ(-5deg)}84%,100%{transform:rotateX(360deg) rotateZ(0deg)}}" +
  "@keyframes dr-heel{0%,14%{transform:rotateX(0deg) rotateZ(0deg)}50%{transform:rotateX(-190deg) rotateZ(5deg)}84%,100%{transform:rotateX(-360deg) rotateZ(0deg)}}" +
  "@keyframes dr-shadow{0%,14%{transform:scaleX(1);opacity:1}50%{transform:scaleX(.55);opacity:.35}84%,100%{transform:scaleX(1);opacity:1}}" +
  "@media (prefers-reduced-motion:reduce){.dr-scene,.dr-board,.dr-card,.dr-card[data-open],.dr-mark,.dr-sway,.dr-hint{transition-duration:.01s;transition-delay:0s}" +
  ".dr-board:hover .dr-sway,.dr-cartpill[data-bump],.dr-count span,.dr-card[data-open] .dr-st,.dr-flip[data-go] .dr-air,.dr-flip[data-go] .dr-deck,.dr-flip[data-go] .dr-shadow{animation:none}}"

const money = (n: number, c: string) => c + (Number.isInteger(n) ? String(n) : n.toFixed(2))

function KickflipButton({ inCart, image, onToggle }: { inCart: boolean; image: string; onToggle: () => void }) {
  const [go, setGo] = useState("")
  const [label, setLabel] = useState(inCart)
  const timers = useRef([] as number[])
  useEffect(() => {
    if (!go) setLabel(inCart)
  }, [inCart, go])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const click = () => {
    if (go) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    onToggle()
    if (reduce) {
      setLabel(!inCart)
      return
    }
    setGo(inCart ? "off" : "on")
    // the label face is hidden between ~25% and ~75% of the flip: swap it there
    timers.current.push(window.setTimeout(() => setLabel(!inCart), 400))
    timers.current.push(window.setTimeout(() => setGo(""), 820))
  }
  return (
    <button type="button" className="dr-flip" data-go={go || undefined} onClick={click} aria-pressed={inCart}>
      <span className="dr-shadow" />
      <span className="dr-air">
        <span className="dr-deck">
          <span className="dr-face dr-face-top">{label ? "In your cart" : "Add to cart"}</span>
          <span className="dr-face dr-face-bot" aria-hidden>
            <img src={image} alt="" draggable={false} />
            <span className="dr-truck" style={{ left: "17%" }} />
            <span className="dr-truck" style={{ right: "17%" }} />
          </span>
        </span>
      </span>
    </button>
  )
}

export default function DeckRackAddToCart({
  decks = DEFAULT_DECKS,
  wordmarkSrc = IMG_BASE + "wordmark.webp",
  shopName = "Slab Skate Co.",
  currency = "$",
  defaultCart = [],
  onCartChange,
  height = "100svh",
  className = "",
}: DeckRackAddToCartProps) {
  const [sel, setSel] = useState(null as number | null)
  // the card stays mounted (inert while closed) so its frosted layer exists before the first reveal
  const [card, setCard] = useState(0 as number | null)
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState(defaultCart)
  const [bump, setBump] = useState(0)
  const timer = useRef(0)
  const boards = useRef([] as (HTMLButtonElement | null)[])
  const addBtn = useRef(null as HTMLDivElement | null)

  const wait = (ms: number) => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms)

  const focus = (i: number) => {
    if (i === sel && open) return
    window.clearTimeout(timer.current)
    const go = () => {
      setSel(i)
      setCard(i)
      setOpen(true)
    }
    if (open) {
      setOpen(false)
      timer.current = window.setTimeout(go, wait(300))
    } else go()
  }
  const close = () => {
    if (sel === null) return
    window.clearTimeout(timer.current)
    const was = sel
    setOpen(false)
    timer.current = window.setTimeout(() => {
      setSel(null)
      boards.current[was]?.focus({ preventScroll: true })
    }, wait(260))
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  })
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => addBtn.current?.querySelector("button")?.focus({ preventScroll: true }), wait(700))
    return () => window.clearTimeout(t)
  }, [open, card])

  const [shown, setShown] = useState(defaultCart.length)
  const toggle = (id: string) => {
    const next = cart.includes(id) ? cart.filter((x) => x !== id) : [...cart, id]
    setCart(next)
    onCartChange?.(next)
    // the count rolls over as the deck lands, not when it leaves the ground
    window.setTimeout(() => {
      setShown(next.length)
      setBump((b) => b + 1)
    }, wait(640))
  }

  const d = card === null ? null : decks[card]
  const deckW = DECK_H * DECK_RATIO

  return (
    <div className={"dr-root " + className} style={{ height }} data-on={sel !== null ? "" : undefined}>
      <style>{CSS}</style>
      <div
        className="dr-scene"
        data-on={sel !== null ? "" : undefined}
        style={{ "--dr-cx": sel === null ? 0 : decks[sel].x } as React.CSSProperties}
        onClick={close}
      >
        <div className="dr-at dr-arch" style={{ "--x": 0, "--y": -27, "--w": 80, "--h": 76 } as React.CSSProperties} />
        <div className="dr-at dr-mark" style={{ "--x": 0, "--y": 0.5, "--w": MARK_W, "--h": MARK_W * MARK_RATIO } as React.CSSProperties}>
          <img src={wordmarkSrc} alt={shopName} draggable={false} />
        </div>
        {decks.map((deck, i) => (
          <button
            key={deck.id}
            ref={(el) => {
              boards.current[i] = el
            }}
            type="button"
            className="dr-at dr-board"
            data-sel={sel === i ? "" : undefined}
            style={{ "--x": deck.x, "--y": 0, "--w": deckW, "--h": DECK_H } as React.CSSProperties}
            aria-label={deck.name + ", " + money(deck.price, currency) + " — view deck"}
            aria-expanded={sel === i}
            onClick={(e) => {
              e.stopPropagation()
              focus(i)
            }}
          >
            <span className="dr-rod" />
            <span className="dr-knob" />
            <span className="dr-sway">
              <span className="dr-shade" />
              <img src={deck.image} alt="" draggable={false} />
            </span>
            <span className="dr-clip dr-clip-l" />
            <span className="dr-clip dr-clip-r" />
          </button>
        ))}
      </div>

      <div className="dr-top">
        <span className="dr-brand">{shopName}</span>
        <span className="dr-cartpill" key={bump} data-bump={bump ? "" : undefined} aria-live="polite">
          Cart
          <span className="dr-count">
            <span key={shown}>{shown}</span>
          </span>
        </span>
      </div>
      <p className="dr-hint" aria-hidden>
        Pick a deck off the wall
      </p>

      <div className="dr-card" data-open={open ? "" : undefined} role="dialog" aria-label={d ? d.name : "Deck"} aria-hidden={!open} {...(open ? {} : { inert: "" })}>
        {d && card !== null && (
          <div key={d.id}>
            <p className="dr-eyebrow dr-st" style={{ "--i": 0 } as React.CSSProperties}>
              {shopName} · Deck {String(card + 1).padStart(2, "0")}
            </p>
            <h2 className="dr-name dr-st" style={{ "--i": 1 } as React.CSSProperties}>
              {d.name}
            </h2>
            <p className="dr-tag dr-st" style={{ "--i": 2 } as React.CSSProperties}>
              {d.tagline}
            </p>
            <dl className="dr-specs dr-st" style={{ "--i": 3 } as React.CSSProperties}>
              {d.specs.map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="dr-buy dr-st" style={{ "--i": 4 } as React.CSSProperties} ref={addBtn}>
              <span className="dr-price">{money(d.price, currency)}</span>
              <KickflipButton inCart={cart.includes(d.id)} image={d.image} onToggle={() => toggle(d.id)} />
            </div>
            <button type="button" className="dr-back dr-st" style={{ "--i": 5 } as React.CSSProperties} onClick={close}>
              Back to the wall
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
