"use client"
import { useEffect, useRef, useState } from "react"

/**
 * Aurora Feature Bento — three feature cards over slow-drifting aurora light,
 * each holding a small live interface in frosted glass. The first types a
 * prompt and fires a shimmering Generate button, the second is a field of
 * tool tiles that swell under the pointer like a dock, and the third shows two
 * teammates' cursors wandering a shared form. The aurora is CSS transforms on
 * blurred blobs; the typing is a slow interval. Nothing reads layout.
 */

export type BentoFeature = { title: string; description: string }

export interface AuroraFeatureBentoProps {
  features?: [BentoFeature, BentoFeature, BentoFeature]
  /** What the first card types. Wrap words in *stars* to bold them. */
  prompt?: string
  /** Tool names shown as tiles in the second card (up to 15). */
  tools?: string[]
  /** Two collaborator names for the third card's cursors. */
  people?: [string, string]
  className?: string
}

// #region type
/** Splits "a *b* c" into [{text, bold}] runs. */
export function runs(s: string) {
  return s.split("*").map((text, i) => ({ text, bold: i % 2 === 1 })).filter((r) => r.text)
}
/** The first `n` visible characters of the runs, keeping their weight. */
export function sliceRuns(r: { text: string; bold: boolean }[], n: number) {
  const out: { text: string; bold: boolean }[] = []
  let left = Math.max(0, n)
  for (const x of r) {
    if (left <= 0) break
    out.push({ text: x.text.slice(0, left), bold: x.bold })
    left -= x.text.length
  }
  return out
}
export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
}
// #endregion

const SPRING =
  "linear(0,0.009,0.035 2.1%,0.141,0.281 6.7%,0.723 12.9%,0.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,0.991,0.977 51%,0.974 53.8%,0.975 57.1%,0.997 69.8%,1.003 76.9%,1)"

const CSS = [
  ".afb-root{position:relative;width:100%;max-width:1080px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:14px;border-radius:30px;color:#eef3ff;",
  "font-family:'Inter Tight','Inter',ui-sans-serif,system-ui,sans-serif;background:#070a14;box-shadow:0 0 0 1px rgba(150,180,255,.08) inset,0 40px 90px -40px rgba(0,0,0,.8)}",
  ".afb-card{position:relative;overflow:hidden;isolation:isolate;border-radius:20px;min-height:420px;display:flex;flex-direction:column;justify-content:flex-end;padding:22px;",
  "background:#0c1122;box-shadow:0 0 0 1px rgba(150,180,255,.1) inset,0 1px 0 rgba(255,255,255,.08) inset;",
  "opacity:0;transform:translateY(24px);filter:blur(6px);transition:opacity .7s,transform 1s " + SPRING + ",filter .7s;transition-delay:calc(var(--i)*110ms)}",
  ".afb-in .afb-card{opacity:1;transform:none;filter:none}",
  ".afb-sky{position:absolute;inset:-30%;z-index:-2;pointer-events:none}",
  ".afb-sky i{position:absolute;width:60%;height:60%;border-radius:50%;filter:blur(48px);opacity:.75;animation:afb-drift 16s ease-in-out infinite alternate}",
  ".afb-sky i:nth-child(1){left:5%;top:10%;background:var(--a)}",
  ".afb-sky i:nth-child(2){right:0;top:30%;background:var(--b);animation-duration:21s;animation-delay:-6s}",
  ".afb-sky i:nth-child(3){left:25%;bottom:0;background:var(--c);opacity:.5;animation-duration:26s;animation-delay:-11s}",
  ".afb-card:after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(7,10,20,0) 30%,rgba(7,10,20,.55) 62%,rgba(7,10,20,.92));pointer-events:none}",
  ".afb-ui{position:absolute;left:18px;right:18px;top:18px}",
  ".afb-glass{border-radius:16px;background:rgba(14,19,36,.55);backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);",
  "box-shadow:0 0 0 1px rgba(200,220,255,.12) inset,0 1px 0 rgba(255,255,255,.12) inset,0 20px 40px -20px rgba(0,0,0,.7)}",
  ".afb-t{font-size:20px;font-weight:650;letter-spacing:-.025em}",
  ".afb-d{font-size:13.5px;line-height:1.5;color:rgba(238,243,255,.62);margin-top:8px;max-width:30ch}",
  ".afb-avatar{width:30px;height:30px;border-radius:50%;margin-left:auto;display:grid;place-items:center;background:rgba(255,255,255,.08);box-shadow:0 0 0 1px rgba(255,255,255,.14) inset}",
  ".afb-bubble{margin-top:10px;padding:14px 16px;font-size:14px;line-height:1.5;color:rgba(238,243,255,.7);min-height:88px}",
  ".afb-bubble b{color:#fff;font-weight:650}",
  ".afb-caret{display:inline-block;width:2px;height:1em;margin-left:1px;vertical-align:-2px;background:#9fd8ff;animation:afb-blink 1s steps(1) infinite}",
  ".afb-ask{display:flex;align-items:center;gap:10px;margin-top:10px;padding:8px 8px 8px 16px;font-size:13.5px;color:rgba(238,243,255,.4)}",
  ".afb-gen{position:relative;overflow:hidden;margin-left:auto;appearance:none;border:0;cursor:pointer;height:38px;padding:0 14px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;",
  "font-family:inherit;font-size:13.5px;font-weight:650;color:#04121c;background:linear-gradient(180deg,#8fe3ff,#38bdf8);",
  "box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 8px 20px -6px rgba(56,189,248,.8);transition:transform .3s " + SPRING + ",box-shadow .3s}",
  ".afb-gen:hover{transform:translateY(-1px);box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 12px 26px -6px rgba(56,189,248,.95)}",
  ".afb-gen:active{transform:scale(.95)}",
  ".afb-gen:focus-visible,.afb-tile:focus-visible{outline:2px solid #9fd8ff;outline-offset:2px}",
  ".afb-gen:before{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.75) 50%,transparent 70%);transform:translateX(-120%)}",
  ".afb-fire .afb-gen:before{animation:afb-sheen .9s ease}",
  ".afb-kbd{font-size:10.5px;font-weight:600;padding:3px 6px;border-radius:6px;background:rgba(4,18,28,.14)}",
  ".afb-tools{padding:14px}",
  ".afb-th{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:rgba(238,243,255,.75);padding:0 2px 12px}",
  ".afb-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}",
  ".afb-tile{appearance:none;border:0;cursor:pointer;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;color:var(--t);background:rgba(255,255,255,.06);",
  "box-shadow:0 0 0 1px rgba(255,255,255,.1) inset,0 6px 12px -8px rgba(0,0,0,.8);transition:transform .45s " + SPRING + ",background .3s,box-shadow .3s}",
  ".afb-tile svg{width:46%;height:46%}",
  ".afb-grid:hover .afb-tile{transform:scale(.92)}",
  ".afb-grid .afb-tile:hover,.afb-grid .afb-tile:focus-visible{transform:scale(1.22);background:color-mix(in oklab,var(--t) 22%,rgba(255,255,255,.06));box-shadow:0 0 0 1px color-mix(in oklab,var(--t) 50%,transparent) inset,0 10px 24px -8px var(--t)}",
  ".afb-tip{display:flex;justify-content:space-between;font-size:11.5px;color:rgba(238,243,255,.45);padding:12px 2px 0}",
  ".afb-tip b{color:#fff;font-weight:600}",
  ".afb-lbl{font-size:12px;font-weight:600;color:rgba(238,243,255,.7);margin:2px 0 8px 2px}",
  ".afb-field{position:relative;height:46px;display:flex;align-items:center;padding:0 14px;font-size:13.5px;color:rgba(238,243,255,.4)}",
  ".afb-field .afb-caret{margin:0 8px 0 0;background:#fda4af}",
  ".afb-row{display:flex;align-items:center;gap:12px;margin-top:10px;padding:12px 14px}",
  ".afb-ic{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.08);box-shadow:0 0 0 1px rgba(255,255,255,.12) inset}",
  ".afb-row b{display:block;font-size:13.5px;font-weight:600}",
  ".afb-row span{font-size:12px;color:rgba(238,243,255,.5)}",
  ".afb-sw{margin-left:auto;width:34px;height:20px;border-radius:99px;background:#34d399;position:relative;box-shadow:0 0 12px -2px #34d399}",
  ".afb-sw:after{content:'';position:absolute;top:2px;right:2px;width:16px;height:16px;border-radius:50%;background:#fff}",
  ".afb-cur{position:absolute;left:0;top:0;pointer-events:none;display:flex;align-items:flex-start;gap:2px;animation:var(--path) 9s ease-in-out infinite}",
  ".afb-cur svg{flex:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}",
  ".afb-tag{margin-top:14px;padding:4px 9px;border-radius:99px;font-size:11.5px;font-weight:650;color:#fff;background:var(--k);box-shadow:0 6px 14px -6px var(--k);white-space:nowrap}",
  ".afb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@keyframes afb-drift{0%{transform:translate(0,0) scale(1)}50%{transform:translate(12%,-8%) scale(1.15)}100%{transform:translate(-10%,10%) scale(.95)}}",
  "@keyframes afb-blink{50%{opacity:0}}",
  "@keyframes afb-sheen{to{transform:translateX(120%)}}",
  "@keyframes afb-p1{0%,100%{transform:translate(190px,-4px)}30%{transform:translate(206px,44px)}55%{transform:translate(70px,62px)}80%{transform:translate(130px,10px)}}",
  "@keyframes afb-p2{0%,100%{transform:translate(24px,98px)}35%{transform:translate(140px,112px)}60%{transform:translate(176px,32px)}85%{transform:translate(70px,72px)}}",
  "@media (max-width:860px){.afb-root{grid-template-columns:1fr;padding:10px;gap:10px;border-radius:24px}.afb-card{min-height:460px}}",
  "@media (prefers-reduced-motion:reduce){.afb-root *,.afb-root *:before{animation:none!important;transition:none!important}.afb-card{opacity:1;transform:none;filter:none}}",
].join("")

const GLYPHS = [
  "M12 3l9 16H3z",
  "M5 5h14v14H5z",
  "M12 2l8.7 5v10L12 22l-8.7-5V7z",
  "M13 2L4 14h7l-1 8 9-12h-7z",
  "M3 12c3-6 6-6 9 0s6 6 9 0",
  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",
  "M4 4h7v7H4zM13 13h7v7h-7z",
  "M12 2v20M2 12h20",
  "M6 3h12l-6 9 6 9H6l6-9z",
  "M4 18L12 4l8 14M8 12h8",
  "M3 6h18M3 12h12M3 18h6",
  "M12 4a8 8 0 0 1 8 8h-8z M12 12v8a8 8 0 0 1-8-8z",
  "M5 19V9l7-5 7 5v10z",
  "M4 12a8 8 0 0 1 16 0 8 8 0 0 1-16 0zM9 9h.01M15 9h.01M8.5 14.5a5 5 0 0 0 7 0",
  "M3 17l5-5 4 4 9-9",
]
const TINTS = ["#fb7185", "#f8fafc", "#a78bfa", "#fbbf24", "#38bdf8", "#34d399", "#f472b6", "#e2e8f0", "#c084fc", "#f97316", "#60a5fa", "#22d3ee", "#facc15", "#a3e635", "#818cf8"]

function Sky({ a, b, c }: { a: string; b: string; c: string }) {
  return (
    <span className="afb-sky" style={{ ["--a" as string]: a, ["--b" as string]: b, ["--c" as string]: c }} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}

export default function AuroraFeatureBento({
  features = [
    { title: "Forms that write themselves", description: "Describe the flow you need and get a working form, steps and validation included." },
    { title: "Every tool, one canvas", description: "Pipe answers into the apps your team already runs, with no glue code to maintain." },
    { title: "Build it together", description: "See teammates edit live, leave notes in place and ship the same version." },
  ],
  prompt = "Add a *step that asks for company size* before the *pricing question*, and skip it for students.",
  tools = ["Relay", "Grid", "Hive", "Bolt", "Wave", "Orbit", "Stack", "Plus", "Hour", "Peak", "Lines", "Pie", "Barn", "Mood", "Trend"],
  people = ["Meera Shah", "Theo Lund"],
  className = "",
}: AuroraFeatureBentoProps) {
  const root = useRef(null as HTMLDivElement | null)
  const [seen, setSeen] = useState(false)
  const [typed, setTyped] = useState(0)
  const [run, setRun] = useState(0)
  const [fire, setFire] = useState(false)
  const [tool, setTool] = useState(-1)
  const r = runs(prompt)
  const total = r.reduce((s, x) => s + x.text.length, 0)

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

  // Types the prompt a character at a time, then presses Generate.
  useEffect(() => {
    if (!seen) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(total)
      return
    }
    setTyped(0)
    setFire(false)
    let n = 0
    let done = 0
    const id = window.setInterval(() => {
      n += 1
      setTyped(n)
      if (n >= total) {
        window.clearInterval(id)
        done = window.setTimeout(() => setFire(true), 450)
      }
    }, 38)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(done)
    }
  }, [seen, run, total])

  const shown = sliceRuns(r, typed)
  const tiles = tools.slice(0, 15)

  return (
    <div ref={root} className={"afb-root " + (seen ? "afb-in " : "") + (fire ? "afb-fire " : "") + className}>
      <style>{CSS}</style>

      <section className="afb-card" style={{ ["--i" as string]: 0 }}>
        <Sky a="#1d4ed8" b="#22d3ee" c="#6366f1" />
        <div className="afb-ui">
          <div className="afb-avatar" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </div>
          <div className="afb-glass afb-bubble" aria-hidden="true">
            {shown.map((x, i) => (x.bold ? <b key={i}>{x.text}</b> : <span key={i}>{x.text}</span>))}
            {typed < total && <span className="afb-caret" />}
          </div>
          <span className="afb-sr">{r.map((x) => x.text).join("")}</span>
          <div className="afb-glass afb-ask">
            Ask anything…
            <button type="button" className="afb-gen" onClick={() => setRun((v) => v + 1)} aria-label="Generate again">
              Generate <span className="afb-kbd">Enter ↵</span>
            </button>
          </div>
        </div>
        <div className="afb-t">{features[0].title}</div>
        <div className="afb-d">{features[0].description}</div>
      </section>

      <section className="afb-card" style={{ ["--i" as string]: 1 }}>
        <Sky a="#7c3aed" b="#2563eb" c="#db2777" />
        <div className="afb-ui afb-glass afb-tools">
          <div className="afb-th">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="3" width="7" height="7" rx="2" />
              <rect x="3" y="14" width="7" height="7" rx="2" />
              <rect x="14" y="14" width="7" height="7" rx="2" />
            </svg>
            Integrations
          </div>
          <div className="afb-grid" onPointerLeave={() => setTool(-1)}>
            {tiles.map((t, i) => (
              <button
                key={t + i}
                type="button"
                className="afb-tile"
                aria-label={t}
                style={{ ["--t" as string]: TINTS[i % TINTS.length] }}
                onPointerEnter={() => setTool(i)}
                onFocus={() => setTool(i)}
                onBlur={() => setTool(-1)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={GLYPHS[i % GLYPHS.length]} />
                </svg>
              </button>
            ))}
          </div>
          <div className="afb-tip" aria-live="polite">
            <span>{tool >= 0 ? <b>{tiles[tool]}</b> : tiles.length + " connected"}</span>
            <span>{tool >= 0 ? "Synced 2 min ago" : "Hover a tool"}</span>
          </div>
        </div>
        <div className="afb-t">{features[1].title}</div>
        <div className="afb-d">{features[1].description}</div>
      </section>

      <section className="afb-card" style={{ ["--i" as string]: 2 }}>
        <Sky a="#0ea5e9" b="#f43f5e" c="#8b5cf6" />
        <div className="afb-ui" aria-hidden="true">
          <div className="afb-lbl">Work email</div>
          <div className="afb-glass afb-field">
            <span className="afb-caret" />
            you@company.com
          </div>
          <div className="afb-glass afb-row">
            <span className="afb-ic">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            <span>
              <b>Access settings</b>
              Only the team can edit
            </span>
            <span className="afb-sw" />
          </div>
          {people.map((p, i) => (
            <span key={p} className="afb-cur" style={{ ["--path" as string]: i ? "afb-p2" : "afb-p1", ["--k" as string]: i ? "#f97316" : "#0ea5e9" }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M4 3l16 7-7 2-3 7z" fill={i ? "#f97316" : "#0ea5e9"} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
              <span className="afb-tag">{p.split(" ")[0] + " · " + initials(p)}</span>
            </span>
          ))}
        </div>
        <div className="afb-t">{features[2].title}</div>
        <div className="afb-d">{features[2].description}</div>
      </section>
    </div>
  )
}
