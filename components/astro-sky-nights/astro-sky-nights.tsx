"use client"

// The Astro Association nights section, standalone: a "Sky tonight" card
// with the real moon phase — phase name, % lit, days to full or new, and how
// dark the sky is — that you can step or scrub night by night, beside a
// filterable list of events with their own moon, seats and an RSVP toggle.
//
// Part of the Astro library — lifted out of astro-association-template, so it
// looks the same and stacks with the other pieces. Every picture is drawn in
// this file (canvas + SVG). Nothing loads at runtime.
import * as React from "react"

/* ------------------------------------------------------------------ types */

export type AstroNavLink = { label: string; /** A section key ("mission") or any href. */ target: string }
export type AstroPalette = {
  name: string
  /** Type, buttons, rules. */
  accent: string
  /** The page frame. */
  frame: string
  /** Bubble colours. The first is the ground the others sit on. */
  colors: string[]
}
export type AstroPaletteName = "cobalt" | "aurora" | "nebula" | "solar"
export type AstroHero = {
  /** The bubble-filled wordmark. Short words read best. */
  wordmark: string
  issue: string
  /** `\n` breaks the line; the last line gets the sliced echo. */
  title: string
  blurb: string
  credit: string
  primaryCta: string
  secondaryCta: string
  /** Under the wordmark. Empty hides it. */
  hint: string
}
export type AstroStat = { value: string; label: string }
export type AstroMission = {
  /** White type on the bubble band. `\n` breaks the line. */
  bandTitle: string
  kicker: string
  /** Three small labels spread across a hairline. */
  meta: string[]
  title: string
  body: string
  stats: AstroStat[]
}
export type AstroProject = {
  code: string
  title: string
  summary: string
  detail: string
  status: "open" | "ongoing" | "archived"
  /** 0–1. Omit to hide the bar. */
  progress?: number
  /** Caption for the bar, e.g. "7,412 of 10,000 readings". */
  goal?: string
  cta?: string
}
export type AstroProjects = {
  /** Oversized type behind the ribbons. `\n` breaks the line. */
  title: string
  issue: string
  /** Text that runs along the dark ribbons. */
  ribbonText: string
  body: string
  heading: string
}
export type AstroNight = {
  /** ISO date, "2026-11-14". */
  date: string
  time: string
  title: string
  place: string
  /** Filter chip: "Star party", "Talk", ... */
  kind: string
  /** What to look at. */
  target: string
  seats?: number
  going?: number
}
export type AstroTier = { name: string; price: string; period?: string; blurb: string; perks: string[]; featured?: boolean }
export type AstroJoin = {
  tag: string
  title: string
  body: string
  namePlaceholder: string
  emailPlaceholder: string
  button: string
  /** `{name}` is replaced with the member's first name. */
  success: string
}
export type AstroFooter = { bandTitle: string; tagline: string; credit: string; links: { label: string; href: string }[] }
export type AstroMember = { name: string; email: string; tier: string; number: string }

export type AstroSkyNightsProps = {
  tag?: string
  title?: string
  /** Labels on the hairline above the title. */
  meta?: string[]
  nights?: AstroNight[]
  onRsvp?: (night: AstroNight, going: boolean) => void
  /** The day the sky card opens on. Defaults to today. */
  skyDate?: string | Date
  /** Anchor id, so a nav can scroll here. */
  id?: string
  /** A preset ("cobalt" · "aurora" · "nebula" · "solar") or your own palette. */
  palette?: AstroPaletteName | AstroPalette
  /** "system" follows the host's .dark class, then the OS. */
  defaultTheme?: "system" | "light" | "dark"
  onThemeChange?: (theme: "light" | "dark") => void
  /** The periwinkle page frame. Turn off when stacking pieces. */
  frame?: boolean
  fonts?: { display?: string; body?: string; mono?: string }
  maxWidth?: string
  className?: string
}

/* ------------------------------------------------------------------ logic */

// #region logic
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

function easeOutCubic(t: number): number {
  const c = clamp(t, 0, 1)
  return 1 - Math.pow(1 - c, 3)
}

// "ASTRO.\nASSOCiATION" → lines. A literal backslash-n counts too, since
// that's what "\n" becomes in a JSX attribute.
function lines(s: string): string[] {
  return s.split(/\n|\\n/).filter((l) => l.length > 0)
}

type Bubble = { x: number; y: number; r: number; c: number; ph: number; amp: number; sp: number }

// A seeded confetti of circles covering a w × h field (and a little past its
// edges, so nothing reads as cut). Sizes lean small; the big ones go first so
// the small ones layer on top.
function buildBubbles(seed: number, w: number, h: number, nColors: number, density = 1, scale = 1): Bubble[] {
  const rnd = mulberry32(seed)
  const unit = Math.max(6, Math.min(w, h) * 0.12 * scale)
  const n = Math.round(clamp(((w * h) / (unit * unit * 1.25)) * density, 12, 1400))
  const out: Bubble[] = []
  for (let i = 0; i < n; i++) {
    const r = unit * (0.22 + 1.3 * Math.pow(rnd(), 2.3))
    out.push({
      x: rnd() * (w + r) - r / 2,
      y: rnd() * (h + r) - r / 2,
      r,
      c: 1 + Math.floor(rnd() * Math.max(1, nColors - 1)),
      ph: rnd() * Math.PI * 2,
      amp: 1 + rnd() * 3.5,
      sp: 0.25 + rnd() * 0.6,
    })
  }
  return out.sort((a, b) => b.r - a.r)
}

// The same confetti as a CSS background, for small surfaces that don't need a
// live canvas: hard-edged radial gradients over the ground colour.
function bubbleCss(seed: number, colors: string[], n = 34, maxR = 46): string {
  const rnd = mulberry32(seed)
  const layers: string[] = []
  for (let i = 0; i < n; i++) {
    const r = Math.round(6 + (maxR - 6) * Math.pow(rnd(), 1.8))
    const x = Math.round(rnd() * 100)
    const y = Math.round(rnd() * 100)
    const c = colors[1 + Math.floor(rnd() * Math.max(1, colors.length - 1))] ?? colors[0]
    layers.push("radial-gradient(circle at " + x + "% " + y + "%, " + c + " 0 " + r + "px, transparent " + (r + 0.6) + "px)")
  }
  return layers.reverse().join(", ") + ", " + (colors[0] ?? "#2b3bff")
}

const SYNODIC = 29.530588853
// A known new moon: 2000-01-06 18:14 UTC.
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14)

function moonPhase(at: Date | number): { age: number; fraction: number; illumination: number; name: string; waxing: boolean; daysToFull: number; daysToNew: number } {
  const ms = typeof at === "number" ? at : at.getTime()
  const days = (ms - NEW_MOON_REF) / 86400000
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC
  const fraction = age / SYNODIC
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2
  return {
    age,
    fraction,
    illumination,
    name: phaseName(fraction),
    waxing: fraction < 0.5,
    daysToFull: (((0.5 - fraction) % 1) + 1) % 1 * SYNODIC,
    daysToNew: ((1 - fraction) % 1) * SYNODIC,
  }
}

function phaseName(f: number): string {
  if (f < 0.0339 || f > 0.9661) return "New Moon"
  if (f < 0.216) return "Waxing Crescent"
  if (f < 0.284) return "First Quarter"
  if (f < 0.466) return "Waxing Gibbous"
  if (f < 0.534) return "Full Moon"
  if (f < 0.716) return "Waning Gibbous"
  if (f < 0.784) return "Last Quarter"
  return "Waning Crescent"
}

// The lit part of a moon of radius r centred on 0,0, as an SVG path:
// the bright limb as a half circle, closed by the terminator's half ellipse.
function moonPath(fraction: number, r: number): string {
  const f = ((fraction % 1) + 1) % 1
  const waxing = f < 0.5
  const c = Math.cos(2 * Math.PI * f)
  const rx = Math.abs(c) * r
  const limb = waxing ? 1 : 0
  const term = waxing ? (c > 0 ? 0 : 1) : c < 0 ? 0 : 1
  const R = r.toFixed(2)
  return "M0,-" + R + "A" + R + "," + R + " 0 0 " + limb + " 0," + R + "A" + rx.toFixed(2) + "," + R + " 0 0 " + term + " 0,-" + R + "Z"
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

// "2026-11-14" → its parts, read as a calendar date (no timezone drift).
function parseDay(iso: string): { day: string; mon: string; dow: string; ms: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], 21)
  const d = new Date(ms)
  if (d.getUTCMonth() !== +m[2] - 1) return null
  return { day: String(d.getUTCDate()).padStart(2, "0"), mon: MONTHS[d.getUTCMonth()], dow: WEEKDAYS[d.getUTCDay()], ms }
}

function isoDay(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
}

function memberNumber(name: string, email: string): string {
  return "#" + String(100 + (hashStr(name.trim().toLowerCase() + "|" + email.trim().toLowerCase()) % 9900)).padStart(4, "0")
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? ""
}

// "1,840+" → { prefix: "", value: 1840, decimals: 0, suffix: "+" }
function splitStat(s: string): { prefix: string; value: number; decimals: number; suffix: string } | null {
  const m = s.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/)
  if (!m) return null
  const num = m[2].replace(/,/g, "")
  const dot = num.indexOf(".")
  return { prefix: m[1], value: parseFloat(num), decimals: dot < 0 ? 0 : num.length - dot - 1, suffix: m[3] }
}

function formatStat(s: string, t: number): string {
  const p = splitStat(s)
  if (!p) return s
  const v = p.value * easeOutCubic(t)
  const grouped = p.value >= 1000 && p.decimals === 0
  const body = grouped ? Math.round(v).toLocaleString("en-US") : v.toFixed(p.decimals)
  return p.prefix + body + p.suffix
}

// Keeps a followed angle continuous, so a CSS transition never spins the long way.
function unwrapAngle(prev: number, next: number): number {
  let d = (next - prev) % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return prev + d
}
// #endregion logic

/* ---------------------------------------------------------------- palettes */

const PALETTES: { [K in AstroPaletteName]: AstroPalette } = {
  cobalt: {
    name: "Cobalt",
    accent: "#2233ff",
    frame: "#8d9cff",
    colors: ["#2f47ff", "#1a2cff", "#3d63ff", "#1e88ff", "#27b4f5", "#12d0ff", "#1fe3c0", "#41ef96", "#7f93ff", "#b5c3ff", "#dfe6ff", "#0f1fc4", "#5a46ff"],
  },
  aurora: {
    name: "Aurora",
    accent: "#00876a",
    frame: "#86dcc2",
    colors: ["#00a884", "#007a63", "#00c49a", "#25e0a7", "#7ef5c4", "#00b3c7", "#1f8fff", "#a8f0d8", "#d9fff1", "#00594a", "#5be37f", "#c6f86a"],
  },
  nebula: {
    name: "Nebula",
    accent: "#6a22ff",
    frame: "#c3a8ff",
    colors: ["#6f3cff", "#4b1fd6", "#8f5bff", "#c04dff", "#ff4fd2", "#ff8ad9", "#3d6bff", "#b8a4ff", "#ead9ff", "#2a118f", "#ff6f91", "#7cd3ff"],
  },
  solar: {
    name: "Solar",
    accent: "#e23d00",
    frame: "#ffb48c",
    colors: ["#ff5a1f", "#e23d00", "#ff7a00", "#ffa400", "#ffd23f", "#ff3d6e", "#ff8f6b", "#ffe08a", "#fff1cc", "#b52a00", "#ff5fa2", "#ffc2a1"],
  },
}
const PALETTE_ORDER: AstroPaletteName[] = ["cobalt", "aurora", "nebula", "solar"]

const FONT_DISPLAY = '"Poppins","Montserrat","Gilroy","Avenir Next","Century Gothic","Futura",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'
const FONT_MONO = '"JetBrains Mono","IBM Plex Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace'

/* ---------------------------------------------------------------- defaults */

function inDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return isoDay(d)
}

const D_NIGHTS: AstroNight[] = [
  { date: inDays(4), time: "20:30", title: "Saturn & the autumn sky", place: "Hilltop field, north gate", kind: "Star party", target: "Saturn's rings", seats: 40, going: 27 },
  { date: inDays(9), time: "19:00", title: "How to read a star chart", place: "Library annex, room 2", kind: "Workshop", target: "Planisphere basics", seats: 18, going: 15 },
  { date: inDays(16), time: "21:00", title: "Deep-sky marathon", place: "Dark site, 40 min drive", kind: "Star party", target: "Andromeda galaxy", seats: 24, going: 9 },
  { date: inDays(23), time: "19:30", title: "What the probes found", place: "Town hall auditorium", kind: "Talk", target: "Outer-planet missions", seats: 120, going: 64 },
  { date: inDays(30), time: "22:00", title: "Meteor shower watch", place: "Hilltop field, north gate", kind: "Star party", target: "Peak hour radiant", seats: 60, going: 31 },
]

/* -------------------------------------------------------------- component */

export default function AstroSkyNights({
  tag = "Observation nights",
  title = "Clear skies, together.",
  meta = ["#102 daily design", "ASTRO. association"],
  nights = D_NIGHTS,
  onRsvp,
  skyDate,
  id = "nights",
  palette = "cobalt",
  defaultTheme = "system",
  onThemeChange,
  frame = true,
  fonts,
  maxWidth = "1240px",
  className = "",
}: AstroSkyNightsProps) {
  const uid = "aa" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const reduced = useReducedMotion()
  const { pal, colors, theme } = useAstroLook(palette, defaultTheme, onThemeChange)
  const baseDay = React.useMemo(() => {
    const d = skyDate ? new Date(skyDate) : new Date()
    return isNaN(d.getTime()) ? new Date() : d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skyDate instanceof Date ? skyDate.getTime() : skyDate])
  const [dayOffset, setDayOffset] = React.useState(0)
  const skyDay = new Date(baseDay.getTime() + dayOffset * 86400000)
  skyDay.setHours(22, 0, 0, 0)
  const moon = moonPhase(skyDay)
  const moonlight = moon.illumination < 0.25 ? "Dark" : moon.illumination < 0.65 ? "Fair" : "Bright"
  const kinds = React.useMemo(() => ["All", ...Array.from(new Set(nights.map((n) => n.kind)))], [nights])
  const [kind, setKind] = React.useState("All")
  const [going, setGoing] = React.useState({} as { [k: string]: boolean })
  const shown = nights.map((n, i) => ({ n, i })).filter(({ n }) => kind === "All" || n.kind === kind)
  const toggleRsvp = (n: AstroNight, i: number) => {
    const key = n.date + i
    const next = !going[key]
    setGoing((g) => ({ ...g, [key]: next }))
    onRsvp?.(n, next)
  }
  const [nightsRef, nightsIn] = useInView(0.12)

  return (
    <div className={"aa-root" + (frame ? "" : " aa-noframe") + " " + className} data-theme={theme} style={rootStyleOf(pal, fonts, maxWidth)}>
      <style>{AA_CSS}</style>
      <div className="aa-shell">
        <section className="aa-sec aa-pad" id={id || undefined}>
          <div className="aa-in aa-reveal" ref={nightsRef as never} data-in={nightsIn}>
            <div className="aa-meta">
              <span className="aa-label">{tag}</span>
              {meta.map((m, i) => (
                <span key={i} className="aa-label">
                  {m}
                </span>
              ))}
            </div>
            <div className="aa-proj-head" style={{ marginTop: "clamp(22px,3cqi,36px)", marginBottom: 0 }}>
              <h2 className="aa-h2">{title}</h2>
              <Asterisk size={30} />
            </div>
            <div className="aa-nights">
              <div className="aa-sky">
                <div className="aa-sky-row">
                  <span className="aa-label">Sky tonight</span>
                  <button type="button" className="aa-today" data-on={dayOffset !== 0} onClick={() => setDayOffset(0)} disabled={dayOffset === 0}>
                    {dayOffset === 0 ? "Today" : "Back to today"}
                  </button>
                </div>
                <Moon fraction={moon.fraction} colors={colors} uid={uid} spin={!reduced} />
                <div style={{ textAlign: "center" }}>
                  <h3 aria-live="polite">{moon.name}</h3>
                  <span className="aa-mono" style={{ color: "var(--aa-muted)" }}>
                    {WEEKDAYS[skyDay.getDay()]} {String(skyDay.getDate()).padStart(2, "0")} {MONTHS[skyDay.getMonth()]} {skyDay.getFullYear()}
                  </span>
                </div>
                <div className="aa-sky-row" style={{ justifyContent: "center", gap: 14 }}>
                  <button type="button" className="aa-step" aria-label="Previous night" onClick={() => setDayOffset((d) => d - 1)}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M10 3L5 8l5 5" />
                    </svg>
                  </button>
                  <input
                    type="range"
                    min={-15}
                    max={30}
                    value={dayOffset}
                    onChange={(e) => setDayOffset(+e.target.value)}
                    aria-label="Scrub nights"
                    style={{ accentColor: "var(--aa-blue)", width: "min(160px,40cqi)" }}
                  />
                  <button type="button" className="aa-step" aria-label="Next night" onClick={() => setDayOffset((d) => d + 1)}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 3l5 5-5 5" />
                    </svg>
                  </button>
                </div>
                <div className="aa-sky-facts">
                  <div>
                    <b>{Math.round(moon.illumination * 100)}%</b>
                    <span className="aa-mono" style={{ color: "var(--aa-muted)" }}>
                      Lit
                    </span>
                  </div>
                  <div>
                    <b>{moon.waxing ? Math.round(moon.daysToFull) : Math.round(moon.daysToNew)}d</b>
                    <span className="aa-mono" style={{ color: "var(--aa-muted)" }}>
                      {moon.waxing ? "To full" : "To new"}
                    </span>
                  </div>
                  <div>
                    <b>{moonlight}</b>
                    <span className="aa-mono" style={{ color: "var(--aa-muted)" }}>
                      Sky
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="aa-filters" role="group" aria-label="Filter nights">
                  {kinds.map((k) => (
                    <button key={k} type="button" className="aa-filter" aria-pressed={kind === k} onClick={() => setKind(k)}>
                      {k}
                    </button>
                  ))}
                </div>
                <ul className="aa-events">
                  {shown.length === 0 && <li className="aa-empty">Nothing on the calendar for that yet.</li>}
                  {shown.map(({ n, i }, row) => {
                    const d = parseDay(n.date)
                    const me = !!going[n.date + i]
                    const count = (n.going ?? 0) + (me ? 1 : 0)
                    const left = typeof n.seats === "number" ? Math.max(0, n.seats - count) : null
                    const full = left === 0 && !me
                    return (
                      <li key={n.date + i + kind} className="aa-event" style={{ animationDelay: row * 60 + "ms" }}>
                        <div className="aa-date" aria-label={d ? d.dow + " " + d.day + " " + d.mon : n.date}>
                          <b>{d?.day ?? "--"}</b>
                          <span>{d ? d.mon : ""}</span>
                        </div>
                        <div>
                          <span className="aa-label" style={{ fontSize: 10 }}>
                            {n.kind} · {d?.dow} {n.time}
                          </span>
                          <h3>{n.title}</h3>
                          <div className="aa-event-meta">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <Pin />
                              {n.place}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <Scope />
                              {n.target}
                            </span>
                            {d && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--aa-blue)" }} title={moonPhase(d.ms).name}>
                                <MiniMoon fraction={moonPhase(d.ms).fraction} />
                                <span style={{ color: "var(--aa-muted)" }}>{Math.round(moonPhase(d.ms).illumination * 100)}% moon</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="aa-event-act">
                          <button type="button" className="aa-btn aa-btn-line aa-rsvp" aria-pressed={me} disabled={full} onClick={() => toggleRsvp(n, i)}>
                            {me ? (
                              <>
                                <Check /> Going
                              </>
                            ) : full ? (
                              "Full"
                            ) : (
                              "RSVP"
                            )}
                          </button>
                          <span className="aa-going">
                            {count} going{left !== null ? " · " + left + " left" : ""}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- helpers */

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function useReducedMotion(): boolean {
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

// true once the element has been on screen
function useInView(threshold = 0.2) {
  const ref = React.useRef(null as HTMLElement | null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver !== "function") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, threshold])
  return [ref, inView] as const
}

/* ------------------------------------------------------------- the look */

// palette (preset name or your own) and theme ("system" follows the host's
// .dark class, then the OS, until the visitor flips it)
function useAstroLook(palette: AstroPaletteName | AstroPalette, defaultTheme: "system" | "light" | "dark", onThemeChange?: (t: "light" | "dark") => void) {
  const initial = typeof palette === "string" ? PALETTES[palette] ?? PALETTES.cobalt : palette
  const [pal, setPal] = React.useState(initial)
  const palKey = typeof palette === "string" ? palette : palette.name + palette.colors.join("")
  React.useEffect(() => setPal(typeof palette === "string" ? PALETTES[palette] ?? PALETTES.cobalt : palette), [palKey])
  const colors = pal.colors.length ? pal.colors : PALETTES.cobalt.colors
  const [theme, setTheme] = React.useState((defaultTheme === "dark" ? "dark" : "light") as "light" | "dark")
  const [touched, setTouched] = React.useState(false)
  React.useEffect(() => {
    if (defaultTheme !== "system" || touched) {
      if (!touched) setTheme(defaultTheme === "dark" ? "dark" : "light")
      return
    }
    const read = () =>
      setTheme(
        document.documentElement.classList.contains("dark") || (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light",
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
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTouched(true)
    setTheme(next)
    onThemeChange?.(next)
  }
  return { pal, setPal, colors, theme, toggleTheme }
}

// true when the piece is at least 640px wide (the template's breakpoint)
function useWide(ref: { current: HTMLElement | null }) {
  const [wide, setWide] = React.useState(true)
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setWide(el.clientWidth >= 640)
    read()
    if (typeof ResizeObserver !== "function") return
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return wide
}

function rootStyleOf(pal: AstroPalette, fonts: { display?: string; body?: string; mono?: string } | undefined, maxWidth: string, extra?: { [k: string]: string }) {
  const display = fonts?.display ?? FONT_DISPLAY
  return {
    "--aa-max": maxWidth,
    "--aa-accent": pal.accent,
    "--aa-frame": pal.frame,
    "--aa-display": display,
    "--aa-body": fonts?.body ?? display,
    "--aa-mono": fonts?.mono ?? FONT_MONO,
    ...extra,
  } as React.CSSProperties
}

/* ---------------------------------------------------------------- pieces */

function Asterisk({ size = 22, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  const [turn, setTurn] = React.useState(0)
  return (
    <button
      type="button"
      className={"aa-ast " + className}
      style={{ ...style, transform: turn ? "rotate(" + turn * 120 + "deg)" : undefined }}
      onClick={() => setTurn((t) => t + 1)}
      aria-label="Spin"
      tabIndex={-1}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" aria-hidden="true">
        <path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5" />
      </svg>
    </button>
  )
}

function Check() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6.5l2.6 2.5L10 3.5" />
    </svg>
  )
}

function Pin() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M8 14.5s5-4.6 5-8.5a5 5 0 1 0-10 0c0 3.9 5 8.5 5 8.5z" />
      <circle cx="8" cy="6" r="1.7" />
    </svg>
  )
}

function Scope() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M2 11l9-6 1.5 2.5-9 6zM11 5l2-1.5 1.5 2.5-2 1.5M6 12l-1.5 3M7.5 11l1.5 3.5" />
    </svg>
  )
}

function Moon({ fraction, colors, uid, size = 220, spin = true }: { fraction: number; colors: string[]; uid: string; size?: number; spin?: boolean }) {
  const dots = React.useMemo(() => buildBubbles(31, 100, 100, colors.length, 1.4, 1.1), [colors.length])
  const id = uid + "-moon"
  return (
    <svg className="aa-sky-moon" width={size} height={size} viewBox="-70 -70 140 140" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <path d={moonPath(fraction, 50)} />
        </clipPath>
      </defs>
      <g className={spin ? "aa-orbit-spin" : undefined}>
        <circle r="64" fill="none" stroke="var(--aa-line-strong)" strokeWidth="1" strokeDasharray="1 5" strokeLinecap="round" />
        <circle cx="64" r="3.5" fill="var(--aa-blue)" />
      </g>
      <circle r="50" fill="var(--aa-moon)" />
      <g clipPath={"url(#" + id + ")"}>
        <rect x="-50" y="-50" width="100" height="100" fill={colors[0]} />
        {dots.map((b, i) => (
          <circle key={i} cx={b.x - 50} cy={b.y - 50} r={b.r} fill={colors[b.c % colors.length]} />
        ))}
      </g>
      <circle r="50" fill="none" stroke="var(--aa-line-strong)" strokeWidth="1" />
    </svg>
  )
}

function MiniMoon({ fraction }: { fraction: number }) {
  return (
    <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
      <circle r="6" fill="var(--aa-moon)" stroke="var(--aa-line-strong)" strokeWidth=".8" />
      <path d={moonPath(fraction, 6)} fill="currentColor" />
    </svg>
  )
}

/* -------------------------------------------------------------------- css */

const AA_CSS = `
.aa-root{--aa-accent:#2233ff;--aa-frame:#8d9cff;--aa-paper:#ffffff;--aa-ink:#0b0c16;--aa-soft:#2b2e45;--aa-muted:#6b7090;--aa-card:#f5f6ff;--aa-moon:#e6e9ff;--aa-blue:var(--aa-accent);--aa-line:color-mix(in srgb,var(--aa-accent) 16%,transparent);--aa-line-strong:color-mix(in srgb,var(--aa-accent) 34%,transparent);--aa-display:"Poppins",sans-serif;--aa-body:var(--aa-display);--aa-mono:ui-monospace,monospace;position:relative;width:100%;box-sizing:border-box;background:var(--aa-paper);color:var(--aa-ink);font-family:var(--aa-body);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;border:clamp(6px,1.1vw,12px) solid var(--aa-frame);transition:background-color .45s ease,color .45s ease,border-color .45s ease;overflow:clip}
.aa-root[data-theme="dark"]{--aa-paper:#060821;--aa-ink:#f2f4ff;--aa-soft:#c8cdf2;--aa-muted:#8a90bd;--aa-card:#0c1033;--aa-moon:#1a1f4d;--aa-blue:color-mix(in srgb,var(--aa-accent) 52%,#ffffff);--aa-line:color-mix(in srgb,var(--aa-blue) 18%,transparent);--aa-line-strong:color-mix(in srgb,var(--aa-blue) 36%,transparent);border-color:color-mix(in srgb,var(--aa-frame) 45%,#060821)}
.aa-root :where(*){box-sizing:border-box}
.aa-root ::selection{background:var(--aa-blue);color:var(--aa-paper)}
.aa-root :focus-visible{outline:2px solid var(--aa-blue);outline-offset:3px}
.aa-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit;letter-spacing:inherit}
.aa-root :where(a){color:inherit;text-decoration:none}
.aa-root :where(svg){display:block;max-width:none;flex:none}
.aa-root :where(canvas){display:block;max-width:none}
.aa-root :where(h1,h2,h3,h4,p,ul,ol,li,dl,dd,figure){margin:0;padding:0;font-size:inherit;font-weight:inherit;list-style:none}
.aa-root :where(input){font:inherit;color:inherit;margin:0}
.aa-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.aa-shell{width:100%;container-type:inline-size;position:relative}
.aa-in{width:100%;max-width:var(--aa-max,1240px);margin:0 auto;padding:0 clamp(16px,4cqi,48px)}
.aa-disp{font-family:var(--aa-display);font-weight:800;letter-spacing:-.02em;line-height:.86;text-transform:none}
.aa-mono{font-family:var(--aa-mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase}
.aa-label{font-family:var(--aa-display);font-weight:800;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--aa-blue)}
.aa-echo{display:inline-block;white-space:nowrap}
.aa-title{display:flex;flex-direction:column;font-family:var(--aa-display);font-weight:800;letter-spacing:-.01em;line-height:.9;text-transform:none}
.aa-title>span:last-child{padding-bottom:.42em}
.aa-noframe{border:0}
.aa-sticky{position:sticky;top:0;z-index:40;overflow:visible}
.aa-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:13px 20px;border-radius:999px;font-family:var(--aa-display);font-weight:800;font-size:13px;letter-spacing:.03em;text-transform:uppercase;line-height:1;white-space:nowrap;transition:background-color .2s,color .2s,box-shadow .25s,transform .25s cubic-bezier(.2,.8,.2,1)}
.aa-btn-solid{background:var(--aa-blue);color:var(--aa-paper);box-shadow:0 10px 24px -14px var(--aa-blue)}
.aa-btn-solid:hover{transform:translateY(-2px);box-shadow:0 16px 30px -14px var(--aa-blue)}
.aa-btn-line{color:var(--aa-blue);box-shadow:inset 0 0 0 2px var(--aa-blue)}
.aa-btn-line:hover{background:var(--aa-blue);color:var(--aa-paper)}
.aa-btn-ink{background:var(--aa-ink);color:var(--aa-paper)}
.aa-btn-ink:hover{transform:translateY(-2px)}
.aa-btn:active{transform:scale(.97)}
.aa-btn[disabled]{opacity:.55;cursor:default;transform:none}
.aa-btn .aa-arr{transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.aa-btn:hover .aa-arr{transform:translateX(3px)}
.aa-nav .aa-btn{padding:11px 16px;font-size:12px}
.aa-bub{position:absolute;inset:0}
.aa-bub canvas{position:absolute;left:0;top:0;width:100%;height:100%}
.aa-ast{display:inline-grid;place-items:center;color:var(--aa-blue);transition:transform .8s cubic-bezier(.2,.8,.2,1)}
.aa-ast:hover{transform:rotate(60deg) scale(1.15)}
.aa-logo{overflow:visible}
.aa-logo-arrow{transform-box:view-box;transform-origin:50px 50px;transition:transform .6s cubic-bezier(.2,.8,.2,1)}
.aa-logo-spin{transform-box:view-box;transform-origin:50px 50px;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.aa-brand:hover .aa-logo-spin{transform:rotate(-360deg)}
.aa-sec{position:relative;scroll-margin-top:62px}
.aa-pad{padding:clamp(48px,8cqi,104px) 0}
.aa-reveal{opacity:0;transform:translateY(22px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
.aa-reveal[data-in="true"]{opacity:1;transform:none}
.aa-kicker{display:flex;flex-direction:column;align-items:center;gap:14px;padding:clamp(18px,3cqi,30px) 0 clamp(26px,4cqi,44px)}
.aa-kicker .aa-label{font-size:clamp(12px,1.3cqi,15px)}
.aa-meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 20px;padding:10px 0;border-top:1px solid var(--aa-line-strong)}
.aa-meta span{font-size:10px}
.aa-h2{font-family:var(--aa-display);font-weight:800;font-size:clamp(30px,5cqi,62px);line-height:.98;letter-spacing:-.03em}
.aa-lede{font-size:clamp(15px,1.5cqi,17px);color:var(--aa-soft);line-height:1.65;max-width:56ch}
.aa-mission{display:grid;gap:clamp(28px,5cqi,64px);padding-top:clamp(32px,5cqi,64px)}
.aa-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;border-top:1.5px solid var(--aa-ink)}
.aa-stat{padding:18px 4px 18px 0;border-bottom:1px solid var(--aa-line-strong)}
.aa-stat dt{font-family:var(--aa-display);font-weight:800;font-size:clamp(32px,4.6cqi,56px);line-height:1;letter-spacing:-.03em;color:var(--aa-blue);font-variant-numeric:tabular-nums}
.aa-stat dd{margin-top:6px}
@container (min-width:860px){.aa-mission{grid-template-columns:1.1fr 1fr;align-items:start}}
.aa-orbits{position:absolute;inset:0;pointer-events:none;color:var(--aa-line-strong)}
.aa-orbits svg{position:absolute}
.aa-orbit-spin{transform-box:view-box;transform-origin:50% 50%;animation:aa-spin 60s linear infinite}
.aa-orbit-spin-r{animation-duration:90s;animation-direction:reverse}
.aa-nights{display:grid;gap:clamp(18px,3cqi,28px);margin-top:clamp(24px,4cqi,44px)}
@container (min-width:900px){.aa-nights{grid-template-columns:minmax(300px,.8fr) 1.4fr;align-items:start}}
.aa-sky{position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;padding:24px 22px 22px;border-radius:26px;background:var(--aa-card);border:1.5px solid var(--aa-line);overflow:hidden}
.aa-sky-moon{position:relative;width:min(220px,62cqi);height:auto}
.aa-sky-moon .aa-orbit-spin{animation-duration:40s}
.aa-sky h3{font-family:var(--aa-display);font-weight:800;font-size:26px;letter-spacing:-.02em;line-height:1}
.aa-sky-row{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%}
.aa-sky-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;border-top:1px solid var(--aa-line-strong)}
.aa-sky-facts div{padding:12px 4px 0;text-align:center}
.aa-sky-facts b{display:block;font-family:var(--aa-display);font-weight:800;font-size:20px;color:var(--aa-blue);font-variant-numeric:tabular-nums}
.aa-step{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:999px;border:1.5px solid var(--aa-line-strong);color:var(--aa-blue);transition:background-color .2s,color .2s,border-color .2s}
.aa-step:hover{background:var(--aa-blue);color:var(--aa-paper);border-color:var(--aa-blue)}
.aa-today{font-family:var(--aa-display);font-weight:800;font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--aa-muted)}
.aa-today[data-on="true"]{color:var(--aa-blue);text-decoration:underline;text-underline-offset:3px}
.aa-filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.aa-filter{padding:8px 14px;border-radius:999px;border:1.5px solid var(--aa-line-strong);font-family:var(--aa-display);font-weight:800;font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--aa-soft);transition:background-color .2s,color .2s,border-color .2s}
.aa-filter:hover{border-color:var(--aa-blue);color:var(--aa-blue)}
.aa-filter[aria-pressed="true"]{background:var(--aa-blue);border-color:var(--aa-blue);color:var(--aa-paper)}
.aa-events{display:flex;flex-direction:column;border-top:1.5px solid var(--aa-ink)}
.aa-event{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;align-items:center;padding:16px 0;border-bottom:1px solid var(--aa-line-strong);animation:aa-rise .5s cubic-bezier(.2,.8,.2,1) both}
.aa-date{display:flex;flex-direction:column;align-items:center;justify-content:center;width:64px;height:68px;border-radius:16px;background:var(--aa-blue);color:var(--aa-paper);font-family:var(--aa-display);font-weight:800;line-height:1}
.aa-date b{font-size:26px;letter-spacing:-.03em}
.aa-date span{font-size:10px;letter-spacing:.08em;margin-top:4px}
.aa-event h3{font-family:var(--aa-display);font-weight:800;font-size:18px;line-height:1.15;letter-spacing:-.01em}
.aa-event-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin-top:4px;color:var(--aa-muted);font-size:13px}
.aa-event-meta svg{color:var(--aa-blue)}
.aa-event-act{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px}
.aa-going{font-size:12.5px;color:var(--aa-muted);font-variant-numeric:tabular-nums}
.aa-rsvp{min-width:118px;padding:10px 16px;font-size:11.5px}
.aa-rsvp[aria-pressed="true"]{background:var(--aa-blue);color:var(--aa-paper)}
.aa-empty{padding:28px 0;color:var(--aa-muted)}
@container (min-width:620px){.aa-event{grid-template-columns:auto 1fr auto}.aa-event-act{grid-column:auto;flex-direction:column;align-items:flex-end}}
@keyframes aa-spin{to{transform:rotate(360deg)}}
@keyframes aa-marq{to{transform:translateX(-50%)}}
@keyframes aa-blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes aa-drop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes aa-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes aa-print{0%{transform:translateY(16px) scale(.96);filter:brightness(1.6)}100%{transform:none;filter:none}}
@media (prefers-reduced-motion:reduce){
.aa-root,.aa-root :where(*){scroll-behavior:auto}
.aa-reveal{opacity:1;transform:none;transition:none}
.aa-marq,.aa-orbit-spin,.aa-pop-dot,.aa-chip i,.aa-event,.aa-printed,.aa-mobile{animation:none}
.aa-logo-arrow,.aa-logo-spin,.aa-rib,.aa-card,.aa-card-fill,.aa-member,.aa-ast,.aa-bar i,.aa-more{transition:none}
}
.aa-proj-head{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:16px;margin-bottom:clamp(22px,3.4cqi,40px)}
`
