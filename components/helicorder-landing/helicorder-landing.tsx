"use client"

// Helicorder Landing — a whole earthquake-early-warning company site printed on
// a seismograph drum. The hero is a live helicorder record: rows of pen trace,
// one minute per line, ink cycling black, blue, red and green like a real drum
// (dark mode is smoked paper: white scratches in soot). A recorded M5.8 sits on
// the record from the first frame, annotated in red pen with the seconds of
// warning it gave. The pen keeps writing; tap the record and it writes your
// knock (a damped seismometer response); "Replay" records the quake live and
// raises the alert a building would get.
//
// The rest of the page stays on the same paper: a warning-time calculator drawn
// as a seismogram, a site playbook set as a timed log, live station traces, a
// pricing estimator, a disclosure FAQ and a footer where the pen lifts off the
// roll and a plucked trace runs through the wordmark.
//
// One file, React only. Canvas 2D for the drum, SVG elsewhere. Nothing loads at
// runtime: no images, no fonts, no fetches.
import * as React from "react"

/* ------------------------------------------------------------------ types */

export type FskLink = { label: string; href: string }
export type FskStep = { at: string; title: string; text: string }
export type FskPlay = { at: number; action: string; system: string }
export type FskSite = { id: string; label: string; summary: string; steps: FskPlay[] }
export type FskStation = { code: string; name: string; channel: string; latency: string; /** distance from the recorded quake */ km?: number }
export type FskMetric = { value: string; unit?: string; label: string }
export type FskFaq = { question: string; answer: string }
export type FskColumn = { title: string; links: FskLink[] }
export type FskQuake = { magnitude: number; distanceKm: number; place: string; at?: string }
export type HelicorderLandingProps = {
  /** Hero height: the header plus the drum. A definite length, never a percentage. */
  height?: string
  brand?: string
  defaultTheme?: "system" | "light" | "dark"
  nav?: FskLink[]
  cta?: FskLink
  hero?: {
    title: string
    lede: string
    replay: string
    /** Under the drum. */
    hint: string
    /** The station the drum records, printed in the header. */
    station: string
  }
  /** The recorded quake on the drum. `at` is when its S-wave reached the building (ISO, UTC). */
  quake?: FskQuake
  how?: { title: string; intro: string; steps: FskStep[] }
  sitesTitle?: string
  sitesIntro?: string
  sites?: FskSite[]
  network?: { title: string; intro: string; metrics: FskMetric[]; stations: FskStation[] }
  /** A customer's drill, drawn as the campus sensor recorded it. */
  quote?: { text: string; name: string; role: string; note: string; seconds?: number; tone?: string }
  pricing?: {
    title: string
    intro: string
    currency: string
    each: number
    volumeEach: number
    volumeFrom: number
    included: string[]
  }
  faqTitle?: string
  faq?: FskFaq[]
  footer?: { heading: string; text: string; email: string; columns: FskColumn[]; legal: string }
  className?: string
}

type Theme = "light" | "dark"

/* ------------------------------------------------------------------ defaults */

const DEF_NAV: FskLink[] = [
  { label: "How it works", href: "#fsk-how" },
  { label: "Sites", href: "#fsk-sites" },
  { label: "Network", href: "#fsk-network" },
  { label: "Pricing", href: "#fsk-pricing" },
  { label: "FAQ", href: "#fsk-faq" },
]
const DEF_CTA: FskLink = { label: "Book a site survey", href: "#fsk-survey" }
const DEF_HERO = {
  title: "Seventeen seconds before the shaking.",
  lede: "Foreshock hears the fast first wave of an earthquake and alerts your building before the damaging one arrives.",
  replay: "Replay the M5.8",
  hint: "Tap or click the record. The pen writes your knock too.",
  station: "FS.KDKY HHZ · Kadıköy campus",
}
const DEF_QUAKE: FskQuake = { magnitude: 5.8, distanceKm: 76, place: "Sea of Marmara", at: "2026-03-14T09:31:37Z" }
const DEF_HOW = {
  title: "Where the seconds come from",
  intro:
    "Every earthquake sends two waves at once. The first is fast and gentle, the second slower and destructive. We sit in the gap.",
  steps: [
    { at: "0.0 s", title: "Rupture", text: "A fault slips. P-waves leave at about 6 km/s, S-waves at about 3.5 km/s." },
    { at: "2.1 s", title: "Our sensors feel it", text: "The nearest stations record the P-wave. It is small, but it travels fastest." },
    { at: "4.6 s", title: "Alert sent", text: "Three stations agree, we estimate size and place, and every site in range hears within 300 ms." },
    { at: "to S", title: "Your building acts", text: "Until the S-wave reaches you, your playbook runs on its own. Nobody has to press anything." },
  ],
}
const DEF_SITES: FskSite[] = [
  {
    id: "factory",
    label: "Factory",
    summary: "Lines stop in a safe position and people step away from machines.",
    steps: [
      { at: 17.1, action: "Alarm and voice on every PA zone: “Earthquake. Step away from the line.”", system: "PA" },
      { at: 16.8, action: "Presses and robot cells finish their stroke and park", system: "PLC" },
      { at: 16.4, action: "Gas mains and solvent feeds close", system: "Valves" },
      { at: 15.9, action: "Overhead cranes stop and lower their loads", system: "Cranes" },
      { at: 15.0, action: "Fire station doors open so trucks are not trapped", system: "Doors" },
    ],
  },
  {
    id: "school",
    label: "School",
    summary: "Every classroom hears the same calm voice, then the building opens its way out.",
    steps: [
      { at: 17.1, action: "Classroom speakers: “Drop, cover, hold on.”", system: "PA" },
      { at: 16.9, action: "Lifts stop at the nearest floor and open", system: "Lifts" },
      { at: 16.5, action: "Science lab gas closes", system: "Valves" },
      { at: 16.0, action: "Fire doors release from their magnets", system: "Doors" },
      { at: 2.0, action: "Teachers get the headcount list on their phones", system: "App" },
    ],
  },
  {
    id: "hospital",
    label: "Hospital",
    summary: "Theatres pause, lifts open and the things that must not move stay put.",
    steps: [
      { at: 17.1, action: "Three-tone alert in theatres: surgeons lift instruments clear", system: "PA" },
      { at: 16.9, action: "Lifts stop at the nearest floor and open", system: "Lifts" },
      { at: 16.6, action: "Pharmacy carousels lock", system: "Pharmacy" },
      { at: 16.2, action: "Generators start, ready to take the load", system: "Power" },
      { at: 15.5, action: "Ward displays show where to shelter patients who cannot move", system: "Screens" },
    ],
  },
  {
    id: "rail",
    label: "Rail",
    summary: "Trains slow before the track moves, and stations hold people where they are.",
    steps: [
      { at: 17.1, action: "Brake command to every train inside the alert zone", system: "Signalling" },
      { at: 16.9, action: "Signals ahead of each train go to danger", system: "Signalling" },
      { at: 16.5, action: "Platform screens: “Stand away from the edge and hold on.”", system: "Screens" },
      { at: 16.0, action: "Escalators slow to a stop", system: "Escalators" },
      { at: 12.0, action: "Line control sees which trains have stopped", system: "Control" },
    ],
  },
]
const DEF_NETWORK = {
  title: "212 stations, listened to all the time",
  intro:
    "Our own broadband sensors run along the North Anatolian Fault, bolted to bedrock and wired twice. We also listen to every public station in range.",
  metrics: [
    { value: "4.6", unit: "s", label: "median time from rupture to alert" },
    { value: "280", unit: "ms", label: "alert to your site, 95th percentile" },
    { value: "0", label: "false alerts above M4.5 in 2025" },
  ],
  stations: [
    { code: "FS.YLVA", name: "Yalova", channel: "HHZ", latency: "0.18 s", km: 9 },
    { code: "FS.CNRC", name: "Çınarcık", channel: "HHZ", latency: "0.20 s", km: 13 },
    { code: "FS.SLVR", name: "Silivri", channel: "HHZ", latency: "0.19 s", km: 19 },
    { code: "FS.IZMT", name: "İzmit Bay", channel: "HHZ", latency: "0.21 s", km: 34 },
    { code: "FS.BRSA", name: "Bursa", channel: "HHZ", latency: "0.22 s", km: 55 },
    { code: "FS.ADPZ", name: "Adapazarı", channel: "HHZ", latency: "0.24 s", km: 83 },
  ],
}
const DEF_QUOTE = {
  text: "On the March drill, 1,140 students were under their desks nine seconds after the tone. We never managed that with a bell.",
  name: "Ayşe Demir",
  role: "Facilities lead, Kadıköy Lisesi",
  note: "Campus sensor FS.KDKY · drill, 4 Mar 2026",
  seconds: 9,
  tone: "10:02:00",
}
const DEF_PRICING = {
  title: "One box per building",
  intro:
    "A sensor bolted to the slab, an alert box wired to your PA, lifts and valves, and the whole network behind it. Installation and yearly calibration included.",
  currency: "€",
  each: 89,
  volumeEach: 69,
  volumeFrom: 20,
  included: [
    "On-site sensor that alarms by itself if the network is down",
    "Alerts over fibre and 4G at the same time",
    "Wiring to PA, lifts, gas valves and doors",
    "A monthly test tone and a drill report each term",
  ],
}
const DEF_FAQ: FskFaq[] = [
  {
    question: "Can you predict earthquakes?",
    answer: "No, and nobody can. We detect an earthquake that has already started and race its slower, damaging waves to you.",
  },
  {
    question: "What if we are right on top of it?",
    answer:
      "Within about 16 km of the epicentre the shaking can arrive before any alert. Your own sensor still sounds the alarm on the first wave, which buys a second or two. We tell you your blind zone at the survey.",
  },
  {
    question: "How often will it go off for nothing?",
    answer:
      "Every alert needs three stations to agree, and you choose the threshold for your site. Most customers alert above M4.5 within 100 km.",
  },
  {
    question: "Does it need the internet?",
    answer:
      "Alerts reach the box over fibre and 4G at once. If both are down, the sensor in your building still triggers the alarm on the P-wave it feels.",
  },
  {
    question: "How long does installation take?",
    answer: "One day per building. We bolt the sensor to the foundation slab, wire the box and run a full test tone before we leave.",
  },
]
const DEF_FOOTER = {
  heading: "How many seconds does your building get?",
  text: "A survey takes an afternoon. We measure your floor, find your blind zone and show you the playbook before you sign anything.",
  email: "survey@foreshock.io",
  columns: [
    { title: "Product", links: [{ label: "How it works", href: "#fsk-how" }, { label: "Pricing", href: "#fsk-pricing" }, { label: "Status", href: "#fsk-network" }] },
    { title: "Company", links: [{ label: "Seismologists", href: "#" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }] },
    { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
  ],
  legal: "Foreshock Sismik A.Ş. · Kadıköy, İstanbul",
}

/* ------------------------------------------------------------------ physics (pure, tested) */

// #region drum
export const FSK_SR = 25
export const FSK_VP = 6.0
export const FSK_VS = 3.5
export const FSK_ALERT_AT = 4.6

/** Seeded PRNG (mulberry32), so every visit draws the same record. */
export function fskRandom(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Arrival times at a site `km` from the epicentre, and the warning it gets. */
export function fskWarning(km: number) {
  const d = Math.max(0, km)
  const p = d / FSK_VP
  const s = d / FSK_VS
  return { p, s, alert: FSK_ALERT_AT, warning: Math.max(0, s - FSK_ALERT_AT) }
}

/** Radius inside which the S-wave beats the alert. */
export function fskBlindZone() {
  return FSK_ALERT_AT * FSK_VS
}

/** Drum geometry for a hero of w × h CSS pixels. */
export function fskLayout(w: number, h: number) {
  const phone = w < 640
  const wide = w >= 1100
  const spr = wide ? 60 : phone ? 40 : 45
  const rowH = phone ? 22 : wide ? 28 : 26
  const left = phone ? 60 : 76
  const right = phone ? 12 : wide ? 76 : 24
  const top = phone ? 26 : 34
  const bottom = phone ? 52 : 56
  const rows = Math.max(7, Math.floor((h - top - bottom) / rowH))
  return { spr, rowH, rows, left, right, top, plotW: Math.max(40, w - left - right), phone, wide }
}

/** Where the recorded quake's S-wave sits on the drum: [row, fraction of the row]. Lines start on
 *  whole multiples of `spr` (a drum line starts on the minute), so the fraction comes from the clock. */
export function fskEventSlot(rows: number, wide: boolean, sAt: number, spr: number) {
  const row = Math.max(2, Math.min(rows - 5, Math.round(rows * (wide ? 0.7 : 0.66))))
  const frac = (((sAt % spr) + spr) % spr) / spr
  return [row, frac]
}

/** The first live row: everything above it (the quake and its coda) stays on the drum. */
export function fskLiveFrom(rows: number, eventRow: number) {
  return Math.max(1, Math.min(rows - 2, eventRow + 3))
}

/** Cost of `n` buildings a month, with the volume price from `from` buildings up. */
export function fskPrice(n: number, each: number, volumeEach: number, from: number) {
  const b = Math.max(1, Math.min(500, Math.round(Number.isFinite(n) ? n : 1)))
  const unit = b >= from ? volumeEach : each
  return { buildings: b, unit, month: b * unit, year: b * unit * 12 }
}

/** A seismometer: ground noise, any number of quakes, and knocks, one sample at a time. */
export function fskSynth(seed: number) {
  const rnd = fskRandom(seed)
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 1.732
  // two-pole resonator driven by noise, normalised to unit RMS
  const resonator = (f: number, r: number) => {
    const c = 2 * r * Math.cos((2 * Math.PI * f) / FSK_SR)
    const d = -r * r
    const probe = fskRandom(7)
    let a1 = 0, a2 = 0, sum = 0
    for (let i = 0; i < 4000; i++) {
      const x = (probe() - 0.5) * 3.464
      const y = c * a1 + d * a2 + x
      a2 = a1
      a1 = y
      sum += y * y
    }
    const g = 1 / Math.sqrt(sum / 4000)
    let y1 = 0, y2 = 0
    return (x: number) => {
      const y = c * y1 + d * y2 + x
      y2 = y1
      y1 = y
      return y * g
    }
  }
  const pBand = resonator(6.2, 0.9)
  const sBand = resonator(2.1, 0.94)
  const cBand = resonator(0.9, 0.9)
  const hum = resonator(1.3, 0.9)
  const ph1 = rnd() * 6.283
  const ph2 = rnd() * 6.283
  let ar = 0
  // knock: a seismometer ringing after an impulse, two modes, semi-implicit Euler
  let x1 = 0, v1 = 0, x2 = 0, v2 = 0
  const w1 = 2 * Math.PI * 2.4, z1 = 0.09
  const w2 = 2 * Math.PI * 7.5, z2 = 0.16
  const quakes: { p: number; s: number; amp: number }[] = []
  return {
    quakes,
    knock(strength: number) {
      v1 += strength * w1
      v2 -= strength * 0.55 * w2
    },
    next(t: number) {
      const micro =
        0.17 * Math.sin(2 * Math.PI * 0.16 * t + ph1) * (0.75 + 0.25 * Math.sin(t / 37)) +
        0.08 * Math.sin(2 * Math.PI * 0.23 * t + ph2)
      ar = ar * 0.72 + gauss() * 0.28
      let eP = 0, eS = 0, eC = 0
      for (let i = 0; i < quakes.length; i++) {
        const q = quakes[i]
        const tp = t - q.p
        if (tp > 0) eP += q.amp * 1.0 * (1 - Math.exp(-tp / 0.25)) * Math.exp(-tp / 6)
        const ts = t - q.s
        if (ts > 0) {
          eS += q.amp * 5.2 * (1 - Math.exp(-ts / 0.5)) * Math.exp(-ts / 7.5)
          eC += q.amp * 1.9 * (1 - Math.exp(-ts / 3)) * Math.exp(-ts / 24)
        }
      }
      const sub = 4
      const dt = 1 / FSK_SR / sub
      for (let k = 0; k < sub; k++) {
        v1 += (-2 * z1 * w1 * v1 - w1 * w1 * x1) * dt
        x1 += v1 * dt
        v2 += (-2 * z2 * w2 * v2 - w2 * w2 * x2) * dt
        x2 += v2 * dt
      }
      const quake = pBand(gauss()) * eP + sBand(gauss()) * eS + cBand(gauss()) * eC
      return micro + ar * 0.14 + hum(gauss()) * 0.05 + quake + x1 + x2
    },
  }
}

/** A quiet trace as an SVG path: n points over w × h, periodic so it can scroll forever. */
export function fskTracePath(seed: number, w: number, h: number, n: number, amp: number) {
  const r = fskRandom(seed)
  const raw: number[] = []
  let a = 0
  for (let i = 0; i < n; i++) {
    a = a * 0.6 + (r() - 0.5) * 0.8
    raw.push(a + Math.sin((i / n) * Math.PI * 2 * 3 + seed) * 0.25)
  }
  // blend the ends so the loop has no seam
  const k = Math.min(12, Math.floor(n / 4))
  for (let i = 0; i < k; i++) {
    const m = i / k
    raw[n - k + i] = raw[n - k + i] * (1 - m) + raw[i] * m
  }
  let d = ""
  for (let i = 0; i <= n; i++) {
    const v = raw[i % n]
    d += (i ? "L" : "M") + ((i / n) * w).toFixed(1) + " " + (h / 2 + v * amp).toFixed(1)
  }
  return d
}
// #endregion drum

/* ------------------------------------------------------------------ styles */

const FSK_CSS = `
.fsk{--paper:#f4f5f3;--ink:#131517;--soft:#363b40;--muted:#596067;--line:rgba(19,21,23,.13);--faint:rgba(19,21,23,.045);--red:#c0281a;--chip:#f4f5f3;--shade:rgba(19,21,23,.07);
--ease:cubic-bezier(.23,1,.32,1);--sans:"Helvetica Neue",Helvetica,Arial,"Liberation Sans",sans-serif;--mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,"Liberation Mono",monospace;
--gut:70px;position:relative;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;isolation:isolate}
.fsk[data-theme="dark"]{--paper:#121211;--ink:#ebeae4;--soft:#cdccc5;--muted:#a09f98;--line:rgba(235,234,228,.15);--faint:rgba(235,234,228,.05);--red:#ff6d58;--chip:#121211;--shade:rgba(0,0,0,.45)}
.fsk,.fsk *,.fsk *::before,.fsk *::after{box-sizing:border-box}
.fsk :where(h1,h2,h3,p,ul,ol,li,dl,dd,figure,blockquote){margin:0;padding:0}
.fsk :where(ul,ol){list-style:none}
.fsk :where(svg,canvas,img){display:block;max-width:none}
.fsk :where(button,input){font:inherit;color:inherit;letter-spacing:inherit}
.fsk :where(button){background:none;border:0;padding:0;cursor:pointer}
.fsk :where(a){color:inherit;text-decoration:none}
.fsk ::selection{background:var(--red);color:var(--paper)}
.fsk :where(a,button,input,summary):focus-visible{outline:2px solid var(--red);outline-offset:3px;border-radius:2px}
.fsk-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.fsk-skip{position:absolute;left:12px;top:-60px;z-index:40;background:var(--ink);color:var(--paper);padding:8px 14px;font:600 13px/1 var(--mono)}
.fsk-skip:focus{top:12px}
.fsk-mono{font-family:var(--mono);font-size:12px;line-height:1.4;letter-spacing:.01em}
.fsk-num{font-variant-numeric:tabular-nums}

.fsk-head{position:sticky;top:0;z-index:30;height:64px;display:flex;align-items:center;gap:28px;padding:0 24px 0 var(--gut);background:var(--paper);border-bottom:1px solid var(--line)}
.fsk-brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:19px;letter-spacing:-.02em;flex:none}
.fsk-brand svg{width:34px;height:18px}
.fsk-meta{color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1 1 auto}
.fsk-nav{display:flex;gap:22px;flex:none}
.fsk-nav a{position:relative;font-size:15px;padding:6px 0}
.fsk-nav a::after{content:"";position:absolute;left:0;right:0;bottom:2px;height:1.5px;background:var(--red);transform:scaleX(0);transform-origin:left;transition:transform .24s var(--ease)}
.fsk-nav a:hover::after,.fsk-nav a:focus-visible::after{transform:scaleX(1)}
.fsk-tools{display:flex;align-items:center;gap:10px;flex:none}
.fsk-icon{width:40px;height:40px;display:grid;place-items:center;border:1px solid var(--line);border-radius:999px;transition:border-color .2s,transform .12s}
.fsk-icon:hover{border-color:var(--ink)}
.fsk-icon:active{transform:scale(.95)}
.fsk-icon svg{width:18px;height:18px}
.fsk-menu{display:none;font:600 13px/1 var(--mono);height:40px;padding:0 14px;border:1px solid var(--line);border-radius:999px}
.fsk-drawer{position:absolute;left:0;right:0;top:64px;background:var(--paper);border-bottom:1px solid var(--line);padding:8px 16px 20px;display:grid;gap:2px;transform-origin:top;animation:fsk-drop .26s var(--ease)}
.fsk-drawer a{font-size:22px;letter-spacing:-.02em;padding:10px 0;border-bottom:1px solid var(--faint)}
.fsk-drawer .fsk-btn{margin-top:14px;justify-content:center;font-size:15px;letter-spacing:-.005em;border-bottom:0;padding:0 20px}
@keyframes fsk-drop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}

.fsk-btn{position:relative;display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 20px;border-radius:999px;font-weight:600;font-size:15px;letter-spacing:-.005em;white-space:nowrap;overflow:hidden;isolation:isolate;transition:transform .14s var(--ease),color .3s var(--ease),border-color .3s}
.fsk-btn::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--red);transform:translateY(101%);transition:transform .26s var(--ease)}
.fsk-btn:hover::before,.fsk-btn:focus-visible::before{transform:none}
.fsk-btn:active{transform:scale(.97)}
.fsk-btn--ink{background:var(--ink);color:var(--paper)}
.fsk-btn--ink:not([data-busy="true"]):hover{color:#fff}
.fsk-btn--line{border:1px solid var(--ink);color:var(--ink)}
.fsk-btn--line:not([data-busy="true"]):hover{color:#fff;border-color:var(--red)}
.fsk[data-theme="dark"] .fsk-btn--ink:not([data-busy="true"]):hover,.fsk[data-theme="dark"] .fsk-btn--line:not([data-busy="true"]):hover{color:#121211}
.fsk-btn--sm{height:40px;padding:0 16px;font-size:14px}
.fsk-btn svg{width:16px;height:10px;transition:transform .26s var(--ease)}
.fsk-btn:hover svg{transform:translateX(4px)}
.fsk-btn[data-busy="true"]{cursor:default;border-color:var(--red);color:var(--red)}
.fsk-btn[data-busy="true"]::before{display:none}
.fsk-dot{width:8px;height:8px;border-radius:50%;background:var(--red);animation:fsk-blink 1s steps(2,jump-none) infinite}
@keyframes fsk-blink{50%{opacity:.25}}

.fsk-hero{position:relative;overflow:hidden;touch-action:manipulation;cursor:crosshair}
.fsk-drum,.fsk-drum canvas{position:absolute;inset:0}
.fsk-drum canvas{width:100%;height:100%}
.fsk-roll{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,var(--shade),transparent 9%,transparent 88%,var(--shade))}
.fsk-pen{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;will-change:transform}
.fsk-pen::before{content:"";position:absolute;left:-1px;bottom:0;width:2px;height:30px;background:var(--ink);transform-origin:bottom;transform:rotate(24deg);border-radius:2px}
.fsk-pen::after{content:"";position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:var(--red)}
.fsk-veil{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,var(--paper) 0,var(--paper) 42%,transparent 58%);background:linear-gradient(90deg,var(--paper) 0,var(--paper) 39%,color-mix(in srgb,var(--paper) 70%,transparent) 47%,transparent 58%);-webkit-mask-image:linear-gradient(180deg,#000 0,#000 52%,transparent 63%);mask-image:linear-gradient(180deg,#000 0,#000 52%,transparent 63%)}
.fsk-copy{position:absolute;left:var(--gut);top:clamp(28px,7%,84px);width:min(600px,40%);cursor:auto}
.fsk-copy h1{font-size:clamp(44px,5.3vw,88px);line-height:.95;letter-spacing:-.045em;font-weight:700;margin-left:-.04em;text-wrap:balance}
.fsk-lede{margin-top:24px;font-size:19px;line-height:1.5;color:var(--soft);max-width:30ch}
.fsk-ctas{margin-top:32px;display:flex;flex-wrap:wrap;gap:12px}
.fsk-hfoot{position:absolute;left:var(--gut);right:24px;bottom:16px;display:flex;justify-content:space-between;gap:24px;color:var(--muted);pointer-events:none}
.fsk-toast{position:absolute;left:clamp(16px,calc(var(--pen-x,60%) + 14px),calc(100% - 230px));top:calc(var(--pen-y,70%) - 70px);z-index:5;width:auto;padding:4px 10px 6px;background:var(--paper);border-left:1.5px solid var(--red);color:var(--red);opacity:0;transform:translateY(-6px);transition:opacity .2s,transform .3s var(--ease);pointer-events:none}
.fsk-toast[data-on="true"]{opacity:1;transform:none}
.fsk-toast b{color:var(--red);font-weight:700}
.fsk-toast .fsk-count{font:700 26px/1 var(--sans);letter-spacing:-.01em;word-spacing:.08em;white-space:nowrap;margin-top:4px;color:var(--red)}
.fsk-toast .fsk-mono{font-weight:700;font-size:11.5px}

.fsk-page{position:relative;background-image:linear-gradient(90deg,transparent calc(var(--gut) - 14px),var(--line) calc(var(--gut) - 14px),var(--line) calc(var(--gut) - 13px),transparent calc(var(--gut) - 13px))}
.fsk-sec{position:relative;padding:112px 24px 112px var(--gut)}
.fsk{--i0:#16181b;--i1:#1d4aa6;--i2:#b8321f;--i3:#1d6b42}
.fsk[data-theme="dark"]{--i0:#efeee8;--i1:#c9c8c1;--i2:#efeee8;--i3:#b0afa8}
.fsk-paper{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.fsk-paper svg{position:absolute;left:var(--gut);right:24px;top:0;width:calc(100% - var(--gut) - 24px);opacity:.2}
.fsk[data-theme="dark"] .fsk-paper svg{opacity:.22}
.fsk-paper span{position:absolute;left:0;width:calc(var(--gut) - 22px);text-align:right;font-size:10.5px;line-height:1;color:var(--muted);opacity:.75;transform:translateY(-50%)}
.fsk-page>section,.fsk-page>.fsk-band{z-index:1}
.fsk-stamp{position:absolute;left:calc(var(--gut) - 19px);top:133px;width:12px;height:2px;background:var(--red)}
.fsk-band{position:relative;margin:0 24px 0 var(--gut);padding:26px 0 8px;background:var(--paper);box-shadow:0 0 0 6px var(--paper)}
.fsk-band svg{display:block;width:100%;height:64px;overflow:visible}
.fsk-band-n{position:absolute;top:0;transform:translateX(-12px);white-space:nowrap;color:var(--red);font-weight:700}
.fsk-h2,.fsk-intro,.fsk-steps li>div,.fsk-play>p,.fsk-incl li,.fsk-faq p,.fsk-quote blockquote,.fsk-read p,.fsk-net-head .fsk-intro,.fsk-fgrid p{position:relative;background:var(--paper);box-shadow:0 0 0 4px var(--paper)}
.fsk-h2,.fsk-intro,.fsk-quote blockquote{width:fit-content}
.fsk-h2{font-size:clamp(34px,3.8vw,60px);line-height:1;letter-spacing:-.04em;font-weight:700;text-wrap:balance;max-width:16ch}
.fsk-intro{margin-top:20px;max-width:46ch;color:var(--soft)}

.fsk-how{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:64px;margin-top:56px;align-items:start}
.fsk-steps{display:grid;gap:0;border-top:1px solid var(--line)}
.fsk-steps li{display:grid;grid-template-columns:64px 1fr;gap:16px;padding:18px 0;border-bottom:1px solid var(--line)}
.fsk-steps b{display:block;font-size:18px;letter-spacing:-.01em}
.fsk-steps p{color:var(--muted);font-size:16px;margin-top:4px}
.fsk-steps .fsk-mono{color:var(--red);padding-top:4px}
.fsk-calc{position:relative}
.fsk-read{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap}
.fsk-big{font-size:clamp(72px,9vw,148px);line-height:.85;letter-spacing:-.06em;font-weight:700;color:var(--red);font-variant-numeric:tabular-nums}
.fsk-big small{font-size:.32em;letter-spacing:-.02em;margin-left:.1em}
.fsk-read p{max-width:24ch;color:var(--soft)}
.fsk-gram{position:relative;margin-top:28px;height:220px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.fsk-gram svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.fsk-mark{position:absolute;top:8px;transform:translateX(-50%);color:var(--muted);white-space:nowrap;transition:left .25s var(--ease)}
.fsk-mark[data-k="s"],.fsk-mark[data-k="alert"]{color:var(--red)}
.fsk-axis{position:relative;height:16px;margin-top:8px;color:var(--muted)}
.fsk-axis span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}
.fsk-axis span:first-child{transform:none}
.fsk-range{margin-top:28px;display:grid;gap:10px}
.fsk-range label{display:flex;justify-content:space-between;gap:16px;font-size:15px}
.fsk-range input{-webkit-appearance:none;appearance:none;width:100%;height:28px;background:transparent;cursor:pointer}
.fsk-range input::-webkit-slider-runnable-track{height:2px;background:var(--ink)}
.fsk-range input::-moz-range-track{height:2px;background:var(--ink)}
.fsk-range input::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;margin-top:-10px;border-radius:50%;background:var(--paper);border:2px solid var(--red);transition:transform .15s var(--ease)}
.fsk-range input::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--paper);border:2px solid var(--red)}
.fsk-range input:active::-webkit-slider-thumb{transform:scale(1.15)}
.fsk-blind{color:var(--muted);font-size:15px}

.fsk-tabs{position:relative;display:inline-flex;margin-top:40px;border:1px solid var(--line);border-radius:999px;padding:4px}
.fsk-tabs button{position:relative;z-index:1;height:40px;padding:0 18px;border-radius:999px;font-size:15px;transition:color .25s}
.fsk-tabs button[aria-selected="true"]{color:var(--paper)}
.fsk-tabs i{position:absolute;top:4px;bottom:4px;left:0;border-radius:999px;background:var(--ink);transition:transform .25s var(--ease),width .25s var(--ease)}
.fsk-play{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:64px;margin-top:40px}
.fsk-play>p{font-size:22px;line-height:1.35;letter-spacing:-.015em;color:var(--soft)}
.fsk-log{border-top:1.5px solid var(--ink)}
.fsk-log li{display:grid;grid-template-columns:96px 1fr auto;gap:20px;align-items:baseline;padding:16px 0;border-bottom:1px solid var(--line);animation:fsk-in .42s var(--ease) both}
.fsk-log li:last-child{border-bottom:1.5px solid var(--ink)}
.fsk-strip{position:relative;margin-bottom:28px}
.fsk-strip svg{width:100%;height:92px;overflow:visible}
.fsk-strip-ax{position:relative;height:18px;margin-top:6px;color:var(--muted)}
.fsk-strip-ax span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}
.fsk-strip-ax span:last-child{transform:translateX(-100%);color:var(--red)}
.fsk-log li{transition:background .2s}
.fsk-log li{position:relative;cursor:default}
.fsk-log li:focus-visible{outline:2px solid var(--red);outline-offset:2px}
.fsk-log li::before{content:"";position:absolute;left:-14px;top:12px;bottom:12px;width:2px;background:var(--red);transform:scaleY(0);transition:transform .2s var(--ease)}
.fsk-log li[data-hot="true"]::before{transform:none}
.fsk-log li[data-hot="true"] .fsk-t{color:var(--ink);font-weight:700}
.fsk-log .fsk-t{color:var(--red)}
.fsk-log .fsk-sys{color:var(--muted);text-align:right}
.fsk-log .fsk-zero b{color:var(--red)}
@keyframes fsk-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.fsk-net-head{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,5fr);gap:64px;align-items:end}
.fsk-net-head .fsk-intro{margin-top:0}
.fsk-stations{margin-top:56px;border-top:1.5px solid var(--ink)}
.fsk-st--head{height:40px !important;color:var(--muted);font-weight:400}
.fsk-st--head span:last-child{text-align:right}
.fsk-readings{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-bottom:1.5px solid var(--ink)}
.fsk-readings div{padding:20px 20px 22px 0;border-right:1px solid var(--line)}
.fsk-readings div+div{padding-left:20px}
.fsk-readings div:last-child{border-right:0}
.fsk-readings dt{color:var(--muted);max-width:26ch}
.fsk-readings dd{margin-top:10px;font-size:clamp(40px,4vw,60px);line-height:.9;letter-spacing:-.05em;font-weight:700}
.fsk-readings dd small{font-size:.42em;letter-spacing:-.01em;margin-left:.12em;color:var(--muted);font-weight:600}
.fsk-st{display:grid;grid-template-columns:88px 150px minmax(0,1fr) 64px;gap:16px;align-items:center;height:64px;border-bottom:1px solid var(--line)}
.fsk-st .fsk-mono:first-child{font-weight:700}
.fsk-st .fsk-nm{font-size:15px}
.fsk-st .fsk-lat{color:var(--muted);text-align:right}
.fsk-wave{position:relative;height:64px;align-self:stretch;display:flex;align-items:center}
.fsk-wave svg{width:100%;height:40px;overflow:visible}
.fsk-pick,.fsk-agree{position:absolute;top:2px;font-style:normal;font-size:10.5px;font-weight:700;color:var(--red);transform:translateX(5px);white-space:nowrap;background:var(--paper);padding:0 3px}
.fsk-agree{top:auto;bottom:0;transform:translateX(6px)}
.fsk-nm small{color:var(--muted);font-size:12px;margin-left:4px}
.fsk-st--axis{height:28px !important;border-bottom:0 !important;color:var(--muted)}
.fsk-ax{position:relative;height:16px}
.fsk-ax b{position:absolute;top:0;font-weight:400;white-space:nowrap;transform:translateX(-50%)}
.fsk-ax b:first-child{transform:none}
.fsk-ax b:last-child{transform:translateX(-100%)}
@keyframes fsk-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.fsk-quote{display:grid;grid-template-columns:minmax(0,9fr) minmax(0,3fr);gap:28px 48px;align-items:end}
.fsk-quote blockquote{grid-column:1 / -1;max-width:24ch;font-size:clamp(30px,3.6vw,56px);line-height:1.06;letter-spacing:-.035em;font-weight:600;text-indent:-.42em;text-wrap:pretty}
.fsk-quote figcaption{border-top:1.5px solid var(--red);padding-top:12px}
.fsk-quote figcaption b{display:block;font-size:16px;margin-top:8px}
.fsk-quote figcaption span{display:block;color:var(--muted);font-size:15px}
.fsk-quote figcaption .fsk-mono{color:var(--red);font-size:12px}
.fsk-drill{position:relative;margin-top:24px;height:150px;border-bottom:1px solid var(--line)}
.fsk-drill svg{position:absolute;left:0;right:0;bottom:0;width:100%;height:120px;overflow:visible}
.fsk-drill span{position:absolute;white-space:nowrap;color:var(--red)}
.fsk-drill-n{top:0;transform:translateX(-50%);font-weight:700}
.fsk-drill-t{bottom:-22px;transform:translateX(-2px)}
.fsk-drill-e{right:0;bottom:-22px;color:var(--muted) !important}

.fsk-price{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,5fr);gap:64px;align-items:start}
.fsk-incl{margin-top:32px;border-top:1px solid var(--line)}
.fsk-incl li{display:grid;grid-template-columns:28px 1fr;padding:14px 0;border-bottom:1px solid var(--line);font-size:16px}
.fsk-incl li::before{content:"";width:12px;height:2px;background:var(--red);margin-top:11px}
.fsk-card{position:relative;border:1.5px solid var(--ink);background:var(--paper);margin-top:8px}
.fsk-card-h{display:flex;justify-content:space-between;gap:12px;padding:12px 20px;border-bottom:1.5px solid var(--ink);background:repeating-linear-gradient(135deg,transparent 0,transparent 6px,var(--faint) 6px,var(--faint) 7px);font-weight:700}
.fsk-card-h span:last-child{color:var(--muted);font-weight:400}
.fsk-field{display:grid;grid-template-columns:112px 1fr;align-items:center;gap:16px;min-height:64px;padding:8px 20px;border-bottom:1px solid var(--line)}
.fsk-field>.fsk-mono:first-child{color:var(--muted)}
.fsk-field small{color:var(--muted);font-size:14px}
.fsk-field--total{min-height:96px}
.fsk-field--total strong{font-size:clamp(48px,5vw,76px);line-height:.9;letter-spacing:-.05em;font-weight:700}
.fsk-step{display:flex;align-items:center;gap:0;border:1px solid var(--line);border-radius:999px;width:max-content}
.fsk-step button{width:44px;height:44px;font-size:22px;border-radius:999px;transition:background .2s,transform .12s}
.fsk-step button:hover{background:var(--faint)}
.fsk-step button:active{transform:scale(.92)}
.fsk-step input{width:64px;height:44px;text-align:center;background:transparent;border:0;font-size:20px;font-weight:600;font-variant-numeric:tabular-nums;-moz-appearance:textfield}
.fsk-step input::-webkit-inner-spin-button,.fsk-step input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.fsk-pnote{padding:14px 20px 0;color:var(--red);transform:rotate(-1deg);transform-origin:left}
.fsk-card .fsk-btn{margin:16px 20px 20px;width:calc(100% - 40px);justify-content:center}

.fsk-faq{margin-top:48px;border-top:1.5px solid var(--ink);max-width:960px}
.fsk-faq details{border-bottom:1px solid var(--line)}
.fsk-faq summary{list-style:none;display:grid;grid-template-columns:120px minmax(0,1fr) 16px;align-items:center;gap:24px;padding:22px 0;cursor:pointer;font-size:20px;letter-spacing:-.015em;font-weight:600}
.fsk-faq summary::-webkit-details-marker{display:none}
.fsk-frag{width:120px;height:24px;color:var(--muted);overflow:visible}
.fsk-faq details[open] .fsk-frag{color:var(--red)}
.fsk-faq summary i{position:relative;flex:none;width:16px;height:16px}
.fsk-faq summary i::before,.fsk-faq summary i::after{content:"";position:absolute;left:0;right:0;top:7px;height:2px;background:var(--red);transition:transform .25s var(--ease)}
.fsk-faq summary i::after{transform:rotate(90deg)}
.fsk-faq details[open] summary i::after{transform:rotate(0)}
.fsk-faq summary:hover span{text-decoration:underline;text-decoration-color:var(--red);text-decoration-thickness:1.5px;text-underline-offset:4px}
.fsk-faq p{margin:0 40px 24px 144px;padding-left:16px;border-left:2px solid var(--red);color:var(--soft);max-width:62ch;animation:fsk-in .3s var(--ease)}

.fsk-foot{position:relative;padding:96px 24px 32px var(--gut);border-top:1.5px solid var(--ink)}
.fsk-end{position:absolute;left:var(--gut);top:-11px;background:var(--paper);padding-right:12px;color:var(--muted)}
.fsk-fgrid{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:64px}
.fsk-fgrid h2{font-size:clamp(36px,4.4vw,72px);line-height:.98;letter-spacing:-.045em;font-weight:700;max-width:14ch;text-wrap:balance}
.fsk-fgrid p{margin-top:20px;color:var(--soft);max-width:44ch}
.fsk-fgrid .fsk-ctas{margin-top:28px}
.fsk-mail{display:inline-block;margin-top:20px;font-size:18px;border-bottom:1.5px solid var(--red);padding-bottom:2px}
.fsk-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;align-content:start}
.fsk-cols h3{font-family:var(--mono);font-size:12px;font-weight:600;color:var(--muted);margin-bottom:12px}
.fsk-cols a{display:block;padding:5px 0;font-size:15px;transition:color .2s}
.fsk-cols a:hover{color:var(--red)}
.fsk-word{position:relative;margin-top:96px;padding-bottom:40px;user-select:none;touch-action:pan-y}
.fsk-word span{display:block;width:max-content;font-size:clamp(64px,17.2vw,300px);line-height:.78;letter-spacing:-.065em;font-weight:700;margin-left:-.05em;white-space:nowrap}
.fsk-word svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.fsk-legal{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-top:28px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted)}

@media (max-width:1099px){
.fsk{--gut:40px}
.fsk-meta,.fsk-nav{display:none}
.fsk-menu{display:inline-flex;align-items:center}
.fsk-head{padding-left:20px;padding-right:16px;justify-content:space-between}
.fsk-head .fsk-cta-head{display:none}
.fsk-veil{background:linear-gradient(180deg,var(--paper) 0,var(--paper) 43%,transparent 50%);background:linear-gradient(180deg,var(--paper) 0,var(--paper) 42%,color-mix(in srgb,var(--paper) 70%,transparent) 46%,transparent 50%);-webkit-mask-image:none;mask-image:none}
.fsk-hfoot span:last-child{display:none}
.fsk-copy{left:var(--gut);right:24px;width:auto;max-width:640px}
.fsk-copy h1{font-size:clamp(40px,7.4vw,72px)}
.fsk-how,.fsk-play,.fsk-net,.fsk-price,.fsk-fgrid{grid-template-columns:1fr;gap:48px}
.fsk-quote{grid-template-columns:1fr;gap:28px}
.fsk-band-n{max-width:calc(100% - 12px);overflow:hidden;text-overflow:ellipsis;left:12px !important;transform:none}
.fsk-net-head{grid-template-columns:1fr;gap:20px}
.fsk-stamp{display:none}
}
@media (max-width:639px){
.fsk{--gut:20px;font-size:16px}
.fsk-page{background-image:none}
.fsk-paper span{display:none}
.fsk-head{padding:0 12px 0 16px}
.fsk-brand{font-size:18px}
.fsk-copy{top:20px;right:20px}
.fsk-copy h1{font-size:clamp(38px,11.4vw,52px);letter-spacing:-.04em}
.fsk-lede{font-size:17px;margin-top:16px}
.fsk-ctas{margin-top:22px;gap:10px}
.fsk-ctas .fsk-btn{height:46px;padding:0 16px;font-size:14px}
.fsk-hfoot{left:var(--gut);right:20px;bottom:12px}
.fsk-hfoot span:last-child{display:none}
.fsk-sec{padding:72px 20px 72px var(--gut)}
.fsk-sec--tight{padding-top:56px;padding-bottom:56px}
.fsk-band{margin-right:20px}
.fsk-veil{background:linear-gradient(180deg,var(--paper) 0,var(--paper) 49%,transparent 56%)}
.fsk-steps li{grid-template-columns:56px 1fr}
.fsk-gram{height:180px}
.fsk-tabs{display:flex;width:100%;overflow-x:auto;scrollbar-width:none}
.fsk-tabs button{flex:1 0 auto;padding:0 14px}
.fsk-play>p{font-size:19px}
.fsk-log li{grid-template-columns:72px 1fr;gap:4px 12px}
.fsk-log .fsk-sys{grid-column:2;text-align:left}
.fsk-st{grid-template-columns:84px minmax(0,1fr) 52px;grid-template-rows:auto auto;height:auto;padding:10px 0;gap:2px 10px}
.fsk-st .fsk-wave{grid-column:1 / -1;grid-row:2;height:48px}
.fsk-st--axis{display:grid !important;height:auto !important;padding:0 0 8px !important}
.fsk-st--axis .fsk-ax{grid-column:1 / -1;grid-row:2}
.fsk-field{grid-template-columns:88px 1fr;padding:8px 14px}
.fsk-card-h{padding:12px 14px}
.fsk-pnote{padding:12px 14px 0}
.fsk-card .fsk-btn{margin:14px;width:calc(100% - 28px)}
.fsk-readings{grid-template-columns:1fr}
.fsk-readings div{border-right:0;border-bottom:1px solid var(--line);padding:16px 0 !important}
.fsk-readings div:last-child{border-bottom:0}
.fsk-st--head{display:none !important}
.fsk-faq summary{grid-template-columns:56px minmax(0,1fr) 16px;gap:14px}
.fsk-frag{width:56px}
.fsk-faq p{margin:0 0 20px 0}
.fsk-strip-ax span:nth-last-child(2){display:none}
.fsk-drill{height:130px}
.fsk-drill svg{height:100px}
.fsk-word{margin-top:64px;padding-bottom:28px}
.fsk-faq summary{font-size:18px;padding:18px 0}
.fsk-foot{padding:72px 20px 24px var(--gut)}
.fsk-cols{grid-template-columns:repeat(2,minmax(0,1fr))}
.fsk-toast{width:200px;left:clamp(12px,calc(var(--pen-x,50%) - 100px),calc(100% - 212px));top:calc(var(--pen-y,70%) - 64px)}
}
@media (prefers-reduced-motion:reduce){
.fsk *,.fsk *::before,.fsk *::after{animation:none !important;transition-duration:.01ms !important}
}
`

/* ------------------------------------------------------------------ hooks */

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener?.("change", on)
    return () => mq.removeEventListener?.("change", on)
  }, [])
  return reduced
}

const pad2 = (n: number) => (n < 10 ? "0" : "") + n
const clockUTC = (sec: number, withSec: boolean) => {
  const d = new Date(sec * 1000)
  return pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()) + (withSec ? ":" + pad2(d.getUTCSeconds()) : "")
}
const clockLocal = (sec: number, withSec: boolean) => {
  const d = new Date(sec * 1000)
  return pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + (withSec ? ":" + pad2(d.getSeconds()) : "")
}

/* ------------------------------------------------------------------ the drum */

type DrumApi = { replay: () => void }
type Toast = { on: boolean; phase: "alert" | "shake"; left: number }

const INK_LIGHT = ["#16181b", "#1d4aa6", "#b8321f", "#1d6b42"]
const MONO_2D = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"

function Drum(props: {
  theme: Theme
  reduced: boolean
  quake: FskQuake
  apiRef: { current: DrumApi | null }
  onToast: (t: Toast) => void
  onBusy: (b: boolean) => void
}) {
  const { theme, reduced, quake, apiRef, onToast, onBusy } = props
  const hostRef = React.useRef(null as HTMLDivElement | null)
  const penRef = React.useRef(null as HTMLDivElement | null)
  const themeRef = React.useRef(theme)
  const redrawRef = React.useRef(null as null | (() => void))
  themeRef.current = theme

  React.useEffect(() => {
    redrawRef.current?.()
  }, [theme])

  React.useEffect(() => {
    const host = hostRef.current
    const pen = penRef.current
    const heroEl = host?.parentElement
    if (!host || !pen || !heroEl) return
    const canvas = document.createElement("canvas")
    canvas.setAttribute("aria-hidden", "true")
    host.insertBefore(canvas, host.firstChild)
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      canvas.remove()
      return
    }
    const W = fskWarning(quake.distanceKm)
    const lead = W.s - W.alert
    const pAfterAlert = W.p - W.alert
    // the recorded quake has a fixed date: its S-wave reached this building at `at`
    const parsed = Date.parse(quake.at || "")
    const sAt = Number.isFinite(parsed) ? parsed / 1000 : Date.UTC(2026, 2, 14, 9, 31, 37) / 1000

    let L = fskLayout(host.clientWidth || 1, host.clientHeight || 1)
    let dpr = 1
    let synth = fskSynth(1983)
    // one record row per drum line; rows above `liveFrom` are the archive, the rest feed
    let rows: { t: number; v: Float32Array; n: number }[] = []
    let liveFrom = 1
    let marks: { alert: number; p: number; s: number; live: boolean }[] = []
    let knocks: number[] = []
    let clock = 0 // fractional sample position of the pen in the last row
    let raf = 0
    let last = 0
    let visible = true
    let busyUntil = 0
    let feedAt = -1 // when the live rows last stepped up, for the feed animation
    let feedY = 0
    const per = () => L.spr * FSK_SR

    const palette = () => {
      const dark = themeRef.current === "dark"
      return {
        dark,
        ink: dark ? ["#efeee8", "#cfcec8", "#efeee8", "#b9b8b1"] : INK_LIGHT,
        label: dark ? "#a09f98" : "#596067",
        rule: dark ? "rgba(235,234,228,.07)" : "rgba(19,21,23,.06)",
        red: dark ? "#ff6d58" : "#c0281a",
        paper: dark ? "#121211" : "#f4f5f3",
      }
    }

    const gain = () => L.rowH * (L.phone ? 0.28 : 0.4)
    const limitFor = (r: number) => {
      const base = L.rowH * (L.phone ? 1.15 : 1.7)
      // the last line has the hint strip below it: keep its swing on the paper
      return r === L.rows - 1 ? Math.min(base, L.rowH * 1.1) : base
    }
    const rowY = (r: number) => L.top + r * L.rowH + L.rowH / 2 + (r >= liveFrom ? feedY : 0)
    const sx = (j: number) => L.left + (j / per()) * L.plotW
    const sy = (r: number, j: number) => {
      const lim = limitFor(r)
      return rowY(r) + lim * Math.tanh((rows[r].v[j] * gain()) / lim)
    }
    const pos = (t: number) => {
      for (let r = 0; r < rows.length; r++) {
        const d = t - rows[r].t
        if (d >= 0 && d < L.spr) return { row: r, x: L.left + (d / L.spr) * L.plotW, y: rowY(r) }
      }
      return null
    }

    const fillRow = (r: number, upto: number) => {
      const row = rows[r]
      const end = Math.min(upto, per())
      for (; row.n < end; row.n++) row.v[row.n] = synth.next(row.t + row.n / FSK_SR)
    }

    // a fresh drum: the archive with the quake on it, the pen a third of the way along the last line
    const build = () => {
      const w = host.clientWidth || 1
      const h = host.clientHeight || 1
      L = fskLayout(w, h)
      dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.2e6 / Math.max(1, w * h)))
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      const slot = fskEventSlot(L.rows, L.wide, sAt, L.spr)
      liveFrom = fskLiveFrom(L.rows, slot[0])
      const t0 = Math.round(sAt - slot[1] * L.spr) - slot[0] * L.spr
      synth = fskSynth(1983)
      synth.quakes.push({ p: sAt - lead + pAfterAlert, s: sAt, amp: 1 })
      marks = [{ alert: sAt - lead, p: sAt - lead + pAfterAlert, s: sAt, live: false }]
      knocks = []
      rows = []
      for (let r = 0; r < L.rows; r++) {
        rows.push({ t: t0 + r * L.spr, v: new Float32Array(per()), n: 0 })
        fillRow(r, r < L.rows - 1 ? per() : Math.floor(per() * 0.3))
      }
      clock = rows[L.rows - 1].n
      feedAt = -1
      feedY = 0
      redraw()
    }

    const strokeRow = (r: number, from: number, to: number) => {
      const pal = palette()
      const k = ((Math.round(rows[r].t / L.spr) % 4) + 4) % 4
      ctx.strokeStyle = pal.ink[k]
      ctx.globalAlpha = pal.dark ? (k % 2 ? 0.78 : 0.95) : 0.92
      ctx.lineWidth = pal.dark ? 1 : 1.15
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.beginPath()
      for (let j = Math.max(0, from); j < to; j++) {
        if (j === Math.max(0, from)) ctx.moveTo(sx(j), sy(r, j))
        else ctx.lineTo(sx(j), sy(r, j))
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // pen notes keep the trace: a paper-coloured halo instead of a box
    const note = (text: string, x: number, y: number, align: "left" | "center", color: string, bold: boolean) => {
      const pal = palette()
      ctx.font = (bold ? "700 " : "600 ") + (L.phone ? 10 : 11) + "px " + MONO_2D
      const w = ctx.measureText(text).width
      const want = align === "center" ? x - w / 2 : x
      const x0 = Math.max(L.left + 2, Math.min(L.left + L.plotW - w - 2, want))
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      // a tight paper slip under the words, so the trace never shows through the spaces
      ctx.fillStyle = pal.paper
      ctx.globalAlpha = 0.92
      ctx.fillRect(x0 - 3, y - 7, w + 6, 14)
      ctx.globalAlpha = 1
      ctx.lineJoin = "round"
      ctx.lineWidth = 4
      ctx.strokeStyle = pal.paper
      ctx.strokeText(text, x0, y)
      ctx.fillStyle = color
      ctx.fillText(text, x0, y)
    }

    const drawMarks = () => {
      const pal = palette()
      const lastRow = rows[rows.length - 1]
      const penT = lastRow.t + lastRow.n / FSK_SR
      knocks.forEach((t, i) => {
        const q = pos(t)
        if (!q || t > penT) return
        ctx.strokeStyle = pal.red
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(q.x, q.y - L.rowH * 0.25)
        ctx.lineTo(q.x, q.y - L.rowH * 0.66)
        ctx.stroke()
        // a burst of knocks gets one note, on its last knock
        const next = knocks[i + 1]
        if (next !== undefined && next - t < 8) return
        const n = knocks.filter((k) => k <= t && t - k < 8 * 4).length
        const label = (n > 1 ? n + " knocks " : "knock ") + clockUTC(t, true)
        note(label, q.x + 4, q.y - L.rowH * 0.66, "left", pal.red, false)
      })
      for (const m of marks) {
        const ticks: [number, string][] = [
          [m.alert, "ALERT"],
          [m.p, "P"],
          [m.s, "S"],
        ]
        for (const [t, name] of ticks) {
          if (t > penT) continue
          const q = pos(t)
          if (!q) continue
          ctx.strokeStyle = pal.red
          ctx.lineWidth = name === "P" ? 1 : 1.5
          ctx.beginPath()
          ctx.moveTo(q.x, q.y - L.rowH * 0.9)
          ctx.lineTo(q.x, q.y + L.rowH * 0.6)
          ctx.stroke()
          note(name, q.x + 4, q.y + L.rowH * 0.62, "left", pal.red, true)
        }
        if (m.s > penT) continue
        const a = pos(m.alert)
        const s = pos(m.s)
        if (!a && !s) continue
        // the bracket, in pen, above the line: alert to S
        const segs: [number, number, number][] = []
        if (a && s && a.row === s.row) segs.push([a.x, s.x, a.y - L.rowH * 0.92])
        else {
          if (a) segs.push([a.x, L.left + L.plotW, a.y - L.rowH * 0.92])
          if (s) segs.push([L.left, s.x, s.y - L.rowH * 0.92])
        }
        ctx.strokeStyle = pal.red
        ctx.lineWidth = 1.5
        for (const [x1, x2, y] of segs) {
          ctx.beginPath()
          ctx.moveTo(x1, y + 5)
          ctx.lineTo(x1, y)
          ctx.lineTo(x2, y)
          ctx.lineTo(x2, y + 5)
          ctx.stroke()
        }
        const longest = segs.reduce((b, sg) => (sg[1] - sg[0] > b[1] - b[0] ? sg : b), segs[0])
        const when = clockUTC(m.alert, true)
        const txt = L.phone
          ? lead.toFixed(1) + " s warning · M" + quake.magnitude.toFixed(1) + " · " + when
          : lead.toFixed(1) + " s of warning · M" + quake.magnitude.toFixed(1) + " " + quake.place + " · " + quake.distanceKm + " km · alert " + when + " UTC"
        note(txt, (longest[0] + longest[1]) / 2, longest[2] - 9, "center", pal.red, true)
      }
    }

    const drawFrame = () => {
      const pal = palette()
      const w = canvas.width / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, canvas.height / dpr)
      ctx.font = (L.phone ? "9.5px " : "11px ") + MONO_2D
      ctx.textBaseline = "middle"
      const withSec = L.spr % 60 !== 0
      // the copy's paper covers the upper left: no half-masked stamps under it
      const hidden = (L.wide ? 0.64 : L.phone ? 0.56 : 0.5) * (canvas.height / dpr)
      for (let r = 0; r < rows.length; r++) {
        const y = rowY(r)
        ctx.fillStyle = pal.label
        ctx.textAlign = "right"
        if (y > hidden) ctx.fillText(clockUTC(rows[r].t, withSec), L.left - 10, y)
        if (L.wide) {
          ctx.textAlign = "left"
          ctx.fillText(clockLocal(rows[r].t, withSec), L.left + L.plotW + 10, y)
        }
      }
      // seconds scale along the top
      ctx.textAlign = "center"
      for (let sec = 0; sec <= L.spr; sec += 5) {
        const x = L.left + (sec / L.spr) * L.plotW
        const major = sec % 10 === 0
        ctx.fillRect(Math.round(x), L.top - (major ? 9 : 5), 1, major ? 6 : 3)
        if (major && sec < L.spr) ctx.fillText(sec + (sec === 0 ? " s" : ""), x, L.top - 18)
      }
      ctx.textAlign = "right"
      if (!L.phone) ctx.fillText("UTC", L.left - 10, L.top - 18)
      if (L.wide) {
        ctx.textAlign = "left"
        ctx.fillText("Local", L.left + L.plotW + 10, L.top - 18)
      }
    }

    const drawGap = () => {
      const pal = palette()
      // a break in the record: the live lines no longer follow the archive minute for minute
      if (rows[liveFrom] && rows[liveFrom].t - rows[liveFrom - 1].t > L.spr + 0.5) {
        const gy = L.top + liveFrom * L.rowH + feedY
        ctx.fillStyle = pal.label
        ctx.fillRect(L.left, Math.round(gy) - 2, L.plotW, 1)
        ctx.fillRect(L.left, Math.round(gy) + 1, L.plotW, 1)
        note("record resumed " + clockUTC(rows[liveFrom].t, L.spr % 60 !== 0), L.left + L.plotW * 0.02, gy, "left", pal.red, true)
      }
    }

    const placePen = () => {
      const r = rows.length - 1
      const j = Math.max(0, rows[r].n - 1)
      const x = sx(j)
      const y = sy(r, j)
      pen.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)"
      heroEl.style.setProperty("--pen-x", x.toFixed(0) + "px")
      heroEl.style.setProperty("--pen-y", (L.top + r * L.rowH).toFixed(0) + "px")
    }

    function redraw() {
      drawFrame()
      for (let r = 0; r < rows.length; r++) strokeRow(r, 0, rows[r].n)
      drawGap()
      drawMarks()
      placePen()
    }
    redrawRef.current = redraw

    // the last line is full: the live lines step up one, the archive stays put
    const feed = () => {
      const lastRow = rows[rows.length - 1]
      rows.splice(liveFrom, 1)
      rows.push({ t: lastRow.t + L.spr, v: new Float32Array(per()), n: 0 })
      clock -= per()
      if (!reduced) feedAt = performance.now()
    }

    const advance = (by: number) => {
      clock += by
      let fed = false
      for (;;) {
        const r = rows.length - 1
        const target = Math.min(per(), Math.floor(clock))
        const before = rows[r].n
        fillRow(r, target)
        if (!fed && rows[r].n > before) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          strokeRow(r, Math.max(0, before - 1), rows[r].n)
          const t0 = rows[r].t
          const crossed = (t: number) => t > t0 + before / FSK_SR && t <= t0 + rows[r].n / FSK_SR
          if (knocks.some(crossed) || marks.some((m) => m.live && [m.alert, m.p, m.s].some(crossed))) redraw()
        }
        if (clock < per()) break
        feed()
        fed = true
      }
      if (fed) {
        feedY = feedAt > 0 ? L.rowH : 0
        redraw()
      }
      placePen()
      const lastRow = rows[rows.length - 1]
      const penT = lastRow.t + lastRow.n / FSK_SR
      const live = marks.find((m) => m.live && penT >= m.alert && penT < m.s + 6)
      if (live) onToast({ on: true, phase: penT < live.s ? "alert" : "shake", left: Math.max(0, live.s - penT) })
      else if (busyUntil && penT > busyUntil) {
        busyUntil = 0
        for (const m of marks) m.live = false
        onToast({ on: false, phase: "shake", left: 0 })
        onBusy(false)
      }
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible) {
        last = now
        return
      }
      const dt = Math.min(0.1, (now - (last || now)) / 1000)
      last = now
      // the feed: live lines glide up one line over 360 ms, ease-out
      if (feedAt > 0) {
        const k = Math.min(1, (now - feedAt) / 360)
        feedY = L.rowH * Math.pow(1 - k, 3)
        if (k >= 1) {
          feedAt = -1
          feedY = 0
        }
        redraw()
      }
      advance(dt * FSK_SR)
    }

    build()
    if (!reduced) raf = requestAnimationFrame(tick)

    const knock = (e: PointerEvent) => {
      const el = e.target as HTMLElement
      if (el.closest("a,button,input,.fsk-copy")) return
      synth.knock(1.5 + Math.random() * 0.8)
      const lastRow = rows[rows.length - 1]
      knocks.push(lastRow.t + clock / FSK_SR)
      if (knocks.length > 12) knocks.shift()
      if (reduced) advance(FSK_SR * 4)
    }
    heroEl.addEventListener("pointerdown", knock)

    apiRef.current = {
      replay() {
        if (busyUntil) return
        const lastRow = rows[rows.length - 1]
        const alert = lastRow.t + clock / FSK_SR + 0.8
        synth.quakes.push({ p: alert + pAfterAlert, s: alert + lead, amp: 1 })
        marks.push({ alert, p: alert + pAfterAlert, s: alert + lead, live: true })
        busyUntil = alert + lead + 6
        onBusy(true)
        if (reduced) {
          advance((lead + 30) * FSK_SR)
          busyUntil = 0
          for (const m of marks) m.live = false
          redraw()
          onToast({ on: false, phase: "shake", left: 0 })
          onBusy(false)
        }
      },
    }

    let lastW = host.clientWidth
    let lastH = host.clientHeight
    const ro = new ResizeObserver(() => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 40) return
      lastW = w
      lastH = h
      build()
    })
    ro.observe(host)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(host)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      heroEl.removeEventListener("pointerdown", knock)
      apiRef.current = null
      redrawRef.current = null
      canvas.remove()
    }
  }, [reduced, quake.distanceKm, quake.magnitude, quake.place, quake.at])

  return (
    <div className="fsk-drum" ref={hostRef}>
      <div className="fsk-roll" />
      <div className="fsk-pen" ref={penRef} />
    </div>
  )
}

/* ------------------------------------------------------------------ small pieces */

function Arrow() {
  return (
    <svg viewBox="0 0 16 10" fill="none" aria-hidden="true">
      <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function Mark() {
  return (
    <svg viewBox="0 0 34 18" fill="none" aria-hidden="true">
      <path
        d="M0 9h7l1.2-2 1.2 4 1.2-3h4l1.5-7 2 15 1.8-12 1.6 9 1.4-5 1.2 3H34"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

const FSK_EVENTS = [
  { km: 58, mag: 0.22, note: "M2.1 · Gulf of Gemlik · 58 km · below your threshold, no alert" },
  { km: 41, mag: 0.34, note: "M3.0 · Çınarcık · 41 km · below threshold, logged" },
  { km: 212, mag: 0.16, note: "M2.6 · Saros Gulf · 212 km · out of range" },
  { km: 0, mag: 0.5, note: "Quarry blast · Kemerburgaz · filtered, no alert" },
]

/** A divider is two more lines of the record, each with a small event the network logged and let pass. */
function Rule(props: { n: number }) {
  const ev = FSK_EVENTS[props.n % FSK_EVENTS.length]
  const span = 80
  const pAt = 22
  const d = React.useMemo(() => {
    const syn = fskSynth(500 + props.n * 7)
    if (ev.km > 0) syn.quakes.push({ p: pAt, s: pAt + ev.km / FSK_VS - ev.km / FSK_VP, amp: ev.mag })
    let out = ""
    const n = span * FSK_SR
    const half = n / 2
    for (let i = 0; i < n; i++) {
      const t = i / FSK_SR
      if (ev.km === 0 && Math.abs(t - pAt) < 0.5 / FSK_SR) syn.knock(ev.mag * 6)
      const v = syn.next(t)
      const line = i < half ? 0 : 1
      const x = (((i % half) / half) * 1000).toFixed(1)
      const y = (16 + line * 32 + 13 * Math.tanh((v * 5) / 13)).toFixed(1)
      out += (i === 0 || i === half ? "M" : "L") + x + " " + y
    }
    return out
  }, [props.n, ev.km, ev.mag])
  const k = props.n % 4
  return (
    <div className="fsk-band" aria-hidden="true">
      <span className="fsk-band-n fsk-mono" style={{ left: ((pAt / (span / 2)) * 100).toFixed(1) + "%" }}>
        {ev.note}
      </span>
      <svg viewBox="0 0 1000 64" preserveAspectRatio="none">
        <line x1={(pAt / (span / 2)) * 1000} x2={(pAt / (span / 2)) * 1000} y1="0" y2="28" stroke="var(--red)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        <path d={d} fill="none" stroke={"var(--i" + k + ")"} strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

/** The paper under the whole page: more lines of the same record, at the drum's pitch and in its inks. */
function Paper(props: { from: number }) {
  const ref = React.useRef(null as HTMLDivElement | null)
  const [h, setH] = React.useState(0)
  React.useEffect(() => {
    const el = ref.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(() => setH(Math.ceil(el.offsetHeight)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const pitch = 32
  const rows = Math.ceil(h / pitch)
  const lines = React.useMemo(() => {
    const out: string[] = []
    for (let r = 0; r < rows; r++) out.push(fskTracePath(700 + r, 1200, pitch, 150, 2.4))
    return out
  }, [rows])
  return (
    <div className="fsk-paper" ref={ref} aria-hidden="true">
      {h > 0 && (
        <svg viewBox={"0 0 1200 " + rows * pitch} preserveAspectRatio="none" style={{ height: rows * pitch }}>
          {lines.map((d, r) => (
            <path
              key={r}
              d={d}
              transform={"translate(0 " + r * pitch + ")"}
              fill="none"
              stroke={"var(--i" + (r % 4) + ")"}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      )}
      {lines.map((_, r) => (
        <span key={r} className="fsk-mono" style={{ top: r * pitch + pitch / 2 }}>
          {clockUTC(props.from + r * 60, false)}
        </span>
      ))}
    </div>
  )
}

const FSK_NET_SPAN = 30

/** One station's record of the M5.8, seconds after rupture: the P pick in red, the alert line through every row. */
function StationRow(props: { st: FskStation; i: number; third: boolean }) {
  const { st, i, third } = props
  const km = st.km ?? 10 + i * 15
  const x = (t: number) => (t / FSK_NET_SPAN) * 1000
  const d = React.useMemo(() => {
    const syn = fskSynth(40 + i * 17)
    syn.quakes.push({ p: km / FSK_VP, s: km / FSK_VS, amp: 0.55 / (1 + km / 40) })
    let out = ""
    const n = FSK_NET_SPAN * FSK_SR
    for (let j = 0; j < n; j++) {
      const v = syn.next(j / FSK_SR)
      out += (j ? "L" : "M") + ((j / n) * 1000).toFixed(1) + " " + (20 + 17 * Math.tanh((v * 8) / 17)).toFixed(1)
    }
    return out
  }, [i, km])
  const pick = km / FSK_VP
  return (
    <li className="fsk-st">
      <span className="fsk-mono">{st.code}</span>
      <span className="fsk-nm">
        {st.name} <small className="fsk-num">{km} km</small>
      </span>
      <span className="fsk-wave" aria-hidden="true">
        <svg viewBox="0 0 1000 40" preserveAspectRatio="none">
          <line x1={x(FSK_ALERT_AT)} x2={x(FSK_ALERT_AT)} y1="0" y2="40" stroke="var(--red)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          <path d={d} fill="none" stroke="currentColor" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
          <line x1={x(pick)} x2={x(pick)} y1="4" y2="36" stroke="var(--red)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <i className="fsk-pick fsk-mono" style={{ left: (x(pick) / 10).toFixed(2) + "%" }}>
          P
        </i>
        {third && (
          <i className="fsk-agree fsk-mono" style={{ left: (x(FSK_ALERT_AT) / 10).toFixed(2) + "%" }}>
            3 stations agree · ALERT {FSK_ALERT_AT.toFixed(1)} s
          </i>
        )}
      </span>
      <span className="fsk-mono fsk-lat fsk-num">
        <span className="fsk-sr">
          {st.channel}, P-wave {pick.toFixed(1)} s after rupture, latency{" "}
        </span>
        {st.latency}
      </span>
    </li>
  )
}

/** Warning-time calculator, drawn as the seismogram the site would record. */
function Calculator(props: { defaultKm: number; uid: string }) {
  const { uid } = props
  const [km, setKm] = React.useState(props.defaultKm)
  const W = fskWarning(km)
  const span = 45
  const path = React.useMemo(() => {
    const syn = fskSynth(77)
    const w = fskWarning(km)
    syn.quakes.push({ p: w.p, s: w.s, amp: 0.95 })
    let d = ""
    const n = span * FSK_SR
    for (let i = 0; i < n; i++) {
      const v = syn.next(i / FSK_SR)
      const y = 110 + 92 * Math.tanh((v * 26) / 92)
      d += (i ? "L" : "M") + ((i / n) * 1000).toFixed(1) + " " + y.toFixed(1)
    }
    return d
  }, [km])
  const x = (t: number) => Math.max(0, Math.min(100, (t / span) * 100))
  const blind = W.warning <= 0
  const marks: [string, number, string][] = [
    ["rupture", 0, "Rupture"],
    ["alert", W.alert, "Alert"],
    ["p", W.p, "P"],
    ["s", W.s, "S"],
  ]
  return (
    <div className="fsk-calc">
      <div className="fsk-read">
        <div className="fsk-big" aria-live="polite">
          {W.warning.toFixed(1)}
          <small>s</small>
        </div>
        <p>
          {blind
            ? "Inside the blind zone. The shaking arrives before any alert can."
            : "of warning before the S-wave, " + km + " km from the epicentre."}
        </p>
      </div>
      <div className="fsk-gram">
        <svg viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id={uid + "-hatch"} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="2" height="8" fill="var(--red)" opacity=".22" />
            </pattern>
          </defs>
          {!blind && <rect x={x(W.alert) * 10} y="0" width={(x(W.s) - x(W.alert)) * 10} height="220" fill={"url(#" + uid + "-hatch)"} />}
          <path d={path} fill="none" stroke="var(--ink)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          {marks.map(([k, t]) => (
            <line
              key={k}
              x1={x(t) * 10}
              x2={x(t) * 10}
              y1="26"
              y2="220"
              stroke={k === "s" || k === "alert" ? "var(--red)" : "var(--muted)"}
              strokeWidth={k === "s" || k === "alert" ? 1.6 : 1}
              strokeDasharray={k === "p" || k === "rupture" ? "3 3" : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {marks
          .filter(([k]) => k !== "rupture")
          .map(([k, t, label]) => {
            // alert and S share the top edge: when they crowd, each label leans away from the other
            const other = k === "alert" ? W.s : W.alert
            const crowd = k !== "p" && Math.abs(x(t) - x(other)) < 12
            const lean = !crowd ? "translateX(-50%)" : t <= other ? "translateX(calc(-100% - 4px))" : "translateX(4px)"
            return (
              <span
                key={k}
                className="fsk-mark fsk-mono"
                data-k={k}
                style={{ left: x(t) + "%", top: k === "p" ? "auto" : 4, bottom: k === "p" ? 4 : "auto", transform: k === "p" ? "translateX(4px)" : lean }}
              >
                {label}
              </span>
            )
          })}
      </div>
      <div className="fsk-axis fsk-mono fsk-num" aria-hidden="true">
        {[0, 10, 20, 30, 40].map((s) => (
          <span key={s} style={{ left: x(s) + "%" }}>
            {s} s
          </span>
        ))}
      </div>
      <div className="fsk-range">
        <label htmlFor={uid + "-km"}>
          <span>Your distance from the epicentre</span>
          <b className="fsk-num">{km} km</b>
        </label>
        <input
          id={uid + "-km"}
          type="range"
          min={5}
          max={150}
          step={1}
          value={km}
          onChange={(e) => setKm(Number(e.target.value))}
          aria-valuetext={km + " kilometres, " + W.warning.toFixed(1) + " seconds of warning"}
        />
        <p className="fsk-blind">
          Inside about {Math.round(fskBlindZone())} km there is no warning. We tell you that up front.
        </p>
      </div>
    </div>
  )
}

/** The playbook on the clock: the last seconds before the S-wave, one red tick per action. */
function PlayStrip(props: { steps: FskPlay[]; lead: number; pAfterAlert: number; hot: number; uid: string }) {
  const { steps, lead, pAfterAlert, hot, uid } = props
  const from = -Math.ceil(lead + 1)
  const span = -from + 3
  const x = (t: number) => ((t - from) / span) * 1000
  const d = React.useMemo(() => {
    const syn = fskSynth(5)
    syn.quakes.push({ p: -lead + pAfterAlert - from, s: -from, amp: 0.8 })
    let out = ""
    const n = span * FSK_SR
    for (let i = 0; i < n; i++) {
      const v = syn.next(i / FSK_SR)
      out += (i ? "L" : "M") + ((i / n) * 1000).toFixed(1) + " " + (46 + 34 * Math.tanh((v * 9) / 34)).toFixed(1)
    }
    return out
  }, [lead, pAfterAlert, from, span])
  const ticks = []
  for (let t = Math.ceil(from / 5) * 5; t <= 0; t += 5) ticks.push(t)
  return (
    <div className="fsk-strip" aria-hidden="true">
      <svg viewBox="0 0 1000 92" preserveAspectRatio="none">
        <rect x={x(-lead)} y="0" width={x(0) - x(-lead)} height="92" fill={"url(#" + uid + "-hatch2)"} />
        <defs>
          <pattern id={uid + "-hatch2"} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="8" fill="var(--red)" opacity=".16" />
          </pattern>
        </defs>
        <path d={d} fill="none" stroke="var(--ink)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
        {steps.map((st, i) => (
          <line
            key={i}
            x1={x(-st.at)}
            x2={x(-st.at)}
            y1="2"
            y2="92"
            stroke={i === hot ? "var(--ink)" : "var(--red)"}
            strokeWidth={i === hot ? 2.4 : 1.2}
            opacity={hot < 0 || i === hot ? 1 : 0.35}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line x1={x(0)} x2={x(0)} y1="2" y2="92" stroke="var(--red)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="fsk-strip-ax fsk-mono fsk-num">
        {ticks.map((t) => (
          <span key={t} style={{ left: (x(t) / 10) + "%" }}>
            {t === 0 ? "S arrives" : "T" + t + " s"}
          </span>
        ))}
      </div>
    </div>
  )
}

/** The footer trace: a plucked string you can strum with the pointer. Sleeps when still. */
function Wordmark(props: { word: string; reduced: boolean }) {
  const { word, reduced } = props
  const boxRef = React.useRef(null as HTMLDivElement | null)
  const pathRef = React.useRef(null as SVGPathElement | null)
  const tipRef = React.useRef(null as SVGGElement | null)
  React.useEffect(() => {
    const box = boxRef.current
    const path = pathRef.current
    const tip = tipRef.current
    if (!box || !path) return
    const N = 140
    const y = new Float32Array(N)
    const v = new Float32Array(N)
    const base = new Float32Array(N)
    const r = fskRandom(9)
    let a = 0
    for (let i = 0; i < N; i++) {
      a = a * 0.55 + (r() - 0.5)
      // the record dies away towards the end of the roll
      base[i] = a * 3.4 * (1 - 0.7 * Math.max(0, (i - N * 0.75) / (N * 0.25)))
    }
    // the word fills the measure exactly, whatever the brand name
    const word = box.querySelector("span") as HTMLElement | null
    const fit = () => {
      if (!word) return
      word.style.fontSize = ""
      const natural = word.scrollWidth
      const size = parseFloat(getComputedStyle(word).fontSize)
      if (natural > 0) word.style.fontSize = Math.min(420, (size * box.clientWidth) / natural) * 0.995 + "px"
    }
    let raf = 0
    let running = false
    let lastX = -1
    let lastY = 0
    const draw = () => {
      const w = box.clientWidth
      const h = box.clientHeight
      const mid = h - 20
      let d = ""
      const end = w - 16
      for (let i = 0; i < N; i++) {
        d += (i ? "L" : "M") + ((i / (N - 1)) * end).toFixed(1) + " " + (mid + base[i] + y[i]).toFixed(1)
      }
      path.setAttribute("d", d)
      // the hero's pen, lifted clear of the paper at the end of the record
      if (tip) tip.setAttribute("transform", "translate(" + (end + 6).toFixed(1) + " " + (mid - 10).toFixed(1) + ")")
    }
    const step = () => {
      const c2 = 0.9
      const dt = 1 / 2
      let energy = 0
      for (let s = 0; s < 2; s++) {
        for (let i = 1; i < N - 1; i++) {
          const acc = c2 * (y[i - 1] - 2 * y[i] + y[i + 1]) - 0.004 * y[i] - 0.035 * v[i]
          v[i] += acc * dt
        }
        for (let i = 1; i < N - 1; i++) {
          y[i] += v[i] * dt
          if (y[i] > 18 || y[i] < -18) {
            y[i] = y[i] > 0 ? 18 : -18
            v[i] *= -0.3
          }
          energy += v[i] * v[i] + y[i] * y[i] * 0.01
        }
      }
      draw()
      if (energy < 0.02) {
        y.fill(0)
        v.fill(0)
        draw()
        running = false
        return
      }
      raf = requestAnimationFrame(step)
    }
    const wake = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(step)
    }
    const move = (e: PointerEvent) => {
      if (reduced) return
      const rect = box.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      if (lastX >= 0) {
        const i = Math.round((px / rect.width) * (N - 1))
        const dy = py - lastY
        const near = Math.abs(py - (rect.height - 20)) < 90
        if (near && i > 1 && i < N - 2) {
          const f = Math.max(-30, Math.min(30, dy * 2.6))
          for (let k = -3; k <= 3; k++) v[i + k] = (v[i + k] || 0) + f * (1 - Math.abs(k) / 4)
          wake()
        }
      }
      lastX = px
      lastY = py
    }
    const leave = () => {
      lastX = -1
    }
    fit()
    draw()
    const ro = new ResizeObserver(() => {
      fit()
      draw()
    })
    ro.observe(box)
    box.addEventListener("pointermove", move)
    box.addEventListener("pointerleave", leave)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      box.removeEventListener("pointermove", move)
      box.removeEventListener("pointerleave", leave)
    }
  }, [reduced])
  return (
    <div className="fsk-word" ref={boxRef} aria-hidden="true">
      <span>{word}</span>
      <svg>
        <path ref={pathRef} fill="none" stroke="var(--red)" strokeWidth="2" strokeLinejoin="round" />
        <g ref={tipRef}>
          <line x1="0" y1="0" x2="11" y2="-24" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          <circle r="3" fill="var(--red)" />
        </g>
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ the page */

/** One FAQ entry: a short trace fragment in the margin, the answer as a pen note. */
function FaqItem(props: { f: FskFaq; i: number }) {
  const { f, i } = props
  const d = React.useMemo(() => fskTracePath(90 + i * 13, 120, 24, 60, 3.4), [i])
  return (
    <details open={i === 0}>
      <summary>
        <svg className="fsk-frag" viewBox="0 0 120 24" preserveAspectRatio="none" aria-hidden="true">
          <path d={d} fill="none" stroke="currentColor" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
        </svg>
        <span>{f.question}</span>
        <i aria-hidden="true" />
      </summary>
      <p>{f.answer}</p>
    </details>
  )
}

/** A red pen tick in the margin where each section starts on the record. */
function Stamp() {
  return <span className="fsk-stamp" aria-hidden="true" />
}

/** The school drill as the campus sensor recorded it: the tone, a burst of footsteps, then stillness. */
function DrillRecord(props: { seconds: number; tone: string; uid: string }) {
  const { seconds, tone, uid } = props
  const span = 36
  const toneT = 3
  const x = (t: number) => (t / span) * 1000
  const d = React.useMemo(() => {
    const syn = fskSynth(311)
    const r = fskRandom(12)
    let out = ""
    const n = span * FSK_SR
    for (let i = 0; i < n; i++) {
      const t = i / FSK_SR
      // 1,140 pairs of feet: dense from the tone, thinning out as rooms settle
      const since = t - toneT
      if (since > 0.6 && since < seconds + 0.6) {
        const rate = 14 * Math.sin(Math.min(1, since / seconds) * Math.PI) + 2
        if (r() < rate / FSK_SR) syn.knock(0.25 + r() * 0.5)
      }
      const v = syn.next(t)
      out += (i ? "L" : "M") + ((i / n) * 1000).toFixed(1) + " " + (60 + 46 * Math.tanh((v * 26) / 46)).toFixed(1)
    }
    return out
  }, [seconds])
  return (
    <div className="fsk-drill" aria-hidden="true">
      <svg viewBox="0 0 1000 120" preserveAspectRatio="none">
        <defs>
          <pattern id={uid + "-hatch3"} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="8" fill="var(--red)" opacity=".18" />
          </pattern>
        </defs>
        <rect x={x(toneT)} y="14" width={x(toneT + seconds) - x(toneT)} height="106" fill={"url(#" + uid + "-hatch3)"} />
        <path d={d} fill="none" stroke="var(--ink)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
        <path
          d={"M" + x(toneT) + " 20V12H" + x(toneT + seconds) + "V20"}
          fill="none"
          stroke="var(--red)"
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
        />
        <line x1={x(toneT)} x2={x(toneT)} y1="12" y2="120" stroke="var(--red)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="fsk-drill-n fsk-mono" style={{ left: (x(toneT) + x(toneT + seconds)) / 20 + "%" }}>
        {seconds} s to under desks
      </span>
      <span className="fsk-drill-t fsk-mono" style={{ left: x(toneT) / 10 + "%" }}>
        Tone {tone}
      </span>
      <span className="fsk-drill-e fsk-mono">Still</span>
    </div>
  )
}

export default function HelicorderLanding({
  height = "100svh",
  brand = "Foreshock",
  defaultTheme = "system",
  nav = DEF_NAV,
  cta = DEF_CTA,
  hero = DEF_HERO,
  quake = DEF_QUAKE,
  how = DEF_HOW,
  sitesTitle = "What your building does with them",
  sitesIntro = "You choose the actions at the survey. On the day, they run in the order your safety lead signed off, timed to the second.",
  sites = DEF_SITES,
  network = DEF_NETWORK,
  quote = DEF_QUOTE,
  pricing = DEF_PRICING,
  faqTitle = "Questions we hear at every survey",
  faq = DEF_FAQ,
  footer = DEF_FOOTER,
  className,
}: HelicorderLandingProps) {
  const reduced = useReducedMotion()
  const uid = "fsk" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const drumApi = React.useRef(null as DrumApi | null)

  /* theme: "system" follows the host's .dark class first, then the OS */
  const [theme, setTheme] = React.useState((defaultTheme === "dark" ? "dark" : "light") as Theme)
  const [touched, setTouched] = React.useState(false)
  React.useEffect(() => {
    if (defaultTheme !== "system" || touched) return
    const read = () =>
      setTheme(
        document.documentElement.classList.contains("dark") ||
          (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches)
          ? "dark"
          : "light",
      )
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null
    mq?.addEventListener?.("change", read)
    return () => {
      mo.disconnect()
      mq?.removeEventListener?.("change", read)
    }
  }, [defaultTheme, touched])

  const [menu, setMenu] = React.useState(false)
  const [toast, setToast] = React.useState({ on: false, phase: "alert", left: 0 } as Toast)
  const [busy, setBusy] = React.useState(false)
  const [tab, setTab] = React.useState(0)
  const [count, setCount] = React.useState("12")
  const [hot, setHot] = React.useState(-1)
  const tabsRef = React.useRef(null as HTMLDivElement | null)
  const [ind, setInd] = React.useState({ x: 0, w: 0 })

  React.useEffect(() => {
    const el = tabsRef.current?.querySelectorAll("button")[tab] as HTMLElement | undefined
    if (!el) return
    const place = () => setInd({ x: el.offsetLeft, w: el.offsetWidth })
    place()
    const ro = new ResizeObserver(place)
    ro.observe(el)
    return () => ro.disconnect()
  }, [tab])

  React.useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menu])

  /* in-page anchors scroll inside the template and leave the host URL alone */
  const go = (e: React.MouseEvent, href: string) => {
    if (!href.startsWith("#")) return
    e.preventDefault()
    if (href.length < 2) return
    setMenu(false)
    const target = rootRef.current?.querySelector(local(href)) as HTMLElement | null
    target?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
  }

  // "#fsk-<section>" hrefs point at this instance's sections, so two copies never collide
  const local = (h: string) => (h.startsWith("#fsk-") ? "#" + uid + "-" + h.slice(5) : h)

  const toggleTheme = () => {
    setTouched(true)
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const n = sites.length
    let j = -1
    if (e.key === "ArrowRight") j = (i + 1) % n
    if (e.key === "ArrowLeft") j = (i - 1 + n) % n
    if (e.key === "Home") j = 0
    if (e.key === "End") j = n - 1
    if (j < 0) return
    e.preventDefault()
    setTab(j)
    setHot(-1)
    const btn = tabsRef.current?.querySelectorAll("button")[j] as HTMLElement | undefined
    btn?.focus()
  }

  const price = fskPrice(Number(count) || 1, pricing.each, pricing.volumeEach, pricing.volumeFrom)
  const money = (n: number) => pricing.currency + n.toLocaleString("en-GB")
  const site = sites[Math.min(tab, sites.length - 1)]
  const lead = fskWarning(quake.distanceKm)
  const parsed = Date.parse(quake.at || "")
  const sAt = Number.isFinite(parsed) ? parsed / 1000 : Date.UTC(2026, 2, 14, 9, 31, 37) / 1000
  const day = new Date(sAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
  // the page below the drum keeps the record's clock: one stamp per section

  return (
    <div ref={rootRef} className={"fsk" + (className ? " " + className : "")} data-theme={theme}>
      <style>{FSK_CSS}</style>
      <a className="fsk-skip" href={"#" + uid + "-main"} onClick={(e) => go(e, "#" + uid + "-main")}>
        Skip to content
      </a>

      <header className="fsk-head">
        <a className="fsk-brand" href={local("#fsk-top")} onClick={(e) => go(e, "#fsk-top")} aria-label={brand + ", top of page"}>
          <Mark />
          {brand}
        </a>
        <span className="fsk-meta fsk-mono" aria-hidden="true">
          {hero.station} · record of {day} · 1 min per line
        </span>
        <nav className="fsk-nav" aria-label="Main">
          {nav.map((l) => (
            <a key={l.href + l.label} href={local(l.href)} onClick={(e) => go(e, l.href)}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="fsk-tools">
          <button
            type="button"
            className="fsk-icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to white paper" : "Switch to smoked paper"}
          >
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="9" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 1.8a7.2 7.2 0 0 1 0 14.4z" fill="currentColor" />
            </svg>
          </button>
          <a className="fsk-btn fsk-btn--ink fsk-btn--sm fsk-cta-head" href={local(cta.href)} onClick={(e) => go(e, cta.href)}>
            {cta.label}
          </a>
          <button
            type="button"
            className="fsk-menu"
            aria-expanded={menu}
            aria-controls={uid + "-drawer"}
            onClick={() => setMenu(!menu)}
          >
            {menu ? "Close" : "Menu"}
          </button>
        </div>
        {menu && (
          <nav className="fsk-drawer" id={uid + "-drawer"} aria-label="Menu">
            {nav.map((l) => (
              <a key={l.href + l.label} href={local(l.href)} onClick={(e) => go(e, l.href)}>
                {l.label}
              </a>
            ))}
            <a className="fsk-btn fsk-btn--ink" href={local(cta.href)} onClick={(e) => go(e, cta.href)}>
              {cta.label}
            </a>
          </nav>
        )}
      </header>

      <main id={uid + "-main"}>
        <section
          id={uid + "-top"}
          className="fsk-hero"
          style={{ height: "calc(" + height + " - 64px)", minHeight: 560 }}
          aria-labelledby={uid + "-h1"}
        >
          <Drum
            theme={theme}
            reduced={reduced}
            quake={quake}
            apiRef={drumApi}
            onToast={(t) =>
              setToast((o) => (o.on === t.on && o.phase === t.phase && Math.ceil(o.left) === Math.ceil(t.left) ? o : t))
            }
            onBusy={setBusy}
          />
          <div className="fsk-veil" />
          <p className="fsk-sr">
            A seismograph drum record from {day}, one line per minute. An M{quake.magnitude.toFixed(1)} earthquake in the{" "}
            {quake.place}, {quake.distanceKm} km away, is marked in red: the alert went out {lead.warning.toFixed(1)} seconds
            before the S-wave reached this building. The lines below it are recording live.
          </p>
          <div className="fsk-copy">
            <h1 id={uid + "-h1"}>{hero.title}</h1>
            <p className="fsk-lede">{hero.lede}</p>
            <div className="fsk-ctas">
              <a className="fsk-btn fsk-btn--ink" href={local(cta.href)} onClick={(e) => go(e, cta.href)}>
                {cta.label}
                <Arrow />
              </a>
              <button
                type="button"
                className="fsk-btn fsk-btn--line"
                aria-disabled={busy}
                data-busy={busy}
                onClick={() => {
                  if (!busy) drumApi.current?.replay()
                }}
              >
                {busy ? (
                  <>
                    <i className="fsk-dot" aria-hidden="true" />
                    <span className="fsk-num">
                      {toast.on && toast.phase === "alert"
                        ? "S-wave in " + Math.ceil(toast.left) + " s"
                        : toast.on
                          ? "Shaking"
                          : "Listening"}
                    </span>
                  </>
                ) : (
                  hero.replay
                )}
              </button>
            </div>
          </div>
          <p className="fsk-sr" role="status" aria-live="polite">
            {toast.on ? (toast.phase === "alert" ? "Alert: M" + quake.magnitude.toFixed(1) + ", S-wave due in " + lead.warning.toFixed(0) + " seconds." : "S-wave arriving. Shaking now.") : ""}
          </p>
          <div className="fsk-toast" data-on={toast.on} aria-hidden="true">
            {toast.on && (
              <>
                <div className="fsk-mono">
                  <b>ALERT</b> · M{quake.magnitude.toFixed(1)} · {quake.distanceKm} km
                </div>
                <div className="fsk-count fsk-num">
                  {toast.phase === "alert" ? "S in " + Math.ceil(toast.left) + " s" : "Shaking now"}
                </div>
              </>
            )}
          </div>
          <div className="fsk-hfoot fsk-mono">
            <span>{hero.hint}</span>
            <span>Velocity, vertical · record of {day} · times in UTC</span>
          </div>
        </section>

        <div className="fsk-page">
          <Paper from={Math.floor(sAt / 60) * 60 + 8 * 60} />
          <section id={uid + "-how"} className="fsk-sec" aria-labelledby={uid + "-how-h"}>
            <Stamp />
            <h2 className="fsk-h2" id={uid + "-how-h"}>
              {how.title}
            </h2>
            <p className="fsk-intro">{how.intro}</p>
            <div className="fsk-how">
              <ol className="fsk-steps">
                {how.steps.map((s) => (
                  <li key={s.title}>
                    <span className="fsk-mono fsk-num">{s.at}</span>
                    <div>
                      <b>{s.title}</b>
                      <p>{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Calculator defaultKm={quake.distanceKm} uid={uid} />
            </div>
          </section>

          <Rule n={0} />

          <section id={uid + "-sites"} className="fsk-sec" aria-labelledby={uid + "-sites-h"}>
            <Stamp />
            <h2 className="fsk-h2" id={uid + "-sites-h"}>
              {sitesTitle}
            </h2>
            <p className="fsk-intro">{sitesIntro}</p>
            <div className="fsk-tabs" role="tablist" aria-label="Site type" ref={tabsRef}>
              <i style={{ width: ind.w, transform: "translateX(" + ind.x + "px)" }} aria-hidden="true" />
              {sites.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={uid + "-tab-" + s.id}
                  aria-selected={i === tab}
                  aria-controls={uid + "-panel"}
                  tabIndex={i === tab ? 0 : -1}
                  onClick={() => {
                    setTab(i)
                    setHot(-1)
                  }}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="fsk-play" id={uid + "-panel"} role="tabpanel" aria-labelledby={uid + "-tab-" + site.id}>
              <p>{site.summary}</p>
              <div>
                <PlayStrip steps={site.steps} lead={lead.s - lead.alert} pAfterAlert={lead.p - lead.alert} hot={hot} uid={uid} />
                <ol className="fsk-log" key={site.id} onMouseLeave={() => setHot(-1)}>
                  {site.steps.map((st, i) => (
                    <li
                      key={i}
                      style={{ animationDelay: i * 40 + "ms" }}
                      tabIndex={0}
                      onMouseEnter={() => setHot(i)}
                      onFocus={() => setHot(i)}
                      onClick={() => setHot(i)}
                      data-hot={i === hot}
                    >
                      <span className="fsk-mono fsk-t fsk-num">T−{st.at.toFixed(1)} s</span>
                      <span>{st.action}</span>
                      <span className="fsk-mono fsk-sys">{st.system}</span>
                    </li>
                  ))}
                  <li className="fsk-zero" style={{ animationDelay: site.steps.length * 40 + "ms" }}>
                    <span className="fsk-mono fsk-t fsk-num">T 0.0 s</span>
                    <span>
                      <b>S-wave arrives.</b> Everyone is already where they should be.
                    </span>
                    <span className="fsk-mono fsk-sys">Shaking</span>
                  </li>
                </ol>
              </div>
            </div>
          </section>

          <Rule n={1} />

          <section id={uid + "-network"} className="fsk-sec" aria-labelledby={uid + "-net"}>
            <Stamp />
            <div className="fsk-net-head">
              <h2 className="fsk-h2" id={uid + "-net"}>
                {network.title}
              </h2>
              <p className="fsk-intro">{network.intro}</p>
            </div>
            <div className="fsk-stations">
              <div className="fsk-st fsk-st--head fsk-mono" aria-hidden="true">
                <span>Station</span>
                <span>Site</span>
                <span>M5.8 as each station heard it · seconds after rupture</span>
                <span>Latency</span>
              </div>
              <ul aria-label="Stations, nearest first">
                {network.stations
                  .slice()
                  .sort((p, q) => (p.km ?? 0) - (q.km ?? 0))
                  .map((st, i) => (
                    <StationRow key={st.code} st={st} i={i} third={i === 2} />
                  ))}
              </ul>
              <div className="fsk-st fsk-st--axis fsk-mono fsk-num" aria-hidden="true">
                <span />
                <span />
                <span className="fsk-ax">
                  {[0, 10, 20, 30].map((t) => (
                    <b key={t} style={{ left: (t / FSK_NET_SPAN) * 100 + "%" }}>
                      {t} s
                    </b>
                  ))}
                </span>
                <span />
              </div>
              <dl className="fsk-readings">
                {network.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="fsk-mono">{m.label}</dt>
                    <dd className="fsk-num">
                      {m.value}
                      {m.unit && <small>{m.unit}</small>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className="fsk-sec fsk-sec--drill" aria-labelledby={uid + "-drill"}>
            <Stamp />
            <figure className="fsk-quote">
              <blockquote id={uid + "-drill"}>“{quote.text}”</blockquote>
              <DrillRecord seconds={quote.seconds ?? 9} tone={quote.tone ?? "10:02:00"} uid={uid} />
              <figcaption>
                <span className="fsk-mono">{quote.note}</span>
                <b>{quote.name}</b>
                <span>{quote.role}</span>
              </figcaption>
            </figure>
          </section>

          <Rule n={2} />

          <section id={uid + "-pricing"} className="fsk-sec" aria-labelledby={uid + "-price"}>
            <Stamp />
            <div className="fsk-price">
              <div>
                <h2 className="fsk-h2" id={uid + "-price"}>
                  {pricing.title}
                </h2>
                <p className="fsk-intro">{pricing.intro}</p>
                <ul className="fsk-incl">
                  {pricing.included.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="fsk-card">
                <div className="fsk-card-h fsk-mono">
                  <span>Rate card</span>
                  <span>FS-RC · {day}</span>
                </div>
                <div className="fsk-field">
                  <label className="fsk-mono" htmlFor={uid + "-count"}>
                    Buildings
                  </label>
                  <div className="fsk-step">
                    <button type="button" aria-label="One building fewer" onClick={() => setCount(String(Math.max(1, price.buildings - 1)))}>
                      −
                    </button>
                    <input
                      id={uid + "-count"}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={500}
                      value={count}
                      onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                      onBlur={() => setCount(String(price.buildings))}
                    />
                    <button type="button" aria-label="One building more" onClick={() => setCount(String(Math.min(500, price.buildings + 1)))}>
                      +
                    </button>
                  </div>
                </div>
                <div className="fsk-field">
                  <span className="fsk-mono">Rate</span>
                  <span className="fsk-num">
                    {money(price.unit)} <small>per building, per month</small>
                  </span>
                </div>
                <div className="fsk-field fsk-field--total" aria-live="polite">
                  <span className="fsk-mono">Monthly</span>
                  <strong className="fsk-num">{money(price.month)}</strong>
                </div>
                <div className="fsk-field">
                  <span className="fsk-mono">Yearly</span>
                  <span className="fsk-num">{money(price.year)}</span>
                </div>
                <p className="fsk-pnote fsk-mono">
                  {price.buildings >= pricing.volumeFrom
                    ? "Volume rate applied: " + money(pricing.volumeEach) + " from " + pricing.volumeFrom + " buildings."
                    : money(pricing.volumeEach) + " per building from " + pricing.volumeFrom + " buildings. Prices exclude VAT."}
                </p>
                <a className="fsk-btn fsk-btn--ink" href={local(cta.href)} onClick={(e) => go(e, cta.href)}>
                  {cta.label}
                  <Arrow />
                </a>
              </div>
            </div>
          </section>

          <Rule n={3} />

          <section id={uid + "-faq"} className="fsk-sec" aria-labelledby={uid + "-faq-h"}>
            <Stamp />
            <h2 className="fsk-h2" id={uid + "-faq-h"}>
              {faqTitle}
            </h2>
            <div className="fsk-faq">
              {faq.map((f, i) => (
                <FaqItem key={f.question} f={f} i={i} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer id={uid + "-survey"} className="fsk-foot fsk-page">
        <span className="fsk-end fsk-mono" aria-hidden="true">
          End of record · pen lifted
        </span>
        <div className="fsk-fgrid">
          <div>
            <h2>{footer.heading}</h2>
            <p>{footer.text}</p>
            <a className="fsk-mail" href={"mailto:" + footer.email}>
              {footer.email}
            </a>
          </div>
          <nav className="fsk-cols" aria-label="Footer">
            {footer.columns.map((c) => (
              <div key={c.title}>
                <h3>{c.title}</h3>
                {c.links.map((l) => (
                  <a key={l.label} href={local(l.href)} onClick={(e) => go(e, l.href)}>
                    {l.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <Wordmark word={brand} reduced={reduced} />
        <div className="fsk-legal fsk-mono">
          <span>{footer.legal}</span>
          <span>Alerts are a safety aid, not a guarantee.</span>
        </div>
      </footer>
    </div>
  )
}
