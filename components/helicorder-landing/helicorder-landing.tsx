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
export type FskStation = { code: string; name: string; channel: string; latency: string }
export type FskMetric = { value: string; unit?: string; label: string }
export type FskFaq = { question: string; answer: string }
export type FskColumn = { title: string; links: FskLink[] }

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
  quake?: { magnitude: number; distanceKm: number; place: string }
  how?: { title: string; intro: string; steps: FskStep[] }
  sitesTitle?: string
  sitesIntro?: string
  sites?: FskSite[]
  network?: { title: string; intro: string; metrics: FskMetric[]; stations: FskStation[] }
  quote?: { text: string; name: string; role: string; note: string }
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
const DEF_QUAKE = { magnitude: 5.8, distanceKm: 76, place: "Sea of Marmara" }
const DEF_HOW = {
  title: "Where the seconds come from",
  intro:
    "Every earthquake sends two waves at once. The first is fast and gentle, the second slower and destructive. We sit in the gap.",
  steps: [
    { at: "0.0 s", title: "Rupture", text: "A fault slips. P-waves leave at about 6 km/s, S-waves at about 3.5 km/s." },
    { at: "2.1 s", title: "Our sensors feel it", text: "The nearest stations record the P-wave. It is small, but it travels fastest." },
    { at: "4.6 s", title: "Alert sent", text: "Three stations agree, we estimate size and place, and every site in range hears within 300 ms." },
    { at: "+", title: "Your building acts", text: "Until the S-wave reaches you, your playbook runs on its own. Nobody has to press anything." },
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
    { code: "FS.IZMT", name: "İzmit Bay", channel: "HHZ", latency: "0.21 s" },
    { code: "FS.YLVA", name: "Yalova", channel: "HHZ", latency: "0.18 s" },
    { code: "FS.ADPZ", name: "Adapazarı", channel: "HHZ", latency: "0.24 s" },
    { code: "FS.SLVR", name: "Silivri", channel: "HHZ", latency: "0.19 s" },
    { code: "FS.TKRD", name: "Tekirdağ", channel: "HHZ", latency: "0.27 s" },
    { code: "FS.BRSA", name: "Bursa", channel: "HHZ", latency: "0.22 s" },
  ],
}
const DEF_QUOTE = {
  text: "On the March drill, 1,140 students were under their desks nine seconds after the tone. We never managed that with a bell.",
  name: "Ayşe Demir",
  role: "Facilities lead, Kadıköy Lisesi",
  note: "Drill · 4 Mar 2026 · 10:02 UTC",
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
  const spr = wide ? 60 : phone ? 30 : 45
  const rowH = phone ? 22 : wide ? 28 : 26
  const left = phone ? 46 : 70
  const right = phone ? 14 : wide ? 70 : 24
  const top = phone ? 26 : 34
  const bottom = phone ? 52 : 56
  const rows = Math.max(6, Math.floor((h - top - bottom) / rowH))
  return { spr, rowH, rows, left, right, top, plotW: Math.max(40, w - left - right), phone, wide }
}

/** Where the recorded quake's S-wave lands on a fresh drum: [row, fraction of the row]. */
export function fskEventSlot(rows: number, wide: boolean) {
  const row = Math.max(2, Math.min(rows - 3, Math.round(rows * (wide ? 0.5 : 0.66))))
  return [row, wide ? 0.86 : 0.9]
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
  const cBand = resonator(0.7, 0.97)
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
        if (tp > 0) eP += q.amp * 0.85 * (1 - Math.exp(-tp / 0.25)) * Math.exp(-tp / 6)
        const ts = t - q.s
        if (ts > 0) {
          eS += q.amp * 3.4 * (1 - Math.exp(-ts / 0.5)) * Math.exp(-ts / 7.5)
          eC += q.amp * 1.5 * (1 - Math.exp(-ts / 3)) * Math.exp(-ts / 24)
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
.fsk-nav a::after{content:"";position:absolute;left:0;right:0;bottom:2px;height:1.5px;background:var(--red);transform:scaleX(0);transform-origin:left;transition:transform .32s var(--ease)}
.fsk-nav a:hover::after,.fsk-nav a:focus-visible::after{transform:scaleX(1)}
.fsk-tools{display:flex;align-items:center;gap:10px;flex:none}
.fsk-icon{width:40px;height:40px;display:grid;place-items:center;border:1px solid var(--line);border-radius:999px;transition:border-color .2s,transform .12s}
.fsk-icon:hover{border-color:var(--ink)}
.fsk-icon:active{transform:scale(.95)}
.fsk-icon svg{width:18px;height:18px}
.fsk-menu{display:none;font:600 13px/1 var(--mono);height:40px;padding:0 14px;border:1px solid var(--line);border-radius:999px}
.fsk-drawer{position:absolute;left:0;right:0;top:64px;background:var(--paper);border-bottom:1px solid var(--line);padding:8px 16px 20px;display:grid;gap:2px;transform-origin:top;animation:fsk-drop .26s var(--ease)}
.fsk-drawer a{font-size:22px;letter-spacing:-.02em;padding:10px 0;border-bottom:1px solid var(--faint)}
.fsk-drawer .fsk-btn{margin-top:14px;justify-content:center}
@keyframes fsk-drop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}

.fsk-btn{position:relative;display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 20px;border-radius:999px;font-weight:600;font-size:15px;letter-spacing:-.005em;white-space:nowrap;overflow:hidden;isolation:isolate;transition:transform .14s var(--ease),color .3s var(--ease),border-color .3s}
.fsk-btn::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--red);transform:translateY(101%);transition:transform .38s var(--ease)}
.fsk-btn:hover::before,.fsk-btn:focus-visible::before{transform:none}
.fsk-btn:active{transform:scale(.97)}
.fsk-btn--ink{background:var(--ink);color:var(--paper)}
.fsk-btn--ink:hover{color:#fff}
.fsk-btn--line{border:1px solid var(--ink);color:var(--ink)}
.fsk-btn--line:hover{color:#fff;border-color:var(--red)}
.fsk[data-theme="dark"] .fsk-btn--ink:hover,.fsk[data-theme="dark"] .fsk-btn--line:hover{color:#121211}
.fsk-btn--sm{height:40px;padding:0 16px;font-size:14px}
.fsk-btn svg{width:16px;height:10px;transition:transform .38s var(--ease)}
.fsk-btn:hover svg{transform:translateX(4px)}
.fsk-btn[disabled]{opacity:.55;cursor:default}
.fsk-btn[disabled]::before{display:none}

.fsk-hero{position:relative;overflow:hidden;touch-action:manipulation;cursor:crosshair}
.fsk-drum,.fsk-drum canvas{position:absolute;inset:0}
.fsk-drum canvas{width:100%;height:100%}
.fsk-roll{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,var(--shade),transparent 9%,transparent 88%,var(--shade))}
.fsk-pen{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;will-change:transform}
.fsk-pen::before{content:"";position:absolute;left:-1px;bottom:0;width:2px;height:30px;background:var(--ink);transform-origin:bottom;transform:rotate(24deg);border-radius:2px}
.fsk-pen::after{content:"";position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:var(--red)}
.fsk-veil{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,color-mix(in srgb,var(--paper) 93%,transparent) 0,color-mix(in srgb,var(--paper) 93%,transparent) 40%,transparent 57%)}
.fsk-copy{position:absolute;left:var(--gut);top:clamp(28px,7%,84px);width:min(600px,40%);cursor:auto}
.fsk-copy h1{font-size:clamp(44px,5.3vw,88px);line-height:.95;letter-spacing:-.045em;font-weight:700;margin-left:-.04em;text-wrap:balance}
.fsk-lede{margin-top:24px;font-size:19px;line-height:1.5;color:var(--soft);max-width:30ch}
.fsk-ctas{margin-top:32px;display:flex;flex-wrap:wrap;gap:12px}
.fsk-hfoot{position:absolute;left:var(--gut);right:24px;bottom:16px;display:flex;justify-content:space-between;gap:24px;color:var(--muted);pointer-events:none}
.fsk-toast{position:absolute;right:24px;top:20px;z-index:5;max-width:340px;padding:12px 16px;background:var(--chip);border:1.5px solid var(--red);color:var(--ink);opacity:0;transform:translateY(-6px);transition:opacity .2s,transform .3s var(--ease);pointer-events:none}
.fsk-toast[data-on="true"]{opacity:1;transform:none}
.fsk-toast b{color:var(--red);font-weight:700}
.fsk-toast .fsk-count{font:700 34px/1 var(--sans);letter-spacing:-.03em;margin-top:6px;color:var(--red)}

.fsk-page{position:relative;background-image:linear-gradient(90deg,transparent calc(var(--gut) - 14px),var(--line) calc(var(--gut) - 14px),var(--line) calc(var(--gut) - 13px),transparent calc(var(--gut) - 13px)),repeating-linear-gradient(180deg,transparent 0,transparent 31px,var(--faint) 31px,var(--faint) 32px)}
.fsk-sec{position:relative;padding:112px 24px 112px var(--gut)}
.fsk-sec--tight{padding-top:80px;padding-bottom:80px}
.fsk-rule{height:44px;color:var(--ink);opacity:.55}
.fsk-rule svg{width:100%;height:44px}
.fsk-h2{font-size:clamp(34px,3.8vw,60px);line-height:1;letter-spacing:-.04em;font-weight:700;text-wrap:balance;max-width:16ch}
.fsk-intro{margin-top:20px;max-width:46ch;color:var(--soft)}
.fsk-tag{position:absolute;left:12px;top:118px;width:calc(var(--gut) - 30px);text-align:right;color:var(--muted)}

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
.fsk-axis{display:flex;justify-content:space-between;margin-top:8px;color:var(--muted)}
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
.fsk-tabs i{position:absolute;top:4px;bottom:4px;left:0;border-radius:999px;background:var(--ink);transition:transform .38s var(--ease),width .38s var(--ease)}
.fsk-play{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:64px;margin-top:40px}
.fsk-play>p{font-size:22px;line-height:1.35;letter-spacing:-.015em;color:var(--soft)}
.fsk-log{border-top:1.5px solid var(--ink)}
.fsk-log li{display:grid;grid-template-columns:96px 1fr auto;gap:20px;align-items:baseline;padding:16px 0;border-bottom:1px solid var(--line);animation:fsk-in .42s var(--ease) both}
.fsk-log li:last-child{border-bottom:1.5px solid var(--ink)}
.fsk-log .fsk-t{color:var(--red)}
.fsk-log .fsk-sys{color:var(--muted);text-align:right}
.fsk-log .fsk-zero b{color:var(--red)}
@keyframes fsk-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.fsk-net{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:64px;margin-top:56px}
.fsk-metrics{display:grid;gap:28px;align-content:start}
.fsk-metrics dt{font-size:clamp(44px,4.4vw,68px);line-height:.9;letter-spacing:-.05em;font-weight:700;font-variant-numeric:tabular-nums}
.fsk-metrics dt small{font-size:.4em;letter-spacing:-.01em;margin-left:.12em;color:var(--muted);font-weight:600}
.fsk-metrics dd{color:var(--muted);font-size:15px;margin-top:6px;max-width:24ch}
.fsk-stations{border-top:1.5px solid var(--ink)}
.fsk-st{display:grid;grid-template-columns:88px 112px minmax(0,1fr) 64px;gap:16px;align-items:center;height:64px;border-bottom:1px solid var(--line)}
.fsk-st .fsk-mono:first-child{font-weight:700}
.fsk-st .fsk-nm{font-size:15px}
.fsk-st .fsk-lat{color:var(--muted);text-align:right}
.fsk-wave{position:relative;height:40px;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.fsk-wave svg{position:absolute;left:0;top:0;width:200%;height:40px;animation:fsk-scroll linear infinite}
@keyframes fsk-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.fsk-quote{display:grid;grid-template-columns:minmax(0,9fr) minmax(0,3fr);gap:48px;align-items:end}
.fsk-quote blockquote{font-size:clamp(30px,3.4vw,52px);line-height:1.08;letter-spacing:-.035em;font-weight:600;text-indent:-.42em;text-wrap:pretty}
.fsk-quote figcaption{border-top:1.5px solid var(--red);padding-top:12px}
.fsk-quote figcaption b{display:block;font-size:16px}
.fsk-quote figcaption span{display:block;color:var(--muted);font-size:15px}
.fsk-quote .fsk-mono{color:var(--red);margin-top:12px}

.fsk-price{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,6fr);gap:64px;margin-top:56px;align-items:start}
.fsk-incl li{display:grid;grid-template-columns:28px 1fr;padding:14px 0;border-bottom:1px solid var(--line);font-size:16px}
.fsk-incl li::before{content:"";width:12px;height:1.5px;background:var(--red);margin-top:12px}
.fsk-sheet{border:1.5px solid var(--ink);padding:28px;background:var(--paper)}
.fsk-sheet h3{font-size:15px;font-weight:600}
.fsk-step{display:flex;align-items:center;gap:0;margin-top:14px;border:1px solid var(--line);border-radius:999px;width:max-content}
.fsk-step button{width:48px;height:48px;font-size:22px;border-radius:999px;transition:background .2s,transform .12s}
.fsk-step button:hover{background:var(--faint)}
.fsk-step button:active{transform:scale(.92)}
.fsk-step input{width:72px;height:48px;text-align:center;background:transparent;border:0;font-size:20px;font-weight:600;font-variant-numeric:tabular-nums;-moz-appearance:textfield}
.fsk-step input::-webkit-inner-spin-button,.fsk-step input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.fsk-total{margin-top:28px;padding-top:20px;border-top:1px solid var(--line);display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap}
.fsk-total strong{font-size:clamp(48px,5vw,76px);line-height:.9;letter-spacing:-.05em;font-weight:700;font-variant-numeric:tabular-nums}
.fsk-total span{color:var(--muted);font-size:15px}
.fsk-sheet .fsk-btn{margin-top:28px;width:100%;justify-content:center}
.fsk-note{margin-top:12px;color:var(--muted)}

.fsk-faq{margin-top:48px;border-top:1.5px solid var(--ink);max-width:880px}
.fsk-faq details{border-bottom:1px solid var(--line)}
.fsk-faq summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px 0;cursor:pointer;font-size:20px;letter-spacing:-.015em;font-weight:600}
.fsk-faq summary::-webkit-details-marker{display:none}
.fsk-faq summary i{position:relative;flex:none;width:16px;height:16px}
.fsk-faq summary i::before,.fsk-faq summary i::after{content:"";position:absolute;left:0;right:0;top:7px;height:2px;background:var(--red);transition:transform .3s var(--ease)}
.fsk-faq summary i::after{transform:rotate(90deg)}
.fsk-faq details[open] summary i::after{transform:rotate(0)}
.fsk-faq p{padding:0 48px 24px 0;color:var(--soft);max-width:62ch;animation:fsk-in .32s var(--ease)}

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
.fsk-word{position:relative;margin-top:96px;user-select:none;touch-action:pan-y}
.fsk-word span{display:block;font-size:clamp(64px,17.2vw,300px);line-height:.78;letter-spacing:-.065em;font-weight:700;margin-left:-.05em;white-space:nowrap}
.fsk-word svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.fsk-legal{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-top:28px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted)}

@media (max-width:1099px){
.fsk{--gut:40px}
.fsk-meta,.fsk-nav{display:none}
.fsk-menu{display:inline-flex;align-items:center}
.fsk-head{padding-left:20px;padding-right:16px;justify-content:space-between}
.fsk-head .fsk-cta-head{display:none}
.fsk-veil{background:linear-gradient(180deg,color-mix(in srgb,var(--paper) 94%,transparent) 0,color-mix(in srgb,var(--paper) 94%,transparent) 44%,transparent 60%)}
.fsk-copy{left:var(--gut);right:24px;width:auto;max-width:640px}
.fsk-copy h1{font-size:clamp(40px,7.4vw,72px)}
.fsk-how,.fsk-play,.fsk-net,.fsk-price,.fsk-fgrid{grid-template-columns:1fr;gap:48px}
.fsk-quote{grid-template-columns:1fr;gap:28px}
.fsk-tag{display:none}
.fsk-toast{top:auto;bottom:56px;left:var(--gut);right:24px;max-width:none}
}
@media (max-width:639px){
.fsk{--gut:20px;font-size:16px}
.fsk-page{background-image:repeating-linear-gradient(180deg,transparent 0,transparent 31px,var(--faint) 31px,var(--faint) 32px)}
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
.fsk-steps li{grid-template-columns:56px 1fr}
.fsk-gram{height:180px}
.fsk-tabs{display:flex;width:100%;overflow-x:auto;scrollbar-width:none}
.fsk-tabs button{flex:1 0 auto;padding:0 14px}
.fsk-play>p{font-size:19px}
.fsk-log li{grid-template-columns:72px 1fr;gap:4px 12px}
.fsk-log .fsk-sys{grid-column:2;text-align:left}
.fsk-st{grid-template-columns:84px minmax(0,1fr) 52px;grid-template-rows:auto auto;height:auto;padding:10px 0;gap:2px 10px}
.fsk-st .fsk-wave{grid-column:1 / -1;grid-row:2}
.fsk-sheet{padding:20px}
.fsk-faq summary{font-size:18px;padding:18px 0}
.fsk-faq p{padding-right:0}
.fsk-foot{padding:72px 20px 24px var(--gut)}
.fsk-cols{grid-template-columns:repeat(2,minmax(0,1fr))}
.fsk-word{margin-top:64px}
.fsk-toast{bottom:52px}
}
@media (prefers-reduced-motion:reduce){
.fsk *,.fsk *::before,.fsk *::after{animation:none !important;transition-duration:.01ms !important}
.fsk-wave svg{transform:translateX(-12%)}
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

function Drum(props: {
  theme: Theme
  reduced: boolean
  quake: { magnitude: number; distanceKm: number; place: string }
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
    if (!host || !pen) return
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

    let L = fskLayout(host.clientWidth || 1, host.clientHeight || 1)
    let dpr = 1
    let synth = fskSynth(1983)
    let data = new Float32Array(1)
    let gen = 0 // samples written since t0
    let drawn = 0 // samples drawn
    let t0 = 0 // epoch seconds at the left of row 0
    let rowOffset = 0 // absolute index of row 0, for the ink cycle
    let marks: { alert: number; p: number; s: number; live: boolean }[] = []
    let raf = 0
    let last = 0
    let visible = true
    let busyUntil = 0
    let lastRow = -1
    let clock = 0 // fractional sample position of the pen

    const palette = () => {
      const dark = themeRef.current === "dark"
      return {
        dark,
        ink: dark ? ["#efeee8", "#cfcec8", "#efeee8", "#b9b8b1"] : INK_LIGHT,
        label: dark ? "#a09f98" : "#596067",
        rule: dark ? "rgba(235,234,228,.07)" : "rgba(19,21,23,.06)",
        red: dark ? "#ff6d58" : "#c0281a",
        chip: dark ? "#121211" : "#f4f5f3",
      }
    }

    const cap = () => L.rows * L.spr * FSK_SR
    const gain = () => L.rowH * 0.4
    const limit = () => L.rowH * 1.7
    const pos = (tRel: number) => {
      const row = Math.floor(tRel / L.spr)
      const x = L.left + ((tRel - row * L.spr) / L.spr) * L.plotW
      const y = L.top + row * L.rowH + L.rowH / 2
      return { row, x, y }
    }

    const fill = (upto: number) => {
      const end = Math.min(upto, cap())
      for (; gen < end; gen++) data[gen] = synth.next(t0 + gen / FSK_SR)
    }

    // a fresh record: hours of trace already written, the quake on it, the pen mid-row
    const build = () => {
      const w = host.clientWidth || 1
      const h = host.clientHeight || 1
      L = fskLayout(w, h)
      const budget = 2.2e6
      dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(budget / Math.max(1, w * h)))
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      const now = Date.now() / 1000
      const rowStart = Math.floor(now / L.spr) * L.spr
      t0 = rowStart - (L.rows - 1) * L.spr
      rowOffset = Math.floor(t0 / L.spr)
      const penAt = (L.rows - 1) * L.spr + Math.min(0.42, Math.max(0.12, (now - rowStart) / L.spr))
      const slot = fskEventSlot(L.rows, L.wide)
      const sRel = (slot[0] + slot[1]) * L.spr
      synth = fskSynth(1983)
      synth.quakes.push({ p: t0 + sRel - lead + pAfterAlert, s: t0 + sRel, amp: 1 })
      marks = [{ alert: sRel - lead, p: sRel - lead + pAfterAlert, s: sRel, live: false }]
      data = new Float32Array(cap())
      gen = 0
      fill(Math.floor(penAt * FSK_SR))
      clock = gen
      drawn = 0
      lastRow = -1
      redraw()
    }

    const strokeRange = (from: number, to: number) => {
      const pal = palette()
      const g = gain()
      const lim = limit()
      ctx.lineWidth = pal.dark ? 1 : 1.15
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      let i = Math.max(0, from)
      while (i < to) {
        const row = Math.floor(i / (L.spr * FSK_SR))
        const rowEnd = Math.min(to, (row + 1) * L.spr * FSK_SR)
        const k = (((row + rowOffset) % 4) + 4) % 4
        ctx.strokeStyle = pal.ink[k]
        ctx.globalAlpha = pal.dark ? (k % 2 ? 0.78 : 0.95) : 0.92
        ctx.beginPath()
        const y0 = L.top + row * L.rowH + L.rowH / 2
        for (let j = i; j < rowEnd; j++) {
          const x = L.left + ((j / FSK_SR - row * L.spr) / L.spr) * L.plotW
          const v = data[j] * g
          const y = y0 + lim * Math.tanh(v / lim)
          if (j === i) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        i = rowEnd
      }
      ctx.globalAlpha = 1
    }

    const chip = (text: string, x: number, y: number, align: "left" | "center" | "right", color: string) => {
      const pal = palette()
      ctx.font = "600 " + (L.phone ? 10 : 11) + "px ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"
      const w = ctx.measureText(text).width
      const x0 = align === "center" ? x - w / 2 : align === "right" ? x - w : x
      ctx.fillStyle = pal.chip
      ctx.fillRect(x0 - 4, y - 8, w + 8, 15)
      ctx.fillStyle = color
      ctx.textBaseline = "middle"
      ctx.textAlign = "left"
      ctx.fillText(text, x0, y)
    }

    const drawMarks = () => {
      const pal = palette()
      const penT = gen / FSK_SR
      for (const m of marks) {
        const ticks: [number, string][] = [
          [m.alert, "ALERT"],
          [m.p, "P"],
          [m.s, "S"],
        ]
        for (const [t, name] of ticks) {
          if (t < 0 || t > penT) continue
          const q = pos(t)
          if (q.row >= L.rows) continue
          ctx.strokeStyle = pal.red
          ctx.lineWidth = name === "P" ? 1 : 1.5
          ctx.beginPath()
          ctx.moveTo(q.x, q.y - L.rowH * 0.9)
          ctx.lineTo(q.x, q.y + L.rowH * 0.62)
          ctx.stroke()
          chip(name, q.x + 4, q.y + L.rowH * 0.62, "left", pal.red)
        }
        if (m.s > penT || m.alert < 0) continue
        // the bracket, in pen, above the row: alert to S
        const a = pos(m.alert)
        const s = pos(m.s)
        const yA = a.y - L.rowH * 0.9
        const segs: [number, number, number][] =
          a.row === s.row
            ? [[a.x, s.x, yA]]
            : [
                [a.x, L.left + L.plotW, yA],
                [L.left, s.x, s.y - L.rowH * 0.9],
              ]
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
        const when = clockUTC(t0 + m.alert, true)
        const txt = L.phone
          ? lead.toFixed(1) + " s warning · M" + quake.magnitude.toFixed(1)
          : lead.toFixed(1) + " s of warning · M" + quake.magnitude.toFixed(1) + " " + quake.place + " · " + quake.distanceKm + " km · alert " + when + " UTC"
        chip(txt, (longest[0] + longest[1]) / 2, longest[2] - 9, "center", pal.red)
      }
    }

    const drawFrame = () => {
      const pal = palette()
      const w = canvas.width / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, canvas.height / dpr)
      // row rules and the time margins
      ctx.font = (L.phone ? "10px" : "11px") + " ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"
      ctx.textBaseline = "middle"
      const withSec = L.spr % 60 !== 0
      for (let r = 0; r < L.rows; r++) {
        const y = L.top + r * L.rowH + L.rowH / 2
        ctx.fillStyle = pal.rule
        ctx.fillRect(L.left, Math.round(y), L.plotW, 1)
        ctx.fillStyle = pal.label
        ctx.textAlign = "right"
        ctx.fillText(clockUTC(t0 + r * L.spr, withSec), L.left - 10, y)
        if (L.wide) {
          ctx.textAlign = "left"
          ctx.fillText(clockLocal(t0 + r * L.spr, withSec), L.left + L.plotW + 10, y)
        }
      }
      // seconds scale along the top
      ctx.fillStyle = pal.label
      ctx.textAlign = "center"
      const step = L.spr >= 45 ? 5 : 5
      for (let s = 0; s <= L.spr; s += step) {
        const x = L.left + (s / L.spr) * L.plotW
        const major = s % (step * 2) === 0
        ctx.fillRect(Math.round(x), L.top - (major ? 9 : 5), 1, major ? 6 : 3)
        if (major && (!L.phone || s % 10 === 0)) ctx.fillText(s + (s === 0 ? " s" : ""), x, L.top - 18)
      }
      ctx.textAlign = "right"
      if (!L.phone) ctx.fillText("UTC", L.left - 10, L.top - 18)
      if (L.wide) {
        ctx.textAlign = "left"
        ctx.fillText("Local", L.left + L.plotW + 10, L.top - 18)
      }
    }

    function redraw() {
      drawFrame()
      strokeRange(0, gen)
      drawn = gen
      drawMarks()
      placePen()
    }
    redrawRef.current = redraw

    const placePen = () => {
      const t = Math.max(0, gen - 1) / FSK_SR
      const q = pos(t)
      const v = data[Math.max(0, gen - 1)] * gain()
      const lim = limit()
      const y = q.y + lim * Math.tanh(v / lim)
      pen.style.transform = "translate(" + q.x.toFixed(1) + "px," + y.toFixed(1) + "px)"
    }

    const shift = () => {
      const per = L.spr * FSK_SR
      data.copyWithin(0, per)
      gen -= per
      clock -= per
      t0 += L.spr
      rowOffset += 1
      marks = marks
        .map((m) => ({ ...m, alert: m.alert - L.spr, p: m.p - L.spr, s: m.s - L.spr }))
        .filter((m) => m.s > -L.spr * 2)
      redraw()
    }

    const advance = (by: number) => {
      clock += by
      while (clock > cap()) {
        fill(cap())
        shift()
      }
      const before = gen
      fill(Math.floor(clock))
      if (gen > before) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        strokeRange(Math.max(0, drawn - 1), gen)
        drawn = gen
        const row = Math.floor(gen / (L.spr * FSK_SR))
        const penT = gen / FSK_SR
        const passed = marks.some((m) => m.live && [m.alert, m.p, m.s].some((t) => t > before / FSK_SR && t <= penT))
        if (row !== lastRow || passed) {
          lastRow = row
          drawMarks()
        }
        placePen()
      }
      // the live alert: tell the page, count down to the S-wave
      const penT = gen / FSK_SR
      const live = marks.find((m) => m.live && penT >= m.alert && penT < m.s + 6)
      if (live) onToast({ on: true, phase: penT < live.s ? "alert" : "shake", left: Math.max(0, live.s - penT) })
      else if (busyUntil && penT > busyUntil) {
        busyUntil = 0
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
      advance(dt * FSK_SR)
    }

    build()
    if (!reduced) raf = requestAnimationFrame(tick)

    const knock = (e: PointerEvent) => {
      const el = e.target as HTMLElement
      if (el.closest("a,button,input,.fsk-copy")) return
      synth.knock(0.7 + Math.random() * 0.5)
      if (reduced) {
        advance(FSK_SR * 4)
      }
    }
    const heroEl = host.parentElement
    heroEl?.addEventListener("pointerdown", knock)

    apiRef.current = {
      replay() {
        if (busyUntil) return
        const penT = gen / FSK_SR
        const alert = penT + 0.8
        synth.quakes.push({ p: t0 + alert + pAfterAlert, s: t0 + alert + lead, amp: 1 })
        marks.push({ alert, p: alert + pAfterAlert, s: alert + lead, live: true })
        busyUntil = alert + lead + 6
        onBusy(true)
        if (reduced) {
          advance(Math.ceil((alert + lead + 30) * FSK_SR) - gen)
          for (const m of marks) m.live = false
          redraw()
          busyUntil = 0
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
      heroEl?.removeEventListener("pointerdown", knock)
      apiRef.current = null
      redrawRef.current = null
      canvas.remove()
    }
  }, [reduced, quake.distanceKm, quake.magnitude, quake.place])

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

function Rule(props: { seed: number }) {
  const d = React.useMemo(() => fskTracePath(props.seed, 1200, 44, 360, 7), [props.seed])
  return (
    <div className="fsk-rule" aria-hidden="true">
      <svg viewBox="0 0 1200 44" preserveAspectRatio="none">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

function StationRow(props: { st: FskStation; i: number }) {
  const { st, i } = props
  const d = React.useMemo(() => fskTracePath(40 + i * 17, 1200, 40, 300, 6 + (i % 3) * 1.5), [i])
  return (
    <li className="fsk-st">
      <span className="fsk-mono">{st.code}</span>
      <span className="fsk-nm">{st.name}</span>
      <span className="fsk-wave" aria-hidden="true">
        <svg viewBox="0 0 2400 40" preserveAspectRatio="none" style={{ animationDuration: 9 + ((i * 7) % 6) + "s" }}>
          <path d={d} fill="none" stroke="currentColor" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
          <path d={d} transform="translate(1200 0)" fill="none" stroke="currentColor" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
      <span className="fsk-mono fsk-lat fsk-num">
        <span className="fsk-sr">{st.channel}, latency </span>
        {st.latency}
      </span>
    </li>
  )
}

/** Warning-time calculator, drawn as the seismogram the site would record. */
function Calculator(props: { defaultKm: number }) {
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
            <pattern id="fsk-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="2" height="8" fill="var(--red)" opacity=".22" />
            </pattern>
          </defs>
          {!blind && <rect x={x(W.alert) * 10} y="0" width={(x(W.s) - x(W.alert)) * 10} height="220" fill="url(#fsk-hatch)" />}
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
        {marks.map(([k, t, label]) => (
          <span
            key={k}
            className="fsk-mark fsk-mono"
            data-k={k}
            style={{
              left: x(t) + "%",
              top: k === "p" ? "auto" : 4,
              bottom: k === "p" ? 4 : "auto",
              transform: k === "rupture" ? "none" : "translateX(-50%)",
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="fsk-axis fsk-mono fsk-num" aria-hidden="true">
        {[0, 10, 20, 30, 40].map((s) => (
          <span key={s}>{s} s</span>
        ))}
      </div>
      <div className="fsk-range">
        <label htmlFor="fsk-km">
          <span>Your distance from the epicentre</span>
          <b className="fsk-num">{km} km</b>
        </label>
        <input
          id="fsk-km"
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

/** The footer trace: a plucked string you can strum with the pointer. Sleeps when still. */
function Wordmark(props: { word: string; reduced: boolean }) {
  const { word, reduced } = props
  const boxRef = React.useRef(null as HTMLDivElement | null)
  const pathRef = React.useRef(null as SVGPathElement | null)
  React.useEffect(() => {
    const box = boxRef.current
    const path = pathRef.current
    if (!box || !path) return
    const N = 140
    const y = new Float32Array(N)
    const v = new Float32Array(N)
    const base = new Float32Array(N)
    const r = fskRandom(9)
    let a = 0
    for (let i = 0; i < N; i++) {
      a = a * 0.55 + (r() - 0.5)
      base[i] = a * 2.2
    }
    let raf = 0
    let running = false
    let lastX = -1
    let lastY = 0
    const draw = () => {
      const w = box.clientWidth
      const h = box.clientHeight
      const mid = h * 0.56
      let d = ""
      for (let i = 0; i < N; i++) {
        d += (i ? "L" : "M") + ((i / (N - 1)) * w).toFixed(1) + " " + (mid + base[i] + y[i]).toFixed(1)
      }
      path.setAttribute("d", d)
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
        const near = Math.abs(py - rect.height * 0.56) < rect.height * 0.5
        if (near && i > 1 && i < N - 2) {
          const f = Math.max(-14, Math.min(14, dy * 0.6))
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
    draw()
    const ro = new ResizeObserver(draw)
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
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ the page */

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
  const [count, setCount] = React.useState(12)
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
    setMenu(false)
    const target = rootRef.current?.querySelector(href) as HTMLElement | null
    target?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
  }

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
    const btn = tabsRef.current?.querySelectorAll("button")[j] as HTMLElement | undefined
    btn?.focus()
  }

  const price = fskPrice(count, pricing.each, pricing.volumeEach, pricing.volumeFrom)
  const money = (n: number) => pricing.currency + n.toLocaleString("en-GB")
  const site = sites[Math.min(tab, sites.length - 1)]
  const lead = fskWarning(quake.distanceKm)

  return (
    <div ref={rootRef} className={"fsk" + (className ? " " + className : "")} data-theme={theme}>
      <style>{FSK_CSS}</style>
      <a className="fsk-skip" href="#fsk-main" onClick={(e) => go(e, "#fsk-main")}>
        Skip to content
      </a>

      <header className="fsk-head">
        <a className="fsk-brand" href="#fsk-top" onClick={(e) => go(e, "#fsk-top")} aria-label={brand + ", top of page"}>
          <Mark />
          {brand}
        </a>
        <span className="fsk-meta fsk-mono" aria-hidden="true">
          {hero.station} · 1 min per line
        </span>
        <nav className="fsk-nav" aria-label="Main">
          {nav.map((l) => (
            <a key={l.href + l.label} href={l.href} onClick={(e) => go(e, l.href)}>
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
          <a className="fsk-btn fsk-btn--ink fsk-btn--sm fsk-cta-head" href={cta.href} onClick={(e) => go(e, cta.href)}>
            {cta.label}
          </a>
          <button type="button" className="fsk-menu" aria-expanded={menu} aria-controls="fsk-drawer" onClick={() => setMenu(!menu)}>
            {menu ? "Close" : "Menu"}
          </button>
        </div>
        {menu && (
          <nav className="fsk-drawer" id="fsk-drawer" aria-label="Menu">
            {nav.map((l) => (
              <a key={l.href + l.label} href={l.href} onClick={(e) => go(e, l.href)}>
                {l.label}
              </a>
            ))}
            <a className="fsk-btn fsk-btn--ink" href={cta.href} onClick={(e) => go(e, cta.href)}>
              {cta.label}
            </a>
          </nav>
        )}
      </header>

      <main id="fsk-main">
        <section
          id="fsk-top"
          className="fsk-hero"
          style={{ height: "calc(" + height + " - 64px)", minHeight: 560 }}
          aria-labelledby="fsk-h1"
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
            A seismograph drum record, one line per minute. An M{quake.magnitude.toFixed(1)} earthquake in the {quake.place},{" "}
            {quake.distanceKm} km away, is marked in red: the alert went out {lead.warning.toFixed(1)} seconds before the
            S-wave reached this building.
          </p>
          <div className="fsk-copy">
            <h1 id="fsk-h1">{hero.title}</h1>
            <p className="fsk-lede">{hero.lede}</p>
            <div className="fsk-ctas">
              <a className="fsk-btn fsk-btn--ink" href={cta.href} onClick={(e) => go(e, cta.href)}>
                {cta.label}
                <Arrow />
              </a>
              <button
                type="button"
                className="fsk-btn fsk-btn--line"
                disabled={busy}
                onClick={() => drumApi.current?.replay()}
              >
                {busy ? "Recording" : hero.replay}
              </button>
            </div>
          </div>
          <div className="fsk-toast" data-on={toast.on} role="status" aria-live="polite">
            {toast.on && (
              <>
                <div className="fsk-mono">
                  <b>ALERT</b> · M{quake.magnitude.toFixed(1)} · {quake.place} · {quake.distanceKm} km
                </div>
                <div className="fsk-count fsk-num">
                  {toast.phase === "alert" ? "S-wave in " + Math.ceil(toast.left) + " s" : "Shaking now"}
                </div>
              </>
            )}
          </div>
          <div className="fsk-hfoot fsk-mono">
            <span>{hero.hint}</span>
            <span>Velocity, vertical · 1 min per line · times in UTC</span>
          </div>
        </section>

        <div className="fsk-page">
          <section id="fsk-how" className="fsk-sec" aria-labelledby="fsk-how-h">
            <h2 className="fsk-h2" id="fsk-how-h">
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
              <Calculator defaultKm={quake.distanceKm} />
            </div>
          </section>

          <Rule seed={3} />

          <section id="fsk-sites" className="fsk-sec" aria-labelledby="fsk-sites-h">
            <h2 className="fsk-h2" id="fsk-sites-h">
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
                  id={"fsk-tab-" + s.id}
                  aria-selected={i === tab}
                  aria-controls="fsk-panel"
                  tabIndex={i === tab ? 0 : -1}
                  onClick={() => setTab(i)}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="fsk-play" id="fsk-panel" role="tabpanel" aria-labelledby={"fsk-tab-" + site.id}>
              <p>{site.summary}</p>
              <ol className="fsk-log" key={site.id}>
                {site.steps.map((st, i) => (
                  <li key={i} style={{ animationDelay: i * 45 + "ms" }}>
                    <span className="fsk-mono fsk-t fsk-num">T−{st.at.toFixed(1)} s</span>
                    <span>{st.action}</span>
                    <span className="fsk-mono fsk-sys">{st.system}</span>
                  </li>
                ))}
                <li className="fsk-zero" style={{ animationDelay: site.steps.length * 45 + "ms" }}>
                  <span className="fsk-mono fsk-t fsk-num">T 0.0 s</span>
                  <span>
                    <b>S-wave arrives.</b> Everyone is already where they should be.
                  </span>
                  <span className="fsk-mono fsk-sys">Shaking</span>
                </li>
              </ol>
            </div>
          </section>

          <Rule seed={11} />

          <section id="fsk-network" className="fsk-sec" aria-labelledby="fsk-net-h">
            <h2 className="fsk-h2" id="fsk-net-h">
              {network.title}
            </h2>
            <p className="fsk-intro">{network.intro}</p>
            <div className="fsk-net">
              <dl className="fsk-metrics">
                {network.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="fsk-num">
                      {m.value}
                      {m.unit && <small>{m.unit}</small>}
                    </dt>
                    <dd>{m.label}</dd>
                  </div>
                ))}
              </dl>
              <ul className="fsk-stations" aria-label="Stations, live">
                {network.stations.map((st, i) => (
                  <StationRow key={st.code} st={st} i={i} />
                ))}
              </ul>
            </div>
          </section>

          <section className="fsk-sec fsk-sec--tight" aria-label="From a customer">
            <figure className="fsk-quote">
              <blockquote>“{quote.text}”</blockquote>
              <figcaption>
                <b>{quote.name}</b>
                <span>{quote.role}</span>
                <span className="fsk-mono">{quote.note}</span>
              </figcaption>
            </figure>
          </section>

          <Rule seed={23} />

          <section id="fsk-pricing" className="fsk-sec" aria-labelledby="fsk-price-h">
            <h2 className="fsk-h2" id="fsk-price-h">
              {pricing.title}
            </h2>
            <div className="fsk-price">
              <div>
                <p className="fsk-intro" style={{ marginTop: 0 }}>
                  {pricing.intro}
                </p>
                <ul className="fsk-incl" style={{ marginTop: 28 }}>
                  {pricing.included.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="fsk-sheet">
                <h3 id="fsk-count-l">Buildings</h3>
                <div className="fsk-step">
                  <button type="button" aria-label="One building fewer" onClick={() => setCount(Math.max(1, price.buildings - 1))}>
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={500}
                    value={count}
                    aria-labelledby="fsk-count-l"
                    onChange={(e) => setCount(Number(e.target.value) || 1)}
                    onBlur={() => setCount(price.buildings)}
                  />
                  <button type="button" aria-label="One building more" onClick={() => setCount(Math.min(500, price.buildings + 1))}>
                    +
                  </button>
                </div>
                <div className="fsk-total" aria-live="polite">
                  <strong>{money(price.month)}</strong>
                  <span>
                    a month · {money(price.unit)} per building
                    <br />
                    {money(price.year)} a year
                  </span>
                </div>
                <a className="fsk-btn fsk-btn--ink" href={cta.href} onClick={(e) => go(e, cta.href)}>
                  {cta.label}
                  <Arrow />
                </a>
                <p className="fsk-note fsk-mono">
                  {money(pricing.volumeEach)} per building from {pricing.volumeFrom} buildings. Prices exclude VAT.
                </p>
              </div>
            </div>
          </section>

          <Rule seed={31} />

          <section id="fsk-faq" className="fsk-sec" aria-labelledby="fsk-faq-h">
            <h2 className="fsk-h2" id="fsk-faq-h">
              {faqTitle}
            </h2>
            <div className="fsk-faq">
              {faq.map((f, i) => (
                <details key={f.question} open={i === 0}>
                  <summary>
                    {f.question}
                    <i aria-hidden="true" />
                  </summary>
                  <p>{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer id="fsk-survey" className="fsk-foot fsk-page">
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
                  <a key={l.label} href={l.href} onClick={(e) => go(e, l.href)}>
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
