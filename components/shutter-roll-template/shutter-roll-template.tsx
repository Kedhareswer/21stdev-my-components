"use client"

// Shutter Roll — a full-page template for a film-camera app that Kedhareswer builds.
// A dot-matrix counter winds the roll, a slit shutter opens on a table of instant prints,
// the scroll dives into one print until it fills the screen, folds it into a phone, flips
// through four film looks, then a torn sheet of night pulls up the party albums.
// One file: fonts are embedded subsets, pictures come from the deployed catalogue.
import React, { useEffect, useRef, useState } from "react"

const BASE = "https://kedhar-components.pages.dev/shutter-roll-template/"
const img = (k: string) => BASE + k + ".webp"
const EMAIL = "kedhareswer.12110626@gmail.com"

export type ShutterRollTemplateProps = {
  /** Height of one pinned screen. Must be a definite length: no percentages. */
  height?: string
  /** Show the winding counter before the page opens. */
  preloader?: boolean
  className?: string
}

// Prints on the table: centre x/y in % of the stage, width in units of --u (1% of the larger side), tilt.
// d is depth for the pointer parallax.
const PRINTS = [
  { k: "snap-1", x: 12.5, y: 22, w: 9.7, r: 16, d: 0.6 },
  { k: "snap-2", x: 25.8, y: 9.2, w: 6.2, r: -3, d: 0.3 },
  { k: "snap-3", x: 37.9, y: 17, w: 7.6, r: 16, d: 0.5 },
  { k: "snap-4", x: 52.6, y: 12.2, w: 6.9, r: -9, d: 0.4 },
  { k: "snap-5", x: 30.1, y: 35.3, w: 7.6, r: -12, d: 0.7 },
  { k: "snap-6", x: 11.6, y: 45.2, w: 9.7, r: 7, d: 0.8 },
  { k: "snap-7", x: 62, y: 42.8, w: 8.1, r: -12, d: 0.7 },
  { k: "snap-8", x: 81.4, y: 20.4, w: 8.1, r: 11, d: 0.5 },
  { k: "snap-9", x: 92.4, y: 39.4, w: 7.1, r: 6, d: 0.6 },
  { k: "snap-2", x: 81.1, y: 51.6, w: 9.7, r: -15, d: 0.9 },
  { k: "party-5", x: 45, y: 51, w: 6.6, r: 9, d: 0.45 },
]
// the print the scroll dives into
const TARGET = { x: 46.6, y: 36, w: 6.9, r: -2 }
const PROPS = [
  { k: "camera", x: 66.5, y: 17.6, w: 15.5, r: 0, d: 0.5 },
  { k: "can-1", x: 23.4, y: 22, w: 5.6, r: -14, d: 0.6 },
  { k: "can-2", x: 75.6, y: 36.6, w: 4.8, r: 18, d: 0.7 },
]

// The four film looks the phone flips through.
const STOCKS = [
  { a: "GOLDEN", b: "200", pic: "friends", alt: "Four friends laughing under a blue sky", note: "Honey light, even at midnight.", bg: "radial-gradient(120% 90% at 18% 30%,#5b5c3c 0%,#45462d 45%,#2c2d1e 100%)", ink: "#ece8dc", nav: "dark", look: "sepia(.18) saturate(1.25) contrast(1.05) brightness(1.03)" },
  { a: "CHROME", b: "400", pic: "snap-3", alt: "Two friends hugging on a sunny street", note: "Cool, crisp and a little too sharp.", bg: "radial-gradient(120% 90% at 30% 35%,#a29f9c 0%,#8b8886 50%,#6c6a69 100%)", ink: "#f3f1ec", nav: "dark", look: "saturate(.85) hue-rotate(-12deg) contrast(1.15) brightness(1.04)" },
  { a: "INSTANT", b: "600", pic: "snap-8", alt: "Friends leaning out of a car window", note: "Square, faded, honest to a fault.", bg: "radial-gradient(120% 90% at 40% 30%,#f4f3f0 0%,#e6e5e1 55%,#d3d2cd 100%)", ink: "#33342a", nav: "light", look: "saturate(.7) contrast(.86) brightness(1.12) sepia(.12)" },
  { a: "SINGLE", b: "USE", pic: "party-1", alt: "Two friends in bucket hats shouting in a flash selfie", note: "Grainy, glowy, zero second takes.", bg: "radial-gradient(120% 90% at 22% 30%,#707057 0%,#5f5e46 50%,#47463a 100%)", ink: "#ece8dc", nav: "dark", look: "saturate(1.35) contrast(1.22) brightness(.98)" },
]

// 5 x 6 dot-matrix digits for the winding counter
const DIGITS = [
  "011101000110001100011000101110",
  "001000110000100001000010001110",
  "011101000100011001100110011111",
  "111100000101110000010000111110",
  "001100101010010111110001000010",
  "111111000011110000010000111110",
  "011101000011110100011000101110",
  "111110000100010001000100001000",
  "011101000101110100011000101110",
  "011101000110001011110000101110",
]

// Scroll script of the pinned reel, in screens (multiples of the height prop).
// #region timeline
export const REEL = { screens: 10.4, diveFrom: 0.15, diveTo: 2.2, photoTo: 2.6, foldTo: 3.6, stockLen: 1, stocks: 4, ejectFrom: 8.4, ejectTo: 9.4 }
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const smooth = (v: number) => { const t = clamp01(v); return t * t * (3 - 2 * t) }
export function reelState(s: number) {
  const dt = clamp01((s - REEL.diveFrom) / (REEL.diveTo - REEL.diveFrom))
  const dive = smooth(dt)
  const fold = smooth((s - REEL.photoTo) / (REEL.foldTo - REEL.photoTo))
  const raw = Math.floor((s - REEL.foldTo) / REEL.stockLen)
  const stock = raw < 0 ? -1 : Math.min(REEL.stocks - 1, raw)
  const eject = clamp01((s - REEL.ejectFrom) / (REEL.ejectTo - REEL.ejectFrom))
  return { dive, fold, stock, eject }
}
// scale of the table when the dive is at e (0..1): geometric, front-loaded, so the print fills the height mid-dive
export function diveScale(e: number, full: number) { const g = 1 - Math.pow(1 - e, 1.6); return Math.exp(Math.log(full) * g) }
// #endregion

// a deterministic jagged edge for the torn sheet
function tornPolygon(seed: number) {
  let a = seed
  const rnd = () => { a = (a * 9301 + 49297) % 233280; return a / 233280 }
  const pts: string[] = []
  let y = 50
  for (let x = 0; x <= 100; x += 0.5) { y += (rnd() - 0.5) * 16 + (50 - y) * 0.12; pts.push(x.toFixed(2) + "% " + Math.max(8, Math.min(92, y + (rnd() > 0.93 ? rnd() * 18 : 0))).toFixed(1) + "%") }
  return "polygon(0% 100%," + pts.join(",") + ",100% 100%)"
}
const TORN = tornPolygon(7)
const RIM = tornPolygon(7).replace(/ (\d+(\.\d+)?)%/g, (_m, n) => " " + Math.max(0, Number(n) - 9).toFixed(1) + "%")

// a decorative join code: three finder squares plus a seeded field
function codeCells() {
  const n = 11
  let a = 41
  const rnd = () => { a = (a * 9301 + 49297) % 233280; return a / 233280 }
  const cells: { x: number; y: number; on: boolean; delay: number }[] = []
  const finder = (x: number, y: number, ox: number, oy: number) => {
    const fx = x - ox, fy = y - oy
    if (fx < 0 || fy < 0 || fx > 2 || fy > 2) return null
    return true
  }
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const f = finder(x, y, 0, 0) ?? finder(x, y, n - 3, 0) ?? finder(x, y, 0, n - 3)
      const inGap = (x === 3 && y < 4) || (y === 3 && x < 4) || (x === n - 4 && y < 4) || (y === 3 && x > n - 5) || (x === 3 && y > n - 5) || (y === n - 4 && x < 4)
      const on = f !== null ? true : inGap ? false : rnd() > 0.48
      cells.push({ x, y, on, delay: Math.round(rnd() * 700) })
    }
  return cells
}
const CODE = codeCells()

function Matrix({ value }: { value: number }) {
  const s = String(Math.max(0, Math.min(99, value))).padStart(2, "0")
  return (
    <div className="sr-matrix" aria-hidden="true">
      {[0, 1].map((i) => (
        <div className="sr-digit" key={i}>
          {DIGITS[Number(s[i])].split("").map((b, j) => (
            <i key={j} className={b === "1" ? "sr-dot sr-on" : "sr-dot"} />
          ))}
        </div>
      ))}
    </div>
  )
}

function Print({ k, cls, style, frame, eager, look }: { k: string; cls?: string; style?: React.CSSProperties; frame?: string; eager?: boolean; look?: string }) {
  return (
    <div className={"sr-print " + (cls || "")} style={style}>
      <div className={"sr-print-in " + (frame || "")}>
        <img src={img(k)} alt="" draggable={false} loading={eager ? "eager" : "lazy"} decoding="async" style={look ? { filter: look } : undefined} />
      </div>
    </div>
  )
}

function CameraScreen({ stock, photoRef }: { stock: number; photoRef?: React.Ref<HTMLDivElement> }) {
  const s = STOCKS[Math.max(0, stock)]
  return (
    <div className="sr-screen">
      <div className="sr-bar">
        <span className="sr-chip">&#9638; Roll 01</span>
        <span className="sr-icons"><i /><i /><i /></span>
      </div>
      <div className="sr-shot" ref={photoRef}>
        <div className="sr-frames">
          {STOCKS.map((f, i) => (
            <img key={f.pic} src={img(f.pic)} alt={i === Math.max(0, stock) ? f.alt : ""} draggable={false} className={i === Math.max(0, stock) ? "sr-is" : ""} style={{ filter: f.look }} />
          ))}
        </div>
        <span key={"blink" + stock} className={stock > 0 ? "sr-blink sr-go" : "sr-blink"} />
        <span className="sr-shot-btn" />
        <div className="sr-shot-chips"><span>&#9889; Auto</span><span>1&#215;</span><span>&#9719; 36</span></div>
      </div>
      <div className="sr-meta"><span>{s.a + " " + s.b}</span><span>Loaded</span></div>
      <div className="sr-controls">
        <span className="sr-thumb"><img key={stock} src={img(stock > 0 ? STOCKS[stock - 1].pic : "snap-5")} alt="" draggable={false} style={{ filter: stock > 0 ? STOCKS[stock - 1].look : undefined }} /></span>
        <span className="sr-shutter" />
        <span className="sr-flip" />
      </div>
    </div>
  )
}

export default function ShutterRollTemplate({ height = "100svh", preloader = true, className = "" }: ShutterRollTemplateProps) {
  const root = useRef(null as HTMLDivElement | null)
  const reel = useRef(null as HTMLDivElement | null)
  const stage = useRef(null as HTMLDivElement | null)
  const far = useRef(null as HTMLDivElement | null)
  const near = useRef(null as HTMLDivElement | null)
  const target = useRef(null as HTMLDivElement | null)
  const words = useRef(null as HTMLDivElement | null)
  const bleed = useRef(null as HTMLDivElement | null)
  const flash = useRef(null as HTMLDivElement | null)
  const card = useRef(null as HTMLDivElement | null)
  const phone = useRef(null as HTMLDivElement | null)
  const shot = useRef(null as HTMLDivElement | null)
  const eject = useRef(null as HTMLDivElement | null)
  const party = useRef(null as HTMLDivElement | null)
  const [count, setCount] = useState(1)
  const [phase, setPhase] = useState(preloader ? "wind" : "open")
  const [stock, setStock] = useState(-1)

  // the winding counter, then the slit shutter
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!preloader || reduce) { setPhase("open"); return }
    let raf = 0
    const t0 = performance.now()
    const timers: number[] = []
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1000)
      setCount(1 + Math.round(35 * (1 - Math.pow(1 - p, 1.8))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    timers.push(window.setTimeout(() => setPhase("fade"), 1250))
    timers.push(window.setTimeout(() => setPhase("slit"), 1420))
    timers.push(window.setTimeout(() => setPhase("open"), 1760))
    return () => { cancelAnimationFrame(raf); timers.forEach((x) => clearTimeout(x)) }
  }, [preloader])

  // the scroll and pointer driven choreography
  useEffect(() => {
    const el = root.current, rl = reel.current, st = stage.current
    if (!el || !rl || !st) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0, mx = 0, my = 0, cmx = 0, cmy = 0, lastStock = -2, cs = NaN
    const reveals = Array.from(el.querySelectorAll("[data-reveal]")) as HTMLElement[]
    const depthEls = Array.from(el.querySelectorAll("[data-depth]")) as HTMLElement[]
    const party3d = Array.from(el.querySelectorAll("[data-float]")) as HTMLElement[]
    const scrubs = Array.from(el.querySelectorAll("[data-scrub]")) as HTMLElement[]
    const frame = () => {
      raf = 0
      const W = st.clientWidth, H = st.clientHeight
      const u = Math.max(W, H * 1.2) / 100
      el.style.setProperty("--u", u.toFixed(3) + "px")
      const r = rl.getBoundingClientRect()
      const want = -r.top / H
      // ease toward the real scroll so wheel steps glide instead of jump; a big jump (anchor, resize) snaps
      cs = !isFinite(cs) || reduce || Math.abs(want - cs) > 3 ? want : cs + (want - cs) * 0.16
      if (Math.abs(want - cs) < 0.0004) cs = want
      const s = cs
      const { dive, fold, stock: sk, eject: ej } = reelState(s)

      // pointer parallax on the table (eased)
      cmx += (mx - cmx) * 0.08; cmy += (my - cmy) * 0.08
      if (!reduce) for (const d of depthEls) {
        const k = Number(d.dataset.depth) * (1 - dive)
        d.style.translate = (cmx * k * 18).toFixed(2) + "px " + (cmy * k * 12).toFixed(2) + "px"
      }

      // the dive: the table scales about the target print while it swings flat
      const cx = (TARGET.x / 100) * W, cy = (TARGET.y / 100) * H
      // end scale: the print's photo (88% of its width) a little taller than the screen
      const photoH = TARGET.w * u * 0.88
      const S = diveScale(dive, Math.max(1.2, (H * 1.25) / photoH))
      const px = cx + (W / 2 - cx) * dive, py = cy + (H / 2 - cy) * dive
      const roll = 13 * Math.sin(Math.PI * Math.min(1, dive * 1.15))
      const tf = "translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px) rotate(" + roll.toFixed(2) + "deg) scale(" + S.toFixed(4) + ") translate(" + (-cx).toFixed(1) + "px," + (-cy).toFixed(1) + "px)"
      if (far.current) { far.current.style.transform = tf; far.current.style.filter = dive > 0.02 ? "blur(" + (Math.min(1, dive * 1.6) * 3.2).toFixed(2) + "px)" : "none" }
      // the target print is laid out at its on-screen size (never scaled up), so the photo stays sharp
      const slotEl = near.current && (near.current.firstChild as HTMLElement | null)
      if (slotEl) {
        slotEl.style.left = px.toFixed(1) + "px"
        slotEl.style.top = py.toFixed(1) + "px"
        slotEl.style.width = (TARGET.w * u * S).toFixed(1) + "px"
      }
      if (target.current) target.current.style.transform = "rotate(" + roll.toFixed(2) + "deg) rotateX(" + (24 * Math.pow(1 - dive, 0.6)).toFixed(2) + "deg) rotate(" + (TARGET.r * (1 - dive)).toFixed(2) + "deg)"
      if (words.current) {
        const w = clamp01(dive * 2.4)
        words.current.style.transform = "translate(" + (-w * 22).toFixed(2) + "vw," + (w * 26).toFixed(2) + "vh) scale(" + (1 + w * 0.6).toFixed(3) + ")"
        words.current.style.opacity = String(1 - clamp01(dive * 2.8))
        words.current.style.filter = w > 0.01 ? "blur(" + (w * 10).toFixed(1) + "px)" : "none"
      }
      if (card.current) {
        card.current.style.opacity = String(1 - clamp01(dive * 3))
        card.current.style.transform = "translateY(" + (clamp01(dive * 3) * 40).toFixed(1) + "px)"
        card.current.style.visibility = dive > 0.34 ? "hidden" : "visible"
      }
      if (flash.current) flash.current.style.opacity = String(Math.max(0, 1 - Math.abs(s - REEL.diveTo) / 0.25) * 0.16)

      // full-bleed photo, then fold it into the phone's screen
      const b = bleed.current, sh = shot.current, ph = phone.current
      if (b && sh && ph) {
        // the phone's own photo takes over across the last tenth of the fold
        const hand = clamp01((fold - 0.9) / 0.1)
        const show = dive > 0.82 && hand < 1
        b.style.visibility = show ? "visible" : "hidden"
        b.style.opacity = String(clamp01((dive - 0.82) / 0.1) * (1 - hand))
        // A: exactly over the print's photo (same rect, tilt and square crop), so fading in shows no seam
        const slotW = TARGET.w * u * S, ang = roll + TARGET.r * (1 - dive)
        const off = slotW * 0.065, rad = (ang * Math.PI) / 180
        const ax = px + Math.sin(rad) * off, ay = py - Math.cos(rad) * off, aw = slotW * 0.88
        // F: the whole stage, reached across the photo beat; Z: the phone's screen
        const g = smooth((s - REEL.diveTo) / (REEL.photoTo - REEL.diveTo))
        const sr = sh.getBoundingClientRect(), gr = st.getBoundingClientRect()
        let cx2 = ax + (W / 2 - ax) * g, cy2 = ay + (H / 2 - ay) * g
        let w2 = aw + (W - aw) * g, h2 = aw + (H - aw) * g
        const zx = sr.left - gr.left + sr.width / 2, zy = sr.top - gr.top + sr.height / 2
        cx2 += (zx - cx2) * fold; cy2 += (zy - cy2) * fold
        // width converges first so the frame turns portrait before it lands in the phone
        w2 += (sr.width - w2) * smooth(fold * 1.3); h2 += (sr.height - h2) * fold
        b.style.left = (cx2 - w2 / 2).toFixed(1) + "px"
        b.style.top = (cy2 - h2 / 2).toFixed(1) + "px"
        b.style.width = w2.toFixed(1) + "px"
        b.style.height = h2.toFixed(1) + "px"
        b.style.transform = "rotate(" + (ang * (1 - g) * (1 - fold)).toFixed(2) + "deg)"
        b.style.borderRadius = (fold * 10).toFixed(1) + "px"
        ph.style.opacity = String(smooth((fold - 0.45) / 0.55))
        ph.style.setProperty("--shot", hand.toFixed(3))
        el.style.setProperty("--fold", fold.toFixed(3))
      }
      if (sk !== lastStock) { lastStock = sk; setStock(sk) }

      // a print slides out of the phone and falls toward the night
      const ny = party.current, slot = ny && (ny.querySelector(".sr-pc1-slot") as HTMLElement | null)
      if (eject.current && ny && slot && sh) {
        const e = smooth(ej)
        const nr = ny.getBoundingClientRect(), lr = slot.getBoundingClientRect(), pr = sh.getBoundingClientRect()
        // from the phone's photo (viewport) to the slot (inside the night section), both in night-local px
        const x0 = pr.left + pr.width / 2 - nr.left, y0 = pr.top + pr.height * 0.55 - nr.top
        const x1 = lr.left + lr.width / 2 - nr.left, y1 = lr.top + lr.height / 2 - nr.top
        const w0 = pr.width * 0.92, w1 = lr.width
        const ww = w0 + (w1 - w0) * e
        eject.current.style.width = ww.toFixed(1) + "px"
        eject.current.style.opacity = ej > 0 ? String(clamp01(ej * 6)) : "0"
        eject.current.style.transform = "translate(" + (x0 + (x1 - x0) * e - ww / 2).toFixed(1) + "px," + (y0 + (y1 - y0) * e - ww * 0.62).toFixed(1) + "px) rotate(" + (-5 * e + 4 * Math.sin(Math.PI * e)).toFixed(2) + "deg)"
      }

      // the night section: reveals and depth drift
      const vh = window.innerHeight
      for (const n of scrubs) {
        const k = reduce ? 0 : clamp01((n.getBoundingClientRect().top - vh * 0.5) / (vh * 0.4))
        n.style.filter = k > 0.01 ? "blur(" + (k * 18).toFixed(1) + "px)" : "none"
        n.style.opacity = String(1 - k * 0.55)
        n.style.transform = "translateX(" + (-k * 5).toFixed(2) + "vw) scale(" + (1 + k * 0.06).toFixed(3) + ")"
      }
      for (const n of reveals) if (!n.classList.contains("sr-in") && n.getBoundingClientRect().top < vh * 0.82) n.classList.add("sr-in")
      if (!reduce) for (const n of party3d) {
        const rr = n.getBoundingClientRect()
        const k = Number(n.dataset.float)
        n.style.translate = "0 " + ((rr.top + rr.height / 2 - vh / 2) * -k * 0.25).toFixed(1) + "px"
      }
      if (Math.abs(mx - cmx) > 0.002 || Math.abs(my - cmy) > 0.002 || cs !== want) raf = requestAnimationFrame(frame)
    }
    const ask = () => { if (!raf) raf = requestAnimationFrame(frame) }
    const move = (e: PointerEvent) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; ask() }
    window.addEventListener("scroll", ask, { passive: true })
    window.addEventListener("resize", ask)
    window.addEventListener("pointermove", move, { passive: true })
    const ro = new ResizeObserver(ask)
    ro.observe(st)
    ask()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", ask); window.removeEventListener("resize", ask); window.removeEventListener("pointermove", move); ro.disconnect() }
  }, [])

  // the arrows under the phone jump the page to a film
  const jump = (dir: number) => {
    const rl = reel.current, st = stage.current
    if (!rl || !st) return
    const next = Math.max(0, Math.min(STOCKS.length - 1, Math.max(0, stock) + dir))
    const H = st.clientHeight
    const top = window.scrollY + rl.getBoundingClientRect().top + (REEL.foldTo + next * REEL.stockLen + 0.35) * H
    window.scrollTo({ top, behavior: "smooth" })
  }

  const cur = STOCKS[Math.max(0, stock)]
  const open = phase === "open"
  return (
    <div ref={root} className={"sr-root " + className} data-phase={phase} data-nav={stock >= 0 ? cur.nav : "dark"} style={{ "--h": height } as React.CSSProperties}>
      <style>{CSS}</style>

      {/* winding counter */}
      {phase !== "open" && (
        <div className="sr-loader" role="status" aria-label="Loading">
          <div className="sr-loader-in">
            <Matrix value={count} />
            <p className="sr-loader-label">Loading the roll</p>
          </div>
        </div>
      )}

      <header className="sr-nav">
        <a className="sr-logo" href="#sr-top" aria-label="Kedhareswer, back to top">kedhar</a>
        <nav className="sr-links" aria-label="Sections">
          <a href="#sr-films">Films</a>
          <a href="#sr-albums">Albums</a>
          <a href="#sr-roll">About</a>
        </nav>
        <a className="sr-say" href={"mailto:" + EMAIL}>Say hi</a>
      </header>

      {/* the pinned reel: table, dive, photo, phone, films */}
      <section ref={reel} className="sr-reel" id="sr-top" style={{ height: "calc(var(--h) * " + REEL.screens + ")" }}>
        <div ref={stage} className="sr-stage" style={{ height }}>
          <div className="sr-films-bg">
            {STOCKS.map((s, i) => (
              <div key={i} className={"sr-film-bg" + (i === Math.max(0, stock) ? " sr-is" : "")} style={{ background: s.bg }} />
            ))}
          </div>

          <div className="sr-table" style={{ opacity: "calc(1 - var(--fold, 0) * 4)" } as React.CSSProperties}>
            <div ref={far} className="sr-layer">
              <img className="sr-felt" src={img("table")} alt="" draggable={false} />
              {PROPS.map((p, i) => (
                <div key={"p" + i} className="sr-prop" data-depth={p.d} style={{ left: p.x + "%", top: p.y + "%", width: "calc(var(--u) * " + p.w + ")", ["--r" as string]: p.r + "deg", ["--i" as string]: String(i + 3) } as React.CSSProperties}>
                  <img src={img(p.k)} alt="" draggable={false} />
                </div>
              ))}
              {PRINTS.map((p, i) => (
                <div key={i} className={p.y > 44 ? "sr-drop sr-low" : "sr-drop"} data-depth={p.d} style={{ left: p.x + "%", top: p.y + "%", width: "calc(var(--u) * " + p.w + ")", ["--r" as string]: p.r + "deg", ["--i" as string]: String(i) } as React.CSSProperties}>
                  <Print k={p.k} />
                </div>
              ))}
            </div>
            <div ref={near} className="sr-layer sr-near">
              <div className="sr-drop sr-target-slot" style={{ left: TARGET.x + "%", top: TARGET.y + "%", width: "calc(var(--u) * " + TARGET.w + ")", ["--i" as string]: "5" } as React.CSSProperties}>
                <div ref={target} className="sr-target">
                  <Print k="friends" eager />
                </div>
              </div>
            </div>
          </div>

          <div ref={words} className="sr-hero-copy">
            <h1 className="sr-headline" aria-label="Aim. Shoot. Keep it.">
              <span>AIM. SHOOT.</span>
              <span>KEEP IT.</span>
            </h1>
          </div>
          <div ref={card} className="sr-card-wrap"><div className="sr-card">
            <p>Kedhareswer builds apps that feel like film. Project 01 turns a phone into a 36-shot camera: shoot now, pick the look later, and every blurry, flash-lit frame your friends take lands in one roll.</p>
            <a className="sr-btn" href={"mailto:" + EMAIL}>Email Kedhareswer</a>
          </div></div>

          <div ref={flash} className="sr-flash" />
          <div ref={bleed} className="sr-bleed"><img src={img("friends")} alt="" draggable={false} /></div>

          {/* the phone and the film words */}
          <div className="sr-films" id="sr-films" data-on={stock >= 0 ? "1" : "0"}>
            {STOCKS.map((s, i) => (
              <div key={i} className={"sr-words" + (i === stock ? " sr-is" : i < stock ? " sr-gone" : "")} style={{ color: s.ink }} aria-hidden={i !== stock}>
                <span className="sr-w sr-wl"><span>{s.a}</span></span>
                <span className="sr-w sr-wr"><span>{s.b}</span></span>
              </div>
            ))}
            {STOCKS.map((s, i) => (
              <p key={"n" + i} className={"sr-note" + (i === stock ? " sr-is" : "")} style={{ color: s.ink }}>{s.note}</p>
            ))}
            <p className="sr-rule" style={{ color: cur.ink }}>Kedhareswer's rule: shoot first, pick your film after. One tap, no overthinking it.</p>
            <div ref={phone} className="sr-phone">
              <div className="sr-notch" />
              <CameraScreen stock={stock} photoRef={shot} />
            </div>
            <div className="sr-picker">
              <button type="button" aria-label="Previous film" onClick={() => jump(-1)}>&#8249;</button>
              <span><b>Film</b> {cur.a.charAt(0) + cur.a.slice(1).toLowerCase() + " " + cur.b.charAt(0) + cur.b.slice(1).toLowerCase()}</span>
              <button type="button" aria-label="Next film" onClick={() => jump(1)}>&#8250;</button>
            </div>
          </div>
        </div>
      </section>

      {/* the night: a torn sheet pulls up over the reel */}
      <section ref={party} className="sr-night" id="sr-albums" style={{ marginTop: "calc(var(--h) * -1)" }}>
        <div className="sr-rim" style={{ clipPath: RIM }} />
        <div className="sr-torn" style={{ clipPath: TORN }} />
        <img className="sr-lights" src={img("lights")} alt="" draggable={false} loading="lazy" />
        <div ref={eject} className="sr-eject"><Print k={STOCKS[STOCKS.length - 1].pic} look={STOCKS[STOCKS.length - 1].look} frame="sr-cream" eager /></div>

        <div className="sr-block sr-one" style={{ minHeight: height }}>
          <div className="sr-copy">
            <h2 className="sr-big" data-scrub="" aria-label="One scan. Whole crew.">
              <span>ONE SCAN.</span>
              <span>WHOLE CREW.</span>
            </h2>
            <p className="sr-para" data-reveal="">Kedhareswer made albums you join with one scan. Start one for the party, the trip or the whole summer; friends point their phone at the code and start shooting. No download, no excuses.</p>
            <div className="sr-cta" data-reveal="">
              <span>Built for Client 1, Client 2 and Client 3</span>
              <a className="sr-btn sr-btn-sm" href={"mailto:" + EMAIL}>Get in touch</a>
            </div>
          </div>
          <div className="sr-cluster">
            <div className="sr-pc1-slot"><div className="sr-pc1-static"><Print k={STOCKS[STOCKS.length - 1].pic} look={STOCKS[STOCKS.length - 1].look} frame="sr-cream" /></div></div>
            <div data-float="0.2" className="sr-code" data-reveal="">
              <div className="sr-code-grid">
                {CODE.map((c, i) => <i key={i} className={c.on ? "sr-c-on" : ""} style={{ transitionDelay: c.delay + "ms" }} />)}
              </div>
              <span className="sr-stamp">ROLL 2611</span>
            </div>
            <div data-float="0.45" className="sr-pc sr-pc2" data-reveal=""><Print k="party-4" frame="sr-cream" /></div>
            <div data-float="0.3" className="sr-mini" data-reveal="">
              <div className="sr-album">
                <img src={img("party-6")} alt="A crowd cheering under string lights" draggable={false} loading="lazy" />
                <div className="sr-album-body">
                  <b>Roll 01</b>
                  <small>36 shots &#183; 14 friends</small>
                  <div className="sr-album-row">
                    <img src={img("party-2")} alt="" loading="lazy" /><img src={img("party-5")} alt="" loading="lazy" /><img src={img("party-3")} alt="" loading="lazy" />
                  </div>
                  <span className="sr-album-btn">Open roll</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sr-block sr-two" id="sr-roll" style={{ minHeight: height }}>
          <div className="sr-two-copy">
            <h2 className="sr-big sr-extrude" data-scrub="" aria-label="Title the roll">
              <span>TITLE THE</span>
              <span>ROLL</span>
            </h2>
            <p className="sr-para" data-reveal="">Give every roll a name and decide how long it stays open. Kedhareswer kept setup to three taps, so the party never waits on the app.</p>
          </div>
          <div className="sr-form-phone" data-reveal="">
            <div className="sr-form">
              <div className="sr-form-top"><span>&#8249;</span><small>Step 1 of 3</small><span /></div>
              <div className="sr-progress"><i /></div>
              <b>What's the roll called?</b>
              <div className="sr-field">Saturday on the roof</div>
              <div className="sr-field sr-dim">Who's invited?</div>
              <div className="sr-row"><span>Opens</span><em>Sat, 7 pm</em><u>Change</u></div>
              <div className="sr-row"><span>Develops</span><em>Sun, 9 am</em><u>Change</u></div>
              <small className="sr-label">Cover</small>
              <div className="sr-covers"><img src={img("party-5")} alt="" loading="lazy" /><img src={img("party-2")} alt="" loading="lazy" /><img src={img("party-6")} alt="" loading="lazy" /></div>
              <span className="sr-next">Continue</span>
            </div>
          </div>
          <div className="sr-stack" aria-hidden="true">
            <div data-float="0.35" className="sr-ghost sr-lit" style={{ left: "6%", top: "2%", width: "40%", ["--r" as string]: "-5deg" } as React.CSSProperties}><Print k="party-5" frame="sr-cream" /></div>
            <div data-float="0.6" className="sr-ghost sr-lit" style={{ left: "56%", top: "12%", width: "34%", ["--r" as string]: "6deg" } as React.CSSProperties}><Print k="party-3" frame="sr-cream" /></div>
            <div data-float="0.5" className="sr-ghost sr-lit" style={{ left: "2%", top: "50%", width: "46%", ["--r" as string]: "4deg" } as React.CSSProperties}><Print k="snap-1" frame="sr-cream" /></div>
            <div data-float="0.8" className="sr-ghost sr-lit" style={{ left: "58%", top: "58%", width: "32%", ["--r" as string]: "-7deg" } as React.CSSProperties}><Print k="snap-4" frame="sr-cream" /></div>
          </div>
        </div>

        <footer className="sr-foot">
          <p className="sr-foot-big">Want an app that feels like film?</p>
          <a className="sr-mail" href={"mailto:" + EMAIL}>{EMAIL}</a>
          <div className="sr-foot-row">
            <span>Kedhareswer &#183; Project 01</span>
            <span>Project 02 &#183; Project 03</span>
            <span>&#169; 2026</span>
          </div>
        </footer>
      </section>
    </div>
  )
}

const FONTS =
  "@font-face{font-family:SrDisplay;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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) format(\"woff2\")}" +
  "@font-face{font-family:SrSans;font-style:normal;font-weight:100 800;font-display:swap;src:url(data:font/woff2;base64,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) format(\"woff2\")}"

const DISPLAY = "SrDisplay,Impact,'Arial Narrow',sans-serif"
const SANS = "SrSans,ui-sans-serif,system-ui,sans-serif"
const EASE = "cubic-bezier(.2,.7,.2,1)"
const PHONE_H = "calc(var(--h) * .615)"
const PHONE_W = "calc(var(--h) * .331)"

const CSS =
  FONTS +
  ".sr-root{--u:15px;--fold:0;--g:4.4%;--row:calc(var(--h) * .06);position:relative;width:100%;background:#2c2d1e;color:#f4f1e8;font-family:" + SANS + ";overflow-x:clip;-webkit-font-smoothing:antialiased}" +
  ".sr-root :where(a,button){color:inherit;text-decoration:none;font:inherit;background:none;border:0;padding:0;cursor:pointer}" +
  ".sr-root :where(h1,h2,p){margin:0;font-weight:inherit}" +
  ".sr-root img{max-width:none;display:block;user-select:none}" +
  // ---- winding counter
  ".sr-loader{position:fixed;inset:0;z-index:60;pointer-events:none}" +
  ".sr-loader::before,.sr-loader::after{content:'';position:absolute;left:0;right:0;height:50.5%;background:linear-gradient(90deg,#5b5d3e 0%,#4a4b31 42%,#2e2e20 100%);transition:transform .42s cubic-bezier(.55,0,.75,.2)}" +
  ".sr-loader::before{top:0}.sr-loader::after{bottom:0}" +
  ".sr-root[data-phase=slit] .sr-loader::before{transform:translateY(-101%)}" +
  ".sr-root[data-phase=slit] .sr-loader::after{transform:translateY(101%)}" +
  ".sr-loader-in{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u) * 5.4);padding-bottom:4vh;transition:opacity .2s linear,filter .2s linear}" +
  ".sr-root[data-phase=fade] .sr-loader-in,.sr-root[data-phase=slit] .sr-loader-in{opacity:0;filter:blur(3px)}" +
  ".sr-matrix{display:flex;gap:calc(var(--u) * 2.3);max-width:92vw}" +
  ".sr-digit{display:grid;grid-template-columns:repeat(5,calc(var(--u) * 2.28));grid-auto-rows:calc(var(--u) * 2.08);place-items:center}" +
  ".sr-dot{width:calc(var(--u) * 2.1);height:calc(var(--u) * 2.1);border-radius:50%;background:#6e4a1d;opacity:0;transform:scale(.7);transition:opacity .14s linear,background-color .14s linear,transform .14s linear}" +
  ".sr-dot.sr-on{background:#f6a521;opacity:1;transform:none;box-shadow:inset 0 -2px 3px rgba(150,80,0,.35)}" +
  ".sr-loader-label{font-family:" + DISPLAY + ";font-size:calc(var(--u) * 2.9);letter-spacing:.01em;text-transform:uppercase;color:#f1eee4;line-height:1}" +
  // ---- nav
  ".sr-nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;gap:12px;padding:calc(var(--u) * .9) var(--g) 0;pointer-events:none;transition:opacity .5s " + EASE + " .2s}" +
  ".sr-root:not([data-phase=open]) .sr-nav{opacity:0}" +
  ".sr-nav a{pointer-events:auto}" +
  ".sr-logo{width:clamp(40px,calc(var(--u) * 3.8),60px);height:clamp(40px,calc(var(--u) * 3.8),60px);border-radius:10px;background:#f5a623;color:#3a2608;display:grid;place-items:center;font-weight:700;font-size:clamp(9px,calc(var(--u) * .62),11px);letter-spacing:.02em;box-shadow:0 4px 14px rgba(0,0,0,.18);margin-right:auto}" +
  ".sr-links{display:flex;gap:2px;padding:5px;border-radius:999px;background:rgba(36,38,22,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:background .5s}" +
  ".sr-links a{padding:9px clamp(12px,calc(var(--u) * 1.2),20px);border-radius:999px;font-weight:600;font-size:clamp(12px,calc(var(--u) * .92),15px);color:#f4f1e8;transition:background .25s}" +
  ".sr-root[data-nav=light] .sr-links{background:rgba(70,70,62,.42)}" +
  ".sr-say{padding:11px clamp(16px,calc(var(--u) * 1.7),28px);border-radius:999px;background:rgba(236,234,229,.88);color:#3b3c31;font-weight:600;font-size:clamp(12px,calc(var(--u) * .92),15px);box-shadow:inset 0 0 0 2px rgba(255,255,255,.55);transition:background .25s,transform .25s " + EASE + "}" +
  // ---- pinned reel
  ".sr-reel{position:relative;z-index:1}" +
  ".sr-stage{position:sticky;top:0;width:100%;overflow:hidden;background:#3c3e27}" +
  ".sr-films-bg,.sr-film-bg{position:absolute;inset:0}" +
  ".sr-film-bg{opacity:0;transition:opacity .8s ease}" +
  ".sr-film-bg.sr-is{opacity:1}" +
  ".sr-table{position:absolute;inset:0;transform-origin:50% 50%}" +
  ".sr-root[data-phase=open] .sr-table{animation:sr-settle 1.1s " + EASE + " both}" +
  "@keyframes sr-settle{from{transform:scale(1.14)}to{transform:none}}" +
  ".sr-layer{position:absolute;inset:0;transform-origin:0 0}" +
  ".sr-felt{position:absolute;left:-3%;top:-3%;width:106%;height:106%;object-fit:cover;filter:brightness(1.1) saturate(.86) contrast(.92)}" +
  ".sr-drop,.sr-prop{position:absolute;opacity:0;transform:translate(-50%,-50%) rotateX(24deg) rotate(var(--r));transform-style:preserve-3d}" +
  ".sr-layer{perspective:1100px}" +
  ".sr-root[data-phase=open] .sr-drop,.sr-root[data-phase=open] .sr-prop{animation:sr-drop .75s cubic-bezier(.22,.9,.3,1.06) both;animation-delay:calc(var(--i) * 42ms + 60ms)}" +
  "@keyframes sr-drop{from{opacity:0;transform:translate(-50%,-50%) translateY(-55%) rotateX(24deg) rotate(calc(var(--r) - 14deg)) scale(1.7)}35%{opacity:1}to{opacity:1;transform:translate(-50%,-50%) rotateX(24deg) rotate(var(--r))}}" +
  ".sr-target-slot{transform:translate(-50%,-50%);perspective:2400px}" +
  ".sr-root[data-phase=open] .sr-target-slot{animation-name:sr-drop-flat}" +
  "@keyframes sr-drop-flat{from{opacity:0;transform:translate(-50%,-50%) translateY(-55%) scale(1.7)}35%{opacity:1}to{opacity:1;transform:translate(-50%,-50%)}}" +
  ".sr-target{transform-origin:50% 50%}" +
  ".sr-prop img{width:100%;height:auto;filter:drop-shadow(10px 16px 14px rgba(25,30,8,.5))}" +
  ".sr-print-in{background:#f4f1ea;padding:6% 6% 19%;box-shadow:9px 14px 16px rgba(24,30,8,.42),0 0 0 1px rgba(0,0,0,.05)}" +
  ".sr-print-in.sr-cream{background:#eee6d6}" +
  ".sr-print-in img{width:100%;aspect-ratio:1/1;object-fit:cover;background:#2b2b2b}" +
  // hero words + card
  ".sr-hero-copy{position:absolute;left:var(--g);bottom:6.6%;z-index:3;transform-origin:20% 100%;pointer-events:none}" +
  ".sr-headline{font-family:" + DISPLAY + ";font-size:calc(var(--u) * 10.6);line-height:.92;color:#f6f4ec;letter-spacing:.005em;display:flex;flex-direction:column;transform:perspective(1000px) rotateX(26deg) rotate(-3.5deg) skewX(-8deg) scaleX(1.12);transform-origin:left bottom;text-shadow:0 1px 0 #d8d4c2,0 2px 0 #c3bfac,0 3px 0 #aeaa95,0 4px 0 #9a9681,0 10px 18px rgba(18,22,4,.5)}" +
  ".sr-headline span:first-child{padding-left:.25em}" +
  ".sr-root[data-phase=open] .sr-headline{animation:sr-rise 1s " + EASE + " both .15s}" +
  "@keyframes sr-rise{from{opacity:.4;filter:blur(6px)}to{opacity:1;filter:none}}" +
  ".sr-card-wrap{position:absolute;right:var(--g);bottom:6.6%;z-index:4;width:max(280px,26.4%)}" +
  ".sr-card{padding:calc(var(--u) * 1.45) calc(var(--u) * 1.45) calc(var(--u) * 1.6);background:rgba(76,79,45,.8);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:6px;color:#eeeadb;font-size:clamp(13px,calc(var(--u) * 1.06),17px);line-height:1.66}" +
  ".sr-root[data-phase=open] .sr-card{animation:sr-up .8s " + EASE + " both .45s}" +
  "@keyframes sr-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}" +
  ".sr-card .sr-btn{min-width:74%}" +
  ".sr-btn{display:inline-flex;align-items:center;justify-content:center;margin-top:calc(var(--u) * 1.4);padding:.95em 1.9em;border-radius:999px;background:#f4a52a;color:#3b2a0e;font-weight:600;font-size:clamp(13px,calc(var(--u) * .95),15px);box-shadow:inset 0 -3px 0 rgba(150,80,0,.25);transition:transform .25s " + EASE + ",background .25s}" +
  ".sr-flash{position:absolute;inset:0;z-index:5;background:#fffaf0;opacity:0;pointer-events:none}" +
  ".sr-bleed{position:absolute;z-index:8;overflow:hidden;visibility:hidden;left:0;top:0}" +
  ".sr-bleed img{width:100%;height:100%;object-fit:cover;transform-origin:50% 45%}" +
  // phone + film words
  ".sr-films{position:absolute;inset:0;z-index:7;pointer-events:none}" +
  ".sr-films[data-on='1'] .sr-rule{transform:none}" +
  ".sr-films[data-on='1'] .sr-picker{opacity:1;transform:translate(-50%,0);pointer-events:auto}" +
  ".sr-words{position:absolute;inset:0}" +
  ".sr-w{position:absolute;top:50%;font-family:" + DISPLAY + ";font-size:min(calc(var(--u) * 11.6),calc((50vw - " + PHONE_W + " / 2) / 4.7));line-height:1;letter-spacing:.005em;white-space:nowrap;text-shadow:0 8px 24px rgba(0,0,0,.18);opacity:0;filter:blur(16px);transition:opacity .6s ease,filter .75s " + EASE + ",transform .9s " + EASE + "}" +
  ".sr-w>span{display:inline-block}.sr-wl>span{transform-origin:100% 50%}.sr-wr>span{transform-origin:0 50%}" +
  ".sr-wl{right:calc(50% + " + PHONE_W + " / 2 + var(--u) * 3.4);transform:translate(-26vw,-56%)}" +
  ".sr-wr{left:calc(50% + " + PHONE_W + " / 2 + var(--u) * 3.4);transform:translate(26vw,-56%)}" +
  ".sr-words.sr-is .sr-w{opacity:1;filter:none;transform:translate(0,-56%);transition-delay:.22s}" +
  ".sr-words.sr-gone .sr-w{transition-duration:.3s,.45s,.7s}" +
  ".sr-words.sr-gone .sr-wl{transform:translate(-14vw,-56%)}.sr-words.sr-gone .sr-wr{transform:translate(14vw,-56%)}" +
  ".sr-note,.sr-rule{position:absolute;font-size:clamp(13px,calc(var(--u) * 1.1),18px);line-height:1.55;opacity:0;transition:opacity .45s linear,transform .6s " + EASE + "}" +
  ".sr-note{left:var(--g);bottom:calc(var(--row) + 12px);line-height:22px;transform:translateY(10px)}" +
  ".sr-note.sr-is{opacity:.86;transform:none}" +
  ".sr-rule{right:var(--g);bottom:calc(var(--row) + 12px);line-height:22px;max-width:27%;text-align:right;transform:translateY(10px)}" +
  ".sr-root .sr-rule{opacity:0}.sr-films[data-on='1'] .sr-rule{opacity:.86}" +
  ".sr-phone{position:absolute;left:50%;top:49.5%;height:" + PHONE_H + ";width:" + PHONE_W + ";transform:translate(-50%,-50%);border-radius:calc(var(--h) * .052);background:#0c0c0e;box-shadow:0 0 0 calc(var(--h) * .006) #e8e3d4,0 0 0 calc(var(--h) * .008) #b9b4a6,0 30px 60px rgba(0,0,0,.35);opacity:0;--shot:0}" +
  ".sr-notch{position:absolute;left:50%;top:2.6%;width:30%;height:4.4%;transform:translateX(-50%);border-radius:999px;background:#000;z-index:2}" +
  ".sr-screen{position:absolute;inset:0;display:flex;flex-direction:column;padding:13% 6.5% 9%;font-size:calc(var(--h) * .0118);color:#e9e7e1}" +
  ".sr-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:5%}" +
  ".sr-chip{padding:.35em .9em;border-radius:999px;border:1px solid rgba(255,255,255,.25);font-weight:600}" +
  ".sr-icons{display:flex;gap:.6em}.sr-icons i{width:.9em;height:.9em;border-radius:3px;border:1.5px solid #ddd}" +
  ".sr-shot{position:relative;aspect-ratio:.86;border-radius:10px;overflow:hidden;background:#222}" +
  ".sr-frames{position:absolute;inset:0;opacity:var(--shot)}" +
  ".sr-frames img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.06);transition:opacity .5s ease .12s,transform .9s " + EASE + " .12s}" +
  ".sr-frames img.sr-is{opacity:1;transform:none}" +
  ".sr-blink{position:absolute;inset:0;background:#050505;opacity:0;pointer-events:none}" +
  ".sr-blink.sr-go{animation:sr-blink .42s ease-out}" +
  "@keyframes sr-blink{0%{opacity:0}18%{opacity:.92}100%{opacity:0}}" +
  ".sr-shot-btn{position:absolute;right:5%;top:4%;width:9%;aspect-ratio:1;border-radius:50%;background:rgba(0,0,0,.4);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.7);opacity:var(--shot)}" +
  ".sr-shot-chips{position:absolute;left:0;right:0;bottom:5%;display:flex;justify-content:center;gap:.6em;opacity:var(--shot)}" +
  ".sr-shot-chips span{padding:.3em .8em;border-radius:999px;background:rgba(0,0,0,.6);font-weight:600}" +
  ".sr-meta{display:flex;justify-content:space-between;margin-top:4%;font-size:.75em;letter-spacing:.14em;color:#8d8b85;text-transform:uppercase}" +
  ".sr-controls{display:flex;justify-content:space-between;align-items:center;margin:auto 0;padding:0 3%}" +
  ".sr-thumb{width:16%;aspect-ratio:1;border-radius:7px;overflow:hidden;box-shadow:0 0 0 2px #fff}" +
  ".sr-thumb img{width:100%;height:100%;object-fit:cover}" +
  ".sr-shutter{width:24%;aspect-ratio:1;border-radius:50%;background:#f2f1ee;box-shadow:0 0 0 3px #0c0c0e,0 0 0 5px #f2f1ee}" +
  ".sr-flip{width:11%;aspect-ratio:1.2;border-radius:4px;border:2px solid #cfcdc7}" +
  ".sr-eject{position:absolute;left:0;top:0;z-index:5;opacity:0;pointer-events:none;will-change:transform}" +
  ".sr-pc1-slot{position:absolute;left:0;top:2%;width:28%;aspect-ratio:.83;pointer-events:none;z-index:3}" +
  ".sr-pc1-static{display:none;transform:rotate(-5deg)}" +
  ".sr-picker{position:absolute;left:50%;bottom:var(--row);height:46px;box-sizing:border-box;transform:translate(-50%,10px);display:flex;align-items:center;gap:12px;padding:6px;border-radius:999px;background:rgba(255,255,255,.13);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);color:#f4f2ec;font-size:clamp(12px,calc(var(--u) * .9),15px);opacity:0;transition:opacity .5s linear,transform .6s " + EASE + "}" +
  ".sr-root[data-nav=light] .sr-picker{background:rgba(70,70,60,.4)}" +
  ".sr-picker b{font-weight:700;margin-right:.6em}.sr-picker span{color:rgba(244,242,236,.75);min-width:13em;text-align:center}" +
  ".sr-picker button{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.12);font-size:20px;line-height:1;display:grid;place-items:center;transition:background .2s}" +
  // ---- the night
  ".sr-night{position:relative;z-index:3;background:linear-gradient(180deg,#25170f 0%,#2f1d12 22%,#40271a 52%,#2a1a11 78%,#160f0b 100%);color:#f5efe4}" +
  ".sr-torn,.sr-rim{position:absolute;left:0;right:0;top:calc(var(--u) * -3);height:calc(var(--u) * 3.2);pointer-events:none}" +
  ".sr-torn{background:#25170f}" +
  ".sr-rim{background:linear-gradient(90deg,#b5521a,#f2a63c 20%,#c3601f 38%,#f6b14a 55%,#b04e18 72%,#ee9a35 90%,#c2621f);filter:saturate(1.1)}" +
  ".sr-lights{position:absolute;left:0;top:0;width:100%;height:calc(var(--h) * 1.15);object-fit:cover;opacity:.95;-webkit-mask-image:linear-gradient(180deg,#000 55%,transparent);mask-image:linear-gradient(180deg,#000 55%,transparent);pointer-events:none}" +
  ".sr-block{position:relative;overflow:visible}" +
  ".sr-one{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.92fr);gap:5vw;align-items:center;padding:calc(var(--u) * 7) var(--g)}" +
  ".sr-copy{position:relative;z-index:2;min-width:0}" +
  ".sr-big{font-family:" + DISPLAY + ";font-size:min(calc(var(--u) * 9.4),6.6vw);line-height:.9;color:#f7f3ea;display:flex;flex-direction:column;transform-origin:0 50%;text-shadow:0 0 22px rgba(255,214,160,.22),0 5px 0 rgba(0,0,0,.35)}" +
  "[data-reveal]{transition:opacity .9s " + EASE + ",filter .9s " + EASE + ",transform 1s " + EASE + "}" +
    ".sr-para[data-reveal]{opacity:0;filter:blur(8px);transform:translateY(16px);transition-delay:.2s}" +
  ".sr-root .sr-in[data-reveal]{opacity:1;filter:none;transform:none}" +
  ".sr-para{margin-top:calc(var(--u) * 1.8);max-width:36ch;font-size:clamp(15px,calc(var(--u) * 1.25),20px);line-height:1.55;color:#efe8dc}" +
  ".sr-cluster{position:relative;width:100%;aspect-ratio:1.15}" +
  ".sr-cta{display:inline-flex;align-items:center;gap:14px;margin-top:calc(var(--u) * 2.2);padding:6px 6px 6px 22px;border-radius:999px;background:rgba(40,30,22,.72);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);font-weight:600;font-size:clamp(12px,calc(var(--u) * .95),15px)}" +
  ".sr-cta[data-reveal]{opacity:0;transform:translateY(16px);transition-delay:.35s}" +
  ".sr-cluster>[data-reveal]{position:absolute;opacity:0;filter:blur(8px);transform:translateY(70px) scale(1.12) rotate(var(--r,0deg))}" +
  ".sr-root .sr-cluster>.sr-in{opacity:1;filter:none;transform:rotate(var(--r,0deg))}" +
  ".sr-pc2{left:2%;top:56%;width:27%;--r:3deg;z-index:3;transition-delay:.3s}" +
  ".sr-code{left:12%;top:18%;width:48%;aspect-ratio:.93;--r:4deg;background:#f3f0e9;border-radius:clamp(10px,calc(var(--u) * 1.2),20px);padding:7%;box-shadow:0 30px 50px rgba(0,0,0,.45);z-index:2}" +
  ".sr-code-grid{display:grid;grid-template-columns:repeat(11,1fr);width:100%;aspect-ratio:1}" +
  ".sr-code-grid i{aspect-ratio:1;background:#24231f;opacity:0;transform:scale(.4);transition:opacity .2s linear,transform .3s " + EASE + "}" +
  ".sr-code.sr-in .sr-code-grid i{transform:none}.sr-code.sr-in .sr-code-grid i.sr-c-on{opacity:1}" +
  ".sr-stamp{display:block;margin-top:6%;font-family:ui-monospace,Menlo,monospace;letter-spacing:.24em;color:#d86b2b;font-size:clamp(11px,calc(var(--u) * 1.4),22px);transform:rotate(-1.5deg);opacity:.85}" +
  ".sr-mini{right:2%;top:10%;width:27%;aspect-ratio:.54;--r:4deg;border-radius:calc(var(--u) * 2);background:#0e0d0c;box-shadow:0 0 0 4px #d8d1c2,0 30px 50px rgba(0,0,0,.5);overflow:hidden;z-index:1;transition-delay:.45s}" +
  ".sr-album{display:flex;flex-direction:column;height:100%;font-size:calc(var(--u) * .78)}" +
  ".sr-album>img{width:100%;height:46%;object-fit:cover}" +
  ".sr-album-body{display:flex;flex-direction:column;gap:.45em;padding:8% 8% 10%;flex:1;min-height:0}" +
  ".sr-album-body b{font-size:1.5em;font-weight:700}.sr-album-body small{color:#9b958b}" +
  ".sr-album-row{display:flex;gap:4%;margin-top:.4em}.sr-album-row img{width:30%;aspect-ratio:.8;object-fit:cover;border-radius:4px}" +
  ".sr-album-btn{margin-top:auto;padding:.7em;border-radius:999px;background:#2a2723;text-align:center;font-weight:600}" +
  ".sr-ghosts{position:absolute;inset:0;pointer-events:none}" +
  ".sr-ghost{position:absolute;transform:rotate(var(--r));opacity:.32;filter:blur(1.5px)}" +
  ".sr-ghost.sr-lit{opacity:1;filter:none;pointer-events:auto;transition:transform .35s " + EASE + "}" +
  ".sr-two{display:grid;grid-template-columns:minmax(0,1.15fr) auto minmax(0,.85fr);gap:4vw;align-items:center;padding:calc(var(--u) * 6) var(--g)}" +
  ".sr-stack{position:relative;height:calc(var(--h) * .72)}" +
  ".sr-extrude{position:relative;z-index:3;line-height:1.08;color:#fbfaf6;text-shadow:0 -3px 0 #d6d2ca,0 -6px 0 #c0bcb3,0 -9px 0 #aaa69e,0 -12px 0 #95918a,0 -15px 0 #807c76,0 -18px 0 #6b6863,0 26px 38px rgba(0,0,0,.6)}" +
  ".sr-form-phone{position:relative;width:min(calc(var(--h) * .42),30vw);aspect-ratio:.64;border-radius:calc(var(--h) * .05);background:#100e0c;box-shadow:0 0 0 5px #d8d1c2,0 40px 70px rgba(0,0,0,.55);transform:perspective(1200px) rotateX(8deg);z-index:2;overflow:hidden}" +
  ".sr-form-phone[data-reveal]{opacity:0;transform:translateY(90px) perspective(1200px) rotateX(24deg);filter:blur(6px)}" +
  ".sr-root .sr-form-phone.sr-in{opacity:1;filter:none;transform:perspective(1200px) rotateX(8deg)}" +
  ".sr-form{display:flex;flex-direction:column;gap:.9em;height:100%;box-sizing:border-box;padding:16% 9% 12%;font-size:calc(var(--h) * .0135);color:#ece7dd}" +
  ".sr-form-top{display:flex;justify-content:space-between;align-items:center;color:#9a948a}.sr-form-top span:first-child{font-size:1.6em;color:#ece7dd}" +
  ".sr-progress{height:3px;border-radius:3px;background:#2b2722}.sr-progress i{display:block;width:34%;height:100%;border-radius:3px;background:#f4a52a}" +
  ".sr-form b{font-size:1.55em;font-weight:700;margin-top:.4em}.sr-label{color:#9a948a;margin-top:.4em}" +
  ".sr-field{padding:.9em 1em;border-radius:8px;background:#1e1b18;box-shadow:inset 0 0 0 1px #34302a}.sr-field.sr-dim{color:#7d776d}" +
  ".sr-row{display:flex;gap:.8em;align-items:center;font-size:.92em}.sr-row span{width:5.4em;color:#9a948a}.sr-row em{font-style:normal;flex:1}.sr-row u{text-decoration:none;font-weight:600}" +
  ".sr-covers{display:grid;grid-template-columns:repeat(3,1fr);gap:.6em}.sr-covers img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;opacity:.55}.sr-covers img:first-child{opacity:1;box-shadow:0 0 0 2px #f4a52a}" +
  ".sr-next{margin-top:auto;padding:.9em;border-radius:999px;background:#f4a52a;color:#3b2a0e;text-align:center;font-weight:700}" +
  ".sr-btn-sm{margin:0;padding:.85em 1.6em}" +
  ".sr-foot{position:relative;padding:calc(var(--u) * 6) var(--g) calc(var(--u) * 3);display:flex;flex-direction:column;gap:calc(var(--u) * 1.4)}" +
  ".sr-foot-big{font-family:" + DISPLAY + ";font-size:calc(var(--u) * 6.4);line-height:.95;text-transform:uppercase;max-width:12ch}" +
  ".sr-mail{font-size:clamp(16px,calc(var(--u) * 1.9),30px);font-weight:600;color:#f4a52a;align-self:flex-start;border-bottom:2px solid rgba(244,165,42,.4);transition:border-color .25s}" +
  ".sr-foot-row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;margin-top:calc(var(--u) * 4);padding-top:18px;border-top:1px solid rgba(255,255,255,.12);color:#a39a8d;font-size:13px}" +
  // ---- hover, only with a real pointer
  "@media (hover:hover) and (pointer:fine){" +
  ".sr-links a:hover{background:rgba(255,255,255,.14)}" +
  ".sr-say:hover{background:#fff;transform:translateY(-1px)}" +
  ".sr-btn:hover{background:#ffb640;transform:translateY(-2px)}" +
  ".sr-picker button:hover{background:rgba(255,255,255,.28)}" +
  ".sr-ghost.sr-lit:hover{transform:rotate(0deg) scale(1.06)}" +
  ".sr-mail:hover{border-color:#f4a52a}" +
  "}" +
  // ---- phones
  "@media (max-width:767px){" +
  ".sr-links{display:none}" +
  ".sr-hero-copy{left:var(--g);bottom:31%}" +
  ".sr-headline{font-size:15vw}" +
  ".sr-card-wrap{left:var(--g);right:var(--g);width:auto;bottom:3%}.sr-card{padding:16px}" +
  ".sr-wl,.sr-wr{left:50%;right:auto;font-size:17vw}" +
  ".sr-wl{top:calc(49.5% - " + PHONE_H + " / 2 - 13vw);transform:translate(-50%,-140%)}" +
  ".sr-wr{top:calc(49.5% + " + PHONE_H + " / 2 + 13vw);transform:translate(-50%,40%)}" +
  ".sr-words.sr-is .sr-wl,.sr-words.sr-is .sr-wr{transform:translate(-50%,-50%)}" +
  ".sr-words.sr-gone .sr-wl{transform:translate(-90%,-50%)}.sr-words.sr-gone .sr-wr{transform:translate(-10%,-50%)}" +
  ".sr-phone{height:calc(var(--h) * .5);width:calc(var(--h) * .269)}" +
  ".sr-screen{font-size:calc(var(--h) * .0096)}" +
  ".sr-note,.sr-rule{display:none}" +
  ".sr-picker{bottom:3.5%;white-space:nowrap}.sr-picker span{min-width:0}" +
  ".sr-one,.sr-two{grid-template-columns:minmax(0,1fr);gap:10vw;padding-top:calc(var(--u) * 9)}" +
  ".sr-big,.sr-two .sr-big{font-size:16vw}" +
  ".sr-root .sr-low{display:none}" +
  ".sr-cluster{aspect-ratio:1}.sr-mini{width:34%}.sr-album{font-size:2vw}" +
  ".sr-form-phone{justify-self:center;width:66vw;aspect-ratio:.5}" +
  ".sr-stack{height:90vw}" +
  ".sr-eject{display:none}.sr-pc1-static{display:block}" +
  ".sr-cta{gap:8px;padding-left:14px}.sr-cta span{max-width:14em;line-height:1.3}" +
  ".sr-foot-big{font-size:12vw}" +
  "}" +
  // ---- reduced motion: no autonomous motion, scroll still steers the reel
  "@media (prefers-reduced-motion:reduce){" +
  ".sr-root .sr-drop,.sr-root .sr-prop,.sr-root .sr-table,.sr-root .sr-headline,.sr-root .sr-card{animation:none!important;opacity:1}" +
  ".sr-root .sr-w,.sr-root .sr-film-bg,.sr-root [data-reveal],.sr-root .sr-code-grid i,.sr-root .sr-note{transition:none!important;filter:none!important}" +
  "}"
