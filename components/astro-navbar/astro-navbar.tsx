"use client"

// The Astro Association nav, standalone: sticky and frosted, a compass-ring
// logo whose needle follows the pointer, an issue pill, links that underline
// the section you're reading, palette swatches that re-colour everything that
// listens, a theme switch and a Join button; folds into a menu when narrow.
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

export type AstroNavbarProps = {
  brand?: string
  /** The small pill beside the brand. Empty hides it. */
  issue?: string
  /** `#id` links scroll smoothly and underline the section in view. */
  links?: { label: string; href: string }[]
  cta?: string
  onCta?: () => void
  /** Palette swatches in the bar. */
  paletteSwitcher?: boolean
  onPaletteChange?: (palette: AstroPalette) => void
  /** Stick to the top of the viewport. */
  sticky?: boolean
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
// "#mission" → "mission"; anything else (a path, a URL, "#") is not a section
function sectionId(href: string): string | null {
  const m = /^#([A-Za-z][\w-]*)$/.exec(href.trim())
  return m ? m[1] : null
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

const D_LINKS: { label: string; href: string }[] = [
  { label: "Mission", href: "#mission" },
  { label: "Projects", href: "#projects" },
  { label: "Nights", href: "#nights" },
  { label: "Join", href: "#join" },
]

/* -------------------------------------------------------------- component */

export default function AstroNavbar({
  brand = "ASTRO.",
  issue = "#102",
  links = D_LINKS,
  cta = "Join",
  onCta,
  paletteSwitcher = true,
  onPaletteChange,
  sticky = true,
  palette = "cobalt",
  defaultTheme = "system",
  onThemeChange,
  frame = false,
  fonts,
  maxWidth = "1240px",
  className = "",
}: AstroNavbarProps) {
  const reduced = useReducedMotion()
  const { pal, setPal, theme, toggleTheme } = useAstroLook(palette, defaultTheme, onThemeChange)
  const palKey = typeof palette === "string" ? palette : palette.name + palette.colors.join("")
  const swatches = React.useMemo(() => {
    const list = PALETTE_ORDER.map((k) => PALETTES[k])
    return typeof palette === "string" ? list : [palette, ...list]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palKey])
  const pickPalette = (p: AstroPalette) => {
    setPal(p)
    onPaletteChange?.(p)
  }

  /* the section in view, and smooth anchor scrolls that clear the bar */
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const [active, setActive] = React.useState("")
  const [menu, setMenu] = React.useState(false)
  const hrefKey = links.map((l) => l.href).join("|")
  React.useEffect(() => {
    if (typeof IntersectionObserver !== "function") return
    const els = links.map((l) => (sectionId(l.href) ? document.getElementById(sectionId(l.href) as string) : null)).filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setActive("#" + (e.target as HTMLElement).id)
      },
      { rootMargin: "-40% 0px -55% 0px" },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hrefKey])
  const go = (href: string) => (e: React.MouseEvent) => {
    setMenu(false)
    const id = sectionId(href)
    const el = id ? document.getElementById(id) : null
    if (!el) return
    e.preventDefault()
    const bar = sticky ? rootRef.current?.getBoundingClientRect().height ?? 0 : 0
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - bar, behavior: reduced ? "auto" : "smooth" })
    setActive(href)
  }

  const link = (l: { label: string; href: string }, i: number) => (
    <a key={i} className="aa-link" href={l.href} aria-current={active === l.href ? "true" : undefined} onClick={go(l.href)}>
      {l.label}
    </a>
  )
  const swatchRow = paletteSwitcher ? (
    <div className="aa-swatches" role="radiogroup" aria-label="Bubble palette">
      {swatches.map((p, i) => (
        <button
          key={p.name + i}
          type="button"
          role="radio"
          aria-checked={p.name === pal.name && p.accent === pal.accent}
          aria-label={p.name + " palette"}
          title={p.name}
          className="aa-sw"
          style={{ background: "conic-gradient(" + [p.colors[1], p.colors[4], p.colors[6], p.colors[1]].join(",") + ")" }}
          onClick={() => pickPalette(p)}
        />
      ))}
    </div>
  ) : null

  return (
    <div ref={rootRef} className={"aa-root" + (frame ? "" : " aa-noframe") + (sticky ? " aa-sticky" : "") + " " + className} data-theme={theme} style={rootStyleOf(pal, fonts, maxWidth)}>
      <style>{AA_CSS}</style>
      <div className="aa-shell">
        <header className="aa-nav" style={{ position: "relative" }}>
          <div className="aa-in">
            <a className="aa-brand" href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }) }} aria-label={brand + " home"}>
              <LogoMark size={34} follow reduced={reduced} />
              <span>{brand}</span>
            </a>
            {issue && <span className="aa-issue">{issue}</span>}
            <nav className="aa-links" aria-label="Sections">
              {links.map(link)}
            </nav>
            <div className="aa-nav-end">
              {swatchRow}
              <button type="button" className="aa-icon" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
                <ThemeIcon dark={theme === "dark"} />
              </button>
              {cta && (
                <button type="button" className="aa-btn aa-btn-solid" onClick={onCta}>
                  {cta}
                  <Arrow size={12} />
                </button>
              )}
              {links.length > 0 && (
                <button type="button" className="aa-icon aa-menu-btn" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu((m) => !m)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    {menu ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /> : <path d="M2.5 5h11M2.5 11h11" />}
                  </svg>
                </button>
              )}
            </div>
          </div>
          {menu && (
            <nav className="aa-mobile" aria-label="Sections">
              {links.map(link)}
              {swatchRow}
            </nav>
          )}
        </header>
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

/* ------------------------------------------------------------------- logo */

// The mark, in a 100-unit box: a ring, a "( U )" inside it, and an arrow
// that leaves the ring at the north-east like a compass needle. A paper-coloured
// slash runs through the ring under the arrow, so the needle reads as cut in.
const LOGO = {
  ring: "M14 50a36 36 0 1 0 72 0a36 36 0 1 0-72 0",
  left: "M34.4 34.4A22 22 0 0 0 34.4 65.6",
  right: "M65.6 34.4A22 22 0 0 1 65.6 65.6",
  u: "M43.5 41V53a6.5 6.5 0 0 0 13 0V41",
  bar: "M50 41V50",
  // pointing east; rotated -45° by default
  slash: "M8 50H86",
  arrow: "M86 50H98",
  head: "M85 38L98 50L85 62",
}

/* ---------------------------------------------------------------- pieces */

function LogoMark({ size = 40, follow = false, reduced = false, gap = "var(--aa-paper)", className = "", title }: { size?: number; follow?: boolean; reduced?: boolean; gap?: string; className?: string; title?: string }) {
  const svg = React.useRef(null as SVGSVGElement | null)
  const arrow = React.useRef(null as SVGGElement | null)
  React.useEffect(() => {
    if (!follow) return
    let raf = 0
    let deg = -45
    let px = 0
    let py = 0
    const apply = () => {
      raf = 0
      const el = svg.current
      const g = arrow.current
      if (!el || !g) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      if (Math.hypot(px - cx, py - cy) < r.width * 0.3) return
      deg = unwrapAngle(deg, (Math.atan2(py - cy, px - cx) * 180) / Math.PI)
      g.style.transform = "rotate(" + deg.toFixed(1) + "deg)"
    }
    const move = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (!raf) raf = requestAnimationFrame(apply)
    }
    addEventListener("pointermove", move, { passive: true })
    return () => {
      removeEventListener("pointermove", move)
      cancelAnimationFrame(raf)
    }
  }, [follow])
  return (
    <svg
      ref={svg}
      className={"aa-logo " + className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g className="aa-logo-spin">
        <path d={LOGO.ring} strokeWidth="9" />
        <path d={LOGO.left} strokeWidth="6.5" />
        <path d={LOGO.right} strokeWidth="6.5" />
        <path d={LOGO.u} strokeWidth="6.5" />
        <path d={LOGO.bar} strokeWidth="5" />
      </g>
      <g ref={arrow} className="aa-logo-arrow" style={{ transform: "rotate(-45deg)", transition: reduced ? "none" : undefined }}>
        <path d={LOGO.slash} strokeWidth="5" stroke={gap} strokeLinecap="butt" style={{ transform: "translate(0,8px)" }} />
        <path d={LOGO.arrow} strokeWidth="8" />
        <path d={LOGO.head} strokeWidth="7" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z" />
    </svg>
  )
}

function Arrow({ size = 14 }: { size?: number }) {
  return (
    <svg className="aa-arr" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
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
.aa-nav{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--aa-paper) 84%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--aa-line);transition:background-color .45s,border-color .45s}
.aa-nav .aa-in{display:flex;align-items:center;gap:14px;height:62px}
.aa-brand{display:inline-flex;align-items:center;gap:10px;font-family:var(--aa-display);font-weight:800;font-size:17px;letter-spacing:-.01em;white-space:nowrap}
.aa-issue{display:none;padding:3px 7px;border:1.5px solid currentColor;border-radius:999px;font-family:var(--aa-display);font-weight:800;font-size:11px;color:var(--aa-blue)}
.aa-links{display:none;align-items:center;gap:2px;margin:0 auto}
.aa-link{position:relative;padding:8px 12px;font-family:var(--aa-display);font-weight:700;font-size:13px;letter-spacing:.02em;text-transform:uppercase;color:var(--aa-soft);transition:color .2s}
.aa-link::after{content:"";position:absolute;left:12px;right:12px;bottom:3px;height:2px;border-radius:2px;background:var(--aa-blue);transform:scaleX(0);transform-origin:left;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.aa-link:hover,.aa-link[aria-current="true"]{color:var(--aa-blue)}
.aa-link[aria-current="true"]::after,.aa-link:hover::after{transform:scaleX(1)}
.aa-nav-end{display:flex;align-items:center;gap:8px;margin-left:auto}
.aa-swatches{display:none;align-items:center;gap:5px;padding:4px;border:1px solid var(--aa-line);border-radius:999px}
.aa-sw{position:relative;width:18px;height:18px;border-radius:999px;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.aa-sw:hover{transform:scale(1.15)}
.aa-sw[aria-checked="true"]{box-shadow:0 0 0 2px var(--aa-paper),0 0 0 3.5px var(--aa-ink)}
.aa-icon{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:999px;color:var(--aa-soft);border:1px solid var(--aa-line);transition:color .2s,border-color .2s,transform .3s}
.aa-icon:hover{color:var(--aa-blue);border-color:var(--aa-blue)}
.aa-menu-btn{display:inline-grid}
.aa-mobile{position:absolute;left:0;right:0;top:100%;display:grid;gap:2px;padding:10px clamp(16px,4cqi,48px) 16px;background:var(--aa-paper);border-bottom:1px solid var(--aa-line);animation:aa-drop .3s cubic-bezier(.2,.8,.2,1) both}
.aa-mobile .aa-link{padding:12px 0;font-size:16px}
.aa-mobile .aa-link::after{left:0;right:auto;width:28px}
.aa-mobile .aa-swatches{display:inline-flex;justify-self:start;margin-top:8px}
@container (min-width:860px){.aa-links{display:flex}.aa-menu-btn{display:none}.aa-mobile{display:none}.aa-nav-end{margin-left:0}.aa-issue{display:inline-block}.aa-nav-end .aa-swatches{display:inline-flex}}
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
`
