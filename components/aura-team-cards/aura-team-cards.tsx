"use client"

import { useEffect, useState } from "react"

export type AuraMember = {
  name: string
  role: string
  photo: string
  bio?: string
  /** Two short facts shown when the card opens, e.g. [["Based", "Lisbon"], ["Since", "2019"]]. */
  facts?: [string, string][]
  /** The aura: two colours that bloom behind the portrait. */
  colors?: [string, string]
  links?: { label: string; href: string }[]
}

export type AuraTeamCardsProps = {
  members: AuraMember[]
  eyebrow?: string
  heading?: string
  /** Second half of the heading, set in a muted tone. */
  headingMuted?: string
  /** Index of the card that starts open; -1 for none. */
  defaultActive?: number
  height?: string
  className?: string
}

const PALETTE: [string, string][] = [
  ["#7c5cff", "#ff6ad5"],
  ["#ff8a3d", "#ffd23f"],
  ["#2bd3c6", "#3d7bff"],
  ["#ff4d6d", "#ffb3c1"],
  ["#9be15d", "#00b4a6"],
]

const SANS = 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'
const MONO = 'ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace'
const EASE = "cubic-bezier(.22,1,.36,1)"
const SPRING = "cubic-bezier(.34,1.56,.64,1)"
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.95' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

const CSS =
  ".atc-stage{display:flex;flex-direction:column;justify-content:center;align-items:center;padding:56px 16px;box-sizing:border-box;background:var(--color-background);color:var(--color-foreground);font-family:" + SANS + "}" +
  ".atc-head{width:100%;max-width:1120px;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:34px}" +
  ".atc-eyebrow{display:inline-flex;align-items:center;gap:10px;font:500 11px/1 " + MONO + ";letter-spacing:.2em;text-transform:uppercase;color:var(--color-muted-foreground);margin:0 0 16px}" +
  ".atc-eyebrow i{width:22px;height:1px;background:currentColor}" +
  ".atc-h{font:700 clamp(38px,7vw,84px)/.9 " + SANS + ";letter-spacing:-.055em;margin:0}" +
  ".atc-h span{color:var(--color-muted-foreground);font-weight:600}" +
  ".atc-hint{flex:none;font:500 12px/1.5 " + SANS + ";color:var(--color-muted-foreground);max-width:22ch;text-align:right;margin:0}" +
  ".atc-touch{display:none}" +
  "@media (hover:none){.atc-hover{display:none}.atc-touch{display:inline}}" +
  ".atc-row{width:100%;max-width:1120px;display:flex;gap:12px;margin:0;padding:0;list-style:none}" +
  ".atc-card{--a1:#7c5cff;--a2:#ff6ad5;position:relative;flex:1 1 0;min-width:0;border-radius:30px;overflow:hidden;isolation:isolate;cursor:default;outline:none;color:#fff;" +
  "background:linear-gradient(180deg,#141418,#0b0b0e);box-shadow:0 1px 0 rgba(255,255,255,.09) inset,0 0 0 1px rgba(255,255,255,.06),0 30px 60px -30px rgba(10,10,20,.6);" +
  "transition:flex-grow .8s " + EASE + ",transform .6s " + SPRING + ",box-shadow .6s,filter .6s;animation:atc-in 1s " + EASE + " both;animation-delay:calc(var(--i) * 90ms + 120ms)}" +
  "@keyframes atc-in{from{opacity:0;transform:translateY(40px) rotate(calc(var(--s) * 3deg)) scale(.94)}to{opacity:1;transform:none}}" +
  ".atc-card[data-active=true]{flex-grow:1.85;transform:translateY(-6px);box-shadow:0 1px 0 rgba(255,255,255,.14) inset,0 0 0 1px rgba(255,255,255,.1),0 50px 80px -30px color-mix(in srgb,var(--a1) 55%,transparent)}" +
  ".atc-row[data-any=true] .atc-card[data-active=false]{filter:saturate(.55) brightness(.82)}" +
  ".atc-card:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 5px var(--a1)}" +
  ".atc-aura{position:absolute;inset:0;z-index:-1;pointer-events:none}" +
  ".atc-aura i{position:absolute;border-radius:50%;filter:blur(38px);transition:transform 1.1s " + EASE + ",opacity .8s}" +
  ".atc-aura i:nth-child(1){width:120%;height:70%;left:-30%;bottom:-28%;background:radial-gradient(closest-side,var(--a1),transparent);opacity:.75;animation:atc-drift 9s ease-in-out infinite alternate}" +
  ".atc-aura i:nth-child(2){width:90%;height:60%;right:-35%;bottom:-20%;background:radial-gradient(closest-side,var(--a2),transparent);opacity:.55;animation:atc-drift 11s ease-in-out infinite alternate-reverse}" +
  ".atc-aura i:nth-child(3){width:70%;height:40%;left:15%;bottom:-30%;background:radial-gradient(closest-side,rgba(255,255,255,.9),transparent);opacity:0}" +
  ".atc-card[data-active=true] .atc-aura i:nth-child(1){transform:translateY(-34%) scale(1.25);opacity:.95}" +
  ".atc-card[data-active=true] .atc-aura i:nth-child(2){transform:translate(-18%,-30%) scale(1.3);opacity:.85}" +
  ".atc-card[data-active=true] .atc-aura i:nth-child(3){transform:translateY(-20%);opacity:.22}" +
  "@keyframes atc-drift{from{translate:0 0}to{translate:8% -6%}}" +
  ".atc-card::after{content:'';position:absolute;inset:0;z-index:3;pointer-events:none;background-image:" + GRAIN + ";opacity:.09;mix-blend-mode:overlay}" +
  ".atc-card::before{content:'';position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:inherit;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.14) 45%,transparent 60%);transform:translateX(-120%);transition:transform 1.2s " + EASE + "}" +
  ".atc-card[data-active=true]::before{transform:translateX(120%)}" +
  ".atc-in{position:relative;z-index:1;display:flex;flex-direction:column;height:100%;padding:24px 24px 22px;box-sizing:border-box}" +
  ".atc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}" +
  ".atc-idx{font:500 11px/1 " + MONO + ";letter-spacing:.1em;color:rgba(255,255,255,.42)}" +
  ".atc-dot{width:8px;height:8px;border-radius:50%;background:var(--a1);box-shadow:0 0 0 4px color-mix(in srgb,var(--a1) 25%,transparent),0 0 14px var(--a1)}" +
  ".atc-name{font:650 clamp(19px,1.9vw,24px)/1.08 " + SANS + ";letter-spacing:-.025em;margin:18px 0 6px}" +
  ".atc-role{font:400 13.5px/1.35 " + SANS + ";color:rgba(255,255,255,.62);margin:0}" +
  ".atc-bio{width:min(300px,calc(100vw - 96px));margin-top:22px;opacity:0;transform:translateY(14px);transition:opacity .35s,transform .6s " + EASE + ";pointer-events:none}" +
  ".atc-card[data-active=true] .atc-bio{opacity:1;transform:none;transition-delay:.18s;pointer-events:auto}" +
  ".atc-bio p{font:400 14px/1.55 " + SANS + ";color:rgba(255,255,255,.8);margin:0 0 16px}" +
  ".atc-facts{display:flex;gap:22px;margin:0}" +
  ".atc-facts div{display:flex;flex-direction:column;gap:5px}" +
  ".atc-facts dt{font:500 10px/1 " + MONO + ";letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.45)}" +
  ".atc-facts dd{margin:0;font:600 14px/1 " + SANS + "}" +
  ".atc-foot{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:12px}" +
  ".atc-photo{position:relative;flex:none;width:76px;height:76px;border-radius:22px;overflow:hidden;transform-origin:0 100%;transition:transform .8s " + SPRING + ",border-radius .8s " + EASE + ";" +
  "box-shadow:0 0 0 1.5px rgba(255,255,255,.22),0 16px 30px -12px rgba(0,0,0,.7)}" +
  ".atc-photo img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;filter:grayscale(.35) contrast(1.05);transition:filter .8s}" +
  ".atc-card[data-active=true] .atc-photo{transform:scale(1.42);border-radius:26px}" +
  ".atc-card[data-active=true] .atc-photo img{filter:none}" +
  ".atc-links{display:flex;gap:6px;opacity:0;transform:translateY(10px);transition:opacity .3s,transform .6s " + SPRING + "}" +
  ".atc-card[data-active=true] .atc-links{opacity:1;transform:none;transition-delay:.26s}" +
  ".atc-links a{font:600 11.5px/1 " + SANS + ";color:#fff;text-decoration:none;padding:9px 11px;border-radius:999px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:background .2s,transform .3s " + SPRING + "}" +
  ".atc-links a:hover{background:rgba(255,255,255,.24);transform:translateY(-2px)}" +
  ".atc-links a:focus-visible{outline:2px solid #fff;outline-offset:2px}" +
  "@media (max-width:760px){.atc-head{flex-direction:column;align-items:flex-start}.atc-hint{text-align:left}" +
  ".atc-row{overflow-x:auto;scroll-snap-type:x mandatory;padding:8px 16px 18px;margin:0 -16px;width:calc(100% + 32px);scrollbar-width:none}" +
  ".atc-card,.atc-card[data-active=true]{flex:0 0 80%;scroll-snap-align:center;transform:none}" +
  ".atc-row[data-any=true] .atc-card[data-active=false]{filter:none}" +
  ".atc-bio,.atc-links{opacity:1;transform:none;pointer-events:auto}.atc-bio{width:auto}}" +
  "@media (prefers-reduced-motion:reduce){.atc-card,.atc-aura i,.atc-bio,.atc-links,.atc-photo,.atc-photo img,.atc-card::before,.atc-links a{transition:none;animation:none}}"

export default function AuraTeamCards({
  members,
  eyebrow = "The team",
  heading = "Small team,",
  headingMuted = "long memory.",
  defaultActive = -1,
  height = "100svh",
  className = "",
}: AuraTeamCardsProps) {
  const [active, setActive] = useState(defaultActive)

  useEffect(() => {
    // Touch screens have no hover: the first card stays open so the details show.
    const mq = window.matchMedia("(hover: none)")
    if (mq.matches && defaultActive < 0) setActive(0)
  }, [defaultActive])

  return (
    <section className={"atc-stage " + className} style={{ minHeight: height }} aria-label={eyebrow}>
      <style>{CSS}</style>
      <header className="atc-head">
        <div>
          <p className="atc-eyebrow">
            <i aria-hidden="true" />
            {eyebrow}
          </p>
          <h2 className="atc-h">
            {heading} <span>{headingMuted}</span>
          </h2>
        </div>
        <p className="atc-hint">
          <span className="atc-hover">Hover a card, or tab through, to meet the person behind it.</span>
          <span className="atc-touch">Swipe to meet the people behind it.</span>
        </p>
      </header>
      <ul className="atc-row" data-any={active >= 0} onMouseLeave={() => setActive(defaultActive)} style={{ height: 460 }}>
        {members.map((m, i) => {
          const [a1, a2] = m.colors ?? PALETTE[i % PALETTE.length]
          const on = i === active
          return (
            <li
              key={m.name + i}
              className="atc-card"
              data-active={on}
              tabIndex={0}
              aria-label={m.name + ", " + m.role}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              style={{ ["--a1" as string]: a1, ["--a2" as string]: a2, ["--i" as string]: i, ["--s" as string]: i % 2 ? 1 : -1 }}
            >
              <div className="atc-aura" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="atc-in">
                <div className="atc-top">
                  <span className="atc-idx">{(i < 9 ? "0" : "") + (i + 1)}</span>
                  <span className="atc-dot" aria-hidden="true" />
                </div>
                <h3 className="atc-name">{m.name}</h3>
                <p className="atc-role">{m.role}</p>
                {(m.bio || m.facts) && (
                  <div className="atc-bio" aria-hidden={!on}>
                    {m.bio && <p>{m.bio}</p>}
                    {m.facts && (
                      <dl className="atc-facts">
                        {m.facts.map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                )}
                <div className="atc-foot">
                  <span className="atc-photo">
                    <img src={m.photo} alt={m.name} draggable={false} />
                  </span>
                  {m.links && m.links.length > 0 && (
                    <div className="atc-links">
                      {m.links.map((l) => (
                        <a key={l.label} href={l.href} tabIndex={on ? 0 : -1} aria-label={l.label + ", " + m.name}>
                          {l.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
