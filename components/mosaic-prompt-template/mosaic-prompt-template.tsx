"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/*
 * Mosaic Prompt Template: a landing page for an app builder you talk to.
 * One sticky WebGL sky sits behind the whole page and changes with it: a
 * mosaic of soft light tiles behind the composer, a diagonal prism on slate
 * behind the features, and spectral silk waves on plum behind the pricing.
 * Between sections the sky does not fade, it re-tiles, cell by cell, from
 * the bottom up.
 *
 * The headlines are set in a pixel face drawn in code (every pixel is an
 * SVG square), so nothing is downloaded: the pixels fly in and assemble on
 * load, step aside from the pointer, and scatter glyph by glyph as you
 * scroll away. The composer works: a typing placeholder, platform chips, a
 * model menu, attachments and a send button that morphs the card into a
 * build log and then into a preview of the app it "made". Nothing is
 * generated; `onSubmit` hands you the prompt.
 */

export type MosaicIcon = "spark" | "eye" | "code" | "chat" | "phone" | "rocket" | "window" | "bars" | "game" | "bolt"

export type MosaicFeature = {
  icon: MosaicIcon
  title: string
  body: string
}

export type MosaicPlan = {
  name: string
  /** Monthly price in whole currency units. Yearly shows this less `yearlyDiscount`. */
  price: number
  blurb: string
  features: string[]
  cta: string
  featured?: boolean
  badge?: string
}

export type MosaicPlatform = {
  label: string
  icon: MosaicIcon
}

export type MosaicAccent = "ice" | "ember" | "lime"

export type MosaicSubmit = {
  prompt: string
  platform: string
  model: string
  files: string[]
}

export interface MosaicPromptTemplateProps {
  /** Wordmark next to the F mark, and the big pixel word in the footer. */
  brand?: string
  /** The hero headline, one entry per line, drawn in the pixel face. */
  headline?: string[]
  /** Example prompts the placeholder types out, one after another. */
  prompts?: string[]
  platforms?: MosaicPlatform[]
  models?: string[]
  features?: MosaicFeature[]
  featuresTitle?: string
  featuresLede?: string
  plans?: MosaicPlan[]
  pricingTitle?: string
  pricingLede?: string
  currency?: string
  /** Fraction taken off the monthly price when billed yearly. */
  yearlyDiscount?: number
  footerNote?: string
  /** `ice` (the reference), `ember` or `lime`: the send button, highlights and a touch of the sky. */
  accent?: MosaicAccent
  /** Height of one screen of the page. Must be a definite length. */
  height?: string
  /** Called with the prompt when the composer is sent. The build log that follows is a demo. */
  onSubmit?: (submission: MosaicSubmit) => void
  /** Get Started and the logo. Defaults to scrolling home and focusing the composer. */
  onGetStarted?: () => void
  /** A pricing button. Defaults to scrolling home and focusing the composer. */
  onPlanSelect?: (plan: MosaicPlan, yearly: boolean) => void
  className?: string
}

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_PROMPTS = [
  "A habit tracker with streaks, gentle reminders and a weekly recap...",
  "A booking app for a small yoga studio, with class passes and a waitlist...",
  "A shared grocery list that sorts itself by supermarket aisle...",
  "A dashboard for my store's daily sales, refunds and best sellers...",
]

const DEFAULT_PLATFORMS: MosaicPlatform[] = [
  { label: "Mobile app", icon: "phone" },
  { label: "Web app", icon: "window" },
  { label: "Dashboard", icon: "bars" },
  { label: "Game", icon: "game" },
]

const DEFAULT_MODELS = ["Turbo", "Studio", "Deep"]

const DEFAULT_FEATURES: MosaicFeature[] = [
  { icon: "spark", title: "Plain words in", body: "Describe screens, data and flows the way you would to a teammate. No spec template, no setup." },
  { icon: "eye", title: "Live preview", body: "Watch the app assemble while it builds, then click through every screen before anyone else sees it." },
  { icon: "code", title: "Code you own", body: "Readable React and React Native you can export, keep in your repo and go on editing anywhere." },
  { icon: "chat", title: "Edit by chatting", body: "Ask for a darker theme or one more tab. Changes land in the app you have, not in a fresh project." },
  { icon: "phone", title: "Phone and web", body: "One description, both targets. Layouts adapt to the screen they land on, down to the tap targets." },
  { icon: "rocket", title: "Ship in a click", body: "Publish to a link you can share when it feels right, and roll back just as fast when it does not." },
]

const DEFAULT_PLANS: MosaicPlan[] = [
  { name: "Starter", price: 0, blurb: "For trying an idea on a quiet evening.", features: ["5 builds a month", "Web previews", "Community templates"], cta: "Start free" },
  { name: "Pro", price: 24, blurb: "For makers shipping something every week.", features: ["Unlimited builds", "Mobile and web export", "Custom domains", "Every model, first in line"], cta: "Go Pro", featured: true, badge: "Most popular" },
  { name: "Team", price: 64, blurb: "For product teams who review before they ship.", features: ["Everything in Pro", "Shared workspaces", "Roles and review", "Single sign-on"], cta: "Bring the team" },
]

const ACCENTS = {
  ice: { a1: "#e8f6ff", a2: "#a9dcff", a3: "#5fb2f2", glow: "rgba(95,178,242,.42)", ink: "#06233a", gl: [0.55, 0.78, 1.0] },
  ember: { a1: "#fcc8a6", a2: "#f49d70", a3: "#e07a45", glow: "rgba(224,122,69,.42)", ink: "#3a1606", gl: [1.0, 0.62, 0.4] },
  lime: { a1: "#efffc4", a2: "#c4f26a", a3: "#8fcf2e", glow: "rgba(143,207,46,.38)", ink: "#1c2a05", gl: [0.72, 0.95, 0.38] },
}

/* ------------------------------------------------------------------ */
/* Pixel face                                                          */
/* ------------------------------------------------------------------ */

// #region pixel-font
/** Rows top to bottom, `#` lit. Capitals are 7 rows; lowercase descends into row 8. */
const GLYPHS: { [ch: string]: string } = {
  A: ".###./#...#/#...#/#####/#...#/#...#/#...#",
  B: "####./#...#/#...#/####./#...#/#...#/####.",
  C: ".###./#...#/#..../#..../#..../#...#/.###.",
  D: "####./#...#/#...#/#...#/#...#/#...#/####.",
  E: "#####/#..../#..../####./#..../#..../#####",
  F: "#####/#..../#..../####./#..../#..../#....",
  G: ".###./#...#/#..../#.###/#...#/#...#/.####",
  H: "#...#/#...#/#...#/#####/#...#/#...#/#...#",
  I: "###/.#./.#./.#./.#./.#./###",
  J: "..###/...#./...#./...#./...#./#..#./.##..",
  K: "#...#/#..#./#.#../##.../#.#../#..#./#...#",
  L: "#..../#..../#..../#..../#..../#..../#####",
  M: "#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#",
  N: "#...#/##..#/#.#.#/#..##/#...#/#...#/#...#",
  O: ".###./#...#/#...#/#...#/#...#/#...#/.###.",
  P: "####./#...#/#...#/####./#..../#..../#....",
  Q: ".###./#...#/#...#/#...#/#.#.#/#..#./.##.#",
  R: "####./#...#/#...#/####./#.#../#..#./#...#",
  S: ".####/#..../#..../.###./....#/....#/####.",
  T: "#####/..#../..#../..#../..#../..#../..#..",
  U: "#...#/#...#/#...#/#...#/#...#/#...#/.###.",
  V: "#...#/#...#/#...#/#...#/#...#/.#.#./..#..",
  W: "#...#/#...#/#...#/#.#.#/#.#.#/#.#.#/.#.#.",
  X: "#...#/#...#/.#.#./..#../.#.#./#...#/#...#",
  Y: "#...#/#...#/.#.#./..#../..#../..#../..#..",
  Z: "#####/....#/...#./..#../.#.../#..../#####",
  a: "...../...../.###./....#/.####/#...#/.####",
  b: "#..../#..../####./#...#/#...#/#...#/####.",
  c: "..../..../.###/#.../#.../#.../.###",
  d: "....#/....#/.####/#...#/#...#/#...#/.####",
  e: "...../...../.###./#...#/#####/#..../.###.",
  f: ".##/#../###/#../#../#../#..",
  g: "...../...../.####/#...#/#...#/.####/....#/.###.",
  h: "#..../#..../####./#...#/#...#/#...#/#...#",
  i: "#/./#/#/#/#/#",
  j: "..#/.../..#/..#/..#/..#/..#/##.",
  k: "#.../#.../#..#/#.#./##../#.#./#..#",
  l: "#./#./#./#./#./#./.#",
  m: "...../...../##.#./#.#.#/#.#.#/#...#/#...#",
  n: "...../...../####./#...#/#...#/#...#/#...#",
  o: "...../...../.###./#...#/#...#/#...#/.###.",
  p: "...../...../####./#...#/#...#/####./#..../#....",
  q: "...../...../.####/#...#/#...#/.####/....#/....#",
  r: "..../..../#.##/##../#.../#.../#...",
  s: "...../...../.####/#..../.###./....#/####.",
  t: ".#../.#../####/.#../.#../.#../..##",
  u: "...../...../#...#/#...#/#...#/#...#/.####",
  v: "...../...../#...#/#...#/#...#/.#.#./..#..",
  w: "...../...../#...#/#...#/#.#.#/#.#.#/.#.#.",
  x: "...../...../#...#/.#.#./..#../.#.#./#...#",
  y: "...../...../#...#/#...#/#...#/.####/....#/.###.",
  z: "...../...../#####/...#./..#../.#.../#####",
  "0": ".###./#...#/#..##/#.#.#/##..#/#...#/.###.",
  "1": "..#../.##../..#../..#../..#../..#../.###.",
  "2": ".###./#...#/....#/...#./..#../.#.../#####",
  "3": "####./....#/....#/.###./....#/....#/####.",
  "4": "...#./..##./.#.#./#..#./#####/...#./...#.",
  "5": "#####/#..../####./....#/....#/#...#/.###.",
  "6": ".###./#..../#..../####./#...#/#...#/.###.",
  "7": "#####/....#/...#./..#../.#.../.#.../.#...",
  "8": ".###./#...#/#...#/.###./#...#/#...#/.###.",
  "9": ".###./#...#/#...#/.####/....#/....#/.###.",
  ".": "././././././#",
  ",": "././././././#/#",
  "'": "#/#/././././.",
  "!": "#/#/#/#/#/./#",
  "?": ".###./#...#/....#/...#./..#../...../..#..",
  "-": ".../.../.../###/.../.../...",
  ":": "././#/././././#",
  "/": "....#/...#./...#./..#../.#.../.#.../#....",
  "&": ".##../#..#./#.#../.#.../#.#.#/#..#./.##.#",
  "$": "..#../.####/#.#../.###./..#.#/####./..#..",
  "+": "...../..#../..#../#####/..#../..#../.....",
  "%": "##..#/##.#./...#./..#../.#.../.#.##/#..##",
}

export type PixelGlyph = { x: number; w: number; cells: number[][] }

/** Lays a line of text out on the pixel grid: one cell per lit pixel, one blank column between glyphs, 3 columns for a space. Characters without a glyph fall back to their capital, then to a space. */
export function layoutPixels(text: string) {
  const glyphs: PixelGlyph[] = []
  let x = 0
  for (const ch of text) {
    const g = GLYPHS[ch] || GLYPHS[ch.toUpperCase()]
    if (!g) {
      x += 3
      continue
    }
    const rows = g.split("/")
    const w = Math.max(...rows.map((r) => r.length))
    const cells: number[][] = []
    rows.forEach((r, y) => {
      for (let i = 0; i < r.length; i++) if (r[i] === "#") cells.push([x + i, y])
    })
    glyphs.push({ x, w, cells })
    x += w + 1
  }
  return { width: Math.max(1, x - 1), height: 8, glyphs }
}
// #endregion pixel-font

const ICONS: { [k: string]: string } = {
  spark: "...#.../...#.../..###../#######/..###../...#.../...#...",
  eye: "......./..###../.#...#./#..#..#/.#...#./..###../.......",
  code: ".##.##./.#...#./#.....#/#.....#/#.....#/.#...#./.##.##.",
  chat: "#######/#.....#/#.#.#.#/#.....#/#######/.##..../.#.....",
  phone: ".#####./.#...#./.#...#./.#...#./.#####./.##.##./.#####.",
  rocket: "...#.../..###../..#.#../..###../.#####./#.###.#/..#.#..",
  window: "#######/#.#.#.#/#######/#.....#/#.....#/#.....#/#######",
  bars: "......#/....#.#/....#.#/..#.#.#/..#.#.#/#.#.#.#/#######",
  game: "...#.../...#.../..###../.#####./#######/#.#.#.#/#######",
  bolt: "....##./...##../..##.../.######/...##../..##.../.##....",
  check: "......./......#/.....#./#...#../.#.#.../..#..../.......",
  arrow: "...#.../..###../.#.#.#./#..#..#/...#.../...#.../...#...",
  down: "...#.../...#.../...#.../#..#..#/.#.#.#./..###../...#...",
  clip: "..###../.#...#./.#.#.#./.#.#.#./.#.#.#./.#...#./..###..",
}

// #region app-name
const FILLER = new Set(["a", "an", "the", "app", "application", "for", "that", "with", "build", "make", "me", "my", "i", "want", "need", "please", "to", "of", "and", "simple", "small", "new", "create", "which", "where", "who", "lets", "let"])

/** Names the "built" app from its prompt: the first two meaningful words, capitalised. */
export function appNameFrom(prompt: string) {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(w))
  if (!words.length) return "Untitled"
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}
// #endregion app-name

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  useIsoLayoutEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

function findScroller(el: HTMLElement): HTMLElement | Window {
  let p = el.parentElement
  while (p && p !== document.body && p !== document.documentElement) {
    const s = getComputedStyle(p)
    if (/(auto|scroll|overlay)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1) return p
    p = p.parentElement
  }
  return window
}

function scrollToEl(scroller: HTMLElement | Window, el: HTMLElement, smooth: boolean) {
  const behavior = smooth ? "smooth" : "auto"
  if (scroller === window) {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior })
  } else {
    const s = scroller as HTMLElement
    s.scrollTo({ top: el.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop, behavior })
  }
}

function money(n: number, currency: string) {
  return currency + Math.round(n).toLocaleString("en-US")
}

/* ------------------------------------------------------------------ */
/* Shader                                                              */
/* ------------------------------------------------------------------ */

const VERT = "attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}"

const FRAG = `precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uMix;
uniform vec2 uPtr;
uniform float uPtrOn;
uniform vec3 uAccent;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }
vec3 spectrum(float x){ return 0.5 + 0.5 * cos(6.28318 * (x + vec3(0.0, 0.33, 0.67))); }

/* Home: a mosaic of soft light, quantised into rounded tiles. */
vec3 mosaic(vec2 frag){
  float cell = max(uRes.y / 30.0, 9.0);
  vec2 id = floor(frag / cell);
  vec2 f = fract(frag / cell);
  vec2 p = (id + 0.5) * cell / uRes.y;
  float ax = uRes.x / uRes.y;
  float t = uTime * 0.07;
  vec2 l1 = vec2(ax * 0.5 + 0.38 * sin(t * 2.1), 0.56 + 0.14 * cos(t * 1.7));
  vec2 l2 = vec2(ax * 0.5 - 0.55 * cos(t * 1.3), 0.2 + 0.1 * sin(t * 2.3));
  vec2 l3 = vec2(ax * 0.5 + 0.62 * cos(t * 0.9 + 2.0), 0.86 + 0.08 * sin(t * 1.1));
  float L = 0.62 * exp(-2.6 * dot(p - l1, p - l1)) + 0.42 * exp(-3.8 * dot(p - l2, p - l2)) + 0.3 * exp(-5.0 * dot(p - l3, p - l3));
  L += uPtrOn * 0.5 * exp(-14.0 * dot(p - uPtr, p - uPtr));
  float n = fbm(p * 3.0 + vec2(t * 1.6, -t * 1.1));
  L *= 0.45 + n;
  float h = hash(id);
  L *= 0.8 + 0.28 * sin(uTime * (0.5 + h * 1.4) + h * 40.0);
  L = clamp(L, 0.0, 1.0);
  L = floor(L * 8.0 + h * 0.6) / 8.0;
  vec2 q = abs(f - 0.5);
  float tile = smoothstep(0.47, 0.41, max(q.x, q.y));
  vec3 cool = vec3(0.60, 0.70, 0.86);
  vec3 warm = vec3(0.96, 0.88, 0.78);
  vec3 col = mix(cool, warm, smoothstep(0.25, 0.75, n)) * L * 0.6;
  col = mix(col, uAccent * L * 0.75, 0.2 * L);
  col *= tile * (0.82 + 0.36 * f.y);
  return col + vec3(0.010, 0.010, 0.014);
}

/* Features: diagonal prismatic facets on slate blue. */
vec3 prism(vec2 frag){
  vec2 p = frag / uRes.y;
  float t = uTime * 0.05;
  vec3 col = mix(vec3(0.06, 0.08, 0.13), vec3(0.17, 0.22, 0.31), smoothstep(-0.2, 1.3, p.y + p.x * 0.15));
  float d = dot(p, normalize(vec2(1.0, -0.58)));
  float warp = fbm(vec2(d * 1.2 - t, p.y * 0.8 + t)) * 0.7;
  float bands = d * 2.6 + warp - t * 1.6;
  float s = fract(bands);
  float facet = smoothstep(0.0, 0.03, s) * (1.0 - smoothstep(0.03, 0.6, s));
  vec3 spec = spectrum(bands * 0.31 + p.y * 0.25 + t * 0.5);
  float beam = exp(-pow((d - (0.55 + 0.35 * sin(t * 2.0))) * 2.4, 2.0));
  col += spec * facet * (0.09 + 0.3 * beam);
  col += spec * beam * 0.06;
  float glint = pow(max(0.0, 1.0 - abs(s - 0.02) * 30.0), 3.0) * beam;
  col += vec3(0.9, 0.95, 1.0) * glint * 0.22;
  col += uAccent * 0.03;
  return col;
}

/* Pricing: flowing spectral silk on muted plum. */
vec3 waves(vec2 frag){
  vec2 p = frag / uRes.y;
  float t = uTime * 0.11;
  vec3 col = mix(vec3(0.07, 0.04, 0.08), vec3(0.20, 0.11, 0.19), smoothstep(0.0, 1.1, p.y));
  for (int i = 0; i < 5; i++){
    float fi = float(i);
    float y = 0.52 + (fi - 2.0) * 0.055
      + 0.16 * sin(p.x * (1.5 + fi * 0.3) + t * (1.0 + fi * 0.22) + fi * 1.7)
      + 0.05 * sin(p.x * 3.7 - t * 1.4 + fi * 2.3);
    float dist = abs(p.y - y);
    vec3 c = spectrum(fi * 0.16 + p.x * 0.12 - t * 0.25);
    col += c * (exp(-dist * 42.0) * 0.28 + exp(-dist * 7.0) * 0.05);
  }
  col *= 0.88 + 0.24 * fbm(p * 2.2 + t);
  return col;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float m = clamp(uMix, 0.0, 2.0);
  vec3 a; vec3 b = vec3(0.0); float k;
  if (m < 1.0) { k = m; a = mosaic(frag); if (k > 0.001) b = prism(frag); }
  else { k = m - 1.0; a = prism(frag); if (k > 0.001) b = waves(frag); }
  float cell = max(uRes.y / 30.0, 9.0);
  float thr = hash(floor(frag / cell) + 7.0) * 0.65 + (frag.y / uRes.y) * 0.35;
  float w = smoothstep(thr - 0.06, thr + 0.06, k * 1.12 - 0.06);
  vec3 col = mix(a, b, w);
  vec2 uv = frag / uRes;
  float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.0, 1.15)));
  col *= 0.55 + 0.45 * vig;
  col += (hash(frag + fract(uTime)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function PixelText({ text, className, maxWidth }: { text: string; className?: string; maxWidth?: number }) {
  const lay = React.useMemo(() => layoutPixels(text), [text])
  const vw = lay.width + 1
  const vh = lay.height + 1
  return (
    <svg
      className={"mpt-ptext" + (className ? " " + className : "")}
      viewBox={"-0.5 -0.5 " + vw + " " + vh}
      aria-hidden="true"
      focusable="false"
      style={{ ["--w" as string]: vw, ["--wmax" as string]: maxWidth || vw, aspectRatio: vw + " / " + vh } as React.CSSProperties}
    >
      {lay.glyphs.map((g, gi) => (
        <g key={gi} className="mpt-glyph">
          {g.cells.map(([x, y], i) => (
            <rect key={i} className="mpt-px" x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.16} data-x={x + 0.06} data-y={y + 0.06} />
          ))}
        </g>
      ))}
    </svg>
  )
}

function PixelIcon({ name, className }: { name: string; className?: string }) {
  const rows = (ICONS[name] || ICONS.spark).split("/")
  const cells: number[][] = []
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) if (r[x] === "#") cells.push([x, y])
  })
  return (
    <svg className={"mpt-picon" + (className ? " " + className : "")} viewBox="0 0 7 7" aria-hidden="true" focusable="false">
      {cells.map(([x, y], i) => (
        <rect key={i} x={x + 0.08} y={y + 0.08} width={0.84} height={0.84} rx={0.12} />
      ))}
    </svg>
  )
}

function FMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 34 34" aria-hidden="true" focusable="false">
      <rect width="34" height="34" rx="9" fill="#f4f4f5" />
      <path d="M9 7h17v6H15v4h9v6h-9v5H9Z" fill="#0b0b0d" />
      <rect x="26" y="23" width="3" height="3" rx=".6" fill="#0b0b0d" />
    </svg>
  )
}

const BUILD_STEPS = ["Reading your idea", "Sketching the screens", "Writing components", "Wiring data and sign-in", "Polishing the details"]

/* ------------------------------------------------------------------ */
/* Template                                                            */
/* ------------------------------------------------------------------ */

export default function MosaicPromptTemplate({
  brand = "Fastshot",
  headline = ["Describe an app", "We'll build it"],
  prompts = DEFAULT_PROMPTS,
  platforms = DEFAULT_PLATFORMS,
  models = DEFAULT_MODELS,
  features = DEFAULT_FEATURES,
  featuresTitle = "Built to ship",
  featuresLede = "Everything between a sentence and a working app, without the parts that usually slow it down.",
  plans = DEFAULT_PLANS,
  pricingTitle = "Simple plans",
  pricingLede = "Start free. Upgrade when the ideas start shipping. Prices are illustrative.",
  currency = "$",
  yearlyDiscount = 0.2,
  footerNote = "Made from a sentence.",
  accent = "ice",
  height = "100svh",
  onSubmit,
  onGetStarted,
  onPlanSelect,
  className,
}: MosaicPromptTemplateProps) {
  const reduced = useReducedMotion()
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const tone = ACCENTS[accent] || ACCENTS.ice

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const skyRef = React.useRef(null as HTMLDivElement | null)
  const headerRef = React.useRef(null as HTMLElement | null)
  const heroRef = React.useRef(null as HTMLElement | null)
  const featuresRef = React.useRef(null as HTMLElement | null)
  const pricingRef = React.useRef(null as HTMLElement | null)
  const cardRef = React.useRef(null as HTMLFormElement | null)
  const inputRef = React.useRef(null as HTMLTextAreaElement | null)
  const fileRef = React.useRef(null as HTMLInputElement | null)
  const modelBtnRef = React.useRef(null as HTMLButtonElement | null)
  const menuRef = React.useRef(null as HTMLDivElement | null)
  const linksRef = React.useRef(null as HTMLDivElement | null)
  const pillRef = React.useRef(null as HTMLSpanElement | null)
  const priceRefs = React.useRef([] as (HTMLSpanElement | null)[])
  const scrollerRef = React.useRef(null as HTMLElement | Window | null)
  const sheetRef = React.useRef(null as HTMLDivElement | null)
  const mixRef = React.useRef({ a: 0, b: 0, ptr: [0.5, 0.5], ptrOn: 0, dirty: true })
  const prevHeight = React.useRef(0)
  const buildTl = React.useRef(null as gsap.core.Timeline | null)

  const [prompt, setPrompt] = React.useState("")
  const [platform, setPlatform] = React.useState(0)
  const [model, setModel] = React.useState(0)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [files, setFiles] = React.useState([] as string[])
  const [phase, setPhase] = React.useState("idle" as "idle" | "building" | "done")
  const [step, setStep] = React.useState(0)
  const [built, setBuilt] = React.useState({ name: "", platform: "", prompt: "" })
  const [typed, setTyped] = React.useState("")
  const [focused, setFocused] = React.useState(false)
  const [nudge, setNudge] = React.useState(false)
  const [yearly, setYearly] = React.useState(false)
  const [active, setActive] = React.useState("home" as "home" | "features" | "pricing")
  const [sheet, setSheet] = React.useState(false)

  const headWidth = React.useMemo(() => Math.max(...headline.map((l) => layoutPixels(l).width + 1)), [headline])
  const yearlyPrice = (p: number) => Math.round(p * (1 - yearlyDiscount))

  /* ---------- navigation ---------- */

  const go = React.useCallback(
    (where: "home" | "features" | "pricing", focus?: boolean) => {
      setSheet(false)
      const el = where === "home" ? rootRef.current : where === "features" ? featuresRef.current : pricingRef.current
      if (!el) return
      scrollToEl(scrollerRef.current || window, el, !reduced)
      if (focus) window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), reduced ? 0 : 650)
    },
    [reduced],
  )

  const getStarted = () => {
    if (onGetStarted) return onGetStarted()
    go("home", true)
  }

  /* ---------- composer ---------- */

  const submit = (e?: { preventDefault: () => void }) => {
    if (e) e.preventDefault()
    const text = prompt.trim()
    if (!text) {
      setNudge(true)
      window.setTimeout(() => setNudge(false), 500)
      inputRef.current?.focus()
      return
    }
    onSubmit?.({ prompt: text, platform: platforms[platform]?.label || "", model: models[model] || "", files })
    if (cardRef.current) prevHeight.current = cardRef.current.offsetHeight
    setBuilt({ name: appNameFrom(text), platform: platforms[platform]?.label || "App", prompt: text })
    setStep(0)
    setPhase("building")
  }

  const reset = (keep: boolean) => {
    buildTl.current?.kill()
    if (cardRef.current) prevHeight.current = cardRef.current.offsetHeight
    if (!keep) {
      setPrompt("")
      setFiles([])
    }
    setPhase("idle")
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 30)
  }

  // the build log: one step at a time, then the preview
  React.useEffect(() => {
    if (phase !== "building") return
    const tl = gsap.timeline()
    BUILD_STEPS.forEach((_, i) => tl.call(() => setStep(i + 1), undefined, (i + 1) * (reduced ? 0.35 : 0.72)))
    tl.call(
      () => {
        if (cardRef.current) prevHeight.current = cardRef.current.offsetHeight
        setPhase("done")
      },
      undefined,
      "+=0.45",
    )
    buildTl.current = tl
    return () => {
      tl.kill()
    }
  }, [phase, reduced])

  // the card morphs between its three bodies instead of jumping
  useIsoLayoutEffect(() => {
    const card = cardRef.current
    if (!card || !prevHeight.current) return
    const from = prevHeight.current
    prevHeight.current = 0
    if (reduced) return
    const kids = card.querySelectorAll(".mpt-enter")
    const tw = gsap.fromTo(card, { height: from }, { height: card.offsetHeight, duration: 0.6, ease: "expo.out", clearProps: "height" })
    const tk = gsap.fromTo(kids, { opacity: 0, y: 12, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, stagger: 0.05, ease: "power3.out", clearProps: "filter,transform" })
    return () => {
      tw.kill()
      tk.kill()
    }
  }, [phase, reduced])

  // the placeholder types the example prompts out
  React.useEffect(() => {
    if (!prompts.length) return
    if (reduced) {
      setTyped(prompts[0])
      return
    }
    let i = 0
    let n = 0
    let back = false
    let id = 0
    const tick = () => {
      const full = prompts[i % prompts.length]
      if (!back) {
        n++
        setTyped(full.slice(0, n))
        if (n >= full.length) {
          back = true
          id = window.setTimeout(tick, 2200)
          return
        }
        id = window.setTimeout(tick, 26 + Math.random() * 40)
      } else {
        n = Math.max(0, n - 3)
        setTyped(full.slice(0, n))
        if (n === 0) {
          back = false
          i++
          id = window.setTimeout(tick, 380)
          return
        }
        id = window.setTimeout(tick, 14)
      }
    }
    id = window.setTimeout(tick, 900)
    return () => window.clearTimeout(id)
  }, [prompts, reduced])

  // model menu closes on outside press and Escape
  React.useEffect(() => {
    if (!menuOpen) return
    const first = menuRef.current?.querySelector("[role=menuitemradio]") as HTMLElement | null
    first?.focus()
    const down = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node) || modelBtnRef.current?.contains(e.target as Node)) return
      setMenuOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false)
        modelBtnRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", down)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("pointerdown", down)
      document.removeEventListener("keydown", key)
    }
  }, [menuOpen])

  const menuKeys = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const items = Array.from(menuRef.current?.querySelectorAll("[role=menuitemradio]") || []) as HTMLElement[]
    const at = items.indexOf(document.activeElement as HTMLElement)
    items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus()
  }

  // the glass sheen follows the pointer
  const sheen = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%")
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%")
  }

  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    sheen(e)
    if (reduced || e.pointerType !== "mouse") return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    gsap.to(el, { rotateY: x * 7, rotateX: -y * 7, transformPerspective: 900, duration: 0.5, ease: "power3.out", overwrite: "auto" })
  }
  const untilt = (e: React.PointerEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 0.7, ease: "elastic.out(1,0.6)", overwrite: "auto" })
  }

  // the closed menu sheet is out of the tab order
  React.useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    if (sheet) el.removeAttribute("inert")
    else el.setAttribute("inert", "")
  }, [sheet])

  /* ---------- the sky ---------- */

  React.useEffect(() => {
    const sky = skyRef.current
    const root = rootRef.current
    if (!sky || !root) return
    // a fresh canvas per mount: a context lost on unmount is never handed back
    const canvas = document.createElement("canvas")
    canvas.className = "mpt-canvas"
    sky.prepend(canvas)
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, powerPreference: "low-power" })
    if (!gl) {
      root.dataset.sky = "fallback"
      canvas.remove()
      return
    }
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)
      if (!sh) return null
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh)
        return null
      }
      return sh
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()
    if (!vs || !fs || !prog) {
      root.dataset.sky = "fallback"
      canvas.remove()
      return
    }
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      root.dataset.sky = "fallback"
      canvas.remove()
      return
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "aPos")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const U = {
      res: gl.getUniformLocation(prog, "uRes"),
      time: gl.getUniformLocation(prog, "uTime"),
      mix: gl.getUniformLocation(prog, "uMix"),
      ptr: gl.getUniformLocation(prog, "uPtr"),
      ptrOn: gl.getUniformLocation(prog, "uPtrOn"),
      accent: gl.getUniformLocation(prog, "uAccent"),
    }
    gl.uniform3f(U.accent, tone.gl[0], tone.gl[1], tone.gl[2])
    root.dataset.sky = "webgl"

    const state = mixRef.current
    let w = 0
    let h = 0
    const size = () => {
      const r = sky.getBoundingClientRect()
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75
      w = Math.max(1, Math.round(r.width * scale))
      h = Math.max(1, Math.round(r.height * scale))
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      state.dirty = true
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(sky)

    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(root)

    const t0 = performance.now()
    let raf = 0
    let ptrOn = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      if (reduced && !state.dirty) return
      state.dirty = false
      ptrOn += (state.ptrOn - ptrOn) * 0.08
      gl.uniform2f(U.res, w, h)
      gl.uniform1f(U.time, reduced ? 12.0 : (now - t0) / 1000)
      gl.uniform1f(U.mix, state.a + state.b)
      gl.uniform2f(U.ptr, state.ptr[0], state.ptr[1])
      gl.uniform1f(U.ptrOn, reduced ? 0 : ptrOn)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(frame)

    const move = (e: PointerEvent) => {
      const r = sky.getBoundingClientRect()
      state.ptr = [(e.clientX - r.left) / r.height, (r.bottom - e.clientY) / r.height]
      state.ptrOn = 1
    }
    const leave = () => {
      state.ptrOn = 0
    }
    root.addEventListener("pointermove", move)
    root.addEventListener("pointerleave", leave)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointermove", move)
      root.removeEventListener("pointerleave", leave)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      canvas.remove()
    }
  }, [reduced, tone])

  /* ---------- choreography ---------- */

  useIsoLayoutEffect(() => {
    const root = rootRef.current
    const hero = heroRef.current
    const featuresEl = featuresRef.current
    const pricingEl = pricingRef.current
    if (!root || !hero || !featuresEl || !pricingEl) return
    gsap.registerPlugin(ScrollTrigger)
    const scroller = findScroller(root)
    scrollerRef.current = scroller
    const R = reduced
    const state = mixRef.current

    const ctx = gsap.context((self) => {
      const q = gsap.utils.selector(root)

      // the sky re-tiles into the next section's shader as it arrives
      ScrollTrigger.create({
        trigger: featuresEl,
        scroller,
        start: "top 85%",
        end: "top 20%",
        scrub: R ? false : 0.6,
        onUpdate: (st) => {
          state.a = st.progress
          state.dirty = true
        },
      })
      ScrollTrigger.create({
        trigger: pricingEl,
        scroller,
        start: "top 85%",
        end: "top 20%",
        scrub: R ? false : 0.6,
        onUpdate: (st) => {
          state.b = st.progress
          state.dirty = true
        },
      })

      // the header gains its glass once the page moves
      ScrollTrigger.create({
        trigger: root,
        scroller,
        start: "top+=12 top",
        end: "bottom top",
        toggleClass: { targets: headerRef.current as Element, className: "is-scrolled" },
      })

      // the nav knows where you are
      const mark = (name: "home" | "features" | "pricing", el: Element) =>
        ScrollTrigger.create({
          trigger: el,
          scroller,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (st) => {
            if (st.isActive) setActive(name)
          },
        })
      mark("home", hero)
      mark("features", featuresEl)
      mark("pricing", pricingEl)

      const heroPx = q(".mpt-hero .mpt-px") as Element[]
      const heroGlyphs = q(".mpt-hero .mpt-glyph") as Element[]

      if (!R) {
        // intro: the pixels fly in from everywhere and assemble the headline
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } })
        intro
          .fromTo(
            heroPx,
            {
              x: () => gsap.utils.random(-40, 40),
              y: () => gsap.utils.random(-26, 26),
              scale: () => gsap.utils.random(0, 2.4),
              opacity: 0,
              transformOrigin: "50% 50%",
            },
            { x: 0, y: 0, scale: 1, opacity: 1, duration: 1.5, stagger: { amount: 0.75, from: "random" } },
          )
          .fromTo(
            q(".mpt-composer"),
            { y: 40, opacity: 0, scale: 0.96, filter: "blur(10px)" },
            { y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.1, clearProps: "filter,transform" },
            0.55,
          )
          .fromTo(q(".mpt-hint, .mpt-cue .mpt-picon"), { opacity: 0 }, { opacity: 1, duration: 0.9, stagger: 0.12 }, 1.0)
          .fromTo(q(".mpt-brand, .mpt-bar > .mpt-cta, .mpt-burger"), { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, clearProps: "transform" }, 0.2)
          .fromTo(q(".mpt-links"), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.3)

        // leaving the hero: glyphs scatter upward one by one, the composer sinks back
        const out = gsap.timeline({
          scrollTrigger: { trigger: hero, scroller, start: "top top", end: "bottom top", scrub: 0.8 },
        })
        out
          .to(heroGlyphs, {
            y: () => gsap.utils.random(-14, -4),
            x: () => gsap.utils.random(-3, 3),
            rotation: () => gsap.utils.random(-30, 30),
            opacity: 0,
            transformOrigin: "50% 50%",
            stagger: { amount: 0.5, from: "random" },
            ease: "power2.in",
          })
          .to(q(".mpt-composer-wrap"), { y: -80, scale: 0.92, opacity: 0, ease: "power2.in" }, 0.15)
          .to(q(".mpt-cue"), { opacity: 0, y: 20 }, 0)

        // a few pixels catch the accent now and then
        const shimmer = () => {
          const lit = gsap.utils.shuffle(heroPx.slice()).slice(0, 7)
          lit.forEach((el, i) => {
            gsap.delayedCall(i * 0.09, () => el.classList.add("is-lit"))
            gsap.delayedCall(0.9 + i * 0.09, () => el.classList.remove("is-lit"))
          })
          gsap.delayedCall(gsap.utils.random(1.8, 3.2), shimmer)
        }
        gsap.delayedCall(2.4, shimmer)

        // section headings assemble from their pixels when reached
        ;(q(".mpt-sec-title") as Element[]).forEach((svg) => {
          gsap.fromTo(svg.querySelectorAll(".mpt-px"), {
            x: () => gsap.utils.random(-14, 14),
            y: () => gsap.utils.random(-10, 10),
            opacity: 0,
            scale: 0,
            transformOrigin: "50% 50%",
          }, {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.1,
            ease: "expo.out",
            stagger: { amount: 0.5, from: "random" },
            scrollTrigger: { trigger: svg, scroller, start: "top 85%", toggleActions: "play none none reverse" },
          })
        })
        const lift = (targets: Element[], trigger: Element) =>
          gsap.fromTo(
            targets,
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger, scroller, start: "top 75%", toggleActions: "play none none reverse" } },
          )
        lift(q(".mpt-features .mpt-kicker, .mpt-features .mpt-lede") as Element[], featuresEl)
        lift(q(".mpt-pricing .mpt-kicker, .mpt-pricing .mpt-lede, .mpt-pricing .mpt-cycle") as Element[], pricingEl)

        // features drop into place, staggered, like tiles falling into a grid
        gsap.fromTo(q(".mpt-feature"), {
          y: -70,
          rotateX: 24,
          transformPerspective: 900,
          transformOrigin: "50% 0%",
          opacity: 0,
        }, {
          y: 0,
          rotateX: 0,
          opacity: 1,
          duration: 1,
          ease: "back.out(1.4)",
          stagger: { each: 0.09, grid: "auto", from: "start" },
          clearProps: "transform",
          scrollTrigger: { trigger: q(".mpt-features-grid")[0], scroller, start: "top 82%", toggleActions: "play none none reverse" },
        })

        // plans rise and unfold, the featured one last and largest
        gsap.fromTo(q(".mpt-plan"), { y: 90, scale: 0.9, opacity: 0 }, {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 1.1,
          ease: "expo.out",
          stagger: (i: number, el: Element) => ((el as HTMLElement).dataset.featured ? 0.28 : i * 0.08),
          clearProps: "transform",
          scrollTrigger: { trigger: q(".mpt-plans")[0], scroller, start: "top 82%", toggleActions: "play none none reverse" },
        })

        // the footer wordmark gathers its pixels as you reach the end
        const foot = q(".mpt-foot-mark .mpt-px") as Element[]
        if (foot.length) {
          gsap.fromTo(
            foot,
            { x: () => gsap.utils.random(-30, 30), y: () => gsap.utils.random(-6, 30), opacity: 0, scale: 0.2, transformOrigin: "50% 50%" },
            {
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              ease: "none",
              stagger: { amount: 0.6, from: "random" },
              scrollTrigger: { trigger: q(".mpt-foot")[0], scroller, start: "top bottom", end: "bottom bottom", scrub: 0.6 },
            },
          )
        }

        // the headline's pixels step aside from the pointer
        const svgs = q(".mpt-h1 .mpt-ptext") as unknown as SVGSVGElement[]
        const pts = svgs.map((svg) =>
          (Array.from(svg.querySelectorAll(".mpt-px")) as SVGRectElement[]).map((el) => ({ el, x: +(el.dataset.x || 0), y: +(el.dataset.y || 0), off: false })),
        )
        let pending = 0
        let last = { x: -1e4, y: -1e4 }
        const RADIUS = 3.4
        const repel = () => {
          pending = 0
          svgs.forEach((svg, si) => {
            const r = svg.getBoundingClientRect()
            const unit = r.width / (svg.viewBox.baseVal.width || 1)
            const ux = (last.x - r.left) / unit - 0.5
            const uy = (last.y - r.top) / unit - 0.5
            pts[si].forEach((p) => {
              const dx = p.x + 0.44 - ux
              const dy = p.y + 0.44 - uy
              const d = Math.hypot(dx, dy)
              if (d < RADIUS) {
                const push = (1 - d / RADIUS) * 1.5
                const nx = d ? dx / d : 0
                const ny = d ? dy / d : -1
                p.off = true
                gsap.to(p.el, { attr: { x: p.x + nx * push, y: p.y + ny * push }, duration: 0.35, ease: "power3.out", overwrite: "auto" })
              } else if (p.off) {
                p.off = false
                gsap.to(p.el, { attr: { x: p.x, y: p.y }, duration: 0.9, ease: "elastic.out(1,0.45)", overwrite: "auto" })
              }
            })
          })
        }
        const onMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return
          last = { x: e.clientX, y: e.clientY }
          if (!pending) pending = requestAnimationFrame(repel)
        }
        const onLeave = () => {
          last = { x: -1e4, y: -1e4 }
          if (!pending) pending = requestAnimationFrame(repel)
        }
        const h1 = q(".mpt-h1")[0] as HTMLElement | undefined
        h1?.addEventListener("pointermove", onMove)
        h1?.addEventListener("pointerleave", onLeave)
        self.add(() => () => {
          cancelAnimationFrame(pending)
          h1?.removeEventListener("pointermove", onMove)
          h1?.removeEventListener("pointerleave", onLeave)
        })
      }
    }, root)

    // late layout (fonts, images in an installer's page) re-measures the triggers
    let t = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t)
      t = window.setTimeout(() => ScrollTrigger.refresh(), 120)
    })
    ro.observe(root)

    return () => {
      window.clearTimeout(t)
      ro.disconnect()
      ctx.revert()
    }
  }, [reduced, features.length, plans.length, headline.join("|")])

  // the nav pill slides to the active link
  useIsoLayoutEffect(() => {
    const links = linksRef.current
    const pill = pillRef.current
    if (!links || !pill) return
    const place = () => {
      const a = links.querySelector('[data-nav="' + active + '"]') as HTMLElement | null
      if (!a) {
        pill.style.opacity = "0"
        return
      }
      pill.style.opacity = "1"
      pill.style.width = a.offsetWidth + "px"
      pill.style.transform = "translateX(" + a.offsetLeft + "px)"
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(links)
    return () => ro.disconnect()
  }, [active])

  // prices count to their new value when the billing cycle changes
  const firstCycle = React.useRef(true)
  React.useEffect(() => {
    if (firstCycle.current) {
      firstCycle.current = false
      return
    }
    const tweens = plans.map((p, i) => {
      const el = priceRefs.current[i]
      if (!el) return null
      const to = yearly ? yearlyPrice(p.price) : p.price
      const from = yearly ? p.price : yearlyPrice(p.price)
      if (reduced) {
        el.textContent = money(to, currency)
        return null
      }
      const o = { v: from }
      return gsap.to(o, {
        v: to,
        duration: 0.7,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = money(o.v, currency)
        },
      })
    })
    return () => tweens.forEach((t) => t?.kill())
  }, [yearly])

  /* ---------- render ---------- */

  const rootStyle = {
    "--mpt-h": height,
    "--mpt-a1": tone.a1,
    "--mpt-a2": tone.a2,
    "--mpt-a3": tone.a3,
    "--mpt-glow": tone.glow,
    "--mpt-ink": tone.ink,
  } as React.CSSProperties

  const navLinks = (
    <>
      <button type="button" className="mpt-link" data-nav="features" aria-current={active === "features" ? "true" : undefined} onClick={() => go("features")}>
        Features
      </button>
      <button type="button" className="mpt-link" data-nav="pricing" aria-current={active === "pricing" ? "true" : undefined} onClick={() => go("pricing")}>
        Pricing
      </button>
    </>
  )

  const empty = !prompt
  const ids = { h1: uid + "-h1", input: uid + "-input", menu: uid + "-menu", feat: uid + "-feat", price: uid + "-price", sheet: uid + "-sheet" }

  return (
    <div ref={rootRef} className={"mpt-root" + (className ? " " + className : "")} style={rootStyle} data-motion={reduced ? "reduced" : "full"}>
      <style>{MPT_CSS}</style>

      <div ref={skyRef} className="mpt-sky" aria-hidden="true">
        <div className="mpt-grain" />
      </div>

      <header ref={headerRef} className="mpt-header">
        <div className="mpt-bar">
          <button type="button" className="mpt-brand" onClick={getStarted} aria-label={brand + ", home"}>
            <FMark className="mpt-mark" />
            <span>{brand}</span>
          </button>
          <nav className="mpt-links" ref={linksRef} aria-label="Sections">
            <span ref={pillRef} className="mpt-pill" aria-hidden="true" />
            {navLinks}
          </nav>
          <button type="button" className="mpt-cta" onClick={getStarted}>
            <span>Get Started</span>
          </button>
          <button
            type="button"
            className="mpt-burger"
            aria-expanded={sheet}
            aria-controls={ids.sheet}
            aria-label={sheet ? "Close menu" : "Open menu"}
            onClick={() => setSheet((s) => !s)}
          >
            <span />
            <span />
          </button>
        </div>
        <div ref={sheetRef} id={ids.sheet} className="mpt-sheet" data-open={sheet ? "true" : "false"}>
          <div className="mpt-sheet-inner">
            <div className="mpt-sheet-panel">
              {navLinks}
              <button type="button" className="mpt-cta mpt-cta-wide" onClick={getStarted}>
                <span>Get Started</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section ref={heroRef} className="mpt-hero" aria-labelledby={ids.h1}>
          <h1 id={ids.h1} className="mpt-h1">
            <span className="mpt-sr">{headline.join(". ")}</span>
            {headline.map((line, i) => (
              <PixelText key={i} text={line} maxWidth={headWidth} />
            ))}
          </h1>

          <div className="mpt-composer-wrap">
            <form
              ref={cardRef}
              className="mpt-composer"
              data-phase={phase}
              data-nudge={nudge ? "true" : "false"}
              onSubmit={submit}
              onPointerMove={sheen}
              aria-label="Describe your app"
            >
              <span className="mpt-sheen" aria-hidden="true" />
              {phase === "idle" && (
                <>
                  <div className="mpt-field mpt-enter">
                    <label htmlFor={ids.input} className="mpt-sr">
                      Describe the app you want
                    </label>
                    <textarea
                      ref={inputRef}
                      id={ids.input}
                      className="mpt-input"
                      rows={2}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e)
                      }}
                    />
                    {empty && (
                      <span className="mpt-ph" aria-hidden="true">
                        {focused ? "Describe your app in a sentence or two..." : typed}
                        {!focused && <i className="mpt-caret" />}
                      </span>
                    )}
                  </div>
                  {files.length > 0 && (
                    <ul className="mpt-files mpt-enter" aria-label="Attached files">
                      {files.map((f, i) => (
                        <li key={f + i} className="mpt-file">
                          <PixelIcon name="clip" />
                          <span>{f}</span>
                          <button type="button" aria-label={"Remove " + f} onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}>
                            x
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mpt-tools mpt-enter">
                    <div className="mpt-chips" role="radiogroup" aria-label="What are you building?">
                      {platforms.map((p, i) => (
                        <button
                          key={p.label}
                          type="button"
                          role="radio"
                          aria-checked={platform === i}
                          className="mpt-chip"
                          onClick={() => setPlatform(i)}
                        >
                          <PixelIcon name={p.icon} />
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mpt-right">
                      <div className="mpt-model-wrap">
                        <button
                          ref={modelBtnRef}
                          type="button"
                          className="mpt-model"
                          aria-haspopup="menu"
                          aria-expanded={menuOpen}
                          aria-controls={ids.menu}
                          onClick={() => setMenuOpen((o) => !o)}
                        >
                          <PixelIcon name="bolt" />
                          <span>{models[model]}</span>
                          <svg className="mpt-chev" viewBox="0 0 10 6" aria-hidden="true">
                            <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {menuOpen && (
                          <div ref={menuRef} id={ids.menu} className="mpt-menu" role="menu" aria-label="Model" onKeyDown={menuKeys}>
                            {models.map((m, i) => (
                              <button
                                key={m}
                                type="button"
                                role="menuitemradio"
                                aria-checked={model === i}
                                className="mpt-menu-item"
                                onClick={() => {
                                  setModel(i)
                                  setMenuOpen(false)
                                  modelBtnRef.current?.focus()
                                }}
                              >
                                <span>{m}</span>
                                <small>{i === 0 ? "Fastest drafts" : i === models.length - 1 ? "Most careful" : "Balanced"}</small>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button type="button" className="mpt-attach" aria-label="Attach a sketch or screenshot" onClick={() => fileRef.current?.click()}>
                        <svg viewBox="0 0 20 20" aria-hidden="true">
                          <path
                            d="M13.5 6.5l-5.8 5.8a1.6 1.6 0 002.3 2.3l6-6a3.2 3.2 0 00-4.5-4.5l-6.2 6.2a4.8 4.8 0 006.8 6.8l5.3-5.3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.fig,.sketch"
                        className="mpt-sr"
                        tabIndex={-1}
                        onChange={(e) => {
                          const list = Array.from(e.target.files || []).map((f) => f.name)
                          if (list.length) setFiles((fs) => fs.concat(list).slice(0, 4))
                          e.target.value = ""
                        }}
                      />
                      <button type="submit" className="mpt-send" aria-label="Build it" data-ready={empty ? "false" : "true"}>
                        <PixelIcon name="arrow" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {phase === "building" && (
                <div className="mpt-build" role="status" aria-live="polite">
                  <div className="mpt-build-head mpt-enter">
                    <span className="mpt-build-title">Building {built.name}</span>
                    <span className="mpt-build-pct">{Math.round((step / BUILD_STEPS.length) * 100)}%</span>
                  </div>
                  <div className="mpt-progress mpt-enter" aria-hidden="true">
                    <span style={{ transform: "scaleX(" + step / BUILD_STEPS.length + ")" }} />
                  </div>
                  <ol className="mpt-steps">
                    {BUILD_STEPS.map((s, i) => (
                      <li key={s} className="mpt-step mpt-enter" data-state={i < step ? "done" : i === step ? "active" : "todo"}>
                        <span className="mpt-step-mark" aria-hidden="true">
                          {i < step ? <PixelIcon name="check" /> : <i />}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mpt-build-foot mpt-enter">
                    <button type="button" className="mpt-ghost" onClick={() => reset(true)}>
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {phase === "done" && (
                <div className="mpt-done">
                  <div className="mpt-done-copy">
                    <span className="mpt-done-kicker mpt-enter">
                      <PixelIcon name="check" /> Preview ready
                    </span>
                    <p className="mpt-done-title mpt-enter">{built.name}</p>
                    <p className="mpt-done-prompt mpt-enter">{built.prompt}</p>
                    <div className="mpt-done-actions mpt-enter">
                      <button type="button" className="mpt-ghost" onClick={() => reset(true)}>
                        Refine prompt
                      </button>
                      <button type="button" className="mpt-solid" onClick={() => reset(false)}>
                        New app
                      </button>
                    </div>
                  </div>
                  <div className="mpt-device mpt-enter" data-kind={/mobile|phone/i.test(built.platform) ? "phone" : "screen"} aria-hidden="true">
                    <div className="mpt-device-top">
                      <i />
                      <span>{built.name}</span>
                    </div>
                    <div className="mpt-device-hero" />
                    <div className="mpt-device-row">
                      <i />
                      <span />
                    </div>
                    <div className="mpt-device-row">
                      <i />
                      <span />
                    </div>
                    <div className="mpt-device-row">
                      <i />
                      <span />
                    </div>
                    <div className="mpt-device-tabs">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
              )}
            </form>
            <p className="mpt-hint">
              <kbd>Enter</kbd> to build <span aria-hidden="true">/</span> <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
            </p>
          </div>

          <button type="button" className="mpt-cue" onClick={() => go("features")} aria-label="Scroll to features">
            <PixelIcon name="down" />
          </button>
        </section>

        <section ref={featuresRef} className="mpt-section mpt-features" aria-labelledby={ids.feat}>
          <div className="mpt-inner">
            <div className="mpt-sec-head">
              <span className="mpt-kicker">
                <i /> Features
              </span>
              <h2 id={ids.feat} className="mpt-h2">
                <span className="mpt-sr">{featuresTitle}</span>
                <PixelText text={featuresTitle} className="mpt-sec-title" />
              </h2>
              <p className="mpt-lede">{featuresLede}</p>
            </div>
            <ul className="mpt-features-grid">
              {features.map((f, i) => (
                <li key={f.title} className="mpt-feature mpt-glass" onPointerMove={tilt} onPointerLeave={untilt}>
                  <span className="mpt-feature-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mpt-feature-icon">
                    <PixelIcon name={f.icon} />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section ref={pricingRef} className="mpt-section mpt-pricing" aria-labelledby={ids.price}>
          <div className="mpt-inner">
            <div className="mpt-sec-head">
              <span className="mpt-kicker">
                <i /> Pricing
              </span>
              <h2 id={ids.price} className="mpt-h2">
                <span className="mpt-sr">{pricingTitle}</span>
                <PixelText text={pricingTitle} className="mpt-sec-title" />
              </h2>
              <p className="mpt-lede">{pricingLede}</p>
              <div className="mpt-cycle" role="group" aria-label="Billing cycle" data-yearly={yearly ? "true" : "false"}>
                <span className="mpt-cycle-pill" aria-hidden="true" />
                <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>
                  Monthly
                </button>
                <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>
                  Yearly <em>-{Math.round(yearlyDiscount * 100)}%</em>
                </button>
              </div>
            </div>
            <ul className="mpt-plans">
              {plans.map((p, i) => (
                <li
                  key={p.name}
                  className="mpt-plan mpt-glass"
                  data-featured={p.featured ? "true" : undefined}
                  onPointerMove={tilt}
                  onPointerLeave={untilt}
                >
                  <div className="mpt-plan-head">
                    <h3>{p.name}</h3>
                    {p.badge && <span className="mpt-badge">{p.badge}</span>}
                  </div>
                  <p className="mpt-plan-blurb">{p.blurb}</p>
                  <p className="mpt-price">
                    <span
                      ref={(el) => {
                        priceRefs.current[i] = el
                      }}
                      className="mpt-price-num"
                    >
                      {money(p.price, currency)}
                    </span>
                    <span className="mpt-price-per">
                      / month
                      <small>{p.price === 0 ? "free forever" : yearly ? "billed yearly" : "billed monthly"}</small>
                    </span>
                  </p>
                  <button type="button" className={p.featured ? "mpt-solid mpt-plan-cta" : "mpt-ghost mpt-plan-cta"} onClick={() => (onPlanSelect ? onPlanSelect(p, yearly) : go("home", true))}>
                    {p.cta}
                  </button>
                  <ul className="mpt-plan-list">
                    {p.features.map((f) => (
                      <li key={f}>
                        <PixelIcon name="check" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="mpt-foot">
        <div className="mpt-inner">
          <div className="mpt-foot-mark" aria-hidden="true">
            <PixelText text={brand} />
          </div>
          <div className="mpt-foot-row">
            <span className="mpt-foot-brand">
              <FMark className="mpt-mark-sm" />
              {footerNote}
            </span>
            <span className="mpt-foot-links">
              <button type="button" onClick={() => go("features")}>
                Features
              </button>
              <button type="button" onClick={() => go("pricing")}>
                Pricing
              </button>
              <button type="button" onClick={() => go("home", true)}>
                Back to top
              </button>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const MPT_CSS = `
.mpt-root{--mpt-bg:#050506;--mpt-fg:#f5f5f6;--mpt-mute:#a3a3ab;--mpt-dim:#77777f;--mpt-line:rgba(214,228,255,.13);--mpt-glass:rgba(32,32,36,.62);--mpt-pxs:clamp(3.4px,min(.62vw + 1.6px,1.05svh + .9px),8.2px);position:relative;isolation:isolate;min-height:var(--mpt-h);background:var(--mpt-bg);color:var(--mpt-fg);overflow-x:clip;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-align:left;line-height:1.5}
.mpt-root :where(svg,canvas,img){display:block;max-width:none}
.mpt-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mpt-root :where(h1,h2,h3,p,ul,ol,li,figure){margin:0;padding:0}
.mpt-root :where(ul,ol){list-style:none}
.mpt-root :where(button,textarea,a):focus-visible{outline:2px solid var(--mpt-a2);outline-offset:3px;border-radius:8px}
.mpt-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

.mpt-sky{position:sticky;top:0;height:var(--mpt-h);margin-bottom:calc(var(--mpt-h) * -1);z-index:0;overflow:hidden;background:radial-gradient(60% 50% at 50% 55%,#2a2b33,transparent 70%),radial-gradient(80% 60% at 80% 120%,#2b1b2b,transparent 70%),#050506}
.mpt-canvas{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1.2s ease}
.mpt-root[data-sky="webgl"] .mpt-canvas{opacity:1}
.mpt-grain{position:absolute;inset:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(5,5,6,.55),transparent 18%,transparent 70%,rgba(5,5,6,.6));pointer-events:none}

.mpt-header{position:sticky;top:0;z-index:30;height:0}
.mpt-bar{position:relative;display:flex;align-items:center;justify-content:space-between;gap:16px;height:72px;padding:0 clamp(18px,4.6vw,64px);transition:background-color .4s ease,box-shadow .4s ease,backdrop-filter .4s ease}
.mpt-header.is-scrolled .mpt-bar{background:rgba(8,8,10,.52);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);box-shadow:0 1px 0 var(--mpt-line)}
.mpt-brand{display:inline-flex;align-items:center;gap:11px;font-size:18px;font-weight:600;letter-spacing:-.015em}
.mpt-mark{width:32px;height:32px;transition:transform .5s cubic-bezier(.16,1,.3,1)}
.mpt-brand:hover .mpt-mark{transform:rotate(-8deg) scale(1.06)}
.mpt-links{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:6px;padding:4px;border-radius:14px}
.mpt-pill{position:absolute;left:0;top:4px;height:calc(100% - 8px);border-radius:10px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);transition:transform .55s cubic-bezier(.16,1,.3,1),width .55s cubic-bezier(.16,1,.3,1),opacity .3s ease;pointer-events:none}
.mpt-link{position:relative;padding:8px 16px;font-size:16px;color:rgba(245,245,246,.86);border-radius:10px;transition:color .2s}
.mpt-link:hover,.mpt-link[aria-current="true"]{color:#fff}
.mpt-cta{display:grid;place-items:center;height:42px;padding:0 20px;border-radius:12px;font-size:15px;font-weight:550;letter-spacing:-.01em;background:linear-gradient(180deg,#3d3d41,#1c1c20);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 1px rgba(255,255,255,.06),0 6px 18px rgba(0,0,0,.35);transition:filter .2s,transform .2s}
.mpt-cta:hover{filter:brightness(1.18)}
.mpt-cta:active{transform:translateY(1px)}
.mpt-burger{display:none;width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);place-items:center;align-content:center;gap:5px}
.mpt-burger span{display:block;width:16px;height:1.6px;border-radius:2px;background:#fff;transition:transform .35s cubic-bezier(.16,1,.3,1)}
.mpt-burger[aria-expanded="true"] span:first-child{transform:translateY(3.3px) rotate(45deg)}
.mpt-burger[aria-expanded="true"] span:last-child{transform:translateY(-3.3px) rotate(-45deg)}
.mpt-sheet{display:none}

.mpt-hero{position:relative;z-index:1;container-type:inline-size;min-height:max(var(--mpt-h),600px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(30px,6.2svh,56px);padding:96px clamp(16px,4vw,40px) 88px}
.mpt-h1{display:flex;flex-direction:column;align-items:center;gap:calc(var(--mpt-pxs) * 2.1);color:#fff;filter:drop-shadow(0 4px 22px rgba(0,0,0,.55));cursor:default}
.mpt-ptext{height:auto;overflow:visible;fill:currentColor}
.mpt-h1 .mpt-ptext{width:min(calc(var(--mpt-pxs) * var(--w)),calc(min(100cqi - 32px,1100px) * var(--w) / var(--wmax)))}
.mpt-px{transition:fill .7s ease}
.mpt-px.is-lit{fill:var(--mpt-a2);transition:fill .25s ease}

.mpt-composer-wrap{width:min(720px,100%);display:flex;flex-direction:column;align-items:center;gap:14px}
.mpt-composer{--mx:50%;--my:0%;position:relative;width:100%;border-radius:26px;padding:22px 18px 16px 24px;background:var(--mpt-glass);backdrop-filter:blur(26px) saturate(150%);-webkit-backdrop-filter:blur(26px) saturate(150%);box-shadow:inset 0 0 0 1px var(--mpt-line),inset 0 1px 0 rgba(255,255,255,.08),0 24px 70px rgba(0,0,0,.5);transition:box-shadow .35s ease}
.mpt-composer:focus-within{box-shadow:inset 0 0 0 1px rgba(214,228,255,.24),inset 0 1px 0 rgba(255,255,255,.1),0 0 0 6px rgba(255,255,255,.035),0 24px 70px rgba(0,0,0,.55)}
.mpt-composer[data-nudge="true"]{animation:mpt-nudge .45s cubic-bezier(.36,.07,.19,.97)}
@keyframes mpt-nudge{20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}}
.mpt-sheen{position:absolute;inset:0;width:100%;height:100%;border-radius:inherit;pointer-events:none;background:radial-gradient(420px circle at var(--mx) var(--my),rgba(255,255,255,.075),transparent 55%);opacity:.9}
.mpt-field{position:relative}
.mpt-input{display:block;width:100%;min-height:52px;max-height:180px;resize:none;border:0;outline:0;background:transparent;color:var(--mpt-fg);font:inherit;font-size:16px;line-height:1.55;letter-spacing:.005em;padding:0;field-sizing:content}
.mpt-root .mpt-input:focus-visible{outline:none}
.mpt-ph{position:absolute;left:0;top:0;right:0;font-size:16px;line-height:1.55;color:#85868b;pointer-events:none;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.mpt-caret{display:inline-block;width:2px;height:1.05em;margin-left:2px;vertical-align:-2px;background:var(--mpt-a2);animation:mpt-blink 1s steps(1) infinite}
@keyframes mpt-blink{50%{opacity:0}}
.mpt-files{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.mpt-file{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 6px 0 9px;border-radius:9px;font-size:12px;color:#c9c9ce;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);max-width:220px}
.mpt-file span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpt-file .mpt-picon{width:11px;height:11px;fill:var(--mpt-a2)}
.mpt-file button{width:18px;height:18px;border-radius:6px;font-size:11px;color:#9a9aa2;display:grid;place-items:center}
.mpt-file button:hover{background:rgba(255,255,255,.1);color:#fff}
.mpt-tools{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:22px}
.mpt-chips{display:flex;flex-wrap:wrap;gap:6px}
.mpt-chip{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 11px 0 9px;border-radius:10px;font-size:12.5px;font-weight:500;color:#9d9da4;background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.04));box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);transition:color .2s,background .2s,box-shadow .2s,transform .2s}
.mpt-chip .mpt-picon{width:12px;height:12px;fill:currentColor}
.mpt-chip:hover{color:#d4d4d8;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.07))}
.mpt-chip[aria-checked="true"]{color:#fff;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.08));box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.mpt-chip[aria-checked="true"] .mpt-picon{fill:var(--mpt-a2)}
.mpt-chip:active{transform:scale(.96)}
.mpt-right{display:flex;align-items:center;gap:6px;flex:none}
.mpt-model-wrap{position:relative}
.mpt-model{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 10px;border-radius:10px;font-size:12.5px;color:#a3a3aa;transition:background .2s,color .2s}
.mpt-model:hover,.mpt-model[aria-expanded="true"]{background:rgba(255,255,255,.07);color:#fff}
.mpt-model .mpt-picon{width:11px;height:11px;fill:var(--mpt-a2)}
.mpt-chev{width:9px;height:6px;transition:transform .3s}
.mpt-model[aria-expanded="true"] .mpt-chev{transform:rotate(180deg)}
.mpt-menu{position:absolute;right:0;bottom:calc(100% + 10px);z-index:5;min-width:200px;padding:6px;border-radius:14px;background:rgba(22,22,26,.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 18px 50px rgba(0,0,0,.55);transform-origin:90% 100%;animation:mpt-pop .28s cubic-bezier(.16,1,.3,1)}
@keyframes mpt-pop{from{opacity:0;transform:translateY(6px) scale(.96)}}
.mpt-menu-item{display:flex;width:100%;align-items:baseline;justify-content:space-between;gap:16px;padding:9px 10px;border-radius:9px;font-size:13.5px;text-align:left}
.mpt-menu-item small{font-size:11.5px;color:#7d7d85}
.mpt-menu-item:hover,.mpt-menu-item:focus-visible{background:rgba(255,255,255,.08)}
.mpt-menu-item[aria-checked="true"] span{color:var(--mpt-a2)}
.mpt-attach{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#a6a6ad;transition:background .2s,color .2s}
.mpt-attach svg{width:19px;height:19px}
.mpt-attach:hover{color:#fff;background:rgba(255,255,255,.07)}
.mpt-send{position:relative;width:38px;height:38px;margin-left:4px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(160deg,var(--mpt-a1),var(--mpt-a2) 48%,var(--mpt-a3));box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 4px 16px var(--mpt-glow);transition:transform .3s cubic-bezier(.16,1,.3,1),filter .2s,opacity .3s}
.mpt-send .mpt-picon{width:14px;height:14px;fill:var(--mpt-ink)}
.mpt-send[data-ready="false"]{filter:saturate(.35) brightness(.8)}
.mpt-send[data-ready="true"]{animation:mpt-ready 2.4s ease-in-out infinite}
@keyframes mpt-ready{50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 4px 26px var(--mpt-glow),0 0 0 6px rgba(255,255,255,.04)}}
.mpt-send:hover{transform:scale(1.07)}
.mpt-send:active{transform:scale(.94)}
.mpt-hint{font-size:12px;color:var(--mpt-dim);letter-spacing:.01em}
.mpt-hint kbd{font:inherit;font-size:11px;padding:1px 6px;border-radius:5px;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);color:#b6b6bd}

.mpt-build{display:flex;flex-direction:column;gap:14px;padding:2px 6px 0 0}
.mpt-build-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.mpt-build-title{font-size:16px;font-weight:600;letter-spacing:-.01em}
.mpt-build-pct{font-size:13px;color:var(--mpt-a2);font-variant-numeric:tabular-nums}
.mpt-progress{height:4px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden}
.mpt-progress span{display:block;width:100%;height:4px;border-radius:4px;background:linear-gradient(90deg,var(--mpt-a3),var(--mpt-a1));transform-origin:0 50%;transition:transform .6s cubic-bezier(.16,1,.3,1)}
.mpt-steps{display:grid;gap:8px}
.mpt-step{display:flex;align-items:center;gap:10px;font-size:14px;color:#6f6f77;transition:color .4s}
.mpt-step[data-state="active"]{color:#fff}
.mpt-step[data-state="done"]{color:#b4b4bb}
.mpt-step-mark{width:16px;height:16px;display:grid;place-items:center;flex:none}
.mpt-step-mark .mpt-picon{width:13px;height:13px;fill:var(--mpt-a2)}
.mpt-step-mark i{width:6px;height:6px;border-radius:1.5px;background:currentColor;opacity:.5}
.mpt-step[data-state="active"] .mpt-step-mark i{opacity:1;background:var(--mpt-a2);box-shadow:8px 0 0 -1px var(--mpt-a2),-8px 0 0 -1px var(--mpt-a2);animation:mpt-spin 1s steps(4) infinite}
@keyframes mpt-spin{to{transform:rotate(360deg)}}
.mpt-build-foot{display:flex;justify-content:flex-end}
.mpt-ghost,.mpt-solid{display:inline-grid;place-items:center;height:38px;padding:0 16px;border-radius:11px;font-size:14px;font-weight:550;letter-spacing:-.005em;transition:background .2s,filter .2s,transform .2s}
.mpt-ghost{background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.mpt-ghost:hover{background:rgba(255,255,255,.13)}
.mpt-solid{color:var(--mpt-ink);background:linear-gradient(160deg,var(--mpt-a1),var(--mpt-a2) 55%,var(--mpt-a3));box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 6px 20px var(--mpt-glow)}
.mpt-solid:hover{filter:brightness(1.06)}
.mpt-ghost:active,.mpt-solid:active{transform:translateY(1px)}

.mpt-done{display:grid;grid-template-columns:1fr auto;gap:22px;align-items:center}
.mpt-done-copy{display:flex;flex-direction:column;gap:8px;min-width:0}
.mpt-done-kicker{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mpt-a2)}
.mpt-done-kicker .mpt-picon{width:12px;height:12px;fill:currentColor}
.mpt-done-title{font-size:26px;font-weight:650;letter-spacing:-.025em;line-height:1.1}
.mpt-done-prompt{font-size:13.5px;color:var(--mpt-mute);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mpt-done-actions{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.mpt-device{width:150px;padding:10px;border-radius:20px;background:linear-gradient(180deg,#17171b,#0f0f12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 16px 40px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:7px;transform:rotate(3deg)}
.mpt-device[data-kind="screen"]{width:210px;border-radius:14px;transform:rotate(-2deg)}
.mpt-device-top{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:600;color:#ececef;white-space:nowrap;overflow:hidden}
.mpt-device-top i{width:12px;height:12px;border-radius:4px;flex:none;background:linear-gradient(160deg,var(--mpt-a1),var(--mpt-a3))}
.mpt-device-hero{height:46px;border-radius:9px;background:linear-gradient(120deg,var(--mpt-a3),var(--mpt-a1) 60%,rgba(255,255,255,.8));opacity:.85}
.mpt-device-row{display:flex;align-items:center;gap:6px}
.mpt-device-row i{width:16px;height:16px;border-radius:5px;background:rgba(255,255,255,.12);flex:none}
.mpt-device-row span{height:6px;flex:1;border-radius:3px;background:linear-gradient(90deg,rgba(255,255,255,.08),rgba(255,255,255,.2),rgba(255,255,255,.08));background-size:200% 100%;animation:mpt-shim 1.8s linear infinite}
.mpt-device-row:nth-child(4) span{width:70%;flex:none}
@keyframes mpt-shim{to{background-position:-200% 0}}
.mpt-device-tabs{display:flex;justify-content:space-around;padding-top:6px;border-top:1px solid rgba(255,255,255,.08)}
.mpt-device-tabs i{width:10px;height:10px;border-radius:3px;background:rgba(255,255,255,.18)}
.mpt-device-tabs i:first-child{background:var(--mpt-a2)}

.mpt-cue{position:absolute;left:50%;bottom:26px;width:40px;height:40px;margin-left:-20px;border-radius:12px;display:grid;place-items:center;color:rgba(255,255,255,.7);transition:color .2s,background .2s}
.mpt-cue .mpt-picon{width:14px;height:14px;fill:currentColor;animation:mpt-bob 2s cubic-bezier(.45,0,.55,1) infinite}
.mpt-cue:hover{color:#fff;background:rgba(255,255,255,.06)}
@keyframes mpt-bob{50%{transform:translateY(5px)}}

.mpt-section{position:relative;z-index:1;padding:clamp(96px,16svh,170px) clamp(16px,4vw,40px)}
.mpt-inner{width:min(1140px,100%);margin:0 auto;container-type:inline-size}
.mpt-sec-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:18px;margin-bottom:clamp(44px,7svh,72px)}
.mpt-kicker{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 12px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#d8d8dd;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.mpt-kicker i{width:6px;height:6px;border-radius:1.5px;background:var(--mpt-a2);box-shadow:0 0 10px var(--mpt-a2)}
.mpt-h2{color:#fff;filter:drop-shadow(0 4px 20px rgba(0,0,0,.45))}
.mpt-sec-title{width:min(calc(var(--mpt-pxs) * .8 * var(--w)),100cqi)}
.mpt-lede{max-width:54ch;font-size:clamp(15px,1.25vw,17px);color:#c4c4cb;text-shadow:0 1px 12px rgba(0,0,0,.5)}

.mpt-glass{--mx:50%;--my:50%;position:relative;border-radius:22px;background:radial-gradient(360px circle at var(--mx) var(--my),rgba(255,255,255,.09),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.03));backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),inset 0 1px 0 rgba(255,255,255,.12),0 20px 50px rgba(0,0,0,.28);transform-style:preserve-3d;will-change:transform}
.mpt-features-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.mpt-feature{padding:26px 24px 28px;display:flex;flex-direction:column;gap:10px;min-height:220px}
.mpt-feature h3{font-size:18px;font-weight:600;letter-spacing:-.015em;margin-top:10px}
.mpt-feature p{font-size:14.5px;line-height:1.6;color:#b3b4bc}
.mpt-feature-num{position:absolute;top:22px;right:22px;font-size:12px;font-variant-numeric:tabular-nums;color:rgba(255,255,255,.32);letter-spacing:.06em}
.mpt-feature-icon{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(160deg,rgba(255,255,255,.16),rgba(255,255,255,.04));box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),inset 0 1px 0 rgba(255,255,255,.2)}
.mpt-feature-icon .mpt-picon{width:20px;height:20px;fill:#fff;transition:fill .3s,transform .5s cubic-bezier(.16,1,.3,1)}
.mpt-feature:hover .mpt-feature-icon .mpt-picon{fill:var(--mpt-a2);transform:scale(1.12)}

.mpt-cycle{position:relative;display:inline-grid;grid-template-columns:1fr 1fr;padding:4px;border-radius:13px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.mpt-cycle button{position:relative;z-index:1;height:34px;padding:0 16px;border-radius:9px;font-size:13.5px;font-weight:550;color:#a6a6ad;transition:color .3s}
.mpt-cycle button[aria-pressed="true"]{color:#fff}
.mpt-cycle em{font-style:normal;font-size:11.5px;color:var(--mpt-a2);margin-left:4px}
.mpt-cycle-pill{position:absolute;top:4px;left:4px;width:calc(50% - 4px);height:34px;border-radius:9px;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);transition:transform .5s cubic-bezier(.16,1,.3,1)}
.mpt-cycle[data-yearly="true"] .mpt-cycle-pill{transform:translateX(100%)}
.mpt-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}
.mpt-plan{padding:28px 26px;display:flex;flex-direction:column;gap:14px}
.mpt-plan[data-featured]{background:radial-gradient(360px circle at var(--mx) var(--my),rgba(255,255,255,.12),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.045));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),inset 0 1px 0 rgba(255,255,255,.2),0 0 0 1px var(--mpt-glow),0 30px 80px rgba(0,0,0,.35),0 0 60px -20px var(--mpt-glow)}
.mpt-plan-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mpt-plan h3{font-size:19px;font-weight:600;letter-spacing:-.015em}
.mpt-badge{font-size:11px;font-weight:650;letter-spacing:.04em;padding:4px 9px;border-radius:999px;color:var(--mpt-ink);background:linear-gradient(160deg,var(--mpt-a1),var(--mpt-a2))}
.mpt-plan-blurb{font-size:14px;color:#acadb5;min-height:2.6em}
.mpt-price{display:flex;align-items:flex-end;gap:10px;margin:6px 0 4px}
.mpt-price-num{font-size:clamp(40px,4.4vw,52px);font-weight:650;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
.mpt-price-per{display:flex;flex-direction:column;font-size:13px;color:#b8b8bf;line-height:1.3;padding-bottom:4px}
.mpt-price-per small{font-size:11.5px;color:var(--mpt-dim)}
.mpt-plan-cta{width:100%;height:44px}
.mpt-plan-list{display:grid;gap:10px;margin-top:8px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08)}
.mpt-plan-list li{display:flex;align-items:center;gap:10px;font-size:14px;color:#cfd0d6}
.mpt-plan-list .mpt-picon{width:12px;height:12px;fill:var(--mpt-a2);flex:none}

.mpt-foot{position:relative;z-index:1;padding:clamp(60px,10svh,110px) clamp(16px,4vw,40px) 36px;background:linear-gradient(180deg,transparent,rgba(5,5,6,.75) 40%)}
.mpt-foot-mark{display:flex;justify-content:center;color:rgba(255,255,255,.92);margin-bottom:clamp(40px,7svh,70px)}
.mpt-foot-mark .mpt-ptext{width:min(100%,980px)}
.mpt-foot-row{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-top:22px;border-top:1px solid rgba(255,255,255,.08);font-size:13.5px;color:var(--mpt-mute)}
.mpt-foot-brand{display:inline-flex;align-items:center;gap:10px}
.mpt-mark-sm{width:22px;height:22px}
.mpt-foot-links{display:flex;gap:20px}
.mpt-foot-links button{color:var(--mpt-mute);transition:color .2s}
.mpt-foot-links button:hover{color:#fff}

@media (max-width:980px){
.mpt-features-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.mpt-plans{grid-template-columns:minmax(0,1fr);max-width:520px;margin:0 auto}
}
@media (max-width:760px){
.mpt-links,.mpt-bar>.mpt-cta{display:none}
.mpt-burger{display:grid}
.mpt-bar{height:64px}
.mpt-sheet{display:grid;position:absolute;top:70px;left:14px;right:14px;grid-template-rows:0fr;transition:grid-template-rows .4s cubic-bezier(.16,1,.3,1);pointer-events:none}
.mpt-sheet[data-open="true"]{grid-template-rows:1fr;pointer-events:auto}
.mpt-sheet-inner{overflow:hidden;min-height:0}
.mpt-sheet-panel{display:grid;gap:4px;padding:12px;border-radius:18px;background:rgba(20,20,24,.92);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 20px 50px rgba(0,0,0,.5)}
.mpt-sheet .mpt-link{text-align:left;padding:12px;font-size:16px}
.mpt-cta-wide{width:100%;margin-top:6px}
.mpt-hero{padding-top:84px;gap:30px;--mpt-pxs:6px}
.mpt-composer{padding:18px 14px 14px 18px;border-radius:22px}
.mpt-tools{flex-direction:column;align-items:stretch;gap:14px;margin-top:16px}
.mpt-right{justify-content:flex-end}
.mpt-model-wrap{margin-right:auto}
.mpt-menu{left:0;right:auto;transform-origin:10% 100%}
.mpt-features-grid{grid-template-columns:minmax(0,1fr)}
.mpt-feature{min-height:0}
.mpt-done{grid-template-columns:1fr}
.mpt-device{justify-self:center}
.mpt-hint{display:none}
}
@media (max-width:420px){
.mpt-chip{height:30px;padding:0 9px 0 8px;font-size:12px}
.mpt-input,.mpt-ph{font-size:15px}
}

.mpt-root[data-motion="reduced"] *{animation:none;transition-duration:.01ms}
@media (prefers-reduced-motion:reduce){
.mpt-root *{animation:none;transition-duration:.01ms}
}
`
