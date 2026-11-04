"use client"

import { useEffect, useState } from "react"

export type Postcard = {
  /** Place name on the front. */
  place: string
  /** Small line on the front, e.g. "Portugal · 7 nights". */
  meta?: string
  image: string
  alt?: string
  /** The note on the back. */
  message: string
  /** Signature under the note. */
  from?: string
  /** Postmark text, e.g. "LISBOA · 14 JUN". */
  postmark?: string
  price?: string
  cta?: string
  href?: string
}

export type PostcardFlipCardsProps = {
  cards: Postcard[]
  eyebrow?: string
  heading?: string
  description?: string
  height?: string
  className?: string
}

const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif'
const SANS = 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'
const MONO = 'ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace'
const FLIP = "cubic-bezier(.3,1.45,.55,1)"
const EASE = "cubic-bezier(.22,1,.36,1)"
const PAPER =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45 0 0 0 0 .35 0 0 0 0 .2 0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23p)'/></svg>\")"

const CSS =
  ".pfc-stage{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 16px;box-sizing:border-box;background:var(--color-background);color:var(--color-foreground);font-family:" + SANS + "}" +
  ".pfc-head{text-align:center;max-width:640px;margin:0 auto 40px}" +
  ".pfc-eyebrow{font:500 11px/1 " + MONO + ";letter-spacing:.22em;text-transform:uppercase;color:var(--color-muted-foreground);margin:0 0 16px}" +
  ".pfc-h{font:400 clamp(34px,5.6vw,62px)/1 " + SERIF + ";letter-spacing:-.02em;margin:0 0 14px}" +
  ".pfc-h em{font-style:italic}" +
  ".pfc-desc{font:400 15px/1.55 " + SANS + ";color:var(--color-muted-foreground);margin:0}" +
  ".pfc-row{width:100%;display:flex;flex-wrap:wrap;justify-content:center;gap:28px;margin:0;padding:0;list-style:none;perspective:1600px}" +
  ".pfc-item{width:300px;height:420px;animation:pfc-deal 1.1s " + EASE + " both;animation-delay:calc(var(--i) * 120ms + 100ms)}" +
  "@keyframes pfc-deal{from{opacity:0;transform:translateY(50px) rotate(calc(var(--s) * 8deg)) scale(.9)}to{opacity:1;transform:rotate(calc(var(--s) * 1.2deg))}}" +
  ".pfc-card{position:relative;display:block;width:100%;height:100%;padding:0;border:0;background:none;color:inherit;text-align:left;transform-style:preserve-3d;" +
  "transition:transform .95s " + FLIP + ";border-radius:18px}" +
  ".pfc-item[data-flipped=true] .pfc-card{transform:rotateY(180deg)}" +
  ".pfc-turn:focus-visible{outline:2px solid currentColor;outline-offset:2px}" +
  ".pfc-back .pfc-turn{align-self:center;color:#2b2118;background:rgba(43,33,24,.06);border-color:rgba(43,33,24,.2);cursor:pointer}" +
  ".pfc-face{position:absolute;inset:0;border-radius:18px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;" +
  "box-shadow:0 1px 0 rgba(255,255,255,.25) inset,0 0 0 1px rgba(40,25,10,.08),0 30px 50px -24px rgba(30,20,10,.5),0 10px 20px -10px rgba(30,20,10,.3);transition:box-shadow .6s}" +
  ".pfc-item:hover .pfc-face{box-shadow:0 1px 0 rgba(255,255,255,.25) inset,0 0 0 1px rgba(40,25,10,.08),0 44px 70px -26px rgba(30,20,10,.55),0 14px 24px -10px rgba(30,20,10,.3)}" +
  ".pfc-front{background:#1a1612;color:#fff8ee}" +
  ".pfc-front img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;transform:scale(1.04);transition:transform 1.4s " + EASE + "}" +
  ".pfc-item:hover .pfc-front img{transform:scale(1.1)}" +
  ".pfc-front::before{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(14,10,6,.35),rgba(14,10,6,0) 30%,rgba(14,10,6,0) 50%,rgba(14,10,6,.78))}" +
  ".pfc-front::after{content:'';position:absolute;inset:10px;z-index:1;border:1px solid rgba(255,248,238,.45);border-radius:11px;pointer-events:none}" +
  ".pfc-fin{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;justify-content:space-between;padding:26px 24px 24px}" +
  ".pfc-greet{font:500 10.5px/1 " + MONO + ";letter-spacing:.24em;text-transform:uppercase;opacity:.9}" +
  ".pfc-place{font:400 46px/.92 " + SERIF + ";font-style:italic;letter-spacing:-.02em;margin:0 0 10px;text-shadow:0 2px 20px rgba(0,0,0,.35)}" +
  ".pfc-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;font:500 12px/1 " + SANS + ";color:rgba(255,248,238,.82)}" +
  ".pfc-turn{cursor:pointer;color:inherit;display:inline-flex;align-items:center;gap:6px;font:600 11px/1 " + MONO + ";letter-spacing:.08em;text-transform:uppercase;padding:8px 10px;border-radius:999px;background:rgba(255,248,238,.16);border:1px solid rgba(255,248,238,.3);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}" +
  ".pfc-back{transform:rotateY(180deg);color:#2b2118;background-color:#f3eadb;background-image:" + PAPER + ";background-blend-mode:multiply}" +
  ".pfc-back::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:7px;pointer-events:none;" +
  "background:repeating-linear-gradient(135deg,#c8372d 0 12px,#f3eadb 12px 18px,#1f4e8c 18px 30px,#f3eadb 30px 36px);" +
  "-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}" +
  ".pfc-bin{position:absolute;inset:7px;display:grid;grid-template-rows:auto 1fr auto;padding:20px 20px 18px;border-radius:12px}" +
  ".pfc-btop{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}" +
  ".pfc-mark{position:relative;width:86px;height:86px;margin:-4px 0 0 -4px;color:rgba(31,78,140,.72);transform:rotate(-12deg)}" +
  ".pfc-mark svg{width:100%;height:100%;overflow:visible}" +
  ".pfc-stamp{position:relative;flex:none;width:67px;height:85px;padding:6px;box-sizing:border-box;background:#fffaf1;transform:rotate(4deg);" +
  "-webkit-mask:linear-gradient(#000 0 0) content-box,radial-gradient(circle 3px,transparent 96%,#000) -4.5px -4.5px/9px 9px;mask:linear-gradient(#000 0 0) content-box,radial-gradient(circle 3px,transparent 96%,#000) -4.5px -4.5px/9px 9px;" +
  "filter:drop-shadow(0 2px 3px rgba(60,40,20,.25))}" +
  ".pfc-stamp img{width:100%;height:100%;max-width:none;object-fit:cover;display:block}" +
  ".pfc-stamp b{position:absolute;right:8px;bottom:7px;font:700 9px/1 " + MONO + ";color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.6)}" +
  ".pfc-msg{align-self:center;font:italic 400 17px/1.45 " + SERIF + ";color:#3a2c20;margin:0;padding:6px 2px}" +
  ".pfc-msg span{display:block;margin-top:10px;font-size:15px;color:#6a5643}" +
  ".pfc-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;border-top:1px dashed rgba(58,44,32,.28);padding-top:14px}" +
  ".pfc-price{font:400 26px/1 " + SERIF + ";letter-spacing:-.01em}" +
  ".pfc-price small{display:block;font:500 9.5px/1 " + MONO + ";letter-spacing:.16em;text-transform:uppercase;color:#7a6550;margin-bottom:6px}" +
  ".pfc-cta{display:inline-flex;align-items:center;gap:8px;font:600 13px/1 " + SANS + ";color:#fff8ee;background:#c8372d;padding:12px 15px;border-radius:999px;text-decoration:none;" +
  "box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 8px 18px -8px rgba(200,55,45,.8);transition:transform .35s cubic-bezier(.34,1.56,.64,1),background .2s}" +
  ".pfc-cta:hover{transform:translateY(-2px);background:#b02c23}" +
  ".pfc-cta:active{transform:scale(.96)}" +
  ".pfc-cta:focus-visible{outline:2px solid #1f4e8c;outline-offset:3px}" +
  ".pfc-sheen{position:absolute;inset:0;z-index:5;pointer-events:none;border-radius:inherit;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);opacity:0;transform:translateX(-60%)}" +
  ".pfc-item[data-flipped=true] .pfc-back .pfc-sheen,.pfc-item[data-flipped=false][data-touched=true] .pfc-front .pfc-sheen{animation:pfc-sheen 1s " + EASE + " .25s}" +
  "@keyframes pfc-sheen{0%{opacity:0;transform:translateX(-60%)}30%{opacity:1}100%{opacity:0;transform:translateX(60%)}}" +
  ".pfc-hint{margin-top:34px;font:500 11px/1 " + MONO + ";letter-spacing:.2em;text-transform:uppercase;color:var(--color-muted-foreground)}" +
  "@media (max-width:700px){.pfc-item{width:min(320px,100%);height:440px}.pfc-row{gap:22px}}" +
  "@media (prefers-reduced-motion:reduce){.pfc-item{animation:none}.pfc-card{transition:none}.pfc-front img,.pfc-cta{transition:none}.pfc-item[data-flipped] .pfc-sheen{animation:none}}"

function Postmark({ text }: { text: string }) {
  const id = "pfc-arc-" + text.replace(/[^a-z0-9]/gi, "").slice(0, 12)
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id={id} d="M50 50 m-34 0 a34 34 0 1 1 68 0 a34 34 0 1 1 -68 0" />
      </defs>
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <text fontSize="10.5" fontFamily="ui-monospace,monospace" fontWeight="700" letterSpacing="2.2" fill="currentColor">
        <textPath href={"#" + id}>{text}</textPath>
      </text>
      <path d="M78 40c8 0 8 6 16 6s8-6 16-6M78 50c8 0 8 6 16 6s8-6 16-6M78 60c8 0 8 6 16 6s8-6 16-6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <text x="50" y="54" textAnchor="middle" fontSize="11" fontFamily="ui-monospace,monospace" fontWeight="700" fill="currentColor">
        AIR
      </text>
    </svg>
  )
}

export default function PostcardFlipCards({
  cards,
  eyebrow = "Greetings from",
  heading = "Postcards from the season",
  description = "Turn a card over to read where it's been and book the same trip.",
  height = "100svh",
  className = "",
}: PostcardFlipCardsProps) {
  const [hovered, setHovered] = useState(-1)
  const [pinned, setPinned] = useState([] as number[])
  const [canHover, setCanHover] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)")
    const on = () => setCanHover(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  const toggle = (i: number) => setPinned((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))

  return (
    <section className={"pfc-stage " + className} style={{ minHeight: height }}>
      <style>{CSS}</style>
      <header className="pfc-head">
        <p className="pfc-eyebrow">{eyebrow}</p>
        <h2 className="pfc-h">{heading}</h2>
        <p className="pfc-desc">{description}</p>
      </header>
      <ul className="pfc-row">
        {cards.map((c, i) => {
          const flipped = pinned.includes(i) || (canHover && hovered === i)
          return (
            <li
              key={c.place + i}
              className="pfc-item"
              data-flipped={flipped}
              data-touched={pinned.includes(i) || hovered === i}
              style={{ ["--i" as string]: i, ["--s" as string]: i % 2 ? 1 : -1 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(-1)}
            >
              <div className="pfc-card">
                <div className="pfc-face pfc-front" aria-hidden={flipped}>
                  <img src={c.image} alt={c.alt ?? c.place} draggable={false} />
                  <div className="pfc-fin">
                    <span className="pfc-greet">Greetings from</span>
                    <div>
                      <h3 className="pfc-place">{c.place}</h3>
                      <div className="pfc-meta">
                        <span>{c.meta}</span>
                        <button type="button" className="pfc-turn" onClick={() => toggle(i)} aria-pressed={flipped} tabIndex={flipped ? -1 : 0} aria-label={"Turn over the " + c.place + " card"}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M2 4.5h6.5a2 2 0 0 1 0 4H5M4 2.5 2 4.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Turn
                        </button>
                      </div>
                    </div>
                  </div>
                  <i className="pfc-sheen" />
                </div>
                <div className="pfc-face pfc-back" aria-hidden={!flipped}>
                  <div className="pfc-bin">
                    <div className="pfc-btop">
                      <span className="pfc-mark">
                        <Postmark text={(c.postmark ?? c.place.toUpperCase() + " · POSTED") + " · "} />
                      </span>
                      <button
                        type="button"
                        className="pfc-turn"
                        onClick={() => {
                          setHovered(-1)
                          setPinned((p) => p.filter((x) => x !== i))
                        }}
                        tabIndex={flipped ? 0 : -1}
                        aria-label={"Turn the " + c.place + " card back"}
                      >
                        Back
                      </button>
                      <span className="pfc-stamp">
                        <img src={c.image} alt="" draggable={false} />
                        <b>{c.price ? "€" : "✶"}</b>
                      </span>
                    </div>
                    <p className="pfc-msg">
                      {c.message}
                      {c.from && <span>— {c.from}</span>}
                    </p>
                    <div className="pfc-foot">
                      {c.price ? (
                        <div className="pfc-price">
                          <small>From</small>
                          {c.price}
                        </div>
                      ) : (
                        <span />
                      )}
                      <a
                        className="pfc-cta"
                        href={c.href ?? "#"}
                        tabIndex={flipped ? 0 : -1}
                        onClick={c.href ? undefined : (e) => e.preventDefault()}
                      >
                        {c.cta ?? "Book this trip"}
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <i className="pfc-sheen" />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="pfc-hint">{canHover ? "Hover or press Turn" : "Tap Turn to flip"}</p>
    </section>
  )
}
