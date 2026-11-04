"use client"
import { useEffect, useRef, useState } from "react"

/**
 * Orbit Social Bento — a four-card bento for a community product, in warm
 * apricot, sage and sky. A member count rolls up over rings of people that
 * orbit a pulsing centre; an inbox deck deals a new notification to the front
 * every few seconds; a reaction bar pops one emoji after another; a chat card
 * types, then lands its message. All motion is CSS transforms on slow timers;
 * nothing reads layout.
 */

export type Notice = { app: string; title: string; body: string; time: string; tint?: string }

export interface OrbitSocialBentoProps {
  members?: number
  memberLabel?: string
  /** Initials orbiting the centre, outer rings last. */
  people?: string[]
  notices?: Notice[]
  reactions?: string[]
  message?: { from: string; text: string }
  /** Ms between inbox deals. */
  interval?: number
  className?: string
}

// #region deck
/** Rank of item `i` after `offset` deals: 0 is the front card. */
export function rank(i: number, offset: number, n: number) {
  return n <= 0 ? 0 : (((i + offset) % n) + n) % n
}
/** Hash a name to one of the palette's hues so a person keeps their colour. */
export function hueOf(name: string, count: number) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return count > 0 ? h % count : 0
}
export function compact(n: number) {
  return Math.round(n).toLocaleString("en-US")
}
// #endregion

const SPRING =
  "linear(0,0.009,0.035 2.1%,0.141,0.281 6.7%,0.723 12.9%,0.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,0.991,0.977 51%,0.974 53.8%,0.975 57.1%,0.997 69.8%,1.003 76.9%,1)"
const AV = ["#f97352", "#3f9b6e", "#4b7bd8", "#c0569d", "#d99a1e", "#6b5bd2", "#1f9fb0"]

const CSS = [
  ".osb-root{position:relative;width:100%;max-width:1040px;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto;gap:14px;color:#2b211c;",
  "font-family:'Inter Tight','Inter',ui-sans-serif,system-ui,sans-serif}",
  ".osb-card{position:relative;overflow:hidden;isolation:isolate;border-radius:26px;padding:24px;",
  "box-shadow:0 0 0 1px rgba(80,50,30,.08),0 1px 0 rgba(255,255,255,.8) inset,0 24px 50px -28px rgba(120,70,40,.35),0 6px 14px -8px rgba(120,70,40,.18);",
  "opacity:0;transform:translateY(20px) scale(.98);transition:opacity .6s,transform .9s " + SPRING + ";transition-delay:calc(var(--i)*90ms)}",
  ".osb-in .osb-card{opacity:1;transform:none}",
  ".osb-card:before{content:'';position:absolute;inset:0;z-index:-1;opacity:.35;mix-blend-mode:multiply;pointer-events:none;",
  "background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .4 0 0 0 0 .3 0 0 0 .25 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")}",
  ".osb-a{grid-row:span 2;background:radial-gradient(90% 60% at 50% 62%,#fff3e6,transparent 70%),linear-gradient(170deg,#ffe2c9,#ffd0ae 60%,#f9bf98);display:flex;flex-direction:column}",
  ".osb-b{grid-column:span 2;background:linear-gradient(160deg,#e3eedc,#cfe2c5);display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:18px;align-items:center;min-height:250px}",
  ".osb-c{background:linear-gradient(160deg,#f8efe4,#efe2d0)}",
  ".osb-d{background:linear-gradient(160deg,#dfe8f6,#cbdaf0)}",
  ".osb-top{display:flex;justify-content:space-between;align-items:center}",
  ".osb-chip{display:inline-flex;align-items:center;gap:7px;padding:5px 10px 5px 8px;border-radius:99px;background:rgba(255,255,255,.65);font-size:12px;font-weight:600;box-shadow:0 0 0 1px rgba(80,50,30,.08)}",
  ".osb-chip i{width:7px;height:7px;border-radius:50%;background:#22a565;box-shadow:0 0 0 3px rgba(34,165,101,.2);animation:osb-ping 2s ease-out infinite}",
  ".osb-brand{font-size:12px;font-weight:700;letter-spacing:-.01em;opacity:.7}",
  ".osb-h{font-family:'Fraunces','Iowan Old Style','Palatino Linotype',Georgia,serif;font-size:27px;line-height:1.12;letter-spacing:-.02em;font-weight:500;margin-top:18px}",
  ".osb-h b{font-weight:700;font-variant-numeric:tabular-nums;display:block;font-size:40px;letter-spacing:-.035em}",
  ".osb-h span{color:rgba(43,33,28,.55)}",
  ".osb-orbit{position:relative;flex:1;min-height:300px;display:grid;place-items:center;margin:8px -8px}",
  ".osb-ring{position:absolute;left:50%;top:50%;border-radius:50%;border:1.5px dashed rgba(120,70,40,.22);animation:osb-spin var(--t) linear infinite;animation-direction:var(--dir)}",
  ".osb-dot{position:absolute;left:50%;top:0;width:var(--s);height:var(--s);margin:calc(var(--s)/-2) 0 0 calc(var(--s)/-2);transform-origin:50% calc(50% + var(--r));transform:rotate(var(--a))}",
  ".osb-av{width:100%;height:100%;border-radius:50%;display:grid;place-items:center;font-size:calc(var(--s)*.36);font-weight:700;color:#fff;background:var(--c);",
  "box-shadow:0 0 0 3px #fff7ef,0 6px 12px -4px rgba(80,40,20,.45);transform:rotate(calc(var(--a)*-1));animation:osb-counter var(--t) linear infinite;animation-direction:var(--rdir)}",
  ".osb-core{position:relative;width:82px;height:82px;border-radius:50%;display:grid;place-items:center;font-size:26px;font-weight:700;color:#fff;background:radial-gradient(circle at 30% 25%,#ff9a76,#e2553a);",
  "box-shadow:0 0 0 6px #fff7ef,0 16px 30px -10px rgba(200,70,40,.6)}",
  ".osb-core:before,.osb-core:after{content:'';position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(226,85,58,.5);animation:osb-wave 2.6s ease-out infinite}",
  ".osb-core:after{animation-delay:1.3s}",
  ".osb-foot{font-family:'Fraunces','Iowan Old Style','Palatino Linotype',Georgia,serif;font-size:22px;line-height:1.15;letter-spacing:-.02em}",
  ".osb-foot span{color:rgba(43,33,28,.5)}",
  ".osb-deck{position:relative;height:200px}",
  ".osb-note{position:absolute;left:0;right:0;bottom:0;display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:16px;background:#fffdf9;",
  "box-shadow:0 0 0 1px rgba(60,80,50,.08),0 12px 24px -14px rgba(40,60,30,.45);transform-origin:50% 0;",
  "transform:translateY(calc(var(--k)*-34px)) scale(calc(1 - var(--k)*.06));z-index:calc(10 - var(--k));background:color-mix(in oklab,#fffdf9 calc(100% - var(--k)*9%),#cfe2c5);",
  "transition:transform .8s " + SPRING + ",opacity .5s,filter .5s;filter:blur(calc(var(--k)*.6px))}",
  ".osb-note>*{opacity:calc(1 - var(--k)*.4);transition:opacity .5s}",
  ".osb-note[data-gone]{opacity:0;transform:translateY(-130px) scale(.8)}",
  ".osb-ic{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:700;background:var(--c);box-shadow:0 6px 12px -6px var(--c)}",
  ".osb-nm{min-width:0;flex:1}",
  ".osb-app{font-size:11px;color:rgba(43,33,28,.45);font-weight:600}",
  ".osb-nt{font-size:14px;font-weight:650;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".osb-nb{font-size:12.5px;color:rgba(43,33,28,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".osb-time{align-self:flex-start;font-size:11px;color:rgba(43,33,28,.4);display:flex;align-items:center;gap:6px}",
  ".osb-time i{width:7px;height:7px;border-radius:50%;background:#4b7bd8}",
  ".osb-copy{font-family:'Fraunces','Iowan Old Style','Palatino Linotype',Georgia,serif;font-size:25px;line-height:1.18;letter-spacing:-.02em}",
  ".osb-copy span{color:rgba(43,33,28,.45)}",
  ".osb-sub{font-size:13px;color:rgba(43,33,28,.55);margin-top:12px;line-height:1.5;font-family:inherit}",
  ".osb-bar{display:flex;gap:4px;margin-top:22px;padding:6px;border-radius:18px;background:rgba(255,255,255,.75);width:max-content;max-width:100%;box-shadow:0 0 0 1px rgba(80,50,30,.08),0 12px 24px -16px rgba(80,50,30,.5)}",
  ".osb-emo{position:relative;appearance:none;border:0;background:transparent;cursor:pointer;width:42px;height:42px;border-radius:12px;font-size:22px;line-height:1;display:grid;place-items:center;transition:transform .45s " + SPRING + ",background .2s}",
  ".osb-emo:hover,.osb-emo[data-on]{transform:translateY(-6px) scale(1.28);background:rgba(255,200,150,.35)}",
  ".osb-emo:focus-visible{outline:2px solid #e2553a;outline-offset:1px}",
  ".osb-plus{position:absolute;left:50%;top:-6px;font-size:11px;font-weight:700;color:#e2553a;pointer-events:none;opacity:0;transform:translate(-50%,0)}",
  ".osb-emo[data-on] .osb-plus{animation:osb-float 1.2s ease-out both}",
  ".osb-msg{margin-top:18px;padding:14px;border-radius:18px;background:#fffdf9;box-shadow:0 0 0 1px rgba(40,60,90,.08),0 16px 30px -18px rgba(40,60,90,.5)}",
  ".osb-who{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:650}",
  ".osb-who .osb-av{width:28px;height:28px;font-size:11px;animation:none;transform:none;box-shadow:none}",
  ".osb-txt{font-size:13px;line-height:1.5;color:rgba(43,33,28,.7);margin-top:9px;min-height:58px}",
  ".osb-txt[data-show]{animation:osb-rise .5s " + SPRING + " both}",
  ".osb-typing{display:inline-flex;gap:4px;padding:9px 12px;border-radius:12px;background:rgba(75,123,216,.12)}",
  ".osb-typing i{width:6px;height:6px;border-radius:50%;background:#4b7bd8;animation:osb-bob 1s ease-in-out infinite}",
  ".osb-typing i:nth-child(2){animation-delay:.15s}.osb-typing i:nth-child(3){animation-delay:.3s}",
  ".osb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@keyframes osb-spin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}",
  "@keyframes osb-counter{from{transform:rotate(calc(var(--a)*-1))}to{transform:rotate(calc(var(--a)*-1 - 360deg))}}",
  "@keyframes osb-ping{0%{box-shadow:0 0 0 0 rgba(34,165,101,.5)}100%{box-shadow:0 0 0 8px rgba(34,165,101,0)}}",
  "@keyframes osb-wave{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.9);opacity:0}}",
  "@keyframes osb-float{0%{opacity:0;transform:translate(-50%,6px)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-22px)}}",
  "@keyframes osb-rise{0%{opacity:0;transform:translateY(8px);filter:blur(3px)}100%{opacity:1;transform:none;filter:none}}",
  "@keyframes osb-bob{50%{transform:translateY(-4px);opacity:.5}}",
  "@media (max-width:900px){.osb-root{grid-template-columns:1fr 1fr}.osb-a{grid-row:auto;grid-column:span 2}.osb-b{grid-column:span 2}}",
  "@media (max-width:600px){.osb-root{grid-template-columns:1fr;gap:10px}.osb-a,.osb-b{grid-column:auto}.osb-b{grid-template-columns:1fr}.osb-card{padding:20px;border-radius:22px}.osb-h b{font-size:34px}}",
  "@media (prefers-reduced-motion:reduce){.osb-root *,.osb-root *:before,.osb-root *:after{animation:none!important;transition:none!important}.osb-card{opacity:1;transform:none}}",
].join("")

const RINGS = [
  { r: 56, t: "26s", dir: "normal", s: 30 },
  { r: 92, t: "38s", dir: "reverse", s: 34 },
  { r: 126, t: "52s", dir: "normal", s: 28 },
]

export default function OrbitSocialBento({
  members = 48210,
  memberLabel = "builders in 92 countries",
  people = ["AK", "JM", "SR", "LT", "NO", "PV", "EH", "DY", "RB", "CW", "MI"],
  notices = [
    { app: "Design review", title: "Ana left 3 notes on Onboarding v4", body: "“Tighten the step two copy, the rest is lovely.”", time: "now", tint: "#c0569d" },
    { app: "Releases", title: "Build 2.18 shipped to everyone", body: "Changelog posted in #announcements", time: "2m", tint: "#3f9b6e" },
    { app: "Calendar", title: "Community call in 15 minutes", body: "Topic: plugin API, bring questions", time: "8m", tint: "#4b7bd8" },
    { app: "Mentions", title: "Jun mentioned you in #help", body: "“Can you share the export snippet?”", time: "12m", tint: "#d99a1e" },
    { app: "Payouts", title: "Bounty #214 paid out", body: "$400 to Sami for the CSV importer", time: "21m", tint: "#f97352" },
  ],
  reactions = ["😂", "🏆", "👏", "🔥", "🎉", "💛"],
  message = { from: "Rafa Oduya", text: "Saw your talk at the meetup, the bit on local-first sync finally made it click for me. Coffee next week?" },
  interval = 2800,
  className = "",
}: OrbitSocialBentoProps) {
  const root = useRef(null as HTMLDivElement | null)
  const [seen, setSeen] = useState(false)
  const [count, setCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [pop, setPop] = useState(-1)
  const [typing, setTyping] = useState(true)
  const n = notices.length

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!seen) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) {
      setCount(members)
      setTyping(false)
      return
    }
    // Count-up: eased over 1.6 s, state only, no layout.
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1600)
      setCount(members * (1 - Math.pow(1 - p, 4)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const deal = window.setInterval(() => setOffset((o) => o + 1), interval)
    let e = 0
    const react = window.setInterval(() => setPop(e++ % reactions.length), 1500)
    let typer = 0
    const chat = () => {
      setTyping(true)
      typer = window.setTimeout(() => setTyping(false), 1800)
    }
    chat()
    const loop = window.setInterval(chat, 7000)
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(deal)
      window.clearInterval(react)
      window.clearInterval(loop)
      window.clearTimeout(typer)
    }
  }, [seen, members, interval, reactions.length])

  let p = 0
  return (
    <div ref={root} className={"osb-root " + (seen ? "osb-in " : "") + className}>
      <style>{CSS}</style>

      <section className="osb-card osb-a" style={{ ["--i" as string]: 0 }}>
        <div className="osb-top">
          <span className="osb-chip">
            <i aria-hidden="true" />
            Online now
          </span>
          <span className="osb-brand">orbit.club</span>
        </div>
        <div className="osb-h">
          <span className="osb-sr">
            {compact(members)} {memberLabel}
          </span>
          <span aria-hidden="true" style={{ color: "inherit" }}>
            <b>{compact(count)}</b>
            {memberLabel}
          </span>
        </div>
        <div className="osb-orbit" aria-hidden="true">
          {RINGS.map((ring, ri) => {
            const per = ri === 0 ? 3 : 4
            const dots = people.slice(p, p + per)
            p += per
            return (
              <div
                key={ri}
                className="osb-ring"
                style={{
                  width: ring.r * 2,
                  height: ring.r * 2,
                  transform: "translate(-50%,-50%)",
                  ["--t" as string]: ring.t,
                  ["--dir" as string]: ring.dir,
                }}
              >
                {dots.map((who, di) => (
                  <span
                    key={who + di}
                    className="osb-dot"
                    style={{ ["--r" as string]: ring.r + "px", ["--a" as string]: (360 / dots.length) * di + ri * 25 + "deg", ["--s" as string]: ring.s + "px" }}
                  >
                    <span
                      className="osb-av"
                      style={{ ["--c" as string]: AV[hueOf(who, AV.length)], ["--t" as string]: ring.t, ["--rdir" as string]: ring.dir }}
                    >
                      {who}
                    </span>
                  </span>
                ))}
              </div>
            )
          })}
          <span className="osb-core">✦</span>
        </div>
        <div className="osb-foot">
          Meet everyone, <span>all at once.</span>
        </div>
      </section>

      <section className="osb-card osb-b" style={{ ["--i" as string]: 1 }}>
        <div>
          <div className="osb-copy">
            An inbox that <span>sorts itself</span> before you open it.
          </div>
          <div className="osb-sub">Reviews, releases and mentions arrive grouped and ranked, newest at the front.</div>
        </div>
        <div className="osb-deck" aria-live="polite">
          {notices.map((x, i) => {
            const k = rank(i, offset, n)
            return (
              <div key={x.title} className="osb-note" style={{ ["--k" as string]: Math.min(k, 3) }} data-gone={k > 2 ? "" : undefined} aria-hidden={k !== 0}>
                <span className="osb-ic" style={{ ["--c" as string]: x.tint || AV[i % AV.length] }} aria-hidden="true">
                  {x.app.slice(0, 2)}
                </span>
                <span className="osb-nm">
                  <span className="osb-app" style={{ display: "block" }}>
                    {x.app}
                  </span>
                  <span className="osb-nt" style={{ display: "block" }}>
                    {x.title}
                  </span>
                  <span className="osb-nb" style={{ display: "block" }}>
                    {x.body}
                  </span>
                </span>
                <span className="osb-time">
                  {x.time}
                  {k === 0 && <i aria-hidden="true" />}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="osb-card osb-c" style={{ ["--i" as string]: 2 }}>
        <div className="osb-copy">
          Say it with <span>the perfect reaction.</span>
        </div>
        <div className="osb-bar" role="group" aria-label="Reactions">
          {reactions.map((r, i) => (
            <button key={r} type="button" className="osb-emo" data-on={pop === i ? "" : undefined} aria-label={"React " + r} onClick={() => setPop(i)}>
              <span aria-hidden="true">{r}</span>
              <span className="osb-plus" aria-hidden="true">
                +1
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="osb-card osb-d" style={{ ["--i" as string]: 3 }}>
        <div className="osb-copy">
          Messages that <span>feel personal.</span>
        </div>
        <div className="osb-msg">
          <div className="osb-who">
            <span className="osb-av" style={{ ["--c" as string]: AV[hueOf(message.from, AV.length)] }} aria-hidden="true">
              {message.from
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </span>
            {message.from}
          </div>
          <div className="osb-txt" data-show={typing ? undefined : ""} aria-live="polite">
            {typing ? (
              <span className="osb-typing" aria-label={message.from + " is typing"}>
                <i />
                <i />
                <i />
              </span>
            ) : (
              message.text
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
