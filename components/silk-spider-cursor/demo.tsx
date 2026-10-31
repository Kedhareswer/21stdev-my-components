"use client"

import * as React from "react"
import SilkSpiderCursor from "@/components/ui/silk-spider-cursor"

// A personal site in electric klein blue with a spider living on it. Every
// element marked data-silk-anchor is something the silk may stick to.

const NAV = ["index", "toys", "studies", "the shelf", "notes", "say hi"]

export default function Demo() {
  return (
    <main className="ssd-root" style={{ width: "100%" }}>
      <style>{SSD_CSS}</style>

      <header className="ssd-nav">
        <a className="ssd-logo" href="#" data-silk-anchor onClick={(e) => e.preventDefault()}>
          <svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden>
            <rect x="1" y="1" width="24" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M1 6.5h24" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          attic
        </a>
        <nav className="ssd-links">
          {NAV.map((n, i) => (
            <a key={n} href="#" data-silk-anchor className={i === 0 ? "ssd-here" : undefined} onClick={(e) => e.preventDefault()}>
              {n}
            </a>
          ))}
        </nav>
      </header>

      <section className="ssd-hero">
        <h1 className="ssd-word" aria-label="attic">
          {"attic".split("").map((c, i) => (
            <span key={i} data-silk-anchor>
              {c}
            </span>
          ))}
        </h1>

        <img className="ssd-mug" src={MUG} alt="A speckled mug that says still loading" data-silk-anchor width={346} height={360} />
        <Radio />

        <div className="ssd-copy">
          <h2 data-silk-anchor>
            the attic of
            <br />
            half-ideas
          </h2>
          <p data-silk-anchor>Things I built at 2am and couldn't bring myself to delete.</p>
          <p className="ssd-hint">
            <kbd>del</kbd> sweeps the webs
          </p>
        </div>

        <div className="ssd-tee-wrap">
          <svg className="ssd-arrow" width="34" height="74" viewBox="0 0 34 74" fill="none" aria-hidden>
            <path d="M17 2c-1 18 1.5 40-.5 66M6 56c4 5 8 9 11 13 3-5 7-9 11-12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <img className="ssd-tee" src={TEE} alt="A white tee lettered please don't dust, 8 legs live here" data-silk-anchor width={520} height={470} />
        </div>

        <div className="ssd-ticket" data-silk-anchor>
          <div className="ssd-ticket-top">
            <span>ADMIT ONE</span>
            <span>No. 0208</span>
          </div>
          <div className="ssd-ticket-title">small wonders,
            <br />
            open late</div>
          <div className="ssd-ticket-foot">
            <span>row ∞</span>
            <span>seat whichever</span>
          </div>
        </div>
        <img className="ssd-sticker" src={STICKER} alt="Sticker: built at 2am and kept anyway" data-silk-anchor width={300} height={300} />
        <div className="ssd-note" data-silk-anchor>
          <span className="ssd-pin" />
          <b>todo</b>
          <s>fix the nav</s>
          <s>name the spider</s>
          <span>stop feeding the spider</span>
        </div>

      </section>

      <section className="ssd-shelf">
        <h3 data-silk-anchor>lately on the shelf</h3>
        <div className="ssd-cards">
          {SHELF.map((s) => (
            <article key={s.t} className="ssd-card" data-silk-anchor>
              <span className="ssd-card-k">{s.k}</span>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </article>
          ))}
        </div>
        <footer className="ssd-foot" data-silk-anchor>
          <span>kedhar, somewhere between a bug and a feature</span>
          <span>2026</span>
        </footer>
      </section>

      <SilkSpiderCursor bounceColor="#1430f0" seedWebs={18} />
    </main>
  )
}

const SHELF = [
  { k: "toy", t: "a clock that only tells the vibe", d: "Twelve moods, no numbers. Accurate twice a day." },
  { k: "study", t: "what dust looks like in 3D", d: "Particles, light shafts, and one very patient afternoon." },
  { k: "note", t: "why the spider stays", d: "She does better QA than I do. Nobody touches the nav now." },
]

// ---------------------------------------------------------------------------
// The radio: a glassy little player. Play starts a quiet generative synth
// (pads, a soft pluck, vinyl dust); skip changes the station.
// ---------------------------------------------------------------------------

const STATIONS = [
  { name: "2am static", by: "the attic tapes", root: 57, chords: [[0, 3, 7, 10], [-4, 0, 3, 7], [-7, -3, 0, 5], [-2, 2, 5, 9]], bpm: 72, hue: 18 },
  { name: "rain on the skylight", by: "low ceiling", root: 53, chords: [[0, 4, 7, 11], [-3, 0, 4, 9], [2, 5, 9, 12], [-5, -1, 2, 7]], bpm: 64, hue: 205 },
  { name: "dust motes", by: "nobody home", root: 60, chords: [[0, 2, 7, 11], [-5, 2, 4, 7], [-3, 0, 4, 7], [-8, -1, 3, 7]], bpm: 80, hue: 280 },
]

function Radio() {
  const [playing, setPlaying] = React.useState(false)
  const [st, setSt] = React.useState(0)
  const [liked, setLiked] = React.useState(false)
  const audio = React.useRef(null as null | { ctx: AudioContext; master: GainNode; timer: number; step: number })

  const stopSound = () => {
    const a = audio.current
    if (!a) return
    window.clearInterval(a.timer)
    a.master.gain.setTargetAtTime(0, a.ctx.currentTime, 0.25)
    const ctx = a.ctx
    window.setTimeout(() => ctx.close(), 900)
    audio.current = null
  }

  const startSound = (index: number) => {
    stopSound()
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const master = ctx.createGain()
    master.gain.value = 0
    master.gain.setTargetAtTime(0.16, ctx.currentTime, 0.6)
    const lp = ctx.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = 1500
    master.connect(lp).connect(ctx.destination)
    // vinyl dust
    const len = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const ch = buf.getChannelData(0)
    for (let i = 0; i < len; i++) ch[i] = Math.random() < 0.0009 ? (Math.random() - 0.5) * 0.9 : (Math.random() - 0.5) * 0.012
    const dust = ctx.createBufferSource()
    dust.buffer = buf
    dust.loop = true
    const dg = ctx.createGain()
    dg.gain.value = 0.5
    dust.connect(dg).connect(master)
    dust.start()

    const s = STATIONS[index]
    const beat = 60 / s.bpm
    const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12)
    const voice = (freq: number, t: number, dur: number, type: OscillatorType, peak: number, attack: number) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = type
      o.frequency.value = freq
      o.detune.value = (Math.random() - 0.5) * 8
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(peak, t + attack)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g).connect(master)
      o.start(t)
      o.stop(t + dur + 0.05)
    }
    const a = { ctx, master, timer: 0, step: 0 }
    const tick = () => {
      const t = ctx.currentTime + 0.05
      const bar = Math.floor(a.step / 8) % s.chords.length
      const chord = s.chords[bar]
      if (a.step % 8 === 0) for (const n of chord) voice(hz(s.root + n - 12), t, beat * 8.4, "sine", 0.11, beat * 2)
      if (a.step % 8 === 0) voice(hz(s.root + chord[0] - 24), t, beat * 8, "triangle", 0.14, 0.3)
      if (Math.random() < 0.62) {
        const n = chord[(a.step * 3 + (Math.random() < 0.3 ? 1 : 0)) % chord.length] + (a.step % 4 === 3 ? 12 : 0)
        voice(hz(s.root + n), t, beat * 1.6, "triangle", 0.07, 0.008)
      }
      a.step++
    }
    tick()
    a.timer = window.setInterval(tick, beat * 1000)
    audio.current = a
  }

  React.useEffect(() => stopSound, [])

  const toggle = () => {
    if (playing) stopSound()
    else startSound(st)
    setPlaying(!playing)
  }
  const skip = (dir: number) => {
    const n = (st + dir + STATIONS.length) % STATIONS.length
    setSt(n)
    if (playing) startSound(n)
  }
  const s = STATIONS[st]

  return (
    <div className="ssd-radio" data-silk-anchor>
      <div className="ssd-radio-top">
        <div className="ssd-art" style={{ background: "radial-gradient(circle at 70% 30%, hsl(" + (s.hue + 30) + " 95% 75%) 0 14%, transparent 15%), linear-gradient(150deg, hsl(" + s.hue + " 90% 60%), hsl(" + (s.hue + 40) + " 70% 22%))" }} />
        <div className="ssd-radio-meta">
          <b>radio for the mood</b>
          <span>
            {s.name} · {s.by}
          </span>
        </div>
        <button type="button" className={"ssd-heart" + (liked ? " on" : "")} aria-label={liked ? "Unlike" : "Like"} aria-pressed={liked} onClick={() => setLiked(!liked)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.2 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 6 3.7 4.5 7.3C19.5 16.4 12 21 12 21z" />
          </svg>
        </button>
      </div>
      <div className="ssd-bar">
        <span className={"ssd-fill" + (playing ? " run" : "")} key={st} />
      </div>
      <div className="ssd-radio-row">
        <span className={"ssd-live" + (playing ? " on" : "")}>
          <i />
          live
        </span>
        <span className="ssd-station">{st + 1} / {STATIONS.length}</span>
      </div>
      <div className="ssd-controls">
        <button type="button" aria-label="Previous station" onClick={() => skip(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 5 9 12l9 7V5zM6 5v14" /></svg>
        </button>
        <button type="button" className="ssd-play" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
          )}
        </button>
        <button type="button" aria-label="Next station" onClick={() => skip(1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 5 9 7-9 7V5zM18 5v14" /></svg>
        </button>
      </div>
    </div>
  )
}

const SSD_CSS = `
.ssd-root { position: relative; min-height: 100svh; background: #0d22ee; color: #f6f3ec; overflow-x: clip;
  font-family: "Helvetica Neue", "Neue Haas Grotesk Text", Inter, Arial, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.ssd-root a { color: inherit; text-decoration: none; }
.ssd-root img { max-width: none; }
.ssd-nav { position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between; padding: 26px clamp(16px, 4.5vw, 64px) 0; }
.ssd-logo { display: inline-flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 400; letter-spacing: -0.02em; }
.ssd-links { display: flex; gap: clamp(14px, 2.4vw, 38px); font-size: 16px; font-weight: 300; letter-spacing: -0.01em; }
.ssd-links a { opacity: 0.92; transition: opacity .2s; }
.ssd-links a:hover { opacity: 1; }
.ssd-here { text-decoration: line-through !important; text-decoration-thickness: 1.5px !important; }
.ssd-hero { position: relative; height: max(100svh, 820px); margin-top: -64px; }
.ssd-word { position: absolute; left: 50%; top: 4%; transform: translateX(-50%); margin: 0; font-size: min(50vw, 92svh); line-height: 0.82; font-weight: 400; letter-spacing: -0.065em; white-space: nowrap; color: #f4f1ea; user-select: none; }
.ssd-word span { display: inline-block; }
.ssd-mug { position: absolute; left: 14%; top: 37%; width: clamp(96px, 10vw, 150px); height: auto; transform: rotate(-9deg); filter: drop-shadow(10px 18px 14px rgba(0, 6, 60, 0.45)); z-index: 2; }
.ssd-radio { position: absolute; left: 4.5%; top: 47%; width: clamp(250px, 21vw, 300px); padding: 14px 16px 12px; border-radius: 18px; z-index: 2;
  background: linear-gradient(160deg, rgba(255,255,255,0.26), rgba(255,255,255,0.08)); border: 1px solid rgba(255,255,255,0.35);
  backdrop-filter: blur(16px) saturate(1.4); -webkit-backdrop-filter: blur(16px) saturate(1.4);
  box-shadow: 0 24px 50px -18px rgba(0, 4, 60, 0.6), inset 0 1px 0 rgba(255,255,255,0.4); transform: rotate(1.2deg); }
.ssd-radio-top { display: flex; align-items: center; gap: 10px; }
.ssd-art { width: 38px; height: 38px; border-radius: 8px; flex: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25); }
.ssd-radio-meta { display: flex; flex-direction: column; min-width: 0; flex: 1; line-height: 1.25; }
.ssd-radio-meta b { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
.ssd-radio-meta span { font-size: 11.5px; opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ssd-root button { all: unset; cursor: pointer; display: inline-grid; place-items: center; color: #fff; }
.ssd-root button:focus-visible { outline: 2px solid #fff; outline-offset: 3px; border-radius: 999px; }
.ssd-heart { opacity: 0.8; }
.ssd-heart.on { color: #ff6b8b; opacity: 1; }
.ssd-bar { margin-top: 12px; height: 3px; border-radius: 3px; background: rgba(255,255,255,0.22); overflow: hidden; }
.ssd-fill { display: block; height: 100%; width: 34%; background: #fff; border-radius: 3px; }
.ssd-fill.run { animation: ssd-prog 40s linear infinite; }
@keyframes ssd-prog { from { width: 0% } to { width: 100% } }
.ssd-radio-row { display: flex; justify-content: space-between; margin-top: 7px; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.85; }
.ssd-live { display: inline-flex; align-items: center; gap: 6px; }
.ssd-live i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5); }
.ssd-live.on i { background: #ff3b47; box-shadow: 0 0 0 0 rgba(255,59,71,0.6); animation: ssd-live 1.6s ease-out infinite; }
@keyframes ssd-live { 0% { box-shadow: 0 0 0 0 rgba(255,59,71,0.6) } 100% { box-shadow: 0 0 0 8px rgba(255,59,71,0) } }
.ssd-controls { display: flex; justify-content: center; align-items: center; gap: 26px; margin-top: 8px; }
.ssd-controls button { width: 30px; height: 30px; border-radius: 50%; opacity: 0.9; }
.ssd-controls .ssd-play { width: 40px; height: 40px; background: #fff; color: #0d22ee; opacity: 1; box-shadow: 0 6px 16px -6px rgba(0,0,40,0.5); }
.ssd-copy { position: absolute; left: 4.5%; bottom: 4.5%; z-index: 2; max-width: 40vw; }
.ssd-copy h2 { margin: 0; display: inline-block; font-size: clamp(44px, 5.6vw, 92px); line-height: 0.92; font-weight: 500; letter-spacing: -0.055em; }
.ssd-copy p { margin: 18px 0 0; font-size: clamp(14px, 1.15vw, 18px); font-weight: 300; opacity: 0.9; letter-spacing: -0.01em; }
.ssd-tee-wrap { position: absolute; left: 50%; bottom: -3%; transform: translateX(-30%); display: flex; flex-direction: column; align-items: center; z-index: 2; }
.ssd-arrow { margin-bottom: 8px; }
.ssd-tee { width: clamp(150px, 15vw, 230px); height: auto; transform: rotate(-4deg); filter: drop-shadow(8px 16px 14px rgba(0, 6, 60, 0.42)); }
.ssd-ticket { position: absolute; right: 6%; top: 50%; width: 220px; padding: 14px 16px; z-index: 2; color: #2a2116; background: #f5ecd8; border-radius: 6px; transform: rotate(7deg);
  box-shadow: 0 22px 40px -16px rgba(0,4,60,0.6); background-image: radial-gradient(circle at 0 50%, #0d22ee 9px, transparent 10px), radial-gradient(circle at 100% 50%, #0d22ee 9px, transparent 10px);
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
.ssd-ticket-top, .ssd-ticket-foot { display: flex; justify-content: space-between; font-size: 10px; letter-spacing: 0.12em; opacity: 0.8; }
.ssd-ticket-title { margin: 12px 0; padding: 10px 0; border-top: 1.5px dashed rgba(42,33,22,0.4); border-bottom: 1.5px dashed rgba(42,33,22,0.4); font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 24px; line-height: 1.05; letter-spacing: -0.02em; }
.ssd-sticker { position: absolute; right: 21%; top: 66%; width: clamp(90px, 8.5vw, 128px); height: auto; transform: rotate(-12deg); filter: drop-shadow(4px 8px 6px rgba(0, 6, 60, 0.4)); z-index: 2; }
.ssd-note { position: absolute; right: 4%; bottom: 7%; width: 190px; padding: 22px 18px 16px; display: flex; flex-direction: column; gap: 6px; z-index: 2;
  background: #fff7a8; color: #2b2a1a; transform: rotate(-3deg); box-shadow: 0 18px 30px -14px rgba(0,4,60,0.55);
  font-family: "Ink Free", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive; font-size: 17px; }
.ssd-note b { font-size: 20px; }
.ssd-note s { opacity: 0.55; }
.ssd-pin { position: absolute; top: -8px; left: 50%; width: 16px; height: 16px; margin-left: -8px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #ff8b8b, #c0141e); box-shadow: 0 3px 4px rgba(0,0,0,0.35); }
.ssd-hint { margin: 22px 0 0; font-size: 12px; letter-spacing: 0.04em; opacity: 0.75; z-index: 2; white-space: nowrap; }
.ssd-hint kbd { display: inline-block; padding: 2px 7px; margin-right: 4px; border: 1px solid rgba(255,255,255,0.55); border-bottom-width: 2px; border-radius: 5px; font: inherit; font-size: 11px; }
.ssd-shelf { position: relative; padding: 120px clamp(16px, 4.5vw, 64px) 40px; z-index: 2; }
.ssd-shelf h3 { display: inline-block; margin: 0 0 32px; font-size: clamp(30px, 3.4vw, 54px); font-weight: 500; letter-spacing: -0.05em; }
.ssd-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(14px, 2vw, 28px); }
.ssd-card { padding: 22px 22px 26px; border-radius: 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.22); }
.ssd-card-k { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.7; }
.ssd-card h4 { margin: 34px 0 10px; font-size: 24px; font-weight: 500; letter-spacing: -0.035em; line-height: 1.05; }
.ssd-card p { margin: 0; font-size: 14px; font-weight: 300; opacity: 0.85; line-height: 1.45; }
.ssd-foot { display: flex; justify-content: space-between; margin-top: 90px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.25); font-size: 13px; font-weight: 300; opacity: 0.85; }
@media (max-width: 760px) {
  .ssd-links { display: none; }
  .ssd-hero { height: max(100svh, 720px); }
  .ssd-word { top: 14%; font-size: 72vw; }
  .ssd-mug { left: 8%; top: 13%; width: 82px; }
  .ssd-radio { left: 5%; top: 41%; width: 220px; }
  .ssd-copy { max-width: 90vw; bottom: 17%; }
  .ssd-tee-wrap { left: 50%; transform: translateX(-50%); bottom: -4%; }
  .ssd-tee { width: 110px; }
  .ssd-arrow { height: 48px; }
  .ssd-ticket { right: -12%; top: 27%; width: 170px; transform: rotate(9deg) scale(0.78); }
  .ssd-sticker { right: 5%; top: 47%; width: 74px; }
  .ssd-note, .ssd-hint { display: none; }
  .ssd-cards { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .ssd-fill.run, .ssd-live.on i { animation: none; }
}
`

const MUG = "data:image/webp;base64,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"
const TEE = "data:image/webp;base64,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"
const STICKER = "data:image/webp;base64,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"
