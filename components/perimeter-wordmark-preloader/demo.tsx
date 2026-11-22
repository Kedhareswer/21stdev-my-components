"use client"

import * as React from "react"
import PerimeterWordmarkPreloader from "@/components/ui/perimeter-wordmark-preloader"

const IMG = "https://kedhar-components.pages.dev/perimeter-wordmark-preloader/red-coat.webp"

const LINKS = ["About", "Practice", "Team", "Journal", "Contact"]
const LEDE = "We like a clear brief, love a hard build, and a tight deadline only sharpens us. A small studio that ships more than it talks."

/* The page under the preloader. Its sizes are container units of the
 * preloader's own stage, and it borrows the stage's gutter (--pwp-g), bottom
 * inset (--pwp-iy) and letter size (--pwp-fs) so it lines up with the word. */
const CSS =
  ".pwpd-page{position:absolute;inset:0;display:flex;flex-direction:column;background:#000;color:#fff;padding:0 var(--pwp-g) var(--pwp-iy);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}" +
  ".pwpd-nav{display:grid;grid-template-columns:33.6cqw 1fr auto;align-items:start;padding-top:max(12px,1.5cqw);font-size:max(12px,1.2cqw);line-height:1.2;font-weight:500;letter-spacing:-.01em}" +
  ".pwpd-logo{display:grid;gap:.25em;justify-items:start;font-weight:400;letter-spacing:.34em;font-size:max(13px,1.55cqw);line-height:1}" +
  ".pwpd-logo small{font-size:.5em;letter-spacing:.5em;opacity:.85}" +
  ".pwpd-links{display:flex;gap:1.5cqw;margin:0;padding:0;list-style:none}" +
  ".pwpd-side{display:flex;gap:1.6cqw;align-items:baseline}" +
  ".pwpd-side span{opacity:.6}" +
  ".pwpd-replay{appearance:none;border:0;background:none;padding:0;margin:0;font:inherit;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:.25em}" +
  ".pwpd-replay:focus-visible{outline:2px solid #fff;outline-offset:4px}" +
  ".pwpd-main{flex:1 1 0;min-height:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-end}" +
  ".pwpd-col{width:39cqw;display:flex;flex-direction:column;gap:min(7.2cqw,9cqh)}" +
  ".pwpd-lede{margin:0;font-size:max(15px,2.45cqw);line-height:1.04;font-weight:600;letter-spacing:-.035em;text-wrap:pretty}" +
  ".pwpd-w{display:inline-block;white-space:pre}" +
  ".pwpd-c{color:rgba(255,255,255,.2);transition:color .12s linear}" +
  ".pwpd-lede[data-on=true] .pwpd-c{color:#fff}" +
  ".pwpd-shot{position:relative;width:100%;height:min(21.6cqw,38cqh);overflow:hidden;background:#0b0b0b}" +
  ".pwpd-shot img{display:block;width:100%;height:100%;max-width:none;object-fit:cover;object-position:70% 30%}" +
  "@container (max-aspect-ratio:1/1){" +
  ".pwpd-nav{grid-template-columns:1fr auto}.pwpd-links{display:none}.pwpd-side{gap:5cqw}" +
  ".pwpd-main{padding-bottom:calc(var(--pwp-fs) * .72 + 7cqw);align-items:stretch}" +
  ".pwpd-col{width:auto;gap:6cqw}" +
  ".pwpd-lede{font-size:max(17px,5.4cqw)}" +
  ".pwpd-shot{height:min(52cqw,30cqh)}" +
  "}" +
  "@media (prefers-reduced-motion:reduce){.pwpd-c{transition:none}}"

const settings = {
  text: "NOIR",
  duration: 3400,
}

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props }
  const [run, setRun] = React.useState(0)
  const [shown, setShown] = React.useState(false)

  const replay = () => {
    setShown(false)
    setRun((r) => r + 1)
  }

  let at = 0
  const words = LEDE.split(" ")

  return (
    <PerimeterWordmarkPreloader key={run} text={s.text} duration={s.duration} onReveal={() => setShown(true)}>
      <style>{CSS}</style>
      <div className="pwpd-page">
        <header className="pwpd-nav">
          <div className="pwpd-logo" aria-label={s.text + " studio"}>
            <span aria-hidden="true">{s.text}</span>
            <small aria-hidden="true">STUDIO</small>
          </div>
          <ul className="pwpd-links">
            {LINKS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <div className="pwpd-side">
            <button type="button" className="pwpd-replay" onClick={replay} aria-label="Replay preloader">
              Replay
            </button>
            <span>En</span>
          </div>
        </header>

        <main className="pwpd-main">
          <div className="pwpd-col">
            <p className="pwpd-lede" data-on={shown} aria-label={LEDE}>
              {words.map((w, i) => (
                <span key={i} className="pwpd-w" aria-hidden="true">
                  {Array.from(w + (i < words.length - 1 ? " " : "")).map((ch, j) => {
                    const delay = 260 + at++ * 10
                    return (
                      <span key={j} className="pwpd-c" style={{ transitionDelay: shown ? delay + "ms" : "0ms" }}>
                        {ch}
                      </span>
                    )
                  })}
                </span>
              ))}
            </p>
            <div className="pwpd-shot">
              <img
                src={IMG}
                alt="A woman in a red coat looking down, lit against a black backdrop"
                width={1280}
                height={720}
                style={{ maxWidth: "none" }}
              />
            </div>
          </div>
        </main>
      </div>
    </PerimeterWordmarkPreloader>
  )
}
